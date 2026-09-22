---
id: l07-polar-and-spherical-coordinates
title: Polar, spherical and geodetic coordinates
minutes: 19
covers:
  - polar and spherical coordinates
---

A position is a point; the numbers you use to name it are a choice. A radar names a target by range and bearing. A launch site is named by latitude, longitude and height above sea level. An orbit names its satellite by a radius and an angle from periapsis. A navigation filter, meanwhile, wants everything as three Cartesian components in a frame fixed to the Earth, because vectors add there and nowhere else. Moving fluently between these descriptions — without losing a quadrant, without confusing two conventions that use the same letters, and without treating the Earth as a sphere when a hundred metres matters — is a daily task in guidance and navigation.

This lesson builds the conversions from the unit circle. Polar coordinates in the plane come first, then spherical coordinates in space with the latitude–longitude convention the module uses, then the Earth-fixed frame in which those angles become geodetic coordinates on the WGS-84 ellipsoid. That last step is where a spherical model is not good enough: the ellipsoid's normal does not point at the Earth's centre, and the difference — a fifth of a degree, about 21 km on the ground — is the subject of the module's first coding exercise.

Every inverse conversion here uses atan2. By the end of the lesson you should find it strange to see anything else.

## Polar coordinates in the plane

A point in the plane is fixed by its distance $r \ge 0$ from the origin and the angle $\theta$ of the line from the origin to it, measured counterclockwise from the $+x$ axis. From lesson 1, the point at distance $r$ in direction $\theta$ is the unit-circle point scaled by $r$:

$$
x = r\cos\theta, \qquad y = r\sin\theta .
$$

Going back is the atan2 problem of lesson 3:

$$
r = \sqrt{x^2 + y^2}, \qquad \theta = \operatorname{atan2}(y, x) .
$$

Polar coordinates are not unique. The angle is defined only up to whole turns, so you must state a range — atan2 gives $(-\pi, \pi]$, a bearing convention gives $[0, 2\pi)$ — and the origin has $r = 0$ and no angle at all. Some texts allow negative $r$, with $(-r, \theta)$ meaning the point at distance $r$ in direction $\theta + \pi$; flight software does not, because a sign ambiguity in $r$ is exactly the kind of thing that produces an angle wrong by $180^\circ$. Keep $r \ge 0$ and let the angle carry the direction.

Curves that are awkward in Cartesian form can be short in polar form. A circle about the origin is $r = R$. A ray is $\theta = \theta_0$. A point moving at constant angular rate is $\theta = \omega t$ with any $r(t)$. And the two-body orbit, $r = p/(1 + e\cos\nu)$, which lesson 8 develops, is a single line in polar form and a page in Cartesian form when the focus is at the origin.

::: example Radar return to Cartesian and back
A surveillance radar at the origin reports a target return at range 12.5 km and mathematical angle $215^\circ$ (counterclockwise from the $+x$ axis). Its Cartesian position is $x = 12.5\cos 215^\circ = -10.24$ km, $y = 12.5\sin 215^\circ = -7.17$ km, in the third quadrant as an angle between $180^\circ$ and $270^\circ$ requires.

A second return is delivered as Cartesian components $(x, y) = (-8.2, 5.1)$ km. Its range is $\sqrt{8.2^2 + 5.1^2} = 9.66$ km and its angle is $\operatorname{atan2}(5.1, -8.2) = 148.1^\circ$. The arctangent of the ratio, $\arctan(5.1/(-8.2)) = -31.9^\circ$, would have placed the target in the fourth quadrant, $180^\circ$ from where it is.
:::

Adding a height $z$ to polar coordinates gives **cylindrical coordinates** $(r, \theta, z)$, natural for anything with an axis of symmetry — a spinning launch vehicle, a reaction wheel, a rotating antenna. The conversions are the polar ones with $z$ passed through unchanged.

## Spherical coordinates: radius, latitude, longitude

In three dimensions a point is fixed by its distance $r$ from the origin and two angles. The module uses the geographic pair: the **latitude** $\varphi$, the angle of the position vector above the $xy$ plane (positive toward $+z$), and the **longitude** $\lambda$, the angle of the position vector's projection onto the $xy$ plane, measured counterclockwise from the $+x$ axis. Latitude runs from $-90^\circ$ to $+90^\circ$; longitude covers a full turn.

