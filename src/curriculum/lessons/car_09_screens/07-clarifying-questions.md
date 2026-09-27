---
id: l07-clarifying-questions
title: "Clarifying questions before you answer"
minutes: 21
covers:
  - asking clarifying questions before answering
---

A stranger stops you on the street: "How do I get to the stadium?" Before you point, you ask one thing: "Are you walking or driving?" The walking route cuts through the park. The driving route goes around it on the highway. Both are right answers — to two different questions. Guess, and you may send someone the wrong way while sounding very sure.

Now a question from a technical phone screen:

*"How would you control the attitude of a launch vehicle?"*

(**Attitude** is which way the vehicle is pointing.) Notice how much is missing. Low down in thick air, or up where there is no air at all? Is the rocket stiff, or does it **[[bend like a long pole|bending-mode]]** at a speed near how fast the controller works? What steers: a **[[gimballed engine|gimbal]]**, thrusters, fins? What is measured, and how often? And what counts as success — accurate pointing, low structural loads, or saving propellant?

Each of those changes the answer. A candidate who starts at once has quietly picked an answer to all five. Often the interviewer had a specific case in mind and spends three minutes hearing a good answer to a different question.

The fix, which this curriculum's source material says interviewers explicitly value: ask **clarifying questions** — short questions that pin down what the problem actually is — before you answer. This lesson covers which ones, how many, how to ask them, and how to tell one from a stall.

## Why the question is missing pieces

A question that leaves out facts you need is called **underspecified**. There are two reasons interview questions arrive that way, and both matter.

**Real engineering problems arrive that way.** You get a requirement, a vehicle, a schedule, and a pile of undecided things. Spotting which unstated things matter is a big part of the job, so a question that copies that tests something real.

**Interviewers often leave gaps on purpose.** The gap *is* the test. A fully specified question tests whether you can carry out a method. An open one tests whether you know which assumptions matter — the difference between an engineer you can hand a problem to and one who needs a full specification.

So "what would you like me to assume?" is a better opening than it feels like. It does not admit you are lost. It shows you know the answer depends on something.

::: key
Ask clarifying questions before answering: is this a rigid body or a point mass, are we in an atmosphere, what sensors are available, what is the control authority. Interviewers explicitly value this. It is the difference between answering the question and answering a question.
:::

## The five axes

For almost any **GNC** (guidance, navigation and control) fundamentals question, the missing information falls along five lines, the five **axes**. You ask only about the one or two that would actually change your answer.

**Plant.** In control engineering the **plant** is the thing being controlled — here, the vehicle itself. Is it a **point mass** (a dot with mass, so only position matters) or a body that can also turn? Is it **rigid** (stiff) or **flexible** (it bends)? Is there **[[slosh|slosh]]** in the tanks, a moving payload, or a panel sticking out? Does its **inertia** (how hard it is to spin up) change much over the time you care about? This axis hides the biggest differences: a rigid-body answer and a flexible-body answer to the same question have almost nothing in common.

**Environment.** Atmosphere or vacuum? Does the gravity model matter over this time span? Which **disturbances** — outside pushes the controller must fight — are biggest: air on the body, sunlight pressure, gravity pulling slightly differently at each end, or an engine pushing a little off-center?

**Sensing.** What is measured, how often, how noisily? Is there a **bias** — a steady offset, like a scale that always reads two kilograms heavy — and does it drift? Do I have an absolute reference (which way I am pointing) or only rates (how fast I am turning)? Do measurements arrive all the time or in bursts?

**Actuation and authority.** **Actuators** push: engines, thrusters, wheels, fins. **Control authority** is how hard they can push. What maximum torque or force? How fast can it move (its **rate limit**) and respond (its **bandwidth**)? **Saturation** means the actuator is already pushing as hard as it can. Saturation changes the kind of problem, not only its size. So does a rate limit: a loop that is stable while the actuator moves freely can go unstable once it is swinging as fast as it can.

