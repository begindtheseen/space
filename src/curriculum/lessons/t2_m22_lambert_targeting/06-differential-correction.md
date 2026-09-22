---
id: l06-differential-correction
title: Targeting and differential correction
minutes: 22
covers:
  - targeting and differential correction
---

A Lambert solve is only ever as good as the dynamics it assumes, and every Lambert solve in this module has assumed pure two-body motion — a point mass, no atmosphere, no oblateness, an instantaneous impulsive burn. Real spacecraft experience none of those idealisations exactly: Earth's gravity field has a pronounced equatorial bulge (the $J_2$ term this lesson uses), low orbits feel drag, burns take finite time and have execution error. Fly the two-body $\mathbf{v}_1$ that Lambert returned, propagate it through the *real* dynamics, and you will not land on $\mathbf{r}_2$ — you will be close, because two-body motion is usually the dominant term, but not exact, and "usually close" is not a targeting requirement.

Differential correction is how that gap gets closed: not by re-deriving Lambert for every possible perturbation (there is no closed form for that), but by treating the miss as the output of a nonlinear map from departure velocity to arrival position, and applying Newton's method to it using the state transition matrix from the previous lesson. This lesson builds that loop, runs it against a real perturbation, and shows — because the module's whole method is to show, not assert — both how fast it converges when the starting point is good and how it fails when the starting point is not.

## The correction as a Newton step

Think of the arrival position as a function of the departure velocity, everything else fixed: $\mathbf{r}_f(\mathbf{v}_1)$, obtained by propagating $(\mathbf{r}_1,\mathbf{v}_1)$ forward by the fixed flight time $\Delta t$ under whatever dynamics the real spacecraft actually experiences. Lambert's two-body $\mathbf{v}_1$ is a good starting guess, $\mathbf{v}_1^{(0)}$, but $\mathbf{r}_f(\mathbf{v}_1^{(0)}) \ne \mathbf{r}_2$ in general. Newton's method for a vector root — find $\mathbf{v}_1$ such that $\mathbf{r}_f(\mathbf{v}_1)-\mathbf{r}_2=\mathbf{0}$ — linearises around the current guess:

$$
\mathbf{r}_2 - \mathbf{r}_f(\mathbf{v}_1^{(k)}) \approx \left.\frac{\partial\mathbf{r}_f}{\partial\mathbf{v}_1}\right|_{\mathbf{v}_1^{(k)}} \delta\mathbf{v}_1^{(k)} = \boldsymbol{\Phi}_{rv}\,\delta\mathbf{v}_1^{(k)} ,
$$

using exactly the block from the previous lesson — the sensitivity of arrival position to departure velocity, evaluated for the actual arc, under the actual dynamics. Solve for the correction and apply it:

$$
\delta\mathbf{v}_1^{(k)} = \boldsymbol{\Phi}_{rv}^{-1}\big(\mathbf{r}_2 - \mathbf{r}_f(\mathbf{v}_1^{(k)})\big), \qquad \mathbf{v}_1^{(k+1)} = \mathbf{v}_1^{(k)} + \delta\mathbf{v}_1^{(k)} .
$$

::: key Differential correction
$$
\delta\mathbf{v}_0 = \boldsymbol{\Phi}_{rv}^{-1}\,\delta\mathbf{r}_f , \qquad \delta\mathbf{r}_f = \mathbf{r}_{\text{target}} - \mathbf{r}_{\text{achieved}} .
$$
One Newton step on a shooting problem: propagate, measure the miss, invert $\boldsymbol{\Phi}_{rv}$ for the actual arc (under the real dynamics) against the miss, apply the correction, repeat.
:::

Each iteration requires propagating the state *and* $\boldsymbol{\Phi}$ together — the same $42$-element integration from the previous lesson, run under whatever dynamics model the mission actually uses, not the idealised two-body model Lambert assumed. That is the whole loop. Because it is genuinely Newton's method on a smooth (if not two-body) map, it inherits Newton's usual behaviour: roughly quadratic convergence once the iterate is close enough to the true root that the linear approximation is trustworthy, and no such guarantee — possibly outright divergence — when it is not.

