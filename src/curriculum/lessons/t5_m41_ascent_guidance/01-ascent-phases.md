---
id: l01-ascent-phases
title: The phases of an ascent
minutes: 22
covers:
  - "Ascent phases: liftoff, pitch kick, gravity turn, max-Q, staging, exoatmospheric closed loop"
---

Think about an airliner trip. The plane is pushed back from the gate, rolls down the runway, lifts its nose, climbs, and levels off to cruise. From your window seat it feels like one smooth journey. But the pilots see separate **phases**, each with its own checklist and its own rules, and a clear moment where one hands over to the next.

A rocket's climb to orbit is the same. On a webcast it looks like one long, smooth arc. It is really six phases stitched together:

- **Liftoff and vertical rise** — straight up, clear of the tower.
- **Pitch kick** — one small, deliberate nudge off vertical.
- **Gravity turn** — a long curve over, which gravity steers by itself.
- **Max-Q** — the moment the air pushes hardest on the rocket.
- **Staging** — dropping the empty first stage and lighting the next one.
- **Exoatmospheric closed loop** — above the air, a guidance computer finally steers straight for the target orbit.

None of these is a habit. Each handoff is forced by physics: do it any other way and you pay in propellant, in structural strength, or with the rocket itself. This lesson builds the whole shape from Newton's second law, flies a real two-stage rocket through it, and shows how two losses trade against each other. The atmospheric flight module gave you the flat-Earth equations and dynamic pressure. Here we add the curve of the planet, because orbit only makes sense on a round Earth.

## Two equations for a rocket that flies along its own path

Picture a dart thrown across a room. It flies nose-first. Its point stays lined up with the direction it is moving. A rocket in the air tries to do exactly this. The angle between where the nose points and where the rocket is actually going is the **[[angle of attack|angle-of-attack]]**, written $\alpha$ ("alpha"). Flying at **zero angle of attack** means the nose points straight along the velocity, so the air hits it head-on and pushes no sideways force on it.

To describe the path we need a few quantities:

- $v$ — the speed.
- $\gamma$ ("gamma") — the **[[flight-path angle|flight-path-angle]]**, the angle of the velocity above the local horizon. Straight up is $\gamma = 90^\circ$; level flight is $\gamma = 0^\circ$.
- $r$ — the distance from Earth's center.
- $g(r) = \mu/r^2$ — gravity's pull per kilogram at that distance, with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ Earth's **[[gravitational parameter|mu-gravity]]**.
- $T$ — thrust, $D$ — drag (air resistance), $m$ — mass.

We split Newton's second law into two directions: along the velocity, and sideways to it.

**Along the velocity.** Thrust pushes forward. Drag pushes back. Gravity pulls down, and the part of it that points backward along the path is $g\sin\gamma$. When you climb straight up, all of gravity works against you ($\sin 90^\circ = 1$). When you fly level, none of it does ($\sin 0^\circ = 0$). So the speed changes as

$$
\dot v = \frac{T}{m} - \frac{D}{m} - g(r)\sin\gamma .
$$

Read $\dot v$ as "v dot": the rate the speed is changing, in $\mathrm{m/s^2}$. This is the same equation as in the flat-Earth model. Thrust and drag do not care whether the planet is curved.

**Sideways to the velocity.** This is where the curve of the Earth enters. Swing a ball on a string in a circle: the string must pull it inward, or it flies off straight. Anything moving at speed $v$ around a circle of radius $r$ needs an inward pull of $v^2/r$ per kilogram. That is the **[[centripetal acceleration|centripetal]]**. For a rocket moving around the Earth, gravity supplies the inward pull. If gravity supplies *more* than the path needs, the leftover bends the path downward — the flight-path angle drops. If it supplies less, the path bends up relative to the curving ground. The result is

$$
v\dot\gamma = \left(\frac{v^2}{r} - g(r)\right)\cos\gamma .
$$

Read $\dot\gamma$ as "gamma dot": how fast the flight-path angle is turning, in radians per second.

