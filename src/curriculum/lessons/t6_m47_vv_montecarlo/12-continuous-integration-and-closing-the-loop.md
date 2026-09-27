---
id: l12-continuous-integration-and-closing-the-loop
title: Continuous integration and closing the loop
minutes: 22
covers:
  - 'Continuous integration for flight and simulation software: what runs on every commit, what runs nightly, what runs before a release'
  - Test-as-you-fly, and the risk taken every time you deviate from it
  - Anomaly investigation, flight data reconstruction, and closing the loop by updating the models
---

A smoke detector that you test once, on the day you install it, tells you it worked that day. It says nothing about next year, after the battery has run down. The detector is only useful because it is always on, checking all the time, without anyone having to remember.

Every technique in this module — the run-count formula, LinCov, the margin sweep, MC-DC coverage — is like that detector. Run once, by hand, before one review, it catches whatever is wrong at that moment and nothing that arrives afterward. It is only as valuable as how often it runs.

This last lesson covers three habits that turn verification from an event into something always on. **Continuous integration** runs the checks automatically on every change. **Test-as-you-fly** asks how honestly the testing matches the real flight. And after the vehicle actually flies, **closing the loop** finds out whether any of the predictions were right.

## Continuous integration: three tiers, three jobs

Think of a restaurant kitchen. The cook tastes every dish before it goes out — quick, every time. Every night someone counts the whole stock room — slow, but it catches the slow leak a single taste never would. And before the health inspector visits, everything is checked, cleaned and written up.

**Continuous integration**, or **CI**, is the same idea for code. A server watches the code store. Each time someone sends a change — a **[[push or commit|commit-push]]** — it builds the software and runs the checks by itself. A flight and simulation codebase runs its checks at three speeds, each sized to what it must catch and how fast.

**On every push**, before a change is merged in:

- build with every **[[compiler warning treated as an error|warnings-as-errors]]**;
- run the full unit and regression suite;
- run static analysis;
- run a small **fixed-seed** reduced Monte Carlo — a few hundred cases, not thousands — against the same success criteria and margin requirements a full campaign uses;
- gate on the flight code's **[[worst-case execution time|wcet]]**, so a change that makes it too slow fails.

The fixed seeds matter most here. A **[[seed|seed]]** is the starting number that decides which "random" dispersions a run draws. If every per-commit check drew fresh random cases, a borderline case would sometimes pass and sometimes fail by pure chance, with nothing in the code changed. A check whose failure cannot be reproduced cannot be trusted as a gate. With a fixed, recorded set of seeds, a regression is **deterministic**: it fails the same way every time until someone actually fixes it.

**Nightly**, the full campaign: all ten thousand dispersed cases, on whatever parallel computers the program has. The results are **trended** — plotted night after night — not only marked pass or fail. A slow creep in the 99th-percentile miss distance over two weeks of passing commits is a signal too small for any single per-commit gate to see. A [[trend line|drift-picture]] shows it plainly.

**Per release**, everything the two faster tiers run, plus the full code-coverage measurement and the assembled **verification report** — the document, built from every earlier lesson in this module, that a flight readiness review actually reads.

::: key
What CI runs for a GNC stack. Per push: build with warnings as errors, unit tests, static analysis, a reduced fixed-seed Monte Carlo, margin and WCET gates. Nightly: the full campaign with trended statistics. Per release: the whole thing plus coverage and the verification report.
:::

::: example Sizing the three tiers against a real time budget
One dispersed case costs $42\,\mathrm{s}$ of single-core computing. The build cluster has $64$ cores, and cases run side by side, one per core. So the wall-clock time for a batch is (cases × seconds per case) ÷ cores.

**Per commit**, with a $10$-minute budget and $200$ cases:

$$
\frac{200 \times 42}{64} = 131\,\mathrm{s} \approx 2.2\ \text{minutes}.
$$

That fits comfortably.

**Nightly**, with an eight-hour ($480$-minute) budget and the full $10{,}000$ cases:

$$
\frac{10{,}000 \times 42}{64} = 6{,}563\,\mathrm{s} \approx 109\ \text{minutes}.
$$

