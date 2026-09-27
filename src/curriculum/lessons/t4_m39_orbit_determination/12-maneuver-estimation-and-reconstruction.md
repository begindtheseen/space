---
id: l12-maneuver-estimation-and-reconstruction
title: Maneuver estimation and reconstruction
minutes: 24
covers:
  - Maneuver estimation and reconstruction
---

Picture a toy car rolling across the kitchen floor. You film it, and from the video you draw its path: a straight line at a steady speed. Now suppose that, halfway across, your little brother gives it a quick flick with his finger. The car keeps rolling, a bit faster. If you did not see the flick and still insist on drawing one straight line through the whole video, your line fits nothing well. It is too slow at the end, too fast at the start, and it sits in the wrong place almost everywhere. Worse, the line looks perfectly confident. A straight line has no way to say "something happened in the middle".

Satellites get flicked too. A **maneuver** is a deliberate firing of the spacecraft's thrusters that changes its velocity. Operators maneuver for **[[stationkeeping|stationkeeping]]** — nudging a satellite back into its assigned slot — to dodge debris, to change the phase of an orbit, or to lower a dead satellite for disposal. Sometimes the ground team that does the tracking is not the team that fired the thrusters. Then the only way they learn about the burn is from the tracking data itself.

Every fit so far in this module assumed one set of dynamics for the whole arc (an **arc** is the stretch of time the tracking data covers). A maneuver breaks that assumption. It is not measurement noise. It is not quite the slow, smeared-out unmodeled force that the process-noise lesson was built for either. It is a real, sudden change to the velocity at one moment you can name. This lesson shows what goes wrong when it is missed, and the two standard ways to handle it.

## What a small burn does to an orbit

Start with the size of the thing. The change in velocity a burn gives is written $\Delta\mathbf v$, read "delta v": delta ($\Delta$) is the Greek letter for "change in". Big burns, such as moving to a new orbit, are hundreds of metres per second. A stationkeeping touch can be a few centimetres per second — slower than a snail crossing a sidewalk.

Most thruster firings last seconds to minutes, while an orbit takes an hour and a half. So we model the burn as **[[impulsive|impulsive-burn]]**: the velocity jumps by $\Delta\mathbf v$ at one instant $t_m$ ("t sub m", the maneuver time), and the position does not jump at all. Position cannot change in zero time; velocity, in this model, can.

Why should a few centimetres per second matter? Because orbits turn a tiny speed change into a large distance, the same way the RIC lesson showed a tiny error in semi-major axis turning into a long in-track error.

::: example Fifty millimetres per second in low orbit
Take the module's usual satellite: a near-circular orbit with semi-major axis $a = 6798\,\mathrm{km}$, about $420\,\mathrm{km}$ up. Its speed is $v = \sqrt{\mu/a} \approx 7657\,\mathrm{m/s}$ and its period is about $93.0$ minutes. A burn adds $\Delta v = 0.05\,\mathrm{m/s}$ straight along the direction of motion.

**Step 1: the new orbit size.** For a near-circular orbit, a small push along the velocity changes the semi-major axis by $\Delta a = 2a\,\Delta v / v$. (The note below says where that comes from.) So

$$
\Delta a = \frac{2 \times 6.798\times10^{6} \times 0.05}{7657} \approx 88.8\,\mathrm m.
$$

The orbit got about $89\,\mathrm m$ bigger — a tiny change on a $6798\,\mathrm{km}$ orbit.

**Step 2: the drift.** A bigger orbit has a longer period, so the satellite slowly slips behind where the old orbit says it should be. Each revolution it drifts along-track by $3\pi\,\Delta a$:

$$
3\pi \times 88.8\,\mathrm m \approx 837\,\mathrm m \text{ per orbit}.
$$

**Step 3: over a day.** There are about $15.5$ orbits in a day, so the drift piles up to about $837 \times 15.5 \approx 13\,000\,\mathrm m$, or $13\,\mathrm{km}$.

**Sanity check.** A tracking station measures range to about $5\,\mathrm m$. A burn that moves the satellite hundreds of metres within one orbit is more than a hundred times that noise. The data cannot miss it — so if the model misses it, the fit must bend somewhere else to cope.
:::

