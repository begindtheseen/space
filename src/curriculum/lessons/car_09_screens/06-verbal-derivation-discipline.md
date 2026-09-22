---
id: l06-verbal-derivation-discipline
title: "Deriving out loud with no whiteboard"
minutes: 24
covers:
  - verbal derivation discipline without a whiteboard: narrate the setup, name the variables, state assumptions
---

You have solved harder problems than anything a thirty-minute phone screen will ask you. That is not the difficulty. The difficulty is that every technical explanation you have ever given was given with a surface — a whiteboard, a notebook, a shared screen — and a large part of the explanation was carried by the surface rather than by your words. You wrote a symbol and pointed at it. You drew a block diagram and said "this one". You sketched a plot and let its shape do the argument.

Take the surface away and those moves stop working. The listener hears "this one" and does not know which one. They hear a symbol they have not been given a definition for. They hear a derivation whose steps are fine but whose structure is invisible, because the structure was going to be the layout on the board. The result is that a candidate who understands the material perfectly well comes across as muddled, and — worse — cannot tell that it is happening, because in their own head the board is right there.

This lesson gives you a structure to replace the board. It is five moves, in order, and it works for almost any fundamentals question you will be asked. Learn it as a habit rather than a script, because a script applied to the wrong question is worse than no structure at all.

## The five moves

**One: say what you are about to do.** One sentence, before any content. *"I will set up the frame, write the rotational dynamics, then close the loop and look at the poles."* This is the table of contents, and it is the single highest-value sentence in the answer, because it gives the listener a place to put everything that follows. It also lets them redirect you immediately if you have misread the question — which costs eight seconds now and four minutes later.

**Two: state the frame and the assumptions.** Rigid body or flexible. Atmosphere or vacuum. Point mass or extended. Small angles or not. Linear or nonlinear. Which frame the components are expressed in. What you are neglecting and why it is reasonable to neglect it. Say these out loud even when they feel obvious: an assumption you did not state is an assumption the listener cannot tell you made deliberately.

**Three: name the variables.** Every symbol, once, when it first appears, with units. *"Let J be the moment of inertia about the pitch axis, in kilogram metres squared. Let theta be the pitch angle error, radians, defined as measured minus commanded."* The definition of the error sign is not pedantry — it is the thing that will bite you four steps later when you are deciding whether a term enters with a minus.

**Four: describe the shape of the equation before you say it.** This is the move that most directly replaces the board. *"It is a second-order equation: inertia times angular acceleration on the left, and on the right two terms, a proportional term in the angle and a derivative term in the rate, both negative."* Then say the equation. The listener now has a frame to hang the symbols on rather than a stream of them.

**Five: give the result, then check it out loud.** A number or an expression, and then at least one sanity check spoken as a check: units, a limiting case, a sign, or an order of magnitude. Ending on a check is what separates an answer from a recitation, and it is the part interviewers report rewarding.

::: key
Five moves, in order: say what you are about to do; state the frame and assumptions; name every variable with units when it first appears; describe the structure of the equation before you say it; then give the result and sanity check it out loud. Silence for thirty seconds while you think is fine if you say that is what you are doing.
:::

## Saying an equation out loud

A written equation is two-dimensional and speech is not, so the translation needs care. Three habits cover most of it.

**Announce the count.** "There are three terms." "This has a numerator and a denominator; let me do the numerator first." The listener can then tell when you have finished a piece.

**Group explicitly.** Say "the whole thing squared" rather than trailing off; say "all of that over two zeta omega-n" rather than leaving the scope of the division to be guessed. Written parentheses are free, spoken ones are not, and the ambiguity is entirely on you.

**Read in the order the reader's eye would move,** which is usually left to right and outside in, and stop at the natural boundaries. A long expression said as one breath is unparseable however correct it is.

One more, less obvious: **spell out anything that sounds like something else.** On a call with imperfect audio, "m" and "n" are the same sound, as are "b" and "d", and "e to the minus" and "eta minus" are close enough to cause a two-minute detour. If you are using both a damping ratio and a frequency, say "zeta, the damping ratio" the first time, not just "zeta".

## Thinking time, announced

