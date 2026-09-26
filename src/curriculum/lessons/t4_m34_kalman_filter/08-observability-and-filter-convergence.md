---
id: l08-observability-and-filter-convergence
title: Observability and filter convergence
minutes: 18
covers:
  - Observability and filter convergence
---

Imagine riding in a car at night with the windows blacked out. You can see the speedometer, and it is very accurate. After an hour you know your speed at every moment to within a hair. Do you know where you are? Only roughly. You can add up speed times time to estimate how far you have gone, but every tiny speed error gets added in too, and nothing ever tells you "you are *here*". The longer you drive, the less sure you are of your position — however good the speedometer is.

That is the whole lesson in one picture. Your position is **[[unobservable|unobservable-word]]** from the speedometer: no amount of speed readings can pin it down. A Kalman filter carrying an unobservable state behaves exactly like you in that car. It gets very sure of what it can see, and its uncertainty about what it cannot see keeps growing.

The steady-state lesson's convergence theorem needed $(\mathbf{F}, \mathbf{H})$ to be detectable, and the booster example passed easily: fully observable, rank $2$ out of $2$. Real navigation filters are rarely so lucky. They carry a sensor bias with no calibration measurement, an axis no sensor covers, or a parameter that only becomes visible once the vehicle turns. This lesson works out exactly what the covariance does in those cases. The result is sharper than "that state is hard to estimate": an unobservable direction is one the filter's update step can be shown never to touch.

## What the observability test tells a filter

Start with the state-space module's rank test. Stack the measurement matrix and its images through the dynamics into the **observability matrix**, $\mathcal{O}$ (read "script O"):

$$
\mathcal{O} = \begin{pmatrix}\mathbf{H}\\ \mathbf{H}\mathbf{F}\\ \vdots \\ \mathbf{H}\mathbf{F}^{n-1}\end{pmatrix}.
$$

Each block row answers one question: what would the sensor see now, one step from now, two steps from now, and so on? The pair $(\mathbf{F}, \mathbf{H})$ is observable if $\mathcal{O}$ has full column rank $n$, where $n$ is the number of states.

When the rank is less than $n$, some nonzero vectors $\mathbf{v}$ satisfy $\mathbf{H}\mathbf{F}^j\mathbf{v} = \mathbf{0}$ for every $j = 0, \ldots, n-1$. Together they form the **[[null space|null-space]]** of $\mathcal{O}$, and in this setting it has a name: the **unobservable subspace**. It is the set of state directions the sensor reads as exactly zero, now and at every future step. An error lying along such a direction produces the same measurements as no error at all, so no sequence of measurements, however long, can ever reveal it.

This subspace has one more property that everything below depends on. It is **$\mathbf{F}$-invariant**: if $\mathbf{v}$ is unobservable, so is $\mathbf{F}\mathbf{v}$. The dynamics can move an error around *inside* the unobservable subspace, but they can never carry it out into a direction the sensor would notice. In the blacked-out car, a position error stays a position error forever; driving never turns it into a speed error you could read on the dial.

::: note Why it has to be true: the unobservable subspace is F-invariant
Take $\mathbf{v}$ with $\mathbf{H}\mathbf{F}^j\mathbf{v} = \mathbf{0}$ for $j = 0, \ldots, n-1$. We need the same for $\mathbf{F}\mathbf{v}$, that is $\mathbf{H}\mathbf{F}^{j+1}\mathbf{v} = \mathbf{0}$ for $j = 0, \ldots, n-1$.

For $j + 1 \leq n - 1$ it is already one of the given equations. That leaves $\mathbf{H}\mathbf{F}^{n}\mathbf{v}$. The **[[Cayley-Hamilton theorem|cayley-hamilton]]** says every square matrix satisfies its own characteristic polynomial, so $\mathbf{F}^n$ can be written as a combination of lower powers: $\mathbf{F}^n = c_0\mathbf{I} + c_1\mathbf{F} + \cdots + c_{n-1}\mathbf{F}^{n-1}$. Multiply on the left by $\mathbf{H}$ and on the right by $\mathbf{v}$:

$$
\mathbf{H}\mathbf{F}^n\mathbf{v} = c_0\,\mathbf{H}\mathbf{v} + c_1\,\mathbf{H}\mathbf{F}\mathbf{v} + \cdots + c_{n-1}\,\mathbf{H}\mathbf{F}^{n-1}\mathbf{v} = \mathbf{0},
$$

