---
id: l06-verbal-derivation-discipline
title: "Deriving out loud with no whiteboard"
minutes: 24
covers:
  - verbal derivation discipline without a whiteboard: narrate the setup, name the variables, state assumptions
---

Try this with a friend. Draw a house, a sun and a tree, then describe it over the phone so they can copy it unseen. You will hear yourself say "put a circle there", and "there" means nothing to them. You will say "the line" when there are three. The picture is clear in your head; it does not reach them, because you are used to pointing.

A technical phone screen has the same problem. The questions are not harder than ones you have solved. But every technical explanation you have given leaned on a surface — a whiteboard, a notebook, a shared screen. You wrote a symbol and pointed, said "this one" at a block diagram, let a plot's shape make the argument.

Over a call, the listener hears "this one" and does not know which one. They hear symbols nobody defined, and steps whose overall shape is invisible. So a candidate who understands the material sounds muddled, and cannot tell — in their head, the board is right there.

This lesson replaces the board with **[[five moves|five-moves]]**, in order, for almost any fundamentals question. Learn them as a habit, not a script — a script on the wrong question is worse than none.

## The five moves

**One: say what you are about to do.** One sentence, before any content: *"I will set up the frame, write the rotational dynamics, then close the loop and look at the poles."* This table of contents is the most valuable sentence in the answer. It gives the listener a place to put everything that follows, and lets them redirect you if you misread the question — eight seconds now instead of four minutes later.

**Two: state the frame and the assumptions.** A **[[frame|reference-frame]]** is the set of directions you measure from. Then the assumptions: rigid or flexible? Atmosphere or vacuum? Point mass? Small angles? Linear? What are you ignoring, and why is that fair? Say these even when obvious — the listener cannot tell an unstated assumption was deliberate.

**Three: name the variables.** Every symbol, once, when it first appears, with units: *"Let J be the [[moment of inertia|moment-of-inertia]] about the pitch axis, in kilogram meters squared. Let theta be the pitch angle error, in radians, defined as measured minus commanded."* Defining the error's sign is not fussiness: it is what bites you four steps later, when a term must enter with a minus or not.

**Four: describe the shape of the equation before you say it.** This most directly replaces the board: *"It is a second-order equation: inertia times angular acceleration on the left, and on the right two terms, a proportional term in the angle and a derivative term in the rate, both negative."* Then say the equation. The listener now has somewhere to hang the symbols.

**Five: give the result, then check it out loud.** A number or expression, then at least one sanity check spoken *as* a check: units, a limiting case, a sign, or an order of magnitude. Ending on a check separates an answer from a recitation, and interviewers report rewarding it.

::: key
Five moves, in order: say what you are about to do; state the frame and assumptions; name every variable with units when it first appears; describe the structure of the equation before you say it; then give the result and sanity check it out loud. Silence for thirty seconds while you think is fine if you say that is what you are doing.
:::

::: example Moves two to five on the simplest control question
Asked to control a spacecraft's pitch, moves two to five sound like this.

**Move two:** "Rigid body, in vacuum, single axis, small angles, so it is linear."

**Move three:** "$J$ is the moment of inertia, $\mathrm{kg\,m^2}$. $\theta$ — theta — is the pitch error, radians, measured minus commanded. $K_p$ — read 'K sub p' — is the proportional gain, and $K_d$ is the derivative gain."

**Move four:** "Inertia times angular acceleration on the left; on the right, minus a proportional term in the angle and minus a derivative term in the rate." Then the equation:

$$
J\ddot{\theta} = -K_p\,\theta - K_d\,\dot{\theta}
$$

Here $\ddot{\theta}$, read "theta double-dot", is the angular acceleration, and $\dot{\theta}$, "theta dot", is the rate.

**Move five, units check:** the left side is $\mathrm{kg\,m^2}$ times $\mathrm{rad/s^2}$, a torque in newton meters. So $K_p\,\theta$ is a torque too, and $K_p$ is in $\mathrm{N\,m/rad}$.

**Move five, sign check:** a positive error should get a torque pushing it back toward zero. The minus signs make a positive $\theta$ give a negative torque. Correct.
:::

