---
id: l04-s-plane-to-z-plane
title: Mapping the s-plane to the z-plane
minutes: 20
covers:
  - 'Mapping the s-plane to the z-plane; the unit circle as the stability boundary'
---

Everything you know about pole locations came from the $s$ plane. Left half plane is stable, distance from the imaginary axis is decay rate, distance from the origin is natural frequency, the angle off the negative real axis is damping. Those readings are automatic by now, and they are the working vocabulary of every design review.

None of them apply to a discrete pole. A number like $z = 0.9335 + 0.1020j$ carries the same information, encoded differently, and you need to be able to read it as fluently. This lesson builds the map between the two planes, shows why the unit circle takes over the role of the imaginary axis, and gives you the four formulas that convert a $z$-plane pole into the damping, natural frequency, settling time and overshoot you already reason with.

The map is also where aliasing reappears in its most geometric form. The $s$ plane is infinite in the imaginary direction; the $z$ plane is not, and something has to give. What gives is uniqueness, and understanding exactly how is what keeps you from misreading a discrete pole near the edge of the circle.

## Where the map comes from

Sample a continuous mode. A pole at $s = \sigma + j\omega_d$ contributes a term $e^{st}$ to the response, and at the sampling instants $t = nT$ that term is

$$
e^{s\,nT} = \left(e^{sT}\right)^{n}.
$$

The previous lesson transformed the sequence $a^n$ and found a pole at $z = a$. So the sampled mode has a discrete pole at

$$
\boxed{\,z = e^{sT}\,}
$$

and the map is the exponential. It is not an approximation, a fit, or one of several conventions: sampling a continuous exponential produces exactly a geometric sequence with ratio $e^{sT}$.

Split it into magnitude and angle with $s = \sigma + j\omega_d$:

$$
|z| = e^{\sigma T}, \qquad \angle z = \omega_d T .
$$

The real part of $s$ sets the radius; the imaginary part sets the angle. Everything else in this lesson is a consequence.

## The unit circle is the stability boundary

A continuous mode decays when $\sigma < 0$. Under the map, $\sigma < 0$ gives $|z| = e^{\sigma T} < 1$, so:

- the **left half plane** maps to the **inside** of the unit circle;
- the **imaginary axis** ($\sigma = 0$) maps to the **unit circle** itself, $|z| = 1$;
- the **right half plane** maps outside.

A discrete system is stable if and only if every pole satisfies $|z| < 1$. The role the imaginary axis played is now played by a circle, and "distance into the left half plane" becomes "distance inward from the circle".

The origin is worth a moment. $z = 0$ corresponds to $\sigma \to -\infty$: infinitely fast decay. A pole at exactly $z = 0$ means the corresponding mode is gone in one sample — a difference equation with all poles at the origin is a finite impulse response, and a controller that places all closed-loop poles there is a **deadbeat** design, settling exactly in as many samples as there are states. Deadbeat control is rarely flown, because placing poles at the origin demands enormous control authority and gives no robustness at all, but it explains why a pole very close to $z = 0$ in flight code is a fast mode and not a suspicious number.

::: key
**Discrete-time stability region.** The unit circle. Since $z = e^{sT}$, the imaginary axis maps to $|z| = 1$ and the left half plane to $|z| < 1$. A discrete pole is stable if and only if $|z| < 1$.
:::

## The map is many-to-one, which is aliasing again

Replace $\omega_d$ by $\omega_d + k\omega_s$ for any integer $k$, where $\omega_s = 2\pi/T$:

$$
e^{(\sigma + j\omega_d + jk\omega_s)T} = e^{\sigma T} e^{j\omega_d T} e^{\,jk\,2\pi} = e^{sT}.
$$

The same $z$. Every horizontal strip of the $s$ plane of height $\omega_s$ maps onto the whole $z$ plane, and all of them map onto it identically. The strip $-\omega_s/2 < \omega_d \le \omega_s/2$ is called the **primary strip**, and it is the only one the samples can distinguish. This is the aliasing of the first lesson, seen as geometry: a continuous mode at $47\,\mathrm{Hz}$ and one at $3\,\mathrm{Hz}$, sampled at $50\,\mathrm{Hz}$, land on the same point in the $z$ plane, so no discrete analysis can tell them apart.

