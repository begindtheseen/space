---
id: l09-vbar-rbar-passive-safety
title: V-bar and R-bar approaches and passive safety
minutes: 23
covers:
  - V-bar and R-bar approaches and their safety properties
  - passive safety and safety ellipses
---

Every approach line a chaser could fly toward a target is, geometrically, just a choice of direction in the LVLH frame. Two of those directions dominate real rendezvous design: straight in along the velocity vector, and straight in along the local vertical. They look interchangeable on a diagram — both just "a line to the target" — and they behave completely differently the moment a burn is missed. This lesson works out exactly how differently, with real numbers, and arrives at the single idea that shapes every keep-out zone and approach corridor in operational use: an approach is only as good as what happens when the next planned burn simply does not fire.

## V-bar and R-bar

A **V-bar approach** flies along the in-track ($\hat{\mathbf{y}}$) line through the target — the velocity-vector line, hence the name. A chaser closing from behind sits at $y<0$ and moves toward $y=0$; one from ahead sits at $y>0$. A **R-bar approach** flies along the radial ($\hat{\mathbf{x}}$) line — the local vertical — typically from below ($x<0$, closer to Earth, moving outward toward $x=0$) or occasionally from above.

Both are flown in practice. Many cargo vehicles approach the ISS on V-bar; the Space Shuttle's final approach used R-bar specifically, and this lesson works out exactly why that choice was made rather than treating it as a historical curiosity.

## Passive safety

::: key Passive safety, defined
An approach point is **passively safe** if, assuming every subsequent manoeuvre fails to execute — total loss of propulsion, from that instant on — the resulting free-drift trajectory stays outside the keep-out volume for a specified horizon (commonly 24 hours). It is a property checked by propagating forward from every point on a planned approach with all further burns zeroed out, not an assumption granted to an approach because its geometry looks conservative.
:::

That last sentence is the point of this lesson. "R-bar is the safe one" is a half-truth repeated often enough to sound like a law of physics; the numbers below show it is a real, quantifiable, but *not absolute* advantage, and that V-bar's disadvantage is a specific, computable amount rather than a vague hazard.

## The test: a missed burn at 200 m

Set up the comparison on equal terms. In both cases the chaser is $200\,\mathrm{m}$ from the target — the ISS's own keep-out sphere radius — closing at $0.1\,\mathrm{m/s}$, with the next planned burn about to fire. It does not. Propagate the resulting free-drift CW trajectory for 24 hours and find the closest the chaser ever gets to the target.

**V-bar case:** $\boldsymbol\rho_0=(0,-0.2,0)\,\mathrm{km}$, $\dot{\boldsymbol\rho}_0=(0,\,0.0001,\,0)\,\mathrm{km/s}$ (closing from behind, no radial offset).

**R-bar case:** $\boldsymbol\rho_0=(-0.2,0,0)\,\mathrm{km}$, $\dot{\boldsymbol\rho}_0=(0.0001,\,0,\,0)\,\mathrm{km/s}$ (closing from below, no in-track offset).

| | V-bar | R-bar |
| --- | --- | --- |
| Starting range | 200.0 m | 200.0 m |
| Minimum range reached | **162.2 m** | **193.5 m** |
| Time to minimum | 553 s (9.9 min) | 130 s (2.2 min) |
| Penetration past the 200 m boundary | 37.8 m | 6.5 m |
| Range at $0.3$ orbit later | 432 m | 1265 m |

Both trajectories dip *inside* the 200 m boundary before receding — passive safety is not automatic for either geometry at this closing rate — but by very different amounts and on very different timescales. The V-bar case coasts $37.8\,\mathrm{m}$ deeper into the keep-out sphere before turning around; the R-bar case barely penetrates it at all, $6.5\,\mathrm{m}$, and reverses almost immediately. Once past the minimum, R-bar recedes nearly three times faster: by $0.3$ of an orbit the R-bar chaser is $1265\,\mathrm{m}$ away against V-bar's $432\,\mathrm{m}$.

::: example Why R-bar decelerates and V-bar does not
Evaluate the CW radial acceleration $\ddot x=3n^2x+2n\dot y$ at the instant thrust is lost, for each case. R-bar: $x_0=-0.2\,\mathrm{km}$, $\dot y_0=0$, so $\ddot x(0)=3n^2(-0.2) = -1.528\times10^{-7}\,\mathrm{km/s^2}$ — negative, directly opposing the chaser's positive (closing) radial velocity. The gravity-gradient term that produced the destabilizing $3n^2x$ in the very first CW derivation here works *for* safety: displaced below the target, the chaser is pulled to decelerate its own climb toward it.

