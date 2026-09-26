---
id: l07-body-lvlh-perifocal-topocentric-and-sensor-frames
title: Body, LVLH, perifocal, topocentric and sensor frames
minutes: 24
covers:
  - body, LVLH / RIC, perifocal, topocentric and sensor frames
---

At a soccer game, "row 12, seat 8" and "two seats to my left" describe the same friend. Both are true; each suits a different job. Spacecraft are the same. Lessons 05 and 06 gave frames that say *where* a vehicle is. This lesson adds five that answer other questions: which way is it pointing, where is it compared with its own orbit, how does a ground station see it, and where on the vehicle was a measurement made?

Each has a real job. A rendezvous with the International Space Station (ISS) is planned in a frame that rides along the station's orbit. Orbit reports quote errors as radial, in-track and cross-track. A tracking antenna is aimed in azimuth and elevation from its own site. A star tracker reports where *its own* camera points, which differs from the spacecraft by a mounting matrix somebody had to measure.

Each frame is three perpendicular axes with an origin, tied to ECI or ECEF by a rotation matrix built with lesson 01's rules. The danger is that several have more than one convention in use, differing by swapped axes and flipped signs, and a mix-up gives numbers that look reasonable. So for each frame you get its origin, axes, matrix, and the check that tells you which convention a data set uses.

## The body frame

The **body frame** $B$ is glued to the vehicle's structure, with its origin at the center of mass (or a stated structural reference point). Each vehicle declares which way its axes point:

- **Aircraft and most launch vehicles.** $\hat{\mathbf{b}}_1$ (read "b-hat one") points forward along the fuselage, $\hat{\mathbf{b}}_2$ toward the right wing, and $\hat{\mathbf{b}}_3$ down. A plane flying level and heading north then has body axes parallel to NED and zero roll, pitch and yaw.
- **Spacecraft.** No universal rule. A common choice puts $\hat{\mathbf{b}}_3$ along the payload's line of sight and $\hat{\mathbf{b}}_1$ along the direction of travel. Every program writes its own in a **[[coordinate-systems document|coord-doc]]**; on joining one, read it first.

Two measurements live in body axes. The gyros measure $\boldsymbol{\omega}^{B}_{B/I}$ — read "omega of B relative to I, in B" — the spin rate of the body relative to inertial space, written in body axes. In code that is `omega_body_wrt_eci_in_body`. The accelerometers measure the **[[specific force|specific-force]]** $\mathbf{f}^{B}$, the push per kilogram from everything except gravity.

The vehicle's orientation, its **attitude**, is the rotation $\mathbf{R}_{I \leftarrow B}$, whose columns are the body axes written in ECI. Books use its transpose just as often, and one document's "body-to-inertial" quaternion is the next one's "inertial-to-body". Lesson 02's kinematics, $\dot{\mathbf{R}}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow B}[\boldsymbol{\omega}^{B}_{B/I}\times]$, is how the gyro readings move the attitude forward in time.

The **IMU** (inertial measurement unit, the box of gyros and accelerometers) is bolted on with its own axes, never exactly the body axes. The link is a fixed **mount matrix** $\mathbf{R}_{B \leftarrow IMU}$, measured before flight and refined by calibration. Keep "IMU" and "body" as separate labels even when the matrix is a milliradian from identity: that milliradian turns a fast roll into a false pitch rate.

## The LVLH and RIC frames

Imagine a drone that follows a satellite around its orbit, one arm always pointed at Earth. It carries the **LVLH frame** — Local Vertical, Local Horizontal. Its cleanest version is the **RIC** triad:

$$
\hat{\mathbf{R}} = \frac{\mathbf{r}}{|\mathbf{r}|}, \qquad
\hat{\mathbf{C}} = \frac{\mathbf{h}}{|\mathbf{h}|} = \frac{\mathbf{r} \times \mathbf{v}}{|\mathbf{r} \times \mathbf{v}|}, \qquad
\hat{\mathbf{I}} = \hat{\mathbf{C}} \times \hat{\mathbf{R}} .
$$

Here $\mathbf{r}$ and $\mathbf{v}$ are the satellite's ECI position and inertial velocity, and $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ is its **angular momentum per kilogram**, an arrow standing straight up out of the orbit's plane. The three axes are:

- $\hat{\mathbf{R}}$, **radial**: straight out from Earth's center through the satellite.
- $\hat{\mathbf{C}}$, **cross-track**: along $\mathbf{h}$, perpendicular to the orbit plane.
- $\hat{\mathbf{I}}$, **in-track** (or along-track): in the orbit plane, perpendicular to the radius, pointing the way the satellite moves.

For a circular orbit $\hat{\mathbf{I}}$ lies exactly along $\mathbf{v}$. For an eccentric orbit it differs from the velocity direction by the **[[flight-path angle|flight-path-angle]]**, the angle by which the satellite is climbing or diving. Other books call the same triad RSW or RTN (radial, transverse, normal). ([[Picture of the triad|ric-picture]].)

It is right-handed, because the first two crossed give the third:

$$
\hat{\mathbf{R}} \times \hat{\mathbf{I}} = \hat{\mathbf{R}} \times (\hat{\mathbf{C}} \times \hat{\mathbf{R}}) = \hat{\mathbf{C}}(\hat{\mathbf{R}}\cdot\hat{\mathbf{R}}) - \hat{\mathbf{R}}(\hat{\mathbf{R}}\cdot\hat{\mathbf{C}}) = \hat{\mathbf{C}} .
$$

The middle step is the "BAC minus CAB" rule for a triple cross product. Then $\hat{\mathbf{R}}\cdot\hat{\mathbf{R}} = 1$, and $\hat{\mathbf{R}}\cdot\hat{\mathbf{C}} = 0$ because $\mathbf{h}$ is perpendicular to $\mathbf{r}$.

The matrix from ECI has the three unit vectors, written in ECI, as its rows (lesson 01: row $i$ is axis $i$ of the new frame):

