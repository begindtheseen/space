---
id: l08-flaky-tests-protection-and-releases
title: Flaky tests, protected branches and releases
minutes: 26
covers:
  - 'Flaky-test policy; quarantine rather than retry-until-green'
  - 'Branch protection, required checks, release automation'
---

Picture a smoke alarm that goes off every time someone makes toast. The first few times, everyone runs to check. By the second week, people wave a towel at it without looking up. By the third, someone takes the battery out. Now the house has no smoke alarm at all — and the day there is a real fire, nothing beeps.

A CI pipeline can die the same way: its red results stop meaning anything, so people stop reading them, then stop waiting for them, and finally switch them off.

This last lesson of the module is about keeping the alarm honest. First, the **flaky test**, and why the fix is quarantine and diagnosis, never "run it again until it passes". Then **branch protection** with **required checks**, which make CI a real gate, and **release automation**, so that the version an analyst runs is numbered, tested and reproducible.

## What a flaky test is

A **[[flaky|flaky-word]] test** is a test that sometimes passes and sometimes fails on exactly the same code. That can only happen if the test depends on something that is not the code. The usual suspects:

- an **unseeded random number generator** — a Monte Carlo test that draws new random numbers every run,
- the **wall clock** — a test that assumes a step finishes within 50 ms, or that reads today's date,
- a **shared temporary file** — two tests, or two parallel jobs, writing the same `/tmp/out.csv`,
- **test order** — one test changes a global setting that another test depends on,
- **genuine numerical marginality** — a result right at the edge of its tolerance, pushed either way by tiny rounding differences.

Here is a real flaky test. It checks a function that estimates a gyroscope's **bias** (the small constant error it reports even when standing still) by averaging 100 noisy readings.

```python
import numpy as np
from gyro import estimate_bias      # returns the mean of the readings

TRUE_BIAS = 0.05   # deg/s
NOISE = 0.01       # deg/s, one standard deviation


def test_bias_estimate():
    rng = np.random.default_rng()            # no seed: new numbers every run
    readings = TRUE_BIAS + NOISE * rng.standard_normal(100)
    assert abs(estimate_bias(readings) - TRUE_BIAS) < 0.002
```

`rng.standard_normal(100)` draws 100 random numbers from a bell curve centered on zero with spread 1; scaling and shifting them makes 100 fake readings. The function is correct. And yet:

```text
$ for i in $(seq 1 100); do pytest -q tests/test_gyro_flaky.py >/dev/null || echo FAIL; done | grep -c FAIL
6
```

Six failures in 100 runs of the same code (pytest 9.1.1, NumPy 2.4.6). Running the check itself 10,000 times gave 466 failures, a rate of about 4.7%.

::: example Predicting the failure rate before running it
Why about 5%? Work it out.

1. Averaging $n$ readings shrinks the noise. The spread of the average, called the **[[standard error|standard-error]]**, is $\sigma / \sqrt{n}$, where $\sigma$ (read "sigma") is the spread of one reading. Here $0.01 / \sqrt{100} = 0.01 / 10 = 0.001$ deg/s.
2. The test allows an error of $0.002$ deg/s. That is $0.002 / 0.001 = 2$ standard errors.
3. For a bell curve, the chance of landing more than 2 standard errors from the center, on either side, is about $0.0455$, or 4.55%.

So the test was designed to fail about 1 run in 22. The measured 4.7% agrees. Sanity check: nothing is wrong with `estimate_bias`. The test's tolerance was chosen without asking how big the noise is. That is the "numerical marginality" cause, made worse by the missing seed.
:::

The fix has two parts. Seed the generator, so the test is **deterministic** — same code, same result, every time. And choose the tolerance from the physics: allow 5 standard errors, $0.005$ deg/s, where a random miss happens fewer than once in a million runs, while a real bug (an estimator that averages in the wrong units, say) is still caught.

```python
def test_bias_estimate():
    rng = np.random.default_rng(seed=20240917)   # same numbers every run
    readings = TRUE_BIAS + NOISE * rng.standard_normal(100)
    # standard error of the mean = 0.01 / sqrt(100) = 0.001; allow 5 of them
    assert abs(estimate_bias(readings) - TRUE_BIAS) < 0.005
```

