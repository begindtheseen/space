---
id: l05-team-workflows
title: "Team workflows: trunk-based, GitFlow and forks"
minutes: 24
covers:
  - Trunk-based development vs GitFlow vs forking workflows
---

The first four lessons of this module gave you the moves: fetch and pull, merge and rebase, rewriting your own branch, and resolving conflicts on purpose. A team also needs an agreement about *how* to use those moves together. Which branches exist? How long do they live? Who is allowed to push where? When does work reach `main`, and when does it reach the vehicle?

That agreement is called a **workflow** (or a **branching model**): a team's shared rules for where work happens and how it comes back together. Git does not force one on you. It will happily let six people make sixty branches that never meet again. So every team picks one, on purpose or by accident, and the choice shapes everything else — how big the pull requests are (next lesson), how releases are cut (lesson 08), and how often somebody spends an afternoon untangling a merge.

This lesson walks through the three workflows you will meet on real teams: **trunk-based development**, **GitFlow**, and the **forking workflow** — the rules, the commands on orbit-sim, the costs, and the team each one fits.

## The problem every workflow solves

Picture three friends writing a report together. One way: each takes a chapter, works alone for a month, and they paste the chapters together the night before it is due. Chapter 2 calls the spacecraft "Aurora", chapter 3 calls it "the probe", and the conclusion matches neither. The night is miserable.

The other way: each friend adds a paragraph or two every day to one shared document and reads what the others added. Small mismatches get spotted the day they appear, while they are still small.

Software is the same. **Integration** means combining everyone's changes into one version that works. The longer two lines of work stay apart, the more they drift, and the harder they are to combine. The drift grows faster than the time apart: two weeks apart is much worse than twice one week apart, because every change on one side can clash with every change on the other. Engineers call the painful end of that road **[[integration hell|integration-hell]]**.

Every workflow is an answer to one question: *how long do we let work stay apart before it is integrated, and what protects the shared branch while we wait?*

## Trunk-based development

In **trunk-based development**, there is one shared branch — usually `main`, which people call the **[[trunk|trunk-word]]** — and everybody integrates into it often. You still make branches, but they are **short-lived**: a branch lives for hours or a day or two, carries one small change, goes through review and automated tests, and is merged. Then it is deleted.

The rules, in plain words:

- **One long-lived branch.** Only `main` lives for months. Everything else is temporary.
- **Small, frequent merges.** Each person merges into `main` at least every day or two. No branch is allowed to wander off for weeks.
- **`main` is always releasable.** Every commit on `main` has passed the tests. If a merge breaks `main`, fixing it (or reverting the merge) comes before any other work.
- **Unfinished features hide behind flags**, not behind long branches (more on this below).
- **Releases are cut from `main`**, with a tag, or with a short release branch when an old version needs fixes (lesson 08).

This is what **[[continuous integration|ci-word]]** really means. The phrase is often used for the robot that runs tests on every push, but the original idea is the habit: everyone's work is integrated continuously, so integration is never a big event.

::: key Trunk-based development in one sentence
Everyone integrates into one main branch through short-lived branches merged within a day or two, behind feature flags if needed, so integration pain stays small and CI always reflects reality.
:::

::: example Ravi's day on trunk
Ravi wants to add Earth's oblateness term $J_2$ to orbit-sim. The physics is not validated yet, so it must not change anyone's results today. He works the trunk-based way.

**Step 1 — branch from a fresh `main`.**

```bash
git switch main
git pull --rebase
git switch -c ravi/j2-flag
```

```text
Switched to a new branch 'ravi/j2-flag'
```

**Step 2 — two small commits.** First "Add feature flag for J2 gravity term (off)", then "Add J2 constant behind USE_J2 flag". Each is small enough to read in a minute.

**Step 3 — catch up with the trunk.** Meanwhile Maya pushed a README change. Ravi fetches and replays his two private commits on top — the case lesson 02 said rebase is for:

```bash
git fetch
git rebase origin/main
```

