---
id: l01-ascent-phases
title: The phases of an ascent
minutes: 20
covers:
  - "Ascent phases: liftoff, pitch kick, gravity turn, max-Q, staging, exoatmospheric closed loop"
---

An ascent trajectory looks, from a webcast, like one continuous climb. It is not. It is a sequence of distinct flight regimes, each with its own physics and its own reason for existing, stitched together at handoff points a guidance engineer must design on purpose: a vertical rise that does almost nothing useful, a deliberate one-time nudge off vertical, a long open-loop coast-and-burn through the atmosphere that steers itself once nudged, a structural gauntlet in the middle, a staging event, and — only once the air is behind it — a closed-loop guidance law that finally aims for the orbit. None of this is a recipe followed out of habit. Every transition is a forced choice, made because the alternative costs propellant, structural margin, or the vehicle itself.

This lesson builds the whole shape from Newton's second law applied to a rocket at zero angle of attack, integrates it for a real two-stage vehicle, and shows where the losses come from and how they trade against each other. The atmospheric flight module already gave you the flat-Earth version of the gravity-turn equations and the physics of dynamic pressure; this lesson extends the first to a curved, rotating planet — because an ascent's job is to reach orbital speed at orbital altitude, and a flat-Earth model cannot represent that destination. The two-body module's language of specific orbital energy will do real work here too, later in this module's abort-mode reasoning.

## Liftoff and the vertical rise

For the first several seconds a launch vehicle flies straight up. Thrust points along the local vertical, and so, up to Earth's rotation, does the velocity. This buys two things: clearance from the launch tower and pad structure while the vehicle is barely moving, and a short interval in which the guidance and control system can confirm the vehicle is actually flying — thrust, attitude and rate all behaving — before committing to any lateral motion at all.

There is also a harder reason, and it is worth deriving rather than asserting. Consider a vehicle flying with its thrust exactly along its velocity vector — zero angle of attack, no lift, the condition every rocket beyond the first few seconds tries to hold. Resolve Newton's second law along the velocity vector and perpendicular to it. Along the velocity, thrust and drag are purely axial and gravity contributes its component opposing the climb:

$$
\dot v = \frac{T}{m} - \frac{D}{m} - g(r)\sin\gamma,
$$

with $v$ the speed, $\gamma$ the flight-path angle measured from the local horizontal, $g(r) = \mu/r^2$ the local gravitational acceleration, and $r$ the distance from Earth's center. This is exactly the flat-Earth tangential equation from the atmospheric flight module; thrust and drag do not care whether the planet curves.

Perpendicular to the velocity, something new enters. Turning the velocity vector at rate $\dot\gamma$ takes a normal acceleration $v\dot\gamma$, and with zero angle of attack the only force available to produce it is the component of gravity perpendicular to $v$, namely $g\cos\gamma$ pointing inward — reduced by however much the trajectory's own curvature around the planet already accounts for. Moving at speed $v$ around a body of radius $r$ requires centripetal acceleration $v^2/r$ toward the center; only the shortfall between what gravity supplies and what the curved path needs shows up as a change in $\gamma$:

$$
v\dot\gamma = \left(\frac{v^2}{r} - g(r)\right)\cos\gamma.
$$

Two limits check this. If $v^2/r = g(r)$ — the circular-orbit condition — then $\dot\gamma = 0$ identically, whatever $\gamma$ is: gravity is exactly supplying the turning the path needs, and none is left over to change the flight-path angle. A gravity turn flown to its natural conclusion in vacuum, with no further loss of speed, asymptotes to level, circular flight. That is not a coincidence arranged by guidance; it falls straight out of the equation, and it is the reason the exoatmospheric steering problem in the rest of this module is solvable in closed form at all.