$$
\mathbf{R}_{RIC \leftarrow I} = \begin{bmatrix} \hat{\mathbf{R}}^{I\,T} \\ \hat{\mathbf{I}}^{I\,T} \\ \hat{\mathbf{C}}^{I\,T} \end{bmatrix}, \qquad
\boldsymbol{\rho}^{RIC} = \mathbf{R}_{RIC \leftarrow I}\,\boldsymbol{\rho}^{I} .
$$

It is applied to *relative* vectors $\boldsymbol{\rho}$ (Greek "rho"), whose origin is the satellite itself: where a second spacecraft sits compared with this one, or how far an estimated orbit is from the true one.

### The LVLH conventions

The Space Shuttle and ISS programs defined LVLH differently. Their $+z$ points to **nadir** (straight down at Earth), $+y$ along the *negative* orbit normal, and $+x$ completes the set, which puts it along the direction of travel:

$$
\hat{\mathbf{x}}_{LVLH} = \hat{\mathbf{I}}, \qquad \hat{\mathbf{y}}_{LVLH} = -\hat{\mathbf{C}}, \qquad \hat{\mathbf{z}}_{LVLH} = -\hat{\mathbf{R}} ,
\qquad
\mathbf{R}_{LVLH \leftarrow RIC} = \begin{bmatrix} 0 & 1 & 0 \\ 0 & 0 & -1 \\ -1 & 0 & 0 \end{bmatrix} .
$$

Expanding the determinant along the first row gives $-1 \times (0 \times 0 - (-1)(-1)) = +1$, so this LVLH is right-handed too. It matches aircraft body axes, $x$ forward and $z$ down, so a spacecraft pointing at the ground and "flying level" has zero attitude relative to it.

Other documents use $x$ radial-out and $z$ along $+\mathbf{h}$ (which is RIC under another name), or $x$ along-track with $z$ radial *out*. So the one question to ask of any `v_lvlh` is: **which axis is nadir, and is $y$ along $+\mathbf{h}$ or $-\mathbf{h}$?** The answer fixes everything else.

### How fast the frame turns