That fits with room to spare.

**Pre-release**, a $50{,}000$-case campaign in the same eight-hour window on the same cluster:

$$
\frac{50{,}000 \times 42}{64} = 32{,}813\,\mathrm{s} \approx 547\ \text{minutes}.
$$

That is $547 - 480 = 67$ minutes over budget. This arithmetic decides whether a program buys more cores, releases less often, or runs a smaller campaign — better done months ahead than the night before a review.

**Going the other way.** To squeeze the full $10{,}000$ cases into a one-hour ($3{,}600\,\mathrm{s}$) nightly window, you need $10{,}000 \times 42 / 3{,}600 \approx 117$ cores. That is a concrete number a program can put in a budget, instead of an open-ended request for "more compute".

**Sanity check.** Five times the cases took five times as long, $109$ minutes against $547$, as it should when cases are independent and the cores are fixed.
:::

::: example Injecting a known fault to prove the gate works
A dashboard tracks a rate loop's gain margin from the fixed-seed reduced campaign on every commit. Over the first fourteen commits of a design cycle it averages $8.49\,\mathrm{dB}$, with a standard deviation of $0.15\,\mathrm{dB}$ from commit to commit. The CI gate is $6.0\,\mathrm{dB}$.

At commit fifteen, the team **injects** a fault on purpose: a filter coefficient in a gain-tuning change entered with the wrong sign. The true margin drops to about $5.2\,\mathrm{dB}$. The simulated history below adds the small commit-to-commit scatter:

```python
import numpy as np
rng = np.random.default_rng(3131)
commits = np.arange(1, 21)
true_margin = np.where(commits < 15, 8.5, 5.2)     # the fault lands at commit 15
margin = true_margin + rng.normal(0, 0.15, len(commits))
threshold = 6.0
first_fail = commits[margin < threshold]
print(first_fail[0])   # 15
```

**Reading the result.** Commits $15$ through $20$ all come in between $5.0$ and $5.3\,\mathrm{dB}$, below the $6.0\,\mathrm{dB}$ gate. The gate catches the fault at exactly commit fifteen and on every commit after. And the build fails with a message naming the margin criterion that broke, not a vague "tests failed".

**Why bother?** A pipeline that has never been made to fail on a known, planted defect has never shown that it *can* fail. Planting a specific fault — a sign flip, a disabled check, a corrupted seed file — and confirming the pipeline goes red with the right message is itself verification, applied to the verification system.

**Sanity check.** The healthy commits sit about $2.5\,\mathrm{dB}$ above the gate, which is $2.49/0.15 \approx 17$ standard deviations. The scatter alone will never trip the gate by accident — so when it trips, something real changed.
:::

::: warning A gate that has never gone red proves nothing
Green builds feel reassuring. But a check with a typo in its threshold, a test that never actually runs, or a margin script reading last week's file will also stay green forever. Prove each gate by making it fail once on a planted fault, and keep that fault-injection test in the suite.
:::

### Why the speed matters

Why spend so much on computers? Not for the raw count of cases, but for the **[[iteration rate|iteration-rate]]** it buys. A campaign that finishes overnight supports a design decision every day. A campaign that takes a week means the team effectively stops testing design changes against it, because nobody can wait a week between tries. Much of this module — LinCov as the fast partner, a small fixed-seed set on every commit, the full campaign only at night — answers one question: how do you keep the verification loop fast enough that people keep using it?

## Test-as-you-fly

Think of a school play. You can rehearse the lines in a classroom, in jeans. But the night before opening, you do a **dress rehearsal**: real costumes, real stage, real lights, the whole show in order. That is where the actor finds the cape that catches on the door.

A test campaign verifies whatever it actually exercises, in the setup it actually uses — no more. **Test-as-you-fly** means testing in the same configuration, sequence and environment the vehicle will meet in flight. It is a named habit, not an automatic default, because real test programs depart from it all the time, usually for good practical reasons. And every departure is a piece of the flight that was never tested.

Here are the common departures.

