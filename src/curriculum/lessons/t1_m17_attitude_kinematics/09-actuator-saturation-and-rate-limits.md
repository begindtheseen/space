---
id: l09-actuator-saturation-and-rate-limits
title: Actuator saturation and rate limits
minutes: 24
covers:
  - actuator saturation and rate limits
---

Push a small car's gas pedal to the floor. The engine gives everything it has, and pushing harder does nothing more. Every actuator on a spacecraft has a floor like that.

Every control law in this module so far assumed the actuator does exactly what it is told. It does not. A reaction wheel has a maximum motor torque and a maximum stored spin. A thruster has a shortest on-time and a finite propellant supply. An engine gimbal swings only so far, and only so fast. A magnetorquer has a maximum strength, and its torque depends on Earth's field direction, which it does not control.

An actuator asked for more than it can give is **[[saturated|saturation-word]]** — pinned against its limit. This is not a rare failure. It happens in normal flight: every large turn, every strong gust, every recovery from safe mode. It is also where the neat, straight-line theory of control stops applying. The loop, in effect, opens: the vehicle no longer gets what the controller asked for, and moves under whatever the actuator can deliver. What happens next depends on how the controller was built.

The worst behavior comes from the most innocent-looking part. A controller with a memory of past error, run into saturation, keeps piling up error it cannot act on. When the actuator recovers, that memory holds a command so large that the vehicle flies far past its target. That is **integrator windup**. This lesson measures it — a $45^\circ$ turn that overshoots by $35^\circ$ — and shows the three standard fixes.

## A catalog of limits

A bathtub faucet has a maximum flow, the tub has a maximum volume, and you can only turn the handle so fast. Actuators have the same three kinds of limit, plus two more.

| Limit | Actuator | What it caps |
| --- | --- | --- |
| Magnitude | Wheel motor torque, thruster force, magnetorquer dipole | Angular acceleration |
| Stroke or capacity | Wheel stored momentum, gimbal deflection, propellant | Total momentum change, sustained torque |
| Rate | Gimbal slew rate, wheel torque slew, valve response | Bandwidth, in a way that depends on amplitude |
| Quantization | Thruster minimum impulse bit | Finest achievable increment |
| Direction | Magnetorquer, single-gimbal CMG near a singularity | Achievable torque directions |

**Stroke** is how far something can travel end to end. **Quantization** means output comes in fixed-size chunks, like coins. **[[Bandwidth|bandwidth-word]]** is roughly how fast a wiggle the loop can follow.

Several limits usually bite at once. A gimbal out of travel cannot move further in the useful direction at any rate. A wheel at its momentum limit keeps its full motor torque, but only in the direction that slows it down. Before diagnosing a misbehaving loop, write down which limit is active.

## What saturation does to a loop

Ask for less than the limit and you get what you asked for. Ask for more and you get the limit. Output against command is a straight line with both ends bent flat — a **nonlinearity**, a rule that is not "output equals a constant times input". Linear control theory cannot handle it directly. The usual trick is the **[[describing function|describing-function]]**: feed the nonlinearity a sine wave and ask what gain it applies to the main sine wave that comes out.

For a magnitude limiter, the gain is one while the sine stays under the limit. Once it clips, the effective gain falls below one, and keeps falling the harder you drive it. So a loop designed with a comfortable **gain margin** — room for the gain to grow before instability, say $6\,\mathrm{dB}$, a factor of two — behaves in deep saturation like a loop with much less gain.

On a *stable* vehicle, low gain means a sluggish response. On an *unstable* one — a rocket climbing through air, which wants to flip — it means the divergence is no longer held down.

The second effect is the dangerous one, invisible in a magnitude limiter and dominant in a rate limiter: saturation adds **phase lag**, a delay between command and response. That comes two sections from now.

## Integrator windup

A **PID controller** adds three terms. The **proportional** term, gain $K_p$ ("K sub p"), pushes in proportion to the error right now. The **derivative** term, gain $K_d$, pushes against the rate, like a shock absorber. The **integral** term, gain $K_i$, pushes in proportion to the **[[running total of past error|integral-memory]]**, $x_i = \int e\,dt$ — read "the integral of e, d t".

