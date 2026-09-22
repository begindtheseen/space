---
id: l09-tickets-traceability-and-the-unglamorous-majority
title: "Tickets, traceability, and the unglamorous majority of the work"
minutes: 16
covers:
  - continuous integration for rocket and simulation software
---

Most working days in this field are not spent deriving a new control law. They are spent finding out why a build went red overnight, reproducing a result someone else reported three months ago so it can be trusted again, tracking a specific behavior back to the ticket and requirement that justify it, and writing down what was actually done clearly enough that the next reader — often the same engineer, months later — can reconstruct it without guessing. None of this is a distraction from the real work. It is the majority of the real work, and this lesson is about the four pieces of it that show up daily: continuous integration, regression suites, traceability, and reproducing a result.

## Continuous integration: a machine checks every change, before a person has to

Continuous integration, in its plainest form, is an automated system that builds the codebase and runs some or all of its test suite automatically whenever a change is proposed, rather than waiting for a person to remember to do it. Paired with a build system that knows the dependency graph, as the earlier lesson on infrastructure described, this means every proposed change gets checked against exactly the tests it could plausibly affect, automatically, within minutes — instead of a defect surviving until someone happens to run the right test by hand, which might be days or weeks later, long after the change that caused it has been forgotten.

The reason this matters more here than in a lot of software is the cost curve on the other side of a missed defect. In flight software the cost is immediate and unambiguous. It is equally real, if less immediately dramatic, in simulation software: a wrong result from a simulation with an undetected bug does not announce itself as a crash — it produces a plausible-looking number that becomes the basis for a design decision, and by the time anyone discovers the bug, real engineering choices may already have been made on top of it. Both cases share the same lesson from earlier in this module — a plausible-looking result is not evidence of correctness — applied at the scale of an entire test suite instead of a single function.

A build that fails — turns "red" — is treated as urgent specifically because of what accumulating red builds costs later. If failures are allowed to pile up, nobody can tell, days afterward, which of several intervening changes actually caused which failure; the entire value of running tests on every change, which is precisely being able to attribute a new failure to a specific, recent, identifiable cause, is lost the moment more than one unexamined change sits on top of a known-broken build. This is why the norm in most serious engineering organizations is to treat a red build as the team's most urgent open problem, not as one item in a backlog.

::: key
Continuous integration runs the test suite automatically on every proposed change, catching a defect within minutes instead of relying on someone eventually running the right test by hand. A red build is urgent specifically because attributing a failure to its cause depends on fixing it before further changes obscure which one was responsible.
:::

## What a regression test actually claims — and what it does not

A regression test's claim is narrower than it sounds, and the difference matters. It does not claim "this code is correct" — it claims "this specific, recorded behavior, at these specific inputs, has not silently changed." Those are different statements: a regression test built from golden values that were themselves wrong will happily keep confirming the wrong answer forever, because a regression test's entire job is detecting drift from a recorded baseline, not verifying that the baseline was right in the first place. Verification and validation, from an earlier lesson in this module, establish that the baseline is trustworthy; a regression suite's job, once that baseline exists, is making sure nobody moves away from it without that move being deliberate and reviewed.

::: example A subtle "cleanup" a regression test catches
A gain-scheduling function looks up a control gain for the current altitude by linearly interpolating a small table of control points:

```python
import numpy as np
TABLE_ALT = np.array([0, 2000, 5000, 10000, 20000])
TABLE_GAIN = np.array([0.80, 0.95, 1.20, 1.05, 0.70])

def gain_v1(alt_m):
    return float(np.interp(alt_m, TABLE_ALT, TABLE_GAIN))
```

Golden values, captured from this shipped version at several altitudes:

```python
test_altitudes = [0, 1000, 3500, 7500, 15000, 20000]
golden = {alt: round(gain_v1(alt), 6) for alt in test_altitudes}
# {0: 0.8, 1000: 0.875, 3500: 1.075, 7500: 1.125, 15000: 0.875, 20000: 0.7}
```

