---
id: l03-windup-anti-windup-and-mode-changes
title: Windup, anti-windup, bumpless transfer and setpoint weighting
minutes: 21
covers:
  - 'Integrator windup, anti-windup schemes, bumpless transfer, setpoint weighting'
---

Picture a shower that takes a while to warm up. The water is cold, so you turn the hot tap. Still cold — you turn it more, until it hits the stop. It is still cold, and in your head you keep thinking "hotter, hotter". Then the hot water finally arrives, all at once. Because you spent that whole wait wishing for more, you are slow to back off, and you get scalded. That is **integrator windup**, and every control loop with an integrator can do it.

Every actuator has a stop. A [[gimbal|gimbal]] reaches its mechanical limit. A reaction wheel reaches its torque limit or its [[momentum limit|momentum-limit]]. A thruster is either on or off. A valve is fully open. For most of a flight the loop never gets near those limits, and the linear analysis of the last lessons is exact. Then a gust arrives, or a stage separates, or guidance commands a big attitude change, and the actuator spends a second or two pinned against its stop. What happens in that second is not described by any transfer function, and it is where a great many real control failures live.

Be precise about the mechanism. While the actuator is **[[saturated|saturation-picture]]** — pinned at its limit — the loop is *open*. The controller's output no longer changes what the plant does, so the error does not respond to it. The integrator keeps adding up error until the error vanishes, so it piles up a state that stands for a command the hardware could never deliver. When the vehicle finally catches up and the error flips sign, that pile must be worked off before the actuator leaves the stop. The vehicle sails past the target while it does.

This lesson shows windup on the rate loop from the last lessons, fixes it two ways, and then treats two other places where a good linear controller meets an awkward real world: switching between control modes without a jolt, and shaping the response to commands without touching the response to disturbances.

## Windup, on real numbers

Take the rate loop: $G(s) = 1/\bigl(Js(\tau s+1)\bigr)$ with $J = 1200\ \mathrm{kg\,m^2}$, $\tau = 0.02\ \mathrm{s}$, and the practical PID $k_p = 12\,000$, $k_i = 24\,000$, $k_d = 600$, $N = 15\ \mathrm{rad/s}$. So $T_i = 0.5\ \mathrm{s}$ and $T_d = 0.05\ \mathrm{s}$.

Now add a limit: the commanded torque cannot go past $\pm 300\ \mathrm{N\,m}$. For a vehicle with $T\ell_T = 2000\ \mathrm{N\,m/rad}$ of [[control effectiveness|control-effectiveness]], that is a gimbal limit of $300/2000 = 0.15\ \mathrm{rad}$. Command a rate step of $0.2\ \mathrm{rad/s}$ ($11.5^\circ/\mathrm{s}$).

At $t = 0$ the proportional term alone asks for $12\,000 \times 0.2 = 2400\ \mathrm{N\,m}$ — eight times what the actuator can deliver. The best the vehicle can do is $300/1200 = 0.25\ \mathrm{rad/s^2}$ of angular acceleration, so reaching $0.2\ \mathrm{rad/s}$ takes at least $0.2/0.25 = 0.8\ \mathrm{s}$. All that time the error is large and positive, and a naive integrator adds up every bit of it.

::: example The same loop, three integrators
Simulate with a $0.2\ \mathrm{ms}$ time step, with the derivative taken on the measurement. Run it four ways: once with no limit at all (for reference), and three times with the $300\ \mathrm{N\,m}$ limit and different integrators.

| Integrator | overshoot | 2% settling | actuator pinned until | peak integrator state |
| --- | --- | --- | --- | --- |
| no saturation (reference) | 14.1% | 1.47 s | — | 495 N·m |
| naive | 53.8% | 2.52 s | 1.20 s | 2014 N·m |
| back-calculation, $T_t = 0.158\ \mathrm{s}$ | 0.30% | 1.19 s | 0.53 s | 10.6 N·m |
| conditional integration | 2.78% | 1.56 s | 0.67 s | 97.7 N·m |

**The naive integrator** climbs to $2014\ \mathrm{N\,m}$ — $2014/300 = 6.7$ times what the actuator can produce. That state is a request the hardware can never honor. It keeps the actuator pinned until $1.20\ \mathrm{s}$: a full $0.4\ \mathrm{s}$ longer than the physics needed, all of it spent pushing the vehicle past the target. The rate [[overshoots to 0.308 rad/s|windup-picture]] ($17.6^\circ/\mathrm{s}$) against a command of $0.2$ — that is $0.308/0.2 - 1 = 54\%$ too far.

**Compare honestly.** The limit itself is not the villain: the unlimited loop overshoots 14.1% too, and a 300 N·m actuator makes some delay unavoidable. Anti-windup does not remove the limit. It stops the controller from making the limit worse. With back-calculation the loop even settles *faster* than the unlimited linear loop, because the limit rounded off an over-eager command.
:::

::: key
Integrator windup: while the actuator is saturated the loop is open, but the integrator keeps accumulating error. The state must then be unwound before the actuator comes off the stop, producing large overshoot and long settling.
:::

## Back-calculation

The cleanest fix asks the integrator to follow what the actuator is *actually* doing, not what the controller wishes it were doing.

Call the controller's command $u$ (also written $u_{cmd}$), and call what the actuator really delivers $u_{sat}$ — the command clipped to the limit. Form the difference $u_{sat} - u$. It is zero when nothing is clipped, and negative when the command is over the top limit. Feed it back into the integrator through a gain $1/T_t$:

$$
\frac{dI}{dt} = k_i\,e + \frac{1}{T_t}\bigl(u_{sat} - u\bigr).
$$

Here $I$ is the integrator's state — its contribution to $u$.

