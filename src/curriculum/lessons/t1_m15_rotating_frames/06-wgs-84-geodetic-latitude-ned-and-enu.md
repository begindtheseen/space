---
id: l06-wgs-84-geodetic-latitude-ned-and-enu
title: WGS-84, geodetic latitude, NED and ENU
minutes: 21
covers:
  - geodetic vs geocentric latitude and the WGS-84 ellipsoid
  - NED and ENU local-level frames
---

A GNSS receiver reports latitude, longitude and height. A launch pad is surveyed in the same three numbers. An inertial navigator holds its velocity along north, east and down. None of these is a Cartesian ECEF triple, yet every one of them is a description of a point or a vector in the Earth-fixed frame, and converting between them is a task the navigation software does thousands of times per flight. The conversions rest on one geometric object — the WGS-84 reference ellipsoid — and on a definition of "latitude" that is not the obvious one.

The non-obvious part is that there are two latitudes. The angle between the equatorial plane and the line from the Earth's centre to your position is the geocentric latitude, and it is the one a spherical-Earth intuition gives. The angle between the equatorial plane and the local vertical — the direction a plumb line hangs, or very nearly the perpendicular to the ellipsoid — is the geodetic latitude, and it is the one on every map, in every GNSS message and in every aircraft's navigation frame. At mid-latitudes they differ by about a fifth of a degree, which is twenty kilometres on the ground. Confusing them is not a rounding error.

This lesson defines the ellipsoid and its constants, derives the relation between the two latitudes, builds the geodetic-to-ECEF conversion and its inverse, and then constructs the two local-level frames — north–east–down and east–north–up — that hang off the geodetic vertical. The frame-transformation matrix from ECEF to NED is written out and verified, because it is the matrix on which every INS mechanisation and every launch-site velocity calculation depends.

## The WGS-84 ellipsoid

The Earth rotates, and the centrifugal term of lesson 04 pushes its equator outward. The equilibrium shape of a rotating fluid body is very nearly an oblate ellipsoid of revolution — a sphere squashed along the spin axis — and the mean sea-level surface of the Earth follows that shape to within about a hundred metres. The World Geodetic System 1984 (WGS-84) adopts a particular ellipsoid as the reference surface for the ECEF frame, defined by four constants:

$$
a = 6\,378\,137.0\,\mathrm{m}, \qquad
f = \frac{1}{298.257223563}, \qquad
\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}, \qquad
\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s} .
$$

Here $a$ is the semi-major axis, the equatorial radius, and $f$ is the flattening, $f = (a - b)/a$ with $b$ the polar semi-axis. Everything else is derived:

$$
b = a(1 - f) = 6\,356\,752.314\,\mathrm{m}, \qquad a - b = 21\,385\,\mathrm{m}, \qquad
e^2 = 2f - f^2 = 6.69438 \times 10^{-3}, \qquad e = 0.0818192 ,
$$

where $e$ is the first eccentricity of the meridian ellipse. The Earth is $21\,\mathrm{km}$ fatter across the equator than through the poles, one part in $298$: a globe of $30\,\mathrm{cm}$ diameter would be flattened by one millimetre. Small enough to ignore when sketching, far too large to ignore when navigating.

Two surfaces must be kept distinct. The **ellipsoid** is the mathematical reference surface. The **geoid** is the physical equipotential surface of gravity that mean sea level would follow, lumpy because the Earth's mass is not distributed uniformly; it departs from the WGS-84 ellipsoid by between about $-105\,\mathrm{m}$ and $+85\,\mathrm{m}$, a quantity called the geoid undulation. A GNSS receiver measures height above the ellipsoid, $h$. A barometric altimeter, a topographic map and a runway elevation give height above mean sea level, which is height above the geoid. The two differ by the local undulation, tens of metres in most places, and a landing system that mixes them lands in the wrong place vertically.

::: key
Key WGS-84 constants: $a = 6\,378\,137.0\,\mathrm{m}$, $f = 1/298.257223563$, $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$, $\omega = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$. Derived: $b = a(1-f) = 6\,356\,752.314\,\mathrm{m}$, $e^2 = 2f - f^2 = 6.694 \times 10^{-3}$.
:::

## Geodetic and geocentric latitude

Cut the ellipsoid through the poles to get the meridian ellipse, $x^2/a^2 + z^2/b^2 = 1$, with $x$ the distance from the spin axis and $z$ the distance from the equatorial plane. Take a point $P$ on it and define two angles measured from the equatorial plane:

- **Geocentric latitude** $\varphi'$: the angle of the line from the centre to $P$, so $\tan\varphi' = z/x$.
- **Geodetic latitude** $\varphi$: the angle of the outward normal to the ellipsoid at $P$. The normal does not pass through the centre except at the equator and the poles.

The normal direction is the gradient of $x^2/a^2 + z^2/b^2$, proportional to $(x/a^2, z/b^2)$, so $\tan\varphi = (z/b^2)/(x/a^2) = (a^2/b^2)(z/x)$, and therefore, on the surface,

$$
\tan\varphi' = \frac{b^2}{a^2}\tan\varphi = (1 - e^2)\tan\varphi .
$$

Since $1 - e^2 < 1$, the geocentric latitude is always the smaller in magnitude: the normal is tilted toward the pole relative to the radius. Differentiating shows the difference $\varphi - \varphi'$ is greatest near $45^\circ$, where

$$
\varphi' = \arctan\left(0.9933056 \times \tan 45^\circ\right) = 44.8076^\circ, \qquad \varphi - \varphi' = 0.1924^\circ = 11.5' ,
$$

and $11.5'$ of arc along the surface is $0.1924 \times \pi/180 \times 6\,378\,137 = 21.4\,\mathrm{km}$. Above the surface the relation acquires a height dependence — the normal through a point at height $h$ meets the equatorial plane at a different place than the normal through the surface point below it — and the clean formula is replaced by the ECEF conversion of the next section.

