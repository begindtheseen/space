---
id: l04-coriolis-centrifugal-and-euler-terms
title: Coriolis, centrifugal and Euler terms
minutes: 20
covers:
  - Coriolis, centrifugal and Euler acceleration terms
---

An inertial navigation system integrates accelerometer readings to get velocity, and velocity to get position. It does this in a frame fixed to the Earth, because that is where the runway, the launch pad and the target are. But the accelerometers obey Newton's law in inertial space, so before their output can be integrated in an Earth-fixed frame it must be corrected by exactly the three terms that fell out of the previous lesson: Coriolis, centrifugal and Euler. Leave one out and the system drifts by kilometres per hour. Get the sign of one wrong and it drifts faster.

The three terms are also physics you can feel. The centrifugal term is why a plumb line at mid-latitudes does not point at the Earth's centre, why sea-level gravity is weaker at the equator than at the poles, and why a geostationary satellite stays put. The Coriolis term is why an unguided projectile fired north in the northern hemisphere lands east of where it was aimed, why hurricanes circulate the way they do, and why a Foucault pendulum's swing plane turns. The Euler term is negligible for the Earth and unavoidable for a spinning spacecraft.

This lesson takes the three terms apart one at a time, writes each in the north–east–down axes an inertial navigator uses, puts numbers on each for vehicles flying over the Earth, and then assembles them into the velocity equation an INS integrates. Everything here rests on the acceleration relation of the previous lesson; nothing new is derived from scratch, but every term is now given a direction and a size.

## The acceleration relation, restated for the Earth

From the previous lesson, for a point with position $\mathbf{r}$ from the Earth's centre, moving with velocity $\mathbf{v}_{rel}$ and acceleration $\mathbf{a}_{rel}$ as seen by an observer fixed to the rotating Earth,

$$
\mathbf{a}_I = \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) + \dot{\boldsymbol{\omega}} \times \mathbf{r} ,
$$

with $\boldsymbol{\omega} = \boldsymbol{\omega}_{E/I}$ the Earth's angular velocity relative to inertial space, magnitude $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$, pointing along the spin axis toward the north celestial pole. Newton's second law says $m\mathbf{a}_I$ equals the sum of the real forces, so the observer on the Earth, who measures $\mathbf{a}_{rel}$, must write

$$
m\,\mathbf{a}_{rel} = \mathbf{F} - 2m\,\boldsymbol{\omega} \times \mathbf{v}_{rel} - m\,\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) - m\,\dot{\boldsymbol{\omega}} \times \mathbf{r} .
$$

Keep both forms in view. The first has the *terms*, which add to the relative acceleration to give the inertial one. The second has the *inertial forces*, each the negative of a term, which the rotating observer must add to the real forces to explain the motion she sees. When someone says "the Coriolis acceleration points west", ask which of the two they mean; half the sign disputes in this subject are two people using the two forms.

## Resolving the Earth's rotation vector in local axes

To evaluate the terms for a vehicle you need $\boldsymbol{\omega}$ in the axes the vehicle's velocity is written in. For a vehicle over the Earth those are the local north–east–down (NED) axes, defined properly in a later lesson: $\hat{\mathbf{n}}$ points north along the local horizontal, $\hat{\mathbf{e}}$ points east, $\hat{\mathbf{d}}$ points down along the local vertical. At latitude $\varphi$ the spin axis makes an angle $\varphi$ with the local horizontal, tilted toward north, so

$$
\boldsymbol{\omega}^{N} = \omega_E \begin{bmatrix} \cos\varphi \\ 0 \\ -\sin\varphi \end{bmatrix}.
$$

Check the two limits: at the equator, $\varphi = 0$, the axis lies horizontally along north; at the north pole, $\varphi = 90^\circ$, it points straight up, which is $-\hat{\mathbf{d}}$. (Whether $\varphi$ here is geodetic or geocentric latitude is a question the WGS-84 lesson answers; the difference is at most $0.19^\circ$ and changes nothing in this lesson at three significant figures.)

