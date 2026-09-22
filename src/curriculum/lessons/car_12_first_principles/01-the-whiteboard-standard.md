---
id: l01-the-whiteboard-standard
title: "The whiteboard round and its standard"
minutes: 22
covers:
  - the standard interviewers describe: state assumptions fast, work through the math without drift, sanity check at the end
  - why candidates who ramble or stall lose this round even when they know the material
  - thinking aloud as an explicitly evaluated skill
---

The two rounds before this one had a floor under them. In the phone screens you were asked about your own work and about fundamentals you have been carrying since university; in the domain round you were examined on control, estimation and astrodynamics, where the questions are hard but the answers are known and someone has written them down. This round removes that floor on purpose. You will be handed a problem you have never seen, one that is not in any textbook in the form it is asked, and there is a reasonable chance the interviewer does not have an exact answer either.

*Estimate the power a Starlink satellite radiates. Why is the sky blue. How much does this room weigh. Derive the equations of motion for a rocket over a flat Earth, starting from Newton.* These are not recall questions dressed up. They are questions whose answer has to be built in front of someone, out of physics you already have, in twenty minutes, standing up, with a marker in your hand.

What is being assessed is the construction, not the number. This module's own summary states the standard the interviewers describe: **state assumptions fast, work through the math without drift, sanity check at the end** — and it states the reported failure mode, which is that candidates who ramble or stall lose the round even when they know the material perfectly well. That combination is unusual and worth taking seriously. In most technical assessments, knowing the material is sufficient and the delivery is a tiebreak. Here, the delivery *is* the assessment, because the problem was chosen so that nobody in the room can settle it by knowing it.

## What the round looks like

A room, a whiteboard, one or two engineers, somewhere between thirty and forty-five minutes. The problem arrives in one sentence, often deliberately underspecified. You will be given a marker and the interviewer will sit down, which is the signal that the board is now yours and the silence is now yours to fill.

The problems come in three shapes, and this module works all three:

- **A derivation from first principles.** Variable-mass mechanics, the rocket equation, the powered-flight equations of motion, the rotational dynamics of a gimballed vehicle. Lessons 2 to 7.
- **An estimate with no data.** A Fermi problem: power budgets, propellant masses, launch cadence, how many of something are overhead right now. Lessons 8 to 10.
- **A physics puzzle.** A situation you have to model before you can compute anything. Lesson 11.

Two more rounds sit alongside these — a coding round and a systems and architecture round — and they are graded on the same axis, which is why they are in this module rather than a separate one. Lessons 12 and 13 cover them.

## The standard, unpacked

The three clauses of the stated standard are each more specific than they look.

**State assumptions fast.** Not *state assumptions* — every candidate eventually states assumptions, usually after four minutes of hedging. The word doing the work is *fast*. The first assumption should be on the board inside the first minute, and the full assumption list inside the first two or three. Speed here is not a display of confidence; it is what makes the rest of the round possible. An interviewer who can see your model can correct your model. An interviewer who cannot see it has to sit through a derivation whose premises they are reconstructing in their head, and if your premise was wrong they find out at the same time you do, at the end.

**Work through the math without drift.** Drift is the specific failure of starting a calculation, abandoning it mid-line, changing notation, restarting from a different place, and arriving somewhere that may or may not be related to the question. It is not the same as being slow, and it is not the same as making a mistake. A clean derivation with one sign error in it reads far better than a meandering one that happens to end at the right number. Drift is visible from across the room: the board fills with disconnected fragments, and arrows start appearing between them.

**Sanity check at the end.** A result that arrives without a check is a claim. A result that arrives with a check is an engineering answer. The check is a specific, sayable act — units, a limiting case, an order-of-magnitude comparison against something you know — and it takes fifteen seconds. Lesson 7 builds the units check into a reflex; lesson 10 does the magnitude check.

::: key
The standard interviewers describe for this round: state assumptions fast, work through the math without drift, sanity check at the end. All three are about the visible process. The problem is chosen so that the answer cannot be recalled, which makes the process the only thing there is to grade.
:::

## Why rambling and stalling lose