Run 100 times: 0 failures. Lesson 6 made the same point for Monte Carlo runs: random by design, reproducible by record.

## Why a few flaky tests ruin a whole suite

One test that fails 2% of the time sounds harmless. Ninety-eight runs out of a hundred, it is fine. The trouble is that a pipeline has many tests, and the pipeline is red if *any* of them fails.

If each test fails with probability $p$, independently of the others, then each passes with probability $1 - p$. The chance that **all** $N$ tests pass is those chances multiplied together, $N$ times over:

$$
P(\text{all pass}) = (1 - p)^N, \qquad P(\text{false red}) = 1 - (1 - p)^N.
$$

Read $(1-p)^N$ as "one minus p, to the power N". The **[[multiplying|independent-chances]]** is the key step: each extra flaky test is one more chance for the run to go red.

::: example Thirty tests at 2%
A simulator's suite has 30 slow integration tests that each fail 2% of the time for reasons unrelated to the code. What fraction of pipeline runs are red for no reason?

1. Each test passes with probability $1 - 0.02 = 0.98$.
2. All 30 pass with probability $0.98^{30}$. Computed: $0.98^{30} \approx 0.545$.
3. So at least one fails with probability $1 - 0.545 = 0.455$.

About 45% of runs are red with nothing wrong. With 100 such tests it is $1 - 0.98^{100} \approx 0.867$, or 87%.

Put it in a week of 40 pull requests, one run each: $40 \times 0.455 \approx 18$ false reds. Eighteen times a week, someone investigates a failure that is not there, or learns to stop investigating. Sanity check: with only one such test it would be $40 \times 0.02 = 0.8$ a week, which is why the problem sneaks up as the suite grows.
:::

::: key A test that fails one run in twenty
Treat flakiness as a defect: quarantine the test out of the gate, file it, and find the real cause, usually an unseeded RNG, a wall-clock dependency, a shared temp file, or genuine numerical marginality. Do not add automatic retries, which hide real intermittent bugs.
:::

## Why retry-until-green is the wrong fix

The quick fix is tempting: if a test fails, run it again, up to three times, and count it as passing if any attempt passes. GitHub even has a "Re-run failed jobs" button, and there are **[[rerun plugins|rerun-plugins]]** that do it automatically. The alarm stops beeping.

But look at what a retry does to a **real** intermittent bug. Suppose a change adds a **race** between two threads of the simulator — both touch the same data, and the result depends on which gets there first — so that 30% of runs produce a corrupted state.

- One attempt: the test catches it with probability $0.3$.
- Three attempts, red only if **all three** fail: probability $0.3^3 = 0.027$.

So with three retries, the pipeline goes green $1 - 0.027 = 0.973$, about 97% of the time, on code with a real bug in it. The retry did not remove noise. It removed the signal.

::: warning The re-run button is a retry too
Pressing "Re-run failed jobs" until the check turns green is retry-until-green by hand. It is fine to re-run once to find out *whether* a failure is flaky. After that, the answer is a ticket, not another click.
:::

## Quarantine: out of the gate, not out of mind

When a test turns out to be flaky and cannot be fixed today, you **quarantine** it: move it out of the merge gate, on purpose and on the record, while it is being fixed.

The word comes from **[[isolating ships|quarantine-word]]**: keep the problem where it cannot spread, and keep watching it. A quarantined test still runs, in a separate job that blocks nothing, so evidence keeps coming in.

A good quarantine policy has four rules:

1. **Every quarantined test has a ticket** in the issue tracker, with the failure log attached.
2. **Every ticket has an owner** — a named person, not "the team".
3. **Quarantine expires.** After an agreed time, say two weeks, the test is fixed and back in the gate, or deleted and replaced.
4. **The quarantine list is short and visible.** A growing list means the team needs time set aside for test health.

In pytest, a **marker** is a label you put on a test with `@pytest.mark.<name>`. Register one called `quarantine` in `pytest.ini`:

```ini
[pytest]
markers =
    quarantine(ticket): known-flaky test, kept out of the merge gate until fixed
```

Then label the flaky test, with its ticket number right there in the code:

```python
@pytest.mark.quarantine(ticket="SIM-482")
def test_bias_estimate_unseeded():
    ...
```

