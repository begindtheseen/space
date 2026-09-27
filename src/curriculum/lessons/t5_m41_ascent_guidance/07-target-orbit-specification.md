---
id: l07-target-orbit-specification
title: Target orbit specification and the terminal constraint set
minutes: 19
covers:
  - Target orbit specification and the terminal constraint set
---

Think about merging onto a highway. To join the traffic you need three things. You need to be in the right lane. You need to be going the right speed. And you need to be pointed along the road, not across it. What you do *not* need is to merge at one exact lamppost. Anywhere along the on-ramp's end will do. Once you are in the lane at the right speed and heading, you are on the highway.

Putting a satellite into orbit works the same way. Guidance does not steer to "a point in the sky". It steers to be moving on the right path, at the right speed, in the right direction — and it is happy to arrive anywhere along that path.

Every guidance example so far in this module has quietly assumed that guidance knows what "the target orbit" means in numbers a steering solve can use. This lesson makes that explicit. We turn an orbit — an ellipse with a size, a shape and a tilt — into the handful of **terminal conditions** (the conditions the rocket must meet at engine cutoff) that Powered Explicit Guidance, PEG, and the Saturn V's Iterative Guidance Mode actually aim for. One number is left out on purpose. It is the same number the linear tangent derivation in lesson 3 found it had to leave free, reached here from a completely different direction.

## Six numbers describe a moment; five describe an orbit

Start with what fixes a satellite's motion completely. At any instant it has a position (three numbers: $x$, $y$, $z$) and a velocity (three more). Together these six numbers are its **[[state vector|state-vector]]** — a full snapshot of where it is and how it is moving. Give a computer the state vector and Newton's laws, and it can work out the whole future path.

An **orbit** is something smaller than that. It is the whole path — the ellipse (or circle) the satellite traces over and over — not the satellite's spot on it right now. Describing the path takes one fewer number. The standard set is called the **[[orbital elements|orbital-elements]]**:

- **Size** — the **semi-major axis** $a$, half the long width of the ellipse.
- **Shape** — the **eccentricity** $e$, how stretched the ellipse is: $0$ for a circle, closer to $1$ for a long thin oval.
- **Tilt of the plane** — the **inclination** $i$, the angle between the orbit's plane and Earth's equator.
- **Swing of the plane** — the **[[right ascension of the ascending node|node]]** $\Omega$ (read "capital omega"), which says where around the equator the orbit crosses it going north.
- **Direction the ellipse points within its plane** — the **argument of periapsis** $\omega$ (read "little omega"), the angle from that northward crossing to the orbit's lowest point, the **periapsis** (called **perigee** for Earth orbits; the highest point is the **apoapsis**, or **apogee**).

That is five. The sixth number a state vector carries — *where along the ellipse the satellite happens to be at this instant* — is not a property of the orbit at all. It belongs to the moment. And it is exactly the number guidance does not need to hit.

::: key
An orbit is fully specified by five quantities — size and shape, the orientation of its plane, and the orientation of the ellipse within that plane — not six. The sixth, where along the orbit the vehicle happens to be, is a property of the moment, not the destination. It is the natural thing for a terminal guidance constraint to leave unconstrained.
:::

## The form guidance actually uses

Guidance does not consume the five orbital elements directly. It works with quantities it can measure at cutoff and plug straight into its steering solve:

- the **terminal radius** $r$ — distance from Earth's center when the engine stops;
- the **terminal speed** $v$;
- the **terminal [[flight-path angle|flight-path-angle]]** $\gamma$ (read "gamma") — how far the velocity points above the local horizontal;
- the **target plane**, given by inclination $i$ and node $\Omega$.

These are five numbers. They connect to the ellipse through relations from the two-body module. First, the **specific orbital energy** $\varepsilon$ (read "epsilon"), the energy per kilogram, from the **[[vis-viva|vis-viva]]** idea that speed and distance together fix the energy:

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}, \qquad a = -\frac{\mu}{2\varepsilon}.
$$

