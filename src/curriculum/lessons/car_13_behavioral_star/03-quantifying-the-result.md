---
id: l03-quantifying-the-result
title: "Quantifying the Result so it can be checked"
minutes: 22
covers:
  - quantifying the Result so the story is checkable
---

Two friends come back from a summer of running. One says, "I got a lot faster." The other says, "My mile went from 8 minutes 10 seconds to 7 minutes 20." Which one do you believe? Which one could you check — and which one will you still remember next week? The second friend also told you something else without saying it: she timed herself, both times.

That is this lesson in one picture. The last twenty seconds of a story are what the listener carries out of the room. The previous two lessons protected that time; this one is about what to put there.

The short answer is a **number**. Not because interviewers love arithmetic, but because a number does three things an adjective cannot. It is **[[checkable|checkable]]**. It is memorable. And it can only come from someone who actually measured the outcome instead of assuming it. That last one matters most. An engineer who says a change "improved the simulation" has told you what she hoped. An engineer who says the campaign went from fourteen hours to forty minutes has told you she timed it both times — a claim about her habits as much as about the result.

::: key
A number makes the story checkable and memorable. *Reduced the Monte Carlo campaign runtime from 14 hours to 40 minutes* is a result; *improved the simulation significantly* is a claim the interviewer cannot evaluate.
:::

## What a number does that an adjective cannot

**It is checkable.** A number invites the question *how did you measure that?* If you really measured it, your one-sentence answer turns a claim into evidence in about ten seconds. A result with no number cannot be checked, so it cannot be believed or disbelieved. It gets set aside.

**It is memorable.** An interviewer who meets several candidates remembers specifics, not qualities. "Fourteen hours to forty minutes" can be repeated to a colleague afterwards; "significantly faster" cannot.

**It forces the measurement to have happened.** This one matters for your own work, not only the interview. If you decide in advance that every story ends in a number, then while you do the work you will measure the outcome: time the **baseline** (the starting value) before speeding anything up, record the error before and after, and fix the pass criterion *before* running the campaign — not choose one after seeing the results. That habit is why this lesson belongs to engineering, not only to interview technique.

## The anatomy of a checkable result

A number alone is not enough. "Forty minutes" means nothing without what it was before, what was being measured, and why forty minutes is good. A Result that survives questions has **[[four parts|result-anatomy]]**, and they fit in two sentences.

**The quantity.** What was measured — runtime, landing error, residual, the fraction of dispersed cases that met the criterion, how many days late.

**The baseline.** What it was before, or what it would have been otherwise. A change with no starting point is not a measurement; it is a mood.

**The value.** The number after, at a sensible precision.

**The standard.** Why that number is on the right side of the line. Sometimes the standard comes from outside — the requirement, the tolerance, the noise level of the measurement. Sometimes you set it yourself. Then say that you set it, and say *when*: a criterion fixed before the run is evidence; a criterion picked after seeing the numbers is decoration.

Candidates skip the fourth part, and it does the most work. Compare:

- "The fit converged to a forty-five-meter [[RMS residual|rms-residual]]." That is a number.
- "The fit converged to a forty-five-meter RMS residual, against the fifty-meter per-measurement noise level I had assumed, so it was fitting the data to about the level the data supports and no further." That is a result with a standard.

The second version also quietly shows that you know what **[[over-fitting|over-fitting]]** would look like — a model bending itself to match the random noise in the data.

## Where the number comes from when you never measured one

Most stories from real work were not measured at the time. That is normal, and fixable in three ways, strongest first.

**1. Rebuild it from the record.** More survives than you expect: commit timestamps, log files, the notebook where you first ran the thing, your portfolio write-up, the message where you told someone it was done. An afternoon in your own history usually yields a defensible before-and-after for the two or three stories you most want to tell.

**2. Measure it now.** This works whenever the thing is your own — and for your best evidence it is: your portfolio projects still exist and still run. If you claim a change made the campaign faster, check out the version before the change and time both. **[[Reproducibility|reproducibility]]** — one command, a fixed random seed, pinned library versions — is what makes this cheap, which is one more reason the portfolio module insisted on it.

**3. Count the scope instead of the improvement.** If there is truly no before-and-after, a number describing the *size* of what you did is still checkable: five hundred dispersed cases, six states, four tracking stations, three weeks, a two-hundred-line review you took apart, a tolerance of one part in ten thousand. Scope numbers are weaker than outcome numbers, because they say *how much* rather than *how well*. But they are specific, and specific beats adjectives every time.

