---
id: l07-matlab-and-simulink-in-ci
title: MATLAB and Simulink in CI
minutes: 24
covers:
  - 'MATLAB and Simulink in CI: setup-matlab, headless Simulink Test, licence servers'
---

Think of a school library that owns five copies of a popular book. Anyone may read it, but only five people at a time. When all five are checked out, the next person waits, or goes home without it. The library does not care who you are, only whether a copy is free.

Expensive engineering software often works the same way. A company buys a certain number of **licenses** — permissions to run the program — and a small server hands them out, like the librarian at the desk. A robot that wants to run the program in CI has to walk up to that desk too.

That matters on a GNC team, because much of the guidance and control design in aerospace is done in **MATLAB**, a programming language and environment built for math with matrices, and **Simulink**, its companion tool where a system is drawn as a block diagram: a sensor block wired into a filter block wired into a controller block, running in simulated time. Those models deserve the same pipeline as the Python and C++ code in the earlier lessons: every change checked by a clean machine. This lesson shows how, and how to get past the librarian.

## Why models need CI too

A Simulink model is code, even though it is drawn. A tuned gain lives in a block parameter. A wire moved from one port to another changes the physics. And a model file is hard to review by eye: a pull request that changes it shows a diff of a large file format, not a picture of what moved.

If someone changes a filter time constant and the pointing error doubles, you want to find out at the pull request, from a red check, not from an analyst a month later. What CI does for a model is the same list as before, in MATLAB's own words:

- run the **unit tests** written in MATLAB's test framework,
- run the **Simulink Test** suites: simulations of the model with pass/fail criteria,
- measure **coverage**, both of MATLAB code and of the model itself (which blocks, which branches of each decision, were exercised),
- run **Model Advisor** checks, which inspect the model for modeling-standard violations,
- and publish every report as an artifact, including **traceability** reports, which show which requirement each test verifies.

::: key How Simulink fits into CI
Run MATLAB headless on a runner that can reach a licence server, execute Simulink Test suites and coverage programmatically, run Model Advisor checks, and publish the coverage and traceability reports as artefacts.
:::

## The three MathWorks actions

MathWorks, the company behind MATLAB, publishes official GitHub Actions under the name `matlab-actions`. The three you need most are:

- **`matlab-actions/setup-matlab@v2`** installs MATLAB, and any extra products you name, on the runner and puts `matlab` on the PATH.
- **`matlab-actions/run-tests@v2`** runs your MATLAB and Simulink tests and can write reports: test results, code coverage, model coverage.
- **`matlab-actions/run-command@v2`** runs any MATLAB statements you give it, such as a script that checks the model or builds documentation.

A **product** here means one add-on to MATLAB: Simulink itself, **[[Simulink Test|simulink-test-files]]**, Simulink Coverage, and so on. Each is licensed separately, so each must be named.

Here is a complete workflow for a public repository that holds an attitude-control model:

```yaml
name: model-tests
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  simulink-tests:
    runs-on: ubuntu-24.04
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v7
      - uses: matlab-actions/setup-matlab@v2
        with:
          release: R2024b
          products: Simulink Simulink_Test Simulink_Coverage
          cache: true
      - uses: matlab-actions/run-tests@v2
        with:
          source-folder: src
          select-by-folder: tests
          test-results-junit: reports/results.xml
          code-coverage-cobertura: reports/code-coverage.xml
          model-coverage-cobertura: reports/model-coverage.xml
      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: matlab-reports
          path: reports
```

Read it step by step.

1. **checkout** fetches the repository, as in every workflow.
2. **setup-matlab** installs MATLAB. `release: R2024b` pins the version. MATLAB ships two **[[releases a year|matlab-release-names]]**, and numerical results can shift between them, so a pinned release makes an upgrade a deliberate commit — the same reason lesson 2 preferred `ubuntu-24.04` to `ubuntu-latest`. `products:` lists the extras, separated by spaces, with underscores inside a name (`Simulink_Test`, not `Simulink Test`, which would be read as two products). `cache: true` keeps the installation in the Actions cache, so later runs skip a download of several gigabytes.
3. **run-tests** finds the tests under `tests`, adds `src` to MATLAB's search path so the tests can see the code, runs them, and writes three reports. `test-results-junit` is the same **JUnit XML** format pytest wrote in lesson 3. The two coverage reports use the **[[Cobertura|cobertura-format]]** XML format. If any test fails, the step exits non-zero and the job goes red.
4. **upload-artifact** keeps the `reports` folder, even when tests fail (`if: always()`).

