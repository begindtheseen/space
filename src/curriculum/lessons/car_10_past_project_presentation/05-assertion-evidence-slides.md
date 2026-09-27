---
id: l05-assertion-evidence-slides
title: "Assertion-evidence: the headline makes the claim"
minutes: 19
covers:
  - "assertion-evidence slide design: a sentence headline that states the claim, a figure that proves it, no bullet dumps"
---

Picture two newspapers on a table. One has a front page headed "Weather." The other says "Storm closes every school in the county on Tuesday." You learn nothing from the first until you read the article. You learn the news from the second before you pick it up — and the photo underneath of a flooded road shows you it is true.

Slides work the same way. One rule does more work than every other slide-design rule put together, and it is not about fonts or color:

- every slide's **headline** is a complete sentence that states a claim;
- every slide's **body** is a figure or a small table that gives the evidence for that claim;
- there are no **bullet dumps** — lists of short points piled under a heading — anywhere.

This is the **[[assertion-evidence|assertion-word]]** structure. An **assertion** is a claim stated firmly enough that it could be checked; the **evidence** is what checks it. The structure matters in this round because it forces the talk to be an *argument* instead of a *tour*. A slide headed "Results" can be followed by anything. A slide headed "Over 300 runs the filter's mean NEES was 6.067 against a 95% band of 5.614 to 6.398" has committed to something, and its body has to earn it.

Used across a whole deck, the rule also reaches back into the work itself. You discover which slides have no claim to make. Those are usually the slides that should not exist.

::: key
Assertion-evidence slide structure: the headline is a complete sentence asserting a claim, and the body is a figure or small table that provides the evidence. No bullet dumps. Reading only the headlines in order should reconstruct the whole argument.
:::

## Two tests that decide whether a headline is an assertion

**The falsifiability test.** Could this headline be wrong? A headline is **[[falsifiable|falsifiable]]** if some possible evidence could prove it false. "Simulation Overview" cannot be wrong, because it does not say anything. It is a **label** — a name for a topic. "The 6-DOF model reproduces axisymmetric precession to four significant figures" *could* be wrong. It is a claim, and the body has to show it is not. (**Axisymmetric precession** is the slow, steady wobble of a spinning body that is the same all the way round its axis — a case with a known pen-and-paper answer.) So here is the test in one line: if no figure could ever contradict your headline, it is a label.

**The headline-only test.** Print the headlines in order, with no slide bodies. Can a reader who was not in the room rebuild your whole argument from that one page? This is the test this module's deck exercise sets, and it is harsh in a useful way. A list of labels reads like a table of contents. A list of assertions reads like a case being made.

These two tests are not a matter of style. They show why labels fail in a real room, for two reasons.

**A slide has to re-orient people.** A panel member looks down to write a note for fifteen seconds, then looks back up. The slide needs to tell her where you are without your help. A label cannot do that. A sentence can.

**Headlines are what the panel keeps.** An hour later, in the **[[debrief|debrief]]**, the panel's memory of your talk is much closer to your headlines than to your spoken words. The headlines are what you actually leave behind.

## Converting labels to assertions

Here is how the same slides look with labels and with assertions. The numbers come from the five anchor projects in the portfolio module; terms like NEES and covariance are the ones the first lesson of this module introduced. Do not worry about every word — watch what changes from left to right.

| Label (weak) | Assertion (strong) |
| --- | --- |
| Atmosphere Model | A single-scale-height exponential atmosphere is about $30\%$ high by $20\,\mathrm{km}$, so the simulation uses a layered hydrostatic model |
| Filter Design | A six-state multiplicative EKF keeps the quaternion normalized by construction and the covariance three-dimensional |
| Verification | Over 300 runs, mean NEES of $6.067$ against a band of $[5.614,\,6.398]$ shows the reported covariance matches the actual error |
| Monte Carlo Results | $4.0\%$ of 500 dispersed cases have no feasible trajectory in the fixed final time — the cost of the formulation I chose |
| Observability | Four stations at distinct bearings drop the normal-matrix condition number by about thirteen orders of magnitude, $6\times10^{18}$ to $4.3\times10^{5}$ |
| Momentum Budget | Magnetorquer capability exceeds the worst-case gravity-gradient accumulation by about $11.8$ times over one orbit |
| Future Work | The noise models are verified in simulation and not yet validated against hardware, which sets the next step |