- **Not saturated:** the extra term is zero, and the controller is exactly the PID you designed.
- **Saturated:** the extra term is large and negative. The integrator stops climbing and settles where it keeps $u$ close to the limit.

Where does it settle? Set $dI/dt = 0$: then $u_{sat} - u = -k_iT_t\,e$, so $u = u_{sat} + k_iT_t\,e$. The command sits a small, fixed distance above what the actuator is delivering. In words, while saturated the integrator now holds *the command the actuator can actually give* — that is what it physically represents.

$T_t$ is the **tracking time constant**, and it sets how fast the integrator unwinds. A [[common choice|sqrt-rule]] is $T_t = \sqrt{T_iT_d}$ for a PID and $T_t = T_i$ for a PI. Here $\sqrt{0.5\times0.05} = \sqrt{0.025} = 0.158\ \mathrm{s}$. The same run with other values:

| $T_t$ | overshoot | 2% settling | peak integrator state |
| --- | --- | --- | --- |
| 0.05 s | 0.14% | 1.33 s | 4.9 N·m |
| 0.158 s | 0.30% | 1.19 s | 10.6 N·m |
| 0.5 s | 10.1% | 1.90 s | 354 N·m |
| 2.0 s | 35.5% | 2.31 s | 1323 N·m |

A tracking constant much longer than $T_i$ is barely anti-windup at all. Making it very short is not free either. The saturation path is now a fast feedback loop around your model of the actuator. So any error in that model — an actuator that saturates a few percent lower than you think, or a measured position with noise on it — is fed into the integrator at high gain.

::: key
Back-calculation anti-windup: feed $(u_{sat} - u_{cmd})$ back into the integrator input through gain $1/T_t$, with $T_t \sim \sqrt{T_iT_d}$. The integrator then tracks the achievable command instead of the impossible one.
:::

## Conditional integration

The other fix is blunter: stop integrating while saturated. With $u_{max}$ the actuator's limit,

$$
\frac{dI}{dt} = \begin{cases} k_i\,e, & |u| < u_{max} \ \text{(not saturated)} \\[2pt] 0, & \text{otherwise.} \end{cases}
$$

It is two lines of code with no extra setting to tune. In the table above it gives 2.78% overshoot against the naive integrator's 53.8%. Its weakness is that it freezes the integrator wherever it happened to be, instead of steering it to a sensible value. The state at release is an accident of when saturation began: $97.7\ \mathrm{N\,m}$ here, against back-calculation's $10.6\ \mathrm{N\,m}$. One refinement keeps integrating whenever the error would move the command *away* from the limit, which stops it sticking. Another freezes only the integrator while leaving the derivative running.

For flight code with one clean, well-known saturation, back-calculation behaves better and costs one gain. Conditional integration earns its place where the limit is not a clean clip — a rate limit, a command in coarse steps, a valve with [[hysteresis|hysteresis]] — so that $u_{sat} - u$ is not something you can honestly compute.

::: warning Anti-windup is not more actuator
If the actuator is saturated for much of a maneuver, the loop is not controlling anything; the vehicle is doing whatever the pinned hardware makes it do. Anti-windup makes the recovery clean. It does not make the vehicle faster. If saturation lasts longer than a few closed-loop time constants, the answer is a smaller command, a shaped command profile, or a bigger actuator.
:::

## Bumpless transfer

A flight control system switches. Manual to automatic on a test stand. Attitude hold to guidance steering at the end of a coast. One gain set to another at staging. A failed sensor's loop to a backup. At each switch, a controller that has not been running takes over from one that has. If its integrator starts at zero, its output jumps — a **[[bump|bump]]** — and the vehicle feels it as a torque jolt.

The cure is to make the incoming controller's output equal the outgoing one at the instant of the switch. Its proportional and derivative terms are fixed by the current error and measurement. The only free state is the integrator, so set it to whatever makes the total come out right:

$$
I(t_0) = u_{\text{current}} - k_p\,e(t_0) + k_d\,\dot y_f(t_0).
$$

(Here $t_0$ is the switching instant, and the derivative acts on the filtered measurement $y_f$, so it enters the command as $-k_d\dot y_f$.)

::: example Setting an integrator at a mode change
At the end of a coast, the outgoing controller is commanding $u_{\text{current}} = 180\ \mathrm{N\,m}$ to cancel a thrust misalignment. The incoming rate controller sees an error $e = 0.003\ \mathrm{rad/s}$, and its derivative term contributes $-8\ \mathrm{N\,m}$. So its proportional-plus-derivative output is

$$
12\,000 \times 0.003 + (-8) = 36 - 8 = 28\ \mathrm{N\,m}.
$$

**Start the integrator at zero**, and the command drops from 180 to 28 N·m in an instant — a $152\ \mathrm{N\,m}$ step. Through $1/(Js)$ that is $152/1200 = 0.127\ \mathrm{rad/s^2}$ of unwanted angular acceleration until the integrator catches up, over roughly $T_i = 0.5\ \mathrm{s}$. That gives a rate excursion of order $0.127 \times 0.5 \approx 0.06\ \mathrm{rad/s}$, or $3.6^\circ/\mathrm{s}$.

**Start it at** $I = 180 - 28 = 152\ \mathrm{N\,m}$ instead, and the command is continuous. The switch is invisible.
:::

The tidy way to build this reuses the anti-windup path. Run the idle controller all the time in **tracking mode**, feeding it $\bigl(u_{\text{actual}} - u\bigr)/T_t$ exactly as back-calculation does with $u_{sat}$. Its integrator then keeps following the live command, so it is always ready, and the switch needs no special case. One structure handles both saturation and transfer — a good sign that it is the right structure.

## Setpoint weighting