You are allowed to stop and think. What you are not allowed to do is go silent without explanation, because the listener cannot see you thinking and silence on a call reads as a stall or a dropped connection.

The fix is one sentence: *"Give me twenty seconds to set this up properly."* Then take the twenty seconds. This is not a concession; it converts an ambiguous silence into a visible, deliberate act, and it buys you a cleaner answer. It is also very close to what you would say in a design review, which is part of why interviewers are comfortable with it.

What you should not do is fill the silence with narrated anxiety. There is a large difference between narrating your *reasoning* and narrating your *uncertainty*:

- Reasoning: "I am deciding whether to do this in the body frame or the inertial frame. Body frame, because the inertia tensor is constant there."
- Uncertainty: "Hmm. I think... I am not sure this is right. Sorry, let me start again. I feel like there is a term I am forgetting."

The first is informative and is exactly what the interviewer wants to hear. The second gives them nothing and asks them to manage your state.

::: warning Do not apologise your way through a derivation
Small apologies — "sorry, this is messy", "I should know this better" — feel like modesty and function as evidence. An interviewer who hears four of them starts looking for the mistake that prompted them, and will find something to be doubtful about whether or not one exists. If you make an actual error, correct it plainly and move on: "that sign is wrong, it should be negative — because the torque opposes the rate."
:::

## Sanity checks you can do with no surface

The fifth move needs a stock of checks you can run in your head and say in a sentence.

**Units.** The cheapest and most powerful. A proportional gain that takes an angle in radians to a torque in newton metres has units of newton metres per radian, and if your expression for it does not, something is wrong upstream.

**A limiting case.** Set a gain to zero and say what the system should do; set it very large and say what it should do. If your expression does not produce those, it is wrong. This check costs one sentence and catches structural errors, not just algebraic ones.

**A sign.** State the physical expectation — "damping should oppose the rate, so that term must be negative" — and check the expression against it.

**An order of magnitude.** If you get a settling time of four milliseconds for a spacecraft with a large moment of inertia and small wheels, the answer is wrong even if the algebra is right, and saying so is worth more than the algebra.

::: key
Close every answer with at least one check said out loud: units, a limiting case, a sign against a physical expectation, or an order of magnitude against something you know. An answer that ends on a check reads as engineering; an answer that ends on an expression reads as recall.
:::

## Two questions, narrated

::: example "How do you relate a derivative taken in a rotating frame to one taken in an inertial frame?"
**Weak answer:** "Right, so this is the transport theorem. You have the derivative in the inertial frame equals the derivative in the body frame plus omega cross the vector. It comes up whenever you differentiate anything in a rotating frame — so for example when you go from angular momentum to torque you get the omega cross H term from this. That is basically it."

**Strong answer:**

"Let me set it up, state what I am assuming, and then give the relation and check it.

The setup: there are two frames. Call the inertial frame I, and a second frame B that rotates relative to it. Let omega — I will call it omega-B-relative-to-I — be the angular velocity of B with respect to I, in radians per second. Let **a** be any vector quantity; it does not have to be a position vector, that is the point of the theorem.

The assumption that matters: **a** is one physical vector, and what differs between the two frames is only the observer, not the quantity. The theorem is kinematic. It says nothing about forces and it does not care whether B is accelerating.

Now the structure. It is a sum of two terms. The first is the derivative as seen by an observer fixed in B — the rate of change of the components, with the axes held still. The second is a correction for the fact that those axes are themselves turning, and it is a cross product of the angular velocity with the vector itself. So:

the derivative of **a** in the inertial frame equals the derivative of **a** in the body frame, plus omega cross **a**.

One bookkeeping point I should state: all three terms have to be expressed in the same frame's components before you add them. The equation is frame-agnostic as a statement about vectors; the arithmetic is not.

Two checks. If omega is zero, the frames do not rotate relative to each other and the two derivatives are equal — which the expression gives, since the cross product vanishes. And if **a** is fixed in B, its body-frame derivative is zero and the whole thing reduces to omega cross **a**; for a position vector that is the familiar velocity of a point on a rotating body, magnitude omega times the perpendicular distance, direction perpendicular to both — which is right."

Written out, the relation is:

$$\left(\frac{d\mathbf{a}}{dt}\right)_I = \left(\frac{d\mathbf{a}}{dt}\right)_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a}$$

**What makes the difference:** the weak answer is not incorrect. It states the theorem accurately and even gives an application. What it never does is define anything — which frame is which, what omega is the angular velocity *of*, or what **a** is allowed to be — so a listener who did not already know the result could not reconstruct it, and a listener who did know it learns nothing about whether the candidate understands it or has memorised it.

The strong answer takes about ninety seconds and does all five moves. Notice specifically the naming of omega as "B relative to I": that single phrase is the difference between a result and a result you can use, since the commonest error with this theorem is getting that relation backwards. Notice also that the two checks are doing real work — the second one recovers a result the listener already believes, which is the cheapest possible way to demonstrate that the general expression is right.
:::

::: example "Why would you use quaternions instead of Euler angles?"
**Weak answer:** "Because of gimbal lock. Euler angles have a singularity, and quaternions do not have that problem, so basically everyone uses quaternions for attitude. They are also more efficient computationally."

**Strong answer:**

"I will answer in three parts: the parameter counting, the singularity, and what quaternions cost you in exchange. And before I start I should say which convention I am using, because there are several and they disagree about signs.

Convention: unit quaternion, scalar part first, representing the rotation that takes vector components from the body frame to the inertial frame. Hamilton multiplication. If your codebase uses scalar-last or the other composition order, the algebra changes and the concepts do not.

Part one, parameter counting. A rotation in three dimensions has three degrees of freedom, and every representation is a way of carrying three numbers' worth of information. A rotation matrix carries nine numbers with six constraints — three unit-length conditions and three orthogonality conditions. A unit quaternion carries four numbers with one constraint, the unit norm. Euler angles carry exactly three numbers with no constraints at all.

Part two, the singularity. Euler angles look like the efficient choice from that counting, and the reason they are not is a theorem-level fact rather than an implementation detail: no three-parameter representation of rotations is globally non-singular. For Euler angles the singularity appears where two of the three rotation axes line up — gimbal lock — and what actually breaks there is the map from body angular rates to Euler angle rates, which becomes singular, so the angle rates blow up. That is a numerical catastrophe in an integration loop, and it is at a fixed, known attitude, which means it is fine right up until your vehicle needs to go there. Quaternions have four parameters, so they escape that theorem: the kinematic differential equation relating quaternion rate to body angular rate is bilinear and non-singular everywhere.

Part three, what it costs. Two things. The unit-norm constraint has to be maintained — numerical integration walks off the unit sphere, so you renormalise. And the representation is a double cover: q and minus q are the same physical rotation. That is harmless until you difference two quaternions, or average them, or feed one to an estimator, at which point you have to handle the sign explicitly or you get a large spurious error for an attitude that is actually close.

Sanity check on the counting: four parameters minus one constraint is three, nine minus six is three, and three minus zero is three — all three representations carry three degrees of freedom, which they must."

**What makes the difference:** the weak answer contains one true fact, gestures at a second, and would not survive a single follow-up — asked *why* gimbal lock happens, or *where*, or what the efficiency claim refers to, it has nothing left. It also asserts the efficiency point without qualification, which invites a challenge it cannot meet.

The strong answer opens by stating a convention, which is the single most characteristic move of someone who has actually shipped attitude code, because conventions are exactly what causes the sign bugs. It structures the answer in three announced parts, gives a reason at the level of a general result rather than an anecdote, is explicit about what breaks and where, and volunteers the disadvantages unprompted. The closing check is trivial arithmetic and worth saying anyway: it demonstrates that the parameter counting is a framework the candidate is using, not three facts they happen to remember.
:::

## Practising this

The drill in this module's exercises is exact and unpleasant, which is why it works: have someone ask you fundamentals questions by voice only, with no writing surface, and record every answer. Then listen back with the five moves in front of you and mark which ones you skipped.

Almost everyone skips moves one and five the first time — the opening table of contents and the closing check — because both feel like overhead when you can see the answer coming. They are the two that matter most to the listener, who cannot see it coming.

Set a timer at five minutes and treat an overrun as a failure even when the answer was correct, for the reason lesson four gave: an eleven-minute answer eats the next question.

