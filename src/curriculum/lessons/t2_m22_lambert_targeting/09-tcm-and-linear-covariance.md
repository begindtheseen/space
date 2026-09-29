---
id: l09-tcm-and-linear-covariance
title: Trajectory correction maneuvers and linear covariance analysis
minutes: 25
covers:
  - trajectory correction maneuvers
  - linear covariance analysis of targeting errors
---

Picture driving down a very long, straight road toward a gate far away. If your steering is off by a hair at the start, you will miss the gate by a lot at the end. The fix is easy early on: a gentle nudge of the wheel. Leave it until the last few meters and you have to yank the wheel hard. But there is a catch. At the very start you cannot yet tell whether you are off — the gate is too far away to see well. You have to drive a while before you know which way to nudge.

A spacecraft on its way to Mars is in the same position. Every burn in this module so far has been one clean event: solve Lambert, fly the answer. Real flight is messier. The launch vehicle drops the spacecraft off with small errors. The departure burn has its own execution error. Navigation knows the spacecraft's state only to some finite precision. All of that spread of possible errors — the **[[dispersion|dispersion-word]]** — must be found and removed before arrival. It is removed by small, planned burns called **trajectory correction maneuvers**, or **TCMs**.

This lesson answers two questions with tools you already have. First: does it matter *when* a correction burn happens, and by how much? Second: without simulating thousands of random trajectories, can a mission predict how big its errors at Mars will be, and how big the correction burns must be? Both answers come from the state transition matrix. The lesson ends by showing that the same idea — solve, burn, re-measure, re-solve — is how Lambert sits inside a rendezvous guidance loop.

## How much a correction costs depends on when

Start from the differential-correction lesson. The state transition matrix $\boldsymbol{\Phi}(t_f, t_c)$ ("Phi from $t_c$ to $t_f$") says how a small change in the state at time $t_c$ turns into a change at a later time $t_f$. Its upper-right $3\times3$ block, $\boldsymbol{\Phi}_{rv}$ ("Phi r v"), says how a small velocity change at $t_c$ moves the position at $t_f$.

Say navigation predicts that, left alone, the spacecraft will arrive at the target point off by some amount. Call the shift in arrival position you need $\delta\mathbf{r}_f$ (target minus predicted). A burn $\delta\mathbf{v}$ at time $t_c$ moves the arrival position by $\boldsymbol{\Phi}_{rv}(t_f,t_c)\,\delta\mathbf{v}$. Setting that equal to the shift you need and solving:

$$
\delta\mathbf{v}(t_c) = \boldsymbol{\Phi}_{rv}(t_f,t_c)^{-1}\,\delta\mathbf{r}_f .
$$

This is exactly the differential-correction formula, applied to the stretch of flight from the burn to the target.

For a fixed miss to remove, a *bigger* $\boldsymbol{\Phi}_{rv}$ means a *smaller* burn. And $\boldsymbol{\Phi}_{rv}$ generally grows with the time left: a small push given long before arrival has a long time to add up. That is **leverage** — the steering-wheel nudge on the long road.

::: example Leverage over an Earth–Mars cruise
Take the $270$-day transfer from the porkchop lesson, with $C_3 \approx 8.7\,\mathrm{km^2/s^2}$, as the planned (nominal) trajectory. For several burn days, compute $\boldsymbol{\Phi}_{rv}$ from the burn to the fixed arrival on day $270$. Then ask: what burn removes a $1\,\mathrm{km}$ miss at Mars, if the miss happens to lie in the most expensive direction? That worst case is $1\,\mathrm{km}$ divided by the **[[smallest singular value|worst-direction]]** of $\boldsymbol{\Phi}_{rv}$:

| Time left at the burn | Burn to remove a $1\,\mathrm{km}$ miss (worst direction) |
| --- | --- |
| $260\,\mathrm{d}$ | $1.65\,\mathrm{mm/s}$ |
| $220\,\mathrm{d}$ | $0.187\,\mathrm{mm/s}$ |
| $170\,\mathrm{d}$ | $0.118\,\mathrm{mm/s}$ |
| $120\,\mathrm{d}$ | $0.121\,\mathrm{mm/s}$ |
| $70\,\mathrm{d}$ | $0.177\,\mathrm{mm/s}$ |
| $30\,\mathrm{d}$ | $0.391\,\mathrm{mm/s}$ |
| $10\,\mathrm{d}$ | $1.159\,\mathrm{mm/s}$ |
| $1\,\mathrm{d}$ | $11.6\,\mathrm{mm/s}$ |

