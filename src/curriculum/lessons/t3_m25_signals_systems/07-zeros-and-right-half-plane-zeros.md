---
id: l07-zeros-and-right-half-plane-zeros
title: Added zeros, non-minimum phase and right-half-plane zeros
minutes: 17
covers:
  - "Added zeros, non-minimum-phase zeros, and right-half-plane zeros"
---

Poles decide whether a response decays. Zeros decide what it looks like on the way, and one kind of zero decides how good a controller you are allowed to build at all.

That last claim is the point of this lesson. Almost everything else in classical control is a trade you can buy your way out of: more gain, a faster actuator, a better sensor, a cleverer compensator. A **right-half-plane zero** is not. It is a property of the plant and the measurement, it cannot be cancelled, it cannot be filtered away, and it puts a hard ceiling on closed-loop bandwidth that no controller structure evades. Recognising one early — from the physics, before any design — is worth more than any tuning skill.

The lesson starts with the general effect of adding a zero, using a decomposition that makes both the good case and the bad case obvious in one line. It then derives the initial undershoot that a right-half-plane zero forces, explains the name "non-minimum phase" through the all-pass factorisation, quantifies the bandwidth limit, and works a landing booster whose right-half-plane zero comes straight out of Newton's laws.

## Adding a zero is adding a derivative

Take any transfer function $G(s)$ with step response $y(t)$, and multiply it by a first-order zero factor:

$$
G_z(s) = \left(1 + \frac{s}{z}\right)G(s) \quad\Longrightarrow\quad y_z(t) = y(t) + \frac{1}{z}\dot{y}(t).
$$

Multiplication by $s$ is differentiation, so the new step response is the old one plus a scaled copy of its own slope. Everything about zeros follows from reading that line.

**A left-half-plane zero** (the factor $1 + s/z$ with $z > 0$) adds a *positive* multiple of the slope. During the rise the slope is large and positive, so the response is pushed up and forward: faster rise, earlier peak, more overshoot. The nearer the zero to the origin — the smaller $z$ — the larger the factor $1/z$ and the more violent the effect. A zero far to the left, $z$ large, changes almost nothing.

**A right-half-plane zero** (the factor $1 - s/z$ with $z > 0$) subtracts the slope. At $t = 0^+$ the original response is still near zero while its slope is at its largest, so the difference starts on the *wrong side of zero*. The response dips before it rises.

This is also why derivative action speeds a loop up and makes it overshoot: a PD controller $K_p + K_ds = K_p(1 + s\,K_d/K_p)$ is exactly a left-half-plane zero at $-K_p/K_d$ placed in the forward path.

::: example What a zero does to a second-order response
Start from $G_0(s) = 1/(s^2 + s + 1)$ — $\zeta = 0.5$, $\omega_n = 1\,\mathrm{rad/s}$, 16.3% overshoot, peak at $t_p = 3.63\,\mathrm{s}$, 10–90% rise time $1.64\,\mathrm{s}$ — and multiply by $(1 \pm s/z)$.

Left-half-plane zero:

| $z$ | 0.25 | 0.5 | 1 | 2 | 5 | 20 | none |
| --- | --- | --- | --- | --- | --- | --- | --- |
| overshoot | 171% | 70% | 29.8% | 19.1% | 16.7% | 16.3% | 16.3% |
| rise time (s) | 0.22 | 0.48 | 0.94 | 1.37 | 1.59 | 1.63 | 1.64 |

Right-half-plane zero:

| $z$ | 0.5 | 1 | 2 | 5 | 20 |
| --- | --- | --- | --- | --- | --- |
| undershoot | $-75.2\%$ | $-28.0\%$ | $-9.1\%$ | $-1.8\%$ | $-0.12\%$ |
| time of the dip (s) | 0.82 | 0.60 | 0.39 | 0.18 | 0.049 |
| first zero crossing (s) | 1.99 | 1.37 | 0.83 | 0.37 | 0.098 |

