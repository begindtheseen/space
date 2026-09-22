---
id: l02-sin-cos-tan-inverses
title: Sine, cosine, tangent and their inverses
minutes: 20
covers:
  - sin, cos, tan and their inverses
---

The unit circle of the last lesson turns an angle into a pair of numbers. Most of the working day runs the other way: you have measurements — a slant range and an altitude, two velocity components, a lateral force and a total thrust — and you want the angle they imply. That step, from ratio back to angle, is what the inverse trigonometric functions do, and it is the first place in the module where a careless answer can be silently wrong by a quadrant.

This lesson connects the unit circle to the right-triangle ratios you may have met first, adds the tangent and the three reciprocal functions, looks at sine, cosine and tangent as functions of a continuously varying angle (the shape of every oscillation you will ever plot), and then builds the inverses carefully: what they return, what they refuse to accept, and how to get every solution of an equation rather than the one your calculator offers.

On a real vehicle these functions sit in the flight-path-angle computation, in the conversion of a line-of-sight measurement into an elevation angle, in every antenna and solar-array pointing routine, and — through the inverse cosine of a dot product — in the angle between any two directions.

## Right triangles are scaled unit circles

Take any right triangle with an acute angle $\theta$, hypotenuse $H$, the leg opposite $\theta$ of length $O$ and the leg adjacent to $\theta$ of length $A$. Place the angle $\theta$ at the origin with the adjacent leg along the $+x$ axis. The far end of the hypotenuse is then a point at distance $H$ from the origin in direction $\theta$, and by the last lesson its coordinates are $(H\cos\theta,\ H\sin\theta)$. But those coordinates are also $(A, O)$. Therefore

$$
\sin\theta = \frac{O}{H}, \qquad \cos\theta = \frac{A}{H}, \qquad \tan\theta = \frac{O}{A} = \frac{\sin\theta}{\cos\theta}.
$$

So the right-triangle ratios are not a separate definition; they are the unit-circle definition with the triangle scaled by $H$. The scaling argument also tells you why the ratios depend only on the angle and not on the size of the triangle: all right triangles with the same acute angle are similar.

This is the workhorse for measurements. A vehicle climbing at speed $v$ with **flight-path angle** $\gamma$ (the angle of the velocity above the local horizontal) has vertical speed $v\sin\gamma$ and horizontal speed $v\cos\gamma$. A target at slant range $R$ and elevation angle $\varepsilon$ above the horizon is at height $R\sin\varepsilon$ and horizontal distance $R\cos\varepsilon$.

::: example Velocity components at a flight-path angle
Two minutes into an ascent, a launch vehicle's guidance reports speed 2400 m/s at a flight-path angle of $35^\circ$. The vertical component is $2400 \sin 35^\circ = 2400 \times 0.5736 \approx 1377\ \mathrm{m/s}$ and the horizontal component is $2400\cos 35^\circ = 2400 \times 0.8192 \approx 1966\ \mathrm{m/s}$. Check: $\sqrt{1377^2 + 1966^2} \approx 2400\ \mathrm{m/s}$.

Now run it backwards. Later in the flight the navigation filter gives a vertical velocity of 1200 m/s and a horizontal velocity of 3000 m/s. The speed is $\sqrt{1200^2 + 3000^2} \approx 3231\ \mathrm{m/s}$ and the flight-path angle satisfies $\tan\gamma = 1200/3000 = 0.4$, so $\gamma = \arctan 0.4 \approx 21.8^\circ$ ($0.3805\ \mathrm{rad}$). The angle has come down from $35^\circ$ to about $22^\circ$: the vehicle is pitching over towards horizontal flight, as it should to build orbital speed.
:::

## The tangent and the reciprocal functions

The **tangent** is the ratio of the two unit-circle coordinates,

$$
\tan\theta = \frac{\sin\theta}{\cos\theta} = \frac{y}{x},
$$

which is the slope of the ray from the origin through the point at angle $\theta$. It is defined wherever $\cos\theta \ne 0$, that is, everywhere except the odd multiples of $\pi/2$. Near those angles it grows without bound: $\tan 89^\circ \approx 57.3$, $\tan 89.9^\circ \approx 573$, $\tan 89.99^\circ \approx 5730$. In code, a tangent of a near-vertical direction produces a huge number, and a tangent of an exactly vertical one produces an exception or an infinity.

