---
id: l12-strapdown-imu-bias-states-and-gyro-propagation
title: "Strapdown IMU integration, bias states and gyro propagation"
minutes: 22
covers:
  - "strapdown IMU integration, bias states and gyro propagation"
---

Close your eyes in a room you know and walk to the door. Counting steps and feeling each turn, for a few seconds you know exactly where you are. But each small mistake adds to the last. After a minute you are bumping into furniture. Navigating by adding up your own motion, with nothing outside to check against, is called **[[dead reckoning|dead-reckoning]]**.

A spacecraft or rocket does the same thing with an **IMU** (said "I-M-U"), an **inertial measurement unit**: a box of sensors that feels how the vehicle turns and pushes. It never stops working, never needs to see anything, and never waits for a ground station — but its errors grow without limit if nothing corrects them. So every serious navigation system is an IMU *plus* something else. The domain round asks about the IMU half: what it measures, how its output becomes a position, which errors matter, and why they are estimated rather than calibrated away.

The fastest way to fail this subject is to say "an accelerometer measures acceleration". It does not. That is why gravity has to be added from a model, why a small tilt becomes a big position error, and why a gyro bias is the largest term in almost every inertial error budget.

## What an IMU actually measures

An IMU holds two kinds of sensor, usually three of each, pointed along three axes at right angles.

### The accelerometer feels specific force

Picture standing on a bathroom scale in an elevator. Standing still, it shows your weight. If the cable snapped (do not try this), you and the scale would fall together, and it would read zero — even though you are speeding up at one $g$, the full pull of gravity.

An **accelerometer** is that scale. Inside is a small **[[proof mass|proof-mass]]** on a spring. The instrument feels every force except gravity, because gravity pulls on the proof mass and its case equally, so the spring does not stretch. What it reports is the **specific force** — the non-gravity force per unit mass:

$$\mathbf{f} = \mathbf{a} - \mathbf{g}_{\mathrm{grav}}.$$

Here $\mathbf{a}$ is the true acceleration relative to the stars, and $\mathbf{g}_{\mathrm{grav}}$ is the pull of gravity. Two checks:

- **Free fall:** $\mathbf{a} = \mathbf{g}_{\mathrm{grav}}$, so $\mathbf{f} = \mathbf{0}$. The reading is zero.
- **Sitting on a bench:** $\mathbf{a} = \mathbf{0}$, so $\mathbf{f} = -\mathbf{g}_{\mathrm{grav}}$. Gravity points down, so the reading is $+g$ *upward*. That is the bench pushing.

So the navigation computer gets the real acceleration back by adding gravity from a model, $\mathbf{a} = \mathbf{f} + \mathbf{g}$, worked out at the computed position. A consequence: a gravity-model error looks exactly like an accelerometer error.

### The gyro feels turning relative to the stars

A **gyro** (short for gyroscope) measures **angular rate** — how fast the vehicle turns — relative to **inertial space**: the distant stars, not the ground. It reports along the vehicle's own axes, the **body axes**.

So a gyro bolted to a lab bench does not read zero. It feels the Earth turning under it:

$$\omega_{ie} = 7.292115\times10^{-5}\,\mathrm{rad/s} = 15.041^\circ/\mathrm{h}.$$

Read $\omega_{ie}$ as "omega i e": the rate of the Earth frame ($e$) relative to the inertial frame ($i$). Relative to the stars the Earth turns once every $23.93$ hours, a bit less than a day — hence $15.041$ rather than $15$ degrees per hour.

That number is the dividing line for **[[gyrocompassing|gyrocompassing]]**, finding north by feeling which way the Earth turns. A gyro whose error is well below $15.041^\circ/\mathrm{h}$ can do it. One whose error is a large fraction of it cannot.

## The strapdown recipe, in three steps

Older systems held the sensors on a **[[gimbaled platform|gimballed-platform]]** — rings on bearings that kept them level no matter how the vehicle turned. In a **strapdown** system the sensors are bolted straight to the vehicle, and the leveling is done in software. Three steps run in this order every cycle, and the order matters.

First, some notation. $\mathbf{C}_b^n$, read "C b to n", is the rotation matrix that turns a vector written in body axes ($b$) into the same vector written in the **navigation frame** ($n$) — often north, east and down. A superscript on a vector says which axes it is written in: $\mathbf{f}^b$ is the specific force in body axes.

