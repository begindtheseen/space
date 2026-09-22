---
id: l11-numbers-resume-and-portfolio
title: "Framing your work with numbers: talks, resume and portfolio"
minutes: 15
covers:
  - "Framing self-taught projects as engineering results with numbers: RMSE, margins, run counts, solve times, not adjectives"
  - "Resume and portfolio construction around artefacts that can be read: repositories, reports, plots"
---

Every credibility problem a self-taught candidate faces — no degree to point to, no employer's name to lend weight, no manager who can vouch for the work — has the same fix, applied consistently: replace every adjective describing your own work with a number, a unit, and the method that produced it. A panel cannot independently verify that your simulation was "robust" or your filter "accurate." A panel absolutely can evaluate "landing CEP of 4.2 m over 10,000 dispersed cases, 99.87th-percentile error of 11 m, pass criteria fixed before the campaign ran," because that sentence contains everything needed to judge it on its own terms, regardless of who wrote it or where they learned to.

This lesson applies that one discipline to three places it decides whether your work is believed: what you say about a result out loud, what your resume claims, and what a repository or report shows a stranger who has ten minutes and no obligation to trust you.

## What makes a number credible

Four things, and a claim missing any of them is weaker than it should be. The **metric** — what was actually measured (miss distance, estimation error, solve time). The **unit** — without which a number is not yet a number in any usable sense. The **method** — how it was measured and over what sample, since "4.2 m" from one lucky run and "4.2 m" from ten thousand dispersed cases are not the same claim even though they read identically on the page. And the **worst case beside the central value** — because an aerospace panel is trained to care about the tail of a distribution far more than its middle, since the tail is where a vehicle is actually lost, and a number with no worst case invites exactly the follow-up you would rather have pre-empted.

::: key
State a result as a number, a unit, and a method: "CEP of 4.2 m over 10,000 dispersed cases, 99.87th percentile 11 m, criteria fixed before the run" — never "the accuracy was good." Give the worst case beside the central value, always.
:::

Adjectives fail this test structurally, not by accident: "robust," "accurate," and "efficient" carry no information a listener can independently check, which is exactly why they invite the one follow-up you least want, "robust by what measure?" A number with a stated method closes that question before it is asked, because the method *is* the answer to it.

::: example A resume line, before and after
Before: "Built a Kalman filter for spacecraft attitude estimation that improved performance significantly."

After: "Reduced attitude estimation error from 0.8° to 0.2° RMS by modelling gyro bias instability as an estimated state, verified over 2,000 dispersed Monte Carlo cases." The rewritten line names the metric (RMS attitude error), gives before-and-after numbers with units, states the specific technical change responsible for the improvement, and states the sample the claim was verified over — four things the original sentence supplies none of, in roughly the same length.
:::

## Resume bullets, structurally

A strong technical bullet has a repeatable shape: the action taken, the specific method behind it, the quantified result with a unit, and the breadth of verification behind the claim — not necessarily in that literal word order, but all four present. "Implemented a convex second-order-cone solver for powered-descent guidance, achieving sub-250 ms worst-case solve time across 10,000 dispersed initial conditions with zero infeasible returns" has an action (implemented a solver), a method (second-order cone, named specifically rather than "an optimization approach"), a quantified result with units (250 ms), and a verification breadth (10,000 dispersed cases, plus the specific claim of zero failures rather than an average). Every one of those components is checkable in principle — an interviewer could ask about any of them and receive a real answer, because each one is a fact about the work rather than an assessment of it.

::: warning
A bullet describing effort ("spent six months building...") or difficulty ("a challenging project involving...") is not a stronger version of a weak bullet; it is answering a question nobody asked. Resume space is scarce, and every word spent on effort or difficulty is a word not spent on the result, the method, or the verification — the three things a reader is actually trying to extract.
:::

## Portfolio construction: repositories, reports, and plots that can be read

A self-taught candidate's most durable form of evidence is not the resume line at all — it is the artefact behind it, because a repository, a report, or a plot can be inspected directly rather than taken on faith. Three kinds of artefact, each with its own specific bar for being genuinely readable by a stranger in a short sitting.

**A repository** earns trust with a README that states the requirement, the result (with the same numbers-and-method discipline as everywhere else), and how to reproduce it — install steps that actually work, not aspirational ones. Tests that run, visibly, matter more than a large volume of untested code, because a green test suite is evidence a stranger can generate themselves in minutes rather than evidence they have to trust secondhand. One plot that carries the argument belongs at the top of the README, not buried three folders deep. And commit history that shows real iteration — failed attempts, fixes, refactors — is itself evidence: a single "initial commit" containing an entire finished project reads as either copied from elsewhere or reconstructed after the fact for presentation, neither of which is the impression you want, where a messy, honest history of genuine debugging is direct evidence the work was actually built incrementally by the person claiming it.

**A report** applies the same numbers discipline throughout its results section, and adds one section worth writing first rather than last: known limitations, stated plainly — what the model does not capture, what could not be validated against anything outside the simulation, what would need hardware or more data to actually settle. This is not hedging; it is the same demonstrated self-awareness a project talk's closing section is graded on, and a reviewer who finds it missing tends to assume, correctly more often than not, that the limitations were not considered rather than that there were none.

