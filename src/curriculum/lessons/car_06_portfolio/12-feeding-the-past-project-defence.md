---
id: l12-feeding-the-past-project-defence
title: "How the portfolio feeds the past-project defence"
minutes: 18
covers:
  - "how the portfolio feeds the past-project presentation round"
---

This module opened with a claim worth returning to now that the projects and the write-up discipline behind them have been covered in full: building the portfolio is not separate preparation from the interview that follows it. It is the same work, done once, used twice. The past-project presentation round this curriculum's interview-preparation material covers in depth — choosing a small number of projects, building a talk around each, and defending it under extended questioning — draws its entire raw material from exactly what this module has asked you to build. A portfolio built to this module's standard does not need a separate preparation phase before that round; it needs to be read back with a different question in mind.

This closing lesson makes that connection explicit: which anchor project supplies which part of the defence, why the write-up structure and the talk structure are close to the same document read two different ways, and what to actually do, right now, with the ten lessons behind this one.

## The five-talk slots, filled by the five anchors

The past-project round is built around five talks, each answering a different implicit question a panel is trying to close out: a guidance or optimization project, an estimation or filtering project, a simulation or architecture project, a verification or Monte Carlo project, and one project that did not work cleanly. Read against this module's five anchor projects, four of the five slots fill almost automatically.

::: example Mapping anchor projects to talk slots
Anchor B, powered-descent guidance, is the guidance-and-optimization talk outright — the lossless-convexification formulation, the constraint verification, and the landing-accuracy Monte Carlo from that lesson are close to a finished outline already. Anchor C, the quaternion EKF, is the estimation talk, with the NEES and NIS consistency results as the one plot a panel will ask to see. Anchor A, the 6-DOF simulation, is the simulation-and-architecture talk, and its dispersion campaign doubles as strong material for the verification-and-Monte-Carlo slot if anchor D is not chosen for it instead. Anchor D, the batch orbit-determination project, is a second strong candidate for the verification slot specifically because its condition-number diagnosis is a clean, concrete answer to "how do you know this converged to something trustworthy." That leaves the fifth slot, the failure talk, open — and this module has already written most of it for you, if you look at what each anchor's own limitations section actually contains.
:::

## The write-up structure and the talk structure are the same document, read two ways

The seven-part write-up structure from earlier in this module — problem, model, assumptions, verification, validation, results, limitations — maps almost directly onto the four-part talk structure this curriculum's interview-preparation material builds a project talk around: a stated requirement, an approach with one carrying plot, results with numbers, and limitations. Problem becomes the requirement stated in the talk's first thirty seconds. Model and assumptions become the approach section, with the one plot chosen from whichever figure the write-up already put at the top of the README, under the ninety-second-read discipline from earlier in this module. Verification and validation become the answer to "how do you know it's right" — the single question this module has returned to more than any other, because it is the single question a panel returns to more than any other. Results and limitations map directly across, word for word in spirit if not in name.

This is not a coincidence engineered for convenience; it is the same underlying standard — a claim stated precisely enough that someone else can check it — expressed once as a document and once as a spoken defence. A write-up built to survive a reviewer reading it alone, cold, in ninety seconds, is already most of the way to a talk built to survive a panel interrupting it in the first two minutes.

::: key
The seven-part write-up structure and the four-part talk structure answer the same underlying questions in the same order: what was required, what was built and assumed, how you know it is right, what happened, and where it stops being trustworthy. A project documented to this module's standard is already most of the way to a rehearsed talk about it.
:::

## The "what the interviewer asks" sections are the start of your twenty questions

Every anchor-project lesson in this module closed with a short section naming the specific questions a panel tends to ask about that project. Those are not incidental — they are the beginning of exactly the twenty-hardest-questions list the past-project round's own preparation exercise asks you to write out and answer, in full, for every project you present. Reading back through this module's own anchor lessons with a pen, for each project you have chosen to present, is a faster start than beginning that list from nothing.

## Turning a limitations section into a failure talk

The failure talk is the slot candidates leave empty most often, and this module has already produced strong raw material for it without labeling it as such — because a results section written honestly, per the write-up-structure lesson earlier in this module, already includes what did not work on the way to what did.

::: example From a limitations section to a failure-talk outline
The quaternion-EKF anchor lesson's worked example included a filter deliberately tuned with process noise cut a hundredfold below the truth, producing a mean NEES over sixty times its acceptance band's ceiling. Read as a failure talk rather than a verification example, the same material reorganizes directly: **requirement** — the filter needed to report a covariance that actually matched its error, not merely be accurate on average, because anything downstream trusts that covariance. **What happened** — a first tuning looked fine on a single run's plot and failed decisively once tested with an actual consistency check across many runs. **Diagnosis and fix** — the specific test that caught it (NEES and NIS against their chi-square bands), not a vague sense that something seemed off, and the specific correction. **Limitations** — the exercise verified consistency in simulation; validating the underlying noise model against real hardware, as the hardware-adjacent lesson in this module covers, remains a separate, unfinished step.