When you need something that is not a test, run-command takes MATLAB code:

```yaml
      - uses: matlab-actions/run-command@v2
        with:
          command: addpath("scripts"), check_models
```

Here `check_models` would be a script of your own, for example one that runs Model Advisor on every model through its scripting interface (the function `ModelAdvisor.run`) and calls `error(...)` if any check fails. The rule for run-command is simple: if the MATLAB code throws an error, the step fails. If it finishes, the step passes.

::: warning Name every product the tests touch
If a test opens a Simulink model and `Simulink` is not in `products:`, the test fails on the CI machine even though it runs on your desktop, where everything happens to be installed. This is "it works on my machine" from lesson 1, in MATLAB form.
:::

## Headless: MATLAB with nobody watching

On your desktop, MATLAB opens a big window with an editor, a command prompt and plots. A CI runner has no screen, no mouse and nobody to click "OK" on a dialog. It needs MATLAB to run **[[headless|headless-word]]**: no window at all, commands in, text out, then quit.

The command line switch for that is **`-batch`**:

```bash
matlab -batch "results = runtests('tests'); assertSuccess(results)"
```

Read it aloud as "matlab, dash batch, then a statement in quotes". It does four things:

- starts MATLAB with no desktop and no splash screen,
- runs the statement in quotes,
- prints anything the statement prints to the terminal, which lands in the CI log,
- quits, with exit code 0 if the statement finished and a **non-zero exit code** if it threw an error.

That last point is what connects MATLAB to CI. Lesson 2 showed that a step is red exactly when its command exits non-zero. `runtests` on its own does not throw an error when a test fails; it returns a results object. `assertSuccess(results)` is what turns "some test failed" into an error, and so into a red check. Leave it out, and a broken model reports green.

The run-tests action does all of this for you. You write `-batch` yourself on a self-hosted machine, or in a GitLab or Jenkins job.

::: example Following one failure from test to red check
A test folder holds 12 tests. One of them, a step-response test for the pitch controller, fails because a gain was mistyped.

1. `runtests('tests')` runs all 12. It prints each result and returns a results array with 11 passes and 1 failure.
2. `assertSuccess(results)` checks the array. It finds one failure and throws an error that names the failed test.
3. Because the statement ended in an error, `matlab -batch` exits with a non-zero code.
4. The runner sees the non-zero code and marks the step and job red; the pull request shows a red check, with the failing test named in the log.

Now remove `assertSuccess(results)` and replay. Step 1 is the same, but nothing throws, MATLAB exits 0, and the check is green with a failure sitting in the log where nobody reads it. Sanity check: a gate is only as good as its exit code.
:::

## Headless Simulink Test

**Simulink Test** is the MathWorks product for testing models. Its test cases live in a test file ending in `.mldatx`. A test case says which model to simulate, with which inputs, and what counts as passing: for example a **baseline test** compares the simulated signals to stored reference signals within tolerances — the golden-file idea of lesson 6, for models. Engineers usually build these files in a graphical tool called the **Test Manager**.

In CI there is no one to press the Test Manager's "Run" button, so you run the same file from code. There are two common ways.

**Through the MATLAB test framework.** When Simulink Test is installed, a `.mldatx` file can be turned into an ordinary test suite, and then everything from the last section applies:

```matlab
import matlab.unittest.TestSuite
import matlab.unittest.TestRunner
import matlab.unittest.plugins.XMLPlugin

suite = TestSuite.fromFile("tests/attitude_regression.mldatx");
runner = TestRunner.withTextOutput;
runner.addPlugin(XMLPlugin.producingJUnitFormat("reports/sltest.xml"));
results = runner.run(suite);
assertSuccess(results);
```