**The end is the worst place.** With $220$ days of leverage the burn is under $0.2\,\mathrm{mm/s}$. With one day left it is $11.6\,\mathrm{mm/s}$, about sixty times more.

**Sanity check with the short-step limit.** The state-transition-matrix lesson showed $\boldsymbol{\Phi}_{rv} \to \Delta t\,\mathbf{I}$ for a short remaining time $\Delta t$ ($\mathbf{I}$ is the identity matrix). With one day left, $\Delta t = 86\,400\,\mathrm{s}$, so the burn is $1\,\mathrm{km}/86\,400\,\mathrm{s} = 11.57\,\mathrm{mm/s}$. That matches the last row.

**Why is the first row expensive too?** The worst direction here is always out of the orbit plane — sideways, perpendicular to the path. At $260$ days to go, the remaining arc to Mars is about $175°$, close to half an orbit. A sideways push [[tilts the orbit plane about the line through the burn point|out-of-plane-return]], and $180°$ later the spacecraft comes back through the old plane anyway. So near half an orbit, a sideways push can hardly move the sideways arrival position. It is the $180°$ singularity from earlier in this module, showing up once more.

The lesson that carries over to every mission: waiting until the very end is always expensive, because $\boldsymbol{\Phi}_{rv}$ shrinks toward zero as the time left shrinks toward zero. The shape in the middle depends on the particular trajectory.
:::

## Why you still wait

Leverage alone says: correct as early as possible, right after launch. The other side of the trade is that you cannot fix an error you have not measured.

**Orbit determination** — working out the spacecraft's actual path from tracking data (radio ranging, Doppler shift and so on) — needs time. Measurements pile up over days, and only then is the departure error known well enough to be worth correcting. Burn too early, with a poorly known error, and you may be correcting noise: spending propellant to chase an error bar rather than a real error. Worse, the burn has its own execution error, which can be as large as the error it was meant to fix.

::: key Trajectory correction maneuvers
A TCM is a small burn that removes accumulated targeting error. Early TCMs are cheap because the error has not yet propagated into a large miss, but they must wait long enough for orbit determination to have converged — a genuine trade, not a preference.
:::

So real missions plan a **[[schedule of TCMs|tcm-schedule]]**: a first correction some days or weeks after launch, once tracking has pinned down the injection error; another near the middle of the cruise; and one or more shortly before arrival to clean up whatever the earlier burns, and their own execution errors, left behind. The exact days come from balancing leverage against navigation for that particular mission, not from a fixed rule.

## Linear covariance analysis

The leverage example used one miss. A real mission does not have one error. It has a whole cloud of possible errors, and it wants to know how that cloud grows and changes shape on the way to Mars.

One way is a **[[Monte Carlo|monte-carlo-name]]** simulation: draw thousands of random starting errors, fly each one with the full nonlinear dynamics, and look at the spread at the end. It works, but it is slow. There is a faster way.

### Describing a cloud of errors

Write the small state error at the start as $\delta\mathbf{x}_0$, a column of six numbers (three position, three velocity). Nobody knows its exact value — it is random. What we can describe is its spread, with a **[[covariance matrix|covariance-picture]]** $\mathbf{P}_0$:

$$
\mathbf{P}_0 = E\big[\delta\mathbf{x}_0\,\delta\mathbf{x}_0^{\top}\big] .
$$

Here $E[\cdot]$ is the **[[expected value|expected-value]]** — the average over many imagined repeats — and $^{\top}$ ("transpose") turns the column into a row, so $\delta\mathbf{x}_0\,\delta\mathbf{x}_0^{\top}$ is a $6\times6$ table of every product of two error components. The numbers on the diagonal are the **variances**: the square of the typical size ($1\sigma$, "one sigma") of each error. The numbers off the diagonal say how two errors tend to move together. We assume the errors average to zero (zero mean).

