---
id: l02-when-you-do-not-know
title: "When you do not know: recovering out loud"
minutes: 23
covers:
  - "the answering standard: state assumptions, write the equation, interpret physically, sanity check"
---

The domain round samples a wide surface — margins, three flavours of Kalman filter, attitude determination, inertial navigation, orbit determination, PID pathology — and it samples it with follow-ups. Follow-ups are how an interviewer finds the edge of what you know, which means that if the round goes well you will reach that edge, because that is what the round is for. A candidate who never hits a question they cannot answer has usually been interviewed badly.

So the skill is not avoiding the gap. It is what happens in the twenty seconds after the gap opens. Those twenty seconds are assessed, they are assessed deliberately, and they discriminate between candidates far more sharply than the recall questions do — because almost everyone can recite the Kalman gain, and very few people can reconstruct a result they have half-forgotten while saying out loud which half they are unsure of.

This lesson gives you a sequence for that. It is the same four moves as the previous lesson with one extra move at the front, and the extra move is the one that makes the rest of it credible.

## Three honest positions, and a fourth that is not

When a question lands, you are in one of four places.

**I have it.** Recall. Answer it with the four moves and stop.

**I can rebuild it.** You do not have the result memorised but you have something adjacent that generates it — a definition, a conservation law, a degrees-of-freedom count, a neighbouring formula. This is the position most "I don't know" answers are actually in, misdiagnosed.

**I can bound it.** You cannot produce the result but you can say what it must be bigger than, smaller than, or proportional to, and why. A bound with a stated basis is a real answer.

**I do not have it and cannot get there.** This happens, and said cleanly it costs you almost nothing. Said badly — filled with hedging, or disguised as an answer — it costs you a great deal, because an interviewer who cannot tell the difference between your confident correct statements and your confident invented ones has to discount all of them.

::: key The four positions
Recall it, rebuild it, bound it, or decline it cleanly. The expensive failure is none of these: it is producing something that *sounds* like an answer while the interviewer cannot tell which of the three honest positions you were in. Your credibility across the whole round rests on the interviewer being able to tell.
:::

## The recovery sequence

**One: mark the gap, in one clause, without apology.** "I do not have that one memorised — let me rebuild it." Not "sorry, I should know this", not "it has been a while since I looked at that", not a laugh. One clause, then move. The apology version is worse than useless: it invites the interviewer to start looking for other things you should know and do not.

**Two: name the object correctly.** This is where most of the partial credit lives and most candidates skip it. "That is the Joseph form of the covariance update." "That is a Rayleigh quotient, so the answer is going to be an extreme eigenvalue." "That is a first-order Gauss–Markov process, so it has a correlation time and a stationary variance." Naming the object proves you have met it, tells the interviewer which shelf to look on with you, and often supplies the structure you need for step four.

**Three: anchor on something you do know, and say what it is.** Out loud: "What I do know is the definition of the covariance as the expectation of the error outer product, so let me start there." The anchor is the claim you are asking the interviewer to grant you; stating it lets them correct it immediately if it is wrong, which saves the whole derivation.

**Four: reason forward, marking each assumption as you use it.** This is the four-move standard applied to a reconstruction instead of a recollection. The marking matters more here than anywhere else: "I am assuming the measurement noise is uncorrelated with the prior error, which is what kills the cross terms."

**Five: state your confidence and the check you would run.** "I am confident in the structure and less confident in the factor of two; I would check it by setting the gain to zero, which has to return the prior covariance unchanged." A stated confidence is information the interviewer can use. An unstated one makes them guess.

::: warning "I would look it up" is a half-answer
It is a true and professionally correct thing to say, and on its own it is a non-answer, because every candidate would look it up. What makes it an answer is what comes with it: what you would look up, where, what you expect to find, and what you would do in the meantime. "I would check Markley and Crassidis for the exact reset Jacobian, but I know it is a correction of order the estimated error itself, so for a small correction it is a second-order effect and I would expect the filter to run without it and to be slightly optimistic" is an answer. "I would look it up" is not.
:::

