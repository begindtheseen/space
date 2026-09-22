---
id: l05-eci-ecef-and-the-earth-rotation-rate
title: ECI, ECEF and the Earth rotation rate
minutes: 21
covers:
  - Earth rotation rate
  - ECI (J2000 / GCRF) and ECEF (ITRF)
---

Every orbit is propagated in a frame that does not rotate, because that is where Newton's law and the two-body problem live. Every launch pad, tracking antenna, GNSS receiver and landing site is described in a frame that turns with the ground, because that is where they stay put. A vehicle's state has to pass between the two several times per second, and the passage is a rotation about the Earth's axis through an angle that grows at the Earth rotation rate. That rate, the two frames it connects, and the rotation matrix between them are the subject of this lesson.

Both frames have several names, and the names matter. The inertial frame is called ECI in flight software, J2000 when its axes are defined by the equator and equinox of a particular date, and GCRF when they are defined by distant radio sources. The Earth-fixed frame is called ECEF in flight software, ITRF when it is realised by a network of geodetic stations, and WGS-84 when it is realised by the GPS constellation. Within each family the differences are metres or less; between the two families the difference is a rotation of hundreds of kilometres per minute. Knowing which family a vector belongs to is not optional.

This lesson defines each frame, pins down the Earth's rotation rate and the several "days" it produces, builds and verifies the simple rotation between the frames, converts a state vector both ways, and shows why a satellite's ground track marches west. The refinements — precession, nutation, polar motion, and the difference between UT1 and UTC — are named here and treated in the last two lessons of the module.

## The Earth rotation rate

The Earth turns eastward about its spin axis at

$$
\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s} ,
$$

the value adopted by WGS-84 and by the IERS conventions. In more familiar units that is

$$
\omega_E = 7.292115 \times 10^{-5} \times \frac{180}{\pi} \times 3600 = 15.041\,^\circ/\mathrm{h} = 15.041\,''/\mathrm{s} ,
$$

so the Earth turns through one arcsecond in about a fifteenth of a second, and a point on the equator moves at $\omega_E R = 7.292115 \times 10^{-5} \times 6\,378\,137 = 465\,\mathrm{m/s}$ relative to inertial space — the number that keeps appearing in this module's warnings.

### Why it is not $2\pi$ per 24 hours

The solar day of $86\,400\,\mathrm{s}$ is the interval between successive noons. In one solar day the Earth also moves about $1/365$ of the way round the Sun, so it must turn slightly more than one full revolution to bring the Sun back overhead. Over a year of $365.2422$ solar days it makes $366.2422$ turns relative to the stars. Hence the rotation period relative to the stars, the *sidereal day*, is

$$
T_{sid} = 86\,400 \times \frac{365.2422}{366.2422} = 86\,164.09\,\mathrm{s} = 23\,\mathrm{h}\;56\,\mathrm{min}\;4.09\,\mathrm{s} ,
$$

which is $235.9\,\mathrm{s}$, about $3\,\mathrm{min}\;56\,\mathrm{s}$, shorter than the solar day. That is why a given star rises four minutes earlier each night, and why a satellite's inertially fixed orbit plane comes back over the same ground point about four minutes earlier each day.

### Two rotation periods, eight milliseconds apart

Here is a subtlety that catches people who compute $2\pi / \omega_E$ and compare it with the sidereal day. With the value above,

$$
\frac{2\pi}{\omega_E} = \frac{6.283185}{7.292115 \times 10^{-5}} = 86\,164.10\,\mathrm{s} ,
$$

while the mean sidereal day is $86\,164.0905\,\mathrm{s}$. The two differ by about $8\,\mathrm{ms}$, and the difference is real. The sidereal day is measured against the vernal equinox, the point where the Sun crosses the equator northward. The equinox is not fixed: it drifts westward along the ecliptic at about $50.3''$ per year because of the precession of the Earth's axis (the subject of the last lesson), which in right ascension amounts to about $46''$ per year, or $0.13''$ per day. The Earth reaches the moving equinox $0.13'' / (15''/\mathrm{s}) \approx 0.008\,\mathrm{s}$ before it completes a full turn relative to the truly fixed directions of the distant quasars. So:

- $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$ is the rotation rate relative to the inertial (quasar-defined) frame. Its period, $86\,164.10\,\mathrm{s}$, is sometimes called the stellar day.
- $86\,164.0905\,\mathrm{s}$ is the mean sidereal day, the period relative to the precessing equinox, and corresponds to a slightly larger rate of $7.2921158553 \times 10^{-5}\,\mathrm{rad/s}$ — which WGS-84 also lists, for use in sidereal-time formulas.

For any flight computation at the metre level the choice is irrelevant: $8\,\mathrm{ms}$ per day of rotation is $4\,\mathrm{m}$ per day at the equator. For an understanding of what each number counts it is the whole point. When a formula says "sidereal", ask whether it is referenced to the equinox or to the celestial frame; the ERA formula in the time-scales lesson uses the latter.

The rate itself is not perfectly constant. The length of day wanders by a millisecond or two over months and years (tides, atmospheric angular momentum, the core), and over centuries it lengthens by about $2\,\mathrm{ms}$ per century from tidal friction. A millisecond of unmodelled rotation is $0.47\,\mathrm{m}$ at the equator; over a year it accumulates to hundreds of metres. That is why precise work does not integrate $\omega_E t$ but reads the accumulated rotation from a measured time scale, UT1, which the time-scales lesson defines.

::: key
$\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s} \approx 15.041\,^\circ/\mathrm{h}$; one sidereal day is $86\,164.0905\,\mathrm{s}$, about $3\,\mathrm{min}\;56\,\mathrm{s}$ shorter than the $86\,400\,\mathrm{s}$ solar day. The Earth makes $366.2422$ turns in a year of $365.2422$ solar days. $2\pi / \omega_E$ is $8\,\mathrm{ms}$ longer than the sidereal day because the equinox precesses.
:::

## The Earth-centred inertial frame: J2000 and GCRF

An Earth-centred inertial (ECI) frame has its origin at the Earth's centre of mass and axes that do not rotate. The $z$ axis is along the Earth's spin axis toward the north celestial pole, the $x$ axis lies in the equatorial plane pointing at the vernal equinox, and $y = z \times x$ completes the right-handed set. In it a satellite's position is $\mathbf{r}^{I}$, its velocity $\mathbf{v}^{I}$, and the two-body equation $\ddot{\mathbf{r}} = -\mu\,\mathbf{r}/r^3$ holds with no Coriolis or centrifugal terms.

Two definitions of the axes are in use, and they differ by a tiny fixed rotation:

- **J2000** (also "mean equator and equinox of J2000.0", or EME2000) fixes the axes at the Earth's mean spin axis and mean equinox as they were at the epoch J2000.0, which is 1 January 2000 at 12:00 Terrestrial Time. Because the real spin axis precesses and nutates, the J2000 axes are a snapshot: after 2000 the true pole and true equinox moved away from them, but the frame stays where it was defined. Every published orbit of the last decades that says "J2000" means this.
- **GCRF**, the Geocentric Celestial Reference Frame, has axes defined by the catalogued directions of several hundred extragalactic radio sources — quasars so distant that their proper motions are unmeasurable — observed by very long baseline interferometry. It is the geocentric version of the International Celestial Reference Frame (ICRF). Its axes were chosen to coincide with J2000 as closely as the 1990s data allowed, and the residual offset, the *frame bias*, is a fixed rotation of a few tens of milliarcseconds. At geostationary radius that is about $5\,\mathrm{m}$; in low Earth orbit, under a metre.

For every purpose in this module J2000 and GCRF may be treated as the same frame, and "ECI" means either. When a requirements document names one, name the same one in the code, apply the frame bias when the accuracy budget is below ten metres, and never rotate a J2000 vector by the current precession angle "to bring it up to date" — that produces a frame of date, which is a different frame again.

### Quasi-inertial

The ECI origin is not at rest: the Earth's centre accelerates toward the Sun at $GM_\odot / (1\,\mathrm{au})^2 = 5.93 \times 10^{-3}\,\mathrm{m/s^2}$, and toward the Moon at a much smaller rate. Strictly, then, ECI is not inertial. It works as one for Earth satellites because the Sun accelerates the satellite by almost exactly the same amount as it accelerates the Earth's centre, and only the *difference* — the tidal acceleration, of order $10^{-6}\,\mathrm{m/s^2}$ in LEO — appears in the satellite's equation of motion. High-fidelity propagators include it as the third-body perturbation. For attitude dynamics the residual is far below anything a gyro can sense. Hence "quasi-inertial": non-rotating, with an origin whose acceleration is common to everything in the problem.

