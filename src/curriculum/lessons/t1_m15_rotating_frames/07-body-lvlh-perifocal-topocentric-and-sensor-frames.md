---
id: l07-body-lvlh-perifocal-topocentric-and-sensor-frames
title: Body, LVLH, perifocal, topocentric and sensor frames
minutes: 24
covers:
  - body, LVLH / RIC, perifocal, topocentric and sensor frames
---

The two Earth frames of lesson 05 and the local-level frames of lesson 06 describe where a vehicle is. The frames in this lesson describe how it is oriented, where it is relative to its own orbit, how a ground station sees it, and where on the vehicle a measurement was actually made. A rendezvous is planned in a frame that rides along the target's orbit. An orbit determination report quotes errors as radial, in-track and cross-track. A tracking antenna is commanded in azimuth and elevation from its own site. A star tracker reports the orientation of its own optical axis, not of the spacecraft, and the two differ by a mounting matrix that someone had to measure.

None of these frames is exotic, and every one of them is a rigid triad with an origin, related to ECI or ECEF by a rotation matrix that lesson 01's rules build in a few lines. What makes them dangerous is that several have more than one convention in common use — LVLH in particular is defined three different ways in three standard references — and that the differences are axis permutations and sign flips that produce plausible numbers when confused. So each frame below is stated with its origin, its axes, its rotation matrix from a parent frame, and the check that tells you which convention a given data set is using.

By the end you should be able to take a state vector in ECI and write down, by hand, the matrices into every frame in this lesson, and to read a colleague's variable `v_lvlh` and immediately ask the one question that determines whether you can use it.

## The body frame

The body frame $B$ is fixed to the vehicle's structure with its origin at the centre of mass (or a fixed structural reference point, which must be stated). Its axes are conventional and must be declared per vehicle:

- **Aircraft and most launch vehicles**: $\hat{\mathbf{b}}_1$ forward along the fuselage, $\hat{\mathbf{b}}_2$ toward the right wing, $\hat{\mathbf{b}}_3$ down — so that in level flight heading north the body axes are parallel to NED and roll, pitch and yaw are all zero.
- **Spacecraft**: no universal rule. A common choice puts $\hat{\mathbf{b}}_3$ along the main payload boresight and $\hat{\mathbf{b}}_1$ along the velocity direction for nominal nadir pointing, but every programme writes its own definition in a coordinate-systems document, and the first thing to do on joining one is to read it.

Two objects live natively in body axes. The gyro triad measures $\boldsymbol{\omega}^{B}_{B/I}$, the angular velocity of the body relative to inertial space resolved in body axes — `omega_body_wrt_eci_in_body` — and the accelerometer triad measures the specific force $\mathbf{f}^{B}$. The attitude itself is the rotation $\mathbf{R}_{I \leftarrow B}$, whose columns are the body axes resolved in ECI; its transpose $\mathbf{R}_{B \leftarrow I}$ is equally common in the literature, and a "body-to-inertial" quaternion in one document is an "inertial-to-body" quaternion in the next. Lesson 02's kinematics, $\dot{\mathbf{R}}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow B}[\boldsymbol{\omega}^{B}_{B/I}\times]$, is how the gyros propagate it.

The IMU is bolted to the structure with its own axes, which are never exactly the body axes. The relation is a fixed mount matrix $\mathbf{R}_{B \leftarrow IMU}$, measured before flight and refined by calibration; treat "IMU frame" and "body frame" as distinct labels even when the matrix is within a milliradian of the identity, because a milliradian of gyro axis misalignment turns a fast roll into a spurious pitch rate.

## The LVLH and RIC frames

Attach a frame to a satellite that follows it around its orbit and keeps one axis pointing at the Earth. The Local Vertical Local Horizontal (LVLH) frame does this, and its cleanest version is the RIC triad:

$$
\hat{\mathbf{R}} = \frac{\mathbf{r}}{|\mathbf{r}|}, \qquad
\hat{\mathbf{C}} = \frac{\mathbf{h}}{|\mathbf{h}|} = \frac{\mathbf{r} \times \mathbf{v}}{|\mathbf{r} \times \mathbf{v}|}, \qquad
\hat{\mathbf{I}} = \hat{\mathbf{C}} \times \hat{\mathbf{R}} ,
$$

