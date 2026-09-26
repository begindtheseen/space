---
id: l05-eci-ecef-and-the-earth-rotation-rate
title: ECI, ECEF and the Earth rotation rate
minutes: 22
covers:
  - Earth rotation rate
  - ECI (J2000 / GCRF) and ECEF (ITRF)
---

Picture a record turntable with an ant on it. You can describe the ant two ways. From the room: "it is circling the spindle." From the record: "it is sitting still on the label." Both are true. The first is handy for the physics of spinning; the second is handy for saying where on the record the ant is.

Spaceflight lives on exactly that turntable. Every orbit is worked out in a frame that does not rotate, because that is where Newton's law and the two-body problem hold in their simple form. Every launch pad, tracking antenna, GNSS receiver and landing site is described in a frame that turns with the ground, because that is where they stay put. A vehicle's state has to pass between the two many times a second. The passage is a rotation about the Earth's axis, through an angle that grows at the **Earth rotation rate**. That rate, the two frames it links, and the rotation matrix between them are this lesson.

Both frames have several names, and the names matter. The inertial one is **ECI** in flight software, **J2000** when its axes are set by the Earth's equator and equinox on a particular date, and **GCRF** when they are set by distant quasars. The Earth-fixed one is **ECEF** in flight software, **ITRF** when it is built from a network of surveyed stations, and **WGS-84** when it is built by the GPS satellites. Within each family the differences are meters or less. Between the two families the difference is a rotation that moves the equator by nearly half a kilometer every second. Knowing which family a vector belongs to is not optional.

## The Earth rotation rate

The Earth turns eastward about its spin axis at

$$
\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s} ,
$$

read "omega sub E", the value adopted by WGS-84 and by the International Earth Rotation and Reference Systems Service (IERS). To get degrees per hour, multiply by $180/\pi$ (radians to degrees) and by $3600$ (seconds per hour):

$$
\omega_E = 7.292115 \times 10^{-5} \times \frac{180}{\pi} \times 3600 = 15.041\,^\circ/\mathrm{h} = 15.041\,''/\mathrm{s} .
$$

(The $''$ is an **arcsecond**, $1/3600$ of a degree, so degrees per hour and arcseconds per second give the same number.) A point on the equator is carried round at $\omega_E R = 7.292115 \times 10^{-5} \times 6\,378\,137 = 465\,\mathrm{m/s}$ relative to inertial space. That $465\,\mathrm{m/s}$ keeps appearing in this module's warnings.

### Why one turn is not 24 hours

A **solar day** of $86\,400\,\mathrm{s}$ is the time from one noon to the next. But during that day the Earth also travels about $1/365$ of its way around the Sun. So it must turn a little more than one full turn to bring the Sun back overhead — [[about one degree extra|extra-turn]] each day.

Those extra bits add up. Over a year of $365.2422$ solar days they make one whole extra turn, so the Earth spins $366.2422$ times relative to the stars. One turn relative to the stars, the **sidereal day** ("sidereal" means "of the stars"), therefore lasts

$$
T_{sid} = 86\,400 \times \frac{365.2422}{366.2422} = 86\,164.09\,\mathrm{s} = 23\,\mathrm{h}\;56\,\mathrm{min}\;4.09\,\mathrm{s} .
$$

That is $86\,400 - 86\,164.09 = 235.9\,\mathrm{s}$, about $3\,\mathrm{min}\;56\,\mathrm{s}$, shorter than the solar day. It is why a star rises about four minutes earlier each night, and why a satellite's orbit plane, fixed among the stars, passes over the same ground point about four minutes earlier each day.

### Two periods, eight milliseconds apart

Now a trap for anyone who computes $2\pi / \omega_E$ and compares it with the sidereal day:

$$
\frac{2\pi}{\omega_E} = \frac{6.283185}{7.292115 \times 10^{-5}} = 86\,164.10\,\mathrm{s} ,
$$

while the mean sidereal day is $86\,164.0905\,\mathrm{s}$. They differ by about $8\,\mathrm{ms}$, and the difference is real.

The sidereal day is timed against the **[[vernal equinox|vernal-equinox]]**, the point in the sky where the Sun crosses the equator heading north in March. That point is not fixed. The Earth's axis slowly wobbles like a top (**precession**, lesson 09), so the equinox creeps westward by about $50.3''$ a year along the Sun's path. Measured around the equator, that is about $46''$ a year, or $0.13''$ a day. The Earth, turning east, meets the creeping equinox early — by $0.13'' \div 15''/\mathrm{s} \approx 0.008\,\mathrm{s}$ — before it finishes a full turn relative to the truly fixed quasars. So:

- $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$ is the rate relative to the inertial, quasar-defined frame. Its period, $86\,164.10\,\mathrm{s}$, is sometimes called the **stellar day**.
- $86\,164.0905\,\mathrm{s}$ is the **mean sidereal day**, measured against the moving equinox. It matches a slightly larger rate, $7.2921158553 \times 10^{-5}\,\mathrm{rad/s}$, which WGS-84 also lists for sidereal-time formulas.

