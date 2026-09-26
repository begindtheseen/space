---
id: l07-zeros-and-right-half-plane-zeros
title: Added zeros, non-minimum phase and right-half-plane zeros
minutes: 21
covers:
  - "Added zeros, non-minimum-phase zeros, and right-half-plane zeros"
---

Back a car out of a parking space and turn the wheel hard. The front of the car does something strange: it swings *out*, the wrong way, before the whole car follows the turn. Some machines do this every time you ask them to move. They start in the wrong direction, then come back and go where you sent them.

In the last few lessons, the poles of a transfer function told you whether a response dies away and how fast. This lesson is about the other half of the pole-zero map, the zeros. Poles decide *whether* a response settles. Zeros decide what it *looks like* on the way there. And one kind of zero, the kind that makes a machine start the wrong way, decides how good a controller you are allowed to build at all.

That last claim is the point of the lesson. Almost every other problem in classical control can be bought off: more gain, a faster actuator, a better sensor, a cleverer controller. A **[[right-half-plane zero|half-planes]]** — a zero of the transfer function at a positive value of $s$ — cannot. It belongs to the plant and to where you measure it. It cannot be cancelled. It cannot be filtered away. It puts a hard ceiling on how fast any closed loop around that plant can be. Spotting one early, from the physics and before any design starts, is worth more than any tuning skill.

Here is the path. First, what adding any zero does, using one line of algebra that explains both the good case and the bad case. Then the proof that a right-half-plane zero *must* make the response start the wrong way. Then where the name "non-minimum phase" comes from, how much bandwidth the zero costs, and finally a landing booster whose right-half-plane zero falls straight out of Newton's laws.

## Adding a zero is adding a derivative

Take any transfer function $G(s)$. Call its step response $y(t)$ — what the output does when the input jumps from $0$ to $1$ and stays there. Now multiply $G$ by a **zero factor** $1 + s/z$, where $z$ is a positive number. The factor is zero at $s = -z$, so this puts a zero at $-z$, in the left half of the $s$-plane.

$$
G_z(s) = \left(1 + \frac{s}{z}\right)G(s) \quad\Longrightarrow\quad y_z(t) = y(t) + \frac{1}{z}\dot{y}(t).
$$

Read $\dot{y}$ as "y dot": the slope of $y$, how fast it is changing. The rule behind this line is from lesson 3: **[[multiplying by $s$ is differentiating|s-is-derivative]]**. So the new step response is the old one *plus a scaled copy of its own slope*. Everything in this section follows from that one sentence.

**A left-half-plane zero** — the factor $1 + s/z$, zero at $-z$ — adds a *positive* amount of the slope. While the response is rising, its slope is big and positive, so the new response is pushed up and ahead. You get a faster rise, an earlier peak and more overshoot. The size of the push is $1/z$. A zero near the origin (small $z$) pushes hard. A zero far to the left (large $z$) barely changes anything.

**A right-half-plane zero** — the factor $1 - s/z$, zero at $+z$ — *subtracts* the slope. Think about the first instant after the step, $t = 0^+$ ("t equals zero plus", the moment right after zero). The old response has hardly moved yet, but its slope is already at its biggest. So old response minus slope starts on the *wrong side of zero*. The output dips before it rises.

This also explains derivative control. A **[[PD controller|pd-controller]]** — "proportional plus derivative", a controller that pushes in proportion to the error and to its rate of change — is $K_p + K_ds$. Factor out $K_p$ and it is $K_p(1 + s\,K_d/K_p)$: a left-half-plane zero at $-K_p/K_d$ sitting in the forward path. That is why derivative action speeds a loop up and also makes it overshoot.

::: example What a zero does to a second-order response
Start from $G_0(s) = 1/(s^2 + s + 1)$. From lesson 5, that is $\zeta = 0.5$ and $\omega_n = 1\,\mathrm{rad/s}$, so its step response overshoots by 16.3%, peaks at $t_p = 3.63\,\mathrm{s}$ and has a 10–90% rise time of $1.64\,\mathrm{s}$. Now multiply it by $(1 + s/z)$ or $(1 - s/z)$ for a range of $z$, and measure the step response each time.

With a left-half-plane zero:

| $z$ | 0.25 | 0.5 | 1 | 2 | 5 | 20 | none |
| --- | --- | --- | --- | --- | --- | --- | --- |
| overshoot | 171% | 70% | 29.8% | 19.1% | 16.7% | 16.3% | 16.3% |
| rise time (s) | 0.22 | 0.48 | 0.94 | 1.37 | 1.59 | 1.63 | 1.64 |