## Saying an equation out loud

A written equation is two-dimensional — above and below a fraction line, inside and outside brackets. Speech is one word after another. Three habits cover most of the translation.

**Announce the count.** "There are three terms." "A top and a bottom; top first." Then the listener knows when a piece is finished.

**Group out loud.** Say "the whole thing squared", or "all of that over two zeta omega-n", instead of leaving the listener to guess how far the division reaches. Written brackets are free; spoken ones are not.

**Read in the order the eye would move** — left to right, outside in — and pause at the natural breaks. A long expression in one breath cannot be followed.

And **spell out anything that sounds like something else.** On patchy audio, "m" and "n" sound alike, as do "b" and "d", and "e to the minus" versus "eta minus" can cost a two-minute detour. If you use both a damping ratio and a frequency, say "[[zeta, the damping ratio|zeta-omega]]" the first time, not only "zeta".

## Thinking time, announced

You are allowed to stop and think. You must not go silent without explanation: the listener cannot see you thinking, and silence on a call sounds like a stall or a dropped connection.

The fix is one sentence: *"Give me twenty seconds to set this up properly."* Then take them. An unclear silence becomes a deliberate act — close to what you would say in a design review, so interviewers are comfortable with it.

Do not fill the silence with narrated worry. Narrating your *reasoning* and your *uncertainty* are very different:

- Reasoning: "I am deciding whether to do this in the body frame or the inertial frame. Body frame, because the inertia tensor is constant there."
- Uncertainty: "Hmm. I think... I am not sure this is right. Sorry, let me start again. I feel like there is a term I am forgetting."

The first is what the interviewer wants. The second asks them to manage your nerves.

::: warning Do not apologize your way through a derivation
Small apologies — "sorry, this is messy", "I should know this better" — feel like modesty but act as evidence. After four, an interviewer hunts for the mistake behind them, and finds something to doubt whether or not one exists. If you make a real error, correct it plainly and move on: "that sign is wrong, it should be negative — because the torque opposes the rate."
:::

## Sanity checks you can do in your head

Move five needs checks you can run with no paper and say in one sentence.

**Units.** The cheapest and most powerful, as the example showed: a gain turning radians into newton meters must be in newton meters per radian.

**A limiting case.** Set a gain to zero: the system should act as if the controller were off. Make it huge: the response should get faster and stiffer. If your expression disagrees, it is wrong — a check on the answer's *structure*, not only its arithmetic.

**A sign.** State what physics expects — "damping should oppose the rate, so that term must be negative" — and check the expression against it.

**An [[order of magnitude|order-of-magnitude]].** A settling time of four milliseconds for a spacecraft with a large moment of inertia and small reaction wheels is wrong even if the algebra is right — and saying so is worth more than the algebra.

::: key
Close every answer with at least one check said out loud: units, a limiting case, a sign against a physical expectation, or an order of magnitude against something you know. An answer that ends on a check reads as engineering; an answer that ends on an expression reads as recall.
:::

## Two questions, narrated

::: example "How do you relate a derivative taken in a rotating frame to one taken in an inertial frame?"
(An **inertial frame** is not spinning or speeding up — "fixed to the stars". A **rotating frame** turns, like directions painted on a merry-go-round.)

**Weak answer:** "Right, so this is the transport theorem. You have the derivative in the inertial frame equals the derivative in the body frame plus omega cross the vector. It comes up whenever you differentiate anything in a rotating frame — so for example when you go from angular momentum to torque you get the omega cross H term from this. That is basically it."

**Strong answer:**

"Setup, assumption, relation, check.

Two frames: the inertial frame I, and a frame B that rotates relative to it. Omega — I will say omega-B-relative-to-I — is the angular velocity of B with respect to I, in radians per second. **a** is any vector quantity; it does not have to be a position vector, that is the point of the theorem.

The assumption that matters: **a** is one physical vector; only the observer differs between frames. The theorem is kinematic — it says nothing about forces and does not care whether B is accelerating.

Structure: two terms. The first is the derivative seen by an observer fixed in B — components changing, axes held still. The second corrects for the axes turning: a cross product of the angular velocity with the vector. So the derivative of **a** in the inertial frame equals the derivative of **a** in the body frame, plus omega cross **a**.

