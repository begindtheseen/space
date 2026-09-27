---
id: l05-region-of-attraction-estimation
title: Estimating the region of attraction
minutes: 19
covers:
  - 'Region of attraction estimation, including sum-of-squares approaches'
---

Imagine a valley with a lake at the bottom. Rain that falls anywhere inside the ring of surrounding ridges runs down into the lake. Rain that falls a little past a ridge line runs off into a different valley. The land that drains into the lake is its **[[basin|basin-word]]**, and the ridge line is its edge.

A stable equilibrium has a basin too. "Locally asymptotically stable" says there is *some* basin, but not how big it is — and the previous lessons have shown three times why that gap matters. A pitch trim with $\zeta = 0.39$ (a perfectly good damping ratio) whose basin ends $5.3^\circ$ away. A loop with eigenvalues $-0.15 \pm 0.989j$ that diverges once disturbed past an amplitude of two. An attitude law whose proof quietly stayed inside $V < 4K$. Closing that gap means producing a **region of attraction**: a set of starting states from which the closed loop is guaranteed to return to the equilibrium.

The exact region is rarely available. What is available, and what flight programs use, is a **[[certified|certificate-word]]** subset — a region you can *prove* lies inside the true one. The construction is one idea deep. Inside a sublevel set of a Lyapunov function where $\dot{V} < 0$, the state cannot escape, so everything in it converges. All the work is in choosing $V$ well, because a poor $V$ gives an answer that is true but uselessly small.

This lesson builds the construction, computes it for two systems whose true basin you already know (so you can measure how much the certificate gives away), and then explains the method that automates the search for $V$: **sum-of-squares programming**, which turns "this polynomial is never negative" into a problem a computer can solve.

## What the exact region looks like

The **region of attraction** of an asymptotically stable equilibrium $\mathbf{x}_e$ ("x sub e") is written $\mathcal{R}$ (a curly R):

$$
\mathcal{R} = \left\{\mathbf{x}_0 : \text{the solution from } \mathbf{x}_0 \text{ exists for all } t \ge 0 \text{ and } \mathbf{x}(t) \to \mathbf{x}_e\right\} .
$$

Read it as "the set of all starting points $\mathbf{x}_0$ whose motion lasts forever and ends at $\mathbf{x}_e$". It is open (no hard edge included), connected (one piece), and invariant (motions that start in it stay in it).

Its boundary — the ridge line — is built from other invariant sets: the incoming curves of nearby saddles, unstable limit cycles, and in higher dimensions objects too tangled to put in a requirements document. The phase-plane lesson found such a boundary twice by **[[bisection|bisection-word]]**. That works in two dimensions. In six it becomes hopeless.

So the practical goal is not $\mathcal{R}$ itself but a set $\Omega$ ("capital omega") with $\Omega \subseteq \mathcal{R}$ ("Omega is inside R") that you can certify, as large as you can make it.

## The sublevel-set construction

Here is the recipe. Let $V$ be positive definite on a region $D$ around the equilibrium, with $\dot{V}(\mathbf{x}) < 0$ for every $\mathbf{x} \ne \mathbf{x}_e$ in $D$. Take a sublevel set $\Omega_c = \{\mathbf{x} : V(\mathbf{x}) \le c\}$ — everything inside the contour $V = c$.

If $\Omega_c$ is bounded and lies inside $D$, then it lies inside $\mathcal{R}$. The argument is the one from the direct method. A motion that starts in $\Omega_c$ can never leave it, because leaving would mean $V$ rising through the contour $V = c$, and $\dot{V} < 0$ forbids that. Trapped in $\Omega_c$, with $V$ always falling, it converges to $\mathbf{x}_e$.

So everything comes down to finding the biggest safe $c$. The condition $\dot{V} < 0$ first fails where $\dot{V} = 0$, so the answer is

$$
c^* = \min_{\mathbf{x}\,\ne\,\mathbf{x}_e,\ \dot{V}(\mathbf{x})\,=\,0} V(\mathbf{x}) ,
$$

read "c star is the smallest value of $V$ anywhere on the surface where $\dot{V}$ is zero, apart from the equilibrium itself". Any $\Omega_c$ with $c < c^*$ is certified.

Picture it like blowing up a balloon inside a room. The balloon is the contour of $V$. Grow it outward from the equilibrium and **[[stop the instant it touches|touching-picture]]** the surface where $\dot{V}$ changes sign. Everything inside the balloon at that moment is certified.

::: key Certified region of attraction
Given $V$ positive definite with $\dot{V} < 0$ on a neighborhood of the equilibrium, put $c^* = \min\{V(\mathbf{x}) : \dot{V}(\mathbf{x}) = 0,\ \mathbf{x} \ne \mathbf{x}_e\}$. Every bounded sublevel set $\{V < c\}$ with $c \le c^*$ lies inside the true region of attraction. The estimate is a subset, never the whole region, and its size depends entirely on the choice of $V$.
:::

Where does $V$ come from? For a quadratic $V = \mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{z}$, with $\mathbf{z} = \mathbf{x} - \mathbf{x}_e$ the error from equilibrium, the standard choice of $\mathbf{P}$ comes from the Jacobian $\mathbf{A}$. Solve the **Lyapunov equation**

$$
\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{Q}
$$

for a positive definite $\mathbf{Q}$ that you choose. Split the dynamics into the linear part and the leftover nonlinear part, $\dot{\mathbf{z}} = \mathbf{A}\mathbf{z} + \mathbf{g}(\mathbf{z})$. Then

$$
\dot{V} = -\mathbf{z}^\mathsf{T}\mathbf{Q}\mathbf{z} + 2\mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{g}(\mathbf{z}) .
$$

The first term is negative, and wins near the origin. The second, built from the nonlinear leftovers $\mathbf{g}$, grows faster and eventually wins somewhere further out. That is where $\dot{V}$ turns positive.

