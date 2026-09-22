---
id: l04-talk-structure-and-the-clock
title: "Seven parts, and what each one gets of the clock"
minutes: 20
covers:
  - "talk structure: problem, why it was hard, approach, the key decision and the alternatives rejected, verification, result, what you would do differently"
---

Seven parts, in this order: problem, why it was hard, approach, the key decision and the alternatives you rejected, verification, result, what you would do differently. The order is not arbitrary and the structure is not a template for its own sake. Each part answers a question the panel is going to ask anyway, and putting it where it belongs means the question gets answered before it interrupts something else.

What makes the structure hard to follow is not the structure. It is the clock. Ten to twenty minutes is short for any real engineering project, and the natural way to spend it — a long, comfortable tour of what you built — leaves thirty seconds for verification and nothing at all for the two parts that carry the round. So this lesson is as much about the minute allocation as about the parts, because a structure you cannot fit into the time is a structure you will abandon halfway through.

::: key
Talk structure for 10 to 20 minutes: problem; why it was hard; approach; the key decision and the alternatives you rejected; verification; result; what you would do differently. The rejected-alternatives section is the one panels remember.
:::

## What each part is actually for

**Problem.** The requirement, stated as a bar to clear rather than as an activity. "Land within a stated miss distance given a bounded thrust envelope" rather than "explored powered-descent guidance." Put a number in it. Everything after this is meaningless without it, which is why it goes first and why it must be legible to the least specialised person in the room.

**Why it was hard.** The part candidates skip, and the part that calibrates everything else. Without it the panel has no way to know whether your result is impressive or routine, and their default assumption is routine. This section names the specific difficulty — a non-convex constraint, a direction of the state that is unobservable from the available geometry, a coupling between two subsystems that cannot be designed separately — in one or two sentences, technically.

**Approach.** What you built, at the level of the one diagram that carries the talk. Not a tour of the code. The test of whether this section is the right length is whether the panel can follow the verification section afterwards; anything beyond that is detail the questioning will ask for if it wants it.

**The key decision and the alternatives you rejected.** One decision. Named alternatives, each with the specific reason it lost and the condition that would have flipped it. This is the section panels remember, and the reason is not mysterious: every other section describes an outcome, and this one is the only direct evidence that there was engineering judgement rather than a single path taken because it was the first one that worked.

**Verification.** How you know the thing is right — an analytic case matched to a stated tolerance, a conserved quantity that stayed conserved, a convergence rate that behaved as the method predicts, a consistency test against a statistical band. This is the section a panel of engineers will probe hardest, because it is the one most projects do not have.

**Result.** The numbers, with units, and the worst case alongside the mean wherever there were repeated trials. A result section is what happened when it ran, not a description of what the code is capable of.

**What you would do differently.** Specific and technical, closing the talk on the limits of your own work. Not an apology.

## The clock

Here is a fifteen-minute allocation that fits, with the seven parts summing exactly: $1.5+1.5+3+3+3+2+1 = 15$.

| Part | Minutes | What has to be in it |
| --- | --- | --- |
| Problem | 1.5 | The requirement with a number in it |
| Why it was hard | 1.5 | The specific difficulty, named technically |
| Approach | 3 | The carrying diagram, and what you built versus what a library did |
| Key decision and rejected alternatives | 3 | One decision, named alternatives, the reason each lost |
| Verification | 3 | The evidence, with the tolerance or band it was checked against |
| Result | 2 | Numbers with units; worst case as well as mean |
| What you would do differently | 1 | One or two specific, technical changes |

Notice where the time goes. Six of those fifteen minutes — the key decision and verification together — are spent on the two things a panel cannot get from your repository and cannot infer from a plot. Three minutes go to establishing what the problem was and why it resisted. The section that feels like the talk, the description of what you built, gets three minutes and no more.

Compare that with the allocation almost everyone produces on a first pass: eight to ten minutes of approach, a minute of results, verification compressed to the sentence "I validated it against the analytical solution and it matched," and "what I would do differently" dropped because the clock ran out. That talk has spent two thirds of its time on the part of the round that was never in doubt.

If the format is ten minutes rather than fifteen, compress proportionally rather than deleting a section: $1+1+2+2+2+1.5+0.5 = 10$. Every part survives, because a talk missing its verification section is not a shorter talk, it is a different and much weaker one.

::: warning
Never build a talk to the upper end of a stated range. If the format is ten to twenty minutes, build fifteen and know how to cut to ten. You do not control when the room actually starts: a panel that convenes five minutes late takes those five minutes out of your talk, not out of the questioning, and the sections you lose are the ones at the end — verification, result, and what you would do differently. A talk built at twenty minutes has no margin at all, and the failure mode is being cut off in the results section, which is the single worst place to stop.
:::

