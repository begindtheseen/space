---
id: l13-feedforward-and-gain-scheduling
title: Feedforward, two-degree-of-freedom control, and gain scheduling
minutes: 19
covers:
  - 'Feedforward and 2-DOF control; gain scheduling across flight regimes'
---

Feedback works by being wrong first. An error has to appear before the controller reacts to it, so however good the loop is, a command it could have predicted still produces a transient it then has to remove. The two ideas in this lesson are the ways round that, and both are about using information the feedback loop does not have.

**Feedforward** uses knowledge of the command, or of the disturbance, to produce the actuator signal directly rather than waiting for an error. **Gain scheduling** uses knowledge of the operating point to change the controller as the vehicle changes, rather than designing one controller robust enough for every case. Neither is a substitute for feedback: feedforward cannot correct anything it does not know about, and a gain schedule is a set of feedback designs. Both are the difference between a loop that works and a loop that works well.

## Two degrees of freedom

Everything so far has had one adjustable object, the controller $C$, doing two jobs. It sets the response to the command, through $T = L/(1+L)$, and the response to disturbances and model error, through $S = 1/(1+L)$. Since $S + T = 1$ those two are the same choice, and the previous lessons are full of the consequences: the PI loop that has $67^\circ$ of phase margin and still overshoots 13.6% on a step, because its closed-loop zero is where the loop needed it rather than where the command response wanted it.

A **two-degree-of-freedom** controller separates them by giving the command its own path. The two standard arrangements are equivalent:

$$
\textbf{prefilter:}\quad y = F(s)\,T(s)\,r,
\qquad
\textbf{feedforward:}\quad u = u_{ff} + C(s)\bigl(r - y\bigr).
$$

In the prefilter form, $F$ shapes the command before the loop sees it. In the feedforward form, $u_{ff}$ is computed from the command and injected at the actuator. The essential fact about both is the same:

**Neither changes $S$, $T$, $L$, or any margin.** The loop transfer function is what you get by cutting the loop with the reference held at zero, and both $F$ and $u_{ff}$ vanish when $r = 0$. So the robustness analysis of the previous lessons is untouched, and the command response becomes a free design.

The simplest useful $u_{ff}$ is the model inverse. If the plant were exactly $G$, then $u_{ff} = G^{-1}r$ would produce $y = r$ with no error at all and no work for the feedback. Two things stop that being the whole answer. $G^{-1}$ is improper whenever $G$ is strictly proper, so the command must be filtered first — you choose a **reference model** $M(s)$ describing the response you actually want, and use $u_{ff} = M G^{-1} r$, with $M$ chosen so $MG^{-1}$ is proper. And $G^{-1}$ is unstable whenever $G$ has right-half-plane zeros, so a non-minimum-phase plant cannot be inverted at all and the feedforward has to be approximated.

On a vehicle the model inverse is usually obvious in physical terms rather than algebraic ones. For a rigid body, $G_\theta = 1/(Js^2)$ and $G_\theta^{-1} = Js^2$, so the feedforward torque is $u_{ff} = J\,\ddot\theta_{\text{cmd}}$ — the inertia times the commanded angular acceleration. That is the "computed torque" every slew manoeuvre uses, and the reference model is the command profile generator that supplies $\theta_{\text{cmd}}$, $\dot\theta_{\text{cmd}}$ and $\ddot\theta_{\text{cmd}}$ as smooth, consistent functions of time.

::: example A 10° slew, with and without feedforward
Take the cascade of the previous lesson — inner rate loop at $10\ \mathrm{rad/s}$, outer attitude gain $K_\theta = 2$ — and command a $10^\circ$ slew over $4\ \mathrm{s}$ using a minimum-jerk profile $\theta_{\text{cmd}} = A(10x^3 - 15x^4 + 6x^5)$ with $x = t/4$. Its peak rate is $0.0818\ \mathrm{rad/s} = 4.69^\circ/\mathrm{s}$ and its peak acceleration is $0.0630\ \mathrm{rad/s^2}$, needing $J\ddot\theta = 75.6\ \mathrm{N\,m}$ of torque.

