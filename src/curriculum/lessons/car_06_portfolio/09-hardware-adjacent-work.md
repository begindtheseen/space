---
id: l09-hardware-adjacent-work
title: "Hardware-adjacent work: meeting real sensor reality"
minutes: 18
covers:
  - "hardware-adjacent work: a real IMU, a thrust-vector-control testbed, a balancing robot, to evidence sensor reality"
---

Step on a cheap bathroom scale with nothing in your hands, then step off. It reads $0.3\,\mathrm{kg}$ with nobody on it. Leave it for an hour and it reads $0.5$. Stand on it at a slight angle and it reads differently again. Nobody wrote those quirks into the scale on purpose. They are what real sensors do.

A simulation-only portfolio can model sensor noise, and most do — one line of code calling `np.random.normal` with a chosen spread. What it cannot do is show that its author has ever been *surprised* by a sensor. A made-up noise model only contains the flaws its author already knew to include.

Five effects show up in every real sensor, and are usually missing or wrong in simulation-only work: noise that is not one simple random process, a **bias** (a steady offset) that drifts, **latency** (delay), **saturation** (a hard top limit), and **mounting misalignment** (the sensor sitting slightly crooked). A candidate who has wired up one real **[[IMU|imu-inside]]** — inertial measurement unit, said "I-M-U", a small box of gyroscopes and accelerometers — and fought it into a working estimate has met all five in person. A candidate who has only simulated one has met however many their model happened to include, which is usually fewer.

This lesson covers what a hardware-adjacent project needs to show that meeting, two worked characterizations on computed data, and the role this kind of project plays next to the five simulation-based anchors: a complement, not a replacement.

## What simulation alone tends to get wrong

**Noise structure.** A simulated gyroscope's noise is usually **[[white|white-noise]]** by construction — each sample random and unrelated to the last — because that is what a random-number generator gives by default. A real gyro's noise has at least two parts with different time signatures: a fast, white jitter, and a slow wander in its bias. Treating both as one white process gives a filter tuned for a noise pattern the real sensor does not have.

**Bias.** A simulated bias is often one fixed number, added once. A real bias **[[wanders over time|bias-drift]]**. That is why an estimator carries bias as a *state* it keeps re-estimating, instead of a number it calibrates out once. A project that has never measured a real bias's drift has never had to justify that choice.

**Latency.** A simulated measurement is available the instant it is made. A real sensor and its wiring add a transport and processing delay, and a control loop has to allow for it.

**Saturation.** A simulated sensor rarely hits a limit unless the author programs one. A real gyro has a top rate it can measure — a fast spin or a hard maneuver can hit it, and the reading simply stops growing.

**Mounting misalignment.** A simulated sensor is, by default, lined up perfectly with the body it measures. A real one never is, because no physical mounting is exact.

::: key
A real IMU, a thrust-vector-control testbed or a balancing robot demonstrates that you have met real sensor noise, bias, latency, saturation and mounting misalignment. Simulation-only candidates are routinely surprised by all five, because a simulated sensor only contains the imperfections its author thought to model.
:::

## Characterizing a real gyro: the Allan deviation

### The idea: average longer, see what is left

Suppose you set a gyro on a table and record its rate reading for a long time. It should read zero, but it jitters. If you average the readings over longer and longer chunks of time, the fast jitter cancels out more and more, so the averages get steadier. But the slow wander does not cancel — over longer chunks it has more time to move. So there is a sweet spot: average too briefly and jitter wins; average too long and wander wins.

The **[[Allan deviation|allan-history]]** measures exactly this trade-off. It is the standard tool for splitting a sensor's noise into its parts, using nothing but a long recording of the sensor sitting still.

### The recipe

1. Pick a chunk length $\tau$ ("tau"), in seconds.
2. Cut the recording into back-to-back chunks of that length, and average each one. Call the averages $\bar\omega_1,\bar\omega_2,\ldots$ ("omega bar" — $\omega$ is the usual letter for turn rate).
3. Take the difference between each chunk's average and the next.
4. Square those differences, average them, and halve the result.

