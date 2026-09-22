---
id: l05-law-of-sines-and-cosines
title: The law of sines and the law of cosines
minutes: 19
covers:
  - law of sines and law of cosines
---

Draw a line from the centre of the Earth to a ground station, another from the centre to a satellite, and a third from the station to the satellite. That triangle contains every quantity a link engineer cares about: the slant range that sets the signal loss, the elevation angle that decides whether the antenna can see the satellite at all, and the central angle that fixes how long the pass lasts. None of its angles is a right angle. The right-triangle ratios of lesson 2 do not apply to it directly, and neither does the Pythagorean theorem.

Two theorems handle every triangle: the **law of cosines**, which is the Pythagorean theorem with a correction term for the angle not being $90^\circ$, and the **law of sines**, which says the sides of a triangle are proportional to the sines of the opposite angles. Between them they solve any triangle from any three independent pieces of information, and they turn up as vector identities whenever two velocities or two positions are added or subtracted. The plane-change $\Delta v$ of an orbital manoeuvre, the ground speed of an aircraft in a crosswind and the distance between two spacecraft on the same orbit are all one triangle each.

This lesson derives both laws from the unit-circle definitions, shows which law fits which problem, warns you about the one case that has two valid answers, and works the ground-station and velocity triangles with real numbers.

## Naming the parts

Label a triangle's vertices $A$, $B$, $C$ and use the same letters for the angles at those vertices. Label each side with the lower-case letter of the vertex it does *not* touch: side $a$ is opposite angle $A$, $b$ opposite $B$, $c$ opposite $C$. The angles sum to a half turn, $A + B + C = \pi$, so any two of them determine the third. There are six parts in all, three sides and three angles, and a triangle is fixed by three of them provided at least one is a side.

Everything below assumes a triangle drawn on a plane. The Earth's surface is not a plane, and lesson 7 deals with the spherical version of the law of cosines when the sides are arcs on a sphere; but the triangle formed by the Earth's centre, a station and a satellite lies in a plane through the centre, so the plane laws apply to it exactly.

## The law of cosines

Put vertex $C$ at the origin with side $a$ (the segment $CB$) along the positive $x$ axis, so $B = (a, 0)$. Vertex $A$ is at distance $b$ from $C$ in direction $C$ (the angle), so by lesson 1 its coordinates are $A = (b\cos C,\ b\sin C)$. Side $c$ is the distance from $A$ to $B$:

$$
c^2 = (a - b\cos C)^2 + (b\sin C)^2 = a^2 - 2ab\cos C + b^2\cos^2 C + b^2\sin^2 C .
$$

The last two terms combine by the Pythagorean identity into $b^2$, leaving

$$
c^2 = a^2 + b^2 - 2ab\cos C .
$$

When $C = 90^\circ$ the cosine vanishes and this is the Pythagorean theorem. When $C$ is acute the correction term is negative and $c$ is shorter than the right-angle value; when $C$ is obtuse, $\cos C < 0$, the correction adds and $c$ is longer. At the extremes, $C = 0$ gives $c^2 = (a - b)^2$ and $C = 180^\circ$ gives $c^2 = (a + b)^2$, which are the collapsed triangles where the sides lie along a line. The same formula holds with the letters permuted: $a^2 = b^2 + c^2 - 2bc\cos A$, and so on. The only thing to keep straight is that the angle in the formula is the one *opposite* the side on the left.

::: key Law of cosines
$c^2 = a^2 + b^2 - 2ab\cos C$, where $C$ is the angle opposite side $c$. It reduces to the Pythagorean theorem at $C = 90^\circ$.
:::

In vector language the same statement is about the difference of two vectors. If $\mathbf{u}$ and $\mathbf{v}$ have lengths $a$ and $b$ and the angle between them is $C$, then $|\mathbf{u} - \mathbf{v}|^2 = a^2 + b^2 - 2ab\cos C$. That is the form in which the law appears in flight software: the relative position of two vehicles, the change in a velocity vector, the difference between a commanded and a measured direction.