**Requirements.** How accurate must it be, over what time, and which failure actually matters? A pointing requirement and a load-relief requirement pull the same loop in opposite directions: pointing wants the rocket to hold its angle hard, while **load relief** wants it to give a little to the wind so the structure is not overloaded.

::: note These are the same questions you would ask in a design review
Whether slosh matters, or what the actuator's rate limit is, is what you would ask a colleague at a **design review** — a meeting where engineers check each other's work. The interview version is a short rehearsal of the real thing.
:::

## The test: would a different answer change what you say next?

The whole discipline in one line: **a clarifying question earns its place only if its two possible answers would lead you to say materially different things** — a different structure or method, not the same answer with another number.

Most questions a nervous candidate might ask [[fail this test|branch-test]]. "What is the mass of the vehicle?" usually fails: the structure you are about to describe — a control loop, an estimator — does not depend on the number. "Is this in an atmosphere?" usually passes. The answer decides whether air forces on the body exist at all. If they do, the controller's settings must change as the air's push changes — a **[[gain schedule|gain-schedule]]** against **[[dynamic pressure|dynamic-pressure]]**.

The test has a second, more useful form: **be ready to say what you would do in each case.** If you ask "rigid or flexible?", you should be able to add: "because if it is flexible I would want to know where the first bending mode sits compared with how fast I want the controller to respond." That clause turns a request into a demonstration: you have shown the fork in the road — most of what they wanted to see — before they answer.

::: warning Clarifying questions used as a stall are easy to spot
Experienced interviewers have often seen a candidate who does not know the answer ask four questions, each less relevant than the last. The signs: the questions connect to no fork in the answer, they come one at a time with pauses, and none is followed by "because". Two or three at the top, together, each with a reason, sounds like engineering. Six, dripped out, sounds like delay.
:::

## How many, and how to ask them

**Ask them at the top, together.** "Before I start, two things I would want to know." Then both. Dripping them out one at a time costs more than the answers save.

**One to three.** Rarely more. If you need five, say the answer splits many ways and offer to pick a case: *"This splits several ways — shall I take the case in the atmosphere and say what changes for the others at the end?"* That shows the branching without spending the call on it.

**Attach a reason to each.** The reason is what tells them about you.

**Then answer.** Lesson four gave each phone-screen answer a budget of roughly four to five minutes. The clarifying part should take twenty or thirty seconds of that, not two minutes.

## When the interviewer won't say

This is common, and not hostile. You will hear *"you tell me"*, or *"assume whatever you think is reasonable"*, or *"does it matter?"*

That last one deserves a real answer: whether it matters and why. *"It matters for sizing the actuator but not for the overall design, so I won't worry about it."*

For the others, the move is the entire point of the exercise: **choose, say the choice out loud, and carry on.**

> "Then I will take it as a rigid body with a gimballed engine, flying in the atmosphere, with an inertial measurement unit at a few hundred hertz and no outside attitude reference. I will point out where each of those assumptions is doing real work."

(An **[[inertial measurement unit|imu]]**, or IMU, said "I-M-U", is a box of motion sensors. **Hertz** (Hz) means "times per second".)

In one sentence you have turned an underspecified problem into a specified one, out loud. Everything after it can be judged fairly, and if the interviewer wanted a different case they will say so at once, at no cost to you.

This is move two from the previous lesson — state the frame and the assumptions — seen from the other side. The question brings the assumption into the open; if it is declined, you state it yourself.

::: key
If the interviewer declines to specify, choose, say the choice out loud, and proceed — flagging where each assumption does real work. The clarifying question and the stated assumption are two routes to the same place: an interviewer who knows which problem you are solving.
:::

## Two exchanges

::: example "How would you control the attitude of a launch vehicle?"
**Weak opening:** "Sure. So you would use a PID controller on each axis — proportional, integral and derivative — feeding back attitude error from the IMU into the engine gimbal. You would tune the gains to get good tracking and enough stability margin, and you would probably want some kind of filtering on the rate signal to keep noise out of the actuator…"

(A **PID** controller, said "P-I-D", reacts to the error, its running total, and its rate of change. The next lesson covers its simpler cousin, PD.)

