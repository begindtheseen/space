---
id: l01-five-talks-and-the-defence
title: The five-talk system, and rehearsing the defence
minutes: 22
covers:
  - The project presentation: choosing five topics, building a 10 to 20 minute talk for each, and rehearsing the defence rather than the delivery
---

A project talk in a GNC interview is not a status update, and treating it like one is the most common reason a candidate who did strong work reads as a weak candidate. A status update reports what happened. A project talk makes a claim — this problem was hard for a specific, statable reason, and here is what I did about it — and defends that claim against someone whose job for the next fifteen minutes is to find its weak point. The talk itself is maybe a third of what is being scored; the questions that follow are the rest, and for many panels the larger rest.

This matters more for a self-taught candidate than for one with a thesis defence already behind them, because that is exactly the setting where this skill gets built by accident. You have to build it on purpose: choose material that shows something specific, structure it so a stranger can evaluate it in the first thirty seconds, and spend most of your preparation time on the part that actually gets graded.

This lesson covers both halves: what to choose and how to build the ten-to-twenty-minute talk, and how to rehearse the defence — the questions — rather than the delivery. The next lesson covers the two specific reflective questions almost every panel asks somewhere in that defence.

## Choosing five topics that cover different ground

Five talks are not five variations on your best result. They are answers to five different implicit questions a panel is trying to close out, and picking topics that all answer the same question wastes four of five slots. A reasonable spread, and the one this module's exercises are built around: a guidance or optimization project, an estimation or filtering project, a simulation or software-architecture project, a verification or Monte-Carlo project, and one project that did not work.

The reasoning behind each slot tells you what to look for when deciding which project earns a place. Guidance or optimization answers "can this person turn a requirement into a solvable problem." Estimation answers "does this person understand what a state estimate actually is, with what confidence." Simulation or architecture answers "can this person build something others would have to maintain." Verification answers "does this person know the difference between a result that looks right and one that has been checked" — the most consequential question here, and the one a panel returns to across every other talk. The failure talk answers what none of the other four can: "what does this person do when the result is not clean."

If you have more than five candidates, choose by which combination leaves the fewest of those five questions unanswered, not by which project is individually most impressive — a second optimization project adds little if you already have one; an honestly-checked estimation project closes a gap the other cannot.

The failure talk deserves a separate word: candidates routinely leave it out, and a panel that hears four polished successes and no failure has learned nothing about how you behave when execution does not go your way — which, on a real program, is most days. A candidate who volunteers a failure story unprompted reads as more senior than one who has to be asked for one in a separate behavioural round. The next lesson builds that story in detail; here, the point is only that one of your five slots is reserved for it.

::: key
Five talks, five competencies: guidance or optimization; estimation or filtering; simulation or software architecture; verification or Monte Carlo; one project that failed. Pick each remaining slot to close a gap the others leave open, not to add a second example of a gap you have already closed.
:::

## The shape of a ten-to-twenty-minute talk

Every talk, regardless of subject, follows the same four-part shape, and the shape is not stylistic preference — each part exists to answer a question the listener has at that moment in the talk.

**Open with the problem and the requirement, not the method.** The first sentence should say what had to be true and why it was hard, before it says what tool you reached for. "I needed to land a simulated booster within a few metres of a target, with a guidance law that runs in real time and never returns infeasible" tells the listener what "good" means before you show them anything. "I implemented a second-order cone program for powered-descent guidance" does not — it hands over a method with no yardstick to judge it by, and invites exactly the wrong first question: "why that method," asked before the listener knows what it was for.

**State your contribution in one sentence, with a number in it.** Not "the guidance law performed well," but "the solver converges in under 200 ms across ten thousand dispersed initial conditions, with zero infeasible solves." The number is the difference between a claim the panel can evaluate and an adjective they have to take on faith — worth its own lesson later in this module. For now: if your one-sentence contribution has no unit in it, it is not finished.

**Show one plot that carries the argument, and know it cold.** One plot, not four — the single piece of evidence a skeptical reviewer would ask for if they could ask for only one thing: a dispersion of landing errors, a covariance history against the true error, a convergence curve. Name every axis, every unit, and every visible outlier without looking, because "what's that point over there" is a common interruption, and "I'm not sure, let me check" costs more credibility than almost any other stumble.

**Close with limitations and what you would do next.** Not an apology — a demonstration that you know the edges of your own result, which a junior engineer who got lucky cannot fake. "This assumes a rigid vehicle; the next step is a flexible-body check against the first bending mode" shows the panel you know what you have not shown, which is what "did you validate that, or only verify it" (below) is trying to find out.

A rough budget for a fifteen-minute talk: two to three minutes on the requirement, three to four on approach and the plot, two on results with numbers, two on limitations — the remainder disappears into questions, because it will. Do not plan a talk that assumes an uninterrupted delivery; plan one where every part stands on its own if the panel jumps straight to it.