So far the PID has one path for both the command and the measurement, so shaping one shapes the other. That is a real limitation. The PI rate loop from the first lesson has $67^\circ$ of phase margin and excellent disturbance rejection, yet its step response overshoots 13.6%. The loop is not underdamped. The overshoot comes from a **[[closed-loop zero|closed-loop-zero]]**: the PI numerator $k_p s + k_i$ puts a zero at $s = -k_i/k_p = -2$, close to the slowest poles, and a zero there adds overshoot.

**Setpoint weighting** splits the paths with two constants, $b$ and $c$:

$$
u = k_p\bigl(b\,r - y\bigr) + k_i\!\int\!(r - y)\,dt + k_d\frac{d}{dt}\bigl(c\,r - y_f\bigr).
$$

- The proportional term acts on $br - y$: only a fraction $b$ of the command.
- The integral term acts on the full error $r - y$. It must, or the steady-state error comes back.
- The derivative term acts on $cr - y_f$. Almost always $c = 0$, so the derivative sees only the measurement and a step command causes no derivative kick.

The weight $b$ lies between 0 and 1.

The effect on the loop is precisely nothing. $L$, $S$, $T$, every margin and the whole disturbance response are unchanged, because $b$ and $c$ appear only in the path from $r$. What changes is the closed-loop zero. For the PI rate loop, the command-to-rate transfer function becomes

$$
\frac{y}{r} = \frac{500\,(b\,s + 2)}{s^3 + 50s^2 + 500s + 1000},
$$

so the zero at $bs + 2 = 0$ moves from $-2$ out to $-2/b$. At $b = 0$ it disappears.

::: example Choosing $b$ for the rate loop
Step the closed loop for several [[weights|b-picture]]:

| $b$ | closed-loop zero | overshoot | 10–90% rise | 2% settling |
| --- | --- | --- | --- | --- |
| 1.0 | $-2.0$ | 13.6% | 0.129 s | 1.20 s |
| 0.8 | $-2.5$ | 1.8% | 0.198 s | 0.313 s |
| 0.7 | $-2.86$ | 0% | 0.275 s | 0.619 s |
| 0.5 | $-4.0$ | 0% | 0.560 s | 1.19 s |
| 0.0 | none | 0% | 0.872 s | 1.60 s |

**Pick $b = 0.8$**, the best here by settling time. It trades a rise about $0.198/0.129 \approx 1.53$ times slower (53% slower) for overshoot falling from 13.6% to 1.8% and settling from 1.20 s to 0.31 s.

**Push further** and the response gets sluggish without getting better damped: at $b = 0$ the rise time is $0.872/0.129 = 6.8$ times the $b = 1$ value. Meanwhile the response to the 50 N·m trim torque is identical in all five rows, because the disturbance path never sees $b$.
:::

The simulation behind the windup tables fits in a few lines:

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

::: note The smallest two-degree-of-freedom controller
Setpoint weighting is the simplest **two-degree-of-freedom** controller: one structure for the feedback path, another for the command path. The general version, with a full prefilter or an explicit feedforward model, comes in the last lesson of this module. The principle is the same either way — command response and disturbance response are different requirements, and they deserve different knobs.
:::

## Check yourself

::: check
A PI controller with $k_p = 5$, $T_i = 2\ \mathrm{s}$ drives an actuator limited to $\pm 10$ units. The error sits at $+4$ for 3 s while the actuator is pinned. How big is the naive integrator's state after those 3 s, and how long does an error of $-1$ then take to unwind it?
:::

::: answer
First, $k_i = k_p/T_i = 5/2 = 2.5$. The integrator adds up $k_i \times e \times t = 2.5 \times 4 \times 3 = 30$ units. The total command was $5\times4 + 30 = 50$, five times the limit.

To unwind, the command must fall back under the limit of 10. With $e = -1$ the proportional term is $5 \times (-1) = -5$, so $u = -5 + I$, and $u$ drops below 10 only once $I$ is below 15. The integrator falls at $k_ie = 2.5\times(-1) = -2.5$ per second, so going from 30 to 15 takes $(30-15)/2.5 = 6\ \mathrm{s}$. For those 6 s the vehicle sits past the target while the actuator is still pinned the other way. Three seconds of saturation bought six seconds of overshoot.
:::

::: check
Show that with back-calculation the integrator reaches a steady state during a long saturation, and say what value the controller's output settles to.
:::

::: answer
Set $dI/dt = k_ie + (u_{sat} - u)/T_t = 0$. Then $u_{sat} - u = -k_iT_te$, so $u = u_{sat} + k_iT_te$. The unclipped command settles a fixed amount past the limit, in proportion to the standing error and to $T_t$. The integrator state is whatever makes that true: $I = u_{sat} + k_iT_te - k_pe + k_d\dot y_f$. It is bounded, and bounded by something close to the actuator's own limit — not by the error times how long it lasted. Shrinking $T_t$ shrinks the excess, which is why a short tracking constant gives strong anti-windup.
:::

::: check
Why does setpoint weighting leave the gain and phase margins unchanged, and what does it change?
:::

::: answer
Margins are properties of the loop transfer function $L = GC$, found by cutting the loop and going once around it with the command held at zero. Setting $r = 0$ removes every term with $b$ or $c$ in it. So $L$ — and with it $S$, $T$, the crossover frequency and all the margins — is untouched. What changes is the transfer function from $r$ to $y$, and only its numerator: the closed-loop zero moves from $-k_i/k_p$ to $-k_i/(bk_p)$, and the derivative path's share of the command response disappears when $c = 0$. Setpoint weighting edits the numerator and nothing else.
:::

