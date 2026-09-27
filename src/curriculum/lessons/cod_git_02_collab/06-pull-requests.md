---
id: l06-pull-requests
title: Pull requests that get merged
minutes: 22
covers:
  - "Pull requests: small diffs, draft PRs, required checks, CODEOWNERS"
---

In every workflow from the last lesson, work reaches the shared branch the same way: somebody asks, and somebody else looks before saying yes. On GitHub that request is a **[[pull request|request-pull]]**, usually shortened to **PR**. GitLab calls the same thing a **merge request** (MR). It is a page on the server that says "please merge my branch into `main`", shows the diff, runs the automated tests, and holds the conversation about the change.

A pull request is not a Git feature; hosting services build it on top of branches, commits and merges. So this lesson has two halves. The Git half — which commits are in the PR, what diff the reviewer sees — you can run yourself. The server half — draft PRs, required status checks, code owners, branch protection — is configuration on GitHub or GitLab, and it is what stops a tired engineer from merging a broken change into flight code at 6 p.m. on a Friday.

## What the reviewer actually sees

A pull request has two ends: the **source branch** (sometimes called the head: your work, such as `ravi/drag-area`) and the **target branch** (the base: where it should go, usually `main`).

The diff on the PR page is *not* "`main` compared with your branch". While you worked, `main` moved on; other people's commits landed there. If the page compared the two tips directly, it would show their work too — backwards, as if your PR deleted it. Instead the server shows what your branch changed **since it split from `main`**: the difference between the merge base (basics lesson 05) and your tip.

Git spells that with three dots. Ravi has two commits on `ravi/drag-area`, and since he branched, Maya has pushed a README change to `main`:

```bash
git fetch
git log --oneline origin/main..HEAD
```

```text
1362716 Test density and drag acceleration
85c4a13 Add exponential density and drag acceleration
```

Two dots in `git log A..B` mean "commits reachable from B but not from A" — exactly the commits the PR will bring. Now compare the two ways of diffing:

```bash
git diff --stat origin/main...HEAD
```

```text
 drag.py            | 14 ++++++++++++++
 tests/test_drag.py | 11 +++++++++++
 2 files changed, 25 insertions(+)
```

```bash
git diff --stat origin/main HEAD
```

```text
 README.md          |  4 ----
 drag.py            | 14 ++++++++++++++
 tests/test_drag.py | 11 +++++++++++
 3 files changed, 25 insertions(+), 4 deletions(-)
```

The second one claims Ravi deleted four lines of README. He never touched the README — Maya *added* those lines on `main` after he branched, so comparing tips makes her addition look like his deletion. The **[[three-dot diff|three-dot-picture]]** `A...B` means "diff from the merge base of A and B to B", and it shows only Ravi's work. That is what the PR page shows, and what you should look at before you open one.

::: key What a pull request contains
A PR merges a source branch into a target branch. Its commits are `git log target..source`; its diff is `git diff target...source` (three dots: from the merge base to the source tip), so changes others made on the target do not appear.
:::

## Small diffs

The most useful thing you can do for your reviewer is to send less.

Picture proofreading. Handed one page, you read every word and catch the typo. Handed a 60-page report due in an hour, you skim, you trust, and you sign. Code review works the same way. Studies of real review teams have found that the rate at which reviewers find defects **[[drops off sharply|review-fatigue]]** once a review goes past a few hundred lines. Past that point the reviewer stops understanding and starts approving.

::: key Why keep pull requests small?
Review quality collapses with diff size; a reviewer who cannot hold the change in their head approves it anyway. Small diffs also bisect better and revert cleanly.
:::

When `git bisect` (basics lesson 10) lands on a 40-line commit, you can see the bug; when it lands on a 3,000-line "refactor plus new feature", you are back to reading everything. And `git revert` (basics lesson 06) of a small change removes exactly it; reverting a giant PR throws away good work with the bad.

How small is small? Teams differ, but a common guide is **one logical change** per PR, usually under a few hundred changed lines, reviewable in under an hour. Some habits that get you there:

- **Separate moving code from changing code.** A rename, move or reformat touches hundreds of lines but changes no behavior. Give it its own PR ("same code, new place"), apart from the behavior change, where every line matters.
- **Land the plumbing first.** A new function with tests, not yet called from anywhere, is a safe small PR. Wiring it in is the next one — possibly behind a feature flag (lesson 05).
- **Stack dependent changes.** If PR 2 needs PR 1, open PR 2 with PR 1's branch as its target, then retarget it to `main` once PR 1 merges. Each page shows only its own diff.
- **Tests go with the code they test**, in the same PR. A PR that adds code "and tests later" is two promises, one of which usually breaks.

::: example Splitting a PR that is too big
Leo's branch `leo/attitude-all` is ready, and `git diff --stat main...leo/attitude-all` ends with `14 files changed, 912 insertions(+), 377 deletions(-)`. Reading the commits, it does four things:

1. moves the vector helpers from `gravity.py` into a new `vectors.py` and updates imports (about 380 lines, no behavior change);
2. adds `quaternion.py` with tests (about 290 lines);
3. adds `attitude.py` — the direction cosine matrix and Sun direction in body axes — with tests (about 310 lines);
4. switches the simulator loop to use attitude (about 300 lines, including config and docs).

**Step 1 — order by dependency.** 2 needs nothing new; 3 needs 2; 4 needs 1, 2 and 3. Part 1 is independent of 2 and 3.

**Step 2 — open four PRs.** PR A is the move (part 1), marked in its title as "no behavior change" so the reviewer checks it that way. PR B is quaternions, targeting `main`. PR C is attitude, targeting PR B's branch until B merges. PR D is the wiring, last.

**Step 3 — count.** Four PRs of about 290–380 lines each instead of one of about 1,290 (912 + 377). Adding up the pieces: $380 + 290 + 310 + 300 = 1280$, close to the total, as it should be — nothing was dropped.

**Sanity check.** The attitude math — where a unit or frame error would hide — is now a 310-line PR a GNC reviewer can read line by line, instead of lines 400 to 700 of a 1,300-line diff.
:::

::: warning "While I was in there..."
The fastest way to make a small PR large is to fix everything you noticed on the way. Each fix is harmless alone; together they bury the real change. Send them as their own tiny PRs.
:::

## The description: what, why, how you know

A reviewer opens your PR cold. The description is where you give them what the diff cannot: your reasons. It follows the same idea as a commit message (basics lesson 03) — the diff says *what*, only you can say *why* — plus two things a reviewer needs before approving: how you tested it, and what could go wrong.

```text
Add exponential atmosphere and drag acceleration

Why: orbit decay below 500 km is dominated by drag; orbit-sim has none.
Needed for the reentry-window study (issue #42).

What:
- drag.py: density(h) with sea-level 1.225 kg/m^3 and 8.5 km scale height;
  drag_accel(h, v, cd, area, mass) = 0.5 rho v^2 cd A / m, SI units throughout.
- tests/test_drag.py: sea-level density; sign of drag acceleration.

How tested: pytest (3 passed). Spot check: at 400 km the model gives about
4e-21 kg/m^3, far below the few times 1e-12 in real atmosphere tables. The exponential
model is only meant for h < 100 km; see "Risks".

Risks: not valid above ~100 km. Flag in the docstring; a table-based model
is the follow-up.
```

Notice the spot check. Ravi compared a computed number with a known one, found it off by about nine powers of ten, and said so, instead of letting a reviewer discover it. (The number is real: $1.225\,e^{-400/8.5} \approx 4 \times 10^{-21}\,\mathrm{kg/m^3}$, because a single scale height of $8.5\,\mathrm{km}$ only describes the lower atmosphere.) A description that points at its own weak spot gets a better review, not a worse one.

Most servers let a repository supply a **PR template**, a file whose text pre-fills every new description. On GitHub it is `pull_request_template.md` (in the root, `docs/` or `.github/`); on GitLab, merge request templates live in `.gitlab/merge_request_templates/`. A good template for a GNC codebase asks directly: *units and frames of every new interface? How was it tested?*

## Draft pull requests

To get eyes on unfinished work — "is this the right approach?" before writing the tests — open a **draft pull request**.

