---
id: l03-velocity-and-acceleration-in-rotating-frames
title: Velocity and acceleration in rotating frames
minutes: 17
covers:
  - velocity and acceleration in rotating frames
---

A GNSS receiver on a satellite reports its velocity relative to the rotating Earth. The orbit propagator that predicts where the satellite will be in ninety minutes needs its velocity relative to inertial space. The two differ by about half a kilometre per second in low Earth orbit, and neither is "the" velocity: they are the same motion described by two observers, one of whom is turning. Before a rocket has left its pad it is already moving at several hundred metres per second in the inertial frame its orbit will be reckoned in, and mission designers cash that motion in as propellant saved.

Both facts come from applying the transport theorem of the previous lesson to a position vector. Applying it once gives the relation between velocities seen in an inertial and a rotating frame. Applying it a second time gives the relation between accelerations, and out of that second application fall three extra terms — Coriolis, centrifugal and Euler — that any equation of motion written in a rotating frame must carry. This lesson derives both relations with every step visible, since the factor of 2 on the Coriolis term is the most frequently mis-remembered number in the subject, and then uses the velocity relation for the launch-azimuth calculation that every ascent design begins with.

## Setting up the two frames

Let $I$ be an inertial frame with origin $O$, and let $B$ be a frame that rotates relative to $I$ with angular velocity $\boldsymbol{\omega} = \boldsymbol{\omega}_{B/I}$ and whose origin $O'$ sits at position $\mathbf{r}_{O'}$ measured from $O$. A point $P$ has position $\mathbf{r}$ from $O$ and position $\boldsymbol{\rho}$ from $O'$, so that

$$
\mathbf{r} = \mathbf{r}_{O'} + \boldsymbol{\rho} .
$$

For the Earth, $B$ is the Earth-centred Earth-fixed frame, $O'$ coincides with $O$ at the Earth's centre, $\mathbf{r}_{O'} = 0$, and $\boldsymbol{\omega}$ is the Earth's rotation vector, constant to a very good approximation. For a spacecraft body frame, $O'$ is the centre of mass, moving along the orbit, and $\boldsymbol{\omega}$ is whatever the gyros say. Keeping $\mathbf{r}_{O'}$ in the derivation costs nothing and makes the result usable for both.

Two velocities of $P$ will appear: the inertial velocity $\mathbf{v}_I = (\dot{\mathbf{r}})_I$, and the relative velocity $\mathbf{v}_{rel} = (\dot{\boldsymbol{\rho}})_B$, the rate of change of $P$'s position as seen by an observer fixed in $B$. The relative velocity is what a GNSS receiver reports, what an anemometer measures in still air, and what a pilot means by ground speed.

## Velocity

Differentiate $\mathbf{r} = \mathbf{r}_{O'} + \boldsymbol{\rho}$ in the inertial frame. The first term gives $\mathbf{v}_{O'}$, the inertial velocity of the moving origin. The second is the inertial derivative of a vector that is most naturally described in $B$, so the transport theorem applies:

$$
\mathbf{v}_I = \mathbf{v}_{O'} + \left(\frac{d\boldsymbol{\rho}}{dt}\right)_B + \boldsymbol{\omega} \times \boldsymbol{\rho}
= \mathbf{v}_{O'} + \mathbf{v}_{rel} + \boldsymbol{\omega} \times \boldsymbol{\rho} .
$$

The inertial velocity is the velocity of the frame's origin, plus the velocity seen inside the frame, plus the velocity that a point glued to the frame at $\boldsymbol{\rho}$ would have because the frame turns. For the Earth, with a common origin,

$$
\mathbf{v}_I = \mathbf{v}_{rel} + \boldsymbol{\omega}_E \times \mathbf{r} .
$$

The correction $\boldsymbol{\omega}_E \times \mathbf{r}$ points east, perpendicular to both the polar axis and the position vector, with magnitude $\omega_E\, r \cos\varphi'$ where $\varphi'$ is the geocentric latitude and $r\cos\varphi'$ is the distance from the spin axis. Some magnitudes worth memorising: 465 m/s at the equator on the surface ($7.292115 \times 10^{-5} \times 6\,378\,137$), 502 m/s at 500 km altitude over the equator, and 3 075 m/s at geostationary radius, 42 164 km. That last number equals the circular orbital speed at that radius, which is another way of saying that a geostationary satellite has zero velocity relative to the Earth: its $\mathbf{v}_{rel}$ vanishes and the whole of its inertial velocity is $\boldsymbol{\omega}_E \times \mathbf{r}$.

In coordinates, with everything resolved in ECEF axes and then rotated,

$$
\mathbf{v}^{I} = \mathbf{R}_{I \leftarrow E}\left( \mathbf{v}^{E} + \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E} \right), \qquad \boldsymbol{\omega}^{E}_{E/I} = \begin{bmatrix} 0 \\ 0 \\ \omega_E \end{bmatrix}.
$$

Two operations, and they are different in kind. The addition of $\boldsymbol{\omega} \times \mathbf{r}$ changes which physical vector you are holding: relative velocity into inertial velocity. The multiplication by $\mathbf{R}_{I \leftarrow E}$ changes only the axes the components are written along. A conversion routine that does one and not the other is wrong by either 500 m/s or a rotation, and both errors compile.

::: example A polar orbit that is not quite polar
A satellite at 500 km altitude crosses the equator moving due north. Its GNSS receiver reports ECEF position $\mathbf{r}^{E} = (6\,878\,137, 0, 0)\,\mathrm{m}$ and ECEF velocity $\mathbf{v}^{E} = (0, 0, 7\,612.6)\,\mathrm{m/s}$, the circular speed $\sqrt{\mu / r}$ at that radius. What is its inertial velocity, and what is the orbit's inclination?

The rotation term is $\boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E} = (0, 0, \omega_E) \times (r, 0, 0) = (0, \omega_E r, 0) = (0, 501.6, 0)\,\mathrm{m/s}$, pointing east. So, in ECEF axes,

$$
\mathbf{v}^{E} + \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E} = \begin{bmatrix} 0 \\ 501.6 \\ 7\,612.6 \end{bmatrix} \mathrm{m/s}, \qquad |\mathbf{v}_I| = \sqrt{501.6^2 + 7\,612.6^2} = 7\,629.1\,\mathrm{m/s} .
$$