Now write the vehicle's velocity relative to the Earth as $\mathbf{v}^{N} = (v_N, v_E, v_D)$ and take the cross product with $c = \cos\varphi$, $s = \sin\varphi$:

$$
\boldsymbol{\omega} \times \mathbf{v}_{rel} = \omega_E \begin{bmatrix} c \\ 0 \\ -s \end{bmatrix} \times \begin{bmatrix} v_N \\ v_E \\ v_D \end{bmatrix}
= \omega_E \begin{bmatrix} s\, v_E \\ -s\, v_N - c\, v_D \\ c\, v_E \end{bmatrix}.
$$

Every Coriolis result over the Earth is read off this one line.

## The Coriolis term

$$
\mathbf{a}_{cor} = 2\boldsymbol{\omega} \times \mathbf{v}_{rel} .
$$

Three properties follow from the cross product. It is perpendicular to both $\boldsymbol{\omega}$ and $\mathbf{v}_{rel}$, so it never changes the speed relative to the Earth, only the direction: the Coriolis force does no work. It is zero when the body is at rest in the rotating frame, and zero when the relative velocity is parallel to the rotation axis — a vehicle climbing vertically at the north pole feels none of it. And its magnitude is $2\omega_E v_{rel}\sin\alpha$ with $\alpha$ the angle between $\boldsymbol{\omega}$ and $\mathbf{v}_{rel}$.

For horizontal flight the components above split into two effects. The horizontal part of $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ has magnitude $2\omega_E \sin\varphi\, \sqrt{v_N^2 + v_E^2}$; the factor $2\omega_E\sin\varphi$ is what meteorologists call the Coriolis parameter, zero at the equator and $1.46 \times 10^{-4}\,\mathrm{s^{-1}}$ at the poles. In the northern hemisphere the *force* $-2m\boldsymbol{\omega} \times \mathbf{v}_{rel}$ pushes to the right of the direction of travel: for northward flight ($v_N > 0$) the term is $-2\omega_E s\, v_N$ along east, so the force is toward $+\hat{\mathbf{e}}$, east; for eastward flight the term has a component $2\omega_E s\, v_E$ along north, so the force is toward south. Both are rightward turns. In the southern hemisphere $\sin\varphi < 0$ and both flip.

The vertical part, $2\omega_E \cos\varphi\, v_E$ along down for eastward flight, is the Eötvös effect: the force $-2m\omega_E v_E \cos\varphi\,\hat{\mathbf{d}}$ points up for eastward motion and down for westward. A gravimeter carried east on a ship reads less than one carried west, and an INS that omits the term mis-estimates the vertical channel.

::: example An airliner heading east at 45° north
An aircraft cruises due east at $250\,\mathrm{m/s}$ relative to the ground at $\varphi = 45^\circ$, so $\mathbf{v}^{N} = (0, 250, 0)\,\mathrm{m/s}$ and $\sin\varphi = \cos\varphi = 0.7071$. From the component formula,

$$
2\boldsymbol{\omega} \times \mathbf{v}_{rel} = 2 \times 7.292115 \times 10^{-5} \begin{bmatrix} 0.7071 \times 250 \\ 0 \\ 0.7071 \times 250 \end{bmatrix}
= \begin{bmatrix} 0.0258 \\ 0 \\ 0.0258 \end{bmatrix} \mathrm{m/s^2} .
$$

The Coriolis *force* per unit mass is the negative: $0.0258\,\mathrm{m/s^2}$ toward south and $0.0258\,\mathrm{m/s^2}$ upward (the Eötvös part). If nothing corrected the heading, the southward push alone would displace the aircraft by $\tfrac{1}{2} \times 0.0258 \times 3600^2 = 167\,\mathrm{km}$ over an hour. Nothing that large is ever seen, because the autopilot flies a track referenced to GNSS or radio fixes and trims the heading continuously by a fraction of a degree. The effect is not absent; it is closed out by feedback, and the crew never know it was there. Inside the aircraft's INS, however, the term is modelled explicitly at every integration step, because the INS has no feedback of its own between fixes.
:::