On GitHub, a draft PR looks like any other PR, runs the checks, and takes comments, but it cannot be merged until the author marks it **ready for review**. Code owners (below) are not automatically asked to review a draft; they are asked when it becomes ready. From the command line, GitHub's `gh` tool does `gh pr create --draft`, and later `gh pr ready`. On GitLab the equivalent is a **draft merge request**, marked by starting its title with `Draft:`; it cannot be merged while marked that way.

Use a draft when the design is uncertain, and say at the top what feedback you want ("only the interface of `drag_accel`, please").

## Required checks and branch protection

Now the server half. Anyone with push access *could* merge anything. **Branch protection** is the set of rules the server enforces on an important branch such as `main` or `release/*`, so that it does not depend on everyone being careful all the time. On GitHub these are set as branch protection rules or, in the newer system, **[[rulesets|rulesets]]**; on GitLab, as protected branches with merge request settings and approval rules. The common rules:

- **Require a pull request before merging**, with at least $N$ approvals. Nobody pushes to `main` directly.
- **Require status checks to pass.** A **status check** is a pass/fail result that an automated job reports on a commit — "unit-tests", "lint", "build-flight-image". The rule names the checks that must be green before the merge button works.
- **Require review from code owners** (next section).
- **Require the branch to be up to date** before merging, or use a **[[merge queue|merge-queue]]**, so that the checks ran against the code as it will actually be after the merge.
- **Block force pushes and deletion** of the protected branch — the history of `main` is not rewritten (lesson 02's golden rule, enforced by the server).
- Optionally, **require linear history** (only squash or rebase merges) or **require signed commits**.

::: key Required status checks
A required status check is an automated job (tests, lint, build) whose pass/fail result must be green before the server allows the merge. With branch protection, the protected branch only ever receives commits that passed — so every commit on it is releasable and every commit is a meaningful `git bisect` step.
:::

What do the checks test? Not your branch tip on its own, but your branch *combined with* the current target. For pull requests GitHub Actions by default checks out a temporary **merge commit** of the PR into its base, and CI systems in general aim to test that result. You can build the same thing locally, which is worth doing when `main` has moved a lot:

```bash
git switch --detach origin/main
git merge --no-ff ravi/drag-area -m "Trial merge of ravi/drag-area"
git log --oneline --graph -4
python -m pytest -q
```

```text
*   48545d2 Trial merge of ravi/drag-area
|\
| * 1362716 Test density and drag acceleration
| * 85c4a13 Add exponential density and drag acceleration
* | 7c942f5 List models in README
...                                                                      [100%]
3 passed in 0.01s
```

Detached HEAD (basics lesson 04) means the trial merge belongs to no branch; `git switch ravi/drag-area` walks away from it, and nothing on `main` changed.

::: warning Green on your branch is not green on main
Your branch passed yesterday; `main` gained a commit this morning that renamed a function you call. Both sides are green alone, and the merge is broken. That is why "require up to date" and merge queues exist: they re-run the checks on the combination. If your team has neither, re-run CI after updating your branch, right before you merge.
:::

## CODEOWNERS: routing to the right reviewer

A code base has areas that only some people can review well. The gravity model needs someone who knows geodesy; the CI configuration needs the build engineer. A **CODEOWNERS** file maps paths in the repository to the people or teams responsible for them. When a PR touches a path, the server automatically requests a review from its owners. With the branch-protection rule "require review from code owners" switched on, the PR cannot merge until an owner of every touched path has approved.

**Where it lives.** On GitHub, a file named `CODEOWNERS` in `.github/`, in the repository root, or in `docs/` (GitHub uses the first it finds, in that order). On GitLab: the root, `docs/`, or `.gitlab/`. It is read from the target branch — so the file on `main` decides who reviews PRs into `main`.

**Syntax.** One rule per line: a path pattern, then one or more owners. Owners are `@username`, `@org/team-name`, or an email address. Lines starting with `#` are comments. Patterns work much like `.gitignore` patterns (basics lesson 08): `*` matches anything, a trailing `/` means a directory and everything in it, and a leading `/` anchors the pattern to the repository root. A few `.gitignore` features do not work, notably `!` to negate a pattern.

**Precedence.** When several lines match a file, **[[the last matching line wins|codeowners-precedence]]**. That is the opposite of how people tend to read top to bottom, so put the broad default first and the specific rules below it. (GitLab adds optional named `[Sections]`, each with its own rules and its own required approval; the last match *within each section* applies.)

Here is orbit-sim's file, at `.github/CODEOWNERS`:

```text
# Default: any maintainer may review anything not listed below.
*                     @orbit-team/maintainers

# Numerical core: a GNC reviewer must approve.
/gravity.py           @orbit-team/gnc
/attitude.py          @orbit-team/gnc
/quaternion.py        @orbit-team/gnc

# Drag model: Ravi wrote it and knows its limits.
/drag.py              @ravi-patel @orbit-team/gnc

# CI configuration and the owners file itself: build engineers only.
/.github/             @orbit-team/build
```

::: key CODEOWNERS
A `CODEOWNERS` file (GitHub: `.github/`, root or `docs/`; GitLab: root, `docs/` or `.gitlab/`) maps path patterns to owners (`@user`, `@org/team`, email). The last matching pattern wins. Owners are requested automatically, and with "require review from code owners" in branch protection, their approval is required to merge.
:::

::: example Who has to approve?
A PR touches four files: `attitude.py`, `drag.py`, `README.md` and `.github/workflows/tests.yml`. With the file above and "require review from code owners" on, whose approval does it need?

**Step 1 — `attitude.py`.** Two lines match: `*` and `/attitude.py`. The last match wins, so the owner is `@orbit-team/gnc`.

**Step 2 — `drag.py`.** Lines `*` and `/drag.py` match; the last is `/drag.py`, owners `@ravi-patel` and `@orbit-team/gnc`. When a line lists several owners, an approval from any one of them satisfies it.

**Step 3 — `README.md`.** Only `*` matches: `@orbit-team/maintainers`.

**Step 4 — `.github/workflows/tests.yml`.** `*` and `/.github/` match (a trailing slash covers everything inside); the last is `/.github/`: `@orbit-team/build`.

**Result.** Approvals are needed from the GNC team (which covers both `attitude.py` and `drag.py` if one GNC member approves), a maintainer, and the build team. That is at least three people for one PR — a hint that the CI change probably belongs in its own PR.

**Sanity check.** Suppose someone had written `/attitude.py @orbit-team/gnc` *above* the `*` line. Then `*` would be the last match for every file, and the GNC team would never be required. Order matters.
:::

::: warning CODEOWNERS is not a substitute for reading
The file makes sure the right person is *asked*. It cannot make them read carefully. An owner who approves 40 PRs a day by clicking has turned the rule into a rubber stamp. Keep owner lists small and real, and keep PRs small enough that owners can do the job.
:::

## Landing it

When the PR is approved and green, it is merged — by the author or a maintainer, depending on the team. Servers usually offer three buttons, which map onto lesson 02:

- **Merge commit** — a `--no-ff` merge; the branch's commits keep their hashes, and the merge commit records that they arrived together.
- **Squash and merge** — all the branch's commits become one new commit on `main`. Tidy, but a carefully split series (lesson 03) is flattened.
- **Rebase and merge** — the commits are replayed on top of `main` with new hashes, giving a straight line.

Teams usually allow only one. Then delete the source branch.

During review you will push more work: either new commits ("Address review: rename C to C_bi"), which show reviewers exactly what changed, or a rewritten branch pushed with `--force-with-lease` (lesson 03). Either way, say in a comment what changed.

## Check yourself

::: check Two dots, three dots
You are on `feature` and `main` has moved. Which command lists the commits your PR will bring in, and which shows the diff the PR page will show? Why would `git diff main feature` mislead you?
:::

::: answer
`git log --oneline main..feature` lists the commits on `feature` that `main` lacks. `git diff main...feature` shows the diff from the merge base to `feature`'s tip, which is what the server shows. `git diff main feature` compares the two tips directly, so anything added to `main` after you branched appears as if your PR removed it.
:::

::: check Last match wins
A CODEOWNERS file reads, in order: `/docs/ @writers`, `* @maintainers`, `/src/nav/ @gnc`. Who owns `docs/frames.md`, `src/nav/ekf.py`, and `setup.py`? What would you change?
:::

::: answer
`docs/frames.md` matches `/docs/` and `*`; the last match is `*`, so `@maintainers` — the writers rule is dead. `src/nav/ekf.py` matches `*` and `/src/nav/`; last is `/src/nav/`, so `@gnc`. `setup.py` matches only `*`: `@maintainers`. Fix it by moving `* @maintainers` to the top, so every specific rule comes after the default.
:::

::: check Draft or ready?
You have a half-written Kalman filter and you are unsure whether the state vector should include accelerometer bias. You want the navigation lead's opinion before writing tests. What do you open, and what do you write at the top?
:::

::: answer
A draft pull request (on GitLab, a merge request titled `Draft: …`). It cannot be merged by accident, it can still run CI and collect comments, and on GitHub code owners are not pulled in until you mark it ready. At the top, say exactly what feedback you want: "Design question only: should the state include accelerometer bias? Tests and tuning are not written yet."
:::

::: check Why the checks go first
Your team lets people merge first and fix CI failures afterwards "to keep things moving". Describe two concrete ways this hurts, one for your teammates today and one for someone in a year.
:::

::: answer
Today: everyone who pulls or branches from `main` after the bad merge inherits the failure. Their own PRs go red for a reason that is not theirs, and they lose time finding out it was not their fault. In a year: someone runs `git bisect` to hunt a regression, and the commits between the bad merge and its fix do not build or fail tests for the wrong reason, so bisect has to skip them or gives a wrong answer. Requiring checks before merge keeps every commit on `main` good.
:::

::: check Size it
A PR renames `r` to `radius_m` in 60 files (about 400 changed lines) and also fixes a sign error in the drag force (3 lines). What do you ask the author to do, and why is it safer?
:::

::: answer
Split it into two PRs: the rename alone ("no behavior change"), then the 3-line sign fix with a test that fails before the fix and passes after. The reviewer can check the rename quickly for mechanical correctness, and give the sign fix full attention instead of hunting for 3 important lines among 400 routine ones. If the fix ever needs reverting, it can go without undoing the rename.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Pull request / merge request | a server page asking to merge a source branch into a target branch, with diff, checks and discussion |
| PR commits and diff | `git log target..source`; `git diff target...source` (from the merge base) |
| Small PRs | one logical change; review quality collapses with size; small diffs bisect and revert cleanly |
| Description | what, why, how tested, risks; the diff cannot say why |
| Draft PR | open for early feedback; cannot merge until marked ready; GitLab: `Draft:` title |
| Branch protection / rulesets | server rules on `main`: PR required, approvals, required checks, no force push |
| Required status check | automated pass/fail on the commit, green before merge; tests the merge result |
| CODEOWNERS | path pattern → owners; `.github/`, root or `docs/` on GitHub; last match wins |
| Merge buttons | merge commit, squash, rebase — lesson 02's trade-offs |

A pull request is only as good as its review. Next lesson sits on the other side of the table: how to read someone else's diff, what to look for in numerical code — units, frames, signs, NaN — and how to write comments that catch a real error without starting a fight about style.

::: context request-pull Why "pull" request?
The name comes from how Linux kernel development worked (and still largely works): a contributor publishes a branch in their own repository and emails a maintainer asking them to *pull* it. Git even has a command that writes that email for you, `git request-pull`, which prints a summary of the commits and where to fetch them from. Hosting services turned the email into a web page with a diff viewer and a merge button, and kept the old name. GitLab's "merge request" names the same thing by what finally happens instead.
:::

::: context three-dot-picture Where the three-dot diff starts
`main` moved on after Ravi branched. Comparing the two tips (grey) sweeps in Maya's README change. The three-dot diff (blue) starts at the merge base, so it contains only Ravi's two commits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="td" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <circle cx="60" cy="100" r="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">581</text>
  <text x="60" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">merge base</text>
  <circle cx="160" cy="50" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="160" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">85c</text>
  <circle cx="250" cy="50" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="250" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">136</text>
  <circle cx="200" cy="140" r="16" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="144" font-size="11" text-anchor="middle" fill="#1f2a44">7c9</text>
  <line x1="144" y1="57" x2="76" y2="92" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#td)"/>
  <line x1="234" y1="50" x2="178" y2="50" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#td)"/>
  <line x1="184" y1="135" x2="77" y2="106" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#td)"/>
  <text x="300" y="54" font-size="11" fill="#1f2a44">ravi/drag-area</text>
  <text x="222" y="158" font-size="11" fill="#1f2a44">main (README)</text>
  <path d="M60,78 Q150,10 246,30" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 3"/>
  <text x="120" y="22" font-size="11" fill="#1d6fd1">main...ravi: base to tip</text>
  <path d="M212,126 Q262,95 252,70" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="3 3"/>
  <text x="262" y="104" font-size="11" fill="#6c7a93">main ravi: tip to tip</text>
</svg>
```

Arrows point from each commit to its parent.
:::

::: context review-fatigue What the review studies measured
The best-known numbers come from a 2006 study of peer review at Cisco Systems, published by the tool company SmartBear: roughly 2,500 reviews covering millions of lines of code. Reviewers found defects well while reviewing up to about 200–400 lines at a time, and markedly less beyond that; going faster than a few hundred lines per hour also cut the defect-finding rate. Later studies at Microsoft and Google found similar patterns: small changes get faster, more useful reviews. The exact threshold varies with the code, but the direction never does.
:::

::: context rulesets Branch protection's newer form
GitHub has two ways to express the same kinds of rule. Classic **branch protection rules** attach settings to one branch name pattern in one repository. **Rulesets**, added later, are named groups of rules that can target many branches or tags at once, can be layered (several rulesets apply together and the strictest wins), can be defined once for a whole organization, and can be switched to an "evaluate" mode that reports what would be blocked without blocking it. For a learner the rules themselves — require a PR, require checks, require code-owner review, block force pushes — are the same either way.
:::

::: context merge-queue A queue for the merge button
On a busy repository, "require branches to be up to date" turns into a race: you update, CI runs for 20 minutes, someone else merges first, you are out of date again. A **merge queue** fixes this. Approved PRs join a queue; the server builds a temporary branch of `main` plus the queued PRs in order, runs the required checks on that combination, and merges each one only if its checks pass. GitHub and GitLab both offer one (GitLab calls its version merge trains). Large flight software repositories use them to keep `main` green with hundreds of merges a day.
:::

::: context codeowners-precedence Reading the owners file bottom-up
Because the last match wins, the fastest way to find a file's owner is to read the CODEOWNERS file from the **bottom** up and stop at the first pattern that matches.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="co" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#b4232c"/>
    </marker>
  </defs>
  <rect x="20" y="14" width="250" height="26" rx="4" fill="#fff" stroke="#6c7a93"/>
  <text x="30" y="31" font-size="12" fill="#6c7a93">*  @orbit-team/maintainers</text>
  <rect x="20" y="46" width="250" height="26" rx="4" fill="#fff" stroke="#6c7a93"/>
  <text x="30" y="63" font-size="12" fill="#6c7a93">/gravity.py  @orbit-team/gnc</text>
  <rect x="20" y="78" width="250" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="30" y="95" font-size="12" fill="#1f2a44">/attitude.py  @orbit-team/gnc</text>
  <rect x="20" y="110" width="250" height="26" rx="4" fill="#fff" stroke="#6c7a93"/>
  <text x="30" y="127" font-size="12" fill="#6c7a93">/.github/  @orbit-team/build</text>
  <line x1="300" y1="130" x2="300" y2="96" stroke="#b4232c" stroke-width="2" marker-end="url(#co)"/>
  <text x="300" y="146" font-size="11" text-anchor="middle" fill="#b4232c">start here</text>
  <text x="315" y="92" font-size="11" fill="#b4232c">match</text>
</svg>
```

For `attitude.py`: `/.github/` does not match, `/attitude.py` does — stop. The `*` line above it is never reached.
:::
