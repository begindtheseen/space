---
id: l12-long-term-evolution-lifetime
title: Long-term orbit evolution and lifetime estimation
minutes: 21
covers:
  - long-term orbit evolution and lifetime estimation
  - perturbation sources ranked by magnitude in LEO and GEO
---

The first lesson of this module showed a ranking of perturbations at two altitudes and promised that the rest of the module would earn each entry. Every perturbation has now been derived, sized, and in most cases checked by direct numerical integration. So now you can build the complete picture — not only low orbit and geostationary orbit, but also a sun-synchronous orbit and a **[[highly eccentric one|molniya-heo]]**, and for the eccentric orbit, at both ends.

What comes out is not one fixed ranking that holds everywhere. It is a ranking that reorders itself completely depending on where the spacecraft is — sometimes within a single orbit.

This closing lesson builds that comparison. Then it turns to the question all these perturbations finally feed: how long does an orbit last, what decides the answer, and how honestly can you state it, given everything this module has shown about the uncertainty in the inputs?

## One table, five places

Think of the forces on a spacecraft like the noises in a room. In a quiet library, a ticking clock is the loudest thing you hear. Put the same clock at a rock concert and nobody notices it. The clock did not change; the room did. Perturbations work the same way: each one's size is fixed by physics, but which one "matters" depends on where you are.

Each entry below is computed the way earlier lessons derived it:

- $J_2$ from its Cartesian formula at the equator crossing;
- higher harmonics ($J_3$, $J_4$) from the general zonal formula at a representative latitude (the value swings by a factor of a few with latitude, hence the "$\sim$");
- drag from the drag lesson's quiet-Sun and active-Sun density bracket, with $B = 100\,\mathrm{kg/m^2}$ (the circular columns use the speed through the rotating air at the equator; the HEO perigee column uses the actual perigee speed, $10.0\,\mathrm{km/s}$);
- third-body pull from the exact lunar and solar difference formulas, with the spacecraft on the line toward the Moon or Sun (the worst case);
- solar radiation pressure (SRP) for the $A/m = 0.02\,\mathrm{m^2/kg}$, $C_r = 1.3$ spacecraft used throughout.

| Acceleration ($\mathrm{m/s^2}$) | LEO, $400\,\mathrm{km}$ | SSO, $700\,\mathrm{km}$ | GEO | HEO perigee, $528\,\mathrm{km}$ | HEO apogee, $39\,839\,\mathrm{km}$ |
| --- | --- | --- | --- | --- | --- |
| Two-body | $8.676$ | $7.956$ | $0.2242$ | $8.357$ | $0.1866$ |
| $J_2$ | $1.248\times10^{-2}$ | $1.049\times10^{-2}$ | $8.33\times10^{-6}$ | $1.158\times10^{-2}$ | $5.77\times10^{-6}$ |
| Higher harmonics | $\sim3.3\times10^{-5}$ | $\sim2.6\times10^{-5}$ | $\sim3.5\times10^{-9}$ | $\sim3.0\times10^{-5}$ | $\sim2.2\times10^{-9}$ |
| Drag (quiet–active) | $2.6\times10^{-7}$–$1.0\times10^{-5}$ | $6\times10^{-10}$–$2.3\times10^{-7}$ | negligible | $4\times10^{-8}$–$4.1\times10^{-6}$ | negligible |
| Lunar third body | $1.20\times10^{-6}$ | $1.26\times10^{-6}$ | $8.68\times10^{-6}$ | $1.23\times10^{-6}$ | $9.69\times10^{-6}$ |
| Solar third body | $5.37\times10^{-7}$ | $5.61\times10^{-7}$ | $3.34\times10^{-6}$ | $5.48\times10^{-7}$ | $3.67\times10^{-6}$ |
| SRP | $1.19\times10^{-7}$ | $1.19\times10^{-7}$ | $1.19\times10^{-7}$ | $1.19\times10^{-7}$ | $1.19\times10^{-7}$ |

Here LEO is low Earth orbit, SSO a sun-synchronous orbit, GEO geostationary orbit ($r = 42\,164\,\mathrm{km}$), and HEO a highly eccentric orbit shaped like a Molniya orbit.

