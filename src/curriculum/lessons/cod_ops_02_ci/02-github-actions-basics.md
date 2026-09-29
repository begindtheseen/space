---
id: l02-github-actions-basics
title: 'GitHub Actions: your first pipeline'
minutes: 24
covers:
  - 'GitHub Actions: workflows, events, jobs, steps, runners'
---

Imagine you are going away for a week and a friend is looking after your house. You leave a card on the fridge. It says: "When the mail arrives, bring it in and sort it. Every evening at six, feed the cat, then water the plants. If the plants look dry, give them extra." The card names *when* something should happen, *what* the chores are, and the *order* of the steps inside each chore. Your friend does not need to phone you. The card is the whole plan.

**GitHub Actions** is GitHub's built-in CI service, and it runs on exactly that kind of card. You write a short file that says: when this happens to the repository (a push, a pull request, six o'clock in the morning), start these jobs, on this kind of machine, and inside each job do these steps in order. GitHub reads the card and does the chores, every time, without being asked.

The last lesson argued *why* a simulation team needs CI. This one builds the first real pipeline for a small Python orbit simulator: a lint check and the unit tests, running on every pull request. By the end you will be able to read any workflow file line by line and say what each line does.

## Where the file lives, and the YAML it is written in

The card is a **workflow**: one automated process, described in one file. Workflow files live in a folder with a fixed name at the top of the repository:

```text
orbitsim/
├── .github/
│   └── workflows/
│       └── ci.yml
├── requirements-dev.txt
├── pyproject.toml
├── src/orbitsim/propagate.py
└── tests/test_propagate.py
```

GitHub looks in `.github/workflows/` and nowhere else. Any file there ending in `.yml` or `.yaml` is a workflow. A repository can have many, for example `ci.yml` for pull requests and `nightly.yml` for a long overnight run.

The files are written in **[[YAML|yaml-name]]**, a plain-text format for nested settings. You only need four rules to read it:

- `key: value` sets a setting. The space after the colon is required.
- Indentation shows what belongs inside what. Two spaces per level is the habit. Tabs are not allowed at all.
- A line starting with `- ` (dash, space) is one item of a list.
- Text can be written bare (`ubuntu-24.04`) or in quotes (`"3.12"`). Quotes matter when a value looks like a number but must stay text, as lesson 3 shows.

::: warning Indentation is meaning
In YAML, moving a line two spaces left or right moves it into a different block. A step indented one level too little silently stops being a step. When a workflow does something strange, check the indentation first, and never let your editor insert a tab.
:::

## Anatomy of a workflow

Here is the whole first workflow. It checks the simulator's style with **ruff** (a fast Python linter), then runs its tests with pytest.

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-python@v7
        with:
          python-version: "3.12"
      - name: Install tools
        run: python -m pip install -r requirements-dev.txt
      - name: Lint
        run: ruff check src tests

  test:
    needs: lint
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-python@v7
        with:
          python-version: "3.12"
      - name: Install tools
        run: python -m pip install -r requirements-dev.txt
      - name: Unit tests
        run: pytest -q
