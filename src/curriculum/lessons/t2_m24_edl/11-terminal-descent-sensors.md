---
id: l11-terminal-descent-sensors
title: Terminal descent sensors
minutes: 14
covers:
  - "terminal descent sensors: radar altimeter, lidar, terrain relative navigation"
---

Every guidance law this module has derived — Apollo's predictor-corrector, the Shuttle's energy-referenced tracker, and the terminal descent guidance lesson 12 builds next — needs a current estimate of position and velocity to act on. During the hypersonic and supersonic phases, an inertial measurement unit propagated from a known starting state, corrected occasionally by GNSS or a star tracker, is accurate enough. In the last few hundred to few thousand metres above the surface, it stops being enough, for two compounding reasons this lesson makes precise: inertial estimates drift without correction, and the one thing a landing vehicle most needs to know — height and velocity relative to the *actual surface it is about to touch* — is not what GNSS measures at all.

## Why GNSS runs out at the end

A GNSS receiver reports position relative to a mathematical reference ellipsoid, with an uncorrected accuracy typically of several metres. Two problems follow for a landing vehicle. First, several metres of position uncertainty is a small fraction of a multi-hundred-kilometre entry corridor but a large fraction of the precision a landing burn needs — lesson 12 shows touchdown-velocity sensitivity to exactly this scale of altitude error. Second, and more fundamentally, "height above the ellipsoid" is not "height above the ground": local terrain, or a droneship deck moving in the swell, can sit tens of metres above or below the ellipsoid at a given latitude and longitude, and GNSS alone has no way to know which. What a landing vehicle needs is range and velocity relative to the *surface it will actually touch*, and that requires a sensor that looks down and measures that surface directly.

## Radar altimeter: direct range and velocity

A radar altimeter transmits a signal toward the ground and measures the time (or, more commonly for a frequency-modulated continuous-wave design, the frequency shift) of the return to infer range directly — a measurement immune to geoid or terrain-model error, because it responds to whatever surface is actually beneath the vehicle at that instant, ellipsoid model or not. The same physical return, if the radar also measures Doppler shift, gives velocity along the line of sight directly, which matters more than it might first appear.

::: example Why velocity is measured directly, not differenced from range
Suppose only range is available, sampled with noise $\sigma_r = 0.10\ \mathrm{m}$ per sample, and velocity is estimated by differencing two consecutive range samples a time $\Delta t$ apart: $\hat v = (r_2 - r_1)/\Delta t$, with noise $\sigma_v = \sigma_r\sqrt2/\Delta t$. At a fast $10\ \mathrm{Hz}$ sample rate ($\Delta t = 0.1\ \mathrm{s}$), $\sigma_v = 1.41\ \mathrm{m/s}$ — already too noisy to trust for a landing-burn cutoff. At $100\ \mathrm{Hz}$ ($\Delta t = 0.01\ \mathrm{s}$), differencing amplifies the same range noise to $14.1\ \mathrm{m/s}$, worse, not better, because each sample's noise now dominates the (smaller) true change in range between samples. Only at a comparatively slow $1\ \mathrm{Hz}$ differencing interval does the noise fall to $0.14\ \mathrm{m/s}$ — usable, but at the cost of a full second of lag on a signal that is changing quickly during a landing burn. A Doppler measurement sidesteps this trade entirely by measuring velocity directly from the return signal's frequency shift, rather than inferring it from the numerically unstable process of differentiating a noisy range.
:::

::: key Why a radar altimeter is not optional
It gives direct range (and, via Doppler, direct velocity) to the actual surface beneath the vehicle — independent of geoid models, terrain models, and GNSS availability — at the metre-to-sub-metre accuracy a landing burn needs, which GNSS's several-metre, ellipsoid-referenced position estimate cannot supply on its own.
:::

## Lidar: the same idea, at higher resolution

A laser altimeter or imaging lidar is a radar altimeter's higher-frequency cousin: shorter wavelength gives finer range resolution and, in an imaging (scanning) configuration, a full point cloud of the terrain below rather than a single range number. This buys **hazard detection** a radar altimeter alone cannot provide — identifying individual rocks, slopes, or craters within a candidate landing area and steering the final approach away from them — at the cost of higher power consumption, a narrower field of regard, and (for a scanning system) more processing to turn a point cloud into an actionable hazard map in real time, all of which have to fit inside a landing burn's few-tens-of-seconds budget.

## Terrain relative navigation

**Terrain relative navigation (TRN)** takes a different measurement entirely: rather than ranging to the surface, it matches a camera image (or, in some implementations, a lidar-derived elevation map) against a stored reference map of the landing region, built beforehand from orbital reconnaissance imagery, to fix the vehicle's position *relative to the terrain itself* rather than relative to an inertial or ellipsoidal reference. This is what lets a modern lander recognise, in real time, that its inertially propagated position has drifted toward a hazardous crater field and retarget to a safer spot within the same landing ellipse — a capability neither a radar altimeter (which measures range but not identity) nor an uncorrected inertial estimate (which has no independent knowledge of what terrain it is over) can provide alone.

::: example How much inertial drift a terminal sensor has to correct
An inertial measurement unit's position estimate, uncorrected, drifts due to residual accelerometer bias roughly as $\Delta x \approx \tfrac12\,b\,t^2$ for a constant bias $b$. Take a representative bias of $b = 10^{-4}\ \mathrm{m/s^2}$ — small, but never exactly zero for a real instrument — over three candidate durations since the last external position fix:

| time since last fix | position error from bias alone |
| --- | --- |
| $60\ \mathrm{s}$ | $0.18\ \mathrm{m}$ |
| $150\ \mathrm{s}$ | $1.13\ \mathrm{m}$ |
| $300\ \mathrm{s}$ | $4.50\ \mathrm{m}$ |

The error grows with the *square* of elapsed time, not linearly, which is why terminal descent sensors are not a nice-to-have bolted onto an otherwise sufficient inertial system: a vehicle that has been coasting on inertial navigation alone since well before entry interface — several minutes, easily, across the phases of lessons 8 through 10 — accumulates metres of drift purely from a bias too small to matter for an orbital rendezvous, and a landing burn (lesson 12) is exactly the phase where a few metres of unknown position error is least affordable.
:::

## Fusing the three

No single sensor here does the whole job. A radar altimeter gives reliable range and velocity along essentially one line of sight, cheaply and robustly, but no information about what is at that point on the surface. Lidar adds a hazard-detection capability at the cost of complexity and power. Terrain relative navigation corrects horizontal position against absolute knowledge of the terrain, but at a slower update rate than a radar altimeter's direct range-and-Doppler measurement, since image matching takes longer to process than a single range return. A real terminal descent system fuses all three (typically alongside the inertial estimate they are correcting) into one navigation solution, timed so that the position and velocity uncertainty feeding the landing-burn guidance of lesson 12 is small enough, by ignition, for that guidance's single-shot burn to hit its target without a second chance to reassess.

## Check yourself

::: check
Explain why GNSS alone, even with no ranging error at all, is insufficient for a precision landing.
:::

::: answer
GNSS reports position relative to a mathematical reference ellipsoid, not relative to the actual surface beneath the vehicle. Local terrain, or a moving deck, can differ from the ellipsoid by tens of metres, and GNSS has no independent way to know that difference — so even a perfectly accurate GNSS fix does not tell the vehicle its true height above the ground it is about to touch, which is exactly the quantity a landing burn needs.
:::

::: check
Why does differencing two noisy range measurements to estimate velocity get *worse*, not better, as the sample rate increases?
:::

::: answer
The velocity estimate's noise is $\sigma_v = \sigma_r\sqrt2/\Delta t$: the numerator (combined range noise from two samples) stays fixed regardless of sample rate, while the denominator $\Delta t$ shrinks as sample rate rises. A faster sample rate means less true change in range between consecutive samples, but the same absolute measurement noise on each one, so the noise-to-signal ratio in the resulting velocity estimate grows worse, not better, at higher rates — which is why a direct Doppler velocity measurement, not differenced range, is used instead.
:::

::: check
What capability does lidar add over a simple radar altimeter, and what does it cost to get it?
:::

::: answer
An imaging or scanning lidar can build a point cloud of the terrain below, enabling hazard detection — identifying rocks, slopes, or craters and steering away from them — which a single-line-of-sight radar altimeter cannot do since it returns only one range value with no spatial detail. The cost is higher power consumption, more complex onboard processing to turn a point cloud into a real-time hazard map, and typically a narrower field of regard than a simpler radar system.
:::

::: check
Why does terrain relative navigation typically update more slowly than a radar altimeter's range-and-Doppler measurement, and why is that acceptable?
:::

::: answer
TRN requires matching a captured image (or elevation map) against a stored reference map, a processing step that takes measurably longer than reading a single radar return — so its update rate is inherently slower. This is acceptable because TRN is correcting *horizontal position relative to terrain features*, which does not need to be updated every few milliseconds the way range and velocity along the approach path do; a periodic terrain fix, fused with a fast-updating inertial and radar-altimeter solution between fixes, is enough to keep horizontal position error bounded.
:::

::: check
An inertial navigation solution has been coasting, uncorrected, for $300\ \mathrm{s}$ since its last external fix, with a bias-driven position error model of $\Delta x \approx \tfrac12 b t^2$. If the accelerometer bias were instead twice as large, how would the accumulated position error at $300\ \mathrm{s}$ change?
:::

::: answer
The error scales linearly with $b$, so doubling the bias doubles the accumulated position error: from $4.50\ \mathrm{m}$ to $9.00\ \mathrm{m}$ at $t = 300\ \mathrm{s}$. Because the error also grows with the *square* of elapsed time, the same doubled bias would produce an even larger relative penalty over a longer coast — reinforcing why the time since the last external fix, not instrument quality alone, sets how much a terminal sensor suite has to correct.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| GNSS limitation | Reports position relative to a reference ellipsoid, not the actual surface; several metres of uncorrected accuracy |
| Radar altimeter | Direct range (and, via Doppler, direct velocity) to the actual surface; immune to terrain/geoid model error |
| $\sigma_v = \sigma_r\sqrt2/\Delta t$ | Velocity noise from differencing range samples — grows worse at higher sample rates, motivating direct Doppler sensing |
| Lidar | Higher-resolution ranging; enabled hazard detection via a terrain point cloud, at higher power/processing cost |
| Terrain relative navigation | Matches onboard imagery against a stored map to fix position relative to terrain, not to an inertial or ellipsoidal reference |
| $\Delta x \approx \tfrac12 b t^2$ | Inertial position drift from a constant accelerometer bias $b$; grows with the square of time since the last fix |

The next lesson puts this sensing suite to work on the hardest single problem in propulsive descent: a landing burn with a minimum throttle above the vehicle's weight, which allows exactly one ignition point and no opportunity to pause and reassess.
