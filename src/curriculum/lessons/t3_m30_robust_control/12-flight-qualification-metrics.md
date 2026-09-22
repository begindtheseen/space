---
id: l12-flight-qualification-metrics
title: Flight qualification metrics
minutes: 23
covers:
  - 'Flight qualification metrics: stability margin requirements across the envelope, discrete-time mu analysis, handling-qualities criteria'
---

Everything in this module has been analysis. This lesson is about what the analysis has to produce before anyone signs a flight readiness review. Three families of numbers appear in every control system verification package: **stability margins**, demonstrated not at one operating point but across the whole envelope and across the dispersion; a **discrete-time analysis** that accounts for the fact that the controller is a program running at a fixed rate on a computer, with sampling, computation delay and aliasing; and, for any vehicle a human flies, **handling-qualities criteria** that say whether a competent pilot can actually use it.

None of these is a new theory. They are the conventions by which the theories of this module are turned into evidence. They are also where most of the engineering time on a real programme goes, because a margin computed at one flight condition takes an afternoon and a margin demonstrated across a trajectory, across a dispersion campaign and in discrete time takes months.

This lesson works the three families in turn on the launch vehicle and the aircraft cases this curriculum has been building, with the arithmetic carried through, and ends by naming where each requirement comes from.

## Margins across the envelope

The traditional requirement for a launch vehicle's rigid-body attitude loop is **6 dB of gain margin and 30 degrees of phase margin**, with the gain margin required on both sides when the vehicle is aerodynamically unstable — too little gain and the loop cannot overcome the aerodynamic moment, as the atmospheric flight module derived. Flexible modes are handled one of two ways. A **gain-stabilised** mode must be attenuated, typically by at least 6 dB and often 8 or 12 dB for the first mode, so that its peak cannot reach unity loop gain whatever its phase. A **phase-stabilised** mode is allowed appreciable gain but its phase must be held a specified distance — commonly 60 degrees — from the instability condition across the whole range the mode frequency can take. Slosh modes get their own allocation. Aircraft flight control systems are governed by the airframe standards in the MIL-F-9490 and MIL-DTL-9490 lineage, whose margin tables are commonly quoted as 6 dB and 45 degrees over the main frequency band, relaxed at the extremes of frequency and tightened for some flight phases.

The word doing the work in all of this is **across**. A margin is a property of a linear model at one flight condition with one set of parameters, and a vehicle has neither. So the verification artefact is not a number but a sweep: margins computed at every point of the nominal trajectory, then repeated over a Monte Carlo dispersion of mass, inertia, centre of gravity, aerodynamic coefficients, modal frequencies, modal damping and actuator characteristics, with the requirement demonstrated on the worst case rather than the mean.

::: example Sweeping the booster's margins along the trajectory
Take the launch vehicle with its proportional-derivative attitude loop, $K_p = 1.88$, $K_d = 1.59$, and a second-order gimbal actuator at $4\,\mathrm{Hz}$ with $\zeta = 0.7$ — the design of the atmospheric flight module, sized at maximum dynamic pressure. Hold the gains fixed and evaluate the loop at representative trajectory points, where $\mu_\alpha$ follows dynamic pressure and $\mu_\delta = T\ell_T/I$ grows as propellant burns off:

| $t$ (s) | $\mu_\alpha$ | $\mu_\delta$ | $\omega_{gc}$ (rad/s) | PM (deg) | GM up (dB) | GM down (dB) | disk margin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | 0.038 | 1.317 | 2.33 | 55.6 | 23.9 | 36.3 | $\pm 9.55\,\mathrm{dB}$, $\pm 53.2^\circ$ |
| 45 | 0.150 | 1.400 | 2.42 | 56.2 | 23.4 | 24.9 | $\pm 9.65\,\mathrm{dB}$, $\pm 53.5^\circ$ |
| 60 | 0.228 | 1.317 | 2.26 | 55.2 | 23.9 | 20.7 | $\pm 9.30\,\mathrm{dB}$, $\pm 52.2^\circ$ |
| 100 | 0.059 | 1.976 | 3.32 | 59.7 | 20.4 | 36.0 | $\pm 11.00\,\mathrm{dB}$, $\pm 58.5^\circ$ |
| 130 | 0.010 | 2.500 | 4.13 | 60.7 | 18.4 | 53.4 | $\pm 11.63\,\mathrm{dB}$, $\pm 60.6^\circ$ |

