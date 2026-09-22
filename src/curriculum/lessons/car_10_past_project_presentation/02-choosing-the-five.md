---
id: l02-choosing-the-five
title: "Choosing five topics you would be content to be handed"
minutes: 19
covers:
  - "choosing five topics so that every one is defensible and each shows a different competency"
  - "the trap of listing a project you cannot defend in depth"
---

The submission list is the first artefact of this round and the only one you build before you know what you will be presenting. It is also the one place where a mistake cannot be recovered on the day: if the panel selects a topic you cannot defend, no amount of slide craft or composure fixes it, because the round is thirty minutes of questions about decisions that were not yours or that you cannot reconstruct. The cost of a weak entry is incurred at submission, weeks before anyone walks into the room.

So treat the list as an engineering artefact with a requirement, and audit it against that requirement the way you would audit anything else. There are two rules, and a list that satisfies only one of them is a list with a known defect in it.

The first rule is that every entry has to be defensible at depth — the standard this module sets is that you could survive thirty minutes of questions on it. The second is that each entry should show a competency the others do not. The rules pull against each other slightly, which is the point: the first rule alone would let you submit five variations of the project you know best, and the second alone would tempt you to reach for an unfamiliar project just to fill a slot.

## Rule one: defensible at depth, every one of them

::: key
Topic selection is strategically critical because you do not choose which one you present. Every one of the five must be defensible at depth, so a topic you cannot survive thirty minutes on is a liability sitting in the submission, not a spare option.
:::

"Defensible at depth" is not a feeling about a project; it is a testable property, and the test is cheap. For each candidate topic, write down the single hardest question a GNC engineer could ask about it, and then answer that question out loud, in about thirty seconds, without notes. Not "I could look that up." Out loud, now.

The questions that do this job are not obscure. They are the same three every time: what did you assume, how do you know it works, and what would you do differently. If the honest answer to any of the three is a paraphrase of the project description, the entry has failed the test — and it has failed it in your kitchen, at no cost, instead of in front of eight engineers.

The portfolio module's exercise on this asks for four things per topic: a one-line title, the competency it demonstrates, the hardest question you expect, and an honest self-rating of how well you could defend it for thirty minutes. The rating is the part people fudge. A self-rating is only useful if it has a threshold attached, so attach one: anything you would not be content to present if it were chosen at random does not go on the list at all. There is no seven-out-of-ten entry. There are entries and there are cuts.

## Rule two: five different competencies, not five projects

A panel that chooses one topic still reads all five. The list itself says something about the range of work you can do, and five entries that all demonstrate the same competency waste four of those signals.

The portfolio module's five anchor projects were specified to fill five distinguishable slots, and they map onto the submission list almost directly.

| Slot | Anchor project | The competency it evidences |
| --- | --- | --- |
| Guidance and optimization | B — powered-descent guidance | Formulating a constrained optimal-control problem and verifying the solution, not trusting the solver |
| Estimation and filtering | C — quaternion EKF | Sequential estimation, and proving a reported covariance is honest |
| Simulation and architecture | A — 6-DOF launch vehicle simulation | Building the tool a vehicle-performance team actually runs on, with a real atmosphere model |
| Verification and Monte Carlo | D — batch orbit determination, or A's dispersion campaign | Observability and conditioning diagnostics, and validating a covariance against empirical scatter |
| The one that did not work cleanly | Whichever project's write-up documents a first attempt that failed a check | How you behave when a result is not clean |

A sixth option, if a slot is genuinely empty, is hardware-adjacent work — a real IMU characterised on a bench, a thrust-vector-control testbed, a balancing robot — which evidences something none of the five simulations can: that you have seen what a real sensor does when the noise model is not the one you assumed.

::: example An audit that removes an entry, and what replaces it
A candidate's draft list, with the hardest expected question written next to each entry:

| Entry | Hardest question | Can she answer it in 30 seconds? |
| --- | --- | --- |
| 6-DOF ascent simulation with dispersion campaign | Why a layered atmosphere rather than an exponential one? | Yes — the exponential fit is about $30\%$ high by $20\,\mathrm{km}$ and roughly a factor of two high by $30\,\mathrm{km}$, and dynamic pressure drives the loads |
| Powered-descent guidance, fixed final time | What happens when the target is not reachable in the time allotted? | Yes — $4.0\%$ of the 500 dispersed cases returned infeasible, and that is the number I report first |
| Quaternion EKF with NEES and NIS | How do you know the consistency test would catch a real fault? | Yes — the injected fault drove mean NEES to $404.9$ against a ceiling of $6.398$ |
| Batch orbit determination on real data | How did you handle an outlier? | Yes — residual editing after the first pass, and here is what it removed |
| Quadrotor attitude controller, team class project, two years ago | Why PID rather than anything else, and what did you personally decide? | No |

The fifth entry fails on both questions at once: the gain structure was chosen by a teammate before she joined the sub-team, and she cannot reconstruct the reason because there may not have been one. It comes off the list.

What replaces it is not a new project. It is the failure talk, built from material she already has: the quaternion EKF's first process-noise tuning, chosen by matching steady-state covariance to a target by eye, which failed the consistency check decisively before a corrected tuning passed it. Same code, same numbers, different question — not "does this prove the filter is consistent" but "what does this show about how I work when a result is not clean." That entry demonstrates a competency none of the other four does, and it costs an afternoon of writing rather than a month of building.
:::

## The trap, and the three shapes it takes

::: key
Never list a project you cannot defend in depth. The selection is not yours, so a weak entry is a live liability rather than a spare — and the weakest topic can be examined by five to ten engineers for an extended question period.
:::

Padding a list is rarely a careless act. It happens for reasons that feel responsible at the time, and it takes three recognisable shapes.

**The borrowed one.** A team project where the interesting decisions were made by somebody else, included because the list felt like it needed something with an industrial context on it. This is the most common shape and the most expensive, because each individual honest answer — "that was decided before I joined" — is perfectly fine, and ten of them in a row are fatal to the axis being scored. You are being evaluated on defending engineering decisions under direct questioning, and decisions you did not make cannot be defended, only reported.

**The tutorial follow-along.** A project built by working through somebody else's walkthrough, where the code runs and the plots are correct and there is no decision anywhere inside it that was yours. These die at the second follow-up, because the follow-up asks why a parameter was set the way it was, and the honest answer is that the tutorial set it.

**The one you have forgotten.** A genuinely good project from three years ago whose reasons you can no longer reconstruct. This one is salvageable and the others mostly are not: re-read your own write-up, re-run the code, and re-derive the two or three decisions you would be asked about. If you are not willing to spend that day, the entry does not belong on the list, because a half-remembered defence sounds exactly like a borrowed one from the outside.

::: warning
"If they pick that one I will steer the talk toward the parts I know" is not a plan, it is a hope, and it does not survive contact with the questioning. You control the fifteen minutes of talk; you do not control the questions afterwards, and the questions are where the round is decided. A panel that senses steering follows the steer to its source.
:::

## If you genuinely have only four

Submit four. The module's own description says roughly five, and a list of four topics you own completely is stronger than five including one you are hoping nobody picks. Nobody has ever been rejected for having four defensible projects; the failure mode this round actually produces is the fifth entry being chosen.

That said, a fifth slot is usually cheaper to fill than it looks, because it does not require new code. The failure talk above is one route. A second is to split a project you already have along a real boundary: the 6-DOF simulation and its dispersion campaign are one project on your portfolio site, but the simulation's verification — an analytic case matched to tolerance, a conserved quantity that stayed conserved, a convergence rate that behaved as the method predicts — and the campaign's statistics are two genuinely different talks, evidencing two different competencies, and you can defend both at depth because you built both.

::: example Two entries that look different and are not
A candidate submits both "multiplicative quaternion EKF fusing IMU and star tracker" and "extended Kalman filter for a ground robot fusing wheel odometry and a range sensor." Two projects, two platforms, two write-ups.

They are one competency. Both are sequential nonlinear estimation with a linearised measurement update, and the panel's questions will be nearly identical: what is your state, how did you tune the process noise, how do you know the covariance is honest. Answering that set twice does not demonstrate twice as much.

Now contrast the quaternion EKF with the batch orbit-determination project, which a candidate might also worry is "another estimation project." Those two are genuinely different, and the candidate should be able to say why in one sentence: the filter is sequential and its central claim is consistency — a covariance that matches its own error over time; the batch fit is a single solve over a fixed arc whose central claims are observability and conditioning, with a normal-matrix condition number of $4.3\times10^{5}$ for the four-station geometry against $6\times10^{18}$ for the single-station one that diverged. Different failure modes, different diagnostics, different questions. If you cannot state the distinction that crisply, the panel will not see one either.
:::

