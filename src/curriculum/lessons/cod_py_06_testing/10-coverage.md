---
id: l10-coverage
title: Coverage, and why it is a floor
minutes: 19
covers:
  - Coverage with pytest-cov, and why coverage is a floor not a goal
---

Think about a school attendance sheet. At the end of the term it shows which classes each student sat in. If a student has a blank next to every chemistry class, you know for certain they missed chemistry. But a full row of check marks tells you much less. It says the student was in the room. It does not say they listened, took notes or passed the exam.

Test coverage is an attendance sheet for your code. **Coverage** is a record of which lines of your program actually ran while the test suite ran. A line that never ran was never tested, full stop. A line that did run might have been checked carefully, or it might have been run by a test that checks nothing at all. Coverage cannot tell the difference.

That makes coverage very good at one job and useless at another. It is excellent for finding code nobody tests. It is no evidence at all that code is correct. In aerospace this distinction is written into the rules: flight software standards demand that tests reach every line and every decision, and they also demand that every test trace back to a written requirement, because running a line and checking it are different things. This lesson shows you how to measure coverage with pytest, how to read the report, what the stronger kinds of coverage mean, and how to use the number without being fooled by it.

## Measuring which lines ran

Python cannot tell you by itself which lines ran. A separate tool, **[[coverage.py|coverage-py]]**, watches the interpreter as your tests run and writes down every line it executes. The plugin **pytest-cov** hooks that tool into pytest, so one command runs the tests and measures them together.

Here is a small module with three functions a guidance engineer might write. `throttle` cuts the engine to 70 percent when the **dynamic pressure** — the push of the oncoming air, in kilopascals — goes over a limit. `safe_to_ignite` checks the tank pressure and a valve. `clamp_gimbal` keeps the engine's steering angle, in degrees, under a limit.

```python
def throttle(q_kpa, q_max_kpa=35.0):
    """Throttle fraction for a given dynamic pressure."""
    if q_kpa > q_max_kpa:
        return 0.7
    return 1.0


def safe_to_ignite(tank_psi, valve_open):
    if tank_psi > 40.0 and valve_open:
        return True
    return False


def clamp_gimbal(angle_deg, limit_deg=5.0):
    out = angle_deg
    if angle_deg > limit_deg:
        out = limit_deg
    return out
```

Save that as `gnc.py`. Here are three tests, one per function, in `test_gnc.py`:

```python
from gnc import throttle, safe_to_ignite, clamp_gimbal


def test_throttle_nominal():
    assert throttle(20.0) == 1.0


def test_ignite_ready():
    assert safe_to_ignite(50.0, True)


def test_clamp_high():
    assert clamp_gimbal(8.0) == 5.0
```

Run pytest with `--cov=gnc`, which means "measure the module `gnc`", and `--cov-report=term-missing`, which means "print a table in the terminal, including the line numbers that were missed":

```text
$ pytest -q --cov=gnc --cov-report=term-missing
...                                                                      [100%]
Name     Stmts   Miss  Cover   Missing
--------------------------------------
gnc.py      13      2    85%   4, 11
--------------------------------------
TOTAL       13      2    85%
3 passed in 0.13s
```

Read the table one column at a time.

- **Stmts** is the number of **statements** — executable lines — in the file. The `def` lines count, because Python runs them when it imports the module. Blank lines, comments and docstrings do not count. Here there are $13$.
- **Miss** is how many of those never ran. Here, $2$.
- **Cover** is the fraction that did run: $(13 - 2)/13 = 11/13 \approx 0.846$, printed as $85\%$.
- **Missing** lists the line numbers that never ran. Line 4 is `return 0.7`: no test ever pushed the dynamic pressure over the limit. Line 11 is `return False`: no test ever tried a situation where ignition is unsafe.

That Missing column is the most useful thing coverage gives you. Both of those lines are the *safety* paths — the throttle-down and the refusal to ignite — and they are exactly the lines a real test suite must reach. Coverage found them in one run, without you reading a line of code.

::: key
**Line coverage** (also called statement coverage) is the fraction of executable lines that ran at least once during the tests. `pytest --cov=<module> --cov-report=term-missing` measures it and lists the missed line numbers.
:::