Every line passes the $6\,\mathrm{dB}$ and $30^\circ$ requirement, and the sweep still tells you things a single evaluation would not. The **low-gain margin** is worst at maximum dynamic pressure, $20.7\,\mathrm{dB}$, which is exactly where the loads are largest — the two worst cases coincide, which is why that trajectory point dominates a launch vehicle design. The **crossover frequency** almost doubles between maximum dynamic pressure and late in the burn, from $2.26$ to $4.13\,\mathrm{rad/s}$, because $\mu_\delta$ has risen with the falling inertia; so any flexible mode fixed in frequency is being approached by the control bandwidth as the flight proceeds, and the gain-stabilisation argument that held at $60\,\mathrm{s}$ must be rechecked at $130\,\mathrm{s}$. The **disk margin** varies only from $\pm 9.3$ to $\pm 11.6\,\mathrm{dB}$, which is the reassuring part: the honest combined number is stable across the flight even though the classical numbers move by more than $30\,\mathrm{dB}$ of low-gain margin.

Dispersion then multiplies this table. A $\pm 20\,\%$ uncertainty on $C_{N\alpha}$ and a $\pm 10\,\%$ uncertainty on inertia move $\mu_\alpha$ by roughly $\pm 30\,\%$, so the $60\,\mathrm{s}$ line has to be demonstrated with $\mu_\alpha$ up to about $0.30$, and the requirement is on the worst of a few thousand such cases.
:::

::: warning A margin is not demonstrated until it is demonstrated at the worst case
Reporting nominal-trajectory margins and a statement that "dispersions were assessed" is the commonest way a real deficiency survives a review. The artefact that closes the requirement is the margin computed for every dispersed case, with the minimum over cases plotted against trajectory time and compared to the requirement line. If the analysis is expensive, reduce the number of frequencies or the model order, not the number of cases.
:::

## Discrete time: what the flight computer does to your margins

The controller in the report is continuous. The controller that flies is a program executing at a fixed rate $f_s = 1/T$, reading sensors through anti-alias filters and writing actuator commands through a zero-order hold. Three effects follow, all of which cost phase or invalidate the model.

**Zero-order hold.** Holding a command constant for a sample period is, to a good approximation over the control bandwidth, a pure delay of half a sample, $T/2$, in addition to a mild gain shaping.

**Computation delay.** The command computed from the sample at time $kT$ is usually applied at $(k+1)T$, adding a further full sample of delay. Sensor filtering and data bus latency add more.

The total effective transport delay is therefore $\tau_{\mathrm{eff}} \approx T/2 + T_{\mathrm{comp}}$, and the phase it costs at crossover is $\omega_{gc}\tau_{\mathrm{eff}}$ radians. Compare that against the delay margin, $\mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$.

**Aliasing.** Any content above the Nyquist frequency $f_s/2$ folds down. A structural mode at $f_m$ appears in the sampled data at $\lvert f_m - nf_s\rvert$ for the nearest integer $n$, and the flight computer cannot tell the difference between the real mode and its alias. No digital filter can undo this; it must be prevented by an analogue anti-alias filter before the converter, and that filter's own phase lag then appears in the loop.

::: example What a 50 Hz flight computer costs the booster
At maximum dynamic pressure the loop crosses over at $\omega_{gc} = 2.26\,\mathrm{rad/s}$ with a phase margin of $55.2^\circ$, so the delay margin is $\mathrm{PM}_{\mathrm{rad}}/\omega_{gc} = 0.964/2.26 = 426\,\mathrm{ms}$ — a generous budget.