with $\mathbf{r}$ and $\mathbf{v}$ the satellite's ECI position and inertial velocity. $\hat{\mathbf{R}}$ is **radial**, outward from the Earth's centre. $\hat{\mathbf{C}}$ is **cross-track**, along the orbital angular momentum, normal to the orbit plane. $\hat{\mathbf{I}}$ is **in-track** (or along-track), in the orbit plane and perpendicular to the radius, so that it points in the direction of motion; for a circular orbit it is exactly along $\mathbf{v}$, and for an eccentric orbit it differs from $\hat{\mathbf{v}}$ by the flight-path angle. Handedness: $\hat{\mathbf{R}} \times \hat{\mathbf{I}} = \hat{\mathbf{R}} \times (\hat{\mathbf{C}} \times \hat{\mathbf{R}}) = \hat{\mathbf{C}}(\hat{\mathbf{R}}\cdot\hat{\mathbf{R}}) - \hat{\mathbf{R}}(\hat{\mathbf{R}}\cdot\hat{\mathbf{C}}) = \hat{\mathbf{C}}$, so $(\hat{\mathbf{R}}, \hat{\mathbf{I}}, \hat{\mathbf{C}})$ is right-handed. The same triad is called RSW or RTN (radial, transverse, normal) in other texts; the letters change, the vectors do not.

The coordinate transformation from ECI has the three unit vectors as its rows:

$$
\mathbf{R}_{RIC \leftarrow I} = \begin{bmatrix} \hat{\mathbf{R}}^{I\,T} \\ \hat{\mathbf{I}}^{I\,T} \\ \hat{\mathbf{C}}^{I\,T} \end{bmatrix}, \qquad
\boldsymbol{\rho}^{RIC} = \mathbf{R}_{RIC \leftarrow I}\,\boldsymbol{\rho}^{I} ,
$$

applied to *relative* vectors $\boldsymbol{\rho}$ — the position of a second spacecraft relative to this one, or the difference between an estimated and a true orbit — whose origin is the satellite itself.

### The LVLH conventions

The Shuttle and ISS programmes defined LVLH with $+z$ toward nadir, $+y$ along the *negative* orbit normal, and $+x$ completing the set, which puts it along the direction of motion:

$$
\hat{\mathbf{x}}_{LVLH} = \hat{\mathbf{I}}, \qquad \hat{\mathbf{y}}_{LVLH} = -\hat{\mathbf{C}}, \qquad \hat{\mathbf{z}}_{LVLH} = -\hat{\mathbf{R}} ,
\qquad
\mathbf{R}_{LVLH \leftarrow RIC} = \begin{bmatrix} 0 & 1 & 0 \\ 0 & 0 & -1 \\ -1 & 0 & 0 \end{bmatrix} .
$$

This matrix has determinant $+1$ (check: expanding along the first row, $-1 \times (0 \times 0 - (-1)(-1)) = +1$), so the LVLH triad is right-handed too — it is the RIC triad seen from a vehicle whose body axes are aircraft-like, $x$ forward and $z$ down toward the planet, so that a nadir-pointing spacecraft flying "straight and level" has zero attitude relative to it. Other documents use $x$ radial-out, $z$ along $+\mathbf{h}$ (that is RIC under another name), or $x$ along-track with $z$ radial-*out*. The one question to ask of any `v_lvlh`: which axis is nadir, and is the $y$ axis along $+\mathbf{h}$ or $-\mathbf{h}$? The answer fixes everything else.

### How fast the frame turns

RIC rotates relative to ECI. For two-body motion $\hat{\mathbf{C}}$ is fixed, and $\hat{\mathbf{R}}$ sweeps round the orbit plane at the rate the true anomaly changes, $\dot{\nu} = h/r^2$ with $h = |\mathbf{r} \times \mathbf{v}|$, so

$$
\boldsymbol{\omega}_{RIC/I} = \frac{h}{r^2}\,\hat{\mathbf{C}} , \qquad \text{circular orbit:}\quad \boldsymbol{\omega}_{RIC/I} = n\,\hat{\mathbf{C}}, \quad n = \sqrt{\frac{\mu}{a^3}} .
$$

For the ISS at $a = 6\,778\,137\,\mathrm{m}$, $n = \sqrt{3.986004418 \times 10^{14} / (6.778137 \times 10^{6})^3} = 1.131 \times 10^{-3}\,\mathrm{rad/s} = 0.0648\,^\circ/\mathrm{s}$, about $3.9^\circ$ per minute. A spacecraft that holds a fixed attitude relative to LVLH — pointing a camera at the ground, say — is therefore rotating in inertial space at $n$ about its pitch axis, and its gyros read $\boldsymbol{\omega}_{B/I} = \boldsymbol{\omega}_{B/LVLH} + \boldsymbol{\omega}_{LVLH/I} = 0 + n\,\hat{\mathbf{C}}$, lesson 02's addition rule. A control law that commands zero body rate for "attitude hold" in LVLH is wrong by exactly this much, and the error shows up as a nadir-pointing camera drifting off the ground track at $3.9^\circ$ per minute.

