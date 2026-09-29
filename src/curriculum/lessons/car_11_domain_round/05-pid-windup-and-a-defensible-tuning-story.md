---
id: l05-pid-windup-and-a-defensible-tuning-story
title: "PID: structure, windup, filtered derivative, and a tuning story"
minutes: 22
covers:
  - "PID structure, integral windup and anti-windup, derivative filtering, and a defensible tuning approach"
---

Steer a bike toward a line painted on the road. You turn harder the farther off you are. If a steady crosswind pushes you aside, you lean into it a little more each second until you stop drifting. If you are swinging toward the line fast, you ease off early so you do not shoot past. Those three habits — react to how far off you are, to how long you have been off, and to how fast you are closing — are the three terms of a **PID controller** (said "P-I-D", for proportional, integral, derivative).

PID runs attitude, thermal, valve, pump and tank-pressure loops, so an interviewer can ask it of anyone. Almost everyone knows the letters. Few can say what each term costs, diagnose windup from a symptom, give two remedies with their mechanisms, explain why the derivative is never built as a pure derivative, and describe a tuning process they would defend at a **[[design review|design-review]]**. This lesson covers all five.

## The three terms, and what each one costs

Here is the **parallel form** of the controller:

$$
C(s) = k_p + \frac{k_i}{s} + k_d s
$$

Here $e$ is the **error** (target minus measurement), $u = C(s)e$ is the commanded actuator effort, and $k_p$, $k_i$, $k_d$ are the proportional, integral and derivative gains. Dividing by $s$ means "add up over time"; multiplying by $s$ means "take the rate of change".

The **standard form**, also called the **[[ISA form|isa-form]]**, is the same controller with different knobs:

$$
C(s) = k_p\left(1 + \frac{1}{T_i s} + T_d s\right)
$$

The **integral time** is $T_i = k_p/k_i$ and the **derivative time** is $T_d = k_d/k_p$, both in seconds. Say which form you mean before quoting numbers; gains sensible in one are nonsense in the other.

**Proportional** is stiffness, like a spring. It reacts to the error now, sets the **bandwidth** (how fast the loop responds), and against a constant disturbance leaves a leftover error. For a plant with no integrator of its own, that leftover is the disturbance divided by $k_p$.

**Integral** removes that leftover. It costs a pole at the origin and up to $90^\circ$ of phase lag near crossover, straight out of the phase margin from the last two lessons. It also brings a new failure: windup.

**Derivative** is damping, like a shock absorber. It acts on how fast the error is changing, so it adds phase lead and lets you raise $k_p$ without ringing. In the ISA form it is a prediction: the controller acts on the error it expects $T_d$ seconds from now. It costs noise amplification, because its gain rises with frequency.

::: key What each PID term buys and costs
**P**: stiffness, responds to the present error, sets bandwidth, leaves a steady-state offset. **I**: removes the steady-state offset to a constant disturbance, adds a pole at the origin and up to $90^\circ$ of lag near crossover, and introduces windup. **D**: damping, predicts the error $T_d = k_d/k_p$ seconds ahead, adds phase lead, amplifies sensor noise. Parallel form $k_p + k_i/s + k_ds$; ISA form $k_p(1 + 1/(T_is) + T_ds)$ with $T_i = k_p/k_i$, $T_d = k_d/k_p$.
:::

## Integral windup

Picture filling a bathtub while the tap is already fully open. You shout "more water!" every second, and a helper writes each shout on a tally sheet. The tap cannot open further, so the shouts change nothing. But when the tub reaches the line, the helper still has a huge tally and keeps the tap wide open until it is crossed off. The tub overflows.

That is **integral windup**. Every real actuator has a limit — its **[[saturation|saturation]]** point. A **[[reaction wheel|reaction-wheel]]** has a maximum torque. A gimbal has a travel stop and a rate limit. A valve cannot open past fully open. When the controller asks for more than the actuator can give, the loop is effectively **open**: the plant gets a fixed input that no longer depends on the error.

The integrator does not know this. It keeps adding up error, so by the time the vehicle reaches the target it holds a large stored value. That value must be **unwound** — driven back down by error of the opposite sign — before the command can come off the limit. So the actuator stays hard over past the point where it should have backed off, and the vehicle sails past the target.

The clue: **the problem depends on size**. Small commands never saturate and behave as designed. Large ones saturate, wind up, overshoot badly and settle slowly. A loop that passes unit testing and misbehaves on its first large turn is the classic case.

