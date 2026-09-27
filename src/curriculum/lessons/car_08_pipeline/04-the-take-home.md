---
id: l04-the-take-home
title: "Stage 3: the take-home exercise"
minutes: 19
covers:
  - "stage 3 — take-home exercise for some software and firmware roles"
---

Think about the difference between a spelling bee and a book report. In the spelling bee, a judge watches you on the spot, and a slip under pressure is part of the test. The book report you write at home, over several days. Nobody watches you write it. All the teacher ever sees is the finished pages, so the pages have to speak for themselves.

The third stage of the hiring pipeline is the book report. A **[[take-home exercise|take-home-word]]** is a small, real piece of work the company sends you to do on your own time and hand back — write a short program, build a small tool, analyze a data file. It is used for **some software and [[firmware|firmware-word]] roles**, not for every role.

That makes it the only stage that depends on the role rather than on you. Whether you get one is a property of the **requisition** — the one specific opening you are applying to. If your process has no take-home, you have not skipped anything, and you are not on a lesser track.

It is still worth understanding, for two reasons. First, you will not know in advance which kind of opening you are on unless you ask, and asking about the stages is the habit the recruiter-screen lesson already recommended. Second, a take-home is judged against one standard: code that a stranger can read, run and trust. That is the same standard the portfolio module asked you to hold your projects to. If your portfolio already meets it, a take-home is a smaller event than it sounds. If it does not, the take-home is where you find out.

## What the stage is looking at

Every interview watches you work while someone observes you, and on a clock. That is a real signal. It is not the only one that matters.

A take-home reaches something no interview can. It shows what your work looks like when nobody is watching, when you had time to go back and clean it up, and when the only thing the reader receives is the finished **artifact** — the thing you made and handed in.

That one idea tells you almost everything about how to approach it:

- The reader is not sitting next to you.
- Nothing you would have said out loud gets said.
- Every judgment they form comes from what is in the submission.

So the submission has to carry its own explanation. That is the rule the rest of this lesson unpacks.

::: key
The take-home is used for some software and firmware roles rather than universally. Treat it as production work: tests, a README, clear structure, and a note on what you would do with more time.
:::

**Production work** means work good enough to be used for real by other people — the standard of code that ships, not of code that merely ran once on your laptop. It has four parts.

## The four parts of production work

### Tests

A **test** is a small piece of code that checks your main code gives the right answer. Tests are not decoration added to look careful. In **GNC** work — guidance, navigation and control — they answer the only question that matters about a number your program prints: how do you know it is right?

The portfolio module named four checks that really do answer that question:

1. **An analytic case** — a problem whose answer you can work out by hand, separately, and compare against.
2. **A conservation check** — a quantity that physics says should stay constant, such as energy or angular momentum, and that your code should keep constant to some **tolerance** (an allowed amount of error you state in advance).
3. **A [[convergence study|convergence-picture]]** — run again with smaller steps and show that the answer stops changing, at the rate theory predicts.
4. **A cross-comparison** — check against a separate implementation written a different way.

A test suite built from checks like these is doing engineering, and a reader can tell at once. A suite that only checks that the code runs without crashing is checking the least interesting thing about it. Code can run perfectly and print a wrong number.

Here is what a real check looks like. The equation $\frac{dy}{dt} = -y$ (read "d y by d t equals minus y") has the exact answer $y = e^{-t}$ (where $e \approx 2.718$ is the special number from growth and decay), so at $t = 1$ the right value is $e^{-1} \approx 0.3679$. The classic **RK4** method (said "R-K-four") steps through time in small slices, and because it is a *fourth-order* method it should cut its error by about $2^4 = 16$ times each time you halve the step. The test measures that:

```python
import math

def rk4_step(f, t, y, h):
    k1 = f(t, y)
    k2 = f(t + h/2, y + h*k1/2)
    k3 = f(t + h/2, y + h*k2/2)
    k4 = f(t + h, y + h*k3)
    return y + h*(k1 + 2*k2 + 2*k3 + k4)/6

def solve(h, t_end=1.0):
    f = lambda t, y: -y          # dy/dt = -y, exact answer y = e^(-t)
    t, y = 0.0, 1.0
    for _ in range(round(t_end / h)):
        y = rk4_step(f, t, y, h)
        t += h
    return y

exact = math.exp(-1.0)
err_h  = abs(solve(0.1)  - exact)
err_h2 = abs(solve(0.05) - exact)
print(f"error at h=0.1:  {err_h:.2e}")    # error at h=0.1:  3.33e-07
print(f"error at h=0.05: {err_h2:.2e}")   # error at h=0.05: 2.00e-08
print(f"ratio: {err_h / err_h2:.1f}")     # ratio: 16.7
assert 14 < err_h / err_h2 < 18
```

The ratio comes out at 16.7 — close to 16, as it should be. That single line of evidence says more than any amount of "it runs".

### A README

A **[[README|readme-word]]** is the short document that sits at the top of a project and explains it. Write it as though the reader has your submission, no other context, and fifteen minutes. It should say, in this order:

1. what the problem was;
2. what you assumed;
3. how to run it;
4. what the result was;
5. how you know the result is right;
6. where the limits are.

That is the same write-up skeleton the portfolio module used. It works here for the same reason: it answers a technical reader's questions in the order they come to mind.

The most valuable line is usually number five, the one that says how you checked the output. It turns the submission from "here is some code" into "here is a result, and here is why I believe it."

### Clear structure

A stranger should be able to find anything without asking you. That means:

- files named for what they contain;
- a build or run command that works on a fresh copy of the project, not only on your machine;
- dependencies **[[pinned|pinned-versions]]** — the exact versions of any outside libraries written down, so the code behaves the same for the reader as it did for you;
- no dead code, and no commented-out experiments left lying in the files.

None of this is a matter of taste. It is the difference between a reader forming an opinion of your work and a reader forming an opinion of your habits.

### A note on what you would do with more time

This is the part candidates leave out. It is also the cheapest of the four.

A take-home has limits. Something will be missing — a rough model where a better one exists, a test you did not write, an error case you handled crudely. Now picture two versions of the same gap:

- **The reader finds it, and you never mentioned it.** It reads as something you did not notice.
- **You named it yourself, in one or two sentences.** The same gap reads as a scope decision you made on purpose and could defend.

Naming your own limits does not weaken a submission. It is the clearest evidence that you know what a finished version would look like — and that judgment is exactly what a hiring reader is trying to measure.

::: warning Do not over-scope the brief
The **brief** is the written instructions that come with the exercise; its **scope** is how much it asks for. Building far past it is not a display of enthusiasm. It is a display of not reading requirements. It also gives the reader more places to find something wrong, uses up the time you needed to make the core clean, and, if a time limit was stated, quietly ignores it. If you want to show more, a tight core plus a "what I would do next" paragraph shows the same ambition without any of those costs.
:::

## The questions this lesson cannot answer for you

Some things vary from opening to opening, and this lesson will not pretend otherwise.

**How long to spend.** If the brief states a **[[time box|time-box-word]]** — a fixed amount of time for the work — that number is a requirement, not a suggestion. How you treat it is itself part of what is being observed. If no time box is stated, ask the recruiter what is expected. This course has no basis for telling you a typical take-home takes some particular number of hours, and a made-up figure here would be a figure you planned against.

**What language to write in.** Read the brief first; if it names a language, that settles it. If it does not, the tooling module gave you the underlying fact: production GNC and flight software is mostly **C++** (said "C plus plus"), while **Python** is where analysis, tooling and test infrastructure live. For an **avionics** (the electronics that fly the vehicle) or **embedded** (software running inside a device) role, C++ is the safer assumption. For an analysis-focused role, Python is often fine. If you are unsure and the brief is silent, that is another question for the recruiter.

**Whether you get one, who reads it, and what the bar is.** The module's own statement is that take-homes are used for some software and firmware roles rather than universally. Beyond that, this course cannot tell you whether your opening includes one, whether the reader is an engineer you will later meet, or what separates an acceptable submission from a strong one. Ask about the stage sequence at the recruiter screen, and you will at least know whether this stage is in your process.