With $f_s = 50\,\mathrm{Hz}$ and one sample of computation delay, $\tau_{\mathrm{eff}} = 10 + 20 = 30\,\mathrm{ms}$, or seven percent of that budget. The phase loss at crossover is $2.26\times 0.030 = 0.068\,\mathrm{rad} = 3.89^\circ$: the phase margin falls from $55.2^\circ$ to $51.3^\circ$ and the disk margin's phase range from $\pm 52.2^\circ$ to $\pm 49.5^\circ$. Halving the rate to $25\,\mathrm{Hz}$ doubles the delay to $60\,\mathrm{ms}$ and takes the phase margin to $47.4^\circ$; doubling it to $100\,\mathrm{Hz}$ costs only $1.94^\circ$. For a loop this slow the sample rate is not a driver, and the analysis says so quantitatively rather than by assertion. The same $30\,\mathrm{ms}$ on a loop crossing over at $20\,\mathrm{rad/s}$ would cost $34^\circ$ and would be the dominant term in the design.

Now the aliasing. Suppose the first bending mode is at $30\,\mathrm{Hz}$ and the sample rate is $50\,\mathrm{Hz}$, so the Nyquist frequency is $25\,\mathrm{Hz}$. The mode folds to $\lvert 30 - 50\rvert = 20\,\mathrm{Hz}$ in the sampled data — inside the band, indistinguishable from a real $20\,\mathrm{Hz}$ mode, and outside the reach of any notch the software might apply at $30\,\mathrm{Hz}$. Worse cases exist: a mode at $45\,\mathrm{Hz}$ folds to $5\,\mathrm{Hz}$, close enough to the control band to interact with the attitude loop directly.

A second-order analogue anti-alias filter at $10\,\mathrm{Hz}$ with $\zeta = 0.707$ attenuates the $30\,\mathrm{Hz}$ content to $0.110$, that is $-19.1\,\mathrm{dB}$, before the converter sees it, and costs only $2.92^\circ$ of phase at the $0.36\,\mathrm{Hz}$ crossover. That is the trade in one sentence: analogue filtering upstream of the converter is cheap in phase at these bandwidths and is the only defence against folding.
:::

### Discrete-time mu analysis

Once the loop is sampled, the right place to do robustness analysis is the discrete-time model. Discretise the plant with a zero-order hold at the flight computer's rate, include the computation delay as a unit advance in the denominator, assemble the closed loop, and then evaluate $\mu$ **on the unit circle** rather than on the imaginary axis:

$$\sup_{\theta\in[0,\pi]}\ \mu_{\boldsymbol{\Delta}}\big(\mathbf{M}(e^{j\theta})\big) < 1, \qquad \theta = \omega T .$$

Three things change relative to the continuous analysis. The frequency axis is now **finite**: $\theta$ from $0$ to $\pi$ covers $\omega$ from $0$ to the Nyquist frequency, and there is nothing beyond it, which makes the sweep cheaper but also means the model has no representation at all of dynamics above Nyquist — the analysis is blind to precisely the modes that alias. The **phase budget is different**, because the sampling delay is already inside the model rather than approximated as $e^{-j\omega\tau}$. And the **uncertainty blocks are discrete**: a parameter uncertainty that was a real block in continuous time is still a real block, but a continuous-time dynamic uncertainty must be re-expressed for the sampled loop.

The honest caveat is that a discrete analysis certifies the loop **at the sample instants only**. Intersample behaviour — the ripple between samples, which a hold-driven plant genuinely has — is invisible to it, and for a loop with significant content near Nyquist that ripple matters. The rigorous treatment lifts the sampled-data system into an equivalent discrete-time system with an infinite-dimensional input space and computes a sampled-data $\mu$ or induced norm. In practice programmes sample fast enough that intersample behaviour is negligible, and demonstrate that by simulating the nonlinear model at a much finer step than the control rate.

::: warning A digital notch cannot catch an aliased mode
Notch filters, structural filters and sensor blending all live in the software, downstream of the converter. By then the folded mode is at the wrong frequency and cannot be distinguished from a genuine signal there. Every flexible mode with meaningful sensor response above the Nyquist frequency must be attenuated in analogue hardware, and the finite-element model must be trusted to at least twice the sample rate to know which modes those are — an uncomfortable requirement, since model fidelity is worst exactly where the modes are dense.
:::

