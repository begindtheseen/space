---
id: l04-reuse-runners-and-other-ci-systems
title: Reusing pipelines, choosing runners, and other CI systems
minutes: 24
covers:
  - Reusable workflows and composite actions
  - Self-hosted runners for licensed tools and special hardware
  - GitLab CI and Jenkins, still common in defence and aerospace
---

Think of a kitchen that cooks for five schools. Every dish starts the same way: wash hands, preheat the oven, set out the trays. If each recipe card repeats those steps, a new health rule means fixing fifty cards. So the kitchen keeps a binder: the "getting started" page is written once, and every recipe says "do that page first". Sometimes the whole week's menu is shared too, and each school only changes the dessert.

Some dishes need equipment only one kitchen has, like a big bread oven, so they are cooked there. And kitchens in another town keep their recipes in a different kind of binder, even though the cooking is the same.

This lesson is about the same three things in CI. First, how to write a set of steps once and reuse it everywhere: **composite actions** and **reusable workflows** in GitHub Actions. Second, how to run a job on a machine you own, because it needs a license, special hardware or data that must not leave the building: **self-hosted runners**. Third, two other CI systems you will meet on many aerospace and defense teams: **GitLab CI** and **Jenkins**. Their files look different, but you will find every idea from lessons 2 and 3 inside them.

## Why copy-pasted pipelines go stale

A GNC group rarely has one repository. There may be a guidance library, a navigation filter, a simulator and a few analysis tools, and each needs roughly the same CI: check out, install the pinned Python and dependencies, lint, test.

The first workflow gets written with care. The next four get copied from it. A year later they have drifted apart. One still installs Python 3.10. One forgot the lockfile. One runs the linter with different settings. Nobody decided this. Five copies have to be fixed five times, and nobody fixes all five.

Programmers have a name for the rule this breaks: **[[DRY|dry-rule]]**, "don't repeat yourself". Every piece of knowledge should live in one place. For CI, that means the setup steps and the standard test pipeline should each be written once, and every repository should point at them.

GitHub Actions gives you two tools for this, at two sizes:

- A **composite action** packages a few **steps**. You drop it into any job, like the "getting started" page in the recipe binder.
- A **reusable workflow** packages whole **jobs**. A repository calls it in place of writing its own jobs, like the district's weekly menu.

## Composite actions: a few steps, written once

You have already used actions written by others, such as `actions/checkout`. A composite action is one you write yourself, out of ordinary steps. It lives in its own folder, in a file named `action.yml` (or `action.yaml`). The folder can sit inside the repository that uses it, or in a separate repository that many projects share.

The file has three parts. `name` and `description` say what it is. `inputs` lists the values a caller can pass in. And `runs` says how to run it. The line `using: composite` marks it as a composite action: a list of steps that GitHub pastes into the calling job.

::: example A setup action for the simulator
This file is `.github/actions/setup-sim/action.yml`. It installs Python, then the simulator's pinned dependencies, then the simulator itself:

```yaml
name: Set up the simulator
description: Install Python, the simulator's pinned dependencies, and the package itself.
inputs:
  python-version:
    description: Python version to install
    required: false
    default: "3.12"
runs:
  using: composite
  steps:
    - uses: actions/setup-python@v7
      with:
        python-version: ${{ inputs.python-version }}
        cache: pip
    - name: Install pinned dependencies
      shell: bash
      run: |
        python -m pip install -r requirements.lock
        python -m pip install --no-deps -e .
```

Read it line by line:

- `inputs:` declares one input, `python-version`, with a default of `"3.12"`. Inside the action you read it as `${{ inputs.python-version }}` (say "inputs dot python-version").
- The first step uses another action, `actions/setup-python`. A composite action may call other actions.
- The second step runs shell commands. Notice `shell: bash`: in a composite action, every `run:` step must name its shell. A normal workflow has a default, so this line may be new to you.

Now any workflow in this repository can use it in one line, after checking out the code:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
      - uses: ./.github/actions/setup-sim
        with:
          python-version: "3.12"
      - run: pytest -q

  lint:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
      - uses: ./.github/actions/setup-sim
      - run: ruff check .