## A concrete miss: two-body Lambert against $J_2$

Earth's gravity is not a point mass; the dominant departure from one is the $J_2$ oblateness term, with acceleration

$$
\mathbf{a}_{J_2} = -\frac{3}{2}J_2\frac{\mu R_\oplus^2}{r^4}\left[\Big(1-5\frac{z^2}{r^2}\Big)\frac{x}{r},\ \Big(1-5\frac{z^2}{r^2}\Big)\frac{y}{r},\ \Big(3-5\frac{z^2}{r^2}\Big)\frac{z}{r}\right], \qquad J_2 = 1.08263\times10^{-3},\ R_\oplus = 6378.137\,\mathrm{km} .
$$

This acceleration is conservative — it comes from adding a term $\mu J_2 R_\oplus^2(3z^2/r^2-1)/(2r^3)$ to the gravitational potential — so total mechanical energy, point-mass potential plus this extra term plus kinetic energy, is exactly conserved along a $J_2$-perturbed trajectory; integrating the ISS-like state under $\mathbf{a} = -\mu\mathbf{r}/r^3+\mathbf{a}_{J_2}$ for three hours holds that total energy constant to twelve significant figures, which is the check that confirms the acceleration formula above is implemented correctly before it is trusted for anything else.

::: example The miss a two-body Lambert leaves behind
Take $\mathbf{r}_1=(-2267.240,-3989.573,5001.268)\,\mathrm{km}$, and suppose the mission wants to be at $\mathbf{r}_2 = (-3759.757,-1907.159,5318.821)\,\mathrm{km}$ exactly $\Delta t=10\,800\,\mathrm{s}$ ($3\,\mathrm{h}$) later — this $\mathbf{r}_2$ is, by construction, exactly where the two-body point $(\mathbf{r}_1,\mathbf{v}_0)$ with $\mathbf{v}_0=(5.0098,-5.4258,-2.0540)\,\mathrm{km/s}$ arrives under pure two-body propagation, so a two-body Lambert solve for this $\mathbf{r}_1,\mathbf{r}_2,\Delta t$ returns exactly $\mathbf{v}_1^{(0)}=\mathbf{v}_0$.

Propagate that same $(\mathbf{r}_1,\mathbf{v}_1^{(0)})$ forward by the same $10\,800\,\mathrm{s}$, but through the real, $J_2$-perturbed dynamics instead. The result misses $\mathbf{r}_2$ by
$$
\lVert\delta\mathbf{r}_f\rVert = 67\,341.9\,\mathrm{m} \approx 67.3\,\mathrm{km} ,
$$
purely from the oblateness term Lambert never knew about. That is not a small error on the scale of a rendezvous or a precision flyby, and it is the entire reason differential correction exists: the two-body Lambert answer is an excellent *starting point*, not a final answer, whenever the real dynamics depart from two-body motion by more than the mission can tolerate.
:::

::: example Closing the loop, iteration by iteration
Starting from $\mathbf{v}_1^{(0)}=\mathbf{v}_0$ above, each step propagates the state and $\boldsymbol{\Phi}$ together under the $J_2$ dynamics for the full $10\,800\,\mathrm{s}$, forms the miss against $\mathbf{r}_2$, and applies $\delta\mathbf{v}_1 = \boldsymbol{\Phi}_{rv}^{-1}\delta\mathbf{r}_f$:

| Iteration | Miss $\lVert\delta\mathbf{r}_f\rVert$ |
| --- | --- |
| 0 | $67\,341.9\,\mathrm{m}$ |
| 1 | $321.9\,\mathrm{m}$ |
| 2 | $1.89\,\mathrm{m}$ |
| 3 | $1\times10^{-6}\,\mathrm{m}$ |

