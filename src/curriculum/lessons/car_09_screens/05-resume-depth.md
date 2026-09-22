---
id: l05-resume-depth
title: "Three questions deep on every line"
minutes: 27
covers:
  - resume depth: expect to be asked to go deeper on any line you wrote
---

The rule is simple enough to state in one sentence: anything you wrote on your résumé is fair game, and you should expect to be taken at least three questions deep on any line the interviewer picks. Not the line you hoped they would pick. Any line.

That rule has a consequence most candidates do not follow through on. If every line is subject to a three-question interrogation, then the résumé is not a list of things you have been near — it is a list of commitments, each of which you have undertaken to defend under questioning, out loud, without notes, from an engineer who has done the same work. A line you cannot defend is not neutral. It is a trap you set for yourself and handed to the interviewer, and this module's own exercise states the outcome plainly: an interviewer will pick exactly that line. The mechanism is not mysterious — with limited time, the line most worth testing is the one that claims the most, and a line written aspirationally was usually written to claim a lot.

This lesson gives you the three questions, what a good answer to each looks like, how to run the interrogation on yourself, and what to do with the lines that fail.

## The three questions

They are always roughly these, in this order.

**What did you do?** Scope and content. What the thing was, what you personally did on it, and what came out.

**Why that way?** The decision. What the alternative was and why you did not take it.

**What would you change?** The judgment. With what you know now, what was wrong with it.

Each question is harder than the last, and the difficulty is not accidental. The first question can be answered from a well-written project description. The second requires that you actually made a decision rather than following a default. The third can only be answered by someone who lived with the consequences long enough to acquire a specific regret. That is why it is the question that separates people who did the work from people who described it, and it is the reason an interviewer asks it.

::: key
Expect any line you wrote to be taken three questions deep: what you did, why you did it that way, and what you would change. Anything you cannot survive three questions on should be rewritten or removed, because the interviewer will pick exactly that line.
:::

## What a good answer looks like at each depth

### Depth one: what did you do

Start at the technical content, not at the project history. The interviewer knows what a CubeSat is; they do not need the funding arrangement or the team's timeline.

Three things belong in the first thirty seconds: what the technical object was, what *you* personally did to it, and one specific fact that only someone who did the work would produce. A number, a threshold, a failure, a constraint. It is that third element that makes the answer land, because everything else can be reconstructed from a job description.

### Depth two: why that way

A good answer here names the alternative and the criterion. "I used a multiplicative formulation rather than an additive one, because the quaternion's norm constraint makes the four-by-four covariance singular" is a decision. "I used an extended Kalman filter" is a description.

There is an honest answer available when you did not choose: **say that you did not choose.** Much real engineering work is done inside decisions made before you arrived, and claiming ownership of one you inherited is the fastest way to fail the third question, since you cannot have a considered view of a choice you never made. The correct form is: *that was already the approach when I joined, and here is what I would have compared it against if it had been open.* That answer is strong. It is honest about scope and it still demonstrates the judgment being probed.

### Depth three: what would you change

This must be **specific and technical.** The characteristic weak answer is procedural — better documentation, better time management, more testing in general — which answers a behavioural question that was not asked and signals that no specific regret exists.

A strong answer names one thing, says what went wrong because of it, and says what you would do instead. It is allowed to be small. "I tuned the process noise by hand until the filter looked right, and I never checked the innovations for whiteness, so I have no idea whether it was actually consistent or just visually smooth — I would characterise the gyro with an Allan variance and set the process noise from that" is a complete answer to the third question, and it is better than a grander one, because it is checkable.

::: warning "I would document it better" is not an answer to the third question
It is the default when no technical regret comes to mind, and interviewers hear it constantly. The problem is not that documentation does not matter; it is that the sentence would be true of every project ever built and therefore carries no information about yours. If nothing technical comes to mind for a given line, that is diagnostic — it usually means you did not own the decisions on it, and the line should be rewritten to describe what you actually owned.
:::

## The ownership problem

Interviewers probe for the boundary between what the team did and what you did, and the probe is usually gentle: *and what was your part in that?*

