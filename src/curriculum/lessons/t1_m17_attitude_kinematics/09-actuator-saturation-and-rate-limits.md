---
id: l09-actuator-saturation-and-rate-limits
title: Actuator saturation and rate limits
minutes: 22
covers:
  - actuator saturation and rate limits
---

Every control law in this module has been written as though the actuator does what it is told. It does not. A reaction wheel has a maximum motor torque and a maximum stored momentum. A thruster cannot fire for less than its minimum on-time and cannot fire for more than the propellant allows. A gimbal has a travel limit and a rate limit. A magnetorquer has a maximum dipole, and its torque depends on a field direction it does not control.

Saturation is not an edge case that appears only in failures. It appears in normal operation — during every large slew, every gust, every recovery from a safe mode — and it is where linear control theory stops applying. The loop, in effect, opens: the plant stops receiving what the controller commanded, feedback stops closing, and the state evolves under whatever the actuator can actually deliver. What happens next depends entirely on how the controller was built.

The worst behaviour comes from the most innocuous-looking component. A controller with integral action, run into saturation, keeps accumulating error it cannot act on, and by the time the actuator recovers the integrator holds a command so large that the vehicle flies far past its target before the accumulated command bleeds off. That is **integrator windup**, and this lesson measures it — a $45^\circ$ slew that overshoots by $35^\circ$ — and shows the three standard fixes.

## A catalogue of limits

| Limit | Actuator | What it caps |
| --- | --- | --- |
| Magnitude | Wheel motor torque, thruster force, magnetorquer dipole | Angular acceleration |
| Stroke or capacity | Wheel stored momentum, gimbal deflection, propellant | Total momentum change, sustained torque |
| Rate | Gimbal slew rate, wheel torque slew, valve response | Bandwidth, and in an amplitude-dependent way |
| Quantisation | Thruster minimum impulse bit | Finest achievable increment |
| Direction | Magnetorquer, single-gimbal CMG near a singularity | Achievable torque directions |

Several of these usually bind at once. A gimbal that has run out of travel is also, at that instant, unable to change its angle in the useful direction at any rate; a wheel at its momentum limit still has its full motor torque but only in the unloading direction. It is worth writing down which limit is active before diagnosing anything.

## What saturation does to a loop

Saturation is a static nonlinearity, so the useful first-order model is its **describing function**: replace the nonlinearity by the gain it applies to the fundamental of a sinusoidal input. For a magnitude limiter driven by an amplitude the limiter clips, the effective gain falls below one and keeps falling as the drive grows; a loop designed with a gain margin of 6 dB becomes, in deep saturation, a loop with a much lower open-loop gain. Low gain on a *stable* plant means a sluggish response, which is usually survivable. Low gain on an *unstable* plant — a boosting launch vehicle, for instance — means the plant's divergence is no longer being stabilised.

The second effect is the dangerous one, because it is invisible in a magnitude limiter and dominant in a rate limiter: saturation adds **phase lag**. That is the subject of the section after next.

## Integrator windup

A proportional–integral–derivative controller exists partly to remove steady-state error against a constant disturbance. On an attitude loop, a constant disturbance torque $M_d$ with proportional gain $K_p$ alone leaves a standing error $M_d/K_p$; the integral term drives that to zero by accumulating $\int e\,dt$ until it supplies exactly $-M_d$.

Now saturate the actuator. The error is large, the commanded torque exceeds the limit, and the actuator delivers the limit. The vehicle responds as fast as it can, which is slower than the controller expects, so the error stays large — and the integrator keeps integrating it. By the time the vehicle reaches its target, the integrator holds a huge accumulated command that is still pushing. The vehicle sails past, and the error has to change sign and stay wrong long enough to unwind the integrator before the controller can pull it back.

::: key Integrator windup and its fixes
While an actuator is saturated the integrator keeps accumulating error it cannot act on, so the command overshoots badly on recovery. Fix it by clamping the integrator, by back-calculation anti-windup that feeds the saturation difference back into the integrator state, or by conditioning the integrator so that it accumulates only when the actuator is out of saturation.
:::

