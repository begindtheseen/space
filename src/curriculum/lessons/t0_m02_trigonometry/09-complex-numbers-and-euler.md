---
id: l09-complex-numbers-and-euler
title: Complex numbers and the Euler formula
minutes: 18
covers:
  - complex numbers and Euler formula
---

Lesson 4 wrote a rotation as a two-by-two matrix and showed that composing rotations meant multiplying matrices, with the sum formulas doing the bookkeeping. Lesson 7 wrote a point as a radius and an angle. Complex numbers fuse those two ideas: a point in the plane becomes a single number $z = r e^{i\theta}$, and rotating it through an angle $\alpha$ becomes multiplication by $e^{i\alpha}$. The sum formulas, the double-angle formulas, the polar conversion and the rotation matrix all become instances of one rule — multiply the lengths, add the angles — and identities you had to memorise become things you can derive in a line.

That would be reason enough to learn them. But complex numbers also run through the control-systems half of this curriculum. Every sinusoidal signal is the real part of a rotating complex number; the response of a filter or a control loop to a sinusoid is a single complex number whose modulus is the gain and whose argument is the phase lag; and the poles of a system — the roots of its characteristic polynomial — are complex numbers whose real parts are decay rates and whose imaginary parts are oscillation frequencies. The Bode plot, the Nyquist plot and the root locus are all pictures in the complex plane. Further along, the quaternions that attitude software uses to represent three-dimensional rotations are complex numbers with three imaginary units instead of one, and $e^{i\theta}$ is the template for how they work.

This lesson defines complex numbers and their arithmetic, shows that multiplication is rotation, derives the Euler formula from the exponential's compounding property and the small-angle result of lesson 6, and then uses it: to regenerate identities, to add sinusoids, and to read the gain and phase of a control element.

## The complex plane

A **complex number** is $z = a + bi$, where $a$ and $b$ are real and $i$ is a symbol obeying $i^2 = -1$. The **real part** is $\operatorname{Re} z = a$ and the **imaginary part** is $\operatorname{Im} z = b$. Nothing about $i$ is imaginary in the everyday sense; it is a second axis. Plot $z$ as the point $(a, b)$ — real part along $x$, imaginary part along $y$ — and the set of complex numbers is the plane. Real numbers lie on the horizontal axis, and $i$ itself sits one unit up the vertical axis.

Addition is vector addition, component by component: $(a + bi) + (c + di) = (a + c) + (b + d)i$. Multiplication follows from expanding the product and using $i^2 = -1$:

$$
(a + bi)(c + di) = ac + adi + bci + bd\,i^2 = (ac - bd) + (ad + bc)i .
$$

For instance $(3 + 4i)(1 - 2i) = 3 - 6i + 4i - 8i^2 = 3 - 2i + 8 = 11 - 2i$.

Three more definitions. The **modulus** $|z| = \sqrt{a^2 + b^2}$ is the distance of the point from the origin. The **argument** $\arg z$ is the angle of the point from the positive real axis, and after lesson 3 you know how it must be computed:

$$
\arg z = \operatorname{atan2}(b, a) \in (-\pi, \pi] .
$$

The **complex conjugate** $\bar z = a - bi$ is the reflection of $z$ in the real axis; it has the same modulus and the opposite argument. Its main use is that $z\bar z = a^2 + b^2 = |z|^2$ is real, which is how division is done: multiply top and bottom by the conjugate of the denominator. $\dfrac{3 + 4i}{1 - 2i} = \dfrac{(3 + 4i)(1 + 2i)}{(1 - 2i)(1 + 2i)} = \dfrac{3 + 6i + 4i + 8i^2}{1 + 4} = \dfrac{-5 + 10i}{5} = -1 + 2i$.

::: warning The argument is an atan2
$\arg(a + bi) = \operatorname{atan2}(b, a)$, never $\arctan(b/a)$. The number $-1 - i$ has argument $-135^\circ$; $\arctan(1) = 45^\circ$ puts it in the wrong half of the plane. Python's `cmath.phase(z)` and NumPy's `np.angle(z)` both do this correctly.
:::

## Polar form, and why multiplication is rotation

A point at distance $r$ and angle $\theta$ has Cartesian coordinates $(r\cos\theta, r\sin\theta)$ by lesson 7, so the complex number there is

