---
id: l09-precession-nutation-and-polar-motion
title: Precession, nutation and polar motion
minutes: 22
covers:
  - precession, nutation, polar motion
---

Spin a top on a table. Its axis sweeps slowly around in a cone, nodding a little as it goes. The Earth is a spinning top too, only a very slow one.

Lesson 05 turned ECI into ECEF with one matrix, $\mathbf{R}_3(\theta)$, about a shared $z$ axis. That assumes the spin axis is fixed in inertial space *and* in the crust. Neither is true. The axis sweeps a cone in inertial space about once every $26\,000$ years, nods on that cone with an $18.6$-year period, and wanders inside the Earth by a few meters on a $14$-month cycle. Each is a tiny angle but a big distance at orbital radius: the pole's drift since 2000 alone moves a low satellite's computed ground position by eighteen kilometers.

So the full rotation from GCRF to ITRF is a chain of three matrices: one for the axis moving in inertial space (**precession** and **nutation**), one for the Earth turning about that axis (the Earth rotation angle from UT1, lesson 08), and one for the axis moving relative to the crust (**polar motion**). This lesson covers each motion's cause, size and model, and assembles the chain. It does not derive the thousand-term nutation series; nobody types those in by hand. It gives the structure, the sizes, and the consistency rules that keep code from being silently wrong by a third of a degree.

The payoff: reading an Earth-orientation product — IERS Bulletin A, an SGP4 output, a star tracker's attitude — you will know which matrices it assumes.

## The chain

The IERS Conventions (the rulebook of the International Earth Rotation and Reference Systems Service) write the transformation from the terrestrial frame to the celestial one as

$$
\mathbf{r}^{GCRF} = \mathbf{Q}(t)\,\mathbf{R}(t)\,\mathbf{W}(t)\,\mathbf{r}^{ITRF} .
$$

Each factor is a rotation with an in-between frame on either side ([[picture|chain-picture]]):

- $\mathbf{W}(t)$, **polar motion**, takes ITRF to the **Terrestrial Intermediate Reference System** (TIRS), whose $z$ axis is the actual rotation axis instead of the conventional crust-fixed pole. In the module's notation, $\mathbf{W} = \mathbf{R}_{TIRS \leftarrow ITRF}$.
- $\mathbf{R}(t)$, **Earth rotation**, takes TIRS to the **Celestial Intermediate Reference System** (CIRS) by turning about that axis through the Earth rotation angle: $\mathbf{R}(t) = \mathbf{R}_3(-\theta_{ERA}) = \mathbf{R}_{CIRS \leftarrow TIRS}$.
- $\mathbf{Q}(t)$, **precession–nutation** (with a tiny fixed "frame bias" folded in), takes CIRS to GCRF by tilting the actual axis back onto the GCRF pole: $\mathbf{Q} = \mathbf{R}_{GCRF \leftarrow CIRS}$.

Read as dominoes, $\mathbf{R}_{GCRF \leftarrow ITRF} = \mathbf{R}_{GCRF \leftarrow CIRS}\,\mathbf{R}_{CIRS \leftarrow TIRS}\,\mathbf{R}_{TIRS \leftarrow ITRF}$, inner labels matching. This module usually needs the other direction, the transpose (reverse the order, transpose each piece):

$$
\mathbf{R}_{ITRF \leftarrow GCRF} = \mathbf{W}^{T}\,\mathbf{R}_3(\theta_{ERA})\,\mathbf{Q}^{T} .
$$

Check: set $\mathbf{Q} = \mathbf{W} = \mathbf{I}$ (the identity, "do nothing") and this collapses to lesson 05's $\mathbf{R}_3(\theta)$. So the signs agree with everything before.

The outer matrices are within a fraction of a degree of the identity; the middle one is a full turn. Today $\mathbf{Q}$ differs from the identity by about $0.15^\circ$ and growing; $\mathbf{W}$ by a few tenths of an arcsecond; and using UTC instead of UT1 puts up to $13.5''$ of error into $\theta_{ERA}$.

## Precession

Why does the axis move? Spin has made the Earth **[[oblate|oblate]]** — fatter at the equator, with a bulge. The Sun and Moon pull harder on the near side of that bulge than on the far side. The equator is tilted $23.44^\circ$ to the **ecliptic**, the plane of Earth's orbit around the Sun; that tilt is the **obliquity** $\varepsilon$ (Greek "epsilon"). So the uneven pull makes a torque that tries to pull the bulge into the ecliptic plane — to stand the Earth's axis up straight.

A spinning body does not tip when pushed. As the rigid-body module showed for a gyroscope, its spin axis moves at right angles to the torque. So instead of standing up, the Earth's axis slowly circles the ecliptic pole, tracing a [[cone with half-angle ε|precession-cone]]. This is **luni-solar precession**. Its rate is set by the Earth's bulge ($J_2$), its spin rate, and the masses and distances of the Moon and Sun.

