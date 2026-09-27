---
id: l01-the-verbatim-expectation
title: "The verbatim expectation: you write the flight code"
minutes: 21
covers:
  - "the verbatim expectation: implementation, validation, unit testing, and deployment of production software primarily in C++"
  - GNC engineers write flight code themselves rather than handing prototypes to a software team
---

Imagine you design a new kind of paper airplane. You work out on paper why it should glide far. That is a good start. But nobody gives you credit until you have folded it, thrown it a dozen times, written down what happened, and handed it to a friend who can fold the same plane from your instructions. The idea on paper and the plane that flies are two different jobs, and in this field the same person does both.

A course built from textbooks teaches you to work out a **control law** — the rule that turns "where the rocket is" into "how to steer it" — prove it is stable, and simulate it until the numbers look right. That is real and necessary work. It is also not the whole job. Job [[postings|job-postings]] for **GNC** engineers (GNC is guidance, navigation and control, said letter by letter, "G-N-C") describe the job with unusual consistency, in one phrase: *implementation, validation, unit testing, and deployment of production software, primarily in C++*. **C++** is a programming language, said "see plus plus". **Production software** is code that runs for real, on the real vehicle, rather than code written to try an idea once.

Read that phrase again slowly. It names four separate activities, not one. And it tells you, in the plainest words a hiring process ever uses, that the person who works out the guidance law is the same person who writes it as flight code, tests it, and watches it run on real hardware.

This lesson closes a gap that catches almost everyone who studies alone: the gap between "I can derive this" and "I can be trusted to ship this". Nobody skips the second half on purpose. A self-study plan drifts toward what is easy to check alone — does the plot look right? — and the four activities are exactly the part that is hard to check alone, so they quietly fall out.

## The four verbs, one at a time

Think of baking a cake for a bake sale. Writing the recipe is not the same as baking it, tasting it, and getting it safely to the sale table. Each step catches a different kind of problem. The four verbs work the same way.

### Implementation

**Implementation** means the algorithm exists as a real **function** — a named, reusable piece of code — with a clear list of inputs and outputs, and defined behavior at its edges. It is not a cell in a [[notebook|notebooks]] that only works if you run the cells above it in the right order.

A real implementation has:

- a stated unit system (meters? degrees? seconds?);
- a stated range of inputs it is meant to handle;
- an answer for the awkward cases you would rather not think about — a negative mass, a sensor reading that is "not a number", an angle wrapped the wrong way around.

This version takes longer to write than one that only has to work once, for you, today. That extra time is the biggest difference between coursework and the job.

### Validation

**Validation** means checking the implementation against something *independent of itself*. That could be a case you worked out by hand with a known answer, a **conservation law** (a quantity such as energy that must stay the same whatever the details), or a comparison against a trusted result someone else produced.

A function that has only been checked by its author reading the code and deciding it looks right has not been validated. It has been proofread. Proofreading catches typos and not much else, because what the author *thinks* the code does and what it *actually* does share the same blind spots.

### Unit testing

A **unit test** is a small, automatic check that feeds one piece of code specific inputs and confirms it gives specific outputs. It runs in seconds. Someone — often not the original author — runs the whole set before trusting any change.

A unit test is not the same as validation. Validation asks, "Is this algorithm right in general?" A unit test pins down behavior at particular inputs, so that if anybody ever changes that behavior by accident, a check [[turns red|red-green]] immediately instead of six weeks later during a review of flight data. This difference sharpens later in the module, when groups of such tests, called regression suites, run on every change.

### Deployment

**Deployment** means the code is not finished when it passes on your laptop. It has to build in the team's shared setup, pass the team's review, and run where it actually needs to run. For GNC work, that eventually means a real **[[flight computer|flight-computer]]** with strict timing rules, not a laptop whose operating system schedules your program whenever it likes.

::: key
The verbatim expectation names four activities, not one: implementation (a real function with defined edge behavior), validation (checked against something independent of itself), unit testing (specific automated checks that catch an unintended change), and deployment (running correctly in the shared, constrained target environment). A result that has only been implemented has done a quarter of the job.
:::

::: key
SpaceX GNC production software is written primarily in C++. Postings describe implementation, validation, unit testing, and deployment of production software primarily in C++, with Python for analysis, tooling and pipelines.
:::

## One person, from derivation to flight

