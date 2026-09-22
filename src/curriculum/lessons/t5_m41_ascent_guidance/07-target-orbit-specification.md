---
id: l07-target-orbit-specification
title: Target orbit specification and the terminal constraint set
minutes: 23
covers:
  - Target orbit specification and the terminal constraint set
---

Every worked example so far in this module has quietly assumed guidance knows what "the target orbit" means in numbers a steering solve can use. This lesson makes that assumption explicit. A destination orbit, in the two-body module's language, is a specific ellipse — a size, a shape, a plane — and turning that description into the handful of terminal numbers PEG or IGM actually target is a translation with one deliberate omission built into it, the same omission this module's linear tangent derivation found necessary on its own, from a completely different direction.

## Six numbers describe a moment; five describe an orbit

A full state vector — three position components, three velocity components — fixes a satellite's motion completely, including exactly where along its path it happens to be at this instant. An **orbit**, though, is the whole ellipse (or circle) traced out for all time, and describing *that* takes one fewer number. Its size and shape need two (semi-major axis $a$ and eccentricity $e$, or equivalently radius and speed at any one point via the vis-viva equation and angular momentum). Its plane's orientation in inertial space needs two more (inclination $i$ and right ascension of the ascending node $\Omega$). The orientation of the ellipse *within* that plane — where periapsis points — needs one (argument of periapsis $\omega$). That is five. The sixth quantity a state vector carries — where the vehicle currently sits along that ellipse — is not a property of the orbit at all, only of the moment, and it is exactly the number guidance does not need to hit.

::: key
An orbit is fully specified by five quantities — size and shape, plane orientation, and in-plane orientation — not six. The sixth, where along the orbit insertion happens, is a property of the moment, not the destination, and is exactly what a terminal guidance constraint should leave unconstrained.
:::

## The form guidance actually uses

Classical orbital elements are not how a steering solve consumes this. The quantities that plug directly into the terminal conditions this module's linear tangent and PEG derivations have been using all along are **terminal radius** $r$, **terminal speed** $v$, **terminal flight-path angle** $\gamma$, and the **target plane**, inclination $i$ and node $\Omega$ — five numbers, matching the five orbital properties above one-for-one through the two-body module's own relations:

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}, \qquad a = -\frac{\mu}{2\varepsilon}, \qquad
h = r v\cos\gamma, \qquad e = \sqrt{1 + \frac{2\varepsilon h^2}{\mu^2}}.
$$

Energy and radius fix the semi-major axis; angular momentum — built from the *tangential* component of velocity, $v\cos\gamma$ — together with energy fixes eccentricity. The plane comes from $i$ and $\Omega$ directly, exactly as the two-body module defined them. Nothing here constrains argument of periapsis or true anomaly individually; between them they are pinned down only through $r$ and $\gamma$, which is precisely the freedom the previous two lessons' unconstrained downrange coordinate turns out to be, now seen from the orbital-mechanics side rather than the flat-Earth optimal-control side. A guidance target of $(r, v, \gamma, i, \Omega)$ and a guidance target that leaves the terminal argument of latitude free are the same statement in two different vocabularies.

::: key
How a target orbit is specified to guidance: terminal radius $r$, terminal speed $v$, terminal flight-path angle $\gamma$, and orbital plane (inclination $i$, node $\Omega$) — five numbers, not six Cartesian components. The terminal argument of latitude is left free, which is exactly the freedom that gives the linear tangent law its closed form.
:::

::: example The same orbit, targeted at two different points
Take a 300 km $\times$ 400 km parking orbit: perigee radius $r_p = 6678.1\ \mathrm{km}$, apogee radius $r_a = 6778.1\ \mathrm{km}$, giving $a = 6728.137\ \mathrm{km}$ and $e = (r_a-r_p)/(r_a+r_p) = 0.007431$. Targeting insertion exactly at perigee means $\gamma = 0$ and $v = \sqrt{\mu(2/r_p - 1/a)} = 7754.414\ \mathrm{m/s}$: three numbers, $(r,v,\gamma) = (6678.1\ \mathrm{km},\, 7754.414\ \mathrm{m/s},\, 0^\circ)$, fully pin down the ellipse's size and shape.