Solved for the angle,

$$
\cos C = \frac{a^2 + b^2 - c^2}{2ab},
$$

and since $C$ lies between $0$ and $\pi$ the arccosine's principal range covers every possibility. A triangle given by three sides has no ambiguity: the law of cosines, applied once per angle, delivers all three. If the right-hand side comes out beyond $\pm 1$, the three lengths cannot form a triangle — one side is longer than the other two together — and the arccosine correctly refuses.

::: example Plane change: the velocity triangle
A spacecraft in a circular orbit at speed $v = 7.70\ \mathrm{km/s}$ must rotate its orbital plane by $\Delta i = 5^\circ$ without changing its speed. The velocity before the burn and the velocity after have the same length $v$ and differ in direction by $\Delta i$; the $\Delta v$ the engine must supply is the third side of the triangle they form. By the law of cosines with $a = b = v$ and $C = \Delta i$,

$$
\Delta v^2 = v^2 + v^2 - 2v^2\cos\Delta i = 2v^2(1 - \cos\Delta i) .
$$

The half-angle identity of lesson 4, $1 - \cos\Delta i = 2\sin^2(\Delta i/2)$, turns this into $\Delta v^2 = 4v^2\sin^2(\Delta i/2)$, so

$$
\Delta v = 2v\sin\frac{\Delta i}{2} = 2 \times 7.70 \times \sin 2.5^\circ = 2 \times 7.70 \times 0.04362 = 0.672\ \mathrm{km/s} .
$$

Five degrees of plane change costs 672 m/s — about a tenth of the entire speed of the orbit — which is why launch sites are chosen to avoid it. For a small angle $\sin(\Delta i/2) \approx \Delta i/2$ and $\Delta v \approx v\,\Delta i$ with $\Delta i$ in radians: $7.70 \times 0.08727 = 0.672$ km/s, the same to three figures. At $\Delta i = 60^\circ$ the triangle is equilateral and $\Delta v = v$: a full 7.7 km/s.
:::

## The law of sines

Drop a perpendicular from vertex $C$ to side $c$ and call its length $h$. It forms two right triangles. In the one containing angle $A$, $h$ is the side opposite $A$ and $b$ is the hypotenuse, so $h = b\sin A$. In the one containing angle $B$, $h = a\sin B$. Equating the two expressions and dividing by $\sin A\sin B$,

$$
\frac{a}{\sin A} = \frac{b}{\sin B} .
$$

Dropping the perpendicular from a different vertex brings in the third side, so all three ratios are equal:

$$
\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C} .
$$

If one of the angles is obtuse the perpendicular from an adjacent vertex falls outside the triangle, and the right triangle it forms has the supplementary angle $\pi - A$ in place of $A$; since $\sin(\pi - A) = \sin A$ the formula is unchanged. The common value of the ratio is the diameter of the circle through the three vertices, a fact you can carry as a check but will rarely need.

The perpendicular gives you the area at the same time: the area is half the base times the height, $\tfrac{1}{2}c\,h = \tfrac{1}{2}bc\sin A$, or with any other pair of sides and their included angle, $\tfrac{1}{2}ab\sin C$.

::: key Law of sines
$\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}$: each side is proportional to the sine of the opposite angle. It comes from writing one altitude two ways.
:::

## Which law, and the ambiguous case

The choice is set by what you know:

- **Three sides (SSS).** Law of cosines for each angle. Unambiguous.
- **Two sides and the included angle (SAS).** Law of cosines for the third side, then either law for the remaining angles. Unambiguous.
- **Two angles and any side (ASA or AAS).** The third angle is $\pi$ minus the other two; then the law of sines for the sides. Unambiguous.
- **Two sides and a non-included angle (SSA).** Law of sines for the angle opposite the second side — and here the trouble starts.

