---
id: l07-rounds-on-how-you-think
title: "The onsite rounds on how you think"
minutes: 19
covers:
  - "onsite composition: past-project presentation, 2 to 3 coding rounds, 1 to 2 systems and architecture rounds, 1+ domain-knowledge round, abstract problem solving, physics puzzles and Fermi estimation"
---

The second kind of onsite round is not about what you have built. It is about what you do when a problem is put in front of you that you have not seen before, and there is nowhere to look it up.

Three items from the day's composition belong to this kind: one or more **domain-knowledge rounds**, and the **abstract problem solving, physics puzzles and Fermi estimation** that appear across the day. They differ from the presentation and the coding rounds in a way that changes how you prepare for them. There is no artefact to accumulate. You cannot bring a portfolio to a Fermi question. What you can bring is a method you have executed enough times that it survives being nervous, and that is genuinely what these rounds reward.

This lesson maps the four of them, says what each is looking at, and gives the answering standard they share. As with the previous lesson, the training happens elsewhere — the eleventh and twelfth modules of this track drill the domain material and the first-principles material respectively, to a considerably higher standard than a map requires.

## The domain-knowledge round

At least one round, and possibly more, is about the engineering subject matter of GNC: control, estimation and astrodynamics. This is the round the technical track of this curriculum exists to prepare you for, and it is where twenty modules of stability margins, Kalman filtering, attitude determination and orbit determination get examined by somebody who does that work.

What is being tested is ownership rather than recall. There is a real difference between having read that phase margin is the additional phase lag a loop can absorb before instability and being able to say what that means for a specific loop, why gain margin alone does not cover it, and what a delay in the loop does to the picture. The first survives a definition question and collapses on the follow-up. The second is what a round with an engineer on the team is built to find.

The answering standard for this round is worth learning as a fixed sequence, because it works under pressure and because it is the same sequence the domain module of this track teaches at length: **state your assumptions, write the equation, interpret it physically, then sanity check**. Each step earns something specific. The assumptions tell the interviewer what problem you are solving, which is the step whose absence causes most of the disagreements in these rounds. The equation shows the mechanism rather than the conclusion. The physical interpretation demonstrates that the symbols mean something to you. And the sanity check — a limiting case, a dimensional argument, an order-of-magnitude comparison — is the step that separates an engineer from someone who has done the algebra.

## Abstract problem solving and physics puzzles

Somewhere in the day you will be asked something that is not a GNC question at all. It might be a physical situation with a surprising answer, a question about a system you have never thought about, or a problem deliberately posed without enough information.

The purpose is not to see whether you know the answer. It is to watch you approach a problem with no rehearsed route to it, which is a genuinely useful thing to observe about someone whose job will involve unfamiliar problems weekly. The behaviours that are visible under that observation, and that you can prepare deliberately: whether you ask what is actually being asked before answering; whether you name the governing principle rather than pattern-matching to a similar-looking problem; whether you state the regime and the assumptions you are working in; whether you check the answer against a limiting case; and whether, when you are stuck, you say so cleanly and keep working rather than producing confident noise.

That last one deserves emphasis, because candidates get it wrong in a specific and avoidable way. "I do not know" is an acceptable thing to say. "I do not know, and here is how I would find out" is a better one, and it is a different answer rather than a softened version of the same one — it tells the interviewer what you would actually do at a desk on a Tuesday, which is the thing they are trying to learn. Bluffing is the only option that fails outright, because an engineer asking the question can tell, and what they learn is not about the puzzle.

::: warning Confident noise is worse than a clean stop
Filling a silence with plausible-sounding physics is the single most damaging habit in these rounds. It converts a question about a puzzle into a question about whether your confident statements can be trusted, which is a much worse question to have raised. Say what you know, say where it stops, and say what you would do to close the gap.
:::

## Fermi estimation

A Fermi question asks you to produce a number, to within an order of magnitude, from knowledge you already carry rather than from a reference. It is the most mechanical of these rounds and therefore the most improvable by practice.

The method has five steps and they are always the same. **Decompose** the quantity into factors you can each reason about. **Bound** each factor — an upper and a lower value you would be surprised to be outside. **Multiply** them through. **Sanity check** the result against something you know independently. **State your uncertainty**, because a Fermi answer without a stated confidence is being presented as more than it is.

The step candidates skip is the fourth. An estimate that has been cross-checked against a second, independent route is qualitatively better evidence than one that has not, and producing that second route is usually cheap. It is also the step that catches the arithmetic slip that would otherwise leave you defending a number that is a factor of a thousand off.

::: key
Fermi method: decompose into factors, bound each one, multiply, sanity check against something you know independently, and state your uncertainty. The sanity check is the step candidates skip and the one that earns the round.
:::

## What is not knowable in advance

Whether Fermi estimation and puzzles occupy a round of their own or appear inside the domain and systems rounds, how many domain rounds you get beyond "one or more", which subject area the domain round lands on, and whether any of this is scored on its own axis — none of that is fixed by anything this curriculum can rely on. The composition statement gives the ingredients, not the recipe for your particular day.

This uncertainty is less costly here than it would be elsewhere, because the preparation is the same whichever way the day is arranged. Method carries across all four of these: assumptions first, mechanism visible, physical interpretation, sanity check, honest boundaries. A candidate who has that as a habit is prepared for a domain round, a puzzle and an estimation question with the same work.

::: example A Fermi question, worked the way the round wants
A candidate is asked, near the end of a domain round: roughly what mass of air sits above one square metre of ground at sea level? She has no reference and about three minutes.

