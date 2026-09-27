---
id: l11-docking-vs-berthing-iss-profile
title: Docking vs berthing, and the ISS visiting-vehicle profile
minutes: 16
covers:
  - docking vs berthing
  - ISS visiting vehicle requirements
---

There are two ways to plug a charger into a wall socket across the room. You can walk over, line the plug up yourself, and push it in. Or you can walk most of the way, stand still, and let a friend who is already next to the socket take the plug from you and push it in. Both end with the phone charging. They are very different jobs for you.

Spacecraft arriving at a space station face the same choice. **Docking** is walking over and plugging it in yourself. **Berthing** is stopping close by and letting the station's robotic arm do the last part.

Everything in this module so far — frames, the CW solution, drift, closed loops, targeting, glideslopes, corridors, passive safety, CAMs — serves one practical question. How does a real vehicle get from a few kilometers away to firmly attached, safely, on a schedule the mission can plan? This lesson puts the pieces together into one story, and settles the one decision that changes the last few meters completely: fly all the way in, or stop and wait to be grabbed.

## Docking: the vehicle flies itself in

In **docking**, the chaser flies itself, using its own guidance, navigation and control, right into a mechanism on the target. The last few meters are flown on the vehicle's own thrusters. At the moment of contact it is still moving a little — a few centimeters per second — and is probably slightly off line and slightly tilted.

A **[[compliant capture mechanism|soft-capture]]** takes up that leftover motion. "Compliant" means it gives a little, like the springy bumper on a playground slide. It catches the chaser, soaks up the bump, and then pulls the two vehicles together and latches them tight.

Docking is **dynamic capture**: the capture happens while things are moving. It can be fully automatic, or flown by a crew from inside the chaser. It is comparatively fast, because the vehicle's own guidance carries it the whole way. Nothing else on the station has to be ready.

## Berthing: the vehicle stops and is grabbed

**Berthing** stops short. The chaser flies itself only to a stand-off hold point, typically about $10\,\mathrm{m}$ from the station. Then it holds station there. That hold is active — as the earlier lessons showed, nothing holds still for free once real disturbances act on it.

Next a robotic arm reaches out and **grapples** it — grabs a fitting on its side. On the ISS the arm is **[[Canadarm2|canadarm2]]**. The arm then moves the vehicle to a port and **berths** it — places it against the port, where motorized bolts pull it tight.

The capture is no longer dynamic. The arm takes out nearly all the leftover relative motion before the two structures touch. That is gentler on both vehicles, and the chaser's final approach can be less precise: it only has to arrive slowly, close and steady enough for the arm to catch it.

The cost is **dependency**. Berthing needs the arm, and usually a crew member to fly it for the capture, to be available and ready. That ties the arrival to the station's schedule in a way a self-contained docking does not.

::: key Docking vs berthing
Docking: the visiting vehicle flies itself into the mechanism under its own GNC and the capture is dynamic. Berthing: the vehicle holds a station a few metres away, is grappled by a robotic arm and is then bolted on. Berthing is gentler on the structure; docking is autonomous and faster.

Docking demands tight final-approach precision, which the capture mechanism's compliance must still absorb. Berthing is more forgiving of final-approach precision but depends on the arm and the crew being available.
:::

## Choosing between them

Neither one is better in every case. The choice depends on two things.

First, the vehicle itself. Does it carry a compatible docking mechanism, and GNC accurate enough to fly into it? If not, docking is off the table.

Second, the mission's tolerance for waiting. A crewed vehicle needs a fast return path that does not depend on anyone else. It is the crew's **[[lifeboat|lifeboat]]**, so it docks. Cargo vehicles without a dynamic capture mechanism are berthed. Berthing ports also happen to have **[[much larger hatches|hatch-sizes]]**, which suits bulky cargo.

## The profile, end to end

Here is how each lesson in this module maps onto a piece of a real approach.

1. **Far-field targeting** (kilometer scale). Two-impulse CW targeting computes the coarse transfer from a waiting orbit down toward the approach corridor. It accepts the small leftover error that the validity-limits lesson measured.
2. **Approach start.** The vehicle settles onto its chosen line — V-bar or R-bar — with the passive-safety properties worked out for that line. Many berthed cargo vehicles come up from below on the R-bar to their capture point. Docking vehicles often fly in along the V-bar to a port on the front of the station, though other ports need other approach lines.
3. **Glideslope closing through hold points.** A closing-rate law, flown as a string of small correction burns, carries the vehicle between gates. This module's worked example, with $b = 0.001\,\mathrm{s^{-1}}$, closes $250\,\mathrm{m}$ to $30\,\mathrm{m}$ in $35.3$ minutes and $30\,\mathrm{m}$ to $10\,\mathrm{m}$ in another $18.3$ minutes.
4. **Corridor and keep-out rules, all the time.** At every point inside the keep-out sphere, the vehicle's lateral position must sit inside the shrinking corridor cone. Every point must also be passively safe, or covered by a CAM checked in advance.
5. **Final approach to capture.** Closing rate, sideways alignment and angular alignment all tighten to whatever the capture method — docking mechanism or robotic arm — requires.