because every term on the right is one of the given zeros. So $\mathbf{F}\mathbf{v}$ is unobservable too. The same argument shows why the test stops at $\mathbf{F}^{n-1}$: higher powers add nothing new.
:::

Now see what this does to the Kalman gain. The gain is $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$. For some state to get a nonzero gain, $\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}$ must be nonzero in that state's row. That happens only if the state is measured directly, or if $\mathbf{P}_k^-$ links it, through a correlation, to something that is measured. Along a direction with no correlation to anything $\mathbf{H}$ can see, the update cannot act at all. It is not choosing to ignore that direction — the formula has nothing to act on there.

::: key What an unobservable direction does to the filter
Measurements reduce the covariance only in directions the measurements can reach. Along an unobservable direction, the covariance is governed by $\mathbf{F}$ and $\mathbf{Q}$ alone. With $\mathbf{Q} = \mathbf{0}$ there it stays at its initial value forever; with $\mathbf{Q} > \mathbf{0}$ there, and dynamics that do not shrink it, it grows without bound. The estimate along that direction is driven only by the prior and the dynamics, so any initial error there is never corrected.
:::

## The clean case: a state the sensor never touches

Start with the simplest instance. A filter carries two states that have nothing to do with each other. One is a directly measured quantity $p$. The other is a bias $b$ that wanders slowly — the kind of nuisance number kept in the state vector for a sensor that is not switched on yet. Put the bias first, so $\mathbf{x} = (b, p)^{\mathsf{T}}$. Nothing mixes them:

$$
\mathbf{F} = \mathbf{I}, \qquad \mathbf{H} = \begin{pmatrix}0 & 1\end{pmatrix}, \qquad
\mathcal{O} = \begin{pmatrix}0 & 1\\ 0 & 1\end{pmatrix}.
$$

The observability matrix has rank $1$. Its null space is every multiple of $(1, 0)^{\mathsf{T}}$: the $b$ axis. So $b$ is unobservable, as you would expect for a state the sensor never looks at and nothing ever links to $p$.

::: example A bias nobody measures
Start from $\mathbf{P}_0 = \operatorname{diag}(4, 4)$, with process noise $Q_p = 0.3$ on $p$ and measurement noise $R = 1$. Run the Riccati recursion for ten steps, once with bias process noise $Q_b = 0$ and once with $Q_b = 0.5$. The table shows the predicted values at each step:

| Step | $Q_b = 0$: $P_{bb}$ | $Q_b = 0$: $P_{bp}$ | $Q_b = 0.5$: $P_{bb}$ | $Q_b = 0.5$: $P_{bp}$ |
| --- | --- | --- | --- | --- |
| $1$ | $4.000000$ | $0$ | $4.500000$ | $0$ |
| $2$ | $4.000000$ | $0$ | $5.000000$ | $0$ |
| $5$ | $4.000000$ | $0$ | $6.500000$ | $0$ |
| $10$ | $4.000000$ | $0$ | $9.000000$ | $0$ |

**With $Q_b = 0$.** $P_{bb}$ stays at exactly $4.000000$ — not about $4$, but $4$ to every digit. Follow the three possible causes of change. $\mathbf{F} = \mathbf{I}$ never grows it. The cross term $P_{bp}$ starts at zero and nothing ever makes it nonzero, so the bias gain $K_b = P_{bp}/S$ is exactly zero and no update ever shrinks it. And there is no process noise to add anything.

**With $Q_b = 0.5$.** $P_{bb}$ climbs $4.0, 4.5, 5.0, 5.5, \ldots$: exactly $0.5$ more every step, reaching $4 + 10 \times 0.5 = 9.0$ at step 10, with no sign of leveling off.

Sanity check: the measured state $p$ is not stuck at all. Its gain starts at $0.81$ and settles near $0.42$, an ordinary healthy filter. The two states live side by side, and only one of them is being filtered.
:::

That is the whole theorem, with nothing approximate left. Zero process noise on an unobservable direction freezes its covariance forever. Any process noise at all makes it climb by exactly that amount, step after step, without bound.

## The realistic case: a sensor that only sees speed

Fully separate states are the exception. Most unobservable directions in practice are tied to something the sensor *can* see. That changes the details but not the conclusion.