### Pushing the cloud forward

From the state-transition-matrix lesson, each individual error travels forward as $\delta\mathbf{x}_f = \boldsymbol{\Phi}(t_f,t_0)\,\delta\mathbf{x}_0$. Put that into the definition of the covariance at the end:

$$
\mathbf{P}_f = E\big[\delta\mathbf{x}_f\,\delta\mathbf{x}_f^{\top}\big] = E\big[\boldsymbol{\Phi}\,\delta\mathbf{x}_0\,\delta\mathbf{x}_0^{\top}\boldsymbol{\Phi}^{\top}\big] = \boldsymbol{\Phi}\,E\big[\delta\mathbf{x}_0\,\delta\mathbf{x}_0^{\top}\big]\,\boldsymbol{\Phi}^{\top} = \boldsymbol{\Phi}\,\mathbf{P}_0\,\boldsymbol{\Phi}^{\top} .
$$

Step by step: the first equality is the definition. The second uses $(\boldsymbol{\Phi}\,\delta\mathbf{x}_0)^{\top} = \delta\mathbf{x}_0^{\top}\boldsymbol{\Phi}^{\top}$ (transposing a product reverses the order). The third pulls $\boldsymbol{\Phi}$ outside the average, which is allowed because $\boldsymbol{\Phi}$ is fixed, not random, and averaging is linear. The last is the definition of $\mathbf{P}_0$.

::: key Linear covariance propagation
$$
\mathbf{P}_f = \boldsymbol{\Phi}(t_f,t_0)\,\mathbf{P}_0\,\boldsymbol{\Phi}(t_f,t_0)^{\top} .
$$
The same matrix that propagates one perturbation propagates a whole distribution's spread. It is valid exactly as far as the linearization holds, and is no substitute for a nonlinear Monte Carlo once dispersions grow large enough that it does not.
:::

To picture a covariance, take the $3\times3$ position block of $\mathbf{P}$. Its **eigenvalues** — the special stretch factors of the matrix — are the squares of the half-lengths (semi-axes) of the $1\sigma$ **uncertainty ellipsoid**, a stretched ball that the spacecraft is inside about as often as a $1\sigma$ error suggests.

::: example An injection error, stretched by a 600-million-kilometer cruise
Start with a modest, round error cloud at departure: $1\,\mathrm{km}$ in each position axis and $1\,\mathrm{m/s}$ in each velocity axis, $1\sigma$, with no correlations. So $\mathbf{P}_0$ has $1\,\mathrm{km^2}$ three times and $(0.001\,\mathrm{km/s})^2$ three times on its diagonal, and zeros elsewhere. Fly it along the same $270$-day Earth–Mars transfer, which covers about $608$ million kilometers of path.

Propagate $\mathbf{P}_0$ through $\boldsymbol{\Phi}$ and take the square roots of the eigenvalues of the position block:

| Elapsed time | Position $1\sigma$ semi-axes |
| --- | --- |
| $10\,\mathrm{d}$ | $860,\ 860,\ 873\,\mathrm{km}$ |
| $30\,\mathrm{d}$ | $2481,\ 2486,\ 2818\,\mathrm{km}$ |
| $270\,\mathrm{d}$ (arrival) | $708,\ 10\,394,\ 84\,204\,\mathrm{km}$ |

**Early on it is almost a ball.** At $10$ days the three axes are nearly equal. Check the size: a $1\,\mathrm{m/s}$ error for $10$ days gives $0.001 \times 864\,000\,\mathrm{s} = 864\,\mathrm{km}$. That matches, with small differences from the Sun's gravity curving the paths.

**By arrival it is a [[long, thin cigar|cigar-picture]].** The longest axis, $84\,204\,\mathrm{km}$, is about $120$ times the shortest, $708\,\mathrm{km}$ (since $84\,204/708 = 119$). The longest axis lies within about $24°$ of the direction of travel. That is timing error: a small speed error along the path adds up, day after day, into being early or late. The shortest axis is out of the orbit plane, the direction the $180°$ geometry squeezes.

This is the numerical reason the B-plane lesson kept a flyby's aim point separate from its arrival time: nearly all the uncertainty is in *when*, not *where across the path*.
:::