```text
From /srv/git/orbit-sim
   05cd95a..e079ed4  main       -> origin/main
Successfully rebased and updated refs/heads/ravi/j2-flag.
```

**Step 4 — merge the same day.** After review and a green test run (next lesson covers both), the branch lands on `main` as a fast-forward and is deleted:

```bash
git switch main
git merge --ff-only ravi/j2-flag
git push origin main
git branch -d ravi/j2-flag
git log --oneline --graph
```

```text
* 77ec6e8 Add J2 constant behind USE_J2 flag
* a2a2a3a Add feature flag for J2 gravity term (off)
* e079ed4 Explain how to run the tests
* 05cd95a Start orbit-sim with point-mass gravity
```

(On most teams the merge button of the pull request does step 4 for you; the commands show what it does underneath.)

**Sanity check.** The history is a straight line, the branch existed for a few hours, and `main` still gives everyone exactly the results it gave yesterday, because the flag is off. Tomorrow Ravi adds the $J_2$ acceleration itself, still behind the flag, in another small branch.
:::

### Feature flags: merged is not the same as switched on

How can you merge half a feature every day without breaking `main`? You separate two things that long branches glue together: *merging the code* and *turning the behavior on*.

A **feature flag** (also called a feature toggle) is a setting that decides whether a piece of new code runs. The code is merged, reviewed and tested, but it sits dormant until someone flips the flag. Ravi's flag is one line:

```python
# config.py
# Feature flags: code that is merged but not yet switched on.
USE_J2 = False  # J2 oblateness term; off until validated against GMAT
```

and the gravity code checks it:

```python
import config

def total_accel(r):
    a = point_mass_accel(r)
    if config.USE_J2:
        a = a + j2_accel(r)   # new, unvalidated physics
    return a
```

With the flag off, every simulation gives yesterday's answer. With it on — in Ravi's own test runs, or in a validation job — the new physics runs. When the $J_2$ model has been checked against a trusted tool like **[[GMAT|gmat]]**, the team flips the flag in one tiny, easy-to-review commit, and later deletes the flag and the old path.

::: warning Flags are debt
Every flag doubles the number of ways the code can run. Two flags make four combinations; ten flags make 1,024. Test the combinations that will fly, give every flag an owner and an end date, and delete it once the feature is switched on for good. Old flags that nobody remembers are a classic source of "it works on my configuration" surprises — and in flight software, an unexpected flag state at launch is exactly the kind of thing a readiness review hunts for.
:::

## GitFlow

**GitFlow** is a branching model published by Vincent Driessen in 2010, and for years it was the most famous one. It is built around *scheduled, numbered releases* and uses long-lived branches to keep released code and in-progress code apart.

It has two branches that live forever and three kinds that come and go:

- **`main`** holds only released code. Every commit on it is a release and carries a version tag (lesson 09 of the basics module).
- **`develop`** is where finished features collect between releases. It is the integration branch.
- **`feature/*`** branches start from `develop` and merge back into `develop` when the feature is done.
- **`release/*`** branches start from `develop` when it is time to prepare a release. Only bug fixes, version numbers and documentation go on them. When the release is ready, the branch is merged into `main` (and tagged) *and* back into `develop`, so the fixes are not lost.
- **`hotfix/*`** branches start from `main` when a released version has an urgent bug. The fix is merged into `main` (tagged as a patch release) *and* into `develop`.

GitFlow merges with `--no-ff` (basics lesson 05) on purpose, so that every feature, release and hotfix shows up as its own bump in the graph. Here is orbit-sim after one feature, one release and one hotfix under GitFlow, drawn by `git log --graph --oneline --all`:

```text
*   dcc81f3 (HEAD -> develop) Merge branch 'hotfix/1.1.1' into develop
|\
* \   ce43a98 Merge branch 'release/1.1' into develop
|\ \
| | | *   0fcc47f (tag: v1.1.1, main) Merge branch 'hotfix/1.1.1'
| | | |\
| | | |/
| | |/|
| | * | c0c7eaf Guard accel against r <= 0
| | |/
| | *   87d75d5 (tag: v1.1.0) Merge branch 'release/1.1'
| | |\
| | |/
| |/|
| * | d1c29a9 Fix drag sign for descending orbits
|/ /
* |   ecbe2cf Merge branch 'feature/drag' into develop
|\ \
| |/
|/|
| * af50837 Add drag model
|/
* b59e07a (tag: v1.0.0) Release 1.0 code
```

Count what happened: three real changes (drag model, drag fix, radius guard) and *five* merge commits to move them around. Every fix had to be merged in two directions. That is the price of GitFlow — and the payoff is that `main` holds nothing but tagged releases, and you can always see which branch a change traveled through. The [[picture of the lanes|gitflow-picture]] makes the pattern easier to see than the text graph.

::: warning Long-lived branches drift
In GitFlow, `develop` can run weeks ahead of `main`, and a big feature branch can run weeks ahead of `develop`. That is integration hell on a schedule. If you use GitFlow, still keep *feature* branches short, merge `develop` into long features often, and never let a hotfix skip its merge back into `develop` — or the bug comes back in the next release.
:::

In 2020 Driessen added a **[[note to his own article|driessen-reflection]]** saying that for software delivered continuously, like a web app, a simpler workflow is a better fit, and GitFlow suits software that ships in explicit versions, especially several versions supported at once. That is a fair summary of where it still makes sense.

## The forking workflow

The first two workflows assume everyone can push branches to one shared repository. That fails for open source: a project cannot give write access to every stranger on the internet. The **forking workflow** solves it by giving each contributor their own copy on the server.

A **fork** is a server-side copy of someone else's repository, owned by you. GitHub and GitLab both make one with a button. You can push anything to your fork; you cannot push to the original. To get your work into the original, you open a pull request (GitLab calls it a merge request) *from a branch in your fork* *to* the original. The project's **maintainers** — the people with write access — review it and merge it.

So a contributor's clone has two remotes (remotes are lesson 01's topic). By a very common convention:

- **`origin`** is *your fork*. You push here.
- **`upstream`** is *the original project*. You fetch from here, and never push.

The [[three repositories|fork-remotes]] and the arrows between them are the whole workflow.

::: example Leo contributes from a fork
orbit-sim has been opened to outside contributors, and the team now protects its repository: only Maya can push to it. Leo contributes the way any outsider would. He forks it on the server, then clones *his fork* and adds the original as `upstream`:

```bash
git clone https://git.example.com/leo/orbit-sim.git
cd orbit-sim
git remote add upstream https://git.example.com/orbit-team/orbit-sim.git
git remote -v
```

```text
origin  https://git.example.com/leo/orbit-sim.git (fetch)
origin  https://git.example.com/leo/orbit-sim.git (push)
upstream  https://git.example.com/orbit-team/orbit-sim.git (fetch)
upstream  https://git.example.com/orbit-team/orbit-sim.git (push)
```

**Step 1 — work on a branch.** He makes `leo/sun-vector` and commits a helper, "Add sun unit-vector helper".

**Step 2 — catch up with the original.** Maya's team has since pushed `Pin NumPy 2 in requirements`. Leo's fork does not have it; the original does. So he fetches from `upstream` and rebases his private branch onto it:

```bash
git fetch upstream
git rebase upstream/main
```

```text
From https://git.example.com/orbit-team/orbit-sim
 * [new branch]      main       -> upstream/main
Successfully rebased and updated refs/heads/leo/sun-vector.
```

**Step 3 — push to his fork**, setting up tracking with `-u` (lesson 01):

```bash
git push -u origin leo/sun-vector
```

```text
To https://git.example.com/leo/orbit-sim.git
 * [new branch]      leo/sun-vector -> leo/sun-vector
branch 'leo/sun-vector' set up to track 'origin/leo/sun-vector'.
```