::: note Why it has to be true
Vis-viva says $v^2 = \mu\,(2/r - 1/a)$. Hold $r$ fixed (the burn is instantaneous, so the position does not move) and take a small change on both sides: $2v\,\Delta v = \mu\,\Delta a / a^2$. So $\Delta a = 2a^2 v\,\Delta v/\mu$. On a circular orbit $\mu = a v^2$, which turns this into $\Delta a = 2a\,\Delta v / v$.

For the drift, Kepler's third law linearized (the RIC lesson) says the period grows by $\Delta T/T = \tfrac32\,\Delta a/a$. Each orbit the satellite arrives late by $\Delta T$, and while late it is missing a distance $v\,\Delta T = v\,T \cdot \tfrac32\,\Delta a/a$. Since $vT = 2\pi a$ on a circle, that is $2\pi a \cdot \tfrac32\,\Delta a / a = 3\pi\,\Delta a$.
:::

Notice which way it drifts. A forward push makes the satellite **[[fall behind|speed-up-fall-behind]]** over time, not pull ahead. That surprises everyone the first time.

## What happens if nobody notices

Here is the flick-and-straight-line problem with real tracking data. The example is a full simulation: the same three-pass arc from one station used throughout this module, with range noise of $5\,\mathrm m$.

::: example An unnoticed five-centimetre-per-second burn, and a confidently wrong answer
A true velocity change of $50\,\mathrm{mm/s}$ is applied to the truth trajectory between the second and third passes. The fit uses ordinary two-body-plus-J2 dynamics that know nothing about it. The batch loop converges, and reports:

```python
# epoch state error:      dr = (-2661, 926, 1218) m        dv = (-771, -6194, -75) mm/s
# formal sigma:            dr = (0.21, 0.11, 0.10) m        dv = (0.053, 0.71, 0.075) mm/s
# |error| / |sigma|, worst component: about 14,500
```

Read the first line. The epoch position is wrong by **kilometres**, and the epoch velocity by metres per second. Read the second line. The fit's own covariance claims it knows the position to about $0.2\,\mathrm m$ and the velocity to under $1\,\mathrm{mm/s}$.

Divide one by the other. In the first velocity component, $771 / 0.053 \approx 14\,500$: the real error is about fourteen and a half thousand times the **[[formal sigma|formal-sigma]]**. The iteration gave no sign of distress. It converged, cleanly, to the wrong answer.
:::

What happened? Least squares did exactly what it always does. The dynamics it was given cannot match both the early data and the late data, so it found a compromise epoch state that splits the difference — bending the whole arc to half-fit both sides. Then it reported a covariance built only from the random measurement noise. Nothing in that covariance allows for the chance that the dynamics themselves are wrong. So it is not just too small. It is too small by four **[[orders of magnitude|orders-of-magnitude]]**.

A ratio of $2$ or $3$ between error and sigma is ordinary bad luck: a correctly built fit lands there now and then. A ratio in the thousands is never luck. It means the covariance is describing a different problem from the one the data came from.

::: key Maneuver estimation
Either solve for an impulsive delta-v at a known epoch as extra state parameters, or detect the maneuver from a residual break and split the arc. An undetected maneuver is the classic cause of a wildly optimistic covariance.
:::

## Solving for the maneuver directly

### The idea on a kitchen floor

Go back to the toy car. Say it starts at $x = 0$ and rolls at $2\,\mathrm{m/s}$, and the flick at $t_m = 2.5\,\mathrm s$ adds $1\,\mathrm{m/s}$. Positions measured once a second are $0,\ 2,\ 4,\ 6.5,\ 9.5,\ 12.5$ metres.

Fit a straight line $x = x_0 + v_0 t$ to them, and least squares gives $x_0 = -0.5\,\mathrm m$ and $v_0 = 2.5\,\mathrm{m/s}$. Both are wrong. The misses, measured minus fitted, are

$$
+0.5,\ 0,\ -0.5,\ -0.5,\ 0,\ +0.5\ \mathrm m.
$$

They are not random. They make a **[[smile|residual-smile]]**: high at the ends, low in the middle. A pattern in the residuals is the data telling you the model is missing something.

Now give the model the missing piece. Add a third unknown, the jump $\Delta v$, which only matters after $t_m$:

$$
x(t) = x_0 + v_0\,t + \Delta v \cdot \max(0,\ t - t_m).
$$