With a right-half-plane zero:

| $z$ | 0.5 | 1 | 2 | 5 | 20 |
| --- | --- | --- | --- | --- | --- |
| undershoot | $-75.2\%$ | $-28.0\%$ | $-9.1\%$ | $-1.8\%$ | $-0.12\%$ |
| time of the dip (s) | 0.82 | 0.60 | 0.39 | 0.18 | 0.049 |
| first zero crossing (s) | 1.99 | 1.37 | 0.83 | 0.37 | 0.098 |

Step 1: compare each $z$ with the poles' $\omega_n = 1\,\mathrm{rad/s}$. A zero of either sign beyond about $5\omega_n$ is a small detail: at $z = 5$ the overshoot moves only from 16.3% to 16.7%.

Step 2: look at zeros near $\omega_n$ or closer. They change the response completely. The left-half-plane zero at $z = 0.25$ turns 16% overshoot into 171% and cuts the rise time by a factor of seven. That is what happens when derivative gain is pushed too far.

Step 3: look at the right-half-plane zero at $z = 0.5$. The output travels 75% of the full step *backwards* before it turns around, and it needs about two seconds to get back to zero.

Sanity check: as $z$ grows, both tables head toward the "none" column. A zero far away should matter less, and it does.
:::

## Why a right-half-plane zero must undershoot

The table suggests the wrong-way start always happens. Here is the plain reason it cannot be avoided.

Imagine weighing the whole step response on a special scale. Early moments count almost fully. Later moments count less and less, fading away like $e^{-zt}$. A right-half-plane zero at $z$ forces this weighted total to come out at exactly zero. But the response ends up on the positive side (it settles at its final value). If everything it ever did were positive, the total could not be zero. So some early part of it must be negative, big enough to cancel the rest. The response **[[must go the wrong way first|undershoot-picture]]**.

::: note Why it has to be true
Let $G$ be stable, with a real zero at $s = z > 0$ and a nonzero DC gain $G(0) \ne 0$. Let $y(t)$ be its unit step response. From lesson 3, the transform of that response is $Y(s) = G(s)/s$.

Step 1: the Laplace transform is defined by an integral, so evaluating it at the particular value $s = z$ gives

$$
\int_0^\infty y(t)\,e^{-zt}\,dt = Y(z) = \frac{G(z)}{z} = 0,
$$

where the last step uses $G(z) = 0$, because $z$ is a zero of $G$. (The integral converges because $G$ is stable, so $y$ stays bounded, and $z > 0$.)

Step 2: the weight $e^{-zt}$ is positive for every $t$. An integral of $y$ against a positive weight can equal zero only if $y$ takes both signs.

Step 3: the system is stable, so $y$ ends at $G(0) \ne 0$ and keeps that sign from some time on. Therefore it must have had the *opposite* sign earlier. It went the wrong way first.

Nothing you put before or after the plant changes this, because $z$ stays a zero of whatever loop the plant sits in.
:::

The same weighted total also tells you *how big* the dip must be. The wrong-way area, weighted by $e^{-zt}$, must equal the right-way area weighted the same way. The weight fades on a time scale of $1/z$, which the plant fixes. A fast response puts a lot of right-way area early, while the weight is still near $1$. To balance it, the wrong-way dip must be large. So pushing for speed makes the undershoot deeper. That is the whole trade in one sentence.

::: key
Signature of a right-half-plane zero: initial **undershoot** in the step response, and phase **lag** rather than the phase lead a left-half-plane zero gives. It hard-limits achievable bandwidth (rule of thumb $\omega_c < z/2$) and cannot be cancelled.
:::

## Minimum phase, and the all-pass factorization

Now look at the two kinds of zero in the frequency domain, the way lesson 9 will draw them. Put $s = j\omega$, a pure oscillation at frequency $\omega$. The two factors have

$$
\left\lvert 1 \pm \frac{j\omega}{z}\right\rvert = \sqrt{1 + \frac{\omega^2}{z^2}}, \qquad \angle\left(1 + \frac{j\omega}{z}\right) = +\arctan\frac{\omega}{z}, \qquad \angle\left(1 - \frac{j\omega}{z}\right) = -\arctan\frac{\omega}{z}.
$$