::: note Why it has to be true
Only the part of gravity at right angles to the velocity can turn the velocity. That part is $g\cos\gamma$, pointing toward the planet's side of the path. A velocity of size $v$ turning at rate $\dot\gamma$ needs a sideways acceleration $v\dot\gamma$ — the same way a car going around a bend at speed $v$ needs sideways grip.

But the "horizon" we measure $\gamma$ from is itself rotating as the rocket travels around the Earth. Moving across the ground, the local horizontal tips forward at a rate $v\cos\gamma / r$ (horizontal speed over radius). So a path that stays at a fixed $\gamma$ is already curving at that rate, and that costs an inward acceleration of $(v^2/r)\cos\gamma$. Whatever gravity supplies beyond that turns $\gamma$ down:

$$
v\dot\gamma = -g\cos\gamma + \frac{v^2}{r}\cos\gamma = \left(\frac{v^2}{r} - g\right)\cos\gamma .
$$

On a flat Earth, $r$ is infinite, the $v^2/r$ term vanishes, and you get back the flat-Earth form $\dot\gamma = -(g/v)\cos\gamma$.
:::

### Two special cases

Look at when the right-hand side is zero, because then $\gamma$ stops changing.

**Case 1: $v^2/r = g(r)$.** The speed is exactly right for a circle at this height. Gravity supplies exactly the inward pull the curved path needs, with nothing left over to change $\gamma$. That is the **circular-orbit condition**. So a gravity turn carried all the way, above the air, naturally settles into level, circular flight. Guidance did not arrange that. It falls out of the equation, and it is why the steering problem above the atmosphere, later in this module, can be solved neatly at all.

**Case 2: $\gamma = 90^\circ$.** Straight up. Now $\cos 90^\circ = 0$, so $\dot\gamma = 0$ whatever $v$, $r$ and $g$ are. A rocket flying perfectly vertically, at zero angle of attack, has nothing that tips it over. Gravity pulls exactly backward along its path, with no sideways part at all. It is like a pencil balanced perfectly on its tip — an **[[equilibrium|pencil-equilibrium]]**. Nothing pushes it off vertical, so it never leaves vertical by itself. Something has to give it a shove.

::: key
Zero-AoA flight obeys $\dot v = T/m - D/m - g(r)\sin\gamma$ and $v\dot\gamma = (v^2/r - g(r))\cos\gamma$. At $\gamma = 90^\circ$ the second equation vanishes identically — vertical flight cannot pitch itself over — and at $v^2/r = g(r)$ it also vanishes, which is exactly the circular-orbit condition: an unpowered gravity turn's natural endpoint is level orbital flight.
:::

## Liftoff and the vertical rise

For the first several seconds a launch vehicle flies straight up. Thrust and velocity both point along the local vertical. This buys two things.

- **Clearance.** The rocket is barely moving and must not drift into the tower.
- **A health check.** For a few seconds the flight computer confirms that thrust, attitude and turn rates all look right before it commits to any sideways motion.

And Case 2 says more: while the rocket is exactly vertical, the equations keep it exactly vertical. Safe near the tower, useless for orbit, where nearly all the speed must be sideways.

## The pitch kick

The fix is a single, deliberate shove. At some trigger — commonly when the climb rate reaches a few tens of meters per second — the flight computer tips the commanded attitude a degree or two away from vertical for a moment, then goes back to flying zero angle of attack. That shove is the **pitch kick**.

It is not a correction toward a planned path. It is a disturbance made on purpose, once, because the equations proved none would arrive on its own.

The kick is small, but it decides the character of everything after it: how fast the rocket leans over, how long it lingers low in the thick air, and where the peak air load lands. The next two sections show how much rides on that one number.

## The gravity turn

Once tipped, the rocket flies zero angle of attack and lets the sideways equation do the steering. Gravity's sideways part, $g\cos\gamma$, rotates the flight-path angle down, smoothly, with no command beyond "point along the velocity". This is the **gravity turn**.