The IAU 1976 numbers (IAU 2006 changes only the fifth significant figure):

- The equinox slides westward along the ecliptic at $p = 50.29''$ per year. One full lap takes $360 \times 3600 / 50.29 = 25\,770$ years — "about $26\,000$".
- Resolved in equatorial coordinates, the pole moves at $n = 20.04''$ per year (roughly $p\sin\varepsilon$), and right ascensions shift by $m = 46.12''$ per year (roughly $p\cos\varepsilon$).
- Since J2000.0, $26.72$ years to the date of writing, the equinox has moved $50.29 \times 26.72 = 1\,344'' = 0.373^\circ$ along the ecliptic, and the pole has moved $20.04 \times 26.72 = 536'' = 0.149^\circ$.

The pole's motion matters most for positions. Tilting the frame's $z$ axis by $0.149^\circ$ moves a point at a low-orbit radius by

$$
6\,878\,137\,\mathrm{m} \times 0.149^\circ \times \frac{\pi}{180^\circ} = 17.9\,\mathrm{km},
$$

and at geostationary radius by $109\,\mathrm{km}$. The right-ascension shift is what separates GMST from the ERA, as lesson 08 found: $46.12'' \times 26.72 = 1\,232'' = 0.342^\circ$.

In the classical, equinox-based method, the precession matrix $\mathbf{P}$ goes from the J2000 mean equator and equinox to the *mean equator and equinox of date*. It is a 3-2-3 sequence of three small angles. With $T$ the number of Julian centuries of TT since J2000.0, their leading terms are

$$
\zeta_A = 2306.2181''\,T, \qquad \theta_A = 2004.3109''\,T, \qquad z_A = 2306.2181''\,T ,
$$

(read "zeta A", "theta A", "z A") plus quadratic and cubic corrections at the arcsecond level. For $T = 0.2672$: $\theta_A = 2004.3109 \times 0.2672 = 535.6''$, the pole's displacement, and $\zeta_A + z_A = 2 \times 2306.2181 \times 0.2672 = 1\,232.4''$, the right-ascension shift. The two $z$-turns nearly cancel for the pole and add for the equinox; the middle $y$-turn tilts the pole. Vallado's *Fundamentals of Astrodynamics* gives full coefficients for the 1976 and 2006 theories.

## Nutation

Precession is the smooth average. On top of it the torque varies, because the Moon's orbit is tilted $5.1^\circ$ to the ecliptic and its **[[node turns around once every 18.6 years|lunar-node]]**, and because the Sun's and Moon's distances and positions cycle through the year and the month. The axis answers with small periodic nods about its average path: **nutation** (Latin for "nodding").

The classical description uses two angles. The **nutation in longitude** $\Delta\psi$ ("delta psi") moves the equinox along the ecliptic. The **nutation in obliquity** $\Delta\varepsilon$ ("delta epsilon") changes the tilt. Each is a sum of periodic terms in the angles that describe where the Sun and Moon are. The biggest term has the period of the lunar node:

$$
\Delta\psi \approx -17.20''\,\sin\Omega_{\mathrm{Moon}}, \qquad \Delta\varepsilon \approx +9.20''\,\cos\Omega_{\mathrm{Moon}}, \qquad \text{period } 18.6\,\mathrm{yr} ,
$$

where $\Omega_{\mathrm{Moon}}$ is the longitude of the Moon's ascending node. The next biggest are a half-year solar term ($1.3''$ in longitude, $0.57''$ in obliquity) and a two-week lunar term ($0.2''$).

IAU 1980 had $106$ terms. IAU 2000A has $1\,365$ and is good to $0.2$ **milliarcseconds** (mas, thousandths of an arcsecond). The shortened IAU 2000B keeps $77$ terms and is good to $1\,\mathrm{mas}$ — $3\,\mathrm{cm}$ at a low orbit — and is what most flight code uses.

Applying the nutation matrix $\mathbf{N}$ to the mean-of-date frame gives the *true equator and equinox of date*, the frame the Earth really spins in. The $9.2''$ and $17.2''$ amplitudes are $307\,\mathrm{m}$ and $574\,\mathrm{m}$ at a low-orbit radius. Ignore nutation and a ground position slides back and forth by half a kilometer over $18.6$ years: harmless for a weather satellite, fatal for laser ranging or GNSS orbits.