**Step 1 — Attitude.** Add up the gyro readings to keep track of $\mathbf{C}_b^n$ (or the equivalent quaternion, next section). The navigation frame itself turns: it rides on the spinning Earth, and it tips as the vehicle travels over the curved surface. So first remove those rates:

$$\boldsymbol{\omega}_{nb}^b = \boldsymbol{\omega}_{ib}^b - \mathbf{C}_n^b\left(\boldsymbol{\omega}_{ie}^n + \boldsymbol{\omega}_{en}^n\right).$$

In words: the body's turn relative to the navigation frame is what the gyros feel, minus **Earth rate** $\boldsymbol{\omega}_{ie}$, minus **transport rate** $\boldsymbol{\omega}_{en}$ (the frame tipping as you move over the globe).

**Step 2 — Velocity.** Rotate the specific force into the navigation frame, add gravity, and correct for the turning frame:

$$\dot{\mathbf{v}}^n = \mathbf{C}_b^n\mathbf{f}^b - \left(2\boldsymbol{\omega}_{ie}^n + \boldsymbol{\omega}_{en}^n\right)\times\mathbf{v}^n + \mathbf{g}^n.$$

The dot means "rate of change", so read $\dot{\mathbf{v}}^n$ as "v dot". The middle term, with the $\times$ (the cross product), is the **[[Coriolis|coriolis]]** and turning-frame correction.

In an **Earth-centered inertial** frame — axes fixed to the stars — those terms vanish, leaving $\dot{\mathbf{v}}^i = \mathbf{f}^i + \mathbf{g}^i_{\mathrm{grav}}$. That is the version to write on a whiteboard for a spacecraft question.

**Step 3 — Position.** Add up the velocity. If the output is latitude and longitude, that goes through the Earth's local radii of curvature.

The sentence that makes it all make sense: **the attitude solution is what rotates the specific force, so every attitude error points gravity a little bit sideways, into the horizontal channels.** That chain — gyro to attitude to gravity leak to velocity to position — is why gyro errors dominate.

::: key What an IMU measures, and the mechanization loop
Accelerometers measure specific force $\mathbf{f} = \mathbf{a} - \mathbf{g}_{\mathrm{grav}}$: zero in free fall, $+g$ at rest. Gyros measure rate with respect to inertial space, so they sense Earth rate at $15.041^\circ/\mathrm{h}$. Mechanization is attitude first, then $\dot{\mathbf{v}}^n = \mathbf{C}_b^n\mathbf{f}^b - (2\boldsymbol{\omega}_{ie}^n + \boldsymbol{\omega}_{en}^n)\times\mathbf{v}^n + \mathbf{g}^n$, then position. An attitude error leaks gravity into the horizontal channels, which is the dominant error path.
:::

::: warning "The accelerometer measures acceleration"
It measures specific force. Say it wrong and you will forget gravity, or add it with the wrong sign — and an accelerometer on a bench will seem to be accelerating upward at $9.81\,\mathrm{m/s^2}$. Check any formula against the two easy cases: free fall must read zero, and resting on a table must read $+g$ up.
:::

## Gyro propagation

To keep track of attitude, the flight computer usually stores a **[[quaternion|quaternion]]** — four numbers that describe a rotation, written scalar part first. With $\boldsymbol{\omega}$ the body rate in body axes, it changes as

$$\dot{\mathbf{q}} = \tfrac12\,\boldsymbol{\Omega}(\boldsymbol{\omega})\,\mathbf{q} = \tfrac12\,\mathbf{q}\otimes[0, \boldsymbol{\omega}].$$

The symbol $\otimes$ is quaternion multiplication: doing one rotation after another. $\boldsymbol{\Omega}(\boldsymbol{\omega})$ is the same operation written as a $4\times4$ matrix.

Over one sample interval $\Delta t$ ("delta t"), suppose the rate is constant in size *and* direction. Then the vehicle turns about one fixed axis through the rotation vector $\boldsymbol{\phi} = \boldsymbol{\omega}\Delta t$ ("phi"). Its length $\lVert\boldsymbol{\phi}\rVert$ is the angle turned, and its direction is the axis. The exact update is one rotation through that angle:

$$\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \left(\cos\frac{\lVert\boldsymbol{\phi}\rVert}{2},\ \ \sin\frac{\lVert\boldsymbol{\phi}\rVert}{2}\,\frac{\boldsymbol{\phi}}{\lVert\boldsymbol{\phi}\rVert}\right).$$

Two things to say about this on a whiteboard.

