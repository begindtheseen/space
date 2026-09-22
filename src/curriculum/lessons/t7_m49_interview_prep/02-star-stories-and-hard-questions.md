---
id: l02-star-stories-and-hard-questions
title: "Behavioural rounds: STAR stories, and the two questions that sting"
minutes: 20
covers:
  - Behavioural and STAR stories emphasising ownership, speed, and recovery from failure
  - Answering "what would you do differently" and "what was the hardest bug" without either arrogance or apology
---

Behavioural rounds get dismissed as the soft part of the loop, the part you can coast through on personality. That is a mistake, and it is a costly one for a technically strong candidate, because a behavioural round is testing something specific and real: whether you can be trusted with an ambiguous problem and no supervision, and whether you actually learn from getting something wrong or only move past it. Those are not soft questions on a GNC team. They are close to the job description.

For a self-taught candidate this round is unusual ground. You likely have no manager to describe, no teammate you disagreed with, no sprint retrospective to draw on — the standard raw material for a STAR answer. That sounds like a disadvantage, and treated carelessly it is one, because it tempts candidates into either inventing team dynamics that were not there or apologizing for the absence of a team. Treated correctly, it is not a disadvantage at all: an independent project run start to finish by one person, with every decision made and owned by that person, is a *better* source of ownership stories than most junior roles produce, precisely because there was no one else to defer to. This lesson gives you the structure to mine that material properly, and concrete, rehearsable answers to the two questions that come up most often and land worst when handled badly.

## What STAR actually checks

STAR — Situation, Task, Action, Result — is not a formatting requirement; it is a checklist an interviewer runs against your answer whether or not you announce the letters. Knowing what each letter is actually probing for tells you what to include and, as importantly, what to cut.

**Situation** sets the scope and the stakes in two or three sentences, not a chronology. Its job is to let the listener calibrate how hard the problem actually was before you tell them what you did about it — skip it and "I fixed a bug" carries no information, because a bug fixed in ten minutes and one that took two weeks sound identical without this context.

**Task** states what was specifically yours to decide. This is the letter self-taught candidates most often get vague on, because on a solo project *everything* was technically yours — which is exactly the point to make explicit rather than assume the listener infers it. "I had to decide whether to ship the filter as-is or delay to fix a consistency issue I'd found" names a real decision with real ownership; "the project needed the filter to work" does not.

**Action** is the actual reasoning and steps you took, in enough technical detail that the listener can tell this happened rather than being reconstructed for the interview. Vague action ("I worked hard on it and eventually solved it") is the single biggest tell of a fabricated or over-polished story; specific action ("I ran a chi-square consistency test across the Monte Carlo set, which showed the covariance was too small by roughly a factor of three, and traced it to an unmodelled correlated bias") is not fakeable on the spot by someone who did not actually do the work.

**Result** is quantified, and includes what changed afterward — not only the outcome but what you did differently as a consequence, because a result with no lasting change reads as luck rather than learning.

::: key
STAR is not narrative structure for its own sake. Situation calibrates difficulty, Task names what was actually yours to decide, Action supplies verifiable technical detail, Result quantifies the outcome and states what changed afterward. Missing any one weakens the signal the other three provide.
:::

## Building a story bank without a team to draw on

Three sources of story cover ownership, speed, and recovery from a personal-project history without inventing anything.

An **ownership story** comes from a real decision made under genuine uncertainty, where you could have been wrong and had no one to check you before committing. "I chose to build my own 6-DOF simulation core rather than use an existing framework, because I judged that understanding every line of the integration and the coordinate transforms mattered more for what I was trying to learn than saving the build time — and I was accountable for that being the right call, since a wrong one would have cost weeks I didn't have" is a real ownership story. The mistake to avoid is describing a decision with no actual uncertainty in it ("I decided to use Python" when there was never a serious alternative) — that is not a decision, it is a default, and an interviewer can tell the difference.

A **speed story** comes from iteration cadence, not hours logged. "Long hours" demonstrates effort, not speed, and effort is not what this is checking. A real speed story has a number: time from identifying a requirement to a first working version, or time from finding a defect to a verified fix landing. "I went from noticing the filter was inconsistent to a diagnosed and fixed root cause in about two days, by testing the most likely source first rather than instrumenting everything at once" shows a fast, disciplined loop; it is a stronger signal than "I spent every evening for a month on it."

A **recovery story** comes from a documented failure with a real after-action, not only a fix. The distinguishing feature is a permanent change to your process, not only a one-time patch — an assertion added, a test written, a review step introduced — so the same failure mode cannot silently recur. A bug fixed and forgotten is not a recovery story; a bug fixed with a lasting change to how you work is.

