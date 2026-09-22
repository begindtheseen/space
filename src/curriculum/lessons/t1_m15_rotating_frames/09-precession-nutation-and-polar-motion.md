---
id: l09-precession-nutation-and-polar-motion
title: Precession, nutation and polar motion
minutes: 22
covers:
  - precession, nutation, polar motion
---

Lesson 05 rotated ECI into ECEF with a single matrix $\mathbf{R}_3(\theta)$ about a shared $z$ axis. That model assumes the Earth's spin axis is fixed in inertial space and fixed in the crust. Neither is true. The spin axis sweeps out a cone in inertial space once every $26\,000$ years, wobbles on that cone with an $18.6$-year period, and wanders around inside the Earth by several metres on a $14$-month cycle. Each motion is small in angle and large in metres at orbital distances: the accumulated drift of the pole since the year 2000 alone displaces a low-orbit satellite's ground position by eighteen kilometres if it is ignored.

The full rotation from GCRF to ITRF is therefore a chain of three matrices: one for the motion of the axis in inertial space (precession and nutation), one for the Earth's rotation about that axis (the Earth rotation angle from UT1, lesson 08), and one for the motion of the axis relative to the crust (polar motion). This lesson describes each motion — what causes it, how big it is, how it is modelled and where the numbers come from — and assembles the chain in the module's notation. It does not derive the thousand-term nutation series; nobody types those in by hand. It does give you the structure, the magnitudes, and the two consistency rules that keep an implementation from being silently wrong by half a degree.

The practical payoff is the ability to read an Earth-orientation product — a line of IERS Bulletin A, an SGP4 output frame, a star tracker's attitude — and know which of the three matrices it presupposes.

## The chain

The IERS Conventions write the transformation from the terrestrial frame to the celestial one as

$$
\mathbf{r}^{GCRF} = \mathbf{Q}(t)\,\mathbf{R}(t)\,\mathbf{W}(t)\,\mathbf{r}^{ITRF} ,
$$

where each factor is a rotation matrix and each has a name and an intermediate frame on either side of it:

- $\mathbf{W}(t)$, **polar motion**, takes ITRF to the Terrestrial Intermediate Reference System (TIRS), whose $z$ axis is the instantaneous rotation axis rather than the conventional crust-fixed pole. In the module's notation, $\mathbf{W} = \mathbf{R}_{TIRS \leftarrow ITRF}$.
- $\mathbf{R}(t)$, **Earth rotation**, takes TIRS to the Celestial Intermediate Reference System (CIRS) by rotating about that axis through the Earth rotation angle: $\mathbf{R}(t) = \mathbf{R}_3(-\theta_{ERA}) = \mathbf{R}_{CIRS \leftarrow TIRS}$.
- $\mathbf{Q}(t)$, **precession–nutation** (with the frame bias folded in), takes CIRS to GCRF by tilting the instantaneous axis back onto the GCRF pole: $\mathbf{Q} = \mathbf{R}_{GCRF \leftarrow CIRS}$.

Read as dominoes, $\mathbf{R}_{GCRF \leftarrow ITRF} = \mathbf{R}_{GCRF \leftarrow CIRS}\,\mathbf{R}_{CIRS \leftarrow TIRS}\,\mathbf{R}_{TIRS \leftarrow ITRF}$, inner labels matching. The direction this module usually needs is the transpose:

$$
\mathbf{R}_{ITRF \leftarrow GCRF} = \mathbf{W}^{T}\,\mathbf{R}_3(\theta_{ERA})\,\mathbf{Q}^{T} .
$$

Set $\mathbf{Q} = \mathbf{W} = \mathbf{I}$ and this collapses to the $\mathbf{R}_3(\theta)$ of lesson 05, which is the check that the signs are consistent with everything before. The two outer matrices are within a fraction of a degree of the identity; the middle one is a full rotation. The sizes: $\mathbf{Q}$ differs from the identity by about $0.15^\circ$ today and grows; $\mathbf{W}$ by a few tenths of an arcsecond; and the error in $\theta_{ERA}$ from using UTC in place of UT1 is up to $13.5''$.