```

The `./` means "a folder in this repository", so checkout must come first: until then, the folder is not on the runner. The `lint` job passes no `with:`, so it gets the default Python. Both files pass `actionlint` 1.7.12, a checker for workflow files. Change the install command once, and both jobs follow.
:::

::: warning Two easy slips with composite actions
Leave out `shell: bash` on a `run:` step and the action fails to load, with an error saying `shell` is required. And a local action (`./...`) can only be found after `actions/checkout`, so a job that calls it as its first step fails with an error that it can't find `action.yml`, and a hint asking whether you forgot to run `actions/checkout`.
:::

The `@v7` in these files is a **[[version tag|version-pinning]]**. Lessons 2 and 3 used older tags of the same actions; both work, and a team upgrades on purpose, the way it pins a Python version.

## Reusable workflows: whole jobs, called like a function

Often you want to share more than steps: the whole standard pipeline, with its jobs, their order and their runners. For that you write a reusable workflow. A reusable workflow is an ordinary workflow file in `.github/workflows/`, with one special event: `workflow_call`. That event means "this workflow runs when another workflow calls it". Under it you declare `inputs`, each with a `type` (`string`, `number` or `boolean`), and any `secrets` the caller must hand over.

::: example One test pipeline for every GNC repository
The tools team keeps this file in a shared repository, `orbit-gnc/ci-templates`, as `.github/workflows/sim-tests.yml`:

```yaml
name: Simulation tests (reusable)
on:
  workflow_call:
    inputs:
      python-version:
        type: string
        default: "3.12"
      regression-cases:
        type: number
        default: 20
    secrets:
      EPHEMERIS_TOKEN:
        required: false

jobs:
  unit:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-python@v7
        with:
          python-version: ${{ inputs.python-version }}
      - run: python -m pip install -r requirements.lock
      - run: pytest -q tests/unit

  regression:
    needs: unit
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-python@v7
        with:
          python-version: ${{ inputs.python-version }}
      - run: python -m pip install -r requirements.lock
      - name: Regression sims against golden files
        env:
          EPHEMERIS_TOKEN: ${{ secrets.EPHEMERIS_TOKEN }}
          CASES: ${{ inputs.regression-cases }}
        run: pytest -q tests/regression
```

Each project's own CI file shrinks to this:

```yaml
name: CI
on:
  pull_request:

jobs:
  sim:
    uses: orbit-gnc/ci-templates/.github/workflows/sim-tests.yml@v2
    with:
      python-version: "3.12"
      regression-cases: 50
    secrets: inherit
