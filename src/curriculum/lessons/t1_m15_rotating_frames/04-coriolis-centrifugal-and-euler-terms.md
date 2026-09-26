---
id: l04-coriolis-centrifugal-and-euler-terms
title: Coriolis, centrifugal and Euler terms
minutes: 22
covers:
  - Coriolis, centrifugal and Euler acceleration terms
---

Sit on a spinning merry-go-round and roll a ball straight toward a friend on the far side. From where you sit, the ball curves away and misses. Nobody pushed it. The ball went straight; you and your friend turned underneath it. If you insist on describing the ball from the ride, you have to invent sideways pushes to explain the curve.

The Earth is a very slow merry-go-round, and every vehicle over it is that ball. An **[[inertial navigation system|ins-meaning]]** (INS) — a box of accelerometers and gyros that works out where it is by adding up its own accelerations — keeps its answer in a frame fixed to the Earth, because the runway, the launch pad and the target are there. But the accelerometers obey Newton's law in inertial space. So before their readings can be added up in the Earth's frame, they must be corrected by the three terms that came out of the last lesson: **Coriolis**, **centrifugal** and **Euler**. Leave one out and the system drifts by kilometers per hour. Get a sign wrong and it drifts faster.

You can feel these terms, too. The centrifugal term is why sea-level gravity is weaker at the equator and why a geostationary satellite stays put. The Coriolis term is why a shell fired north lands east of its aim and why hurricanes spin the way they do. The Euler term is tiny for the Earth and unavoidable for a spinning spacecraft. This lesson takes the three apart one at a time, gives each a direction and a size, and then puts them together into the velocity equation an INS steps forward.

## The acceleration rule, written for the Earth

From the last lesson, take a point at position $\mathbf{r}$ from the Earth's center. An observer standing on the turning Earth sees it move with velocity $\mathbf{v}_{rel}$ and acceleration $\mathbf{a}_{rel}$ ("v rel", "a rel": relative to the Earth). Its acceleration in inertial space is

$$
\mathbf{a}_I = \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) + \dot{\boldsymbol{\omega}} \times \mathbf{r} .
$$

Here $\boldsymbol{\omega} = \boldsymbol{\omega}_{E/I}$ ("omega of E relative to I") is the Earth's **angular velocity** — its spin, as an arrow. The arrow points along the spin axis toward the north celestial pole, and its size is $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$. The dot in $\dot{\boldsymbol{\omega}}$ ("omega dot") means rate of change.

::: key The full rotating-frame acceleration
$\mathbf{a}_I = \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) + \dot{\boldsymbol{\omega}} \times \mathbf{r}$ — relative, Coriolis, centrifugal, and Euler (angular acceleration) terms.
:::

Newton's law says mass times $\mathbf{a}_I$ equals the real forces $\mathbf{F}$. The observer on the Earth measures $\mathbf{a}_{rel}$, so she moves everything else to the other side:

$$
m\,\mathbf{a}_{rel} = \mathbf{F} - 2m\,\boldsymbol{\omega} \times \mathbf{v}_{rel} - m\,\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) - m\,\dot{\boldsymbol{\omega}} \times \mathbf{r} .
$$

Keep both forms in view. The first has the **terms**, which you add to the relative acceleration to get the inertial one. The second has the **inertial forces** — each the negative of a term — which the Earth-bound observer adds to the real forces to explain what she sees. When someone says "the Coriolis acceleration points west", ask which form they mean. Half the sign arguments in this subject are two people using the two forms.

## The Earth's spin arrow in local axes

To put numbers on the terms for a vehicle, you need $\boldsymbol{\omega}$ in the same axes as the vehicle's velocity. Over the Earth those are the **north–east–down** (NED) axes, set up fully in lesson 06: $\hat{\mathbf{n}}$ points north along the ground, $\hat{\mathbf{e}}$ points east, and $\hat{\mathbf{d}}$ points straight down.

Stand at latitude $\varphi$ ("phi") and point at the North Star. Your arm tilts up from the horizon by exactly your latitude. The Earth's spin axis points the same way. So the [[spin arrow splits|spin-axis-split]] into a part along north, $\omega_E\cos\varphi$, and a part pointing up, $\omega_E\sin\varphi$. Up is $-\hat{\mathbf{d}}$, so in NED

$$
\boldsymbol{\omega}^{N} = \omega_E \begin{bmatrix} \cos\varphi \\ 0 \\ -\sin\varphi \end{bmatrix}.
$$

The superscript $N$ says "written in NED axes". Check the two ends. At the equator, $\varphi = 0$, the arrow lies flat along north. At the north pole, $\varphi = 90^\circ$, it points straight up. (Whether $\varphi$ here is geodetic or geocentric latitude is settled in lesson 06. The two differ by at most $0.19^\circ$, which changes nothing here at three significant figures.)

Now let the vehicle's velocity relative to the Earth be $\mathbf{v}^{N} = (v_N, v_E, v_D)$: its north, east and down parts. Write $c = \cos\varphi$ and $s = \sin\varphi$ to keep it short, and take the cross product one component at a time:

