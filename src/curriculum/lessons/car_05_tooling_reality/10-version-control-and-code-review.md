---
id: l10-version-control-and-code-review
title: "Version control, code review, and what a reviewer is checking"
minutes: 20
covers:
  - version control, code review and what production-quality means at senior level
---

Think about a group of friends writing one story together in a shared notebook. If anyone can scribble anywhere at any time, the story turns to mush within a week. So the group makes rules. Each person writes on a separate sheet first. Someone else reads the sheet before it is glued in. And the notebook keeps a note of who added each page, and why.

Engineering teams do exactly this with code. The shared notebook is a **version-controlled history**: a complete, searchable record of every change to the code, who made it and why. The friend who reads each sheet before it goes in is doing **code review**: a second engineer reads a proposed change and must approve it before it joins the shared code.

The first lesson in this module said that GNC engineers own their work — one person carries an algorithm from derivation to tested, deployed flight code. Ownership does not mean working alone. Code review is how a second careful set of eyes checks that work without a second team rewriting it. This lesson covers both halves. First, what changes about a shared history once the codebase is large and safety-relevant. Then the part you will meet every day: what a real reviewer of flight or simulation code is checking. It is much more than "does it compile and pass the author's own tests."

## Version control at scale: small, attributable, always buildable

The basic idea of **[[version control|git-story]]** is the same for a one-person project and for a thousand-person one. Every change is saved as a **commit** — a snapshot of the code plus a short message saying what changed and why. The list of commits is the history, and you can search it, compare any two points in it, and go back to any earlier state.

What changes at scale is which properties of that history matter. Three of them matter a lot.

**Small.** A proposed change should do one identifiable thing. Picture checking a friend's homework. One page with ten lines on it, you can check carefully. Forty pages mixing math, spelling and history, you skim. Reviewers are the same: a person can hold a few hundred lines of focused change in their head, and cannot do that for several thousand lines mixing three unrelated concerns. A sprawling change defeats review by sheer volume, however careful the reviewer is.

**Attributable.** Each change should say plainly what it does and point back to the **ticket** — the recorded request or problem report — or the requirement that justified it. This is the traceability from the previous lesson, working at the level of single commits.

**Always buildable.** The shared **[[main line|main-line]]** of history — the version everyone builds on — is expected to stay in a known-good state: it builds, and its tests pass. This follows from the previous lesson's point about red builds. The whole value of a searchable history is finding exactly when and why a specific line changed. That gets far harder once broken states are mixed in with working ones and nobody can tell from the history which is which.

::: key Version control at scale
Good changes are small and do one thing, are described well enough to trace back to their ticket or requirement, and land on a main line that always builds and passes its tests.
:::

## What a reviewer of flight or simulation code is actually checking

A reviewer's job is not to read the change and decide it looks reasonable. The change is shown to the reviewer as a **[[diff|diff-reading]]** — only the lines that were added, removed or changed. The reviewer checks several specific, separate things about it. Almost all of them come straight from earlier lessons in this module.

**1. Correctness against the actual requirement.** The question is not "does this code do something sensible" but "does it do the specific thing the ticket or requirement asks for." To answer that, the reviewer has to know what the requirement was. This is traceability doing its job.

**2. Whether the change includes the test that would have caught the problem it fixes.** This is one of the sharpest questions a reviewer asks, so here it is precisely. Suppose a change fixes a bug. Unless it also adds a test that *fails* on the old, buggy code and *passes* on the fixed code, there is no lasting evidence the bug is fixed. It might only be hidden in whatever case the author happened to try by hand. That kind of test is called a **[[regression test|regression-word]]**: it guards against the old bug coming back.

**3. Resource bounds, for anything touching the control path.** A new heap allocation, a loop whose limit is not a fixed constant known when the code is compiled, an exception that can escape into the real-time loop — every rule from the lesson on the machine and the deadline is on the reviewer's list. None of these defects announce themselves in a quick read. They have to be looked for on purpose.