::: example Outline: a powered-descent guidance talk
**Requirement (2 min).** "The vehicle must null horizontal velocity and hit a soft-landing target within a thrust lower and upper bound, using a guidance law that runs onboard and never returns infeasible, because an infeasible solve with no fallback is a loss of vehicle."

**Approach (4 min).** The nonconvex thrust lower bound relaxed via a slack variable, why the relaxation is lossless (the relaxed optimum always saturates the original constraint), and the resulting second-order cone program solved with a fixed iteration budget.

**Result (3 min).** "Across ten thousand dispersed initial conditions the solver returned a feasible trajectory in under 250 ms in the worst case, with zero infeasible returns." Show one plot: landing-position dispersion, target marked, worst-case point circled.

**Limitations (2 min).** "This is a point-mass, rigid-vehicle model with a fixed final time; it doesn't yet handle a free final time or a flexible structure." A specific next step, not a vague one.
:::

::: example Outline: a failure talk
**Requirement (2 min).** "I needed a navigation filter that was not only accurate on average but *consistent* — its reported uncertainty had to match its actual error, because a confidently wrong filter is more dangerous than an honestly uncertain one."

**What happened (4 min).** A single run looked fine, but a chi-square consistency test across a Monte Carlo set showed the filter was overconfident by roughly a factor of three: covariance said accurate to a metre, actual error routinely three. State the number, not the adjective.

**Diagnosis and fix (4 min).** How it was found (the consistency test, not eyeballing one trajectory) and what it was (a correlated sensor bias treated as white noise). Show the before-and-after consistency plot as the one plot.

**Limitations (2 min).** "This fix addressed one bias source; the full dispersion set hasn't been re-run to confirm no smaller unmodelled source remains." A specific loose end, not "there's probably more to do."
:::

## Rehearsing the defence, not the delivery

The exercise this lesson supports asks you to write out the twenty hardest questions somebody could ask about each project and answer every one, out loud, timed. Do this literally. The value is not a memorized answer — a panel can tell rehearsed from reasoned within a sentence — but having already done the thinking, so what comes out under pressure is recall of a real analysis rather than improvisation from nothing.

Four categories of question account for most of what you will actually be asked:

**"Why not X."** Why not an NLP instead of a convex program; why an EKF instead of a UKF; why a reaction wheel instead of a CMG. The format that works: name the alternative honestly, name the axis you judged it on, and name what you gave up. "An NLP can handle the nonconvex cost directly, but it has no convergence guarantee and no bound on solve time, and both matter more than optimality margin onboard" is a trade. "The convex approach is better" is a preference, and the systems-round lesson later in this module develops that distinction further, because it recurs in every kind of round.

**"How do you know."** How do you know your filter is consistent; how do you know the solver converged and did not merely stop; how do you know the simulation is right. These test whether a result was checked or only produced. Have the actual check ready — the consistency test, the convergence-flag audit across the whole Monte Carlo set, the comparison against an independent model.

**"What is your worst case, not your average."** An aerospace panel weighs the tail of the distribution over the middle, because the middle is not where a vehicle is lost. A talk that states only a mean or an RMS should expect this question — state the worst case in the talk itself and remove the question before it is asked.

**"Did you validate that, or only verify it."** Worth being precise about, since conflating the two loses credibility fast with an experienced panel. Verification asks whether you built the thing *right* — does the code correctly solve the equations you wrote down. Validation asks whether you built the *right* thing — do those equations describe the real system well enough to trust the result outside the simulation. A perfectly verified simulation of a wrong model is still wrong. Most self-taught projects can verify fully (check your own code against your own equations) but cannot fully validate (you rarely have hardware or flight data to check the model against), and the honest answer — "verified against an independent implementation and a closed-form case; not validated against hardware, which is the biggest gap here" — is stronger than pretending the distinction does not apply to you.

Success, as the exercise states it, is a written answer to all twenty questions, for each talk. If you cannot answer one, that is information about the project, not about your rehearsal: there is a gap in the work itself, and the fix is to close that gap while there is time, not to prepare a way to talk around it.

::: warning
A talk that survives only if delivered start-to-finish without interruption is a talk built wrong. Build each part — requirement, approach, result, limitations — so that it makes sense on its own, because a real panel will jump straight to your result or your limitations within the first two minutes and expect you to meet them there.
:::

::: warning
Rehearsing the *delivery* — running through the talk until the wording is smooth — produces a talk that breaks the moment it is interrupted, because the smoothness was memorized, not understood. Rehearsing the *defence* — answering the hard questions out loud, from different starting points, until the reasoning is fluent regardless of where the panel enters it — produces a talk that survives being interrupted, because interruption is exactly what you rehearsed for.
:::

## Handling the interruption itself

When a question arrives mid-talk, answer it directly before doing anything else. Do not say "I'll get to that" unless the answer genuinely depends on something you are about to show — and even then, give the short version now. Deferring a direct question reads as evasive even when the intent is only to protect the talk's structure, and the structure is not the point of the exercise.

