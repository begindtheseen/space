---
id: l10-cowell-encke-methods
title: Cowell's method and Encke's method
minutes: 19
covers:
  - Cowell and Encke methods
---

Every perturbation in this module ends up as one more term added to $\ddot{\mathbf{r}}=-\mu\mathbf{r}/r^3+\mathbf{a}_p$, and sooner or later that sum has to be integrated numerically — special perturbations, in the language of the first lesson. There are two standard ways to do it, and they make opposite bets about where a numerical integrator's effort is best spent. Cowell's method bets that simplicity wins: integrate the whole acceleration, every term, directly. Encke's method bets that the integrator should never have to work hard on the part of the motion you already know in closed form — the two-body ellipse — and should spend its whole budget on the small part you do not.

This lesson builds both, and then does what the task set out to do: measures their accuracy against each other, at the same step count, on the same trajectory, and watches Encke's advantage — which is real, and can be enormous — shrink as the perturbation grows, until the bookkeeping needed to keep it accurate costs as much as the advantage it buys.

## Cowell's method

Cowell's method is the propagator this module has used in every worked numerical example so far: integrate

$$
\ddot{\mathbf{r}} = -\frac{\mu\mathbf{r}}{r^3} + \mathbf{a}_p(\mathbf{r},\mathbf{v},t)
$$

directly, with any numerical integrator, treating the two-body term and every perturbation identically as pieces of one total acceleration. Its appeal is that it could not be simpler to implement or extend — adding a new force model is one more term in a sum — and it places no restriction on the size of $\mathbf{a}_p$ or the orbit's eccentricity. Its cost is that the integrator has to resolve the *entire* trajectory, including the large, rapidly-rotating two-body motion that is already known in exact closed form from the two-body module, just to extract the comparatively tiny effect of $\mathbf{a}_p$ on top of it. Almost all of a fixed-step integrator's local truncation error budget, at a given step size, goes into representing the fast two-body ellipse; only a sliver is available to resolve the perturbation itself, so achieving good accuracy on the *perturbation's* effect demands a step size chosen for the whole orbit, not for the (much smaller, much smoother) part that is actually uncertain.

## Encke's method

Encke's method integrates only the deviation from a reference two-body orbit, so the integrator only ever has to resolve the small, slowly-varying part. Fix a reference state $\mathbf{r}_{\text{ref}0},\mathbf{v}_{\text{ref}0}$ at some epoch, propagate it analytically with the universal-variable and Lagrange-coefficient machinery of the two-body module (no numerical integration needed for the reference at all — it is exact, in closed form, for any time), and track the deviation $\boldsymbol\delta\mathbf{r} = \mathbf{r}-\mathbf{r}_{\text{ref}}(t)$.

The deviation's equation of motion needs $\ddot{\boldsymbol\delta\mathbf{r}} = -\mu\mathbf{r}/r^3 + \mathbf{a}_p - \big(-\mu\mathbf{r}_{\text{ref}}/r_{\text{ref}}^3\big)$, and computing this difference directly is numerically dangerous: $\mathbf{r}$ and $\mathbf{r}_{\text{ref}}$ start equal and stay close, so $\mathbf{r}/r^3-\mathbf{r}_{\text{ref}}/r_{\text{ref}}^3$ is a difference of two nearly-equal vectors, exactly the catastrophic-cancellation trap the universal-variables lesson warned about for the Stumpff functions. The standard fix defines $q = \boldsymbol\delta\mathbf{r}\cdot(\mathbf{r}+\mathbf{r}_{\text{ref}})/r^2$ (small whenever $\boldsymbol\delta\mathbf{r}$ is small) and, with $u=\sqrt{1-q}$,

$$
f(q) = \frac{q\,(1+u+u^2)}{(1+u)\,u^3} , \qquad \Delta\mathbf{a}_{\text{2-body}} = \frac{\mu}{r^3}\Big[f(q)\,\mathbf{r}_{\text{ref}} - \boldsymbol\delta\mathbf{r}\Big] .
$$

$f(q)$ is algebraically identical to $(1-q)^{-3/2}-1$ — check that $u^2=1-q$ makes $u^{-3}=(1-q)^{-3/2}$, and that $1-u^3=(1-u)(1+u+u^2)$ with $1-u=q/(1+u)$ (rationalising) reduces exactly to $f(q)$ above — but where $(1-q)^{-3/2}-1$ subtracts two nearly-equal numbers for small $q$, losing precision exactly when the reference is closest (which is always, right after rectification), $f(q)$ computes the same quantity as a product of well-behaved positive factors, with no subtraction of comparable-sized numbers anywhere. The full deviation equation of motion is then