**Strong opening:** "Two things before I start, because they change the answer a lot.

First, which phase — inside the atmosphere, or after the air is gone? I ask because in the atmosphere the aerodynamic moment is the biggest term and the whole design is about dynamic pressure, so the gains get scheduled against it. In vacuum that term is gone entirely and the vehicle behaves close to a **[[double integrator|double-integrator]]**.

Second, rigid body, or do I need to worry about the first bending mode? If it is rigid, I will talk about the rigid-body loop only. If not, then where that mode sits compared with the bandwidth I am aiming for drives the whole design, and the interesting part of the answer becomes the filter rather than the controller."

**Interviewer:** "In the atmosphere, and assume you do have a bending mode at around eight hertz."

**The answer that follows** is about a different problem from the one the weak opening walked into:

- gain scheduling against dynamic pressure;
- the rigid-body loop kept well below eight hertz;
- a **[[notch|notch-filter]]** filter or a low-pass filter on the rate signal, to keep the bending out of the loop;
- where the gyro sits. Depending on location, it sees the bending in step with the rigid-body motion or opposite to it. That decides whether the mode is kept stable by keeping its gain low (**gain-stabilized**) or by getting its timing right (**phase-stabilized**).

**What makes the difference.** The weak opening is fluent and textbook-correct for a generic attitude loop — which is what makes it dangerous. But within eight seconds it silently committed to a rigid body, a phase of flight and a design. If the interviewer wanted the bending mode, none of it lands.

The strong opening costs about twenty-five seconds. Both questions pass the test: each has two answers that lead somewhere materially different, and the candidate says where. The interviewer has seen the forks — a large part of the assessment — before the real answer starts.

**Sanity check:** twenty-five seconds is under a tenth of a four-to-five-minute budget — cheap insurance that the rest goes to the right problem.
:::

::: example "How would you estimate the vehicle's position?" — and the interviewer won't specify
**Candidate:** "One question first: do I have GNSS, and is it available all the time, or should I assume it is blocked or on and off? It matters because with steady GNSS this is mostly a matter of using it to correct the inertial sensors. Without it, the question becomes how fast the inertial solution drifts and what else I can pin it down with."

(**[[GNSS|gnss]]**, said "G-N-S-S", is satellite navigation such as GPS.)

**Interviewer:** "You tell me. Assume whatever you think is sensible."

**Weak response:** "Oh — okay. Um. I suppose we could assume we have GNSS, that is probably the normal case? Although I guess it depends on the vehicle. Maybe I should cover both? Sorry — what would be most useful for you?"

**Strong response:** "Then I will take the harder case, because it includes the easier one. Assume a tactical-grade inertial measurement unit at a few hundred hertz, GNSS available before launch and on and off afterward, and a barometric altitude sensor inside the atmosphere.

The design: an **[[error-state Kalman filter|error-state]]**. The inertial solution runs as the reference path, and the filter estimates its *errors* — position, velocity, attitude error, and the accelerometer and gyro biases — rather than the states themselves. The errors change slowly and nearly linearly even when the vehicle's motion does not, so the straight-line approximation the filter relies on actually holds.

What drives everything is how fast the pure inertial solution drifts between fixes. That sets how long an outage you can live with before the position uncertainty passes the requirement. If GNSS were fully blocked, I would look for another measurement to pin the drift — the terrain below, or a camera — rather than trying to improve the inertial solution.

The assumption doing the most work there is the **[[grade|imu-grade]]** of the inertial unit. With a navigation-grade unit the outage you can tolerate is far longer, and the whole trade changes."

**What makes the difference.** The weak response treats "you tell me" as a problem to solve by asking again. It offers to cover both cases — impossible to do well in four minutes — then hands the decision back again. About forty seconds pass with nothing said.

The strong response decides, says it is a decision, gives a reason, and answers. It also names the heaviest assumption and how the answer would move if it changed — showing the sensitivity without working the second case.

**Sanity check:** it ends on a thread the interviewer can pull ("what if it were navigation grade?") — right where you want the next question.
:::

