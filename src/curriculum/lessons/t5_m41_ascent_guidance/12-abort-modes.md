---
id: l12-abort-modes
title: Abort modes and the decision logic behind them
minutes: 21
covers:
  - "Abort modes: RTLS, TAL, AOA and the decision logic"
---

Picture a long day hike over a mountain pass. Your car is at the trailhead. A village sits on the far side of the pass. A loop trail circles back to the parking lot the long way. Halfway up, your ankle starts to hurt. What should you do?

It depends on *where you are* when it happens. An hour in, you turn around and walk back to the car. Near the top of the pass, going back is longer than going on, so you head down to the village on the far side. Past the pass, the loop trail may be the quickest way round to the car. And if you are nearly at the hut you were aiming for, you might stop at a lower hut on the way and call that the day's goal. Same ankle, four different answers — and the answer is set by how far you have come.

A rocket that loses an engine faces exactly this choice. Lesson 8 showed guidance falling back gracefully to a lower orbit that is still in reach. Sometimes no orbit is in reach at all. Then the question stops being "which orbit?" and becomes "how does the vehicle come down safely, and where?" A planned way to end a flight early and safely is an **abort mode**. The names for them — RTLS, TAL, AOA, ATO — are decades old. They were built for the crewed Space Shuttle, where a wrong choice kills people. Every one of them is really a statement about the vehicle's **specific orbital energy**: how much of it the vehicle has at the moment something fails, and what that much energy is good for.

## The energy state through an ascent

Think about a skateboarder in a half-pipe. Speed at the bottom and height up the side trade back and forth, but the total — motion energy plus height energy — stays fixed while nobody pushes. A rocket coasting with its engines off is the same. Its energy per kilogram stays fixed along the path.

That energy per kilogram is the **[[specific orbital energy|specific-energy]]**:

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}.
$$

Read $\varepsilon$ as "epsilon". The first part, $v^2/2$, is motion energy per kilogram, where $v$ is the speed. The second part, $\mu/r$, is how deep the rocket sits in Earth's gravity well, with $r$ the distance from Earth's center and $\mu = 3.986 \times 10^{14}\ \mathrm{m^3/s^2}$ Earth's gravitational parameter. The units are joules per kilogram, $\mathrm{J/kg}$; we will use millions of them, $\mathrm{MJ/kg}$.

$\varepsilon$ is negative for any **bound** orbit — one that stays near Earth instead of escaping. The more negative, the deeper in the well. Together with the **angular momentum** per kilogram $h = r\,v_t$ (radius times the horizontal speed $v_t$), it fixes exactly which ellipse the rocket is on if its engines stopped right now. That unpowered path is a **[[ballistic|ballistic]]** coast.

Two points on that ellipse matter. **Apogee** is the highest point, farthest from Earth's center. **Perigee** is the lowest point, closest to Earth's center. We quote both as altitudes above the surface. If the **ballistic perigee** is below the surface — a negative altitude — the ellipse passes through the Earth, which means the coasting rocket would hit the air and the ground long before getting there.

::: example How suborbital "suborbital" actually is
Take this module's worked ascent. At several moments, pretend the engines stop, and work out the ellipse the rocket would coast on. The table gives the altitude, the speed in the inertial frame, the energy and the ballistic perigee:

| time | altitude | speed | $\varepsilon$ | ballistic perigee |
| --- | --- | --- | --- | --- |
| $t=0$ (liftoff) | 0.0 km | 465 m/s | $-62.4$ MJ/kg | $-6367$ km |
| stage 1 burnout | 60.4 km | 3608 m/s | $-55.4$ MJ/kg | $-5659$ km |
| stage 2, $t=100\ \mathrm{s}$ | 142.8 km | 3818 m/s | $-53.8$ MJ/kg | $-5556$ km |
| stage 2, $t=200\ \mathrm{s}$ | 256.1 km | 4540 m/s | $-49.8$ MJ/kg | $-5155$ km |
| stage 2, $t=300\ \mathrm{s}$ | 386.1 km | 6311 m/s | $-39.0$ MJ/kg | $-3038$ km |
| insertion, $t=343.3\ \mathrm{s}$ | 400.0 km | 7668 m/s | $-29.4$ MJ/kg | $+397$ km (stable) |

