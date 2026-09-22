---
id: l03-quantifying-the-result
title: "Quantifying the Result so it can be checked"
minutes: 22
covers:
  - quantifying the Result so the story is checkable
---

The last twenty seconds of a story are the part the listener carries out of the room, and they are the part most stories never reach. The previous two lessons protected that time by budgeting the scene and by making the Action assessable. This lesson is about what to put in it.

The short answer is a number. Not because interviewers like arithmetic, and not because every outcome is measurable, but because a number does three things an adjective cannot: it is checkable, it is memorable, and it can only be stated by someone who actually measured the outcome instead of assuming it. That last one is the real function. An engineer who says a change improved the simulation has told you what she hoped; an engineer who says the campaign went from fourteen hours to forty minutes has told you she timed it both times, which is a claim about her practice as much as about the result.

This lesson covers what a checkable Result contains, where the number comes from when you never wrote one down, which numbers help you and which quietly damage you, and how to say one out loud without sounding like a slide deck.

::: key
A number makes the story checkable and memorable. *Reduced the Monte Carlo campaign runtime from 14 hours to 40 minutes* is a result; *improved the simulation significantly* is a claim the interviewer cannot evaluate.
:::

## What a number does that an adjective cannot

**It is checkable.** A quantified result invites the question *how did you measure that?*, and a candidate who measured it has a one-sentence answer ready. That exchange is worth having: it converts an assertion into evidence in about ten seconds. An unquantified result cannot be checked, so it cannot be believed or disbelieved — it is simply set aside.

**It is memorable.** Someone talking to several candidates retains specifics far better than qualities. Fourteen hours to forty minutes is a thing a person can repeat to a colleague afterwards. *Significantly faster* is not, and an answer nobody can repeat is an answer that does not travel past the room.

**It forces the measurement to have happened.** This is the part that matters for your own practice, not only for the interview. Deciding in advance that every story ends in a number means that while you are doing the work you will instrument the outcome — time the baseline before optimising, record the residual before and after, fix the pass criterion before running the campaign rather than choosing one once you have seen the results. That habit is the same one the portfolio module argues for, and it is why this lesson belongs to engineering rather than to interview technique.

## The anatomy of a checkable result

A number on its own is not enough. Forty minutes is meaningless without what it was before, what was being measured, and why forty minutes is good. A Result that survives questioning has four components, and they fit comfortably in two sentences.

**The quantity.** What was measured — runtime, landing error, residual, the fraction of dispersed cases meeting the criterion, the number of days late.

**The baseline.** What it was before, or what it would have been otherwise. A delta without a baseline is not a measurement; it is a mood.

**The value.** The number after, at a sensible precision.

**The standard.** Why that number is the right side of the line. Sometimes the standard is external — the requirement, the tolerance, the noise floor of the measurement. Sometimes it is one you set, in which case say you set it, and say when: a criterion fixed before the run is evidence, and a criterion chosen after seeing the numbers is decoration.

That fourth component is the one candidates skip and the one that does the work. "The fit converged to a forty-five-metre RMS residual" is a number. "The fit converged to a forty-five-metre RMS residual, against the fifty-metre per-measurement noise level I had assumed, so it was fitting the data to about the level the data supports and no further" is a result with a standard attached — and the second version quietly demonstrates that you know what over-fitting would have looked like.

## Where the number comes from when you never measured one

Most stories from real work were not instrumented at the time. This is normal and it is fixable, in one of three ways, in decreasing order of strength.

**Reconstruct it from the record.** More of it survives than you expect: commit timestamps, log files, the notebook where you first ran the thing, the write-up you produced for the portfolio module, the message where you told someone it was done. An afternoon in your own history will usually produce a defensible before-and-after for the two or three stories you most want to tell.

**Measure it now.** This is available to you in a way it is not available to most candidates, because your strongest evidence is your own portfolio and the artefacts still exist and still run. If you claim a change made the campaign faster, check out the commit before it and time both. Reproducibility — one command, a fixed seed, pinned dependencies — is exactly what makes this cheap, which is one more reason the portfolio module insisted on it.

**Quantify the scope instead of the improvement.** If there is genuinely no before-and-after, a number describing the size of what you did is still checkable: five hundred dispersed cases, six states, four tracking stations, three weeks, two hundred lines of a review you took apart, a tolerance of one part in ten thousand. Scope numbers are weaker than outcome numbers, because they say how much rather than how well, but they are specific, and specific beats adjectival every time.

What you must not do is estimate and present the estimate as a measurement. If the honest position is that you are reconstructing, say so in the sentence: "I did not time it at the time, but the commit history puts the campaign at two days before the change and a single overnight run after it." That is credible, it is checkable in principle, and it tells the listener you know the difference between a measurement and an inference — which is itself the signal you want to send.

