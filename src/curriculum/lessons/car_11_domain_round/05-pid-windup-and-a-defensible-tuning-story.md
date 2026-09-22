---
id: l05-pid-windup-and-a-defensible-tuning-story
title: "PID: structure, windup, filtered derivative, and a tuning story"
minutes: 21
covers:
  - "PID structure, integral windup and anti-windup, derivative filtering, and a defensible tuning approach"
---

PID is the control question an interviewer can ask anyone. It appears in attitude loops, thermal loops, valve loops, pump loops and tank-pressure loops, so no candidate can claim it is outside their area, and the answers separate cleanly: almost everyone can say what the three letters stand for, and very few can say what each term costs, diagnose windup from a symptom, give two remedies with the mechanism of each, explain why the derivative is never implemented as a derivative, and describe a tuning process they would defend at a review.

This lesson covers all five, because all five are in this module's list and the last three are where the round is decided.

## The three terms, and what each one costs

Write the parallel form once and define the symbols:

$$C(s) = k_p + \frac{k_i}{s} + k_d s$$

with $e$ the error, $u = C(s)e$ the commanded actuator effort, $k_p$ the proportional gain, $k_i$ the integral gain and $k_d$ the derivative gain. The standard (ISA) form is the same controller re-parameterised, $C(s) = k_p\left(1 + 1/(T_i s) + T_d s\right)$, with **integral time** $T_i = k_p/k_i$ and **derivative time** $T_d = k_d/k_p$, both in seconds. Say which form you are using before you quote a number, because a gain set that is sensible in one form is nonsense in the other.

**Proportional** is stiffness. It responds to the error now, sets the loop bandwidth, and leaves a steady-state error against a constant disturbance — for a plant with no integrator of its own, that residual is the disturbance divided by $k_p$.

**Integral** removes that residual. It costs a pole at the origin and, near crossover, up to $90^\circ$ of phase lag — which comes straight out of the phase margin the previous two lessons were about — plus a new failure mode, windup, which exists only because of it.

**Derivative** is damping. It acts on the rate of change, so it contributes phase lead and lets you raise $k_p$ without ringing. In the ISA form it is a prediction: the controller acts on the error it expects $T_d$ seconds from now. It costs noise amplification, because its gain rises with frequency.

::: key What each PID term buys and costs
**P**: stiffness, responds to the present error, sets bandwidth, leaves a steady-state offset. **I**: removes the steady-state offset to a constant disturbance, adds a pole at the origin and up to $90^\circ$ of lag near crossover, and introduces windup. **D**: damping, predicts the error $T_d = k_d/k_p$ seconds ahead, adds phase lead, amplifies sensor noise. Parallel form $k_p + k_i/s + k_ds$; ISA form $k_p(1 + 1/(T_is) + T_ds)$ with $T_i = k_p/k_i$, $T_d = k_d/k_p$.
:::

## Integral windup

Every real actuator has a limit: a reaction wheel has a maximum torque, a gimbal has a travel stop and a rate limit, a valve is either fully open or it is not. When the controller asks for more than the actuator can give, the loop is **open** — the plant is receiving a fixed input that no longer depends on the error.

The integrator does not know this. It goes on accumulating error at its own rate for as long as the saturation lasts. By the time the vehicle finally reaches the setpoint, the integral term holds a large stored value that has to be *unwound* — driven back down by error of the opposite sign — before the commanded output can come off the stop. So the actuator stays hard over past the point where it should have backed off, and the vehicle sails past the setpoint.

The diagnostic signature is what makes this a good interview question: **the defect is size-dependent**. Small commands never saturate the actuator and behave exactly as designed. Large commands saturate, wind up, and overshoot badly with a long sluggish settle. A loop that is well behaved in unit testing and terrible on the first real slew is the classic presentation.

::: key Integral windup
While the actuator is saturated the loop is open, but the integrator keeps accumulating error. The stored integral must then unwind before the commanded output leaves saturation, producing large overshoot and a long, slow settle after a big setpoint change. The tell is that small steps behave perfectly and large ones do not.
:::

## Two remedies, with their mechanisms

