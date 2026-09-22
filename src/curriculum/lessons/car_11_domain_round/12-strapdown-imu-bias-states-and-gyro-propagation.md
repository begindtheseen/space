---
id: l12-strapdown-imu-bias-states-and-gyro-propagation
title: "Strapdown IMU integration, bias states and gyro propagation"
minutes: 19
covers:
  - "strapdown IMU integration, bias states and gyro propagation"
---

An inertial measurement unit is the one sensor on the vehicle that never stops working, never needs a line of sight and never waits for a ground station — and it is also the one whose errors grow without bound if nothing corrects them. That combination is why every serious navigation system is an IMU plus something else, and why the domain round asks about the IMU half specifically: what it actually measures, how its output becomes a position, which of its errors matter and why they are estimated rather than calibrated away.

The fastest way to fail this subject is to say that an accelerometer measures acceleration. It does not, and the difference is not pedantic — it is the reason gravity has to be added from a model, which is the reason an attitude error turns into a position error, which is the reason a gyro bias is the dominant term in almost every inertial error budget.

## What an IMU actually measures

**The accelerometer measures specific force, not acceleration.** A proof mass suspended in the instrument responds to every force except gravity, because gravity acts on the mass and its suspension equally. So the output is

$$\mathbf{f} = \mathbf{a} - \mathbf{g}_{\mathrm{grav}},$$

where $\mathbf{a}$ is the inertial acceleration and $\mathbf{g}_{\mathrm{grav}}$ the gravitational field. In free fall the reading is zero; sitting on a bench it reads $+g$ upward, because the bench is pushing. The navigator recovers acceleration by adding the model gravity, $\mathbf{a} = \mathbf{f} + \mathbf{g}$, evaluated at the computed position — which is why an error in the gravity model is indistinguishable from an accelerometer bias.

**The gyro measures angular rate with respect to inertial space**, resolved in body axes. Not with respect to the ground: a gyro bolted to a bench senses the Earth's rotation, $\omega_{ie} = 7.292115\times10^{-5}\,\mathrm{rad/s}$, which is $15.041^\circ/\mathrm{h}$. That number is the dividing line for gyrocompassing: an instrument whose bias is well below it can find north by watching which way the Earth turns, and one whose bias is a large fraction of it cannot.

## The strapdown mechanisation, in three steps

"Strapdown" means the sensors are bolted to the vehicle and the levelling that a gimballed platform did mechanically is done in software. The three steps run in this order every cycle, and the order matters.

**Attitude.** Integrate the gyros to maintain the body-to-navigation rotation, $\mathbf{C}_b^n$ or equivalently a quaternion. In a navigation frame you must first remove the rates the frame itself is turning at: $\boldsymbol{\omega}_{nb}^b = \boldsymbol{\omega}_{ib}^b - \mathbf{C}_n^b(\boldsymbol{\omega}_{ie}^n + \boldsymbol{\omega}_{en}^n)$, Earth rate plus transport rate.

**Velocity.** Rotate the specific force into the navigation frame and add gravity and the frame's rotation terms:

$$\dot{\mathbf{v}}^n = \mathbf{C}_b^n\mathbf{f}^b - \left(2\boldsymbol{\omega}_{ie}^n + \boldsymbol{\omega}_{en}^n\right)\times\mathbf{v}^n + \mathbf{g}^n.$$

In an Earth-centred inertial frame the rotation terms vanish and it is simply $\dot{\mathbf{v}}^i = \mathbf{f}^i + \mathbf{g}^i_{\mathrm{grav}}$, which is the version to write on a whiteboard for a spacecraft question.

**Position.** Integrate the velocity, through the local radii of curvature if the output is latitude and longitude.

The single sentence that makes the whole thing intelligible: **the attitude solution is what rotates the specific force, so every attitude error misprojects gravity into the horizontal channels.** That chain — gyro to attitude to gravity leak to velocity to position — is why gyro errors dominate.

