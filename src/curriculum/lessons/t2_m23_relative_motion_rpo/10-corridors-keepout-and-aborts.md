---
id: l10-corridors-keepout-and-aborts
title: Approach corridors, keep-out spheres and abort trajectories
minutes: 19
covers:
  - approach corridors and keep-out spheres
  - abort trajectories and collision avoidance manoeuvres
---

The previous lesson checked passive safety at individual points. Turning that into an operational approach means drawing the boundaries a real chaser must respect at every moment — a volume it may not enter without explicit authorization, and a channel it must stay inside while closing — and building the manoeuvre that recovers a trajectory the instant a burn genuinely fails partway through. This lesson builds both: the geometry (corridor and keep-out sphere) and the active response (the collision avoidance manoeuvre, or CAM) that passive safety alone cannot always guarantee once a real approach is underway.

## The keep-out sphere

A **keep-out sphere** is a simple spherical exclusion zone of some fixed radius centred on the target — for the ISS, $200\,\mathrm{m}$. No visiting vehicle may cross inside it without meeting specific, demonstrated conditions: verified navigation, a passively safe trajectory at every point of the planned approach (the previous lesson's whole subject), and, in practice, ground or crew authorization to proceed. Everything about proximity operations design outside this lesson's earlier material exists to make crossing that boundary defensible rather than merely intended.

## The approach corridor

Once inside the keep-out sphere, a chaser is further confined to an **approach corridor** — typically a cone of some half-angle $\theta_c$ about the intended docking axis, narrowing the allowable lateral (off-axis) position as range decreases. At range $r$ along the axis, the maximum permitted lateral offset is

$$
d_{\text{lat}}(r) = r\tan\theta_c.
$$

::: example Corridor tolerance at a 10° half-angle
With $\theta_c=10°$ (a representative value, matching this module's own worked exercises):

| Range | Lateral tolerance |
| --- | --- |
| 1000 m | 176.3 m |
| 250 m | 44.1 m |
| 200 m | 35.3 m |
| 30 m | 5.29 m |
| 10 m | 1.76 m |

The tolerance shrinks in direct proportion to range, which is exactly what makes it a *cone* rather than a cylinder: a lateral error that is perfectly acceptable at 1000 m ($176\,\mathrm{m}$ of slack) would put the chaser almost six times outside the entire corridor width at 30 m if it were not corrected as range closes. The corridor forces navigation and control accuracy to tighten in step with proximity, rather than allowing a fixed absolute tolerance to become a larger and larger fraction of the remaining distance.
:::

## Why the real protected volume is not a sphere

A keep-out *sphere* is the simplest shape to state, but the football-orbit and secular-drift lessons already showed that free relative motion does not spread out symmetrically from any point. A pure radial velocity error of size $\delta v$ produces a *bounded* excursion of amplitude $\delta v/n$ radially and $2\delta v/n$ in-track — already twice as far in-track as radially, for the identical error budget. A pure in-track velocity error of the same size $\delta v$ is worse still: it produces that same $2\delta v/n$ of bounded radial excursion, but *also* an unbounded secular in-track drift of $3\delta v$ per unit time that never stops growing. An identical, isotropic uncertainty in velocity — the honest way to describe "we don't know exactly which direction the error points" — therefore does not turn into an equally-sized position uncertainty in every direction; it turns into a region stretched substantially along the in-track axis and only modestly along the radial one.

This is the real justification for the **approach ellipsoid**, used operationally in place of a plain sphere: a protected volume elongated along the in-track direction, sized so that a given velocity-uncertainty budget maps onto roughly uniform protection in every direction of actual relative *position* risk, rather than a sphere that is needlessly conservative radially while still under-protecting in-track. It is the same 2:1-and-worse asymmetry from two lessons ago, read as a design requirement instead of a curiosity.

::: key Approach corridor and keep-out sphere
Keep-out sphere: a fixed-radius exclusion zone (200 m at the ISS) enterable only with a demonstrated, passively safe trajectory. Approach corridor: a cone of half-angle $\theta_c$ about the docking axis, lateral tolerance $r\tan\theta_c$ at range $r$. Real protected volumes are elongated in-track relative to radial or cross-track, because the same velocity-error budget produces roughly twice the bounded position spread in-track — and, if it is an in-track velocity error specifically, an unbounded secular spread that a sphere cannot represent at any fixed radius.
:::

## Abort trajectories and collision avoidance manoeuvres

Passive safety, from the previous lesson, answers "what happens if nothing more is done." A **collision avoidance manoeuvre (CAM)** is the deliberate, active alternative: a specific burn, computed and verified in advance for every phase of the approach, ready to fire the instant a fault is detected. The previous lesson's closing comparison already previewed the key finding: for an approach with a significant in-track closing rate and little or no radial offset, the most propellant-effective CAM is not necessarily "push away," but "stop closing" — a retrograde burn that cancels the in-track velocity outright.

::: example A CAM at the 30 m gate
A chaser at the 30 m hold point, closing at $0.03\,\mathrm{m/s}$ (the glideslope's own commanded rate there, from the previous glideslope lesson), loses its next burn. Left alone, free drift carries it to a minimum range of only $19.9\,\mathrm{m}$ — a $10.1\,\mathrm{m}$ penetration, a larger *fraction* of the starting range than the 200 m case two lessons back, because the closing rate here is proportionally faster relative to distance. A CAM firing purely retrograde, cancelling the closing rate entirely, restores the minimum range to exactly $30.0\,\mathrm{m}$ — no penetration at all. Partial cancellation interpolates smoothly: cancelling 25%, 50% and 75% of the closing rate leaves minimum ranges of $22.0\,\mathrm{m}$, $24.3\,\mathrm{m}$ and $27.0\,\mathrm{m}$ respectively, so even a CAM that cannot fully null the rate (thruster saturation, a partial failure) still buys back real margin in rough proportion to how much rate it removes.
:::

Two features of that example generalize to real abort design. First, the effective direction of a CAM depends on the geometry it is protecting — a retrograde (rate-cancelling) burn was the efficient choice here because the danger was an in-track closing rate with no radial offset; a different approach state (already carrying a large radial excursion, say) would call for a different CAM direction, and there is no single universally-best CAM vector independent of the state it is fired from. Second, and more important operationally: this computation has to exist *before* the fault happens. At 30 m and closing, there is no time to solve a targeting problem after a thruster fails — the CAM for every phase of a real approach is designed, verified against exactly this kind of free-drift analysis, and stored ready to execute automatically or on a single command, for every credible failure the mission has identified in advance.

::: warning A CAM designed in real time is a CAM designed too late
The gap between "burn fails" and "chaser needs to already be moving away" is seconds at close range — nowhere near enough time to run a targeting solve, let alone review it. Every CAM referenced in this lesson and the exercises attached to this module is computed ahead of time, for every hold point and every credible failure mode, and validated exactly the way the previous lesson validated passive safety: by propagating forward with the CAM applied and confirming the resulting free-drift trajectory clears the keep-out boundary by an acceptable margin, for the full required horizon.
:::

## Check yourself

::: check
At a range of 50 m with a corridor half-angle of $10°$, what is the maximum permitted lateral offset?
:::

::: answer
$d_{\text{lat}} = 50\tan(10°) = 50(0.1763) = 8.82\,\mathrm{m}$.
:::

::: check
Explain why a sphere is not the geometrically "correct" shape for a keep-out or protection volume, using the amplitude relationship between radial and in-track excursions from a common velocity-error budget.
:::

::: answer
A velocity error of a given size produces roughly twice as much bounded in-track position spread as radial spread (the football orbit's fixed 2:1 ratio), and if that error has any in-track component specifically, it additionally produces unbounded secular drift with no radial counterpart at all. A sphere assigns the same protective radius in every direction, which is unnecessarily large radially and potentially insufficient in-track — an ellipsoid elongated in-track matches the actual, physically-derived shape of the risk far better.
:::

::: check
Why does the corridor's lateral tolerance shrink in direct proportion to range rather than staying at some fixed absolute value all the way to contact?
:::

::: answer
Docking (or berthing) itself requires very tight final alignment, so the tolerance must reach a small absolute value by the time range reaches zero; a corridor shaped as a cone (tolerance $\propto r$) achieves this automatically while still allowing generous margin far out, without needing a separate schedule of tolerances — one half-angle parameter describes the whole taper.
:::

::: check
A fault at some approach point calls for a CAM, and two candidate burns are considered: one purely radial (outward), one purely retrograde (cancelling closing rate), of equal $\Delta v$ magnitude. Based on this lesson and the previous one, which is generally more effective when the approach state has a significant closing rate and little radial offset, and why?
:::

::: answer
The retrograde burn is generally more effective in that specific situation, because it removes the closing rate that was driving the chaser toward the target in the first place, converting the remaining (small or zero) radial offset into the kind of position-only state that drifts away on its own (per the secular-drift lesson) rather than continuing to close. A radial burn of the same size only partially compensates, since it does not address the closing rate directly and the resulting trajectory still carries forward in-track motion for some time before the added radial displacement matters.
:::

::: check
Why must a CAM be pre-computed for every phase of an approach rather than solved when a fault actually occurs?
:::

::: answer
The time available between a fault being detected and the chaser needing to already be executing a safe response is, at close range, a matter of seconds — far too short to run a targeting computation, verify it, and command it in real time. Pre-computing and validating a CAM for every credible failure at every phase moves that computation outside the time-critical window, leaving only "detect the fault, execute the pre-stored response" to happen live.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Keep-out sphere | Fixed-radius exclusion zone (200 m, ISS); entry requires a demonstrated passively-safe trajectory |
| $d_{\text{lat}}(r)=r\tan\theta_c$ | Approach corridor lateral tolerance at range $r$, half-angle $\theta_c$ |
| Approach ellipsoid | Protected volume elongated in-track, matching the 2:1-and-worse position spread from an isotropic velocity-error budget |
| Collision avoidance manoeuvre (CAM) | A pre-computed, pre-validated burn executed the instant a fault is detected |
| 30 m gate CAM example | No CAM: 19.9 m minimum range; full rate-cancelling CAM: 30.0 m (no penetration) |
| CAM direction | Must match the geometry of the threat — no single universal "best" direction |
| CAM timing | Computed and verified before the approach flies, never solved live |

With the geometry and the active recovery both in place, the remaining lessons turn to how a real mission actually flies this: the distinction between docking and berthing, the ISS visiting-vehicle profile that ties every hold point and gate together, and the sensors that measure range, rate and bearing precisely enough to fly any of it.