$$
z = r(\cos\theta + i\sin\theta), \qquad r = |z|, \quad \theta = \arg z .
$$

Multiply two numbers in this form, $z_1 = r_1(\cos\theta_1 + i\sin\theta_1)$ and $z_2 = r_2(\cos\theta_2 + i\sin\theta_2)$, using the product rule above:

$$
z_1 z_2 = r_1 r_2\big[(\cos\theta_1\cos\theta_2 - \sin\theta_1\sin\theta_2) + i(\sin\theta_1\cos\theta_2 + \cos\theta_1\sin\theta_2)\big] = r_1 r_2\big[\cos(\theta_1 + \theta_2) + i\sin(\theta_1 + \theta_2)\big],
$$

by the sum formulas of lesson 4. **The moduli multiply and the arguments add.** Check on the numbers above: $|3 + 4i| = 5$ at $\operatorname{atan2}(4, 3) = 53.13^\circ$, and $|1 - 2i| = \sqrt 5 = 2.236$ at $\operatorname{atan2}(-2, 1) = -63.43^\circ$. The product should have modulus $5\sqrt 5 = 11.18$ and argument $-10.30^\circ$; and indeed $|11 - 2i| = \sqrt{125} = 11.18$ with $\operatorname{atan2}(-2, 11) = -10.30^\circ$. Division is the reverse: moduli divide, arguments subtract, so $(3 + 4i)/(1 - 2i)$ has modulus $5/\sqrt 5 = \sqrt 5$ at $53.13^\circ + 63.43^\circ = 116.57^\circ$, matching $-1 + 2i$.

Now let $z_2$ have modulus 1: $z_2 = \cos\alpha + i\sin\alpha$. Multiplying by it leaves the modulus of $z_1$ alone and adds $\alpha$ to its argument — it **rotates** $z_1$ counterclockwise by $\alpha$. Written out in components, $(x + iy)(\cos\alpha + i\sin\alpha) = (x\cos\alpha - y\sin\alpha) + i(x\sin\alpha + y\cos\alpha)$, which is exactly the rotation matrix of lesson 4 applied to $(x, y)$. The number $i$ is the unit complex number at $90^\circ$, so multiplying by $i$ is a quarter turn, and $i \cdot i = -1$ says two quarter turns make a half turn. That is the geometric content of $i^2 = -1$.

::: example Rotating a vector by complex multiplication
Lesson 4 rotated the displacement $(3.00, 1.00)$ km by $40^\circ$. As a complex number the displacement is $3 + i$. The rotation is multiplication by $\cos 40^\circ + i\sin 40^\circ = 0.7660 + 0.6428i$:

$$
(3 + i)(0.7660 + 0.6428i) = (3 \times 0.7660 - 1 \times 0.6428) + i(3 \times 0.6428 + 1 \times 0.7660) = 1.655 + 2.694i .
$$

The rotated displacement is $(1.655, 2.694)$ km, as before, with modulus $\sqrt{1.655^2 + 2.694^2} = 3.162$ km unchanged. In polar terms: $3 + i$ has modulus $3.162$ at $18.43^\circ$, the rotation has modulus 1 at $40^\circ$, and the product has modulus $3.162$ at $58.43^\circ$. A rotation by $-90^\circ$ is multiplication by $-i$: $(2 - 5i)(-i) = -2i + 5i^2 = -5 - 2i$, so $(2, -5)$ goes to $(-5, -2)$, which you can confirm by drawing it.
:::

## The Euler formula

Write $f(\theta) = \cos\theta + i\sin\theta$ for the unit complex number at angle $\theta$. The product rule just derived says

$$
f(\alpha)\,f(\beta) = f(\alpha + \beta), \qquad f(0) = 1 .
$$

Adding the inputs multiplies the outputs. That is the defining property of an exponential function: $c^{\alpha}c^{\beta} = c^{\alpha + \beta}$ and $c^0 = 1$, and (for a continuous function) nothing else has it. So $f(\theta)$ must be some base raised to the power $\theta$, and the only question is which base.

The base is fixed by behaviour near zero. Module 1 introduced $e$ as the base for which $e^x \approx 1 + x$ when $x$ is small — equivalently, the limit of compound growth, $e^x = \lim_{n \to \infty}(1 + x/n)^n$. Lesson 6 gave the small-angle behaviour of $f$: for small $\theta$, $\cos\theta \approx 1$ and $\sin\theta \approx \theta$, so