### Why orbit errors are reported in RIC

Perturbations and estimation errors have very different signatures along the three axes, which is why orbit determination results are quoted as radial, in-track and cross-track rather than $x$, $y$, $z$. Cross-track errors reflect the orbit plane (inclination, node) and stay bounded. Radial errors are typically the smallest but couple into energy: a radial error $\Delta a$ in semi-major axis changes the period by $\Delta T / T = \tfrac{3}{2}\Delta a / a$, and since $vT = 2\pi a$ the along-track slip after one revolution is $v\,\Delta T = 3\pi\,\Delta a$ — a $1\,\mathrm{km}$ altitude error becomes a $9.4\,\mathrm{km}$ in-track error one orbit later and $146\,\mathrm{km}$ after a day. In-track errors are thus the largest and grow secularly, and a timing error maps straight onto them: one second of clock error on the ISS is $7.67\,\mathrm{km}$ in-track. When a tracking report says "the in-track error is $2\,\mathrm{km}$", the RIC frame is what makes that number meaningful.

::: key
LVLH / RIC: Radial along $\mathbf{r}$ (outward, or nadir, depending on convention), In-track along-track completing the triad, Cross-track along the orbit normal $\mathbf{h}$. $\hat{\mathbf{R}} = \mathbf{r}/r$, $\hat{\mathbf{C}} = \mathbf{h}/h$, $\hat{\mathbf{I}} = \hat{\mathbf{C}} \times \hat{\mathbf{R}}$. It rotates at $h/r^2$ about $\hat{\mathbf{C}}$ ($n$ for a circular orbit) and is the natural frame for relative motion and for reporting orbit errors.
:::

::: example RIC triad for the ISS-like state
Take the state of lesson 05, $\mathbf{r}^{I} = (3\,143\,570.5,\; 5\,385\,797.9,\; 2\,655\,990.8)\,\mathrm{m}$ and $\mathbf{v}^{I} = (-5\,588.821,\; 695.418,\; 5\,204.638)\,\mathrm{m/s}$, with $r = 6\,778\,137\,\mathrm{m}$.

Radial: $\hat{\mathbf{R}} = \mathbf{r}/r = (0.46378,\; 0.79458,\; 0.39185)$.

Cross-track: $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ has components $(y v_z - z v_y,\; z v_x - x v_z,\; x v_y - y v_x)$; carried through with the numbers above, $h = 5.1979 \times 10^{10}\,\mathrm{m^2/s}$ — equal to $r v$, as it must be for a circular orbit where $\mathbf{r} \perp \mathbf{v}$ — and $\hat{\mathbf{C}} = (0.50375,\; -0.60034,\; 0.62115)$.

In-track: $\hat{\mathbf{I}} = \hat{\mathbf{C}} \times \hat{\mathbf{R}} = (-0.72880,\; 0.09068,\; 0.67870)$, which is $\mathbf{v}/|\mathbf{v}|$ to five figures, confirming the orbit is circular at this instant. The velocity in RIC is $\mathbf{R}_{RIC \leftarrow I}\mathbf{v}^{I} = (0,\; 7\,668.56,\; 0)\,\mathrm{m/s}$: purely in-track.

Now a chaser vehicle that is $1\,\mathrm{km}$ behind and $100\,\mathrm{m}$ below the station has relative position $\boldsymbol{\rho}^{RIC} = (-100,\; -1000,\; 0)\,\mathrm{m}$. Its ECI offset is $\boldsymbol{\rho}^{I} = \mathbf{R}_{RIC \leftarrow I}^{T}\boldsymbol{\rho}^{RIC} = -100\,\hat{\mathbf{R}} - 1000\,\hat{\mathbf{I}} = (682.4,\; -170.1,\; -717.9)\,\mathrm{m}$, magnitude $1\,005\,\mathrm{m}$. In ECI the three numbers say nothing a human can check; in RIC, "behind and below" is legible, and it is also physically informative: a chaser below the target is in a lower, faster orbit and will drift *forward* relative to it, which is the mechanism every rendezvous profile exploits.
:::

## The perifocal frame