Two failure modes sit on either side. Saying "we" throughout makes the boundary invisible, and an interviewer who cannot locate your contribution has to assume the smaller version of it. Saying "I" about work a team did is worse, because it is a false claim and it collapses the moment a follow-up reaches a part you were not involved in.

The construction that works is explicit and takes one sentence: **name the team's scope, then name yours.**

> "The team built the whole attitude determination and control subsystem. My piece was the estimator — the measurement models, the tuning, and the consistency testing. I did not work on the actuator drivers."

The last clause is the one candidates leave out and the one that buys the most credibility, because volunteering the boundary of your own contribution is something a person exaggerating would never do. It also protects you: having said it, a follow-up about actuator drivers becomes a conversation rather than an exposure.

::: key
State the team's scope and then your own, and volunteer where your contribution ended. An interviewer who cannot locate your personal contribution will assume the smaller version of it, and a claim that overreaches collapses at the first follow-up.
:::

## Running the interrogation on yourself

This module's exercise is blunt: hand your résumé to someone technical, have them pick any line, and go three questions deep. Every line. The instruction to cover every line rather than a sample is the whole point — the lines you would have chosen to rehearse are not the ones at risk.

Three practical notes on running it.

**The interrogator does not need your domain.** Any engineer can ask "why that way?" and "what would you change?" and can tell whether the answer contains a real decision. Domain expertise helps on the fourth question, not the first three.

**Record it.** You will not remember which answers were shaky; you will remember which ones felt shaky, and those are different sets.

**Grade against a fixed test,** not against a feeling. For each line, three boxes: did the first answer contain a specific fact only a participant could produce; did the second name an alternative and a criterion; did the third name a technical regret. A line that fails any box is not ready.

Then act on the result. A failed line has three possible fates, and only one of them is "prepare harder":

- **Rewrite it** to describe what you actually did. A line that overstates scope usually has a true, narrower version underneath it that is still worth having.
- **Remove it.** A line that exists only to add a keyword is worth less than the airtime it costs you when the interviewer picks it, and interviewers do pick it.
- **Go and close the gap**, if the line describes something you genuinely want to claim. This is the expensive option and sometimes the right one.

::: note Lines that attract the probe
Two kinds of line are worth identifying in advance as likely probe targets — not because anyone has measured which lines get asked about, but because of what each one offers an interviewer with limited time. The first is a named, heavy technique — an unscented filter, model predictive control, convex guidance — because naming one is a claim about depth and it is cheap to test. The second is a line with an impressive quantity in it: a percentage improvement, a margin, a runtime. Both are worth having *if they are true and you own them*, and both are expensive if they are decorative. Know which of your lines are in these two categories before the call, because those are the ones most worth rehearsing first.
:::

## Three lines, interrogated

::: example "Implemented an extended Kalman filter for attitude determination on a CubeSat simulator"
**Q1 — Tell me about the filter. What did you build?**

*Weak:* "So this was for a university CubeSat project. We had a team of about six and I was on the software side. I implemented an extended Kalman filter for attitude determination, using the gyro and the magnetometer and a sun sensor. It worked pretty well — we got good results in simulation."

*Strong:* "Attitude and gyro bias, so a six-state filter: three-parameter attitude error plus three bias states, with the quaternion carried as a reference and reset after each update. Measurements were magnetometer and coarse sun sensor, both as unit vectors compared against a reference model. My part was the estimator specifically — the measurement models, the tuning and the consistency testing. I did not write the sensor drivers."

**Q2 — Why a multiplicative formulation rather than estimating the quaternion directly?**

*Weak:* "That is just the standard approach for attitude filters — it is what the references I was working from used."

*Strong:* "Because the quaternion is four numbers with a unit-norm constraint, so it only has three degrees of freedom. If you put all four in the state, the covariance is singular in the direction of the constraint, and the filter either fights the normalisation or drifts off the unit sphere. The multiplicative form estimates a small three-parameter error about the current reference and folds it back in after each update, so the covariance is three-by-three and non-singular and the reference stays a unit quaternion by construction."

**Q3 — What would you change?**

*Weak:* "I would probably structure the code better and write more tests. And document the tuning process — it was pretty ad hoc."

