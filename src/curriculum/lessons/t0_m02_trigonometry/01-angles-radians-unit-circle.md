---
id: l01-angles-radians-unit-circle
title: Angles, radians and the unit circle
minutes: 26
covers:
  - radians vs degrees
  - the unit circle
---

Skateboarders talk about "doing a 180" — spinning until you face backwards — and "doing a 360", spinning all the way round. They are measuring an **angle**, an amount of turning, in degrees.

Almost every number a guidance, navigation and control (GNC) engineer handles that is not a distance, a speed or a mass is an angle. The engines at the bottom of a Falcon 9 swivel a few degrees on a **[[gimbal|gimbal]]** to steer the rocket. A star tracker — a camera that works out which way a spacecraft points by looking at stars — is accurate to a few arcseconds, tiny slivers of a degree. A launch site is named by two angles, latitude and longitude. An orbit is described by one length, one number for its shape, and four angles. Pointing a spacecraft means driving three angles to three wanted values, and the error the computer steers by is a difference of angles.

Angles have two habits that break software. First, they come in two units: every math formula wants radians, and every human wants degrees. Second, an angle and that angle plus one full turn point the same way, so plain subtraction can report a $359^\circ$ error when the true error is $1^\circ$. This lesson deals with the first habit and lays the groundwork for the second. Along the way it builds the **unit circle**: one picture that turns any angle into a direction and defines sine and cosine for every angle, not only those inside a right triangle.

Work through it with a pencil: you want the unit circle in your hands, not only your memory.

## What an angle measures

Picture a door swinging open. The hinge stays put and the door turns. The angle is how far it turned.

In math the door is a **ray** — a straight line that starts at a point and runs forever one way. Turn a ray about its starting point $O$ until it lies along a second ray; the angle is how far you turned. By agreement, turning **[[counterclockwise|counterclockwise]]** counts as positive and turning clockwise counts as negative. So $-30^\circ$ means "thirty degrees clockwise".

Rusty on degrees and triangles? See Basecamp's [Angles and shapes](#/module/t0_m00_basecamp?lesson=l08-angles-and-shapes).

## Measuring with a piece of string: the radian

Degrees split a full turn into $360$ equal parts. The number $360$ is a [[historical choice|why-360]], and nothing in math prefers it. There is a more natural way to measure turning, and all it needs is a piece of string.

Take a pizza. Cut a string exactly as long as its **radius** — center to crust — and lay it along the crust. Draw lines from the center to the string's two ends. That slice has an angle of exactly **one [[radian|one-radian]]**: a fat slice, a bit less than $60^\circ$.

Any angle can be measured this way. Draw a circle of radius $r$ around the corner and measure the length $s$ of crust — the **arc** — the angle cuts off. The angle in radians is how many radii fit along the arc:

$$
\theta = \frac{s}{r}, \qquad s = r\,\theta .
$$

$\theta$ is the Greek letter "theta", the usual name for an angle.

It does not matter which pizza you use: double the radius and the same slice has double the arc, so $s/r$ stays the same.

::: note Why the size of the circle cannot matter
Enlarge a drawing of a slice on a photocopier by a factor $k$. Every length is multiplied by $k$: the radius becomes $kr$ and the arc $ks$. The angle does not change — enlarging a picture does not bend its lines. So the same angle has ratio $\frac{ks}{kr} = \frac{s}{r}$ on the big circle. The $k$ cancels, whatever it is.
:::

A radian is a length over a length, so the units cancel: it is **[[dimensionless|dimensionless]]**, a plain number. We still write "rad" as a reminder that it is an angle.

How many radii fit around the whole crust? The whole crust is the circumference, $s = 2\pi r$, where **[[π|pi]]** (the Greek letter "pi", said like "pie") is about $3.14159$. So a full turn is

$$
\theta = \frac{2\pi r}{r} = 2\pi\ \mathrm{rad} \approx 6.28\ \mathrm{rad}.
$$

A little over six strings fit around any pizza. A half turn is $\pi$ radians, and a quarter turn — a right angle — is $\pi/2$.

### Converting between degrees and radians

Both units measure the same full turn, so

$$
2\pi\ \mathrm{rad} = 360^\circ .
$$

Divide both sides by $2\pi$ to find one radian, or divide both sides by $360$ to find one degree:

$$
1\ \mathrm{rad} = \frac{180^\circ}{\pi} \approx 57.2958^\circ, \qquad 1^\circ = \frac{\pi}{180}\ \mathrm{rad} \approx 0.0174533\ \mathrm{rad}.
$$

So degrees to radians, multiply by $\pi/180$; radians to degrees, multiply by $180/\pi$. To remember which, notice that radians are the *smaller* numbers — $90^\circ$ is only about $1.57$ rad — so going to radians uses the small factor, $\pi/180 \approx 0.0175$.

::: key Degrees and radians
$\mathrm{rad} = \mathrm{deg} \times \pi/180$ and $\mathrm{deg} = \mathrm{rad} \times 180/\pi$. One radian is about $57.2958^\circ$. A full turn is $2\pi$ rad $= 360^\circ$.
:::

Some landmarks are worth knowing by heart:

| Degrees | Radians | Fraction of a turn |
| --- | --- | --- |
| $30^\circ$ | $\pi/6 \approx 0.5236$ | 1/12 |
| $45^\circ$ | $\pi/4 \approx 0.7854$ | 1/8 |
| $60^\circ$ | $\pi/3 \approx 1.0472$ | 1/6 |
| $90^\circ$ | $\pi/2 \approx 1.5708$ | 1/4 |
| $180^\circ$ | $\pi \approx 3.1416$ | 1/2 |
| $270^\circ$ | $3\pi/2 \approx 4.7124$ | 3/4 |
| $360^\circ$ | $2\pi \approx 6.2832$ | 1 |

::: example Converting both ways
**Degrees to radians.** An engine can swivel at most $8^\circ$, and the flight software needs that in radians. Multiply by $\pi/180$:

$$
8 \times \frac{\pi}{180} \approx 0.1396\ \mathrm{rad}.
$$

Sanity check: one degree is about $0.0175$ rad, so eight degrees should be about $8 \times 0.0175 = 0.14$ rad. It is.

**Radians to degrees.** The computer reports $1.2$ rad and $2.5$ rad; a person wants degrees. Multiply by $180/\pi$:

$$
1.2 \times \frac{180}{\pi} \approx 68.75^\circ, \qquad 2.5 \times \frac{180}{\pi} \approx 143.24^\circ .
$$

Sanity check: one radian is a little under $60^\circ$, so $1.2$ rad should be a little under $70^\circ$, and $2.5$ rad well past a right angle. Both fit. An answer that does not fit this rough picture usually means mixed-up units.
:::

## Why the mathematics insists on radians

Why not keep everything in degrees? Because in radians, geometry turns into plain arithmetic.

Picture a merry-go-round. You stand at the edge; your friend stands halfway to the center. You both turn through the same angle, but you travel twice as far, because you are twice as far out. That is $s = r\theta$. A satellite at radius $r$ that has gone through an angle $\theta$ around Earth has traveled $r\theta$ along its orbit — but only if $\theta$ is in radians. In degrees the same fact needs an extra factor of $\pi/180$, and that factor then haunts every formula that follows: speed on a circle, turning rate, the small-angle shortcuts later in this module, and every calculus formula for sine and cosine.

The turning rate is the second example. Suppose a point moves at speed $v$ around a circle of radius $r$. In a short time $\Delta t$ (read "delta t", a small stretch of time) it covers an arc $s = v\,\Delta t$. By $\theta = s/r$, its angle changes by $v\,\Delta t / r$. Divide by the time $\Delta t$ to get the angle turned per second, the **angular rate** $\omega$ (the Greek letter "omega"):

$$
\omega = \frac{v}{r} \quad \mathrm{rad/s}.
$$

On the merry-go-round, you and your friend have the same $\omega$, but your speed $v$ is twice hers.

Reaction wheels (spinning wheels a spacecraft uses to turn itself), spin rates and orbital rates are all written this way. A wheel at $3000$ **[[rpm|rpm]]** turns $3000$ times a minute, each turn $2\pi$ radians. That is $3000 \times 2\pi \approx 18\,850$ radians per minute. Divide by $60$ seconds: about $314\ \mathrm{rad/s}$.

The rule in flight software: store and compute angles in radians, and change to degrees only when a human will read them. Every math library works in radians. In Python, `math.sin(30)` is the sine of $30$ *radians*, not $30^\circ$, and it comes out as about $-0.988$.

::: warning Library functions take radians
`math.sin`, `math.cos`, `math.tan`, `numpy.sin` and their cousins in C, Fortran, MATLAB and Julia all expect radians. If a value is in degrees, convert it first: `math.sin(math.radians(30))` gives $0.5$. The reverse conversion is `math.degrees`. Getting this wrong raises no error. It quietly gives a believable number.
:::

### Small units of angle

The full Moon looks about half a degree wide. Spacecraft pointing is usually far finer, so smaller units are common:

- An **arcminute** ($1'$) is $1/60$ of a degree. An **[[arcsecond|arcsecond]]** ($1''$) is $1/60$ of an arcminute, so $1'' = 1/3600$ degree $\approx 4.848 \times 10^{-6}$ rad. A **milliarcsecond** (mas) is a thousandth of an arcsecond.
- A **milliradian** (mrad) is $10^{-3}$ rad $\approx 0.0573^\circ \approx 3.44'$. A **microradian** (μrad) is $10^{-6}$ rad $\approx 0.206''$.

Typical sizes: a launch-vehicle engine gimbals through about $\pm 5^\circ$ to $\pm 8^\circ$ (read "plus or minus", meaning that far either way). A good star tracker knows the spacecraft's pointing to a few arcseconds — $3$ arcseconds is $14.5\ \mathrm{μrad}$. The Hubble Space Telescope holds its aim steady to about $7$ mas, which is $3.4 \times 10^{-8}$ rad.

Because $s = r\theta$, a tiny angle at a long distance becomes a big miss. A $1$ arcsecond error, seen from $550$ km up, moves the aim point on the ground by $s = r\theta = 550\,000 \times 4.848 \times 10^{-6} \approx 2.67\ \mathrm{m}$.

::: example Angular rate of the space station
The International Space Station orbits about $420$ km above the ground. Earth's average radius is $6371$ km, so the orbit radius (measured from Earth's center) is $r = 6371 + 420 = 6791\ \mathrm{km}$. Its speed comes from the circular-orbit formula $v = \sqrt{\mu/r}$, where $\mu = 3.986 \times 10^{14}\ \mathrm{m^3/s^2}$ is a number that measures how strongly Earth pulls:

$$
v = \sqrt{\frac{3.986 \times 10^{14}}{6.791 \times 10^{6}}} \approx 7661\ \mathrm{m/s}.
$$

**Angular rate** is speed over radius:

$$
\omega = \frac{v}{r} = \frac{7661}{6.791 \times 10^{6}} \approx 1.128 \times 10^{-3}\ \mathrm{rad/s}.
$$

**In degrees** that is $1.128 \times 10^{-3} \times 180/\pi \approx 0.0646^\circ$ per second, or about $3.88^\circ$ per minute.

**Time for one lap.** A full turn is $2\pi$ radians, so one orbit takes $2\pi/\omega \approx 5570\ \mathrm{s}$, which is $92.8$ minutes — the station's familiar period.

The radian $\omega$ went straight into the lap-time formula with no conversion factor. The degree version could not have.
:::

## The unit circle

Now the central picture. Imagine a Ferris wheel of radius exactly $1$, its hub at the origin of an $xy$ grid ($x$ to the right, $y$ up). Your seat starts at "3 o'clock", the point $(1, 0)$. The wheel turns counterclockwise through an angle $\theta$. Where is your seat now? Two numbers say it: how far right of the hub ($x$) and how far above it ($y$).

Those two numbers get names. The **cosine** of $\theta$, written $\cos\theta$ and read "cosine theta", is the $x$ coordinate. The **sine** of $\theta$, written $\sin\theta$ and read "sine theta", is the $y$ coordinate:

$$
P = (\cos\theta,\ \sin\theta).
$$

The circle of radius $1$ is the **[[unit circle|unit-circle-picture]]**. This is a definition, and it works for every angle. A negative $\theta$ means the wheel turned clockwise. An angle bigger than $2\pi$ means it went round more than once. Either way the seat is somewhere definite, so it has a definite cosine and sine. Right-triangle definitions only make sense between $0$ and $\pi/2$; the next lesson shows the two agree wherever both apply.

Three facts follow straight away.