Where RIC follows the satellite, the perifocal frame $P$ (also PQW) is fixed to the *orbit*. Its origin is the focus — the Earth's centre — and its axes are

$$
\hat{\mathbf{p}} \text{ toward periapsis}, \qquad
\hat{\mathbf{w}} = \frac{\mathbf{h}}{h} \text{ along the angular momentum}, \qquad
\hat{\mathbf{q}} = \hat{\mathbf{w}} \times \hat{\mathbf{p}} ,
$$

so $\hat{\mathbf{q}}$ lies in the orbit plane $90^\circ$ ahead of periapsis in the direction of motion, and $(\hat{\mathbf{p}}, \hat{\mathbf{q}}, \hat{\mathbf{w}})$ is right-handed. For two-body motion all three are constant, and the orbit is a plane curve in the $\hat{\mathbf{p}}$–$\hat{\mathbf{q}}$ plane. With true anomaly $\nu$ measured from $\hat{\mathbf{p}}$, semi-latus rectum $p = a(1 - e^2)$ and $r = p / (1 + e\cos\nu)$,

$$
\mathbf{r}^{P} = \begin{bmatrix} r\cos\nu \\ r\sin\nu \\ 0 \end{bmatrix}, \qquad
\mathbf{v}^{P} = \sqrt{\frac{\mu}{p}} \begin{bmatrix} -\sin\nu \\ e + \cos\nu \\ 0 \end{bmatrix} .
$$

The velocity formula comes from differentiating the position with $\dot{\nu} = h/r^2$ and $h = \sqrt{\mu p}$; the two-body module derives it in full. Its value here is that it lets you convert six orbital elements into a state vector in three steps: write $\mathbf{r}^{P}$ and $\mathbf{v}^{P}$, then rotate into ECI.

The rotation is a 3-1-3 sequence of the classical elements. Starting from ECI, turn about $z$ through the right ascension of the ascending node $\Omega$ to bring $x$ onto the line of nodes; tilt about that new $x$ through the inclination $i$ to bring $z$ onto $\hat{\mathbf{w}}$; then turn about the new $z$ through the argument of periapsis $\omega$ to bring $x$ onto $\hat{\mathbf{p}}$. Each step is a passive elementary rotation from lesson 01, and they chain with matching inner labels:

$$
\mathbf{R}_{P \leftarrow I} = \mathbf{R}_3(\omega)\,\mathbf{R}_1(i)\,\mathbf{R}_3(\Omega), \qquad
\mathbf{r}^{I} = \mathbf{R}_{P \leftarrow I}^{T}\,\mathbf{r}^{P} = \mathbf{R}_3(\Omega)^{T}\mathbf{R}_1(i)^{T}\mathbf{R}_3(\omega)^{T}\,\mathbf{r}^{P} .
$$

Check with a case you can see: $\Omega = 0$, $i = 0$, $\omega = 90^\circ$ puts periapsis on the ECI $+y$ axis. Then $\mathbf{R}_{P \leftarrow I} = \mathbf{R}_3(90^\circ)$, and the ECI vector $(0, 1, 0)$ maps to $(1, 0, 0)$, which is $\hat{\mathbf{p}}$ in its own coordinates. Correct. The RIC frame of the previous section is the perifocal frame rotated about $\hat{\mathbf{w}}$ through the true anomaly: $\mathbf{R}_{RIC \leftarrow P} = \mathbf{R}_3(\nu)$, with $\hat{\mathbf{C}} = \hat{\mathbf{w}}$.

::: key
Perifocal frame: $\hat{\mathbf{p}}$ toward periapsis, $\hat{\mathbf{w}}$ along the angular momentum $\mathbf{h}$, $\hat{\mathbf{q}} = \hat{\mathbf{w}} \times \hat{\mathbf{p}}$ completing the right-handed set $90^\circ$ ahead of periapsis. Position is $(r\cos\nu, r\sin\nu, 0)$ in it, velocity $\sqrt{\mu/p}\,(-\sin\nu, e + \cos\nu, 0)$, and $\mathbf{R}_{P \leftarrow I} = \mathbf{R}_3(\omega)\mathbf{R}_1(i)\mathbf{R}_3(\Omega)$.
:::