::: warning
Do not invent a team dynamic that was not there. Claiming to have "convinced a teammate" or "pushed back on a manager" on a solo project is checkable in five seconds of follow-up questioning and costs you more than admitting the project was solo ever would. Solo ownership, correctly framed, is not a weaker story than a team one — it removes the ambiguity about whose decision it actually was.
:::

## "What would you do differently" — a working script

Two failure modes dominate this question, and both are common enough that most panels have heard them a hundred times. False humility — "honestly, everything, I knew so little back then" — sounds self-aware but carries zero information, because it names nothing specific and cannot be evaluated. Defensiveness — "nothing, it was the right call given what I knew" — closes off the question entirely and, worse, implies no retrospection happened at all, which is a bigger red flag than admitting a real mistake.

The working answer names one specific, technical change, ties it to a concrete trigger — what you know now that you did not know then, or what check you would run earlier rather than later — and briefly says why you did not do it at the time, framed as a reasonable prioritization rather than an oversight. "I'd add the filter consistency check before the accuracy check, not after — I found the inconsistency almost by accident late in the project, and if I'd run it first it would have caught the modelling gap two weeks earlier, before I'd built other analysis on top of the biased estimate. At the time I sequenced it the other way because accuracy felt like the more clearly important number to establish first; in hindsight consistency is the cheaper check and should come first specifically because a filter that fails it invalidates everything built on top of it." That answer is specific, technically substantive, and demonstrates exactly the retrospective judgment the question is trying to find.

::: example "What would you do differently" — worked answer
"On the Monte Carlo verification campaign, I'd restructure the case-generation step. I generated all ten thousand dispersed cases up front with a single fixed seed set, which meant that when I found a bug in the dispersion model partway through analysis, I had to regenerate and rerun the entire campaign rather than only the affected cases. If I did it again, I'd version the seed generation separately from the case execution, so a fix to one dispersion parameter doesn't invalidate cases that never touched it. I didn't structure it that way originally because I underestimated how many iterations the dispersion model itself would need before it was right — I assumed the model was the settled part and the analysis was where the iteration would happen, and it was the other way around."
:::

## "What was the hardest bug" — a working script

The failure mode here is the war story with no methodology: a dramatic account of confusion and frustration that ends in relief, with no reconstructible reasoning in the middle. It is memorable and tells the panel nothing about how you actually debug.

The working answer states the symptom precisely, the plausible causes you ruled out and how you ruled them out, the actual root cause, and what changed afterward so the same class of bug cannot recur silently. For a GNC-flavoured project specifically, a subtle numerical or modelling bug — a sign error in a Jacobian, a frame confusion, an unmodelled correlation — reads as stronger material than a generic software bug, because it demonstrates the domain understanding the round exists to test, not only general debugging competence.

::: example "Hardest bug" — worked answer
"The symptom was a navigation filter whose reported uncertainty looked fine on any single run but whose error, checked across a Monte Carlo set, was routinely three times larger than the covariance said it should be. I first ruled out a straightforward implementation bug by checking the update equations line by line against the derivation — that matched. I then suspected process-noise tuning, since that's the usual first suspect for an overconfident filter, and spent a day sweeping it with no real improvement, which told me the problem wasn't a tuning number but a structural one. The actual cause was a sensor bias I had modelled as zero-mean white noise; it was slowly time-varying and correlated between consecutive measurements, which the filter's white-noise assumption doesn't account for, so the filter treated much more information as independent than it really was. The fix was to add the bias as an estimated state. Afterward I added the consistency test itself as a standing part of my verification process, run on every filter change before anything else, specifically because this bug would have been caught in an afternoon if I'd been running it from the start instead of finding it by chance."
:::

::: warning
A hardest-bug answer that ends at "and then I found it and fixed it" stops one step too early. The stronger ending states what changed in your process afterward — because that is the part that demonstrates recovery rather than persistence alone, and persistence by itself is not the signal this question is after.
:::

## Ownership, speed and recovery, named plainly

These three are worth holding separately in your head as you build your story bank, because a single strong story often demonstrates only one of them well, and a panel probing behaviourally will usually ask for all three across a loop.

Ownership means being accountable for a call that nobody else was going to check on your behalf — the test is not how big the decision was, but whether you, specifically, owned the consequence of it being wrong. Speed is iteration cadence measured in time, not effort measured in hours; a fast loop from problem to diagnosis to fix is the signal, and it is worth having the actual number ready. Recovery is a permanent change to how you work as a result of a failure, not merely the resolution of that one instance — the after-action is the part that makes it a recovery story rather than only a bug-fix story.

## Check yourself

::: check
What does the "Task" letter of STAR specifically check for, and why is it the letter self-taught candidates most often leave too vague?
:::