That gives the **Allan variance**:

$$
\sigma^2(\tau)=\tfrac12\big\langle(\bar\omega_{k+1}-\bar\omega_k)^2\big\rangle,
$$

where the angle brackets $\langle\ \rangle$ mean "the average over all neighboring pairs". Its square root, $\sigma(\tau)$, is the Allan deviation, in the same units as the rate. Repeat for many $\tau$ and plot $\sigma(\tau)$ against $\tau$ on **[[log-log axes|log-log]]**.

### Reading the plot

Each kind of noise draws a straight line with its own slope.

**Angle random walk** (ARW) — the fast white jitter on the rate — gives a slope of $-\tfrac12$:

$$
\sigma(\tau)=\frac{N}{\sqrt\tau}.
$$

Here $N$ is the ARW coefficient, in $\mathrm{rad/\sqrt s}$. Averaging four times longer halves this part.

**Rate random walk** (RRW) — the slow wander of the bias — gives a slope of $+\tfrac12$ at long $\tau$:

$$
\sigma(\tau)=K\sqrt{\tau/3}.
$$

Here $K$ is the RRW coefficient, in $\mathrm{rad/s/\sqrt s}$. Averaging four times longer *doubles* this part.

Two different noise processes, told apart by nothing more than how the spread changes with how long you average. The two lines cross where $N/\sqrt\tau=K\sqrt{\tau/3}$. Squaring both sides gives $N^2/\tau=K^2\tau/3$, so $\tau^2=3N^2/K^2$ and

$$
\tau_{\text{cross}}=\frac{\sqrt3\,N}{K}.
$$

::: example Recovering known noise numbers from a synthetic gyro
To test the method, build a fake gyro whose answers you know.

**The data.** $20$ million samples at $100\,\mathrm{Hz}$ — that is $20{,}000{,}000/100=200{,}000\,\mathrm s$, about $2.3$ days. The signal is white noise with standard deviation $2\times10^{-3}\,\mathrm{rad/s}$ per sample, plus a rate random walk with $K=1.5\times10^{-6}\,\mathrm{rad/s/\sqrt s}$.

**The true $N$.** For white noise sampled every $\tau_0=0.01\,\mathrm s$, $N=\sigma_{wn}\sqrt{\tau_0}=2\times10^{-3}\times\sqrt{0.01}=2\times10^{-3}\times0.1=2.000\times10^{-4}\,\mathrm{rad/\sqrt s}$.

**The crossover.** $\tau_{\text{cross}}=\sqrt3\times2\times10^{-4}/1.5\times10^{-6}\approx231\,\mathrm s$. Below a few tens of seconds, ARW should rule; well above a few hundred, RRW should.

**Short-$\tau$ fit.** Compute $\sigma(\tau)$ from $0.01\,\mathrm s$ to $20{,}000\,\mathrm s$. A straight-line fit on the log-log plot over $0.05$–$1\,\mathrm s$ gives a slope of $-0.501$ (theory: $-0.5$) and $N=1.995\times10^{-4}\,\mathrm{rad/\sqrt s}$ — within $0.2\%$ of the true value.

**Long-$\tau$ fit.** A separate fit over $1000$–$20{,}000\,\mathrm s$, well past the crossover, gives a slope of $+0.505$ (theory: $+0.5$) and $K=1.449\times10^{-6}\,\mathrm{rad/s/\sqrt s}$ — within about $3\%$.

**Sanity check.** The long-$\tau$ answer is the shakier one, and it should be. At $\tau=20{,}000\,\mathrm s$ the whole recording holds only $200{,}000/20{,}000=10$ chunks. Rerunning the same experiment with other random seeds, the long-$\tau$ estimate of $K$ lands anywhere from about half to about $1.7$ times the true value, so the $3\%$ here was partly luck. A write-up should say so plainly — as a stated limit of the characterization, with error bars, not a hidden gap.
:::