## The Earth-centred Earth-fixed frame: ITRF and WGS-84

An Earth-centred Earth-fixed (ECEF) frame shares the ECI origin but its axes are glued to the crust: $z$ along the conventional rotation axis toward the north pole, $x$ in the equatorial plane through the reference meridian, $y = z \times x$ pointing toward $90^\circ$ east. A launch pad, a laser ranging station or a surveyed runway threshold has constant coordinates in it, apart from the few centimetres a year of plate motion.

- **ITRF**, the International Terrestrial Reference Frame, is the IERS realisation: a set of a few hundred stations (GNSS, laser ranging, VLBI, DORIS) each with adopted coordinates and velocities at a reference epoch. The reference pole and meridian are conventional, chosen to keep continuity with earlier realisations; the IERS Reference Meridian passes about $100\,\mathrm{m}$ east of the historic Greenwich transit instrument, because it was defined by the network, not the telescope. Successive realisations — ITRF2014, ITRF2020 — agree at the millimetre to centimetre level.
- **WGS-84** is the frame of the GPS system, realised through the coordinates of its monitor stations and broadcast in the satellite ephemerides. Its recent realisations are aligned with ITRF at the centimetre level, so for flight purposes a GPS receiver's output *is* an ITRF position.

The ellipsoid, the gravity model and the geodetic latitude of the next lesson are all attached to this frame. So are the coordinates of everything on the ground. Anything a ground-based sensor measures — radar range and angles, a survey, a GNSS fix — is native to ECEF, and anything derived from the stars is native to ECI.

::: key
ECI/GCRF is quasi-inertial: axes fixed relative to distant quasars, origin at the Earth's centre; J2000 is the same frame to within a few tens of milliarcseconds of frame bias. ECEF/ITRF rotates with the crust, so ground stations and launch pads have fixed coordinates in it; WGS-84 is its GPS realisation. The two differ by the Earth rotation about $z$, plus the small corrections of precession, nutation and polar motion.
:::

## The rotation between them

Take the ECEF frame $E$ to be the ECI frame $I$ turned through the angle $\theta$ about their shared $z$ axis, where $\theta$ is the angle from the ECI $x$ axis eastward to the ECEF $x$ axis — the Greenwich sidereal angle or Earth rotation angle. Lesson 01's elementary rotation gives the coordinate transformation at once:

$$
\mathbf{r}^{E} = \mathbf{R}_{E \leftarrow I}\,\mathbf{r}^{I}, \qquad
\mathbf{R}_{E \leftarrow I} = \mathbf{R}_3(\theta) = \begin{bmatrix} \cos\theta & \sin\theta & 0 \\ -\sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}, \qquad
\mathbf{R}_{I \leftarrow E} = \mathbf{R}_3(\theta)^{T} .
$$

Verify it with a vector you understand. The ECEF $x$ axis (the reference meridian) is at angle $\theta$ from the ECI $x$ axis, so its ECI coordinates are $(\cos\theta, \sin\theta, 0)$. Pushing that through the matrix gives $(\cos^2\theta + \sin^2\theta,\; -\sin\theta\cos\theta + \cos\theta\sin\theta,\; 0) = (1, 0, 0)$, which is the ECEF $x$ axis in its own coordinates, as it must be. A second check: at $\theta = 90^\circ$ the ECI $x$ axis, $(1, 0, 0)$, maps to $(0, -1, 0)$ — a quarter of a turn *behind* the reference meridian, which has moved on to ECI $+y$. If your implementation gives $(0, +1, 0)$ you have the active matrix, and everything downstream is rotating the wrong way.

In the simplest model the angle grows uniformly,

$$
\theta(t) = \theta_0 + \omega_E\,(t - t_0) ,
$$

with $\theta_0$ the angle at a reference epoch $t_0$. Where $\theta_0$ comes from — a sidereal-time formula evaluated in UT1 — is the business of the time-scales lesson; the coding exercise for this module supplies it as a parameter.

### Position rotates; velocity rotates and shifts

