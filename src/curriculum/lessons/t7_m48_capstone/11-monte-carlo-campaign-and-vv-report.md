---
id: l11-monte-carlo-campaign-and-vv-report
title: The Monte Carlo campaign and the V&V report
minutes: 28
covers:
  - 'Ten thousand dispersed cases in CI, with per-case seeding and bit-exact replay'
  - 'The written V&V report: requirements, evidence, margin plots, failure analysis and known limitations'
---

Every lesson in this module built or joined one piece of the stack and checked it on its own terms. This lesson runs all of it together, as a dispersed campaign, using the verification module's own machinery rather than a parallel set of rules invented for this occasion — the same zero-failure and Clopper–Pearson formulas, the same discipline of declaring a failure before the data exists to tempt a different definition, the same per-case seeding this module's own simulation prerequisite built. Then it reports what that campaign actually found, including the part every V&V report is tempted to soften: how many cases failed, and why.

## Why ten thousand, and why this lesson runs three hundred

The verification module's continuous-integration tiers exist for a reason worth restating precisely here: a per-push gate runs a small, fixed-seed batch in minutes; a nightly build runs the full campaign; a release runs everything plus the assembled report. Ten thousand cases is the *nightly* figure specifically because it is what a full, flight-representative simulation can afford once a day, not because ten thousand is a number with any significance on its own.

::: example Pricing this module's own campaign against that budget
The closed-loop simulation this lesson runs — navigation, guidance, control and their measured error characteristics, combined exactly as the earlier lessons in this module built them — costs about $61.5\,\mathrm{ms}$ per case on ordinary single-core hardware. Ten thousand cases at that price is

$$
10{,}000 \times 61.5\,\mathrm{ms} = 615{,}000\,\mathrm{ms} \approx 10.3\,\text{minutes},
$$

comfortably inside any nightly window, on a single core, with room to spare. That price is honest about what it is pricing: this module's own teaching-level simulation, built for tractable, verifiable numbers rather than flight-representative fidelity throughout. A full six-degree-of-freedom flight simulation, the kind a real programme would run its actual ten-thousand-case nightly campaign against, costs meaningfully more per case — the verification module's own worked example used $42\,\mathrm s$ per case for exactly that reason — and this lesson is explicit that its own campaign is not that simulation. What follows runs $300$ cases rather than $10{,}000$, a size chosen so a reader can reproduce every number in this lesson in well under a minute, and every method used to interpret those $300$ cases is exactly the method a real $10{,}000$-case campaign would use on its own, larger result.
:::

## Declaring a failed case before running a single one

The verification module was specific about this discipline: a case is scored a failure if *any one* of a fixed, precisely defined set of conditions is violated, decided in writing before the campaign runs, never adjusted afterward to match what the data happened to show. This lesson's campaign fixed the following criteria before the $300$ cases below were generated:

::: key This campaign's declared failure criteria
A case fails if touchdown vertical speed exceeds $4.0\,\mathrm{m/s}$, **or** touchdown lateral speed exceeds $3.0\,\mathrm{m/s}$, **or** lateral miss distance exceeds $7.5\,\mathrm m$, **or** propellant remaining falls below $150\,\mathrm{kg}$, **or** the navigation-consistency monitor from the FDIR lesson trips more than $40$ times during descent, **or** the vehicle exhausts its propellant before touchdown. A case passes only if every condition holds.
:::

## Per-case seeding and bit-exact replay

Each case draws its dispersed initial conditions, sensor errors, environment disturbance and fault occurrence from independent sub-streams spawned from one case-specific seed, exactly the `numpy.random.SeedSequence(case_seed).spawn(n)` pattern the simulation module built and justified: changing how many random numbers one model consumes can never shift what any other model in the same case draws, and re-running case seed $2{,}000{,}042$ on any machine, at any later date, reproduces that case bit-for-bit, because nothing about it depends on wall-clock time, thread scheduling, or which cases ran before it. Every one of this lesson's $32$ touchdown-speed failures and $14$ navigation-consistency failures below is, individually, a specific seed an engineer could re-run tonight and step through in full.

## The campaign, run and reported

::: example Three hundred cases, dispersed across mass, thrust, initial condition, sensor noise, wind and a dispersed GNSS dropout
Running the declared criteria against the full campaign:

| Result | Count |
| --- | --- |
| Passed | $261$ |
| Failed | $39$ |
| — failed on touchdown vertical speed | $32$ |
| — failed on navigation consistency | $14$ |
| — failed on touchdown lateral speed | $1$ |

(Some failing cases trip more than one criterion, so the reason counts do not sum to $39$.) The miss-distance distribution itself is tight: the median (circular error probable) is $0.161\,\mathrm m$, the $95$th percentile by nearest rank is $0.530\,\mathrm m$, the $99$th is $1.01\,\mathrm m$ — none of them close to the $7.5\,\mathrm m$ miss-distance limit, which never triggered a single failure in this campaign. Every failure came from touchdown speed or navigation consistency, not from missing the pad.
:::

