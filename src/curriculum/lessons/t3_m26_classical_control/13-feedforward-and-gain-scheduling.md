---
id: l13-feedforward-and-gain-scheduling
title: Feedforward, two-degree-of-freedom control, and gain scheduling
minutes: 21
covers:
  - 'Feedforward and 2-DOF control; gain scheduling across flight regimes'
---

Think about catching a ball. If you only reacted to where the ball *is*, you would always grab at the spot it had already left. Instead you watch it fly, guess where it is going, and move your hand there early. Your eyes still correct the last few centimeters — but most of the motion was planned before any error showed up.

Feedback works by being wrong first. An error has to appear before the controller reacts to it. So however good the loop is, a command it could have predicted still produces a lag it then has to clean up. This lesson is about the two standard ways around that, and both use information the feedback loop does not have.

**Feedforward** uses knowledge of the command, or of a disturbance, to produce the actuator signal directly instead of waiting for an error. **Gain scheduling** uses knowledge of the flight condition to change the controller as the vehicle changes, instead of designing one controller tough enough for every case. Neither replaces feedback. Feedforward cannot correct anything it was not told about, and a gain schedule is a set of feedback designs. Both are the difference between a loop that works and a loop that works well.

## Two degrees of freedom

Up to now there has been one adjustable object, the controller $C$, doing two jobs. It sets the response to commands, through $T = L/(1+L)$. It also sets the response to disturbances and model error, through $S = 1/(1+L)$. Since $S + T = 1$, those are one choice, not two. The earlier lessons are full of the consequences — like the PI rate loop with $67^\circ$ of phase margin that still overshoots 13.6% on a step, because its closed-loop zero sits where the loop needed it rather than where the command response wanted it.

A **[[two-degree-of-freedom|two-dof-picture]]** controller ("2-DOF") separates the jobs by giving the command its own path. There are two standard arrangements, and either can produce the same command responses:

$$
\textbf{prefilter:}\quad y = F(s)\,T(s)\,r,
\qquad
\textbf{feedforward:}\quad u = u_{ff} + C(s)\bigl(r - y\bigr).
$$

In the **prefilter** form, a filter $F$ shapes the command $r$ before the loop sees it. In the **feedforward** form, a signal $u_{ff}$ ("u f f") is computed from the command and added straight in at the actuator. The essential fact is the same for both:

**Neither changes $S$, $T$, $L$, or any margin.** The loop transfer function is what you get by cutting the loop with the command held at zero, and both $F$ and $u_{ff}$ vanish when $r = 0$. So all the robustness work of the earlier lessons stays exactly as it was, and the command response becomes a free design.

### The model inverse

The simplest useful $u_{ff}$ runs the plant backwards. If the plant were exactly $G$, then $u_{ff} = G^{-1}r$ would give $y = G\,G^{-1}r = r$: perfect tracking with no work left for the feedback. Two things stop that being the whole answer.

- **$G^{-1}$ is [[improper|improper-inverse]] whenever $G$ is strictly proper** — more powers of $s$ on top than on the bottom, which means taking derivatives of the command that a real filter cannot provide. So you first choose a **reference model** $M(s)$, the smooth response you actually want, and use $u_{ff} = M G^{-1} r$, with $M$ chosen so that $MG^{-1}$ is proper.
- **$G^{-1}$ is unstable whenever $G$ has [[right-half-plane zeros|rhp-zero]]**, because those zeros become poles of the inverse. A non-minimum-phase plant cannot be inverted at all, and the feedforward has to be an approximation.

On a vehicle, the model inverse is usually obvious from physics. For a rigid body, $G_\theta = 1/(Js^2)$, so $G_\theta^{-1} = Js^2$ and the feedforward torque is

$$
u_{ff} = J\,\ddot\theta_{\text{cmd}},
$$

the inertia times the commanded angular acceleration — Newton's second law for turning. That is the **[[computed torque|computed-torque]]** used in slew maneuvers. The reference model is the command profile generator, which supplies $\theta_{\text{cmd}}$, $\dot\theta_{\text{cmd}}$ and $\ddot\theta_{\text{cmd}}$ ("theta command, its rate, its acceleration") as smooth, consistent functions of time.

::: example A 10° slew, with and without feedforward
Take the cascade from the previous lesson: inner rate loop at $10\ \mathrm{rad/s}$, outer attitude gain $K_\theta = 2$. Command a **slew** — a deliberate turn — of $A = 10^\circ$ over $4\ \mathrm{s}$, using a **[[minimum-jerk profile|min-jerk]]**:

$$
\theta_{\text{cmd}} = A\,(10x^3 - 15x^4 + 6x^5), \qquad x = t/4 .
$$

Its peak rate is $0.0818\ \mathrm{rad/s} = 4.69^\circ/\mathrm{s}$ and its peak acceleration is $0.0630\ \mathrm{rad/s^2}$. With $J = 1200\ \mathrm{kg\,m^2}$ that acceleration needs $J\ddot\theta = 1200 \times 0.0630 = 75.6\ \mathrm{N\,m}$ of torque.

**Feedback alone.** The outer loop is $L_{\text{out}} \approx K_\theta/s$. It has one integrator, so it is **type 1** in attitude: it tracks a step exactly but trails a ramp by a fixed lag. At the peak commanded rate that lag is about $\dot\theta_{\text{cmd}}/K_\theta = 0.0818/2 = 0.0409\ \mathrm{rad}$, which is $2.34^\circ$. Simulating the real loop, the attitude error peaks at $2.09^\circ$. The vehicle spends the maneuver [[two degrees behind|slew-error-picture]] where it was told to be, and closes the gap only after the command stops moving.

**Rate feedforward.** Add $\dot\theta_{\text{cmd}}$ directly to the rate command:

$$
\omega_{\text{cmd}} = \dot\theta_{\text{cmd}} + K_\theta(\theta_{\text{cmd}} - \theta).
$$

Now the inner loop is told the rate the maneuver needs, instead of having to infer it from an attitude error. The peak error falls to $0.086^\circ$ — a factor of 24. What is left is the inner loop's own lag in following a changing rate command.

**Sanity check.** The feedback-only peak ($2.09^\circ$) is a bit below the ramp estimate ($2.34^\circ$). That makes sense: the command is only near its peak rate briefly, so the lag never fully builds.

Nothing about the feedback loop changed. Same gains, same $67.4^\circ$ and $82.3^\circ$ phase margins, same disturbance rejection, same everything a margin table would show. The only change is that the command now reaches the actuator by two routes instead of one.
:::

Here is the simulation, with the acceleration feedforward $J\ddot\theta_{\text{cmd}}$ included as an option at the torque command:

```python
import numpy as np

J, tau, kp, ki, Kth, dt = 1200.0, 0.02, 12000.0, 24000.0, 2.0, 1e-4
t = np.arange(0, 8 + dt, dt)
x = np.clip(t / 4.0, 0, 1)
A = np.radians(10.0)
th_c = A * (10 * x**3 - 15 * x**4 + 6 * x**5)
w_c = np.where(t < 4.0, A * (30 * x**2 - 60 * x**3 + 30 * x**4) / 4.0, 0.0)
a_c = np.where(t < 4.0, A * (60 * x - 180 * x**2 + 120 * x**3) / 16.0, 0.0)


def slew(ff, acc=False, Jmodel=J):
    th = w = Ta = I = 0.0
    peak = 0.0
    for k in range(len(t)):
        e = th_c[k] - th
        peak = max(peak, abs(e))
        cmd = Kth * e + (w_c[k] if ff else 0.0)
        u = kp * (cmd - w) + I + (Jmodel * a_c[k] if acc else 0.0)
        I += dt * ki * (cmd - w)
        Ta += dt * (u - Ta) / tau
        th += dt * w
        w += dt * Ta / J
    return np.degrees(peak)


print(round(slew(False), 3), round(slew(True), 3))
# 2.091 0.086
print(round(slew(True, True), 4), round(slew(True, True, 0.95 * J), 4))
# 0.0036 0.0048
```

Adding the acceleration term as well removes most of the inner loop's lag too, and leaves mainly the error from the model being wrong. In this simulation the peak error drops to $0.0036^\circ$ with a perfect inertia model, and to $0.0048^\circ$ with the model's inertia 5% low. Put another way: if the inertia is known to 5%, the torque the feedback still has to supply is 5% of $75.6\ \mathrm{N\,m}$, about $3.8\ \mathrm{N\,m}$, instead of all of it. **Feedforward turns a tracking problem into a modeling problem**, and models of inertia are usually better than loops are fast.