Here $\max(0,\ t - t_m)$ means "zero before the flick, and the time since the flick after it". Each measurement's row in the fit now has three entries: $1$, $t$, and $\max(0,\ t - t_m)$. The first three rows have a zero in the last column — before the flick, nothing depends on it yet. Solve, and least squares returns $x_0 = 0$, $v_0 = 2$ and $\Delta v = 1$ exactly, with every residual zero. Nothing about the method changed. The model just grew one column.

### The same move for an orbit

For a satellite, the unknowns were six numbers: the epoch position and velocity. If you know roughly when a maneuver happened — from a rising edit rate after some moment, as in the residual-editing lesson's example, or from the operator's report — add the three components of $\Delta\mathbf v$ as three more unknowns. The state grows from six to nine. Each extra unknown is a **[[solve-for parameter|solve-for]]**: something the fit estimates, rather than holds fixed.

Each measurement then needs its sensitivity — its row of partial derivatives — to those three new numbers. For a measurement at time $t$ after the burn, it is

$$
\frac{\partial y(t)}{\partial\,\Delta\mathbf v} = \mathbf H(t)\,\boldsymbol\Phi(t,t_m)\begin{pmatrix}\mathbf 0\\ \mathbf I\end{pmatrix}.
$$

Read it right to left. The block $\begin{pmatrix}\mathbf 0\\ \mathbf I\end{pmatrix}$ is a $6\times3$ **[[selector|selector-matrix]]**: three rows of zeros on top of a $3\times3$ identity. It turns the three numbers of $\Delta\mathbf v$ into a six-number state change with no position part and all velocity part — exactly what an impulsive burn is. Then $\boldsymbol\Phi(t,t_m)$, the state transition matrix from the burn to the measurement, carries that change forward to time $t$. Then $\mathbf H(t)$, the measurement partial, turns a state change at $t$ into a change in the measured number.

For a measurement *before* $t_m$ the row is zero, like the first three rows of the toy car. The epoch-state columns stay what they always were, $\mathbf H(t)\,\boldsymbol\Phi(t,t_0)$. Across the burn, $\boldsymbol\Phi$ chains the way the batch lesson allowed: $\boldsymbol\Phi(t,t_0) = \boldsymbol\Phi(t,t_m)\,\boldsymbol\Phi(t_m,t_0)$.

::: note Why it has to be true
Let $\delta\mathbf x$ be a small change in the six-number state. Before the burn it travels as usual: $\delta\mathbf x(t_m^-) = \boldsymbol\Phi(t_m,t_0)\,\delta\mathbf x_0$, where $t_m^-$ means "just before $t_m$". The burn adds to the velocity only, so just after it

$$
\delta\mathbf x(t_m^+) = \boldsymbol\Phi(t_m,t_0)\,\delta\mathbf x_0 + \begin{pmatrix}\mathbf 0\\ \mathbf I\end{pmatrix}\delta(\Delta\mathbf v).
$$

From there on the dynamics are ordinary again, so $\delta\mathbf x(t) = \boldsymbol\Phi(t,t_m)\,\delta\mathbf x(t_m^+)$. Multiply by $\mathbf H(t)$ to get the change in the measurement. The coefficient of $\delta\mathbf x_0$ is $\mathbf H(t)\,\boldsymbol\Phi(t,t_m)\,\boldsymbol\Phi(t_m,t_0) = \mathbf H(t)\,\boldsymbol\Phi(t,t_0)$, and the coefficient of $\delta(\Delta\mathbf v)$ is $\mathbf H(t)\,\boldsymbol\Phi(t,t_m)\begin{pmatrix}\mathbf 0\\ \mathbf I\end{pmatrix}$. Those are the two sets of columns.
:::

::: example Recovering the burn
Same contaminated three-pass arc as before, now fitted with a nine-number state: epoch position, epoch velocity, and $\Delta\mathbf v$ at the burn time. The batch loop reports:

```python
# it 0: RMS range  477.8 m   |dv correction|  49.7 mm/s
# it 1: RMS range    5.2 m   |dv correction|  15.1 mm/s
# it 2: RMS range    5.0 m   |dv correction| 1.1e-05 mm/s   <- converged
#
# estimated dv (mm/s): (46.80, 14.84, -10.29)     true dv (mm/s): (46.29, 14.52, -12.12)
# |dv error|: 1.9 mm/s                             formal sigma on dv: (1.3, 2.2, 2.6) mm/s
# pre-maneuver epoch state error: 0.39 m, -0.03 m, 0.38 m (position); sub-mm/s to ~1 mm/s (velocity)
```