::: example A long shot fired north
A projectile leaves a gun at $\varphi = 45^\circ$ heading north at $800\,\mathrm{m/s}$ and flies for $60\,\mathrm{s}$; treat the speed as constant. The horizontal Coriolis term is $-2\omega_E \sin\varphi\, v_N$ along east:

$$
2 \times 7.292115 \times 10^{-5} \times 0.7071 \times 800 = 0.0825\,\mathrm{m/s^2} ,
$$

so the force pushes east at $0.0825\,\mathrm{m/s^2}$. With no aerodynamic guidance the eastward deflection after $t = 60\,\mathrm{s}$ is $\tfrac{1}{2} \times 0.0825 \times 60^2 = 149\,\mathrm{m}$, against a range of $48\,\mathrm{km}$. That is more than the length of a ship, and artillery firing tables have carried a Coriolis correction since the First World War. Scale the same estimate to a re-entry vehicle: an unguided body travelling at $7\,000\,\mathrm{m/s}$ for $1\,800\,\mathrm{s}$ at the same latitude has a Coriolis acceleration of $0.722\,\mathrm{m/s^2}$ and, integrated naively, a deflection of order $10^3\,\mathrm{km}$. The naive integration is not valid over a trajectory that long (the velocity direction changes, and the term must be integrated together with gravity), but the order of magnitude explains why a ballistic trajectory is always computed in an inertial frame and then rotated into the Earth frame at the end, rather than the other way round.
:::

## The centrifugal term

$$
\mathbf{a}_{cf} = \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) = \boldsymbol{\omega}(\boldsymbol{\omega} \cdot \mathbf{r}) - \omega^2\,\mathbf{r} = -\omega_E^2\, \mathbf{r}_\perp ,
$$

using the identity $\mathbf{u} \times (\mathbf{v} \times \mathbf{w}) = \mathbf{v}(\mathbf{u} \cdot \mathbf{w}) - \mathbf{w}(\mathbf{u} \cdot \mathbf{v})$, where $\mathbf{r}_\perp$ is the component of $\mathbf{r}$ perpendicular to the spin axis, of length $r\cos\varphi'$ with $\varphi'$ the geocentric latitude. The term points toward the axis: it is the centripetal acceleration of a point carried round by the Earth. The centrifugal *force* $-m\mathbf{a}_{cf} = m\omega_E^2\mathbf{r}_\perp$ points away from the axis, which is the direction everyone's intuition expects and the reason for the name.

It does not depend on the velocity at all, so it is present for a vehicle parked on the pad. Its magnitude at the equator on the surface is

$$
\omega_E^2 R = (7.292115 \times 10^{-5})^2 \times 6.378137 \times 10^{6} = 0.0339\,\mathrm{m/s^2} ,
$$

about 0.35 per cent of $g_0 = 9.80665\,\mathrm{m/s^2}$. At latitude $\varphi$ it scales by $\cos\varphi$: $0.0240\,\mathrm{m/s^2}$ at $45^\circ$, zero at the poles.

### Gravitation, gravity and the plumb line

Because the centrifugal term is velocity-independent and depends only on position, it is convenient to fold it into the gravitational field once and for all. Define

$$
\mathbf{g} = \mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) ,
$$

where $\mathbf{g}_{grav} = -\mu\,\mathbf{r}/r^3$ (plus higher harmonics) is the Newtonian *gravitation* and $\mathbf{g}$ is *gravity*: what a plumb line hangs along and a stationary accelerometer reads. Every geodetic gravity model, WGS-84's normal gravity included, is a model of $\mathbf{g}$, not of $\mathbf{g}_{grav}$. The two names are used interchangeably in conversation and never in an INS.

