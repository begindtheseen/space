---
id: l03-atan2-quadrants-wrapping
title: atan2, quadrants and angle wrapping
minutes: 22
covers:
  - atan2 and quadrant correctness
---

Two mistakes cause a large share of the angle bugs found in guidance and control software. The first is finding the direction of an arrow with $\arctan(y/x)$. The second is finding the difference between two angles by ordinary subtraction. Neither one produces an error message. Both produce a number that is *often* right — which is exactly what makes them dangerous. The code passes its tests and flies for a while. Then one day the arrow points into the third quadrant, or the heading crosses $180^\circ$, and a motor swings the wrong way at full speed.

Both mistakes grow from the same root — the repeating you met in lesson 1 — and both have a standard, cheap fix. This lesson gives you the fixes and, more importantly, the understanding that makes you reach for them without thinking: the `atan2` function for getting an angle back from two components, and the **wrapping** rule for subtracting angles.

Where it shows up: the gimbal angle for a wanted sideways and forward force; the compass direction of a ground station from a satellite's east and north offsets; longitude from a position on the spinning Earth; the phase of a radio signal from its two measured parts; the position of a spacecraft around its orbit; and the error signal of every attitude and heading control loop ever written.

## The problem with arctangent

Suppose a friend divides two numbers and tells you the answer is $2$. What were the numbers? Maybe $4$ and $2$. Maybe $-4$ and $-2$. You cannot tell: dividing threw away the signs. Keep that puzzle in mind.

A direction in the plane is given by two components $(x, y)$. Its angle $\theta$ from the $+x$ axis satisfies $\tan\theta = y/x$, so the obvious move is $\theta = \arctan(y/x)$. It is wrong half the time, for two separate reasons.

**It loses a sign.** Making the fraction $y/x$ throws away the separate signs of $x$ and $y$ and keeps only their ratio. The points $(x, y)$ and $(-x, -y)$ point in exactly opposite directions, but they have the same ratio, so the arctangent cannot tell them apart. Its answers only cover $(-\pi/2, \pi/2)$ — the right half of the plane, quadrants I and IV. Every arrow in quadrant III (both parts negative, so the ratio is positive) gets reported as if it were in quadrant I. Every arrow in quadrant II (ratio negative) gets reported as if it were in quadrant IV. The arctangent [[folds the left half onto the right|atan-fold]].

Try $(x, y) = (-3, 4)$: an arrow pointing up and to the left, in quadrant II. The ratio is $y/x = -4/3$, and $\arctan(-4/3) = -53.13^\circ$ — an arrow pointing down and to the right. The true angle is $126.87^\circ$. The answer is off by exactly $180^\circ$.

Or try $(-2, -5)$, in quadrant III. The ratio is $+2.5$, and $\arctan 2.5 = 68.20^\circ$, in quadrant I. The true angle is $-111.80^\circ$. Off by a half turn again.

**It divides by zero.** When $x = 0$, the arrow points straight up or straight down. That is a perfectly good direction, but $y/x$ has no answer. In Python, `math.atan(y/x)` stops with a `ZeroDivisionError`. In code where the division has already produced an infinity, it returns $\pm\pi/2$ by luck. And when $x$ is merely tiny, the answer's sign depends on rounding noise in $x$.

Neither problem is rare. A rocket whose sideways-force command changes sign, a satellite whose ground track crosses the $\pm 90^\circ$ longitude lines, a target that passes straight overhead: each of them walks a working $\arctan$ into failure.

## atan2

The repair is a function that takes *two* inputs, so it can keep both signs. **atan2**$(y, x)$ (say "a-tan-two") is defined as the one angle $\theta$ in $(-\pi, \pi]$ for which

$$
(x, y) = r(\cos\theta,\ \sin\theta), \qquad r = \sqrt{x^2 + y^2} > 0 .
$$

In words: $r$ is the arrow's length, and atan2 returns the arrow's angle, in whichever quadrant the arrow actually lies. Written out case by case,

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