## Check yourself

::: check
State the test for whether a clarifying question is worth asking, and apply it to two questions: "what is the vehicle's mass?" and "is there an atmosphere?"
:::

::: answer
The test is whether the two possible answers would lead you to say materially different things next.

"What is the vehicle's mass?" usually fails. You are about to describe a design — a loop structure, an estimator setup — that does not change with the number, so the answer would not send you anywhere new.

"Is there an atmosphere?" usually passes. It decides whether air forces on the body exist at all, and so whether you need gain scheduling against dynamic pressure. That is a difference in the structure of the answer, not only in a number.
:::

::: check
Why does attaching "because…" to each clarifying question change how it is received?
:::

::: answer
Because the reason is the part that tells the interviewer about you. A bare question only shows you noticed a gap. A question with its reason shows the fork: what you would say in each case, which is most of what they wanted to learn, before they answer.

It also separates a real clarification from a stall: a stalling question has no fork behind it, so it cannot be given a reason.
:::

::: check
An interviewer responds to your clarifying question with "assume whatever you think is reasonable." Give the structure of the correct response and say why asking again is a mistake.
:::

::: answer
Choose, say the choice out loud as a choice, give a one-line reason, and carry on — naming which assumption does the real work and how the answer would move if it changed.

Asking again is a mistake because the interviewer has just told you the specification is yours to make — part of the test. A second request hands the decision back, eats the time budget, and sounds unwilling to commit. It also wastes the chance the refusal gives you: picking the case you are strongest on.
:::

::: check
Explain the relationship between a clarifying question and the "state your assumptions" move from the previous lesson.
:::

::: answer
They are the same act from two directions, and both make sure the interviewer knows which problem you are solving. A clarifying question asks the other person to fix the missing condition. A stated assumption fixes it yourself and says so.

Which you use depends only on whether the interviewer will specify: ask first; if they decline, state the assumption and carry on. The failure is the same either way — leaving the condition unfixed and unmentioned, so a correct answer to a different problem gets judged as your answer to theirs.
:::

::: check
A candidate asks six clarifying questions, one at a time, with pauses between them, before beginning to answer. Describe how this reads and what it actually costs.
:::

::: answer
It reads as delay, not care. Experienced interviewers know the pattern: side questions, one by one, none tied to a fork in the answer.

The cost is real too. With roughly four to five minutes per answer, six dripped-out questions can eat more than half the budget, so even a strong answer afterward gets cut short.

The discipline is one to three questions, together at the top, each with its reason. If the problem splits more ways than that, say so and offer to take one case.
:::

::: check
Name the five axes along which a GNC question is typically underspecified, and give one example question on each.
:::

::: answer
- **Plant:** rigid body, or a flexible mode, slosh, or moving appendage?
- **Environment:** atmosphere or not, and which disturbances are biggest?
- **Sensing:** what is measured, how often, with what noise and bias?
- **Actuation and authority:** what actuators, with what saturation and rate limits?
- **Requirements:** what accuracy, over what time, and which failure matters?

You ask only about the one or two whose answers would change what you say next.
:::

## Summary

| Axis | The question | Why it changes the answer |
| --- | --- | --- |
| Plant | Rigid, flexible, slosh, inertia? | Flexible and rigid answers share almost nothing |
| Environment | Atmosphere or vacuum; biggest disturbance? | Decides whether gain scheduling on dynamic pressure exists |
| Sensing | What, how often, what noise and bias? | Sets whether the hard part is estimation or control |
| Authority | Torque, force, saturation, rate limits? | Saturation changes the kind of problem |
| Requirements | Accuracy, time span, which failure matters? | Different requirements pull the same loop opposite ways |

The next three lessons turn to the technical topics this module's source reports on GNC phone screens, starting with PD control, where the five moves and the clarifying habit get a full workout on a question with an exact answer.