Read both tables against the pole pair's $\omega_n = 1\,\mathrm{rad/s}$. A zero of either sign beyond about $5\omega_n$ is a detail; a zero at $\omega_n$ or nearer changes the response completely. The left-half-plane zero at $z = 0.25$ turns a 16% overshoot into 171% while cutting the rise time by a factor of seven — that is what happens when derivative gain is pushed too far. The right-half-plane zero at $z = 0.5$ makes the output go 75% of the way to full scale *backwards* before it goes forwards, and it takes two seconds to get back to where it started.
:::

## Why a right-half-plane zero must undershoot

The table is suggestive; here is the proof. Let $G$ be stable with a real zero at $s = z > 0$ and $G(0) \ne 0$, and let $y(t)$ be its unit step response, so $Y(s) = G(s)/s$. Evaluate the transform at $s = z$:

$$
\int_0^\infty y(t)\,e^{-zt}\,dt = Y(z) = \frac{G(z)}{z} = 0.
$$

The weighting $e^{-zt}$ is strictly positive for all $t$, so an integral of $y$ against it can vanish only if $y$ takes both signs. Since the system is stable, $y$ ends at $G(0) \ne 0$ and keeps that sign eventually. Therefore it had the opposite sign earlier: the response **must** go the wrong way first. No choice of what precedes or follows the plant changes this, because $z$ is a zero of the plant.

The same integral bounds the *size* of the undershoot. The wrong-way area, weighted by $e^{-zt}$, must equal the right-way area weighted the same way. A slow loop spends a long time getting to its final value, so $e^{-zt}$ has decayed before the useful response arrives, and the early wrong-way excursion must be correspondingly large to balance it. Push for speed and the undershoot grows; that is the trade in one sentence.

::: key
Signature of a right-half-plane zero: initial **undershoot** in the step response, and phase **lag** rather than the phase lead a left-half-plane zero gives. It hard-limits achievable bandwidth (rule of thumb $\omega_c < z/2$) and cannot be cancelled.
:::

## Minimum phase, and the all-pass factorisation

Compare the two factors on the imaginary axis:

$$
\left\lvert 1 \pm \frac{j\omega}{z}\right\rvert = \sqrt{1 + \frac{\omega^2}{z^2}}, \qquad \angle\left(1 + \frac{j\omega}{z}\right) = +\arctan\frac{\omega}{z}, \qquad \angle\left(1 - \frac{j\omega}{z}\right) = -\arctan\frac{\omega}{z}.
$$

**Identical magnitude, opposite phase.** Both lift the magnitude curve by $+20\,\mathrm{dB}$ per decade above the corner $z$; one gives up to $+90^\circ$ of lead, the other up to $-90^\circ$ of lag.

A system whose poles and zeros all lie in the left half plane is called **minimum phase**: of all the systems sharing its magnitude curve, it has the least phase lag at every frequency. Any other system with the same magnitude differs from it by an **all-pass** factor. Split the right-half-plane zero this way:

$$
1 - \frac{s}{z} = \underbrace{\left(1 + \frac{s}{z}\right)}_{\text{minimum phase}}\ \underbrace{\frac{1 - s/z}{1 + s/z}}_{\text{all-pass}}, \qquad \left\lvert\frac{1 - j\omega/z}{1 + j\omega/z}\right\rvert = 1, \quad \angle = -2\arctan\frac{\omega}{z}.
$$

The all-pass factor changes no magnitude anywhere and takes phase away everywhere. That is the whole cost of a right-half-plane zero, stated as a number you can put on a Bode plot:

| $\omega/z$ | 0.1 | 0.25 | 0.5 | 1.0 | 2.0 |
| --- | --- | --- | --- | --- | --- |
| all-pass phase | $-11.4^\circ$ | $-28.1^\circ$ | $-53.1^\circ$ | $-90^\circ$ | $-126.9^\circ$ |

Now the bandwidth rule. Near gain crossover a typical loop already carries something like $-90^\circ$ to $-120^\circ$ of phase from the integrator and the plant, and you want $40^\circ$ to $60^\circ$ of phase margin left. Crossing over at $\omega_c = z/2$ hands $53^\circ$ of that budget to the all-pass factor and there is nothing left; crossing over at $z/4$ costs $28^\circ$, which is survivable with care. Hence the rule of thumb $\omega_c < z/2$, with $z/3$ to $z/4$ being where sober designs actually live.

