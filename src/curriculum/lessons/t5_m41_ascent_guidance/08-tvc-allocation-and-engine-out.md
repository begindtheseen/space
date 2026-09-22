---
id: l08-tvc-allocation-and-engine-out
title: Thrust vector control allocation and engine-out contingency
minutes: 20
covers:
  - Thrust vector control allocation and engine-out contingency
---

An engine failure on a multi-engine vehicle is really two problems arriving at once, on two different timescales. Within a fraction of a second, the loss of thrust at one point on the airframe creates a torque nothing was producing a moment ago, and the attitude control system has to null it using whatever engines are still running — an allocation problem, solved by the control loop, largely independent of guidance. Over the following seconds to minutes, the vehicle has less total impulse available than the mission was planned around, and something — guidance, or the flight rules behind it — has to decide what that costs and whether the planned orbit is still reachable. This lesson takes both in turn, using the engine-out mechanism this module has referenced since Powered Explicit Guidance's own robustness argument and finally computing what it actually costs.

## The torque a missing engine creates

Picture a ring of outboard engines mounted at radius $R$ from the vehicle's centerline, each contributing thrust purely along the axis (no gimbal, for the moment). Symmetric ring, symmetric thrust: every engine's off-axis moment contribution cancels the one diametrically opposite it, and the net torque about the centerline is exactly zero — the configuration this module has assumed implicitly every time it wrote "thrust along the velocity vector" for the whole vehicle rather than engine by engine. Remove one engine from the ring and that cancellation breaks. The remaining thrust pattern is exactly as if every engine still fired *and* a fictitious force equal to the missing engine's thrust were applied at its old position, pointing the opposite way — because that fictitious addition is precisely what would restore the original, torque-free symmetry. The resulting moment about the vehicle's center of mass has magnitude

$$
M_{\text{fail}} = T_{\text{eng}}\, R,
$$

the lost engine's own thrust times its distance from the centerline.

::: example The size of the imbalance
A vehicle with 9 engines at 845.2 kN each (sea-level thrust) mounted on a ring of radius $R = 1.5\ \mathrm{m}$ loses one outboard engine. The resulting moment is

$$
M_{\text{fail}} = 845{,}200 \times 1.5 = 1{,}267{,}800\ \mathrm{N\cdot m} = 1267.8\ \mathrm{kN\cdot m},
$$

applied the instant the engine drops out, with nothing yet compensating it.
:::

::: key
A single missing engine on a symmetric ring produces a residual moment $M_{\text{fail}} = T_{\text{eng}} R$ — exactly the moment a fictitious thrust equal to the lost engine's, applied at its old position and pointing the opposite way, would create, because that is precisely what the loss removes from an otherwise self-cancelling pattern.
:::

## Compensating it: gimbal deflection and its lever arm

The remaining engines null this moment by gimballing — tilting their own thrust slightly off-axis, which produces a *lateral* thrust component acting at the engine's mounting point. Crucially, the lever arm for *this* mechanism is not the ring radius $R$ at all: a lateral force at the aft end of the vehicle produces a pitch or yaw moment about the center of mass using the much longer distance $L$ from the center of mass to the engine gimbal plane — commonly tens of metres for a launch vehicle, against a ring radius of order a metre or two. A gimbaling engine's compensating moment, spread over $N$ engines each deflected by angle $\delta$, is $N\, T_{\text{eng}}\sin\delta \, L$; setting this equal to $M_{\text{fail}}$ gives

$$
\sin\delta = \frac{R}{N L}.
$$

::: example Concentrated correction versus spread correction
With $R = 1.5\ \mathrm{m}$ and an illustrative $L = 25\ \mathrm{m}$ (the center-of-mass-to-gimbal-plane distance, which itself changes through the flight as propellant burns off — a real implementation tracks it, not a fixed constant):

| engines used for correction | $\delta$ (gimbal angle) | axial thrust lost to $\cos\delta$ |
| --- | --- | --- |
| $N=1$ (the engine diametrically opposite the failure) | $3.44^\circ$ | $0.180\%$ |
| $N=2$ | $1.72^\circ$ | $0.045\%$ |
| $N=7$ (every remaining outboard engine) | $0.49^\circ$ | $0.0037\%$ |

Concentrating the correction on one engine uses a comfortably achievable gimbal angle at real, if small, thrust-vector cost, and leaves that one engine with less remaining gimbal authority for everything else it is simultaneously doing — steering, wind response, slosh and bending-mode damping. Spreading the same correction across every available engine needs a barely measurable half-degree each and leaves each engine's own margin almost untouched. Real allocation logic in a control system does the latter by default and concentrates only when an actuator's authority is otherwise exhausted.
:::

