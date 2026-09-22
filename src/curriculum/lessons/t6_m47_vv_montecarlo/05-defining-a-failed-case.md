---
id: l05-defining-a-failed-case
title: Defining a failed case
minutes: 18
covers:
  - 'Success criteria and scoring: defining what a failed case IS, before the campaign runs'
---

A Monte Carlo campaign produces one enormous table: one row per case, one column per quantity of interest — miss distance, touchdown velocity, tilt at contact, propellant remaining, peak structural load, minimum stability margin along the trajectory. Nowhere in that table does a column say "success" or "failure." That label is a judgment the analyst applies afterward, against a rule, and the entire statistical machinery of the previous lesson — the confidence a run count buys, the fragility of a single failure — is only as trustworthy as that rule being fixed before anyone looks at the results it will be applied to.

This sounds like a formality until it is violated, and it is violated constantly, almost never on purpose. A threshold nudged by a few meters after a borderline case is noticed, a criterion checked on one axis when the vehicle actually cares about the vector magnitude, a case marked as a failure on miss distance but never checked against propellant margin at all — each of these looks, from inside the analysis, like a reasonable judgment call. From outside, applied to a dataset the analyst has already seen, it is indistinguishable from choosing the answer and then finding a rule that produces it. This lesson is about making that impossible by construction: deciding, precisely and in writing, what a failed case is before the campaign runs.

## What a success criterion actually specifies

A real success criterion for a landing campaign is not one number — it is a set of individually precise conditions, combined by an explicit rule.

**The individual conditions**, at minimum: touchdown velocity within limits, touchdown tilt within limits, lateral miss distance within limits, propellant remaining above a minimum reserve, structural load below the design limit at every point in the trajectory, and stability margin above its requirement everywhere it is checked. Each one needs a precise computational definition, not only a name — "touchdown velocity" has to specify whether it means the vertical component alone or the full velocity vector magnitude, and at exactly which event: the instant of first contact, or some averaged value over a landing-leg stroke. Two analysts implementing "the same" criterion from an imprecise description will not always produce the same pass/fail label on the same case, which defeats the purpose of having a rule at all.

**The combination rule**, almost always: a case is scored a **failure if any one of the individual conditions is violated** — the logical complement, a case passes only if every condition is satisfied at once. This is a strict rule, and it needs to be, because a vehicle that lands softly and precisely but on empty tanks, or one that hits its miss-distance target while exceeding a structural load limit along the way, has not succeeded at the mission regardless of what any single metric says.

::: key
Decide what a failed case is before the campaign runs: touchdown velocity, tilt, miss distance, propellant remaining, structural loads, and minimum stability margin, each precisely defined, combined so that a case fails if any one condition is violated. Deciding the criterion after seeing the results is how a campaign ends up saying whatever it was hoped it would say.
:::

## Why "before" is not a formality

A finite sample has structure a threshold interacts with, whether or not anyone intends it to, and that interaction is invisible from inside the campaign unless the exact numbers near the boundary are examined directly.

::: example The same 2000 cases, two different verdicts
A campaign of $2000$ dispersed landing cases produces radial miss distances with the six largest values, in meters:

$$
48.92,\ 44.13,\ 43.55,\ 43.32,\ 43.30,\ 42.06.
$$

A requirement written as "miss distance shall not exceed $50\,\mathrm{m}$" scores this campaign clean: zero of $2000$ cases exceed the threshold, and by the previous lesson's formula, $2000$ clean runs support a reliability claim north of $99.7\%$ at $95\%$ confidence. A requirement written as "miss distance shall not exceed $45\,\mathrm{m}$" — a threshold that looks, at a glance, barely different — scores the identical campaign, the identical vehicle, the identical physics, as one failure in $2000$, a materially weaker claim by the same formula. Nothing about the vehicle changed between the two readings of the table; only where the line was drawn changed, and the single case at $48.92\,\mathrm{m}$ sits close enough to a plausible threshold that a decision made after seeing this number, rather than before, could land on either side for reasons that have nothing to do with engineering judgment.

This is not an argument for picking a lenient threshold. It is an argument for picking the threshold from the requirement the mission actually needs — decided by whoever owns that requirement, before the campaign is run, and recorded in the verification matrix alongside the requirement itself — so that the number $48.92\,\mathrm{m}$ is judged against a rule that existed before it was observed, rather than a rule an analyst reaches for once it is.
:::

::: warning A borderline case invites the wrong question
When a result sits close to a threshold, the tempting question is "should the threshold really be here?" The right question, asked before the campaign and not after, is already answered: the threshold is whatever the requirement says, and a case on the wrong side of it is a failure to be investigated, not a threshold to be reconsidered. Revisiting a requirement is sometimes legitimate — but that decision belongs to whoever owns the requirement, made on its own merits, never as a reaction to one inconvenient number from the campaign it is meant to judge.
:::

## What a single metric misses

Scoring a campaign against only its most visible metric — usually miss distance, because it is the easiest to picture — silently drops every failure mode that metric cannot see.

::: example A composite criterion catches what miss distance alone does not
A $500$-case campaign is scored two ways. The first scores a case as a failure only if radial miss distance exceeds $50\,\mathrm{m}$; by that rule, every case in this campaign passes. The second applies the full composite rule: a case fails if miss distance exceeds $50\,\mathrm{m}$, **or** propellant remaining at touchdown falls below $5\,\mathrm{kg}$, **or** attitude error at touchdown exceeds $3^\circ$. By the composite rule, three of the $500$ cases fail — all three on the attitude criterion, none of which the miss-distance-only score would ever have found, since none of them also violated the miss-distance limit.

