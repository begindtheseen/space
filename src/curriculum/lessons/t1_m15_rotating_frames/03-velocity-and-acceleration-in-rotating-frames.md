---
id: l03-velocity-and-acceleration-in-rotating-frames
title: Velocity and acceleration in rotating frames
minutes: 20
covers:
  - velocity and acceleration in rotating frames
---

Stand on an airport moving walkway and walk forward. Your friend standing on the walkway sees you stroll at walking pace. Someone standing beside it sees you go by much faster: your walking speed plus the walkway's. Neither of them is wrong. They are describing one motion from two places, and one of those places is moving.

Now make the walkway a spinning planet. A **[[GNSS receiver|gnss-ecef]]** on a satellite reports its velocity relative to the turning Earth. The program that predicts where the satellite will be in ninety minutes needs its velocity relative to inertial space. In low Earth orbit the two differ by about half a kilometer per second, and neither is "the" velocity. Even a rocket still sitting on its pad is already moving at several hundred meters per second in the inertial frame its orbit will be worked out in — and mission designers cash that motion in as propellant saved.

Both facts come from applying the transport theorem of the last lesson to a position. Applying it once gives the rule that links velocities seen from an inertial frame and a turning one. Applying it a second time gives the rule for accelerations — and out of that second step fall three extra terms, called **Coriolis**, **centrifugal** and **Euler**, that every equation of motion in a turning frame must carry. This lesson derives both rules with every step visible, because the factor of $2$ in the Coriolis term is the most often misremembered number in the subject. Then it uses the velocity rule for the launch-direction calculation that every ascent design starts with.

## Setting up the two frames

Let $I$ be an inertial frame with origin $O$. Let $B$ be a frame that turns relative to $I$ with angular velocity $\boldsymbol{\omega} = \boldsymbol{\omega}_{B/I}$, and whose origin $O'$ ("O prime") sits at position $\mathbf{r}_{O'}$ measured from $O$.

A point $P$ has position $\mathbf{r}$ measured from $O$, and position $\boldsymbol{\rho}$ ("rho", the Greek r) measured from $O'$. Walking from $O$ to $P$ is the same as walking from $O$ to $O'$ and then from $O'$ to $P$:

$$
\mathbf{r} = \mathbf{r}_{O'} + \boldsymbol{\rho} .
$$

Two cases matter most:

- **The Earth.** $B$ is the Earth-centered, Earth-fixed frame (ECEF). Its origin is the Earth's center, the same as the inertial origin, so $\mathbf{r}_{O'} = 0$. $\boldsymbol{\omega}$ is the Earth's spin, which is constant to a very good approximation.
- **A spacecraft body frame.** $O'$ is the center of mass, moving along the orbit, and $\boldsymbol{\omega}$ is whatever the gyros say.