To convert to Cartesian, project first. The position vector of length $r$ at latitude $\varphi$ has a component $r\sin\varphi$ along $z$ and a projection of length $r\cos\varphi$ in the $xy$ plane — a right triangle with hypotenuse $r$ and angle $\varphi$. That projection is a plane vector of length $r\cos\varphi$ at polar angle $\lambda$, so by the polar conversion its components are $r\cos\varphi\cos\lambda$ and $r\cos\varphi\sin\lambda$:

$$
x = r\cos\varphi\cos\lambda, \qquad y = r\cos\varphi\sin\lambda, \qquad z = r\sin\varphi .
$$

At the pole, $\varphi = 90^\circ$, the projection has zero length and longitude is undefined — the three-dimensional cousin of the origin having no polar angle.

::: key Cartesian components from radius, latitude and longitude
$x = r\cos\varphi\cos\lambda$, $y = r\cos\varphi\sin\lambda$, $z = r\sin\varphi$. Divide by $r$ and these are the components of the unit vector pointing at latitude $\varphi$, longitude $\lambda$.
:::

The inverse is two atan2 calls and a square root:

$$
r = \sqrt{x^2 + y^2 + z^2}, \qquad \lambda = \operatorname{atan2}(y, x), \qquad \varphi = \operatorname{atan2}\!\left(z,\ \sqrt{x^2 + y^2}\right).
$$

Latitude could also be written $\arcsin(z/r)$, and mathematically the two agree. Numerically the atan2 form is better: it needs no clamp against $z/r$ straying past 1 by rounding, and it keeps full precision near the poles, where $\arcsin$ of a number close to 1 is poorly conditioned. Longitude *must* use atan2 — a point at $x < 0$ is on the opposite side of the planet from the arctangent's answer.

::: warning Two conventions share the letters
Physics and much of the mathematics literature use $(r, \theta, \phi)$ with $\theta$ the **colatitude**, the angle down from the $+z$ axis (so $\theta = 90^\circ - \varphi$, running from $0$ to $180^\circ$), and $\phi$ the azimuth, which is the longitude. In that convention $x = r\sin\theta\cos\phi$, $y = r\sin\theta\sin\phi$, $z = r\cos\theta$. Some engineering texts swap which letter is which. When you read a formula with spherical coordinates, find the definition of the angles before you trust a single sine or cosine in it. This module uses latitude $\varphi$ and longitude $\lambda$ throughout.
:::

### The Earth-fixed frame

The frame in which these angles are latitude and longitude in the everyday sense is **ECEF**, Earth-centred Earth-fixed. Its origin is the Earth's centre of mass. The $z$ axis points along the spin axis toward the north pole. The $x$ axis lies in the equatorial plane and passes through the prime (Greenwich) meridian. The $y$ axis completes a right-handed set, pointing through $90^\circ$ east longitude. The frame rotates with the Earth, so a fixed ground station has constant ECEF coordinates and a satellite's ECEF position traces its ground track. Longitude is positive eastward; $80.6^\circ$ west is $\lambda = -80.6^\circ$.

::: example A launch site in ECEF, spherical Earth
Cape Canaveral is at latitude $28.5^\circ$ N, longitude $80.6^\circ$ W. On a sphere of radius $R = 6371$ km its ECEF position is

$$
\begin{aligned}
x &= 6371\cos 28.5^\circ\cos(-80.6^\circ) = 6371 \times 0.8788 \times 0.1633 = 914.5\ \mathrm{km}, \\
y &= 6371\cos 28.5^\circ\sin(-80.6^\circ) = 6371 \times 0.8788 \times (-0.9866) = -5523.8\ \mathrm{km}, \\
z &= 6371\sin 28.5^\circ = 3040.0\ \mathrm{km}.
\end{aligned}
$$

The $y$ component is negative because the site is in the western hemisphere. Reversing: $\sqrt{x^2 + y^2 + z^2} = 6371$ km, $\lambda = \operatorname{atan2}(-5523.8, 914.5) = -80.6^\circ$, and $\varphi = \operatorname{atan2}(3040.0, \sqrt{914.5^2 + 5523.8^2}) = \operatorname{atan2}(3040.0, 5599.0) = 28.5^\circ$.
:::

### Distance along the sphere

The angle between two points on a sphere, seen from the centre, is the angle between their unit position vectors, whose cosine is their dot product. Multiply out the components from the key formula for latitudes $\varphi_1, \varphi_2$ and longitudes $\lambda_1, \lambda_2$:

$$
\cos c = \cos\varphi_1\cos\varphi_2(\cos\lambda_1\cos\lambda_2 + \sin\lambda_1\sin\lambda_2) + \sin\varphi_1\sin\varphi_2 = \sin\varphi_1\sin\varphi_2 + \cos\varphi_1\cos\varphi_2\cos(\lambda_2 - \lambda_1),
$$

using the cosine difference formula of lesson 4 on the bracket. This is the **spherical law of cosines**, and the great-circle distance is $R\,c$ with $c$ in radians. Between Cape Canaveral ($28.5^\circ$ N, $80.6^\circ$ W) and Kourou ($5.24^\circ$ N, $52.77^\circ$ W): $\cos c = \sin 28.5^\circ\sin 5.24^\circ + \cos 28.5^\circ\cos 5.24^\circ\cos 27.83^\circ = 0.8175$, $c = 35.16^\circ = 0.6137$ rad, and the distance is $6371 \times 0.6137 = 3910$ km. For points very close together $\cos c$ is near 1 and the arccosine loses precision; navigation code then uses an equivalent atan2 form (the haversine formula) for the same reason latitude used atan2 above.

## The ellipsoid: geodetic coordinates

The Earth is not a sphere. Rotation flattens it: the polar radius is about 21 km shorter than the equatorial radius. Every GPS receiver, map and launch-site survey therefore refers positions to a reference **ellipsoid**, and the standard one is **WGS-84**, defined by its semi-major (equatorial) axis $a$ and its flattening $f$:

$$
a = 6\,378\,137.0\ \mathrm{m}, \qquad f = \frac{a - b}{a} = \frac{1}{298.257223563},
$$

from which the semi-minor (polar) axis is $b = a(1 - f) = 6\,356\,752.3$ m and the first eccentricity squared is $e^2 = f(2 - f) = 0.00669438$ (so $e = 0.0818$). The ellipsoid is the surface of revolution obtained by spinning the meridian ellipse $x^2/a^2 + z^2/b^2 = 1$ about the $z$ axis; every meridian section is that same ellipse.

### Geocentric versus geodetic latitude

On a sphere the local vertical — the direction a plumb line hangs, the normal to the surface — points at the centre, so the latitude of a point as an angle at the centre equals the angle of its vertical above the equator. On an ellipsoid the two differ:

- **Geocentric latitude** $\varphi_c$ is the angle between the equatorial plane and the line from the Earth's centre to the point. It is the spherical-coordinate latitude of the ECEF vector, $\operatorname{atan2}(z, \sqrt{x^2 + y^2})$.
- **Geodetic latitude** $\varphi$ is the angle between the equatorial plane and the normal to the ellipsoid at the point. It is what maps, GPS and every launch-site coordinate mean by "latitude".

To relate them, take a point $(x, z)$ on the meridian ellipse (with the $x$ axis here standing for the equatorial direction through the point). The normal to a curve $F(x, z) = 0$ is along the gradient of $F$; for $F = x^2/a^2 + z^2/b^2 - 1$ that is $(2x/a^2, 2z/b^2)$, so the normal makes an angle with the equator whose tangent is $(z/b^2)/(x/a^2)$. The geocentric direction has tangent $z/x$. Hence

$$
\tan\varphi = \frac{a^2}{b^2}\,\frac{z}{x} = \frac{\tan\varphi_c}{1 - e^2}, \qquad \text{that is} \qquad \tan\varphi_c = (1 - e^2)\tan\varphi ,
$$

using $b^2 = a^2(1 - e^2)$. Because $1 - e^2 < 1$, the geocentric latitude is always the smaller of the two (in magnitude), and the two coincide only at the equator and the poles, where the tangent is $0$ or infinite. The difference is largest near $45^\circ$: there $\tan\varphi_c = 0.99331$, $\varphi_c = 44.8076^\circ$, and $\varphi - \varphi_c = 0.1924^\circ = 11.5$ arcminutes. Along the surface that is $0.1924 \times \pi/180 \times 6371 \approx 21$ km. At $30^\circ$ and $60^\circ$ the gap is about $10.0'$; at $15^\circ$ and $75^\circ$ about $5.8'$.