::: key Integral windup
While the actuator is saturated the loop is open, but the integrator keeps accumulating error. The stored integral must then unwind before the commanded output leaves saturation, producing large overshoot and a long, slow settle after a big setpoint change. The tell is that small steps behave perfectly and large ones do not.
:::

## Two remedies, with their mechanisms

**Conditional integration**, also called clamping. Stop updating the integrator while the output is saturated *and* the error would push it further in. Two lines of code, no tuning parameter, the right default. Keep integrating once the error reverses sign — then integration helps you come off the limit.

**Back-calculation**, also called tracking. Instead of freezing the integrator, feed it the gap between what the actuator was asked for and what it delivered. With $u$ the unlimited command and $u_{sat}$ (read "u sat") the delivered one, the integrator's input $I$ changes at the rate

$$
\dot{I} = e + \frac{u_{sat} - u}{k_i T_t}
$$

Read $\dot{I}$ as "I dot", the rate of change of $I$. Whenever the actuator is saturated, $u_{sat} - u$ is not zero, and this extra term pulls the integrator toward the value that makes the command exactly equal the limit. The tuning parameter is the **tracking time constant** $T_t$, which sets how hard that pull is. A common starting point for a full PID is $T_t \approx \sqrt{T_iT_d}$; for a PI loop, somewhere between a fraction of $T_i$ and $T_i$ itself. Done well, it is smoother than clamping: the integrator lands at the right value, not wherever it froze.

Two more to name if the follow-up goes there. In a **[[cascade|cascade]]**, the inner loop's saturation should be reported to the outer loop's integrator by the same tracking idea. And any controller that can be switched in or out needs the same machinery for **[[bumpless transfer|bumpless-transfer]]**, because a mode change looks like a sudden saturation to the integrator.

::: example Windup, and both remedies, with numbers
A small satellite's rate loop. The moment of inertia about the axis is $J = 10\,\mathrm{kg\,m^2}$, and the plant is $\dot\omega = u/J$: torque divided by inertia gives angular acceleration. The PI controller is designed for natural frequency $\omega_n = 0.5\,\mathrm{rad/s}$ and damping $\zeta = 0.7$:

- $k_i = J\omega_n^2 = 10 \times 0.25 = 2.5$
- $k_p = 2\zeta\omega_nJ = 2 \times 0.7 \times 0.5 \times 10 = 7.0$
- integral time $T_i = k_p/k_i = 7.0/2.5 = 2.8\,\mathrm{s}$

The reaction wheel saturates at $0.1\,\mathrm{N\,m}$.

**The small command.** Ask for $0.01\,\mathrm{rad/s}$. The first demand is $k_pe = 7.0 \times 0.01 = 0.07\,\mathrm{N\,m}$ — inside the limit. Overshoot is $21.0\%$ and settling to within $2\%$ takes $9.76\,\mathrm{s}$. All three schemes below give the same result, since none acts while the actuator is in range.

(The $21\%$ is not windup. It comes from the zero at $-k_i/k_p = -2.5/7.0 = -0.357\,\mathrm{rad/s}$ that a PI acting on the error puts in the command path. Do not blame the wrong thing.)

**The large command.** Ask for $0.05\,\mathrm{rad/s}$. The first demand is $7.0 \times 0.05 = 0.35\,\mathrm{N\,m}$, three and a half times the limit.

| Scheme | Overshoot | $2\%$ settling | Time saturated |
| --- | --- | --- | --- |
| No anti-windup | $53.2\%$ | $18.5\,\mathrm{s}$ | $7.18\,\mathrm{s}$ |
| Conditional integration | $6.0\%$ | $11.7\,\mathrm{s}$ | $3.57\,\mathrm{s}$ |
| Back-calculation, $T_t = 0.5\,\mathrm{s}$ | $4.2\%$ | $11.6\,\mathrm{s}$ | $2.77\,\mathrm{s}$ |

**Sanity check.** At full torque the wheel changes the body rate by $u_{max}/J = 0.1/10 = 0.01\,\mathrm{rad/s^2}$. Reaching $0.05\,\mathrm{rad/s}$ from rest therefore takes at least $0.05/0.01 = 5\,\mathrm{s}$ of full effort. The unprotected loop stays saturated $7.18\,\mathrm{s}$ — longer, because it drives past the target. The protected loops leave the limit early and finish in the linear range.

