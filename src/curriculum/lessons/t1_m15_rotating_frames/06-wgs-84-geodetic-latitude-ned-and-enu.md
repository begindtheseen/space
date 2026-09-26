---
id: l06-wgs-84-geodetic-latitude-ned-and-enu
title: WGS-84, geodetic latitude, NED and ENU
minutes: 20
covers:
  - geodetic vs geocentric latitude and the WGS-84 ellipsoid
  - NED and ENU local-level frames
---

Put a basketball on the floor and press down on it gently. It bulges out around the middle and flattens top and bottom. The Earth is shaped like that — not because anything presses on it, but because it spins. That slight squash is the reason this lesson exists.

A GNSS receiver reports latitude, longitude and height. A launch pad is surveyed in the same three numbers. An inertial navigator holds its velocity as north, east and down. None of these is an ECEF $(x, y, z)$ triple, yet each describes a point or an arrow in the Earth-fixed frame, and navigation software converts between them thousands of times per flight. The conversions rest on one shape — the **WGS-84 reference ellipsoid** — and on a meaning of "latitude" that is not the obvious one.

Here is the surprise: there are two latitudes. The angle up from the equator's plane to the line from the Earth's center to you is the **geocentric latitude**; it is what a round-Earth picture gives. The angle up from the equator's plane to your local vertical — the way a plumb line hangs, very nearly square to the ellipsoid — is the **geodetic latitude**. It is the one on every map, in every GNSS message and in every aircraft's navigation frame. At mid-latitudes they differ by about a fifth of a degree, which is twenty kilometers on the ground. Mixing them up is not a rounding error. This lesson defines the ellipsoid, relates the two latitudes, converts latitude–longitude–height to ECEF and back, and builds the two local-level frames — **north–east–down** and **east–north–up** — that hang off the geodetic vertical.

## The WGS-84 ellipsoid

The Earth spins, and the centrifugal term of lesson 04 flings its middle outward. A spinning ball of fluid settles into a very nearly **oblate ellipsoid of revolution** — a sphere [[squashed along its spin axis|why-flattened]]. Mean sea level follows that shape to within about a hundred meters. The World Geodetic System 1984 (**WGS-84**) picks one such ellipsoid as the reference surface of the ECEF frame, and defines it with four constants:

$$
a = 6\,378\,137.0\,\mathrm{m}, \qquad
f = \frac{1}{298.257223563}, \qquad
\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}, \qquad
\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s} .
$$

- $a$ is the **semi-major axis**: the equator's radius.
- $f$ is the **flattening**, $f = (a - b)/a$, where $b$ is the **semi-minor axis**, the polar radius. It says what fraction of the radius was squashed away at the poles.
- $\mu$ ("mu") is the Earth's gravitational parameter, and $\omega_E$ its rotation rate from lesson 05.

Everything else follows. Work them out in order:

$$
b = a(1 - f) = 6\,356\,752.314\,\mathrm{m}, \qquad a - b = 21\,385\,\mathrm{m}, \qquad
e^2 = 2f - f^2 = 6.69438 \times 10^{-3}, \qquad e = 0.0818192 .
$$

$e$ is the **first eccentricity** of the pole-to-pole cross-section — a single number for how far an ellipse is from a circle ($0$ is a circle). So the Earth is $21\,\mathrm{km}$ fatter across the equator than through the poles, one part in $298$. On a $30\,\mathrm{cm}$ classroom globe that would be one millimeter. Too small to see when sketching, far too big to ignore when navigating.

::: key WGS-84 constants
Key WGS-84 constants: $a = 6\,378\,137.0\,\mathrm{m}$, $f = 1/298.257223563$, $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$, $\omega = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$. Derived: $b = a(1-f) = 6\,356\,752.314\,\mathrm{m}$, $e^2 = 2f - f^2 = 6.694 \times 10^{-3}$.
:::

### Ellipsoid and geoid

Keep two surfaces apart. The **ellipsoid** is the smooth mathematical reference shape. The **geoid** is the real, lumpy surface that mean sea level would follow, bumpy because the Earth's mass is spread unevenly. The geoid sits between about $105\,\mathrm{m}$ below and $85\,\mathrm{m}$ above the WGS-84 ellipsoid; that gap is the **geoid undulation**.

A GNSS receiver measures height above the ellipsoid, $h$. A barometric altimeter, a topographic map and a runway elevation give height above mean sea level — that is, [[above the geoid|geoid-heights]]. The two differ by the local undulation, tens of meters in most places. A landing system that mixes them lands in the wrong place, vertically.

## Geodetic and geocentric latitude

Slice the ellipsoid through both poles. The cut edge is the **meridian ellipse**,

$$
\frac{x^2}{a^2} + \frac{z^2}{b^2} = 1 ,
$$