Relative to the Earth the track runs straight north, so the satellite looks polar from the ground. Inertially its velocity leans east of the pole by $\arctan(501.6 / 7\,612.6) = 3.77^\circ$, so the orbit's inclination is $90^\circ - 3.77^\circ = 86.2^\circ$, not $90^\circ$. Anyone who computes orbital elements from an ECEF state vector without adding the rotation term gets the wrong plane, and the error is not small: it moves the ascending node at a rate that has nothing to do with physics.
:::

## Acceleration

Differentiate the velocity relation once more in the inertial frame. Three terms need attention.

The origin term differentiates to the inertial acceleration of the origin, $\mathbf{a}_{O'}$.

The relative velocity $\mathbf{v}_{rel}$ is a vector described in $B$, so the transport theorem gives

$$
\left(\frac{d\mathbf{v}_{rel}}{dt}\right)_I = \left(\frac{d\mathbf{v}_{rel}}{dt}\right)_B + \boldsymbol{\omega} \times \mathbf{v}_{rel} = \mathbf{a}_{rel} + \boldsymbol{\omega} \times \mathbf{v}_{rel} ,
$$

where $\mathbf{a}_{rel} = (\ddot{\boldsymbol{\rho}})_B$ is the acceleration seen inside the rotating frame.

The rotation term $\boldsymbol{\omega} \times \boldsymbol{\rho}$ differentiates by the product rule. The angular acceleration $\dot{\boldsymbol{\omega}}$ is the same in both frames (previous lesson, remark 2), and the inertial derivative of $\boldsymbol{\rho}$ is $\mathbf{v}_{rel} + \boldsymbol{\omega} \times \boldsymbol{\rho}$ from the velocity relation:

$$
\left(\frac{d}{dt}\left(\boldsymbol{\omega} \times \boldsymbol{\rho}\right)\right)_I = \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho} + \boldsymbol{\omega} \times \left( \mathbf{v}_{rel} + \boldsymbol{\omega} \times \boldsymbol{\rho} \right)
= \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho} + \boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho}) .
$$