::: example Reading the ordering, column by column
**LEO, $400\,\mathrm{km}$.** $J_2$ beats everything else by two to five orders of magnitude: $1.248\times10^{-2}/3.3\times10^{-5} \approx 380$ over the higher harmonics, and $1.248\times10^{-2}/1.19\times10^{-7} \approx 10^5$ over SRP. Below $J_2$ the order is genuinely unclear. Drag spans $2.6\times10^{-7}$ to $1.0\times10^{-5}$, a factor of about $40$, so at an active Sun it rivals the higher harmonics, and at a quiet Sun it drops below the Moon. You cannot rank it until you know where in the solar cycle you are.

**SSO, $700\,\mathrm{km}$.** Only $300\,\mathrm{km}$ higher, drag has fallen by a factor of about $40$ to $400$ — its exponential dependence on altitude, against $J_2$'s much gentler $r^{-4}$. At a quiet Sun, $6\times10^{-10}$, it sits at the *bottom* of the table, about $200$ times below even SRP. That is the opposite end from where it sat at $400\,\mathrm{km}$.

**GEO.** $J_2$ ($8.33\times10^{-6}$) and the Moon ($8.68\times10^{-6}$) are within about $4\%$ of each other: $8.68/8.33 \approx 1.04$. Neither dominates. The Sun trails the Moon by a factor of about $2.6$ ($8.68/3.34$). Drag has vanished. SRP is still the smallest row, but now within a factor of $70$ of $J_2$ ($8.33\times10^{-6}/1.19\times10^{-7}$), instead of $10^5$.

**HEO.** The two HEO columns are the most striking. The *same spacecraft on the same orbit* looks almost exactly like the $400\,\mathrm{km}$ case at perigee, and almost exactly like the geostationary case at apogee — where the Moon now beats $J_2$, $9.69\times10^{-6}$ against $5.77\times10^{-6}$. It passes through both worlds once every revolution.
:::

## Four scaling rules explain every column

Four facts from earlier lessons explain the whole table.

**$J_2$ falls as $r^{-4}$.** The two-body pull falls as $r^{-2}$, so $J_2$'s *relative* importance fades as $r^{-2}$. Check it with the table: from LEO to GEO, $r$ grows by $42\,164/6778 \approx 6.22$ times, so $J_2$ should shrink by $6.22^4 \approx 1500$ times. Indeed $1.248\times10^{-2}/8.33\times10^{-6} \approx 1500$.

**Third-body pull grows roughly as $r$.** What disturbs an orbit around Earth is the *difference* between the Moon's pull on the spacecraft and on Earth, and that difference grows with the spacecraft's distance from Earth's center. Two curves heading opposite ways **[[must cross|j2-moon-crossing]]** — and for the Moon and $J_2$, they cross close to geostationary altitude.

**Drag falls off exponentially with altitude.** It is enormous at $400\,\mathrm{km}$ and negligible within a few hundred kilometers more. It behaves like neither of the others.

**SRP is almost flat.** It depends on distance from the *Sun*, not from Earth, so it is the same in every column.

No single sentence like "$J_2$ is the dominant perturbation" or "third-body pull is negligible" survives all five columns at once. Each is true only in its own regime.

::: key Which perturbation matters where
$J_2 \propto r^{-4}$ (relative importance $\propto r^{-2}$); third body $\propto r$ (grows with altitude); drag falls off exponentially with altitude and matters only in low orbit; SRP is nearly constant with altitude near Earth.

At $400\,\mathrm{km}$: two-body ≈ 8.7 m/s² · $J_2$ ≈ 1.2 × 10⁻² · higher geopotential harmonics ≈ 10⁻⁵ · drag ≈ 10⁻⁶ to 10⁻⁵ (solar-cycle dependent) · lunar third body ≈ 10⁻⁶ · solar third body ≈ 5 × 10⁻⁷ · SRP ≈ 10⁻⁷. In short, $J_2 \gg$ higher harmonics $\gtrsim$ drag $\gtrsim$ lunisolar $\gg$ SRP, with drag's exact place uncertain by more than a factor of ten.

