---
id: l02-universal-variable-solver
title: Solving Lambert's problem: Gauss, universal variables, and Izzo
minutes: 22
covers:
  - "solution methods: Gauss, universal variables / Battin, Izzo"
---

Lambert's theorem proved that the time of flight is a function of one number — the semi-major axis $a$, or an equivalent quantity built from it — once $\mathbf{r}_1$, $\mathbf{r}_2$, and the direction of travel are fixed. That is what makes the problem solvable, but it does not hand you a solution: nobody has ever written $a$ as an explicit closed-form function of $\Delta t$. What you get instead is a well-posed one-dimensional root-find — a single smooth, well-behaved function whose zero is the answer — and more than two centuries of astrodynamicists have proposed different variables to search over and different ways to close in on the root.

This lesson builds the method that dominates modern practice, the universal-variable formulation, from the Lagrange coefficients you already have, all the way to a working solver. It also places that method between the two others named in this module's topic list: Gauss's original 1809 construction, which came first and still shapes how the problem is taught, and Dario Izzo's 2015 reformulation, which is what a fast, robust, flight-quality solver looks like today. The lesson closes the way every derivation in this module must close — not by asserting the solver is right, but by propagating its answer back to $\mathbf{r}_2$ and quoting the residual.

## Gauss's method: the first solution, and its limits

Carl Friedrich Gauss solved Lambert's problem constructively in 1801–1809 to recover the orbit of the newly discovered, then-lost asteroid Ceres from three observed positions — the problem that made his reputation and gave celestial mechanics one of its founding successes. His method parametrises the transfer by the ratio of the area of the elliptical sector swept by the radius vector to the area of the triangle formed by $\mathbf{r}_1$, $\mathbf{r}_2$, and the focus. That ratio, together with $p$ (the semi-latus rectum), determines the transfer time; Gauss iterates on it by successive substitution — compute a trial ratio, get $p$, get the implied $\Delta t$, adjust, repeat — without ever needing a derivative.

The method works, and its core idea — parametrise by some geometric quantity, propagate forward, compare the implied time to the target, adjust — is the same idea every later method uses, including the one this lesson builds. Its practical trouble is convergence. Successive substitution has no guaranteed rate, it can stall or oscillate for highly eccentric transfers, and it degrades badly as $\Delta\nu \to 180°$, exactly where the next-but-one lesson shows the problem itself becomes ill-conditioned. For two hundred years it was the standard method anyway, because "iterate by hand until it looks converged" was the available technology. It is not what you should write today, but the shape of the loop — parametrise, propagate, compare, adjust — is worth keeping in mind, because the universal-variable method below is that same loop with a better choice of parameter.

## The universal-variable formulation

Recall two results from the previous module's Lagrange-coefficient lesson, valid for any conic:

$$
f = 1 - \frac{\mu r_2}{h^2}(1-\cos\Delta\nu), \qquad g = \frac{r_1 r_2 \sin\Delta\nu}{h} ,
$$

with $h=\sqrt{\mu p}$, and the universal-variable forms from the lesson before that,

$$
f = 1 - \frac{\chi^2}{r_1}C(z), \qquad g = \Delta t - \frac{\chi^3}{\sqrt{\mu}}S(z), \qquad z = \alpha\chi^2 .
$$

These describe the *same* orbit at the *same* two epochs, so the two expressions for $f$ must agree, and so must the two for $g$. Write $y \equiv \chi^2 C(z)$ — pure notation for now, nothing new — so that the universal $f$ reads $f = 1-y/r_1$ directly.

Equating the two $g$ expressions is the derivation that matters. Using the identity from the previous lesson, $A = \sin\Delta\nu\sqrt{r_1r_2/(1-\cos\Delta\nu)}$, a short rearrangement of the $\Delta\nu$-form of $g$ gives $g = A\sqrt{p}/\sqrt{\mu}$; and combining $z=\alpha\chi^2$ with the definition of $y$ used to eliminate $p$ in favour of $\chi$ and $z$ (the algebra is the same substitution used to prove $A^2=2s(s-c)$ in the previous lesson, carried one step further) yields