- A **stubbed interface** is a software or hardware stand-in for a part that is not ready. The real part's timing, failure modes and odd behaviors were never exercised — only the stub's, which is whatever its builders assumed the real thing would do.
- A **scaled model** is used where full-size testing is impractical. Some effects do not scale in a simple way — bending and flutter, heating, some fluid flows. A result from the scaled model is evidence about the scaled model, stretched to fit the real one.
- A **skipped mode transition** means testing steady prelaunch and steady ascent, but never the instant of liftoff; or testing entry and landing separately, but never the handover between them. Transitions are exactly where defects love to live, because control authority, sensor validity and software state are all changing at once. A lander lost in 1999 is the classic [[story|mars-polar-lander]].
- **[[Ground support equipment|gse]] left connected** during a test meant to show autonomous flight means the vehicle never proved it can manage without that crutch — power, cooling, a wired command line — which will not exist once it flies.

Some departures cannot be avoided. True vacuum ignition, or true weightlessness for a long time, cannot be recreated on the ground at any sensible cost. Some hardware really is not ready in time. So the rule is not "never deviate". The rule is: every deviation is **listed and justified in writing**, entered in the same verification matrix the first lesson of this module built, with a plain statement of what risk it accepts and why that risk is acceptable. A deviation nobody wrote down is a gap in the evidence nobody can weigh. That is a very different thing from a deviation the program looked at, understood and accepted on the record.

::: key
Test-as-you-fly: test in the configuration, sequence and environment you will fly. Every deviation — a stubbed interface, a scaled model, a skipped mode transition, ground support equipment left connected — is a piece of untested flight, and it must be listed and justified.
:::

::: warning "It worked in test" answers a smaller question than it sounds
A test that passed with a stub, a scaled model, a skipped transition or ground equipment connected has verified the vehicle *in that setup*. That is a real result, worth having. It is not the claim "the vehicle, as it will fly, does this". Letting the first stand in for the second, when the setup differed in a way nobody listed, is how an untested condition reaches a flight readiness review labeled as tested.
:::

## Closing the loop after flight

A weather forecaster who never checks yesterday's forecast against what the sky actually did will never get better. She might be off by five degrees every day and never know.

Every model this module has built — the dispersion set, the LinCov linearization, the margin sweep — is a prediction. So far it has been checked only against itself, or against ground tests done before the vehicle flew. Flight is the one set of data no simulation produced. A program that never compares its predictions with what the vehicle actually did is checking its models only against the models' own assumptions, forever.

### Flight data reconstruction

**Flight data reconstruction** is the fix. After a flight, use the recorded **telemetry** — the measurements the vehicle sent down or stored — to estimate, as precisely as the instruments allow, two things:

1. **What the vehicle actually did**: its true trajectory, attitude history and touchdown state. This usually uses a [[post-flight estimate|smoother]] far more thorough than what ran onboard in real time, because afterwards there is no deadline and the whole flight's data is available at once.
2. **What the environment actually was**: the winds, the air density profile, the conditions the dispersion set only ever described as a spread of possibilities.

Then compare the reconstructed truth with the pre-flight prediction, case by case and parameter by parameter. That is what tells a program whether its models are actually *right*, not just consistent with each other. Every meaningful difference goes back into updating the models and the dispersion set that the next campaign runs on. A dispersion set never checked against a single flight is a set of assumptions that has only ever been asked to agree with itself.

::: key
Flight data reconstruction: after flight, estimate what the vehicle actually did and what the environment actually was, then feed the difference from prediction back into the models and the dispersions. A campaign that is never reconciled with flight data is a simulation of a simulation.
:::

### Anomalies, even on good days

This applies even to a flight that succeeds completely. Flight data might show a margin much thinner than predicted, or a touchdown near the edge of what the campaign called acceptable. That is worth investigating on its own, whether or not it caused a visible problem. Treating "nothing failed" as "nothing to learn" throws away exactly the near-miss information a program most needs, before a later flight turns the same gap into a real failure.

An **anomaly** is any flight behavior that did not match the prediction, whether or not it caused a failure. It deserves the same discipline the tail-risk lesson set out for a cluster of Monte Carlo failures:

1. **Reconstruct** exactly what happened.
2. **Trace** the mechanism through the actual flight data.
3. **Classify** it. Was it a real vehicle limitation the models knew about but got the size wrong? A genuine defect in the flight software or hardware? Or a limitation of the simulation model itself, which produced a confident but wrong prediction?

Each answer points to a different fix, which is why the classification matters. None of them is available to a program that treats a successful flight as needing no further look once it lands.

## Check yourself

::: check
Why does the per-commit reduced Monte Carlo in a CI pipeline use fixed random seeds instead of fresh random draws each time?
:::

::: answer
If pass or fail depends on which random dispersions happened to be drawn on that run, the check is not reproducible. A borderline case could pass on one run and fail on the next purely by chance, with no change to the code. Fixed seeds make the reduced campaign deterministic: the same commit gives the same result every time. A failure is then a repeatable fact about that commit that someone can replay and debug, not a matter of which random numbers came up.
:::

::: check
A nightly campaign passes every night for three weeks, but the 99th-percentile miss distance creeps from $28\,\mathrm{m}$ to $41\,\mathrm{m}$, never crossing the $50\,\mathrm{m}$ requirement. Why flag it when every night passed?
:::

::: answer
A gate only asks whether today's result crosses the line; it says nothing about the path leading there. A steady climb from $28\,\mathrm{m}$ toward a $50\,\mathrm{m}$ limit means something is wearing away the margin over time — perhaps a string of small design or code changes. The miss has grown by $13\,\mathrm{m}$ in three weeks, and only $9\,\mathrm{m}$ of room is left, so at the same rate the requirement would be crossed in about two more weeks ($9/13 \times 3 \approx 2.1$). Catching it now, while there is room, is much cheaper than waiting for the night it fails. That is why nightly results are trended, not only marked pass or fail.
:::

::: check
The CI cluster above takes $109$ minutes for the nightly $10{,}000$-case campaign on $64$ cores. The team switches to a new simulation version that takes $63\,\mathrm{s}$ per case. Does the nightly campaign still fit in eight hours, and how many cores would bring it back to $109$ minutes?
:::

::: answer
New wall-clock time: $10{,}000 \times 63 / 64 = 9{,}844\,\mathrm{s}$, about $164$ minutes. That still fits in $480$ minutes. To get back to $109$ minutes ($6{,}563\,\mathrm{s}$), the cores must grow in the same ratio as the cost per case: $64 \times 63/42 = 96$ cores. Sanity check: each case is $1.5$ times slower, so $1.5$ times the cores restores the old time.
:::

::: check
A test program stubs the parachute deployment interface because the flight hardware is not ready, and then completes an otherwise full end-to-end descent test. What has the test verified, and what has it not?
:::

::: answer
It has verified the vehicle's behavior up to and around the deployment interface, with the stub's behavior standing in for the real hardware — a real, useful result for everything else in the sequence. It has not verified the actual deployment mechanism: its timing, its failure modes, or how it interacts with the rest of the vehicle at the moment of deployment, because the stub exercised none of that. That remains a piece of untested flight. It must be listed as a deviation and closed some other way before the requirement it bears on counts as verified.
:::

::: check
A flight succeeds completely — every requirement met, no anomalies flagged onboard. A reviewer asks whether flight data reconstruction is still worth doing. What is the right answer?
:::

::: answer
Yes. Reconstruction is how a program learns whether its models were right, not just whether the vehicle succeeded. A clean flight can still show that a margin was thinner than predicted, or that a wind or density profile differed from what the dispersion set assumed. That only shows up when the reconstructed truth is compared with the pre-flight prediction. Skip it, and the models behind the verification claim are never checked against reality; the next campaign runs on assumptions tested only against themselves.
:::

::: check
Reconstruction finds two anomalies. One traces to a real aerodynamic effect nobody had modeled. The other traces to a bug in the reconstruction software, which misestimated a state. Why does classifying each one correctly, rather than just noting "a discrepancy", matter for what happens next?
:::