- **The Pythagorean identity.** The seat is always exactly $1$ from the hub. Its $x$ and $y$ are the two short sides of a right triangle whose long side is that radius of $1$, so by the Pythagorean theorem ([refresher here](#/module/t0_m00_basecamp?lesson=l10-square-roots-and-pythagoras)) $x^2 + y^2 = 1$. In trig language, $\cos^2\theta + \sin^2\theta = 1$. (The little $2$ in $\cos^2\theta$ means "square the cosine": $\cos^2\theta = (\cos\theta)^2$, read "cosine squared theta".) Every trig identity grows out of this circle one way or another.
- **The limits.** Neither coordinate can be farther from the hub than the radius, so $-1 \le \cos\theta \le 1$ and $-1 \le \sin\theta \le 1$ for every $\theta$.
- **The signs follow the [[quadrant|quadrants]].** The two axes cut the plane into four quarters called **quadrants**, numbered I, II, III, IV counterclockwise starting from the top right. In quadrant I (angles from $0$ to $\pi/2$) both coordinates are positive. In quadrant II ($\pi/2$ to $\pi$) $x$ is negative, so cosine is negative and sine positive. In quadrant III ($\pi$ to $3\pi/2$) both are negative. In quadrant IV ($3\pi/2$ to $2\pi$) cosine is positive and sine negative.

The unit circle is also the set of every possible direction in a flat plane. Any arrow — a **vector** — of length $L$ pointing at angle $\theta$ from the $+x$ axis is the unit-circle point stretched by $L$. So its two parts, or **components**, are

$$
(x, y) = (L\cos\theta,\ L\sin\theta).
$$

This is how an engine's push and gimbal angle become a forward force and a sideways force, and how a distance and a bearing become a position. You will do this thousands of times.

::: example Resolving a gimballed thrust
A first-stage engine pushes with a **thrust** (force) of $845$ kN and is gimballed $5^\circ$ away from the rocket's centerline. Put the $x$ axis along the centerline. The thrust arrow then sits at $\theta = 5^\circ = 0.08727$ rad from it.

**Forward part** (along the rocket, called axial): $845 \cos 5^\circ = 845 \times 0.99619 \approx 841.8$ kN.

**Sideways part** (the steering force, called lateral): $845 \sin 5^\circ = 845 \times 0.08716 \approx 73.6$ kN.

Notice two things. Five degrees of gimbal costs only $845 - 841.8 = 3.2$ kN of forward push, about $0.4\%$, while producing a sideways force of $73.6$ kN. So a small gimbal angle is plenty to steer with. And the parts put back together give the whole: by Pythagoras, $\sqrt{841.8^2 + 73.6^2} \approx 845$ kN, as it must.
:::

## The special angles

For most angles you need a calculator to find the seat. For a handful, two triangles give the exact answer — worth knowing by heart, because they let you check a calculation by eye.

**45°.** At $\pi/4$ the seat is exactly halfway between the $x$ axis and the $y$ axis, so it sits on the line $y = x$: its two coordinates are equal. Put $x = y$ into $x^2 + y^2 = 1$ and you get $2x^2 = 1$, so $x^2 = 1/2$ and $x = y = 1/\sqrt{2}$. Multiplying top and bottom by $\sqrt{2}$ writes the same number as $\sqrt{2}/2 \approx 0.7071$.

**30° and 60°.** Start with an **[[equilateral triangle|equilateral]]** — all three sides equal — of side $1$. All its angles are $60^\circ$. A line from the top corner straight down to the middle of the bottom cuts it into two identical right triangles, each with long side (hypotenuse) $1$, short side $1/2$, and angles $30^\circ$, $60^\circ$, $90^\circ$. Pythagoras gives the third side: $\sqrt{1 - 1/4} = \sqrt{3}/2$. Set that triangle inside the unit circle. At $\theta = 30^\circ$ the seat is at $(\sqrt{3}/2,\ 1/2)$. At $\theta = 60^\circ$ it is at $(1/2,\ \sqrt{3}/2)$.

| $\theta$ | $0$ | $\pi/6$ ($30^\circ$) | $\pi/4$ ($45^\circ$) | $\pi/3$ ($60^\circ$) | $\pi/2$ ($90^\circ$) |
| --- | --- | --- | --- | --- | --- |
| $\cos\theta$ | $1$ | $\sqrt{3}/2 \approx 0.866$ | $\sqrt{2}/2 \approx 0.707$ | $1/2$ | $0$ |
| $\sin\theta$ | $0$ | $1/2$ | $\sqrt{2}/2 \approx 0.707$ | $\sqrt{3}/2 \approx 0.866$ | $1$ |

Across the first quadrant cosine falls from $1$ to $0$ while sine rises from $0$ to $1$: the rows are mirror images. That mirror is the identity $\cos(\pi/2 - \theta) = \sin\theta$, which the next section explains.

## Symmetries of the circle

Fold a paper circle in half through its center and the halves match. Each fold is a mirror, and each mirror gives a trig rule for free.

**Mirror in the $x$ axis.** This sends the seat at $\theta$ to the seat at $-\theta$ (the same turn, but clockwise). Its $x$ stays the same and its $y$ flips sign:

$$
\cos(-\theta) = \cos\theta, \qquad \sin(-\theta) = -\sin\theta .
$$

A function that gives the same answer for $\theta$ and $-\theta$ is called **even**; one that flips sign is **odd**. So cosine is even and sine is odd.

**Mirror in the $y$ axis.** This sends $\theta$ to $\pi - \theta$ (a seat at $30^\circ$ goes to $150^\circ$). Now $x$ flips and $y$ stays:

$$
\cos(\pi - \theta) = -\cos\theta, \qquad \sin(\pi - \theta) = \sin\theta .
$$

This matters for solving equations: $\sin\theta = 0.3$ has an answer in quadrant I and a second in quadrant II, equal to $\pi$ minus the first.

**A half turn.** This sends $\theta$ to $\theta + \pi$, the seat straight across the wheel. Both coordinates flip:

$$
\cos(\theta + \pi) = -\cos\theta, \qquad \sin(\theta + \pi) = -\sin\theta .
$$

**Mirror in the diagonal $y = x$.** This swaps the two coordinates and sends $\theta$ to $\pi/2 - \theta$:

$$
\cos\!\left(\tfrac{\pi}{2} - \theta\right) = \sin\theta, \qquad \sin\!\left(\tfrac{\pi}{2} - \theta\right) = \cos\theta .
$$

These are the **cofunction identities**. Two angles that add up to $\pi/2$ ($90^\circ$) are called **complementary**, and "cosine" literally means "sine of the complement".

**Reference angles.** Every point on the circle is a mirror image of some point in the first quadrant. To find $\cos 210^\circ$, notice that $210^\circ = 180^\circ + 30^\circ$. So the seat is the half-turn image of the $30^\circ$ seat, and

$$
\cos 210^\circ = -\cos 30^\circ = -\tfrac{\sqrt{3}}{2} \approx -0.866, \qquad \sin 210^\circ = -\sin 30^\circ = -\tfrac{1}{2}.
$$

The sharp angle between the ray and the $x$ axis — $30^\circ$ here — is called the **reference angle**. The reference angle gives the size; the quadrant gives the signs.

::: example Every angle with a given cosine
Find every $\theta$ between $0$ and $2\pi$ with $\cos\theta = -1/2$.

**Picture it.** Cosine is the $x$ coordinate, so we want the points of the unit circle on the upright line $x = -1/2$. That line crosses the circle twice, above and below the $x$ axis: exactly two answers.

**Reference angle.** The first-quadrant angle with cosine $+1/2$ is $\pi/3$ ($60^\circ$), from the table.

**Quadrants.** A negative cosine means a negative $x$, so the points are in quadrants II and III.

- Quadrant II: $\theta = \pi - \pi/3 = 2\pi/3$ ($120^\circ$), where $\sin\theta = +\sqrt{3}/2$.
- Quadrant III: $\theta = \pi + \pi/3 = 4\pi/3$ ($240^\circ$), where $\sin\theta = -\sqrt{3}/2$.

**Check** on a calculator: $\cos 120^\circ = -0.5$ and $\cos 240^\circ = -0.5$.

The lesson to carry forward: a cosine alone never pins down an angle. You need the sine too — or at least the sign of $y$ — to know which of the two candidates you have. That fact drives the whole of lesson 3.
:::

## Going round again: periodicity and the wrap problem

Ride the Ferris wheel one full turn, $2\pi$ radians, and your seat is back where it started. So $\theta$ and $\theta + 2\pi$ give the same seat, sine and cosine — and so do two turns, three, or turns backwards:

$$
\cos(\theta + 2\pi k) = \cos\theta, \qquad \sin(\theta + 2\pi k) = \sin\theta \qquad \text{for every whole number } k .
$$

Sine and cosine are **periodic** — they repeat — with **period** $2\pi$. Angles that differ by a whole number of turns are called **[[coterminal|coterminal]]**: $400^\circ$, $40^\circ$ and $-320^\circ$ all name the same direction, and so do $9$ rad and $9 - 2\pi \approx 2.717$ rad.

Repeating is handy for working out sines, and dangerous for comparing angles. A heading of $350^\circ$ and a heading of $-10^\circ$ are the same direction. A controller that subtracts them gets $360^\circ$, decides the vehicle is pointing completely wrong, and orders a full-speed turn when none was needed. Lesson 3 shows how to squeeze angles into a standard range and difference them correctly.

For now, build this habit: know which range every angle lives in, and distrust code that subtracts two angles without saying so. Ranges are written with brackets. A square bracket means "including this end" and a round bracket means "not including it". So $[0, 2\pi)$ means "from $0$ up to, but not including, $2\pi$", and $(-\pi, \pi]$ means "above $-\pi$, up to and including $\pi$". Each range contains every direction exactly once.

::: note Two standard ranges
Longitudes, orbit angles and star positions are usually quoted in $[0, 2\pi)$ (or $0^\circ$ to $360^\circ$). Errors, gimbal angles and latitudes usually use $(-\pi, \pi]$, centered on zero. Squeezing a value into $[0, 2\pi)$ is the operation $\theta \bmod 2\pi$ ("theta mod two pi" — the remainder after taking out whole turns). In Python it is `theta % (2*math.pi)`, which gives an answer that is never negative, even for a negative angle.
:::

## Check yourself

::: check
A pizza is cut into $8$ equal slices. What is the angle of one slice in degrees and in radians?
:::

::: answer
A full turn is $360^\circ$, so one slice is $360^\circ / 8 = 45^\circ$. In radians, a full turn is $2\pi$, so one slice is $2\pi / 8 = \pi/4 \approx 0.785$ rad. Check with the conversion rule: $45 \times \pi/180 = \pi/4$. It matches the landmark table.
:::

::: check
Convert $0.35$ rad to degrees and $225^\circ$ to radians. Give the second answer both as a decimal and as a multiple of $\pi$.
:::

::: answer
Radians to degrees, multiply by $180/\pi$: $0.35 \times 180/\pi \approx 20.05^\circ$.

Degrees to radians, multiply by $\pi/180$: $225 \times \pi/180 \approx 3.927$ rad. Since $225 = 5 \times 45$ and $45^\circ$ is $\pi/4$, this is $5\pi/4$.

Sanity check: $5\pi/4$ is a bit more than $\pi$ (a half turn), and $225^\circ$ is a bit more than $180^\circ$.
:::

::: check
A satellite at orbit radius $6771$ km travels at $7.67$ km/s. What is its angular rate in degrees per second, and how long does it take to move through one degree of angle around Earth's center?
:::

::: answer
$\omega = v/r = 7.67/6771 \approx 1.133 \times 10^{-3}$ rad/s (the kilometres cancel).

In degrees: $1.133 \times 10^{-3} \times 57.296 \approx 0.0649^\circ$ per second. So one degree takes $1/0.0649 \approx 15.4$ s. Roughly: a satellite in low orbit sweeps about $4^\circ$ around Earth every minute.
:::

::: check
Write down the exact coordinates of the unit-circle point at $\theta = 5\pi/3$, and name another angle between $0$ and $2\pi$ that has the same cosine.
:::

::: answer
$5\pi/3 = 300^\circ$. That is in quadrant IV, with reference angle $360^\circ - 300^\circ = 60^\circ$. In quadrant IV cosine is positive and sine negative, so $\cos(5\pi/3) = +\cos(\pi/3) = 1/2$ and $\sin(5\pi/3) = -\sin(\pi/3) = -\sqrt{3}/2$. The point is $(1/2, -\sqrt{3}/2)$.

The same cosine appears at the mirror image in the $x$ axis, $\theta = \pi/3$, where the sine is $+\sqrt{3}/2$.
:::

::: check
A star tracker has a $2$ arcsecond error. The spacecraft is $400$ km up and pointing straight down. How far is its aim point shifted on the ground? Treat the ground as flat over that distance.
:::

::: answer
Convert to radians first. $2'' = 2/3600$ degree $\approx 5.556 \times 10^{-4}$ degree, and multiplying by $\pi/180$ gives about $9.70 \times 10^{-6}$ rad.

Then $s = r\theta = 400\,000 \times 9.70 \times 10^{-6} \approx 3.9$ m. From low orbit, a few arcseconds is worth a few metres on the ground.
:::

::: check
Without a calculator, which is larger: $\sin 1$ or $\sin 1^\circ$? Roughly how many times larger?
:::

::: answer
$\sin 1$ with no degree sign means the sine of one *radian*, about $57.3^\circ$. That is a little less than $60^\circ$, so $\sin 1$ is a little less than $\sin 60^\circ \approx 0.866$. The exact value is $0.841$.

$\sin 1^\circ$ is the sine of a tiny angle, and for tiny angles the sine is very close to the angle in radians, $0.01745$.

So $\sin 1$ is about $48$ times larger. If you expect the sine of one radian and get about $0.017$, degrees have leaked in somewhere.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\theta = s/r$ | Angle in radians is arc length over radius; $s = r\theta$ |
| $2\pi\ \mathrm{rad} = 360^\circ$ | $\mathrm{rad} = \mathrm{deg}\times\pi/180$; $1\ \mathrm{rad} \approx 57.2958^\circ$ |
| $\omega = v/r$ | Angular rate in rad/s of a point moving at speed $v$ on radius $r$ |
| $1'' \approx 4.848 \times 10^{-6}$ rad | Arcsecond; $1$ mrad $\approx 0.0573^\circ$ |
| $(\cos\theta, \sin\theta)$ | Point reached on the unit circle after turning $\theta$ from $(1, 0)$ |
| $\cos^2\theta + \sin^2\theta = 1$ | The point lies on the unit circle |
| $(L\cos\theta, L\sin\theta)$ | Components of a vector of length $L$ at angle $\theta$ |
| $\cos(-\theta) = \cos\theta$, $\sin(-\theta) = -\sin\theta$ | Mirror in the $x$ axis |
| $\cos(\pi - \theta) = -\cos\theta$, $\sin(\pi - \theta) = \sin\theta$ | Mirror in the $y$ axis |
| $\cos(\theta + \pi) = -\cos\theta$, $\sin(\theta+\pi) = -\sin\theta$ | Half turn |
| $\cos(\pi/2 - \theta) = \sin\theta$ | Cofunction identity |
| Period $2\pi$ | $\theta$ and $\theta + 2\pi k$ are the same direction |

Next lesson: the right-triangle ratios you may already know turn out to be this same circle, scaled up. We add the tangent, meet sine and cosine as waves, and learn to run them backwards — from a ratio to an angle — which is where the question "which of the two candidate angles do I have?" first bites.

::: context gimbal A pivot for an engine
A **gimbal** is a pivoting mount. The engine hangs from it, and pistons called actuators push the engine to tilt it a few degrees. Tilting the engine tilts its push, which shoves the tail of the rocket sideways and turns the whole vehicle — the way a boat's outboard motor steers the boat.

The word is old: gimbal rings were used for centuries to hold a ship's compass level while the ship rolled. A Falcon 9 first stage steers with gimballed Merlin engines. Nearly every large rocket steers this way.
:::

::: context counterclockwise Why counterclockwise is the plus direction
Mathematicians put the $x$ axis pointing right and the $y$ axis pointing up. Turning the $+x$ axis toward the $+y$ axis — a quarter turn the short way — is counterclockwise, so that direction was made positive.

Clocks happen to go the other way. The usual explanation is that early clocks copied the shadow on a sundial, which moves clockwise in the northern hemisphere, where those clocks were built. So a clock hand sweeps out *negative* angles.
:::

::: context why-360 Where 360 comes from
Nobody knows for certain. The usual story points to ancient Babylonian astronomers, who counted in sixties rather than tens and used a tidy calendar year of $360$ days. One degree then is roughly how far the Sun appears to move against the stars each day.

Whatever the origin, $360$ is a very convenient number: it can be divided evenly by $24$ different whole numbers, including $2, 3, 4, 5, 6, 8, 9, 10$ and $12$. That makes halves, thirds, quarters and twelfths of a turn all come out as whole numbers of degrees. Radians give up that convenience in exchange for simpler formulas.
:::

::: context one-radian One radian, drawn
The arc in blue is exactly as long as the radius. The angle it makes at the center is one radian — a little less than $60^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="110" r="80" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="150" y1="110" x2="230" y2="110" stroke="#1f2a44" stroke-width="2"/>
  <line x1="150" y1="110" x2="193.22" y2="42.68" stroke="#1f2a44" stroke-width="2"/>
  <path d="M230,110 A80,80 0 0,0 193.22,42.68" fill="none" stroke="#1d6fd1" stroke-width="5"/>
  <path d="M170,110 A20,20 0 0,0 160.81,93.17" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="150" cy="110" r="3" fill="#1f2a44"/>
  <text x="190" y="128" font-size="13" fill="#1f2a44" text-anchor="middle">r</text>
  <text x="162" y="72" font-size="13" fill="#1f2a44" text-anchor="end">r</text>
  <text x="238" y="64" font-size="13" fill="#1d6fd1">arc = r</text>
  <text x="178" y="100" font-size="12" fill="#b4232c">1 rad</text>
  <text x="250" y="160" font-size="12" fill="#1f2a44">1 rad ≈ 57.3°</text>
  <text x="250" y="178" font-size="12" fill="#1f2a44">full turn = 2π ≈ 6.28 rad</text>
</svg>
```

About $6.28$ of these arcs fit around the whole circle, whatever its size.
:::

::: context dimensionless Units that cancel
An arc length is measured in metres, and so is a radius. Divide metres by metres and the units cancel, leaving a plain number. That is what **dimensionless** means.

It is also why a radian works on any scale: a slice of a pizza, a turn of a wheel and a satellite's trip around Earth all measure their angles the same way, whatever length unit you used. You can even check it — the arc and the radius could both be in inches and you would get the same angle.
:::

::: context pi What π is
**Pi**, written $\pi$, is how many times a circle's diameter (its full width) fits around its circumference. It is the same for every circle: about $3.14159$. Since the diameter is two radii, the circumference is $C = 2\pi r$ — so a full turn is $2\pi$ radii of arc.

The digits of $\pi$ never end and never settle into a repeating pattern. Engineers do not need many of them: NASA's interplanetary navigators use $\pi$ to $15$ decimal places, $3.141592653589793$, which is far more than enough to steer a spacecraft across the solar system.
:::

::: context rpm Revolutions per minute
**rpm** stands for "revolutions per minute" — how many full turns something makes each minute. A car engine idling at a stoplight turns roughly $600$ to $1000$ rpm.

Spacecraft use **reaction wheels**: heavy wheels spun by electric motors, often at a few thousand rpm. Speeding a wheel up one way makes the spacecraft turn the other way, with no fuel used. To put a wheel's speed into a formula, change it to rad/s: multiply by $2\pi$ (radians per turn) and divide by $60$ (seconds per minute).
:::

::: context arcsecond How small is an arcsecond?
One arcsecond is $1/3600$ of a degree. A US quarter coin, about $24$ mm across, looks one arcsecond wide from about $5$ km away.

Astronomers and spacecraft engineers work at this scale all the time. A star tracker compares the stars it sees with a map of thousands of stars stored in its memory, and from their positions works out which way the spacecraft points to within a few arcseconds. That lets a camera in orbit know where on the ground it is looking to within a few metres.
:::

::: context unit-circle-picture The unit circle, drawn
The seat $P$ has turned through $\theta = 40^\circ$ from the starting point $(1, 0)$. Its distance to the right of the hub is $\cos\theta \approx 0.766$ (blue). Its height above the hub is $\sin\theta \approx 0.643$ (red).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="110" x2="290" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="15" x2="180" y2="205" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="180" cy="110" r="80" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="110" x2="241.28" y2="58.58" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="110" x2="241.28" y2="110" stroke="#1d6fd1" stroke-width="5"/>
  <line x1="241.28" y1="58.58" x2="241.28" y2="110" stroke="#b4232c" stroke-width="4"/>
  <path d="M202,110 A22,22 0 0,0 196.85,95.86" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="241.28" cy="58.58" r="4" fill="#1f2a44"/>
  <circle cx="260" cy="110" r="3" fill="#1f2a44"/>
  <text x="206" y="104" font-size="12" fill="#1f2a44">θ</text>
  <text x="203" y="76" font-size="12" fill="#1f2a44">1</text>
  <text x="210" y="128" font-size="12" fill="#1d6fd1" text-anchor="middle">cos θ</text>
  <text x="246" y="90" font-size="12" fill="#b4232c">sin θ</text>
  <text x="248" y="50" font-size="12" fill="#1f2a44">P = (cos θ, sin θ)</text>
  <text x="264" y="126" font-size="11" fill="#1f2a44">(1, 0)</text>
  <text x="294" y="114" font-size="12" fill="#1f2a44">x</text>
  <text x="186" y="22" font-size="12" fill="#1f2a44">y</text>
</svg>
```

The blue side, the red side and the radius of $1$ make a right triangle. That triangle is why $\cos^2\theta + \sin^2\theta = 1$.
:::

::: context quadrants The four quadrants and their signs
The axes split the plane into four quadrants, numbered counterclockwise from the top right. In each one, the signs of $(\cos\theta, \sin\theta)$ are the signs of $x$ and $y$ there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="100" x2="300" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="10" x2="180" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="100" r="70" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="235" y="50" font-size="14" fill="#1d6fd1" text-anchor="middle" font-weight="700">I</text>
  <text x="235" y="68" font-size="12" fill="#1f2a44" text-anchor="middle">(+, +)</text>
  <text x="125" y="50" font-size="14" fill="#1d6fd1" text-anchor="middle" font-weight="700">II</text>
  <text x="125" y="68" font-size="12" fill="#1f2a44" text-anchor="middle">(−, +)</text>
  <text x="125" y="140" font-size="14" fill="#1d6fd1" text-anchor="middle" font-weight="700">III</text>
  <text x="125" y="158" font-size="12" fill="#1f2a44" text-anchor="middle">(−, −)</text>
  <text x="235" y="140" font-size="14" fill="#1d6fd1" text-anchor="middle" font-weight="700">IV</text>
  <text x="235" y="158" font-size="12" fill="#1f2a44" text-anchor="middle">(+, −)</text>
  <text x="304" y="104" font-size="12" fill="#1f2a44">x</text>
  <text x="186" y="18" font-size="12" fill="#1f2a44">y</text>
  <text x="256" y="96" font-size="11" fill="#6c7a93">0</text>
  <text x="184" y="42" font-size="11" fill="#6c7a93">π/2</text>
  <text x="96" y="96" font-size="11" fill="#6c7a93">π</text>
  <text x="184" y="184" font-size="11" fill="#6c7a93">3π/2</text>
</svg>
```

A handy check: sine is positive in the top half, cosine is positive in the right half.
:::

::: context equilateral Half an equilateral triangle
Cut an equilateral triangle of side $1$ straight down the middle. Each half is a right triangle with sides $1/2$, $\sqrt{3}/2$ and $1$, and angles $30^\circ$, $60^\circ$ and $90^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <polygon points="105,180 255,180 180,50.1" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="180,180 255,180 180,50.1" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <rect x="180" y="170" width="10" height="10" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="217" y="198" font-size="12" fill="#1f2a44" text-anchor="middle">1/2</text>
  <text x="142" y="198" font-size="12" fill="#1f2a44" text-anchor="middle">1/2</text>
  <text x="226" y="110" font-size="12" fill="#1f2a44">1</text>
  <text x="138" y="110" font-size="12" fill="#1f2a44" text-anchor="end">1</text>
  <text x="176" y="130" font-size="12" fill="#1f2a44" text-anchor="end">√3/2</text>
  <text x="234" y="174" font-size="11" fill="#b4232c">60°</text>
  <text x="184" y="80" font-size="11" fill="#b4232c">30°</text>
  <text x="262" y="60" font-size="12" fill="#1f2a44">side² check:</text>
  <text x="262" y="78" font-size="12" fill="#1f2a44">1/4 + 3/4 = 1</text>
</svg>
```

Set the blue triangle with its $30^\circ$ corner at the hub and its long side of $1$ as the radius: the seat is at $(\sqrt{3}/2, 1/2)$. Stand it the other way, with the $60^\circ$ corner at the hub, and the seat is at $(1/2, \sqrt{3}/2)$.
:::

::: context coterminal Going round more than once
"Coterminal" means "ending together": the angles finish on the same ray. Below, $40^\circ$, $400^\circ$ (one full turn counterclockwise plus $40^\circ$) and $-320^\circ$ (clockwise almost a full turn) all end pointing the same way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker></defs>
  <g stroke="#6c7a93" stroke-width="1.2">
    <line x1="60" y1="90" x2="110" y2="90"/><line x1="180" y1="90" x2="230" y2="90"/><line x1="300" y1="90" x2="350" y2="90"/>
  </g>
  <g stroke="#1f2a44" stroke-width="2.5">
    <line x1="60" y1="90" x2="95.24" y2="60.43"/><line x1="180" y1="90" x2="215.24" y2="60.43"/><line x1="300" y1="90" x2="335.24" y2="60.43"/>
  </g>
  <polyline points="80.0,90.0 79.7,86.5 78.8,83.2 77.3,80.0 75.3,77.1" fill="none" stroke="#b4232c" stroke-width="2" marker-end="url(#ah)"/>
  <polyline points="192.0,90.0 192.4,87.8 192.4,85.5 192.0,83.1 191.0,80.7 189.6,78.5 187.8,76.5 185.5,74.8 182.9,73.5 180.0,72.6 176.9,72.3 173.6,72.5 170.4,73.4 167.3,74.8 164.4,76.9 161.8,79.5 159.7,82.6 158.1,86.1 157.2,90.0 157.0,94.1 157.4,98.2 158.7,102.3 160.7,106.2 163.4,109.8 166.8,112.9 170.8,115.4 175.2,117.2 180.0,118.2 185.0,118.4 190.1,117.6 195.0,116.0 199.7,113.4 203.9,110.1 207.5,105.9 210.4,101.1 212.5,95.7 213.6,90.0 213.7,84.1 212.7,78.1 210.7,72.3 207.6,66.9" fill="none" stroke="#b4232c" stroke-width="2" marker-end="url(#ah)"/>
  <polyline points="312.0,90.0 312.5,92.2 312.6,94.6 312.2,97.0 311.3,99.5 309.9,101.8 308.1,104.0 305.8,105.8 303.0,107.2 300.0,108.2 296.7,108.6 293.3,108.4 289.9,107.5 286.5,106.0 283.4,103.9 280.7,101.2 278.4,97.9 276.7,94.1 275.6,90.0 275.3,85.6 275.8,81.2 277.1,76.8 279.2,72.6 282.1,68.7 285.8,65.3 290.0,62.6 294.8,60.6 300.0,59.4 305.4,59.2 310.9,60.0 316.3,61.7 321.4,64.5 326.0,68.1" fill="none" stroke="#b4232c" stroke-width="2" marker-end="url(#ah)"/>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="145">40°</text><text x="180" y="145">400°</text><text x="300" y="145">−320°</text>
    <text x="180" y="162" font-size="11">= 40° + 360°</text><text x="300" y="162" font-size="11">= 40° − 360°</text>
  </g>
</svg>
```

Adding or taking away whole turns never changes where an angle points — which is exactly why subtracting two angles can mislead you.
:::