Keeping $\mathbf{r}_{O'}$ in the derivation costs nothing and makes the result work for both.

Two velocities of $P$ will appear. The **inertial velocity** is $\mathbf{v}_I = (\dot{\mathbf{r}})_I$, the rate of change of $\mathbf{r}$ seen from the inertial frame. The **relative velocity** is $\mathbf{v}_{rel} = (\dot{\boldsymbol{\rho}})_B$, the rate of change of $P$'s position as seen by an observer fixed in $B$. The relative velocity is what a GNSS receiver reports, what a wind gauge measures in still air, and what a pilot means by ground speed.

## Velocity

Take the rate of change of $\mathbf{r} = \mathbf{r}_{O'} + \boldsymbol{\rho}$, as seen in the inertial frame, one piece at a time.

**First piece.** The rate of change of $\mathbf{r}_{O'}$ is $\mathbf{v}_{O'}$, the inertial velocity of the moving origin.

**Second piece.** $\boldsymbol{\rho}$ is most naturally described in $B$, so use the transport theorem: its inertial rate is its $B$-rate plus the rotation term.

$$
\mathbf{v}_I = \mathbf{v}_{O'} + \left(\frac{d\boldsymbol{\rho}}{dt}\right)_B + \boldsymbol{\omega} \times \boldsymbol{\rho}
= \mathbf{v}_{O'} + \mathbf{v}_{rel} + \boldsymbol{\omega} \times \boldsymbol{\rho} .
$$

Read it like the moving walkway. The inertial velocity is the velocity of the frame's origin, plus the velocity seen inside the frame, plus the velocity that a point glued to the frame at $\boldsymbol{\rho}$ would have just because the frame turns.

For the Earth the origins match, so

$$
\mathbf{v}_I = \mathbf{v}_{rel} + \boldsymbol{\omega}_E \times \mathbf{r} .
$$

The correction $\boldsymbol{\omega}_E \times \mathbf{r}$ points east, at right angles to both the polar axis and the position. Its size is $\omega_E\, r \cos\varphi'$. Here $\varphi'$ ("phi prime") is the **[[geocentric latitude|geocentric-latitude]]**, the angle of $\mathbf{r}$ above the equator plane, so $r\cos\varphi'$ is the distance from the spin axis.

Some sizes worth remembering:

- $465\,\mathrm{m/s}$ on the surface at the equator ($7.292115 \times 10^{-5} \times 6\,378\,137$);
- $502\,\mathrm{m/s}$ at $500\,\mathrm{km}$ altitude over the equator;
- $3075\,\mathrm{m/s}$ at the **[[geostationary|geo-zero]]** radius, $42\,164\,\mathrm{km}$.

That last number equals the circular orbit speed at that radius. In other words, a geostationary satellite has zero velocity relative to the Earth. Its $\mathbf{v}_{rel}$ is zero, and all of its inertial velocity is $\boldsymbol{\omega}_E \times \mathbf{r}$.

In coordinates, with everything written along ECEF axes and then rotated:

$$
\mathbf{v}^{I} = \mathbf{R}_{I \leftarrow E}\left( \mathbf{v}^{E} + \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E} \right), \qquad \boldsymbol{\omega}^{E}_{E/I} = \begin{bmatrix} 0 \\ 0 \\ \omega_E \end{bmatrix}.
$$

These are two operations of different kinds. Adding $\boldsymbol{\omega} \times \mathbf{r}$ changes *which physical arrow* you hold: relative velocity becomes inertial velocity. Multiplying by $\mathbf{R}_{I \leftarrow E}$ changes only *the axes* the numbers are written along. A conversion routine that does one and not the other is wrong by either $500\,\mathrm{m/s}$ or a rotation — and both mistakes run without complaint.

::: example A polar orbit that is not quite polar
A satellite at $500\,\mathrm{km}$ altitude crosses the equator heading due north. Its GNSS receiver reports ECEF position $\mathbf{r}^{E} = (6\,878\,137, 0, 0)\,\mathrm{m}$ and ECEF velocity $\mathbf{v}^{E} = (0, 0, 7\,612.6)\,\mathrm{m/s}$ — the same size as circular orbit speed at that radius, $\sqrt{\mu / r}$, where $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ is the Earth's gravity constant. What is its inertial velocity, and what is the orbit's **[[inclination|inclination-meaning]]**?

**The rotation term.** For $\boldsymbol{\omega} = (0, 0, \omega_E)$ and $\mathbf{r} = (r, 0, 0)$, the cross product is $(0, \omega_E r, 0)$. Put in the numbers: $7.292115 \times 10^{-5} \times 6\,878\,137 = 501.6\,\mathrm{m/s}$, pointing east (the $+y$ direction at this spot).

**Add it on**, still along ECEF axes:

$$
\mathbf{v}^{E} + \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E} = \begin{bmatrix} 0 \\ 501.6 \\ 7\,612.6 \end{bmatrix} \mathrm{m/s}, \qquad |\mathbf{v}_I| = \sqrt{501.6^2 + 7\,612.6^2} = 7\,629.1\,\mathrm{m/s} .
$$

**The tilt.** Relative to the Earth the track runs straight north, so from the ground the satellite looks polar. Inertially its velocity leans east of north by $\arctan(501.6 / 7\,612.6) = 3.77^\circ$. So the orbit's inclination is $90^\circ - 3.77^\circ = 86.2^\circ$, not $90^\circ$.

**Sanity check.** The inertial speed is a little bigger than the ground-relative speed, as it should be when the Earth's eastward push is added at right angles. Anyone who works out orbital elements from an ECEF state without adding the rotation term gets the wrong orbit plane — and the error is not small.
:::

## Acceleration

Now take the rate of change of the velocity rule, again as seen in the inertial frame. It has three pieces; take them one at a time.

**Piece 1: the origin.** The rate of change of $\mathbf{v}_{O'}$ is the inertial acceleration of the origin, $\mathbf{a}_{O'}$.

**Piece 2: the relative velocity.** $\mathbf{v}_{rel}$ is an arrow described in $B$, so the transport theorem applies to it too:

$$
\left(\frac{d\mathbf{v}_{rel}}{dt}\right)_I = \left(\frac{d\mathbf{v}_{rel}}{dt}\right)_B + \boldsymbol{\omega} \times \mathbf{v}_{rel} = \mathbf{a}_{rel} + \boldsymbol{\omega} \times \mathbf{v}_{rel} .
$$

Here $\mathbf{a}_{rel} = (\ddot{\boldsymbol{\rho}})_B$ (two dots: the rate of change of the rate of change) is the **relative acceleration**, the acceleration seen inside the turning frame.

**Piece 3: the rotation term $\boldsymbol{\omega} \times \boldsymbol{\rho}$.** Use the product rule: change $\boldsymbol{\omega}$ and hold $\boldsymbol{\rho}$, then hold $\boldsymbol{\omega}$ and change $\boldsymbol{\rho}$.

- The rate of change of $\boldsymbol{\omega}$ is the angular acceleration $\dot{\boldsymbol{\omega}}$, the same in both frames (last lesson, remark 2).
- The inertial rate of change of $\boldsymbol{\rho}$ is $\mathbf{v}_{rel} + \boldsymbol{\omega} \times \boldsymbol{\rho}$, from the velocity rule.

$$
\left(\frac{d}{dt}\left(\boldsymbol{\omega} \times \boldsymbol{\rho}\right)\right)_I = \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho} + \boldsymbol{\omega} \times \left( \mathbf{v}_{rel} + \boldsymbol{\omega} \times \boldsymbol{\rho} \right)
= \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho} + \boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho}) .
$$