::: key Precession, nutation and polar motion
Precession is the roughly $26\,000$-year conical drift of the spin axis in inertial space ($50.3''$ per year along the ecliptic, $20.0''$ per year in the pole's position). Nutation is the smaller periodic wobble on top of it, dominated by an $18.6$-year lunar term of $17.2''$ in longitude and $9.2''$ in obliquity. Polar motion is the meter-scale wander of the rotation axis relative to the crust, measured and published by the IERS.
:::

### Two formulations, one rule

Since 2003 the IAU has recommended a method that drops the equinox altogether. The actual rotation axis, the **Celestial Intermediate Pole** (CIP), is located in GCRF by two direction cosines $X$ and $Y$. They are series in $T$ with leading terms $X \approx 2004.19''\,T$ and $Y \approx -0.03''\,T - 22.41''\,T^2$. So $X$ *is* the accumulated $\theta_A$ plus nutation, and $Y$ is small. The matrix $\mathbf{Q}$ is built straight from $X$, $Y$ and a tiny angle $s$. That angle places the zero of longitude on the moving equator at the **Celestial Intermediate Origin** (CIO), a point defined so that it never slides along the equator. Lesson 08's $\theta_{ERA}$ is measured from the CIO.

The equinox-based chain uses $\mathbf{R}_3(\theta_{GAST})\,\mathbf{N}\,\mathbf{P}\,\mathbf{B}$ instead: $\mathbf{B}$ the frame bias, $\mathbf{P}$ precession, $\mathbf{N}$ nutation, and **Greenwich apparent sidereal time** $\theta_{GAST} = \theta_{GMST} + \Delta\psi\cos\varepsilon$, measured from the true equinox of date. (The added term is called the **equation of the equinoxes**.)

Both give the same $\mathbf{R}_{ITRF \leftarrow GCRF}$ to a millionth of an arcsecond. The rule: **the rotation angle and the precession–nutation matrix must come from the same method.** ERA pairs with the CIO-based $\mathbf{Q}(X, Y, s)$. GAST pairs with $\mathbf{N}\mathbf{P}\mathbf{B}$. Pair ERA with $\mathbf{N}\mathbf{P}\mathbf{B}$ and the zero of longitude is off by the accumulated precession in right ascension — the $0.342^\circ$ above, which is $41\,\mathrm{km}$ at a low orbit. It mimics a clock error of $82\,\mathrm{s}$ (at $15.041^\circ$ per hour, $0.342^\circ$ takes $0.342/15.041 \times 3600 = 82\,\mathrm{s}$), and teams have hunted it as one.

::: example What the simple model of lesson 05 leaves out
A satellite at $500\,\mathrm{km}$ altitude, $r = 6\,878\,137\,\mathrm{m}$, is converted from GCRF to "ECEF" in 2026 with $\mathbf{R}_3(\theta)$ alone: $\mathbf{Q} = \mathbf{W} = \mathbf{I}$.

**Axis tilt.** The true rotation axis is $\sqrt{X^2 + Y^2} = \sqrt{535.6^2 + 1.6^2} = 535.6''$ from the GCRF $z$ axis (precession since J2000, before nutation). In radians that is $535.6 \times \pi / 648\,000 = 2.597 \times 10^{-3}$. Turning about the wrong axis misplaces the satellite in the Earth-fixed frame by up to

$$
6\,878\,137 \times 2.597 \times 10^{-3} = 17.9\,\mathrm{km},
$$

depending on where it is in its orbit. Nutation adds up to $\pm 574\,\mathrm{m}$ more.

**Zero point.** If $\theta$ is the ERA, the rotation is measured from the CIO, which sits near the GCRF $x$ axis. But with $\mathbf{Q} = \mathbf{I}$ nothing has moved the equator, so the reference meridian lands $0.342^\circ$ from where it belongs: $6\,878\,137 \times 0.342 \times \pi/180 = 41\,\mathrm{km}$ east–west. If $\theta$ is GMST, that shift is already inside the sidereal-time formula, and the zero-point error is only the equation of the equinoxes — at most about $16''$, or $1.1\,\mathrm{s}$ of time, or $0.5\,\mathrm{km}$.

**Polar motion.** Leaving out $\mathbf{W}$ costs up to $0.3''$: $10\,\mathrm{m}$.

**UT1.** Using UTC costs up to $0.9\,\mathrm{s}$: $450\,\mathrm{m}$.

**Total.** With GMST the simple model is off by about $18\,\mathrm{km}$; with ERA by about $\sqrt{18^2 + 41^2} \approx 45\,\mathrm{km}$, both dominated by precession. Fixes, most valuable first: $\mathbf{Q}$, UT1, nutation within $\mathbf{Q}$, then $\mathbf{W}$. The coding exercise's stretch part measures this budget against a real ephemeris.
:::

## Polar motion

The axis also moves relative to the *crust*. Where it pokes out of the ground near the North Pole, that spot wanders in a rough loop a few meters across around the conventional ITRF pole. The motion has three main parts:

- The **[[Chandler wobble|chandler]]**, a free wobble of the Earth as a slightly squishy body. Its period is about $433$ days ($14$ months) and its size $0.1''$ to $0.2''$ ($3$ to $6\,\mathrm{m}$). The atmosphere and oceans keep it going.
- A **yearly** term of about $0.1''$, driven by seasonal shifts of air, water and snow.
- A slow **drift** of the average pole, about $10\,\mathrm{cm}$ per year, from land still rising after the Ice Age glaciers melted and from changes in ice mass today.

The IERS publishes the pole coordinates $x_p$ and $y_p$ ("x sub p", "y sub p"): the offsets of the CIP from the ITRF pole, in arcseconds, along the Greenwich meridian and along $90^\circ$ west. They appear daily, with predictions, in Bulletin A, next to $\Delta\mathrm{UT1}$. Unlike precession and nutation, polar motion has no accurate long-range theory. Like weather, it is measured, and a flight system that needs it must be uploaded with current values. The total rarely passes $0.3''$, about $9\,\mathrm{m}$ on the surface ([[picture|pole-offset]]). Its matrix is

$$
\mathbf{W} = \mathbf{R}_{TIRS \leftarrow ITRF} = \mathbf{R}_3(-s')\,\mathbf{R}_2(x_p)\,\mathbf{R}_1(y_p) ,
$$

with lesson 01's elementary rotations. The angle $s'$ (about $-47$ microarcseconds per century) places the terrestrial origin and is negligible for everything here. Because $x_p$ and $y_p$ are microradians, $\mathbf{W}$ is the identity plus a small skew part. To first order it moves an ITRF position $\mathbf{r} = (x, y, z)$ by

$$
\Delta\mathbf{r} = (-x_p z,\; y_p z,\; x_p x - y_p y) .
$$

::: note Why the first-order shift has that shape
For a tiny angle $\alpha$, $\cos\alpha \approx 1$ and $\sin\alpha \approx \alpha$. So $\mathbf{R}_1(y_p)$ sends $(x, y, z)$ to about $(x,\; y + y_p z,\; z - y_p y)$. Then $\mathbf{R}_2(x_p)$, whose first row is $(1, 0, -x_p)$ and third row $(x_p, 0, 1)$, adds $-x_p z$ to the first component and $+x_p x$ to the third. Dropping products of two tiny angles leaves $(x - x_p z,\; y + y_p z,\; z + x_p x - y_p y)$. Subtract the original $(x, y, z)$ and you have $\Delta\mathbf{r}$.
:::

::: example Polar motion at a launch pad
Take $x_p = 0.15''$ and $y_p = 0.35''$, a plausible pair. In radians (divide by $206\,265$), $x_p = 7.27 \times 10^{-7}$ and $y_p = 1.70 \times 10^{-6}$. SLC-40's ITRF position, from lesson 06, is $\mathbf{r} = (917\,841,\; -5\,530\,566,\; 3\,031\,354)\,\mathrm{m}$. Put the numbers in:

$$
\Delta\mathbf{r} = \begin{bmatrix} -x_p z \\ y_p z \\ x_p x - y_p y \end{bmatrix}
= \begin{bmatrix} -7.27 \times 10^{-7} \times 3\,031\,354 \\ 1.70 \times 10^{-6} \times 3\,031\,354 \\ 7.27 \times 10^{-7} \times 917\,841 + 1.70 \times 10^{-6} \times 5\,530\,566 \end{bmatrix}
= \begin{bmatrix} -2.20 \\ 5.14 \\ 10.05 \end{bmatrix} \mathrm{m} .
$$

In the third row $-y_p y$ is positive because $y$ is negative. The size is $\sqrt{2.20^2 + 5.14^2 + 10.05^2} = 11.5\,\mathrm{m}$. The exact matrix product agrees to the centimeter, as the code below confirms.

Eleven meters is nothing to a launch trajectory, and everything to a laser-ranging station or GNSS reference receiver whose position is known to millimeters.

```python
import math

ARCSEC = math.pi / (180 * 3600)

def R1(t):
    c, s = math.cos(t), math.sin(t)
    return [[1, 0, 0], [0, c, s], [0, -s, c]]

def R2(t):
    c, s = math.cos(t), math.sin(t)
    return [[c, 0, -s], [0, 1, 0], [s, 0, c]]

def matmul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]

def matvec(A, v):
    return [sum(A[i][k] * v[k] for k in range(3)) for i in range(3)]

x_p, y_p = 0.15 * ARCSEC, 0.35 * ARCSEC        # polar motion, rad (s' neglected)
W = matmul(R2(x_p), R1(y_p))                   # R_tirs_from_itrf

r_itrf = [917841.0, -5530566.0, 3031354.0]     # SLC-40, m
r_tirs = matvec(W, r_itrf)
print([round(r_tirs[i] - r_itrf[i], 2) for i in range(3)])
# small-angle form: d = (-x_p z, y_p z, x_p x - y_p y)
print([round(v, 2) for v in (-x_p * r_itrf[2], y_p * r_itrf[2], x_p * r_itrf[0] - y_p * r_itrf[1])])
# [-2.2, 5.14, 10.05]
# [-2.2, 5.14, 10.05]
```
:::

## Where each sensor and product sits in the chain

The chain pins down the native frames of lesson 05 exactly.

A **star tracker** matches a catalogue of ICRF star positions, so its output is $\mathbf{R}_{GCRF \leftarrow S}$: the sensor's orientation in the celestial frame — not in any frame of date, and certainly not in ITRF. To get the body attitude relative to the Earth-fixed frame, to point an antenna at a ground station, say, the chain is

$$
\mathbf{R}_{ITRF \leftarrow B} = \mathbf{W}^{T}\,\mathbf{R}_3(\theta_{ERA})\,\mathbf{Q}^{T}\,\mathbf{R}_{GCRF \leftarrow S}\,\mathbf{R}_{B \leftarrow S}^{T} ,
$$

every factor evaluated at the measurement time, and $\theta_{ERA}$ from UT1. Leave out $\mathbf{Q}$ and the antenna points $0.15^\circ$ off. Get the time scale wrong and it points off by $15^\circ$ per hour of error.

A **GNSS receiver** works entirely in ITRF, since the satellites broadcast Earth-fixed positions. But combine its output with a star tracker or an inertial propagator and the whole chain must be right.

A **two-line element set** (TLE) run through the SGP4 propagator gives positions in **[[TEME|teme]]**, "true equator, mean equinox": a frame of date with the true (nutated) pole but a mean equinox. Converting TEME to ITRF uses $\mathbf{R}_3(\theta_{GMST})$ and then $\mathbf{W}^{T}$ — with GMST, not GAST and not ERA, because the mean equinox is TEME's zero of longitude. Converting TEME to GCRF means undoing nutation and precession; the coding exercise's stretch part meets this frame.

**IERS Bulletin A** supplies measured and predicted $x_p$, $y_p$, $\Delta\mathrm{UT1}$ and excess length of day, for any system converting GCRF to ITRF better than about a kilometer.

::: key The full chain and its sizes
The full rotation is $\mathbf{R}_{ITRF \leftarrow GCRF} = \mathbf{W}^{T}\,\mathbf{R}_3(\theta_{ERA})\,\mathbf{Q}^{T}$: polar motion, Earth rotation from UT1, precession–nutation. Sizes in 2026 for a LEO satellite: $\mathbf{Q}$ about $0.15^\circ$ ($18\,\mathrm{km}$), nutation within it up to $17''$ ($0.6\,\mathrm{km}$), $\Delta\mathrm{UT1}$ up to $0.9\,\mathrm{s}$ ($0.45\,\mathrm{km}$), $\mathbf{W}$ up to $0.3''$ ($10\,\mathrm{m}$).
:::

::: warning Match the angle to the matrix
The rotation angle and the precession–nutation matrix must come from the same method. The ERA (from the CIO) pairs with the CIO-based $\mathbf{Q}(X, Y, s)$. Greenwich apparent sidereal time (from the true equinox) pairs with $\mathbf{N}\mathbf{P}\mathbf{B}$. GMST pairs with the *mean* equinox, and so with TEME. Mixing them misplaces the zero of longitude by the accumulated precession in right ascension — $0.34^\circ$ in 2026, growing $46''$ a year — an error that looks like an $82\,\mathrm{s}$ clock offset.
:::

::: warning Earth-orientation data goes stale quietly
Polar motion and $\Delta\mathrm{UT1}$ cannot be computed; they are measured and must be uploaded. A system that hard-codes them, or lets its Earth-orientation (EOP) file go stale, drifts slowly in position — meters for polar motion, up to hundreds of meters for UT1 over a year — and badly in trust, because nothing flags the staleness. Timestamp the EOP data and raise an alarm on its age.
:::

## Check yourself

::: check
In two or three sentences, explain why the Earth's spin axis precesses and in which direction. What would a spacecraft attitude system built around Polaris as a fixed reference experience over a decade?
:::

::: answer
The Sun and Moon pull harder on the near half of Earth's bulge, and with the equator tilted $23.4^\circ$ to the ecliptic that makes a torque trying to stand the axis up. A spinning body moves its axis at right angles to a torque, so the axis circles the ecliptic pole instead. A toy top's gravity torque tries to tip it *over*, and it precesses in the same direction as its spin; the Earth's torque points the opposite way (it tries to *right* the axis), so the Earth precesses **westward**, opposite to its spin.

Over a decade the pole moves about $200''$ along that circle. [[Polaris|polaris]] is now about $40'$ from the pole and getting closer. A system treating it as *the* pole would already be about $0.7^\circ$ wrong, and its "fixed" reference would drift about three arcminutes per decade against the true axis. A star tracker avoids this by using the whole catalogue in GCRF, which does not precess.
:::

::: check
A GEO communications satellite's ground system computes the satellite's Earth-fixed position for antenna pointing using GMST and the J2000 axes, with no precession or nutation. Estimate the pointing error for a ground antenna. Does it matter for a $1^\circ$ beamwidth?
:::

::: answer
The biggest omission is the pole tilt $\theta_A \approx 536''$, a turn of the frame's $z$ axis by $0.149^\circ$, or $2.597 \times 10^{-3}\,\mathrm{rad}$. At GEO radius, $42\,164\,\mathrm{km}$, that misplaces the satellite by up to $42\,164 \times 2.597 \times 10^{-3} = 109\,\mathrm{km}$, mostly north–south, since the tilt moves the equator's plane.

From a ground antenna about $38\,000\,\mathrm{km}$ away, $109\,\mathrm{km}$ spans $109 / 38\,000 = 2.9 \times 10^{-3}\,\mathrm{rad} = 0.16^\circ$. With GMST the zero of longitude is nearly right (the $0.34^\circ$ right-ascension shift is inside the GMST formula), so the east–west error is only the equation of the equinoxes — at most about $16''$, or $3\,\mathrm{km}$ at GEO.

For a $1^\circ$ beam, $0.16^\circ$ costs a few tenths of a decibel, unnoticed; for a $0.2^\circ$ Ka-band beam it is a lost link. The fix is one matrix.
:::

::: check
Precession and nutation are computed from series accurate to a fraction of a milliarcsecond for decades ahead. Why does the IERS instead publish polar motion and $\Delta\mathrm{UT1}$ from observations, with predictions only weeks ahead?
:::

::: answer
Precession and nutation are the *forced* response of the Earth to the gravity of the Sun, Moon and planets, whose positions are known almost perfectly for centuries, so the response can be written as a series. Only small leftovers (a free core nutation of about $0.2\,\mathrm{mas}$) must be observed.

Polar motion and the length of day, by contrast, are driven mostly by angular momentum trading between the solid Earth and the atmosphere, oceans and core — weather, in effect — which cannot be predicted beyond weeks. The Chandler wobble is a free oscillation whose size and timing depend on how it was recently kicked. So the IERS measures them with VLBI, GNSS and laser ranging, and systems that need them must be fed.
:::

::: check
Write the complete chain of matrices, with frame labels on every factor, that takes a star-tracker attitude (as a DCM) to the direction of local "down" in body axes, for a spacecraft over a known ITRF position. Say which time scale each time-dependent factor needs.
:::

::: answer
Let $\mathbf{R}_{GCRF \leftarrow S}$ be the tracker's output and $\mathbf{R}_{B \leftarrow S}$ its mounting matrix. First the body's inertial attitude:

$$
\mathbf{R}_{GCRF \leftarrow B} = \mathbf{R}_{GCRF \leftarrow S}\,\mathbf{R}_{B \leftarrow S}^{T} .
$$

Then the Earth-fixed attitude:

$$
\mathbf{R}_{ITRF \leftarrow B} = \mathbf{W}^{T}(x_p, y_p)\,\mathbf{R}_3(\theta_{ERA}(\mathrm{UT1}))\,\mathbf{Q}^{T}(\mathrm{TT})\,\mathbf{R}_{GCRF \leftarrow B} .
$$

Polar motion comes from Bulletin A (just the right date). The Earth rotation angle needs UT1 (UTC plus $\Delta\mathrm{UT1}$). Precession–nutation needs $T$ in TT (UTC plus $69.184\,\mathrm{s}$).

Local down at the spacecraft's geodetic position is the third row of $\mathbf{R}_{N \leftarrow E}$ from lesson 06; call it $\hat{\mathbf{d}}^{ITRF}$. In body axes, $\hat{\mathbf{d}}^{B} = \mathbf{R}_{ITRF \leftarrow B}^{T}\,\hat{\mathbf{d}}^{ITRF}$. Every inner label matches and every time argument is named; a stale Earth-orientation factor puts the down vector off by the amounts in the key block.
:::

::: check
How does the frame bias between J2000 and GCRF differ from precession? Which is safe to ignore in a system with a $100\,\mathrm{m}$ position requirement at LEO?
:::

::: answer
The frame bias is a fixed rotation of a few tens of milliarcseconds between two definitions of the same nominally inertial frame: the J2000 equator and equinox, and the ICRF axes pinned to quasars. It never grows. Precession is the steady motion of the true pole and equinox away from *both* fixed frames — $20''$ per year for the pole — and it has already reached $536''$.

At LEO radius $1\,\mathrm{mas}$ is $3.3\,\mathrm{cm}$, so the frame bias of about $23\,\mathrm{mas}$ is under a meter and safe to ignore at $100\,\mathrm{m}$. Precession is $18\,\mathrm{km}$ and cannot be ignored at any level a navigation system would call a requirement. Both are "small rotations of the inertial frame"; one is a constant, the other has a rate.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r}^{GCRF} = \mathbf{Q}\,\mathbf{R}\,\mathbf{W}\,\mathbf{r}^{ITRF}$ | IERS chain: precession–nutation, Earth rotation, polar motion |
| $\mathbf{R}_{ITRF \leftarrow GCRF} = \mathbf{W}^{T}\mathbf{R}_3(\theta_{ERA})\mathbf{Q}^{T}$ | The same chain in this module's notation; reduces to $\mathbf{R}_3(\theta)$ when $\mathbf{Q} = \mathbf{W} = \mathbf{I}$ |
| Precession | $50.29''$/yr along the ecliptic, $25\,770$-yr period; pole $20.04''$/yr, RA $46.12''$/yr |
| $\zeta_A, \theta_A, z_A \approx 2306.2'', 2004.3'', 2306.2''$ per century | IAU 1976 precession angles, leading terms; $\theta_A = 536''$ in 2026 |
| Nutation | $\Delta\psi \approx -17.20''\sin\Omega_{\mathrm{Moon}}$, $\Delta\varepsilon \approx 9.20''\cos\Omega_{\mathrm{Moon}}$, $18.6$-yr period; IAU 2000A/B series |
| $X, Y, s$; CIP, CIO | CIO-based description of the pole; $X \approx 2004.19''\,T$; pairs with $\theta_{ERA}$ |
| $\mathbf{N}\mathbf{P}\mathbf{B}$, GAST | Equinox-based description; pairs with $\theta_{GAST} = \theta_{GMST} + \Delta\psi\cos\varepsilon$ |
| TEME | True equator, mean equinox: the SGP4/TLE frame; pairs with GMST |
| $x_p, y_p$ | Polar motion, $\lesssim 0.3''$ ($9\,\mathrm{m}$); Chandler $433$ d, annual, $10\,\mathrm{cm}$/yr drift; from Bulletin A |
| $\mathbf{W} = \mathbf{R}_3(-s')\mathbf{R}_2(x_p)\mathbf{R}_1(y_p)$ | Polar motion matrix; $\Delta\mathbf{r} \approx (-x_p z,\; y_p z,\; x_p x - y_p y)$ |
| Sizes at LEO, 2026 | $\mathbf{Q}$: $18\,\mathrm{km}$; nutation: $0.6\,\mathrm{km}$; $\Delta\mathrm{UT1}$: $0.45\,\mathrm{km}$; $\mathbf{W}$: $10\,\mathrm{m}$; frame bias: $<1\,\mathrm{m}$ |

This closes the module: lessons 01 to 03 gave the mathematics of rotating frames, and 04 to 09 the aerospace frame zoo and its clocks. The attitude-representations module next asks how best to store, propagate and estimate the rotation matrix on a flight computer.

::: context chain-picture Four frames, three hops
From the crust to the stars, one hop at a time. Only the middle hop is a big turn; the outer two are tiny corrections that still matter at orbital distances.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="6" y="40" width="62" height="30" rx="4"/>
    <rect x="102" y="40" width="62" height="30" rx="4"/>
    <rect x="198" y="40" width="62" height="30" rx="4"/>
    <rect x="292" y="40" width="62" height="30" rx="4"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">
    <text x="37" y="60">ITRF</text><text x="133" y="60">TIRS</text><text x="229" y="60">CIRS</text><text x="323" y="60">GCRF</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="70" y1="55" x2="94" y2="55"/><line x1="166" y1="55" x2="190" y2="55"/><line x1="262" y1="55" x2="284" y2="55"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="100,55 92,51 92,59"/><polygon points="196,55 188,51 188,59"/><polygon points="290,55 282,51 282,59"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1d6fd1">
    <text x="85" y="30">W</text><text x="181" y="30">R</text><text x="276" y="30">Q</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="85" y="92">polar motion</text><text x="181" y="92">Earth rotation</text><text x="276" y="92">prec.–nutation</text>
  </g>
  <text x="37" y="20" font-size="11" text-anchor="middle" fill="#6c7a93">crust</text>
  <text x="323" y="20" font-size="11" text-anchor="middle" fill="#6c7a93">stars</text>
</svg>
```
:::

::: context oblate Earth's bulge
Because it spins, the Earth is squashed: its radius at the equator ($6\,378.137\,\mathrm{km}$) is about $21\,\mathrm{km}$ bigger than its radius to the poles ($6\,356.752\,\mathrm{km}$). That is a flattening of about $1$ part in $298$ — the WGS-84 number from lesson 06. It is the same bulge that the $J_2$ term describes in gravity models, and the same bulge that slowly turns satellite orbits. Here it is the handle the Sun and Moon grab to twist the Earth's axis.
:::

::: context precession-cone The axis sweeps a cone
The ecliptic pole stays fixed. The Earth's spin axis leans $23.44^\circ$ from it and slowly circles around it, once in about $25\,800$ years, sweeping out a cone. Seen from above the ecliptic's north pole, the circling is clockwise — the opposite way to the Earth's spin.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="150" x2="180" y2="28" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="186" y="24" font-size="11" fill="#6c7a93">ecliptic pole</text>
  <ellipse cx="180" cy="49.1" rx="43.8" ry="10" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="180" y1="150" x2="136.2" y2="49.1" stroke="#8fb8f0" stroke-width="1.5"/>
  <line x1="180" y1="150" x2="223.8" y2="49.1" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="230" y="52" font-size="12" fill="#1f2a44">spin axis</text>
  <path d="M 180,110 A 40,40 0 0,1 195.9,113.3" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="196" y="104" font-size="12" fill="#b4232c">23.44°</text>
  <circle cx="180" cy="150" r="25" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="147.9" y1="136.1" x2="212.1" y2="163.9" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="222" y="172" font-size="11" fill="#1f2a44">equator</text>
  <text x="40" y="60" font-size="11" fill="#1d6fd1">path of the axis</text>
  <text x="40" y="74" font-size="11" fill="#1d6fd1">(~25 800 years)</text>
</svg>
```
:::


::: context lunar-node The Moon's tilted, turning orbit
The Moon's orbit is tilted about $5.1^\circ$ to the ecliptic. The two points where it crosses the ecliptic are its **nodes**. The Sun's pull makes that tilted orbit swing around, so the nodes slide backward along the ecliptic and complete a lap every $18.6$ years. As the orbit swings, the Moon's pull on Earth's bulge rises and falls with the same period — and so the axis nods with the same period. The same $18.6$-year cycle governs when eclipses can happen.
:::

::: context chandler A wobble nobody predicted in time
In 1891 the American astronomer Seth Carlo Chandler found, from old records of star positions, that latitudes changed with a period of about $14$ months. Theory for a rigid Earth had predicted about $10$ months. The difference turned out to be because the Earth is slightly elastic and has oceans that slosh. Without something to keep kicking it, the wobble would die away over decades; the atmosphere and oceans keep it alive.
:::

::: context pole-offset The pole in meters
The example's polar motion, drawn to scale on the ground at the North Pole. One arcsecond of pole offset is about $31\,\mathrm{m}$ on the Earth's surface, so $x_p = 0.15''$ is $4.6\,\mathrm{m}$ toward Greenwich and $y_p = 0.35''$ is $10.8\,\mathrm{m}$ toward $90^\circ$ west: the true axis pokes out about $11.8\,\mathrm{m}$ from the reference pole.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="150" y1="130" x2="290" y2="130" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="296,130 286,125 286,135" fill="#6c7a93"/>
  <text x="230" y="150" font-size="11" fill="#1f2a44">x toward Greenwich</text>
  <line x1="150" y1="130" x2="150" y2="20" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="150,14 145,24 155,24" fill="#6c7a93"/>
  <text x="18" y="24" font-size="11" fill="#1f2a44">y toward 90° W</text>
  <line x1="187.1" y1="130" x2="187.1" y2="43.4" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="150" y1="43.4" x2="187.1" y2="43.4" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="150" y1="130" x2="187.1" y2="43.4" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="187.1" cy="43.4" r="4" fill="#b4232c"/>
  <circle cx="150" cy="130" r="4" fill="#1f2a44"/>
  <text x="196" y="44" font-size="11" fill="#b4232c">true axis</text>
  <text x="84" y="150" font-size="11" fill="#1f2a44">ITRF pole</text>
  <text x="170" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">4.6 m</text>
  <text x="96" y="90" font-size="11" fill="#1f2a44">10.8 m</text>
  <line x1="240" y1="80" x2="320" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <text x="280" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">10 m</text>
</svg>
```
:::

::: context teme Why SGP4 speaks TEME
SGP4 is the analytic orbit model behind the two-line element sets that the US Space Force publishes for tens of thousands of objects. Its equations were set down in 1980 (Spacetrack Report No. 3), in a frame convenient for the computers of the day: the true equator of date, but a mean equinox. Every TLE-derived position still comes out in that frame. Feeding TEME straight into code that expects GCRF or J2000 is a classic error of tens of kilometers at LEO.
:::

::: context polaris The North Star is temporary
Polaris is the North Star only for now. Because the axis circles the ecliptic pole, the point in the sky it aims at moves too. Polaris will come closest, within about half a degree, around the year 2100 and then slowly fall away. About 4,800 years ago the pole was near the star Thuban, and in roughly 12,000 years it will be within a few degrees of the bright star Vega.
:::