Line by line: build a suite from the test file, make a runner that prints progress as text, attach a **plugin** (an add-on to the runner) that writes a JUnit XML report, run, and turn any failure into an error. The run-tests action does the same when your `.mldatx` files sit in the test folder.

**Through the Test Manager's own functions.** The `sltest.testmanager` package drives the Test Manager from code:

```matlab
sltest.testmanager.load("tests/attitude_regression.mldatx");
resultSet = sltest.testmanager.run;
sltest.testmanager.exportResults(resultSet, "reports/attitude_results.mldatx");
if resultSet.NumFailed > 0
    error("Simulink Test: %d test case(s) failed", resultSet.NumFailed);
end
```

This route keeps the full Test Manager results file, with its signals, for an engineer to open later. Notice the last three lines: the Test Manager does not throw an error on a failed test case, so the script must.

Either script can be run headless with `matlab -batch "run_sltests"` if you save it as `run_sltests.m`, or through run-command in GitHub Actions.

::: warning Models that wait for a click
A model that opens a dialog box, a scope window that pops up, or a script that calls `input(...)` will wait forever on a machine with no one to answer. Set `timeout-minutes:` on the job, a little above its normal time, so a hang fails in minutes instead of hours, and keep interactive code out of anything a test calls.
:::

## Licenses: who is allowed to run MATLAB

Now the librarian. MATLAB checks for a valid license every time it starts, and a fresh CI machine has never been told about any license. There are three routes. Which one you use depends on whether the repository is public or private, and where the runner lives.

### Route 1: a public repository on GitHub-hosted runners

For a **public** repository, setup-matlab licenses the products it installs automatically. The exception is the **[[transformation products|transformation-products]]** — products such as MATLAB Coder and MATLAB Compiler, which turn MATLAB code or models into C code or stand-alone programs. Those are not covered automatically.

### Route 2: a private repository on GitHub-hosted runners

For a **private** repository, nothing is licensed automatically. Instead, you ask MathWorks for a **batch licensing token**: a license key meant for running MATLAB non-interactively on machines like CI runners. The same token is also the way to use transformation products in a public repository. You store the token as a secret (lesson 3) and hand it to MATLAB in an environment variable named **`MLM_LICENSE_TOKEN`**:

```yaml
      - uses: matlab-actions/run-tests@v2
        env:
          MLM_LICENSE_TOKEN: ${{ secrets.MLM_LICENSE_TOKEN }}
        with:
          select-by-folder: tests
```

Only the steps that start MATLAB — run-tests and run-command — need it, so it goes in those steps' `env:`, following lesson 3's rule. And like every secret, it is not given to pull requests from forks.

### Route 3: a self-hosted runner and a license server

Many aerospace companies do not license MATLAB per person. They run a **network license manager** on a server inside the company network. It holds a pool of **concurrent licenses** — "up to 10 people may use Simulink at the same moment, whoever they are" — exactly like the library's five copies. MathWorks' network license manager is built on **[[FlexLM|flexlm-name]]**, a widely used licensing system, and MATLAB finds the server through an address of the form **`port@host`**:

```text
MLM_LICENSE_FILE=27000@flexlm.gnc.example.com
```

Read it as "port 27000 at the machine named flexlm.gnc.example.com". A **port** is a numbered door on a server; one machine can run many services, each listening at its own number. FlexLM's license daemon listens by default on a port in the range 27000 to 27009, and 27000 is the usual choice. The MathWorks part of the server (its **vendor daemon**, a helper program named MLM) listens on a second port, which the company's license file can fix to a known number. Any firewall between runner and server must let both through.

A GitHub-hosted runner lives in GitHub's data center and cannot reach a server inside your company network. So route 3 means a **self-hosted runner**: a machine on the company network, with MATLAB installed and `MLM_LICENSE_FILE` set, registered with GitHub (lesson 4 shows how). The workflow asks for it by its labels:

```yaml
jobs:
  simulink-tests:
    runs-on: [self-hosted, linux, matlab-r2024b]
    timeout-minutes: 60
    env:
      MLM_LICENSE_FILE: 27000@flexlm.gnc.example.com
    steps:
      - uses: actions/checkout@v7
      - run: matlab -batch "results = runtests('tests', 'IncludeSubfolders', true); assertSuccess(results)"
```