Three corrections take the miss from tens of kilometres to a micrometre — each iteration's miss is very roughly the *square* of the previous one relative to the scale of the problem, the signature of quadratic convergence once inside the linear regime. The final correction, $\mathbf{v}_1^{(3)}-\mathbf{v}_0 = (0.885,\,2.422,\,3.206)\,\mathrm{m/s}$, magnitude $4.11\,\mathrm{m/s}$, is the actual departure burn that reaches $\mathbf{r}_2$ under the real dynamics — a genuine, physically realistic trajectory-correction-sized number for a few-hour Earth-orbit arc, not the idealised two-body $\mathbf{v}_0$ Lambert alone would have you fly.
:::

## When the linear regime does not hold

Newton's method is only guaranteed to behave well once the current guess is close enough that the linear (first-derivative) approximation is trustworthy. Push the starting guess further away and that guarantee weakens or disappears, even though the correction formula itself is unchanged.

::: example Bad initial guesses, honestly
Repeat the same correction loop, but starting from $\mathbf{v}_1^{(0)} = \mathbf{v}_0 + \delta\mathbf{v}_{\text{exec}}$ for two different, deliberately large execution errors $\delta\mathbf{v}_{\text{exec}}$:

For $\delta\mathbf{v}_{\text{exec}} = (0.05,-0.05,0.05)\,\mathrm{km/s}$ (a $86.6\,\mathrm{m/s}$ error — large for a real burn, but not absurd), the miss sequence is
$$
1\,982\,870\,\mathrm{m} \to 479\,807\,\mathrm{m} \to 370\,850\,\mathrm{m} \to 17\,248\,\mathrm{m} \to 3050\,\mathrm{m} \to 0.75\,\mathrm{m} \to 0\,\mathrm{m} ,
$$
converging, but only after several iterations of rough, non-monotonic progress before the quadratic regime takes over near the end — the correction genuinely works, but it is not the clean three-step convergence of the well-posed case above.

For $\delta\mathbf{v}_{\text{exec}} = (0.5,-0.5,0.5)\,\mathrm{km/s}$ ($866\,\mathrm{m/s}$, a wildly wrong burn), the sequence is
$$
16.1\times10^6\,\mathrm{m} \to 232.6\times10^6\,\mathrm{m} \to 6.8\times10^6\,\mathrm{m} \to 1.9\times10^{14}\,\mathrm{m} ,
$$
diverging outright: the miss *grows* on the second step and then explodes. Nothing is wrong with the arithmetic — $\boldsymbol{\Phi}_{rv}$ is computed correctly at each step — the linear approximation the whole method rests on stops describing the true, nonlinear miss-versus-velocity map once the guess is this far from the answer, and Newton's method has no built-in safeguard against stepping somewhere the approximation has become worthless.
:::

::: warning A diverging correction is not a sign to distrust the state transition matrix
When a differential-correction loop blows up, the instinct is to suspect the STM. Check it the way the previous lesson taught — $\det\boldsymbol{\Phi}=1$ — before assuming that; it is very often still exact. What has usually failed is the *premise* that a single linear step from a bad starting point will land near the true answer. Production targeting software handles this with globalisation strategies outside this lesson's scope — damping the step, a line search, or a better starting guess in the first place (which is exactly what Lambert's two-body answer usually provides, precisely because it is normally close enough for the linear regime to hold) — rather than trusting an ever-larger raw Newton step.
:::

## Check yourself

::: check
Explain in your own words why differential correction needs $\boldsymbol{\Phi}_{rv}$ specifically, rather than the full $6\times6$ $\boldsymbol{\Phi}$.
:::

::: answer
The correction adjusts the departure *velocity* to fix an arrival *position* miss, holding the fixed final time and the departure position unchanged. That is exactly the sensitivity $\partial\mathbf{r}_f/\partial\mathbf{v}_0$, the upper-right $3\times3$ block $\boldsymbol{\Phi}_{rv}$. The other blocks describe sensitivities the correction does not need: $\boldsymbol{\Phi}_{rr}$ (position-to-position, not something you can command with a burn) and the blocks involving $\delta\mathbf{v}_f$ (which this correction does not constrain).
:::

::: check
In the well-posed worked example, the miss goes from about $67\,\mathrm{km}$ to about $322\,\mathrm{m}$ in one iteration — roughly a factor of $200$ reduction, not a factor of $67\,000/322 \approx 208$ squared. Is this inconsistent with quadratic convergence?
:::