::: warning Feedforward does not replace feedback
Feedforward has no power over anything it is not told about. A wind gust, a thrust misalignment, a slosh transient and a stage separation all arrive without warning, and against those the feedback loop is the only defense. Having seen a factor of 24, it is tempting to lower the feedback gains because the tracking error is now small. That trades away disturbance rejection and robustness for nothing, because the feedforward was already free. Design the feedback loop for disturbances and model error, then add feedforward for the command.
:::

### Disturbance feedforward

**Disturbance feedforward** is the same idea aimed at a disturbance you can measure. Suppose you can measure $d$ before it acts — an air-data system sensing a gust, an accelerometer sensing sideways load, a measured propellant-slosh state, a known thrust profile at staging. Then

$$
u_{ff} = -G^{-1}G_d\,d
$$

cancels its effect, where $G_d$ is the transfer function from disturbance to output. It faces the same two limits as command feedforward, plus a third: the measurement must arrive [[early enough|wind-biasing]]. A disturbance you measure at the output has already happened.

## Gain scheduling

A launch vehicle at $130\ \mathrm{s}$ has almost nothing in common with the same vehicle at $60\ \mathrm{s}$. It weighs far less and its inertia is a fraction of what it was. Its thrust has risen toward the vacuum value. Its dynamic pressure has fallen by a factor of about forty, and the aerodynamic instability that dominated the design at **[[max-Q|max-q]]** has all but vanished. Either one fixed controller copes with all of that, or the controller has to change.

Think of how you ride a bike: you steer gently at speed and make big corrections when going slowly. You change your "gains" with speed without thinking about it. **Gain scheduling** does that on purpose. Design a controller at a set of operating points. Tabulate the gains against a measurable **scheduling variable**. Interpolate between table entries in flight. The scheduling variable must be something the vehicle knows — time since lift-off, Mach number, dynamic pressure, estimated mass, altitude — and it must capture the change you care about.

::: example Scheduling the booster's TVC gains
Take the booster from the atmospheric flight module. Its pitch dynamics are

$$
\ddot\theta = \mu_\alpha\theta + \mu_\delta\delta, \qquad
\mu_\alpha = \frac{\bar{q}SC_{N\alpha}(x_{cg}-x_{cp})}{I}, \qquad
\mu_\delta = \frac{T\ell_T}{I}.
$$

Here $\mu_\alpha$ ("mu alpha") is the aerodynamic instability, $\mu_\delta$ ("mu delta") the control effectiveness of the gimballed engine, $\bar q$ ("q bar") the dynamic pressure, $I$ the pitch inertia, $T$ the thrust and $\ell_T$ the lever arm from engine to center of mass. The PD gains that hold $\omega_n = 1.5\ \mathrm{rad/s}$ and $\zeta = 0.7$ are

$$
K_p = \frac{\omega_n^2 + \mu_\alpha}{\mu_\delta}, \qquad K_d = \frac{2\zeta\omega_n}{\mu_\delta}.
$$

Using $S = 10.52\ \mathrm{m^2}$, $C_{N\alpha} = 4.0$, $x_{cg}-x_{cp} = 26\ \mathrm{m}$ and $\ell_T = 26\ \mathrm{m}$, with $t_{\text{double}}$ the open-loop [[time to double|doubling-time]]:

| Time | $\bar{q}$ (kPa) | $I$ (kg·m²) | $T$ (MN) | $\mu_\alpha$ | $\mu_\delta$ | $t_{\text{double}}$ | $K_p$ | $K_d$ | low-gain margin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 20 s | 5.2 | $1.5\times10^8$ | 7.0 | 0.0379 | 1.213 | 3.56 s | 1.886 | 1.731 | 35.6 dB |
| 60 s (max-Q) | 31.3 | $1.5\times10^8$ | 7.6 | 0.2283 | 1.317 | 1.45 s | 1.881 | 1.594 | 20.7 dB |
| 100 s | 5.4 | $1.0\times10^8$ | 8.0 | 0.0591 | 2.080 | 2.85 s | 1.110 | 1.010 | 31.8 dB |
| 130 s | 0.8 | $0.7\times10^8$ | 8.0 | 0.0125 | 2.971 | 6.20 s | 0.761 | 0.707 | 45.2 dB |

**Reading the table.** The gains fall by a factor of about 2.5 over the burn ($1.886/0.761 \approx 2.48$). Almost all of that fall comes *after* max-Q. Between 20 s and 60 s, the rising aerodynamic instability and the rising control effectiveness nearly cancel, so $K_p$ barely moves. The schedule is driven mainly by the vehicle getting lighter, not by the air. And the low-gain margin is smallest exactly at max-Q, where every other margin is worst too.