Why a running total? Let a steady disturbance torque $M_d$ lean on the vehicle, like wind on a sail. The proportional term pushes back only if there is error, so the vehicle settles at a standing error $M_d/K_p$ — just enough that $K_p$ times it balances the disturbance. The integrator removes that: while any error remains, $x_i$ keeps growing, until the integral term alone supplies $-M_d$ and the error is zero.

Now saturate the actuator. The error is large, the command exceeds the limit, and the actuator delivers only the limit. The vehicle turns slower than the controller expects, so the error stays large — and the integrator keeps adding it up.

By the time the vehicle reaches its target, the integrator holds a huge stored command that is still pushing. The vehicle sails past. The error must then flip sign and stay wrong long enough to drain the integrator before the controller can pull the vehicle back.

::: key Integrator windup and its fixes
While an actuator is saturated the integrator keeps accumulating error it cannot act on, so the command overshoots badly on recovery. Fix it by clamping the integrator, by back-calculation anti-windup that feeds the saturation difference back into the integrator state, or by conditioning the integrator so that it accumulates only when the actuator is out of saturation.
:::

This one-axis simulation runs the same turn four ways: plain PID, conditional integration, back-calculation (both explained after the example), and no integrator at all.

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
**The setup.** One axis with moment of inertia $I = 1500\,\mathrm{kg\,m^2}$ starts $45^\circ$ off target and is turned (**slewed**) back to zero against a constant $0.01\,\mathrm{N\,m}$ disturbance. The wheel motor saturates at $0.05\,\mathrm{N\,m}$.

**The gains.** They come from a chosen natural frequency $\omega_n = 0.02\,\mathrm{rad/s}$ ("omega sub n", how fast the loop is meant to respond) and damping ratio $\zeta = 0.7$ ("zeta"):

$$
K_p = I\omega_n^2 = 1500 \times 0.02^2 = 0.6, \qquad K_d = 2\zeta\omega_n I = 2 \times 0.7 \times 0.02 \times 1500 = 42, \qquad K_i = \frac{I\omega_n^3}{5} = \frac{1500 \times 0.02^3}{5} = 0.0024 .
$$

**How saturated is it?** $45^\circ$ is $0.7854\,\mathrm{rad}$. The first commanded torque is $K_p \times 0.7854 = 0.6 \times 0.7854 = 0.471\,\mathrm{N\,m}$. Divide by the limit: $0.471/0.05 = 9.4$. The controller asks for **9.4 times** what the wheel can give. The loop is deeply saturated from the first instant.

**The results:**

| Integrator handling | Overshoot | Time to reach and stay within $0.1^\circ$ | Final error |
| --- | --- | --- | --- |
| None (plain PID) | $-35.5^\circ$ | $1533\,\mathrm{s}$ | $0$ |
| Conditional integration | $-4.25^\circ$ | $878\,\mathrm{s}$ | $0$ |
| Back-calculation, $T_t = 20\,\mathrm{s}$ | $0^\circ$ | $1076\,\mathrm{s}$ | $0$ |
| No integral term | $-0.52^\circ$ | never | $0.955^\circ$ |

**Reading it.** The plain PID overshoots by $35.5^\circ$ — nearly the whole turn again, on the wrong side — and takes about 25 minutes to settle. Conditional integration cuts the overshoot about eightfold ($35.5/4.25 \approx 8.4$) and the settling time to a bit over half. Back-calculation removes the overshoot entirely, at the price of a slightly slower approach, because it holds the controller exactly on the saturation boundary.

**The control case.** With no integral term there is almost no overshoot — but a permanent $0.955^\circ$ error. Check it: $M_d/K_p = 0.01/0.6 = 0.01667\,\mathrm{rad}$, and $0.01667 \times 180/\pi = 0.955^\circ$. It matches. That is why the integrator is there, and why the answer is anti-windup, not deletion.
:::

### The three fixes, precisely

**Clamping, or conditional integration.** Stop integrating whenever the actuator is saturated *and* the error would push it further in. In the code: integrate if $\lvert u_{cmd}\rvert \le u_{max}$ (within limits), or if error and command have opposite signs. The integrator can unwind but not wind further. It is one comparison, needs no tuning, and is what most flight software does.

**Back-calculation.** Feed the difference between what was delivered and what was commanded back into the integrator:

$$
\dot{x}_i = e + \frac{1}{T_t}\bigl(u_{sat} - u_{cmd}\bigr).
$$

Here $u_{sat}$ ("u sat") is the saturated, delivered output and $u_{cmd}$ is the command. Inside the limits the two are equal, the bracket is zero, and the integrator behaves normally. During saturation the bracket is nonzero, and it drives $x_i$ to whatever value makes $u_{cmd} = u_{sat}$. So the controller sits exactly on the boundary and comes off it the instant the error allows.

The **tracking time constant** $T_t$ sets how fast. Too large behaves like no anti-windup; too small fights the integrator in normal operation. A common start is $T_t$ near the derivative time.

**Integrator conditioning by design.** Do not let the loop saturate at all. Instead of jumping the target $45^\circ$, give the loop a **[[feasible reference|feasible-reference]]** — a planned path the actuator can follow: speed up at the torque limit, coast, slow down. Feedback then handles only the small error around that path. For planned maneuvers, most of a spacecraft's, this is the best answer. It also prevents the **derivative kick** (the jolt when the derivative term sees the target jump) and the momentum-capacity problem below.

::: warning Anti-windup is not a substitute for authority
All three fixes make a saturated loop behave gracefully; none makes the actuator stronger. If the mission needs more torque than the wheels or gimbal can give, the answer is a bigger actuator, a slower maneuver or a different trajectory. Anti-windup turns "wild overshoot" into "as fast as physically possible" — the right failure, but still a failure to meet the requirement.
:::

## Rate limits add phase lag

Try to copy a friend's hand as they wave it faster and faster. Soon your hand moves at its top speed, back and forth, and is always a little late: smaller *and* behind. That is a **rate limiter**. A magnitude limiter only reduces gain; a rate limiter also delays the signal, and the delay is what destabilizes loops.

Drive a rate limiter with the command $A\sin\omega t$: amplitude $A$, frequency $\omega$ ("omega"). The fastest the command ever changes is $A\omega$. Compare that with the actuator's top rate $\dot{u}_{max}$ ("u dot max") in the **saturation ratio**

$$
\lambda = \frac{\dot{u}_{max}}{A\omega},
$$

read "lambda". It equals one when the demanded peak rate exactly equals the limit. For $\lambda \ge 1$ the limiter is transparent: it never binds. Below one, the output turns into a **[[triangle wave that lags the input|triangle-lag]]**, and its main sine component behaves like this:

| $\lambda$ | Effective gain | Phase lag |
| --- | --- | --- |
| $1.0$ | $1.000$ | $0^\circ$ |
| $0.8$ | $0.949$ | $5.8^\circ$ |
| $0.67$ | $0.842$ | $15.5^\circ$ |
| $0.6$ | $0.763$ | $23.3^\circ$ |
| $0.5$ | $0.637$ | $38.2^\circ$ |
| $0.4$ | $0.509$ | $51.1^\circ$ |
| $0.2$ | $0.255$ | $71.7^\circ$ |
| $0.1$ | $0.127$ | $80.9^\circ$ |

The lag passes $50^\circ$ once the demand is two and a half times the limit ($\lambda = 0.4$) and creeps toward $90^\circ$ in deep saturation.

A loop's **[[phase margin|phase-margin]]** is how much extra delay it can absorb before it oscillates on its own. A loop designed with $40^\circ$ of it goes unstable once $\lambda$ drops below about $0.5$. And the instability feeds itself: the oscillation keeps the demand high, which keeps $\lambda$ low, which keeps the lag large. This is the mechanism behind **[[pilot-induced oscillations|pio-history]]** in aircraft, and ascent autopilots are designed to stay clear of it.

::: example Rate limiting on the ascent gimbal
Take a first stage like the previous lesson's: gimbal rate limit $\dot{\delta}_{max} = 8\,^\circ/\mathrm{s}$ ("delta dot max"), and a loop that crosses over — does most of its work — near $2\,\mathrm{rad/s}$.

**A moderate gust** demands $\pm 3^\circ$ of gimbal at $2\,\mathrm{rad/s}$: a peak rate of $A\omega = 3 \times 2 = 6\,^\circ/\mathrm{s}$, so $\lambda = 8/6 = 1.33$. Above one: no penalty.