**4. Units and frames made explicit.** Does a changed interface still say plainly what units its numbers are in and what frame its vectors are measured in? Is there a boundary test for the kind of quiet, plausible-looking error the data-discipline lesson described?

**5. Whether someone else could safely change this later.** Not "is the code clever," but: could a different engineer — or the same one, months later, during a live problem at an awkward hour — read it, understand what it does and why, and change it without first reverse-engineering the author's thinking?

::: key What a reviewer checks
A reviewer of flight or simulation code checks correctness against a traceable requirement, whether the change includes the test that would have caught the bug it fixes, resource bounds in anything touching the control path, explicit units and frames, and whether someone other than the author could safely modify the result later. None of these is optional, and none of them is visible from "it compiles and the diff looks reasonable."
:::

::: warning Passing tests only speak for the cases they test
"All the tests pass" means the code is right *for the inputs those tests use*. It says nothing about an input nobody wrote a test for. Before approving, a reviewer asks which cases are missing — especially the edges: the first item, the last item, zero, a negative sign.
:::

## What "production quality" means at senior level

"Production quality" is easy to nod along to and hard to pin down. So here it is, specific enough to check against. Production-quality code is:

- **reviewed** by someone other than its author;
- **unit tested**, including its boundary and sign cases;
- **deterministic** — same inputs, same outputs, every time — and **bounded in resource use**, finishing within a known time and memory budget if it sits anywhere near the control path;
- **documented** well enough that a different engineer could change it correctly during a real problem at [[two in the morning|two-am-review]], without first tracking down the original author;
- **deployed** somewhere a defect cannot be fixed by restarting the program and hoping for the best.

::: key Production-quality code
Code that is reviewed, unit tested, deterministic, bounded in resource use, documented well enough for someone else to modify at 2am, and deployed to a vehicle where a defect is not recoverable by a restart.
:::

That last point does the most work, so it is worth slowing down on. A huge amount of everyday software gets away with defects because the cost of failure is a restart. When a web server crashes, a **[[supervisor process|supervisor]]** — a small program whose only job is to watch another one — starts it again. When a script throws an error, someone runs it again.

A vehicle in flight cannot be restarted into a better state. Whatever the code does in the moment a fault happens is, for practical purposes, what actually happens. That one difference explains every constraint elsewhere in this module: bounded execution time, no dynamic memory allocation in the control path, explicit fault handling instead of exceptions, redundancy and voting. They are not excess caution. They are what "we cannot restart our way out of a bad moment" looks like when it is applied to the whole system, consistently.

::: example An off-by-one a reviewer catches by asking about the edge
A function picks which of three redundant sensors to trust. It gets the readings and a validity flag for each sensor, and returns the index of the first valid one — or $-1$ if none is valid. (Python counts positions from $0$, so three sensors are indices $0$, $1$ and $2$.)

```python
def select_active_sensor(readings, valid):
    for i in range(len(readings) - 1):   # off by one: never checks the last index
        if valid[i]:
            return i
    return -1
```

**The author's tests.** With all three sensors valid, the loop checks index $0$, finds it valid, and returns $0$. Correct. With only the first sensor valid, same thing: it returns $0$. Correct. Both tests pass.

**The reviewer's question.** The reviewer has the habit this module keeps building: check the edges, not only the cases the author tried. So the reviewer asks one thing: "What happens if only the *last* sensor is still good?"

```python
readings = [12.1, 12.3, 12.0]
print(select_active_sensor(readings, [False, False, True]))
# -1
```

**Why it fails.** `len(readings)` is $3$, so `range(len(readings) - 1)` is `range(2)`, which gives only $0$ and $1$. The loop [[never looks at index 2|off-by-one]]. It finds nothing valid and reports "no good sensor" — while one is sitting right there.