**The residuals.** In three iterations the range RMS falls from $478\,\mathrm m$ to $5.0\,\mathrm m$. That is the injected noise level, which is what a correct model should leave behind.

**The burn.** The errors, estimate minus truth, are $0.51$, $0.32$ and $1.83\,\mathrm{mm/s}$. Divide each by its formal sigma: $0.51/1.3 \approx 0.39$, $0.32/2.2 \approx 0.15$ and $1.83/2.6 \approx 0.70$. All under one sigma. The covariance is honest again.

**The epoch state.** Position is now right to about half a metre, against about $3\,\mathrm{km}$ before. Adding three columns to the model bought back a factor of several thousand.
:::

In real operations the team that planned the burn usually shares it. Then the planned $\Delta\mathbf v$ becomes the fit's starting guess, with an *a priori* uncertainty — one stated before any tracking data arrives — sized to how well thrusters actually **[[perform the plan|execution-error]]**, and the tracking data corrects it.

## Detecting it instead: splitting the arc

Sometimes nobody knows when the burn happened, or there are several suspicious moments to test. Then there is a second method, **arc splitting**. Pick a candidate split time. Fit the data before it on its own, and the data after it on its own. Propagate both answers to the split time and compare them there.

- **Position** should agree. An impulsive burn cannot move the satellite instantly, so $\hat{\mathbf r}^+ \approx \hat{\mathbf r}^-$ within the two fits' combined uncertainty. (A hat, as in $\hat{\mathbf r}$, "r hat", marks an estimate; the $-$ and $+$ mark the fits before and after the split.)
- **Velocity** may jump. If the split is at a real burn, the jump is the burn:

$$
\Delta\hat{\mathbf v} = \hat{\mathbf v}^+ - \hat{\mathbf v}^-, \qquad \mathbf P_{\Delta v} = \mathbf P^-_{vv} + \mathbf P^+_{vv}.
$$

Here $\mathbf P^-_{vv}$ and $\mathbf P^+_{vv}$ are the velocity blocks of the two fits' covariances. They simply add, because the two fits used separate data and so their errors are independent — the same rule as adding the variances of two independent dice.

::: example Is that jump real?
Two independent fits meet at a split time. Along-track, the "after" fit's velocity is $48\,\mathrm{mm/s}$ larger than the "before" fit's. The before-fit's velocity sigma along-track is $6\,\mathrm{mm/s}$; the after-fit's is $8\,\mathrm{mm/s}$.

**Combined uncertainty.** Variances add: $6^2 + 8^2 = 100$, so the sigma of the difference is $\sqrt{100} = 10\,\mathrm{mm/s}$.

**How big is the jump?** $48 / 10 = 4.8$ sigma. A jump that large happens by chance less than once in a hundred thousand tries, so this is a real burn of about $48 \pm 10\,\mathrm{mm/s}$.

**Position check.** The two propagated positions differ by $1.2\,\mathrm m$ along-track, and the combined position sigma is $2.0\,\mathrm m$. That is $0.6$ sigma — consistent with no jump, as it must be. Both checks pass, so the split is believable.

**Sense check.** Had the two positions disagreed by, say, $10$ sigma, the split time would be wrong, or there would be two events, or one side's fit would be biased. The velocity jump could not be trusted until that was sorted out.
:::

::: warning Arc splitting needs enough data on each side
Try this on the three-pass arc with the split before the third pass, and it fails. The "after" side has one isolated pass: $39$ observations, one station, one geometry. The tracking-geometry lesson already showed what that means. One lone pass leaves the normal equations with a condition number $\operatorname{cond}(\widetilde{\mathbf H})$ of order $10^9$ — a sign that some combinations of the state are barely seen at all. The fit diverges, whatever the starting guess.

That is not a flaw in the idea. It is the observability lesson again, now costing you a maneuver instead of an epoch state. Each side of a split has to be well observed *on its own* — several passes, or good station geometry — before comparing the two sides means anything. Solving for $\Delta\mathbf v$ directly does not have this weakness, because the whole arc, both sides at once, pins down the single set of burn parameters.
:::