RIC turns relative to ECI, like the drone swinging to keep facing Earth. For two-body motion (just Earth's gravity, no other pushes) $\hat{\mathbf{C}}$ stays fixed. $\hat{\mathbf{R}}$ sweeps around the orbit plane at the rate the **true anomaly** $\nu$ (Greek "nu", the angle traveled around the orbit from the lowest point) changes: $\dot{\nu} = h/r^2$, with $h = |\mathbf{r} \times \mathbf{v}|$. So

$$
\boldsymbol{\omega}_{RIC/I} = \frac{h}{r^2}\,\hat{\mathbf{C}} , \qquad \text{circular orbit:}\quad \boldsymbol{\omega}_{RIC/I} = n\,\hat{\mathbf{C}}, \quad n = \sqrt{\frac{\mu}{a^3}} .
$$

Here $n$ is the **mean motion**, the average turning rate of a satellite around its orbit, $\mu$ is Earth's gravity constant and $a$ is the orbit's semi-major axis (its radius, if circular).

For the ISS at $a = 6\,778\,137\,\mathrm{m}$:

$$
n = \sqrt{\frac{3.986004418 \times 10^{14}}{(6.778137 \times 10^{6})^3}} = 1.131 \times 10^{-3}\,\mathrm{rad/s} = 0.0648\,^\circ/\mathrm{s},
$$

about $3.9^\circ$ per minute. A spacecraft that holds a fixed attitude relative to LVLH — keeping a camera on the ground, say — is therefore turning in inertial space at $n$ about its pitch axis. Its gyros read

$$
\boldsymbol{\omega}_{B/I} = \boldsymbol{\omega}_{B/LVLH} + \boldsymbol{\omega}_{LVLH/I} = 0 + n\,\hat{\mathbf{C}},
$$

by lesson 02's addition rule. A controller that commands zero body rate to "hold attitude in LVLH" is wrong by exactly this much, and the camera drifts off target at $3.9^\circ$ per minute.

### Why orbit errors are reported in RIC

Errors behave differently along the three axes, so orbit reports quote them in RIC rather than $x$, $y$, $z$.

- **Cross-track** errors come from the tilt and swing of the orbit plane. They stay bounded.
- **Radial** errors are usually the smallest, but they change the orbit's energy, and that feeds the in-track error.
- **In-track** errors are the largest, and they grow steadily.

Here is how a radial error feeds the in-track one. Let the semi-major axis be off by $\Delta a$. A bigger orbit is a slower lap: the period changes by $\Delta T / T = \tfrac{3}{2}\,\Delta a / a$. Since one lap is $vT = 2\pi a$, the along-track slip after one lap is

$$
v\,\Delta T = v T \cdot \frac{3}{2}\frac{\Delta a}{a} = 2\pi a \cdot \frac{3}{2}\frac{\Delta a}{a} = 3\pi\,\Delta a .
$$

A $1\,\mathrm{km}$ height error becomes a $9.4\,\mathrm{km}$ in-track error one orbit later, and $146\,\mathrm{km}$ after a day. A timing error lands straight on the in-track axis too: one second of clock error on the ISS is $7.67\,\mathrm{km}$ in-track.

::: key LVLH / RIC
Radial along $\mathbf{r}$ (outward, or nadir, depending on convention), In-track along-track completing the triad, Cross-track along the orbit normal $\mathbf{h}$. $\hat{\mathbf{R}} = \mathbf{r}/r$, $\hat{\mathbf{C}} = \mathbf{h}/h$, $\hat{\mathbf{I}} = \hat{\mathbf{C}} \times \hat{\mathbf{R}}$. It rotates at $h/r^2$ about $\hat{\mathbf{C}}$ ($n$ for a circular orbit) and is the natural frame for relative motion and for reporting orbit errors.
:::

::: example RIC triad for an ISS-like state
Take the state from lesson 05: $\mathbf{r}^{I} = (3\,143\,570.5,\; 5\,385\,797.9,\; 2\,655\,990.8)\,\mathrm{m}$ and $\mathbf{v}^{I} = (-5\,588.821,\; 695.418,\; 5\,204.638)\,\mathrm{m/s}$, with $r = 6\,778\,137\,\mathrm{m}$.

**Radial.** $\hat{\mathbf{R}} = \mathbf{r}/r = (0.46378,\; 0.79458,\; 0.39185)$.

**Cross-track.** The cross product $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ has components $(y v_z - z v_y,\; z v_x - x v_z,\; x v_y - y v_x)$. Its length is $h = 5.1979 \times 10^{10}\,\mathrm{m^2/s}$, equal to $r v$, as it must be when $\mathbf{r}$ and $\mathbf{v}$ are perpendicular (a circular orbit). Dividing, $\hat{\mathbf{C}} = (0.50375,\; -0.60034,\; 0.62115)$.

**In-track.** $\hat{\mathbf{I}} = \hat{\mathbf{C}} \times \hat{\mathbf{R}} = (-0.72880,\; 0.09068,\; 0.67870)$. It matches $\mathbf{v}/|\mathbf{v}|$ to five figures: the orbit is circular. The velocity in RIC is $\mathbf{R}_{RIC \leftarrow I}\mathbf{v}^{I} = (0,\; 7\,668.56,\; 0)\,\mathrm{m/s}$: all in-track, as it should be.

**A chaser.** A visiting vehicle sits $1\,\mathrm{km}$ behind and $100\,\mathrm{m}$ below the station, so $\boldsymbol{\rho}^{RIC} = (-100,\; -1000,\; 0)\,\mathrm{m}$. Going back to ECI uses the transpose:

$$
\boldsymbol{\rho}^{I} = \mathbf{R}_{RIC \leftarrow I}^{T}\boldsymbol{\rho}^{RIC} = -100\,\hat{\mathbf{R}} - 1000\,\hat{\mathbf{I}} = (682.4,\; -170.1,\; -717.9)\,\mathrm{m},
$$

with length $1\,005\,\mathrm{m}$. Check: $\sqrt{100^2 + 1000^2} = 1\,005$, the same, because rotations keep lengths. In ECI the numbers tell a human nothing. In RIC, "behind and below" is plain, and says what happens next: a chaser **[[below the target drifts forward|lower-is-faster]]**, which every rendezvous plan uses.
:::

## The perifocal frame

RIC follows the satellite. The **perifocal frame** $P$ (or PQW) is fixed to the *orbit* — a map of the racetrack, not a camera on one car. Its origin is the orbit's focus, Earth's center, and its axes are

$$
\hat{\mathbf{p}} \text{ toward periapsis}, \qquad
\hat{\mathbf{w}} = \frac{\mathbf{h}}{h} \text{ along the angular momentum}, \qquad
\hat{\mathbf{q}} = \hat{\mathbf{w}} \times \hat{\mathbf{p}} .
$$

**Periapsis** is the orbit's lowest point. So $\hat{\mathbf{q}}$ lies in the orbit plane, $90^\circ$ ahead of periapsis in the direction of motion, and $(\hat{\mathbf{p}}, \hat{\mathbf{q}}, \hat{\mathbf{w}})$ is right-handed. For two-body motion all three stay fixed, and the orbit is a flat curve in the $\hat{\mathbf{p}}$–$\hat{\mathbf{q}}$ plane.

Measure the true anomaly $\nu$ from $\hat{\mathbf{p}}$. Let $e$ be the eccentricity (how stretched the ellipse is, $0$ for a circle) and $p = a(1 - e^2)$ the **semi-latus rectum**, a length that sets the orbit's size. Then the radius is $r = p / (1 + e\cos\nu)$ and

$$
\mathbf{r}^{P} = \begin{bmatrix} r\cos\nu \\ r\sin\nu \\ 0 \end{bmatrix}, \qquad
\mathbf{v}^{P} = \sqrt{\frac{\mu}{p}} \begin{bmatrix} -\sin\nu \\ e + \cos\nu \\ 0 \end{bmatrix} .
$$

The position is polar coordinates in the orbit plane. The velocity comes from differentiating it, using $\dot{\nu} = h/r^2$ and $h = \sqrt{\mu p}$ (the two-body module works it through). Together they turn six orbital elements into a state vector: write $\mathbf{r}^{P}$ and $\mathbf{v}^{P}$, then rotate into ECI.

The rotation is a 3-1-3 sequence of the classical orbital elements. From ECI, make three turns:

1. Turn about $z$ through the **right ascension of the ascending node** $\Omega$ (capital omega), bringing $x$ onto the line where the orbit crosses the equator going north.
2. Tilt about that new $x$ through the **inclination** $i$, bringing $z$ onto $\hat{\mathbf{w}}$.
3. Turn about the new $z$ through the **argument of periapsis** $\omega$ (small omega), bringing $x$ onto $\hat{\mathbf{p}}$.

Each is a passive rotation from lesson 01, chained with matching inner labels:

$$
\mathbf{R}_{P \leftarrow I} = \mathbf{R}_3(\omega)\,\mathbf{R}_1(i)\,\mathbf{R}_3(\Omega), \qquad
\mathbf{r}^{I} = \mathbf{R}_{P \leftarrow I}^{T}\,\mathbf{r}^{P} = \mathbf{R}_3(\Omega)^{T}\mathbf{R}_1(i)^{T}\mathbf{R}_3(\omega)^{T}\,\mathbf{r}^{P} .
$$

Check a case you can picture: $\Omega = 0$, $i = 0$, $\omega = 90^\circ$ puts periapsis on the ECI $+y$ axis. Then $\mathbf{R}_{P \leftarrow I} = \mathbf{R}_3(90^\circ)$, and the ECI vector $(0, 1, 0)$ maps to $(1, 0, 0)$ — which is $\hat{\mathbf{p}}$ in its own coordinates. Correct.

RIC is the perifocal frame turned about $\hat{\mathbf{w}}$ through the true anomaly: $\mathbf{R}_{RIC \leftarrow P} = \mathbf{R}_3(\nu)$, with $\hat{\mathbf{C}} = \hat{\mathbf{w}}$.

::: key Perifocal frame
$\hat{\mathbf{p}}$ toward periapsis, $\hat{\mathbf{w}}$ along the angular momentum $\mathbf{h}$, $\hat{\mathbf{q}} = \hat{\mathbf{w}} \times \hat{\mathbf{p}}$ completing the right-handed set $90^\circ$ ahead of periapsis. Position is $(r\cos\nu, r\sin\nu, 0)$ in it, velocity $\sqrt{\mu/p}\,(-\sin\nu, e + \cos\nu, 0)$, and $\mathbf{R}_{P \leftarrow I} = \mathbf{R}_3(\omega)\mathbf{R}_1(i)\mathbf{R}_3(\Omega)$.
:::

::: example A Molniya-type orbit in perifocal coordinates
A **[[Molniya|molniya]]**-type orbit is a stretched twelve-hour orbit with $a = 26\,562\,\mathrm{km}$ and $e = 0.74$.

**Size.** Periapsis is at $r_p = a(1 - e) = 26\,562 \times 0.26 = 6\,906\,\mathrm{km}$, about $530\,\mathrm{km}$ up. Apoapsis is at $r_a = a(1 + e) = 26\,562 \times 1.74 = 46\,218\,\mathrm{km}$. The semi-latus rectum is $p = a(1 - e^2) = 26\,562 \times 0.4524 = 12\,016.6\,\mathrm{km}$, and

$$
\sqrt{\frac{\mu}{p}} = \sqrt{\frac{3.986004418 \times 10^{14}}{1.20166 \times 10^{7}}} = 5\,759.4\,\mathrm{m/s}.
$$

**A quarter of the way round.** At $\nu = 90^\circ$, $\cos\nu = 0$, so $r = p / (1 + 0) = 12\,016.6\,\mathrm{km}$, and

$$
\mathbf{r}^{P} = \begin{bmatrix} 0 \\ 12\,016.6 \\ 0 \end{bmatrix} \mathrm{km}, \qquad
\mathbf{v}^{P} = 5\,759.4 \begin{bmatrix} -1 \\ 0.74 + 0 \\ 0 \end{bmatrix} = \begin{bmatrix} -5\,759.4 \\ 4\,262.0 \\ 0 \end{bmatrix} \mathrm{m/s} .
$$

**Check.** The speed is $\sqrt{5\,759.4^2 + 4\,262.0^2} = 7\,164.8\,\mathrm{m/s}$. The vis-viva equation, $v^2 = \mu(2/r - 1/a)$, gives $7\,164.8\,\mathrm{m/s}$ too — an independent check.

**Reading it.** The satellite sits on the $\hat{\mathbf{q}}$ axis, so the $\hat{\mathbf{q}}$ component is radial: $+4\,262\,\mathrm{m/s}$, outward, because it is climbing toward apoapsis. The flight-path angle is $\arctan(4\,262.0 / 5\,759.4) = 36.5^\circ$. In RIC at this instant the same velocity is $(4\,262.0,\; 5\,759.4,\; 0)$ — radial first, in-track second. RIC and perifocal share the plane but not the axes.
:::

## The topocentric frame

A ground station sees the sky from where it stands, so its **topocentric** frame ("topo" is Greek for "place") has the station as origin and local-level axes. Two conventions are common: lesson 06's ENU, and **SEZ** — $\hat{\mathbf{s}}$ south, $\hat{\mathbf{e}}$ east, $\hat{\mathbf{z}}$ zenith (straight up) — favored in classic astrodynamics books. SEZ is still right-handed, since $\hat{\mathbf{s}} \times \hat{\mathbf{e}} = \hat{\mathbf{z}}$.

Either way the recipe is the same. Find the arrow from station to satellite in ECEF, then rotate it:

$$
\boldsymbol{\rho}^{E} = \mathbf{r}^{E}_{sat} - \mathbf{r}^{E}_{site}, \qquad
\boldsymbol{\rho}^{U} = \mathbf{R}_{U \leftarrow E}\,\boldsymbol{\rho}^{E} = \begin{bmatrix} \rho_E \\ \rho_N \\ \rho_U \end{bmatrix} ,
$$

using lesson 06's ENU matrix at the site's geodetic latitude and longitude. Then the three things an antenna needs are

$$
\rho = |\boldsymbol{\rho}|, \qquad
\text{el} = \arcsin\frac{\rho_U}{\rho}, \qquad
\text{az} = \operatorname{atan2}(\rho_E, \rho_N) .
$$

The **range** $\rho$ is the distance. The **elevation** is the angle above the horizon. The **azimuth** is the compass direction, measured clockwise from north through east. Notice the order inside atan2: east first, north second, because azimuth is measured from north, the $y$ axis of ENU. ([[Picture|az-el]].) The satellite is above the horizon when $\rho_U > 0$.

Subtract in ECEF (or in ECI at one shared instant) *before* rotating. The site is fixed in ECEF, but the satellite state usually comes in ECI, and the ECI-to-ECEF rotation at the observation time is the step people forget.

::: example Elevation and azimuth of a pass
A station at Cape Canaveral ($\varphi = 28.5620^\circ$, $\lambda = -80.5772^\circ$, height $0$) has $\mathbf{r}^{E}_{site} = (917\,841,\; -5\,530\,566,\; 3\,031\,354)\,\mathrm{m}$, from lesson 06. A satellite is over geodetic $30.0^\circ$ north, $75.0^\circ$ west, at $400\,\mathrm{km}$. The same conversion gives $\mathbf{r}^{E}_{sat} = (1\,520\,476,\; -5\,674\,492,\; 3\,370\,374)\,\mathrm{m}$.

**Step 1: subtract in ECEF.** $\boldsymbol{\rho}^{E} = (602\,635,\; -143\,926,\; 339\,020)\,\mathrm{m}$.

**Step 2: rotate into ENU.** The rows of $\mathbf{R}_{U \leftarrow E}$ at the site are east $(0.9865, 0.1637, 0)$, north $(-0.0783, 0.4717, 0.8783)$ and up $(0.1438, -0.8664, 0.4781)$. Dot each row with $\boldsymbol{\rho}^{E}$:

$$
\boldsymbol{\rho}^{U} = \begin{bmatrix} 570\,940 \\ 182\,706 \\ 373\,449 \end{bmatrix} \mathrm{m} .
$$

**Step 3: the angles.**

$$
\rho = 706.3\,\mathrm{km}, \qquad
\text{el} = \arcsin\frac{373\,449}{706\,271} = 31.9^\circ, \qquad
\text{az} = \operatorname{atan2}(570\,940,\; 182\,706) = 72.3^\circ .
$$

So: $706\,\mathrm{km}$ away, $32^\circ$ up, east-northeast.

**Sanity check.** The satellite is about $1.4^\circ$ north and $5.6^\circ$ east of the station. At about $111\,\mathrm{km}$ per degree (times $\cos 29^\circ$ east-west), the ground distance is roughly $\sqrt{(1.4 \times 111)^2 + (5.6 \times 111 \times \cos 29^\circ)^2} \approx 565\,\mathrm{km}$. Then $\arctan(400 / 565) \approx 35^\circ$. Close to $31.9^\circ$; Earth's curvature drops a far satellite toward the horizon, which explains the gap.
:::

## Sensor frames

Every measurement is made in its instrument's frame, and no instrument is perfectly lined up with the body. A star tracker's **boresight** (the direction it looks) is usually its $+z$ axis. A camera has the axes of its image chip. A GNSS antenna has a **phase center**, the point its signals are really measured at, offset from the center of mass.

Each **sensor frame** $S$ is tied to the body by a fixed rotation $\mathbf{R}_{B \leftarrow S}$, the **mounting** matrix, and for position measurements by a **lever arm** $\mathbf{l}^{B}$, the arrow from the body origin to the sensor.

The star tracker matches stars to a catalogue kept in GCRF, so its natural output is $\mathbf{R}_{I \leftarrow S}$: where its own axes point relative to the stars. The body attitude is then

$$
\mathbf{R}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow S}\,\mathbf{R}_{S \leftarrow B} = \mathbf{R}_{I \leftarrow S}\,\mathbf{R}_{B \leftarrow S}^{T} ,
$$

