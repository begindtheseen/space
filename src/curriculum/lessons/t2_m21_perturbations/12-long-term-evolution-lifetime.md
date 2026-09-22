---
id: l12-long-term-evolution-lifetime
title: Long-term orbit evolution and lifetime estimation
minutes: 18
covers:
  - long-term orbit evolution and lifetime estimation
  - perturbation sources ranked by magnitude in LEO and GEO
---

The first lesson of this module previewed a ranking of perturbations at two altitudes and promised the rest of the module would earn each entry. Every perturbation has now been derived, sized, and in most cases confirmed by direct numerical integration — which means it is finally possible to build the complete picture: not just low orbit and geostationary orbit, but a sun-synchronous orbit and a highly eccentric one, and not just at one point but, for the eccentric case, at both ends of its range. What emerges is not a fixed hierarchy that applies everywhere; it is a hierarchy that reorders itself completely depending on where the spacecraft is, sometimes within a single orbit.

This closing lesson assembles that full comparison, then turns to the question every one of these perturbations ultimately feeds: how long does an orbit last, what dominates the answer, and how honestly can that answer be stated given everything this module has learned about the uncertainty in the inputs.

## The complete picture, four regimes

Each entry below is computed the same way earlier lessons derived it: $J_2$ from its Cartesian formula at the equator crossing, higher harmonics ($J_3$, $J_4$) from the general zonal formula at a representative latitude, drag from the illustrative solar-minimum/maximum density bracket of the drag lesson, third-body from the exact lunar and solar formulas, and solar radiation pressure from the assumed $A/m=0.02\,\mathrm{m^2/kg}$, $C_r=1.3$ spacecraft used throughout.

| Acceleration ($\mathrm{m/s^2}$) | LEO, $400\,\mathrm{km}$ | SSO, $700\,\mathrm{km}$ | GEO | HEO perigee, $528\,\mathrm{km}$ | HEO apogee, $39\,839\,\mathrm{km}$ |
| --- | --- | --- | --- | --- | --- |
| Two-body | $8.676$ | $7.956$ | $0.2242$ | $8.358$ | $0.1866$ |
| $J_2$ | $1.248\times10^{-2}$ | $1.049\times10^{-2}$ | $8.33\times10^{-6}$ | $1.158\times10^{-2}$ | $5.77\times10^{-6}$ |
| Higher harmonics | $\sim3.3\times10^{-5}$ | $\sim2.6\times10^{-5}$ | $\sim3.5\times10^{-9}$ | $\sim3.0\times10^{-5}$ | $\sim2.2\times10^{-9}$ |
| Drag (lo–hi) | $2.6\times10^{-7}$–$1.0\times10^{-5}$ | $6\times10^{-10}$–$2.3\times10^{-7}$ | negligible | $2\times10^{-8}$–$2.0\times10^{-6}$ | negligible |
| Lunar 3rd-body | $1.20\times10^{-6}$ | $1.26\times10^{-6}$ | $8.68\times10^{-6}$ | $1.23\times10^{-6}$ | $9.69\times10^{-6}$ |
| Solar 3rd-body | $5.37\times10^{-7}$ | $5.61\times10^{-7}$ | $3.34\times10^{-6}$ | $5.48\times10^{-7}$ | $3.67\times10^{-6}$ |
| SRP | $1.19\times10^{-7}$ | $1.19\times10^{-7}$ | $1.19\times10^{-7}$ | $1.19\times10^{-7}$ | $1.19\times10^{-7}$ |

