---
id: l11-what-to-practice-now
title: "What to practice now, alone, that actually transfers"
minutes: 19
covers:
  - 6-DOF simulation stacks and what high fidelity actually means
  - version control, code review and what production-quality means at senior level
---

Learning to swim from a book has a problem. You can memorize every stroke and still sink the first time you jump in. The only fix is to get in the water — even the shallow end, even alone — and practice the exact moves the real thing needs.

The first lesson of this module described a gap like that. When you study alone, you naturally practice what is easy to check alone: does the trajectory look right, does the derivation hold together? You quietly skip what is hard to check alone — and that turns out to be most of the actual job.

Ten lessons later, that job has a clear shape. You read a codebase someone else built. You work inside a computer with real deadlines. You trust redundant hardware only because it was tested. You treat a dispersion campaign's claim as narrower than it sounds. You handle units and frames with care, because that is where real mistakes hide. And you get changes through a review built around a specific list of questions.

None of that needs a real employer, a real flight computer or a real review process to start practicing. This closing lesson picks out the habits that carry over directly, and shows how to build each one on your own, starting today.

## Read unfamiliar code on purpose, not only your own

Writing your own simulation from scratch — which this course has you doing constantly — trains a real and necessary skill. You learn the physics and the mathematics well enough to turn them into correct code.

It does not train a second skill, the one from this module's third lesson: finding your way through code you did not write. That skill has three parts. You work out where things live. You tell apart the model that is actually in use from one that only looks plausible. And you understand what a function does before you trust it.

Recall what that third lesson said a real **6-DOF stack** looks like. **6-DOF** (said "six D-O-F", for six degrees of freedom) means the simulation tracks three directions of movement and three directions of rotation together. Around that core sit an environment model (gravity, atmosphere, wind), a mass-properties model, aerodynamics, propulsion, sensor models and actuator models. Each one can exist at more than one level of **[[fidelity|fidelity-dial]]** — how much of the real physics it captures — so a mature codebase often holds an old version, a new default and a fast simplified one side by side. Your own clean simulation never has that clutter. A real one always does.

The reading skill only grows with deliberate practice on code you did not write. So go and find some. Take a small-to-medium simulation, numerical or scientific codebase — [[many exist publicly|open-sim-code]], and which one matters far less than the practice. Then give yourself a real question about it, the way an actual assignment would:

1. Find where a specific physical quantity (say, air density) is computed.
2. Check whether more than one candidate function exists for it.
3. Start from the entry point that actually runs, and follow the imports and calls down until you know which candidate is really in use — exactly as the atmosphere-model example in the third lesson did.

Do this regularly, on truly unfamiliar code. Then the skill of navigating a large, imperfectly organized codebase — which is different from the skill of building your own clean one — gets practice it would otherwise never get.

## Write the test before the fix — on your own code too

The single most concrete habit from this whole module is the **[[characterization test|characterization-name]]**: a test that records what a piece of code *currently does*, whether or not that is what it *should* do. Before you change a function you did not write recently, you run it on a handful of typical inputs and save the results as an executable test. Only then do you touch it.

"Did not write recently" includes your own code from a month ago. By then it is, for practical purposes, someone else's code.

Why bother? Because after the change, the test tells you exactly what moved. Every difference is either something you meant to change, or a surprise you need to look into. Without the baseline, you cannot tell those two apart.

::: example Characterizing an actuator-lag filter before changing it
A **[[first-order lag filter|lag-filter]]** is a simple model of a sensor or actuator that cannot jump instantly to a new value. It is the kind of thing you might find in the actuator block of an unfamiliar 6-DOF stack. Each new output moves a fraction $\alpha$ (the Greek letter "alpha", here $0.3$) of the way from the previous output toward the new command:

$$
y_k = \alpha\,x_k + (1 - \alpha)\,y_{k-1}
$$

Read $y_k$ as "y sub k", the output at step $k$, and $x_k$ as the command at step $k$. Here is the code:

```python
def lag_filter(commands, alpha=0.3):
    out, prev = [], commands[0]
    for x in commands:
        prev = alpha*x + (1 - alpha)*prev
        out.append(prev)
    return out
```

**Step 1: capture the current behavior, before changing anything.**