::: check
An engineer builds conditional integration but freezes the integrator whenever $|u| > u_{max}$, even when the error would pull the command back inside the limit. What failure can this cause?
:::

::: answer
The integrator can stick. Suppose the command is pinned at the top limit, held there by a large positive integrator state, and the error turns negative. The proportional term starts pulling $u$ down. But until $u$ actually drops below the limit, the integrator stays frozen at the high value that keeps it there. If the proportional term alone cannot bring $u$ under the limit, nothing else can reduce it, and the controller stays saturated for good — the integrator cannot unwind, because unwinding is exactly what was forbidden. The standard fix is to freeze only integration that would push further into the limit, and allow integration that pulls out of it. That removes the sticking and keeps the simplicity.
:::

::: check
A vehicle switches from a launch-mode controller to an orbit-mode controller with different gains. The launch controller's last command was 240 N·m; the orbit controller's proportional and derivative terms add up to 15 N·m at the switch. What should its integrator start at, and what happens if it starts at zero?
:::

::: answer
Start it at $I = 240 - 15 = 225\ \mathrm{N\,m}$, so the incoming command is a continuous 240 N·m. Left at zero, the command drops instantly to 15 N·m — $225\ \mathrm{N\,m}$ of torque suddenly removed. The vehicle feels that directly as $225/J$ of angular acceleration until the new integrator rebuilds the trim, over roughly its own integral time. With $J = 1200\ \mathrm{kg\,m^2}$ that is $225/1200 = 0.19\ \mathrm{rad/s^2}$ in the wrong direction. No mission wants that jolt, and no linear analysis would have predicted it, because it exists only at the instant of the switch.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Windup | while saturated the loop is open; the integrator piles up a command the actuator cannot give |
| Naive integrator, example loop | 53.8% overshoot, pinned 1.20 s, integrator to 2014 N·m against a 300 N·m limit |
| Back-calculation | $dI/dt = k_ie + (u_{sat} - u)/T_t$; integrator tracks the achievable command |
| $T_t$ | tracking time constant, $\sim\sqrt{T_iT_d}$ for PID, $\sim T_i$ for PI; 0.158 s here |
| With back-calculation | 0.30% overshoot, pinned 0.53 s, integrator peak 10.6 N·m |
| Conditional integration | freeze the integrator while saturated; 2.78% overshoot; can stick unless one-sided |
| Bumpless transfer | $I(t_0) = u_{\text{current}} - k_pe(t_0) + k_d\dot y_f(t_0)$, or run the idle controller in tracking mode |
| Setpoint weighting | P acts on $br - y$, I on $r - y$, D on $-y$ ($c = 0$); moves the closed-loop zero to $-k_i/(bk_p)$ |
| Effect of $b$ | $b = 1$: 13.6% overshoot, settles 1.20 s; $b = 0.8$: 1.8%, settles 0.31 s; margins unchanged |

With the controller's structure settled, the next question is how to choose its numbers. The next lesson puts three tuning methods side by side on the same plant and compares what each one actually optimizes.

::: context gimbal Steering by tilting the engine
Most large rockets steer by tilting the whole engine a few degrees on a pivot called a **gimbal**. Tilting the thrust sideways twists the vehicle about its center of mass. Hydraulic or electric actuators push the engine around, and hard stops limit how far it can tilt — typically a few degrees, rarely more than about ten. When the controller asks for more than that, the engine sits on its stop.
:::

::: context momentum-limit Why a reaction wheel runs out
A reaction wheel turns the spacecraft by spinning up the other way. If a steady outside torque — sunlight pressure, the thin upper atmosphere — keeps pushing in one direction, the wheel has to spin faster and faster to cancel it. Eventually it reaches its top speed and can absorb no more. That is **momentum saturation**. The fix is to "dump" the momentum with thrusters or magnetic torquers while the wheel slows back down.
:::

::: context saturation-picture What saturation looks like
The word means "filled full", like a soaked sponge that takes in no more water. An actuator is the same. In the middle of its range it delivers what it is told. Past its limit it delivers the limit, however much more you ask for.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="15" y1="95" x2="345" y2="95" stroke="#6c7a93"/>
  <line x1="180" y1="10" x2="180" y2="175" stroke="#6c7a93"/>
  <line x1="235" y1="40" x2="265" y2="10" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="125" y1="150" x2="235" y2="40" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="235" y1="40" x2="340" y2="40" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="20" y1="150" x2="125" y2="150" stroke="#b4232c" stroke-width="2.5"/>
  <text x="266" y="20" font-size="11" fill="#6c7a93">what was asked</text>
  <text x="340" y="58" font-size="11" text-anchor="end" fill="#b4232c">pinned at +300</text>
  <text x="20" y="142" font-size="11" fill="#b4232c">pinned at −300</text>
  <text x="174" y="20" font-size="11" text-anchor="end" fill="#1f2a44">delivered u_sat</text>
  <text x="345" y="88" font-size="11" text-anchor="end" fill="#1f2a44">commanded u</text>
  <text x="192" y="128" font-size="11" fill="#1d6fd1">in between: u_sat = u</text>