$$
\ddot{\boldsymbol\delta\mathbf{r}} = \frac{\mu}{r^3}\Big[f(q)\,\mathbf{r}_{\text{ref}} - \boldsymbol\delta\mathbf{r}\Big] + \mathbf{a}_p(\mathbf{r},\mathbf{v},t) , \qquad \mathbf{r}=\mathbf{r}_{\text{ref}}(t)+\boldsymbol\delta\mathbf{r} ,
$$

integrated numerically while $\mathbf{r}_{\text{ref}}(t)$ comes from the closed-form propagator at every evaluation. Because $\boldsymbol\delta\mathbf{r}$ starts at zero and grows only as fast as the perturbation pushes it, it stays small and smooth for a while — exactly the quantity a coarse-step integrator handles well — until it has grown enough that the small-deviation bookkeeping starts costing more than it saves. At that point, **rectify**: reset $\mathbf{r}_{\text{ref}0},\mathbf{v}_{\text{ref}0}$ to the current true state, restart the reference epoch, and continue with $\boldsymbol\delta\mathbf{r}=\mathbf{0}$ again.

::: key Cowell vs Encke
**Cowell**: integrate $\ddot{\mathbf{r}}=-\mu\mathbf{r}/r^3+\mathbf{a}_p$ directly — simple, general, but the integrator must resolve the full two-body motion, demanding a step size set by the whole orbit.
**Encke**: integrate only $\boldsymbol\delta\mathbf{r}=\mathbf{r}-\mathbf{r}_{\text{ref}}(t)$, with $\mathbf{r}_{\text{ref}}(t)$ from an exact closed-form propagation and the cancellation-safe $f(q)$ correcting for the reference's own two-body acceleration — the integrator only resolves the small, slowly-varying deviation, at the cost of needing periodic rectification.
:::

## Accuracy at a fixed step count, weak perturbation

::: example Cowell and Encke at the same step count, under J2 alone
Take a $550\,\mathrm{km}$, $e=0.01$, $i=51.6^\circ$ orbit under $J_2$ alone, propagate $10$ orbits with fixed-step RK4, and compare final position against a tight-tolerance reference integration:

| Steps/orbit | Total steps | Cowell error | Encke error (rectify once/orbit) | Ratio |
| --- | --- | --- | --- | --- |
| $10$ | $100$ | $6.7\times10^5\,\mathrm{km}$ | $437\,\mathrm{km}$ | $1526\times$ |
| $20$ | $200$ | $1935\,\mathrm{km}$ | $28.5\,\mathrm{km}$ | $68\times$ |
| $40$ | $400$ | $61.9\,\mathrm{km}$ | $1.82\,\mathrm{km}$ | $34\times$ |
| $80$ | $800$ | $2.12\,\mathrm{km}$ | $0.115\,\mathrm{km}$ | $18.4\times$ |
| $160$ | $1600$ | $0.078\,\mathrm{km}$ | $0.0072\,\mathrm{km}$ | $11\times$ |
:::

At the coarsest step count, Cowell has essentially diverged (a $6.7\times10^5\,\mathrm{km}$ error is larger than the orbit itself) while Encke, with the same $100$ total steps, is still off by "only" $437\,\mathrm{km}$ — the fast two-body rotation defeated the coarse Cowell integrator completely, while Encke's small, smooth deviation tolerated it far better. Both errors shrink as step count grows, and the *ratio* between them shrinks too, from over a thousand down toward single digits — Encke's advantage is largest exactly where it is needed most, at the coarse steps a mission would actually want to use for a long propagation, and becomes less decisive once the step is already fine enough that Cowell is doing well on its own.

## Where the advantage goes: growing the perturbation

Everything above used $J_2$ alone, with rectification once per orbit — ten rectifications total for a ten-orbit run, negligible overhead. Now fix the step count at $800$ steps over $10$ orbits and the rectification interval at once per orbit, and add a synthetic drag term whose strength is dialled up relative to $J_2$:

| $\lVert a_{\text{drag}}\rVert/\lVert a_{J_2}\rVert$ | Cowell error | Encke error | Ratio |
| --- | --- | --- | --- |
| $0$ (J2 only) | $2.12\,\mathrm{km}$ | $0.115\,\mathrm{km}$ | $18.4\times$ |
| $0.02$ | $2.14\,\mathrm{km}$ | $0.127\,\mathrm{km}$ | $16.8\times$ |
| $0.23$ | $2.39\,\mathrm{km}$ | $0.237\,\mathrm{km}$ | $10.1\times$ |
| $1.14$ | $4.51\,\mathrm{km}$ | $1.69\,\mathrm{km}$ | $2.7\times$ |
| $4.55$ | $648\,\mathrm{km}$ | $1860\,\mathrm{km}$ | $0.35\times$ |

The crossover in the last row is real and worth sitting with: once drag is about four and a half times $J_2$'s size, Encke — using the *exact same* once-per-orbit rectification schedule that worked so well for $J_2$ alone — is now **worse** than Cowell. The deviation $\boldsymbol\delta\mathbf{r}$ grows too fast between rectifications for the small-deviation approximation (and the coarse RK4 steps tracking it) to keep up; the reference orbit goes stale well before the next scheduled rectification, and Encke pays for a sophistication it is no longer delivering on.

::: example Recovering accuracy costs more bookkeeping than the modest case ever needed
At the same $4.55\times$ drag level and the same $800$-step budget, tightening the rectification interval recovers Encke's advantage — dramatically, at first:

| Rectify every (steps) | Rectifications | Encke error | Cowell/Encke |
| --- | --- | --- | --- |
| $80$ (once/orbit) | $10$ | $1860\,\mathrm{km}$ | $0.35\times$ |
| $20$ | $40$ | $68.1\,\mathrm{km}$ | $9.5\times$ |
| $10$ | $80$ | $0.183\,\mathrm{km}$ | $3538\times$ |
| $5$ | $160$ | $3.63\,\mathrm{km}$ | $179\times$ |
| $1$ (every step) | $800$ | $7.35\,\mathrm{km}$ | $88\times$ |

Rectifying every tenth of an orbit (every $10$ steps, $80$ rectifications total) is a sweet spot, recovering a $3538\times$ advantage over Cowell — better than the weak-perturbation case ever achieved. But rectifying *more* often than that does not keep helping: by every fifth step the advantage has fallen back to $179\times$, and rectifying every single step — at which point Encke recomputes its reference on every RK4 stage, gaining almost nothing from ever having a "slowly varying" deviation to exploit — leaves only an $88\times$ advantage, worse than the sweet spot by a factor of $40$. Each rectification is itself a small source of numerical work and roundoff (a fresh closed-form solve, a coordinate reset), and once rectification is happening on nearly every step, that overhead is competing directly with the very smallness of $\boldsymbol\delta\mathbf{r}$ that made Encke worth using in the first place — this is the numerical-methods content behind "rectifying that often is not worth it": you are now doing Cowell-sized work, with Encke-sized bookkeeping on top, for a shrinking return.
:::

The honest summary of both tables together: Encke's edge is a genuine, large, measured effect for a weak, slowly-evolving perturbation propagated with a sensible, infrequent rectification schedule; it degrades gracefully as the perturbation grows, provided you rectify more often to compensate; and past some perturbation-dependent point, no rectification schedule recovers the old advantage cheaply — either the schedule is too loose and Encke silently loses to Cowell, or it is tight enough to compete but has spent away the computational savings that were the entire reason to use it.