Applying the verification module's own Clopper–Pearson bound to $k=39$ failures in $n=300$ trials, at $95\%$ confidence, gives an upper bound on the true failure probability of $16.6\%$ — a defensible reliability claim of **at least $83.4\%$**, computed by the identical method the verification module used for its own worked examples, only with $k$ no longer zero. That is far short of the $99.87\%$ landing-accuracy target the error-budgeting lesson in this module set out to satisfy, and reporting that shortfall plainly, rather than narrowing the campaign until it disappears, is the entire point of running the campaign at all.

::: example What is actually driving the touchdown-speed failures
A simple correlation check against each dispersed input — ignition altitude, ignition velocity, propellant load, specific impulse, thrust level — against touchdown speed finds nothing dominant: every correlation coefficient sits below $0.12$ in magnitude, no single dispersed parameter explains the spread. What does explain a meaningful share of it is the GNSS dropout: dropout cases average $4.24\,\mathrm{m/s}$ touchdown speed against $2.81\,\mathrm{m/s}$ for cases with continuous GNSS, and **every** dropout case is also a navigation-consistency failure — the dropout is not two separate problems, it is one cause with two visible symptoms, exactly the kind of finding a sensitivity check that only ever regresses against a single scalar input at a time would never surface, because the driver here is a discrete event, not a continuous dispersed parameter.
:::

## What this result does to the error budget

The error-budgeting lesson early in this module allocated a one-sigma landing-accuracy budget of $3.33\,\mathrm m$, split across navigation, guidance, control and site knowledge. Measured against that specific allocation, this campaign is a triumph — a $95$th-percentile miss distance of $0.53\,\mathrm m$ leaves enormous margin against a budget built around numbers several times larger. And that comparison is also, on its own, badly misleading, for exactly the reason the error-budgeting lesson warned about at the time: that budget answers one question, how far from the pad, and this campaign's actual failures never came from that question at all. Touchdown speed was never allocated a budget in that chapter, because the requirement it was built against never named one — and touchdown speed is where every one of this campaign's meaningful failures lives. A programme that read only the miss-distance numbers from this campaign and declared the mission verified would have audited the one metric this vehicle was never at risk on, and missed the one it actually failed.

::: warning A campaign with huge margin on one metric can still be failing the mission
Do not let a comfortable percentile on the metric your budget happened to name stand in for "the vehicle is ready." This campaign's own numbers are the clearest demonstration this module can offer of exactly the trap the verification module's lesson on composite failure criteria warned against: score only the visible metric, and a real, fifteen-of-three-hundred-cases failure mode hides in full view of a report that looks clean.
:::

## The written report, section by section

A verification report has to let an engineer who has never seen this project audit every claim in this lesson back to a plot or a test, not merely assert a conclusion. Built from what this module has already produced:

**System description**: the four-module decomposition and the rate architecture from this module's first three lessons — one diagram, the interface table, the nested rate hierarchy.

**Requirements and verification matrix**: the $10\,\mathrm m$ / $99.87\%$ landing-accuracy requirement, the one-sigma allocation across navigation, guidance, control and site knowledge, each pointing to the specific lesson and number that verifies or, honestly, fails to verify it.

**Navigation performance**: the filter's NEES consistency figures, the correlated-error touchdown-miss table, both from this module's navigation lesson, with the planar reduction and the calibrated-gyro-bias assumption stated as exactly that — assumptions, not findings.

**Guidance performance**: re-solve timing (cold and warm), the deadline-policy cost table, and the measured gap between guidance's implied reorientation rate and what the vehicle can actually deliver, all from this module's guidance lesson.

**Control performance**: the gain-schedule margin table showing exact invariance across the burn, the notch's measured depth and phase cost, and the windup comparison showing which anti-windup scheme actually recovers from the mode-transition step.

**Monte Carlo results**: this lesson's own table — $39$ of $300$ failed, $83.4\%$ reliability at $95\%$ confidence, the dropout-driven sensitivity finding, and the CEP and percentile figures, none of them rounded up or softened.

**Sensitivity drivers**: GNSS dropout, identified above as the dominant, discrete driver of the campaign's real failures, and the specific next step it implies — either reducing dropout probability or hardening the response to one, not re-running the campaign with a more forgiving criterion.

::: key Known limitations, written first and honestly
This campaign ran $300$ cases, not the $10{,}000$ a flight programme would run nightly, and its confidence bound is correspondingly weaker than a flight claim would need. Its vehicle dynamics are planar, not full six-degree-of-freedom. Its navigation and control error models, in the large campaign, are calibrated surrogates drawn from this module's own smaller, higher-fidelity studies rather than the full coupled filter and actuator dynamics re-run on every single case — a deliberate, stated trade against compute cost, not a hidden shortcut. Its convex re-solve uses a general-purpose teaching solver, not a flight-representative embedded SOCP implementation. None of these limitations were discovered after the fact; every one of them was a decision made and stated at the point this module made it, which is the only way a reader can weigh how much of this module's confidence to actually trust.
:::

Writing that section first, as the verification module's own material insists, is not a formality. It is the section that turns this module's numbers from a demonstration into something an engineer who did not build it could actually audit — able to tell, for every claim in this lesson, exactly how much of it is proven, how much is measured, and how much is a stated, bounded assumption standing in for a fuller study this module's own scope did not reach.