The *same* ellipse could equally be targeted somewhere between its apses. At $r = 6728.1\ \mathrm{km}$ (350 km altitude, exactly the midpoint here), the specific angular momentum computed from the perigee condition, $h = \sqrt{\mu a(1-e^2)} = 51{,}785.0 \times 10^6\ \mathrm{m^2/s}$ (unchanged — it is a property of the orbit, not the point on it), gives a tangential speed $v_t = h/r = 7696.787\ \mathrm{m/s}$ there, and vis-viva gives total speed $v = \sqrt{\mu(2/r-1/a)} = 7697.000\ \mathrm{m/s}$, leaving a radial component $v_r = \sqrt{v^2-v_t^2} = 57.200\ \mathrm{m/s}$ and $\gamma = \arctan(v_r/v_t) = 0.4258^\circ$. Two entirely different terminal triples, $(6678.1\ \mathrm{km}, 7754.414\ \mathrm{m/s}, 0^\circ)$ and $(6728.1\ \mathrm{km}, 7697.000\ \mathrm{m/s}, 0.4258^\circ)$, describe the identical ellipse — because both leave the same freedom, where along it insertion actually happens, unused.
:::

## The degenerate, easy case: a circular target

A circular orbit removes one further subtlety. With $e=0$ every point is equally "the periapsis," so there is no argument of periapsis to be free *about* — the flight-path angle is zero at every point on the orbit, not just at two apses, and $(r,v,\gamma)$ collapses to $(r_{\text{target}},\, v_{\text{circ}}(r_{\text{target}}),\, 0)$ regardless of where along the circle insertion lands. This is exactly the target this module's PEG worked example used: $r_{\text{target}} = R_E + 400\ \mathrm{km}$, $v_{\text{circ}}(r_{\text{target}}) = \sqrt{\mu/r_{\text{target}}} = 7668.558\ \mathrm{m/s}$, $\gamma = 0$ — the simplest possible instance of the general terminal-constraint set, not a special algorithm.

## The plane, and what the launch site can actually reach

Inclination and node are not free to pick arbitrarily either, for a purely geometric reason set well before guidance ever runs: a direct ascent from a launch site at geodetic latitude $\phi$, without a plane-change maneuver, cannot reach an inclination below $\phi$ — the ground track's steepest possible crossing of a parallel of latitude is bounded by that latitude itself. The relation between launch azimuth $A_z$ (measured from north) and achievable inclination is $\cos i = \cos\phi\sin A_z$.

::: example What azimuth reaches a given inclination
From a launch site at $28.5^\circ$ N: a due-east launch ($A_z = 90^\circ$) reaches the minimum possible inclination, $\cos i = \cos(28.5^\circ)\sin(90^\circ) = \cos(28.5^\circ)$, so $i = 28.5^\circ$ — inclination cannot go lower without a plane-change burn, however guidance steers the ascent. Reaching a $51.6^\circ$ target (a common crewed low-Earth-orbit inclination) needs $\sin A_z = \cos(51.6^\circ)/\cos(28.5^\circ) = 0.7068$, giving $A_z = 44.98^\circ$ — a launch well north of due east. A polar orbit, $i = 90^\circ$, needs $A_z = 0^\circ$, straight north (or $180^\circ$, straight south). An inclination *less* than the launch latitude — for this site, anything under $28.5^\circ$ — has no real solution for $A_z$ at all: $|\cos i/\cos\phi| > 1$, and no azimuth reaches it without changing planes after ascent.
:::

::: warning
The terminal constraint set — $r$, $v$, $\gamma$, $i$, $\Omega$ — describes *where guidance is trying to end the burn*. It says nothing about the path flown to get there, and in particular nothing about which point on the *ground track* insertion happens over; that is exactly the free argument-of-latitude coordinate. Do not confuse a launch azimuth, which sets the achievable plane before the vehicle ever leaves the pad, with the terminal flight-path angle, which is a property of the cutoff state and is chosen independently once the plane is fixed.
:::

## Check yourself

::: check
Explain why a target orbit is specified with five numbers to guidance rather than the full six a state vector carries.
:::

::: answer
An orbit is the whole ellipse, not a single point on it, and it takes one fewer number to describe the ellipse itself than to also pin down where a vehicle sits on it at a given instant. The sixth state-vector quantity — position along the orbit — is free precisely because reaching the intended orbit does not depend on which point along it insertion happens at; any point on the correct ellipse, in the correct plane, is a successful insertion.
:::

