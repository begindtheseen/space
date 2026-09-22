---
id: l12-abort-modes
title: Abort modes and the decision logic behind them
minutes: 15
covers:
  - "Abort modes: RTLS, TAL, AOA and the decision logic"
---

This module's engine-out lesson showed guidance degrading gracefully to a lower, still-reachable orbit when the planned one is out of reach. Sometimes no orbit is in reach at all, and the question stops being "which target" and becomes "how does the vehicle come down safely, and from where." The vocabulary for that question — RTLS, TAL, AOA, ATO — is decades old, built for crewed vehicles where getting it wrong is fatal, and every mode in it is really a statement about the two-body module's specific orbital energy: how much of it the vehicle has at the moment something fails, and what that much energy is actually good for.

## The energy state through an ascent

Specific orbital energy, $\varepsilon = v^2/2 - \mu/r$, is negative for any bound orbit and tells you, together with the angular momentum, exactly what ellipse a vehicle is on if its engines stopped right now. Compute it at several points through this module's own worked ascent — the state the vehicle would coast on, ballistically, if powered flight ended at that instant.

::: example How suborbital "suborbital" actually is
Through stage 1 and into stage 2, treating the vehicle's actual state at each time as the start of an unpowered coast and finding the resulting ellipse's perigee (values below zero mean the coast trajectory would re-enter or impact the ground well before reaching that mathematical point — the vehicle never gets there, because the atmosphere and the surface are in the way):

| time | altitude | speed | ballistic perigee |
| --- | --- | --- | --- |
| $t=0$ (liftoff) | 0.0 km | 465 m/s | $-6367$ km |
| stage 1 burnout | 60.4 km | 3608 m/s | $-5659$ km |
| stage 2, $t=100\ \mathrm{s}$ | 142.8 km | 3818 m/s | $-5556$ km |
| stage 2, $t=200\ \mathrm{s}$ | 256.1 km | 4540 m/s | $-5155$ km |
| stage 2, $t=300\ \mathrm{s}$ | 386.1 km | 6311 m/s | $-3038$ km |
| insertion, $t=343.3\ \mathrm{s}$ | 400.0 km | 7668 m/s | $+397$ km (stable) |

The ballistic perigee stays catastrophically negative for almost the entire flight and only crosses above the surface in roughly the last 15% of stage 2's burn. A vehicle that loses all thrust at $t=200\ \mathrm{s}$, despite already being 256 km up and moving at 4.5 km/s, is nowhere close to being able to coast to safety unpowered — its natural trajectory runs straight back into the atmosphere. Whatever "abort" means at that point in the flight, it cannot mean "stop thrusting and wait."
:::

## What continuing would actually cost

The picture improves, but expensively, and the two-body module's vis-viva equation prices exactly how expensively.

::: example Raising perigee, and how fast that gets cheaper
At $t=200\ \mathrm{s}$, the vehicle's current ballistic trajectory would coast up to a genuine, reachable apogee of 406.3 km before falling back — that part of the arc is real, only the fall back through the (unphysical) computed perigee is not. Firing a hypothetical contingency engine exactly at that apogee to raise perigee to a safe 200 km altitude needs a burn taking the local speed from $v_{\text{apogee}} = 4236.4\ \mathrm{m/s}$ (the current ellipse's apogee speed) up to $7605.6\ \mathrm{m/s}$ (the apogee speed of an ellipse sharing the same 406.3 km apogee but with perigee raised to 200 km) — a $\Delta v$ of

$$
7605.6 - 4236.4 = 3369.2\ \mathrm{m/s}.
$$

Run the same calculation from $t=300\ \mathrm{s}$, where the natural apogee has already reached 499.4 km: the current ellipse's apogee speed is $6155.4\ \mathrm{m/s}$, the 200-km-perigee target needs $7527.8\ \mathrm{m/s}$, and the burn shrinks to $\Delta v = 1372.4\ \mathrm{m/s}$ — well under half the $t=200\ \mathrm{s}$ figure, from only 100 seconds' more flight. Whatever margin a real contingency propulsion system carries, the same failure is a dramatically different problem depending on precisely when in the ascent it happens, because the vehicle's own energy state is changing fastest exactly where this module's earlier lessons found the most gravity loss still being paid.
:::