In some kinds of software work there is a real split. One team works out what a system should do. A second team writes the production code that does it. The first team hands over a written specification, or a rough working version called a **prototype**, and the second team turns it into something that can ship. That is a reasonable model in the right setting. It is also the model most people assume without thinking — and GNC hiring in this field generally does not use it.

The posting language is direct. The same engineer derives the control law, writes the C++ that flies it, tests it, and is the one whose name is on the change when it goes to **code review** (other engineers reading the change before it is accepted).

### Why not hand it off?

The reason is not tradition. A handoff at that boundary loses exactly the information a reviewer of flight code most needs:

- the step size used when the smooth math was turned into steps a computer can take;
- the units at every connection between pieces of code;
- which awkward inputs the physics can really produce, and which are only defensive worry;
- why the filter was tuned the way it was.

None of that survives a handoff unless the receiver re-derives most of it — and then the handoff bought only a delay and a second chance for a translation mistake. Keeping the code with the person who derived it keeps that knowledge in one head. It is there at review time, and it is there at [[2 a.m. six months later|two-am]] when telemetry — the stream of measurements the vehicle sends home — does something nobody predicted.

::: key
GNC engineers write the flight code. The postings describe GNC engineers owning implementation, validation, unit testing and deployment themselves, rather than prototyping an algorithm and handing it to a separate software organization.
:::

### Not alone, and not everywhere

This does not mean GNC engineers work alone. Code review, covered later in this module, puts a second pair of eyes on the work without a second team rewriting it.

And the pattern is not universal. Some large, mature spacecraft platforms are maintained by a dedicated software organization. Some companies genuinely hand GNC algorithms to a separate flight-software team. Which one you land in depends on the employer and the program. What is safe to treat as general is narrower and more useful: in this field, expect to own your algorithm past the point where it is merely correct, all the way to a tested, reviewable, deployable piece of software. Do not build your practice around the idea that someone else does that part.

::: example Turning a clamp into flight code
A guidance routine computes a commanded **gimbal** angle — how far to tilt the engine to steer. The engine can physically tilt at most $6$ degrees either way, so the command must be kept inside $-6$ to $+6$ degrees. Keeping a number inside limits like this is called **clamping**.

The quick notebook version is one line wherever someone needed it: use whatever angle came out. It has no name, no stated unit, and nothing defined for what happens at the limit.

The implemented version is a function with a clear promise — a **contract**:

```python
def clamp_command(angle_deg, limit_deg=6.0):
    return max(-limit_deg, min(limit_deg, angle_deg))
```

Read it from the inside out. `min(limit_deg, angle_deg)` keeps the smaller of $6$ and the command, so nothing goes above $+6$. Then `max(-limit_deg, ...)` keeps the larger of $-6$ and that result, so nothing goes below $-6$.

Implementation gives you a function that runs. Testing gives you evidence about what it does at the values that matter: inside the limit, exactly at the limit, and past it on both sides.

```python
tests = [4.0, 6.0, 9.4, -9.4]
for cmd in tests:
    print(cmd, "->", clamp_command(cmd))
# 4.0 -> 4.0      inside the limit, unchanged
# 6.0 -> 6.0      exactly at the limit, unchanged
# 9.4 -> 6.0      past the limit, clamped
# -9.4 -> -6.0    past the limit on the negative side, clamped
```

Now a version with an easy, common mistake — it clamps the top and forgets the bottom:

```python
def clamp_command_buggy(angle_deg, limit_deg=6.0):
    return min(limit_deg, angle_deg)   # no lower bound at all

print(clamp_command_buggy(-9.4))
# -9.4   unclamped: 3.4 degrees past the actuator's travel limit
```

Check the size of the miss: $-9.4 - (-6.0) = -3.4$, so the command is $3.4$ degrees beyond what the engine can do.

On every positive input, `clamp_command_buggy` gives exactly the same answer as the correct version. A test set that only tried positive commands would ship it. The negative and boundary cases are not decoration — they are the whole reason the test exists. Writing them down before trusting the function is the unit-testing part of the verbatim expectation in miniature.
:::

## "It ran and printed a number" is not evidence

The most common habit self-study builds — and the one this module works to undo — is treating a script that runs to the end and prints a sensible-looking number as if that were a correct result. It is not. A wrong number usually does not look wrong. It looks like a number.

