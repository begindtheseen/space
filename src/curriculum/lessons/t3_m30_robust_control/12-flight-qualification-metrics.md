---
id: l12-flight-qualification-metrics
title: Flight qualification metrics
minutes: 24
covers:
  - 'Flight qualification metrics: stability margin requirements across the envelope, discrete-time mu analysis, handling-qualities criteria'
---

Before a bridge opens, engineers drive loaded trucks over it, measure the sag and file the numbers. Flight works the same way. This module so far has been analysis. This lesson is about the evidence it must produce before anyone signs off at a **[[flight readiness review|frr]]**.

Three families of numbers appear in every control system verification package:

- **stability margins**, shown not at one operating point but across the whole flight envelope and across the dispersions;
- a **discrete-time analysis**, because the controller is really a program running at a fixed rate on a computer, with sampling, computation delay and aliasing;
- for any vehicle a human flies, **handling-qualities criteria**, which say whether a competent pilot can actually use it.

None of these is new theory. They are the conventions that turn this module's theories into evidence, and they eat most of a program's engineering time. One margin at one flight condition takes an afternoon. The full set takes months.

## Margins across the envelope

The traditional requirement for a launch vehicle's rigid-body attitude loop is **6 dB of gain margin and 30 degrees of phase margin**. When the vehicle is aerodynamically unstable, the gain margin is needed on *both* sides: too much gain and the loop oscillates, too little and it cannot overcome the aerodynamic moment, as the atmospheric flight module showed.

Flexible (bending) modes are handled in one of two ways — **[[gain stabilization or phase stabilization|gain-phase-stabilized]]**:

- A **gain-stabilized** mode must be attenuated — typically by at least 6 dB, often 8 or 12 dB for the first mode — so that its peak cannot reach a loop gain of one, whatever its phase.
- A **phase-stabilized** mode may keep noticeable gain, but its phase must stay a set distance — commonly 60 degrees — from the instability condition, across the whole range the mode's frequency can take.

Propellant slosh modes get their own allocation. Aircraft flight control systems follow the standards in the MIL-F-9490 and MIL-DTL-9490 family. Their margin tables are commonly quoted as 6 dB and 45 degrees over the main frequency band, relaxed at the frequency extremes and tightened for some flight phases.

The word doing the work is **across**. A margin belongs to a linear model at one flight condition with one set of parameters. A real vehicle has neither. So the verification product is a sweep, not a number: margins at every point of the nominal trajectory, then repeated over a **[[Monte Carlo dispersion|dispersion]]** of mass, inertia, center of gravity, aerodynamic coefficients, modal frequencies, modal damping and actuator characteristics. The requirement must hold on the *worst* case.

::: example Sweeping the booster's margins along the trajectory
Take the launch vehicle with its proportional-derivative attitude loop, $K_p = 1.88$, $K_d = 1.59$, and a second-order gimbal actuator at $4\,\mathrm{Hz}$ with $\zeta = 0.7$. This is the design from the atmospheric flight module, sized at maximum dynamic pressure.

Hold the gains fixed and test the loop at points along the trajectory. There $\mu_\alpha$ (the aerodynamic instability) follows dynamic pressure, and $\mu_\delta = T\ell_T/I$ (engine thrust times its lever arm, over the moment of inertia) grows as propellant burns off:

| $t$ (s) | $\mu_\alpha$ | $\mu_\delta$ | $\omega_{gc}$ (rad/s) | PM (deg) | GM up (dB) | GM down (dB) | disk margin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | 0.038 | 1.317 | 2.33 | 55.6 | 23.9 | 36.3 | $\pm 9.55\,\mathrm{dB}$, $\pm 53.2^\circ$ |
| 45 | 0.150 | 1.400 | 2.42 | 56.2 | 23.4 | 24.9 | $\pm 9.65\,\mathrm{dB}$, $\pm 53.5^\circ$ |
| 60 | 0.228 | 1.317 | 2.26 | 55.2 | 23.9 | 20.7 | $\pm 9.30\,\mathrm{dB}$, $\pm 52.2^\circ$ |
| 100 | 0.059 | 1.976 | 3.32 | 59.7 | 20.4 | 36.0 | $\pm 11.00\,\mathrm{dB}$, $\pm 58.5^\circ$ |
| 130 | 0.010 | 2.500 | 4.13 | 60.7 | 18.4 | 53.4 | $\pm 11.63\,\mathrm{dB}$, $\pm 60.6^\circ$ |

"GM up" is how much the gain can rise before instability; "GM down" is how much it can fall. Every row passes the $6\,\mathrm{dB}$ and $30^\circ$ requirement. Still, the sweep shows three things one test would not.