Which latitude is which in practice: geodetic latitude is what maps, GNSS receivers, airports and launch sites quote, and what the local-level frames below are built on. Geocentric latitude appears when a position is written as $(r, \varphi', \lambda)$ in spherical coordinates, as in gravity-field spherical harmonic expansions and in quick spherical-Earth estimates. Longitude $\lambda$ is the same in both systems, since the ellipsoid is rotationally symmetric.

### Radii of curvature

Two more quantities describe the ellipsoid at geodetic latitude $\varphi$:

$$
N(\varphi) = \frac{a}{\sqrt{1 - e^2\sin^2\varphi}}, \qquad
M(\varphi) = \frac{a(1 - e^2)}{\left(1 - e^2\sin^2\varphi\right)^{3/2}} .
$$

$N$ is the prime-vertical radius of curvature, and geometrically it is the length of the normal from the surface down to the spin axis. $M$ is the meridional radius of curvature, the radius of the circle that best fits the meridian ellipse at that point. Numerically, at the equator $N = a = 6\,378\,137\,\mathrm{m}$ and $M = a(1-e^2) = 6\,335\,439\,\mathrm{m}$; at $45^\circ$, $N = 6\,388\,838\,\mathrm{m}$ and $M = 6\,367\,382\,\mathrm{m}$; at the poles both equal $a/\sqrt{1-e^2} = 6\,399\,594\,\mathrm{m}$. Everywhere $M \le N$, the meridian curving more tightly than the prime vertical, and the two radii are what the INS transport rate of lesson 04 divides by.

## Geodetic to ECEF and back

A point at geodetic latitude $\varphi$, longitude $\lambda$ and ellipsoidal height $h$ is reached by going to the surface point with normal direction $\hat{\mathbf{n}} = (\cos\varphi\cos\lambda, \cos\varphi\sin\lambda, \sin\varphi)$ and then moving $h$ along that normal. The surface point sits at distance $N$ along the normal from the spin axis, so its distance from the axis is $N\cos\varphi$ and — using the ellipse equation — its height above the equatorial plane is $N(1 - e^2)\sin\varphi$. Hence

$$
\mathbf{r}^{E} = \begin{bmatrix} (N + h)\cos\varphi\cos\lambda \\ (N + h)\cos\varphi\sin\lambda \\ \left(N(1 - e^2) + h\right)\sin\varphi \end{bmatrix} .
$$

The asymmetry between the $z$ component and the other two is the ellipsoid: for a sphere $e = 0$ and all three would carry $N + h$.

The inverse has no closed form as neat as this (several exact algorithms exist; Bowring's and Zhu's are the usual choices), but a short fixed-point iteration converges to sub-millimetre accuracy in three or four steps for any point above the surface. Longitude is immediate, $\lambda = \operatorname{atan2}(y, x)$. With $p = \sqrt{x^2 + y^2}$ the distance from the axis, the forward formulas give $z = (N(1-e^2) + h)\sin\varphi$ and $p = (N + h)\cos\varphi$, so

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

The round trip closes to the printed precision. Starting from the $h = 0$ guess, the first iterate for this $500\,\mathrm{km}$ satellite is off by $0.014^\circ$ in latitude and $1.7\,\mathrm{km}$ in height; the second is off by $4 \times 10^{-5}$ degrees and $5\,\mathrm{m}$; the third by centimetres.

::: example Launch pad SLC-40 in ECEF
Space Launch Complex 40 at Cape Canaveral is at geodetic latitude $\varphi = 28.5620^\circ$ north, longitude $\lambda = 80.5772^\circ$ west, so $\lambda = -80.5772^\circ$, at sea level, $h \approx 0$. Then $\sin\varphi = 0.47811$, $\cos\varphi = 0.87830$, and

$$
N = \frac{6\,378\,137}{\sqrt{1 - 0.00669438 \times 0.47811^2}} = 6\,383\,022.7\,\mathrm{m}, \qquad N(1 - e^2) = 6\,340\,292.3\,\mathrm{m} .
$$

With $\cos\lambda = 0.16372$ and $\sin\lambda = -0.98651$:

$$
\mathbf{r}^{E} = \begin{bmatrix} 6\,383\,022.7 \times 0.87830 \times 0.16372 \\ 6\,383\,022.7 \times 0.87830 \times (-0.98651) \\ 6\,340\,292.3 \times 0.47811 \end{bmatrix}
= \begin{bmatrix} 917\,841 \\ -5\,530\,566 \\ 3\,031\,354 \end{bmatrix} \mathrm{m} .
$$

These agree with the figures used in lesson 02 to within about ten metres, the rounding of the pad coordinates there. The geocentric distance is $|\mathbf{r}^{E}| = 6\,373\,280\,\mathrm{m}$, about $4.9\,\mathrm{km}$ less than $a$ because the pad is well north of the equator on a flattened Earth, and the geocentric latitude is $\arcsin(3\,031\,354 / 6\,373\,280) = 28.401^\circ$, which is $9.7'$ less than the geodetic value.
:::

## The north–east–down frame

At any point on or above the ellipsoid, attach a right-handed triad to the geodetic vertical:

- $\hat{\mathbf{d}}$, **down**, along the inward ellipsoid normal, $-\hat{\mathbf{n}}$;
- $\hat{\mathbf{n}}$, **north**, horizontal (perpendicular to $\hat{\mathbf{d}}$) in the meridian plane, toward the pole;
- $\hat{\mathbf{e}}$, **east**, horizontal, perpendicular to the meridian plane, in the direction of increasing longitude.

This is the NED frame, $N$ for short in subscripts. Check the handedness: $\hat{\mathbf{n}} \times \hat{\mathbf{e}}$ — north crossed into east, right-hand rule — points down, so $(\hat{\mathbf{n}}, \hat{\mathbf{e}}, \hat{\mathbf{d}})$ is right-handed. Gravity in it is $\mathbf{g}^{N} \approx (0, 0, +g)$, positive, and the aircraft body convention of $x$ forward, $y$ right wing, $z$ down means that a vehicle in level flight heading north has body axes parallel to NED and all three Euler angles zero. That is why NED is the aerospace default.

The coordinate transformation from ECEF follows from lesson 01: the rows of $\mathbf{R}_{N \leftarrow E}$ are the NED axes resolved in ECEF. The outward normal is $(\cos\varphi\cos\lambda, \cos\varphi\sin\lambda, \sin\varphi)$; east is the derivative of that with respect to $\lambda$, normalised, $(-\sin\lambda, \cos\lambda, 0)$; north is its derivative with respect to $\varphi$, $(-\sin\varphi\cos\lambda, -\sin\varphi\sin\lambda, \cos\varphi)$. So

$$
\mathbf{R}_{N \leftarrow E} = \begin{bmatrix}
-\sin\varphi\cos\lambda & -\sin\varphi\sin\lambda & \cos\varphi \\
-\sin\lambda & \cos\lambda & 0 \\
-\cos\varphi\cos\lambda & -\cos\varphi\sin\lambda & -\sin\varphi
\end{bmatrix}, \qquad \mathbf{v}^{N} = \mathbf{R}_{N \leftarrow E}\,\mathbf{v}^{E} .
$$

The same matrix as a chain of elementary rotations is $\mathbf{R}_{N \leftarrow E} = \mathbf{R}_2\!\left(-(\varphi + 90^\circ)\right)\mathbf{R}_3(\lambda)$: first turn about $z$ through the longitude to bring $x$ into the meridian, then tilt about the new $y$ (which is now east) through $-(90^\circ + \varphi)$ to carry $x$ from the equatorial plane up to north and $z$ from the pole round to down. Multiplying out reproduces the matrix above; checking that it does is a good ten-minute exercise in lesson 01's rules.

Three points about the frame:

1. **It uses geodetic latitude.** The down axis is the ellipsoid normal, not the radius. Building NED with geocentric latitude tilts the whole triad by $\varphi - \varphi'$, up to $11.5'$.
2. **It moves with the vehicle.** As the vehicle travels, $\varphi$ and $\lambda$ change and the triad turns relative to ECEF at the transport rate $\boldsymbol{\omega}_{N/E}$ of lesson 04. A velocity "in NED" is a velocity relative to the Earth resolved along the *current* NED axes, `v_ecef_in_ned`.
3. **It is not a single frame** unless the reference point is fixed. Two vehicles at different places have different NED frames; their NED velocities cannot be added or differenced until both are rotated into a common frame.

::: example The pad's NED matrix and a launch velocity
At SLC-40, $\varphi = 28.5620^\circ$ and $\lambda = -80.5772^\circ$. With the sines and cosines from the previous example,

$$
\mathbf{R}_{N \leftarrow E} = \begin{bmatrix} -0.0783 & 0.4717 & 0.8783 \\ 0.9865 & 0.1637 & 0 \\ -0.1438 & 0.8664 & -0.4781 \end{bmatrix} .
$$

Test it with the pad's own geocentric direction, $\hat{\mathbf{u}} = \mathbf{r}^{E}/|\mathbf{r}^{E}| = (0.14401, -0.86777, 0.47563)$. Multiplying gives $\hat{\mathbf{u}}^{N} = (-0.00282, 0.0000, -0.99999)$: almost exactly $-\hat{\mathbf{d}}$, as the radius nearly coincides with the up direction, but with a small *negative* north component. The radius from the centre is tilted $\arcsin(0.00282) = 9.7'$ toward the equator relative to the geodetic vertical — the same $9.7'$ found above as $\varphi - \varphi'$, seen now as a vector.

Lesson 03 found that a vehicle bound for a $51.6^\circ$ orbit must generate an Earth-relative velocity of $(5\,421.7, 5\,014.5, 0)\,\mathrm{m/s}$ in NED at injection, treating the injection point as above the pad. In ECEF axes that is

$$
\mathbf{v}^{E} = \mathbf{R}_{N \leftarrow E}^{T}\,\mathbf{v}^{N} = \begin{bmatrix} -0.0783 \times 5\,421.7 + 0.9865 \times 5\,014.5 \\ 0.4717 \times 5\,421.7 + 0.1637 \times 5\,014.5 \\ 0.8783 \times 5\,421.7 + 0 \end{bmatrix} = \begin{bmatrix} 4\,522 \\ 3\,378 \\ 4\,762 \end{bmatrix} \mathrm{m/s} ,
$$

with magnitude $7\,385\,\mathrm{m/s}$, unchanged by the rotation. To get the inertial velocity from here you would add $\boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$ and rotate by $\mathbf{R}_{I \leftarrow E}$, the two steps of lesson 05 — a four-hop chain, ECI ← ECEF ← NED ← body, in which every arrow is a named matrix.
:::

## The east–north–up frame

Geodesy, surveying, robotics and most GNSS post-processing use the same three directions in a different order and with the vertical flipped: $x$ east, $y$ north, $z$ up. Check the handedness: east crossed into north points up, so ENU is right-handed too. Its matrix from ECEF has the same three rows as NED's, reordered and with the last negated:

$$
\mathbf{R}_{U \leftarrow E} = \begin{bmatrix}
-\sin\lambda & \cos\lambda & 0 \\
-\sin\varphi\cos\lambda & -\sin\varphi\sin\lambda & \cos\varphi \\
\cos\varphi\cos\lambda & \cos\varphi\sin\lambda & \sin\varphi
\end{bmatrix}, \qquad
\mathbf{R}_{U \leftarrow N} = \begin{bmatrix} 0 & 1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & -1 \end{bmatrix} ,
$$

using $U$ for ENU. The matrix $\mathbf{R}_{U \leftarrow N}$ swaps the first two components and negates the third. Swapping two axes alone would be a reflection, determinant $-1$; negating one axis alone would be another; together they give determinant $+1$, and $\mathbf{R}_{U \leftarrow N}$ is a proper rotation — a half-turn about the horizontal axis pointing north-east. Both frames are legitimate; neither is a mirror image of the other.

The bug is in mixing them. A velocity $(v_N, v_E, v_D)$ handed to code that expects $(v_E, v_N, v_U)$ has north and east exchanged and its vertical rate reversed. For a vehicle heading $060^\circ$ at $250\,\mathrm{m/s}$ and climbing at $5\,\mathrm{m/s}$, NED gives $(125.0, 216.5, -5.0)$ and ENU gives $(216.5, 125.0, +5.0)$: the same motion, and a heading error of $30^\circ$ plus a descent instead of a climb if one is read as the other. Because both are "local-level" and both have "north" and "east" in them, the mismatch survives code review far more often than it should. The variable name must say which: `v_ned`, `v_enu`.

::: key
NED: $x$ north, $y$ east, $z$ down along the local ellipsoid normal — the aerospace default, right-handed with gravity positive. ENU: $x$ east, $y$ north, $z$ up — the geodesy and robotics default. $\mathbf{R}_{U \leftarrow N}$ swaps the first two components and negates the third; it has determinant $+1$. Mixing the two flips two axes and is a classic sign bug.
:::

::: warning
Building a local-level frame from geocentric latitude tilts it by up to $11.5'$ from the true geodetic vertical. Gravity then acquires a spurious horizontal component of $g\sin(11.5') = 0.033\,\mathrm{m/s^2}$ in the navigation equations — larger than the Coriolis term — which integrates to $59\,\mathrm{m}$ of position error in the first minute and grows quadratically. The symptom is an INS that drifts north or south at a rate that depends on latitude.
:::

