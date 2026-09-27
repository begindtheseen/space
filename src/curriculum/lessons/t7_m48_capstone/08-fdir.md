---
id: l08-fdir
title: 'FDIR: residual monitors, cross-checks and actuator health'
minutes: 22
covers:
  - 'FDIR: residual monitors on the filter, sensor cross-checks, actuator health, and the response of each'
---

A car's dashboard has warning lights. The oil light does not tell you *why* the pressure is low. It tells you that a reading has left its normal range, and the owner's manual tells you what to do about it: pull over now, or book a service soon. A warning light with no instruction attached would only make you nervous.

Every lesson so far in this module built one piece of the stack and then showed what goes wrong when two correct pieces meet. This lesson builds the vehicle's warning lights. **FDIR** — **[[fault detection, isolation and recovery|fdir-words]]** — is the software whose whole job is to notice, in flight, when one piece has stopped being correct. It has to do that without the one thing every earlier lesson quietly relied on for its diagnosis: the *truth*, the vehicle's real state. In simulation we know the truth. In flight nobody does.

This lesson builds three monitors for the reference vehicle:

- a residual check on the navigation filter;
- a cross-check between two sensors that should agree;
- a health check on the actuator.

For each one it also states the **response** — what the mode manager does when it trips. A monitor with no defined response is not FDIR. It is a log message.

## Residual monitors on the filter: NIS, because NEES needs truth you do not have in flight

The navigation-meets-guidance lesson checked the filter with the **normalized estimation error squared** (NEES). NEES compares the filter's estimate against the true state. That works only in simulation, where the truth is known because we made it up. Flight has no truth to compare against.

So what can a flight computer check? At every update, the filter makes a prediction: "given my estimate $\hat{\mathbf x}$ (read "x hat"), the GNSS receiver should report *this*." Then the real measurement $\mathbf z$ arrives. The difference between the two is called the **[[innovation|innovation]]**, written $\boldsymbol\nu$ (the Greek letter "nu"):

$$
\boldsymbol\nu = \mathbf z - \mathbf H\hat{\mathbf x}.
$$

Here $\mathbf H$ is the matrix that turns a state into the measurement you would expect to see. The filter also knows how big it *expects* the innovation to be. That expected spread is the innovation covariance

$$
\mathbf S = \mathbf H\mathbf P\mathbf H^\top+\mathbf R,
$$

where $\mathbf P$ is the filter's own uncertainty about its state and $\mathbf R$ is the sensor's noise. In words: the measurement can disagree with the prediction because the filter is unsure ($\mathbf{HPH}^\top$) and because the sensor is noisy ($\mathbf R$).

Now divide the innovation by its expected size, and square it. That is the **normalized innovation squared**:

$$
\mathrm{NIS} = \boldsymbol\nu^\top \mathbf S^{-1} \boldsymbol\nu.
$$

For one number, this is $(\nu/\sigma)^2$ — "how many standard deviations off, squared." For a vector it does the same thing, with $\mathbf S^{-1}$ (read "S inverse") doing the dividing in every direction at once.

If the filter is honest about its uncertainty, NIS follows a **[[chi-squared distribution|chi-squared]]**, the same family NEES follows. The difference is the **[[degrees of freedom|dof]]**. For NEES it is the size of the state. For NIS it is the size of the *measurement*. In this module's planar demonstrations, a GNSS position fix has two components (downrange and altitude), so NIS has two degrees of freedom, and its average value on healthy data is $2$.

::: example Setting a NIS threshold, and pricing what it buys
We want a **threshold** — a gate value above which the monitor trips. Pick the gate so a healthy filter crosses it only rarely.

**The gate values.** For two degrees of freedom, the chi-squared value that a healthy NIS stays below $99.9\%$ of the time ($p = 0.999$) is $13.82$. At $99.99\%$ it is $18.42$. (For two degrees of freedom there is a neat shortcut: the gate is $-2\ln(1-p)$. Check: $-2\ln(0.001) = 13.82$ and $-2\ln(0.0001) = 18.42$.)

