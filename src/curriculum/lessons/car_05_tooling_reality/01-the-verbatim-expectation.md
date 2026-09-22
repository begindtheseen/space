---
id: l01-the-verbatim-expectation
title: "The verbatim expectation: you write the flight code"
minutes: 19
covers:
  - "the verbatim expectation: implementation, validation, unit testing, and deployment of production software primarily in C++"
  - GNC engineers write flight code themselves rather than handing prototypes to a software team
---

A GNC curriculum built from textbooks teaches you to derive a control law, prove it stable, and simulate it until the numbers look right. That is real and necessary work, and it is also not the job. The job, as postings in this field describe it with unusual consistency, is implementation, validation, unit testing, and deployment of production software, primarily in C++ — four specific, named activities, not one. Read that phrase again slowly, because it is doing more work than it looks like it is doing: it is telling you, in the plainest language a hiring process ever uses, that the person who derives the guidance law is the same person who ships it, tests it, and watches it run on real hardware.

This lesson exists to close a gap that catches almost everyone studying alone: the gap between "I can derive this" and "I can be trusted to ship this." Nobody sets out to skip the second half. It happens by default, because a self-study plan naturally optimizes for what is easy to check — does the trajectory look right, does the Bode plot have the expected margins — and the four verbs above are exactly the part that is hard to check yourself, so they quietly fall out of the plan. The rest of this module is about what fills that gap in an actual working week. This lesson is about the plainest fact underneath all of it: nobody hands your work to someone else to make real.

## The four verbs, and what each one actually costs

"Implementation" means the algorithm exists as a function with a name, a signature, and defined behavior at its edges — not as a cell in a notebook that only works if you run the cells above it in the right order. It has a unit system, a stated valid input range, and a return value for the cases you did not want to think about (a negative mass, a not-a-number sensor reading, an angle wrapped the wrong way). Writing this version takes longer than writing the version that only has to work once, for you, today, and that difference in time is the single biggest gap between coursework practice and the job.

"Validation" means showing the implementation is checked against something independent of itself: a hand-worked case with a known answer, a conservation law that has to hold regardless of the details, a comparison against a trusted existing result. A function that has only ever been checked by reading its own source code and deciding it looks right has not been validated — it has been proofread, which catches typos and catches almost nothing else, because the author's mental model of what the code does and what the code actually does share the same blind spots.

"Unit testing" means small, automated, specific checks that run in seconds and that somebody — often not the original author — runs before trusting a change. A unit test is not the same thing as validation: validation asks whether the algorithm is right in general; a unit test pins down specific behavior at specific inputs so that if anybody, ever, changes that behavior without meaning to, something turns red immediately instead of six weeks later during a review of flight data. You will see this distinction sharpen considerably once regression suites enter the picture later in this module.

"Deployment" means the code is not finished when it passes on your machine. It has to build in the shared environment, pass the shared review, and actually run where it needs to run — which, for GNC work, eventually means a real flight computer with real timing constraints, not a laptop with a forgiving operating system doing whatever it wants with your process's scheduling.

::: key
The verbatim expectation names four activities, not one: implementation (a real function with defined edge behavior), validation (checked against something independent of itself), unit testing (specific automated checks that catch an unintended change), and deployment (running correctly in the shared, constrained target environment). A result that has only been implemented has done a quarter of the job.
:::

## Why the algorithm work and the flight-code work are not split across two people

In some parts of the software industry, and in some corners of engineering generally, there is a real division between the person who works out what a system should do and the person who writes the production code that does it — a research team hands off a specification, or a working prototype, and a separate software engineering organization turns it into something deployable. It is a reasonable model in the right context, and it is worth naming explicitly because it is the model most people unconsciously assume, and GNC hiring in this field does not generally use it. The posting language above is direct about this: the same person derives the control law, writes the C++ that flies it, tests it, and is the one whose name is on the change when it goes to review.

The reason is not tradition; it is that a handoff at that boundary loses exactly the information a flight code reviewer most needs. The discretization step size, the units at every interface, which edge cases the physics actually allows and which ones are pure software paranoia, why the filter was tuned the way it was — none of that survives a handoff cleanly unless the person receiving it re-derives most of it anyway, at which point the handoff bought nothing but a delay and a second chance to introduce a translation error. Keeping implementation with derivation keeps that knowledge in one head, where it is available at review time and at 2 a.m. six months later when telemetry does something nobody predicted.

This does not mean GNC engineers work alone. Code review, discussed later in this module, is exactly the mechanism that gets a second set of eyes onto the work without requiring a second team to reimplement it. And the pattern is not universal — a large, mature spacecraft bus platform maintained by a dedicated software organization, or a company where GNC algorithms genuinely are handed to a separate flight-software team, both exist in this industry, and which one you land in depends on the employer and the program. What is safe to treat as general is narrower and more useful than either extreme: in this field, expect to own your algorithm past the point where it is merely correct, through to the point where it is a tested, reviewable, deployable artifact, and do not build your practice around the assumption that someone else does that part for you.