where $x$ is distance from the spin axis and $z$ is height above the equator's plane. Take a point $P$ on it. Measure two angles up from the equator's plane:

- **Geocentric latitude** $\varphi'$ ("phi prime"): the angle of the line from the center to $P$. So $\tan\varphi' = z/x$.
- **Geodetic latitude** $\varphi$ ("phi"): the angle of the outward **normal** — the line square to the surface — at $P$. On a squashed shape the normal does not pass through the center, except at the equator and the poles.

The [[picture|two-latitudes]] makes it plain: on a flattened Earth the "straight up" direction is tipped more steeply toward the pole than the line from the center. Here is the exact relation, on the surface:

$$
\tan\varphi' = \frac{b^2}{a^2}\tan\varphi = (1 - e^2)\tan\varphi .
$$

::: note Why it has to be true
The normal to a curve $F(x, z) = 1$ points along the **gradient** — the arrow of the rates of change of $F$ with $x$ and with $z$. For $F = x^2/a^2 + z^2/b^2$ that arrow is $(2x/a^2,\ 2z/b^2)$, which points the same way as $(x/a^2,\ z/b^2)$. So the normal's slope is

$$
\tan\varphi = \frac{z/b^2}{x/a^2} = \frac{a^2}{b^2}\cdot\frac{z}{x} = \frac{a^2}{b^2}\tan\varphi' .
$$

Multiply both sides by $b^2/a^2$ to get the formula. Finally, $b^2/a^2 = (1 - f)^2 = 1 - 2f + f^2 = 1 - e^2$.
:::

Since $1 - e^2 < 1$, the geocentric latitude is always the smaller one (in size). The difference $\varphi - \varphi'$ is biggest near $45^\circ$:

$$
\varphi' = \arctan\left(0.9933056 \times \tan 45^\circ\right) = 44.8076^\circ, \qquad \varphi - \varphi' = 0.1924^\circ = 11.5' .
$$