inner labels matching as always. Any error in $\mathbf{R}_{B \leftarrow S}$ goes straight into the body attitude, one for one.

Mounting matrices are measured before launch to a few **[[arcseconds|arcsecond]]**. Launch shaking and heating shift them by tens of arcseconds, so they are re-estimated in flight against a second sensor or the payload's pictures. For scale: from $400\,\mathrm{km}$ up, a camera whose boresight is known to $10''$ places a ground feature to

$$
400\,000\,\mathrm{m} \times \frac{10}{206\,265} = 19\,\mathrm{m}.
$$

A $1\,\mathrm{mrad}$ misalignment left uncorrected is $400\,\mathrm{m}$ on the ground.

A GNSS antenna on a boom is at $\mathbf{r}_{ant} = \mathbf{r}_{cm} + \mathbf{R}_{I \leftarrow B}\,\mathbf{l}^{B}$. By the transport theorem its velocity picks up an extra $\boldsymbol{\omega}_{B/I} \times \mathbf{l}$, the way the tip of a spinning ruler moves faster than its middle. With a $2\,\mathrm{m}$ lever arm on a vehicle rolling at $0.5\,\mathrm{rad/s}$, that is $2 \times 0.5 = 1\,\mathrm{m/s}$ of velocity the center of mass does not have. An IMU placed away from the center of mass also feels the centripetal and Euler terms of lesson 04 on top of the vehicle's acceleration. Removing them, **size-effect compensation**, needs both the lever arm and the sensor frame right.

