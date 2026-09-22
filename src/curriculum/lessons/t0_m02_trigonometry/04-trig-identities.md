---
id: l04-trig-identities
title: Trigonometric identities
minutes: 16
covers:
  - "identities: Pythagorean, sum/difference, double-angle"
---

A rotation followed by a rotation is a rotation. That sentence is the reason trigonometric identities matter to a guidance engineer. When a spacecraft yaws through $35^\circ$ and its camera is mounted $20^\circ$ off the body axis, the camera points $55^\circ$ from the reference direction, and the components of that direction — $\cos 55^\circ$ and $\sin 55^\circ$ — must be expressible in terms of the components of the two rotations you started with. The sum formulas are that expression. Every direction-cosine matrix, every sequence of Euler angles and every quaternion product is the sum formulas applied over and over in three dimensions.

Identities do a second job. Physical laws often hand you a product or a square of trigonometric functions — the gravity-gradient torque on a spacecraft goes as $\sin\theta\cos\theta$, the power of a sinusoidal signal as $\sin^2\omega t$ — and the double-angle formulas turn those into a single sinusoid whose frequency and amplitude you can read off. They also let you linearise: the small-angle results of lesson 6 come straight out of the identities derived here.

This lesson derives three families from the unit circle: the Pythagorean identities, the sum and difference formulas, and the double-angle and half-angle formulas. Nothing here is to be memorised as a bare string of symbols; each one is a fact about the circle that you can rebuild in a minute if you forget it.

## Pythagorean identities

The point at angle $\theta$ on the unit circle has coordinates $(\cos\theta, \sin\theta)$, and every point on the unit circle satisfies $x^2 + y^2 = 1$. Therefore, for every angle,

$$
\sin^2\theta + \cos^2\theta = 1 .
$$

That is the whole proof. The identity says a direction has unit length, nothing more, which is why it survives for any $\theta$ — negative, obtuse, larger than a full turn.

Divide through by $\cos^2\theta$ (allowed wherever $\cos\theta \ne 0$) and use $\tan = \sin/\cos$, $\sec = 1/\cos$:

$$
\tan^2\theta + 1 = \sec^2\theta .
$$

Divide instead by $\sin^2\theta$ to get $1 + \cot^2\theta = \csc^2\theta$. The three forms are one fact in three coordinate systems.

::: key Pythagorean identity and its tangent form
$\sin^2\theta + \cos^2\theta = 1$ and $1 + \tan^2\theta = \sec^2\theta$. The first says the unit-circle point has length one; the second is the first divided by $\cos^2\theta$.
:::

The everyday use is recovering one function from another. If you know $\sin\theta = 0.6$, then $\cos^2\theta = 1 - 0.36 = 0.64$ and $\cos\theta = \pm 0.8$. The identity cannot tell you the sign; the quadrant must. In quadrant II the cosine is negative, so $\cos\theta = -0.8$ and $\tan\theta = 0.6/(-0.8) = -0.75$. Forgetting the sign choice here is the algebraic twin of the $\arctan$ quadrant bug of lesson 3.

The tangent form appears whenever a slope is known and a direction is needed. A flight-path angle $\gamma$ with $\tan\gamma = 0.4$ has $\sec^2\gamma = 1.16$, so $\cos\gamma = 1/\sqrt{1.16} = 0.9285$ and $\sin\gamma = 0.4 \times 0.9285 = 0.3714$ — the same numbers you would get from the right triangle with legs 1 and 0.4, arranged as an identity you can apply without drawing anything.

::: warning A square root has two signs
$\cos\theta = \sqrt{1 - \sin^2\theta}$ is only true in quadrants I and IV. Whenever you use a Pythagorean identity to recover a function, write down which quadrant you are in and choose the sign from it. Code that takes `math.sqrt(1 - s*s)` for the cosine silently assumes $|\theta| \le 90^\circ$.
:::

