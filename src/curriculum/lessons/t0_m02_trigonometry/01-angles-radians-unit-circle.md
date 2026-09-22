---
id: l01-angles-radians-unit-circle
title: Angles, radians and the unit circle
minutes: 20
covers:
  - radians vs degrees
  - the unit circle
---

Almost every number a guidance, navigation and control engineer handles that is not a distance, a speed or a mass is an angle. The gimbal on a Merlin engine swings through a few degrees to steer a Falcon 9. A star tracker reports where the camera boresight points to within a few arcseconds. A launch site is named by two angles, latitude and longitude. An orbit is described by five angles and one length. Attitude control is the business of driving three angles to three commanded values, and the error signal in that loop is a difference of angles.

Angles look harmless, but they have two habits that break software. First, they come in two units, degrees and radians, and every mathematical formula you will ever use wants radians while every human wants degrees. Second, an angle and that angle plus one full turn describe the same direction, so ordinary subtraction can report a 359° error when the true error is 1°. This lesson deals with the first habit and lays the groundwork for the second. Along the way it builds the unit circle: the single picture that turns an angle into a direction and defines sine and cosine for every angle, not only the acute angles of a right triangle.

Work through it with a pencil. The unit circle is something you want in your hands, not only in your memory.

## What an angle measures

An angle is an amount of rotation. Take a ray from a point $O$, rotate it about $O$ until it lies along a second ray, and the angle between the rays is how far you turned. Counterclockwise is the positive direction by convention; clockwise rotations are negative angles.

To put a number on the rotation, draw a circle of radius $r$ centred on $O$ and measure the arc $s$ that the rotating ray sweeps out. The arc grows in proportion to the radius — double the radius, double the arc — so the ratio does not depend on which circle you drew. That ratio is the angle in radians:

$$
\theta = \frac{s}{r}, \qquad s = r\,\theta .
$$

A radian is therefore a ratio of two lengths and has no physical dimension. A full turn sweeps the whole circumference, $s = 2\pi r$, so a full turn is $2\pi$ radians. A half turn is $\pi$, a quarter turn is $\pi/2$.

Degrees divide the full turn into 360 equal parts instead. The number 360 is a historical accident — it is close to the number of days in a year and divides evenly by many small integers — and nothing in mathematics prefers it. Because both systems measure the same full turn,

$$
2\pi\ \mathrm{rad} = 360^\circ \quad\Longrightarrow\quad 1\ \mathrm{rad} = \frac{180^\circ}{\pi} \approx 57.2958^\circ, \qquad 1^\circ = \frac{\pi}{180}\ \mathrm{rad} \approx 0.0174533\ \mathrm{rad}.
$$

::: key Degrees and radians
$\mathrm{rad} = \mathrm{deg} \times \pi/180$ and $\mathrm{deg} = \mathrm{rad} \times 180/\pi$. One radian is about $57.2958^\circ$. A full turn is $2\pi$ rad $= 360^\circ$.
:::

Some landmarks are worth knowing cold, because they appear constantly and you should not reach for a calculator:

| Degrees | Radians | Fraction of a turn |
| --- | --- | --- |
| $30^\circ$ | $\pi/6 \approx 0.5236$ | 1/12 |
| $45^\circ$ | $\pi/4 \approx 0.7854$ | 1/8 |
| $60^\circ$ | $\pi/3 \approx 1.0472$ | 1/6 |
| $90^\circ$ | $\pi/2 \approx 1.5708$ | 1/4 |
| $180^\circ$ | $\pi \approx 3.1416$ | 1/2 |
| $270^\circ$ | $3\pi/2 \approx 4.7124$ | 3/4 |
| $360^\circ$ | $2\pi \approx 6.2832$ | 1 |

A useful sanity check: one radian is a little less than $60^\circ$, so an angle of 1.2 rad is a little under $70^\circ$ (it is $68.75^\circ$), and an angle of 2.5 rad is well past a right angle (it is $143.24^\circ$). If you compute an angle and the number does not fit that picture, you have probably mixed units.

## Why the mathematics insists on radians

If degrees and radians are only two scales for the same quantity, why not keep everything in degrees? Because the radian is the unit in which the geometry becomes arithmetic.

The arc-length relation $s = r\theta$ is the first example. A satellite at radius $r$ that has moved through a central angle $\theta$ has covered a distance $r\theta$ along its orbit — but only if $\theta$ is in radians. In degrees the same statement needs a factor of $\pi/180$ in front, and that factor turns up in every formula that follows: the speed of a point moving on a circle, the relation between angular rate and linear velocity, the small-angle approximation of the next lessons, and every derivative of a trigonometric function you will meet in calculus.