::: answer
They need completely different fixes. The aerodynamic effect is real, missing physics: it belongs in the vehicle model and the dispersion set for every future campaign. The reconstruction bug belongs in the reconstruction software, and casts no doubt on how the vehicle actually flew. Lumping both together as "a discrepancy" risks the wrong move in both directions — changing the vehicle model to chase something that never physically happened, or dismissing a real new failure mode because it looked like a known software quirk.
:::

## Summary

| Item | Statement |
| --- | --- |
| Per-push CI | Build with warnings as errors, unit and regression tests, static analysis, fixed-seed reduced Monte Carlo, margin and WCET gates |
| Nightly CI | The full dispersed campaign, results trended over time to catch slow drift, not only threshold crossings |
| Per-release CI | Everything above, plus full coverage measurement and the assembled verification report |
| Why fixed seeds | They make a per-commit gate deterministic and reproducible, not a matter of which random draw came up |
| Wall-clock sizing | Time = cases × seconds per case ÷ cores |
| Fault injection | Plant a known defect to prove each gate can go red, with a message naming the failed criterion |
| Test-as-you-fly | Test in the configuration, sequence and environment of flight; every deviation (stub, scaled model, skipped transition, connected GSE) must be listed and justified |
| Flight data reconstruction | Estimate what the vehicle and the environment actually did after flight, and compare with the pre-flight prediction |
| Closing the loop | Every meaningful difference — even from a fully successful flight — goes back into the models and the dispersion set |
| Anomaly classification | Real vehicle limitation, genuine defect, or simulation artifact — each points to a different fix |

That closes the module's arc: a dispersion set built and justified, a run count sized honestly, a fast linear method cross-checked against a full campaign, the tail read from the sample rather than a sigma multiple, the drivers and corners found, margins verified across the envelope and inside the code, all of it run automatically on every change — and, once the vehicle flies, checked against the one dataset none of it saw in advance. The [[capstone module|capstone-bridge]] puts all of this to work on a complete ascent-to-landing GNC stack: ten thousand dispersed cases in CI, and a written V&V report someone who has never seen the project could audit.

::: context commit-push Saving a snapshot and sending it
Programmers keep code in a **version control** system, most often Git. A **commit** is a saved snapshot of the code with a note about what changed. A **push** sends your commits to the shared copy that the whole team, and the CI server, can see. Because each commit is a separate snapshot, CI can say exactly which change broke something — "it went red at commit fifteen" — and anyone can go back to any earlier version.
:::

::: context warnings-as-errors Making the compiler's hints mandatory
A **compiler** turns source code into a program. Along the way it prints **warnings**: things that are legal but look suspicious, like a variable that is never used or a number squeezed into a smaller type. Left alone, warnings pile up by the hundred and nobody reads them. Treating warnings as errors (the `-Werror` flag in GCC and Clang) stops the build on the first one, so each is fixed or consciously switched off while it is still one line.
:::

::: context wcet How long can it possibly take?
The flight computer runs the control law on a fixed clock — say every $10\,\mathrm{ms}$. If one pass through the code ever takes longer, the next command is late, which eats delay margin. **Worst-case execution time** is the longest one pass could take, over every path and input. It is found by timing measurements plus analysis of the code's longest paths. A CI gate on it fails any change that makes the code measurably slower.
:::

::: context seed Where "random" numbers come from
Computers make "random" numbers with a formula that turns one number into the next, over and over. The starting number is the **seed**. Same seed, same sequence — every time, on any machine. So a Monte Carlo case recorded with its seed can be replayed exactly, bit for bit, which is how a failed case gets investigated. Change the seed and you get a fresh, equally random-looking sequence.
:::