::: warning A percentage with no baseline is not a number
"Improved accuracy by forty percent" sounds quantitative and carries almost no information: forty percent of what, measured how, compared with what, and is the remaining sixty acceptable? It also invites a follow-up you may not be able to answer, at which point the impression left is worse than if you had said nothing numeric at all. Either give the two absolute values — from eleven metres to six and a half — or give the percentage with its baseline attached. The same applies to *doubled*, *halved*, *an order of magnitude*: these are ratios pretending to be results.
:::

## Kinds of number that count

Time and rate — runtime, iterations to convergence, hours per week saved, how many days a thing was late. Error and accuracy — RMS residual, landing error, attitude error, distance from a truth value. Fractions over a set — the share of dispersed cases meeting the criterion, the infeasible fraction, the proportion of a test suite that covers a subsystem. Margins and tolerances — phase margin, propellant margin, the tolerance a check had to hold to. Scope — cases, states, stations, lines, weeks, people taught.

Two more that candidates rarely think of as results but which land well.

**A negative number.** The most informative figure in a dispersion campaign is often the fraction that failed: four percent of five hundred descent cases coming back infeasible says more about the formulation than any mean landing error does. Leading with a number that is not flattering, and explaining why it is the one that mattered, is a strong move — it is the clearest possible evidence that you report what you find rather than what you would like.

**A small number, honestly sized.** "It saved me about six hours a week for the rest of the term" is a real result at its real size. Candidates inflate small results because they feel embarrassing; the inflation is what costs them, not the size. A modest number stated precisely reads as an engineer with calibrated judgement, and the follow-up will be about the work, not about the claim.

## Saying it out loud

Round for speech. "About forty minutes" is how a person talks; "thirty-eight point six minutes" sounds like reading from a plot, and invites a precision you probably cannot defend. Keep the exact figure in your head in case you are asked for it, and give the rounded one first.

Keep the *how did you measure that* answer to one sentence, and have it ready for every number in your bank. This is the single most predictable follow-up to a quantified Result, and it is the one that separates the two candidates the number was supposed to distinguish in the first place.

And give the number its standard in the same breath, because a number without a standard usually produces a worse follow-up: not *how did you measure it* but *is that good?* — a question you never want to be answering about your own work.

::: example One piece of work, three Results
The work: the candidate added a layered atmosphere model to a 6-DOF launch vehicle simulation and re-ran the dispersion campaign.

**Weak:** "...and after that the simulation was a lot more realistic, which gave me much more confidence in the dispersion results."

Nothing here can be checked, and *confidence* is a feeling about the work rather than a property of it. If the interviewer is generous they will ask a question to rescue it; if they are short of time they will move on, and the story has delivered nothing.

**Better, but still incomplete:** "...and the dynamic pressure at twenty kilometres came out about thirty percent lower than the exponential model had been giving me."

Now there is a measurement, and it invites a sensible follow-up. What is missing is why it matters: thirty percent is a number, not yet a result, because nothing in the sentence says what depended on it.

**Strong:** "The two atmosphere models agree to about five percent on dynamic pressure through max-Q, which is the region I had been worried about — but the exponential fit was roughly thirty percent high at twenty kilometres and close to a factor of two high at thirty, and the vehicle is still under thrust up there. So the error was not where I had been checking. With the layered model the loads above twenty kilometres are trustworthy to the same standard as the ones below it, and I wrote the comparison table into the assumptions section so anyone using the results can see what the model is worth."

**What the strong version has:** a quantity (dynamic pressure), a baseline (the exponential fit), values at two altitudes, and a standard — that the loads above twenty kilometres should be as trustworthy as those below. It also contains the sentence that makes it credible: the error was not where she had been checking. An engineer who reports where her own attention had been misdirected is one whose reported numbers you can trust.
:::

::: example Reconstructing a number you never wrote down
**The situation:** you want to tell a story about rewriting the inner loop of your simulation in C++ after the Python version made the dispersion campaign impractical. You are certain it got much faster. You never timed it, because at the time you were not thinking about interviews.

**The bad repair:** invent a plausible figure. "It went from about twelve hours to about half an hour." Two problems. It is not true, which matters on its own terms. And it is fragile in a specific way: the obvious follow-ups — what hardware, how many cases, was that wall-clock or CPU time — are questions about a measurement that never happened, and answering them requires more invention each time.

**The good repair, in order of preference.**

*First, go and measure it.* The commit before the rewrite still exists and the project runs from one command with a fixed seed, so run the same campaign on both. Suppose that gives fourteen hours against forty minutes on your own machine — a factor of about twenty-one. You can now say it, and say how you know: "I re-ran the same five-hundred-case campaign on both versions on my own machine to check before I said this out loud, and it is fourteen hours against forty minutes." That last clause is unusual enough to be worth the two seconds it takes.

*Second, if the old version no longer runs,* reconstruct and label it: "I did not time it properly at the time. What I can tell you is that the Python version could not finish five hundred cases overnight and the C++ version does it in well under an hour, so it is somewhere around a factor of ten to twenty." A stated range with a stated basis is an honest result and nobody will penalise it.