**The tuning parameter matters.** Back-calculation with $T_t = T_i = 2.8\,\mathrm{s}$ gives $15.1\%$ overshoot, not $4.2\%$ — the risk clamping avoids by having no parameter.
:::

## Why the derivative is filtered, and the better answer

The complete answer has four parts; most give one.

**It cannot be built.** The ideal $k_ds$ is **improper**: its size grows without limit as frequency rises. You can only approximate it.

**It amplifies noise.** Its gain rises with frequency, so it hands the actuator the fastest wiggles in the measurement — mostly noise. In numbers: Differencing a position reading with resolution $q$ over a sample period $T$ gives a rate error of about $q/T$. An **[[encoder|encoder]]** with $0.01^\circ$ resolution read at $100\,\mathrm{Hz}$ ($T = 0.01\,\mathrm{s}$) gives rate noise of about $0.01/0.01 = 1^\circ/\mathrm{s}$. That can be ten times the rate you are trying to control. Sample faster and it gets *worse*.

**Derivative kick.** If the derivative acts on the error, a command step becomes a spike (an impulse) into the actuator. Separate problem, separate fix: differentiate the measurement only, never the command. The loop transfer function, and so every margin, is unchanged.

**The fix, and the better fix.** Replace $k_ds$ with a filtered derivative:

$$
\frac{k_dNs}{s + N}
$$

Below the pole at $N$ this acts like a derivative. Above it, it flattens to a finite gain of $k_dN$. So the whole controller's high-frequency gain is capped at $k_p + k_dN$. Choosing $N$ is a real trade, because the filter adds its own lag at crossover of $\arctan(\omega_{gc}/N)$:

- pole a decade above crossover: $\arctan(0.1) = 5.71^\circ$ of lag;
- pole at twice crossover: $\arctan(0.5) = 26.6^\circ$ — most of a phase margin, spent filtering noise.

The better fix, where it exists: on a spacecraft or launch vehicle you usually do not need to differentiate anything, because you have a **[[rate gyro|rate-gyro]]**. Feed back the measured rate and the damping term arrives directly, with no differentiation and no noise amplification. That is what is actually done, and it reframes the question: the only reason to differentiate position is that rate is not measured.

::: key Why filter the derivative
An ideal derivative has gain proportional to frequency, so it amplifies sensor noise without bound and can saturate the actuator on noise alone. Practical implementations use a filtered derivative, $k_dNs/(s+N)$, with a finite high-frequency gain $k_dN$.
:::

::: warning Two conventions share the letter $N$
In the parallel form above, $N$ is a frequency in rad/s and the filter pole sits at $N$. In the ISA form the same filter is written $T_ds/\left(1 + (T_d/N)s\right)$ with $N$ dimensionless — typically $10$ to $20$ — and the pole sits at $N/T_d$ rad/s. The algebra is identical; the number means different things. Check which a specification intends before choosing $N = 15$.
:::

## A defensible tuning approach

"How would you tune it?" is a question about process — like a recipe, it only makes sense once you say what you are baking. The defensible answer has three stages, in order.

**1. Write the specification first.** A method answers a question, so ask one. Four items:

- a **speed requirement** — a rise time $t_r$ or a closed-loop bandwidth $\omega_{bw}$, usually inherited from the outer loop or the guidance update rate, with $t_r\omega_{bw} \approx 1.8$ converting between them;
- **stability margins** — at least $6\,\mathrm{dB}$ of gain margin and $30^\circ$ to $45^\circ$ of phase margin, more where the plant is poorly known;
- a **ceiling** set by the actuator and sensor noise, since bandwidth you cannot actuate, or can only actuate on noise, is not bandwidth;
- a **disturbance-rejection requirement**, which decides whether you need the integral at all.

**2. Then choose a method that hits it.**

- *Loop shaping* works straight from the specification. Pick the crossover frequency from the speed requirement, then make the controller supply exactly the magnitude and phase the plant lacks at that one frequency.
- *Pole placement* asks a different question. Write the closed-loop characteristic polynomial with the gains as unknowns, write the polynomial you want, and match coefficients.
- *[[Ziegler–Nichols|ziegler-nichols]]* needs no model. Raise $k_p$ until the closed loop oscillates at constant amplitude. Record that **ultimate gain** $K_u$ and the oscillation period $T_u$. The classic PID settings are $k_p = 0.6K_u$, $T_i = 0.5T_u$, $T_d = 0.125T_u$. They are deliberately aggressive — roughly **quarter-decay**, each swing a quarter the size of the last — and are a starting point, not a finished design.