</svg>
```

The flat red parts are where the loop is open: changing $u$ there changes nothing the plant feels. The dashed line is what the integrator thinks is being delivered — and that gap is windup.
:::

::: context control-effectiveness Control effectiveness
**Control effectiveness** is how much torque you get per radian of gimbal tilt. Tilting an engine of thrust $T$ by a small angle $\delta$ pushes sideways with about $T\delta$. If the engine sits a distance $\ell_T$ from the center of mass, that makes a torque $T\ell_T\,\delta$. So $T\ell_T = 2000\ \mathrm{N\,m/rad}$ could be, say, $1000\ \mathrm{N}$ of thrust acting $2\ \mathrm{m}$ behind the center of mass. (Here $T$ is thrust, not the complementary sensitivity.)
:::

::: context windup-picture Windup, seen
Here is the rate from the example, for the naive integrator (red) and back-calculation (blue). For the first half second they are identical: both are pinned at the limit, accelerating as hard as $300\ \mathrm{N\,m}$ allows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="46" y1="150" x2="340" y2="150" stroke="#1f2a44"/>
  <line x1="46" y1="150" x2="46" y2="16" stroke="#1f2a44"/>
  <line x1="46" y1="73.4" x2="340" y2="73.4" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="42" y="154.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="42" y="115.7" font-size="11" text-anchor="end" fill="#1f2a44">0.1</text>
  <text x="42" y="77.4" font-size="11" text-anchor="end" fill="#1f2a44">0.2</text>
  <text x="42" y="39.1" font-size="11" text-anchor="end" fill="#1f2a44">0.3</text>
  <text x="46.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="144.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="242.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="340.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="193.0" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">time (s)</text>
  <text x="8" y="12" font-size="11" fill="#1f2a44">rate, rad/s</text>
  <polyline points="46.0,150.0 46.0,150.0 48.0,149.3 49.9,147.8 51.9,146.0 53.9,144.2 55.8,142.3 57.8,140.4 59.7,138.5 61.7,136.6 63.7,134.6 65.6,132.7 67.6,130.8 69.5,128.9 71.5,127.0 73.5,125.1 75.4,123.2 77.4,121.2 79.3,119.3 81.3,117.4 83.3,115.5 85.2,113.6 87.2,111.7 89.1,109.8 91.1,107.8 93.1,105.9 95.0,104.0 97.0,102.1 98.9,100.2 100.9,98.3 102.9,96.4 104.8,94.4 106.8,92.5 108.7,90.6 110.7,88.7 112.7,86.8 114.6,84.9 116.6,83.0 118.5,81.0 120.5,79.1 122.5,77.2 124.4,75.3 126.4,73.4 128.3,71.5 130.3,69.6 132.3,67.6 134.2,65.7 136.2,63.8 138.1,61.9 140.1,60.0 142.1,58.1 144.0,56.2 146.0,54.2 147.9,52.3 149.9,50.4 151.9,48.5 153.8,46.6 155.8,44.7 157.7,42.8 159.7,40.8 161.7,38.9 163.6,37.0 165.6,35.2 167.5,33.8 169.5,32.9 171.5,32.4 173.4,32.2 175.4,32.3 177.3,32.6 179.3,33.1 181.3,33.7 183.2,34.4 185.2,35.2 187.1,36.0 189.1,37.0 191.1,38.0 193.0,39.0 195.0,40.1 196.9,41.2 198.9,42.3 200.9,43.4 202.8,44.5 204.8,45.6 206.7,46.8 208.7,47.9 210.7,49.0 212.6,50.0 214.6,51.1 216.5,52.1 218.5,53.1 220.5,54.1 222.4,55.1 224.4,56.0 226.3,56.9 228.3,57.7 230.3,58.6 232.2,59.4 234.2,60.2 236.1,60.9 238.1,61.6 240.1,62.3 242.0,62.9 244.0,63.6 245.9,64.2 247.9,64.7 249.9,65.3 251.8,65.8 253.8,66.3 255.7,66.7 257.7,67.2 259.7,67.6 261.6,68.0 263.6,68.3 265.5,68.7 267.5,69.0 269.5,69.3 271.4,69.6 273.4,69.9 275.3,70.2 277.3,70.4 279.3,70.6 281.2,70.8 283.2,71.0 285.1,71.2 287.1,71.4 289.1,71.6 291.0,71.7 293.0,71.9 294.9,72.0 296.9,72.1 298.9,72.2 300.8,72.4 302.8,72.5 304.7,72.5 306.7,72.6 308.7,72.7 310.6,72.8 312.6,72.8 314.5,72.9 316.5,73.0 318.5,73.0 320.4,73.1 322.4,73.1 324.3,73.2 326.3,73.2 328.3,73.2 330.2,73.3 332.2,73.3 334.1,73.3 336.1,73.3 338.1,73.4" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="46.0,150.0 46.0,150.0 48.0,149.3 49.9,147.8 51.9,146.0 53.9,144.2 55.8,142.3 57.8,140.4 59.7,138.5 61.7,136.6 63.7,134.6 65.6,132.7 67.6,130.8 69.5,128.9 71.5,127.0 73.5,125.1 75.4,123.2 77.4,121.2 79.3,119.3 81.3,117.4 83.3,115.5 85.2,113.6 87.2,111.7 89.1,109.8 91.1,107.8 93.1,105.9 95.0,104.0 97.0,102.1 98.9,100.2 100.9,98.3 102.9,96.6 104.8,95.0 106.8,93.5 108.7,92.1 110.7,90.8 112.7,89.6 114.6,88.4 116.6,87.3 118.5,86.3 120.5,85.4 122.5,84.5 124.4,83.6 126.4,82.8 128.3,82.1 130.3,81.4 132.3,80.8 134.2,80.2 136.2,79.6 138.1,79.1 140.1,78.6 142.1,78.1 144.0,77.7 146.0,77.3 147.9,76.9 149.9,76.6 151.9,76.3 153.8,76.0 155.8,75.7 157.7,75.5 159.7,75.3 161.7,75.1 163.6,74.9 165.6,74.7 167.5,74.5 169.5,74.4 171.5,74.3 173.4,74.1 175.4,74.0 177.3,73.9 179.3,73.8 181.3,73.8 183.2,73.7 185.2,73.6 187.1,73.6 189.1,73.5 191.1,73.5 193.0,73.4 195.0,73.4 196.9,73.3 198.9,73.3 200.9,73.3 202.8,73.3 204.8,73.3 206.7,73.2 208.7,73.2 210.7,73.2 212.6,73.2 214.6,73.2 216.5,73.2 218.5,73.2 220.5,73.2 222.4,73.2 224.4,73.2 226.3,73.2 228.3,73.2 230.3,73.2 232.2,73.2 234.2,73.2 236.1,73.2 238.1,73.2 240.1,73.2 242.0,73.2 244.0,73.2 245.9,73.2 247.9,73.3 249.9,73.3 251.8,73.3 253.8,73.3 255.7,73.3 257.7,73.3 259.7,73.3 261.6,73.3 263.6,73.3 265.5,73.3 267.5,73.3 269.5,73.3 271.4,73.3 273.4,73.3 275.3,73.3 277.3,73.3 279.3,73.3 281.2,73.4 283.2,73.4 285.1,73.4 287.1,73.4 289.1,73.4 291.0,73.4 293.0,73.4 294.9,73.4 296.9,73.4 298.9,73.4 300.8,73.4 302.8,73.4 304.7,73.4 306.7,73.4 308.7,73.4 310.6,73.4 312.6,73.4 314.5,73.4 316.5,73.4 318.5,73.4 320.4,73.4 322.4,73.4 324.3,73.4 326.3,73.4 328.3,73.4 330.2,73.4 332.2,73.4 334.1,73.4 336.1,73.4 338.1,73.4" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="179.6" y="30.2" font-size="11" fill="#b4232c">naive: peak 0.308</text>
  <text x="202.8" y="89.4" font-size="11" fill="#1d6fd1">back-calculation</text>
  <text x="52" y="68" font-size="11" fill="#6c7a93">command 0.2</text>
</svg>
```