Position is a bound vector from the common origin, so only its coordinates change: $\mathbf{r}^{E} = \mathbf{R}_3(\theta)\,\mathbf{r}^{I}$. Velocity is different in kind, as lesson 03 showed: the velocity relative to the Earth is a different physical vector from the velocity relative to inertial space. Differentiating $\mathbf{r}^{E} = \mathbf{R}_{E \leftarrow I}\mathbf{r}^{I}$,

$$
\dot{\mathbf{r}}^{E} = \mathbf{R}_{E \leftarrow I}\,\dot{\mathbf{r}}^{I} + \dot{\mathbf{R}}_{E \leftarrow I}\,\mathbf{r}^{I} .
$$

Lesson 02 gave $\dot{\mathbf{R}}_{I \leftarrow E} = \mathbf{R}_{I \leftarrow E}[\boldsymbol{\omega}^{E}_{E/I}\times]$; transposing, and using the skew-symmetry of the cross-product matrix, $\dot{\mathbf{R}}_{E \leftarrow I} = -[\boldsymbol{\omega}^{E}_{E/I}\times]\,\mathbf{R}_{E \leftarrow I}$. So

$$
\mathbf{v}^{E} = \mathbf{R}_3(\theta)\,\mathbf{v}^{I} - \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}, \qquad
\mathbf{v}^{I} = \mathbf{R}_3(\theta)^{T}\left(\mathbf{v}^{E} + \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}\right), \qquad
\boldsymbol{\omega}^{E}_{E/I} = \begin{bmatrix} 0 \\ 0 \\ \omega_E \end{bmatrix} ,
$$

the same relations lesson 03 derived from the transport theorem, now with the rotation matrix explicit. Two operations, two different kinds of thing: a change of coordinates and a change of physical vector.

::: example An ISS-like state, ECI to ECEF
A satellite in a $400\,\mathrm{km}$ circular orbit at $51.6^\circ$ inclination has, at some instant,

$$
\mathbf{r}^{I} = \begin{bmatrix} 3\,143\,570.5 \\ 5\,385\,797.9 \\ 2\,655\,990.8 \end{bmatrix} \mathrm{m}, \qquad
\mathbf{v}^{I} = \begin{bmatrix} -5\,588.821 \\ 695.418 \\ 5\,204.638 \end{bmatrix} \mathrm{m/s} ,
$$

with $|\mathbf{r}| = 6\,778\,137\,\mathrm{m}$ and $|\mathbf{v}| = 7\,668.56\,\mathrm{m/s}$. The Earth rotation angle is $\theta = 100^\circ$, so $\cos\theta = -0.173648$, $\sin\theta = 0.984808$.

Position:

$$
\mathbf{r}^{E} = \mathbf{R}_3(100^\circ)\,\mathbf{r}^{I} = \begin{bmatrix} -0.173648 \times 3\,143\,570.5 + 0.984808 \times 5\,385\,797.9 \\ -0.984808 \times 3\,143\,570.5 - 0.173648 \times 5\,385\,797.9 \\ 2\,655\,990.8 \end{bmatrix}
= \begin{bmatrix} 4\,758\,100.2 \\ -4\,031\,046.6 \\ 2\,655\,990.8 \end{bmatrix} \mathrm{m} .
$$

The length is unchanged at $6\,778\,137\,\mathrm{m}$, and the $z$ component is untouched, both as expected for a rotation about $z$. The satellite is over longitude $\arctan(-4\,031\,046.6 / 4\,758\,100.2) = -40.27^\circ$, that is $40.27^\circ$ west, at geocentric latitude $\arcsin(2\,655\,990.8 / 6\,778\,137) = 23.07^\circ$ north.

Velocity, step one, rotate: $\mathbf{R}_3(100^\circ)\,\mathbf{v}^{I} = (1\,655.34,\; 5\,383.16,\; 5\,204.64)\,\mathrm{m/s}$. Step two, subtract the frame velocity, $\boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E} = \omega_E(-y, x, 0) = (293.95,\; 346.97,\; 0)\,\mathrm{m/s}$, whose magnitude $454.7\,\mathrm{m/s}$ is $465\,\mathrm{m/s}$ scaled by $\cos 23.07^\circ$ and by $r / R$:

$$
\mathbf{v}^{E} = \begin{bmatrix} 1\,655.34 - 293.95 \\ 5\,383.16 - 346.97 \\ 5\,204.64 \end{bmatrix} = \begin{bmatrix} 1\,361.39 \\ 5\,036.19 \\ 5\,204.64 \end{bmatrix} \mathrm{m/s}, \qquad |\mathbf{v}^{E}| = 7\,369.2\,\mathrm{m/s} .
$$

The ground speed is $299\,\mathrm{m/s}$ less than the inertial speed, because a prograde satellite moves with the rotation. Now the error that the frame-naming discipline exists to catch: compute the inclination from $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ using $\mathbf{r}^{E}$ with the rotated-only velocity, and you get $51.60^\circ$, correct, since a rotation about $z$ leaves $h_z / |\mathbf{h}|$ alone. Use $\mathbf{r}^{E}$ with $\mathbf{v}^{E}$ — a GNSS receiver's raw output — and you get $53.87^\circ$. The orbit plane is off by more than two degrees, and nothing in the arithmetic complained.
:::

## Ground tracks

A satellite's orbit plane is very nearly fixed in ECI (the slow nodal regression from the Earth's oblateness aside). The Earth turns beneath it at $\omega_E$. So each time the satellite comes round to the same point of its orbit, the ground beneath has moved east by $\omega_E T$, and the ground track — the locus of the sub-satellite point in ECEF — has shifted *west* by

$$
\Delta\lambda = \omega_E\,T = 15.041\,^\circ/\mathrm{h} \times T .
$$

This is the rotation matrix in action: the same $\mathbf{r}^{I}$ one period later maps through $\mathbf{R}_3(\theta + \omega_E T)$ to a longitude $\omega_E T$ farther west. It is also the first thing the coding exercise for this module asks you to see in a plot.

::: example The Space Station's westward march
The ISS orbits at about $400\,\mathrm{km}$, where $a = 6\,778\,137\,\mathrm{m}$ and

$$
T = 2\pi\sqrt{\frac{a^3}{\mu}} = 2\pi\sqrt{\frac{(6.778137 \times 10^{6})^3}{3.986004418 \times 10^{14}}} = 5\,553.6\,\mathrm{s} = 92.56\,\mathrm{min} .
$$

In that time the Earth turns through $\omega_E T = 7.292115 \times 10^{-5} \times 5\,553.6 = 0.4050\,\mathrm{rad} = 23.20^\circ$, so successive equator crossings are $23.2^\circ$ of longitude apart, and at the equator that is $23.20 \times 111.3\,\mathrm{km} = 2\,580\,\mathrm{km}$ between passes. In one day of $86\,164\,\mathrm{s}$ the station makes $86\,164 / 5\,553.6 = 15.5$ revolutions, so the pattern does not close: the sixteenth crossing falls about half a spacing from the first, and the track fills in between earlier passes on subsequent days. Choosing $T$ so that $k$ revolutions take exactly $m$ sidereal days — $k\,T = m \times 86\,164.09\,\mathrm{s}$ — gives a repeat ground track, which is how Earth-observation orbits are designed. For a period of exactly $90\,\mathrm{min}$ the shift would be $22.56^\circ$, sixteen orbits per day, and the track would repeat daily.
:::

::: warning
Rotating a velocity from ECI to ECEF is not enough. $\mathbf{v}^{E} = \mathbf{R}_3(\theta)\,\mathbf{v}^{I} - \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$ has two terms, and the second is up to $465\,\mathrm{m/s}$ at the surface and $502\,\mathrm{m/s}$ at $500\,\mathrm{km}$. Position, by contrast, only rotates. A function named `eci_to_ecef` that takes a bare 3-vector cannot know which of the two it has been handed; give it the whole state, or name two functions.
:::

::: warning
"J2000" is a fixed frame, not the frame of today's equator and equinox. Applying the accumulated precession since 2000 to a J2000 vector does not "update" it; it moves it into a mean-of-date frame that nothing else in your system uses. Likewise "ECEF" and "WGS-84" and "ITRF2020" are the same frame to the centimetre, but "ECEF" and "ECI" are not the same frame to $465\,\mathrm{m/s}$. Keep the family name in the variable: `r_eci`, `r_ecef`.
:::

## Check yourself

