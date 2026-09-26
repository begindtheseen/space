---
id: l09-complex-numbers-and-euler
title: Complex numbers and the Euler formula
minutes: 21
covers:
  - complex numbers and Euler formula
---

Stand on a number line facing the positive direction. Multiplying by $-1$ turns you around: now you face the negative direction. Do it twice and you face forward again, which is why $(-1)(-1) = 1$. So multiplying by $-1$ is a half turn.

Here is a strange question. Is there a number that is a *quarter* turn — a number you could multiply by twice to get a half turn, that is, to get $-1$? No ordinary number works: any number times itself is positive or zero. But a quarter turn would leave you facing *sideways*, off the number line altogether. So give that sideways direction its own number, call it $i$, and declare $i \times i = -1$. That one bold step gives the **complex numbers**, and it turns out to be the simplest way anyone has found to describe turning.

Why a guidance engineer needs this:

- **Rotation becomes multiplication.** A point in the plane becomes one number, $z = re^{i\theta}$, and turning it through an angle $\alpha$ becomes multiplying by $e^{i\alpha}$. The rotation matrix, the sum formulas, the double-angle formulas and polar coordinates all become one rule: multiply the lengths, add the angles.
- **Control systems speak it.** Every wobble and vibration is the shadow of a spinning complex number. A filter's or control loop's response to a vibration is one complex number: its length is the gain and its angle is the delay. The Bode plot, the Nyquist plot and the root locus — the main pictures of control engineering — are all drawn in the complex plane.
- **Attitude software builds on it.** Spacecraft attitude is stored as quaternions, which are complex numbers with three sideways directions instead of one, and $e^{i\theta}$ is the template for how they work.

## A number that turns a quarter

A **complex number** is written $z = a + bi$, where $a$ and $b$ are ordinary (real) numbers and $i$ obeys $i^2 = -1$. The **real part** is $\operatorname{Re} z = a$ ("real part of z") and the **imaginary part** is $\operatorname{Im} z = b$.

Do not let the [[word "imaginary"|imaginary-name]] fool you: $i$ is a second direction. Plot $z$ as the point $(a, b)$ — real part across, imaginary part up. Then complex numbers fill a whole flat plane, called the **complex plane**. Ordinary numbers lie along the horizontal axis, and $i$ itself sits one step up the vertical axis. (Electrical engineers, and Python, [[write it as j|j-engineers]].)

### Adding and multiplying

**Adding** is adding arrows, piece by piece: $(a + bi) + (c + di) = (a + c) + (b + d)i$.

**Multiplying** is ordinary bracket-expanding, then replacing every $i^2$ with $-1$:

$$
(a + bi)(c + di) = ac + adi + bci + bd\,i^2 = (ac - bd) + (ad + bc)i .
$$

For example, multiply out each pair of terms, then use $i^2 = -1$ to turn $-8i^2$ into $+8$:

$$
(3 + 4i)(1 - 2i) = 3 - 6i + 4i - 8i^2 = 3 - 2i + 8 = 11 - 2i .
$$

### Length, angle and mirror image

Three more words, all pictured in the [[drawing of the complex plane|complex-plane]].

The **modulus** $|z| = \sqrt{a^2 + b^2}$ ("mod z") is the length of the arrow — its distance from the origin.

The **argument** $\arg z$ ("arg z") is the arrow's angle from the positive real axis. After the atan2 lesson you know how it must be computed:

$$
\arg z = \operatorname{atan2}(b, a) \in (-\pi, \pi] .
$$

The **complex conjugate** $\bar z = a - bi$ ("z bar") is the mirror image of $z$ in the real axis. It has the same length and the opposite angle.

The conjugate's big use is division. A number times its own conjugate is always real: $z\bar z = a^2 + b^2 = |z|^2$. So to divide, multiply the top and bottom by the conjugate of the bottom, which makes the bottom an ordinary number:

$$
\frac{3 + 4i}{1 - 2i} = \frac{(3 + 4i)(1 + 2i)}{(1 - 2i)(1 + 2i)} = \frac{3 + 6i + 4i + 8i^2}{1 + 4} = \frac{-5 + 10i}{5} = -1 + 2i .
$$

::: warning The argument is an atan2
$\arg(a + bi) = \operatorname{atan2}(b, a)$, never $\arctan(b/a)$. The number $-1 - i$ has argument $-135^\circ$, but $\arctan\big((-1)/(-1)\big) = \arctan(1) = 45^\circ$ puts it in the wrong half of the plane. Python's `cmath.phase(z)` and NumPy's `np.angle(z)` both do it correctly.
:::

## Multiplication is rotation

A point at distance $r$ and angle $\theta$ has coordinates $(r\cos\theta, r\sin\theta)$ — that was polar coordinates. So the complex number there is

$$
z = r(\cos\theta + i\sin\theta), \qquad r = |z|, \quad \theta = \arg z .
$$