Angular rate is the second example. A point moving at speed $v$ along a circle of radius $r$ covers arc $v\,\Delta t$ in time $\Delta t$, so its angle changes by $v\,\Delta t / r$, and its angular rate is

$$
\omega = \frac{v}{r} \quad \mathrm{rad/s}.
$$

Reaction wheel speeds, spacecraft spin rates and orbital rates are all naturally expressed this way. A wheel spinning at 3000 rpm turns $3000 \times 2\pi$ radians per minute, which is $314\ \mathrm{rad/s}$.

The practical rule in flight software is: store and compute angles in radians, and convert to degrees only at the moment of display or in a message a human will read. Every mathematical library follows the same rule. In Python, `math.sin(30)` is the sine of 30 radians, not of $30^\circ$, and it equals about $-0.988$ — a number that has confused generations of first-time users.

::: warning Library functions take radians
`math.sin`, `math.cos`, `math.tan`, `numpy.sin` and every equivalent in C, Fortran, MATLAB and Julia expect radians. If a value is in degrees, convert first: `math.sin(math.radians(30))` gives 0.5. The reverse conversion is `math.degrees`. Getting this wrong does not raise an error — it silently produces a number that looks plausible.
:::

### Small units of angle

Pointing requirements are usually much smaller than a degree, so smaller units are common:

- An **arcminute** is $1/60$ of a degree; an **arcsecond** is $1/60$ of an arcminute, so $1'' = 1/3600$ degree $\approx 4.848 \times 10^{-6}$ rad. A **milliarcsecond** (mas) is a thousandth of that.
- A **milliradian** (mrad) is $10^{-3}$ rad $\approx 0.0573^\circ \approx 3.44'$; a **microradian** (μrad) is $10^{-6}$ rad $\approx 0.206''$.

Typical magnitudes: a launch-vehicle engine gimbals through about $\pm 5^\circ$ to $\pm 8^\circ$; a good star tracker reports attitude to a few arcseconds (3 arcsec is $14.5\ \mathrm{μrad}$); the Hubble Space Telescope holds its pointing steady to about 7 mas, which is $3.4 \times 10^{-8}$ rad. Because $s = r\theta$, a small angle at a long lever arm becomes a large distance: a 1 arcsecond pointing error viewed from 550 km altitude moves the aim point on the ground by $550\,000 \times 4.848 \times 10^{-6} \approx 2.67\ \mathrm{m}$.

::: example Angular rate of a low Earth orbit
The International Space Station orbits at about 420 km altitude. Take the Earth's mean radius as 6371 km, so the orbit radius is $r = 6791\ \mathrm{km}$. Its speed follows from the circular-orbit relation $v = \sqrt{\mu/r}$ with $\mu = 3.986 \times 10^{14}\ \mathrm{m^3/s^2}$:

$$
v = \sqrt{\frac{3.986 \times 10^{14}}{6.791 \times 10^{6}}} \approx 7661\ \mathrm{m/s}.
$$

The angular rate is $\omega = v/r = 7661 / (6.791 \times 10^{6}) \approx 1.128 \times 10^{-3}\ \mathrm{rad/s}$. In degrees that is $1.128 \times 10^{-3} \times 180/\pi \approx 0.0646^\circ/\mathrm{s}$, or about $3.88^\circ$ per minute. One full turn takes $2\pi/\omega \approx 5570\ \mathrm{s}$, which is 92.8 minutes — the familiar ISS period. Notice that the radian version of $\omega$ went straight into the period formula with no conversion factor; the degree version could not have.
:::

## The unit circle

Now the central picture. Draw the circle of radius 1 centred at the origin of an $xy$ plane. Start at the point $(1, 0)$ on the positive $x$ axis and travel counterclockwise along the circle through an angle $\theta$. You arrive at some point $P$. The **cosine** of $\theta$ is defined to be the $x$ coordinate of $P$ and the **sine** of $\theta$ is its $y$ coordinate:

$$
P = (\cos\theta,\ \sin\theta).
$$

Read that as a definition, not a theorem. It is the definition that works for every angle. A negative $\theta$ means travel clockwise. An angle larger than $2\pi$ means going round more than once. In every case there is a definite point $P$, hence a definite cosine and sine. Right-triangle definitions, which you may have met first, only make sense for angles between $0$ and $\pi/2$; the next lesson shows they agree with this one where both apply.

Three consequences are immediate:

- Since $P$ lies on a circle of radius 1, its coordinates satisfy $x^2 + y^2 = 1$, which is the **Pythagorean identity** $\cos^2\theta + \sin^2\theta = 1$. Every trigonometric identity descends from this circle one way or another.
- Neither coordinate can exceed the radius, so $-1 \le \cos\theta \le 1$ and $-1 \le \sin\theta \le 1$ for every $\theta$.
- The signs follow the quadrant. In quadrant I (angles from $0$ to $\pi/2$) both are positive. In quadrant II ($\pi/2$ to $\pi$) $x$ is negative, so cosine is negative and sine positive. In quadrant III ($\pi$ to $3\pi/2$) both are negative. In quadrant IV ($3\pi/2$ to $2\pi$) cosine is positive and sine negative.

The unit circle is also the set of all possible directions in a plane. Any vector of length $L$ pointing at angle $\theta$ from the $+x$ axis is the unit-circle point scaled by $L$, so its components are

$$
(x, y) = (L\cos\theta,\ L\sin\theta).
$$

This is how a thrust magnitude and a gimbal angle become a force in body axes, how a wind speed and direction become two velocity components, and how a range and bearing become a position. You will do this decomposition thousands of times.

::: example Resolving a gimballed thrust
A first-stage engine produces 845 kN of thrust and is gimballed $5^\circ$ away from the vehicle centreline. Put the $x$ axis along the centreline; the thrust vector then sits at angle $\theta = 5^\circ = 0.08727\ \mathrm{rad}$ from it.

The axial component is $845 \cos 5^\circ = 845 \times 0.99619 \approx 841.8\ \mathrm{kN}$, and the lateral (steering) component is $845 \sin 5^\circ = 845 \times 0.08716 \approx 73.6\ \mathrm{kN}$. Two things to notice: five degrees of gimbal costs only $3.2\ \mathrm{kN}$ of axial thrust, about 0.4%, while producing a sideways force of 73.6 kN — which is why small gimbal angles give ample control authority. And the two components recombine correctly: $\sqrt{841.8^2 + 73.6^2} \approx 845\ \mathrm{kN}$.
:::

## The special angles

For most angles you need a calculator to find the coordinates of $P$. For a handful you can find them exactly with two triangles, and those exact values are worth memorising because they let you check calculations by eye.

**45°.** The point at $\pi/4$ lies on the line $y = x$, so its coordinates are equal: $x = y$ with $x^2 + y^2 = 1$ gives $2x^2 = 1$, so $x = y = 1/\sqrt{2} = \sqrt{2}/2 \approx 0.7071$.

**30° and 60°.** Take an equilateral triangle with side 1. All its angles are $60^\circ$. Drop a perpendicular from one vertex to the opposite side; it bisects that side and the vertex angle, producing a right triangle with hypotenuse 1, one leg $1/2$, and angles $30^\circ$ and $60^\circ$. Pythagoras gives the other leg $\sqrt{1 - 1/4} = \sqrt{3}/2$. Placing that triangle in the unit circle: at $\theta = 30^\circ$ the point is $(\sqrt{3}/2,\ 1/2)$, and at $\theta = 60^\circ$ it is $(1/2,\ \sqrt{3}/2)$.

| $\theta$ | $0$ | $\pi/6$ ($30^\circ$) | $\pi/4$ ($45^\circ$) | $\pi/3$ ($60^\circ$) | $\pi/2$ ($90^\circ$) |
| --- | --- | --- | --- | --- | --- |
| $\cos\theta$ | $1$ | $\sqrt{3}/2 \approx 0.866$ | $\sqrt{2}/2 \approx 0.707$ | $1/2$ | $0$ |
| $\sin\theta$ | $0$ | $1/2$ | $\sqrt{2}/2 \approx 0.707$ | $\sqrt{3}/2 \approx 0.866$ | $1$ |

Cosine decreases from 1 to 0 across the first quadrant while sine rises from 0 to 1; the two columns are mirror images of each other. That mirror is the identity $\cos(\pi/2 - \theta) = \sin\theta$, which the next section explains.

## Symmetries of the circle

The circle has reflections and a half-turn built into it, and each symmetry is an identity you get for free.

**Reflection in the $x$ axis** sends the point at $\theta$ to the point at $-\theta$. The $x$ coordinate is unchanged and the $y$ coordinate flips sign:

$$
\cos(-\theta) = \cos\theta, \qquad \sin(-\theta) = -\sin\theta .
$$

Cosine is an even function and sine an odd function. Reversing the direction of a rotation reverses the sine and leaves the cosine alone.