```python
sample = [10.0, 10.4, 9.8, 15.0, 10.1, 10.3]
current = [round(v, 6) for v in lag_filter(sample)]
print(current)
# [10.0, 10.12, 10.024, 11.5168, 11.09176, 10.854232]
```

Check the first two by hand. The filter starts with `prev` equal to the first command, $10.0$. Step 1: $0.3 \times 10.0 + 0.7 \times 10.0 = 10.0$. Step 2: $0.3 \times 10.4 + 0.7 \times 10.0 = 3.12 + 7.0 = 10.12$. Both match.

**Step 2: make the change.** The task is to fix an undocumented design choice. The filter quietly takes its starting state from the first sample, instead of letting the caller give a real starting value. The fix adds an explicit `initial` parameter:

```python
def lag_filter_fixed(commands, alpha=0.3, initial=0.0):
    out, prev = [], initial
    for x in commands:
        prev = alpha*x + (1 - alpha)*prev
        out.append(prev)
    return out

after = [round(v, 6) for v in lag_filter_fixed(sample, initial=0.0)]
print(after)
# [3.0, 5.22, 6.594, 9.1158, 9.41106, 9.677742]
```

Check the first one: $0.3 \times 10.0 + 0.7 \times 0.0 = 3.0$. It matches.

**Step 3: read what the test tells you.** Every value changed, not only the first. That might look alarming: "I only meant to fix the startup, why did the whole output shift?" But the gap between the two runs shrinks in a very regular way: $7.0$, then $4.9$, then $3.43$, down to about $1.18$ at step 6. Each gap is $0.7$ times the one before. A first-order lag's memory of its starting value fades gradually; it does not vanish after one sample.

So with the baseline in hand, the answer is precise and immediate. The whole-output shift is the expected, complete consequence of the change you made — not a new bug. That clarity is exactly what a test written *before* the change is for.
:::

::: note Why every value had to move
Call the two outputs $y_k$ (old) and $z_k$ (new). Both follow the same rule with the same commands, so subtract one rule from the other. The $\alpha\,x_k$ parts cancel:

$$
y_k - z_k = (1 - \alpha)\,(y_{k-1} - z_{k-1})
$$

Each step multiplies the gap by $1 - \alpha = 0.7$. The starting gap was $10 - 0 = 10$, so the gap after $k$ steps is $10 \times 0.7^k$. At step 6 that is $10 \times 0.117649 = 1.17649$, and indeed $10.854232 - 9.677742 = 1.17649$. The gap shrinks every step but never becomes exactly zero.
:::

Practice this on every exercise in the course from here on. That builds the actual habit, not a concept you can define but cannot yet carry out under time pressure. It is the kind of **[[deliberate practice|deliberate-practice]]** that makes a skill automatic. And you can start right now, with no employer, no review process and no flight computer.

## Keep a record good enough for someone else — including future you

A **[[lab notebook|lab-notebook]]**, in the sense this module means, is not a diary. It is a discipline. Every time you produce a result worth keeping, you write down what produced it: the exact inputs, the configuration, the **[[seed|random-seed]]** (the starting number for any random draws), and, where it matters, the [[versions of the tools|library-versions]] you used. You write it at the moment you produce the result — not rebuilt afterward from memory.

::: example A number, and a result
The two records below come from the dispersion-campaign model of the sixth lesson, run with 5,000 cases. The headline number is the **[[p99|percentile]]** miss distance — the distance that 99 percent of cases land within.

```text
bad record:  "miss distance p99 = 207 m"
```

```text
good record:
  date      = 2026-09-22
  python    = 3.11.15
  numpy     = 2.4.6
  seed      = 20260922
  n_cases   = 5000
  model     = miss = 14.2*wind + 380*timing_err*cd_err + noise(0, 2.0)
  result    = p99 |miss| = 206.04 m
```

Both records report almost the same number. Only one is worth anything six months later.

**The bad record** cannot be checked or rerun. If a later campaign gives $212\,\mathrm{m}$, nobody can say whether something really changed or whether it was a different, unrecorded random draw.