`-m "not quarantine"` runs everything except the quarantined tests, and `-m quarantine` runs only them. `--strict-markers` makes an unregistered marker an error, so a typo such as `quarantene` cannot silently create a new label. The real output on the two gyro tests:

```text
$ pytest -m "not quarantine" --strict-markers
collected 2 items / 1 deselected / 1 selected
tests/test_gyro_fixed.py .                                     [100%]
======================= 1 passed, 1 deselected in 0.08s ========================
```

In the workflow, the gate job runs the healthy tests, and a second job runs the quarantined ones without blocking anything:

```yaml
jobs:
  tests:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: python -m pip install -r requirements-dev.txt
      - run: pytest -m "not quarantine" --strict-markers
  quarantined:
    runs-on: ubuntu-24.04
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: python -m pip install -r requirements-dev.txt
      - run: pytest -m quarantine --strict-markers --junitxml=quarantine.xml
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: quarantine-report
          path: quarantine.xml
```

`continue-on-error: true` on the `quarantined` job means its failure does not fail the whole run. Only `tests` will be a required check (next section), so a quarantined failure never blocks a merge, but its report is kept for the owner.

::: example How many clean runs before you believe the fix?
The owner of SIM-482 thinks she has fixed a test that used to fail 2% of the time. She runs it in a loop. How many passes in a row should she see before trusting the fix?

Ask the question backwards: if the test were **still** broken, how likely is it to pass $n$ times in a row by luck? That is $0.98^n$. She wants that below 5%.

1. Set $0.98^n \le 0.05$.
2. Take logarithms of both sides: $n \ln 0.98 \le \ln 0.05$. Since $\ln 0.98$ is negative, dividing by it flips the inequality: $n \ge \ln 0.05 / \ln 0.98$.
3. Compute: $\ln 0.05 \approx -2.996$ and $\ln 0.98 \approx -0.0202$, so $n \ge 148.3$.

Round up: **149 clean runs**. Twenty passes prove almost nothing, because a still-broken test passes 20 in a row $0.98^{20} \approx 67\%$ of the time. Sanity check: a rare flake needs many runs to show itself, so a number in the low hundreds makes sense.
:::

## Branch protection: making the gate real

A red check is only advice unless something stops the merge. That something is **branch protection**: rules GitHub enforces on a branch, usually `main`, no matter who is pushing.

You set them in the repository's settings, either as a classic **branch protection rule** or as a newer **[[ruleset|rulesets]]**. The rules that matter most for a simulation team:

- **Require a pull request before merging.** Nobody pushes straight to `main`.
- **Require approvals**, for example 1 or 2 reviewers. Optionally **require review from [[code owners|codeowners]]**, so a change to the guidance law needs a guidance engineer's approval.
- **Dismiss stale approvals** when new commits are pushed, so an approval covers the code that is actually merged.
- **Require status checks to pass before merging**, and pick which checks. These are the **required checks**.
- **Require branches to be up to date before merging**, so the checks ran against the current `main`. This is the answer to lesson 1's two good changes that break together. On a busy repository, a **[[merge queue|merge-queue]]** does the same job with less waiting.
- **Do not allow bypassing**, so the rules apply to administrators too.
- **Block force pushes and deletion** of the branch, so history cannot be rewritten.

For a private repository, these features need a paid GitHub plan. Notice that review policy lives here, in branch protection, whatever runner a job uses. A self-hosted runner is chosen for licenses, hardware or controlled data, never as a way around review.

::: key Branch protection and required checks
Branch protection (a rule or a ruleset on `main`) blocks merging until the named required status checks are green, the required reviews are approved and, if set, the branch is up to date with `main`. It applies to everyone, administrators included, when bypassing is not allowed.
:::

## Required checks that never arrive

A required check is chosen by its **name**: the name of the job as it appears on the pull request. That leads to two traps.

**Trap 1: renamed jobs.** A matrix job appears as `test (ubuntu-24.04, 3.12)`. Change the matrix or rename the job, and the old name never reports again; the pull request waits forever for it.

**Trap 2: skipped workflows.** Lesson 2 showed `paths:` filters, which skip a workflow when only other files changed. A required check in a skipped workflow never reports, so GitHub shows it as pending ("expected") forever. In the other direction, a *job* skipped by an `if:` condition reports as **success**.