**A bigger gust** demands $\pm 6^\circ$ at the same frequency: a peak rate of $6 \times 2 = 12\,^\circ/\mathrm{s}$, so $\lambda = 8/12 = 0.67$. The table puts the effective gain near $0.84$ and the phase lag near $16^\circ$.

**What that costs.** This vehicle is unstable in the air, diverging at about $1/\tau = 0.24\,\mathrm{rad/s}$. With perhaps $35^\circ$ of phase margin designed in, spending $16^\circ$ on the gimbal leaves about $19^\circ$ — and actuator dynamics, the bending filter and computing delay have already taken their shares.

**The design response.** Hence ascent autopilots carry **[[load relief|load-relief]]** logic. Letting the vehicle lean slightly into the gust reduces the angle it must fight, so the gimbal amplitude at crossover drops and $\lambda$ stays above one. Trajectory accuracy is traded for phase margin — the currency the loop actually runs on.
:::

## Capacity saturation: when the actuator is full

A reaction wheel stores the vehicle's unwanted spin by spinning up itself, like a piggy bank that every bit of disturbance drops a coin into. A wheel at its **momentum limit** — its top speed — is a full bank. Torque saturation is instantaneous and ends as soon as the demand drops. Momentum saturation builds up, is **one-sided**, and does not go away without an outside torque to empty the bank.

::: example A wheel filling up under a secular disturbance
**The setup.** Take the Earth-observing satellite of the disturbance lesson: one axis with $I = 1500\,\mathrm{kg\,m^2}$, a wheel that holds $1\,\mathrm{N\,m\,s}$, and a **secular** (steady, one-direction) gravity-gradient torque of $M_d = 2\times 10^{-4}\,\mathrm{N\,m}$.

**Time to fill.** Momentum is torque times time, so the wheel fills in $1/(2\times 10^{-4}) = 5000\,\mathrm{s}$ — a little under one $5554\,\mathrm{s}$ orbit.

**What is lost.** Control in one direction: the wheel can still be slowed, but not sped up. The unopposed disturbance gives the body an angular acceleration

$$
\frac{M_d}{I} = \frac{2\times 10^{-4}}{1500} = 1.33\times 10^{-7}\,\mathrm{rad/s^2}.
$$

Starting from rest, the angle grows like a dropped ball, $\theta(t) = \tfrac{1}{2}(M_d/I)t^2$:

$$
\theta(t) = \tfrac{1}{2}\frac{M_d}{I}t^2 :\qquad 0.038^\circ \text{ after } 100\,\mathrm{s},\quad 3.82^\circ \text{ after } 1000\,\mathrm{s},\quad 15.3^\circ \text{ after } 2000\,\mathrm{s}.
$$

For instance at $1000\,\mathrm{s}$: $\tfrac{1}{2} \times 1.33\times 10^{-7} \times 1000^2 = 0.0667\,\mathrm{rad} = 3.82^\circ$, and the rate is $1.33\times 10^{-4}\,\mathrm{rad/s} = 0.0076\,^\circ/\mathrm{s}$. Ten times the time gives a hundred times the angle. Within half an hour the camera is useless and the vehicle is heading for safe mode.

**The design response.** A bigger wheel only postpones it — four times the capacity fills in $20\,000\,\mathrm{s}$, about three and a half orbits. The real answer is a **momentum dump** triggered well before saturation. A $10\,\mathrm{A\,m^2}$ magnetorquer in a $2.6\times 10^{-5}\,\mathrm{T}$ field makes $10 \times 2.6\times 10^{-5} = 2.6\times 10^{-4}\,\mathrm{N\,m}$, only slightly more than the disturbance. It can empty the wheel while the disturbance keeps pushing, but slowly — which is why the dump must start early, not at the limit.
:::

::: warning Saturation flags belong in telemetry
A loop that lives against a limit looks, from outside, like a badly tuned loop. But one is a tuning problem and the other a sizing problem, with opposite fixes. Flight software should report, each cycle, whether each actuator was commanded past its limit and by how much; every simulation should report the fraction of the run spent saturated. In the $45^\circ$ slew, the plain PID case spent about a quarter of its run against the torque limit. That number alone explains the $35^\circ$ overshoot.
:::