Read it line by line. The first line is the ordinary arctangent, which is correct on the right half of the plane. The second and third lines add or take away a half turn, moving the answer into the correct quadrant on the left. The last two lines handle the upright axis without dividing at all. Every serious math library has this built in — `math.atan2` and `numpy.arctan2` in Python, `atan2` in C, Fortran, MATLAB and Julia — and it costs no more than an arctangent.

::: note Why the half turn fixes it
When $x < 0$, the arrow $(x, y)$ is on the left. Its exact opposite, $(-x, -y)$, is on the right, and has the same ratio $y/x$. So $\arctan(y/x)$ is the correct angle of that *opposite* arrow. Turning an arrow half a turn, $\pi$, points it the other way; so the angle we want is $\arctan(y/x) \pm \pi$. Adding $\pi$ or taking it away both point the same way. The sign of $y$ picks whichever keeps the answer inside $(-\pi, \pi]$: add $\pi$ when the arrow is in the top half, take it away when it is in the bottom half.
:::

One hole remains: the origin, $x = y = 0$, where there is no arrow and so no direction. Most libraries return $0$ there instead of stopping. Your code should treat a zero-length arrow as a special case before asking for its direction, because "angle $0$" is a guess, not an answer.

| $(x, y)$ | Quadrant | $\arctan(y/x)$ | $\operatorname{atan2}(y, x)$ |
| --- | --- | --- | --- |
| $(2, 0)$ | on $+x$ axis | $0^\circ$ | $0^\circ$ |
| $(3, -4)$ | IV | $-53.13^\circ$ | $-53.13^\circ$ |
| $(-3, 4)$ | II | $-53.13^\circ$ | $126.87^\circ$ |
| $(-2, -5)$ | III | $68.20^\circ$ | $-111.80^\circ$ |
| $(0, 2)$ | on $+y$ axis | division by zero | $90^\circ$ |
| $(0, -2)$ | on $-y$ axis | division by zero | $-90^\circ$ |
| $(-2, 0)$ | on $-x$ axis | $0^\circ$ | $180^\circ$ |

Two rows are worth a second look. For $(3, -4)$ and $(-3, 4)$ the arctangent gives the same answer, because it sees the same ratio; only atan2 sees that they point opposite ways. And for $(-2, 0)$, the arctangent confidently says "pointing along $+x$" for an arrow pointing along $-x$.

::: key Why flight software uses atan2
$\operatorname{atan2}(y, x)$ resolves all four quadrants and is defined at $x = 0$. $\arctan(y/x)$ cannot tell $(x, y)$ from $(-x, -y)$: it lumps quadrant III together with quadrant I and quadrant II together with quadrant IV, reporting both as I or IV, and it divides by zero on the $\pm 90^\circ$ axis. Use atan2 for every bearing, azimuth, phase, longitude and gimbal angle.
:::

::: warning Argument order
In C, Python, NumPy, MATLAB, Fortran and Julia the call is `atan2(y, x)` — the top of the would-be fraction comes first. A few tools reverse it: Excel's `ATAN2(x_num, y_num)` and Mathematica's `ArcTan[x, y]` take $x$ first. Swapping the inputs gives the angle measured from the $y$ axis instead, which also looks like a believable number. When you move a formula between tools, check the order once and write it down.
:::

::: example Gimbal angle and longitude
**Gimbal angle.** A steering controller wants a force of $812$ kN forward (along the rocket) and $-37.5$ kN sideways. The gimbal angle is the direction of that force arrow measured from the forward axis:

$$
\delta = \operatorname{atan2}(-37.5,\ 812) \approx -0.04615\ \mathrm{rad} \approx -2.64^\circ .
$$

Here $x = 812$ is positive, so $\arctan(-37.5/812)$ would have given the same answer. The two functions agree on the right half of the plane — which is exactly why the bug hides in testing, when commands are always "mostly forward".

**Longitude.** A satellite's position in an **[[Earth-fixed frame|ecef]]** has $x = -2694.5$ km and $y = -4293.6$ km. (Its $z$, the height above the equator's plane, does not matter for longitude.) Longitude is the angle of $(x, y)$ measured from the $+x$ axis, which points at the Greenwich meridian in London.