**1. The worst cases line up.** The low-gain margin is smallest at maximum dynamic pressure, $20.7\,\mathrm{dB}$ — exactly where the air loads are largest. Two worst cases at once is why that point dominates launch vehicle design.

**2. The crossover moves.** The crossover frequency nearly doubles between maximum dynamic pressure and late in the burn, from $2.26$ to $4.13\,\mathrm{rad/s}$, because $\mu_\delta$ rises as the inertia falls. So the control bandwidth creeps toward any bending mode fixed in frequency. The gain-stabilization argument that held at $60\,\mathrm{s}$ must be rechecked at $130\,\mathrm{s}$.

**3. The honest number is steady.** The disk margin varies only from $\pm 9.3$ to $\pm 11.6\,\mathrm{dB}$, even though the classical low-gain margin moves by more than $30\,\mathrm{dB}$ ($20.7$ to $53.4$). That steadiness is the reassuring part.

**Then dispersions multiply the table.** A $\pm 20\,\%$ uncertainty on the normal-force slope $C_{N\alpha}$ and a $\pm 10\,\%$ uncertainty on inertia move $\mu_\alpha$ by roughly $\pm 30\,\%$ (since $1.2/0.9 = 1.33$ and $0.8/1.1 = 0.73$). So the $60\,\mathrm{s}$ row must be shown with $\mu_\alpha$ up to about $0.228 \times 1.33 \approx 0.30$, and the requirement applies to the worst of a few thousand such cases.
:::

::: warning A margin is not demonstrated until it is demonstrated at the worst case
Nominal margins plus a line saying "dispersions were assessed" is the most common way a real weakness survives a review. What closes the requirement is the margin for every dispersed case, with the minimum over cases plotted against trajectory time next to the requirement line. If the analysis is expensive, cut the number of frequencies or the model order — not the number of cases.
:::

## Discrete time: what the flight computer does to your margins

The controller in the report is continuous. The one that flies is a program running at a fixed rate $f_s = 1/T$, where $T$ is the sample period. It reads sensors through anti-alias filters and writes commands through a **zero-order hold**, which holds each command until the next. Three effects follow, each costing phase or breaking the model.

**Zero-order hold.** Holding a command constant for one sample period acts, over the control bandwidth, very nearly like a pure delay of **[[half a sample|zoh-half-sample]]**, $T/2$, plus a mild change in gain.

**Computation delay.** The command computed from the sample at time $kT$ is usually applied at $(k+1)T$. That adds a further full sample of delay. Sensor filtering and bus latency add more.

So the total effective delay is $\tau_{\mathrm{eff}} \approx T/2 + T_{\mathrm{comp}}$. A delay $\tau$ shifts the phase at frequency $\omega$ by $\omega\tau$ radians without changing the gain, so the phase it costs at crossover is $\omega_{gc}\tau_{\mathrm{eff}}$ radians. Compare that with the **delay margin**, $\mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$ — the largest pure delay the loop can absorb before its phase margin is used up.

**Aliasing.** Think of a movie of a spinning wagon wheel that seems to turn slowly backward: the camera samples too slowly, so a fast motion masquerades as a slow one. Any signal above the **Nyquist frequency** $f_s/2$ does the same: it folds down. A structural mode at $f_m$ shows up in the sampled data at $\lvert f_m - nf_s\rvert$ for the nearest whole number $n$. The flight computer cannot tell the real mode from its alias. No digital filter can undo this. It must be prevented by an analog anti-alias filter *before* the converter — and that filter's own phase lag then joins the loop.

::: example What a 50 Hz flight computer costs the booster
**The budget.** At maximum dynamic pressure the loop crosses over at $\omega_{gc} = 2.26\,\mathrm{rad/s}$ with $55.2^\circ$ of phase margin. In radians that is $55.2 \times \pi/180 = 0.964$. So the delay margin is

$$\frac{\mathrm{PM}_{\mathrm{rad}}}{\omega_{gc}} = \frac{0.964}{2.26} = 0.426\,\mathrm{s} = 426\,\mathrm{ms},$$

a generous budget.

**The cost.** At $f_s = 50\,\mathrm{Hz}$, $T = 20\,\mathrm{ms}$. With one sample of computation delay, $\tau_{\mathrm{eff}} = 10 + 20 = 30\,\mathrm{ms}$, about seven percent of the budget. The phase lost at crossover is $2.26\times 0.030 = 0.068\,\mathrm{rad} = 3.89^\circ$. The phase margin falls from $55.2^\circ$ to $51.3^\circ$, and the disk margin's phase range from $\pm 52.2^\circ$ to $\pm 49.5^\circ$.