The bars $\lvert\cdot\rvert$ mean the size (magnitude) of the complex number, and $\angle$ ("angle of") means its phase. Read the results in plain words: **same size, opposite phase**. Both factors raise the magnitude by $20\,\mathrm{dB}$ per decade above the corner frequency $z$. But the left-half-plane zero gives up to $+90^\circ$ of **phase lead** (the output runs ahead), while the right-half-plane zero gives up to $-90^\circ$ of **phase lag** (the output runs behind).

A system whose poles and zeros all lie in the left half-plane is called **[[minimum phase|minimum-phase-name]]**. Of all the systems with the same magnitude curve, it has the least phase lag at every frequency. Any other system with that magnitude curve equals it times an **all-pass** factor — a factor whose magnitude is exactly $1$ at every frequency, so it lets every frequency pass at full size and only shifts phase. Here is the right-half-plane zero split that way:

$$
1 - \frac{s}{z} = \underbrace{\left(1 + \frac{s}{z}\right)}_{\text{minimum phase}}\ \underbrace{\frac{1 - s/z}{1 + s/z}}_{\text{all-pass}}, \qquad \left\lvert\frac{1 - j\omega/z}{1 + j\omega/z}\right\rvert = 1, \quad \angle = -2\arctan\frac{\omega}{z}.
$$

The all-pass factor changes no magnitude anywhere and takes away phase everywhere. That is the entire cost of a right-half-plane zero, written as a number you can put on a Bode plot:

| $\omega/z$ | 0.1 | 0.25 | 0.5 | 1.0 | 2.0 |
| --- | --- | --- | --- | --- | --- |
| all-pass phase | $-11.4^\circ$ | $-28.1^\circ$ | $-53.1^\circ$ | $-90^\circ$ | $-126.9^\circ$ |

Now the bandwidth rule. The **gain crossover frequency** $\omega_c$ (read "omega sub c") is where the loop's gain falls to $1$; roughly, it is how fast the loop can respond. Near crossover, a typical loop already carries about $-90^\circ$ to $-120^\circ$ of phase from its integrator and the plant. You also want $40^\circ$ to $60^\circ$ of **phase margin** left over — distance from the $-180^\circ$ that means instability. Cross over at $\omega_c = z/2$ and the all-pass factor takes $53^\circ$ of that budget, leaving nothing. Cross over at $z/4$ and it costs $28^\circ$, which you can survive with care. Hence the rule of thumb $\omega_c < z/2$, with careful designs living at $z/3$ to $z/4$.

An unstable pole sets the mirror-image limit. It forces crossover *above* roughly twice the pole, because the loop must act faster than the instability grows. So a plant with an unstable pole at $p$ and a right-half-plane zero at $z$ is squeezed from both sides. If $z$ is not comfortably larger than $p$, no controller can do a useful job. That inequality is one of the few truly **[[fundamental limits|fundamental-limits]]** in the subject.

::: warning
Do not try to cancel a right-half-plane zero with a controller pole at the same place. A pole at $s = +z$ in the controller means the controller itself is unstable. The moment any real signal excites it — a disturbance, a start-up transient, the tiny difference between the true $z$ and the modeled one — its internal state grows like $e^{zt}$ until the actuator saturates. The transfer function from command to output looks clean on paper, and the hardware diverges. The same ban applies to cancelling an unstable *pole* of the plant with a controller zero, for the mirror-image reason.
:::

## A landing booster that starts the wrong way

Right-half-plane zeros are not exotic. You get one whenever you push a vehicle from a point that is not where you are measuring it. A rocket balancing on its engine is the cleanest example.

::: example A landing booster's lateral translation
A returning first stage hovers on its own thrust. Its mass is $m = 3.0\times10^4\,\mathrm{kg}$ and its pitch inertia (how hard it is to rotate) is $I = 2.0\times10^6\,\mathrm{kg\,m^2}$. The engine **[[gimbal|gimbal-word]]** — the pivot that lets the engine swing — sits $l = 15\,\mathrm{m}$ below the center of mass. To hold altitude, the thrust equals the weight: $T = mg_0 = 3.0\times10^4 \times 9.80665 = 2.942\times10^5\,\mathrm{N}$. Let $\theta$ be the tilt angle, $y$ the sideways position and $\delta$ the gimbal angle, all small.

Step 1: the sideways force. The thrust points along the body axis, turned by the gimbal angle, so its sideways part is $T(\theta + \delta)$ (small angles, so $\sin x \approx x$):

