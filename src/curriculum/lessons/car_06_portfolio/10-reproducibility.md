---
id: l10-reproducibility
title: "Reproducibility: seeded, one command, pinned, CI"
minutes: 18
covers:
  - "reproducibility: seeded, one-command, CI, pinned dependencies"
---

The first lesson in this module named reproducible as one of the five words a portfolio project is judged by, and defined it plainly: a stranger can get your result themselves, from your repository, without asking you anything. This lesson makes that definition operational. Four specific things have to be true simultaneously — every random draw is seeded, every dependency is pinned to an exact version, one command regenerates every number and figure the write-up quotes, and continuous integration runs that command on every change — and this lesson covers each one with a concrete failure it prevents, including one that is not hypothetical: a real, current break this exact curriculum's own tooling had to account for.

## Seeded: two runs, identical output

A stochastic result — a Monte Carlo dispersion campaign, a filter's Monte Carlo consistency test — has to produce the same numbers on a second run for a reviewer to check anything you quoted against their own execution. That requires an explicit, recorded seed passed to every random draw in the project, not left to whatever default state the random number generator happens to be in.

::: example Seeding actually eliminates run-to-run variation
```python
import numpy as np
rng1 = np.random.default_rng(42)
rng2 = np.random.default_rng(42)
print(np.array_equal(rng1.normal(size=5), rng2.normal(size=5)))
# True
```
Two independently created generators, seeded identically, produce bit-identical output. A project whose README states "seed 42" and whose one-command entry point actually passes that seed through to every stochastic component gives a reviewer the exact numbers you quoted, not numbers merely close to them — and "close to them" is not a check anyone can perform with any precision.
:::

::: warning
A seed set once, globally, at the top of a script (`np.random.seed(42)`) is fragile the moment any part of the code creates its own generator, imports a library that draws random numbers internally, or runs anything in a different order across two executions — all of which silently change what the global state produces at the point your code reads from it. Pass an explicit generator object through the code that needs it, as above, rather than relying on hidden global state.
:::

## Pinned dependencies: a break that already happened

An unpinned dependency — `numpy` with no version in `requirements.txt` — means your code runs against whatever version is installed on the machine that happens to run it, which is not the version you tested against, and libraries change behavior across versions in ways that silently break working code.

::: example A real break, not a hypothetical one
NumPy 2.0 removed `ndarray.ptp()` as a method. Code written and tested against NumPy 1.x that calls `arr.ptp()` runs correctly for its author and then breaks for anyone who installs it fresh today:

```python
import numpy as np
print(np.__version__)          # 2.4.6
a = np.array([1.0, 5.0, 3.0])
a.ptp()                        # AttributeError: 'numpy.ndarray' object has no attribute 'ptp'
np.ptp(a)                      # 4.0 — the function form still works
```

This is not a contrived example — it is the actual, current, reproducible behavior of NumPy 2.4.6, checked directly. A `requirements.txt` line reading `numpy` with no version constraint gives a stranger no way to know which of these two behaviors your code was written against; a line reading `numpy==2.4.6` (or a lower bound consistent with when the code was written) does. Pinning is not caution for its own sake — it is the difference between a bug report that makes sense and one where "it worked when I wrote it" is the only available explanation.
:::

Pin every dependency your project actually imports, to the specific version you tested against — a `requirements.txt` with exact versions, or a lock file if your tooling produces one — and note the language and interpreter version too, since the same class of break happens there as well.

## One command: every number and figure, regenerated

The write-up quotes specific numbers — a conserved-energy tolerance, a NEES mean, a landing-accuracy percentile. A stranger checking your work should be able to regenerate every one of them with a single command, not a sequence of manual steps recalled from memory or buried three paragraphs into the README.

```text
make verify      # runs every test in tests/, including the analytic-case
                  # and conservation checks this module's verification lesson covers
make results     # regenerates results/*.csv and every number the README quotes,
                  # from the seed stated in the README
```

"One command" means specifically this: a reviewer with a fresh clone and nothing else runs one line, and the exact numbers in your write-up come back out. If reproducing your headline result requires a sequence of manual steps, an undocumented environment variable, or a file that exists only on your machine, the result is not currently reproducible, regardless of how carefully the underlying code was written — reproducibility is a property of the whole path from a clean checkout to the number, not of the code in isolation.

## CI: proof it still works now, not only once

A continuous-integration workflow runs your test suite — including the verification checks from earlier in this module — automatically on every push, which answers a question a README alone cannot: does this still work today, on a machine that is not yours, or only on the machine and the moment you last happened to run it by hand.

```yaml
name: tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt
      - run: pytest tests/
```

A green badge on the repository is a claim a reviewer can trust without running anything themselves, precisely because it was generated by a machine that is not yours, running on a schedule you do not control — the same reason a result independently cross-checked in an earlier lesson of this module was stronger evidence than the same result checked only by its own author.

