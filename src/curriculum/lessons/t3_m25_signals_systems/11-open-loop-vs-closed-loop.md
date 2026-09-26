---
id: l11-open-loop-vs-closed-loop
title: Open-loop and closed-loop transfer functions
minutes: 19
covers:
  - "Open-loop vs closed-loop transfer functions"
---

Picture yourself steering a bicycle. The bicycle is the thing being controlled. You watch where it is going, compare that with where you want to go, and turn the handlebars to fix the difference. Now there are two different questions you could ask. One is about the **loop**: how strongly does a small wobble get corrected on each trip around — eye to brain to hands to bike and back to eye? The other is about the **result**: when you decide to turn left, how does the bicycle actually respond? Both questions matter, and they have different answers.

Up to here, transfer functions have described *things*: an actuator, a vehicle, a filter. From here on they describe *loops*, and a loop has two transfer functions that are easy to confuse and mean completely different things. One of them, $L(s)$, is what you design with. It is where crossover, margins and loop shaping live. The other, $T(s)$, is what the vehicle actually does. It is where overshoot, settling time and bandwidth live. Almost every early mistake in control comes from reading one and believing the other.

Two objects are needed because feedback is not a small change. The closed loop's poles are not the plant's poles. Its stability is not the plant's stability. Its sensitivity to a 20% modeling error is not 20%. A launch vehicle that doubles its attitude error every four seconds becomes, with the right loop closed around it, a well-damped second-order system that settles in about six seconds — and nothing about the vehicle changed. This lesson makes that transformation precise. It counts the four things feedback buys and the one thing it costs.

It also settles a question every flight control engineer gets asked: what error is left over once everything settles? The answer depends on one whole number — how many integrators are in the loop — and it is worth knowing cold.

## The two transfer functions

Take the standard single loop. A reference $r$ (what you want) enters a summing junction. The sensor's reading is subtracted there, leaving the error $e$. The error goes into a controller $C(s)$, which drives the plant $G(s)$ — the vehicle — whose output is $y$. A sensor $H(s)$ measures $y$ and sends it back to the junction.

The **loop transfer function** is the product of everything around the loop:

$$
L(s) = C(s)\,G(s)\,H(s).
$$

It is what you would measure if you [[broke the loop|breaking-the-loop]] at any point, injected a test signal, and looked at what came back around. That is why it has a second name, the **open-loop transfer function**.

The **closed-loop transfer function**, from reference to output, is

$$
T(s) = \frac{Y(s)}{R(s)} = \frac{C(s)G(s)}{1 + C(s)G(s)H(s)} = \frac{CG}{1 + L}.
$$

This is the feedback rule of lesson 10: forward path over one plus the loop gain. With a unity sensor, $H = 1$, both simplify: $L = CG$ and $T = L/(1 + L)$. The closed-loop poles are the roots of the **characteristic equation**

$$
1 + L(s) = 0.
$$

::: warning
"Open-loop transfer function" means $L = CGH$, the whole loop gain — not the plant $G$ by itself. Both usages exist in the wild, and mixing them wastes hours. When you say "open loop" in a design review, say which you mean: "the plant" or "the loop gain".

Notice also that $L$ contains the sensor while $T$'s numerator does not. So with $H \ne 1$ the closed loop tracks the *sensor's* calibration. If $H(0) = 1.02$, the vehicle settles 2% short, and no amount of loop gain fixes it.
:::

## What feedback buys

### It moves the poles

The roots of $1 + L = 0$ are not the roots of $L$'s denominator, and turning up the gain moves them.

Take the pitch-rate loop of module 8: an airframe $20/(s+1)$, an actuator $1/(0.05s + 1)$, and a proportional gain $K$. The open-loop poles sit at $-1$ and $-20$ no matter what $K$ is. Now close the loop. The characteristic equation is $(s + 1)(0.05s + 1) + 20K = 0$. Multiply by $20$ to clear the $0.05$:

$$
s^2 + 21s + 20 + 400K = 0.
$$

Solve it for a few gains, and the **[[poles travel|root-movement]]**:

| $K$ | closed-loop poles | comment |
| --- | --- | --- |
| 0.2 | $-7.30,\ -13.70$ | real, overdamped |
| 0.5 | $-10.5 \pm 10.48j$ | $\zeta = 0.707$ |
| 1.0 | $-10.5 \pm 17.60j$ | $\zeta = 0.512$ |
| 5.0 | $-10.5 \pm 43.70j$ | $\zeta = 0.234$, ringing |