A real gyro run through the identical recipe gives a real $N$ and $K$ for the actual part on your desk, instead of the two numbers you chose when writing the simulation. That is the whole point of doing it on hardware. A **[[datasheet|datasheet]]** gives the maker's own figure, usually under controlled conditions. Measuring it yourself on your own unit, and getting a number that matches the datasheet — or clearly does not — is evidence that you can *characterize* a sensor, not only read about one.

## Mounting misalignment: a cheap, decisive check

Noise needs a long, still recording to measure. Misalignment is the opposite: it shows up the moment the vehicle moves, and a small-angle estimate tells you how big to expect it.

Picture a ruler laid [[slightly crooked|misalignment-picture]] on a sheet of graph paper. Slide the ruler straight along the paper's $x$ direction, and the ruler's own markings say it moved mostly along *its* length — but also a little sideways. A crooked gyro does the same: a pure roll shows up mostly on the roll channel, plus a small false rate on the other two.

For a small tilt $\varepsilon$ ("epsilon", in radians), the false rate on a cross axis is about

$$
\text{false rate}\approx\varepsilon\times\text{true rate}.
$$

::: example A one-degree misalignment during a fast maneuver
A gyro is mounted $1.0^\circ$ off about two axes. The vehicle does a pure $100^\circ/\mathrm s$ roll.

**What it reports.** The roll channel reads $99.970^\circ/\mathrm s$ — barely changed, because $\cos1^\circ\approx0.99985$ and two such factors give about $0.99970$. The two channels that should read exactly zero read $-1.745^\circ/\mathrm s$ and $+1.745^\circ/\mathrm s$.

**The small-angle check.** $1.0^\circ$ in radians is $1.0\times\pi/180=0.01745$. Times $100^\circ/\mathrm s$ gives $1.745^\circ/\mathrm s$. It matches.

**Against the noise.** From the Allan example, the noise at a $1\,\mathrm s$ average is $\sigma(1)=N/\sqrt1=2\times10^{-4}\,\mathrm{rad/s}$, which is $2\times10^{-4}\times180/\pi\approx0.0115^\circ/\mathrm s$ — about $0.011^\circ/\mathrm s$. The false cross rate is $1.745/0.0115\approx150$ times larger.

**Sanity check.** A $1^\circ$ error is small — hard to see by eye on a bench. Yet during a fast maneuver it swamps the sensor's own noise by two orders of magnitude. That is invisible in a simulation that assumes perfect alignment, and it dominates every other error source the moment the vehicle does anything but sit still.
:::

A project that measures its own hardware's mounting error — command a known single-axis rate, read the leak into the other two channels, as above — and then calibrates it out shows a concrete skill a pure-simulation project never has occasion to build.

## What counts as hardware-adjacent, and where it fits

Three kinds of project fit this category:

- **A real IMU characterization**, built around the Allan-deviation and misalignment measurements above. The most directly useful version for a navigation-flavored portfolio.
- **A [[thrust-vector-control testbed|tvc-testbed]]** — a small gimbal actuator closing a position or rate loop against a real encoder or potentiometer, with real actuator delay and friction. It shows the same closed-loop-against-real-hardware skill for a controls-flavored portfolio.
- **A [[balancing robot|balancing-robot]]** — an inverted pendulum on a cart, or a two-wheeled self-balancing platform. The cheapest and most accessible of the three, and it closes a whole estimation-plus-control loop against real, noisy, delayed sensors.

None of these should *replace* one of the five simulation-based anchors. The interview format still rewards a small number of deep projects. A hardware-adjacent piece is extra evidence of a specific kind, not a substitute for the depth an anchor like the 6-DOF simulation or the quaternion EKF shows.

Its value is that it answers a question none of the five simulation anchors can: *have you ever had to make an estimator or controller work against a sensor that did not behave the way its model said it would?* That is also why it matters even for a pure analysis role — every one of the five effects changes how an estimator or controller must be designed, and they are the subject of follow-up questions in technical rounds.

::: warning
A simulation-only project can **verify** — check that its code correctly does what its own equations say. It cannot **[[validate|verify-validate]]** its sensor model against reality, because nothing in a pure simulation is ever compared to a real measurement. Calling a simulation-only noise model "realistic" without ever measuring a real sensor is an unvalidated claim dressed as a validated one. Hardware-adjacent work is the most direct way a self-taught candidate can close that gap.
:::