**Fly the wrong gains, one way.** The max-Q gains applied at $130\ \mathrm{s}$ give $\omega_n = 2.36\ \mathrm{rad/s}$ and $\zeta = 1.00$. That is stable and overdamped, but 57% faster than designed ($2.36/1.5 \approx 1.57$), which pushes crossover toward the bending modes.

**Fly the wrong gains, the other way.** This is the dangerous one. The $130\ \mathrm{s}$ gains applied at max-Q give $\omega_n = 0.88\ \mathrm{rad/s}$ and $\zeta = 0.53$, against an unstable pole at $0.478\ \mathrm{rad/s}$. The ratio is only $0.88/0.478 \approx 1.84$, well under the three to five the atmospheric flight module requires. The loop is stable on paper and far too slow to hold the angle of attack down in a gust. A gain schedule running late is worse than one running early.
:::

::: key
A gain schedule is a table of controller parameters against a measured operating variable, with interpolation in between. Design at each point, verify *between* the points, and check that the scheduling variable changes slowly compared with the closed-loop bandwidth. Frozen-time stability at every design point does not by itself prove the time-varying loop is stable.
:::

### What goes wrong

**The scheduling variable is estimated, not measured.** Dynamic pressure and Mach number come from a navigation solution and an atmosphere model, not from a sensor. If they are wrong, the gains are wrong — and the error is tied to exactly the flight condition that caused it.

**The scheduling variable depends on the state the loop controls.** Suppose gains are scheduled on something the controller itself moves — angle of attack, load factor, measured rate. Then the loop gains a hidden feedback path through the schedule that no frozen-time analysis sees. Schedule on something outside the loop where you can: time, altitude, mass.

**The schedule moves too fast.** Frozen-time analysis assumes the plant holds still while the loop settles. During a transonic passage — flying through the speed of sound — a vehicle's aerodynamic coefficients can change a lot in a couple of seconds, which is only a few closed-loop time constants. The time-varying system can then be unstable while every frozen point is stable. The usual rule is that the scheduling variable's fractional rate of change should be small compared with the closed-loop bandwidth. When it is not, check the design against the real trajectory in a time-varying simulation, not only at points.

**Interpolating the wrong thing.** Interpolating the gains of a controller written in **position form** can make the controller's output jump when the gains change, because a gain that has only now moved multiplies an integrator state built up earlier. The standard fixes are to write the controller in **[[velocity (incremental) form|velocity-form]]**, where gains multiply *changes* rather than stored totals, or to use the bumpless-transfer machinery from the windup lesson so the output stays continuous across every gain update.

**Verifying only at the design points.** Interpolated gains are a controller you never designed, flying a plant that sits between the ones you analyzed. Both must be swept finely enough to catch a margin that dips in between — which really happens around the transonic region, where the plant moves fastest.

::: note Scheduling with a guarantee
Gain scheduling with guarantees is called **[[linear parameter-varying|lpv]]** control. The plant is written as a function of a measured parameter vector, and the design method produces a controller with a stability and performance certificate valid for every path of that parameter within stated rate limits. That replaces "design at points and hope in between", and it is where this thread continues in the robust-control material.
:::

## Check yourself

::: check
Why does adding a prefilter $F(s)$ leave the gain and phase margins unchanged, and what does it change?
:::

::: answer
Margins are properties of the loop transfer function $L = GC$, found by breaking the loop and going once around it with the command set to zero. A prefilter sits outside the loop, between the command and the summing junction, so it is not in that path at all and adds nothing to $L$. So $S$, $T$, every crossover and every margin are unaffected.

What changes is the transfer function from command to output, which becomes $FT$ instead of $T$. The overshoot, the rise time and the closed-loop zeros seen by the command all move. Setpoint weighting is the special case where $F$ is built by splitting the error signal inside the controller rather than by a separate block.
:::

::: check
A plant is $G(s) = 5(1 - 0.2s)/\bigl((s+1)(s+4)\bigr)$. Can you use a model-inverse feedforward on it? What would you do instead?
:::

::: answer
No. The numerator $1 - 0.2s$ is zero at $s = 1/0.2 = +5$, in the right half plane. So $G^{-1}$ has a pole at $+5$, and the feedforward would be an unstable filter — it would produce an exponentially growing command. This is the same non-minimum-phase obstruction that limits achievable bandwidth to roughly $z/2 = 5/2 = 2.5\ \mathrm{rad/s}$.