::: key
A vehicle's ballistic perigee — what its current state would coast to unpowered — stays deeply negative for almost all of a typical ascent and only turns positive very late. The $\Delta v$ a contingency burn needs to fix that falls sharply as the flight progresses, because both the natural apogee and the apogee speed are improving together.
:::

## The vocabulary

Against that backdrop, the classic abort-mode names describe qualitatively different answers to "what can be done with the energy state at hand," ordered roughly by how much of it is available:

**RTLS — Return to Launch Site.** Early in flight, with too little energy for anything downrange and certainly none for orbit, the vehicle (or its crew capsule) flies an actively guided trajectory back toward the launch site itself — not a coast, a powered and then aerodynamically guided return, because the energy table above shows a passive coast is not survivable this early.

**TAL — Transatlantic (or more generally, downrange) Abort Landing.** With enough energy to reach a prepared landing site far downrange but not enough for even one full orbit, the vehicle continues on a suborbital trajectory to a runway positioned for exactly this contingency, rather than attempting to return the way it came.

**AOA — Abort Once Around.** With enough energy for one lap of a low, temporary orbit but not enough margin to call that orbit an acceptable mission outcome, the vehicle inserts, comes most of the way around the Earth once, and deorbits — an orbit used as a very large, very fast return path rather than a destination.

**ATO — Abort to Orbit.** With enough remaining performance to reach a stable, if lower and less capable, orbit outright, the vehicle does exactly that — this is the graceful degradation this module's engine-out lesson already demonstrated end to end, and it is only available once the energy state has improved enough that "reachable orbit" and "current trajectory" are close together, which the table above shows happens only in the later part of a flight.

::: key
RTLS, TAL, AOA and ATO are not four different procedures so much as four different answers the *same* energy state gives, read off in order of how much of it is available: too little for anything but a guided return to the pad; enough for a downrange landing site but not orbit; enough for one lap of a disposable low orbit; enough for a real, if reduced, orbit outright.
:::

## The decision logic

The boundary between modes is exactly a reachability question in the same sense this module's engine-out lesson already computed one: given the vehicle's actual state and remaining propellant at the moment of failure, is *any* stable orbit reachable? If yes, the situation is ATO, and the machinery is the same explicit-guidance retargeting this module has built throughout — recompute the best reachable orbit, fly to it. If no stable orbit is reachable but a downrange or once-around trajectory is survivable, the choice moves to AOA or TAL, no longer a guidance-retargeting problem but a trajectory-shaping and landing-site problem. If even that margin is not present, the only remaining option is the guided return a coast cannot provide, RTLS. The mode boundaries are therefore functions of exactly the two quantities this lesson has been computing — energy and time since liftoff — and knowing which regime the vehicle is actually in, continuously, as those quantities evolve, is as much a guidance and navigation responsibility as flying the nominal ascent is.

::: warning
Do not read the energy table's crossover to a positive ballistic perigee as the moment aborts stop being needed. It is the moment a *passive coast* stops being catastrophic; a vehicle can still lose enough performance after that point to fall short of its planned orbit, which is exactly the engine-out contingency this module already worked through in full, using the same reachable-orbit machinery this lesson has been leaning on rather than any of the four abort-mode names above.
:::

## Check yourself

::: check
Explain, using the ballistic-perigee table, why "the vehicle is already above 200 km and moving at several kilometres per second" is not by itself evidence that a coast-to-safety abort is available.
:::

::: answer
The table shows that at 256 km altitude and 4540 m/s ($t=200\ \mathrm{s}$), the vehicle's ballistic perigee is still $-5155$ km — the coast trajectory would re-enter the atmosphere well before completing even one orbit. Altitude and speed alone do not determine survivability of a coast; what matters is the combination captured in specific orbital energy (and angular momentum), and a vehicle can be high and fast while still being nowhere near having enough of either for an unpowered return to be anything but a re-entry.
:::