Every assertion on the right contains a number. That is not a coincidence. In technical work, a claim without a number is usually an opinion in disguise: "the filter performs well," "the guidance is robust," "results are promising." A figure cannot prove an opinion. It can only decorate one.

Check one of those numbers so you trust it. Going from $6\times10^{18}$ to $4.3\times10^{5}$ is a drop by a factor of $6\times10^{18} \div 4.3\times10^{5} \approx 1.4\times10^{13}$. That is thirteen powers of ten, so "about thirteen orders of magnitude" is right. An **order of magnitude** is one power of ten.

## What counts as evidence in the body

The body's job is to let someone check the headline in about ten seconds. A few rules follow straight from that.

**One figure, or one small table.** If you really need two figures, the headline is making two claims, and the slide should be two slides. A table counts as evidence when it can be read from the back of the room — a handful of rows and columns. Anything bigger belongs in the appendix, where you can turn to it when asked.

**The comparison has to be on the figure.** This is the most common gap in an otherwise good evidence slide. A number alone is not evidence. A number set against the thing it is judged by *is*. For example:

- mean NEES of $6.067$ means nothing until the band $[5.614,\,6.398]$ is drawn on the same axes;
- an **[[RMS|rms]]** residual of $45.5\,\mathrm{m}$ means nothing until the $50\,\mathrm{m}$ measurement noise floor is a line on the same plot;
- a margin of $11.8$ means nothing until the figure shows what it is a margin *over*.

So draw the threshold, the band, the noise floor or the rejected alternative — whatever the claim is measured against — on the same axes as the result.

**Axes labeled, with units.** A panel of engineers reads the axes first. To them, an unlabeled axis is not a small slip. It is the thing they will ask about, instead of the thing you wanted to talk about.

**No bullet dumps.** Two separate reasons, both real.

1. **It races you.** An audience reads a list at its own pace, which is [[faster than you speak|reading-race]]. For as long as the slide is up, you and your slide are two sources of information racing each other.
2. **It hides the evidence.** A bullet is an assertion with the evidence removed — exactly the swap this round is built to catch.

::: example Nine headlines from the anchor-C deck, read alone
Anchor C is a filter that estimates which way a spacecraft points, from a gyro and a star tracker. Here are its nine headlines, with no bodies:

1. An attitude estimator has to report a covariance its users can trust, not only a small error.
2. Gyro bias is what makes this hard: it is invisible instantaneously and only shows up as integrated attitude error.
3. The estimator is a six-state multiplicative EKF — attitude error and gyro bias — with the quaternion carried nonlinearly alongside.
4. I chose a multiplicative error state over an additive quaternion filter to keep the quaternion normalized by construction and the covariance three-dimensional.
5. RMS attitude error cannot detect an overconfident filter, so the acceptance criterion is a chi-square consistency test rather than an error threshold.
6. Over 300 runs the filter sits inside both bands: mean NEES $6.067$ against $[5.614,\,6.398]$, mean NIS $2.984$ against $[2.729,\,3.283]$.
7. The result holds step by step, not only on the mean — NEES is inside its band at $96.9\%$ of steps and NIS at $95.6\%$.
8. The test has power: cutting assumed process noise a hundredfold drives mean NEES to $404.9$, about $63$ times the band's ceiling.
9. This is verification, not validation — the noise models have not been checked against real hardware, and that is the next step.

**Read them as a story.** Without a single slide body, the argument is complete:

- what the problem is (1);
- why it resists (2);
- what was built (3);
- what was decided, and why (4);
- how success is judged (5);
- what the result was (6, 7);
- proof that the test could have failed (8);
- where the claim stops (9).

**Check a number.** Headline 8 says $404.9$ is about $63$ times the ceiling: $404.9 \div 6.398 \approx 63.3$. Right.

**Now the same deck with labels.** Imagine the nine slides headed Introduction, Background, Filter Architecture, Design Choices, Metrics, Results, Sensitivity, Validation, Conclusions. Same talk, same figures — and the page you leave behind says nothing at all.
:::

::: example The same content as a weak slide and a strong one — anchor D
Anchor D fits an orbit to tracking measurements from ground stations, using a **[[Gauss-Newton|gauss-newton]]** method — a fit that improves its guess over several rounds, called **iterations**.

**Weak.** Headline: "Results." Body: six bullets.

