---
id: l12-continuous-integration-and-closing-the-loop
title: Continuous integration and closing the loop
minutes: 19
covers:
  - 'Continuous integration for flight and simulation software: what runs on every commit, what runs nightly, what runs before a release'
  - Test-as-you-fly, and the risk taken every time you deviate from it
  - Anomaly investigation, flight data reconstruction, and closing the loop by updating the models
---

Every technique this module has built — the run-count formula, LinCov, the margin sweep, MC-DC coverage — is only as valuable as how often it actually runs. A verification technique exercised once, by hand, before a single review, catches whatever it catches at that moment and nothing introduced afterward. This lesson closes the module with the three practices that turn verification from an event into a standing property of the program: continuous integration, which runs the checks on every change automatically; test-as-you-fly, which asks how honestly the testing represents the flight it verifies; and the discipline, after the vehicle actually flies, of finding out whether any of it was right.

## Continuous integration: three tiers, three purposes

A flight and simulation codebase runs its verification at three cadences, each sized to what it needs to catch and how fast it needs to catch it.

**On every push**, before a change merges: build with every compiler warning treated as an error, run the full unit and regression suite, run static analysis, and run a small, **fixed-seed** reduced Monte Carlo — a few hundred cases, not thousands — checking the same success criteria and margin requirements a full campaign would, plus a worst-case-execution-time gate on the flight code. The fixed seeds matter specifically here: a per-commit check that drew fresh random dispersions every time would occasionally pass or fail a marginal case by chance alone, and a check whose failure is not reproducible from one run to the next is not trustworthy as a gate. A fixed, recorded seed set makes a regression deterministic — it fails the same way every time until it is actually fixed.

**Nightly**, the full campaign: the complete ten-thousand-case dispersed run, on whatever parallel compute the program has, with its results trended over time rather than only checked pass or fail — a slow drift in the ninety-ninth-percentile miss distance across two weeks of otherwise-passing commits is exactly the kind of signal a single per-commit gate is too small to see, and exactly what a trended nightly result is built to show.

**Per release**, everything the two faster tiers ran, plus the full code-coverage measurement and the assembled verification report itself — the artifact, built from every earlier lesson in this module, that a flight readiness review actually reads.

::: example Sizing the three tiers against a real time budget
A dispersed case costs $42\,\mathrm{s}$ of single-core compute on a representative $64$-core build cluster. A per-commit budget of $10$ minutes fits $200$ cases comfortably: $200\times42/64 = 131\,\mathrm{s}$, about $2.2$ minutes. A nightly budget of eight hours ($480$ minutes) fits the full $10{,}000$-case campaign with room to spare: $10{,}000\times42/64 = 6563\,\mathrm{s}$, about $109$ minutes. A pre-release campaign of $50{,}000$ cases, though, does **not** fit the same eight-hour window on the same cluster: $50{,}000\times42/64=32{,}813\,\mathrm{s}$, about $547$ minutes — sixty-seven minutes over budget, which is exactly the kind of arithmetic that decides whether a program needs more cores, a longer release cadence, or a smaller pre-release campaign, worked out in advance rather than discovered the night before a review. Fitting the full $10{,}000$-case set into a tighter one-hour nightly window instead needs $10{,}000\times42/3600 \approx 117$ cores — a concrete number a program can budget for rather than an open-ended request for "more compute."
:::

::: example Injecting a known fault to prove the gate actually catches it
A margin-tracking dashboard shows a rate-loop gain margin averaging $8.49^\circ$ (standard deviation $0.15^\circ$) across the first fourteen commits of a design cycle. Commit fifteen introduces a deliberate sign error in a gain-tuning change, dropping the true margin to about $5.1$–$5.3^\circ$ — comfortably below a $6.0^\circ$ CI gate. The per-commit check, run with the same fixed-seed reduced campaign at every commit, catches the fault at exactly commit fifteen and every commit afterward, failing the build with a message naming the specific margin criterion that was violated, not a generic test failure:

```python
import numpy as np
rng = np.random.default_rng(3131)
commits = np.arange(1, 21)
true_margin = np.where(commits < 15, 8.5, 5.2)     # a sign error lands at commit 15
margin = true_margin + rng.normal(0, 0.15, len(commits))
threshold = 6.0
first_fail = commits[margin < threshold]
print(first_fail[0])   # 15
```

This is worth doing on purpose, not only trusting in principle: a CI pipeline that has never actually been made to fail on a known, deliberately injected defect has never demonstrated that it can fail at all. Injecting a specific fault — a sign flip, a disabled check, a corrupted seed file — and confirming the pipeline goes red, with a message that correctly identifies the failing criterion, is itself a verification activity, applied to the verification system.
:::

::: key
Per push: build with warnings as errors, run unit and regression tests, run static analysis, run a small fixed-seed reduced Monte Carlo, and gate on margin and worst-case execution time. Nightly: the full campaign, with results trended over time. Per release: all of the above plus full coverage measurement and the assembled verification report.
:::