$$
m\ddot{y} = T\left(\theta + \delta\right).
$$

Step 2: the turning. The gimbal's side force $T\delta$ acts $l$ below the center of mass, so it makes a moment $Tl\,\delta$ that tilts the vehicle the other way:

$$
I\ddot{\theta} = -Tl\,\delta.
$$

Step 3: transform both, starting at rest. The second gives $\Theta = -\dfrac{Tl}{I}\dfrac{\Delta}{s^2}$. Put that into the first:

$$
\frac{Y(s)}{\Delta(s)} = \frac{T}{m}\,\frac{1 - \dfrac{Tl}{I s^2}}{s^2} = \frac{T}{m}\cdot\frac{s^2 - Tl/I}{s^4}.
$$

Step 4: choose the sign of the gimbal command so that a positive command eventually moves the vehicle toward $+y$. That flips the overall sign and puts the numerator in standard form:

$$
\frac{Y}{\Delta} = \frac{T}{m}\,\frac{z^2}{s^4}\left(1 - \frac{s}{z}\right)\left(1 + \frac{s}{z}\right), \qquad z = \sqrt{\frac{Tl}{I}} = \sqrt{\frac{2.942\times10^5 \times 15}{2.0\times10^6}} = 1.485\,\mathrm{rad/s}.
$$

There it is: a right-half-plane zero at $+1.485\,\mathrm{rad/s}$, made by nothing more exotic than the engine sitting below the center of mass.

The physics is easy to see. Swing the engine, and its side force at the base [[immediately shoves the vehicle one way|booster-picture]]. The same side force also tilts the vehicle. Once it is tilted, the full thrust — far larger than its small sideways part — pushes the vehicle the *other* way, and wins. Wrong way first, right way after.

Step 5: put numbers on it. The step response to a $1^\circ$ gimbal command ($\delta = 0.01745\,\mathrm{rad}$) is

$$
y(t) = \frac{T}{m}\delta\left(\frac{z^2t^4}{24} - \frac{t^2}{2}\right).
$$

The first sideways acceleration is $(T/m)\delta = g_0\delta = 9.80665 \times 0.01745 = 0.171\,\mathrm{m/s^2}$, in the wrong direction. The wrong-way drift is largest at $t = \sqrt{6}/z = 1.65\,\mathrm{s}$, where $y = -0.116\,\mathrm{m}$. The vehicle does not get back to where it started until $t = \sqrt{12}/z = 2.33\,\mathrm{s}$. Sanity check: $2.33\,\mathrm{s}$ is later than $1.65\,\mathrm{s}$, as it must be — first the dip, then the return.

Step 6: the design consequence. A sideways-position guidance loop on this vehicle must cross over below $z/2 = 0.74\,\mathrm{rad/s}$. So it cannot correct a sideways error faster than about a $1/0.74 = 1.3\,\mathrm{s}$ time constant, however good the sensors are. The attitude loop underneath has no right-half-plane zero and no such limit. That is exactly why landing control is built as a fast inner attitude loop inside a slow outer position loop. Making $z$ larger would relax the limit, and that means raising $Tl/I$: a longer moment arm or a smaller inertia. That is a decision about the vehicle's layout, not about the controller.
:::

::: note Other right-half-plane zeros you will meet
An aircraft's altitude response to its elevator. Commanding nose-up first pushes the tail down, so the airplane [[sinks before it climbs|aircraft-sink]].

A flexible arm or boom measured beyond a node. Lesson 4 showed that a collocated sensor (one at the same place as the actuator) gives poles and zeros that interlace. Move the sensor past a node and the interlacing breaks, and zeros can land in the right half-plane.

A launch vehicle's sideways acceleration measured by an accelerometer placed [[between the engine and a special point up the body|center-of-percussion]]. Mounted farther forward, the same sensor sees no right-half-plane zero.

In every case the signature is the same: the measurement moves away from where you sent it before it moves toward it. And in every case the cure is to change the measurement or the layout, not the controller.
:::

## Check yourself

::: check
An aircraft's altitude response to elevator has a right-half-plane zero at $0.8\,\mathrm{rad/s}$. A colleague proposes an altitude-hold loop crossing over at $1.0\,\mathrm{rad/s}$ and says the initial sink can be tuned out with more derivative gain. Assess both claims with numbers.
:::

