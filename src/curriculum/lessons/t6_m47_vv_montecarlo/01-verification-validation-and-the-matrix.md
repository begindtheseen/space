---
id: l01-verification-validation-and-the-matrix
title: Verification, validation, and the verification matrix
minutes: 20
covers:
  - Requirements, verification and validation; the verification matrix that maps every requirement to its evidence
  - Verification by analysis, test, inspection and demonstration, and choosing correctly between them
---

Every earlier module in this curriculum produced numbers: a filter's covariance, a controller's phase margin, a guidance law's convergence radius, a simulation's landing dispersion. None of those numbers is worth anything to a flight readiness review on its own. A review board does not ask whether your Kalman filter is elegant or your Monte Carlo is large; it asks whether a specific, numbered requirement is met, what evidence closes it, and why that evidence is sufficient. This module is about building that evidence, and this lesson is about the vocabulary and the one document — the verification matrix — that every later lesson in the module ultimately feeds.

A GNC engineer meets this discipline on the first day of a real program and never leaves it. The requirement that a landing error stay under some radius at some confidence, the requirement that a control loop hold a stated margin everywhere in the envelope, the requirement that flight software contain no unhandled exception in a safety-critical path — each is a row in a table somewhere, and each row has a column asking how you know it is true. Everything from here to the end of the module is technique for filling that column honestly.

## Requirements, verification, and validation

A **requirement** is a precise, testable statement of what the system must do, ideally with a number and a unit, and traceable to something above it — a higher-level requirement, an interface agreement, or a mission need. "The vehicle shall be safe" is not a requirement; it cannot be tested. "The probability of the vehicle leaving the designated hazard corridor during ascent shall not exceed $10^{-4}$" is a requirement: it names a condition, a threshold, and implicitly a method capable of producing that kind of number.

**Verification** asks whether the system, as built, meets its requirements, as written. It is a comparison against a specification: take the requirement's stated threshold, take evidence about the actual system, and show the evidence satisfies the threshold. **Validation** asks a different question: whether meeting the requirements produces a vehicle that actually does the job the mission needs. It is a comparison against reality rather than against a document.

The distinction matters because it is entirely possible to verify perfectly against a requirement that is itself wrong or incomplete. Suppose a requirement specifies a landing accuracy of $50\,\mathrm{m}$ at $99\%$ confidence, and the vehicle demonstrably meets it — verification succeeds. If the actual landing site is a pad $30\,\mathrm{m}$ across, the mission still fails, because the requirement itself did not capture what the mission needed. That is a validation failure: the vehicle did exactly what it was asked to do, and what it was asked to do was not enough. The reverse also happens — a requirement demands more precision than the mission needs, verification is expensive or impossible, and the fix is to revisit the requirement rather than the vehicle. Validation is therefore a question about requirements; verification is a question about evidence against requirements already agreed to be correct. This module is almost entirely about verification, because validation is a systems-engineering and mission-design activity that happens earlier and elsewhere — but a GNC engineer who cannot state the distinction on demand will, sooner or later, defend a verified-but-wrong requirement as though it settled the argument.

::: key
**Verification**: did we build the thing right — does the system meet its requirements? **Validation**: did we build the right thing — do the requirements, once met, satisfy the actual mission need? Verification is checked against a specification; validation is checked against reality.
:::

## The verification matrix

A program with a few hundred requirements cannot be verified by memory or by scattered reports, so the working artifact is a single table: the **verification matrix**, with one row per requirement. A usable row carries at minimum:

- the requirement statement, with its number, unit, and any statistical qualifier (a threshold alone, or a threshold at a stated confidence);
- the verification **method** or methods that apply to it;
- the **success criterion**: the specific numeric or binary condition the evidence must satisfy to close the row, stated precisely enough that two engineers reading it would agree on whether a given result passes;
- the **evidence artifact**: the actual analysis report, test report, inspection record, or demonstration log that contains the result — not a promise that one will exist, but a reference to the one that does;
- a **status**: open, in progress, or closed, with the date and the name of whoever signed it off.