MATLAB is already installed there, so there is no setup-matlab step: the run step finds `matlab` on the machine's PATH. The **[[label|runner-labels]]** `matlab-r2024b` is one the team chose when registering the machine. The license address is only a location, not a secret, so it can sit in plain `env:` (or be set on the runner machine itself).

This is the first reason on the list of when to use a self-hosted runner: a license reachable only on a private network. Hardware in the loop and export-controlled data, the other reasons, often apply to the same GNC team.

::: example Which route for which repository?
Three repositories, one decision each.

1. **A university CubeSat team's attitude simulator**, public on GitHub, using Simulink and Simulink Test. Public repository, no transformation products: **route 1**. Add setup-matlab with the two products and it works.
2. **The same team adds a job that generates C code for the flight computer** with Embedded Coder, a code generation product. The repository is still public, but code generation is a transformation product, so the automatic license does not cover that job: **route 2**, a batch licensing token for it.
3. **A company's guidance-law repository**, private, holding export-controlled models, with the company's Simulink licenses on a FlexLM server. Private, and the data may not leave company machines anyway: **route 3**, a self-hosted runner inside the network, with `MLM_LICENSE_FILE` pointing at the license server.

Sanity check: the questions were always the same two — is the repository public, and can the runner reach the licenses (and is it allowed to hold the data)?
:::

::: key Licensing in one table
Public repository on hosted runners: setup-matlab licenses the products automatically, except transformation products such as MATLAB Coder and MATLAB Compiler. Private repository on hosted runners: a MathWorks batch licensing token, stored as a secret and passed as `MLM_LICENSE_TOKEN`. Company license server: a self-hosted runner on the network with `MLM_LICENSE_FILE=port@host` (FlexLM, commonly port 27000).
:::

## Running out of copies

With a network license, CI competes with people. Every CI job that starts MATLAB checks out a license for each product it uses, and holds them until MATLAB quits. If the pool is empty, MATLAB refuses to start. The license manager reports this as **error -4**, "licensed number of users already reached". A job that cannot reach the server at all sees **error -15**, which usually means a wrong address, a server that is down, or a firewall.

A CI job that fails because the pool was empty says nothing about your code. It is a false red, and false reds teach people to ignore red. So you plan license use like any other limited resource.

::: example Planning a nightly model matrix against the license pool
The team owns 4 concurrent Simulink Test licenses. During the working day, engineers typically hold 2 of them. A nightly workflow runs a matrix of 2 MATLAB releases (R2023b and R2024b) times 3 test groups (guidance, navigation, control), and each job takes about 15 minutes.

1. Count the jobs: $2 \times 3 = 6$.
2. Count the free licenses at night, when nobody is working: all 4. During the day it would be $4 - 2 = 2$.
3. Without a limit, all 6 jobs start together. At night, 4 get a license and $6 - 4 = 2$ fail with error -4. Two false reds.
4. Add `max-parallel: 2` under `strategy:`. Now at most 2 jobs run at once, so the 6 jobs go in $6 / 2 = 3$ waves, taking about $3 \times 15 = 45$ minutes. Two licenses stay free for anyone who works late.

45 minutes is fine for a nightly run, but far too slow for a pull request — one more reason to keep the multi-release matrix nightly, as lesson 5 suggests. Sanity check: $3 \times 2 = 6$ jobs, all run, none fail for lack of a license.
:::

The matching YAML is one line in the strategy block:

```yaml
    strategy:
      max-parallel: 2
      fail-fast: false
      matrix:
        release: [R2023b, R2024b]
        group: [guidance, navigation, control]
```

On a self-hosted pool, the number of runners also limits how many jobs run at once.

::: warning Do not "fix" license errors with retries
When a job fails with error -4, it is tempting to add an automatic retry. That hides the real problem, which is a pipeline asking for more licenses than exist. Size the parallelism to the pool, move heavy matrices to the night, and if the team truly needs more CI capacity, that is a conversation about buying licenses. The next lesson makes the same argument about flaky tests.
:::

## Check yourself