## Check yourself

::: check
List the five moves in order, and say which two are most often skipped and why that matters.
:::

::: answer
One, say what you are about to do. Two, state the frame and the assumptions. Three, name every variable with units as it first appears. Four, describe the structure of the equation before saying it. Five, give the result and sanity check it out loud. The two most often skipped are the first and the last, because both feel redundant to someone who can already see the whole answer. They matter most to the listener precisely because the listener cannot see it: the opening sentence tells them where everything goes and lets them redirect you early if you misread the question, and the closing check is what turns a recited result into a demonstrated one.
:::

::: check
Why does the lesson insist you state assumptions that seem obvious — rigid body, no atmosphere, small angles?
:::

::: answer
Because an unstated assumption is indistinguishable, to the listener, from an assumption you did not know you were making. Interviewers frequently leave problems underspecified on purpose, and the thing being assessed is whether you know which assumptions are load-bearing. Saying "I am treating this as a rigid body, which is fine as long as the first flexible mode is well above the control bandwidth" takes six seconds and demonstrates exactly that judgment; leaving it out gives you no credit for it and leaves the interviewer unable to tell whether the omission was deliberate.
:::

::: check
You need twenty seconds to think in the middle of an answer. Give the sentence you should say, and explain why silence without it is costly on a phone screen specifically.
:::

::: answer
Say something like: "Give me twenty seconds to set this up properly." It is costly on a phone screen because the interviewer has no visual channel — they cannot see you thinking, reaching for paper, or working something out — so an unexplained silence is ambiguous between thought, a stall, and a connection problem, and they may fill it by rescuing you with a hint you did not need or by moving on. Announcing the pause removes the ambiguity, and it also gives you permission to actually use the time rather than talking through a half-formed setup.
:::

::: check
Distinguish narrating your reasoning from narrating your uncertainty, with an example of each, and say why the difference matters to the interviewer.
:::

::: answer
Narrating reasoning means saying what you are deciding and on what grounds: "I am choosing the body frame because the inertia tensor is constant there." Narrating uncertainty means broadcasting your internal state: "I think this is right, I am not sure, sorry, let me start over." The difference matters because the first is data the interviewer is actively trying to collect — they want to see how you choose — while the second is not data about the problem at all, and it transfers the job of managing your confidence to them. It also biases them toward looking for an error, since repeated apology is read as evidence that one exists.
:::

::: check
Give four sanity checks you can run and state out loud with no writing surface, and say what kind of error each one catches.
:::

::: answer
Units or dimensions, which catches a structurally wrong expression — a gain with the wrong dimensions cannot be right whatever the algebra did. A limiting case, setting a parameter to zero or to something very large and comparing with the physical expectation, which catches structural rather than arithmetic errors. A sign check against a physical statement such as "damping must oppose the rate", which catches the commonest single error in a hand derivation. And an order-of-magnitude check against something you know, which catches an answer that is algebraically fine but numerically absurd.
:::

::: check
A candidate gives a correct, complete answer in eleven minutes. Why is this graded as a problem rather than as thoroughness?
:::

::: answer
Because the call has a fixed budget and an eleven-minute answer consumes the airtime of roughly two other questions, so the interviewer ends with evidence on fewer topics than they planned to probe — and you get no credit for the questions that were never asked. It is also read as a signal in its own right: choosing which four things to say out of the twenty you know is the same judgment that produces a readable test report or a review package someone else can act on, so an inability to compress is evidence about more than the call.
:::

## Summary

| Move | What you say | What it replaces |
| --- | --- | --- |
| 1. Announce | "I will do three things: …" | The layout of the board |
| 2. Assumptions | Frame, rigid or flexible, linear or not, what is neglected | The picture you would have drawn |
| 3. Variables | Every symbol once, with units and sign convention | The labels on the diagram |
| 4. Structure | "Two terms: one in the angle, one in the rate" | Seeing the equation |
| 5. Result and check | Units, a limiting case, a sign, an order of magnitude | Pointing at the answer and nodding |

The next lesson takes the move that comes before all five of these: the clarifying questions you ask before you start answering at all, and the test for which ones are worth asking.
