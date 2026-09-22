---
id: l03-windup-anti-windup-and-mode-changes
title: Windup, anti-windup, bumpless transfer and setpoint weighting
minutes: 22
covers:
  - 'Integrator windup, anti-windup schemes, bumpless transfer, setpoint weighting'
---

Every actuator has a stop. A gimbal reaches its mechanical limit, a reaction wheel reaches its torque limit or its momentum limit, a thruster is either on or off, a valve is fully open. For most of a flight the loop never approaches those limits and the linear analysis of the previous lessons is exact. Then a gust arrives, or a stage separates, or the guidance system commands a large attitude change, and the actuator spends a second or two pinned. What happens during that second is not described by any transfer function, and it is where a great many real control failures live.

The specific failure is **integrator windup**, and it is worth being precise about the mechanism: while the actuator is saturated, the loop is *open*. The controller's output no longer influences the plant, so the error does not respond to it, so the integrator — which by construction keeps integrating until the error vanishes — accumulates a state that corresponds to a command the hardware was never able to deliver. When the vehicle finally catches up and the error changes sign, that accumulated state must be unwound before the actuator comes off the stop, and the vehicle sails past the setpoint while it does.

This lesson shows windup happening on the rate loop from the previous lessons, fixes it two ways, and then treats the two other places where a well-designed linear controller meets an awkward real world: switching between control modes without a jolt, and shaping the response to commands without disturbing the response to disturbances.

## Windup, on real numbers

Take the rate loop: $G(s) = 1/\bigl(Js(\tau s+1)\bigr)$ with $J = 1200\ \mathrm{kg\,m^2}$, $\tau = 0.02\ \mathrm{s}$, and the practical PID $k_p = 12\,000$, $k_i = 24\,000$, $k_d = 600$, $N = 15\ \mathrm{rad/s}$ — so $T_i = 0.5\ \mathrm{s}$ and $T_d = 0.05\ \mathrm{s}$. Limit the commanded torque to $\pm 300\ \mathrm{N\,m}$, which for a vehicle with $T\ell_T = 2000\ \mathrm{N\,m/rad}$ of control effectiveness is a gimbal limit of $0.15\ \mathrm{rad}$. Command a rate step of $0.2\ \mathrm{rad/s}$ ($11.5^\circ/\mathrm{s}$).

At $t = 0$ the proportional term alone asks for $12\,000 \times 0.2 = 2400\ \mathrm{N\,m}$, eight times what the actuator can deliver. The best the vehicle can do is $300/1200 = 0.25\ \mathrm{rad/s^2}$, so reaching $0.2\ \mathrm{rad/s}$ takes at least $0.8\ \mathrm{s}$. Throughout that time the error is large and positive, and a naive integrator integrates all of it.

::: example The same loop, three integrators
Simulating with a 0.2 ms step, derivative taken on the measurement:

| Integrator | overshoot | 2% settling | actuator pinned until | peak integrator state |
| --- | --- | --- | --- | --- |
| no saturation (reference) | 14.1% | 1.47 s | — | 496 N·m |
| naive | 53.8% | 2.52 s | 1.20 s | 2015 N·m |
| back-calculation, $T_t = 0.158\ \mathrm{s}$ | 0.30% | 1.19 s | 0.53 s | 10.5 N·m |
| conditional integration | 2.78% | 1.56 s | 0.67 s | 97.7 N·m |

The naive integrator climbs to $2015\ \mathrm{N\,m}$ — 6.7 times the torque the actuator can produce. That state is a request the hardware can never honour, and it keeps the actuator pinned for $1.20\ \mathrm{s}$: fully $0.4\ \mathrm{s}$ longer than the physics required, all of it spent on the wrong side of the setpoint. The rate overshoots to $0.308\ \mathrm{rad/s}$ ($17.6^\circ/\mathrm{s}$) against a commanded $0.2$.

