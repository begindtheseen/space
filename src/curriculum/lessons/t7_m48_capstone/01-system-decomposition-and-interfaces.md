---
id: l01-system-decomposition-and-interfaces
title: System decomposition and interface contracts
minutes: 20
covers:
  - System decomposition and the interface contracts between navigation, guidance, control and the vehicle
---

Think of a relay race. Four runners, each one fast and well trained. The race is still often lost at the handoff — the baton comes a step early, or the next runner starts a step late. Nobody ran badly. The two runners simply had different ideas of where the handoff would happen.

Every module before this one taught you one runner: a filter, a guidance law, a controller, a mode logic. Each was checked against its own careful test. This module is about the handoffs. Here a correct filter, a correct guidance law and a correct controller are wired together and have to fly as one system. That wiring is where many real flight problems live. A unit test can only check a module against the input it was *told* to expect. An integration failure is almost always a case where what one module really sent differs from what the next module assumed it would get.

This first lesson draws the lines before anything else happens. You will use one vehicle for the whole module: a reusable first-stage booster in its **[[propulsive landing|propulsive-landing]]** burn — the rocket slowing itself with its own engine to touch down on a pad. In this phase navigation, guidance, control, mode management and fault response all run at once, and all of them matter. We fix the vehicle's numbers once, here, so every later lesson can use them. Then we name the four software modules a landing stack splits into, and say exactly what crosses each boundary between them. That means not only the kind of data, but its units, its rate, and — the part a diagram never shows — what the receiving module is allowed to *assume* about how fresh and how correct the data is. Every failure in the rest of this module is a broken assumption at one of these boundaries. You cannot see it break until you have written it down.

## The reference vehicle

The vehicle is a reusable booster coming back to a landing site. Before this module starts, it has already separated from the upper stage, flown a boostback burn to turn around, and fired an entry burn to survive the thick air. The ascent-guidance and entry-descent-landing modules covered those phases, and this module does not teach them again.

What this module owns is the landing burn: roughly the last thirty seconds. In that window a navigation filter, a guidance law that is re-solved again and again, and an attitude controller all have to work together. They must bring the vehicle down softly, on target, using a single engine that can **throttle** — turn its thrust up and down.

::: key The reference vehicle, fixed for the whole module
Landing-burn ignition: mass $m_0 = 31{,}600\,\mathrm{kg}$ ($25{,}600\,\mathrm{kg}$ dry, $6{,}000\,\mathrm{kg}$ landing propellant), altitude $h_0=2000\,\mathrm m$, vertical velocity $v_{z,0}=-220\,\mathrm{m/s}$, downrange velocity $v_{x,0}=70\,\mathrm{m/s}$ to be nulled. Single engine, thrust $T=900\,\mathrm{kN}$, **[[specific impulse|isp]]** $I_{sp}=283\,\mathrm s$, throttleable over $40\%$ to $100\%$ of rated thrust — it **[[cannot throttle to zero|throttle-floor]]**. Target: touchdown at the pad, vertical speed $-2.5\,\mathrm{m/s}$, zero lateral velocity.
:::

A few words on reading this. $m_0$ is read "m nought" or "m zero" — the mass at the start. $v_{z,0}$ is "v z zero", the up-down speed at the start; the minus sign means *down*. $v_{x,0}$ is the sideways, **downrange** speed — along the ground track, toward or away from the pad. "Nulled" means brought to zero.

A quick sense of size. At full thrust the engine can push $900{,}000 / 31{,}600 \approx 28.5\,\mathrm{m/s^2}$ on the full vehicle, nearly three times gravity. To stop a $220\,\mathrm{m/s}$ fall in $2000\,\mathrm m$ you need to take off about $220^2/(2 \times 2000) \approx 12.1\,\mathrm{m/s^2}$ *on top of* holding up against gravity. So the engine has enough push, but not a huge amount to spare.

Every number in later lessons — filter covariances, control margins, Monte Carlo miss distances — is computed for this vehicle by running an actual simulation. Nothing is just asserted. You can recompute any of them.

## Four software modules, one job each