This is the **polar form** of a complex number. Now something wonderful happens when you multiply two numbers in polar form: **the lengths multiply and the angles add.**

::: note Why it has to be true
Take $z_1 = r_1(\cos\theta_1 + i\sin\theta_1)$ and $z_2 = r_2(\cos\theta_2 + i\sin\theta_2)$ and multiply with the bracket rule above:

$$
z_1 z_2 = r_1 r_2\big[(\cos\theta_1\cos\theta_2 - \sin\theta_1\sin\theta_2) + i(\sin\theta_1\cos\theta_2 + \cos\theta_1\sin\theta_2)\big].
$$

The first round bracket is exactly the sum formula for $\cos(\theta_1 + \theta_2)$, and the second is the sum formula for $\sin(\theta_1 + \theta_2)$, from the identities lesson. So

$$
z_1 z_2 = r_1 r_2\big[\cos(\theta_1 + \theta_2) + i\sin(\theta_1 + \theta_2)\big].
$$
:::

Check it on the numbers from before.

- $3 + 4i$ has length $|3 + 4i| = 5$ and angle $\operatorname{atan2}(4, 3) = 53.13^\circ$.
- $1 - 2i$ has length $\sqrt 5 = 2.236$ and angle $\operatorname{atan2}(-2, 1) = -63.43^\circ$.
- So the product should have length $5\sqrt 5 = 11.18$ and angle $53.13^\circ - 63.43^\circ = -10.30^\circ$.
- And indeed $|11 - 2i| = \sqrt{125} = 11.18$, with $\operatorname{atan2}(-2, 11) = -10.30^\circ$.

Division runs backward: the lengths divide and the angles subtract. So $(3 + 4i)/(1 - 2i)$ has length $5/\sqrt 5 = \sqrt 5$ and angle $53.13^\circ + 63.43^\circ = 116.57^\circ$ — which is exactly where $-1 + 2i$ sits.

### Turning without stretching

Now let the second number have length $1$: $z_2 = \cos\alpha + i\sin\alpha$. Multiplying by it leaves the length of $z_1$ alone and adds $\alpha$ to its angle. It **rotates** $z_1$ counterclockwise by $\alpha$, like turning a clock hand without changing its length.

Written out in parts, $(x + iy)(\cos\alpha + i\sin\alpha) = (x\cos\alpha - y\sin\alpha) + i(x\sin\alpha + y\cos\alpha)$. That is exactly the rotation matrix from the identities lesson applied to $(x, y)$.

And $i$ itself is the length-one number at $90^\circ$. So multiplying by $i$ is a [[quarter turn|quarter-turn]], and $i \cdot i = -1$ says two quarter turns make a half turn. That is what $i^2 = -1$ *means*.

::: example Rotating a vector by complex multiplication
In the identities lesson a guidance routine rotated the displacement $(3.00, 1.00)$ km by $40^\circ$ counterclockwise. As a complex number the displacement is $3 + i$. The rotation is multiplication by $\cos 40^\circ + i\sin 40^\circ = 0.7660 + 0.6428i$.

**Multiply.** Real part: (real × real) minus (imaginary × imaginary). Imaginary part: the two cross terms added.

$$
(3 + i)(0.7660 + 0.6428i) = (3 \times 0.7660 - 1 \times 0.6428) + i(3 \times 0.6428 + 1 \times 0.7660) = 1.655 + 2.694i .
$$

So the rotated displacement is $(1.655, 2.694)$ km, the same answer the rotation matrix gave.

**Check the length did not change.** $\sqrt{1.655^2 + 2.694^2} = 3.162$ km, the same as $|3 + i| = \sqrt{10} = 3.162$ km.

**Check the angles.** $3 + i$ sits at $18.43^\circ$. The rotation adds $40^\circ$. The product should sit at $58.43^\circ$, and $\operatorname{atan2}(2.694, 1.655)$ is indeed $58.43^\circ$.

**A quarter turn clockwise** is multiplication by $-i$: $(2 - 5i)(-i) = -2i + 5i^2 = -5 - 2i$. So $(2, -5)$ goes to $(-5, -2)$. Sketch both arrows and you will see a right angle between them, turned clockwise.
:::

## The Euler formula

Write $f(\theta) = \cos\theta + i\sin\theta$ for the length-one number at angle $\theta$ — the tip of a clock hand of length $1$ pointing at angle $\theta$. The rule we proved above says

$$
f(\alpha)\,f(\beta) = f(\alpha + \beta), \qquad f(0) = 1 .
$$

In words: *adding* the angles *multiplies* the outputs. You have seen that behavior before. It is the defining property of powers: $c^{\alpha}c^{\beta} = c^{\alpha + \beta}$ and $c^0 = 1$. For a smooth, unbroken function, nothing else has it. So $f(\theta)$ must be some base raised to the power $\theta$. The only question is which base.

### Finding the base

The base is decided by what happens for tiny inputs.

