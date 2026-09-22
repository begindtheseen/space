---
id: l11-ins-gnss-integration-architectures
title: INS/GNSS integration architectures
minutes: 14
covers:
  - "INS/GNSS integration architectures: loosely, tightly, and ultra-tightly (deeply) coupled"
---

The free-inertial error-propagation lesson put a number on why an unaided INS cannot be the whole answer: this module's own tactical gyro, left to run for an hour with nothing to correct it, produced a $405\,\mathrm{km}$ position error. GNSS is what corrects it — the subject of its own module — and this lesson is about the one question GNSS raises for an INS designer that GNSS itself cannot answer: *how* the two systems are wired together. Three architectures answer it differently, and the difference is not a matter of taste. It changes what happens the moment satellites become scarce, which is exactly the moment an aided system most needs to keep working.

## Loosely coupled: two solutions, fused after the fact

The simplest architecture lets the GNSS receiver do its own job completely — compute its own position and velocity fix, using whatever satellites it can see and its own internal filtering — and hands only that finished fix to the INS integration filter, which treats it as a direct measurement of position and velocity error, exactly the zero-velocity update of the alignment lesson with a moving reference in place of zero. Loose coupling is modular by construction: the receiver and the inertial filter can be built, tested and replaced independently, by different teams or different vendors, and the interface between them is a handful of numbers a receiver datasheet already documents.

Its cost is what happens at the edges of GNSS availability. A stand-alone position fix needs at least four satellites — three to fix position, one more to solve for the receiver's own clock bias, a problem the GNSS module works out in full — so the instant fewer than four are visible, the receiver has no fix to hand over at all, and the loosely coupled INS reverts to fully free-inertial operation, accumulating error by exactly the laws the free-inertial lesson derived, with nothing softening the blow. A three-satellite pass under a highway overpass is, from a loosely coupled filter's point of view, indistinguishable from no satellites at all.

## Tightly coupled: raw measurements, one filter

Tight coupling feeds the integration filter the receiver's raw pseudoranges and deltaranges directly, alongside the inertial states, in a single filter that also carries the receiver clock bias and drift as states of its own — the fourth-unknown problem the GNSS module solves, now solved jointly with attitude, velocity and position rather than separately. The payoff is exactly where loose coupling fails: a single visible satellite still contributes one scalar measurement, and one measurement is not nothing.

::: example What one satellite is worth

A vehicle has drifted to an isotropic $50\,\mathrm m$ horizontal position uncertainty (both axes, uncorrelated) after some unaided time. One satellite is visible, line of sight $30^\circ$ north of east, pseudorange noise $3\,\mathrm m$. Update the $2\times2$ position covariance with that single range measurement:

```python
import numpy as np

P0 = np.diag([50.0**2, 50.0**2])           # m^2
theta = np.radians(30.0)
los = np.array([np.cos(theta), np.sin(theta)])
H = los.reshape(1, 2)
R = np.array([[3.0**2]])

S = H @ P0 @ H.T + R
K = P0 @ H.T @ np.linalg.inv(S)
P1 = (np.eye(2) - K @ H) @ P0

perp = np.array([-los[1], los[0]])
print("variance along the line of sight:", los @ P0 @ los, "->", los @ P1 @ los)
print("variance perpendicular to it:    ", perp @ P0 @ perp, "->", perp @ P1 @ perp)
# variance along the line of sight: 2500.0 -> 8.967716221602295
# variance perpendicular to it:     2500.0 -> 2500.0
```

The uncertainty along that one satellite's line of sight collapses from $50\,\mathrm m$ to $3.0\,\mathrm m$, almost down to the raw measurement noise itself — a single range genuinely constrains position, though not all of it. The uncertainty *perpendicular* to that line of sight is completely untouched, still exactly $50\,\mathrm m$, because a single scalar measurement can only ever constrain the one direction it actually measures. This is the entire case for tight coupling in one picture: a loosely coupled filter gets nothing at all from this one satellite, because one satellite cannot produce a stand-alone fix, while a tightly coupled filter gets real, useful information along one axis and waits only for geometry or additional satellites to fill in the rest.
:::

Tight coupling earns this at a real cost: the filter must be built around raw receiver observables rather than a finished fix, which couples the INS integration filter's design to the receiver's own internals more tightly than the loosely coupled interface does, and every pseudorange the filter accepts needs its own integrity check — the GNSS module's multipath and ephemeris-error material — since a single bad measurement now enters the same filter that carries attitude and position, rather than being averaged away inside a receiver's own, separate solution first.

::: key Loose versus tight
Loose coupling fuses the receiver's finished position/velocity solution; it needs four-plus satellites for any update at all, and gets nothing from fewer. Tight coupling fuses raw pseudoranges and deltaranges directly in one filter that also estimates receiver clock bias; even one or two satellites constrain part of the solution, and outliers are gated per-satellite rather than trusted as part of an opaque fix.
:::

::: example The outage this module has already priced

Recall the free-inertial lesson's own numbers for this module's tactical IMU: by $t=60\,\mathrm s$ unaided, the dominant error sources alone already sum past $10\,\mathrm m$, and by an hour the gyro bias term reaches $405\,\mathrm{km}$. A loosely coupled system losing its four-satellite fix for a $60\,\mathrm s$ highway-overpass pass therefore re-emerges with roughly that $10\,\mathrm m$-class error already built up, entirely unconstrained during the gap. A tightly coupled system that keeps even one or two satellites through the same pass — a realistic outcome under a partial overpass rather than a full tunnel — constrains part of that growth exactly as the covariance example above shows, and re-acquires a full fix with a smaller residual error for the filter to work down. Neither architecture makes the free-inertial growth laws untrue; tight coupling keeps using whatever partial information is available instead of discarding it while it waits for a complete fix.
:::