The standard fix for both is one small **[[summary job|all-green-job]]** that depends on all the others, always runs, and fails if any of them failed. You make only that one job required:

```yaml
  all-checks:
    if: always()
    needs: [lint, tests, regression]
    runs-on: ubuntu-24.04
    steps:
      - name: Fail if any needed job failed or was cancelled
        if: contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled')
        run: exit 1
      - run: echo "all needed jobs passed or were skipped on purpose"
```

`needs.*.result` (read "needs star result") is the list of results of every job in `needs:`, each one `success`, `failure`, `cancelled` or `skipped`. `contains(list, 'failure')` is true if any of them failed. Give this workflow no `paths:` filter, so it reports on every pull request; a job that should skip docs-only changes can do so with its own `if:`, which reports success.

::: warning Without always(), a failure turns green
Leave out `if: always()` and watch what happens when `tests` fails. A job whose `needs:` failed is skipped. A skipped job reports **success**. So the one required check goes green exactly when the tests are red. Always keep `if: always()` on the summary job, and test it once by breaking a test on purpose.
:::

## Release automation: numbered, tested, reproducible

An analyst running a dispersion study for a design review must be able to say which simulator produced the numbers, and someone must be able to rebuild it years later. A **release** is a named, frozen, tested version, with its files attached.

### Semantic versioning

Most projects number releases with **[[semantic versioning|semver-origin]]**: three numbers, **MAJOR.MINOR.PATCH**, such as `2.3.1`. Each number says what kind of change happened since the last release:

- **PATCH** goes up for bug fixes that break nothing: `2.3.1` to `2.3.2`.
- **MINOR** goes up for new features that break nothing: `2.3.1` to `2.4.0`. The patch number resets to 0.
- **MAJOR** goes up for changes that break something users depend on: `2.3.1` to `3.0.0`. Minor and patch reset.

A **pre-release** adds a dash and a label, such as `3.0.0-rc.1` ("release candidate 1"). It sorts before `3.0.0`. And versions compare number by number, not letter by letter: `1.10.0` comes after `1.9.0`, because 10 is more than 9, even though the text "1.1" sorts before "1.9".

::: example Bumping the simulator's version
The simulator is at `2.3.1`. Decide the next version for each of three changes, as if each were released alone.

1. **The drag model used the wrong air density above 80 km; now fixed.** A bug fix: PATCH, so `2.3.2`. (The release notes should also say which outputs change, and by how much.)
2. **A new optional output column, `mach_number`, is added at the end of the CSV.** Existing scripts that read the old columns still work: MINOR, so `2.4.0`.
3. **The output time column changes from seconds to milliseconds.** Every script that reads time now gets numbers a thousand times too big: MAJOR, so `3.0.0`.

If all three go out together, the biggest kind wins: `3.0.0`. Sanity check: the version number now warns an analyst, before she runs anything, that her plotting scripts need attention.
:::

### Tags start releases

In git, a release is marked by a **tag**: a name pinned to one commit. By convention the name is `v` plus the version. An **[[annotated tag|annotated-tags]]** also stores who made it, when, and a message:

```bash
git tag -a v1.4.0 -m "Simulator 1.4.0"
git push origin v1.4.0
```

Ordinary `git push` does not send tags, so the second line does. Later, `git describe --tags` names any commit relative to the nearest tag. Two commits after `v1.4.0` it printed:

```text
v1.4.0-2-g267df39
```

That reads "tag v1.4.0, plus 2 commits, at commit 267df39" (the `g` stands for git). And `git tag --list --sort=v:refname` sorts tags as versions, putting `v1.10.0` after `v1.9.0`.

### A workflow that runs on a tag

Pushing a tag is a `push` event, and `on: push:` can filter by tag name the same way it filters by branch:

```yaml
name: release
on:
  push:
    tags:
      - "v[0-9]+.[0-9]+.[0-9]+"
      - "v[0-9]+.[0-9]+.[0-9]+-rc.[0-9]+"
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: python -m pip install -r requirements-dev.txt
      - run: pytest -m "not quarantine" --strict-markers
  release:
    needs: test
    runs-on: ubuntu-24.04
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Check the tag matches the version in pyproject.toml
        run: |
          version=$(python -c 'import tomllib; print(tomllib.load(open("pyproject.toml", "rb"))["project"]["version"])')
          if [ "v$version" != "$GITHUB_REF_NAME" ]; then
            echo "tag $GITHUB_REF_NAME does not match version $version"
            exit 1
          fi
      - run: python -m pip install build
      - run: python -m build
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/*
          generate_release_notes: true
          prerelease: ${{ contains(github.ref_name, '-') }}
```

Read the new parts.

- **The tag patterns.** In a filter, `[0-9]` matches one digit and `+` means "one or more of the thing before". So `v[0-9]+.[0-9]+.[0-9]+` matches `v1.4.0` and `v2.10.3` but not `v1.4` or `nightly`. The second line also accepts release candidates such as `v3.0.0-rc.1`.
- **The tests run again** on the tagged commit, and `release` waits for them through `needs:`.
- **The version check.** `GITHUB_REF_NAME` holds the short name of the tag, such as `v1.4.0`. The script reads the version in `pyproject.toml` and fails if the two disagree: run on `v1.5.0` with version `1.4.0`, it printed `tag v1.5.0 does not match version 1.4.0` and exited 1. That stops the classic mistake of tagging without bumping the version.
- **`permissions: contents: write`**, only on the release job, because creating a release writes to the repository.
- **softprops/action-gh-release** creates a GitHub release for the tag, attaches the built files from `dist/`, and writes release notes from the merged pull requests. `prerelease:` is true when the tag contains a dash, so `v3.0.0-rc.1` is marked as a pre-release.

The GitHub command-line tool, `gh`, can do the last step instead, with no third-party action:

```yaml
      - name: Create the release with gh
        env:
          GH_TOKEN: ${{ github.token }}
        run: gh release create "$GITHUB_REF_NAME" dist/* --repo "$GITHUB_REPOSITORY" --verify-tag --generate-notes
```

`--verify-tag` refuses to run unless the tag already exists on GitHub, so it never creates a tag by accident. `gh` reads its access key from `GH_TOKEN`.

Finally, protect the tags themselves: a ruleset can target tags matching `v*` and restrict who may create, move or delete them. A release tag that can be moved is not a record of anything.

::: key Release automation
A release is started by pushing a version tag (`git tag -a v1.4.0`, `git push origin v1.4.0`). A workflow on `on: push: tags:` re-runs the tests, checks the tag against the version in the code, builds, and publishes with `softprops/action-gh-release` or `gh release create`, with `contents: write` only on that job. Versions follow semantic versioning, MAJOR.MINOR.PATCH.
:::

## Check yourself

::: check
A suite has 50 tests, each flaky with a 1% failure rate, independently. What fraction of pipeline runs are red with nothing wrong?
:::

::: answer
Each test passes with probability $0.99$. All 50 pass with probability $0.99^{50} \approx 0.605$. So a false red happens with probability $1 - 0.605 = 0.395$: about 40% of runs, even though each test on its own looks nearly perfect.
:::

::: check
A teammate proposes `pytest --reruns 2` for the whole suite "to stop the noise". A real bug in the new thread pool makes one test fail 40% of the time. With the reruns, how often does that test still report the bug? What do you propose instead?
:::

::: answer
With two reruns the test gets three attempts and reports a failure only if all three fail: $0.4^3 = 0.064$, so the bug shows up only about 6% of the time, down from 40%. Instead: keep retries off, quarantine each known flaky test with a marker, a ticket and an owner, run the quarantined tests in a non-blocking job, and fix the causes.
:::

::: check
The only required check on `main` is `test (ubuntu-22.04, 3.11)`. The team updates the matrix to `ubuntu-24.04` and Python 3.12. Now no pull request can merge. Why, and what is a durable fix?
:::

::: answer
Required checks are matched by name. The old name is never reported again, so GitHub waits for it forever. Add a summary job with a fixed name (for example `all-checks`) that `needs:` every other job, has `if: always()` and fails if any needed job failed or was cancelled. Make only that job required. Matrix changes no longer touch the required name.
:::

::: check
Someone pushes the tag `v2.1.0`, but forgot to change `version = "2.0.3"` in `pyproject.toml`. Walk through what the release workflow in this lesson does.
:::