Real profiles are built from exactly these parts, with **[[hold points at set ranges|real-hold-points]]** where the vehicle stops and waits for a "go".

::: example A representative proximity-operations timeline
Use only numbers this module has already derived.

**Step 1: active closing.** $250\,\mathrm{m}$ to $30\,\mathrm{m}$ takes $35.3$ minutes and $30\,\mathrm{m}$ to $10\,\mathrm{m}$ takes $18.3$ minutes. Together:

$$
35.3 + 18.3 = 53.6\ \text{minutes}.
$$

**Step 2: add the holds.** Put a hold of $10$ to $15$ minutes at the $250\,\mathrm{m}$ gate and again at the $30\,\mathrm{m}$ gate, for a go/no-go check. Two holds add $2 \times 10 = 20$ to $2 \times 15 = 30$ minutes. The total becomes

$$
53.6 + 20 = 73.6 \quad\text{to}\quad 53.6 + 30 = 83.6\ \text{minutes},
$$

about $74$ to $84$ minutes — and that is only to reach the $10\,\mathrm{m}$ point. The last and most closely watched segment, into contact, has not started yet.

**Step 3: compare with the orbit.** One orbit of the target takes $2\pi / n = 2\pi / 0.0011282 \approx 5569\,\mathrm{s} = 92.8$ minutes. So the final $250\,\mathrm{m}$ alone takes most of an orbit.

A hold is a deliberate pause, not something the dynamics require. The vehicle is not drifting freely during it — it is actively **[[station-keeping|station-keeping]]**. This is why proximity operations are planned in hours, not minutes. The pace is set by checking, not by propellant or geometry.
:::

## What a visiting vehicle has to demonstrate

Every visiting-vehicle program, at the ISS or anywhere else, makes a chaser *show* — not merely claim — a set of properties before it may move on to each stage of the approach:

- **Passively safe at every point.** Checked by propagating forward with all further burns removed, and confirming the keep-out boundary is not crossed within the required time. This is exactly the test from two lessons back.
- **Inside the corridor.** Lateral position within $r\tan\theta_c$ at every range — with navigation accurate enough to *know* that, not merely hope it.
- **A checked CAM for every phase.** Ready to fire on a fault, computed and verified in advance, never improvised.
- **Bounded closing rate and attitude at contact.** Each program and mechanism sets its own exact numbers. Typical envelopes for a compliant docking mechanism are a few centimeters per second of closing rate and a fraction of a degree per second of turning rate at the moment of capture. The glideslope's floor rate $a$ — a controlled few centimeters per second, not a crawl to zero — is chosen with this in mind.
- **Independent confirmation.** Usually more than one relative-navigation sensor, so that one sensor failing does not take away the vehicle's ability to confirm its own state. That is the subject of the next lesson.

::: example Checking one approach state against the requirements
A chaser leaves the $10\,\mathrm{m}$ hold point on its final segment. It reports a lateral offset of $1.2\,\mathrm{m}$. Its glideslope law is $\dot r = -(a + br)$ with $a = 0.005\,\mathrm{m/s}$ and $b = 0.001\,\mathrm{s^{-1}}$.

**Corridor check.** From the corridor lesson, the tolerance at $10\,\mathrm{m}$ with $\theta_c = 10°$ is

$$
d_{\text{lat}} = 10 \times \tan 10° = 10 \times 0.1763 \approx 1.76\,\mathrm{m}.
$$

The offset is $1.2\,\mathrm{m}$, so the chaser is **[[inside the cone|cone-slice]]** with $1.76 - 1.2 = 0.56\,\mathrm{m}$ to spare.

**Rate check.** The commanded closing rate at $r = 10\,\mathrm{m}$ is

$$
a + br = 0.005 + 0.001 \times 10 = 0.005 + 0.010 = 0.015\,\mathrm{m/s}.
$$

That is $1.5\,\mathrm{cm/s}$, comfortably inside a contact envelope of a few centimeters per second.

**What these do not settle.** Neither check alone clears the vehicle to go on. Both of them, plus a checked CAM at this exact point and confirmation from at least one relative-navigation sensor, are what "ready to continue" actually means.
:::

