---
id: l11-docking-vs-berthing-iss-profile
title: Docking vs berthing, and the ISS visiting-vehicle profile
minutes: 20
covers:
  - docking vs berthing
  - ISS visiting vehicle requirements
---

Every piece built so far in this module — frames, the CW solution, drift, closed loops, targeting, glideslopes, corridors, passive safety, CAMs — exists to answer one operational question: how does a real vehicle actually get from a few kilometres out to physically attached, safely, on a schedule the mission can plan around? This lesson assembles the pieces into that single narrative, and resolves the one decision that changes everything about the last few metres: whether the vehicle flies itself all the way to contact, or stops short and waits to be grabbed.

## Docking vs berthing

**Docking** is a dynamic capture: the chaser flies itself, under its own GNC, into a mechanism on the target, closing the final metres and absorbing the residual relative velocity and misalignment through a compliant capture mechanism designed for exactly that purpose. It is autonomous (or crew-flown from the chaser) and comparatively fast — the vehicle's own guidance carries it the whole way, so there is no need to wait for a separate resource to become available.

**Berthing** stops short. The chaser flies itself only to a stand-off hold point a few metres away and then holds station — actively, since the previous lessons already showed nothing "holds still" for free under real perturbations — while a robotic arm (on the ISS, Canadarm2) reaches out, grapples it, and berths it to a port, where it is then bolted on. Capture is no longer dynamic; the arm removes essentially all of the residual relative motion before structural attachment, which is gentler on both vehicles than a dynamic capture and tolerates a less precise final approach. The cost is dependency: berthing needs the arm, and usually a crew member operating it, to be available and ready, which constrains scheduling in a way a self-contained docking approach does not.

::: key Docking vs berthing
**Docking:** the chaser flies itself into the mechanism under its own GNC; capture is dynamic, autonomous, comparatively fast, and demands tight final-approach precision that the capture mechanism's compliance must still absorb. **Berthing:** the chaser holds a stand-off position; a robotic arm grapples and berths it; capture is gentler and more forgiving of final-approach precision, but depends on arm and crew availability.
:::

Neither is strictly better — the choice reflects the vehicle's own capability (does it carry a compatible docking mechanism, and GNC accurate enough to use it) and the mission's schedule tolerance for arm and crew availability. Cargo vehicles without a dynamic capture mechanism are berthed; crewed vehicles, needing a fast and schedule-independent return path, dock.

## The profile, end to end

Every lesson in this module maps onto one segment of an actual approach:

1. **Far-field targeting** (kilometre-scale): two-impulse CW targeting computes the coarse transfer from an initial hold or waiting orbit down toward the approach corridor, accepting the sub-metre residual error the validity-limits lesson quantified.
2. **Approach initiation**: the vehicle establishes itself on the chosen bar — V-bar or R-bar — with the passive-safety properties worked out for that specific geometry.
3. **Glideslope closure through staged hold points**: a continuous closing-rate law, executed as discrete correction burns, carries the vehicle between gates — this module's own worked example closes 250 m to 30 m in 35.3 minutes and 30 m to 10 m in a further 18.3 minutes, using a representative $b=0.001\,\mathrm{s^{-1}}$.
4. **Corridor and keep-out compliance, continuously**: at every point inside the keep-out sphere, the vehicle's lateral position must sit inside the shrinking corridor cone, and every point along the way must remain passively safe or actively protected by a pre-verified CAM.
5. **Final approach to contact**: closing rate and lateral/angular alignment converge to whatever envelope the capture method — docking mechanism or robotic arm — requires.

::: example A representative proximity-operations timeline
Stitching together only the numbers already derived in this module: closing 250 m to 10 m via the worked glideslope takes $53.6\,\mathrm{minutes}$ of active closure. Add representative hold times of $10$–$15\,\mathrm{minutes}$ at each of the 250 m and 30 m gates for a go/no-go check (a deliberate pause, not a dynamics requirement — the vehicle is not drifting freely during a hold, it is actively station-keeping), and the final approach from 250 m to a 10 m hold point runs on the order of $75$–$85\,\mathrm{minutes}$ before the last, most tightly monitored segment into contact even begins. This is why proximity operations are scheduled in hours, not minutes, even though the raw orbital dynamics involved — one target orbital period here is $92.8\,\mathrm{minutes}$ — might suggest a much faster timeline is dynamically possible; the pace is set by verification, not by propellant or geometry.
:::

## What a visiting vehicle has to demonstrate

Every visiting-vehicle programme, ISS or otherwise, requires a chaser to show — not merely claim — a specific set of properties before it is allowed to proceed through each stage of the approach above:

- **Passively safe at every point**, verified by propagating forward with all further burns removed and confirming the keep-out boundary is not violated within the required horizon — exactly the test two lessons back.
- **Corridor conformance**, lateral position inside $r\tan\theta_c$ at every range, with the navigation accuracy to know that it is true, not merely to hope so.
- **A validated CAM for every phase**, ready to execute on a fault, computed and checked in advance rather than improvised.
- **Bounded closing rate and attitude at contact.** Different programmes and capture mechanisms set different exact numbers, but representative envelopes for a compliant docking mechanism are on the order of a few centimetres per second of closing rate and a fraction of a degree per second of angular rate at the moment of capture — tight enough that the glideslope's own floor rate (a controlled few centimetres per second, not an uncontrolled crawl to zero) is chosen with exactly this requirement in mind.
- **Independent verification through the approach**, typically via more than one relative-navigation sensor, so that a single sensor failure does not remove the vehicle's ability to confirm its own state — the subject of the next lesson.