## The first ninety seconds, worked

::: example Problem and why-it-was-hard, on anchor project A
**Weak.** "So this project is a six-degree-of-freedom simulation of a launch vehicle. I wrote it in Python with NumPy, and it propagates the translational and rotational states together using an RK4 integrator. I built it over about six months and added features as I went, starting with three degrees of freedom and then adding attitude."

Ninety seconds of this and the panel knows what the artefact is and nothing about whether it is any good. There is no requirement, so there is nothing yet to evaluate; there is no difficulty named, so the default assumption is that there was none; and the chronology — I started here and added that — is the shape of a hobby, not of an engineering project.

**Strong.** "The requirement was to predict the vehicle's structural and control loads through max dynamic pressure well enough to size control authority, across the dispersions the vehicle would actually fly through — not on a single nominal trajectory. Two things made that hard. First, the loads follow dynamic pressure, and dynamic pressure follows atmospheric density, where a single-scale-height exponential model is about $30\%$ high by $20\,\mathrm{km}$ and nearly a factor of two high by $30\,\mathrm{km}$, so the convenient model is wrong exactly where the answer matters. Second, the attitude loop and the trajectory are not separable: a thrust misalignment is simultaneously a disturbance torque and a trajectory perturbation, so a three-degree-of-freedom answer cannot bound the control authority I needed to size."

**What separates them.** The strong version states a bar to clear, then names two specific technical difficulties — one about model fidelity with a number attached, one about coupling — in about the same number of words. It has also, quietly, pre-empted the two most likely first questions, which are why a layered atmosphere and why six degrees of freedom rather than three.
:::

## The key decision section, worked

This is three of your fifteen minutes and it has a shape: state the decision, name the alternatives, give the criterion each one lost on, and say what would have changed your mind.

::: example The decision section, on anchor project B
**Weak.** "I used a convex formulation because convex problems can be solved reliably and quickly, which is important for onboard guidance. I discretised into forty nodes and solved it with an interior-point solver."

This is a description of what was done with a generic justification attached. Nothing in it could have come out the other way, which means it is not yet a decision.

**Strong.** "The decision was to fix the final time rather than solve for it. The thrust lower bound is the non-convex part of the problem — a real engine cannot throttle through zero — and lossless convexification handles that exactly, with a slack variable and a theorem that the relaxation is tight, so I checked it was tight on my own solutions rather than citing it: the maximum gap between the thrust magnitude and its slack across the returned trajectories was at solver tolerance. Final time is a separate choice. Free final time makes the problem non-convex again unless you line-search over it, which is a solve per candidate time; fixed final time is one solve. I took the single solve, and I know what it cost, because the dispersion campaign priced it: $4.0\%$ of 500 cases returned infeasible — no trajectory exists meeting both terminal conditions inside the actuator bounds in exactly twenty seconds. That fraction is the number I would report first, ahead of the mean landing accuracy. What would have changed my mind is the operational requirement: if the vehicle has to land from a dispersion set this wide with no abort, a $4\%$ no-solution rate is not acceptable and the two-stage architecture that finds a feasible landing point first is worth the extra solve."

**What separates them.** One decision, isolated from the others around it. An alternative named with its actual cost in solves, not dismissed. A number that prices the choice, produced by the candidate's own campaign. And a stated condition under which the decision reverses — which is what turns a preference into an engineering decision. It also runs about ninety seconds spoken, leaving room for the second decision if the panel wants one.
:::

## What you would do differently is not an apology

Candidates hear this section as a confession and write it as one: "I should have tested more," "I ran out of time," "with more experience I would have done it better." None of that is useful, and a panel reads it as either false modesty or a real admission that the work was rushed.

The section works when it is specific, technical, and about a limit of the work rather than a limit of the worker. The test is whether your answer names something a reviewer could have raised as a criticism — because if it does, you have raised it first, which is a much stronger position than being asked about it.

For each anchor project, the honest version is already written down in its limitations section:

- **Anchor A** — the attitude control gains were tuned against the nominal trajectory and never re-checked against the dispersion set the Monte Carlo used, so the campaign tests whether that tuning happened to generalise rather than whether it was designed to.
- **Anchor B** — fixed final time, priced at a $4.0\%$ infeasible rate; the next version is the two-stage feasibility-then-fuel architecture.
- **Anchor C** — this is verification, not validation: the covariance-to-error consistency was established inside the simulation that generated both, and nothing here checks that the assumed gyro and star-tracker noise models describe real hardware.
- **Anchor D** — the outlier handling is a simple residual edit against a fixed threshold, and unmodelled dynamics such as drag variation get absorbed into the estimate rather than being carried as a consider parameter.
- **Anchor E** — the desaturation law was demonstrated against a perfectly modelled field and a perfectly aligned torquer; the margin of about $11.8$ is not yet a demonstrated margin under torquer misalignment and field-model error.