The matrix is the document a review board actually reads. Nobody at a flight readiness review re-derives your Monte Carlo campaign or re-runs your static analysis; they read the row for each requirement, check that the evidence artifact exists and says what the row claims, and check that the success criterion is the right one for what the requirement actually demands. Every technique the rest of this module teaches — sizing a Monte Carlo campaign, propagating a covariance, sweeping a stability margin, measuring code coverage — exists to produce one cell of one row of this table, with enough rigor that the cell survives that reading.

Two disciplines keep the matrix honest. **Traceability** runs in both directions: every requirement must map to at least one row with a method attached, and every substantial piece of analysis or test should map back to the requirement it was run to close, so that neither an untested requirement nor an orphaned analysis survives to the review unnoticed. **Precision in the success criterion** prevents the matrix from becoming a wish list — "verify the landing accuracy is acceptable" closes nothing, while "the 99th percentile of radial miss distance over a 10,000-case dispersed Monte Carlo campaign shall not exceed $50\,\mathrm{m}$" closes exactly when a specific number, computed a specific way, clears a specific line.

## The four methods

Every requirement is closed by one or more of four methods, and each has a domain it is suited to and a limitation it cannot escape.

**Analysis** is computation: modeling, simulation, or calculation applied to the system or a representation of it. Its strength is coverage — a dispersion campaign or a linear covariance analysis can sweep hundreds of uncertain parameters and produce a probabilistic statement that no finite amount of physical testing could ever produce directly, at a cost of CPU-seconds rather than hardware. Its weakness is that it is only as trustworthy as the model behind it; an analysis result is a statement about the model, and it becomes a statement about the vehicle only once the model has been anchored against real data.

**Test** is a physical measurement of the actual hardware or software under controlled, and ideally flight-representative, conditions. Its strength is that it removes the modeling question entirely for whatever it directly measures — an actuator either delivers the commanded torque on the bench or it does not. Its weakness is cost, time, and reach: a test campaign runs at the pace and expense of hardware, so the number of trials is always small compared to what a probabilistic requirement at high confidence demands, and some conditions (true vacuum, true zero-g, the exact thermal history of a specific flight) are difficult or impossible to reproduce on the ground.

**Inspection** is an examination of the item, or of a document describing it, for a specific static or physical characteristic: a dimension, a mass, the presence of a part, a certificate of conformance, a line in a source file. Its strength is that it is cheap and its result is nearly always unambiguous. Its weakness is scope: inspection can confirm that a bolt is torqued to spec or that a fairing envelope is respected, but it says nothing about dynamic behavior — it cannot verify a control margin or a reliability claim.

**Demonstration** is operating the system, or a representative version of it, through a scenario to show a capability exists, usually judged qualitatively rather than against a numeric tolerance. Its strength is that it exercises an end-to-end path — including human operators and procedures — that no analysis model fully captures and no isolated bench test reaches. Its weakness is statistical: a single successful demonstration, or even several, does not bound a probability, and a demonstration that succeeds does not reveal how close it came to failing.

Choosing among them starts from the shape of the requirement. A numeric requirement that must hold across a dispersion of conditions is analysis's natural territory, anchored by enough test data to trust the model doing the sweeping. A static, physical characteristic is inspection's territory. A hardware capability under a controlled, repeatable load is test's territory. An end-to-end operational capability, especially one that crosses a human interface or a procedure, is demonstration's territory. Many requirements need more than one method at once — a landing-accuracy requirement is closed by analysis for the probabilistic claim, anchored by tests of the specific sensors and actuators the analysis models, which is the pattern the rest of this module builds out in full.

