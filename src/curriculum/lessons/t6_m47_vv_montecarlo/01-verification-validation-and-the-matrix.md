---
id: l01-verification-validation-and-the-matrix
title: Verification, validation, and the verification matrix
minutes: 21
covers:
  - Requirements, verification and validation; the verification matrix that maps every requirement to its evidence
  - Verification by analysis, test, inspection and demonstration, and choosing correctly between them
---

Imagine you bake a birthday cake from a recipe. You measure every cup of flour. You set the oven to exactly $180\,^\circ\mathrm{C}$. You bake it for exactly $35$ minutes. You followed the recipe perfectly. Then the birthday girl takes one look and says she wanted chocolate, and this is lemon. You made the cake right. You did not make the right cake.

Those are two different questions, and engineers keep them apart on purpose. This whole module is about the first one — proving, with evidence, that a vehicle does what its written rules say — and this lesson gives you the words for it and the one table that holds all the answers.

Every earlier module in this course produced numbers: a filter's covariance, a controller's phase margin, a landing scatter from a simulation. None of those numbers counts for much at a **[[flight readiness review|readiness-review]]** — the meeting where senior engineers decide whether a vehicle may fly — unless it is tied to something. The board does not ask whether your Kalman filter is elegant. It asks: which numbered requirement does this close, what evidence closes it, and why is that evidence enough? Every later lesson in this module is a way of answering that question honestly.

## Requirements, verification, and validation

A **requirement** is a precise, testable statement of what the system must do. A good one has a number and a unit. It is also traceable: you can point to the higher-level need, agreement or requirement it came from.

"The vehicle shall be safe" is not a requirement. Nobody can test it. Compare it with this one: "the probability of the vehicle leaving the designated **[[hazard corridor|hazard-corridor]]** during ascent shall not exceed $10^{-4}$." Read $10^{-4}$ as "ten to the minus four" — one chance in ten thousand. That sentence names a condition, a threshold, and, without saying so, the kind of method that could produce such a number. Notice the word **[[shall|shall-word]]**: in requirements it always means "must".

Now the two big words.

**Verification** asks: does the system, as built, meet its requirements, as written? It is a comparison against a document. Take the requirement's threshold, take evidence about the real system, and show the evidence clears the threshold.

**Validation** asks a different question: if the requirements are all met, does the vehicle actually do the job the mission needs? It is a comparison against reality, not against a document.

Why keep them apart? Because you can verify perfectly against a requirement that is itself wrong. Suppose a requirement says the vehicle must land within $50\,\mathrm{m}$ of the target with $99\%$ confidence, and the vehicle provably does. Verification succeeds. But if the landing pad is only $30\,\mathrm{m}$ across, the mission still fails. The vehicle did exactly what it was asked. What it was asked was not enough. That is a **validation failure**.

The reverse happens too. A requirement can demand more precision than the mission needs, so verifying it is expensive or impossible. Then the fix is to change the requirement, not the vehicle.

So validation is a question about the requirements. Verification is a question about evidence, against requirements everyone has already agreed are right. This module is almost entirely about verification, because validation belongs to mission design and systems engineering, and it happens earlier. But a GNC engineer who cannot state the difference on demand will one day defend a verified-but-wrong requirement as though that settled the argument.

::: key
**Verification**: did we build the thing right — does the system meet its requirements? **Validation**: did we build the right thing — do the requirements, once met, satisfy the actual mission need? Verification is checked against a specification; validation is checked against reality.
:::

## The verification matrix

Think of a school project with a grading rubric. A careful student makes a checklist: one line per rubric item, how she will show she did it, and a note of where the proof is — "bibliography: page 9". On due day she does not rely on memory. She reads down the list.

A real program has hundreds of requirements, so it does the same thing. The working document is one big table, the **verification matrix**, with one row per requirement. A usable row holds at least five things:

- the **requirement statement**, with its number, unit, and any statistical qualifier — a threshold alone, or a threshold at a stated confidence;
- the verification **method** or methods that apply;
- the **success criterion** — the exact numeric or yes/no condition the evidence must meet to close the row, stated so precisely that two engineers reading it would agree on whether a given result passes;
- the **evidence artifact** — the actual analysis report, test report, inspection record or demonstration log that holds the result. Not a promise that one will exist. A reference to the one that does;
- a **status** — open, in progress, or closed — with the date and the name of whoever signed it off.

