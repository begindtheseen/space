---
id: l02-the-write-up-structure
title: "The write-up: structure, and the ninety-second read"
minutes: 19
covers:
  - "the write-up structure: problem, model, assumptions, verification, validation, results, limitations"
---

The previous lesson named "documented" as one of the five words a portfolio project is judged by, and defined defensibility as five things that have to exist in writing. This lesson gives that writing an actual shape. A reviewer who opens your repository has, realistically, ninety seconds before deciding whether to keep reading — and a write-up that makes them work to find the requirement, the result, or the catch is a write-up that loses that ninety seconds before your strongest work is even seen. The fix is not more writing. It is a fixed structure, applied consistently, so a reader always knows where the next fact lives.

That structure has seven parts — problem, model, assumptions, verification, validation, results, limitations — and this lesson covers each one, plus where it lives in your repository and what a reader actually does with the first screen of it. The next lesson covers the technical content of verification specifically: what evidence actually earns the label. Here, the question is narrower and equally important: given that evidence exists, how do you arrange it so a stranger finds it in the order they need it?

## The seven parts, and what belongs in each

**Problem.** The requirement the project was built against, stated as a bar to clear rather than a description of activity — "land within a 10 m circular error probable given a bounded thrust envelope," not "explored powered descent guidance." This is the same requirement the defensibility checklist asked for; here it becomes the first thing a reader sees, because nothing else in the document means anything without it.

**Model.** What the project actually simulates or estimates, and at what fidelity — rigid body or flexible, point mass or extended, linear or nonlinear measurement model. State it in one or two sentences; the detail belongs in the assumptions that follow, not buried in code a reader has to open to understand what problem the code is even solving.

**Assumptions.** Every simplification the model makes, named individually rather than implied. "Two-body dynamics; no J2 or drag" is one line and removes an entire class of question before it is asked. An assumptions section that is empty is not evidence of a complete model — every model simplifies something, and a reviewer who finds no stated assumptions reasonably concludes they were not identified rather than that none exist.

**Verification.** The specific evidence that the code correctly solves the equations it claims to solve: an analytic case matched to a stated tolerance, a conserved quantity that stayed conserved, a convergence rate that behaved as the numerical method predicts. This section answers "did you build the thing right" — a question about internal consistency between the code and its own specification, answerable entirely inside the simulation, with no reference to the real world at all.

**Validation.** Whether the model's equations are themselves a trustworthy description of the real system — checked, where possible, against real hardware, flight data, or an independent source the author did not write. This answers a different question than verification: "did you build the right thing." A self-taught project can usually verify fully, since verification only requires the code and its own equations; validation is harder, since it requires an outside reference the author did not control, and most self-taught projects only partially clear this bar. Say so plainly rather than letting the two blur together — a perfectly verified simulation of the wrong model is still wrong, and a reviewer who cannot tell which claim you are making will assume the weaker one.

**Results.** The actual numbers the project produced, each with a unit and, where the project involved repeated trials, the worst case alongside the mean. A results section is not a restatement of what the code can do; it is what happened when it ran, with figures a reader can hold you to.

**Limitations.** Where the result stops being trustworthy, stated as specifically as the result itself — a step-size range where the integrator degrades, an eccentricity above which an assumption breaks, a regime the dispersion campaign never tested. This is the section the previous lesson called the known-failure case, and it belongs at the end of the write-up for the same reason a project talk closes on it: it is the last thing a reader should carry away, because it is what separates a claim from an honest one.

::: key
The seven-part structure is problem, model, assumptions, verification, validation, results, limitations, in that order. Verification asks whether the code was built right against its own specification; validation asks whether the specification itself is right about the world. A self-taught project can usually verify fully and validate only partially — state exactly which is which rather than letting a reader assume the stronger claim.
:::

## The repository layout

The write-up's structure should be visible in the repository's structure too, so a reader who wants to check a specific claim knows immediately which file to open rather than searching.