At the equator the centrifugal term is parallel to gravitation and reduces it. At mid-latitudes it has a component along the local horizontal, and the plumb line tilts toward the equator. At $45^\circ$ the horizontal component is $0.0240 \times \sin 45^\circ = 0.0170\,\mathrm{m/s^2}$, and the tilt is $\arctan(0.0170 / 9.79) \approx 1.73 \times 10^{-3}\,\mathrm{rad}$, about 6 arcminutes. The "local vertical" of a navigation frame is the direction of $\mathbf{g}$, and the ellipsoid normal used to define NED is very nearly that direction, precisely because the ellipsoid itself was shaped by the same rotation.

The centrifugal term also explains most of the variation of sea-level gravity with latitude. WGS-84 gives normal gravity $\gamma_e = 9.7803253359\,\mathrm{m/s^2}$ on the equator and $\gamma_p = 9.8321849378\,\mathrm{m/s^2}$ at the poles, a difference of $0.0519\,\mathrm{m/s^2}$. Of that, $0.0339\,\mathrm{m/s^2}$ is the centrifugal term switching off between equator and pole; the remaining $0.018\,\mathrm{m/s^2}$ is the equator being $21\,\mathrm{km}$ farther from the centre, with extra mass under it, on the flattened ellipsoid.

::: key
The centrifugal acceleration is $\mathbf{a}_{cf} = \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) = -\omega^2\mathbf{r}_\perp$, toward the axis, independent of velocity. At the equator $\omega^2 R \approx (7.292 \times 10^{-5})^2 \times 6.378 \times 10^{6} \approx 0.0339\,\mathrm{m/s^2}$, about 0.35 per cent of $g$. Gravity is gravitation minus this term: $\mathbf{g} = \mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$.
:::

## The Euler term

$$
\mathbf{a}_{eul} = \dot{\boldsymbol{\omega}} \times \mathbf{r} .
$$

It exists only while the rotation rate is changing. For the Earth, the length of day varies by about a millisecond over a year, so the fractional change of $\omega_E$ is of order $10^{-8}$ per day and $\dot{\omega}_E \sim 10^{-17}\,\mathrm{rad/s^2}$. Multiplied by the Earth's radius that is $10^{-10}\,\mathrm{m/s^2}$, five orders of magnitude below the resolution of a navigation-grade accelerometer. Every Earth-referenced mechanisation drops it, and the acceleration relation for the Earth has three terms, not four.

For a spacecraft body frame the situation reverses. During a slew a reaction-wheel system might command $\dot{\omega} = 0.01\,\mathrm{rad/s^2}$; a sensor mounted $2\,\mathrm{m}$ from the centre of mass then sees an Euler acceleration of $0.02\,\mathrm{m/s^2}$, comparable to the centripetal term $\omega^2 \rho$ at a body rate of $0.1\,\mathrm{rad/s}$. During a stage separation or a thruster start the angular acceleration can be tens of times larger. An IMU that is not at the centre of mass must have both terms removed — lever-arm compensation — using the gyro rates and their derivative, and the derivative is the noisy part.

::: key
The Coriolis acceleration is $\mathbf{a}_{cor} = 2\boldsymbol{\omega} \times \mathbf{v}_{rel}$. It is zero when the body is at rest in the rotating frame, or when its relative velocity is parallel to $\boldsymbol{\omega}$; it never changes the relative speed, only its direction. The Euler term $\dot{\boldsymbol{\omega}} \times \mathbf{r}$ is negligible for the Earth ($\dot{\omega}_E \sim 10^{-17}\,\mathrm{rad/s^2}$) and essential for a slewing spacecraft.
:::

## Assembling the INS velocity equation

Now put the terms to work. An inertial navigation system carries the vehicle's velocity relative to the Earth, $\mathbf{v}_e$, and resolves it in NED axes. Its accelerometers measure specific force $\mathbf{f}$, which is the inertial acceleration minus gravitation: $\mathbf{a}_I = \mathbf{f} + \mathbf{g}_{grav}$. Substitute into the acceleration relation, with $\dot{\boldsymbol{\omega}}_E = 0$:

$$
\left(\frac{d\mathbf{v}_e}{dt}\right)_E = \mathbf{f} + \mathbf{g}_{grav} - \boldsymbol{\omega}_{E/I} \times (\boldsymbol{\omega}_{E/I} \times \mathbf{r}) - 2\boldsymbol{\omega}_{E/I} \times \mathbf{v}_e
= \mathbf{f} + \mathbf{g} - 2\boldsymbol{\omega}_{E/I} \times \mathbf{v}_e .
$$

The centrifugal term has vanished into $\mathbf{g}$, which is why the gravity model in an INS must be a model of gravity and not of gravitation. What remains is the Earth-frame derivative of the velocity. But the NED frame $N$ is not the Earth frame; it turns relative to the Earth as the vehicle moves over the curved surface, at the *transport rate* $\boldsymbol{\omega}_{N/E}$. One more application of the transport theorem,

$$
\left(\frac{d\mathbf{v}_e}{dt}\right)_E = \left(\frac{d\mathbf{v}_e}{dt}\right)_N + \boldsymbol{\omega}_{N/E} \times \mathbf{v}_e ,
$$

and the result, resolved in NED, is the equation an INS integrates:

$$
\dot{\mathbf{v}}^{N}_e = \mathbf{f}^{N} - \left( 2\boldsymbol{\omega}^{N}_{E/I} + \boldsymbol{\omega}^{N}_{N/E} \right) \times \mathbf{v}^{N}_e + \mathbf{g}^{N} .
$$

Here $\mathbf{f}^{N} = \mathbf{R}_{N \leftarrow B}\,\mathbf{f}^{B}$ is the accelerometer output rotated from body to NED axes using the attitude, and $\mathbf{g}^{N} \approx (0, 0, g)$ in the down-positive NED convention. In code every one of these carries its labels: `omega_ecef_wrt_eci_in_ned`, `omega_ned_wrt_ecef_in_ned`, `v_ecef_in_ned`.

The transport rate comes from the vehicle's motion over the ellipsoid. Moving north at $v_N$ tips the local vertical about the east axis; moving east at $v_E$ tips it about the north axis and also swings the north axis about the vertical, because meridians converge toward the pole. With the meridional and prime-vertical radii of curvature $M$ and $N$ from the WGS-84 lesson, and height $h$,

$$
\boldsymbol{\omega}^{N}_{N/E} = \begin{bmatrix} \dfrac{v_E}{N + h} \\[6pt] -\dfrac{v_N}{M + h} \\[6pt] -\dfrac{v_E \tan\varphi}{N + h} \end{bmatrix},
$$

and for rough work $M \approx N \approx R = 6.371 \times 10^{6}\,\mathrm{m}$. For the airliner of the first example, $v_E = 250\,\mathrm{m/s}$ at $h = 10\,\mathrm{km}$, the first component is $250 / 6.399 \times 10^{6} = 3.9 \times 10^{-5}\,\mathrm{rad/s}$ — more than half the Earth's own rate. The transport-rate term is not a refinement; it is the same size as the Coriolis term, and an INS that models one and not the other is wrong by tens of milli-g.

::: warning
The sign of every term flips between the two forms of the acceleration relation. In $\mathbf{a}_I = \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$ the Coriolis term for northward flight in the northern hemisphere points west and the centrifugal term points toward the axis. The inertial *forces* the rotating observer adds to Newton's law are the negatives: a Coriolis force to the east, a centrifugal force away from the axis. State which form you mean before you state a direction.
:::

::: warning
Gravity is not gravitation. A stationary accelerometer, a plumb line and the WGS-84 normal gravity formula all describe $\mathbf{g} = \mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$, with the centrifugal term already inside. If an INS mechanisation subtracts the centrifugal term explicitly *and* uses a gravity model, the term is removed twice, giving a horizontal error of up to $0.017\,\mathrm{m/s^2}$ that integrates to more than a kilometre in a few minutes. Decide where the term lives and put it there once.
:::

## Check yourself

::: check
A vehicle moves due south at $300\,\mathrm{m/s}$ relative to the ground at $\varphi = 30^\circ$ south. Give the direction and magnitude of the Coriolis force per unit mass, and say which way the vehicle is deflected.
:::