- Arctangent: $y/x = 1.5935$, and $\arctan(1.5935) = 57.89^\circ$ — east longitude, over Oman and the Indian Ocean.
- atan2: $\operatorname{atan2}(-4293.6, -2694.5) = -122.11^\circ$ — west longitude, near the longitude of San Francisco.

Same satellite, opposite sides of the planet. The arctangent gets it wrong for every point with $x < 0$ — every longitude more than $90^\circ$ east or west of Greenwich, from Japan and Australia to California. That is half the world.
:::

## Ranges and compass directions

atan2 returns an angle in $(-\pi, \pi]$. Many quantities are usually quoted in $[0, 2\pi)$ instead: longitude measured east of Greenwich, star positions, **[[position around an orbit|true-anomaly]]**, compass directions. Changing ranges is a **[[modulo|modulo]]** operation. In Python, `theta % (2*math.pi)` turns $-122.11^\circ$ into $237.89^\circ$ and leaves positive angles alone. (Python's `%` gives an answer with the sign of the number you divide by, so for a positive $2\pi$ it never goes negative, even for a negative angle. C's `fmod` keeps the sign of the number being divided and needs an extra step. `numpy.mod` behaves like Python.)

Navigation adds a twist. The math angle is measured counterclockwise from the $+x$ axis (east). A compass **azimuth** or **heading** is measured *clockwise* from *north*. If you know how far east ($E$) and how far north ($N$) something is, then

$$
\text{azimuth} = \operatorname{atan2}(E,\ N),
$$

with the inputs in that order: north plays the part of $x$, and east the part of $y$. Swapping the axes reverses the direction of turning, which is exactly what the clockwise compass needs ([[picture|compass]]). Test it on the compass points. Due east is $(E, N) = (1, 0)$, and $\operatorname{atan2}(1, 0) = 90^\circ$. Northwest is $(E, N) = (-1, 1)$, and $\operatorname{atan2}(-1, 1) = -45^\circ$, which is $315^\circ$ after the modulo.

::: example Compass direction to a ground station
A ground station is $420$ km west and $610$ km north of the point directly below a satellite. West means negative east, so $E = -420$ km and $N = 610$ km.

**Azimuth**, clockwise from north: $\operatorname{atan2}(-420, 610) \approx -34.55^\circ$. Put it into $[0^\circ, 360^\circ)$ by adding a full turn: $-34.55 + 360 = 325.45^\circ$.

**Sanity check.** The station is mostly north and somewhat west — a bit west of due north. Due north is $0^\circ$ (or $360^\circ$) and due west is $270^\circ$, so an answer a little short of $360^\circ$ fits.

**Math angle**, counterclockwise from east: $\operatorname{atan2}(610, -420) \approx 124.55^\circ$. That is the same direction, described the other way: a bit more than a quarter turn from east, into the top-left quadrant.

Both numbers are correct. Any interface between two pieces of software must say which convention it uses.
:::

## Subtracting angles: the wrap problem

Picture a clock. It is 11 o'clock, and you want to know how far it is to 1 o'clock. Subtracting gives $1 - 11 = -10$ hours: ten hours backwards. But anyone looking at the clock can see it is two hours forward. Plain subtraction took the long way round, because it did not know the numbers wrap around after 12.

Angles have the same trouble. An angle is a point on a circle, but a computer variable holding an angle is a point on a line — the range $(-\pi, \pi]$ or $[0, 2\pi)$, like a circle cut open at one spot, a **[[seam|seam]]**, and laid flat. Two directions that sit close together on the circle, but on opposite sides of the seam, have numbers that differ by almost a full turn.

Let a commanded heading be $a = 170^\circ$ and the measured heading be $b = -175^\circ$. On the circle they are $15^\circ$ apart: $-175^\circ$ is the same direction as $185^\circ$, which is $15^\circ$ counterclockwise of $170^\circ$. But the plain error is $a - b = 170 - (-175) = 345^\circ$. A controller given that error decides the vehicle is pointing nearly backwards and swings hard, the long way round, $345^\circ$ — straight through the seam, where the error's sign flips and the whole thing may happen again. Motors have been driven flat out and gimbals slammed into their **[[stops|saturate]]** by exactly this, and real aircraft have been caught by the same seam in [[longitude|f22]].