**Feedback alone.** The outer loop is $L_{\text{out}} \approx K_\theta/s$, type 1 in attitude, so it tracks a step exactly and a ramp with a lag. At the peak commanded rate the lag is about $\dot\theta_{\text{cmd}}/K_\theta = 0.0818/2 = 0.0409\ \mathrm{rad} = 2.34^\circ$. Simulating the real loop, the attitude error peaks at $2.09^\circ$ — the vehicle spends the manoeuvre two degrees behind where it was told to be, and closes that gap only after the command stops moving.

**Rate feedforward.** Add $\dot\theta_{\text{cmd}}$ directly to the rate command: $\omega_{\text{cmd}} = \dot\theta_{\text{cmd}} + K_\theta(\theta_{\text{cmd}} - \theta)$. Now the inner loop is told the rate the manoeuvre needs instead of having to infer it from an attitude error. The peak error falls to $0.086^\circ$, a factor of 24, and what remains is the inner loop's own lag in following a changing rate command.

Nothing about the feedback loop changed. Same gains, same $67.4^\circ$ and $82.3^\circ$ phase margins, same disturbance rejection, same everything a margin table would show. The only change is that the command now reaches the actuator by two routes instead of one.
:::

```python
import numpy as np

J, tau, kp, ki, Kth, dt = 1200.0, 0.02, 12000.0, 24000.0, 2.0, 1e-4
t = np.arange(0, 8 + dt, dt)
x = np.clip(t / 4.0, 0, 1)
A = np.radians(10.0)
th_c = A * (10 * x**3 - 15 * x**4 + 6 * x**5)
w_c = np.where(t < 4.0, A * (30 * x**2 - 60 * x**3 + 30 * x**4) / 4.0, 0.0)


def slew(ff):
    th = w = Ta = I = 0.0
    peak = 0.0
    for k in range(len(t)):
        e = th_c[k] - th
        peak = max(peak, abs(e))
        cmd = Kth * e + (w_c[k] if ff else 0.0)
        u = kp * (cmd - w) + I
        I += dt * ki * (cmd - w)
        Ta += dt * (u - Ta) / tau
        th += dt * w
        w += dt * Ta / J
    return np.degrees(peak)


print(round(slew(False), 3), round(slew(True), 3))
# 2.091 0.086
```

Adding the acceleration term as well, $u_{ff} = J\ddot\theta_{\text{cmd}}$ injected at the torque command, removes the inner loop's lag too and leaves only the error caused by the model being wrong. If the inertia is known to 5%, the residual torque the feedback has to supply is 5% of $75.6\ \mathrm{N\,m}$, about $3.8\ \mathrm{N\,m}$, instead of all of it. **Feedforward converts a tracking problem into a modelling problem**, and models of inertia are usually better than loops are fast.

::: warning
Feedforward has no authority over anything it is not told about. A wind gust, a thrust misalignment, a slosh transient and a stage separation all arrive without warning, and against those the feedback loop is the only defence. The temptation, having seen a factor of 24, is to lower the feedback gains because the tracking error is now small; that trades away disturbance rejection and robustness for nothing, because the feedforward was already free. Design the feedback loop for disturbances and model error, then add feedforward for the command.
:::

**Disturbance feedforward** is the same idea applied to a measured disturbance. If you can measure $d$ before it acts — a wind vane or an air-data system measuring the gust, an accelerometer sensing lateral load, a measured propellant-slosh state, a known thrust profile at staging — then $u_{ff} = -G^{-1}G_d\,d$ cancels its effect, where $G_d$ is the transfer function from disturbance to output. It is limited by the same two conditions as command feedforward, plus a third: the measurement must be available early enough. A disturbance you measure at the output has already happened.

## Gain scheduling

A launch vehicle at $130\ \mathrm{s}$ has almost nothing in common with the same vehicle at $60\ \mathrm{s}$. Its mass and inertia are a fraction of what they were, its thrust has risen toward the vacuum value, its dynamic pressure has fallen by a factor of forty, and the aerodynamic instability that dominated the design at max-Q has effectively vanished. One fixed controller has to be robust to all of it, or the controller has to change.

