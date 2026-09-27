---
id: l11-terminal-descent-sensors
title: Terminal descent sensors
minutes: 19
covers:
  - "terminal descent sensors: radar altimeter, lidar, terrain relative navigation"
---

Try parking a car with your eyes closed, using only a map and a stopwatch. You know where you started and how fast you have been going, so you can guess where the curb is. But a small error in your speed, run for a minute, puts you a meter off — and at the curb, a meter is everything. Anyone parking for real looks out of the window at the curb itself.

A landing vehicle has the same problem. Every guidance law in this module — Apollo's predictor-corrector, the Shuttle's energy-referenced tracker, and the landing-burn guidance of lesson 12 — acts on a current estimate of position and velocity. High up, during the hypersonic and supersonic phases, that estimate comes from an **inertial measurement unit** (IMU: accelerometers and gyroscopes that feel every push and turn), started from a known state and corrected now and then by GNSS or a star tracker. It is good enough there.

In the last few hundred to few thousand meters, it stops being good enough, for two reasons this lesson makes precise. First, an inertial estimate drifts when nothing corrects it. Second, the thing a lander most needs — its height and velocity relative to the *actual surface it is about to touch* — is not what GNSS measures at all. So the vehicle needs sensors that look down at the ground. This lesson covers the three main kinds: radar altimeters, lidar, and terrain relative navigation.

## Why GNSS runs out at the end

**GNSS** — the Global Navigation Satellite System family, which includes GPS — works out your position from the timing of signals sent by satellites. Its height is measured from a **[[reference ellipsoid|ellipsoid-geoid]]**, a smooth, slightly squashed mathematical shape that approximates Earth. It is not measured from the ground. Uncorrected, the error is typically several meters.

That causes two problems for a landing.

**Several meters is too coarse.** Across a multi-hundred-kilometer entry corridor, a few meters is nothing. For a landing burn it is a lot. Lesson 12 shows how touchdown speed responds to an altitude error of about this size.

**"Height above the ellipsoid" is not "height above the ground".** A hill, a crater rim or a droneship deck can sit well above or below the ellipsoid at a given latitude and longitude. To turn a GNSS height into a height above the ground, the vehicle needs a model of where the ground is in that same frame — a terrain map, or a model of sea level. Any error in that model goes straight into the altitude. And a droneship deck moves up and down in the swell, which no map can predict.

On the Moon and Mars there is no GNSS at all. Even on Earth, what a lander needs is range and velocity relative to *the surface it will actually touch*. That takes a sensor that looks down and measures that surface directly.

## Radar altimeter: measuring the ground directly

Think of shouting into a canyon and timing the echo. The longer the wait, the farther the wall. A **radar altimeter** does the same thing with radio waves: it sends a signal down and listens for the reflection from the ground.

The trouble is that radio travels at the speed of light, so the echoes come back **[[almost instantly|echo-timing]]** — well under a microsecond from a hundred meters. Many radar altimeters therefore use a trick instead of a stopwatch. A **frequency-modulated continuous-wave** (FMCW) radar sweeps its transmitted frequency steadily upward. By the time the echo returns, the transmitter has moved on to a higher frequency. The difference between the two frequencies is proportional to the round-trip time, and so to the range.

Either way, the measurement is **range to whatever is actually below the vehicle at that instant**. It does not depend on an ellipsoid, a sea-level model or a terrain map. A moving ship deck, a hill, a crater floor — the radar sees whichever one is there.

The same echo can give speed too. If the ground is getting closer, the echo comes back at a slightly higher frequency, the way an ambulance siren sounds higher as it approaches. That shift is the **[[Doppler shift|doppler-word]]**, and it gives the velocity along the beam's line of sight directly. That matters more than it might first seem.

::: example Why velocity is measured directly, not differenced from range
Suppose only range is available. Each range sample has random noise with **standard deviation** $\sigma_r = 0.10\ \mathrm{m}$ (read "sigma sub r"; the standard deviation is the typical size of the error). You estimate velocity by differencing two samples taken a time $\Delta t$ apart:

$$
\hat v = \frac{r_2 - r_1}{\Delta t}.
$$