The correct error is the **shortest signed angle** from $b$ to $a$ — how far to turn from where you are to where you want to be, going the short way, with the sign telling you which way. It always lies in $(-\pi, \pi]$. Here it is $-15^\circ$: turn $15^\circ$ clockwise. There are two standard ways to compute it.

**With atan2.** The sine and cosine of a difference only depend on the directions, not on which of the many equal-direction numbers were used, because both repeat every $2\pi$. So

$$
\Delta = \operatorname{atan2}\big(\sin(a - b),\ \cos(a - b)\big)
$$

is the angle in $(-\pi, \pi]$ that points the same way as $a - b$: the **wrapped** difference. ($\Delta$, "delta", means "difference".) For our numbers, $a - b = 345^\circ$, $\sin 345^\circ = -0.2588$ and $\cos 345^\circ = 0.9659$, so $\Delta = \operatorname{atan2}(-0.2588, 0.9659) = -15.0^\circ$.

**With a modulo.** Squeeze $a - b$ into $[0, 2\pi)$ with the modulo, then move anything above $\pi$ down by a full turn:

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

Both routes give the same answer for every input. The atan2 form costs two trig calculations; the modulo form costs one division. Use whichever your codebase already uses — and use it *everywhere* an angle error is formed.

::: key Differencing angles without a wrap bug
$\Delta = \operatorname{atan2}(\sin(a - b), \cos(a - b))$ always returns the shortest signed angle from $b$ to $a$, in $(-\pi, \pi]$. Equivalently, wrap $(a - b)$ with mod $2\pi$ and then subtract $2\pi$ if the result exceeds $\pi$.
:::

::: warning Every subtraction of two angles is suspect
Whenever you see `error = commanded - measured`, `delta = lon2 - lon1` or `phase_change = phase[k] - phase[k-1]` with angles on both sides, ask: can the two numbers sit on opposite sides of the seam? If both are sure to stay in a small range far from it — gimbal angles limited to $\pm 8^\circ$, latitudes, elevation angles — plain subtraction is fine. Headings, longitudes, phases, orbit positions and yaw angles (which way the nose points, left to right) can all wrap, and their differences must go through a wrap function.
:::

::: example Heading error across north
A rover's navigation says it is heading $355^\circ$ (just west of north), and the route planner commands $5^\circ$ (just east of north).

**Naive error**, command minus measurement: $5 - 355 = -350^\circ$. A controller that turns left for negative errors would spin the rover almost a full circle to the left.

**Wrapped, with the modulo.** $-350^\circ$ modulo $360^\circ$: add a full turn to get $10^\circ$. That is not above $180^\circ$, so it stays. The shortest correction is $+10^\circ$: a small turn to the right, through north.

**Wrapped, with atan2.** $\sin(-350^\circ) = 0.1736$ and $\cos(-350^\circ) = 0.9848$, so $\operatorname{atan2}(0.1736, 0.9848) = 10.0^\circ$. Same answer.

Sanity check: from $5^\circ$ west of north to $5^\circ$ east of north is $10^\circ$ to the right. Exactly what the picture says.
:::

## Averages and in-between angles on the circle

The wrap problem spoils every calculation that treats angles as ordinary numbers, not only subtraction. The plain average of the headings $350^\circ$ and $10^\circ$ is $(350 + 10)/2 = 180^\circ$ — due south — for two readings that are both nearly due north.

The cure uses the same idea as atan2: work with arrows instead of angles. Turn each angle into an arrow of length $1$ (its cosine and sine), average the arrows, and take the direction of the result. For angles $\theta_1, \ldots, \theta_n$:

$$
\bar\theta = \operatorname{atan2}\!\left(\frac{1}{n}\sum_{k=1}^{n}\sin\theta_k,\ \frac{1}{n}\sum_{k=1}^{n}\cos\theta_k\right).
$$

($\bar\theta$ is read "theta bar", a common name for an average. The $\sum$, capital Greek "sigma", means "add up": $\sum_{k=1}^{n}\sin\theta_k$ is $\sin\theta_1 + \sin\theta_2 + \cdots + \sin\theta_n$.) This is the **[[circular mean|circular-mean]]**.