The airframe's $1\,\mathrm{s}$ time constant has become $1/10.5 = 95\,\mathrm{ms}$. Notice also what more gain does *not* buy. Past $K = 0.5$ the real part is stuck at $-10.5$ (half the $21$ in the middle coefficient), so the settling time stops improving while the damping keeps falling.

### It makes the response care less about the plant

This is the property feedback exists for, and the idea goes back to the **[[telephone amplifiers|black-amplifier]]** of the 1920s. Suppose the plant is not quite what you modeled. Its gain is off by some fraction $\epsilon$ ("epsilon"), so $G$ becomes $G(1 + \epsilon)$. How much does the closed loop $T$ change?

Take $H = 1$, so $T = CG/(1 + CG)$. Differentiate $T$ with respect to $G$ using the quotient rule, then turn it into a ratio of *fractional* changes:

$$
\frac{dT}{dG} = \frac{C(1 + CG) - CG\cdot C}{(1 + CG)^2} = \frac{C}{(1 + L)^2} \quad\Longrightarrow\quad \frac{dT/T}{dG/G} = \frac{G}{T}\cdot\frac{dT}{dG} = \frac{G(1 + L)}{CG}\cdot\frac{C}{(1 + L)^2} = \frac{1}{1 + L}.
$$

In words: a fractional change in the plant produces a fractional change in the closed loop that is smaller by the factor $1/(1 + L)$. At frequencies where the loop gain is large, the closed loop barely notices the plant at all. That factor is important enough to have a name and a lesson of its own. It is the sensitivity function $S$, and lesson 12 is about it.

**A check with numbers.** Let $L(0) = 10$. Then $T(0) = 10/11 = 0.9091$. Raise the plant gain by 20%, so $L(0) = 12$ and $T(0) = 12/13 = 0.9231$. That is a change of 1.54%. The formula predicted $20\%/11 = 1.82\%$. The gap is there because 20% is not a small change, and the formula is a derivative. For a 1% plant change the two agree to three figures: 0.0901% measured, 0.0909% predicted.

### It rejects disturbances

A **disturbance** is an unwanted push from outside — a gust, a thrust misalignment. A disturbance $d$ entering at the plant input reaches the output through $G/(1 + L)$ instead of through $G$. It is suppressed by the same factor $1/(1 + L)$.

### It stabilizes unstable plants

Nothing else does. A vehicle that falls over on its own can be held upright only by a loop that keeps measuring and correcting.

### What it costs

**It feeds sensor noise straight through**, and it can make a stable plant unstable. Both are the subject of lesson 12.

## Steady-state error and system type

Here is the leftover-error question. With unity feedback, the error is $e = r - y$, and dividing through by $R$ gives the **error transfer function**:

$$
\frac{E(s)}{R(s)} = \frac{1}{1 + L(s)}.
$$

The **[[final value theorem|final-value]]** turns that into a steady-state error. Provided the closed loop is stable, the error that remains after everything settles is

$$
e_{ss} = \lim_{s\to0}\frac{sR(s)}{1 + L(s)}.
$$

The **system type** is the number of poles $L$ has at the origin — that is, the number of **[[integrators|integrator-bathtub]]** in the loop, wherever they sit. It decides which inputs the loop can track with no error at all. Define three **error constants**:

$$
K_p = \lim_{s\to0}L(s), \qquad K_v = \lim_{s\to0}sL(s), \qquad K_a = \lim_{s\to0}s^2L(s).
$$

They are called the position, velocity and acceleration error constants. (Careful: this $K_p$ is not the proportional gain of a PD controller. The two share a name by tradition, so say which one you mean.) Then the steady-state errors are:

| Type | step $r = 1$ | ramp $r = t$ | parabola $r = t^2/2$ |
| --- | --- | --- | --- |
| 0 | $1/(1 + K_p)$ | $\infty$ | $\infty$ |
| 1 | 0 | $1/K_v$ | $\infty$ |
| 2 | 0 | 0 | $1/K_a$ |

Each integrator buys the ability to track one more power of $t$ with zero error. The price is $90^\circ$ of phase lag at every frequency, which must be paid back somewhere near crossover.

