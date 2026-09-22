---
id: l06-apsidal-rotation
title: Apsidal rotation
minutes: 18
covers:
  - apsidal rotation
---

The last lesson rotated an orbital plane about the line where the old and new planes intersect. This lesson rotates something narrower and stays entirely within a single plane: the line of apsides, the axis running from periapsis through the focus to apoapsis. Moving that line – changing the argument of periapsis while leaving the orbit's size and shape untouched – repositions where in the orbit periapsis and apoapsis fall, which matters whenever a mission cares about *where* an orbit is fast or slow, low or high: a ground-track argument for where an imaging satellite's low point sits, a repositioning of a Molniya-type orbit's apogee over a different hemisphere, or preparation for a later maneuver that needs to happen at a specific apsis.

Do not confuse this deliberate maneuver with the apsidal precession that Earth's oblateness causes on its own, which rotates the line of apsides slowly and continuously without any burn at all – that is a perturbation effect, covered properly once the next module introduces $J_2$. This lesson is about paying, on purpose, with a single impulsive burn, to move the apse line by a chosen angle right now.

A classic example is a highly eccentric communications or early-warning orbit, of the kind first flown as the Soviet Molniya series: apogee sits deliberately over one hemisphere for most of the orbital period, and the mission depends on that apogee staying where ground stations and coverage requirements need it. Left alone, such an orbit's apse line does not stay put – oblateness rotates it continuously, at a rate this module's next companion derives, and left uncorrected the coverage geometry the mission was designed around slowly disappears. A deliberate apsidal-rotation burn, of exactly the kind this lesson derives, is one way to put it back, or to move it somewhere new entirely when a mission's ground track requirements change mid-life.

## Where two orbits with the same shape cross

Consider two orbits with identical semi-major axis $a$ and eccentricity $e$ – so identical size, shape, and semi-latus rectum $p = a(1-e^2)$ – but with arguments of periapsis differing by $\Delta\omega$. They are congruent ellipses sharing a focus, one rotated from the other by $\Delta\omega$ about that focus. Reflecting the whole picture across the line that bisects the angle between the two apse lines swaps one orbit for the other (it maps orbit 1's periapsis direction onto orbit 2's, and vice versa), so this bisector is a symmetry line of the configuration, and the orbits' two intersection points must lie on it. That means each orbit reaches the crossing point at the *same* true anomaly, measured from its own periapsis: $\nu_1 = +\Delta\omega/2$ on orbit 1, $\nu_2 = -\Delta\omega/2$ on orbit 2 (or the mirror pair, $-\Delta\omega/2$ and $+\Delta\omega/2$, the other crossing).

Because both orbits have the same $a$, $e$, and reach the crossing at the same $|\nu|$, they arrive there with the same radius,
$$
r = \frac{p}{1+e\cos(\Delta\omega/2)},
$$
and by vis-viva, since speed depends only on $r$ and $a$, the same speed $v = \sqrt{\mu(2/r-1/a)}$. The two velocity vectors at the crossing are not the same, though: one orbit is climbing away from its periapsis ($\nu_1 = +\Delta\omega/2$, positive flight-path angle) while the other is descending toward its periapsis ($\nu_2=-\Delta\omega/2$, the same flight-path angle but negative). Using the flight-path-angle relation from lesson 4,
$$
\gamma = \arctan\!\left(\frac{e\sin(\Delta\omega/2)}{1+e\cos(\Delta\omega/2)}\right),
$$
the two velocities have equal magnitude $v$ and are mirror images across the local radius vector, separated by angle $2\gamma$. This is exactly the isoceles case of the combined-burn law of cosines, and it collapses the same way the pure plane change did in lesson 5:
$$
\Delta v = 2v\sin\gamma .
$$

::: key Apsidal rotation
At the crossing point of two same-shape orbits whose apse lines differ by $\Delta\omega$, both orbits have radius $r = p/(1+e\cos(\Delta\omega/2))$ and speed $v$ from vis-viva, with flight-path angles $\pm\gamma$, $\gamma = \arctan\!\big(e\sin(\Delta\omega/2)/(1+e\cos(\Delta\omega/2))\big)$. The rotation costs
$$
\Delta v = 2v\sin\gamma .
$$
:::