```python
import numpy as np

I, T_MAX, T_DIST = 1500.0, 0.05, 0.01      # kg m^2, N m actuator limit, N m disturbance
wn, zeta = 0.02, 0.7
Kp, Kd, Ki = I * wn**2, 2 * zeta * wn * I, I * wn**3 / 5

def run(mode, theta0=np.radians(45.0), dt=0.02, t_end=3000.0, Tt=20.0):
    theta, rate, integ = theta0, 0.0, 0.0
    peak, last_out = 0.0, 0.0
    for k in range(int(t_end / dt)):
        err = -theta
        u_cmd = Kp * err - Kd * rate + Ki * integ
        u = float(np.clip(u_cmd, -T_MAX, T_MAX))
        if mode == "none":
            integ += dt * err
        elif mode == "clamp":                       # conditional integration
            if abs(u_cmd) <= T_MAX or err * u_cmd < 0:
                integ += dt * err
        elif mode == "back":                        # back-calculation
            integ += dt * (err + (u - u_cmd) / (Ki * Tt))
        elif mode == "noint":                       # no integral action at all
            integ = 0.0
        rate += dt * (u + T_DIST) / I
        theta += dt * rate
        peak = min(peak, np.degrees(theta))
        if abs(np.degrees(theta)) >= 0.1:
            last_out = k * dt
    return peak, last_out, np.degrees(theta)

for mode in ("none", "clamp", "back", "noint"):
    peak, settle, final = run(mode)
    print(f"{mode:6s} overshoot {peak:8.3f} deg   settle(0.1 deg) {settle:7.1f} s   final {final: .4f} deg")
# none   overshoot  -35.542 deg   settle(0.1 deg)  1533.2 s   final -0.0000 deg
# clamp  overshoot   -4.248 deg   settle(0.1 deg)   877.9 s   final -0.0000 deg
# back   overshoot    0.000 deg   settle(0.1 deg)  1076.3 s   final  0.0000 deg
# noint  overshoot   -0.517 deg   settle(0.1 deg)  3000.0 s   final  0.9549 deg
```

::: example A 45-degree slew into a saturated wheel
A single axis with $I = 1500\,\mathrm{kg\,m^2}$ is slewed $45^\circ$ back to zero against a constant $0.01\,\mathrm{N\,m}$ disturbance. The wheel motor saturates at $0.05\,\mathrm{N\,m}$. The PID gains come from $\omega_n = 0.02\,\mathrm{rad/s}$ and $\zeta = 0.7$: $K_p = I\omega_n^2 = 0.6$, $K_d = 2\zeta\omega_n I = 42$, $K_i = I\omega_n^3/5 = 0.0024$.

The initial commanded torque is $K_p \times 0.7854 = 0.471\,\mathrm{N\,m}$, **9.4 times** the actuator limit. The loop is deeply saturated from the start.

| Integrator handling | Overshoot | Time to reach and stay within $0.1^\circ$ | Final error |
| --- | --- | --- | --- |
| None (plain PID) | $-35.5^\circ$ | $1533\,\mathrm{s}$ | $0$ |
| Conditional integration | $-4.25^\circ$ | $878\,\mathrm{s}$ | $0$ |
| Back-calculation, $T_t = 20\,\mathrm{s}$ | $0^\circ$ | $1076\,\mathrm{s}$ | $0$ |
| No integral term | $-0.52^\circ$ | never | $0.955^\circ$ |

The plain PID overshoots by $35.5^\circ$ — nearly the whole commanded slew, in the wrong direction — and takes 25 minutes to settle. Conditional integration cuts the overshoot by a factor of eight and the settling time nearly in half. Back-calculation removes the overshoot entirely, at the price of a slightly longer approach, because it holds the controller exactly at the saturation boundary rather than beyond it.

The last row is the control case: with no integral term there is almost no overshoot and no windup, and a permanent $0.955^\circ$ error, which is exactly $M_d/K_p = 0.01/0.6 = 0.01667\,\mathrm{rad}$. That is why the integrator is there, and why the answer is anti-windup rather than deletion.
:::

### The three fixes, precisely

**Clamping, or conditional integration.** Stop integrating whenever the actuator is saturated *and* the error would push it further in. The condition in the code — integrate if $\lvert u_{cmd}\rvert \le u_{max}$, or if the error and the command have opposite signs — lets the integrator unwind but not wind further. It is one comparison, it needs no extra tuning, and it is what most flight software does.

**Back-calculation.** Feed the difference between the commanded and delivered output back into the integrator:

$$
\dot{x}_i = e + \frac{1}{T_t}\bigl(u_{sat} - u_{cmd}\bigr).
$$

During saturation the second term drives $x_i$ to whatever value makes $u_{cmd} = u_{sat}$, so the controller sits exactly on the boundary and comes off it the instant the error allows. The tracking time constant $T_t$ sets how fast: too large and it behaves like no anti-windup, too small and it fights the integrator during normal operation. A common starting point is $T_t$ of the order of the derivative time, tuned from there.