An unstable pole imposes the mirror-image limit — it forces crossover *above* roughly twice the pole — which is why a plant with an unstable pole at $p$ and a right-half-plane zero at $z$ with $z$ not comfortably larger than $p$ is not controllable to any useful standard. That inequality is one of the few genuinely fundamental results in the subject.

::: warning
Do not try to cancel a right-half-plane zero with a controller pole at the same place. A pole at $s = +z$ in the controller means the controller itself is unstable; the moment any real signal excites it — a disturbance, an initialisation transient, a rounding difference between the true $z$ and the modelled one — its internal state grows as $e^{zt}$ until the actuator saturates. The closed-loop transfer function from command to output will look clean on paper and the hardware will diverge. The same prohibition applies to cancelling an unstable *pole* with a controller zero, for the mirror-image reason.
:::

::: example A landing booster's lateral translation
A returning first stage hovers under its own thrust: mass $m = 3.0\times10^4\,\mathrm{kg}$, pitch inertia $I = 2.0\times10^6\,\mathrm{kg\,m^2}$, engine gimbal $l = 15\,\mathrm{m}$ below the centre of mass, thrust $T = mg_0 = 2.942\times10^5\,\mathrm{N}$ to hold altitude. Let $\theta$ be the tilt angle, $y$ the lateral position and $\delta$ the gimbal angle, all small.

Two equations. The thrust vector points along the body axis rotated by the gimbal, so its lateral component is $T(\theta + \delta)$ and

$$
m\ddot{y} = T\left(\theta + \delta\right).
$$

The gimbal force acts $l$ below the centre of mass, so it produces a moment $Tl\,\delta$ and

$$
I\ddot{\theta} = -Tl\,\delta.
$$

Transform both at rest: $\Theta = -\dfrac{Tl}{I}\dfrac{\Delta}{s^2}$, and substituting,

$$
\frac{Y(s)}{\Delta(s)} = \frac{T}{m}\,\frac{1 - \dfrac{Tl}{I s^2}}{s^2} = \frac{T}{m}\cdot\frac{s^2 - Tl/I}{s^4}.
$$

Choose the sign of the gimbal command so that a positive command eventually moves the vehicle in $+y$, which flips the overall sign and puts the numerator in standard form:

$$
\frac{Y}{\Delta} = \frac{T}{m}\,\frac{z^2}{s^4}\left(1 - \frac{s}{z}\right)\left(1 + \frac{s}{z}\right), \qquad z = \sqrt{\frac{Tl}{I}} = \sqrt{\frac{2.942\times10^5 \times 15}{2.0\times10^6}} = 1.485\,\mathrm{rad/s}.
$$

There it is: a right-half-plane zero at $+1.485\,\mathrm{rad/s}$, produced by nothing more exotic than the engine being below the centre of mass. The physics is transparent. Gimbal the engine and the side force at the base immediately pushes the vehicle one way; the same force also tilts the vehicle the other way; once tilted, the full thrust — much larger than its lateral component — pushes the vehicle in the opposite direction and wins. Wrong way first, right way afterwards.

Quantitatively, the step response to a $1^\circ$ gimbal is $y(t) = \dfrac{T}{m}\delta\left(\dfrac{z^2t^4}{24} - \dfrac{t^2}{2}\right)$. The initial lateral acceleration is $(T/m)\delta = g_0\delta = 0.171\,\mathrm{m/s^2}$ in the wrong direction. The excursion peaks at $t = \sqrt{6}/z = 1.65\,\mathrm{s}$, at $-0.116\,\mathrm{m}$, and the vehicle does not get back to where it started until $t = \sqrt{12}/z = 2.33\,\mathrm{s}$.

