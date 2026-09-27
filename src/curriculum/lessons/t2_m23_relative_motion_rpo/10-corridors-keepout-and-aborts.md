---
id: l10-corridors-keepout-and-aborts
title: Approach corridors, keep-out spheres and abort trajectories
minutes: 21
covers:
  - approach corridors and keep-out spheres
  - abort trajectories and collision avoidance manoeuvres
---

Think of a public swimming pool with a diving board. There is a roped-off area under the board that nobody may swim into unless the lifeguard waves them in. And when a diver does go, there is one path — straight down from the end of the board — that they have to stay on. The pool also has a plan for trouble: if someone gets into difficulty, the lifeguard already knows exactly what to do. Nobody works it out on the spot.

A spacecraft closing in on the International Space Station lives by the same three rules. There is a zone around the station it may not enter without permission. Inside that zone there is a narrow channel it must stay in. And for every moment of the approach, there is a ready-made escape plan in case something breaks.

The last lesson checked passive safety at single points: "if the engines stop right here, does the chaser still miss?" This lesson turns that into the rules a real approach flies by. First the geometry — the **keep-out sphere**, the **approach corridor**, and the stretched shape of the real protected zone. Then the active response — the **abort** and the **collision avoidance maneuver** — for the moment a burn really fails partway in.

## The keep-out sphere

A **keep-out sphere** is a ball-shaped no-go zone of fixed radius, centered on the target. For the ISS the radius is $200\,\mathrm{m}$. It is the roped-off area of the pool.

A visiting vehicle may cross into it only when three things are true:

- its navigation is working and has been checked, so it really knows where it is;
- every point of the planned path inside the sphere is passively safe — the whole subject of the previous lesson;
- the people in charge — the ground teams, and sometimes the crew — have given explicit **[[authorization|go-no-go]]** to proceed.

Everything else in proximity operations exists to make that crossing something you can defend with evidence, not something you merely intend.

## Why the real protected zone is not a sphere

A sphere is the simplest shape to write down: one number, the radius. But free relative motion does not spread out equally in every direction. You saw this in the drift and football-orbit lessons. Let's put numbers on it.

Suppose the chaser's velocity is off by a small amount $\delta v$ (read "delta v", a small velocity error). Nobody knows which way the error points, so the honest description is **[[isotropic|isotropic-word]]** — equally likely in every direction. Take the two in-plane directions one at a time, using the CW solution with $n$ (the target's mean motion, its orbital rate in radians per second).

**A radial error**, $\dot x_0 = \delta v$ and nothing else. The CW solution gives

$$
x(t) = \frac{\delta v}{n}\sin nt, \qquad y(t) = -\frac{2\,\delta v}{n}\left(1 - \cos nt\right).
$$

The radial position swings by $\delta v/n$ each way. The in-track position swings twice as far, $2\,\delta v/n$ each way. The path is a closed **[[2:1 ellipse|football-picture]]**, the football orbit, and it never drifts off.

**An in-track error**, $\dot y_0 = \delta v$ and nothing else:

$$
x(t) = \frac{2\,\delta v}{n}\left(1 - \cos nt\right), \qquad y(t) = \frac{\delta v}{n}\left(4\sin nt - 3nt\right).
$$

Now the radial swing is $2\,\delta v/n$ each way. And the in-track position has the term $-3\,\delta v\, t$, which grows forever. That is the secular drift: an in-track velocity error is really an orbit-size (period) error, and it never stops adding up.

So one error budget, the same size in every direction, spreads out in position like a stretched shape. It is modest radially, about twice as long in-track, and in the in-track case it keeps growing.

::: example One centimeter per second of velocity error
Take $\delta v = 0.01\,\mathrm{m/s}$ at the ISS altitude, where $n = 1.1282 \times 10^{-3}\,\mathrm{rad/s}$ (one orbit every $92.8$ minutes).