In the SSA case you compute $\sin B = b\sin A / a$ and take an arcsine. Lesson 2 showed that the arcsine returns only the acute solution, while the obtuse angle $\pi - B$ has the same sine. Sometimes both are valid triangles. Take $a = 7$, $b = 10$ and $A = 40^\circ$: $\sin B = 10\sin 40^\circ/7 = 0.9183$, so $B = 66.7^\circ$ or $B = 113.3^\circ$. Both leave a positive third angle ($C = 73.3^\circ$ or $26.7^\circ$), so both triangles exist, with third sides $c = 10.43$ and $c = 4.89$. The data genuinely does not decide between them; a swinging arm of length 7 from a hinge on a line of length 10 crosses the other side twice.

Three ways out. First, if the side opposite the known angle is the longer of the two ($a > b$), the angle $B$ is opposite the shorter side and must be acute, so the arcsine is right. Second, if the geometry of the problem tells you an angle is obtuse (an angle at a ground station is always more than $90^\circ$, for instance), use the supplement. Third, avoid the arcsine altogether: the law of cosines written for the unknown side is a quadratic, $b^2 = a^2 + c^2 - 2ac\cos B$ rearranged as $c^2 - (2a\cos B)c + (a^2 - b^2) = 0$, whose two roots are the two triangles and whose negative root, when there is one, tells you there is only one.

::: warning Arcsine silently drops the obtuse solution
Whenever you solve for an angle with the law of sines, ask whether the angle might be obtuse. If it can be, the arcsine has given you the wrong triangle half of the time. Prefer the law of cosines and arccosine for any angle that is not known to be acute; the arccosine's range $[0, \pi]$ covers every triangle angle.
:::

## The ground-station triangle

Let $O$ be the Earth's centre, $S$ a ground station on a spherical Earth of radius $R_E$, and $P$ a satellite at altitude $h$, so $OS = R_E$ and $OP = r = R_E + h$. The third side $SP = D$ is the **slant range**. Three angles describe the geometry:

- the **central angle** $\lambda$ at $O$, between the station's and the satellite's position vectors;
- the **nadir angle** $\eta$ at $P$, between the satellite's line to the Earth's centre and its line to the station;
- the **elevation angle** $\varepsilon$ at $S$, measured from the station's horizon up to the satellite. The horizon is perpendicular to $OS$, so the interior angle of the triangle at $S$ is $90^\circ + \varepsilon$: always obtuse.

Because the angles sum to $180^\circ$, $\lambda + \eta + 90^\circ + \varepsilon = 180^\circ$, that is

$$
\lambda + \eta + \varepsilon = 90^\circ .
$$

Suppose the station reports the elevation $\varepsilon$ and you want the slant range and the central angle. The law of sines relates the side $R_E$ opposite $\eta$ to the side $r$ opposite the station angle:

$$
\frac{\sin\eta}{R_E} = \frac{\sin(90^\circ + \varepsilon)}{r} = \frac{\cos\varepsilon}{r} \quad\Longrightarrow\quad \sin\eta = \frac{R_E\cos\varepsilon}{r} .
$$

The arcsine is safe here: $r$ is the longest side, so the station angle is the largest angle and $\eta$ must be acute. Then $\lambda = 90^\circ - \varepsilon - \eta$, and the slant range follows from the law of cosines on the two known sides and their included angle $\lambda$:

$$
D^2 = R_E^2 + r^2 - 2R_E\,r\cos\lambda ,
$$

or from the law of sines, $D = R_E\sin\lambda/\sin\eta$. The ground distance from the station to the sub-satellite point is the arc $R_E\lambda$, with $\lambda$ in radians.

::: example ISS pass at 10 degrees elevation
The ISS orbits at $h = 420$ km; take $R_E = 6378$ km, so $r = 6798$ km. A station acquires the signal at elevation $\varepsilon = 10^\circ$.