::: answer
In NED with $\varphi = -30^\circ$, $\sin\varphi = -0.5$, and $\mathbf{v}^{N} = (-300, 0, 0)\,\mathrm{m/s}$. The east component of $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ is $-2\omega_E \sin\varphi\, v_N = -2 \times 7.292115 \times 10^{-5} \times (-0.5) \times (-300) = -0.0219\,\mathrm{m/s^2}$, so the term points west and the force per unit mass, its negative, is $0.0219\,\mathrm{m/s^2}$ toward east. The vehicle moving south is deflected east, which is to its *left*. In the southern hemisphere Coriolis deflection is to the left of the motion, the mirror image of the northern rule. There is no vertical component because $v_E = 0$.
:::

::: check
A geostationary satellite is at rest in the Earth-fixed frame. Use the rotating-frame equation of motion to derive its orbital radius from $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$ and $\omega_E$.
:::

::: answer
At rest in the rotating frame means $\mathbf{v}_{rel} = 0$ and $\mathbf{a}_{rel} = 0$, so the Coriolis term vanishes and, with $\dot{\boldsymbol{\omega}}_E = 0$, the equation reduces to $0 = \mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$: gravitation exactly balances the centrifugal force. In the equatorial plane $\mathbf{r}_\perp = \mathbf{r}$, so $\mu / r^2 = \omega_E^2 r$ and

$$
r = \left(\frac{\mu}{\omega_E^2}\right)^{1/3} = \left(\frac{3.986004418 \times 10^{14}}{(7.292115 \times 10^{-5})^2}\right)^{1/3} = 4.216 \times 10^{7}\,\mathrm{m} ,
$$

that is $42\,164\,\mathrm{km}$ from the centre, or $35\,786\,\mathrm{km}$ above the equator. Off the equatorial plane $\mathbf{r}_\perp \neq \mathbf{r}$, the two vectors are not antiparallel, and no balance is possible — which is why a geostationary orbit must be equatorial.
:::

::: check
Why does an INS mechanisation need a gravity model rather than a gravitation model, and what goes wrong if the two are confused at $45^\circ$ latitude?
:::

::: answer
The accelerometers measure specific force, $\mathbf{f} = \mathbf{a}_I - \mathbf{g}_{grav}$. Rewriting $\mathbf{a}_I$ in the Earth frame produces the centrifugal term, and $\mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$ is by definition gravity $\mathbf{g}$. So the natural mechanisation adds $\mathbf{g}$, and the centrifugal term never appears separately. If a gravitation model is used instead, the centrifugal term is missing: the error is $\omega_E^2 R\cos\varphi = 0.024\,\mathrm{m/s^2}$ at $45^\circ$, of which $0.017\,\mathrm{m/s^2}$ is horizontal. Integrated for ten minutes that is a velocity error of $10\,\mathrm{m/s}$ and a position error of $3\,\mathrm{km}$, growing quadratically.
:::

::: check
A Foucault pendulum's swing plane turns relative to the floor because of the Coriolis force. Argue from the vertical component of $\boldsymbol{\omega}^{N}$ that the rate of turn is $\omega_E \sin\varphi$, and find the period of one full turn at $\varphi = 48.85^\circ$ (Paris).
:::

::: answer
The pendulum's motion is horizontal to first order. Only the component of $\boldsymbol{\omega}$ along the local vertical, $-\omega_E \sin\varphi\, \hat{\mathbf{d}}$, produces a horizontal Coriolis force from a horizontal velocity that rotates the velocity direction; the horizontal component of $\boldsymbol{\omega}$ produces a vertical force, which the string tension absorbs. A horizontal frame that rotated at $\omega_E \sin\varphi$ about the vertical would see no Coriolis turning at all, so the swing plane, which is inertially fixed in that sense, appears to turn at $\omega_E \sin\varphi$ relative to the floor — clockwise seen from above in the northern hemisphere. The period is $T = 2\pi / (\omega_E \sin\varphi) = 86\,164 / \sin 48.85^\circ = 86\,164 / 0.7530 = 1.144 \times 10^{5}\,\mathrm{s}$, about 31.8 hours. At the pole it would be one sidereal day; at the equator the plane never turns.
:::