::: note Saturation you cannot see in a single-axis model
Three axes add failure modes. A wheel cluster can be within every wheel's limit while the *combination* asked for is impossible. A CMG cluster near a singularity has full gimbal rate and still cannot make torque in one direction. A thruster set with one valve stuck shut may be unable to make a pure twist about some axis.

The right model is the **achievable torque set** — a many-sided solid (a polytope) or a lumpy shape, not a box — and the controller should project its command onto it rather than clip each axis alone. Clipping axis by axis changes the torque's direction, which on a coupled vehicle is worse than less torque in the right direction.
:::

## Check yourself

::: check
A PID attitude loop with $K_p = 0.6$ and $K_i = 0.0024$ holds against a $0.01\,\mathrm{N\,m}$ disturbance. What value must the integrator state reach in steady state? How long would it take to build that up from a steady $1^\circ$ error?
:::

::: answer
In steady state the error is zero, so only the integral term acts, and it must supply $-M_d = -0.01\,\mathrm{N\,m}$. Its output is $K_i x_i$, so

$$
x_i = \frac{-0.01}{0.0024} = -4.17\,\mathrm{rad\,s}.
$$

A steady $1^\circ = 0.01745\,\mathrm{rad}$ error adds $0.01745$ per second, so it takes $4.17/0.01745 = 239\,\mathrm{s}$ — longer in practice, since the error shrinks as the integrator builds.

So the integrator is *slow* by design, which is why winding it up is so damaging: it takes just as long to unwind. And $4.17\,\mathrm{rad\,s}$ is the honest operating value; the plain PID in the slew example reaches about $127\,\mathrm{rad\,s}$, some thirty times what the physics needs.
:::

::: check
Why does conditional integration use the test "saturated AND the error would drive it further into saturation" instead of simply "saturated"?
:::

::: answer
Because an integrator frozen whenever the actuator is saturated cannot unwind.

In the overshoot phase the vehicle has passed its target, the error has flipped sign, and the controller may *still* be saturated, because the stored integrator plus the new proportional term is over the limit. Freezing on "saturated" alone locks the stale total in place exactly when you want it drained, and the loop can get stuck.

The two-part test lets the integrator move in the helpful direction and blocks only the harmful one: integrate if the command is within limits, or if the error's sign is opposite to the command's — because then integrating shrinks the command. It is a one-way valve (a diode), not a latch that blocks both ways.
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

State the margin, though. The demand could grow by $67\,\%$ before rate saturation starts, and then the penalty rises fast: by $\lambda = 0.6$ — a demand of $10/0.6 = 16.7\,^\circ/\mathrm{s}$ — the lag is already $23^\circ$. "No problem now, a factor of $1.7$ of margin" is reasonable but not generous for a gust-driven amplitude.
:::

::: check
A reaction wheel is at $95\,\%$ of its momentum capacity. Describe the vehicle's remaining control authority about that axis, and say what a controller should do differently.
:::

::: answer
Authority is intact one way and nearly gone the other. The wheel can still be slowed at full torque, pushing the body the way that empties it. It can be sped up only until the last $5\,\%$ is used — seconds at full torque. The vehicle is effectively one-sided about that axis.

A controller should know this rather than discover it:

- share torque out by momentum, so a four-wheel cluster leans on wheels with room;
- trigger a momentum dump well below the limit, so it finishes before the margin is gone;
- check a planned maneuver's momentum need against the room left before starting it.

At minimum, telemetry should report each wheel's momentum as a fraction of capacity.
:::

::: check
A loop that saturates spends a quarter of its run against the limit and overshoots badly. A colleague proposes lowering the proportional gain so the command never saturates. Evaluate the proposal.
:::

::: answer
It works narrowly: a low enough gain never asks for more than the actuator can give. The cost is what you would expect. Bandwidth falls with the gain, so disturbances are fought off less well, sensor noise matters more against the slower response, and maneuvers take longer. For a $45^\circ$ slew commanded $9.4$ times over the limit, the gain would have to drop nearly tenfold, and the small-error performance the loop was tuned for would go with it.