::: example A silent wrong answer versus a caught one
A quick check of how much a burn can change a rocket's speed, its **delta-v** ($\Delta v$, said "delta vee"), uses the [[rocket equation|rocket-equation]]:

$$
\Delta v = I_{sp}\, g_0 \ln\!\left(\dfrac{m_0}{m_f}\right)
$$

Here $I_{sp}$ ("I sub s p") is the specific impulse in seconds, a measure of engine efficiency; $g_0 = 9.80665\ \mathrm{m/s^2}$ is standard gravity; $m_0$ ("m nought") is the mass before the burn and $m_f$ ("m sub f") the mass after; $\ln$ is the natural logarithm.

```python
import math
g0 = 9.80665
Isp = 350.0

def delta_v(m0, mf, isp=Isp):
    return isp * g0 * math.log(m0 / mf)

print(delta_v(100_000.0, 10_000.0))   # 7903.2   correct: m0 > mf
print(delta_v(10_000.0, 100_000.0))   # -7903.2  arguments swapped
```

Step by step for the correct call: $m_0/m_f = 100\,000/10\,000 = 10$, $\ln 10 \approx 2.3026$, and $350 \times 9.80665 \times 2.3026 \approx 7903\ \mathrm{m/s}$. Sanity check: about $7.9\ \mathrm{km/s}$ is roughly the speed needed to orbit Earth, a sensible size for a big burn with a mass ratio of $10$.

Swapping the two arguments is an easy slip once this function is called from three other places. The swapped call gives $\ln(0.1) \approx -2.3026$, so the answer has exactly the same size with a minus sign. A glance asking "is this a reasonable delta-v?" will not catch it. A negative number can even look deliberate to someone skimming a printout, as if it meant a burn pointed backward. Nothing throws an error. Nothing looks broken.

A validated version checks its own **precondition** — what must be true of the inputs — instead of trusting the caller:

```python
def delta_v_checked(m0, mf, isp=Isp):
    if not (m0 > mf > 0):
        raise ValueError(f"need m0 > mf > 0, got m0={m0}, mf={mf}")
    return isp * g0 * math.log(m0 / mf)

delta_v_checked(10_000.0, 100_000.0)
# ValueError: need m0 > mf > 0, got m0=10000.0, mf=100000.0
```

The checked version turns a silent wrong answer into a loud, specific failure right at the line where the mistake was made. That is the entire point of writing the check. The unchecked version would have carried a sign error four layers deeper into a trajectory design before anyone noticed the vehicle was, on paper, speeding up in the wrong direction.
:::

::: warning A folder of notebooks is not a portfolio of engineering
Forty exploratory notebooks that each ran once, on one machine, with no test showing what they compute is right, prove you can explore. That is a real and useful skill. They do not prove the verbatim expectation. A reviewer looking for implementation, validation, unit testing and deployment will not find them in a notebook with no function boundaries, no test and no record of what was checked. A handful of small projects built this way is worth more than a big pile of scripts only ever run by their author.
:::

## How to practice, starting now

Every exercise in this course can be done two ways: as a script that produces an answer, or as a small piece of software with a name, tested edges and a checked result. The second takes longer. It is also the only one a reviewer will want to see, because "does it work?" is never the real question in this field. The real question is always "how do you know it works?" — and a script with no tests has no answer beyond "I looked at it".

This does not mean you need a real flight program's review process or deployment pipeline to practice. Nobody expects that of a self-study [[portfolio|portfolio]]. It is about habit:

1. Write the function with a real signature — its name, inputs and output.
2. Write down the cases that would catch you being wrong: the edges, both signs, the awkward inputs.
3. Run them, every time, starting with the smallest exercise in this course.

That habit is the skill this lesson is trying to build, and every later lesson in this module assumes you are building it.

## Check yourself

::: check
State the four activities the verbatim expectation names, in order, and say in one sentence what each one adds that the previous one does not.
:::

::: answer
Implementation: the algorithm exists as a real function with a defined signature and defined edge behavior, not an inline expression. Validation: the implementation is checked against something independent of itself — a hand-worked case, a conservation law, a trusted comparison — rather than only proofread by its own author. Unit testing: specific, automated, repeatable checks exist, so that an unintended future change is caught immediately rather than discovered later. Deployment: the code is shown to build and run correctly in the shared, constrained target environment, not only on the author's own machine.
:::