::: answer
The crossover claim fails on phase. At $\omega_c = 1.0\,\mathrm{rad/s}$ the ratio is $\omega_c/z = 1.0/0.8 = 1.25$. The all-pass factor alone then contributes $-2\arctan(1.25) = -102.7^\circ$. Add the $-90^\circ$ or more that the altitude integration and the airframe already supply, and the phase is past $-180^\circ$ before any controller phase is counted. No lead network recovers that much. The working limit is $\omega_c < z/2 = 0.4\,\mathrm{rad/s}$, and a careful design would sit nearer $0.2$ to $0.3\,\mathrm{rad/s}$.

The tuning claim fails on principle. The plant's right-half-plane zero is also a zero of the closed loop from command to altitude. So $\int_0^\infty y(t)e^{-0.8t}dt = 0$ for the closed-loop step response, whatever the controller does, and $y$ must change sign. Derivative gain changes the shape and timing of the dip, not whether it happens. Worse, by speeding the loop up it makes the dip *deeper*: the positive area arrives earlier, while $e^{-0.8t}$ is still large, and must be balanced by more negative area.
:::

::: check
A PD controller $K_p + K_ds$ with $K_p = 4$, $K_d = 8$ drives a plant whose closed-loop poles end up at $-1 \pm 1.73j$. Where is the zero, and what does it do to the overshoot?
:::

::: answer
Factor the controller: $K_p(1 + sK_d/K_p) = 4(1 + s/0.5)$. That is a left-half-plane zero at $z = 0.5\,\mathrm{rad/s}$, that is at $s = -0.5$.

The closed-loop poles have $\omega_n = \sqrt{1^2 + 1.73^2} = \sqrt{1 + 3} = 2\,\mathrm{rad/s}$ and $\zeta = 1/2 = 0.5$. On their own they would give 16.3% overshoot. But the zero sits at a quarter of $\omega_n$, so the slope term is multiplied by a large $1/z = 2\,\mathrm{s}$, and the overshoot climbs steeply. Compare the first table: a zero at $\omega_n/4$ took 16% to 171%.

The lesson: if you read $\zeta$ from the closed-loop poles of a PD loop and predict overshoot from it, you will badly understate the overshoot, because the controller's own zero appears in the closed-loop numerator. Either include the zero in the prediction, or use a two-degree-of-freedom structure that keeps it out of the command path.
:::

::: check
Two plants have exactly the same Bode magnitude curve: $G_1(s) = \dfrac{1 + s/3}{(1 + s)(1 + s/10)}$ and $G_2(s) = \dfrac{1 - s/3}{(1 + s)(1 + s/10)}$. How much phase separates them at $1\,\mathrm{rad/s}$ and at $3\,\mathrm{rad/s}$, and which is minimum phase?
:::

::: answer
They differ by the all-pass factor $(1 - s/3)/(1 + s/3)$. Its magnitude is $1$ everywhere and its phase is $-2\arctan(\omega/3)$.

At $\omega = 1$: $-2\arctan(1/3) = -36.9^\circ$. At $\omega = 3$: $-2\arctan(1) = -90^\circ$.

$G_1$ has all its zeros and poles in the left half-plane, so it is the minimum-phase one. $G_2$ carries $37^\circ$ and $90^\circ$ more lag at those frequencies, for no magnitude benefit at all. If both were candidate models fitted to the same measured magnitude data, only a phase measurement could tell them apart. That is why frequency-response testing always measures phase.
:::

::: check
For the landing booster, the mass at touchdown falls to $2.4\times10^4\,\mathrm{kg}$ and the inertia to $1.6\times10^6\,\mathrm{kg\,m^2}$, with the gimbal arm unchanged and the thrust still equal to the weight. What happens to the right-half-plane zero and to the achievable translation bandwidth?
:::

::: answer
The thrust is $T = mg_0 = 2.4\times10^4 \times 9.80665 = 2.354\times10^5\,\mathrm{N}$. So

$$
z = \sqrt{\frac{Tl}{I}} = \sqrt{\frac{2.354\times10^5 \times 15}{1.6\times10^6}} = \sqrt{2.207} = 1.485\,\mathrm{rad/s},
$$

the same as before. That is no accident. At hover $T = mg_0$, so $z^2 = mg_0l/I$. If mass and inertia fall in the same proportion — here both by 20% — the zero does not move. The achievable bandwidth is still about $0.74\,\mathrm{rad/s}$, so a guidance law tuned at the start of the landing burn does not need re-tuning on this account.

