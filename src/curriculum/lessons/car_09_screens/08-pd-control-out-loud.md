---
id: l08-pd-control-out-loud
title: "PD control, out loud"
minutes: 26
covers:
  - reported topics: PD control, orbit determination, frequency-domain analysis
---

This module's source material reports three topics that come up on GNC phone screens: PD control, orbit determination, and frequency-domain analysis. The next three lessons take them one at a time. They are the part of this module where the standard changes: everything so far has been about how to say things, and it has been careful to tell you where this curriculum does not know how a particular employer behaves. None of that caution applies here. If an interviewer asks you what the closed-loop poles of a PD-controlled double integrator are, there is a right answer, and the whole of the assessment is whether you can produce it accurately, out loud, in a few minutes.

This lesson does PD control. It is first because the double integrator is the plant you get when you write down the attitude dynamics of a rigid body in vacuum about a single axis, which makes it the most natural fundamentals question in the entire subject to ask a GNC candidate — and because its answer contains three things that are easy to half-know: why proportional control alone is not merely sluggish but unstable-in-the-limit, where the closed-loop poles actually sit, and why the derivative term is never implemented as a derivative.

## The plant, and why it is a double integrator

Take a rigid body, one axis, no aerodynamic or gravity-gradient restoring moment — a spacecraft in vacuum, or any rigid body being accelerated by a torque with nothing pulling it back. Newton's second law for rotation about that axis is

$$J\ddot{\theta} = u$$

where $J$ is the moment of inertia about the axis in $\mathrm{kg\,m^2}$, $\theta$ is the angle in radians, and $u$ is the applied torque in $\mathrm{N\,m}$. Transform and you get the plant

$$G(s) = \frac{\theta(s)}{u(s)} = \frac{1}{Js^2}$$

Two poles at the origin. That is the whole model, and the reason it is worth taking seriously rather than treating as a toy is that it is not a toy: it is what a reaction-wheel attitude loop, a thruster-based pointing loop, and the rigid-body part of a launch vehicle's pitch loop all reduce to once you strip the secondary effects.

The assumptions you should say out loud when you use it: rigid body, single axis so that the cross-coupling terms in Euler's equations drop out, small angles so the kinematics are linear, no restoring moment, and an actuator fast enough relative to the loop that its own dynamics can be ignored. Each of those is a place where a real design departs from the model, and naming them is the difference between using the model and believing it.

## Why proportional control alone fails

Close the loop with $u = -k_p\theta$. The characteristic equation is

$$Js^2 + k_p = 0 \;\Rightarrow\; s = \pm j\sqrt{k_p/J}$$

Both poles sit exactly on the imaginary axis, for every positive $k_p$. The closed-loop system is marginally stable: disturb it and it oscillates forever at $\sqrt{k_p/J}$ radians per second, neither growing nor decaying.

This is the fact to have ready, because the follow-up is always some version of *can you not just raise the gain?* Raising $k_p$ moves the poles further up and down the imaginary axis, which makes the oscillation faster. It does not move them left. There is no value of $k_p$ that damps this plant, because the plant has no damping of its own and proportional feedback adds none — a proportional term contributes a force in phase with position, and damping requires a force in phase with velocity.

::: key
A double integrator under pure proportional control has closed-loop poles at $s = \pm j\sqrt{k_p/J}$: purely imaginary for every gain, so the response is an undamped oscillation at $\sqrt{k_p/J}$ rad/s. No choice of proportional gain stabilises it, because damping requires a term in the rate.
:::

## Adding derivative action

Take $u = -k_p\theta - k_d\dot{\theta}$. The closed loop becomes

$$J\ddot{\theta} + k_d\dot{\theta} + k_p\theta = 0 \;\Rightarrow\; Js^2 + k_d s + k_p = 0$$

Divide through by $J$ and compare with the standard second-order form $s^2 + 2\zeta\omega_n s + \omega_n^2 = 0$:

$$\omega_n = \sqrt{\frac{k_p}{J}}, \qquad \zeta = \frac{k_d}{2\sqrt{k_p J}}$$

and, read the other way — which is how you actually design — 

$$k_p = J\omega_n^2, \qquad k_d = 2\zeta\omega_n J$$

The poles are then at

$$s = -\zeta\omega_n \pm j\,\omega_n\sqrt{1-\zeta^2}$$