$$
\boldsymbol{\omega} \times \mathbf{v}_{rel} = \omega_E \begin{bmatrix} c \\ 0 \\ -s \end{bmatrix} \times \begin{bmatrix} v_N \\ v_E \\ v_D \end{bmatrix}
= \omega_E \begin{bmatrix} 0 \cdot v_D - (-s)\, v_E \\ (-s)\, v_N - c\, v_D \\ c\, v_E - 0 \cdot v_N \end{bmatrix}
= \omega_E \begin{bmatrix} s\, v_E \\ -s\, v_N - c\, v_D \\ c\, v_E \end{bmatrix}.
$$

Every Coriolis result over the Earth is read off this one line.

## The Coriolis term

$$
\mathbf{a}_{cor} = 2\boldsymbol{\omega} \times \mathbf{v}_{rel} .
$$

It is named after Gaspard-Gustave de Coriolis, who worked it out in the 1830s. Three facts follow from it being a cross product:

1. **It is sideways.** A cross product is perpendicular to both of its arrows. So the Coriolis term never speeds the vehicle up or slows it down relative to the Earth. It only bends the path. In physics words, the Coriolis force does no **work**.
2. **It can vanish.** It is zero when the body is at rest in the turning frame ($\mathbf{v}_{rel} = 0$). It is also zero when the relative velocity is parallel to the spin axis. A rocket climbing straight up from the north pole feels none of it.
3. **Its size** is $2\omega_E v_{rel}\sin\alpha$, where $\alpha$ ("alpha") is the angle between $\boldsymbol{\omega}$ and $\mathbf{v}_{rel}$.

::: key The Coriolis term
$\mathbf{a}_{cor} = 2\boldsymbol{\omega} \times \mathbf{v}_{rel}$. It is zero when the body is at rest in the rotating frame, or when its relative velocity is parallel to $\boldsymbol{\omega}$. It never changes the relative speed, only its direction.
:::

### Sideways: to the right in the north

For level flight, the horizontal part of $2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ has size $2\omega_E \sin\varphi\,\sqrt{v_N^2 + v_E^2}$. The factor $2\omega_E\sin\varphi$ is what weather forecasters call the **Coriolis parameter**. It is zero at the equator and $1.46 \times 10^{-4}\,\mathrm{s^{-1}}$ at the poles.

Now read directions off the component line. Remember the *force* is minus the term.

- **Flying north** ($v_N > 0$): the east part of the term is $-2\omega_E s\, v_N$, which is negative, so the term points west. The force points east.
- **Flying east** ($v_E > 0$): the north part of the term is $+2\omega_E s\, v_E$, so the term points north. The force points south.

Face north and east is on your right. Face east and south is on your right. In the northern hemisphere the Coriolis force always pushes to the right of the direction of travel. That is why air rushing into a low-pressure storm [[swirls counterclockwise|hurricane-spin]] up north. In the southern hemisphere $\sin\varphi < 0$, both signs flip, and the push is to the left.

### Up and down: the Eötvös effect

The down part of the term is $2\omega_E\cos\varphi\, v_E$ for eastward motion. So the force, $-2m\omega_E v_E\cos\varphi\,\hat{\mathbf{d}}$, points **up** when you travel east and **down** when you travel west. This is the **[[Eötvös effect|eotvos]]**. Going east, you are adding to the Earth's own spin, so you "swing out" a little harder and weigh a little less. A gravity meter carried east on a ship reads less than one carried west, and an INS that forgets this term gets its height channel wrong.

::: example An airliner heading east at 45° north
An airliner cruises due east at $250\,\mathrm{m/s}$ relative to the ground at $\varphi = 45^\circ$. In NED its velocity is $\mathbf{v}^{N} = (0, 250, 0)\,\mathrm{m/s}$, and $\sin 45^\circ = \cos 45^\circ = 0.7071$.

**Step 1 — use the component line.** With $v_N = v_D = 0$, only the $v_E$ entries survive: north part $s\,v_E$, east part $0$, down part $c\,v_E$. Multiply by $2\omega_E$:

$$
2\boldsymbol{\omega} \times \mathbf{v}_{rel} = 2 \times 7.292115 \times 10^{-5} \begin{bmatrix} 0.7071 \times 250 \\ 0 \\ 0.7071 \times 250 \end{bmatrix}
= \begin{bmatrix} 0.0258 \\ 0 \\ 0.0258 \end{bmatrix} \mathrm{m/s^2} .
$$

**Step 2 — flip for the force.** The Coriolis force per kilogram is the negative: $0.0258\,\mathrm{m/s^2}$ toward the south, and $0.0258\,\mathrm{m/s^2}$ upward (the Eötvös part). South is to the right of east — the rule holds.

**Step 3 — how far would it push?** If nothing corrected the heading, the southward push alone would move the plane $\tfrac{1}{2} a t^2 = \tfrac{1}{2} \times 0.0258 \times 3600^2 \approx 167\,\mathrm{km}$ in an hour.

**Sanity check.** Nobody sees airliners drift $167\,\mathrm{km}$ an hour, because the autopilot flies a track checked against satellite or radio fixes and trims the heading by a fraction of a degree. The effect is there; feedback cancels it. Inside the INS, though, the term is modeled at every step, because the INS has no fixes of its own between updates.
:::

::: example A long shot fired north
A shell leaves a gun at $\varphi = 45^\circ$, heading north at $800\,\mathrm{m/s}$, and flies for $60\,\mathrm{s}$. Treat the speed as constant.