**Step 4 — look at all the pointers.**

```bash
git log --oneline --graph --all --decorate
```

```text
* 170db11 (HEAD -> leo/sun-vector, origin/leo/sun-vector) Add sun unit-vector helper
* 5818d24 (upstream/main) Pin NumPy 2 in requirements
* 77ec6e8 (origin/main, origin/HEAD, main) Add J2 constant behind USE_J2 flag
* a2a2a3a Add feature flag for J2 gravity term (off)
```

Read it from the bottom. Leo's fork's `main` (`origin/main`) is one commit behind the original (`upstream/main`), and his branch sits on top of the original. That is what a maintainer wants: a pull request that applies cleanly to the project as it is *now*.

**Step 5 — open the pull request** on the server, from `leo/sun-vector` in his fork to `main` in `orbit-team/orbit-sim`.

**Sanity check.** Leo never needed write access to the team's repository, and nothing he pushed could touch it. If his fork's `main` bothers him, `git push origin upstream/main:main` sets it to match the original (the form `source:destination` pushes one ref to a differently named one).
:::

::: warning Do your work on a branch, not on your fork's main
If you commit directly on your fork's `main`, it stops matching the original, every later sync becomes a merge, and your next pull request drags along the old commits. Keep `main` in your fork as a clean mirror of `upstream/main` and put each contribution on its own branch.
:::

## Choosing, and the hybrids real teams use

These three are not rival religions. They answer different questions: trunk-based and GitFlow are about *how long branches live*; forking is about *who can push where*. A team can use a fork-based pull request flow *and* keep branches short.

| | Trunk-based | GitFlow | Forking |
| --- | --- | --- | --- |
| Long-lived branches | `main` only | `main` and `develop` | `main` in the original; each fork mirrors it |
| Branch lifetime | hours to a day or two | features: days to weeks | any; usually short |
| Unfinished work hides in | feature flags | feature branches, `develop` | branches in forks |
| Releases | tags on `main`, short release branches when needed | `release/*` into `main`, tagged | whatever the original project does |
| Who can push to the shared repository | whole team | whole team | maintainers only |
| Fits | continuous delivery, one active version | scheduled numbered releases, several versions supported | open source, outside contributors |
| Main cost | discipline: small changes, flags, strong tests | many merges, drift between `develop` and `main` | extra remote to keep in sync |

A few names you will also hear:

- **GitHub flow** is a very light trunk-based style: branch from `main`, open a pull request, review, merge, deploy. Nothing else.
- **Release branches on trunk** is the most common hybrid in flight software. Development is trunk-based, but when a version is handed to a test campaign or a vehicle, a `release/x.y` branch is cut from `main` and kept for fixes only. Lesson 08 is about exactly that.

::: example Picking a workflow for three teams
**Team A** is eight people writing ground software for a satellite constellation. They deploy updates to the ground stations several times a week, and only the newest version runs. *Choice: trunk-based.* One active version means no reason for `develop`; frequent deploys need `main` always ready; flags let a new downlink scheduler merge early and switch on after testing.

**Team B** maintains an open-source orbit propagation library used by universities. Hundreds of people send fixes; five maintainers can merge. *Choice: forking workflow*, with short branches in the forks. Outsiders get no write access, and the maintainers review every pull request.

**Team C** writes flight software for a spacecraft already in orbit running version 3.2, while version 4.0 is developed for the next vehicle. Both need fixes for years. *Choice: trunk-based development on `main` for 4.0, plus a long-lived `release/3.2` branch* for the vehicle in orbit. That is GitFlow's good idea — protect released code on its own branch — without its `develop` branch and double merges.

**Check.** Each choice follows from two facts about the team: how many versions must be supported at once, and who is allowed to push. Neither "what is popular" nor "what we used last time" appeared in the reasoning.
:::

