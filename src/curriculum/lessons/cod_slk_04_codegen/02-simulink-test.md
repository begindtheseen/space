---
id: l02-simulink-test
title: 'Simulink Test: harnesses, test sequences and tests that run themselves'
minutes: 19
covers:
  - 'Simulink Test: harnesses, test sequences, assessments, baseline and equivalence tests, headless CI runs'
---

Imagine you have fixed the brakes on a bicycle. You could ride it down the steepest hill in town and see what happens. A better idea is to flip the bike onto a stand in the garage, spin the back wheel with a roller, pull the brake lever and watch a speedometer. The stand holds the bike still, the roller gives the same push every time, and the speedometer tells you whether the wheel stopped within two seconds. You can repeat the test tomorrow, after every adjustment, and compare.

The previous lesson set out four stages of testing, from MIL to HIL. At every one of them you run the same kind of test again and again: feed the controller known inputs, check its outputs against a rule, and compare runs. Doing that by hand, clicking Run and squinting at a Scope, stops working after about the third change to the model.

**Simulink Test** is the MathWorks product that turns those tests into objects you can save, rerun and automate. It gives you the stand (a **test harness**), the roller that pushes on schedule (a **Test Sequence** block), the speedometer with a pass-or-fail rule (an **assessment**), a place to organize and run everything (the **Test Manager**), and a way to run it all with no one at the keyboard. On a flight software team, those tests run every time anyone changes the model.

## The test harness: a stand for one component

A **test harness** is a separate small model, built around one component of your design, that supplies the component's inputs and collects its outputs. The component being tested is the **[[component under test|component-under-test]]**, often shortened to CUT. It can be a whole model, a subsystem, a Model block or a Stateflow chart.

Why a separate model? Because the design model should contain the design and nothing else. Test signals, scopes, extra plant models and pass-or-fail checks would clutter it, and some of them must never end up in flight code. A harness keeps all of that beside the design, not inside it.

The harness is attached to the component. When you create one, Simulink Test copies the component into a new model and surrounds it with blocks you choose: **sources** that drive its inputs (Inport blocks, a Signal Editor, a Constant, or a Test Sequence block) and **sinks** that receive its outputs. The harness stays linked to the original, so when someone edits the controller in the main model, the harness tests the edited version. A model can own many harnesses, one per kind of test, and they are saved either inside the model file or as separate files next to it.

You can make one from the MATLAB command line too. For a controller subsystem at the path `pitch_ctrl/Controller`:

```matlab
sltest.harness.create('pitch_ctrl/Controller', 'Name', 'step_harness');
sltest.harness.open('pitch_ctrl/Controller', 'step_harness');
```

::: key
A test harness is a separate model, attached to one component (the component under test), that supplies its inputs and checks its outputs. It keeps test-only blocks out of the design model, and it stays linked to the component, so it always tests the current version.
:::

## Test Sequence: inputs on a schedule

Many tests are a story in steps. Hold the vehicle still for 1 second. Then command a 5° pitch step. Wait. Check that the pitch settled. A **Test Sequence** block writes that story as a table of **steps**. Each step has:

- an **action**: what the block does while the step is active, such as setting an output signal (`cmd = 5;`);
- one or more **transitions**: conditions that move to another step, such as `after(1, sec)`, read "after one second in this step", or a condition on a signal, like `theta > 4`;
- a **next step**: where each transition goes.

The block is built on the same machinery as the Stateflow charts from the previous module, so the temporal operators you met there work here too: `after`, `before`, `duration`, and `et`, the elapsed time in the current step. Each step behaves like a state, and exactly one step is active at a time.

What makes a Test Sequence more than a signal generator is that it can **react**. A step can wait until the pitch passes 4° before it injects a sensor fault, so the fault always arrives at the same point in the maneuver, even if a tuning change makes the vehicle respond faster or slower.

## Assessments: turning a look into a verdict

A test that only draws a plot is not a test. Someone still has to look at it and decide, and people get tired. An **assessment** is a rule the test checks automatically, with a verdict of pass or fail.

The simplest assessment is a **verify statement** inside a Test Sequence step or a **[[Test Assessment|test-assessment]]** block:

```matlab
verify(abs(theta - 5) < 0.1)
```

Read it as "check that the pitch is within 0.1 degree of 5". It is evaluated at every time step while its step is active. Each time it holds, it records a pass; the first time it fails, the whole verify is marked failed at that moment. Crucially, [[the simulation keeps running|verify-vs-assert]], so one run can report every broken rule, not only the first. A `verify` that never ran, because its step was never reached, is reported as *untested*, which is its own warning sign.