```

Walk through the caller:

1. The job `sim` has no `runs-on` and no `steps`. Instead it has `uses:` pointing at the other workflow: owner, repository, path to the file, then `@v2`, the tag of the shared repository to use.
2. `with:` passes the inputs. This project wants 50 regression cases instead of the default 20.
3. `secrets: inherit` hands the caller's secrets to the called workflow (this works when both repositories belong to the same organization or enterprise), so `secrets.EPHEMERIS_TOKEN` works inside it. You can instead list them one by one under `secrets:`, which is tighter: the called workflow then sees only what you name.

`checkout` in the called workflow checks out the *caller's* code, because the run belongs to the caller. The shared repository supplies the recipe; each project supplies the ingredients.
:::

Pinning `@v2` matters. When the tools team changes the shared pipeline, projects move to the new version by editing one tag, in a reviewed pull request. If every project pointed at `@main`, one bad commit in the shared repository would break every project's CI at once.

| | Composite action | Reusable workflow |
| --- | --- | --- |
| Packages | Steps | Whole jobs |
| File | `action.yml` in its own folder | A workflow in `.github/workflows/` with `on: workflow_call` |
| Called from | A step: `- uses: ./path` | A job: `jobname: uses: owner/repo/.github/workflows/file.yml@ref` |
| Chooses the runner | No, runs inside the caller's job | Yes, each of its jobs has `runs-on` |
| Good for | Shared setup: install, cache, configure | A team's standard pipeline |

::: key Composite action or reusable workflow?
A composite action (`runs: using: composite`) bundles steps, and every `run:` step in it needs a `shell:`. A reusable workflow (`on: workflow_call`) bundles jobs, is called at the job level with `uses:`, takes typed `inputs`, and receives secrets explicitly or with `secrets: inherit`. Pin both to a tag.
:::

::: warning A reusable workflow is not a step
You cannot call a reusable workflow in the middle of a job's steps. A job either has `steps:` or it `uses:` a reusable workflow, never both. If you want a few steps inside your own job, you want a composite action instead.
:::

## Self-hosted runners: your own machine, doing CI work

Every job so far ran on a **GitHub-hosted runner**: a fresh virtual machine made for one job and then deleted. That is the right default: clean every time, no upkeep, no state leaking between jobs.

But some jobs need something that virtual machine cannot have. These are the real reasons:

- **A license on a private network.** MATLAB and Simulink, many commercial solvers, and some compilers for flight processors check out a license from a **license server** inside the company. A machine in GitHub's data centre cannot reach it.
- **Special hardware.** A **[[hardware-in-the-loop|hil-rig]]** rig connects the real flight computer to a simulator that pretends to be the rest of the vehicle. The flight computer is on a bench in a lab. Tests that need it must run on the computer wired to it.
- **GPUs**, or other hardware the hosted machines do not offer for your plan.
- **Controlled data.** Some data may not leave managed company infrastructure at all, for example technical data covered by **[[export control|export-control]]** rules.

For these, you install GitHub's runner program on your own machine and register it with your repository or organization. It is then a **self-hosted runner**.

::: key When do you need a self-hosted CI runner?
When the job needs something the hosted runner cannot have: a MATLAB or Simulink licence reachable on a private network, specialised hardware for hardware-in-the-loop, GPUs, or data under export control.
:::

Notice what is not on that list: convenience, or getting around the rules. Who may merge, and which checks must pass first, is set by **branch protection** (this module's last lesson). The runner only decides *where* a job runs; it has no say in review.

### Setting one up

On the repository's settings page, under Actions and then Runners, GitHub shows the commands for a new self-hosted runner, with a one-time registration token. After downloading the runner program, you register and start it:

```bash
./config.sh --url https://github.com/orbit-gnc/flight-sw --token <TOKEN> --labels hil-rig
./run.sh
```

`--labels hil-rig` attaches a **label**, a name tag, to this runner. The runner also gets the automatic labels `self-hosted`, plus its operating system and processor type, such as `linux` and `x64`. A job picks a runner by listing labels, and it runs only on a runner that has all of them:

```yaml
name: Hardware in the loop
on:
  push:
    branches: [main]

jobs:
  hil:
    runs-on: [self-hosted, linux, hil-rig]
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v7
      - name: Flash the flight computer and run the closed-loop tests
        run: ./scripts/run_hil.sh --suite smoke
```

Nothing has to be opened in the lab's firewall for this to work. The runner program [[calls out to GitHub|runner-polling]] and asks for work, rather than GitHub calling in.

### What you take on

A self-hosted runner gives you access, and hands you jobs that GitHub used to do for you:

- **It is not clean.** The machine keeps its files between jobs unless you clean up. A leftover build folder or a changed setting can make the next job pass or fail for reasons that have nothing to do with the code. Registering with `--ephemeral` makes the runner take one job and then remove itself, so each job can start from a freshly prepared machine.
- **You maintain it.** System updates, disk space, and the runner program's own updates are now your job.
- **It runs whatever code the job contains.** Anyone who can make a workflow run on it can run commands on that machine, inside your network. GitHub's own advice is to use self-hosted runners only with private repositories, because on a public repository a stranger's fork could open a pull request that runs code on your hardware.
- **It is shared.** One rig runs one job at a time, so run the hardware job where it counts, such as on merges to `main`.

::: warning A self-hosted runner is a door into your network
Treat it like a server that runs strangers' code, because it can. Keep it off public repositories, give it the smallest set of network permissions and secrets it needs, and prefer ephemeral runners so one job cannot leave something behind for the next.
:::

## GitLab CI: the same ideas in one file

GitLab is a code-hosting platform like GitHub, with its own CI built in. One reason it is common in defense and aerospace is that a company can install and run GitLab entirely on its own servers, including on networks with no internet connection at all. Code, runners and logs then never leave the building.

GitLab's pipeline lives in one file at the root of the repository: `.gitlab-ci.yml`. It is YAML, like a GitHub workflow, but the shape is different. There is no `jobs:` key. Every top-level key that is not a reserved word is a job.

::: example The GitHub pipeline, rewritten for GitLab
```yaml
include:
  - project: gnc/ci-templates
    ref: v2
    file: /templates/python-sim.yml

