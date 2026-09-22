---
id: l05-plane-changes
title: Plane changes and combined manoeuvres
minutes: 24
covers:
  - plane change and combined plane-change-plus-raise optimisation
---

Ask any launch provider why a rocket flies the azimuth it does off the pad, and the answer traces back to this lesson. Changing the plane an orbit lies in – its inclination, or more generally the orientation of the plane in space – is the single most expensive thing you can ask an orbit to do, expensive enough that mission designers will burn extra propellant on a longer ascent, accept a worse launch site, or wait months for a better one rather than pay for a large plane change in orbit. Understanding exactly why, and exactly where in an orbit to pay for one if you must, is the subject of this lesson.

The two orbital planes you are moving between always intersect along a line through the central body (or are identical, or – for a pure inclination change with the same argument of latitude – intersect along the node line). A plane-change burn has to happen on that line of intersection, because that is the only place a single impulsive burn can move a spacecraft from one plane directly into the other. Everything else in this lesson is about how much that burn costs, and how to spend it well.

## The cost of a pure plane change

Take a burn that only rotates the velocity vector by an angle $\Delta i$, leaving its magnitude $v$ unchanged – the cleanest case, isolating the plane change from any altitude change. This is the combined-burn law of cosines from lesson 1 with $v^- = v^+ = v$:
$$
\Delta v^2 = v^2 + v^2 - 2v^2\cos\Delta i = 2v^2(1-\cos\Delta i).
$$
Using the half-angle identity $1-\cos\Delta i = 2\sin^2(\Delta i/2)$,
$$
\Delta v = 2v\sin\!\left(\frac{\Delta i}{2}\right).
$$
The result is linear in $v$: doubling the speed at which you perform a pure plane change doubles its cost, exactly. There is no way around this by choosing a clever burn geometry – it is a direct consequence of the law of cosines, and it is the reason the rest of this lesson is entirely about *where* (equivalently, *how fast*) you perform the rotation.

::: example How much a 28.5° plane change costs, at four different speeds
Kennedy Space Center sits at $28.5^\circ$ latitude, so a due-east launch reaches a $28.5^\circ$ inclination orbit directly; reaching an equatorial orbit like GEO from there means eliminating that $28.5^\circ$ somewhere. Using $\Delta v = 2v\sin(14.25^\circ)$ at four speeds from this module's running LEO-to-GEO transfer:

| Where | $v$ (km/s) | $\Delta v$ for $28.5^\circ$ |
| --- | --- | --- |
| LEO circular (6678 km) | 7.7258 | 3.8035 km/s |
| GTO perigee | 10.1516 | 4.9977 km/s |
| GTO apogee | 1.6078 | 0.7915 km/s |
| GEO circular | 3.0747 | 1.5137 km/s |

The same $28.5^\circ$ rotation costs $4.9977\,\mathrm{km/s}$ at GTO perigee and $0.7915\,\mathrm{km/s}$ at GTO apogee – a factor of 6.3. No mission flies the plane change at perigee if apogee is available.
:::

::: key Pure plane change
$$
\Delta v = 2v\sin\!\left(\frac{\Delta i}{2}\right).
$$
Cost scales linearly with the speed at which the rotation is performed; do it at the slowest available point.
:::

## Combining the plane change with an altitude change

A plane change is almost never the only thing happening at a burn – on a GTO-to-GEO mission the apogee burn already has to raise the transfer orbit's apogee speed up to GEO circular speed, and it would be wasteful to treat the rotation as a separate maneuver. The combined burn changes both speed and direction in one impulse, and its cost is again the law of cosines, now with $v^- \neq v^+$:
$$
\Delta v = \sqrt{(v^-)^2 + (v^+)^2 - 2v^-v^+\cos\Delta i}.
$$

