---
id: l10-offline-trajectory-optimization
title: Ascent trajectory optimization as an offline problem
minutes: 24
covers:
  - Ascent trajectory optimization as an offline problem feeding onboard guidance
---

Think about a long family road trip. The night before, someone sits at the kitchen table for an hour with maps, weather, road closures, gas stops and the height limit of the bridge on the back road. That is the careful plan. Then, in the car, the phone's map app does something much quicker. Every few seconds it looks at where you actually are and recomputes "turn left in 300 meters" with a very simple picture of the road. Nobody expects the phone to redo the hour of planning at every corner, or the kitchen-table plan to steer around a pothole.

A rocket's climb to orbit is split the same way. Since the first lesson, this module has treated the pitch-kick angle, the staging point, the acceleration limit and the target orbit as numbers handed to the flight software "from somewhere". This lesson is about that somewhere. None of those numbers is arbitrary, and none of them is worked out in flight. They come from an **offline trajectory optimization** — a big, careful calculation done on the ground, before the rocket leaves the pad, that finds the best path the rocket can fly while respecting every limit it has.

The split between that ground calculation and the **onboard guidance** — the quick steering calculation the flight computer repeats during the climb, which this module has spent most of its time building — is not a historical accident. It is a sharing of work between two problems that need different tools.

## Two problems, two budgets

Every calculation has a **budget**: how much time and computer power it is allowed to use. The two problems have wildly different budgets.

**The offline problem** can afford almost anything. It gets hours of ground computer time and a full model: the real atmosphere, wind-tunnel aerodynamics, a structural model that says how hard the air may push before the rocket bends, and every limit the rocket has to respect. It is solved with heavy tools such as **[[direct collocation|direct-collocation]]** — chop the whole flight into many small time steps, treat the state and the steering at every step as unknowns, and let a large optimizer adjust them all at once until the physics fits together and the cost is as small as it can be. (The Trajectory Optimization module that follows this one builds direct collocation, and its cousins iLQR and differential dynamic programming, in full.)

It is run only a handful of times for a mission, the last one on launch day (the next lesson). Its output is a **reference**: the pitch program, the staging time, and a set of stored constants called **[[I-loads|i-loads]]** — the mission-specific numbers loaded into the flight software before launch. These are the parameters the earlier lessons have been quietly assuming.

**The onboard problem** gets one guidance cycle's worth of time — a second or two — on a **[[flight computer|flight-computer]]** built to survive vibration and radiation, not to be fast. That is exactly the budget the linear tangent law, Powered Explicit Guidance (PEG) and Iterative Guidance Mode were built to fit. They are closed form, or nearly so, and fast enough to re-solve from scratch every few seconds.

It carries only a flat-gravity local picture and the rocket's current state — on purpose, because that is what fits.

What is left for it to do is a **[[boundary-value problem|boundary-value-problem]]**: a problem where you know where you are now and where you must end up, and you have to find the steering that connects the two. The offline work has already chosen the route; onboard guidance only has to close the gap from wherever the rocket actually is.

::: key
Offline optimisation vs onboard guidance: the full ascent trajectory is optimised offline with high-fidelity models to set the pitch program, staging and I-loads. Onboard guidance then only has to close the remaining boundary-value problem in real time from the actual state.
:::

::: key
Offline optimization affords a full-fidelity vehicle and environment model, solved once (or occasionally) before flight, producing the reference and the parameters onboard guidance flies. Onboard guidance affords a deliberately cheap local model, re-solved every cycle, because that is what the real-time budget allows.
:::

## The limit that actually decides the answer

Back to the road trip. The shortest route to Grandma's house crosses an old bridge with a 10-tonne weight limit, and your moving truck weighs 12 tonnes. The shortest route is not an answer at all. The real question is "the shortest route *that the truck is allowed to take*". The weight limit, not the distance, decides which road you drive.

It is tempting to picture the offline ascent problem as "use the least propellant" and stop there. The first lesson already showed that picture is incomplete. As the pitch kick gets bigger, gravity loss falls and drag loss rises, and somewhere in between is the angle where their sum is smallest. An offline optimizer searches for that angle properly, and finds something the first lesson's four-case table could only hint at.

A few words first. A **cost** is the number the optimizer tries to make small — here, the total loss, gravity loss plus drag loss, in m/s. A **constraint** is a rule the answer must obey — here, that the air load stays inside what the structure can take. An answer that obeys every constraint is **feasible**. The best feasible answer is the **constrained optimum**. When the constrained optimum sits right against a limit, we say that constraint is **active**, or that it **binds**.