$$
f(\theta) \approx 1 + i\theta .
$$

Now compound. Split the angle $\theta$ into $n$ equal pieces. By the product rule, $f(\theta) = f(\theta/n)^n$, and for large $n$ each factor is $1 + i\theta/n$ to high accuracy:

$$
f(\theta) = \lim_{n \to \infty}\left(1 + \frac{i\theta}{n}\right)^n = e^{i\theta} ,
$$

by the compound-growth definition of the exponential with $x = i\theta$. That is the **Euler formula**:

$$
e^{i\theta} = \cos\theta + i\sin\theta .
$$

Geometrically, $(1 + i\theta/n)^n$ takes $n$ tiny steps, each one nudging the point sideways (the factor $i$) by a fraction $\theta/n$ of its current distance, which is what walking along a circle looks like. Numerically, with $\theta = 1$: $(1 + i/10)^{10} = 0.571 + 0.883i$, $(1 + i/1000)^{1000} = 0.5406 + 0.8419i$, and $(1 + i/10^6)^{10^6} = 0.54030 + 0.84147i$, converging to $\cos 1 + i\sin 1 = 0.54030 + 0.84147i$. The modulus of each approximation is slightly above 1 — $1.0510$ for $n = 10$, $1.0005$ for $n = 1000$ — because each straight step overshoots the circle a little; the overshoot vanishes in the limit.

::: key Euler formula
$e^{i\theta} = \cos\theta + i\sin\theta$. Multiplying a complex number by $e^{i\theta}$ rotates it counterclockwise by $\theta$ and leaves its modulus unchanged.
:::

::: note The series check
If you already know the exponential series $e^x = 1 + x + x^2/2! + x^3/3! + \cdots$, put $x = i\theta$ and sort the terms by powers of $i$: the even powers give $1 - \theta^2/2! + \theta^4/4! - \cdots$, which is the cosine series, and the odd powers give $i(\theta - \theta^3/3! + \cdots)$, the sine series — with the $\theta^3/6$ of lesson 6 sitting in its place. The calculus module derives those series; the compounding argument above needs only what this module has built.
:::

Some immediate consequences. $|e^{i\theta}| = 1$ for every real $\theta$, since $\cos^2 + \sin^2 = 1$. Replacing $\theta$ by $-\theta$ and using even/odd symmetry, $e^{-i\theta} = \cos\theta - i\sin\theta = \overline{e^{i\theta}}$. At $\theta = \pi$, $e^{i\pi} = -1$: a half turn is a sign flip. Adding and subtracting the expressions for $e^{i\theta}$ and $e^{-i\theta}$ isolates the trigonometric functions,

$$
\cos\theta = \frac{e^{i\theta} + e^{-i\theta}}{2}, \qquad \sin\theta = \frac{e^{i\theta} - e^{-i\theta}}{2i},
$$

which is how sines and cosines are converted to exponentials whenever the algebra of exponentials is easier — which is nearly always.

### Polar form as an exponential, and De Moivre

Every complex number is now $z = re^{i\theta}$, and the product rule is a one-liner: $r_1e^{i\theta_1}\cdot r_2e^{i\theta_2} = r_1r_2e^{i(\theta_1 + \theta_2)}$. Raising to a power is repeated multiplication,

$$
\left(re^{i\theta}\right)^n = r^ne^{in\theta}, \qquad \text{so} \qquad (\cos\theta + i\sin\theta)^n = \cos n\theta + i\sin n\theta ,
$$

which is **De Moivre's formula**. It regenerates the multiple-angle identities by expanding the left side and matching real and imaginary parts. For $n = 2$: $(\cos\theta + i\sin\theta)^2 = \cos^2\theta - \sin^2\theta + 2i\sin\theta\cos\theta$, so $\cos 2\theta = \cos^2\theta - \sin^2\theta$ and $\sin 2\theta = 2\sin\theta\cos\theta$ — the double-angle formulas in one line. For $n = 3$, with $c = \cos\theta$ and $s = \sin\theta$: $(c + is)^3 = c^3 + 3c^2(is) + 3c(is)^2 + (is)^3 = (c^3 - 3cs^2) + i(3c^2s - s^3)$. Using $s^2 = 1 - c^2$ in the real part and $c^2 = 1 - s^2$ in the imaginary part, $\cos 3\theta = 4\cos^3\theta - 3\cos\theta$ and $\sin 3\theta = 3\sin\theta - 4\sin^3\theta$: the triple-angle formula that lesson 6 used to find the $\theta^3/6$ coefficient, obtained here without any sum formula.