Collecting everything, the term $\boldsymbol{\omega} \times \mathbf{v}_{rel}$ appears twice — once from differentiating the relative velocity in a rotating basis, once from the relative velocity hiding inside the derivative of $\boldsymbol{\rho}$ — and that is the whole origin of the factor 2:

$$
\mathbf{a}_I = \mathbf{a}_{O'} + \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho}) + \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho} .
$$

Each term has a name:

- $\mathbf{a}_{O'}$ — the acceleration of the moving origin; zero for the Earth-centred frame, equal to the orbital acceleration for a spacecraft body frame.
- $\mathbf{a}_{rel}$ — the **relative** acceleration, what an accelerometer-free observer inside $B$ would compute from position measurements.
- $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ — the **Coriolis** term, present only when the point moves relative to the frame.
- $\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho})$ — the **centrifugal** term, present whenever the point is off the rotation axis, moving or not.
- $\dot{\boldsymbol{\omega}} \times \boldsymbol{\rho}$ — the **Euler** or angular-acceleration term, present only when the rotation rate changes.

For the Earth frame, with $\mathbf{r}$ in place of $\boldsymbol{\rho}$ and no origin acceleration, the relation reads as the flashcard states it.

::: key
The full acceleration of a point in a rotating frame: $\mathbf{a}_I = \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) + \dot{\boldsymbol{\omega}} \times \mathbf{r}$ — relative, Coriolis, centrifugal, and Euler (angular acceleration) terms. If the frame's origin also accelerates, add $\mathbf{a}_{O'}$. The factor of 2 comes from differentiating both the rotating basis and the relative velocity.
:::