::: warning Requirements do not average
A vehicle well inside its corridor but only barely under its contact-rate limit is not "safely in the middle". It is one requirement away from a violation. The requirements are checked as **[[separate pass/fail gates|independent-gates]]**, not blended into one score. Meeting four of five comfortably does not make up for the fifth sitting at its edge. Each one is judged on its own before the next stage.
:::

## Check yourself

::: check
A cargo vehicle has no compatible dynamic-capture mechanism, but the ISS robotic arm is free on the planned day. Which capture method does it use, and why?
:::

::: answer
Berthing. Without a mechanism to fly into, docking is not an option, no matter how good its GNC is. Instead the vehicle holds a stand-off position, and the arm grapples it and attaches it to a port. The vehicle does not need to carry any capture mechanism of its own — only a fitting for the arm to grab.
:::

::: check
Both methods end with the vehicle firmly attached. So why does berthing tolerate a less precise final approach than docking?
:::

::: answer
In docking, whatever relative velocity and misalignment the chaser still has at contact must be soaked up entirely by the capture mechanism's compliance. So how precisely the chaser arrives directly sets how much the mechanism has to handle.

In berthing, the arm removes nearly all the leftover relative motion after grappling and before the structures touch. The final approach only has to bring the chaser close enough, and slowly and steadily enough, for the arm to grab it safely. That is a much looser requirement than a dynamic capture.
:::

::: check
Using only this module's worked glideslope numbers, roughly how long does active closing from 250 m to 10 m take? Why is the whole proximity-operations timeline typically much longer than that?
:::

::: answer
Active closing is $250\,\mathrm{m} \to 30\,\mathrm{m}$ plus $30\,\mathrm{m} \to 10\,\mathrm{m}$, which is $35.3 + 18.3 = 53.6$ minutes.

The whole timeline is longer for two reasons. First, deliberate holds for go/no-go checks are added at gates — station-keeping pauses for verification, not something the orbital mechanics requires. Second, the final approach to contact, the most closely watched part, is not included in the $53.6$ minutes at all.
:::

::: check
A vehicle is comfortably inside its corridor at some range, but its CAM at that exact point has not been checked for its current mass. (Its mass changes as it uses propellant, which changes how much a given thruster firing moves it.) Should it proceed?
:::

::: answer
No. Being inside the corridor is only one of several separate requirements. A checked CAM for the current configuration at that point is its own, mandatory condition. As the warning in this lesson says, plenty of margin on one requirement does not make up for a gap in another. Proceeding without a checked CAM would leave the vehicle with no verified safe response if a fault happened right there.
:::

::: check
Why does a visiting vehicle need more than one independent relative-navigation sensor, rather than one very accurate one?
:::

::: answer
One sensor, however accurate when it works, is a **single point of failure**. If it fails or starts giving bad data partway in, a vehicle relying on it alone loses the ability to confirm its own state at exactly the moment that matters most.

With independent sensors, the vehicle can notice when they disagree — one sensor's report does not match another's — instead of blindly trusting a single source that might be faulty.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Docking | Chaser flies itself into a capture mechanism; dynamic, autonomous, fast, needs precision |
| Berthing | Chaser holds a stand-off point; a robotic arm grapples it and it is bolted on; gentler, depends on arm and crew schedule |
| Who does which | Crewed vehicles dock (they are also lifeboats); cargo vehicles without a docking mechanism are berthed |
| Five-stage profile | Far-field targeting, approach start on a bar, glideslope closing through holds, corridor and keep-out rules throughout, final approach to capture |
| Worked timeline (250 m to 10 m) | 53.6 minutes of active closing; about 74–84 minutes with gate holds; one orbit is 92.8 minutes |
| Contact requirements | Passively safe, inside the corridor, checked CAM, bounded closing rate and attitude, independent sensor confirmation |
| Requirements are separate gates | Plenty of margin on one never makes up for a gap in another |

The one piece this module has not yet supplied is how a vehicle actually measures its range, rate and direction well enough to fly any of this. The final lesson covers those relative-navigation sensors.

::: context soft-capture Soft capture, then hard capture
Modern docking mechanisms work in two steps. First, **soft capture**: a ring on the arriving vehicle, mounted on springs and dampers (or motor-driven legs that act like them), meets the ring on the port and latches on. The ring can tilt and slide a little, so it soaks up the leftover bump and misalignment instead of passing it into the structure. Then, once the motion has died down, the ring pulls in and **hard capture** hooks clamp the two vehicles together into an airtight seal. The international standard for this kind of mechanism is called the International Docking System Standard.
:::