Design consequence: a translational guidance loop on this vehicle must cross over below $z/2 = 0.74\,\mathrm{rad/s}$, so it cannot correct a lateral position error faster than about a $1.3\,\mathrm{s}$ time constant, however good the sensors are. The attitude loop underneath it is not limited this way — it sees no right-half-plane zero — which is exactly why landing control is built as a fast inner attitude loop inside a slow outer translation loop. Making $z$ larger, which would relax the limit, means increasing $Tl/I$: a longer moment arm or a smaller inertia. That is a vehicle-layout decision, not a control decision.
:::

::: note
Other right-half-plane zeros you will meet. An aircraft's altitude response to elevator: commanding nose-up puts a download on the tail, so the aeroplane sinks before it climbs. A flexible arm or boom sensed beyond a node: lesson 4 showed that a collocated sensor interlaces poles and zeros, and moving the sensor past the node breaks the interlacing and can throw zeros into the right half plane. A launch vehicle's lateral acceleration measured forward of the instantaneous centre of rotation, the "tail-wags-dog" effect. In every case the signature is the same — the measurement moves away from where you sent it before it moves towards it — and in every case the cure is to change the measurement or the layout, not the controller.
:::

## Check yourself

::: check
An aircraft's altitude response to elevator has a right-half-plane zero at $0.8\,\mathrm{rad/s}$. A colleague proposes an altitude-hold loop crossing over at $1.0\,\mathrm{rad/s}$ and says the initial sink can be tuned out with more derivative gain. Assess both claims with numbers.
:::

::: answer
The crossover claim fails on phase. At $\omega_c = 1.0\,\mathrm{rad/s}$ the ratio $\omega_c/z = 1.25$, so the all-pass factor alone contributes $-2\arctan(1.25) = -102.7^\circ$. Added to the $-90^\circ$ or more that the altitude integration and the airframe already supply, the phase is past $-180^\circ$ before any controller phase is counted, and no lead network recovers that much. The working limit is $\omega_c < z/2 = 0.4\,\mathrm{rad/s}$, and a sober design would sit nearer $0.2$–$0.3\,\mathrm{rad/s}$.

The tuning claim fails on principle. The right-half-plane zero of the plant is also a zero of the closed loop from command to altitude, so $\int_0^\infty y(t)e^{-0.8t}dt = 0$ for the closed-loop step response whatever the controller does, and $y$ must therefore change sign. Derivative gain changes the shape and the timing of the dip, not its existence — and by speeding the loop up it makes the dip deeper, because the positive area arrives earlier, while $e^{-0.8t}$ is still large, and must be balanced by more negative area.
:::

::: check
A PD controller $K_p + K_ds$ with $K_p = 4$, $K_d = 8$ drives a plant whose closed-loop poles end up at $-1 \pm 1.73j$. Where is the zero, and what does it do to the overshoot?
:::

::: answer
Write the controller as $K_p(1 + sK_d/K_p) = 4(1 + s/0.5)$: a left-half-plane zero at $z = 0.5\,\mathrm{rad/s}$. The closed-loop poles have $\omega_n = \sqrt{1 + 3} = 2\,\mathrm{rad/s}$ and $\zeta = 0.5$, which alone would give 16.3% overshoot. But the zero sits at a quarter of $\omega_n$, so $1/z = 2\,\mathrm{s}$ multiplies the derivative term and the overshoot climbs steeply — the pattern of the first table, where a zero at $\omega_n/4$ took 16% to 171%. Lesson: quoting $\zeta$ from the closed-loop poles of a PD loop and predicting overshoot from it will understate the overshoot badly, because the controller's own zero appears in the closed-loop numerator. Either include the zero in the prediction or use a two-degree-of-freedom structure that keeps it out of the command path.
:::

::: check
Two plants have exactly the same Bode magnitude curve: $G_1(s) = \dfrac{1 + s/3}{(1 + s)(1 + s/10)}$ and $G_2(s) = \dfrac{1 - s/3}{(1 + s)(1 + s/10)}$. How much phase separates them at $1\,\mathrm{rad/s}$ and at $3\,\mathrm{rad/s}$, and which is minimum phase?
:::