::: warning
Height above the ellipsoid is not height above sea level. GNSS gives the former; maps, altimeters and runway data give the latter; they differ by the geoid undulation, which reaches tens of metres and is about $-30\,\mathrm{m}$ over Florida. A landing or terminal-guidance system needs a geoid model (EGM2008 or its successors) to convert one to the other, and the variable name should say which it holds: `h_ellipsoid`, `h_msl`.
:::

## Check yourself

::: check
Compute the geocentric latitude of a point on the WGS-84 surface at geodetic latitude $60^\circ$, and the surface distance corresponding to the difference.
:::

::: answer
$\tan\varphi' = (1 - e^2)\tan 60^\circ = 0.9933056 \times 1.7320508 = 1.7204558$, so $\varphi' = \arctan 1.7204558 = 59.833^\circ$. The difference is $0.167^\circ = 10.0'$, and along the surface $0.167 \times \pi/180 \times 6\,378\,137 \approx 18.6\,\mathrm{km}$. Smaller than at $45^\circ$, where the difference peaks at $11.5'$, and it falls to zero at $90^\circ$ where radius and normal coincide.
:::

::: check
Explain geometrically why $N(\varphi) \ge M(\varphi)$ everywhere on an oblate ellipsoid and why the two are equal at the poles.
:::