Better to separate the two situations. Keep the gain that gives good small-error performance. Add anti-windup so large errors degrade gracefully. And shape the *reference*: feed big changes in as a feasible path — speed up at the torque limit, coast, slow down — instead of a jump. The loop then only sees small errors, never saturates in normal operation, and keeps its full bandwidth.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Magnitude, stroke, rate, quantization, direction | The five kinds of actuator limit; usually more than one is active |
| Describing function | Effective gain of a nonlinearity to the main sine wave; saturation lowers gain |
| Integrator windup | Accumulation during saturation that overshoots on recovery |
| Conditional integration | Integrate if within limits, or if error and command have opposite signs |
| $\dot{x}_i = e + (u_{sat} - u_{cmd})/T_t$ | Back-calculation anti-windup; $T_t$ sets the unwinding speed |
| Worked slew | $45^\circ$, $9.4\times$ over limit: $-35.5^\circ$ overshoot plain, $-4.2^\circ$ clamped, $0^\circ$ back-calculated |
| $M_d/K_p$ | Standing error with no integral action; $0.955^\circ$ in the example |
| $\lambda = \dot{u}_{max}/(A\omega)$ | Rate-limit saturation ratio; transparent for $\lambda \ge 1$ |
| Rate-limit lag | $23^\circ$ at $\lambda = 0.6$, $51^\circ$ at $0.4$, approaching $90^\circ$ |
| Momentum saturation | One-sided and cumulative; $\theta = \tfrac{1}{2}(M_d/I)t^2$ once authority is lost |
| Design answer | Feasible reference trajectories, anti-windup, saturation flags in telemetry |

The last lesson of the module returns to kinematics, and to an error that sits underneath all of this control effort. When the angular velocity vector itself turns, adding up body rates naively loses part of the rotation, and the loss piles up. That is coning, and inertial navigation units correct it with multi-sample algorithms rather than with a smaller step.

::: context saturation-word A sponge that cannot hold more
"Saturated" comes from the Latin for "filled". A saturated sponge cannot soak up another drop; a saturated actuator cannot give another bit of output. Plot what you get against what you ask for and the line goes straight up the middle, then flattens at the limits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="85" x2="330" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="10" x2="180" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <line x1="220" y1="45" x2="260" y2="5" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5,4"/>
  <line x1="140" y1="125" x2="100" y2="165" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5,4"/>
  <polyline points="50,125 140,125 220,45 320,45" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <text x="325" y="100" font-size="12" fill="#1f2a44" text-anchor="end">command</text>
  <text x="186" y="20" font-size="12" fill="#1f2a44">delivered</text>
  <text x="275" y="38" font-size="12" fill="#b4232c" text-anchor="middle">+limit</text>
  <text x="90" y="142" font-size="12" fill="#b4232c" text-anchor="middle">−limit</text>
  <text x="262" y="20" font-size="11" fill="#6c7a93">asked for</text>
</svg>
```

The dashed line is what the controller wanted; the solid line is what it got.
:::

::: context bandwidth-word How fast a loop can follow
Wiggle a target back and forth slowly and a control loop tracks it perfectly. Wiggle it faster and the loop starts to fall behind and shrink the motion. **Bandwidth** is roughly the fastest wiggle, in radians per second, that the loop still follows well. A higher bandwidth means quicker response to gusts and errors — and it needs actuators that can move fast enough to keep up, which is exactly what a rate limit caps.
:::

::: context describing-function Pretending a clipper is a gain
Linear control theory only knows how to handle gains and delays. The describing function is an engineer's trick for sneaking a nonlinearity into it. Feed the nonlinear part a sine wave, look at the sine wave of the same frequency in what comes out, and ask: what gain, and what delay, would have turned the input into that? The answer depends on how big the input was — which is the whole point. It was worked out in the 1940s and 1950s for predicting self-sustained oscillations in servomechanisms, and it is still how engineers first estimate what a limiter will do to a loop.
:::

::: context integral-memory The integrator as a bathtub
Think of the integral term as a bathtub. Error pours in (positive error fills, negative error drains) and the water level is $x_i$. The integral term pushes in proportion to the level. As long as any error remains, the level keeps changing — so the only place the level can settle is where the error is zero. That is why an integrator removes a steady error. It is also why windup is so slow to undo: a tub filled for ten minutes takes a long time to drain.
:::

::: context feasible-reference Speed up, coast, slow down
A feasible reference is a planned path the actuator can actually fly. For a big turn, the planner accelerates at the torque limit, coasts at a chosen top rate, then brakes at the torque limit so the vehicle arrives with zero rate. The rate plot is a trapezoid.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="110" x2="30" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="30,110 100,40 260,40 330,110" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="3"/>
  <text x="335" y="128" font-size="12" fill="#1f2a44" text-anchor="end">time</text>
  <text x="36" y="22" font-size="12" fill="#1f2a44">turn rate</text>
  <text x="65" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">speed up</text>
  <text x="180" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">coast</text>
  <text x="295" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">slow down</text>
  <text x="180" y="80" font-size="11" fill="#1f2a44" text-anchor="middle">area = total angle turned</text>
</svg>
```

