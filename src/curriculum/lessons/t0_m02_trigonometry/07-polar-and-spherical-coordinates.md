---
id: l07-polar-and-spherical-coordinates
title: Polar, spherical and geodetic coordinates
minutes: 24
covers:
  - polar and spherical coordinates
---

A pirate's treasure map does not say "go to grid square $(3, 4)$". It says "from the old oak, face the hill and walk fifty paces". That is a distance and a direction. A radar screen works the same way: a blip is so many kilometers away, at such an angle. A globe does it in three dimensions, with latitude and longitude.

The place is the same whatever numbers you use to name it; the numbers are a choice. A launch site is named by latitude, longitude and height. An orbit names its satellite by a distance and an angle. But a navigation computer wants three ordinary components — $x$, $y$, $z$ — in a frame fixed to the Earth, because that is where arrows add up nicely. So guidance engineers switch between these descriptions every day. The traps: losing a quadrant, mixing up two conventions that share Greek letters, and treating the Earth as a perfect ball when a hundred meters matters.

This lesson builds every conversion from the unit circle: flat **polar coordinates**, then **spherical coordinates** on a globe, then the real, slightly squashed Earth, where latitude means something subtler than you think. Every conversion *back* uses atan2.

## Polar coordinates: how far, and which way

Picture a radar screen with the antenna in the middle. A blip shows up. You can describe it two ways:

- "It is $10$ km east and $7$ km north of me" — two distances along two fixed directions. Those are **Cartesian coordinates** $(x, y)$, the grid you already know.
- "It is $12.2$ km away, at an angle of $35^\circ$ up from east" — one distance and one angle. Those are **polar coordinates** $(r, \theta)$.

In polar coordinates, $r$ is the distance from the origin, and it is never negative: $r \ge 0$. The angle $\theta$ ("theta") is measured from the $+x$ axis, turning **counterclockwise**, exactly as on the unit circle. So every point has [[two addresses|polar-picture]]: a grid one and a polar one.

### From polar to Cartesian

On the unit circle, the point at angle $\theta$ is $(\cos\theta, \sin\theta)$. A point at distance $r$ is the same direction, stretched $r$ times. So

$$
x = r\cos\theta, \qquad y = r\sin\theta .
$$

### From Cartesian to polar

The distance is the Pythagorean theorem. The angle is the atan2 problem from earlier in the module:

$$
r = \sqrt{x^2 + y^2}, \qquad \theta = \operatorname{atan2}(y, x) .
$$

Read $\operatorname{atan2}(y, x)$ aloud as "a-tan-two of y comma x". It looks at the signs of *both* $x$ and $y$, so it knows the quadrant. The plain arctangent of $y/x$ sees only the ratio, and [[a ratio cannot tell a point from its opposite|atan-forgets]].

::: key Polar coordinates
$x = r\cos\theta$, $y = r\sin\theta$; and back, $r = \sqrt{x^2 + y^2}$, $\theta = \operatorname{atan2}(y, x)$, with $r \ge 0$.
:::

### The small print

Polar coordinates are not unique, and that matters in code.

- **The angle repeats.** $30^\circ$ and $390^\circ$ point the same way. So you must say which range you use. atan2 gives $(-\pi, \pi]$, that is, $-180^\circ$ up to and including $180^\circ$. A compass-bearing convention uses $[0, 2\pi)$, that is, $0^\circ$ up to but not including $360^\circ$.
- **The origin has no angle.** At $r = 0$ you are standing on the center. Every direction is equally right, so no direction is.
- **Negative $r$ is banned here.** Some math books let $(-r, \theta)$ mean "distance $r$ in the direction $\theta + \pi$". Flight software does not. A sign mix-up in $r$ is exactly the kind of bug that turns an angle $180^\circ$ around. Keep $r \ge 0$ and let the angle carry the direction.

### Curves that are short in polar form

Some shapes are tiny in polar form. A circle around the origin is $r = R$. A straight ray out from the origin is $\theta = \theta_0$. Something turning at a steady rate is $\theta = \omega t$ ("omega t"), whatever $r$ does. And the orbit of a satellite, with the planet at the origin, is the one line $r = p/(1 + e\cos\nu)$ — the whole subject of the next lesson. In $x$ and $y$ it takes half a page.

::: example Radar return to Cartesian and back
A surveillance radar at the origin reports a target at range $12.5$ km and angle $215^\circ$, measured counterclockwise from the $+x$ axis.

**To Cartesian.** Multiply the range by the cosine and the sine of the angle:

$$
x = 12.5\cos 215^\circ = -10.24\ \mathrm{km}, \qquad y = 12.5\sin 215^\circ = -7.17\ \mathrm{km}.
$$

Both are negative. That puts the target in the third quadrant, which is right for an angle between $180^\circ$ and $270^\circ$.

**Back to polar.** A second target arrives as components $(x, y) = (-8.2, 5.1)$ km. Its range is

$$
r = \sqrt{8.2^2 + 5.1^2} = 9.66\ \mathrm{km},
$$