**The push.** The east part of the term is $-2\omega_E \sin\varphi\, v_N$. Its size is

$$
2 \times 7.292115 \times 10^{-5} \times 0.7071 \times 800 = 0.0825\,\mathrm{m/s^2} .
$$

The term points west, so the force points east, at $0.0825\,\mathrm{m/s^2}$.

**The drift.** Starting from zero sideways speed, the shell drifts $\tfrac{1}{2} \times 0.0825 \times 60^2 \approx 149\,\mathrm{m}$ east over a range of $800 \times 60 = 48\,\mathrm{km}$. That is longer than a ship, which is why [[artillery firing tables|paris-gun]] have carried a Coriolis correction since the First World War.

**Scale it up.** An unguided body at $7\,000\,\mathrm{m/s}$ for $1\,800\,\mathrm{s}$ at the same latitude has a Coriolis acceleration of $0.722\,\mathrm{m/s^2}$. Added up the same naive way, that is a drift of about $10^3\,\mathrm{km}$. The naive sum is not valid over so long a flight — the velocity direction changes, and the term must be worked out together with gravity — but the size explains why a ballistic trajectory is always computed in an inertial frame and turned into the Earth frame at the end, never the other way round.
:::

## The centrifugal term

$$
\mathbf{a}_{cf} = \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) = -\omega^2\, \mathbf{r}_\perp .
$$

Here $\mathbf{r}_\perp$ ("r perp") is the part of $\mathbf{r}$ at right angles to the spin axis — the arrow from the axis straight out to the point. Its length is $r\cos\varphi'$, with $\varphi'$ ("phi prime") the geocentric latitude.

The picture: a point on the ground is carried round a circle whose center is on the spin axis. Anything moving in a circle accelerates toward the circle's center. So the *term* points toward the axis. The *force* the rider feels, $m\omega_E^2\mathbf{r}_\perp$, points away from the axis — the outward fling everyone expects, and the reason for the name ("centrifugal" is Latin for "fleeing the center").

::: note Why it has to be true
Use the "BAC minus CAB" rule for a double cross product: $\mathbf{u} \times (\mathbf{v} \times \mathbf{w}) = \mathbf{v}(\mathbf{u} \cdot \mathbf{w}) - \mathbf{w}(\mathbf{u} \cdot \mathbf{v})$. With $\mathbf{u} = \mathbf{v} = \boldsymbol{\omega}$ and $\mathbf{w} = \mathbf{r}$:

$$
\boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) = \boldsymbol{\omega}(\boldsymbol{\omega} \cdot \mathbf{r}) - \mathbf{r}(\boldsymbol{\omega} \cdot \boldsymbol{\omega}) = \boldsymbol{\omega}(\boldsymbol{\omega} \cdot \mathbf{r}) - \omega^2\,\mathbf{r} .
$$

Now split $\mathbf{r}$ into its part along the axis, $\hat{\boldsymbol{\omega}}(\hat{\boldsymbol{\omega}} \cdot \mathbf{r})$, and its part across the axis, $\mathbf{r}_\perp$. The first piece above equals $\omega^2$ times the along-axis part, so it cancels that part of $-\omega^2\mathbf{r}$ exactly. What is left is $-\omega^2\mathbf{r}_\perp$.
:::

It does not depend on velocity at all, so a rocket parked on the pad feels it. On the equator at the surface its size is

$$
\omega_E^2 R = (7.292115 \times 10^{-5})^2 \times 6.378137 \times 10^{6} = 0.0339\,\mathrm{m/s^2} ,
$$

about $0.35$ percent of $g_0 = 9.80665\,\mathrm{m/s^2}$. Away from the equator the distance to the axis shrinks by $\cos\varphi$, so the term does too: $0.0240\,\mathrm{m/s^2}$ at $45^\circ$, and zero at the poles.

::: key The centrifugal term
$\mathbf{a}_{cf} = \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) = -\omega^2\mathbf{r}_\perp$, toward the axis, independent of velocity. At the equator $\omega^2 R \approx (7.292 \times 10^{-5})^2 \times 6.378 \times 10^{6} \approx 0.0339\,\mathrm{m/s^2}$, about $0.35\%$ of $g$.
:::

### Gravity is not gravitation

Because the centrifugal term depends only on where you are, it is handy to fold it into the pull of the Earth once and for all. Engineers use two different words:

- **Gravitation**, $\mathbf{g}_{grav} = -\mu\,\mathbf{r}/r^3$ (plus small corrections), is Newton's pull toward the Earth's mass. $\mu$ ("mu") is the Earth's gravitational parameter.
- **Gravity**, $\mathbf{g}$, is gravitation with the centrifugal term folded in — what a plumb line hangs along and what an accelerometer sitting still on a table reads:

$$
\mathbf{g} = \mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) .
$$

Every geodetic gravity model, WGS-84's "normal gravity" included, is a model of $\mathbf{g}$, not $\mathbf{g}_{grav}$. People mix the words in conversation. An INS never can.

::: key Gravity versus gravitation
Gravity is gravitation minus the centrifugal term: $\mathbf{g} = \mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$.
:::