Practical alternatives:

- Invert only the minimum-phase part of the plant and accept the leftover all-pass factor. That leaves the characteristic initial undershoot.
- If the whole command trajectory is known in advance, use a non-causal (preview) feedforward that starts moving before the command does. That is legitimate for a planned maneuver and impossible for a real-time one.
:::

::: check
The slew example cut the peak attitude error from 2.09° to 0.086° by feeding the commanded rate forward. Explain, using the type number of the outer loop, why this particular error existed at all.
:::

::: answer
The outer attitude loop is $L_{\text{out}} \approx K_\theta/s$: one integrator, a type 1 loop. A type 1 loop tracks a step with zero steady error, but a ramp with a constant lag of $\dot{r}/K_v$, where $K_v = \lim_{s\to0}sL = K_\theta = 2\ \mathrm{s^{-1}}$.

During the slew the command is roughly a ramp at the peak rate $0.0818\ \mathrm{rad/s}$, so the lag is $0.0818/2 = 0.0409\ \mathrm{rad} = 2.34^\circ$. That matches the simulation to within the transient.

Feeding $\dot\theta_{\text{cmd}}$ forward supplies exactly the rate command that the lag was being used to generate. So the error no longer has to exist for the loop to produce the motion. The alternative — raising $K_\theta$ until the lag is acceptable — would need a factor of 24 more outer gain, which the bandwidth separation rule forbids.
:::

::: check
A vehicle's gains are scheduled on estimated dynamic pressure. During a flight the navigation solution's altitude is biased high by 500 m through the transonic region, so $\bar{q}$ is underestimated by about 8%. What happens to the loop, and which margin do you check first?
:::

::: answer
The scheduler computes $\mu_\alpha$ 8% low, so $K_p = (\omega_n^2 + \mu_\alpha)/\mu_\delta$ comes out slightly low — but only slightly. Near max-Q, $\mu_\alpha = 0.228$ is small next to $\omega_n^2 = 2.25$. An 8% error in $\mu_\alpha$ is $0.08 \times 0.228 \approx 0.018$, and $0.018/(2.25 + 0.228) \approx 0.0073$ — about 0.7% of $K_p$. The loop barely notices.

Check the **low-gain** margin first. The error reduces gain, and the vehicle is unstable on its own. At max-Q the low-gain margin is 20.7 dB, so a 0.7% gain error uses up essentially none of it.

The general lesson is reassuring. The aerodynamic term enters $K_p$ by adding to $\omega_n^2$, so a loop designed with bandwidth well above the unstable pole is insensitive to errors in the parameter that is hardest to estimate.
:::

::: check
Why can a gain schedule that is stable at every design point still produce an unstable flight, and what analysis catches it?
:::

::: answer
Frozen-time analysis asks whether the closed loop would be stable if the plant and the gains stopped changing. A real vehicle's parameters move while the loop is responding. A linear time-varying system can be unstable even when every frozen instant is stable — the classic mechanism is energy pumped in by the parameter variation itself, the way a child pumps a swing, which no eigenvalue of any frozen model shows.

The risk grows with how fast the scheduling variable moves relative to the closed-loop bandwidth, so it is worst through the transonic region and at staging. What catches it is time-varying simulation along the real trajectory, including dispersed trajectories. For a guarantee rather than evidence, use linear parameter-varying design with explicit bounds on how fast the parameter can change.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Two degrees of freedom | prefilter $y = FTr$, or feedforward $u = u_{ff} + C(r-y)$ |
| Key property | neither changes $L$, $S$, $T$ or any margin — the command path is outside the loop |
| Model-inverse feedforward | $u_{ff} = MG^{-1}r$ with a reference model $M$ making $MG^{-1}$ proper |
| Obstructions | $G^{-1}$ improper (fix with $M$); $G^{-1}$ unstable if $G$ has RHP zeros (no exact fix) |
| Rigid-body case | $u_{ff} = J\ddot\theta_{\text{cmd}}$, the computed torque |
| Slew example | $10^\circ$ in 4 s: peak error $2.09^\circ$ feedback-only, $0.086^\circ$ with rate feedforward, $0.0036^\circ$ adding acceleration feedforward |
| Why | type 1 outer loop lags a ramp by $\dot r/K_\theta = 0.0409\ \mathrm{rad}$ |
| Disturbance feedforward | $u_{ff} = -G^{-1}G_d\,d$; needs the disturbance measured early enough |
| Gain scheduling | tabulate gains against a measured operating variable and interpolate |
| Booster schedule | $K_p$ from 1.886 to 0.761, $K_d$ from 1.731 to 0.707 over the burn |
| Wrong gains | 130 s gains at max-Q give $\omega_n = 0.88$ against a $0.478\ \mathrm{rad/s}$ unstable pole |
| Pitfalls | estimated scheduling variable, scheduling on a controlled state, fast variation, interpolating position-form gains, not verifying between points |