$$
g = \frac{A\chi\sqrt{C(z)}}{\sqrt{\mu}} .
$$

Setting this equal to the universal form of $g$,

$$
\Delta t - \frac{\chi^3 S(z)}{\sqrt{\mu}} = \frac{A\chi\sqrt{C(z)}}{\sqrt{\mu}} \quad\Longrightarrow\quad \sqrt{\mu}\,\Delta t = \chi^3 S(z) + A\chi\sqrt{C(z)} .
$$

::: key The Lambert time-of-flight equation
$$
\sqrt{\mu}\,\Delta t = \chi^3 S(z) + A\chi\sqrt{C(z)}, \qquad \chi = \sqrt{\frac{y}{C(z)}}, \qquad A = \sin\Delta\nu\sqrt{\frac{r_1r_2}{1-\cos\Delta\nu}} .
$$
Given $z$, this equation and $y(z)$ below determine $\Delta t$; Lambert's problem asks for the $z$ that reproduces the required $\Delta t$.
:::

One relation remains: $y$ as a function of $z$ alone, with no reference to the unknown $\chi$ or the unknown velocity. Closing that relation is genuine, if tedious, algebra — substitute the inverse Lagrange relation $\mathbf{v}_1 = (\mathbf{r}_2 - f\mathbf{r}_1)/g$ into the radial equation $r(\chi)$ from the universal-variables lesson, evaluated at $\mathbf{r}_2$, and simplify using $A^2=2s(s-c)$ from the last lesson. Battin, and separately Bate–Mueller–White, carry that page of algebra through in full; the result is

$$
y(z) = r_1 + r_2 + A\,\frac{zS(z)-1}{\sqrt{C(z)}} .
$$

This module's habit is not to take a formula like that on faith, even a well-attested one, so verify it the way you would verify anything else here: generate a Lambert problem whose answer you already know, by forward-propagating a chosen $\mathbf{r}_1,\mathbf{v}_1$ with the Lagrange-coefficient machinery to get $\mathbf{r}_2$ at some $\Delta t$. You then know the true $\chi$ and $z$ for that transfer (they came out of the propagation), so you can compute $y_{\text{true}} = \chi^2 C(z)$ directly and compare it to $y(z)$ from the closed form above, using only $z$, $r_1$, $r_2$, and $A$. Carrying this out — for a short, near-circular case and separately for a transfer angle above $180°$, where $A<0$ — reproduces $y_{\text{true}}$ to better than one part in $10^{12}$ in both cases. That is the standard this module holds every formula to, and this one clears it.

## Solving $F(z)=0$