**The good record** can be rerun, character for character, by anyone who has the code — including the same person, long after the details are forgotten. Sanity check: rerunning that model with seed 20260922 and 5,000 cases gives a p99 of $206.04\,\mathrm{m}$, the recorded value.
:::

Recording costs a few extra lines at the moment a result is made. That is far cheaper than the usual alternative: trying, weeks later, to rebuild exactly which configuration produced a number somebody now needs to trust or defend.

::: key The four habits that transfer
Four habits carry directly from this module into solo practice, starting today: deliberately reading code you did not write, characterizing a function's current behavior in a test before changing it, recording a result's exact inputs and configuration at the moment it is produced, and defaulting every result involving randomness to a fixed, recorded seed. None of the four requires an employer, a review process, or a real flight computer — only the decision to practice them on every exercise from here on, not only the ones that happen to call for them explicitly.
:::

::: warning "I'll write it down properly later" does not happen
The configuration behind a result is easiest to record in the minute it is produced. After that it gets harder, and then impossible, to rebuild honestly. Treat the record as part of producing the result, not as a follow-up task — because in practice the follow-up task does not happen.
:::

## What none of this module should leave as a surprise

Put the ten earlier lessons together and the job has a specific, learnable shape:

- **Languages.** The production language is C++. Python runs the analysis, tooling, pipelines and tests around it. MATLAB or Simulink shows up as a secondary tool that depends on the employer.
- **Inherited code.** The code you inherit is large. Reading it carefully — including telling which of several similarly named functions is actually wired in — comes before changing it.
- **The machine.** The flight computer has a real deadline and a real, bounded budget. That is why so much ordinary programming practice is off limits inside the control loop.
- **Failure.** Hardware fails. Redundancy, voting and tested fault management are designed in from the start, not added afterward.
- **Evidence.** A claim about a vehicle's readiness rests on a dispersion campaign with a stated sample size and seed, not on one good-looking run.
- **Infrastructure.** None of it runs without real infrastructure underneath.
- **Data.** Units and frames are where the most ordinary real mistakes hide.
- **The daily work.** Most calendar time goes to regression suites, red builds, tickets and reproducing results — not to deriving anything new.
- **Review.** A reviewer checks a specific list of things, not a vague impression of quality.

None of that should surprise you in your first month on the job, because this module has now taught it directly. That was the whole point of writing it. The build exercises that come with this module are the [[first place to use all four habits|module-exercises]].

## Check yourself

::: check
Name the four practice habits this lesson says carry directly from this module into solo study, without needing an employer or a review process.
:::

::: answer
1. Deliberately reading unfamiliar code, not only your own.
2. Writing a characterization test that captures a function's current behavior before changing it.
3. Recording a result's exact inputs, configuration and seed at the moment the result is produced.
4. Defaulting to a fixed, recorded random seed for anything involving randomness, instead of treating reproducibility as optional.
:::

::: check
In the actuator-lag filter example, every output value changed after the fix, not only the first. What did practicing "test before fix" buy you in that situation?
:::

::: answer
It gave a precise, immediate way to tell an expected consequence of the change from an unrelated new bug.

Without a saved baseline, seeing every value shift after what was meant to be a small fix could easily look like something else broke. With the baseline captured first, the test shows exactly how the output moved. The gap between old and new starts at $7.0$ and shrinks by a factor of $0.7$ each step, which is the correct, complete consequence of changing the starting value of a filter whose memory fades gradually. The guesswork is gone.
:::

::: check
Why is deliberately reading code you did not write a different skill from writing your own simulation from scratch, even though both deal with the same subject?
:::

::: answer
Writing your own simulation trains you to understand the physics and mathematics well enough to implement them correctly — in code whose structure and history you already know completely, because you built it.

Reading someone else's code trains a separate skill: finding your way around an unfamiliar structure, telling the implementation actually in use from a similar-looking unused one, and building trust in code whose author, history and reasoning you cannot ask about directly. A course built only around writing your own simulations never exercises that second skill. So it has to be sought out on purpose; it does not come along for free.
:::

::: check
Using this lesson's ideas, design a minimal lab-notebook convention for solo practice, and say what each piece is for.
:::

::: answer
For every result worth keeping, record — at the time the result is produced:

- **the date**, so results can be put in order;
- **the exact code version**, or a description specific enough to rebuild it, so the computation can be rerun exactly;
- **every input parameter and configuration value**, for the same reason;
- **the random seed**, if there was any randomness, which removes the last source of run-to-run variation;
- **the versions of the libraries** the result depends on, so an environment difference — such as a change in NumPy's version — can be ruled in or out if the result later fails to reproduce;
- **the result itself.**

Each piece serves reproducibility directly.
:::

::: check
A learner who has finished this module asks for the single highest-leverage change to how they practice, starting tomorrow. Answer using this lesson, and justify the choice.
:::

::: answer
Make characterization testing a default habit on every exercise from here on. Before modifying any function not written in the last few minutes, capture what it currently does on a few typical inputs as an executable test, then make the change.

Why this one:

- It is actionable immediately. It does not depend on finding an unfamiliar codebase or on building up a backlog of results to record.
- It builds the habit behind a reviewer's most concrete question — "does this change include the test that would have caught the problem?" — so that it is already normal by the time someone asks.
- It pays off on the very next exercise, not only in some future job.
:::

## Summary

| Habit | What it produces |
| --- | --- |
| Deliberately read unfamiliar code | The navigation skill a from-scratch simulation never exercises |
| Characterize before you change | A precise baseline that turns "did I break this?" into a checkable fact |
| Record inputs, config and seed at the time | A result that is still evidence months later, not a memory |
| Default to a fixed, recorded seed | Removes randomness as an unrecorded, unexplainable source of difference |
| Lag-filter memory | The gap from a changed start shrinks by $(1 - \alpha)$ each step: $10 \times 0.7^k$ in the example |
| 6-DOF fidelity | A dial, not a switch: each sub-model can be simple or detailed, and a real stack keeps several |

This module closes here. The lessons that follow return to derivation and analysis — the part of the job a textbook already prepares you for — carrying forward the practice habits this module was written to add.

::: context fidelity-dial Fidelity is a dial
**Fidelity** means faithfulness — how closely a copy matches the original. Old record players were sold as "hi-fi", high fidelity, because they sounded close to a live band. In simulation, a drag model can be one fixed number (low fidelity) or a big table that depends on speed and angle (high fidelity). Higher fidelity costs computer time, and a dispersion campaign may run the same scenario thousands of times. So engineers pick the fidelity that the question actually needs, not the most detailed one available.
:::

::: context open-sim-code Real code you can read for free
Some real flight-simulation codebases are **open source**, meaning anyone can download and read them. Two examples: **JSBSim**, a flight-dynamics model used by flight simulators and research groups, and **Basilisk**, a spacecraft-simulation framework from the University of Colorado Boulder with a C and C++ core driven from Python. Both have the features this module describes: many sub-models, several versions of some of them, and history going back years. Pick one, ask it a real question, and follow the calls.
:::

::: context characterization-name Where the name comes from
The phrase **characterization test** was made popular by Michael Feathers in his 2004 book *Working Effectively with Legacy Code*. To **characterize** something is to describe what it is like — its character. Feathers defined "legacy code" bluntly as code without tests, and argued that the safe way to change it is first to pin down what it does today, even the odd parts, so that every later difference is one you chose.
:::

::: context lag-filter A filter that cannot jump
A **lag filter** behaves like a heavy door on a slow closer: push it, and it follows your push gradually. Real actuators — a nozzle swiveling, a fin turning — cannot move instantly, so simulations use filters like this to model them. The picture shows the example's commands (gray), the original filter (blue), which starts at the first command, and the fixed one started at zero (red). Watch the red line catch up; the gap shrinks by $0.7$ each step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="190" x2="340" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="190" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="194">0</text><text x="34" y="144">5</text><text x="34" y="94">10</text><text x="34" y="44">15</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="205">1</text><text x="110" y="205">2</text><text x="160" y="205">3</text>
    <text x="210" y="205">4</text><text x="260" y="205">5</text><text x="310" y="205">6</text>
  </g>
  <text x="340" y="205" font-size="11" fill="#6c7a93" text-anchor="end">step</text>
  <polyline points="60,90 110,86 160,92 210,40 260,89 310,87" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polyline points="60,90 110,88.8 160,89.8 210,74.8 260,79.1 310,81.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="60,160 110,137.8 160,124.1 210,98.8 260,95.9 310,93.2" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="218" y="36" font-size="11" fill="#6c7a93">command</text>
  <text x="50" y="66" font-size="11" fill="#1d6fd1">start = first command</text>
  <text x="120" y="160" font-size="11" fill="#b4232c">start = 0</text>