The matrix is the document a review board actually reads. Nobody at a flight readiness review re-runs your Monte Carlo or your static analysis. They read each row. They check that the evidence exists and says what the row claims. They check that the success criterion really is what the requirement demands. Every technique in the rest of this module — sizing a Monte Carlo campaign, propagating a covariance, sweeping a stability margin, measuring code coverage — exists to fill one cell of one row, carefully enough that the cell survives that reading.

Two habits keep the matrix honest.

**[[Traceability|traceability]]** runs both ways. Every requirement must map to at least one row with a method attached. And every big analysis or test should map back to the requirement it was run to close. Then neither an untested requirement nor an orphaned analysis — work that answers no requirement — can reach the review unnoticed.

**A precise success criterion** keeps the matrix from turning into a wish list. "Verify the landing accuracy is acceptable" closes nothing. Compare: "the 99th percentile of radial miss distance over a 10,000-case dispersed Monte Carlo campaign shall not exceed $50\,\mathrm{m}$." That row closes exactly when a specific number, computed a specific way, clears a specific line.

## The four methods

Suppose you have bought a used bike and want to know it is safe. You could look it over: are all the bolts there, is the seat at the right height? You could put it on a stand and measure how quickly the brakes stop the wheel. You could work out on paper whether the frame can hold your weight. Or you could ride it around the block. Those four are, almost exactly, the four ways engineers verify a requirement.

**Analysis** is computation: modeling, simulation, or calculation, applied to the system or a model of it. Its strength is reach. A **dispersion campaign** — thousands of simulated flights, each with the uncertain inputs nudged a little differently — can sweep hundreds of uncertain parameters and produce a probability statement that no amount of physical testing could produce directly, at a cost of computer-seconds instead of hardware. Its weakness: it is only as good as its model. An analysis result is a statement about the model. It becomes a statement about the vehicle only once the model has been **anchored** — checked against real data.

**Test** is a physical measurement of the real hardware or software under controlled conditions, ideally close to flight conditions. Its strength is that it removes the model from the question for whatever it measures. An actuator either delivers the commanded torque on the bench or it does not. Its weakness is cost, time and reach. Tests run at the pace and price of hardware, so you always get far fewer trials than a high-confidence probability claim needs. And some conditions — true vacuum, true weightlessness, the exact heating history of one flight — are hard or impossible to recreate on the ground.

**Inspection** is examining the item, or a document about it, for one fixed physical feature: a dimension, a mass, whether a part is present, a **[[certificate of conformance|conformance]]**, a line in a source file. It is cheap and its answer is nearly always clear. Its weakness is scope. Inspection can confirm a bolt is tightened to spec or that the vehicle fits inside the **[[fairing|fairing]]**. It says nothing about how the vehicle behaves in motion. It cannot verify a control margin or a reliability claim.

**Demonstration** is operating the system, or a representative version, through a scenario to show a capability exists. It is usually judged by eye rather than against a number. Its strength is that it runs a whole path from end to end — including human operators and written procedures — that no model fully captures and no single bench test reaches. Its weakness is statistical. One success, or even several, does not put a bound on a probability. And a demonstration that succeeds does not tell you how close it came to failing.

Choosing among them starts from the shape of the requirement:

- a number that must hold across a spread of conditions belongs to **analysis**, anchored by enough test data to trust the model doing the sweeping;
- a fixed physical feature belongs to **inspection**;
- a hardware capability under a controlled, repeatable load belongs to **test**;
- an end-to-end operational capability, especially one that crosses a human or a procedure, belongs to **demonstration**.

Many requirements need [[more than one method|two-methods]] at once. A landing-accuracy requirement is closed by analysis for the probability claim, anchored by tests of the particular sensors and actuators the analysis models. The rest of this module builds out that pattern in full.