The hat on $\hat v$ ("v hat") marks it as an estimate. Each sample carries its own independent error, and **[[independent errors add like the sides of a right triangle|noise-adds-in-quadrature]]**, so the difference $r_2 - r_1$ has noise $\sqrt{\sigma_r^2 + \sigma_r^2} = \sigma_r\sqrt2$. Dividing by $\Delta t$ gives

$$
\sigma_v = \frac{\sigma_r\sqrt2}{\Delta t}.
$$

**At $10\ \mathrm{Hz}$** ($\Delta t = 0.1\ \mathrm{s}$): $\sigma_v = 0.10 \times 1.414 / 0.1 = 1.41\ \mathrm{m/s}$. That is already too noisy to trust for a landing-burn cutoff.

**At $100\ \mathrm{Hz}$** ($\Delta t = 0.01\ \mathrm{s}$): $\sigma_v = 0.1414 / 0.01 = 14.1\ \mathrm{m/s}$. **[[Worse, not better|differencing-noise]]**. The true change in range between samples got ten times smaller, but the noise on each sample did not.

**At $1\ \mathrm{Hz}$** ($\Delta t = 1\ \mathrm{s}$): $\sigma_v = 0.1414 / 1 = 0.14\ \mathrm{m/s}$. Usable — but it lags a full second behind a speed that is changing fast during a landing burn.

**Does it make sense?** Each tenfold change in $\Delta t$ changed $\sigma_v$ tenfold, as the formula says it should. A Doppler measurement avoids the whole trade: it reads velocity straight from the echo's frequency shift, instead of differentiating a noisy range, which always magnifies noise.
:::

::: key Why a radar altimeter is not optional
It gives direct range (and, via Doppler, direct velocity) to the actual surface beneath the vehicle — independent of geoid models, terrain models, and GNSS availability — at the meter-to-sub-meter accuracy a landing burn needs, which GNSS's several-meter, ellipsoid-referenced position estimate cannot supply on its own.
:::

The flashcard version of the same idea:

::: key What a radar altimeter gives that GNSS does not
Direct, precise range to the actual surface beneath you — the droneship deck or the terrain — with no dependence on a geoid or terrain model, no multipath-prone geometry, and no reliance on GNSS availability. GNSS gives ellipsoidal height with meter-level error, which is not good enough at touchdown.
:::

(**Multipath** is when a satellite signal bounces off something — the sea, the ship, the vehicle itself — and reaches the antenna by two routes at once, confusing the timing. It gets worse close to a reflective surface.)

One practical detail: a radar measures along its beam, not straight down. If the vehicle is tilted, the beam hits the ground at a slant, and the range is longer than the height. The navigation software corrects for this using the vehicle's attitude — the **[[slant-range correction|slant-range]]**.

## Lidar: the same idea, with light

A **[[lidar|lidar-word]]** does what a radar altimeter does, but with laser light instead of radio. Light has a far shorter wavelength than radio, so a lidar can measure range much more finely and aim a much narrower beam.

A single-beam laser altimeter gives one range number, like a radar. An **imaging** or scanning lidar sweeps its beam across the ground and builds a **point cloud** — thousands of measured points, together forming a 3-D picture of the surface below.

That picture buys something a radar altimeter cannot: **[[hazard detection|hazard-detection-history]]**. The software can pick out individual rocks, steep slopes and craters inside the candidate landing area, and steer the final approach away from them.

It has costs:

- more electrical power;
- a narrower field of regard — it sees a smaller patch of ground at once;
- much more processing, to turn a point cloud into a usable hazard map in real time.

All of that has to fit inside a landing burn that lasts a few tens of seconds.

## Terrain relative navigation

Radar and lidar answer "how far is the ground?". They do not answer "*which* bit of ground is this?". For that, a lander uses the same trick you use when you come up out of a subway station in a city you know: you look around, recognize a landmark, and instantly know where you are.

**Terrain relative navigation (TRN)** takes pictures of the ground with a camera (or builds an elevation map with lidar) and matches them against a stored reference map of the landing region. That map was made earlier from orbital photographs. A good match fixes the vehicle's position *relative to the terrain itself*, not relative to an inertial frame or an ellipsoid.