**Why it matters.** The whole point of three sensors is that losing two of them is survivable. This bug quietly defeats exactly the case the redundancy exists for.

**The fix** is one small edit: `range(len(readings))`. With that, the same call returns $2$. Sanity check: the other two tests still return $0$, so the fix did not break what already worked. The fix should also add the reviewer's case as a new test, so the bug can never silently return.

Notice what found the bug. Not a slow read of every line — one specific question about the edge.
:::

::: example Two reviewers, one pull request
A proposed change — on most teams called a **[[pull request|pull-request]]** — adds a new sensor-fusion path. It has a short description, passing tests, and a diff of moderate size.

**Reviewer A** reads the diff top to bottom, confirms it builds, confirms the included tests pass, and approves it in a few minutes.

**Reviewer B** asks three questions before approving anything:

1. Which requirement does this satisfy, and does the ticket the change points to say so?
2. Does the test cover the case where the new sensor *disagrees* with the existing ones — not only the case where they agree?
3. Does anything in the new path allocate memory or use an unbounded loop? This function sits inside the control loop.

Review A is not worthless. It would still catch a broken build or a plainly wrong change. But it checks only what you can see by reading the change like prose. Review B checks exactly the things that do not announce themselves: traceability to a requirement, a test of the case most likely to expose a real defect, and the resource limits flight code must meet.

The difference is not "trying harder" in some vague way. It is a specific, learnable list of questions — and this module has already given you almost every one of them by name.
:::

::: note Why "small" is a review rule, not only tidiness
Every check above needs the reviewer to truly understand the change. Understanding has a size limit. Past a few hundred lines of mixed concerns, a reviewer can no longer trace each line to a requirement, find each missing edge test, or spot each hidden allocation. So a sprawling change does not only take longer to review. Past a certain size, it cannot be reviewed carefully at all.
:::

## Check yourself

::: check
Name at least four specific things a reviewer of flight or simulation code checks, beyond confirming that the change compiles and its own tests pass.
:::

::: answer
Any four of these five:

1. Correctness against the actual, traceable requirement — not a general sense that the code is reasonable.
2. Whether the change includes the test that would have caught the bug it fixes.
3. Resource bounds in anything touching the control path — no new heap allocation, no unbounded loop, no escaping exception.
4. Explicit units and frames at any changed interface.
5. Whether a different engineer could safely read and modify the result later, without rebuilding the author's reasoning from scratch.
:::

::: check
In the sensor-selection example, what question exposed the bug? Why were the author's own passing tests not enough evidence that the function was correct?
:::

::: answer
The question was a boundary check: "What happens if only the last sensor is still valid?"

The author's tests were "all three valid" and "only the first valid." Both return the right answer even with the bug, because the bug only skips the very last index, and neither test needed the last index. Passing tests show the code is correct for the cases those tests cover. They say nothing about a case nobody wrote a test for — like this one.
:::

::: check
State this lesson's definition of "production quality at senior level." Why is "cannot be fixed by a restart" the right thing to contrast it against?
:::

::: answer
Production-quality code is reviewed by someone other than its author, unit tested including boundary and sign cases, deterministic and bounded in execution time and resources near the control path, documented well enough for a different engineer to modify it correctly during a real problem at 2 a.m., and deployed somewhere a defect cannot be cleared by restarting the process.

"Cannot be fixed by a restart" is the right contrast because a lot of ordinary software tolerates real defects exactly because crash-and-relaunch is an acceptable recovery. A vehicle in flight has no such fallback. Whatever the code does at the moment of a fault is, practically, the whole outcome. That is why every resource-bound and fault-handling rule in this module exists.
:::

::: check
Why does a reviewer ask "does this change include the test that would have caught the bug it fixes?" instead of only "does this fix the bug?"
:::

::: answer
"Does this fix the bug?" can be answered by the author trying the one case they noticed and seeing it now works. That shows the fix works for that case, but leaves no lasting, checkable evidence, and nothing stops the same bug from being quietly reintroduced later.