**How many chances to trip.** GNSS updates at $10\,\mathrm{Hz}$ over a $24\,\mathrm s$ landing burn. That is $10 \times 24 = 240$ updates per burn.

**Expected false alarms at $99.9\%$.** Each healthy update has a $0.001$ chance of crossing. Multiply by the number of chances: $0.001 \times 240 = 0.24$ false alarms per burn. That is roughly one **[[nuisance trip|false-alarm-odds]]** every four landings — with nothing wrong at all.

**Expected false alarms at $99.99\%$.** $0.0001 \times 240 = 0.024$ per burn, about one in forty landings.

**The catch.** The higher gate is not free. It also lets a real fault of a given size slip through more often, because the disagreement has to be bigger before anyone notices. Choosing between the two is a real design trade, priced in real numbers rather than a round figure picked by feel.
:::

::: key Why NIS, not NEES, is the flight monitor
NEES needs truth; it exists to verify a filter design in simulation, once, before flight. NIS needs only the filter's own predicted measurement and its own covariance — both available every single update, in flight, with no truth required. That is why NIS is the residual monitor that actually flies, while NEES stays a verification-campaign tool.
:::

::: key Filter consistency checks
NEES (normalised estimation error squared) against truth in simulation, and NIS (normalised innovation squared) in flight, since it needs no truth. Both should sit inside their chi-squared bounds. An overconfident filter corrupts gating, FDIR thresholds and guidance margins alike.
:::

Why does an **overconfident** filter — one whose $\mathbf P$ is smaller than its real error — do so much damage? Every consumer of the estimate trusts $\mathbf P$. With $\mathbf P$ too small, $\mathbf S$ is too small too. Then NIS reads too high on perfectly healthy data, so good measurements get thrown out and the monitor cries wolf. The filter also gives too little weight to new measurements, the very ones that would correct it. And guidance plans with a confidence that does not exist.

## Detecting a real fault: the GNSS-dropout case

A consistency check earns its place by catching what a component test never exercises. A good example is a sensor that goes *silent*, not merely noisy.

The Monte Carlo campaign later in this module scatters a **GNSS dropout** — a stretch of several seconds with no position fix at all — into some of its cases. Every one of those dropout cases failed the campaign's navigation-consistency check. None of the cases with continuous GNSS did. That is not luck in the tuning. During a dropout the filter is **[[dead reckoning|dead-reckoning]]**: it navigates on the IMU alone. Its real error grows faster than its covariance, built on a process-noise model tuned for a regularly aided filter, says it does. When GNSS comes back, the first innovations are far bigger than $\mathbf S$ allows, and a NIS gate trips.

That is exactly the condition a residual monitor exists to catch. It catches it in flight, while there is still time to respond — not at touchdown, when the miss distance turns out wrong and nothing can be done.

::: warning A tripped monitor names a symptom, not automatically a cause
A NIS trip says the filter's predictions and its measurements disagree by more than the filter's own model of disagreement allows. It does not say *why*. The measurement might be wrong. The filter's dynamics model might be wrong. The vehicle might be doing something truly unexpected. Working out *which* — the "isolation" in FDIR — is a separate step that the response logic has to take on purpose. Crossing the threshold does not settle it.
:::

## Sensor cross-checks: catching what the filter's own consistency check cannot

A NIS monitor is only as suspicious as the filter's noise model lets it be. Here is the blind spot. A sensor can report values that are confidently wrong, yet each one sits inside the noise the filter was told to expect. Every innovation then looks statistically ordinary, even though the measurement is bad.

Two real examples for a radar altimeter — the radar that measures height above the ground:

- It **[[freezes on its last good reading|stuck-sensor]]** and keeps reporting it.
- It reports a value corrupted by **[[multipath|multipath]]**, a radar echo that bounced off nearby terrain instead of coming straight back from the ground below.

Each reading can sit inside the filter's expected noise band while being systematically wrong. The defense is a check the filter's update never performs: compare the *raw* altimeter reading directly against the altitude the navigation solution has propagated from the IMU, whether or not the filter has decided to trust the altimeter.