::: answer
Task checks what was specifically yours to decide — not what the project needed in general, but the actual decision point where you, and not someone else, were responsible for the call. Self-taught candidates leave it vague because on a solo project everything is technically theirs, which paradoxically makes it easy to state nothing precisely: "the project needed X" describes a requirement, not a decision. The fix is to name the specific choice point explicitly — "I had to decide whether to ship as-is or delay" — even though, on a solo project, naming who else could have made that call is unnecessary; the ownership is already established by there being no one else.
:::

::: check
Why is "honestly, I'd do everything differently, I knew so little back then" a weak answer to "what would you do differently," even though it sounds appropriately humble?
:::

::: answer
It names nothing specific and therefore carries no information the panel can evaluate — it could be said truthfully by someone with genuine, precise retrospective insight or by someone who has never actually thought about the question, and the panel cannot tell which. The working version names one concrete technical change, states the trigger that would cause you to make it now, and explains briefly why the original choice was a reasonable prioritization at the time rather than an oversight. Specificity is what turns a mood into evidence of real retrospection.
:::

::: check
A candidate says: "I rewrote my simulation's integrator from scratch." Turn that into a proper ownership story — what is missing, and what needs to be added?
:::

::: answer
As stated it has no Situation (why did the integrator need rewriting — what was wrong with it, and what did that cost), no real Task (was there a decision here, or only an obvious necessity), and no quantified Result. A working version supplies all three: "My original fixed-step RK4 integrator was losing energy visibly over long propagations — I noticed a LEO orbit's semi-major axis drifting by several kilometres over a week of simulated time with no physical cause, which meant every downstream analysis using long propagations was suspect. I decided to replace it with a symplectic integrator rather than only shrinking the step size, judging that a structural fix was worth more than a workaround that would have made the problem smaller but not addressed its cause. After the change, semi-major-axis drift over the same week dropped by roughly two orders of magnitude." That version has stakes, a real decision with a rejected alternative, and a number.
:::

::: check
Why does a "hardest bug" story about a subtle numerical or modelling error tend to land better in a GNC interview than one about a generic software bug like a null pointer?
:::

::: answer
Both can demonstrate debugging competence, but only the domain-specific version also demonstrates the thing a GNC round is actually trying to assess: whether you understand the underlying physics and mathematics well enough to reason about *why* a wrong answer is wrong, not only that it crashed. A sign error in a Jacobian or an unmodelled correlated bias caught by a consistency test shows you know what "correct" should look like at a mathematical level, which is a stronger and more relevant signal than resolving a segmentation fault, even though the latter can be a perfectly real and difficult bug in its own right.
:::

::: check
The interviewer responds to your ownership story with: "that doesn't sound like it was really your call — who signed off on it?" How do you answer, given the project was solo?
:::

::: answer
State plainly that it was a personal project with no approval hierarchy, and then answer the question the interviewer is actually asking underneath the wording, which is what criterion you used to decide the call was right before committing to it. "There was no one to sign off on it — I was the only person on the project. What made me confident enough to commit was [the specific evidence: a closed-form test case matching, an independent cross-check, a deadline trade I was explicitly willing to accept]." This reframes the question from an organizational one you cannot answer to a judgment one you can, and a good answer here demonstrates that you hold yourself to a real bar even with no external check.
:::

::: check
What is a weak way to demonstrate "speed" in a behavioural answer, and what does a strong version look like instead?
:::

::: answer
The weak version cites effort — hours worked, evenings spent, how hard you pushed — which measures commitment, not speed, and is not what the question is probing. The strong version cites a measured cadence: time from identifying a problem to a diagnosed cause, or from a diagnosed cause to a verified fix, stated as an actual number. "About two days from noticing the inconsistency to a fixed and re-verified filter" is evidence of a fast, disciplined loop; "I worked on it every night for a month" is evidence only of persistence, which is a different and weaker signal.
:::

## Summary

| Idea | Statement |
| --- | --- |
| STAR, precisely | Situation calibrates difficulty; Task names what was yours to decide; Action gives verifiable technical detail; Result is quantified and states what changed after |
| Story sources, solo | Ownership from a real decision under uncertainty; speed from iteration cadence with a number; recovery from a permanent process change after a failure |
| "What would you do differently" | Name one specific technical change, its trigger, and why the original choice was a reasonable prioritization, not an oversight |
| "Hardest bug" | Symptom, ruled-out causes and how, actual root cause, and the permanent change made afterward — not only the fix |
| Two traps | False humility or defensiveness on the first question; a war story with no methodology on the second |

The next lessons turn to the technical core of the module: order-of-magnitude estimation and the derivations you must be able to reproduce cold, both done at the same pace and under the same pressure this lesson has been preparing you for.