## Three levers for rebuilding

**Dimensions and units.** The cheapest structural constraint there is. If you are asked for the delay a loop tolerates and you remember only that it involves the phase margin and the crossover frequency, units settle the form: an angle in radians divided by a frequency in radians per second is a time, and there is no other combination of those two that is. You have recovered the formula from its units alone.

**Degrees of freedom and constraints.** Attitude has three degrees of freedom. A unit vector observation supplies two constraints, not three. A quaternion has four parameters and one constraint. Counting these settles a surprising number of questions about which matrix is singular, how many measurements are enough, and why an error state has the dimension it has.

**Limiting cases.** Ask what the answer must become when a parameter goes to zero or to infinity, and the structure often follows. If you cannot remember whether the Kalman gain has $\mathbf{R}$ in the numerator or the denominator, the $\mathbf{R}\to\infty$ limit settles it in three seconds: an infinitely noisy sensor must produce zero gain, so $\mathbf{R}$ is downstairs.

::: example Rebuilding a result you did not memorise
**The question:** "Write the covariance update for an *arbitrary* gain — not the optimal one."

**A weak answer:** "The covariance update is $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$. I think there is another form with more terms in it but I do not remember it."

Everything stated is true, and the answer ends in the wrong place: the interviewer asked for the general form precisely because the simple one is only valid at the optimal gain, and the candidate has just demonstrated they do not know that.

**A strong answer, narrated:**

"I do not have the general form memorised — let me rebuild it, because it comes straight out of the definition.

That is the Joseph form, and the reason it is a separate object is that $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ is only correct at the optimal gain.

What I know is the definition: $\mathbf{P}^+$ is the expectation of the posterior error outer product. So write the posterior error. With $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$ and $\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}(\mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^-)$, subtract from the truth:

$$\mathbf{e}^+ = \mathbf{x} - \hat{\mathbf{x}}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e}^- - \mathbf{K}\mathbf{v}.$$

Now take the outer product expectation. I am assuming the prior error and the measurement noise are uncorrelated, which is what kills the two cross terms — that assumption is doing all the work here. What is left is

$$\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}.$$

Physically: it is the prior uncertainty, shrunk by whatever the measurement removed, plus the measurement's own noise fed back in through the gain. Both terms are symmetric positive semi-definite by construction, which is exactly why this form is the numerically safe one — it cannot go indefinite through round-off the way the short form can.

Two checks. Set $\mathbf{K} = \mathbf{0}$: the second term vanishes and the first collapses to $\mathbf{P}^-$, which is right, because a filter that ignores the measurement must keep its prior covariance. And substituting the optimal gain should collapse it to $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ — I would do that algebra if you want it, but the structural point is that the short form is a special case, not the definition."

**What the interviewer learns from the difference:** the candidate did not have the result and produced it anyway from a definition, in under ninety seconds, naming the one assumption that makes it work and closing on a limiting case. That is a better signal than having had it memorised, and both candidates started from the same place.
:::

::: example Bounding something you have never studied
**The question:** "How would you account for an analogue-to-digital converter's quantisation in a navigation filter?"

Suppose you have never seen this treated formally. You still are not stuck.

**A weak answer:** "I have not dealt with quantisation directly. I suppose you would just make sure the ADC has enough bits."

**A strong answer:**

"I have not modelled that explicitly in a filter, so let me reason it out.

Quantisation replaces the true value with the nearest of a set of levels spaced by one least significant bit — call it $q$. The error is therefore bounded by half a level, and if the signal moves by more than a few levels between samples the error is well approximated as uniformly distributed on the interval from $-q/2$ to $+q/2$. A uniform distribution on an interval of width $q$ has variance $q^2/12$, so to first order I would model it as an extra white measurement noise of variance $q^2/12$ added to $\mathbf{R}$.