Why not steer some other way? Because pointing the nose away from the airflow in thick, fast air makes the air push sideways on the rocket, and that bends it. The next lesson measures exactly how hard. Zero angle of attack is chosen not because it is easy for guidance, but because the atmosphere punishes anything else.

::: example A full nominal ascent
Take the two-stage vehicle this module uses throughout. Stage 1 is the atmospheric flight module's Falcon-9-class booster: 549 t at liftoff, 411 t of stage-1 propellant, nine engines giving 7.607 MN at sea level and 8.227 MN in vacuum, specific impulse ($I_{sp}$) 282 s at sea level and 311 s in vacuum, 3.66 m diameter. On top sits a stage 2 with 4.5 t dry mass and one 934 kN engine of 348 s $I_{sp}$, carrying a 9 t payload.

Launch due east from the equator. Fly straight up until the climb rate reaches 50 m/s, give a $2^\circ$ pitch kick, then fly zero angle of attack for the rest of stage 1. Integrate the round-Earth equations above, with the layered standard atmosphere for density, second by second. The speed and flight-path angle below are measured **relative to the air**, because that is what sets the air load $\bar q$ (read "q bar", the **[[dynamic pressure|dynamic-pressure]]**, $\tfrac12\rho v^2$) and what the gravity turn steers on:

| $t$ (s) | phase | $h$ (km) | $v$ (m/s, air-rel.) | $\gamma$ (deg, air-rel.) | $\bar q$ (kPa) |
| --- | --- | --- | --- | --- | --- |
| 0.0 | vertical rise | 0.00 | 0 | 90.0 | 0.0 |
| 11.1 | pitch kick | 0.27 | 50 | $90.0 \to 88.0$ | 1.5 |
| 30.1 | gravity turn | 2.20 | 162 | 75.9 | 13.0 |
| 63.6 | **max-Q** | 11.0 | 495 | 47.2 | **44.6** |
| 90.1 | gravity turn | 22.5 | 964 | 31.0 | 27.5 |
| 120.1 | gravity turn | 39.1 | 1781 | 20.1 | 6.9 |
| 151.5 | **staging** | 60.4 | 3151 | 13.9 | 1.4 |

**Read down the $\bar q$ column.** It rises from nothing and peaks at 44.6 kPa at $t = 63.6$ s, at 11.0 km and Mach 1.68. Then it falls to 1.4 kPa by staging: $44.6 / 1.4 \approx 32$, so staging sees about one thirty-second of the peak.

**Read down the $\gamma$ column.** It goes from $90^\circ$ to $13.9^\circ$ with no command except "zero angle of attack". The gravity turn did all of that steering, open loop.

**Change frames.** Stage 2's guidance works in the **inertial frame** — the frame that does not spin with the Earth. At the equator the launch pad already moves east at about 465 m/s because of **[[Earth's rotation|earth-spin]]**. Adding that in, the staging state is a radial (upward) speed $v_r = 758.6\ \mathrm{m/s}$, a horizontal speed $v_t = 3527.5\ \mathrm{m/s}$, and an inertial flight-path angle of $12.1^\circ$. This module uses that state [[whenever staging feeds the next phase|staging-bridge]].

**Sanity check.** The inertial speed is $\sqrt{758.6^2 + 3527.5^2} \approx 3608\ \mathrm{m/s}$, less than half of the roughly 7.8 km/s needed for a low orbit. Stage 2 still has most of the work to do.
:::

## Gravity loss and drag loss: a trade neither extreme wins

Rocket engines could, in empty space with no gravity, add a certain total speed — the "ideal" $\Delta v$ from the rocket equation. Two **losses** eat into it on the way up.

**Gravity loss** is the speed gravity steals while you climb. From the along-path equation, every second at flight-path angle $\gamma$ costs $g\sin\gamma$ of speed. Add it up over the flight — that adding-up is an integral, $\int \ldots\,dt$ — and you get

$$
\Delta v_{\text{grav}} = \int g(r)\sin\gamma \; dt .
$$

**Drag loss** is the speed the air steals:

$$
\Delta v_{\text{drag}} = \int \frac{D}{m}\; dt .
$$