There is one geometric point worth being explicit about: an engine mounted *on* the centerline has $R=0$, so it contributes nothing to the static-imbalance mechanism above by sitting there un-gimbaled — a centerline engine cannot null a ring engine's missing moment by presence alone. It gimbals exactly like any other engine, using its own lever arm $L$ to the center of mass, and that mechanism works whether the engine is on the centerline or off it; what does not work for a centerline engine is producing a moment by thrusting straight back, because $R=0$ there. The two mechanisms — a static ring imbalance from thrust position, and an active gimbal correction from thrust direction — use different lever arms, and it is worth keeping them straight.

::: warning
Do not treat the allocation problem as solved once the moment is nulled. Every degree of gimbal spent on engine-out compensation is a degree not available for the vehicle's ordinary attitude and load-relief authority a moment later, and a design that leaves too little margin after a single failure has traded one problem for a smaller, deferred version of the same problem the next time a disturbance arrives.
:::

## What the failure costs guidance

The control loop's job ends once the vehicle is stable again, a matter of a second or two. Guidance's problem is what comes after: the vehicle has fewer functioning engines for however long the fault persists, meaning lower thrust-to-weight and, by this module's very first lesson, more gravity loss for as long as the degraded state lasts. Because PEG and its relatives are explicit — they compute from the vehicle's actual current mass and thrust every cycle, not from a stored plan — nothing special has to happen in the guidance algorithm itself: it sees a lower thrust, a longer time-to-go, and re-solves the same problem it always solves. What is not automatic is whether the mission still has enough propellant margin to pay for it.

::: example How much reserve a failure actually consumes
Fail one of nine first-stage engines at three different points in an otherwise-nominal ascent to a 400 km target, and let the same exoatmospheric guidance from earlier in this module fly the rest of the mission unmodified:

| engine-out time | fraction of stage-1 burn | stage-2 reserve remaining at insertion | reserve consumed vs. nominal (4956.8 kg) |
| --- | --- | --- | --- |
| $t=90.9\ \mathrm{s}$ | 60% | 3876.4 kg | 1080.4 kg |
| $t=120.0\ \mathrm{s}$ | 79% | 4704.6 kg | 252.2 kg |
| $t=136.3\ \mathrm{s}$ | 90% | 4903.0 kg | 53.8 kg |

Insertion accuracy barely moves in any case (radius error stays under a metre) — guidance closes that gap regardless. Reserve is what actually pays, and it pays more for an *earlier* failure: an engine lost at 60% of the way through stage 1 costs twenty times what the same failure costs at 90%, because the vehicle spends far longer flying underpowered, fighting gravity a while longer before staging, exactly the loss mechanism this module derived in its first lesson. Time spent degraded is what is expensive, not the failure itself.
:::

## When the reserve is not enough

A large enough shortfall consumes more than the reserve exists to cover, and here the explicit-guidance property from earlier in this module earns its keep in the clearest possible way: because every cycle checks the time-to-go it needs against the burn time the remaining propellant can actually deliver, a genuine shortfall is detected the moment it becomes true, not discovered by running out of propellant mid-course.

::: example A shortfall that makes the planned orbit unreachable
Suppose stage 2 loses 5% of its usable propellant — a stuck valve, an unexpectedly large residual, any fault that leaves less in the tanks than planned. Guidance's very first cycle compares the time-to-go the 400 km target requires, 354.1 s, against the 343.3 s the remaining propellant can actually burn for, and reports the target unreachable before a single second of the burn has flown — not a slow drift toward a target that never arrives, a clean, immediate answer. Searching for the highest circular orbit the same remaining propellant *can* reach finds 350.0 km, 50.0 km short of the plan. Retargeting guidance to that lower orbit converges exactly as cleanly as every nominal case in this module: a few metres of radius error, a handful of metres per second of residual velocity, propellant to spare.
:::

This is the decision a real contingency logic has to make, sitting just outside the guidance algorithm itself: once a shortfall is detected, is there a *lower* stable orbit worth flying to, or is even that unreachable — the boundary this module's next lesson but one takes up directly, in the language of abort modes. The guidance mechanism that makes a graceful degradation possible at all, though, is exactly the one this lesson has now shown working end to end: explicit, re-converging, and honest about what it can no longer deliver the instant that becomes true.

## Check yourself

::: check
A vehicle has 12 outboard engines instead of 9, each producing 620 kN, mounted on a ring of radius 1.8 m. One engine fails. Compute the resulting moment.
:::