**Renormalize.** A rotation quaternion must have length exactly $1$. The true motion keeps it there, but rounding slowly drifts it off. Dividing by the length each step is standard and nearly free.

::: note Why the length stays exactly one
The length squared is $\mathbf{q}^{\mathsf{T}}\mathbf{q}$. Its rate of change is $2\mathbf{q}^{\mathsf{T}}\dot{\mathbf{q}} = \mathbf{q}^{\mathsf{T}}\boldsymbol{\Omega}\mathbf{q}$. The matrix $\boldsymbol{\Omega}$ is **skew-symmetric**: flipping it across its diagonal gives its negative, $\boldsymbol{\Omega}^{\mathsf{T}} = -\boldsymbol{\Omega}$. For any such matrix, $\mathbf{q}^{\mathsf{T}}\boldsymbol{\Omega}\mathbf{q}$ is a number equal to its own negative, so it is zero. So $d(\mathbf{q}^{\mathsf{T}}\mathbf{q})/dt = 0$ exactly. Only the computer's rounding pulls it away.
:::

**Coning.** The single-rotation update is exact only if the rate *direction* is fixed during the interval. Try this with a book: turn it $90^\circ$ about one edge, then $90^\circ$ about another. Now do the same two turns in the other order. The book ends up facing a different way. Rotations about different axes do not **commute** — the order matters.

So if the rate vector swings around within one sample, as under vibration or a **[[coning motion|coning]]**, adding up the rate naively builds a steady attitude error that a still bench test never shows. **Coning algorithms** use two or more gyro samples per update and add a correction built from their cross product. The velocity channel's version, under rotation plus acceleration, is **sculling**. Naming both, and calling them **rectification errors** — vibration turned into steady drift, not noise — is the depth an interviewer wants.

## Bias states, and why they are estimated

A **bias** is a sensor's steady offset: it reads something when the truth is zero. A gyro bias is at least three effects, and mixing them up makes a filter wrong in a particular direction.

**Turn-on bias** is constant during a run and different each time the unit powers up. A value stored at the factory is wrong the moment the power cycles, so it has to be estimated fresh each run — by alignment before launch or by the aiding filter.

**In-run bias** wanders during the run. It is modeled as a **[[first-order Gauss–Markov|gauss-markov]]** process,

$$\dot{b} = -b/T + w,$$

where $T$ is the **correlation time** (how long the bias "remembers" its value) and $w$ is white noise. Its steady-state standard deviation is usually set from the datasheet's **bias instability** figure. Its defining property is that it *saturates*: watching longer does not widen the band it wanders in, because the $-b/T$ term keeps pulling it back.

**Rate random walk** is a slower drift with no pull-back at all, $\dot{b} = w_r$. Its uncertainty grows without limit.

Real sensors have both, so a filter usually carries the Gauss–Markov state plus a small rate-random-walk contribution, rather than making one stand in for the other.

::: warning Swapping the two bias models
Each swap fails in a dangerous direction. Put a rate-random-walk state where a saturating bias belongs, and on a long quiet flight the filter's uncertainty keeps growing, so it stops trusting a perfectly good bias estimate. Put a Gauss–Markov state where a real long-term drift belongs, and the covariance levels off while the true bias keeps walking away — the filter is confident and wrong.
:::

On the accelerometer side there is one more fact worth carrying: **an accelerometer bias $a$ is indistinguishable from a tilt of $a/g$.** Tilt a perfect accelerometer by a small angle $\theta$ and it picks up a sideways share of gravity, $g\sin\theta \approx g\theta$. An untilted one with bias $a$ reads the same sideways force when $g\theta = a$. So $\theta = a/g$.

A bias of $100\,\mathrm{\mu g}$ — "micro-g", a millionth of $g$, times $100$ — is a tilt of $10^{-4}\,\mathrm{rad}$, which is $20.6$ **arcseconds** (an arcsecond is $1/3600$ of a degree). That is why accelerometer bias and attitude error are correlated in an aided filter, and why leveling accuracy and accelerometer quality are the same requirement wearing two hats.

The standard aided-navigation filter therefore carries **[[fifteen error states|fifteen-states]]**: three position, three velocity, three attitude, three accelerometer biases and three gyro biases. **Twenty-one** adds three accelerometer and three gyro **scale-factor** errors (a reading that is a fixed percentage too big or too small). The test for carrying them is not sensor grade but whether the vehicle's motion spans enough specific force and turn rate for a scale-factor error to look different from a plain bias.