One thing is safe to assume without asking: **do not submit anything that is not yours to submit.** Code, data or documents from a previous employer do not belong in a take-home, however good they are. **[[Export-controlled|export-controlled-bridge]]** material belongs there even less. Write the submission fresh.

::: example The same core, submitted two ways
Two candidates get the same firmware-flavored exercise: write a fixed-step **integrator** — code that moves a simulation forward in time, one equal-sized step after another — for a simple **attitude** model (attitude means which way a spacecraft is pointing), with a small interface for stepping it forward in time. Both write working code. The math at the center of the two submissions is close to identical.

**The first candidate** sends a single source file, with a build command pasted into the email. It compiles. It runs. There are no tests, and nothing anywhere says what the output should be. A reader who wants to know whether the integrator is correct has to work that out from the code, by reasoning about it — and may or may not have time.

**The second candidate** sends a small, tidy folder: the integrator, a test file, a one-page README, and a pinned build. Her tests check three things:

1. a torque-free (nothing twisting it), symmetric spinning body keeps its angular momentum constant to a stated tolerance (a conservation check);
2. halving the step size shrinks the error at the rate the method's order predicts (a convergence study);
3. one starting condition with a hand-derived exact answer matches it (an analytic case).

Her README states the assumptions, the run command, those three checks and the tolerance each met. It closes with two sentences: with more time, she would add a variable-step option, and she would test the behavior near the **[[singularity|attitude-singularity]]** of the attitude description she chose, which her current tests do not reach.

Sanity check: both candidates wrote a correct integrator. Only one of them handed in evidence that it was correct. And only one told the reader what was missing before the reader had to find it.
:::

::: example Over-scoping, and what it costs
A candidate is asked for a small tool that reads a **telemetry** file — the stream of measurements a vehicle sends home — and reports a few summary statistics. The brief suggests a few hours.

He decides to make it impressive. He writes a plugin system so new statistics can be added while the program runs. He invents a configuration file format. He builds a command-line interface with several sub-commands, and adds a plotting mode. It takes most of a weekend.

The file reader at the center works. But he runs out of energy before testing the **[[edge cases|edge-cases-word]]** in the file format — a last record cut off partway, and a timestamp that appears twice. His README is a list of command-line options, not an account of the problem.

Now count what the reader receives:

- several hundred lines of framework nobody asked for, which earns little;
- a file reader with no tests, untested *because* the framework ate the time, which costs something real;
- the one thing the brief actually asked for — read the file, report the numbers — with the least evidence behind it.

Compare a candidate who writes the reader, tests the two broken-input cases, and spends the last twenty minutes on a README ending with a "what I would add next" paragraph that mentions the plugin idea. Her submission is both smaller and stronger.
:::

## Check yourself

::: check
Why does this stage exist at all, when the process already has a technical phone screen and a full day of interviews?
:::

::: answer
Interviews watch you work while being observed and under time pressure. A take-home reaches something they cannot: what your work looks like unobserved, with time to revise, when all the reader gets is the artifact itself. That is a different signal about the same candidate — and it is the signal closest to what everyday work on the job actually produces.
:::

::: check
Name the four parts of treating a take-home as production work, and say what the fourth one buys you in particular.
:::

::: answer
Tests, a README, clear structure, and a note on what you would do with more time. The fourth turns an omission into a decision. A gap the reader finds on their own reads as something you did not notice. The same gap, named in your own words, reads as a scope choice you understood and could defend. It is the cheapest of the four to write and the one candidates skip most often.
:::

::: check
A brief says "this should take about four hours", and a candidate spends fourteen, producing something far more elaborate. What has he actually shown?
:::

::: answer
That he did not treat a stated requirement as a requirement. A time box in a brief is part of the specification. Fourteen hours against four is $14 \div 4 = 3.5$ times the stated budget — **[[a factor of several|overrun-picture]]** — and that shows in the size of what arrives. He has also spent the time that would have made the core clean and well tested, and he has given the reader more surface on which to find a defect. Enthusiasm shown this way costs more than it returns.
:::

::: check
Why is a test suite that only checks that the code runs without errors a weak suite for a GNC exercise?
:::