(Stage-2 times are counted from stage-2 ignition. The liftoff speed is the 465 m/s the pad already has from Earth's spin.)

**Step 1: check one row by hand.** At stage 1 burnout, $r = 6378.1 + 60.4 = 6438.5$ km. Motion energy: $3608^2 / 2 = 6.51 \times 10^6$ J/kg, which is 6.51 MJ/kg. Well depth: $\mu / r = (3.986 \times 10^{14}) / (6.4385 \times 10^{6}) = 6.191 \times 10^{7}$ J/kg, which is 61.91 MJ/kg. So $\varepsilon = 6.51 - 61.91 = -55.4$ MJ/kg, as the table says.

**Step 2: read the perigee column.** It stays hugely negative for almost the whole flight. At $t = 300$ s it is still $-3038$ km, only 43 seconds before cutoff. It climbs above the ground only in the last three seconds or so of a 343-second burn. (In between the table's rows it goes from $-88$ km at $t = 340$ s to $+397$ km at cutoff.)

**Step 3: read one row as a story.** At $t = 200$ s the rocket is 256 km up and moving at 4.5 km/s. That sounds like space. But its coast ellipse dives straight back into the atmosphere. If all thrust stops there, it cannot coast to safety.

**Sanity check.** The energy column rises steadily from $-62.4$ to $-29.4$ MJ/kg, and the last value matches a circular 400 km orbit, $-\mu/(2r) = -29.4$ MJ/kg. Engines add energy; nothing else does. Whatever "abort" means at $t = 200$ s, it cannot mean "stop pushing and wait."
:::

::: note Why it has to be true
How do you get the perigee from a state? The size of the ellipse comes from the energy: its **semi-major axis** (half its longest width) is $a = -\mu/(2\varepsilon)$. Its **eccentricity** $e$ — how squashed it is, 0 for a circle and close to 1 for a long thin ellipse — comes from energy and angular momentum together:

$$
e = \sqrt{1 + \frac{2\varepsilon h^2}{\mu^2}}.
$$

Then perigee and apogee radius are $r_p = a(1 - e)$ and $r_a = a(1 + e)$. Subtract Earth's radius, 6378.1 km, to get altitudes.

For stage 1 burnout, $h = 6.4385 \times 10^6 \times 3527.5 = 2.271 \times 10^{10}\ \mathrm{m^2/s}$ (the horizontal speed is 3527.5 m/s). Then $a = 3597.5$ km, $e = 0.8002$, $r_p = 718.9$ km from the center — an altitude of $-5659$ km — and $r_a = 6476.2$ km, an apogee altitude of only 98 km. At liftoff the speed is purely horizontal at the surface, so the pad is the *top* of that ellipse: apogee altitude 0, and the perigee lies deep inside the Earth.
:::

### Why energy piles up so fast near the end

Engines add energy at a rate equal to the thrust's **power** per kilogram — push times speed, the way pedaling hard on a fast bike delivers more energy per second than pedaling hard from a standstill:

$$
\frac{d\varepsilon}{dt} = a_T\, v \cos\theta ,
$$

where $a_T = T/m$ is the thrust acceleration and $\theta$ ("theta") is the angle between the thrust and the velocity. Late in the burn, all three work together. The rocket is lighter, so $a_T$ is bigger; it is faster, so $v$ is bigger.

At $t = 200$ s: $a_T = 16.2\ \mathrm{m/s^2}$, $v = 4540$ m/s, $\cos\theta = 0.933$, so $d\varepsilon/dt = 16.2 \times 4540 \times 0.933 \approx 68.6$ kJ/kg each second. At $t = 300$ s: $a_T = 30.8\ \mathrm{m/s^2}$, $v = 6311$ m/s, $\cos\theta = 0.728$, giving about $141.6$ kJ/kg each second — about twice as fast. That is why the last stretch of the burn changes the picture so quickly.

## What continuing would cost

Suppose the vehicle had a spare engine for emergencies. What would it take to turn a doomed coast into a safe orbit? The **[[vis-viva equation|vis-viva]]** answers it. It gives the speed $v$ at any radius $r$ on an ellipse with semi-major axis $a$:

$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right).
$$

The cheapest place to raise the low point of an orbit is at its high point. So the plan is: coast up to apogee, then fire forward to raise perigee to a safe 200 km.

::: example Raising perigee, and how fast that gets cheaper
**At $t = 200$ s.** The coast ellipse really does climb to an apogee of 406.3 km before falling back — that part of the arc is real. Only the fall back through the impossible perigee is not.

**Step 1: the current speed at apogee.** At apogee all the speed is horizontal, so it equals the angular momentum divided by the radius, $v_A = h / r_A$. From the state at $t = 200$ s that gives $v_A = 4236.4$ m/s.

**Step 2: the speed needed.** The target ellipse keeps the same apogee, $r_A = 6378.1 + 406.3 = 6784.4$ km, and has perigee $r_P = 6378.1 + 200 = 6578.1$ km. Its semi-major axis is the average: $a_T = (6784.4 + 6578.1)/2 = 6681.3$ km. Vis-viva at apogee:

$$
v_T = \sqrt{3.986 \times 10^{14}\left(\frac{2}{6.7844 \times 10^6} - \frac{1}{6.6813 \times 10^6}\right)} = 7605.6\ \mathrm{m/s}.
$$

**Step 3: the burn.**

$$
\Delta v = 7605.6 - 4236.4 = 3369.2\ \mathrm{m/s}.
$$

**At $t = 300$ s.** Repeat the recipe. The natural apogee is now 499.4 km. The current apogee speed is $6155.4$ m/s. The target (same apogee, 200 km perigee, $a_T = 6727.8$ km) needs $7527.8$ m/s. So $\Delta v = 7527.8 - 6155.4 = 1372.4$ m/s.

**Compare.** $1372.4 / 3369.2 \approx 0.41$ — well under half, after only 100 more seconds of flight.

**Sanity check.** Both burns end near 7.5 to 7.6 km/s, close to low-orbit speed, as a nearly circular 200-to-500 km orbit should. The difference is all in the starting speed at apogee, which grew by almost 2 km/s in those 100 seconds.
:::

The same failure is a very different problem depending on exactly *when* it happens. The vehicle's energy is changing fastest near the end of the burn, so the cost of rescue falls fastest there too.

::: key
A vehicle's ballistic perigee — what its current state would coast to unpowered — stays deeply negative for almost all of a typical ascent and only turns positive very late. The $\Delta v$ a contingency burn needs to fix that falls sharply as the flight progresses, because both the natural apogee and the apogee speed are improving together.
:::

## The vocabulary

Now the classic names. Each one is a different answer to "what can this much energy do?", listed from the least energy to the most. The hike comes along for the ride.

**RTLS — Return to Launch Site.** *Turn back to the car.* Early in flight there is too little energy for anything downrange, and certainly none for orbit. The vehicle, or its crew capsule, flies an actively guided path back toward the launch site. On the Shuttle this meant a **[[powered pitch-around|rtls]]**. It is not a coast: the energy table shows a passive coast this early is not survivable.

**TAL — Transatlantic Abort Landing** (more generally, a downrange abort landing). *Go on over the pass to the village.* There is enough energy to reach a prepared **[[landing site far downrange|tal-sites]]**, but not enough for even one full orbit. The vehicle continues on a suborbital path to a runway placed there for exactly this case, instead of trying to come back the way it came.

**AOA — Abort Once Around.** *Take the loop trail back to the car.* There is enough energy for one lap of a low, temporary orbit, but not enough margin to call that orbit a mission. The vehicle goes into orbit, comes most of the way around the Earth once, and fires to come back down — an orbit used as a very big, very fast road home, not a destination.

**ATO — Abort to Orbit.** *Stop at the lower hut.* There is enough performance left to reach a stable, if lower and less useful, orbit outright. The vehicle does exactly that. This is the graceful fallback lesson 8 already flew end to end, and it is only available once "an orbit I can reach" and "where I am heading" are close together — which the table shows happens only late in the flight. Only one Shuttle mission ever [[had to use an abort mode|sts-51f]] in flight, and it was an ATO.

::: key
Shuttle-era abort mode vocabulary. RTLS: return to launch site. TAL: transatlantic abort landing. AOA: abort once around. ATO: abort to orbit. The mode boundaries are functions of velocity and time, and knowing which you are in is a guidance responsibility.
:::

::: key
RTLS, TAL, AOA and ATO are not four different procedures so much as four different answers the *same* energy state gives, read off in order of how much of it is available: too little for anything but a guided return to the pad; enough for a downrange landing site but not orbit; enough for one lap of a disposable low orbit; enough for a real, if reduced, orbit outright.
:::

## The decision logic

The boundary between modes is a **reachability** question — can the vehicle reach this, with what it has left? — in the same sense lesson 8 computed one. Ask the questions from the best outcome down:

1. **Is any stable orbit reachable** from the actual state with the propellant left? If yes, it is ATO. The machinery is the same explicit-guidance retargeting the whole module has built: recompute the best reachable orbit and fly to it. When the nominal orbit is out of reach after an engine failure, this is where the vehicle drops to a predefined lower-energy target.
2. **If not, is a once-around or downrange trajectory survivable?** Then it is AOA or TAL. This is no longer a guidance-retargeting problem. It is a problem of shaping the trajectory and picking a landing site.
3. **If even that margin is missing,** the only option left is the guided return a coast cannot give: RTLS.

Those questions depend on the two things this lesson has been tracking: the vehicle's energy (in practice, its velocity at its altitude) and the time since liftoff. On the Shuttle, the crew and flight controllers followed them with [[call-outs|call-outs]] at the moments one option closed and another opened. Knowing continuously which region the vehicle is in, as the numbers change second by second, is as much a guidance and navigation job as flying the nominal climb.

Here is that ladder as a short Python function. The inputs would come from quick reachability checks onboard. The 150 km threshold is only an example.

```python
def choose_abort(best_perigee_km, once_around_ok, downrange_site_ok):
    """Pick the best abort mode, trying the best outcome first."""
    if best_perigee_km >= 150.0:   # example threshold for a stable orbit
        return "ATO"
    if once_around_ok:
        return "AOA"
    if downrange_site_ok:
        return "TAL"
    return "RTLS"

print(choose_abort(180.0, True, True))    # ATO
print(choose_abort(90.0, True, True))     # AOA
print(choose_abort(-3000.0, False, True)) # TAL
print(choose_abort(-5500.0, False, False))# RTLS
```

::: warning
Do not read the table's switch to a positive ballistic perigee as the moment aborts stop being needed. It is only the moment a *passive coast* stops being a disaster. A vehicle can still lose enough performance after that point to fall short of its planned orbit. That is the engine-out case lesson 8 worked through in full, using the same reachable-orbit machinery as this lesson, not any of the four abort names.
:::

::: warning
Do not judge a coast by altitude and speed alone. "High and fast" can still mean "falling back in". Survivability depends on the combination in $\varepsilon$ and $h$ — which is exactly what the perigee calculation packs together.
:::

## Check yourself

::: check
Using the ballistic-perigee table, explain why "the vehicle is already above 200 km and moving at several kilometers per second" is not, by itself, evidence that a coast-to-safety abort is available.
:::

::: answer
At 256 km altitude and 4540 m/s ($t = 200$ s), the vehicle's ballistic perigee is still $-5155$ km. Its coast ellipse would carry it back into the atmosphere long before it completed even one orbit. Altitude and speed alone do not decide whether a coast is survivable. What matters is the combination captured in specific orbital energy (and angular momentum). A vehicle can be high and fast and still be nowhere near enough of either for an unpowered coast to be anything but a re-entry.
:::

::: check
Between $t = 200$ s and $t = 300$ s, why does the $\Delta v$ needed to raise perigee to a safe altitude fall so much faster than the passing flight time might suggest?
:::

::: answer
Two things improve together over that interval. The natural (ballistic) apogee rises from 406.3 km to 499.4 km, and the current ellipse's apogee speed rises from 4236.4 m/s to 6155.4 m/s — much closer to the roughly 7.5 to 7.6 km/s a 200-km-perigee orbit needs at that apogee either way. The required burn is the *difference* between the current and target apogee speeds. The current apogee speed climbs quickly while the target barely changes (7605.6 to 7527.8 m/s), so the gap — and the $\Delta v$ — closes from 3369.2 to 1372.4 m/s, much faster than "100 more seconds of flight" suggests. Underneath, the engines are pumping in energy about twice as fast at 300 s as at 200 s.
:::

::: check
Match each abort mode — RTLS, TAL, AOA, ATO — to the phrase that best describes the energy state behind it: (a) enough for one disposable lap; (b) enough for a real, if smaller, orbit; (c) enough to reach a downrange site, not orbit; (d) not enough for anywhere but back to the pad.
:::

::: answer
RTLS $\to$ (d); TAL $\to$ (c); AOA $\to$ (a); ATO $\to$ (b). The order follows exactly how much usable energy and performance margin remains at the moment of failure, from least to most.
:::

::: check
A flight-rules team is deciding where to put the boundary between the TAL and AOA regions of a flight timeline. Based on this lesson, what quantity should that boundary really be defined by?
:::

::: answer
By the vehicle's actual reachable-orbit performance at each point in the timeline: whether the state and propellant left are enough to reach a stable, if temporary, orbit at all. Not by a fixed time or altitude. This lesson's numbers show the energy state can change quickly over a short span, so a boundary fixed to a clock time is only a stand-in for the real quantity (reachable orbit, computed the way lesson 8 computed it). It has to be checked against that real quantity, not assumed to track it exactly.
:::

::: check
Explain why ATO is described as using "the same machinery" as the engine-out lesson, rather than as a separate guidance mode.
:::

::: answer
ATO's defining feature is that a stable orbit is still reachable, only a lower or otherwise reduced one. That is exactly the situation lesson 8 worked through with numbers: guidance sees that the planned target is out of reach, searches for the best orbit the remaining propellant can actually deliver, and retargets to it with the same explicit, re-converging guidance cycle flown throughout this module. Nothing in that process is special to an engine failure rather than any other shortfall in performance. "ATO" is a name for that outcome, not a different algorithm.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\varepsilon = v^2/2 - \mu/r$ | specific orbital energy, J/kg; negative for a bound orbit |
| Ballistic perigee | the lowest point of the ellipse a vehicle's current state would coast on unpowered; negative means the atmosphere or the ground gets in the way first |
| Perigee from a state | $a = -\mu/(2\varepsilon)$, $e = \sqrt{1 + 2\varepsilon h^2/\mu^2}$, $r_p = a(1-e)$, $r_a = a(1+e)$ |
| Worked ascent | ballistic perigee stays below $-3000$ km until $t = 300$ s of stage 2 and turns positive only in the last few seconds of a 343 s burn |
| $d\varepsilon/dt = a_T v\cos\theta$ | energy gain rate; about 69 kJ/kg per second at $t = 200$ s, 142 at $t = 300$ s |
| Vis-viva | $v^2 = \mu(2/r - 1/a)$ |
| $\Delta v$ to raise perigee at apogee | 3369.2 m/s at $t=200\ \mathrm{s}$ (apogee 406.3 km); 1372.4 m/s at $t=300\ \mathrm{s}$ (apogee 499.4 km) |
| RTLS | Return to Launch Site — too little energy for anything but a guided return to the pad |
| TAL | Transatlantic (downrange) Abort Landing — enough for a prepared downrange site, not orbit |
| AOA | Abort Once Around — enough for one disposable low-orbit lap, then deorbit |
| ATO | Abort to Orbit — a stable, reduced orbit is reachable; the same mechanism as lesson 8's engine-out retargeting |
| Decision logic | try ATO, then AOA or TAL, then RTLS; boundaries are reachability questions in velocity, energy and time, not fixed clock times |

This module built ascent guidance from the ground up: why the trajectory has the shape it does, the optimal steering law and the algorithms that fly it, the offline work that hands them their numbers, and — in these last three lessons — what happens when reality does not cooperate. What comes next is what every GNC system in this course eventually needs: the orbit the vehicle has been fighting its way toward, and the maneuvers that follow.

::: context specific-energy Why the energy is negative
Where you put "zero" energy is a choice. Orbit engineers put it at a rocket that has just barely escaped Earth — infinitely far away and no longer moving. Anything still held by Earth has less energy than that, so its $\varepsilon$ is below zero. The chart shows the worked ascent climbing toward zero, bar by bar.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="100" y="32">liftoff</text><text x="100" y="60">stage 1 out</text><text x="100" y="88">t = 100 s</text>
    <text x="100" y="116">t = 200 s</text><text x="100" y="144">t = 300 s</text><text x="100" y="172">orbit</text>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="106" y="20" width="249.6" height="16"/><rect x="106" y="48" width="221.6" height="16"/>
    <rect x="106" y="76" width="215.2" height="16"/><rect x="106" y="104" width="199.2" height="16"/>
    <rect x="106" y="132" width="156" height="16"/>
  </g>
  <rect x="106" y="160" width="117.6" height="16" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44">
    <text x="112" y="32">−62.4</text><text x="112" y="60">−55.4</text><text x="112" y="88">−53.8</text>
    <text x="112" y="116">−49.8</text><text x="112" y="144">−39.0</text><text x="230" y="172">−29.4 MJ/kg</text>
  </g>
  <text x="106" y="194" font-size="11" fill="#6c7a93">bar length = how far below zero (escape)</text>
</svg>
```
:::

::: context ballistic Thrown, then left alone
"Ballistic" comes from the ballista, an ancient war machine that threw rocks. A ballistic path is what anything follows once it has been thrown and nothing pushes it any more — only gravity acts. A baseball after it leaves the bat, a coasting rocket after its engines stop, and a satellite in orbit all fly ballistic paths. Orbits are just ballistic paths fast enough to keep missing the ground.

The picture shows the coast ellipse at $t = 200$ s, drawn to scale around Earth's center. Only the short solid arc near apogee is above the ground; the rest, dashed, runs inside the planet, which the rocket can never reach.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="76.5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="180" cy="76.6" rx="34.6" ry="48.0" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M 162 35.6 A 34.6 48.0 0 0 1 198 35.6" fill="none" stroke="#b4232c" stroke-width="3.5"/>
  <circle cx="180" cy="110" r="2.5" fill="#1f2a44"/>
  <circle cx="180" cy="124.7" r="3" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="206" y="24" font-size="12" fill="#1f2a44">apogee 406 km</text>
  <text x="188" y="140" font-size="11" fill="#1f2a44">perigee: 5155 km below the surface</text>
  <text x="16" y="190" font-size="11" fill="#6c7a93">Earth and ellipse to the same scale</text>
</svg>
```
:::

::: context vis-viva A very old name
"Vis viva" is Latin for "living force", an old name from the 1600s and 1700s for what we now call kinetic energy. The equation is really energy conservation in disguise: set $v^2/2 - \mu/r$ equal to the orbit's energy, $-\mu/(2a)$, and multiply through by 2. You get $v^2 = \mu(2/r - 1/a)$. It lets you find the speed anywhere on an orbit from just the distance to Earth's center and the orbit's size.
:::

::: context rtls Flying backward to go home
The Shuttle's RTLS was probably the strangest maneuver ever planned for a crewed vehicle. After the solid boosters dropped away, the orbiter kept flying *away* from Florida while burning off propellant, then flipped around so its engines pointed back toward home and thrust to cancel its downrange speed and head back. After the external tank was dropped, the orbiter glided to a runway near the launch pad.

It was never needed in flight. Many engineers were relieved.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="340" y2="130" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M 50 130 C 70 60, 160 30, 260 40" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M 260 40 C 300 45, 300 70, 240 70 C 180 72, 120 100, 70 128" fill="none" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 4"/>
  <circle cx="260" cy="40" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="200" y="26" font-size="12" fill="#1f2a44">pitch-around</text>
  <text x="30" y="146" font-size="12" fill="#1f2a44">launch site</text>
  <text x="110" y="52" font-size="12" fill="#1d6fd1">going out</text>
  <text x="140" y="104" font-size="12" fill="#b4232c">coming back</text>
</svg>
```
:::

::: context tal-sites Runways across the ocean
A Shuttle launched from Florida flew northeast or east over the Atlantic, so the TAL runways were on the far side of it: over the years NASA used sites in Spain (Zaragoza and Morón), France (Istres), Morocco (Ben Guerir), the Gambia (Banjul) and Senegal (Dakar). Before each launch, weather at the chosen sites had to be acceptable, and teams stood by at them. No Shuttle ever had to land at one.
:::

::: context sts-51f The one real abort to orbit
On July 29, 1985, Challenger launched on mission STS-51F. About five minutes and 45 seconds into flight, one of its three main engines shut down because faulty temperature sensors wrongly reported it was overheating. The crew was told to "abort ATO". The two remaining engines pushed the orbiter into a lower orbit than planned, and the mission carried on and finished its work. It was the only in-flight abort of the Shuttle program — and it was the graceful fallback, not a dramatic return.
:::

::: context call-outs Named moments on the loop
Shuttle flight controllers called out the moments when options changed. "Negative return" meant RTLS was no longer possible: the orbiter had gone too far and too fast to turn back. "Press to ATO" meant that, even with one engine out, the orbiter could now reach a safe orbit. "Press to MECO" meant it could reach its planned main-engine cutoff on the engines it had left.

Today's crew capsules, such as SpaceX's Crew Dragon, take a different approach for most of the climb: a **launch escape system** of powerful thrusters that pulls the capsule off a failing rocket at any point, then parachutes it into the ocean. Crew Dragon demonstrated this in an in-flight abort test in January 2020.
:::