::: check
Explain why the Earth completes about $366.24$ rotations relative to the stars in a year of $365.24$ solar days, and deduce the length of the sidereal day to the nearest second.
:::

::: answer
Each solar day the Earth turns until the Sun is back overhead. In that day the Earth has moved along its orbit by about $360^\circ / 365.24 \approx 0.986^\circ$, so the direction to the Sun has shifted by that much against the stars, and the Earth must turn $360.986^\circ$ — one full turn plus $0.986^\circ$ — to bring the Sun back. The extra $0.986^\circ$ per day accumulates to one full extra turn over the year: $365.24$ solar days contain $366.24$ turns relative to the stars. Each turn therefore takes $86\,400 \times 365.2422 / 366.2422 = 86\,164\,\mathrm{s}$, i.e. $23\,\mathrm{h}\;56\,\mathrm{min}\;4\,\mathrm{s}$.
:::

::: check
Your ECI-to-ECEF routine uses $\theta = \theta_0 + \omega_E(t - t_0)$ and the epoch angle $\theta_0$ is taken from a table that turns out to be tagged in the wrong time scale, so that it is in error by $1.0\,\mathrm{s}$ of time. What is the resulting position error for a ground station at the equator, and for one at $60^\circ$ latitude?
:::

::: answer
One second of rotation is $\omega_E \times 1\,\mathrm{s} = 7.292 \times 10^{-5}\,\mathrm{rad} = 15.04''$. A ground station's ECEF coordinates are correct, but its ECI position is rotated about $z$ by that angle, so the error is along east–west with magnitude $\omega_E\,d$, where $d$ is the station's distance from the spin axis. At the equator $d = 6\,378\,137\,\mathrm{m}$ and the error is $465\,\mathrm{m}$. At $60^\circ$ latitude $d \approx 6\,378\,137 \times \cos 60^\circ = 3\,189\,069\,\mathrm{m}$ and the error is $233\,\mathrm{m}$. A tracking antenna pointed with that ECI position would be aimed $15''$ off in azimuth-equivalent terms — harmless for a wide beam, fatal for a laser.
:::

::: check
Starting from $\dot{\mathbf{R}}_{I \leftarrow E} = \mathbf{R}_{I \leftarrow E}\,[\boldsymbol{\omega}^{E}_{E/I}\times]$, derive $\dot{\mathbf{R}}_{E \leftarrow I}$ and hence the velocity transformation $\mathbf{v}^{E} = \mathbf{R}_{E \leftarrow I}\mathbf{v}^{I} - \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$.
:::

::: answer
Transpose the given equation, using $(\mathbf{A}\mathbf{B})^{T} = \mathbf{B}^{T}\mathbf{A}^{T}$ and the skew-symmetry $[\mathbf{w}\times]^{T} = -[\mathbf{w}\times]$:

$$
\dot{\mathbf{R}}_{E \leftarrow I} = \left(\dot{\mathbf{R}}_{I \leftarrow E}\right)^{T} = [\boldsymbol{\omega}^{E}_{E/I}\times]^{T}\,\mathbf{R}_{I \leftarrow E}^{T} = -[\boldsymbol{\omega}^{E}_{E/I}\times]\,\mathbf{R}_{E \leftarrow I} .
$$

Now differentiate $\mathbf{r}^{E} = \mathbf{R}_{E \leftarrow I}\mathbf{r}^{I}$: $\dot{\mathbf{r}}^{E} = \mathbf{R}_{E \leftarrow I}\dot{\mathbf{r}}^{I} + \dot{\mathbf{R}}_{E \leftarrow I}\mathbf{r}^{I} = \mathbf{R}_{E \leftarrow I}\mathbf{v}^{I} - [\boldsymbol{\omega}^{E}_{E/I}\times]\,\mathbf{R}_{E \leftarrow I}\mathbf{r}^{I}$. The last factor is $\mathbf{r}^{E}$, and $\dot{\mathbf{r}}^{E}$ is by definition the Earth-relative velocity in ECEF coordinates, so $\mathbf{v}^{E} = \mathbf{R}_{E \leftarrow I}\mathbf{v}^{I} - \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$. The minus sign is the transport theorem seen from the rotating side: inertially fixed directions appear to move backwards.
:::

::: check
For each of the following, say whether its native frame is ECI or ECEF and why: a star tracker's attitude quaternion; a GNSS receiver's position and velocity; a ground radar's range and angle measurements; a two-body orbit propagator's state.
:::

