---
id: l06-differential-correction
title: Targeting and differential correction
minutes: 20
covers:
  - targeting and differential correction
---

Shoot a basketball free throw and miss short and to the left. You do not throw away everything you know and start over. You keep the same throw and adjust it: a little harder, a little to the right. How much to adjust comes from your feel for how the ball responds. After two or three tries you are swishing it.

Targeting a spacecraft works the same way. Every Lambert solve in this module assumed pure two-body motion: a point-mass planet, no air, no bulge, an instant burn. Real spacecraft get none of that exactly. Earth bulges at the equator, low orbits feel air drag, and real burns take time and are never perfect. Fly Lambert's two-body $\mathbf{v}_1$ through the *real* forces and you will not land on $\mathbf{r}_2$. You will be close, because two-body gravity is usually the biggest force by far. But "close" is not a targeting requirement.

**Differential correction** closes that gap. It does not try to re-derive Lambert for every possible force — there is no formula for that. Instead it treats the miss as the output of a machine: velocity in, arrival position out. Then it uses Newton's method, with the state transition matrix from the last lesson as the feel for how the machine responds. This lesson builds the loop, runs it against a real force, and shows both how fast it converges from a good start and how it fails from a bad one.

## The correction as a Newton step

### Newton's method in one line

Recall **[[Newton's method|newton-tangent]]** for solving $F(x) = 0$ with one unknown. At your current guess, replace the curve by its tangent line, and jump to where the tangent line crosses zero:

$$
x^{(k+1)} = x^{(k)} - \frac{F(x^{(k)})}{F'(x^{(k)})} .
$$

The superscript $(k)$ is a counter, "guess number $k$", not a power. Repeat until $F$ is as close to zero as you need.

### The vector version

Now the unknown is the departure velocity, three numbers. Think of the arrival position as a function of it, with everything else held fixed: $\mathbf{r}_f(\mathbf{v}_1)$. You get it by flying $(\mathbf{r}_1, \mathbf{v}_1)$ forward for the fixed flight time $\Delta t$ under whatever forces the real spacecraft feels.

Lambert's two-body $\mathbf{v}_1$ is a good first guess, $\mathbf{v}_1^{(0)}$. But in general $\mathbf{r}_f(\mathbf{v}_1^{(0)}) \ne \mathbf{r}_2$. We want the $\mathbf{v}_1$ that makes $\mathbf{r}_f(\mathbf{v}_1)-\mathbf{r}_2=\mathbf{0}$.

Replace the machine by its straight-line (first-order) version around the current guess:

$$
\mathbf{r}_2 - \mathbf{r}_f(\mathbf{v}_1^{(k)}) \approx \left.\frac{\partial\mathbf{r}_f}{\partial\mathbf{v}_1}\right|_{\mathbf{v}_1^{(k)}} \delta\mathbf{v}_1^{(k)} = \boldsymbol{\Phi}_{rv}\,\delta\mathbf{v}_1^{(k)} .
$$

In words: the miss we want to remove is about equal to the sensitivity times the velocity change. The sensitivity $\partial\mathbf{r}_f/\partial\mathbf{v}_1$ is exactly the block from the last lesson: $\boldsymbol{\Phi}_{rv}$, how the arrival position responds to the departure velocity, computed for the actual arc under the actual forces.

Solve for the change and apply it:

$$
\delta\mathbf{v}_1^{(k)} = \boldsymbol{\Phi}_{rv}^{-1}\big(\mathbf{r}_2 - \mathbf{r}_f(\mathbf{v}_1^{(k)})\big), \qquad \mathbf{v}_1^{(k+1)} = \mathbf{v}_1^{(k)} + \delta\mathbf{v}_1^{(k)} .
$$

The inverse $\boldsymbol{\Phi}_{rv}^{-1}$ plays the role of dividing by $F'$. In code you do not form the inverse; you solve the $3\times3$ linear system $\boldsymbol{\Phi}_{rv}\,\delta\mathbf{v} = \delta\mathbf{r}_f$.

::: key Differential correction
$$
\delta\mathbf{v}_0 = \boldsymbol{\Phi}_{rv}^{-1}\,\delta\mathbf{r}_f , \qquad \delta\mathbf{r}_f = \mathbf{r}_{\text{target}} - \mathbf{r}_{\text{achieved}} .
$$
Here $\boldsymbol{\Phi}_{rv}$ is the $3\times3$ block of $\boldsymbol{\Phi}(t_f,t_0)$ that maps initial velocity to final position. This is one Newton step on a **[[shooting problem|shooting-name]]**: propagate, measure the miss, invert $\boldsymbol{\Phi}_{rv}$ for the actual arc (under the real dynamics) against the miss, apply the correction, repeat.
:::

The whole loop, step by step:

1. Fly the state *and* $\boldsymbol{\Phi}$ together from $(\mathbf{r}_1, \mathbf{v}_1^{(k)})$ for time $\Delta t$ — the same $42$-number integration as the last lesson, but under the real forces.
2. Measure the miss $\delta\mathbf{r}_f = \mathbf{r}_2 - \mathbf{r}_f$.
3. If the miss is small enough, stop.
4. Solve $\boldsymbol{\Phi}_{rv}\,\delta\mathbf{v} = \delta\mathbf{r}_f$, add $\delta\mathbf{v}$ to the velocity, and go back to step 1.

Because this really is Newton's method on a smooth map, it behaves like Newton's method. Once the guess is close enough that the straight-line picture is trustworthy, it converges **[[quadratically|quadratic-digits]]**: roughly, the number of correct digits doubles each step. When the guess is far away, there is no such promise, and it can go badly wrong.

## A real force Lambert ignores: Earth's bulge

Earth is not a perfect ball. It spins, and the spin has squashed it slightly: about $6378\,\mathrm{km}$ from center to equator but only about $6357\,\mathrm{km}$ from center to pole. The extra ring of mass around the equator tugs on satellites. The biggest part of that tug is called the **[[$J_2$ term|j2-name]]**, and its acceleration is

$$
\mathbf{a}_{J_2} = -\frac{3}{2}J_2\frac{\mu R_\oplus^2}{r^4}\left[\Big(1-5\frac{z^2}{r^2}\Big)\frac{x}{r},\ \Big(1-5\frac{z^2}{r^2}\Big)\frac{y}{r},\ \Big(3-5\frac{z^2}{r^2}\Big)\frac{z}{r}\right], \qquad J_2 = 1.08263\times10^{-3},\ R_\oplus = 6378.137\,\mathrm{km} .
$$

$R_\oplus$ ("R earth") is Earth's equatorial radius, and $z$ is height above the equatorial plane. How big is it? At the space station's position used below, $\lVert\mathbf{a}_{J_2}\rVert = 0.0146\,\mathrm{m/s^2}$, while ordinary gravity there is $8.65\,\mathrm{m/s^2}$. The bulge is about $1/590$ of gravity — small, but acting for hours.

### Checking the formula before trusting it

$J_2$ is a **[[conservative|conservative-force]]** force: it comes from a potential energy, so total energy is conserved. Per kilogram, that energy is

$$
E = \frac{v^2}{2} - \frac{\mu}{r} + \frac{\mu J_2 R_\oplus^2}{2r^3}\left(\frac{3z^2}{r^2}-1\right) .
$$

Fly the space-station state for three hours under $\mathbf{a} = -\mu\mathbf{r}/r^3+\mathbf{a}_{J_2}$ and compute $E$ at the start and the end. They agree to better than one part in $10^{13}$. A sign slip or a wrong exponent in $\mathbf{a}_{J_2}$ would break that immediately. That is the check to run before the formula is trusted for anything else.

### The Jacobian must include the bulge too

Here is the step that is easy to skip. With $J_2$ in the dynamics, the Jacobian's lower-left block is no longer $\mathbf{G}$ alone. It is

$$
\frac{\partial\mathbf{a}}{\partial\mathbf{r}} = \mathbf{G} + \frac{\partial\mathbf{a}_{J_2}}{\partial\mathbf{r}} .
$$

You can differentiate $\mathbf{a}_{J_2}$ by hand, or estimate its $3\times3$ gradient by central differences: nudge each of $x$, $y$, $z$ by about a metre each way and difference the two accelerations. (Here the step-size trap is harmless: $\mathbf{a}_{J_2}$ is a smooth formula, not a whole trajectory.) Leave the extra term out and $\boldsymbol{\Phi}$ describes the wrong dynamics. You will see what that costs below.

::: example The miss a two-body Lambert leaves behind
**Set-up.** Start at

$$
\mathbf{r}_1=(-2267.240,\ -3989.573,\ 5001.268)\,\mathrm{km} .
$$

The mission wants to be at

$$
\mathbf{r}_2 = (-3759.757,\ -1907.159,\ 5318.821)\,\mathrm{km}
$$

exactly $\Delta t=10\,800\,\mathrm{s}$ ($3\,\mathrm{h}$) later. This $\mathbf{r}_2$ was built on purpose: it is exactly where the two-body orbit from $\mathbf{r}_1$ with $\mathbf{v}_0=(5.0098,\ -5.4258,\ -2.0540)\,\mathrm{km/s}$ arrives after three hours. So a two-body Lambert solve for this $\mathbf{r}_1$, $\mathbf{r}_2$, $\Delta t$ returns exactly $\mathbf{v}_1^{(0)}=\mathbf{v}_0$.

**Fly it for real.** Propagate the same $(\mathbf{r}_1,\mathbf{v}_1^{(0)})$ for the same $10\,800\,\mathrm{s}$, but with $J_2$ switched on. The spacecraft misses $\mathbf{r}_2$ by

$$
\lVert\delta\mathbf{r}_f\rVert = 67\,342\,\mathrm{m} \approx 67.3\,\mathrm{km} .
$$

**Does that make sense?** A crude check: a steady $0.0146\,\mathrm{m/s^2}$ acting for $10\,800\,\mathrm{s}$ would move something by $\tfrac12 a t^2 \approx \tfrac12 \times 0.0146 \times 10\,800^2 \approx 850\,\mathrm{km}$. The real miss is much smaller, because the bulge's pull changes direction around the orbit and mostly cancels itself. Tens of kilometres from a force this small over two orbits is reasonable.

That miss comes purely from the bulge Lambert never knew about. For a rendezvous or a precision flyby it is enormous — and it is the reason differential correction exists. The two-body Lambert answer is an excellent *starting point*, not a final answer.
:::

::: example Closing the loop, one iteration at a time
**Set-up.** Start from $\mathbf{v}_1^{(0)}=\mathbf{v}_0$. Each iteration flies the state and $\boldsymbol{\Phi}$ together under the $J_2$ dynamics (with the $J_2$ term in the Jacobian) for the full $10\,800\,\mathrm{s}$, measures the miss against $\mathbf{r}_2$, and applies $\delta\mathbf{v}_1 = \boldsymbol{\Phi}_{rv}^{-1}\delta\mathbf{r}_f$.

| Iteration | Miss $\lVert\delta\mathbf{r}_f\rVert$ |
| --- | --- |
| 0 | $67\,342\,\mathrm{m}$ |
| 1 | $321.9\,\mathrm{m}$ |
| 2 | $1.89\,\mathrm{m}$ |
| 3 | $4\times10^{-7}\,\mathrm{m}$ |

**Reading it.** Three corrections take the miss from tens of kilometres to under a micrometre, which is the integrator's own accuracy. The last step is the tell-tale: from about $2\,\mathrm{m}$ to below a micrometre in one go, a reduction of millions. A method that shrinks the error by a fixed factor each time could not do that; Newton's method in its quadratic phase does.

**The answer.** The total correction is

$$
\mathbf{v}_1^{(3)}-\mathbf{v}_0 = (0.885,\ 2.422,\ 3.206)\,\mathrm{m/s}, \qquad \text{size } \sqrt{0.885^2 + 2.422^2 + 3.206^2} = 4.11\,\mathrm{m/s} .
$$

That is the departure velocity that actually reaches $\mathbf{r}_2$ under the real forces.

**Sanity check.** A few metres per second is the size of a real trajectory correction for a few-hour arc in Earth orbit — tiny next to the $7.67\,\mathrm{km/s}$ orbital speed, as a correction for a $1/590$-strength force should be.
:::

### What if you reuse the two-body $\boldsymbol{\Phi}$?

Run the same loop, but build $\boldsymbol{\Phi}$ from the pure two-body Jacobian (only $\mathbf{G}$) while the state still feels $J_2$. The miss goes

$$
67\,342 \to 478 \to 98.9 \to 6.82 \to 0.111 \to 0.0017 \to 0.00022 \to 0.0000044\,\mathrm{m} .
$$

It still converges, because the two-body $\boldsymbol{\Phi}$ is nearly right. But the error now shrinks by a roughly steady factor per step, not a doubling of digits, and it takes seven iterations instead of three. Each iteration is a full three-hour integration of $42$ equations, so on a flight computer that difference matters. A slightly wrong slope turns Newton's method into a slower, steady crawl.

## When the straight-line picture breaks

Newton's method is only guaranteed to behave well once the guess is close enough that the straight-line approximation is trustworthy — the **linear regime**. Start further away and that guarantee weakens or disappears, even though the formula is unchanged.

::: example Bad first guesses, honestly
Repeat the loop, but start from $\mathbf{v}_1^{(0)} = \mathbf{v}_0 + \delta\mathbf{v}_{\text{exec}}$ for two deliberately large **[[execution errors|execution-error]]** $\delta\mathbf{v}_{\text{exec}}$ — burns that came out wrong.

**A big error: $\delta\mathbf{v}_{\text{exec}} = (0.05,\ -0.05,\ 0.05)\,\mathrm{km/s}$.** Its size is $\sqrt{3}\times 50 = 86.6\,\mathrm{m/s}$ — large for a real burn, but not absurd. The misses are

$$
1\,982\,870 \to 479\,807 \to 370\,850 \to 17\,248 \to 3050 \to 0.75 \to 0.00001\,\mathrm{m} .
$$

It converges, but only after several rough steps — the third step barely helps — before the quadratic phase takes over at the end. The method works; it is not the clean three-step finish of the good start.

**A wild error: $\delta\mathbf{v}_{\text{exec}} = (0.5,\ -0.5,\ 0.5)\,\mathrm{km/s}$.** Size $866\,\mathrm{m/s}$, a badly wrong burn. The misses are

$$
16.1\times10^6\,\mathrm{m} \to 232.6\times10^6\,\mathrm{m} \to 6.79\times10^6\,\mathrm{m} \to 1.9\times10^{14}\,\mathrm{m} .
$$

It diverges. Look at the guesses behind those numbers:

- The first correction asks for a departure speed of $23.8\,\mathrm{km/s}$. Escape speed at that height is about $10.8\,\mathrm{km/s}$, so this orbit leaves Earth for good — hence a miss of $233\,000\,\mathrm{km}$.
- The next guess, $4.24\,\mathrm{km/s}$, is far too slow: the path falls straight into Earth, and the math, which has no ground, carries it to within metres of the planet's center. Its miss, $6.79\times10^6\,\mathrm{m}$, is about the distance from Earth's center to $\mathbf{r}_2$.
- The next correction asks for about $17.6$ million $\mathrm{km/s}$ — some sixty times the speed of light.

**Why.** Nothing is wrong with the arithmetic: $\boldsymbol{\Phi}_{rv}$ is computed correctly at every step. But the straight-line approximation the whole method rests on no longer describes the true, curved miss-versus-velocity map this far from the answer. Newton's method has no built-in brake against stepping somewhere the approximation is worthless.
:::

::: warning A diverging correction is not a sign to distrust the state transition matrix
When a differential-correction loop blows up, the instinct is to blame the STM. Check it the way the last lesson taught — for two-body dynamics, $\det\boldsymbol{\Phi}=1$ — before assuming that. Very often it is still exact. (With $J_2$ the check still works: $J_2$ depends on position only, so $\operatorname{tr}\mathbf{A} = 0$ still.) What has usually failed is the *premise*: that one straight-line step from a bad start lands near the answer.

Production targeting software handles this with **[[globalization|globalization]]** strategies beyond this lesson: shortening the step (damping), a line search, or a better first guess. That last one is exactly what Lambert's two-body answer usually provides — it is normally close enough for the linear regime to hold — rather than trusting ever-larger raw Newton steps.
:::

## Check yourself

::: check
Explain in your own words why differential correction needs $\boldsymbol{\Phi}_{rv}$ specifically, rather than the full $6\times6$ $\boldsymbol{\Phi}$.
:::

::: answer
The correction changes the departure *velocity* to fix an arrival *position* miss, while the departure position and the arrival time stay fixed. The sensitivity that connects those two is $\partial\mathbf{r}_f/\partial\mathbf{v}_0$, the upper-right $3\times3$ block $\boldsymbol{\Phi}_{rv}$.

The other blocks describe sensitivities this correction does not use. $\boldsymbol{\Phi}_{rr}$ maps a departure position change, which a burn cannot command. The blocks involving $\delta\mathbf{v}_f$ describe the arrival velocity, which this correction does not constrain. Three unknowns (the velocity change) and three requirements (the position miss) make a square $3\times3$ problem.
:::

::: check
In the good-start worked example, the miss goes from about $67\,\mathrm{km}$ to about $322\,\mathrm{m}$ in one iteration — a reduction of about $209$ times — and then to about $1.9\,\mathrm{m}$, a reduction of only about $171$ times. Does a smaller second reduction mean the convergence is not quadratic?
:::

::: answer
No. Quadratic convergence is a statement about what happens *near* the root, where the straight-line approximation is very accurate. There the new error is roughly a constant times the square of the old one. That constant depends on how curved the map is, and here also on direction: $\boldsymbol{\Phi}_{rv}$ for this three-hour arc is lopsided (it responds about a hundred times more strongly in one direction than in the others), so some misses need a proportionally larger velocity step, and larger steps meet more curvature. So the first steps need not follow a clean pattern.

The unmistakable sign comes at the end: the miss falls from about $2\,\mathrm{m}$ to below a micrometre in one step, a reduction of millions. A linearly converging method, which cuts the error by a roughly fixed factor each step, could never make that jump — compare the two-body-$\boldsymbol{\Phi}$ run, which crawls down by a steady factor per step.
:::

::: check
Why does propagating $\boldsymbol{\Phi}$ under the same $J_2$-perturbed dynamics as the state itself matter, rather than reusing the pure two-body $\boldsymbol{\Phi}$ from the previous lesson?
:::

::: answer
$\boldsymbol{\Phi}$ is the sensitivity of the *actual* trajectory to a change in the starting state. So it has to be built from the Jacobian of the dynamics actually being integrated — here two-body plus $J_2$ — evaluated along the actual, perturbed reference trajectory.

The pure two-body $\boldsymbol{\Phi}$ linearizes the wrong dynamics. Its correction direction and size no longer match how the real trajectory responds, which slows or spoils convergence. In this lesson's example it is the difference between three iterations with quadratic convergence and seven with a steady, linear crawl; with a stronger perturbation or a longer arc, the mismatch could stop convergence altogether.
:::

::: check
A targeting engineer proposes skipping differential correction entirely and instead re-solving Lambert with a "corrected" $\mu$ that approximately accounts for $J_2$ on average. Explain, using this lesson's example, one reason this would not fully solve the problem.
:::

::: answer
$J_2$'s pull depends on where the spacecraft is relative to the equator (through the $z^2/r^2$ terms in the acceleration), not only on its distance from Earth's center. A changed $\mu$ can only make gravity uniformly a bit stronger or weaker at a given distance. So $J_2$'s net effect over an arc depends on that arc's particular geometry — its inclination, how much time it spends near the poles versus the equator — and no single averaged $\mu$ applies to every transfer. An adjusted $\mu$ might shrink the miss for some geometries and barely help, or even hurt, for others. Only a correction that uses the actual forces along the actual arc removes the miss in general.
:::

::: check
In the divergent example, the miss after the third iteration is about $1.9\times10^{14}\,\mathrm{m}$ — vastly larger than interplanetary distances. What does a miss of this size, arising from a linear Newton step, tell you about where that step must have landed?
:::

::: answer
A linear correction computed from $\boldsymbol{\Phi}_{rv}^{-1}$ far outside the linear regime can propose a velocity change that is itself absurdly large. Applying it gives a new guess describing a wildly different trajectory — here a hyperbolic escape at a speed that is not even physically possible (tens of times the speed of light), nothing like the intended transfer. Flying that guess for the same fixed time lands it about $1.9\times10^{14}\,\mathrm{m}$ away — over a thousand times the Earth–Sun distance — far from both $\mathbf{r}_2$ and the original trajectory.

A result like that is the signal to stop the iteration and damp it or restart it from a better guess, not to trust it.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r}_f(\mathbf{v}_1)$ | Arrival position as a function of departure velocity, under the real dynamics |
| $\delta\mathbf{v}_0 = \boldsymbol{\Phi}_{rv}^{-1}\delta\mathbf{r}_f$ | Newton step on the miss; $\boldsymbol{\Phi}_{rv}$ from the real-dynamics STM |
| Quadratic convergence | Once near the root; seen here as $67\,\mathrm{km}\to322\,\mathrm{m}\to1.9\,\mathrm{m}\to$ below $1\,\mu\mathrm{m}$ in three steps |
| $J_2$ | Earth's equatorial bulge, the biggest real-Earth force Lambert ignores; about $1/590$ of gravity in low orbit; checked by energy conservation |
| Jacobian with $J_2$ | $\mathbf{G} + \partial\mathbf{a}_{J_2}/\partial\mathbf{r}$; leaving the $J_2$ part out gives slow, linear convergence |
| Bad first guess | Slow, uneven convergence, or outright divergence; not a bug in $\boldsymbol{\Phi}$ |
| Globalization | Damping, line search, or a better first guess — production fixes for the divergent case |

The next lesson turns the same idea — a small, well-behaved correction near a planned trajectory — toward the coordinates an interplanetary flyby is actually aimed in: the **B-plane**.

::: context newton-tangent Riding the tangent line down
Newton's method replaces a curve with its tangent line at your guess, then jumps to where that straight line hits zero. Near the root the curve and its tangent are almost the same, so the jump lands very close. Far away they can disagree wildly.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="345" y2="130" stroke="#6c7a93" stroke-width="1.5"/>
  <polyline points="150,146.4 160,143.6 170,140 180,135.6 190,130.4 200,124.4 210,117.6 220,110 230,101.6 240,92.4 250,82.4 260,71.6 270,60 280,47.6 290,34.4 300,20.4" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="290" y1="34.4" x2="219.7" y2="130" stroke="#b4232c" stroke-width="2"/>
  <line x1="219.7" y1="130" x2="219.7" y2="110.2" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="290" cy="34.4" r="4.5" fill="#1f2a44"/>
  <circle cx="219.7" cy="130" r="4.5" fill="#b4232c"/>
  <circle cx="190.7" cy="130" r="4.5" fill="#1d6fd1"/>
  <text x="296" y="40" font-size="12" fill="#1f2a44">guess k</text>
  <text x="222" y="150" font-size="12" fill="#b4232c">guess k+1</text>
  <text x="180" y="160" font-size="12" text-anchor="end" fill="#1d6fd1">root</text>
  <text x="252" y="100" font-size="12" fill="#b4232c">tangent</text>
  <text x="30" y="122" font-size="12" fill="#1f2a44">F = 0</text>
</svg>
```

Isaac Newton described an early version of the method in the late 1600s, for polynomials. Joseph Raphson published a cleaner form soon after, which is why it is often called Newton–Raphson.
:::

::: context shooting-name Why it is called shooting
The name comes from aiming a cannon. You know where the gun is and where the target is; you choose the barrel's angle, fire, see where the shell lands, and adjust. A **shooting method** does the same with an equation: guess the unknown starting value, "fire" by integrating forward, measure the miss at the far end, and correct the aim.

Differential correction is shooting with a smart adjustment rule: the STM tells you exactly how much to move the aim for a given miss.
:::

::: context quadratic-digits Doubling the digits
Suppose an answer is correct to $2$ digits. Quadratic convergence means the next step is correct to about $4$, then $8$, then $16$ — the error gets squared each time. A linearly converging method instead gains a fixed number of digits per step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="175" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="175" x2="340" y2="175" stroke="#6c7a93" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="36">10 km</text><text x="45" y="86">1 m</text><text x="45" y="136">0.1 mm</text>
  </g>
  <g stroke="#e3e7ee" stroke-width="1"><line x1="50" y1="32.5" x2="340" y2="32.5"/><line x1="50" y1="82.5" x2="340" y2="82.5"/><line x1="50" y1="132.5" x2="340" y2="132.5"/></g>
  <polyline points="60,22.1 98,49 136,57.6 174,72.1 212,94.4 250,117.1 288,128.1 326,149.4" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 3"/>
  <polyline points="60,22.1 98,51.2 136,79.1 174,163.1" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1d6fd1"><circle cx="60" cy="22.1" r="3.5"/><circle cx="98" cy="51.2" r="3.5"/><circle cx="136" cy="79.1" r="3.5"/><circle cx="174" cy="163.1" r="3.5"/></g>
  <text x="182" y="168" font-size="12" fill="#1d6fd1">with J₂ in Φ</text>
  <text x="230" y="100" font-size="12" fill="#6c7a93">two-body Φ</text>
  <text x="195" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">iteration 0 to 7 (miss on a log scale)</text>
</svg>
```

Both runs are this lesson's example. The blue line plunges at the end; the grey one steps down steadily.
:::

::: context j2-name Where the name J₂ comes from
Geodesists describe Earth's gravity as a sum of simpler shapes, like describing a sound as a sum of pure notes. The terms that depend only on latitude are the **zonal harmonics**, labeled $J_2$, $J_3$, $J_4$ and so on. $J_2$ is the second one, the flattening at the poles, and it is roughly four hundred times bigger than the next one, $J_3$.

Its effects are not subtle over weeks. $J_2$ makes an orbit's plane slowly swing around Earth's axis. Mission designers use exactly that to build **Sun-synchronous** orbits, whose plane turns once a year so the satellite passes over each place at the same local time. The perturbations module treats this in full.
:::

::: context conservative-force What makes a force conservative
A force is **conservative** when the work it does depends only on where you start and end, not on the path between. Gravity is one: lift a book and lower it back and gravity has done zero net work. Such a force comes from a potential energy, and kinetic plus potential energy stays constant.

Drag is the classic non-conservative force: it always steals energy. That is why energy conservation makes a good check for the $J_2$ code, but would not work once drag is added.
:::

::: context execution-error Why burns come out wrong
A planned burn is a velocity change, but engines are real. Thrust varies a little from firing to firing, the burn may start or stop a fraction of a second off, and the spacecraft may point slightly wrong while firing. The difference between the planned and the delivered velocity change is the **execution error**.

For small burns it is usually a small fraction of the planned change. That is why this lesson's $86.6\,\mathrm{m/s}$ and $866\,\mathrm{m/s}$ errors are called deliberately large: they are stress tests, far beyond what a working propulsion system delivers.
:::

::: context globalization Taming a wild Newton step
**Globalization** means making a method that works well near the answer also behave far from it. The simplest trick is **damping**: take only a fraction of the Newton step, say half, and check that the miss actually shrank before accepting it. A **line search** tries a few step lengths along the Newton direction and keeps the best.

Both cost extra trajectory integrations, but they prevent disasters like the divergent example, where one unchecked step launched the guess past escape speed. The optimization module of this course treats these ideas in general.
:::
