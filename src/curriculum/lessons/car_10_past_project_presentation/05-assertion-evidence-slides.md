---
id: l05-assertion-evidence-slides
title: "Assertion-evidence: the headline makes the claim"
minutes: 17
covers:
  - "assertion-evidence slide design: a sentence headline that states the claim, a figure that proves it, no bullet dumps"
---

One rule does more work than every other slide-design rule combined, and it is not about fonts or colour. Every slide's headline is a complete sentence that states a claim. Every slide's body is a figure or a small table that provides the evidence for that claim. There are no bullet dumps anywhere.

This is the assertion-evidence structure, and the reason it matters in this round specifically is that it forces the talk to be an argument rather than a tour. A slide headed "Results" can be followed by anything; a slide headed "Over 300 runs the filter's mean NEES was 6.067 against a 95% band of 5.614 to 6.398" has committed to something, and the body has to earn it. Applied across a deck, the discipline propagates backwards into the work itself: you discover which of your slides have no claim to make, and those are usually the slides that should not exist.

::: key
Assertion-evidence slide structure: the headline is a complete sentence asserting a claim, and the body is a figure or small table that provides the evidence. No bullet dumps. Reading only the headlines in order should reconstruct the whole argument.
:::

## Two tests that decide whether a headline is an assertion

**The falsifiability test.** Could this headline be wrong? "Simulation Overview" cannot be wrong, because it does not say anything — it is a label naming a topic. "The 6-DOF model reproduces axisymmetric precession to four significant figures" could be wrong; it is a claim, and the body has to show it is not. If your headline could not possibly be contradicted by the figure underneath it, it is a label.

**The headline-only test.** Print the headlines in order, with no bodies. Can a reader who was not in the room reconstruct your whole argument from that page alone? This is the test the portfolio module's exercise sets for the deck, and it is unforgiving in a useful way: a sequence of labels reads as a table of contents, and a sequence of assertions reads as a case.

Those two tests are also why topic labels fail in practice, which is worth being concrete about rather than treating as a style preference. A panel member who looks down to write a note for fifteen seconds and looks back up needs the slide to re-orient them without your help; a label cannot do that, while a sentence can. And the panel's memory of your talk, an hour later in a debrief, is much closer to your headlines than to your spoken words — so the headlines are what you are actually leaving behind.

## Converting labels to assertions

| Label (weak) | Assertion (strong) |
| --- | --- |
| Atmosphere Model | A single-scale-height exponential atmosphere is about $30\%$ high by $20\,\mathrm{km}$, so the simulation uses a layered hydrostatic model |
| Filter Design | A six-state multiplicative EKF keeps the quaternion normalised by construction and the covariance three-dimensional |
| Verification | Over 300 runs, mean NEES of $6.067$ against a band of $[5.614,\,6.398]$ shows the reported covariance matches the actual error |
| Monte Carlo Results | $4.0\%$ of 500 dispersed cases have no feasible trajectory in the fixed final time — the cost of the formulation I chose |
| Observability | Four stations at distinct bearings drop the normal-matrix condition number by about thirteen orders of magnitude, $6\times10^{18}$ to $4.3\times10^{5}$ |
| Momentum Budget | Magnetorquer capability exceeds the worst-case gravity-gradient accumulation by about $11.8$ times over one orbit |
| Future Work | The noise models are verified in simulation and not yet validated against hardware, which sets the next step |

Every assertion in the right-hand column contains a number, and that is not a coincidence. In technical work, a claim without a number is usually an opinion in disguise — "the filter performs well," "the guidance is robust," "results are promising" — and an opinion cannot be evidenced by a figure, only illustrated by one.

## What counts as evidence in the body

The body's job is to make the headline checkable in about ten seconds. A few constraints follow directly from that.

**One figure, or one small table.** If two figures are genuinely needed, the headline is making two claims and the slide should be two slides. A table is evidence when it is small enough to read from the back of the room — a handful of rows and columns. Anything larger belongs in the appendix, where it can be turned to on request.