::: example Turning a clamp into flight code
A guidance routine computes a commanded gimbal deflection angle and needs to keep it inside the actuator's physical travel limit of six degrees either way. The quick, notebook version of this logic is a single inline expression: whatever the commanded angle works out to be, use it. That version has no name, no documented unit, and no behavior defined for what happens at the limit — it exists once, inline, wherever someone happened to need it.

The implemented version is a function with a contract:

```python
def clamp_command(angle_deg, limit_deg=6.0):
    return max(-limit_deg, min(limit_deg, angle_deg))
```

Implementation alone gets you a function that runs. Validation and unit testing get you evidence about what it does at the values that matter — inside the limit, exactly at the limit, and past it on both sides:

```python
tests = [4.0, 6.0, 9.4, -9.4]
for cmd in tests:
    print(cmd, "->", clamp_command(cmd))
# 4.0 -> 4.0      inside the limit, unchanged
# 6.0 -> 6.0       exactly at the limit, unchanged
# 9.4 -> 6.0       past the limit, correctly clamped
# -9.4 -> -6.0      past the limit on the negative side, correctly clamped
```

Compare that against a version with an easy, common mistake — clamping only the upper bound and forgetting the lower one:

```python
def clamp_command_buggy(angle_deg, limit_deg=6.0):
    return min(limit_deg, angle_deg)   # no lower bound at all

print(clamp_command_buggy(-9.4))
# -9.4      unclamped: a real command 3.4 degrees past the actuator's travel limit
```

`clamp_command_buggy` looks identical to the correct version on every test case where the commanded angle happens to be positive. A test suite that only ever tried positive commands would ship it. The boundary and negative-side cases in the test above are not decoration; they are the entire reason the test exists, and writing them down before trusting the function is the unit-testing half of the verbatim expectation in miniature.
:::

## "It ran and printed a number" is not evidence

The most common habit that self-study builds, and that this module exists partly to un-build, is treating a script that runs to completion and prints a plausible-looking number as if that were the same thing as a correct result. It is not, and the gap between the two is exactly where real defects live, because a wrong number is not usually obviously wrong — it looks like a number.

::: example A silent wrong answer versus a caught one
A quick delta-v check for a burn uses the rocket equation, $\Delta v = I_{sp}\, g_0 \ln\!\left(\dfrac{m_0}{m_f}\right)$, where $I_{sp}$ is the specific impulse in seconds, $g_0 = 9.80665\ \mathrm{m/s^2}$, $m_0$ is the wet mass and $m_f$ the mass after the burn:

```python
import math
g0 = 9.80665
Isp = 350.0

def delta_v(m0, mf, isp=Isp):
    return isp * g0 * math.log(m0 / mf)

print(delta_v(100_000.0, 10_000.0))   # 7903.2   correct: m0 > mf
print(delta_v(10_000.0, 100_000.0))   # -7903.2  arguments swapped
```

Swapping the two arguments is an easy slip once this function is called from three other places in a larger script. The correct call and the swapped call return numbers of exactly the same magnitude, so a glance at "does this look like a reasonable delta-v" will not catch it — a negative number can even look intentional to someone skimming a printout, as if it meant a retrograde burn. Nothing about running the swapped call throws an error or looks obviously broken.

A validated version of the same function checks its own precondition instead of trusting the caller:

```python
def delta_v_checked(m0, mf, isp=Isp):
    if not (m0 > mf > 0):
        raise ValueError(f"need m0 > mf > 0, got m0={m0}, mf={mf}")
    return isp * g0 * math.log(m0 / mf)

delta_v_checked(10_000.0, 100_000.0)
# ValueError: need m0 > mf > 0, got m0=10000.0, mf=100000.0
```

The checked version turns a silent wrong answer into a loud, specific, immediate failure, at the exact call site where the mistake was made — which is the entire point of writing the check. The unchecked version would have carried a sign error four layers deeper into a trajectory design before anyone noticed the vehicle was, on paper, accelerating the wrong way.
:::

::: warning A folder of notebooks is not a portfolio of engineering
Forty exploratory notebooks that each run once, on one machine, with no test proving what they compute is right, demonstrate that you can explore — a real and useful skill — but they do not demonstrate the verbatim expectation. A reviewer looking for evidence of implementation, validation, unit testing and deployment will not find it in a notebook with no function boundaries, no test, and no record of what was checked. Building even a handful of small projects the way this module describes is worth more than a much larger pile of scripts that were only ever run by their author.
:::

## What this means for how you practice, starting now

Every exercise in this module and in the ones that follow can be done two ways: as a script that produces an answer, or as a small piece of software that has a name, a tested boundary, and a validated result. The second version takes longer. It is also the only one that resembles what a reviewer will actually ask to see, because "does it work" is never the real question in this field — the real question is always "how do you know it works," and a script with no tests has no answer to that question beyond "I looked at it."