Then they part ways. The blue line eases onto $0.2\ \mathrm{rad/s}$. The red one keeps accelerating, because its integrator still holds thousands of newton-meters of "please", and it does not turn around until about $1.3\ \mathrm{s}$.
:::

::: context sqrt-rule Where the square-root rule comes from
$\sqrt{T_iT_d}$ is the **geometric mean** of the two times — the number that sits halfway between them on a log scale. The idea is that the tracking should be faster than the integral action, which it is trying to rein in, but slower than the derivative action, so it does not fight the fast parts of the controller. Åström and Hägglund suggest this choice in their books on PID control. It is a starting point, not a law: the table shows a wide range of $T_t$ working well.
:::

::: context hysteresis Hysteresis
A device has **hysteresis** when its output depends on which way you approached. A sticky valve that opens at 30% of command on the way up but closes only at 20% on the way down is an example. With a device like that, there is no single "clipped command" you can compute, which is why back-calculation struggles and a simple freeze-the-integrator rule is safer.
:::

::: context bump Why engineers say "bumpless"
The term comes from process control, where an operator switching a plant from hand control to automatic would see the valve jump — a bump in the process. On a vehicle the same bump is a torque jolt that can shake the structure, slosh the propellant and upset a sensitive payload. Mode switches happen often in flight, so every one of them needs this care.
:::

::: context closed-loop-zero Why a zero adds overshoot
A zero at $s = -z$ in the numerator makes the output equal the zero-free response plus $1/z$ times that response's slope. Early on, the slope is large and positive, so this extra piece pushes the output up faster — and past the target. The closer the zero is to the origin (the smaller $z$), the bigger the $1/z$ push. That is why the PI zero at $-2$ adds overshoot, and why moving it to $-2/b$ shrinks it.
:::