## Handling qualities

Where a pilot is in the loop, stability is necessary and nowhere near sufficient. A vehicle can be perfectly stable with excellent margins and still be unflyable, because the response a pilot gets for a stick input is sluggish, abrupt, or delayed enough to provoke an oscillation the pilot themselves sustains.

The subjective anchor is the **Cooper-Harper rating scale**, a decision tree that a test pilot follows to produce a rating from 1 (excellent) to 10 (loss of control in some portion of the required operation). Ratings 1 to 3 are **Level 1**, adequate performance without excessive workload; 4 to 6 are **Level 2**, adequate performance but with considerable pilot compensation; 7 to 9 are **Level 3**, controllable but inadequate. The military standard MIL-STD-1797 turns those levels into quantitative boundaries on the closed-loop dynamics, by flight phase category — Category A for rapid manoeuvring such as air combat or terrain following, B for gradual manoeuvring such as cruise, C for terminal flight phases such as approach and landing.

The best known of those boundaries is the **control anticipation parameter**,

$$\mathrm{CAP} = \frac{\omega_{n,sp}^2}{n/\alpha},$$

the ratio of the short-period natural frequency squared to the load-factor sensitivity $n/\alpha$ in $g$ per radian. Its meaning is the initial pitch acceleration a pilot gets per unit of eventual steady normal acceleration — how well the immediate response *anticipates* the final one. For Category A flight phases, Level 1 requires roughly $0.28 \le \mathrm{CAP} \le 3.6$, with the short-period damping ratio between about $0.35$ and $1.30$; the boundaries move with flight phase category, and the exact tables are the standard's business.

Two other criteria appear constantly in modern work, both because fly-by-wire control laws have far higher order than the two-degree-of-freedom airframe the original criteria assumed. The **bandwidth and phase-delay** criterion plots the frequency at which the attitude-to-stick response reaches a specified phase margin against the phase delay at high frequency; its boundaries catch what the short-period parameters miss, that a high-order control law with large effective delay can have perfect short-period dynamics and still provoke pilot-induced oscillation. **Gibson's dropback** looks at the attitude response after a pulse input and asks how far the attitude falls back, which separates crisp from sluggish in a way pilots agree with.

::: example Reading the control anticipation parameter
Three aircraft, all in a Category A flight phase.

A fighter with short-period frequency $\omega_{n,sp} = 4\,\mathrm{rad/s}$ and $n/\alpha = 20\,g/\mathrm{rad}$ gives $\mathrm{CAP} = 16/20 = 0.800$. Comfortably inside the Level 1 band of roughly $0.28$ to $3.6$, and if the damping is between $0.35$ and $1.30$ the short-period criteria are satisfied.

A large transport at the same flight phase with $\omega_{n,sp} = 2\,\mathrm{rad/s}$ and $n/\alpha = 30\,g/\mathrm{rad}$ gives $\mathrm{CAP} = 4/30 = 0.133$. That is below the Level 1 boundary and below the Level 2 boundary as well: the pitch response is sluggish relative to the load factor it eventually produces, so the pilot commands an attitude change, feels almost nothing immediately, pulls harder, and then gets more $g$ than intended. It is the classic recipe for over-control, and the fix is in the control law — raise the effective short-period frequency with pitch-rate feedback — not in the pilot's technique.

A highly augmented fighter with $\omega_{n,sp} = 6\,\mathrm{rad/s}$ and $n/\alpha = 12\,g/\mathrm{rad}$ gives $\mathrm{CAP} = 36/12 = 3.000$, close to the upper Level 1 boundary. Too much more and the aircraft is abrupt: a small stick input produces a sharp initial pitch acceleration, which pilots describe as twitchy and which is a precursor to pilot-induced oscillation when combined with any appreciable phase delay. The upper and lower boundaries are both real, and a control law that maximises bandwidth walks into the upper one.
:::

Uncrewed vehicles have no Cooper-Harper rating, but the idea reappears under other names: a launch vehicle's equivalents are the load indicator $\bar{q}\alpha$, the drift and drift-rate at staging, and the pointing stability delivered to the payload. A crewed spacecraft docking manually is assessed with criteria adapted from the aircraft standards, because a pilot is again closing the loop by hand with a stick, a display and a time delay.