::: answer
$M_{\text{fail}} = T_{\text{eng}} R = 620{,}000 \times 1.8 = 1{,}116{,}000\ \mathrm{N\cdot m} = 1116\ \mathrm{kN\cdot m}$ — the mechanism does not depend on how many *other* engines exist, only on the failed engine's own thrust and its distance from the centerline.
:::

::: check
Explain why a centerline engine's gimbal deflection can still help null an engine-out moment, even though the centerline engine itself contributes zero moment when firing straight back.
:::

::: answer
The two mechanisms use different lever arms. An un-gimbaled engine's contribution to a *static* ring-imbalance moment scales with its radial mounting offset $R$, which is zero on the centerline — so a centerline engine's presence alone does nothing for that specific imbalance. But a *gimbaled* engine's lateral thrust component produces a moment using the distance $L$ from the center of mass to the engine's gimbal plane, which is generally large and has nothing to do with $R$; a centerline engine gimbals and contributes to attitude control exactly as any other engine does, through $L$, not through $R$.
:::

::: check
Using $\sin\delta = R/(NL)$, find the gimbal angle needed to null a moment using $N=4$ engines, with $R=1.5\ \mathrm{m}$ and $L=25\ \mathrm{m}$, and compare the cosine-loss fraction to the $N=7$ case in the lesson.
:::

::: answer
$\sin\delta = 1.5/(4\times25) = 0.015$, so $\delta = 0.8594^\circ$, and the axial thrust fraction lost is $1-\cos\delta = 1-0.99989 = 0.0112\%$ — larger than the $N=7$ case's $0.0037\%$ (fewer engines sharing the same total correction, so each tilts further) but far smaller than the $N=1$ case's $0.180\%$, consistent with cosine loss falling roughly as $1/N^2$ for small angles.
:::

::: check
Two engine-out scenarios lose the same single engine, one at 60% of the way through stage 1 and one at 90%. Insertion accuracy is nearly identical in both. Explain why reserve consumption is not, using the gravity-loss mechanism from earlier in this module.
:::

::: answer
Guidance is explicit, so it closes the gap to the target regardless of how it got into a degraded state, which is why insertion accuracy stays similar. Reserve consumption instead tracks how long the vehicle actually flew with reduced thrust-to-weight: a failure at 60% of the burn leaves far more of the ascent still to fly underpowered than a failure at 90%, and every extra second at lower thrust-to-weight is an extra second of $g\sin\gamma$ gravity loss this module's first lesson quantified — that loss has to be paid from the same propellant margin that would otherwise have become reserve, so an earlier failure costs substantially more of it even when the final orbit looks identical.
:::

::: check
A guidance cycle reports the currently targeted orbit unreachable. What two questions does a real contingency logic still need to answer before it retargets, beyond the fact reported by guidance itself?
:::

::: answer
First, whether a *lower* stable orbit actually exists that the remaining propellant can reach — guidance's unreachable flag says the current target cannot be met, not that nothing can be reached, and a search over lower targets (as the worked example performs) is a separate step. Second, whether that lower orbit is an acceptable outcome for the mission at all — payload requirements, crew safety, or vehicle survivability may rule out an otherwise-reachable lower orbit, in which case the decision is not a new guidance target but an abort, the subject this module takes up next but one.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $M_{\text{fail}} = T_{\text{eng}} R$ | static moment from one missing ring engine; 1267.8 kN·m for the worked 845.2 kN, $R=1.5$ m example |
| $\sin\delta = R/(NL)$ | gimbal angle to null $M_{\text{fail}}$ using $N$ engines, lever arm $L$ to the CG |
| Centerline engine | $R=0$: contributes nothing to a static ring imbalance by firing straight back, but gimbals normally via $L$ |
| Concentrated vs. spread correction | $N=1$: $3.44^\circ$, 0.180% axial loss; $N=7$: $0.49^\circ$, 0.0037% loss |
| Explicit guidance's role | no special-case logic needed; re-solves from actual thrust and mass every cycle |
| Reserve cost of engine-out | grows sharply for an earlier failure — 1080 kg at 60% of burn vs. 54 kg at 90%, same single-engine loss |
| Unreachable-target detection | compares required $t_{go}$ against remaining-propellant burn time every cycle; a shortfall is caught immediately |
| Worked shortfall example | 5% stage-2 propellant loss makes 400 km unreachable; best reachable circular orbit is 350.0 km |

The next lesson turns to a disturbance guidance never sees directly at all — the load-relief control law the atmospheric flight module derived — and asks exactly what it costs the exoatmospheric guidance that inherits its aftermath.