The assumption I am leaning on is that the quantisation error behaves like independent white noise. That fails exactly where you would expect it to: if the signal is nearly constant over many samples, the error is not random at all — it is a deterministic offset that repeats, so it shows up as a bias rather than as noise, and the filter will see correlated residuals. Dithering is the standard fix for that, and it is the same reason a stationary vehicle is the hardest case for this model rather than the easiest.

Sanity check on magnitude: a 16-bit converter over a $\pm10\,\mathrm{V}$ range has $q$ of about $0.3\,\mathrm{mV}$, so the quantisation standard deviation is about $88\,\mathrm{\mu V}$ — almost certainly far below the sensor's own noise, which is why this usually does not matter and why it becomes interesting only when somebody has under-specified the converter."

**What the interviewer learns:** the candidate did not know the answer, said so, and produced the correct model, its validity condition, its failure mode and an order-of-magnitude check from first principles. The one memorised ingredient — the variance of a uniform distribution — is a probability fact, not a navigation fact.
:::

## Bluffing, and why it is detected

The failure mode this lesson exists to prevent is not silence. It is the confident answer assembled out of correct-sounding vocabulary, and it is detected almost immediately, for a specific reason: a bluffed answer has the wrong shape. It is fluent where a real answer would pause, it is vague exactly at the load-bearing step, and it cannot survive one follow-up. The interviewer asks "which term is that, exactly?" and there is nothing behind it.

The cost is not the one question. It is that every other answer you gave now has to be re-examined, because the interviewer has learned that your confidence does not track your knowledge. One bluff contaminates a whole round; one clean "I do not have that" contaminates nothing.

::: warning Do not hedge everything either
The opposite failure is a candidate who prefaces every statement with "I think" and "maybe" and "I could be wrong about this". If you are certain, say it flatly. Reserve the hedges for the places you are actually unsure, and they become informative — the interviewer can then tell your certain statements from your uncertain ones, which is the whole point.
:::

## Taking a correction

You will be corrected, sometimes about something you were right about. There is one good response and it has three parts: accept it without argument, restate the corrected fact in your own words so the interviewer can see it has landed, and carry on from there rather than restarting.

If you believe the correction is wrong, you may say so — once, with the reason, and without heat: "I may be misremembering, but I had the gain margin measured at the phase crossover rather than at the gain crossover; is that the distinction you mean?" That is a technical disagreement handled the way one is handled at work, and it is assessed as such. What is not assessed well is capitulating instantly to a correction you have a good reason to doubt, because a GNC engineer who folds on a technical point under mild social pressure is a liability in exactly the review where it matters.

::: example Being corrected mid-answer
**The exchange:**

*Candidate:* "…so the delay margin is the phase margin in radians divided by the crossover frequency."

*Interviewer:* "Divided by the phase crossover frequency."

**A weak response:** "Oh — yes, of course, the phase crossover. Sorry. So, as I was saying…" The candidate has just agreed to something false and the interviewer now does not know whether the original statement was understanding or luck.

**A strong response:** "I had it as the *gain* crossover, and let me say why, in case I am wrong. A pure delay does not change any magnitude, so it cannot move the frequency where the magnitude is one. The phase it removes at that frequency is the crossover frequency times the delay, and the margin is gone when that equals the phase margin. So the frequency in the denominator has to be the one where the phase margin was measured, which is the gain crossover. Does that match what you have?"

**Why this is the right move:** it is not a contest. The candidate gives the reasoning rather than the assertion, offers the interviewer a clean way to correct them if they are still wrong, and demonstrates that the original statement came from a derivation rather than a card. If the interviewer meant something else, this exchange finds it in one sentence.
:::

## Check yourself

::: check
Give the five steps of the recovery sequence, and say which one carries most of the partial credit.
:::