V-bar: $x_0=0$, $\dot y_0=0.0001\,\mathrm{km/s}$, so $\ddot x(0)=2n\dot y_0=2.256\times10^{-7}\,\mathrm{km/s^2}$ — positive, pushing the chaser radially *outward*, off the V-bar line entirely, purely from the Coriolis coupling between in-track velocity and radial motion. There is no term here working to decelerate the in-track closing rate itself; the chaser continues to close for some time even as it drifts off-axis, which is exactly why it penetrates three times deeper before the geometry turns it away.
:::

::: key Why R-bar is passively safer, and what it costs
On R-bar, the gravity-gradient term that makes the CW radial equation unstable in general works, for an approach *from below*, to decelerate the closing motion automatically — a missed burn tends to let the chaser fall away rather than continue toward the target. The cost is that holding a controlled approach on R-bar means continuously thrusting *against* that same gradient the whole way in, burning more propellant than a comparable V-bar approach, and pointing the main thruster plume close to the target for a longer portion of the approach.
:::

## Closing rate and bias both matter

Passive safety at a given range is not fixed by geometry alone — how fast you were closing, and whether you were sitting exactly on the bar line or slightly off it, both change the outcome measurably.

::: example Slower is safer, on both bars
Repeating the V-bar case at three closing rates, same 200 m start:

| Closing rate | Minimum range |
| --- | --- |
| 0.100 m/s | 162.2 m |
| 0.050 m/s | 180.0 m |
| 0.020 m/s | 191.7 m |

Halving the closing rate roughly halves the penetration depth; a factor of five reduction (0.1 to 0.02 m/s) cuts the penetration from 37.8 m to 8.3 m. R-bar shows the same trend but from a much smaller base — at 0.05 m/s its minimum range is already $198.4\,\mathrm{m}$, just 1.6 m of penetration. This is the direct, quantitative reason approach glideslopes taper closing rate down near a keep-out boundary rather than holding a constant speed all the way to it: the rate itself is a passive-safety lever, not only a schedule.
:::

::: example A small bias changes the outcome, and the direction matters
Starting the same $200\,\mathrm{m}$, $0.1\,\mathrm{m/s}$ V-bar case with a small radial offset instead of sitting exactly on the bar:

| Radial bias $x_0$ | Minimum range |
| --- | --- |
| $-20\,\mathrm{m}$ (biased toward Earth) | 149.1 m |
| $-10\,\mathrm{m}$ | 156.3 m |
| $0$ (on the bar) | 162.2 m |
| $+10\,\mathrm{m}$ (biased away from Earth) | 167.6 m |
| $+20\,\mathrm{m}$ | 172.5 m |

Biasing the approach slightly *outward* (positive $x$, away from Earth) measurably reduces penetration; biasing *inward* makes it worse. This is not a symmetric effect, and guessing the sign wrong actively hurts the margin it was meant to protect — a biased V-bar approach is a real design tool, but only when the bias direction is verified against the actual dynamics rather than assumed.
:::

## A collision avoidance manoeuvre is not automatically effective either

A natural instinct when a burn is missed is to fire whatever thrusters remain immediately — a collision avoidance manoeuvre, covered formally two lessons ahead. It is worth previewing here that not all CAM directions are equally good. Adding an instantaneous radially-outward kick to the V-bar missed-burn state above, at increasing size, improves the minimum range only gradually: $0.05\,\mathrm{m/s}$ of extra radial $\Delta v$ raises the minimum from 162.2 m to 178.0 m; $0.10\,\mathrm{m/s}$ only reaches 186.0 m — still short of the original 200 m boundary. A *retrograde* burn of the same $0.10\,\mathrm{m/s}$, simply cancelling the closing rate outright, restores the minimum range to exactly $200.0\,\mathrm{m}$ — the full boundary, with no penetration at all. The most propellant-efficient response to a missed V-bar burn, at least for this geometry, is not to push away but to stop closing.

::: warning R-bar is safer, not safe
R-bar's $6.5\,\mathrm{m}$ penetration in the worked example is smaller than V-bar's $37.8\,\mathrm{m}$, but it is not zero. At a higher closing rate, or starting from a smaller range, an R-bar approach can still be driven inside a keep-out boundary before its natural deceleration takes over. Passive safety is a property of a specific state — range, closing rate, bias, all together — verified by propagating from that exact state, never a label attached permanently to "R-bar" or "V-bar" as a category. This is exactly why the exercises attached to this module ask you to check passive safety at *every* point along a planned approach, not once at the start.
:::

## Check yourself

::: check
At the instant a burn is missed, a chaser on R-bar has $x_0=-0.15\,\mathrm{km}$, $\dot x_0=0$, $\dot y_0=0$. What is $\ddot x(0)$, and what does its sign tell you about the immediate free-drift behaviour?
:::