**The comparison has to be on the figure.** This is the single most common gap in an otherwise well-built evidence slide. A number alone is not evidence; a number against the thing it is being judged against is. Mean NEES of $6.067$ means nothing until the band $[5.614,\,6.398]$ is drawn on the same axes. An RMS residual of $45.5\,\mathrm{m}$ means nothing until the $50\,\mathrm{m}$ measurement noise floor is a line on the same plot. A margin of $11.8$ means nothing until the figure shows what it is a margin over. Draw the threshold, the band, the noise floor, or the rejected alternative — whatever the claim is measured against — on the same axes as the result.

**Axes labelled, with units.** A panel of engineers reads axes first. An unlabelled axis is not a minor omission to them; it is the thing they will ask about instead of the thing you wanted to talk about.

**No bullet dumps.** Two mechanisms, both real. A bulleted list is read by the audience at their own pace, which is faster than you speak and therefore competes with you — for as long as the slide is up, you and your slide are two sources of information racing. And a bullet is an assertion with the evidence removed, which is exactly the trade this round is built to detect.

::: example Nine headlines from the anchor-C deck, read alone
1. An attitude estimator has to report a covariance its users can trust, not only a small error.
2. Gyro bias is what makes this hard: it is invisible instantaneously and only shows up as integrated attitude error.
3. The estimator is a six-state multiplicative EKF — attitude error and gyro bias — with the quaternion carried nonlinearly alongside.
4. I chose a multiplicative error state over an additive quaternion filter to keep the quaternion normalised by construction and the covariance three-dimensional.
5. RMS attitude error cannot detect an overconfident filter, so the acceptance criterion is a chi-square consistency test rather than an error threshold.
6. Over 300 runs the filter sits inside both bands: mean NEES $6.067$ against $[5.614,\,6.398]$, mean NIS $2.984$ against $[2.729,\,3.283]$.
7. The result holds step by step, not only on the mean — NEES is inside its band at $96.9\%$ of steps and NIS at $95.6\%$.
8. The test has power: cutting assumed process noise a hundredfold drives mean NEES to $404.9$, about $63$ times the band's ceiling.
9. This is verification, not validation — the noise models have not been checked against real hardware, and that is the next step.

Read that list without any slide bodies and the argument is complete: what the problem is, why it resists, what was built, what was decided and why, what the acceptance criterion is, what the result was, that the test could have failed, and where the claim stops. Now imagine the same nine slides headed Introduction, Background, Filter Architecture, Design Choices, Metrics, Results, Sensitivity, Validation, Conclusions. Identical talk, identical figures, and the page you leave behind says nothing at all.
:::

::: example The same content as a weak slide and a strong one — anchor D
**Weak.** Headline: "Results." Body: six bullets — implemented Gauss-Newton; four tracking stations; converged in four iterations; RMS residual $45.5\,\mathrm{m}$; covariance computed; future work: real data.

Every one of those statements is true and the slide is still close to worthless. There is no claim, so there is nothing to evaluate; the one number that matters, $45.5\,\mathrm{m}$, sits in a list with five statements of activity and is not compared against anything; and the audience has read all six bullets before you finish the first sentence.

**Strong.** Headline: "Four stations at distinct bearings turn a divergent fit into one converging to $45.5\,\mathrm{m}$ RMS against $50\,\mathrm{m}$ noise." Body: one plot, RMS residual against iteration number on a logarithmic vertical axis, with two traces — the single-station geometry diverging and the four-station geometry descending through $120{,}131$, $2{,}605$, $62.0$ and $45.5\,\mathrm{m}$ — and a horizontal dashed line at the $50\,\mathrm{m}$ measurement-noise level. The two condition numbers, $6\times10^{18}$ and $4.3\times10^{5}$, annotated against their traces.

The claim is on the slide, the evidence is on the slide, and the comparison — the noise floor the fit should settle to, and the rival geometry — is on the same axes. A panel member can check the headline against the figure without you saying a word, which is precisely what frees your spoken thirty seconds for the part that is not on the slide: why the single-station geometry was unobservable in the first place.
:::

::: warning
The most common way to half-adopt this structure is to write assertion headlines and leave the bullet bodies underneath them. That is worse than either pure form: the headline now promises evidence and the body delivers a list of claims, so the slide asserts twice and evidences nothing. If a slide's body is a list, the honest fix is usually to find the figure or the small table that would prove the headline — and if no such figure exists, to ask whether the claim is one you can actually support.
:::