Each of those is one sentence, names a specific technical gap, and points at what the next version does about it.

## Check yourself

::: check
A candidate's fifteen-minute talk gives eight minutes to describing what he built, one minute to results, and compresses verification to a single sentence. Name the two sections this allocation has effectively deleted, and why their loss is more costly than the description's gain.
:::

::: answer
It has deleted verification and the key-decision-with-rejected-alternatives section, and it has probably lost "what you would do differently" to the clock as well. Those are the sections a panel cannot obtain any other way: the description of what was built is available from the repository or the write-up, while the evidence that it is right and the reasoning behind the central choice exist only in the candidate's head until spoken. Two of the four evaluation axes — technical depth and defending engineering decisions under questioning — are carried almost entirely by the deleted sections, so the allocation spends its time on the part of the round that was never in doubt.
:::

::: check
Why does this lesson insist that a talk be built at fifteen minutes when the stated format is ten to twenty?
:::

::: answer
Because you do not control the start. A room that convenes late takes the lost time out of the talk rather than out of the questioning, and the sections that fall off the end are verification, result and what you would do differently — the strongest material in the talk. A fifteen-minute build inside a ten-to-twenty-minute window has five minutes of margin in each direction: it can be compressed to ten by scaling every section rather than deleting one, and it finishes cleanly with time left if the room runs long. Building at twenty leaves no margin and makes being cut off mid-results the likely outcome.
:::

::: check
A candidate says: "I chose a convex formulation because convex problems solve reliably and quickly." Explain why this is not yet a defence of a decision, and what would make it one.
:::

::: answer
Because nothing in it could have come out the other way — it is a generic property of convex problems attached to a choice already made, not a criterion applied to this problem. It becomes a decision when it isolates one specific choice, names the alternative that was rejected, states the cost that decided it, and gives the condition that would reverse it: fixed against free final time, priced at one solve versus a line search over candidate times, with the fixed choice costing a $4.0\%$ infeasible rate across the dispersion set, and the reversal condition being an operational requirement that cannot tolerate a no-solution case.
:::

::: check
Why does "why it was hard" get its own section rather than being folded into the problem statement?
:::

::: answer
Because the problem statement establishes the bar and the difficulty section establishes the scale of the bar, and a panel that hears only the first has no way to calibrate the result. Their default assumption in the absence of a stated difficulty is that the problem was routine, which makes even a strong result read as ordinary. Separating the two also forces the candidate to name the difficulty technically — a non-convexity, an unobservable direction, a coupling that prevents separate design — rather than gesturing at effort or duration, which is what the section degenerates into when it is folded into a general introduction.
:::

::: check
Rewrite this closing into a defensible "what I would do differently": "I would have liked to test it more thoroughly, but I ran out of time."
:::

::: answer
Something specific and technical, naming a gap a reviewer could otherwise raise. For the 6-DOF simulation, for example: "The attitude control gains were tuned against the nominal trajectory and never re-checked against the dispersion set, so the campaign shows the tuning generalised rather than that it was designed to — re-tuning inside the dispersion loop is the next thing I would do." That names a real limitation, explains its consequence for how the existing result should be read, and states the concrete fix. The original names only a shortage of time, which tells the panel nothing about the work and invites the question it was trying to avoid.
:::

## Summary

| Part | Minutes at 15 | Its job |
| --- | --- | --- |
| Problem | 1.5 | The requirement as a bar, with a number |
| Why it was hard | 1.5 | The specific technical difficulty, so the result can be calibrated |
| Approach | 3 | The carrying diagram; enough that verification makes sense, no more |
| Key decision and alternatives rejected | 3 | The section panels remember; criterion, cost, and what would flip it |
| Verification | 3 | Evidence against a stated tolerance or band |
| Result | 2 | Numbers with units, worst case as well as mean |
| What you would do differently | 1 | One specific technical gap and its fix — not an apology |
| Ten-minute version | — | Scale every section; never delete one |
| Build target | 15 | Inside a 10-to-20 window, so a late start costs margin rather than content |

The next lesson takes the slides these seven parts live on, starting with the one rule that does more work than every other slide-design rule combined.