## Check yourself

::: check
A candidate's simulation adds gyro noise as one white Gaussian process. Using the Allan-deviation picture, what real noise behavior does this leave out, and why does it matter for filter design?
:::

::: answer
Real gyro noise has at least two parts: a fast white part (angle random walk, a $\tau^{-1/2}$ slope on the Allan plot) and a slowly wandering bias (rate random walk, a $\tau^{+1/2}$ slope at long averaging times). One white process represents only the first.

It matters because an estimator that models only white noise has no way to follow a drifting bias. It will either fail to remove the bias or wrongly soak it into the states it does track. The standard fix — carrying bias as an estimated, time-varying state — only makes sense once rate random walk is recognized as a real, separate process.
:::

::: check
In the Allan example, the short-$\tau$ fit recovered $N$ to within $0.2\%$, but the long-$\tau$ fit recovered $K$ only to about $3\%$ — and other seeds did much worse. Explain why, using the number of independent chunks at each $\tau$.
:::

::: answer
The Allan variance averages over back-to-back chunks of length $\tau$, so a fixed recording holds fewer chunks as $\tau$ grows. At $\tau=1\,\mathrm s$, the $200{,}000\,\mathrm s$ recording holds about $200{,}000$ chunks. At $\tau=20{,}000\,\mathrm s$, it holds only $10$.

An average of ten things scatters far more than an average of two hundred thousand. So the long-$\tau$ (rate-random-walk) estimate is inherently noisier for a fixed recording length. Tightening it needs a much longer recording, or clearly stated wider error bars.
:::

::: check
A $1^\circ$ mounting misalignment during a $100^\circ/\mathrm s$ maneuver gave about $1.75^\circ/\mathrm s$ of false cross-axis rate — roughly $150$ times the noise at a $1\,\mathrm s$ average. Why does this make mounting calibration more important than lower noise for a vehicle that maneuvers hard?
:::

::: answer
The misalignment error grows with the maneuver rate (about $\varepsilon\times$ rate), while the sensor's noise does not grow with rate at all. During any fast maneuver, an uncalibrated mount therefore dominates the total error by about two orders of magnitude. Buying a quieter sensor barely changes the total until the far larger, systematic misalignment is calibrated out. Chasing a better noise number on an uncalibrated mount is solving the smaller problem.
:::

::: check
Why does this lesson recommend hardware-adjacent work as a *complement* to the five simulation-based anchors rather than a substitute for one?
:::

::: answer
The interview rewards a few projects defended in real depth. A hardware-adjacent project answers one specific, narrow question — has this candidate met real sensor imperfection? — that no simulation anchor can, since a simulation's sensor model is whatever its author wrote.

It does not replace the depth that, say, the 6-DOF simulation's dispersion campaign or the quaternion EKF's consistency testing shows; those are different skills. Three or four deep anchors plus one focused hardware piece uses the hardware to close a specific gap without breaking the "few, deep" principle this module opened with.
:::

::: check
A candidate says their simulated sensor noise is "realistic" because its standard deviation matches the maker's datasheet. What is the gap between this claim and validation, as this lesson uses the word?
:::

::: answer
Matching a datasheet is choosing a plausible assumption, not confirming it against a measurement. The datasheet describes the maker's units under the maker's test conditions — not necessarily this sensor, this mounting, or this environment.

Validation means checking the model against something independent of the model — here, a real measurement, such as the candidate's own Allan-deviation characterization of an actual unit. Using a datasheet value is a fine assumption to state openly. Calling it "realistic" without ever measuring a real sensor is a validation claim the project has not earned.
:::

## Summary