::: example Sizing a cross-check threshold from the sensors' own numbers
**Two sources of honest disagreement.** The altimeter updates every $50\,\mathrm{ms}$. Over that short gap, the IMU-propagated altitude drifts from the truth only a little — a few centimeters for this vehicle's IMU; call it $0.03\,\mathrm m$ one-sigma. The altimeter itself has $0.15\,\mathrm m$ of one-sigma noise.

**Combine them.** Independent errors add in root-sum-square: $\sqrt{0.15^2 + 0.03^2} \approx 0.153\,\mathrm m$. Notice the altimeter's noise dominates.

**Set the gate.** Put the threshold at several times that combined figure — say five times, about $0.76\,\mathrm m$. Healthy data almost never crosses it: for Gaussian noise, a $5$-sigma excursion either way happens about $6$ times in ten million samples.

**How fast does it catch a freeze?** A frozen reading stops moving while the vehicle keeps descending. At $20\,\mathrm{m/s}$ of descent, the gap grows by $20 \times 0.05 = 1.0\,\mathrm m$ per update, so the very first frozen reading crosses $0.76\,\mathrm m$. Even at a gentle $5\,\mathrm{m/s}$ the gap grows $0.25\,\mathrm m$ per update and crosses the gate on the fourth update, $0.2\,\mathrm s$ in. A multipath error of tens of meters crosses at once.

**Sanity check.** The gate is five times wider than ordinary noise, yet more than ten times tighter than the errors it hunts. That is the shape a good gate should have — and it trips long before enough bad readings have leaked through the filter's more forgiving statistical gate to raise a NIS alarm on their own.
:::

## Actuator health: watching how long the gimbal stays pinned

The control-meets-vehicle lesson fed the same mode-transition step to three anti-windup schemes. It also measured how long the gimbal stayed **pinned** — sitting at its deflection limit, unable to push harder.

::: example Sustained saturation as a health signal
The longest unbroken stretch at the limit, for each scheme:

| Anti-windup scheme | Longest continuous time pinned at the limit |
| --- | --- |
| Naive | $3.41\,\mathrm s$ |
| Conditional integration | $1.99\,\mathrm s$ |
| Back-calculation | $0.70\,\mathrm s$ |

**The monitor.** Flag the actuator if it stays pinned for more than **[[one continuous second|pinned-gate]]**.

**Apply it.** Naive: $3.41 > 1$, trips. Conditional: $1.99 > 1$, trips. Back-calculation: $0.70 < 1$, stays quiet.

**Compare with the control lesson.** Those are exactly the two schemes that lesson found failing to recover promptly, and the one it found recovering cleanly. The simple timer agrees with the full analysis.

**What it cannot tell.** A long pinned stretch might mean the actuator has lost authority, or that the control law feeding it is behaving badly. The monitor cannot tell which. What it reliably detects is that control authority is under sustained stress — and the mode manager needs that fact whichever cause turns out to be responsible.
:::

## The response of each

::: key A monitor without a response is a log entry, not FDIR
Every threshold in this lesson exists to trigger a specific, pre-decided action — never merely a note for a post-flight review to read.