The underlying reason a serious verification effort invests in compute at all is not the raw case count but the **iteration rate** it buys: a campaign that finishes overnight supports a design decision every day; a campaign that takes a week means the team effectively stops testing design changes against it, because no one can afford to wait a week between iterations. Every technique in this module — LinCov as the fast complement, a reduced fixed-seed set on every commit, a full campaign only nightly — is, among other things, an answer to the same underlying question: how do you keep the verification loop fast enough that people actually keep using it.

## Test-as-you-fly

A test campaign verifies whatever it actually exercises, in the configuration it actually exercises it — no more. **Test-as-you-fly** is the discipline of testing in the exact configuration, sequence and environment the vehicle will actually experience in flight, and the reason it is a named discipline rather than an assumed default is that real test programs deviate from it constantly, usually for good practical reasons, and every deviation is a specific piece of the flight that was never actually tested.

A **stubbed interface** — a software or hardware stand-in for a component not yet available — means the real interface's timing, failure modes and edge-case behavior were never exercised, only the stub's, which is whatever the team who built it assumed the real thing would do. A **scaled model**, used where full-scale testing is impractical, does not validate whether effects that do not scale linearly — aeroelastic response, thermal behavior, certain fluid dynamics — actually behave the same way at full scale; a result from the scaled article is evidence about the scaled article, extrapolated. A **skipped mode transition** — testing steady prelaunch and steady ascent but never the specific instant of liftoff, or testing entry and landing separately but never the transition between them — misses exactly the kind of transient where a real defect is disproportionately likely to live, since a transition is where control authority, sensor validity and software state are all changing at once. **Ground support equipment left connected** during a test that is meant to verify autonomous flight behavior means the vehicle never demonstrated it can actually do without the ground crutch — power, cooling, a wired command path — that will not exist once it actually flies.

Each of these is sometimes genuinely unavoidable: some environments — true vacuum ignition, true microgravity over a meaningful duration — cannot be reproduced on the ground at any reasonable cost, and some hardware genuinely is not ready in time for an otherwise-scheduled test. The discipline is not that deviation is forbidden; it is that every deviation must be **listed explicitly and justified in writing**, entered into the same verification matrix the first lesson of this module built, with an explicit statement of what risk the deviation accepts and why that risk is judged acceptable. A deviation nobody wrote down is a gap in the evidence nobody can weigh, which is a fundamentally different situation from a deviation the program looked at, understood, and accepted on the record.

::: warning "It worked in test" answers a narrower question than it sounds like it does
A test that passed with a stubbed interface, a scaled model, a skipped transition, or GSE connected has verified the vehicle in that configuration — a real result, worth having, but not the same claim as "the vehicle, as it will actually fly, does this." Treating a test result as evidence for the flight configuration when the test configuration deviated from it in an unlisted way is a quiet way for an untested condition to reach a flight readiness review labeled as tested.
:::

## Closing the loop: flight data reconstruction and anomaly investigation

Every model this module has built — the dispersion set, the LinCov linearization, the margin sweep — is a prediction, checked so far only against itself, or against ground test data collected before the vehicle ever flew. Flight is the one dataset no simulation produced, and a program that never compares its predictions against what the vehicle actually did is, in effect, validating its models only against the models' own assumptions, forever.

**Flight data reconstruction** is the corrective step: after a flight, use the recorded telemetry to estimate, as precisely as the instrumentation allows, what the vehicle actually did — its true trajectory, attitude history and touchdown state, typically by a post-flight estimation process considerably more thorough than what ran onboard in real time — and, separately, what the environment actually was: the winds, the density profile, the conditions the dispersion set only ever modeled as a distribution. Comparing the reconstructed truth against the pre-flight prediction, case by case and parameter by parameter, is what tells a program whether its models are actually correct, rather than merely internally consistent, and every meaningful discrepancy found this way is fed back into updating the models and the dispersion set that the next campaign will run against. A dispersion set never checked against a single flight is a set of assumptions that has only ever been asked to agree with itself.

This applies even to a flight that succeeds outright. A margin that flight data shows was considerably thinner than predicted, or a touchdown state near the edge of what the campaign called acceptable, is exactly the kind of signal worth investigating on its own terms, independent of whether it caused a visible problem — treating "nothing failed" as "nothing to learn" discards precisely the near-miss information a program most needs to catch before a future flight turns the same gap into an actual failure. An **anomaly** — any flight behavior that did not match the prediction, whether or not it caused a failure — deserves the same investigative discipline the earlier lesson on tail risk described for a cluster of Monte Carlo failures: reconstruct exactly what happened, trace the mechanism through the actual flight data, and classify it — a real vehicle limitation the models correctly predicted the existence of but underestimated the size of, a genuine defect in the flight software or hardware, or a limitation in the simulation model itself that produced a confident but wrong prediction. Each classification points to a different fix, and none of them is available to a program that treats a successful flight as needing no further examination once it lands.

## Check yourself