- In module 1 you met the number $e \approx 2.718$ as the limit of [[compound growth|compound-interest]], $(1 + 1/n)^n$ for bigger and bigger $n$. Compounding a rate $x$ instead of $1$ gives its powers: $e^x = \lim_{n \to \infty}(1 + x/n)^n$. (Write $m = n/x$; then $(1 + x/n)^n = \big[(1 + 1/m)^m\big]^x$, and the bracket heads to $e$.) And when $x$ is small, even one slice is nearly enough: $e^x \approx 1 + x$.
- The small-angle lesson showed that for small $\theta$, $\cos\theta \approx 1$ and $\sin\theta \approx \theta$. So

$$
f(\theta) \approx 1 + i\theta .
$$

Now compound. Chop the angle $\theta$ into $n$ equal slices. By the product rule, turning by $\theta$ is the same as turning by $\theta/n$, $n$ times: $f(\theta) = f(\theta/n)^n$. For large $n$ each slice is tiny, so each factor is almost exactly $1 + i\theta/n$:

$$
f(\theta) = \lim_{n \to \infty}\left(1 + \frac{i\theta}{n}\right)^n = e^{i\theta} ,
$$

by the compound-growth definition of $e^x$ with $x = i\theta$. That is the **Euler formula**:

$$
e^{i\theta} = \cos\theta + i\sin\theta .
$$

Read it aloud as "e to the i theta equals cos theta plus i sine theta".

Here is the picture of what $(1 + i\theta/n)^n$ does. Each factor nudges the point a small step *sideways* (that is what the $i$ does) by a fraction $\theta/n$ of its current distance. A long run of small sideways nudges is [[exactly how you walk around a circle|compound-steps]].

Try it with $\theta = 1$ radian:

| $n$ | $(1 + i/n)^n$ | length |
| --- | --- | --- |
| $10$ | $0.571 + 0.883i$ | $1.0510$ |
| $1000$ | $0.5406 + 0.8419i$ | $1.0005$ |
| $10^6$ | $0.54030 + 0.84147i$ | $1.0000005$ |

The answers close in on $\cos 1 + i\sin 1 = 0.54030 + 0.84147i$. Each length is a little above $1$ because every straight step overshoots the circle slightly; the overshoot vanishes as the steps shrink.

::: key Euler formula
$e^{i\theta} = \cos\theta + i\sin\theta$. Multiplying a complex number by $e^{i\theta}$ rotates it counterclockwise by $\theta$ and leaves its modulus unchanged.
:::

::: note The series check
If you already know the exponential series $e^x = 1 + x + x^2/2! + x^3/3! + \cdots$, put $x = i\theta$ and sort the terms by powers of $i$. The even powers give $1 - \theta^2/2! + \theta^4/4! - \cdots$, which is the cosine series. The odd powers give $i(\theta - \theta^3/3! + \cdots)$, the sine series — with the $\theta^3/6$ of the small-angle lesson sitting in its place. The calculus module derives those series; the compounding argument above needs only what this module has built.
:::

### What falls out right away

- **Always length one.** $|e^{i\theta}| = 1$ for every real $\theta$, since $\cos^2\theta + \sin^2\theta = 1$.
- **Backward is the mirror image.** Replace $\theta$ by $-\theta$; cosine does not change and sine flips sign, so $e^{-i\theta} = \cos\theta - i\sin\theta = \overline{e^{i\theta}}$.
- **A half turn is a sign flip.** At $\theta = \pi$: $e^{i\pi} = -1$. (This is the [[most famous equation in mathematics|euler-identity]].)
- **Sine and cosine from exponentials.** Add the formulas for $e^{i\theta}$ and $e^{-i\theta}$ and the sines cancel; subtract them and the cosines cancel:

$$
\cos\theta = \frac{e^{i\theta} + e^{-i\theta}}{2}, \qquad \sin\theta = \frac{e^{i\theta} - e^{-i\theta}}{2i}.
$$

Engineers use these to swap sines and cosines for exponentials whenever the algebra of exponentials is easier — which is nearly always.

### Powers, identities for free, and roots

Every complex number is now $z = re^{i\theta}$, and multiplying is one line: $r_1e^{i\theta_1}\cdot r_2e^{i\theta_2} = r_1r_2e^{i(\theta_1 + \theta_2)}$. Raising to a power is repeated multiplication:

$$
\left(re^{i\theta}\right)^n = r^ne^{in\theta}, \qquad \text{so} \qquad (\cos\theta + i\sin\theta)^n = \cos n\theta + i\sin n\theta .
$$

This is **De Moivre's formula** ("de mwahv"). It hands you the multiple-angle identities: expand the left side, then match real parts with real parts and imaginary with imaginary.

**For $n = 2$:** $(\cos\theta + i\sin\theta)^2 = \cos^2\theta - \sin^2\theta + 2i\sin\theta\cos\theta$. Matching parts, $\cos 2\theta = \cos^2\theta - \sin^2\theta$ and $\sin 2\theta = 2\sin\theta\cos\theta$ — both double-angle formulas in one line.