**Other rates.** Halve the rate to $25\,\mathrm{Hz}$ and the delay doubles to $60\,\mathrm{ms}$, taking the phase margin to $47.4^\circ$. Double it to $100\,\mathrm{Hz}$ and the cost is only $1.94^\circ$. For a loop this slow, sample rate is not a driver, and now that is a number. The same $30\,\mathrm{ms}$ on a loop crossing over at $20\,\mathrm{rad/s}$ would cost $20 \times 0.030 = 0.6\,\mathrm{rad} = 34^\circ$ and would dominate the design.

**Aliasing.** Suppose the first bending mode is at $30\,\mathrm{Hz}$ and the sample rate is $50\,\mathrm{Hz}$, so Nyquist is $25\,\mathrm{Hz}$. The mode **[[folds to|aliasing-picture]]** $\lvert 30 - 50\rvert = 20\,\mathrm{Hz}$ in the sampled data. That is inside the band, indistinguishable from a real $20\,\mathrm{Hz}$ mode, and out of reach of any software notch placed at $30\,\mathrm{Hz}$. Worse cases exist: a mode at $45\,\mathrm{Hz}$ folds to $\lvert 45 - 50\rvert = 5\,\mathrm{Hz}$, close enough to interact with the attitude loop directly.

**The defense.** A second-order analog anti-alias filter at $10\,\mathrm{Hz}$ with $\zeta = 0.707$ cuts the $30\,\mathrm{Hz}$ content to $0.110$ of its size, that is $-19.1\,\mathrm{dB}$, before the converter sees it. It costs only $2.92^\circ$ of phase at the crossover, which is $2.26/(2\pi) = 0.36\,\mathrm{Hz}$. That is the trade in one sentence: at these bandwidths, analog filtering ahead of the converter is cheap in phase, and it is the only defense against folding.
:::

### Discrete-time mu analysis

Once the loop is sampled, robustness analysis belongs on the discrete-time model. Discretize the plant with a zero-order hold at the flight computer's rate. Include the computation delay as one extra factor of $z^{-1}$ (a pole at the origin of the $z$-plane). Assemble the closed loop. Then evaluate $\mu$ **on the [[unit circle|unit-circle]]** instead of the imaginary axis:

$$\sup_{\theta\in[0,\pi]}\ \mu_{\boldsymbol{\Delta}}\big(\mathbf{M}(e^{j\theta})\big) < 1, \qquad \theta = \omega T .$$

Here $\sup$ ("supremum") means the largest value over the range. Three things change from continuous time.

- **The frequency axis is finite.** $\theta$ from $0$ to $\pi$ covers $\omega$ from zero up to the Nyquist frequency, and nothing beyond. That makes the sweep cheaper, but the model has no representation of dynamics above Nyquist — it is blind to exactly the modes that alias.
- **The phase budget is different**, because the sampling delay now sits inside the model rather than being approximated as $e^{-j\omega\tau}$.
- **The uncertainty blocks are discrete.** A real parameter uncertainty is still a real block, but a continuous-time dynamic uncertainty must be re-expressed for the sampled loop.

The honest caveat: a discrete analysis certifies the loop **at the sample instants only**. The ripple between samples, which a hold-driven plant really has, is invisible to it, and it matters for a loop with significant content near Nyquist. The rigorous treatment "lifts" the sampled-data system into an equivalent discrete-time system with an infinite-dimensional input space and computes a sampled-data $\mu$ or induced norm. In practice, programs sample fast enough that intersample behavior is negligible, and prove it by simulating the nonlinear model with a much finer time step than the control rate.

::: warning A digital notch cannot catch an aliased mode
Notch filters, structural filters and sensor blending all live in software, after the converter. By then the folded mode sits at the wrong frequency and looks like a genuine signal. Every flexible mode with meaningful sensor response above Nyquist must be attenuated in analog hardware. Knowing which modes those are means trusting the structural model up to at least twice the sample rate — uncomfortable, since models are least accurate where modes crowd together.
:::

## Handling qualities

When a pilot is in the loop, stability is necessary but nowhere near enough. Think of a car whose steering is perfectly stable but responds half a second late: you would weave all over the road. A vehicle can have excellent margins and still be unflyable if the response to the stick is sluggish, abrupt, or delayed enough to provoke an oscillation the pilot keeps going without meaning to — a **[[pilot-induced oscillation|pio]]**.

The subjective anchor is the **[[Cooper-Harper rating scale|cooper-harper-history]]**, a decision tree that a test pilot walks through to give a rating from 1 (excellent) to 10 (control lost during some part of the task).