| Monitor | Trips on | Response |
| --- | --- | --- |
| NIS (filter residual) | Innovation inconsistent with the filter's own covariance | Reject the offending measurement for this cycle; if sustained, flag navigation degraded to the mode manager |
| Altimeter–INS cross-check | Raw altimeter disagrees with propagated altitude beyond the sized threshold | Drop the altimeter from the update; revert to GNSS-only aiding (or IMU-only, below GNSS's own useful altitude) |
| Actuator sustained saturation | Gimbal pinned beyond the time threshold | Flag control authority degraded; mode manager may command a gentler guidance target or, if response does not improve, escalate toward safe |
:::

Notice that each response is *proportionate*. A single bad measurement costs one rejected update, not the mission. Only a problem that persists climbs the ladder toward safe mode.

Isolation and recovery do not follow automatically from detection. A dropped altimeter still leaves the filter navigating on GNSS and the IMU — degraded, not blind. The response logic has to know, ahead of time, which sensors are still enough for which mode. That is the same kind of question the mode manager already answers for ordinary mode changes.

::: warning The gate formula is universal; the choices around it are not
The chi-squared gate for a chosen probability and degrees of freedom is a pure number: $13.82$ for two degrees of freedom at $99.9\%$, on any vehicle. What is *not* universal is everything around it. Which probability to pick depends on how many updates a flight contains and on what a false alarm's response costs. The gate only means anything if this vehicle's filter is consistent — if $\mathbf R$ and the process noise honestly describe *its* sensors. And the one-second pinned-gimbal limit comes from this vehicle's actuator authority and controller. A different vehicle — a faster GNSS rate, a stronger gimbal — must redo these choices from its own numbers, not copy this lesson's figures across.
:::

## Check yourself

::: check
Explain why NIS, rather than NEES, is the monitor a real flight computer runs, using only what each quantity needs as an input.
:::

::: answer
NEES compares the filter's error against the true state. The true state is available only in a simulation, where it is known by construction. A real vehicle in flight has no truth to compare against. NIS compares the filter's own predicted measurement against the measurement actually received, using only the innovation and the innovation covariance the filter already computes at every update. Both exist in flight with no outside truth. So NIS runs onboard, while NEES stays a pre-flight verification tool.
:::

::: check
This lesson found about $0.24$ expected false alarms per landing burn at a $99.9\%$ NIS gate. Using the trade the lesson names, explain why a program might still choose that gate over the $99.99\%$ one, despite the higher nuisance rate.
:::

::: answer
A higher gate cuts false alarms, but it also raises the bar a real fault's innovation must clear before it is caught. At a given fault size, it detects more slowly or misses outright. A program can live with roughly one nuisance trip every four landings *if* its response to a trip is proportionate — rejecting one measurement, not aborting the landing. In that case it may prefer the more sensitive $99.9\%$ gate precisely because it catches smaller real faults that the $99.99\%$ gate would let through. The right choice depends on how expensive a false alarm's response is, and the numbers turn that into an explicit trade instead of a default.
:::

::: check
A radar altimeter freezes on its last good reading rather than failing outright or going silent. Why is this failure the clearest reason to have a cross-check that works independently of the filter's own NIS gate?
:::

::: answer
A frozen reading, repeated every cycle, does not look like a wild outlier. Right after the freeze, the vehicle's true altitude has moved only a little, so each innovation can sit comfortably inside the filter's expected noise band for several cycles before the growing disagreement is big enough to trip NIS. Meanwhile the filter is being pulled toward the wrong altitude. A cross-check that compares the raw reading directly against an independently propagated altitude does not depend on the filter's noise model finding the reading implausible. It only needs the two values to differ by more than the sized threshold — which, for a vehicle descending even at $5\,\mathrm{m/s}$, happens within a few updates.
:::

::: check
The actuator-health monitor flags "pinned for more than one second" without telling a real hardware fault from a demanding but recoverable command. Is that a flaw to fix before using it, or an acceptable property of this monitor? Justify your answer.
:::

::: answer
It is acceptable, as long as the *response* matches what the monitor can actually tell. The monitor reliably detects that control authority is under sustained stress. The matching response — flag control degraded, and let the mode manager decide whether to soften the guidance target or escalate — is right whichever cause is behind it. Making the monitor itself separate a hardware failure from a large recoverable command would need inputs this simple timer was never built to use, such as direct actuator-health telemetry or an independent model of available authority. Demanding that would mix up detection with full diagnosis, which is the mistake the warning about "a symptom, not a cause" cautions against.
:::

::: check
The NIS gate of $13.82$ depends only on the chosen probability and the degrees of freedom — it is the same number on every vehicle. Why, then, can another vehicle not simply reuse this lesson's gate and its expected false-alarm rate?
:::

::: answer
The number $13.82$ transfers; the decision and its meaning do not. First, the false-alarm *rate per flight* is the per-update probability times the number of updates. A vehicle with a $20\,\mathrm{Hz}$ GNSS and a longer burn has several times more chances to trip, so the same gate gives several times more nuisance alarms, and it may need a higher probability to stay acceptable. Second, the gate only says what it claims if that vehicle's filter is consistent — if its $\mathbf R$ and process noise honestly describe its own sensors. An overconfident filter makes NIS read high on healthy data, and the textbook gate then trips far more often than the chi-squared table promises. The formula is universal; the probability to choose, and whether the filter earns the right to use the table, must be worked out again for each vehicle.
:::

## Summary

| Monitor | Basis | Response when tripped |
| --- | --- | --- |
| NIS (filter residual) | $\boldsymbol\nu^\top\mathbf S^{-1}\boldsymbol\nu$, chi-squared, dof = measurement dimension | Reject measurement this cycle; flag navigation degraded if sustained |
| Threshold trade | $99.9\%$: $13.82$ (dof $2$), $\approx0.24$ false alarms/burn. $99.99\%$: $18.42$, $\approx0.024$/burn | Higher gate trades nuisance-alarm rate against smaller-fault sensitivity |
| Consistency checks | NEES against truth in simulation; NIS in flight; both inside chi-squared bounds | An overconfident filter corrupts gating, FDIR thresholds and guidance margins |
| Sensor cross-check | Raw altimeter vs. independently propagated INS altitude; gate at several times the combined sigma ($\approx0.76\,\mathrm m$ here) | Drop the disagreeing sensor; revert to remaining aiding sources |
| Actuator health | Continuous time pinned at the deflection limit ($3.41\,\mathrm s$ naive, $0.70\,\mathrm s$ back-calculation, against a $1\,\mathrm s$ gate) | Flag control degraded; mode manager softens the target or escalates |
| Governing rule | A monitor with no defined response is a log entry, not FDIR | — |

With navigation, guidance, control, mode management and fault response all built and joined, the next lesson shows the hardest failure this module has left: a case where every one of these monitors, and every component test behind them, passes cleanly — and the closed loop still does worse than any single piece's test predicted.

::: context fdir-words Three jobs in one acronym
Think of a doctor. **Detection** is noticing the fever. **Isolation** is working out which organ is causing it. **Recovery** is the treatment that gets the patient working again, perhaps with one organ resting. Flight software does the same three jobs in that order. Detection is the easy part to automate; isolation is where most of the engineering goes, because a wrong diagnosis leads to the wrong treatment — like shutting off a healthy sensor and keeping the broken one.
:::

::: context innovation Why it is called the "innovation"
In everyday English an innovation is something new. In a Kalman filter, the innovation is the part of a measurement the filter could *not* have predicted — the genuinely new information it brings. If the filter predicted perfectly, every innovation would be pure sensor noise. A pattern in the innovations (always positive, or growing) means the filter is missing something, which is why they are the natural thing to monitor.
:::

::: context chi-squared The shape healthy NIS values follow
Square a few independent bell-curve numbers and add them up: the total follows a **chi-squared** distribution. With two degrees of freedom its shape is a simple falling curve — small values are common, big ones rare. The gate is the point where only a sliver of the area is left to the right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,50.0 47.5,72.1 55.0,89.3 62.5,102.8 70.0,113.2 77.5,121.3 85.0,127.7 92.5,132.6 100.0,136.5 107.5,139.5 115.0,141.8 122.5,143.6 130.0,145.0 137.5,146.1 145.0,147.0 152.5,147.6 160.0,148.2 167.5,148.6 175.0,148.9 182.5,149.1 190.0,149.3 197.5,149.5 205.0,149.6 212.5,149.7 220.0,149.8 227.5,149.8 235.0,149.8 242.5,149.9 250.0,149.9 257.5,149.9 265.0,149.9 272.5,150.0 280.0,150.0 287.5,150.0 295.0,150.0 302.5,150.0 310.0,150.0 317.5,150.0 325.0,150.0 332.5,150.0 340.0,150.0"/>
  <line x1="247.3" y1="60" x2="247.3" y2="150" stroke="#b4232c" stroke-width="2"/>
  <line x1="316.3" y1="60" x2="316.3" y2="150" stroke="#f2b880" stroke-width="2"/>
  <text x="247.3" y="54" font-size="11" fill="#b4232c" text-anchor="middle">13.82</text>
  <text x="316.3" y="54" font-size="11" fill="#1f2a44" text-anchor="middle">18.42</text>
  <text x="70" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
  <line x1="70" y1="150" x2="70" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="300" y="175" font-size="11" fill="#1f2a44" text-anchor="middle">NIS value →</text>
  <text x="120" y="90" font-size="11" fill="#1d6fd1">healthy NIS, 2 dof (mean 2)</text>
  <text x="255" y="120" font-size="11" fill="#6c7a93">0.1% beyond</text>
</svg>
```
:::

::: context dof Counting degrees of freedom
"Degrees of freedom" here means how many independent numbers were squared and added. A GNSS fix in this module's planar demos has two — downrange and altitude — so NIS has two. The average of a chi-squared value equals its degrees of freedom, which gives a quick health check: over many healthy updates, NIS should average about $2$. A running average of $6$ says the filter is overconfident by a lot.
:::

::: context false-alarm-odds Expected alarms versus the chance of any
$0.24$ is the *average* number of false alarms per burn. The chance of getting *at least one* is a little lower: $1 - 0.999^{240} \approx 0.21$, about one burn in five. The two nearly match when alarms are rare, because two false alarms in one burn is unlikely. At the $99.99\%$ gate both figures are about $0.024$.
:::

::: context dead-reckoning Navigating without a fix
Sailors before satellites found their position by **dead reckoning**: start from a known point, then keep adding up speed, heading and time. It works, but every small error in speed or heading piles up, so the position slowly drifts from the truth until a landmark or a star sight corrects it. An IMU does the same thing with accelerations and rotations. GNSS is the landmark; lose it, and the drift starts growing.
:::

::: context stuck-sensor Stuck is a standard fault
Engineers sort sensor faults into a few families: **stuck** (the output stops changing), **bias** (a steady offset), **drift** (an offset that grows), **noise increase**, and **dropout** (no output at all). A stuck sensor is sneaky because its output still looks like a plausible number. A dropout announces itself; a stuck sensor has to be caught by noticing that the world moved and the reading did not.
:::

::: context multipath An echo from the wrong place
A radar altimeter times how long its pulse takes to bounce off the ground. If part of the pulse bounces off a hill, a ship's deck edge or a building first, the receiver can lock onto that echo. The path is longer, so the reported height is wrong — sometimes by tens of meters.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="14" width="20" height="40" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <path d="M230,150 L270,90 L310,150 Z" fill="#6c7a93"/>
  <line x1="120" y1="56" x2="120" y2="148" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="124,56 262,104 126,58" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="60" y="110" font-size="11" fill="#1d6fd1">direct echo</text>
  <text x="170" y="62" font-size="11" fill="#b4232c">bounced echo</text>
  <text x="270" y="165" font-size="11" fill="#1f2a44" text-anchor="middle">nearby terrain</text>
</svg>
```

Each bad reading can look calm and steady, which is why the filter's own gate may not flag it.
:::

::: context pinned-gate Three timers against one gate
The three pinned times from the table, drawn to scale against the one-second gate. Two bars cross the red line and trip the monitor; one stays short of it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="104" y="34">naive</text><text x="104" y="72">conditional</text><text x="104" y="110">back-calc</text>
  </g>
  <rect x="110" y="22" width="239" height="16" fill="#b4232c"/>
  <rect x="110" y="60" width="139" height="16" fill="#f2b880"/>
  <rect x="110" y="98" width="49" height="16" fill="#1d6fd1"/>
  <line x1="180" y1="12" x2="180" y2="124" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="180" y="140" font-size="11" fill="#b4232c" text-anchor="middle">1 s gate</text>
  <text x="110" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="340" y="54" font-size="11" fill="#1f2a44" text-anchor="end">3.41 s</text>
  <text x="256" y="72" font-size="11" fill="#1f2a44">1.99 s</text>
  <text x="166" y="110" font-size="11" fill="#1f2a44">0.70 s</text>
</svg>
```
:::