A report built on the single metric would have claimed a clean campaign and, by the previous lesson's formula, a confident reliability bound. The composite score finds a $0.6\%$ observed failure rate instead — a materially different, and correct, answer, because those three cases genuinely failed the mission even though the most visible metric never flagged them. The difference between the two scores is entirely due to which conditions were checked, not to anything about the underlying $500$ trajectories, which is exactly why the set of conditions has to be complete and fixed before the campaign runs rather than assembled from whichever metric the analyst happened to plot first.
:::

Two further disciplines follow from the same principle. First, ownership: the success criterion should be signed off by whoever owns the requirement it verifies — typically not the same engineer running the campaign — so that the analyst cannot, even unconsciously, shape the rule around what the results are going to say. Second, completeness at the point of definition: every criterion the mission actually depends on, including the ones that are inconvenient to compute or rarely binding, belongs in the rule from the start; adding a criterion later, even for good reason, means re-scoring every case that ran before it, and a program that skips that step is quietly comparing campaigns scored by different rules.

## Check yourself

::: check
A campaign is scored using the rule "a case fails if any listed condition is violated." Explain why this rule, rather than "a case fails if all listed conditions are violated," is the one that matches an actual mission success requirement.
:::

::: answer
A vehicle has succeeded only if every one of its requirements is met at once — a landing that is precise but destructive, or soft but off-target, has not succeeded at the mission regardless of how well it did on the other metrics. The "fails if any condition is violated" rule is the logical complement of "passes only if every condition is met," which is the correct statement of mission success; "fails if all conditions are violated" would instead call a case a success as long as it met even a single one of several independent requirements, passing cases that clearly failed the mission.
:::

::: check
Why does moving a threshold after seeing the campaign's results undermine the confidence claim from the zero-failure formula, even if the new threshold is chosen in good faith?
:::

::: answer
The zero-failure formula's confidence level assumes the pass/fail rule was fixed independently of the specific outcomes observed; the derivation treats each case as an independent draw against a criterion that does not depend on the data. Choosing or adjusting a threshold after seeing where the results happen to fall — even without any intent to deceive — makes the rule a function of the very data it is being used to judge, which is exactly the condition the formula's probability calculation does not account for. The reported confidence level no longer describes the actual procedure that was followed.
:::

::: check
A campaign's success criterion checks miss distance and propellant remaining but not touchdown tilt, because tilt is judged "usually fine." What is the risk, and how would you discover it had already caused a problem?
:::

::: answer
The risk is that a case where the vehicle tips beyond a safe limit at touchdown — a genuine mission failure — is scored a success as long as its miss distance and propellant margin happen to be acceptable, silently removing an entire failure mode from the reported reliability. Discovering this after the fact requires going back through the full case-by-case data (which is why every case's full state history, not only the scored pass/fail label, should be retained) and re-scoring against the complete criterion; if any case that was called a success would have failed the tilt condition, every reliability number reported from the original scoring is wrong and has to be recomputed.
:::

::: check
"Touchdown velocity shall not exceed 3 m/s" is written into a requirement without further qualification. Identify two distinct computational definitions this could mean, and explain why the ambiguity matters.
:::

::: answer
It could mean the vertical (downward) component of velocity alone at first contact, or it could mean the magnitude of the full velocity vector (including any lateral component) at that instant — two different numbers for the same trajectory, since a vehicle with lateral drift at touchdown has a vector magnitude larger than its vertical component alone. The ambiguity matters because a case that passes under one definition can fail under the other, so two analysts implementing "the same" requirement without agreeing on which quantity it refers to will score an identical campaign differently, exactly the kind of after-the-fact flexibility a precise criterion is meant to eliminate.
:::

::: check
A program adds a new success criterion — a maximum allowable structural load — partway through a campaign, after several thousand cases have already run and been scored without it. What is the correct way to handle the cases that ran before the change?
:::

::: answer
Every case that ran before the new criterion was added has to be re-scored against the complete, updated rule, including the new structural-load condition, not merely left under the old scoring while only new cases use the new rule — otherwise the campaign's reported reliability mixes results computed under two different definitions of failure, which is not a single valid dataset for the zero-failure formula or any other statistic built on it. If the raw state history for each case was retained, as it should be, this re-scoring is a matter of re-running the criterion against existing data rather than re-flying the cases.
:::

## Summary

| Item | Statement |
| --- | --- |
| What a success criterion specifies | Individually precise conditions (velocity, tilt, miss distance, propellant, loads, margin), each with an exact computational definition |
| Combination rule | A case fails if any one condition is violated; passes only if all are satisfied at once |
| Timing | Fixed, in writing, before the campaign runs — never adjusted after seeing results, even in good faith |
| Threshold sensitivity | A tiny change in a threshold can change a failure count on an unchanged dataset — the threshold must come from the requirement, not from the data |
| Single-metric scoring | Misses every failure mode the chosen metric cannot see; a composite, complete rule is required |
| Criterion changes mid-campaign | Require re-scoring every prior case against the updated rule, not only new cases going forward |

With the run-count formula and the failure definition both fixed, the next lesson turns to the harder half of the same question: what to do when the probability you need to bound is too small for direct sampling to reach at all.
