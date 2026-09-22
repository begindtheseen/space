---
id: l09-hardware-adjacent-work
title: "Hardware-adjacent work: meeting real sensor reality"
minutes: 20
covers:
  - "hardware-adjacent work: a real IMU, a thrust-vector-control testbed, a balancing robot, to evidence sensor reality"
---

A simulation-only portfolio can model sensor noise, and most do — a line of code drawing from `np.random.normal` with a chosen standard deviation. What it routinely cannot do is demonstrate that the author has ever been surprised by a sensor, because a simulated noise model only ever contains the imperfections its author already knew to include. Five effects show up in every real sensor and are consistently absent or wrong in simulation-only work: noise that is not simply white, a bias that drifts rather than sitting at a fixed value, measurement latency, saturation, and mounting misalignment between the sensor's own axes and the vehicle's. A candidate who has wired up one real IMU and fought it into a working estimate has met all five firsthand; a candidate who has only ever simulated one has met however many their model happened to include, which is usually fewer.

This lesson covers what a hardware-adjacent project needs to demonstrate that meeting, two worked characterizations run on real, computed data, and the specific role this category of project plays alongside the five simulation-based anchor projects — a complement, not a replacement.

## What simulation alone tends to get wrong

**Noise structure.** A simulated gyro's noise is usually white by construction, because that is what a random-number generator produces by default. A real gyro's noise has at least two distinct components with different time signatures — a short-timescale white component and a slower-drifting bias — and treating both as the same white process, as a naive simulation often does, produces a filter tuned for a noise spectrum the real sensor does not have.

**Bias.** A simulated bias is frequently a single fixed constant, injected once. A real bias wanders over time — the reason an estimator carries bias as a state to be continuously re-estimated rather than a number to calibrate out once — and a project that has never measured a real bias's actual drift rate has never had to justify why its estimator treats bias as time-varying rather than simply subtracting a constant.

**Latency, saturation, mounting misalignment.** A simulated measurement is available the instant it is generated; a real sensor and its interface have a real transport and processing delay a control loop has to account for. A simulated sensor rarely saturates unless the author explicitly programs it to; a real one has hard physical limits a large slew or a hard maneuver can hit. And a simulated sensor is, by default, perfectly aligned with the body frame it claims to measure — a real one never is, because no physical mounting is exact.

::: key
Five effects — noise structure, drifting bias, latency, saturation, mounting misalignment — are present in every real sensor and consistently underrepresented in simulation-only work, because a simulated sensor only ever contains the imperfections its author thought to model. Hardware-adjacent work is the specific evidence that you have met all five, not read about them.
:::

## Characterizing a real gyro: the Allan deviation

The Allan deviation is the standard tool for separating a sensor's noise into its component processes from nothing but a long time series of static output. Cluster the data into non-overlapping averages of length $\tau$, take the difference between successive cluster averages, and the Allan variance is half the mean squared difference, $\sigma^2(\tau)=\tfrac12\langle(\bar\omega_{k+1}-\bar\omega_k)^2\rangle$. Plotted against $\tau$ on log-log axes, angle random walk (high-frequency white noise on the rate) shows as a $\tau^{-1/2}$ slope with $\sigma(\tau)=N/\sqrt\tau$, and rate random walk (a slowly wandering bias) shows as a $\tau^{+1/2}$ slope with $\sigma(\tau)=K\sqrt{\tau/3}$ at longer averaging times — two different noise processes, separated by nothing more than how the estimate's uncertainty scales with how long you average.

::: example Recovering known noise parameters from a synthetic gyro time series
Generating $20$ million samples at $100\,\mathrm{Hz}$ ($200{,}000\,\mathrm s$ of data) from a signal built from a white component with standard deviation $2\times10^{-3}\,\mathrm{rad/s}$ (angle-random-walk coefficient $N=\sigma_{wn}\sqrt{\tau_0}=2.000\times10^{-4}\,\mathrm{rad/\sqrt s}$) plus a rate-random-walk component with spectral density $K=1.5\times10^{-6}\,\mathrm{rad/s/\sqrt s}$, and computing the Allan deviation at $\tau$ from $0.01\,\mathrm s$ to $20{,}000\,\mathrm s$: a log-log fit over $0.05$–$1\,\mathrm s$ gives a slope of $-0.501$ (theory: $-0.5$) and recovers $N=1.995\times10^{-4}\,\mathrm{rad/\sqrt s}$, within $0.2\%$ of the injected value. A separate fit over $1000$–$20{,}000\,\mathrm s$, well past the two processes' theoretical crossover near $\tau=20\,\mathrm s$, gives a slope of $+0.505$ (theory: $+0.5$) and recovers $K=1.449\times10^{-6}\,\mathrm{rad/s/\sqrt s}$, within about $3\%$ — noisier than the short-$\tau$ fit specifically because only a handful of independent long-averaging-time clusters are available from even $200{,}000\,\mathrm s$ of data, which is itself worth stating in a write-up as a limitation of the characterization rather than a hidden gap.
:::