Two vehicles show the range. A spacecraft, from torque to attitude, is already type 2, because $1/(Is^2)$ has two integrators built in — torque makes rate, rate makes angle. That is why an attitude loop tracks a constant slew rate with no lag. A launch vehicle's pitch channel, $\mu_\delta/(s^2 - \mu_\alpha)$, has **no** integrator. Its type is 0, and a proportional controller leaves a [[standing attitude error|type-zero-step]].

::: key
Loop transfer function $L = CGH$ (also called the open-loop transfer function); closed loop $T = CG/(1 + L)$, and $T = L/(1 + L)$ for unity feedback. Closed-loop poles solve $1 + L = 0$. A fractional plant change $dG/G$ produces a closed-loop change $dT/T = \dfrac{1}{1 + L}\dfrac{dG}{G}$. System type $=$ number of integrators in $L$; error constants $K_p = L(0)$, $K_v = \lim sL$, $K_a = \lim s^2L$.
:::

## Open-loop stability is not closed-loop stability

Whether the plant is stable on its own, and whether the closed loop is stable, are separate questions. Every combination happens in practice.

**Unstable open, stable closed.** Every launch vehicle at **[[max q|max-q]]**, every landing booster, every fighter with **[[relaxed static stability|relaxed-stability]]**. This is the case feedback exists for.

**Stable open, unstable closed.** Module 8's satellite loop with a wheel lag: all the plant's poles are in the left half plane for any lag $\tau$, yet the closed loop goes unstable for $\tau > 2\,\mathrm{s}$. Nothing about the plant changed. The loop's phase at crossover did.

A third case surprises people. For an open-loop *unstable* plant, there is a **minimum** loop gain as well as a maximum. Turn the gain down far enough and the loop can no longer hold the unstable motion, so the Bode plot has a gain margin in the downward direction. An actuator that **[[saturates|saturation]]** — hits its end stop — effectively reduces the loop gain. That is why authority limits matter so much on statically unstable vehicles.

::: example Stabilizing a launch vehicle with PD attitude feedback
The plant is lesson 3's rigid pitch channel,

$$
G(s) = \frac{\mu_\delta}{s^2 - \mu_\alpha}, \qquad \mu_\delta = 1.745\,\mathrm{s^{-2}}, \quad \mu_\alpha = 0.02657\,\mathrm{s^{-2}}.
$$

Its poles are at $\pm\sqrt{0.02657} = \pm0.163\,\mathrm{rad/s}$. The one at $+0.163$ makes the attitude error double every $\ln 2/0.163 = 4.25\,\mathrm{s}$. Take a unity sensor and a **PD controller** (proportional plus derivative), $C(s) = K_p + K_ds$.

**Characteristic equation.** The loop transfer function is $L = \dfrac{\mu_\delta(K_ds + K_p)}{s^2 - \mu_\alpha}$. Set $1 + L = 0$ and multiply through by $s^2 - \mu_\alpha$:

$$
s^2 + \mu_\delta K_d\,s + \left(\mu_\delta K_p - \mu_\alpha\right) = 0.
$$

**Match the standard form.** Compare with $s^2 + 2\zeta\omega_ns + \omega_n^2$ and aim for $\omega_n = 1.0\,\mathrm{rad/s}$, $\zeta = 0.7$:

$$
K_p = \frac{\omega_n^2 + \mu_\alpha}{\mu_\delta} = \frac{1.0266}{1.745} = 0.5883, \qquad K_d = \frac{2\zeta\omega_n}{\mu_\delta} = \frac{1.4}{1.745} = 0.8023.
$$

The units are nozzle radians per radian of attitude error, and per $\mathrm{rad/s}$ of rate. The closed-loop poles are $-0.700 \pm 0.714j$: 4.6% overshoot, and 2% settling in $4/0.7 = 5.71\,\mathrm{s}$. An unstable vehicle has become an ordinary, well-damped one.

**The margins, and the surprise.** A second-order polynomial has both roots in the left half plane only if all its coefficients are positive. So stability needs $K_d > 0$ **and** $\mu_\delta K_p > \mu_\alpha$, that is $K_p > \mu_\alpha/\mu_\delta = 0.01523$. The design sits $0.5883/0.01523 = 38.6$ times above that floor. So the loop gain could fall by a factor of $38.6$ — that is $20\log_{10}38.6 = 31.7\,\mathrm{dB}$ — before the vehicle diverges. This idealized model has no upper gain limit; adding the actuator and the bending modes supplies one. But the lower limit is real, and it is why nozzle authority and actuator rate limits are sized with the unstable mode in mind.