::: check
A workflow's setup-matlab step says `products: Simulink Test`. The tests that open `.mldatx` files fail with an error that Simulink Test is not available. What is wrong?
:::

::: answer
Product names are separated by spaces, and a name with a space inside is written with an underscore. `Simulink Test` was read as two products, Simulink and a product called "Test", so Simulink Test itself was never installed. Write `products: Simulink Simulink_Test`.
:::

::: check
A developer's CI step runs `matlab -batch "runtests('tests')"`. Two tests fail, yet the check is green. Explain, and fix it.
:::

::: answer
`runtests` reports failures in the results it returns but does not throw an error, so the statement finishes normally and `matlab -batch` exits with code 0; the runner sees success. Capture the results and assert on them: `matlab -batch "results = runtests('tests'); assertSuccess(results)"`. Now a failed test throws, MATLAB exits non-zero, and the step turns red.
:::

::: check
Your company's MATLAB licenses live on a FlexLM server at `lic01.corp.example.com`, port 27000, inside the company network. Could a job on `runs-on: ubuntu-24.04` use them? What would you set up instead?
:::

::: answer
No. `ubuntu-24.04` is a GitHub-hosted runner in GitHub's data center, and it cannot reach a server inside the company network (and should not: the firewall is there on purpose). Set up a self-hosted runner on the company network with MATLAB installed, give it a label such as `matlab-r2024b`, set `MLM_LICENSE_FILE=27000@lic01.corp.example.com` on it, and use `runs-on: [self-hosted, linux, matlab-r2024b]`. Make sure the firewall lets it reach both the license daemon port and the MathWorks vendor daemon port.
:::

::: check
A nightly matrix of 8 Simulink jobs, each 10 minutes long, shares a pool of 3 concurrent licenses with nobody else at night. What `max-parallel` would you choose, and how long does the run take?
:::

::: answer
At most 3 licenses exist, so `max-parallel: 3`. The jobs go in waves of 3, 3 and 2, which is 3 waves (8 divided by 3, rounded up). The run takes about $3 \times 10 = 30$ minutes and no job fails for lack of a license. Choosing 2 instead leaves one license free for a late worker and takes 4 waves, about 40 minutes.
:::

## Summary

| Idea | What it does | Key syntax or fact |
| --- | --- | --- |
| setup-matlab | Installs MATLAB and products on a runner | `release: R2024b`, `products: Simulink Simulink_Test`, `cache: true` |
| run-tests | Runs tests, writes reports | `select-by-folder`, `test-results-junit`, `model-coverage-cobertura` |
| run-command | Runs any MATLAB code | step fails if the code throws an error |
| Headless MATLAB | No window, text out, then quit | `matlab -batch "..."`, non-zero exit on error |
| Turning failures into errors | Makes a red check | `assertSuccess(results)`; check `NumFailed` for the Test Manager |
| Simulink Test in CI | Model tests from a `.mldatx` file | `TestSuite.fromFile`, or `sltest.testmanager.load` / `run` / `exportResults` |
| Public repository | Automatic license on hosted runners | not for transformation products (Coder, Compiler) |
| Private repository | Batch licensing token | secret passed as `MLM_LICENSE_TOKEN` |
| License server | Self-hosted runner on the network | `MLM_LICENSE_FILE=27000@host` (FlexLM) |
| License pool | Concurrent licenses are limited | `max-parallel`; error -4 means the pool is empty |

The last lesson of the module turns to what keeps the gate trustworthy: what to do with a test that fails only sometimes, how to make checks truly required before a merge, and how to publish a numbered release automatically.

::: context simulink-test-files One file, many test cases
A Simulink Test file (ending in `.mldatx`) is a container. Inside it are test suites, and inside those are test cases. Each test case names a model, often a **test harness** — a small wrapper model that feeds inputs to the component under test and records its outputs — plus inputs, parameter overrides and pass/fail criteria. Because the file is binary rather than plain text, a pull request cannot show a readable diff of it. That is one more reason to let CI run it on every change: the check result is the readable part.
:::

::: context matlab-release-names How MATLAB releases are named
MathWorks names each release after its year plus a letter: `a` for the first release of the year, usually in March, and `b` for the second, usually in September. So R2024b is the second release of 2024. Each release can change numerical library code, solvers and defaults, which is why a team pins one in CI and upgrades on purpose, the same way it pins a compiler version.
:::

