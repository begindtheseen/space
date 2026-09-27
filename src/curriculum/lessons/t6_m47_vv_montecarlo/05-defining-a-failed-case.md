---
id: l05-defining-a-failed-case
title: Defining a failed case
minutes: 16
covers:
  - 'Success criteria and scoring: defining what a failed case IS, before the campaign runs'
---

Before a soccer game starts, everyone agrees what a goal is: the whole ball over the whole line, between the posts, under the bar. Imagine instead that the referee decided after the game, having watched every shot. Even an honest referee would be tempted. A shot that bounced off the line would look like a goal to one team and not to the other, and the final score would say more about the referee than the game.

A Monte Carlo campaign has the same problem. It produces one enormous table: one row per case, one column per **quantity of interest** — a number the analysis cares about, such as miss distance, touchdown velocity, tilt at contact, propellant remaining, peak structural load, or the smallest stability margin along the flight. Nowhere in that table does a column say "success" or "failure". That label is a judgment applied afterward, against a rule. All the statistics of the previous lesson — the confidence a run count buys, the fragility of a single failure — are only as trustworthy as that rule being fixed before anyone looks at the results.

This sounds like a formality until it is broken, and it is broken often, almost never on purpose. A threshold gets nudged by a few meters after someone notices a borderline case. A limit is checked on one axis when the vehicle cares about the full vector. A case is checked for miss distance but never for propellant. From inside the analysis, each looks like a reasonable judgment call. From outside, applied to data the analyst has already seen, it is **[[indistinguishable from choosing the answer|drawing-the-target-afterward]]** and then finding a rule that produces it. This lesson is about making that impossible by construction: deciding, precisely and in writing, what a failed case is before the campaign runs.

## What a success criterion actually specifies

A **success criterion** is the rule that labels each case pass or fail. For a landing campaign it is not one number. It is a set of individually precise conditions, joined by an explicit rule.

**The individual conditions.** At a minimum:

- touchdown velocity within limits;
- touchdown tilt within limits;
- lateral miss distance within limits;
- propellant remaining above a minimum reserve;
- structural load below the design limit at every point on the trajectory;
- stability margin above its requirement everywhere it is checked.

Each one needs a precise computational definition, not only a name. "Touchdown velocity" must say whether it means the vertical part alone or the **[[size of the full velocity vector|vertical-or-vector]]**. It must also say at exactly which moment: the instant of first contact, or an average over the **[[landing-leg stroke|leg-stroke]]**. Two analysts coding "the same" criterion from a vague description will not always give the same label to the same case. That defeats the whole point of having a rule.

**The combination rule.** Almost always, a case is scored a **failure if any one of the conditions is violated**. Said the other way round — its **[[logical complement|any-versus-all]]** — a case passes only if every condition holds at once. That is strict, and it needs to be. A vehicle that lands softly and precisely on empty tanks has not succeeded. Neither has one that hits its miss-distance target while overstressing its structure on the way down.

::: key
Define what counts as a failed case BEFORE the campaign runs: touchdown velocity, tilt, miss distance, propellant remaining, loads, and minimum margin, each precisely defined, combined so that a case fails if any one condition is violated. Deciding afterwards is how a campaign is made to say what you wanted.
:::

## Why "before" is not a formality

A finite sample has a lumpy shape, and a threshold interacts with that shape whether anyone means it to or not. You cannot see the interaction from inside the campaign unless you look at the exact numbers near the line.

::: example The same 2000 cases, two different verdicts
A campaign of $2000$ dispersed landing cases produces radial miss distances whose six largest values, in meters, are:

$$
48.92,\ 44.13,\ 43.55,\ 43.32,\ 43.30,\ 42.06.
$$

**Reading one.** The requirement says "miss distance shall not exceed $50\,\mathrm{m}$". Every value is below $50$, so zero of $2000$ cases fail. By the previous lesson's formula, $2000$ clean runs support reliability of at least $0.05^{1/2000} = 99.85\%$ at $95\%$ confidence.

**Reading two.** The requirement says "miss distance shall not exceed $45\,\mathrm{m}$" — at a glance, barely different. Now the case at $48.92\,\mathrm{m}$ is over the line and the next one, $44.13\,\mathrm{m}$, is under it. So the same table scores one failure in $2000$. The one-failure Clopper–Pearson bound from the previous lesson gives only $99.76\%$ at the same confidence.