## The sum and difference formulas

Take two directions on the unit circle, $\mathbf{u} = (\cos\alpha, \sin\alpha)$ and $\mathbf{v} = (\cos\beta, \sin\beta)$. The angle between them is $\alpha - \beta$. There are two ways to compute the dot product $\mathbf{u}\cdot\mathbf{v}$. Component by component it is $\cos\alpha\cos\beta + \sin\alpha\sin\beta$. Geometrically the dot product of two unit vectors is the cosine of the angle between them, $\cos(\alpha - \beta)$. Equating the two:

$$
\cos(\alpha - \beta) = \cos\alpha\cos\beta + \sin\alpha\sin\beta .
$$

If you have not met the dot product yet, the same result comes from the distance between the two points, computed once with the distance formula and once with the law of cosines of the next lesson; either route gives the same line. Everything else in this section follows from this one formula and the symmetries of lesson 1.

Replace $\beta$ by $-\beta$. Cosine is even and sine is odd, so $\cos(-\beta) = \cos\beta$ and $\sin(-\beta) = -\sin\beta$:

$$
\cos(\alpha + \beta) = \cos\alpha\cos\beta - \sin\alpha\sin\beta .
$$

For the sine, use the cofunction identity $\sin\phi = \cos(\pi/2 - \phi)$ with $\phi = \alpha + \beta$:

$$
\sin(\alpha + \beta) = \cos\!\left(\left(\tfrac{\pi}{2} - \alpha\right) - \beta\right) = \cos\!\left(\tfrac{\pi}{2} - \alpha\right)\cos\beta + \sin\!\left(\tfrac{\pi}{2} - \alpha\right)\sin\beta = \sin\alpha\cos\beta + \cos\alpha\sin\beta .
$$

Replacing $\beta$ by $-\beta$ once more gives the difference form. Collected:

$$
\begin{aligned}
\sin(\alpha \pm \beta) &= \sin\alpha\cos\beta \pm \cos\alpha\sin\beta, \\
\cos(\alpha \pm \beta) &= \cos\alpha\cos\beta \mp \sin\alpha\sin\beta .
\end{aligned}
$$

Read the signs carefully: the sine formula keeps the sign of the argument, the cosine formula flips it. A quick check that catches most slips is $\beta = 0$, which must return $\sin\alpha$ and $\cos\alpha$, and $\alpha = \beta = \pi/4$, which must return $\sin(\pi/2) = 1$ and $\cos(\pi/2) = 0$: indeed $2 \times \tfrac{\sqrt 2}{2}\tfrac{\sqrt 2}{2} = 1$ and $\tfrac{1}{2} - \tfrac{1}{2} = 0$.

Dividing the sine formula by the cosine formula and then dividing top and bottom by $\cos\alpha\cos\beta$ gives the tangent version:

$$
\tan(\alpha \pm \beta) = \frac{\tan\alpha \pm \tan\beta}{1 \mp \tan\alpha\tan\beta} .
$$

With $\alpha = 30^\circ$, $\beta = 45^\circ$: $\tan 75^\circ = (0.5774 + 1)/(1 - 0.5774) = 3.732$, which matches $\tan 75^\circ$ directly.

### The sum formulas are the rotation matrix

Here is the same fact in the form you will use most. Rotating the vector $(x, y) = (r\cos\beta, r\sin\beta)$ counterclockwise by $\alpha$ produces a vector of the same length at angle $\alpha + \beta$, whose components by the sum formulas are

$$
\begin{aligned}
x' &= r\cos(\alpha + \beta) = x\cos\alpha - y\sin\alpha, \\
y' &= r\sin(\alpha + \beta) = x\sin\alpha + y\cos\alpha .
\end{aligned}
$$

In matrix form,

$$
\begin{pmatrix} x' \\ y' \end{pmatrix} = \begin{pmatrix} \cos\alpha & -\sin\alpha \\ \sin\alpha & \cos\alpha \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} .
$$