Go back to the simulation module. Its **[[five-box architecture|five-box]]** split a simulation into plant, environment, sensors, GNC and actuators. One of its rules was that the GNC box never reads plant truth directly. Wherever practical, that box *is* the real flight code.

Now open the GNC box. Inside, a landing stack splits into four cooperating pieces. Each has one job and one kind of output. Think of a restaurant kitchen: one person takes stock of what is in the fridge, one plans the menu, one cooks, and a manager decides which of them is working on what right now.

**Navigation** owns the vehicle's best guess of its own **state** — where it is, how fast it is going, which way it is pointing. More precisely: position, velocity, **attitude** (the direction the vehicle points), and the **sensor biases** (steady offsets) that distort the raw measurements. It also carries a **[[covariance|covariance]]** — a statement of how much to trust each part of that guess. Navigation reads sensors and nothing else. It writes an estimate and nothing else. It does not decide what the vehicle should do about that estimate.

**Guidance** owns the path the vehicle is trying to fly. It produces a target position, velocity and thrust direction, re-solved every so often from the current estimated state toward the touchdown target. It reads the navigation estimate and the active mode. It writes a commanded trajectory or a commanded acceleration. It does *not* write an actuator command. And it makes no claim about how fast the real vehicle can turn to follow it.

**Control** owns the actuator commands: how far to swing the engine (the **gimbal** deflection) and how much thrust to ask for (the throttle setting). It reads the commanded trajectory from guidance and the attitude and turn-rate estimate from navigation. Of the four, it is the only one that has to square a plan with the vehicle's real, physically limited ability to follow it.

**Mode management** owns which of the other three is allowed to act, and how. It reads a status report from each: a filter-consistency flag from navigation, a solved-or-missed flag from guidance, a saturation flag from control. It writes the active mode, and the logic that switches guidance laws and control gains at each boundary between prelaunch, ascent, coast, entry, landing and safe.

Nothing here is new physics. It is the same rule the five-box architecture already enforced — GNC never reads plant truth, and the plant never receives a command directly — applied one level further in, inside GNC's own box. Each of the four pieces may read only what a *different* piece actually wrote. It may never grab a value that happens to be lying around inside another piece.

## What actually crosses each boundary

Picture an arrow on a block diagram, from navigation to guidance, labeled "state estimate". It tells you almost nothing. Is position in meters or feet? Is it the vehicle's position now, or a tenth of a second ago? How often does a new one appear, and what does guidance see in between?

An **[[interface contract|contract-word]]** is the written agreement that answers those questions. It must pin down four things about each arrow, not one.

::: key An interface contract, in full
**What**: the exact quantity and its representation (a **[[quaternion|quaternion]]**, not "attitude"; a $3\times3$ covariance block, not "uncertainty"). **Units**: SI, stated, never inferred from context. **Rate**: how often a fresh value appears, and what the receiver sees between fresh values. **Assumption**: what the receiving module is entitled to believe about the data's age and correlation structure — and this is the piece a diagram never draws, and the piece every later lesson in this module finds violated somewhere.
:::

"Correlation structure" means whether this cycle's error is tied to last cycle's error. An error that repeats from one cycle to the next behaves very differently from one that is fresh and random each time. Lesson 4 shows exactly how differently.

Here are the four contracts for the landing burn. In the table, $\theta_{\mathrm{cmd}}$ is read "theta command", the thrust-pointing angle guidance asks for. $\delta_{\mathrm{cmd}}$ is "delta command", the gimbal deflection control asks for. A **[[time-to-go|time-to-go]]** estimate is how many seconds remain until touchdown.

::: example The four interfaces of the landing burn, written out in full
| Interface | What crosses it | Units | Rate | Assumption the receiver makes |
| --- | --- | --- | --- | --- |
| Navigation $\to$ Guidance | position $\mathbf r$, velocity $\mathbf v$, and a scalar time-to-go estimate | m, m/s, s | fresh value every guidance cycle, $0.6\,\mathrm s$ | the estimate is the vehicle's *current* state, with no lag and no correlation to the previous cycle's estimate |
| Guidance $\to$ Control | commanded thrust-pointing angle $\theta_{\mathrm{cmd}}$ and throttle fraction | rad, dimensionless | held fixed for $0.6\,\mathrm s$ between re-solves | the commanded angle is one the vehicle can reach well within one guidance cycle |
| Control $\to$ Vehicle (actuators) | gimbal deflection command $\delta_{\mathrm{cmd}}$, throttle command | rad, dimensionless | every control tick, $10\,\mathrm{ms}$ | the actuator will deliver close to what was asked, subject only to its own documented limits |
| Navigation, Guidance, Control $\to$ Mode manager | a filter-consistency flag, a solved/missed flag, a saturation flag | boolean each | every control tick | each flag reflects the *current* cycle, not a stale one |