**For $n = 3$,** write $c = \cos\theta$ and $s = \sin\theta$:

$$
(c + is)^3 = c^3 + 3c^2(is) + 3c(is)^2 + (is)^3 = (c^3 - 3cs^2) + i(3c^2s - s^3).
$$

Swap $s^2 = 1 - c^2$ into the real part and $c^2 = 1 - s^2$ into the imaginary part. You get $\cos 3\theta = 4\cos^3\theta - 3\cos\theta$ and $\sin 3\theta = 3\sin\theta - 4\sin^3\theta$. That is the triple-angle formula the small-angle lesson used to find the $\theta^3/6$ — found here without any sum formula.

**Roots.** De Moivre also solves $z^n = w$. Write $w = \rho e^{i\phi}$ ($\rho$ is "rho", $\phi$ is "phi"). Then

$$
z = \rho^{1/n}e^{i(\phi + 2\pi k)/n}, \qquad k = 0, 1, \ldots, n - 1 .
$$

Why several answers? Because $e^{i\phi}$ and $e^{i(\phi + 2\pi k)}$ are the same number — adding a full turn changes nothing — but dividing by $n$ spreads those copies apart. So $z^3 = 8$ has three solutions: $2$, $2e^{i2\pi/3} = -1 + 1.732i$ and $2e^{i4\pi/3} = -1 - 1.732i$. They sit equally spaced around a circle of radius $2$, a third of a turn apart.

The roots of the polynomials that describe control systems come in patterns like this. And when a polynomial has real coefficients, its complex roots always come in mirror-image (conjugate) pairs. The reason: conjugating is reflecting in the real axis, and a polynomial with only real numbers in it cannot tell a root from its reflection.

## Vibrations as spinning arrows

Picture a clock hand spinning steadily, and a light shining down from above so the hand casts a shadow on the horizontal axis. As the hand turns, the shadow slides back and forth, smoothly: that motion is a cosine wave. Every steady vibration is the shadow of a spinning arrow.

In symbols, a signal $A\cos(\omega t + \phi)$ is the real part of

$$
Ae^{i(\omega t + \phi)} = Ae^{i\phi}e^{i\omega t} .
$$

That is an arrow of length $A$ (the **amplitude**, how big the swing is), starting at angle $\phi$ (the **phase**, how far ahead it starts), spinning at $\omega$ radians per second. The fixed part $Ae^{i\phi}$ is called the signal's **phasor**.

Every signal at the same frequency shares the same spinning factor $e^{i\omega t}$. So to add such signals, add their phasors. The result is a single sinusoid at that frequency, whose amplitude and phase are the length and angle of the phasor sum. This is the general form of the $a\cos\omega t + b\sin\omega t$ combination from the identities lesson, and it handles any number of terms with any phases.

::: example Adding two vibration signals
Two accelerometers on a structure report vibrations at the same frequency but with different phases: $0.20\cos(\omega t + 30^\circ)$ and $0.15\cos(\omega t - 45^\circ)$, in $\mathrm{m/s^2}$.

**Phasors.** Turn each into an arrow, using length × cosine for the real part and length × sine for the imaginary part:

$$
0.20e^{i30^\circ} = 0.1732 + 0.1000i, \qquad 0.15e^{-i45^\circ} = 0.1061 - 0.1061i .
$$

**Add.** $(0.1732 + 0.1061) + (0.1000 - 0.1061)i = 0.2793 - 0.0061i$.

**Back to amplitude and phase.** Length $0.2793$; angle $\operatorname{atan2}(-0.0061, 0.2793) = -1.24^\circ$. So the combined signal is $0.279\cos(\omega t - 1.24^\circ)$.

**Does it make sense?** It is smaller than $0.20 + 0.15 = 0.35$, because the two vibrations are partly out of step and partly cancel.

**Check at one moment,** $\omega t = 0.7$ rad. The original terms give $0.20\cos(0.7 + 0.5236) + 0.15\cos(0.7 - 0.7854) = 0.0681 + 0.1495 = 0.2175$. The combined form gives $0.2793\cos(0.7 - 0.0217) = 0.2175$. They agree.
:::

### Gain and phase of a control element

This is the big payoff for control work. Feed a steady sinusoid into a linear element — a filter, an actuator, a sensor, a whole control loop — and out comes a sinusoid at the *same* frequency, only scaled and delayed.

Feed in $e^{i\omega t}$ and the output is $G(i\omega)e^{i\omega t}$, where $G(i\omega)$ is a single complex number, the **frequency response** at that $\omega$. Its modulus is the **gain** — the ratio of output size to input size. Its argument is the **phase shift** — how far the output lags behind.

A first-order lag with **[[time constant|time-constant]]** $\tau$ ("tau") — a rate gyro's speed limit, a temperature sensor, a simple smoothing filter — has

$$
G(i\omega) = \frac{1}{1 + i\omega\tau} .
$$

