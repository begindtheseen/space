---
id: l11-open-loop-vs-closed-loop
title: Open-loop and closed-loop transfer functions
minutes: 16
covers:
  - "Open-loop vs closed-loop transfer functions"
---

Up to here, transfer functions have described *things*: an actuator, a vehicle, a filter. From here they describe *loops*, and a loop has two transfer functions that are easy to confuse and mean completely different things. One of them, $L(s)$, is what you design with — it is where crossover, margins and loop shaping live. The other, $T(s)$, is what the vehicle actually does — it is where overshoot, settling time and bandwidth live. Almost every early mistake in control comes from reading one and believing the other.

The reason two objects are needed is that feedback is not a small modification. The closed loop's poles are not the plant's poles; its stability is not the plant's stability; its sensitivity to a 20% modelling error is not 20%. A launch vehicle that doubles its attitude error every four seconds becomes, with the right loop closed around it, a well-damped second-order system that settles in six — and nothing about the vehicle changed. This lesson makes that transformation precise and quantifies the four things feedback buys and the one thing it costs.

It also settles a question every flight control engineer is asked: what error remains in steady state? The answer depends on one integer — the number of integrators in the loop — and it is worth knowing cold.

## The two transfer functions

Take the standard single-loop arrangement: reference $r$, error $e$, controller $C(s)$, plant $G(s)$, sensor $H(s)$, output $y$, with the sensor's output subtracted at the summing junction.

The **loop transfer function** is the product of everything around the loop:

$$
L(s) = C(s)\,G(s)\,H(s).
$$

It is what you would measure by breaking the loop at any point, injecting a signal and looking at what comes back — hence its other name, the **open-loop transfer function**. The **closed-loop transfer function** from reference to output is

$$
T(s) = \frac{Y(s)}{R(s)} = \frac{C(s)G(s)}{1 + C(s)G(s)H(s)} = \frac{CG}{1 + L}.
$$

With a unity sensor, $H = 1$, these simplify to $L = CG$ and $T = L/(1 + L)$. The closed-loop poles are the roots of the **characteristic equation**

$$
1 + L(s) = 0.
$$

::: warning
"Open-loop transfer function" means $L = CGH$, the whole loop gain — not the plant $G$ by itself. Both usages exist in the wild, and mixing them wastes hours. When you say "open loop" in a review, say which: "the plant" or "the loop gain". Note also that $L$ contains the sensor while $T$'s numerator does not, so with $H \ne 1$ the closed loop tracks the *sensor's* calibration: if $H(0) = 1.02$, the vehicle settles 2% short and no loop gain fixes it.
:::

## What feedback buys

**It moves the poles.** The roots of $1 + L = 0$ are not the roots of $L$'s denominator, and the gain moves them. Take the pitch-rate loop of module 8 — airframe $20/(s+1)$, actuator $1/(0.05s + 1)$, proportional gain $K$ — whose open-loop poles are fixed at $-1$ and $-20$:

| $K$ | closed-loop poles | comment |
| --- | --- | --- |
| 0.2 | $-7.30,\ -13.70$ | real, overdamped |
| 0.5 | $-10.5 \pm 10.48j$ | $\zeta = 0.707$ |
| 1.0 | $-10.5 \pm 17.60j$ | $\zeta = 0.512$ |
| 5.0 | $-10.5 \pm 43.70j$ | $\zeta = 0.234$, ringing |

The airframe's $1\,\mathrm{s}$ time constant has become $95\,\mathrm{ms}$. Note also what more gain does not buy: past $K = 0.5$ the real part is stuck at $-10.5$, so the settling time stops improving while the damping keeps falling.

**It desensitises the response to the plant.** This is the property feedback exists for. Perturb the plant, $G \to G(1 + \epsilon)$, and ask what happens to $T = L/(1 + L)$ with $H = 1$. Differentiate:

$$
\frac{dT}{dG} = \frac{C(1 + CG) - CG\cdot C}{(1 + CG)^2} = \frac{C}{(1 + L)^2} \quad\Longrightarrow\quad \frac{dT/T}{dG/G} = \frac{G}{T}\cdot\frac{dT}{dG} = \frac{G(1 + L)}{CG}\cdot\frac{C}{(1 + L)^2} = \frac{1}{1 + L}.
$$

A fractional change in the plant produces a fractional change in the closed loop smaller by the factor $1/(1 + L)$. At frequencies where the loop gain is large, the closed loop barely notices the plant at all. That factor is important enough to have a name and its own lesson: it is the sensitivity function $S$, and lesson 12 is about it.

Concretely, with $L(0) = 10$: a 20% increase in plant gain moves $T(0)$ from $10/11 = 0.9091$ to $12/13 = 0.9231$, a change of 1.54% — against the 1.82% the differential formula predicts, the difference being the finite size of the perturbation. For a 1% plant change the two agree to three figures: 0.0901% measured, 0.0909% predicted.