::: answer
$\ddot x(0)=3n^2x_0 = 3(1.1282\times10^{-3})^2(-0.15) = -5.73\times10^{-7}\,\mathrm{km/s^2}$ — negative, meaning the chaser's radial velocity is being pushed further negative (deeper away from the target, since it starts at rest, $\dot x_0=0$): even with zero initial closing rate, the gravity-gradient term alone starts to accelerate the chaser away from the target rather than toward it, which is the source of R-bar's passive-safety advantage.
:::

::: check
Explain, without recomputing anything, why a V-bar chaser's radial acceleration at the instant of a missed burn depends on its closing rate $\dot y_0$ but an R-bar chaser sitting still on the bar ($\dot x_0=0$) has a nonzero radial acceleration even with zero velocity.
:::

::: answer
The V-bar chaser's radial acceleration is $\ddot x=3n^2x_0+2n\dot y_0$; with $x_0=0$ on the bar, only the Coriolis term $2n\dot y_0$ survives, so it vanishes if $\dot y_0=0$ and only appears because of the in-track *velocity*. The R-bar chaser has $x_0\ne0$, so the gravity-gradient term $3n^2x_0$ is present regardless of velocity — it is a *position*-driven effect (how far off the target's own orbital radius the chaser sits), not a velocity-driven one, so it does not need any closing rate to act.
:::

::: check
Two identical missed-burn V-bar states are compared: one gets no further action, one receives an instantaneous $0.1\,\mathrm{m/s}$ purely retrograde (in-track, opposing the closing rate) impulse. Which reaches a larger minimum range, and why does this make physical sense given what a retrograde burn does to closing rate?
:::

::: answer
The retrograde-burn case reaches the larger minimum range — in the worked comparison, exactly 200.0 m (no penetration) against 162.2 m with no action. A retrograde in-track impulse directly cancels the closing velocity that was carrying the chaser toward the target; with zero remaining closing rate the chaser is simply left with its unchanged radial offset, which (from the secular-drift lesson) drifts monotonically away rather than continuing to close, so the "minimum range" is simply the starting range itself.
:::

::: check
A mission argues that because R-bar showed smaller penetration than V-bar at $0.1\,\mathrm{m/s}$ closing rate, R-bar must be passively safe at any closing rate and any starting range. Identify the flaw in this argument using only what this lesson demonstrated.
:::

::: answer
The lesson's own numbers show R-bar's minimum range still fell short of the starting range at $0.1\,\mathrm{m/s}$ (193.5 m from a 200 m start, a real penetration) — R-bar is *better*, not immune. Nothing shown here establishes that this margin holds at every closing rate or range; the lesson explicitly demonstrated the opposite pattern for V-bar (higher closing rate, deeper penetration), and there is no reason from the physics to expect R-bar's penetration to stay negligible if closing rate were pushed high enough or starting range small enough — it would need to be checked, not assumed.
:::

::: check
Why does biasing a V-bar approach slightly outward (positive $x$) reduce penetration, given that the missed-burn V-bar acceleration $\ddot x(0)=2n\dot y_0$ (positive, pushing outward) does not depend on $x_0$ at all?
:::

::: answer
While the *instantaneous* acceleration at $t=0$ does not depend on $x_0$, the full trajectory does — $x_0$ enters the complete CW solution for $x(t)$ and $y(t)$ (through the $(4-3\cos nt)x_0$ and $6(\sin nt-nt)x_0$ terms), not just the initial acceleration. Starting already displaced in the direction the dynamics are pushing means the trajectory needs less additional radial travel to reach the same off-axis distance, so the moment of closest in-track approach occurs with more radial separation already built in — the bias does not change the initial push, but it does change where the whole subsequent path sits relative to the target.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| V-bar / R-bar | Approach along in-track ($y$) / radial ($x$) line through the target |
| Passive safety | Free-drift after total loss of propulsion still misses the target by more than the keep-out distance, for a stated horizon |
| $\ddot x(0)=3n^2x_0+2n\dot y_0$ | Radial acceleration at the moment thrust is lost — the source of both bars' behaviour |
| R-bar, missed burn from 200 m at 0.1 m/s | Dips to 193.5 m (6.5 m penetration), recedes fast |
| V-bar, same test | Dips to 162.2 m (37.8 m penetration), recedes slowly |
| Closing rate | Lower rate reduces penetration on both bars |
| Radial bias | Outward bias reduces V-bar penetration; inward bias increases it |
| Most effective single CAM here | A retrograde (rate-cancelling) burn outperforms an equal-magnitude radial-outward burn |

Passive safety at a single point is the building block; the next two lessons scale it up to a whole approach — the corridor and keep-out sphere that bound where a chaser is allowed to be, and the collision avoidance manoeuvres that recover a trajectory when a burn genuinely fails partway through.
