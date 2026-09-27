---
id: l01-what-ci-buys-a-simulation-team
title: What continuous integration buys a simulation team
minutes: 20
covers:
  - What CI buys a simulation team, stated as failure modes it prevents
---

Picture two ways to run a math class. In the first, the teacher collects every homework in one pile at the end of the term and grades it all in a single weekend. In the second, a helper grades each sheet the minute it is handed in, with the same answer key every time, and hands it straight back. In the second class a mistake gets fixed while you still remember what you were thinking. In the first class you find out in June that you have been dividing fractions upside down since October.

Software teams face the same choice. Everyone works on their own branch. Sooner or later all those branches have to be joined into one program. You can join them rarely and then spend a painful week finding out what broke. Or you can join them in small pieces, often, and have a machine check every piece the moment it arrives.

The second way has a name. **[[Continuous integration|ci-history]]**, or **CI**, means merging everyone's work into the shared main branch in small, frequent steps, with an automatic build and test run on every change before it is allowed in. This lesson is about why a team that writes simulation software — the code that flies a rocket or a satellite on a computer before it flies for real — cannot do without it. We will state its value the way engineers like best: as a list of specific failures it prevents.

## A robot that checks every change

You already know the moving parts from the git and testing modules. A developer pushes a branch and opens a pull request. Someone reviews the diff. Then it is merged into `main`.

CI adds one thing to that loop. The moment the branch is pushed, a separate computer — one nobody works on by hand — fetches the code, installs what it needs, builds it and runs the tests. Then it reports back on the pull request with a green check mark or a red cross.

A few words you will meet all through this module:

- A **[[pipeline|pipeline-stages]]** is the whole list of automatic checks that run for one change, in order: for example lint, then build, then unit tests, then a regression simulation.
- A **job** is one piece of a pipeline that runs on one machine, like "run the unit tests on Linux".
- A **runner** is the machine a job runs on. It starts clean, does its job and reports.
- A **check** is the pass-or-fail result a job posts on the pull request.
- A **gate** is a rule that the pull request cannot be merged until the required checks are green. The last lesson of this module shows how to switch that rule on.

The word *continuous* matters as much as the machine. CI works because changes are small. A pull request that touches forty lines and fails a test points almost straight at the problem. A branch that has drifted for two months and touches four thousand lines points at nothing.

::: key What CI is
Continuous integration: merge small changes often, and have a clean machine build and test every change automatically before it reaches `main`. The pipeline's green or red result is a check on the pull request, and a gate makes the check required.
:::

## Why a simulator needs it more than a web app

When a web page breaks, somebody notices. The page shows an error, a button stops working, users complain. The failure is loud.

A simulator fails quietly. Suppose a change makes the simulated rocket land 400 meters from where it would have landed yesterday. Nothing crashes. The plots still look like plots. The program prints numbers with the same number of digits as before. Nobody is told anything happened.

And those numbers do not stay on the screen. Simulation output is the evidence behind design decisions. It decides how much fuel margin a landing needs, how big a thruster must be, whether a guidance change is safe to fly. A wrong number flows into analysis, then into reports, and possibly into the **[[flight rationale|flight-rationale]]** — the written argument that a vehicle is safe to launch. By the time anyone looks closely, the bad commit is months old.

::: key Why CI matters more for a simulator than for a web app
Simulator output is the evidence behind design decisions. A silent numerical regression propagates into analysis, reports and possibly flight rationale, and unlike a crashed web page nothing tells you it happened.
:::

So for a simulation team, CI is not mainly about keeping the build tidy. It is the alarm that the physics itself never raises. The rest of this lesson walks through the specific failures it catches, one at a time.

## Failure 1: "it works on my machine"

Every developer's computer is a little different. You installed a library two years ago and forgot. Your Python is 3.12, your colleague's is 3.10. Code can depend on any of these without anyone knowing, and then it fails for the next person.

This is **environment drift**: the invisible, undeclared differences between one machine and another.

A CI runner starts from a clean, known state every time. It has only what the project explicitly asks it to install. So if the code depends on something that is not written down — a package missing from the requirements file, a data file that only lives on your laptop — the CI job fails, right away, on your own pull request. That is exactly the right moment to find out.

You met the same idea in the Docker module: a container image pins the whole environment so it is the same everywhere. CI and containers work together. Many teams run their CI jobs inside the very image they ship, so "tested" and "deployed" mean the same environment.

## Failure 2: two good changes that break together

Here is a failure no single developer can see. Alice and Bob both branch from the same `main` on Monday.