Note the honest comparison. The saturation itself is not the problem: the unsaturated loop overshoots 14.1%, and the physics of a 300 N·m actuator makes some delay unavoidable. Anti-windup does not remove the limit; it stops the controller from making the limit worse. With back-calculation the loop settles *faster* than the unsaturated linear loop, because the saturation has acted as a rate limiter on the command.
:::

::: key
Integrator windup: while the actuator is saturated the loop is open, but the integrator keeps accumulating error. The state must then be unwound before the actuator comes off the stop, producing large overshoot and long settling.
:::

## Back-calculation

The cleanest fix asks the integrator to track what the actuator is actually doing rather than what the controller wishes it were doing. Measure (or compute) the saturated command $u_{sat}$, form the difference $u_{sat} - u$, and feed it back into the integrator through a gain $1/T_t$:

$$
\frac{dI}{dt} = k_i\,e + \frac{1}{T_t}\bigl(u_{sat} - u\bigr).
$$

When the actuator is not saturated the extra term is zero and the controller is exactly the PID you designed. When it saturates, the term is negative and large, and the integrator stops climbing and settles at whatever value keeps $u$ near the limit. Setting $dI/dt = 0$ gives the equilibrium $u = u_{sat} + k_iT_t\,e$: the integrator state now represents *the command the actuator is delivering*, which is the answer to "what does the integrator physically hold while saturated".

$T_t$ is the **tracking time constant**, and it sets how fast the integrator unwinds. The standard choice is $T_t = \sqrt{T_iT_d}$ for a PID and $T_t = T_i$ for a PI. Here $\sqrt{0.5\times0.05} = 0.158\ \mathrm{s}$.

| $T_t$ | overshoot | 2% settling | peak integrator state |
| --- | --- | --- | --- |
| 0.05 s | 0.14% | 1.33 s | 4.9 N·m |
| 0.158 s | 0.30% | 1.19 s | 10.5 N·m |
| 0.5 s | 10.1% | 1.90 s | 354 N·m |
| 2.0 s | 35.5% | 2.31 s | 1323 N·m |

A tracking constant much longer than $T_i$ is barely anti-windup at all. Making it very short is not free either: the saturation path is now a fast feedback around the actuator model, so any error in that model — an actuator that saturates a few per cent lower than you think, or a measured position with noise on it — is injected into the integrator at high gain.

::: key
Back-calculation anti-windup: feed $(u_{sat} - u_{cmd})$ back into the integrator input through gain $1/T_t$, with $T_t \sim \sqrt{T_iT_d}$. The integrator then tracks the achievable command instead of the impossible one.
:::

## Conditional integration

The alternative is to stop integrating while saturated:

$$
\frac{dI}{dt} = \begin{cases} k_i\,e, & u = u_{sat} \\[2pt] 0, & \text{otherwise.} \end{cases}
$$

Two lines of code, no extra parameter, and in the table above it gives 2.78% overshoot against the naive integrator's 53.8%. Its weakness is that it freezes the integrator wherever it happened to be rather than driving it to a sensible value, so the state at the moment of release is an accident of when saturation began — 97.7 N·m here, against back-calculation's 10.5 N·m. A refinement integrates whenever the error would move the command *away* from the limit, which avoids sticking, and a further refinement freezes only the integrator while leaving the derivative running.

For flight code with a single well-characterised saturation, back-calculation is the better-behaved choice and costs one gain. Conditional integration earns its place where the limit is not a clean saturation — a rate limit, a quantised command, a valve with hysteresis — and the difference $u_{sat} - u$ is not something you can honestly compute.

::: warning
Anti-windup is not a substitute for actuator authority. If the actuator is saturated for a significant fraction of the manoeuvre, the loop is not doing control, it is doing whatever the open-loop hardware does. Anti-windup makes the recovery clean; it does not make the vehicle faster. If saturation lasts longer than a few times your closed-loop time constant, the answer is a smaller command, a shaped command profile, or a bigger actuator.
:::