Take $\omega\tau = 2$. Divide by multiplying top and bottom by the conjugate $1 - 2i$:

$$
G = \frac{1}{1 + 2i} = \frac{1 - 2i}{5} = 0.2 - 0.4i .
$$

So $|G| = \sqrt{0.04 + 0.16} = 0.447$ and $\arg G = \operatorname{atan2}(-0.4, 0.2) = -63.4^\circ$. A vibration at twice the element's corner frequency comes out at $44.7\%$ of its size — in **[[decibels|decibel]]**, $20\log_{10}0.447 = -7.0$ dB — and lagging by $63.4^\circ$.

At $\omega\tau = 1$ the gain is $0.707$ ($-3.0$ dB) and the lag $45^\circ$; at $\omega\tau = 0.5$, the gain is $0.894$ and the lag $26.6^\circ$. Plot those pairs of numbers against frequency and you have a **Bode plot**. The phase lag is the quantity that eats up a control loop's safety margin as frequency rises.

::: example Poles of a second-order system
Many things on a spacecraft behave like a damped spring: an attitude loop with proportional and rate feedback, a landing leg, propellant sloshing in a tank. They obey the characteristic equation $s^2 + 2\zeta\omega_n s + \omega_n^2 = 0$, where $\omega_n$ ("omega sub n") is the **natural frequency** and $\zeta$ ("zeta") is the **damping ratio** — how quickly the wobble dies away. The solutions $s$ are called the system's **[[poles|poles-word]]**.

**Solve.** The quadratic formula gives, when $\zeta < 1$,

$$
s = -\zeta\omega_n \pm i\omega_n\sqrt{1 - \zeta^2},
$$

a conjugate pair. For $\omega_n = 2$ rad/s and $\zeta = 0.3$: $-\zeta\omega_n = -0.6$ and $\omega_n\sqrt{1 - 0.09} = 1.908$, so $s = -0.6 \pm 1.908i$.

**Read the pole as an arrow.** Its length is $\sqrt{0.36 + 3.640} = 2.0$, which is $\omega_n$: every pole with the same natural frequency lies on the same circle. Its angle, measured from the negative real axis, is $\arccos\zeta = 72.5^\circ$: every pole with the same damping ratio lies on the same ray.

**Read the parts.** The response contains $e^{st} = e^{-0.6t}e^{\pm 1.908it}$. The first factor is a shrinking envelope: the real part, $-0.6\ \mathrm{s^{-1}}$, is the decay rate. The Euler formula turns the second factor into $\cos 1.908t$ and $\sin 1.908t$: the imaginary part, $1.908$ rad/s, is the frequency of the wobble inside the envelope.

**What an engineer does with it.** Moving the poles left makes the wobble die faster. Moving them toward the real axis makes it wobble less. That is the whole language of pole placement — and it is the Euler formula applied to $e^{st}$.
:::

::: note Toward quaternions
Rotations of a flat plane form a one-number family, and $e^{i\theta}$ labels them so that doing one rotation after another is multiplication. Rotations of three-dimensional space need three numbers, and the matching objects are the unit quaternions, $q = \cos(\theta/2) + \hat{\mathbf{n}}\sin(\theta/2)$, where the unit vector $\hat{\mathbf{n}}$ ("n hat", the rotation axis) is built from three imaginary units in place of $i$. Composing rotations is again multiplication, and the same half angle that appears in $e^{i\theta/2}\cdot e^{i\theta/2} = e^{i\theta}$ appears in the quaternion. 3Blue1Brown's video on the Euler formula, in the module resources, is a good place to build the picture before the attitude modules make it formal.
:::

## Check yourself

::: check
Work out $i^3$ and $i^{10}$ by counting quarter turns. Then check $i^3$ with algebra.
:::

::: answer
$i^3$ is three quarter turns, $270^\circ$, which lands on $-i$. By algebra, $i^3 = i^2 \cdot i = (-1) \cdot i = -i$. The same.

$i^{10}$ is ten quarter turns. Every four make a full turn, so ten is two full turns plus two quarters — a half turn, landing on $-1$. By algebra, $i^{10} = (i^4)^2 \cdot i^2 = 1 \cdot (-1) = -1$.
:::

::: check
Compute $(1 + i)^8$ two ways: by repeated squaring in Cartesian form, and by De Moivre.
:::

::: answer
**Squaring.** $(1 + i)^2 = 1 + 2i + i^2 = 1 + 2i - 1 = 2i$. Then $(2i)^2 = 4i^2 = -4$. Then $(-4)^2 = 16$. Three squarings make the eighth power, so $(1 + i)^8 = 16$.

**De Moivre.** $|1 + i| = \sqrt 2$ and $\arg(1 + i) = 45^\circ$. So $(1 + i)^8 = (\sqrt 2)^8 e^{i \cdot 8 \times 45^\circ} = 16e^{i360^\circ} = 16$.

Eight turns of $45^\circ$ make a full turn, bringing the arrow back to the positive real axis.
:::