At the equator the centrifugal fling points straight up and weakens gravitation. In between it has a sideways part, so the [[plumb line tilts|plumb-tilt]] slightly toward the equator. At $45^\circ$ the sideways part is $0.0240 \times \sin 45^\circ = 0.0170\,\mathrm{m/s^2}$. Divide by the pull, about $9.79\,\mathrm{m/s^2}$, and take the arctangent: the tilt is $1.73 \times 10^{-3}\,\mathrm{rad}$, about 6 arcminutes. The "straight down" of a navigation frame is the direction of $\mathbf{g}$. The ellipsoid normal that defines NED is very nearly that direction, because the Earth's shape was squashed by the same spin.

The centrifugal term also explains most of how sea-level gravity changes with latitude. WGS-84 gives $9.7803253359\,\mathrm{m/s^2}$ on the equator and $9.8321849378\,\mathrm{m/s^2}$ at the poles, a difference of $0.0519\,\mathrm{m/s^2}$. Of that, $0.0339\,\mathrm{m/s^2}$ is the centrifugal term switching off between equator and pole. The other $0.018\,\mathrm{m/s^2}$ comes from the flattened shape: the equator is $21\,\mathrm{km}$ farther from the center, with extra mass under it.

## The Euler term

$$
\mathbf{a}_{eul} = \dot{\boldsymbol{\omega}} \times \mathbf{r} .
$$

This one appears only while the spin rate is *changing* — like the lurch you feel when a merry-go-round speeds up. It is named after Leonhard Euler.

**For the Earth it is negligible.** The length of the day wanders by about a millisecond over a year. That makes the fractional change of $\omega_E$ about $10^{-8}$ per day, so $\dot{\omega}_E \sim 10^{-17}\,\mathrm{rad/s^2}$. Times the Earth's radius, that is $10^{-10}\,\mathrm{m/s^2}$ — five powers of ten below what a navigation-grade accelerometer can sense. Every Earth-based INS drops it, and the Earth's acceleration rule has three terms, not four.