The sum formulas *are* the statement that this matrix rotates. Multiply two such matrices, one for $\alpha$ and one for $\beta$, and the top-left entry of the product is $\cos\alpha\cos\beta - \sin\alpha\sin\beta$; the claim that two rotations compose to a rotation by $\alpha + \beta$ is exactly the claim that this equals $\cos(\alpha + \beta)$. The linear algebra modules build three-dimensional rotations out of this two-dimensional block.

::: example Rotating a vector two ways
A displacement in a landing-site frame is $(x, y) = (3.00, 1.00)$ km. A guidance routine rotates that vector $40^\circ$ counterclockwise. Compute the components of the rotated vector.

By the matrix, with $\cos 40^\circ = 0.7660$ and $\sin 40^\circ = 0.6428$: $x' = 3.00 \times 0.7660 - 1.00 \times 0.6428 = 1.655$ km and $y' = 3.00 \times 0.6428 + 1.00 \times 0.7660 = 2.694$ km.

By polar coordinates: the original vector has length $\sqrt{10} = 3.162$ km at angle $\operatorname{atan2}(1, 3) = 18.43^\circ$. After rotation it is at $58.43^\circ$, so its components are $3.162\cos 58.43^\circ = 1.655$ km and $3.162\sin 58.43^\circ = 2.694$ km. Same numbers, because the sum formula is what connects the two computations. The length is unchanged, $\sqrt{1.655^2 + 2.694^2} = 3.162$ km, as a rotation demands.
:::

### Exact values for new angles

The sum formulas extend the special-angle table. $75^\circ = 45^\circ + 30^\circ$, so

$$
\cos 75^\circ = \cos 45^\circ\cos 30^\circ - \sin 45^\circ\sin 30^\circ = \frac{\sqrt 2}{2}\cdot\frac{\sqrt 3}{2} - \frac{\sqrt 2}{2}\cdot\frac{1}{2} = \frac{\sqrt 6 - \sqrt 2}{4} \approx 0.2588 ,
$$

and by the cofunction identity $\sin 15^\circ$ has the same value. This is a useful check on a calculator, but the real use of the sum formulas is with symbols, not numbers: they are how you show that a phase shift of $\pi/2$ turns a sine into a cosine, $\sin(\theta + \pi/2) = \sin\theta\cos\tfrac{\pi}{2} + \cos\theta\sin\tfrac{\pi}{2} = \cos\theta$, and how the shifts by $\pi$ and $-\theta$ of lesson 1 reappear as special cases.

## Double-angle and half-angle formulas

Set $\beta = \alpha = \theta$ in the sum formulas:

$$
\sin 2\theta = 2\sin\theta\cos\theta, \qquad \cos 2\theta = \cos^2\theta - \sin^2\theta .
$$

The cosine formula has two more faces. Substitute $\cos^2\theta = 1 - \sin^2\theta$ to get $\cos 2\theta = 1 - 2\sin^2\theta$, or $\sin^2\theta = 1 - \cos^2\theta$ to get $\cos 2\theta = 2\cos^2\theta - 1$. Which face you want depends on what you are trying to eliminate. For $\theta = 0.3$ rad, all three evaluate to $0.8253$, as they must.

::: key Double-angle identities
$\sin 2\theta = 2\sin\theta\cos\theta$ and $\cos 2\theta = \cos^2\theta - \sin^2\theta = 1 - 2\sin^2\theta = 2\cos^2\theta - 1$. Both come from the sum formulas with $\alpha = \beta = \theta$.
:::

For the tangent, $\tan 2\theta = 2\tan\theta/(1 - \tan^2\theta)$, from the tangent sum formula.

Solve the second and third cosine forms for the squares and you have the **power-reduction** or **half-angle** formulas:

$$
\sin^2\theta = \frac{1 - \cos 2\theta}{2}, \qquad \cos^2\theta = \frac{1 + \cos 2\theta}{2} .
$$