$\mathbf{Q}$ is a free design choice, and it changes the *shape* of the ellipse. A different shape can grow further before it touches. Trying several $\mathbf{Q}$ is the cheapest way to improve an estimate.

::: example How much of the truth a quadratic certificate captures
Take the loop from the linearization lesson, $\ddot{x} + \mu(1 - x^2)\dot{x} + x = 0$ with $\mu = 0.3$ ("mu"), the reversed van der Pol equation. As a state model, $\dot{x}_1 = x_2$ and $\dot{x}_2 = -x_1 - \mu(1 - x_1^2)x_2$. Its true region of attraction is the inside of an unstable limit cycle, which crosses the $x_2 = 0$ axis at $x_1 = \pm2.00092$ (found by bisection).

**Step 1: the Jacobian.** At the origin, $\mathbf{A} = \begin{bmatrix}0 & 1\\ -1 & -0.3\end{bmatrix}$.

**Step 2: solve the Lyapunov equation by hand** with $\mathbf{Q} = \mathbf{I}$. Write $\mathbf{P} = \begin{bmatrix}p & q\\ q & r\end{bmatrix}$. Multiplying out $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{I}$ entry by entry gives three equations:

$$
-2q = -1, \qquad 2q - 0.6r = -1, \qquad p - 0.3q - r = 0 .
$$

The first gives $q = 0.5$. The second gives $0.6r = 2$, so $r = 10/3$. The third gives $p = 0.15 + 3.3333 = 3.48333$.

**Step 3: the nonlinear leftover.** Here $\mathbf{g} = (0,\ \mu x_1^2x_2)$, so

$$
\dot{V} = -x_1^2 - x_2^2 + 2\mu x_1^2 x_2\left(q x_1 + r x_2\right).
$$

**Step 4: find $c^*$.** Sweep $7200$ rays out from the origin. On each, bisect for the first radius where $\dot{V} = 0$, and record $V$ there. The smallest is $c^* = 6.77318$, first touched at $(0.9592, 0.9007)$. The certified ellipse $\mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{z} < 6.77318$ crosses the axes at $x_1 = \pm\sqrt{6.77318/3.48333} = \pm1.3944$ and $x_2 = \pm1.4255$.

**Step 5: compare with the truth.** The certificate reaches $1.394$ where the truth reaches $2.001$: **70 percent** of the true extent along that axis. As a check, $2001$ points spaced around the certified boundary were integrated for $150\,\mathrm{s}$. All $2001$ converged to the origin, as they must.

**Step 6: try other shapes.** Changing $\mathbf{Q}$ changes the answer:

| $\mathbf{Q}$ | $c^*$ | Axis crossing $x_1$ |
| --- | --- | --- |
| $\mathrm{diag}(1, 1)$ | $6.7732$ | $1.3944$ |
| $\mathrm{diag}(1, 0.2)$ | $3.3073$ | $1.2403$ |
| $\mathrm{diag}(1, 3)$ | $12.2677$ | $1.3415$ |
| $\mathrm{diag}(3, 1)$ | $12.0460$ | $1.3010$ |

All four are valid certificates. Their reach differs by 12 percent. None does better than about 70 percent, because the true basin is bounded by a limit cycle that is nothing like an ellipse, and an ellipse fitted inside it loses the corners. Doing better needs a $V$ that is not quadratic.
:::

::: example The certified gust margin for the pitch trim
Go back to the vehicle at elevator $\delta = 4.80^\circ$, whose true basin the phase-plane lesson measured. From rest, incidence $\alpha$ ("alpha", the angle of attack) recovers from $1.54^\circ$ to $15.36^\circ$ — that is, $-8.54^\circ$ to $+5.28^\circ$ about the trim at $10.080^\circ$. At trim, pitch-rate gusts from $-43.24\,^\circ\mathrm{/s}$ to $+15.92\,^\circ\mathrm{/s}$ are survivable.

**Shift to the trim.** Write $z_1 = \alpha - \alpha^*$ and $z_2 = \dot{\alpha}$, where $\alpha^*$ is the trim angle. Expanding the cubic moment about the trim gives the exact shifted dynamics

$$
\dot{z}_1 = z_2, \qquad
\dot{z}_2 = a_1 z_1 - 2 z_2 + a_m\left(18\alpha^* z_1^2 + 6 z_1^3\right),
$$

with $a_1 = a_m(-0.9 + 18\alpha^{*2}) = -6.7210\,\mathrm{s^{-2}}$. No approximation was made: the constant terms cancel because $\alpha^*$ is a trim. The Jacobian is $\begin{bmatrix}0 & 1\\ -6.7210 & -2\end{bmatrix}$. Near the trim the quadratic term $18\alpha^*z_1^2$ is bigger than the cubic, and it pushes one way only. That is why the true basin is lopsided, while any ellipse is symmetric.

**Solve and sweep**, as before, for several weightings $\mathbf{Q}$. The last two columns are where the ellipse crosses each axis, converted to degrees:

| $\mathbf{Q}$ | $c^*$ | Certified $\lvert\Delta\alpha\rvert$ | Certified $\lvert\Delta\dot{\alpha}\rvert$ |
| --- | --- | --- | --- |
| $\mathrm{diag}(1, 1)$ | $0.003806$ | $2.451^\circ$ | $6.596\,^\circ\mathrm{/s}$ |
| $\mathrm{diag}(20, 1)$ | $0.048648$ | $4.067^\circ$ | $12.676\,^\circ\mathrm{/s}$ |
| $\mathrm{diag}(60, 1)$ | $0.133132$ | $4.131^\circ$ | $13.270\,^\circ\mathrm{/s}$ |
| $\mathrm{diag}(120, 1)$ | $0.252634$ | $4.092^\circ$ | $13.265\,^\circ\mathrm{/s}$ |