::: check
Why does the $\Delta v$ needed to raise perigee to a safe altitude fall so much faster than the flight time passing might suggest, between $t=200\ \mathrm{s}$ and $t=300\ \mathrm{s}$?
:::

::: answer
Two things improve together over that interval: the natural (ballistic) apogee rises from 406.3 km to 499.4 km, and the apogee speed of the current ellipse rises from 4236.4 m/s to 6155.4 m/s — closer to the roughly 7600 m/s a 200-km-perigee orbit needs at that apogee either way. Because the required burn is the *difference* between the current and target apogee speeds, and the current apogee speed is climbing quickly while the target barely changes, the gap — and hence the $\Delta v$ — closes much faster than a casual read of "100 more seconds of flight" would suggest.
:::

::: check
Match each abort mode — RTLS, TAL, AOA, ATO — to the phrase that best describes the energy state behind it: (a) enough for one disposable lap; (b) enough for a real, if smaller, orbit; (c) enough to reach a downrange site, not orbit; (d) not enough for anywhere but back to the pad.
:::

::: answer
RTLS $\to$ (d); TAL $\to$ (c); AOA $\to$ (a); ATO $\to$ (b) — an ordering that exactly tracks how much usable energy and performance margin remains at the moment of failure, from least to most.
:::

::: check
A flight-rules team is deciding where to place the boundary between the TAL and AOA regions of a flight timeline. What quantity should that boundary actually be defined in terms of, based on this lesson?
:::

::: answer
It should be defined in terms of the vehicle's actual reachable-orbit performance at each point in the timeline — whether the propellant and state remaining are enough to reach a stable, if temporary, orbit at all — rather than a fixed time or altitude. This lesson's own numbers show energy state can change rapidly over a short span of time, so a boundary fixed to a clock time is a proxy for the real quantity (reachable orbit, computed the same way this module's engine-out lesson computed it) and needs to be validated against that real quantity rather than assumed to track it exactly.
:::

::: check
Explain why ATO is described in this lesson as using "the same machinery" as the engine-out contingency lesson, rather than as a separate guidance mode.
:::

::: answer
ATO's defining feature is that a stable orbit is still reachable, only a lower or otherwise reduced one — exactly the situation this module's engine-out lesson worked through numerically: guidance detects that the planned target is unreachable, searches for the best orbit the remaining propellant can actually deliver, and retargets to it using the same explicit, re-converging guidance cycle flown throughout this module. Nothing about that process is specific to an engine failure as opposed to any other performance shortfall; "ATO" is a name for exactly that outcome, not a different algorithm.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Ballistic perigee | the perigee of the orbit a vehicle's current state would coast to unpowered; negative means it never gets there — atmosphere or surface intervene first |
| Worked ascent | ballistic perigee stays below $-3000$ km through most of stage 2, crossing positive only in the last $\sim$15% of the burn |
| $\Delta v$ to raise perigee at apogee | 3369.2 m/s at $t=200\ \mathrm{s}$ (apogee 406.3 km); 1372.4 m/s at $t=300\ \mathrm{s}$ (apogee 499.4 km) |
| RTLS | Return to Launch Site — too little energy for anything but a guided return to the pad |
| TAL | Transatlantic (downrange) Abort Landing — enough for a prepared downrange site, not orbit |
| AOA | Abort Once Around — enough for one disposable low-orbit lap, then deorbit |
| ATO | Abort to Orbit — a stable, reduced orbit is reachable; identical mechanism to this module's engine-out retargeting |
| Decision logic | mode boundaries are reachability questions in energy and remaining performance, not fixed times or altitudes |

This module built ascent guidance from the ground up: why the trajectory has the shape it does, the optimal steering law and the algorithms that fly it, the offline work that hands them their parameters, and — across these last three lessons — everything that happens when reality does not cooperate. What remains is what every GNC system this curriculum has built eventually needs: the actual orbit the vehicle has been fighting its way toward, and the maneuvers that follow.
