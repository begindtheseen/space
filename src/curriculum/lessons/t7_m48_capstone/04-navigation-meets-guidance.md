---
id: l04-navigation-meets-guidance
title: 'Navigation in the loop: the multiplicative EKF meets guidance'
minutes: 25
covers:
  - A multiplicative extended Kalman filter on IMU, GNSS and radar altimeter, with error-state formulation and attitude error as a three-parameter local perturbation
---

Picture a game of catch in the dark. A friend holds a flashlight and calls out where the basket is, and you throw toward whatever they last called. If each call is off by a little, in a fresh random direction every time, your throws scatter around the basket and mostly land close. Now suppose your friend's calls are wrong the *same way* for a few calls in a row — say, always a step to the left. Then every throw you make in that stretch goes a step left, and nothing in your throwing can notice. Your arm is fine. Your friend's average error is fine. The problem is *how long* each error lasts compared with how often you throw.

The friend is the **navigation filter**, which works out where the vehicle is. The thrower is **guidance**, which plans the path to the pad. Earlier modules built the filter in full: the **multiplicative extended Kalman filter**, or **MEKF**. This lesson fits it to our landing booster's sensors, checks that it is honest about its own errors, and then plugs its output into guidance to measure what an error that *repeats* from moment to moment does at touchdown.

That last effect is invisible to any test of navigation alone.

## The filter, fitted to this vehicle

The landing booster from lesson 1 carries three sensors during its landing burn:

- an **[[IMU|imu]]** (inertial measurement unit — accelerometers and gyros that feel the vehicle's push and turn), read at the $200\,\mathrm{Hz}$ navigation rate lesson 3 fixed;
- **GNSS** (satellite navigation, like GPS), giving position and velocity at $10\,\mathrm{Hz}$;
- a **[[radar altimeter|radar-altimeter]]**, which bounces radio waves off the ground and reports altitude alone, at $20\,\mathrm{Hz}$, once the vehicle is below $1500\,\mathrm m$.

The filter is the general error-state MEKF from the prerequisite modules, trimmed in two ways.

**First, the motion is kept in a flat, vertical plane** — downrange and altitude, with one pitch angle for attitude. The full filter tracks fifteen error states: position error $\delta\mathbf p$, velocity error $\delta\mathbf v$, attitude error $\boldsymbol\phi$ (called $\delta\boldsymbol\theta$ below), accelerometer-bias error $\delta\mathbf b_a$ and gyro-bias error $\delta\mathbf b_g$, three numbers each. (Read $\delta\mathbf p$ as "delta p": the small error in position.) In the plane that shrinks to seven states: two for position, two for velocity, one attitude angle, two accelerometer biases. The two out-of-plane attitude components are not "estimated to be small" here — they are exactly zero by construction.

**Second, gyro bias is measured on the ground before flight and subtracted directly**, not estimated in flight. A **bias** is a steady offset in a sensor's reading, like a bathroom scale that always reads one kilogram heavy. This is a real design choice with a real limit. In this setup nothing measures attitude directly — no star camera, no two-antenna GNSS heading. The filter can only see attitude *indirectly*: if it has the tilt wrong, it points the accelerometer's measured push the wrong way, that becomes a velocity error, and GNSS sees the velocity error. That channel (the coupling term $\partial(\delta\dot{\mathbf v})/\partial\delta\boldsymbol\theta$ the inertial-navigation module derived) is weak over a thirty-second burn, too weak to separate attitude error from gyro-bias error at the same time. A vehicle that could not calibrate its gyros on the ground would need a real attitude sensor instead.

## Why the attitude error is multiplicative

Attitude — which way the vehicle points — is stored as a **[[quaternion|quaternion]]**: four numbers $(q_0, q_1, q_2, q_3)$ whose squares always add to exactly $1$. That "adds to $1$" rule is called the **unit-norm constraint**. Four numbers, one rule tying them together: that leaves **three degrees of freedom**, three independent ways to turn (roll, pitch, yaw). The fourth number is not free.

That mismatch causes two problems for a Kalman filter that tries to estimate the four numbers directly.

1. **The covariance is [[singular|singular-covariance]].** The **covariance** $\mathbf P$ is the filter's table of how uncertain it is about each state and how those uncertainties move together. For four numbers that really carry only three freedoms, the $4\times4$ covariance has one direction with zero uncertainty. A matrix like that cannot be inverted, and a Kalman filter inverts things all the time.
2. **An additive update breaks the rule.** A Kalman update *adds* a correction to the estimate. Adding to a point on the "sum of squares is $1$" surface lands you slightly off it.

Here is the second problem with numbers. A turn of $20^\circ$ about one axis is the quaternion $(\cos 10^\circ, \sin 10^\circ, 0, 0) = (0.9848, 0.1736, 0, 0)$. Add a correction of $0.05$ to the second number. Its length, the square root of the sum of squares, is now $1.0099$ — about $1\%$ too long, so it is no longer a rotation at all. You could squash it back to length $1$, but the filter's covariance never accounted for that squash, so the covariance is now slightly wrong.

The multiplicative fix splits attitude into two pieces:

- a **reference quaternion** $\hat{\mathbf q}$ ("q hat"), which carries the big rotation and is always kept at exactly unit length;
- a **small three-number error** $\delta\boldsymbol\theta$ ("delta theta"), the tiny extra turn between the reference and the truth. This is what the filter estimates, with an ordinary, well-behaved $3\times3$ covariance block.

The true attitude is the reference *multiplied by* the small turn — that is where "multiplicative" comes from. After each measurement update, the filter folds the estimated small turn into the reference (a multiplication, which keeps the length at exactly $1$) and then **resets** $\delta\boldsymbol\theta$ to zero. So the filter always linearizes about zero error, where its straight-line approximations are best.

::: key Why the attitude filter is multiplicative
A unit quaternion carries three degrees of freedom in four components, so a direct covariance is singular and additive updates break the norm. Estimate a three-parameter error applied multiplicatively to a reference quaternion, then fold it in and reset.
:::

In three dimensions the reset needs one more step. Moving the reference also changes what the error's coordinates mean, so the covariance is adjusted with a **reset Jacobian**, $\mathbf G=\mathbf I-\operatorname{skew}(\tfrac12\delta\hat{\boldsymbol\theta})$. (A Jacobian is a table of how much each output moves when each input moves.) In our flat plane, $\mathbf G = 1$ *exactly*. That is not a small-angle approximation.

::: note Why the planar reset Jacobian is exactly one
The three-dimensional correction exists because turns about different axes do not **commute**: turning $90^\circ$ about one axis and then about another ends somewhere different from doing them in the other order. So moving the reference quaternion really does change the meaning of the error coordinates attached to it. In the plane, every turn is about the same fixed axis. Turns about one axis always commute — ten degrees then five is the same as five then ten. Nothing changes meaning when the reference moves, so the correction is the identity, $\mathbf G=1$, with no approximation.
:::

## Checking the filter is honest

A filter that tracks the truth fairly well is not the same thing as a filter that is *honest about how well* it tracks. The second one is what everyone downstream relies on. Guidance, control and fault detection all read the covariance and trust it.

Think of a forecaster who says "70% chance of rain". Over all the days she said 70%, it should have rained on about 70% of them. The covariance is the filter's forecast of its own error, checked the same way.

The standard check is the **NEES**, the **normalized estimation error squared**. In simulation we know the truth, so we can form the actual error and measure it in units of the filter's own claimed uncertainty:

$$
\mathrm{NEES} = \mathbf e^\top \mathbf P^{-1} \mathbf e, \qquad \mathbf e = \mathbf x_{\text{true}} - \hat{\mathbf x}.
$$

Read it as "e transpose, P inverse, e". Here $\hat{\mathbf x}$ is the estimate, $\mathbf x_{\text{true}}$ is the truth, and $\mathbf P^{-1}$ divides each error by the filter's own claimed spread. If the filter is honest, each state contributes about $1$ on average, so a seven-state filter's NEES averages about $7$. Its values follow a **[[chi-squared distribution|chi-squared]]** with seven degrees of freedom. The middle $95\%$ of that distribution runs from $1.69$ to $16.01$. An honest filter's NEES sits inside that band on about $95\%$ of cycles.

::: example NEES by hand, for two states
A filter reports a position uncertainty of $0.2\,\mathrm m$ and a velocity uncertainty of $0.05\,\mathrm{m/s}$ (one sigma, meaning one standard deviation, each), with no correlation between them. So $\mathbf P$ is diagonal, with $0.2^2 = 0.04$ and $0.05^2=0.0025$ on the diagonal. The true errors happen to be $0.3\,\mathrm m$ and $0.1\,\mathrm{m/s}$.

Because $\mathbf P$ is diagonal, $\mathbf e^\top\mathbf P^{-1}\mathbf e$ is each error squared divided by its own variance, added up:

$$
\mathrm{NEES} = \frac{0.3^2}{0.04} + \frac{0.1^2}{0.0025} = 2.25 + 4.00 = 6.25.
$$

The position error is $1.5$ sigma (it contributes $1.5^2 = 2.25$) and the velocity error is $2$ sigma (it contributes $4$). For two states the $95\%$ band is $0.05$ to $7.38$, so $6.25$ is inside, but near the top. One sample proves nothing. A filter whose NEES sits near the top of the band cycle after cycle is quietly overconfident.
:::

In flight there is no truth to compare against, so NEES cannot be computed. The flight version uses the **[[innovation|innovation]]** instead — the difference between what a sensor actually reported and what the filter predicted it would report. The **NIS**, the **normalized innovation squared**, divides that difference by its predicted spread $\mathbf S$ in exactly the same way. It needs no truth, so it runs on the real vehicle, and it too should sit inside its chi-squared band.

::: key Filter consistency checks
NEES (normalized estimation error squared) against truth in simulation, and NIS (normalized innovation squared) in flight, since it needs no truth. Both should sit inside their chi-squared bounds. An overconfident filter corrupts gating, FDIR thresholds and guidance margins alike.
:::

Why does an **[[overconfident|overconfident]]** filter — one whose covariance is too small — do so much harm? Follow the covariance to its readers:

- **The filter itself.** The Kalman gain weighs "how sure am I?" against "how sure is the sensor?". A filter that thinks it is very sure gives new measurements little weight — it ignores the very data that would correct it.
- **Gating.** Before using a measurement, the filter asks whether it is believable, measured against the predicted spread. Too small a spread, and good measurements get thrown out as "outliers".
- **Fault detection.** Monitors scaled by the predicted spread trip on healthy noise, or miss real faults.
- **Guidance.** It plans its safety margins around a confidence the vehicle does not have.

::: example Running the filter through one full landing burn
The filter was run against the reference vehicle's ignition-to-touchdown trajectory. IMU noise used the same random-walk figures as the inertial-navigation module's worked examples. GNSS noise was $3\,\mathrm m$ in position and $0.15\,\mathrm{m/s}$ in velocity; altimeter noise was $0.15\,\mathrm m$.

The check covers the first $22\,\mathrm s$. The last second and a half is left out: there the guidance law's time-to-go floor makes the path briefly aggressive, and this kind of check is not the right tool.

- One representative run had a median NEES of $10.07$, against an expected mean of $7$. $97.6\%$ of its samples sat inside the $95\%$ band.
- Across twenty independent random seeds, the fraction inside the band averaged $91\%$, ranging from $69\%$ to $100\%$ depending on the noise draw.
- The filter finished with a position error of about $0.26\,\mathrm m$ and an attitude error of about $0.15^\circ$.

Sanity check: the filter's own final one-sigma position uncertainty, along the axis this burn stresses most, was $0.23\,\mathrm m$. The actual error, $0.26\,\mathrm m$, is about $1.1$ sigma — the size an honest filter should produce. The median running a bit above $7$ says the filter leans slightly overconfident, but not badly.
:::

A filter that passes this check tracks the truth and knows how well it is tracking. It says nothing about what happens when a *different* module plans from this output.

## The join: a repeating error meets a guidance law that trusts it

Convex powered-descent guidance, as the trajectory-optimization module built it, plans from the current state. Whatever navigation reports, guidance treats as the vehicle's true position and velocity. It has nothing else to plan from.

If navigation's error were fresh and random each time guidance looked — **white** noise — that would cost little. Guidance re-plans every $0.6\,\mathrm s$ from wherever the vehicle really ended up, so random offsets mostly cancel out.

Real navigation errors are not white. They are **correlated**: this moment's error looks a lot like the last moment's. How long an error "remembers" itself is its **[[correlation time|correlation-time]]**, written $\tau$ ("tau"). It is set by the physics that makes the error, not by anyone's software. The interesting case is when $\tau$ is close to guidance's own re-plan interval.

::: example Touchdown miss against how long a GNSS error lasts
To the GNSS position, add a slowly wandering extra error of $2\,\mathrm m$ one sigma — like **[[multipath|multipath]]**, where signals bounce off the ground and the geometry of the bounce changes as the vehicle descends. The GNSS module described errors of exactly this correlated kind. Keep the size fixed, vary only the correlation time $\tau$, and average touchdown miss over thirty seeds per case:

| Correlation time $\tau$ | Mean touchdown position error |
| --- | --- |
| $0.05\,\mathrm s$ (nearly white) | $0.44\,\mathrm m$ |
| $0.3\,\mathrm s$ | $0.91\,\mathrm m$ |
| $0.6\,\mathrm s$ (guidance's re-plan interval) | $1.03\,\mathrm m$ |
| $1.0\,\mathrm s$ | $1.02\,\mathrm m$ |
| $4.0\,\mathrm s$ | $0.71\,\mathrm m$ |
| $16.0\,\mathrm s$ (nearly a constant bias) | $0.43\,\mathrm m$ |
| No extra error (white GNSS noise only) | $0.21\,\mathrm m$ |

Read the table from top to bottom. The worst row is not either end. It sits right at the re-plan interval: $1.03\,\mathrm m$, which is $1.03 / 0.21 \approx 4.9$ times the white-noise baseline.

Why the middle? An error lasting about one guidance cycle is still there, nearly unchanged, at the *next* re-plan. So guidance re-aims from the same wrong spot again and again. A very short error is gone before the next re-plan. A very long one behaves like a fixed offset, which the filter's steady stream of GNSS updates slowly wears down over many cycles.
:::

A navigation unit test would never produce that table. It checks the filter's *reported* accuracy against a threshold. That reported one-sigma figure is **identical**, to four significant figures, in every row. The filter's covariance has no model of this extra error at all, so it reports the same confidence whether the error is tiny or dominant. What changes is touchdown miss, which only exists once guidance is in the loop.

::: key The join between navigation and guidance
Guidance treats the navigation estimate as the vehicle's current, exact state. A correlated navigation error whose correlation time is close to the guidance re-plan interval is the worst case for touchdown accuracy — not the largest error, not the longest-lived one, but the one that lasts just long enough to fool guidance at its next look. The filter's reported uncertainty does not change with that correlation time at all, so no navigation-only check can see the effect.
:::

::: warning "The filter passed its accuracy spec" is not "guidance will land accurately"
A navigation acceptance test that checks reported one-sigma accuracy in isolation cannot tell the best row of the table from the worst — both report the same figure. Only closing the loop with guidance and measuring touchdown miss directly can see the difference. That is why this module insists on an **[[integrated campaign|integrated-campaign]]** rather than trusting four passing component tests.
:::

::: warning Correlation time belongs to the error source, not to you
The $0.6\,\mathrm s$ worst case is not a coincidence you can tune away by picking a different guidance rate. A faster re-plan rate only moves *which* correlation time is worst. The defense is to characterize the real error sources well enough to know where they sit — the dispersion discipline the verification module built.
:::

## Check yourself

::: check
A student stores attitude as a quaternion and runs an ordinary Kalman filter on all four numbers. Name the two things that go wrong, and say how the multiplicative form avoids each.
:::

::: answer
First, the four numbers carry only three freedoms, because their squares must add to $1$. So the $4\times4$ covariance has a direction with zero uncertainty — it is singular and cannot be inverted. Second, each Kalman update *adds* a correction, which pushes the quaternion off unit length (in this lesson's example, a $0.05$ correction made it $1.0099$ long), and renormalizing afterwards is a step the covariance never accounted for.

The multiplicative form estimates only a three-number small turn $\delta\boldsymbol\theta$, so its $3\times3$ covariance block is full rank. It keeps the big rotation in a reference quaternion that is only ever *multiplied* by small turns, which keeps its length exactly $1$. After each update, the small turn is folded into the reference and reset to zero.
:::

::: check
Why is gyro bias calibrated on the ground and subtracted, rather than estimated in flight, in this lesson's filter? What kind of mission would make that choice wrong?
:::

::: answer
With no direct attitude sensor, attitude is visible only indirectly: an attitude error tips the accelerometer's measured push the wrong way, which becomes a velocity error GNSS can see. Over a short burn that channel is weak. Asking it to separate attitude error from an in-flight gyro-bias estimate at the same time risks resolving neither well.

A mission with a much longer coast before landing, or no reliable ground alignment window, would need a dedicated attitude sensor or a longer aided period instead.
:::

::: check
A seven-state filter's NEES has a median of about $12$ over many runs, with most samples still under $16$. Is the filter consistent? What would you expect to go wrong downstream if you ignored it?
:::

::: answer
No. An honest seven-state filter's NEES averages $7$ (its median is a little lower, about $6.3$). A median of $12$ means the real errors are consistently larger than the covariance claims — by roughly $\sqrt{12/7}\approx1.3$ times in each state on average. Staying mostly under the $16.01$ upper bound does not excuse a center that far off. The filter is overconfident.

Downstream: its Kalman gain under-weights new measurements, so it corrects itself too slowly; its gating rejects some good measurements as outliers; fault monitors scaled by its innovation covariance raise false alarms or miss real faults; and guidance sizes its margins on a confidence that is not real.
:::

::: check
A colleague says: the filter's NEES check passed with a median close to $7$, so the estimate is good enough for guidance without further study. What is the gap in that argument?
:::

::: answer
NEES checks that the covariance honestly describes the filter's own error — a statement about navigation alone. It says nothing about how the error's *correlation in time* meets how often a downstream module reads it. Every row of this lesson's table had the same reported accuracy, yet touchdown miss varied by a factor of about five.
:::

::: check
Using this lesson's table, explain why an error correlated for $16\,\mathrm s$ gives a smaller touchdown miss than one correlated for $0.6\,\mathrm s$, even though the longer one lasts much more of the burn. Then propose one integrated test that would catch the $0.6\,\mathrm s$ case early.
:::

::: answer
A $16\,\mathrm s$ error changes so slowly that it looks almost like a fixed offset, which the steady stream of GNSS updates gradually wears down. A $0.6\,\mathrm s$ error is still there at the very next re-plan, so guidance re-aims from the same wrong place, yet it changes too fast for the filter's slow correction to pin it down.

A targeted test: close guidance around the filter, inject a correlated error of realistic size, sweep its correlation time, and plot touchdown miss. It measures what NEES never can — the *closed-loop consequence* of the error's timing.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Sensors | IMU at $200\,\mathrm{Hz}$, GNSS at $10\,\mathrm{Hz}$, radar altimeter at $20\,\mathrm{Hz}$ below $1500\,\mathrm m$ |
| Filter, fitted | Planar MEKF: 7 error states (position, velocity, one attitude angle, two accelerometer biases); gyro bias calibrated on the ground |
| Why multiplicative | Quaternion: 4 numbers, 3 freedoms — direct covariance singular, additive updates break unit norm; estimate a 3-number error, fold in, reset |
| Planar reset Jacobian | Exactly $\mathbf G=1$: turns about one fixed axis commute |
| NEES | $\mathbf e^\top\mathbf P^{-1}\mathbf e$ against truth; for 7 states, $95\%$ band $(1.69,\,16.01)$, mean $7$ |
| NIS | Same idea on the innovation, needs no truth, used in flight |
| Measured consistency | Median $\approx10$ on one run; $\approx91\%$ inside the band on average across seeds |
| The join | Guidance trusts the estimate as exact; a correlated error persists across re-plans |
| Worst correlation time | $\approx0.6\,\mathrm s$, the re-plan interval: miss $\approx1.03\,\mathrm m$, about $5\times$ the white baseline of $0.21\,\mathrm m$ |
| What a nav-only test sees | Nothing — reported accuracy is identical in every row |

Navigation feeding guidance is one handoff. The next lesson follows guidance's own output — a commanded thrust direction, re-planned every $0.6\,\mathrm s$ — into the control loop that has to track it. There the question is not statistical at all: can the vehicle turn that fast?

::: context imu What an IMU actually measures
An **inertial measurement unit** is a box of three accelerometers and three gyros, one of each per axis. The gyros measure how fast the vehicle is turning. The accelerometers measure **specific force** — the push from the engine and the air, but *not* gravity, because the accelerometer falls along with everything else. Navigation adds gravity back from a model, then integrates twice to get position. The IMU is fast and needs nothing from outside, which is why it sets the $200\,\mathrm{Hz}$ heartbeat of navigation. Its weakness is drift: small biases, integrated over time, grow into large position errors. GNSS and the altimeter exist to pull that drift back.
:::

::: context radar-altimeter Why the altimeter only joins low down
A radar altimeter times a radio pulse down to the ground and back. At $1500\,\mathrm m$ the round trip takes $2 \times 1500 / (3\times10^8) = 10^{-5}$ seconds, ten microseconds. Its signal weakens with distance, and at a tilt it measures slant range to whatever patch of ground its beam sees, not straight-down height. So it is used only once the vehicle is low and nearly upright, where it gives the most accurate height the stack has. That is exactly when height matters most: the last kilometer and a half before touchdown.
:::

::: context quaternion The circle picture of a quaternion
A quaternion lives on a four-dimensional "sphere", which is hard to draw. Its flat cousin is easy: a turn in a plane can be stored as the point $(\cos\theta, \sin\theta)$ on a circle of radius $1$. Adding a small correction pushes the point off the circle, along the tangent. Multiplying by a small turn slides it *along* the circle, and it stays on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="110" r="80" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="110" x2="195.2" y2="82.6" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="195.2" cy="82.6" r="4.5" fill="#1d6fd1"/>
  <line x1="195.2" y1="82.6" x2="210.6" y2="124.9" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="210.6" cy="124.9" r="4" fill="#b4232c"/>
  <path d="M195.2,82.6 A80,80 0 0,1 198.2,126.9" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="198.2" cy="126.9" r="4" fill="#1d6fd1"/>
  <text x="200" y="72" font-size="12" fill="#1d6fd1">reference</text>
  <text x="218" y="120" font-size="12" fill="#b4232c">added: off the circle</text>
  <text x="206" y="150" font-size="12" fill="#1d6fd1">multiplied: stays on</text>
  <text x="120" y="196" font-size="12" text-anchor="middle" fill="#1f2a44">radius 1 = unit norm</text>
</svg>
```

The red step is an additive update; the blue arc is a multiplicative one. (The step is drawn large so you can see it.)
:::

::: context singular-covariance What "singular" means for a covariance
Picture uncertainty as a fuzzy cloud around the estimate. For honest, independent states the cloud has some thickness in every direction. For a quaternion, the cloud is squashed completely flat in one direction — the direction that would change the length, which the unit-norm rule forbids. A totally flat cloud has zero thickness there, and the matrix describing it has no inverse, the way you cannot divide by zero. The Kalman filter needs that inverse, so a flat cloud breaks it. Dropping to three error numbers removes the flat direction altogether.
:::

::: context chi-squared The chi-squared band
Square several independent bell-curve numbers, each scaled to one sigma, and add them up. The total follows a **chi-squared** distribution, named for the Greek letter $\chi$ ("kai"). With seven numbers the average total is $7$, the most likely value is $5$, and $95\%$ of totals land between $1.69$ and $16.01$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="65.3" y="30" width="214.9" height="120" fill="#8fb8f0" opacity="0.35"/>
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,150.0 47.5,146.6 55.0,135.2 62.5,118.3 70.0,99.3 77.5,81.0 85.0,65.2 92.5,52.9 100.0,44.4 107.5,39.6 115.0,38.1 122.5,39.4 130.0,43.0 137.5,48.2 145.0,54.6 152.5,61.7 160.0,69.2 167.5,76.7 175.0,84.2 182.5,91.3 190.0,98.1 197.5,104.3 205.0,110.0 212.5,115.2 220.0,119.9 227.5,124.0 235.0,127.7 242.5,130.9 250.0,133.7 257.5,136.1 265.0,138.2 272.5,140.1 280.0,141.6 287.5,143.0 295.0,144.1 302.5,145.1 310.0,145.9 317.5,146.6 325.0,147.1 332.5,147.6 340.0,148.0"/>
  <line x1="145" y1="150" x2="145" y2="54.6" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="166">0</text><text x="65.3" y="166">1.69</text><text x="145" y="166">7</text><text x="280.2" y="166">16.01</text><text x="340" y="166">20</text>
  </g>
  <text x="172" y="24" font-size="12" text-anchor="middle" fill="#1d6fd1">middle 95% of NEES for 7 states</text>
</svg>
```

The dashed line marks the mean, $7$.
:::

::: context innovation Why it is called the innovation
"Innovation" means the *new* part. When a GNSS fix arrives, the filter already had a prediction of what it would say. The only genuinely new information is the difference between the actual reading and that prediction. If the filter is right about itself, innovations look like fresh, unpredictable noise of the size $\mathbf S$ predicts. If they are consistently bigger, or keep leaning one way, the filter is fooling itself — and you can see that in flight, with no truth at all. The FDIR lesson later in this module builds its residual monitors on exactly this signal.
:::

::: context overconfident How filters talk themselves into being wrong
Filter **divergence** is a well-known failure: the covariance shrinks faster than the real error does, the gain falls toward zero, and the filter stops listening to its sensors while its estimate wanders away. It usually starts with process noise set too low — the designer told the filter the vehicle's motion is more predictable than it really is. The cure is honest process noise and modeling the effects you know about, rather than tuning the numbers until the plots look smooth.
:::

::: context correlation-time White noise and correlated noise
Both traces below have about the same size. The top one is **white**: every sample is a fresh draw, with no memory. The bottom one has a correlation time of about $1\,\mathrm s$ with samples every $0.1\,\mathrm s$: each sample mostly repeats the one before, so it wanders in slow swells.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="45" x2="345" y2="45" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="30" y1="125" x2="345" y2="125" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.5" points="30.0,50.2 34.5,46.4 39.0,31.7 43.5,39.7 48.0,58.1 52.5,45.0 57.0,50.0 61.5,43.8 66.0,57.9 70.5,43.1 75.0,43.1 79.5,32.4 84.0,42.5 88.5,40.9 93.0,56.9 97.5,27.0 102.0,60.3 106.5,36.2 111.0,47.6 115.5,52.0 120.0,50.3 124.5,50.4 129.0,42.0 133.5,45.9 138.0,33.1 142.5,59.6 147.0,45.0 151.5,52.1 156.0,38.8 160.5,61.9 165.0,47.7 169.5,43.3 174.0,56.9 178.5,37.1 183.0,43.6 187.5,36.9 192.0,37.3 196.5,52.8 201.0,51.4 205.5,46.6 210.0,39.0 214.5,38.2 219.0,50.7 223.5,49.9 228.0,51.4 232.5,49.7 237.0,46.9 241.5,46.1 246.0,28.5 250.5,49.1 255.0,47.3 259.5,41.3 264.0,52.6 268.5,47.9 273.0,44.9 277.5,38.8 282.0,55.5 286.5,34.0 291.0,47.8 295.5,43.6 300.0,38.2 304.5,39.7 309.0,36.5 313.5,43.6 318.0,45.2 322.5,42.5 327.0,53.0 331.5,35.3 336.0,51.2 340.5,55.1 345.0,28.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.8" points="30.0,126.1 34.5,130.0 39.0,123.2 43.5,124.5 48.0,120.9 52.5,124.2 57.0,125.1 61.5,130.8 66.0,136.8 70.5,139.0 75.0,137.9 79.5,134.0 84.0,124.8 88.5,128.4 93.0,124.6 97.5,126.7 102.0,127.1 106.5,131.9 111.0,136.3 115.5,137.9 120.0,140.7 124.5,139.2 129.0,140.3 133.5,134.6 138.0,133.1 142.5,131.8 147.0,127.3 151.5,125.3 156.0,125.4 160.5,125.7 165.0,126.0 169.5,122.2 174.0,119.8 178.5,119.1 183.0,116.9 187.5,119.6 192.0,118.3 196.5,123.8 201.0,119.3 205.5,119.5 210.0,119.4 214.5,117.9 219.0,118.6 223.5,120.1 228.0,116.5 232.5,116.9 237.0,120.8 241.5,119.7 246.0,126.0 250.5,120.3 255.0,121.3 259.5,121.5 264.0,114.2 268.5,107.9 273.0,109.1 277.5,108.5 282.0,106.3 286.5,102.4 291.0,105.0 295.5,106.4 300.0,104.0 304.5,105.1 309.0,104.4 313.5,104.3 318.0,110.1 322.5,114.5 327.0,124.5 331.5,125.4 336.0,120.8 340.5,125.0 345.0,120.8"/>
  <text x="30" y="16" font-size="12" fill="#b4232c">white: no memory</text>
  <text x="30" y="92" font-size="12" fill="#1d6fd1">correlated, τ ≈ 1 s: slow swells</text>
  <text x="345" y="164" font-size="11" text-anchor="end" fill="#1f2a44">7 s shown, one sample every 0.1 s</text>
</svg>
```

Guidance looking every $0.6\,\mathrm s$ sees independent values on the top trace, but nearly the same value twice in a row on the bottom one.
:::

::: context multipath Signals that take the long way round
GNSS works out distance from how long each satellite's signal takes to arrive. **Multipath** is when a copy of the signal bounces off something — the ground, a landing pad, the vehicle's own legs — and arrives a little late, blended with the direct signal. The receiver then measures a slightly longer distance. As the vehicle descends and tilts, the bounce geometry changes smoothly, so the error drifts rather than jumping about. That smooth drift is what gives it a correlation time.
:::

::: context integrated-campaign Where this comes back
This effect returns twice. Lesson 9, the integration-only failure, meets the same kind of correlated navigation error again, this time entering the control loop and being amplified by it. Lesson 11 builds the ten-thousand-case Monte Carlo campaign in which errors like this one are dispersed on purpose, so that the stack is judged on touchdown miss, not on each module's own pass mark.
:::