</svg>
```
:::

::: context deliberate-practice Practice that aims at a weak spot
**Deliberate practice** is a term from the psychologist K. Anders Ericsson, who studied how musicians, athletes and chess players become expert. His finding, roughly: hours alone do not make you better. What helps is practice aimed at a specific weakness, with quick feedback on whether you got it right. A characterization test is built-in feedback. Each time you change code, it tells you at once what moved.
:::

::: context lab-notebook The scientist's notebook
Working scientists have long kept a **lab notebook**: a bound book with numbered pages, each entry dated, written in ink, with nothing torn out. The rule is that you record what you did as you do it, so the record can be trusted later — by your team, a reviewer, or you. For a programmer the same idea can live in a plain text file or a results log next to the code. What matters is the habit, not the paper.
:::

::: context random-seed Same seed, same "random" numbers
Computers make random-looking numbers with a recipe called a **pseudo-random number generator**. Give it a starting number — the **seed** — and it produces a long sequence that looks random but is completely fixed. Same seed, same sequence, on any run. With no seed, the generator picks a fresh start each time, and the numbers differ.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="100" height="36" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="60" y="35" font-size="12" fill="#1d6fd1" text-anchor="middle">seed 20260922</text>
  <text x="125" y="35" font-size="12" fill="#1f2a44">713397 991821 897099 …</text>
  <rect x="10" y="58" width="100" height="36" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="60" y="81" font-size="12" fill="#1d6fd1" text-anchor="middle">seed 20260922</text>
  <text x="125" y="81" font-size="12" fill="#1f2a44">713397 991821 897099 …</text>
  <rect x="10" y="104" width="100" height="36" rx="6" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <text x="60" y="127" font-size="12" fill="#b4232c" text-anchor="middle">no seed</text>
  <text x="125" y="127" font-size="12" fill="#6c7a93">different every run</text>
</svg>
```

The numbers are the first draws from NumPy's `default_rng(20260922)` when asked for whole numbers below one million.
:::

::: context library-versions Why the version number matters
A **library** is a package of ready-made code, like NumPy for numerical work. Libraries change between versions: a default setting moves, a calculation is done in a slightly different order, or a random generator is improved. NumPy itself added a new style of random generator in 2019, and the same seed does not give the same numbers in the old and new styles. So a result can shift with nothing in *your* code changing. Writing the version down lets you rule that in or out later.
:::