**3. Then verify, and say how.**

- Margins, including the delay margin against the real latency budget.
- A step response simulated *with the actuator limit in the loop* — a design checked only in the linear range has not been checked.
- Noise injected at the sensor, to see what the derivative path does to the actuator.
- A sweep over plant uncertainty — inertia, control effectiveness, a **[[flexible mode|flexible-mode]]**'s frequency — because a margin computed at nominal is a margin for one vehicle.

::: key A tuning answer that survives a follow-up
Specification first (speed, margins, actuator and noise ceiling, disturbance rejection); then a method that targets it (loop shaping at the chosen crossover, pole placement from a model, Ziegler–Nichols only as a starting point); then verification that includes the delay margin, a simulation with the actuator limit engaged, sensor noise, and a sweep over plant uncertainty. Naming a method without a specification is the weak answer, because the method cannot be evaluated against anything.
:::

::: example "Our attitude loop overshoots badly and takes forever to settle, but only on large slews. What is wrong?"
**A weak answer:** "That sounds like the gains are too high. I would reduce the proportional gain, or add more derivative to damp it."

This ignores the size clue, slowing the loop everywhere to cure a large-size problem.

**A strong answer:**

"The size dependence is the whole clue. If it behaves on small steps and not large ones, the difference is almost certainly that the large one saturates an actuator. A linear defect would show at every size, scaled.

So my first guess is integrator windup. While the wheel sits at its torque limit the loop is effectively open, but the integrator keeps accumulating error. That stored value has to unwind before the command comes back inside the limit. The actuator stays hard over too long, so you overshoot, and the settle is slow because you are waiting for the integral to drain.

Before changing anything, I would log commanded torque, delivered torque and the integrator state on a large slew. A command pinned at the limit for seconds while the integrator climbs is windup; nothing else looks like it.

Two remedies. Conditional integration: stop updating the integrator while the output is saturated and the error still pushes further in. It is easy to implement and has no tuning parameter, so I would start there. Back-calculation: feed the delivered-minus-commanded difference back into the integrator through a tracking gain, so it tracks what the actuator can really do. Smoother when the tracking constant is well chosen, worse than clamping when it is not.

I would also rule out an actuator rate limit, which looks similar. And if the slew command is a step, the right fix is upstream of the controller: command a **[[trapezoidal rate profile|trapezoid-profile]]** the wheel can follow, and it never saturates at all. That is usually better engineering than making the controller good at recovering from an avoidable saturation."

**What the interviewer learns:** the candidate reads the clue, gives the mechanism rather than the name, proposes a measurement to confirm it before touching code, offers both remedies with their trade, and then points out that the best fix may be to stop saturating the actuator. That last move is what separates an engineer.
:::

## Check yourself

::: check
A loop has a steady-state offset against a constant disturbance. Give two ways to reduce it and the cost of each.
:::

::: answer
For a plant with no integrator of its own, the offset under proportional control is the disturbance divided by $k_p$. **Raising $k_p$** shrinks it in proportion, but raises the bandwidth. That uses up phase margin, demands more actuator authority, and pushes crossover toward any flexible mode or sensor noise floor. **Adding integral action** drives the offset to exactly zero, but costs up to $90^\circ$ of phase lag near crossover, which eats margin directly, and brings windup whenever the actuator saturates, which needs an explicit anti-windup scheme. Which to use is a requirements question: if the offset fits the pointing budget, pay neither cost.
:::

::: check
Describe the mechanism of integral windup precisely enough that someone could reproduce it in simulation, and name the one observation that tells it apart from having too much gain.
:::

::: answer
Put a saturating actuator between controller and plant, and command a step big enough that $k_pe$ at the starting error exceeds the limit. While the effort is pinned at the limit, the plant's input ignores the error, so the loop is open — but the integrator keeps adding $e\,dt$, growing through the whole saturated stretch. When the output reaches the setpoint, the error changes sign — yet the command is still above the limit because of the stored integral. The actuator stays hard over until the integral has been driven back down. Result: large overshoot and a long settle. The telling observation is size dependence. Too much gain spoils the response at *every* size; windup leaves small steps alone and ruins large ones.
:::

::: check
Give the two standard anti-windup remedies, the tuning parameter each needs, and one reason to prefer each over the other.
:::