**Read off the answer.** The best of these, $\mathbf{Q} = \mathrm{diag}(60,1)$, certifies $\pm4.13^\circ$ of incidence and $\pm13.27\,^\circ\mathrm{/s}$ of rate about the trim. The true limits on the dangerous side are $+5.28^\circ$ and $+15.92\,^\circ\mathrm{/s}$. So the certificate captures $4.13/5.28 = 0.78$ (78 percent) and $13.27/15.92 = 0.83$ (83 percent) — **[[inside the truth|pitch-picture]]**, as it must be. Integrating $2001$ points spaced around that certified ellipse for $40\,\mathrm{s}$ returns all $2001$ to the trim.

**Two lessons from the table.** First, the default $\mathbf{Q} = \mathbf{I}$ gives less than half the reach of a weighted one. The states are in radians and radians per second, and an unweighted $\mathbf{Q}$ makes an arbitrary claim about how an angle compares with a rate. That claim costs you. Second, past $\mathbf{Q} = \mathrm{diag}(60,1)$ the estimate stops improving. The family of quadratics is used up. The remaining 20 percent needs a better function, not a better weight.
:::

## Sum of squares: letting a solver choose $V$

Searching over quadratics by hand is weak. The general version searches over polynomials, and it works because of one clever rewrite.

Checking whether a polynomial $p(\mathbf{x})$ is never negative is hard in general. But checking whether it is a **sum of squares** — $p = \sum_i \sigma_i(\mathbf{x})^2$ for some polynomials $\sigma_i$ ("sigma sub i") — is much easier. A sum of squares can never be negative, and there is a mechanical test for being one:

$$
p(\mathbf{x}) = \mathbf{z}(\mathbf{x})^\mathsf{T}\mathbf{G}\,\mathbf{z}(\mathbf{x}),
\qquad \mathbf{G} = \mathbf{G}^\mathsf{T} \succeq 0 .
$$

Here $\mathbf{z}$ is a list of **monomials** — single power terms like $x_1^2$ or $x_1x_2$ — up to half the degree of $p$. $\mathbf{G}$ is a symmetric matrix called the Gram matrix, and $\mathbf{G} \succeq 0$, read "G is **[[positive semidefinite|psd-word]]**", means $\mathbf{v}^\mathsf{T}\mathbf{G}\mathbf{v} \ge 0$ for every vector $\mathbf{v}$.

Why does this work? Matching the coefficients of $p$ makes the entries of $\mathbf{G}$ linear in the unknowns. The condition "$\mathbf{G}$ positive semidefinite" is a well-behaved, convex constraint that fast solvers handle. That kind of problem is a **[[semidefinite program|sdp-word]]**. And once $\mathbf{G}$ is found, split it as $\mathbf{G} = \sum_i \lambda_i \mathbf{v}_i\mathbf{v}_i^\mathsf{T}$ using its eigenvalues $\lambda_i \ge 0$ and eigenvectors $\mathbf{v}_i$. Each eigenvector hands you one square.

Work one through. Take $p = x_1^4 + x_1^2x_2^2 + x_2^4$ and $\mathbf{z} = (x_1^2,\ x_1x_2,\ x_2^2)^\mathsf{T}$. Matching coefficients,

$$
\mathbf{G} = \begin{bmatrix} 1 & 0 & \lambda \\ 0 & 1 - 2\lambda & 0 \\ \lambda & 0 & 1\end{bmatrix} .
$$

The corners give $x_1^4$ and $x_2^4$. The $x_1^2x_2^2$ term can be made two ways: $2\lambda$ from the two corner entries (since $x_1^2 \cdot x_2^2$) and $1 - 2\lambda$ from the middle (since $x_1x_2 \cdot x_1x_2$). They add to $1$, as they must. So any $\lambda$ reproduces $p$. Only some make $\mathbf{G}$ positive semidefinite: the corner block needs $|\lambda| \le 1$, and the middle entry needs $\lambda \le 1/2$.

Choose $\lambda = 1/2$. Then $\mathbf{G}$ has eigenvalues $1.5$, $0.5$ and $0$, with eigenvectors $(1,0,1)/\sqrt{2}$, $(1,0,-1)/\sqrt{2}$ and $(0,1,0)$. Each gives a square:

$$
p = \tfrac{3}{4}\left(x_1^2 + x_2^2\right)^2 + \tfrac{1}{4}\left(x_1^2 - x_2^2\right)^2 .
$$

Check by expanding: $\tfrac{3}{4}(x_1^4 + 2x_1^2x_2^2 + x_2^4) + \tfrac{1}{4}(x_1^4 - 2x_1^2x_2^2 + x_2^4) = x_1^4 + x_1^2x_2^2 + x_2^4$. Evaluating both sides at random points agrees to ten decimals. That two-line certificate is exactly what a solver produces, at scale, for polynomials in many variables.

::: key Sum of squares
A polynomial $p$ is a sum of squares if $p(\mathbf{x}) = \mathbf{z}(\mathbf{x})^\mathsf{T}\mathbf{G}\mathbf{z}(\mathbf{x})$ with $\mathbf{G} \succeq 0$ and $\mathbf{z}$ the monomial vector — a semidefinite feasibility problem. Sum of squares implies non-negative; the converse is false, the standard counterexample being the **[[Motzkin polynomial|motzkin]]** $x_1^4x_2^2 + x_1^2x_2^4 - 3x_1^2x_2^2 + 1$, which is non-negative by the arithmetic–geometric mean inequality and is not a sum of squares. So the method is a sufficient test, which is what a certificate needs to be.
:::

### The region-of-attraction program

For polynomial dynamics $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$, the search is: find a polynomial $V$ and a helper polynomial $\sigma$, called a **multiplier**, such that