::: note Why short branches win even though merges still happen
Suppose each of $n$ people changes a few regions of the code per day. Two branches that stay apart for $d$ days each collect changes over $d$ days, and a conflict needs a change on *both* sides to land in the same region. The chance of that grows with the product of the two sides' change counts, roughly like $d \times d = d^2$. So one merge after ten days is not ten times as risky as a merge after one day; it is closer to a hundred times, and you get it all at once, when nobody remembers why each line changed. Ten one-day merges spread the same work into small pieces while it is fresh. This is a rough model, not a law, but it matches what teams see.
:::

Research backs this up: the **[[DORA|dora-research]]** studies found that short-lived branches merged into trunk at least daily go along with delivering faster *and* with fewer failures.

## Check yourself

::: check The two-week branch
A teammate has had a branch open for three weeks and says "I'll merge when it's all done, so I don't break `main`". Using trunk-based ideas, what would you suggest instead, and what tool keeps `main` safe while they do it?
:::

::: answer
Split the work into small pieces and merge one every day or two, each reviewed and tested. The unfinished feature hides behind a feature flag that is off by default, so merging the code does not change what `main` does. The three-week branch is drifting further from `main` every day; each small merge replaces one huge, risky integration with many small, easy ones.
:::

::: check Where does a hotfix go in GitFlow?
Version `v2.3.0` is on `main` and `develop` has two weeks of new features. A bug is found in 2.3.0. Name the branch the fix starts from, the branches it is merged into, and the tag it gets.
:::

::: answer
A `hotfix/2.3.1` branch starts from `main` (the released code — not `develop`, which holds unreleased features). The fix is merged into `main` and tagged `v2.3.1`, a patch release. It is also merged into `develop`, so the next release still has it. Forgetting the second merge brings the bug back in 2.4.0.
:::

::: check Read the remotes
In a clone you see `origin → https://git.example.com/priya/fsw.git` and `upstream → https://git.example.com/avionics/fsw.git`. Which one do you push your branch to, which do you fetch to catch up, and where does the pull request point?
:::

::: answer
Push to `origin`, Priya's fork. Fetch `upstream`, the original project, and rebase your branch on `upstream/main` to catch up. The pull request goes *from* your branch in `priya/fsw` *to* `main` in `avionics/fsw`, where a maintainer merges it.
:::

::: check Flag arithmetic
A controller has three independent on/off feature flags. How many configurations can the code run in? If only two of them will ever be on together in flight, what should the test plan focus on, and what should happen to the flags afterwards?
:::

::: answer
Each flag doubles the count: $2 \times 2 \times 2 = 8$ configurations. Test the configurations that will actually fly (with priority on the flight combination), plus the all-off default that `main` runs. After a feature is switched on for good, delete its flag and the old code path, so the number of configurations shrinks again.
:::

::: check Pick a workflow
A four-person startup builds a flight computer. It ships one software version at a time to its test vehicle, all four people can push, and they want the simplest thing that works. Which workflow, and why not the other two?
:::

::: answer
Trunk-based (for example GitHub flow): one supported version, one small trusted team, frequent integration. GitFlow's `develop` and double merges solve a problem they do not have — several versions supported at once. Forks solve a permissions problem they do not have, since everyone may push. If they later need to keep fixing an older version on a vehicle, they add a release branch for it (lesson 08).
:::

## Summary

| Idea | In one line |
| --- | --- |
| Workflow | a team's rules for which branches exist, how long they live, and how work comes back together |
| Integration | combining everyone's changes; the longer work stays apart, the harder it gets |
| Trunk-based development | one `main`; short-lived branches merged within a day or two; `main` always releasable |
| Feature flag | a setting that keeps merged code switched off until it is ready; delete it afterwards |
| GitFlow | `main` (releases only, tagged) + `develop`, with `feature/*`, `release/*`, `hotfix/*`; `--no-ff` merges |
| GitFlow cost | many merges; release and hotfix fixes must be merged into both `main` and `develop` |
| Fork | your server-side copy of a repository; you push there, not to the original |
| `origin` / `upstream` | your fork / the original project; fetch upstream, push origin |
| `git push origin upstream/main:main` | make your fork's `main` match the original |
| Choosing | how many versions are supported at once, and who may push |