::: answer
Star tracker: ECI. It identifies stars against a catalogue of inertial directions (in practice ICRF/GCRF right ascensions and declinations), so its attitude is body relative to the celestial frame. GNSS receiver: ECEF. The satellites' broadcast ephemerides are in WGS-84, the receiver solves for its own WGS-84 position, and its velocity is relative to the Earth. Ground radar: ECEF. The antenna is bolted to the crust and its measurements are relative to the site, which is a fixed ECEF point; converting them to ECI needs the rotation angle at the measurement time. Two-body propagator: ECI. The equation $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3$ holds only in a non-rotating frame; run it in ECEF and the missing Coriolis and centrifugal terms would send the satellite off on a spiral.
:::

::: check
A geostationary satellite has $\mathbf{r}^{E} = (42\,164\,\mathrm{km}, 0, 0)$ and $\mathbf{v}^{E} = 0$. Write its ECI position and velocity at rotation angle $\theta$, and check the speed against the circular orbital speed at that radius.
:::

::: answer
Position rotates: $\mathbf{r}^{I} = \mathbf{R}_3(\theta)^{T}\mathbf{r}^{E} = 42\,164\,\mathrm{km} \times (\cos\theta, \sin\theta, 0)$ — the satellite sits over longitude zero and moves round the ECI $x$–$y$ plane as $\theta$ grows. Velocity: $\mathbf{v}^{I} = \mathbf{R}_3(\theta)^{T}(\mathbf{v}^{E} + \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}) = \mathbf{R}_3(\theta)^{T}(0, \omega_E \times 42\,164\,\mathrm{km}, 0) = 3\,075\,\mathrm{m/s} \times (-\sin\theta, \cos\theta, 0)$, since $7.292115 \times 10^{-5} \times 4.2164 \times 10^{7} = 3\,075\,\mathrm{m/s}$. Circular speed at that radius is $\sqrt{\mu / r} = \sqrt{3.986004418 \times 10^{14} / 4.2164 \times 10^{7}} = 3\,075\,\mathrm{m/s}$. They agree, as they must: a satellite that is stationary in ECEF is in a circular orbit whose period is one sidereal day, and the whole of its inertial velocity is the frame's own $\boldsymbol{\omega} \times \mathbf{r}$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$ | Earth rotation rate relative to the celestial frame; $15.041\,^\circ/\mathrm{h}$, $15.041''/\mathrm{s}$ |
| $\omega_E R = 465\,\mathrm{m/s}$ | Inertial speed of the equator; the size of an ECI/ECEF velocity mix-up |
| Sidereal day $86\,164.0905\,\mathrm{s}$ | Rotation period relative to the equinox; $3\,\mathrm{min}\;56\,\mathrm{s}$ shorter than $86\,400\,\mathrm{s}$ |
| $2\pi / \omega_E = 86\,164.10\,\mathrm{s}$ | Period relative to the quasars; $8\,\mathrm{ms}$ longer because the equinox precesses |
| ECI: J2000, GCRF | Non-rotating, origin at Earth's centre; $z$ to the pole, $x$ to the equinox; frame bias of tens of mas between them |
| ECEF: ITRF, WGS-84 | Rotates with the crust; $x$ through the IERS reference meridian; realised by stations and by GPS |
| $\theta(t) = \theta_0 + \omega_E(t - t_0)$ | Earth rotation angle in the simple model; precise value from UT1 |
| $\mathbf{R}_{E \leftarrow I} = \mathbf{R}_3(\theta)$ | ECI to ECEF; at $\theta = 90^\circ$ the ECI $x$ axis maps to ECEF $(0, -1, 0)$ |
| $\mathbf{v}^{E} = \mathbf{R}_3(\theta)\mathbf{v}^{I} - \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$ | Velocity: rotate the axes and subtract the frame velocity; position only rotates |
| $\Delta\lambda = \omega_E T$ | Westward ground-track shift per revolution; $23.2^\circ$ for the ISS |

The next lesson attaches a local horizontal frame to a point on the Earth: the WGS-84 ellipsoid, the difference between geodetic and geocentric latitude, and the north–east–down and east–north–up triads in which vehicles over the Earth describe their motion.