stages: [lint, test, hardware]

default:
  image: python:3.12-slim

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

lint:
  stage: lint
  script:
    - pip install ruff
    - ruff check .

unit-tests:
  stage: test
  extends: .sim-setup
  script:
    - pytest -q --junitxml=report.xml
  artifacts:
    when: always
    reports:
      junit: report.xml

hil:
  stage: hardware
  tags: [hil-rig]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  script:
    - ./scripts/run_hil.sh --suite smoke
```

And the shared template, `/templates/python-sim.yml` in the `gnc/ci-templates` project:

```yaml
.sim-setup:
  before_script:
    - pip install -r requirements.lock
```

Match each piece to what you know:

- `stages:` lists the stages in order. Every `lint` job must pass before any `test` job starts, much like `needs:`.
- `default: image:` runs each job inside a Docker image, like `container:`. GitLab checks out the code by itself. `script:` lists shell commands, like `run:` steps.
- `workflow: rules:` creates a pipeline only for merge requests (GitLab's pull requests) and the default branch. `$CI_PIPELINE_SOURCE` and friends are **predefined variables** GitLab fills in.
- `artifacts: reports: junit:` uploads the test report, and GitLab shows the failed tests right on the merge request.
- `tags: [hil-rig]` sends the `hil` job to a runner registered with that tag, exactly like a label in `runs-on`. That runner would use GitLab's *shell* executor, which runs commands directly on the lab machine and ignores `image:`.
- `include:` pulls in a file from another project at a fixed `ref`, and `extends: .sim-setup` copies the settings of the hidden job `.sim-setup` into `unit-tests`. A job whose name starts with a dot never runs by itself; it exists to be extended. This pair does the work of reusable workflows and composite actions.

Both files validate against GitLab's published schema for `.gitlab-ci.yml`.
:::

## Jenkins: the long-lived build server

**Jenkins** is an open-source automation server that a team installs and runs itself. It is much older than GitHub Actions or GitLab CI, it began life as a project called [[Hudson|hudson-history]], and many large engineering organizations have years of build jobs in it. It can build from any git server.

In older Jenkins setups, a job was configured by clicking through forms on the server's web pages. That is exactly the "build nobody can rebuild" problem from lesson 1: the recipe lived on a server, not next to the code. Modern Jenkins uses a **Jenkinsfile** instead, a file in the repository written in a small language built on **[[Groovy|groovy-language]]**. That is pipeline as code again.

Here is the same pipeline as a declarative Jenkinsfile:

```groovy
@Library('gnc-ci@v2') _