At GEO: two-body ≈ 0.22 m/s² · $J_2$ ≈ 10⁻⁵ · lunar third body ≈ 7 × 10⁻⁶ · solar third body ≈ 3 × 10⁻⁶ · SRP ≈ 10⁻⁷ to 10⁻⁶ · drag negligible. In short, $J_2 \approx$ lunisolar $\gg$ SRP, drag absent. A single eccentric orbit can pass through both regimes every revolution.
:::

(The key's GEO lunar value, $7\times10^{-6}$, is the first lesson's tidal approximation $2\mu_3 r/d^3$. The table's $8.68\times10^{-6}$ is the exact worst case, with the Moon straight overhead.)

## What each perturbation does over years

A table of accelerations is a snapshot. A mission cares about what each force *does* over months and years. Put the module's results side by side:

**$J_2$ turns the orbit, but does not shrink it.** It drives the steady drift of the node and perigee derived in the $J_2$ secular-effects lesson. That drift shapes designs — sun-synchronous orbits, frozen orbits — but it does not end a mission, because $J_2$ causes no secular change in $a$ or $e$.

**Drag ends low orbits.** It is the one perturbation in this module that reliably finishes a low satellite, through the steady, one-way decay derived in the drag lesson.

**The Moon and Sun rule GEO.** Negligible for a low orbit's lifetime, third-body pull is the main long-term driver of inclination and node drift at geostationary altitude. That is why geostationary station-keeping is mostly an ongoing fight against the Moon and Sun, not against Earth's own gravity field.

**SRP is small, but patient.** It is tiny everywhere in the table, yet for objects with a **[[high area-to-mass ratio|high-area-to-mass]]** — spent rocket stages, large deployed structures, loose thermal blankets — it can pump up eccentricity over years until perigee dips into the atmosphere. That is a slow-motion, SRP-driven route to the same re-entry drag produces directly.

So "lifetime" means different things at different heights. In low orbit, lifetime is a drag question, full stop. At geostationary altitude there is essentially no air to decay into, so nothing removes a dead satellite naturally on any timescale that matters.

## Lifetime in low orbit is a drag question

Recall the drag lesson's decay rate for a near-circular orbit:

$$
\frac{da}{dt} = -\frac{\rho\,n\,a^2}{B},
$$

where $\rho$ is the air density, $n$ the mean motion, $a$ the semi-major axis and $B = m/(C_D A)$ the ballistic coefficient. The lesson integrated it from $400\,\mathrm{km}$ down to a $120\,\mathrm{km}$ re-entry altitude with two exponential density models: a quiet Sun, $\rho = 1\times10^{-12}\,e^{-(h-400)/50}\,\mathrm{kg/m^3}$, and an active Sun, $\rho = 4\times10^{-11}\,e^{-(h-400)/80}\,\mathrm{kg/m^3}$, with $h$ the altitude in kilometers.

::: example The drag-dominated lifetime question, revisited
Integrating the decay rate from $400\,\mathrm{km}$ to $120\,\mathrm{km}$:

| $B\ (\mathrm{kg/m^2})$ | Lifetime, active Sun | Lifetime, quiet Sun |
| --- | --- | --- |
| $50$ | $21.7$ days | $556.6$ days |
| $100$ | $43.4$ days | $1113.3$ days |
| $200$ | $86.8$ days | $2226.6$ days |

**Down a column.** Doubling $B$ doubles the lifetime exactly: $43.4 = 2\times21.7$ and $86.8 = 2\times43.4$. That has to happen, because $B$ appears only in the denominator of $da/dt$.

**Across a row.** The quiet-Sun lifetime divided by the active-Sun one is $1113.3/43.4 \approx 25.7$ (with unrounded lifetimes, $25.64$), the same for every $B$. The atmosphere alone swings the answer by a factor of about $25$.

**The shape of the fall.** Most of the time is spent high up, where the air is thin; the last hundred kilometers go in a few weeks. The **[[decay curve|decay-curve]]** bends sharply down at the end.

**What about everything else?** Every other perturbation in the table is present throughout the descent. In this density model, $J_2$ stays larger than drag all the way down to the $120\,\mathrm{km}$ line — drag overtakes it only in the final plunge through the thick lower air. Yet $J_2$ does not decide *when* re-entry happens. Only the steady, one-way energy loss from drag does. So re-entry prediction is fundamentally a drag-and-atmosphere problem, even though the full force model used to compute the path includes every perturbation this module derived.

**The honesty check.** The spacecraft's own properties are usually known to within a few percent. The air it flies through is known to within a factor of several.
:::

### What dominates the uncertainty

The air above $100\,\mathrm{km}$ is the **thermosphere**. Its density rises and falls with the **[[Sun's 11-year activity cycle|solar-cycle]]**, changing by a factor of several at a fixed altitude between solar minimum and maximum. It also responds to geomagnetic storms within hours. No model can forecast those storms weeks ahead.

The ballistic coefficient carries uncertainty too. $C_D$ is known only roughly, and $A$ depends on how the spacecraft is pointed. A dead satellite that is **tumbling** presents an area that averages over all its faces. One that stays in a stable attitude may fly edge-on, or broadside, to the flow — a difference of several times in $A$ for a flat solar panel. Still, density is the leading term.

::: key What dominates the uncertainty in a LEO lifetime prediction
Thermospheric density, which varies by a factor of several over the solar cycle and responds to geomagnetic storms within hours. Ballistic-coefficient uncertainty and attitude (tumbling vs stable) matter too, but density is the leading term — which is why **[[re-entry predictions|reentry-windows]]** are quoted with wide windows until the final orbits.
:::

## At GEO there is no natural end

A geostationary satellite has no atmosphere to fall into. $J_2$, the Moon and the Sun reshape and tilt its orbit, but none of them steadily removes orbital energy the way drag does. Left alone, a dead satellite would stay in or near the geostationary belt essentially forever, a hazard to every working satellite sharing that ring.

So the international guideline, from the Inter-Agency Space Debris Coordination Committee (IADC), is to spend the last of the propellant boosting the satellite into a **[[graveyard orbit|graveyard-orbit]]** a few hundred kilometers above the belt. The region is too quiet, not too active, to clean itself up.

::: example How high the graveyard sits, and what it costs
The IADC guideline asks for a minimum raise of the orbit above geostationary altitude of

$$
\Delta H = 235\,\mathrm{km} + 1000\cdot C_R\cdot\frac{A}{m}\,\mathrm{km},
$$

with $A/m$ in $\mathrm{m^2/kg}$. The $235\,\mathrm{km}$ is the top of the protected zone around the belt ($200\,\mathrm{km}$ above GEO) plus $35\,\mathrm{km}$ for the Moon, Sun and gravity field to wobble the orbit back down. The second term adds margin for the eccentricity that SRP will pump up over the years.

**Step 1: the raise.** For this lesson's spacecraft, $C_R = 1.3$ and $A/m = 0.02\,\mathrm{m^2/kg}$: $1000\times1.3\times0.02 = 26$, so $\Delta H = 235 + 26 = 261\,\mathrm{km}$.

**Step 2: the speed at GEO.** $v = \sqrt{\mu/r} = \sqrt{398\,600.4418/42\,164.137} = 3.0747\,\mathrm{km/s}$.

**Step 3: the two-burn transfer.** A Hohmann transfer from $r_1 = 42\,164\,\mathrm{km}$ to $r_2 = 42\,425\,\mathrm{km}$ needs a first burn of $4.74\,\mathrm{m/s}$ and a second of $4.73\,\mathrm{m/s}$, about $9.47\,\mathrm{m/s}$ in all.

**Sanity check.** For a small raise, the total is close to $v\,\Delta r/(2r) = 3074.7\times261/(2\times42\,164) \approx 9.5\,\mathrm{m/s}$. It matches. For a satellite that spends roughly $50\,\mathrm{m/s}$ a year on station-keeping, that is a few months of fuel — a small price for leaving the belt clean.
:::

::: warning A perturbation ranking learned at one altitude does not transfer
The most common mistake this module's examples were built to prevent: learning "$J_2$ dominates, everything else is a footnote" in low orbit and carrying it, unexamined, into a geostationary or high-apogee analysis, where it is false. Every force-model decision — which perturbations to include, which to drop, which uncertainty to carry into a lifetime or collision estimate — has to be re-justified for the orbit in front of you, using a table like this lesson's, not a rule of thumb from a different altitude.
:::

## Check yourself

::: check
A GEO satellite's operator reports spending far more propellant on inclination (north–south) station-keeping than on any other correction. Using this lesson's table, name the perturbation most responsible, and explain why the equivalent correction is minor for a $400\,\mathrm{km}$ mission.
:::

::: answer
Lunisolar third-body pull. It tilts the orbit plane out of the equator, and at geostationary altitude it is as large as $J_2$ — within about $4\%$ for the Moon alone, $8.68$ against $8.33\times10^{-6}\,\mathrm{m/s^2}$ — with the Sun adding more. A geostationary mission cannot design around it the way a low mission designs around $J_2$'s predictable node drift, so it must be fought with propellant.

At $400\,\mathrm{km}$, the same lunisolar terms are about four orders of magnitude smaller than $J_2$ ($1.2\times10^{-6}$ against $1.25\times10^{-2}$), so they barely touch a low mission's propellant budget. There, $J_2$'s drift is either used by design (as in a sun-synchronous orbit) or causes no secular change in $a$ and $e$ that would need correcting.
:::

::: check
Explain why a highly eccentric orbit cannot be given a single "dominant perturbation" the way a circular orbit at one altitude can.
:::

::: answer
An eccentric orbit sweeps through a wide range of altitudes every revolution, and the table shows the ranking depends strongly on altitude. Near perigee the orbit is dominated by $J_2$ and, if perigee is low enough, drag. Near a high apogee, $J_2$ and lunisolar pull are comparable — at the HEO apogee in the table, the Moon even wins.

The same spacecraft lives in both regimes every orbit, so "the dominant perturbation" only makes sense once you also say *where in the orbit*.
:::

::: check
Why is a geostationary satellite boosted to a graveyard orbit at end of life, instead of being left to decay the way a low satellite does?
:::

::: answer
There is essentially no atmosphere at geostationary altitude, so drag — the one perturbation that reliably ends a low orbit — is absent. Nothing else in the table grows without limit the way drag-driven decay does. $J_2$ and lunisolar pull change the orbit's shape and orientation, but they do not steadily remove orbital energy.

Without an active disposal maneuver, a dead geostationary satellite would stay in or near the working belt indefinitely. Moving it to a graveyard orbit — about $261\,\mathrm{km}$ higher for this lesson's spacecraft, for under $10\,\mathrm{m/s}$ — is therefore standard end-of-life practice, rather than waiting for a natural decay that will not come.
:::

::: check
A mission planner must decide, for a new $700\,\mathrm{km}$ sun-synchronous mission, whether atmospheric drag belongs in the force model used for ten-year propellant budgeting. Using this lesson's table, what would you tell them?
:::

::: answer
At $700\,\mathrm{km}$, drag spans roughly $6\times10^{-10}$ to $2.3\times10^{-7}\,\mathrm{m/s^2}$ from quiet Sun to active Sun. That is already about $40$ to $400$ times below its $400\,\mathrm{km}$ values, and at a quiet Sun it is smaller than SRP.

It should still be in the model. An active Sun brings it back up to a size worth tracking, and a ten-year budget will almost certainly span at least one full solar cycle. But it is no longer the automatic main secular concern it is at $400\,\mathrm{km}$. $J_2$'s design-driving role (sun-synchronism itself) and the lunisolar and SRP contributions to long-term drift deserve comparable attention at this altitude.
:::

::: check
Two engineers disagree about whether a re-entry prediction quoted to the nearest day is meaningful. Using the numbers in this lesson, whose side does the evidence support, and why?
:::

::: answer
The evidence supports skepticism about day-level precision for any prediction made long before re-entry. The lifetime table shows that the same spacecraft's lifetime changes by a factor of about $25$ between the quiet-Sun and active-Sun density assumptions, no matter how well its ballistic coefficient is known. That is an uncertainty of months, not days.

It shrinks only as re-entry approaches and tracking data shows the density the spacecraft is actually flying through, from its observed decay. A day-level quote is defensible only close to the event itself.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $J_2 \propto r^{-4}$; third body $\propto r$; drag exponential in altitude; SRP $\approx$ constant | The four scaling rules behind every entry in the table |
| LEO ($400\,\mathrm{km}$) | $J_2 \gg$ higher harmonics $\gtrsim$ drag (uncertain) $\gtrsim$ lunisolar $\gg$ SRP |
| SSO ($700\,\mathrm{km}$) | Same order as LEO at the top, but drag falls below lunisolar — and at a quiet Sun, below SRP |
| GEO | $J_2 \approx$ lunisolar (Moon within $4\%$ of $J_2$) $\gg$ SRP; drag absent |
| HEO | Perigee looks like LEO; apogee looks like GEO; both, every orbit |
| $da/dt = -\rho n a^2/B$ | Circular-orbit decay rate; lifetime from $400\,\mathrm{km}$ is $43$ days (active Sun) to $1113$ days (quiet Sun) for $B = 100\,\mathrm{kg/m^2}$ |
| Lifetime is a drag question in LEO | Other perturbations shape the path but barely affect *when* re-entry happens |
| Density uncertainty ($\sim25\times$) dominates $B$ uncertainty | Solar cycle and storms first; $C_D$, area and attitude (tumbling vs stable) second |
| GEO disposal | No natural decay; boost to a graveyard orbit $\Delta H = 235\,\mathrm{km} + 1000\,C_R A/m$ above GEO |

This module began with a promise to earn every entry in a preview table rather than assert it. The table above keeps that promise, built from the derivations, numerical checks and honestly bracketed uncertainties of the eleven lessons before it.

::: context molniya-heo The Molniya orbit
Soviet engineers in the 1960s needed to cover high northern latitudes, which a geostationary satellite over the equator sees only near the horizon. Their answer was the Molniya ("lightning") orbit: a $12$-hour, highly eccentric orbit at the critical inclination, $63.4^\circ$, where $J_2$ does not turn the perigee.

The satellite whips through a low perigee in the south and hangs near a high apogee in the north for hours. The HEO columns here use a perigee of $528\,\mathrm{km}$ and an apogee of $39\,839\,\mathrm{km}$, drawn to scale below.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 212" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="106" rx="150" ry="100.9" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="291" cy="106" r="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="291" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">Earth</text>
  <circle cx="330" cy="106" r="3.5" fill="#b4232c"/>
  <circle cx="30" cy="106" r="3.5" fill="#b4232c"/>
  <text x="338" y="94" font-size="11" fill="#b4232c" text-anchor="end">perigee</text>
  <text x="40" y="96" font-size="11" fill="#b4232c">apogee</text>
  <text x="40" y="124" font-size="11" fill="#1f2a44">39 839 km up:</text>
  <text x="40" y="138" font-size="11" fill="#1f2a44">looks like GEO</text>
  <text x="250" y="160" font-size="11" fill="#1f2a44" text-anchor="middle">528 km up: looks like LEO</text>
</svg>
```
:::

::: context j2-moon-crossing Where J2 and the Moon trade places
Plot both accelerations against distance from Earth's center on scales where each step is a factor of ten. $J_2$'s $r^{-4}$ becomes a steep straight line down; the Moon's pull climbs gently. They cross at about $r = 41\,800\,\mathrm{km}$ — almost exactly geostationary radius, $42\,164\,\mathrm{km}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 212" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="180" x2="60" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="55" y="184">1e-7</text><text x="55" y="130.7">1e-5</text><text x="55" y="77.3">1e-3</text><text x="55" y="24">1e-1</text>
  </g>
  <line x1="74.8" y1="180" x2="74.8" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="297.1" y1="180" x2="297.1" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,4"/>
  <text x="78" y="196" font-size="11" fill="#1f2a44">LEO</text>
  <text x="297.1" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">GEO</text>
  <text x="200" y="209" font-size="11" fill="#1f2a44" text-anchor="middle">distance from Earth's center (log)</text>
  <polyline points="74.8,44.1 98.9,53.3 123.0,62.5 147.1,71.7 171.3,80.8 195.4,90.0 219.5,99.2 243.6,108.4 267.7,117.6 291.8,126.8 315.9,135.9 340.0,145.1" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="74.8,151.2 98.9,148.8 123.0,146.5 147.1,144.1 171.3,141.6 195.4,139.2 219.5,136.7 243.6,134.2 267.7,131.6 291.8,128.9 315.9,126.1 340.0,123.3" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="296.1" cy="128.4" r="4" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="60" font-size="11" fill="#1d6fd1">J2 (m/s²)</text>
  <text x="150" y="162" font-size="11" fill="#b4232c">Moon, worst case</text>
</svg>
```
:::

::: context high-area-to-mass When sunlight wins
SRP's acceleration is proportional to $A/m$, the sunlit area per kilogram. A typical satellite has about $0.02\,\mathrm{m^2/kg}$. A loose sheet of thermal blanket — thin foil that wraps spacecraft to control temperature — can have tens of square meters per kilogram, a thousand times more.

Telescope surveys of the geostationary region have found debris objects whose orbits wander in ways only such huge area-to-mass ratios explain. For them, sunlight is not a small correction at all: it can change eccentricity and inclination by large amounts within months.
:::

::: context decay-curve What the fall looks like
Here is the quiet-Sun decay for $B = 100\,\mathrm{kg/m^2}$, from the drag lesson's model. For nearly three years the orbit sinks slowly. Then, as the air thickens, each lost kilometer brings more drag, and the last stretch goes in weeks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 212" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="174">120</text><text x="45" y="134">200</text><text x="45" y="84">300</text><text x="45" y="34">400</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="196">0</text><text x="146.7" y="196">400</text><text x="243.3" y="196">800</text><text x="340" y="196">1200</text>
  </g>
  <text x="195" y="210" font-size="11" fill="#1f2a44" text-anchor="middle">days</text>
  <text x="58" y="16" font-size="11" fill="#1f2a44">altitude (km)</text>
  <line x1="50" y1="170" x2="345" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,4"/>
  <polyline points="50.0,30.0 74.2,32.4 98.3,34.9 122.5,37.8 146.7,41.1 170.8,44.9 195.0,49.3 219.2,54.7 243.3,61.6 267.5,71.1 291.7,86.5 296.5,91.2 301.3,97.0 306.2,104.5 311.0,115.2 315.8,134.3 316.8,140.8 317.8,149.6 318.7,163.3 319.0,170.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="312" y="186" font-size="11" fill="#b4232c" text-anchor="end">re-entry, day 1113</text>
</svg>
```

An active Sun squeezes the same curve into $43$ days.
:::

::: context solar-cycle The Sun's activity cycle
The Sun's activity — sunspots, flares, and its output of extreme ultraviolet light — rises and falls on a cycle of about $11$ years. That ultraviolet light heats the thermosphere. At solar maximum the upper air swells outward, and the density at a fixed height of a few hundred kilometers can be many times higher than at solar minimum.

Density models take the Sun's activity as an input. A common one is the F10.7 index: the Sun's radio brightness at a wavelength of $10.7\,\mathrm{cm}$, measured daily from the ground, which tracks the ultraviolet output well. Forecasting it years ahead is itself uncertain, and that uncertainty flows straight into every long-range lifetime estimate.
:::

::: context reentry-windows Why the windows narrow at the end
The uncertainty in a lifetime prediction is roughly a fixed *fraction* of the time left. A factor-of-two error in density makes the remaining time wrong by roughly a factor of two, whether that time is a year or an hour.

So a prediction made a month before re-entry may be uncertain by many days, while one made in the final orbits is uncertain by minutes. Even then, a spacecraft moving at about $7.8\,\mathrm{km/s}$ covers some $470\,\mathrm{km}$ of ground track per minute, which is why the impact point stays uncertain until the very end.

In 1979 the Skylab space station came down earlier than NASA had planned, because a strong solar maximum had thickened the upper atmosphere.
:::

::: context graveyard-orbit Clearing the ring
The geostationary belt is a single ring, one orbit wide, about $265\,000\,\mathrm{km}$ around. Every slot in it is valuable, and a dead satellite drifting through it threatens every working one.

The graveyard (or disposal) orbit is a parking ring a few hundred kilometers higher, where old satellites cannot wander back down into the belt. The IADC guideline's extra term, $1000\,C_R A/m$, exists because sunlight slowly stretches the retired orbit's shape, and the perigee must stay clear even after years of that stretching.
:::