The kick angle sets the balance between them.

- A **smaller** kick keeps the rocket nearly vertical for longer. It crosses the thick lower air quickly and at modest speed, so drag loss is small. But it spends a long time fighting gravity nearly head-on, so gravity loss is large.
- A **bigger** kick lays the rocket over sooner. It stops fighting gravity head-on, so gravity loss falls. But it now races along low in the thick air — and past a point it trades far too much.

::: example What the kick angle actually costs
Fly the same vehicle four times, changing only the pitch-kick angle. The losses here are measured with the inertial flight-path angle, and "burnout" is the end of stage 1:

| kick | burnout $h$ | burnout $\gamma$ | gravity loss | drag loss | max-$\bar q$ |
| --- | --- | --- | --- | --- | --- |
| $1.0^\circ$ | 105.5 km | $39.5^\circ$ | 723.5 m/s | 25.9 m/s | 35.3 kPa |
| $2.0^\circ$ | 60.4 km | $12.1^\circ$ | 434.1 m/s | 37.1 m/s | 44.6 kPa |
| $3.0^\circ$ | 19.8 km | $-3.4^\circ$ | 223.4 m/s | 215.2 m/s | 479.9 kPa |
| $4.0^\circ$ | (impacts before burnout) | — | 71.8 m/s | 1481.2 m/s | 2748.8 kPa |

**At $1.0^\circ$** the rocket stays too vertical. It is still climbing at nearly $40^\circ$ at burnout. Gravity loss is $723.5 - 434.1 = 289.4$ m/s worse than at $2.0^\circ$ — almost 300 m/s thrown away.

**At $3.0^\circ$** the flight-path angle has gone *negative* by burnout. The rocket is diving back into thicker air at high speed. Drag loss is $215.2 / 37.1 \approx 5.8$ times the $2.0^\circ$ value, and peak dynamic pressure is $479.9 / 44.6 \approx 10.8$ times higher. No rocket structure survives that.

**At $4.0^\circ$** the dive reaches the ground before the stage finishes burning.

Too little kick wastes propellant on gravity. Too much swaps a propellant problem you could live with for a structural one you cannot. The $2.0^\circ$ case is not *the* exact optimum — a real kick comes from the offline trajectory optimization later in this module — but it sits in the narrow band where both losses stay moderate.
:::

::: key
Gravity loss $\Delta v_{\text{grav}} = \int g\sin\gamma\,dt$ and drag loss $\Delta v_{\text{drag}} = \int (D/m)\,dt$ trade against the steepness of the ascent. Flying too vertical for too long wastes propellant on gravity loss; pitching over too aggressively drives the vehicle back into thick air at speed, exploding drag loss and dynamic pressure together. The pitch program sits in a narrow compromise band, not at either extreme.
:::

## Max-Q, staging, and the handoff to closed-loop guidance

**Max-Q.** Dynamic pressure is $\bar q = \tfrac12 \rho v^2$: air density $\rho$ ("rho") times speed squared, halved. On the way up, the rocket speeds up while the air thins out. Density falls off exponentially with height, while the speed grows much more gently with time. So their product rises, peaks once, and falls. That single peak is **max-Q** — the moment of hardest air push, and the structural high point of the flight. For orbital launchers it is typically 25 to 40 kPa at 10 to 14 km. Our vehicle, flown at full thrust with no throttling down, peaks a little higher, at 44.6 kPa. The gravity turn is flown through max-Q as close to zero angle of attack as the rocket and the wind allow. The next lesson explains why closed-loop steering is switched off for exactly this window.

**Staging.** **Staging** is dropping the spent lower stage and lighting the next one. It happens when the lower stage runs out of propellant, wherever that falls on the path the gravity turn produced. Here that is $t = 151.5$ s, $h = 60.4$ km, air-relative $\gamma = 13.9^\circ$: far past max-Q, with dynamic pressure down to 1.4 kPa, about 3% of its peak.