::: key What an IMU measures, and the mechanisation loop
Accelerometers measure specific force $\mathbf{f} = \mathbf{a} - \mathbf{g}_{\mathrm{grav}}$: zero in free fall, $+g$ at rest. Gyros measure rate with respect to inertial space, so they sense Earth rate at $15.041^\circ/\mathrm{h}$. Mechanisation is attitude first, then $\dot{\mathbf{v}}^n = \mathbf{C}_b^n\mathbf{f}^b - (2\boldsymbol{\omega}_{ie}^n + \boldsymbol{\omega}_{en}^n)\times\mathbf{v}^n + \mathbf{g}^n$, then position. An attitude error leaks gravity into the horizontal channels, which is the dominant error path.
:::

## Gyro propagation

For the attitude, the quantity to integrate is the quaternion kinematic equation, scalar-first, with $\boldsymbol{\omega}$ the body rate in body axes:

$$\dot{\mathbf{q}} = \tfrac12\,\boldsymbol{\Omega}(\boldsymbol{\omega})\,\mathbf{q} = \tfrac12\,\mathbf{q}\otimes[0, \boldsymbol{\omega}].$$

Over one sample interval, if the rate is constant in both magnitude and direction, the exact solution is a single rotation through $\boldsymbol{\phi} = \boldsymbol{\omega}\Delta t$:

$$\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \left(\cos\frac{\lVert\boldsymbol{\phi}\rVert}{2},\ \ \sin\frac{\lVert\boldsymbol{\phi}\rVert}{2}\,\frac{\boldsymbol{\phi}}{\lVert\boldsymbol{\phi}\rVert}\right).$$

Two things to say about this on a whiteboard.

**Renormalise.** The continuous flow preserves the norm exactly — $\boldsymbol{\Omega}$ is skew, so $d(\mathbf{q}^{\mathsf{T}}\mathbf{q})/dt = 0$ — but a discrete integrator drifts off the unit sphere in finite precision. Renormalising each step is standard and costs nothing.

**Coning.** The closed form above is exact only if the rate *direction* is fixed through the interval. If the rate vector itself rotates within the sample — which is exactly what vibration or a coning motion does — then successive small rotations do not commute, and integrating the rate naively accumulates a systematic attitude error that a static bench test will never show. Multi-sample **coning** algorithms take two or more gyro samples per attitude update and add a correction term built from their cross product. The velocity channel has the same problem under simultaneous rotation and acceleration, where the correction is called **sculling**. Naming both, and saying that they are rectification errors driven by vibration rather than noise, is the depth an interviewer is looking for here.

## Bias states, and why they are estimated rather than calibrated

A gyro bias is not one number. It is at least three distinct effects, and confusing them produces a filter that is wrong in a specific direction.

**Turn-on bias** is constant within a run and different between runs. It cannot be calibrated once and stored; it has to be estimated afresh each run, by alignment or by the aiding filter.

**In-run bias** is the wander during the run. It is modelled as a first-order Gauss–Markov process, $\dot{b} = -b/T + w$, with a correlation time $T$ and a stationary standard deviation equal to the datasheet's **bias instability**. Its defining property is that it saturates: watching longer does not widen the band.

**Rate random walk** is a slower drift with no restoring term at all, $\dot{b} = w_r$, whose uncertainty does grow without bound.

Most real sensors have both of the last two at once, which is why a filter usually carries the Gauss–Markov state and accepts a small rate-random-walk contribution rather than trying to represent one with the other. Substituting one for the other fails in a dangerous direction in each case: a rate-random-walk state where a saturating bias belongs makes the filter distrust a perfectly good bias estimate on a long quiet flight, and a Gauss–Markov state where a genuine long-term drift belongs lets the covariance saturate while the real bias keeps walking away.

On the accelerometer side there is one more fact worth carrying: **an accelerometer bias $a$ is indistinguishable from a tilt of $a/g$.** Both put the same spurious horizontal specific force into the navigation frame. A bias of $100\,\mathrm{\mu g}$ looks exactly like a tilt of $20.6$ arcseconds, which is why accelerometer bias and attitude error are correlated in an aided filter and why levelling accuracy and accelerometer quality are the same requirement wearing two hats.

The standard aided-navigation filter therefore carries fifteen error states: three position, three velocity, three attitude, three accelerometer biases, three gyro biases. Twenty-one adds three accelerometer and three gyro scale-factor errors, and the criterion for carrying them is not the platform's grade but whether the vehicle's dynamics span a wide enough range of specific force and rate to make a scale-factor error separable from a plain bias.