**Conditional integration** — also called clamping. Stop updating the integrator whenever the output is saturated *and* the error would drive it further into saturation. It is two lines of code, it needs no tuning parameter, and it is the right default. Continuing to integrate when the error has reversed sign is important: that is the case where integration is helping you come off the stop.

**Back-calculation** — also called tracking. Instead of freezing the integrator, feed it the difference between what the actuator was asked for and what it actually delivered. With $u$ the unsaturated command and $u_{sat}$ the delivered one, the integrator input becomes

$$\dot{I} = e + \frac{u_{sat} - u}{k_i T_t}$$

so that whenever the actuator is saturated the integrator is pulled toward the value that makes the commanded output exactly equal the limit. It has a tuning parameter, the tracking time constant $T_t$, which sets how fast that pull is; a common starting point for a full PID is $T_t \approx \sqrt{T_iT_d}$, and for a PI loop somewhere between a fraction of $T_i$ and $T_i$ itself. Done well it is smoother than clamping, because the integrator lands at the right value instead of at whatever value it happened to be frozen at.

Two more worth naming if the follow-up goes there: in a cascade, the inner loop's saturation should be reported to the outer loop's integrator by the same tracking mechanism; and any controller that can be switched in or out needs the same machinery for bumpless transfer, since a mode change is a saturation-like discontinuity from the integrator's point of view.

::: example Windup, and both remedies, with numbers
A small satellite rate loop: $J = 10\,\mathrm{kg\,m^2}$ about the axis, plant $\dot\omega = u/J$, PI controller designed for $\omega_n = 0.5\,\mathrm{rad/s}$ and $\zeta = 0.7$, so $k_i = J\omega_n^2 = 2.5$ and $k_p = 2\zeta\omega_nJ = 7.0$, giving an integral time $T_i = k_p/k_i = 2.8\,\mathrm{s}$. The reaction wheel saturates at $0.1\,\mathrm{N\,m}$.

**The small command.** Ask for $0.01\,\mathrm{rad/s}$. The initial proportional demand is $k_pe = 7.0 \times 0.01 = 0.07\,\mathrm{N\,m}$, comfortably inside the limit, so nothing saturates. Overshoot $21.0\%$, settling to $2\%$ in $9.76\,\mathrm{s}$ — identical for all three schemes below, because none of them does anything when the actuator is linear.

(The $21\%$ is not windup; it is the zero at $-k_i/k_p = -0.357\,\mathrm{rad/s}$ that a PI acting on the error puts into the command path. Worth knowing so you do not misattribute it.)

**The large command.** Ask for $0.05\,\mathrm{rad/s}$. The initial demand is $7.0 \times 0.05 = 0.35\,\mathrm{N\,m}$, three and a half times the limit.

| Scheme | Overshoot | $2\%$ settling | Time saturated |
| --- | --- | --- | --- |
| No anti-windup | $53.2\%$ | $18.5\,\mathrm{s}$ | $7.18\,\mathrm{s}$ |
| Conditional integration | $6.0\%$ | $11.7\,\mathrm{s}$ | $3.57\,\mathrm{s}$ |
| Back-calculation, $T_t = 0.5\,\mathrm{s}$ | $4.2\%$ | $11.6\,\mathrm{s}$ | $2.77\,\mathrm{s}$ |

Sanity check on the lower bound: at full torque the wheel changes the body rate at $u_{max}/J = 0.01\,\mathrm{rad/s^2}$, so reaching $0.05\,\mathrm{rad/s}$ from rest takes at least $5\,\mathrm{s}$ of saturated effort. Every row is consistent with that — the unprotected loop stays saturated for $7.18\,\mathrm{s}$ because it drives well past the target, and the protected loops come off the stop early and finish linearly.

And on the tuning parameter: back-calculation at $T_t = T_i = 2.8\,\mathrm{s}$ gives $15.1\%$ overshoot rather than $4.2\%$. The mechanism is only as good as the tracking constant, which is precisely the trade clamping avoids by having none.
:::

## Why the derivative is filtered, and the better answer

The complete answer has four parts and most candidates give one.

**It is not realisable.** The ideal $k_ds$ is improper — its magnitude grows without bound with frequency — so it cannot be built, only approximated.