## Check yourself

::: check
A launch vehicle's first bending mode is gain-stabilised with $8\,\mathrm{dB}$ of attenuation at the nominal modal frequency. The modal frequency is uncertain by $\pm 12\,\%$. What must be demonstrated?
:::

::: answer
That the attenuation requirement is met over the whole range the mode can occupy, not at the nominal frequency. A notch filter placed at the nominal frequency has its deepest attenuation there and much less at the edges of the band, so the demonstration is a plot of loop gain against frequency with the modal peak swept across $\pm 12\,\%$, and the requirement checked at the worst point — usually one of the edges. Two further items belong in the same analysis: the modal damping, because a lower damping than assumed raises the peak and eats the attenuation directly, and the notch's phase, because a notch wide enough to cover $\pm 12\,\%$ costs phase at the rigid-body crossover and the phase margin must be rechecked with it in place. This is the practical reason modal frequency and damping uncertainties are the most expensive numbers in a launch vehicle control analysis.
:::

::: check
A loop crosses over at $12\,\mathrm{rad/s}$ with $45^\circ$ of phase margin. The flight computer runs at $200\,\mathrm{Hz}$ with one sample of computation delay. How much of the phase margin does the digital implementation consume?
:::

::: answer
$T = 1/200 = 5\,\mathrm{ms}$, so $\tau_{\mathrm{eff}} = T/2 + T = 2.5 + 5 = 7.5\,\mathrm{ms}$. The phase loss at crossover is $\omega_{gc}\tau_{\mathrm{eff}} = 12\times 0.0075 = 0.090\,\mathrm{rad} = 5.16^\circ$, reducing the phase margin from $45^\circ$ to about $39.8^\circ$. Equivalently the delay margin is $\mathrm{PM}_{\mathrm{rad}}/\omega_{gc} = 0.785/12 = 65.4\,\mathrm{ms}$, of which the implementation uses $11.5\,\%$. That is acceptable but no longer negligible, and it leaves $58\,\mathrm{ms}$ for everything else — sensor filtering, bus latency, actuator transport lag — which on a real vehicle is not a large budget. The lesson is that the ratio that matters is $\omega_{gc}T$: below about $0.05$ the digital implementation is a detail, and above about $0.2$ it is a design driver.
:::

::: check
Why does a discrete-time $\mu$ analysis evaluated on the unit circle miss an aliasing problem entirely?
:::

::: answer
The discrete model is built from samples, and its frequency axis $\theta = \omega T$ runs only from $0$ to $\pi$, that is from DC to Nyquist. A mode above Nyquist has no representation in that model at all: when the plant was discretised, that mode's contribution appeared at its aliased frequency, and if the model was built from a continuous plant that included the mode, the discretisation folded it silently. Either way the analysis sees a mode at the wrong frequency, or does not see it, and reports a $\mu$ peak that has nothing to do with the physical resonance. The defence is outside the analysis: know from the structural model which modes have sensor response above the Nyquist frequency, attenuate them in analogue hardware before the converter, and document the attenuation. Only then is the discrete model an honest representation of what the flight computer sees.
:::

::: check
An aircraft has $\omega_{n,sp} = 3\,\mathrm{rad/s}$, $\zeta_{sp} = 0.5$ and $n/\alpha = 45\,g/\mathrm{rad}$ in a Category A flight phase. Assess it.
:::

::: answer
$\mathrm{CAP} = 9/45 = 0.200$, below the Level 1 lower boundary of about $0.28$ but inside the Level 2 band, so the short-period response is adequate with considerable pilot compensation rather than satisfactory. The damping of $0.5$ is inside the Level 1 range of $0.35$ to $1.30$, so damping is not the problem. The problem is the combination of a modest natural frequency with a large load-factor sensitivity, which is typical of a heavy aircraft at high dynamic pressure: the pilot gets a lot of $g$ eventually for very little pitch acceleration immediately. The control-law fix is pitch-rate feedback to raise the effective $\omega_{n,sp}$; raising it to $3.55\,\mathrm{rad/s}$ gives $\mathrm{CAP} = 0.280$ and reaches the boundary, and to $4\,\mathrm{rad/s}$ gives $0.356$ with some margin. Whether that is achievable depends on actuator bandwidth and on the structural modes the higher bandwidth would approach — the same trade this whole module has been about.
:::