for $\zeta < 1$. Units: $k_p$ is in $\mathrm{N\,m/rad}$ and $k_d$ in $\mathrm{N\,m\,s/rad}$, which is the same as newton metres per radian per second — check this whenever you write the expressions down, because it catches a transposed $J$ immediately.

Two facts worth carrying. The two-percent settling time is approximately $4/(\zeta\omega_n)$, which is four time constants of the exponential envelope. And $\zeta = 1/\sqrt{2} \approx 0.707$ is a common design choice for a specific reason: the closed-loop magnitude response of the standard second-order system has a resonant peak at $\omega_n\sqrt{1-2\zeta^2}$, which is a real frequency only when $\zeta < 1/\sqrt{2}$. At or above that damping the response is monotone in frequency with no peak at all.

::: key
With $u = -k_p\theta - k_d\dot{\theta}$ the closed loop is $Js^2 + k_d s + k_p = 0$, giving $\omega_n = \sqrt{k_p/J}$ and $\zeta = k_d/(2\sqrt{k_p J})$. Designing from a specification: $k_p = J\omega_n^2$ and $k_d = 2\zeta\omega_n J$, with poles at $-\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2}$ and a two-percent settling time of about $4/(\zeta\omega_n)$.
:::

## The zero nobody mentions

Here is where a good answer separates itself, and it is a trap that catches candidates who have memorised the standard second-order results without deriving them.

If you implement the control law as $u = k_p(\theta_c - \theta) - k_d\frac{d}{dt}(\theta_c - \theta)$ — that is, both terms acting on the error — then the closed-loop transfer function from command to output is

$$\frac{\theta(s)}{\theta_c(s)} = \frac{k_d s + k_p}{Js^2 + k_d s + k_p}$$

which has a **zero** at $s = -k_p/k_d$, in addition to the pole pair. The standard overshoot formula $M_p = e^{-\zeta\pi/\sqrt{1-\zeta^2}}$ describes a system with those poles and *no zero*, and a zero close to the poles adds overshoot — often a great deal of it. So an answer that reports the pole locations and then quotes the textbook overshoot is quietly wrong about the thing the interviewer can most easily check by simulating it.

The fix is standard and worth knowing by name: put the proportional term on the error and the derivative term on the **measurement only**, $u = k_p(\theta_c - \theta) - k_d\dot{\theta}$. The loop transfer function is unchanged, so every stability margin is unchanged, but the command-to-output transfer function becomes $k_p/(Js^2 + k_d s + k_p)$ — no zero — and the overshoot matches the formula again. As a bonus this removes derivative kick: differentiating a step in the command produces an impulse into the actuator, and if the derivative never sees the command, it cannot.

::: example Designing the loop, with numbers
**Interviewer:** Sketch me a PD controller for a double integrator and tell me where the closed-loop poles end up.

**A strong answer, narrated:**

"I will set up the plant, say why proportional alone will not do, then design from a specification and put numbers on it. Assumptions: rigid body, single axis, vacuum so there is no restoring moment, small angles, and an actuator fast enough to ignore.

Plant: $J\ddot{\theta} = u$, so $G(s) = 1/(Js^2)$. Let me take a reaction-wheel-controlled spacecraft, $J = 120\,\mathrm{kg\,m^2}$ about the axis in question.

Proportional only gives $Js^2 + k_p = 0$, poles at $\pm j\sqrt{k_p/J}$ — on the imaginary axis for any gain, so it rings forever. Raising the gain only raises the ringing frequency.

So PD. Say I want a closed-loop bandwidth of about $\omega_n = 0.5\,\mathrm{rad/s}$ — a settling time of order ten seconds, which is a reasonable slew-and-settle for a wheel-controlled spacecraft — and $\zeta = 0.7$.

$k_p = J\omega_n^2 = 120 \times 0.25 = 30\,\mathrm{N\,m/rad}$.

$k_d = 2\zeta\omega_n J = 2 \times 0.7 \times 0.5 \times 120 = 84\,\mathrm{N\,m\,s/rad}$.

Poles at $-\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2} = -0.35 \pm j\,0.357\,\mathrm{rad/s}$.

Checks. Units: $k_p$ is newton metres per radian, $k_d$ newton metres per radian per second — both right. Settling time $4/(\zeta\omega_n) = 4/0.35$, about 11 seconds, which matches what I asked for. And the undamped version would have rung at $0.5\,\mathrm{rad/s}$, a period of about 12.6 seconds, so a settle of roughly one ring period is the right order.