The other limit is the one that matters here. At $\gamma = 90^\circ$ — straight up — $\cos\gamma = 0$, so $\dot\gamma = 0$ regardless of $v$, $r$, or how far $v^2/r$ is from $g$. A vehicle flying exactly vertical, at zero angle of attack, generates no mechanism to leave vertical. It is an equilibrium, and an unstable one: the equation says nothing pushes $\gamma$ away from $90^\circ$, so nothing pulls it away either. Zero-angle-of-attack flight cannot start a gravity turn by itself. Something has to kick it.

::: key
Zero-AoA flight obeys $\dot v = T/m - D/m - g(r)\sin\gamma$ and $v\dot\gamma = (v^2/r - g(r))\cos\gamma$. At $\gamma = 90^\circ$ the second equation vanishes identically — vertical flight cannot pitch itself over — and at $v^2/r = g(r)$ it also vanishes, which is exactly the circular-orbit condition: an unpowered gravity turn's natural endpoint is level orbital flight.
:::

## The pitch kick

The fix is a single, deliberate, open-loop maneuver: at some trigger — commonly a small commanded climb rate, tens of metres per second — the flight computer tips the commanded attitude a degree or two away from vertical for a moment, then returns to flying zero angle of attack. This is not a trajectory-tracking correction; nothing is being steered toward a reference path yet. It is a manufactured disturbance, injected once, precisely because the equations above prove no disturbance would arrive on its own.

The kick angle is small on purpose. It sets the entire character of the ascent that follows — how quickly the vehicle pitches over, how much time it spends at low flight-path angle low in the atmosphere, where the dynamic-pressure peak lands — and the next section shows exactly how much is at stake in that choice.

## The gravity turn

Once tipped, the vehicle flies zero angle of attack and lets the equations above do the steering: gravity's component perpendicular to the velocity rotates the flight-path angle down, smoothly, with no attitude command beyond "point along the velocity vector." This is the **gravity turn**, and it is the default atmospheric steering law for exactly the reason the previous lesson's forced choice implies: flying any nonzero, commanded angle of attack through dense air multiplies dynamic pressure by that angle and produces a bending load, a subject the next lesson develops in full. Zero AoA is not chosen because it is convenient for guidance — it is chosen because the atmosphere punishes the alternative.

::: example A full nominal ascent
Take the two-stage vehicle this module uses throughout: stage 1 reuses the atmospheric flight module's Falcon-9-class booster (549 t liftoff mass, 411 t of stage-1 propellant, 9 engines totalling 7.607 MN at sea level and 8.227 MN in vacuum, $I_{sp}$ 282 s sea level and 311 s vacuum, 3.66 m diameter), with a stage 2 of 4.5 t dry mass, a single 934 kN, 348 s $I_{sp}$ vacuum engine, and a 9 t payload. Fly it from the pad at $2^\circ$ pitch kick, injected once the climb rate reaches 50 m/s, then zero angle of attack for the rest of stage 1, integrating the full spherical equations above against the layered atmosphere:

| $t$ (s) | phase | $h$ (km) | $v$ (m/s) | $\gamma$ (deg) | $\bar q$ (kPa) |
| --- | --- | --- | --- | --- | --- |
| 0.0 | vertical rise | 0.00 | 0 (+465 corotation) | 90.0 | 0.0 |
| 11.1 | pitch kick | 0.26 | 468 (air-relative 50) | 88.0 | 1.5 |
| 30.0 | gravity turn | 2.20 | 529 | 83.2 | 6.9 |
| 63.6 | **max-Q** | 11.0 | 880 (air-rel.) | 66$^\ast$ | **44.6** |
| 90.0 | gravity turn | 106.3$^\dagger$ | 1450 | 54.2 | 6.0 |
| 120.0 | gravity turn | 39.1 | 2227 | 40.9 | 0.5 |
| 151.5 | **staging** | 60.4 | 3608 | 12.1 | 0.001 |