**It amplifies noise.** Because gain rises with frequency, a differentiator hands the actuator the highest-frequency content of the measurement preferentially, and for a real sensor that is noise. Quantify it and the point lands: differencing a position measurement with resolution $q$ over a sample period $T$ produces a rate error of order $q/T$. An encoder with $0.01^\circ$ resolution read at $100\,\mathrm{Hz}$ gives rate noise of order $1^\circ/\mathrm{s}$ — which can be ten times the rate you are trying to control. Sample faster and it gets *worse*, which is the opposite of the intuition.

**Derivative kick.** If the derivative acts on the error rather than on the measurement, a step in the command differentiates to an impulse into the actuator. This is a separate defect from noise and has a separate fix: differentiate the measurement only, never the command. The loop transfer function is unchanged, so every stability margin is unchanged.

**The fix, and the better fix.** Replace $k_ds$ with a filtered derivative,

$$\frac{k_dNs}{s + N},$$

which differentiates below the pole at $N$ and flattens to a finite high-frequency gain of $k_dN$ above it, so the controller's total high-frequency gain is bounded by $k_p + k_dN$. Choosing $N$ is a real trade: the filter itself adds lag at crossover of $\arctan(\omega_{gc}/N)$, so a pole a decade above crossover costs $\arctan(0.1) = 5.71^\circ$ while a pole at twice crossover costs $\arctan(0.5) = 26.6^\circ$ — which is most of a phase margin, spent to filter noise.

The better fix, where it exists: on a spacecraft or a launch vehicle you usually do not have to differentiate anything, because you have a rate gyro. Feed back measured rate and the damping term arrives directly, with no differentiation and no noise amplification. That is the answer interviewers most want to hear, because it is what is actually done, and it reframes the question: the only reason to differentiate a position signal is that the rate is not measured.

::: warning Two conventions share the letter $N$
In the parallel form above, $N$ is a frequency in rad/s and the filter pole sits at $N$. In the ISA form the same filter is written $T_ds/\left(1 + (T_d/N)s\right)$ with $N$ dimensionless — typically $10$ to $20$ — and the pole sits at $N/T_d$ rad/s. The algebra is identical; the number means different things. Check which a specification intends before choosing $N = 15$.
:::

## A defensible tuning approach

"How would you tune it?" is a question about process, and the defensible answer has three stages in a fixed order.

**Write the specification first.** A tuning method answers a question and you have to ask one. Four items: a speed requirement (a rise time or a closed-loop bandwidth, usually inherited from the outer loop or the guidance update rate, with $t_r\omega_{bw} \approx 1.8$ converting between them); stability margins, meaning at least $6\,\mathrm{dB}$ of gain margin and $30^\circ$ to $45^\circ$ of phase margin, more where the plant is poorly known; a ceiling set by the actuator and the sensor noise, since bandwidth you cannot actuate or can only actuate on noise is not bandwidth; and a disturbance-rejection requirement, which is what decides whether you need the integral at all.

**Then choose a method to hit it.** *Loop shaping* works directly from the specification: pick the crossover frequency from the speed requirement, then require the controller to supply exactly the magnitude and phase the plant lacks at that one frequency. *Pole placement* inverts a different question: write the closed-loop characteristic polynomial symbolically, write the polynomial you want, match coefficients. *Ziegler–Nichols* needs no model at all — raise $k_p$ until the closed loop oscillates at constant amplitude, record the ultimate gain $K_u$ and period $T_u$, and take $k_p = 0.6K_u$, $T_i = 0.5T_u$, $T_d = 0.125T_u$ for the classic PID. It is deliberately aggressive, roughly quarter-decay, and is a starting point rather than a delivered design.

**Then verify, and say how.** Margins, including the delay margin against the actual latency budget. A step response simulated *with the actuator limit in the loop*, because a design verified only in the linear region has not been verified. Noise injected at the sensor, to see what the derivative path does to actuator duty. And a sweep over plant uncertainty — inertia, control effectiveness, a flexible mode's frequency — because a margin computed at nominal is a margin for one vehicle.

