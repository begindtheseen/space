---
id: l07-clarifying-questions
title: "Clarifying questions before you answer"
minutes: 21
covers:
  - asking clarifying questions before answering
---

*"How would you control the attitude of a launch vehicle?"*

Read that question again and notice how much of it is missing. Which phase of flight — the dense part of the atmosphere, where aerodynamic moments dominate, or on-orbit, where there is no air at all? Rigid body, or does the first bending mode sit near the control bandwidth? What actuators: a gimballed engine, reaction control thrusters, aerodynamic surfaces, some combination? What are you measuring, and how often? What counts as success — pointing accuracy, load relief, propellant consumption?

Every one of those changes the answer, several of them completely. A candidate who begins answering immediately has therefore chosen answers to all five without saying so, and will be assessed on whichever problem they happened to pick. Sometimes that lands. More often the interviewer, who had a specific case in mind, spends three minutes listening to a competent answer to a different question.

The remedy is one of the most reliably valuable habits in this whole module, and this curriculum's source material says interviewers explicitly value it: ask clarifying questions before you answer. This lesson is about which ones, how many, how to ask them, and — the part that separates the habit from a tic — how to tell a clarifying question from a stall.

## Why the question is underspecified

Two reasons, and both matter for how you should respond.

The first is that real engineering problems arrive underspecified. Nobody hands you a complete problem statement; you get a requirement, a vehicle, a schedule, and a set of things nobody has decided yet. Working out which of the unstated things are load-bearing is a large fraction of the actual job, so a question that reproduces that condition is testing something real.

The second is that interviewers often leave a question open **on purpose**, because the gap is the test. A fully specified question tests whether you can execute. An open one tests whether you know which assumptions matter — and that is the thing that distinguishes an engineer who can be handed a problem from one who has to be handed a specification.

This is why "what would you like me to assume?" is a better opening move than it feels like. It is not an admission that you do not know; it is a demonstration that you know the answer depends on something.

::: key
Ask clarifying questions before answering: is this a rigid body or a point mass, are we in an atmosphere, what sensors are available, what is the control authority. Interviewers explicitly value this. It is the difference between answering the question and answering a question.
:::

## The five axes

For almost any GNC fundamentals question, the unstated information falls on five axes. You do not ask about all five — you ask about the one or two that would actually change your answer.

**Plant.** Point mass or extended body? Rigid or flexible? Is there propellant slosh, a moving payload, a deployed appendage? Does the inertia change significantly over the timescale in question? This axis is where the biggest differences hide: a rigid-body answer and a flexible-body answer to the same question have almost nothing in common.

**Environment.** Atmosphere or vacuum? Which gravity model, and does it matter over this timescale? What disturbances dominate — aerodynamic moments, solar pressure, gravity gradient, a thrust misalignment?

**Sensing.** What am I measuring, at what rate, with what noise and what bias behaviour? Is there an absolute reference or only rates? Is the measurement available continuously or in bursts?

**Actuation and authority.** What actuators, what maximum torque or force, what rate limits, what bandwidth? Saturation changes the design problem qualitatively rather than quantitatively, and so does a rate limit — a loop that is fine in its linear range can be unstable once the actuator slews at its limit.

**Requirements.** What accuracy, over what timescale, and what failure actually matters? A pointing requirement and a load-relief requirement pull the same loop in different directions.

::: note These are the same axes you would raise in a design review
That is not a coincidence, and it is part of why the habit reads well. Asking whether slosh matters, or what the actuator's rate limit is, is the same question you would ask a colleague presenting a control design. The interview version is a compressed rehearsal of the thing itself.
:::

## The test: would a different answer change what you say next?

This is the whole discipline in one line. **A clarifying question earns its place only if the two possible answers would lead you to say materially different things.**

Apply it and most candidate questions fail. "What is the mass of the vehicle?" usually fails, because you are about to describe a structure — a control architecture, an estimator — that does not depend on the number. "Is this in an atmosphere?" usually passes, because the answer determines whether aerodynamic moments exist at all and therefore whether you need a gain schedule against dynamic pressure.

The test has a second, more useful form: **be ready to say what you would do in each case.** If you ask "rigid or flexible?" you should be able to follow with "because if it is flexible I would want to know where the first mode is relative to the bandwidth I am aiming at." Adding that clause turns the question from a request into a demonstration — you have shown the interviewer the branch point, which is most of what they wanted to see, before they have even answered.

::: warning Clarifying questions used as a stall are visible
A candidate who does not know the answer and asks four increasingly peripheral questions is doing something an experienced interviewer has seen many times. The signs are recognisable: the questions do not connect to a branch in the answer, they arrive one at a time with pauses, and none of them is followed by "because". Two or three questions at the top, batched, each with a reason attached, reads as engineering. Six, dripped out, reads as delay.
:::

## How many, and how to ask them

**Ask them at the top, batched.** "Before I start, two things I would want to know." Then both. Dripping them out one at a time fragments the conversation and costs more time than the answers save.