::: example A verification matrix for six representative requirements
| # | Requirement | Method(s) | Why |
| --- | --- | --- | --- |
| 1 | Landing miss distance $\leq 50\,\mathrm{m}$, $99\%$ confidence | Analysis, anchored by test | Probabilistic, dynamic, dispersed — only analysis can sweep it; sensor and actuator test data validates the model doing the sweeping |
| 2 | TVC gimbal slew rate $\geq 12^\circ/\mathrm{s}$ | Test | A hardware capability under controlled load; the bench measures it directly |
| 3 | Guidance software shall contain no unhandled floating-point exception in the powered-descent branch | Analysis (static) + Test (unit/regression) | A code property no physical test alone reaches; static analysis and a test suite together close it |
| 4 | Vehicle shall fit the $4.6\,\mathrm{m}$ fairing envelope with $25\,\mathrm{mm}$ clearance | Inspection | Static, physical, dimensional — a survey against the CAD model settles it completely |
| 5 | Flight termination shall be commandable and confirmable from the ground console within $2\,\mathrm{s}$ | Demonstration + Test | An end-to-end operational path through hardware, software and a human operator, with the radio-link timing measured directly |
| 6 | Attitude loop shall hold $6\,\mathrm{dB}$ gain margin and $30^\circ$ phase margin at every point of the nominal and dispersed trajectory | Analysis | A continuous claim across flight time and dispersion; no finite set of tests could cover it, only a swept linear analysis, as a later lesson in this module works out |

Read the table row by row and look for the pattern.

Rows 2 and 4 each have one method. Their nature leaves no doubt which one applies: a slew rate is measured on a bench, and a fit is checked with a tape measure or a survey.

Rows 1, 3 and 5 need two methods, because one method's weakness is exactly what the other supplies. In row 1, test grounds the model that analysis then sweeps. In row 5, a demonstration proves the whole **[[flight termination|flight-termination]]** path works with a person at the console, while a bench test proves the timing number inside it.

Row 6 is analysis alone, because the claim is continuous: "at every point" is infinitely many points, and only a computation can visit them all.
:::

::: example Why a test campaign alone cannot close a high-confidence reliability requirement
A requirement reads: the vehicle shall demonstrate $99.9\%$ reliability at $95\%$ confidence, based on a run history with no failures.

A later lesson derives the exact rule. For now, take its headline: a clean record needs about $3000$ trials to support that claim (the precise figure is $2995$).

Now count what a program can afford. A full-up integrated test — a hot-fire, a drop test, a flight — is expensive and slow. Even an aggressive program rarely racks up more than a few dozen across its whole life. That is [[about a hundred times short|tests-versus-needed]] of $3000$.

So verifying this requirement by test alone is not merely expensive. No real schedule or budget can do it. Instead the requirement is closed by analysis: a simulation that runs thousands of dispersed cases in the time one physical test takes to set up, checked against the handful of physical tests the program can afford.

Sanity check on the logic: the tests do not show the reliability number directly. They show that the simulation computing it can be trusted. That is the general shape of almost every high-confidence probability requirement on a vehicle — and it is why analysis, not test, carries almost all the weight in the rest of this module.
:::

::: warning A successful demonstration is not a probabilistic verification
One successful flight, or a few, is a demonstration. It shows the capability exists and the procedure works. It is not evidence for a numeric reliability or dispersion requirement. It says nothing about how close the result came to the edge, or how it would have gone with different noise.

Treating "it worked this time" as proof of "it works with probability $0.999$" is one of the most common and most dangerous mix-ups at a flight readiness review. The fix is always the same: name the method the requirement actually needs, and do not let a handy success stand in for it.
:::

## Check yourself

::: check
State the difference between verification and validation, and give an example of a requirement that could be fully verified while the resulting vehicle still fails validation.
:::

::: answer
Verification checks the system against its stated requirements. Validation checks the requirements, once met, against the actual mission need.

An example: a requirement says the communications link shall have at most $1\,\mathrm{s}$ of delay (latency), and the vehicle provably meets it. Verification succeeds. But suppose the mission really needs a person on the ground to make an abort decision within $500\,\mathrm{ms}$ of a fault. A vehicle meeting the $1\,\mathrm{s}$ requirement still cannot support that decision in time, so the mission fails despite perfect verification. The requirement, not the vehicle, was the error — which is exactly what validation exists to catch.
:::

::: check
A requirement states a hardware capability: a valve shall open within $80\,\mathrm{ms}$ of a command under worst-case supply voltage. Which verification method applies most directly, and why would analysis alone be a weak choice here?
:::

::: answer
Test applies most directly. The valve's response time at a controlled worst-case supply voltage is a physical measurement on the bench. Once the test is set up, there is no modeling doubt about what "worst-case supply voltage" or "$80\,\mathrm{ms}$" mean.