One thing I should flag: if both terms act on the error, the command-to-output transfer function has a zero at $-k_p/k_d$, which here is about $-0.357\,\mathrm{rad/s}$ — sitting right on top of the pole real part. That zero adds substantial overshoot beyond the four-and-a-half percent the standard formula gives for $\zeta = 0.7$; simulated, it comes out around twenty percent. If overshoot matters I would put the derivative on the measurement only, which removes the zero from the command path and leaves every margin untouched."

**Why this is a strong answer:** it is under four minutes, it states assumptions before any algebra, it derives the marginal-stability result rather than asserting it, it designs from a specification rather than pulling gains from nowhere, it carries units through, and it closes with three independent checks. The final paragraph is what distinguishes it from a competent textbook answer: the candidate has noticed a discrepancy between two things they know — the pole locations and the overshoot formula — and resolved it correctly. That is exactly the kind of thing an interviewer goes looking for and rarely finds.
:::

## Steady-state error, and when you need the integral

PD is not PID, and the natural follow-up is when the missing term matters.

Put a constant disturbance torque $T_d$ into the plant — a thruster misalignment, solar radiation pressure on an asymmetric spacecraft, a slightly off-centre centre of mass. The closed-loop equation regulating to zero becomes $J\ddot{\theta} = -k_p\theta - k_d\dot{\theta} + T_d$. In steady state both derivatives vanish, so

$$\theta_{ss} = \frac{T_d}{k_p}$$

A constant disturbance produces a constant angular offset, inversely proportional to the proportional gain alone — the derivative gain does not appear, because in steady state there is no rate for it to act on.

With the gains above and a disturbance of $T_d = 0.02\,\mathrm{N\,m}$, the offset is $\theta_{ss} = 0.02/30 = 6.67 \times 10^{-4}\,\mathrm{rad}$, which is about $0.038$ degrees. Whether that is acceptable is a requirements question, and that is the correct way to answer the interviewer: *it depends on the pointing budget.* If it is not acceptable, integral action drives it to zero, at the price of extra phase lag near crossover — which eats stability margin — and of integrator windup whenever the actuator saturates, which needs an anti-windup scheme.

::: warning Do not reach for PID by default
The reflex answer "you would use a PID controller" is weaker than it sounds, because the integral term buys one specific thing — zero steady-state error against a constant disturbance — and costs phase margin and windup handling. Many spacecraft attitude loops are PD precisely because the disturbances are small, the pointing budget tolerates a small bias, and the phase margin is worth more. Say what the integral is for before you add it.
:::

## Why derivative action is filtered

This question appears in this module's own drill list, and the complete answer has four parts. Most candidates give one.

**It is not realisable.** The ideal derivative $k_d s$ is an improper transfer function: its magnitude grows without bound with frequency. No physical system does that, so it cannot be built, only approximated.

**It amplifies noise.** Because gain rises with frequency, a differentiator hands the actuator the highest-frequency content of the measurement preferentially — which, for a real sensor, is noise. In a discrete implementation this is easy to quantify: if you form the rate by differencing a position measurement with quantisation step $q$ over a sample period $T$, the differencing step produces an error of order $q/T$ in the rate estimate. Shrink the sample period to get a faster loop and the noise on the derivative gets worse, not better.

**The fix.** Replace $k_d s$ with a filtered derivative,

$$\frac{k_d s}{\tau s + 1}$$

which behaves as a differentiator below $1/\tau$ and rolls off to a finite high-frequency gain of $k_d/\tau$ above it. The filter time constant $\tau$ is chosen well above the closed-loop bandwidth so that it does not eat the phase the derivative term was added to provide — that trade, phase lead against noise amplification, is the entire design decision.

**The better fix, where it is available.** On a spacecraft or a launch vehicle you usually do not have to differentiate anything, because you have a rate gyro. Feeding back measured angular rate instead of a differentiated angle gives you the damping term directly, with no differentiation and no noise amplification. This is the answer an interviewer is most pleased to hear, because it is what is actually done, and it reframes the question: the reason PD implementations differentiate at all is that the rate is not directly measured, and if it is, the problem does not arise.

::: example "Why is derivative action filtered?"
**Weak answer:** "Because the derivative amplifies noise. If your sensor is noisy, taking the derivative makes it much worse, so you put a low-pass filter on it to smooth it out."