Take five sun-sensor readings: $350^\circ, 355^\circ, 2^\circ, 8^\circ, 15^\circ$. The plain average is $146^\circ$, which is nonsense. The average sine is $0.0344$, the average cosine is $0.9873$, and the circular mean is $\operatorname{atan2}(0.0344, 0.9873) = 2.0^\circ$ — right where the readings cluster. The length of the average arrow, $\sqrt{0.0344^2 + 0.9873^2} = 0.988$, is close to $1$, which tells you the readings are tightly grouped. Widely scattered angles give an average arrow near zero length.

To move smoothly from angle $a$ to angle $b$ — ramping a gimbal command, say — wrap the difference first, then move a fraction $s$ of it, where $s$ runs from $0$ to $1$: $\theta(s) = a + s\,\Delta$, with $\Delta$ the wrapped difference from $a$ to $b$. Going from $350^\circ$ to $10^\circ$ by the raw numbers would sweep back through $180^\circ$. Using the wrapped difference of $+20^\circ$ passes through north, as intended.

Finally, suppose you record an angle over time and it jumps from $179^\circ$ to $-179^\circ$ between two samples. The vehicle did not turn $358^\circ$ in one step; it turned $2^\circ$ across the seam. For plotting, and for working out turning rates by subtracting samples, **[[unwrap|unwrap]]** the record: add or subtract $360^\circ$ whenever a step is bigger than $180^\circ$, so the trace stays smooth. `numpy.unwrap` does exactly this.

## Check yourself

::: check
An arrow of length $1$ has components $(x, y) = (-0.6, 0.8)$. What do $\arctan(y/x)$ and $\operatorname{atan2}(y, x)$ return, in degrees? Which is right, and how do you know?
:::

::: answer
$y/x = 0.8/(-0.6) \approx -1.333$, so $\arctan(-1.333) = -53.13^\circ$: a direction in quadrant IV, down and to the right. $\operatorname{atan2}(0.8, -0.6) = 126.87^\circ$, in quadrant II.

The arrow has $x < 0$ and $y > 0$, so it points up and to the left: quadrant II. atan2 is right. The arctangent is off by exactly $180^\circ$, because $(-0.6, 0.8)$ and $(0.6, -0.8)$ have the same ratio.
:::

::: check
Explain, without numbers, what goes wrong if longitude is computed as $\arctan(y/x)$ from Earth-fixed coordinates for a satellite over the Pacific, where $x < 0$ and $y < 0$.
:::

::: answer
With $x$ and $y$ both negative, the ratio is positive, so the arctangent returns an angle between $0^\circ$ and $90^\circ$ — an east longitude. The satellite is really in the western hemisphere, at a longitude between $-90^\circ$ and $-180^\circ$. The reported position is on the far side of the Earth, $180^\circ$ off.

Everything built on that longitude — which ground stations can see the satellite, when to send it data, the ground-track plot — would be wrong, and nothing would flag the error.
:::

::: check
In a code review, a gimbal controller contains `err = cmd - meas`, with both angles in radians and nothing else done to them. When is this acceptable, and what is the one-line fix when it is not?
:::

::: answer
It is acceptable only when both angles are sure to stay in a small range far from the $\pm\pi$ seam — for a gimbal that can physically only tilt a few degrees, for example.

If either angle can get near $\pm\pi$ (a yaw angle, a heading, a phase), replace it with `err = math.atan2(math.sin(cmd - meas), math.cos(cmd - meas))`, which returns the shortest signed error in $(-\pi, \pi]$.
:::

::: check
Five heading readings are $358^\circ, 2^\circ, 359^\circ, 1^\circ, 3^\circ$. Compute the plain average and the circular mean.
:::

::: answer
Plain average: $(358 + 2 + 359 + 1 + 3)/5 = 723/5 = 144.6^\circ$. That is absurd for five readings all within $3^\circ$ of north.