::: example A verification matrix for six representative requirements
| # | Requirement | Method(s) | Why |
| --- | --- | --- | --- |
| 1 | Landing miss distance $\leq 50\,\mathrm{m}$, $99\%$ confidence | Analysis, anchored by test | Probabilistic, dynamic, dispersed — only analysis can sweep it; sensor and actuator test data validates the model doing the sweeping |
| 2 | TVC gimbal slew rate $\geq 12^\circ/\mathrm{s}$ | Test | A hardware capability under controlled load; the bench measures it directly |
| 3 | Guidance software shall contain no unhandled floating-point exception in the powered-descent branch | Analysis (static) + Test (unit/regression) | A code property no physical test alone reaches; static analysis and a test suite together close it |
| 4 | Vehicle shall fit the $4.6\,\mathrm{m}$ fairing envelope with $25\,\mathrm{mm}$ clearance | Inspection | Static, physical, dimensional — a survey against the CAD model settles it completely |
| 5 | Flight termination shall be commandable and confirmable from the ground console within $2\,\mathrm{s}$ | Demonstration + Test | An end-to-end operational path through hardware, software and a human operator, with the RF link timing measured directly |
| 6 | Attitude loop shall hold $6\,\mathrm{dB}$ gain margin and $30^\circ$ phase margin at every point of the nominal and dispersed trajectory | Analysis | A continuous claim across flight time and dispersion; no finite set of tests could cover it, only a swept linear analysis, as a later lesson in this module works out in full |

Notice the pattern: requirements 2 and 4 are closed by one method because their nature admits no ambiguity about which one applies. Requirements 1, 3 and 5 need more than one, because a single method's weakness is exactly what the other supplies — test grounds the model that analysis then sweeps; a demonstration proves the operational path while a bench test proves the timing number inside it.
:::

::: example Why an unaided test campaign cannot close a high-confidence reliability requirement
Suppose a requirement reads: the vehicle shall demonstrate $99.9\%$ reliability at $95\%$ confidence, based on a run history with no failures. A later lesson in this module derives the exact relationship, but the headline number is already usable here: a clean run history needs on the order of $3000$ trials to support that claim. A full-up integrated test — a hot-fire, a drop test, a flight — is expensive and slow enough that even an aggressive program rarely accumulates more than a few dozen of them across its entire life, orders of magnitude short of $3000$.

Verifying this requirement by test alone is therefore not merely expensive, it is not achievable within any real program's schedule or budget. The requirement is instead closed by analysis: a simulation that can run thousands of dispersed cases in the time a single physical test takes to set up, validated by the modest number of physical tests the program can actually afford. The tests do not directly demonstrate the reliability number; they demonstrate that the simulation computing it can be trusted. This is the general shape of nearly every high-confidence probabilistic requirement on a vehicle, and it is the reason analysis, not test, carries almost the entire weight of the rest of this module.
:::

::: warning A successful demonstration is not a probabilistic verification
A single successful flight, or a handful of them, is a demonstration: it shows the capability exists and the procedure works. It is not evidence for a numeric reliability or dispersion requirement, because a demonstration says nothing about how close the result came to the boundary or how it would have gone with different noise. Treating "it worked this time" as verification of "it works with probability $0.999$" is one of the most common and most dangerous confusions in a flight readiness review, and the fix is always the same: name the method the requirement actually needs, and do not let a convenient success substitute for it.
:::

## Check yourself

::: check
State the difference between verification and validation, and give an example of a requirement that could be fully verified while the resulting vehicle still fails validation.
:::

::: answer
Verification checks the system against its stated requirements; validation checks the requirements, once met, against the actual mission need. An example: a requirement specifies a communications link with $1\,\mathrm{s}$ of latency, and the vehicle demonstrably meets it — verification succeeds. If the mission actually needs a human-in-the-loop abort decision within $500\,\mathrm{ms}$ of a fault, the vehicle meeting the $1\,\mathrm{s}$ requirement still cannot support that decision in time, and the mission fails despite perfect verification. The requirement itself, not the vehicle, was the error, which is exactly what validation exists to catch.
:::