**The handoff.** That low dynamic pressure is what allows the last phase. **Exoatmospheric closed-loop guidance** — "exoatmospheric" means outside the atmosphere — switches on once dynamic pressure has fallen to a small fraction of its peak. Only then can the rocket turn its nose however the target orbit demands without the air bending it. For a first stage that burns this far up, treating staging as the moment guidance takes over is a fair model. Some real vehicles close the loop somewhat earlier, once their own dynamic pressure has dropped enough.

From here on the path stops being a fixed shape. It becomes the answer to a question re-asked every guidance cycle: from where I am now, how do I steer to the target orbit?

::: warning
"Zero angle of attack" does not mean "the rocket points along some drawn line". It means the commanded attitude follows the *velocity vector*, updated all the time. That is why the gravity turn steers itself instead of being a stored table. A rocket flying a fixed, precomputed attitude-versus-time table is doing something different: an open-loop pitch *program*. It matches a gravity turn on the planned day, but it does not automatically adjust if the real path drifts away from the plan.
:::

## Check yourself

::: check
Use the sideways equation of motion to explain why a rocket cannot begin a gravity turn from a perfectly vertical climb without some outside disturbance.
:::

::: answer
The flight-path angle obeys $v\dot\gamma = (v^2/r - g(r))\cos\gamma$ at zero angle of attack. At $\gamma = 90^\circ$, $\cos\gamma = 0$, so the right-hand side is zero and $\dot\gamma = 0$ — whatever the values of $v$, $r$ and $g$. Nothing in the motion makes $\gamma$ leave $90^\circ$; the balance is exact, not approximate. A deliberate disturbance — the pitch kick — must give $\gamma$ a start away from vertical. After that, the same equation carries the rocket over on its own.
:::

::: check
Why does an unpowered gravity turn above the air settle into level, circular flight rather than pitching over forever?
:::

::: answer
The equation $v\dot\gamma = (v^2/r - g(r))\cos\gamma$ is zero not only at $\gamma = 90^\circ$ but also whenever $v^2/r = g(r)$ — exactly when the speed equals the circular-orbit speed at the current radius. There, gravity supplies precisely the inward pull the curved path needs, with none left over to keep turning $\gamma$. So the trajectory stops pitching down. It is the same equation that forced the kick in the first place, now settled at its other zero.
:::

::: check
A stage-1 gravity turn is flown with a smaller pitch-kick angle than the design value. Without redoing the whole trajectory, predict whether gravity loss and drag loss each go up or down, and say why.
:::

::: answer
A smaller kick keeps the rocket closer to vertical for longer. Gravity loss goes **up**: $\sin\gamma$ stays nearer to 1 for more of the burn, so gravity subtracts more speed each second. Drag loss goes **down**: the rocket climbs out of the thick lower air sooner and spends less time moving fast through it. The two move in opposite directions, which is why the kick angle is a compromise and not something to push to either extreme.
:::

::: check
In the worked ascent, staging happens at 60.4 km with dynamic pressure down to about 1.4 kPa, roughly 3% of the 44.6 kPa peak. Why is that low dynamic pressure — rather than the staging altitude or speed on their own — what matters for what happens right afterward?
:::

::: answer
It is $\bar q$ that turns a steering command into a bending load on the airframe (the next lesson puts numbers on this). A different rocket could stage lower with much more air load still present — and it would not be safe to close the guidance loop yet, whatever altitude the display showed. Altitude and speed matter only through what they do to $\bar q$. It is $\bar q$ that gates the handoff.
:::

::: check
A design team wants a bigger pitch kick than the $2.0^\circ$ of the worked example, arguing it cuts gravity loss and so adds payload. Using the four-case table, what is wrong with judging the idea on gravity loss alone?
:::