::: check
A learner argues: "In a lot of software jobs, a research or algorithms team works out the approach and a separate engineering team turns it into production code — so a GNC engineer's job should be similar, and worrying about C++ implementation is premature." What is the actual pattern in this field, and why does the handoff model lose something a review of flight code needs?
:::

::: answer
In this field, GNC engineers generally own their work from derivation through implementation, testing and deployment themselves, rather than handing an algorithm to a separate software team. The split-team model does exist elsewhere in the industry and at some employers, so it is not a universal law — only the pattern to plan around.

Ownership stays with one person because a handoff loses exactly the context a reviewer or a future maintainer most needs: why a discretization step was chosen, what units cross each interface, which edge cases the physics really allows and which are defensive padding. That context rarely survives a handoff intact. Keeping implementation with derivation keeps it available when it is needed.
:::

::: check
In the rocket-equation example, `delta_v(10_000.0, 100_000.0)` returns a number rather than an error. Explain why this is more dangerous than a version that crashes immediately, and what change turns it back into an immediate, loud failure.
:::

::: answer
A returned number looks like a valid result. It is negative, but a negative delta-v does not read as nonsense on a quick look, so nothing in the output signals that anything went wrong. A crash, by contrast, stops exactly where the mistake happened and says so.

Adding a precondition check — `if not (m0 > mf > 0): raise ValueError(...)` — turns the silent wrong answer into an immediate, specific error at the call where the arguments were swapped. Otherwise the wrong number has to be traced back through every downstream calculation that used it before anyone notices.
:::

::: check
Why does a test that only tries positive commanded angles fail to catch the bug in `clamp_command_buggy`, and what does that tell you about how to choose unit-test cases?
:::

::: answer
`clamp_command_buggy` only leaves out the lower bound. For any positive input it behaves exactly like the correct version, so the missing behavior shows up only when a negative, out-of-range input such as $-9.4$ is tried.

So test cases must be chosen on purpose to exercise the boundaries and both signs of a quantity — not picked at random or picked to be "reasonable" inputs. The value of a unit test lies in the cases most likely to expose a specific mistake. A limit that is symmetric about zero needs a case on each side of zero to have any chance of catching a lopsided bug.
:::

::: check
A learner has forty Jupyter notebooks from a semester of self-study, each of which runs top to bottom and produces plots that look right. Judge this work against the verbatim expectation, and name the single most valuable change that would move it closer.
:::

::: answer
The notebooks show implementation only in the loosest sense — code that runs and produces output. They show almost nothing of validation, unit testing or deployment. There is no record of what was checked against an independent standard, no automated test that would catch a future change breaking earlier behavior, and nothing like running correctly in a shared or constrained environment.

The most valuable change is not more notebooks. It is converting even a few of the existing ones into functions with real signatures and a small set of written, automated tests that check the boundary and sign cases. That starts building direct evidence for exactly the four verbs a reviewer will look for.
:::

## Summary

| Term | What it means | Not the same as |
| --- | --- | --- |
| Implementation | A function with a real signature and defined edge behavior | An inline expression or a notebook cell |
| Validation | Checked against something independent of itself | Being read over by its own author |
| Unit testing | Specific, automated checks that catch an unintended change | A one-time "it ran" observation |
| Deployment | Runs correctly in the shared, constrained target environment | Working on the author's own machine |
| Ownership | One person carries an algorithm from derivation through deployment | A handoff from an algorithms team to a software team |
| Language | Production GNC software is primarily C++, with Python for analysis, tooling and pipelines | Whatever language the prototype happened to be in |

The next lesson asks where each language fits on that path — Python, MATLAB and Simulink, and C++ — and draws the line between the model that proves an algorithm is right and the flight code that actually flies it.

::: context job-postings Reading a job posting like a spec
A **job posting** (also called a job ad or listing) is the public description a company writes when it wants to hire. It usually has a list of duties, then "basic qualifications" — what you must have to be considered — and "preferred qualifications" — what helps. Engineers learn to read postings the way they read a requirements document: every repeated phrase is a signal. When dozens of GNC postings use the same exact words, "implementation, validation, unit testing, and deployment", that repetition is the closest thing to an official job description this course can point to. That is why this module calls it the *verbatim* expectation: verbatim means "in exactly the same words".
:::