::: example Where the loss-minimizing kick angle actually sits
Take the same two-stage vehicle as lesson 1 and scan the kick angle finely, flying the whole first stage for each one:

| kick | gravity loss | drag loss | total loss | max-$\bar q$ |
| --- | --- | --- | --- | --- |
| $1.60^\circ$ | 540.4 m/s | 30.4 m/s | 570.8 m/s | 39.8 kPa |
| $2.00^\circ$ | 434.1 m/s | 37.1 m/s | 471.3 m/s | 44.6 kPa |
| $2.50^\circ$ | 319.9 m/s | 62.7 m/s | 382.5 m/s | 54.2 kPa |
| $2.60^\circ$ | 299.3 m/s | 75.0 m/s | 374.2 m/s | 57.2 kPa |
| $\mathbf{2.70^\circ}$ | 279.4 m/s | 92.8 m/s | $\mathbf{372.2}$ m/s | $\mathbf{84.4}$ kPa |
| $2.80^\circ$ | 260.1 m/s | 118.9 m/s | 379.0 m/s | 153.3 kPa |
| $3.00^\circ$ | 223.4 m/s | 215.2 m/s | 438.5 m/s | 479.9 kPa |

(Each total was added before rounding, so it can differ by 0.1 from the sum of the two rounded columns: $434.1 + 37.1 = 471.2$, shown as 471.3.)

**Step 1: find the smallest total.** Read down the total-loss column. It falls from 570.8 to 372.2 m/s, then rises again. The smallest total is at about $2.70^\circ$.

**Step 2: compare with the angle we have been flying.** The running example uses $2.0^\circ$. Its total is 471.3 m/s. The difference is $471.3 - 372.2 = 99.1$ m/s — nearly a hundred meters per second of speed thrown away, it seems.

**Step 3: look at the price.** At $2.70^\circ$, peak dynamic pressure $\bar q$ ("q bar", how hard the air pushes) is 84.4 kPa. That is $84.4 / 44.6 \approx 1.9$ times the $2.0^\circ$ case, and roughly double the 25 to 40 kPa a real orbital launcher is usually built for.

**Step 4: turn that into angle of attack.** Lesson 2 measured the air load with the **load indicator** $\bar q\alpha$ (read "q-alpha"), the dynamic pressure times the angle of attack, with a typical limit of 100 kPa·deg. At $\bar q = 44.6$ kPa, that limit allows $\alpha = 100 / 44.6 = 2.24^\circ$ of angle of attack for wind and errors. At $\bar q = 84.4$ kPa it allows only $100 / 84.4 = 1.18^\circ$ — about half. The steeper trajectory has half the room for a gusty day.

**Sanity check.** The loss curve has one clear bottom, as a trade between a falling and a rising loss should. Peak $\bar q$ grows with the kick, matching lesson 1: a bigger kick lays the rocket over sooner, so it goes fast while the air is still thick.

So the unconstrained minimum is not a candidate answer at all. The real offline problem is: *minimize the loss, subject to* $\bar q_{\max}$ — or, more precisely, the load indicator $\bar q\alpha$ — *staying inside the structural envelope*. The constraint, not the bottom of the loss curve, sets the kick angle a real vehicle flies. This module's $2.0^\circ$ example sits inside that constraint with room to spare for wind and scatter. $2.70^\circ$ would not survive a real windy day.
:::

::: key
The offline ascent optimization is a *constrained* problem — minimize propellant loss subject to the structural load envelope — and for a real vehicle the load constraint is what actually binds. The unconstrained loss-minimizing trajectory typically overruns it, which is why the flown pitch program sits short of where propellant alone would put it.
:::

### A flat bottom and a steep wall

Look at the table once more, near the bottom of the loss curve. Going from $2.60^\circ$ to $2.70^\circ$ saves only $374.2 - 372.2 = 2.0$ m/s. But peak $\bar q$ jumps by $84.4 - 57.2 = 27.2$ kPa. Near its bottom, the loss curve is almost flat, while the load climbs like a wall.

That shape is the rule. At the bottom of any smooth valley the ground is level, so a small step away barely changes your height. Backing off from the unconstrained minimum costs very little loss and buys a lot of structural margin. An optimizer with a load constraint slides back from the bottom until the load just fits.