What you must not do is estimate and present the estimate as a measurement. If you are rebuilding, say so in the sentence: "I did not time it at the time, but the commit history puts the campaign at two days before the change and a single overnight run after it." That is believable, and it shows you know the difference between a measurement and a guess.

::: warning A percentage with no baseline is not a number
"Improved accuracy by forty percent" sounds precise and carries almost no information. Forty percent of what? Measured how? Compared with what? And is the remaining sixty acceptable? It also invites a follow-up you may not be able to answer. Either give the two actual values — from eleven meters to six and a half — or give the percentage with its baseline attached. (Check: $(11 - 6.5)/11 \approx 0.41$, so "forty percent" was about right; the two values say it better.) The same goes for *doubled*, *halved*, *an order of magnitude*: these are ratios pretending to be results.
:::

## Kinds of number that count

Numbers that make good Results come in a few families:

- **Time and rate** — runtime, iterations to converge, hours per week saved, how many days a thing was late.
- **Error and accuracy** — RMS residual, landing error, pointing error, distance from a true value.
- **Fractions of a set** — the share of dispersed cases meeting the criterion, the infeasible fraction, how much of a test suite covers a subsystem.
- **Margins and tolerances** — **[[phase margin|margins]]**, propellant margin, the tolerance a check had to hold.
- **Scope** — cases, states, stations, lines, weeks, people taught.

Two more that candidates rarely think of as results, but which land well:

**A negative number.** The most useful figure in a dispersion campaign is often the fraction that *failed*. Four percent of five hundred descent cases coming back infeasible says more about the design than any average landing error. Leading with an unflattering number, and explaining why it was the one that mattered, is a strong move. It is the clearest possible evidence that you report what you find, not what you would like.

**A small number, honestly sized.** "It saved me about six hours a week for the rest of the term" is a real result at its real size. Candidates inflate small results because they feel embarrassing. The inflation is what costs them, not the size. A modest number stated precisely sounds like an engineer with **calibrated** judgment — someone whose sense of "how big" matches reality — and the follow-up will be about the work, not the claim.

## Saying it out loud

**Round for speech.** "About forty minutes" is how a person talks. "Thirty-eight point six minutes" sounds like reading off a plot and invites a precision you probably cannot defend. Keep the exact figure in your head in case you are asked, and give the **[[rounded one|rounding-for-speech]]** first.

**Have the "how did you measure that?" answer ready** — one sentence, for every number in your bank. It is the single most predictable follow-up to a quantified Result, and it is the one that separates the two candidates the number was meant to tell apart.

**Give the number its standard in the same breath.** A number without a standard usually draws a worse follow-up: not *how did you measure it* but *is that good?* You never want to be answering that about your own work.

::: example One piece of work, three Results
The work: the candidate added a layered atmosphere model to a 6-DOF launch vehicle simulation and re-ran the dispersion campaign. (This is the story from lesson 1.)

**Weak:** "...and after that the simulation was a lot more realistic, which gave me much more confidence in the dispersion results."

Nothing here can be checked. *Confidence* is a feeling about the work, not a property of it. A generous interviewer will ask a question to rescue it; a busy one will move on, and the story has delivered nothing.

**Better, but still incomplete:** "...and the dynamic pressure at twenty kilometers came out about a quarter lower than the exponential model had been giving me."

Now there is a measurement, and it invites a sensible follow-up. What is missing is why it matters. A quarter is a number, not yet a result, because nothing in the sentence says what depended on it.

**Strong:** "The two atmosphere models agree to within about ten percent on dynamic pressure through max-Q, which is the region I had been worried about — but the exponential fit was roughly thirty percent high at twenty kilometers and close to a factor of two high at thirty, and the vehicle is still under thrust up there. So the error was not where I had been checking. With the layered model the loads above twenty kilometers are trustworthy to the same standard as the ones below it, and I wrote the comparison table into the assumptions section so anyone using the results can see what the model is worth."

**What the strong version has.** A quantity (dynamic pressure), a baseline (the exponential fit), values at two heights, and a standard — the loads above twenty kilometers should be as trustworthy as those below. It also has the sentence that makes it believable: *the error was not where I had been checking*. An engineer who reports where her own attention was misdirected is one whose numbers you can trust.