**It rejects disturbances.** A disturbance $d$ entering at the plant input appears at the output through $G/(1 + L)$ rather than through $G$: suppressed by the same $1/(1 + L)$.

**It stabilises unstable plants.** Nothing else does.

The cost: **it feeds sensor noise straight through**, and it can make a stable plant unstable. Both are the subject of lesson 12.

## Steady-state error and system type

For unity feedback the error transfer function is

$$
\frac{E(s)}{R(s)} = \frac{1}{1 + L(s)},
$$

so by the final value theorem (valid when the closed loop is stable) the steady-state error to an input $R(s)$ is $\lim_{s\to0}sR(s)/(1 + L(s))$.

The **system type** is the number of poles $L$ has at the origin — the number of integrators in the loop, wherever they sit. It decides which inputs the loop can track exactly. Define the error constants

$$
K_p = \lim_{s\to0}L(s), \qquad K_v = \lim_{s\to0}sL(s), \qquad K_a = \lim_{s\to0}s^2L(s),
$$

called the position, velocity and acceleration error constants. Then:

| Type | step $r = 1$ | ramp $r = t$ | parabola $r = t^2/2$ |
| --- | --- | --- | --- |
| 0 | $1/(1 + K_p)$ | $\infty$ | $\infty$ |
| 1 | 0 | $1/K_v$ | $\infty$ |
| 2 | 0 | 0 | $1/K_a$ |

Each integrator buys the ability to track one more power of $t$ with zero error, and the price is $90^\circ$ of phase lag at every frequency, which must be paid back somewhere near crossover. A spacecraft from torque to attitude is already type 2 because $1/(Is^2)$ has two integrators, which is why an attitude loop tracks a constant slew rate with no lag. A launch vehicle's pitch channel, $\mu_\delta/(s^2 - \mu_\alpha)$, has **no** integrator: its type is 0 and a proportional controller leaves a standing attitude error.

::: key
Loop transfer function $L = CGH$ (also called the open-loop transfer function); closed loop $T = CG/(1 + L)$, and $T = L/(1 + L)$ for unity feedback. Closed-loop poles solve $1 + L = 0$. A fractional plant change $dG/G$ produces a closed-loop change $dT/T = \dfrac{1}{1 + L}\dfrac{dG}{G}$. System type $=$ number of integrators in $L$; error constants $K_p = L(0)$, $K_v = \lim sL$, $K_a = \lim s^2L$.
:::

## Open-loop stability is not closed-loop stability

The two are logically independent, and both directions happen in practice.

**Unstable open, stable closed.** Every launch vehicle at max q, every landing booster, every fighter with relaxed static stability. This is the case feedback exists for.

**Stable open, unstable closed.** Module 8's satellite loop with a wheel lag: all the plant's poles are in the left half plane for any lag $\tau$, yet the closed loop goes unstable for $\tau > 2\,\mathrm{s}$. Nothing about the plant changed; the loop's phase at crossover did.

There is a third case worth flagging because it surprises people. For an open-loop *unstable* plant there is a **minimum** loop gain as well as a maximum: reduce the gain far enough and the loop can no longer hold the unstable mode, so the Bode plot has a gain margin in the downward direction. A saturating actuator effectively reduces the loop gain, which is why authority limits matter so much on statically unstable vehicles.

::: example Stabilising a launch vehicle with PD attitude feedback
The plant is lesson 3's rigid pitch channel, $G(s) = \dfrac{\mu_\delta}{s^2 - \mu_\alpha}$ with $\mu_\delta = 1.745\,\mathrm{s^{-2}}$ and $\mu_\alpha = 0.02657\,\mathrm{s^{-2}}$: poles at $\pm0.163\,\mathrm{rad/s}$, attitude error doubling every $4.25\,\mathrm{s}$. Take a unity sensor and a PD controller $C(s) = K_p + K_ds$.

The loop transfer function is $L = \dfrac{\mu_\delta(K_ds + K_p)}{s^2 - \mu_\alpha}$, and the characteristic equation $1 + L = 0$ multiplies out to

$$
s^2 + \mu_\delta K_d\,s + \left(\mu_\delta K_p - \mu_\alpha\right) = 0.
$$

Compare with $s^2 + 2\zeta\omega_ns + \omega_n^2$. For $\omega_n = 1.0\,\mathrm{rad/s}$ and $\zeta = 0.7$:

$$
K_p = \frac{\omega_n^2 + \mu_\alpha}{\mu_\delta} = \frac{1.0266}{1.745} = 0.5883, \qquad K_d = \frac{2\zeta\omega_n}{\mu_\delta} = \frac{1.4}{1.745} = 0.8023,
$$