::: key Two methods, one failure to watch for
Solve directly for an impulsive $\Delta\mathbf v$ at a known or suspected time when the whole arc can be fitted together; it shares information across all the data and copes with a thin side. Split the arc and compare the two fits at the boundary when the timing is unknown and has to be found, but only when each side can support a fit on its own. An undetected maneuver, handled by neither method, gives a covariance that looks fine and is not.
:::

## Check yourself

::: check
Explain why the sensitivity of a post-maneuver measurement to $\Delta\mathbf v$ is $\mathbf H(t)\,\boldsymbol\Phi(t,t_m)\begin{pmatrix}\mathbf 0\\ \mathbf I\end{pmatrix}$ rather than $\mathbf H(t)\,\boldsymbol\Phi(t,t_m)$ alone.
:::

::: answer
$\Delta\mathbf v$ changes the velocity only, at the instant $t_m$; it does nothing to position at that instant. $\boldsymbol\Phi(t,t_m)$ takes a full six-number state change at $t_m$ forward to $t$, so it needs a six-number input. The selector $\begin{pmatrix}\mathbf 0\\ \mathbf I\end{pmatrix}$ builds that input from the three numbers of $\Delta\mathbf v$: zeros for position, $\Delta\mathbf v$ for velocity. Multiplying $\boldsymbol\Phi$ by it keeps only $\boldsymbol\Phi$'s three right-hand (velocity) columns — the blocks the batch lesson called $\partial\mathbf r/\partial\mathbf v_0$ and $\partial\mathbf v/\partial\mathbf v_0$, now started from $t_m$ instead of the epoch. $\mathbf H(t)\,\boldsymbol\Phi(t,t_m)$ alone would be a row of six numbers, not three, and would wrongly let the burn move the position.
:::

::: check
The unnoticed-burn example had an error-to-sigma ratio of about $14\,500$ in one component. What does a ratio that large tell you that a ratio of $3$ would not?
:::

::: answer
A ratio of a few is within ordinary chance for a correctly built fit: it says the covariance is basically honest and this run was a little unlucky. A ratio in the thousands cannot come from chance under any sensible noise model. It says the covariance itself is wrong — the fit is solving a different problem from the one that made the data — and it points at a structural cause, such as an unmodeled force or event, rather than at noise. That is why the residual-editing lesson treats a large, structured error as a modeling signal to fix, not something to average away.
:::

::: check
Why is the position check in arc splitting — $\hat{\mathbf r}^+$ and $\hat{\mathbf r}^-$ agreeing at the split time — useful on its own, apart from the velocity jump?
:::

::: answer
An impulsive burn changes velocity at once but leaves position continuous, since position cannot jump in zero time. So if the two fits' positions at the split time disagree by more than their combined uncertainty, something other than one clean, correctly timed burn is going on: the split time may be off, there may be two events, or one side's fit may be biased by bad data or an unmodeled force. The check catches that before anyone trusts the estimated $\Delta\mathbf v$.
:::

::: check
A satellite at $a = 6798\,\mathrm{km}$ (speed $7657\,\mathrm{m/s}$) makes an along-track burn of $0.2\,\mathrm{m/s}$. Estimate how much its semi-major axis changes and how far it drifts along-track per orbit. Which way does it drift?
:::

::: answer
$\Delta a = 2a\,\Delta v/v = 2 \times 6.798\times10^{6} \times 0.2 / 7657 \approx 355\,\mathrm m$. The drift per orbit is $3\pi\,\Delta a \approx 3\pi \times 355 \approx 3350\,\mathrm m$, about $3.3\,\mathrm{km}$. Both are four times the $50\,\mathrm{mm/s}$ example, as they should be, because the burn is four times bigger and everything here is proportional to it. A forward burn raises the orbit and lengthens the period, so the satellite drifts *behind* where the old orbit predicted.
:::

::: check
A team suspects a satellite maneuvered during a data gap but does not know when. Using this lesson and the residual-editing lesson, describe a sensible way to find out.
:::