and its angle is $\operatorname{atan2}(5.1, -8.2) = 148.1^\circ$. Sanity check: $x$ negative and $y$ positive is the second quadrant, between $90^\circ$ and $180^\circ$. Good.

**The trap.** The plain arctangent of the ratio gives $\arctan(5.1/(-8.2)) = -31.9^\circ$. That is the fourth quadrant — the wrong side of the radar, exactly $180^\circ$ from the real target.
:::

### Adding a height: cylindrical coordinates

Add a height $z$ to polar coordinates and you get **cylindrical coordinates** $(r, \theta, z)$ — a point on a soda can: how far from the center line, which way around, how high. They suit anything with a spin axis: a spinning rocket, a reaction wheel, a rotating antenna. The conversions are the polar ones, with $z$ passed through unchanged.

## Spherical coordinates: a point on a globe

Spin a globe and put your finger on a city. Three numbers pin it down:

- how far it is from the center of the globe — the **radius** $r$;
- how far north or south of the equator it is, as an angle — the **latitude** $\varphi$ ("phi");
- how far east or west of a chosen starting line it is, as an angle — the **longitude** $\lambda$ ("lambda").

Here are the precise definitions this module uses. The latitude $\varphi$ is the angle between the position arrow (from the center to the point) and the flat $xy$ plane (the equator's plane), positive toward $+z$ (north). It runs from $-90^\circ$ to $+90^\circ$. The longitude $\lambda$ is the angle of the arrow's **shadow** on the $xy$ plane, measured counterclockwise from the $+x$ axis. It covers a full turn.

### From spherical to Cartesian: project first

Imagine the sun directly overhead, above the north pole, so the position arrow casts a shadow straight down onto the equator's plane. Split the arrow into two pieces.

1. **Up and across.** The arrow, its shadow and a vertical drop line make a right triangle. The hypotenuse is $r$ and the angle at the center is $\varphi$. So the height is $z = r\sin\varphi$, and the shadow has length $r\cos\varphi$.
2. **Around.** The shadow is a flat arrow of length $r\cos\varphi$ at angle $\lambda$. That is a polar-coordinates problem. Its components are $r\cos\varphi\cos\lambda$ and $r\cos\varphi\sin\lambda$.

Put the [[two triangles|spherical-picture]] together:

$$
x = r\cos\varphi\cos\lambda, \qquad y = r\cos\varphi\sin\lambda, \qquad z = r\sin\varphi .
$$

At the pole, $\varphi = 90^\circ$, the shadow has zero length, so the longitude is undefined. It is the 3D version of the origin having no angle: at the North Pole, every direction is south.

::: key Cartesian components from radius, latitude and longitude
$x = r\cos\varphi\cos\lambda$, $y = r\cos\varphi\sin\lambda$, $z = r\sin\varphi$. Divide by $r$ and these are the components of the unit vector pointing at latitude $\varphi$, longitude $\lambda$.
:::

### From Cartesian back to spherical

Undo it with a square root and two atan2 calls:

$$
r = \sqrt{x^2 + y^2 + z^2}, \qquad \lambda = \operatorname{atan2}(y, x), \qquad \varphi = \operatorname{atan2}\!\left(z,\ \sqrt{x^2 + y^2}\right).
$$

The $\sqrt{x^2 + y^2}$ in the latitude is the shadow's length.

You could also write the latitude as $\arcsin(z/r)$. On paper the two agree. In a computer atan2 is better. Rounding can push $z/r$ a hair past $1$, and $\arcsin$ then fails. And near the poles, where $z/r$ is close to $1$, a tiny error in $z/r$ becomes a big error in the arcsine. atan2 keeps full precision everywhere.

Longitude *must* use atan2: for $x < 0$ the arctangent answers with the far side of the planet.

::: warning Two conventions share the letters
Physics books and much of mathematics use $(r, \theta, \phi)$, where $\theta$ is the **colatitude** — the angle *down from the north pole*, so $\theta = 90^\circ - \varphi$, running from $0$ to $180^\circ$ — and $\phi$ is the azimuth, which is the longitude. In that convention $x = r\sin\theta\cos\phi$, $y = r\sin\theta\sin\phi$, $z = r\cos\theta$. Some engineering texts swap which letter is which. So whenever you meet a spherical-coordinate formula, find how its angles are defined before you trust a single sine or cosine. This module uses latitude $\varphi$ and longitude $\lambda$ throughout.
:::

### The Earth-fixed frame

To make latitude and longitude mean what they mean on a map, you need to nail the $x$, $y$, $z$ axes to the Earth. The standard choice is **ECEF**, short for "Earth-centered, Earth-fixed":

- the origin is the Earth's center of mass;
- the $z$ axis points along the spin axis, toward the North Pole;
- the $x$ axis lies in the equator's plane and passes through the **[[prime meridian|greenwich]]** at Greenwich, London (longitude $0$);
- the $y$ axis completes a right-handed set, pointing through longitude $90^\circ$ east.

The frame [[turns with the Earth|ecef-turns]], so a ground station has fixed ECEF coordinates and a satellite's ECEF position traces its ground track. Longitude is positive going east. So $80.6^\circ$ west is $\lambda = -80.6^\circ$.

::: example A launch site in ECEF, spherical Earth
Cape Canaveral is at latitude $28.5^\circ$ N, longitude $80.6^\circ$ W, so $\varphi = 28.5^\circ$ and $\lambda = -80.6^\circ$. Treat the Earth as a ball of radius $R = 6371$ km for now.

**Step 1, the pieces.** $\cos 28.5^\circ = 0.8788$, $\cos(-80.6^\circ) = 0.1633$, $\sin(-80.6^\circ) = -0.9866$, and $\sin 28.5^\circ = 0.4772$.

**Step 2, multiply out.**

$$
\begin{aligned}
x &= 6371 \times 0.8788 \times 0.1633 = 914.5\ \mathrm{km}, \\
y &= 6371 \times 0.8788 \times (-0.9866) = -5523.8\ \mathrm{km}, \\
z &= 6371 \times 0.4772 = 3040.0\ \mathrm{km}.
\end{aligned}
$$

**Step 3, make sense of the signs.** $y$ is negative because the site is west of Greenwich, $z$ positive because it is north of the equator.

**Step 4, go back and check.** $\sqrt{x^2 + y^2 + z^2} = 6371$ km. $\lambda = \operatorname{atan2}(-5523.8, 914.5) = -80.6^\circ$. The shadow length is $\sqrt{914.5^2 + 5523.8^2} = 5599.0$ km, so $\varphi = \operatorname{atan2}(3040.0, 5599.0) = 28.5^\circ$. We got back what we put in.
:::

### Distance along the sphere

How far apart are two places on the globe? Stretch a string between them on the surface, pulled tight. It follows a **[[great circle|great-circle]]** — a circle whose center is the center of the Earth. Its length is $R\,c$, where $c$ is the angle between the two places *as seen from the center*, in radians.

To find $c$, use the **dot product**: multiply two arrows' matching components and add. For two unit vectors (arrows of length $1$) that sum is the cosine of the angle between them. Do it with the key formula's unit vectors and tidy up, and you get the **spherical law of cosines**:

$$
\cos c = \sin\varphi_1\sin\varphi_2 + \cos\varphi_1\cos\varphi_2\cos(\lambda_2 - \lambda_1).
$$

::: note Why it has to be true
The unit vectors are $(\cos\varphi_1\cos\lambda_1, \cos\varphi_1\sin\lambda_1, \sin\varphi_1)$ and the same with subscript $2$. Their dot product is

$$
\cos c = \cos\varphi_1\cos\varphi_2(\cos\lambda_1\cos\lambda_2 + \sin\lambda_1\sin\lambda_2) + \sin\varphi_1\sin\varphi_2 .
$$

The bracket is the cosine difference formula from the identities lesson, $\cos(\lambda_2 - \lambda_1)$. Swap it in and you have the law.
:::

From Cape Canaveral ($28.5^\circ$ N, $80.6^\circ$ W) to the European launch site at Kourou ($5.24^\circ$ N, $52.77^\circ$ W) the longitudes differ by $27.83^\circ$:

$$
\cos c = \sin 28.5^\circ\sin 5.24^\circ + \cos 28.5^\circ\cos 5.24^\circ\cos 27.83^\circ = 0.8175 .
$$

So $c = 35.16^\circ = 0.6137$ rad, and the distance is $6371 \times 0.6137 = 3910$ km.

One caution for code. For two points very close together, $\cos c$ is almost exactly $1$, and the arccosine loses precision — the arcsine's problem near the poles again. Navigation code then uses an equivalent atan2 form, the **haversine formula**.

## The real Earth is a little squashed

Spin a ball of pizza dough and it spreads out at the middle. The Earth spins too, and its rotation has made it [[bulge at the equator|why-flattened]]. The pole is about $21$ km closer to the center than the equator is. That is only a third of a percent — invisible in a photo — but GPS measures positions to within a few meters, so it matters enormously.

So every GPS receiver, map and launch-site survey uses a squashed ball called a reference **ellipsoid**. Slice it through both poles and the cut edge is an ellipse — a stretched circle. The standard one is **[[WGS-84|wgs84]]**. It is fixed by two numbers: the equator radius $a$ (the **semi-major axis**) and the **flattening** $f$, which says how squashed it is:

$$
a = 6\,378\,137.0\ \mathrm{m}, \qquad f = \frac{a - b}{a} = \frac{1}{298.257223563}.
$$

Here $b$ is the pole radius (the **semi-minor axis**). From these two numbers come two more:

$$
b = a(1 - f) = 6\,356\,752.3\ \mathrm{m}, \qquad e^2 = f(2 - f) = 0.00669438 .
$$

$e^2$ ("e squared") is the **first eccentricity squared**, a second way to say how squashed; $e = 0.0818$. The ellipsoid is what you get by spinning the ellipse $x^2/a^2 + z^2/b^2 = 1$ around the $z$ axis. Every north–south slice through the poles is that same ellipse.

### Two kinds of latitude

On a perfect ball, a **[[plumb line|plumb-line]]** — a weight hanging on a string — points straight at the center. So "the angle at the center" and "the angle of straight up" are the same latitude. On a squashed Earth they come apart:

- **Geocentric latitude** $\varphi_c$ ("phi sub c") is the angle between the equator's plane and the line from the Earth's center to the point. It is the spherical latitude of the ECEF vector, $\operatorname{atan2}(z, \sqrt{x^2 + y^2})$.
- **Geodetic latitude** $\varphi$ is the angle between the equator's plane and the line **normal** (perpendicular) to the ellipsoid at the point — the local "straight up". This is what maps, GPS and every launch-site coordinate mean by "latitude".

They differ because on a squashed ellipse, [["straight up" does not point back through the center|two-latitudes]]. The rule that connects them is

$$
\tan\varphi_c = (1 - e^2)\tan\varphi .
$$

::: note Why it has to be true
Work in a north–south slice. Let $x$ stand for the distance from the spin axis and $z$ for the height above the equator, so a surface point satisfies $F(x, z) = x^2/a^2 + z^2/b^2 - 1 = 0$. The direction perpendicular to a curve $F = 0$ is the direction of its **gradient**, the arrow of how fast $F$ grows along $x$ and along $z$: here $(2x/a^2,\ 2z/b^2)$. So the normal's angle has tangent $(z/b^2)/(x/a^2)$. The line to the center has tangent $z/x$. Therefore

$$
\tan\varphi = \frac{a^2}{b^2}\,\frac{z}{x} = \frac{\tan\varphi_c}{1 - e^2},
$$

using $b^2 = a^2(1 - e^2)$. Multiply across and you have the rule.
:::

What the rule tells you:

- $1 - e^2$ is a little less than $1$, so the geocentric latitude is always the smaller of the two (in size).
- They agree at the equator and at the poles, where the tangent is $0$ or infinite.
- The gap is biggest near $45^\circ$. There $\tan\varphi_c = 0.99331$, so $\varphi_c = 44.8076^\circ$, and the difference is $0.1924^\circ$, or $11.5$ **[[arcminutes|arcminute]]**. Along the ground that is $0.1924 \times \pi/180 \times 6371 \approx 21$ km.
- At $30^\circ$ and $60^\circ$ the gap is about $10.0'$; at $15^\circ$ and $75^\circ$, about $5.8'$. (The little mark $'$ means arcminutes.)

::: key Geodetic vs geocentric latitude
Geocentric latitude is the angle at the Earth's center to the point; geodetic latitude is the angle of the local ellipsoid normal. On WGS-84 they are related on the surface by $\tan\varphi_c = (1 - e^2)\tan\varphi$ and differ by up to about $0.19^\circ$ ($\approx 11.5$ arcmin) near $45^\circ$.
:::

::: warning Which latitude is this number?
A latitude handed to you with no label is geodetic. If you feed it into the spherical formulas as though it were geocentric, you misplace the point by up to $21$ km on the ground. That is a tiny slice of an orbit, but it is the whole width of a launch range, and thousands of times a GPS receiver's precision. One more catch: above the surface, the link between the two latitudes also depends on height, so the simple tangent rule works only for points *on* the ellipsoid.
:::

### From geodetic coordinates to ECEF

A position on the real Earth is given as **geodetic coordinates** $(\varphi, \lambda, h)$: geodetic latitude, longitude, and height $h$ measured along the normal. Longitude works exactly as on the ball, because the ellipsoid is perfectly round seen from above the pole. The job is to find where the normal at $(\varphi, \lambda)$ meets the surface, then climb $h$ along it.

The answer uses one new helper quantity, the **prime-vertical radius of curvature**:

$$
N(\varphi) = \frac{a}{\sqrt{1 - e^2\sin^2\varphi}} .
$$

Think of $N$ as "the length of the normal line from the surface down to the spin axis". It runs from $a$ at the equator up to $a/\sqrt{1 - e^2} = 6399.6$ km at the pole. With it, the surface point is $x = N\cos\varphi$, $z = (1 - e^2)N\sin\varphi$ in the north–south slice. Climb $h$ along the normal and swing around to longitude $\lambda$:

$$
\begin{aligned}
x &= (N + h)\cos\varphi\cos\lambda, \\
y &= (N + h)\cos\varphi\sin\lambda, \\
z &= \left[N(1 - e^2) + h\right]\sin\varphi .
\end{aligned}
$$

Compare with the ball formula: the sideways components use $N + h$ where the ball used $r$, and the up component uses $N(1 - e^2) + h$. That factor $1 - e^2$ on the $z$ term is the whole difference between a sphere and the ellipsoid.

::: note Why it has to be true
In the slice, a surface point satisfies the ellipse $x^2/a^2 + z^2/b^2 = 1$, and from the latitude rule its normal gives $z = (b^2/a^2)\,x\tan\varphi = (1 - e^2)\,x\tan\varphi$. Put the second into the first:

$$
\frac{x^2}{a^2}\left[1 + \frac{(1 - e^2)^2\tan^2\varphi}{1 - e^2}\right] = 1 \quad\Longrightarrow\quad x^2 = \frac{a^2\cos^2\varphi}{\cos^2\varphi + (1 - e^2)\sin^2\varphi} = \frac{a^2\cos^2\varphi}{1 - e^2\sin^2\varphi} .
$$

The middle step multiplies top and bottom by $\cos^2\varphi$; the last uses $\cos^2\varphi + \sin^2\varphi = 1$. So $x = N\cos\varphi$, and then $z = (1 - e^2)N\sin\varphi$. At the pole this gives $(1 - e^2)N = b$, as it should. The unit normal is $(\cos\varphi\cos\lambda, \cos\varphi\sin\lambda, \sin\varphi)$ — the same as the ball's unit vector at latitude $\varphi$, which is why geodetic latitude is the natural angle to describe it. Adding $h$ times that normal gives the three formulas.
:::

::: example Geodetic to ECEF on WGS-84
**A point on the surface.** Geodetic latitude $45^\circ$, longitude $0^\circ$, height $0$.

First $N$. Since $\sin^2 45^\circ = 0.5$,

$$
N = \frac{6\,378\,137}{\sqrt{1 - 0.00669438 \times 0.5}} = 6\,388\,838.3\ \mathrm{m}.
$$

Then the components. Longitude $0$ means $y = 0$ and $\cos\lambda = 1$:

$$
x = N\cos 45^\circ = 4\,517\,590.9\ \mathrm{m}, \qquad z = N(1 - e^2)\sin 45^\circ = 6\,388\,838.3 \times 0.99330562 \times 0.70711 = 4\,487\,348.4\ \mathrm{m}.
$$

Sanity checks. The distance from the center is $\sqrt{x^2 + z^2} = 6\,367\,489.5$ m — about $10.6$ km less than $a$, as a point partway to the flattened pole should be. And the geocentric latitude is $\operatorname{atan2}(4\,487\,348.4,\ 4\,517\,590.9) = 44.8076^\circ$: the $11.5'$ short of $45^\circ$ that the rule predicted.

**The International Space Station at the top of its track.** Geodetic latitude $51.6^\circ$, longitude $0^\circ$, height $420$ km.

$N = 6\,378\,137/\sqrt{1 - 0.00669438\sin^2 51.6^\circ}$, which is $6391$ km to the nearest kilometer. Then $x = (N + h)\cos 51.6^\circ = 4\,230\,817$ m and $z = [N(1 - e^2) + h]\sin 51.6^\circ = 5\,304\,432$ m.

The geocentric latitude of this point is $51.42^\circ$. And a naive "altitude" computed as distance from the center minus $6371$ km comes out at $414$ km — $6$ km off the true $420$ km. Six kilometers is the kind of error that puts a re-entry landing zone in the wrong county.
:::

### From ECEF back to geodetic

Longitude is easy: $\lambda = \operatorname{atan2}(y, x)$. Latitude and height are tangled together, because $\varphi$ hides inside $N$.

Let $\rho = \sqrt{x^2 + y^2}$ ("rho") be the distance from the spin axis. The forward formulas say $\rho = (N + h)\cos\varphi$ and $z + e^2 N\sin\varphi = (N + h)\sin\varphi$. Divide the second by the first:

$$
\tan\varphi = \frac{z + e^2 N\sin\varphi}{\rho} .
$$

The unknown $\varphi$ is on both sides. But the correction $e^2 N\sin\varphi$ is small, because $e^2$ is under $0.7\%$. That makes a **[[fixed-point iteration|fixed-point]]** work well — guess, improve, repeat:

1. Start with the geocentric latitude, $\varphi_0 = \operatorname{atan2}(z, \rho)$.
2. Compute $N(\varphi_0)$ and a better latitude $\varphi_1 = \operatorname{atan2}(z + e^2 N\sin\varphi_0,\ \rho)$.
3. Repeat. Each pass shrinks the error by a factor of about $300$, so three or four passes reach a millimeter.

Then the height is $h = \rho/\cos\varphi - N$. Near the poles, where $\cos\varphi$ heads to zero, use the $z$ equation instead: $h = z/\sin\varphi - N(1 - e^2)$.

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

The alternative is **Bowring's** closed-form approximation, which reaches similar accuracy in one step from a cleverly chosen starting angle. Either is fine: the iteration is easier to check by reading, the closed form is faster. What is *not* fine is the ball shortcut, $\varphi = \operatorname{atan2}(z, \rho)$ and $h = r - a$. That is what you get after zero passes, and it is wrong by up to $11.5'$ in latitude and tens of kilometers in height.

## Check yourself

::: check
A point has ECEF coordinates $x = y = z = 4000$ km. Find its distance from the center, its longitude and its geocentric latitude.
:::

::: answer
Distance: $r = \sqrt{3 \times 4000^2} = 4000\sqrt{3} = 6928$ km.

Longitude: $\lambda = \operatorname{atan2}(4000, 4000) = 45^\circ$ E.

Latitude: the shadow length (distance from the spin axis) is $\rho = 4000\sqrt 2 = 5657$ km, so $\varphi_c = \operatorname{atan2}(4000, 5657) = 35.26^\circ$ N.

Notice the latitude is *not* $45^\circ$. A $45^\circ$ latitude needs the height to equal the shadow length, $z = 5657$ km, and here $z$ is only $4000$ km.
:::

::: check
Vandenberg is at $34.7^\circ$ N, $120.6^\circ$ W. Before computing, say whether each ECEF component is positive or negative. Then find its ECEF position on a ball of radius $6371$ km.
:::

::: answer
Signs first. $\lambda = -120.6^\circ$ is past $90^\circ$ west, so both $\cos\lambda$ and $\sin\lambda$ are negative: $x$ and $y$ are negative. North latitude makes $z$ positive.

Numbers. $\cos 34.7^\circ = 0.8221$, so the shadow length is $6371 \times 0.8221 = 5238$ km. Then $x = 5238\cos(-120.6^\circ) = -2666$ km, $y = 5238\sin(-120.6^\circ) = -4508$ km, and $z = 6371\sin 34.7^\circ = 3627$ km. The signs match the prediction.
:::

::: check
Two GPS satellites are both at radius $26\,560$ km, one above ($30^\circ$ N, $10^\circ$ E) and the other above ($30^\circ$ N, $100^\circ$ E). Find the angle between their position vectors, and the straight-line distance between them.
:::

::: answer
Spherical law of cosines with $\lambda_2 - \lambda_1 = 90^\circ$:

$$
\cos c = \sin^2 30^\circ + \cos^2 30^\circ\cos 90^\circ = 0.25 + 0 = 0.25,
$$

so $c = 75.52^\circ$.

The straight line between them is the chord of that angle, $2R\sin(c/2)$, from the law-of-cosines lesson: $2 \times 26\,560 \times \sin 37.76^\circ = 32\,530$ km.

Why isn't the angle $90^\circ$, when the longitudes differ by $90^\circ$? Because both satellites sit at $30^\circ$ latitude, and a circle of latitude away from the equator is a smaller circle. A quarter of the way around a small circle is a smaller angle as seen from the center.
:::

::: check
At $30^\circ$ geodetic latitude on WGS-84, how far apart are the geodetic and geocentric latitudes, and which is bigger?
:::

::: answer
$\tan\varphi_c = (1 - 0.00669438)\tan 30^\circ = 0.99330562 \times 0.57735 = 0.57349$, so $\varphi_c = 29.834^\circ$.

The geocentric latitude is smaller by $0.166^\circ$, which is $10.0$ arcminutes. It is always the smaller one: on the squashed Earth, the local "straight up" tilts further away from the equator than the line to the center does.
:::

::: check
A colleague's code computes geodetic height as $h = \rho/\cos\varphi - N$. When does this fail, and what should be used instead?
:::

::: answer
Near the poles. As $\varphi \to \pm 90^\circ$, both $\cos\varphi$ and $\rho$ head to zero. The code then divides one tiny number by another, rounding error blows up, and exactly at the pole it divides by zero.

Use the $z$ equation instead, $h = z/\sin\varphi - N(1 - e^2)$, whenever $|\varphi|$ is large — say above $80^\circ$ — and the $\rho$ equation elsewhere. Both equations are exact; they differ only in how well they tolerate rounding. It is the same reason $\operatorname{atan2}(z, \rho)$ beats $\arcsin(z/r)$ for latitude.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $x = r\cos\theta$, $y = r\sin\theta$ | Polar to Cartesian |
| $r = \sqrt{x^2 + y^2}$, $\theta = \operatorname{atan2}(y, x)$ | Cartesian to polar; keep $r \ge 0$ |
| $x = r\cos\varphi\cos\lambda$, $y = r\cos\varphi\sin\lambda$, $z = r\sin\varphi$ | Spherical (latitude $\varphi$, longitude $\lambda$) to Cartesian |
| $\lambda = \operatorname{atan2}(y, x)$, $\varphi = \operatorname{atan2}(z, \sqrt{x^2 + y^2})$ | Cartesian to spherical |
| Colatitude $\theta = 90^\circ - \varphi$ | Physics convention; check definitions before using a formula |
| ECEF | Origin at Earth's center; $z$ along spin axis; $x$ through Greenwich meridian; turns with Earth |
| $\cos c = \sin\varphi_1\sin\varphi_2 + \cos\varphi_1\cos\varphi_2\cos\Delta\lambda$ | Spherical law of cosines; great-circle distance $Rc$ |
| $a = 6\,378\,137$ m, $f = 1/298.257223563$ | WGS-84; $b = a(1-f)$, $e^2 = f(2-f) = 0.00669438$ |
| $\tan\varphi_c = (1 - e^2)\tan\varphi$ | Geocentric from geodetic latitude on the surface; biggest gap $\approx 11.5'$ at $45^\circ$ |
| $N = a/\sqrt{1 - e^2\sin^2\varphi}$ | Prime-vertical radius of curvature |
| $x = (N+h)\cos\varphi\cos\lambda$, $y = (N+h)\cos\varphi\sin\lambda$, $z = [N(1-e^2)+h]\sin\varphi$ | Geodetic to ECEF |
| $\tan\varphi = (z + e^2N\sin\varphi)/\rho$ | Iterate for geodetic latitude from ECEF; then $h = \rho/\cos\varphi - N$ |

Next lesson: the polar equation $r = p/(1 + e\cos\nu)$ draws the **conic sections** — circle, ellipse, parabola, hyperbola — and every orbit of one body around another is one of them.

::: context polar-picture One point, two addresses
The same blip on a radar screen, named two ways. The grid way walks $x$ along and $y$ up. The polar way turns through the angle $\theta$ and walks the distance $r$ straight out. The dashed lines show how the two are linked: $x = r\cos\theta$ and $y = r\sin\theta$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="165" x2="340" y2="165" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="340,165 330,160 330,170" fill="#1f2a44"/>
  <line x1="60" y1="185" x2="60" y2="15" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="60,15 55,25 65,25" fill="#1f2a44"/>
  <text x="332" y="185" font-size="13" fill="#1f2a44">x</text>
  <text x="70" y="22" font-size="13" fill="#1f2a44">y</text>
  <line x1="60" y1="165" x2="182.87" y2="78.96" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="182.87" y1="78.96" x2="182.87" y2="165" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="182.87" y1="78.96" x2="60" y2="78.96" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="182.87" cy="78.96" r="5" fill="#b4232c"/>
  <path d="M100,165 A40,40 0 0,0 92.77,142.06" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="106" y="156" font-size="13" fill="#b4232c">θ</text>
  <text x="112" y="108" font-size="13" fill="#1d6fd1">r</text>
  <text x="195" y="76" font-size="12" fill="#1f2a44">the blip</text>
  <text x="121" y="182" font-size="12" text-anchor="middle" fill="#1f2a44">x = r cos θ</text>
  <text x="190" y="125" font-size="12" fill="#1f2a44">y = r sin θ</text>
</svg>
```
:::

::: context atan-forgets Why the plain arctangent gets lost
The ratio $y/x$ throws away information. The points $(1, 1)$ and $(-1, -1)$ both have $y/x = 1$, yet they are on opposite sides of the origin. So $\arctan(y/x)$ can only answer in the right half of the plane, from $-90^\circ$ to $+90^\circ$, and it guesses wrong for every point on the left. It also breaks completely when $x = 0$, because you cannot divide by zero. atan2 takes $y$ and $x$ separately, keeps both signs, and always lands in the correct quadrant. That is why flight software uses it for every bearing, heading and gimbal angle.
:::

::: context spherical-picture Two right triangles make a globe
Left: a north–south slice through the globe. The arrow of length $r$ at latitude $\varphi$ splits into a height $r\sin\varphi$ and a shadow $r\cos\varphi$ on the equator's plane. Right: looking down from above the North Pole, that shadow points at longitude $\lambda$, and splits again into $x$ and $y$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="120" r="85" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="15" y1="120" x2="205" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="110" y1="205" x2="110" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="116" y="22" font-size="12" fill="#1f2a44">z (north)</text>
  <line x1="110" y1="120" x2="175.11" y2="65.36" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="175.11" y1="65.36" x2="175.11" y2="120" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="110" y1="120" x2="175.11" y2="120" stroke="#f2b880" stroke-width="4"/>
  <circle cx="175.11" cy="65.36" r="4" fill="#1f2a44"/>
  <path d="M138,120 A28,28 0 0,0 131.45,102.00" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="113" font-size="12" fill="#1f2a44">φ</text>
  <text x="130" y="84" font-size="12" fill="#1d6fd1">r</text>
  <text x="185" y="96" font-size="11" fill="#b4232c">r sin φ</text>
  <text x="118" y="137" font-size="11" fill="#1f2a44">r cos φ</text>
  <text x="12" y="200" font-size="11" fill="#6c7a93">side view</text>
  <line x1="240" y1="130" x2="356" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="285" y1="190" x2="285" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="285" y1="130" x2="341.39" y2="97.44" stroke="#f2b880" stroke-width="4"/>
  <path d="M307,130 A22,22 0 0,0 304.05,119.00" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="126" font-size="12" fill="#1f2a44">λ</text>
  <text x="346" y="146" font-size="12" fill="#1f2a44">x</text>
  <text x="291" y="68" font-size="12" fill="#1f2a44">y</text>
  <text x="296" y="200" font-size="11" text-anchor="middle" fill="#6c7a93">top view</text>
</svg>
```
:::

::: context greenwich Why longitude starts in London
Latitude has a natural zero: the equator, fixed by the way the Earth spins. Longitude has none — any north–south line would do. For centuries every seafaring nation used its own. In 1884 the International Meridian Conference in Washington, D.C. chose the line through the Royal Observatory at Greenwich, England, partly because most sea charts already used it. Today's GPS zero line sits about a hundred meters east of the brass strip tourists stand on at Greenwich, because it is defined by the modern reference frame rather than the old telescope.
:::

::: context ecef-turns A frame that spins with the planet
ECEF rotates once a day along with the Earth, so a launch pad has the same $x$, $y$, $z$ forever. That makes it perfect for anything tied to the ground: launch sites, radar stations, landing zones, a satellite's ground track. It is less convenient for orbits. An orbit stays roughly fixed relative to the stars while the Earth turns underneath it, so orbit work uses a second, non-rotating frame, and converting between the two is a rotation about the $z$ axis by the Earth's spin angle. You will meet that pair of frames again in the rotating-frames module.
:::

::: context great-circle Why flights to Europe curve over Canada
A great circle is the biggest circle you can draw on a ball — one whose center is the ball's center, like the equator or any line of longitude. The shortest path between two places on a sphere always runs along one. On a flat map these paths look curved: a flight from New York to London arcs up toward Newfoundland and Ireland. Stretch a string between the two cities on a globe and you will see it is the straight choice. Satellite ground tracks are close cousins of great circles, bent by the Earth turning underneath.
:::

::: context why-flattened Why a spinning planet bulges
Anything moving in a circle needs a push toward the center to keep curving; otherwise it would fly off in a straight line. At the equator the ground is carried around fastest, about $465$ m/s, so part of gravity's pull is used up keeping it on its circle, and the rock and ocean there settle a little farther out. Near the poles the ground barely moves in a circle at all. Over the Earth's history, rock flowed slowly into that shape. Jupiter and Saturn, which spin faster and are made of gas, bulge so much that you can see it through a small telescope.
:::

::: context wgs84 The ellipsoid inside every GPS receiver
WGS-84 stands for World Geodetic System 1984. It was set up by the United States Department of Defense for the GPS system, and it has become the world standard. It fixes the center of the Earth, the directions of the axes and the size and shape of the ellipsoid. When your phone reports a latitude and longitude, it is giving you WGS-84 geodetic coordinates. The two defining numbers, $a$ and $1/f$, are exact by definition; $b$ and $e^2$ follow from them.
:::

::: context plumb-line Straight down is not quite toward the center
A plumb line is a weight on a string. It hangs along the direction of "down" where you stand, which is how builders have made walls vertical for thousands of years. On a squashed Earth that direction is perpendicular to the surface, and it does not aim at the Earth's center. At mid-latitudes the two directions differ by about a fifth of a degree. Surveyors measured latitude by sighting stars against a plumb line for centuries, which is why the "straight up" latitude, not the center one, became the one on maps.
:::

::: context two-latitudes The two latitudes, exaggerated
This ellipse is squashed far more than the Earth, so the difference shows. The blue line runs from the center to the point; its angle is the geocentric latitude $\varphi_c$. The red line is perpendicular to the surface — "straight up" — and meets the equator's plane away from the center; its angle is the geodetic latitude $\varphi$. The red angle is always the bigger one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <ellipse cx="140" cy="120" rx="120" ry="72" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="10" y1="120" x2="290" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="140" y1="200" x2="140" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="140" y1="120" x2="224.85" y2="69.09" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="194.31" y1="120" x2="240.29" y2="43.36" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="224.85" cy="69.09" r="4" fill="#1f2a44"/>
  <circle cx="140" cy="120" r="3" fill="#1f2a44"/>
  <path d="M174,120 A34,34 0 0,0 169.15,102.51" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <path d="M216.31,120 A22,22 0 0,0 205.62,101.14" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="176" y="112" font-size="12" fill="#1d6fd1">φc</text>
  <text x="219" y="112" font-size="12" fill="#b4232c">φ</text>
  <text x="134" y="137" font-size="11" text-anchor="end" fill="#1f2a44">center</text>
  <text x="248" y="44" font-size="11" fill="#b4232c">straight up</text>
  <text x="300" y="124" font-size="11" fill="#1f2a44">equator</text>
</svg>
```
:::

::: context arcminute Minutes of arc and the nautical mile
Degrees are split like hours: $60$ arcminutes in a degree, written $1^\circ = 60'$, and $60$ arcseconds in an arcminute. One arcminute of latitude is about $1.85$ km of ground, and that is where the **nautical mile** comes from: it was originally one arcminute of latitude, and is now defined as exactly $1852$ m. So the $11.5'$ gap between the two latitudes is about $11.5$ nautical miles — roughly $21$ km.
:::

::: context fixed-point Guess, improve, repeat
A fixed-point iteration solves an equation that has the unknown on both sides. Put a guess into the right-hand side, and out comes a new value for the left. Feed that back in, again and again. If the right-hand side only depends weakly on the guess, each round cuts the error by a large factor, and the values settle on the answer. Here the guess only enters through a term that is less than $1\%$ of the whole, so the error shrinks roughly $300$-fold per round: $21$ km, then about $70$ m, then about a quarter of a meter, then under a millimeter.
:::