::: answer
The tag matches the pattern `v[0-9]+.[0-9]+.[0-9]+`, so the workflow starts. The `test` job runs and passes. In `release`, the version check reads `2.0.3`, compares `v2.0.3` with `GITHUB_REF_NAME`, which is `v2.1.0`, prints that they do not match, and exits 1. The job stops before building or publishing, so no mislabeled release appears. The fix is to bump the version in a pull request, then delete and recreate the tag on the corrected commit (which the tag ruleset should allow only for release managers).
:::

## Summary

| Idea | What it means | Key fact or syntax |
| --- | --- | --- |
| Flaky test | Passes and fails on the same code | unseeded RNG, wall clock, shared temp file, order, marginal tolerance |
| Suite-level flakiness | Many small chances add up | $P(\text{false red}) = 1 - (1-p)^N$ |
| Retry-until-green | Hides real intermittent bugs | a 30% bug with 3 attempts goes green 97% of the time |
| Quarantine | Out of the gate, still running | marker + ticket + owner + expiry; `pytest -m "not quarantine"` |
| Proving a fix | Enough clean runs to trust it | $n \ge \ln 0.05 / \ln(1-p)$; 149 runs for a 2% flake |
| Branch protection | Rules GitHub enforces on `main` | PRs, approvals, required checks, up to date, no bypass |
| Summary job | One stable required check | `needs:` all jobs, `if: always()`, fail on failure or cancelled |
| Semantic versioning | What a version number promises | MAJOR.MINOR.PATCH; `1.10.0` after `1.9.0` |
| Release workflow | Tag to tested, published release | `on: push: tags:`, version check, `softprops/action-gh-release` or `gh release create` |

That completes the pipeline, from the first check on a pull request to a tested, numbered release. The next module, on debugging and profiling, starts where CI leaves off: CI tells you *that* something broke, and a debugger such as gdb, used with a scientific method, tells you *why*.

::: context flaky-word Why "flaky"
In everyday English, a flaky person says they will come and then does not, some of the time. Engineers borrowed the word for tests that behave the same way. Other names you may hear are "intermittent" and "non-deterministic" tests. All of them mean the result depends on something besides the code.
:::

::: context standard-error Why averaging shrinks the noise
Each reading is off by a random amount, some up, some down. When you add 100 of them, the ups and downs partly cancel. The sum's spread grows only like $\sqrt{100} = 10$ times one reading's spread, while the sum itself is 100 readings, so the average's spread is $10/100$ of one reading's: one tenth. In general, averaging $n$ independent readings divides the spread by $\sqrt{n}$. That is why the tolerance in a statistical test should be written in standard errors, not picked by feel.
:::

::: context independent-chances Why the chances multiply
If two coins are tossed separately, the chance that both land heads is $\frac{1}{2} \times \frac{1}{2} = \frac{1}{4}$. Independent events multiply. The chance that 30 flaky tests all pass is $0.98$ multiplied by itself 30 times. The curve below shows the chance of a false red as the number of 2% tests grows: it passes 50% at about 34 tests.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="345" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="105" x2="345" y2="105" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="34" y="184" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="34" y="109" font-size="11" text-anchor="end" fill="#1f2a44">50%</text>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">100%</text>
  <text x="40" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="190" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">50</text>
  <text x="340" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">100</text>
  <text x="190" y="208" font-size="11" text-anchor="middle" fill="#6c7a93">number of tests at 2%</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40,180.0 55,165.6 70,152.6 85,140.8 100,130.1 115,120.5 130,111.8 145,104.0 160,96.9 175,90.4 190,84.6 205,79.4 220,74.6 235,70.3 250,66.5 265,63.0 280,59.8 295,56.9 310,54.3 325,52.0 340,49.9"/>
  <circle cx="130" cy="111.8" r="4" fill="#b4232c"/>
  <text x="138" y="128" font-size="11" fill="#b4232c">30 tests: 45%</text>
  <circle cx="340" cy="49.9" r="4" fill="#b4232c"/>
  <text x="336" y="66" font-size="11" text-anchor="end" fill="#b4232c">100 tests: 87%</text>