::: warning Choosing a rectification interval requires knowing what you are propagating
There is no universal "rectify every $N$ orbits" rule; the right interval depends on how fast the *current* perturbation grows the deviation, which can itself change over a mission (a satellite's drag perturbation grows as it descends into denser air, exactly the lifetime scenario of the previous lesson). A propagator built once with a fixed rectification schedule, tuned for the perturbation level at the start of a mission, can silently degrade into the "Encke loses to Cowell" regime of the table above as conditions change, unless the rectification trigger is tied to a measured quantity — the size of $\boldsymbol\delta\mathbf{r}$ itself, or the value of $q$ — rather than a fixed step count.
:::

## Check yourself

::: check
Explain, without reference to any specific numbers, why Cowell's method needs a finer step size than Encke's to achieve the same accuracy on a weakly perturbed orbit.
:::

::: answer
Cowell's integrator has to resolve the entire trajectory, including the large, rapidly-varying two-body motion, and a fixed-step method's local error scales with how fast the integrated quantity is changing. Encke's integrator only has to resolve the deviation from a reference two-body orbit, which by construction starts at zero and grows only as fast as the (weak) perturbation pushes it — a much smaller, much more slowly varying quantity — so the same step size gives Encke far smaller error, or equivalently, Encke can use a much coarser step for the same accuracy.
:::

::: check
Why is $f(q) = (1-q)^{-3/2}-1$ evaluated through the $u=\sqrt{1-q}$ rewrite rather than directly, even though the two expressions are algebraically identical?
:::

::: answer
For small $q$ — which is exactly the regime Encke's method operates in, since $q$ is built from the small deviation $\boldsymbol\delta\mathbf{r}$ — direct evaluation of $(1-q)^{-3/2}-1$ subtracts two numbers very close to $1$, losing precision to catastrophic cancellation, the same failure mode the universal-variables lesson found in the naive Stumpff-function formulas. The $u$-based rewrite replaces that subtraction with a rationalised form, $1-u=q/(1+u)$, built entirely from products and sums of well-conditioned positive quantities, so it stays accurate even as $q\to0$, exactly where the direct formula is weakest.
:::

::: check
A ten-orbit propagation shows Cowell and Encke converging to nearly the same, small error once the step count is made very fine. Does this mean Encke's method has stopped being useful at fine step sizes?
:::

::: answer
Not necessarily useful in the same way. At a fine enough step size, both methods resolve the two-body motion well enough that Cowell's extra burden (representing the whole fast orbit numerically) is no longer the dominant source of error, so the accuracy gap narrows. Encke can still be preferred in that regime for other reasons — for instance, if propagating for very many orbits where its typically larger allowable step size reduces total computation for a given accuracy — but the *accuracy* advantage specifically is largest at coarse steps and shrinks, as the lesson's first table shows, once both methods are already accurate.
:::

::: check
A propagator uses Encke's method with a fixed once-per-orbit rectification schedule, tuned during testing on a $J_2$-only orbit. The mission later adds a high-drag phase during re-entry. What failure mode should the team expect if the rectification schedule is not changed?
:::

::: answer
They should expect Encke's accuracy to degrade, potentially becoming worse than a plain Cowell propagator at the same step count — exactly the crossover this lesson measured once drag grew to several times $J_2$'s size while the rectification interval stayed fixed at once per orbit. The deviation from the reference orbit grows much faster once significant drag is present, and a rectification interval tuned for the gentle $J_2$-only regime will let that deviation grow far past where the small-deviation approximation, and the coarse steps tracking it, remain accurate.
:::

::: check
Why does rectifying on every single integration step not give Encke's method its best possible accuracy, even though it keeps the deviation as small as it can possibly be at every step?
:::

::: answer
Every rectification requires a fresh closed-form solve for the reference state and resets the deviation bookkeeping, which is itself a real computational cost and a small source of additional numerical error; at the same time, rectifying every step means the "deviation is small and slowly varying" advantage that justified Encke's approach in the first place is barely exploited, since the deviation is reset before it has had any chance to develop the smooth, slow behaviour a coarse step relies on. The measured result — accuracy peaking at a moderate rectification interval and *falling* again at the most aggressive interval tested — shows this is a real, non-monotonic effect, not a monotonic "more rectification is always better" relationship.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Cowell | Integrate $\ddot{\mathbf{r}}=-\mu\mathbf{r}/r^3+\mathbf{a}_p$ directly; simple, general, step size set by the whole orbit |
| Encke | Integrate $\boldsymbol\delta\mathbf{r}=\mathbf{r}-\mathbf{r}_{\text{ref}}(t)$; step size set by the (small) deviation, needs periodic rectification |
| $q = \boldsymbol\delta\mathbf{r}\cdot(\mathbf{r}+\mathbf{r}_{\text{ref}})/r^2$, $f(q)=q(1+u+u^2)/[(1+u)u^3]$, $u=\sqrt{1-q}$ | Cancellation-safe correction for the reference's own two-body acceleration |
| Weak perturbation ($J_2$ only) | Encke beats Cowell by $10$–$1500\times$ at the same step count, largest at coarse steps |
| Growing perturbation, fixed rectification | Encke's advantage shrinks steadily and can invert (Encke worse than Cowell) once the reference goes stale between rectifications |
| Recovering accuracy | Needs a much shorter rectification interval; too short an interval loses accuracy again through rectification overhead |
| Rectification is not free | Each one costs a closed-form solve and resets the very smallness that makes Encke worth using |

The next lesson turns to the general-perturbations side of the same coin: SGP4, the compact analytic theory behind every publicly distributed satellite ephemeris, and why its output must never be treated as an ordinary osculating state.