For flight work at the meter level the choice does not matter: $8\,\mathrm{ms}$ of rotation per day is about $4\,\mathrm{m}$ at the equator. For knowing what each number counts, it is the whole point. When a formula says "sidereal", ask whether it is measured against the equinox or against the celestial frame. The Earth rotation angle formula of lesson 08 uses the second.

### The rate is not quite steady

The length of the day wanders by a millisecond or two over months and years — [[tides, winds and the core|day-length]] all trade spin with the solid Earth — and over centuries it grows by about $2\,\mathrm{ms}$ per century from tidal friction. One millisecond of rotation is $465 \times 0.001 \approx 0.47\,\mathrm{m}$ at the equator, and over a year these errors pile up to hundreds of meters. So precise work does not multiply $\omega_E$ by elapsed time. It reads the total rotation from a measured time scale, **UT1**, defined in lesson 08.

::: key Earth rotation rate
$\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s} \approx 15.041\,^\circ/\mathrm{hr}$; one sidereal day is $86\,164.0905\,\mathrm{s}$, about $3\,\mathrm{min}\;56\,\mathrm{s}$ shorter than the $86\,400\,\mathrm{s}$ solar day. The Earth makes $366.2422$ turns in a year of $365.2422$ solar days. $2\pi / \omega_E$ is $8\,\mathrm{ms}$ longer than the sidereal day because the equinox precesses.
:::

## The Earth-centered inertial frame: J2000 and GCRF

An **Earth-centered inertial** (ECI) frame has its origin at the Earth's center of mass and axes that do not rotate. The $z$ axis points along the spin axis toward the north celestial pole. The $x$ axis lies in the equator's plane, pointing at the vernal equinox. The $y$ axis, $y = z \times x$, completes a right-handed set. In it a satellite's position is $\mathbf{r}^{I}$ and its velocity $\mathbf{v}^{I}$ (superscript $I$: written in the inertial frame), and the two-body equation $\ddot{\mathbf{r}} = -\mu\,\mathbf{r}/r^3$ holds with no Coriolis or centrifugal terms.

Two definitions of the axes are in use. They differ by a tiny fixed rotation.

- **J2000** (also "mean equator and equinox of J2000.0", or EME2000) fixes the axes at the Earth's average spin axis and average equinox at the moment J2000.0: 1 January 2000, 12:00 Terrestrial Time. The real axis keeps wobbling, so J2000 is a *snapshot*. After 2000 the true pole and equinox moved on, but the frame stayed where it was defined. Every published orbit of recent decades that says "J2000" means this.
- **GCRF**, the Geocentric Celestial Reference Frame, sets its axes by the measured directions of several hundred [[quasars|quasars]] — galaxies so far away that they show no motion across the sky at all. It is the Earth-centered version of the International Celestial Reference Frame (ICRF). Its axes were chosen to match J2000 as closely as 1990s data allowed. The leftover offset, the **frame bias**, is a fixed rotation of a few tens of milliarcseconds: about $5\,\mathrm{m}$ at geostationary distance, under a meter in low Earth orbit.

For everything in this module, J2000 and GCRF can be treated as the same frame, and "ECI" means either. When a requirements document names one, name the same one in the code. Apply the frame bias when the accuracy budget is below ten meters. And never rotate a J2000 vector by the precession since 2000 "to bring it up to date" — that produces a *frame of date*, which is a different frame again.

### Quasi-inertial

The ECI origin is not truly at rest. The Earth's center accelerates toward the Sun at $GM_\odot / (1\,\mathrm{au})^2 = 5.93 \times 10^{-3}\,\mathrm{m/s^2}$, and toward the Moon by less. ($GM_\odot$ is the Sun's gravitational parameter; $1\,\mathrm{au}$ is the Earth–Sun distance.) So strictly, ECI is not inertial.

It works as one for Earth satellites because the Sun pulls the satellite almost exactly as hard as it pulls the Earth's center — like two people falling together in an elevator, who float relative to each other. Only the *difference*, the **tidal acceleration**, about $5 \times 10^{-7}\,\mathrm{m/s^2}$ in low orbit, shows up in the satellite's motion. High-fidelity propagators include it as the **third-body perturbation**. For attitude, the leftover is far below anything a gyro can sense. Hence **quasi-inertial**: non-rotating, with an origin whose acceleration is shared by everything in the problem.

## The Earth-centered Earth-fixed frame: ITRF and WGS-84

An **Earth-centered Earth-fixed** (ECEF) frame shares the ECI origin, but its axes are glued to the crust. The $z$ axis runs along the conventional spin axis toward the north pole. The $x$ axis lies in the equator's plane through the reference meridian (longitude zero). The $y$ axis, $z \times x$, points to $90^\circ$ east. A launch pad, a laser-ranging station or a surveyed runway end has constant coordinates in it, apart from a few centimeters a year of continental drift.