::: check
A programme has an excellent $\mu$ analysis, a full disk-margin sweep and a large Monte Carlo campaign, all on the linear model. What is still missing?
:::

::: answer
The nonlinear evidence. Every technique in this module is linear, and the phenomena that most often bite in flight are not: actuator position and rate limits, which turn a linear loop into one with an enormous effective phase lag and can produce a sustained limit cycle; thruster minimum impulse and dead bands; propellant slosh, whose effective mass and frequency depend on fill level and on the acceleration; structural modes whose frequencies move with tank level and thermal state; and sensor quantisation. The complete package is the linear analysis for margins and robustness, a describing-function or limit-cycle analysis for the rate-limited and on-off nonlinearities, and a Monte Carlo campaign on the nonlinear six-degree-of-freedom simulation with the flight software in the loop at its true rate. The linear analysis says where to look; the nonlinear simulation says what happens.
:::

## Summary

| Item | Statement |
| --- | --- |
| Launch vehicle rigid body | typically $6\,\mathrm{dB}$ gain margin (both sides if unstable) and $30^\circ$ phase margin |
| Flexible modes | gain-stabilised: attenuate by $6$ to $12\,\mathrm{dB}$ across the uncertain frequency range; phase-stabilised: hold about $60^\circ$ from instability |
| Aircraft | MIL-F-9490 / MIL-DTL-9490 lineage, commonly quoted as $6\,\mathrm{dB}$ and $45^\circ$ over the main band |
| Across the envelope | margins swept over the trajectory and over a dispersion campaign; the requirement is on the worst case |
| Booster sweep | worst low-gain margin $20.7\,\mathrm{dB}$ at maximum dynamic pressure; crossover $2.26$ to $4.13\,\mathrm{rad/s}$; disk margin $\pm 9.3$ to $\pm 11.6\,\mathrm{dB}$ |
| Digital delay | $\tau_{\mathrm{eff}} \approx T/2 + T_{\mathrm{comp}}$; phase loss $\omega_{gc}\tau_{\mathrm{eff}}$; compare with delay margin $\mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$ |
| Worked digital case | $50\,\mathrm{Hz}$ plus one sample gives $30\,\mathrm{ms}$, $3.89^\circ$ at $2.26\,\mathrm{rad/s}$: PM $55.2^\circ \to 51.3^\circ$ |
| Aliasing | $f_m$ folds to $\lvert f_m - nf_s\rvert$; $30\,\mathrm{Hz}$ at $f_s = 50\,\mathrm{Hz}$ appears at $20\,\mathrm{Hz}$; only analogue filtering prevents it |
| Discrete mu | evaluate $\mu(\mathbf{M}(e^{j\theta}))$ for $\theta\in[0,\pi]$; certifies sample instants only; lifting gives the sampled-data answer |
| Cooper-Harper | $1$–$10$; Level 1 is $1$–$3$, Level 2 is $4$–$6$, Level 3 is $7$–$9$ |
| Control anticipation | $\mathrm{CAP} = \omega_{n,sp}^2/(n/\alpha)$; Category A Level 1 roughly $0.28$ to $3.6$, with $0.35 \le \zeta_{sp} \le 1.30$ |
| Worked CAP | $(4, 20) \to 0.800$ Level 1; $(2, 30) \to 0.133$ below Level 2; $(6, 12) \to 3.000$ near the abrupt boundary |
| Other criteria | bandwidth and phase delay for high-order systems and pilot-induced oscillation; Gibson dropback |

That closes the module: from an uncertainty set built out of hardware tolerances, through the tests and syntheses that act on it, to the evidence a flight readiness review consumes. The nonlinear control module takes up what remains — the phenomena that none of this linear machinery can see.