- Ratings 1 to 3 are **Level 1**: adequate performance without excessive workload.
- Ratings 4 to 6 are **Level 2**: adequate performance, but only with considerable pilot compensation.
- Ratings 7 to 9 are **Level 3**: controllable, but performance is inadequate.

The military standard **[[MIL-STD-1797|mil-std-1797]]** turns those levels into number boundaries on the closed-loop dynamics, by flight phase category. **Category A** is rapid maneuvering such as air combat or terrain following. **B** is gradual maneuvering such as cruise. **C** is terminal flight phases such as approach and landing.

The best known boundary uses the **control anticipation parameter**,

$$\mathrm{CAP} = \frac{\omega_{n,sp}^2}{n/\alpha}.$$

Here $\omega_{n,sp}$ is the natural frequency of the **short-period mode** — the quick pitch bobbing an airplane does after a stick input — and $n/\alpha$ is the **load-factor sensitivity**: how many $g$ of normal acceleration you get per radian of angle of attack. CAP is the initial pitch acceleration the pilot gets per unit of final steady normal acceleration. It measures how well the immediate response *anticipates* the final one.

For Category A, Level 1 needs roughly $0.28 \le \mathrm{CAP} \le 3.6$, with short-period damping ratio between about $0.35$ and $1.30$. The boundaries move with flight phase category, and the exact tables are the standard's business.

Fly-by-wire control laws are far more complex than the simple airframe those criteria assumed, so two more appear constantly. The **bandwidth and phase-delay** criterion plots the frequency where the attitude-to-stick response reaches a set phase margin against the high-frequency phase delay. It catches a complex control law with perfect short-period numbers but enough delay to provoke pilot-induced oscillation. **Gibson's dropback** asks how far the attitude falls back after a pulse input, which separates crisp from sluggish the way pilots do.

::: example Reading the control anticipation parameter
Three aircraft, all in a Category A flight phase, all [[placed on one scale|cap-scale]].

**A fighter.** $\omega_{n,sp} = 4\,\mathrm{rad/s}$ and $n/\alpha = 20\,g/\mathrm{rad}$. Then $\mathrm{CAP} = 4^2/20 = 16/20 = 0.800$. That is comfortably inside the Level 1 band of roughly $0.28$ to $3.6$.

**A large transport** in the same flight phase. $\omega_{n,sp} = 2\,\mathrm{rad/s}$ and $n/\alpha = 30\,g/\mathrm{rad}$. Then $\mathrm{CAP} = 4/30 = 0.133$. That is below the Level 1 boundary and the Level 2 boundary too. The pitch response is sluggish compared with the load factor it finally produces. The pilot commands a pitch change, feels almost nothing at first, pulls harder, and then gets more $g$ than intended. That is the classic recipe for over-control. The fix is in the control law — raise the effective short-period frequency with pitch-rate feedback — not in the pilot's technique.

**A highly augmented fighter.** $\omega_{n,sp} = 6\,\mathrm{rad/s}$ and $n/\alpha = 12\,g/\mathrm{rad}$. Then $\mathrm{CAP} = 36/12 = 3.000$, close to the upper Level 1 boundary. Much more and it becomes abrupt: a small stick input gives a sharp initial pitch acceleration. Pilots call that twitchy, and with any real phase delay it invites pilot-induced oscillation. Both boundaries are real, and a control law that maximizes bandwidth walks into the upper one.
:::

Uncrewed vehicles have no Cooper-Harper rating, but the idea returns. A launch vehicle's equivalents are the load indicator $\bar{q}\alpha$ (dynamic pressure times angle of attack), the drift and drift rate at staging, and the pointing stability delivered to the payload. A crewed spacecraft docking by hand is judged with criteria adapted from aircraft standards, because a pilot again closes the loop with a stick, a display and a delay.

## Check yourself

::: check
A launch vehicle's first bending mode is gain-stabilized with $8\,\mathrm{dB}$ of attenuation at the nominal modal frequency. The modal frequency is uncertain by $\pm 12\,\%$. What must be demonstrated?
:::

::: answer
That the attenuation requirement holds over the whole range the mode can occupy, not only at the nominal frequency. A notch filter placed at the nominal frequency attenuates most there and much less at the edges of the band. So the demonstration is a plot of loop gain against frequency with the modal peak swept across $\pm 12\,\%$, and the requirement checked at the worst point — usually one of the edges.

Two more items belong in the same analysis. Modal damping: lower damping than assumed raises the peak and eats the attenuation directly. And the notch's phase: a notch wide enough to cover $\pm 12\,\%$ costs phase at the rigid-body crossover, so the phase margin must be rechecked with it in place. This is why modal frequency and damping uncertainties are the most expensive numbers in a launch vehicle control analysis.
:::