**Sanity check.** "Thirty percent high" and "a quarter lower" describe the same gap from opposite ends. If the exponential value is 1.31 times the layered one, the layered one is $1/1.31 \approx 0.76$ of the exponential — about 24 percent lower. Which way a percentage is taken matters.
:::

::: example Rebuilding a number you never wrote down
**The situation.** You want to tell a story about rewriting the inner loop of your simulation in C++ after the Python version made the dispersion campaign impractical. You are sure it got much faster. You never timed it, because back then you were not thinking about interviews.

**The bad repair:** invent a plausible figure. "It went from about twelve hours to about half an hour." Two problems. It is not true, which matters on its own. And it breaks in a specific way: the obvious follow-ups — what hardware, how many cases, was that **[[wall-clock or CPU time|wall-clock]]** — are questions about a measurement that never happened, and each answer needs more invention.

**The good repair, best option first.**

*First, go and measure it.* The commit before the rewrite still exists, and the project runs from one command with a fixed seed, so run the same campaign on both. Suppose that gives fourteen hours against forty minutes on your own machine. The speed-up is

$$
\frac{14 \times 60 \text{ min}}{40 \text{ min}} = \frac{840}{40} = 21
$$

— about twenty-one times faster. Now you can say it, and say how you know: "I re-ran the same five-hundred-case campaign on both versions on my own machine to check before I said this out loud, and it is fourteen hours against forty minutes." That last clause is unusual enough to be worth its two seconds.

*Second, if the old version no longer runs,* rebuild the figure and label it: "I did not time it properly at the time. What I can tell you is that the Python version could not finish five hundred cases overnight and the C++ version does it in well under an hour, so it is somewhere around a factor of ten to twenty." A stated range with a stated basis is an honest result, and nobody will mark you down for it.

*Third, if neither is possible,* change what you count. Drop the speed-up and describe the scope it opened up: "The point of the rewrite was that it turned the campaign from something I ran once before a deadline into something I ran on every change — which is how the wind-shear case that broke my gain schedule got found at all, because it was not in the first hundred cases." No timing appears, and the sentence is still specific, still checkable, and arguably says more about your engineering than the ratio would.
:::

## Check yourself

::: check
A candidate ends a story with: "and the filter performed much better after that." Give the three follow-up questions this invites, and rewrite the Result so that none of them is needed.
:::

::: answer
The three questions are *better at what*, *measured how*, and *better than what baseline*.

A rewrite that answers all three in advance: "Before the fix the filter's normalized estimation error squared averaged well above the upper limit of its chi-square band, which means it was reporting a covariance far tighter than its actual error. After the fix, over a hundred Monte Carlo runs, the average sat inside the band — for six states and a hundred runs that band is about 5.3 to 6.7 around an expected value of 6. Accuracy barely changed; what changed is that the filter stopped lying about its own uncertainty." Quantity, baseline, value and standard, in three sentences.
:::

::: check
Why does this lesson treat a criterion fixed before the run as stronger evidence than the same criterion stated afterwards, when the number reported is identical?
:::

::: answer
Because a criterion chosen after the results are in cannot fail. If you decide what counts as success once you know the answer, the test carried no risk, and passing it tells nobody anything — it only shows you can describe your own output. A criterion fixed in advance *could* have been missed, so meeting it is evidence. That is why the portfolio module insists a dispersion campaign states its pass criterion before it runs, and why "the bar I set before I started was…" is worth the extra six words.
:::

::: check
You wrote a script that saved you a couple of hours a week on a student project. It feels too small to mention next to stories about simulations and estimators. Should you quantify it, and how?
:::

::: answer
Quantify it at its real size and let it be small. "It saved me about two hours a week for the remaining ten weeks of the project, which is where the time for the verification work came from" is precise, honest, and tied to something that mattered. (That is about $2 \times 10 = 20$ hours in total — a real chunk of a term.) The urge to inflate a small number is what causes trouble: an exaggerated figure invites scrutiny a modest one does not, and getting caught over something trivial costs far more than the modest figure would have. A small number stated exactly also shows calibration, which is worth more in an engineer than the size of any one result.
:::

::: check
An interviewer responds to your quantified result with: "How did you measure that?" What has happened, and what does a good answer contain?
:::