A test that fails on the old code and passes on the fixed code is evidence anyone can rerun at any time. It also joins the regression suite from the previous lesson, so a one-time claim becomes a standing check that runs automatically on every future change.
:::

::: check
How does the version-control habit of keeping changes small and focused connect to a reviewer's ability to perform the checks in this lesson?
:::

::: answer
Every check — tracing correctness to a requirement, confirming the fix's test covers the bug, checking resource bounds, checking units and frames, judging whether the code can be maintained — needs the reviewer to really understand the change.

A person can hold a small, focused change in their head well enough to do all of that. They cannot do it for a large change that mixes several unrelated concerns. So a sprawling change does not only take longer; past a certain size it defeats careful review entirely, however diligent the reviewer. That makes "small, single-purpose changes" a review practice, not only a tidiness preference.
:::

## Summary

| Idea | What it means |
| --- | --- |
| Commit | A saved snapshot of the code, with a message saying what changed and why |
| Small, focused change | A change a reviewer can hold in mind well enough to check thoroughly |
| Always-buildable main line | A shared history where "broken" and "working" states are never confused |
| Fix without its test | A one-time claim, not lasting evidence the defect is gone |
| The reviewer's list | Requirement, regression test, resource bounds, units and frames, maintainability |
| Production quality (senior level) | Reviewed, unit tested, deterministic, bounded in resources, documented for 2 a.m., deployed where a restart is not a fix |
| "Not recoverable by a restart" | The fact that makes every resource-bound and fault-handling rule in this module non-negotiable |

The next and final lesson of the module turns to what you can practice now, on your own, that carries straight into this kind of work: reading unfamiliar code, writing the test before the fix, and keeping a record good enough for someone else to trust.

::: context git-story A tool built in a hurry
The most widely used version-control tool today is **Git**. Linus Torvalds, who created Linux, wrote the first version in 2005, after the Linux project lost free use of the tool it had been using. He needed something fast that thousands of people could use at once, and Git was running within weeks. Almost every software team — including teams writing rocket software — now keeps its history in Git or something like it. Sites such as GitHub and GitLab host Git histories online and add the review tools this lesson describes.
:::

::: context main-line A trunk with branches
Engineers picture the shared history as a line of commits, often called **main** (older projects say "master" or "trunk"). To make a change, you start a **branch** — your own side line — make your commits there, get them reviewed, and then **merge** them back. The main line only ever receives reviewed, tested work, so it stays buildable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="40" x2="340" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="40" cy="40" r="8" fill="#1d6fd1"/>
  <circle cx="100" cy="40" r="8" fill="#1d6fd1"/>
  <circle cx="220" cy="40" r="8" fill="#1d6fd1"/>
  <circle cx="300" cy="40" r="9" fill="#ffffff" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M100 40 L140 90 L240 90 L300 40" fill="none" stroke="#f2b880" stroke-width="2"/>
  <circle cx="160" cy="90" r="8" fill="#f2b880"/>
  <circle cx="220" cy="90" r="8" fill="#f2b880"/>
  <text x="20" y="22" font-size="12" fill="#1f2a44">main (always builds)</text>
  <text x="150" y="118" font-size="12" fill="#1f2a44">your branch: 2 commits</text>
  <text x="312" y="74" font-size="12" fill="#1f2a44">merge</text>
  <text x="300" y="22" font-size="11" fill="#6c7a93" text-anchor="middle">after review</text>