::: context drift-picture What a slow drift looks like
Twenty-one nights of a 99th-percentile miss distance, rising steadily from $28\,\mathrm{m}$ to $41\,\mathrm{m}$. Every night is under the $50\,\mathrm{m}$ line, so every nightly gate passed. The slope is the warning.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="20" x2="50" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="35.7" x2="340" y2="35.7" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="336" y="30" font-size="11" fill="#b4232c" text-anchor="end">requirement 50 m</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50,104.9 90,99 130,93.2 170,87.3 210,81.5 250,75.7 290,69.8 330,64"/>
  <g fill="#1d6fd1">
    <circle cx="50" cy="104.9" r="3.5"/><circle cx="90" cy="99" r="3.5"/><circle cx="130" cy="93.2" r="3.5"/><circle cx="170" cy="87.3" r="3.5"/>
    <circle cx="210" cy="81.5" r="3.5"/><circle cx="250" cy="75.7" r="3.5"/><circle cx="290" cy="69.8" r="3.5"/><circle cx="330" cy="64" r="3.5"/>
  </g>
  <text x="44" y="102.6" font-size="11" fill="#1f2a44" text-anchor="end">30</text>
  <text x="44" y="71.1" font-size="11" fill="#1f2a44" text-anchor="end">40</text>
  <text x="44" y="39.7" font-size="11" fill="#1f2a44" text-anchor="end">50</text>
  <text x="56" y="116" font-size="11" fill="#1d6fd1">28 m</text>
  <text x="330" y="84" font-size="11" fill="#1d6fd1" text-anchor="end">41 m</text>
  <text x="195" y="150" font-size="11" fill="#1f2a44" text-anchor="middle">night 0 to night 21 (every third night shown)</text>
</svg>
```
:::

::: context iteration-rate Why cases are cheap to run side by side
Each Monte Carlo case is its own independent run, so a thousand cases can run on a thousand cores at the same time with no need to talk to each other. People call this **embarrassingly parallel**: doubling the cores halves the wall-clock time. That is why the arithmetic in the sizing example is a simple division, and why fast-moving programs invest heavily in simulation computers — the payoff is more design decisions per week.
:::

::: context mars-polar-lander The lander that shut off its engine too early
NASA's Mars Polar Lander was lost in December 1999. The review board found the most likely cause: when the landing legs swung out, sensors on them gave a brief false "touchdown" signal. The software remembered it and shut off the descent engine once the lander got close to the ground, still about $40\,\mathrm{m}$ up. A test of the touchdown sensors had been run with them wired wrongly; after the wiring was fixed, that test was not repeated. A skipped retest, at a mode transition, was the gap.
:::

::: context gse The equipment that stays on the ground
**Ground support equipment**, or GSE, is everything that serves the vehicle on the pad or in the test stand: power cables, cooling lines, fueling hoses, data links. Many connect through an **umbilical** that pulls away at liftoff. A test run with GSE attached can quietly lean on it — ground power smoothing a voltage dip, a wired link delivering a command the radio would have dropped.
:::

::: context smoother Hindsight makes a better estimate
Onboard, a navigation filter must estimate the state *now*, using only past data. After the flight, a **smoother** can use the whole record, before and after each moment, so its estimate of every instant is at least as good as the filter's — and usually much better. The two agree only at the very last moment, where there is no "after".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M40,35 C120,55 220,62 320,63 L320,87 C220,88 120,95 40,115 Z" fill="#8fb8f0" opacity="0.7"/>
  <path d="M40,64 C120,65 220,64 320,63 L320,87 C220,86 120,85 40,86 Z" fill="#1d6fd1" opacity="0.8"/>
  <line x1="40" y1="75" x2="320" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="320" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="145" font-size="11" fill="#1f2a44" text-anchor="middle">flight time →</text>
  <text x="44" y="28" font-size="11" fill="#6c7a93">onboard filter: wide early on</text>
  <text x="200" y="112" font-size="11" fill="#1d6fd1">post-flight smoother: narrow throughout</text>
  <text x="324" y="79" font-size="11" fill="#1f2a44">end</text>
</svg>
```

The shaded bands are the uncertainty in the estimate. The reconstructed trajectory is often called the best estimated trajectory.
:::

::: context capstone-bridge Where this all comes together
In the capstone module you will build a full reusable-booster GNC stack — navigation, guidance, control, mode management and fault handling — and run ten thousand dispersed cases in CI with per-case seeds and bit-exact replay. The deliverable is a written V&V report: requirements, evidence, margin plots, failure analysis and known limits, clear enough for an engineer who has never seen the project to audit.
:::