You generally do not need to return to your planned outline afterward. If the question opens a thread worth following — "why not an NLP" leading into a real discussion of convex relaxations — following it is usually better signal than snapping back to your slide order, because unscripted technical exchange is exactly what the exercise exists to produce. If the conversation trails off, close the remaining gap in a sentence rather than restarting the section from the top.

::: key
Verification checks that the thing was built right, against its own specification. Validation checks that the right thing was built, against reality. A self-taught project can usually verify fully and validate only partially — say so, specifically, rather than letting the distinction pass unaddressed.
:::

## Check yourself

::: check
What are the four parts of the talk structure, in order, and what question does each one answer for the listener?
:::

::: answer
Requirement (what had to be true, and why it was hard) answers "what would count as success here." Contribution, as one sentence with a number, answers "did they achieve it, and how would I know." The one plot answers "show me, not only tell me." Limitations and next steps answer "does this person know the edges of their own result." Each part exists because a listener cannot evaluate the next part without it — you cannot judge a result with no yardstick, or trust one whose limits are hidden.
:::

::: check
Why does one of the five talks have to be about a project that did not work, rather than a fifth success?
:::

::: answer
Four polished successes tell a panel that you can execute, but say nothing about how you behave when execution does not go cleanly — and on a real program, it rarely does. A well-chosen failure talk answers that question directly and, offered without being asked, reads as more senior than the same story pulled out reluctantly in response to "tell me about a time something didn't work." It also gives you a controlled setting to demonstrate the recovery skills — diagnosing a wrong result, admitting an error, changing course — that the rest of this module treats as the highest-value material in the whole interview process. A fifth success cannot demonstrate any of that, no matter how impressive it is.
:::

::: check
You are two minutes into a talk about a Monte Carlo verification campaign, and your one-sentence contribution is "the simulation ran ten thousand cases and everything looked reasonable." What is wrong with that sentence, and how would you rewrite it?
:::

::: answer
It has no unit and no criterion: "looked reasonable" is an adjective standing in for a number, and it invites the question you should have pre-empted — "reasonable by what measure." A working version states the metric, the sample, and the pass criterion set in advance: "across ten thousand dispersed cases, landing CEP was 4.2 m against a 10 m requirement, with a 99.87th-percentile error of 11 m, and the pass criteria were fixed before the campaign ran." That sentence answers what was measured, how much data, and whether it was good enough, and leaves the panel a specific number to interrogate instead of a mood to accept.
:::

::: check
What is the difference between verification and validation, and why is a self-taught candidate especially likely to have done one but not the other?
:::

::: answer
Verification checks that the artefact was built correctly against its own specification — the code implements the equations you derived. Validation checks that the specification itself is trustworthy, so a result inside the simulation means something outside it. A self-taught candidate almost always has the tools to verify (an independent implementation, a closed-form case, a conservation law) but rarely has hardware or flight data to validate against. Say exactly that: state what was verified, name what validation would require, and never present a verified result as though it were validated.
:::

::: check
Midway through your talk, the panel asks "why didn't you use gradient descent instead of that convex solver?" What does a strong answer do in the first ten seconds that a weak answer does not?
:::

::: answer
A strong answer names the alternative on its own terms, states the axis being judged (here: convergence guarantee and bounded solve time, which gradient descent gives neither of by default), and says what switching would cost — "gradient descent carries no certificate of global optimality and no bound on iteration count, and both matter more here than raw simplicity." A weak answer either dismisses the alternative with no reason, or concedes ground it does not need to without having thought it through. The difference is whether the answer sounds like a trade that was made, or a preference that was never examined.
:::

::: check
Your plotted result shows one clear outlier — a single dispersed case with an error five times the rest. The panel points at it and asks what happened. What is the worst way to respond, and what should you have already done before the talk to avoid it?
:::

::: answer
The worst response is not knowing, followed by guessing: "I'm not sure, maybe a solver issue" suggests the plot was generated but never read, in front of a panel testing exactly whether you know your own data. Before the talk, identify every visible outlier in your chosen plot and its specific cause (an edge-of-envelope initial condition, a near-singular geometry, a convergence flag that should have failed and did not). A later lesson covers the honest fallback for genuinely not knowing something; for a plot you chose to show, not knowing at all is avoidable, and avoiding it is part of preparing the talk.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Five competencies | Guidance/optimization, estimation/filtering, simulation/architecture, verification/Monte Carlo, one failure |
| Talk structure | Requirement, then contribution (one sentence, one number), then one plot known cold, then limitations and next steps |
| Verification | Was the artefact built correctly against its own specification |
| Validation | Is the specification itself trustworthy against reality |
| Rehearse the defence | Write the twenty hardest questions per talk and answer each aloud, timed — not the delivery, the questions |
| On interruption | Answer what was asked, directly, before returning to structure; often you should not return to the structure at all |

The next lesson takes the two questions almost every panel asks somewhere in this defence — "what would you do differently" and "what was the hardest bug" — and builds concrete, rehearsable answers to both, alongside the wider behavioural round they belong to.