De Moivre also solves equations of the form $z^n = w$. Write $w = \rho e^{i\phi}$; then $z = \rho^{1/n}e^{i(\phi + 2\pi k)/n}$ for $k = 0, 1, \ldots, n - 1$, because $e^{i\phi}$ and $e^{i(\phi + 2\pi k)}$ are the same number and the division by $n$ spreads the $n$ copies apart. So $z^3 = 8$ has three solutions: $2$, $2e^{i2\pi/3} = -1 + 1.732i$ and $2e^{i4\pi/3} = -1 - 1.732i$, equally spaced around a circle of radius 2. The roots of a characteristic polynomial come in this kind of pattern, and the reason a real polynomial's complex roots occur in conjugate pairs is that conjugation is reflection in the real axis, which the polynomial's real coefficients cannot tell from the original.

## Sinusoids as rotating vectors

A signal $A\cos(\omega t + \phi)$ is the real part of $Ae^{i(\omega t + \phi)} = Ae^{i\phi}e^{i\omega t}$: a complex number of modulus $A$ and argument $\phi$, rotating at angular rate $\omega$. The fixed number $Ae^{i\phi}$ is the **phasor** of the signal. Since $e^{i\omega t}$ is common to every signal at the same frequency, adding such signals means adding their phasors, and the result is a single sinusoid at that frequency whose amplitude and phase are the modulus and argument of the phasor sum. This is the $a\cos\omega t + b\sin\omega t$ combination of lesson 4 in its general form, and it handles any number of terms with any phases.

::: example Adding two vibration signals
Two accelerometers on a structure report the same frequency with different phases: $0.20\cos(\omega t + 30^\circ)$ and $0.15\cos(\omega t - 45^\circ)$, in $\mathrm{m/s^2}$. Their phasors are $0.20e^{i30^\circ} = 0.1732 + 0.1000i$ and $0.15e^{-i45^\circ} = 0.1061 - 0.1061i$. The sum is $0.2793 - 0.0061i$, with modulus $0.2793$ and argument $\operatorname{atan2}(-0.0061, 0.2793) = -1.24^\circ$. So the combined signal is $0.279\cos(\omega t - 1.24^\circ)$ — smaller than the arithmetic sum $0.35$ because the two are partly out of phase. Check at $\omega t = 0.7$ rad: the two original terms give $0.20\cos(0.7 + 0.5236) + 0.15\cos(0.7 - 0.7854) = 0.0681 + 0.1495 = 0.2175$, and the combined form gives $0.2793\cos(0.7 - 0.0217) = 0.2175$.
:::

### Gain and phase of a control element

The payoff for control work is that a linear element — a filter, an actuator, a sensor, a whole loop — acting on a sinusoid produces a sinusoid at the same frequency, scaled and shifted. Feed in $e^{i\omega t}$ and the output is $G(i\omega)e^{i\omega t}$, where $G(i\omega)$ is a single complex number, the **frequency response** at that $\omega$. Its modulus is the amplitude ratio, or gain, and its argument is the phase shift. A first-order lag with time constant $\tau$ — a rate gyro's bandwidth limit, a thermal sensor, a simple low-pass filter — has

$$
G(i\omega) = \frac{1}{1 + i\omega\tau} .
$$

At $\omega\tau = 2$: $G = \dfrac{1}{1 + 2i} = \dfrac{1 - 2i}{5} = 0.2 - 0.4i$, so $|G| = \sqrt{0.04 + 0.16} = 0.447$ and $\arg G = \operatorname{atan2}(-0.4, 0.2) = -63.4^\circ$. An input sinusoid at twice the corner frequency comes out at 44.7% of its amplitude (in decibels, $20\log_{10}0.447 = -7.0$ dB) and lagging by $63.4^\circ$. At $\omega\tau = 1$ the gain is $0.707$ ($-3.0$ dB) and the lag $45^\circ$; at $\omega\tau = 0.5$, $0.894$ and $26.6^\circ$. Those pairs of numbers, plotted against $\omega$, are a Bode plot, and the phase lag is the quantity that eats a control loop's stability margin as the frequency rises.