::: example A Molniya-type orbit in perifocal coordinates
A highly eccentric twelve-hour orbit has $a = 26\,562\,\mathrm{km}$ and $e = 0.74$, so periapsis is at $r_p = a(1 - e) = 6\,906\,\mathrm{km}$ (about $530\,\mathrm{km}$ altitude) and apoapsis at $r_a = a(1 + e) = 46\,218\,\mathrm{km}$. The semi-latus rectum is $p = a(1 - e^2) = 26\,562 \times 0.4524 = 12\,016.6\,\mathrm{km}$ and $\sqrt{\mu / p} = \sqrt{3.986004418 \times 10^{14} / 1.20166 \times 10^{7}} = 5\,759.4\,\mathrm{m/s}$.

At $\nu = 90^\circ$, $r = p / (1 + e\cos 90^\circ) = p = 12\,016.6\,\mathrm{km}$, and

$$
\mathbf{r}^{P} = \begin{bmatrix} 0 \\ 12\,016.6 \\ 0 \end{bmatrix} \mathrm{km}, \qquad
\mathbf{v}^{P} = 5\,759.4 \begin{bmatrix} -1 \\ 0.74 + 0 \\ 0 \end{bmatrix} = \begin{bmatrix} -5\,759.4 \\ 4\,262.0 \\ 0 \end{bmatrix} \mathrm{m/s} .
$$

The speed is $\sqrt{5\,759.4^2 + 4\,262.0^2} = 7\,164.8\,\mathrm{m/s}$; the vis-viva equation $v^2 = \mu(2/r - 1/a)$ gives $7\,164.8\,\mathrm{m/s}$ as well, an independent check. The velocity is not perpendicular to the radius: its radial component (along $\hat{\mathbf{q}}$, since the satellite is on the $\hat{\mathbf{q}}$ axis) is $+4\,262\,\mathrm{m/s}$, outward, because the vehicle is climbing toward apoapsis, and the flight-path angle is $\arctan(4\,262.0 / 5\,759.4) = 53.5^\circ$. In the RIC frame at this instant the same velocity is $(4\,262.0,\; 5\,759.4,\; 0)$ — radial first, in-track second — a reminder that RIC and perifocal share the plane but not the axes.
:::

## The topocentric frame

A ground station sees the sky from its own location, so its natural frame has the station as origin and local-level axes. Two conventions are used: the ENU triad of lesson 06, and the SEZ triad ($\hat{\mathbf{s}}$ south, $\hat{\mathbf{e}}$ east, $\hat{\mathbf{z}}$ zenith) favoured in classical astrodynamics texts, which is ENU with the first and second axes reordered and north replaced by south — a proper rotation, since $\hat{\mathbf{s}} \times \hat{\mathbf{e}} = \hat{\mathbf{z}}$. Either way the recipe is the same. Compute the range vector in ECEF, then rotate:

$$
\boldsymbol{\rho}^{E} = \mathbf{r}^{E}_{sat} - \mathbf{r}^{E}_{site}, \qquad
\boldsymbol{\rho}^{U} = \mathbf{R}_{U \leftarrow E}\,\boldsymbol{\rho}^{E} = \begin{bmatrix} \rho_E \\ \rho_N \\ \rho_U \end{bmatrix} ,
$$

using the ENU matrix from lesson 06 evaluated at the site's geodetic latitude and longitude. Then the observables are

$$
\rho = |\boldsymbol{\rho}|, \qquad
\text{el} = \arcsin\frac{\rho_U}{\rho}, \qquad
\text{az} = \operatorname{atan2}(\rho_E, \rho_N) ,
$$

with azimuth measured clockwise from north through east, the compass convention. Note the order of arguments in $\operatorname{atan2}$: east first, north second, the opposite of the mathematical convention, because azimuth is measured from the $y$ axis of ENU. A satellite is above the horizon when $\rho_U > 0$. The subtraction must be done in ECEF (or in ECI at a common epoch) before rotating — the site is fixed in ECEF, the satellite state is usually in ECI, and the ECI-to-ECEF rotation of lesson 05 at the observation time is the step people forget.

::: example Elevation and azimuth of a pass
A station at Cape Canaveral ($\varphi = 28.5620^\circ$, $\lambda = -80.5772^\circ$, $h = 0$) has $\mathbf{r}^{E}_{site} = (917\,841,\; -5\,530\,566,\; 3\,031\,354)\,\mathrm{m}$ from lesson 06. A satellite is at that instant over geodetic $30.0^\circ$ north, $75.0^\circ$ west, at $400\,\mathrm{km}$; the geodetic-to-ECEF conversion gives $\mathbf{r}^{E}_{sat} = (1\,520\,476,\; -5\,674\,492,\; 3\,370\,374)\,\mathrm{m}$.