**For a spacecraft it is essential.** During a quick turn (a **slew**), reaction wheels might command $\dot{\omega} = 0.01\,\mathrm{rad/s^2}$. A sensor $2\,\mathrm{m}$ from the center of mass then feels $0.01 \times 2 = 0.02\,\mathrm{m/s^2}$ of Euler acceleration. That matches the centripetal term $\omega^2\rho$ (with $\rho$, "rho", the sensor's $2\,\mathrm{m}$ offset) at a body rate of $0.1\,\mathrm{rad/s}$: $0.1^2 \times 2 = 0.02\,\mathrm{m/s^2}$. During a stage separation or a thruster start, the angular acceleration can be tens of times larger. An IMU (inertial measurement unit, the accelerometer-and-gyro package) mounted away from the center of mass must have both terms removed — **lever-arm compensation** — using the gyro rates and their rate of change. The rate of change is the noisy part.

::: key The Euler term
$\dot{\boldsymbol{\omega}} \times \mathbf{r}$ is negligible for the Earth ($\dot{\omega}_E \sim 10^{-17}\,\mathrm{rad/s^2}$) and essential for a slewing spacecraft.
:::

## Putting them together: the INS velocity equation

Now make the terms work. An INS carries the vehicle's velocity relative to the Earth, $\mathbf{v}_e$, written in NED axes. Its accelerometers measure **[[specific force|specific-force]]** $\mathbf{f}$ — the inertial acceleration minus gravitation — so $\mathbf{a}_I = \mathbf{f} + \mathbf{g}_{grav}$.

**Step 1.** Put that into the acceleration rule, with $\dot{\boldsymbol{\omega}}_E = 0$, and solve for the Earth-frame rate of change of velocity:

$$
\left(\frac{d\mathbf{v}_e}{dt}\right)_E = \mathbf{f} + \mathbf{g}_{grav} - \boldsymbol{\omega}_{E/I} \times (\boldsymbol{\omega}_{E/I} \times \mathbf{r}) - 2\boldsymbol{\omega}_{E/I} \times \mathbf{v}_e
= \mathbf{f} + \mathbf{g} - 2\boldsymbol{\omega}_{E/I} \times \mathbf{v}_e .
$$

The centrifugal term has vanished into $\mathbf{g}$. That is why the INS gravity model must be a model of gravity, not gravitation.

**Step 2.** The NED frame $N$ is not the Earth frame. It turns relative to the Earth as the vehicle travels over the curved surface — fly north and "down" keeps tipping. That turning is the **transport rate** $\boldsymbol{\omega}_{N/E}$. One more use of the transport theorem switches to the NED-frame rate of change:

$$
\left(\frac{d\mathbf{v}_e}{dt}\right)_E = \left(\frac{d\mathbf{v}_e}{dt}\right)_N + \boldsymbol{\omega}_{N/E} \times \mathbf{v}_e .
$$

**Step 3.** Combine the two and write everything in NED. This is the equation an INS steps forward:

$$
\dot{\mathbf{v}}^{N}_e = \mathbf{f}^{N} - \left( 2\boldsymbol{\omega}^{N}_{E/I} + \boldsymbol{\omega}^{N}_{N/E} \right) \times \mathbf{v}^{N}_e + \mathbf{g}^{N} .
$$

Here $\mathbf{f}^{N} = \mathbf{R}_{N \leftarrow B}\,\mathbf{f}^{B}$ is the accelerometer output turned from body axes into NED using the attitude, and $\mathbf{g}^{N} \approx (0, 0, g)$ because down is positive. In code each carries its labels: `omega_ecef_wrt_eci_in_ned`, `omega_ned_wrt_ecef_in_ned`, `v_ecef_in_ned`.

**The transport rate.** Moving north at $v_N$ tips the vertical about the east axis. Moving east at $v_E$ tips it about the north axis, and also swings north about the vertical, because meridians crowd together toward the pole. With the two radii of curvature $M$ (north–south) and $N$ (east–west) from lesson 06, and height $h$:

$$
\boldsymbol{\omega}^{N}_{N/E} = \begin{bmatrix} \dfrac{v_E}{N + h} \\[6pt] -\dfrac{v_N}{M + h} \\[6pt] -\dfrac{v_E \tan\varphi}{N + h} \end{bmatrix}.
$$

For rough work $M \approx N \approx 6.371 \times 10^{6}\,\mathrm{m}$. Take the airliner from the first example: $v_E = 250\,\mathrm{m/s}$ at $h = 10\,\mathrm{km}$, where lesson 06 gives $N = 6.389 \times 10^{6}\,\mathrm{m}$. The first component is $250 / 6.399 \times 10^{6} = 3.9 \times 10^{-5}\,\mathrm{rad/s}$ — more than half the Earth's own spin rate. Crossed with the $250\,\mathrm{m/s}$ velocity, it gives an acceleration of about $0.01\,\mathrm{m/s^2}$, roughly a thousandth of $g$. Left out, that adds up to nearly $2\,\mathrm{km}$ of position error in ten minutes. The transport-rate term is not a refinement; it is the same order as the Coriolis term.

::: warning Every sign flips between the two forms
In $\mathbf{a}_I = \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$, the Coriolis term for northward flight in the northern hemisphere points west, and the centrifugal term points toward the axis. The inertial *forces* the Earth-bound observer adds to Newton's law are the negatives: Coriolis force east, centrifugal force away from the axis. Say which form you mean before you name a direction.
:::

::: warning Do not remove the centrifugal term twice
A stationary accelerometer, a plumb line and the WGS-84 normal gravity formula all describe $\mathbf{g} = \mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$, with the centrifugal term already inside. If an INS subtracts the centrifugal term by hand *and* uses a gravity model, the term is removed twice. That leaves a sideways error of up to $0.017\,\mathrm{m/s^2}$, which adds up to more than a kilometer in a few minutes. Decide where the term lives and put it there once.
:::

## Check yourself

::: check
A vehicle moves due south at $300\,\mathrm{m/s}$ relative to the ground at latitude $30^\circ$ south. Find the direction and size of the Coriolis force per kilogram, and say which way the vehicle is deflected.
:::

::: answer
**Set up.** In the south, latitude is negative: $\varphi = -30^\circ$, so $\sin\varphi = -0.5$. Moving south means $\mathbf{v}^{N} = (-300, 0, 0)\,\mathrm{m/s}$.

**The east part of the term.** $-2\omega_E \sin\varphi\, v_N = -2 \times 7.292115 \times 10^{-5} \times (-0.5) \times (-300) = -0.0219\,\mathrm{m/s^2}$. Negative east means the term points west.

**The force** is the negative: $0.0219\,\mathrm{m/s^2}$ toward the east. A vehicle facing south has east on its *left*. So in the southern hemisphere the Coriolis deflection is to the left — the mirror image of the northern rule. There is no vertical part, because $v_E = 0$.
:::

::: check
A geostationary satellite sits still in the Earth-fixed frame. Use the rotating-frame equation of motion to find its orbital radius, with $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$ and $\omega_E$.
:::

::: answer
**Sitting still** means $\mathbf{v}_{rel} = 0$ and $\mathbf{a}_{rel} = 0$. So the Coriolis term is zero, and with $\dot{\boldsymbol{\omega}}_E = 0$ the equation shrinks to $0 = \mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$: gravitation exactly balances the centrifugal force.

**In the equator's plane** $\mathbf{r}_\perp = \mathbf{r}$, so the sizes must match: $\mu / r^2 = \omega_E^2 r$. Multiply both sides by $r^2$ and divide by $\omega_E^2$ to get $r^3 = \mu/\omega_E^2$:

$$
r = \left(\frac{\mu}{\omega_E^2}\right)^{1/3} = \left(\frac{3.986004418 \times 10^{14}}{(7.292115 \times 10^{-5})^2}\right)^{1/3} = 4.216 \times 10^{7}\,\mathrm{m} .
$$

That is $42\,164\,\mathrm{km}$ from the center, or $35\,786\,\mathrm{km}$ above the equator. Off the equator's plane, $\mathbf{r}_\perp$ and $\mathbf{r}$ point in different directions, so gravitation (along $\mathbf{r}$) and the centrifugal force (along $\mathbf{r}_\perp$) cannot cancel. That is why a geostationary orbit must be over the equator.
:::

::: check
Why does an INS need a gravity model rather than a gravitation model? What goes wrong if the two are confused at $45^\circ$ latitude?
:::

::: answer
The accelerometers measure specific force, $\mathbf{f} = \mathbf{a}_I - \mathbf{g}_{grav}$. Rewriting $\mathbf{a}_I$ in the Earth frame brings in the centrifugal term, and $\mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$ is by definition gravity $\mathbf{g}$. So the natural equation adds $\mathbf{g}$, and the centrifugal term never shows up on its own.

Use a gravitation model instead and the centrifugal term goes missing. The error is $\omega_E^2 R\cos\varphi = 0.024\,\mathrm{m/s^2}$ at $45^\circ$, of which $0.017\,\mathrm{m/s^2}$ is horizontal. Over ten minutes ($600\,\mathrm{s}$) the horizontal part builds a velocity error of $0.017 \times 600 \approx 10\,\mathrm{m/s}$ and a position error of $\tfrac{1}{2} \times 0.017 \times 600^2 \approx 3\,\mathrm{km}$, growing with the square of time.
:::

::: check
A [[Foucault pendulum|foucault]]'s swing plane slowly turns relative to the floor. Using the vertical part of $\boldsymbol{\omega}^{N}$, argue that the turn rate is $\omega_E \sin\varphi$, and find how long one full turn takes at $\varphi = 48.85^\circ$ (Paris).
:::

::: answer
**Only the vertical part matters.** The bob swings almost level. A level velocity crossed with the *vertical* part of $\boldsymbol{\omega}$, which is $-\omega_E \sin\varphi\, \hat{\mathbf{d}}$, gives a level sideways push that turns the swing direction. The *horizontal* part of $\boldsymbol{\omega}$ gives an up-or-down push, which the string tension soaks up.

**So the plane turns at $\omega_E\sin\varphi$.** A level platform turning at $\omega_E \sin\varphi$ about the vertical would see no Coriolis turning at all. The swing plane holds its direction in that sense, so it appears to turn at $\omega_E \sin\varphi$ relative to the floor — clockwise seen from above in the north.

**The period.** One full turn takes $T = 2\pi / (\omega_E \sin\varphi)$. Since $2\pi/\omega_E \approx 86\,164\,\mathrm{s}$, $T = 86\,164 / \sin 48.85^\circ = 86\,164 / 0.7530 = 1.144 \times 10^{5}\,\mathrm{s}$, about $31.8$ hours. At the pole it would be one sidereal day; at the equator the plane never turns.
:::

::: check
A stone is dropped from rest from a height of $h = 100\,\mathrm{m}$ at the equator. Ignoring air, which way is it deflected, and by how much?
:::

::: answer
**The term.** At the equator $\boldsymbol{\omega}^{N} = \omega_E(1, 0, 0)$. Falling, the velocity is $\mathbf{v}^{N} = (0, 0, g t)$ — downward, growing with time $t$. From the component line with $s = 0$, $c = 1$: $\boldsymbol{\omega} \times \mathbf{v}_{rel} = (0, -\omega_E g t, 0)$. The force per kilogram is $-2\boldsymbol{\omega} \times \mathbf{v}_{rel} = (0, 2\omega_E g t, 0)$: east.

**Add it up twice.** The sideways speed is $\omega_E g t^2$, and the sideways distance is $\omega_E g t^3 / 3$.

**The fall time.** $t = \sqrt{2h/g} = \sqrt{200 / 9.80665} = 4.516\,\mathrm{s}$. So

$$
\Delta y = \frac{7.292115 \times 10^{-5} \times 9.80665 \times 4.516^3}{3} = 0.022\,\mathrm{m} ,
$$

about $2.2\,\mathrm{cm}$ east. The [[picture|tower-drop]]: the top of the tower is farther from the axis than the base, so it moves east a bit faster, and the stone keeps that extra speed as it falls. At $45^\circ$ the result scales by $\cos\varphi$ to about $1.6\,\mathrm{cm}$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{a}_I = \mathbf{a}_{rel} + 2\boldsymbol{\omega} \times \mathbf{v}_{rel} + \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) + \dot{\boldsymbol{\omega}} \times \mathbf{r}$ | Relative, Coriolis, centrifugal, Euler; the forces are the negatives |
| $\boldsymbol{\omega}^{N} = \omega_E(\cos\varphi, 0, -\sin\varphi)$ | Earth's spin arrow in NED at latitude $\varphi$ |
| $\boldsymbol{\omega} \times \mathbf{v}_{rel} = \omega_E(s\,v_E,\; -s\,v_N - c\,v_D,\; c\,v_E)$ | Building block for every Coriolis result over the Earth |
| $\mathbf{a}_{cor} = 2\boldsymbol{\omega} \times \mathbf{v}_{rel}$ | Coriolis term; zero at rest or for $\mathbf{v}_{rel} \parallel \boldsymbol{\omega}$; does no work |
| $2\omega_E \sin\varphi$ | Coriolis parameter; force to the right of motion in the north, left in the south |
| $2\omega_E \cos\varphi\, v_E$ | Eötvös effect: vertical Coriolis from east–west motion |
| $\mathbf{a}_{cf} = \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r}) = -\omega^2\mathbf{r}_\perp$ | Centrifugal term, toward the axis; $0.0339\,\mathrm{m/s^2}$ at the equator, $0.35\%$ of $g$ |
| $\mathbf{g} = \mathbf{g}_{grav} - \boldsymbol{\omega} \times (\boldsymbol{\omega} \times \mathbf{r})$ | Gravity (plumb line) versus gravitation; about 6′ of tilt at $45^\circ$ |
| $\mathbf{a}_{eul} = \dot{\boldsymbol{\omega}} \times \mathbf{r}$ | Euler term; $\sim 10^{-10}\,\mathrm{m/s^2}$ for the Earth, $\sim 10^{-2}\,\mathrm{m/s^2}$ for a slewing spacecraft |
| $\dot{\mathbf{v}}^{N}_e = \mathbf{f}^{N} - (2\boldsymbol{\omega}^{N}_{E/I} + \boldsymbol{\omega}^{N}_{N/E}) \times \mathbf{v}^{N}_e + \mathbf{g}^{N}$ | INS velocity equation in NED |
| $\boldsymbol{\omega}^{N}_{N/E} = \left(\frac{v_E}{N+h}, -\frac{v_N}{M+h}, -\frac{v_E\tan\varphi}{N+h}\right)$ | Transport rate; comparable to $\omega_E$ for an airliner |