::: context notebooks What a notebook is
A **notebook** — Jupyter is the most common kind, named for the languages Julia, Python and R — is a document that mixes small boxes of code, called cells, with their output and plots. You can run one cell, change it, and run it again. That makes notebooks wonderful for exploring. The catch is hidden state: each cell sees whatever the earlier cells left behind, in whatever order you happened to run them. Run them in a different order, or on a fresh machine, and the answer can change or break. Production code is written so that the same inputs always give the same outputs, no matter what ran before.
:::

::: context red-green Why tests "turn red"
Most test tools print passing tests in green and failing ones in red, so engineers say a test "goes red" when it fails. A test set is useful exactly because it is boring: every day it stays green, until the moment someone breaks something, and then it points at the spot. Programmers sometimes work in a loop called red–green: write a test that fails (red), write the code that makes it pass (green), then tidy up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="95" height="44" rx="8" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <text x="57" y="57" font-size="13" fill="#b4232c" text-anchor="middle">1. test fails</text>
  <rect x="133" y="30" width="95" height="44" rx="8" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="57" font-size="13" fill="#1d6fd1" text-anchor="middle">2. code passes</text>
  <rect x="256" y="30" width="95" height="44" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="303" y="57" font-size="13" fill="#1f2a44" text-anchor="middle">3. tidy up</text>
  <line x1="105" y1="52" x2="127" y2="52" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="133,52 125,47 125,57" fill="#1f2a44"/>
  <line x1="228" y1="52" x2="250" y2="52" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="256,52 248,47 248,57" fill="#1f2a44"/>
  <path d="M303 74 L303 96 L57 96 L57 80" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="57,74 52,82 62,82" fill="#6c7a93"/>
  <text x="180" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">next small change: repeat</text>
</svg>
```
:::

::: context flight-computer The computer on board
A **flight computer** is the computer on the vehicle that reads the sensors, runs guidance, navigation and control, and sends commands to the engines and fins, many times per second. Unlike your laptop, it must finish each round of work before a fixed deadline, every single time. A later lesson in this module looks at the flight computers on Dragon, Falcon and Starship, and at why that deadline bans some ordinary programming habits from the control loop.
:::

::: context two-am The engineer at 2 a.m.
"Someone should be able to fix this at 2 a.m." is a common saying in engineering teams. It means: write code and notes clear enough that a tired person who did not write them — maybe you, months later — can understand and change them safely under pressure. Vehicle problems do not wait for office hours. A later lesson lists this as part of what "production quality" means.
:::

::: context rocket-equation The rocket equation in one picture
The rocket equation, first published by Konstantin Tsiolkovsky in 1903, says how much speed a rocket gains by throwing mass out the back. The key quantity is the mass ratio $m_0/m_f$: how many times heavier the full rocket is than the emptied one. Because of the logarithm, doubling the mass ratio does not double $\Delta v$; it adds a fixed amount.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="120" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="70" y="95" width="40" height="25" fill="#8fb8f0"/>
  <rect x="145" y="70" width="40" height="50" fill="#8fb8f0"/>
  <rect x="220" y="45" width="40" height="75" fill="#8fb8f0"/>
  <rect x="295" y="20" width="40" height="100" fill="#1d6fd1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="136">ratio 2</text><text x="165" y="136">ratio 4</text>
    <text x="240" y="136">ratio 8</text><text x="315" y="136">ratio 16</text>
    <text x="90" y="90">2.38</text><text x="165" y="65">4.76</text>
    <text x="240" y="40">7.14</text><text x="315" y="14">9.52</text>
  </g>
  <text x="34" y="70" font-size="11" fill="#6c7a93" text-anchor="middle" transform="rotate(-90 34 70)">km/s</text>
</svg>
```

The bars use $I_{sp} = 350\ \mathrm{s}$: each doubling of the mass ratio adds the same $2.38\ \mathrm{km/s}$.
:::

::: context portfolio What a portfolio is
A **portfolio** is a small collection of your own projects that shows an employer what you can do, the way an artist brings sketches to an interview. For an engineer it is usually a set of code repositories on a site such as GitHub, each with a short explanation. Reviewers look less at how impressive the topic sounds and more at signs of craft: clear functions, tests, and a note on how you checked the answer. This course's build exercises are designed to become portfolio pieces.
:::