Bookkeeping: all three terms must be expressed in the same frame's components before you add them. The equation is frame-agnostic as a statement about vectors; the arithmetic is not.

Two checks. If omega is zero, the frames do not rotate relative to each other and the two derivatives are equal — which the expression gives, since the cross product vanishes. And if **a** is fixed in B, its body-frame derivative is zero and the whole thing reduces to omega cross **a**; for a position vector that is the familiar velocity of a point on a rotating body, magnitude omega times the perpendicular distance, direction perpendicular to both — which is right."

Written out:

$$\left(\frac{d\mathbf{a}}{dt}\right)_I = \left(\frac{d\mathbf{a}}{dt}\right)_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a}$$

Read $\boldsymbol{\omega}_{B/I}$ as "omega of B relative to I", and $\times$ as "cross" — the **[[cross product|cross-product]]**, which makes a new vector at right angles to both inputs.

**What makes the difference.** The weak answer is not wrong, but it defines nothing: which frame is which, what omega is the angular velocity *of*, what **a** may be. A listener could not rebuild the result from it, or tell understanding from memory.

The strong answer takes about ninety seconds and does all five moves. "B relative to I" matters most, since the commonest error with this theorem is getting that backwards. The second check recovers something the listener already believes — the cheapest proof the general formula is right.
:::

::: example "Why would you use quaternions instead of Euler angles?"
(**Euler angles**, said "OY-ler", describe an orientation as three turns in a row, like yaw, pitch and roll. A **quaternion**, said "kwa-TER-nee-un", describes it with four numbers.)

**Weak answer:** "Because of gimbal lock. Euler angles have a singularity, and quaternions do not have that problem, so basically everyone uses quaternions for attitude. They are also more efficient computationally."

**Strong answer:**

"Three parts: the parameter counting, the singularity, and what quaternions cost in exchange. First, my convention, because there are several and they disagree about signs: unit quaternion, scalar part first, rotating vector components from the body frame to the inertial frame, [[Hamilton multiplication|hamilton]]. With scalar-last or the other composition order, the algebra changes and the concepts do not.

Part one, counting. A rotation in three dimensions has [[three degrees of freedom|dof-count]], and every representation carries three numbers' worth of information. A rotation matrix carries nine numbers with six constraints — three unit-length conditions and three orthogonality conditions. A unit quaternion carries four numbers with one constraint, the unit norm. Euler angles carry exactly three numbers with no constraints.

Part two, the singularity. Euler angles look efficient, but a theorem says otherwise: no three-parameter representation of rotations is globally non-singular. For Euler angles the singularity is where two of the three rotation axes line up — [[gimbal lock|gimbal-lock]]. What breaks there is the map from body angular rates to Euler angle rates: it becomes singular, and the angle rates blow up. That is a numerical catastrophe in an integration loop, at a fixed, known attitude — fine until your vehicle needs to go there. Quaternions have four parameters, so they escape the theorem: the kinematic equation relating quaternion rate to body rate is bilinear and non-singular everywhere.

Part three, the cost. The unit norm must be maintained — numerical integration walks off the unit sphere, so you renormalize. And it is a [[double cover|double-cover]]: q and minus q are the same rotation. Harmless until you difference, average, or estimate with them; then handle the sign, or a nearby attitude shows a large spurious error.

Sanity check on the counting: four minus one is three, nine minus six is three, three minus zero is three — all carry three degrees of freedom, as they must."

The closing check, written down:

$$
9 - 6 = 3, \qquad 4 - 1 = 3, \qquad 3 - 0 = 3.
$$

**What makes the difference.** The weak answer holds one true fact, waves at a second, and would not survive a follow-up: asked *why* or *where* gimbal lock happens, or what "more efficient" means, it has nothing left.

The strong answer opens with a convention — the mark of someone who has shipped attitude code, since conventions cause sign bugs. It announces three parts, reasons from a general result, says exactly what breaks and where, and volunteers the downsides. The trivial closing arithmetic shows the counting is a framework, not three remembered facts.
:::

