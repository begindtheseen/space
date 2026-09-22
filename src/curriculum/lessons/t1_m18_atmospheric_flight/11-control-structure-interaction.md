---
id: l11-control-structure-interaction
title: Control-structure interaction
minutes: 20
covers:
  - control-structure interaction
---

On its maiden flight in August 1998 the Delta III launch vehicle began to roll back and forth about seventy seconds after lift-off. The control system's response to a 4 Hz roll oscillation — a structural mode the designers had not adequately represented in the control model — drove the solid-motor thrust-vector actuators through ever larger corrections until the hydraulic system was exhausted, and the vehicle broke up. The airframe had not failed; the controller had, by treating a structural resonance as a rigid-body error to be corrected. That failure mode has a name: **control-structure interaction**.

The previous two lessons met its two chief forms on a launch vehicle: bending modes at a few hertz and above, and slosh at a fraction of a hertz. This lesson assembles the complete plant — rigid body, slosh, bending, the engine's own inertia, actuators and sensors — and lays out how the interaction is analysed and designed against. Its centrepiece is the choice every flexible-vehicle designer must make for every mode: **gain stabilisation**, pushing the mode below 0 dB so its phase cannot matter, or **phase stabilisation**, letting it exceed 0 dB but shaping the phase so the Nyquist plot still encircles the critical point correctly. The rule for choosing is a matter of frequency separation, and the bending-notch exercise ends by making you apply it to a mode that has moved too close to crossover.

## The complete plant

Write the transfer function from gimbal command to the attitude the gyro reports, collecting everything the earlier lessons derived:

$$
\frac{\theta_{\text{meas}}}{\delta_c} = A(s)\left[\underbrace{\frac{\mu_\delta}{s^2 - \mu_\alpha}}_{\text{rigid}}
+ \underbrace{\sum_j \frac{\mu_\delta\,(\omega_{z,j}^2 - \omega_{p,j}^2)}{(s^2 - \mu_\alpha)(s^2 + 2\zeta_j\omega_{p,j}s + \omega_{p,j}^2)}}_{\text{slosh}}
+ \underbrace{\sum_n \frac{k_n\,\omega_n^2}{s^2 + 2\zeta_n\omega_n s + \omega_n^2}}_{\text{bending}}\right] .
$$

Here $A(s)$ is the actuator, typically a second-order lag with a bandwidth of 3–10 Hz, and the slosh term is the pole-zero pair of the last lesson written as an addition to the rigid plant. Digital control adds a sample-and-hold delay of half a sample period plus computation time, a few to tens of milliseconds, which is pure phase lag growing linearly with frequency: 10 ms is $7^\circ$ at 2 Hz and $43^\circ$ at 12 Hz. The controller is a PD (or PID) law times a bending filter, and the loop gain is their product.

On a Bode plot of this loop gain the frequency axis reads like a map of the vehicle. Below 0.1 Hz the gain is large and the phase sits at $-180^\circ$, the signature of the stabilised unstable plant. Around 0.3–1 Hz are the slosh pole-zero pairs, tiny in extent but sharp. The rigid-body crossover lies at 0.3–2 Hz depending on the vehicle's size. From 1 to 20 Hz the bending needles stand up out of the roll-off, the first one tallest. Somewhere in 3–10 Hz the actuator's phase lag becomes significant and the tail-wags-dog zero appears. Above that the sampling delay dominates the phase and the gain should be well below 0 dB.

## Tail-wags-dog

One term in the plant is easy to forget: the engine has mass. When the actuator swings a 500 kg engine about its gimbal, the engine's centre of mass accelerates sideways and the reaction on the vehicle opposes the lateral thrust component the swing was meant to create. For an engine of mass $m_e$ with its centre of mass a distance $\ell_e$ from the gimbal, the net lateral force is $T\delta - m_e\ell_e\ddot\delta$, which vanishes when $\omega^2 = T/(m_e\ell_e)$. The **tail-wags-dog frequency**

$$
\omega_{\text{TWD}} = \sqrt{\frac{T}{m_e\,\ell_e}}
$$