**Gain scheduling** changes it: design a controller at a set of operating points, tabulate the gains against a measurable **scheduling variable**, and interpolate in flight. The scheduling variable must be something the vehicle knows — time from lift-off, Mach number, dynamic pressure, estimated mass, altitude — and it must capture the variation you care about.

::: example Scheduling the booster's TVC gains
Take the atmospheric flight module's vehicle, whose pitch dynamics are $\ddot\theta = \mu_\alpha\theta + \mu_\delta\delta$ with $\mu_\alpha = \bar{q}SC_{N\alpha}(x_{cg}-x_{cp})/I$ and $\mu_\delta = T\ell_T/I$. The PD gains that hold $\omega_n = 1.5\ \mathrm{rad/s}$ and $\zeta = 0.7$ are $K_p = (\omega_n^2 + \mu_\alpha)/\mu_\delta$ and $K_d = 2\zeta\omega_n/\mu_\delta$. Using $S = 10.52\ \mathrm{m^2}$, $C_{N\alpha} = 4.0$, $x_{cg}-x_{cp} = 26\ \mathrm{m}$, $\ell_T = 26\ \mathrm{m}$:

| Time | $\bar{q}$ (kPa) | $I$ (kg·m²) | $T$ (MN) | $\mu_\alpha$ | $\mu_\delta$ | $t_{\text{double}}$ | $K_p$ | $K_d$ | low-gain margin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 20 s | 5.2 | $1.5\times10^8$ | 7.0 | 0.0379 | 1.213 | 3.56 s | 1.886 | 1.731 | 35.6 dB |
| 60 s (max-Q) | 31.3 | $1.5\times10^8$ | 7.6 | 0.2283 | 1.317 | 1.45 s | 1.881 | 1.594 | 20.7 dB |
| 100 s | 5.4 | $1.0\times10^8$ | 8.0 | 0.0591 | 2.080 | 2.85 s | 1.110 | 1.010 | 31.8 dB |
| 130 s | 0.8 | $0.7\times10^8$ | 8.0 | 0.0125 | 2.971 | 6.20 s | 0.761 | 0.707 | 45.2 dB |

Two things are worth reading off. The gains fall by a factor of about 2.5 over the burn, and almost all of that happens *after* max-Q: between 20 s and 60 s the rising aerodynamic instability and the rising control effectiveness nearly cancel, so the gains barely move. The schedule is driven mainly by the vehicle getting lighter, not by the aerodynamics. And the low-gain margin is smallest exactly at max-Q, which is where every other margin is worst too.

Now fly the wrong gains. The max-Q gains applied at $130\ \mathrm{s}$ give $\omega_n = 2.36\ \mathrm{rad/s}$ and $\zeta = 1.00$: stable, overdamped, and 57% faster than designed, which pushes crossover toward the bending modes. The reverse is the dangerous one: the $130\ \mathrm{s}$ gains applied at max-Q give $\omega_n = 0.88\ \mathrm{rad/s}$ and $\zeta = 0.53$ against an unstable pole at $0.478\ \mathrm{rad/s}$ — a bandwidth ratio of only 1.84, well under the three-to-five the atmospheric flight module requires, so the loop is stable on paper and far too slow to hold the angle of attack down in a gust. A gain schedule running late is worse than one running early.
:::

::: key
A gain schedule is a table of controller parameters against a measured operating variable, with interpolation in between. Design at each point, verify *between* the points, and check that the scheduling variable changes slowly compared with the closed-loop bandwidth. Frozen-time stability at every design point does not by itself prove the time-varying loop is stable.
:::

### What goes wrong

**The scheduling variable is estimated, not measured.** Dynamic pressure and Mach number come from a navigation solution and an atmosphere model, not from a sensor. If they are wrong, the gains are wrong, and the error is correlated with exactly the flight condition that produced it.