Both failure modes have the same root, and seeing that makes them easier to avoid than treating them as two separate bad habits. The interviewer has half an hour and has to leave the room able to write down a judgement about how you think. What they can write down is limited to what they could follow; everything else, however correct it was inside your head, does not exist for scoring purposes.

**Stalling** produces nothing to follow. Twenty seconds of silence at a whiteboard is a long time; forty seconds is very long; two minutes of visible thinking with nothing written and nothing said is the single most damaging thing you can do in this round, and it is common, because the natural response to an unfamiliar problem is to look for the answer internally before speaking. That instinct is correct in a library and wrong here.

**Rambling** produces too much to follow, with no structure. It usually happens after a stall, as a correction: having been silent, the candidate over-compensates and narrates every association the problem triggers — a related project, a caveat, a second possible model, a half-memory of a paper. The interviewer cannot tell which of these is the load-bearing thought and which is noise, so none of it can be scored.

The cure for both is the same and it is structural rather than temperamental: **have a fixed method you apply to every problem in this round, and announce which step of it you are on.** A method converts an open-ended problem into a sequence of small, closed problems, each of which you can do. It also gives you something true to say during a silence, which is what kills the stall: *"I am deciding whether to model this as a surface or a volume"* is a sentence available to you at any moment, and it is worth more than the thirty seconds of quiet it replaces.

::: warning Do not treat the first number you say as a commitment
Candidates stall because they are trying to avoid saying something wrong. In this round a stated assumption is not a commitment — it is a move, and moves are revisable out loud. *"Take the array as ten square metres; I will come back and widen that if the answer looks strange"* costs nothing if it turns out to be five. Refusing to name a number until you are sure costs you the round.
:::

## The method, stated once

This is the spine of the module. Every worked problem in the lessons that follow uses these six steps, in this order, with the step names said out loud.

1. **Restate and bound.** One sentence back to the interviewer saying what you think you are being asked, including which of the ambiguous readings you are taking. This is where you ask the one or two clarifying questions that actually change the answer — not more.
2. **Declare the model and the assumptions.** What physics you are using, what you are neglecting, and the numbers you are going to treat as known. Write them in a list, in the top-left corner of the board, and do not erase them.
3. **Decompose.** Break the quantity you want into factors or terms you can get at separately. For a derivation this is the choice of frame, state variables and equations; for an estimate it is the product of bounded factors.
4. **Carry it through with units attached.** Every line of algebra, every number, with its units written down beside it.
5. **Sanity check.** Units, a limiting case, and a magnitude comparison against something you know independently.
6. **State the uncertainty.** Which step is weakest, and how much the answer moves if that step is wrong. One sentence.

Steps 1, 2, 5 and 6 are what separate this round from a calculation. They are also the cheap ones: together they take under three minutes and they are where most of the score is.

::: key
Six steps, the same every time: restate and bound; declare the model and assumptions; decompose; carry it through with units; sanity check; state the uncertainty. Announce the step you are on. The method is what prevents both failure modes — it gives you something to say during a silence and a structure that stops the narration sprawling.
:::

## Thinking aloud is an output, not a courtesy

The previous module taught narrating a derivation on a call with no shared surface. At a whiteboard you have a surface, and that changes the mechanics rather than the principle. Three board-specific habits carry most of it.

**Divide the board before you write on it.** Assumptions top-left, working in the main body, results and checks bottom-right or on a separate panel. Drawing those divisions takes eight seconds and it buys two things: the interviewer always knows what kind of statement they are looking at, and you can never lose the assumption list under the algebra. Erasing your own assumptions to make room is a common and entirely avoidable self-inflicted wound.

**Talk while you write, not between writing.** Writing in silence and then explaining what you wrote doubles the time and halves the bandwidth. The sentence and the symbol should land together: *"…so the momentum flux term, m-dot times exhaust velocity…"* as you write it.

**Label every silence over about ten seconds.** Not with an apology — with a statement of what the silence is for. *"Ten seconds, I want to get the sign of this term right."* Then take the ten seconds. A labelled silence reads as deliberation; an unlabelled one reads as a stall, and the difference is one sentence.

There is one more, which matters most when something goes wrong: **narrate reasoning, not anxiety.** *"That term should be an acceleration and it is coming out as a velocity, so I have dropped a divide by time somewhere — give me a moment to find it"* is a strong minute. *"Hmm, that does not look right, sorry, I always mess this up"* is the same minute, thrown away.