**Integrator conditioning by design.** Do not let the loop saturate in the first place. Command a feasible reference: instead of stepping the setpoint $45^\circ$, generate a trajectory the actuator can follow — accelerate at the torque limit, coast at a rate limit, decelerate — and let the feedback loop handle only the small error around it. This is the best answer when the manoeuvre is planned, which on a spacecraft is most of the time, and it also prevents the *derivative* kick and the momentum-capacity problem discussed below.

::: warning Anti-windup is not a substitute for authority
All three fixes make a saturated loop behave gracefully. None of them makes the actuator stronger. If the vehicle genuinely cannot produce the torque the mission requires — a slew rate that needs more than the wheels can give, a gust that needs more than the gimbal can give — the answer is a bigger actuator, a slower manoeuvre or a different trajectory. Anti-windup changes the failure from "wild overshoot" to "as fast as physically possible", which is the right failure but is still a failure to meet the requirement.
:::

## Rate limits add phase lag

A magnitude limiter reduces gain. A rate limiter reduces gain *and* delays the signal, and the delay is what destabilises loops.

Drive a rate limiter with $A\sin\omega t$ and define the saturation ratio

$$
\lambda = \frac{\dot{u}_{max}}{A\omega},
$$

which is one when the demanded peak rate exactly equals the limit. For $\lambda \ge 1$ the limiter is transparent. Below one, the output becomes a triangular wave that lags the input, and the fundamental component behaves like this:

| $\lambda$ | Effective gain | Phase lag |
| --- | --- | --- |
| $1.0$ | $1.000$ | $0^\circ$ |
| $0.8$ | $0.949$ | $5.8^\circ$ |
| $0.6$ | $0.763$ | $23.3^\circ$ |
| $0.4$ | $0.509$ | $51.1^\circ$ |
| $0.2$ | $0.255$ | $71.7^\circ$ |
| $0.1$ | $0.127$ | $80.9^\circ$ |

Phase lag reaches $50^\circ$ by the time the demand is two and a half times the limit, and approaches $90^\circ$ in deep saturation. A loop designed with $40^\circ$ of phase margin is unstable once $\lambda$ drops below about $0.5$, and the instability is self-sustaining: the oscillation keeps the demand high, which keeps $\lambda$ low, which keeps the lag large. This is the mechanism behind pilot-induced oscillations in aircraft and behind more than one launch vehicle loss.

::: example Rate limiting on the ascent gimbal
The first stage of the previous lesson has $\dot{\delta}_{max} = 8\,^\circ/\mathrm{s}$ and a rigid-body crossover near $2\,\mathrm{rad/s}$. A gust that demands $\pm 3^\circ$ of gimbal at that frequency requires a peak rate of $3 \times 2 = 6\,^\circ/\mathrm{s}$, so $\lambda = 8/6 = 1.33$: transparent, no penalty.

Let the demand grow to $\pm 6^\circ$ at the same frequency and the required rate is $12\,^\circ/\mathrm{s}$, giving $\lambda = 0.67$. The table puts the effective gain near $0.8$ and the phase lag near $18^\circ$. On a plant with an unstable pole at $1/\tau = 0.24\,\mathrm{rad/s}$ and perhaps $35^\circ$ of phase margin designed in, spending $18^\circ$ of it on the actuator leaves very little — and the actuator dynamics, the bending filter and the computational delay have already taken their share.

This is why ascent autopilots include explicit load-relief logic. Relieving the load reduces the angle of attack the vehicle must fight, which reduces the gimbal amplitude demanded at crossover, which keeps $\lambda$ above one. The trajectory accuracy given up in exchange buys phase margin, which is the currency the loop actually runs on.
:::

## Capacity saturation: when the actuator is full

A wheel at its momentum limit is a distinct failure from a wheel at its torque limit. Torque saturation is instantaneous and recovers as soon as the demand drops. Momentum saturation is cumulative, one-sided, and does not recover without an external torque.

::: example A wheel filling up under a secular disturbance
Take the Earth-observing bus, one axis with $I = 1500\,\mathrm{kg\,m^2}$, a $1\,\mathrm{N\,m\,s}$ wheel, and the $2\times 10^{-4}\,\mathrm{N\,m}$ secular gravity-gradient torque of the disturbance lesson. The wheel fills in $1/(2\times 10^{-4}) = 5000\,\mathrm{s}$, a little under one orbit.