Go back to the constant-velocity model, $\mathbf{F} = \begin{pmatrix}1 & \Delta t\\ 0 & 1\end{pmatrix}$ with $\Delta t = 0.1\,\mathrm{s}$ and $q = 0.5$, but give it a **[[Doppler|doppler]]** sensor that measures only velocity: $\mathbf{H} = \begin{pmatrix}0 & 1\end{pmatrix}$, with $R = 0.01\,\mathrm{(m/s)^2}$. This is the blacked-out car.

Build the observability matrix. Multiply the row $\mathbf{H}$ by $\mathbf{F}$, one entry at a time:

$$
\mathbf{H}\mathbf{F} = \begin{pmatrix}0 \cdot 1 + 1 \cdot 0 & \ 0 \cdot \Delta t + 1 \cdot 1\end{pmatrix} = \begin{pmatrix}0 & 1\end{pmatrix} = \mathbf{H}.
$$

So $\mathcal{O} = \begin{pmatrix}0 & 1\\ 0 & 1\end{pmatrix}$ again, rank $1$. Its null space is $(1, 0)^{\mathsf{T}}$: pure position, zero velocity. Position is unobservable.

::: example Dead reckoning, derived rather than assumed
Start from $\mathbf{P}_0 = \operatorname{diag}(4, 4)$ and run the Riccati recursion (update, then predict) for $300$ cycles:

| After cycle | $P_{pp}$ ($\mathrm{m^2}$) | $P_{pv}$ ($\mathrm{m^2/s}$) | $P_{vv}$ ($\mathrm{m^2/s^2}$) |
| --- | --- | --- | --- |
| $1$ | $4.00027$ | $0.00350$ | $0.059975$ |
| $10$ | $4.00158$ | $0.00393$ | $0.058541$ |
| $100$ | $4.01433$ | $0.00393$ | $0.058541$ |
| $300$ | $4.04267$ | $0.00393$ | $0.058541$ |

**Velocity settles.** $P_{vv}$, the measured state, reaches $0.058541$ within a few cycles and stays there. For velocity alone, this is an ordinary steady-state filter.

**Position never settles.** $P_{pp}$ climbs from $4.0$ to $4.043$ over $300$ cycles. Measure the step-to-step increase at cycles $50$, $100$, $200$ and $299$: it is $0.0001417$ every time. The growth is a straight line with no ceiling. That is **[[dead reckoning|dead-reckoning]]** written as a covariance: without a position fix, position uncertainty piles up at a steady rate however long the filter runs.

**Where the rate comes from.** Each cycle, the predict step adds $0.000367$ to $P_{pp}$. Of that, $0.000167$ is $\mathbf{Q}$'s own position entry, $q\Delta t^3/3$, and $0.000200$ comes from integrating a velocity that is known well but not perfectly. The update then takes back $0.000225$. It can do that only because of the small correlation $P_{pv} = 0.00393$, which the $\Delta t$ in $\mathbf{F}$ keeps building. Net: $0.000367 - 0.000225 = 0.000142$ per cycle. The correlation buys partial relief, never a cure.

Sanity check: $300 \times 0.0001417 = 0.0425$, and $4.0 + 0.0425$ is about the $4.043$ in the table.