::: check
A loop crosses over at $12\,\mathrm{rad/s}$ with $45^\circ$ of phase margin. The flight computer runs at $200\,\mathrm{Hz}$ with one sample of computation delay. How much of the phase margin does the digital implementation consume?
:::

::: answer
$T = 1/200 = 5\,\mathrm{ms}$, so $\tau_{\mathrm{eff}} = T/2 + T = 2.5 + 5 = 7.5\,\mathrm{ms}$. The phase lost at crossover is $\omega_{gc}\tau_{\mathrm{eff}} = 12\times 0.0075 = 0.090\,\mathrm{rad} = 5.16^\circ$. The phase margin drops from $45^\circ$ to about $39.8^\circ$.

Equivalently, the delay margin is $\mathrm{PM}_{\mathrm{rad}}/\omega_{gc} = 0.785/12 = 65.4\,\mathrm{ms}$, and the implementation uses $7.5/65.4 = 11.5\,\%$ of it. That is acceptable but not negligible. It leaves $58\,\mathrm{ms}$ for everything else — sensor filtering, bus latency, actuator transport lag — which on a real vehicle is not a large budget.

The ratio that matters is $\omega_{gc}T$. Below about $0.05$ the digital implementation is a detail. Above about $0.2$ it is a design driver.
:::

::: check
Why does a discrete-time $\mu$ analysis evaluated on the unit circle miss an aliasing problem entirely?
:::

::: answer
The discrete model is built from samples, and its frequency axis $\theta = \omega T$ runs only from $0$ to $\pi$ — from zero frequency to Nyquist. A mode above Nyquist has no place in that model. Discretizing a plant that includes it folds it silently to its aliased frequency. Either way the analysis sees the mode at the wrong frequency, or not at all, and reports a $\mu$ peak unrelated to the physical resonance.

The defense lies outside the analysis. Know from the structural model which modes have sensor response above Nyquist, attenuate them in analog hardware before the converter, and document the attenuation. Only then is the discrete model an honest picture of what the flight computer sees.
:::

::: check
An aircraft has $\omega_{n,sp} = 3\,\mathrm{rad/s}$, $\zeta_{sp} = 0.5$ and $n/\alpha = 45\,g/\mathrm{rad}$ in a Category A flight phase. Assess it.
:::

::: answer
$\mathrm{CAP} = 3^2/45 = 9/45 = 0.200$. That is below the Level 1 lower boundary of about $0.28$ but inside the Level 2 band. So the short-period response is adequate only with considerable pilot compensation, not satisfactory.

The damping of $0.5$ is inside the Level 1 range of $0.35$ to $1.30$, so damping is not the problem. The problem is a modest natural frequency combined with a large load-factor sensitivity — typical of a heavy aircraft at high dynamic pressure.

The control-law fix is pitch-rate feedback to raise the effective $\omega_{n,sp}$. Raising it to $3.55\,\mathrm{rad/s}$ gives $\mathrm{CAP} = 3.55^2/45 = 0.280$, right on the boundary; $4\,\mathrm{rad/s}$ gives $16/45 = 0.356$, with some margin. Whether that is achievable depends on actuator bandwidth and on the structural modes the higher bandwidth would approach — the same trade this whole module has been about.
:::

::: check
A program has an excellent $\mu$ analysis, a full disk-margin sweep and a large Monte Carlo campaign, all on the linear model. What is still missing?
:::

::: answer
The nonlinear evidence. Every technique in this module is linear, and the effects that most often bite in flight are not:

- actuator position and rate limits, which give a linear loop a huge effective phase lag and can produce a sustained limit cycle;
- thruster minimum impulse and dead bands;
- propellant slosh, whose effective mass and frequency depend on fill level and acceleration;
- structural modes whose frequencies move with tank level and temperature;
- sensor quantization.

The complete package is the linear analysis for margins and robustness, a describing-function or limit-cycle analysis for the rate-limited and on-off nonlinearities, and a Monte Carlo campaign on the nonlinear six-degree-of-freedom simulation with the flight software in the loop at its true rate. The linear analysis says where to look. The nonlinear simulation says what happens.
:::

## Summary