::: check
For a target orbit with $r_p = 6600\ \mathrm{km}$, $r_a = 7000\ \mathrm{km}$, compute $a$, $e$, and the required speed and flight-path angle at $r = 6600\ \mathrm{km}$ (perigee).
:::

::: answer
$a = (6600+7000)/2 = 6800\ \mathrm{km}$, $e = (7000-6600)/(7000+6600) = 0.02941$. At perigee $\gamma = 0$ by definition, and vis-viva gives $v = \sqrt{\mu(2/r_p - 1/a)} = \sqrt{3.986004418\times10^{14}\,(2/6.6\times10^6 - 1/6.8\times10^6)} = 7884.8\ \mathrm{m/s}$.
:::

::: check
Why does a circular target orbit have $\gamma = 0$ at *every* point rather than only at two special points, the way an eccentric orbit does?
:::

::: answer
Flight-path angle is nonzero only where the radius is instantaneously changing, which for an eccentric orbit happens everywhere except the two apses (perigee and apogee), where radius is momentarily stationary. A circular orbit has constant radius throughout — $\dot r = 0$ everywhere, not just at two points — so $\gamma = 0$ at every point on it, which is why a circular target collapses to the single triple $(r_{\text{target}}, v_{\text{circ}}(r_{\text{target}}), 0)$ with no dependence on where insertion lands.
:::

::: check
A mission planner wants to insert directly into a $20^\circ$ inclination orbit from a launch site at $28.5^\circ$ N latitude, without any plane-change maneuver. Is this achievable, and why or why not?
:::

::: answer
No. The achievable-inclination relation $\cos i = \cos\phi \sin A_z$ requires $|\cos i/\cos\phi| \le 1$ for a real launch azimuth to exist. Here $\cos(20^\circ)/\cos(28.5^\circ) = 1.0693 > 1$, so no azimuth solves the equation — a $20^\circ$ orbit is geometrically unreachable by direct ascent from $28.5^\circ$ N, and would require a plane-change burn after insertion, or launching from a lower-latitude site, however capable the guidance flying the ascent is.
:::

::: check
Two guidance targets are proposed for the same mission: one specified as $(r, v, \gamma, i, \Omega)$, the other as a full six-component target state (position and velocity vectors). Explain the practical problem with the second choice, beyond it simply being "more numbers than necessary."
:::

::: answer
Fixing a specific target position, not just a target orbit, reintroduces exactly the constraint the linear tangent derivation showed removes the closed-form steering law: with the downrange (or argument-of-latitude) coordinate also constrained, the relevant position costate is no longer forced to zero by transversality, the primer vector's components are independently affine rather than one of them constant, and $\tan\beta = A+Bt$ stops being exact. It is not only unnecessary bookkeeping — it actively costs the guidance law the mathematical structure that makes it solvable in closed (or near-closed) form each cycle, for no operational benefit, since no mission actually cares which point along the correct orbit insertion happens at.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Orbit vs. state | 5 numbers describe an orbit; a 6th (position along it) describes only the moment |
| Terminal constraint set | $r$, $v$, $\gamma$ (size/shape/in-plane), $i$, $\Omega$ (plane) — 5 numbers |
| $\varepsilon = v^2/2-\mu/r$, $a=-\mu/2\varepsilon$ | energy and semi-major axis from terminal $r,v$ |
| $h = rv\cos\gamma$, $e=\sqrt{1+2\varepsilon h^2/\mu^2}$ | angular momentum and eccentricity, using the tangential speed component |
| Free coordinate | terminal argument of latitude — the same freedom the linear tangent law's derivation needed |
| Circular target | $\gamma = 0$ everywhere; collapses to $(r_{\text{target}}, v_{\text{circ}}(r_{\text{target}}), 0)$ |
| $\cos i = \cos\phi\sin A_z$ | achievable inclination from launch latitude $\phi$ and azimuth $A_z$; $i < \phi$ unreachable by direct ascent |

Everything from here assumes the steering itself is healthy. The next lesson asks what happens to this terminal constraint set, and to the thrust that is supposed to deliver it, when an engine does not.
