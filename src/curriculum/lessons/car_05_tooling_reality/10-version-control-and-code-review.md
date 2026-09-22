---
id: l10-version-control-and-code-review
title: "Version control, code review, and what a reviewer is checking"
minutes: 18
covers:
  - version control, code review and what production-quality means at senior level
---

Ownership, from the first lesson in this module, does not mean working alone. It means the same person carries an algorithm from derivation through a tested, deployable implementation — and the mechanism that puts a second, careful set of eyes on that work, without needing a second team to reimplement it, is code review, sitting on top of a shared version-controlled history. This lesson is about both halves: what changes about working in a shared history once a codebase is large and safety-relevant, and — the part with more daily consequence — what an actual reviewer of flight or simulation code is checking for, which is rarely limited to "does this compile and pass the tests the author happened to write."

## Version control at scale: small, attributable, always-buildable

Version control's basic idea — a complete, searchable history of every change, who made it, and why — does not change between a solo project and a large shared codebase. What changes is which properties of that history actually matter once many engineers share it and its output is safety-relevant.

A change proposed against a shared history is easiest to review, and easiest to reason about later, when it is small and does one identifiable thing, described clearly enough to connect it back to the ticket or requirement that justified it — exactly the traceability the previous lesson described. A large, sprawling change that touches many unrelated things at once defeats review by simple volume, regardless of how careful the reviewer is, because a person can hold a few hundred lines of focused change in their head at once and cannot do the same for several thousand lines mixing three unrelated concerns. The shared main line of history is also expected to stay in a known-good, buildable, passing state — the direct consequence of the previous lesson's point about red builds — because the entire value of a searchable history is being able to find exactly when and why a specific line changed, which becomes far harder once "broken" states are mixed in with "working" ones and nobody can immediately tell which is which from the history alone.

## What a reviewer of flight or simulation code is actually checking

A reviewer's job is not reading a diff to confirm it looks reasonable. It is checking several specific, separable things, most of which trace directly back to ideas from earlier in this module:

**Correctness against the actual requirement.** Not "does this code do something sensible," but "does this code do the specific thing the ticket or requirement says it should," which requires the reviewer to know what that requirement was — the traceability from the previous lesson, working as intended.

**Whether the change includes the test that would have caught the problem it fixes.** This is one of the sharpest, most concrete questions a reviewer asks, and it is worth stating precisely: if a change fixes a bug, and the change does not also add a test that would have failed against the old, buggy code and now passes against the fix, there is no durable evidence the bug is actually fixed rather than merely no-longer-visible in whatever the author happened to try by hand. A fix without a regression test is a claim; a fix with one is evidence.

**Resource bounds, for anything touching the control path.** New heap allocation, a loop whose bound is not a compile-time constant, an exception that can escape into a real-time boundary — every constraint from the lesson on the machine and the deadline is something a reviewer is specifically watching for, because none of those defects announce themselves in a quick read; they have to be checked deliberately.

**Units and frames made explicit.** Whether a changed interface still names its units and frame unambiguously, and whether a boundary test exists for exactly the kind of silent, plausible-looking error the data-discipline lesson described.

**Whether someone else could safely modify this later.** Not whether the code is clever, but whether a different engineer — or the same one, months later, during a live anomaly at an inconvenient hour — could read it, understand what it does and why, and change it without first having to reverse-engineer the author's original reasoning from scratch.

::: key
A reviewer of flight or simulation code checks correctness against a traceable requirement, whether the change includes the test that would have caught the bug it fixes, resource bounds in anything touching the control path, explicit units and frames, and whether someone other than the author could safely modify the result later. None of these is optional, and none of them is visible from "it compiles and the diff looks reasonable."
:::

## What "production quality" means at senior level, stated concretely

"Production quality" is easy to nod along with and hard to pin down, so it is worth stating in a form specific enough to actually check against: code that has been reviewed by someone other than its author, that carries unit tests covering its boundary and sign cases, that behaves deterministically within a bounded execution time if it sits anywhere near the control path, that is documented well enough for a different engineer to modify correctly during a real anomaly at two in the morning without first tracking down the original author, and that runs somewhere a defect cannot be fixed by restarting the process and hoping for the best.

That last clause is doing real work and is worth dwelling on. A huge amount of ordinary software tolerates a defect because the cost of failure is a restart — a web server that crashes gets relaunched by its supervisor process, a script that throws gets rerun. A vehicle in flight is not running anywhere you can restart it into a better state; whatever the code does in the moment a fault occurs is, for practical purposes, what actually happens. That single difference is why every constraint elsewhere in this module — bounded execution time, no dynamic allocation in the control path, explicit fault handling instead of exceptions, redundancy and voting — is not excess caution. It is the direct consequence of "we cannot restart our way out of a bad moment," applied consistently across the whole system.

::: example An off-by-one a reviewer catches by asking about the edge
A function selects which of three redundant sensors to trust, given a validity flag for each:

```python
def select_active_sensor(readings, valid):
    for i in range(len(readings) - 1):   # off by one: never checks the last index
        if valid[i]:
            return i
    return -1
```

The author's own tests pass: with all three sensors good, or only the first good, the function correctly returns index 0. A reviewer, having internalized the habit from earlier in this module of specifically checking boundary and sign cases rather than accepting whatever cases the author happened to try, asks one direct question: "what happens if only the last sensor is still good?" Run against exactly that case:

```python
readings = [12.1, 12.3, 12.0]
print(select_active_sensor(readings, [False, False, True]))
# -1
```

The function reports no valid sensor at all, despite one genuinely being available — because `range(len(readings) - 1)` never examines the last index. In a system built around redundancy specifically so that losing two of three sensors is survivable, this defect silently defeats exactly the scenario the redundancy exists to handle. The fix is one character, `range(len(readings))` instead of `range(len(readings) - 1)`, and the review comment that found it was not a close reading of every line — it was a single, specific, boundary-focused question, the same kind this module has been building as a habit since its first lesson.
:::

::: example Two reviewers, one pull request
A change adds a new sensor-fusion path and includes a short description, passing tests, and a diff of moderate size. One reviewer reads the diff top to bottom, confirms it compiles, confirms the included tests pass, and approves it within a few minutes. A second reviewer, looking at the same change, asks three specific questions before approving anything: which requirement does this satisfy, and is that stated in the ticket the change references; does the included test cover the case where the new sensor disagrees with the existing ones, not only the case where it agrees; and does anything in the new path allocate memory or use an unbounded loop, given that this function sits inside the same control loop discussed earlier in this module.

The first review is not worthless — a broken build or a clearly wrong diff would still be caught — but it checks only what is visible from reading the change as prose. The second review checks exactly the things that do not announce themselves on a casual read: traceability to a requirement, coverage of the case most likely to reveal a real defect, and the resource-bound constraints this field's flight code actually has to satisfy. The difference between the two is not effort in some vague sense; it is a specific, learnable list of questions, most of which this module has already given you by name.
:::

## Check yourself

::: check
Name at least four specific things a reviewer of flight or simulation code checks for, beyond confirming the change compiles and its own tests pass.
:::

::: answer
Correctness against the actual, traceable requirement rather than a general impression of reasonableness; whether the change includes the test that would have caught the bug it fixes; resource bounds — no new heap allocation, no unbounded loop, no escaping exception — in anything touching the control path; explicit units and frames at any changed interface; and whether a different engineer could safely read and modify the result later without reconstructing the author's reasoning from scratch.
:::

::: check
In the sensor-selection example, explain what specific question exposed the bug, and why the fact that the author's own tests passed was not sufficient evidence the function was correct.
:::

::: answer
The exposing question was a direct boundary check: what happens if only the last sensor is still valid? The author's own tests covered "all three good" and "only the first good," both of which happen to return the correct answer even with the off-by-one bug present, because the loop only fails to examine the very last index — a case neither of the author's tests exercised. Passing tests only demonstrate correctness for the specific cases those tests cover; they say nothing about a case, like this one, that nobody thought to write a test for.
:::

::: check
State the concrete definition of "production quality at senior level" given in this lesson, and explain why "cannot be fixed by a restart" is the right property to contrast it against.
:::

::: answer
Production quality means code that has been reviewed by someone other than its author, carries unit tests covering boundary and sign cases, behaves deterministically within a bounded execution time near the control path, is documented well enough for a different engineer to modify correctly during a real anomaly, and runs somewhere a defect cannot be resolved by restarting the process. "Cannot be fixed by a restart" is the right contrast because a great deal of ordinary software tolerates real defects precisely because a crash-and-relaunch is an acceptable recovery; a vehicle in flight has no equivalent fallback, so whatever the code actually does in the moment a fault occurs is, practically speaking, the entire outcome — which is why every resource-bound and fault-handling constraint elsewhere in this module exists.
:::

::: check
Explain specifically why a reviewer asks "does this change include the test that would have caught the bug it fixes," rather than only asking "does this fix the bug."
:::

::: answer
"Does this fix the bug" can be answered by the author trying the specific case they noticed and confirming it now behaves correctly, which demonstrates the fix works for that one case but leaves no durable, checkable evidence and no protection against the same defect being silently reintroduced later. A test that fails against the old code and passes against the fix is evidence anyone can rerun at any point in the future, and it becomes a permanent part of the regression suite discussed in the previous lesson, turning a one-time claim into a standing, automatically enforced check.
:::

::: check
Explain how the version-control practice of keeping changes small and focused connects to a reviewer's ability to actually perform the checks described in this lesson.
:::

::: answer
Every check this lesson describes — tracing correctness to a requirement, confirming a fix's test actually covers the bug, checking resource bounds, checking units and frames, judging whether the result is maintainable — requires the reviewer to genuinely understand the change, and a person can hold a small, focused change in their head well enough to check all of that, but cannot do the same for a large change mixing several unrelated concerns at once. A sprawling change does not only take longer to review; past a certain size it defeats careful review entirely, regardless of the reviewer's diligence, which is why small, single-purpose changes are a review practice and not merely a version-control tidiness preference.
:::

## Summary

| Concept | What it means |
| --- | --- |
| Small, focused change | A change a reviewer can actually hold in mind well enough to check thoroughly |
| Always-buildable main line | A shared history where "broken" and "working" states are never ambiguous |
| Fix without its test | A one-time claim, not durable evidence the defect is actually resolved |
| Production quality (senior level) | Reviewed, tested at its boundaries, bounded in resource use, documented for 2 a.m., not recoverable by a restart |
| "Not recoverable by a restart" | The property that makes every resource-bound and fault-handling constraint in this module non-negotiable |

The next lesson turns to what you can actually practice now, alone, that carries directly into this kind of work: reading unfamiliar code, writing the test before the fix, and keeping a record good enough for someone else to trust.