Whatever the workflow, work reaches the shared branch the same way: as a pull request that someone else reads. Next lesson is about making that pull request small, clear and easy to say yes to — and about the server rules (required checks, code owners) that guard the shared branch.

::: context integration-hell Where "integration hell" comes from
The phrase grew up in the 1990s on projects where teams developed pieces separately for months and put them together at the end. The "integration phase" was scheduled for a few weeks and routinely took months, because every piece had quietly assumed something different about the others. Aerospace had its own versions long before software: subsystems built to slightly different readings of the same interface document, meeting for the first time on the test stand. Continuous integration was invented as the cure: integrate so often that there is never a big phase to dread.
:::

::: context trunk-word Why "trunk"
Picture a tree. The trunk is the one thick stem that everything grows from, and branches grow out of it. In older version control systems like CVS and Subversion, the main line of development was literally named `trunk`, and the name stuck as a general word even though Git projects call that branch `main` (or, in older repositories, `master`). "Trunk-based" means "everything grows from, and returns quickly to, the one main line".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="12" y1="70" x2="348" y2="70" stroke="#1d6fd1" stroke-width="4"/>
  <text x="14" y="98" font-size="11" fill="#1d6fd1">main (the trunk)</text>
  <path d="M40,70 Q60,30 90,70" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M110,70 Q125,36 145,70" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M150,70 Q175,26 205,70" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M225,70 Q240,38 258,70" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M270,70 Q295,30 325,70" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="18" font-size="11" text-anchor="middle" fill="#1f2a44">short branches: out and back within a day or two</text>
</svg>
```
:::

::: context ci-word Continuous integration, the habit and the robot
The term was popularized around 2000 by the Extreme Programming movement, and Martin Fowler's essay on it is still widely read. The original meaning is a practice: every developer integrates their work into the mainline at least daily, and each integration is checked by an automated build and tests. The automated server became so closely tied to the idea that people now say "CI" for the server itself — "CI is red" means the tests failed. The server without the habit is not really continuous integration: long branches with a test robot still end in integration hell.
:::

::: context gmat A trusted yardstick
GMAT, the General Mission Analysis Tool, is an open-source spacecraft trajectory tool developed by NASA Goddard with partners, and it has been used for real mission design. Teams writing their own propagators often check them against a tool like GMAT: run the same initial state with the same force model in both and compare the positions after a day. When the two agree to within a small tolerance, the new model has earned the right to have its feature flag switched on.
:::

::: context gitflow-picture GitFlow's lanes
Each GitFlow branch type is a lane. Features leave `develop` and return to it. A release branch leaves `develop`, then merges into `main` (tagged) and back into `develop`. A hotfix leaves `main` and merges into both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="gf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <text x="8" y="34" font-size="11" fill="#b4232c">main</text>
  <text x="8" y="74" font-size="11" fill="#1f2a44">hotfix</text>
  <text x="8" y="114" font-size="11" fill="#1f2a44">release</text>
  <text x="8" y="154" font-size="11" fill="#1d6fd1">develop</text>
  <text x="8" y="190" font-size="11" fill="#1f2a44">feature</text>
  <line x1="62" y1="30" x2="350" y2="30" stroke="#b4232c" stroke-width="2"/>
  <line x1="62" y1="150" x2="350" y2="150" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="70" cy="30" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="70" y="18" font-size="11" text-anchor="middle" fill="#1f2a44">v1.0</text>
  <circle cx="84" cy="150" r="5" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="84" y1="150" x2="108" y2="186" stroke="#1f2a44" stroke-width="1.2" marker-end="url(#gf)"/>
  <circle cx="112" cy="186" r="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="116" y1="184" x2="140" y2="155" stroke="#1f2a44" stroke-width="1.2" marker-end="url(#gf)"/>
  <circle cx="144" cy="150" r="5" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="144" y1="150" x2="170" y2="114" stroke="#1f2a44" stroke-width="1.2" marker-end="url(#gf)"/>
  <circle cx="174" cy="110" r="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="178" y1="106" x2="204" y2="36" stroke="#1f2a44" stroke-width="1.2" marker-end="url(#gf)"/>
  <line x1="178" y1="113" x2="214" y2="146" stroke="#1f2a44" stroke-width="1.2" marker-end="url(#gf)"/>
  <circle cx="208" cy="30" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="208" y="18" font-size="11" text-anchor="middle" fill="#1f2a44">v1.1</text>
  <circle cx="218" cy="150" r="5" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="212" y1="34" x2="252" y2="68" stroke="#1f2a44" stroke-width="1.2" marker-end="url(#gf)"/>
  <circle cx="256" cy="70" r="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="260" y1="66" x2="290" y2="36" stroke="#1f2a44" stroke-width="1.2" marker-end="url(#gf)"/>
  <line x1="260" y1="74" x2="300" y2="145" stroke="#1f2a44" stroke-width="1.2" marker-end="url(#gf)"/>
  <circle cx="294" cy="30" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="294" y="18" font-size="11" text-anchor="middle" fill="#1f2a44">v1.1.1</text>
  <circle cx="304" cy="150" r="5" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
</svg>
```