::: key A tuning answer that survives a follow-up
Specification first (speed, margins, actuator and noise ceiling, disturbance rejection); then a method that targets it (loop shaping at the chosen crossover, pole placement from a model, Ziegler–Nichols only as a starting point); then verification that includes the delay margin, a simulation with the actuator limit engaged, sensor noise, and a sweep over plant uncertainty. Naming a method without a specification is the weak answer, because the method cannot be evaluated against anything.
:::

::: example "Our attitude loop overshoots badly and takes forever to settle, but only on large slews. What is wrong?"
**A weak answer:** "That sounds like the gains are too high. I would reduce the proportional gain, or add more derivative to damp it."

The size dependence has been ignored, and the prescription would make the loop slower everywhere in order to fix a problem that only exists at large amplitude.

**A strong answer:**

"The size dependence is the whole clue, so let me start there. If it behaves on small steps and not on large ones, the difference between the two cases is almost certainly that the large one saturates an actuator and the small one does not — a linear defect would show at every amplitude, scaled.

So my first hypothesis is integrator windup. The mechanism: while the wheel is at its torque limit the loop is effectively open, but the integrator keeps accumulating error, and that stored value has to unwind before the command comes back inside the limit. The actuator stays hard over past the point where it should have eased off, so you overshoot, and then the settle is slow because you are waiting for the integral to discharge.

To confirm it before changing anything I would log the commanded torque alongside the delivered torque and the integrator state on a large slew. If the command sits at the limit for seconds and the integrator keeps climbing during that time, that is windup and nothing else looks like it.

Two remedies. Conditional integration: stop updating the integrator while the output is saturated and the error is still pushing it further in. It is trivial to implement and has no tuning parameter, so it is where I would start. Back-calculation: feed the difference between the delivered and commanded output back into the integrator through a tracking gain, so the integrator tracks what the actuator can actually do. It is smoother when the tracking constant is chosen well and worse than clamping when it is not.

The other candidates I would rule out on the same evidence: a rate limit rather than a torque limit on the actuator produces a similar size dependence, and if the slew command is a step rather than a shaped profile then the right fix is upstream of the controller entirely — command a trapezoidal rate profile the wheel can actually follow, and the actuator never saturates in the first place. That is usually the better engineering answer than making the controller good at recovering from an avoidable saturation."

**What the interviewer learns:** the candidate reads the diagnostic clue, gives the mechanism rather than the name, proposes a measurement that would confirm it before touching the code, offers both standard remedies with the trade between them, and then points out that the best fix may be to stop saturating the actuator at all. That last move is the one that distinguishes an engineer from someone who has memorised the anti-windup section.
:::

## Check yourself

::: check
A loop has a steady-state offset against a constant disturbance. Give two ways to reduce it and the cost of each.
:::

::: answer
For a plant with no integrator of its own, the offset under proportional control is the disturbance divided by $k_p$. Raising $k_p$ reduces it proportionally, at the cost of raising the loop bandwidth — which consumes phase margin, demands more actuator authority, and pushes crossover toward any flexible mode or sensor noise floor. Adding integral action drives the offset to zero exactly, at the cost of up to $90^\circ$ of phase lag near crossover, which eats stability margin directly, and of windup whenever the actuator saturates, which requires an explicit anti-windup scheme. The right answer to which one to use is a requirements question: if the residual offset is inside the pointing budget, neither cost is worth paying.
:::

::: check
Describe the mechanism of integral windup precisely enough that someone could reproduce it in simulation, and name the one observation that distinguishes it from simply having too much gain.
:::

::: answer
Put a saturating actuator between the controller and the plant. Command a setpoint step large enough that $k_pe$ at the initial error exceeds the actuator limit. While the delivered effort is pinned at the limit, the plant's input no longer depends on the error, so the loop is open; but the integrator keeps accumulating $e\,dt$ at its normal rate, so its stored value grows throughout the saturated interval. When the output finally reaches the setpoint the error changes sign, but the commanded effort is still above the limit because of the stored integral, so the actuator stays hard over until the integral has been driven back down. The result is large overshoot and a long settle. The distinguishing observation is amplitude dependence: too much gain degrades the response at *every* amplitude, whereas windup leaves small steps untouched and ruins large ones.
:::