**Strong answer:**

"Three reasons, and then what I would actually do instead.

First, a pure derivative is improper — the gain rises without bound with frequency, so it is not physically realisable. Any implementation is an approximation to it whether you intended one or not.

Second, that rising gain means the term preferentially amplifies whatever is highest in frequency in the measurement, which is the sensor noise. If you are differencing a quantised position measurement, the rate error is of order the quantisation step divided by the sample period — so it gets worse as you sample faster, which is the opposite of the intuition.

Third, if the derivative acts on the error rather than on the measurement, a step change in the command differentiates to an impulse into the actuator. That is derivative kick, and it is a separate problem from noise.

The standard fix for the first two is a filtered derivative, $k_ds/(\tau s + 1)$: it differentiates below $1/\tau$ and flattens out to a gain of $k_d/\tau$ above it, so the high-frequency gain is bounded. Choosing $\tau$ is a real trade — too slow and you lose the phase lead near crossover that the derivative was there to provide; too fast and you have barely filtered anything. The fix for the third is to differentiate the measurement only, never the command.

But on a vehicle with a rate gyro I would not differentiate at all. Feed back the measured rate and you get the damping term directly, with none of this. The only reason to differentiate a position signal is that you do not have a rate measurement."

**What makes the difference:** the weak answer contains a true statement and stops. It gives no mechanism for *why* differentiation amplifies noise, no form for the filter, no account of the trade-off in choosing it, and no mention of realisability or derivative kick. Most importantly it misses the engineering answer — that on the vehicles this role concerns, the rate is usually measured rather than derived, which makes the whole question conditional. The strong answer is structured, announces its count, quantifies the noise mechanism, names the trade explicitly, and ends somewhere the interviewer can take it further.
:::

::: note One sentence about discretisation
A follow-up you should be ready for: what changes when this runs on a computer at a fixed rate? The honest short answer is that a zero-order hold at sample period $T$ behaves approximately like a pure delay of $T/2$, and a delay contributes phase lag that grows with frequency — roughly $\omega T/2$ radians at frequency $\omega$ — which eats stability margin near the crossover frequency. That is the bridge into the next lesson, where phase margin gets defined properly and this delay gets converted into a number.
:::

## Check yourself

::: check
State the closed-loop poles of a double integrator under pure proportional feedback, and explain in physical terms why no choice of gain stabilises it.
:::

::: answer
The characteristic equation is $Js^2 + k_p = 0$, so the poles are at $s = \pm j\sqrt{k_p/J}$ — purely imaginary for every positive gain, giving an undamped oscillation at $\sqrt{k_p/J}$ rad/s. Physically, proportional feedback produces a restoring torque in phase with the position error, which is a spring; the plant is a free rigid body, which contributes no damping of its own. A mass on a spring with no dashpot oscillates forever regardless of how stiff the spring is, and raising $k_p$ only stiffens the spring, moving the poles further along the imaginary axis rather than to the left. Damping requires a torque in phase with the rate.
:::

::: check
A rigid body has $J = 200\,\mathrm{kg\,m^2}$ about the axis of interest, and you want $\omega_n = 0.4\,\mathrm{rad/s}$ with $\zeta = 0.7$. Give the gains with units, the pole locations, and one sanity check.
:::

::: answer
$k_p = J\omega_n^2 = 200 \times 0.16 = 32\,\mathrm{N\,m/rad}$ and $k_d = 2\zeta\omega_n J = 2 \times 0.7 \times 0.4 \times 200 = 112\,\mathrm{N\,m\,s/rad}$. The poles are at $-\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2} = -0.28 \pm j\,0.286\,\mathrm{rad/s}$. As a check, the two-percent settling time is about $4/(\zeta\omega_n) = 4/0.28$, roughly 14 seconds, which is the right order for a bandwidth of 0.4 rad/s — the settle takes a few times the natural period rather than a fraction of it. The units check independently: $k_p$ is a torque per angle and $k_d$ a torque per angular rate.
:::

::: check
Why does an answer that reports the pole locations and then quotes $M_p = e^{-\zeta\pi/\sqrt{1-\zeta^2}}$ for the overshoot risk being wrong, and what implementation change makes it right?
:::