Nadir angle: $\sin\eta = 6378\cos 10^\circ/6798 = 6378 \times 0.9848/6798 = 0.9239$, so $\eta = 67.5^\circ$. Central angle: $\lambda = 90^\circ - 10^\circ - 67.5^\circ = 12.5^\circ = 0.2179$ rad. Slant range by the law of cosines: $D^2 = 6378^2 + 6798^2 - 2 \times 6378 \times 6798\cos 12.5^\circ$, giving $D = 1493$ km. Check with the law of sines: $D = 6378\sin 12.5^\circ/\sin 67.5^\circ = 6378 \times 0.2162/0.9239 = 1493$ km. The sub-satellite point is $R_E\lambda = 6378 \times 0.2179 = 1390$ km from the station along the ground.

Compare the geometric horizon, $\varepsilon = 0$: $\sin\eta = 6378/6798 = 0.9382$, $\eta = 69.8^\circ$, $\lambda = 20.2^\circ$, $D = 2352$ km, and a ground distance of 2254 km. Lifting the mask from $0^\circ$ to $10^\circ$ shortens the maximum slant range from 2352 to 1493 km — a link-budget gain of $20\log_{10}(2352/1493) = 3.9$ dB — but shrinks the visible circle from 2254 to 1390 km radius and with it the pass duration. That trade is the whole business of choosing an elevation mask.
:::

## Adding velocities: the wind triangle

An aircraft's velocity over the ground is its velocity through the air plus the wind velocity. Draw the two vectors head to tail and the ground velocity closes the triangle. The angle between the airspeed vector and the wind vector, as directions, is the difference of their headings; the interior angle of the triangle at the vertex where they meet head to tail is its supplement.

::: example Ground speed and drift in a crosswind
An aircraft flies at 120 m/s true airspeed on heading $040^\circ$. The wind is 20 m/s blowing *toward* $120^\circ$. The two velocity directions differ by $120^\circ - 40^\circ = 80^\circ$, so the interior angle of the triangle between the airspeed side and the wind side is $180^\circ - 80^\circ = 100^\circ$. Law of cosines for the ground speed:

$$
V_g^2 = 120^2 + 20^2 - 2 \times 120 \times 20\cos 100^\circ = 14400 + 400 + 833.5 = 15633.5, \qquad V_g = 125.0\ \mathrm{m/s} .
$$

The drift angle $\delta$ between heading and track is opposite the wind side, so by the law of sines $\sin\delta = 20\sin 100^\circ/125.0 = 0.1575$ and $\delta = 9.06^\circ$; the arcsine is safe because the wind side is the shortest. The track is $040^\circ + 9.06^\circ = 049.1^\circ$, to the right of the heading, which is the side the wind is pushing toward.

Verify by components (east, north): airspeed $(120\sin 40^\circ, 120\cos 40^\circ) = (77.13, 91.93)$, wind $(20\sin 120^\circ, 20\cos 120^\circ) = (17.32, -10.00)$, sum $(94.45, 81.93)$, magnitude $125.0$ m/s, azimuth $\operatorname{atan2}(94.45, 81.93) = 49.06^\circ$. The component route is what code does; the triangle route is what lets you check the code by hand.
:::

::: note Which route to take in software
Programs should add vectors component by component and recover magnitudes and angles with `hypot` and `atan2`; that is what the component check above did, and it never meets the ambiguous case. The laws of sines and cosines are for reasoning, hand checks and derivations — the plane-change formula, the elevation-to-range relation — where a closed form is worth more than a loop.
:::

## Check yourself

::: check
A triangle has sides 5, 7 and 9. Find its largest angle and its area.
:::

::: answer
The largest angle is opposite the longest side. $\cos C = (25 + 49 - 81)/(2 \times 5 \times 7) = -7/70 = -0.1$, so $C = \arccos(-0.1) = 95.7^\circ$: obtuse, which the negative cosine announced before the arccosine was taken. Area $= \tfrac{1}{2} \times 5 \times 7 \times \sin 95.7^\circ = 17.5 \times 0.9950 = 17.4$ square units.
:::

::: check
Two satellites are on the same circular orbit of radius 7000 km, separated by $30^\circ$ of central angle. What is the straight-line distance between them? Do it two ways.
:::