Range vector in ECEF: $\boldsymbol{\rho}^{E} = (602\,635,\; -143\,926,\; 339\,020)\,\mathrm{m}$.

Rotate into ENU at the site with the $\mathbf{R}_{U \leftarrow E}$ rows east $(0.9865, 0.1637, 0)$, north $(-0.0783, 0.4717, 0.8783)$, up $(0.1438, -0.8664, 0.4781)$:

$$
\boldsymbol{\rho}^{U} = \begin{bmatrix} 570\,940 \\ 182\,706 \\ 373\,449 \end{bmatrix} \mathrm{m}, \qquad
\rho = 706.3\,\mathrm{km}, \qquad
\text{el} = \arcsin\frac{373\,449}{706\,271} = 31.9^\circ, \qquad
\text{az} = \operatorname{atan2}(570\,940,\; 182\,706) = 72.3^\circ .
$$

The satellite is $706\,\mathrm{km}$ away, $32^\circ$ above the horizon, east-north-east. A quick sanity check: the satellite is about $1.4^\circ$ north and $5.6^\circ$ east of the station, so the ground distance is roughly $\sqrt{(1.4 \times 111)^2 + (5.6 \times 111 \times \cos 29^\circ)^2} \approx 566\,\mathrm{km}$, and $\arctan(400 / 566) \approx 35^\circ$ — close to the computed elevation, the remainder being the curvature of the Earth dropping the satellite toward the horizon.
:::

## Sensor frames

Every measurement is made in the frame of the instrument that made it, and the instrument is never perfectly aligned with the body. A star tracker has an optical frame with its boresight along one axis (usually $+z$ of the sensor); a camera has its focal-plane axes; a GNSS antenna has a phase centre offset from the centre of mass; an IMU has its own triad. Each sensor frame $S$ is related to the body by a fixed rotation $\mathbf{R}_{B \leftarrow S}$, the mounting or alignment matrix, and for position-type measurements also by a lever arm $\mathbf{l}^{B}$ from the body origin to the sensor.

The star tracker is the case that matters most for attitude. Its native output is $\mathbf{R}_{I \leftarrow S}$ — the orientation of its own optical axes relative to the star catalogue, which is a GCRF catalogue. The body attitude is then

$$
\mathbf{R}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow S}\,\mathbf{R}_{S \leftarrow B} = \mathbf{R}_{I \leftarrow S}\,\mathbf{R}_{B \leftarrow S}^{T} ,
$$

inner labels matching as always. Any error in $\mathbf{R}_{B \leftarrow S}$ is an error in the body attitude, one for one. Mounting matrices are measured optically before launch to a few arcseconds and then shift by tens of arcseconds through launch loads and thermal distortion, so they are re-estimated in flight against a second sensor or against the payload's own imagery. To put the magnitudes in context: at $400\,\mathrm{km}$ a nadir-pointing camera whose boresight is known to $10''$ places a ground feature to $400\,000 \times 10 / 206\,265 = 19\,\mathrm{m}$; a $1\,\mathrm{mrad}$ misalignment left uncorrected is $400\,\mathrm{m}$ on the ground.

Position sensors need the lever arm as well. A GNSS antenna on a boom has position $\mathbf{r}_{ant} = \mathbf{r}_{cm} + \mathbf{R}_{I \leftarrow B}\,\mathbf{l}^{B}$, and its velocity picks up the term $\boldsymbol{\omega}_{B/I} \times \mathbf{l}$ from the transport theorem. For a $2\,\mathrm{m}$ lever arm on a vehicle rolling at $0.5\,\mathrm{rad/s}$ that is $1\,\mathrm{m/s}$ of velocity that the centre of mass does not have. An IMU displaced from the centre of mass reads the centripetal and Euler terms of lesson 04 on top of the vehicle's acceleration; removing them is size-effect compensation, and it needs both the lever arm and the sensor's own frame to be right.

## The frame zoo, in one table