## Practicing this

This module's drill is uncomfortable, which is why it works: have someone ask you fundamentals questions by voice only, with nothing to write on, and record every answer. Listen back with the five moves in front of you and mark which ones you skipped.

Almost everyone skips moves one and five at first, because both feel like overhead when you can see the answer coming. They matter most to the listener, who cannot.

Set a timer at five minutes, and treat an overrun as a failure even when the answer was right. As lesson four showed, an eleven-minute answer eats the next question.

## Check yourself

::: check
List the five moves in order, and say which two are most often skipped and why that matters.
:::

::: answer
One, say what you are about to do. Two, state the frame and assumptions. Three, name every variable with units as it first appears. Four, describe the equation's structure before saying it. Five, give the result and sanity check it out loud.

The first and last are skipped most, because they feel unnecessary when you can see the whole answer. The listener cannot: the opening tells them where everything goes and lets them redirect you early, and the check turns a recited result into a demonstrated one.
:::

::: check
Why does the lesson insist you state assumptions that seem obvious — rigid body, no atmosphere, small angles?
:::

::: answer
Because an unstated assumption sounds exactly like one you did not know you were making. Interviewers often leave problems underspecified on purpose, to see whether you know which assumptions carry the weight. "I am treating this as a rigid body, which is fine as long as the first flexible mode is well above the control bandwidth" takes six seconds and shows that judgment. Leave it out and you get no credit, and the interviewer cannot tell whether the omission was deliberate.
:::

::: check
You need twenty seconds to think in the middle of an answer. Give the sentence you should say, and explain why silence without it is costly on a phone screen in particular.
:::

::: answer
"Give me twenty seconds to set this up properly."

The interviewer cannot see you thinking, so an unexplained silence could be thought, a stall, or a dropped call — and they may rescue you with an unneeded hint, or move on. Announcing the pause removes the doubt and lets you use the time instead of talking through a half-formed setup.
:::

::: check
Tell apart narrating your reasoning and narrating your uncertainty, with an example of each, and say why the difference matters to the interviewer.
:::

::: answer
Reasoning is what you decide and why: "I am choosing the body frame because the inertia tensor is constant there." Uncertainty is your inner state: "I think this is right, I am not sure, sorry, let me start over."

The first is data the interviewer wants — how you choose. The second is not about the problem, hands them the job of managing your confidence, and makes them look for an error, since repeated apology reads as evidence of one.
:::

::: check
A candidate says the derivative gain in $J\ddot{\theta} = -K_p\,\theta - K_d\,\dot{\theta}$ has the same units as the proportional gain, newton meters per radian. Use a sanity check to show this is wrong. Then name the other three kinds of check you could say out loud, and what each one catches.
:::

::: answer
**Units.** $K_d\,\dot{\theta}$ must be a torque, in $\mathrm{N\,m}$, and $\dot{\theta}$ is in $\mathrm{rad/s}$. So $K_d$ is in $\mathrm{N\,m}$ divided by $\mathrm{rad/s}$, which is $\mathrm{N\,m\,s/rad}$. The candidate is missing a factor of seconds. A units check catches an expression whose structure is wrong, whatever the algebra did.

The other three:

- A **limiting case** — a gain at zero or huge, against what physics expects — catches structural errors, not only arithmetic.
- A **sign check** against a physical statement such as "damping must oppose the rate" catches the most common single error in a hand derivation.
- An **order-of-magnitude check** against something you know catches an answer that is algebraically fine but numerically absurd.
:::

::: check
A candidate gives a correct, complete answer in eleven minutes. Why is this graded as a problem instead of as thoroughness?
:::

::: answer
The call has a fixed budget. Eleven minutes eats the airtime of about two other questions, so the interviewer ends with evidence on fewer topics than planned — and you get no credit for questions never asked.

It is also a signal: choosing the four things worth saying out of twenty is the judgment behind a readable test report or review package, so failing to compress says something beyond the call.
:::

## Summary