She starts by saying what she is going to use: pressure is force per unit area, and the force holding that column up is its weight, so the mass per square metre is the sea-level pressure divided by gravitational acceleration. She states her two inputs — about 101 kilopascals at sea level, and about 9.8 metres per second squared — and notes the assumption that she is treating the column as static, which is what "the weight equals the pressure force" requires.

The arithmetic: 101,000 newtons per square metre divided by 9.8 metres per second squared gives about 10,300 kilograms. She says the number as "about ten tonnes per square metre, call it ten to the four kilograms."

Then she does the step that earns the round. She checks it a second way: near the surface air has a density of roughly 1.2 kilograms per cubic metre, and the atmosphere thins with height on a scale of around eight or nine kilometres, so a crude column is 1.2 times 8,500, which is about 10,200 kilograms. Two independent routes landing within a few per cent of each other is far stronger than either alone, and she says so rather than leaving the interviewer to notice.

She closes by stating her uncertainty honestly: the pressure figure she is confident in, the scale height she is not, so she would quote the answer as ten to the four kilograms per square metre and not defend the third significant figure. Three minutes, a stated method, a cross-check, and a bounded claim.
:::

::: example A domain question outside her preparation
A candidate has prepared hard on classical control and Kalman filtering. The domain round opens with unscented filtering and sigma points — material she has read about once and never implemented.

The bad version of the next sixty seconds is available to her and she does not take it: she could produce two remembered sentences about sigma points capturing the distribution better than a linearisation, deliver them confidently, and hope the follow-up does not come. It always comes.

What she does instead has three parts. First she says plainly where she is: she has implemented extended Kalman filters and understands the linearisation they rest on, but she has not built an unscented filter and is working from reading rather than from experience. That single sentence sets the terms of everything after it honestly.

Second, she reasons forward from what she does own. The extended filter linearises the dynamics about the current estimate and propagates the covariance through that linearisation, so it should degrade when the dynamics are strongly nonlinear across the spread of the current uncertainty. She names the mechanism: it is the Jacobian at a point standing in for the behaviour over a region. From there she can say what a method that avoids linearising would have to do — propagate a set of representative points through the true nonlinear dynamics and reconstruct the statistics from where they land — and observes that this is what she understands sigma points to be for.

Third, she says what she would do to close the gap properly: implement it on a problem where she already has an extended filter, and compare the two where the nonlinearity is strongest, because that is where any difference should appear.

She did not know the material. The interviewer now knows exactly how much she knows, has watched her derive the purpose of a method she has not used from a mechanism she does own, and has heard a concrete plan for learning it. That is a substantially better outcome than a confident two sentences would have produced, and it was available only because she started by saying where she actually was.
:::

## Check yourself

::: check
State the four-step answering standard for a domain round, and say what each step earns.
:::

::: answer
State your assumptions, write the equation, interpret it physically, sanity check. The assumptions tell the interviewer which problem you are solving, and omitting them is the usual source of disagreement in these rounds. The equation shows the mechanism rather than just the conclusion. The physical interpretation demonstrates that the symbols mean something to you rather than being manipulated formally. The sanity check — a limiting case, a dimensional argument, an order-of-magnitude comparison — is what distinguishes engineering from completed algebra.
:::

::: check
What are physics puzzles and abstract problems actually testing, given that the interviewer knows you have not seen the problem before?
:::

::: answer
They test approach rather than knowledge: whether you establish what is being asked before answering, whether you name the governing principle instead of pattern-matching to a superficially similar problem, whether you state the regime and assumptions, whether you check the result against a limiting case, and what you do when you are stuck. That last is the most informative, because unfamiliar problems arrive weekly in the actual job and how someone behaves in front of one is directly predictive.
:::

::: check
Give the five steps of the Fermi method and name the one candidates skip.
:::

::: answer
Decompose into factors, bound each factor, multiply through, sanity check against something known independently, and state your uncertainty. The skipped step is the sanity check. It is usually cheap to produce a second independent route to the same quantity, and doing so both catches arithmetic errors that would otherwise go undetected and makes the estimate qualitatively better evidence than a single unverified chain.
:::

::: check
Why is "I do not know, and here is how I would find out" a different answer from "I do not know" rather than a politer version of it?
:::

::: answer
Because it supplies information the first does not. It tells the interviewer what you would actually do at your desk when you hit this gap — which reference, which experiment, which simpler case you would work first — and that behaviour is a large part of what the round is trying to observe. The first answer closes the topic; the second continues it with evidence. Both are far better than bluffing, which converts a question about the problem into a question about whether your confident statements can be trusted.
:::

::: check
A candidate is told that her onsite includes "one or more domain rounds" and cannot find out which subject area they will cover. Why is this less costly than it sounds?
:::

::: answer
Because the preparation that serves these rounds is method rather than a specific syllabus, and the method is shared across all of them: assumptions first, mechanism visible, physical interpretation, sanity check, honest boundaries when you reach them. A candidate who has that as a habit is equally ready for a control question, an estimation question, a puzzle and a Fermi problem. The subject-matter depth still has to exist, but which slice of it is examined changes the preparation far less than the absence of a method would.
:::

## Summary

| Round | What it examines | The move that works |
| --- | --- | --- |
| Domain knowledge (1+) | Ownership of control, estimation and astrodynamics | Assumptions, equation, physical interpretation, sanity check |
| Abstract problem solving | Approach to an unrehearsed problem | Establish the question, name the principle, state the regime |
| Physics puzzles | The same, with a physical system | Limiting cases and dimensional arguments as checks |
| Fermi estimation | Producing a bounded number from what you carry | Decompose, bound, multiply, cross-check, state uncertainty |
| All four | What you do at the edge of your knowledge | "I do not know, and here is how I would find out" |

The next lesson covers the remaining round type, and the only one whose material is not technical at all: the behavioural and culture round, and the STAR structure it is answered in.