```

Read it from the top. There are four levels of structure, from biggest to smallest.

- **`name: CI`** is the label GitHub shows in its Actions tab and on pull requests.
- **`on:`** lists the **events** that start the workflow. An event is something that happens to the repository: code pushed, a pull request opened, a button pressed. (One oddity: a general-purpose YAML reader may mistake this key for the word [[true|on-becomes-true]].)
- **`permissions:`** limits what the workflow's automatic access key may do. `contents: read` means "read the code, change nothing". More on this below.
- **`jobs:`** holds the **jobs**. Each job has a name you choose (`lint`, `test`) and runs on its own fresh machine.
- **`runs-on:`** picks the **runner**: the kind of machine the job runs on. `ubuntu-24.04` is a Linux virtual machine that GitHub provides.
- **`steps:`** is the list of **steps** inside a job, run one after another, top to bottom, on that one machine.

A step is one of two kinds:

- **`run:`** runs shell commands, exactly as you would type them in a terminal.
- **`uses:`** runs an **action**: a ready-made, reusable step that someone packaged and published, often in its own GitHub repository. `actions/checkout@v7` is the action that copies your repository onto the runner. `actions/setup-python@v7` installs the Python version you ask for. The part after `@` is **[[the version you pin|pinning-actions]]**, so the action does not change under you. Settings for an action go under **`with:`**.

A step may also have a `name:`, which is what the log shows. Without one, GitHub makes up a name from the command.

::: key The shape of every workflow
A **workflow** file in `.github/workflows/` is started by **events** (`on:`). It contains **jobs**; each job runs on a fresh **runner** (`runs-on:`) and is a list of **steps**. A step either runs shell commands (`run:`) or calls a packaged **action** (`uses:`, with inputs under `with:`).
:::

::: example Your first workflow, checked by running its commands locally
A good habit: before pushing a workflow, run its `run:` commands on your own machine, from the repository's top folder. If they fail there, they will fail on the runner too.

The tools are pinned in `requirements-dev.txt`, so the runner installs exactly the versions you tested with:

```text
pytest==9.0.2
ruff==0.15.8
```

Now pretend a leftover `import math` sits unused at line 2 of the propagator. Run the lint command (its output is trimmed a little below), then ask the shell for its **[[exit code|exit-codes]]** with `echo $?` (read "echo dollar question mark": print the exit code of the last command):

```text
$ ruff check src tests
F401 [*] `math` imported but unused
 --> src/orbitsim/propagate.py:2:8
  |
1 | """Tiny two-body propagator: fixed-step RK4."""
2 | import math
  |        ^^^^
  |
help: Remove unused import: `math`

Found 1 error.
[*] 1 fixable with the `--fix` option.
$ echo $?
1
```

Exit code 1 means "failed". On the runner, that one number is what turns the Lint step red, which fails the `lint` job. Because `test` says `needs: lint`, the `test` job is then skipped, and the pull request shows a red cross.

Remove the import and try again:

```text
$ ruff check src tests
All checks passed!
$ echo $?
0
$ pytest -q
..                                                                       [100%]
2 passed in 0.05s
$ echo $?
0
```

Both commands exit with 0, "success". On the runner both jobs would go green. (Run with ruff 0.15.8 and pytest 9.0.2 on Python 3.11.)
:::

## Events: what starts a workflow

The `on:` block is the "when" of the fridge card. The four events you will use most:

- **`push`**: someone pushed commits. Add `branches: [main]` to react only to pushes to `main`, which includes every merged pull request.
- **`pull_request`**: a pull request was opened, got new commits, or was reopened. This is the event that puts checks on a pull request.
- **`workflow_dispatch`**: a "Run workflow" button appears in the Actions tab, so a person can start it by hand. Handy for re-running a long simulation on demand.
- **`schedule`**: run on a timetable, written as a **[[cron expression|cron-fields]]**. Lesson 6 uses it for a nightly Monte Carlo run.

Here is a schedule, for reference. Times in `cron` are always in UTC:

```yaml
on:
  schedule:
    - cron: "30 2 * * *"   # every day at 02:30 UTC
```

Events can be narrowed with filters. `branches:` limits which branches count. `paths:` limits which files count, so a change that only touches documentation can skip the heavy simulation workflow:

```yaml
on:
  pull_request:
    paths:
      - "src/**"
      - "tests/**"