## A note on what the structure costs

Building a deck this way takes longer than assembling one from bullets, and the extra time is not spent on slides. It is spent discovering which claims you cannot evidence. That is the point, and it is cheaper to discover in your own preparation than in front of five to ten engineers — a slide you could not build because the figure did not exist is a question you were going to be asked anyway.

## Check yourself

::: check
Apply the falsifiability test to these two headlines and say which is an assertion: "Dispersion Campaign Setup" and "Thrust misalignment, wind, mass properties and IMU noise are dispersed because each traces to a distinct failure mechanism."
:::

::: answer
The second is an assertion; the first is a label. "Dispersion Campaign Setup" names a topic and cannot be contradicted by anything, so no figure underneath it can either support or undermine it. The second makes a claim that could be wrong — a reviewer could argue that one of those parameters does not trace to a distinct mechanism, or that a fifth one does — which means the body has something to do: a small table mapping each dispersed parameter to the failure mechanism it represents.
:::

::: check
Why does this lesson insist the comparison appear on the figure rather than being stated aloud while the figure shows the result alone?
:::

::: answer
Because a number is only evidence relative to the thing it is judged against, and the panel is evaluating the slide as much as the speech. Mean NEES of $6.067$ is meaningless without the acceptance band drawn on the same axes; an RMS residual of $45.5\,\mathrm{m}$ is meaningless without the $50\,\mathrm{m}$ noise floor. Saying the comparison aloud also makes the claim unverifiable by anyone who looked away, and leaves the slide unable to carry the argument on its own during the debrief afterwards — which is when the headlines and figures are all that remain.
:::

::: check
Explain the two mechanisms by which a bulleted slide body actively works against a speaker, beyond simply carrying no evidence.
:::

::: answer
First, competition for attention: an audience reads a list faster than the speaker can talk through it, so for as long as the slide is up the speaker is racing their own slide for the room's attention, and the slide usually wins. Second, the bullets are assertions with their evidence stripped out — a list of claims presented without support — which is exactly the substitution this round is designed to detect, so the format itself signals the thing the candidate is trying to disprove.
:::

::: check
A candidate writes the headline "The filter performs well across all test cases." Diagnose what is wrong with it and repair it using this lesson's own numbers.
:::

::: answer
It is an opinion, not a claim: "performs well" has no definition, so no figure can support or contradict it, and "all test cases" is unbounded. The repair attaches a metric, a number and a comparison: "Over 300 independent runs, mean NEES of $6.067$ sits inside the $95\%$ band $[5.614,\,6.398]$, so the filter's reported covariance matches its actual error." That version can be checked against the figure beneath it, and it tells the panel what standard was applied rather than asking them to accept a verdict.
:::

::: check
What does the headline-only test reveal that reviewing the slides normally does not?
:::

::: answer
Whether the deck is an argument or a tour. Reading slides with their bodies lets figures and your remembered narration paper over gaps in reasoning, because each slide individually seems to have content. Stripping the bodies leaves only the claims and their order, so a missing step — no stated requirement, no acceptance criterion, a result that does not follow from the approach — becomes visible as a gap in the prose. It also predicts what the panel retains afterwards, since the headlines are what is written down and carried into the debrief.
:::

## Summary

| Rule | Statement |
| --- | --- |
| Headline | A complete sentence stating a claim, normally containing a number |
| Body | One figure or one small table that makes the headline checkable in about ten seconds |
| Falsifiability test | If the headline could not be contradicted by its own figure, it is a label |
| Headline-only test | The headlines alone, in order, must reconstruct the whole argument |
| The comparison | Draw the band, threshold, noise floor or rejected alternative on the same axes as the result |
| Axes | Labelled, with units — engineers read axes first |
| Forbidden | Bullet dumps, including under an assertion headline |
| Side effect | The structure finds the claims you cannot evidence, before the panel does |

The next lesson answers the question this one provokes: how many such slides a ten-to-twenty-minute talk can hold, and how to build the single diagram the whole talk hangs on.