Read the rows one at a time. Row one: navigation hands guidance a fresh position and velocity every $0.6\,\mathrm s$, and guidance treats it as exact and current. Row two: guidance hands control a pointing angle and a throttle level, and holds them steady for $0.6\,\mathrm s$ — so control sees the same command for $60$ of its own $10\,\mathrm{ms}$ ticks in a row. Row three: control sends the engine a new command every $10\,\mathrm{ms}$. Row four: every module sends the mode manager a yes-or-no flag every tick.

Four rows, four assumptions. Four of this module's later lessons are each built around one of these assumptions turning out to be false in a specific, measurable way.
:::

Notice what the table does *not* say. It does not say guidance's position input is exact. It says only that guidance is *entitled to treat it* as the vehicle's current state. That is all a contract of this shape can promise. Whether it is a safe promise to build a guidance law on depends on the navigation filter's own error behavior. The next lesson — the error budget — exists to answer that with a number instead of a hope.

::: example One cycle, traced through all four modules
Follow one lap around the loop, starting at landing-burn ignition. Positions are written (downrange, altitude).

**Navigation.** It reports $\mathbf r \approx (-450, 2000)\,\mathrm m$ and $\mathbf v \approx (70, -220)\,\mathrm{m/s}$. So the vehicle is $450\,\mathrm m$ short of the pad, $2000\,\mathrm m$ up, drifting toward the pad at $70\,\mathrm{m/s}$ and falling at $220\,\mathrm{m/s}$.

**Guidance.** Solving from that estimate toward the pad, with $24\,\mathrm s$ of time-to-go, it returns a commanded thrust acceleration of $26.75\,\mathrm{m/s^2}$, pointed $15.12^\circ$ from vertical. Sanity check: $26.75\,\mathrm{m/s^2}$ times $31{,}600\,\mathrm{kg}$ is about $845\,\mathrm{kN}$, which is $94\%$ of the $900\,\mathrm{kN}$ engine. That is inside the $40\%$ to $100\%$ throttle range, as it has to be.

**Control.** It turns that pointing angle into a torque demand and commands a gimbal deflection. For the first fraction of a second it hits the actuator's $5^\circ$ limit hard — it is **[[saturated|saturation]]**. The vehicle starts out pointing straight up, and $15.12^\circ$ is a big turn to ask for all at once. Later lessons in this module build this handoff out in full, with real numbers for what the saturation costs.

**Vehicle.** The actuators deliver whatever the gimbal and throttle can really do, not the raw command. The vehicle moves.

**Back to navigation.** It senses that motion through the **IMU** (the inertial measurement unit — gyroscopes and accelerometers), **GNSS** (satellite positioning, such as GPS) and the **radar altimeter** (which bounces radio waves off the ground to measure height). From those it builds the *next* estimate.

That is one lap. At one lap per $0.6\,\mathrm s$ guidance cycle, the $24\,\mathrm s$ burn is $24 / 0.6 = 40$ laps, and $2400$ control ticks.
:::

::: warning A module that reads another's internals has created an interface nobody documented
In the middle of debugging it is tempting to let the controller peek at a variable inside the navigation filter that is not part of its declared output — an intermediate covariance term, a raw sensor residual. It is right there, and using it saves a recomputation. But now there is a real dependency between two modules that the interface table does not, and cannot, record. The next person who changes navigation's insides has no way to know control relies on one of them. The failure that follows is invisible in every test of the documented interface, because the documented interface never changed.
:::