::: warning `--cov` eats the next word
`--cov` takes an optional value. If you write `pytest --cov test_gnc.py`, pytest-cov reads `test_gnc.py` as the thing to measure, not as the file to test, and you get a confusing "No data to report". Either write `--cov=gnc` with an equals sign, or put `--cov` last on the line.
:::

## Branch coverage: did each decision go both ways?

Look again at `clamp_gimbal`. The test `clamp_gimbal(8.0)` sends $8$ degrees in, which is over the $5$ degree limit. So the `if` is true, `out = limit_deg` runs, and the function returns $5$. Every line of the function ran. Line coverage for it is $100\%$.

But the `if` was only ever *true*. Nobody ever checked what happens when the angle is inside the limit and the `if` is skipped. A bug on that path — say someone had typed `return limit_deg` at the bottom instead of `return out` — would give $100\%$ line coverage and pass the test.

A **[[branch|branch-arrows]]** is one of the possible ways out of a decision: an `if` has a "true" way and a "false" way. **Branch coverage** asks whether each of those ways was taken at least once. Turn it on with `--cov-branch`:

```text
$ pytest -q --cov=gnc --cov-branch --cov-report=term-missing
...                                                                      [100%]
Name     Stmts   Miss Branch BrPart  Cover   Missing
----------------------------------------------------
gnc.py      13      2      6      3    74%   4, 11, 16->18
----------------------------------------------------
TOTAL       13      2      6      3    74%
3 passed in 0.13s
```

Two new columns appear.

- **Branch** is the number of possible branch exits. There are three `if` statements, each with two ways out, so $3 \times 2 = 6$.
- **BrPart** is the number of **partial** decisions — decisions where only one of the two ways was ever taken. All three `if`s are partial here.

The Missing column gains an entry written with an arrow: `16->18`. Read it as "the jump from line 16 to line 18 never happened". Line 16 is `if angle_deg > limit_deg:` and line 18 is `return out`, so this is the "false" way out, the one that skips the clamp. Line coverage could not see it. Branch coverage names it exactly.

::: key
**Branch coverage** asks whether every decision was taken both ways. It catches paths that line coverage misses, such as the "false" side of an `if` with no `else`. Turn it on with `--cov-branch`; a missed branch shows as `from->to` line numbers.
:::

::: example Working out the 74 percent
With branches on, coverage.py counts statements and branch exits together. It adds up what ran and divides by what could have run.

**Statements.** $13$ in total, $2$ missed, so $11$ ran.

**Branch exits.** $6$ in total. Three decisions are partial, and a partial decision took exactly one of its two ways, so each of them missed one exit. That is $3$ missed, and $6 - 3 = 3$ taken.

**Put them together.**

$$
\text{cover} = \frac{\text{statements run} + \text{branches taken}}{\text{statements} + \text{branches}} = \frac{11 + 3}{13 + 6} = \frac{14}{19} \approx 0.737.
$$

Rounded, that is the $74\%$ in the report.

**Sanity check.** Branch coverage came out *lower* than line coverage ($74\%$ against $85\%$). That is what you should expect: it asks a harder question, so the same tests score worse on it. If turning on branches ever makes your number go *up* by a lot, look again.
:::

## Conditions inside a decision: MC/DC

Branch coverage still has a blind spot, and it lives in decisions with more than one condition. Look at

```python
if tank_psi > 40.0 and valve_open:
```

Branch coverage is satisfied by two tests: one where the whole thing is true (pressure $50$, valve open) and one where it is false (pressure $10$, valve closed). But in that false test, *both* conditions were false at once. You never saw a case where the valve alone decided the answer. If someone deleted `and valve_open` by accident, both tests would still pass: $50 > 40$ is true, and $10 > 40$ is false.

**Modified condition/decision coverage**, **[[MC/DC|do-178c]]** for short, closes that gap. It asks that each condition be shown to change the outcome on its own, with the other conditions held still. For `A and B` you need three tests:

| Test | pressure > 40 (A) | valve open (B) | result |
| --- | --- | --- | --- |
| 1 | true | true | True |
| 2 | false | true | False |
| 3 | true | false | False |

Tests 1 and 2 differ only in A, and the result flips, so A matters. Tests 1 and 3 differ only in B, and the result flips, so B matters. For a decision with $n$ conditions joined by `and` or `or`, MC/DC usually needs $n + 1$ tests, far fewer than the $2^n$ rows of a full truth table.