A later "cleanup" replaces the interpolation with a snap to the nearest control point — a change that looks harmless, and passes a quick glance at the two functions:

```python
def gain_v2(alt_m):
    idx = int(np.argmin(np.abs(TABLE_ALT - alt_m)))
    return float(TABLE_GAIN[idx])
```

Run against the recorded golden values, the regression test tells a precise story:

```text
alt=     0.0 m  golden=0.800000  got=0.800000  [PASS]
alt=  1000.0 m  golden=0.875000  got=0.800000  [FAIL]
alt=  3500.0 m  golden=1.075000  got=0.950000  [FAIL]
alt=  7500.0 m  golden=1.125000  got=1.200000  [FAIL]
alt= 15000.0 m  golden=0.875000  got=1.050000  [FAIL]
alt= 20000.0 m  golden=0.700000  got=0.700000  [PASS]
```

Four of six cases fail — and the two that pass are exactly the two altitudes that happen to sit precisely on a table entry, where interpolation and nearest-neighbor selection necessarily agree. Every altitude *between* table points, which is most of the real flight envelope, is now silently wrong. A reviewer skimming the diff, or a test suite that only happened to check round, on-the-table altitudes, would never have caught this; a regression test built specifically to include in-between altitudes catches it immediately, and re-running the identical test against the original, unchanged `gain_v1` confirms zero failures — proof that the test itself, not some unrelated flakiness, is what is responding to the change.
:::

This example is exactly why a regression suite's value depends on choosing test points deliberately, the same lesson from earlier in this module about choosing boundary and sign cases rather than convenient ones: a suite that only checks the easy, round-number cases will pass right through a defect that lives specifically in the cases nobody thought to check.

## Traceability: why an analysis nobody can reproduce is not evidence

A ticket, in the sense used throughout this lesson, is a recorded, specific claim: what was observed, under what conditions, what was expected instead. It is the unit that a fix, a test, and eventually a requirement all trace back to — and traceability is exactly that connective structure, in both directions: from a piece of code or a test back to the ticket or requirement that justified its existence, and from a requirement forward to the specific tests that demonstrate it is actually met.

This matters most sharply when an analysis is presented as evidence for a decision — a claim that a design meets a requirement, that a proposed fix resolves an observed problem, that a dispersion campaign's result supports flight readiness. An analysis that cannot be reproduced by anyone other than the person who ran it once is not evidence in any durable sense, regardless of how careful that person privately believes they were. If the inputs, the exact code version, the configuration and — where randomness is involved, as in the dispersion campaigns from an earlier lesson — the seed were not recorded, nobody can check the claim later, including its own author once enough time has passed to forget the details. "I ran it and it looked fine" is not a stand-in for a recorded, reproducible result; it is closer to a rumor with an authoritative tone.

::: example What "reproducible" actually requires
An unseeded random process gives a different answer every time it runs, even with identical code, because nothing pins down which sequence of random values it uses:

```text
$ python3 -c "import numpy as np; print(np.random.default_rng().integers(0,1_000_000,4))"
run A: [577604 157224 700588 421039]

$ python3 -c "import numpy as np; print(np.random.default_rng().integers(0,1_000_000,4))"
run B: [  9756 341218 853867  57405]
```

The same code, run twice, gives two different results — neither one is wrong, but neither one is reproducible, and a colleague handed only "I got roughly these numbers" has no way to check either run. Seeding the generator changes this completely:

```text
$ python3 -c "import numpy as np; print(np.random.default_rng(20260922).integers(0,1_000_000,4))"
run A: [713397 991821 897099 869218]

$ python3 -c "import numpy as np; print(np.random.default_rng(20260922).integers(0,1_000_000,4))"
run B: [713397 991821 897099 869218]
```

With the seed fixed and recorded, two independent runs — in two entirely separate processes — produce identical output, every time. Reproducing a colleague's stated result requires exactly the pieces that make this second version checkable: the same code (or a recorded version identifier for it), the same configuration, and, whenever randomness is involved, the same seed, all written down at the time the result was produced rather than reconstructed from memory afterward.
:::