$$
V - \epsilon\,\mathbf{x}^\mathsf{T}\mathbf{x} \ \text{is SOS},
\qquad
-\dot{V} - \sigma(\mathbf{x})\left(c - V(\mathbf{x})\right) \ \text{is SOS},
\qquad
\sigma \ \text{is SOS},
$$

and make $c$ as large as possible. ("SOS" is short for sum of squares; $\epsilon$, "epsilon", is a small positive number.) Line by line:

- The first line makes $V$ positive definite: $V$ is at least $\epsilon\lVert\mathbf{x}\rVert^2$.
- The second line is the **[[S-procedure|s-procedure]]**. Inside the sublevel set, $c - V \ge 0$ and $\sigma \ge 0$, so the line forces $-\dot{V} \ge \sigma(c - V) \ge 0$ there. Outside, $c - V < 0$, the term $\sigma(c - V)$ is negative, and the line asks nothing useful. So it says "$\dot{V} \le 0$ *inside the set*" without demanding it everywhere. (In practice the second line also subtracts a small term like $\epsilon\,\mathbf{x}^\mathsf{T}\mathbf{x}$, to make the decrease strict.)
- The third line makes the multiplier non-negative, which the second line relies on.

There is one catch. $\sigma$ multiplies $V$, and $\sigma$ multiplies $c$, so the problem is not a single semidefinite program. It is solved by taking turns: fix $V$ and search for $\sigma$, raising $c$ by bisection until the program fails; then fix $\sigma$ and search for a better $V$; repeat. The result is a certified region bounded by a higher-degree surface, which can follow the true basin far more closely than an ellipse. The reversed van der Pol system is a standard test case for this method, and higher-degree $V$ close much of the gap the ellipse leaves.

::: note Tools
Sum-of-squares work needs a semidefinite solver, which this module does not assume you have installed. The quadratic computations above use nothing but a linear solve and a sweep. Tedrake's *Underactuated Robotics* course is the standard free treatment of the polynomial case, with working code. The regions it **[[certifies for robots and gliders|lqr-trees]]** are the same construction as the ellipse above, with $V$ of higher degree.
:::

::: warning
Scaling is not cosmetic here. The same system written in **[[radians and in degrees|units-scaling]]** gives a different $\mathbf{P}$, a different $c^*$ and — once you convert back — a different certified region, because $\mathbf{Q} = \mathbf{I}$ means something different in each. Scale the states to comparable sizes, or choose $\mathbf{Q}$ on purpose from the magnitudes you care about, before reporting a number.
:::

::: warning
Never report a Lyapunov estimate as "the region of attraction". It is an inner estimate, and the gap can be large: an ellipse inside a long, thin true basin may certify a small fraction of it. The correct sentence is "recovery is guaranteed from this set", with its shape stated. Simulation can then probe outside it to see how much margin is really there. The two methods answer different questions, and both belong in the same report.
:::

## Check yourself

::: check
For $\dot{x} = -x + x^3$ with $V = \tfrac{1}{2}x^2$, compute $c^*$ and the certified region. Compare with the true region of attraction.
:::

::: answer
Differentiate: $\dot{V} = x\dot{x} = -x^2 + x^4 = -x^2(1 - x^2)$. This is zero at $x = 0$ and at $x = \pm1$. Leaving out the equilibrium, the smallest $V$ on that set is $c^* = V(\pm1) = \tfrac{1}{2}$. The certified region is $\{V < 1/2\} = \{|x| < 1\}$.

The true region is also $|x| < 1$, because $x = \pm1$ are equilibria and nothing starting there moves. Here the estimate is **[[exact|one-d-picture]]**. That happens when the nearest obstruction is itself an equilibrium sitting on a level set of $V$. In two or more dimensions this lining-up is rare, and the estimate is strictly conservative.
:::

::: check
Explain why the certified set must be a *bounded* sublevel set, with an example of what goes wrong otherwise.
:::

::: answer
The argument is: the motion cannot leave $\Omega_c$, and inside it $V$ keeps falling, so it converges. If $\Omega_c$ is unbounded, the motion can stay inside while running off to infinity, with $V$ falling the whole way, and nothing converges.

The standard example is $V = x_1^2/(1 + x_1^2) + x_2^2$, whose level set $V = 1$ is the unbounded curve $x_2^2 = 1/(1 + x_1^2)$. In practice, check boundedness by confirming that the piece of $\{V \le c\}$ containing the equilibrium is closed and bounded. For a quadratic $V$ with $\mathbf{P} \succ 0$ ("P positive definite") every sublevel set is an ellipse or ellipsoid, and this is automatic.
:::

::: check
You have certified $\pm4.13^\circ$ of incidence for the pitch case and the requirement is $\pm5^\circ$. Give three things you could try, in order of effort.
:::

::: answer
1. **Re-weight $\mathbf{Q}$.** It is free, and the table shows it moved the answer from $2.45^\circ$ to $4.13^\circ$ — though it has now stopped improving.
2. **Enlarge the family of $V$.** A quartic $V$ found by sum-of-squares can follow the lopsided basin, which here reaches $-8.54^\circ$ on one side and only $+5.28^\circ$ on the other. A symmetric ellipse must fit inside the smaller side and wastes the rest.
3. **Change the plant or the controller.** Back the elevator off from $4.80^\circ$ so the trim moves away from the fold, or add rate feedback to increase damping. Both enlarge the *true* basin, not only the estimate.

Notice the order: the first two improve the certificate; the third improves the vehicle.
:::

::: check
Why does the sum-of-squares program need the multiplier $\sigma(\mathbf{x})$ at all? What would go wrong if you asked for $-\dot{V}$ to be SOS outright?
:::

::: answer
Requiring $-\dot{V}$ to be a sum of squares demands $\dot{V} \le 0$ *everywhere in the state space*. That is far stronger than needed and usually impossible. For the reversed van der Pol system it is impossible outright: on the unstable limit cycle a trajectory comes back to exactly where it started, so $V$ cannot have decreased on the way round, and no $V$ of any degree can have $\dot{V} < 0$ there.