::: example Pricing a looser limit
Suppose structural engineers could raise the allowed peak $\bar q$ a little. How much loss does each extra kilopascal save? Use the two neighboring table rows where the load is close to realistic limits.

**Step 1: the change in loss.** From $2.50^\circ$ to $2.60^\circ$ the total loss drops from 382.5 to 374.2 m/s. That is $382.5 - 374.2 = 8.3$ m/s saved.

**Step 2: the change in load.** Over the same step, peak $\bar q$ rises from 54.2 to 57.2 kPa, which is $3.0$ kPa more.

**Step 3: divide.** $8.3 / 3.0 \approx 2.8$ m/s of loss saved per extra kilopascal allowed.

**Step 4: do the same one row further on.** From $2.60^\circ$ to $2.70^\circ$: $2.0$ m/s saved for $27.2$ kPa, which is $2.0 / 27.2 \approx 0.07$ m/s per kilopascal — about forty times less.

**Sanity check.** Each extra kilopascal is worth less the closer you get to the bottom of the valley, as the flat-bottom picture says. A structure engineer and a trajectory engineer can use exactly this number, called the **[[shadow price|shadow-price]]** of the constraint, to decide whether strengthening the rocket is worth its weight.
:::

::: note Why it has to be true
Let the loss be $J(k)$, a smooth function of the kick angle $k$. At the bottom of the valley, $k^\ast$, the slope $dJ/dk$ is zero: if it were positive you could lower $J$ by stepping left, and if it were negative you could lower it by stepping right. Near that point, a Taylor expansion (a local "best-fit parabola") gives

$$
J(k^\ast + \Delta k) \approx J(k^\ast) + \tfrac12 J''(k^\ast)\,\Delta k^2 ,
$$

read "J double-prime". The change in loss grows only with the *square* of the step. A step twice as small costs four times less. Meanwhile the load $\bar q_{\max}(k)$ has a slope that is not zero there — it keeps climbing. So a small retreat, $\Delta k < 0$, cuts the load in proportion to $\Delta k$ while costing loss only in proportion to $\Delta k^2$. That mismatch is why the constrained optimum sits on the load limit, and why sitting there costs so little.

At the constrained optimum, the slopes of the loss and of the load point in exactly opposite directions, scaled by a number $\lambda$ (the Lagrange multiplier): $dJ/dk = -\lambda\, d\bar q_{\max}/dk$. That $\lambda$ is the shadow price from the example — loss saved per unit of limit relaxed.
:::

## Why the onboard model is allowed to be cheap

How can onboard guidance get away with a flat-gravity, drag-free picture? The answer is about *time*, not accuracy. The map app trusts its crude picture only until the next update. Freeze its first instruction — "head north for 300 miles" — and drive it blindly, and you end up in the wrong state. The picture was fine for the next block, not for the whole trip.

::: example The same cheap model, trusted for the wrong length of time
Lesson 4, on Powered Explicit Guidance, solved a single guidance cycle from a flat-gravity, drag-free local model — the very first cycle of the stage-2 burn. It found steering numbers $(A, B, t_{go}) = (6.4124,\ -0.020982,\ 354.09\ \mathrm{s})$. Here $A$ and $B$ are the two numbers in the linear tangent law $\tan(\text{pitch}) = A + Bt$, and $t_{go}$ ("t go") is the estimated burn time left.

**What the model believed.** Asked to predict its own outcome, the local model said it would hit the target orbit exactly — its leftover error was the solver's, better than one part in a billion ($10^{-9}$).

**What really happened when trusted too long.** [[Flown open loop|frozen-steering]] — committed to that one steering law for the whole 354-second burn, against the true curved-gravity physics, with no re-solving — the rocket missed by 163.8 km of altitude, 343.5 m/s of horizontal speed, and 1238.6 m/s of leftover vertical speed. That is not an orbit.

**What the difference means.** The model was trusted for 354 seconds when its assumptions are good for a few. Re-solved every few seconds from the true state, the same model delivered lesson 4's insertion to within a fraction of a meter and a few m/s.

**Sanity check.** A flat-Earth model ignores the fact that [["down" swings round|down-turns]] by about $1^\circ$ for every 111 km the rocket travels over the ground. Over a few seconds that is nothing. The stage-2 burn carries the rocket about 1,500 km around the Earth, so "down" turns by about $13.6^\circ$ during it — plenty to miss an orbit.
:::

