---
id: l11-what-to-practice-now
title: "What to practice now, alone, that actually transfers"
minutes: 17
covers:
  - 6-DOF simulation stacks and what high fidelity actually means
  - version control, code review and what production-quality means at senior level
---

The opening lesson of this module described a gap: a self-study plan naturally trains what is easy to check alone — does the trajectory look right, does the derivation hold together — and quietly skips the part that is hard to check alone, which turns out to be most of the actual job. Ten lessons later, that job has a much more specific shape: reading a codebase someone else built, working inside a machine with real deadlines, trusting redundant hardware only because it was tested, treating a dispersion campaign's claim as narrower than it sounds, handling units and frames like they matter because they do, and getting a change through a review built around a specific, learnable list of questions. None of that requires a real employer, a real flight computer, or a review process to start practicing. This closing lesson is about the four habits from that list that transfer directly, and how to build each one, alone, starting immediately.

## Read unfamiliar code on purpose, not only your own

Writing your own simulation from scratch — which the rest of this curriculum has you doing constantly — trains a real and necessary skill: understanding the physics and the mathematics well enough to implement them correctly. It does not train the separate skill this module's third lesson was about: finding your way through code you did not write, distinguishing the model actually in use from the one that merely looks plausible, and understanding a function's behavior before trusting it. That skill only develops by deliberately practicing on unfamiliar code, which means seeking it out rather than waiting to be handed it.

A concrete way to build this now: take a small-to-medium simulation, numerical, or scientific codebase you did not write — many exist publicly, and the specific one matters far less than the practice — and give yourself a real question about it, the way an actual assignment would: find where a specific physical quantity is computed, determine whether more than one candidate implementation exists, and trace the actual call path to settle which one is really in use, exactly as the atmosphere-model example earlier in this module demonstrated. Do this regularly, on genuinely unfamiliar code, and the specific skill of navigating a large, imperfectly organized codebase — as opposed to the skill of building your own clean one — gets the deliberate practice it otherwise never would.

## Write the test before the fix — on your own code too

The single most concrete, most immediately practicable habit from this entire module is characterization testing: before changing a function you did not just write — including your own code from a month ago, which by then is functionally unfamiliar — record what it currently does on a handful of representative inputs, as an executable test, before touching anything.

::: example Characterizing an actuator-lag filter before changing it
A first-order lag filter — the kind of simple actuator or sensor dynamics model you might find inside an unfamiliar 6-DOF stack's actuator block — smooths a sequence of commanded values:

```python
def lag_filter(commands, alpha=0.3):
    out, prev = [], commands[0]
    for x in commands:
        prev = alpha*x + (1 - alpha)*prev
        out.append(prev)
    return out
```

Before changing anything, its current behavior on a representative input is captured as a test, deliberately, before any modification is made:

```python
sample = [10.0, 10.4, 9.8, 15.0, 10.1, 10.3]
current = [round(v, 6) for v in lag_filter(sample)]
print(current)
# [10.0, 10.12, 10.024, 11.5168, 11.09176, 10.854232]
```

The actual task is to fix an undocumented design choice — the filter silently seeds its initial state from the first sample rather than accepting a real initial condition from the caller — by giving it an explicit `initial` parameter:

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

Every value changed, not only the first one — because a first-order lag's memory of its initial condition decays gradually rather than vanishing after one sample, so a change to that initial condition ripples through the entire output. Without the characterization test captured beforehand, this would be easy to interpret as "I only meant to fix the startup behavior, why did the whole output shift" and to second-guess whether something else broke. With it, the test tells you precisely and immediately: this is the expected, complete consequence of the change you made, not a new defect — exactly the clarity a test written before the change is supposed to provide.
:::

Practicing this deliberately, on every exercise in this curriculum from here on, builds the actual habit this module has been describing rather than a concept you can define but not yet execute under time pressure. It is available to you right now, with no employer, no review process, and no flight computer required.

## Keep a record good enough for someone else — including future you

A lab notebook, in the sense this module means it, is not a diary. It is a discipline: every time you produce a result worth keeping, write down what produced it — the exact inputs, the configuration, the seed if any randomness was involved, and, where it matters, the versions of the tools you used — at the time you produce it, not reconstructed afterward from memory.

::: example A number, and a result
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

The bad record and the good record report almost the same number, and only one of them is worth anything six months later. The bad record cannot be checked, cannot be reproduced, and cannot be compared against a later result with any confidence that a difference reflects a real change rather than a different unrecorded random draw. The good record can be rerun, character for character, by anyone who has the code — including the same person, long after the details would otherwise have been forgotten.
:::

This costs a few extra lines at the moment a result is produced. It is dramatically cheaper than trying to reconstruct, weeks later, exactly what configuration produced a number somebody now needs to trust or defend — which is the actual, common alternative when the habit is skipped.

::: key
Four habits carry directly from this module into solo practice, starting today: deliberately reading code you did not write, characterizing a function's current behavior in a test before changing it, recording a result's exact inputs and configuration at the moment it is produced, and defaulting every result involving randomness to a fixed, recorded seed. None of the four requires an employer, a review process, or a real flight computer — only the decision to practice them on every exercise from here on, not only the ones that happen to call for them explicitly.
:::