- **ITRF**, the International Terrestrial Reference Frame, is the IERS version: a few hundred stations (GNSS, laser ranging, radio telescopes, DORIS beacons), each with agreed coordinates and velocities at a reference date. Its pole and [[zero meridian|greenwich-offset]] are chosen to stay continuous with earlier versions. Successive versions — ITRF2014, ITRF2020 — agree to millimeters or centimeters.
- **WGS-84** is the GPS system's frame, built from its monitor stations and broadcast in the satellites' orbit data. Recent versions line up with ITRF to the centimeter, so for flight purposes a GPS receiver's output *is* an ITRF position.

The ellipsoid, the gravity model and the geodetic latitude of the next lesson are all attached to this frame, and so is everything on the ground. Anything a ground sensor measures — radar range and angles, a survey, a GNSS fix — is native to ECEF. Anything taken from the stars is native to ECI.

::: key ECI versus ECEF
ECI/GCRF is quasi-inertial: axes fixed relative to distant quasars, origin at Earth centre; J2000 is the same frame to within a few tens of milliarcseconds of frame bias. ECEF/ITRF rotates with the crust, so ground stations and launch pads have fixed coordinates in it; WGS-84 is its GPS realization. They differ by Earth rotation plus precession, nutation and polar motion.
:::

## The rotation between them

Take the ECEF frame $E$ to be the ECI frame $I$ [[turned through an angle|eci-ecef-view]] $\theta$ ("theta") about their shared $z$ axis. The angle $\theta$ runs eastward from the ECI $x$ axis to the ECEF $x$ axis; it is called the **Earth rotation angle** (or, measured from the equinox, the Greenwich sidereal angle). Lesson 01's elementary rotation gives the coordinate change at once:

$$
\mathbf{r}^{E} = \mathbf{R}_{E \leftarrow I}\,\mathbf{r}^{I}, \qquad
\mathbf{R}_{E \leftarrow I} = \mathbf{R}_3(\theta) = \begin{bmatrix} \cos\theta & \sin\theta & 0 \\ -\sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}, \qquad
\mathbf{R}_{I \leftarrow E} = \mathbf{R}_3(\theta)^{T} .
$$

Read $\mathbf{R}_{E \leftarrow I}$ as "the matrix that takes ECI coordinates to ECEF coordinates." Going back uses the **transpose** (rows and columns swapped), because the inverse of a rotation matrix is its transpose.

**Check it with a vector you understand.** The ECEF $x$ axis (the zero meridian) sits at angle $\theta$ from the ECI $x$ axis, so in ECI it is $(\cos\theta, \sin\theta, 0)$. Push it through the matrix:

$$
(\cos^2\theta + \sin^2\theta,\; -\sin\theta\cos\theta + \cos\theta\sin\theta,\; 0) = (1, 0, 0) .
$$

That is the ECEF $x$ axis in its own coordinates, as it must be.

**A second check.** At $\theta = 90^\circ$, $\cos\theta = 0$ and $\sin\theta = 1$. The ECI $x$ axis, $(1, 0, 0)$, maps to $(0, -1, 0)$: a quarter turn *behind* the zero meridian, which has moved on to ECI $+y$. If your code gives $(0, +1, 0)$, you have the "active" matrix that turns the vector instead of the axes, and everything downstream spins the wrong way.

In the simplest model the angle grows steadily:

$$
\theta(t) = \theta_0 + \omega_E\,(t - t_0) ,
$$

with $\theta_0$ the angle at a reference time $t_0$. Where $\theta_0$ comes from — a formula evaluated in UT1 — is lesson 08's business. The coding exercise for this module hands it to you as a number.

### Position turns; velocity turns and shifts

Position is an arrow from the shared origin, so only its coordinates change: $\mathbf{r}^{E} = \mathbf{R}_3(\theta)\,\mathbf{r}^{I}$.

Velocity is different in kind, as lesson 03 showed. On the turntable, the ant's velocity relative to the record is a different arrow from its velocity relative to the room. So converting velocity needs two steps: turn the axes, *and* subtract the frame's own motion, $\boldsymbol{\omega} \times \mathbf{r}$:

$$
\mathbf{v}^{E} = \mathbf{R}_3(\theta)\,\mathbf{v}^{I} - \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}, \qquad
\mathbf{v}^{I} = \mathbf{R}_3(\theta)^{T}\left(\mathbf{v}^{E} + \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}\right), \qquad
\boldsymbol{\omega}^{E}_{E/I} = \begin{bmatrix} 0 \\ 0 \\ \omega_E \end{bmatrix} .
$$

These match lesson 03's transport-theorem result, now with the matrix written out: a change of coordinates, plus a change of physical arrow.

::: note Why it has to be true
Differentiate $\mathbf{r}^{E} = \mathbf{R}_{E \leftarrow I}\mathbf{r}^{I}$ with the product rule:

$$
\dot{\mathbf{r}}^{E} = \mathbf{R}_{E \leftarrow I}\,\dot{\mathbf{r}}^{I} + \dot{\mathbf{R}}_{E \leftarrow I}\,\mathbf{r}^{I} .
$$