That closes the module. You can now design a PID or lead-lag controller to a margin specification, read all four margins off a Bode or Nyquist plot, notch a bending mode and say what it cost, build and justify a cascade, and schedule the result across a flight. You also know which of those numbers are promises and which are only single-axis tests on a model. The next module takes the same designs into flight software, where the sample rate, the zero-order hold and the computing delay take a further bite out of every margin here.

::: context two-dof-picture Two paths for the command
The feedback loop (dark) is untouched. The command gets two extra routes: through a prefilter $F$ before the loop, or through a feedforward block straight to the actuator. Set the command to zero and both extra routes carry nothing — which is why the margins do not move.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="6" y="92" font-size="12" fill="#1f2a44">r</text>
  <line x1="18" y1="88" x2="40" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="74" width="30" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">F</text>
  <line x1="70" y1="88" x2="104" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="110" cy="88" r="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="116" y1="88" x2="140" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="140" y="74" width="34" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="157" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">C</text>
  <line x1="174" y1="88" x2="200" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="206" cy="88" r="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="212" y1="88" x2="240" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="80" font-size="11" fill="#1f2a44">u</text>
  <rect x="240" y="74" width="34" height="28" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="257" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">G</text>
  <line x1="274" y1="88" x2="350" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="338" y="80" font-size="12" fill="#1f2a44">y</text>
  <polyline points="310,88 310,140 110,140 110,94" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="112" font-size="11" fill="#1f2a44">−</text>
  <text x="210" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">feedback loop: sets S, T, margins</text>
  <polyline points="28,88 28,30 186,30" fill="none" stroke="#b4232c" stroke-width="1.8"/>
  <rect x="186" y="16" width="40" height="28" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="206" y="34" font-size="11" text-anchor="middle" fill="#b4232c">u_ff</text>
  <line x1="206" y1="44" x2="206" y2="82" stroke="#b4232c" stroke-width="1.8"/>
  <text x="236" y="34" font-size="11" fill="#b4232c">feedforward</text>
  <text x="55" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">prefilter</text>