::: answer
The good case has happened: your number was specific enough to be worth checking. The answer needs one sentence saying what you measured, on what, and under what conditions — for example, "wall-clock time for the same five-hundred-case campaign with the same seed, on my own laptop, on both versions." What weakens it is hedging, a sudden new estimate, or admitting the number was an impression. That is why the measuring should happen before the story enters your bank, not in the moment it is questioned.
:::

::: check
Why can a number describing a failure — say, that four percent of dispersed descent cases came back infeasible — be a stronger Result than a favorable average?
:::

::: answer
Because it is the number that carries information about the design. An average landing accuracy over the cases that happened to converge says nothing about the ones that did not. A fixed-final-time formulation has no way to ask for more time, so those cases fail outright instead of landing a bit worse.

Reporting the infeasible fraction first shows you looked for the campaign's most informative result, not its most flattering one. It also sets up the engineering conversation you actually want — about the formulation, and what a two-stage design would fix. Choosing to lead with an unfavorable number is one of the cheapest ways to show that your numbers can be trusted.
:::

::: check
A candidate says: "I improved the convergence rate by sixty percent." Why is this weaker than it sounds, and what would you ask for?
:::

::: answer
It is a ratio with no baseline, no clearly named quantity, and no standard. Sixty percent of what — iterations to converge, wall-clock time, the fraction of cases that converge at all? From what starting value? And is the result now acceptable, or only less bad?

Ask for the two actual numbers and the criterion: "it converged in four iterations against ten before, to the same residual tolerance." That is the same claim — ten down to four is $(10 - 4)/10 = 0.6$, or 60 percent fewer — but checkable, and shorter to say. As a rule, if a result can be stated in actual values, state it that way. Percentages are for when the raw values mean nothing without context, and even then the baseline goes in the sentence.
:::

## Summary

| Component | Question it answers | Failure without it |
| --- | --- | --- |
| Quantity | What was measured | "Better" — at what? |
| Baseline | Compared with what | A change with no starting point |
| Value | The number, rounded for speech | Adjectives |
| Standard | Why that number is good | Invites "is that good?" |
| Provenance | How you know it | Cannot survive "how did you measure that?" |
| No number recorded | Rebuild, re-measure, or count scope | Presenting a guess as a measurement |

Three routes to a number you did not record, strongest first: rebuild it from the record, measure it again now because the project still runs, or count the scope instead of the improvement — and label a guess as a guess. The next lesson turns from one story to the whole set: how many you need, how to index them so the right one arrives under pressure, and how to rehearse them without memorizing them.

::: context checkable A claim that could turn out wrong
Scientists prize claims that could be shown false by a measurement, because those are the only claims a test can actually support. "The new code is 21 times faster on this campaign" could be wrong — someone could run it and get 5 — so if it survives the check, it means something. "The new code is much better" cannot be wrong, which is exactly why it tells the listener nothing. A good Result sticks its neck out a little.
:::

::: context result-anatomy Four parts in two sentences
A checkable Result reads like a short measurement report. Each box answers one question the listener would otherwise have to ask. Here the standard is that the campaign became fast enough to run on every change.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="8" y="20" width="80" height="50" rx="6" fill="#8fb8f0"/>
    <rect x="96" y="20" width="80" height="50" rx="6" fill="#fff"/>
    <rect x="184" y="20" width="80" height="50" rx="6" fill="#8fb8f0"/>
    <rect x="272" y="20" width="80" height="50" rx="6" fill="#f2b880"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">
    <text x="48" y="42">Quantity</text><text x="136" y="42">Baseline</text><text x="224" y="42">Value</text><text x="312" y="42">Standard</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="48" y="60">runtime</text><text x="136" y="60">14 hours</text><text x="224" y="60">40 minutes</text><text x="312" y="60">every change</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="48" y="92">what?</text><text x="136" y="92">from what?</text><text x="224" y="92">to what?</text><text x="312" y="92">is that good?</text>
  </g>
  <text x="180" y="130" font-size="11" fill="#6c7a93" text-anchor="middle">the grey line is the follow-up each box saves you</text>