| Frame | Origin | Axes | Rotates w.r.t. ECI? | Native to |
| --- | --- | --- | --- | --- |
| ECI (J2000, GCRF) | Earth centre | Pole, equinox | No | Orbit propagation, star trackers |
| ECEF (ITRF, WGS-84) | Earth centre | Pole, reference meridian | Yes, $\omega_E$ about $z$ | Ground sites, GNSS, gravity models |
| NED, ENU | Vehicle or site | Geodetic north, east, vertical | Yes, $\omega_E$ + transport rate | INS, aircraft, surveying |
| Body | Centre of mass | Structural | Yes, gyro rate $\boldsymbol{\omega}_{B/I}$ | IMU, actuators, attitude |
| LVLH / RIC | Satellite | Radial, in-track, cross-track | Yes, $h/r^2$ about $\hat{\mathbf{C}}$ | Relative motion, orbit errors |
| Perifocal | Earth centre | Periapsis, $\mathbf{h}$ | No (two-body) | Elements to state vector |
| Topocentric | Ground station | ENU or SEZ | Yes, with the site | Azimuth, elevation, range |
| Sensor | Instrument | Boresight, focal plane | Yes, with the body | Raw measurements |

::: warning
"LVLH" without a stated convention is not a frame. Before using any LVLH quantity find out which axis is nadir and whether the second axis is along $+\mathbf{h}$ or $-\mathbf{h}$. The Shuttle/ISS convention ($x$ along-track, $y = -\hat{\mathbf{C}}$, $z$ nadir) and the RIC convention ($x = \hat{\mathbf{R}}$ outward, $z = \hat{\mathbf{C}}$) differ by a rotation that flips the signs of two components and permutes all three; both are right-handed, so no determinant check will catch a mix-up.
:::

::: warning
A star tracker reports the attitude of its own optical frame, not the body's, and relative to the inertial catalogue frame, not to ECEF. Getting a body-to-ECEF attitude requires the mounting matrix $\mathbf{R}_{B \leftarrow S}$ and the full ECI-to-ECEF rotation at the measurement time. Skip the first and the attitude is off by the misalignment; skip the second and it is off by $\omega_E t$ — $15^\circ$ per hour.
:::

## Check yourself

::: check
A spacecraft in the ISS orbit holds a fixed attitude relative to the LVLH frame. What angular velocity do its gyros read, in magnitude and direction, and what happens if the attitude controller instead drives the gyro rates to zero?
:::

::: answer
Fixed relative to LVLH means $\boldsymbol{\omega}_{B/LVLH} = 0$, so by the addition rule $\boldsymbol{\omega}_{B/I} = \boldsymbol{\omega}_{LVLH/I} = n\,\hat{\mathbf{C}}$, where for the circular ISS orbit $n = \sqrt{\mu/a^3} = 1.131 \times 10^{-3}\,\mathrm{rad/s}$, about $0.065^\circ/\mathrm{s}$, directed along the orbit normal. In body axes that is a constant rate about whichever body axis is aligned with $\hat{\mathbf{C}}$, nominally the pitch axis. If the controller nulls the gyro rates instead, the spacecraft becomes inertially fixed and the LVLH frame rotates away from it at $n$: after a quarter of an orbit, $23\,\mathrm{min}$, a nadir-pointing camera is looking at the horizon, and after half an orbit at deep space.
:::

::: check
Compute the periapsis velocity of the Molniya orbit in the example ($a = 26\,562\,\mathrm{km}$, $e = 0.74$) using the perifocal velocity formula, and verify it with vis-viva.
:::

::: answer
At periapsis $\nu = 0$, so $\mathbf{v}^{P} = \sqrt{\mu/p}\,(0,\; e + 1,\; 0) = 5\,759.4 \times 1.74\,\hat{\mathbf{q}} = 10\,021\,\mathrm{m/s}$ along $\hat{\mathbf{q}}$ — purely tangential, as it must be at an apsis, and in the direction of motion. Vis-viva with $r_p = 6\,906\,120\,\mathrm{m}$:

$$
v_p = \sqrt{\mu\left(\frac{2}{r_p} - \frac{1}{a}\right)} = \sqrt{3.986004418 \times 10^{14}\left(\frac{2}{6.90612 \times 10^{6}} - \frac{1}{2.6562 \times 10^{7}}\right)} = 10\,021\,\mathrm{m/s} .
$$

The two agree. The apoapsis speed, by the same formula with $\nu = 180^\circ$, is $5\,759.4 \times (0.74 - 1) = -1\,497\,\mathrm{m/s}$ along $\hat{\mathbf{q}}$, i.e. $1\,497\,\mathrm{m/s}$ along $-\hat{\mathbf{q}}$: the satellite crawls over apoapsis at one seventh of its periapsis speed, which is the whole point of a Molniya orbit.
:::

::: check
Show that $\mathbf{R}_{LVLH \leftarrow RIC}$ in the Shuttle convention is a proper rotation, and identify the geometric rotation it represents.
:::