Orange dots on `main` are tagged releases. Notice the two arrows leaving each release and hotfix commit: that is the "merge in both directions" rule.
:::

::: context driessen-reflection The author's own second thoughts
Vincent Driessen's 2010 post, "A successful Git branching model", came with a clear diagram that spread across the industry. Ten years later he added a note of reflection at the top. In his own summary: web applications, which are delivered continuously and never rolled back to an old version, had become the typical kind of software, and for them a much simpler workflow such as GitHub flow fits better. GitFlow, he wrote, is still a good fit for software that is explicitly versioned and must support several versions at once. It is rare and healthy for an author to scope his own idea like that.
:::

::: context fork-remotes Three repositories, two remotes
Leo's laptop talks to two server-side repositories. He fetches from the original (`upstream`) and pushes to his fork (`origin`). The pull request is a request, made on the server, for the maintainers to pull his branch into the original.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="fk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
    <marker id="fr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#b4232c"/>
    </marker>
  </defs>
  <rect x="14" y="14" width="130" height="46" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="79" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">orbit-team/orbit-sim</text>
  <text x="79" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">original: upstream</text>
  <rect x="216" y="14" width="130" height="46" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="281" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">leo/orbit-sim</text>
  <text x="281" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">fork: origin</text>
  <rect x="115" y="130" width="130" height="46" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">Leo's clone</text>
  <text x="180" y="166" font-size="11" text-anchor="middle" fill="#6c7a93">laptop</text>
  <line x1="92" y1="62" x2="150" y2="126" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#fk)"/>
  <text x="84" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">fetch</text>
  <line x1="212" y1="126" x2="268" y2="64" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#fk)"/>
  <text x="278" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">push</text>
  <line x1="214" y1="37" x2="148" y2="37" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#fr)"/>
  <text x="180" y="80" font-size="11" text-anchor="middle" fill="#b4232c">pull request</text>
</svg>
```

The dashed red arrow is not a Git operation at all: it is a conversation on the server, which ends with a maintainer merging the branch.
:::

::: context dora-research What the delivery studies found
DORA (DevOps Research and Assessment) surveyed tens of thousands of professionals over several years; the findings are summarized in the book *Accelerate* by Nicole Forsgren, Jez Humble and Gene Kim (2018). Among the practices that predicted strong performance was trunk-based development: few active branches, branches that live less than about a day before merging, and no long "code freeze" periods. Teams working this way deployed more often and also had fewer failed changes and faster recovery. It is survey research, so it shows a strong association rather than a controlled experiment, but it has held up across years of data.
:::