::: key Geodetic vs geocentric latitude
Geocentric latitude is the angle at the Earth's centre to the point; geodetic latitude is the angle of the local ellipsoid normal. On WGS-84 they are related on the surface by $\tan\varphi_c = (1 - e^2)\tan\varphi$ and differ by up to about $0.19^\circ$ ($\approx 11.5$ arcmin) near $45^\circ$.
:::

::: warning Which latitude a number is
A latitude handed to you without qualification is geodetic. Feeding it into the spherical formulas as if it were geocentric misplaces the point by up to 21 km on the ground — a small fraction of an orbit, but the entire width of a launch range, and thousands of times a GPS receiver's precision. Above the surface the relation between the two latitudes also depends on height, so the simple tangent formula applies only to points on the ellipsoid.
:::

### From geodetic coordinates to ECEF

Geodetic coordinates are $(\varphi, \lambda, h)$: geodetic latitude, longitude, and height $h$ measured along the ellipsoid normal. Longitude is unchanged from the spherical case, since the ellipsoid is symmetric about $z$. The task is to find where the normal at $(\varphi, \lambda)$ meets the surface and then move $h$ along it.

Start in the meridian plane. A point on the ellipse satisfies $x^2/a^2 + z^2/b^2 = 1$ and, from the normal relation, $z = (b^2/a^2)\,x\tan\varphi = (1 - e^2)\,x\tan\varphi$. Substitute the second into the first:

$$
\frac{x^2}{a^2}\left[1 + \frac{(1 - e^2)^2\tan^2\varphi}{1 - e^2}\right] = 1 \quad\Longrightarrow\quad x^2 = \frac{a^2\cos^2\varphi}{\cos^2\varphi + (1 - e^2)\sin^2\varphi} = \frac{a^2\cos^2\varphi}{1 - e^2\sin^2\varphi} ,
$$

after multiplying top and bottom by $\cos^2\varphi$ and using $\cos^2 + \sin^2 = 1$. Define the **prime-vertical radius of curvature**

$$
N(\varphi) = \frac{a}{\sqrt{1 - e^2\sin^2\varphi}} ,
$$

so that the surface point is $x = N\cos\varphi$ and $z = (1 - e^2)N\sin\varphi$. $N$ runs from $a$ at the equator to $a/\sqrt{1 - e^2} = 6399.6$ km at the pole; it is the distance along the normal from the surface to the $z$ axis, and $(1 - e^2)N\sin\varphi$ at the pole correctly gives $b$. The unit normal itself has components $(\cos\varphi\cos\lambda, \cos\varphi\sin\lambda, \sin\varphi)$ — the same expression as the unit vector at spherical latitude $\varphi$, which is what makes geodetic latitude the natural angle to define it by. Adding $h$ along the normal and restoring longitude:

$$
\begin{aligned}
x &= (N + h)\cos\varphi\cos\lambda, \\
y &= (N + h)\cos\varphi\sin\lambda, \\
z &= \left[N(1 - e^2) + h\right]\sin\varphi .
\end{aligned}
$$

Compare with the spherical formula: the horizontal components use $N + h$ where the sphere used $r$, and the vertical component uses $N(1 - e^2) + h$. The factor $1 - e^2$ on the $z$ term is the whole difference between a sphere and the ellipsoid.

::: example Geodetic to ECEF on WGS-84
A surveyed point has geodetic latitude $45^\circ$, longitude $0^\circ$ and height $0$. Then $\sin^2 45^\circ = 0.5$ and $N = 6\,378\,137/\sqrt{1 - 0.00669438 \times 0.5} = 6\,388\,838.3$ m. The ECEF coordinates are $x = N\cos 45^\circ = 4\,517\,590.9$ m, $y = 0$, $z = N(1 - e^2)\sin 45^\circ = 6\,388\,838.3 \times 0.99330562 \times 0.70711 = 4\,487\,348.4$ m. The point's distance from the centre is $\sqrt{x^2 + z^2} = 6\,367\,489.5$ m — 10.6 km less than $a$ — and its geocentric latitude is $\operatorname{atan2}(4\,487\,348.4,\ 4\,517\,590.9) = 44.8076^\circ$, the $11.5'$ short of $45^\circ$ derived above.