::: key
Reproducibility is seeded random draws passed explicitly (not left to hidden global state), dependencies pinned to the exact versions tested against, one command that regenerates every quoted number and figure from a clean checkout, and CI that runs the tests on a machine that is not yours. All four, together — a project with three of the four is not reproducible, it is reproducible-sounding.
:::

## Why this is not a nicety layered on top of the real work

Every other claim this module has covered — a conservation check to a stated tolerance, a NEES mean inside its band, a landing-accuracy distribution — is only as trustworthy as a reviewer's ability to check it independently, and reproducibility is precisely what makes that checking possible without asking the author anything. A verification section with no reproducible path to the numbers it quotes is a claim resting entirely on trust in the author, which is exactly the position a self-taught candidate with no institutional credential behind them can least afford to ask a reviewer to take. The test this module's exercises pose is the honest one: delete your local environment, clone the repository fresh onto a different machine, run the one command, and confirm the output matches what the README claims. If it does not, the write-up's other sections are claims, not yet evidence.

## Check yourself

::: check
Explain why calling `np.random.seed(42)` once at the top of a script is a weaker reproducibility guarantee than creating an explicit generator with `np.random.default_rng(42)` and passing it through every function that draws random numbers.
:::

::: answer
A single global seed call sets hidden global state that any subsequent random draw — from your own code, from a library you call, or from code that runs in a different order on a second execution — reads from and mutates, so the actual sequence of numbers a given line of code receives depends on everything that happened to draw from that same global state before it, which can change silently as the codebase grows or as execution order shifts. An explicit generator object passed directly to the code that needs it has no such hidden dependency: the same generator, given the same seed, in the same position in the code, produces the same output regardless of what else in the program does or does not also draw random numbers.
:::

::: check
A project's `requirements.txt` lists `numpy` with no version pin. Using the specific example from this lesson, explain concretely what could go wrong for someone who clones the repository today versus when it was originally written.
:::

::: answer
If the code was written and tested against NumPy 1.x and calls `arr.ptp()` as a method, it will run correctly for the original author but raise `AttributeError: 'numpy.ndarray' object has no attribute 'ptp'` for anyone installing today's default NumPy (2.x), since `ndarray.ptp()` was removed as a method in NumPy 2.0 — this is not a hypothetical, it is the actual, verified behavior of NumPy 2.4.6. An unpinned dependency means the installed version, and therefore the code's actual behavior, depends entirely on when and where it is installed rather than on anything the author controls or documents.
:::

::: check
What specifically does "one command" mean in this lesson, and why does a README that requires a reviewer to run three separate manual steps in a remembered order fail that standard even if each step is individually documented?
:::

::: answer
"One command" means a single invocation, from a clean checkout with nothing but the pinned dependencies installed, that regenerates every number and figure the write-up quotes. A three-step manual sequence fails the standard because it introduces exactly the class of failure reproducibility exists to remove: an undocumented ordering dependency, a step silently skipped, or an environment difference between what the author's manual process actually did and what the documentation describes — reproducibility is a property of the whole clean-checkout-to-number path, and a path with manual steps in it is not fully specified by documentation alone, no matter how carefully each step is written down.
:::

::: check
Why does a green CI badge carry more weight with a reviewer than a README sentence stating "all tests pass on my machine"?
:::

::: answer
"Passes on my machine" is a claim about a specific environment at a specific, past moment, verified by nobody but the author who wrote it — exactly the kind of unverifiable assertion this module has argued against throughout. A CI badge reflects an automated run, on a machine the author does not control, triggered by an actual push to the repository, so it is independent evidence generated by a process the reviewer can also inspect (the workflow file, the run logs) rather than a claim resting on trust in the author's own report of what happened on their own computer.
:::

::: check
A candidate argues that pinning dependencies is unnecessary because their project's code has not changed since it was written and still runs correctly for them. What is wrong with this reasoning as a case for reproducibility?
:::

::: answer
The code not changing says nothing about whether the *environment* it runs in has changed or will change for anyone else — a library update on a reviewer's machine, entirely outside the candidate's control or knowledge, can silently alter or break behavior the candidate never touched, exactly as the NumPy 2.0 removal of `ndarray.ptp()` did to code that called it as a method. "Still runs correctly for me" only confirms the code works in the one environment the author has not changed; it says nothing about what happens in the environment a reviewer will actually use, which is the only environment reproducibility is meant to guarantee against.
:::

## Summary

| Requirement | What it prevents |
| --- | --- |
| Seeded (explicit generator, not global state) | Run-to-run variation that makes a quoted number impossible to check |
| Pinned dependencies | Silent breakage from environment drift — verified here: `ndarray.ptp()` removed in NumPy 2.0, `np.ptp(arr)` still works |
| One command | Undocumented manual steps standing between a clean checkout and the numbers the write-up quotes |
| CI on every push | A claim resting only on trust in the author's own, unverifiable "it works for me" |

The next lesson turns from making a single project checkable to a question about the whole portfolio: what to do with work that cannot be shown at all, because it belongs to a previous employer or falls under export control.