**One to three.** Rarely more. If you find yourself needing five, the honest move is to say that the answer branches a lot and offer to pick a case: *"This splits several ways — shall I take the atmospheric-flight case and say what changes for the others at the end?"* That is often the strongest thing you can say, because it demonstrates the branching without spending the call on it.

**Attach a reason to each.** The reason is the part that carries information about you.

**Then answer.** The clarifying phase should take twenty or thirty seconds out of a four-minute answer, not two minutes.

## When the interviewer refuses to specify

This happens often, and it is not hostility. You will hear *"you tell me"*, or *"assume whatever you think is reasonable"*, or *"does it matter?"*

That last one is a real question and deserves a real answer: say whether it matters and why. *"It matters for the actuator sizing but not for the architecture, so I will not worry about it."*

For the others, the move is the same and it is the entire point of the exercise: **choose, state the choice out loud, and proceed.**

> "Then I will take it as a rigid body with a gimballed engine, in atmospheric flight, with an inertial measurement unit at a few hundred hertz and no external attitude reference. I will flag where each of those assumptions is doing real work."

You have now converted an underspecified problem into a specified one, on the record, in one sentence. Everything after it is assessable, and if the interviewer wanted a different case they will say so immediately, which costs you nothing. Notice that this is the second of the five moves from the previous lesson — stating assumptions — and that the clarifying question and the stated assumption are the same act approached from two sides. The question surfaces the assumption; if the question is declined, you state it yourself.

::: key
If the interviewer declines to specify, choose, say the choice out loud, and proceed — flagging where each assumption does real work. The clarifying question and the stated assumption are two routes to the same place: an interviewer who knows which problem you are solving.
:::

## Two exchanges

::: example "How would you control the attitude of a launch vehicle?"
**Weak opening:** "Sure. So you would use a PID controller on each axis — proportional, integral and derivative — feeding back attitude error from the IMU into the engine gimbal. You would tune the gains to get good tracking and enough stability margin, and you would probably want some kind of filtering on the rate signal to keep noise out of the actuator…"

**Strong opening:** "Two things before I start, because they change the answer quite a lot.

First, which phase — inside the atmosphere or after the air is gone? I ask because in atmospheric flight the aerodynamic moment is the dominant term and the whole design is about dynamic pressure, so the gains get scheduled against it; in vacuum that term is absent entirely and the plant is close to a double integrator.

Second, rigid body, or do I need to worry about the first bending mode? If it is rigid I will talk about the rigid-body loop only. If it is not, then where the first mode sits relative to the bandwidth I am aiming for is the design driver, and the interesting part of the answer becomes the filter rather than the controller."

**Interviewer:** "Atmospheric flight, and assume you do have a bending mode at around eight hertz."

**The answer that follows** is now about a genuinely different problem from the one the weak opening walked into — gain scheduling against dynamic pressure, the rigid-body loop kept well below eight hertz, a notch or a low-pass on the rate feedback, and the sensor-location question of whether the gyro sees the bending mode in phase or out of phase with the rigid-body motion, which determines whether the mode is gain-stabilised or phase-stabilised.

**What makes the difference:** the weak opening is not wrong, and that is what makes it dangerous. It is a fluent, textbook-correct description of a generic attitude loop, and it would be an adequate answer to some version of the question. But it committed to rigid body, committed to a phase of flight, and committed to an architecture, all silently, within eight seconds — and if the interviewer's actual interest was the bending mode, none of it lands.

The strong opening costs about twenty-five seconds. Both questions pass the test: each has two answers that lead somewhere materially different, and the candidate says where, which means the interviewer has already seen the branch structure before answering. That is a substantial part of the assessment, delivered before the real answer has started.
:::

::: example "How would you estimate the vehicle's position?" — and the interviewer will not specify
**Candidate:** "One question first: do I have GNSS, and is it available continuously, or should I assume it is denied or intermittent? The reason it matters is that with continuous GNSS this is mostly a loosely coupled inertial-aiding problem, and without it the question becomes how fast the inertial solution drifts and what else I can bound it with."

**Interviewer:** "You tell me. Assume whatever you think is sensible."

**Weak response:** "Oh — okay. Um. I suppose we could assume we have GNSS, that is probably the normal case? Although I guess it depends on the vehicle. Maybe I should cover both? Sorry — what would be most useful for you?"

**Strong response:** "Then I will take the harder case, because it subsumes the other one. Assume a tactical-grade inertial measurement unit at a few hundred hertz, GNSS available before launch and intermittently afterwards, and a barometric altitude source inside the atmosphere.

Architecture: an error-state Kalman filter with the strapdown inertial solution as the reference trajectory, and the filter estimating the errors — position, velocity, attitude error, accelerometer and gyro biases — rather than the states themselves. The reason for the error-state formulation is that the error dynamics are slow and close to linear even when the vehicle's own motion is not, so the linearisation the filter needs is actually valid.

The thing that then drives everything is how fast the free-inertial solution degrades between fixes, because that sets how long an outage you can tolerate before the position uncertainty exceeds whatever the requirement is. If GNSS were fully denied I would be looking for a different bounding measurement — terrain-relative or optical navigation — rather than trying to make the inertial solution better.