## From covariance to correction statistics

The same rule gives the size of the correction burn, with no new machinery. Left alone, the spacecraft's arrival miss is random, with a position covariance $\mathbf{P}_{r,f}$ — the position block of the $\mathbf{P}_f$ computed above. A TCM at time $t_c$ that removes that miss is $\delta\mathbf{v} = \boldsymbol{\Phi}_{rv}(t_f,t_c)^{-1}\,\delta\mathbf{r}_f$: a fixed matrix times a random vector. So its covariance follows the identical rule:

$$
\mathbf{P}_{\delta v} = \boldsymbol{\Phi}_{rv}^{-1}\,\mathbf{P}_{r,f}\,\big(\boldsymbol{\Phi}_{rv}^{-1}\big)^{\top} .
$$

(This assumes navigation has measured the error perfectly by the time of the burn. Real analyses add the navigation uncertainty and the burn's own execution error as extra covariance terms.)

::: key What linear covariance gives you
Linear covariance analysis propagates a covariance through the same STM that propagates the state, producing a predicted dispersion at the target (and the $\Delta v$ statistics of the correction) without running a Monte Carlo — valid only while the linearization holds.
:::

::: example How big should the TCM budget be?
Use the same $\mathbf{P}_0$ and the same $270$-day transfer. The arrival position covariance $\mathbf{P}_{r,f}$ has $1\sigma$ semi-axes $(708,\ 10\,394,\ 84\,204)\,\mathrm{km}$, from the last example.

**Burn on day 170.** That leaves $100$ days of leverage. Map $\mathbf{P}_{r,f}$ through $\boldsymbol{\Phi}_{rv}(270\,\mathrm{d},170\,\mathrm{d})^{-1}$. The burn's $1\sigma$ semi-axes come out to $(0.0954,\ 1.112,\ 9.277)\,\mathrm{m/s}$.

**One number for the budget.** Add the squares and take the root (the **root-sum-square**): $\sqrt{0.0954^2 + 1.112^2 + 9.277^2} = 9.34\,\mathrm{m/s}$, $1\sigma$.

**Other burn days.** The [[same calculation|tcm-cost]] for a single TCM on other days:

| Burn day | $1\sigma$ correction (root-sum-square) |
| --- | --- |
| $2$ | $2.13\,\mathrm{m/s}$ |
| $5$ | $13.96\,\mathrm{m/s}$ |
| $10$ | $1.89\,\mathrm{m/s}$ |
| $30$ | $1.84\,\mathrm{m/s}$ |
| $100$ | $4.31\,\mathrm{m/s}$ |
| $170$ | $9.34\,\mathrm{m/s}$ |
| $250$ | $49.2\,\mathrm{m/s}$ |

**Does it make sense?** Early on, the correction is about the size of the original velocity error, $\sqrt{3} \times 1\,\mathrm{m/s} = 1.73\,\mathrm{m/s}$ — the burn mostly undoes it before it grows. Later, the error has spread into a large miss and costs more and more to remove: $49\,\mathrm{m/s}$ with $20$ days left. That is the card's "early TCMs are cheap". The odd one out, day $5$, is the out-of-plane problem again: from day $5$ the remaining arc is $179.6°$, and a sideways push there can barely move the sideways arrival point. A real plan avoids burning at that point, or leaves the out-of-plane part for a later burn.

These numbers are not rules of thumb. They come from this mission's own injection error and this trajectory's own $\boldsymbol{\Phi}$, which is exactly what a propellant budget should be sized against — and not one random trajectory had to be simulated.
:::

::: warning Linear covariance is only as good as the linearization
Everything in this lesson rests on $\delta\mathbf{x}_f \approx \boldsymbol{\Phi}\,\delta\mathbf{x}_0$ being accurate. That holds well for the small, early errors of a well-controlled injection, which is why linear covariance is standard practice for TCM sizing and B-plane statistics. It stops being trustworthy when an error grows large, or when the path passes through strongly curved dynamics (a close planetary flyby, for instance), so that the second-order terms the linearization throws away matter. So linear covariance is the fast first answer, and a full nonlinear Monte Carlo, run closer to launch, confirms it rather than replacing it.
:::

## Closing the loop: Lambert inside a rendezvous

A TCM schedule is a loop: measure, predict the miss, compute a correction, burn, and measure again. The same loop, run much faster, is how a spacecraft chases another one in Earth orbit — a **rendezvous**. Here Lambert is the heart of the loop, turning "where I am, where the target will be, and when I want to get there" into a required velocity.

Each guidance cycle does four things:

1. **Predict the target.** Propagate the target's orbit forward to the chosen intercept time.
2. **Solve Lambert.** From the chaser's current navigated position to that predicted point, in the time remaining. This gives the velocity the chaser needs right now.
3. **Burn.** Apply the difference between the needed velocity and the current velocity.
4. **Repeat.** As navigation improves and time passes, go back to step 1 with the new state.

The re-solving is what matters. No burn is perfect and no model is exact. Each fresh Lambert solve starts from where the chaser really is, so it automatically absorbs the last burn's error and anything the two-body model left out.

::: key Lambert inside a rendezvous targeting loop
Propagate the target to a chosen intercept time, solve Lambert from the chaser's current state to that point, apply the first impulse, then re-solve every cycle as navigation improves. The repeated re-solve is what absorbs execution error and unmodelled dynamics.
:::

::: example One re-solve cleans up a sloppy burn
A target is in a circular orbit $400\,\mathrm{km}$ up. A chaser is in a circular orbit $350\,\mathrm{km}$ up, with the target $1°$ ahead. The plan is to intercept in $40$ minutes ($2400\,\mathrm{s}$).

**Cycle 1.** Propagate the target $2400\,\mathrm{s}$ ahead and solve Lambert. The first burn is $14.8\,\mathrm{m/s}$. Suppose the engine overburns by $1\%$.

**Open loop.** If nothing more is done, that $0.15\,\mathrm{m/s}$ error grows into a miss of $1.00\,\mathrm{km}$ at intercept.

**Cycle 2.** Halfway, after $1200\,\mathrm{s}$, navigation measures the chaser's actual state and Lambert is solved again for the remaining $1200\,\mathrm{s}$. The correction is only $0.62\,\mathrm{m/s}$. Even with the same $1\%$ execution error, the miss at intercept drops to about $10\,\mathrm{m}$.

**Does it make sense?** Each re-solve leaves only the $1\%$ error of a burn that is itself small, so the miss shrinks about a hundredfold per cycle ($1\,\mathrm{km}$ to $10\,\mathrm{m}$). Real guidance runs many cycles, which is why it converges on the target. [[Apollo|apollo-lambert]] flew its lunar-orbit rendezvous this way.
:::

## Check yourself

::: check
Without redoing any numbers, explain why the burn needed for a fixed miss must grow as the time left before arrival shrinks toward zero. Use the short-step limit of $\boldsymbol{\Phi}_{rv}$.
:::

::: answer
The state-transition-matrix lesson showed $\boldsymbol{\Phi}_{rv} \to \Delta t\,\mathbf{I}$ for a short remaining time $\Delta t$. So as the time left shrinks toward zero, $\boldsymbol{\Phi}_{rv}$ shrinks toward the zero matrix.

The burn is $\boldsymbol{\Phi}_{rv}^{-1}$ times the miss. Its inverse is about $\mathbf{I}/\Delta t$, which grows without bound as $\Delta t \to 0$. So the burn for any fixed miss grows without bound as the correction is put off toward the arrival time. In plain words: with no time left, no push, however big, can move you a kilometer.
:::

::: check
A navigation team says it cannot know the spacecraft's position to better than $50\,\mathrm{km}$ until at least five days after launch. Combined with the leverage argument, what does this say about the first TCM?
:::

::: answer
A burn before the position is known well means correcting against a poor estimate. It might remove real error, might chase noise, or some of both — and its own execution error adds fresh uncertainty on top.

Leverage says earlier is better, all else equal. So the right rule is not "burn as early as physically possible" but "burn as early as the navigation solution is trustworthy": here, at the five-day mark or later, not before — even though a burn on day one would in principle cost less per kilometer of real error. (In the Mars example, the out-of-plane geometry around day $5$ is also poor, which could push the burn a few days later still.)
:::

::: check
Using $\mathbf{P}_f = \boldsymbol{\Phi}\mathbf{P}_0\boldsymbol{\Phi}^{\top}$, show that $\mathbf{P}_f$ must be symmetric if $\mathbf{P}_0$ is.
:::

::: answer
Take the transpose. Transposing a product reverses the order and transposes each factor:

$$
\mathbf{P}_f^{\top} = \big(\boldsymbol{\Phi}\mathbf{P}_0\boldsymbol{\Phi}^{\top}\big)^{\top} = \big(\boldsymbol{\Phi}^{\top}\big)^{\top}\mathbf{P}_0^{\top}\boldsymbol{\Phi}^{\top} = \boldsymbol{\Phi}\mathbf{P}_0^{\top}\boldsymbol{\Phi}^{\top} .
$$

If $\mathbf{P}_0^{\top} = \mathbf{P}_0$, this is $\boldsymbol{\Phi}\mathbf{P}_0\boldsymbol{\Phi}^{\top} = \mathbf{P}_f$. So $\mathbf{P}_f$ is symmetric for any $\boldsymbol{\Phi}$. That makes a cheap test of a program: a computed $\mathbf{P}_f$ that is visibly not symmetric means a coding error, not physics. (In the example, the largest difference between $\mathbf{P}_f$ and its transpose was about $10^{-14}\,\mathrm{km^2}$, pure rounding.)
:::

::: check
Why does the position-uncertainty ellipsoid in the example become a long, thin cigar by arrival, instead of staying round like it started?
:::

::: answer
The starting cloud includes a velocity error in every direction. A velocity error along the direction of travel makes the spacecraft early or late, and that along-the-path position error grows roughly in proportion to elapsed time, compounding over the whole cruise. Velocity errors in the other directions have much less room to grow: gravity pulls sideways and out-of-plane errors back toward the path, and after about half an orbit the out-of-plane error nearly returns to zero.

So one direction of the ellipsoid grows far faster than the others, giving the long, thin shape — about $120$ to $1$ in the example. It is the same effect that makes teams target in the B-plane, keeping the well-behaved geometric miss apart from the poorly behaved timing error.
:::

::: check
A colleague proposes skipping linear covariance analysis and going straight to a full Monte Carlo simulation for every TCM sizing question. What is lost by doing only that?
:::

::: answer
A Monte Carlo is more accurate once nonlinearity matters. But it is far more expensive — thousands of full nonlinear trajectory runs instead of one matrix propagation — and it gives less insight into *why* the result comes out as it does, because it does not hand you the sensitivity structure ($\boldsymbol{\Phi}_{rv}$ and its blocks) that the linear analysis gives directly. That structure is what showed, for instance, that day $5$ is a bad day to burn.

Skipping the linear analysis throws away a fast, cheap, explanatory first answer, useful for quick trade studies and for planning the Monte Carlo itself. Most missions run both, using the linear result to plan and interpret the Monte Carlo rather than replacing one with the other.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\delta\mathbf{v}(t_c) = \boldsymbol{\Phi}_{rv}(t_f,t_c)^{-1}\delta\mathbf{r}_f$ | TCM that removes a predicted arrival miss; cheaper with more leverage (larger $\boldsymbol{\Phi}_{rv}$) |
| $\boldsymbol{\Phi}_{rv}\to\Delta t\,\mathbf{I}$ | Short-step limit: a correction with no time left is unboundedly expensive |
| TCM timing trade | Leverage favors early; orbit-determination convergence favors waiting |
| $\mathbf{P} = E[\delta\mathbf{x}\,\delta\mathbf{x}^{\top}]$ | Covariance: variances on the diagonal, correlations off it |
| $\mathbf{P}_f = \boldsymbol{\Phi}\mathbf{P}_0\boldsymbol{\Phi}^{\top}$ | Linear covariance propagation; symmetric if $\mathbf{P}_0$ is |
| Along-track stretching | A round injection error becomes a long, thin ellipsoid along the path |
| $\mathbf{P}_{\delta v} = \boldsymbol{\Phi}_{rv}^{-1}\mathbf{P}_{r,f}(\boldsymbol{\Phi}_{rv}^{-1})^{\top}$ | Correction-burn statistics without a Monte Carlo ($9.34\,\mathrm{m/s}$ $1\sigma$ for a day-170 TCM in the example) |
| Rendezvous loop | Predict target, solve Lambert, burn, re-solve every cycle |
| Validity | Only as good as the linearization; confirm with a nonlinear Monte Carlo |

Every lesson in this module has built toward one picture. Lambert gives the first guess. The state transition matrix says how sensitive that guess is. Differential correction, B-plane targeting, TCM planning and rendezvous guidance are all the same Newton step — measure the miss, divide by the sensitivity, burn — applied wherever the mission needs it, and repeated until the spacecraft arrives.

::: context dispersion-word What "dispersion" means
To **disperse** is to spread out, like seeds scattered by the wind. In mission design, the **dispersion** is how far the real trajectory may spread from the planned one, taking every source of error together: the launch vehicle's aim, the engine's burn, the navigation estimate, the forces the model leaves out. Engineers talk about "$3\sigma$ dispersions", meaning a spread large enough to cover almost every case the mission expects.
:::

::: context worst-direction The worst direction of a matrix
A $3\times3$ matrix like $\boldsymbol{\Phi}_{rv}$ turns a ball of possible burns into an ellipsoid of possible arrival shifts. The half-lengths of that ellipsoid, per unit of burn, are the matrix's **singular values**. The shortest one marks the direction in which a burn moves the arrival point least, so a miss in that direction is the most expensive to fix. Dividing $1\,\mathrm{km}$ by the smallest singular value gives the worst-case burn.
:::

::: context out-of-plane-return Why a sideways push fades after half an orbit
A small sideways push tilts the orbit plane slightly, like tilting a hula hoop about a line through your hand. Both the old and the new plane contain the burn point and the Sun, so they cross along that line. Half an orbit later the spacecraft is back on that line — back in the old plane. So at a $180°$ remaining arc, a sideways push cannot move the sideways arrival position at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="75" rx="140" ry="30" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <ellipse cx="180" cy="75" rx="140" ry="55" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 3"/>
  <line x1="40" y1="75" x2="320" y2="75" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="180" cy="75" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="40" cy="75" r="5" fill="#1f2a44"/>
  <circle cx="320" cy="75" r="5" fill="#1f2a44"/>
  <text x="44" y="98" font-size="11" fill="#1f2a44">burn point</text>
  <text x="270" y="98" font-size="11" fill="#1f2a44">180° later</text>
  <text x="180" y="13" font-size="11" fill="#b4232c" text-anchor="middle">tilted orbit after push</text>
  <text x="180" y="120" font-size="11" fill="#1d6fd1" text-anchor="middle">original orbit</text>
  <text x="180" y="145" font-size="11" fill="#6c7a93" text-anchor="middle">the two planes share this line</text>
</svg>
```
:::

::: context tcm-schedule How real missions plan their TCMs
Mars landers typically plan about five or six TCMs. The first comes a few weeks after launch; others follow through the cruise; the last come in the final days or hours before atmospheric entry, to put the spacecraft into a narrow entry corridor. A planned TCM is often canceled when navigation shows the trajectory is already good enough, because every burn adds its own small error — and uses propellant.
:::

::: context monte-carlo-name Why it is called Monte Carlo
The name comes from the Monte Carlo casino in Monaco, a nod to rolling dice. Stanislaw Ulam and John von Neumann developed the method at Los Alamos in the 1940s: when a problem is too tangled to solve with formulas, run it many times with random inputs and look at the spread of the results. In spaceflight, a Monte Carlo campaign might fly ten thousand simulated trajectories, each with a different random launch error, engine error and navigation error.
:::

::: context covariance-picture Reading a covariance matrix
For two errors, say $x$ and $y$ positions, the covariance matrix is
$$
\mathbf{P} = \begin{bmatrix} \sigma_x^2 & \rho\,\sigma_x\sigma_y \\ \rho\,\sigma_x\sigma_y & \sigma_y^2 \end{bmatrix} .
$$
The diagonal holds the squared spreads. The off-diagonal holds how the two move together: the correlation $\rho$ ("rho") is between $-1$ and $1$. If $\rho = 0$ the $1\sigma$ ellipse lines up with the axes; if $\rho$ is near $\pm1$ it becomes a thin tilted streak, because knowing one error nearly tells you the other.
:::

::: context expected-value The expected value, read aloud
$E[X]$ is read "the expected value of $X$", or "E of $X$". It is the average you would get if you could repeat the random experiment endlessly — the long-run average score from rolling a die is $3.5$, even though no single roll gives $3.5$. Averaging is linear, which is the one property the covariance derivation needs: the average of a fixed number times a random thing is that fixed number times the average.
:::

::: context cigar-picture The error cloud at Mars, to scale
The in-plane $1\sigma$ ellipse at arrival, drawn to scale with the direction of travel horizontal: $84\,204\,\mathrm{km}$ by $10\,394\,\mathrm{km}$, its long axis turned about $24°$ from the path. The cloud after ten days, about $1700\,\mathrm{km}$ across, would be a dot barely $3$ pixels wide at this scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polygon points="350,80 340,75 340,85" fill="#6c7a93"/>
  <ellipse cx="180" cy="80" rx="150" ry="18.5" transform="rotate(-23.6 180 80)" fill="#8fb8f0" fill-opacity="0.6" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="180" cy="80" r="1.5" fill="#1f2a44"/>
  <text x="262" y="100" font-size="11" fill="#6c7a93">direction of travel</text>
  <text x="250" y="22" font-size="11" fill="#1d6fd1">84 204 km</text>
  <text x="20" y="150" font-size="11" fill="#1f2a44">1σ: 84 204 km by 10 394 km</text>
</svg>
```
:::

::: context tcm-cost The cost of one TCM, day by day
The $1\sigma$ correction for a single TCM against its day, on a logarithmic scale, for the example injection error. Cheapest in the first weeks; rising steadily as the miss grows; a sharp spike near day $5$, where the remaining arc is almost exactly $180°$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="190" x2="345" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="45" y1="190" x2="45" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 3">
    <line x1="45" y1="121.4" x2="345" y2="121.4"/><line x1="45" y1="52.7" x2="345" y2="52.7"/>
  </g>
  <path d="M47.2,167.5 L50.6,111.4 L56.1,171.0 L67.2,174.7 L78.3,171.8 L111.7,160.6 L156.1,146.5 L200.6,133.4 L233.9,123.4 L267.2,111.6 L300.6,94.5 L322.8,73.9 L333.9,53.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1d6fd1">
    <circle cx="47.2" cy="167.5" r="3"/><circle cx="50.6" cy="111.4" r="3"/><circle cx="56.1" cy="171.0" r="3"/><circle cx="67.2" cy="174.7" r="3"/><circle cx="78.3" cy="171.8" r="3"/><circle cx="111.7" cy="160.6" r="3"/><circle cx="156.1" cy="146.5" r="3"/><circle cx="200.6" cy="133.4" r="3"/><circle cx="233.9" cy="123.4" r="3"/><circle cx="267.2" cy="111.6" r="3"/><circle cx="300.6" cy="94.5" r="3"/><circle cx="322.8" cy="73.9" r="3"/><circle cx="333.9" cy="53.3" r="3"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="41" y="194">1</text><text x="41" y="125">10</text><text x="41" y="57">100</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="204">0</text><text x="145" y="204">90</text><text x="245" y="204">180</text><text x="345" y="204">270 d</text>
  </g>
  <text x="58" y="104" font-size="11" fill="#b4232c">day 5: 14 m/s</text>
  <text x="200" y="160" font-size="11" fill="#1f2a44">burn day</text>
  <text x="52" y="26" font-size="11" fill="#1f2a44">1σ TCM size (m/s)</text>
</svg>
```
:::

::: context apollo-lambert Lambert in the Apollo computer
The Apollo Guidance Computer carried a Lambert routine. During lunar-orbit rendezvous, the rendezvous programs used it to compute the transfer burn that would bring the ascending lunar module to the command module, and then small midcourse corrections re-solved the problem from the latest navigation data — the loop in this section. The Space Shuttle later used Lambert targeting for its rendezvous burns too.
:::