Here $\mu = 3.986 \times 10^{14}\ \mathrm{m^3/s^2}$ is Earth's gravity constant. The first term is kinetic energy per kilogram; the second is gravitational energy per kilogram. A bound orbit has negative total energy, so $a$ comes out positive.

Second, the **specific angular momentum** $h$ — how much "spin" the orbit has per kilogram. Only the sideways part of the velocity counts, and that part is $v\cos\gamma$:

$$
h = r v\cos\gamma, \qquad e = \sqrt{1 + \frac{2\varepsilon h^2}{\mu^2}}.
$$

So radius and speed fix the size. Angular momentum, together with energy, fixes the shape. And $i$ and $\Omega$ fix the plane directly.

::: note Why it has to be true
Where does $e = \sqrt{1 + 2\varepsilon h^2/\mu^2}$ come from? Check it at perigee, where the velocity is purely sideways. There the radius is $r_p = a(1-e)$, and the two-body module showed $h^2 = \mu a (1 - e^2)$. Rearranging, $1 - e^2 = h^2/(\mu a)$.

Now replace $a$ using the energy: $a = -\mu/(2\varepsilon)$, so $1/a = -2\varepsilon/\mu$. Then

$$
1 - e^2 = \frac{h^2}{\mu}\cdot\left(-\frac{2\varepsilon}{\mu}\right) = -\frac{2\varepsilon h^2}{\mu^2}
\quad\Longrightarrow\quad
e^2 = 1 + \frac{2\varepsilon h^2}{\mu^2}.
$$

Energy and angular momentum stay the same all the way around the orbit, so the formula works with $r$, $v$, $\gamma$ measured at *any* point, not only perigee. Since $\varepsilon < 0$ for a closed orbit, the square root is less than $1$, as an ellipse needs.
:::

### What the five numbers pin down, and what they leave free

Count carefully. The target $(r, v, \gamma, i, \Omega)$ fixes the size $a$, the shape $e$, and the plane $(i, \Omega)$. That is four orbital properties. The fifth number does something slightly different: $r$ and $\gamma$ together also say *which part* of the ellipse cutoff happens on — near perigee, near apogee, or in between. (On the way up from perigee, $\gamma$ is positive; at the two apses it is zero.)

What is left free is the angle, measured around the orbit plane from the northward equator crossing, at which cutoff happens. That angle is the **[[argument of latitude|argument-of-latitude]]**, $u$. Leaving $u$ free means the ellipse's in-plane direction $\omega$ comes out wherever the cutoff point happens to put it. For a near-circular parking orbit, nobody minds.

This freedom is the same one lesson 3 used. There, the final downrange position $x(t_f)$ was left free, so by **[[transversality|transversality-bridge]]** its costate was zero all the way, and that is what made $\tan\beta = A + Bt$ exact. "Leave the downrange coordinate free" in flat-Earth optimal control and "leave the argument of latitude free" in orbital mechanics are the same statement in two vocabularies.

::: key How a target orbit is specified to guidance
Usually as terminal radius $r$, terminal speed $v$, flight-path angle $\gamma$ and orbital plane (inclination $i$ and node $\Omega$), rather than as six Cartesian components. That leaves the unconstrained terminal argument of latitude free, which is what gives guidance the freedom to be efficient — the same freedom that gives the linear tangent law its closed form.
:::

::: example The same orbit, targeted at two different points
Take a $300\ \mathrm{km} \times 400\ \mathrm{km}$ parking orbit around an Earth of radius $6378.137\ \mathrm{km}$.

**Size and shape.** Perigee radius $r_p = 6378.137 + 300 = 6678.137\ \mathrm{km}$. Apogee radius $r_a = 6778.137\ \mathrm{km}$. The semi-major axis is their average:

$$
a = \frac{6678.137 + 6778.137}{2} = 6728.137\ \mathrm{km}, \qquad
e = \frac{r_a - r_p}{r_a + r_p} = \frac{100}{13\,456.274} = 0.007431.
$$

**Target 1: cutoff at perigee.** At perigee $\gamma = 0$. Vis-viva gives the speed:

$$
v = \sqrt{\mu\left(\frac{2}{r_p} - \frac{1}{a}\right)} = 7754.414\ \mathrm{m/s}.
$$

So the triple $(r, v, \gamma) = (6678.137\ \mathrm{km},\ 7754.414\ \mathrm{m/s},\ 0^\circ)$ pins down this ellipse.

**Target 2: cutoff halfway up.** Now aim at $r = 6728.137\ \mathrm{km}$ (350 km altitude, the midpoint). The angular momentum does not change around the orbit, so compute it once:

$$
h = \sqrt{\mu a (1 - e^2)} = 5.1785 \times 10^{10}\ \mathrm{m^2/s}.
$$

The sideways speed there is $v_t = h/r = 7696.787\ \mathrm{m/s}$. Vis-viva gives the total speed, $v = \sqrt{\mu(2/r - 1/a)} = 7697.000\ \mathrm{m/s}$. The leftover is the climbing speed:

$$
v_r = \sqrt{v^2 - v_t^2} = 57.200\ \mathrm{m/s}, \qquad
\gamma = \arctan\frac{v_r}{v_t} = 0.4258^\circ.
$$

**The point.** Two different triples — $(6678.137\ \mathrm{km},\ 7754.414\ \mathrm{m/s},\ 0^\circ)$ and $(6728.137\ \mathrm{km},\ 7697.000\ \mathrm{m/s},\ 0.4258^\circ)$ — describe the identical ellipse.

**Sanity check.** Speed is lower at the higher point, as it should be: a satellite slows as it climbs. And $\gamma$ is tiny, because a nearly round orbit barely climbs at all.
:::

## The easy case: a circular target

A circle removes one more subtlety. With $e = 0$, the orbit has no lowest point, so there is no periapsis direction to be free *about*. The radius never changes, so the flight-path angle is zero at *every* point, not only at two apses. The target collapses to one triple:

$$
(r, v, \gamma) = \left(r_{\text{target}},\ v_{\text{circ}}(r_{\text{target}}),\ 0\right), \qquad v_{\text{circ}} = \sqrt{\frac{\mu}{r}}.
$$

It holds wherever along the circle cutoff lands.

::: example The module's own target, checked
The PEG lesson flew stage 2 to $r_{\text{target}} = R_E + 400\ \mathrm{km} = 6778.137\ \mathrm{km}$.

**Speed.** $v_{\text{circ}} = \sqrt{3.986004 \times 10^{14} / 6.778137 \times 10^{6}} = 7668.558\ \mathrm{m/s}$, with $\gamma = 0$.

**Energy.** $\varepsilon = \tfrac12(7668.558)^2 - \mu/r = 29.403 \times 10^6 - 58.807 \times 10^6 = -29.403 \times 10^6\ \mathrm{J/kg}$. Then $a = -\mu/(2\varepsilon) = 6778.1\ \mathrm{km}$, the same as $r$.

**Shape.** Put $h = rv$ into the eccentricity formula and the square root comes out as zero, up to rounding.

**Sanity check.** For a circle, kinetic energy per kilogram is exactly half the size of the gravitational term, which is what makes $\varepsilon = -\mu/(2r)$. That is the simplest instance of the general terminal constraint set, not a special algorithm.
:::

## The plane, and what the launch site can reach

Inclination and node cannot be picked freely either. The reason is geometry, and it is settled before guidance ever runs.

Picture the orbit plane as a giant hula hoop centered on Earth's center. The launch pad must sit on that hoop at liftoff, because the rocket starts there. A hoop tilted at inclination $i$ reaches as far north as latitude $i$ and no farther. So a pad at latitude $\phi$ (read "phi") can only sit on hoops tilted at least as steeply as $\phi$. A direct ascent — one with no **plane-change** burn (a sideways burn to swing the plane) — cannot reach an inclination below the launch latitude.