## Check yourself

::: check
State the test that decides whether a topic belongs on the list, and explain why a self-rating without a threshold is not useful.
:::

::: answer
For each topic, write the hardest question a GNC engineer could ask and then answer it aloud, in about thirty seconds, without notes — the questions being what did you assume, how do you know it works, and what would you do differently. A self-rating without a threshold invites a middling score that resolves nothing: a topic rated seven out of ten still sits on the list and can still be chosen. The threshold that makes the rating useful is that you would be content to present any entry if it were picked at random, which converts the rating into a binary decision — the entry stays or it is cut.
:::

::: check
Why is a team project where the key decisions were made by others described here as more expensive than a project that is merely unfinished or unimpressive?
:::

::: answer
Because it fails precisely on the axis the round weighs most directly: defending engineering decisions under direct questioning. Each individual honest answer — that a decision predates your involvement — is reasonable, and a string of them is not, because collectively they establish that there is nothing inside the project for you to defend. An unfinished or modest project can still contain decisions that were entirely yours, with stated reasons and evidence, which is what the axis measures; a borrowed project cannot, regardless of how impressive the result is.
:::

::: check
A candidate has four strong anchor projects and wants a fifth entry without spending a month building one. Give two routes this lesson describes, and say what makes each legitimate rather than padding.
:::

::: answer
First, the failure talk: take a project whose write-up already documents a first attempt that failed a check — such as an EKF tuning that produced a mean NEES far outside its acceptance band before a corrected tuning passed — and present that arc as its own topic. It is legitimate because the underlying work is hers, the numbers already exist, and it demonstrates a competency the other four do not. Second, split an existing project along a real boundary, such as presenting the verification of a 6-DOF simulation separately from its dispersion campaign, since the evidence for correctness and the statistics of behaviour under uncertainty are different arguments with different questions behind them. Both are legitimate because the candidate can defend either half at depth; neither is padding, because padding means an entry whose decisions were not hers.
:::

::: check
Explain why the quaternion EKF and the batch orbit-determination project count as different competencies, while a quaternion EKF and a ground-robot EKF do not.
:::

::: answer
The two EKFs share a structure and therefore share their questions: state definition, process-noise tuning, covariance consistency. Answering the same question set on two platforms does not evidence more than answering it once. The filter and the batch fit differ in what their central claim is and in how that claim fails: the filter's claim is consistency over time, tested by NEES and NIS against chi-square bands, while the batch fit's claims are observability and conditioning over a fixed arc, tested by the normal matrix's condition number and by comparing the formal covariance against empirical scatter across repeated fits. Different diagnostics, different failure modes, different follow-up questions.
:::

::: check
Why does this lesson argue that a list of four owned topics is stronger than five including one borrowed entry, given that the panel only picks one?
:::

::: answer
Precisely because the panel picks one and you cannot predict which. Adding a fifth entry you cannot defend does not add an option, it adds a probability of being asked to defend the indefensible in front of five to ten engineers for an extended question period. The expected value of the extra entry is negative: it cannot improve the round when a strong topic is chosen, and it loses the round outright when it is chosen itself. A shorter list simply removes that outcome from the space of possibilities.
:::

## Summary

| Rule or trap | Statement |
| --- | --- |
| Rule one | Every entry defensible at depth — the standard is surviving thirty minutes of questions on it |
| Rule two | Each entry shows a competency the others do not |
| The test | Write the hardest question, answer it aloud in thirty seconds, without notes |
| The threshold | You would be content if any entry were picked at random; otherwise it is cut, not rated |
| Trap one | The borrowed team project whose decisions were somebody else's |
| Trap two | The tutorial follow-along with no decision of yours inside it |
| Trap three | The good project from three years ago whose reasons you can no longer reconstruct — salvageable only by re-reading and re-running it |
| If you have four | Submit four; or build a fifth from an existing project's documented failure, or by splitting one along a real boundary |

The next lesson takes the check that has to run over this list before it is submitted at all: whether every entry is yours to present to a room of outside engineers.