Two other quantities are worth checking too. The gain $T/m$ equals $g_0$ at hover, so it does not change with mass either. The attitude authority $Tl/I$ is $z^2$ again, also unchanged. The layout, not how much propellant is left, sets the limit.
:::

::: check
Why does making a loop faster make the undershoot from a right-half-plane zero worse, and what does that say about trading speed against overshoot?
:::

::: answer
The plant's right-half-plane zero is still a zero of the closed loop from reference to output, so the closed-loop step response obeys $\int_0^\infty y(t)e^{-zt}dt = 0$. The positive and negative areas must balance under the weight $e^{-zt}$, whose time scale $1/z$ is fixed by the plant.

A fast loop delivers most of its useful, positive response early, while $e^{-zt}$ is still near $1$. That part of the integral is large, so the negative part must be large to match: a deep undershoot. A slow loop delivers its positive response mostly after the weight has faded, so a small early dip is enough.

So speed and undershoot trade against each other at a fixed exchange rate set by $z$, and no controller changes the rate. What a controller *can* do is choose where on that line to sit.
:::

## Summary

| Item | Statement |
| --- | --- |
| Adding a zero | $\left(1 + s/z\right)G(s) \Rightarrow y_z = y + \dot{y}/z$; a zero adds a scaled derivative |
| Left-half-plane zero | faster rise, earlier peak, more overshoot; phase lead $+\arctan(\omega/z)$ |
| Right-half-plane zero | initial undershoot; phase lag $-\arctan(\omega/z)$; same magnitude as its mirror |
| Undershoot proof | $\int_0^\infty y\,e^{-zt}dt = G(z)/z = 0 \Rightarrow y$ changes sign |
| Minimum phase | all poles and zeros in the left half-plane; least phase lag for a given magnitude |
| All-pass factor | $\dfrac{1 - s/z}{1 + s/z}$, magnitude 1, phase $-2\arctan(\omega/z)$ |
| Phase cost | $-28^\circ$ at $\omega = z/4$, $-53^\circ$ at $z/2$, $-90^\circ$ at $z$ |
| Bandwidth limit | $\omega_c < z/2$ as a rule of thumb; $z/3$ to $z/4$ in practice |
| Never cancel | a controller pole at $+z$ is an unstable controller; likewise a zero on an unstable plant pole |
| Thrust-vectored translation | $z = \sqrt{Tl/I}$ from gimbal to sideways position; a layout property |

Phase lag with no change in magnitude is also exactly what a pure time delay does. The next lesson shows that the resemblance is no coincidence: the standard way to approximate a delay with a ratio of polynomials is built out of a right-half-plane zero.

::: context half-planes Left and right of the imaginary axis
The $s$-plane is a map of complex numbers: real part across, imaginary part up. The upright line through zero, the imaginary axis, splits it into a **left half-plane** (negative real part) and a **right half-plane** (positive real part). A pole on the left gives a mode that dies away; a pole on the right gives one that grows. Zeros never make anything grow — but where they sit still matters, as this lesson shows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="160" height="170" fill="#8fb8f0" opacity="0.25"/>
  <rect x="180" y="10" width="160" height="170" fill="#f2b880" opacity="0.25"/>
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="10" x2="180" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="334" y="116" font-size="12" fill="#1f2a44" text-anchor="end">Re s</text>
  <text x="186" y="22" font-size="12" fill="#1f2a44">Im s</text>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="150" y1="51.7" x2="160" y2="61.7"/><line x1="160" y1="51.7" x2="150" y2="61.7"/>
    <line x1="150" y1="138.3" x2="160" y2="148.3"/><line x1="160" y1="138.3" x2="150" y2="148.3"/>
  </g>
  <circle cx="130" cy="100" r="6" fill="#fff" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="230" cy="100" r="6" fill="#fff" stroke="#b4232c" stroke-width="2.5"/>
  <text x="130" y="122" font-size="12" fill="#1d6fd1" text-anchor="middle">−z</text>
  <text x="230" y="122" font-size="12" fill="#b4232c" text-anchor="middle">+z</text>
  <text x="100" y="40" font-size="12" fill="#1f2a44" text-anchor="middle">left half-plane</text>
  <text x="260" y="40" font-size="12" fill="#1f2a44" text-anchor="middle">right half-plane</text>
  <text x="112" y="172" font-size="11" fill="#1f2a44">× poles of 1/(s²+s+1)</text>