- Alice changes the drag function so it expects the air density in kilograms per cubic meter instead of grams per cubic meter, and she updates every place that calls it. Her tests pass.
- Bob adds a new re-entry scenario that calls the drag function in the old way, passing grams per cubic meter. His tests pass too, because on his branch the old behavior still exists.

Each branch is correct on its own. Git merges both without a single conflict, because they touched different lines. But the combined program is wrong: Bob's new call now hands the function a number a thousand times too big. This is called a **[[semantic merge conflict|semantic-conflict]]**: the text merges cleanly, but the meaning does not.

CI catches this because of how pull-request checks run. A good CI system does not only test your branch as it sits. It tests what `main` would look like *after* your merge. When Bob's pull request is checked after Alice's has landed, his new scenario runs against her new units, and his test fails before his code ever reaches `main`.

::: warning A clean git merge is not a correct program
Git only compares lines of text. It knows nothing about units, meanings or call contracts. "No merge conflicts" means the text fitted together, nothing more. Only running the tests on the merged result tells you the program still works.
:::

## Failure 3: tests that nobody ran

Everybody means to run the full test suite before pushing. Then it is late, the change is "only a comment", the slow tests take twenty minutes, and the push goes out untested. Nobody is careless on purpose.

A machine is never tired and never sure. CI runs the same checks on every change, including the ones that "cannot matter". That turns testing from a habit that depends on each person's discipline into a property of the project itself.

This also changes what a passing test means. When the suite runs on every change, a red result means something broke *in this change*. When the suite runs whenever someone remembers, a red result could mean anything that happened in the last month.

## Failure 4: the silent numerical regression

This is the failure from the start of the lesson, now with real code. A **regression** is something that used to work and now does not. A *numerical* regression is when the program still runs but its numbers have changed.

Here is a small orbit propagator, the kind of core that sits inside a larger simulator. It steps a satellite around the Earth with a standard method called [[RK4|rk4-method]]. The one line that matters here is the constant at the top: $\mu$ (read "mu"), the Earth's **[[gravitational parameter|gravitational-parameter]]**, which sets how strongly the Earth pulls.

```python
"""Tiny two-body propagator: fixed-step RK4."""

MU_EARTH = 3.986004418e14  # m^3/s^2

def accel(x, y, mu=MU_EARTH):
    r3 = (x * x + y * y) ** 1.5
    return -mu * x / r3, -mu * y / r3

def propagate(r0, v0, dt, steps, mu=MU_EARTH):
    """Return the final (x, y, vx, vy) after steps of size dt seconds."""
    # ... four slope evaluations per step (RK4), then update the state ...
```

The body of `propagate` is left out here because it does not change in the story. What matters is that everything downstream reads `MU_EARTH`.

It has two tests. The first only checks that the answer is a finite number. The second propagates a circular orbit at radius $6778\,\mathrm{km}$ (about $400\,\mathrm{km}$ up) for one day and compares the final position with a reference answer recorded earlier from a run the team reviewed:

```python
def test_output_is_finite():
    x, y, vx, vy = propagate((R0, 0.0), (0.0, V0), 10.0, 100)
    assert all(math.isfinite(s) for s in (x, y, vx, vy))


def test_one_day_matches_reference():
    x, y, _, _ = propagate((R0, 0.0), (0.0, V0), 10.0, 8640)
    # Reference position recorded from a reviewed run.
    assert math.isclose(x, -6334702.2009, rel_tol=1e-9)
    assert math.isclose(y, -2410981.5292, rel_tol=1e-9)
```

`math.isclose(a, b, rel_tol=1e-9)` is true when `a` and `b` agree to within one part in a billion of their size. Lesson 6 of this module is all about choosing that number well; for now, read it as "the same answer, up to the last few digits".

::: example A tidy-up that moves a satellite 367 meters
Someone tidies the constants file and shortens $\mu$ from $3.986004418 \times 10^{14}$ to $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$, "since the extra digits are noise". Is that a small change?

The relative change in $\mu$ is

$$
\frac{3.986004418 \times 10^{14} - 3.986 \times 10^{14}}{3.986004418 \times 10^{14}} \approx 1.108 \times 10^{-6},
$$

about one part in a million. It sounds harmless. Now run the tests on the changed code (pytest 9.0.2, trimmed):

```text
.F                                                                       [100%]
>       assert math.isclose(x, -6334702.2009, rel_tol=1e-9)
E       assert False
E        +  where False = <built-in function isclose>(-6334832.8033375535, -6334702.2009, rel_tol=1e-09)
FAILED tests/test_propagate.py::test_one_day_matches_reference - assert False
1 failed, 1 passed in 0.16s
```