Circular mean. The sines are $-0.0349, 0.0349, -0.0175, 0.0175, 0.0523$, with average $0.01047$. The cosines are all between about $0.9986$ and $0.9998$, with average $0.99942$. Then $\bar\theta = \operatorname{atan2}(0.01047, 0.99942) \approx 0.60^\circ$.

Sanity check: written as $-2, 2, -1, 1, 3$ (degrees from north), the readings average to $3/5 = 0.6^\circ$.
:::

::: check
From a lander, a beacon is $120$ m east and $90$ m south. What is its compass azimuth, and how far away is it?
:::

::: answer
East component $E = 120$. South is negative north, so $N = -90$.

Azimuth $= \operatorname{atan2}(E, N) = \operatorname{atan2}(120, -90) \approx 126.87^\circ$. That is between east ($90^\circ$) and south ($180^\circ$) — southeast, and more east than south, matching the picture.

Distance, by Pythagoras: $\sqrt{120^2 + 90^2} = \sqrt{22\,500} = 150$ m.

Using $\arctan(120/(-90)) = -53.13^\circ$ instead would have put the beacon to the northwest.
:::

::: check
Squeeze each angle into $(-\pi, \pi]$ (or $(-180^\circ, 180^\circ]$): $7.5$ rad and $-200^\circ$.
:::

::: answer
$7.5$ rad: take out one full turn, $7.5 - 2\pi \approx 1.2168$ rad. That is between $0$ and $\pi \approx 3.14$, so it stays: $1.2168$ rad (about $69.7^\circ$).

$-200^\circ$: modulo $360^\circ$ gives $-200 + 360 = 160^\circ$. That is not above $180^\circ$, so it stays: $160^\circ$.

Sanity check: $200^\circ$ clockwise from east is $20^\circ$ past west, going round through south to the top-left quadrant — which is exactly where $160^\circ$ counterclockwise points.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\operatorname{atan2}(y, x)$ | Angle of $(x, y)$ in $(-\pi, \pi]$; correct in all four quadrants; defined at $x = 0$ |
| $\arctan(y/x)$ | Range $(-\pi/2, \pi/2)$ only; confuses $(x, y)$ with $(-x, -y)$; fails at $x = 0$ |
| Argument order | `atan2(y, x)` in C, Python, NumPy, MATLAB; some tools reverse it |
| $\theta \bmod 2\pi$ | Reduce to $[0, 2\pi)$; Python `%` does this correctly for negatives |
| $\text{azimuth} = \operatorname{atan2}(E, N)$ | Clockwise from north; convert to $[0, 360^\circ)$ with a modulo |
| $\Delta = \operatorname{atan2}(\sin(a-b), \cos(a-b))$ | Shortest signed angle from $b$ to $a$, in $(-\pi, \pi]$ |
| Wrap by modulo | $(a - b) \bmod 2\pi$, then subtract $2\pi$ if the result exceeds $\pi$ |
| Circular mean | $\operatorname{atan2}(\text{mean}\sin\theta_k, \text{mean}\cos\theta_k)$ |
| Unwrap | Add $\pm 2\pi$ to a time series wherever a step exceeds $\pi$ |

Next lesson: the algebra of the functions themselves — the identities that let you add angles, double them and halve them. They are what make rotations stack up correctly, and they give the small-angle shortcuts their form.

::: context atan-fold What the arctangent sees
The true arrow $(-3, 4)$ points up and to the left (blue). Its opposite, $(3, -4)$, points down and to the right (red, dashed). Both have $y/x = -4/3$, so the arctangent gives the same answer for both: the red one's angle, $-53.1^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="fb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="fr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
  </defs>
  <line x1="60" y1="105" x2="300" y2="105" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="180" y1="10" x2="180" y2="200" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="180" y1="105" x2="126" y2="33" stroke="#1d6fd1" stroke-width="3" marker-end="url(#fb)"/>
  <line x1="180" y1="105" x2="234" y2="177" stroke="#b4232c" stroke-width="3" stroke-dasharray="7 4" marker-end="url(#fr)"/>
  <text x="120" y="26" font-size="12" fill="#1d6fd1" text-anchor="end">(−3, 4)</text>
  <text x="240" y="190" font-size="12" fill="#b4232c">(3, −4)</text>
  <text x="20" y="150" font-size="12" fill="#1d6fd1">atan2: 126.9°</text>
  <text x="250" y="60" font-size="12" fill="#b4232c">atan(y/x):</text>
  <text x="250" y="76" font-size="12" fill="#b4232c">−53.1°</text>
  <text x="304" y="109" font-size="12" fill="#1f2a44">x</text>
  <text x="186" y="18" font-size="12" fill="#1f2a44">y</text>