The heading the rocket takes off in sets the tilt. Measure the **launch azimuth** $A_z$ clockwise from north ($90^\circ$ is due east). Then

$$
\cos i = \cos\phi\,\sin A_z.
$$

::: note Why it has to be true
Put Earth's center at the origin with the $z$ axis through the North Pole. The pad's direction is $\hat{\mathbf r} = (\cos\phi,\ 0,\ \sin\phi)$. At the pad, "east" is $\hat{\mathbf e} = (0, 1, 0)$ and "north" is $\hat{\mathbf n} = (-\sin\phi,\ 0,\ \cos\phi)$. A heading of azimuth $A_z$ is $\hat{\mathbf v} = \hat{\mathbf n}\cos A_z + \hat{\mathbf e}\sin A_z$.

The orbit's spin axis points along $\hat{\mathbf r} \times \hat{\mathbf v}$, and the inclination is the angle between that axis and the $z$ axis, so $\cos i$ is its $z$ component. Work out the two cross products:

$$
\hat{\mathbf r} \times \hat{\mathbf e} = (-\sin\phi,\ 0,\ \cos\phi), \qquad
\hat{\mathbf r} \times \hat{\mathbf n} = (0,\ -1,\ 0).
$$

The first has $z$ component $\cos\phi$; the second has none. So $\cos i = \cos\phi\sin A_z$. Because $\sin A_z \le 1$, $\cos i \le \cos\phi$, which means $i \ge \phi$.
:::

The node $\Omega$ is set a different way: by the clock. Earth turns under the hoop, so the pad passes through a given plane only at certain moments each day. Choosing the plane's swing means choosing the **[[launch window|launch-window]]**.

::: example What azimuth reaches a given inclination
A launch site sits at $\phi = 28.5^\circ$ N.

**Due east.** $A_z = 90^\circ$, so $\sin A_z = 1$ and $\cos i = \cos 28.5^\circ$. That gives $i = 28.5^\circ$ — the lowest inclination this site can reach without a plane-change burn, however guidance steers.

**A $51.6^\circ$ target** (the **[[inclination of the International Space Station|iss-inclination]]**). Solve for $\sin A_z$:

$$
\sin A_z = \frac{\cos 51.6^\circ}{\cos 28.5^\circ} = \frac{0.6211}{0.8788} = 0.7068, \qquad A_z = 44.98^\circ.
$$

That is a launch well north of due east. (The mirror heading, $180^\circ - 44.98^\circ = 135.02^\circ$, south of east, reaches the same inclination with the rocket crossing the equator going the other way.)

**A polar orbit**, $i = 90^\circ$, needs $\cos i = 0$, so $\sin A_z = 0$: $A_z = 0^\circ$, straight north, or $180^\circ$, straight south.

**Below the latitude.** Any $i < 28.5^\circ$ would need $\sin A_z = \cos i / \cos\phi > 1$. No angle has a sine bigger than $1$, so no azimuth reaches it. A **[[plane change|plane-change-cost]]** after ascent is the only way.
:::

::: warning
The terminal constraint set — $r$, $v$, $\gamma$, $i$, $\Omega$ — describes *where guidance is trying to end the burn*. It says nothing about the path flown to get there, and nothing about which point on the ground track insertion happens over; that is exactly the free argument-of-latitude coordinate. Also, do not confuse two angles. The launch azimuth sets the achievable plane before the rocket leaves the pad. The terminal flight-path angle is a property of the cutoff state, chosen independently once the plane is fixed.
:::

## Check yourself

::: check
Explain why guidance is given a target orbit as five numbers rather than the full six that a state vector carries.
:::