**Radial error.** The radial swing is $\delta v / n = 0.01 / 0.0011282 \approx 8.86\,\mathrm{m}$ each way. The in-track swing is twice that, $2 \times 8.86 = 17.7\,\mathrm{m}$ each way, so the ellipse is about $35.5\,\mathrm{m}$ long from end to end. It closes on itself every orbit.

**In-track error.** The radial swing is again $17.7\,\mathrm{m}$. But the drift term is $3\,\delta v = 0.03\,\mathrm{m/s}$, every second, forever. Over one orbit of $5569\,\mathrm{s}$:

$$
3\,\delta v \times T = 0.03 \times 5569 \approx 167\,\mathrm{m}.
$$

Sanity check: this is the same as $3\,\delta v \cdot 2\pi / n = 6\pi\,\delta v / n = 6\pi \times 8.86 \approx 167\,\mathrm{m}$. A velocity error you could not feel with your hand walks the chaser most of the way across the ISS keep-out sphere in one lap.
:::

This is the real reason the ISS uses a stretched protected zone further out. Around the station's keep-out sphere sits the **[[approach ellipsoid|iss-zones]]**, a $4 \times 2 \times 2\,\mathrm{km}$ volume whose long axis points along the in-track direction. Its 2:1 shape is the football-orbit ratio above, read as a design rule. A sphere big enough to cover the in-track risk would be needlessly huge radially. A sphere sized for the radial risk would be too short in-track.

## The approach corridor

Once a chaser is inside the keep-out sphere, it gets a second rule. It must stay inside an **approach corridor** — a cone whose point is at the docking port and whose center line is the **docking axis**, the straight line the chaser must arrive along.

A cone is like the beam of a flashlight pointed back out from the port. Far away the beam is wide. Close in it is narrow. The cone is described by one angle, its **half-angle** $\theta_c$ (read "theta sub c"), measured from the center line to the edge.

At range $r$ along the axis, the biggest sideways (off-axis) offset the chaser may have is

$$
d_{\text{lat}}(r) = r \tan\theta_c.
$$

Here $d_{\text{lat}}$ ("d lat") is the **lateral tolerance** — how far off the center line is still allowed. The formula is plain **[[right-triangle trigonometry|cone-triangle]]**: range is the side along the axis, the offset is the side across, and the half-angle sits at the port.

::: example Corridor tolerance at a 10 degree half-angle
Take $\theta_c = 10°$, the value this module's exercises use. First, $\tan 10° \approx 0.1763$. Then multiply by each range:

| Range | Lateral tolerance |
| --- | --- |
| 1000 m | 176.3 m |
| 250 m | 44.1 m |
| 200 m | 35.3 m |
| 30 m | 5.29 m |
| 10 m | 1.76 m |

For example, at $30\,\mathrm{m}$: $30 \times 0.1763 = 5.29\,\mathrm{m}$.

The tolerance shrinks in step with range. That is what makes the corridor a cone and not a tube. An offset of $176\,\mathrm{m}$ is fine at $1000\,\mathrm{m}$. At $30\,\mathrm{m}$ it would be $176.3 / 5.29 \approx 33$ times the allowed offset. So the navigation and steering have to get tighter as the chaser closes, and the cone forces exactly that.
:::

The cone is not the only limit inside the sphere. The closing rate must stay under a ceiling that shrinks with range, and the chaser's **attitude** — which way it is pointing — and its turning rate must stay within set bounds. A chaser that is inside the cone but tumbling or rushing in is still out of limits.

::: key Approach corridor and keep-out sphere
The keep-out sphere (200 m for the ISS) may only be entered with explicit authorization and a demonstrated safe trajectory. Inside it the vehicle must stay within an approach corridor — a cone about the docking axis — with bounded rate and attitude. At range $r$ the corridor allows a lateral offset of at most $d_{\text{lat}}(r) = r\tan\theta_c$.

Real protected volumes are stretched in-track, because the same velocity-error budget gives about twice the bounded position spread in-track as radially — and an in-track velocity error adds secular drift that no fixed-radius sphere can contain.
:::

## Aborts and collision avoidance maneuvers

Passive safety answers the question "what happens if we do nothing more?" Sometimes the answer is not good enough, and you need to act.

