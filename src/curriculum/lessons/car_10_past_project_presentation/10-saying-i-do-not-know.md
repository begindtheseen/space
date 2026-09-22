---
id: l10-saying-i-do-not-know
title: "I do not know — and here is how I would find out"
minutes: 19
covers:
  - "saying I do not know, here is how I would find out"
---

A question you cannot answer is not a failure state. It is a routine event in a session where five to ten engineers are each probing a project from the direction of their own expertise, and the only surprising outcome would be nobody finding an edge. What is being scored is not whether the edge exists. It is the fifteen seconds after it is found.

There is a reliable answer for those fifteen seconds, and it is the opposite of the instinct. The instinct is to produce something — a plausible-sounding guess, a redirection to adjacent material you do know, a general statement that sounds like an answer. All three are worse than the thing they are avoiding.

::: key
Saying "I do not know" in a panel: say it, then add how you would find out, and give a bound if one exists. "I have not measured that, but it is bounded above by the sensor bandwidth, and I would characterise it with a step response." This reads as confidence, not weakness.
:::

## Why a guess is uniquely expensive

A room of domain experts detects guessing quickly, because the guess will not have the texture of a measured quantity — no units chosen carefully, no method behind it, no sense of how uncertain it is. That much is obvious. What makes it expensive is not local.

Once one bluff is detected, the panel has no way to separate your correct statements from your confident ones. Everything you said earlier — the numbers, the verification results, the reasons behind your decisions — moves from "reported by a careful person" to "reported by somebody who says things confidently." You cannot repair that in the remaining time, because the repair would itself be more things said confidently. One detected guess retroactively devalues the whole session, which is a wildly asymmetric price for a fifteen-second gap.

Against that, the actual cost of "I have not measured that" is close to zero. Nobody in the room expects you to have measured everything. Several of them have given that exact answer in a design review this month.

## The three parts, in order

**The admission, short and first.** "I have not measured that." "I did not model that." Four or five words, at the front, before any context. Burying it at the end of a paragraph of preamble converts an honest answer into something that sounds like it is being extracted.

**The bound, if one exists.** Almost always one does, and the next section is about where to find it. A bound converts "I do not know" into "I know it is smaller than this," which is a different and much more useful statement.

**The method.** What you would actually do to find out — the specific measurement, not "I would investigate further." This is the part that demonstrates you have a working relationship with the question rather than a gap where one should be.

Order matters because of how the sentence lands. Admission, bound, method reads as a person who knows the shape of their own ignorance. Method, bound, admission reads as a person working up to a confession.

## Where bounds come from

A bound is almost always available from something you already know, and finding one live is a skill worth practising because it is the same skill as estimating anything.

- **A physical limit.** You cannot observe a disturbance faster than your sensor's bandwidth. You cannot remove stored momentum along the field direction with a magnetorquer at all, because the achievable torque is $-k\,\mathbf h_\perp$ and the parallel component is not in its reach.
- **A budget you already computed.** If the worst-case disturbance accumulation over an orbit is $2.40\times10^{-3}\,\mathrm{N\,m\,s}$, then anything driven by that disturbance is bounded by it, whether or not you measured the specific quantity being asked about.
- **A detectability argument.** With a star tracker resolving $5\times10^{-5}\,\mathrm{rad}$ per axis, a constant gyro bias becomes visible once it has integrated up to that level, so over a $100\,\mathrm{s}$ window anything above about $5\times10^{-7}\,\mathrm{rad/s}$ — roughly $0.10\,^\circ/\mathrm{hr}$ — is observable and anything far below it is not. That bound can be derived out loud, in one sentence, from two numbers you already know.
- **An order-of-magnitude argument from the mechanism.** Worth saying explicitly when you use one: "this is an order-of-magnitude estimate, not a measurement" is a label that keeps the answer honest and costs nothing.

## The three kinds of not knowing

They need different answers, and knowing which one you are in makes the response faster.

**You did not measure it.** You could have; you did not. Give the bound and the measurement.

**It was out of scope.** The project deliberately excluded it. Name the boundary and the reason — this is an assumptions-section answer, and if your assumptions section is written properly the answer already exists in it.

**You do not know the concept.** The question uses a term or a method you have not met. This is the one candidates fear most and it is the cheapest of the three, because the honest response is also the most useful one:

> "I do not know that formulation — I have not worked with it. What does it buy you over the multiplicative error state?"
>
> ...and then, having been told, reason about it out loud against your own problem.

Asking is not a concession. It converts a dead end into a technical conversation in which the panel watches you take in a new idea and evaluate it against a system you know well, which is a closer simulation of working with you than most of the questions that came before it.

::: example "What is the worst-case solve time on a flight processor?" — anchor project B
**Weak, the guess.** "Probably a few milliseconds. It is a small problem and convex solvers are fast."

Two invented numbers with nothing behind them, offered to a room that likely contains somebody who has profiled a solver on a flight target.

**Weak, the bare refusal.** "I do not know. I never ran it on flight hardware."

Correct, and it stops there. The panel learns that a gap exists and nothing about how the candidate thinks about it.

**Strong.** "I have not measured it — I ran on a desktop and never instrumented it. Here is what I can say. It is a second-order cone program with forty nodes, and an interior-point method's cost per iteration is dominated by one factorisation of a matrix set by that size, with iteration counts that are empirically stable across instances of the same formulation rather than data-dependent the way an active-set method's can be. That stability is a large part of why convex formulations are attractive onboard in the first place — but empirically stable is not a bound, and I would not put a number on a flight processor without measuring. What I would do: cross-compile for the target, run the whole dispersion set on it, and report the maximum over cases rather than the mean, because a control loop's budget is a worst case. I would also check whether the solver allocates dynamically, because in a flight control path that is usually a constraint that has to be settled before timing is."

**What separates them.** The strong answer states what it does not know, gives a structural reason why the quantity behaves the way it does, explicitly refuses to convert that reasoning into a number it has not measured, and names a measurement specific enough to schedule. The final sentence also demonstrates that the candidate knows what actually disqualifies code from a flight control path, which was not asked and is more informative than the timing number would have been.
:::

::: example "How did you handle propellant slosh?" — anchor project A
**Weak.** "The mass properties are time-varying, so the changing propellant mass is captured in the inertia model."

This answers a different question, and everyone in the room knows it. Redirecting to adjacent material you do know is the most common form of bluffing and it is more visible than a plain guess, because the mismatch between the question and the answer is obvious to the person who asked.

**Strong.** "I did not model it. The vehicle is a rigid body with time-varying mass and inertia, and nothing in my model represents propellant moving relative to the tank. What I know about why it matters: slosh is a lightly damped mode, usually represented by an equivalent pendulum or mass-spring per tank, and the risk is coupling into the attitude loop when its frequency is close to the control bandwidth. Whether it would change my conclusions depends on the separation between those two, which I have not computed. So the first thing I would do is estimate the slosh frequency for my tank geometry and fill fractions across the burn, and compare it against my loop bandwidth. If they are within a factor of a few, my control-authority result is not trustworthy as it stands and the model needs a slosh mode in it. That is the honest limit of what I can say about it."

**What separates them.** The strong answer names the omission immediately, demonstrates that it knows what the omitted physics does and how it is normally represented, identifies the specific comparison that decides whether the omission matters, and states plainly that its existing result is conditional on that comparison. It ends up being a better answer than a candidate who had modelled slosh but never asked whether it mattered.
:::

## What must not follow "I do not know"

**A recovery monologue.** Two minutes on an adjacent topic you do know reads as evasion, and it costs the room's time in a session where other people are waiting to ask things.

**An apology.** "Sorry, I should probably know that." The panel did not experience it as a transgression until you framed it as one.

**"I will look it up and get back to you," as the whole answer.** You will not, they know you will not, and it is a way of not answering now.

::: warning
The mirror-image failure is hedging on things you do know. "I think the mean NEES was around six" — when it was $6.067$ and you could state the band it sat inside — is the habit the rehearsal exercise tells you to hunt for on the recording, and it is more damaging than it looks. Hedging is a signal; spending it on facts you are certain of means it carries no information when you genuinely mean it, and a panel that hears "I think" on measured results starts wondering which of your numbers you actually checked. Be calibrated in both directions: flat and specific on what you measured, explicit and bounded on what you did not.
:::

## Rehearsing the one thing you cannot rehearse

You cannot rehearse the specific question that will catch you, but you can rehearse the response. Two practical steps.