So a cheap model is only as good as how briefly it is trusted, and the offline and onboard split is built around that fact.

- The **offline** plan needs full fidelity because its pitch program is flown open loop through the whole atmospheric phase, with nothing correcting it in real time.
- The **onboard** solution stays cheap because it is never trusted for more than one guidance cycle before being recomputed from the true state.

::: warning
Do not read "offline" as "fixed once and never touched again." A day-of-launch wind update re-runs a version of this same offline optimization a few hours before liftoff, with a measured atmosphere in place of a design-reference one, producing a new pitch program without changing anything about the onboard guidance algorithm itself. Offline and onboard describes *when* and *how expensively* a problem is solved, not how often its answer changes.
:::

On a real launcher, the offline team also studies the **[[dispersions|dispersions]]** — the small random differences between the planned flight and the real one, from engine thrust, wind and mass — by flying thousands of simulated launches. Onboard guidance then takes the real state at the handoff and closes the rest.

## Check yourself

::: check
Explain why "minimize gravity loss plus drag loss" is not, by itself, a complete statement of the offline ascent optimization problem.
:::

::: answer
The kick-angle scan shows the unconstrained minimum of gravity-plus-drag loss sits near a $2.70^\circ$ kick, where maximum dynamic pressure reaches 84.4 kPa — roughly double what a real launcher's structure is built to survive. A trajectory that uses the least propellant while ignoring the structural load it produces is not a usable answer. The real problem minimizes loss *subject to* the vehicle's load envelope, and for this vehicle that constraint binds well before the unconstrained minimum is reached.
:::

::: check
A design team wants to fly the $2.70^\circ$ kick angle because its total loss is 99.1 m/s smaller than the $2.0^\circ$ case. What single number from this lesson is the strongest argument against it, and why?
:::

::: answer
The 84.4 kPa maximum dynamic pressure at $2.70^\circ$, against a typical real-launcher structural range of 25 to 40 kPa. A propellant saving that needs roughly double the dynamic pressure the structure is sized for is not a saving the design can have. Either the vehicle would need to be strengthened a lot — likely costing more mass than the propellant saved — or the trajectory is simply not survivable as proposed. (The same number also halves the angle-of-attack room: $100/84.4 = 1.18^\circ$ instead of $2.24^\circ$.)
:::

::: check
Why can the onboard guidance algorithm get away with a flat-gravity, drag-free local model when the offline optimizer cannot?
:::

::: answer
Onboard guidance never trusts its local model for more than one guidance cycle — a few seconds — before re-solving from the vehicle's true state. The model's error has only that short a stretch to build up over, as lesson 4 showed directly: the same steering flown for the whole 354 s burn missed by 163.8 km. The offline optimizer's output is flown open loop for the *entire* atmospheric phase, with nothing re-solving it in real time, so any error in its model is carried, uncorrected, for the whole of that phase. That is why it needs the full-fidelity atmosphere, aerodynamics and structural model that the onboard algorithm has no time or hardware budget for.
:::

::: check
A day-of-launch wind update changes the pitch program a few hours before liftoff. Does this mean the guidance algorithm running onboard during ascent is different from the one that would have run without the update?
:::

::: answer
No. The update re-runs the offline optimization with a measured wind profile in place of a design-reference one. It changes the *stored parameters* — the pitch program the vehicle flies open loop — not the onboard guidance algorithm's structure or code. The onboard software (the open-loop pitch program through the atmosphere, then PEG- or IGM-style explicit guidance) is exactly the same either way. Only the reference numbers it is handed differ.
:::

::: check
Suppose the offline optimizer used a cruder, faster atmosphere model to search many candidate kick angles quickly, then checked only the winning candidate with the full-fidelity model before finalizing it. Is this a reasonable engineering compromise, and what would you still want to check?
:::

::: answer
It is a reasonable and common pattern: use a cheap model for a broad search, then confirm the chosen answer with the expensive one. It works if the cheap model is good enough that its optimum lands close to the true one, so the final check is confirming a good candidate rather than discovering the search missed the real answer.