## The frame zoo, in one table

| Frame | Origin | Axes | Rotates relative to ECI? | Native to |
| --- | --- | --- | --- | --- |
| ECI (J2000, GCRF) | Earth center | Pole, equinox | No | Orbit propagation, star trackers |
| ECEF (ITRF, WGS-84) | Earth center | Pole, reference meridian | Yes, $\omega_E$ about $z$ | Ground sites, GNSS, gravity models |
| NED, ENU | Vehicle or site | Geodetic north, east, vertical | Yes, $\omega_E$ + transport rate | INS, aircraft, surveying |
| Body | Center of mass | Structural | Yes, gyro rate $\boldsymbol{\omega}_{B/I}$ | IMU, actuators, attitude |
| LVLH / RIC | Satellite | Radial, in-track, cross-track | Yes, $h/r^2$ about $\hat{\mathbf{C}}$ | Relative motion, orbit errors |
| Perifocal | Earth center | Periapsis, $\mathbf{h}$ | No (two-body) | Elements to state vector |
| Topocentric | Ground station | ENU or SEZ | Yes, with the site | Azimuth, elevation, range |
| Sensor | Instrument | Boresight, focal plane | Yes, with the body | Raw measurements |

::: warning "LVLH" alone is not a frame
Before using any LVLH quantity, find out which axis is nadir and whether the second axis is along $+\mathbf{h}$ or $-\mathbf{h}$. The Shuttle/ISS convention ($x$ along-track, $y = -\hat{\mathbf{C}}$, $z$ nadir) and RIC ($x = \hat{\mathbf{R}}$ outward, $z = \hat{\mathbf{C}}$) differ by a rotation that flips two signs and shuffles all three axes. Both are right-handed, so no determinant check catches a mix-up.
:::