is where the gimbal stops being able to push the vehicle sideways at all: for a 0.85 MN engine of 470 kg with $\ell_e = 1.2\ \mathrm{m}$, $\omega_{\text{TWD}} = \sqrt{8.5 \times 10^5/564} = 38.8\ \mathrm{rad/s} = 6.2\ \mathrm{Hz}$. In the transfer function this is a pair of zeros on the imaginary axis multiplying the control moment coefficient, $\mu_\delta \to \mu_\delta(1 - s^2/\omega_{\text{TWD}}^2)$ (with a small correction for the engine's inertia). Above $\omega_{\text{TWD}}$ the control force reverses sign, a 180° phase flip, and a bending mode that sits near the TWD frequency sees a control authority that changes sign across its own bandwidth. Small engines on large vehicles put the TWD zero high and harmless; large engines put it near the first bending modes, where it must be modelled.

## Requirements and how they are checked

Launch-vehicle programmes state their stability requirements in gain and phase margin, separately for the rigid body and for each flexible mode, evaluated across the whole flight:

- **Rigid body**: at least 6 dB of gain margin and 30° of phase margin, with the gain margin required in *both* directions because the plant is aerodynamically unstable — the low-gain margin of Lesson 6 as well as the usual high-gain one.
- **Gain-stabilised modes**: the loop gain at the mode's peak at least 6–8 dB below 0 dB, with the mode's frequency dispersed over its uncertainty band and its damping taken at the low end of what was measured.
- **Phase-stabilised modes**: at least 30–45° of phase margin at each of the mode's gain crossovers, over the same dispersions plus the actuator's phase uncertainty and the delay budget.

The dispersions are not small. Ground vibration tests and finite-element models predict bending frequencies to $\pm 10$–20 % and modal gains to perhaps $\pm 50$ %; damping is uncertain by a factor of two; slosh parameters move with fill level and $g_{\text{eff}}$; the actuator's bandwidth changes with load and temperature. Verification therefore means sweeping the flight time in steps, at each step running the linear analysis over the corner cases and a Monte Carlo over the dispersions, and confirming the margins hold everywhere. Flight data closes the loop: spectral analysis of gyro and gimbal signals from every flight confirms where the modes actually sat.

## Gain stabilisation and phase stabilisation

The Nyquist picture makes the choice concrete. A lightly damped mode traces a circle in the Nyquist plane as frequency sweeps through its resonance — a loop of diameter set by the mode's peak gain, oriented by the loop phase at the mode frequency. If the peak gain is below unity the circle is too small to reach $-1$ whatever its orientation: the mode is **gain-stabilised**, and nothing about its phase can hurt. If the peak gain exceeds unity, the circle *can* reach $-1$; whether it encircles it depends on the orientation, which is the phase of everything else in the loop at that frequency plus the sign of the modal gain $k_n$. Orient the circle so it swings away from $-1$ and the mode is **phase-stabilised**; get the orientation wrong by 180° and the same mode is unstable.

::: key
Gain stabilisation: attenuate the mode below 0 dB with a notch or roll-off — the right answer when the mode sits well above crossover. Phase stabilisation: let it exceed 0 dB but shape the phase so the loop still encircles correctly — necessary when the mode is too close to crossover to attenuate without destroying the phase margin.
:::

The deciding quantity is the ratio of the mode frequency to the rigid-body crossover. Well above crossover — a factor of five or more — the loop is already rolling off, a notch's phase cost at crossover is a few degrees, and gain stabilisation is cheap and robust. Close to crossover — a factor of two or less — any filter deep enough to attenuate the mode costs tens of degrees of phase margin, and the designer is forced to work with the mode's phase instead.

::: example A 12 Hz mode against a 2 Hz loop
The bending lesson's loop crossed at 2.08 Hz and its first mode sat at 12 Hz, a ratio of 5.8. A 20 dB notch ($\zeta_z = 0.05$, $\zeta_p = 0.5$) took the mode from $+8.8$ to $-11.2\ \mathrm{dB}$ for 9° of phase margin at crossover, and a 26 dB notch ($\zeta_z = 0.03$, $\zeta_p = 0.6$) bought a further 6 dB for 2° more. That is gain stabilisation working as designed: the mode is robustly below 0 dB across a $\pm 10$ % frequency band, the sign of $k_1$ is irrelevant, the actuator's phase at 12 Hz is irrelevant, and the rigid-body loop is almost untouched. The alternative of lowering the overall loop gain until the mode fell below 0 dB would need 9 dB of reduction, which would move the rigid crossover toward the unstable pole and eat most of the low-gain margin; on an aerodynamically unstable vehicle the rigid loop cannot be slowed to accommodate a flexible mode.
:::

::: example The same mode at 3 Hz
Move the mode to 3 Hz with the same modal gain, a ratio of only 1.5. Without a filter the peak reaches $+3.6\ \mathrm{dB}$; with $k_1 > 0$ the phase at the peak is $-85^\circ$ and the loop is stable, with $k_1 < 0$ it is $-168^\circ$ and the closed loop has poles at $+0.046 \pm 18.9j$ — unstable. A 20 dB notch at 3 Hz costs $43^\circ$ at 2 Hz and leaves 22° of phase margin; a shallower 15.6 dB notch ($\zeta_p = 0.3$) leaves 32°, barely legal, and is so narrow that a 10 % frequency error puts the mode on its shoulder. The notch has failed. The remaining options:

- **Phase-stabilise.** Choose the gyro station, or blend two gyros, so that $k_1 > 0$ and the resonance loop swings away from $-1$; then verify that the actuator lag, the delay budget and the $\pm 20$ % frequency dispersion cannot rotate it back. Fragile but standard when nothing else fits.
- **Lower the crossover, if the aerodynamics allow.** With $K_p = 2.6$, $K_d = 0.7$ the crossover falls to 1.22 Hz (still seven times the 0.16 Hz unstable pole, so the rigid margins survive: 54° of phase margin). The loop gain at 3 Hz is now lower, the mode no longer reaches 0 dB, and a modest notch ($\zeta_z = 0.05$, $\zeta_p = 0.3$) leaves 41° of phase margin. The price is a slower response to gusts and higher loads.
- **Add damping or move the mode**: stiffen the structure, add damping treatment, or relocate the sensor to a slope null of the offending mode.

None of these is free; the exercise asks you to pick one and defend it.
:::

## Sensor placement and blending

Because a gyro senses the local mode slope $\phi_n'(x_g)$ and an accelerometer the local deflection $\phi_n(x_a)$, sensor location is a design variable of the same rank as a filter. A gyro at a point where the first mode's slope is zero — mid-body for a uniform free-free beam — does not see that mode at all. But mode shapes are only approximately known, slope nulls move as propellant drains, and a station that is a null for one mode is a maximum for another (mid-body is where the second mode's slope peaks).

**Blending** two sensors exploits the mode shapes' symmetry. For the uniform free-free beam, the first mode's slope at $0.15L$ and $0.85L$ is $\mp 4.4/L$ — equal and opposite — while the second mode's slope at those stations is $-6.3/L$ at both. Average two gyros there and the first mode cancels exactly while the rigid rate is preserved; the second mode passes at full strength, and would need its own filter. Difference the same two gyros and the roles reverse. Real vehicles use weighted blends tuned to the finite-element mode shapes.

Collocation matters too. A gyro near the engine sees the bending the engine excites with the sign the engine excites it, which tends to make modes phase-stable — the actuator and sensor "agree" — while a gyro far forward may see the opposite sign. The "positive sign in the feedback path" the exercise specifies is exactly this sign, and half of phase stabilisation is knowing it with confidence.

## Beyond fixed filters

A fixed notch sized for a $\pm 20$ % frequency band costs phase over the whole flight. Two developments reduce that cost. **Scheduling** the filter centres with flight time follows the modes as propellant depletes and the frequencies rise, so each notch can be narrower. **Adaptive augmenting control**, flown on the Space Launch System, monitors the spectral content of the attitude error: when it detects growing power at frequencies above the rigid-body band — the signature of a mode being pumped — it reduces the loop gain, and when the rigid-body error demands more authority it raises the gain back toward, but not beyond, a bounded multiple of the nominal. It does not replace the fixed design; it recovers margin when the vehicle differs from the model.

::: warning
Gain stabilisation is robust to *phase* but not to *gain*. A mode attenuated to $-8\ \mathrm{dB}$ becomes unstable if its modal gain is 8 dB larger than predicted, and modal gains are the least certain numbers in the model. Size the attenuation on the upper bound of the modal gain and the lower bound of the damping, not on the nominal.
:::

::: warning
Do not fix a flexible-mode problem by lowering the whole loop gain on an aerodynamically unstable vehicle. The rigid body needs its bandwidth to stay ahead of the unstable pole and its low-gain margin to survive dispersions in $\mu_\alpha$. A mode too close to crossover is a structural or sensor-placement problem before it is a filter problem.
:::

## Check yourself

::: check
A rigid-body loop has a 1.5 Hz crossover. Bending modes are predicted at 9 Hz and 2.5 Hz. Which approach do you take for each, and why?
:::

::: answer
The 9 Hz mode is six times above crossover: gain-stabilise it with a notch, whose phase cost at 1.5 Hz will be under 10° for a 20 dB depth, sized on the mode's frequency uncertainty. The 2.5 Hz mode is only 1.7 times above crossover: a notch deep enough to attenuate it would cost tens of degrees of phase at 1.5 Hz, so it must be phase-stabilised — sensor placement or blending to fix the sign of its modal gain, verification of its phase over the dispersions — or the structure and sensor layout must change. Reducing the overall gain is not an option on an unstable vehicle.
:::

::: check
A 12 Hz bending mode is gain-stabilised with 8 dB of margin. The flight vehicle's modal gain turns out to be twice the predicted value and its damping half. Is the mode still stable?
:::

::: answer
Doubling the modal gain adds $20\log_{10}2 = 6\ \mathrm{dB}$ to the peak; halving the damping doubles the resonant magnification $1/(2\zeta)$, another 6 dB. The peak rises 12 dB, from $-8$ to $+4\ \mathrm{dB}$, and the mode is no longer gain-stabilised; whether it is unstable depends on its phase, which gain stabilisation was supposed to make irrelevant. Either dispersion alone would have left 2 dB of margin; together they consume it. Margins must be sized against the combined worst case.
:::

::: check
Compute the tail-wags-dog frequency of a 0.6 MN engine of 300 kg with its centre of mass 1.0 m from the gimbal. A bending mode is predicted at 7 Hz; why does this matter?
:::

::: answer
$\omega_{\text{TWD}} = \sqrt{6 \times 10^5/(300 \times 1.0)} = 44.7\ \mathrm{rad/s} = 7.1\ \mathrm{Hz}$. The control force on the vehicle passes through zero and reverses sign at almost exactly the mode's frequency, so across the mode's resonance the sign of the excitation — and therefore the orientation of its Nyquist circle — flips. A phase-stabilisation argument built on the modal gain's sign would be wrong on one side of the TWD zero; the mode must be gain-stabilised or the TWD dynamics modelled explicitly.
:::

::: check
Two gyros are mounted at $0.15L$ and $0.85L$ on a vehicle whose first two modes resemble those of a uniform free-free beam. A designer proposes averaging their outputs. What does that do to each mode, and to the rigid-body rate?
:::

::: answer
The rigid-body rate is the same at both stations, so the average preserves it exactly. The first mode's slopes are $-4.4/L$ and $+4.4/L$ at those stations, so the average cancels the first mode. The second mode's slopes are $-6.3/L$ at both, so the average passes the second mode undiminished — it must still be handled by a filter, and at 2.76 times the first-mode frequency it is usually far enough above crossover to notch. If the actual mode shapes differ from the beam's, the cancellation is partial, so the blend is verified against the finite-element shapes and against flight data.
:::

::: check
Why does a digital controller's sampling delay matter more for bending modes than for the rigid body?
:::

::: answer
A pure delay $\tau$ contributes phase lag $\omega\tau$, growing linearly with frequency. A 10 ms delay is $2\pi \times 2 \times 0.01 = 0.126\ \mathrm{rad} = 7^\circ$ at a 2 Hz rigid crossover — a modest deduction from the phase margin — but $43^\circ$ at a 12 Hz bending mode, enough to rotate a phase-stabilised mode's Nyquist circle a large fraction of the way toward $-1$. Gain-stabilised modes are immune to it, which is one more argument for gain stabilisation wherever the separation allows.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Complete plant | actuator × (rigid + slosh pairs + bending modes); plus sampling delay |
| $\omega_{\text{TWD}} = \sqrt{T/(m_e\ell_e)}$ | tail-wags-dog zero; 6.2 Hz for a 0.85 MN, 470 kg engine at 1.2 m |
| Rigid requirements | ≥ 6 dB gain margin both directions, ≥ 30° phase margin |
| Flexible requirements | gain-stabilised ≥ 6–8 dB below 0 dB, or phase-stabilised ≥ 30–45°, over dispersions |
| Dispersions | mode frequency ±10–20 %, modal gain ±50 %, damping ×/÷ 2 |
| Gain stabilisation | notch or roll-off when the mode is ≥ 5× crossover; robust to phase, not to gain |
| Phase stabilisation | mode above 0 dB with phase shaped to avoid $-1$; needed when the mode is within ~2× crossover; fragile to delay, actuator phase and sign |
| Sensor blending | average of gyros at $0.15L$, $0.85L$ cancels mode 1, passes mode 2 |
| Adaptive augmenting control | lowers gain when it detects modal pumping (SLS) |

The last lesson leaves ascent. A booster that has separated and turned around must fly back through the atmosphere with its engines off, and the aerodynamics that were a nuisance on the way up become its only means of control on the way down.