::: answer
An orbit is the whole ellipse, not one point on it. Describing the ellipse takes one number fewer than also saying where a vehicle sits on it at a given instant. The number left out — how far around the orbit plane cutoff happens, the argument of latitude — can stay free because reaching the intended orbit does not depend on which point along it insertion happens at. Any point on the correct ellipse, in the correct plane, is a successful insertion.
:::

::: check
A target orbit has $r_p = 6600\ \mathrm{km}$ and $r_a = 7000\ \mathrm{km}$. Find $a$, $e$, and the required speed and flight-path angle at $r = 6600\ \mathrm{km}$ (perigee).
:::

::: answer
**Size:** $a = (6600 + 7000)/2 = 6800\ \mathrm{km}$.

**Shape:** $e = (7000 - 6600)/(7000 + 6600) = 400/13\,600 = 0.02941$.

**Angle:** at perigee the radius is momentarily not changing, so $\gamma = 0$.

**Speed:** vis-viva gives

$$
v = \sqrt{\mu\left(\frac{2}{r_p} - \frac{1}{a}\right)} = \sqrt{3.986004 \times 10^{14}\left(\frac{2}{6.6 \times 10^6} - \frac{1}{6.8 \times 10^6}\right)} = 7884.8\ \mathrm{m/s}.
$$
:::

::: check
Why does a circular target orbit have $\gamma = 0$ at *every* point, rather than only at two special points as an eccentric orbit does?
:::

::: answer
The flight-path angle is nonzero only where the radius is changing — where the vehicle is climbing or descending. On an eccentric orbit that happens everywhere except the two apses, perigee and apogee, where the radius is momentarily at its smallest or largest. A circular orbit has the same radius all the way around, so $\dot r = 0$ everywhere (read $\dot r$ as "r dot", the rate of change of $r$). Therefore $\gamma = 0$ at every point, and a circular target collapses to the single triple $(r_{\text{target}}, v_{\text{circ}}(r_{\text{target}}), 0)$ with no dependence on where insertion lands.
:::

::: check
A mission planner wants to insert directly into a $20^\circ$ orbit from a launch site at $28.5^\circ$ N, with no plane-change burn. Can it be done? Why or why not?
:::

::: answer
No. The relation $\cos i = \cos\phi\sin A_z$ needs $\sin A_z = \cos i/\cos\phi$, and a sine can never exceed $1$. Here $\cos 20^\circ / \cos 28.5^\circ = 0.9397/0.8788 = 1.0693 > 1$, so no launch azimuth solves the equation. A $20^\circ$ orbit is geometrically unreachable by direct ascent from $28.5^\circ$ N, however capable the guidance. It would need a plane-change burn after insertion, or a launch site at lower latitude.
:::

::: check
Two guidance targets are proposed for the same mission. One is $(r, v, \gamma, i, \Omega)$. The other is a full six-component target state: a position vector and a velocity vector. What is the practical problem with the second, beyond "more numbers than necessary"?
:::

::: answer
Fixing a target *position*, not just a target orbit, brings back the constraint that lesson 3's derivation showed must be absent for the closed-form steering law. With the downrange (argument-of-latitude) coordinate also fixed, transversality no longer forces the downrange costate to zero. Then both components of the primer vector are independently affine in time — neither is a constant — and $\tan\beta = A + Bt$ stops being exact. So the six-number target is not only extra bookkeeping. It costs the guidance law the structure that makes it solvable in closed (or nearly closed) form every cycle, for no operational benefit, since no mission cares which point along the correct orbit insertion happens at.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Orbit vs. state | 5 numbers describe an orbit ($a, e, i, \Omega, \omega$); a 6th (position along it) describes only the moment |
| Terminal constraint set | $r$, $v$, $\gamma$, plus the plane $i$, $\Omega$ — 5 numbers |
| $\varepsilon = v^2/2 - \mu/r$, $a = -\mu/2\varepsilon$ | energy and semi-major axis from terminal $r$, $v$ |
| $h = rv\cos\gamma$, $e = \sqrt{1 + 2\varepsilon h^2/\mu^2}$ | angular momentum (sideways speed only) and eccentricity |
| Free coordinate | terminal argument of latitude $u$ — the same freedom the linear tangent derivation needed |
| Circular target | $\gamma = 0$ everywhere; collapses to $(r_{\text{target}}, v_{\text{circ}}(r_{\text{target}}), 0)$; 400 km gives $7668.558\ \mathrm{m/s}$ |
| $\cos i = \cos\phi\sin A_z$ | achievable inclination from launch latitude $\phi$ and azimuth $A_z$; $i < \phi$ unreachable by direct ascent |
| Node $\Omega$ | set by launch time — the launch window |