::: answer
**Conditional integration** clamps the integrator while the output is saturated and the error pushes further into saturation. Its advantage is no tuning parameter: nothing to get wrong or re-tune when the limit changes. **Back-calculation** feeds $(u_{sat} - u)$ into the integrator's input through a tracking gain $1/(k_iT_t)$, pulling the integrator toward the value that makes the command exactly equal the limit. It needs the tracking time constant $T_t$, typically $\sqrt{T_iT_d}$ for a PID or a fraction of $T_i$ for a PI. Prefer back-calculation when coming off the limit must be smooth and you are willing to tune $T_t$: in the worked example it gave $4.2\%$ overshoot against clamping's $6.0\%$ with a good $T_t$, and $15.1\%$ with a poor one. Prefer clamping when you want a remedy with no parameter to defend at a review.
:::

::: check
Why does sampling faster make a differenced rate estimate noisier rather than cleaner, and what does that mean for the filter pole?
:::

::: answer
A position reading carries a fixed resolution $q$, from quantization or the sensor's own noise floor. Differencing two readings $T$ apart gives a rate error of about $q/T$, so shrinking $T$ for a faster loop directly raises the rate noise. So the filter pole cannot be pushed high freely: the higher the pole, the more of that noise reaches the actuator, since the derivative path's high-frequency gain is $k_dN$. But lowering the pole costs phase at crossover, $\arctan(\omega_{gc}/N)$ — $5.71^\circ$ for a pole a decade above crossover, $26.6^\circ$ for a pole at twice crossover. Placing the pole is that trade — which is why, with a rate gyro, you do not differentiate at all.
:::

::: check
An interviewer asks how you would tune a PID and you answer "Ziegler–Nichols". What is the follow-up, and what should you have said first?
:::

::: answer
The follow-up is some version of "against what requirement?" — and there is no good answer, because Ziegler–Nichols does not take a requirement as input. It produces a deliberately aggressive, roughly quarter-decay response from two measured numbers, $K_u$ and $T_u$, and its classic PID settings usually leave a phase margin well below aerospace practice. What should come first is the specification: the speed requirement, the margin requirement, the actuator and noise ceiling, and whether a steady-state offset is acceptable at all. Then Ziegler–Nichols is a respectable starting point on a plant with no model, and the rest of the answer is how you reach the margins from there and verify with the actuator limit in the loop.
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

That is the control half of this module. The next lesson opens the estimation half with the equations you must be able to write cold: the linear Kalman filter, predict and update.

::: context design-review What a design review is
A **design review** is a meeting where a team presents its design to experienced engineers whose job is to find holes in it. NASA projects pass through a fixed series of them, such as the Preliminary Design Review and the Critical Design Review, before hardware is built. A reviewer will ask "why that gain?" and "what happens when the actuator saturates?" A *defensible* tuning is one where every choice traces back to a written requirement and a check you ran — not to "it looked good in the plot".
:::

::: context isa-form Where the "ISA" name comes from
ISA (said "I-S-A") is the International Society of Automation, which began as the Instrument Society of America. It is a professional body for the process-control industry — refineries, chemical plants, power stations — where PID controllers have run valves and heaters for decades. Industrial controllers are commonly set up with a proportional gain, an integral time and a derivative time, and that way of writing PID is widely called the ISA form. Aerospace texts more often use the parallel form. Neither is more correct; they are the same controller with different dials.
:::

::: context saturation What saturation looks like
An actuator follows the command faithfully up to its limit, then stays flat no matter how much more you ask for. Everything to the right of the corner is where windup happens: the command keeps rising, the delivered torque does not.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="140" y2="60" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="140" y1="60" x2="180" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="40,160 140,60 330,60"/>
  <rect x="140" y="20" width="195" height="135" fill="#f2b880" opacity="0.25"/>
  <line x1="36" y1="60" x2="44" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34" y="64" font-size="11" text-anchor="end" fill="#1f2a44">limit</text>
  <text x="190" y="176" font-size="11" text-anchor="middle" fill="#1f2a44">commanded torque u</text>
  <text x="48" y="28" font-size="11" fill="#1f2a44">delivered u_sat</text>
  <text x="238" y="100" font-size="12" text-anchor="middle" fill="#b4232c">saturated:</text>
  <text x="238" y="116" font-size="12" text-anchor="middle" fill="#b4232c">loop is open</text>