::: key The bias states
Turn-on bias is constant within a run and different between runs, so it must be estimated each run. In-run bias is modelled as first-order Gauss–Markov with a correlation time and a stationary standard deviation equal to the bias instability; it saturates. Rate random walk has no restoring term and grows without bound. An accelerometer bias $a$ is indistinguishable from a tilt of $a/g$. The standard aided filter carries fifteen error states; twenty-one when scale factors are separable.
:::

::: example What each error is worth, at one minute of free inertial coasting
Short-time error laws for a coast, valid while $t$ is small compared with $1/\omega_s \approx 806\,\mathrm{s}$, about $13.4$ minutes, past which the Schuler oscillation (period $84.4$ minutes) bounds the accelerometer-driven terms:

- Gyro bias $b$: attitude error $bt$, velocity error $gbt^2/2$, position error $gbt^3/6$.
- Accelerometer bias $a$: velocity error $at$, position error $at^2/2$.
- Angle random walk: attitude standard deviation $\mathrm{ARW}\sqrt{t}$.

Take a tactical-grade unit: gyro bias $10^\circ/\mathrm{h}$, accelerometer bias $100\,\mathrm{\mu g}$, angle random walk $0.05^\circ/\sqrt{\mathrm{h}}$. In SI, $10^\circ/\mathrm{h} = 4.8481\times10^{-5}\,\mathrm{rad/s}$ and $100\,\mathrm{\mu g} = 9.8067\times10^{-4}\,\mathrm{m/s^2}$.

| Source | At $t = 60\,\mathrm{s}$ |
| --- | --- |
| Gyro bias: tilt | $0.1667^\circ$ |
| Gyro bias: velocity error | $0.856\,\mathrm{m/s}$ |
| Gyro bias: position error | $17.1\,\mathrm{m}$ |
| Accelerometer bias: velocity error | $0.0588\,\mathrm{m/s}$ |
| Accelerometer bias: position error | $1.77\,\mathrm{m}$ |
| Angle random walk: attitude | $0.00645^\circ$, or $23.2$ arcseconds |

Read the ranking. After one minute the gyro bias term is already about ten times the accelerometer bias term in position, and the gap widens as $t$, because one grows as $t^3$ and the other as $t^2$. The angle random walk has contributed an attitude error of $23$ arcseconds against the bias's $600$ — noise is not the problem on this timescale, the systematic term is.

The sanity check that makes the ranking memorable: the gyro bias enters position through *three* integrations — bias to tilt, tilt to a gravity leak of $g\theta$, then twice more to position — while the accelerometer bias enters through only two. Any error source that reaches the position channel through an extra integration will eventually dominate, and "eventually" here is under a minute.
:::

::: example "How does a gyro bias turn into a position error?"
**A weak answer:** "The gyro bias integrates into an attitude error, and the attitude error makes the accelerometer readings wrong, so the position drifts. A better gyro fixes it."

The chain is right and there is no mechanism and no number in it.

**A strong answer:**

"Four steps, and the third is the one that does the work.

One: the bias integrates directly into attitude. A constant gyro bias $b$ gives an attitude error of $bt$ — nothing subtle, it is the definition of a rate error integrated.

Two: the attitude solution is what rotates the accelerometer's specific force into the navigation frame. So a tilt of $\theta$ misprojects the vector the accelerometers are measuring.

Three, and this is the key: what they are measuring at rest, or in any low-acceleration phase, is essentially the reaction to gravity, one $g$. So a tilt of $\theta$ leaks a horizontal specific force of $g\sin\theta \approx g\theta$ into the navigation frame — an acceleration the vehicle is not experiencing. That is why the gyro error becomes a *large* acceleration error rather than a small one: it is multiplied by $g$, not by the vehicle's own acceleration.

Four: integrate that twice. With $\theta = bt$ the spurious acceleration is $gbt$, the velocity error is $gbt^2/2$ and the position error is $gbt^3/6$ — cubic in time.