in units of nozzle radians per radian of attitude error and per $\mathrm{rad/s}$ of rate. The closed-loop poles are $-0.700 \pm 0.714j$: 4.6% overshoot, 2% settling in $4/0.7 = 5.71\,\mathrm{s}$. An unstable vehicle has become an ordinary well-damped one.

Now the margins, and the surprise. Stability requires $K_d > 0$ **and** $\mu_\delta K_p > \mu_\alpha$, that is $K_p > \mu_\alpha/\mu_\delta = 0.01523$. The design sits a factor of $0.5883/0.01523 = 38.6$ above that floor, so the loop gain could fall by $31.7\,\mathrm{dB}$ before the vehicle diverges. There is no upper gain limit in this idealised model — adding the actuator and the bending modes supplies one — but the lower limit is real and is why nozzle authority and actuator rate limits are sized with the unstable mode in mind.

Note the type: $L$ has no pole at the origin, so the loop is type 0 and $K_p^{\text{err}} = L(0) = \mu_\delta K_p/(-\mu_\alpha) = -38.6$. A constant disturbance — a thrust misalignment, a steady crosswind — therefore leaves a standing attitude error of $1/(1 + L(0)) = -0.0266$ of the disturbance's equivalent, which real vehicles remove with an integral term or with a drift-minimum guidance law rather than with more proportional gain.
:::

::: example What a solar-pressure torque does to a pointing loop
A spacecraft with $I = 1200\,\mathrm{kg\,m^2}$ is controlled by wheels with a PD law, $C = K_p + K_ds$, around the plant $G = 1/(Is^2)$. The loop is type 2 with $L = (K_ds + K_p)/(Is^2)$, so a step or ramp attitude command is tracked with zero steady-state error. The interesting error is the disturbance.

A constant disturbance torque $T_d$ enters at the plant input, so

$$
\frac{\Theta}{T_d} = \frac{G}{1 + CG} = \frac{1/(Is^2)}{1 + (K_ds + K_p)/(Is^2)} = \frac{1}{Is^2 + K_ds + K_p},
$$

and the steady-state attitude offset for a constant torque is $T_d/K_p$: the integrators in the plant do nothing for a disturbance that enters *after* them.

Design for $\omega_n = 0.5\,\mathrm{rad/s}$ and $\zeta = 0.7$: $K_p = I\omega_n^2 = 300\,\mathrm{N\,m/rad}$ and $K_d = 2\zeta\omega_nI = 840\,\mathrm{N\,m\,s/rad}$. A solar-radiation-pressure torque of $0.01\,\mathrm{N\,m}$ then produces

$$
\theta_{ss} = \frac{0.01}{300} = 3.33\times10^{-5}\,\mathrm{rad} = 6.9\ \text{arcseconds}.
$$

Whether that is acceptable depends on the payload: fine for a communications antenna, unacceptable for an astronomical telescope. Doubling $K_p$ halves it to 3.4 arcseconds but raises $\omega_n$ to $0.707\,\mathrm{rad/s}$ and drops $\zeta$ to 0.495 unless $K_d$ is raised too. The structural fix is to add integral action, making the loop type 3 with respect to this disturbance path, which drives the steady-state offset to zero at the cost of phase margin and of integrator windup when the wheels saturate — the subject of the next module.
:::

## Check yourself

::: check
A loop has $L(s) = \dfrac{20}{(s + 1)(s + 4)}$ with unity feedback. Give the system type, the steady-state error to a unit step, and the closed-loop poles.
:::

::: answer
No pole at the origin, so the loop is type 0. $K_p = L(0) = 20/4 = 5$, so the steady-state error to a unit step is $1/(1 + K_p) = 1/6 = 0.167$ — the output settles at $0.833$, not 1. Closed-loop poles: $1 + L = 0$ gives $(s+1)(s+4) + 20 = s^2 + 5s + 24 = 0$, so $s = -2.5 \pm 4.213j$, $\omega_n = \sqrt{24} = 4.90\,\mathrm{rad/s}$ and $\zeta = 2.5/4.90 = 0.510$. The open-loop poles were $-1$ and $-4$, both real; feedback has pulled them together and off the axis, roughly quintupling the natural frequency while leaving a 16% standing error that only an integrator can remove.
:::

::: check
Why does adding an integrator to a loop remove steady-state step error, and what does it cost?
:::

::: answer
The error transfer function is $1/(1 + L)$. An integrator makes $\lvert L\rvert \to \infty$ as $s \to 0$, so $E/R \to 0$ at DC and the steady-state error to a step vanishes: the integrator keeps accumulating error until the error is zero, and only then does its output stop changing. The cost is $-90^\circ$ of phase at every frequency, which has to be paid back near crossover — typically by placing the integrator's associated zero (as in a PI controller) well below crossover so that most of the lag is recovered before the loop crosses over. Two other costs are practical: the integrator state can wind up during actuator saturation, and the extra pole at the origin makes the loop one order higher and reduces the gain margin.
:::