## Check yourself

::: check
Explain why this lesson's $300$-case campaign uses the identical Clopper–Pearson formula the verification module built for its own examples, rather than a simpler calculation suited to a smaller sample.
:::

::: answer
The Clopper–Pearson bound is exact for any sample size and any observed failure count, including zero — the zero-failure formula the verification module derives first is the special case $k=0$ of the same underlying calculation. There is no separate, simpler formula this lesson's $k=39$, $n=300$ case needs; using the identical general method the verification module already built and justified is both correct and exactly the instruction this module gives to reuse the V&V module's own machinery rather than inventing a parallel one.
:::

::: check
A reviewer asks why this campaign's own reliability claim, $83.4\%$ at $95\%$ confidence, is reported at all, given that it falls so far short of the $99.87\%$ requirement. Why is reporting it the correct choice rather than a sign the campaign should be re-run with looser failure criteria until it passes?
:::

::: answer
The criteria were declared before the campaign ran specifically so that a result like this one could not be quietly adjusted away — loosening the criteria after seeing the outcome would produce exactly the "choose the answer, then find a rule that produces it" failure the verification module's lesson on defining a failed case warns against by name. Reporting an honest shortfall, with its specific drivers identified, is what lets the programme fix the actual problem — here, GNSS dropout handling — rather than hide it behind a criterion redefined until the number looks acceptable.
:::

::: check
The sensitivity check in this lesson found every simple correlation with a single dispersed input below $0.12$ in magnitude, yet identified GNSS dropout as a clear, dominant driver. Reconcile these two findings.
:::

::: answer
A linear correlation coefficient measures how well a *continuous* dispersed parameter predicts an outcome across the whole sample; GNSS dropout in this campaign is a discrete event, present in some cases and absent in others, not a continuously varying quantity any single correlation coefficient was computed against. Splitting the campaign by that discrete condition — dropout versus no dropout — and comparing the two groups' outcomes directly reveals the driver a correlation against continuous inputs alone was never positioned to find, which is exactly why this lesson ran both checks rather than stopping at the first one.
:::

::: check
Explain what "bit-exact replay" specifically buys an engineer investigating one of this campaign's $32$ touchdown-speed failures, beyond simply knowing that case's final reported numbers.
:::

::: answer
The final reported numbers alone show only the outcome, not the mechanism; bit-exact replay lets the engineer re-run that exact case's seed and step through the entire trajectory — every sensor sample, every guidance re-solve, every control command — on demand, reproducing the identical run rather than a statistically similar one. That is what turns a failure count into a diagnosis: replaying case seed $2{,}000{,}042$ bit-for-bit is what would let an engineer confirm, directly, whether that specific case's high touchdown speed traces to the GNSS dropout this lesson's sensitivity check flagged or to some other combination of dispersed conditions.
:::

::: check
Why does this lesson insist the "known limitations" section of the written report be written first, rather than last, after every other section has been drafted?
:::

::: answer
Writing it first prevents it from being softened by everything already written to sound confident in the sections before it — a limitations section drafted last, after pages describing what the campaign did show, tends to shrink to match the tone already set, while one written first has to stand on its own, honestly, before any of the module's more flattering results are in front of the writer. It is also the section an auditing engineer most needs early, since it tells them exactly how much weight every other section's numbers can actually bear before they read a single one of them.
:::

## Summary

| Item | Statement |
| --- | --- |
| CI sizing | This module's own campaign: $\approx61.5\,\mathrm{ms}$/case, $10{,}000$ cases $\approx10.3\,\mathrm{min}$ — a real nightly campaign against a full 6-DoF sim costs meaningfully more per case |
| Failure criteria | Declared before running: touchdown $\lvert v_z\rvert$, $\lvert v_x\rvert$, miss distance, propellant reserve, navigation consistency, propellant exhaustion — fails on any one |
| Per-case seeding | `SeedSequence(case_seed).spawn(n)`, one independent sub-stream per model — any case reproducible bit-for-bit |
| Result, $n=300$ | $39$ failed ($32$ on touchdown speed, $14$ on navigation consistency, $1$ on lateral speed); reliability $\ge83.4\%$ at $95\%$ confidence (Clopper–Pearson) |
| Miss distance | CEP $0.161\,\mathrm m$, $95$th percentile $0.530\,\mathrm m$, $99$th $1.01\,\mathrm m$ — never the actual failure driver |
| Dominant driver | GNSS dropout: one cause, both the navigation-consistency and the elevated-touchdown-speed symptoms |
| Error-budget lesson | A budget scoped to miss distance alone had nothing to say about the metric that actually failed |
| Report structure | System description, requirements matrix, per-subsystem performance, Monte Carlo results, sensitivity drivers, known limitations — the last written first |

This module opened by decomposing a landing GNC stack into four modules and an interface table. It closes with those same four modules, run together, dispersed, scored against a criterion fixed before anyone saw the results, and reported with its actual shortfall stated plainly rather than smoothed away — which is the entire difference between a demonstration and an engineering result.