This is what lets a modern lander notice, in real time, that its inertial estimate has drifted toward a field of dangerous craters, and retarget to a safer spot inside the same landing ellipse. Neither of the other tools can do that alone. A radar altimeter measures range but not which piece of ground it is. An uncorrected inertial estimate has no independent knowledge at all of what terrain lies below.

::: key Terrain relative navigation
Matching onboard camera or lidar imagery against a stored map to fix position relative to the terrain, not to an inertial frame. It is what let **[[Mars 2020|mars-2020-trn]]** pick a safe spot inside a hazardous landing ellipse in real time.
:::

## How much the inertial estimate drifts

It is worth putting a number on why the IMU cannot carry the vehicle all the way down on its own.

An accelerometer never reads perfectly. Even a very good one has a small **bias** $b$ — a constant offset it adds to every reading, like a bathroom scale that shows half a kilogram with nobody on it. The navigation computer integrates acceleration once to get velocity and again to get position, so a constant bias turns into a position error that **[[grows with the square of time|drift-curve]]**:

$$
\Delta x \approx \tfrac12\,b\,t^2.
$$

This is the same formula as the distance fallen from rest under constant acceleration — because a bias *is* a small, fake, constant acceleration.

::: example How much inertial drift a terminal sensor has to correct
Take a representative accelerometer bias $b = 10^{-4}\ \mathrm{m/s^2}$. That is about one hundred-thousandth of $g_0$: tiny, but never exactly zero in a real instrument. Find the position error from the bias alone after three different times since the last external fix.

**After $60\ \mathrm{s}$:** $\Delta x = \tfrac12 \times 10^{-4} \times 60^2 = 0.5 \times 10^{-4} \times 3600 = 0.18\ \mathrm{m}$.

**After $150\ \mathrm{s}$:** $\Delta x = 0.5 \times 10^{-4} \times 22\,500 = 1.125 \approx 1.13\ \mathrm{m}$.

**After $300\ \mathrm{s}$:** $\Delta x = 0.5 \times 10^{-4} \times 90\,000 = 4.50\ \mathrm{m}$.

| time since last fix | position error from bias alone |
| --- | --- |
| $60\ \mathrm{s}$ | $0.18\ \mathrm{m}$ |
| $150\ \mathrm{s}$ | $1.13\ \mathrm{m}$ |
| $300\ \mathrm{s}$ | $4.50\ \mathrm{m}$ |

**Does it make sense?** Going from $150$ to $300\ \mathrm{s}$ doubles the time and quadruples the error ($1.125 \times 4 = 4.5$), exactly as a $t^2$ law should.
:::

The error grows with the *square* of elapsed time, not in proportion to it. That is why terminal descent sensors are not an optional extra bolted onto an otherwise good inertial system. A vehicle coasting on inertial navigation since well before entry interface — several minutes, easily, across the phases of lessons 8 through 10 — piles up meters of drift from a bias far too small to matter for an orbital rendezvous. And the landing burn of lesson 12 is exactly where a few meters of unknown position error hurts most.

## Fusing the three

No single sensor does the whole job. Each has a strength and a gap.

- **Radar altimeter:** reliable range and velocity along essentially one line of sight, cheaply and robustly — but nothing about *what* is at that spot.
- **Lidar:** adds hazard detection — at the cost of power, complexity and processing.
- **Terrain relative navigation:** corrects horizontal position against known terrain — but updates more slowly than a radar's range and Doppler, because matching an image to a map takes longer than reading one echo.

A real terminal descent system **[[fuses|sensor-fusion-bridge]]** all of them, together with the inertial estimate they are correcting, into one navigation solution. The fast IMU fills in between measurements; the slower sensors keep its drift in check. The timing is planned so that by ignition, the uncertainty in position and velocity feeding lesson 12's guidance is small enough for its one-shot burn to hit the target — with no second chance to look again.

## Check yourself

::: check
Explain why GNSS alone — even with no ranging error at all — is not enough for a precision landing.
:::

::: answer
GNSS reports position relative to a mathematical reference ellipsoid, not relative to the surface under the vehicle. Hills, craters and the sea surface all sit above or below the ellipsoid, and a droneship deck also heaves in the swell.