**Collect everything.** Look for $\boldsymbol{\omega} \times \mathbf{v}_{rel}$. It turned up in piece 2 *and* in piece 3. The first time, it came from the relative velocity being measured against turning axes. The second time, it came from the relative velocity moving the point to a new spot, where the frame's turning carries it at a different speed. Two different causes, the same term, added together — [[that is the whole origin of the factor 2|factor-two]]:

$$
\mathbf{a}_I = \mathbf{a}_{O'} + \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho}) + \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho} .
$$

Each term has a name:

- $\mathbf{a}_{O'}$ — the acceleration of the moving origin. Zero for the Earth-centered frame; the orbital acceleration for a spacecraft body frame.
- $\mathbf{a}_{rel}$ — the **relative** acceleration, what an observer inside $B$ would work out by tracking positions.
- $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ — the **Coriolis** term. It is there only when the point moves relative to the frame.
- $\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho})$ — the **centrifugal** term. It is there whenever the point is off the spin axis, moving or not. As a term in $\mathbf{a}_I$ it [[points toward the axis|centripetal-picture]].
- $\dot{\boldsymbol{\omega}} \times \boldsymbol{\rho}$ — the **Euler** or angular-acceleration term. It is there only when the turning rate changes.

For the Earth frame, write $\mathbf{r}$ in place of $\boldsymbol{\rho}$ and drop the origin term. The rule then reads exactly as the key below states it.

::: key
The full acceleration of a point in a rotating frame: $\mathbf{a}_I = \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) + \dot{\boldsymbol{\omega}} \times \mathbf{r}$ — relative, Coriolis, centrifugal, and Euler (angular acceleration) terms. If the frame's origin also accelerates, add $\mathbf{a}_{O'}$. The factor of 2 comes from differentiating both the rotating basis and the relative velocity.
:::

