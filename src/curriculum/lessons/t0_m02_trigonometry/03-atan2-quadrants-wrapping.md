---
id: l03-atan2-quadrants-wrapping
title: atan2, quadrants and angle wrapping
minutes: 20
covers:
  - atan2 and quadrant correctness
---

Two mistakes account for a large share of the angle bugs found in guidance and control software. The first is computing the direction of a vector with $\arctan(y/x)$. The second is computing the difference between two angles with ordinary subtraction. Neither produces an error message. Both produce a number that is often right, which is what makes them dangerous: the code passes its tests, flies for a while, and then one day the vector lands in the third quadrant or the heading crosses $180^\circ$, and the actuator slews the wrong way at full rate.

Both mistakes have the same root — the periodicity you met in lesson 1 — and both have a standard, cheap fix. This lesson gives you the fixes and, more importantly, the understanding that makes you reach for them automatically: the `atan2` function for recovering an angle from two components, and the wrapping rule for differencing angles.

Where it shows up: the gimbal angle implied by a commanded lateral and axial force; the azimuth of a ground station from a satellite's east and north offsets; longitude from an Earth-fixed position; the phase of a radio signal from its in-phase and quadrature components; the true anomaly of an orbit from position and velocity; and the error signal of every attitude and heading control loop ever written.

## The problem with arctangent

A direction in the plane is given by two components $(x, y)$, and its angle $\theta$ from the $+x$ axis satisfies $\tan\theta = y/x$. The obvious move is $\theta = \arctan(y/x)$. It is wrong half the time, for two separate reasons.

**It loses a sign.** Forming the quotient $y/x$ throws away the individual signs of $x$ and $y$ and keeps only their ratio. The points $(x, y)$ and $(-x, -y)$ — opposite directions — have the same ratio, so the arctangent cannot tell them apart. Its principal range is $(-\pi/2, \pi/2)$, which covers quadrants I and IV only. Every vector in quadrant III (both components negative, ratio positive) is reported as if it were in quadrant I, and every vector in quadrant II (ratio negative) is reported as if it were in quadrant IV.

Take $(x, y) = (-3, 4)$, a vector pointing up and to the left, in quadrant II. The ratio is $y/x = -4/3$, and $\arctan(-4/3) = -53.13^\circ$ — pointing down and to the right. The true angle is $126.87^\circ$; the answer is off by exactly $180^\circ$. Or take $(-2, -5)$ in quadrant III: the ratio is $+2.5$, $\arctan 2.5 = 68.20^\circ$, in quadrant I, while the true angle is $-111.80^\circ$. Again off by a half turn.

**It divides by zero.** When $x = 0$ the direction is straight up or straight down, a perfectly good direction, but $y/x$ is undefined. In Python `math.atan(y/x)` raises `ZeroDivisionError`; in floating-point code that has already produced an infinity it returns $\pm\pi/2$ by luck, and for $x$ merely tiny it returns a result whose sign depends on rounding noise in $x$.

Neither problem is exotic. A vehicle whose lateral acceleration command changes sign, a spacecraft whose sub-satellite point crosses the $\pm 90^\circ$ meridian, a target that passes overhead: all of them walk a working $\arctan$ into failure.

## atan2

The repair is a function of two arguments that keeps both signs. **atan2**$(y, x)$ is defined as the unique angle $\theta$ in $(-\pi, \pi]$ such that

$$
(x, y) = r(\cos\theta,\ \sin\theta), \qquad r = \sqrt{x^2 + y^2} > 0 .
$$

In words: it returns the polar angle of the point $(x, y)$, in whichever quadrant that point lies. Written out case by case,

$$
\operatorname{atan2}(y, x) =
\begin{cases}
\arctan(y/x) & x > 0 \\
\arctan(y/x) + \pi & x < 0,\ y \ge 0 \\
\arctan(y/x) - \pi & x < 0,\ y < 0 \\
+\pi/2 & x = 0,\ y > 0 \\
-\pi/2 & x = 0,\ y < 0 .
\end{cases}
$$