To get height above the ground from GNSS, the vehicle would need a model of where that ground is in the same frame, and any error in that model (or any unpredicted deck motion) goes straight into the answer. So even a perfect GNSS fix does not tell the vehicle its true height above the surface it is about to touch — which is exactly what a landing burn needs.
:::

::: check
Why does differencing two noisy range measurements to estimate velocity get *worse*, not better, as the sample rate goes up?
:::

::: answer
The velocity noise is $\sigma_v = \sigma_r\sqrt2/\Delta t$. The top — the combined noise of two range samples — stays the same whatever the sample rate. The bottom, $\Delta t$, shrinks as the rate rises.

A faster rate means less true change in range between samples, but the same measurement noise on each one. So the noise becomes a bigger share of the signal, and the velocity estimate gets worse. That is why a direct Doppler velocity measurement is used instead of differenced range.
:::

::: check
What does lidar add over a plain radar altimeter, and what does it cost?
:::

::: answer
An imaging or scanning lidar builds a point cloud of the ground below. That makes hazard detection possible: spotting rocks, slopes and craters and steering away from them. A radar altimeter gives only one range value along its beam, with no picture of the surface, so it cannot do this.

The cost is more power, more complex onboard processing to turn the point cloud into a hazard map in real time, and usually a narrower field of regard than a simpler radar.
:::

::: check
Why does terrain relative navigation usually update more slowly than a radar altimeter's range and Doppler, and why is that acceptable?
:::

::: answer
TRN has to match a captured image (or elevation map) against a stored reference map. That processing takes noticeably longer than reading a single radar echo, so its update rate is inherently slower.

It is acceptable because TRN is correcting *horizontal position relative to terrain features*, which does not need updating every few milliseconds the way range and velocity along the approach do. A periodic terrain fix, fused with a fast inertial and radar-altimeter solution in between fixes, keeps the horizontal position error bounded.
:::

::: check
An inertial navigation solution has been coasting, uncorrected, for $300\ \mathrm{s}$ since its last external fix, with position error $\Delta x \approx \tfrac12 b t^2$. If the accelerometer bias were twice as large, how would the accumulated error at $300\ \mathrm{s}$ change?
:::

::: answer
The error is proportional to $b$, so doubling the bias doubles the error: from $4.50\ \mathrm{m}$ to $9.00\ \mathrm{m}$ at $t = 300\ \mathrm{s}$. (Check: $\tfrac12 \times 2\times10^{-4} \times 90\,000 = 9.00\ \mathrm{m}$.)

Because the error also grows with the *square* of elapsed time, the doubled bias costs even more meters over a longer coast. So the time since the last external fix matters at least as much as instrument quality in setting how much the terminal sensors must correct.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| GNSS limitation | Height is measured from a reference ellipsoid, not the actual surface; several meters of uncorrected error; absent on the Moon and Mars |
| Radar altimeter | Direct range (and, via Doppler, direct velocity) to the actual surface; free of terrain and geoid model error |
| $\sigma_v = \sigma_r\sqrt2/\Delta t$ | Velocity noise from differencing range samples — worse at higher sample rates, which motivates direct Doppler sensing |
| Lidar | Laser ranging at finer resolution; an imaging lidar's point cloud enables hazard detection, at higher power and processing cost |
| Terrain relative navigation | Matches onboard imagery against a stored map to fix position relative to terrain; used by Mars 2020 to pick a safe spot |
| $\Delta x \approx \tfrac12 b t^2$ | Inertial position drift from a constant accelerometer bias $b$; grows with the square of time since the last fix |
| Sensor fusion | IMU fills in between measurements; radar, lidar and TRN correct its drift before landing-burn ignition |

The next lesson puts this sensing to work on the hardest single problem in propulsive descent: a landing burn whose minimum throttle is above the vehicle's weight, which allows exactly one ignition point and no chance to pause and reassess.