**The scheduling variable depends on the state the loop controls.** If gains are scheduled on a quantity the controller itself moves — angle of attack, load factor, measured rate — the loop acquires a hidden feedback path through the schedule that no frozen-time analysis sees. Schedule on something exogenous where you can: time, altitude, mass.

**The schedule moves too fast.** Frozen-time analysis assumes the plant is constant while the loop settles. During a transonic passage a vehicle's aerodynamic coefficients can change substantially in a couple of seconds, which is a few closed-loop time constants, and the time-varying system can be unstable while every frozen point is stable. The usual rule is that the scheduling variable's fractional rate of change should be small compared with the closed-loop bandwidth; when it is not, the design must be checked against the real trajectory, in a time-varying simulation, and not only at points.

**Interpolating the wrong thing.** Interpolating gains of a controller written in position form can produce a jump in the controller's output when the gains change, because the integrator state is multiplied by a gain that has only now moved. The standard fixes are to implement the controller in velocity (incremental) form, where the gains multiply changes rather than accumulated states, or to use the bumpless-transfer machinery from the windup lesson so the output is continuous across every gain update.

**Verifying only at the design points.** Interpolated gains are a controller you never designed, flying a plant that sits between the ones you analysed. Both the interpolation and the plant have to be swept finely enough to catch a margin that dips in between — a real occurrence around the transonic region, where the plant moves fastest.

::: note
Gain scheduling done with guarantees is **linear parameter-varying** control: the plant is written as a function of a measured parameter vector, and the synthesis produces a controller with a stability and performance certificate valid for every trajectory of that parameter within stated rate bounds. That is what replaces "design at points and hope in between", and it is where this thread continues in the robust-control material.
:::

## Check yourself

::: check
Why does adding a prefilter $F(s)$ leave the gain and phase margins unchanged, and what does it change?
:::

::: answer
Margins are properties of the loop transfer function $L = GC$, obtained by breaking the loop and going once around it with the reference set to zero. A prefilter sits outside the loop, between the command and the summing junction, so it is not in that path at all and contributes nothing to $L$. $S$, $T$, all the crossovers and all the margins are unaffected. What changes is the transfer function from command to output, which becomes $FT$ instead of $T$: the overshoot, the rise time and the closed-loop zeros seen by the command all move. Setpoint weighting is the special case where $F$ is realised by splitting the error signal inside the controller rather than by a separate block.
:::

::: check
A plant is $G(s) = 5(1 - 0.2s)/\bigl((s+1)(s+4)\bigr)$. Can you use a model-inverse feedforward on it? What would you do instead?
:::

::: answer
No. The numerator $1 - 0.2s$ has a zero at $s = +5$, in the right half plane, so $G^{-1}$ has a pole at $+5$ and the feedforward would be an unstable filter — it would produce an exponentially growing command. This is the same non-minimum-phase obstruction that limits achievable bandwidth to roughly $z/2 = 2.5\ \mathrm{rad/s}$. The practical alternatives are to invert only the minimum-phase part of the plant and accept the residual all-pass factor, which leaves the characteristic initial undershoot; or, if the whole command trajectory is known in advance, to use a non-causal (preview) feedforward that starts moving before the command does, which is legitimate for a planned manoeuvre and impossible for a real-time one.
:::

::: check
The slew example reduced the peak attitude error from 2.09° to 0.086° by feeding the commanded rate forward. Explain, using the type number of the outer loop, why this particular error existed at all.
:::

::: answer
The outer attitude loop is $L_{\text{out}} \approx K_\theta/s$: one integrator, a type 1 loop. A type 1 loop tracks a step with zero steady-state error but a ramp with a constant lag of $\dot{r}/K_v$, where $K_v = \lim_{s\to0}sL = K_\theta = 2\ \mathrm{s^{-1}}$. During the slew the command is approximately a ramp at the peak rate $0.0818\ \mathrm{rad/s}$, so the lag is $0.0409\ \mathrm{rad} = 2.34^\circ$, which is what the simulation shows to within the transient. Feeding $\dot\theta_{\text{cmd}}$ forward supplies exactly the rate command that lag was being used to generate, so the error no longer has to exist for the loop to produce the motion. The alternative — raising $K_\theta$ until the lag is acceptable — would need a factor of 24 more outer gain, which the bandwidth separation rule forbids.
:::