::: answer
They differ by the all-pass factor $(1 - s/3)/(1 + s/3)$, whose magnitude is 1 everywhere and whose phase is $-2\arctan(\omega/3)$. At $\omega = 1$: $-2\arctan(1/3) = -36.9^\circ$. At $\omega = 3$: $-2\arctan(1) = -90^\circ$. $G_1$ has all its zeros and poles in the left half plane, so it is the minimum-phase one; $G_2$ carries $37^\circ$ and $90^\circ$ more lag at those frequencies for no magnitude benefit at all. If both were candidate models fitted to the same measured magnitude data, only a phase measurement could tell them apart — which is why frequency-response identification always measures phase.
:::

::: check
For the landing booster, the mass at touchdown falls to $2.4\times10^4\,\mathrm{kg}$ and the inertia to $1.6\times10^6\,\mathrm{kg\,m^2}$, with the gimbal arm unchanged and the thrust still equal to the weight. What happens to the right-half-plane zero and to the achievable translation bandwidth?
:::

::: answer
Thrust is $T = mg_0 = 2.4\times10^4 \times 9.80665 = 2.354\times10^5\,\mathrm{N}$, so

$$
z = \sqrt{\frac{Tl}{I}} = \sqrt{\frac{2.354\times10^5 \times 15}{1.6\times10^6}} = \sqrt{2.207} = 1.486\,\mathrm{rad/s},
$$

essentially unchanged. That is not an accident: at hover $T = mg_0$, so $z^2 = mg_0l/I$, and if mass and inertia fall in the same proportion the zero does not move. The achievable bandwidth is therefore still about $0.74\,\mathrm{rad/s}$, and a guidance law tuned at the start of the landing burn does not need rescheduling on this account. What *does* change with mass is the gain $T/m = g_0$, which is constant at hover, and the attitude authority $Tl/I$, which is $z^2$ again. The layout, not the propellant state, sets the limit.
:::

::: check
Why does making a loop faster make the undershoot from a right-half-plane zero worse, and what does that say about trading speed against overshoot?
:::

::: answer
The constraint is $\int_0^\infty y(t)e^{-zt}dt = 0$ for the closed-loop step response, since the right-half-plane zero of the plant is still a zero of the closed loop from reference to output. The positive and negative areas must balance under the weight $e^{-zt}$, which has a time scale of $1/z$ fixed by the plant. A fast loop delivers most of its useful (positive) response early, while $e^{-zt}$ is still near 1, so that part of the integral is large and the negative part must be large to match — deep undershoot. A slow loop delivers its positive response mostly after the weight has decayed, so a small early dip suffices. Speed and undershoot are therefore traded against each other on a fixed exchange rate set by $z$, and no controller changes the rate. What a controller *can* do is decide where on that line to sit.
:::

## Summary

| Item | Statement |
| --- | --- |
| Adding a zero | $\left(1 + s/z\right)G(s) \Rightarrow y_z = y + \dot{y}/z$; a zero adds a scaled derivative |
| Left-half-plane zero | faster rise, earlier peak, more overshoot; phase lead $+\arctan(\omega/z)$ |
| Right-half-plane zero | initial undershoot; phase lag $-\arctan(\omega/z)$; same magnitude as its mirror |
| Undershoot proof | $\int_0^\infty y\,e^{-zt}dt = G(z)/z = 0 \Rightarrow y$ changes sign |
| Minimum phase | all poles and zeros in the left half plane; least phase lag for a given magnitude |
| All-pass factor | $\dfrac{1 - s/z}{1 + s/z}$, magnitude 1, phase $-2\arctan(\omega/z)$ |
| Phase cost | $-28^\circ$ at $\omega = z/4$, $-53^\circ$ at $z/2$, $-90^\circ$ at $z$ |
| Bandwidth limit | $\omega_c < z/2$ as a rule of thumb; $z/3$ to $z/4$ in practice |
| Never cancel | a controller pole at $+z$ is an unstable controller; likewise a zero on an unstable plant pole |
| Thrust-vectored translation | $z = \sqrt{Tl/I}$ from gimbal to lateral position; a layout property |

Phase lag with no magnitude change is also what a pure time delay does, and the next lesson shows that the resemblance is not a coincidence: the standard rational approximation of a delay is built out of a right-half-plane zero.