**Reflection in the $y$ axis** sends $\theta$ to $\pi - \theta$ (a point at $30^\circ$ goes to $150^\circ$). Now $x$ flips and $y$ is unchanged:

$$
\cos(\pi - \theta) = -\cos\theta, \qquad \sin(\pi - \theta) = \sin\theta .
$$

This one matters for solving equations: $\sin\theta = 0.3$ has a solution in quadrant I and a second one in quadrant II, and the second is $\pi$ minus the first.

**A half turn** sends $\theta$ to $\theta + \pi$, the diametrically opposite point. Both coordinates flip:

$$
\cos(\theta + \pi) = -\cos\theta, \qquad \sin(\theta + \pi) = -\sin\theta .
$$

**Reflection in the diagonal** $y = x$ swaps the coordinates and sends $\theta$ to $\pi/2 - \theta$:

$$
\cos\!\left(\tfrac{\pi}{2} - \theta\right) = \sin\theta, \qquad \sin\!\left(\tfrac{\pi}{2} - \theta\right) = \cos\theta .
$$

These are the cofunction identities; "cosine" literally means the sine of the complementary angle.

**Reference angles.** Any point on the circle is a reflection of a first-quadrant point. To evaluate $\cos 210^\circ$, note that $210^\circ = 180^\circ + 30^\circ$, so the point is the half-turn image of the $30^\circ$ point: $\cos 210^\circ = -\cos 30^\circ = -\sqrt{3}/2 \approx -0.866$ and $\sin 210^\circ = -\sin 30^\circ = -1/2$. The acute angle between the ray and the $x$ axis ($30^\circ$ here) is called the reference angle; the quadrant supplies the signs.

::: example Every angle with a given cosine
Find every $\theta$ in $[0, 2\pi)$ with $\cos\theta = -1/2$.

Cosine is the $x$ coordinate, so we want the points of the unit circle on the vertical line $x = -1/2$. That line cuts the circle twice, once above the axis and once below, so there are exactly two solutions. The reference angle is the first-quadrant angle with cosine $1/2$, which is $\pi/3$ ($60^\circ$). A negative cosine puts the points in quadrants II and III. Quadrant II: $\theta = \pi - \pi/3 = 2\pi/3$ ($120^\circ$), where $\sin\theta = +\sqrt{3}/2$. Quadrant III: $\theta = \pi + \pi/3 = 4\pi/3$ ($240^\circ$), where $\sin\theta = -\sqrt{3}/2$. Check with the table: $\cos 120^\circ = -0.5$ and $\cos 240^\circ = -0.5$.

The lesson to carry forward: a cosine alone never pins down an angle. You need the sine too — or equivalently the sign of $y$ — to know which of the two candidates you have. That fact drives the whole of lesson 3.
:::

## Periodicity and the seed of the wrap problem

Travel $2\pi$ radians from any point on the circle and you arrive back where you started. So $\theta$ and $\theta + 2\pi$ give the same point, and hence

$$
\cos(\theta + 2\pi k) = \cos\theta, \qquad \sin(\theta + 2\pi k) = \sin\theta \qquad \text{for every integer } k .
$$

Sine and cosine are **periodic** with period $2\pi$. Angles that differ by a whole number of turns are called coterminal; $400^\circ$, $40^\circ$ and $-320^\circ$ all name the same direction, as do 9 rad and $9 - 2\pi \approx 2.717$ rad.

This is convenient for evaluating functions and dangerous for comparing angles. A heading of $350^\circ$ and a heading of $-10^\circ$ are the same direction. A controller that computes their difference by ordinary subtraction sees $360^\circ$, decides the vehicle is pointed the wrong way, and commands a full-rate slew when no correction was needed. The rules for reducing an angle to a standard range, and for taking the difference of two angles correctly, are the subject of lesson 3. For now, the habit to form is: whenever you produce an angle, know which range it is in, $[0, 2\pi)$ or $(-\pi, \pi]$, and be suspicious of any code that subtracts two angles without saying so.

::: note Two standard ranges
Both $[0, 2\pi)$ and $(-\pi, \pi]$ are in common use. Longitudes, true anomalies and right ascensions are usually quoted in $[0, 2\pi)$ (or $[0^\circ, 360^\circ)$); errors, gimbal deflections and latitudes are usually quoted in the symmetric range. Reducing a value to $[0, 2\pi)$ is the operation $\theta \bmod 2\pi$ — in Python `theta % (2*math.pi)`, which returns a non-negative result even for negative input.
:::

## Check yourself

::: check
Convert 0.35 rad to degrees and $225^\circ$ to radians, giving the second answer both as a decimal and as a multiple of $\pi$.
:::