- implemented Gauss-Newton;
- four tracking stations;
- converged in four iterations;
- RMS residual $45.5\,\mathrm{m}$;
- covariance computed;
- future work: real data.

Every statement there is true, and the slide is still close to worthless. Three reasons:

- there is no claim, so there is nothing to judge;
- the one number that matters, $45.5\,\mathrm{m}$, sits in a list with five statements of activity and is not compared with anything;
- the audience has read all six bullets before you finish your first sentence.

**Strong.** Headline: "Four stations at distinct bearings turn a divergent fit into one converging to $45.5\,\mathrm{m}$ RMS against $50\,\mathrm{m}$ noise."

Body: [[one plot|residual-plot]]. RMS residual against iteration number, on a **logarithmic** vertical axis — one where each step up multiplies by ten, so huge and small numbers fit on one plot. Two traces:

- the single-station geometry, diverging;
- the four-station geometry, falling through $120{,}131$, then $2{,}605$, then $62.0$, then $45.5\,\mathrm{m}$.

A horizontal dashed line marks the $50\,\mathrm{m}$ measurement-noise level. The two condition numbers, $6\times10^{18}$ and $4.3\times10^{5}$, are written next to their traces.

**Sanity check.** The fit settles at $45.5\,\mathrm{m}$, a little under the $50\,\mathrm{m}$ noise. That is what a good fit should do. The leftover error cannot shrink far below the noise in the data itself — and it lands slightly below because a fit always bends a little toward the noise it was given.

**What changed.** The claim is on the slide. The evidence is on the slide. The comparison — the noise floor, and the rival geometry — is on the same axes. A panel member can check the headline against the figure without you saying a word. That frees your thirty seconds of speech for the part that is *not* on the slide: why the single-station geometry could not pin down the orbit in the first place.
:::

::: warning
The most common way to half-adopt this structure is to write assertion headlines and leave bullet bodies underneath them. That is worse than either pure form. The headline now promises evidence, and the body delivers a list of more claims — so the slide asserts twice and proves nothing. If a slide's body is a list, the honest fix is to find the figure or small table that would prove the headline. If no such figure exists, ask whether this is a claim you can actually support.
:::

## What the structure costs

Building a deck this way takes longer than piling up bullets. The extra time is not spent on the slides. It is spent discovering which claims you cannot back up with evidence.

That is the point. It is much cheaper to find that out while preparing than in front of five to ten engineers. A slide you could not build, because the figure did not exist, is a question you were going to be asked anyway. Now you know it is coming.