The tangent has two features that distinguish it from sine and cosine. Its period is $\pi$, not $2\pi$: a half turn flips the sign of both $x$ and $y$, so their ratio is unchanged, $\tan(\theta + \pi) = \tan\theta$. And its sign pattern follows from the signs of $x$ and $y$: positive in quadrants I and III (both coordinates share a sign), negative in II and IV. The period-$\pi$ property means the tangent cannot tell a direction from its opposite. Keep that in mind; it is exactly the weakness the next lesson repairs.

The special values follow from the table of the last lesson: $\tan 30^\circ = (1/2)/(\sqrt{3}/2) = 1/\sqrt{3} \approx 0.577$, $\tan 45^\circ = 1$, $\tan 60^\circ = \sqrt{3} \approx 1.732$.

Three more functions are the reciprocals of the first three:

$$
\sec\theta = \frac{1}{\cos\theta}, \qquad \csc\theta = \frac{1}{\sin\theta}, \qquad \cot\theta = \frac{1}{\tan\theta} = \frac{\cos\theta}{\sin\theta}.
$$

Secant, cosecant and cotangent appear mainly inside identities and integrals; you rarely compute them directly, and most programming libraries do not provide them. But you must recognise them: the identity $1 + \tan^2\theta = \sec^2\theta$ in lesson 4 is written in this language, and so is a good deal of the aerodynamics and orbital-mechanics literature. Two values to anchor them: $\sec 60^\circ = 1/\cos 60^\circ = 2$, and $\csc 30^\circ = 1/\sin 30^\circ = 2$.

## The functions as waves

Let the angle vary continuously and plot $\sin\theta$ against $\theta$. You get a smooth wave: zero at $\theta = 0$, rising to 1 at $\pi/2$, back through zero at $\pi$, down to $-1$ at $3\pi/2$, and back to zero at $2\pi$, after which the shape repeats forever in both directions. The cosine graph is the same wave shifted a quarter period to the left, because $\cos\theta = \sin(\theta + \pi/2)$: it starts at 1, reaches zero at $\pi/2$, $-1$ at $\pi$, and so on. The tangent graph is different in kind: it climbs from $-\infty$ to $+\infty$ over each interval between consecutive odd multiples of $\pi/2$, with vertical asymptotes at those points, and repeats with period $\pi$.

Anything that oscillates in time can be written in the form

$$
y(t) = A\sin(\omega t + \phi),
$$

where $A$ is the **amplitude** (the peak value), $\omega$ is the **angular frequency** in rad/s, and $\phi$ is the **phase** in radians. Because the sine repeats when its argument advances by $2\pi$, the motion repeats after the **period** $T = 2\pi/\omega$; the **frequency** in cycles per second (hertz) is $f = 1/T = \omega/2\pi$. The phase shifts the wave along the time axis: the first peak occurs where $\omega t + \phi = \pi/2$, at $t = (\pi/2 - \phi)/\omega$. All of this assumes $\omega$ in rad/s and $\phi$ in radians; a period formula with $360$ in it is a sign that degrees have crept in.

::: example A sun sensor on a spinning spacecraft
A small spacecraft spins about its long axis at 3 revolutions per minute. A single-axis sun sensor on its side produces a voltage proportional to the cosine of the angle between its normal and the Sun, so while the Sun is in view the output is $V(t) = 0.80\cos(\omega t + \phi)$ volts with $\phi = 0.50\ \mathrm{rad}$ set by where the sensor was pointing at $t = 0$.

Spin rate: $3\ \mathrm{rpm} = 3 \times 2\pi/60 = 0.3142\ \mathrm{rad/s}$, so the period is $T = 2\pi/0.3142 = 20.0\ \mathrm{s}$, as it must be for 3 turns a minute. The amplitude 0.80 V is the reading with the sensor pointed straight at the Sun. The output first drops to zero when the argument reaches $\pi/2$: $0.3142\,t + 0.50 = 1.5708$, so $t = 3.41\ \mathrm{s}$. From the zero crossings the attitude determination software can recover both the spin rate and the phase — the spacecraft's rotation angle at any instant — from a one-channel signal.
:::

## Inverse functions and their principal values