::: check
Explain why the per-commit reduced Monte Carlo in a CI pipeline uses fixed random seeds rather than fresh random draws on every run.
:::

::: answer
A check whose pass or fail outcome depends on which random dispersions happened to be drawn that particular run is not reproducible — a marginal case might pass on one run and fail on the next purely by chance, with nothing about the code having changed. Fixed seeds make the reduced campaign deterministic: the same commit produces the same result every time it is checked, so a failure is a repeatable, debuggable fact about that commit rather than a matter of which random numbers happened to come up.
:::

::: check
A program's nightly campaign passes every night for three weeks, with the 99th-percentile miss distance slowly increasing from $28\,\mathrm{m}$ to $41\,\mathrm{m}$ over that period, never crossing the $50\,\mathrm{m}$ requirement. Why is this worth flagging even though every individual night's result passed?
:::

::: answer
A per-commit or per-night gate only checks whether the current result crosses the requirement threshold; it says nothing about the trend leading up to that result. A steady climb from $28\,\mathrm{m}$ toward a $50\,\mathrm{m}$ limit, even while every individual night stays under it, indicates something is systematically eroding margin over time — an accumulating series of small design or code changes, for instance — and catching that trend early, while there is still room before the requirement, is considerably cheaper than waiting for a single night to finally cross the line. This is exactly why nightly results are trended over time rather than only checked pass or fail.
:::

::: check
A test program stubs the parachute deployment interface because flight hardware is not yet available, and successfully completes an otherwise full end-to-end descent test. What has this test verified, and what has it not?
:::

::: answer
It has verified the vehicle's behavior up to and around the deployment interface, using the stub's behavior in place of the real hardware's — a real and useful result for everything else in the sequence. It has not verified the actual parachute deployment mechanism's timing, failure modes, or interaction with the rest of the vehicle at the moment of deployment, since none of that was exercised by a stub standing in for it; that remains an untested piece of the flight that must be listed as a deviation and closed by some other means before the requirement it bears on can be considered verified.
:::

::: check
A flight succeeds completely — every requirement met, no anomalies flagged by the onboard system. A reviewer asks whether flight data reconstruction is still worth doing. What is the correct answer?
:::

::: answer
Yes: flight data reconstruction is how a program finds out whether its models were actually correct, not only whether the vehicle happened to succeed, and a fully successful flight can still reveal that a margin was thinner than predicted or that an input dispersion was reconstructed differently from what the model assumed, information that is only visible by comparing the reconstructed truth against the pre-flight prediction directly. Skipping reconstruction after a clean flight means the models that produced that flight's verification claim are never actually checked against reality, leaving the next campaign to run on assumptions validated only against themselves.
:::

::: check
Two anomalies are found during flight data reconstruction: one traces to a real, previously unmodeled aerodynamic effect, and the other traces to a bug in the reconstruction software itself that misestimated a state. Explain why classifying an anomaly correctly, rather than only noting that a discrepancy occurred, matters for what happens next.
:::

::: answer
The two cases call for entirely different fixes: the real aerodynamic effect belongs in the dispersion set and the vehicle model for every future campaign, since it is a genuine, previously missing piece of physics, while the reconstruction bug belongs in the reconstruction software itself and casts no doubt on the vehicle's actual flight performance at all. Treating both merely as "a discrepancy was found" without tracing each to its actual mechanism risks the wrong response in both directions — updating the vehicle model to chase an artifact that was never physically real, or dismissing a genuine new failure mode because it superficially resembled a known software quirk.
:::

## Summary

| Item | Statement |
| --- | --- |
| Per-push CI | Build with warnings as errors, unit and regression tests, static analysis, fixed-seed reduced Monte Carlo, margin and WCET gates |
| Nightly CI | Full dispersed campaign, results trended over time to catch slow drift, not only threshold violations |
| Per-release CI | Everything above, plus full coverage measurement and the assembled verification report |
| Why fixed seeds | Makes a per-commit gate's pass/fail outcome deterministic and reproducible, not a function of which random draw occurred |
| Test-as-you-fly | Test in the exact configuration, sequence and environment of the actual flight; every deviation (stub, scaled model, skipped transition, connected GSE) must be listed and justified |
| Flight data reconstruction | Estimate what the vehicle and the environment actually did, post-flight, and compare against the pre-flight prediction |
| Closing the loop | Every meaningful discrepancy — even from a fully successful flight — feeds back into updating the models and the dispersion set the next campaign runs against |
| Anomaly classification | Real vehicle limitation, genuine defect, or simulation artifact — each points to a different fix, and conflating them misdirects all three |

This is where the module's arc closes: a dispersion set built and justified, sized and scored honestly, cross-checked by a fast linear method against a full campaign, verified against its own tail rather than a sigma multiple, checked for the drivers and the corners of the envelope it might have missed, verified across the flight envelope and inside the code itself, run automatically on every change — and, once the vehicle actually flies, checked one more time against the only dataset none of it was allowed to see in advance.