Nothing about the vehicle changed between the two readings. The physics is identical. Only where the line was drawn changed. The case at $48.92\,\mathrm{m}$ sits close enough to a plausible threshold that a decision made *after* seeing it could land on either side, for reasons that have nothing to do with engineering.

That is not an argument for a lenient threshold. It is an argument for taking the threshold from what the mission actually needs. The person who owns that requirement decides it before the campaign runs, and it is recorded in the **[[verification matrix|verification-matrix-link]]** beside the requirement. Then $48.92\,\mathrm{m}$ is judged against a rule that existed before the number was seen.
:::

::: warning A borderline case invites the wrong question
When a result sits near a threshold, the tempting question is "should the threshold really be here?" The right question was already answered before the campaign: the threshold is whatever the requirement says, and a case on the wrong side is a failure to investigate, not a threshold to reconsider. Revisiting a requirement is sometimes legitimate. But that decision belongs to whoever owns the requirement, made on its own merits — never as a reaction to one inconvenient number from the campaign it is meant to judge.
:::

## What a single metric misses

The easiest metric to picture is miss distance: you can draw it on a map. Scoring a campaign on that one metric silently drops every failure it cannot see.

::: example A composite criterion catches what miss distance alone does not
A $500$-case campaign is scored two ways.

**Score one: miss distance only.** A case fails if radial miss distance exceeds $50\,\mathrm{m}$. By that rule, every case passes.

**Score two: the composite rule.** A case fails if miss distance exceeds $50\,\mathrm{m}$, **or** propellant remaining at touchdown is below $5\,\mathrm{kg}$, **or** attitude error at touchdown exceeds $3^\circ$. Now three of the $500$ cases fail. All three fail on attitude, and none of them was over the miss-distance limit, so score one could never have found them.

**What it does to the claim.** Score one reports a clean campaign, and by the previous lesson's formula a confident bound: $0.05^{1/500} = 99.40\%$ reliability at $95\%$ confidence. Score two finds an observed failure rate of $3/500 = 0.6\%$, and the exact bound for three failures in $500$ supports only $98.46\%$. That is a very different answer, and it is the correct one, because those three landings really did fail the mission.

The $500$ trajectories are the same in both scores. The whole difference comes from which conditions were checked. That is exactly why the set of conditions must be complete and fixed before the campaign runs, not assembled from whichever metric the analyst happened to plot first.
:::

Two more habits follow from the same principle.

**Ownership.** The success criterion should be signed off by whoever owns the requirement it verifies. That is usually not the engineer running the campaign. This way the analyst cannot, even without meaning to, shape the rule around what the results are going to say.

**Completeness at the start.** Every criterion the mission depends on belongs in the rule from day one, including the ones that are awkward to compute or rarely matter. Adding a criterion later, even for a good reason, means re-scoring every case that already ran. A program that skips that step is quietly comparing campaigns scored by different rules. It helps to keep every case's full **[[state history|state-history]]**, not just its pass/fail label, so re-scoring is a matter of re-reading stored data rather than re-flying the cases.

## Check yourself

::: check
A campaign is scored with the rule "a case fails if any listed condition is violated." Explain why this rule, and not "a case fails only if all listed conditions are violated," matches a real mission success requirement.
:::

::: answer
A vehicle has succeeded only if every one of its requirements is met at the same time. A landing that is precise but destructive, or soft but off target, has not succeeded, however well it did on the other metrics.

"Fails if any condition is violated" is the logical complement of "passes only if every condition is met", which is the correct statement of mission success. "Fails only if all conditions are violated" would call a case a success as long as it met even one of several separate requirements. It would pass cases that plainly failed the mission.
:::

::: check
Why does moving a threshold after seeing the campaign's results undermine the confidence claim from the zero-failure formula, even if the new threshold is chosen in good faith?
:::

::: answer
The formula's confidence assumes the pass/fail rule was fixed independently of the outcomes. Its derivation treats each case as an independent draw scored against a criterion that does not depend on the data.

Choosing or adjusting the threshold after seeing where the results fall — even with no intent to deceive — makes the rule a function of the very data it is judging. The formula's probability calculation does not account for that. So the reported confidence no longer describes the procedure that was actually followed.
:::

::: check
A campaign's success criterion checks miss distance and propellant remaining but not touchdown tilt, because tilt is "usually fine." What is the risk, and how would you find out whether it has already caused a problem?
:::