**The type.** $L$ has no pole at the origin, so the loop is type 0. Its position error constant is $L(0) = \mu_\delta K_p/(-\mu_\alpha) = -38.6$ (negative, because the plant's DC gain is negative). A constant disturbance — a thrust misalignment, a steady crosswind — therefore leaves a standing attitude error. Referred to the output, it is multiplied by $1/(1 + L(0)) = 1/(1 - 38.6) = -0.0266$: about 2.7% of it remains. Real vehicles remove that with an integral term, or with a drift-minimum guidance law, not with more proportional gain.
:::

::: example What a solar-pressure torque does to a pointing loop
A spacecraft with moment of inertia $I = 1200\,\mathrm{kg\,m^2}$ is pointed by reaction wheels with a PD law, $C = K_p + K_ds$, around the plant $G = 1/(Is^2)$. The loop is type 2, with $L = (K_ds + K_p)/(Is^2)$, so a step or ramp attitude command is tracked with zero steady-state error. The interesting error comes from the disturbance.

**The disturbance path.** A constant disturbance torque $T_d$ enters at the plant input. Its path to the attitude is $G/(1 + CG)$:

$$
\frac{\Theta}{T_d} = \frac{G}{1 + CG} = \frac{1/(Is^2)}{1 + (K_ds + K_p)/(Is^2)} = \frac{1}{Is^2 + K_ds + K_p}.
$$

(The middle step multiplies top and bottom by $Is^2$.) Put $s = 0$: a constant torque leaves a steady attitude offset of $T_d/K_p$. The plant's two integrators do not help here. Only integrators *upstream* of where a disturbance enters — in the controller — can cancel it. The plant's integrators sit downstream of the torque, so they carry its effect along instead of fighting it.

**Design.** Aim for $\omega_n = 0.5\,\mathrm{rad/s}$ and $\zeta = 0.7$. The characteristic polynomial $Is^2 + K_ds + K_p$ must match $I(s^2 + 2\zeta\omega_ns + \omega_n^2)$, so

$$
K_p = I\omega_n^2 = 1200 \times 0.25 = 300\,\mathrm{N\,m/rad}, \qquad K_d = 2\zeta\omega_nI = 2 \times 0.7 \times 0.5 \times 1200 = 840\,\mathrm{N\,m\,s/rad}.
$$

**The offset.** A **[[solar-radiation-pressure|solar-pressure]]** torque of $0.01\,\mathrm{N\,m}$ then produces

$$
\theta_{ss} = \frac{0.01}{300} = 3.33\times10^{-5}\,\mathrm{rad} = 6.9\ \text{arcseconds}.
$$

(Multiply radians by $180/\pi$ for degrees, then by $3600$ for **[[arcseconds|arcseconds]]**.) Whether that is acceptable depends on the payload. It is fine for a communications antenna and unacceptable for an astronomical telescope.

Doubling $K_p$ halves the offset to $3.4$ arcseconds. But it raises $\omega_n$ to $0.707\,\mathrm{rad/s}$ and drops $\zeta$ to $0.495$, unless $K_d$ is raised too. The structural fix is integral action. An integrator in the controller — upstream of where the torque enters — keeps pushing until the offset is zero. The loop becomes type 3, and the constant-torque offset goes to zero. The costs are phase margin and **[[integrator windup|windup]]** when the wheels saturate, which is the subject of the next module.
:::

## Check yourself

::: check
A loop has $L(s) = \dfrac{20}{(s + 1)(s + 4)}$ with unity feedback. Give the system type, the steady-state error to a unit step, and the closed-loop poles.
:::

::: answer
**Type.** There is no pole at the origin, so the loop is type 0.

**Step error.** $K_p = L(0) = 20/(1 \times 4) = 5$, so the steady-state error to a unit step is $1/(1 + K_p) = 1/6 = 0.167$. The output settles at $0.833$, not $1$.

**Poles.** $1 + L = 0$ gives $(s+1)(s+4) + 20 = s^2 + 5s + 24 = 0$. The quadratic formula gives $s = -2.5 \pm \sqrt{24 - 6.25}\,j = -2.5 \pm 4.213j$. So $\omega_n = \sqrt{24} = 4.90\,\mathrm{rad/s}$ and $\zeta = 2.5/4.90 = 0.510$.

The open-loop poles were $-1$ and $-4$, both real, with $\omega_n = \sqrt{1 \times 4} = 2\,\mathrm{rad/s}$. Feedback has pulled them together and off the real axis, raising the natural frequency about $2.4$ times. It has also left a 16.7% standing error that only an integrator can remove.
:::

::: check
Why does adding an integrator to a loop remove steady-state step error, and what does it cost?
:::

::: answer
The error transfer function is $1/(1 + L)$. An integrator makes $\lvert L\rvert \to \infty$ as $s \to 0$, so $E/R \to 0$ at DC and the steady-state error to a step vanishes. In plain terms: the integrator keeps adding up the error, and its output only stops changing once the error is zero.

The cost is $-90^\circ$ of phase at every frequency, which has to be paid back near crossover. The usual way is to place the integrator's companion zero (as in a PI controller) well below crossover, so most of the lag is recovered before the loop crosses over. Two other costs are practical. The integrator can wind up while the actuator is saturated. And the extra pole at the origin makes the loop one order higher and reduces the gain margin.
:::

::: check
A vehicle's plant gain $\mu_\delta$ is known only to $\pm30\%$ because of thrust and inertia uncertainty. At a frequency where the loop gain is $\lvert L\rvert = 25$, how much does the closed-loop response vary? At a frequency where $\lvert L\rvert = 0.1$?
:::

::: answer
The closed-loop fractional variation is $\lvert dT/T\rvert = \lvert dG/G\rvert/\lvert 1 + L\rvert$.

Where $\lvert L\rvert = 25$, $\lvert 1 + L\rvert$ lies between $24$ and $26$ depending on the phase. So $30\%$ becomes roughly $30\%/25 = 1.2\%$. Feedback has absorbed the uncertainty almost completely.

Where $\lvert L\rvert = 0.1$, $\lvert 1 + L\rvert$ is at most $1.1$, and as little as $0.9$ if the phase is near $180^\circ$. So $30\%$ stays about $27\%$, or becomes $33\%$. The loop is doing nothing there.

This is the whole story of loop shaping in one comparison. Uncertainty is suppressed only where the loop gain is large. So you put the gain where the uncertainty and the disturbances are, and accept the plant as it is everywhere else.
:::

::: check
Explain why an open-loop unstable plant has a *minimum* loop gain, and what that implies about actuator saturation.
:::

::: answer
For the PD launch-vehicle loop the characteristic equation is $s^2 + \mu_\delta K_ds + (\mu_\delta K_p - \mu_\alpha) = 0$. A second-order polynomial has both roots in the left half plane only if every coefficient is positive. The constant term is positive only if $\mu_\delta K_p > \mu_\alpha$.

Physically, the proportional term must make a restoring moment bigger than the aerodynamic moment trying to tip the vehicle over. Below that gain, feedback is not strong enough to beat the instability, and the vehicle diverges no matter how much damping there is.

Actuator saturation is exactly a drop in effective loop gain. Once the nozzle is on its stop, more error produces no more moment. So a large transient can push the effective gain below the floor, and the vehicle departs. That is why statically unstable vehicles are sized for control authority against the worst-case wind and thrust misalignment, and why anti-windup and rate limiting are safety features, not refinements.
:::

::: check
A pitch-rate loop uses a gyro whose scale factor is 2% high, so $H(0) = 1.02$. The loop gain at DC is $L(0) = 40$. What steady-state rate does a $5\,^\circ/\mathrm{s}$ command produce?
:::

::: answer
With a non-unity sensor, $T = CG/(1 + CGH)$. At DC, $CG = L/H$, so

$$
T(0) = \frac{L(0)/H(0)}{1 + L(0)} = \frac{40/1.02}{41} = 0.9565.
$$

The commanded $5\,^\circ/\mathrm{s}$ therefore produces $5 \times 0.9565 = 4.782\,^\circ/\mathrm{s}$.

Split the error into its two causes. $T(0)$ is the product of two factors, $\dfrac{1}{H(0)} = 0.9804$ and $\dfrac{L(0)}{1 + L(0)} = 0.9756$. The second is the ordinary finite-gain error of $1/(1 + L(0)) = 2.44\%$, which more loop gain would shrink. The first is the sensor's $1.96\%$ scale-factor error, which more loop gain does *not* fix: as $L \to \infty$, $T(0) \to 1/H(0) = 0.9804$. Together they give the total shortfall of $1 - 0.9565 = 4.35\%$.

Feedback drives the *measurement* to the command, so the loop is exactly as accurate as its sensor. That is why sensor calibration, not controller gain, sets the accuracy floor of any control system.
:::

## Summary

| Item | Statement |
| --- | --- |
| Loop transfer function | $L = CGH$, the product around the loop; also called the open-loop transfer function |
| Closed loop | $T = CG/(1 + L)$; $T = L/(1 + L)$ for unity feedback |
| Characteristic equation | $1 + L(s) = 0$; its roots are the closed-loop poles |
| Desensitization | $\dfrac{dT}{T} = \dfrac{1}{1 + L}\dfrac{dG}{G}$ |
| Error transfer function | $E/R = 1/(1 + L)$ for unity feedback |
| System type | number of integrators in $L$ |
| Error constants | $K_p = L(0)$, $K_v = \lim_{s\to0}sL$, $K_a = \lim_{s\to0}s^2L$ |
| Steady-state errors | type 0: $1/(1 + K_p)$ to a step; type 1: $1/K_v$ to a ramp; type 2: $1/K_a$ to a parabola |
| Input disturbance | $\Theta/T_d = G/(1 + L)$; a PD-controlled rigid body leaves $T_d/K_p$ |
| Stability | open-loop and closed-loop stability are independent; an unstable plant has a minimum loop gain |
| Sensor calibration | with $H(0) \ne 1$ the loop tracks $1/H(0)$, whatever the gain |

The factor $1/(1 + L)$ has now appeared in the error, in the disturbance response and in the sensitivity to plant error, and $L/(1 + L)$ in the command response. The next lesson gives those two functions their names, proves that they must add to one, and shows why that single identity decides what any feedback design can and cannot achieve.

::: context breaking-the-loop Measuring the loop by breaking it
Cut the wire right after the controller. Push a known test signal into the loop side of the cut, and record what arrives back at the other side after going through the plant, the sensor and the controller. The ratio of what came back to what you sent is $-L$ — the minus sign is the summing junction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="40" cy="50" r="12" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="46" y="80" font-size="14" fill="#b4232c">−</text>
  <line x1="52" y1="50" x2="78" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <rect x="78" y="34" width="44" height="32" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="100" y="55" font-size="13" text-anchor="middle" fill="#1f2a44">C</text>
  <line x1="122" y1="50" x2="146" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <text x="124" y="84" font-size="11" fill="#6c7a93">back</text>
  <text x="168" y="84" font-size="11" fill="#1d6fd1">in</text>
  <line x1="150" y1="36" x2="150" y2="64" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="162" y1="36" x2="162" y2="64" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="166" y1="50" x2="198" y2="50" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="200,50 190,45 190,55" fill="#1d6fd1"/>
  <rect x="200" y="34" width="44" height="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="222" y="55" font-size="13" text-anchor="middle" fill="#1f2a44">G</text>
  <line x1="244" y1="50" x2="300" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="300,50 300,115 244,115" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <rect x="200" y="99" width="44" height="32" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="222" y="120" font-size="13" text-anchor="middle" fill="#1f2a44">H</text>
  <polyline points="200,115 40,115 40,64" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="40,62 35,72 45,72" fill="#1f2a44"/>
  <text x="156" y="24" font-size="12" text-anchor="middle" fill="#b4232c">cut here</text>
  <text x="180" y="145" font-size="12" text-anchor="middle" fill="#1f2a44">back / in = −C G H = −L</text>
</svg>
```

Engineers really do this on hardware, often without cutting anything: they add the test signal at one point with the loop still closed and compare the signals on either side. It is how a flight control system's margins are checked before first flight.
:::

::: context root-movement Watching the poles move
Here are the closed-loop poles from the table, drawn in the complex plane. The crosses are the open-loop poles at $-1$ and $-20$. As $K$ grows, the two poles slide toward each other along the real axis, meet at $-10.5$, and then split up and down the vertical line $\mathrm{Re}(s) = -10.5$. Moving up that line adds oscillation but no extra speed of decay. That path is called a **root locus**, and the next module teaches you to sketch it without solving anything.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="345" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="320" y1="8" x2="320" y2="212" stroke="#6c7a93" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="260" y1="106" x2="260" y2="114"/><line x1="200" y1="106" x2="200" y2="114"/>
    <line x1="140" y1="106" x2="140" y2="114"/><line x1="80" y1="106" x2="80" y2="114"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="260" y="126">−5</text><text x="140" y="126">−15</text><text x="80" y="126">−20</text><text x="328" y="126">0</text>
  </g>
  <line x1="194" y1="14" x2="194" y2="206" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g stroke="#1f2a44" stroke-width="2.5">
    <line x1="303" y1="105" x2="313" y2="115"/><line x1="303" y1="115" x2="313" y2="105"/>
    <line x1="75" y1="105" x2="85" y2="115"/><line x1="75" y1="115" x2="85" y2="105"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="232.4" cy="110" r="4"/><circle cx="155.6" cy="110" r="4"/>
    <circle cx="194" cy="86.9" r="4"/><circle cx="194" cy="133.1" r="4"/>
    <circle cx="194" cy="71.3" r="4"/><circle cx="194" cy="148.7" r="4"/>
  </g>
  <g fill="#b4232c"><circle cx="194" cy="13.9" r="4"/><circle cx="194" cy="206.1" r="4"/></g>
  <g font-size="11" fill="#1f2a44">
    <text x="236" y="100">K = 0.2</text><text x="200" y="90">K = 0.5</text>
    <text x="200" y="72">K = 1</text><text x="200" y="18">K = 5</text>
  </g>
  <text x="202" y="182" font-size="11" fill="#1f2a44">stuck at Re(s) = −10.5</text>
  <text x="330" y="20" font-size="11" fill="#6c7a93">Im</text>
</svg>
```
:::

::: context black-amplifier Where the idea of feedback came from
In 1927 Harold Black, an engineer at Bell Labs, was trying to build amplifiers for long-distance telephone lines. The vacuum tubes of the day drifted and distorted, and those errors piled up across many amplifiers in a row.

His fix was to build an amplifier with far more gain than needed and then feed part of the output back, subtracted, to the input. The overall gain then depended almost entirely on the feedback parts, which could be made precise and stable, and hardly at all on the unreliable tubes. That is exactly the $1/(1 + L)$ factor in this section, used for its original purpose.
:::

::: context final-value The final value theorem, in one line
The final value theorem says that if a signal $x(t)$ settles to a constant, that constant is

$$
\lim_{t\to\infty}x(t) = \lim_{s\to0}sX(s).
$$

Small $s$ means slow behavior, and slow behavior is what is left at the end. The condition matters: the signal must actually settle. If the closed loop is unstable or oscillates forever, the formula still hands you a number, and that number is meaningless. So check stability first, then use the theorem.
:::

::: context integrator-bathtub Why an integrator keeps pushing
Think of a bathtub with the tap as the input and the water level as the output. The level is the integral of the flow: as long as any water runs in, the level keeps rising. It only holds still when the flow is exactly zero.

An integrator in a controller works the same way on the error. As long as any error remains, its output keeps changing — pushing harder and harder. The only way it can settle is for the error to reach exactly zero. That is why one integrator wipes out the steady error to a step.
:::

::: context type-zero-step A type 0 loop settles short
The step response of the closed loop $T = 20/(s^2 + 5s + 24)$, from the first Check yourself question, where $L = 20/((s+1)(s+4))$ has no integrator. It overshoots, rings, and settles at $20/24 = 0.833$ — short of the command by $1/(1 + K_p) = 1/6$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="345" y2="180" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="180" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="55" x2="340" y2="55" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="40" y1="75.8" x2="340" y2="75.8" stroke="#8fb8f0" stroke-width="1" stroke-dasharray="2 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,180.0 45,177.1 50,169.6 55,158.7 60,145.9 65,132.2 70,118.5 75,105.7 80,94.0 85,84.0 90,75.8 95,69.4 100,64.8 105,61.7 110,60.1 115,59.7 120,60.2 125,61.4 130,63.2 135,65.2 140,67.3 145,69.4 150,71.4 155,73.2 160,74.7 165,75.9 170,76.9 175,77.6 180,78.0 185,78.3 190,78.3 195,78.2 200,78.0 205,77.8 210,77.5 215,77.1 220,76.8 225,76.5 230,76.2 235,76.0 240,75.8 245,75.7 250,75.6 255,75.5 260,75.5 265,75.4 270,75.5 275,75.5 280,75.5 285,75.6 290,75.6 295,75.7 300,75.7 305,75.8 310,75.8 315,75.8 320,75.9 325,75.9 330,75.9 335,75.9 340,75.9"/>
  <line x1="300" y1="57" x2="300" y2="74" stroke="#b4232c" stroke-width="2"/>
  <text x="252" y="46" font-size="11" fill="#1f2a44">command = 1</text>
  <text x="222" y="98" font-size="11" fill="#1d6fd1">settles at 0.833</text>
  <text x="306" y="70" font-size="11" fill="#b4232c">0.167</text>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="40" y="196">0</text><text x="140" y="196">1</text><text x="240" y="196">2</text><text x="340" y="196">3 s</text>
  </g>
  <text x="34" y="59" font-size="11" fill="#6c7a93" text-anchor="end">1</text>
  <text x="34" y="184" font-size="11" fill="#6c7a93" text-anchor="end">0</text>
</svg>
```

Add an integrator to the controller and the dashed line becomes where it settles.
:::

::: context max-q Max q
The letter $q$ here stands for **dynamic pressure**, $\tfrac{1}{2}\rho v^2$ — how hard the air pushes on a moving vehicle ($\rho$ is air density, $v$ is speed). Right after launch the rocket is slow; high up the air is thin. In between, dynamic pressure peaks, usually around a minute into flight. That moment is "max q".

It is when aerodynamic loads, and the aerodynamic moment trying to turn a rocket sideways, are largest. For a rocket whose center of pressure sits ahead of its center of mass, that moment is destabilizing, which is the $\mu_\alpha$ term in the plant.
:::

::: context relaxed-stability Unstable on purpose
A dart is stable: its feathers keep it pointing forward. A fighter with **relaxed static stability** is built so that, left alone, it would tend to swing away from where it is pointed. That makes it far more agile, because it does not fight its own turns.

No pilot could fly it unaided; a computer adjusts the control surfaces many times a second. The F-16, which first flew in the 1970s, was the first production fighter designed this way, with fly-by-wire controls. A launch vehicle at max q is in the same situation, with the engine nozzle playing the role of the control surfaces.
:::

::: context saturation When the actuator runs out
Every actuator has limits: a nozzle can swing only so many degrees, a reaction wheel can make only so much torque. When the controller asks for more, the actuator gives its maximum and no more. That is **saturation**.

While saturated, extra error makes no extra correction, so the loop gain seen by large errors is smaller than the design value. On a stable vehicle that only slows things down. On an unstable one it can drop the effective gain below the minimum, and control is lost.
:::

::: context solar-pressure Sunlight pushes
Light carries momentum, so sunlight pushes on whatever it hits. Near Earth the push on a surface that absorbs all the light is about $4.5 \times 10^{-6}\,\mathrm{N}$ per square meter — the sun's power per square meter, about $1361\,\mathrm{W}$, divided by the speed of light. A mirror-like surface feels up to twice that.

If the center of that push does not line up with the spacecraft's center of mass — solar panels on one side, say — the push makes a torque. It is tiny but never stops, which is exactly the constant disturbance in the example. The example's $0.01\,\mathrm{N\,m}$ is a deliberately large value; many satellites see far less.
:::

::: context arcseconds How small an arcsecond is
A degree splits into $60$ arcminutes, and an arcminute into $60$ arcseconds, so one arcsecond is $1/3600$ of a degree. A coin about $2\,\mathrm{cm}$ across seen from $4\,\mathrm{km}$ away spans about one arcsecond.

The example's $6.9$ arcseconds would be excellent for pointing a communications antenna. The Hubble Space Telescope, by contrast, holds its pointing steady to about $0.007$ arcseconds while it takes an image.
:::

::: context windup Integrator windup
When the actuator is saturated, the error cannot shrink as fast as the controller expects. An integrator keeps adding up that error the whole time, building a huge stored value. When the error finally changes sign, the integrator's stored value is still pushing the old way, and it takes a long time to "unwind". The result is a large overshoot.

**Anti-windup** logic stops or limits the integration while the actuator is saturated. The next module designs it.
:::