Combining is always at least as cheap as doing the two changes as separate burns at the same point, and usually strictly cheaper. Here is why, exactly: picture the two velocities as points in a plane, $A$ at distance $v^-$ from the origin and $B$ at distance $v^+$, separated by angle $\Delta i$. The combined burn is the straight segment $AB$, with length given by the law of cosines above. A *sequential* pair of burns – say, rotate first (moving from $A$ to a point $C$ at the same distance $v^-$ but at $B$'s angle), then change speed (from $C$ to $B$, now both at the same angle) – traces the path $A \to C \to B$, with total length $|AC|+|CB|$. Since $A$, $B$, $C$ form an ordinary triangle, the triangle inequality gives $|AB| \le |AC|+|CB|$, with equality only in the degenerate case $v^-=v^+$ or $\Delta i = 0$. The single combined burn is never longer than any sequential pair, and generically shorter.

::: example Combined burn versus doing it in two steps, at GTO apogee
At GTO apogee, $v^- = 1.6078\,\mathrm{km/s}$; the GEO circular speed is $v^+ = 3.0747\,\mathrm{km/s}$; take the full $\Delta i = 28.5^\circ$. Combined:
$$
\Delta v = \sqrt{1.6078^2+3.0747^2-2(1.6078)(3.0747)\cos28.5^\circ} = 1.8302\,\mathrm{km/s}.
$$
Rotate first (at the slow $1.6078\,\mathrm{km/s}$), then raise speed: $2(1.6078)\sin(14.25^\circ) + (3.0747-1.6078) = 0.7915+1.4669 = 2.2584\,\mathrm{km/s}$ – 23 % more than combining. Raise speed first, then rotate at the now-faster $3.0747\,\mathrm{km/s}$: $(3.0747-1.6078)+2(3.0747)\sin(14.25^\circ) = 1.4669+1.5137=2.9805\,\mathrm{km/s}$ – 63 % more. Combining wins outright, and even the better-ordered sequential pair (rotate while still slow) loses to it.
:::

::: key Combined beats sequential
For any two burns performed at the *same point*, one combined burn changing both speed and direction costs no more, and usually strictly less, than performing the two changes as separate impulses in either order. If burns must be sequential, do the rotation while the vehicle is slower.
:::

## Splitting a plane change between two burns

A full LEO-to-GEO mission has *two* burns available – the perigee departure and the apogee arrival – and the $28.5^\circ$ does not have to be spent entirely at either one. Split it: perform a fraction $f$ of $\Delta i$ combined with the perigee burn (raising speed from circular to transfer-orbit periapsis speed while rotating) and the remaining $(1-f)\Delta i$ combined with the apogee burn. Each burn is a combined-burn law of cosines with its own share of the angle:
$$
\Delta v(f) = \sqrt{v_1^2+v_p^2-2v_1v_p\cos(f\Delta i)} + \sqrt{v_a^2+v_2^2-2v_av_2\cos\big((1-f)\Delta i\big)},
$$
using the LEO circular speed $v_1$, transfer periapsis speed $v_p$, transfer apoapsis speed $v_a$, and GEO circular speed $v_2$ from lesson 2's Hohmann numbers. Minimising this numerically over $f \in [0,1]$ for the LEO-to-GEO case gives an optimum at $f^\star = 0.0772$ – putting only $2.20^\circ$ of the $28.5^\circ$ at perigee and the remaining $26.30^\circ$ at apogee – with total $\Delta v(f^\star) = 4.2314\,\mathrm{km/s}$, against $4.2560\,\mathrm{km/s}$ for putting the entire rotation at apogee ($f=0$): a saving of $24.6\,\mathrm{m/s}$.

That saving is small, and worth being honest about: it is a second-order correction on top of the much larger decision (apogee, not perigee) this lesson already established. It exists because the perigee burn is already changing speed from $v_1$ to $v_p$, and the vector-addition geometry means a *small* rotation added to an already-large speed change costs less at the margin than the same small rotation added purely at apogee. Compare this optimum against putting the *entire* plane change at perigee instead ($f=1$): $\Delta v(1) = 6.4561\,\mathrm{km/s}$, 52 % more than the optimum. The 2° correction is a fine-tuning; choosing apogee over perigee in the first place is the decision that actually matters, worth more than fifty times as much.

::: example Why the optimum favours a small perigee share at all
At $f=0$, the apogee burn alone must rotate the full $28.5^\circ$ while raising speed from $1.6078$ to $3.0747\,\mathrm{km/s}$. Shifting a couple of degrees to perigee means the apogee burn now rotates only $26.3^\circ$ – cheaper by more than the small extra cost of tacking $2.2^\circ$ onto the already-large perigee speed change, because the perigee burn's dominant cost is the speed change ($10.1516-7.7258=2.4258\,\mathrm{km/s}$) and a small added rotation barely moves the law-of-cosines result when one leg of the triangle already dominates. Past $f^\star=0.0772$, the marginal cost of adding more rotation to the (much faster) perigee burn overtakes the marginal saving at apogee, and the total starts rising again.
:::

::: warning The Oberth effect and a plane change are different things
It is tempting to think "burns are more efficient deep in a gravity well, so do the plane change at perigee." The Oberth effect (lesson 8's neighbour in spirit, covered properly when you meet finite burns) is about *energy* – the same $\Delta v$ buys more specific energy at high speed. A pure rotation does not change speed or energy at all; the $2v\sin(\Delta i/2)$ formula says the opposite of Oberth for a rotation: pay for it slow, not fast.
:::

::: warning A plane change is not just inclination
Everything here applies to rotating the orbital plane through any angle between two planes that intersect at the burn point – a change in right ascension of the ascending node with fixed inclination, or a combined change in both, follows the same $\Delta v = 2v\sin(\Delta i/2)$ formula with $\Delta i$ replaced by the angle between the initial and final orbit-normal vectors, not literally the difference in the two inclinations unless the burn happens to be a pure inclination-only rotation.
:::

## Check yourself

::: check
A satellite needs a $5^\circ$ inclination change performed at a circular speed of $4.50\,\mathrm{km/s}$. Compute the Δv, and then find the speed at which the same rotation would cost half as much.
:::

::: answer
$\Delta v = 2(4.50)\sin(2.5^\circ) = 9.00 \times 0.043619 = 0.3926\,\mathrm{km/s}$. Since $\Delta v$ is linear in $v$ for a fixed angle, halving the cost means halving the speed: $v = 2.25\,\mathrm{km/s}$ gives $\Delta v = 2(2.25)\sin(2.5^\circ) = 0.1963\,\mathrm{km/s}$, exactly half.
:::

::: check
Explain why the combined-burn triangle-inequality argument guarantees combining is never worse than sequential burns, but does not by itself say combining is *always* strictly better.
:::

::: answer
The triangle inequality $|AB|\le|AC|+|CB|$ holds with equality exactly when $C$ lies on the straight segment $AB$. Geometrically that happens only in degenerate cases – when $\Delta i = 0$ (no rotation at all, so $A=B$'s direction and there is nothing to combine) or when $v^-=v^+$ in a particular special alignment. For any genuine combination of a nonzero speed change and a nonzero rotation with $v^- \ne v^+$, $C$ is off the direct segment and the inequality is strict, which is why every worked example in this lesson shows a real gap rather than a tie.
:::

::: check
A mission has both a $10^\circ$ plane change and an altitude raise to perform, and has only one available burn point, where the pre-burn speed is $5.0\,\mathrm{km/s}$ and the required post-burn speed is $5.8\,\mathrm{km/s}$. Compute the combined Δv and compare it with the cost of a pure $10^\circ$ rotation alone at $5.0\,\mathrm{km/s}$.
:::

::: answer
Combined: $\Delta v = \sqrt{5.0^2+5.8^2-2(5.0)(5.8)\cos10^\circ} = \sqrt{58.64-57.119} = \sqrt{1.521}=1.2334\,\mathrm{km/s}$. Pure rotation alone at $5.0\,\mathrm{km/s}$: $2(5.0)\sin5^\circ=0.8716\,\mathrm{km/s}$. The combined burn, which does strictly more (both the rotation and the full speed increase of $0.8\,\mathrm{km/s}$), costs only about $362\,\mathrm{m/s}$ more than the rotation alone would have cost by itself — far less than simply adding the $0.8\,\mathrm{km/s}$ speed change on top, which is the combining saving at work.
:::

::: check
Why does the optimal-split calculation put only about $2.2^\circ$ of the $28.5^\circ$ plane change at perigee rather than, say, half?
:::

::: answer
Perigee is the fast point of the transfer orbit (over $10\,\mathrm{km/s}$ here), so by the $2v\sin(\Delta i/2)$ scaling any rotation performed there is intrinsically expensive per degree; the perigee burn's cost is dominated by the large speed change it must make regardless, and only a small additional rotation can be added before the marginal cost of rotating at that high speed overtakes the marginal saving of unloading degrees from the (much slower, much cheaper-per-degree) apogee burn. The optimum balances these two marginal costs, and because apogee is so much slower than perigee in a highly eccentric transfer orbit, that balance point sits close to zero at perigee, not at an even split.
:::

::: check
If a mission's transfer orbit were far less eccentric — apogee and perigee speeds nearly equal — what would you expect the optimal perigee share $f^\star$ to look like, and why?
:::

::: answer
Close to $f^\star = 0.5$, an even split. The reason the LEO-to-GEO optimum is so lopsided is the large gap between perigee speed ($10.15\,\mathrm{km/s}$) and apogee speed ($1.61\,\mathrm{km/s}$) on a highly eccentric GTO; when the two speeds are nearly equal there is no "cheap end" to favour, the marginal cost of a degree of rotation is nearly the same at both burns, and the minimum of $\Delta v(f)$ moves toward splitting the angle evenly between them.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\Delta v = 2v\sin(\Delta i/2)$ | Pure plane change; linear in speed |
| $\Delta v=\sqrt{(v^-)^2+(v^+)^2-2v^-v^+\cos\Delta i}$ | Combined speed-and-plane-change burn |
| Combined $\le$ sequential | Triangle inequality; equality only when $v^-=v^+$ or $\Delta i=0$ |
| 28.5° at LEO vs GTO apogee | 3.80 km/s versus 0.79 km/s — a factor of 6.3 |
| GTO apogee combined vs best sequential | 1.8302 km/s versus 2.2584 km/s |
| Optimal split, LEO$\to$GEO, 28.5° | $f^\star=0.0772$ (2.20° at perigee), saves 24.6 m/s versus all-at-apogee |
| All plane change at perigee | 6.4561 km/s — 52% worse than the optimal split |

Plane changes are the most expensive routine maneuver in this module, which is exactly why the next lesson's in-plane cousin — rotating the line of apsides rather than the orbital plane — is worth comparing against it directly: the same law of cosines, but a very different price depending on where in the orbit you are forced to pay it.