An **abort** is any planned way of breaking off the approach and getting to a safe place. The sharpest kind is a **collision avoidance maneuver**, or **CAM** — a specific burn, worked out in advance for each phase of the approach, that fires the moment a serious fault is detected. (The course's topic list uses the British spelling, *manoeuvre*.) Its job is to put the chaser on a free-drift path that clears the keep-out zone and keeps clearing it for the required time, often 24 hours, with no further burns.

The previous lesson hinted at the key finding. When the danger is an in-track closing rate with little radial offset, the most useful CAM is often not "push away" but "stop closing": a **retrograde** burn, one that points against the closing velocity and cancels it.

::: example A CAM at the 30 m gate
A chaser sits on the V-bar $30\,\mathrm{m}$ behind the target, closing at $0.03\,\mathrm{m/s}$. That is exactly the rate the glideslope lesson's law $\dot r = -br$ with $b = 0.001\,\mathrm{s^{-1}}$ commands at $30\,\mathrm{m}$: $0.001 \times 30 = 0.03$. Its next burn fails.

**No CAM.** Propagate the free drift with the CW solution for 24 hours. The chaser closes to a minimum range of $19.9\,\mathrm{m}$ about $480\,\mathrm{s}$ (8 minutes) later, then drifts away for good. It went $30 - 19.9 = 10.1\,\mathrm{m}$ inside its starting range.

Compare with the previous lesson's $200\,\mathrm{m}$ case, which went $37.8\,\mathrm{m}$ in. As a fraction of the starting range, $10.1/30 \approx 34\%$ here against $37.8/200 \approx 19\%$ there. The 30 m case is worse, because its closing rate is larger compared with its distance: $0.03/30 = 0.001$ per second, against $0.1/200 = 0.0005$ per second.

**CAMs of different sizes.** Now fire a retrograde burn that cancels part of the closing rate, and propagate again:

| Share of closing rate cancelled | Minimum range |
| --- | --- |
| 0% (no CAM) | 19.9 m |
| 25% | 22.0 m |
| 50% | 24.3 m |
| 75% | 27.0 m |
| 100% | 30.0 m |

Each extra slice of rate removed buys back more distance. So even a CAM that cannot fully cancel the rate — a thruster at its limit, or a partial failure — still helps, roughly in proportion to how much rate it removes.
:::

Look closely at the last row, though. Cancelling 100% of the closing rate leaves the chaser at rest, $30\,\mathrm{m}$ behind the target on the V-bar. In the ideal CW model that spot is an **[[equilibrium|vbar-equilibrium]]**: it has the same orbit as the target, only a little behind, so it stays put. That is "no penetration", but it is not "moving away". The chaser is parked right where the failure happened.

The rows above it tell a different story. With a little closing rate left over, the chaser first creeps in, then the leftover in-track velocity (a slightly bigger orbit) makes it drift backward, away from the target, for good. After 24 hours the 75% case is about $2\,\mathrm{km}$ away. That is what a real CAM wants: a path that **leaves** and keeps leaving on its own.

This is why "stop and hold still" is not an abort. Holding a point needs working thrusters and a working controller, and the fault may have taken one of them away. Any small leftover rate, navigation error or difference in air drag starts a drift, and at $30\,\mathrm{m}$ there is not much room to drift in. A safe abort ends on a path where doing nothing is safe.

Three more rules turn this into real abort design:

1. **The direction depends on the state.** Retrograde was right here because the danger was an in-track closing rate with no radial offset. A chaser already carrying a big radial offset needs a different direction. There is no single best CAM for every state.
2. **It must work after the failure.** A CAM is designed assuming the fault has already happened. If a thruster has died, the CAM has to be flown with the thrusters that are left. Designers list every **[[credible failure|credible-failures]]**, and check the CAM against each one.
3. **It must exist before the fault.** The CAM for each phase is computed, checked against the same kind of free-drift test as passive safety, and stored — ready to fire automatically or on one command.

::: warning A CAM designed in real time is a CAM designed too late
In the 30 m example, the closest approach came about 8 minutes after the failure — and the chaser was already moving in from the first second. There is no time to set up and solve a targeting problem, check the answer and have people review it before sending it. Every CAM in a real approach is worked out ahead of time, for every hold point and every credible failure. Each one is checked the way passive safety is: propagate forward with the CAM applied and confirm that the free-drift path clears the keep-out boundary, with margin, for the whole required time.
:::

This is not paperwork. **[[Close-quarters collisions|mir-collision]]** have happened, and the lesson engineers took from them is written into every one of these rules.

## Check yourself

::: check
At a range of 50 m, with a corridor half-angle of $10°$, what is the largest lateral offset allowed?
:::

::: answer
Use $d_{\text{lat}} = r\tan\theta_c$. Here $r = 50\,\mathrm{m}$ and $\tan 10° \approx 0.1763$, so

$$
d_{\text{lat}} = 50 \times 0.1763 \approx 8.82\,\mathrm{m}.
$$

Sanity check: it sits between the $44.1\,\mathrm{m}$ allowed at $250\,\mathrm{m}$ and the $5.29\,\mathrm{m}$ allowed at $30\,\mathrm{m}$, as it should.
:::

::: check
Explain why a sphere is not the right shape for a protected volume. Use the sizes of the radial and in-track swings that come from one velocity-error budget.
:::

::: answer
A velocity error of a given size produces about twice as much bounded in-track swing as radial swing — for a radial error, $2\,\delta v/n$ in-track against $\delta v/n$ radially, the football orbit's fixed 2:1 ratio. If the error has any in-track part, it also produces secular in-track drift, $-3\,\delta v\,t$, which has no radial partner at all.

A sphere gives the same radius in every direction. So it is bigger than needed radially and possibly too small in-track. An ellipsoid stretched in-track, like the ISS approach ellipsoid, matches the real shape of the risk far better.
:::

::: check
Why does the corridor's lateral tolerance shrink in proportion to range, instead of staying at one fixed value all the way to contact?
:::

::: answer
Docking (or berthing) needs very tight alignment at the end, so the tolerance must be small by the time the range is small. A cone does that automatically: its tolerance is $r\tan\theta_c$, proportional to range. Far out it leaves generous room, and close in it squeezes down.

A fixed tolerance could not do both. Either it would be tight enough for the end and needlessly strict far out, or loose enough for far out and far too loose near the port. And a cone needs only one number, the half-angle, to describe the whole taper.
:::

::: check
A fault calls for a CAM. Two burns of equal size are on the table: one straight out radially, one retrograde (cancelling the closing rate). The chaser has a large closing rate and almost no radial offset. Which is usually better, and why?
:::

::: answer
The retrograde burn is usually better here. It removes the closing rate that was carrying the chaser toward the target in the first place. What is left is a state with little or no closing speed, which does not keep coming in.

A radial burn of the same size does not touch the closing rate. The chaser keeps moving in-track toward the target for a while before the new radial motion carries it off to the side. In the previous lesson's $200\,\mathrm{m}$ case, a $0.10\,\mathrm{m/s}$ radial burn only raised the minimum range to $186\,\mathrm{m}$, while the same-size retrograde burn kept it at the full $200\,\mathrm{m}$.
:::

::: check
Why must a CAM be computed in advance for every phase of an approach, instead of being worked out when a fault happens?
:::

::: answer
Close in, the time between detecting a fault and needing to be on a safe path is short — minutes at most, and the chaser is closing the whole time. That is far too short to solve a targeting problem, check it and command it.

Computing and checking a CAM ahead of time, for every credible failure at every phase, moves all that work out of the time-critical window. What is left to happen live is only "detect the fault, fire the stored response".
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Keep-out sphere | Fixed-radius no-go zone (200 m for the ISS); entering needs authorization and a demonstrated safe trajectory |
| Approach ellipsoid | Outer protected zone stretched in-track (4 × 2 × 2 km at the ISS), matching the 2:1 spread of velocity errors |
| Radial error $\delta v$ | Closed ellipse: $\delta v/n$ radially, $2\,\delta v/n$ in-track |
| In-track error $\delta v$ | $2\,\delta v/n$ radially plus secular drift $-3\,\delta v\,t$ |
| $d_{\text{lat}}(r) = r\tan\theta_c$ | Largest lateral offset allowed in a corridor of half-angle $\theta_c$ at range $r$ |
| Inside the sphere | Stay in the corridor, with bounded closing rate and attitude |
| Collision avoidance maneuver (CAM) | A burn computed and checked in advance, fired the moment a fault is detected |
| 30 m gate example | No CAM: 19.9 m minimum range; fully rate-cancelling CAM: 30.0 m, but parked, not departing |
| A good CAM | Ends on a free-drift path that leaves by itself, flown with the thrusters that survive the failure |

With the geometry and the escape plans in place, the next lesson follows a real vehicle all the way in: the choice between docking and berthing, and the ISS visiting-vehicle profile that ties every hold point, gate and CAM together.

::: context go-no-go Who says "go"
Before each big step of an approach, the flight controllers run a **go/no-go poll**: each person responsible for one system — navigation, propulsion, power, communications — checks their data and answers "go" or "no go". Only if everyone says "go" does the vehicle proceed. For a vehicle visiting the ISS, the station's flight control team in Houston and the vehicle's own control team both take part. The poll is not a formality. It is the moment when a human looks at the evidence that the next segment is safe before the vehicle commits to it.
:::

::: context isotropic-word What "isotropic" means
**Isotropic** comes from Greek words for "equal" and "turning": the same in every direction you turn. An isotropic velocity error is one that could point anywhere with the same size — like the uncertainty in where a dart lands when you throw at the center of a board. The lesson's point is that an isotropic *velocity* error does not become an isotropic *position* error in orbit. The orbital dynamics stretch it.
:::

::: context football-picture The football left by a radial kick
A radial velocity error of $\delta v$ adds a closed loop on top of where the chaser was supposed to be. It rises and falls by $\delta v/n$, and slides back and forth by twice that. It goes around once per orbit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="110" rx="80" ry="40" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="172,70 181,65.5 181,74.5" fill="#1d6fd1"/>
  <circle cx="260" cy="110" r="5" fill="#b4232c"/>
  <text x="268" y="114" font-size="12" fill="#1f2a44">planned point</text>
  <line x1="100" y1="165" x2="260" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="159" x2="100" y2="171" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="260" y1="159" x2="260" y2="171" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="183" font-size="12" fill="#1f2a44" text-anchor="middle">in-track span 4 δv/n</text>
  <line x1="75" y1="70" x2="75" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="69" y1="70" x2="81" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="69" y1="150" x2="81" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="66" y="106" font-size="12" fill="#1f2a44" text-anchor="end">radial</text>
  <text x="66" y="121" font-size="12" fill="#1f2a44" text-anchor="end">2 δv/n</text>
  <line x1="300" y1="40" x2="340" y2="40" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="340,40 332,36 332,44" fill="#6c7a93"/>
  <text x="320" y="30" font-size="11" fill="#6c7a93" text-anchor="middle">in-track</text>
  <line x1="300" y1="40" x2="300" y2="10" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="300,10 296,18 304,18" fill="#6c7a93"/>
  <text x="292" y="20" font-size="11" fill="#6c7a93" text-anchor="end">up</text>
</svg>
```

An outward kick sends the chaser up first, then backward, then down and forward again to where it started — the ellipse is twice as long as it is tall.
:::

::: context iss-zones The ISS's two protective zones, to scale
The ISS uses two nested zones. The outer **approach ellipsoid** is $4\,\mathrm{km}$ long along the velocity direction (the V-bar) and $2\,\mathrm{km}$ across in the other two directions. The inner **keep-out sphere** has a radius of $200\,\mathrm{m}$. Drawn to the same scale, the sphere is tiny:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="12" y1="100" x2="348" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="180" y1="12" x2="180" y2="188" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <ellipse cx="180" cy="100" rx="150" ry="75" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="180" cy="100" r="15" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="200" font-size="12" fill="#1f2a44" text-anchor="middle">approach ellipsoid: 4 km along V-bar, 2 km across</text>
  <text x="200" y="124" font-size="12" fill="#b4232c">keep-out sphere, r = 200 m</text>
  <text x="346" y="94" font-size="11" fill="#6c7a93" text-anchor="end">V-bar</text>
  <text x="186" y="20" font-size="11" fill="#6c7a93">R-bar</text>
</svg>
```

Entering the ellipsoid is itself a controlled step. The vehicle must be on a safe trajectory before it does, and again, with a stricter check, before it enters the sphere.
:::

::: context cone-triangle Where r tan θ comes from
Slice the cone down its middle and you get a triangle. The port is at the tip. The range $r$ runs along the center line, the allowed offset runs straight across, and the half-angle sits at the tip. "Tangent equals opposite over adjacent" gives $\tan\theta_c = d_{\text{lat}} / r$, so $d_{\text{lat}} = r\tan\theta_c$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="330,100 30,47.1 30,152.9" fill="#8fb8f0" fill-opacity="0.3" stroke="none"/>
  <line x1="330" y1="100" x2="30" y2="47.1" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="330" y1="100" x2="30" y2="152.9" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="330" y1="100" x2="20" y2="100" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="130" y1="100" x2="130" y2="64.7" stroke="#b4232c" stroke-width="2.5"/>
  <text x="124" y="86" font-size="12" fill="#b4232c" text-anchor="end">d lat</text>
  <path d="M270,100 A60,60 0 0,1 270.91,89.58" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="254" y="93" font-size="12" fill="#1f2a44" text-anchor="end">θc = 10°</text>
  <line x1="130" y1="118" x2="330" y2="118" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="130" y1="112" x2="130" y2="124" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="330" y1="112" x2="330" y2="124" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="230" y="134" font-size="12" fill="#1f2a44" text-anchor="middle">range r</text>
  <rect x="330" y="85" width="12" height="30" fill="#1f2a44"/>
  <text x="340" y="75" font-size="11" fill="#1f2a44" text-anchor="end">port</text>
  <text x="30" y="180" font-size="12" fill="#1f2a44">docking axis (dashed)</text>
</svg>
```

The angle is drawn at its true $10°$ — narrower than most people guess.
:::

::: context vbar-equilibrium Why sitting still on the V-bar is allowed
Put the chaser at $x = 0$, some in-track distance $y_0$, with no velocity. The CW accelerations are $\ddot x = 3n^2x + 2n\dot y = 0$, $\ddot y = -2n\dot x = 0$ and $\ddot z = -n^2 z = 0$. Nothing pushes it anywhere. Physically, it is on the very same circular orbit as the target, a few meters behind — like two cars on a circular track at the same speed. That is why hold points on the V-bar are cheap. It is also why a hold there is fragile: any small velocity or drag difference starts the drift you met in the secular-drift lesson.
:::

::: context credible-failures What counts as a credible failure
Designers do not try to survive every imaginable disaster. They make a list of **credible failures** — things that could really happen, like a thruster stuck off, a thruster stuck on, a sensor giving bad data, or a computer restarting — and require the vehicle to stay safe after each one. A common rule is that no single failure may cause a collision. For hazards that could kill a crew, NASA's human-spaceflight rules often ask for more: the vehicle must stay safe even after two failures. Every CAM is checked against this list.
:::

::: context mir-collision The day a supply ship hit a space station
On 25 June 1997, the uncrewed Russian cargo ship Progress M-34 was being flown by remote control from inside the Mir space station during a test of manual docking. The crew could not judge its range and closing speed well enough, it came in too fast, and it struck Mir's Spektr module. The hull was punctured, Spektr lost its air, and the crew had to seal the module off to save the station. Much of what this lesson teaches — protected zones, strict rate limits, and escape plans worked out in advance — exists so that a misjudged approach ends in a safe miss instead.
:::