::: answer
Because it checks the least interesting property the code has. The question a technical reader asks about a numerical result is whether it is right, and "it ran without an error" is no evidence either way — code can run perfectly and print a wrong number. The checks that carry evidence are the four from the portfolio module: an analytic case with a known answer, a conserved quantity that holds to a tolerance, a convergence study showing the answer settles as the step shrinks, and a comparison against an independent implementation.
:::

::: check
A candidate does not know whether her opening includes a take-home, how long it should take, or which language is expected. What does this lesson tell her to do, and what does it decline to tell her?
:::

::: answer
It tells her to ask the recruiter. The stage sequence is a normal recruiter-screen question, and so are the expected effort and the language when a brief is silent. It declines to invent a typical duration, to say whether her specific opening includes the stage, to say who reads the submission, or to say what separates an acceptable submission from a strong one. What it does give her without asking: read the brief first, and never submit material that belongs to a previous employer.
:::

## Summary

| Element | What it is |
| --- | --- |
| Applies to | Some software and firmware roles, not universally |
| What it uniquely measures | Your work unobserved, with time to revise |
| Tests | Analytic cases, conservation, convergence, cross-comparison |
| README | Problem, assumptions, how to run, result, how you know it is right, limits |
| Structure | A stranger can find and run everything without asking you |
| The closing note | What you would do with more time, in one or two sentences |
| Time box | A requirement if stated; ask if not |
| Language | Read the brief; C++ for avionics and embedded, Python for analysis work |
| Never | Material belonging to a previous employer |

The next lesson moves to the biggest stage in the process, and the one that most rewards knowing its shape in advance: the full-day onsite.

::: context take-home-word Homework, but for the job
The name comes from school. A **take-home exam** is one you are allowed to carry home and finish on your own, with your notes and your own pace, instead of sitting it in a silent hall. Companies borrowed the phrase for exercises sent to a candidate's inbox. The trade is the same as at school: you get more time and more resources, and in return the reader expects a more finished result than they would from someone thinking on their feet.
:::

::: context firmware-word Software that lives inside hardware
**Firmware** is software written for one specific piece of hardware and stored on it — the code inside a flight computer, a star tracker, a reaction wheel's controller, or your microwave. It sits between ordinary software and the physical electronics: "firm" because it is harder to change than an app on a phone, but softer than the circuit board itself. Firmware roles care a great deal about timing, memory limits and exactly how the hardware behaves, which is why these roles are among the ones that sometimes use a take-home.
:::

::: context convergence-picture Halve the step, watch the error fall
A computer solves a motion problem by taking small time steps. Smaller steps mean less error, and a well-coded method shrinks its error at a predictable rate. For a fourth-order method like RK4, halving the step divides the error by about $2^4 = 16$. The bars below are the two errors from the code in the lesson, drawn to scale. If your own code shows a ratio near 16, the method is very likely coded right; a ratio near 2 or 4 means something inside it is wrong.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="330" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <rect x="80" y="27" width="70" height="133" fill="#1d6fd1"/>
  <rect x="220" y="152" width="70" height="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="115" y="20">3.33e-7</text>
    <text x="255" y="145">2.00e-8</text>
    <text x="115" y="178">step h = 0.1</text>
    <text x="255" y="178">step h = 0.05</text>
  </g>
  <text x="255" y="80" font-size="13" fill="#b4232c" text-anchor="middle">about 16 times smaller</text>
  <line x1="165" y1="90" x2="232" y2="140" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="232,140 222,137 228,130" fill="#b4232c"/>
</svg>
```
:::

::: context readme-word Why it shouts its name
"README" is an instruction: read me first. The capital letters are an old habit from early computer systems, where one common explanation is that capitals sorted ahead of lowercase names in a file listing, so the file appeared near the top. Today almost every code-hosting site shows a project's README automatically on its front page. For a reviewer, it is the first thing seen and often the only thing read in full.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="130" rx="6" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44">
    <text x="24" y="34" font-weight="700">attitude-integrator/</text>
    <text x="44" y="56" fill="#1d6fd1" font-weight="700">README.md</text>
    <text x="44" y="76">CMakeLists.txt</text>
    <text x="44" y="96">src/integrator.cpp</text>
    <text x="44" y="116">tests/test_integrator.cpp</text>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="200" y="56">read this first</text>
    <text x="200" y="76">pinned build</text>
    <text x="200" y="96">the core</text>
    <text x="200" y="116">the evidence</text>
  </g>
</svg>
```
:::