Numbers, for a tactical-grade gyro at ten degrees per hour, which is $4.85\times10^{-5}\,\mathrm{rad/s}$. At sixty seconds: a tilt of a sixth of a degree, a velocity error of about $0.86\,\mathrm{m/s}$, a position error of about $17\,\mathrm{m}$. Compare an accelerometer bias of a hundred micro-$g$ over the same minute: $1.8\,\mathrm{m}$. Ten times less, and the ratio grows linearly with time because of the extra integration.

Two caveats I would state. The cubic law holds only while $t$ is small compared with the Schuler time constant, about thirteen minutes; past that the loop closes through the position-dependent gravity and the accelerometer-driven terms become bounded oscillations at the $84$-minute Schuler period, while the gyro bias keeps producing a secular drift — so at long durations the gyro bias is not merely dominant, it is the only term still growing. And on a vehicle under sustained acceleration the accelerometer's own scale-factor error grows in importance, because it multiplies the sensed specific force rather than adding to it.

Which is why the answer to 'what do we do about it' is not only a better gyro: it is to estimate the bias as a filter state, so an aiding measurement can observe it and take it out."

**What the interviewer learns:** the candidate gives four mechanical steps rather than a summary, identifies gravity as the amplifier, produces the $t^3$ law and puts real numbers on it, compares it with the competing error source, bounds the validity of the formula, and ends on the engineering response rather than on the physics.
:::

## Check yourself

::: check
An accelerometer sits at rest on a bench. What does it read, and what does that tell you about the difference between acceleration and specific force?
:::

::: answer
It reads $+g$ directed upward — about $9.81\,\mathrm{m/s^2}$ along the local vertical — even though the instrument is not accelerating at all. Specific force is $\mathbf{f} = \mathbf{a} - \mathbf{g}_{\mathrm{grav}}$: the instrument responds to every force except gravity, because gravity acts on the proof mass and its suspension identically and produces no relative displacement. At rest, $\mathbf{a} = \mathbf{0}$, so $\mathbf{f} = -\mathbf{g}_{\mathrm{grav}}$, which points up. In free fall the reverse holds and the reading is zero despite an acceleration of one $g$. The navigational consequence is that gravity must be supplied analytically and added, $\mathbf{a} = \mathbf{f} + \mathbf{g}$, at the computed position — so a gravity-model error and an accelerometer bias are indistinguishable to the filter.
:::

::: check
Why does a gyro bolted to a laboratory bench not read zero, and what capability does that fact enable?
:::

::: answer
Because a gyro measures rate relative to inertial space, not relative to the ground, and the ground is rotating. It senses the Earth's rotation rate, $7.292115\times10^{-5}\,\mathrm{rad/s}$, which is $15.041^\circ/\mathrm{h}$, projected onto its input axis. The capability this enables is **gyrocompassing**: since the Earth-rate vector points along the polar axis, observing its projection on a levelled instrument determines the direction of true north without any external reference. Whether an instrument can do it is decided by comparing its bias instability with $15.041^\circ/\mathrm{h}$ — a navigation-grade gyro at a hundredth of a degree per hour can gyrocompass comfortably; a MEMS unit whose bias wanders by several degrees per hour cannot find north at all.
:::

::: check
Write the constant-rate quaternion update, and say when it stops being exact.
:::

::: answer
With $\boldsymbol{\phi} = \boldsymbol{\omega}\Delta t$, the update is $\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \left(\cos(\lVert\boldsymbol{\phi}\rVert/2),\ \sin(\lVert\boldsymbol{\phi}\rVert/2)\,\boldsymbol{\phi}/\lVert\boldsymbol{\phi}\rVert\right)$, which is the exact solution of $\dot{\mathbf{q}} = \tfrac12\mathbf{q}\otimes[0,\boldsymbol{\omega}]$ for a rate that is constant in magnitude *and direction* across the interval. It stops being exact as soon as the rate vector's direction changes within the sample, because finite rotations about different axes do not commute, so the composition of the true sequence of infinitesimal rotations is not the single rotation through the integrated rate vector. That mismatch is **coning**, it is systematic rather than random, it is driven by vibration or genuine coning motion, and it is removed by multi-sample algorithms that add a correction built from the cross product of successive gyro samples. The velocity channel has the analogous **sculling** error under simultaneous rotation and acceleration.
:::