pipeline {
    agent none
    options {
        timeout(time: 30, unit: 'MINUTES')
    }
    stages {
        stage('Lint and unit tests') {
            agent { label 'linux' }
            steps {
                sh 'python3 -m venv .venv'
                sh '.venv/bin/pip install -r requirements.lock'
                sh '.venv/bin/ruff check .'
                sh '.venv/bin/pytest -q --junitxml=report.xml'
            }
            post {
                always {
                    junit 'report.xml'
                }
            }
        }
        stage('Hardware in the loop') {
            agent { label 'hil-rig' }
            when { branch 'main' }
            steps {
                sh './scripts/run_hil.sh --suite smoke'
            }
        }
    }
}
```

Reading it with GitHub eyes:

- `pipeline { ... }` wraps everything; braces nest the parts where YAML used indentation.
- An **agent** is Jenkins's word for a runner. `agent none` at the top says "no default machine", and each stage then picks one by **label**: `agent { label 'hil-rig' }` is `runs-on: [self-hosted, hil-rig]` in other words.
- `stage('...')` is a named group of steps; `sh '...'` runs one shell command, like `run:`.
- `post { always { ... } }` runs whether the steps passed or not, like `if: always()`; here it records the test report.
- `when { branch 'main' }` limits the hardware stage to `main`, and `options { timeout(...) }` is `timeout-minutes:`.
- The first line, `@Library('gnc-ci@v2') _`, loads a **shared library**: Groovy code kept in its own repository, at a pinned version, that every team's Jenkinsfile can call. It is Jenkins's way to not repeat yourself. The underscore after it is part of the syntax: the annotation needs something to attach to.

Much of Jenkins's power, and its upkeep, comes from **plugins**: even the `junit` step and git support are plugins that the server's administrators install and update.

## Reading any CI system

Once you know one CI system well, the others are mostly a change of vocabulary:

| Idea | GitHub Actions | GitLab CI | Jenkins |
| --- | --- | --- | --- |
| Pipeline file | `.github/workflows/*.yml` | `.gitlab-ci.yml` | `Jenkinsfile` |
| Unit of work | job | job | stage |
| Machine | runner, picked by `runs-on` labels | runner, picked by `tags` | agent, picked by `label` |
| A command | `run:` step | line in `script:` | `sh` step |
| Ordering | `needs:` | `stages:` (or `needs:`) | order of `stage` blocks |
| Only on some branches | `on:` filters, `if:` | `rules:` | `when { branch ... }` |
| Keep files | `actions/upload-artifact` | `artifacts:` | `archiveArtifacts`, `junit` |
| Reuse | composite actions, reusable workflows | `include:`, `extends:` | shared libraries |

Faced with a new system, ask: what starts a pipeline, what is one unit of work, where does it run, how are units ordered, and how are results kept? The answers are all in the file.

::: key The same pipeline in three dialects
GitHub Actions, GitLab CI and Jenkins all keep the pipeline as code in the repository and run jobs on labeled machines. GitLab: `.gitlab-ci.yml`, `stages`, `script`, `tags`, `include`/`extends`. Jenkins: `Jenkinsfile`, `pipeline`/`stage`/`steps`, `agent { label }`, shared libraries. Self-hosted runners in all three serve the same needs: licenses, hardware and controlled data.
:::

## Check yourself

::: check
Your composite action has this step, and GitHub refuses to load the action. What is missing?

```yaml
    - name: Build
      run: cmake --build build
```
:::

::: answer
The `shell:` key. In a composite action every `run:` step must name its shell, for example `shell: bash`, because there is no workflow-level default to fall back on. Add `shell: bash` under `name: Build` and the action loads.
:::

::: check
Three repositories need the same two-job pipeline (unit tests, then regression sims), each with a different number of regression cases. Should the tools team write a composite action or a reusable workflow? Sketch the caller's job.
:::

::: answer
A reusable workflow, because the thing being shared is whole jobs with their own runners and order, not a few steps. The shared file has `on: workflow_call:` with a `number` input for the case count. Each repository calls it at the job level:

```yaml
jobs:
  sim:
    uses: orbit-gnc/ci-templates/.github/workflows/sim-tests.yml@v2
    with:
      regression-cases: 50
```

Pinning `@v2` means a change to the shared pipeline reaches each project only when that project moves its tag.
:::

::: check
For each job, say whether it needs a self-hosted runner, and why: (a) ruff and pytest on a pure-Python library; (b) a Simulink Test suite that needs a license from the company's license server; (c) a closed-loop test against the flight computer on the lab bench; (d) a job that someone wants on a self-hosted runner "so it doesn't need review".
:::

::: answer
(a) No: a GitHub-hosted runner has everything it needs and starts clean. (b) Yes: the license server is on a private network the hosted machines cannot reach. (c) Yes: the hardware is physically attached to a machine in the lab. (d) No, and the reason is wrong: where a job runs has nothing to do with review. Review and required checks are enforced by branch protection, whatever runner the job uses.
:::

::: check
A self-hosted runner's tests pass on Monday and fail on Tuesday with no code change. The failure mentions a file that the repository no longer contains. What is the likely cause, and what setting helps?
:::

::: answer
The runner is not cleaned between jobs, so a file left over from an earlier job is still on disk and the test picks it up. The result now depends on the runner's history, not only on the code. Registering the runner with `--ephemeral`, so each job gets a freshly prepared machine, removes that history. A cleanup step at the start of the job is a weaker fix.
:::

::: check
Translate this GitLab job into GitHub Actions: it runs only on the default branch, on a runner tagged `hil-rig`, and executes `./scripts/run_hil.sh`.
:::

::: answer
```yaml
jobs:
  hil:
    if: github.ref == 'refs/heads/main'
    runs-on: [self-hosted, hil-rig]
    steps:
      - uses: actions/checkout@v7
      - run: ./scripts/run_hil.sh
```

`tags: [hil-rig]` becomes the labels in `runs-on`. The `rules:` line becomes an `if:` on the job (or a `branches: [main]` filter under `on: push`). GitLab checks out the code by itself; GitHub needs the checkout step.
:::

## Summary

| Idea | What it is | How you write it |
| --- | --- | --- |
| Composite action | Reusable steps | `action.yml` with `runs: using: composite`; every `run:` needs `shell:` |
| Reusable workflow | Reusable jobs | `on: workflow_call` with typed `inputs`; caller job has `uses: ...@tag` |
| Passing secrets | Hand secrets to a called workflow | `secrets: inherit`, or list them under `secrets:` |
| Self-hosted runner | Your own machine running jobs | `./config.sh --url ... --token ... --labels ...`; job uses `runs-on: [self-hosted, label]` |
| Reasons for one | Access, not convenience | License server, HIL hardware, GPUs, export-controlled data |
| GitLab CI | CI built into GitLab | `.gitlab-ci.yml`: `stages`, `script`, `tags`, `rules`, `include`, `extends` |
| Jenkins | Self-run automation server | `Jenkinsfile`: `pipeline`, `agent { label }`, `stage`, `sh`, `post`, `@Library` |

Next you put these pieces to work on a real GNC codebase: a pipeline with linting, static analysis, a coverage gate, a Debug build with AddressSanitizer beside an optimized Release build, regression sims, a benchmark threshold and published artifacts.

::: context dry-rule Don't repeat yourself
The phrase comes from *The Pragmatic Programmer* by Andrew Hunt and David Thomas (1999), which states it as: every piece of knowledge should have a single, authoritative place in a system. It is about knowledge, not about text. Two lines that happen to look alike are fine. Two copies of "how we install the simulator" are not, because when the truth changes only one copy gets updated. In a GNC group the same rule applies to physical constants, frame definitions and tolerances, which is why a mature simulator reads $\mu$ from one constants file instead of typing it in five places.
:::

::: context version-pinning Tags, branches and commit hashes
After the `@` you can write three kinds of reference. A branch, like `@main`, follows every new commit, so what runs can change under you overnight. A tag, like `@v7`, is a name the publisher points at a release; for official actions the major tag moves forward to each compatible fix. A full commit hash, forty hexadecimal characters, can never move at all. Teams that treat CI as part of their evidence often pin third-party actions to a hash and let a bot propose upgrades as pull requests, so each change is reviewed. At the time of writing, the newest major versions were `actions/checkout@v7`, `actions/setup-python@v7`, `actions/upload-artifact@v7`, `actions/download-artifact@v8` and `actions/cache@v6`.
:::

::: context hil-rig What a hardware-in-the-loop rig is
In hardware-in-the-loop testing, the real flight computer runs the real flight software, but its sensors and actuators are replaced by a real-time simulator. The simulator computes what the gyros and GPS would read, feeds those signals into the flight computer's inputs, reads back its commands to thrusters or reaction wheels, and moves the simulated vehicle accordingly. The loop runs at the flight software's real rate. It catches problems a desktop simulation cannot: timing, interrupts, data formats on real buses. There is usually one rig per lab bench, and that is why it gets a single self-hosted runner.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="130" height="70" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="75" y="70" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">Flight computer</text>
  <text x="75" y="88" font-size="11" fill="#1f2a44" text-anchor="middle">real flight software</text>
  <rect x="220" y="40" width="130" height="70" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="285" y="70" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">Real-time sim</text>
  <text x="285" y="88" font-size="11" fill="#1f2a44" text-anchor="middle">vehicle and sensors</text>
  <line x1="220" y1="55" x2="146" y2="55" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="142,55 152,50 152,60" fill="#1d6fd1"/>
  <text x="180" y="30" font-size="11" fill="#1d6fd1" text-anchor="middle">sensor signals</text>
  <line x1="140" y1="95" x2="214" y2="95" stroke="#b4232c" stroke-width="2"/>
  <polygon points="218,95 208,90 208,100" fill="#b4232c"/>
  <text x="180" y="130" font-size="11" fill="#b4232c" text-anchor="middle">actuator commands</text>
  <text x="180" y="152" font-size="11" fill="#6c7a93" text-anchor="middle">one bench, one runner, one job at a time</text>
</svg>
```
:::

::: context export-control Rules about who may see technical data
Many countries control the export of technology with military or space uses. In the United States, two sets of regulations do this: ITAR, the International Traffic in Arms Regulations, and EAR, the Export Administration Regulations. Under them, "export" can include letting a foreign person see controlled technical data, or storing it where the company cannot control who has access. So some simulator models, test data and even source code must stay on systems the company manages. A CI job that touches such data runs on a self-hosted runner inside that boundary, never on a shared cloud machine.
:::

::: context runner-polling The runner calls out, not in
A self-hosted runner does not wait for GitHub to connect to it. The runner program keeps an outgoing HTTPS connection open to GitHub and asks, over and over, "is there a job for me?" When a job with matching labels is queued, GitHub answers with it. Because every connection starts from inside the lab, the firewall only has to allow outgoing traffic to GitHub, and no port has to be opened to the internet. GitLab runners work the same way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="200" height="120" rx="8" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="5 4"/>
  <text x="110" y="38" font-size="11" fill="#6c7a93" text-anchor="middle">lab network</text>
  <rect x="30" y="55" width="160" height="60" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="110" y="80" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">runner program</text>
  <text x="110" y="98" font-size="11" fill="#1f2a44" text-anchor="middle">labels: self-hosted, hil-rig</text>
  <rect x="260" y="55" width="90" height="60" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="305" y="89" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">GitHub</text>
  <line x1="190" y1="72" x2="254" y2="72" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="258,72 248,67 248,77" fill="#1d6fd1"/>
  <text x="228" y="64" font-size="11" fill="#1d6fd1" text-anchor="middle">any jobs?</text>
  <line x1="260" y1="100" x2="196" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="192,100 202,95 202,105" fill="#1f2a44"/>
  <text x="228" y="126" font-size="11" fill="#1f2a44" text-anchor="middle">the job</text>
</svg>
```
:::

::: context hudson-history From Hudson to Jenkins
Kohsuke Kawaguchi started Hudson at Sun Microsystems in the mid-2000s, as a continuous integration server written in Java. After Oracle bought Sun, a dispute over the project's name and control led most of its developers to continue it under a new name, Jenkins, in 2011. That long history is why Jenkins has thousands of plugins, and why so many organizations still have Jenkins servers holding years of build jobs.
:::

::: context groovy-language The language inside a Jenkinsfile
Groovy is a programming language that runs on the Java virtual machine, the same engine Jenkins itself runs on. A declarative Jenkinsfile uses only a small, fixed part of it: nested blocks with braces and a set of known words like `pipeline`, `stage` and `steps`, so it reads almost like a configuration file. There is also an older "scripted" style that is plain Groovy code, with loops and variables. Declarative is easier to read and review, and Jenkins can check its structure before running it; most new pipelines use it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="150" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="22" y="30" font-size="12" fill="#1f2a44" font-weight="700">pipeline</text>
  <rect x="30" y="40" width="300" height="110" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="42" y="58" font-size="12" fill="#1f2a44" font-weight="700">stages</text>
  <rect x="45" y="68" width="130" height="72" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="110" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">stage: lint and test</text>
  <text x="110" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">agent: linux</text>
  <text x="110" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">steps: sh ...</text>
  <rect x="185" y="68" width="130" height="72" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="250" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">stage: HIL</text>
  <text x="250" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">agent: hil-rig</text>
  <text x="250" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">when: branch main</text>
</svg>
```
:::