A real gyro run through the identical procedure produces a real $N$ and $K$ for the actual part on your desk, rather than the two numbers you chose when writing the simulation — and this is the entire point of doing it on hardware. A datasheet gives a manufacturer's own figure, typically under controlled conditions; measuring it yourself, on the specific unit you have, and getting a number consistent with (or meaningfully different from) the datasheet, is evidence you can characterize a sensor rather than only read one.

## Mounting misalignment: a cheap, decisive check

Unlike noise, which needs a long static recording to characterize, mounting misalignment shows up immediately during any real maneuver, and the size of the resulting error is easy to check against a small-angle estimate.

::: example A one-degree misalignment during a fast maneuver
A sensor mounted with a $1.0^\circ$ misalignment about two axes, measuring a pure $100^\circ/\mathrm s$ roll rate, reports $99.970^\circ/\mathrm s$ on the intended axis and, critically, $-1.745^\circ/\mathrm s$ and $+1.745^\circ/\mathrm s$ of apparent rate on the two axes that should read exactly zero — closely matching the small-angle estimate $\varepsilon\cdot\text{rate}=1.0^\circ\times\pi/180\times100^\circ/\mathrm s=1.745^\circ/\mathrm s$. Against a typical gyro noise floor of roughly $0.011^\circ/\mathrm s$ at a one-second averaging time (from the Allan-deviation example above), this cross-coupled error is about $150$ times larger than the sensor's own noise — an effect entirely invisible in a simulation that assumes perfect axis alignment by default, and one that dominates every other error source the moment the vehicle does anything but sit still.
:::

A project that measures its own hardware's mounting error — by commanding a known single-axis rate and reading the cross-coupling on the other two channels, as above — and calibrates it out demonstrates a specific, concrete skill a pure-simulation estimator or controller project has no occasion to develop.

## What counts as hardware-adjacent, and how it fits the rest of the portfolio

A real IMU characterization project, built around exactly the Allan-deviation and misalignment measurements above, is the most directly relevant version for a navigation-flavored portfolio. A thrust-vector-control testbed — a small gimbal actuator closing a position or rate loop against a real encoder or potentiometer, with real actuator latency and friction — evidences the same closed-loop-against-real-hardware skill for a controls-flavored portfolio. A balancing robot, an inverted pendulum on a cart or a two-wheeled self-balancing platform, is the most accessible of the three and closes an entire estimation-plus-control loop against real, noisy, latent sensors at low cost.

None of these should replace one of the five simulation-based anchor projects from this module — the interview format still rewards a small number of deep projects, and a hardware-adjacent piece is additional evidence of a specific kind, not a substitute for the depth an anchor project like the 6-DOF simulation or the quaternion EKF demonstrates. Its value is that it answers a question none of the five simulation anchors structurally can: have you ever had to make an estimator or a controller work against a sensor that did not behave the way its own model assumed it would.

::: warning
A simulation-only project can verify — check that its code correctly implements its own equations — but it cannot validate its sensor model against reality, because nothing in a pure simulation is ever compared to an actual measurement. Calling a simulation-only noise model "realistic" without ever having measured a real sensor's actual noise is an unvalidated claim dressed as a validated one; hardware-adjacent work is the most direct way a self-taught candidate can close that specific gap.
:::

## Check yourself

::: check
A candidate's simulation injects gyro noise as a single white Gaussian process. Explain, using the Allan-deviation framework, what real noise behavior this choice fails to represent, and why it matters for filter design.
:::

::: answer
Real gyro noise typically has at least two distinct components — a white, high-frequency component (angle random walk, showing a $\tau^{-1/2}$ Allan-deviation slope) and a slowly wandering bias (rate random walk, showing a $\tau^{+1/2}$ slope at longer averaging times) — and a single white process represents only the first. This matters for filter design because an estimator that only models white measurement noise has no mechanism to track a slowly drifting bias, and will either fail to remove it or absorb it incorrectly into the state it does track; the standard fix, carrying bias as an explicitly estimated, time-varying state, is only motivated once the rate-random-walk behavior is recognized as a real, separate process rather than folded into the white term.
:::