Lesson 02 gave $\dot{\mathbf{R}}_{I \leftarrow E} = \mathbf{R}_{I \leftarrow E}[\boldsymbol{\omega}^{E}_{E/I}\times]$, where $[\mathbf{w}\times]$ is the cross-product matrix. Transpose it. The order of a product reverses, and the cross-product matrix is **skew-symmetric** — its transpose is its negative — so $\dot{\mathbf{R}}_{E \leftarrow I} = -[\boldsymbol{\omega}^{E}_{E/I}\times]\,\mathbf{R}_{E \leftarrow I}$. Put that in the second term: it becomes $-\boldsymbol{\omega}^{E}_{E/I} \times (\mathbf{R}_{E \leftarrow I}\mathbf{r}^{I}) = -\boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$. The first term is $\mathbf{R}_{E \leftarrow I}\mathbf{v}^{I}$. Since $\dot{\mathbf{r}}^{E}$ is the Earth-relative velocity in ECEF axes, that is the formula.
:::

::: example An ISS-like state, ECI to ECEF
A satellite in a $400\,\mathrm{km}$ circular orbit at $51.6^\circ$ inclination has, at some instant,

$$
\mathbf{r}^{I} = \begin{bmatrix} 3\,143\,570.5 \\ 5\,385\,797.9 \\ 2\,655\,990.8 \end{bmatrix} \mathrm{m}, \qquad
\mathbf{v}^{I} = \begin{bmatrix} -5\,588.821 \\ 695.418 \\ 5\,204.638 \end{bmatrix} \mathrm{m/s} ,
$$

with $|\mathbf{r}| = 6\,778\,137\,\mathrm{m}$ and $|\mathbf{v}| = 7\,668.56\,\mathrm{m/s}$. The Earth rotation angle is $\theta = 100^\circ$, so $\cos\theta = -0.173648$ and $\sin\theta = 0.984808$.

**Position — turn it.** Row by row, multiply the matrix into the column:

$$
\mathbf{r}^{E} = \begin{bmatrix} -0.173648 \times 3\,143\,570.5 + 0.984808 \times 5\,385\,797.9 \\ -0.984808 \times 3\,143\,570.5 - 0.173648 \times 5\,385\,797.9 \\ 2\,655\,990.8 \end{bmatrix}
= \begin{bmatrix} 4\,758\,100.2 \\ -4\,031\,046.6 \\ 2\,655\,990.8 \end{bmatrix} \mathrm{m} .
$$

*Sanity check:* the length is still $6\,778\,137\,\mathrm{m}$, and $z$ is untouched — both right for a turn about $z$. The satellite is over longitude $\operatorname{atan2}(-4\,031\,046.6,\ 4\,758\,100.2) = -40.27^\circ$, that is $40.27^\circ$ west, at geocentric latitude $\arcsin(2\,655\,990.8 / 6\,778\,137) = 23.07^\circ$ north.

**Velocity, step one — turn it.** The same matrix gives $\mathbf{R}_3(100^\circ)\,\mathbf{v}^{I} = (1\,655.34,\; 5\,383.16,\; 5\,204.64)\,\mathrm{m/s}$.

**Velocity, step two — subtract the frame's motion.** With $\boldsymbol{\omega} = (0, 0, \omega_E)$, the cross product is $\boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E} = \omega_E(-y, x, 0) = (293.95,\; 346.97,\; 0)\,\mathrm{m/s}$. Its size, $454.7\,\mathrm{m/s}$, is the $465\,\mathrm{m/s}$ equator speed scaled by $\cos 23.07^\circ$ (closer to the axis) and by $r/R$ (higher up). So

$$
\mathbf{v}^{E} = \begin{bmatrix} 1\,655.34 - 293.95 \\ 5\,383.16 - 346.97 \\ 5\,204.64 \end{bmatrix} = \begin{bmatrix} 1\,361.39 \\ 5\,036.19 \\ 5\,204.64 \end{bmatrix} \mathrm{m/s}, \qquad |\mathbf{v}^{E}| = 7\,369.2\,\mathrm{m/s} .
$$

*Sanity check:* the ground-relative speed is $299\,\mathrm{m/s}$ less than the inertial speed. It should be less: the satellite travels eastward-ish, with the Earth's spin, so the ground is partly keeping up.

**The trap.** Work out the inclination from $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ using $\mathbf{r}^{E}$ and the turned-only velocity, and you get $51.60^\circ$ — correct, since a turn about $z$ leaves $h_z / |\mathbf{h}|$ alone. Use $\mathbf{r}^{E}$ with $\mathbf{v}^{E}$ — what a GNSS receiver hands you — and you get $53.87^\circ$. The orbit plane is off by more than two degrees, and nothing in the arithmetic complained.
:::

## Ground tracks