::: check
Find all solutions of $z^2 = i$, and say where they lie on the unit circle.
:::

::: answer
$i = e^{i\pi/2}$ has length $1$ and angle $90^\circ$. Its square roots have length $\sqrt 1 = 1$ and angles $90^\circ/2 = 45^\circ$ and $45^\circ + 180^\circ = 225^\circ$. So

$$
z = \pm(\cos 45^\circ + i\sin 45^\circ) = \pm(0.7071 + 0.7071i).
$$

Check: $(0.7071 + 0.7071i)^2 = 0.5 + 2(0.5)i + 0.5i^2 = 0.5 + i - 0.5 = i$.

The two roots sit at opposite ends of a diameter, as the two square roots of any number do.
:::

::: check
A first-order lag $G(i\omega) = 1/(1 + i\omega\tau)$ is driven at $\omega\tau = 3$. What are the gain in decibels and the phase lag? Why must the phase be computed with atan2, even though here $\arctan$ happens to give the same answer?
:::

::: answer
Multiply top and bottom by the conjugate $1 - 3i$: $G = (1 - 3i)/10 = 0.1 - 0.3i$.

Gain: $|G| = \sqrt{0.01 + 0.09} = 0.3162$, which is $20\log_{10}0.3162 = -10.0$ dB.

Phase: $\operatorname{atan2}(-0.3, 0.1) = -71.6^\circ$.

Here the real part is positive, so $\arctan(-3) = -71.6^\circ$ agrees. But a system with more than one lag has a real part that turns negative at high frequency, as the phase passes $-90^\circ$ on its way toward $-180^\circ$. There $\arctan$ of the ratio reports the phase wrong by $180^\circ$ — at exactly the frequencies where stability is decided.
:::

::: check
Using De Moivre with $n = 3$, derive the formula for $\cos 3\theta$ in terms of $\cos\theta$, and check it at $\theta = 25^\circ$.
:::

::: answer
The real part of $(c + is)^3$ is $c^3 - 3cs^2$. Swap in $s^2 = 1 - c^2$: $c^3 - 3c(1 - c^2) = c^3 - 3c + 3c^3 = 4c^3 - 3c$. So $\cos 3\theta = 4\cos^3\theta - 3\cos\theta$.

Check at $25^\circ$: $\cos 25^\circ = 0.9063$, so $\cos^3 25^\circ = 0.7445$. Then $4 \times 0.7445 - 3 \times 0.9063 = 2.978 - 2.719 = 0.2588$. And $\cos 75^\circ = 0.2588$. It works.
:::

::: check
Two heading readings are $350^\circ$ and $10^\circ$. Write each as a length-one complex number, add them, and explain what the length and angle of the sum mean, in the language of the atan2 lesson.
:::

::: answer
$e^{i350^\circ} = 0.9848 - 0.1736i$ and $e^{i10^\circ} = 0.9848 + 0.1736i$. The imaginary parts cancel, so the sum is $1.9696 + 0i$: angle $0^\circ$, length $1.9696$.

The angle is the **circular mean** of the two headings — due north, not the arithmetic mean of $180^\circ$, which points the opposite way. The length divided by the number of readings, $0.985$, is the mean resultant length. It is close to $1$ because the two readings nearly agree.

The circular-mean formula from the atan2 lesson, $\operatorname{atan2}(\sum\sin\theta_k, \sum\cos\theta_k)$, is exactly $\arg\sum e^{i\theta_k}$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $z = a + bi$, $i^2 = -1$ | Complex number; point $(a, b)$ in the plane |
| $\lvert z\rvert = \sqrt{a^2 + b^2}$, $\arg z = \operatorname{atan2}(b, a)$ | Modulus and argument; never $\arctan(b/a)$ |
| $\bar z = a - bi$, $z\bar z = \lvert z\rvert^2$ | Conjugate; used for division |
| $(a + bi)(c + di) = (ac - bd) + (ad + bc)i$ | Cartesian product |
| $z_1z_2 = r_1r_2e^{i(\theta_1 + \theta_2)}$ | Lengths multiply, angles add |
| Multiplying by $e^{i\alpha}$ | Rotation by $\alpha$; the rotation matrix in one step |
| $e^{i\theta} = \cos\theta + i\sin\theta$ | Euler formula; from $f(\alpha)f(\beta) = f(\alpha+\beta)$ and $f(\theta) \approx 1 + i\theta$ |
| $e^{i\pi} = -1$, $e^{-i\theta} = \overline{e^{i\theta}}$ | Half turn is a sign flip; conjugate reverses the angle |
| $\cos\theta = \frac{e^{i\theta} + e^{-i\theta}}{2}$, $\sin\theta = \frac{e^{i\theta} - e^{-i\theta}}{2i}$ | Sine and cosine from exponentials |
| $(\cos\theta + i\sin\theta)^n = \cos n\theta + i\sin n\theta$ | De Moivre; multiple-angle identities by expansion |
| $z^n = \rho e^{i\phi} \Rightarrow z = \rho^{1/n}e^{i(\phi + 2\pi k)/n}$ | $n$ roots, equally spaced |
| $A\cos(\omega t + \phi) = \operatorname{Re}\big[Ae^{i\phi}e^{i\omega t}\big]$ | Phasor $Ae^{i\phi}$; add sinusoids by adding phasors |
| $G(i\omega)$ | Frequency response; $\lvert G\rvert$ gain, $\arg G$ phase |
| $s = -\zeta\omega_n \pm i\omega_n\sqrt{1 - \zeta^2}$ | Poles; real part decay rate, imaginary part wobble frequency |