Everything so far assumes the rocket's engines are healthy. The next lesson asks what happens to this terminal constraint set, and to the thrust that is supposed to deliver it, when one of them is not.

::: context state-vector A snapshot you can run forward
"State" means everything you need to know *now* to predict the future. For a thrown ball, that is where it is and how fast it is moving in each direction — six numbers in 3D. Nothing about its past matters: two balls at the same place with the same velocity follow the same path from then on. Navigation systems spend their whole lives estimating this six-number snapshot, and guidance reads it every cycle as its starting point.
:::

::: context orbital-elements The five numbers of an ellipse
Two numbers fix the ellipse's size and shape. The semi-major axis $a$ is half its long width. The eccentricity $e$ says how far the focus — where Earth's center sits — is from the middle, as a fraction of $a$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="100" rx="140" ry="84" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="180" cy="100" r="3" fill="#6c7a93"/>
  <text x="180" y="118" font-size="11" text-anchor="middle" fill="#6c7a93">middle</text>
  <circle cx="292" cy="100" r="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <line x1="180" y1="84" x2="320" y2="84" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="250" y="78" font-size="12" text-anchor="middle" fill="#1f2a44">a</text>
  <circle cx="320" cy="100" r="4" fill="#b4232c"/>
  <text x="318" y="136" font-size="11" text-anchor="middle" fill="#b4232c">perigee</text>
  <circle cx="40" cy="100" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="40" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">apogee</text>
  <text x="180" y="206" font-size="11" text-anchor="middle" fill="#1f2a44">focus offset a·e = 112, a = 140, so e = 0.8</text>
</svg>
```

The drawing uses $e = 0.8$ (half-height $84 = 140\sqrt{1 - 0.8^2}$), far more stretched than any parking orbit, so the offset is easy to see. The other three elements, $i$, $\Omega$ and $\omega$, say how this flat ellipse is turned in space.
:::

::: context node Where the orbit crosses the equator
An orbit plane cuts the equator's plane along a line. The satellite crosses the equator twice per orbit: once heading north (the **ascending node**) and once heading south. "Right ascension" is the astronomers' east–west angle, measured from a fixed direction among the stars (the direction of the Sun at the March equinox). So $\Omega$ says which way the hoop is swung around Earth's axis, and $i$ says how steeply it is tilted.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="95" rx="140" ry="36" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <text x="300" y="140" font-size="11" fill="#6c7a93">equator plane</text>
  <line x1="40" y1="95" x2="320" y2="95" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="180" y1="95" x2="320" y2="41" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="180" y1="95" x2="40" y2="149" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="252" y="48" font-size="11" fill="#1d6fd1">orbit plane (edge on)</text>
  <path d="M 250 95 A 70 70 0 0 0 245 70" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="256" y="84" font-size="13" fill="#b4232c">i</text>
  <circle cx="180" cy="95" r="4" fill="#1f2a44"/>
  <text x="180" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">line of nodes runs through Earth's center</text>
</svg>
```

The picture is schematic: the orbit plane is shown edge-on, tilted by $i$ from the equator plane along the line of nodes.
:::