(The $'$ is an **arcminute**, $1/60$ of a degree.) Along the surface, $0.1924^\circ$ is $0.1924 \times \pi/180 \times 6\,378\,137 \approx 21.4\,\mathrm{km}$. Above the surface the tidy formula no longer holds — the normal through a point at height $h$ meets the equator's plane somewhere else — and the ECEF conversion below takes over.

Which is used where? Geodetic latitude is what maps, GNSS receivers, airports and launch sites quote, and what the local frames below are built on. Geocentric latitude appears when a position is written in spherical coordinates $(r, \varphi', \lambda)$, as in gravity-field models and quick round-Earth estimates. **Longitude** $\lambda$ ("lambda") is the same in both, because the ellipsoid is round seen from above the pole.

### Radii of curvature

How sharply does the surface curve at latitude $\varphi$? It depends on which way you walk, so there are two radii:

$$
N(\varphi) = \frac{a}{\sqrt{1 - e^2\sin^2\varphi}}, \qquad
M(\varphi) = \frac{a(1 - e^2)}{\left(1 - e^2\sin^2\varphi\right)^{3/2}} .
$$

- $N$ is the **prime-vertical radius of curvature**, for walking east–west. It is also the length of the normal from the surface down to the spin axis.
- $M$ is the **meridional radius of curvature**, for walking north–south: the radius of the circle that best hugs the meridian ellipse there.

Some values. At the equator $N = a = 6\,378\,137\,\mathrm{m}$ and $M = a(1-e^2) = 6\,335\,439\,\mathrm{m}$. At $45^\circ$, $N = 6\,388\,838\,\mathrm{m}$ and $M = 6\,367\,382\,\mathrm{m}$. At the poles both equal $a/\sqrt{1-e^2} = 6\,399\,594\,\mathrm{m}$. Everywhere $M \le N$: the meridian curves more tightly than the east–west direction. These are the two radii the INS transport rate of lesson 04 divides by.

## Geodetic to ECEF and back

Start at a point with geodetic latitude $\varphi$, longitude $\lambda$ and height $h$ above the ellipsoid. To reach it: go to the surface point below, whose outward normal is $\hat{\mathbf{n}} = (\cos\varphi\cos\lambda,\ \cos\varphi\sin\lambda,\ \sin\varphi)$, then climb $h$ along that normal.

The surface point is a distance $N$ along the normal from the spin axis. So its distance from the axis is $N\cos\varphi$, and — using the ellipse equation — its height above the equator's plane is $N(1 - e^2)\sin\varphi$. Adding the climb $h\hat{\mathbf{n}}$:

$$
\mathbf{r}^{E} = \begin{bmatrix} (N + h)\cos\varphi\cos\lambda \\ (N + h)\cos\varphi\sin\lambda \\ \left(N(1 - e^2) + h\right)\sin\varphi \end{bmatrix} .
$$

The $z$ line differs from the other two because of the squash. For a sphere $e = 0$, and all three would carry $N + h$.

**Going back.** There is no neat closed form ([[several exact methods exist|bowring]]), but a short loop converges fast. Longitude is immediate: $\lambda = \operatorname{atan2}(y, x)$. Let $p = \sqrt{x^2 + y^2}$, the distance from the axis. The forward formulas say $z = (N(1-e^2) + h)\sin\varphi$ and $p = (N + h)\cos\varphi$. Divide one by the other and tidy up:

$$
\tan\varphi = \frac{z}{p}\left(1 - e^2\frac{N}{N + h}\right)^{-1}, \qquad h = \frac{p}{\cos\varphi} - N .
$$

Start with $h = 0$, compute $\varphi$, then $N$ and $h$, and repeat.

```python
import math

A = 6378137.0                 # WGS-84 semi-major axis, m
F = 1 / 298.257223563         # WGS-84 flattening
E2 = 2 * F - F * F            # first eccentricity squared

def geodetic_to_ecef(lat_deg, lon_deg, h):
    lat, lon = math.radians(lat_deg), math.radians(lon_deg)
    N = A / math.sqrt(1 - E2 * math.sin(lat) ** 2)
    return ((N + h) * math.cos(lat) * math.cos(lon),
            (N + h) * math.cos(lat) * math.sin(lon),
            (N * (1 - E2) + h) * math.sin(lat))

def ecef_to_geodetic(x, y, z, iterations=5):
    lon = math.atan2(y, x)
    p = math.hypot(x, y)
    lat = math.atan2(z, p * (1 - E2))          # first guess, h = 0
    for _ in range(iterations):
        N = A / math.sqrt(1 - E2 * math.sin(lat) ** 2)
        h = p / math.cos(lat) - N
        lat = math.atan2(z, p * (1 - E2 * N / (N + h)))
    N = A / math.sqrt(1 - E2 * math.sin(lat) ** 2)
    h = p / math.cos(lat) - N
    return math.degrees(lat), math.degrees(lon), h

r_ecef = geodetic_to_ecef(45.0, 10.0, 500e3)
print([round(c, 1) for c in r_ecef])
print([round(v, 6) for v in ecef_to_geodetic(*r_ecef)])
# [4797140.6, 845865.3, 4840901.8]
# [45.0, 10.0, 500000.0]
```

The round trip closes to the printed precision. For this satellite at $500\,\mathrm{km}$, the $h = 0$ first guess is off by $0.014^\circ$ in latitude and $1.7\,\mathrm{km}$ in height. One pass later the errors are $4 \times 10^{-5}$ degrees and $5\,\mathrm{m}$; after the next, centimeters.

::: example Launch pad SLC-40 in ECEF
[[Space Launch Complex 40|slc-40]] at Cape Canaveral is at geodetic latitude $\varphi = 28.5620^\circ$ north and longitude $80.5772^\circ$ west, so $\lambda = -80.5772^\circ$ (west is negative). Take it at sea level, $h \approx 0$.

**Step 1 — sines and cosines.** $\sin\varphi = 0.47811$, $\cos\varphi = 0.87830$, $\cos\lambda = 0.16372$, $\sin\lambda = -0.98651$.

**Step 2 — the radius $N$.**

$$
N = \frac{6\,378\,137}{\sqrt{1 - 0.00669438 \times 0.47811^2}} = 6\,383\,022.7\,\mathrm{m}, \qquad N(1 - e^2) = 6\,340\,292.3\,\mathrm{m} .
$$

**Step 3 — the three coordinates**, with $h = 0$:

$$
\mathbf{r}^{E} = \begin{bmatrix} 6\,383\,022.7 \times 0.87830 \times 0.16372 \\ 6\,383\,022.7 \times 0.87830 \times (-0.98651) \\ 6\,340\,292.3 \times 0.47811 \end{bmatrix}
= \begin{bmatrix} 917\,841 \\ -5\,530\,566 \\ 3\,031\,354 \end{bmatrix} \mathrm{m} .
$$

**Sanity checks.** These match the pad position used in lesson 02 to within about ten meters, the rounding of the coordinates there. The distance from the center is $|\mathbf{r}^{E}| = 6\,373\,280\,\mathrm{m}$, about $4.9\,\mathrm{km}$ less than $a$ — right, because the pad is well north of the equator on a flattened Earth. The geocentric latitude is $\arcsin(3\,031\,354 / 6\,373\,280) = 28.401^\circ$, which is $9.7'$ less than the geodetic value, as it must be.
:::

## The north–east–down frame

At any point on or above the ellipsoid, attach three arrows to the geodetic vertical:

- $\hat{\mathbf{d}}$, **down**: along the inward ellipsoid normal, $-\hat{\mathbf{n}}$;
- $\hat{\mathbf{n}}$, **north**: level (square to down), in the meridian plane, toward the pole;
- $\hat{\mathbf{e}}$, **east**: level, square to the meridian plane, toward increasing longitude.

This is the [[NED frame|ned-triad]], $N$ for short in subscripts. Check it is **right-handed**: [[north crossed into east|handedness]] — right-hand rule — points down, so $(\hat{\mathbf{n}}, \hat{\mathbf{e}}, \hat{\mathbf{d}})$ is right-handed. Gravity in it is $\mathbf{g}^{N} \approx (0, 0, +g)$, positive. Aircraft body axes are $x$ forward, $y$ out the right wing, $z$ down, so a plane flying level due north has body axes lined up with NED and all three attitude angles zero. That is why NED is the aerospace default.

**The matrix from ECEF.** From lesson 01, the rows of $\mathbf{R}_{N \leftarrow E}$ are the NED arrows written in ECEF. The outward normal is $(\cos\varphi\cos\lambda, \cos\varphi\sin\lambda, \sin\varphi)$. East is how that arrow changes as $\lambda$ grows, scaled to length one: $(-\sin\lambda, \cos\lambda, 0)$. North is how it changes as $\varphi$ grows: $(-\sin\varphi\cos\lambda, -\sin\varphi\sin\lambda, \cos\varphi)$. Down is minus the normal. Stack them:

$$
\mathbf{R}_{N \leftarrow E} = \begin{bmatrix}
-\sin\varphi\cos\lambda & -\sin\varphi\sin\lambda & \cos\varphi \\
-\sin\lambda & \cos\lambda & 0 \\
-\cos\varphi\cos\lambda & -\cos\varphi\sin\lambda & -\sin\varphi
\end{bmatrix}, \qquad \mathbf{v}^{N} = \mathbf{R}_{N \leftarrow E}\,\mathbf{v}^{E} .
$$

The same matrix is a chain of two elementary rotations, $\mathbf{R}_{N \leftarrow E} = \mathbf{R}_2\!\left(-(\varphi + 90^\circ)\right)\mathbf{R}_3(\lambda)$. First turn about $z$ through the longitude, which swings $x$ into your meridian. Then tilt about the new $y$ (now east) through $-(90^\circ + \varphi)$, which carries $x$ from the equator's plane up to north and $z$ from the pole round to down. Multiplying them out reproduces the matrix — a good ten-minute exercise in lesson 01's rules.

Three things to remember about NED:

1. **It uses geodetic latitude.** Down is the ellipsoid normal, not the line to the center. Build NED with geocentric latitude and the whole triad tilts by $\varphi - \varphi'$, up to $11.5'$.
2. **It moves with the vehicle.** As $\varphi$ and $\lambda$ change, the triad turns relative to ECEF at the transport rate $\boldsymbol{\omega}_{N/E}$ of lesson 04. A velocity "in NED" is the velocity relative to the Earth, written along the *current* NED arrows: `v_ecef_in_ned`.
3. **It is not one frame for everyone.** Two vehicles in different places have different NED frames. Their NED velocities cannot be added or subtracted until both are turned into a common frame.

::: example The pad's NED matrix and a launch velocity
At SLC-40, $\varphi = 28.5620^\circ$ and $\lambda = -80.5772^\circ$. Put the sines and cosines from the last example into the matrix:

$$
\mathbf{R}_{N \leftarrow E} = \begin{bmatrix} -0.0783 & 0.4717 & 0.8783 \\ 0.9865 & 0.1637 & 0 \\ -0.1438 & 0.8664 & -0.4781 \end{bmatrix} .
$$

**Test it** with the direction from the Earth's center to the pad, $\hat{\mathbf{u}} = \mathbf{r}^{E}/|\mathbf{r}^{E}| = (0.14401, -0.86777, 0.47563)$. Multiplying gives $\hat{\mathbf{u}}^{N} = (-0.00282, 0.0000, -0.99999)$. That is almost exactly $-\hat{\mathbf{d}}$ — straight up — as expected. But it has a small *negative* north part: the line from the center leans $\arcsin(0.00282) = 9.7'$ toward the equator compared with the geodetic vertical. It is the same $9.7'$ found above as $\varphi - \varphi'$, now seen as an arrow.

**A launch velocity.** Lesson 03 found that a rocket bound for a $51.6^\circ$ orbit must reach an Earth-relative velocity of about $(5\,421.8,\ 5\,014.4,\ 0)\,\mathrm{m/s}$ in NED, treating injection as happening above the pad. To write it in ECEF axes, use the transpose (going the other way):

$$
\mathbf{v}^{E} = \mathbf{R}_{N \leftarrow E}^{T}\,\mathbf{v}^{N} = \begin{bmatrix} -0.0783 \times 5\,421.8 + 0.9865 \times 5\,014.4 \\ 0.4717 \times 5\,421.8 + 0.1637 \times 5\,014.4 \\ 0.8783 \times 5\,421.8 + 0 \end{bmatrix} = \begin{bmatrix} 4\,522 \\ 3\,378 \\ 4\,762 \end{bmatrix} \mathrm{m/s} .
$$

**Sanity check:** the length is $7\,385\,\mathrm{m/s}$ in both frames, as it must be for a rotation. To get the inertial velocity from here you would add $\boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$ and turn by $\mathbf{R}_{I \leftarrow E}$, the two steps of lesson 05. That makes a four-hop chain, ECI ← ECEF ← NED ← body, in which every arrow is a named matrix.
:::

## The east–north–up frame

Geodesy, surveying, [[robotics|enu-robotics]] and most GNSS processing use the same three directions in a different order, with the vertical flipped: $x$ east, $y$ north, $z$ up. That is **ENU**. East crossed into north points up, so ENU is right-handed too. Its matrix from ECEF has the same three rows as NED's, reordered, with the last one negated:

$$
\mathbf{R}_{U \leftarrow E} = \begin{bmatrix}
-\sin\lambda & \cos\lambda & 0 \\
-\sin\varphi\cos\lambda & -\sin\varphi\sin\lambda & \cos\varphi \\
\cos\varphi\cos\lambda & \cos\varphi\sin\lambda & \sin\varphi
\end{bmatrix}, \qquad
\mathbf{R}_{U \leftarrow N} = \begin{bmatrix} 0 & 1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & -1 \end{bmatrix} ,
$$

using $U$ for ENU. $\mathbf{R}_{U \leftarrow N}$ swaps the first two components and negates the third. Swapping two axes alone would be a mirror image, with **determinant** $-1$ (the determinant says whether a matrix keeps handedness: $+1$ yes, $-1$ no). Negating one axis alone would be another mirror. Two mirrors make a rotation, so together they give determinant $+1$. $\mathbf{R}_{U \leftarrow N}$ is a proper rotation — a half-turn about the level axis pointing north-east. Both frames are legitimate; neither is a mirror image of the other.

**The bug is mixing them.** A velocity $(v_N, v_E, v_D)$ handed to code that expects $(v_E, v_N, v_U)$ has north and east swapped and its vertical reversed. Take a vehicle heading $060^\circ$ (60 degrees clockwise from north) at $250\,\mathrm{m/s}$ and climbing at $5\,\mathrm{m/s}$:

- NED: north $= 250\cos 60^\circ = 125.0$, east $= 250\sin 60^\circ = 216.5$, down $= -5.0$. So $(125.0,\ 216.5,\ -5.0)$.
- ENU: $(216.5,\ 125.0,\ +5.0)$.

Same motion. Read one as the other and you get a heading of $30^\circ$ instead of $60^\circ$, and a descent instead of a climb. Because both are "local-level" and both say "north" and "east", this mismatch survives code review far more often than it should. The variable name must say which: `v_ned`, `v_enu`.

::: key NED and ENU
NED: x north, y east, z down along the local ellipsoid normal (aerospace default, right-handed with gravity positive). ENU: x east, y north, z up (geodesy and robotics default). Mixing them flips two axes and is a classic sign bug. $\mathbf{R}_{U \leftarrow N}$ swaps the first two components and negates the third; it has determinant $+1$.
:::

::: warning Geocentric latitude tilts the whole frame
A local-level frame built from geocentric latitude is tilted by up to $11.5'$ from the true geodetic vertical. Gravity then picks up a false sideways part of $g\sin(11.5') = 0.033\,\mathrm{m/s^2}$ in the navigation equations — as big as the Coriolis term for most vehicles. That adds up to $\tfrac{1}{2} \times 0.033 \times 60^2 \approx 59\,\mathrm{m}$ of position error in the first minute, growing with the square of time. The symptom is an INS that drifts north or south at a rate that depends on latitude.
:::

::: warning Ellipsoid height is not sea-level height
GNSS gives height above the ellipsoid. Maps, altimeters and runway data give height above mean sea level. They differ by the geoid undulation, which reaches tens of meters and is about $-30\,\mathrm{m}$ over Florida. A landing or terminal-guidance system needs a geoid model (EGM2008 or its successors) to convert one to the other, and the variable name should say which it holds: `h_ellipsoid`, `h_msl`.
:::

## Check yourself

::: check
Find the geocentric latitude of a point on the WGS-84 surface at geodetic latitude $60^\circ$, and the distance along the ground that the difference amounts to.
:::

::: answer
**Use the relation.** $\tan\varphi' = (1 - e^2)\tan 60^\circ = 0.9933056 \times 1.7320508 = 1.7204558$, so $\varphi' = \arctan 1.7204558 = 59.833^\circ$.

**The difference** is $60 - 59.833 = 0.167^\circ$, or $0.167 \times 60 = 10.0'$. Along the surface: $0.167 \times \pi/180 \times 6\,378\,137 \approx 18.6\,\mathrm{km}$.

**Sanity check:** smaller than the $11.5'$ peak near $45^\circ$, as it should be; it falls to zero at $90^\circ$, where the radius and the normal line up.
:::

::: check
Explain in pictures why $N(\varphi) \ge M(\varphi)$ everywhere on an oblate ellipsoid, and why the two are equal at the poles.
:::

::: answer
$M$ is the radius of the north–south cut, the meridian ellipse. On a squashed Earth that is the most tightly curved direction, because the squash happens along the meridian. $N$ is the radius of the east–west cut, which bends more gently. Another way to see it: $N$ is the length of the normal down to the spin axis, and that normal is longer than the radius of the circle hugging the meridian, because the meridian bends away faster.

At the poles the surface looks the same in every direction around the normal, so every cut through the normal is the same curve, and the two radii match at $a/\sqrt{1 - e^2} = 6\,399\,594\,\mathrm{m}$. That is *larger* than $a$: the flattened pole is flatter than a sphere of radius $a$, and a flatter curve has a bigger radius.
:::

::: check
Write $\mathbf{R}_{N \leftarrow E}$ for a point on the equator at longitude $90^\circ$ east, and check by eye that each row is the right arrow.
:::

::: answer
With $\varphi = 0$ and $\lambda = 90^\circ$: $\sin\varphi = 0$, $\cos\varphi = 1$, $\sin\lambda = 1$, $\cos\lambda = 0$. The matrix becomes

$$
\mathbf{R}_{N \leftarrow E} = \begin{bmatrix} 0 & 0 & 1 \\ -1 & 0 & 0 \\ 0 & -1 & 0 \end{bmatrix} .
$$

- Row 1, north, is $(0, 0, 1)$: on the equator, north runs straight along the ECEF $z$ axis toward the pole.
- Row 2, east, is $(-1, 0, 0)$: at $90^\circ$ east the point sits on the ECEF $+y$ axis, and moving east from there means moving toward $-x$.
- Row 3, down, is $(0, -1, 0)$: from a point on $+y$, toward the center.

Each row has length one, the rows are square to each other, and $\hat{\mathbf{n}} \times \hat{\mathbf{e}} = (0,0,1) \times (-1,0,0) = (0, -1, 0) = \hat{\mathbf{d}}$, confirming the right-handed order.
:::

::: check
A GNSS driver publishes velocity as ENU, but a downstream filter reads it as NED. The vehicle is moving due north at $10\,\mathrm{m/s}$ and descending at $1\,\mathrm{m/s}$. What velocity does the filter believe, and what happens?
:::

::: answer
**The true ENU triple** is $(0, 10, -1)$: zero east, $10\,\mathrm{m/s}$ north, $-1\,\mathrm{m/s}$ up (descending).

**Read as NED** $(v_N, v_E, v_D)$, the filter sees north $= 0$, east $= 10\,\mathrm{m/s}$, down $= -1\,\mathrm{m/s}$: a vehicle heading due east and *climbing* at $1\,\mathrm{m/s}$. The heading is off by $90^\circ$ and the vertical rate is reversed.

**What happens.** Fusing this with an IMU, the filter sees a steady, structured disagreement. It either rejects the GNSS updates or drags its attitude estimate around trying to reconcile them. During a landing, the reversed vertical rate is the dangerous part. The fix is a type or a name (`v_enu`) at the interface, and an explicit $\mathbf{R}_{N \leftarrow U}$ where the frames meet.
:::

::: check
Why is the NED frame tied to the ellipsoid normal rather than to the line from the Earth's center, when the latter is easier to compute?
:::

::: answer
Because the vertical that matters physically is the direction of gravity — what a plumb line, a spirit level, a still accelerometer and the water in a harbor all agree on. The ellipsoid was built so its normal follows that direction to within a few arcseconds almost everywhere (the leftover is called the **deflection of the vertical**). The line from the center misses gravity by up to $11.5'$ — over two hundred times more.

A frame built on the center line would have a "level" plane tilted by that much. A plane flying level would seem to climb or descend. Gravity would have a large sideways part in the navigation equations. And every surveyed latitude on Earth, which is geodetic, would disagree with the frame. The extra work — one square root for $N$ — is tiny next to the cost of being twenty kilometers wrong.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $a = 6\,378\,137.0\,\mathrm{m}$, $f = 1/298.257223563$ | WGS-84 equator radius and flattening; $b = a(1-f) = 6\,356\,752.314\,\mathrm{m}$ |
| $e^2 = 2f - f^2 = 6.694 \times 10^{-3}$ | First eccentricity squared |
| $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$, $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$ | WGS-84 gravitational parameter and rotation rate |
| $\varphi$, $\varphi'$ | Geodetic latitude (ellipsoid normal) and geocentric latitude (line to center) |
| $\tan\varphi' = (1 - e^2)\tan\varphi$ | On the surface; difference peaks at $11.5'$ ($21\,\mathrm{km}$) near $45^\circ$ |
| $N = a/\sqrt{1 - e^2\sin^2\varphi}$, $M = a(1-e^2)/(1 - e^2\sin^2\varphi)^{3/2}$ | East–west and north–south radii of curvature; $M \le N$ |
| $\mathbf{r}^{E} = \left((N+h)\cos\varphi\cos\lambda,\; (N+h)\cos\varphi\sin\lambda,\; (N(1-e^2)+h)\sin\varphi\right)$ | Geodetic to ECEF; the inverse by a short loop |
| Ellipsoid vs geoid | $h$ above the ellipsoid (GNSS) vs height above mean sea level; undulation up to about $100\,\mathrm{m}$ |
| NED | North, east, down along the geodetic normal; right-handed; gravity $(0, 0, +g)$ |
| $\mathbf{R}_{N \leftarrow E}$ | Rows: north, east, down in ECEF; equals $\mathbf{R}_2(-(\varphi + 90^\circ))\mathbf{R}_3(\lambda)$ |
| ENU, $\mathbf{R}_{U \leftarrow N}$ | East, north, up; swap the first two components, negate the third; $\det = +1$ |

Next lesson: frames that ride on the vehicle and its orbit — body axes, the LVLH and RIC frame that follows a satellite round its orbit, the perifocal frame of the orbit itself, the topocentric frame of a ground station, and the sensor frames where measurements are actually made.

::: context why-flattened How we learned the Earth is squashed
In 1687 Isaac Newton argued that a spinning Earth should bulge at the equator, and estimated a flattening of about $1/230$. Others, working from French survey measurements, thought the Earth was stretched toward the poles instead.

To settle it, France sent expeditions in the 1730s to Lapland, near the Arctic Circle, and to Peru, near the equator, to measure how long one degree of latitude is on the ground. A degree was longer in the north — the surface is flatter there, so you walk farther for the vertical to tip one degree. Newton was right. Today satellites measure the flattening as $1/298.257$.
:::

::: context geoid-heights Three heights, one point
The smooth ellipsoid (grey) is the math surface. The geoid (blue) is where calm sea level would be, bumped up and down by uneven mass. A GNSS receiver at the top measures $h$, its height above the ellipsoid. A map gives $H$, height above the geoid. The gap between the two surfaces is the undulation $N_g$, so $h = H + N_g$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="150" x2="350" y2="150" stroke="#6c7a93" stroke-width="2"/>
  <text x="14" y="168" font-size="11" fill="#6c7a93">ellipsoid</text>
  <path d="M 10 140 C 80 110 140 150 220 125 S 320 120 350 138" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="14" y="126" font-size="11" fill="#1d6fd1">geoid (sea level)</text>
  <circle cx="220" cy="36" r="5" fill="#1f2a44"/>
  <text x="230" y="30" font-size="11" fill="#1f2a44">receiver</text>
  <line x1="220" y1="40" x2="220" y2="150" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="250" y1="36" x2="250" y2="150" stroke="#b4232c" stroke-width="2"/>
  <text x="256" y="96" font-size="12" fill="#b4232c">h</text>
  <line x1="190" y1="36" x2="190" y2="125" stroke="#1d6fd1" stroke-width="2"/>
  <text x="176" y="84" font-size="12" fill="#1d6fd1">H</text>
  <line x1="290" y1="125" x2="290" y2="150" stroke="#f2b880" stroke-width="3"/>
  <line x1="220" y1="125" x2="290" y2="125" stroke="#f2b880" stroke-width="1" stroke-dasharray="2 2"/>
  <text x="296" y="142" font-size="12" fill="#1f2a44">N_g</text>
</svg>
```

Over Florida the geoid sits about $30\,\mathrm{m}$ *below* the ellipsoid, so there $N_g \approx -30\,\mathrm{m}$ and the GNSS height is about $30\,\mathrm{m}$ less than the map height.
:::

::: context two-latitudes Two lines, two angles
A quarter of the pole-to-pole slice, with the squash hugely exaggerated so the effect shows. The blue line runs from the center to the point; its angle is the geocentric latitude $\varphi'$. The red line is square to the surface; its angle is the geodetic latitude $\varphi$. Notice the red line meets the equator's plane short of the center.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="180" x2="350" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="190" x2="30" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5 4"/>
  <text x="36" y="50" font-size="11" fill="#6c7a93">spin axis</text>
  <path d="M 200 180 A 170 110 0 0 0 30 70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="30" cy="180" r="3" fill="#1f2a44"/>
  <line x1="30" y1="180" x2="214.2" y2="102.9" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="113" y1="180" x2="204.5" y2="88.4" stroke="#b4232c" stroke-width="2"/>
  <circle cx="172.7" cy="120.2" r="4" fill="#1f2a44"/>
  <path d="M 70 180 A 40 40 0 0 0 66.9 164.6" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="76" y="174" font-size="12" fill="#1d6fd1">φ′</text>
  <path d="M 141 180 A 28 28 0 0 0 132.8 160.2" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="146" y="172" font-size="12" fill="#b4232c">φ</text>
  <text x="210" y="84" font-size="11" fill="#b4232c">normal: geodetic</text>
  <text x="220" y="112" font-size="11" fill="#1d6fd1">to center: geocentric</text>
  <text x="240" y="196" font-size="11" fill="#6c7a93">equator plane</text>
</svg>
```

Here the drawing is squashed to $b/a = 0.65$, giving $\varphi = 45^\circ$ against $\varphi' \approx 23^\circ$. On the real Earth, $b/a = 0.9966$ and the gap is only $0.19^\circ$.
:::

::: context bowring Why not a formula?
Going from latitude, longitude and height to ECEF is one line of algebra. Going back means solving an equation of fourth degree, which has an exact answer but a messy one. Geodesists have published many direct methods — Bowring's (1976) is a classic, used in countless GNSS receivers, and it is exact to well under a millimeter for any point near the Earth after one step.

The simple loop in this lesson is slower but easy to read and easy to check, and five passes are more than enough for anything above the ground.
:::

::: context slc-40 The pad in the example
Space Launch Complex 40 is on the coast at Cape Canaveral Space Force Station in Florida. It first flew Titan rockets and, since 2010, has been one of SpaceX's main Falcon 9 pads.

Launch pads are surveyed to the centimeter in the ECEF frame. The pad position feeds the rocket's navigation system before lift-off, and it is where the ascent trajectory's first velocity — the $409\,\mathrm{m/s}$ eastward push from the Earth's spin, from lesson 02 — is worked out.
:::

::: context ned-triad North, east and down at a point
A slice through the poles, with a point at latitude $\varphi$. North runs along the surface toward the pole. Down points into the Earth along the normal. East points straight out of the page toward you, shown as a dot in a circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="110" r="80" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="20" x2="120" y2="200" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5 4"/>
  <line x1="30" y1="110" x2="210" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="120" y1="110" x2="181.3" y2="58.6" stroke="#6c7a93" stroke-width="1"/>
  <path d="M 150 110 A 30 30 0 0 0 143 90.7" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="153" y="104" font-size="11" fill="#1f2a44">φ</text>
  <line x1="181.3" y1="58.6" x2="148.7" y2="19.8" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="142.7,12.6 145.5,25.1 154.7,17.4" fill="#1d6fd1"/>
  <text x="104" y="18" font-size="12" fill="#1d6fd1">north</text>
  <line x1="181.3" y1="58.6" x2="142.2" y2="91.4" stroke="#b4232c" stroke-width="3"/>
  <polygon points="135.3,97.2 139.3,85.0 147.0,94.2" fill="#b4232c"/>
  <text x="150" y="80" font-size="12" fill="#b4232c">down</text>
  <circle cx="200" cy="50" r="7" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="200" cy="50" r="2" fill="#1f2a44"/>
  <text x="212" y="54" font-size="12" fill="#1f2a44">east (out of page)</text>
  <circle cx="181.3" cy="58.6" r="3.5" fill="#1f2a44"/>
</svg>
```

(The globe is drawn round; on the real, slightly squashed Earth, "down" misses the center by up to about 21 km.)
:::

::: context handedness Checking handedness with your hand
Point the fingers of your right hand along the first axis. Curl them toward the second axis. Your thumb now points along the third axis — if the set is right-handed.

For NED: fingers north, curl toward east, and your thumb points into the ground. Down. For ENU: fingers east, curl toward north, and your thumb points to the sky. Up. Both pass. Try NEU (north, east, up) and your thumb points down while the third axis says up — that set is left-handed, and no rotation matrix can turn a right-handed frame into it.
:::

::: context enu-robotics Why robots use ENU
Ground robots and drones built on the Robot Operating System (ROS) follow a published convention, REP 103, which makes ENU the standard for world-fixed frames: $x$ east, $y$ north, $z$ up. It matches the way people draw maps, with $x$ to the right and $y$ up the page, and height as positive $z$.

So a drone's autopilot (often NED, from aviation habits) and its ROS companion computer (ENU) may sit a few centimeters apart on the same frame, speaking different conventions. The interface between them is exactly where the swap-and-negate matrix $\mathbf{R}_{U \leftarrow N}$ has to live.
:::