::: answer
$0.35 \times 180/\pi = 20.05^\circ$. For the reverse, $225 \times \pi/180 = 3.927\ \mathrm{rad}$; since $225 = 5 \times 45$, this is $5\pi/4$. Sanity check: $5\pi/4$ is a bit more than $\pi$ (a half turn), and $225^\circ$ is a bit more than $180^\circ$.
:::

::: check
A satellite at orbit radius 6771 km travels at 7.67 km/s. What is its angular rate in degrees per second, and how long does it take to move through one degree of central angle?
:::

::: answer
$\omega = v/r = 7.67/6771 = 1.133 \times 10^{-3}\ \mathrm{rad/s}$ (kilometres cancel). In degrees: $1.133 \times 10^{-3} \times 57.296 = 0.0649^\circ/\mathrm{s}$. One degree therefore takes $1/0.0649 \approx 15.4\ \mathrm{s}$. Roughly: a LEO satellite sweeps about 4 degrees of central angle every minute.
:::

::: check
Write down the exact coordinates of the unit-circle point at $\theta = 5\pi/3$, and name another angle in $[0, 2\pi)$ that has the same cosine.
:::

::: answer
$5\pi/3 = 300^\circ$ is in quadrant IV with reference angle $60^\circ$ (since $360^\circ - 300^\circ = 60^\circ$). So $\cos(5\pi/3) = +\cos(\pi/3) = 1/2$ and $\sin(5\pi/3) = -\sin(\pi/3) = -\sqrt{3}/2$. The point is $(1/2, -\sqrt{3}/2)$. The same cosine occurs at the reflection in the $x$ axis, $\theta = \pi/3$, where the sine is $+\sqrt{3}/2$.
:::

::: check
A star tracker has a 2 arcsecond error. If the spacecraft is at 400 km altitude and pointing straight down, how far is the aim point displaced on the ground? Treat the ground as flat over that distance.
:::

::: answer
Convert to radians: $2'' = 2/3600$ degree $= 5.556 \times 10^{-4}$ degree $= 9.70 \times 10^{-6}\ \mathrm{rad}$. Then $s = r\theta = 400\,000 \times 9.70 \times 10^{-6} \approx 3.9\ \mathrm{m}$. A few arcseconds of attitude knowledge is worth a few metres of geolocation from low orbit.
:::

::: check
Without a calculator, which is larger: $\sin 1$ or $\sin 1^\circ$? Roughly how much larger?
:::

::: answer
$\sin 1$ means the sine of one radian, about $57.3^\circ$, which is a little less than $\sin 60^\circ = 0.866$; the exact value is 0.841. $\sin 1^\circ$ is the sine of a tiny angle and is close to the angle itself in radians, $0.01745$. So $\sin 1$ is about 48 times larger. If a computation involving `math.sin(1)` returns something near 0.017, degrees have leaked into a radian formula somewhere.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\theta = s/r$ | Angle in radians is arc length over radius; $s = r\theta$ |
| $2\pi\ \mathrm{rad} = 360^\circ$ | $\mathrm{rad} = \mathrm{deg}\times\pi/180$; $1\ \mathrm{rad} \approx 57.2958^\circ$ |
| $\omega = v/r$ | Angular rate in rad/s of a point moving at speed $v$ on radius $r$ |
| $1'' \approx 4.848 \times 10^{-6}$ rad | Arcsecond; 1 mrad $\approx 0.0573^\circ$ |
| $(\cos\theta, \sin\theta)$ | Point reached on the unit circle after rotating $\theta$ from $(1, 0)$ |
| $\cos^2\theta + \sin^2\theta = 1$ | The point lies on the unit circle |
| $(L\cos\theta, L\sin\theta)$ | Components of a vector of length $L$ at angle $\theta$ |
| $\cos(-\theta) = \cos\theta$, $\sin(-\theta) = -\sin\theta$ | Reflection in the $x$ axis |
| $\cos(\pi - \theta) = -\cos\theta$, $\sin(\pi - \theta) = \sin\theta$ | Reflection in the $y$ axis |
| $\cos(\theta + \pi) = -\cos\theta$, $\sin(\theta+\pi) = -\sin\theta$ | Half turn |
| $\cos(\pi/2 - \theta) = \sin\theta$ | Cofunction identity |
| Period $2\pi$ | $\theta$ and $\theta + 2\pi k$ are the same direction |

The next lesson extends the picture to the tangent and the reciprocal functions, connects the unit circle to right-triangle ratios, and introduces the inverse functions — which is where the question "which of the two candidate angles do I have?" first bites.