::: warning "I'll write it down properly later" does not happen
The specific configuration behind a result is easiest to record in the minute it is produced and gets progressively harder, then effectively impossible, to reconstruct honestly as time passes. Treat the record as part of producing the result, not as a follow-up task, because in practice the follow-up task does not happen.
:::

## What none of this module should leave as a surprise

Put together, the ten lessons before this one describe a specific, learnable shape for the job: the production language is C++, with Python running the analysis, tooling, pipelines and tests around it, and MATLAB or Simulink appearing as a secondary, employer-dependent tool; the code you inherit is large, and reading it carefully — including telling apart which of several similarly named functions is actually wired in — comes before changing it; the flight computer has a real deadline and a real, bounded budget, which is why so much of otherwise ordinary programming practice is off limits inside the control loop; hardware fails, which is why redundancy, voting and tested fault management exist as designed-in properties rather than afterthoughts; a claim about a vehicle's readiness rests on a dispersion campaign's stated sample and seed, not a single good-looking run; none of it runs without real infrastructure underneath; units and frames are where the most ordinary real mistakes hide; most calendar time goes to regression suites, red builds, tickets and reproducing results rather than deriving anything new; and a reviewer is checking a specific, namable list of things, not a vague impression of quality. None of that should be a surprise in your first month, because it has now been taught, directly, in this module — which was the entire point of writing it.

## Check yourself

::: check
Name the four practice habits this lesson identifies as transferring directly from this module into solo study, without needing an employer or a review process.
:::

::: answer
Deliberately reading unfamiliar code rather than only your own; writing a characterization test that captures a function's current behavior before changing it; keeping a record of a result's exact inputs, configuration and seed at the time the result is produced; and defaulting to a fixed, recorded random seed for anything involving randomness rather than treating reproducibility as optional.
:::

::: check
In the actuator-lag filter example, every output value changed after the fix, not only the first one. Explain what practicing "test before fix" specifically bought you in that situation.
:::

::: answer
It bought a precise, immediate way to distinguish an expected consequence of the change from an unrelated new defect. Without a captured baseline, seeing every value shift after what was meant to be a small fix could easily read as evidence something else broke; with the baseline captured beforehand, the test shows exactly and specifically that the whole-output shift is the correct, complete consequence of changing the initial condition in a filter whose memory decays gradually rather than vanishing after one sample — removing the guesswork entirely.
:::

::: check
Explain why deliberately reading code you did not write is a different skill from writing your own simulation from scratch, even though both involve the same kind of subject matter.
:::

::: answer
Writing your own simulation trains understanding the underlying physics and mathematics well enough to implement them correctly, in code whose structure and history you already fully know because you built it. Reading someone else's code trains a separate skill: navigating an unfamiliar structure, telling apart a currently active implementation from a similar-looking but unused one, and building trust in code whose author, history and reasoning are not available to you directly. A curriculum built entirely around writing your own simulations never exercises that second skill, which is why it has to be sought out deliberately rather than assumed to come along for free.
:::

::: check
Using the ideas in this lesson, design a minimal lab-notebook convention suitable for solo practice, and state what each piece of it is for.
:::

::: answer
A reasonable minimal convention: for every result worth keeping, record the date, the exact code version or a description specific enough to reconstruct it, every input parameter and configuration value used, the random seed if any randomness was involved, the versions of any libraries the result depends on, and the result itself — all written down at the time the result is produced. Each piece serves reproducibility directly: the code version and configuration let the computation be rerun exactly, the seed removes the last source of run-to-run variation, and the library versions rule out an environment-driven difference, such as the kind a NumPy version change can silently cause, as an explanation if the result cannot later be reproduced.
:::

::: check
A learner who has finished this module asks what the single highest-leverage change to make in how they practice, starting tomorrow, would be. Answer using this lesson's content, and justify the choice.
:::

::: answer
The highest-leverage change is adopting characterization testing as a default habit on every exercise from here on: before modifying any function not written in the last few minutes, capture what it currently does on a few representative inputs as an executable test, then make the change. It is justified as the single best choice because it is immediately actionable with no dependency on finding unfamiliar codebases or accumulating a backlog of results to record, it directly builds the habit a reviewer's most concrete question — does this change include the test that would have caught the problem — assumes is already normal, and it pays off on the very next exercise attempted rather than only in some future job.
:::

## Summary

| Habit | What it produces |
| --- | --- |
| Deliberately read unfamiliar code | The navigation skill a from-scratch simulation never exercises |
| Characterize before you change | A precise baseline that turns "did I break this" into a checkable fact |
| Record inputs, config and seed at the time | A result that is still evidence months later, not a memory |
| Default to a fixed, recorded seed | Removes randomness as an unrecorded, unexplainable source of difference |

This module closes here. The lessons that follow it in this curriculum return to derivation and analysis — the part of the job a textbook already prepares you for — carried forward with the practice habits this module was written to add.