::: context ellipsoid-geoid Three different "heights"
The **ellipsoid** is a smooth mathematical shape, slightly flattened at the poles, that GNSS measures height from. The **geoid** is where mean sea level would lie if it extended under the land; it bumps up and down relative to the ellipsoid by as much as about $100\ \mathrm{m}$. The **ground** is whatever is actually there. A radar altimeter measures the last one directly.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <polygon points="20,172 80,166 140,150 200,128 260,118 300,128 345,140 345,205 20,205" fill="#f2b880"/>
  <line x1="20" y1="165" x2="345" y2="165" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <path d="M20,158 C70,146 110,170 160,158 S250,146 345,156" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="244" y="18" width="12" height="22" fill="#1f2a44"/>
  <line x1="232" y1="163" x2="232" y2="44" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="232,42 227,52 237,52" fill="#6c7a93"/>
  <line x1="268" y1="120" x2="268" y2="44" stroke="#b4232c" stroke-width="2"/>
  <polygon points="268,42 263,52 273,52" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="226" y="90" text-anchor="end" fill="#6c7a93">GNSS height</text>
    <text x="274" y="80" fill="#b4232c">radar range</text>
    <text x="24" y="184" fill="#6c7a93">ellipsoid</text>
    <text x="24" y="142" fill="#1d6fd1">geoid (sea level)</text>
    <text x="150" y="195">ground</text>
    <text x="345" y="14" text-anchor="end" fill="#6c7a93">not to scale</text>
  </g>
</svg>
```
:::

::: context echo-timing Why a stopwatch is hard at the speed of light
Radio covers about $300\,000\ \mathrm{km}$ every second. From $100\ \mathrm{m}$ up, the round trip is $200\ \mathrm{m}$, which takes about $0.67$ millionths of a second ($667\ \mathrm{ns}$). Resolving $1\ \mathrm{cm}$ of range means resolving about $67$ trillionths of a second. That is possible but demanding, which is one reason many altimeters measure a frequency difference instead: frequencies are much easier to measure precisely than such tiny time gaps.
:::

::: context doppler-word The siren effect
When an ambulance drives toward you, each wave crest leaves from a little closer than the one before, so the crests arrive bunched up and the pitch sounds higher. Driving away, they spread out and the pitch drops. Radio waves do the same. For a radar, the echo is shifted twice (going down and coming back), so the shift is $f_D = 2v/\lambda$, where $\lambda$ is the wavelength. A radar at $36\ \mathrm{GHz}$ has $\lambda \approx 8.3\ \mathrm{mm}$; closing at $10\ \mathrm{m/s}$ shifts the echo by about $2400\ \mathrm{Hz}$ — easy to measure. The effect is named after Christian Doppler, who described it in 1842.
:::

::: context noise-adds-in-quadrature Why the square root of two
Random errors partly cancel. If each of two measurements is off by a typical $0.10\ \mathrm{m}$, sometimes both are off the same way and sometimes opposite ways. On average the error of their difference is not $0.20\ \mathrm{m}$ but $\sqrt{0.10^2 + 0.10^2} = 0.141\ \mathrm{m}$. Independent errors combine like the two short sides of a right triangle making the long side — the same Pythagoras rule you use for perpendicular velocity components.
:::

::: context differencing-noise Faster sampling, noisier speed
The velocity noise from differencing a range with $\sigma_r = 0.10\ \mathrm{m}$, on a scale where each step is ten times bigger. Sampling ten times faster makes the noise ten times worse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="30" width="80.5" height="22" fill="#1d6fd1"/>
  <rect x="40" y="65" width="150.5" height="22" fill="#8fb8f0"/>
  <rect x="40" y="100" width="220.5" height="22" fill="#b4232c"/>
  <line x1="40" y1="130" x2="330" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="130" x2="40" y2="136"/><line x1="110" y1="130" x2="110" y2="136"/><line x1="180" y1="130" x2="180" y2="136"/><line x1="250" y1="130" x2="250" y2="136"/><line x1="320" y1="130" x2="320" y2="136"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="126" y="45">1 Hz: 0.14 m/s</text>
    <text x="196" y="80">10 Hz: 1.41 m/s</text>
    <text x="266" y="115">100 Hz</text>
    <text x="266" y="96">14.1 m/s</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="150">0.01</text><text x="110" y="150">0.1</text><text x="180" y="150">1</text><text x="250" y="150">10</text><text x="320" y="150">100</text>
    <text x="180" y="166">velocity noise, m/s (each step ×10)</text>
  </g>
</svg>
```
:::