*Strong:* "The tuning. I set the process noise by hand until the estimate looked smooth, which is not a criterion — I never checked whether the filter was actually consistent. Two things I would do now: characterise the gyro with an Allan variance and set the process noise from the measured angle random walk and bias instability rather than by eye, and then check the normalised innovations against their expected distribution and test them for whiteness. A filter can look beautiful and be overconfident, and I had no way of telling the difference."

**What makes the difference:** the weak answers are not wrong, they are empty. The first describes a team and a technology without a single fact that distinguishes this filter from any other; the second cites authority instead of a reason, which fails immediately if the interviewer asks *why is it standard?*; the third is procedural. The strong answers each contain something only a participant could say — the state dimension and the reset, the singular-covariance argument, the specific absence of a consistency check — and the third one names a real technical regret with a concrete remedy, which is what the question is for.
:::

::: example "Built a six-degree-of-freedom simulation in Python"
**Q1 — What is in it?**

*Strong:* "Rigid-body translational and rotational dynamics, quaternion attitude, a standard atmosphere, aerodynamic forces and moments from a coefficient table, thrust with a gimballed engine model, and the control law running at its own fixed rate. I wrote all of it; the aero coefficients came from a published dataset."

**Q2 — What integrator, and why?**

*Weak:* "I used an ODE solver from SciPy. It handled it fine."

*Strong:* "Fixed-step Runge–Kutta four, at a step that divides evenly into the controller rate. I did start with a variable-step solver, and it was more accurate per unit of work, but it was the wrong tool here for two reasons. First, the controller is a discrete system running at a fixed rate, so the simulation has to land exactly on those sample instants; a variable-step solver keeps stepping past them and you end up interpolating the very thing you are trying to evaluate. Second, I wanted bit-identical repeatability across Monte Carlo runs, and adaptive step-size control makes the trajectory depend on solver internals. Fixed-step RK4 is fourth-order accurate globally, which was far more than I needed at the step size the controller forced on me anyway."

**Q3 — What would you change?**

*Strong:* "Event handling. I detect staging and ground contact by checking a condition at the end of each step, which means the event is located to within one step and the state at the event is wrong by that much. For ground contact at the step sizes I was using, that is a real error in touchdown velocity. I would add proper event detection — bracket the sign change and solve for the crossing time — and, separately, validate the whole propagator against an analytic two-body case with the aero and thrust switched off, which I never did. I checked the sim against intuition, not against a closed-form answer."

**What makes the difference:** the weak second answer describes a tool rather than a decision, and it has no defence if the interviewer asks why a variable-step method is inappropriate here — which is precisely the follow-up it invites. The strong version names the alternative it rejected, gives two independent reasons rooted in the structure of the problem, and closes with a sanity check on the accuracy requirement. The third answer names one specific defect, quantifies its consequence, gives the fix, and adds a validation gap the candidate found themselves. Volunteering a known weakness you have already diagnosed is one of the strongest moves available in this round.
:::

::: example The ownership probe
**Interviewer:** You say here you developed the guidance algorithm for the landing phase. Walk me through your part in that.

*Weak:* "Yes, so we developed a guidance algorithm for the powered descent phase. We used a convex formulation, and we validated it in simulation across a range of dispersions. It performed well — we were able to hit the target consistently."

*Strong:* "I should be precise about the boundary. The formulation was already chosen when I joined — a colleague had done the convexification work and the problem setup. What I owned was the solver interface and the real-time side: I profiled the solve, found that the worst-case iteration count was the thing that would break the timing budget rather than the average, and changed the warm-start so that each solve started from the previous solution. I also built the dispersion campaign that we used to establish the worst case. I did not do the convexification, and I would not want to claim it."

**What makes the difference:** the weak answer uses "we" eleven times in four sentences, which leaves the interviewer with no way to locate the candidate's contribution, and the résumé line — *developed the guidance algorithm* — implicitly claims all of it. If the interviewer then asks why lossless convexification works, the candidate is answering for someone else's decision.

The strong answer gives up the biggest-sounding piece of the work and gains everything by it. It names a boundary unprompted, describes a contribution that is smaller in scope and far more specific in content, and includes the kind of detail — worst-case iteration count rather than average — that is unmistakably first-hand. It also leaves the candidate on solid ground for whatever comes next, because every claim in it is one they can take three more questions on.
:::