</svg>
```

In practice you use one route or the other, or both; the picture shows both so you can see neither is inside the loop.
:::

::: context improper-inverse Why you cannot build Js² directly
$G_\theta^{-1} = Js^2$ means "take the second derivative of the input". Given a command that jumps, its derivative is a spike and its second derivative is worse — an infinitely tall, infinitely short kick no actuator can deliver. And any noise on the input is amplified more the faster it wiggles.

The fix is to never feed a raw step in. The reference model $M$ turns the command into a smooth curve whose rate and acceleration are known exactly, so $J\ddot\theta_{\text{cmd}}$ is a finite, gentle torque.
:::

::: context rhp-zero The airplane that dips before it climbs
Pull back on an airplane's stick and the elevator at the tail deflects to push the tail *down*. That tail force is a small downward push on the whole airplane, so for a moment it sinks a little before the nose comes up and the wings climb. That brief wrong-way start is the signature of a right-half-plane zero.

To "invert" such a plant you would need a controller that starts the climb before the dip — which, run forward in time, means a command that grows without bound. So feedforward for these plants is always approximate.
:::

::: context computed-torque Where "computed torque" comes from
The name comes from robotics. A robot arm's controller uses a model of the arm to compute the joint torques needed for a planned motion, and a feedback loop cleans up the small leftover error. Spacecraft slews use the same split: the profile generator plans the motion, $J\ddot\theta_{\text{cmd}}$ supplies the torque that motion needs, and feedback handles what the model got wrong.
:::

::: context min-jerk The minimum-jerk slew
**Jerk** is the rate of change of acceleration — the thing that makes a lurching bus ride uncomfortable. The profile $10x^3 - 15x^4 + 6x^5$ is the smoothest way to go from rest to rest: it starts and ends with zero rate *and* zero acceleration.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="195" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="44" y="34" font-size="11" text-anchor="end" fill="#1f2a44">+1</text>
  <text x="44" y="114" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="44" y="194" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
  <text x="330" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">4 s</text>
  <path d="M50.0,110.0 L57.0,110.0 L64.0,109.9 L71.0,109.7 L78.0,109.3 L85.0,108.7 L92.0,107.9 L99.0,106.8 L106.0,105.4 L113.0,103.7 L120.0,101.7 L127.0,99.5 L134.0,97.0 L141.0,94.2 L148.0,91.2 L155.0,88.0 L162.0,84.6 L169.0,81.1 L176.0,77.5 L183.0,73.7 L190.0,70.0 L197.0,66.3 L204.0,62.5 L211.0,58.9 L218.0,55.4 L225.0,52.0 L232.0,48.8 L239.0,45.8 L246.0,43.0 L253.0,40.5 L260.0,38.3 L267.0,36.3 L274.0,34.6 L281.0,33.2 L288.0,32.1 L295.0,31.3 L302.0,30.7 L309.0,30.3 L316.0,30.1 L323.0,30.0 L330.0,30.0" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <path d="M50.0,110.0 L57.0,109.2 L64.0,107.1 L71.0,103.8 L78.0,99.6 L85.0,94.7 L92.0,89.2 L99.0,83.3 L106.0,77.2 L113.0,71.1 L120.0,65.0 L127.0,59.1 L134.0,53.6 L141.0,48.4 L148.0,43.8 L155.0,39.7 L162.0,36.3 L169.0,33.6 L176.0,31.6 L183.0,30.4 L190.0,30.0 L197.0,30.4 L204.0,31.6 L211.0,33.6 L218.0,36.3 L225.0,39.7 L232.0,43.8 L239.0,48.4 L246.0,53.6 L253.0,59.1 L260.0,65.0 L267.0,71.1 L274.0,77.2 L281.0,83.3 L288.0,89.2 L295.0,94.7 L302.0,99.6 L309.0,103.8 L316.0,107.1 L323.0,109.2 L330.0,110.0" fill="none" stroke="#1d6fd1" stroke-width="2.2"/>
  <path d="M50.0,110.0 L57.0,90.7 L64.0,74.5 L71.0,61.0 L78.0,50.1 L85.0,41.8 L92.0,35.8 L99.0,32.0 L106.0,30.2 L113.0,30.3 L120.0,32.1 L127.0,35.4 L134.0,40.2 L141.0,46.2 L148.0,53.3 L155.0,61.3 L162.0,70.1 L169.0,79.5 L176.0,89.4 L183.0,99.6 L190.0,110.0 L197.0,120.4 L204.0,130.6 L211.0,140.5 L218.0,149.9 L225.0,158.7 L232.0,166.7 L239.0,173.8 L246.0,179.8 L253.0,184.6 L260.0,187.9 L267.0,189.7 L274.0,189.8 L281.0,188.0 L288.0,184.2 L295.0,178.2 L302.0,169.9 L309.0,159.0 L316.0,145.5 L323.0,129.3 L330.0,110.0" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="298" y="50" font-size="11" fill="#1f2a44">angle / A</text>
  <text x="160" y="22" font-size="11" fill="#1d6fd1">rate / peak</text>
  <text x="58" y="16" font-size="11" fill="#b4232c">accel / peak</text>
</svg>
```

Each curve is scaled to its own peak. The rate peaks at the midpoint, $15A/(8\cdot 4\,\mathrm{s})$; the acceleration peaks about a fifth of the way in, then reverses to brake.
:::