</svg>
```

The blue zero at $-z$ and the red zero at $+z$ are mirror images: same distance from every point on the imaginary axis, which is why their magnitudes match.
:::

::: context s-is-derivative Why s means "take the slope"
Lesson 3's derivative rule says the transform of $\dot{y}$ is $sY(s) - y(0)$. A step response starts at rest, so $y(0) = 0$ and the rule becomes plain multiplication: $\dot{y} \leftrightarrow sY$. Read it backwards and multiplying a transform by $s$ means differentiating the signal. So $(1 + s/z)Y$ is the transform of $y + \dot{y}/z$. Likewise, dividing by $s$ means integrating — which is why $1/s$ is called an integrator.
:::

::: context pd-controller Proportional plus derivative
A proportional controller pushes harder the further you are from the target, like a spring. Add a derivative term and it also pushes against how *fast* the error is changing, like a shock absorber. Together they make a spring-and-damper you can tune in software. The derivative part reacts to where the error is heading, not only where it is — which is why it speeds the loop up. The next module designs PD and PID controllers in detail.
:::

::: context undershoot-picture Three step responses, one set of poles
All three curves share the poles of $1/(s^2 + s + 1)$. Grey: no zero. Blue: a zero at $-1$, which adds the slope and rises fast, overshooting to about $1.30$. Red: a zero at $+1$, which subtracts the slope. It dips to $-0.28$ at $0.60\,\mathrm{s}$ and crosses zero at $1.37\,\mathrm{s}$ before climbing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="345" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="15" x2="40" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="50" x2="345" y2="50" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="34" y="54" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="34" y="134" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="190" y="176" font-size="11" fill="#1f2a44" text-anchor="middle">time, 0 to 10 s</text>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="40,130.0 46,128.5 52,124.4 58,118.4 64,111.0 70,102.8 76,94.1 82,85.4 88,77.0 94,69.2 100,62.0 106,55.8 112,50.4 118,46.1 124,42.6 130,40.1 136,38.3 142,37.3 148,37.0 154,37.1 160,37.8 166,38.7 172,39.9 178,41.2 184,42.6 190,44.0 196,45.4 202,46.7 208,47.9 214,48.9 220,49.8 226,50.6 232,51.1 238,51.6 244,51.9 250,52.1 256,52.1 262,52.1 268,52.0 274,51.9 280,51.7 286,51.5 292,51.2 298,51.0 304,50.8 310,50.6 316,50.4 322,50.2 328,50.0 334,49.9 340,49.8"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40,130.0 46,114.1 52,98.8 58,84.5 64,71.5 70,60.1 76,50.4 82,42.5 88,36.2 94,31.6 100,28.5 106,26.7 112,26.1 118,26.5 124,27.6 130,29.4 136,31.6 142,34.0 148,36.6 154,39.2 160,41.7 166,44.1 172,46.2 178,48.1 184,49.7 190,51.1 196,52.1 202,52.9 208,53.4 214,53.8 220,53.9 226,53.8 232,53.7 238,53.4 244,53.1 250,52.7 256,52.2 262,51.8 268,51.4 274,51.0 280,50.7 286,50.3 292,50.1 298,49.9 304,49.7 310,49.5 316,49.4 322,49.4 328,49.4 334,49.4 340,49.4"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40,130.0 46,142.9 52,150.1 58,152.4 64,150.6 70,145.5 76,137.8 82,128.4 88,117.8 94,106.7 100,95.6 106,84.8 112,74.8 118,65.6 124,57.6 130,50.7 136,45.1 142,40.6 148,37.3 154,35.1 160,33.8 166,33.3 172,33.5 178,34.3 184,35.5 190,37.0 196,38.7 202,40.5 208,42.3 214,44.1 220,45.7 226,47.3 232,48.6 238,49.7 244,50.7 250,51.4 256,52.0 262,52.4 268,52.6 274,52.7 280,52.7 286,52.6 292,52.4 298,52.2 304,51.9 310,51.6 316,51.3 322,51.0 328,50.7 334,50.5 340,50.3"/>
  <text x="120" y="20" font-size="12" fill="#1d6fd1">zero at −1</text>
  <text x="250" y="80" font-size="12" fill="#6c7a93">no zero</text>
  <text x="72" y="162" font-size="12" fill="#b4232c">zero at +1: wrong way first</text>
</svg>
```
:::