::: example Poles of a second-order system
A damped oscillator — a spacecraft's attitude loop with proportional and rate feedback, a landing gear, a fuel-slosh mode — has characteristic equation $s^2 + 2\zeta\omega_n s + \omega_n^2 = 0$, with natural frequency $\omega_n$ and damping ratio $\zeta$. The quadratic formula gives $s = -\zeta\omega_n \pm i\omega_n\sqrt{1 - \zeta^2}$ when $\zeta < 1$: a conjugate pair. For $\omega_n = 2$ rad/s and $\zeta = 0.3$, $s = -0.6 \pm 1.908i$.

Read the pole as a complex number. Its modulus is $\sqrt{0.36 + 3.640} = 2.0 = \omega_n$: every pole with the same natural frequency lies on the same circle. Its argument measured from the negative real axis is $\arccos\zeta = 72.5^\circ$: every pole with the same damping ratio lies on the same ray. The real part, $-0.6\ \mathrm{s^{-1}}$, is the decay rate of the response envelope, $e^{-0.6t}$; the imaginary part, $1.908$ rad/s, is the frequency of the oscillation inside the envelope, since the solution contains $e^{st} = e^{-0.6t}e^{\pm 1.908it}$ and the Euler formula turns the second factor into $\cos 1.908t$ and $\sin 1.908t$. Moving the poles left speeds the decay; moving them toward the real axis reduces the oscillation. That is the whole language of pole placement, and it is the Euler formula applied to $e^{st}$.
:::

::: note Toward quaternions
Rotations of the plane form a one-parameter family, and $e^{i\theta}$ parameterises it so that composition is multiplication. Rotations of three-dimensional space need three parameters, and the analogous objects are the unit quaternions $q = \cos(\theta/2) + \hat{\mathbf{n}}\sin(\theta/2)$, with a unit vector $\hat{\mathbf{n}}$ built from three imaginary units in place of $i$. Composition of rotations is again multiplication, and the same "half angle" that appears in $e^{i\theta/2}\cdot e^{i\theta/2} = e^{i\theta}$ appears in the quaternion. 3Blue1Brown's video on the Euler formula, listed in the module resources, is a good place to build the picture before the attitude modules make it formal.
:::

## Check yourself

::: check
Compute $(1 + i)^8$ two ways: by repeated squaring in Cartesian form, and by De Moivre.
:::

::: answer
Squaring: $(1 + i)^2 = 1 + 2i + i^2 = 2i$; $(2i)^2 = -4$; $(-4)^2 = 16$. So $(1 + i)^8 = 16$. By De Moivre: $|1 + i| = \sqrt 2$ and $\arg(1 + i) = 45^\circ$, so $(1 + i)^8 = (\sqrt 2)^8 e^{i \cdot 8 \times 45^\circ} = 16e^{i360^\circ} = 16$. Eight turns of $45^\circ$ bring the argument back to the positive real axis.
:::

::: check
Find all solutions of $z^2 = i$ and mark where they lie on the unit circle.
:::

::: answer
$i = e^{i\pi/2}$ has modulus 1 and argument $90^\circ$, so its square roots have modulus 1 and arguments $45^\circ$ and $45^\circ + 180^\circ = 225^\circ$: $z = \pm(\cos 45^\circ + i\sin 45^\circ) = \pm(0.7071 + 0.7071i)$. Check: $(0.7071 + 0.7071i)^2 = 0.5 + 2(0.5)i + 0.5i^2 = i$. The two roots are diametrically opposite, as the two square roots of any number are.
:::

::: check
A first-order lag $G(i\omega) = 1/(1 + i\omega\tau)$ is driven at $\omega\tau = 3$. What are the gain in decibels and the phase lag? Why must the phase be computed with atan2 even though here $\arctan$ would give the same answer?
:::