Now a point beneath the ISS: geodetic latitude $51.6^\circ$, longitude $0^\circ$, height $420$ km. $N = 6\,378\,137/\sqrt{1 - 0.00669438\sin^2 51.6^\circ} = 6\,391$ km to the nearest kilometre; $x = (N + h)\cos 51.6^\circ = 4\,230\,817$ m, $z = [N(1 - e^2) + h]\sin 51.6^\circ = 5\,304\,432$ m. The geocentric latitude of this point is $51.42^\circ$, and a naive "altitude" computed as $\sqrt{x^2 + z^2} - 6371\ \mathrm{km} = 414$ km is 6 km off the true 420 km. Six kilometres is the sort of error that puts a re-entry footprint in the wrong county.
:::

### From ECEF back to geodetic

Longitude is immediate, $\lambda = \operatorname{atan2}(y, x)$. Latitude and height are coupled: $\varphi$ appears inside $N$, and $h$ appears alongside it. Let $\rho = \sqrt{x^2 + y^2}$ be the distance from the spin axis. From the forward equations, $\rho = (N + h)\cos\varphi$ and $z = (N + h)\sin\varphi - e^2 N\sin\varphi$, so

$$
\tan\varphi = \frac{z + e^2 N\sin\varphi}{\rho} .
$$

The unknown $\varphi$ appears on both sides, but the correction term $e^2 N\sin\varphi$ is small — $e^2$ is under 0.7% — which makes a **fixed-point iteration** converge fast. Start with the geocentric latitude $\varphi_0 = \operatorname{atan2}(z, \rho)$; compute $N(\varphi_0)$ and a corrected $\varphi_1 = \operatorname{atan2}(z + e^2 N\sin\varphi_0, \rho)$; repeat. Each pass reduces the error by roughly a factor of $e^2$, so three or four passes reach a millimetre. Then the height is $h = \rho/\cos\varphi - N$, or, near the poles where $\cos\varphi \to 0$, $h = z/\sin\varphi - N(1 - e^2)$.

```python
import math

A = 6378137.0
F = 1.0 / 298.257223563
E2 = F * (2.0 - F)

def ecef_to_geodetic(x, y, z, iters=5):
    lon = math.atan2(y, x)
    rho = math.hypot(x, y)
    lat = math.atan2(z, rho)              # start from geocentric latitude
    for _ in range(iters):
        N = A / math.sqrt(1.0 - E2 * math.sin(lat) ** 2)
        lat = math.atan2(z + E2 * N * math.sin(lat), rho)
    N = A / math.sqrt(1.0 - E2 * math.sin(lat) ** 2)
    h = rho / math.cos(lat) - N if abs(lat) < 1.4 else z / math.sin(lat) - N * (1.0 - E2)
    return lat, lon, h

lat, lon, h = ecef_to_geodetic(4517590.879, 0.0, 4487348.409)
print(math.degrees(lat), math.degrees(lon), h)   # 45.0  0.0  ~0.0
```

The alternative is Bowring's closed-form approximation, which reaches a similar accuracy in one step with a cleverly chosen starting angle. Either is acceptable in practice; the iteration is easier to verify by reading, the closed form is faster. What is not acceptable is the spherical shortcut $\varphi = \operatorname{atan2}(z, \rho)$, $h = r - a$, which is what you get after zero iterations and is wrong by up to $11.5'$ in latitude and tens of kilometres in height.

## Check yourself

::: check
A point has ECEF coordinates $x = y = z = 4000$ km. Find its distance from the centre, its longitude and its geocentric latitude.
:::

::: answer
$r = 4000\sqrt{3} = 6928$ km. $\lambda = \operatorname{atan2}(4000, 4000) = 45^\circ$ E. The distance from the spin axis is $\rho = 4000\sqrt 2 = 5657$ km, so $\varphi_c = \operatorname{atan2}(4000, 5657) = 35.26^\circ$ N. Note that the latitude is not $45^\circ$: equal $z$ and $\rho$ would need $z = 5657$ km.
:::

::: check
Vandenberg is at $34.7^\circ$ N, $120.6^\circ$ W. Write its ECEF position on a sphere of radius 6371 km and state the sign of each component before computing it.
:::

::: answer
Western hemisphere beyond $90^\circ$ W means $\cos\lambda < 0$ and $\sin\lambda < 0$, so both $x$ and $y$ are negative; northern latitude makes $z$ positive. $\cos 34.7^\circ = 0.8221$, giving a projection of $6371 \times 0.8221 = 5238$ km; then $x = 5238\cos(-120.6^\circ) = -2666$ km, $y = 5238\sin(-120.6^\circ) = -4508$ km, $z = 6371\sin 34.7^\circ = 3627$ km.
:::