::: context bending-mode A rocket is a long, thin pole
A rocket is many times taller than it is wide, so it is not perfectly stiff. Push on it and it flexes, then wobbles back and forth at a natural speed, the way a diving board keeps bouncing after the diver leaves. The slowest of these wobble patterns is the **first bending mode**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="60" x2="330" y2="60" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M30,60 Q180,10 330,60" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M30,60 Q180,110 330,60" fill="none" stroke="#8fb8f0" stroke-width="3"/>
  <circle cx="30" cy="60" r="4" fill="#1f2a44"/>
  <circle cx="330" cy="60" r="4" fill="#1f2a44"/>
  <text x="30" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">engine</text>
  <text x="330" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">nose</text>
  <text x="180" y="26" font-size="11" text-anchor="middle" fill="#1d6fd1">bent one way</text>
  <text x="180" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">then the other</text>
  <text x="180" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">first bending mode: one smooth bow, swinging back and forth</text>
</svg>
```

If the controller reacts at speeds close to that wobble, it can pump energy into it, like pushing a swing at exactly the right moment. That is why "rigid or flexible?" is such a big question.
:::

::: context gimbal Steering with the engine
A **gimbal** is a pivot that lets something tilt. A **gimballed engine** is mounted on one, so actuators can tip the whole engine a few degrees. Tilting the thrust off the rocket's centerline pushes the tail sideways, which turns the nose. It is the same idea as steering a shopping cart by pushing its back end left or right. Most large launch vehicles, including Falcon 9's first stage, steer this way during powered flight.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="160" y="20" width="40" height="120" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="180,6 160,20 200,20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="160" y1="80" x2="200" y2="80" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="180" cy="142" r="4" fill="#1f2a44"/>
  <polygon points="180,142 150,164 162,176" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="156" y1="170" x2="136" y2="194" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="180" y1="142" x2="207" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="214,102 210,114 202,108" fill="#1d6fd1"/>
  <text x="226" y="112" font-size="11" fill="#1d6fd1">thrust pushes the</text>
  <text x="226" y="126" font-size="11" fill="#1d6fd1">tail to the right</text>
  <path d="M150,30 A40,40 0 0,0 120,60" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="118,64 116,52 126,56" fill="#1f2a44"/>
  <text x="20" y="40" font-size="11" fill="#1f2a44">so the nose</text>
  <text x="20" y="54" font-size="11" fill="#1f2a44">turns left</text>
  <text x="80" y="192" font-size="11" fill="#b4232c">exhaust</text>
  <text x="206" y="160" font-size="11" fill="#1f2a44">engine tilted on its gimbal</text>
  <text x="206" y="174" font-size="11" fill="#6c7a93">(tilt exaggerated)</text>
</svg>
```
:::

::: context slosh Propellant that won't sit still
A rocket's tanks hold tonnes of liquid. When the vehicle turns or speeds up, the liquid sloshes to one side and back, like water in a bathtub when you sit down quickly. That moving mass pushes back on the vehicle at its own rhythm, so the controller sees a disturbance that it partly caused itself. Tanks often carry **baffles** — rings or plates inside — to calm the slosh, and GNC engineers model what is left.
:::

::: context branch-test Picture the fork in the road
The test for a clarifying question is whether it opens a real fork. If both answers lead to the same thing you were going to say, the question is not worth the time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="110" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="37" font-size="11" text-anchor="middle" fill="#1f2a44">"Is there an</text>
  <text x="65" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">atmosphere?"</text>
  <line x1="120" y1="40" x2="190" y2="18" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="120" y1="40" x2="190" y2="62" stroke="#1d6fd1" stroke-width="2"/>
  <text x="196" y="22" font-size="11" fill="#1d6fd1">yes: schedule on air pressure</text>
  <text x="196" y="66" font-size="11" fill="#1d6fd1">no: double integrator</text>
  <rect x="10" y="105" width="110" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">"What is the</text>
  <text x="65" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">mass?"</text>
  <line x1="120" y1="125" x2="190" y2="125" stroke="#b4232c" stroke-width="2"/>
  <text x="196" y="122" font-size="11" fill="#b4232c">same design either way</text>
  <text x="196" y="138" font-size="11" fill="#b4232c">so skip it</text>