::: warning A star tracker reports its own frame, against the stars
A star tracker gives its own optical frame's attitude relative to the inertial catalogue, not the body's relative to ECEF. A body-to-ECEF attitude needs the mounting matrix $\mathbf{R}_{B \leftarrow S}$ *and* the full ECI-to-ECEF rotation at the measurement time. Skip the first and the attitude is off by the misalignment. Skip the second and it is off by $\omega_E t$ — $15^\circ$ per hour.
:::

## Check yourself

::: check
A spacecraft in the ISS orbit holds a fixed attitude relative to the LVLH frame. What angular velocity do its gyros read, in size and direction? What happens if the attitude controller instead drives the gyro rates to zero?
:::

::: answer
Fixed relative to LVLH means $\boldsymbol{\omega}_{B/LVLH} = 0$. By the addition rule, $\boldsymbol{\omega}_{B/I} = \boldsymbol{\omega}_{LVLH/I} = n\,\hat{\mathbf{C}}$. For the circular ISS orbit $n = \sqrt{\mu/a^3} = 1.131 \times 10^{-3}\,\mathrm{rad/s}$, about $0.065^\circ/\mathrm{s}$, along the orbit normal. In body axes that is a steady rate about whichever body axis lines up with $\hat{\mathbf{C}}$, normally the pitch axis.

If the controller zeroes the gyro rates, the spacecraft stays fixed in inertial space and LVLH turns away from it at $n$. After a quarter orbit, about $23\,\mathrm{min}$, a ground-pointing camera looks at the horizon; after half an orbit, at deep space.
:::

::: check
Find the periapsis velocity of the Molniya orbit in the example ($a = 26\,562\,\mathrm{km}$, $e = 0.74$) with the perifocal velocity formula, and check it with vis-viva.
:::

::: answer
At periapsis $\nu = 0$, so $\sin\nu = 0$ and $\cos\nu = 1$:

$$
\mathbf{v}^{P} = \sqrt{\mu/p}\,(0,\; e + 1,\; 0) = 5\,759.4 \times 1.74\,\hat{\mathbf{q}} = 10\,021\,\mathrm{m/s}\ \text{along}\ \hat{\mathbf{q}} .
$$

It is all sideways, as it must be at the lowest point, and in the direction of motion. Vis-viva with $r_p = 6\,906\,120\,\mathrm{m}$:

$$
v_p = \sqrt{\mu\left(\frac{2}{r_p} - \frac{1}{a}\right)} = \sqrt{3.986004418 \times 10^{14}\left(\frac{2}{6.90612 \times 10^{6}} - \frac{1}{2.6562 \times 10^{7}}\right)} = 10\,021\,\mathrm{m/s} .
$$

The two agree. At apoapsis, $\nu = 180^\circ$, the same formula gives $5\,759.4 \times (0.74 - 1) = -1\,497\,\mathrm{m/s}$ along $\hat{\mathbf{q}}$ — that is, $1\,497\,\mathrm{m/s}$ along $-\hat{\mathbf{q}}$. The satellite crawls over the top at about $15\%$ of its periapsis speed, which is the whole point of a Molniya orbit.
:::

::: check
Show that $\mathbf{R}_{LVLH \leftarrow RIC}$ in the Shuttle convention is a proper rotation, and find which single rotation it is.
:::

::: answer
The matrix sends $(\rho_R, \rho_I, \rho_C)$ to $(\rho_I, -\rho_C, -\rho_R)$. Its columns are $(0, 0, -1)$, $(1, 0, 0)$ and $(0, -1, 0)$. Each has length $1$ and each pair is perpendicular, so the matrix is orthogonal. Expanding the determinant along the first row gives $0 - 1 \times (0 \times 0 - (-1)(-1)) + 0 = +1$, so it is proper: a real rotation, not a mirror.

To find the rotation, look for the axis it leaves alone. $(a, b, c) \mapsto (b, -c, -a)$ equals $(a, b, c)$ when $b = a$, $c = -b$ and $a = -c$. All three hold for $(1, 1, -1)$, so the axis is $(1, 1, -1)/\sqrt{3}$ in RIC coordinates. The trace of a rotation matrix is $1 + 2\cos\theta$; this trace is $0$, so $\cos\theta = -\tfrac{1}{2}$ and $\theta = 120^\circ$.

Any signed axis shuffle with determinant $+1$ is such a turn about a cube diagonal, which is why LVLH conventions differ by rotations that look nothing like small corrections.
:::

::: check
A satellite's ECI state is known at time $t$, and a ground station's coordinates are known in ECEF. List the steps, with a frame label on every quantity, that give the station's elevation angle to the satellite.
:::

::: answer
1. Compute the Earth rotation angle $\theta(t)$ and form $\mathbf{R}_{E \leftarrow I} = \mathbf{R}_3(\theta)$ (lesson 05).
2. Rotate the satellite position: $\mathbf{r}^{E}_{sat} = \mathbf{R}_{E \leftarrow I}\mathbf{r}^{I}_{sat}$. Only the position is needed; elevation does not use velocity.
3. Convert the station's geodetic $(\varphi, \lambda, h)$ to $\mathbf{r}^{E}_{site}$ with the WGS-84 formulas (lesson 06), or use its surveyed ECEF coordinates.
4. Subtract in ECEF: $\boldsymbol{\rho}^{E} = \mathbf{r}^{E}_{sat} - \mathbf{r}^{E}_{site}$.
5. Form $\mathbf{R}_{U \leftarrow E}$ at the station's geodetic latitude and longitude and rotate: $\boldsymbol{\rho}^{U} = \mathbf{R}_{U \leftarrow E}\boldsymbol{\rho}^{E}$.
6. $\text{el} = \arcsin(\rho_U / |\boldsymbol{\rho}|)$.