</svg>
```
:::

::: context diff-reading What a diff looks like
A **diff** (short for "difference") shows two versions of a file side by side, or one above the other, and marks only what changed. Removed lines start with a minus sign and are usually shown in red. Added lines start with a plus sign and are shown in green. Unchanged lines nearby are shown plain, for context. For the sensor bug, the fix's diff would be two lines: the old `for` line with a minus, and the corrected one with a plus. Reviewers spend a large part of their week reading diffs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="90" rx="6" fill="#ffffff" stroke="#6c7a93" stroke-width="1"/>
  <text x="20" y="32" font-size="12" fill="#6c7a93">  def select_active_sensor(readings, valid):</text>
  <rect x="12" y="41" width="336" height="20" fill="#b4232c" fill-opacity="0.12"/>
  <text x="20" y="56" font-size="12" fill="#b4232c">-     for i in range(len(readings) - 1):</text>
  <rect x="12" y="63" width="336" height="20" fill="#8fb8f0" fill-opacity="0.35"/>
  <text x="20" y="78" font-size="12" fill="#1d6fd1">+     for i in range(len(readings)):</text>
  <text x="20" y="96" font-size="12" fill="#6c7a93">          if valid[i]:</text>
</svg>
```

Here the added line is drawn in blue rather than green.
:::

::: context regression-word Why "regression"
To **regress** means to slip back to an earlier, worse state. A **regression** in software is a bug that was fixed, or a feature that worked, and then breaks again because of some later change. A regression test is a guard posted at the spot where something once went wrong. The previous lesson showed a whole suite of them running automatically on every change, so the same mistake cannot sneak back in unnoticed.
:::

::: context two-am-review The anomaly at 2 a.m.
An **anomaly** is anything a vehicle does that nobody expected. When one shows up during a mission, the team works it right away, whatever the hour. The engineer on duty may be looking at code they have never read before. Clear names, a comment saying *why* a line exists, and a test showing what the code is supposed to do are what let that person act safely and fast. That is why "someone else could modify it at 2 a.m." sits inside the definition of production quality.
:::

::: context supervisor Why a restart is usually enough
Servers are often run under a **supervisor**: a small program that notices when the main program has died and starts it again within a second or two. Users might see one failed page load and never know anything happened. Because of this, a lot of ordinary software is built to "fail fast and restart." Flight code cannot rely on that. Even if a flight computer could reboot, the vehicle keeps moving during those seconds, so the moment of the fault has already done its damage.
:::

::: context off-by-one The fencepost problem
Off-by-one bugs are so common they have a nickname: **fencepost errors**. A fence 4 sections long needs 5 posts, not 4. Counting "sections" when you meant "posts" (or the reverse) puts you one out. In Python, `range(n)` gives the $n$ numbers $0, 1, \dots, n-1$. Writing `range(n - 1)` gives only $n - 1$ of them and silently drops the last.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="4">
    <line x1="40" y1="45" x2="320" y2="45"/>
    <line x1="40" y1="65" x2="320" y2="65"/>
  </g>
  <g fill="#1f2a44">
    <rect x="34" y="30" width="12" height="50"/>
    <rect x="104" y="30" width="12" height="50"/>
    <rect x="174" y="30" width="12" height="50"/>
    <rect x="244" y="30" width="12" height="50"/>
    <rect x="314" y="30" width="12" height="50"/>
  </g>
  <g font-size="12" fill="#1d6fd1" text-anchor="middle">
    <text x="75" y="22">1</text><text x="145" y="22">2</text><text x="215" y="22">3</text><text x="285" y="22">4</text>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="98">1</text><text x="110" y="98">2</text><text x="180" y="98">3</text><text x="250" y="98">4</text><text x="320" y="98">5</text>
  </g>
  <text x="352" y="22" font-size="11" fill="#1d6fd1" text-anchor="end">sections</text>
</svg>
```

The blue numbers count the 4 sections; the dark numbers count the 5 posts.
:::

::: context pull-request Asking to be pulled in
The name comes from Git: you ask the project to **pull** your branch's commits into its main line. GitHub made "pull request" (often shortened to PR) the everyday term; GitLab calls the same thing a "merge request". Either way it is a page holding the diff, the description, the test results and a comment thread where the reviewer and author discuss the change line by line until it is approved.
:::