::: context canadarm2 The station's arm
Canadarm2 is the ISS robotic arm, built for the Canadian Space Agency and launched in 2001. It is about $17.6\,\mathrm{m}$ long with seven joints, a bit like a human arm with an extra elbow. Both ends are identical "hands", so it can let go with one end, grab a new fitting with the other, and move itself along the station end over end, like an inchworm. To catch a visiting vehicle, an astronaut inside the station flies the arm to a grapple fixture on the vehicle and closes the hand around it.
:::

::: context lifeboat A crew vehicle is also a lifeboat
While a crew is on board the ISS, the vehicle that brought them stays attached and acts as their way home in an emergency — a fire, a toxic leak, or a hole in the hull. In that case the crew needs to climb in, close the hatch and leave in minutes. A docked vehicle can undock on its own. A berthed vehicle would need the arm, and someone to fly it, even to be unbolted and moved away. That is a big reason crewed vehicles such as Soyuz and Crew Dragon dock.
:::

::: context hatch-sizes Square hatch, round hatch
Berthing ports on the ISS use the Common Berthing Mechanism, whose hatch is a square about $1.27\,\mathrm{m}$ on a side. Docking ports have a round passage about $0.8\,\mathrm{m}$ across. Drawn to the same scale:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="127" height="127" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="103.5" y="168" font-size="12" fill="#1f2a44" text-anchor="middle">berthing: 1.27 m square</text>
  <circle cx="265" cy="83.5" r="40" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="265" y="168" font-size="12" fill="#1f2a44" text-anchor="middle">docking: 0.8 m round</text>
  <line x1="40" y1="12" x2="167" y2="12" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="225" y1="36" x2="305" y2="36" stroke="#6c7a93" stroke-width="1.2"/>
</svg>
```

The square opening is about three times the area of the round one, so large racks and bulky cargo fit through it. That is a real advantage for cargo vehicles that are berthed.
:::

::: context real-hold-points Hold points on real approaches
Real vehicles fly profiles built from the same parts as this lesson. A berthed cargo ship such as Japan's HTV came up from below the ISS along the R-bar, stopping at hold points, and finally held about $10\,\mathrm{m}$ below the station while the crew caught it with the arm. SpaceX's Crew Dragon, which docks, stops at named waypoints — about $220\,\mathrm{m}$ from the station and about $20\,\mathrm{m}$ from its port — and waits there for a "go" before moving on. The exact distances differ from vehicle to vehicle; the idea of a hold point with a go/no-go check does not.
:::

::: context station-keeping Holding a point is not free
**Station-keeping** means holding a position relative to the target with small thruster firings. On the V-bar it is cheap: a point there is on the same orbit as the target, so only small corrections are needed. Anywhere else it takes steady work. On the R-bar, for example, the $3n^2x$ gravity-gradient term pushes the chaser away all the time, so the thrusters must keep pushing back. Either way, a vehicle holding station is using working thrusters and a working controller — which is why a hold is never the same thing as being safe.
:::

::: context cone-slice The corridor seen head-on
Look straight down the docking axis from the chaser at $10\,\mathrm{m}$ range. The corridor becomes a circle of radius $1.76\,\mathrm{m}$ around the axis, and the chaser is a dot $1.2\,\mathrm{m}$ from its center.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="90" r="70.4" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="150" cy="90" r="3" fill="#1f2a44"/>
  <line x1="150" y1="90" x2="198" y2="90" stroke="#b4232c" stroke-width="2"/>
  <circle cx="198" cy="90" r="5" fill="#b4232c"/>
  <line x1="198" y1="90" x2="220.4" y2="90" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="3 3"/>
  <text x="174" y="82" font-size="12" fill="#b4232c" text-anchor="middle">1.2 m</text>
  <text x="228" y="80" font-size="12" fill="#1f2a44">0.56 m spare</text>
  <text x="150" y="176" font-size="12" fill="#1d6fd1" text-anchor="middle">corridor edge, radius 1.76 m</text>
  <text x="150" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">axis</text>
</svg>
```

Inside, but not by a lot: about a third of the allowed radius is left.
:::

::: context independent-gates Why the checks are not added up
It is tempting to give each requirement a score and add them up. That fails for safety, because the requirements protect against different dangers. A great corridor position does nothing for you if the capture mechanism is hit too hard, and a perfect contact rate does nothing if there is no escape plan when a thruster fails. So each is a **gate**: pass it or stop. The same idea shows up across engineering whenever failures are independent — a chain is only as strong as its weakest link.
:::