::: key The bias states
Turn-on bias is constant within a run and different between runs, so it must be estimated each run. In-run bias is modeled as first-order Gauss–Markov with a correlation time and a stationary standard deviation set by the bias instability; it saturates. Rate random walk has no restoring term and grows without bound. An accelerometer bias $a$ is indistinguishable from a tilt of $a/g$. The standard aided filter carries fifteen error states; twenty-one when scale factors are separable.
:::

## How each error grows

Now follow [[the chain|error-chain]] for a constant gyro bias $b$ (in rad/s) during a **coast** — a stretch with no outside fixes.

1. The bias adds up into a tilt: $\theta = bt$.
2. The tilt leaks gravity sideways: a false acceleration of $g\theta = gbt$.
3. Add that up once: a velocity error of $gbt^2/2$.
4. Add up again: a position error of $gbt^3/6$ — growing with the *cube* of time.

An accelerometer bias $a$ skips the first two steps. It is already a false acceleration, so it gives a velocity error $at$ and a position error $at^2/2$. Pure gyro noise, called **angle random walk** (ARW), gives an attitude spread that grows only as $\mathrm{ARW}\sqrt{t}$.

These laws hold while $t$ is small compared with $1/\omega_s \approx 806\,\mathrm{s}$, about $13.4$ minutes, where $\omega_s = \sqrt{g/R}$ is the **[[Schuler|schuler]]** frequency ($R$ is the Earth's radius). Past that, gravity's changing direction as you move pulls the accelerometer-driven errors into a slow swing with a period of $84.4$ minutes.

::: example What each error is worth after one minute of coasting
Take a **tactical-grade** unit (a middle quality class, typical of missiles and drones): gyro bias $10^\circ/\mathrm{h}$, accelerometer bias $100\,\mathrm{\mu g}$, angle random walk $0.05^\circ/\sqrt{\mathrm{h}}$.

**Convert to SI.** $10^\circ/\mathrm{h} = 10 \times (\pi/180) / 3600 = 4.8481\times10^{-5}\,\mathrm{rad/s}$. And $100\,\mathrm{\mu g} = 100\times10^{-6}\times 9.80665 = 9.8067\times10^{-4}\,\mathrm{m/s^2}$.

**Plug in $t = 60\,\mathrm{s}$.**

| Source | At $t = 60\,\mathrm{s}$ |
| --- | --- |
| Gyro bias: tilt | $0.1667^\circ$ |
| Gyro bias: velocity error | $0.856\,\mathrm{m/s}$ |
| Gyro bias: position error | $17.1\,\mathrm{m}$ |
| Accelerometer bias: velocity error | $0.0588\,\mathrm{m/s}$ |
| Accelerometer bias: position error | $1.77\,\mathrm{m}$ |
| Angle random walk: attitude | $0.00645^\circ$, or $23.2$ arcseconds |

For the gyro row: tilt $= 4.8481\times10^{-5} \times 60 = 2.909\times10^{-3}\,\mathrm{rad} = 0.1667^\circ$. Velocity $= 9.80665 \times 4.8481\times10^{-5} \times 60^2 / 2 = 0.856\,\mathrm{m/s}$. Position $= 9.80665 \times 4.8481\times10^{-5} \times 60^3 / 6 = 17.1\,\mathrm{m}$. For the ARW row, $60\,\mathrm{s}$ is $1/60$ of an hour, so $0.05 \times \sqrt{1/60} = 0.00645^\circ$.

**Read the ranking.** After one minute, the gyro bias term is already about ten times the accelerometer term in position ($17.1$ against $1.77$). The gap widens with $t$, because one grows as $t^3$ and the other as $t^2$. Angle random walk has added $23$ arcseconds of attitude error against the bias's $600$ — on this timescale noise is not the problem; the steady offset is.

**Sanity check.** The gyro bias reaches position through *three* integrations, the accelerometer bias through two. An error with an extra integration eventually wins — and "eventually" here is under a minute. And $60\,\mathrm{s}$ is well under $806\,\mathrm{s}$, so the short-time laws apply.
:::

::: example "How does a gyro bias turn into a position error?"
**A weak answer:** "The gyro bias integrates into an attitude error, the attitude error makes the accelerometer readings wrong, so the position drifts. A better gyro fixes it."

The chain is right, but there is no mechanism and no number in it.

**A strong answer:**

"Four steps, and the third does the work.

One: the bias integrates straight into attitude. A constant bias $b$ gives an attitude error of $bt$ — that is what a rate error means.

Two: the attitude solution rotates the specific force into the navigation frame, so a tilt of $\theta$ points that vector the wrong way.

Three, the key: in any low-acceleration phase, what the accelerometers measure is mostly the reaction to gravity, one $g$. So the tilt leaks a sideways specific force of $g\sin\theta \approx g\theta$ — an acceleration the vehicle is not having. The gyro error is multiplied by $g$, not by the vehicle's own small acceleration.

Four: integrate twice. With $\theta = bt$ the false acceleration is $gbt$, the velocity error $gbt^2/2$, the position error $gbt^3/6$ — cubic in time.

Numbers: a tactical gyro at ten degrees per hour, $4.85\times10^{-5}\,\mathrm{rad/s}$, gives about $17\,\mathrm{m}$ after sixty seconds. A hundred-micro-$g$ accelerometer bias gives $1.8\,\mathrm{m}$ — ten times less, and the ratio grows linearly with time.

Two caveats. The cubic law holds only while $t$ is small against the Schuler time constant, about thirteen minutes; past that, accelerometer-driven terms become bounded $84$-minute swings while the gyro bias keeps drifting — at long times it is the only term still growing. And under sustained acceleration, accelerometer scale-factor error matters more, because it multiplies the sensed specific force.

So the answer to 'what do we do about it' is not only a better gyro. It is to estimate the bias as a filter state, so an aiding measurement can observe it and take it out."

**What the interviewer learns:** four mechanical steps, gravity named as the amplifier, the $t^3$ law with numbers, a comparison, the formula's limits, and an engineering response.
:::

## Check yourself

::: check
An accelerometer sits at rest on a bench. What does it read, and what does that tell you about the difference between acceleration and specific force?
:::

::: answer
It reads $+g$ upward — about $9.81\,\mathrm{m/s^2}$ along the local vertical — even though it is not accelerating at all.

Specific force is $\mathbf{f} = \mathbf{a} - \mathbf{g}_{\mathrm{grav}}$. The instrument feels every force except gravity, because gravity pulls on the proof mass and its case identically and stretches nothing. At rest, $\mathbf{a} = \mathbf{0}$, so $\mathbf{f} = -\mathbf{g}_{\mathrm{grav}}$, which points up. In free fall it is the reverse: the reading is zero despite an acceleration of one $g$.

So gravity must be supplied from a model and added, $\mathbf{a} = \mathbf{f} + \mathbf{g}$, at the computed position — and a gravity-model error looks the same as an accelerometer bias.
:::

::: check
Why does a gyro bolted to a lab bench not read zero, and what does that make possible?
:::

::: answer
A gyro measures rate relative to inertial space, not relative to the ground — and the ground is turning. It senses the Earth's rotation, $7.292115\times10^{-5}\,\mathrm{rad/s} = 15.041^\circ/\mathrm{h}$, projected onto its input axis.

That makes **gyrocompassing** possible: Earth rate points along the polar axis, so its projection on a leveled instrument gives true north with no outside reference. Whether a unit can do it depends on its bias instability compared with $15.041^\circ/\mathrm{h}$. A navigation-grade gyro at a hundredth of a degree per hour does it comfortably; a MEMS unit (a tiny chip-sized sensor) whose bias wanders by several degrees per hour cannot find north at all.
:::

::: check
Write the constant-rate quaternion update, and say when it stops being exact.
:::

::: answer
With $\boldsymbol{\phi} = \boldsymbol{\omega}\Delta t$:

$$\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \left(\cos(\lVert\boldsymbol{\phi}\rVert/2),\ \sin(\lVert\boldsymbol{\phi}\rVert/2)\,\boldsymbol{\phi}/\lVert\boldsymbol{\phi}\rVert\right).$$

This is the exact solution of $\dot{\mathbf{q}} = \tfrac12\mathbf{q}\otimes[0,\boldsymbol{\omega}]$ when the rate is constant in size *and direction* across the interval.

It stops being exact once the rate's direction changes within the sample. Rotations about different axes do not commute, so the true chain of tiny rotations differs from one rotation through the summed rate vector. That mismatch is **coning**: systematic, driven by vibration or real coning motion, and removed by multi-sample algorithms that add a cross-product correction from successive gyro samples. The velocity channel's matching error, under rotation plus acceleration, is **sculling**.
:::

::: check
A vehicle coasts for two minutes with no aiding. Its gyro bias is $10^\circ/\mathrm{h}$ and its accelerometer bias is $100\,\mathrm{\mu g}$. Which dominates the position error, and by roughly how much?
:::

::: answer
The gyro bias, by about a factor of twenty.

In SI the biases are $4.8481\times10^{-5}\,\mathrm{rad/s}$ and $9.8067\times10^{-4}\,\mathrm{m/s^2}$, and $t = 120\,\mathrm{s}$.

- Gyro term: $gbt^3/6 = 9.80665 \times 4.8481\times10^{-5} \times 1.728\times10^{6}/6 \approx 137\,\mathrm{m}$.
- Accelerometer term: $at^2/2 = 9.8067\times10^{-4}\times 14\,400/2 \approx 7.06\,\mathrm{m}$.

The ratio is about $19$. It grows linearly with time (cubic against quadratic): at sixty seconds it was about ten. Both figures are valid, since two minutes is well under the $806\,\mathrm{s}$ where the Schuler loop starts to bound the accelerometer-driven terms.
:::

::: check
Why is a gyro bias estimated as a filter state rather than measured once and subtracted?
:::

::: answer
Because it is not one fixed number.

- The turn-on part is constant within a run but different every run, so a stored value from the factory or the last flight is wrong the moment power cycles.
- The in-run part wanders during the run, on a correlation time of minutes to hours, so even a perfect estimate at alignment goes stale.
- A rate-random-walk part drifts with nothing pulling it back.

A filter state with the right dynamics — Gauss–Markov for the wander, plus process noise for the slower drift — tracks all of that as aiding measurements arrive. The aiding is what makes the bias **observable**: the bias grows an attitude error at rate $b$, the attitude error leaks gravity sideways, and a position or velocity fix sees the result. Which is also why the bias estimate gets worse exactly when the aiding stops.
:::

## Summary

| Item | Content |
| --- | --- |
| Accelerometer | Measures specific force $\mathbf{f} = \mathbf{a} - \mathbf{g}_{\mathrm{grav}}$; zero in free fall, $+g$ at rest |
| Gyro | Measures rate relative to inertial space; senses Earth rate $7.292115\times10^{-5}\,\mathrm{rad/s} = 15.041^\circ/\mathrm{h}$ |
| Velocity mechanization | $\dot{\mathbf{v}}^n = \mathbf{C}_b^n\mathbf{f}^b - (2\boldsymbol{\omega}_{ie}^n + \boldsymbol{\omega}_{en}^n)\times\mathbf{v}^n + \mathbf{g}^n$ |
| Quaternion kinematics | $\dot{\mathbf{q}} = \tfrac12\mathbf{q}\otimes[0,\boldsymbol{\omega}]$; exact constant-rate step through $\boldsymbol{\phi} = \boldsymbol{\omega}\Delta t$; renormalize |
| Coning and sculling | Rectification errors when the rate direction swings within a sample; fixed by multi-sample algorithms |
| Bias states | Turn-on (per run), in-run (Gauss–Markov, saturates), rate random walk (unbounded) |
| Accelerometer bias equivalence | A bias $a$ looks like a tilt of $a/g$; $100\,\mathrm{\mu g}$ is $20.6$ arcseconds |
| Error laws (short time) | Gyro bias: $bt$, $gbt^2/2$, $gbt^3/6$. Accelerometer bias: $at$, $at^2/2$. ARW: $\mathrm{ARW}\sqrt{t}$ |
| Worked budget at $60\,\mathrm{s}$ | $10^\circ/\mathrm{h}$: $0.167^\circ$, $0.856\,\mathrm{m/s}$, $17.1\,\mathrm{m}$. $100\,\mathrm{\mu g}$: $0.0588\,\mathrm{m/s}$, $1.77\,\mathrm{m}$ |
| Validity | Short-time laws hold for $t \ll 1/\omega_s \approx 806\,\mathrm{s}$; Schuler period $84.4$ minutes |
| Filter size | Fifteen error states standard; twenty-one when scale factors are separable |

One subject remains: orbit determination, where the same estimation machinery meets real tracking data, and where the choice between processing an arc all at once and processing it as it arrives is the question you will be asked.

::: context dead-reckoning Navigating by adding up your own motion
Sailors used dead reckoning for centuries: from a known start, speed, heading and elapsed time, they worked out where the ship must be, then corrected it whenever a coastline or a star sight came along. Where the name comes from is not settled; a popular story links it to "deduced reckoning", but historians doubt it. The idea is exactly the IMU's: add up motion from a known start, and accept that errors pile up until something outside corrects them.
:::

::: context proof-mass Inside an accelerometer
The proof mass is a small weight held by a spring or a feedback force. When the case is pushed, the mass lags behind, and the sensor measures that offset. Gravity pulls the mass and the case together, so it never shows up on its own.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="20" width="110" height="120" fill="white" stroke="#1f2a44" stroke-width="2"/>
  <line x1="85" y1="20" x2="85" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="85,30 75,38 95,46 75,54 95,62 75,70 95,78 85,86" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="68" y="86" width="34" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="10" y1="140" x2="160" y2="140" stroke="#6c7a93" stroke-width="3"/>
  <line x1="120" y1="110" x2="120" y2="60" stroke="#b4232c" stroke-width="2"/>
  <polygon points="120,54 115,64 125,64" fill="#b4232c"/>
  <text x="85" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">On a bench: spring stretched</text>
  <text x="85" y="175" font-size="12" fill="#b4232c" text-anchor="middle">reads +g, upward</text>
  <rect x="220" y="20" width="110" height="120" fill="white" stroke="#1f2a44" stroke-width="2"/>
  <line x1="275" y1="20" x2="275" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="275,30 265,36 285,42 265,48 285,54 275,60" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="258" y="60" width="34" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="245" y1="110" x2="245" y2="130" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="245,136 240,126 250,126" fill="#6c7a93"/>
  <line x1="305" y1="110" x2="305" y2="130" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="305,136 300,126 310,126" fill="#6c7a93"/>
  <text x="275" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">Free fall: spring relaxed</text>
  <text x="275" y="175" font-size="12" fill="#1d6fd1" text-anchor="middle">reads 0</text>
</svg>
```
:::

::: context gyrocompassing Finding north without a magnet
A leveled gyro feels only the part of Earth's spin that lies along its axis. Point its axis at true north and it feels the most; point it east or west and it feels none. Turn it around and look for the direction of zero rate, and you have found east–west, so north is at right angles to it. At latitude $L$ the horizontal part is $15.041\cos L$ degrees per hour, so the trick gets harder near the poles. Ships and submarines have found north this way for more than a century.
:::

::: context gimballed-platform Gimbals and strapdown
A gimbal is a ring on bearings, like the rings that hold a ship's compass level. Apollo's guidance used a platform inside three gimbals, kept pointing the same way in space while the spacecraft turned around it. The weakness is **gimbal lock**: in one orientation two rings line up and a direction of turning is lost, so Apollo crews had to steer clear of it. Strapdown systems replaced gimbals once flight computers were fast enough to do the rotation math many times a second; today most launcher and spacecraft IMU is strapdown.
:::

::: context coriolis The turning-frame correction
Roll a ball straight across a spinning merry-go-round. To you, riding on it, the ball's path curves — though nothing pushed it sideways. That apparent sideways push is the Coriolis effect, named after the French engineer Gaspard-Gustave de Coriolis. The navigation frame rides on the spinning Earth, so the equations need the $2\boldsymbol{\omega}_{ie}\times\mathbf{v}$ term to cancel that apparent force. At airliner speed, $250\,\mathrm{m/s}$, it is at most about $0.036\,\mathrm{m/s^2}$ — small, but far bigger than a good accelerometer's bias.
:::

::: context quaternion Four numbers for a rotation
The Irish mathematician William Rowan Hamilton invented quaternions in 1843 and, the story goes, scratched the rule into a Dublin bridge. For attitude, a unit quaternion packs the turn's axis and angle into four numbers: $\cos$ of half the angle, and the axis times $\sin$ of half the angle. Flight software prefers it to three angles because it has no gimbal-lock-like trouble spot, and to a $3\times3$ matrix because four numbers are cheaper to store and renormalize than nine. The previous lesson built the attitude filter around it.
:::

::: context coning What coning motion looks like
Picture a spinning top that wobbles: its axis sweeps out a cone. A vehicle vibrating about two axes, a quarter-cycle apart, does the same thing on a tiny scale. Each gyro reading swings back and forth and averages to zero, yet the body really does creep around the cone's axis. Naive integration misses that creep. Launch vibration makes this real: coning corrections are built into flight IMU software, not added as an afterthought.
:::

::: context gauss-markov Two ways a bias can wander
A Gauss–Markov bias is like a dog on a leash: it wanders, but the leash ($-b/T$) keeps pulling it back, so its spread levels off. A random walk has no leash, and its spread keeps growing as $\sqrt{t}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,150.0 50,112.7 60,101.2 70,94.3 80,89.9 90,87.0 100,84.9 110,83.5 120,82.5 130,81.8 140,81.3 150,80.9 160,80.6 170,80.5 180,80.3 190,80.2 200,80.2 220,80.1 240,80.0 280,80.0 340,80.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40,150.0 50,131.8 60,124.3 70,118.5 80,113.6 90,109.3 100,105.5 110,101.9 120,98.6 130,95.4 140,92.5 150,89.7 160,87.0 170,84.4 180,82.0 190,79.6 200,77.3 210,75.0 220,72.8 230,70.7 240,68.7 250,66.7 260,64.7 270,62.8 280,60.9 290,59.1 300,57.3 310,55.5 320,53.8 330,52.1 340,50.4"/>
  <text x="192" y="170" font-size="12" fill="#1f2a44" text-anchor="middle">time</text>
  <text x="14" y="95" font-size="12" fill="#1f2a44" transform="rotate(-90 14 95)" text-anchor="middle">bias spread</text>
  <text x="230" y="96" font-size="12" fill="#1d6fd1">Gauss–Markov: levels off</text>
  <text x="190" y="44" font-size="12" fill="#b4232c">random walk: keeps growing</text>
  <text x="50" y="74" font-size="11" fill="#6c7a93">bias instability</text>
</svg>
```
:::

::: context fifteen-states Where this comes back
The fifteen-state filter is the workhorse of GPS-aided inertial navigation in aircraft, launchers and drones. Its attitude part is the multiplicative error state from the previous lesson, and its bias parts are the Gauss–Markov states from this one. Orbit determination, next, uses the same predict-and-update machinery on a very different problem.
:::

::: context error-chain The chain, drawn out
Top row: the gyro-bias path, with one more step than the bottom row. That extra step is why it wins.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="4" y="20" width="62" height="40" fill="#f2b880" stroke="#1f2a44"/>
    <text x="35" y="36">gyro bias</text><text x="35" y="52">b</text>
    <rect x="76" y="20" width="62" height="40" fill="white" stroke="#1f2a44"/>
    <text x="107" y="36">tilt</text><text x="107" y="52">bt</text>
    <rect x="148" y="20" width="62" height="40" fill="white" stroke="#1f2a44"/>
    <text x="179" y="36">false accel</text><text x="179" y="52">gbt</text>
    <rect x="220" y="20" width="62" height="40" fill="white" stroke="#1f2a44"/>
    <text x="251" y="36">velocity</text><text x="251" y="52">gbt²/2</text>
    <rect x="292" y="20" width="62" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="323" y="36">position</text><text x="323" y="52">gbt³/6</text>
    <rect x="148" y="100" width="62" height="40" fill="#f2b880" stroke="#1f2a44"/>
    <text x="179" y="116">accel bias</text><text x="179" y="132">a</text>
    <rect x="220" y="100" width="62" height="40" fill="white" stroke="#1f2a44"/>
    <text x="251" y="116">velocity</text><text x="251" y="132">at</text>
    <rect x="292" y="100" width="62" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="323" y="116">position</text><text x="323" y="132">at²/2</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="66" y1="40" x2="76" y2="40"/><line x1="138" y1="40" x2="148" y2="40"/>
    <line x1="210" y1="40" x2="220" y2="40"/><line x1="282" y1="40" x2="292" y2="40"/>
    <line x1="210" y1="120" x2="220" y2="120"/><line x1="282" y1="120" x2="292" y2="120"/>
  </g>
  <text x="143" y="78" font-size="11" fill="#b4232c" text-anchor="middle">× g</text>
  <text x="70" y="160" font-size="11" fill="#6c7a93">each other arrow: add up over time</text>
</svg>
```
:::

::: context schuler An 84-minute pendulum
In 1923 the German engineer Max Schuler showed that a pendulum as long as the Earth's radius would swing with a period of $2\pi\sqrt{R/g}$. With $R = 6378\,\mathrm{km}$ and $g = 9.81\,\mathrm{m/s^2}$ that is about $5067\,\mathrm{s}$, or $84.4$ minutes. An inertial navigator behaves like that pendulum: a velocity error moves the computed position, which tilts the computed "down", which feeds back an acceleration that pushes the error back. So accelerometer errors swing instead of growing forever.
:::