```text
project/
  README.md              <- the seven-part write-up; the first thing anyone opens
  requirements.txt        <- pinned dependency versions (next lesson)
  src/
    dynamics.py            <- the model, hand-written where the claims say hand-written
  tests/
    test_analytic_case.py  <- verification: the code this repo's claims are checked against
    test_conservation.py
  results/
    dispersion_summary.csv <- the numbers the README quotes, regenerable, not hand-typed in
  .github/workflows/ci.yml <- runs the tests on every push (next lesson)
```

A README that claims an energy-conservation check to $10^{-14}$ and a `tests/` directory with no file resembling that check is a contradiction a reviewer notices in seconds — the layout either backs the claims or quietly withdraws them.

## The ninety-second read

A busy reviewer's first pass through your README follows a fixed, fast pattern, and knowing that pattern tells you exactly what has to be visible without scrolling. In roughly the first ten seconds they read the title and the one-sentence result — if that sentence has no number in it, most of the ninety seconds are already lost, because there is nothing yet to evaluate. In the next twenty, they look for the one plot or number block that carries the argument, placed near the top rather than three sections down. In the next fifteen, they scan for a stated limitation, because its presence or absence is the fastest available signal for whether the rest of the document is worth a careful read. What remains is spent deciding whether to open a file — and that decision is made, not on the strength of your code, but on the strength of what the first screen already showed them.

This has a direct consequence for how a README should be ordered: the seven-part structure above is the complete document, but the *opening* of it is an inverted pyramid — problem and the headline result first, with a number, followed immediately by the one plot, and only then the fuller model, assumptions, verification, and limitations sections underneath. A document that opens with installation instructions or a long history of the project's development is technically complete and still fails the ninety-second read, because the reader never reaches the part that would have kept them reading.

::: example The first screen, weak ordering versus strong ordering
**Weak.** A README that opens: "This project was inspired by wanting to understand orbit determination better. It started as a simple least-squares fit and grew from there over several weekends. Below are installation instructions." The headline result, if it exists at all, is three screens down, after history and setup. A reviewer with ninety seconds never reaches it.

**Strong.** The same project's README opens: "Batch Gauss-Newton orbit determination from multi-station range data. Recovers a 4-state constant-velocity arc to 23 m in position and 0.23 mm/s in velocity (1-sigma, from a 400-trial Monte Carlo) using 50 m 1-sigma range measurements from four stations over a 300 s arc — formal covariance matches empirical scatter to within 8%." One plot of residual convergence follows immediately. Installation is near the bottom, where it belongs: necessary, but not what a reviewer's first ninety seconds are for.
:::

## Writing results honestly, including what did not work

A results section that reports only the runs that worked is not lying in any single sentence, and is still misleading, because it lets a reader assume a smoother path than the one the project actually took. The strongest write-ups include a short, specific account of what did not work on the way to what did — a discretization that was tried and abandoned because it introduced a numerical instability, an initial process-noise tuning that failed a consistency test before a corrected one passed. This is not padding. It is direct evidence the work was actually engineering rather than a single successful attempt reconstructed to look clean, and it is exactly the material the interview module later in this curriculum turns into a rehearsed failure story — the portfolio write-up and the interview defence draw from the same honest account, not two different ones.

::: example A results section that includes the failed attempt
"The first process-noise tuning ($q = 5\times10^{-5}$, chosen by matching the filter's steady-state covariance to a target by eye) passed no consistency check: mean NEES over 300 runs was 41.2 against a 95% band of $[5.61, 6.40]$ for a 6-state filter — badly overconfident. Retuning $q$ upward by roughly two orders of magnitude, justified by re-examining the actual gyro noise spec rather than fitting by eye, brought mean NEES to 6.07, inside the band. Both numbers are reported here, not only the second, because the first is what the process actually looked like."

This tells a reviewer that a consistency test exists, that it was capable of catching a real problem, and that the author diagnosed rather than guessed at the fix — three separate pieces of evidence a "the filter is consistent" sentence alone would not carry.
:::