The practical reading: a pole angle $\theta = \omega_d T$ runs from $0$ at DC to $\pi$ at Nyquist. The number of samples per cycle of oscillation is $2\pi/\theta$, so $\theta = \pi$ is two samples per cycle — the pole is on the negative real axis and the mode alternates sign every sample. A negative real pole in flight code is not a bug by itself, but it always deserves a look, because it is a mode running at the fastest rate the sample rate can represent.

## Reading a discrete pole

Invert the map. Write a discrete pole as $z = r e^{j\theta}$ with $r = |z|$ and $\theta = \angle z$ in radians. Then $sT = \ln z$, so

$$
\sigma = \frac{\ln r}{T}, \qquad \omega_d = \frac{\theta}{T} .
$$

From these the second-order quantities follow exactly as in continuous time, where $\sigma = -\zeta\omega_n$ and $\omega_d = \omega_n\sqrt{1-\zeta^2}$:

$$
\omega_n = \frac{\sqrt{(\ln r)^2 + \theta^2}}{T},
\qquad
\zeta = \frac{-\ln r}{\sqrt{(\ln r)^2 + \theta^2}} .
$$

Once you have $\zeta$ and $\omega_n$, every result from the signals and systems module applies unchanged: $2\%$ settling time $\approx 4/(\zeta\omega_n)$, overshoot $= e^{-\pi\zeta/\sqrt{1-\zeta^2}}$, peak time $= \pi/\omega_d$.

Two shortcuts are worth carrying. The envelope decays as $r^n$, so the number of samples per time constant is

$$
n_\tau = \frac{-1}{\ln r},
$$

which is about $9.5$ samples for $r = 0.9$, $19.5$ for $r = 0.95$ and $99.5$ for $r = 0.99$. And curves of constant damping in the $z$ plane are logarithmic spirals, $r = e^{-\theta\zeta/\sqrt{1-\zeta^2}}$, obtained by eliminating $T$ between the two expressions above. They start at $z = 1$ for $\theta = 0$ and wind inward, which is why a pole that looks comfortably inside the circle can still be poorly damped if its angle is small: for $\theta = 0.1$ and $\zeta = 0.2$, the spiral sits at $r = e^{-0.0204} = 0.980$, hard against the boundary.

::: warning
Distance from the unit circle is *not* damping, and reading a $z$-plane plot as though it were is the most common error in discrete design reviews. A pole at $z = 0.98 + 0.02j$ and a pole at $z = 0.70 + 0.70j$ have similar-looking gaps to the circle, but at $T = 10\,\mathrm{ms}$ the first is $\zeta = 0.700$ at $\omega_n = 0.455\,\mathrm{Hz}$ and the second is $\zeta = 0.013$ at $\omega_n = 12.5\,\mathrm{Hz}$. Compute $\zeta$ from $-\ln r/\sqrt{(\ln r)^2 + \theta^2}$ rather than eyeballing the gap. The eye is reliable for one question only: whether the pole is inside the circle at all.
:::

::: example One continuous pole pair, three sample rates
A spacecraft attitude loop is designed with a closed-loop pole pair at $\omega_n = 2\pi \cdot 1.0 = 6.2832\,\mathrm{rad/s}$ and $\zeta = 0.7$. In the $s$ plane,

$$
s = -\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2} = -4.3982 \pm 4.4871\,j\ \ \mathrm{s^{-1}} .
$$

Map it at three candidate rates with $z = e^{sT}$:

| $f_s$ | $T$ | $z$ | $r$ | $\theta$ | samples/cycle |
| --- | --- | --- | --- | --- | --- |
| $200\,\mathrm{Hz}$ | $5\,\mathrm{ms}$ | $0.97800 + 0.02195j$ | $0.97825$ | $0.02244$ rad | $280$ |
| $50\,\mathrm{Hz}$ | $20\,\mathrm{ms}$ | $0.91211 + 0.08208j$ | $0.91579$ | $0.08974$ rad | $70$ |
| $5\,\mathrm{Hz}$ | $200\,\mathrm{ms}$ | $0.25876 + 0.32436j$ | $0.41493$ | $0.89742$ rad | $7$ |

Check the inversion on the middle row: $\ln r = \ln 0.91579 = -0.087964$, so $\sigma = -0.087964/0.02 = -4.3982\,\mathrm{s^{-1}}$, matching. Then $\sqrt{(\ln r)^2 + \theta^2} = \sqrt{0.0077377 + 0.0080536} = 0.125664$, giving $\omega_n = 0.125664/0.02 = 6.2832\,\mathrm{rad/s}$ and $\zeta = 0.087964/0.125664 = 0.700$. The map is exact in both directions.