| Move | What you say | What it replaces |
| --- | --- | --- |
| 1. Announce | "I will do three things: …" | The layout of the board |
| 2. Assumptions | Frame, rigid or flexible, linear or not, what is neglected | The picture you would have drawn |
| 3. Variables | Every symbol once, with units and sign convention | The labels on the diagram |
| 4. Structure | "Two terms: one in the angle, one in the rate" | Seeing the equation |
| 5. Result and check | Units, a limiting case, a sign, an order of magnitude | Pointing at the answer and nodding |
| Transport theorem | $(d\mathbf{a}/dt)_I = (d\mathbf{a}/dt)_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a}$ | A drawing of two frames |

The next lesson takes the step that comes before all five of these: the clarifying questions you ask before you start answering at all, and the test for which ones are worth asking.

::: context five-moves The five moves as a pipeline
Think of an answer as a short pipeline. Each move hands the listener something they need for the next one: a map, then the ground rules, then the names, then the shape, and only then the result with its check. Skip an early box and every later box gets harder to follow.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5">
    <rect x="4" y="30" width="60" height="46" rx="6"/><rect x="76" y="30" width="60" height="46" rx="6"/>
    <rect x="148" y="30" width="60" height="46" rx="6"/><rect x="220" y="30" width="60" height="46" rx="6"/>
  </g>
  <rect x="292" y="30" width="64" height="46" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1f2a44">
    <polygon points="66,53 74,49 74,57"/><polygon points="138,53 146,49 146,57"/>
    <polygon points="210,53 218,49 218,57"/><polygon points="282,53 290,49 290,57"/>
  </g>
  <g font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">
    <text x="34" y="48">1</text><text x="106" y="48">2</text><text x="178" y="48">3</text><text x="250" y="48">4</text><text x="324" y="48">5</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="34" y="66">Announce</text><text x="106" y="66">Assume</text><text x="178" y="66">Name</text><text x="250" y="66">Shape</text><text x="324" y="66">Check</text>
  </g>
  <text x="180" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">moves 1 and 5 are the ones most often skipped</text>
</svg>
```
:::

::: context reference-frame Where you measure from
A **reference frame** is a starting point plus three directions to measure along. A frame fixed to the stars is called **inertial**. A frame fixed to the spacecraft, turning with it, is the **body frame**. The same arrow — say, the direction to the Sun — has different numbers in the two frames, the way "left" changes when you turn around. Saying which frame you mean is the first thing a GNC engineer does, because mixing frames up silently is one of the classic ways real flight software goes wrong.
:::

::: context moment-of-inertia How hard something is to spin
Mass tells you how hard something is to push. The **moment of inertia**, written $J$, tells you how hard it is to *spin*. It depends on the mass and on how far the mass sits from the spin axis — which is why a figure skater spins faster when she pulls her arms in. Its unit is kilogram meters squared, $\mathrm{kg\,m^2}$. A torque $\tau$ (tau) gives angular acceleration $\ddot{\theta} = \tau / J$: the spinning version of $a = F/m$.
:::

::: context zeta-omega Two Greek letters you will say a lot
Many control answers describe a system's response with two numbers. $\zeta$, "zeta", is the **damping ratio**: how quickly wobbles die out. Below 1 the system overshoots and wobbles; at 1 it settles without overshoot. $\omega_n$, "omega-n", is the **natural frequency**: how fast it wants to move, in radians per second. Over a crackly phone line "zeta" and "eta" blur, so name the quantity, not only the letter. Lessons eight and nine use both constantly.
:::

::: context order-of-magnitude Getting the size right first
An **order of magnitude** is a factor of about ten. Checking one means asking whether the answer is the right size at all, before worrying about the exact digits. A large spacecraft turned by small reaction wheels takes seconds to minutes to settle, not milliseconds. So if your formula says four milliseconds, it is wrong by a factor of a thousand or more — about three orders of magnitude — and no amount of careful algebra rescues it.
:::

::: context cross-product Why the correction is a cross product
Put a sticker on a spinning turntable. The sticker is fixed to the turntable, so in the turntable's frame it does not move. But seen from the room, it races around. Its velocity points along the rim, at right angles both to the spin axis and to the line from the center. That is exactly what a cross product builds: $\mathbf{v} = \boldsymbol{\omega} \times \mathbf{r}$, with size $\omega r$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="100" r="60" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="110" cy="100" r="8" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="110" cy="100" r="2.5" fill="#1d6fd1"/>
  <text x="96" y="124" font-size="11" fill="#1d6fd1">ω out of page</text>
  <line x1="118" y1="100" x2="170" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <text x="140" y="94" font-size="12" fill="#1f2a44" text-anchor="middle">r</text>
  <circle cx="170" cy="100" r="5" fill="#b4232c"/>
  <line x1="170" y1="100" x2="170" y2="44" stroke="#b4232c" stroke-width="3"/>
  <polygon points="170,34 164,46 176,46" fill="#b4232c"/>
  <text x="180" y="50" font-size="12" fill="#b4232c">v = ω × r</text>
  <text x="222" y="100" font-size="11" fill="#1f2a44">v is at right angles</text>
  <text x="222" y="116" font-size="11" fill="#1f2a44">to both ω and r</text>
  <text x="222" y="140" font-size="11" fill="#1f2a44">size of v = ω r</text>
</svg>
```
:::