The finite-output test still passes. Of course it does: the answer is a perfectly good number. It is only the wrong one.

How wrong? Running the propagator both ways and measuring the distance between the two final positions gives $367\,\mathrm{m}$ after one day.

Sanity check with a hand estimate. The satellite's angular rate is $n = \sqrt{\mu / r^3}$, so a change of one part in a million in $\mu$ changes $n$ by half that: about $5.54 \times 10^{-7}$. One orbit takes about $5553\,\mathrm{s}$, so one day is about $15.56$ orbits, or $97.75\,\mathrm{rad}$ of travel. The angle error is $97.75 \times 5.54 \times 10^{-7} \approx 5.42 \times 10^{-5}\,\mathrm{rad}$, and multiplying by the radius $6.778 \times 10^{6}\,\mathrm{m}$ gives about $367\,\mathrm{m}$. The hand estimate and the program agree.

A third of a kilometer after one day, from trimming digits. Without the reference test, run on every change, nobody would be told.
:::

::: note Why halving the change is right
The angular rate is $n = \mu^{1/2} r^{-3/2}$. For a small change, the relative change of a power is the power times the relative change of the base: $\Delta n / n \approx \tfrac{1}{2}\, \Delta\mu / \mu$. So one part in a million in $\mu$ gives half a part in a million in $n$. After time $t$ the angle is $n t$, so the angle error grows in a straight line with time: two days of propagation would put the satellite about twice as far off.
:::

## Failure 5: the portability break

A **portability break** is code that works on one platform and fails on another. The platforms that matter for a GNC team are the operating system, the compiler, and the language version. A piece of C++ that one compiler accepts, another may reject. A Python feature added in 3.11 crashes on 3.10. A file path with a backslash works on Windows and nowhere else.

The developer only sees their own platform. CI can run the same job on several at once — lesson 3 shows how, with a matrix build — so a portability break shows up on the pull request instead of at deployment.

## Failure 6: found too late

Bugs get more expensive the longer they sit. Not because of some law of nature, but for a plain reason: the longer the gap between the change and the discovery, the more changes pile up in between, and the harder it is to tell which one did it.

If every change is checked, the gap is one change. You know exactly which pull request broke the test, because it is the one with the red cross.

If checks run only now and then, you have to hunt. Git's **[[bisect|bisect-halving]]** command does that hunt by halving: test the commit in the middle, keep the half that contains the break, repeat. It is a clever tool, but each step still needs a full test run.

::: example Hunting a regression through 300 commits
A slow regression simulation is run by hand once a month. This month it fails, and 300 commits have landed since it last passed. How much work is the hunt?

Bisect halves the range each time. Starting from 300 candidates: $300 \to 150 \to 75 \to 38 \to 19 \to 10 \to 5 \to 3 \to 2 \to 1$, give or take one at each halving. A real run of `git bisect run` over 300 commits (git 2.43) printed:

```text
Bisecting: 149 revisions left to test after this (roughly 7 steps)
Bisecting: 74 revisions left to test after this (roughly 6 steps)
...
Bisecting: 0 revisions left to test after this (roughly 0 steps)
9dfb3a3eee0bb4d3405fe6721cae00940b1c2eee is the first bad commit
```

That was 8 test runs. The rule of thumb is about $\log_2 300 \approx 8.2$, so 8 or 9 runs.

Now suppose each run of the regression simulation takes 25 minutes. The hunt costs $8 \times 25 = 200$ minutes, well over three hours of machine time, and a person waiting on it. And someone still has to understand a change made weeks ago.

With the same simulation run by CI on each pull request, the hunt costs nothing: the red cross is already on the right pull request, and its author still remembers writing it.
:::

## Failure 7: the build nobody can rebuild

Six months after a design review, someone asks: "Can you rerun exactly the simulation that went into that report?" You check out the old commit. And it will not build, because the build steps lived in one person's head, or in a settings page of a build server that has since been reconfigured.

The fix is to keep the pipeline's own definition **in the repository**, as a file, next to the code. This is called **[[pipeline as code|pipeline-as-code]]**. Every modern CI system works this way, including GitHub Actions in the next lesson. The payoff is large:

- The pipeline is **versioned**. Checking out an old commit also checks out the pipeline that built it, so old commits still build the way they did.
- It is **reviewed**. A change to the pipeline goes through a pull request like any other change, so nobody quietly switches a check off.
- It **branches** with the code. A branch that needs a new build step adds it on that branch, and `main` is untouched until the merge.

