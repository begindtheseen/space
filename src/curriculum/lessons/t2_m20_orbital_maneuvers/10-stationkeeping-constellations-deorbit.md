---
id: l10-stationkeeping-constellations-deorbit
title: Station-keeping, constellations and deorbit
minutes: 23
covers:
  - station-keeping for GEO and LEO
  - constellation management, drift orbits and deorbit
---

Every maneuver so far in this module gets a spacecraft *to* somewhere. This lesson is about what happens for the years afterward. An operational orbit is not a fixed point that, once reached, takes care of itself — perturbations the next module quantifies in detail (Earth's oblateness, the Moon and Sun, atmospheric drag, solar radiation pressure) constantly nudge a real orbit away from where the mission needs it, and every one of those nudges has to be paid for with the same Δv machinery built in the last nine lessons. Station-keeping is that ongoing bill. Drift orbits and deorbit are the same machinery used deliberately, to move a satellite to a new slot or to retire it responsibly.

This lesson does not re-derive the perturbation physics that drives these budgets — that belongs to the next module, which builds $J_2$, lunisolar third-body accelerations, and atmospheric density models from scratch. What it does is show that once you know roughly how much an orbit drifts, converting that into a Δv budget uses nothing more than the plane-change and mini-Hohmann tools you already have.

## GEO north-south station-keeping

A geostationary satellite's inclination does not stay at zero on its own. The Moon and Sun pull the orbit plane out of the equatorial plane at a rate that depends on the geometry of their orbits relative to Earth's, and a representative, commonly-used figure for the resulting secular drift, if left completely uncorrected, is on the order of $0.85^\circ$ per year. Left alone for a decade, a GEO satellite would be several degrees out of the equatorial plane — useless for a fixed antenna pointed at it from the ground.

Correcting this is a pure plane change, and lesson 5 already gave you the tool: $\Delta v = 2v\sin(\Delta i/2)$, evaluated at GEO circular speed $v=3.0747\,\mathrm{km/s}$.

::: example Converting an inclination drift rate into an annual Δv budget
At the representative $0.85^\circ/\mathrm{yr}$ drift rate, correcting it once a year costs
$$
\Delta v = 2(3.0747)\sin(0.425^\circ) = 2(3.0747)(0.007417) = 0.04561\,\mathrm{km/s} = 45.6\,\mathrm{m/s/yr}.
$$
Across the plausible range of drift rates quoted for GEO ($0.75$–$0.95^\circ/\mathrm{yr}$, depending on the epoch within the roughly 18.6-year lunar nodal cycle), the same formula gives $40.3$ to $51.0\,\mathrm{m/s/yr}$ — squarely inside the $45$–$55\,\mathrm{m/s}$ per year figure operators actually budget for north-south station-keeping. This is far and away the largest single line item in a GEO satellite's lifetime propellant budget; a spacecraft designed for fifteen years of service needs on the order of $700\,\mathrm{m/s}$ just for this.
:::

::: key GEO station-keeping is dominated by north-south
North-south (inclination) correction, from lunisolar perturbation, costs roughly $45$–$55\,\mathrm{m/s}$ per year — computed directly from the plane-change formula given the drift rate. East-west (longitude drift, from Earth's slight equatorial triaxiality pulling a GEO satellite toward one of two stable longitudes) costs far less, on the order of $2$–$4\,\mathrm{m/s}$ per year, because the underlying perturbing acceleration is much weaker than the Moon and Sun's out-of-plane pull.
:::

## LEO station-keeping: making up drag

A satellite in low orbit loses energy continuously to atmospheric drag, its semi-major axis decaying at a rate that depends on air density (itself wildly variable with solar activity), the vehicle's cross-sectional area, its mass, and its drag coefficient — the ballistic coefficient the next module quantifies properly. Whatever that decay rate turns out to be, restoring lost altitude is exactly the small mini-Hohmann reboost this module has used repeatedly: raise from the decayed radius back to the operational one with a two-burn transfer.

::: example An illustrative reboost budget
Take a satellite at $500\,\mathrm{km}$ altitude ($r=6878.137\,\mathrm{km}$) that has decayed by an illustrative $2\,\mathrm{km}$ over some period — the actual number for a real mission depends on solar-cycle-driven density and is not something to guess without the density model. Restoring it with a mini-Hohmann reboost:
$$
\Delta v_1 = \Delta v_2 = 0.5533\,\mathrm{m/s}, \qquad \text{total } 1.107\,\mathrm{m/s}.
$$
Notice this scales almost exactly linearly for small $\Delta a$ — a $1\,\mathrm{km}$ decay costs $0.553\,\mathrm{m/s}$ to restore, a $4\,\mathrm{km}$ decay costs $2.213\,\mathrm{m/s}$, both essentially proportional to $\Delta a$. That linearity is what lets an operator estimate an annual reboost budget by simply multiplying a measured decay rate by this per-kilometre cost, without re-deriving the maneuver each time — but the decay rate itself is the part that varies enormously, by an order of magnitude or more between solar minimum and solar maximum at a given altitude, which is why LEO station-keeping budgets carry far more uncertainty than GEO's comparatively predictable lunisolar figure.
:::

::: warning An "annual" LEO reboost budget hides a lot of variability
Unlike GEO's north-south budget, which is driven by a slowly-varying, well-modelled lunisolar cycle, LEO drag depends on solar activity that can change the local atmospheric density by an order of magnitude within a single solar cycle. A reboost budget sized for typical conditions can be badly wrong during a solar maximum, which is why real missions carry substantial margin on this line item specifically, and why the next module's density-model-uncertainty topic exists as its own subject.
:::

## Drift orbits: relocating on purpose

The same small mini-Hohmann-and-wait technique that closes a phasing gap between chaser and target (lesson 7) is exactly how an operational GEO satellite relocates to a new longitude slot, and how a newly-deployed constellation spreads its members around a plane.

::: example Relocating a GEO satellite by 5° of longitude
Raise from $a=42\,164\,\mathrm{km}$ by $\Delta a = 25\,\mathrm{km}$: $\Delta v_1=\Delta v_2=0.456\,\mathrm{m/s}$, total one-way $0.911\,\mathrm{m/s}$. The new orbit's period is slightly longer than the sidereal day, so the satellite drifts westward relative to the ground at $0.321^\circ$/day. Closing a $5^\circ$ relocation takes $5/0.321=15.6\,\mathrm{days}$, after which a matching pair of burns lowers the satellite back to GEO altitude at its new slot. Total Δv for the whole relocation: $2\times0.911=1.82\,\mathrm{m/s}$ — trivial next to the annual station-keeping budget, but the operation takes over two weeks, the same Δv-for-time trade this module has shown repeatedly.
:::

A freshly-launched constellation uses the identical idea without even needing a dedicated "wait" phase: satellites released from a single launch vehicle at slightly different times, or raised to their operational altitude on slightly different schedules, naturally accumulate different amounts of along-track drift before they are all circularised at the same final altitude, spreading them around the plane at whatever spacing the mission design calls for — precisely the "slow raise doubles as phasing" point made about low-thrust deployment in the last lesson, now recognisable as a special case of the general drift-orbit technique.

## End of life: deorbit and graveyard disposal

A mission's last maneuver disposes of the spacecraft, and the cost of doing so responsibly depends enormously on where the satellite operates. In LEO, disposal usually means lowering perigee into the atmosphere and letting drag finish the job.

::: example Deorbiting from a 700 km orbit
$r=7078.137\,\mathrm{km}$, $v_c=7.5043\,\mathrm{km/s}$. Drop perigee to $100\,\mathrm{km}$ altitude ($r_p = 6478.137\,\mathrm{km}$) with a single retrograde burn: transfer semi-major axis $a=(7078.137+6478.137)/2=6778.14\,\mathrm{km}$, apoapsis speed on that ellipse $v=7.3363\,\mathrm{km/s}$, so $\Delta v = 7.5043-7.3363=167.95\,\mathrm{m/s}$. One burn, no second impulse needed — the vehicle is not trying to re-circularise, only to guarantee the atmosphere takes over.
:::

::: example Disposing of a GEO satellite instead
GEO's real estate is too valuable, and the altitude too high, to deorbit into the atmosphere at any reasonable Δv — international guidelines instead call for raising into a supersynchronous graveyard orbit a few hundred kilometres above GEO. Raising by $300\,\mathrm{km}$: $\Delta v_1=5.445\,\mathrm{m/s}$, $\Delta v_2=5.435\,\mathrm{m/s}$, total $10.88\,\mathrm{m/s}$ — roughly a sixteenth of the LEO deorbit cost, because GEO disposal only has to nudge the satellite clear of the operational belt, not fight its way down through a deep gravity well into the atmosphere.
:::

The contrast is stark and worth remembering as a rule of thumb: LEO disposal is expensive relative to a single station-keeping correction but cheap relative to reaching orbit in the first place; GEO disposal is nearly free by comparison, precisely because "clear of the belt" is such a modest ask next to "back into the atmosphere."

::: warning Deorbit Δv is not the same question as deorbit *time*
Dropping perigee to $100\,\mathrm{km}$ guarantees re-entry but not immediately — the vehicle still spends many orbits with a low perigee before drag (itself covered properly in the next module) finishes the job. A lower target perigee shortens the time to re-entry but is not free: it costs more Δv, another instance of this module's recurring Δv-for-time trade.
:::

## Check yourself

::: check
A GEO operator observes an inclination drift rate of $0.90^\circ$/yr this year rather than the representative $0.85^\circ$/yr used in this lesson's example. Compute the annual north-south correction Δv.
:::

::: answer
$\Delta v = 2(3.0747)\sin(0.45^\circ) = 2(3.0747)(0.007854) = 0.04829\,\mathrm{km/s} = 48.3\,\mathrm{m/s}$, still comfortably inside the $45$–$55\,\mathrm{m/s}$/yr range this lesson quotes, as expected for a modest change in drift rate.
:::

::: check
Explain why GEO east-west station-keeping costs so much less than north-south, in terms of what is driving each.
:::

::: answer
North-south correction fights the Moon and Sun's gravitational pull out of the equatorial plane, a comparatively strong perturbation that this lesson's example converts, via the plane-change formula, into tens of metres per second annually. East-west drift comes from Earth's equatorial cross-section not being a perfect circle (triaxiality), a far weaker perturbing potential that produces a much smaller drift rate and therefore a much smaller correction — the same underlying logic (convert an angular drift rate into a Δv via the appropriate burn formula) applies to both, but the physical driver behind the two drift rates differs by roughly an order of magnitude in strength.
:::

::: check
Why can the LEO reboost example in this lesson state a precise Δv-per-kilometre figure while explicitly refusing to state a precise annual Δv budget?
:::

::: answer
The per-kilometre figure is a clean, purely orbital-mechanics calculation — a mini-Hohmann transfer of $\Delta a=2\,\mathrm{km}$ at $500\,\mathrm{km}$ altitude has an exact, computable Δv regardless of anything about the atmosphere. The annual budget additionally needs the actual decay rate (kilometres lost per year), which depends on atmospheric density that varies by an order of magnitude or more with solar activity — a quantity this module has not modelled and the next one exists specifically to address. Quoting a confident annual number without that model would be stating a precision the underlying physics does not support.
:::

::: check
A satellite needs to relocate $8^\circ$ eastward in GEO longitude. Using this lesson's $\Delta a=25\,\mathrm{km}$ result (drift rate $0.321^\circ$/day, total Δv $1.82\,\mathrm{m/s}$) as a starting point, would the same $\Delta a$ work, and what would change if the mission needed the relocation done in half the time?
:::

::: answer
The same $\Delta a=25\,\mathrm{km}$ works for any relocation angle — it only sets the *rate*, $0.321^\circ$/day, so an $8^\circ$ relocation simply takes longer to complete, $8/0.321=24.9$ days, at the same $1.82\,\mathrm{m/s}$ total Δv. Halving the time to about 12.5 days needs roughly double the drift rate, which this module's drift-rate scaling shows requires roughly double $\Delta a$ (about 50 km), and because the mini-Hohmann Δv scales linearly with $\Delta a$ for small offsets, the total Δv roughly doubles too, to about $3.6\,\mathrm{m/s}$.
:::

::: check
Why does GEO disposal use a graveyard orbit above GEO rather than simply lowering the satellite until it eventually re-enters, the way a LEO satellite does?
:::

::: answer
Lowering a GEO satellite all the way to an atmosphere-intersecting perigee would need a Δv on a similar order to a large fraction of a full Hohmann transfer back down from GEO — thousands of metres per second, utterly impractical for an end-of-life maneuver with whatever propellant remains. Raising into a graveyard orbit a few hundred kilometres above GEO, by contrast, costs only about $11\,\mathrm{m/s}$ as this lesson's example shows, because the goal is only to clear the narrow, valuable operational belt, not to descend through the entire gravity well to the atmosphere.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| GEO north-south | $\Delta v=2v\sin(\Delta i/2)$ applied to the annual lunisolar drift; $\approx$45–55 m/s/yr at $v_{\text{GEO}}=3.0747\,\mathrm{km/s}$ |
| GEO east-west | $\approx$2–4 m/s/yr; driven by triaxiality, much weaker than lunisolar |
| LEO reboost | Mini-Hohmann, Δv linear in $\Delta a$ for small offsets; annual total depends on drag, next module's territory |
| Drift orbit relocation | Same mini-Hohmann-and-wait as phasing (lesson 7); $\Delta a=25\,\mathrm{km}$ at GEO gives $0.321^\circ$/day for 1.82 m/s |
| LEO deorbit (700 km $\to$ 100 km perigee) | Single retrograde burn, 167.95 m/s |
| GEO graveyard disposal (+300 km) | Two-burn raise, 10.88 m/s — about a sixteenth of the LEO deorbit cost |

The remaining two lessons leave Earth-orbit operations behind and take this module's Δv toolkit interplanetary: how a spacecraft leaves one gravitational sphere of influence and enters another, and how mission designers scan an entire launch season for the cheapest departure.