The first line is the ordinary arctangent, valid on the right half-plane. The second and third lines add or subtract a half turn to move the answer into the correct left-hand quadrant. The last two lines handle the vertical axis without any division. Every serious numerical library implements this — `math.atan2` and `numpy.arctan2` in Python, `atan2` in C, Fortran, MATLAB and Julia — and it costs no more than an arctangent.

The one remaining hole is the origin, $x = y = 0$, where no direction exists. Most libraries return 0 there rather than raising; your code should treat a zero-length vector as a special case before asking for its direction, because "angle 0" is a guess, not an answer.

| $(x, y)$ | Quadrant | $\arctan(y/x)$ | $\operatorname{atan2}(y, x)$ |
| --- | --- | --- | --- |
| $(2, 0)$ | on $+x$ axis | $0^\circ$ | $0^\circ$ |
| $(3, -4)$ | IV | $-53.13^\circ$ | $-53.13^\circ$ |
| $(-3, 4)$ | II | $-53.13^\circ$ | $126.87^\circ$ |
| $(-2, -5)$ | III | $68.20^\circ$ | $-111.80^\circ$ |
| $(0, 2)$ | on $+y$ axis | division by zero | $90^\circ$ |
| $(0, -2)$ | on $-y$ axis | division by zero | $-90^\circ$ |
| $(-2, 0)$ | on $-x$ axis | $0^\circ$ | $180^\circ$ |

Two rows repay a second look. For $(3, -4)$ and $(-3, 4)$ the arctangent gives the same answer, because it is looking at the same ratio; only atan2 sees that they point opposite ways. And for $(-2, 0)$ the arctangent confidently reports "pointing along $+x$" for a vector pointing along $-x$.

::: key Why flight software uses atan2
$\operatorname{atan2}(y, x)$ resolves all four quadrants and is defined at $x = 0$. $\arctan(y/x)$ cannot tell $(x, y)$ from $(-x, -y)$: it folds quadrants II and III onto IV and I, and it divides by zero on the $\pm 90^\circ$ axis. Use atan2 for every bearing, azimuth, phase, longitude and gimbal angle.
:::

::: warning Argument order
In C, Python, NumPy, MATLAB, Fortran and Julia the call is `atan2(y, x)` — the numerator of the would-be fraction first. A few tools reverse it: Excel's `ATAN2(x_num, y_num)` and Mathematica's `ArcTan[x, y]` take $x$ first. Swapping the arguments returns the complementary angle measured from the $y$ axis, which is also a plausible-looking number. When porting a formula between tools, check the order once and write it down.
:::

::: example Gimbal angle and longitude
A thrust-vector controller has resolved its commanded force into an axial component of 812 kN and a lateral component of $-37.5$ kN. The gimbal angle is the direction of the force vector relative to the axial axis: $\delta = \operatorname{atan2}(-37.5,\ 812) = -0.04615\ \mathrm{rad} = -2.64^\circ$. Here $x = 812 > 0$, so $\arctan(-37.5/812)$ would have given the same answer; the two functions agree on the right half-plane, which is exactly why the bug hides in testing when commands are always "mostly forward".

Now longitude. A satellite's Earth-fixed position has $x = -2694.5\ \mathrm{km}$ and $y = -4293.6\ \mathrm{km}$ (its $z$ component does not enter). Longitude is the angle of $(x, y)$ from the $+x$ axis, which points at the Greenwich meridian. $\arctan(y/x) = \arctan(1.5935) = 57.89^\circ$ — east longitude, over the Indian Ocean. $\operatorname{atan2}(-4293.6, -2694.5) = -122.11^\circ$ — west longitude, off the coast of California. Same satellite, opposite sides of the planet; and the arctangent version fails for every point in the western hemisphere with $x < 0$, which is roughly a quarter of the Earth.
:::

## Ranges, and azimuth conventions

atan2 returns an angle in $(-\pi, \pi]$. Many quantities are conventionally quoted in $[0, 2\pi)$ instead — longitude east of Greenwich, right ascension, true anomaly, compass azimuth. The conversion is a modulo: in Python, `theta % (2*math.pi)` maps $-122.11^\circ$ to $237.89^\circ$ and leaves positive angles alone. (Python's `%` returns a result with the sign of the divisor, so it produces a value in $[0, 2\pi)$ even for negative input; C's `fmod` keeps the sign of the dividend and needs an extra step. `numpy.mod` behaves like Python.)