</svg>
```

The two arrows are exactly $180^\circ$ apart. atan2 looks at the signs of $x$ and $y$ separately, so it knows which one you meant.
:::

::: context ecef A frame glued to the Earth
Engineers often describe positions in the **Earth-centered, Earth-fixed** frame, ECEF for short. Its origin is Earth's center. The $z$ axis points through the North Pole. The $x$ axis points out through the equator where it meets the Greenwich meridian, the line of zero longitude in London. The $y$ axis points out through the equator at $90^\circ$ east, in the Indian Ocean.

The frame turns with the Earth, so a building stays at fixed $x$, $y$, $z$. GPS receivers work in this frame, and turning ECEF into latitude, longitude and height is one of this module's exercises. The longitude part is a single atan2.
:::

::: context true-anomaly Where along the orbit
A spacecraft's position around its orbit is measured by an angle called the **true anomaly**, written $\nu$ (the Greek letter "nu"), counted from the orbit's closest point to the planet. It runs all the way round, from $0^\circ$ to $360^\circ$, so it lives in every quadrant — and working it out from position and velocity needs atan2, not arctan.

"Anomaly" is an old astronomers' word for an angle that describes a planet's position. You will meet $\nu$ again in the conic-sections lesson, in the orbit equation $r = p/(1 + e\cos\nu)$.
:::

::: context modulo Clock arithmetic
**Modulo** means "the remainder after taking out as many whole ones as fit". A clock does it with hours: $15$ hours after midnight, the clock says $3$, because $15 \bmod 12 = 3$.

For angles you take out whole turns: $400^\circ \bmod 360^\circ = 40^\circ$. Negative angles get whole turns *added* until they land in range: $-122^\circ \bmod 360^\circ = 238^\circ$. In Python the modulo operator is `%`, so `400 % 360` gives `40` and `-122 % 360` gives `238`.
:::

::: context compass Compass azimuth versus math angle
The same arrow can be described two ways. A compass measures clockwise from north (red); math measures counterclockwise from east (blue). This arrow has azimuth $60^\circ$ and math angle $30^\circ$. The two always add up to $90^\circ$, give or take a whole turn.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs><marker id="ca" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker></defs>
  <line x1="80" y1="110" x2="280" y2="110" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="180" y1="15" x2="180" y2="190" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="180" y="12" font-size="12" fill="#1f2a44" text-anchor="middle">N</text>
  <text x="290" y="114" font-size="12" fill="#1f2a44">E</text>
  <line x1="180" y1="110" x2="253.61" y2="67.5" stroke="#1f2a44" stroke-width="3" marker-end="url(#ca)"/>
  <path d="M180,65 A45,45 0 0,1 218.97,87.5" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <path d="M205,110 A25,25 0 0,0 201.65,97.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="206" y="56" font-size="12" fill="#b4232c">azimuth 60°</text>
  <text x="214" y="128" font-size="12" fill="#1d6fd1">math angle 30°</text>
  <text x="20" y="160" font-size="12" fill="#1f2a44">azimuth = atan2(E, N)</text>
  <text x="20" y="178" font-size="12" fill="#1f2a44">math angle = atan2(N, E)</text>
</svg>
```

Swapping the two inputs of atan2 swaps which axis you measure from and which way you turn.
:::