The classic errors live in steps 1 and 5: skipping the rotation into ECEF (an error of $\omega_E t \times r$, hundreds of kilometers within minutes), and building the local frame with geocentric instead of geodetic latitude (up to $11'$ of tilt).
:::

::: check
A GNSS antenna sits $3\,\mathrm{m}$ from a launch vehicle's center of mass along the body $x$ axis. During ascent the vehicle pitches over at $\boldsymbol{\omega}^{B}_{B/I} = (0, 0.02, 0)\,\mathrm{rad/s}$. How much does the antenna's inertial velocity differ from the center of mass velocity, and in which body direction?
:::

::: answer
The antenna is fixed in the body at $\mathbf{l}^{B} = (3, 0, 0)\,\mathrm{m}$. By the transport theorem its velocity relative to the center of mass is

$$
\boldsymbol{\omega}_{B/I} \times \mathbf{l} = (0, 0.02, 0) \times (3, 0, 0) = (0 \cdot 0 - 0 \cdot 0,\; 0 \cdot 3 - 0 \cdot 0,\; 0 \cdot 0 - 0.02 \cdot 3) = (0, 0, -0.06)\,\mathrm{m/s}.
$$

That is $6\,\mathrm{cm/s}$ along $-\hat{\mathbf{b}}_3$, which is *up* in aircraft-style body axes. Small, but GNSS measures velocity to a few centimeters per second. A filter that hands the antenna's velocity to the center of mass without this correction sees a $6\,\mathrm{cm/s}$ bias that flips sign with the pitch rate and corrupts the estimated velocity and attitude.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Body $B$ | Center of mass; aircraft: $x$ forward, $y$ right, $z$ down; spacecraft: declared per vehicle |
| $\boldsymbol{\omega}^{B}_{B/I}$, $\mathbf{f}^{B}$ | Gyro and accelerometer outputs, native to body axes |
| $\hat{\mathbf{R}} = \mathbf{r}/r$, $\hat{\mathbf{C}} = \mathbf{h}/h$, $\hat{\mathbf{I}} = \hat{\mathbf{C}} \times \hat{\mathbf{R}}$ | RIC triad; rows of $\mathbf{R}_{RIC \leftarrow I}$; applied to relative vectors |
| Shuttle LVLH | $x = \hat{\mathbf{I}}$, $y = -\hat{\mathbf{C}}$, $z = -\hat{\mathbf{R}}$ (nadir); $\det = +1$ |
| $\boldsymbol{\omega}_{RIC/I} = (h/r^2)\,\hat{\mathbf{C}}$ | LVLH rotation rate; $n = \sqrt{\mu/a^3} = 1.13 \times 10^{-3}\,\mathrm{rad/s}$ for the ISS |
| $3\pi\,\Delta a$ | In-track slip per orbit from a semi-major-axis error |
| $\hat{\mathbf{p}}, \hat{\mathbf{q}} = \hat{\mathbf{w}} \times \hat{\mathbf{p}}, \hat{\mathbf{w}} = \mathbf{h}/h$ | Perifocal frame; $\mathbf{r}^{P} = (r\cos\nu, r\sin\nu, 0)$, $\mathbf{v}^{P} = \sqrt{\mu/p}(-\sin\nu, e + \cos\nu, 0)$ |
| $\mathbf{R}_{P \leftarrow I} = \mathbf{R}_3(\omega)\mathbf{R}_1(i)\mathbf{R}_3(\Omega)$ | ECI to perifocal; $\mathbf{R}_{RIC \leftarrow P} = \mathbf{R}_3(\nu)$ |
| $\boldsymbol{\rho}^{U} = \mathbf{R}_{U \leftarrow E}(\mathbf{r}^{E}_{sat} - \mathbf{r}^{E}_{site})$ | Topocentric range vector; $\text{el} = \arcsin(\rho_U/\rho)$, $\text{az} = \operatorname{atan2}(\rho_E, \rho_N)$ |
| $\mathbf{R}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow S}\mathbf{R}_{B \leftarrow S}^{T}$ | Body attitude from a sensor's attitude and its mounting matrix |
| $\boldsymbol{\omega}_{B/I} \times \mathbf{l}$ | Lever-arm velocity of an offset sensor |

The next lesson turns to time. Every rotation in this module that involves the Earth needs an angle that depends on *when*. And "when" is kept on at least four different clocks — UT1, TAI, GPS and TT — that agree to within about a minute and disagree by enough to matter.

::: context coord-doc The document you read first
Every serious spacecraft program keeps a document that defines each frame it uses: where the origin is, which way each axis points, and which direction a positive rotation turns. Engineers often call it the "coordinate systems" or "frames and conventions" document. It is dull to read and priceless to have. When two teams disagree about a sign, it is the referee. When one is missing, the argument is settled in testing — or in flight.
:::

::: context specific-force What an accelerometer really feels
An accelerometer cannot feel gravity, because gravity pulls on the sensor's test mass and its case equally. What it feels is every *other* push: engine thrust, air drag, the floor pushing up on you. That total, divided by mass, is the **specific force**. Sitting on the launch pad, an accelerometer reads about $9.8\,\mathrm{m/s^2}$ *upward* — the pad pushing on the rocket — even though nothing is moving. Coasting in orbit, it reads nearly zero, even though the vehicle is falling around Earth the whole time. The navigation software adds gravity back from a model.
:::

::: context flight-path-angle Climbing and diving on an ellipse
On a circular orbit the satellite always moves exactly sideways — perpendicular to the line from Earth's center. On an ellipse it climbs on the way out and dives on the way back. The **flight-path angle** $\gamma$ measures how steeply: the angle between the velocity and the local horizontal, the in-track direction. It is zero at periapsis and apoapsis, and largest in between. For the Molniya orbit in the example it is $36.5^\circ$ at $\nu = 90^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="120" x2="70" y2="120" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="62,120 74,114 74,126" fill="#6c7a93"/>
  <text x="70" y="140" font-size="12" fill="#1f2a44">in-track</text>
  <line x1="180" y1="120" x2="180" y2="32" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="180,24 174,36 186,36" fill="#6c7a93"/>
  <text x="188" y="36" font-size="12" fill="#1f2a44">radial (out)</text>
  <line x1="180" y1="120" x2="97" y2="58.6" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="90.6,53.8 103.8,56.2 96.6,65.8" fill="#1d6fd1"/>
  <text x="60" y="48" font-size="12" fill="#1d6fd1">velocity</text>
  <path d="M 130,120 A 50,50 0 0,1 139.8,90.3" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="112" y="108" font-size="13" fill="#b4232c">γ</text>
  <circle cx="180" cy="120" r="5" fill="#1f2a44"/>
  <text x="192" y="135" font-size="12" fill="#1f2a44">satellite</text>
  <line x1="180" y1="126" x2="180" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="188" y="160" font-size="11" fill="#6c7a93">to Earth</text>