::: example The first ninety seconds, three ways
The problem: *"Estimate the power a Starlink satellite radiates."*

**Stalled.** The candidate writes "Starlink" on the board, underlines it, and goes quiet for ninety seconds, trying to remember whether they once read a number for the bus power. They have not, so at the end of the ninety seconds they are exactly where they started, and the interviewer has ninety seconds of nothing.

**Rambling.** *"OK so Starlink, these are the LEO satellites, there are a lot of them, I think they are at 550 kilometres, and they use Ku-band for the user links and Ka for the gateways, I think, and there is also laser crosslinks on the later ones — actually the power will depend a lot on which generation, and the newer ones are much bigger, so maybe I should — do you want the RF power or the total? Because those are very different. I guess I would start by thinking about the solar panels, but I do not know how big they are…"* Everything in that is true and some of it is even the right instinct, but nothing has been decided and nothing is on the board.

**To standard.** *"Two readings, and they differ by about an order of magnitude, so let me pick one: radiated radio-frequency power, or total power radiated as electromagnetic energy including waste heat? I will do both — the second is easier and I will use it to bound the first.*

*Assumptions, going on the board now: solar array of order ten square metres, cell efficiency about thirty per cent, orbit at five hundred and fifty kilometres, and steady state — over an orbit the satellite radiates everything it collects, because it is not storing energy anywhere.*

*Decomposition: collected power equals solar constant times area times efficiency; total radiated equals collected; RF radiated is that times the fraction of the bus given to the payload times the amplifier efficiency. Three factors, and I will bound each one."*

Ninety seconds, five assumptions on the board, a decomposition written down, and the interviewer now knows exactly what is about to happen. The number itself is worked out in lesson 9.
:::

::: example A two-minute answer, end to end
The problem: *"How much does the air in this room weigh?"* — a warm-up question, and a fair test of whether the method is a habit or a slogan.

**Restate and bound.** *"The air only, not the room. I will treat the room as a box and the air as at sea-level density."*

**Assumptions.** Room about $6\,\mathrm{m}$ by $8\,\mathrm{m}$ by $3\,\mathrm{m}$ high; air density at room temperature and sea level about $1.2\,\mathrm{kg/m^3}$.

**Decompose.** Mass equals volume times density. Two factors.

**Carry it through.** $V = 6 \times 8 \times 3 = 144\,\mathrm{m^3}$, so $m = 144 \times 1.2 = 173\,\mathrm{kg}$.

**Sanity check.** Units: cubic metres times kilograms per cubic metre gives kilograms. Magnitude: that is a little over two adults, floating invisibly in the room. Surprising, but the right kind of surprising — air is about a thousand times less dense than water, and a bath holds a couple of hundred kilograms of water, so a room of air weighing a couple of hundred kilograms is consistent.

**Uncertainty.** *"The density is good to a few per cent. The room dimensions are eyeballed, so call the volume good to twenty per cent, and the answer is $173\,\mathrm{kg}$ plus or minus about a fifth — between about 140 and 210 kilograms."*

Under two minutes, six steps, and every one of them audible.
:::

## What this module does not assume about the process

Everything above comes from the standard this module states and the failure mode it reports. Beyond that, this curriculum does not know how a particular company runs the round — how many interviewers, whether the problem is fixed or improvised, how it is scored — and where a lesson would need such a detail it says so rather than inventing one.

## Check yourself

::: check
The stated standard has three clauses. Which one is most often missing entirely from an otherwise competent answer, and what does its absence cost?
:::

::: answer
The sanity check. A candidate who knows the material will usually state some assumptions and will usually get through the algebra, but will stop the moment a number or an expression appears, because internally the problem is finished at that point.

Its absence costs an uncaught error — the check is the last chance to notice that the answer is a thousand times too large — and, more often, it costs the demonstration. The check is the clearest available evidence that you treat a result as something to be tested rather than produced, which is the disposition the round exists to find. It takes fifteen seconds.
:::

::: check
Why is stalling for ninety seconds worse than stating an assumption you later have to revise?
:::