Now read the three rows as engineering. At $200\,\mathrm{Hz}$ the pole sits at radius $0.978$ with an angle of $1.3^\circ$ — a tight cluster hard against $z = 1$, where a small coefficient error moves it a long way in $\zeta$. At $5\,\mathrm{Hz}$ the pole is well spread across the disk, numerically comfortable, but there are only seven samples per cycle of the damped oscillation and the intersample behaviour is no longer guaranteed by the sample-instant behaviour. The middle row is the sensible one, and the fact that a *numerically* comfortable pole location and a *dynamically* sensible sample rate pull in opposite directions is exactly the tension the sample-rate lesson in this module resolves.
:::

::: example Reading a second-order section out of flight code
You find this in a $100\,\mathrm{Hz}$ attitude controller and want to know what it does:

$$
H(z) = \frac{0.01483\,(z + 1)}{z^2 - 1.86709\,z + 0.88191}.
$$

Start with the poles. For $z^2 + a_1 z + a_2$ with a complex pair, the product of the roots is $a_2$ and their magnitudes are equal, so

$$
r = \sqrt{a_2} = \sqrt{0.88191} = 0.93910,
\qquad
\cos\theta = \frac{-a_1}{2r} = \frac{1.86709}{2 \times 0.93910} = 0.99408,
$$

giving $\theta = 0.108828\,\mathrm{rad}$. The poles are $z = 0.93355 \pm 0.10200j$.

Convert with $T = 0.01\,\mathrm{s}$. $\ln r = -0.062842$, so $\sigma = -6.2842\,\mathrm{s^{-1}}$ and $\omega_d = 0.108828/0.01 = 10.883\,\mathrm{rad/s} = 1.732\,\mathrm{Hz}$. Then

$$
\omega_n = \frac{\sqrt{0.062842^2 + 0.108828^2}}{0.01} = \frac{0.125664}{0.01} = 12.566\,\mathrm{rad/s} = 2.000\,\mathrm{Hz},
\qquad
\zeta = \frac{0.062842}{0.125664} = 0.500 .
$$

So the section is a second-order response at $2\,\mathrm{Hz}$ with $\zeta = 0.5$: overshoot $e^{-\pi(0.5)/\sqrt{0.75}} = 0.163$, that is $16.3\%$, and a $2\%$ settling time of $4/(\zeta\omega_n) = 4/6.284 = 0.637\,\mathrm{s}$, which at $100\,\mathrm{Hz}$ is $64$ frames.

Two sanity checks close it out. The DC gain is $0.01483 \times 2/(1 - 1.86709 + 0.88191) = 0.02966/0.01482 = 2.00$, so the section also applies a gain of 2 — worth noticing, because a unity-gain second-order section is what one usually expects and this is not one. And the pole angle $\theta = 0.1088\,\mathrm{rad}$ is $3.5\%$ of $\pi$, so the oscillation takes $2\pi/0.1088 = 58$ samples per cycle: comfortably resolved, no aliasing concern, and far from the negative real axis.
:::

## A stability test you can do by hand

For a second-order denominator $z^2 + a_1 z + a_2$, both roots lie inside the unit circle if and only if

$$
|a_2| < 1, \qquad |a_1| < 1 + a_2 .
$$

This is the Jury criterion specialised to order 2 — the discrete counterpart of Routh-Hurwitz — and the two conditions have direct readings. The first says the product of the root magnitudes is less than 1. The second is the pair of evaluations $H^{-1}(1) = 1 + a_1 + a_2 > 0$ and $H^{-1}(-1) = 1 - a_1 + a_2 > 0$: the denominator polynomial must be positive at both $z = 1$ and $z = -1$, the two points where the unit circle crosses the real axis.

Apply it to the section above: $a_2 = 0.88191 < 1$, and $|a_1| = 1.86709 < 1 + 0.88191 = 1.88191$. Stable, with $0.015$ of margin in the second condition — which is another way of seeing how close that pole pair is to the boundary, and why the coefficients are quoted to five decimals rather than three.