First, put questions you cannot answer into the thirty-question list deliberately. The exercise asks for the hardest questions a panel could ask, and the list is doing its job when some of them have no answer — those are the ones to practise the three-part response on, out loud, until the opening clause arrives without hesitation.

Second, decide the opening clause in advance and use the same one every time: "I have not measured that." "I did not model that." "I do not know that formulation." A fixed opener removes the half-second of panic in which people start improvising, and it is in that half-second that a guess gets born.

## Check yourself

::: check
Explain why one detected guess is more costly than the gap it was covering, in terms of what the panel can conclude afterwards.
:::

::: answer
Because the damage is not local. Once the panel has caught one confident statement that was not grounded, they have no way to distinguish your measured claims from your confident ones, so every number and verification result you reported earlier is re-evaluated as potentially the same kind of statement. You cannot repair it within the session, since the repair would consist of more confident statements. The gap itself would have cost fifteen seconds and nobody expects a candidate to have measured everything.
:::

::: check
State the three parts of the answer and explain why the order matters.
:::

::: answer
The admission, short and first; the bound, if one exists; then the method by which you would find out. The order matters because of how it lands: admission first reads as somebody who knows the shape of their own ignorance and is getting straight to it, while the same three components delivered in reverse — method, bound, then finally the admission — reads as working up to a confession, and the preamble makes the eventual admission sound reluctant rather than matter-of-fact.
:::

::: check
A panel member asks about a formulation you have never encountered. Give the response this lesson recommends, and explain why it is not a concession.
:::

::: answer
Say plainly that you do not know it and have not worked with it, then ask what it buys over the approach you used — and, once told, reason out loud about whether it would help on your own problem. It is not a concession because it converts a dead end into a technical exchange in which the panel watches you absorb an unfamiliar idea and evaluate it against a system you know well. That is a closer simulation of working with you than most of the rehearsed questions, and it produces information about you that a smooth deflection would not.
:::

::: check
A candidate is asked for a quantity they never measured and has no directly applicable number. Give three distinct sources a usable bound can come from, with an example of each.
:::

::: answer
A physical limit — you cannot remove stored momentum along the magnetic field direction with a magnetorquer, since the achievable torque is proportional to the perpendicular component only. A budget already computed — if the worst-case disturbance accumulation over an orbit is $2.40\times10^{-3}\,\mathrm{N\,m\,s}$, anything driven by that disturbance is bounded by it. A detectability argument built from two numbers you already have — with $5\times10^{-5}\,\mathrm{rad}$ star-tracker noise and a $100\,\mathrm{s}$ window, a gyro bias above about $5\times10^{-7}\,\mathrm{rad/s}$, roughly $0.10\,^\circ/\mathrm{hr}$, is observable and anything far below is not. An order-of-magnitude estimate from the mechanism is a fourth, provided it is labelled as an estimate rather than a measurement.
:::

::: check
Why is hedging on a number you actually measured described here as more damaging than it appears?
:::

::: answer
Because hedging is a signal with a limited budget. Saying "I think it was around six" about a result you measured as $6.067$, with a known acceptance band, spends that signal on something certain, so when you hedge about something genuinely uncertain the panel cannot tell the difference. Worse, a panel that hears tentative language attached to measured results starts asking which of your numbers were actually checked — turning a verified result into an open question. The goal is calibration in both directions: flat and specific about what you measured, explicit and bounded about what you did not.
:::

## Summary

| Item | Statement |
| --- | --- |
| The response | Say it; give a bound if one exists; name the method that would settle it |
| Order | Admission first and short — preamble turns an honest answer into a confession |
| Why bluffing is expensive | One detected guess retroactively devalues every measured claim you made |
| Kind one | Not measured — bound and measurement |
| Kind two | Out of scope — name the boundary; it should already be in your assumptions section |
| Kind three | Unfamiliar concept — say so, ask what it buys, then reason about it live |
| Bound sources | A physical limit, a budget already computed, a detectability argument, a labelled order-of-magnitude estimate |
| Never | A recovery monologue, an apology, or "I will get back to you" as the whole answer |
| Mirror failure | Hedging on measured numbers, which spends the signal you need for real uncertainty |

The next lesson takes a whole talk built out of this material: the project whose result was negative, or that never finished.