Analysis alone would need a validated model of the valve's electrical and mechanical response across supply voltage. Building and validating that model to the accuracy the requirement demands is more work than measuring the response time directly. Analysis is the right tool when a requirement must be checked across a huge spread of conditions or many trajectory points that a test campaign could never afford to sample. This requirement is neither.
:::

::: check
Why does a strong verification matrix often list more than one method against a single requirement, rather than picking the one best method?
:::

::: answer
Because each method's weakness is often exactly what another method supplies. Analysis can sweep a full dispersion cheaply, but it is only as good as its model. Test grounds specific quantities in physical reality, but it cannot afford enough trials to cover a dispersion or reach a high-confidence probability claim alone.

Pairing them — analysis for the coverage, test to validate the model the analysis depends on — closes the requirement more defensibly than either one alone. That is why the landing-accuracy and flight-termination rows in the worked example each carry two methods.
:::

::: check
A program manager proposes closing the $99.9\%$-reliability requirement from this lesson's second example by running $40$ more integrated flight tests instead of building a validated simulation. Judge the proposal with numbers.
:::

::: answer
Forty clean trials, by the zero-failure rule this lesson previewed and a later lesson derives, support only about $92.8\%$ reliability at $95\%$ confidence — nowhere near $99.9\%$. The claim needs roughly $3000$ clean trials; $40$ is about seventy-five times too few.

So even a perfect $40$ out of $40$ leaves the requirement open, and no realistic budget or schedule stretches an integrated test campaign from $40$ to $3000$. The proposal does not close the requirement. It produces $40$ more data points that are valuable for validating a simulation — but the simulation, not the test count, has to carry the statistical weight.
:::

::: check
A requirement reads: "the vehicle shall be reliable." Explain why this cannot go into a verification matrix as written, and rewrite it as something that could.
:::

::: answer
"Reliable" names no threshold, no confidence level, and no method that could produce a pass or fail. Two engineers could argue forever about whether any given evidence satisfies it — which is exactly what a usable success criterion must prevent.

A workable rewrite states the quantity, the threshold and the statistical basis: "the probability of a successful landing — touchdown within the velocity, tilt and miss-distance limits of the mission requirements — shall be at least $99\%$ at $95\%$ confidence, shown by Monte Carlo analysis anchored by subsystem test data." That version names a method, a number, and a criterion a reviewer can check the evidence against.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Requirement | A precise, testable statement with a number and unit, traceable to a source above it |
| Verification | Does the system meet its requirements — checked against the specification |
| Validation | Do the requirements meet the mission need — checked against reality |
| Verification matrix | One row per requirement: statement, method(s), success criterion, evidence artifact, status |
| Analysis | Computation or simulation; broad coverage, cheap per case, only as good as the model behind it |
| Test | Physical measurement under controlled conditions; grounds reality, expensive and limited in count |
| Inspection | Examination for a fixed physical feature; cheap and clear, silent on dynamic behavior |
| Demonstration | Operating the system to show a capability; proves an end-to-end path, not a numeric probability |

From here on, the module is about filling the analysis column of the matrix honestly: what goes into the model that gets swept, how big a campaign must be to support a stated claim, when a fast linear method may stand in for a full Monte Carlo, and how the numbers get checked before anyone signs a row closed. The next lesson starts at the beginning of that chain — building the dispersion set the analysis is run against.

::: context readiness-review The meeting before launch
A **flight readiness review** is a formal meeting held shortly before a launch. Engineering leads, safety officers and managers go through open issues and the evidence that each requirement is met, and at the end they poll the room: go or no-go. NASA, the Air Force and commercial launch companies all hold versions of it. The verification matrix is the backbone of that meeting — if a row is still open, somebody has to explain why flying anyway is acceptable, and that explanation goes on the record.
:::

::: context hazard-corridor Where a rocket is allowed to fly
Before a launch, the range (the organization that owns the launch site and airspace) draws a **hazard corridor**: the region of land, sea and sky that is cleared of people and ships because debris could fall there. If the rocket strays outside it, it could endanger the public, so range safety sets a hard limit on how likely that is. Requirements like "not more than $10^{-4}$" come from those public-safety rules, and they are among the strictest numbers on any vehicle.
:::