::: check
A stone is dropped from rest at height $h = 100\,\mathrm{m}$ at the equator. Ignoring air resistance, in which direction is it deflected and by how much?
:::

::: answer
At the equator $\boldsymbol{\omega}^{N} = \omega_E(1, 0, 0)$ and the velocity is $\mathbf{v}^{N} = (0, 0, g t)$. Then $\boldsymbol{\omega} \times \mathbf{v}_{rel} = \omega_E(0 \cdot g t - 0, 0 - 1 \cdot g t, 0) = (0, -\omega_E g t, 0)$, so the Coriolis force per unit mass is $-2\boldsymbol{\omega} \times \mathbf{v}_{rel} = (0, 2\omega_E g t, 0)$: eastward. Integrating twice from rest, the eastward displacement is $\omega_E g t^3 / 3$. The fall takes $t = \sqrt{2h/g} = \sqrt{200 / 9.80665} = 4.516\,\mathrm{s}$, so

$$
\Delta y = \frac{7.292115 \times 10^{-5} \times 9.80665 \times 4.516^3}{3} = 0.022\,\mathrm{m} ,
$$

about $2.2\,\mathrm{cm}$ east. The physical picture: the top of the tower moves east faster than its base, because it is farther from the axis, and the stone keeps that extra eastward speed as it falls. At $45^\circ$ latitude the result scales by $\cos\varphi$ to $1.6\,\mathrm{cm}$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\boldsymbol{\omega}^{N} = \omega_E(\cos\varphi, 0, -\sin\varphi)$ | Earth rotation vector in NED axes at latitude $\varphi$ |
| $\boldsymbol{\omega} \times \mathbf{v}_{rel} = \omega_E(s\,v_E,\; -s\,v_N - c\,v_D,\; c\,v_E)$ | Building block for every Coriolis result over the Earth |
| $\mathbf{a}_{cor} = 2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ | Coriolis term; zero at rest or for $\mathbf{v}_{rel} \parallel \boldsymbol{\omega}$; does no work |
| $2\omega_E \sin\varphi$ | Coriolis parameter; force to the right of motion in the north, left in the south |
| $2\omega_E \cos\varphi\, v_E$ | Eötvös effect: vertical Coriolis from eastward motion |
| $\mathbf{a}_{cf} = \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) = -\omega^2\mathbf{r}_\perp$ | Centrifugal term, toward the axis; $0.0339\,\mathrm{m/s^2}$ at the equator, 0.35% of $g$ |
| $\mathbf{g} = \mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$ | Gravity (plumb line) versus gravitation; 6′ tilt at $45^\circ$ |
| $\mathbf{a}_{eul} = \dot{\boldsymbol{\omega}} \times \mathbf{r}$ | Euler term; $\sim 10^{-10}\,\mathrm{m/s^2}$ for the Earth, $\sim 10^{-2}\,\mathrm{m/s^2}$ for a slewing spacecraft |
| $\dot{\mathbf{v}}^{N}_e = \mathbf{f}^{N} - (2\boldsymbol{\omega}^{N}_{E/I} + \boldsymbol{\omega}^{N}_{N/E}) \times \mathbf{v}^{N}_e + \mathbf{g}^{N}$ | INS velocity mechanisation in NED |
| $\boldsymbol{\omega}^{N}_{N/E} = \left(\frac{v_E}{N+h}, -\frac{v_N}{M+h}, -\frac{v_E\tan\varphi}{N+h}\right)$ | Transport rate; comparable to $\omega_E$ for an airliner |

The next lesson turns to the two frames these terms connect: the Earth-centred inertial frame in which Newton's law holds and the Earth-fixed frame that rotates at $\omega_E$, and builds the rotation between them from the Earth rotation angle.