This is not a claim that you need production-grade infrastructure to practice — nobody expects a self-study portfolio to have the review process or the deployment pipeline of a real flight program. It is a claim about habit: write the function with a real signature, write down the cases that would catch you being wrong, and run them, every time, starting with the smallest exercise in this course. That habit is the actual transferable skill this lesson is trying to install, and every later lesson in this module assumes you are building it.

## Check yourself

::: check
State the four activities the verbatim expectation names, in order, and say in one sentence what each one adds that the previous one does not.
:::

::: answer
Implementation: the algorithm exists as a real function with a defined signature and defined edge behavior, not an inline expression. Validation: the implementation is checked against something independent of itself — a hand-worked case, a conservation law, a trusted comparison — rather than only proofread by its own author. Unit testing: specific, automated, repeatable checks exist so that an unintended future change is caught immediately rather than discovered later. Deployment: the code is shown to build and run correctly in the shared, constrained target environment, not merely on the author's own machine.
:::

::: check
A learner argues: "In a lot of software jobs, a research or algorithms team works out the approach and a separate engineering team turns it into production code — so a GNC engineer's job should be similar, and worrying about C++ implementation is premature." What is the actual pattern in this field, and why does the handoff model lose something a review of flight code needs?
:::

::: answer
In this field, GNC engineers generally own their work from derivation through implementation, testing and deployment themselves, rather than handing an algorithm to a separate software team — though the split-team model does exist elsewhere in the industry and at some employers, so it is not a universal law, only the pattern to plan around. The reason ownership stays with one person is that a handoff loses exactly the context a reviewer or a future maintainer most needs: why a discretization step was chosen, what units cross each interface, which edge cases the physics genuinely allows versus which are defensive padding. That context rarely survives a handoff intact, so keeping implementation with derivation keeps it available when it is needed.
:::

::: check
In the rocket-equation example, `delta_v(10_000.0, 100_000.0)` returns a number rather than an error. Explain specifically why this is more dangerous than a version that crashes immediately, and what change turns it back into an immediate, loud failure.
:::

::: answer
It is more dangerous because a returned number looks like a valid result — it is negative, but a negative delta-v is not obviously nonsensical on a quick read, so nothing about the output signals that anything went wrong. A crash, by contrast, stops exactly where the mistake happened and says so. Adding a precondition check — `if not (m0 > mf > 0): raise ValueError(...)` — turns the silent wrong answer into an immediate, specific exception at the call site where the arguments were actually swapped, rather than a wrong number that has to be traced back through however many downstream calculations use it before anyone notices.
:::

::: check
Why does a test that only tries positive commanded angles fail to catch the bug in `clamp_command_buggy`, and what does that imply about how boundary and sign cases should be chosen for a unit test?
:::

::: answer
`clamp_command_buggy` only omits the lower bound, so for any positive input it behaves identically to the correct version — the missing behavior only shows up once a negative, out-of-range input is tried. This implies that test cases have to be chosen to specifically exercise the boundary and both signs of a quantity, not chosen at random or chosen to be "reasonable" inputs; the whole value of a unit test is in the cases most likely to expose a specific kind of mistake, and a symmetric bound like this one needs a case on each side of zero to have any chance of catching an asymmetric bug.
:::

::: check
A learner has forty Jupyter notebooks from a semester of self-study, each of which runs top to bottom and produces plots that look right. Evaluate this body of work specifically against the verbatim expectation, and name the single most valuable change that would move it closer to that standard.
:::

::: answer
The notebooks demonstrate implementation in the loosest sense — code that runs and produces output — but demonstrate essentially none of validation, unit testing or deployment: there is no record of what was checked against an independent standard, no automated test that would catch a future change breaking prior behavior, and nothing that resembles running correctly in a shared or constrained environment. The single most valuable change is not more notebooks; it is converting even a few of the existing ones into functions with real signatures and a small set of written, automated tests that check boundary and sign cases, which starts building direct evidence for exactly the four verbs a reviewer will be looking for.
:::

## Summary

| Term | What it means | Not the same as |
| --- | --- | --- |
| Implementation | A function with a real signature and defined edge behavior | An inline expression or a notebook cell |
| Validation | Checked against something independent of itself | Being read over by its own author |
| Unit testing | Specific, automated checks that catch an unintended change | A one-time "it ran" observation |
| Deployment | Runs correctly in the shared, constrained target environment | Working on the author's own machine |
| Ownership | One person carries an algorithm from derivation through deployment | A handoff from an algorithms team to a software team |

The next lesson turns to where each language fits in that path — Python, MATLAB and Simulink, and C++ — and draws the line between the model that proves an algorithm is right and the flight code that actually flies it.