Nothing here required new material. It required reading an existing verification result with a different question in mind: not "does this prove the filter is consistent" but "what does this show about how I behave when a result is not clean."
:::

## What to do with this, concretely

Choose three to five anchor projects from this module — the exercises attached to it ask for exactly this — and for each one, pull three things directly from what you already built: the one plot or number that would open the talk, taken from wherever the ninety-second-read discipline already put it in the README; the "what the interviewer asks" list from that project's own lesson, as the starting point for the twenty-questions rehearsal; and, for at least one project, the specific moment a first attempt failed a check before a later one passed it, as the seed of the failure talk. This is not a new phase of work bolted onto portfolio-building. It is the portfolio, read once more, for a different purpose.

## Check yourself

::: check
Explain why this lesson treats building the portfolio and preparing for the past-project defence as the same work rather than two sequential phases of preparation.
:::

::: answer
Both draw on the identical underlying standard — a specific requirement, a stated model and its assumptions, evidence of correctness beyond "it ran," honest results, and named limitations — expressed once in writing and once as a spoken, interruptible defence. A project documented to this module's standard already contains the material a talk needs: the one plot, the numbers, the limitations, and the questions a reviewer is likely to ask. Treating them as separate phases wastes the fact that building the write-up correctly the first time already does most of the defence-preparation work.
:::

::: check
Map anchor project D (batch orbit determination) to a specific one of the five talk slots this lesson describes, and justify the mapping using a specific piece of evidence from that project's own lesson.
:::

::: answer
Anchor D maps most directly to the verification-or-Monte-Carlo slot, on the strength of its condition-number diagnosis: discovering that a single-station geometry gave a normal-matrix condition number near $6\times10^{18}$ and diverged, then confirming a four-station geometry brought it to roughly $4.3\times10^5$ and converged cleanly, is a concrete, quantified answer to "how do you know this result is trustworthy" — exactly the question the verification slot exists to showcase an answer to, rather than a general description of the least-squares method itself.
:::

::: check
Using the seven-part write-up structure and the four-part talk structure from this lesson, explain which write-up sections combine to answer the talk's "how do you know it's right" moment, and why that moment recurs so often in both formats.
:::

::: answer
The verification and validation sections of the write-up combine to answer it — verification establishing that the code was built correctly against its own specification, validation establishing whether that specification is itself trustworthy against the real system. It recurs so often in both the write-up and the talk because it is the single question that separates a result that was checked from one that was merely produced, which this module has treated throughout as the actual dividing line between a hobbyist project and an engineering one — a panel returns to it in conversation for the same reason a write-up's structure is built around it on the page.
:::

::: check
A candidate has a strong results section for their 6-DOF simulation project but has never written down a list of hard questions a panel might ask about it. What does this lesson say is the fastest way to start that list, and why?
:::

::: answer
Reread that project's own anchor-project lesson in this module and pull directly from its "what the interviewer asks" section, which already names the specific questions that recur on that project type — why a real atmosphere model, how the rotational dynamics were verified, what is in the dispersion set and why, and what the pass criterion was. This is faster than generating a question list from nothing because the module has already identified the questions a panel with real domain experience tends to actually ask, rather than requiring the candidate to guess at what a stranger might probe.
:::

::: check
Explain, using the quaternion-EKF worked example from this lesson, why a verification result that includes a deliberately induced failure is stronger raw material for a failure talk than a project that never had a documented failure at all.
:::

::: answer
A failure talk specifically needs to demonstrate how a candidate behaves when a result is not clean — diagnosing a problem, using a real check rather than intuition, and fixing it for a stated reason — and a project with no documented failure has no material for that talk regardless of how technically strong its final result is. The deliberately overconfident filter example already contains a full arc: an initial tuning that looked acceptable, a real statistical test that caught the problem decisively (mean NEES over sixty times the acceptance ceiling), and a specific, justified correction. Reorganizing that material into the failure talk's four-part shape requires no new work, because writing an honest results section, as this module has argued throughout, already produces exactly this kind of material as a byproduct.
:::

## Summary

| Talk slot | Anchor project | What carries the talk |
| --- | --- | --- |
| Guidance / optimization | B — powered-descent guidance | Constraint verification and the landing-accuracy Monte Carlo |
| Estimation / filtering | C — quaternion EKF | NEES and NIS results, nominal versus a deliberately induced fault |
| Simulation / architecture | A — 6-DOF simulation | The verified dynamics plus the real atmosphere model and dispersion campaign |
| Verification / Monte Carlo | D — orbit determination (or A's dispersion campaign) | The condition-number diagnosis and the formal-versus-empirical covariance check |
| Failure | Whichever anchor's write-up already documents a first attempt that failed a check | Requirement, what happened, the specific diagnostic test, and the fix |

This module is complete: five anchor projects, the write-up structure and verification toolkit that make each one defensible, reproducibility and licensing that make them checkable and legally showable, hardware-adjacent work that closes the gap simulation alone cannot, and, in this final lesson, the direct line from all of it to the interview round it was built to survive.