::: answer
Because the interviewer scores what they can follow, and ninety seconds of silence contains nothing to follow. A revised assumption, by contrast, produces two scoreable events: the original choice, which shows a model being selected, and the revision, which shows the model being tested against a consequence and corrected. That is a sequence an interviewer can write down.

There is also an arithmetic point. A wrong assumption in a Fermi estimate usually costs a factor of two or three in the final number, which the round tolerates because the number is not what is graded. Ninety seconds is five per cent of a thirty-minute round, spent producing nothing.
:::

::: check
You are asked to estimate the total propellant mass a launch vehicle burns in its first stage. Give the first three sentences of your answer, in the order the method prescribes.
:::

::: answer
1. *Restate and bound:* "Propellant burned by the first stage only, from liftoff to staging, for a medium-lift vehicle — call it something that puts ten to twenty tonnes in low Earth orbit."
2. *Declare the model and assumptions:* "I will work it from the thrust and the burn time rather than from a quoted mass. Assume liftoff thrust-to-weight of about 1.3, a liftoff mass of around 500 tonnes, a specific impulse near 300 seconds at sea level, and a first-stage burn of about 160 seconds."
3. *Decompose:* "Propellant mass is mass flow times burn time, and mass flow is thrust divided by the effective exhaust velocity, which is specific impulse times $g_0$. So three numbers: thrust, $I_{sp}$, burn time."

That is the whole of the opening. No arithmetic has happened yet, and the interviewer already knows the model, the inputs and the route to the answer.
:::

::: check
During a derivation you realise, four lines in, that you defined your flight path angle from the wrong reference and every sign from line two onwards is wrong. What do you do?
:::

::: answer
Say it, name it precisely, and repair the smallest thing that fixes it.

*"My flight path angle is measured from the local horizontal, but in line two I wrote the gravity component as $g\cos\gamma$, which is what it would be if I had measured from the vertical. That makes it $g\sin\gamma$ in the velocity equation and $g\cos\gamma$ in the flight-path-angle equation. Let me fix line two and carry it down."*

Three things are right about that. It is audible, so the interviewer sees the error being caught by you rather than by them. It is specific, so the repair is bounded rather than a restart. And it does not apologise — the definition error is named as a definition error, which is what it is. Silently erasing four lines gives the interviewer nothing and makes the remaining time shorter for no gain.
:::

::: check
The method's last step is "state the uncertainty". For the room-air estimate above, which factor dominates it, and by how much would the answer move if that factor were at the edge of its range?
:::

::: answer
The volume. Air density at ordinary room conditions is known to a few per cent — it varies with temperature and pressure but not by much over the range a room spans. The dimensions, paced out by eye, are good to perhaps ten per cent each, and three of them multiply, so the volume carries roughly twenty to thirty per cent.

At the edges: a room $5 \times 7 \times 2.7$ gives $94.5\,\mathrm{m^3}$ and about $113\,\mathrm{kg}$; a room $7 \times 9 \times 3.3$ gives $207.9\,\mathrm{m^3}$ and about $250\,\mathrm{kg}$. So the honest statement is "somewhere between about 110 and 250 kilograms, most likely around 170", and the sentence that earns the point is *the dimensions dominate, not the density*.
:::

## Summary

| Item | Statement |
| --- | --- |
| The stated standard | State assumptions fast, work through the math without drift, sanity check at the end |
| Reported failure mode | Rambling or stalling — losing the round despite knowing the material |
| Why both fail | The interviewer can only score what they can follow; one produces nothing, the other produces no structure |
| The six-step method | Restate and bound → declare model and assumptions → decompose → carry through with units → sanity check → state uncertainty |
| Board discipline | Assumptions top-left and never erased; talk while writing; label every silence over ten seconds |
| Narration rule | Narrate reasoning, not anxiety; a revised assumption is a move, not a mistake |
| Air in a room | $V\rho$: $144\,\mathrm{m^3}$ at $1.2\,\mathrm{kg/m^3}$ is about $173\,\mathrm{kg}$ |

The next six lessons apply steps 2 to 5 of this method to the derivation problems: variable-mass mechanics and the thrust equation, the rocket equation, the planar powered-flight equations, the gravity turn, the rotational dynamics of a gimballed vehicle, and dimensional analysis as the check that runs underneath all of them.