Suppose you know $\sin\theta = 0.3$ and want $\theta$. The last lesson showed there are two such points on the unit circle, one in quadrant I and one in quadrant II, and adding any multiple of $2\pi$ to either gives another valid angle. So "the angle whose sine is 0.3" is not a single number. A function must return a single number, and the inverse functions do so by restricting the answer to a fixed interval, called the **principal range**:

- $\arcsin c$ (also written $\sin^{-1}c$ or `asin`) returns the angle in $[-\pi/2,\ \pi/2]$ whose sine is $c$. Defined for $-1 \le c \le 1$.
- $\arccos c$ (`acos`) returns the angle in $[0,\ \pi]$ whose cosine is $c$. Defined for $-1 \le c \le 1$.
- $\arctan c$ (`atan`) returns the angle in $(-\pi/2,\ \pi/2)$ whose tangent is $c$. Defined for every real $c$.

::: key Principal values of the inverse functions
$\arcsin$ returns an angle in $[-\pi/2, \pi/2]$, $\arccos$ in $[0, \pi]$, $\arctan$ in $(-\pi/2, \pi/2)$. Every other angle with the same sine, cosine or tangent is obtained from the principal value by the circle's symmetries: $\pi - \theta$ for sine, $-\theta$ for cosine, $\theta + \pi$ for tangent, plus whole turns.
:::

The intervals are not arbitrary. Each is the largest interval around the "natural" starting point on which the function is one-to-one and still produces every possible output. Sine climbs from $-1$ to $1$ exactly once as $\theta$ goes from $-\pi/2$ to $\pi/2$. Cosine falls from $1$ to $-1$ exactly once between $0$ and $\pi$; the sine's interval would not work for it, because cosine is even and repeats values on either side of zero. Tangent runs through every real number once between the asymptotes at $\pm\pi/2$.

Two habits follow. First, the inverse only undoes the function on the principal range: $\arcsin(\sin 150^\circ) = \arcsin(0.5) = 30^\circ$, not $150^\circ$, and $\arccos(\cos(-40^\circ)) = 40^\circ$. Second, an arcsine or arctangent can never return an obtuse angle, and an arccosine can never return a negative one. If the geometry allows an obtuse answer, the arcsine will hand you the acute impostor with the same sine.

::: warning Notation
$\sin^{-1}x$ means $\arcsin x$, the inverse function. It does not mean $1/\sin x$, which is $\csc x$. But $\sin^{2}x$ does mean $(\sin x)^2$. This inconsistency is traditional and permanent; in code use `asin`, and in your own writing prefer $\arcsin$ to avoid the ambiguity.
:::

### Domain and the clamping bug

$\arcsin$ and $\arccos$ are only defined for arguments between $-1$ and $1$, because no angle has a sine or cosine outside that range. Mathematically this never causes trouble: a ratio that is genuinely a sine cannot exceed 1. Numerically it causes trouble all the time. The angle between two unit vectors is computed as the arccosine of their dot product, and two vectors that are supposed to be parallel may, after a few floating-point operations, have a dot product of $1.0000000002$. Feed that to `math.acos` and Python raises `ValueError`; feed it to `numpy.arccos` and you get `nan`, which then propagates silently through every downstream calculation. Attitude determination code, star-tracker matching and pointing-error monitors have all failed this way.

The defence is to clamp the argument before inverting:

```python
import math

def safe_acos(c: float) -> float:
    return math.acos(max(-1.0, min(1.0, c)))

print(safe_acos(1.0000000002))   # 0.0
print(math.degrees(safe_acos(0.9998)))  # 1.1459...
```

A dot product of 0.9998 corresponds to an angle of $1.15^\circ$; a dot product slightly above 1 is treated as exactly parallel, which is the physically right reading of a rounding error.

### Compositions you can read off a triangle

Expressions such as $\cos(\arcsin x)$ occur whenever one trigonometric function is known and another is needed. Draw the right triangle: $\arcsin x$ is an angle whose opposite side is $x$ and whose hypotenuse is 1, so the adjacent side is $\sqrt{1 - x^2}$ and

$$
\cos(\arcsin x) = \sqrt{1 - x^2}, \qquad \tan(\arcsin x) = \frac{x}{\sqrt{1 - x^2}}.
$$

Likewise $\arctan x$ is an angle with opposite side $x$ and adjacent side 1, so the hypotenuse is $\sqrt{1 + x^2}$ and

$$
\sin(\arctan x) = \frac{x}{\sqrt{1 + x^2}}, \qquad \cos(\arctan x) = \frac{1}{\sqrt{1 + x^2}}.
$$