::: context cobertura-format A coverage report many tools read
Cobertura began as a code coverage tool for Java, and its XML report layout outlived it as a common format. Coverage viewers in many CI systems, including GitLab and Jenkins plugins, read Cobertura XML. That is why MATLAB's actions can write it: the model coverage from a Simulink run then appears next to the C++ and Python coverage from the rest of the pipeline, in the same viewer.
:::

::: context headless-word Why "headless"
In computing, the "head" is the part a person sits in front of: the screen and keyboard. A headless machine or program runs with none of that attached. Servers in a data center are usually headless, and so is every CI runner. A program meant to run headless must never wait for a click, because no click will ever come.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">desktop</text>
  <rect x="30" y="28" width="120" height="70" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="38" y="36" width="104" height="14" fill="#8fb8f0"/>
  <text x="90" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">MATLAB window</text>
  <text x="90" y="80" font-size="11" text-anchor="middle" fill="#6c7a93">plots, editor, dialogs</text>
  <rect x="60" y="104" width="60" height="10" rx="2" fill="#6c7a93"/>
  <rect x="40" y="120" width="100" height="14" rx="3" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">CI runner</text>
  <rect x="210" y="28" width="120" height="44" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">matlab -batch</text>
  <text x="270" y="62" font-size="11" text-anchor="middle" fill="#6c7a93">no screen</text>
  <line x1="270" y1="72" x2="270" y2="100" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="265,96 275,96 270,104" fill="#1d6fd1"/>
  <rect x="210" y="106" width="120" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="125" font-size="11" text-anchor="middle" fill="#1f2a44">text log + exit code</text>
</svg>
```
:::

::: context transformation-products Products that make new programs
MathWorks uses "transformation products" for tools that turn MATLAB code or Simulink models into something that runs without MATLAB: MATLAB Coder and Embedded Coder generate C and C++ source, MATLAB Compiler builds stand-alone applications. On a GNC team, Embedded Coder is often how a Simulink controller becomes flight software, and testing that generated code, with the same test cases as the model, is a big part of what a Simulink CI pipeline does.
:::

::: context flexlm-name The license manager under the hood
FlexLM is the old name of a license management system now sold as FlexNet Publisher, used by many engineering tools besides MATLAB. Engineers still say FlexLM. It has two parts on the server: a general daemon, `lmgrd`, that answers first, and a vendor daemon for each software company — MathWorks' is called MLM — that decides whether a license is free. A client first knocks on the `lmgrd` port, then is sent on to the vendor daemon.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="60" width="110" height="56" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="82" font-size="12" text-anchor="middle" fill="#1f2a44">self-hosted</text>
  <text x="65" y="98" font-size="12" text-anchor="middle" fill="#1f2a44">runner</text>
  <rect x="200" y="14" width="150" height="152" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="275" y="32" font-size="12" text-anchor="middle" fill="#6c7a93">license server</text>
  <rect x="215" y="44" width="120" height="40" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">lmgrd</text>
  <text x="275" y="76" font-size="11" text-anchor="middle" fill="#1f2a44">port 27000</text>
  <rect x="215" y="104" width="120" height="48" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">MLM daemon</text>
  <text x="275" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">pool of 4 licenses</text>
  <line x1="120" y1="76" x2="213" y2="64" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="166" y="62" font-size="11" text-anchor="middle" fill="#1d6fd1">1</text>
  <line x1="120" y1="100" x2="213" y2="124" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="166" y="126" font-size="11" text-anchor="middle" fill="#1d6fd1">2</text>
</svg>
```
:::

::: context runner-labels Labels choose the machine
Every self-hosted runner carries labels. `self-hosted` and its operating system (`linux`) are added automatically; the team adds its own, such as `matlab-r2024b` or `hil-rig-2`. A job's `runs-on:` list must match all of the labels, so a job asking for `matlab-r2024b` waits for a machine that has that release, rather than failing on one that does not. Lesson 4 covers registering runners and keeping them clean between jobs.
:::