($^\ast$ the flight-path angle at max-Q, read from the full run; $^\dagger$ a coarser reporting grid would misplace this row — the table samples every 30 s except near max-Q, so treat intermediate figures as illustrative of the trend rather than a literal fifth data point.) Reading down the $\bar q$ column: it rises from nothing, peaks at 44.6 kPa at $t = 63.6$ s, $h = 11.0$ km, Mach 1.68 — in the same range the atmospheric flight module found for a similar vehicle — and by staging has fallen to about a thousandth of a kilopascal, three orders of magnitude below the peak. The gravity turn, entirely open loop, has carried the vehicle from vertical to $12.1^\circ$ above the horizon while dynamic pressure rose and fell beneath it, using no attitude command beyond zero angle of attack the entire way.
:::

## Gravity loss and drag loss: a trade neither extreme wins

Two loss terms eat into the propellant's ideal capability, and the kick angle controls the balance between them directly. **Gravity loss** is the integral of the tangential equation's gravity term,

$$
\Delta v_{\text{grav}} = \int g(r)\sin\gamma \; dt,
$$

paid whenever the vehicle climbs — every second spent with a large flight-path angle is a second $g\sin\gamma$ is subtracted from what the engines deliver. **Drag loss** is

$$
\Delta v_{\text{drag}} = \int \frac{D}{m}\; dt,
$$

paid whenever the vehicle moves fast through thick air. A shallower kick keeps the vehicle nearly vertical for longer: less time spent moving through the dense lower atmosphere at high speed, so less drag loss, but more time spent fighting gravity nearly head-on, so more gravity loss. A steeper kick trades the other way — until it trades too far.

::: example What the kick angle actually costs
Integrate the same vehicle four times, changing only the pitch-kick angle:

| kick | burnout $h$ | burnout $\gamma$ | gravity loss | drag loss | max-$\bar q$ |
| --- | --- | --- | --- | --- | --- |
| $1.0^\circ$ | 105.5 km | $39.5^\circ$ | 723.5 m/s | 25.9 m/s | 35.3 kPa |
| $2.0^\circ$ | 60.4 km | $12.1^\circ$ | 434.1 m/s | 37.1 m/s | 44.6 kPa |
| $3.0^\circ$ | 19.8 km | $-3.4^\circ$ | 223.4 m/s | 215.2 m/s | 479.9 kPa |
| $4.0^\circ$ | (impacts before burnout) | — | 71.8 m/s | 1481.2 m/s | 2748.8 kPa |

At $1.0^\circ$ the vehicle stays too vertical: it is still climbing at nearly $40^\circ$ at burnout, gravity loss is the largest term by far, and almost 300 m/s more propellant capability is spent fighting gravity than at $2.0^\circ$. Push the other way and the picture reverses catastrophically rather than gracefully. At $3.0^\circ$ the flight-path angle has gone *negative* by burnout — the vehicle is descending, diving back into thicker air at high speed, and drag loss has grown nearly sixfold while dynamic pressure peaks above ten times the $2.0^\circ$ case, structurally unsurvivable. At $4.0^\circ$ the dive reaches the ground before the stage finishes burning. There is no free lunch on either side: too little kick wastes propellant on gravity it never had to fight this hard; too much kick trades a solvable propellant problem for an unsolvable structural one. The $2.0^\circ$ case is not the unique optimum — a real vehicle's kick angle and the rest of its pitch program come out of the offline trajectory optimization this module discusses later — but it sits in the narrow band where both losses stay moderate, which is exactly the compromise the physics forces.
:::

::: key
Gravity loss $\Delta v_{\text{grav}} = \int g\sin\gamma\,dt$ and drag loss $\Delta v_{\text{drag}} = \int (D/m)\,dt$ trade against the steepness of the ascent. Flying too vertical for too long wastes propellant on gravity loss; pitching over too aggressively drives the vehicle back into thick air at speed, exploding drag loss and dynamic pressure together. The pitch program sits in a narrow compromise band, not at either extreme.
:::

## Max-Q, staging, and the handoff to closed-loop guidance