::: check
Two GPS satellites are both at radius 26 560 km, one above ($30^\circ$ N, $10^\circ$ E) and the other above ($30^\circ$ N, $100^\circ$ E). Find the angle between their position vectors and the straight-line distance between them.
:::

::: answer
Spherical law of cosines with $\Delta\lambda = 90^\circ$: $\cos c = \sin^2 30^\circ + \cos^2 30^\circ\cos 90^\circ = 0.25$, so $c = 75.52^\circ$. The chord, from lesson 5, is $2 \times 26\,560\sin(75.52^\circ/2) = 32\,530$ km. The angle is not $90^\circ$ even though the longitudes differ by $90^\circ$, because both points sit at $30^\circ$ latitude and the parallel of latitude is a smaller circle than the equator.
:::

::: check
By how much do geodetic and geocentric latitude differ at $30^\circ$ geodetic latitude on WGS-84, and in which direction?
:::

::: answer
$\tan\varphi_c = (1 - 0.00669438)\tan 30^\circ = 0.99330562 \times 0.57735 = 0.57349$, so $\varphi_c = 29.834^\circ$. The geocentric latitude is smaller by $0.166^\circ = 10.0$ arcminutes. It is always smaller in magnitude: the ellipsoid normal is tilted away from the equator relative to the line to the centre.
:::

::: check
A colleague's code computes geodetic height as $h = \rho/\cos\varphi - N$. In what situation does this fail, and what should be used instead?
:::

::: answer
As $\varphi \to \pm 90^\circ$, $\cos\varphi \to 0$ and $\rho \to 0$; the quotient becomes a ratio of two tiny numbers and its rounding error grows without bound, and exactly at the pole it divides by zero. Use the $z$ equation instead, $h = z/\sin\varphi - N(1 - e^2)$, whenever $|\varphi|$ is large — say above $80^\circ$ — and the $\rho$ equation elsewhere. Either equation is exact; they differ only in conditioning, the same way $\operatorname{atan2}(z, \rho)$ beats $\arcsin(z/r)$ for latitude.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $x = r\cos\theta$, $y = r\sin\theta$ | Polar to Cartesian |
| $r = \sqrt{x^2 + y^2}$, $\theta = \operatorname{atan2}(y, x)$ | Cartesian to polar; keep $r \ge 0$ |
| $x = r\cos\varphi\cos\lambda$, $y = r\cos\varphi\sin\lambda$, $z = r\sin\varphi$ | Spherical (latitude $\varphi$, longitude $\lambda$) to Cartesian |
| $\lambda = \operatorname{atan2}(y, x)$, $\varphi = \operatorname{atan2}(z, \sqrt{x^2 + y^2})$ | Cartesian to spherical |
| Colatitude $\theta = 90^\circ - \varphi$ | Physics convention; check definitions before using a formula |
| ECEF | Origin at Earth's centre; $z$ along spin axis; $x$ through Greenwich meridian; rotates with Earth |
| $\cos c = \sin\varphi_1\sin\varphi_2 + \cos\varphi_1\cos\varphi_2\cos\Delta\lambda$ | Spherical law of cosines; great-circle distance $Rc$ |
| $a = 6\,378\,137$ m, $f = 1/298.257223563$ | WGS-84; $b = a(1-f)$, $e^2 = f(2-f) = 0.00669438$ |
| $\tan\varphi_c = (1 - e^2)\tan\varphi$ | Geocentric from geodetic latitude on the surface; max gap $\approx 11.5'$ at $45^\circ$ |
| $N = a/\sqrt{1 - e^2\sin^2\varphi}$ | Prime-vertical radius of curvature |
| $x = (N+h)\cos\varphi\cos\lambda$, $y = (N+h)\cos\varphi\sin\lambda$, $z = [N(1-e^2)+h]\sin\varphi$ | Geodetic to ECEF |
| $\tan\varphi = (z + e^2N\sin\varphi)/\rho$ | Iterate for geodetic latitude from ECEF; then $h = \rho/\cos\varphi - N$ |

The next lesson takes the polar description one step further: the curves $r = p/(1 + e\cos\nu)$ are the conic sections, and every orbit of one body about another is one of them.