These convert a squared sinusoid — a power, an energy, a squared error — into a constant plus a sinusoid at twice the frequency. A signal $\sin^2\omega t$ has mean value $1/2$ and oscillates about it at angular frequency $2\omega$; that is why the power in an alternating current pulses at twice the line frequency, and why a squared tracking error shows a spectral line at double the disturbance frequency. Written with $\theta/2$ in place of $\theta$ and square roots taken, they give $\cos(\theta/2) = \pm\sqrt{(1 + \cos\theta)/2}$, with the sign again set by the quadrant of $\theta/2$. Check: $\theta = 100^\circ$ gives $\sqrt{(1 + \cos 100^\circ)/2} = 0.6428 = \cos 50^\circ$.

::: example Gravity-gradient torque
A spacecraft in a 400 km circular orbit, radius $r = 6771$ km, has moments of inertia that differ by $\Delta I = 800\ \mathrm{kg\,m^2}$ between its long axis and a transverse axis. When the long axis is pitched by an angle $\theta$ from the local vertical, the Earth's gravity gradient exerts a restoring torque

$$
T = \frac{3\mu}{r^3}\,\Delta I\,\sin\theta\cos\theta = \frac{3\mu}{2r^3}\,\Delta I\,\sin 2\theta ,
$$

using $2\sin\theta\cos\theta = \sin 2\theta$. The prefactor is $3 \times 3.986 \times 10^{14} / (2 \times (6.771 \times 10^6)^3) = 1.926 \times 10^{-6}\ \mathrm{s^{-2}}$, so the torque amplitude is $1.926 \times 10^{-6} \times 800 = 1.54 \times 10^{-3}\ \mathrm{N\,m}$.

At $\theta = 10^\circ$: $\sin 20^\circ = 0.3420$ and $T = 5.27 \times 10^{-4}\ \mathrm{N\,m}$ — about half a millinewton-metre, tiny, but acting for the whole orbit. The double-angle form tells you two things at a glance that the product form hides. The torque peaks at $\theta = 45^\circ$, not at $90^\circ$, because $\sin 2\theta$ peaks there; and it vanishes at $\theta = 90^\circ$, since a body lying along the horizontal is in equilibrium (an unstable one). For small pitch angles $\sin 2\theta \approx 2\theta$, so the torque is a linear spring, $T \approx (3\mu/r^3)\,\Delta I\,\theta$: at $5^\circ$ the exact torque is $2.676 \times 10^{-4}\ \mathrm{N\,m}$ and the linear approximation gives $2.689 \times 10^{-4}\ \mathrm{N\,m}$, half a percent high.
:::

## Combining a sine and a cosine of the same frequency

Signals in flight data rarely arrive as a pure sine. A disturbance torque might be modelled as $T(t) = a\cos\omega t + b\sin\omega t$. The sum formula, read backwards, says this is a single sinusoid. Expand $R\cos(\omega t - \phi) = R\cos\phi\cos\omega t + R\sin\phi\sin\omega t$ and match coefficients: $a = R\cos\phi$ and $b = R\sin\phi$. Those are the polar-to-Cartesian equations of lesson 1, so

$$
a\cos\omega t + b\sin\omega t = R\cos(\omega t - \phi), \qquad R = \sqrt{a^2 + b^2}, \quad \phi = \operatorname{atan2}(b, a) .
$$

The amplitude is the length of the coefficient vector $(a, b)$ and the phase is its direction, computed — as always — with atan2, because $a$ can be negative.