::: context b-picture Three weights, one loop
Step responses of the PI rate loop for $b = 1$, $0.8$ and $0$. Same poles, same margins — only the zero moves.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="46" y1="150" x2="340" y2="150" stroke="#1f2a44"/>
  <line x1="46" y1="150" x2="46" y2="16" stroke="#1f2a44"/>
  <line x1="46" y1="38.3" x2="340" y2="38.3" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="42" y="154.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="42" y="98.2" font-size="11" text-anchor="end" fill="#1f2a44">0.5</text>
  <text x="42" y="42.3" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="46.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="119.5" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">0.5</text>
  <text x="193.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="266.5" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">1.5</text>
  <text x="340.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="193.0" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">time (s)</text>
  <text x="8" y="12" font-size="11" fill="#1f2a44">rate ÷ command</text>
  <polyline points="46.0,150.0 47.5,147.6 48.9,141.8 50.4,134.0 51.9,125.3 53.4,116.3 54.8,107.4 56.3,98.9 57.8,90.8 59.2,83.3 60.7,76.4 62.2,70.2 63.6,64.5 65.1,59.4 66.6,54.7 68.0,50.6 69.5,46.9 71.0,43.6 72.5,40.7 73.9,38.1 75.4,35.9 76.9,33.9 78.3,32.1 79.8,30.6 81.3,29.2 82.8,28.1 84.2,27.1 85.7,26.3 87.2,25.5 88.6,25.0 90.1,24.5 91.6,24.1 93.0,23.7 94.5,23.5 96.0,23.3 97.5,23.2 98.9,23.2 100.4,23.1 101.9,23.2 103.3,23.2 104.8,23.3 106.3,23.4 107.7,23.6 109.2,23.7 110.7,23.9 112.2,24.1 113.6,24.3 115.1,24.5 116.6,24.7 118.0,25.0 119.5,25.2 121.0,25.5 122.4,25.7 123.9,26.0 125.4,26.2 126.9,26.5 128.3,26.7 129.8,27.0 131.3,27.2 132.7,27.5 134.2,27.7 135.7,27.9 137.1,28.2 138.6,28.4 140.1,28.7 141.6,28.9 143.0,29.1 144.5,29.3 146.0,29.6 147.4,29.8 148.9,30.0 150.4,30.2 151.8,30.4 153.3,30.6 154.8,30.8 156.2,31.0 157.7,31.2 159.2,31.3 160.7,31.5 162.1,31.7 163.6,31.9 165.1,32.0 166.5,32.2 168.0,32.3 169.5,32.5 170.9,32.7 172.4,32.8 173.9,32.9 175.4,33.1 176.8,33.2 178.3,33.4 179.8,33.5 181.2,33.6 182.7,33.7 184.2,33.9 185.7,34.0 187.1,34.1 188.6,34.2 190.1,34.3 191.5,34.4 193.0,34.5 194.5,34.6 195.9,34.7 197.4,34.8 198.9,34.9 200.3,35.0 201.8,35.1 203.3,35.2 204.8,35.2 206.2,35.3 207.7,35.4 209.2,35.5 210.6,35.6 212.1,35.6 213.6,35.7 215.1,35.8 216.5,35.8 218.0,35.9 219.5,36.0 220.9,36.0 222.4,36.1 223.9,36.2 225.3,36.2 226.8,36.3 228.3,36.3 229.8,36.4 231.2,36.4 232.7,36.5 234.2,36.5 235.6,36.6 237.1,36.6 238.6,36.7 240.0,36.7 241.5,36.8 243.0,36.8 244.5,36.8 245.9,36.9 247.4,36.9 248.9,36.9 250.3,37.0 251.8,37.0 253.3,37.1 254.7,37.1 256.2,37.1 257.7,37.2 259.1,37.2 260.6,37.2 262.1,37.2 263.6,37.3 265.0,37.3 266.5,37.3 268.0,37.4 269.4,37.4 270.9,37.4 272.4,37.4 273.9,37.5 275.3,37.5 276.8,37.5 278.3,37.5 279.7,37.5 281.2,37.6 282.7,37.6 284.1,37.6 285.6,37.6 287.1,37.6 288.6,37.7 290.0,37.7 291.5,37.7 293.0,37.7 294.4,37.7 295.9,37.7 297.4,37.8 298.8,37.8 300.3,37.8 301.8,37.8 303.2,37.8 304.7,37.8 306.2,37.8 307.7,37.9 309.1,37.9 310.6,37.9 312.1,37.9 313.5,37.9 315.0,37.9 316.5,37.9 317.9,37.9 319.4,38.0 320.9,38.0 322.4,38.0 323.8,38.0 325.3,38.0 326.8,38.0 328.2,38.0 329.7,38.0 331.2,38.0 332.6,38.0 334.1,38.0 335.6,38.0 337.1,38.1 338.5,38.1 340.0,38.1" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="106.4" y="20.1" font-size="11" fill="#b4232c">b = 1: 13.6% over</text>
  <polyline points="46.0,150.0 47.5,148.1 48.9,143.4 50.4,137.2 51.9,130.1 53.4,122.8 54.8,115.5 56.3,108.5 57.8,101.8 59.2,95.6 60.7,89.9 62.2,84.6 63.6,79.7 65.1,75.3 66.6,71.3 68.0,67.7 69.5,64.4 71.0,61.4 72.5,58.7 73.9,56.3 75.4,54.1 76.9,52.1 78.3,50.3 79.8,48.7 81.3,47.3 82.8,46.0 84.2,44.9 85.7,43.9 87.2,42.9 88.6,42.1 90.1,41.4 91.6,40.7 93.0,40.2 94.5,39.6 96.0,39.2 97.5,38.8 98.9,38.4 100.4,38.1 101.9,37.8 103.3,37.6 104.8,37.4 106.3,37.2 107.7,37.0 109.2,36.9 110.7,36.8 112.2,36.7 113.6,36.6 115.1,36.5 116.6,36.5 118.0,36.4 119.5,36.4 121.0,36.3 122.4,36.3 123.9,36.3 125.4,36.3 126.9,36.3 128.3,36.3 129.8,36.3 131.3,36.3 132.7,36.4 134.2,36.4 135.7,36.4 137.1,36.4 138.6,36.5 140.1,36.5 141.6,36.5 143.0,36.5 144.5,36.6 146.0,36.6 147.4,36.6 148.9,36.7 150.4,36.7 151.8,36.7 153.3,36.8 154.8,36.8 156.2,36.8 157.7,36.9 159.2,36.9 160.7,36.9 162.1,37.0 163.6,37.0 165.1,37.0 166.5,37.1 168.0,37.1 169.5,37.1 170.9,37.2 172.4,37.2 173.9,37.2 175.4,37.2 176.8,37.3 178.3,37.3 179.8,37.3 181.2,37.3 182.7,37.4 184.2,37.4 185.7,37.4 187.1,37.4 188.6,37.5 190.1,37.5 191.5,37.5 193.0,37.5 194.5,37.6 195.9,37.6 197.4,37.6 198.9,37.6 200.3,37.6 201.8,37.6 203.3,37.7 204.8,37.7 206.2,37.7 207.7,37.7 209.2,37.7 210.6,37.7 212.1,37.8 213.6,37.8 215.1,37.8 216.5,37.8 218.0,37.8 219.5,37.8 220.9,37.8 222.4,37.9 223.9,37.9 225.3,37.9 226.8,37.9 228.3,37.9 229.8,37.9 231.2,37.9 232.7,37.9 234.2,38.0 235.6,38.0 237.1,38.0 238.6,38.0 240.0,38.0 241.5,38.0 243.0,38.0 244.5,38.0 245.9,38.0 247.4,38.0 248.9,38.0 250.3,38.0 251.8,38.1 253.3,38.1 254.7,38.1 256.2,38.1 257.7,38.1 259.1,38.1 260.6,38.1 262.1,38.1 263.6,38.1 265.0,38.1 266.5,38.1 268.0,38.1 269.4,38.1 270.9,38.1 272.4,38.1 273.9,38.1 275.3,38.2 276.8,38.2 278.3,38.2 279.7,38.2 281.2,38.2 282.7,38.2 284.1,38.2 285.6,38.2 287.1,38.2 288.6,38.2 290.0,38.2 291.5,38.2 293.0,38.2 294.4,38.2 295.9,38.2 297.4,38.2 298.8,38.2 300.3,38.2 301.8,38.2 303.2,38.2 304.7,38.2 306.2,38.2 307.7,38.2 309.1,38.2 310.6,38.2 312.1,38.2 313.5,38.2 315.0,38.2 316.5,38.2 317.9,38.3 319.4,38.3 320.9,38.3 322.4,38.3 323.8,38.3 325.3,38.3 326.8,38.3 328.2,38.3 329.7,38.3 331.2,38.3 332.6,38.3 334.1,38.3 335.6,38.3 337.1,38.3 338.5,38.3 340.0,38.3" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="46.0,150.0 47.5,150.0 48.9,149.9 50.4,149.6 51.9,149.3 53.4,148.7 54.8,148.0 56.3,147.1 57.8,146.0 59.2,144.9 60.7,143.6 62.2,142.2 63.6,140.7 65.1,139.1 66.6,137.5 68.0,135.8 69.5,134.1 71.0,132.3 72.5,130.6 73.9,128.8 75.4,126.9 76.9,125.1 78.3,123.3 79.8,121.5 81.3,119.7 82.8,117.9 84.2,116.1 85.7,114.3 87.2,112.5 88.6,110.8 90.1,109.1 91.6,107.4 93.0,105.8 94.5,104.2 96.0,102.6 97.5,101.0 98.9,99.4 100.4,97.9 101.9,96.5 103.3,95.0 104.8,93.6 106.3,92.2 107.7,90.8 109.2,89.5 110.7,88.2 112.2,86.9 113.6,85.7 115.1,84.5 116.6,83.3 118.0,82.1 119.5,81.0 121.0,79.9 122.4,78.8 123.9,77.8 125.4,76.7 126.9,75.8 128.3,74.8 129.8,73.8 131.3,72.9 132.7,72.0 134.2,71.1 135.7,70.3 137.1,69.4 138.6,68.6 140.1,67.8 141.6,67.0 143.0,66.3 144.5,65.6 146.0,64.8 147.4,64.1 148.9,63.5 150.4,62.8 151.8,62.2 153.3,61.5 154.8,60.9 156.2,60.3 157.7,59.8 159.2,59.2 160.7,58.6 162.1,58.1 163.6,57.6 165.1,57.1 166.5,56.6 168.0,56.1 169.5,55.6 170.9,55.2 172.4,54.7 173.9,54.3 175.4,53.9 176.8,53.5 178.3,53.1 179.8,52.7 181.2,52.3 182.7,51.9 184.2,51.6 185.7,51.2 187.1,50.9 188.6,50.5 190.1,50.2 191.5,49.9 193.0,49.6 194.5,49.3 195.9,49.0 197.4,48.7 198.9,48.5 200.3,48.2 201.8,47.9 203.3,47.7 204.8,47.4 206.2,47.2 207.7,47.0 209.2,46.7 210.6,46.5 212.1,46.3 213.6,46.1 215.1,45.9 216.5,45.7 218.0,45.5 219.5,45.3 220.9,45.1 222.4,44.9 223.9,44.8 225.3,44.6 226.8,44.4 228.3,44.3 229.8,44.1 231.2,43.9 232.7,43.8 234.2,43.7 235.6,43.5 237.1,43.4 238.6,43.2 240.0,43.1 241.5,43.0 243.0,42.9 244.5,42.7 245.9,42.6 247.4,42.5 248.9,42.4 250.3,42.3 251.8,42.2 253.3,42.1 254.7,42.0 256.2,41.9 257.7,41.8 259.1,41.7 260.6,41.6 262.1,41.5 263.6,41.4 265.0,41.4 266.5,41.3 268.0,41.2 269.4,41.1 270.9,41.1 272.4,41.0 273.9,40.9 275.3,40.8 276.8,40.8 278.3,40.7 279.7,40.7 281.2,40.6 282.7,40.5 284.1,40.5 285.6,40.4 287.1,40.4 288.6,40.3 290.0,40.3 291.5,40.2 293.0,40.2 294.4,40.1 295.9,40.1 297.4,40.0 298.8,40.0 300.3,39.9 301.8,39.9 303.2,39.8 304.7,39.8 306.2,39.8 307.7,39.7 309.1,39.7 310.6,39.7 312.1,39.6 313.5,39.6 315.0,39.6 316.5,39.5 317.9,39.5 319.4,39.5 320.9,39.4 322.4,39.4 323.8,39.4 325.3,39.3 326.8,39.3 328.2,39.3 329.7,39.3 331.2,39.2 332.6,39.2 334.1,39.2 335.6,39.2 337.1,39.1 338.5,39.1 340.0,39.1" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <text x="126.9" y="60.1" font-size="11" fill="#1d6fd1">b = 0.8</text>
  <text x="178.3" y="80.8" font-size="11" fill="#6c7a93">b = 0</text>
</svg>
```

$b = 1$ (red) rises fastest and overshoots. $b = 0$ (grey) never overshoots but crawls. $b = 0.8$ (blue) gets close to the target nearly as fast as $b = 1$ and hardly overshoots at all.
:::