The assumption doing the most work there is the grade of the inertial unit. With a navigation-grade unit the tolerable outage is far longer and the whole trade changes."

**What makes the difference:** the weak response treats "you tell me" as a problem to be solved by asking again. It offers to cover both cases — which cannot be done well in four minutes — and then hands the decision back a second time. By the end of it, roughly forty seconds have gone and no content has been delivered.

The strong response makes a decision, states it explicitly as a decision, gives a reason for the choice, and then answers. It also does the thing that makes stated assumptions genuinely useful rather than decorative: it names which assumption is load-bearing and says how the answer would move if that assumption changed. That last sentence is worth a great deal, because it shows the interviewer the sensitivity of the answer without spending the time to work the second case.
:::

## Check yourself

::: check
State the test for whether a clarifying question is worth asking, and apply it to two questions: "what is the vehicle's mass?" and "is there an atmosphere?"
:::

::: answer
The test is whether the two possible answers would lead you to say materially different things next. "What is the vehicle's mass?" usually fails: you are about to describe an architecture — a loop structure, an estimator formulation — that does not change with the number, so the answer would not redirect you. "Is there an atmosphere?" usually passes: it determines whether aerodynamic moments exist at all, and therefore whether you need gain scheduling against dynamic pressure, which is a structural difference in the answer rather than a numerical one.
:::

::: check
Why does attaching "because…" to each clarifying question change how it is received?
:::

::: answer
Because the reason is the part that carries information about you. A bare question is a request for data and tells the interviewer only that you noticed a gap. A question with its reason attached shows the branch: you have told them what you would say in each case, which is most of what they were trying to learn, and you have done it before they answer. It also distinguishes a genuine clarification from a stall, since a stalling question has no branch behind it and cannot be given a reason without the absence becoming obvious.
:::

::: check
An interviewer responds to your clarifying question with "assume whatever you think is reasonable." Give the structure of the correct response and say why asking again is a mistake.
:::

::: answer
Choose, state the choice out loud as a choice, give a one-line reason for choosing that case, and proceed — then name which assumption is doing the real work and how the answer would move if it changed. Asking again is a mistake because the interviewer has just told you that the specification is yours to make, which is itself part of the test; a second request hands the decision back, consumes the answer's time budget, and reads as an unwillingness to commit. It also forfeits the opportunity the refusal creates, which is to pick the case you are strongest on.
:::

::: check
Explain the relationship between a clarifying question and the "state your assumptions" move from the previous lesson.
:::

::: answer
They are the same act from two directions. Both exist to make sure the interviewer knows which problem you are solving. A clarifying question asks the other side to fix the unstated condition; a stated assumption fixes it yourself and says so. Which one you use depends only on whether the interviewer is willing to specify: ask first, and if the question is declined, state the assumption and continue. The failure mode in both cases is identical — proceeding with the condition unfixed and unmentioned, so that a correct answer to a different problem gets assessed as your answer to theirs.
:::

::: check
A candidate asks six clarifying questions, one at a time, with pauses between them, before beginning to answer. Describe how this reads and what it actually costs.
:::

::: answer
It reads as delay rather than diligence, and experienced interviewers recognise the pattern: peripheral questions, arriving singly, none of them attached to a branch in the answer. The cost is concrete as well as reputational — on a call where each answer has roughly four to five minutes, six dripped questions can consume more than half the budget, so even a strong answer afterwards arrives truncated. The discipline is one to three questions, batched at the top, each with its reason; and if the problem genuinely branches more than that, to say so and offer to take one case.
:::

::: check
Name the five axes along which a GNC question is typically underspecified, and give one example question on each.
:::

::: answer
Plant: is this a rigid body or is there a flexible mode, slosh, or a moving appendage? Environment: are we in an atmosphere, and which disturbances dominate? Sensing: what am I measuring, at what rate, and with what noise and bias behaviour? Actuation and authority: what actuators, and what are the saturation and rate limits? Requirements: what accuracy is needed, over what timescale, and which failure actually matters? You would not ask about all five — you ask only about the one or two whose answers would change what you say next.
:::

## Summary

| Axis | The question | Why it changes the answer |
| --- | --- | --- |
| Plant | Rigid, flexible, slosh, varying inertia? | A flexible-body answer shares almost nothing with a rigid one |
| Environment | Atmosphere or vacuum; dominant disturbance? | Determines whether gain scheduling on dynamic pressure exists |
| Sensing | What, how fast, what noise and bias? | Sets whether the problem is estimation or control |
| Authority | Torque, force, saturation, rate limits? | Saturation changes the problem qualitatively |
| Requirements | Accuracy, timescale, which failure matters? | Different requirements pull the same loop opposite ways |

The next three lessons turn to the technical material itself — the topics this module's source reports coming up on GNC phone screens — starting with PD control, where the five moves and the clarifying habit get their first full workout on a question that has an exact answer.