::: context hamilton Carved into a bridge
William Rowan Hamilton, an Irish mathematician, discovered quaternions in 1843. The story goes that the key rule came to him while walking along a canal in Dublin, and he scratched it into the stone of Broom Bridge: $i^2 = j^2 = k^2 = ijk = -1$. A plaque marks the spot today. "Hamilton multiplication" means using his original rule for multiplying quaternions. Some aerospace software uses a different ordering convention, which is why stating yours up front prevents sign bugs.
:::

::: context dof-count Counting numbers and rules
Each way of describing an orientation uses some numbers and some rules tying them together. Numbers minus rules gives the real freedoms — and every method must come out at three. In the picture, each block is one number; gray blocks are used up by a rule, blue blocks are free.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="4" y="34">Rotation matrix</text><text x="4" y="74">Quaternion</text><text x="4" y="114">Euler angles</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="100" y="20" width="20" height="20" fill="#8fb8f0"/><rect x="120" y="20" width="20" height="20" fill="#8fb8f0"/><rect x="140" y="20" width="20" height="20" fill="#8fb8f0"/>
    <rect x="160" y="20" width="20" height="20" fill="#6c7a93"/><rect x="180" y="20" width="20" height="20" fill="#6c7a93"/><rect x="200" y="20" width="20" height="20" fill="#6c7a93"/>
    <rect x="220" y="20" width="20" height="20" fill="#6c7a93"/><rect x="240" y="20" width="20" height="20" fill="#6c7a93"/><rect x="260" y="20" width="20" height="20" fill="#6c7a93"/>
    <rect x="100" y="60" width="20" height="20" fill="#8fb8f0"/><rect x="120" y="60" width="20" height="20" fill="#8fb8f0"/><rect x="140" y="60" width="20" height="20" fill="#8fb8f0"/>
    <rect x="160" y="60" width="20" height="20" fill="#6c7a93"/>
    <rect x="100" y="100" width="20" height="20" fill="#8fb8f0"/><rect x="120" y="100" width="20" height="20" fill="#8fb8f0"/><rect x="140" y="100" width="20" height="20" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="290" y="34">9 − 6 = 3</text><text x="290" y="74">4 − 1 = 3</text><text x="290" y="114">3 − 0 = 3</text>
  </g>
</svg>
```
:::

::: context gimbal-lock The warning light on Apollo
A **gimbal** is a ring on a pivot; three nested gimbals let a platform hold its direction while the vehicle turns around it. If two of the rings line up, one direction of turning is lost — that is **gimbal lock**. The Apollo spacecraft's navigation platform used three gimbals, and the crew's computer display had a warning light for when the spacecraft approached a locking attitude. Three Euler angles behave like those three rings, with the same weak spot.
:::

::: context double-cover Two names for one turn
A quaternion stores half the rotation angle inside it. So turning by $360^\circ$ — which puts everything back where it started — changes the quaternion's sign instead of returning it to its starting value. That is why $q$ and $-q$ describe exactly the same orientation. Software that compares two quaternions must first make their signs agree, or two nearly identical attitudes can look like opposites.
:::