::: key
Velocity in a rotating frame: $\mathbf{v}_I = \mathbf{v}_{rel} + \boldsymbol{\omega} \times \mathbf{r}$ (plus $\mathbf{v}_{O'}$ if the origin moves). For the Earth, $|\boldsymbol{\omega}_E \times \mathbf{r}|$ is about 465 m/s on the surface at the equator and 502 m/s at 500 km altitude, directed east.
:::

## Newton's law as seen from the rotating frame

Newton's second law holds in the inertial frame: $m\mathbf{a}_I = \mathbf{F}$, with $\mathbf{F}$ the sum of real forces (gravitational attraction, thrust, aerodynamic force, contact). Solving the acceleration relation for $\mathbf{a}_{rel}$ gives the equation an observer in the rotating frame must use:

$$
m\,\mathbf{a}_{rel} = \mathbf{F} - m\,\mathbf{a}_{O'} - 2m\,\boldsymbol{\omega} \times \mathbf{v}_{rel} - m\,\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) - m\,\dot{\boldsymbol{\omega}} \times \mathbf{r} .
$$

The four extra terms on the right are the inertial or "fictitious" forces. Nothing pushes on the body; they are the price of insisting that $\mathbf{a}_{rel}$, the acceleration in a frame that is itself accelerating, should obey a law of the form mass times acceleration equals force. Their signs are opposite to the terms in the $\mathbf{a}_I$ relation, which is the single most common source of confusion. The centrifugal *term* in $\mathbf{a}_I$ points toward the rotation axis; the centrifugal *force* felt in the rotating frame points away from it. The Coriolis term $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ for a body moving north in the northern hemisphere points west; the Coriolis force, and the deflection it produces, point east. The next lesson takes each term apart and evaluates it for vehicles moving over the Earth.

## Launch-site velocity and launch azimuth

The velocity relation answers a question every ascent design begins with: how much of the orbital speed does the rotating Earth provide, and in which direction must the rocket fly relative to the ground to end up in the required plane?

Take a launch site at geodetic latitude $\varphi$. In the local north–east–down triad the Earth-rate velocity of the pad is purely eastward with magnitude $v_{site} = \omega_E\, d$, where $d$ is the distance from the spin axis; on the WGS-84 ellipsoid $d = N(\varphi)\cos\varphi$ with $N$ the prime-vertical radius of curvature defined in a later lesson, and for present purposes $d \approx R\cos\varphi$ is close enough. At Cape Canaveral, $\varphi = 28.56^\circ$, $v_{site} = 408.8\,\mathrm{m/s}$.

The target orbit has inclination $i$, and the injection velocity $\mathbf{v}_I$ at the launch latitude is horizontal with magnitude $v_{orb}$ at an inertial azimuth $\beta_i$, measured from north toward east. The orbit normal is $\mathbf{h} = \mathbf{r} \times \mathbf{v}_I$, and its component along the polar axis fixes the inclination: $\cos i = h_z / |\mathbf{h}|$. In NED axes at the launch point, $\mathbf{r} = (0, 0, -r)$, $\mathbf{v}_I = v_{orb}(\cos\beta_i, \sin\beta_i, 0)$, and the polar axis is $(\cos\varphi, 0, -\sin\varphi)$. Then

$$
\mathbf{h} = r\, v_{orb} \begin{bmatrix} \sin\beta_i \\ -\cos\beta_i \\ 0 \end{bmatrix}, \qquad
\cos i = \frac{\mathbf{h} \cdot (\cos\varphi, 0, -\sin\varphi)}{r\,v_{orb}} = \cos\varphi\,\sin\beta_i ,
$$

so the inertial azimuth satisfies $\sin\beta_i = \cos i / \cos\varphi$. Two facts follow at once: the lowest reachable inclination from a site is $i = \varphi$ (due-east launch, $\beta_i = 90^\circ$), and a required inclination below the site latitude needs a plane-change manoeuvre later.

The rocket, however, starts at rest on the pad and its guidance flies relative to the ground. What it must generate is $\mathbf{v}_{rel} = \mathbf{v}_I - \boldsymbol{\omega}_E \times \mathbf{r}$; in NED components,

$$
\mathbf{v}_{rel} = \begin{bmatrix} v_{orb}\cos\beta_i \\ v_{orb}\sin\beta_i - v_{site} \\ 0 \end{bmatrix}, \qquad
\tan\beta_{rel} = \frac{v_{orb}\sin\beta_i - v_{site}}{v_{orb}\cos\beta_i} .
$$

The ideal velocity the propulsion must deliver is $|\mathbf{v}_{rel}|$, before gravity and drag losses, and $\beta_{rel}$ is the azimuth the vehicle flies relative to the ground.

::: example Cape Canaveral to the Space Station's plane
A vehicle from Cape Canaveral ($\varphi = 28.56^\circ$, $v_{site} = 408.8\,\mathrm{m/s}$) is to inject into a circular 400 km orbit at $i = 51.6^\circ$, where $v_{orb} = \sqrt{\mu / (6\,778\,137\,\mathrm{m})} = 7\,668.6\,\mathrm{m/s}$.

Inertial azimuth: $\sin\beta_i = \cos 51.6^\circ / \cos 28.56^\circ = 0.6211 / 0.8783 = 0.7071$, so $\beta_i = 45.0^\circ$ — a north-easterly ascent.

Relative velocity in NED: north component $7\,668.6 \cos 45.0^\circ = 5\,421.7\,\mathrm{m/s}$; east component $7\,668.6 \sin 45.0^\circ - 408.8 = 5\,422.6 - 408.8 = 5\,014.5\,\mathrm{m/s}$. Hence

$$
|\mathbf{v}_{rel}| = \sqrt{5\,421.7^2 + 5\,014.5^2} = 7\,385.1\,\mathrm{m/s}, \qquad \beta_{rel} = \arctan\frac{5\,014.5}{5\,421.7} = 42.8^\circ .
$$

The Earth contributes $7\,668.6 - 7\,385.1 = 283.5\,\mathrm{m/s}$ of the required speed, about 3.7 per cent — several hundred kilograms of payload for a vehicle of this class — and the vehicle must steer about $2.2^\circ$ north of the inertial azimuth to compensate for the eastward push it did not ask for.

For a polar orbit ($i = 90^\circ$, $\beta_i = 0$) from the same site the east component is $-408.8\,\mathrm{m/s}$: $|\mathbf{v}_{rel}| = \sqrt{7\,668.6^2 + 408.8^2} = 7\,679.5\,\mathrm{m/s}$, so the rotation *costs* 10.9 m/s, and the vehicle flies $3.05^\circ$ west of north to cancel the pad's eastward motion. This is one reason polar launches from the United States use Vandenberg, where flying south over open ocean is possible, rather than a lower-latitude site that would give no help anyway.
:::

::: warning
The Coriolis term carries a factor of 2, and it multiplies the *relative* velocity, not the inertial one. Both slips are common. If a derivation produces $\boldsymbol{\omega} \times \mathbf{v}$ with no 2, one of the two places $\mathbf{v}_{rel}$ appears was dropped; if it produces $2\boldsymbol{\omega} \times \mathbf{v}_I$, the velocity relation was not substituted. Either error makes an INS mechanisation drift.
:::

::: warning
Converting an ECEF state to ECI requires two distinct operations: adding $\boldsymbol{\omega}_E \times \mathbf{r}$ to the velocity (a change of physical vector) and rotating the axes by $\mathbf{R}_{I \leftarrow E}$ (a change of coordinates). Position needs only the rotation. Applying the rotation alone to velocity leaves an eastward error of roughly 500 m/s in LEO that looks like a plausible state.
:::

## Check yourself

::: check
A point is fixed on the surface of a rotating body (a launch pad on the Earth). Reduce the general acceleration relation to this case and name the surviving term. Which way does it point?
:::

::: answer
Fixed in the rotating frame means $\mathbf{v}_{rel} = 0$ and $\mathbf{a}_{rel} = 0$, and the Earth's rate is constant, so $\dot{\boldsymbol{\omega}} = 0$. The origin does not accelerate. Only the centrifugal term survives: $\mathbf{a}_I = \boldsymbol{\omega}_E \times (\boldsymbol{\omega}_E \times \mathbf{r})$. Using $\mathbf{u} \times (\mathbf{v} \times \mathbf{w}) = \mathbf{v}(\mathbf{u}\cdot\mathbf{w}) - \mathbf{w}(\mathbf{u}\cdot\mathbf{v})$, this equals $\boldsymbol{\omega}_E(\boldsymbol{\omega}_E \cdot \mathbf{r}) - \omega_E^2\,\mathbf{r} = -\omega_E^2\,\mathbf{r}_\perp$, where $\mathbf{r}_\perp$ is the part of $\mathbf{r}$ perpendicular to the spin axis. It points *toward* the axis: the pad is being accelerated centripetally as it goes round, at $\omega_E^2 R\cos\varphi'$, about 0.034 m/s² at the equator.
:::

::: check
A GNSS receiver on a satellite in a circular equatorial orbit at 500 km reports zero ECEF velocity along the north–south direction and an eastward ECEF speed of 7 111 m/s. Is the orbit prograde or retrograde, and what is the inertial speed?
:::

::: answer
The Earth-rate term at that radius is $\omega_E r = 7.292115 \times 10^{-5} \times 6\,878\,137 = 501.6\,\mathrm{m/s}$, eastward. The inertial velocity is $\mathbf{v}_{rel} + \boldsymbol{\omega}_E \times \mathbf{r}$, both eastward, so the inertial speed is $7\,111 + 501.6 = 7\,612.6\,\mathrm{m/s}$ — the circular speed at 6 878 km. The satellite moves east in both frames, so the orbit is prograde. A retrograde equatorial orbit would show an ECEF speed of $7\,612.6 + 501.6 = 8\,114\,\mathrm{m/s}$ westward; the Earth's rotation adds to the ground speed of a retrograde satellite instead of subtracting from it.
:::

::: check
In a spacecraft body frame, the origin is the centre of mass and $\boldsymbol{\omega}$ is the body rate. Write the acceleration of a component mounted at body position $\boldsymbol{\rho}$ (fixed in the body) and explain which terms an accelerometer at that location would sense in addition to what one at the centre of mass senses.
:::

::: answer
Fixed in the body means $\mathbf{v}_{rel} = \mathbf{a}_{rel} = 0$, leaving $\mathbf{a}_I = \mathbf{a}_{O'} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho}) + \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho}$. The centre-of-mass accelerometer senses the specific force associated with $\mathbf{a}_{O'}$ alone. One mounted at $\boldsymbol{\rho}$ additionally senses the centripetal term $\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho})$ and the Euler term $\dot{\boldsymbol{\omega}} \times \boldsymbol{\rho}$. For $|\boldsymbol{\omega}| = 0.5\,\mathrm{rad/s}$ and $|\boldsymbol{\rho}| = 2\,\mathrm{m}$ the centripetal part is $0.5^2 \times 2 = 0.5\,\mathrm{m/s^2}$, and an angular acceleration of $0.01\,\mathrm{rad/s^2}$ adds $0.02\,\mathrm{m/s^2}$. Navigation software removes these with the known lever arm and the gyro data, an operation usually called size-effect or lever-arm compensation.
:::

::: check
A site at $\varphi = 45^\circ$ wants a $45^\circ$ inclination orbit. What is the inertial launch azimuth, what does the Earth contribute, and why can it not reach $i = 40^\circ$ directly?
:::

::: answer
$\sin\beta_i = \cos 45^\circ / \cos 45^\circ = 1$, so $\beta_i = 90^\circ$: a due-east launch. The pad's eastward velocity is about $\omega_E R\cos 45^\circ \approx 465 \times 0.707 = 329\,\mathrm{m/s}$, and because it is parallel to the required velocity it subtracts in full from the speed the vehicle must produce, $|\mathbf{v}_{rel}| = v_{orb} - 329\,\mathrm{m/s}$. For $i = 40^\circ$ the formula demands $\sin\beta_i = \cos 40^\circ / \cos 45^\circ = 0.766 / 0.707 = 1.083 > 1$, which has no solution: the orbital plane must contain the launch point, and a plane through a point at latitude $45^\circ$ cannot be inclined by less than $45^\circ$ to the equator. Reaching $40^\circ$ needs a plane change after injection, costing roughly $2 v_{orb} \sin(2.5^\circ) \approx 670\,\mathrm{m/s}$ for a 5° change at LEO speed.
:::

::: check
Explain in one or two sentences each why the centrifugal term does not depend on the point's velocity, why the Coriolis term does not depend on its position, and why the Euler term is routinely omitted for the Earth but not for a spacecraft.
:::

::: answer
Centrifugal: $\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$ arose from differentiating the frame-rotation velocity $\boldsymbol{\omega} \times \mathbf{r}$ of the point's current location; it exists because the location is carried round, whether or not the point moves relative to the frame. Coriolis: $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ arose from the relative velocity being measured in a turning basis and from the relative velocity changing the location whose rotation velocity is counted; both effects involve $\mathbf{v}_{rel}$ and neither involves where the point is. Euler: $\dot{\boldsymbol{\omega}} \times \mathbf{r}$ needs the rate to change; the Earth's rate changes by parts in $10^{8}$ per day (milliseconds in the length of day), utterly negligible, while a spacecraft slewing, spinning up or firing thrusters has $\dot{\boldsymbol{\omega}}$ comparable to $\omega^2$ and must keep the term.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r} = \mathbf{r}_{O'} + \boldsymbol{\rho}$ | Position from the inertial origin; from the rotating frame's origin |
| $\mathbf{v}_{rel} = (\dot{\boldsymbol{\rho}})_B$, $\mathbf{a}_{rel} = (\ddot{\boldsymbol{\rho}})_B$ | Velocity and acceleration seen inside the rotating frame |
| $\mathbf{v}_I = \mathbf{v}_{O'} + \mathbf{v}_{rel} + \boldsymbol{\omega} \times \boldsymbol{\rho}$ | Velocity relation |
| $\mathbf{a}_I = \mathbf{a}_{O'} + \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho}) + \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho}$ | Acceleration relation: relative, Coriolis, centrifugal, Euler |
| Factor 2 | $\boldsymbol{\omega} \times \mathbf{v}_{rel}$ arises twice in the differentiation |
| $\|\boldsymbol{\omega}_E \times \mathbf{r}\|$ | 465 m/s (equator, surface); 502 m/s (500 km); 3 075 m/s (GEO) |
| $\mathbf{v}^{I} = \mathbf{R}_{I \leftarrow E}(\mathbf{v}^{E} + \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E})$ | ECEF to ECI velocity: add the rotation term, then rotate the axes |
| $\sin\beta_i = \cos i / \cos\varphi$ | Inertial launch azimuth; minimum direct inclination is the site latitude |
| $\mathbf{v}_{rel} = \mathbf{v}_I - \boldsymbol{\omega}_E \times \mathbf{r}$ | What the rocket must produce; Cape to 51.6° saves 283 m/s |

The next lesson evaluates the Coriolis, centrifugal and Euler terms one at a time for vehicles moving over the Earth, and assembles them into the velocity equation an inertial navigation system integrates.