</svg>
```
:::

::: context rerun-plugins Tools that retry for you
Plugins such as pytest-rerunfailures add an option like `--reruns 3`, and many CI systems have a retry setting for whole jobs. They exist because some failures really are outside the code, such as a package server that was briefly unreachable. Even then, a retry should be narrow (one download step, not the whole test suite), logged, and counted, so a rising retry rate is noticed. Retrying the tests themselves is the case this lesson warns against.
:::

::: context quarantine-word Forty days at anchor
The word comes from the Venetian Italian for "forty days": ships arriving in medieval ports during plague outbreaks were made to wait at anchor before anyone came ashore. The ship was not sunk and not ignored. It was kept apart and watched until it was known to be safe. A quarantined test gets the same treatment.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="200" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">gate job (required)</text>
  <text x="110" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">pytest -m "not quarantine"</text>
  <rect x="10" y="84" width="200" height="44" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="110" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">quarantine job</text>
  <text x="110" y="118" font-size="11" text-anchor="middle" fill="#1f2a44">pytest -m quarantine</text>
  <line x1="210" y1="42" x2="250" y2="42" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="250" y="26" width="100" height="32" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">blocks merge</text>
  <line x1="210" y1="106" x2="250" y2="106" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="250" y="90" width="100" height="32" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">report for</text>
  <text x="300" y="117" font-size="11" text-anchor="middle" fill="#1f2a44">ticket owner</text>
</svg>
```
:::

::: context rulesets Rules that stack
Rulesets are GitHub's newer way to write branch protection. One ruleset can target many branches or tags by pattern, such as `main` and `release/*`, and several rulesets can apply to the same branch at once; when they overlap, the strictest rule wins. A ruleset has an on/off enforcement setting and a bypass list naming who, if anyone, may skip it, and anyone with read access can see which rules apply. Classic branch protection rules still work, one per branch pattern.
:::

::: context codeowners Who must look at which files
A file named `CODEOWNERS`, usually in `.github/`, maps paths to people or teams, for example `/src/guidance/ @org/guidance-team`. When "require review from code owners" is on, a pull request that touches a path cannot merge until one of its owners approves. On a GNC team this puts the right expert in front of every change to a guidance law, filter or dynamics model.
:::

::: context merge-queue Testing changes in line
With "up to date" required, two pull requests that are both green must take turns: merge one, update the other, wait for its checks again. A merge queue automates that. Approved pull requests join a line; GitHub builds each one on top of the ones ahead of it and merges it only if the checks pass on that combination. Workflows that should run in the queue must listen for the `merge_group` event as well as `pull_request`.
:::

::: context all-green-job One name to require
The summary job gathers every result into one check whose name never changes. It must run even when its dependencies fail, which is what `if: always()` guarantees, and it must turn a failure below it into its own failure.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="110" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">lint: success</text>
  <rect x="10" y="60" width="110" height="30" rx="5" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="65" y="80" font-size="12" text-anchor="middle" fill="#b4232c">tests: failure</text>
  <rect x="10" y="110" width="110" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">regression:</text>
  <text x="65" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">success</text>
  <line x1="120" y1="25" x2="200" y2="68" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="75" x2="200" y2="75" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="120" y1="125" x2="200" y2="82" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="200" y="55" width="150" height="40" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">all-checks</text>
  <text x="275" y="87" font-size="11" text-anchor="middle" fill="#b4232c">always() runs: exit 1</text>
  <text x="275" y="118" font-size="11" text-anchor="middle" fill="#6c7a93">the only required check</text>
</svg>
```
:::

::: context semver-origin Where the rules come from
Semantic Versioning is a short public specification at semver.org, written by Tom Preston-Werner, a co-founder of GitHub. Its core rules are the three bumps in this lesson. It also says that versions starting with 0, such as `0.4.2`, are for early development, when anything may change at any time. The `v` in a tag like `v1.4.0` is a common convention, not part of the version itself.
:::

::: context annotated-tags Two kinds of tag
Git has lightweight tags, which are only a name pointing at a commit, and annotated tags, made with `-a`, which are stored as objects of their own with the tagger's name, a date and a message, and can be cryptographically signed. `git describe` uses only annotated tags unless you add `--tags`. For releases, annotated tags are the usual choice, because the record of who released what, and when, is part of the point.
:::