The square roots come out positive, and that is correct because the principal ranges guarantee it: $\arcsin x$ lies in $[-\pi/2, \pi/2]$, where the cosine is never negative, and $\arctan x$ lies in the same interval. Numerically, $\cos(\arcsin 0.6) = \sqrt{1 - 0.36} = 0.8$ and $\tan(\arcsin 0.28) = 0.28/\sqrt{1 - 0.0784} = 0.2917$.

## Solving trigonometric equations completely

The inverse function gives you one solution; the symmetries of the circle give you the rest.

**Sine.** $\sin\theta = c$ has the principal solution $\theta_0 = \arcsin c$ and, by the reflection $\theta \mapsto \pi - \theta$ which preserves the sine, a second family:

$$
\theta = \arcsin c + 2\pi k \quad\text{or}\quad \theta = \pi - \arcsin c + 2\pi k, \qquad k \in \mathbb{Z}.
$$

**Cosine.** $\cos\theta = c$ has principal solution $\arccos c$, and cosine is even, so the mirror image $-\arccos c$ also works:

$$
\theta = \pm\arccos c + 2\pi k .
$$

**Tangent.** Tangent has period $\pi$, so one solution generates the rest by half turns:

$$
\theta = \arctan c + \pi k .
$$

To list the solutions in $[0, 2\pi)$, generate a few members of each family and keep those in range.

::: example Every solution in one turn
Solve $\sin\theta = 0.3$, $\cos\theta = -0.4$ and $\tan\theta = 2$ for $\theta$ in $[0, 2\pi)$.

For the sine, $\arcsin 0.3 = 0.3047\ \mathrm{rad}$ ($17.46^\circ$) and the reflection gives $\pi - 0.3047 = 2.8369\ \mathrm{rad}$ ($162.54^\circ$). Both have positive sine, one in quadrant I and one in quadrant II.

For the cosine, $\arccos(-0.4) = 1.9823\ \mathrm{rad}$ ($113.58^\circ$), in quadrant II as a negative cosine requires. The mirror image $-1.9823$ is out of range; add $2\pi$ to get $4.3009\ \mathrm{rad}$ ($246.42^\circ$), in quadrant III.

For the tangent, $\arctan 2 = 1.1071\ \mathrm{rad}$ ($63.43^\circ$) and the half turn gives $1.1071 + \pi = 4.2487\ \mathrm{rad}$ ($243.43^\circ$). The second solution lies in quadrant III, where both coordinates are negative and their ratio is again $+2$. This is the tangent's blind spot in action: a tangent of 2 is consistent with two opposite directions, and only extra information — the sign of one coordinate — can decide between them.
:::

## Python summary

All of this maps directly onto the standard library, with the standing rule that arguments and results are in radians:

```python
import math

math.sin(math.radians(35.0))          # 0.5736
math.degrees(math.asin(2.0 / 5.5))    # 21.32  (in [-90, 90])
math.degrees(math.acos(-0.4))         # 113.58 (in [0, 180])
math.degrees(math.atan(1200 / 3000))  # 21.80  (in (-90, 90))
```

NumPy provides the same functions vectorised (`np.sin`, `np.arcsin`, `np.arccos`, `np.arctan`) and, importantly, `np.arctan2`, which the next lesson is about.

## Check yourself

::: check
An aircraft flies a $3^\circ$ glideslope at a ground speed of 70 m/s. What is its rate of descent?
:::

::: answer
The descent rate is the vertical component of the velocity. With the glideslope angle measured below the horizontal, vertical speed $= 70\tan 3^\circ$ if 70 m/s is the horizontal (ground) speed: $\tan 3^\circ = 0.05241$, so the descent rate is about $3.67\ \mathrm{m/s}$. (If 70 m/s had been the airspeed along the slope, you would use $70\sin 3^\circ = 3.66\ \mathrm{m/s}$; at this angle the two barely differ, a fact lesson 6 explains.)
:::

::: check
Your calculator says $\arcsin 0.5 = 30^\circ$. A colleague insists a certain angle with sine 0.5 is about $150^\circ$. Who is right, and what are all the angles in $[0^\circ, 360^\circ)$ with sine 0.5?
:::