::: warning An unstated assumption is not a safe default; it is a coin flip
When the assumption column is left blank, both sides fill it in on their own — and there is no reason they will fill it in the same way. A guidance engineer building the re-solve loop reasonably assumes the navigation estimate is from this cycle. A navigation engineer short on computing time reasonably ships an estimate that is one cycle stale on its busiest input. Both made a defensible choice. Neither wrote it down. The two choices do [[not agree|ariane-501]].
:::

## Check yourself

::: check
Name the four software modules this lesson splits a landing GNC stack into, and say in one phrase what each one is not allowed to do.
:::

::: answer
- **Navigation** estimates the state. It does not decide what to do about it.
- **Guidance** computes a reference trajectory or commanded acceleration. It does not command an actuator directly.
- **Control** commands the actuators to track guidance's reference. It does not choose the reference itself.
- **Mode management** chooses which mode and which law is active. It does not compute a trajectory or a state estimate itself — it only reads status flags from the other three and switches between them.
:::

::: check
The interface table has "rate" and "assumption" as two separate columns. Give a concrete case where two interfaces could have exactly the same rate but different assumptions, and explain why that difference matters.
:::

::: answer
Imagine guidance's output were re-sent to control on every $10\,\mathrm{ms}$ tick, the same rate as control's commands to the actuators. The two interfaces would then share a rate, but not an assumption.

- Guidance's commanded angle carries the assumption "reachable within one cycle".
- A raw actuator command carries no such assumption. The actuator is expected to do its physical best with whatever it gets, reachable or not.

So the same rate can allow completely different behavior from the receiver. One receiver assumes the command is feasible and would be wrong to receive an infeasible one. The other assumes nothing about feasibility and is built specifically to absorb one.
:::

::: check
A vehicle's guidance module is changed to re-solve twice as often, from every $0.6\,\mathrm s$ to every $0.3\,\mathrm s$, with no other change anywhere in the stack. Using only the interface table, which other module's documented assumption is now most directly at risk, and why?
:::

::: answer
Control's. It relies on guidance's commanded angle being "one the vehicle can reach well within one guidance cycle".

Halving the cycle halves the time control has to reach a commanded turn before the *next* command arrives. But it does nothing to the vehicle's physical ability to turn. The data type, the units and the rate column are all still satisfied. Only the feasibility assumption under the rate has quietly become harder to keep. An interface table catches exactly this kind of change; a data-type check does not.
:::

::: check
Why does this lesson insist that navigation reads sensors "and nothing else", when in a real flight computer the navigation code and the guidance code often run in the same process, with every variable in the same **[[address space|address-space]]**?
:::

::: answer
Sharing memory is a fact about how the flight computer is built. It is not permission to ignore the module boundary.

The rule "navigation reads sensors and nothing else" is about which *data dependencies the design is allowed to have*. That holds whether or not the hardware makes an illegal dependency easy to write by accident.

The five-box rule that GNC never reads plant truth is enforced for the same reason. In a simulation, the plant's true state sits in ordinary memory the whole time, readable by anyone. The boundary says what a module is *entitled* to depend on, not what the hardware or the language makes reachable.
:::

::: check
In the traced cycle, the commanded gimbal deflection saturates hard in the first fraction of a second after ignition. Using only this lesson's interface table — not the numbers a later lesson computes — which single assumption in the table is that saturation evidence against?
:::

::: answer
The guidance-to-control assumption: "the commanded angle is one the vehicle can reach well within one guidance cycle."

A command that immediately pins the actuator at its limit is, by definition, one the vehicle cannot follow right away. So whatever guidance's model assumed about how fast the vehicle can turn was too hopeful compared with what the actuator can really deliver. A later lesson in this module measures exactly this mismatch, in degrees per second and in the trajectory error it causes.
:::

## Summary

| Module | Reads | Writes | Never does |
| --- | --- | --- | --- |
| Navigation | sensors (IMU, GNSS, radar altimeter) | state estimate + covariance | decide vehicle action |
| Guidance | nav estimate, active mode | reference trajectory / commanded acceleration | command an actuator directly |
| Control | guidance reference, nav attitude/rate | actuator commands (gimbal, throttle) | choose the reference itself |
| Mode manager | status flags from all three | active mode, transition logic | compute a trajectory or estimate |
| Interface contract, four parts | — | what, units, rate, assumption | leave the assumption unstated |