A **ground track** is the path traced on the map by the point directly under a satellite. The orbit plane stays very nearly fixed in ECI (apart from a slow drift caused by the Earth's bulge). The Earth turns underneath it at $\omega_E$. So each time the satellite comes back round to the same point in its orbit, the ground below has moved east by $\omega_E T$, where $T$ is the **orbital period**. The ground track has therefore [[shifted west|track-shift]] by

$$
\Delta\lambda = \omega_E\,T = 15.041\,^\circ/\mathrm{h} \times T .
$$

($\Delta\lambda$, "delta lambda", is the change in longitude.) This is the rotation matrix at work: the same $\mathbf{r}^{I}$ one period later goes through $\mathbf{R}_3(\theta + \omega_E T)$ and lands $\omega_E T$ farther west.

::: example The Space Station's westward march
The ISS orbits at about $400\,\mathrm{km}$, so its orbit radius is $a = 6\,778\,137\,\mathrm{m}$. The period is

$$
T = 2\pi\sqrt{\frac{a^3}{\mu}} = 2\pi\sqrt{\frac{(6.778137 \times 10^{6})^3}{3.986004418 \times 10^{14}}} = 5\,553.6\,\mathrm{s} = 92.56\,\mathrm{min} .
$$

**The shift.** In that time the Earth turns $\omega_E T = 7.292115 \times 10^{-5} \times 5\,553.6 = 0.4050\,\mathrm{rad}$. Times $180/\pi$, that is $23.20^\circ$. So one equator crossing is $23.2^\circ$ of longitude west of the one before. At about $111.3\,\mathrm{km}$ per degree along the equator, that is $23.20 \times 111.3 \approx 2\,580\,\mathrm{km}$ between passes.

**Does it repeat?** In one sidereal day of $86\,164\,\mathrm{s}$ the station makes $86\,164 / 5\,553.6 = 15.5$ orbits — not a whole number. So the pattern does not close. The sixteenth crossing lands about half a spacing from the first, and later days fill in between.

**Designing a [[repeat|repeat-track]].** Pick $T$ so that $k$ orbits take exactly $m$ sidereal days: $k\,T = m \times 86\,164.09\,\mathrm{s}$. For sixteen orbits in one day, $T = 86\,164.09 / 16 = 5\,385.3\,\mathrm{s}$, about $89.75\,\mathrm{min}$, and each shift is exactly $360^\circ / 16 = 22.5^\circ$. (A period of exactly $90\,\mathrm{min}$ is close but not quite: it shifts $22.56^\circ$, and sixteen of those overshoot a full turn by about $1^\circ$ a day.)
:::

::: warning Turning a velocity is not enough
$\mathbf{v}^{E} = \mathbf{R}_3(\theta)\,\mathbf{v}^{I} - \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$ has two terms. The second is up to $465\,\mathrm{m/s}$ at the surface and $502\,\mathrm{m/s}$ at $500\,\mathrm{km}$. Position, by contrast, only turns. A function named `eci_to_ecef` that takes a bare 3-vector cannot know which one it was handed. Give it the whole state, or write two functions.
:::

::: warning J2000 is a fixed frame, not today's
Applying the precession since 2000 to a J2000 vector does not "update" it. It moves it into a mean-of-date frame that nothing else in your system uses. Likewise, "ECEF", "WGS-84" and "ITRF2020" are the same frame to the centimeter, but "ECEF" and "ECI" are not the same frame to $465\,\mathrm{m/s}$. Keep the family name in the variable: `r_eci`, `r_ecef`.
:::

## Check yourself

::: check
Explain why the Earth makes about $366.24$ turns relative to the stars in a year of $365.24$ solar days, and use it to find the sidereal day to the nearest second.
:::

::: answer
Each solar day the Earth turns until the Sun is back overhead. During that day it has moved along its orbit by about $360^\circ / 365.24 \approx 0.986^\circ$, so the Sun's direction has shifted that much against the stars. The Earth must turn $360.986^\circ$ — one full turn plus $0.986^\circ$ — to catch up.

The extra $0.986^\circ$ a day adds up to one whole extra turn over the year. So $365.24$ solar days hold $366.24$ turns relative to the stars. Each turn takes $86\,400 \times 365.2422 / 366.2422 = 86\,164\,\mathrm{s}$, which is $23\,\mathrm{h}\;56\,\mathrm{min}\;4\,\mathrm{s}$.
:::

::: check
Your ECI-to-ECEF code uses $\theta = \theta_0 + \omega_E(t - t_0)$, and the starting angle $\theta_0$ comes from a table tagged in the wrong time scale, so it is off by $1.0\,\mathrm{s}$ of time. How big is the resulting position error for a ground station on the equator? At $60^\circ$ latitude?
:::

::: answer
**The angle error.** One second of rotation is $\omega_E \times 1\,\mathrm{s} = 7.292 \times 10^{-5}\,\mathrm{rad} = 15.04''$.

**The position error.** The station's ECEF coordinates are right, but its ECI position is turned about $z$ by that angle. The error runs east–west, with size $\omega_E\,d$, where $d$ is the station's distance from the spin axis.

- Equator: $d = 6\,378\,137\,\mathrm{m}$, error $= 7.292 \times 10^{-5} \times 6\,378\,137 \approx 465\,\mathrm{m}$.
- $60^\circ$: $d \approx 6\,378\,137 \times \cos 60^\circ = 3\,189\,069\,\mathrm{m}$, error $\approx 233\,\mathrm{m}$.

An antenna pointed using that ECI position would be off by about $15''$ — harmless for a wide radio beam, fatal for a laser.
:::

::: check
Starting from $\dot{\mathbf{R}}_{I \leftarrow E} = \mathbf{R}_{I \leftarrow E}\,[\boldsymbol{\omega}^{E}_{E/I}\times]$, derive $\dot{\mathbf{R}}_{E \leftarrow I}$, and from it the velocity rule $\mathbf{v}^{E} = \mathbf{R}_{E \leftarrow I}\mathbf{v}^{I} - \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$.
:::

::: answer
**Transpose.** Use $(\mathbf{A}\mathbf{B})^{T} = \mathbf{B}^{T}\mathbf{A}^{T}$ and skew-symmetry, $[\mathbf{w}\times]^{T} = -[\mathbf{w}\times]$:

$$
\dot{\mathbf{R}}_{E \leftarrow I} = \left(\dot{\mathbf{R}}_{I \leftarrow E}\right)^{T} = [\boldsymbol{\omega}^{E}_{E/I}\times]^{T}\,\mathbf{R}_{I \leftarrow E}^{T} = -[\boldsymbol{\omega}^{E}_{E/I}\times]\,\mathbf{R}_{E \leftarrow I} .
$$

**Differentiate** $\mathbf{r}^{E} = \mathbf{R}_{E \leftarrow I}\mathbf{r}^{I}$ with the product rule: $\dot{\mathbf{r}}^{E} = \mathbf{R}_{E \leftarrow I}\mathbf{v}^{I} - [\boldsymbol{\omega}^{E}_{E/I}\times]\,\mathbf{R}_{E \leftarrow I}\mathbf{r}^{I}$. The last factor, $\mathbf{R}_{E \leftarrow I}\mathbf{r}^{I}$, is $\mathbf{r}^{E}$. And $\dot{\mathbf{r}}^{E}$ is by definition the Earth-relative velocity in ECEF axes. So $\mathbf{v}^{E} = \mathbf{R}_{E \leftarrow I}\mathbf{v}^{I} - \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$.

The minus sign is the transport theorem seen from the turning side: directions fixed in inertial space seem to drift backwards.
:::

::: check
For each item, say whether its native frame is ECI or ECEF, and why: a star tracker's attitude quaternion; a GNSS receiver's position and velocity; a ground radar's range and angles; a two-body orbit propagator's state.
:::

::: answer
- **Star tracker: ECI.** It matches stars against a catalog of inertial directions (ICRF/GCRF positions), so its attitude is the body relative to the celestial frame.
- **GNSS receiver: ECEF.** The satellites broadcast their orbits in WGS-84, the receiver solves for its own WGS-84 position, and its velocity is relative to the Earth.
- **Ground radar: ECEF.** The antenna is bolted to the crust, so its measurements are relative to a fixed ECEF point. Turning them into ECI needs the rotation angle at the time of measurement.
- **Two-body propagator: ECI.** $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3$ holds only in a non-rotating frame. Run it in ECEF and the missing Coriolis and centrifugal terms would send the satellite off on a spiral.
:::

::: check
A geostationary satellite has $\mathbf{r}^{E} = (42\,164\,\mathrm{km}, 0, 0)$ and $\mathbf{v}^{E} = 0$. Write its ECI position and velocity at rotation angle $\theta$, and check its speed against the circular orbit speed at that radius.
:::

::: answer
**Position just turns:** $\mathbf{r}^{I} = \mathbf{R}_3(\theta)^{T}\mathbf{r}^{E} = 42\,164\,\mathrm{km} \times (\cos\theta, \sin\theta, 0)$. The satellite sits over longitude zero and sweeps around the ECI $x$–$y$ plane as $\theta$ grows.

**Velocity:** first $\boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E} = (0,\ \omega_E \times 42\,164\,\mathrm{km},\ 0)$, and $7.292115 \times 10^{-5} \times 4.2164 \times 10^{7} = 3\,075\,\mathrm{m/s}$. Adding $\mathbf{v}^{E} = 0$ and turning back: $\mathbf{v}^{I} = 3\,075\,\mathrm{m/s} \times (-\sin\theta, \cos\theta, 0)$.