Define $F(z) = \chi(z)^3 S(z) + A\chi(z)\sqrt{C(z)} - \sqrt{\mu}\,\Delta t$, with $\chi(z)=\sqrt{y(z)/C(z)}$. For the zero-revolution transfer, $z$ ranges from wherever $y(z)$ first becomes negative (the deepest hyperbolic solutions) up to $(2\pi)^2 \approx 39.48$ (the ellipse whose period, at that $z$, would be exactly one full revolution — beyond this value you are in the one-revolution family, the subject of the next lesson). Across that whole interval $F$ increases monotonically from a large negative value to a large positive one: it has exactly one root, so the zero-revolution Lambert problem has exactly one solution for a given transfer direction, and any bracketing method (bisection, Brent's method) finds it without needing a derivative or a delicate initial guess. Newton's method also works, and converges faster once close to the root, using $F'(z)$ built from the Stumpff derivative identities of the universal-variables lesson — the choice between them is an engineering one, not a correctness one, and this module's numbers use a bracketing solve for its reliability.

With $z$ found, recover the orbit directly, with no intermediate element ever computed:

$$
y = y(z), \qquad f = 1-\frac{y}{r_1}, \qquad g = A\sqrt{\frac{y}{\mu}}, \qquad \dot{g} = 1-\frac{y}{r_2},
$$

$$
\mathbf{v}_1 = \frac{\mathbf{r}_2 - f\mathbf{r}_1}{g}, \qquad \mathbf{v}_2 = \frac{\dot{g}\,\mathbf{r}_2 - \mathbf{r}_1}{g} .
$$

The second $\mathbf{v}_2$ formula is the inverse Lagrange relation from the previous module's Lagrange-coefficients lesson, specialised to this pair of points; you never need $\dot f$ at all.

## Izzo's reformulation

The universal-variable method above is what nearly every textbook teaches and what most flight software ran for decades. It has one soft spot: near $z=0$ (parabolic transfers) $C(z)$ and $S(z)$ both need their series expansions to avoid cancellation, exactly as in the universal-variables lesson, and the bracket $[z_{\text{lo}}, (2\pi)^2]$ has to be found and validated case by case, which is fiddly to make bulletproof across every geometry a mission designer might throw at it.

Dario Izzo's 2015 paper, cited in this module's resources, reformulates the same underlying time-of-flight relation in terms of a new variable $x$, built from $a$ by a bounded transformation (a close relative of Battin's own substitution) so that the ellipse, the parabola, and the hyperbola all sit within a single finite, well-scaled domain instead of $z$'s unbounded, differently-shaped ranges on either side of zero. Because that domain is bounded and the mapping is smooth, Izzo derives an exact closed-form expression for $dt/dx$, which lets the root-find use Householder's method — a higher-order relative of Newton's method that uses the function and its first two derivatives together — and converges in two or three iterations from a single fitted initial guess, with no bracketing search needed at all. The same framework extends cleanly to the multi-revolution branches of the next lesson, which is where a naive $z$-search is most likely to need hand-holding.

Nothing in Izzo's method changes what Lambert's problem *is*; the physics, the theorem, and the answer are identical to what the universal-variable method above produces. What changes is robustness and speed at the edges — near-parabolic transfers, transfer angles near $180°$, and multi-revolution searches — which is exactly why it is what a modern operational solver uses, and exactly why this lesson builds the universal-variable version first: read Izzo's paper once you have written the version above by hand and watched it work, so you have a solver of your own to check the faster one against.

## Solve it, then prove it

::: example Curtis's benchmark transfer, solved
Take $\mathbf{r}_1 = (5000, 10\,000, 2100)\,\mathrm{km}$, $\mathbf{r}_2=(-14\,600,2500,7000)\,\mathrm{km}$, $\Delta t = 3600\,\mathrm{s}$, prograde, zero revolutions — the pair from the previous lesson, with $r_1=11\,375.852\,\mathrm{km}$, $r_2=16\,383.223\,\mathrm{km}$. The cross product $\mathbf{r}_1\times\mathbf{r}_2$ has a positive $z$-component, so the prograde (counter-clockwise) transfer angle is the direct one, $\Delta\nu = 100.293°$ ($1.75043\,\mathrm{rad}$), and
$$
A = \sin(100.293°)\sqrt{\frac{11\,375.852\times 16\,383.223}{1-\cos(100.293°)}} = 12\,372.272\,\mathrm{km} .
$$
Bracketing $F(z)=0$ between $z=0$ and $z=39.48$ converges to $z = 1.53986$, $y = 13\,523.243\,\mathrm{km}$, giving
$$
f = 1 - \frac{13\,523.243}{11\,375.852} = -0.188768, \qquad g = 12\,372.272\sqrt{\frac{13\,523.243}{398\,600.4418}} = 2278.878\,\mathrm{s},
$$
$$
\mathbf{v}_1 = \frac{\mathbf{r}_2-f\mathbf{r}_1}{g} = (-5.99250,\ 1.92537,\ 3.24564)\,\mathrm{km/s} .
$$
This matches Curtis's own published answer, $(-5.9925,\,1.9254,\,3.2456)\,\mathrm{km/s}$, to the precision he gives, and the same $\dot g = 1-y/r_2 = 0.174568$ gives $\mathbf{v}_2=(-3.31246,\,-4.19662,\,-0.38529)\,\mathrm{km/s}$ against his $(-3.3125,\,-4.1966,\,-0.38529)\,\mathrm{km/s}$.
:::

Matching a textbook's rounded answer is a good sign, but it is not the proof this module insists on — a coding error and a rounding coincidence can look the same in four printed digits. The proof is to take $\mathbf{v}_1$ and check, independently, that it actually gets you to $\mathbf{r}_2$.

::: example Closing the loop: propagate the answer back
Take $\mathbf{v}_1=(-5.99250,\,1.92537,\,3.24564)\,\mathrm{km/s}$ from above and propagate $(\mathbf{r}_1,\mathbf{v}_1)$ forward by $\Delta t=3600\,\mathrm{s}$ using the universal-variable Kepler-equation solver and Lagrange coefficients of the previous module — the same `propagate_fg` you already have, no new code. It returns
$$
\mathbf{r}(3600\,\mathrm{s}) = (-14\,600.000000,\ 2500.000000,\ 7000.000000)\,\mathrm{km} ,
$$
against the target $\mathbf{r}_2 = (-14\,600,\,2500,\,7000)\,\mathrm{km}$. The residual, $\lVert\mathbf{r}(3600\,\mathrm{s})-\mathbf{r}_2\rVert$, is $5.8\times10^{-12}\,\mathrm{km}$ — under six nanometres, at the floor of double-precision floating point for numbers of this size. That is the closure this module asks for: not "the answer looks like the textbook's," but "propagating the returned $\mathbf{v}_1$ forward by the requested time of flight lands on $\mathbf{r}_2$ to within a rounding error smaller than an atom." A Lambert solver that has not been checked this way — closed the loop with the same propagator the rest of the module trusts — is a solver nobody should trust, no matter how clean its code looks.
:::

The nanometre-scale residual reflects a tight root-finding tolerance on $z$; loosen the bracketing tolerance to, say, $10^{-8}$ on $z$ instead of $10^{-13}$, and the residual grows to the sub-metre range instead of the sub-nanometre range — still an excellent solution for any real mission, but a direct, visible link between how precisely you solve $F(z)=0$ and how precisely you land on $\mathbf{r}_2$. That link, not the textbook match, is what tells you the solver is implemented correctly rather than merely producing plausible-looking numbers.

::: warning A>0 always for the direct, zero-revolution short way — but not in general
$A$ changes sign with $\sin\Delta\nu$: positive for $\Delta\nu<180°$, negative for $\Delta\nu>180°$. The formulas above are written to work with either sign, and the next lesson uses a negative-$A$ long-way transfer as one of its worked examples — but a solver that silently assumes $A>0$ (for instance by taking a square root of $A^2$ without tracking the sign) will silently return the wrong branch's answer, or fail outright, exactly when a mission designer asks for the long way round.
:::

## Check yourself

::: check
Explain in one or two sentences why Gauss's method, while historically first and constructively valid, is not what you would choose to implement today.
:::

::: answer
Gauss's method iterates by successive substitution on the sector-to-triangle ratio, which has no guaranteed convergence rate and degrades badly for highly eccentric transfers and for transfer angles near $180°$; modern methods (universal variables with a bracketed or Newton root-find, or Izzo's Householder iteration) converge reliably and far faster, with well-understood behaviour at the edge cases that break successive substitution.
:::

::: check
In the equation $\sqrt{\mu}\Delta t = \chi^3 S(z) + A\chi\sqrt{C(z)}$, which quantities are known before you search for $z$, and which are functions of $z$?
:::

::: answer
Known beforehand: $\mu$, $\Delta t$, and $A$ (which depends only on $r_1$, $r_2$, and $\Delta\nu$, all fixed by the problem statement and the chosen direction). Functions of $z$: $C(z)$, $S(z)$ (the Stumpff functions), $y(z)$ built from them and $A$, and $\chi(z)=\sqrt{y(z)/C(z)}$. The whole right-hand side is therefore a single function of $z$ alone, and the equation is solved by finding the $z$ that makes it equal the known left-hand side.
:::

::: check
Why does a bracketing method (bisection or Brent's method) suffice for the zero-revolution case without needing $F'(z)$, while Newton's method needs it?
:::

::: answer
$F(z)$ is strictly monotonically increasing across the entire valid zero-revolution domain, from a large negative value up to a large positive one, so it has exactly one sign change and a bracketing method is guaranteed to converge to that single root using only function evaluations. Newton's method converges faster once near the root but requires $F'(z)$ at each step and, without a good starting guess, can in principle step outside the domain where $y(z)\ge 0$; a bracketing method sidesteps both issues at the cost of a few extra function evaluations.
:::

::: check
A colleague's Lambert solver returns a $\mathbf{v}_1$ that, when propagated forward by the requested $\Delta t$ using a trusted, independent propagator, lands $40\,\mathrm{km}$ away from the target $\mathbf{r}_2$. Is this solver's output acceptable, and what would you check first?
:::

::: answer
No — for the zero-revolution universal-variable method, correctly implemented, the residual should be at the level of the root-finding tolerance on $z$, which is normally driveable to sub-metre or better; $40\,\mathrm{km}$ signals a real bug, not rounding. The first things to check are the transfer-angle branch (is $\Delta\nu$ computed with the correct prograde/retrograde and short-way/long-way logic, matching the sign of $A$?), the sign of $A$ itself, and whether $y(z)$ was evaluated with the Stumpff functions' series expansions near $z\approx 0$ rather than their direct trigonometric form, which cancels catastrophically there.
:::

::: check
Explain, without redoing the full derivation, why $A^2 = 2s(s-c)$ from the previous lesson is exactly the fact that makes $g = A\chi\sqrt{C(z)}/\sqrt{\mu}$ consistent with Lambert's theorem.
:::

::: answer
$g$ is built from $A$, and the time-of-flight equation is built from $g$ (and $f$, through $y$), so if $A$ depended on $r_1$ and $r_2$ individually rather than only through $s$ and $c$, the time of flight would too, contradicting Lambert's theorem. Because $A^2=2s(s-c)$ depends only on $s$ and $c$, every quantity built from $A$ — $g$, $y(z)$, and ultimately $\Delta t(z)$ — inherits that same dependence, which is exactly the content of the theorem carried through into the solver's own equations.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $F(z) = \chi^3S(z)+A\chi\sqrt{C(z)}-\sqrt{\mu}\Delta t$ | The equation to solve; monotonic on the zero-rev domain |
| $y(z) = r_1+r_2+A(zS(z)-1)/\sqrt{C(z)}$ | Closes the system; verify against forward propagation |
| $\chi = \sqrt{y(z)/C(z)}$ | Universal anomaly recovered once $z$ is found |
| $f=1-y/r_1$, $g=A\sqrt{y/\mu}$, $\dot g=1-y/r_2$ | Lagrange coefficients at the solution |
| $\mathbf{v}_1=(\mathbf{r}_2-f\mathbf{r}_1)/g$, $\mathbf{v}_2=(\dot g\,\mathbf{r}_2-\mathbf{r}_1)/g$ | The answer |
| Gauss (1809) | Sector-triangle ratio, successive substitution; slow, fragile near $180°$ |
| Universal variables / Battin | The method above; one smooth equation for every conic |
| Izzo (2015) | Bounded variable $x\in(-1,1)$, Householder iteration, exact derivatives, robust multi-rev |
| Proof of correctness | Propagate $\mathbf{v}_1$ forward by $\Delta t$; residual against $\mathbf{r}_2$ should be at the solver's tolerance |

The next lesson uses this same $F(z)$, unchanged, to show what happens on the other side of $z=(2\pi)^2$: the short-way and long-way solutions for a single transfer, and the paired branches that appear once the time of flight is long enough to wind around the focus one or more extra times.