This lesson fixed the vehicle and the four boundaries every later lesson lives on. The next lesson takes the landing-accuracy requirement those boundaries exist to meet and turns it into a number for each piece — an error budget, set before any of the stack is verified, so that "how good does each piece have to be?" has an answer before the campaign that checks it ever runs.

::: context propulsive-landing Landing on an engine
For most of spaceflight history, a used booster fell into the ocean. Landing it on its own engine — so it can fly again — was first done by an orbital-class booster in December 2015, when a Falcon 9 first stage came back to Cape Canaveral. Since then boosters have landed hundreds of times, on land pads and on ships at sea.

The landing burn is the hardest few seconds of the flight for GNC. There is no second try, the ground is close, and every piece of the stack is working at once. That is why this module uses it as the test of the whole stack.
:::

::: context isp Specific impulse, in one line
**Specific impulse**, $I_{sp}$, measures how much push an engine gets from each kilogram of propellant. It is measured in seconds. It links thrust to propellant flow: $\dot m = T/(I_{sp}\,g_0)$, where $\dot m$ ("m dot") is kilograms burned per second and $g_0 = 9.80665\,\mathrm{m/s^2}$.

For this vehicle, $\dot m = 900{,}000/(283 \times 9.80665) \approx 324\,\mathrm{kg/s}$. The $6000\,\mathrm{kg}$ of landing propellant would last only about $18.5\,\mathrm s$ at full thrust. Since the burn runs about $24\,\mathrm s$, the engine must spend much of it below full throttle. Lesson 3 uses this same $324\,\mathrm{kg/s}$ to check how fast the vehicle's mass changes.
:::

::: context throttle-floor Why it cannot hover
Rocket engines usually cannot throttle very low: the combustion becomes unstable. This engine's floor is $40\%$, or $360\,\mathrm{kN}$.

Near touchdown the vehicle is almost empty, about $25{,}600\,\mathrm{kg}$, so its weight is $25{,}600 \times 9.80665 \approx 251\,\mathrm{kN}$. Even at the lowest throttle, thrust is about $1.43$ times the weight. The vehicle cannot hover. If it hovers too long, it goes back *up*.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="11" fill="#1f2a44">force, kN (same scale for all bars)</text>
  <rect x="20" y="28" width="288" height="22" fill="#1d6fd1"/>
  <text x="26" y="43" font-size="11" fill="#fff">thrust at 40% throttle: 360</text>
  <rect x="20" y="60" width="248" height="22" fill="#8fb8f0"/>
  <text x="26" y="75" font-size="11" fill="#1f2a44">weight at ignition: 310</text>
  <rect x="20" y="92" width="201" height="22" fill="#f2b880"/>
  <text x="26" y="107" font-size="11" fill="#1f2a44">weight near empty: 251</text>
</svg>
```

So the burn has to be timed so that speed reaches zero at the moment height reaches zero — sometimes called a "hoverslam". There is no pause to correct a mistake at the bottom. That is part of why guidance keeps re-solving all the way down.
:::

::: context five-box The five boxes, from the simulation module
The simulation module split a closed-loop simulation into five boxes. The whole of this module lives inside the GNC box, which sees the world only through the sensors and touches it only through the actuators.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="10" width="100" height="34" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">Environment</text>
  <rect x="130" y="68" width="100" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="90" font-size="12" text-anchor="middle" fill="#1f2a44">Plant (truth)</text>
  <rect x="10" y="126" width="90" height="34" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">Sensors</text>
  <rect x="135" y="126" width="90" height="34" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">GNC</text>
  <rect x="260" y="126" width="90" height="34" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">Actuators</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="180" y1="44" x2="180" y2="66"/>
    <line x1="130" y1="95" x2="60" y2="124"/>
    <line x1="100" y1="143" x2="133" y2="143"/>
    <line x1="225" y1="143" x2="258" y2="143"/>
    <line x1="300" y1="124" x2="230" y2="95"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="180,68 176,60 184,60"/>
    <polygon points="60,124 65.9,117.2 68.9,124.6"/>
    <polygon points="135,143 127,139 127,147"/>
    <polygon points="260,143 252,139 252,147"/>
    <polygon points="230,95 238.9,94.4 235.9,101.8"/>
  </g>
</svg>
```