Navigation adds a twist of convention. The mathematical angle is measured counterclockwise from the $+x$ axis. A compass **azimuth** or **heading** is measured clockwise from north. If you have the east and north components $E$ and $N$ of a horizontal displacement, then

$$
\text{azimuth} = \operatorname{atan2}(E,\ N),
$$

with the arguments in that order — north plays the role of $x$ and east the role of $y$ — because swapping the axes reverses the sense of rotation exactly as the clockwise convention requires. Check it on the compass points: due east is $(E, N) = (1, 0)$, and $\operatorname{atan2}(1, 0) = 90^\circ$; northwest is $(-1, 1)$, and $\operatorname{atan2}(-1, 1) = -45^\circ$, which is $315^\circ$ after the modulo. A displacement of $E = -420\ \mathrm{km}$, $N = 610\ \mathrm{km}$ has azimuth $\operatorname{atan2}(-420, 610) = -34.55^\circ = 325.45^\circ$; the same displacement has mathematical angle $\operatorname{atan2}(610, -420) = 124.55^\circ$ from east. Both are correct descriptions of one direction, and any interface between them must say which convention it uses.

## Differencing angles: the wrap problem

An angle is a point on a circle, but a floating-point variable holding an angle is a point on a line — the interval $(-\pi, \pi]$ or $[0, 2\pi)$ cut open at a seam. Two directions that sit close together on the circle but on opposite sides of the seam have representations that differ by almost a full turn.

Let a commanded heading be $a = 170^\circ$ and the measured heading $b = -175^\circ$. On the circle these are $15^\circ$ apart: $-175^\circ$ is the same direction as $185^\circ$, which is $15^\circ$ counterclockwise of $170^\circ$. The naive error $a - b = 170 - (-175) = 345^\circ$. A controller fed that error concludes the vehicle is pointed nearly opposite to the command and slews hard — in the direction that takes it $345^\circ$ round the long way, straight through the seam, where the sign of the error flips and the process may repeat. Actuators have been saturated and gimbals driven to their stops by exactly this.

The correct error is the **shortest signed angle** from $b$ to $a$, which lies in $(-\pi, \pi]$ and here is $-15^\circ$. There are two standard ways to compute it.

**With atan2.** The sine and cosine of a difference depend only on the directions, not on which representative angles were used, because both functions have period $2\pi$. So

$$
\Delta = \operatorname{atan2}\big(\sin(a - b),\ \cos(a - b)\big)
$$

is the angle in $(-\pi, \pi]$ whose direction matches $a - b$: the wrapped difference. For our numbers, $a - b = 345^\circ$, $\sin 345^\circ = -0.2588$, $\cos 345^\circ = 0.9659$, and $\operatorname{atan2}(-0.2588, 0.9659) = -15.0^\circ$.

**With a modulo.** Reduce $a - b$ into $[0, 2\pi)$ with the modulo operation, then move anything above $\pi$ down by a full turn:

```python
import math

def wrap_to_pi(x: float) -> float:
    """Reduce an angle in radians to the interval (-pi, pi]."""
    d = x % (2 * math.pi)          # now in [0, 2*pi)
    return d - 2 * math.pi if d > math.pi else d

def angle_diff(a: float, b: float) -> float:
    """Shortest signed angle from b to a, in (-pi, pi]."""
    return math.atan2(math.sin(a - b), math.cos(a - b))

a, b = math.radians(170.0), math.radians(-175.0)
print(math.degrees(a - b))           # 345.0  (the bug)
print(math.degrees(wrap_to_pi(a - b)))   # -15.0
print(math.degrees(angle_diff(a, b)))    # -15.0
```

Both routes give the same answer for every input; the atan2 form costs two trigonometric evaluations, the modulo form costs a floor. Use whichever your codebase already uses, and use it everywhere an angle error is formed.