## Ultra-tight, or deep, coupling

Both architectures above still assume the receiver can track its satellites well enough to produce pseudoranges at all — that its delay-lock and phase-lock loops, the tracking machinery the GNSS module covers, stay locked onto each signal. Under heavy jamming, high vehicle dynamics, or a deep urban canyon, that assumption itself can fail: a tracking loop with too little bandwidth loses lock when the signal dynamics outrun it, and a tracking loop with enough bandwidth to follow high dynamics lets in more noise and jamming than a narrower one would. **Ultra-tight** (or **deep**) **coupling** breaks that trade-off by feeding the INS's own velocity and acceleration solution into the tracking loops themselves, letting them narrow their bandwidth — because the inertial solution, not the loop's own noisy discriminator, is now predicting most of the signal's expected dynamics — and hold lock at carrier-to-noise ratios and dynamic rates that would break an independent loop outright.

The price is architectural depth: deep coupling requires access to the receiver's tracking-loop internals, not only its pseudorange output, so it cannot be built from a commercial receiver treated as a sealed box the way loose or even tight coupling often can. It is the architecture of choice exactly where the other two are weakest — heavily jammed or high-dynamics environments, a launch vehicle's ascent or a munition's terminal approach — because it is the only one of the three that helps the receiver *keep* a lock rather than only making good use of whatever lock the receiver manages on its own.

::: warning
"Tightly coupled" and "deeply coupled" are used loosely (no pun intended) in casual conversation and are worth keeping straight in writing. Tight coupling is about *what* is fused — raw ranges instead of a finished fix — and can be built entirely at the navigation-filter level, above an unmodified receiver. Deep coupling is about *where* the inertial aiding acts — inside the tracking loops themselves — and cannot be retrofitted onto a receiver that does not expose that interface. A system can be tightly coupled without being anywhere near deep, and the two words are not points on a single ladder so much as two independent design decisions that happen to often be adopted together in the most demanding applications.
:::

## Check yourself

::: check
Why does a loosely coupled INS/GNSS system gain nothing from three visible satellites, while a tightly coupled system gains something from even one?
:::

::: answer
A stand-alone GNSS position fix is a system of at least four equations (three spatial dimensions plus the receiver clock bias) that needs at least four independent pseudoranges to solve; with only three satellites the receiver has no complete fix to compute at all, and a loosely coupled filter's interface only ever accepts a complete fix, so it receives nothing. A tightly coupled filter's interface is the individual pseudorange itself, each one an independent scalar measurement of a linear combination of the filter's own states, and a linear system does not need to be fully determined before a single equation from it becomes useful — one equation constrains one direction in the state space, which is exactly what the covariance example showed.
:::

::: check
A vehicle needs to operate through heavy jamming that periodically drops the carrier-to-noise ratio low enough to threaten loss of lock, but its receiver is a sealed commercial unit with no access to internal tracking-loop signals. Which architecture is ruled out, and which is the best available fallback?
:::

::: answer
Ultra-tight/deep coupling is ruled out immediately, because it requires feeding inertial aiding into the tracking loops themselves, an interface a sealed receiver does not expose. Tight coupling remains available as long as the receiver outputs raw pseudoranges and deltaranges rather than only a finished fix, and it is the better fallback of the two remaining options precisely because jamming is likely to degrade the *number* of usable satellites intermittently rather than eliminate all of them at once — the exact partial-constellation situation tight coupling is built to exploit and loose coupling cannot.
:::

::: check
Explain, in terms of the covariance example, why adding a second satellite at a different line-of-sight angle is so much more valuable than adding a second satellite along nearly the same line of sight as the first.
:::

::: answer
A single satellite's measurement only constrains the one direction along its own line of sight, leaving the perpendicular direction exactly as uncertain as before — the worked example's perpendicular variance did not move at all. A second satellite at a genuinely different angle constrains a *different* direction, so together the two collapse uncertainty in both dimensions rather than one. A second satellite nearly aligned with the first mostly re-measures the same direction the first one already constrained well, adding little beyond averaging down that one direction's already-small residual noise — the geometric spread between satellites, not merely their count, is what determines how much of the position uncertainty actually shrinks, the same geometric idea the GNSS module's dilution-of-precision treatment quantifies in full.
:::

## Summary

| Architecture | Fuses | Needs at minimum | Fails how |
| --- | --- | --- | --- |
| Loosely coupled | Finished position/velocity fix | Four-plus satellites for any update | All-or-nothing: reverts to fully free-inertial below four |
| Tightly coupled | Raw pseudoranges, deltaranges, clock states | One satellite for a partial update | Degrades gracefully; needs per-satellite integrity gating |
| Ultra-tight / deep | Inertial aiding into the receiver's own tracking loops | Access to tracking-loop internals | Not available on a sealed, unmodified receiver |

Every architecture in this lesson still needs a filter to actually carry out the fusion, and every one of them needs to know precisely what "the inertial states" and "the measurement model" mean in error terms rather than in raw physical terms. That is the next lesson's subject: the error-state formulation, in its 15-state and 21-state forms, that every architecture above is built on top of.