Truth flows down into the sensors; commands flow out through the actuators; nothing crosses from the plant straight into GNC.
:::

::: context covariance How sure the estimate is
A navigation filter gives two things: a best guess, and a measure of how uncertain that guess is. The **covariance** is that measure. Its diagonal holds the square of the expected error in each quantity — for position, a value of $4\,\mathrm{m^2}$ means an error of about $2\,\mathrm m$ is typical. Its off-diagonal entries say which errors tend to move together.

Every user of the estimate leans on the covariance, not only the guess. A filter that reports too small a covariance — too confident — misleads everything downstream. Lessons 4 and 8 come back to this.
:::

::: context contract-word Why "contract"
In ordinary life a contract says what each side promises and what each side may expect. Software engineers borrowed the word for the same idea between two pieces of code.

The most famous broken interface contract in spaceflight is the Mars Climate Orbiter, lost in 1999. One team's ground software produced thruster impulse in pound-force seconds; the navigation software that used it expected newton-seconds. Each piece worked as written. The units column of the contract was never enforced, and the spacecraft flew too deep into the Martian atmosphere. That is why this lesson says "SI, stated, never inferred."
:::

::: context quaternion Four numbers for a direction
A **quaternion** is a set of four numbers that describes how a body is rotated — which way it points and how it is rolled. It avoids the "gimbal lock" trouble of three angles. A rotation really has only three degrees of freedom, so the four numbers must obey one rule: the sum of their squares is $1$.

Saying "attitude" in a contract is not enough. Two teams can store quaternions in different orders or rotate in opposite senses. The contract must say which.
:::

::: context time-to-go The countdown guidance uses
**Time-to-go**, written $t_{go}$, is how many seconds guidance thinks are left until touchdown. Guidance plans the rest of the trajectory over that window, so it shrinks as the burn goes on.

It matters a lot near the end. Many guidance formulas divide by $t_{go}$ or by $t_{go}^2$. As $t_{go}$ heads toward zero those terms grow without limit, which is why real flight code keeps $t_{go}$ above a small floor. Lesson 5 shows this in the closed-form fallback law.
:::

::: context saturation When the actuator hits its stop
An actuator has a hard limit. Here the engine can swing at most $5^\circ$. If control asks for more, the actuator delivers $5^\circ$ and no more. That is **saturation**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340" y="148" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
  <text x="46" y="22" font-size="11" fill="#1f2a44">gimbal angle</text>
  <line x1="40" y1="70" x2="340" y2="70" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="36" y="74" font-size="11" text-anchor="end" fill="#6c7a93">5°</text>
  <path d="M40,130 L70,30 C110,30 150,50 180,70 C210,90 280,126 340,128" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <path d="M40,130 L58,70 L180,70 C210,90 280,126 340,128" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <text x="120" y="42" font-size="11" fill="#b4232c">asked for</text>
  <text x="95" y="88" font-size="11" fill="#1d6fd1">delivered (clipped)</text>
</svg>
```

While the actuator sits on its stop, the loop is no longer the linear system its margins were computed for. Lesson 6 shows what that costs. (Sketch: shapes are illustrative, not simulated.)
:::

::: context ariane-501 A real case of two assumptions
In June 1996 the first Ariane 5 broke up about 40 seconds after launch. Its inertial reference software was reused from Ariane 4. Deep inside, a value tied to horizontal velocity was converted to a 16-bit integer, on the assumption — true for Ariane 4's gentler trajectory — that it would always fit. Ariane 5 was faster sideways, the value overflowed, and both inertial units shut down.

The code met its old specification. The assumption it depended on was never written into the new vehicle's interface, so nobody checked it.
:::

::: context address-space Same memory, separate modules
A program's **address space** is all the memory it can reach. If navigation and guidance run in one program, guidance *could* read any navigation variable by name. The language will not stop it.

That is why the boundary has to be a design rule and a review habit, not a hope. Some teams back it up in code — making internal variables private, or passing data only through a fixed message structure — so an illegal read will not even compile.
:::