::: warning
A README that describes what a project "aims to do" or "is designed to demonstrate," in the present or future tense, is describing intent rather than results — and intent is not evidence. Every sentence in the results section should be checkable against something that already happened: a number, a file, a passing test. If a sentence would still be true had the project never been run, it does not belong in results.
:::

## Check yourself

::: check
Name the seven parts of the write-up structure in order, and state in one phrase each what question the verification section answers versus what question the validation section answers.
:::

::: answer
Problem, model, assumptions, verification, validation, results, limitations. Verification answers "was the code built right against its own specification" — an internal, code-versus-equations question answerable entirely in simulation. Validation answers "is the specification itself right about the real system" — an external question requiring a reference the author did not write, such as hardware or flight data.
:::

::: check
A project's README states an energy-conservation result to $10^{-14}$, but the repository's `tests/` directory contains no file that could produce that number. What does this mismatch tell a reviewer, and why does it matter more than the number being wrong?
:::

::: answer
It tells the reviewer the claim cannot currently be checked, which is worse for credibility than a wrong number would be — a wrong but checkable number is a bug to find, while an unbacked claim is a question about whether it was ever actually measured. The repository layout exists precisely so a written claim and the file that produced it sit in a fixed, discoverable relationship; when that relationship breaks, every other claim in the same document loses some of its presumption of being real.
:::

::: check
Explain why a self-taught project can usually achieve full verification but only partial validation, and why stating that distinction explicitly is stronger than leaving it unaddressed.
:::

::: answer
Verification only requires the code and the equations the author wrote down — an entirely self-contained comparison the author can run in simulation with no outside dependency. Validation requires an external reference the author did not control, such as real hardware, flight telemetry, or an independent dataset, which most self-taught projects do not have access to. Stating the distinction explicitly is stronger than silence because silence lets a reviewer assume the document is claiming both; naming exactly what was validated, and what was only verified, pre-empts the question an experienced reviewer was going to ask anyway and demonstrates the same self-awareness the limitations section is graded on.
:::

::: check
During the first thirty seconds of the ninety-second read, what two things does a reviewer look for, and what happens if the opening sentence has no number in it?
:::

::: answer
In the first ten seconds or so, the title and a one-sentence headline result; in the following stretch, the one plot or number block that carries the argument. If the opening sentence has no number, there is nothing yet for the reviewer to evaluate — "performed well" or "worked correctly" cannot be judged the way "23 m 1-sigma position error over a 400-trial Monte Carlo" can, so the reviewer has no basis yet to decide whether continuing to read is worthwhile, and a real fraction of readers stop there.
:::

::: check
A candidate argues that including a failed tuning attempt in the results section makes the project look less competent than reporting only the final, working configuration. Explain why this lesson treats the opposite as true.
:::

::: answer
Reporting only the final configuration is consistent with genuine first-try success and equally consistent with a cleaned-up retelling that hides how the result was actually reached — a reviewer cannot tell which from the polished version alone. Including the failed attempt, with its own specific number (mean NEES of 41.2 against a band of roughly six, in the worked example), is direct, hard-to-fabricate evidence that a real diagnostic process happened: a problem was detected by a specific test, not guessed at, and fixed for a stated reason. That is closer to what senior engineering judgment actually looks like than an unbroken success story, and an experienced reviewer reads it that way.
:::

## Summary

| Part | What it answers |
| --- | --- |
| Problem | What requirement was this built against |
| Model | What does the project simulate or estimate, at what fidelity |
| Assumptions | What does the model simplify away, named individually |
| Verification | Was the code built right against its own specification |
| Validation | Is the specification itself right about the real system |
| Results | What actually happened when it ran, with units and worst case |
| Limitations | Where does the result stop being trustworthy |
| Ninety-second read | Title + one-sentence numeric result, then one plot, then a visible limitation — in that order |

The next lesson takes the verification section specifically and builds the technical toolkit behind it: the analytic cases, conservation checks, convergence studies, and cross-comparisons that turn "it ran" into a claim a skeptical reader can actually check.