At that moment the vehicle loses control authority in one direction only: the wheel can still be slowed, producing torque one way, but cannot be sped up. If the disturbance continues unopposed, the attitude accelerates at $M_d/I = 1.33\times 10^{-7}\,\mathrm{rad/s^2}$, giving

$$
\theta(t) = \tfrac{1}{2}\frac{M_d}{I}t^2 :\qquad 0.038^\circ \text{ after } 100\,\mathrm{s},\quad 3.82^\circ \text{ after } 1000\,\mathrm{s},\quad 15.3^\circ \text{ after } 2000\,\mathrm{s},
$$

with the rate reaching $0.0076\,^\circ/\mathrm{s}$ at $1000\,\mathrm{s}$. Pointing degrades slowly at first and then quadratically; by half an hour the payload is useless and the vehicle is heading for a safe-mode trip.

The design response is not a bigger wheel — quadrupling it only buys four orbits — but a momentum dump scheduled well before saturation, with the threshold set so that the dump completes with margin. A magnetorquer at $10\,\mathrm{A\,m^2}$ in a $2.6\times 10^{-5}\,\mathrm{T}$ field produces $2.6\times 10^{-4}\,\mathrm{N\,m}$, slightly more than the disturbance, so it can unload the wheel while the disturbance keeps pushing — slowly, which is exactly why the dump has to be started early rather than at the limit.
:::

::: warning Saturation flags belong in telemetry
A loop that spends its life against a limit looks, from the outside, like a loop with poor performance. The distinction matters enormously: one is a tuning problem and the other is a sizing problem, and they have opposite fixes. Every flight controller should report, per cycle, whether each actuator was commanded beyond its limit and by how much, and every simulation should report the fraction of the run spent saturated. In the worked example above the plain PID case spent a quarter of its run against the torque limit; that number, on its own, explains the $35^\circ$ overshoot.
:::

::: note Saturation you cannot see in a single-axis model
Three-axis saturation has failure modes a per-axis model misses. A wheel cluster can be within every individual wheel's torque limit while the *combination* the allocation asks for is infeasible. A CMG cluster near a singularity has full gimbal rate available and still cannot produce torque in one direction. A thruster set with one valve failed off may be unable to produce a pure couple about some axis at all. In each case the correct model is the achievable torque *set* — a polytope or a lumpy solid, not a box — and the controller has to project its command onto that set rather than clipping each axis independently. Clipping axis by axis changes the torque direction, which on a coupled vehicle is worse than delivering less torque in the right direction.
:::

## Check yourself

::: check
A PID attitude loop with $K_p = 0.6$, $K_i = 0.0024$ holds against a $0.01\,\mathrm{N\,m}$ disturbance. What value must the integrator state reach in steady state, and how long does it take to accumulate that from a $1^\circ$ error?
:::

::: answer
In steady state the error is zero, so the proportional and derivative terms contribute nothing and the integral term alone must supply $-M_d = -0.01\,\mathrm{N\,m}$. Since the output is $K_i x_i$,

$$
x_i = \frac{-0.01}{0.0024} = -4.17\,\mathrm{rad\,s}.
$$

From a constant $1^\circ = 0.01745\,\mathrm{rad}$ error, $x_i$ accumulates at $0.01745$ per second, so it would take $4.17/0.01745 = 239\,\mathrm{s}$. In practice the error shrinks as the integrator builds, so it takes longer.

Two useful consequences. First, the integrator is *slow* by construction, which is why winding it up with a large error is so damaging — it takes just as long to unwind. Second, $4.17\,\mathrm{rad\,s}$ is the legitimate operating value; a windup case that reaches $128\,\mathrm{rad\,s}$, as the plain PID above does, is thirty times past anything the physics requires.
:::

::: check
Why does conditional integration use the test "saturated AND the error would drive further into saturation" rather than simply "saturated"?
:::

::: answer
Because an integrator that is frozen whenever the actuator is saturated cannot unwind. Consider the overshoot phase: the vehicle has passed its target, the error has reversed sign, and the controller is commanding hard in the new direction — still saturated, because the accumulated integrator plus the new proportional term exceeds the limit. Freezing on saturation alone keeps the stale accumulation locked in exactly when you most want it discharged, and the loop can stick there.

The two-part test lets the integrator move in the helpful direction and blocks only the harmful one. Written out: integrate if the command is within limits, or if the sign of the error is opposite to the sign of the command, which means integrating will reduce the magnitude of the command. It is the difference between a latch and a diode.
:::