::: answer
$M$ is the radius of curvature of the meridian ellipse, which is the most tightly curved cross-section through the normal at any point of an oblate ellipsoid, because the meridian is the direction in which the surface is being squashed. $N$ is the radius of curvature of the perpendicular section, the prime vertical, which follows the more gently curved east–west direction; equivalently, $N$ is the length of the normal down to the spin axis, and that normal is longer than the osculating meridian radius because the meridian bends away faster. At the poles the surface is rotationally symmetric about the normal, every section through the normal is the same curve, and the two radii coincide at $a/\sqrt{1 - e^2} = 6\,399\,594\,\mathrm{m}$ — larger than $a$, since the flattened pole is flatter than a sphere of radius $a$.
:::

::: check
Write $\mathbf{R}_{N \leftarrow E}$ for a point on the equator at longitude $90^\circ$ east, and confirm by inspection that each row is the correct axis.
:::

::: answer
With $\varphi = 0$ and $\lambda = 90^\circ$: $\sin\varphi = 0$, $\cos\varphi = 1$, $\sin\lambda = 1$, $\cos\lambda = 0$. The matrix becomes

$$
\mathbf{R}_{N \leftarrow E} = \begin{bmatrix} 0 & 0 & 1 \\ -1 & 0 & 0 \\ 0 & -1 & 0 \end{bmatrix} .
$$