## Precession

The Earth is an oblate spheroid, and the Sun and Moon pull harder on the near side of its equatorial bulge than on the far side. Because the equator is tilted $23.44^\circ$ to the ecliptic (the obliquity, $\varepsilon$), that differential pull is a torque trying to pull the bulge into the ecliptic plane. A spinning body responds to a torque perpendicular to its spin by precessing, exactly as the rigid-body module described for a gyroscope: the spin axis moves at right angles to the torque, tracing a cone about the ecliptic pole with half-angle $\varepsilon$. This is luni-solar precession, and its rate is set by the Earth's $J_2$, its spin rate, and the masses and distances of the Moon and Sun.

The numbers, from the IAU 1976 theory (the IAU 2006 update changes them in the fifth significant figure):

- The equinox moves westward along the ecliptic at $p = 50.29''$ per year, so one full circuit — the Platonic year — takes $360 \times 3600 / 50.29 = 25\,770$ years, "about $26\,000$".
- Resolved in equatorial coordinates, the precession moves the pole at $n = 20.04''$ per year (this is $p\sin\varepsilon$) and shifts right ascensions at $m = 46.12''$ per year (this is $p\cos\varepsilon$).
- Since J2000.0, $26.72$ years to the date of writing, the equinox has moved $1\,344''= 0.373^\circ$ along the ecliptic and the pole has moved $536'' = 0.149^\circ$.

The pole's motion is the one that matters for positions: a rotation of the frame's $z$ axis by $0.149^\circ$ displaces a point at LEO radius by $6\,878\,137 \times 0.149 \times \pi/180 = 17.9\,\mathrm{km}$, and at geostationary radius by $109\,\mathrm{km}$. The right-ascension shift is what separates GMST from the ERA, as lesson 08 found: $46.12'' \times 26.72 = 1\,232''= 0.342^\circ$.

In the classical, equinox-based formulation the precession matrix $\mathbf{P}$ from the J2000 mean equator and equinox to the *mean equator and equinox of date* is a 3-2-3 sequence of three small angles, whose leading terms in $T$, the number of Julian centuries of TT since J2000.0, are

$$
\zeta_A = 2306.2181''\,T, \qquad \theta_A = 2004.3109''\,T, \qquad z_A = 2306.2181''\,T ,
$$

plus quadratic and cubic corrections at the arcsecond level. For $T = 0.2672$, $\theta_A = 535.6''$ — the pole displacement — and $\zeta_A + z_A = 1\,232.6''$ — the right-ascension shift. The two $z$-rotations nearly cancel in their effect on the pole and add in their effect on the equinox; the $y$-rotation tilts the pole. Vallado's *Fundamentals of Astrodynamics* gives the full coefficients and the exact composition for both the 1976 and 2006 theories.

## Nutation

Precession is the smooth average. On top of it the torque varies because the Moon's orbit is inclined $5.1^\circ$ to the ecliptic and its node regresses once round the ecliptic every $18.6$ years, and because the Sun's and Moon's distances and declinations cycle through the year and the month. The axis responds with small periodic oscillations about the mean precessional path: nutation. The classical description gives two angles, the nutation in longitude $\Delta\psi$ (along the ecliptic, changing the position of the equinox) and the nutation in obliquity $\Delta\varepsilon$ (changing the tilt), as sums of periodic terms in the fundamental arguments of the Sun and Moon. The dominant term has the period of the lunar node:

$$
\Delta\psi \approx -17.20''\,\sin\Omega_{\mathrm{Moon}}, \qquad \Delta\varepsilon \approx +9.20''\,\cos\Omega_{\mathrm{Moon}}, \qquad \text{period } 18.6\,\mathrm{yr} ,
$$