::: context minimum-phase-name Where "minimum phase" comes from
The name is a comparison. Take a magnitude curve and ask: how many systems have exactly this curve? Many — you can flip any zero from $-z$ to $+z$ without changing a single magnitude value. Among all of them, the one with every zero on the left has the *smallest* phase lag at every frequency. That is the minimum-phase one. Every flipped zero adds an all-pass factor and more lag, so those systems are "non-minimum phase". For a minimum-phase system, the magnitude curve alone fixes the phase curve — a fact lesson 9 leans on.
:::

::: context fundamental-limits Limits no controller can beat
Most control problems are about how clever the controller is. A few are about what the plant allows, no matter how clever you are. Right-half-plane zeros, unstable poles and time delays are the classic three. Lesson 12 meets the identity $S + T = 1$, and the next module shows the "waterbed" effect: pushing the error down at some frequencies makes it bulge up at others. A right-half-plane zero makes that bulge unavoidable if you try to cross over above it. Engineers treat these limits as facts about the vehicle, to be fixed by changing its design, sensors or actuators.
:::

::: context gimbal-word Gimbal
A **gimbal** is a pivot that lets something swing while the thing around it stays put. On a rocket, the engine hangs from a gimbal so it can tilt a few degrees in any direction, steering the thrust. That is **thrust vector control**. A Falcon 9 first stage steers this way during landing, as do most large launch vehicles on the way up. Because the gimbal sits far below the center of mass, even a small tilt of the thrust gives a large turning moment — and, as the example shows, a right-half-plane zero.
:::

::: context booster-picture The wrong-way push, frozen in time
Step 1 (left): the engine swings, and its small side force pushes the base to the right. Step 2 (right): that same force, acting below the center of mass, has tilted the vehicle. Now the full thrust leans left, and its sideways part is far larger than the original push.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="80" y="30" width="24" height="130" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="92" cy="80" r="5" fill="#1f2a44"/>
  <text x="112" y="84" font-size="11" fill="#1f2a44">CM</text>
  <line x1="92" y1="160" x2="99" y2="185" stroke="#1f2a44" stroke-width="3"/>
  <line x1="64" y1="170" x2="112" y2="170" stroke="#b4232c" stroke-width="3"/>
  <polygon points="118,170 108,165 108,175" fill="#b4232c"/>
  <text x="120" y="160" font-size="11" fill="#b4232c">side force</text>
  <text x="92" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">1. first push: right</text>
  <g transform="rotate(-12 262 95)">
    <rect x="250" y="30" width="24" height="130" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
    <circle cx="262" cy="80" r="5" fill="#1f2a44"/>
    <line x1="262" y1="80" x2="262" y2="10" stroke="#1d6fd1" stroke-width="3"/>
    <polygon points="262,4 256,16 268,16" fill="#1d6fd1"/>
  </g>
  <text x="218" y="40" font-size="11" fill="#1d6fd1">thrust</text>
  <line x1="262" y1="182" x2="210" y2="182" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="204,182 214,177 214,187" fill="#1d6fd1"/>
  <text x="270" y="186" font-size="11" fill="#1d6fd1">net: left</text>
  <text x="270" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">2. then: tilted, left</text>
</svg>
```

The command sign in the example is chosen so "left" here is the *intended* direction; the first shove is the wrong way.
:::

::: context aircraft-sink Why a pulled-up airplane first drops
To pitch the nose up, the elevator on the tail pushes the tail *down*. That downward push also subtracts from the total lift, so for a moment the whole airplane sinks. Only once the nose has come up does the wing's extra lift win and the airplane climb. Pilots feel it as a brief sag; autopilot designers see it as a right-half-plane zero in the altitude transfer function, and keep the altitude-hold loop slow for exactly the reason in this lesson.
:::

::: context center-of-percussion Where to put the accelerometer
When the engine swings, the vehicle both slides sideways and starts to rotate. At a point a distance $x$ ahead of the center of mass, the first sideways acceleration is the slide minus the rotation: $T\delta/m - x\,Tl\delta/I$. These cancel at $x = I/(ml)$, the **center of percussion** — for the booster, $2.0\times10^6/(3.0\times10^4 \times 15) = 4.44\,\mathrm{m}$ above the center of mass.

Behind that point (including the center of mass itself), the first push is the wrong way, and the transfer function has a right-half-plane zero. Ahead of it, the rotation wins from the start, so the reading moves the right way at once and the zeros move onto the imaginary axis instead. Choosing where to bolt a sensor is choosing your zeros.
:::