coverage.py does not measure MC/DC. Tools for C and C++ flight code do, because the aviation software standard DO-178C requires MC/DC for its most critical level of software. In Python you get it by writing the table above as tests on purpose — a parametrized test, from lesson 3, is exactly the right shape.

::: key
**MC/DC** (modified condition/decision coverage) requires each condition in a decision to be shown to change the outcome independently. It is stronger than branch coverage; for $n$ conditions it usually needs $n + 1$ tests. coverage.py measures line and branch coverage, not MC/DC.
:::

## Running a line is not checking it

Here is the uncomfortable part. Add one more test file, `test_smoke.py`:

```python
from gnc import throttle, safe_to_ignite, clamp_gimbal


def test_runs_everything():
    throttle(50.0)
    safe_to_ignite(10.0, False)
    clamp_gimbal(2.0)
```

It calls each function once more and throws the answers away. There is no `assert` in it. Run the whole suite:

```text
$ pytest -q --cov=gnc --cov-branch --cov-report=term-missing
....                                                                     [100%]
Name     Stmts   Miss Branch BrPart  Cover   Missing
----------------------------------------------------
gnc.py      13      0      6      0   100%
----------------------------------------------------
TOTAL       13      0      6      0   100%
4 passed in 0.14s
```

Full line and branch coverage, from a test that checks nothing. The throttle-down path at line 4 now "has coverage", yet no test has ever confirmed that it returns $0.7$ rather than $0.07$ or $7$. A test with no assertion like this is called a **[[smoke test|smoke-test]]**: it only proves the code does not crash.

Now look for a problem coverage cannot even point at. A gimbal can swing both ways. What does `clamp_gimbal(-8.0)` return?

```python
from gnc import clamp_gimbal
print(clamp_gimbal(-8.0))   # -8.0
```

It returns $-8$ degrees, well past the $5$ degree limit in the other direction. The function has no lower clamp at all. Coverage is $100\%$, because coverage can only measure lines that exist. A missing requirement has no line to miss.

::: key
Coverage at 95 percent still does not let you conclude the code is correct. Coverage records executed lines, not checked behavior, and it says nothing about untested inputs, missing requirements or wrong tolerances. It is a floor for finding untested code, not evidence of correctness.
:::