| Item | This lesson's worked result |
| --- | --- |
| Five effects simulation misses | Noise structure, drifting bias, latency, saturation, mounting misalignment |
| Allan variance | $\sigma^2(\tau)=\tfrac12\langle(\bar\omega_{k+1}-\bar\omega_k)^2\rangle$ |
| Angle random walk | $\sigma(\tau)=N/\sqrt\tau$, slope $-\tfrac12$; recovered slope $-0.501$, $N$ within $0.2\%$ |
| Rate random walk | $\sigma(\tau)=K\sqrt{\tau/3}$, slope $+\tfrac12$; recovered slope $+0.505$, $K$ within about $3\%$ in this run (noisier: few long chunks) |
| Crossover | $\tau_{\text{cross}}=\sqrt3N/K\approx231\,\mathrm s$ for this gyro |
| Mounting misalignment | $1^\circ$ at $100^\circ/\mathrm s$ gives $\approx1.75^\circ/\mathrm s$ cross-coupling, $\approx150\times$ the $1\,\mathrm s$ noise |
| Project types | Real IMU characterization, a TVC testbed, a balancing robot — complements, not substitutes, for the five anchors |
| What it validates | That a sensor model was checked against a real measurement, not only assumed plausible |

The next lesson turns from any single project to the habit that lets someone else check every one of them: reproducibility, and what "one command, from a clean machine" really requires.

::: context imu-inside What is inside an IMU
An IMU holds three **gyroscopes**, which sense how fast it is turning, and three **accelerometers**, which sense how it is being pushed, one of each per axis. The ones in phones, drones and hobby boards are **MEMS** devices (said "mems", micro-electro-mechanical systems): tiny vibrating structures etched into silicon, a few millimeters across, costing a few dollars. Spacecraft and rockets use far better and far more expensive units, but the same five effects show up in both — only the sizes change. A cheap MEMS IMU is the perfect teacher, because it has all five, loudly.
:::

::: context white-noise Why the noise is called white
White light is a mix of every color in equal amounts. **White noise** is a random signal with every frequency in equal amounts — which, in time, means each sample has nothing to do with the one before. The hiss of an untuned radio is close to white.

Noise that has more slow wander than fast jitter is sometimes called "red" or "brown", by the same color idea: red light is the low-frequency end of the rainbow. A gyro's bias drift is that kind of reddish noise sitting underneath the white hiss.
:::

::: context bias-drift A zero that will not stay put
Why does a bias wander? A sensor's zero point depends on temperature, on small stresses in its mounting, on aging of its parts, and on what happened to it at power-on. As these change, the reading at rest slowly shifts. A gyro with a bias of $0.01^\circ/\mathrm s$, left uncorrected, drifts $0.01\times3600=36^\circ$ in pointing after one hour. That is why every navigation filter estimates bias continuously rather than trusting a number measured once on the bench.
:::

::: context allan-history From atomic clocks to gyros
The Allan variance is named for David W. Allan, who introduced it in 1966 while working on precision clocks at the U.S. National Bureau of Standards (now NIST). Clock makers had the same problem gyro makers have: an ordinary standard deviation of a clock's errors kept growing the longer you recorded, so it never settled on one number. Allan's method, based on differences of neighboring averages, gives a stable answer for each averaging time. Inertial-sensor engineers later adopted it, and IEEE standards for gyro testing use it today.
:::

::: context log-log Two straight lines on one plot
On log-log axes, every factor of ten takes the same distance, on both axes. A power law such as $\sigma=N\tau^{-1/2}$ then becomes a straight line whose slope is the power. That is why the Allan plot is a lopsided "V": a slope of $-\tfrac12$ on the left where white jitter rules, a slope of $+\tfrac12$ on the right where bias wander rules, and a floor near the crossover — the best stability this gyro can offer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">averaging time τ (log scale)</text>
  <text x="18" y="88" font-size="11" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 18 88)">σ(τ), log scale</text>
  <line x1="60" y1="30" x2="230" y2="115" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="190" y1="135" x2="330" y2="65" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="230" cy="115" r="4" fill="#1f2a44"/>
  <text x="110" y="42" font-size="11" fill="#1d6fd1">slope −1/2: jitter (N)</text>
  <text x="330" y="52" font-size="11" text-anchor="end" fill="#b4232c">slope +1/2: drift (K)</text>
  <text x="230" y="150" font-size="11" text-anchor="middle" fill="#1f2a44">crossover</text>