## Check yourself

::: check
Why is "what would you change?" the question that distinguishes candidates who did the work from candidates who described it?
:::

::: answer
Because a specific technical regret can only be acquired by living with the consequences of a decision. The first question can be answered from a well-written project summary, and the second can sometimes be answered from a textbook account of why the standard approach is standard. The third requires that you saw what the choice cost you — a defect it produced, a limit it imposed, a check you skipped and later wished you had not. Someone who only described the work has nothing specific to offer, which is why the fallback is always procedural: better documentation, more tests, better planning.
:::

::: check
A candidate is asked why they used a particular estimator architecture, and the honest answer is that it was already in place when they joined the project. What should they say, and why is this not a weak answer?
:::

::: answer
They should say exactly that, and then say what they would have compared it against had the choice been open: *that was already the approach when I arrived; if it had been mine to make I would have weighed it against this alternative, on this criterion.* It is not weak because the question is testing engineering judgment, not credit allocation, and the answer demonstrates the judgment while being accurate about scope. Claiming the decision instead is the weak option: it fails the third question, since you cannot have a considered view of the consequences of a choice you never made, and it will collapse under one more follow-up.
:::

::: check
Give the three boxes you should grade each résumé line against after an interrogation, and say what to do with a line that fails one.
:::

::: answer
First: did the answer to "what did you do" contain a specific fact that only a participant could produce? Second: did the answer to "why that way" name a real alternative and the criterion for rejecting it? Third: did the answer to "what would you change" name a technical regret rather than a procedural one? A line that fails any box has three possible fates — rewrite it to describe what you actually did and owned, remove it if it exists only to carry a keyword, or go and close the gap if it is a claim worth having. Only one of those is "prepare harder", and it is the least common right answer.
:::

::: check
Explain why volunteering the boundary of your own contribution — saying explicitly what you did *not* work on — strengthens rather than weakens an answer.
:::

::: answer
For two reasons. It is evidence of accuracy: someone inflating their contribution would not narrow it unprompted, so the disclaimer raises the credibility of everything else in the answer. And it is protective: once the boundary is stated, a follow-up into territory you did not own becomes an ordinary conversation about someone else's work rather than a moment where a claim comes apart. The alternative — leaving the boundary unstated — means the interviewer either has to find it by probing, which is worse, or assumes the smaller version of your contribution anyway.
:::

::: check
Which two kinds of résumé line are worth treating as likely probe targets, and what follows for how you prepare?
:::

::: answer
Lines naming a heavy, specific technique — an unscented filter, model predictive control, convex guidance — because naming one is a claim about depth and it is cheap for an interviewer to test. And lines carrying an impressive quantity, such as a percentage improvement or a margin, because a number invites the question of how it was measured. What follows is that these lines should be identified before the call and rehearsed first, and that any such line which is decorative rather than owned should come off the page: a claim you cannot defend is worth less than the airtime it costs when it is tested.
:::

::: check
An interviewer picks a line about a project you worked on three years ago and which you now barely remember. You have prepared thoroughly on everything recent. What has gone wrong, and what is the general lesson?
:::

::: answer
What has gone wrong is that the preparation was done on the lines the candidate would have chosen, and the interviewer chooses. Recency is not a defence: the line is on the page, so it is a commitment, and an interviewer with a thirty-minute budget may well pick the older project precisely because it looks distinctive. The general lesson is the reason this module's exercise says every line rather than a sample — if a line is too old to defend three questions deep, the options are to refresh it properly or to take it off, and the choice should be made before the call rather than discovered during it.
:::

## Summary

| Depth | Question | A strong answer contains | The weak default |
| --- | --- | --- | --- |
| One | What did you do? | A specific fact only a participant could produce | A project description with a team in it |
| Two | Why that way? | The alternative and the criterion | "It is the standard approach" |
| Three | What would you change? | One technical regret and its remedy | "Better documentation and more tests" |
| Ownership | What was your part? | Team's scope, then yours, then where yours ended | "We" throughout, or "I" over-claimed |

The next lesson takes the other half of the screen — the fundamentals — and deals with the constraint that defines it: producing a derivation out loud, with no surface to write on, in under five minutes.