::: answer
First fit the whole arc with ordinary dynamics and study the residuals, as in the residual-editing lesson. A rising edit rate or a steady trend that starts after some moment is the signature, and it narrows down roughly when the event happened before anything new is solved for. With that window, either add a solve-for $\Delta\mathbf v$ at a trial time inside it — robust even when one side has little data — or, if both sides have enough independent data, split the arc at candidate times to pin down the timing and cross-check the solve-for answer. In either case, confirm that the post-fit residuals become noise-like once the maneuver is in the model, not only that the iteration converged.
:::

## Summary

| Symbol or idea | Meaning |
| --- | --- |
| $\Delta\mathbf v$ at $t_m$ | Impulsive burn: velocity jumps at one instant, position does not |
| $\Delta a = 2a\,\Delta v/v$ | Change in orbit size from a small along-track burn, near-circular orbit |
| $3\pi\,\Delta a$ per orbit | Along-track drift that follows; a forward burn makes the satellite fall behind |
| Undetected maneuver | Converges to a confidently wrong state; formal sigma can be $10^3$–$10^4$ times too small |
| $\mathbf H(t)\,\boldsymbol\Phi(t,t_m)\begin{pmatrix}\mathbf 0\\ \mathbf I\end{pmatrix}$ | Sensitivity of a post-burn measurement to a solved-for $\Delta\mathbf v$; zero before $t_m$ |
| Solve-for $\Delta\mathbf v$ | Whole arc fitted together; copes with sparse data on one side |
| $\Delta\hat{\mathbf v} = \hat{\mathbf v}^+ - \hat{\mathbf v}^-$, $\mathbf P^-_{vv} + \mathbf P^+_{vv}$ | Arc splitting: the jump between two independent fits, and its covariance |
| $\hat{\mathbf r}^+ \approx \hat{\mathbf r}^-$ | Position continuity check on the impulsive-burn assumption |

Every method so far has treated one object's orbit on its own. The last lesson looks at what changes when several spacecraft are estimated together — and when a spacecraft has to work out its own orbit, with no ground team watching.

::: context stationkeeping Staying in your parking space
A satellite is often assigned a place: a slot of longitude over the equator for a geostationary TV satellite, or a spot in a planned pattern for a constellation. Small forces — the Sun's and Moon's pull, the lumpy Earth, thin air in low orbit, sunlight pressure — slowly push it out. **Stationkeeping** is the routine of small burns that push it back. A geostationary satellite typically spends tens of metres per second of $\Delta v$ a year on it, in many small firings, which is why its propellant load often sets how long its working life is.
:::

::: context impulsive-burn A burn short enough to call instant
A real burn has a start and an end. The model squeezes it into one instant, which is fine when the burn is short next to the orbit's period.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="120" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330" y="138" font-size="12" fill="#1f2a44" text-anchor="end">time</text>
  <text x="46" y="24" font-size="12" fill="#1f2a44">speed</text>
  <polyline points="40,95 180,95 180,55 340,55" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="40,95 160,95 200,55 340,55" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="180" y1="120" x2="180" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="138" font-size="12" fill="#1f2a44" text-anchor="middle">t_m</text>
  <text x="240" y="47" font-size="12" fill="#1d6fd1">impulsive model</text>
  <text x="212" y="80" font-size="12" fill="#b4232c">real finite burn</text>