::: example Reading the ordering, column by column
At $400\,\mathrm{km}$, $J_2$ beats every other perturbation by two to five orders of magnitude, and even the *uncertain* drag term can rival or exceed the higher-harmonics row at solar maximum — the ordering below $J_2$ is genuinely ambiguous until you know where in the solar cycle you are. By $700\,\mathrm{km}$, drag has fallen by roughly two orders of magnitude (its exponential altitude dependence, against $J_2$'s much gentler $r^{-4}$), dropping it to the *bottom* of the table at solar minimum, below even solar radiation pressure — the opposite end of the ranking from where it sat at $400\,\mathrm{km}$. At geostationary altitude, $J_2$ and lunar attraction are within $4\%$ of each other — genuinely comparable, not one dominating the other — solar attraction trails by a factor of about $2.6$, drag has vanished, and even solar radiation pressure, though still the smallest row, is now within two orders of magnitude of $J_2$ rather than five. The two HEO columns are the most striking: *the same spacecraft, the same orbit*, looks almost exactly like the $400\,\mathrm{km}$ case at perigee and almost exactly like the geostationary case at apogee, twice every revolution.
:::

The two scaling facts from the first lesson explain every column: $J_2$'s acceleration falls as $r^{-4}$ against the two-body term's $r^{-2}$, so its relative importance fades steadily with altitude; third-body attraction grows roughly linearly with $r$, so its relative importance grows. Drag's exponential atmospheric cutoff makes it behave unlike either — enormous at $400\,\mathrm{km}$, negligible within a few hundred kilometres more altitude — and solar radiation pressure is nearly flat across the entire table, since it depends on distance from the *Sun*, not from Earth. No single sentence like "$J_2$ is the dominant perturbation" or "third-body is negligible in low orbit" survives contact with all five columns at once; both are true only in their own regime.

::: key Which perturbation matters where
$J_2\propto r^{-4}$ (relative importance $\propto r^{-2}$); third-body $\propto r$ (grows with altitude); drag falls off exponentially with altitude (matters only within a few hundred kilometres of a sensible atmosphere); SRP is nearly constant with altitude near Earth. At low altitude: $J_2\gg$ higher harmonics $\gtrsim$ drag $\gtrsim$ lunisolar $\gg$ SRP, with drag's exact position uncertain by more than a decade. At geostationary altitude: $J_2\approx$ lunisolar $\gg$ SRP, drag absent. A single eccentric orbit can pass through both regimes twice per revolution.
:::

## Long-term evolution: what each perturbation actually does to a mission

Stitching the module's individual results together: $J_2$ drives the secular precession of the node and perigee derived in the third and fourth lessons — design-relevant (sun-synchronous, frozen orbits) but not, by itself, life-limiting, since it causes no secular change in $a$ or $e$. Drag is the one perturbation in this module that reliably ends a low orbit's life, through the steady, one-directional decay the drag lesson derived and confirmed. Third-body attraction, negligible for a low orbit's lifetime, is the dominant long-term driver of inclination and node drift at geostationary altitude, which is why geostationary station-keeping is mostly an ongoing fight against the Moon and Sun rather than against Earth's own gravity field. Solar radiation pressure, small everywhere in this module's tables, has an outsized long-term effect specifically for high area-to-mass objects (spent rocket stages, deployed structures, debris with damaged surfaces), where it can drive eccentricity growth large enough to lower perigee into the atmosphere over years — a slow-motion, SRP-mediated version of the same reentry outcome drag produces directly.

This is also why "lifetime" means something different at different altitudes. In low orbit, lifetime is a drag question, full stop — the previous lesson's answer. At geostationary altitude there is essentially no atmosphere to decay into, so nothing removes a dead satellite naturally within any operationally meaningful time; the international guideline (from the Inter-Agency Space Debris Coordination Committee) is instead to boost end-of-life geostationary satellites into a graveyard orbit a few hundred kilometres above the operational belt, precisely *because* the region is too perturbation-quiet, not too perturbation-active, to clean itself up.

::: example The drag-dominated lifetime question, revisited
Reusing the previous lesson's decay-rate formula, $da/dt=-\rho(a)na^2/B$, integrated from $400\,\mathrm{km}$ to a $120\,\mathrm{km}$ re-entry altitude:

| $B\,(\mathrm{kg/m^2})$ | Lifetime, active Sun | Lifetime, quiet Sun |
| --- | --- | --- |
| $50$ | $21.7$ days | $556.6$ days |
| $100$ | $43.4$ days | $1113.3$ days |
| $200$ | $86.8$ days | $2226.6$ days |

Every other perturbation in this module's tables is present throughout this decay — $J_2$ is, in fact, larger than drag at every point of the descent until the last few tens of kilometres — but none of them determines *when* re-entry happens; only the cumulative, one-directional energy loss from drag does that, which is why a re-entry prediction is fundamentally a drag-and-atmosphere problem even though the full force model used to compute the trajectory includes every perturbation this module derived. The factor of roughly $25$ between the two density assumptions, for every ballistic coefficient, is the module's central honesty check, restated one last time: the spacecraft's own properties are usually known to a few percent; the atmosphere it is flying through, to a factor of several.
:::

::: warning A perturbation hierarchy learned at one altitude does not transfer
The single most common mistake this module's own examples were built to prevent: internalising "$J_2$ dominates, everything else is a footnote" from low-orbit experience and carrying that assumption unexamined into a geostationary or high-apogee analysis, where it is simply false. Every force-model decision — which perturbations to include, which to neglect, which uncertainty to carry forward into a lifetime or conjunction estimate — has to be re-justified for the specific orbit regime in front of you, using a table like the one this lesson builds, not a rule of thumb inherited from a different altitude.
:::

## Check yourself

::: check
A GEO satellite's operator reports spending far more propellant on inclination (north–south) station-keeping than on any other correction. Using this lesson's table, identify the perturbation most responsible, and explain why the equivalent correction is comparatively minor for a $400\,\mathrm{km}$ mission.
:::

::: answer
Lunisolar third-body attraction, which drives out-of-plane drift, is comparable in size to $J_2$ at geostationary altitude (within about $4\%$ in this lesson's table) and is not something a geostationary mission can design around the way a low-orbit mission designs around $J_2$'s predictable nodal regression. At $400\,\mathrm{km}$, the same lunisolar terms are three orders of magnitude smaller than $J_2$, so they contribute negligibly to a low-orbit mission's propellant budget by comparison; there, $J_2$-driven drift is either accepted by design (as in a sun-synchronous orbit) or is simply too small a secular effect on $a$ and $e$ to need active correction in the first place.
:::

::: check
Explain why a highly eccentric orbit cannot be assigned a single "dominant perturbation" the way a circular orbit at a fixed altitude can.
:::

::: answer
An eccentric orbit sweeps through a wide range of altitudes every revolution, and this lesson's table shows the perturbation ranking is a strong function of altitude — dominated by $J_2$ and (if low enough) drag near perigee, and by comparable $J_2$/lunisolar terms near apogee if apogee is high enough. The same spacecraft experiences both regimes twice per orbit, so "the dominant perturbation" is only a meaningful question once you also specify *where in the orbit*.
:::

::: check
Why is a geostationary satellite boosted to a graveyard orbit at end of life, rather than left in place to eventually decay the way a low-orbit satellite does?
:::

::: answer
There is essentially no atmosphere at geostationary altitude, so the one perturbation that reliably ends a low orbit's life — drag — is absent, and this lesson's table shows nothing else at that altitude grows without bound the way drag-driven decay does; $J_2$ and lunisolar attraction perturb the orbit's shape and orientation but do not remove orbital energy the way drag does. Without an active disposal maneuver, a dead geostationary satellite would remain in or near the operational belt indefinitely, which is exactly why moving it to a graveyard orbit, rather than waiting for a natural decay that will not happen on any relevant timescale, is the standard end-of-life practice.
:::

::: check
A mission planner needs to decide, for a new $700\,\mathrm{km}$ sun-synchronous mission, whether atmospheric drag needs to be included in the force model used for ten-year propellant budgeting. Using this lesson's table, what would you tell them?
:::

::: answer
At $700\,\mathrm{km}$, drag's own solar-minimum-to-maximum range spans roughly $6\times10^{-10}$ to $2.3\times10^{-7}\,\mathrm{m/s^2}$ — already two to three orders of magnitude below its $400\,\mathrm{km}$ values, and, at solar minimum, smaller than solar radiation pressure. It should still be included in the force model, both because solar-maximum conditions bring it back up to a magnitude worth tracking and because a ten-year budget will very likely span at least one full solar cycle, but it is no longer the automatic dominant secular concern that it is at $400\,\mathrm{km}$; $J_2$'s design-driving role (sun-synchronicity itself) and the lunisolar and SRP contributions to long-term drift deserve comparable attention at this altitude.
:::

::: check
Two engineers disagree about whether a re-entry prediction quoted to the nearest day is meaningful. Using the numbers in this lesson, whose side does the evidence support, and why?
:::

::: answer
The evidence supports skepticism of day-level precision, for any prediction made a significant time before re-entry. The lifetime table shows the same spacecraft's predicted lifetime varies by a factor of about $25$ between solar-minimum and solar-maximum density assumptions, entirely independent of how well the spacecraft's own ballistic coefficient is known — an uncertainty measured in months, not days, until the actual decay trajectory (and hence the real, currently-prevailing density) can be observed directly as re-entry approaches. A day-level quote is defensible only very close to the event itself, once tracking data has pinned down the density the spacecraft is actually flying through.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $J_2\propto r^{-4}$; third-body $\propto r$; drag exponential in altitude; SRP $\approx$ constant | The four scaling laws that explain every entry in the master table |
| LEO ($400\,\mathrm{km}$) | $J_2\gg$ higher harmonics $\gtrsim$ drag (uncertain) $\gtrsim$ lunisolar $\gg$ SRP |
| SSO ($700\,\mathrm{km}$) | Same order as LEO, but drag has fallen below lunisolar and even SRP at solar minimum |
| GEO | $J_2\approx$ lunisolar (within $4\%$) $\gg$ SRP; drag absent |
| HEO | Perigee looks like LEO; apogee looks like GEO; both, twice per orbit |
| Lifetime is a drag question in LEO | Other perturbations barely affect *when* re-entry happens, even though they dominate the trajectory shape along the way |
| Lifetime is not a natural-decay question at GEO | No atmosphere; end-of-life disposal is an active maneuver (graveyard orbit), not a wait |
| Density uncertainty ($\sim25\times$) dominates $B$ uncertainty | The module's central honesty check on any quoted lifetime |

This module began with a promise to earn every entry in a preview table rather than assert it; the table above is that promise kept, built from the derivations, numerical confirmations, and honestly-bracketed uncertainties of the eleven lessons before it.