</svg>
```
:::

::: context gain-schedule Settings that change with conditions
A **gain** is how strongly a controller reacts to an error. A **gain schedule** is a table that changes those gains as flight conditions change. Think of a car's power steering, which feels light when parking and firmer on the highway: same wheel, different response depending on speed. A rocket climbing through the atmosphere sees the air forces rise, peak and fall away, so one fixed set of gains cannot be right the whole way up.
:::

::: context dynamic-pressure How hard the air is pushing
**Dynamic pressure**, written $q$, measures how hard the oncoming air pushes on a moving vehicle:

$$
q = \tfrac{1}{2}\rho v^2,
$$

where $\rho$ ("rho") is the air density and $v$ the speed. Going up, the rocket speeds up (so $q$ grows) while the air thins (so $q$ shrinks). The two effects cross at a peak called **max-Q**, a moment launch commentators often call out. Aerodynamic forces on the rocket grow with $q$, which is why gains get scheduled against it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="120" x2="30" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M30,120 C90,118 110,30 150,30 C200,30 230,110 330,118" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="150" y1="30" x2="150" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="158" y="26" font-size="12" fill="#b4232c">max-Q</text>
  <text x="38" y="24" font-size="12" fill="#1f2a44">q</text>
  <text x="340" y="138" font-size="11" text-anchor="end" fill="#1f2a44">time after launch</text>
  <text x="70" y="104" font-size="11" fill="#6c7a93">faster</text>
  <text x="240" y="84" font-size="11" fill="#6c7a93">air too thin</text>
</svg>
```
:::

::: context imu The box of motion sensors
An **inertial measurement unit** holds **accelerometers**, which sense how the vehicle speeds up or slows down, and **gyroscopes** ("gyros"), which sense how fast it is turning. "Inertial" means it works by feeling motion from the inside, with no outside signal needed. Your phone has a tiny one; that is how it knows to rotate the screen. A rocket's is far more accurate, and far more expensive.
:::

::: context double-integrator Push, speed, position
With no air and no gravity gradient to worry about, turning a rigid spacecraft is simple physics. Torque causes angular acceleration. Add that up over time (integrate once) and you get turning rate. Add up the rate (integrate twice) and you get angle. Two integrations in a row: a **double integrator**. It is the cleanest control problem there is, and it is exactly where the next lesson starts its PD-control answer.
:::

::: context notch-filter Cutting out one note
A **filter** removes parts of a signal. A **low-pass** filter keeps slow changes and removes fast ones. A **notch** filter cuts out one narrow band of frequencies and leaves the rest alone — like turning down one annoying hum on a music equalizer. Put a notch at the bending frequency on the gyro signal, and the controller stops reacting to the wobble. Lesson nine explains why every filter also adds a small delay the loop must pay for.
:::

::: context gnss More than GPS
**GNSS** stands for Global Navigation Satellite System, the general name for satellite navigation. GPS is the American system. Others include Europe's Galileo, Russia's GLONASS and China's BeiDou. A receiver times radio signals from several satellites to work out where it is. GNSS can be blocked, jammed or lost during some phases of flight, which is why the question "do I have it all the time?" matters so much.
:::

::: context error-state Estimating the mistakes instead of the motion
An **error-state** filter does not try to estimate where the vehicle is directly. The IMU's own calculation already gives a fast, smooth guess. The filter's job is to estimate how wrong that guess is — its errors in position, velocity and pointing, plus the sensor biases — and subtract them. Errors grow slowly and gently, so they are much easier to model than a rocket's actual flight. You will build this in the navigation part of the course.
:::

::: context imu-grade Grades of inertial unit
Inertial units are sold in rough grades, sorted by how fast their errors pile up. **Consumer** grade (phones) drifts quickly. **Tactical** grade is good enough for short flights. **Navigation** grade drifts far more slowly and costs far more. The exact numbers vary by maker and model, so in an interview name the grade and the trade rather than quoting a figure you cannot back up.
:::