```

`**` (read "star star") matches any number of folders, so `src/**` means "anything anywhere under `src`".

One detail of `pull_request` matters a great deal, and it connects straight back to the semantic merge conflicts of the last lesson. On a pull request, GitHub does not test your branch exactly as it sits. It tests a **[[merge commit|merge-ref]]** that it prepares behind the scenes: your branch merged into the current target branch. So the check answers the question you really care about — "will `main` still work after this merges?" — and not only "does my branch work on its own?"

::: example Which runs start?
Take the workflow above, with `pull_request`, `push` to `main`, and `workflow_dispatch`. Walk through one afternoon.

1. You push a new branch `fix-drag-units`. No pull request exists yet, and the branch is not `main`. The `push` filter does not match, and `pull_request` has nothing to react to. **No run.**
2. You open a pull request from `fix-drag-units` into `main`. The `pull_request` event fires. **One run**, testing the prepared merge of your branch into `main`.
3. A reviewer asks for a change. You push one more commit to `fix-drag-units`. The pull request got new commits, so `pull_request` fires again. **One run.** The old result is replaced by the new one on the pull request.
4. The pull request is approved and merged. Merging adds a commit to `main`, which is a push to `main`. **One run**, on `main` itself.
5. Later, a teammate presses "Run workflow" in the Actions tab. **One run**, from `workflow_dispatch`.

Total: four runs. Sanity check: every run matched one listed event and its filter, and the one push that matched nothing (step 1) started nothing.
:::

## Jobs: separate machines, running side by side

Each job gets its own fresh runner. That has two consequences you must remember.

First, **jobs run at the same time by default**. If a workflow has three jobs and nothing links them, all three start together. That is good for speed.

Second, **jobs share nothing**. Files created in one job are gone when that job's machine is thrown away. That is why each job above starts with its own `actions/checkout` and its own Python setup. When one job must hand a file to another — a built program, a test report — it uploads it as an artifact, which lesson 3 covers.

To make one job wait for another, write **`needs:`**. `needs: lint` means "start `test` only after `lint` has finished successfully". If `lint` fails, `test` is skipped. `needs:` can also take a list, `needs: [lint, build]`, to wait for several.

The jobs and their `needs:` links form a **job graph**: boxes for jobs, arrows for "must finish first". GitHub draws it for every run.

::: example How long does the pipeline take?
Suppose a pipeline has four jobs with these typical durations:

| Job | Minutes | `needs:` |
| --- | --- | --- |
| lint | 1 | — |
| unit | 4 | lint |
| regression | 6 | lint |
| docs | 2 | — |

If everything ran one after another, the total would be $1 + 4 + 6 + 2 = 13$ minutes.

With the graph, `lint` and `docs` start together at minute 0. `docs` is done at minute 2. `lint` is done at minute 1, and then `unit` and `regression` both start. `unit` is done at minute $1 + 4 = 5$ and `regression` at minute $1 + 6 = 7$.

The pipeline finishes when its last job does: minute 7. The longest chain of arrows, lint then regression, sets the time; this chain is called the **[[critical path|critical-path]]**. Speeding up `docs` would change nothing. Speeding up `regression` would.

Sanity check: 7 minutes is shorter than 13, as parallel running should be, and it is not shorter than the longest single chain ($1 + 6 = 7$), which no amount of parallel running can beat.
:::

::: warning Put the cheap check first, but do not over-chain
Making every job `needs:` the one before turns the graph into a single line and throws away the parallel speed. Chain a job only when it really depends on another, or when a fast check (like lint) should stop a slow, costly one from running pointlessly.
:::

## Steps: commands, actions and exit codes

Inside one job, steps run strictly in order on the same machine, so a file made by step 2 is there for step 3.

A step passes when its command finishes with exit code 0. Any other exit code fails the step. Then:

- the rest of the job's steps are skipped,
- the job is marked failed,
- any job that `needs:` it is skipped,
- and the run is red.

This is why CI works with tools you already know. `pytest`, `ruff`, `mypy`, `g++` and `cargo test` all follow the same convention: 0 for success, non-zero for failure. CI needs no special plug-in to understand them.

On a Linux runner, a multi-line `run:` block is run by bash, which stops at the first failing command. A `|` after `run:` starts a block where each line is kept as its own line:

```yaml
      - name: Build and run a smoke test
        run: |
          python -m pip install -r requirements-dev.txt
          python -c "import orbitsim.propagate"
          pytest -q tests/test_propagate.py::test_output_is_finite
```

Sometimes a step must run *even though* an earlier one failed, for example to save a log you need for debugging. The `if:` setting controls that:

- `if: failure()` runs the step only when something earlier failed.
- `if: always()` runs it whether or not anything failed.

```yaml
      - name: Show the simulator log after a failure
        if: failure()
        run: cat sim.log
```

## Runners: where the steps run

A **GitHub-hosted runner** is a virtual machine that GitHub starts for your job and **[[throws away afterwards|runner-lifecycle]]**. You name the kind you want in `runs-on:`:

- `ubuntu-24.04`, `ubuntu-latest` — Linux,
- `windows-latest` — Windows,
- `macos-latest` — macOS.

`ubuntu-latest` moves to a newer Ubuntu when GitHub decides to switch it. `ubuntu-24.04` stays put until that image is retired. For simulation code, where a new compiler or library can shift numbers, the pinned name makes the environment change a deliberate commit rather than a surprise.

The hosted images come with a lot preinstalled: git, compilers such as gcc and clang on Linux, Docker, several Python versions. Still, name every tool your job depends on with a setup step or a pinned requirements file. The image is a convenience, not a contract.

If you already package the simulator's environment as a Docker image, a job can run all its steps inside that container:

```yaml
jobs:
  test-in-image:
    runs-on: ubuntu-24.04
    container: python:3.12-slim
    steps:
      - uses: actions/checkout@v7
      - run: python --version
```

The runner is still the Ubuntu machine, but every step runs inside `python:3.12-slim`. Point `container:` at your own simulator image, and CI tests in the same environment you ship.

Some jobs cannot run on a machine GitHub owns: a MATLAB license behind a company firewall, a hardware-in-the-loop rig in a lab. For those, you connect your own computer as a **self-hosted runner**. Lesson 4 covers when and how.

A job that hangs — a simulation stuck in an endless loop — would keep a runner busy for a long time. The default limit is 360 minutes. Set your own with `timeout-minutes: 20` on the job, a little above its normal time, so a hang fails fast.

::: key Runners
A GitHub-hosted runner is a fresh virtual machine per job (`ubuntu-24.04`, `windows-latest`, `macos-latest`), discarded when the job ends. `container:` runs the job's steps inside a Docker image. A self-hosted runner is your own machine, for licenses and hardware the hosted ones cannot reach.
:::

## Expressions, contexts and the automatic token

Anything between `${{` and `}}` is an **expression**: GitHub works it out before the step runs. Expressions read from **contexts**, which are bundles of facts about the run:

- `github.event_name` — which event started this run, such as `pull_request`,
- `github.sha` — the commit being tested,
- `github.ref` — the branch or tag, for example `refs/heads/main`,
- `runner.os` — `Linux`, `Windows` or `macOS`.

```yaml
      - name: Say what is being tested
        run: echo "event=${{ github.event_name }} commit=${{ github.sha }} on ${{ runner.os }}"
      - name: Only on main
        if: github.ref == 'refs/heads/main'
        run: echo "this run is on main"
```

In an `if:` you may leave off the `${{ }}`; GitHub adds it for you. Lesson 3 adds two more contexts, `matrix` and `secrets`.

Every run also gets an automatic access key called **`GITHUB_TOKEN`**, which lets steps talk to GitHub (post a comment, read the code). The `permissions:` block at the top of the workflow limits what that key may do. Start from `contents: read` and grant more only to the job that needs it. A workflow that runs other people's code — every pull request does — should hold as little power as possible.

## Seeing the result

When a run finishes, the result shows up in three places:

- **On the pull request**, each job appears as a check with a green tick or red cross, and a link to its log.
- **In the Actions tab** of the repository, every run is listed with its job graph. Click a job to see each step's output, folded per step, with the failing one opened.
- **On the commit** in the history, a small tick or cross.

A failed run can be re-run from the Actions tab, either whole or only its failed jobs. Treat that button with care: rerunning until a check turns green hides the very failures you built CI to catch. Lesson 8 is about exactly that.

Because the workflow file lives in the repository, a pull request that edits `ci.yml` is itself tested with the edited version. You see the effect of a pipeline change before it reaches `main`, and a reviewer sees the change in the diff. That is pipeline as code, from the last lesson, working for you.

## Check yourself

::: check
Name the four levels of structure in a workflow file, from the whole file down to a single command, and say what `runs-on:` belongs to.
:::

::: answer
Workflow (the whole file, started by events in `on:`) contains jobs; each job contains steps; a step either runs commands (`run:`) or calls an action (`uses:`). `runs-on:` belongs to a job: it picks the runner machine that the job's steps all run on.
:::

::: check
Job `build` compiles the simulator into `build/sim`. Job `regress` runs `./build/sim` and has `needs: build`. The `regress` job fails with "No such file or directory". Why, if `build` succeeded?
:::

::: answer
Each job runs on its own fresh runner and they share no files. `needs: build` only makes `regress` wait for `build` to finish; it does not copy `build/sim` across. The fix is to have `build` upload the program as an artifact and `regress` download it (lesson 3), or to build inside the `regress` job.
:::

::: check
A workflow has `on: push: branches: [main]` and nothing else. You open a pull request from a feature branch. Will a check appear on it? What would you change?
:::

::: answer
No. The only event is a push to `main`, and neither pushing a feature branch nor opening a pull request is that. Add `pull_request:` under `on:` so the workflow runs for pull requests and posts its checks there.
:::

::: check
A step runs `pytest -q`. One test fails. Trace what happens to the following steps in that job, to a job with `needs:` on it, and to a later step marked `if: always()` in the same job.
:::

::: answer
pytest exits with a non-zero code, so the step fails. Later ordinary steps in the job are skipped and the job is marked failed. A job that `needs:` it is skipped. A step with `if: always()` still runs, because `always()` is true whether or not something failed — which is why log-saving steps use it.
:::

::: check
Jobs: `lint` (2 min), `build` (5 min, needs lint), `test` (3 min, needs build), `docs` (4 min, no needs). How long does the run take, and which jobs are on the critical path?
:::

::: answer
`lint` and `docs` start at 0. `lint` ends at 2, `build` runs 2 to 7, `test` runs 7 to 10. `docs` ends at 4. The run ends at minute 10, set by the chain lint, build, test ($2 + 5 + 3 = 10$). `docs` is off the critical path.
:::

## Summary

| Piece | What it is | Written as |
| --- | --- | --- |
| Workflow | One automated process, one file | `.github/workflows/ci.yml` |
| Event | What starts it | `on:` with `push`, `pull_request`, `workflow_dispatch`, `schedule` |
| Job | Steps on one fresh machine; parallel by default | `jobs:`, ordered with `needs:` |
| Step | One command or one action | `run:` or `uses:` with `with:` |
| Runner | The machine | `runs-on: ubuntu-24.04`, or `container:` for a Docker image |
| Pass or fail | The command's exit code | 0 passes, anything else fails |
| Expression | Worked out by GitHub before the step | `${{ github.sha }}`, `if: failure()` |

Next you make one job fan out across several operating systems and Python versions, make it fast with caches, keep its results as artifacts, and give it secrets safely.

::: context yaml-name A name that is a joke about itself
YAML stands for "YAML Ain't Markup Language": the name contains itself, a kind of joke programmers enjoy. It is used for configuration all over the software world, from Docker Compose to Kubernetes, because people can read it without special tools. JSON is a close cousin; almost any JSON document is also valid YAML.
:::

::: context on-becomes-true Why some tools read on as true
Older YAML rules (version 1.1) treat bare words like `on`, `off`, `yes` and `no` as true and false. So a general-purpose loader can read the key `on:` as the value true. Python's PyYAML does exactly that with a workflow file:

```text
>>> yaml.safe_load(open("ci.yml")).keys()
dict_keys(['name', True, 'permissions', 'jobs'])
```

GitHub's own reader treats `on` as a key, so the workflow works. But if you write a script that inspects workflow files, look for `True` as well as `"on"`.
:::

::: context pinning-actions What the at-sign pins
An action is code from someone else's repository, and `@v7` names a tag in it. Tags like `v7` are moved by the action's authors to the newest v7 release, so you get fixes but not breaking changes. Teams that want certainty pin the full 40-character commit hash instead, because a hash can never be moved, not even by someone who breaks into the author's account.
:::

::: context exit-codes Zero means all is well
Every program that finishes hands the operating system a small whole number, its exit code. By a convention that goes back to early Unix, 0 means success and anything from 1 to 255 means some kind of failure; the program chooses which. pytest, for example, uses 1 for "some tests failed" and other numbers for "no tests were collected" or "you misused the command line".
:::

::: context cron-fields Five fields, one timetable
cron is the classic Unix scheduler, and its timetable is five fields separated by spaces. A star means "every". GitHub reads these in UTC, runs them on the default branch, and may start a scheduled run a little late when it is busy.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="22" fill="#1f2a44" text-anchor="middle" font-weight="700">
    <text x="60" y="34">30</text><text x="120" y="34">2</text><text x="180" y="34">*</text><text x="240" y="34">*</text><text x="300" y="34">*</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="60" y1="44" x2="60" y2="66"/><line x1="120" y1="44" x2="120" y2="66"/>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="180" y1="44" x2="180" y2="66"/><line x1="240" y1="44" x2="240" y2="66"/><line x1="300" y1="44" x2="300" y2="66"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="82">minute</text>
    <text x="120" y="82">hour</text>
    <text x="180" y="82">day of</text><text x="180" y="96">month</text>
    <text x="240" y="82">month</text>
    <text x="300" y="82">day of</text><text x="300" y="96">week</text>
  </g>
  <text x="180" y="122" font-size="12" text-anchor="middle" fill="#1d6fd1">every day at 02:30 UTC</text>
</svg>
```
:::

::: context merge-ref The merge GitHub prepares for you
For every open pull request, GitHub keeps a hidden branch, `refs/pull/<number>/merge`, holding a trial merge of the pull request into its target. The `pull_request` event checks out that trial merge. If the pull request has a real merge conflict, no trial merge can be made, and the workflow does not run until you resolve it.
:::

::: context critical-path The longest chain decides
The term comes from project planning: in any set of tasks with "must finish first" arrows, the longest chain sets the finish time. The same idea schedules the building of a launch pad or the checkout of a satellite before launch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="70" height="30" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">lint 1</text>
  <rect x="140" y="10" width="80" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">unit 4</text>
  <rect x="140" y="52" width="100" height="30" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">regression 6</text>
  <rect x="10" y="100" width="70" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">docs 2</text>
  <line x1="80" y1="40" x2="138" y2="27" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="50" x2="138" y2="66" stroke="#b4232c" stroke-width="2.5"/>
  <text x="300" y="60" font-size="12" text-anchor="middle" fill="#b4232c">critical path:</text>
  <text x="300" y="76" font-size="12" text-anchor="middle" fill="#b4232c">1 + 6 = 7 min</text>
  <text x="200" y="120" font-size="11" fill="#6c7a93">orange: on the critical path</text>
</svg>
```
:::

::: context runner-lifecycle Born clean, used once
Each hosted job lives through the same short life: a new virtual machine boots from a standard image, your steps run, the logs are saved, and the machine is deleted. Nothing leaks from one job to the next, which is exactly the clean room that "it works on my machine" needs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="8" y="30" width="72" height="36" rx="6" fill="#8fb8f0"/>
    <rect x="98" y="30" width="72" height="36" rx="6" fill="#fff"/>
    <rect x="188" y="30" width="72" height="36" rx="6" fill="#fff"/>
    <rect x="278" y="30" width="72" height="36" rx="6" fill="#f2b880"/>
    <line x1="80" y1="48" x2="96" y2="48"/><line x1="170" y1="48" x2="186" y2="48"/><line x1="260" y1="48" x2="276" y2="48"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="44" y="52">fresh VM</text><text x="134" y="52">your steps</text><text x="224" y="52">logs saved</text><text x="314" y="52">VM deleted</text>
  </g>
  <text x="180" y="88" font-size="11" text-anchor="middle" fill="#6c7a93">the next job starts again from a fresh VM</text>
</svg>
```
:::