::: context seam The circle cut open
On the circle (left), $170^\circ$ and $-175^\circ$ sit only $15^\circ$ apart, one on each side of the seam at $180^\circ$. Laid out as numbers from $-180$ to $180$ (right), they end up at opposite ends.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="80" cy="95" r="55" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="14" y1="95" x2="36" y2="95" stroke="#b4232c" stroke-width="3"/>
  <circle cx="25.84" cy="85.45" r="5" fill="#1d6fd1"/>
  <circle cx="25.21" cy="99.79" r="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="80" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">seam at 180°</text>
  <text x="40" y="74" font-size="11" fill="#1d6fd1">170°</text>
  <text x="40" y="122" font-size="11" fill="#1f2a44">−175°</text>
  <line x1="170" y1="95" x2="340" y2="95" stroke="#1f2a44" stroke-width="2"/>
  <line x1="170" y1="86" x2="170" y2="104" stroke="#b4232c" stroke-width="3"/>
  <line x1="340" y1="86" x2="340" y2="104" stroke="#b4232c" stroke-width="3"/>
  <line x1="255" y1="89" x2="255" y2="101" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="335.28" cy="95" r="5" fill="#1d6fd1"/>
  <circle cx="172.36" cy="95" r="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="170" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">−180</text>
  <text x="255" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="340" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">180</text>
  <text x="255" y="150" font-size="12" fill="#1f2a44" text-anchor="middle">plain subtraction: 345° apart</text>
</svg>
```

Wrapping the difference is how you glue the seam back together.
:::

::: context saturate Driven to the stops
An **actuator** is the motor or piston that moves something — a gimbal, a fin, a valve. Every actuator has limits: a top speed, and a furthest position it can reach, called its **stops**. An actuator running as hard as it can is said to be **saturated**.

A controller that thinks the error is $345^\circ$ asks for the biggest possible correction. The actuator saturates, swings as fast as it can, and may crash into its stops — wasting fuel, shaking the vehicle, and sometimes damaging the hardware or losing control entirely.
:::

::: context f22 Six fighter jets and the date line
In February 2007, six F-22 Raptor fighter jets flew from Hawaii toward Japan. As they crossed the International Date Line, where longitude jumps between $+180^\circ$ and $-180^\circ$, their navigation computers failed and several systems went dark, including parts of their communications.

The pilots could not navigate on their own, so they followed their refueling tanker planes back to Hawaii. Reports blamed software that did not handle the jump in longitude. It was fixed within days. It is the wrap problem in real life: a seam in the numbers that the real world does not have.
:::

::: context circular-mean Averaging arrows, not numbers
Readings of $10^\circ$ and $350^\circ$ are two arrows either side of the $+x$ direction (blue). Adding them, the up and down parts cancel, and the average arrow (black) points straight along $0^\circ$. Averaging the plain numbers gives $180^\circ$ (red, dashed) — exactly the wrong way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="mb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="mk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
    <marker id="mr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
  </defs>
  <circle cx="150" cy="100" r="90" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="150" y1="100" x2="238.63" y2="84.37" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#mb)"/>
  <line x1="150" y1="100" x2="238.63" y2="115.63" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#mb)"/>
  <line x1="150" y1="100" x2="236" y2="100" stroke="#1f2a44" stroke-width="3" marker-end="url(#mk)"/>
  <line x1="150" y1="100" x2="80" y2="100" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 4" marker-end="url(#mr)"/>
  <text x="246" y="80" font-size="12" fill="#1d6fd1">10°</text>
  <text x="246" y="128" font-size="12" fill="#1d6fd1">350°</text>
  <text x="252" y="104" font-size="12" fill="#1f2a44">circular mean 0°</text>
  <text x="20" y="92" font-size="12" fill="#b4232c">plain 180°</text>
</svg>
```

The average arrow is a little shorter than $1$ ($\cos 10^\circ \approx 0.985$). The more the readings disagree, the shorter it gets.
:::

::: context unwrap Unwrapping a recording
A plot of heading against time for a vehicle turning steadily looks like a saw blade if it is stored in $(-180^\circ, 180^\circ]$: it climbs to $180^\circ$, drops instantly to $-180^\circ$, and climbs again. Those cliffs are not real.

Unwrapping walks along the record and, every time a step is bigger than half a turn, adds or subtracts a full turn to everything after it. The saw blade becomes a smooth, ever-rising line — $170^\circ$, $179^\circ$, $188^\circ$, $197^\circ$ — and subtracting neighbors now gives the true turning rate.
:::