**Check:** circular speed is $\sqrt{\mu / r} = \sqrt{3.986004418 \times 10^{14} / 4.2164 \times 10^{7}} = 3\,075\,\mathrm{m/s}$. They agree, as they must. A satellite parked in ECEF is on a circular orbit with a one-sidereal-day period, and all of its inertial velocity is the frame's own $\boldsymbol{\omega} \times \mathbf{r}$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$ | Earth rotation rate relative to the celestial frame; $15.041\,^\circ/\mathrm{h}$, $15.041''/\mathrm{s}$ |
| $\omega_E R = 465\,\mathrm{m/s}$ | Inertial speed of the equator; the size of an ECI/ECEF velocity mix-up |
| Sidereal day $86\,164.0905\,\mathrm{s}$ | One turn relative to the equinox; $3\,\mathrm{min}\;56\,\mathrm{s}$ shorter than $86\,400\,\mathrm{s}$ |
| $2\pi / \omega_E = 86\,164.10\,\mathrm{s}$ | One turn relative to the quasars; $8\,\mathrm{ms}$ longer because the equinox precesses |
| ECI: J2000, GCRF | Non-rotating, origin at Earth's center; $z$ to the pole, $x$ to the equinox; tens of mas of frame bias between them |
| ECEF: ITRF, WGS-84 | Turns with the crust; $x$ through the IERS reference meridian; built from stations and from GPS |
| $\theta(t) = \theta_0 + \omega_E(t - t_0)$ | Earth rotation angle in the simple model; precise value from UT1 |
| $\mathbf{R}_{E \leftarrow I} = \mathbf{R}_3(\theta)$ | ECI to ECEF; at $\theta = 90^\circ$ the ECI $x$ axis maps to ECEF $(0, -1, 0)$ |
| $\mathbf{v}^{E} = \mathbf{R}_3(\theta)\mathbf{v}^{I} - \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E}$ | Velocity: turn the axes and subtract the frame's motion; position only turns |
| $\Delta\lambda = \omega_E T$ | Westward ground-track shift per orbit; $23.2^\circ$ for the ISS |