::: answer
The matrix maps $(\rho_R, \rho_I, \rho_C)$ to $(\rho_I, -\rho_C, -\rho_R)$. Its columns are $(0, 0, -1)$, $(1, 0, 0)$ and $(0, -1, 0)$, each a unit vector and mutually orthogonal, so it is orthogonal. Its determinant, expanding along the first row, is $0 - 1 \times (0 \times 0 - (-1)(-1)) + 0 = +1$, so it is proper. To find the geometric rotation, look for the axis it leaves fixed: $(a, b, c) \mapsto (b, -c, -a)$ equals $(a, b, c)$ when $b = a$, $c = -b$ and $a = -c$, which all hold for $(1, 1, -1)$. So the axis is $(1, 1, -1)/\sqrt{3}$ in RIC coordinates, and since the trace of a rotation matrix is $1 + 2\cos\theta$ and this trace is $0$, the angle is $\theta = 120^\circ$. Any signed permutation of the axes with determinant $+1$ is such a third-turn about a body diagonal of the cube; that is why LVLH conventions differ from one another by rotations that look nothing like small corrections.
:::

::: check
A satellite's ECI state is known at time $t$ and a ground station's coordinates are known in ECEF. List the steps, with frame labels on every quantity, to produce the station's elevation angle to the satellite.
:::

::: answer
(1) Compute the Earth rotation angle $\theta(t)$ and form $\mathbf{R}_{E \leftarrow I} = \mathbf{R}_3(\theta)$ (lesson 05). (2) Rotate the satellite position: $\mathbf{r}^{E}_{sat} = \mathbf{R}_{E \leftarrow I}\mathbf{r}^{I}_{sat}$ — position only rotates; the velocity is not needed for elevation. (3) Convert the station's geodetic $(\varphi, \lambda, h)$ to $\mathbf{r}^{E}_{site}$ with the WGS-84 formulas (lesson 06), or use its surveyed ECEF coordinates directly. (4) Difference in ECEF: $\boldsymbol{\rho}^{E} = \mathbf{r}^{E}_{sat} - \mathbf{r}^{E}_{site}$. (5) Form $\mathbf{R}_{U \leftarrow E}$ at the station's geodetic latitude and longitude and rotate: $\boldsymbol{\rho}^{U} = \mathbf{R}_{U \leftarrow E}\boldsymbol{\rho}^{E}$. (6) $\text{el} = \arcsin(\rho_U / |\boldsymbol{\rho}|)$. Steps 1 and 5 are where the two classic errors live: forgetting to rotate the satellite into ECEF before subtracting (an error of $\omega_E t \times r$, hundreds of kilometres in minutes), and building the local frame with geocentric latitude ($11'$ of tilt).
:::

::: check
A GNSS antenna is mounted $3\,\mathrm{m}$ from a launch vehicle's centre of mass along the body $x$ axis. During ascent the vehicle pitches over at $\boldsymbol{\omega}^{B}_{B/I} = (0, 0.02, 0)\,\mathrm{rad/s}$. By how much does the antenna's inertial velocity differ from the centre of mass velocity, and in which body direction?
:::

::: answer
The antenna is fixed in the body at $\mathbf{l}^{B} = (3, 0, 0)\,\mathrm{m}$, so by the transport theorem its velocity relative to the centre of mass is $\boldsymbol{\omega}_{B/I} \times \mathbf{l} = (0, 0.02, 0) \times (3, 0, 0) = (0 \cdot 0 - 0 \cdot 0,\; 0 \cdot 3 - 0 \cdot 0,\; 0 \cdot 0 - 0.02 \cdot 3) = (0, 0, -0.06)\,\mathrm{m/s}$: $6\,\mathrm{cm/s}$ along $-\hat{\mathbf{b}}_3$, that is upward in aircraft-style body axes where $z$ is down. Small in absolute terms, but a GNSS receiver measures velocity to a few centimetres per second, so a navigation filter that assigns the antenna's velocity to the centre of mass without this correction sees a $6\,\mathrm{cm/s}$ bias that switches sign with the pitch rate and corrupts the estimated velocity, and through it the estimated attitude.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Body $B$ | Centre of mass; aircraft: $x$ forward, $y$ right, $z$ down; spacecraft: declared per vehicle |
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

The next lesson turns to time. Every rotation in this module that involves the Earth needs an angle that depends on *when*, and "when" is measured on at least four different clocks — UT1, TAI, GPS and TT — that agree to within a minute and disagree by enough to matter.