This closes the module. The next module, **Python for Scientific Computing**, turns every conversion in these nine lessons into a few lines of NumPy — and `np.arctan2`, `np.hypot`, `np.unwrap` and `np.exp(1j * theta)` are the functions you will reach for first.

::: context imaginary-name A name that stuck by accident
In 1637 the French mathematician René Descartes called numbers like $\sqrt{-1}$ "imaginary", and he did not mean it kindly — he thought they were useless. The name stuck anyway. Two centuries later Carl Friedrich Gauss pushed for the name "complex numbers" and showed them as points in a plane, which made them feel as real as any other number. Today they are ordinary working tools for every electrical and control engineer.
:::

::: context j-engineers Why engineers write j
In electrical engineering the letter $i$ was already taken: it stands for electric current. So electrical and control engineers write $j$ for $\sqrt{-1}$, and you will see $G(j\omega)$ in most control books where this lesson writes $G(i\omega)$. Python follows the engineers: the imaginary unit is written `1j`, so $3 + 4i$ is `3 + 4j` in code. Same number, different letter.
:::

::: context complex-plane A complex number is an arrow
The number $z = 3 + 2i$ is the point three steps right and two steps up. Its length is the modulus, $|z| = \sqrt{13} \approx 3.61$; its angle from the real axis is the argument, about $33.7^\circ$. The conjugate $\bar z = 3 - 2i$ is its mirror image below the axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="340,120 330,115 330,125" fill="#1f2a44"/>
  <line x1="150" y1="212" x2="150" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="150,12 145,22 155,22" fill="#1f2a44"/>
  <text x="318" y="140" font-size="12" fill="#1f2a44">real</text>
  <text x="158" y="22" font-size="12" fill="#1f2a44">imaginary</text>
  <g stroke="#1f2a44" stroke-width="1">
    <line x1="180" y1="116" x2="180" y2="124"/><line x1="210" y1="116" x2="210" y2="124"/><line x1="240" y1="116" x2="240" y2="124"/>
    <line x1="146" y1="90" x2="154" y2="90"/><line x1="146" y1="60" x2="154" y2="60"/>
  </g>
  <line x1="150" y1="120" x2="240" y2="60" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="150" y1="120" x2="240" y2="180" stroke="#8fb8f0" stroke-width="2.5"/>
  <line x1="240" y1="60" x2="240" y2="180" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <circle cx="240" cy="60" r="4.5" fill="#1d6fd1"/>
  <circle cx="240" cy="180" r="4.5" fill="#8fb8f0"/>
  <path d="M180,120 A30,30 0 0,0 174.96,103.36" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="184" y="113" font-size="12" fill="#b4232c">θ</text>
  <text x="182" y="84" font-size="12" fill="#1d6fd1">r</text>
  <text x="248" y="58" font-size="12" fill="#1f2a44">z = 3 + 2i</text>
  <text x="248" y="186" font-size="12" fill="#1f2a44">conjugate 3 − 2i</text>
  <text x="246" y="136" font-size="11" fill="#1f2a44">3</text>
  <text x="138" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
</svg>
```
:::

::: context quarter-turn Four quarter turns bring you home
Start at $1$. Multiply by $i$ and you land on $i$, a quarter turn around. Again: $i \cdot i = -1$, a half turn. Again: $-1 \cdot i = -i$. Once more: $-i \cdot i = 1$, home. So $i^4 = 1$, and the powers of $i$ go round and round: $1, i, -1, -i, 1, \ldots$

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="105" x2="290" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="200" x2="180" y2="10" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="105" r="70" fill="none" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 4"/>
  <g fill="none" stroke="#1d6fd1" stroke-width="2">
    <path d="M260.21,87.95 A82,82 0 0,0 197.05,24.79"/>
    <path d="M162.95,24.79 A82,82 0 0,0 99.79,87.95"/>
    <path d="M99.79,122.05 A82,82 0 0,0 162.95,185.21"/>
    <path d="M197.05,185.21 A82,82 0 0,0 260.21,122.05"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="190.20,23.34 197.88,20.88 196.22,28.70"/>
    <polygon points="98.34,94.80 95.88,87.12 103.70,88.78"/>
    <polygon points="169.80,186.66 162.12,189.12 163.78,181.30"/>
    <polygon points="261.66,115.20 264.12,122.88 256.30,121.22"/>
  </g>
  <g fill="#b4232c">
    <circle cx="250" cy="105" r="4.5"/><circle cx="180" cy="35" r="4.5"/>
    <circle cx="110" cy="105" r="4.5"/><circle cx="180" cy="175" r="4.5"/>
  </g>
  <g font-size="13" fill="#1f2a44">
    <text x="236" y="99">1</text><text x="187" y="50">i</text>
    <text x="114" y="99">−1</text><text x="187" y="170">−i</text>
  </g>
  <g font-size="12" fill="#1d6fd1" text-anchor="middle">
    <text x="252" y="37">× i</text><text x="108" y="37">× i</text>
    <text x="108" y="180">× i</text><text x="252" y="180">× i</text>
  </g>
</svg>
```
:::