::: context shall-word Why requirements say "shall"
Requirement writers use a small, fixed vocabulary so that nobody argues about meaning. "Shall" marks a binding requirement that must be verified. "Will" usually states a fact or an intention, "should" states a goal, and "may" gives permission. NASA's systems engineering handbook uses this convention, and so do most aerospace programs. A useful habit: every "shall" in a specification should have its own row in the verification matrix. If a sentence says "shall" twice, it is really two requirements.
:::

::: context traceability A family tree for requirements
Traceability means every requirement knows its parent and its children. A mission need breaks into system requirements, those break into subsystem requirements, and each lowest-level requirement points to the evidence that closes it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="8" width="120" height="28" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="27" font-size="12" text-anchor="middle" fill="#1f2a44">Mission need</text>
  <rect x="40" y="60" width="120" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="79" font-size="12" text-anchor="middle" fill="#1f2a44">Landing accuracy</text>
  <rect x="200" y="60" width="120" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="260" y="79" font-size="12" text-anchor="middle" fill="#1f2a44">Control margins</text>
  <line x1="180" y1="36" x2="100" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="36" x2="260" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="112" width="100" height="26" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="129" font-size="11" text-anchor="middle" fill="#1f2a44">MC report</text>
  <rect x="120" y="112" width="100" height="26" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="170" y="129" font-size="11" text-anchor="middle" fill="#1f2a44">Sensor tests</text>
  <rect x="230" y="112" width="120" height="26" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="129" font-size="11" text-anchor="middle" fill="#1f2a44">Margin analysis</text>
  <line x1="100" y1="88" x2="60" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="88" x2="170" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="260" y1="88" x2="290" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#6c7a93">orange boxes: evidence artifacts</text>
</svg>
```

Walk down to find what proves a need; walk up to find why a test exists.
:::

::: context conformance A signed promise from the maker
A **certificate of conformance** is a document from a manufacturer or supplier stating that a delivered part was made and checked to the specified drawing, material and process. Inspecting that paperwork — plus the part's markings and dimensions — is a legitimate way to close a requirement like "the bolts shall be made of this alloy". It is cheap, but it relies on the supplier's honesty and process; programs that have been burned by falsified certificates now back them up with their own sample testing.
:::

::: context fairing The nose cone that carries the cargo
The **fairing** is the streamlined shell at the top of a rocket that protects the payload from air and heat during the climb through the atmosphere. Once the rocket is high enough that the air is thin, the fairing splits in two and falls away. Everything inside must fit a stated envelope with some clearance, because the payload shakes during flight and must never touch the shell. A $4.6\,\mathrm{m}$ fairing is a typical size for a medium launcher.
:::

::: context two-methods A lesson from the Hubble mirror
The Hubble Space Telescope's main mirror was ground very precisely — to the wrong shape. The instrument used to test it during polishing had one lens spaced about $1.3\,\mathrm{mm}$ out of place, so the mirror matched a faulty reference perfectly. Simpler checks with other instruments had hinted at the error, but the result from the main tester was trusted over them. The mirror flew in 1990, and its blurry images needed a repair mission in 1993. The lesson for a verification matrix: evidence from two independent methods is worth far more than one method you trust completely.
:::

::: context flight-termination The system that stops a rocket gone wrong
A **flight termination system** lets range safety end a flight that is heading somewhere dangerous — usually by cutting the engines or breaking up the vehicle over an empty area. Because it protects the public, it is verified harder than almost anything else on board. Many modern rockets now carry an autonomous version that makes the decision on board, using the vehicle's own navigation, without waiting for a person on the ground.
:::

::: context tests-versus-needed How far short a test campaign falls
Here are the numbers from the reliability example side by side, drawn to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="12" fill="#1f2a44">Needed</text>
  <rect x="80" y="16" width="260" height="22" fill="#b4232c"/>
  <text x="210" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">2995 clean trials for 99.9% at 95%</text>
  <text x="10" y="90" font-size="12" fill="#1f2a44">Tests</text>
  <rect x="80" y="76" width="3.5" height="22" fill="#1d6fd1"/>
  <text x="92" y="92" font-size="11" fill="#1f2a44">40 integrated tests</text>
  <line x1="80" y1="10" x2="80" y2="104" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="122" font-size="11" text-anchor="middle" fill="#6c7a93">bar lengths to the same scale</text>
</svg>
```

The blue sliver is not a drawing error. That gap is the whole reason analysis carries the statistical weight.
:::