The feedback loop only has to correct the small difference between this path and the real motion, so it never saturates.
:::

::: context triangle-lag Smaller and later
Here a sine command (gray) asks for $2.5$ times the actuator's top rate, so $\lambda = 0.4$. The actuator (blue) moves at its top rate in straight lines, turning around only when it catches the command. Its peaks are lower and later than the command's.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="80" x2="345" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="30.0,80.0 36.2,68.0 42.4,56.6 48.6,46.3 54.8,37.6 61.0,31.0 67.2,26.7 73.4,25.0 79.6,26.0 85.8,29.5 92.0,35.5 98.2,43.6 104.4,53.5 110.6,64.7 116.8,76.5 123.0,88.6 129.2,100.2 135.4,110.9 141.6,120.1 147.8,127.3 154.0,132.3 160.2,134.8 166.4,134.6 172.6,131.7 178.8,126.4 185.0,118.9 191.2,109.5 197.4,98.6 203.6,86.9 209.8,74.8 216.0,63.0 222.2,52.0 228.4,42.3 234.6,34.5 240.8,28.9 247.0,25.7 253.2,25.1 259.4,27.2 265.6,31.8 271.8,38.7 278.0,47.7 284.2,58.2 290.4,69.7 296.6,81.7 302.8,93.7 309.0,105.0 315.2,115.1 321.4,123.5 327.6,129.8 333.8,133.7" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <polyline points="30.0,99.6 99.4,45.5 188.0,114.5 276.6,45.5 339.9,94.9" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="73.4" y1="18" x2="99.4" y2="18" stroke="#b4232c" stroke-width="2"/>
  <text x="86" y="13" font-size="11" fill="#b4232c" text-anchor="middle">lag</text>
  <text x="120" y="152" font-size="11" fill="#6c7a93" text-anchor="middle">command</text>
  <text x="240" y="152" font-size="11" fill="#1d6fd1" text-anchor="middle">rate-limited output</text>
</svg>
```

The main sine wave hidden in the triangle has about half the command's size and lags it by about $51^\circ$ — the $\lambda = 0.4$ row of the table.
:::

::: context phase-margin Pushing a swing at the wrong moment
Push a swing just as it starts moving away from you and it goes higher. Push it a moment late — as it comes back toward you — and your push fights it. A feedback loop is the same: its corrections must arrive on time. Phase margin measures how much lateness, in degrees of a cycle, the loop can tolerate before its corrections start feeding the oscillation instead of damping it. Every delay in the loop — sensor, filter, computer, actuator — spends some of it.
:::

::: context pio-history When the pilot and the limiter fight
In a pilot-induced oscillation, the pilot's corrections arrive late and make the aircraft swing harder. Control-surface rate limiting is a classic trigger: the surfaces fall behind the pilot's commands, adding exactly the lag in this table. It was a factor in the loss of the YF-22 prototype during a low go-around in 1992 and in the crashes of JAS 39 Gripen aircraft in 1989 and 1993. An autopilot can fall into the same trap, which is why flight-control designers now analyze rate limits explicitly.
:::

::: context load-relief Leaning into the wind
A rocket climbing through a crosswind feels a sideways push on its nose. Fighting that push to hold a perfect path needs big gimbal swings and loads the structure. **Load relief** lets the rocket turn slightly into the wind instead, which shrinks the sideways push. You give up a little accuracy in the path — the guidance system makes it up later — and you get back structural margin and gimbal headroom.
:::