The Test Manager also offers **logical and temporal assessments**: rules written in an English-like form, such as "whenever the abort command is true, the engine valve must be closed within 50 ms". They are checked on the logged results after the run, without adding any block to the harness.

::: example A pitch-step test, written as a sequence
A pitch loop is designed to behave like a second-order system with natural frequency 2 rad/s and [[damping ratio|damping]] 0.7. The requirement says: after a 5° step command, pitch must never exceed 5.5°, and from 3.5 s after the command onward it must stay within 0.1° of 5°. Write the sequence and predict the verdicts. The numbers below come from the step response computed in Python.

| Step | Action | Transition | Next |
|---|---|---|---|
| Hold | `cmd = 0;` | `after(1, sec)` | Command |
| Command | `cmd = 5;` and `verify(theta < 5.5)` | `after(3.5, sec)` | Settled |
| Settled | `cmd = 5;` and `verify(theta < 5.5)` and `verify(abs(theta - 5) < 0.1)` | `after(2, sec)` | Done |
| Done | `cmd = 5;` | (none) | |

**Step 1: the overshoot rule.** The response peaks at 5.23°, 2.2 s after the command. $5.23 < 5.5$, so the first verify passes at every time step.

**Step 2: the settling rule.** From 3.5 s to 5.5 s after the command, the largest error is $0.024°$. That is below 0.1°, so the second verify passes too.

**Step 3: break it on purpose.** Suppose a colleague retunes the loop to damping ratio 0.4. Now the peak is 6.27° at 1.7 s, so the overshoot verify fails during the Command step. The error between 3.5 s and 5.5 s grows to 0.32°, so the settling verify fails in the Settled step. The test reports both, with the times.

**Sanity check.** A damping ratio of 0.7 gives about 4.6% overshoot, and $5 \times 1.046 = 5.23$. That matches the textbook rule of thumb for 0.7, so the computed response is believable.
:::

::: warning A test that cannot fail is not a test
Always make each new assessment fail once on purpose, as in Step 3. A `verify` with a typo in the signal name, a tolerance of 10 instead of 0.1, or a step that is never reached passes forever and proves nothing. Watching it go red once is how you know it can.
:::

## The Test Manager: organizing and running tests

The **Test Manager** is the window where tests are collected, run and reported. Tests live in a **test file** (with the extension `.mldatx`). A test file holds **test suites**, which hold **test cases**. Each test case names a model, a harness, the inputs to use, any parameter values to override, and the assessments to apply. Results from every run are kept, so you can compare today's run with last week's.

A test case comes in one of three types, and choosing the right one is the main decision.

- A **simulation test** runs the harness and passes if the simulation completes without error and every assessment passes.
- A **baseline test** compares the outputs with stored **baseline** data: the outputs of an earlier run that was checked and accepted. It passes if each logged signal stays within its tolerance of the baseline. It is the classic **[[regression test|regression]]**.
- An **equivalence test** runs two simulations with the same inputs and compares their outputs with each other. The classic use is to run the model normally in the first and as generated code in SIL mode in the second, which is exactly the MIL-versus-SIL comparison of the previous lesson.

::: key
Baseline test: compare this run with a stored, previously accepted run, to catch any change. Equivalence test: compare two runs of the same test made in two different ways (for example the model and its generated code in SIL), to prove they match. Both use tolerances.
:::

### Tolerances

Two runs almost never agree to the last bit, so every comparison has a **tolerance**. You can give an **absolute tolerance**, a fixed allowance in the signal's units, and a **relative tolerance**, a fraction of the baseline's size. When both are given, the allowed difference at each point is the larger of the two:

$$
\text{allowed} = \max\left(\text{AbsTol},\ \text{RelTol} \times |\text{baseline}|\right).
$$

You can also allow a small **time tolerance**, so that a signal that arrives one sample earlier or later still passes. That matters when comparing signals that jump.

::: example Does the new run match the baseline?
A baseline records pitch $\theta = 5.0979°$ at $t = 3$ s. After a change to the model, a new run gives $5.0991°$ at the same time. The test uses an absolute tolerance of $0.001°$.

**Step 1: the difference.** $|5.0991 - 5.0979| = 0.0012°$.