::: key Differencing angles without a wrap bug
$\Delta = \operatorname{atan2}(\sin(a - b), \cos(a - b))$ always returns the shortest signed angle from $b$ to $a$, in $(-\pi, \pi]$. Equivalently, wrap $(a - b)$ with mod $2\pi$ and then subtract $2\pi$ if the result exceeds $\pi$.
:::

::: warning Every subtraction of two angles is suspect
Whenever you see `error = commanded - measured`, `delta = lon2 - lon1` or `phase_change = phase[k] - phase[k-1]` with angles on both sides, ask whether the operands can straddle the seam. If both are guaranteed to lie in a small range far from it (gimbal deflections limited to $\pm 8^\circ$, latitudes, elevation angles) the plain subtraction is fine. Headings, longitudes, phases, true anomalies and yaw angles can all wrap, and their differences must go through a wrap function.
:::

::: example Heading error across north
A rover's navigation reports a heading of $355^\circ$ and the path planner commands $5^\circ$. The naive error, command minus measurement, is $5 - 355 = -350^\circ$: a controller that turns left for negative errors would spin the rover almost a full circle to the left. Wrapping: $-350^\circ$ modulo $360^\circ$ is $10^\circ$, which is below $180^\circ$, so it stands: the shortest correction is $+10^\circ$, a small turn to the right through north. With the atan2 form, $\sin(-350^\circ) = 0.1736$ and $\cos(-350^\circ) = 0.9848$, so $\operatorname{atan2}(0.1736, 0.9848) = 10.0^\circ$.
:::

## Averages and interpolation on the circle

The wrap problem infects every operation that treats angles as ordinary numbers, not only subtraction. The arithmetic mean of the headings $350^\circ$ and $10^\circ$ is $180^\circ$ — due south, for two readings that are both nearly due north. The remedy is the same idea as atan2: work with the unit vectors instead of the angles. To average angles $\theta_1, \ldots, \theta_n$, average their unit vectors and take the direction of the result:

$$
\bar\theta = \operatorname{atan2}\!\left(\frac{1}{n}\sum_{k=1}^{n}\sin\theta_k,\ \frac{1}{n}\sum_{k=1}^{n}\cos\theta_k\right).
$$

This is the **circular mean**. For the sun-sensor readings $350^\circ, 355^\circ, 2^\circ, 8^\circ, 15^\circ$ the arithmetic mean is $146^\circ$, which is nonsense; the mean sine is $0.0344$, the mean cosine is $0.9873$, and the circular mean is $\operatorname{atan2}(0.0344, 0.9873) = 2.0^\circ$, which is where the readings cluster. The length of the mean vector, $\sqrt{0.0344^2 + 0.9873^2} = 0.988$, is close to 1, telling you the readings are tightly grouped; widely scattered angles give a mean vector near zero.

To interpolate a slew from angle $a$ to angle $b$ — a gimbal command ramp, say — wrap the difference first and then move a fraction $s \in [0, 1]$ of it: $\theta(s) = a + s\,\Delta$ with $\Delta$ the wrapped difference from $a$ to $b$. Interpolating the raw numbers from $350^\circ$ to $10^\circ$ would sweep through $180^\circ$; interpolating the wrapped difference of $+20^\circ$ passes through north as intended.

Finally, when you record an angle over time and it jumps from $179^\circ$ to $-179^\circ$ between two samples, the vehicle did not turn $358^\circ$ in one step. For plotting and for computing rates by differencing, **unwrap** the series: add or subtract $360^\circ$ whenever a step exceeds $180^\circ$ in magnitude so the trace stays continuous. `numpy.unwrap` does exactly this.

## Check yourself

::: check
A unit vector has components $(x, y) = (-0.6, 0.8)$. What do $\arctan(y/x)$ and $\operatorname{atan2}(y, x)$ return, in degrees? Which is right, and how do you know?
:::

::: answer
$y/x = -1.333$, so $\arctan(-1.333) = -53.13^\circ$, a direction in quadrant IV (down and to the right). $\operatorname{atan2}(0.8, -0.6) = 126.87^\circ$, in quadrant II. The vector has $x < 0$ and $y > 0$, so it points up and to the left: quadrant II. atan2 is right; the arctangent is off by exactly $180^\circ$ because $(-0.6, 0.8)$ and $(0.6, -0.8)$ have the same ratio.
:::