::: context flight-path-angle The climb angle of the path
The flight-path angle $\gamma$ is the angle between the velocity and the local horizontal — the line at right angles to "straight down" at the vehicle's spot. On a circular orbit the velocity is always horizontal, so $\gamma = 0$. On an ellipse the satellite climbs from perigee to apogee ($\gamma > 0$) and descends back ($\gamma < 0$).
:::

::: context vis-viva A name from the 1600s
*Vis viva* is Latin for "living force", an old name for what we now call kinetic energy (the German mathematician Leibniz used it). The vis-viva equation, $v^2 = \mu(2/r - 1/a)$, is the energy statement $\varepsilon = v^2/2 - \mu/r = -\mu/(2a)$ solved for speed. It says: tell me how far you are from Earth's center and the size of your orbit, and I will tell you your speed — without needing to know the shape or where perigee is.
:::

::: context argument-of-latitude Measuring around the orbit from the node
The argument of latitude $u$ is the angle, measured in the orbit plane from the ascending node, to where the vehicle is now. It is the sum of the ellipse's own angle $\omega$ (node to perigee) and the vehicle's angle past perigee, the **true anomaly** $\nu$ (read "nu"): $u = \omega + \nu$. The terminal set fixes $\nu$ (through $r$ and $\gamma$) but leaves $u$ free, so $\omega$ lands wherever cutoff happens.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="95" r="70" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="180" cy="95" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="95" x2="250" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="250" cy="95" r="4" fill="#1f2a44"/>
  <text x="258" y="99" font-size="11" fill="#1f2a44">ascending node</text>
  <line x1="180" y1="95" x2="145" y2="34.4" stroke="#b4232c" stroke-width="2"/>
  <circle cx="145" cy="34.4" r="5" fill="#b4232c"/>
  <text x="96" y="24" font-size="11" fill="#b4232c">cutoff point</text>
  <path d="M 215 95 A 35 35 0 0 0 162.5 64.7" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="206" y="70" font-size="13" fill="#1f2a44">u = 120°</text>
  <text x="180" y="175" font-size="11" text-anchor="middle" fill="#1f2a44">guidance does not care what u is</text>
</svg>
```
:::

::: context transversality-bridge The same freedom, seen twice
In lesson 3 the downrange distance at cutoff was left free, so its costate — its "price tag" — had to be zero at the end, and since it never changes, zero throughout. That zero made one primer component constant, which made the tangent law exact. On a round Earth, "downrange" becomes the angle travelled around the orbit plane: the argument of latitude. PEG and UPFG leave it free for exactly the same reason.
:::

::: context launch-window Why rockets launch at a set minute
The orbit plane is fixed among the stars, but the launch pad rides around with Earth once a day. The pad lies in a chosen plane only when Earth's turning carries it through that plane, which for most planes happens twice a day (once for a northeast launch, once for a southeast one). A rendezvous with the space station needs its plane exactly, so the window is nearly instantaneous. A satellite that only needs the right inclination can launch any time.
:::

::: context iss-inclination Why the station flies at 51.6 degrees
The International Space Station orbits at $51.6^\circ$ so that Russian rockets from Baikonur, in Kazakhstan at about $46^\circ$ N, can reach it — the site's latitude sets a floor, and the launch heading is also limited so that spent stages do not fall on neighboring countries. The price is paid at Florida: launching at $28.5^\circ$ N into a $51.6^\circ$ plane gives up much of the free eastward push of Earth's spin.
:::

::: context plane-change-cost Swinging an orbit is expensive
Changing an orbit's tilt means rotating the velocity vector. Turning a velocity of size $v$ by an angle $\Delta i$ takes a burn of $2v\sin(\Delta i/2)$. At low-orbit speed, $7669\ \mathrm{m/s}$, just $1^\circ$ costs about $134\ \mathrm{m/s}$, and going from $28.5^\circ$ to $20^\circ$ ($8.5^\circ$) costs about $1137\ \mathrm{m/s}$ — a large fraction of an upper stage's whole budget. That is why equatorial orbits are launched from near the equator whenever possible.
:::