</svg>
```

When a burn lasts a sizeable part of an orbit — a long, low-thrust electric-propulsion burn, for example — the jump model is too crude, and the fit instead solves for a thrust acceleration spread over the burn's duration.
:::

::: context speed-up-fall-behind Why pushing forward makes you lose ground
It sounds backward, but it is right. The forward push adds energy, and the extra energy lifts the orbit. A higher orbit is a slower orbit: the satellite gains a little height on the far side, trades its speed for that height, and takes longer to go round. So a moment after the burn it is a hair ahead, but after each full lap it is about $3\pi\,\Delta a$ behind. Astronauts chasing the space station learn the same rule: to catch up with something ahead of you, you first drop to a *lower*, faster orbit.
:::

::: context formal-sigma Formal means "according to the math"
The **formal** covariance, and the sigmas taken from it, are what the estimator's own equations say, assuming every model it was given is exactly right: the dynamics, the measurement model, the noise sizes. It is a promise that holds only if those assumptions hold. Orbit analysts say "formal sigma" on purpose, to keep that condition in view. When the assumptions break — a missed burn, a station bias, a wrong drag model — the formal sigma keeps looking reassuring while the true error grows. Comparing the formal sigma with independent checks, such as overlapping arcs, is how teams catch that.
:::

::: context orders-of-magnitude Counting in powers of ten
An **order of magnitude** is a factor of ten. Two orders of magnitude is a hundred, three is a thousand, four is ten thousand. Saying the covariance is "four orders of magnitude too small" means the true error is about ten thousand times the claimed one. In the example, $771 / 0.053 \approx 14\,500$, which is a bit more than $10^4$. Engineers think in orders of magnitude when a number is so far off that its exact digits no longer matter — only how many zeros it is out by.
:::

::: context residual-smile The shape that says "your model is missing something"
Plot the toy car's residuals (measured minus fitted) against time and they curve up at both ends.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="85" x2="340" y2="85" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="40" y1="20" x2="40" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34" y="89" font-size="12" fill="#1f2a44" text-anchor="end">0</text>
  <text x="34" y="44" font-size="12" fill="#1f2a44" text-anchor="end">+0.5</text>
  <text x="34" y="130" font-size="12" fill="#1f2a44" text-anchor="end">−0.5</text>
  <circle cx="70" cy="40" r="5" fill="#1d6fd1"/>
  <circle cx="120" cy="85" r="5" fill="#1d6fd1"/>
  <circle cx="170" cy="130" r="5" fill="#1d6fd1"/>
  <circle cx="220" cy="130" r="5" fill="#1d6fd1"/>
  <circle cx="270" cy="85" r="5" fill="#1d6fd1"/>
  <circle cx="320" cy="40" r="5" fill="#1d6fd1"/>
  <line x1="195" y1="20" x2="195" y2="150" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="3 3"/>
  <text x="200" y="30" font-size="12" fill="#b4232c">flick at 2.5 s</text>
  <text x="195" y="165" font-size="12" fill="#1f2a44" text-anchor="middle">t = 0, 1, 2, 3, 4, 5 s</text>
</svg>
```

Honest noise scatters above and below zero with no shape. A curve, a step or a steady slope means the model left out something real.
:::

::: context solve-for Estimate it, or hold it fixed
Every quantity in a fit is either a **solve-for** parameter — the fit adjusts it to match the data — or held at an assumed value. Solve-for parameters cost something: each one needs the data to tell it apart from the others, and a poorly seen one can soak up noise and drag the rest with it. That is why the consider-covariance lesson offered a middle path for parameters the data barely sees. A burn right in the middle of well-tracked data is usually easy to see, so solving for it is the natural choice.
:::

::: context selector-matrix A matrix that picks columns
Multiplying a matrix on the right by a block of zeros stacked on an identity keeps some of its columns and drops the rest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="45" height="90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="65" y="30" width="45" height="90" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="42" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">pos</text>
  <text x="87" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">vel</text>
  <text x="65" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">Φ (6×6)</text>
  <text x="126" y="80" font-size="14" fill="#1f2a44" text-anchor="middle">×</text>
  <rect x="142" y="30" width="45" height="45" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="142" y="75" width="45" height="45" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="164" y="57" font-size="13" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="164" y="102" font-size="13" fill="#1f2a44" text-anchor="middle">I</text>
  <text x="164" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">6×3</text>
  <text x="208" y="80" font-size="14" fill="#1f2a44" text-anchor="middle">=</text>
  <rect x="228" y="30" width="45" height="90" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="250" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">vel</text>
  <text x="250" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">6×3</text>
  <text x="180" y="142" font-size="12" fill="#1f2a44" text-anchor="middle">only the velocity columns survive</text>
</svg>
```

The zeros wipe out the three position columns of $\boldsymbol\Phi$; the identity copies the three velocity columns across unchanged.
:::

::: context execution-error Planned is not the same as performed
Thrusters never deliver exactly the planned burn. The thrust level, the burn's start and stop, and the pointing all carry small errors, so a real burn typically lands within a few percent of its plan in size, with a small error in direction too. Operations teams feed the planned $\Delta\mathbf v$ into the fit as an a priori estimate with a covariance matching that execution accuracy, and then let the tracking data correct it. Comparing the reconstructed burn with the plan, burn after burn, is also how teams calibrate their thrusters over a mission.
:::