Next lesson: a local frame attached to a point on the Earth — the WGS-84 ellipsoid, the difference between geodetic and geocentric latitude, and the north–east–down and east–north–up triads in which vehicles over the Earth describe their motion.

::: context extra-turn The extra turn, seen from above
Look down on the Earth's orbit from above the North Pole. At noon on day 1, a spot on the Earth (the small red mark) faces the Sun. One day later the Earth has moved about $1^\circ$ along its orbit. After exactly one turn relative to the stars, the mark points the same way in space as before — but the Sun is now off to one side. The Earth must turn about $1^\circ$ more to bring noon back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M 180 40 A 110 110 0 0 0 109.3 65.7" fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <circle cx="180" cy="150" r="14" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="200" y="154" font-size="12" fill="#1f2a44">Sun</text>
  <circle cx="180" cy="40" r="14" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="40" x2="180" y2="54" stroke="#b4232c" stroke-width="3"/>
  <text x="200" y="36" font-size="12" fill="#1f2a44">day 1, noon</text>
  <line x1="109.3" y1="65.7" x2="109.3" y2="165" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="2 3"/>
  <line x1="109.3" y1="65.7" x2="170" y2="138" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="2 3"/>
  <circle cx="109.3" cy="65.7" r="14" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="109.3" y1="65.7" x2="109.3" y2="79.7" stroke="#b4232c" stroke-width="3"/>
  <text x="12" y="40" font-size="12" fill="#1f2a44">one star-turn later</text>
  <text x="150" y="100" font-size="11" fill="#1f2a44">to the Sun</text>
  <text x="12" y="180" font-size="11" fill="#6c7a93">same direction in space</text>
  <text x="200" y="192" font-size="11" fill="#6c7a93">orbit step exaggerated</text>