**A plot** is credible on its own terms only when it has labeled axes with units, states the sample it was generated from, and marks the worst case rather than showing only a smooth central tendency. A single trajectory plotted once, with no indication of how many runs, no dispersion shown, and no worst case marked, demonstrates that something ran — it does not demonstrate a verified, characterized result, and a reviewer who has seen both kinds can usually tell them apart at a glance.

::: example A repository README, applied to a specific project
For a convex landing-guidance project, the README's opening section states: the requirement ("soft-land within a thrust envelope, solved in real time onboard"); the result, with method ("second-order-cone formulation via lossless convexification, sub-250 ms worst-case solve time across 10,000 dispersed cases, zero infeasible solves"); the one plot (landing-position dispersion with the target and worst case marked, embedded directly rather than linked three pages away); reproduce steps that a stranger can actually run (`pip install -r requirements.txt`, then a single documented command that regenerates the dispersion result from a fixed seed); and a short, specific known-limitations line ("point-mass, rigid-body model; free-final-time and flexible-body effects are not yet handled"). A reader with ten minutes and no prior trust in the author can verify every claim in that opening section personally, which is the entire point of building it this way.
:::

## Check yourself

::: check
Name the four components of a credible numeric claim, and explain briefly why a claim missing the "worst case" component specifically invites a follow-up question.
:::

::: answer
Metric, unit, method (including the sample it was measured over), and the worst case stated beside the central value. Omitting the worst case invites a follow-up specifically because an aerospace panel is trained to weight the tail of a result's distribution over its average — the average is rarely where a vehicle is actually lost — so a number with only a mean or an RMS naturally prompts "what's your worst case," and pre-stating it removes that question before it can be asked.
:::

::: check
Rewrite this resume bullet using the four-part structure from this lesson: "Developed a 6-DOF simulation that was very accurate and used across the project."
:::

::: answer
A working rewrite needs a specific method, a quantified result, and a stated verification breadth in place of "very accurate" and "used across the project," for example: "Built a 6-DOF flight simulation with RK4 propagation and closed-loop guidance and control, validated against an independent two-body analytical solution to within 0.1% specific energy error over a 90-minute propagation, and used as the verification environment for three downstream guidance studies." This names the propagation method, gives a specific validation check with a number and a unit, and states concretely what the simulation was used for rather than asserting broad, unquantified usefulness.
:::

::: check
Why does a repository's commit history function as evidence of anything, beyond the code that is already visible in the final state of the repository?
:::

::: answer
The final state of a repository shows what was eventually built, but says nothing about how it got there — a single "initial commit" containing a whole finished project is consistent with the work being copied, reconstructed after the fact purely for presentation, or genuinely built in one sitting with no debugging along the way, and a reviewer cannot distinguish those from the final state alone. A commit history with visible false starts, bug fixes, and incremental refactors is direct, hard-to-fabricate evidence that the work was actually built the way real engineering gets built — iteratively, with mistakes along the way — which is exactly the process a project talk's own defence is trying to establish happened.
:::

::: check
A report's results section states: "Average landing error across the test campaign was 3.1 m." What is missing, and why does its absence weaken the claim more than it might first appear to?
:::

::: answer
Missing: the sample size and method behind "the test campaign," and critically, any worst-case or tail statistic alongside the average. Its absence weakens the claim more than it appears to because a mean alone cannot distinguish a well-controlled result with a tight distribution from one with an average pulled down by many good cases while a smaller number land catastrophically far off target — two very different engineering realities that produce an identical-looking mean. Without the worst case and the sample size, a reader has no way to tell which of those two situations they are actually looking at, and a reviewer experienced enough to know this will assume the less favourable interpretation until shown otherwise.
:::

::: check
Why should a report's "known limitations" section be written early, in the same spirit as a project talk's closing section, rather than added at the end as a formality?
:::

::: answer
Writing it early, and taking it seriously as real content rather than a disclaimer, forces an honest accounting of what the work does not show before the temptation arises to quietly omit an inconvenient gap once the rest of the report is finished and the instinct is to present it as complete. It also demonstrates the same self-awareness a strong project talk's limitations section demonstrates — that you know precisely where your own result stops being trustworthy — which a reviewer reads as a sign of real engineering judgment rather than as a weakness in the work, since every real result has limits and the difference between a strong and a weak report is whether they are stated or hidden.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Credible number | Metric, unit, method and sample, worst case beside the central value — "CEP of 4.2 m over 10,000 cases, 99.87th percentile 11 m" |
| Resume bullet | Action, specific method, quantified result with units, verification breadth — all four, not effort or difficulty |
| Readable repository | README with requirement/result/reproduce, tests that visibly run, one plot up front, commit history showing real iteration |
| Readable report | Same numbers discipline throughout; known limitations written honestly and early |
| Readable plot | Labeled axes and units, stated sample, worst case marked — not a single smooth demonstration curve |

The final lesson closes out the honest, non-technical parts of the process: work authorisation handled early rather than as a surprise, realistic adjacent entry roles, and how to run the full timed mock loop that ties every round in this module together.