::: warning Coverage as a target
When a team is rewarded for a coverage number, people write tests like `test_runs_everything`: they lift the number and check nothing. The saying for this is **[[Goodhart's law|goodhart]]** — when a measure becomes a target, it stops being a good measure. Review new tests by reading their assertions, not by watching the percentage.
:::

## Making sure the tests can fail

Back in lesson 1 you learned to break code on purpose and watch the suite go red. Coverage makes that habit even more important, because a green run at $100\%$ looks so reassuring.

Flip the comparison in `throttle` from `>` to `<`, a one-character sign error, and run only the smoke test:

```text
$ pytest -q --cov=gnc --cov-branch test_smoke.py
.                                                                        [100%]
1 passed in 0.13s
```

Green. The bug sails through. Now run the real tests:

```text
$ pytest -q test_gnc.py
F..                                                                      [100%]
    def test_throttle_nominal():
>       assert throttle(20.0) == 1.0
E       assert 0.7 == 1.0
E        +  where 0.7 = throttle(20.0)
FAILED test_gnc.py::test_throttle_nominal - assert 0.7 == 1.0
1 failed, 2 passed in 0.13s
```

Red, and the message points straight at the cause: at $20\,\mathrm{kPa}$, well under the limit, the throttle came back as $0.7$. Then you undo the flip.

This is the second half of how to use coverage. The report tells you which lines ran. The injected bug tells you whether running them meant anything. When a tool does the injecting for you, thousands of small bugs at a time, it is called **[[mutation testing|mutation-score]]**.

::: key
A deliberately injected sign error is the only way to know your tests can fail. Flip a sign, confirm the suite goes red and that the failure message points at the cause, then revert. A suite that never fails is measuring nothing.
:::

## Using the number well

None of this means coverage is useless. A low number is real news: large parts of the code were never run by any test. The right way to use it is as a **floor** — a minimum the project will not drop below — and as a map of where to write the next test.

Put the settings in `pyproject.toml`, so everyone on the team and the build server measure the same way:

```toml
[tool.coverage.run]
branch = true
source = ["gnc"]

[tool.coverage.report]
show_missing = true
fail_under = 90
```

`branch = true` turns on branch coverage every time. `source` says which code to measure. `fail_under = 90` makes the run fail if total coverage is under $90\%$, even when every test passed. Now a plain `pytest --cov` does the rest:

```text
$ pytest -q test_gnc.py --cov
gnc.py      13      2      6      3    74%   4, 11, 16->18
TOTAL       13      2      6      3    74%
FAIL Required test coverage of 90.0% not reached. Total coverage: 73.68%
3 passed in 0.18s
$ echo $?
1
```

Three tests passed, but the command still exits with code $1$, which is how a build server or a merge check knows to stop. With the smoke test included, the same command prints `Required test coverage of 90.0% reached` and exits with $0$.

Two more habits help.

- For a large, older codebase, use a **[[ratchet|ratchet]]**: set the floor at today's number and raise it whenever coverage goes up, so it can only move one way.
- If a line truly cannot run in tests — a guard for hardware that does not exist on a laptop, say — mark it with the comment `# pragma: no cover`. Use this rarely, and say why in the same comment. Every pragma is a line you have promised to test some other way.

`pytest --cov --cov-report=html` also writes a folder called `htmlcov` with each source file colored line by line: green for run, red for missed, yellow for partial branches. It is the fastest way to see *where* the gaps are, and it is what most people look at in review.

::: example A pull request that lowers coverage
A navigation package has $480$ statements, and the tests miss $36$ of them. The floor is set at $90\%$.

**Before.** Statements run: $480 - 36 = 444$. Coverage: $444 / 480 = 0.925$, so $92.5\%$. Above the floor.

**The change.** A pull request adds a new filter, $40$ statements, with tests that reach only $10$ of them. Now there are $480 + 40 = 520$ statements, and $444 + 10 = 454$ ran. Coverage: $454 / 520 \approx 0.873$, so $87.3\%$. The run fails the $90\%$ floor, even though every test passes.

**The fix that helps.** Test all $40$ new statements: $444 + 40 = 484$ ran, and $484 / 520 \approx 0.931$, so $93.1\%$.

**The fix that does not.** Add a smoke test that calls the new filter once and asserts nothing. The number goes up by the same amount. The floor did its job by flagging the untested code; only a person reading the new tests can tell which fix was made.
:::

## Check yourself

::: check
A module has $200$ statements, and a run reports `Miss` as $30$. What does `Cover` show with branch coverage off? Which column do you read first to decide what test to write next?
:::

::: answer
Statements run: $200 - 30 = 170$. Coverage: $170 / 200 = 0.85$, so $85\%$. Read the **Missing** column first: it lists the exact line numbers that never ran, which tells you which situations no test has tried yet. The percentage only says how much is missing, not where.
:::

::: check
A function is `def sign(x): r = 1; if x < 0: r = -1; return r`, written on separate lines. The only test is `assert sign(-3) == -1`. What are its line coverage and its branch coverage, and which one exposes the gap?
:::

::: answer
With $x = -3$ the `if` is true, so every line runs: `r = 1`, the `if`, `r = -1` and `return r`. Line coverage is $100\%$. But the `if` was never false, so the jump that skips `r = -1` never happened. Branch coverage reports that decision as partial, with a missing arrow from the `if` line to the `return` line. Branch coverage exposes the gap: nobody has checked that a positive number returns $1$.
:::

::: check
A decision reads `if armed and altitude_ok and not abort:`. How many tests does MC/DC usually need, and how many rows does the full truth table have?
:::

::: answer
There are $n = 3$ conditions. MC/DC usually needs $n + 1 = 4$ tests: one where the whole decision is true, and then, for each condition in turn, one that flips only that condition and shows the result flips. The full truth table has $2^3 = 8$ rows. MC/DC shows each condition matters without trying every combination.
:::

::: check
Your teammate's pull request raises coverage from $81\%$ to $97\%$. Name two things you still have to check by reading the tests, and why the number cannot tell you either.
:::

::: answer
First, that the new tests **assert** something meaningful: coverage counts a line as covered as soon as it runs, whether or not its result is checked, so a test with no assertions raises the number by the same amount. Second, that the tests check the right **behavior**, including cases the code does not handle at all, such as a negative input, and tolerances that are tight enough to matter. A missing requirement has no line in the code, so coverage cannot see it.
:::

::: check
Your `pyproject.toml` has `fail_under = 90`. A run prints `12 passed` and a total of $88.5\%$. What exit code does pytest return, and what does a build server do with it?
:::

::: answer
It returns exit code $1$, because the coverage floor was not reached, even though all $12$ tests passed. A build server or merge check treats any non-zero exit code as a failure, so the change is blocked until coverage is back at or above $90\%$ — ideally by testing the new code, not by adding assertion-free calls.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Line coverage | Fraction of statements that ran | $(\text{Stmts} - \text{Miss}) / \text{Stmts}$ |
| Missing column | Line numbers that never ran | The most useful part of the report |
| Branch coverage | Every decision taken both ways | `--cov-branch`; missed exits show as `from->to` |
| Combined percentage | Statements and branch exits together | $(\text{run} + \text{taken}) / (\text{Stmts} + \text{Branch})$ |
| MC/DC | Each condition shown to matter on its own | Usually $n + 1$ tests for $n$ conditions |
| Floor | Minimum the suite must reach | `fail_under` makes the run exit with code 1 |
| What coverage cannot see | Checked behavior, missing requirements, tolerances | Execution is not verification |
| Injected bug | Proof the suite can fail | Flip a sign, see red, revert |

Coverage tells you which code your tests never touched. The next lesson adds the tools that check code without running it at all: ruff, black and mypy, wired into pre-commit hooks so they run before every commit.

::: context coverage-py How the tool sees each line
Python lets a program install a **tracing hook**: a function the interpreter calls every time it is about to run a new line. coverage.py installs one, and each time it is called, it writes down the file name and the line number. When the tests finish, it compares that record with the list of executable lines in each file and prints the difference.

On Python 3.12 and later there is a newer, faster mechanism called `sys.monitoring` that coverage.py can use instead. Either way, measuring coverage slows the tests down somewhat, which is one reason people often run the fast suite without it and let the build server measure coverage.

coverage.py has been maintained for many years by Ned Batchelder. pytest-cov is a thin plugin that starts and stops it around a pytest run.
:::

::: context branch-arrows The two ways out of the clamp
Draw `clamp_gimbal` as boxes and arrows, one box per line, and every arrow is a jump the program might make. Line coverage asks whether every box was visited. Branch coverage asks whether every arrow leaving a decision was followed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="10" width="160" height="28" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="29" font-size="12" text-anchor="middle" fill="#1f2a44">15  out = angle_deg</text>
  <rect x="100" y="60" width="160" height="28" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="79" font-size="12" text-anchor="middle" fill="#1f2a44">16  if angle &gt; limit</text>
  <rect x="30" y="110" width="150" height="28" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="105" y="129" font-size="12" text-anchor="middle" fill="#1f2a44">17  out = limit_deg</text>
  <rect x="100" y="160" width="160" height="28" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="179" font-size="12" text-anchor="middle" fill="#1f2a44">18  return out</text>
  <line x1="180" y1="38" x2="180" y2="56" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="180,60 175,52 185,52" fill="#1d6fd1"/>
  <line x1="150" y1="88" x2="115" y2="106" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="111,108 116,100 121,108" fill="#1d6fd1"/>
  <text x="112" y="100" font-size="11" text-anchor="end" fill="#1d6fd1">true</text>
  <line x1="105" y1="138" x2="150" y2="156" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="154,158 145,158 149,151" fill="#1d6fd1"/>
  <path d="M 240 88 Q 290 124 240 156" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <polygon points="238,159 240,149 247,154" fill="#b4232c"/>
  <text x="272" y="118" font-size="11" fill="#b4232c">false</text>
  <text x="272" y="132" font-size="11" fill="#b4232c">16-&gt;18 missed</text>
</svg>
```

The test with $8$ degrees followed the blue path and visited all four boxes. The red arrow, the "false" way out of line 16, was never followed. That arrow is exactly what the report writes as `16->18`.
:::

::: context do-178c The rulebook that asks for MC/DC
**DO-178C** is the standard that aircraft software must meet to be certified. It sorts software into levels by what happens if it fails. Level A is software whose failure could be catastrophic, such as flight controls. It must reach MC/DC. Level B needs decision (branch) coverage, and Level C needs statement coverage.

MC/DC was designed as a compromise. Testing every combination of $n$ conditions takes $2^n$ tests, which becomes impossible fast: a decision with $10$ conditions would need $1024$. Showing each condition matters on its own takes about $n + 1 = 11$.

NASA's software engineering requirements ask for MC/DC on safety-critical flight software as well, and launch companies apply the same idea to their own flight code.
:::

::: context smoke-test Where the name comes from
The phrase comes from hardware. When engineers built a new circuit board or repaired a machine, the first test was to switch it on and see whether smoke came out. If nothing burned, it passed — which told you almost nothing about whether it worked correctly.

In software a **smoke test** is the same idea: call the code and confirm it does not crash. It is a fine first check for a new build, and a quick smoke run before a long test campaign can save time. It is not a unit test, because it asserts nothing about the answer.
:::

::: context goodhart When a number becomes the goal
The economist Charles Goodhart pointed out in the 1970s that when a statistic is used to steer policy, people start to game it, and it stops measuring what it used to. The version most people quote was put neatly by the anthropologist Marilyn Strathern: "When a measure becomes a target, it ceases to be a good measure."

Coverage is a textbook case. As a measurement it is honest: it tells you what ran. As a target it invites tests that run code without checking it, and the number rises while the safety it was meant to show does not.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="140" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">tests written over time</text>
  <text x="44" y="30" font-size="11" text-anchor="end" fill="#1f2a44">100%</text>
  <text x="44" y="143" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <polyline points="50,120 110,95 170,70 230,50 290,35 340,28" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polyline points="50,125 110,105 170,92 230,88 290,86 340,85" fill="none" stroke="#b4232c" stroke-width="3" stroke-dasharray="6 4"/>
  <text x="250" y="30" font-size="11" text-anchor="end" fill="#1d6fd1">coverage</text>
  <text x="335" y="104" font-size="11" text-anchor="end" fill="#b4232c">behavior checked</text>
</svg>
```

The blue line is what the dashboard shows. The red line is what you actually wanted, and it stalls once people start writing tests for the number.
:::

::: context mutation-score Mutation testing, counted
A mutation-testing tool makes many small copies of your code, each with one deliberate bug: a `>` turned into `>=`, a `+` into `-`, a constant nudged by one. Each copy is a **mutant**. It runs the suite against every mutant. If some test fails, the mutant is **killed**. If every test still passes, the mutant **survived**, and a survivor points at a line your tests run but do not really check.

The **mutation score** is the fraction killed. With $200$ mutants and $170$ killed, the score is $170/200 = 85\%$. For Python, `mutmut` and `cosmic-ray` are two such tools. They are slow — the suite runs once per mutant — so teams usually aim them at a few critical modules, such as a guidance law, rather than the whole codebase.
:::

::: context ratchet A floor that only goes up
A ratchet is the clicking gear in a wrench that turns one way and locks against the other. A **coverage ratchet** works the same way: the floor is set at today's measured coverage, and whenever a change raises coverage, the floor is raised to match. Coverage can go up, but a change that lowers it is blocked.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="125" x2="340" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="125" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="143" font-size="11" text-anchor="middle" fill="#1f2a44">merged changes</text>
  <polyline points="40,95 100,95 100,80 160,80 160,80 220,80 220,60 280,60 280,45 340,45" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polyline points="40,95 100,80 160,78 220,60 280,45 340,42" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="160" y1="78" x2="190" y2="92" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="190" cy="92" r="4" fill="#b4232c"/>
  <text x="196" y="108" font-size="11" fill="#b4232c">blocked: below floor</text>
  <text x="330" y="36" font-size="11" text-anchor="end" fill="#1d6fd1">floor</text>
</svg>
```

The blue steps are the floor, the grey line is the measured coverage, and the red dot is a change that would have dropped below the floor, so it was blocked. A ratchet suits an older codebase that starts with low coverage: you do not demand $90\%$ on day one, but you never let it slide backward.
:::