This way of building slides has a name and a source. The resource list for this module leads with the book that set it out: [[Michael Alley's|alley]] *The Craft of Scientific Presentations*.

## Check yourself

::: check
Apply the falsifiability test to these two headlines, and say which one is an assertion: "Dispersion Campaign Setup" and "Thrust misalignment, wind, mass properties and IMU noise are dispersed because each traces to a distinct failure mechanism."
:::

::: answer
The second is an assertion; the first is a label.

"Dispersion Campaign Setup" names a topic. Nothing can contradict it, so no figure underneath can support it or undermine it.

The second makes a claim that could be wrong. A reviewer could argue that one of those parameters does not trace to a distinct failure mechanism, or that some fifth parameter does. So the body has a job to do: a small table matching each dispersed parameter to the failure mechanism it stands for.
:::

::: check
Why does this lesson insist that the comparison appear on the figure, instead of being said aloud while the figure shows the result alone?
:::

::: answer
A number is only evidence next to the thing it is judged against, and the panel judges the slide as much as the speech. Mean NEES of $6.067$ means nothing without the acceptance band on the same axes. An RMS residual of $45.5\,\mathrm{m}$ means nothing without the $50\,\mathrm{m}$ noise floor.

Saying the comparison aloud has two further costs. Anyone who looked away cannot check the claim. And the slide cannot carry the argument by itself in the debrief afterwards — when the headlines and figures are all that remain.
:::

::: check
Explain the two ways a bulleted slide body actively works against a speaker, beyond simply carrying no evidence.
:::

::: answer
First, it competes for attention. An audience reads a list faster than the speaker can talk through it. For as long as the slide is up, the speaker is racing their own slide for the room's attention, and the slide usually wins.

Second, the bullets are assertions with their evidence stripped out — a list of claims with no support. That is exactly the swap this round is designed to catch. So the format itself signals the very thing the candidate is trying to prove is not true.
:::

::: check
A candidate writes the headline "The filter performs well across all test cases." Diagnose what is wrong with it, and repair it using this lesson's own numbers.
:::

::: answer
It is an opinion, not a claim. "Performs well" has no definition, so no figure can support or contradict it. "All test cases" has no stated size.

The repair adds a measure, a number and a comparison: "Over 300 independent runs, mean NEES of $6.067$ sits inside the $95\%$ band $[5.614,\,6.398]$, so the filter's reported covariance matches its actual error."

That version can be checked against the figure beneath it. It tells the panel what standard was applied, instead of asking them to accept a verdict.
:::

::: check
What does the headline-only test reveal that looking through the slides normally does not?
:::

::: answer
Whether the deck is an argument or a tour.

When you look through slides with their bodies, the figures and your memory of what you planned to say cover up gaps in the reasoning — each slide seems to have content. Strip the bodies away and only the claims and their order are left. Then a missing step shows up as a gap in the sentences: no stated requirement, no acceptance test, a result that does not follow from the approach.

The test also predicts what the panel keeps afterwards, because the headlines are what gets written down and carried into the debrief.
:::

## Summary

| Rule | Statement |
| --- | --- |
| Headline | A complete sentence stating a claim, normally containing a number |
| Body | One figure or one small table that makes the headline checkable in about ten seconds |
| Falsifiability test | If no figure could contradict the headline, it is a label |
| Headline-only test | The headlines alone, in order, must rebuild the whole argument |
| The comparison | Draw the band, threshold, noise floor or rejected alternative on the same axes as the result |
| Axes | Labeled, with units — engineers read axes first |
| Forbidden | Bullet dumps, including under an assertion headline |
| Side effect | The structure finds the claims you cannot back up, before the panel does |

The next lesson answers the question this one raises: how many slides like this a ten-to-twenty-minute talk can hold, and how to build the one diagram the whole talk hangs on.

::: context assertion-word A claim on top, the proof below
To **assert** comes from the Latin *asserere*, "to claim". Programmers meet the word too: an "assert" line in code states something that must be true, and the program stops loudly if it is not. A slide headline works the same way — it states what must be true, and the figure is the check.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="160" height="100" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="30" font-size="12" font-weight="700" fill="#1f2a44">Results</text>
  <g fill="#6c7a93"><circle cx="24" cy="48" r="2.5"/><circle cx="24" cy="64" r="2.5"/><circle cx="24" cy="80" r="2.5"/><circle cx="24" cy="96" r="2.5"/></g>
  <g stroke="#6c7a93" stroke-width="3"><line x1="32" y1="48" x2="150" y2="48"/><line x1="32" y1="64" x2="130" y2="64"/><line x1="32" y1="80" x2="145" y2="80"/><line x1="32" y1="96" x2="120" y2="96"/></g>
  <rect x="190" y="10" width="160" height="100" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="27" font-size="11" fill="#1f2a44">Fit settles to 45.5 m,</text>
  <text x="200" y="41" font-size="11" fill="#1f2a44">under the 50 m noise</text>
  <line x1="205" y1="52" x2="205" y2="100" stroke="#1f2a44"/><line x1="205" y1="100" x2="340" y2="100" stroke="#1f2a44"/>
  <line x1="205" y1="88" x2="340" y2="88" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <polyline points="210,56 250,76 290,88 330,90" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="90" y="130" font-size="12" fill="#b4232c" text-anchor="middle">label + bullets</text>
  <text x="270" y="130" font-size="12" fill="#1d6fd1" text-anchor="middle">assertion + evidence</text>
</svg>
```
:::

::: context falsifiable The test for a real claim
The idea of **falsifiability** was made famous by the philosopher Karl Popper in the twentieth century. He argued that a statement is scientific only if some possible observation could prove it wrong. "It will rain somewhere, sometime" can never be proven wrong, so it tells you nothing. "It will rain here tomorrow before noon" can be, so it is worth saying. A slide label is like the first sentence; an assertion is like the second.
:::

::: context debrief Where the decision is really made
A **debrief** is the meeting after the interviews, where the people who met you compare notes and decide. Nobody replays your talk. They look at what they wrote down and what they remember — and people write down headlines, not your spoken sentences. So a slide headline is really a note you are writing into every panel member's notebook for them. Make it a note that argues for you.
:::

::: context rms The typical size of an error
**RMS**, said "R-M-S", means **root mean square**. It is a way to boil a list of errors down to one typical size, even when some are positive and some negative. Square each error (so negatives turn positive), take the mean of the squares, then take the square root to get back to the original units. For errors of $3$, $-4$ and $5\,\mathrm{m}$: the squares are $9$, $16$ and $25$; their mean is $50 \div 3 \approx 16.7$; the square root is about $4.08\,\mathrm{m}$.
:::

::: context reading-race Your slide reads faster than you talk
People tend to read silently at somewhere around 200 to 250 words a minute, but speak to a room at more like 120 to 160. Put a list on the screen and the room finishes it long before you do — then waits, or stops listening.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="24" font-size="12" fill="#1f2a44">words per minute (rough ranges)</text>
  <text x="10" y="54" font-size="12" fill="#1f2a44">reading</text>
  <rect x="80" y="40" width="200" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="280" y="40" width="50" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-dasharray="3 2"/>
  <text x="10" y="90" font-size="12" fill="#1f2a44">speaking</text>
  <rect x="80" y="76" width="120" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="200" y="76" width="40" height="22" fill="#f2b880" stroke="#1f2a44" stroke-dasharray="3 2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="280" y="114">200</text><text x="330" y="114">250</text><text x="200" y="114">120</text><text x="240" y="114">160</text><text x="80" y="114">0</text></g>
</svg>
```

Each bar starts at zero; the dashed end shows the range. This is the first reason a bullet dump works against you.
:::

::: context gauss-newton Improving a guess, round by round
Fitting an orbit to measurements is like adjusting a telescope. You start with a guess, see how far off the predictions are, work out which way to nudge the guess to shrink the misses, nudge it, and look again. The **Gauss-Newton** method does exactly this with algebra, named after two famous mathematicians, Carl Friedrich Gauss and Isaac Newton. Each round is an **iteration**. When the misses stop shrinking, the fit has **converged**. If they grow, it has **diverged**.
:::

::: context residual-plot The anchor-D plot, sketched
The vertical axis is logarithmic: each gridline is ten times the one below. The four-station fit drops fast and levels off at the dashed noise floor. The one-station fit heads the other way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="20" x2="60" y2="170" stroke="#1f2a44"/>
  <line x1="60" y1="170" x2="340" y2="170" stroke="#1f2a44"/>
  <g stroke="#8fb8f0" stroke-opacity="0.5"><line x1="60" y1="140" x2="340" y2="140"/><line x1="60" y1="110" x2="340" y2="110"/><line x1="60" y1="80" x2="340" y2="80"/><line x1="60" y1="50" x2="340" y2="50"/><line x1="60" y1="20" x2="340" y2="20"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="54" y="174">10 m</text><text x="54" y="114">1 km</text><text x="54" y="54">100 km</text></g>
  <line x1="60" y1="149.0" x2="340" y2="149.0" stroke="#6c7a93" stroke-dasharray="5 4"/>
  <text x="336" y="163" font-size="11" fill="#6c7a93" text-anchor="end">50 m noise</text>
  <polyline points="100,47.6 180,97.5 260,146.2 340,150.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1d6fd1"><circle cx="100" cy="47.6" r="4"/><circle cx="180" cy="97.5" r="4"/><circle cx="260" cy="146.2" r="4"/><circle cx="340" cy="150.3" r="4"/></g>
  <polyline points="100,40 180,28 220,22" fill="none" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 3"/>
  <text x="226" y="34" font-size="11" fill="#b4232c">one station (sketch)</text>
  <text x="192" y="76" font-size="11" fill="#1d6fd1">four stations</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="100" y="186">1</text><text x="180" y="186">2</text><text x="260" y="186">3</text><text x="340" y="186">4</text></g>
  <text x="220" y="198" font-size="11" fill="#6c7a93" text-anchor="middle">iteration</text>
</svg>
```

The points are $120{,}131$, $2{,}605$, $62.0$ and $45.5\,\mathrm{m}$. The one-station trace is only a sketch of its shape: it grows instead of settling.
:::

::: context alley The book behind the rule
Michael Alley is an engineering professor who has spent his career teaching scientists and engineers to communicate. His book *The Craft of Scientific Presentations* sets out the assertion-evidence approach, and he and his colleagues have studied how students learn from slides built this way. You do not need to read it to use the rule, but if you read one book before this round, the module suggests this one — then Edward Tufte for the figures themselves.
:::