</svg>
```
:::

::: context reaction-wheel How a reaction wheel turns a spacecraft
A **reaction wheel** is a heavy flywheel spun by an electric motor inside the spacecraft. Speed the wheel up one way, and the spacecraft turns the other way, because the total spin of the two together cannot change. The motor can only push so hard, so the torque has a maximum — often a fraction of a newton-meter on a small satellite, like the $0.1\,\mathrm{N\,m}$ in this lesson's example. That maximum is the saturation limit windup is about.
:::

::: context cascade Loops inside loops
A **cascade** is one controller feeding another. On a spacecraft, an outer attitude loop decides "turn at this rate", and an inner rate loop decides "apply this torque to get that rate". The inner loop is faster; the outer one gives it targets. If the inner loop saturates, the outer loop's integrator is being ignored too — so it also needs to be told, or it winds up one level higher.
:::

::: context bumpless-transfer Switching controllers without a jolt
Suppose a vehicle switches from a coarse "detumble" controller to a fine "pointing" controller. If the new controller's integrator starts from zero, its output jumps the instant it takes over, and the actuator gets a kick. **Bumpless transfer** sets the incoming integrator so that its first output matches what the actuator was already doing. It is the same idea as back-calculation: make the integrator agree with what the actuator is really delivering.
:::

::: context encoder What an encoder measures
An **encoder** reports an angle in fixed steps, like a dial with clicks. With $0.01^\circ$ steps, a shaft that turns $0.004^\circ$ may read no change, then jump a full step. Subtract two readings and divide by the sample time, and each click turns into a sudden rate spike. That is quantization noise, and the faster you sample, the bigger each spike looks in rate.
:::

::: context rate-gyro Measuring rate directly
A **rate gyro** (short for gyroscope) measures how fast the vehicle is turning, directly, in degrees or radians per second. Old ones used a spinning mass; modern ones use vibrating structures, laser light running around a loop, or light in a coil of optical fiber. Because it measures rate itself, a gyro gives the damping term with no subtraction of noisy positions. Almost every spacecraft and launch vehicle carries gyros for exactly this reason, and they come back later in this module, in the strapdown IMU lesson.
:::

::: context ziegler-nichols The 1942 rule of thumb
John Ziegler and Nathaniel Nichols published their tuning rules in 1942, working on industrial process controllers. The appeal was that a technician could tune a loop on a real plant with no mathematical model: turn up the gain until it oscillates steadily, time the oscillation, and read the settings off a table. Their target was a response where each overshoot is about a quarter of the one before — lively, fine for many factory loops, and more aggressive than most aerospace margin requirements allow.
:::

::: context flexible-mode When the vehicle bends
A real rocket or solar-array-laden satellite is not rigid. It can bend and vibrate at particular frequencies, called **flexible modes** or bending modes. A long launch vehicle might have its first bending mode at a few hertz. If the control loop's crossover gets too close to that frequency, the controller can pump energy into the bending, the way pushing a swing at the right moment makes it go higher. That is why bandwidth has a ceiling.
:::

::: context trapezoid-profile Asking only for what the wheel can give
To turn through a given angle, a step command jumps straight to the cruise rate and back. A shaped command ramps the rate up at the wheel's maximum acceleration, holds, then ramps down. For this lesson's satellite, full torque gives $0.01\,\mathrm{rad/s^2}$, so each ramp to or from $0.05\,\mathrm{rad/s}$ takes $5\,\mathrm{s}$. Both shapes below enclose the same area, so they turn through the same angle. The shaped one never asks for more than the actuator can do, so nothing saturates and nothing winds up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="120" x2="345" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="120" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4" points="60,120 60,40 240,40 240,120"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="50,120 60,120 140,40 240,40 320,120 340,120"/>
  <text x="44" y="44" font-size="11" text-anchor="end" fill="#1f2a44">0.05</text>
  <text x="44" y="124" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="100" y="100" font-size="11" fill="#1d6fd1">5 s ramp</text>
  <text x="286" y="100" font-size="11" fill="#1d6fd1">5 s ramp</text>
  <text x="66" y="30" font-size="11" fill="#6c7a93">step: saturates</text>
  <text x="200" y="30" font-size="11" fill="#1d6fd1">shaped: never saturates</text>
  <text x="195" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">time</text>
  <text x="195" y="154" font-size="11" text-anchor="middle" fill="#6c7a93">rate command, rad/s</text>
</svg>
```
:::