::: check
Explain, without numbers, what goes wrong if longitude is computed as $\arctan(y/x)$ from Earth-fixed coordinates for a satellite over the Pacific, where $x < 0$ and $y < 0$.
:::

::: answer
With $x$ and $y$ both negative the ratio is positive, and the arctangent returns an angle in $(0, 90^\circ)$, an east longitude. The satellite is actually in the western hemisphere at a longitude near $-90^\circ$ to $-180^\circ$; the reported position is on the far side of the Earth, $180^\circ$ off. Ground-station visibility, downlink scheduling and any ground-track plot built on that longitude would all be wrong, and nothing would flag the error.
:::

::: check
A gimbal controller in a code review contains `err = cmd - meas` with both angles in radians and no other processing. Under what circumstances is this acceptable, and what is the one-line fix when it is not?
:::

::: answer
It is acceptable only when both angles are guaranteed to stay in a small range far from the $\pm\pi$ seam — for a gimbal mechanically limited to a few degrees of deflection, for instance. If either angle can approach $\pm\pi$ (a yaw angle, a heading, a phase), replace it with `err = math.atan2(math.sin(cmd - meas), math.cos(cmd - meas))`, which returns the shortest signed error in $(-\pi, \pi]$.
:::

::: check
Five heading readings are $358^\circ, 2^\circ, 359^\circ, 1^\circ, 3^\circ$. Compute the arithmetic mean and the circular mean.
:::

::: answer
The arithmetic mean is $(358 + 2 + 359 + 1 + 3)/5 = 144.6^\circ$, absurd for five readings within $5^\circ$ of north. For the circular mean, the sines are $-0.0349, 0.0349, -0.0175, 0.0175, 0.0523$ with mean $0.01047$; the cosines are all about $0.9985$ to $1$, mean $0.99945$. Then $\bar\theta = \operatorname{atan2}(0.01047, 0.99945) = 0.60^\circ$. Sanity check: written as $-2, 2, -1, 1, 3$ the readings average to $0.6^\circ$.
:::

::: check
From a lander, a beacon is $120\ \mathrm{m}$ east and $90\ \mathrm{m}$ south. What is its compass azimuth and range?
:::

::: answer
East component $E = 120$, north component $N = -90$. Azimuth $= \operatorname{atan2}(E, N) = \operatorname{atan2}(120, -90) = 126.87^\circ$, i.e. south-east, which matches the picture (east and somewhat south). Range $= \sqrt{120^2 + 90^2} = 150\ \mathrm{m}$. Using $\arctan(120/(-90)) = -53.13^\circ$ would have put the beacon to the north-west.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\operatorname{atan2}(y, x)$ | Polar angle of $(x, y)$ in $(-\pi, \pi]$; correct in all four quadrants; defined at $x = 0$ |
| $\arctan(y/x)$ | Range $(-\pi/2, \pi/2)$ only; confuses $(x, y)$ with $(-x, -y)$; fails at $x = 0$ |
| Argument order | `atan2(y, x)` in C, Python, NumPy, MATLAB; some tools reverse it |
| $\theta \bmod 2\pi$ | Reduce to $[0, 2\pi)$; Python `%` does this correctly for negatives |
| $\text{azimuth} = \operatorname{atan2}(E, N)$ | Clockwise from north; convert to $[0, 360^\circ)$ with a modulo |
| $\Delta = \operatorname{atan2}(\sin(a-b), \cos(a-b))$ | Shortest signed angle from $b$ to $a$, in $(-\pi, \pi]$ |
| Wrap by modulo | $(a - b) \bmod 2\pi$, then subtract $2\pi$ if the result exceeds $\pi$ |
| Circular mean | $\operatorname{atan2}(\text{mean}\sin\theta_k, \text{mean}\cos\theta_k)$ |
| Unwrap | Add $\pm 2\pi$ to a time series wherever a step exceeds $\pi$ |

The next lesson turns to the algebra of the functions themselves — the identities that let you combine angles, halve them and double them — which is what makes rotations composable and gives the small-angle results their form.