::: answer
Mark the gap in one clause without apology; name the object correctly; state the anchor you are reasoning from; reason forward marking each assumption as you use it; state your confidence and the check you would run. The second step — naming the object — carries most of the partial credit, because "that is a Rayleigh quotient, so the answer is an extreme eigenvalue" or "that is the Joseph form" proves you have met the thing, gives the interviewer somewhere to help from, and usually supplies the structure the reconstruction needs.
:::

::: check
You cannot remember whether the Kalman gain is $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$ or $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{R})^{-1}$. Settle it in two ways without recalling the derivation.
:::

::: answer
First, by a limiting case: as the sensor becomes infinitely noisy, $\mathbf{R}\to\infty$, the gain must go to zero, because a measurement carrying no information must not move the estimate. Only the plus sign does that; the minus sign would make the gain grow. Second, by positive-definiteness: the bracket is the covariance of the innovation, which is a covariance and therefore positive semi-definite for every $\mathbf{P}^-$ and $\mathbf{R}$; a difference of two positive semi-definite matrices need not be, and a filter that could be asked to invert an indefinite matrix would not be a filter anyone flies. Either argument takes one sentence.
:::

::: check
An interviewer asks about a technique you have genuinely never encountered — say, a filter architecture you have not heard of by name. Write the two or three sentences you would say.
:::

::: answer
"I have not worked with that one, so I will not guess at what it does. What I can tell you is the problem it is presumably solving, if I have placed it correctly: [state the family it appears to belong to and the failure mode that family addresses]. If that is the right family, then I would expect it to trade [cost] for [benefit], which is the trade every member of that family makes. I would want to read the original paper before saying anything stronger." That is an honest decline plus a structural inference plus a stated next step, and it is a complete answer. What it deliberately avoids is inventing a mechanism, because the follow-up would find it immediately.
:::

::: check
Why does one bluffed answer cost more than one declined answer, even when the bluff happens to be partly right?
:::

::: answer
Because the interviewer's job is to form a belief about what you know, and every answer you gave is evidence only if your confidence tracks your knowledge. A bluff breaks that link. Once the interviewer has seen one confident statement that turned out to be assembled rather than known, they have to discount the confidence attached to all the others, including the correct ones — so the cost is spread across the whole round rather than confined to one question. A clean decline does the opposite: it calibrates them, and makes the rest of your confident statements more credible, not less.
:::

::: check
You are asked for the number of sigma points a UKF uses for a fifteen-state inertial error filter, and you cannot recall the formula. Rebuild it from what the sigma points are for.
:::

::: answer
The sigma-point set has to reproduce the mean and the covariance of an $n$-dimensional distribution exactly. The covariance has $n$ independent directions, and the symmetric construction places one point out along each direction and one back along it, which is $2n$ points; a further point at the mean itself carries the central weight. So the count is $2n + 1$, which for $n = 15$ is $31$. The units-and-structure check is that the count must grow linearly with $n$, not quadratically, because the information being matched is a covariance whose square root has $n$ columns — one point per column per sign.
:::

## Summary

| Item | Content |
| --- | --- |
| The four positions | Recall it, rebuild it, bound it, decline it cleanly |
| Recovery sequence | Mark the gap in one clause; name the object; state the anchor; reason forward marking assumptions; state confidence and a check |
| Three rebuilding levers | Units and dimensions; degrees of freedom and constraints; limiting cases |
| Joseph form, rebuilt | $\mathbf{e}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e}^- - \mathbf{K}\mathbf{v}$ gives $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$ |
| Quantisation, bounded | Uniform on a step $q$, variance $q^2/12$; add to $\mathbf{R}$; fails when the signal is too quiet to dither itself |
| Bluffing | Detected by shape, not content; contaminates the whole round rather than one question |
| Corrections | Accept, restate in your own words, continue; disagree once, with the reason, without heat |

From here the module is technical. The next lesson starts with the subject that opens more domain rounds than any other: what the three stability margins are, and what each one is protecting you against.