This is the same argument you met for pinning a container image: the recipe for producing a result belongs with the result.

::: key Pipeline as code
Keep the CI configuration in the repository, not in a server's settings page. It is then versioned, reviewed and branched with the code, so any old commit still builds the way it did.
:::

## What CI cannot do

CI is a very reliable robot, but it only checks what you told it to check. It is worth being honest about its limits from day one.

- **A green check is not proof of correctness.** It proves the checks you wrote passed. The finite-output test above would have passed forever. A test that runs code but asserts nothing is worse than no test, because it paints the pipeline green.
- **A slow pipeline gets ignored.** If the checks take most of an hour, people start merging without waiting, and the gate stops working. Lesson 5 shows how to split the work: fast checks on every pull request, long runs like Monte Carlo on a nightly schedule.

::: warning Do not trust green blindly
When a check is green, ask "what would have turned it red?" If nothing plausible would, the check is decoration. The fix is a better test, not a greener pipeline.
:::

## Check yourself

::: check
In one sentence each, say what the "continuous" and the "integration" in continuous integration refer to.
:::

::: answer
"Integration" is joining each developer's work into the shared main branch. "Continuous" means doing it in small pieces, often, with every piece checked automatically, instead of in rare big merges.
:::

::: check
A developer adds `import scipy` to the simulator, and it runs fine on their laptop. They forget to add `scipy` to the requirements file. What happens on CI, and why is that good?
:::

::: answer
The CI runner starts clean and installs only what the requirements file lists, so `scipy` is missing and the job fails with an import error on the developer's own pull request. That is good because the missing dependency is found immediately, by the person who caused it, instead of by the next colleague or a later deployment that happens to lack `scipy`.
:::

::: check
Two pull requests each pass CI on their own branches. Both are merged, and `main` now fails its tests. Name this kind of failure and say what CI setting would have caught it.
:::