The multiplier turns the demand into a conditional one. Since $\sigma \ge 0$ and $c - V \ge 0$ inside the sublevel set, requiring $-\dot{V} - \sigma(c - V) \ge 0$ forces $-\dot{V} \ge \sigma(c - V) \ge 0$ inside. Outside the set, $\sigma(c - V)$ is negative and the constraint says nothing useful. That is the S-procedure: trading an "only here" inequality for an "everywhere" one, at the price of one extra unknown.
:::

::: check
The quaternion attitude proof gave the region $\tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0) < 4K$ without any sweeping or optimizing. Why was that case so much easier?
:::

::: answer
Because $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$ exactly, with no nonlinear leftover at all. The gyroscopic term dropped out, and the spring term cancelled by construction. So there is no surface where $\dot{V}$ turns positive. The only limit on $c$ is that the sublevel set must leave out the other equilibrium at $q_0 = -1$, which fixes $c^* = 4K$ at once.

The sweeping in this lesson exists because a quadratic $V$ built from a Jacobian leaves a real leftover $\mathbf{g}(\mathbf{z})$ behind. A candidate built from the physics, instead of from the linearization, often avoids the problem entirely. That is the strongest practical argument for the energy-plus-potential recipe.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathcal{R}$ | True region of attraction; boundary built from saddle stable manifolds and unstable cycles |
| $\Omega_c = \{V \le c\}$ | Certified region when bounded and inside $\{\dot{V} < 0\}$ |
| $c^* = \min\{V : \dot{V} = 0,\ \mathbf{x} \ne \mathbf{x}_e\}$ | Largest safe level |
| $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{Q}$ | Quadratic candidate; $\mathbf{Q}$ sets the ellipse shape and the reach |
| Reversed van der Pol, $\mathbf{Q} = \mathbf{I}$ | $\mathbf{P} = \begin{bmatrix}3.4833 & 0.5\\ 0.5 & 3.3333\end{bmatrix}$, $c^* = 6.773$, reach $1.394$ against a true $2.001$ |
| Pitch trim, $\mathbf{Q} = \mathrm{diag}(60,1)$ | $c^* = 0.1331$; certifies $\pm4.13^\circ$ and $\pm13.27\,^\circ\mathrm{/s}$ against true $+5.28^\circ$, $+15.92\,^\circ\mathrm{/s}$ |
| $p = \mathbf{z}^\mathsf{T}\mathbf{G}\mathbf{z}$, $\mathbf{G} \succeq 0$ | Sum of squares as a semidefinite program |
| $x_1^4 + x_1^2x_2^2 + x_2^4$ | $= \tfrac{3}{4}(x_1^2 + x_2^2)^2 + \tfrac{1}{4}(x_1^2 - x_2^2)^2$ |
| Motzkin polynomial | Non-negative but not a sum of squares; SOS is sufficient, not necessary |
| $-\dot{V} - \sigma(c - V)$ SOS, $\sigma$ SOS | S-procedure form of "$\dot{V} \le 0$ inside $\{V \le c\}$"; solved by alternating |

A region of attraction answers "how far from the set point may I start?" It says nothing about a disturbance that keeps pushing — a thruster plume, an unmodeled torque, a gust field the vehicle flies through for a minute. The next lesson introduces the idea built for that question, input-to-state stability, which bounds the state by a fading term plus a function of the worst disturbance seen so far.

::: context basin-word Why "basin"
The word comes from geography. A river basin, or drainage basin, is all the land whose rainfall ends up in one river or lake. Its edge is a line of high ground called a divide or watershed. Engineers borrowed the picture: the "basin of attraction" is every starting state whose motion ends at one equilibrium, and its boundary is the divide between that equilibrium and whatever else the system can do — go to another equilibrium, circle forever, or run away.
:::

::: context certificate-word What makes a result "certified"
A certificate is evidence someone else can check without redoing your search. Here it is the pair ($V$, $c$): anyone can confirm that $V$ is positive, that $\dot{V}$ is negative everywhere inside $\{V \le c\}$, and that the set is bounded. Simulation cannot do this. A thousand simulated runs that all recover say nothing about run one thousand and one, while a Lyapunov certificate covers every starting point in the set at once. That is why reviewers of flight software value it.
:::

::: context bisection-word Bisection: halving the gap
To find where a result flips — "recovers" versus "departs" — start with one input that recovers and one that departs. Try the midpoint. Whichever outcome it gives, it replaces the endpoint with that same outcome, so the gap halves. Twenty halvings shrink the gap about a million times. It is reliable along one line of starting points, but covering a whole boundary in six dimensions needs so many lines that it is no longer practical.
:::