**Step 2: with a relative tolerance of $10^{-4}$.** The relative allowance is $10^{-4} \times 5.0979 = 0.00051°$. The larger of $0.001$ and $0.00051$ is $0.001°$. Since $0.0012 > 0.001$, this point fails.

**Step 3: with a relative tolerance of $10^{-3}$.** The relative allowance is now $10^{-3} \times 5.0979 = 0.0051°$, which beats the absolute one. Since $0.0012 < 0.0051$, it passes.

**Sanity check.** A tolerance of $10^{-3}$ relative means "agree to about 0.1%". A change of $0.0012°$ on $5.1°$ is about 0.024%, so it should pass that looser rule and fail the stricter one, which it does. The real question is which rule the requirement justifies. A change in a controller should usually move a baseline only if you meant it to.
:::

::: warning A baseline is only as good as the run it came from
A baseline records what the model did, not what it should do. If the model had a bug when the baseline was captured, the baseline preserves the bug, and every later run that fixes it fails. Capture a baseline only after the run has passed its assessments and someone has reviewed it, and when you update a baseline on purpose, say why in the commit message.
:::

## Running headless in CI

A **headless** run is one with no windows and no person watching: MATLAB starts, runs the tests, writes the results and exits. That is what lets tests run inside **[[continuous integration|continuous-integration]]** (CI), the practice of building and testing the software automatically every time someone pushes a change.

MATLAB has a command-line switch for this, `-batch`: it runs one statement or script with no desktop, and exits. If the script throws an error, MATLAB exits with a **[[nonzero exit code|exit-code]]**, which is how the CI server knows the job failed. A small script is enough:

```matlab
% run_pitch_tests.m
sltest.testmanager.clear;
sltest.testmanager.load('pitch_ctrl_tests.mldatx');
results = sltest.testmanager.run;
sltest.testmanager.report(results, 'pitch_ctrl_report.pdf');
fprintf('%d passed, %d failed\n', results.NumPassed, results.NumFailed);
assert(results.NumFailed == 0, 'Simulink Test failures');
```

and the CI job runs it with one line:

```bash
matlab -batch "run_pitch_tests"
```

The first line of the script clears any test files already loaded in the Test Manager. The next two load the test file and run every test in it. Then it writes a report, prints the counts, and the `assert` turns any failure into an error, so the job goes red. Simulink Test tests can also be run through the MATLAB unit-test framework, which can write results in the JUnit XML format that most CI servers display as a table of passed and failed tests.

::: key
Why run Simulink Test headless in CI? So that every model change is exercised against its harnesses, coverage and baselines automatically, exactly like a C++ unit-test suite. It needs a runner that can reach a licence server, which is the usual reason such jobs run on self-hosted runners.
:::

A **runner** is the machine that executes a CI job. Cloud runners are fresh machines that vanish after each job, and they cannot usually reach a company's MATLAB **[[license server|license-server]]**. So teams run these jobs on their own machines, **self-hosted runners**, which sit inside the company network with MATLAB, Simulink, Simulink Test and the code-generation tools already installed.

::: warning A green pipeline can hide an empty one
If the script loads the wrong file, or a test file has no enabled tests, `NumFailed` is 0 and the job passes. Check the total count too, and fail the job if it is lower than expected. The test count dropping from 212 to 0 overnight should never look like success.
:::

## Check yourself

::: check
Why build a separate harness instead of adding a Signal Editor and a few Scopes directly into the design model?
:::

::: answer
The design model should contain only the design. Test inputs, scopes and checking blocks clutter it, can confuse reviewers about what is flight logic, and could end up in the generated code. A harness keeps them in a separate model that stays linked to the component, so it always tests the current version, and a component can have many harnesses for many kinds of test without touching the design.
:::

::: check
In a Test Sequence, a step has the transition `after(2, sec)`. A `verify` in that step checks a signal. What happens if the check fails 0.5 s into the step?
:::

::: answer
The verify is marked failed, with the time of the first failure recorded, but the simulation keeps going. The step stays active until 2 s have passed in it and then moves to its next step. The rest of the run still executes, so other assessments are still checked and reported, and the test's overall verdict is fail.
:::

::: check
You want to prove that the generated code of a controller behaves like the model for 40 input scenarios. Which test type do you pick, and what are its two simulations?
:::

::: answer
An equivalence test. The first simulation runs the model in normal simulation mode; the second runs the same harness with the component as generated code in SIL mode. The same 40 input scenarios drive both, and the outputs are compared within tolerances. A baseline test would compare against stored data instead, which answers a different question: has anything changed?
:::