Next lesson: the two frames these terms connect — the Earth-centered inertial frame where Newton's law holds, and the Earth-fixed frame that turns at $\omega_E$ — and the rotation between them, built from the Earth rotation angle.

::: context ins-meaning A navigator that never looks outside
An inertial navigation system is a sealed box with three accelerometers and three gyros. The gyros track which way the box is pointing. The accelerometers feel every push. The computer adds up the pushes to get velocity, and adds up velocity to get position — with no radio, no stars and no GPS.

Because it adds things up, every small error keeps growing. A tiny bias of $0.001\,\mathrm{m/s^2}$ becomes $\tfrac{1}{2} \times 0.001 \times 3600^2 \approx 6.5\,\mathrm{km}$ after an hour. That is why every term in this lesson, even ones that look small, has to be right. Rockets, airliners, submarines and missiles all carry one.
:::

::: context spin-axis-split Splitting the spin arrow
Side view of the Earth, cut through the poles. At latitude $\varphi$ the local "north" and "up" arrows are drawn at the surface. The spin arrow $\boldsymbol{\omega}$, moved to that spot, tilts up from north by the angle $\varphi$ — the same angle your arm makes pointing at the North Star.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="110" r="80" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="110" y1="14" x2="110" y2="200" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <polygon points="110,10 105,22 115,22" fill="#6c7a93"/>
  <text x="118" y="20" font-size="11" fill="#6c7a93">spin axis</text>
  <line x1="30" y1="110" x2="190" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="110" y1="110" x2="171.3" y2="58.6" stroke="#6c7a93" stroke-width="1"/>
  <path d="M 140 110 A 30 30 0 0 0 133 90.7" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="143" y="104" font-size="11" fill="#1f2a44">φ</text>
  <circle cx="171.3" cy="58.6" r="3.5" fill="#1f2a44"/>
  <line x1="171.3" y1="58.6" x2="235.6" y2="4.6" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="238" y="14" font-size="11" fill="#1f2a44">up</text>
  <line x1="171.3" y1="58.6" x2="125.3" y2="4.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="96" y="46" font-size="11" fill="#1f2a44">north</text>
  <line x1="171.3" y1="58.6" x2="171.3" y2="4" stroke="#b4232c" stroke-width="3"/>
  <polygon points="171.3,2 166.3,14 176.3,14" fill="#b4232c"/>
  <text x="178" y="40" font-size="12" fill="#b4232c">ω</text>
  <text x="222" y="120" font-size="12" fill="#1f2a44">along north: ω cos φ</text>
  <text x="222" y="140" font-size="12" fill="#1f2a44">along up: ω sin φ</text>
  <text x="222" y="170" font-size="11" fill="#6c7a93">drawn at φ = 40°</text>