::: answer
Because that formula is for a system with the given pole pair and no finite zero, whereas a PD controller acting on the error puts a zero at $s = -k_p/k_d$ into the command-to-output transfer function, $(k_ds + k_p)/(Js^2 + k_ds + k_p)$. A zero near the poles adds overshoot, sometimes several times what the formula predicts. The fix is to act with the proportional term on the error and the derivative term on the measurement only. The loop transfer function — and therefore every stability margin — is unchanged, but the command-to-output function becomes $k_p/(Js^2 + k_ds + k_p)$, which has no zero, so the formula applies again. It also removes derivative kick as a side effect.
:::

::: check
Derive the steady-state angular error of a PD-controlled double integrator subject to a constant disturbance torque, and say what the derivative gain contributes to it.
:::

::: answer
With the loop regulating to zero and a constant disturbance torque $T_d$ entering at the plant input, the dynamics are $J\ddot{\theta} = -k_p\theta - k_d\dot{\theta} + T_d$. In steady state $\ddot{\theta} = \dot{\theta} = 0$, leaving $0 = -k_p\theta_{ss} + T_d$, so $\theta_{ss} = T_d/k_p$. The derivative gain contributes nothing: in steady state there is no rate for it to act on, so damping affects how the error is approached but not where it settles. Reducing the offset means raising $k_p$ — which also raises the bandwidth — or adding integral action, which drives it to zero at the cost of phase lag near crossover and a need for anti-windup.
:::

::: check
Give the four distinct reasons derivative action is filtered or avoided, and identify which one an interviewer is most pleased to hear on a spacecraft question.
:::

::: answer
One: an ideal derivative is improper, with unbounded gain at high frequency, so it cannot be physically realised. Two: that rising gain preferentially amplifies the high-frequency content of the measurement, which is noise — and for a quantised position measurement differenced over a sample period, the rate error is of order the quantisation step divided by the sample period, so faster sampling makes it worse. Three: differentiating the error rather than the measurement turns a command step into an impulse at the actuator, which is derivative kick and is a separate defect. Four, and the one an interviewer most wants to hear: on a vehicle with a rate gyro you do not differentiate at all — you feed back the measured rate, which gives the damping term directly and makes the whole problem conditional on not having a rate measurement.
:::

::: check
An interviewer asks why you would not simply use a PID controller for every attitude loop. Give the answer.
:::

::: answer
Because the integral term buys exactly one thing — zero steady-state error against a constant disturbance — and it is not free. It adds phase lag near the crossover frequency, which costs stability margin on a plant that has none of its own to spare, and it introduces windup whenever the actuator saturates, which requires an explicit anti-windup scheme to handle safely. Many spacecraft attitude loops are PD precisely because the residual offset $T_d/k_p$ is inside the pointing budget and the phase margin is worth more than removing it. The right answer is to state what the integral is for, check whether the steady-state offset actually violates a requirement, and add it only if it does.
:::

## Summary

| Quantity | Expression | Units |
| --- | --- | --- |
| Plant (rigid body, one axis) | $G(s) = 1/(Js^2)$ | $\mathrm{rad/(N\,m)}$ |
| Proportional-only poles | $s = \pm j\sqrt{k_p/J}$ | $\mathrm{rad/s}$ |
| PD characteristic equation | $Js^2 + k_ds + k_p = 0$ | — |
| Natural frequency, damping | $\omega_n = \sqrt{k_p/J}$, $\zeta = k_d/(2\sqrt{k_pJ})$ | $\mathrm{rad/s}$, — |
| Gains from a specification | $k_p = J\omega_n^2$, $k_d = 2\zeta\omega_nJ$ | $\mathrm{N\,m/rad}$, $\mathrm{N\,m\,s/rad}$ |
| Closed-loop poles | $-\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2}$ | $\mathrm{rad/s}$ |
| Settling time (2%) | $\approx 4/(\zeta\omega_n)$ | $\mathrm{s}$ |
| Command-path zero (D on error) | $s = -k_p/k_d$ | $\mathrm{rad/s}$ |
| Steady-state error to constant torque | $\theta_{ss} = T_d/k_p$ | $\mathrm{rad}$ |
| Filtered derivative | $k_ds/(\tau s + 1)$, high-frequency gain $k_d/\tau$ | — |

The next lesson takes the same loop into the frequency domain and defines the quantity an interviewer is most likely to ask you to explain physically: phase margin, what it means in seconds of tolerable delay, and how it connects to the damping ratio you just designed for.