::: context slant-range When the beam is not straight down
If the vehicle leans by an angle $\theta$, its downward beam hits the ground at a slant, and the range $r$ it measures is longer than the true height $h$: over flat ground, $h = r\cos\theta$. At $10^\circ$ of tilt, a $100\ \mathrm{m}$ range means a height of $100\cos 10^\circ = 98.5\ \mathrm{m}$. Ignoring the tilt would put the ground $1.5\ \mathrm{m}$ too far away — enough to matter at touchdown. Real landers often carry several beams pointing in different directions, which also lets them measure velocity in three dimensions.
:::

::: context lidar-word Radar with light
"Lidar" is usually expanded as *light detection and ranging*, a close cousin of radar's *radio detection and ranging*. The principle is identical: send out a pulse or a modulated beam, catch the reflection, and work out the distance from the timing. Because laser light has a wavelength around a millionth of a meter instead of millimeters or centimeters, its beam can be made far narrower, so it can tell one small rock from the patch of ground beside it.
:::

::: context hazard-detection-history A human did it first
On Apollo 11 in 1969, Neil Armstrong looked out of the window during the final descent, saw that the computer was taking the lunar module toward a boulder-strewn area near a crater, took over the steering, and flew on to a clear spot, landing with little propellant margin left. Lidar-based hazard detection does automatically, in seconds, what Armstrong did by eye: look at the ground, judge what is safe, and steer there.
:::

::: context mars-2020-trn How Perseverance chose where to land
The Perseverance rover landed in Jezero Crater on 18 February 2021, in terrain earlier missions would have avoided as too dangerous. Its Lander Vision System took pictures of the ground while descending under the parachute, matched them against a map built from orbital images, and worked out where it was. The spacecraft then chose the safest reachable spot from a pre-loaded hazard map and steered there during the final powered descent. Lesson 13 returns to Mars and its sky crane landing.
:::

::: context drift-curve A small bias, a growing error
Position error from a constant bias $b = 10^{-4}\ \mathrm{m/s^2}$, plotted over five minutes. The curve starts almost flat and then climbs ever more steeply — the signature of $t^2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,170.0 59.3,169.8 68.7,169.4 78.0,168.7 87.3,167.6 96.7,166.2 106.0,164.6 115.3,162.7 124.7,160.4 134.0,157.8 143.3,155.0 152.7,151.8 162.0,148.4 171.3,144.7 180.7,140.6 190.0,136.2 199.3,131.6 208.7,126.7 218.0,121.4 227.3,115.8 236.7,110.0 246.0,103.8 255.3,97.4 264.7,90.7 274.0,83.6 283.3,76.2 292.7,68.6 302.0,60.7 311.3,52.4 320.7,43.8 330.0,35.0"/>
  <circle cx="106" cy="164.6" r="4" fill="#b4232c"/>
  <circle cx="190" cy="136.25" r="4" fill="#b4232c"/>
  <circle cx="330" cy="35" r="4" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="106" y="154" text-anchor="middle">0.18 m</text>
    <text x="190" y="126" text-anchor="middle">1.13 m</text>
    <text x="324" y="30" text-anchor="end">4.50 m</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="174">0</text><text x="45" y="129">1.5</text><text x="45" y="84">3.0</text><text x="45" y="39">4.5</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">0</text><text x="106" y="186">60</text><text x="190" y="186">150</text><text x="330" y="186">300</text>
    <text x="195" y="204">time since last fix, s</text>
  </g>
  <text x="14" y="100" font-size="11" fill="#1f2a44" transform="rotate(-90 14 100)" text-anchor="middle">error, m</text>
</svg>
```
:::

::: context sensor-fusion-bridge Blending sensors that disagree
Sensor fusion means combining several imperfect measurements into one best estimate, trusting each one according to how noisy it is and how old it is. The standard tool is the **Kalman filter**, which the course builds later: it runs the IMU forward between measurements, then nudges the estimate toward each new radar, lidar or TRN reading by an amount set by the relative uncertainties. The same idea lets your phone blend GPS, Wi-Fi and its own motion sensors into a single dot on the map.
:::