::: check
A gimbal with $\dot{\delta}_{max} = 10\,^\circ/\mathrm{s}$ is asked for $\pm 4^\circ$ at $1.5\,\mathrm{rad/s}$. Compute $\lambda$ and estimate the phase lag. Does the loop have a problem?
:::

::: answer
The demanded peak rate is $A\omega = 4 \times 1.5 = 6\,^\circ/\mathrm{s}$, so

$$
\lambda = \frac{\dot{\delta}_{max}}{A\omega} = \frac{10}{6} = 1.67 .
$$

That is above one, so the rate limiter is transparent: no gain loss, no phase lag, no problem from this demand.

The margin is worth quoting, though. The demand could grow by $67\,\%$ before rate saturation starts, and the table shows that the penalty then rises quickly — by $\lambda = 0.6$, meaning a demand of $16.7\,^\circ/\mathrm{s}$, the lag is already $23^\circ$. So the honest answer is "no problem at this demand, and about a factor of 1.7 of margin before there is one", which is a reasonable but not generous design point for a gust-driven amplitude.
:::

::: check
A reaction wheel is at $95\,\%$ of its momentum capacity. Describe the vehicle's remaining control authority about that axis, and say what a controller should do differently.
:::

::: answer
Torque authority is intact in one direction and nearly exhausted in the other. The wheel can still be decelerated at full motor torque — producing body torque in the direction that unloads it — but can be accelerated only until the remaining $5\,\mathrm{\%}$ of capacity is used, which at full motor torque is a matter of seconds. The vehicle is effectively one-sided about that axis.

A controller should be aware of the asymmetry rather than discover it. Practical measures: include momentum in the allocation cost so that a redundant four-wheel cluster preferentially uses wheels with headroom; trigger a momentum dump on a threshold well below the limit, chosen so the dump finishes before the remaining margin is consumed; and, if a manoeuvre is planned, check its momentum requirement against the available headroom before starting rather than saturating halfway through. Reporting wheel momentum as a fraction of capacity in telemetry is the minimum.
:::

::: check
A loop that saturates spends a quarter of its run against the limit and overshoots badly. A colleague proposes lowering the proportional gain so the command never saturates. Evaluate the proposal.
:::

::: answer
It works, in the narrow sense that a low enough gain never asks for more than the actuator can deliver — and it costs exactly what you would expect. Bandwidth falls in proportion, so disturbance rejection falls, sensor noise is less well attenuated relative to the slower response, and the manoeuvre takes longer. For a $45^\circ$ slew with a $9.4$-times-over command, the gain would have to come down by nearly an order of magnitude, and the small-signal performance that the loop was tuned for would go with it.

The better answer separates the two regimes. Keep the gain that gives good small-signal performance, add anti-windup so that large-signal behaviour degrades gracefully, and shape the *reference* so that large commands are fed in as a feasible trajectory — accelerate at the torque limit, coast, decelerate — rather than as a step. The feedback loop then only ever sees small errors, never saturates in normal operation, and retains its full bandwidth where it matters.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Magnitude, stroke, rate, quantisation, direction | The five kinds of actuator limit; usually more than one is active |
| Describing function | Effective gain of a nonlinearity to the fundamental; saturation lowers gain |
| Integrator windup | Accumulation during saturation that overshoots on recovery |
| Conditional integration | Integrate if in limits, or if error and command have opposite signs |
| $\dot{x}_i = e + (u_{sat} - u_{cmd})/T_t$ | Back-calculation anti-windup; $T_t$ sets the unwinding speed |
| Worked slew | $45^\circ$, $9.4\times$ over limit: $-35.5^\circ$ overshoot plain, $-4.2^\circ$ clamped, $0^\circ$ back-calculated |
| $M_d/K_p$ | Standing error with no integral action; $0.955^\circ$ in the example |
| $\lambda = \dot{u}_{max}/(A\omega)$ | Rate-limit saturation ratio; transparent for $\lambda \ge 1$ |
| Rate-limit lag | $23^\circ$ at $\lambda = 0.6$, $51^\circ$ at $0.4$, approaching $90^\circ$ |
| Momentum saturation | One-sided and cumulative; $\theta = \tfrac{1}{2}(M_d/I)t^2$ once authority is lost |
| Design answer | Feasible reference trajectories, anti-windup, saturation flags in telemetry |

The last lesson of the module returns to kinematics with the error that all of this control effort is built on top of. When the angular velocity vector itself rotates, integrating body rates naively loses part of the rotation, and the loss is secular. That is coning, and strapdown navigators correct it with multi-sample algorithms rather than with a smaller step.