::: note
A discrete design that looks perfect at the sample instants can still misbehave between them. The $z$-domain analysis sees only $y[n]$, and a plant driven by a staircase can ripple within each frame while passing exactly through the intended values at every sample. Aggressive designs with poles near $z = 0$ are the usual offenders: the controller is demanding large, rapidly alternating inputs, and the plant's continuous response wanders in between. The check is to simulate the continuous plant with the held command at ten or twenty points per frame and look at the actuator signal, not only at the sampled output. This is called **intersample ripple**, and it is the one failure mode the unit circle does not warn you about.
:::

## Check yourself

::: check
A discrete pole sits at $z = -0.85$ in a $50\,\mathrm{Hz}$ loop. Is it stable? What does the corresponding mode look like in the time domain, and what continuous frequency does it correspond to?
:::

::: answer
Stable: $|z| = 0.85 < 1$.

Its angle is $\theta = \pi$, so $\omega_d = \pi/T = \pi/0.02 = 157.08\,\mathrm{rad/s} = 25\,\mathrm{Hz}$ — exactly the Nyquist frequency. The mode is $(-0.85)^n$, which alternates sign every sample while decaying by $15\%$ per step: two samples per cycle, the fastest oscillation the sample rate can represent.

The continuous interpretation needs care because of the many-to-one map. The pole corresponds to $\sigma = \ln(0.85)/0.02 = -8.126\,\mathrm{s^{-1}}$ and $\omega_d = 25\,\mathrm{Hz}$ within the primary strip, but also to $25 + 50 = 75\,\mathrm{Hz}$, $125\,\mathrm{Hz}$, and so on. Damping works out to $\zeta = 8.126/\sqrt{8.126^2 + 157.08^2} = 0.0517$ if you take the primary-strip reading. In practice a real negative pole like this is almost never a sampled physical mode — it is usually the signature of a discretisation problem, most often forward Euler applied at too low a rate, which the next lesson covers.
:::

::: check
Two closed-loop poles from a $400\,\mathrm{Hz}$ loop are $z = 0.985 \pm 0.060j$. Compute $\zeta$, $\omega_n$, the settling time and the number of frames it takes.
:::

::: answer
$r = \sqrt{0.985^2 + 0.060^2} = \sqrt{0.970225 + 0.0036} = \sqrt{0.973825} = 0.98683$, and $\theta = \arctan(0.060/0.985) = 0.060839\,\mathrm{rad}$.

$\ln r = -0.013261$, so with $T = 0.0025\,\mathrm{s}$: $\sigma = -5.3047\,\mathrm{s^{-1}}$, $\omega_d = 24.335\,\mathrm{rad/s} = 3.873\,\mathrm{Hz}$.

$\sqrt{(\ln r)^2 + \theta^2} = \sqrt{0.00017585 + 0.00370139} = \sqrt{0.00387724} = 0.062267$, so $\omega_n = 24.907\,\mathrm{rad/s} = 3.964\,\mathrm{Hz}$ and $\zeta = 0.013261/0.062267 = 0.213$.

Settling: $4/(\zeta\omega_n) = 4/5.3047 = 0.7540\,\mathrm{s}$, which is $0.7540/0.0025 = 302$ frames. The lesson in the numbers: poles that sit at radius $0.987$ and look almost on top of $z = 1$ describe a lightly damped $4\,\mathrm{Hz}$ oscillation lasting three hundred frames. At high sample rates every interesting pole crowds into a small neighbourhood of $z = 1$, which is both a readability problem and, as the realization-forms lesson shows, a numerical one.
:::

::: check
Explain why the $s$-to-$z$ map cannot be inverted uniquely, and what the consequence is for identifying a system from sampled data.
:::

::: answer
$z = e^{sT}$ is periodic in the imaginary direction with period $\omega_s = 2\pi/T$: $s$ and $s + jk\omega_s$ give the same $z$ for every integer $k$. Inverting requires choosing a strip, and the convention is the primary strip $-\omega_s/2 < \omega \le \omega_s/2$, where $\omega_d = \theta/T$ with $\theta \in (-\pi, \pi]$.

For identification this means sampled data cannot tell you a mode's true frequency if that frequency is above Nyquist — the estimator will report the folded value, confidently and with a good fit, because the folded model reproduces the data exactly. Any modal frequency you extract from a sampled record is a statement about the primary strip only. That is why modal surveys are run with instrumentation sampled far faster than the control loop, and why a structural mode identified at $3\,\mathrm{Hz}$ in $50\,\mathrm{Hz}$ flight telemetry should be confirmed against an analysis or a ground test before anyone designs a notch for it.
:::