::: check
A vehicle's plant gain $\mu_\delta$ is known to $\pm30\%$ because of thrust and inertia uncertainty. At a frequency where the loop gain is $\lvert L\rvert = 25$, how much does the closed-loop response vary? At a frequency where $\lvert L\rvert = 0.1$?
:::

::: answer
The closed-loop fractional variation is $\lvert dT/T\rvert = \lvert dG/G\rvert/\lvert 1 + L\rvert$. Where $\lvert L\rvert = 25$, $\lvert 1 + L\rvert$ is between 24 and 26 depending on phase, so $30\%$ becomes roughly $30/25 = 1.2\%$ — feedback has absorbed the uncertainty almost completely. Where $\lvert L\rvert = 0.1$, $\lvert 1 + L\rvert \approx 1.1$ at best and as little as $0.9$ if the phase is near $180^\circ$, so $30\%$ stays $27\%$ or becomes $33\%$: the loop is doing nothing there. This is the whole story of loop shaping in one comparison — uncertainty is suppressed only where the loop gain is large, so you put the gain where the uncertainty and the disturbances are, and accept the plant as it is everywhere else.
:::

::: check
Explain why an open-loop unstable plant has a *minimum* loop gain, and what that implies about actuator saturation.
:::

::: answer
For the PD launch-vehicle loop the characteristic equation is $s^2 + \mu_\delta K_ds + (\mu_\delta K_p - \mu_\alpha) = 0$. A second-order polynomial has both roots in the left half plane only if every coefficient is positive, and the constant term is positive only if $\mu_\delta K_p > \mu_\alpha$. Physically the proportional term must generate a restoring moment larger than the destabilising aerodynamic one; below that gain, feedback is not strong enough to overcome the instability and the vehicle diverges regardless of the damping term. Actuator saturation is exactly a reduction in effective loop gain — once the nozzle is on its stop, further error produces no further moment — so a large transient can push the effective gain below the floor and the vehicle departs. This is why statically unstable vehicles are sized for control authority against the worst-case wind and thrust misalignment, and why anti-windup and rate limiting are safety features rather than refinements.
:::

::: check
A pitch-rate loop uses a gyro whose scale factor is 2% high, so $H(0) = 1.02$. The loop gain at DC is $L(0) = 40$. What steady-state rate does a $5\,^\circ/\mathrm{s}$ command produce?
:::

::: answer
With a non-unity sensor, $T = CG/(1 + CGH)$, so $T(0) = \dfrac{L(0)/H(0)}{1 + L(0)} = \dfrac{40/1.02}{41} = 0.9564$. The commanded $5\,^\circ/\mathrm{s}$ therefore produces $4.782\,^\circ/\mathrm{s}$. Decompose the error: $1/(1 + L(0)) = 2.44\%$ is the ordinary finite-gain error that more loop gain would shrink, and the remaining $1.96\%$ is the sensor scale factor, which more loop gain makes *worse*, not better — as $L \to \infty$, $T(0) \to 1/H(0) = 0.9804$. Feedback drives the measurement to the command, so the loop is exactly as accurate as its sensor. This is why sensor calibration, not controller gain, sets the accuracy floor of any control system.
:::

## Summary

| Item | Statement |
| --- | --- |
| Loop transfer function | $L = CGH$, the product around the loop; also called the open-loop transfer function |
| Closed loop | $T = CG/(1 + L)$; $T = L/(1 + L)$ for unity feedback |
| Characteristic equation | $1 + L(s) = 0$; its roots are the closed-loop poles |
| Desensitisation | $\dfrac{dT}{T} = \dfrac{1}{1 + L}\dfrac{dG}{G}$ |
| Error transfer function | $E/R = 1/(1 + L)$ for unity feedback |
| System type | number of integrators in $L$ |
| Error constants | $K_p = L(0)$, $K_v = \lim_{s\to0}sL$, $K_a = \lim_{s\to0}s^2L$ |
| Steady-state errors | type 0: $1/(1 + K_p)$ to a step; type 1: $1/K_v$ to a ramp; type 2: $1/K_a$ to a parabola |
| Input disturbance | $\Theta/T_d = G/(1 + L)$; a PD-controlled rigid body leaves $T_d/K_p$ |
| Stability | open-loop and closed-loop stability are independent; an unstable plant has a minimum loop gain |
| Sensor calibration | with $H(0) \ne 1$ the loop tracks $1/H(0)$, whatever the gain |

The factor $1/(1 + L)$ has now appeared in the error, in the disturbance response and in the sensitivity to plant error, and $L/(1 + L)$ in the command response. The next lesson gives those two functions their names, proves that they must sum to one, and shows why that single identity decides what any feedback design can and cannot achieve.