</svg>
```

The two dotted lines from the later Earth — "same direction in space" and "to the Sun" — are about $1^\circ$ apart in reality ($360^\circ / 365.24 \approx 0.986^\circ$). Turning through that gap takes about $3\,\mathrm{min}\;56\,\mathrm{s}$, which is exactly how much shorter the sidereal day is.
:::

::: context vernal-equinox The zero of the sky's longitude
Twice a year the Sun, moving along its yearly path in the sky, crosses the celestial equator. The crossing in March, going north, is the **vernal equinox** — "vernal" means "of spring". Astronomers use that direction as the zero for sky longitude (right ascension), the way Greenwich is zero for longitude on the ground.

It makes a convenient $x$ axis for an inertial frame because both the Earth's equator and its orbit define it. The catch is that it drifts slowly, because the Earth's axis precesses — which is why modern frames pin the axes to quasars instead.
:::

::: context day-length Why the day is not quite steady
The solid Earth trades spin with things attached to it. When winds strengthen in one direction, the atmosphere gains spin and the solid Earth loses a little, so the day lengthens by a fraction of a millisecond, mostly with the seasons. Motions of the liquid core do the same over decades.

Over long times the Moon's tides act like a brake. Tidal friction slowly transfers the Earth's spin to the Moon's orbit, lengthening the day by about $2\,\mathrm{ms}$ per century and moving the Moon away by about $3.8\,\mathrm{cm}$ a year. None of this can be predicted precisely enough for navigation, so it is measured, and published as UT1.
:::

::: context quasars The most distant signposts
A quasar is the extremely bright center of a far-off galaxy, powered by a giant black hole swallowing gas. The ones used for reference frames are billions of light-years away. They move through space as fast as any galaxy, but at that distance the motion across our sky is far too small to measure. That makes them the best fixed signposts there are.

Radio telescopes on different continents record the same quasar at the same time and compare arrival times. This is called very long baseline interferometry (VLBI), and it pins down quasar directions to a fraction of a milliarcsecond.
:::

::: context greenwich-offset Longitude zero is not quite at Greenwich
The ITRF's zero meridian passes about $100\,\mathrm{m}$ east of the old transit telescope at the Royal Observatory in Greenwich. Walkers with GPS phones standing on the famous brass line are surprised to read a longitude that is not zero.

Nothing moved. The old meridian was set by a telescope aligned with the local plumb line, which at Greenwich leans slightly away from the ellipsoid normal. The modern meridian is defined by the station network and the Earth's center, so the two lines differ by that local lean — roughly a hundred meters on the ground.
:::

::: context eci-ecef-view The two frames, from above the pole
Looking down on the North Pole, both frames share the same $z$ axis, pointing at you. The ECEF axes (red) are the ECI axes (blue) turned eastward — counterclockwise from this view — by the Earth rotation angle $\theta$, which grows by about $15^\circ$ every hour.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="160" cy="110" r="60" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <line x1="160" y1="110" x2="290" y2="110" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="298,110 286,104 286,116" fill="#1d6fd1"/>
  <text x="230" y="130" font-size="12" fill="#1d6fd1">x ECI (equinox)</text>
  <line x1="160" y1="110" x2="160" y2="12" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="160,4 154,16 166,16" fill="#1d6fd1"/>
  <text x="168" y="16" font-size="12" fill="#1d6fd1">y ECI</text>
  <line x1="160" y1="110" x2="253.3" y2="56.1" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="260.2,52.1 246.8,53.2 252.8,63.6" fill="#b4232c"/>
  <text x="262" y="48" font-size="12" fill="#b4232c">x ECEF (lon 0)</text>
  <line x1="160" y1="110" x2="106.1" y2="16.7" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="102.1,9.8 103.2,23.2 113.6,17.2" fill="#b4232c"/>
  <text x="40" y="20" font-size="12" fill="#b4232c">y ECEF</text>
  <path d="M 220 110 A 60 60 0 0 0 212 80" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="224" y="96" font-size="12" fill="#1f2a44">θ</text>
  <circle cx="160" cy="110" r="3" fill="#1f2a44"/>
  <text x="20" y="190" font-size="11" fill="#6c7a93">z out of page (north); drawn at θ = 30°</text>
</svg>
```

A fixed point in space (fixed blue coordinates) appears, in red coordinates, to slide clockwise — backward — as $\theta$ grows. That backward slide is why $\mathbf{R}_3(\theta)$ has $+\sin\theta$ in its top row.
:::

::: context track-shift Each pass lands farther west
A map strip along the equator. Three passes of the same satellite cross the equator heading north-east, one orbit apart. Between passes the Earth turns east under the orbit, so on the map each crossing lands $23.2^\circ$ west of the one before — about $2\,580\,\mathrm{km}$ for the ISS.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="100" x2="350" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="14" y="94" font-size="11" fill="#6c7a93">equator</text>
  <line x1="270" y1="150" x2="330" y2="50" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="200.4" y1="150" x2="260.4" y2="50" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="130.8" y1="150" x2="190.8" y2="50" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="300" cy="100" r="3.5" fill="#b4232c"/>
  <circle cx="230.4" cy="100" r="3.5" fill="#b4232c"/>
  <circle cx="160.8" cy="100" r="3.5" fill="#b4232c"/>
  <text x="330" y="44" font-size="11" fill="#1d6fd1" text-anchor="middle">pass 1</text>
  <text x="260.4" y="44" font-size="11" fill="#1d6fd1" text-anchor="middle">pass 2</text>
  <text x="190.8" y="44" font-size="11" fill="#1d6fd1" text-anchor="middle">pass 3</text>
  <line x1="296" y1="126" x2="238" y2="126" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="232,126 242,121 242,131" fill="#b4232c"/>
  <text x="265" y="142" font-size="11" fill="#b4232c" text-anchor="middle">23.2° west</text>
  <text x="14" y="172" font-size="11" fill="#6c7a93">west</text>
  <text x="346" y="172" font-size="11" fill="#6c7a93" text-anchor="end">east</text>
</svg>
```

The spacing is drawn to scale at 3 pixels per degree of longitude. After about $15.5$ passes the crossings have gone right round the world.
:::

::: context repeat-track Orbits that retrace their steps
Earth-observation satellites are often put on orbits whose ground tracks repeat exactly, so the same spot can be photographed from the same angle again and again. Landsat 8, for example, repeats its track every 16 days after 233 orbits.

The real design also accounts for the slow swing of the orbit plane caused by the Earth's equatorial bulge, which changes the effective day the orbit must match. The simple rule $k\,T = m \times 86\,164\,\mathrm{s}$ is the first step, and it already gets the period right to within a fraction of a minute for most orbits.
:::