::: check
A baseline signal is 200 at some instant, the new run gives 200.3, AbsTol is 0.5 and RelTol is 0.001. Pass or fail at that instant?
:::

::: answer
The difference is $|200.3 - 200| = 0.3$. The relative allowance is $0.001 \times 200 = 0.2$. The allowed difference is the larger of $0.5$ and $0.2$, which is $0.5$. Since $0.3 < 0.5$, it passes.
:::

::: check
A CI job runs `matlab -batch "run_pitch_tests"`. Explain how a failing `verify` deep inside one harness makes the job turn red.
:::

::: answer
The failing `verify` marks its test case failed. When `sltest.testmanager.run` finishes, the result set's failed count is at least 1. The script's `assert(results.NumFailed == 0, ...)` then throws an error. Because MATLAB was started with `-batch`, an uncaught error makes it exit with a nonzero exit code, and the CI server treats any nonzero exit code from a job step as failure.
:::

## Summary

| Idea | What it is | Remember |
|---|---|---|
| Test harness | Separate model around one component under test | Keeps test blocks out of the design; stays linked |
| Test Sequence | Table of steps with actions and transitions | Temporal operators such as `after(1, sec)`; can react to signals |
| Assessment | Automatic pass-or-fail rule | `verify` records and continues; untested means never reached |
| Test Manager | Test files, suites and cases; results history | Types: simulation, baseline, equivalence |
| Baseline test | Compare with a stored, accepted run | Catches any change; a buggy baseline preserves the bug |
| Equivalence test | Compare two runs made two ways | Model versus SIL is the classic pair |
| Tolerance | Allowed difference | $\max(\text{AbsTol}, \text{RelTol} \times \lvert\text{baseline}\rvert)$ |
| Headless CI | `matlab -batch`, error means nonzero exit | Self-hosted runner that reaches the license server |

A passing test tells you the parts it exercised behave. It does not tell you which parts it never touched. The next lesson measures exactly that with Simulink Coverage: decision, condition and MC/DC coverage, plus coverage of lookup tables, signal ranges and relational boundaries.

::: context component-under-test The thing on the stand
The phrase comes from hardware testing, where the unit on the test bench is the "device under test" or "unit under test". In a harness the component under test sits in the middle, fed by sources on the left and watched by sinks and checks on the right. Everything around it exists only for the test.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="8" width="344" height="124" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="5 3"/>
  <text x="18" y="26" font-size="11" fill="#6c7a93">test harness model</text>
  <rect x="24" y="50" width="86" height="44" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="67" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">Test</text>
  <text x="67" y="84" font-size="11" fill="#1f2a44" text-anchor="middle">Sequence</text>
  <rect x="140" y="50" width="86" height="44" fill="#f2b880" stroke="#1f2a44"/>
  <text x="183" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">component</text>
  <text x="183" y="84" font-size="11" fill="#1f2a44" text-anchor="middle">under test</text>
  <rect x="256" y="50" width="86" height="44" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="299" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">sinks and</text>
  <text x="299" y="84" font-size="11" fill="#1f2a44" text-anchor="middle">assessments</text>
  <line x1="110" y1="72" x2="132" y2="72" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="132,67 132,77 140,72" fill="#1f2a44"/>
  <line x1="226" y1="72" x2="248" y2="72" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="248,67 248,77 256,72" fill="#1f2a44"/>
  <text x="183" y="118" font-size="11" fill="#1f2a44" text-anchor="middle">linked to the design model</text>