::: warning "It's in my head" is not a substitute for a written record
A result that only its author can explain, because the specific inputs and configuration were never written down, is not durable evidence — it is a claim that expires the moment its author forgets the details or leaves the team. Writing the record down at the time, not after being asked for it, is the entire difference between an analysis and a rumor.
:::

## Check yourself

::: check
Explain what a "red" continuous integration build means and why merging further changes on top of a known-red build is specifically harmful, not only generally sloppy.
:::

::: answer
A red build means the automated test suite found at least one failure in the current state of the codebase. Merging further changes on top of it is specifically harmful because it destroys the ability to attribute the failure to a specific cause: once more than one unexamined change sits on top of a known-broken build, nobody can tell which of them actually introduced the problem, which defeats the entire purpose of running tests on every change in the first place — quick, specific attribution of a new failure to a recent, identifiable cause.
:::

::: check
State precisely what a passing regression test claims, and explain why that claim is narrower than "this code is correct."
:::

::: answer
A passing regression test claims that a specific, previously recorded behavior at specific inputs has not changed since the baseline was captured. It does not claim the baseline itself was correct — if the golden values were wrong when recorded, a regression test built from them will keep confirming the wrong answer indefinitely, because its job is detecting drift from a recorded value, not independently verifying that the recorded value was right. Establishing that the baseline is trustworthy is a separate task, handled by verification and validation.
:::

::: check
In the gain-schedule example, explain exactly which test cases failed and which passed, and what that specific pattern reveals about where this class of bug hides.
:::

::: answer
The cases at altitude 0 and 20,000 passed because those altitudes sit exactly on a table control point, where linear interpolation and nearest-neighbor selection necessarily produce the same value. The four cases at 1,000, 3,500, 7,500 and 15,000 — all strictly between table points — failed, because that is exactly where interpolation and nearest-neighbor selection diverge. This reveals that the bug hides specifically in the "in-between" cases, which is why a test suite that only checks convenient, round, on-the-table values would never have caught it.
:::

::: check
Define traceability and explain why "an analysis nobody can reproduce is not evidence" follows directly from it.
:::

::: answer
Traceability is the ability to connect a piece of code, a test, or a result back to the specific ticket or requirement that justified it, and forward from a requirement to the tests that demonstrate it is met. An analysis that cannot be reproduced breaks this connection at its foundation: if nobody, including its own author later, can rerun it and get the same answer, then there is nothing to actually trace a requirement's satisfaction back to except an unverifiable claim — which is not the kind of thing traceability, or an engineering decision built on it, can rest on.
:::

::: check
Using the seeded-versus-unseeded example, list specifically what would need to be recorded in a ticket or lab notebook entry for a colleague to actually reproduce a stated numeric result.
:::

::: answer
At minimum: the exact code or a recorded version identifier for it, the configuration or parameters used, and, whenever any randomness is involved, the specific seed value — all recorded at the time the result was produced. The unseeded example shows that without a recorded seed, even identical code produces a different answer on every run, so "the same code" alone is not sufficient; the seed is exactly the missing piece that turns "I got roughly this number once" into "run this, and you will get exactly this number."
:::

## Summary

| Term | What it means |
| --- | --- |
| Continuous integration | Automated build and test on every proposed change, catching defects within minutes |
| Red build | A failing build state, treated as urgent because delay destroys attribution to a specific cause |
| Regression test | Confirms a specific recorded behavior has not drifted; does not itself prove the baseline was correct |
| Ticket | A recorded, specific claim that a fix, test, and requirement can be traced back to |
| Traceability | The connection, in both directions, between code or a result and the requirement it satisfies |
| Reproducibility | Same code, same configuration, same seed, recorded at the time — required for a result to count as evidence |

The next lesson looks at the human side of this same process: version control at scale, and what a reviewer of flight code is actually checking for when your change reaches them.