::: example Rotating a GTO's apse line
The GTO from earlier lessons has $a=24\,421.0\,\mathrm{km}$, $e=0.7265$, $p=11\,529.9\,\mathrm{km}$ – highly eccentric, so the orbit is moving fast and is tightly curved near its own periapsis. Rotate the apse line by $\Delta\omega=10^\circ$: the crossing is at $\nu=5^\circ$, $r=6688.7\,\mathrm{km}$ (barely above the true periapsis of $6678\,\mathrm{km}$), $v=10.1422\,\mathrm{km/s}$, $\gamma=2.104^\circ$, giving $\Delta v = 2(10.1422)\sin2.104^\circ = 0.7446\,\mathrm{km/s}$. Push to $\Delta\omega=30^\circ$: $\nu=15^\circ$, $r=6775.2\,\mathrm{km}$, $v=10.0669\,\mathrm{km/s}$, $\gamma=6.306^\circ$, $\Delta v=2.2113\,\mathrm{km/s}$. Rotating the apse line of a GTO-like orbit by even a modest angle is expensive — tripling $\Delta\omega$ from $10^\circ$ to $30^\circ$ roughly tripled the cost too, because the crossing point stays near the fast, tightly-curved periapsis region for any modest rotation.
:::

::: example The same rotation on a rounder orbit
Keep $\Delta\omega=20^\circ$ fixed and vary only the orbit's shape. On the GTO ($e=0.7265$): crossing at $r=6721.0\,\mathrm{km}$, $v=10.114\,\mathrm{km/s}$, $\gamma=4.206^\circ$, $\Delta v = 1483.6\,\mathrm{m/s}$. On a moderately eccentric orbit ($r_p=20\,000$, $r_a=40\,000\,\mathrm{km}$, $e=0.333$): crossing at $r=20\,076.3\,\mathrm{km}$, $v=5.1402\,\mathrm{km/s}$, $\gamma=2.495^\circ$, $\Delta v=447.6\,\mathrm{m/s}$. On a nearly circular high orbit ($r_p=38\,000$, $r_a=44\,000\,\mathrm{km}$, $e=0.073$): crossing at $r=38\,039.4\,\mathrm{km}$, $v=3.3519\,\mathrm{km/s}$, $\gamma=0.679^\circ$, $\Delta v=79.5\,\mathrm{m/s}$. The same $20^\circ$ rotation costs nearly nineteen times less on the near-circular orbit than on the GTO. This is the same lesson as plane changes, restated for a different axis of rotation: cost scales with the speed being rotated, and eccentric orbits are fast exactly where their apse line is easiest to specify precisely, which is also where rotating it is most expensive.
:::

::: warning $\Delta\omega/2$, not $\Delta\omega$, drives the geometry
Both the crossing radius and the flight-path angle depend on the *half*-angle $\Delta\omega/2$, not the full rotation. Plugging $\Delta\omega$ directly into the flight-path-angle formula in place of $\Delta\omega/2$ finds the wrong crossing point entirely and produces a $\Delta v$ that does not correspond to any real maneuver.
:::

::: warning Two crossing points, one cheaper maneuver in general only by symmetry
The two orbits cross twice, at $\nu = +\Delta\omega/2$ and (by the mirror symmetry) at the point diametrically related through the geometry, $\nu=-\Delta\omega/2$ measured the other way around. For this same-$a$, same-$e$ case the two crossings are mirror images and cost the same $\Delta v$ by symmetry, but it is still worth checking both true anomalies land at a physically sensible, accessible point in the mission timeline — one may occur where the spacecraft is not scheduled to be for a long time.
:::

## Check yourself

::: check
Explain why the two orbits in an apsidal rotation maneuver always cross at the same radius, using only the fact that they share $a$ and $e$.
:::

::: answer
Radius on a Kepler orbit depends on true anomaly only through $r=p/(1+e\cos\nu)$, and $p=a(1-e^2)$ depends only on $a$ and $e$, which are identical for both orbits. The symmetry argument shows both orbits reach the crossing at the same magnitude of true anomaly from their own periapsis, $|\nu|=\Delta\omega/2$; since $\cos$ is an even function, $\cos(+\Delta\omega/2)=\cos(-\Delta\omega/2)$, so both orbits give exactly the same $r$ at the crossing despite approaching it from opposite sides of their respective periapses.
:::

::: check
A circular orbit ($e=0$) is proposed for an apsidal rotation maneuver. What does the formula $\Delta v = 2v\sin\gamma$ predict, and does that make physical sense?
:::