</svg>
```

The red arrow is parallel to the axis. The angle between it and "north" is $\varphi$, and the angle between it and "up" is $90^\circ - \varphi$. Projecting gives the two parts.
:::

::: context hurricane-spin Why storms spin the way they do
A hurricane is a patch of low pressure. Air all around rushes inward toward it. In the northern hemisphere, the Coriolis force bends each stream of air to its right. Air coming from the south bends east, air from the north bends west, and so on. Together they miss the center on the same side and set up a counterclockwise swirl, seen from above. In the southern hemisphere the bend is to the left and cyclones turn clockwise.

The Coriolis parameter is zero at the equator, which is why hurricanes almost never form within about $5^\circ$ of it. And no, a bathtub is far too small and slow for the Coriolis force to decide which way it drains.
:::

::: context eotvos The ship that weighed less going east
The vertical Coriolis effect is named after the Hungarian physicist Loránd Eötvös. In the early 1900s, gravity measured on ships came out slightly different depending on which way the ship was sailing. Eötvös explained why: sailing east adds to the Earth's spin, so the ship swings round the axis a little faster and is flung outward a little harder. Sailing west does the opposite.

At $10\,\mathrm{m/s}$ eastward on the equator the change is $2 \times 7.29 \times 10^{-5} \times 10 \approx 1.5 \times 10^{-3}\,\mathrm{m/s^2}$ — small, but far larger than what a marine gravity meter must resolve. Airborne gravity surveys correct for it on every flight.
:::

::: context paris-gun The gun that had to aim for the spin
In 1918 Germany shelled Paris from about $120\,\mathrm{km}$ away with a huge cannon now called the Paris Gun. Its shells climbed into the upper atmosphere and flew for about three minutes. Over a flight that long the Earth turns enough under the shell to throw it far off target, so the gunners' calculations had to include the Earth's rotation. It is often cited as one of the first weapons where that correction really mattered.

Long-range artillery tables still carry a correction that depends on the firing direction and the latitude, exactly as the example does.
:::

::: context plumb-tilt Why the plumb line leans
At latitude $\varphi$, gravitation pulls toward the Earth's center (blue). The centrifugal fling pushes straight out from the spin axis (orange), not straight up. Add them and the result, gravity (red), leans slightly toward the equator. The orange arrow is drawn hundreds of times too long so you can see it; the real lean at $45^\circ$ is about 6 arcminutes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="8" x2="80" y2="196" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <text x="86" y="18" font-size="11" fill="#6c7a93">spin axis</text>
  <line x1="80" y1="180" x2="340" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <text x="250" y="194" font-size="11" fill="#6c7a93">equator plane</text>
  <circle cx="80" cy="180" r="3.5" fill="#1f2a44"/>
  <text x="88" y="194" font-size="11" fill="#1f2a44">center</text>
  <line x1="200" y1="60" x2="80" y2="180" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="200" y1="60" x2="128" y2="132" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="122.2,137.8 127.2,125.8 134.2,132.8" fill="#1d6fd1"/>
  <text x="60" y="118" font-size="12" fill="#1d6fd1">gravitation</text>
  <line x1="200" y1="60" x2="236" y2="60" stroke="#f2b880" stroke-width="3"/>
  <polygon points="246,60 234,54 234,66" fill="#f2b880"/>
  <text x="252" y="64" font-size="12" fill="#1f2a44">centrifugal</text>
  <line x1="122.2" y1="137.8" x2="162.2" y2="137.8" stroke="#f2b880" stroke-width="1.5" stroke-dasharray="3 3"/>
  <line x1="200" y1="60" x2="167.4" y2="127" stroke="#b4232c" stroke-width="3"/>
  <polygon points="162.2,137.8 162.9,124.8 171.9,129.2" fill="#b4232c"/>
  <text x="182" y="112" font-size="12" fill="#b4232c">gravity g</text>
  <circle cx="200" cy="60" r="4" fill="#1f2a44"/>
  <text x="208" y="40" font-size="11" fill="#1f2a44">you, at 45°</text>
</svg>
```