| Item | Statement |
| --- | --- |
| Launch vehicle rigid body | typically $6\,\mathrm{dB}$ gain margin (both sides if unstable) and $30^\circ$ phase margin |
| Flexible modes | gain-stabilized: attenuate by $6$ to $12\,\mathrm{dB}$ across the uncertain frequency range; phase-stabilized: hold about $60^\circ$ from instability |
| Aircraft | MIL-F-9490 / MIL-DTL-9490 family, commonly quoted as $6\,\mathrm{dB}$ and $45^\circ$ over the main band |
| Across the envelope | margins swept over the trajectory and over a dispersion campaign; the requirement is on the worst case |
| Booster sweep | worst low-gain margin $20.7\,\mathrm{dB}$ at maximum dynamic pressure; crossover $2.26$ to $4.13\,\mathrm{rad/s}$; disk margin $\pm 9.3$ to $\pm 11.6\,\mathrm{dB}$ |
| Digital delay | $\tau_{\mathrm{eff}} \approx T/2 + T_{\mathrm{comp}}$; phase loss $\omega_{gc}\tau_{\mathrm{eff}}$; compare with delay margin $\mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$ |
| Worked digital case | $50\,\mathrm{Hz}$ plus one sample gives $30\,\mathrm{ms}$, $3.89^\circ$ at $2.26\,\mathrm{rad/s}$: PM $55.2^\circ \to 51.3^\circ$ |
| Aliasing | $f_m$ folds to $\lvert f_m - nf_s\rvert$; $30\,\mathrm{Hz}$ at $f_s = 50\,\mathrm{Hz}$ appears at $20\,\mathrm{Hz}$; only analog filtering prevents it |
| Discrete mu | evaluate $\mu(\mathbf{M}(e^{j\theta}))$ for $\theta\in[0,\pi]$; certifies sample instants only; lifting gives the sampled-data answer |
| Cooper-Harper | $1$–$10$; Level 1 is $1$–$3$, Level 2 is $4$–$6$, Level 3 is $7$–$9$ |
| Control anticipation | $\mathrm{CAP} = \omega_{n,sp}^2/(n/\alpha)$; Category A Level 1 roughly $0.28$ to $3.6$, with $0.35 \le \zeta_{sp} \le 1.30$ |
| Worked CAP | $(4, 20) \to 0.800$ Level 1; $(2, 30) \to 0.133$ below Level 2; $(6, 12) \to 3.000$ near the abrupt boundary |
| Other criteria | bandwidth and phase delay for complex control laws and pilot-induced oscillation; Gibson dropback |

That closes the module: from an uncertainty set built out of hardware tolerances, through the tests and designs that act on it, to the evidence a flight readiness review consumes. The nonlinear control module takes up what remains — the effects none of this linear machinery can see.

::: context frr The meeting before launch
A **flight readiness review** is the formal meeting where each engineering team presents its evidence that the vehicle is ready, and senior managers decide whether to proceed. For guidance and control, that evidence is exactly this lesson's package: margin plots against requirement lines, dispersion results, discrete-time analysis and simulation campaigns. Open items are listed and must be closed, or formally accepted as risks, before launch.
:::

::: context gain-phase-stabilized Two ways to live with a bending mode
Picture a guitar string near a loudspeaker. You can turn the volume down at the string's note so it can never howl, whatever the timing — that is **gain stabilization**. Or you can arrange the timing so each push arrives when it *damps* the string rather than drives it — that is **phase stabilization**. The first is robust to phase errors but needs frequency separation. The second allows higher bandwidth but depends on knowing the mode's shape and the sensor's location well, because a sensor on the wrong side of a node flips the sign.
:::

::: context dispersion What a dispersion campaign is
Each uncertain input — mass, center of gravity, aerodynamic coefficients, winds, modal frequencies — gets a range or probability distribution. A computer draws a random value for every one of them, runs the analysis or simulation, and records the result. Repeat a few thousand times. The name "Monte Carlo" comes from the casino, because the method runs on random draws. The output is not one margin but a cloud of them, and the requirement is judged on the edge of the cloud.
:::