::: context touching-picture The balloon touching the wall
The red closed curve is the true boundary of the region of attraction of the reversed van der Pol system with $\mu = 0.3$ — its unstable limit cycle, crossing the horizontal axis at $\pm2.001$. The blue ellipse is the certified set $V < 6.773$ for $\mathbf{Q} = \mathbf{I}$, crossing that axis at $\pm1.394$. The dot marks where the growing ellipse first touches the surface $\dot{V} = 0$, at $(0.959, 0.901)$. It stops there, well inside the red curve.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="110" x2="310" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="2" x2="180" y2="218" stroke="#6c7a93" stroke-width="1"/>
  <path d="M280.0,110.5 L279.9,104.6 L279.4,99.1 L278.6,93.8 L277.5,88.9 L276.1,84.3 L274.4,79.9 L272.5,75.7 L270.3,71.7 L267.9,68.0 L265.2,64.3 L262.4,60.9 L259.3,57.5 L256.1,54.2 L252.6,51.0 L249.0,47.8 L245.2,44.7 L241.2,41.7 L237.0,38.6 L232.6,35.6 L228.0,32.6 L223.3,29.6 L218.4,26.7 L213.3,23.8 L208.0,20.9 L202.6,18.2 L197.0,15.6 L191.3,13.2 L185.4,11.0 L179.4,9.0 L173.3,7.4 L167.1,6.2 L160.8,5.5 L154.5,5.3 L148.3,5.8 L142.0,6.9 L135.9,8.8 L129.9,11.4 L124.1,14.8 L118.5,19.0 L113.2,23.9 L108.2,29.4 L103.5,35.5 L99.2,42.2 L95.4,49.1 L91.9,56.4 L88.9,63.7 L86.4,71.1 L84.3,78.5 L82.6,85.6 L81.3,92.6 L80.5,99.3 L80.0,105.7 L80.0,111.7 L80.2,117.5 L80.9,122.9 L81.8,128.0 L83.0,132.9 L84.5,137.4 L86.3,141.7 L88.3,145.8 L90.6,149.7 L93.1,153.4 L95.8,157.0 L98.7,160.4 L101.9,163.7 L105.2,167.0 L108.7,170.2 L112.4,173.3 L116.3,176.4 L120.4,179.5 L124.6,182.5 L129.1,185.5 L133.7,188.5 L138.5,191.5 L143.5,194.4 L148.7,197.3 L154.0,200.1 L159.5,202.8 L165.1,205.3 L170.9,207.7 L176.8,209.8 L182.9,211.6 L189.0,213.1 L195.2,214.1 L201.5,214.6 L207.8,214.6 L214.1,213.9 L220.3,212.5 L226.3,210.3 L232.3,207.4 L238.0,203.7 L243.5,199.3 L248.7,194.1 L253.6,188.4 L258.1,182.0 L262.2,175.3 L266.0,168.2 L269.2,160.9 L272.1,153.5 L274.5,146.1 L276.4,138.9 L277.9,131.8 L279.0,124.9 L279.7,118.3 L280.0,112.0 Z" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M229.8,167.9 L225.3,171.4 L220.4,174.4 L215.2,177.0 L209.8,179.1 L204.1,180.6 L198.2,181.6 L192.2,182.0 L186.1,181.9 L180.0,181.3 L173.9,180.1 L167.8,178.4 L161.8,176.1 L155.9,173.4 L150.2,170.1 L144.8,166.4 L139.6,162.3 L134.7,157.8 L130.2,152.9 L126.0,147.7 L122.3,142.2 L119.0,136.5 L116.1,130.5 L113.8,124.4 L111.9,118.2 L110.6,112.0 L109.8,105.7 L109.5,99.4 L109.8,93.3 L110.6,87.2 L111.9,81.3 L113.8,75.7 L116.1,70.3 L119.0,65.2 L122.3,60.5 L126.0,56.1 L130.2,52.1 L134.7,48.6 L139.6,45.6 L144.8,43.0 L150.2,40.9 L155.9,39.4 L161.8,38.4 L167.8,38.0 L173.9,38.1 L180.0,38.7 L186.1,39.9 L192.2,41.6 L198.2,43.9 L204.1,46.6 L209.8,49.9 L215.2,53.6 L220.4,57.7 L225.3,62.2 L229.8,67.1 L234.0,72.3 L237.7,77.8 L241.0,83.5 L243.9,89.5 L246.2,95.6 L248.1,101.8 L249.4,108.0 L250.2,114.3 L250.5,120.6 L250.2,126.7 L249.4,132.8 L248.1,138.7 L246.2,144.3 L243.9,149.7 L241.0,154.8 L237.7,159.5 L234.0,163.9 L229.8,167.9 Z" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="228.0" cy="65.0" r="4" fill="#1f2a44"/>
  <line x1="280" y1="106" x2="280" y2="114" stroke="#b4232c" stroke-width="2"/>
  <line x1="249.7" y1="106" x2="249.7" y2="114" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="12">
    <text x="286" y="126" fill="#b4232c">2.00</text>
    <text x="234" y="126" fill="#1d6fd1">1.39</text>
    <text x="236" y="60" fill="#1f2a44">first touch</text>
    <text x="8" y="20" fill="#b4232c">true boundary</text>
    <text x="8" y="36" fill="#1d6fd1">certified ellipse</text>
    <text x="312" y="106" fill="#1f2a44">x₁</text>
    <text x="185" y="14" fill="#1f2a44">x₂</text>
  </g>