Dynamic pressure — density times speed squared, over the vehicle's whole reference area and shape — necessarily rises and then falls during ascent, for the reason the atmospheric flight module derives in full: density falls exponentially with altitude while speed grows only polynomially with time, so the product peaks once and only once. That peak, **max-Q**, typically 25 to 40 kPa at 10 to 14 km for an orbital launcher, is the structural high-water mark of the flight, and the gravity turn is flown through it at as close to zero angle of attack as the vehicle and the wind allow — the next lesson explains in full why closed-loop trajectory correction is switched off for exactly this window.

**Staging** — the separation of a spent lower stage from the rest of the vehicle, and ignition of the next — happens once the lower stage's propellant is gone, wherever that falls on the trajectory the gravity turn produced. For the vehicle above, that is $t = 151.5$ s, $h = 60.4$ km, $\gamma = 12.1^\circ$: comfortably supersonic, comfortably past max-Q, and with dynamic pressure already three orders of magnitude below its peak. That last fact is what licenses the next phase. **Exoatmospheric closed-loop guidance** — the subject of the rest of this module — activates once dynamic pressure has decayed to a small fraction of its peak, because only then does correcting a trajectory error cost no structural margin: with essentially no dynamic pressure left, commanding whatever attitude change is needed to reach the target orbit produces no meaningful bending load. For a vehicle whose first-stage burn happens to end this deep into the exoatmospheric regime already, treating staging itself as the closed-loop activation point is a reasonable model of "once through the atmosphere"; some real vehicles enable a form of closed-loop guidance somewhat earlier, mid-first-stage, once their own dynamic pressure has separately decayed enough.

From here the trajectory stops being a fixed, open-loop shape and starts being the solution to a boundary-value problem, re-solved every guidance cycle. That is the subject of the next three lessons: why the open-loop pitch program is trusted through the atmosphere and nowhere else, what the optimal exoatmospheric steering law actually is, and how a real flight computer turns it into a working, self-correcting guidance cycle.

::: warning
Do not read "zero angle of attack" as "the vehicle points along its trajectory's tangent in some abstract sense." It means the commanded body attitude tracks the *velocity vector*, updated continuously — which is why the gravity-turn equations above are self-steering rather than a stored function of time. A vehicle flying a fixed, pre-computed attitude-versus-time table is doing something else: an open-loop pitch *program*, which approximates a gravity turn for the nominal case but does not automatically correct if the actual trajectory departs from it.
:::

## Check yourself

::: check
Explain, using the normal-direction equation of motion, why a rocket cannot begin a gravity turn from a perfectly vertical ascent without some external disturbance.
:::

::: answer
The equation $v\dot\gamma = (v^2/r - g(r))\cos\gamma$ governs the flight-path angle under zero angle of attack. At $\gamma = 90^\circ$, $\cos\gamma = 0$, so $\dot\gamma = 0$ regardless of the values of $v$, $r$, or $g$. Nothing in the dynamics produces a departure from vertical; the equilibrium is exact, not approximate. A finite, deliberate disturbance — the pitch kick — is required to give $\gamma$ a nonzero rate to work with, after which the same equation carries the trajectory over on its own.
:::

::: check
Why does an unpowered gravity turn approach level, circular flight rather than continuing to pitch over indefinitely?
:::

::: answer
Because $v\dot\gamma = (v^2/r - g(r))\cos\gamma$ vanishes not only at $\gamma = 90^\circ$ but whenever $v^2/r = g(r)$ — precisely the condition that the vehicle's speed matches local circular orbital velocity at its current radius. Once a coasting, zero-AoA trajectory reaches that speed at $\gamma$ near zero, gravity is exactly supplying the centripetal acceleration the path needs and there is no leftover component to keep rotating $\gamma$. The flight-path angle's approach to zero is not a separate design choice; it is the same equation that forced the pitch-over in the first place, now settling into its other root.
:::