::: answer
Gravity loss does fall as the kick grows: 434.1 m/s at $2.0^\circ$, 223.4 m/s at $3.0^\circ$, 71.8 m/s at $4.0^\circ$. On that number alone a bigger kick looks better. But drag loss climbs much faster over the same range — 37.1, then 215.2, then 1481.2 m/s — and peak dynamic pressure goes from 44.6 to 479.9 to 2748.8 kPa. The last two would break the rocket, and at $4.0^\circ$ it hits the ground before burnout. Both losses come from the same steering choice, so you cannot judge one alone. And the limit that bites first here is not propellant at all; it is whether the structure survives.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\dot v = T/m - D/m - g(r)\sin\gamma$ | along-path (speed) equation at zero AoA — same as the flat-Earth form |
| $v\dot\gamma = (v^2/r - g(r))\cos\gamma$ | sideways (turning) equation on a curved planet |
| $\gamma = 90^\circ \Rightarrow \dot\gamma = 0$ | vertical flight is an equilibrium — the reason the pitch kick is needed |
| $v^2/r = g(r) \Rightarrow \dot\gamma = 0$ | the circular-orbit condition — the gravity turn's natural endpoint |
| Pitch kick | a one-time, small, open-loop attitude nudge that breaks the vertical equilibrium |
| Gravity turn | zero-AoA flight in which gravity turns the path over by itself |
| $\Delta v_{\text{grav}} = \int g\sin\gamma\,dt$ | gravity loss; grows with a more vertical ascent |
| $\Delta v_{\text{drag}} = \int (D/m)\,dt$ | drag loss; grows with a flatter ascent that dives back into thick air |
| Worked vehicle, $2^\circ$ kick | max-$\bar q$ 44.6 kPa at $t=63.6$ s; staging at $t=151.5$ s, $h=60.4$ km, $\bar q \approx 1.4$ kPa |
| Staging | dropping the lower stage once its propellant is gone, wherever that falls on the path |
| Closed-loop handoff | allowed by low dynamic pressure, not by altitude or speed alone |

The next lesson stays inside the atmosphere and answers the question this one put off: exactly why closed-loop steering is switched off through max-Q, using the load measure from the atmospheric flight module, and what the pitch program does instead.

::: context angle-of-attack Nose versus direction of travel
The angle of attack is the angle between the rocket's long axis and the direction the air is streaming past it. At zero, the air meets the nose head-on and the push on the body is almost all straight back — plain drag. Tilt the nose and the air starts shoving on the side of the long, thin body, the way wind shoves a flag.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g transform="translate(90,125) rotate(-50)">
    <rect x="0" y="-9" width="120" height="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <polygon points="120,-9 142,0 120,9" fill="#1f2a44"/>
  </g>
  <line x1="90" y1="125" x2="263" y2="25" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="263,25 250,26 256,36" fill="#b4232c"/>
  <path d="M 150 53 A 90 90 0 0 1 168 80" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="172" y="66" font-size="14" fill="#1f2a44">α</text>
  <text x="200" y="100" font-size="12" fill="#b4232c">velocity</text>
  <text x="60" y="45" font-size="12" fill="#1d6fd1">body axis</text>
</svg>
```

Here the body axis is drawn at $50^\circ$ above the horizontal and the velocity at $30^\circ$, so $\alpha = 20^\circ$ — far more than a rocket would ever fly in thick air.
:::

::: context flight-path-angle Measuring the climb from the horizon
The flight-path angle $\gamma$ is measured between the velocity and the local horizontal — the line at right angles to "straight down" at the rocket's current spot. It is about the *path*, not the nose. A rocket at zero angle of attack has its nose along the path too, so for a gravity turn the two coincide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="330" y2="120" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="250" y="140" font-size="12" fill="#6c7a93">local horizontal</text>
  <line x1="80" y1="120" x2="253" y2="20" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="253,20 240,21 246,31" fill="#1d6fd1"/>
  <text x="200" y="36" font-size="12" fill="#1d6fd1">velocity v</text>
  <path d="M 160 120 A 80 80 0 0 0 149 80" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="166" y="106" font-size="14" fill="#1f2a44">γ = 30°</text>
</svg>
```

Straight up is $90^\circ$, level is $0^\circ$, and a negative $\gamma$ means the rocket is heading down — the diving $3^\circ$-kick case in this lesson.
:::