::: check
A discrete integrator is $H(z) = T/(z - 1)$. Where is its pole, is the system stable, and what does that pole correspond to in the $s$ plane?
:::

::: answer
The pole is at $z = 1$: on the unit circle, so the integrator is marginally stable, not stable. Its impulse response is a constant, matching the continuous integrator's step response, and any constant input drives the output without bound.

In the $s$ plane, $z = 1$ means $r = 1$ and $\theta = 0$, so $\sigma = \ln(1)/T = 0$ and $\omega_d = 0$: the pole at the origin of the $s$ plane, which is what a continuous integrator $1/s$ has. The correspondence is exact, and it is why $z = 1$ is the single most important point in discrete control — every integral action, every position-from-rate accumulation, every bias state in an estimator puts a pole there deliberately.

The practical consequence is the same as in continuous time: integrator windup. A pole on the boundary means the state has no mechanism to forget, so anti-windup logic is not a refinement but a requirement, and it carries over unchanged from the classical control module.
:::

::: check
A colleague computes discrete poles at $z = 0.999 \pm 0.001j$ for a $1\,\mathrm{kHz}$ loop and reports the design as "very stable, poles well inside the circle". What is wrong with the reading?
:::

::: answer
The gap to the circle is not the measure. Compute: $r = \sqrt{0.999^2 + 0.001^2} = 0.9990005$, so $\ln r = -0.00099993$ and with $T = 0.001\,\mathrm{s}$, $\sigma = -0.99999\,\mathrm{s^{-1}}$. The angle is $\theta = 0.0010010\,\mathrm{rad}$, so $\omega_d = 1.001\,\mathrm{rad/s}$.

Then $\omega_n = \sqrt{0.00099993^2 + 0.0010010^2}/0.001 = 1.4149\,\mathrm{rad/s} = 0.225\,\mathrm{Hz}$ and $\zeta = 0.00099993/0.0014149 = 0.707$. The damping is fine, but the *bandwidth* is a quarter of a hertz and the settling time is $4/0.99999 = 4.0\,\mathrm{s}$ — four thousand frames. A $1\,\mathrm{kHz}$ loop whose dominant mode takes four seconds to settle is either far slower than intended or is running much faster than its dynamics require.

The deeper point is that at $1\,\mathrm{kHz}$ every pole of any reasonably paced loop lands within a thousandth of $z = 1$, so "well inside the circle" is not available as a description. Convert to $\zeta$ and $\omega_n$ before saying anything about a discrete pole.
:::

## Summary

| Item | Statement |
| --- | --- |
| The map | $z = e^{sT}$, exact: sampling $e^{st}$ gives the geometric sequence $(e^{sT})^n$ |
| Magnitude and angle | $\lvert z \rvert = e^{\sigma T}$, $\angle z = \omega_d T$ |
| Stability | Left half plane maps inside the unit circle; a discrete pole is stable iff $\lvert z \rvert < 1$ |
| Many-to-one | $s$ and $s + jk\omega_s$ map to the same $z$; only the primary strip $\lvert\omega\rvert \le \omega_s/2$ is distinguishable |
| Inverse | $\sigma = \ln r / T$, $\omega_d = \theta/T$ |
| Second-order readings | $\omega_n = \sqrt{(\ln r)^2 + \theta^2}/T$, $\zeta = -\ln r/\sqrt{(\ln r)^2 + \theta^2}$ |
| Decay | Envelope $r^n$; samples per time constant $n_\tau = -1/\ln r$ ($9.5$ at $r=0.9$, $99.5$ at $r=0.99$) |
| Oscillation | Samples per cycle $= 2\pi/\theta$; $\theta = \pi$ is Nyquist, alternating sign every sample |
| Special points | $z = 1$ is the continuous origin (integrator); $z = 0$ is infinitely fast (deadbeat) |
| Jury test, order 2 | $z^2 + a_1z + a_2$ stable iff $\lvert a_2 \rvert < 1$ and $\lvert a_1 \rvert < 1 + a_2$ |
| Caution | Distance from the circle is not damping; intersample ripple is invisible to $z$-domain analysis |

The next lesson uses this geometry to judge the discretization methods: each one is a different approximation to $z = e^{sT}$, and how badly each distorts the map is exactly how badly it distorts your design.