::: example Amplitude and phase of a disturbance
Telemetry fits a once-per-orbit disturbance torque as $T(t) = 0.12\cos\omega t + 0.05\sin\omega t$ N m. The amplitude is $R = \sqrt{0.12^2 + 0.05^2} = 0.13$ N m and the phase is $\phi = \operatorname{atan2}(0.05, 0.12) = 22.6^\circ = 0.395$ rad, so $T(t) = 0.13\cos(\omega t - 0.395)$. The torque peaks $22.6^\circ$ of orbit — about $22.6/360$ of the period, six minutes for a 92-minute orbit — after the cosine reference. A reaction-wheel controller sizing its authority needs $R$, and a controller cancelling the disturbance needs $\phi$; the raw $a$ and $b$ give neither directly.
:::

## Products into sums

One more consequence, used whenever two sinusoids are multiplied — in a radio mixer, a Doppler measurement, or a lock-in detector. Add and subtract the two cosine sum formulas:

$$
\cos\alpha\cos\beta = \tfrac{1}{2}\left[\cos(\alpha - \beta) + \cos(\alpha + \beta)\right], \qquad \sin\alpha\sin\beta = \tfrac{1}{2}\left[\cos(\alpha - \beta) - \cos(\alpha + \beta)\right],
$$

and from the sine formulas, $\sin\alpha\cos\beta = \tfrac{1}{2}[\sin(\alpha + \beta) + \sin(\alpha - \beta)]$. Multiplying a received signal at frequency $\omega_1$ by a local oscillator at $\omega_2$ produces components at the difference $\omega_1 - \omega_2$ and the sum $\omega_1 + \omega_2$; a filter keeps the difference, and that is how a Doppler shift of a few kilohertz is pulled out of a carrier at gigahertz. The double-angle formula $\sin^2\theta = (1 - \cos 2\theta)/2$ is the special case $\alpha = \beta$.

::: note How many identities to memorise
Two: $\sin^2 + \cos^2 = 1$ and $\cos(\alpha - \beta) = \cos\alpha\cos\beta + \sin\alpha\sin\beta$. Everything in this lesson follows from those in a few lines using the even/odd and cofunction symmetries of lesson 1. When you are unsure of a sign, set the angles to $0$ or $\pi/4$ and test.
:::

## Check yourself

::: check
$\cos\theta = -0.28$ and $\theta$ lies in quadrant III. Find $\sin\theta$, $\tan\theta$, $\sin 2\theta$ and $\cos 2\theta$, and state the quadrant of $2\theta$.
:::

::: answer
$\sin^2\theta = 1 - 0.0784 = 0.9216$, so $\sin\theta = \pm 0.96$; in quadrant III the sine is negative, $\sin\theta = -0.96$. Then $\tan\theta = (-0.96)/(-0.28) = 3.43$, positive as it should be in quadrant III. $\sin 2\theta = 2(-0.96)(-0.28) = 0.5376$ and $\cos 2\theta = 0.0784 - 0.9216 = -0.8432$. Positive sine and negative cosine put $2\theta$ in quadrant II — consistent with $\theta$ between $180^\circ$ and $270^\circ$ giving $2\theta$ between $360^\circ$ and $540^\circ$, i.e. between $0^\circ$ and $180^\circ$ after a full turn, and specifically $\theta = 253.7^\circ$, $2\theta = 507.5^\circ \equiv 147.5^\circ$.
:::

::: check
Using the sum formula, show that $\cos(\theta + \pi) = -\cos\theta$, and explain what this says about the unit circle.
:::

::: answer
$\cos(\theta + \pi) = \cos\theta\cos\pi - \sin\theta\sin\pi = \cos\theta \times (-1) - \sin\theta \times 0 = -\cos\theta$. Geometrically, adding $\pi$ moves the point to the diametrically opposite side of the circle, which negates the $x$ coordinate. This is the half-turn symmetry of lesson 1, recovered from the general formula.
:::

::: check
Find the exact value of $\tan 15^\circ$ and check it numerically.
:::