::: answer
It is a semantic merge conflict: the text merged cleanly but the meanings clash. It is caught by testing the result of the merge rather than the branch alone, and by re-running the checks on the second pull request after the first has landed (the branch protection in this module's last lesson can require a branch to be up to date with `main` before it merges).
:::

::: check
Someone rounds a gravity constant in a simulator and the result shifts by 0.2 percent. The only test checks that the output has no NaNs. Explain why the change is dangerous even though the test is green.
:::

::: answer
The output is still a valid number, so a test that only checks for NaN cannot see the shift. The wrong numbers look normal, so they flow into analyses and reports and may end up behind design decisions, and nothing announces that anything changed. It needs a regression test comparing against a reviewed reference answer, run by CI on every change.
:::

::: check
A regression is noticed after 1000 unchecked commits. About how many test runs will `git bisect` need, and how would per-pull-request CI change the picture?
:::

::: answer
Bisect halves the range each run, so it needs about $\log_2 1000 \approx 10$ runs (1000, 500, 250, 125, 63, 32, 16, 8, 4, 2, 1). With CI running the same test on every pull request, the failing check would already sit on the one pull request that caused it, so no hunt is needed.
:::

## Summary

| Failure mode | What goes wrong | How CI prevents it |
| --- | --- | --- |
| Works on my machine | Code depends on something undeclared | Clean runner installs only what is declared |
| Semantic merge conflict | Two good changes break together | Tests run on the merged result |
| Tests nobody ran | People skip slow or "irrelevant" checks | Same checks on every change, automatically |
| Silent numerical regression | Numbers shift, nothing crashes | Regression tests against a reviewed reference |
| Portability break | Works on one OS, compiler or version only | Same job on several platforms (matrix) |
| Found too late | Weeks of commits to search | The red check sits on the guilty pull request |
| Build nobody can rebuild | Pipeline lived in someone's head | Pipeline as code, versioned with the source |

Next you write a real pipeline: the GitHub Actions workflow file, the events that start it, and the jobs, steps and runners that carry it out.

::: context ci-history Where the name comes from
"Integration" is an old engineering word for putting separately built parts together and checking that they work as one. The phrase "continuous integration" shows up in Grady Booch's writing on software design in the early 1990s, and Extreme Programming made it a daily practice later that decade. Before it, many teams saved integration for a dedicated, dreaded phase near the end of a project.
:::

::: context pipeline-stages Like an assembly line
The word comes from the idea of work flowing through a pipe: each stage takes what the one before produced and passes it on. Cheap, fast checks go first, so a typo fails in seconds instead of after a ten-minute build. Some stages can run side by side, as the next lesson shows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#6c7a93">one pushed change</text>
  <rect x="10" y="30" width="70" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">lint</text>
  <rect x="100" y="30" width="70" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="135" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">build</text>
  <rect x="190" y="30" width="70" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="225" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">unit tests</text>
  <rect x="280" y="30" width="70" height="36" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="315" y="46" font-size="12" text-anchor="middle" fill="#1f2a44">regression</text>
  <text x="315" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">sim</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="80" y1="48" x2="98" y2="48"/><line x1="170" y1="48" x2="188" y2="48"/><line x1="260" y1="48" x2="278" y2="48"/>
  </g>
  <text x="180" y="96" font-size="12" text-anchor="middle" fill="#1d6fd1">all green: the pull request may merge</text>
  <text x="180" y="112" font-size="12" text-anchor="middle" fill="#b4232c">any red: it waits for a fix</text>
</svg>
```
:::

::: context flight-rationale The argument that a vehicle is safe to fly
Flight rationale is the engineering case, written down, for why a vehicle is acceptable to launch, often with a known issue still open ("the seal eroded, but analysis shows margin"). It leans heavily on analysis and simulation. That is why a simulator's numbers are not just numbers: if they are wrong, the argument built on them is wrong too, and it may look perfectly convincing.
:::

::: context semantic-conflict Clean text, broken meaning
Git's merge compares lines. If Alice and Bob change different lines, git is satisfied. But programs are webs of meaning: a function's units, the order of its arguments, the promise it makes to callers. Alice changed the promise; Bob relied on the old one in a line Alice never saw.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="75" x2="330" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="30" cy="75" r="7" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="30" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">main</text>
  <path d="M30 75 Q90 25 160 30 Q230 35 270 75" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="150" y="20" font-size="11" text-anchor="middle" fill="#1d6fd1">Alice: drag takes kg/m³ (tests pass)</text>
  <path d="M30 75 Q90 125 160 120 Q230 115 270 75" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <text x="150" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">Bob: new call passes g/m³ (tests pass)</text>
  <circle cx="270" cy="75" r="9" fill="#b4232c" stroke="#1f2a44" stroke-width="2"/>
  <text x="300" y="66" font-size="11" fill="#b4232c">merged:</text>
  <text x="300" y="96" font-size="11" fill="#b4232c">fails</text>
</svg>
```
:::

::: context rk4-method Four slopes per step
RK4 is the classic fourth-order Runge–Kutta method. To move the state forward one time step, it measures the slope (here, velocity and acceleration) four times — at the start, twice at the middle, and at the end — and takes a weighted average. You will build one yourself in the numerical methods modules. For this lesson all that matters is that it is a deterministic calculation: same inputs, same outputs.
:::

::: context gravitational-parameter Mu, the number that sets an orbit
$\mu = G M$ is the gravitational constant times the Earth's mass. Engineers use the product because it is known far more precisely than either factor alone: tracking satellites measures $\mu$ directly. The value $3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$ is the one adopted in the WGS 84 Earth model and is a common choice in orbit software. Every orbit you propagate in the dynamics modules leans on it.
:::

::: context bisect-halving Halving, again and again
Each bisect step cuts the suspect range in half, like guessing a number between 1 and 300 with "higher or lower". Ten halvings cover about a thousand commits, twenty about a million. Fast as that is, each step is a full test run, and that is the cost CI avoids.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="14" width="300" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="330" y="27" font-size="11" fill="#1f2a44">300</text>
  <rect x="20" y="40" width="150" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="170" y="40" width="150" height="16" fill="#fff" stroke="#6c7a93"/>
  <text x="330" y="53" font-size="11" fill="#1f2a44">150</text>
  <rect x="95" y="66" width="75" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="20" y="66" width="75" height="16" fill="#fff" stroke="#6c7a93"/>
  <text x="330" y="79" font-size="11" fill="#1f2a44">75</text>
  <rect x="95" y="92" width="38" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="133" y="92" width="37" height="16" fill="#fff" stroke="#6c7a93"/>
  <text x="330" y="105" font-size="11" fill="#1f2a44">38</text>
  <text x="180" y="125" font-size="11" text-anchor="middle" fill="#6c7a93">blue: still suspect after each test run</text>
</svg>
```
:::

::: context pipeline-as-code Configuration management for the build itself
Engineers keep drawings, requirements and code under version control so that "what did we have on the day of the review?" always has an answer. Pipeline as code applies the same discipline to the build and test procedure. In GitHub Actions the files live in a folder called `.github/workflows`; GitLab CI uses a file called `.gitlab-ci.yml`; Jenkins uses a `Jenkinsfile`. Lesson 4 meets the last two.
:::