::: context centripetal The pull a curved path needs
Whirl a ball on a string. The instant you let go it flies off in a straight line, because nothing is pulling it inward any more. To keep anything on a circle of radius $r$ at speed $v$, something must pull it toward the center with an acceleration $v^2/r$. The word comes from Latin for "center-seeking". For a satellite, gravity is the string. At the worked staging point, $v^2/r$ is only about $2.0\ \mathrm{m/s^2}$ against a gravity of about $9.6\ \mathrm{m/s^2}$, so gravity is still winning and the path is still bending down. In orbit, the two are equal.
:::

::: context mu-gravity One number for Earth's pull
Newton's law of gravity says the pull per kilogram is $GM/r^2$. Engineers multiply Earth's mass $M$ by the gravitational constant $G$ once and call the product $\mu$ ("mu"): $3.986 \times 10^{14}\ \mathrm{m^3/s^2}$. It is known far more precisely than $G$ or $M$ separately, because it is measured directly from satellite orbits. At the surface it gives about $9.80\ \mathrm{m/s^2}$; at the 60.4 km staging altitude, about $9.62\ \mathrm{m/s^2}$ — only 2% weaker. Gravity barely fades during an ascent.
:::

::: context pencil-equilibrium A pencil on its tip
An equilibrium is a state where nothing changes as long as nothing disturbs it. A pencil balanced perfectly on its point is one: in theory it stands forever. The rocket going straight up is the same, with one difference that matters. The pencil topples at the tiniest breath, while the rocket's small real-world disturbances would tip it by an unknown amount in an unknown direction. Guidance wants the lean-over to happen in the right direction, by the right amount, at the right time — so it makes its own disturbance, the pitch kick, instead of waiting for a random one.
:::

::: context dynamic-pressure Your hand out of a car window
Hold your flat hand out of a car window. At walking pace you feel nothing. At highway speed the air shoves hard. That shove per square meter grows with the square of speed — twice as fast, four times the push — and with how thick the air is. Dynamic pressure $\bar q = \tfrac12\rho v^2$ measures exactly this. At 44.6 kPa, each square meter of the rocket's front meets roughly the weight of 4.5 metric tons of air push.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,180.0 60,176.5 80,164.3 100,142.1 120,111.0 140,77.2 160,51.5 167,46.2 180,51.8 200,71.4 220,98.5 240,124.3 260,144.8 280,159.0 300,167.6 320,172.4 343,175.7"/>
  <circle cx="167" cy="46.2" r="4" fill="#b4232c"/>
  <text x="175" y="40" font-size="12" fill="#b4232c">max-Q 44.6 kPa, 63.6 s</text>
  <circle cx="343" cy="175.7" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="300" y="150" font-size="11" fill="#1f2a44">staging</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="198">0</text><text x="140" y="198">50</text><text x="240" y="198">100</text><text x="340" y="198">150 s</text>
  </g>
  <text x="46" y="26" font-size="11" fill="#1f2a44">q̄ (kPa)</text>
</svg>
```

The curve is the worked ascent: one hump, then a long tail.
:::

::: context earth-spin A free head start
Earth turns once every 23 hours 56 minutes (a sidereal day). A point on the equator goes around a circle of radius 6378 km in that time, so it moves east at about $465\ \mathrm{m/s}$ — faster than the speed of sound at sea level. A rocket sitting on an equatorial pad already has that speed before it lights its engines, and launching east keeps it. That is why most launch sites are as close to the equator as a country can put them, and why rockets almost always head east. Air-relative speeds ignore this bonus; inertial speeds include it.
:::

::: context staging-bridge Where this state goes next
The staging state here — $v_r = 758.6$ m/s up, $v_t = 3527.5$ m/s sideways, $12.1^\circ$, at 60.4 km — is the starting point for the closed-loop guidance built in the next lessons. The lesson on Powered Explicit Guidance flies stage 2 from exactly this state to orbit, re-solving its steering every few seconds. The abort-modes lesson at the end of the module comes back to the energy stored in it.
:::