**Which direction is growing.** At cycle $60$, $\mathbf{P}$ has eigenvalues $0.0585$ and $4.0087$. The eigenvector of the big, still-growing one is $(-0.999999,\ -0.000994)^{\mathsf{T}}$. Up to its sign (an eigenvector's sign is arbitrary), that is the pure-position direction $(1, 0)^{\mathsf{T}}$ to three decimal places — exactly what the observability matrix predicted before any covariance was computed. The direction the filter cannot correct and the direction its uncertainty piles up in are the same direction.
:::

Position here is unobservable in the strict rank sense, and yet the update still nudges it a little through the correlation. Those two facts do not clash. "Unobservable" is about what measurements can ever pin down *exactly*. It does not promise that nearby states leak no information at all.

```python
import numpy as np

dt, q = 0.1, 0.5
F = np.array([[1.0, dt], [0.0, 1.0]])
Q = q * np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])
H = np.array([[0.0, 1.0]])   # velocity only
R = np.array([[0.01]])

Obs = np.vstack([H, H @ F])
print("rank:", np.linalg.matrix_rank(Obs))   # rank: 1  -> position unobservable

P = np.diag([4.0, 4.0])
for k in range(1, 301):
    S = H @ P @ H.T + R
    K = P @ H.T @ np.linalg.inv(S)
    P = F @ (P - K @ H @ P) @ F.T + Q
w, v = np.linalg.eigh(P)
print(w, v[:, np.argmax(w)])
# [0.05853715 4.04267149] [-0.99999951 -0.00098567]
```

The [[eigenvectors|eigen-ellipse]] of $\mathbf{P}$ are the filter's own report of where it is blind. Engineers check them for exactly this reason: a covariance that keeps growing along one fixed eigenvector, while everything else settles, is the fingerprint of an unobservable direction.

::: warning Unobservable is not the same as unstable
Both examples had an unobservable direction whose own dynamics were neutral: a random walk, or a position fed by an integrated velocity. Now suppose the unobservable direction *shrinks* on its own — like the Gauss-Markov gyro bias from the stochastic-model lesson, which drifts back toward zero with a correlation time. Then its covariance does not climb, even with no measurement help. It settles at its own stationary spread, never improving beyond that, but never unbounded either. Unobservable forces unbounded growth only when the unobservable direction is also unstable or marginal.
:::

## Detectability, understood rather than quoted

The steady-state lesson stated detectability of $(\mathbf{F}, \mathbf{H})$ as the condition for a bounded steady state, and promised this lesson would make it concrete. Here it is in one sentence. An unobservable direction that is also unstable or marginal is exactly a direction whose covariance the Riccati recursion cannot bound: the update adds nothing there, and prediction along an eigenvalue of size $1$ or more does not shrink it.

**Detectability** is the condition that rules out that combination. It allows unobservable directions — both examples above had one, quite ordinarily — as long as each is stable on its own. Then the lack of correction is survivable rather than fatal.

::: key Detectability in one line
A bounded steady-state covariance needs every unobservable direction of $(\mathbf{F}, \mathbf{H})$ to be stable on its own. Unobservable plus marginal or unstable, with any process noise there, means a covariance that grows forever.
:::

This is also one of the most common real causes of the "confidently wrong" filter this module has kept returning to since the process-noise lesson. The $\mathbf{Q}$ may be perfectly reasonable, but for a state the sensors, as actually configured, [[cannot see at all|one-star]]. The covariance grows exactly as designed. If nothing downstream checks it against the observability of the real sensor set, nobody notices for a long time.

There is a second, quieter harm. A growing unobservable variance can leak into the observable states through any correlation the model creates, and skew the gains there too. The next lessons return to this: an unobservable direction driven by nonzero $\mathbf{Q}$ is one of the standard causes of divergence, and the standard remedy is to change the model — add a sensor, add a maneuver that makes the state visible, or remove the state — rather than hope $\mathbf{Q}$ covers for it.

## Check yourself

::: check
An $n$-state model has an observability matrix of rank $n - 1$. What exactly does that tell you about the filter's covariance, and what does it *not* tell you?
:::

::: answer
It tells you there is one direction — the null space of the observability matrix, which is $\mathbf{F}$-invariant — along which no sequence of measurements can ever give a correction. The covariance's part along that direction is governed by $\mathbf{F}$ and $\mathbf{Q}$ alone, forever.

It does *not* tell you whether that part grows, shrinks or stays put. That depends on whether $\mathbf{F}$, acting within the unobservable direction, is stable, marginal or unstable, and on whether $\mathbf{Q}$ puts any noise there. The rank tells you *where* the filter cannot help itself, not how badly that will hurt.
:::

::: check
In the Doppler-only example, why is $\mathbf{H}\mathbf{F}$ exactly equal to $\mathbf{H}$? Why does that make the unobservable direction easy to find by eye?
:::

::: answer
$\mathbf{H}\mathbf{F} = (0\ \ 1)\begin{pmatrix}1 & \Delta t\\0&1\end{pmatrix} = (0\cdot1 + 1\cdot0,\ \ 0\cdot\Delta t + 1\cdot1) = (0\ \ 1) = \mathbf{H}$.

The reason is physical: in a constant-velocity model, the next velocity does not depend on position at all (the velocity row of $\mathbf{F}$ is $(0\ \ 1)$). So measuring velocity one step later tells you nothing that measuring it now did not.

With $\mathbf{H}\mathbf{F} = \mathbf{H}$, the two rows of the observability matrix are identical, so its null space is the null space of $\mathbf{H}$ alone: every vector $(v_p, 0)^{\mathsf{T}}$, pure position. You can read it off without multiplying anything further.
:::

::: check
In the Doppler-only example, the correlation $P_{pv}$ settles at $0.00393$ while $P_{pp}$ keeps climbing. Why does one settle and not the other?
:::

::: answer
$P_{pv}$ has a correction channel. The sensor measures velocity, so the update multiplies $P_{pv}$ by $R/S$ every cycle, shrinking it. The predict step adds to it an amount set by $\Delta t\,P_{vv}$ and $\mathbf{Q}$. Once $P_{vv}$ has settled (velocity is fully observable on its own), that added amount is constant, and a fixed shrink factor balancing a fixed addition gives a fixed point — the same way the scalar steady state worked of the last lesson.

$P_{pp}$ has no such balance. Each cycle the predict step adds a fixed $0.000367$, and the update can remove only a fixed $0.000225$ through the small, settled correlation. The removal does not grow as $P_{pp}$ grows, so there is no level at which the two match. The difference, $0.000142$, piles up forever.
:::

::: check
A colleague suggests "fixing" the unmeasured-bias example by setting $Q_b = 0$ once the filter has run for a while, reasoning that the bias is "close enough" and its variance should stop growing. What is wrong with this?
:::

::: answer
Setting $Q_b = 0$ does stop $P_{bb}$ growing from then on — the table showed $Q_b = 0$ holds it exactly fixed. But it does nothing to the actual bias *error*. $b$ is unobservable, and no update has ever touched it, with or without $Q_b$.

So the change freezes the filter's *report* of its uncertainty at whatever level it happened to reach, without reducing or even measuring the real error. If the true bias keeps drifting, the real error grows past what the frozen $P_{bb}$ admits, and the filter becomes confidently wrong in exactly the way the process-noise lesson warned about. The real problem — no measurement reaches this state — was never about $Q_b$. The fix is a measurement, a maneuver, or a different model.
:::

::: check
Would adding a second, independent sensor that also measures only velocity change any conclusion of the Doppler-only example?
:::

::: answer
No. Observability depends on which directions the rows of $\mathbf{H}$ can see, together with $\mathbf{F}$ — not on how many rows there are. A second velocity-only row is another copy of $(0\ \ 1)$, so the observability matrix still has rank $1$.

Two sensors would lower the effective measurement noise, so $P_{vv}$ would settle lower. But position would stay exactly as unobservable, and $P_{pp}$ would still grow without bound — at nearly the same rate, because the growth comes mainly from process noise and integration that no velocity measurement can undo.
:::

## Summary

| Item | Statement |
| --- | --- |
| Unobservable subspace | The null space of $\mathcal{O}=(\mathbf{H};\mathbf{H}\mathbf{F};\ldots;\mathbf{H}\mathbf{F}^{n-1})$; it is $\mathbf{F}$-invariant, so the dynamics never carry it into view |
| The update there | Structurally zero: $\mathbf{K}_k$ has no leverage where $\mathbf{P}_k^-$ has no correlation with what $\mathbf{H}$ sees |
| Separate state, $Q = 0$ | Covariance frozen at its initial value forever |
| Separate state, $Q > 0$ | Covariance grows by exactly $Q$ every step, without bound |
| Coupled state | Still grows without bound, at a rate reduced (not removed) by correlation; the growing eigenvector of $\mathbf{P}$ lines up with the null space of $\mathcal{O}$ |
| Detectability | Unbounded growth needs an unobservable direction that is also marginal or unstable; a stable one settles at its own bounded spread |

An unobservable direction with process noise is now a fully worked failure: predictable, exact in the separate case, and confirmed in numbers in the coupled one. It is one of several ways a covariance can stop matching reality. The next lesson takes up a very different one — plain arithmetic going wrong inside the computer — and the formulations built to prevent it.

::: context unobservable-word Seeing a thing through its effects
**Observable** does not mean "measured directly". A state is observable if the measurements, collected over time, pin it down — even indirectly. Position is observable from a position sensor, of course. But velocity is observable from a position sensor too: two positions a moment apart reveal the speed. The blacked-out car fails the other way round. Speed readings, however many, never reveal where you started, because every starting point produces exactly the same speedometer readings.
:::

::: context null-space The directions a matrix cannot see
The **null space** of a matrix is every vector the matrix turns into zero. Think of a flashlight casting shadows straight down onto the floor: a stick lying flat has a shadow, but a stick pointing straight up casts only a dot. "Straight up" is in the null space of the shadow-making. For the observability matrix, the null space holds the state errors that throw no shadow on the sensor, now or later.
:::

::: context cayley-hamilton A matrix obeys its own equation
Every square matrix has a **characteristic polynomial**, the polynomial whose roots are its eigenvalues. The Cayley-Hamilton theorem says: plug the matrix itself into that polynomial and you get the zero matrix. For a $2 \times 2$ matrix with trace $t$ and determinant $d$, that reads $\mathbf{F}^2 - t\mathbf{F} + d\,\mathbf{I} = \mathbf{0}$. For the constant-velocity $\mathbf{F}$, $t = 2$ and $d = 1$, so $\mathbf{F}^2 = 2\mathbf{F} - \mathbf{I}$. Every higher power folds back into lower ones, which is why the observability test can stop at $\mathbf{F}^{n-1}$.
:::

::: context doppler Measuring speed from a change in pitch
An ambulance siren sounds higher as it comes toward you and lower as it drives away. That shift is the **Doppler effect**, and radar uses it with radio waves: the frequency change in the echo gives the speed along the line of sight, not the distance. The velocity channels of the landing radars on Mars landers work this way. A Doppler-only sensor is excellent for speed and useless for position on its own — which is exactly the $\mathbf{H} = (0\ \ 1)$ in this lesson.
:::

::: context dead-reckoning Navigating without a landmark
Before satellites, ships' navigators estimated position by **dead reckoning**: start from the last known fix, then add up speed times time along the compass heading. Every small error in speed or heading got added in too, so the uncertainty grew the longer the ship went without sighting land or a star. The filter's straight-line growth in $P_{pp}$ is the same thing, and the cure is the same: a fix — a measurement of position itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="120" x2="330" y2="30" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="40" y1="120" x2="330" y2="120" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="330" y="24" font-size="12" fill="#b4232c" text-anchor="end">position variance: keeps growing</text>
  <text x="330" y="112" font-size="12" fill="#1d6fd1" text-anchor="end">velocity variance: settles</text>
  <text x="190" y="158" font-size="12" fill="#1f2a44" text-anchor="middle">time (no position fix)</text>
  <text x="34" y="80" font-size="12" fill="#1f2a44" text-anchor="end">P</text>
</svg>
```

(The picture shows the shapes, not the scale: in the example, velocity settles near $0.06$ while position grows slowly from $4$.)
:::

::: context eigen-ellipse The filter's own map of where it is blind
A $2 \times 2$ covariance can be drawn as an ellipse: its axes point along the eigenvectors, and their lengths are the square roots of the eigenvalues. For the Doppler-only filter at cycle 60, the axes are $\sqrt{4.0087} = 2.00\,\mathrm{m}$ along position and $\sqrt{0.0585} = 0.24\,\mathrm{m/s}$ along velocity — an ellipse more than eight times longer than it is tall, and getting longer every step. Reading the long axis is how an engineer spots an unobservable direction in a real filter's output.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="75" x2="340" y2="75" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="15" x2="180" y2="135" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="180" cy="75" rx="140" ry="17" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <text x="336" y="68" font-size="12" fill="#1f2a44" text-anchor="end">position</text>
  <text x="186" y="24" font-size="12" fill="#1f2a44">velocity</text>
  <text x="250" y="110" font-size="11" fill="#1d6fd1">long axis 2.00, short axis 0.24</text>
</svg>
```
:::

::: context one-star Unobservable directions on real spacecraft
A star tracker that sees only one star knows which way that star lies, but it cannot tell how the spacecraft is rolled about the line pointing at it: every roll angle shows the star in the same spot. Rotation about that line is unobservable until a second star comes into view. A second classic case: a GPS-aided inertial system on a vehicle moving in a straight line at constant speed cannot separate its heading error well, because heading only shows up in the measurements once the vehicle accelerates or turns. That is why aircraft navigation systems often need a turn after start-up before their heading estimate settles.
:::