</svg>
```
:::

::: context test-assessment A block that only judges
A Test Assessment block looks and works like a Test Sequence block, with steps and transitions, but it has no outputs. It reads signals and holds `verify` statements, nothing more. Keeping the checks in their own block separates "what we do to the component" from "what we expect of it", which makes a reviewer's job easier: the expectations can be read against the requirement line by line.
:::

::: context verify-vs-assert Record it, or stop everything
Simulink also has an Assertion block, which can stop the simulation the moment its input goes false. That is useful while debugging, when you want to freeze at the first problem. A `verify` is built for testing instead: it writes down the verdict and lets the run go on. A test that stops at the first failure tells you one thing is wrong; a test that runs to the end tells you everything that is wrong, which saves many rerun cycles.
:::

::: context damping How much a response overshoots
The damping ratio, written $\zeta$ and read "zeta", says how quickly a second-order system's oscillation dies out. For a step input, the peak overshoot as a fraction of the step is $e^{-\zeta\pi/\sqrt{1-\zeta^2}}$. At $\zeta = 0.7$ that is 4.6%, a gentle bump. At $\zeta = 0.4$ it is 25.4%, which on a 5° step is a peak near 6.27°.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="40" x2="340" y2="40" stroke="#b4232c" stroke-dasharray="5 3"/>
  <text x="342" y="36" font-size="11" fill="#b4232c" text-anchor="end">limit 5.5°</text>
  <line x1="40" y1="50" x2="340" y2="50" stroke="#6c7a93" stroke-dasharray="2 3"/>
  <text x="34" y="54" font-size="11" fill="#1f2a44" text-anchor="end">5°</text>
  <text x="34" y="154" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <polyline points="40,150.0 52,143.4 64,128.3 76,110.3 88,92.6 100,77.4 112,65.4 124,56.7 136,50.9 148,47.5 160,45.8 172,45.4 184,45.7 196,46.4 208,47.2 220,48.0 232,48.7 244,49.3 256,49.7 268,50.0 280,50.1 292,50.2 304,50.2 316,50.2 328,50.2 340,50.1" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="40,150.0 52,142.9 64,125.2 76,102.1 88,78.4 100,57.3 112,41.0 124,30.4 136,25.3 148,25.0 160,28.1 172,33.3 184,39.4 196,45.2 208,50.1 220,53.6 232,55.7 244,56.4 256,56.1 268,55.0 280,53.6 292,52.0 304,50.6 316,49.5 328,48.8 340,48.4" fill="none" stroke="#f2b880" stroke-width="2"/>
  <text x="192" y="170" font-size="11" fill="#1f2a44" text-anchor="middle">0 to 5 s after the command</text>
  <text x="200" y="90" font-size="11" fill="#1d6fd1">zeta 0.7: passes</text>
  <text x="200" y="106" font-size="11" fill="#1f2a44">zeta 0.4: crosses the limit</text>
</svg>
```

Blue: $\zeta = 0.7$. Orange: $\zeta = 0.4$, which crosses the dashed 5.5° limit near its peak.
:::

::: context regression Going backwards
To regress means to go backwards. A regression is a change that breaks something that used to work, and a regression test is any test rerun after every change to catch one. Baseline tests are the purest kind: they do not know what is right, only what was accepted before, so they flag every difference and leave a person to decide whether it was meant.
:::

::: context continuous-integration Every push gets tested
Continuous integration grew up in ordinary software teams in the 1990s and 2000s: instead of merging everyone's work once a month and discovering a pile of conflicts, each change is merged often and checked automatically by a server. Services such as GitHub Actions, GitLab CI and Jenkins watch the repository and run a list of jobs on every push. For a flight software team the list might be: check the model's guidelines, run the Simulink tests, generate code, compile it, run the SIL equivalence tests.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="6" y="30" width="62" height="36" fill="#ffffff" stroke="#1f2a44"/>
  <text x="37" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">push</text>
  <rect x="98" y="30" width="72" height="36" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="134" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">model tests</text>
  <rect x="200" y="30" width="62" height="36" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="231" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">codegen</text>
  <rect x="292" y="30" width="62" height="36" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="323" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">SIL tests</text>
  <line x1="68" y1="48" x2="90" y2="48" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="90,43 90,53 98,48" fill="#1f2a44"/>
  <line x1="170" y1="48" x2="192" y2="48" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="192,43 192,53 200,48" fill="#1f2a44"/>
  <line x1="262" y1="48" x2="284" y2="48" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="284,43 284,53 292,48" fill="#1f2a44"/>
  <text x="180" y="88" font-size="11" fill="#b4232c" text-anchor="middle">any red box stops the change from merging</text>
</svg>
```
:::

::: context exit-code The one number a program leaves behind
Every program that ends hands a small whole number back to whatever started it: its exit code. By a convention that goes back to Unix, 0 means success and anything else means some kind of failure. CI servers, shell scripts and build tools all read it. That is why the `assert` in the script matters: without it, MATLAB would finish the script, exit with 0, and a run full of failed tests would look like a success.
:::

::: context license-server Why the tests need a phone line home
MATLAB and its toolboxes are licensed software. Many companies use network licenses: a license server on the company network hands out a seat of MATLAB, Simulink or Simulink Test to whichever machine asks, and takes it back when the program closes. A CI job must be able to reach that server, and it must have a free seat for every product the tests use. A disposable cloud machine outside the company network usually cannot, which is why these jobs run on the company's own runners.
:::