*Third, if neither is available,* change what you quantify. Drop the speed-up and describe the scope it unlocked: "The point of the rewrite was that it turned the campaign from something I ran once before a deadline into something I ran on every change — which is how the wind-shear case that broke my gain schedule got found at all, because it was not in the first hundred cases." No before-and-after timing appears, and the sentence is still specific, still checkable, and arguably tells the listener more about your engineering than the ratio would have.
:::

## Check yourself

::: check
A candidate ends a story with: "and the filter performed much better after that." Give the three follow-up questions this invites, and rewrite the Result so that none of them is needed.
:::

::: answer
The three questions are *better at what*, *measured how*, and *better than what baseline*. A rewrite that answers all three in advance: "Before the fix the filter's normalised estimation error squared averaged well above the upper limit of its chi-square band, which means it was reporting a covariance far tighter than its actual error. After the fix, over a hundred Monte Carlo runs, the average sat inside the band — for six states and a hundred runs that band is about 5.3 to 6.7 around an expected value of 6. Accuracy barely changed; what changed is that the filter stopped lying about its own uncertainty." Quantity, baseline, value and standard, in three sentences.
:::

::: check
Why does this lesson treat a criterion fixed before the run as stronger evidence than the same criterion stated afterwards, when the number reported is identical?
:::

::: answer
Because a criterion chosen after the results are in cannot fail. If you decide what counts as success once you know the answer, the test carried no risk and the pass conveys no information — the only thing it demonstrates is that you can describe your own output. A criterion fixed in advance could have been missed, so meeting it is evidence. This is why the portfolio module insists that a dispersion campaign state its pass criterion before the campaign runs, and it is why saying "the bar I set before I started was..." in a Result is worth the extra six words.
:::

::: check
You are describing a script you wrote that saved you a couple of hours a week on a student project. It feels too small to mention against stories about simulations and estimators. Should you quantify it, and how?
:::

::: answer
Quantify it at its real size and let it be small. "It saved me about two hours a week for the remaining ten weeks of the project, which is where the time for the verification work came from" is precise, honest, and traceable to something that mattered. The instinct to inflate a small number is what creates the problem: an exaggerated figure invites scrutiny that a modest one does not, and being caught over something trivial costs far more than the modest figure would have. A small number stated exactly also demonstrates calibration, which is a quality worth more in an engineer than the size of any single result.
:::

::: check
An interviewer responds to your quantified result with: "How did you measure that?" What has happened, and what does a good answer contain?
:::

::: answer
The good case has happened: your number was specific enough to be worth checking. The answer needs one sentence, containing what you measured, on what, and under what conditions — for example, "wall-clock time for the same five-hundred-case campaign with the same seed, on my own laptop, on both versions." What weakens it is hedging, a sudden re-estimate, or an admission that the number was an impression. That is why the measurement should be done before the story enters your bank rather than in the moment it is questioned.
:::

::: check
Why can a number describing a failure — for instance that four percent of dispersed descent cases returned infeasible — be a stronger Result than a favourable mean?
:::

::: answer
Because it is the number that carries information about the design. A mean landing accuracy over the cases that happened to converge says nothing about the ones that did not, and a fixed-final-time formulation has no way to ask for more time, so those cases fail outright rather than degrading. Reporting the infeasible fraction first shows that you looked for the campaign's most informative result rather than its most flattering one, and it sets up the engineering conversation you actually want — about the formulation and what a two-stage architecture would fix. Leading with an unfavourable number that you chose to lead with is one of the cheapest ways to demonstrate that your reported numbers can be trusted.
:::

::: check
A candidate says: "I improved the convergence rate by sixty percent." Why is this weaker than it sounds, and what would you ask for?
:::

::: answer
It is a ratio with no baseline, no quantity properly named and no standard. Sixty percent of what — iterations to convergence, wall-clock time, the fraction of cases that converge at all? From what starting value? And is the result now acceptable, or merely less bad? Ask for the two absolute numbers and the criterion: "it converged in four iterations against ten before, to the same residual tolerance" is the same claim, checkable, and shorter to say. As a rule, if a result can be stated in absolutes, state it in absolutes; percentages are for when the absolute values are meaningless without context, and even then the baseline goes in the sentence.
:::

## Summary

| Component | Question it answers | Failure without it |
| --- | --- | --- |
| Quantity | What was measured | "Better" — at what? |
| Baseline | Compared with what | A delta with no reference point |
| Value | The number, rounded for speech | Adjectives |
| Standard | Why that number is good | Invites "is that good?" |
| Provenance | How you know it | Cannot survive "how did you measure that?" |

Three routes to a number you did not record, in decreasing strength: reconstruct it from the record, measure it again now because the artefact still runs, or quantify the scope instead of the improvement — and label an inference as an inference when that is what it is. The next lesson turns from the shape of a single story to the set of them: how many you need, how to index them so the right one arrives under pressure, and how to rehearse them without memorising them.