## Bumpless transfer

A flight control system switches. Manual to automatic on a test stand; attitude hold to guidance-commanded steering at the end of a coast; one gain set to another at a staging event; a failed sensor's loop to a backup. At each switch a controller that has not been running is asked to take over from one that has, and if its integrator starts at zero its output jumps — a **bump** — which the vehicle feels as a torque transient.

The cure is to make the incoming controller's output equal the outgoing one at the instant of transfer. Since the proportional and derivative terms are determined by the current error and measurement, the only free state is the integrator, so it is initialised to whatever makes the sum right:

$$
I(t_0) = u_{\text{current}} - k_p\,e(t_0) + k_d\,\dot y_f(t_0).
$$

::: example Initialising an integrator at a mode change
At the end of a coast the vehicle is holding attitude with an outgoing controller commanding $u_{\text{current}} = 180\ \mathrm{N\,m}$ to trim a thrust misalignment. The incoming rate controller sees an error of $e = 0.003\ \mathrm{rad/s}$ and a filtered rate derivative contributing $-8\ \mathrm{N\,m}$, so its proportional-plus-derivative output is $12\,000 \times 0.003 + (-8) = 28\ \mathrm{N\,m}$.

Starting its integrator at zero would drop the command from 180 to 28 N·m instantaneously — a $152\ \mathrm{N\,m}$ step, which through $1/(Js)$ produces $0.127\ \mathrm{rad/s^2}$ of unwanted acceleration until the integrator catches up over roughly $T_i = 0.5\ \mathrm{s}$, giving a rate excursion of order $0.06\ \mathrm{rad/s} = 3.6^\circ/\mathrm{s}$. Initialising it instead to $I = 180 - 28 = 152\ \mathrm{N\,m}$ makes the command continuous and the transfer invisible.
:::

The tidy implementation reuses the anti-windup path. Run the inactive controller continuously in **tracking mode**, feeding it $\bigl(u_{\text{actual}} - u\bigr)/T_t$ exactly as back-calculation does with $u_{sat}$. Its integrator then continuously tracks the live command, so it is always correctly initialised and the switch needs no special case. The same structure covers saturation and transfer, which is a good sign that it is the right structure.

## Setpoint weighting

The PID as written so far has one input path for both the command and the measurement, so shaping one shapes the other. That is a real limitation: the rate loop of the previous lesson has $67^\circ$ of phase margin and excellent disturbance rejection, yet its step response overshoots 13.6% — not because the loop is underdamped, but because the PI numerator puts a closed-loop *zero* at $-k_i/k_p = -2$, and a zero that close to the dominant poles adds overshoot.

**Setpoint weighting** splits the paths with two constants:

$$
u = k_p\bigl(b\,r - y\bigr) + k_i\!\int\!(r - y)\,dt + k_d\frac{d}{dt}\bigl(c\,r - y_f\bigr).
$$

The proportional term acts on $br - y$, the integral term on the full error $r - y$ (it must, or the steady-state error returns), and the derivative term on $cr - y_f$, where $y_f$ is the filtered measurement. Almost universally $c = 0$, so the derivative acts on the measurement alone and a step command produces no derivative impulse — the "derivative kick". The weight $b$ lies between 0 and 1.

The effect on the loop is precisely nothing: $L$, $S$, $T$, all the margins and the entire disturbance response are unchanged, because $b$ and $c$ appear only in the path from $r$. What changes is the closed-loop zero. For the PI rate loop the reference transfer function becomes

$$
\frac{y}{r} = \frac{500\,(b\,s + 2)}{s^3 + 50s^2 + 500s + 1000},
$$

so the zero moves from $-2$ out to $-2/b$, and at $b = 0$ it disappears.

::: example Choosing $b$ for the rate loop
Stepping the closed loop for several weights:

| $b$ | closed-loop zero | overshoot | 10–90% rise | 2% settling |
| --- | --- | --- | --- | --- |
| 1.0 | $-2.0$ | 13.6% | 0.129 s | 1.20 s |
| 0.8 | $-2.5$ | 1.8% | 0.198 s | 0.313 s |
| 0.7 | $-2.86$ | 0% | 0.275 s | 0.619 s |
| 0.5 | $-4.0$ | 0% | 0.561 s | 1.19 s |
| 0.0 | none | 0% | 0.872 s | 1.60 s |

$b = 0.8$ is the best of these by settling time: it trades a 54% slower rise for a fall in overshoot from 13.6% to 1.8% and in settling from 1.20 s to 0.31 s. Push further and the response becomes sluggish without becoming better damped — at $b = 0$ the rise time is nearly seven times the $b = 1$ value. Meanwhile the response to the 50 N·m trim torque is identical in all five rows, because the disturbance path never sees $b$.
:::

```python
import numpy as np

J, tau, dt = 1200.0, 0.02, 2e-4
kp, ki, kd, N, umax, Tt = 12000.0, 24000.0, 600.0, 15.0, 300.0, 0.1581


def run(mode, r=0.2, T=8.0):
    w = Ta = I = z = 0.0
    peak = 0.0
    for _ in range(int(T / dt)):
        e = r - w
        u = kp * e + I - (kd * N * w - N * z)
        us = min(max(u, -umax), umax)
        if mode == "naive":
            dI = ki * e
        elif mode == "backcalc":
            dI = ki * e + (us - u) / Tt
        else:
            dI = 0.0 if us != u else ki * e
        I += dt * dI
        z += dt * (-N * z + kd * N * w)
        Ta += dt * (us - Ta) / tau
        w += dt * Ta / J
        peak = max(peak, w)
    return 100.0 * (peak / r - 1.0)


for m in ("naive", "backcalc", "conditional"):
    print(m, round(run(m), 2))
# naive 53.81 / backcalc 0.3 / conditional 2.78
```

::: note
Setpoint weighting is the smallest useful two-degree-of-freedom controller: one structure for the feedback path, another for the command path. The general version, with a full prefilter or an explicit feedforward model, is treated in the last lesson of this module. The principle is the same one either way — command response and disturbance response are different requirements and deserve different knobs.
:::

## Check yourself

::: check
A PI controller with $k_p = 5$, $T_i = 2\ \mathrm{s}$ drives an actuator limited to $\pm 10$ units. The error sits at $+4$ for 3 s while the actuator is pinned. How large is the naive integrator's state at the end of those 3 s, and how long does it then take an error of $-1$ to unwind it?
:::

::: answer
$k_i = k_p/T_i = 2.5$, so the integrator accumulates $k_i \times e \times t = 2.5 \times 4 \times 3 = 30$ units. The total command was $5\times4 + 30 = 50$, five times the limit. To unwind, the integrator must fall from 30 to below about 15 before the command drops back under the limit (with $e = -1$ the proportional term is $-5$, so $u = 10$ needs $I = 15$). At $k_ie = 2.5\times(-1) = -2.5$ per second, that takes $(30-15)/2.5 = 6\ \mathrm{s}$ of the vehicle sitting on the wrong side of the setpoint with the actuator still pinned the other way. Three seconds of saturation bought six seconds of overshoot.
:::

::: check
Show that with back-calculation the integrator reaches a steady state during a long saturation, and say what value the controller's output settles to.
:::

::: answer
Set $dI/dt = k_ie + (u_{sat} - u)/T_t = 0$. Then $u_{sat} - u = -k_iT_te$, so $u = u_{sat} + k_iT_te$. The unsaturated command settles a fixed amount above the limit, proportional to the standing error and to $T_t$; the integrator state is whatever makes that true, $I = u_{sat} + k_iT_te - k_pe + k_d\dot y_f$. It is bounded, and it is bounded by something close to the actuator's own limit rather than by the size of the error times the duration. Shrinking $T_t$ shrinks the excess, which is why a short tracking constant is a strong anti-windup.
:::