::: answer
Law of cosines with $a = b = 7000$ km and $C = 30^\circ$: $d^2 = 2 \times 7000^2(1 - \cos 30^\circ) = 2 \times 4.9 \times 10^7 \times 0.1340$, so $d = 3623$ km. Half-angle form: $d = 2 \times 7000\sin 15^\circ = 14000 \times 0.2588 = 3623$ km. The arc between them is $7000 \times 30\pi/180 = 3665$ km, only 1.2% longer than the chord.
:::

::: check
In a triangle $a = 7$, $b = 10$ and $A = 40^\circ$. How many triangles fit these data, and what are their third sides?
:::

::: answer
SSA case. $\sin B = 10\sin 40^\circ/7 = 0.9183$, giving $B = 66.7^\circ$ or $113.3^\circ$. Both leave positive third angles, $C = 73.3^\circ$ or $26.7^\circ$, so there are two triangles. Third sides from the law of sines, $c = a\sin C/\sin A$: $7\sin 73.3^\circ/\sin 40^\circ = 10.43$ and $7\sin 26.7^\circ/\sin 40^\circ = 4.89$. Had $a$ been the longer side there would have been only one triangle.
:::

::: check
A ground station sees a geostationary satellite ($h = 35786$ km, $R_E = 6378$ km) at elevation $5^\circ$. Find the nadir angle, the central angle and the slant range.
:::

::: answer
$r = 42164$ km. $\sin\eta = 6378\cos 5^\circ/42164 = 0.1507$, so $\eta = 8.67^\circ$. $\lambda = 90^\circ - 5^\circ - 8.67^\circ = 76.3^\circ$. $D^2 = 6378^2 + 42164^2 - 2 \times 6378 \times 42164\cos 76.3^\circ$ gives $D = 41127$ km. From geostationary altitude the whole Earth subtends a nadir angle of only $\arcsin(6378/42164) = 8.70^\circ$, so a station at the edge of coverage sits very close to the limb.
:::

::: check
Two burns of 300 m/s and 200 m/s are performed in quick succession with an angle of $60^\circ$ between their thrust directions. What is the magnitude of the total velocity change?
:::

::: answer
The vectors add head to tail; the interior angle of the triangle between them is $180^\circ - 60^\circ = 120^\circ$. $|\Delta \mathbf{v}|^2 = 300^2 + 200^2 - 2 \times 300 \times 200\cos 120^\circ = 90000 + 40000 + 60000 = 190000$, so $|\Delta\mathbf{v}| = 436$ m/s. Equivalently, using the angle between the vectors directly, $|\mathbf{u} + \mathbf{v}|^2 = a^2 + b^2 + 2ab\cos 60^\circ$, which gives the same 190000. The sum of magnitudes, 500 m/s, is what the propellant paid for; only 436 m/s of it is net velocity change.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Side $a$ opposite angle $A$ | Labelling convention; $A + B + C = \pi$ |
| $c^2 = a^2 + b^2 - 2ab\cos C$ | Law of cosines; Pythagoras when $C = 90^\circ$ |
| $\cos C = \dfrac{a^2 + b^2 - c^2}{2ab}$ | Angle from three sides; arccosine is unambiguous |
| $\lvert\mathbf{u} - \mathbf{v}\rvert^2 = a^2 + b^2 - 2ab\cos C$ | Vector form |
| $\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}$ | Law of sines |
| Area $= \tfrac{1}{2}ab\sin C$ | Two sides and the included angle |
| SSA | Ambiguous case: $B$ and $\pi - B$ may both be valid |
| $\Delta v = 2v\sin(\Delta i/2)$ | Plane change at constant speed |
| $\sin\eta = R_E\cos\varepsilon/r$, $\lambda + \eta + \varepsilon = 90^\circ$ | Ground-station triangle |
| $D^2 = R_E^2 + r^2 - 2R_E r\cos\lambda$ | Slant range from the central angle |

The next lesson takes the limit of small angles. Several results here already showed it — $\Delta v \approx v\,\Delta i$, the chord nearly equal to the arc — and the small-angle approximations make those shortcuts precise, with an honest account of where they stop being good enough.