::: context compound-interest Where the number e comes from
In 1683 Jacob Bernoulli asked a banking question. A bank pays $100\%$ interest a year. If it adds the interest in two halves, you get $(1 + 1/2)^2 = 2.25$ times your money. In twelve monthly pieces, $(1 + 1/12)^{12} \approx 2.613$. In smaller and smaller pieces the answer creeps up toward a limit, $2.71828\ldots$ — the number now called $e$. The Euler formula is the same compounding, except that each tiny step is a sideways nudge instead of growth.
:::

::: context compound-steps Walking around a circle in straight steps
Here the quarter turn $\theta = \pi/2$ is taken in straight sideways steps, each one $(1 + i\theta/n)$ times the last. With $n = 4$ big steps (orange) the path ends well outside the circle, at length $1.33$. With $n = 16$ smaller steps (blue) it ends much closer, at length $1.08$. As $n$ grows the path hugs the circle and lands exactly on $i$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="205" x2="220" y2="205" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="215" x2="40" y2="20" stroke="#6c7a93" stroke-width="1"/>
  <path d="M170,205 A130,130 0 0,0 40,75" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="170.0,205.0 170.0,153.9 150.0,102.9 109.9,59.7 52.8,32.3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="170.0,205.0 170.0,192.2 168.7,179.5 166.2,166.8 162.5,154.4 157.5,142.4 151.4,130.9 144.1,119.9 135.8,109.7 126.4,100.3 116.1,91.8 105.0,84.4 93.2,78.0 80.7,72.8 67.7,68.8 54.3,66.0 40.7,64.6"/>
  <circle cx="170" cy="205" r="4" fill="#1f2a44"/>
  <circle cx="40" cy="75" r="4" fill="#b4232c"/>
  <text x="174" y="200" font-size="12" fill="#1f2a44">1</text>
  <text x="46" y="92" font-size="12" fill="#b4232c">i</text>
  <text x="200" y="60" font-size="12" fill="#1f2a44">n = 4 steps (orange)</text>
  <text x="200" y="80" font-size="12" fill="#1f2a44">n = 16 steps (blue)</text>
  <text x="200" y="100" font-size="12" fill="#1f2a44">unit circle (black)</text>
</svg>
```
:::

::: context euler-identity Five famous numbers in one line
Move the $-1$ across and $e^{i\pi} = -1$ becomes $e^{i\pi} + 1 = 0$. It links five of the most important numbers in mathematics — $0$, $1$, $e$, $i$ and $\pi$ — with one each of adding, multiplying and raising to a power. Leonhard Euler published the formula $e^{i\theta} = \cos\theta + i\sin\theta$ in 1748. In plain words the identity says something almost obvious once you have this lesson: turning halfway around makes you face backward.
:::

::: context time-constant What a time constant means
Give a first-order lag a sudden step — say, move a temperature sensor from a cold room into a warm one. Its reading does not jump; it creeps toward the new value. After one time constant $\tau$ it has covered about $63\%$ of the gap, after three about $95\%$. The corner frequency $\omega = 1/\tau$ is where fast wiggles start being smoothed away: well below it the sensor keeps up, well above it the wiggles barely get through.
:::

::: context decibel Decibels for gain
Engineers measure gain on a logarithmic scale because gains of whole chains of parts multiply, and logarithms turn multiplying into adding. For an amplitude ratio $|G|$, the gain in decibels is $20\log_{10}|G|$. A gain of $1$ is $0$ dB, $10$ is $+20$ dB, $0.1$ is $-20$ dB. The famous $-3$ dB point is $|G| = 0.707$, where the signal's power — which goes as amplitude squared — has fallen to half.
:::

::: context poles-word Why they are called poles
Write a system's response as a fraction whose bottom is the characteristic polynomial. At a root of that polynomial the bottom is zero, so the response shoots up to infinity. If you draw the size of the response as a surface over the complex plane, it has tall spikes at those points, like the poles holding up a circus tent. That picture gave them the name. Where the poles sit — left or right of the imaginary axis, near or far from the real axis — tells you whether a system settles down, wobbles, or runs away.
:::