</svg>
```
:::

::: context rms-residual Averaging misses without letting them cancel
A residual is the leftover gap between a measurement and what your fitted model predicts for it. Some gaps are positive, some negative, so a plain average could come out near zero even when the fit is bad. RMS — "root mean square" — fixes that: square each gap (all positive now), take the mean, then the square root to get back to meters. For gaps of $3$, $-4$ and $5$ m: squares $9, 16, 25$; mean $50/3 \approx 16.7$; square root about $4.1$ m.
:::

::: context over-fitting Bending to follow the noise
Every measurement carries some random noise. A good fit follows the real trend and lets the noise scatter around it. An over-fitted model twists itself to pass near every point, noise and all, so it looks perfect on this data and predicts badly on the next. A residual well *below* the noise level is a warning sign of this.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="130" x2="20" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="115" x2="330" y2="35" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="50,98 80,111 110,78 140,95 170,62 200,80 230,47 260,64 290,36 320,52" fill="none" stroke="#b4232c" stroke-width="2"/>
  <g fill="#1f2a44">
    <circle cx="50" cy="98" r="4"/><circle cx="80" cy="111" r="4"/><circle cx="110" cy="78" r="4"/><circle cx="140" cy="95" r="4"/><circle cx="170" cy="62" r="4"/>
    <circle cx="200" cy="80" r="4"/><circle cx="230" cy="47" r="4"/><circle cx="260" cy="64" r="4"/><circle cx="290" cy="36" r="4"/><circle cx="320" cy="52" r="4"/>
  </g>
  <text x="330" y="22" font-size="11" fill="#1d6fd1" text-anchor="end">good fit: the trend</text>
  <text x="330" y="150" font-size="11" fill="#b4232c" text-anchor="end">over-fit: chases every point</text>
</svg>
```
:::

::: context reproducibility Same command, same answer
A reproducible project gives the same result every time anyone runs it. Three things make that possible. One command runs everything, so nothing depends on steps you remember. A fixed random seed — the starting number for the computer's random generator — makes a Monte Carlo campaign draw the same "random" cases every run. And pinned dependencies lock the exact versions of the libraries you used. With all three, re-timing an old version months later takes an evening, not a week.
:::

::: context margins How much room you have left
A margin is the gap between where you are and where things go wrong. A propellant margin is fuel left over after the planned burn. **Phase margin** is a control-system measure of how far a feedback loop is from starting to oscillate on its own; you will meet it properly in the control modules. Margins make excellent Results because they come with a built-in standard: bigger is safer, and requirements usually state a minimum.
:::

::: context rounding-for-speech Precision you can defend
Written reports can carry every digit. Speech should not. Rounding to two meaningful digits — "about forty minutes", "about twenty-one times" — is honest, easy to hear, and leaves you room if someone re-measures and gets a slightly different figure. Keep the exact value ready for the follow-up: 38.6 minutes, measured on your laptop, same seed. The rounded number is what you say; the exact one is what you know.
:::

::: context wall-clock Two kinds of "how long"
Wall-clock time is what a clock on the wall would show between start and finish. CPU time adds up how long the processor's cores actually spent computing. On a machine with eight cores all busy, one hour of wall-clock time can be about eight hours of CPU time. If a speed-up came partly from running cases in parallel, the two measures tell very different stories — which is why "which one?" is a natural follow-up to any runtime claim.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44" font-weight="700">8 cores, all busy for 1 hour</text>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="28" width="40" height="8"/><rect x="10" y="38" width="40" height="8"/><rect x="10" y="48" width="40" height="8"/><rect x="10" y="58" width="40" height="8"/>
    <rect x="10" y="68" width="40" height="8"/><rect x="10" y="78" width="40" height="8"/><rect x="10" y="88" width="40" height="8"/><rect x="10" y="98" width="40" height="8"/>
  </g>
  <text x="62" y="71" font-size="11" fill="#1f2a44">wall-clock time: 1 h (one bar long)</text>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="130" width="40" height="12"/><rect x="50" y="130" width="40" height="12"/><rect x="90" y="130" width="40" height="12"/><rect x="130" y="130" width="40" height="12"/>
    <rect x="170" y="130" width="40" height="12"/><rect x="210" y="130" width="40" height="12"/><rect x="250" y="130" width="40" height="12"/><rect x="290" y="130" width="40" height="12"/>
  </g>
  <text x="10" y="122" font-size="11" fill="#1f2a44">the same work laid end to end</text>
  <text x="170" y="162" font-size="11" fill="#1f2a44" text-anchor="middle">CPU time: 8 h (eight bars long)</text>
</svg>
```
:::