::: check
A vehicle coasts for two minutes with no aiding. Its gyro bias is $10^\circ/\mathrm{h}$ and its accelerometer bias is $100\,\mathrm{\mu g}$. Which dominates the position error, and by roughly how much?
:::

::: answer
The gyro bias, by about a factor of twenty. In SI the biases are $4.8481\times10^{-5}\,\mathrm{rad/s}$ and $9.8067\times10^{-4}\,\mathrm{m/s^2}$. The gyro term is $gbt^3/6$: with $t = 120\,\mathrm{s}$ that is $9.80665 \times 4.8481\times10^{-5} \times 1.728\times10^{6}/6$, about $137\,\mathrm{m}$. The accelerometer term is $at^2/2 = 9.8067\times10^{-4}\times 14400/2$, about $7.06\,\mathrm{m}$. The ratio is roughly $19$, and it grows linearly with time because the gyro term is cubic and the accelerometer term quadratic — at sixty seconds the ratio was about ten. Both figures are inside the short-time window, since two minutes is well under the $806\,\mathrm{s}$ where the Schuler loop starts bounding the accelerometer-driven terms.
:::

::: check
Why is a gyro bias estimated as a filter state rather than measured once and subtracted?
:::

::: answer
Because it is not one fixed number. The turn-on component is constant within a run but different every run, so a stored calibration from the factory or from the last flight is the wrong number the moment power is cycled. The in-run component wanders during the run, on a correlation time of minutes to hours, so even a perfect estimate at alignment decays in value. And a rate-random-walk component drifts without any restoring mechanism on the timescales a flight cares about. A filter state with appropriate dynamics — first-order Gauss–Markov for the wander, with process noise for the slower drift — tracks all of that as aiding measurements arrive. The aiding is what makes it observable: the bias produces an attitude error at rate $b$, the attitude error leaks gravity into the horizontal channels, and a position or velocity fix sees the consequence. Which is also why bias observability degrades exactly when the aiding stops.
:::

## Summary

| Item | Content |
| --- | --- |
| Accelerometer | Measures specific force $\mathbf{f} = \mathbf{a} - \mathbf{g}_{\mathrm{grav}}$; zero in free fall, $+g$ at rest |
| Gyro | Measures rate relative to inertial space; senses Earth rate $7.292115\times10^{-5}\,\mathrm{rad/s} = 15.041^\circ/\mathrm{h}$ |
| Velocity mechanisation | $\dot{\mathbf{v}}^n = \mathbf{C}_b^n\mathbf{f}^b - (2\boldsymbol{\omega}_{ie}^n + \boldsymbol{\omega}_{en}^n)\times\mathbf{v}^n + \mathbf{g}^n$ |
| Quaternion kinematics | $\dot{\mathbf{q}} = \tfrac12\mathbf{q}\otimes[0,\boldsymbol{\omega}]$; exact constant-rate step through $\boldsymbol{\phi} = \boldsymbol{\omega}\Delta t$; renormalise |
| Coning and sculling | Rectification errors when the rate direction rotates within a sample; fixed by multi-sample algorithms |
| Bias states | Turn-on (per run), in-run (Gauss–Markov, saturates), rate random walk (unbounded) |
| Accelerometer bias equivalence | A bias $a$ is indistinguishable from a tilt of $a/g$; $100\,\mathrm{\mu g}$ is $20.6$ arcseconds |
| Error laws (short time) | Gyro bias: $bt$, $gbt^2/2$, $gbt^3/6$. Accelerometer bias: $at$, $at^2/2$. ARW: $\mathrm{ARW}\sqrt{t}$ |
| Worked budget at $60\,\mathrm{s}$ | $10^\circ/\mathrm{h}$: $0.167^\circ$, $0.856\,\mathrm{m/s}$, $17.1\,\mathrm{m}$. $100\,\mathrm{\mu g}$: $0.0588\,\mathrm{m/s}$, $1.77\,\mathrm{m}$ |
| Validity | Short-time laws hold for $t \ll 1/\omega_s \approx 806\,\mathrm{s}$; Schuler period $84.4$ minutes |
| Filter size | Fifteen error states standard; twenty-one when scale factors are separable |

One subject remains: orbit determination, where the same estimation machinery meets real tracking data, and where the choice between processing an arc all at once and processing it as it arrives is the question you will be asked.