::: key
Velocity in a rotating frame: $\mathbf{v}_I = \mathbf{v}_{rel} + \boldsymbol{\omega} \times \mathbf{r}$ (plus $\mathbf{v}_{O'}$ if the origin moves). For the Earth, $|\boldsymbol{\omega}_E \times \mathbf{r}|$ is about $465\,\mathrm{m/s}$ on the surface at the equator and $502\,\mathrm{m/s}$ at $500\,\mathrm{km}$ altitude, directed east.
:::

## Newton's law, seen from the turning frame

Newton's second law holds in the inertial frame: $m\mathbf{a}_I = \mathbf{F}$. Here $m$ is the mass and $\mathbf{F}$ is the sum of real forces — gravity, thrust, air forces, contact. An observer riding the turning frame wants a law for the acceleration *they* see, $\mathbf{a}_{rel}$. Replace $\mathbf{a}_I$ by the acceleration rule, multiply by $m$, and move everything except $m\,\mathbf{a}_{rel}$ to the right-hand side:

$$
m\,\mathbf{a}_{rel} = \mathbf{F} - m\,\mathbf{a}_{O'} - 2m\,\boldsymbol{\omega} \times \mathbf{v}_{rel} - m\,\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) - m\,\dot{\boldsymbol{\omega}} \times \mathbf{r} .
$$

The four extra terms on the right are called **inertial** or **[[fictitious forces|fictitious-force]]**. Nothing is pushing on the body. They are the price of insisting that the acceleration in a frame that is itself turning should still obey "mass times acceleration equals force".

Moving them across the equals sign flipped their signs, and that is the most common source of confusion in this whole subject. The centrifugal *term* in $\mathbf{a}_I$ points toward the spin axis; the centrifugal *force* felt in the turning frame points away from it. Likewise, for a body moving north in the northern hemisphere, the Coriolis *term* $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ points west, but the Coriolis *force*, and the [[deflection it causes|coriolis-direction]], point east. The next lesson takes each term apart and puts numbers on it for vehicles moving over the Earth.

## Launch-site velocity and launch direction

The velocity rule answers the first question of every ascent design. How much of the orbital speed does the turning Earth give you for free? And which direction must the rocket fly, relative to the ground, to end up in the right orbit plane?

**The pad's speed.** Take a launch site at geodetic latitude $\varphi$ (the latitude on a map). In the local north–east–down axes, the pad's Earth-rotation velocity points purely east with size $v_{site} = \omega_E\, d$, where $d$ is the distance from the spin axis. On the true, slightly flattened Earth, $d = N(\varphi)\cos\varphi$, with $N$ a radius defined in a later lesson. For now $d \approx R\cos\varphi$ is close enough. At Cape Canaveral, $\varphi = 28.56^\circ$ and $v_{site} = 408.8\,\mathrm{m/s}$.

**The direction the orbit needs.** The target orbit has inclination $i$. At **injection** — the moment the rocket's engines cut off in orbit, still close to the launch latitude — the inertial velocity $\mathbf{v}_I$ is horizontal, with size $v_{orb}$, and points at an inertial **azimuth** $\beta_i$ ("beta i") — the compass direction, measured from north toward east.

The orbit's tilt is fixed by its **normal**, $\mathbf{h} = \mathbf{r} \times \mathbf{v}_I$, the arrow at right angles to the orbit plane. The inclination is the angle between that normal and the polar axis, so $\cos i = h_z / |\mathbf{h}|$, where $h_z$ is the part of $\mathbf{h}$ along the polar axis.

Now write everything in north–east–down axes at the launch point:

- the position points straight up, which is minus "down": $\mathbf{r} = (0, 0, -r)$;
- the velocity is $\mathbf{v}_I = v_{orb}(\cos\beta_i, \sin\beta_i, 0)$;
- the polar axis tilts north and up by the latitude: $(\cos\varphi, 0, -\sin\varphi)$.

Work out the cross product for $\mathbf{h}$, then dot it with the polar axis:

$$
\mathbf{h} = r\, v_{orb} \begin{bmatrix} \sin\beta_i \\ -\cos\beta_i \\ 0 \end{bmatrix}, \qquad
\cos i = \frac{\mathbf{h} \cdot (\cos\varphi, 0, -\sin\varphi)}{r\,v_{orb}} = \cos\varphi\,\sin\beta_i .
$$

So the inertial azimuth satisfies

$$
\sin\beta_i = \frac{\cos i}{\cos\varphi} .
$$

Two facts follow at once. The lowest inclination you can reach directly from a site is $i = \varphi$, with a due-east launch ($\beta_i = 90^\circ$). And an inclination below the site's latitude needs a **[[plane change|plane-change-cost]]** later, which is expensive.

**What the rocket must supply.** The rocket starts at rest on the pad, and its guidance flies relative to the ground. So what its engines must produce is $\mathbf{v}_{rel} = \mathbf{v}_I - \boldsymbol{\omega}_E \times \mathbf{r}$. In north–east–down components the pad's velocity only affects the east part:

$$
\mathbf{v}_{rel} = \begin{bmatrix} v_{orb}\cos\beta_i \\ v_{orb}\sin\beta_i - v_{site} \\ 0 \end{bmatrix}, \qquad
\tan\beta_{rel} = \frac{v_{orb}\sin\beta_i - v_{site}}{v_{orb}\cos\beta_i} .
$$

The ideal speed the engines must deliver is $|\mathbf{v}_{rel}|$, before losses to gravity and air drag. The angle $\beta_{rel}$ is the azimuth the vehicle actually flies over the ground.

::: example Cape Canaveral to the Space Station's orbit plane
A rocket from Cape Canaveral ($\varphi = 28.56^\circ$, $v_{site} = 408.8\,\mathrm{m/s}$) must reach a circular $400\,\mathrm{km}$ orbit at $i = 51.6^\circ$. The orbit speed there is $v_{orb} = \sqrt{\mu / (6\,778\,137\,\mathrm{m})} = 7\,668.6\,\mathrm{m/s}$.

**Inertial azimuth.** Divide the two cosines:

$$
\sin\beta_i = \frac{\cos 51.6^\circ}{\cos 28.56^\circ} = \frac{0.6211}{0.8783} = 0.7072, \qquad \beta_i = 45.0^\circ .
$$

A northeast ascent.

**Relative velocity, north part:** $7\,668.6 \cos 45.0^\circ = 5\,421.8\,\mathrm{m/s}$.

**Relative velocity, east part:** the orbit's east part minus the pad's push, $7\,668.6 \sin 45.0^\circ - 408.8 = 5\,423.2 - 408.8 = 5\,014.4\,\mathrm{m/s}$.

**Size and ground azimuth:**

$$
|\mathbf{v}_{rel}| = \sqrt{5\,421.8^2 + 5\,014.4^2} = 7\,385.1\,\mathrm{m/s}, \qquad \beta_{rel} = \arctan\frac{5\,014.4}{5\,421.8} = 42.8^\circ .
$$

**What the Earth gave.** $7\,668.6 - 7\,385.1 = 283.5\,\mathrm{m/s}$ of the required speed, about $3.7\%$. For a rocket of this class that is several hundred kilograms of payload. And the rocket must steer about $2.2^\circ$ north of the inertial azimuth, to cancel the eastward push it did not ask for — see the [[velocity triangle|azimuth-triangle]].

**Sanity check.** The Earth helped by less than the full $408.8\,\mathrm{m/s}$, because its push points east while the orbit heads northeast. Only the part of the push along the flight direction helps.

**A polar orbit from the same site.** Now $i = 90^\circ$, so $\beta_i = 0$ (due north). The east part of $\mathbf{v}_{rel}$ is $0 - 408.8 = -408.8\,\mathrm{m/s}$: the rocket must *cancel* the pad's motion. Then $|\mathbf{v}_{rel}| = \sqrt{7\,668.6^2 + 408.8^2} = 7\,679.4\,\mathrm{m/s}$, so the Earth's rotation *costs* $10.9\,\mathrm{m/s}$, and the rocket flies $3.05^\circ$ west of north. This is one reason US polar launches go from **[[Vandenberg|vandenberg]]** in California, where flying south over open ocean is safe.
:::

::: warning The Coriolis term: a 2, and the relative velocity
The Coriolis term carries a factor of $2$, and it multiplies the *relative* velocity, not the inertial one. Both slips are common. If a derivation produces $\boldsymbol{\omega} \times \mathbf{v}$ with no $2$, one of the two places $\mathbf{v}_{rel}$ appears was dropped. If it produces $2\boldsymbol{\omega} \times \mathbf{v}_I$, the velocity rule was never substituted. Either mistake makes an inertial navigation system drift.
:::

::: warning ECEF to ECI takes two steps
Converting an ECEF state to ECI needs two different operations: adding $\boldsymbol{\omega}_E \times \mathbf{r}$ to the velocity (a change of physical arrow) and rotating the axes with $\mathbf{R}_{I \leftarrow E}$ (a change of coordinates). Position needs only the rotation. Rotating the velocity without adding the term leaves an eastward error of roughly $500\,\mathrm{m/s}$ in low orbit — and the result still looks like a believable state.
:::

## Check yourself

::: check
A point is fixed on the surface of a turning body — a launch pad on the Earth. Simplify the general acceleration rule for this case and name the term that survives. Which way does it point?
:::

::: answer
Fixed in the turning frame means $\mathbf{v}_{rel} = 0$ and $\mathbf{a}_{rel} = 0$. The Earth's rate is constant, so $\dot{\boldsymbol{\omega}} = 0$. The origin does not accelerate. Only the centrifugal term survives:

$$
\mathbf{a}_I = \boldsymbol{\omega}_E \times (\boldsymbol{\omega}_E \times \mathbf{r}).
$$

Expand it with the rule $\mathbf{u} \times (\mathbf{v} \times \mathbf{w}) = \mathbf{v}(\mathbf{u}\cdot\mathbf{w}) - \mathbf{w}(\mathbf{u}\cdot\mathbf{v})$. That gives $\boldsymbol{\omega}_E(\boldsymbol{\omega}_E \cdot \mathbf{r}) - \omega_E^2\,\mathbf{r} = -\omega_E^2\,\mathbf{r}_\perp$, where $\mathbf{r}_\perp$ ("r perp") is the part of $\mathbf{r}$ at right angles to the spin axis. The minus sign means it points *toward* the axis: the pad is being pulled round in a circle, at $\omega_E^2 R\cos\varphi'$ — about $0.034\,\mathrm{m/s^2}$ at the equator.
:::

::: check
A GNSS receiver on a satellite in a circular orbit over the equator at $500\,\mathrm{km}$ reports zero north–south ECEF velocity and an eastward ECEF speed of $7\,111\,\mathrm{m/s}$. Is the orbit **prograde** (going the same way the Earth turns) or **retrograde** (the opposite way)? What is the inertial speed?
:::

::: answer
The Earth-rotation term at that radius is $\omega_E r = 7.292115 \times 10^{-5} \times 6\,878\,137 = 501.6\,\mathrm{m/s}$, pointing east. The inertial velocity is $\mathbf{v}_{rel} + \boldsymbol{\omega}_E \times \mathbf{r}$. Both point east, so the speeds add: $7\,111 + 501.6 = 7\,612.6\,\mathrm{m/s}$ — exactly the circular speed at $6\,878\,\mathrm{km}$, a good sign.

The satellite moves east in both frames, so the orbit is prograde. A retrograde equatorial satellite would show an ECEF speed of $7\,612.6 + 501.6 = 8\,114\,\mathrm{m/s}$ *westward*: the Earth's rotation adds to the ground speed of a retrograde satellite instead of subtracting from it.
:::

::: check
In a spacecraft body frame the origin is the center of mass and $\boldsymbol{\omega}$ is the body rate. Write the acceleration of a part mounted at body position $\boldsymbol{\rho}$ (fixed in the body). Which extra terms would an accelerometer there sense, compared with one at the center of mass?
:::

::: answer
Fixed in the body means $\mathbf{v}_{rel} = \mathbf{a}_{rel} = 0$. That leaves

$$
\mathbf{a}_I = \mathbf{a}_{O'} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho}) + \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho}.
$$

An accelerometer at the center of mass senses only what goes with $\mathbf{a}_{O'}$. One mounted at $\boldsymbol{\rho}$ also senses the centripetal term $\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho})$ and the Euler term $\dot{\boldsymbol{\omega}} \times \boldsymbol{\rho}$.

Numbers: for $|\boldsymbol{\omega}| = 0.5\,\mathrm{rad/s}$ and $|\boldsymbol{\rho}| = 2\,\mathrm{m}$, the centripetal part is $0.5^2 \times 2 = 0.5\,\mathrm{m/s^2}$. An angular acceleration of $0.01\,\mathrm{rad/s^2}$ adds $0.01 \times 2 = 0.02\,\mathrm{m/s^2}$. Navigation software removes these using the known offset and the gyro data — a step usually called **[[lever-arm compensation|lever-arm]]**, or size-effect compensation.
:::

::: check
A site at $\varphi = 45^\circ$ wants a $45^\circ$ inclination orbit. What is the inertial launch azimuth, how much does the Earth help, and why can the site not reach $i = 40^\circ$ directly?
:::

::: answer
$\sin\beta_i = \cos 45^\circ / \cos 45^\circ = 1$, so $\beta_i = 90^\circ$: a due-east launch.

The pad's eastward speed is about $\omega_E R\cos 45^\circ \approx 465 \times 0.707 = 329\,\mathrm{m/s}$. It points exactly along the required velocity, so it all counts: $|\mathbf{v}_{rel}| = v_{orb} - 329\,\mathrm{m/s}$.

For $i = 40^\circ$ the formula demands $\sin\beta_i = \cos 40^\circ / \cos 45^\circ = 0.766 / 0.707 = 1.083$. No angle has a sine bigger than $1$, so there is no solution. The reason is geometric: the orbit plane must pass through the launch point, and a plane through a point at latitude $45^\circ$ cannot be tilted less than $45^\circ$ from the equator. Reaching $40^\circ$ needs a plane change after injection. For a $5^\circ$ change at low-orbit speed that costs roughly $2 v_{orb} \sin(2.5^\circ) \approx 670\,\mathrm{m/s}$.
:::

::: check
In a sentence or two each: why does the centrifugal term not depend on the point's velocity? Why does the Coriolis term not depend on its position? And why is the Euler term routinely left out for the Earth but not for a spacecraft?
:::

::: answer
**Centrifugal:** $\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$ came from the rate of change of $\boldsymbol{\omega} \times \mathbf{r}$, the velocity the frame's turning gives the point's current spot. It exists because the spot is carried round, whether or not the point moves within the frame.

**Coriolis:** $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ came from two effects — the relative velocity being measured against turning axes, and the relative velocity moving the point to a spot with a different turning speed. Both involve $\mathbf{v}_{rel}$; neither involves where the point is.

**Euler:** $\dot{\boldsymbol{\omega}} \times \mathbf{r}$ needs the turning rate to change. The Earth's rate varies by only about one part in $10^{8}$ (a millisecond or so in the length of a day), and that over months and years, so the term is negligible. A spacecraft that slews, spins up or fires thrusters can change its rate quickly — $\dot{\boldsymbol{\omega}}$ can be as large as $\omega^2$ or larger — so it must keep the term.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r} = \mathbf{r}_{O'} + \boldsymbol{\rho}$ | Position from the inertial origin; from the turning frame's origin |
| $\mathbf{v}_{rel} = (\dot{\boldsymbol{\rho}})_B$, $\mathbf{a}_{rel} = (\ddot{\boldsymbol{\rho}})_B$ | Velocity and acceleration seen inside the turning frame |
| $\mathbf{v}_I = \mathbf{v}_{O'} + \mathbf{v}_{rel} + \boldsymbol{\omega} \times \boldsymbol{\rho}$ | Velocity rule |
| $\mathbf{a}_I = \mathbf{a}_{O'} + \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho}) + \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho}$ | Acceleration rule: relative, Coriolis, centrifugal, Euler |
| Factor 2 | $\boldsymbol{\omega} \times \mathbf{v}_{rel}$ arises twice in the derivation |
| $\|\boldsymbol{\omega}_E \times \mathbf{r}\|$ | $465\,\mathrm{m/s}$ (equator, surface); $502\,\mathrm{m/s}$ ($500\,\mathrm{km}$); $3075\,\mathrm{m/s}$ (GEO) |
| $\mathbf{v}^{I} = \mathbf{R}_{I \leftarrow E}(\mathbf{v}^{E} + \boldsymbol{\omega}^{E}_{E/I} \times \mathbf{r}^{E})$ | ECEF to ECI velocity: add the rotation term, then rotate the axes |
| $\sin\beta_i = \cos i / \cos\varphi$ | Inertial launch azimuth; the lowest direct inclination is the site latitude |
| $\mathbf{v}_{rel} = \mathbf{v}_I - \boldsymbol{\omega}_E \times \mathbf{r}$ | What the rocket must supply; Cape to $51.6^\circ$ saves $283\,\mathrm{m/s}$ |

Next lesson: the Coriolis, centrifugal and Euler terms one at a time, with numbers for vehicles moving over the Earth, assembled into the velocity equation an inertial navigation system steps forward.

::: context gnss-ecef Why GNSS speaks Earth-fixed
GPS, Galileo and the other navigation systems exist mostly to tell people where they are on the ground. So the receiver's natural output is a position and velocity in an Earth-fixed frame — the one in which a building's coordinates never change.

GPS in particular uses WGS-84, an Earth-fixed frame. A satellite that wants its inertial state must take that output and add the Earth's rotation itself — which is exactly the velocity rule in this lesson.
:::

::: context geocentric-latitude Two kinds of latitude
The Earth is slightly squashed: about $21\,\mathrm{km}$ wider across the equator than from pole to pole. So there are two ways to measure latitude. **Geocentric** latitude $\varphi'$ is the angle of the line from the Earth's center to you, above the equator plane. **Geodetic** latitude $\varphi$ — the one on maps — is the tilt of the local "straight down" direction, which is at right angles to the squashed surface.

The two differ by at most about $0.19^\circ$, near $45^\circ$ latitude. Lesson 6 treats this properly. For a distance from the spin axis, the geocentric angle is the one that fits: $r\cos\varphi'$.
:::

::: context geo-zero Parked in the sky
A geostationary satellite circles the Earth once per sidereal day, above the equator, in the same direction the Earth turns. So it keeps pace with the ground below and seems to hang still in the sky. That is why a satellite TV dish can be bolted in place and never move.

Its inertial speed is $\omega_E \times 42\,164\,\mathrm{km} \approx 3075\,\mathrm{m/s}$, and its speed relative to the ground is zero. It is the cleanest example there is of $\mathbf{v}_I = \mathbf{v}_{rel} + \boldsymbol{\omega}_E \times \mathbf{r}$ with $\mathbf{v}_{rel} = 0$.
:::

::: context inclination-meaning What inclination measures
An orbit is a flat loop through the Earth's center. Its **inclination** is how steeply that loop is tilted from the equator. An orbit that stays over the equator has $i = 0^\circ$. One that passes over both poles has $i = 90^\circ$. The International Space Station's orbit is at $51.6^\circ$, so it passes over every place between $51.6^\circ$ north and $51.6^\circ$ south.

The inclination is set by the *inertial* velocity, because the orbit plane is fixed in inertial space (apart from slow drifts). That is why the ground-relative velocity alone gives the wrong answer.
:::

::: context factor-two Two causes, one term
Imagine walking straight out from the center of a spinning merry-go-round.

First, the direction you are walking — "outward" — is itself turning with the ride. An arrow that turns needs a sideways push to keep turning; that gives one $\boldsymbol{\omega} \times \mathbf{v}_{rel}$.

Second, as you walk outward you reach spots that move faster, because they are farther from the center. To speed up sideways to match them you need another sideways push. That gives a second $\boldsymbol{\omega} \times \mathbf{v}_{rel}$.

The two pushes are the same size and the same direction, so together they are $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$. Leave either one out and you get half the right answer.
:::

::: context centripetal-picture Which way the centrifugal term points
Cut the Earth through its spin axis. A point at latitude $40^\circ$ is carried round a circle whose radius is its distance from the axis, $r_\perp$. Anything moving in a circle has an acceleration pointing to the circle's center — here, straight at the axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="110" r="90" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="8" x2="120" y2="212" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="126" y="18" font-size="12" fill="#6c7a93">spin axis ω</text>
  <line x1="30" y1="110" x2="210" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <text x="214" y="114" font-size="11" fill="#6c7a93">equator</text>
  <line x1="120" y1="110" x2="188.9" y2="52.1" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="160" y="96" font-size="12" fill="#1d6fd1">r</text>
  <path d="M 150 110 A 30 30 0 0 0 143 90.7" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="153" y="104" font-size="11" fill="#1f2a44">40°</text>
  <line x1="120" y1="52.1" x2="188.9" y2="52.1" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="3 3"/>
  <text x="140" y="46" font-size="11" fill="#1f2a44">r⊥</text>
  <circle cx="188.9" cy="52.1" r="4" fill="#1d6fd1"/>
  <line x1="188.9" y1="52.1" x2="158" y2="52.1" stroke="#b4232c" stroke-width="3"/>
  <polygon points="150,52.1 160,47 160,57.2" fill="#b4232c"/>
  <text x="222" y="60" font-size="12" fill="#b4232c">term in a_I:</text>
  <text x="222" y="76" font-size="12" fill="#b4232c">−ω² r⊥, toward axis</text>
  <line x1="196" y1="52.1" x2="214" y2="52.1" stroke="#f2b880" stroke-width="3"/>
  <text x="222" y="120" font-size="12" fill="#1f2a44">felt as a force:</text>
  <text x="222" y="136" font-size="12" fill="#1f2a44">outward (orange)</text>
</svg>
```

The red arrow is the acceleration an inertial observer sees; the short orange stub shows the outward "centrifugal force" a rider feels. Same size, opposite signs.
:::

::: context fictitious-force The push that is not there
Ride in a car turning left and you feel thrown to the right. Nothing shoves you. Your body is trying to go straight, and the car turns underneath you. From inside the car it *feels* like a force to the right; from the roadside it is just the car curving away while you carry on.

That is a fictitious force: an effect you must add to the equations if you insist on doing your bookkeeping inside a turning or accelerating frame. The Earth is such a frame, so weather forecasters, artillery crews and inertial navigation software all include these terms.
:::

::: context coriolis-direction North-moving, pushed east
A vehicle moves north in the northern hemisphere. The Coriolis *term* in $\mathbf{a}_I$, $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$, points west. Moved to the other side of Newton's law it flips, so the rider feels a push — and sees a drift — to the east, to the right of the direction of travel.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="150" x2="180" y2="50" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="180,38 174,52 186,52" fill="#1d6fd1"/>
  <text x="188" y="45" font-size="12" fill="#1d6fd1">v_rel (north)</text>
  <line x1="180" y1="100" x2="100" y2="100" stroke="#6c7a93" stroke-width="2.5" stroke-dasharray="6 4"/>
  <polygon points="90,100 102,94 102,106" fill="#6c7a93"/>
  <text x="20" y="90" font-size="12" fill="#6c7a93">term 2ω×v_rel: west</text>
  <line x1="180" y1="120" x2="260" y2="120" stroke="#b4232c" stroke-width="3"/>
  <polygon points="270,120 258,114 258,126" fill="#b4232c"/>
  <text x="200" y="142" font-size="12" fill="#b4232c">felt / deflection: east</text>
  <text x="30" y="160" font-size="11" fill="#1f2a44">N up, E right</text>
</svg>
```

In the southern hemisphere the vertical part of $\boldsymbol{\omega}$ reverses, and the drift is to the left instead.
:::

::: context plane-change-cost Why turning an orbit is so expensive
To tilt an orbit by an angle $\Delta i$ you must swing the whole velocity arrow sideways. With speed $v$ before and after, the arrow's tip moves along a chord of length $2v\sin(\Delta i/2)$ — and that chord is the speed change you must supply.

At low-orbit speed, $7.7\,\mathrm{km/s}$, even a $1^\circ$ change costs about $134\,\mathrm{m/s}$. That is why launch sites near the equator are prized for low-inclination orbits, and why a rocket launches straight into the plane it wants whenever it can.
:::

::: context azimuth-triangle The velocity triangle, drawn to scale
The orbit needs $\mathbf{v}_I$ (blue). The pad already has $v_{site}$, due east (orange). What the rocket must add is the red arrow, $\mathbf{v}_{rel} = \mathbf{v}_I - \mathbf{v}_{site}$. At full scale the orange arrow is tiny, so the box shows the tips enlarged eight times.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="200" x2="181.4" y2="58.6" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="181.4,58.6 179.0,66.0 174.0,61.0" fill="#1d6fd1"/>
  <line x1="40" y1="200" x2="170.8" y2="58.6" stroke="#b4232c" stroke-width="2"/>
  <polygon points="170.8,58.6 168.6,66.1 163.4,61.3" fill="#b4232c"/>
  <line x1="170.8" y1="58.6" x2="181.4" y2="58.6" stroke="#f2b880" stroke-width="3"/>
  <text x="112" y="160" font-size="12" fill="#1d6fd1">v_I 7669 m/s at 45.0°</text>
  <text x="135" y="90" font-size="11" fill="#b4232c" text-anchor="end">v_rel 7385 m/s, 42.8°</text>
  <rect x="210" y="24" width="144" height="92" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <text x="216" y="40" font-size="11" fill="#6c7a93">tips, ×8</text>
  <line x1="222.8" y1="99.4" x2="250" y2="70" stroke="#b4232c" stroke-width="2"/>
  <line x1="306.7" y1="98.3" x2="335" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="250" y1="70" x2="325" y2="70" stroke="#f2b880" stroke-width="3"/>
  <polygon points="335,70 323,64 323,76" fill="#f2b880"/>
  <text x="236" y="60" font-size="11" fill="#1f2a44">v_site 409 m/s east</text>
  <text x="30" y="30" font-size="11" fill="#1f2a44">N up, E right</text>
</svg>
```

Red plus orange equals blue. The red arrow points $2.2^\circ$ further north than the blue one: the rocket aims a little north because the Earth is already carrying it east.
:::

::: context vandenberg Why polar launches go from California
From Cape Canaveral a polar orbit means flying north or south along the crowded US east coast, over land and people. Vandenberg Space Force Base sits on a stretch of California coast that faces the open Pacific to the south, so rockets can head south toward the pole with only ocean below.

As the example shows, the Earth's spin does not help a polar launch at any site — it costs a little. So nothing is lost by choosing a site for safety instead.
:::

::: context lever-arm Where you put the accelerometer matters
An accelerometer measures the acceleration of the exact spot it is bolted to. If the spacecraft is turning, a spot two meters from the center of mass is being swung round in a small circle, and the sensor feels that on top of the vehicle's real motion.

Navigation software knows the offset $\boldsymbol{\rho}$ from the design drawings and the turning rate from the gyros. It computes $\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \boldsymbol{\rho}) + \dot{\boldsymbol{\omega}} \times \boldsymbol{\rho}$ and subtracts it, so the corrected reading describes the center of mass. The same correction is used for the offset between a GNSS antenna and the inertial unit.
:::