::: context zoh-half-sample Why a hold looks like half a sample of delay
The gray curve is a smooth command. The blue staircase is what a zero-order hold sends out, updated ten times per cycle. The red dashed curve is the smooth command shifted right by half a sample. It runs through the middle of every step: on average, the staircase lags by $T/2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="345" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="30.0,90.0 37.8,79.7 45.6,69.8 53.4,60.5 61.2,52.3 69.0,45.5 76.8,40.2 84.6,36.7 92.4,35.1 100.2,35.4 108.0,37.7 115.8,41.8 123.6,47.6 131.4,54.9 139.2,63.5 147.0,73.0 154.8,83.1 162.6,93.5 170.4,103.7 178.2,113.4 186.0,122.3 193.8,130.1 201.6,136.4 209.4,141.1 217.2,144.0 225.0,145.0 232.8,144.0 240.6,141.1 248.4,136.4 256.2,130.1 264.0,122.3 271.8,113.4 279.6,103.7 287.4,93.5 295.2,83.1 303.0,73.0 310.8,63.5 318.6,54.9 326.4,47.6 334.2,41.8 342.0,37.7"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="30.0,90.0 56.0,90.0 56.0,57.7 82.0,57.7 82.0,37.7 134.0,37.7 134.0,57.7 160.0,57.7 160.0,90.0 186.0,90.0 186.0,122.3 212.0,122.3 212.0,142.3 264.0,142.3 264.0,122.3 290.0,122.3 290.0,90.0 316.0,90.0 316.0,57.7 342.0,57.7"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3" points="43.0,90.0 50.8,79.7 58.6,69.8 66.4,60.5 74.2,52.3 82.0,45.5 89.8,40.2 97.6,36.7 105.4,35.1 113.2,35.4 121.0,37.7 128.8,41.8 136.6,47.6 144.4,54.9 152.2,63.5 160.0,73.0 167.8,83.1 175.6,93.5 183.4,103.7 191.2,113.4 199.0,122.3 206.8,130.1 214.6,136.4 222.4,141.1 230.2,144.0 238.0,145.0 245.8,144.0 253.6,141.1 261.4,136.4 269.2,130.1 277.0,122.3 284.8,113.4 292.6,103.7 300.4,93.5 308.2,83.1 316.0,73.0 323.8,63.5 331.6,54.9 339.4,47.6"/>
  <text x="30" y="170" font-size="11" fill="#1d6fd1">held output</text>
  <text x="120" y="170" font-size="11" fill="#6c7a93">command</text>
  <text x="200" y="170" font-size="11" fill="#b4232c">command delayed T/2</text>
</svg>
```
:::

::: context aliasing-picture A 30 Hz wave wearing a 20 Hz disguise
The gray curve is a $30\,\mathrm{Hz}$ vibration over one tenth of a second. The dots are the samples a $50\,\mathrm{Hz}$ computer takes. The dashed blue curve is a $20\,\mathrm{Hz}$ wave, and it passes through every dot. From the samples alone, the two are identical.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="345" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" points="20.0,100.0 24.3,85.1 28.5,71.1 32.8,58.9 37.1,49.3 41.3,42.9 45.6,40.1 49.9,41.1 54.1,45.7 58.4,53.8 62.7,64.7 66.9,77.9 71.2,92.5 75.5,107.5 79.7,122.1 84.0,135.3 88.3,146.2 92.5,154.3 96.8,158.9 101.1,159.9 105.3,157.1 109.6,150.7 113.9,141.1 118.1,128.9 122.4,114.9 126.7,100.0 130.9,85.1 135.2,71.1 139.5,58.9 143.7,49.3 148.0,42.9 152.3,40.1 156.5,41.1 160.8,45.7 165.1,53.8 169.3,64.7 173.6,77.9 177.9,92.5 182.1,107.5 186.4,122.1 190.7,135.3 194.9,146.2 199.2,154.3 203.5,158.9 207.7,159.9 212.0,157.1 216.3,150.7 220.5,141.1 224.8,128.9 229.1,114.9 233.3,100.0 237.6,85.1 241.9,71.1 246.1,58.9 250.4,49.3 254.7,42.9 258.9,40.1 263.2,41.1 267.5,45.7 271.7,53.8 276.0,64.7 280.3,77.9 284.5,92.5 288.8,107.5 293.1,122.1 297.3,135.3 301.6,146.2 305.9,154.3 310.1,158.9 314.4,159.9 318.7,157.1 322.9,150.7 327.2,141.1 331.5,128.9 335.7,114.9 340.0,100.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6,4" points="20.0,100.0 24.3,110.0 28.5,119.7 32.8,128.9 37.1,137.3 41.3,144.6 45.6,150.7 49.9,155.3 54.1,158.4 58.4,159.9 62.7,159.7 66.9,157.8 71.2,154.3 75.5,149.3 79.7,142.9 84.0,135.3 88.3,126.7 92.5,117.3 96.8,107.5 101.1,97.5 105.3,87.5 109.6,77.9 113.9,68.9 118.1,60.8 122.4,53.8 126.7,48.0 130.9,43.8 135.2,41.1 139.5,40.0 143.7,40.6 148.0,42.9 152.3,46.8 156.5,52.2 160.8,58.9 165.1,66.8 169.3,75.6 173.6,85.1 177.9,95.0 182.1,105.0 186.4,114.9 190.7,124.4 194.9,133.2 199.2,141.1 203.5,147.8 207.7,153.2 212.0,157.1 216.3,159.4 220.5,160.0 224.8,158.9 229.1,156.2 233.3,152.0 237.6,146.2 241.9,139.2 246.1,131.1 250.4,122.1 254.7,112.5 258.9,102.5 263.2,92.5 267.5,82.7 271.7,73.3 276.0,64.7 280.3,57.1 284.5,50.7 288.8,45.7 293.1,42.2 297.3,40.3 301.6,40.1 305.9,41.6 310.1,44.7 314.4,49.3 318.7,55.4 322.9,62.7 327.2,71.1 331.5,80.3 335.7,90.0 340.0,100.0"/>
  <g fill="#b4232c">
    <circle cx="20" cy="100" r="5"/><circle cx="84" cy="135.3" r="5"/><circle cx="148" cy="42.9" r="5"/>
    <circle cx="212" cy="157.1" r="5"/><circle cx="276" cy="64.7" r="5"/><circle cx="340" cy="100" r="5"/>
  </g>
  <text x="20" y="190" font-size="11" fill="#1f2a44">0 s</text>
  <text x="340" y="190" font-size="11" fill="#1f2a44" text-anchor="end">0.1 s</text>
  <text x="180" y="190" font-size="11" fill="#b4232c" text-anchor="middle">samples every 20 ms</text>
</svg>
```
:::