::: answer
No. Quadratic convergence is a statement about the asymptotic rate once the iterate is close enough to the root for the linearisation to be highly accurate — it predicts that the error at each step is roughly proportional to the *square* of the previous error, with some constant of proportionality that depends on the problem's own curvature, not that the ratio between consecutive misses itself equals the previous miss. The clean signature here is that the reduction factor keeps increasing at each step (roughly $200\times$, then $170\times$, then nearly two million), which is exactly what quadratic convergence looks like as the iterate enters the truly linear regime near the root.
:::

::: check
Why does propagating $\boldsymbol{\Phi}$ under the same $J_2$-perturbed dynamics as the state itself matter, rather than reusing the pure two-body $\boldsymbol{\Phi}$ from the previous lesson?
:::

::: answer
$\boldsymbol{\Phi}$ is the sensitivity of the *actual* propagated trajectory to a perturbation in the initial state, so it has to be built from the Jacobian of whatever dynamics are actually being integrated — here, two-body plus $J_2$ — evaluated along the actual (perturbed) reference trajectory. Using the pure two-body $\boldsymbol{\Phi}$ instead would linearise around the wrong dynamics, giving a correction direction and magnitude that no longer matches how the real, $J_2$-perturbed trajectory actually responds to a change in departure velocity, which would slow or spoil convergence.
:::

::: check
A targeting engineer proposes skipping differential correction entirely and instead re-solving Lambert with a "corrected" $\mu$ that approximately accounts for $J_2$ on average. Explain, using this lesson's example, one reason this would not fully solve the problem.
:::

::: answer
$J_2$'s effect on a trajectory depends on the spacecraft's position relative to the equatorial plane (through the $z^2/r^2$ terms in the acceleration), not on distance from the centre alone, so its net effect over an arc depends on the specific geometry of that arc — inclination, latitude coverage, how much of the arc is near the poles versus the equator — not on a single averaged correction to $\mu$ that would apply uniformly to every transfer. A single adjusted $\mu$ could reduce the miss for some geometries and barely help, or even hurt, for others; only a targeting correction that uses the actual dynamics along the actual arc removes the miss in general.
:::

::: check
In the divergent example, the miss after the third iteration is about $1.9\times10^{14}\,\mathrm{m}$ — vastly larger than interplanetary distances. What does a miss of this size, arising from a linear Newton step, tell you about where that step must have landed?
:::

::: answer
A linear correction computed from $\boldsymbol{\Phi}_{rv}^{-1}$ at a point far outside the linear regime can propose a velocity correction that is itself unreasonably large, and applying it produces a new $\mathbf{v}_1$ guess describing a wildly different, likely near-escape or hyperbolic trajectory rather than anything resembling the intended transfer; propagating that guess forward for the same fixed flight time lands somewhere far from both $\mathbf{r}_2$ and the original trajectory entirely, which is exactly the kind of result that signals the iteration needs to be stopped, damped, or restarted from a better guess rather than trusted.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r}_f(\mathbf{v}_1)$ | Arrival position as a function of departure velocity, under the real dynamics |
| $\delta\mathbf{v}_0 = \boldsymbol{\Phi}_{rv}^{-1}\delta\mathbf{r}_f$ | Newton step on the miss; $\boldsymbol{\Phi}_{rv}$ from the real-dynamics STM |
| Quadratic convergence | Once near the root; verified: $67\,\mathrm{km}\to322\,\mathrm{m}\to1.9\,\mathrm{m}\to1\,\mu\mathrm{m}$ in three steps |
| $J_2$ | The dominant real-Earth perturbation Lambert ignores; verified via energy conservation |
| Bad initial guess | Slow, non-monotonic convergence, or outright divergence; not a bug in $\boldsymbol{\Phi}$ |
| Globalisation | Damping, line search, or a better starting guess — production fixes for the divergent case |

The next lesson turns the same idea — a small, well-conditioned correction near a nominal trajectory — toward the specific coordinates an interplanetary flyby or approach is actually targeted in: the B-plane.