::: context pinned-versions Freezing the ingredients
Most programs lean on outside **libraries** — code other people wrote, such as NumPy for math in Python. Libraries change over time, and a new version can quietly change a result or break a program. **Pinning** means writing down the exact version you used, for example `numpy==1.26.4` in a Python requirements file, so the reader installs the same thing you did. It is like a recipe that says "Brand X flour" instead of plain "flour": the cake comes out the same in someone else's kitchen.
:::

::: context time-box-word A box with a fixed size
A **time box** is a fixed amount of time set aside for a task, where the time stays fixed and the scope bends to fit. The term comes from software project management. Engineers use it every day: "spend two hours finding out whether this approach works, then we decide." Keeping to one is a real engineering skill, because flight programs run on schedules, and someone who finishes the important part inside the box is more useful than someone who delivers everything three days late.
:::

::: context export-controlled-bridge The ITAR gate, again
Export-controlled material is technical information the law restricts — for rockets and spacecraft in the US, mainly under **ITAR** (said "eye-tar"), which the first career module covered. Sharing it with the wrong person, or even posting it somewhere they could see it, can be a legal violation, not only a breach of trust. A take-home goes to people you have never met, through systems you do not control. So anything you did for a previous employer, controlled or not, stays out; you write the whole submission from scratch.
:::

::: context attitude-singularity Where three angles break down
One common way to describe which way a vehicle points uses three angles, like yaw, pitch and roll. Every three-number description has a spot where it misbehaves: for the usual yaw–pitch–roll order, when pitch reaches $90^\circ$ the yaw and roll axes line up and the angles stop being unique. That spot is a **singularity**, often called **gimbal lock**. Four-number **quaternions** avoid it, which is one reason flight software uses them. A test that never goes near the singularity cannot tell you what your code does there — so naming it as untested is honest and smart.
:::

::: context edge-cases-word Testing at the edges
An **edge case** is an input at the edge of what the program expects: an empty file, the very last record, a value exactly at a limit, two things with the same timestamp. Most bugs hide there, because the everyday path gets exercised constantly and the edges almost never do. Real telemetry is full of edges — a radio link drops out and the final packet arrives cut off; a clock hiccups and stamps two samples alike. A reviewer will often look straight for how you handled them.
:::

::: context overrun-picture Four hours asked, fourteen spent
Drawn to scale, the overrun is hard to miss. Each block below is one hour. The brief asked for the top row; the candidate delivered the bottom one, which is 3.5 times as long. A reader does not need to see a timesheet to notice — the size of the submission tells them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="40">asked</text>
    <text x="10" y="90">spent</text>
  </g>
  <g fill="#1d6fd1" stroke="#ffffff" stroke-width="2">
    <rect x="60" y="24" width="20" height="24"/><rect x="80" y="24" width="20" height="24"/>
    <rect x="100" y="24" width="20" height="24"/><rect x="120" y="24" width="20" height="24"/>
  </g>
  <g fill="#f2b880" stroke="#ffffff" stroke-width="2">
    <rect x="60" y="74" width="20" height="24"/><rect x="80" y="74" width="20" height="24"/>
    <rect x="100" y="74" width="20" height="24"/><rect x="120" y="74" width="20" height="24"/>
    <rect x="140" y="74" width="20" height="24"/><rect x="160" y="74" width="20" height="24"/>
    <rect x="180" y="74" width="20" height="24"/><rect x="200" y="74" width="20" height="24"/>
    <rect x="220" y="74" width="20" height="24"/><rect x="240" y="74" width="20" height="24"/>
    <rect x="260" y="74" width="20" height="24"/><rect x="280" y="74" width="20" height="24"/>
    <rect x="300" y="74" width="20" height="24"/><rect x="320" y="74" width="20" height="24"/>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="150" y="41">4 hours</text>
    <text x="60" y="114">14 hours</text>
  </g>
</svg>
```
:::