</svg>
```

The two lines are drawn with equal and opposite slopes, as the theory says.
:::

::: context datasheet The maker's promise
A **datasheet** is the document a manufacturer publishes for a part: its size, power, range, and typical and worst-case performance. For a gyro it usually lists the angle random walk, the bias stability, and the full-scale range (the saturation limit). Datasheet numbers are measured on the maker's test units, often at room temperature and at rest. Your unit, soldered onto your board next to a warm voltage regulator and a vibrating motor, may do noticeably worse. Measuring and comparing is how you find out.
:::

::: context misalignment-picture A slightly crooked sensor
The sensor's axes are turned a small angle $\varepsilon$ from the body's axes. A pure turn about the body's $x$ axis then has a small piece, about $\varepsilon$ times as big, along the sensor's $y$ axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="140" x2="300" y2="140" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="140" x2="60" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <text x="305" y="144" font-size="11" fill="#1f2a44">body x</text>
  <text x="66" y="24" font-size="11" fill="#1f2a44">body y</text>
  <line x1="60" y1="140" x2="296" y2="98" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="60" y1="140" x2="39" y2="22" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="230" y="96" font-size="11" fill="#1d6fd1">sensor x</text>
  <text x="18" y="16" font-size="11" fill="#1d6fd1">sensor y</text>
  <path d="M 150 140 A 90 90 0 0 0 148.6 124.4" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="156" y="132" font-size="12" fill="#b4232c">ε</text>
</svg>
```

The tilt is drawn at $10^\circ$ so you can see it; the example's $1^\circ$ would look almost straight.
:::

::: context tvc-testbed Steering a rocket by pointing its engine
**Thrust vector control** steers a rocket by swiveling the engine on a pivot called a **gimbal**, so the push points slightly off-center and turns the vehicle. A tabletop testbed replaces the engine with a small motor or propeller on a two-axis gimbal driven by hobby servos, and measures the gimbal angle with an **encoder** or **potentiometer** (sensors that report how far a shaft has turned). Closing that loop by hand teaches, fast, what servo delay, dead zones and friction do to a controller that looked perfect in simulation.
:::

::: context balancing-robot The broomstick on your hand
Balance a broomstick upright on your palm. It starts to fall; you move your hand under it; it starts to fall the other way. That is an **inverted pendulum**, and it is unstable — left alone, it always falls. A two-wheeled balancing robot is the same problem: an IMU senses the tilt, and the wheels drive under the body to catch it, many times a second.

It is a small version of a rocket balancing on its engine during launch or landing. And it forces everything this lesson is about: the gyro's bias, the accelerometer's noise, the loop delay, all at once, on a budget of tens of dollars.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="340" y2="150" stroke="#6c7a93" stroke-width="2"/>
  <circle cx="160" cy="132" r="18" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="160" y1="132" x2="200" y2="32" stroke="#1f2a44" stroke-width="6"/>
  <rect x="190" y="22" width="22" height="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="218" y="34" font-size="11" fill="#1f2a44">IMU senses tilt</text>
  <line x1="240" y1="60" x2="240" y2="100" stroke="#b4232c" stroke-width="2"/>
  <polygon points="240,108 234,96 246,96" fill="#b4232c"/>
  <text x="250" y="88" font-size="11" fill="#b4232c">gravity tips it over</text>
  <line x1="130" y1="162" x2="190" y2="162" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="198,162 186,156 186,168" fill="#1d6fd1"/>
  <text x="206" y="166" font-size="11" fill="#1d6fd1">wheels drive under it</text>
</svg>
```
:::

::: context verify-validate Two words, two questions
**Verification** asks: "Did I build the thing right?" — does the code do what the equations say? **Validation** asks: "Did I build the right thing?" — do the equations describe reality? A simulation can be perfectly verified and still badly wrong about the world, if its model was wrong. Only a comparison with real measurements can validate. This pair of words came up in the write-up and verification lessons, and it returns whenever a result is presented to a review board.
:::