::: check
A vehicle's gains are scheduled on estimated dynamic pressure. During a flight the navigation solution's altitude is biased high by 500 m through the transonic region, so $\bar{q}$ is underestimated by about 8%. What happens to the loop, and which margin do you check first?
:::

::: answer
The scheduler computes $\mu_\alpha$ 8% low, so $K_p = (\omega_n^2 + \mu_\alpha)/\mu_\delta$ is slightly low — but only slightly, because near max-Q $\mu_\alpha = 0.228$ is small compared with $\omega_n^2 = 2.25$, so an 8% error in $\mu_\alpha$ changes $K_p$ by about 0.8%. The loop barely notices. The margin to check first is the **low-gain** margin, because the error is in the direction that reduces gain and the vehicle is open-loop unstable: at max-Q the low-gain margin is 20.7 dB, so a 0.8% gain error consumes essentially none of it. The general lesson is the reassuring one: the aerodynamic term enters $K_p$ additively alongside $\omega_n^2$, so a loop designed with bandwidth well above the unstable pole is insensitive to errors in the parameter that is hardest to estimate.
:::

::: check
Why can a gain schedule that is stable at every design point still produce an unstable flight, and what analysis catches it?
:::

::: answer
Frozen-time analysis asks whether the closed loop would be stable if the plant and gains stopped changing. A real vehicle's parameters move while the loop is responding, and a linear time-varying system can be unstable even when every frozen instant is stable — the classic mechanism is energy being pumped in by the parameter variation itself, which no eigenvalue of any frozen model shows. The risk is proportional to how fast the scheduling variable moves relative to the closed-loop bandwidth, so it is worst through the transonic region and at staging. What catches it is time-varying simulation along the real trajectory, including dispersed trajectories, and, with guarantees rather than evidence, linear parameter-varying synthesis with explicit bounds on the parameter rate.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Two degrees of freedom | prefilter $y = FTr$, or feedforward $u = u_{ff} + C(r-y)$; equivalent |
| Key property | neither changes $L$, $S$, $T$ or any margin — the command path is outside the loop |
| Model-inverse feedforward | $u_{ff} = MG^{-1}r$ with a reference model $M$ making $MG^{-1}$ proper |
| Obstructions | $G^{-1}$ improper (fix with $M$); $G^{-1}$ unstable if $G$ has RHP zeros (no fix) |
| Rigid-body case | $u_{ff} = J\ddot\theta_{\text{cmd}}$, the computed torque |
| Slew example | $10^\circ$ in 4 s: peak error $2.09^\circ$ feedback-only, $0.086^\circ$ with rate feedforward |
| Why | type 1 outer loop lags a ramp by $\dot r/K_\theta = 0.0409\ \mathrm{rad}$ |
| Disturbance feedforward | $u_{ff} = -G^{-1}G_d\,d$; needs the disturbance measured early enough |
| Gain scheduling | tabulate gains against a measured operating variable and interpolate |
| Booster schedule | $K_p$ from 1.886 to 0.761, $K_d$ from 1.731 to 0.707 over the burn |
| Wrong gains | 130 s gains at max-Q give $\omega_n = 0.88$ against a $0.478\ \mathrm{rad/s}$ unstable pole |
| Pitfalls | estimated scheduling variable, scheduling on a controlled state, fast variation, interpolating position-form gains, not verifying between points |

That closes the module. You can now design a PID or lead-lag controller to a margin specification, read all four margins off a Bode or Nyquist plot, notch a bending mode and say what it cost, build and justify a cascade, and schedule the result across a flight — and you know which of those numbers are promises and which are only single-axis tests on a model. The next module takes the same designs into flight software, where the sample rate, the zero-order hold and the computational delay take a further bite out of every margin here.