::: example Checking one approach state against the requirements
At the 10 m hold point, a chaser reports a lateral offset of $1.2\,\mathrm{m}$ and a closing rate, per its own glideslope law with $a=0.005\,\mathrm{m/s}$, $b=0.001\,\mathrm{s^{-1}}$, of $a+br=0.005+0.001(10)=0.015\,\mathrm{m/s}$. Against the corridor tolerance at 10 m ($1.76\,\mathrm{m}$, from the corridor lesson), the $1.2\,\mathrm{m}$ offset is inside the cone with $0.56\,\mathrm{m}$ to spare. Against a representative contact-rate envelope of a few centimetres per second, $0.015\,\mathrm{m/s}$ is comfortably inside budget. Neither check alone clears the vehicle to proceed — both, together with a validated CAM at this exact point and confirmation from at least one relative-navigation sensor, are what "ready to continue" actually means operationally.
:::

::: warning Requirements compound, they do not average
A vehicle that is well inside its corridor tolerance but only marginally under its contact-rate limit is not "safely in the middle" of its overall envelope — it is one requirement away from a violation, and the requirements are typically checked as independent pass/fail gates, not blended into a single score. Meeting four of five requirements comfortably does not compensate for the fifth sitting at its edge; every one of them is evaluated on its own terms before proceeding to the next stage.
:::

## Check yourself

::: check
A cargo vehicle has no compatible dynamic-capture mechanism but the ISS's robotic arm is available on the planned schedule. Which capture method does it use, and why?
:::

::: answer
Berthing — without a compatible mechanism to fly itself into, dynamic docking is not an option regardless of GNC precision; the vehicle instead holds a stand-off position and is grappled and attached by the arm, which does not require the chaser to carry any capture hardware of its own.
:::

::: check
Why does berthing tolerate a less precise final approach than docking, given that both eventually result in the same physically-attached outcome?
:::

::: answer
In docking, the vehicle's own residual relative velocity and misalignment at contact must be absorbed entirely by the capture mechanism's compliance, so how precisely the chaser arrives directly sets how much the mechanism has to handle. In berthing, the robotic arm removes essentially all of the residual relative motion after grapple and before structural attachment, so the final approach only needs to get the chaser close enough, and slow enough, for the arm to safely grapple it — a much looser requirement than what a dynamic capture demands.
:::

::: check
Using only this module's own worked glideslope numbers, roughly how long does active closure from 250 m to 10 m take, and why is the total proximity-operations timeline typically several times longer than that?
:::

::: answer
Active closure (250 m to 30 m, then 30 m to 10 m) takes $35.3+18.3=53.6$ minutes from the worked example. The total timeline runs longer because deliberate holds for go/no-go verification are added at intermediate gates — station-keeping pauses inserted for checking, not dynamics the orbital mechanics themselves require — and the final approach to contact, most tightly monitored of all, has not even been included in that 53.6-minute figure.
:::

::: check
A vehicle is well inside its corridor lateral tolerance at a given range but its verified CAM at that exact point has not yet been validated for the current mass configuration. Should it proceed?
:::

::: answer
No. Corridor conformance is only one of several independent requirements; a validated CAM for the current configuration at that specific point is a separate, mandatory condition, and the warning box in this lesson is explicit that comfortable margin on one requirement does not offset a gap in another. Proceeding without a validated CAM leaves the vehicle without a verified safe response if a fault occurs exactly there.
:::

::: check
Why does a visiting vehicle need more than one independent relative-navigation sensor rather than one sufficiently accurate one?
:::

::: answer
A single sensor, however accurate under normal conditions, is a single point of failure — if it fails or gives corrupted data partway through the approach, a vehicle relying on it alone loses the ability to confirm its own state at exactly the moment that confirmation matters most. Independent sensors let the vehicle detect a disagreement (one sensor's report inconsistent with another's) rather than trusting a single, possibly-faulted source blindly.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Docking | Chaser flies itself into a capture mechanism; dynamic, autonomous, fast, precision-demanding |
| Berthing | Chaser holds a stand-off point; a robotic arm grapples and attaches it; gentler, schedule-dependent |
| Five-stage profile | Far-field targeting, approach initiation on a bar, staged glideslope closure, continuous corridor/keep-out compliance, final approach to contact |
| Worked timeline (250→10 m) | 53.6 minutes active closure; 75–85 minutes including representative gate holds |
| Contact requirements | Bounded closing rate and attitude rate, corridor conformance, validated CAM, passively safe state, independent sensor confirmation |
| Requirements are independent gates | Comfortable margin on one does not compensate for a marginal or unmet other |

The last piece this module has not yet supplied is how a vehicle actually measures its own range, rate and bearing precisely enough to fly any of this — the relative-navigation sensors the final lesson covers.