::: context percentile Reading "p99"
A **percentile** answers "how many cases are below this line?" Sort all the miss distances from smallest to largest. The 99th percentile, written p99, is the distance that 99 percent of cases fall within. In a grid of 100 cases, 99 are inside the p99 line and one is beyond it. Engineers like p99 because it describes the bad cases without being set entirely by the single worst one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g>
    <rect x="20" y="12" width="12" height="12" fill="#8fb8f0"/>
    <rect x="34" y="12" width="12" height="12" fill="#8fb8f0"/>
    <rect x="48" y="12" width="12" height="12" fill="#8fb8f0"/>
    <rect x="62" y="12" width="12" height="12" fill="#8fb8f0"/>
    <rect x="76" y="12" width="12" height="12" fill="#8fb8f0"/>
    <rect x="90" y="12" width="12" height="12" fill="#8fb8f0"/>
    <rect x="104" y="12" width="12" height="12" fill="#8fb8f0"/>
    <rect x="118" y="12" width="12" height="12" fill="#8fb8f0"/>
    <rect x="132" y="12" width="12" height="12" fill="#8fb8f0"/>
    <rect x="146" y="12" width="12" height="12" fill="#8fb8f0"/>
    <rect x="20" y="26" width="12" height="12" fill="#8fb8f0"/>
    <rect x="34" y="26" width="12" height="12" fill="#8fb8f0"/>
    <rect x="48" y="26" width="12" height="12" fill="#8fb8f0"/>
    <rect x="62" y="26" width="12" height="12" fill="#8fb8f0"/>
    <rect x="76" y="26" width="12" height="12" fill="#8fb8f0"/>
    <rect x="90" y="26" width="12" height="12" fill="#8fb8f0"/>
    <rect x="104" y="26" width="12" height="12" fill="#8fb8f0"/>
    <rect x="118" y="26" width="12" height="12" fill="#8fb8f0"/>
    <rect x="132" y="26" width="12" height="12" fill="#8fb8f0"/>
    <rect x="146" y="26" width="12" height="12" fill="#8fb8f0"/>
    <rect x="20" y="40" width="12" height="12" fill="#8fb8f0"/>
    <rect x="34" y="40" width="12" height="12" fill="#8fb8f0"/>
    <rect x="48" y="40" width="12" height="12" fill="#8fb8f0"/>
    <rect x="62" y="40" width="12" height="12" fill="#8fb8f0"/>
    <rect x="76" y="40" width="12" height="12" fill="#8fb8f0"/>
    <rect x="90" y="40" width="12" height="12" fill="#8fb8f0"/>
    <rect x="104" y="40" width="12" height="12" fill="#8fb8f0"/>
    <rect x="118" y="40" width="12" height="12" fill="#8fb8f0"/>
    <rect x="132" y="40" width="12" height="12" fill="#8fb8f0"/>
    <rect x="146" y="40" width="12" height="12" fill="#8fb8f0"/>
    <rect x="20" y="54" width="12" height="12" fill="#8fb8f0"/>
    <rect x="34" y="54" width="12" height="12" fill="#8fb8f0"/>
    <rect x="48" y="54" width="12" height="12" fill="#8fb8f0"/>
    <rect x="62" y="54" width="12" height="12" fill="#8fb8f0"/>
    <rect x="76" y="54" width="12" height="12" fill="#8fb8f0"/>
    <rect x="90" y="54" width="12" height="12" fill="#8fb8f0"/>
    <rect x="104" y="54" width="12" height="12" fill="#8fb8f0"/>
    <rect x="118" y="54" width="12" height="12" fill="#8fb8f0"/>
    <rect x="132" y="54" width="12" height="12" fill="#8fb8f0"/>
    <rect x="146" y="54" width="12" height="12" fill="#8fb8f0"/>
    <rect x="20" y="68" width="12" height="12" fill="#8fb8f0"/>
    <rect x="34" y="68" width="12" height="12" fill="#8fb8f0"/>
    <rect x="48" y="68" width="12" height="12" fill="#8fb8f0"/>
    <rect x="62" y="68" width="12" height="12" fill="#8fb8f0"/>
    <rect x="76" y="68" width="12" height="12" fill="#8fb8f0"/>
    <rect x="90" y="68" width="12" height="12" fill="#8fb8f0"/>
    <rect x="104" y="68" width="12" height="12" fill="#8fb8f0"/>
    <rect x="118" y="68" width="12" height="12" fill="#8fb8f0"/>
    <rect x="132" y="68" width="12" height="12" fill="#8fb8f0"/>
    <rect x="146" y="68" width="12" height="12" fill="#8fb8f0"/>
    <rect x="20" y="82" width="12" height="12" fill="#8fb8f0"/>
    <rect x="34" y="82" width="12" height="12" fill="#8fb8f0"/>
    <rect x="48" y="82" width="12" height="12" fill="#8fb8f0"/>
    <rect x="62" y="82" width="12" height="12" fill="#8fb8f0"/>
    <rect x="76" y="82" width="12" height="12" fill="#8fb8f0"/>
    <rect x="90" y="82" width="12" height="12" fill="#8fb8f0"/>
    <rect x="104" y="82" width="12" height="12" fill="#8fb8f0"/>
    <rect x="118" y="82" width="12" height="12" fill="#8fb8f0"/>
    <rect x="132" y="82" width="12" height="12" fill="#8fb8f0"/>
    <rect x="146" y="82" width="12" height="12" fill="#8fb8f0"/>
    <rect x="20" y="96" width="12" height="12" fill="#8fb8f0"/>
    <rect x="34" y="96" width="12" height="12" fill="#8fb8f0"/>
    <rect x="48" y="96" width="12" height="12" fill="#8fb8f0"/>
    <rect x="62" y="96" width="12" height="12" fill="#8fb8f0"/>
    <rect x="76" y="96" width="12" height="12" fill="#8fb8f0"/>
    <rect x="90" y="96" width="12" height="12" fill="#8fb8f0"/>
    <rect x="104" y="96" width="12" height="12" fill="#8fb8f0"/>
    <rect x="118" y="96" width="12" height="12" fill="#8fb8f0"/>
    <rect x="132" y="96" width="12" height="12" fill="#8fb8f0"/>
    <rect x="146" y="96" width="12" height="12" fill="#8fb8f0"/>
    <rect x="20" y="110" width="12" height="12" fill="#8fb8f0"/>
    <rect x="34" y="110" width="12" height="12" fill="#8fb8f0"/>
    <rect x="48" y="110" width="12" height="12" fill="#8fb8f0"/>
    <rect x="62" y="110" width="12" height="12" fill="#8fb8f0"/>
    <rect x="76" y="110" width="12" height="12" fill="#8fb8f0"/>
    <rect x="90" y="110" width="12" height="12" fill="#8fb8f0"/>
    <rect x="104" y="110" width="12" height="12" fill="#8fb8f0"/>
    <rect x="118" y="110" width="12" height="12" fill="#8fb8f0"/>
    <rect x="132" y="110" width="12" height="12" fill="#8fb8f0"/>
    <rect x="146" y="110" width="12" height="12" fill="#8fb8f0"/>
    <rect x="20" y="124" width="12" height="12" fill="#8fb8f0"/>
    <rect x="34" y="124" width="12" height="12" fill="#8fb8f0"/>
    <rect x="48" y="124" width="12" height="12" fill="#8fb8f0"/>
    <rect x="62" y="124" width="12" height="12" fill="#8fb8f0"/>
    <rect x="76" y="124" width="12" height="12" fill="#8fb8f0"/>
    <rect x="90" y="124" width="12" height="12" fill="#8fb8f0"/>
    <rect x="104" y="124" width="12" height="12" fill="#8fb8f0"/>
    <rect x="118" y="124" width="12" height="12" fill="#8fb8f0"/>
    <rect x="132" y="124" width="12" height="12" fill="#8fb8f0"/>
    <rect x="146" y="124" width="12" height="12" fill="#8fb8f0"/>
    <rect x="20" y="138" width="12" height="12" fill="#8fb8f0"/>
    <rect x="34" y="138" width="12" height="12" fill="#8fb8f0"/>
    <rect x="48" y="138" width="12" height="12" fill="#8fb8f0"/>
    <rect x="62" y="138" width="12" height="12" fill="#8fb8f0"/>
    <rect x="76" y="138" width="12" height="12" fill="#8fb8f0"/>
    <rect x="90" y="138" width="12" height="12" fill="#8fb8f0"/>
    <rect x="104" y="138" width="12" height="12" fill="#8fb8f0"/>
    <rect x="118" y="138" width="12" height="12" fill="#8fb8f0"/>
    <rect x="132" y="138" width="12" height="12" fill="#8fb8f0"/>
    <rect x="146" y="138" width="12" height="12" fill="#b4232c"/>
  </g>
  <rect x="190" y="40" width="14" height="14" fill="#8fb8f0"/>
  <text x="212" y="52" font-size="12" fill="#1f2a44">99 cases within p99</text>
  <rect x="190" y="80" width="14" height="14" fill="#b4232c"/>
  <text x="212" y="92" font-size="12" fill="#1f2a44">1 case beyond it</text>
  <text x="190" y="130" font-size="11" fill="#6c7a93">sorted, smallest miss first</text>
</svg>
```
:::

::: context module-exercises Where to use the habits first
This module's build exercises are made for these habits. One asks for a fixed-step RK4 integrator in C++ with unit tests — write the tests that pin down its behavior before you tune anything. Another wraps it in a Python driver for at least 2,000 dispersed cases that must be reproducible from a seed and run from a single command — that is the lab-notebook habit, built into the code itself.
:::