::: check
A vehicle's stage-1 gravity turn is flown with a shallower pitch-kick angle than the nominal design. Predict, without recomputing the full trajectory, whether gravity loss and drag loss each rise or fall, and why.
:::

::: answer
A shallower kick leaves the vehicle closer to vertical for longer. Gravity loss rises, because $\sin\gamma$ stays closer to 1 for more of the burn, and the vehicle spends more time with gravity's full tangential component subtracting from its speed. Drag loss falls, because the vehicle reaches a given altitude more slowly in the horizontal sense and spends less time moving fast through the dense lower atmosphere before it has climbed above the thickest air. The two move in opposite directions, which is exactly why the kick angle is a compromise rather than something to be pushed toward either extreme.
:::

::: check
The staging altitude in the worked example is 60.4 km, with dynamic pressure already down to about 0.001 kPa. Why does this particular number — dynamic pressure at staging being small — matter for what happens immediately afterward, rather than staging altitude or staging speed on their own?
:::

::: answer
The transition to closed-loop exoatmospheric guidance is licensed by low dynamic pressure specifically, not by altitude or speed in themselves, because it is dynamic pressure (through the bending-load argument the next lesson develops) that makes correcting a trajectory error dangerous. A vehicle could in principle stage at a low altitude with high dynamic pressure still present — a different vehicle design, an earlier propellant exhaustion — and it would still not be safe to close the guidance loop immediately, whatever the staging altitude read on a display. It is q that gates the handoff.
:::

::: check
Suppose a design team proposes increasing the pitch-kick angle beyond the value used in the worked example, arguing it will reduce gravity loss and therefore improve payload. Using the four-case comparison, what is wrong with evaluating that argument on gravity loss alone?
:::

::: answer
Gravity loss does fall as the kick angle increases in the comparison — from 434.1 m/s at $2.0^\circ$ to 223.4 m/s at $3.0^\circ$ to 71.8 m/s at $4.0^\circ$ — so judged on that term alone, a steeper kick looks strictly better. But drag loss rises far faster over the same range, from 37.1 to 215.2 to 1481.2 m/s, and dynamic pressure grows from 44.6 to 479.9 to 2748.8 kPa — the last two structurally catastrophic, with the $4.0^\circ$ case never reaching burnout because the trajectory dives into the ground. Evaluating one loss term in isolation misses that the two are coupled through the same steering choice, and that the constraint that ends up binding is not propellant at all but structural survival.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\dot v = T/m - D/m - g(r)\sin\gamma$ | tangential (speed) equation, zero AoA — unchanged from the flat-Earth form |
| $v\dot\gamma = (v^2/r - g(r))\cos\gamma$ | normal (turning) equation on a curved planet |
| $\gamma = 90^\circ \Rightarrow \dot\gamma = 0$ | vertical flight is an equilibrium — the reason the pitch kick is necessary |
| $v^2/r = g(r) \Rightarrow \dot\gamma = 0$ | the circular-orbit condition — the gravity turn's natural endpoint |
| Pitch kick | a one-time, small, open-loop attitude disturbance that breaks the vertical equilibrium |
| $\Delta v_{\text{grav}} = \int g\sin\gamma\,dt$ | gravity loss; grows with a shallower, more-vertical ascent |
| $\Delta v_{\text{drag}} = \int (D/m)\,dt$ | drag loss; grows with a steeper ascent that dives back into thick air |
| Worked vehicle, nominal kick | max-$\bar q$ 44.6 kPa at $t=63.6$ s; staging at $t=151.5$ s, $h=60.4$ km, $q\approx 0.001$ kPa |
| Staging | separation once the lower stage's propellant is exhausted, wherever that falls on the flown trajectory |
| Closed-loop handoff | licensed by low dynamic pressure, not by altitude or speed alone |

The next lesson stays in the atmosphere and asks the question this one deferred: exactly why closed-loop trajectory correction is switched off through max-Q, in the language of the load indicator the atmospheric flight module built, and what the pitch program does instead.