</svg>
```
:::

::: context ric-picture The RIC triad on an orbit
Looking down on the orbit from above its plane. The satellite moves counterclockwise. $\hat{\mathbf{R}}$ points straight away from Earth, $\hat{\mathbf{I}}$ points along the path, and $\hat{\mathbf{C}}$ points out of the page, toward you — along the angular momentum. As the satellite goes around, the whole triad turns once per orbit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="115" r="80" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="120" cy="115" r="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="119" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <line x1="120" y1="115" x2="176.6" y2="58.4" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="176.6" y1="58.4" x2="202.1" y2="32.9" stroke="#b4232c" stroke-width="3"/>
  <polygon points="207.8,27.2 203.5,40.0 195.0,31.5" fill="#b4232c"/>
  <text x="212" y="30" font-size="13" fill="#b4232c">R̂ radial</text>
  <line x1="176.6" y1="58.4" x2="151.1" y2="32.9" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="145.4,27.2 158.2,31.5 149.7,40.0" fill="#1d6fd1"/>
  <text x="96" y="22" font-size="13" fill="#1d6fd1">Î in-track</text>
  <circle cx="176.6" cy="58.4" r="8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="176.6" cy="58.4" r="2.5" fill="#1f2a44"/>
  <text x="228" y="70" font-size="13" fill="#1f2a44">Ĉ cross-track:</text>
  <text x="228" y="86" font-size="12" fill="#1f2a44">out of the page</text>
  <path d="M 40,115 A 80,80 0 0,0 64.4,172.6" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="70.2,178.1 57.4,174.1 65.7,165.5" fill="#1f2a44"/>
  <text x="228" y="150" font-size="12" fill="#6c7a93">orbit, seen from</text>
  <text x="228" y="166" font-size="12" fill="#6c7a93">above its plane</text>
</svg>
```
:::

::: context lower-is-faster Lower orbits lap faster
On a running track, the inside lane is shorter. In orbit it is also *faster*: a lower orbit has a higher speed and a shorter period. So a chaser $100\,\mathrm{m}$ below the ISS gains on it every lap, sliding forward along the in-track axis without firing an engine. Rendezvous planners use exactly this — drop a little lower to catch up, rise a little higher to fall back. The relative-motion module turns it into the Clohessy–Wiltshire equations, written in the RIC frame of this lesson.
:::

::: context molniya The orbit that hangs over Russia
Much of Russia is so far north that a geostationary satellite over the equator sits low on the horizon, or below it. The Soviet Molniya ("lightning") communication satellites of the 1960s used a stretched twelve-hour orbit instead, tilted about $63.4^\circ$ to the equator and with apoapsis over the north. The satellite spends most of each orbit crawling slowly near its high point, hanging over the country for hours, then whips quickly through its low point on the far side. The $63.4^\circ$ tilt is the special angle at which Earth's bulge does not turn the ellipse around within its plane, so the high point stays over the north.
:::

::: context az-el Azimuth and elevation
Azimuth is a compass bearing: $0^\circ$ north, $90^\circ$ east, turning clockwise seen from above. Elevation is the angle up from the horizon: $0^\circ$ on the horizon, $90^\circ$ straight overhead. Together they tell a dish antenna which way to face and how far to tilt. Here are the example's $72.3^\circ$ and $31.9^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="90" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">seen from above</text>
  <line x1="90" y1="110" x2="90" y2="50" stroke="#6c7a93" stroke-width="2"/>
  <text x="90" y="44" font-size="12" text-anchor="middle" fill="#1f2a44">N</text>
  <line x1="90" y1="110" x2="150" y2="110" stroke="#6c7a93" stroke-width="2"/>
  <text x="158" y="114" font-size="12" fill="#1f2a44">E</text>
  <line x1="90" y1="110" x2="147.2" y2="91.8" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M 90,85 A 25,25 0 0,1 113.8,102.4" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="104" y="80" font-size="12" fill="#b4232c">az 72.3°</text>
  <circle cx="90" cy="110" r="3" fill="#1f2a44"/>
  <text x="90" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">station</text>
  <text x="280" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">seen from the side</text>
  <line x1="215" y1="160" x2="345" y2="160" stroke="#6c7a93" stroke-width="2"/>
  <text x="330" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">horizon</text>
  <line x1="220" y1="160" x2="313.4" y2="101.9" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="313.4" cy="101.9" r="4" fill="#1d6fd1"/>
  <text x="300" y="92" font-size="11" fill="#1d6fd1">satellite</text>
  <path d="M 255,160 A 35,35 0 0,0 249.7,141.5" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="258" y="150" font-size="12" fill="#b4232c">el 31.9°</text>
  <circle cx="220" cy="160" r="3" fill="#1f2a44"/>
</svg>
```
:::

::: context arcsecond How small an arcsecond is
A degree splits into $60$ arcminutes ($'$), and each arcminute into $60$ arcseconds ($''$). So one arcsecond is $1/3600$ of a degree. In radians, one arcsecond is $1/206\,265$ — which is why that odd number turns an angle in arcseconds into a distance: multiply the range by the arcseconds and divide by $206\,265$. A coin $2.4\,\mathrm{cm}$ across seen from $5\,\mathrm{km}$ away spans about one arcsecond. Star trackers measure attitude to a few arcseconds.
:::