where $\Omega_{\mathrm{Moon}}$ is the longitude of the Moon's ascending node. The next largest are a semi-annual solar term ($1.3''$ in longitude, $0.57''$ in obliquity) and a fortnightly lunar term ($0.2''$). The IAU 1980 series had $106$ terms; IAU 2000A has $1\,365$ and is accurate to $0.2$ milliarcseconds; the truncated IAU 2000B keeps $77$ terms and is good to $1\,\mathrm{mas}$, which at LEO is $3\,\mathrm{cm}$ and is what most flight code uses.

Applying the nutation matrix $\mathbf{N}$ to the mean-of-date frame gives the *true equator and equinox of date*, the frame in which the Earth actually rotates. The $9.2''$ and $17.2''$ amplitudes correspond at LEO radius to $307\,\mathrm{m}$ and $574\,\mathrm{m}$: ignore nutation and a satellite's ground position slides back and forth by half a kilometre on an $18.6$-year cycle. Not fatal for a weather satellite; fatal for laser ranging or a GNSS orbit product.

::: key
Precession is the roughly $26\,000$-year conical drift of the spin axis in inertial space ($50.3''$ per year along the ecliptic, $20.0''$ per year in the pole's position). Nutation is the smaller periodic wobble on top of it, dominated by an $18.6$-year lunar term of $17.2''$ in longitude and $9.2''$ in obliquity. Polar motion is the metre-scale wander of the rotation axis relative to the crust, measured and published by the IERS.
:::

### Two formulations, one rule

Since 2003 the IAU has recommended a formulation that dispenses with the equinox altogether. The instantaneous rotation axis, the Celestial Intermediate Pole (CIP), is located in the GCRF by two direction cosines $X$ and $Y$, given as series in $T$ whose leading terms are $X \approx 2004.19''\,T$ and $Y \approx -0.03''\,T - 22.41''\,T^2$ — that is, $X$ *is* the accumulated $\theta_A$ plus the nutation, and $Y$ is small. The matrix $\mathbf{Q}$ is built directly from $X$, $Y$ and a tiny angle $s$ that positions the zero of longitude on the moving equator at the Celestial Intermediate Origin (CIO), a point defined so that it has no motion along the equator. The Earth rotation angle $\theta_{ERA}$ of lesson 08 is measured from the CIO.

The equinox-based chain uses instead $\mathbf{R}_3(\theta_{GAST})\,\mathbf{N}\,\mathbf{P}\,\mathbf{B}$, with $\mathbf{B}$ the frame bias, $\mathbf{P}$ precession, $\mathbf{N}$ nutation, and Greenwich *apparent* sidereal time $\theta_{GAST} = \theta_{GMST} + \Delta\psi\cos\varepsilon$ (the equation of the equinoxes) measured from the true equinox of date. Both chains produce the same $\mathbf{R}_{ITRF \leftarrow GCRF}$ to the microarcsecond. The rule is that the rotation angle and the precession–nutation matrix must come from the *same* formulation: ERA pairs with the CIO-based $\mathbf{Q}(X, Y, s)$; GAST pairs with $\mathbf{N}\mathbf{P}\mathbf{B}$. Pair ERA with $\mathbf{N}\mathbf{P}\mathbf{B}$ and the zero of longitude is wrong by the accumulated precession in right ascension — the $0.342^\circ$ above, which is $41\,\mathrm{km}$ at LEO. It looks like a clock error of $82\,\mathrm{s}$ and is hunted as one for weeks.

::: example What the simple model of lesson 05 leaves out
A satellite at $500\,\mathrm{km}$ altitude, $r = 6\,878\,137\,\mathrm{m}$, is converted from GCRF to "ECEF" in 2026 with $\mathbf{R}_3(\theta)$ alone, $\mathbf{Q} = \mathbf{W} = \mathbf{I}$.

*Axis tilt.* The true rotation axis is $\sqrt{X^2 + Y^2} = \sqrt{535.6^2 + 1.6^2} = 535.6''$ from the GCRF $z$ axis (precession since J2000, before nutation). Rotating about the wrong axis mislocates the satellite in the crust-fixed frame by up to $r \times 535.6'' \times \pi / 648\,000 = 6\,878\,137 \times 2.597 \times 10^{-3} = 17.9\,\mathrm{km}$, the exact value depending on where in the orbit it is. Nutation adds up to $\pm 574\,\mathrm{m}$ on top.

*Zero point.* If $\theta$ is the ERA, the rotation is measured from the CIO, which sits near the GCRF $x$ axis; but with $\mathbf{Q} = \mathbf{I}$ nothing has moved the equator, so the reference meridian ends up $0.342^\circ$ from where it belongs: $6\,878\,137 \times 0.342 \times \pi/180 = 41\,\mathrm{km}$ east–west. If $\theta$ is GMST, that shift is already inside the sidereal-time polynomial and the zero-point error is only the equation of the equinoxes, at most about $16''$ — $1.1\,\mathrm{s}$ of time — or $0.5\,\mathrm{km}$.

*Polar motion.* Omitting $\mathbf{W}$ costs up to $0.3''$, $10\,\mathrm{m}$.

*UT1.* Using UTC costs up to $0.9\,\mathrm{s}$, $450\,\mathrm{m}$.

So the simple model with GMST is wrong by about $18\,\mathrm{km}$ and the simple model with ERA by about $45\,\mathrm{km}$, both dominated by precession; the fixes, in order of value, are $\mathbf{Q}$, then UT1, then nutation within $\mathbf{Q}$, then $\mathbf{W}$. This is the error budget the stretch part of this module's coding exercise asks you to measure against a real ephemeris.
:::

## Polar motion

The two matrices so far describe where the rotation axis points in *inertial* space. The axis also moves relative to the *crust*: the point where it pierces the surface wanders in a rough circle of a few metres' radius around the conventional ITRF pole. The motion has three main parts:

- The **Chandler wobble**, a free nutation of the Earth as an elastic body, with a period of about $433$ days ($14$ months) and an amplitude of $0.1''$ to $0.2''$ ($3$ to $6\,\mathrm{m}$), excited by the atmosphere and oceans.
- An **annual** term of about $0.1''$, forced by seasonal mass redistribution.
- A slow **drift** of the mean pole, about $10\,\mathrm{cm}$ per year, from post-glacial rebound and ice-mass changes.

The IERS publishes the pole coordinates $x_p$ and $y_p$, the offsets of the CIP from the ITRF pole in arcseconds along the reference meridian and along $90^\circ$ west, in Bulletin A daily with predictions, alongside $\Delta\mathrm{UT1}$. Unlike precession and nutation, polar motion has no accurate long-range theory; it is a measured, weather-like quantity, and a flight system that needs it must be uploaded with current values. The combined total rarely exceeds $0.3''$, or $9\,\mathrm{m}$ on the surface. Its effect on the rotation matrix is

$$
\mathbf{W} = \mathbf{R}_{TIRS \leftarrow ITRF} = \mathbf{R}_3(-s')\,\mathbf{R}_2(x_p)\,\mathbf{R}_1(y_p) ,
$$

with the elementary rotations of lesson 01 and $s'$ an angle of about $-47$ microarcseconds per century that positions the terrestrial origin and is negligible for everything in this module. Because $x_p$ and $y_p$ are microradians, the matrix is the identity plus a skew part, and the displacement of an ITRF position $\mathbf{r} = (x, y, z)$ into TIRS is, to first order, $\Delta\mathbf{r} = (-x_p z,\; y_p z,\; x_p x - y_p y)$.

::: example Polar motion at a launch pad
Take $x_p = 0.15''$ and $y_p = 0.35''$, a plausible pair, so $x_p = 7.27 \times 10^{-7}\,\mathrm{rad}$ and $y_p = 1.70 \times 10^{-6}\,\mathrm{rad}$. SLC-40's ITRF position is $\mathbf{r} = (917\,841,\; -5\,530\,566,\; 3\,031\,354)\,\mathrm{m}$ from lesson 06. The first-order displacement is

$$
\Delta\mathbf{r} = \begin{bmatrix} -x_p z \\ y_p z \\ x_p x - y_p y \end{bmatrix}
= \begin{bmatrix} -7.27 \times 10^{-7} \times 3\,031\,354 \\ 1.70 \times 10^{-6} \times 3\,031\,354 \\ 7.27 \times 10^{-7} \times 917\,841 + 1.70 \times 10^{-6} \times 5\,530\,566 \end{bmatrix}
= \begin{bmatrix} -2.20 \\ 5.14 \\ 10.05 \end{bmatrix} \mathrm{m} ,
$$

magnitude $11.5\,\mathrm{m}$. The exact matrix product agrees to the centimetre, as the code below confirms. Eleven metres is nothing to a launch trajectory and everything to a laser-ranging station, a VLBI antenna or a GNSS reference receiver, whose positions are known to millimetres in ITRF and whose observations are reduced in the frame of the instantaneous axis.

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

With the chain in hand, the native frames of lesson 05 can be stated more precisely, and the quiz question about the star tracker answered in full.

A **star tracker** matches a catalogue whose positions are ICRF right ascensions and declinations, so its output is $\mathbf{R}_{GCRF \leftarrow S}$: the sensor's orientation in the celestial frame, not in any frame of date and certainly not in ITRF. To obtain the body attitude relative to the Earth-fixed frame — for pointing an antenna at a ground station, say — the chain is

$$
\mathbf{R}_{ITRF \leftarrow B} = \mathbf{W}^{T}\,\mathbf{R}_3(\theta_{ERA})\,\mathbf{Q}^{T}\,\mathbf{R}_{GCRF \leftarrow S}\,\mathbf{R}_{B \leftarrow S}^{T} ,
$$

every factor evaluated at the measurement epoch, $\theta_{ERA}$ from UT1. Leave out $\mathbf{Q}$ and the antenna points $0.15^\circ$ off; leave out the time-scale conversion and it points $15^\circ$ per hour of error off.

A **GNSS receiver** works entirely in ITRF and needs none of this, because the ephemerides are broadcast Earth-fixed; the moment its output is fused with a star tracker or an inertial propagator, the whole chain has to be right.

A **two-line element set** propagated with SGP4 produces positions in TEME, "true equator, mean equinox": a frame of date using the true (nutated) pole but a mean equinox, chosen for the convenience of the original 1970s analytic theory. Converting TEME to ITRF uses $\mathbf{R}_3(\theta_{GMST})$ followed by $\mathbf{W}^{T}$, with GMST — not GAST, not ERA — because the mean equinox is TEME's zero of longitude. Converting TEME to GCRF needs the nutation and precession undone. The stretch part of this module's coding exercise, comparing a simple propagation against a real TLE, meets exactly this frame.

**IERS Bulletin A** supplies the measured and predicted $x_p$, $y_p$, $\Delta\mathrm{UT1}$ and length-of-day excess. Any system that transforms between GCRF and ITRF at better than the kilometre level ingests it.

::: key
The full rotation is $\mathbf{R}_{ITRF \leftarrow GCRF} = \mathbf{W}^{T}\,\mathbf{R}_3(\theta_{ERA})\,\mathbf{Q}^{T}$: polar motion, Earth rotation from UT1, precession–nutation. Sizes in 2026 for a LEO satellite: $\mathbf{Q}$ about $0.15^\circ$ ($18\,\mathrm{km}$), nutation within it up to $17''$ ($0.6\,\mathrm{km}$), $\Delta\mathrm{UT1}$ up to $0.9\,\mathrm{s}$ ($0.45\,\mathrm{km}$), $\mathbf{W}$ up to $0.3''$ ($10\,\mathrm{m}$).
:::

::: warning
The rotation angle and the precession–nutation matrix must come from the same formulation. The ERA (measured from the CIO) pairs with the CIO-based $\mathbf{Q}(X, Y, s)$; Greenwich apparent sidereal time (measured from the true equinox) pairs with the equinox-based $\mathbf{N}\mathbf{P}\mathbf{B}$; GMST pairs with the *mean* equinox and hence with TEME. Mixing them misplaces the zero of longitude by the accumulated precession in right ascension, $0.34^\circ$ in 2026 and growing by $46''$ a year — an error that masquerades as an $82\,\mathrm{s}$ clock offset.
:::

::: warning
Polar motion and $\Delta\mathrm{UT1}$ cannot be computed; they are measured and must be uploaded. A system that hard-codes them, or lets its Earth-orientation file go stale, degrades gracefully in position — metres for polar motion, hundreds of metres for UT1 after a year of unmodelled length-of-day excess — and ungracefully in trust, because nothing flags the staleness. Timestamp the EOP data and alarm on its age.
:::

## Check yourself

::: check
Explain in two or three sentences why the Earth's spin axis precesses, in the direction it does, and what a spacecraft attitude system built around Polaris as a fixed reference would experience over a decade.
:::

::: answer
The Sun and Moon pull more strongly on the near half of the Earth's equatorial bulge than on the far half, and because the equator is tilted $23.4^\circ$ to the ecliptic the net effect is a torque tending to pull the bulge toward the ecliptic plane. A spinning body responds to a torque perpendicular to its angular momentum by moving the spin axis perpendicular to both, so the axis, instead of falling toward the ecliptic, circles the ecliptic pole — westward, opposite to the Earth's spin, the sense of precession of a top whose gravity torque acts in the same geometry. Over a decade the pole moves $200''$ along that circle. Polaris is currently $40'$ from the pole and closing; a system that treated it as *the* pole would already be $0.7^\circ$ wrong, and would find its "fixed" reference drifting by three arcminutes per decade relative to the true axis. A star tracker avoids the problem by using the whole catalogue in the GCRF, which does not precess.
:::

::: check
A GEO communications satellite's ground segment computes the satellite's Earth-fixed position for antenna pointing using GMST and the J2000 axes, with no precession or nutation. Estimate the pointing error for a ground antenna, and say whether it matters for a $1^\circ$ beamwidth.
:::

::: answer
The dominant omission is the pole tilt $\theta_A \approx 536''$, a rotation of the frame's $z$ axis by $0.149^\circ$. At GEO radius $42\,164\,\mathrm{km}$ that misplaces the satellite by up to $42\,164 \times 2.597 \times 10^{-3} = 109\,\mathrm{km}$, mostly north–south since the tilt moves the equatorial plane. Seen from a ground antenna at a range of roughly $38\,000\,\mathrm{km}$, $109\,\mathrm{km}$ subtends $109 / 38\,000 = 2.9 \times 10^{-3}\,\mathrm{rad} = 0.16^\circ$. With GMST the zero point of longitude is nearly right (the $0.34^\circ$ precession in right ascension is inside the GMST polynomial), so the east–west error is only the equation of the equinoxes, at most about $16''$, which at GEO is $3\,\mathrm{km}$. For a $1^\circ$ beamwidth a $0.16^\circ$ error is a few tenths of a decibel of loss and would go unnoticed; for a $0.2^\circ$ Ka-band beam it is a lost link. Either way the fix is one matrix.
:::

::: check
Why does the IERS publish polar motion and $\Delta\mathrm{UT1}$ from observations, with predictions only weeks ahead, when precession and nutation are computed from series accurate to a fraction of a milliarcsecond for decades?
:::

::: answer
Precession and nutation are the *forced* response of the whole Earth to the gravitational torques of the Sun, Moon and planets, whose positions are known essentially perfectly for centuries; the response of a nearly rigid body to a perfectly known forcing can be computed as a series, and the small unmodelled parts (a free core nutation of about $0.2\,\mathrm{mas}$) are the only corrections observed. Polar motion and the length of day, by contrast, are driven mostly by the redistribution of angular momentum between the solid Earth and the atmosphere, oceans and core — weather, in effect — which is not predictable beyond weeks. The Chandler wobble is a free oscillation whose amplitude and phase depend on how it has recently been excited. So the IERS measures them with VLBI, GNSS and laser ranging and publishes values with short predictions, and any system that needs them must be fed.
:::

::: check
Write the complete chain of matrices, with frame labels on every factor, that takes a star-tracker attitude quaternion (converted to a DCM) to the direction of the local vertical in body axes for a spacecraft over a known ITRF position. Say which time scale each time-dependent factor needs.
:::

::: answer
Let $\mathbf{R}_{GCRF \leftarrow S}$ be the tracker's output and $\mathbf{R}_{B \leftarrow S}$ its mounting matrix. Then $\mathbf{R}_{GCRF \leftarrow B} = \mathbf{R}_{GCRF \leftarrow S}\,\mathbf{R}_{B \leftarrow S}^{T}$. The Earth-fixed attitude is $\mathbf{R}_{ITRF \leftarrow B} = \mathbf{W}^{T}(x_p, y_p)\,\mathbf{R}_3(\theta_{ERA}(\mathrm{UT1}))\,\mathbf{Q}^{T}(\mathrm{TT})\,\mathbf{R}_{GCRF \leftarrow B}$: polar motion from Bulletin A (no time-scale subtlety beyond the date), the Earth rotation angle from UT1 (UTC plus $\Delta\mathrm{UT1}$), and precession–nutation from $T$ in TT (UTC plus $69.184\,\mathrm{s}$). The local down direction at the spacecraft's geodetic position is the third row of $\mathbf{R}_{N \leftarrow E}$ from lesson 06, call it $\hat{\mathbf{d}}^{ITRF}$. In body axes, $\hat{\mathbf{d}}^{B} = \mathbf{R}_{ITRF \leftarrow B}^{T}\,\hat{\mathbf{d}}^{ITRF}$. Every arrow's inner labels match; every time argument is named; and if any of the three Earth-orientation factors is stale, the down vector is wrong by the amounts in this lesson's key block.
:::

::: check
Distinguish the frame bias between J2000 and GCRF from precession, and say which is safe to ignore in a system with a $100\,\mathrm{m}$ position requirement at LEO.
:::

::: answer
The frame bias is a fixed, time-independent rotation of a few tens of milliarcseconds between two definitions of the same nominally inertial frame — the J2000 dynamical equator and equinox, and the ICRF axes realised by quasars. It was a one-off consequence of the accuracy of the 1990s data and never grows. Precession is the secular motion of the true pole and equinox away from either of those fixed frames, $20''$ per year in the pole, and it has already accumulated to $536''$. At LEO radius $1\,\mathrm{mas}$ is $3.3\,\mathrm{cm}$, so the frame bias of about $23\,\mathrm{mas}$ is under a metre and is safely ignored at the $100\,\mathrm{m}$ level; precession is $18\,\mathrm{km}$ and cannot be ignored at any level a navigation system would call a requirement. The confusion arises because both are "small rotations of the inertial frame"; the difference is that one is a constant and the other has a rate.
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

This closes the module. Lessons 01 to 03 gave the mathematics of frames and rotating observers; lessons 04 to 09 populated the aerospace frame zoo and the clocks that drive it. The attitude-representations module that follows takes the single object this module used everywhere — the rotation matrix — and asks how best to store, propagate and estimate it on a flight computer.