::: answer
$\tan 15^\circ = \tan(45^\circ - 30^\circ) = \dfrac{1 - 1/\sqrt 3}{1 + 1/\sqrt 3} = \dfrac{\sqrt 3 - 1}{\sqrt 3 + 1}$. Multiply top and bottom by $\sqrt 3 - 1$: $\dfrac{(\sqrt 3 - 1)^2}{3 - 1} = \dfrac{4 - 2\sqrt 3}{2} = 2 - \sqrt 3 \approx 0.2679$. A calculator gives $\tan 15^\circ = 0.2679$.
:::

::: check
A signal is $y(t) = 3\sin\omega t - 4\cos\omega t$. Write it as a single cosine $R\cos(\omega t - \phi)$ with $R > 0$.
:::

::: answer
Match to $a\cos\omega t + b\sin\omega t$ with $a = -4$ and $b = 3$. Then $R = \sqrt{16 + 9} = 5$ and $\phi = \operatorname{atan2}(3, -4) = 143.13^\circ = 2.498$ rad. So $y(t) = 5\cos(\omega t - 2.498)$. Using $\arctan(b/a) = \arctan(-0.75) = -36.87^\circ$ instead would give a phase off by $180^\circ$, and the reconstructed signal would be the negative of the original.
:::

::: check
Simplify $\dfrac{1 - \cos 2\theta}{\sin 2\theta}$ and say for which angles the simplification is valid.
:::

::: answer
Numerator: $1 - \cos 2\theta = 2\sin^2\theta$. Denominator: $\sin 2\theta = 2\sin\theta\cos\theta$. The ratio is $\sin\theta/\cos\theta = \tan\theta$. The original expression requires $\sin 2\theta \ne 0$, that is, $\theta$ not a multiple of $\pi/2$; the simplified form additionally fails only at odd multiples of $\pi/2$, so the two agree everywhere the original is defined. This identity, $\tan\theta = (1 - \cos 2\theta)/\sin 2\theta$, is a half-angle formula for the tangent that needs no square root and no sign choice.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\sin^2\theta + \cos^2\theta = 1$ | The unit-circle point has unit length |
| $1 + \tan^2\theta = \sec^2\theta$ | Pythagorean identity divided by $\cos^2\theta$ |
| $\cos(\alpha \pm \beta) = \cos\alpha\cos\beta \mp \sin\alpha\sin\beta$ | Dot product of two unit vectors; sign flips |
| $\sin(\alpha \pm \beta) = \sin\alpha\cos\beta \pm \cos\alpha\sin\beta$ | From the cosine formula via cofunction; sign kept |
| $\tan(\alpha \pm \beta) = \dfrac{\tan\alpha \pm \tan\beta}{1 \mp \tan\alpha\tan\beta}$ | Ratio of the two above |
| $\begin{pmatrix} \cos\alpha & -\sin\alpha \\ \sin\alpha & \cos\alpha \end{pmatrix}$ | Rotation by $\alpha$; the sum formulas as a matrix |
| $\sin 2\theta = 2\sin\theta\cos\theta$ | Double angle |
| $\cos 2\theta = \cos^2\theta - \sin^2\theta = 1 - 2\sin^2\theta = 2\cos^2\theta - 1$ | Double angle, three forms |
| $\sin^2\theta = \frac{1 - \cos 2\theta}{2}$, $\cos^2\theta = \frac{1 + \cos 2\theta}{2}$ | Power reduction / half angle |
| $a\cos\omega t + b\sin\omega t = R\cos(\omega t - \phi)$ | $R = \sqrt{a^2 + b^2}$, $\phi = \operatorname{atan2}(b, a)$ |
| $\cos\alpha\cos\beta = \frac{1}{2}[\cos(\alpha-\beta) + \cos(\alpha+\beta)]$ | Product to sum; mixing and Doppler |

The next lesson leaves the unit circle for general triangles. The law of cosines is the Pythagorean theorem with a correction term, and the law of sines follows from writing one altitude two ways; together they solve every ground-station geometry and velocity-triangle problem in the module.