::: check
A requirement states a hardware capability — a valve shall open within $80\,\mathrm{ms}$ of a command under worst-case supply voltage. Which verification method applies most directly, and why would analysis alone be a weak choice here?
:::

::: answer
Test applies most directly: the valve's response time under a controlled worst-case supply voltage is a physical measurement on the bench, with no modeling ambiguity about what "worst-case supply voltage" or "80 ms" mean once the test is set up. Analysis alone would require a validated model of the valve's electromechanical response across supply voltage, and building and validating that model to the accuracy the requirement demands is more work than measuring the response time directly — analysis is the right tool when a requirement must be checked across a large dispersion or many trajectory points a test campaign could never afford to sample, and this requirement is neither.
:::

::: check
Why does a robust verification matrix often list more than one method against a single requirement, rather than picking the one best method?
:::

::: answer
Because each method's weakness is frequently exactly what another method supplies. Analysis can sweep a full dispersion cheaply but is only as good as its model; test grounds specific quantities in physical reality but cannot afford enough trials to cover a dispersion or reach a high-confidence probabilistic claim on its own. Pairing them — analysis for the coverage, test to validate the model analysis depends on — closes the requirement more defensibly than either method alone, which is why the landing-accuracy and flight-termination rows in the worked example both carry two methods rather than one.
:::

::: check
A program manager proposes closing the $99.9\%$-reliability requirement from this lesson's second example by running $40$ additional integrated flight tests instead of building a validated simulation. Evaluate the proposal quantitatively.
:::

::: answer
Forty clean trials, by the zero-failure relationship this lesson previewed and a later lesson derives, support a far lower reliability claim than $99.9\%$ at $95\%$ confidence — nowhere near the roughly $3000$ trials the claim actually needs. Even a perfect run of $40$ out of $40$ leaves the requirement open by orders of magnitude, and no realistic budget or schedule extends an integrated test campaign from $40$ to $3000$ trials. The proposal does not close the requirement; it produces $40$ more data points that are valuable for validating a simulation, but the simulation, not the test count, is what has to carry the statistical weight.
:::

::: check
A requirement reads: "the vehicle shall be reliable." Explain why this cannot be entered into a verification matrix as written, and rewrite it as something that could.
:::

::: answer
"Reliable" names no threshold, no confidence level, and no method capable of producing a pass/fail result — two engineers could disagree forever about whether any given evidence satisfies it, which is exactly what a usable success criterion must prevent. A workable rewrite states the quantity, the threshold and the statistical basis explicitly: "the probability of a successful landing, meaning touchdown within the velocity, tilt and miss-distance limits of the mission requirements, shall be at least $99\%$ at $95\%$ confidence, demonstrated by Monte Carlo analysis anchored by subsystem test data." That version names a method, a number, and a criterion a reviewer can check the evidence against.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Requirement | A precise, testable statement with a number and unit, traceable to a source above it |
| Verification | Does the system meet its requirements — checked against the specification |
| Validation | Do the requirements meet the mission need — checked against reality |
| Verification matrix | One row per requirement: statement, method(s), success criterion, evidence artifact, status |
| Analysis | Computation/simulation; broad coverage, cheap per case, only as good as the model behind it |
| Test | Physical measurement under controlled conditions; grounds reality, expensive and limited in count |
| Inspection | Examination for a static/physical characteristic; cheap and unambiguous, silent on dynamic behavior |
| Demonstration | Operating the system to show a capability; proves an end-to-end path, not a numeric probability |

Everything from here forward is technique for filling in the analysis column of a verification matrix honestly: what goes into the model that gets swept, how large a campaign has to be to support a stated claim, when a fast linear method may stand in for a full Monte Carlo, and how the resulting numbers get checked before anyone signs the row closed. The next lesson starts at the beginning of that chain — building the dispersion set the analysis is actually run against.