::: context unit-circle Why a circle replaces the axis
In continuous time, a frequency $\omega$ lives at the point $s = j\omega$ on the imaginary axis, which runs forever. Sampling maps each $s$ to $z = e^{sT}$. The imaginary axis wraps around the **unit circle**, $z = e^{j\omega T}$: going once around the circle covers $\omega T$ from $-\pi$ to $\pi$, and then it repeats. That repetition *is* aliasing — frequencies that differ by a multiple of $f_s$ land on the same point. So the discrete sweep only needs the top half of the circle, $\theta$ from $0$ to $\pi$.
:::

::: context pio When the pilot becomes part of the problem
A **pilot-induced oscillation** happens when the pilot's corrections arrive out of step with the aircraft's response, so each correction feeds the swing instead of damping it. It is not bad piloting; it is a closed loop with too much phase lag, and the pilot is one of the blocks. Two famous cases: the Space Shuttle *Enterprise* bobbed in pitch moments before touchdown on its last approach-and-landing test in October 1977, and the YF-22 prototype crashed on a runway at Edwards in April 1992 after an oscillation made worse by actuator rate limiting. The pilots walked away from both.
:::

::: context cooper-harper-history Where the scale came from
George Cooper of NASA Ames and Robert Harper of the Cornell Aeronautical Laboratory published the scale in 1969 (NASA Technical Note D-5153). Its trick is the decision tree: before choosing a number, the pilot answers yes-or-no questions — is it controllable? Is adequate performance attainable with tolerable workload? Is it satisfactory without improvement? — which makes ratings from different pilots far more consistent than asking for a score out of ten.
:::

::: context mil-std-1797 The flying-qualities rulebook
**MIL-STD-1797**, *Flying Qualities of Piloted Aircraft*, is the U.S. military standard that replaced the older specification MIL-F-8785C in the 1980s. It is a handbook as much as a rulebook: each requirement comes with the flight-test data and reasoning behind it. The control anticipation parameter it uses was proposed by William Bihrle in the mid-1960s. Civil aircraft are certified under different regulations, but engineers use the same criteria in design because they predict what pilots will say.
:::

::: context cap-scale Three aircraft on the CAP scale
A log scale from $0.1$ to $10$. The dark band is Category A Level 1 ($0.28$ to $3.6$); the light band extends to Level 2 ($0.16$ to $10$).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="60.6" y="50" width="269.4" height="24" fill="#8fb8f0" opacity="0.4"/>
  <rect x="97.1" y="50" width="166.3" height="24" fill="#1d6fd1" opacity="0.5"/>
  <line x1="30" y1="74" x2="330" y2="74" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="74" x2="30" y2="80"/><line x1="180" y1="74" x2="180" y2="80"/><line x1="330" y1="74" x2="330" y2="80"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="94">0.1</text><text x="180" y="94">1</text><text x="330" y="94">10</text>
    <text x="97.1" y="44">0.28</text><text x="263.4" y="44">3.6</text><text x="60.6" y="118">0.16</text>
  </g>
  <g fill="#b4232c">
    <circle cx="48.6" cy="62" r="5"/><circle cx="165.5" cy="62" r="5"/><circle cx="251.6" cy="62" r="5"/>
  </g>
  <g font-size="11" fill="#b4232c" text-anchor="middle">
    <text x="48.6" y="20">transport</text><text x="48.6" y="33">0.133</text>
    <text x="165.5" y="20">fighter</text><text x="165.5" y="33">0.80</text>
    <text x="236" y="112">augmented 3.0</text>
  </g>
</svg>
```

The transport sits left of both bands. The augmented fighter is inside Level 1 but close to its upper edge.
:::