::: answer
$G = 1/(1 + 3i) = (1 - 3i)/10 = 0.1 - 0.3i$. $|G| = \sqrt{0.01 + 0.09} = 0.3162$, which is $20\log_{10}0.3162 = -10.0$ dB. Phase $= \operatorname{atan2}(-0.3, 0.1) = -71.6^\circ$. Here the real part is positive so $\arctan(-3) = -71.6^\circ$ agrees; but for a system with more than one lag the real part of $G$ goes negative at high frequency and the phase passes through $-90^\circ$ toward $-180^\circ$, where $\arctan$ of the ratio would report the phase wrong by $180^\circ$ — precisely at the frequencies where stability is decided.
:::

::: check
Using De Moivre with $n = 3$, derive the formula for $\cos 3\theta$ in terms of $\cos\theta$ and check it at $\theta = 25^\circ$.
:::

::: answer
The real part of $(c + is)^3$ is $c^3 - 3cs^2$. With $s^2 = 1 - c^2$: $c^3 - 3c(1 - c^2) = 4c^3 - 3c$, so $\cos 3\theta = 4\cos^3\theta - 3\cos\theta$. At $25^\circ$, $\cos 25^\circ = 0.9063$: $4 \times 0.7445 - 3 \times 0.9063 = 2.978 - 2.719 = 0.2588$, and $\cos 75^\circ = 0.2588$.
:::

::: check
Two heading readings are $350^\circ$ and $10^\circ$. Represent each as a unit complex number, add them, and interpret the modulus and argument of the sum in the language of lesson 3.
:::

::: answer
$e^{i350^\circ} = 0.9848 - 0.1736i$ and $e^{i10^\circ} = 0.9848 + 0.1736i$. The sum is $1.9696 + 0i$, with argument $0^\circ$ and modulus $1.9696$. The argument is the circular mean of the two headings — due north, not the arithmetic mean $180^\circ$ — and the modulus divided by the number of readings, $0.985$, is the mean resultant length, close to 1 because the readings agree closely. The circular mean formula of lesson 3, $\operatorname{atan2}(\sum\sin\theta_k, \sum\cos\theta_k)$, is exactly $\arg\sum e^{i\theta_k}$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $z = a + bi$, $i^2 = -1$ | Complex number; point $(a, b)$ in the plane |
| $\lvert z\rvert = \sqrt{a^2 + b^2}$, $\arg z = \operatorname{atan2}(b, a)$ | Modulus and argument; never $\arctan(b/a)$ |
| $\bar z = a - bi$, $z\bar z = \lvert z\rvert^2$ | Conjugate; used for division |
| $(a + bi)(c + di) = (ac - bd) + (ad + bc)i$ | Cartesian product |
| $z_1z_2 = r_1r_2e^{i(\theta_1 + \theta_2)}$ | Moduli multiply, arguments add |
| Multiplying by $e^{i\alpha}$ | Rotation by $\alpha$; the rotation matrix of lesson 4 |
| $e^{i\theta} = \cos\theta + i\sin\theta$ | Euler formula; from $f(\alpha)f(\beta) = f(\alpha+\beta)$ and $f(\theta) \approx 1 + i\theta$ |
| $e^{i\pi} = -1$, $e^{-i\theta} = \overline{e^{i\theta}}$ | Half turn is a sign flip; conjugate reverses the angle |
| $\cos\theta = \frac{e^{i\theta} + e^{-i\theta}}{2}$, $\sin\theta = \frac{e^{i\theta} - e^{-i\theta}}{2i}$ | Trigonometric functions from exponentials |
| $(\cos\theta + i\sin\theta)^n = \cos n\theta + i\sin n\theta$ | De Moivre; multiple-angle identities by expansion |
| $z^n = \rho e^{i\phi} \Rightarrow z = \rho^{1/n}e^{i(\phi + 2\pi k)/n}$ | $n$ roots, equally spaced |
| $A\cos(\omega t + \phi) = \operatorname{Re}\big[Ae^{i\phi}e^{i\omega t}\big]$ | Phasor $Ae^{i\phi}$; add sinusoids by adding phasors |
| $G(i\omega)$ | Frequency response; $\lvert G\rvert$ gain, $\arg G$ phase |
| $s = -\zeta\omega_n \pm i\omega_n\sqrt{1 - \zeta^2}$ | Poles; real part decay rate, imaginary part damped frequency |

This closes the module. The next module turns to Python and NumPy, where every conversion in these nine lessons becomes a few vectorised lines — and where `np.arctan2`, `np.hypot`, `np.unwrap` and `np.exp(1j * theta)` are the functions you will reach for first.