::: check
Why does setpoint weighting leave the gain and phase margins unchanged, and what does it change?
:::

::: answer
Margins are properties of the loop transfer function $L = GC$, which is obtained by breaking the loop and going once around it with the reference held at zero. Setting $r = 0$ removes every term containing $b$ or $c$, so $L$ — and with it $S$, $T$, the crossover frequency, and all the margins — is untouched. What changes is the transfer function from $r$ to $y$, specifically the numerator: the closed-loop zeros move from $-k_i/k_p$ to $-k_i/(bk_p)$, and the derivative path's contribution to the reference response disappears when $c = 0$. Setpoint weighting is a numerator-only edit.
:::

::: check
An engineer implements conditional integration but freezes the integrator whenever $|u| > u_{sat}$, including when the error would drive the command back inside the limit. Describe the failure this can cause.
:::

::: answer
The integrator can stick. Suppose the command is pinned at $+u_{sat}$ with a large positive integrator state and the error turns negative. The proportional term starts pulling $u$ down, but until $u$ actually falls below the limit the integrator is frozen at the high value that is keeping it there. If the proportional term alone is not enough to bring $u$ under the limit, the controller has no mechanism left to reduce it and remains saturated indefinitely — the integrator cannot unwind, because unwinding is exactly what has been forbidden. The standard fix is to freeze only integration that would push further into the limit and to allow integration that pulls out of it, which removes the sticking without giving up the simplicity.
:::

::: check
A vehicle switches from a launch-mode controller to an orbit-mode controller with different gains. The launch controller's last command was 240 N·m; the orbit controller's proportional and derivative terms evaluate to 15 N·m at the switch. What should its integrator be initialised to, and what happens if it is left at zero?
:::

::: answer
Initialise $I = 240 - 15 = 225\ \mathrm{N\,m}$, so the incoming command is continuous at 240 N·m. Left at zero, the command drops instantly to 15 N·m, a $225\ \mathrm{N\,m}$ step removal of torque that the vehicle feels directly as $225/J$ of angular acceleration until the new integrator rebuilds the trim, over roughly its own integral time. On a vehicle with $J = 1200\ \mathrm{kg\,m^2}$ that is $0.19\ \mathrm{rad/s^2}$ in the wrong direction, which is a disturbance no mission ever wanted and no linear analysis would have predicted, because the transient exists only at the switching instant.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Windup | while saturated the loop is open; the integrator accumulates unattainable command |
| Naive integrator, example loop | 53.8% overshoot, pinned 1.20 s, integrator to 2015 N·m against a 300 N·m limit |
| Back-calculation | $dI/dt = k_ie + (u_{sat} - u)/T_t$; integrator tracks the achievable command |
| $T_t$ | tracking time constant, $\sim\sqrt{T_iT_d}$ for PID, $\sim T_i$ for PI; 0.158 s here |
| With back-calculation | 0.30% overshoot, pinned 0.53 s, integrator peak 10.5 N·m |
| Conditional integration | freeze the integrator while saturated; 2.78% overshoot; can stick unless one-sided |
| Bumpless transfer | $I(t_0) = u_{\text{current}} - k_pe(t_0) + k_d\dot y_f(t_0)$, or run the idle controller in tracking mode |
| Setpoint weighting | P acts on $br - y$, I on $r - y$, D on $-y$ ($c = 0$); moves the closed-loop zero to $-k_i/(bk_p)$ |
| Effect of $b$ | $b = 1$: 13.6% overshoot, settles 1.20 s; $b = 0.8$: 1.8%, settles 0.31 s; margins unchanged |

With the controller's structure settled, the next question is how to choose its numbers. The next lesson puts three tuning methods side by side on the same plant and compares what each one actually optimises.