The dashed orange line shows the centrifugal arrow moved to the tip of the blue one; red is the sum. It points a little farther from the axis than the line to the center does.
:::

::: context specific-force What an accelerometer really feels
An accelerometer is a small weight on a spring. It cannot feel gravitation, because gravitation pulls the weight and the case equally. It feels only the other pushes: the table under it, the engine thrust, the air. That is **specific force** — force per kilogram, not counting gravitation.

So a phone lying still on a table reads about $9.8\,\mathrm{m/s^2}$ *upward*: the table's push. And an astronaut's accelerometer in orbit reads nearly zero, though she is falling around the Earth. The navigation computer adds gravitation back in from a model, which is why the model has to be the right one.
:::

::: context foucault A pendulum under a dome
In 1851 Léon Foucault hung a $28\,\mathrm{kg}$ ball on a $67\,\mathrm{m}$ wire from the dome of the Panthéon in Paris. Visitors watched the swing slowly turn clockwise through the day. It was the first simple, direct demonstration that the Earth spins — no telescopes needed.

The swing plane does not really turn. It keeps its direction, as nearly as it can, while the floor turns underneath it at $\omega_E\sin\varphi$. In Paris one full turn takes about $31.8$ hours; at the North Pole it would take one sidereal day.
:::

::: context tower-drop Why a dropped stone lands east
The top of a tower is farther from the spin axis than its foot, so the Earth carries it east a little faster. A stone let go at the top keeps that extra eastward speed. As it falls, the ground under it lags behind, and the stone lands slightly east of the spot straight below.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <rect x="140" y="30" width="30" height="130" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="175" y1="40" x2="245" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="255,40 243,34 243,46" fill="#1d6fd1"/>
  <text x="262" y="44" font-size="11" fill="#1d6fd1">top: faster east</text>
  <line x1="175" y1="150" x2="225" y2="150" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="235,150 223,144 223,156" fill="#1d6fd1"/>
  <text x="240" y="146" font-size="11" fill="#1d6fd1">foot: slower</text>
  <circle cx="155" cy="24" r="5" fill="#b4232c"/>
  <path d="M 155 30 Q 157 100 166 158" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="166" cy="158" r="4" fill="#b4232c"/>
  <text x="30" y="100" font-size="11" fill="#1f2a44">100 m</text>
  <text x="30" y="176" font-size="11" fill="#6c7a93">west</text>
  <text x="310" y="176" font-size="11" fill="#6c7a93">east</text>
</svg>
```

At the equator from $100\,\mathrm{m}$ the shift is only about $2\,\mathrm{cm}$ — the drawing exaggerates it hugely — but careful drops down mine shafts in the 1800s measured shifts of this kind.
:::