::: check
Give the two standard anti-windup remedies, the tuning parameter each needs, and one reason to prefer each over the other.
:::

::: answer
Conditional integration clamps the integrator while the output is saturated and the error is driving further into saturation. It has no tuning parameter, which is its main advantage: nothing to get wrong and nothing to re-tune when the actuator limit changes. Back-calculation feeds $(u_{sat} - u)$ back into the integrator input through a tracking gain $1/(k_iT_t)$, so the integrator is pulled toward the value that would make the command exactly equal the limit. It needs the tracking time constant $T_t$, typically $\sqrt{T_iT_d}$ for a PID or a fraction of $T_i$ for a PI. Prefer back-calculation when the transition off the stop needs to be smooth and you are willing to tune $T_t$ — in the worked example it gave $4.2\%$ overshoot against clamping's $6.0\%$ when $T_t$ was chosen well, and $15.1\%$ when it was not. Prefer clamping when you want a remedy with no parameter to defend at a review.
:::

::: check
Why does sampling faster make a differenced rate estimate noisier rather than cleaner, and what does that imply about the filter pole?
:::

::: answer
A position measurement carries a fixed resolution $q$ — from quantisation, or from the sensor's own noise floor. Differencing two such readings separated by $T$ gives a rate error of order $q/T$, so shrinking $T$ to get a faster loop directly increases the rate noise. The implication for the filter is that its pole cannot simply be pushed high: the higher the pole, the more of that noise reaches the actuator, and the high-frequency gain of the derivative path is $k_dN$. But lowering the pole costs phase at crossover, $\arctan(\omega_{gc}/N)$, which is $5.71^\circ$ for a pole a decade above crossover and $26.6^\circ$ for a pole at twice crossover. The pole placement is that trade and nothing else, which is why the real answer on a vehicle with a rate gyro is not to differentiate at all.
:::

::: check
An interviewer asks how you would tune a PID and you answer "Ziegler–Nichols". What is the follow-up, and what should have been said first?
:::

::: answer
The follow-up is some version of "against what requirement?" — and there is no good answer to it, because Ziegler–Nichols does not take a requirement as input. It produces a deliberately aggressive, roughly quarter-decay response from two measured numbers, $K_u$ and $T_u$, and its classic PID settings typically leave a phase margin well below aerospace practice. What should have come first is the specification: the speed requirement, the margin requirement, the actuator and noise ceiling, and whether a steady-state offset is acceptable at all. With those written down, Ziegler–Nichols is a perfectly respectable way to get a starting point on a plant you have no model for, and the rest of the answer is how you would move from that starting point to something that meets the margins and how you would verify it with the actuator limit in the loop.
:::

## Summary

| Item | Content |
| --- | --- |
| Parallel and ISA forms | $k_p + k_i/s + k_ds$; $k_p(1 + 1/(T_is) + T_ds)$ with $T_i = k_p/k_i$, $T_d = k_d/k_p$ |
| P, I, D | Stiffness and bandwidth, offset remains; removes offset, costs up to $90^\circ$ lag and adds windup; damping and lead, amplifies noise |
| Windup | Loop open while saturated, integrator keeps accumulating, must unwind; tell is amplitude dependence |
| Conditional integration | Clamp while saturated and the error pushes further in; no tuning parameter |
| Back-calculation | $\dot I = e + (u_{sat}-u)/(k_iT_t)$; $T_t \approx \sqrt{T_iT_d}$ for a PID |
| Worked example | $53.2\%$ overshoot unprotected, $6.0\%$ clamped, $4.2\%$ back-calculated at $T_t = 0.5\,\mathrm{s}$ |
| Filtered derivative | $k_dNs/(s+N)$; high-frequency gain $k_dN$; filter lag at crossover $\arctan(\omega_{gc}/N)$ |
| Differencing noise | Rate error of order $q/T$; worse as sampling gets faster |
| Tuning process | Specification, then method (loop shaping, pole placement, Ziegler–Nichols as a start), then verification with saturation, noise and plant uncertainty |

That is the control half of this module. The next lesson opens the estimation half with the equations this module's exercises ask you to be able to write cold: the linear Kalman filter, predict and update.