</svg>
```
:::

::: context pitch-picture The certificate inside the real basin
Axes are incidence away from trim, $\Delta\alpha$, from $-12^\circ$ to $+10^\circ$, and pitch rate from $-55$ to $+25\,^\circ\mathrm{/s}$. The red curves are the true basin boundary: the incoming curves of the saddle at $+5.28^\circ$ from trim, computed by running time backward from the saddle. The blue ellipse is the certificate for $\mathbf{Q} = \mathrm{diag}(60, 1)$. The true basin is lopsided — it reaches $-8.54^\circ$ on the left — while the ellipse is centered, so the tight right-hand side sets its size.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="74.4" x2="340" y2="74.4" stroke="#6c7a93" stroke-width="1"/>
  <line x1="203.6" y1="15" x2="203.6" y2="205" stroke="#6c7a93" stroke-width="1"/>
  <path d="M275.7,74.4 L273.2,72.7 L270.7,71.0 L268.2,69.3 L265.6,67.7 L263.0,66.0 L260.4,64.4 L257.8,62.8 L255.1,61.1 L252.3,59.5 L249.6,57.9 L246.9,56.4 L244.1,54.8 L241.3,53.3 L238.5,51.8 L235.8,50.4 L233.0,49.0 L230.0,47.6 L227.2,46.2 L224.2,44.8 L221.4,43.6 L218.5,42.3 L215.5,41.1 L212.4,39.8 L209.6,38.7 L206.7,37.7 L203.7,36.6 L200.6,35.5 L197.4,34.5 L194.2,33.5 L190.9,32.6 L188.0,31.8 L185.0,31.1 L182.0,30.3 L178.9,29.7 L175.8,29.1 L172.7,28.5 L169.5,28.1 L166.3,27.6 L163.1,27.3 L159.8,27.0 L156.6,26.8 L153.3,26.7 L150.0,26.7 L146.7,26.7 L143.4,26.9 L140.2,27.2 L136.9,27.6 L133.7,28.1 L130.6,28.7 L127.4,29.4 L124.4,30.2 L121.3,31.2 L118.4,32.3 L115.5,33.5 L112.8,34.8 L110.1,36.2 L107.5,37.8 L104.7,39.8 L102.0,42.0 L99.5,44.4 L97.2,46.9 L95.1,49.6 L93.2,52.4 L91.5,55.4 L90.1,58.6 L89.0,61.9 L88.2,64.8 L87.7,67.9 L87.3,71.0 L87.2,74.2 L87.3,77.5 L87.6,80.8 L88.2,84.2 L89.0,87.7 L89.9,90.7 L90.9,93.6 L92.1,96.6 L93.4,99.6 L95.0,102.7 L96.7,105.7 L98.6,108.8 L100.6,111.8 L102.4,114.3 L104.3,116.7 L106.3,119.2 L108.4,121.6 L110.6,124.0 L113.0,126.4 L115.4,128.8 L118.0,131.1 L120.6,133.5 L123.4,135.8 L126.3,138.1 L129.3,140.4 L132.3,142.6 L135.5,144.8 L138.8,147.0 L142.2,149.1 L144.8,150.7 L147.4,152.3 L150.2,153.8 L152.9,155.4 L155.7,156.9 L158.6,158.3 L161.5,159.8 L164.5,161.3 L167.5,162.7 L170.6,164.1 L173.7,165.5 L176.9,166.8 L180.1,168.2 L183.3,169.5 L186.6,170.8 L190.0,172.1 L193.3,173.4 L196.8,174.6 L200.3,175.9 L203.8,177.1 L207.3,178.3 L210.9,179.6 L214.6,180.8 L218.3,182.0 L222.0,183.2 L225.8,184.4 L229.6,185.6 L233.4,186.8 L237.3,188.0 L241.3,189.3 L245.2,190.5 L249.3,191.8 L253.3,193.1 L257.4,194.4 L261.6,195.8 L265.8,197.1 L270.1,198.6 L272.9,199.6 L275.8,200.5 L278.7,201.6 L281.6,202.6 L284.6,203.7 L287.6,204.8" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M275.7,74.4 L278.1,76.1 L280.6,77.8 L283.0,79.6 L285.6,81.4 L288.0,83.2 L290.4,85.0 L293.0,86.9 L295.4,88.8 L297.9,90.7 L300.3,92.6 L302.7,94.5 L305.2,96.5 L307.5,98.5 L310.1,100.6 L312.6,102.7 L315.0,104.7 L317.5,106.9 L319.8,108.8 L322.3,111.0 L324.9,113.3 L327.2,115.3 L329.6,117.5 L332.1,119.9 L334.8,122.3 L337.1,124.4 L339.4,126.7" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M244.3,112.4 L238.4,112.3 L232.1,111.9 L225.5,111.1 L218.6,109.8 L211.6,108.2 L204.5,106.2 L197.4,103.8 L190.3,101.1 L183.4,98.1 L176.8,94.9 L170.4,91.4 L164.4,87.8 L158.8,84.0 L153.7,80.1 L149.1,76.1 L145.2,72.2 L141.9,68.2 L139.2,64.3 L137.3,60.5 L136.1,56.9 L135.6,53.5 L135.9,50.3 L137.0,47.3 L138.7,44.7 L141.2,42.4 L144.3,40.4 L148.1,38.8 L152.5,37.6 L157.5,36.8 L163.0,36.4 L168.9,36.4 L175.2,36.8 L181.8,37.7 L188.7,38.9 L195.7,40.6 L202.8,42.6 L209.9,45.0 L216.9,47.6 L223.8,50.6 L230.5,53.8 L236.9,57.3 L242.9,61.0 L248.5,64.7 L253.6,68.6 L258.1,72.6 L262.1,76.6 L265.4,80.5 L268.0,84.4 L270.0,88.2 L271.2,91.8 L271.6,95.3 L271.3,98.5 L270.3,101.4 L268.6,104.1 L266.1,106.4 L262.9,108.4 L259.1,110.0 L254.7,111.2 L249.8,112.0 L244.3,112.4 Z" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="203.6" cy="74.4" r="3.5" fill="#1f2a44"/>
  <circle cx="275.7" cy="74.4" r="3.5" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="276" y="66">saddle +5.28°</text>
    <text x="48" y="70">−8.54°</text>
    <text x="208" y="30">+15.9°/s</text>
    <text x="208" y="190">−43.2°/s</text>
    <text x="150" y="212">Δα (deg) across, rate (deg/s) up</text>
    <text x="210" y="88" fill="#1d6fd1">±4.13°</text>
  </g>
</svg>
```
:::

::: context psd-word Positive semidefinite, in plain words
A symmetric matrix $\mathbf{G}$ is positive semidefinite when the number $\mathbf{v}^\mathsf{T}\mathbf{G}\mathbf{v}$ is never negative, whatever vector $\mathbf{v}$ you try. An equivalent test: all its eigenvalues are zero or positive. "Positive definite" is the strict version — never zero except for $\mathbf{v} = \mathbf{0}$, all eigenvalues positive. The symbols $\succeq 0$ and $\succ 0$ are the matrix versions of $\ge 0$ and $> 0$.
:::