What you should still check is not only whether the winner satisfies the load constraint under the full model. Also check whether a neighboring candidate the cheap model ranked slightly worse is actually better — or is the true constrained optimum — under the full model. Near a binding constraint the load rises steeply while the loss is nearly flat, so a cheap model can easily shift *where* the constrained optimum appears to sit, not just its exact value.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Offline optimization | full-fidelity vehicle and environment model, solved before flight; produces the pitch program, staging point, I-loads |
| Onboard guidance | deliberately cheap local model, re-solved every cycle; closes the remaining boundary-value problem from the actual state |
| I-loads | mission-specific constants loaded into the flight software before launch |
| The real offline problem | minimize propellant loss *subject to* the structural load envelope — a constrained optimization |
| Worked kick-angle scan | unconstrained loss minimum near $2.70^\circ$ (372.2 m/s, 84.4 kPa) vs. the flown $2.0^\circ$ (471.3 m/s, 44.6 kPa, well inside the envelope) |
| Flat bottom, steep wall | near the loss minimum, loss changes with the square of the step while load changes in proportion, so backing off is cheap |
| Shadow price | loss saved per unit of constraint relaxed: about 2.8 m/s per kPa near 55 kPa, 0.07 m/s per kPa near the bottom |
| Why cheap onboard models are safe | re-solved every few seconds, so local error never builds up over more than one cycle |
| Why offline models must be expensive | flown open loop for the whole atmospheric phase, with nothing correcting them in real time |
| Day-of-launch update | re-runs the offline optimization with measured wind; changes parameters, not the onboard algorithm |

The next lesson takes up that day-of-launch update directly: what measured wind data actually changes about the pitch program, and how much performance and structural margin that accuracy is worth.

::: context direct-collocation Beads on a string
Picture the flight as a string of beads. Each bead is one moment in time, and on it you write the rocket's position, speed and steering at that moment. At first the beads are placed by a rough guess, so neighboring beads do not agree with physics: the speed on one bead is not what the rocket would have a moment later.

Direct collocation hands every number on every bead to an optimizer and says: move them all until each pair of neighbors obeys the equations of motion, every limit is met, and the total loss is as small as possible. A real ascent problem can have tens of thousands of unknowns, which is fine on the ground and hopeless on a flight computer in a two-second cycle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <path d="M 30 120 Q 120 40 330 30" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5">
    <circle cx="30" cy="120" r="6"/><circle cx="72" cy="92" r="6"/><circle cx="116" cy="70" r="6"/>
    <circle cx="164" cy="54" r="6"/><circle cx="216" cy="42" r="6"/><circle cx="272" cy="34" r="6"/><circle cx="330" cy="30" r="6"/>
  </g>
  <g fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3">
    <circle cx="72" cy="104" r="6"/><circle cx="164" cy="70" r="6"/><circle cx="272" cy="50" r="6"/>
  </g>
  <text x="120" y="130" font-size="12" fill="#b4232c">first guess (dashed)</text>
  <text x="190" y="84" font-size="12" fill="#1f2a44">each bead: state + steering</text>
  <text x="30" y="20" font-size="12" fill="#1d6fd1">solved path</text>
</svg>
```
:::

::: context i-loads Constants with a countdown
"I-load" is Space Shuttle language: short for initialization load, the mission-specific values stored in the flight software before launch. The software itself — the code — was the same from flight to flight. The I-loads changed: the target orbit, the pitch program, the throttle points, the autopilot gains.

Separating code from constants is good engineering on any vehicle. Code is expensive to re-test. A table of numbers can be recomputed, checked against limits and loaded late in the countdown, which is exactly what the next lesson's day-of-launch update does.
:::

::: context flight-computer Slow on purpose
A flight computer has to keep working while it is shaken, frozen, heated and hit by radiation, and it must never crash. So it uses proven, tested chips and runs several copies side by side that vote on every answer. The Space Shuttle's main computers could do only about a million instructions per second — far less than a cheap phone today.

That is why onboard guidance must be a few lines of algebra per cycle, not a big optimizer. The hard, expensive search is done on the ground, where a crash only costs a restart.
:::

::: context boundary-value-problem Known at both ends
Most school physics problems are *initial*-value problems: you know where the ball starts and how fast, so you find where it lands. A **boundary-value problem** fixes things at *both* ends: the rocket is here now, and it must arrive at this radius, speed and flight-path angle. What you solve for is the steering in between.

That is harder, because you cannot just march forward in time — you have to guess the steering, see where you land, and correct. Lesson 3 did exactly that with two-parameter shooting, and PEG does a tiny, fast version of it every cycle.
:::

::: context shadow-price What a limit is worth
Economists use "shadow price" for the value of loosening a limit by one unit, even though nobody sells that unit in a shop. If your truck could cross a bridge rated 1 tonne higher, how many kilometers would you save? That is the shadow price of the weight limit.

In the ascent problem it is the loss saved per extra kilopascal of allowed dynamic pressure. The optimizer reports it for free — it is the Lagrange multiplier on the constraint. A large shadow price tells the structures team a slightly stronger rocket would pay off. A tiny one says strengthening it is pointless.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="253.6" y="20" width="86.4" height="120" fill="#f2b880" opacity="0.5"/>
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="158" font-size="12" fill="#1f2a44">kick angle, 1.6° to 3.0°</text>
  <text x="46" y="14" font-size="12" fill="#1f2a44">total loss</text>
  <text x="258" y="36" font-size="12" fill="#b4232c">load over limit</text>
  <polyline points="50,30 131.4,80.1 233.2,124.8 253.6,129 273.9,130 294.3,126.6 335,96.6" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="253.6" cy="129" r="5" fill="#1d6fd1" stroke="#1f2a44"/>
  <circle cx="273.9" cy="130" r="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="56" y="133" font-size="12" fill="#1f2a44">constrained best 2.6°</text>
  <line x1="186" y1="129" x2="247" y2="129" stroke="#1f2a44" stroke-width="1"/>
  <text x="262" y="112" font-size="11" fill="#b4232c">bottom 2.7°</text>
</svg>
```