::: check
In the worked Allan-deviation example, the short-$\tau$ fit recovered the injected ARW coefficient to within $0.2\%$, while the long-$\tau$ fit recovered the RRW coefficient to only about $3\%$. Explain why the long-$\tau$ estimate is noisier, using the number of independent clusters available at each timescale.
:::

::: answer
The Allan-deviation estimator averages over non-overlapping clusters of length $\tau$, so the number of independent clusters available from a fixed total data length shrinks as $\tau$ grows — at $\tau=1\,\mathrm s$ there were on the order of $200{,}000$ clusters from the $200{,}000\,\mathrm s$ recording, while at $\tau=20{,}000\,\mathrm s$ there were only about ten. An estimate built from ten samples has far more statistical scatter than one built from two hundred thousand, so the long-averaging-time (rate-random-walk) estimate is inherently noisier for a fixed total recording length — and a real characterization would need a substantially longer recording, or wider confidence bounds stated explicitly, to tighten it.
:::

::: check
A $1^\circ$ mounting misalignment during a $100^\circ/\mathrm s$ maneuver produced about $1.75^\circ/\mathrm s$ of cross-coupled error — roughly $150$ times the sensor's own noise floor at a one-second averaging time. Why does this mean mounting calibration matters more than reducing sensor noise for a vehicle that maneuvers aggressively?
:::

::: answer
Because the cross-coupling error scales with the maneuver rate and the misalignment angle, while the sensor's intrinsic noise floor does not grow with maneuver rate at all — so during any sufficiently fast maneuver, an uncalibrated mounting error dominates the total measurement error by two orders of magnitude, making further noise reduction essentially irrelevant to the actual error budget until the much larger, systematic misalignment error is calibrated out first. Effort spent chasing a better noise-floor number on a sensor with an uncalibrated mount is solving the smaller problem.
:::

::: check
Why does this lesson recommend hardware-adjacent work as a complement to the five simulation-based anchor projects rather than as a substitute for one of them?
:::

::: answer
The interview format rewards a small number of projects defended in real depth, and a hardware-adjacent project answers a specific, narrow question — has the candidate met real sensor imperfection — that none of the five simulation anchors can structurally answer on their own, since a simulation's sensor model is whatever the author chose to write. It does not, however, replace the depth a project like the 6-DOF simulation's dispersion campaign or the quaternion EKF's consistency testing demonstrates, which are different competencies entirely; a portfolio built around three or four deep anchor projects plus one focused hardware-adjacent piece uses the hardware project to close a specific gap rather than diluting the "few, deep" principle this module opened with.
:::

::: check
A candidate claims their simulation's sensor noise model is "realistic" because the standard deviation was chosen to match a manufacturer's datasheet figure. What is the specific gap between this claim and validation, as this lesson uses the term?
:::

::: answer
Matching a datasheet figure is choosing an assumption that is plausible, not confirming it against an actual measurement — the datasheet describes the manufacturer's own unit and test conditions, not necessarily the specific sensor, mounting, and operating environment the candidate would actually use. Validation, in the sense this module uses it, requires checking the model against something independent of the model itself — here, a real measurement, such as the candidate's own Allan-deviation characterization of an actual unit. Citing a datasheet value is a reasonable verification-stage assumption to state explicitly; calling it "realistic" without ever measuring a real sensor is a validation claim the project has not actually earned.
:::

## Summary

| Item | This lesson's worked result |
| --- | --- |
| Five effects simulation misses | Noise structure, drifting bias, latency, saturation, mounting misalignment |
| Allan deviation, short $\tau$ | Slope $-0.501$ (theory $-0.5$); ARW coefficient recovered to $0.2\%$ |
| Allan deviation, long $\tau$ | Slope $+0.505$ (theory $+0.5$); RRW coefficient recovered to about $3\%$, noisier from fewer independent clusters |
| Mounting misalignment | $1^\circ$ misalignment at $100^\circ/\mathrm s$ gives $\approx1.75^\circ/\mathrm s$ cross-coupling, $\approx150\times$ the noise floor |
| Project types | Real IMU characterization, a TVC testbed, a balancing robot — complements, not substitutes for, the five anchors |
| What it validates that simulation cannot | That a sensor model was checked against a real measurement, not only assumed plausible |

The next lesson turns from any single project to the discipline that makes every one of them checkable by someone else at all: reproducibility, and what "one command, from a clean machine" actually requires.