::: context sdp-word What a semidefinite program is
A linear program chooses numbers to maximize something subject to straight-line constraints. A semidefinite program does the same, except that some constraints say "this symmetric matrix, whose entries depend linearly on the unknowns, must be positive semidefinite". Such problems are convex — no false local optima to get stuck in — and interior-point solvers, developed in the 1980s and 1990s, solve them reliably. That reliability is what makes sum-of-squares a practical tool rather than a curiosity.
:::

::: context motzkin A non-negative polynomial that is not a sum of squares
David Hilbert proved in 1888 that some non-negative polynomials cannot be written as sums of squares, but he gave no explicit example. Theodore Motzkin published the first one in 1967. Why is it non-negative? The arithmetic–geometric mean inequality says the average of three non-negative numbers is at least the cube root of their product. Apply it to $x_1^4x_2^2$, $x_1^2x_2^4$ and $1$: their average is at least $\sqrt[3]{x_1^6x_2^6} = x_1^2x_2^2$. Multiply by $3$ and rearrange, and the Motzkin polynomial is $\ge 0$.
:::

::: context s-procedure The helper that switches a condition on and off
Think of $\sigma(c - V)$ as a switch. Inside the set, it is a non-negative amount that $-\dot{V}$ must beat, so $\dot{V}$ is forced to be non-positive there. Outside, it turns negative and hands $-\dot{V}$ free slack, so the condition there is easy to meet. The solver gets to choose $\sigma$, which means it chooses how strongly to enforce the condition near the edge. The same trick, in its quadratic form, appears throughout robust control in linear matrix inequality problems.
:::

::: context lqr-trees Regions of attraction on real machines
In Russ Tedrake's lab at MIT, sum-of-squares regions of attraction were used to build "LQR-trees": a library of linear controllers, each with a certified funnel around its trajectory, stitched together so that every funnel empties into the next. The same ideas were applied to a fixed-wing glider landing on a perch. Each funnel is exactly the construction of this lesson — a sublevel set of $V$ inside which $\dot{V}$ is negative — computed along a moving trajectory.
:::

::: context units-scaling Why the units change the ellipse
Suppose incidence is written in degrees instead of radians. The same physical angle becomes a number about $57.3$ times larger. With $\mathbf{Q} = \mathbf{I}$, the Lyapunov equation now weights one degree of angle the same as one radian per second of rate — a very different trade from one radian against one radian per second. The solver returns a different $\mathbf{P}$, so a different ellipse shape, so a different certified region. Neither is wrong; each answers a differently posed question, which is why the weighting must be chosen on purpose.
:::

::: context one-d-picture The one-dimensional case, drawn
Blue is $V = \tfrac{1}{2}x^2$, the bowl. Red is $\dot{V} = -x^2(1 - x^2)$: below zero between $-1$ and $1$, above zero outside. The level $V = \tfrac{1}{2}$ (dashed) reaches exactly $x = \pm1$, where $\dot{V}$ returns to zero and the extra equilibria sit. The certified interval (shaded) and the true region of attraction coincide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="70" y="20" width="220" height="165" fill="#8fb8f0" fill-opacity="0.25"/>
  <line x1="15" y1="130" x2="345" y2="130" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="15" x2="180" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <line x1="20" y1="80" x2="340" y2="80" stroke="#1d6fd1" stroke-width="1" stroke-dasharray="5 4"/>
  <path d="M26.0,32.0 L37.0,45.5 L48.0,58.0 L59.0,69.5 L70.0,80.0 L81.0,89.5 L92.0,98.0 L103.0,105.5 L114.0,112.0 L125.0,117.5 L136.0,122.0 L147.0,125.5 L158.0,128.0 L169.0,129.5 L180.0,130.0 L191.0,129.5 L202.0,128.0 L213.0,125.5 L224.0,122.0 L235.0,117.5 L246.0,112.0 L257.0,105.5 L268.0,98.0 L279.0,89.5 L290.0,80.0 L301.0,69.5 L312.0,58.0 L323.0,45.5 L334.0,32.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M42.5,42.1 L48.0,66.6 L53.5,87.3 L59.0,104.6 L64.5,118.7 L70.0,130.0 L75.5,138.8 L81.0,145.4 L86.5,150.0 L92.0,153.0 L97.5,154.6 L103.0,155.0 L108.5,154.4 L114.0,153.0 L119.5,151.1 L125.0,148.8 L130.5,146.1 L136.0,143.4 L141.5,140.7 L147.0,138.2 L152.5,135.9 L158.0,133.8 L163.5,132.2 L169.0,131.0 L174.5,130.2 L180.0,130.0 L185.5,130.2 L191.0,131.0 L196.5,132.2 L202.0,133.8 L207.5,135.9 L213.0,138.2 L218.5,140.7 L224.0,143.4 L229.5,146.1 L235.0,148.8 L240.5,151.1 L246.0,153.0 L251.5,154.4 L257.0,155.0 L262.5,154.6 L268.0,153.0 L273.5,150.0 L279.0,145.4 L284.5,138.8 L290.0,130.0 L295.5,118.7 L301.0,104.6 L306.5,87.3 L312.0,66.6 L317.5,42.1" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="70" cy="130" r="4" fill="#1f2a44"/><circle cx="290" cy="130" r="4" fill="#1f2a44"/>
  <g font-size="12" fill="#1f2a44">
    <text x="70" y="148" text-anchor="middle">−1</text><text x="290" y="148" text-anchor="middle">1</text>
    <text x="335" y="76" text-anchor="end" fill="#1d6fd1">V = ½</text>
    <text x="100" y="175" fill="#b4232c">V̇ &lt; 0 inside</text>
    <text x="92" y="96" fill="#1d6fd1">V</text>
    <text x="340" y="145" text-anchor="end">x</text>
  </g>
</svg>
```
:::