The picture plots the table's total losses, with a limit placed at the $2.6^\circ$ row's 57.2 kPa. The curve is almost flat where the forbidden zone starts, so the constrained best costs only 2.0 m/s more than the true bottom.
:::

::: context frozen-steering Why the frozen plan drifts
Here is the idea in a picture. The re-solved guidance (blue) makes a small error in each cycle, then throws its plan away and starts fresh from the true state, so the error never piles up. The frozen plan (red) keeps its first cycle's steering for the whole burn, and every small mismatch between the flat model and the curved world adds to the last one. The curve is a sketch of the shape; the only real number on it is lesson 4's final miss.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="148" font-size="12" fill="#1f2a44">time in burn</text>
  <text x="46" y="14" font-size="12" fill="#1f2a44">altitude error</text>
  <path d="M 40 130 Q 220 128 320 30" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="170" y="60" font-size="12" fill="#b4232c">frozen plan</text>
  <text x="228" y="26" font-size="12" fill="#b4232c">163.8 km at 354 s</text>
  <path d="M 40 130 L 70 126 L 70 130 L 100 126 L 100 130 L 130 126 L 130 130 L 160 126 L 160 130 L 190 126 L 190 130 L 220 126 L 220 130 L 250 126 L 250 130 L 280 126 L 280 130 L 310 126 L 310 130 L 320 129" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="120" y="118" font-size="12" fill="#1d6fd1">re-solved every cycle</text>
</svg>
```
:::

::: context down-turns The horizon moves with you
"Down" means "toward Earth's center", and that direction is different at every point on the globe. Walk 111 km along the ground and your "down" has turned by $1^\circ$, because Earth's full circle of $360^\circ$ is about 40,000 km around. Stage 2 covers about 1,500 km, so the local vertical at cutoff is $13.6^\circ$ away from the one at the start. A flat-Earth model pretends both are the same line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M 77.4 60.1 A 300 300 0 0 1 282.6 60.1" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="141.5" y1="19.3" x2="154.5" y2="128.5" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="218.5" y1="19.3" x2="205.5" y2="128.5" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="144.5" cy="44.1" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="215.5" cy="44.1" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="70" y="36" font-size="12" fill="#1f2a44">staging</text>
  <text x="232" y="36" font-size="12" fill="#1f2a44">cutoff</text>
  <text x="120" y="146" font-size="12" fill="#1f2a44">the two "downs" differ by 13.6°</text>
</svg>
```
:::

::: context dispersions Thousands of make-believe launches
No two launches are identical. Engines run a fraction of a percent hot or cold, tanks hold a few kilograms more or less, winds differ, sensors drift. Engineers call these scatters **dispersions**.

To see whether a planned trajectory survives them, the offline team runs a **Monte Carlo** analysis: thousands of simulated flights, each with its own randomly drawn set of errors, all flown through the same pitch program and guidance software. They then check that, say, 99.7% of those flights stay inside the load limits and reach orbit. The name comes from the famous casino in Monaco, because the method runs on random numbers.
:::