Row 1, north, is $(0, 0, 1)$: at the equator north is straight along the ECEF $z$ axis toward the pole. Row 2, east, is $(-1, 0, 0)$: at $90^\circ$ east longitude the point is on the ECEF $+y$ axis, and moving east there means moving toward $-x$. Row 3, down, is $(0, -1, 0)$: toward the centre from a point on $+y$. Each row is a unit vector, the rows are mutually perpendicular, and $\hat{\mathbf{n}} \times \hat{\mathbf{e}} = (0,0,1) \times (-1,0,0) = (0, -1, 0) = \hat{\mathbf{d}}$, confirming the right-handed order.
:::

::: check
A GNSS driver publishes velocity as an ENU triple but a downstream filter reads it as NED. The vehicle is moving due north at $10\,\mathrm{m/s}$ and descending at $1\,\mathrm{m/s}$. What velocity does the filter believe it has, and what is the consequence?
:::

::: answer
ENU for that motion is $(0, 10, -1)$: zero east, $10\,\mathrm{m/s}$ north, $-1\,\mathrm{m/s}$ up (descending). Read as NED $(v_N, v_E, v_D)$ the filter takes north $= 0$, east $= 10\,\mathrm{m/s}$, down $= -1\,\mathrm{m/s}$ — a vehicle heading due east and *climbing* at $1\,\mathrm{m/s}$. The heading is wrong by $90^\circ$ and the vertical rate is reversed. A filter fusing this with an IMU would see a persistent, structured disagreement and either reject the GNSS updates or drag the attitude estimate around trying to reconcile them; in a landing phase the reversed vertical rate is the dangerous part. The fix is a type or a name (`v_enu`) at the interface and an explicit $\mathbf{R}_{N \leftarrow U}$ where the frames meet.
:::

::: check
Why is the NED frame attached to the ellipsoid normal rather than to the direction of the position vector from the Earth's centre, given that the latter is simpler to compute?
:::

::: answer
Because the physically meaningful vertical is the direction of gravity — what a plumb line, a level, a stationary accelerometer and the water in a harbour all define — and the ellipsoid was constructed so that its normal follows that direction to within a few arcseconds almost everywhere (the residual is the deflection of the vertical). The radial direction departs from gravity by up to $11.5'$, more than two hundred times larger. A local-level frame built on the radius would have a "horizontal" plane tilted by that much: an aircraft flying level would appear to climb or descend, gravity would have a large horizontal component in the navigation equations, and every surveyed latitude on Earth, which is geodetic, would disagree with the frame. The extra computation — one square root for $N$ — is trivial next to the cost of being wrong by twenty kilometres.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $a = 6\,378\,137.0\,\mathrm{m}$, $f = 1/298.257223563$ | WGS-84 semi-major axis and flattening; $b = a(1-f) = 6\,356\,752.314\,\mathrm{m}$ |
| $e^2 = 2f - f^2 = 6.694 \times 10^{-3}$ | First eccentricity squared |
| $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$, $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$ | WGS-84 gravitational parameter and rotation rate |
| $\varphi$, $\varphi'$ | Geodetic latitude (ellipsoid normal) and geocentric latitude (radius) |
| $\tan\varphi' = (1 - e^2)\tan\varphi$ | Relation on the surface; difference peaks at $11.5'$ ($21\,\mathrm{km}$) near $45^\circ$ |
| $N = a/\sqrt{1 - e^2\sin^2\varphi}$, $M = a(1-e^2)/(1 - e^2\sin^2\varphi)^{3/2}$ | Prime-vertical and meridional radii of curvature; $M \le N$ |
| $\mathbf{r}^{E} = \left((N+h)\cos\varphi\cos\lambda,\; (N+h)\cos\varphi\sin\lambda,\; (N(1-e^2)+h)\sin\varphi\right)$ | Geodetic to ECEF; inverse by iteration |
| Ellipsoid vs geoid | $h$ above the ellipsoid (GNSS) vs height above mean sea level; undulation up to $\sim 100\,\mathrm{m}$ |
| NED | North, east, down along the geodetic normal; right-handed; gravity $(0, 0, +g)$ |
| $\mathbf{R}_{N \leftarrow E}$ | Rows: north, east, down in ECEF; equals $\mathbf{R}_2(-(\varphi + 90^\circ))\mathbf{R}_3(\lambda)$ |
| ENU, $\mathbf{R}_{U \leftarrow N}$ | East, north, up; swap first two components, negate the third; $\det = +1$ |

The next lesson leaves the ground and attaches frames to the vehicle and its orbit: body axes, the LVLH and RIC frame that follows a satellite around its orbit, the perifocal frame of the orbit itself, the topocentric frame of a ground station, and the sensor frames where measurements are actually made.