::: context slew-error-picture Two degrees behind, then caught up
The attitude error during the $10^\circ$ slew, from the simulation in this lesson, over eight seconds.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="15" x2="50" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="165" x2="340" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="46" y1="53" x2="340" y2="53" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <line x1="46" y1="109" x2="340" y2="109" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="44" y="57" font-size="11" text-anchor="end" fill="#1f2a44">2°</text>
  <text x="44" y="113" font-size="11" text-anchor="end" fill="#1f2a44">1°</text>
  <text x="44" y="169" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="190" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">4 s</text>
  <text x="330" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">8 s</text>
  <line x1="190" y1="165" x2="190" y2="171" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="330" y1="165" x2="330" y2="171" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M50.0,165.0 L57.0,164.4 L64.0,160.6 L71.0,152.7 L78.0,140.9 L85.0,126.3 L92.0,110.3 L99.0,94.1 L106.0,79.0 L113.0,66.1 L120.0,56.2 L127.0,50.0 L134.0,47.9 L141.0,50.1 L148.0,56.4 L155.0,66.5 L162.0,79.6 L169.0,94.9 L176.0,110.8 L183.0,126.0 L190.0,138.4 L197.0,146.5 L204.0,151.7 L211.0,155.1 L218.0,157.6 L225.0,159.4 L232.0,160.8 L239.0,161.9 L246.0,162.7 L253.0,163.3 L260.0,163.7 L267.0,164.0 L274.0,164.3 L281.0,164.5 L288.0,164.6 L295.0,164.7 L302.0,164.8 L309.0,164.8 L316.0,164.9 L323.0,164.9 L330.0,164.9" fill="none" stroke="#b4232c" stroke-width="2.2"/>
  <path d="M50.0,165.0 L57.0,164.6 L64.0,163.1 L71.0,161.8 L78.0,161.2 L85.0,161.3 L92.0,162.1 L99.0,163.2 L106.0,164.5 L113.0,165.8 L120.0,167.1 L127.0,168.1 L134.0,168.9 L141.0,169.5 L148.0,169.8 L155.0,169.7 L162.0,169.3 L169.0,168.6 L176.0,167.5 L183.0,166.0 L190.0,164.1 L197.0,162.4 L204.0,162.0 L211.0,162.3 L218.0,162.9 L225.0,163.4 L232.0,163.8 L239.0,164.1 L246.0,164.4 L253.0,164.5 L260.0,164.6 L267.0,164.7 L274.0,164.8 L281.0,164.9 L288.0,164.9 L295.0,164.9 L302.0,164.9 L309.0,165.0 L316.0,165.0 L323.0,165.0 L330.0,165.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="146" y="40" font-size="11" fill="#b4232c">feedback only: 2.09° at 2.4 s</text>
  <text x="214" y="146" font-size="11" fill="#1d6fd1">rate feedforward: 0.086°</text>
</svg>
```

The red error grows with the commanded rate and peaks near mid-slew, where the rate is highest. The blue curve, with the rate fed forward, stays within a tenth of a degree of zero the whole way.
:::

::: context wind-biasing Measuring the wind before launch
Launch vehicles have long used a slow kind of disturbance feedforward. On launch day, weather balloons measure the winds aloft, and the planned steering is adjusted before lift-off so the vehicle leans into the expected wind and keeps its angle of attack — and its structural loads — low. NASA's Space Shuttle did this with a "day-of-launch I-load update", recomputing its ascent steering from the measured winds in the hours before launch.

The feedback loop still handles the gusts no balloon saw.
:::

::: context max-q What "max-Q" means
**Dynamic pressure**, $\bar q = \tfrac12\rho v^2$, is how hard the air pushes on a moving vehicle. Low down the air is thick but the rocket is slow; high up the rocket is fast but the air is thin. In between, $\bar q$ reaches a maximum, called **max-Q**, typically about a minute after lift-off. Structural loads and aerodynamic instability both peak there, which is why so many designs are sized at that one moment.
:::

::: context doubling-time How fast an unstable vehicle falls over
Without control, the booster's pitch error grows like $e^{\sqrt{\mu_\alpha}\,t}$. The **doubling time** is how long it takes that error to double: $t_{\text{double}} = \ln 2/\sqrt{\mu_\alpha}$. At max-Q, $\sqrt{0.2283} \approx 0.478\ \mathrm{s^{-1}}$, so $t_{\text{double}} = 0.693/0.478 \approx 1.45\ \mathrm{s}$. A small tilt becomes twice as big in under a second and a half — which is why the autopilot must be several times faster than that.
:::

::: context velocity-form Controlling by changes
A position-form controller computes the whole output every step: $u = K_p e + K_i\cdot(\text{stored integral})$. Change $K_i$ and the product jumps, even though nothing physical happened.

A velocity-form controller computes only how much to *change* the output this step, $\Delta u$, and adds it to the last output. New gains then affect only future changes, so the actuator command stays continuous. It is like steering by nudging the wheel rather than announcing a new wheel angle every moment.
:::

::: context lpv A bridge to robust control
"Linear parameter-varying" means the plant is linear at every instant, but its coefficients depend on a parameter — dynamic pressure, say — that the vehicle measures. The design tools treat the parameter's whole range and its rate of change at once, and prove stability for all of it. You will meet the mathematics behind those guarantees, including the $H_\infty$ norm from the margins lesson, in the robust-control module.
:::