::: answer
Both. $\arcsin$ returns only the principal value in $[-90^\circ, 90^\circ]$, so it reports $30^\circ$; but $\sin 150^\circ = \sin(180^\circ - 30^\circ) = \sin 30^\circ = 0.5$ as well. In one turn the solutions are $30^\circ$ and $150^\circ$. Which one applies depends on information the sine alone does not carry, such as the sign of the cosine.
:::

::: check
Without a calculator, evaluate $\cos(\arctan 0.75)$.
:::

::: answer
$\arctan 0.75$ is the angle of a right triangle with opposite side 3 and adjacent side 4 (since $3/4 = 0.75$), whose hypotenuse is 5. Its cosine is adjacent over hypotenuse, $4/5 = 0.8$. The general formula $\cos(\arctan x) = 1/\sqrt{1 + x^2}$ gives the same: $1/\sqrt{1.5625} = 0.8$.
:::

::: check
A pointing monitor computes the angle between the commanded and measured boresight unit vectors as `math.acos(dot)`. In testing it occasionally crashes with `ValueError: math domain error`. Explain why, and fix it.
:::

::: answer
When the two vectors are nearly parallel, rounding can make the dot product marginally greater than 1 (or less than $-1$ when anti-parallel), outside the domain of $\arccos$. Clamp before inverting: `math.acos(max(-1.0, min(1.0, dot)))`. A dot product of $1 + 10^{-10}$ then reads as an angle of 0, which is the correct interpretation of a rounding error. With NumPy the failure is quieter — `np.arccos` returns `nan` — so the clamp matters even more there.
:::

::: check
Find all $\theta$ in $[0, 2\pi)$ with $\sin\theta = -0.25$, in radians and degrees.
:::

::: answer
$\arcsin(-0.25) = -0.2527\ \mathrm{rad}$, which is outside $[0, 2\pi)$; add $2\pi$ to get $6.0305\ \mathrm{rad}$ ($345.52^\circ$), in quadrant IV. The reflection $\pi - (-0.2527) = 3.3943\ \mathrm{rad}$ ($194.48^\circ$) lies in quadrant III. Both quadrants have negative sine, as required.
:::

::: check
An engine delivering 920 kN of thrust is gimballed so that its lateral force component is 41.2 kN. What is the gimbal angle, in degrees and radians?
:::

::: answer
The lateral component is $F\sin\delta$, so $\sin\delta = 41.2/920 = 0.04478$ and $\delta = \arcsin 0.04478 = 0.04480\ \mathrm{rad} = 2.57^\circ$. Notice how close the angle in radians is to its sine — the small-angle behaviour that lesson 6 makes precise.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\sin\theta = O/H$, $\cos\theta = A/H$, $\tan\theta = O/A$ | Right-triangle ratios; a scaled unit circle |
| $\tan\theta = \sin\theta/\cos\theta$ | Slope of the direction; undefined at odd multiples of $\pi/2$; period $\pi$ |
| $\sec = 1/\cos$, $\csc = 1/\sin$, $\cot = 1/\tan$ | Reciprocal functions |
| $A\sin(\omega t + \phi)$ | Amplitude $A$, angular frequency $\omega$, phase $\phi$, period $T = 2\pi/\omega$ |
| $\arcsin c \in [-\pi/2, \pi/2]$ | Principal value; needs $-1 \le c \le 1$ |
| $\arccos c \in [0, \pi]$ | Principal value; needs $-1 \le c \le 1$ |
| $\arctan c \in (-\pi/2, \pi/2)$ | Principal value; any real $c$ |
| $\cos(\arcsin x) = \sqrt{1 - x^2}$, $\cos(\arctan x) = 1/\sqrt{1 + x^2}$ | Read off a right triangle |
| $\sin\theta = c \Rightarrow \theta = \arcsin c + 2\pi k$ or $\pi - \arcsin c + 2\pi k$ | Complete solution |
| $\cos\theta = c \Rightarrow \theta = \pm\arccos c + 2\pi k$ | Complete solution |
| $\tan\theta = c \Rightarrow \theta = \arctan c + \pi k$ | Complete solution |
| Clamp before $\arcsin$/$\arccos$ | Rounding can push a ratio outside $[-1, 1]$ |

The next lesson takes the tangent's blind spot seriously. When a direction is given by two components rather than one ratio, there is a function that returns the correct angle in every quadrant, and using anything else in flight code is a bug.