::: answer
With $e=0$, the flight-path-angle formula gives $\gamma=\arctan(0/(1+0))=0$ for any $\Delta\omega$, so $\Delta v=2v\sin(0)=0$. This makes sense: a circular orbit has no periapsis or apoapsis to speak of — every point is equivalent — so "the argument of periapsis" is not even a meaningful, physically distinguishable quantity, and there is nothing to rotate. The zero-cost prediction is really a statement that the maneuver is undefined, not that it is free.
:::

::: check
Compute the apsidal-rotation Δv for a $15^\circ$ rotation on an orbit with $a=15\,000\,\mathrm{km}$, $e=0.5$.
:::

::: answer
$p=a(1-e^2)=15\,000(0.75)=11\,250\,\mathrm{km}$. Half-angle $\Delta\omega/2=7.5^\circ$. $r=p/(1+e\cos7.5^\circ)=11\,250/(1+0.5\times0.99144)=11\,250/1.49572=7521.5\,\mathrm{km}$. $v=\sqrt{\mu(2/r-1/a)}=\sqrt{398\,600.4418(2/7521.5-1/15\,000)}=\sqrt{398\,600.4418\times1.9923\times10^{-4}}=\sqrt{79.42}=8.9116\,\mathrm{km/s}$. $\gamma=\arctan(0.5\sin7.5^\circ/(1+0.5\cos7.5^\circ))=\arctan(0.06526/1.49572)=\arctan(0.04364)=2.498^\circ$. $\Delta v=2(8.9116)\sin2.498^\circ=2(8.9116)(0.043596)=0.7769\,\mathrm{km/s}$.
:::

::: check
Two mission designers each need to rotate an apse line by $20^\circ$: one on a Molniya-type orbit ($e\approx0.74$), one on a near-circular GPS-class orbit ($e\approx0.01$). Without recomputing exactly, rank their Δv costs and explain why.
:::

::: answer
The Molniya-type orbit costs far more — this lesson's worked comparison already showed a GTO-class orbit ($e=0.727$) costing roughly nineteen times what a near-circular orbit ($e=0.073$) costs for the same $20^\circ$ rotation, and an even lower eccentricity like $0.01$ would push the near-circular case's cost down further still, toward the $e=0$ limit of zero. The reason is the same eccentricity-dependence in both the crossing speed (high-eccentricity orbits move fastest exactly near periapsis, which is where a modest apse-line rotation's crossing point stays) and the flight-path angle $\gamma$ (which grows with $e$ for a fixed $\Delta\omega/2$).
:::

::: check
Why is it misleading to call the natural apsidal drift caused by Earth's oblateness the "same thing" as the maneuver in this lesson?
:::

::: answer
They produce the same end result — the argument of periapsis changes — by completely different mechanisms and on completely different terms. The maneuver in this lesson is a single impulsive burn, paid for in Δv at a moment of the mission designer's choosing, computed from $2v\sin\gamma$. Oblateness-driven apsidal precession is a continuous perturbation, present at every instant whether wanted or not, that rotates the apse line slowly over many orbits with no propellant cost at all, and whose rate depends on inclination, eccentricity, and altitude through the $J_2$ physics of the next module rather than on any burn geometry. A mission might use the natural drift instead of a burn if it can wait, or might need a burn precisely to fight or accelerate past what the natural drift is doing.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $r = p/(1+e\cos(\Delta\omega/2))$ | Radius where two same-shape orbits with apse lines $\Delta\omega$ apart cross |
| $\gamma=\arctan\!\big(e\sin(\Delta\omega/2)/(1+e\cos(\Delta\omega/2))\big)$ | Flight-path angle at the crossing, equal and opposite on the two orbits |
| $\Delta v = 2v\sin\gamma$ | Apsidal rotation cost; $v$ from vis-viva at the crossing radius |
| GTO, $\Delta\omega=10^\circ\to30^\circ$ | $\Delta v$ rises from 0.745 to 2.211 km/s — roughly tripling with $\Delta\omega$ |
| Same $20^\circ$, $e=0.727\to0.073$ | $\Delta v$ falls from 1484 to 79 m/s — cost tracks eccentricity, not just angle |
| $e=0$ | Maneuver cost and definition both vanish — no apsis to rotate |
| Distinct from | $J_2$-driven apsidal precession (next module): continuous, propellant-free, not a burn |

Lessons 2 through 6 have all been about a single vehicle changing its own orbit. The next lesson introduces a second vehicle: phasing maneuvers, which use exactly the same period-and-speed machinery to close a gap in time rather than in space.