::: answer
The risk: a case where the vehicle tips past a safe limit at touchdown — a genuine mission failure — is scored a success as long as its miss distance and propellant happen to be fine. A whole failure mode silently disappears from the reported reliability.

To find out, go back to the full case-by-case data (which is why every case's full state history, not only its label, should be kept) and re-score against the complete criterion. If any case called a success would have failed the tilt condition, every reliability number reported from the original scoring is wrong and must be recomputed.
:::

::: check
"Touchdown velocity shall not exceed $3\,\mathrm{m/s}$" is written into a requirement with no further detail. Give two different computational definitions it could mean, and explain why the difference matters.
:::

::: answer
It could mean the vertical (downward) part of the velocity alone at first contact. Or it could mean the size of the full velocity vector at that instant, including any sideways drift. These are two different numbers for the same trajectory: with lateral drift, the full vector is always larger than its vertical part.

It matters because a case can pass under one definition and fail under the other. Two analysts coding "the same" requirement without agreeing which quantity it means will score an identical campaign differently — exactly the after-the-fact flexibility a precise criterion is meant to remove.
:::

::: check
Partway through a campaign, after several thousand cases have been scored, a program adds a new success criterion: a maximum structural load. What is the correct way to handle the cases that ran before the change?
:::

::: answer
Re-score every earlier case against the complete, updated rule, including the new structural-load condition. Do not leave the old cases under the old scoring while only new cases use the new rule. Otherwise the reported reliability mixes results computed under two different definitions of failure, which is not one valid dataset for the zero-failure formula or any other statistic.

If each case's full state history was kept, as it should be, re-scoring means re-running the criterion on stored data, not re-flying the cases.
:::

## Summary

| Item | Statement |
| --- | --- |
| What a success criterion specifies | Individually precise conditions (velocity, tilt, miss distance, propellant, loads, margin), each with an exact computational definition |
| Combination rule | A case fails if any one condition is violated; it passes only if all hold at once |
| Timing | Fixed, in writing, before the campaign runs — never adjusted after seeing results, even in good faith |
| Threshold sensitivity | A small change in a threshold can change the failure count on unchanged data, so the threshold comes from the requirement, not the data |
| Single-metric scoring | Misses every failure mode that metric cannot see; a complete composite rule is required |
| Criterion changes mid-campaign | Re-score every earlier case against the updated rule, not only new cases |

With the run-count formula and the failure definition both fixed, the next lesson turns to the harder half of the same question: what to do when the probability you need to bound is too small for direct sampling to reach at all.

::: context drawing-the-target-afterward Painting the target around the holes
There is an old joke about a "Texas sharpshooter" who fires at the side of a barn, then paints a bullseye around the tightest cluster of holes and calls himself a marksman. Choosing a pass/fail threshold after looking at the results is the same move. Medicine learned this the hard way: since 2005, major medical journals have required a clinical trial to be registered, with its main outcome stated, before the first patient is enrolled — so nobody can pick the outcome that happened to look good afterward.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="160" height="130" fill="#ffffff" stroke="#6c7a93"/>
  <rect x="190" y="10" width="160" height="130" fill="#ffffff" stroke="#6c7a93"/>
  <g fill="none" stroke="#1d6fd1" stroke-width="2">
    <circle cx="90" cy="75" r="45"/><circle cx="90" cy="75" r="28"/><circle cx="90" cy="75" r="11"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="70" cy="50" r="3"/><circle cx="118" cy="92" r="3"/><circle cx="96" cy="70" r="3"/>
    <circle cx="55" cy="100" r="3"/><circle cx="130" cy="45" r="3"/><circle cx="84" cy="112" r="3"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="215" cy="35" r="3"/><circle cx="330" cy="120" r="3"/><circle cx="300" cy="40" r="3"/>
    <circle cx="232" cy="110" r="3"/><circle cx="286" cy="84" r="3"/><circle cx="292" cy="90" r="3"/>
  </g>
  <g fill="none" stroke="#b4232c" stroke-width="2">
    <circle cx="289" cy="87" r="24"/><circle cx="289" cy="87" r="15"/><circle cx="289" cy="87" r="7"/>
  </g>
  <text x="90" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">target first, then shoot</text>
  <text x="270" y="160" font-size="12" fill="#b4232c" text-anchor="middle">shoot, then draw target</text>
</svg>
```
:::

::: context vertical-or-vector Same landing, two verdicts
Suppose a vehicle touches down falling at $2.8\,\mathrm{m/s}$ while drifting sideways at $1.5\,\mathrm{m/s}$. The vertical part alone passes a $3\,\mathrm{m/s}$ limit. The full vector has size $\sqrt{2.8^2 + 1.5^2} = 3.18\,\mathrm{m/s}$ (by Pythagoras) and fails it. Sideways speed at contact is what tips a vehicle over, so many landing requirements limit vertical and lateral speed separately as well.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="20" x2="60" y2="126" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="60,134 54,122 66,122" fill="#1d6fd1"/>
  <line x1="60" y1="134" x2="112" y2="134" stroke="#f2b880" stroke-width="2.5"/>
  <polygon points="120,134 108,128 108,140" fill="#f2b880"/>
  <line x1="60" y1="20" x2="114.4" y2="123.4" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="120,134 109.1,126.2 119.7,120.6" fill="#b4232c"/>
  <circle cx="60" cy="20" r="4" fill="#1f2a44"/>
  <text x="54" y="80" font-size="11" fill="#1d6fd1" text-anchor="end">2.8 m/s</text>
  <text x="90" y="154" font-size="11" fill="#1f2a44" text-anchor="middle">1.5 m/s sideways</text>
  <text x="100" y="66" font-size="11" fill="#b4232c">3.18 m/s</text>
  <text x="170" y="60" font-size="12" fill="#1d6fd1">vertical only: 2.8 ≤ 3, pass</text>
  <text x="170" y="90" font-size="12" fill="#b4232c">full vector: 3.18 &gt; 3, fail</text>
</svg>
```
:::

::: context leg-stroke Why "the moment of touchdown" is not one moment
Landing legs carry shock absorbers. When the foot pads hit the ground, the legs shorten, or **stroke**, over a fraction of a second, soaking up the vehicle's downward speed the way your knees bend when you jump off a wall. During the stroke the velocity is changing fast. So "touchdown velocity" measured at first pad contact, halfway through the stroke, or averaged over it are three different numbers, and the criterion has to name one.
:::

::: context any-versus-all "Any fails" is the same as "all must pass"
Two ways of saying one rule. "The case passes if every condition holds" and "the case fails if at least one condition is broken" can never disagree: each is the exact opposite, or complement, of the other. Logicians call this De Morgan's law. One red mark anywhere in the row is enough.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="12" y="20" width="44" height="36"/><rect x="68" y="20" width="44" height="36"/>
    <rect x="124" y="20" width="44" height="36"/><rect x="180" y="20" width="44" height="36"/>
    <rect x="236" y="20" width="44" height="36"/><rect x="292" y="20" width="44" height="36"/>
  </g>
  <g fill="none" stroke="#1d6fd1" stroke-width="3">
    <polyline points="24,38 31,46 44,30"/><polyline points="80,38 87,46 100,30"/>
    <polyline points="136,38 143,46 156,30"/><polyline points="248,38 255,46 268,30"/>
    <polyline points="304,38 311,46 324,30"/>
  </g>
  <g stroke="#b4232c" stroke-width="3"><line x1="192" y1="28" x2="212" y2="48"/><line x1="212" y1="28" x2="192" y2="48"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="34" y="72">speed</text><text x="90" y="72">tilt</text><text x="146" y="72">miss</text>
    <text x="202" y="72">fuel</text><text x="258" y="72">load</text><text x="314" y="72">margin</text>
  </g>
  <text x="180" y="98" font-size="13" fill="#b4232c" text-anchor="middle" font-weight="700">one violation: the case fails</text>
</svg>
```
:::

::: context verification-matrix-link Back to the verification matrix
Lesson 1 of this module built the verification matrix: a table with one row per requirement, saying how it will be verified and what the evidence is. The pass/fail threshold for each Monte Carlo criterion belongs in that row, written down before the campaign. Later, when a review board asks "how did you decide a case failed?", the answer is a pointer to a dated entry, not a memory of a meeting.
:::

::: context state-history Keep the whole flight, not just the verdict
A case's state history is its full record over time: position, velocity, attitude, propellant, loads and margins, sampled all the way from start to touchdown. Storing it costs disk space, but it pays back every time a question comes up after the campaign. A new criterion can be checked against stored data in minutes. Without it, every one of thousands of cases must be flown again — and only if the per-case seeds were recorded, as the previous lesson urged.
:::
