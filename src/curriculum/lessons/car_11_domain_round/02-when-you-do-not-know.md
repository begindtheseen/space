---
id: l02-when-you-do-not-know
title: "Rebuilding a result you cannot recall"
minutes: 24
covers:
  - "the answering standard: state assumptions, write the equation, interpret physically, sanity check"
---

Picture a doctor tapping your knee with a rubber hammer — higher, lower, harder — until she finds where the reflex changes. She is mapping the edge.

A domain round does the same thing to your knowledge. It covers a wide area — stability margins, three kinds of Kalman filter, attitude determination, inertial navigation, orbit determination, PID trouble — and it probes that area with **[[follow-up questions|follow-ups]]**. Follow-ups are how an interviewer finds the edge of what you know. If the round goes well you *will* reach it, because finding it is the point. A candidate who never hits a question they cannot answer has usually been interviewed badly.

So the skill is not avoiding the gap. It is the twenty seconds after the gap opens. Interviewers watch those seconds on purpose, and they separate candidates far more sharply than recall does. Almost everyone can recite the Kalman gain. Very few people can rebuild a result they have half-forgotten while saying out loud which half they are unsure of.

This lesson gives you a sequence for that. It is the previous lesson's four moves with one extra at the front, which makes the rest believable.

One boundary first. The screens module treats not knowing as a conversation problem — what to say, how not to bluff. The past-project module treats not knowing about your *own* work, a more awkward case. This lesson is neither. Here the missing thing is a **technical result** — an equation, a definition or a derivation you have met but cannot produce right now. Such a result can often be rebuilt on the spot from something you *do* have, and most of this lesson is about how.

## Three honest positions, and a fourth that is not

When a question lands, you are in one of **[[four places|four-positions-map]]**.

**I have it.** Use the four moves; stop.

**I can rebuild it.** You have not memorized the result, but you have something next to it that produces it — a definition, a conservation law, a count of how many things can vary, a neighboring formula. Most "I don't know" answers are really here.

**I can bound it.** You cannot produce the result, but you can say what it must be bigger than, smaller than, or proportional to — and why. A **bound**, a limit the answer must sit inside, is a real answer when you say what it rests on.

**I do not have it and cannot get there.** Said cleanly, it costs almost nothing. Said badly — buried in hedges, or dressed up as an answer — it costs a great deal. An interviewer who cannot tell your confident correct statements from your confident invented ones has to discount all of them.

::: key The four positions
Recall it, rebuild it, bound it, or decline it cleanly. The expensive failure is none of these: it is producing something that *sounds* like an answer while the interviewer cannot tell which of the three honest positions you were in. Your credibility across the whole round rests on the interviewer being able to tell.
:::

## The recovery sequence

**One: mark the gap, in one clause, without apology.** "I do not have that one memorized — let me rebuild it." Not "sorry, I should know this", not "it has been a while", not a nervous laugh. The apology is worse than useless: it invites the interviewer to start hunting for other things you should know and do not.

**Two: name the object correctly.** This is where most of the partial credit lives, and most candidates skip it. Some examples:

- "That is the **[[Joseph form|joseph-form]]** of the covariance update."
- "That is a **[[Rayleigh quotient|rayleigh-quotient]]**, so the answer is going to be an extreme eigenvalue."
- "That is a **[[first-order Gauss–Markov process|gauss-markov]]**, so it has a correlation time and a steady-state variance."

Naming it proves you have met it, tells the interviewer which shelf to search with you, and often hands you the structure for step four.

**Three: anchor on something you do know, and say what it is.** Out loud: "What I do know is the definition of the covariance as the average of the error times its own transpose, so let me start there." Saying the anchor lets the interviewer correct it at once if it is wrong, which saves the whole derivation.

**Four: reason forward, marking each assumption as you use it.** This is the four-move standard applied to a rebuild instead of a memory. Marking matters more here than anywhere: "I am assuming the measurement noise is uncorrelated with the prior error, which is what kills the cross terms."

**Five: state your confidence and the check you would run.** "I am confident in the structure and less confident in the factor of two. I would check it by setting the gain to zero, which has to return the prior covariance unchanged." A stated confidence is information the interviewer can use. An unstated one makes them guess.

::: warning "I would look it up" is a half-answer
It is true, and on its own a non-answer — every candidate would look it up. What turns it into an answer is what comes with it: what you would look up, where, what you expect to find, and what you would do meanwhile. "I would check Markley and Crassidis for the exact reset Jacobian, but I know it is a correction of the same order as the estimated error itself. So for a small correction it is a second-order effect, and I would expect the filter to run without it and be slightly optimistic" — that is an answer. "I would look it up" is not.
:::

## Three levers for rebuilding

A **lever** here is a tool that pries a formula loose from almost nothing.

**Dimensions and units.** The cheapest constraint there is. Suppose you are asked for the delay a loop can tolerate, and you remember only that it involves the phase margin and the crossover frequency. Units settle the form. An angle in radians divided by a frequency in radians per second is a time, and no other way of combining those two gives a time. You have recovered the formula from its units alone.

**Degrees of freedom and constraints.** A **degree of freedom** is one independent way something can vary. A **constraint** is a rule that removes one. Attitude has three degrees of freedom. A unit-vector observation supplies two constraints, not three. A quaternion has four numbers and one constraint. **[[Counting like this|dof-count]]** settles a surprising number of questions: which matrix is singular, how many measurements are enough, and why an error state has the size it has.

**Limiting cases.** Ask what the answer must become when a quantity goes to zero or to infinity, and the structure often follows. Say you cannot remember whether the Kalman gain has $\mathbf{R}$ — the measurement noise covariance — on the top or the bottom. The $\mathbf{R}\to\infty$ limit settles it in three seconds: an infinitely noisy sensor must produce zero gain, so $\mathbf{R}$ goes downstairs.

::: example Rebuilding a result you did not memorize
**The question:** "Write the covariance update for an *arbitrary* gain — not the optimal one."

**A weak answer:** "The covariance update is $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$. I think there is another form with more terms in it, but I do not remember it."

True, but it ends in the wrong place. The interviewer asked for the general form precisely *because* the simple one is correct only at the optimal gain — and the candidate has just shown they do not know that.

**A strong answer, narrated:**

"I do not have the general form memorized — let me rebuild it, because it comes straight out of the definition.

That is the Joseph form. It is a separate thing because $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ is correct only at the optimal gain.

What I know is the definition: $\mathbf{P}^+$ is the expected **[[outer product|outer-product]]** of the error after the update. So write that error. With the measurement $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$ and the update $\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}(\mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^-)$, subtract the estimate from the truth:

$$\mathbf{e}^+ = \mathbf{x} - \hat{\mathbf{x}}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e}^- - \mathbf{K}\mathbf{v}.$$

Now take the expected outer product. I am assuming the prior error and the measurement noise are uncorrelated, which kills the two cross terms — that assumption is doing all the work here. What is left is

$$\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}.$$

Physically: the prior uncertainty, shrunk by whatever the measurement removed, plus the measurement's own noise fed back in through the gain. Both terms are symmetric and **[[positive semi-definite|psd]]** by construction. That is exactly why this form is the numerically safe one — it cannot go wrong through round-off the way the short form can.

Two checks. Set $\mathbf{K} = \mathbf{0}$: the second term vanishes and the first becomes $\mathbf{P}^-$. That is right, because a filter that ignores the measurement must keep its prior covariance. And substituting the optimal gain should collapse it to $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$. I can do that algebra if you want it, but the structural point is that the short form is a special case, not the definition."

Symbols, for reference: $\mathbf{x}$ is the true state, $\hat{\mathbf{x}}$ (read "x hat") the estimate, $\mathbf{e}$ the error, $\mathbf{v}$ the measurement noise with covariance $\mathbf{R}$, and $-$ and $+$ mean before and after the update.

**What the interviewer learns:** the candidate did not have the result and produced it anyway from a definition, in under ninety seconds, naming the one assumption that makes it work and closing on a limiting case. That beats having memorized it — and both candidates started from the same place.
:::

::: example Bounding something you have never studied
**The question:** "How would you account for an analog-to-digital converter's quantization in a navigation filter?"

An **analog-to-digital converter** (ADC, said "A-D-C") turns a smooth voltage into a whole number. **Quantization** is the rounding that happens along the way. Never seen it treated formally? You are still not stuck.

**A weak answer:** "I have not dealt with quantization directly. I suppose you would make sure the ADC has enough bits."

**A strong answer:**

"I have not modeled that explicitly in a filter, so let me reason it out.

Quantization replaces the true value with the **[[nearest of a set of levels|quantization-staircase]]**, spaced by one least significant bit — call the spacing $q$. So the error is never more than half a level. If the signal moves by more than a few levels between samples, the error is well approximated as uniformly spread from $-q/2$ to $+q/2$. A **[[uniform distribution|uniform-variance]]** on a width $q$ has variance $q^2/12$. So, to first order, I would model it as extra white measurement noise of variance $q^2/12$, added to $\mathbf{R}$.

The assumption I am leaning on is that the quantization error behaves like independent white noise. That fails exactly where you would expect. If the signal is nearly constant over many samples, the error is not random at all — it is the same offset, repeated. It shows up as a bias rather than noise, and the filter sees correlated residuals. **[[Dithering|dithering]]** is the standard fix. That is also why a stationary vehicle is the *hardest* case for this model, not the easiest.

Sanity check on size: a 16-bit converter over a $\pm10\,\mathrm{V}$ range has $q$ of about $0.3\,\mathrm{mV}$, so the quantization standard deviation is about $88\,\mathrm{\mu V}$. That is almost certainly far below the sensor's own noise, so it matters only when somebody has under-specified the converter."

Here is the arithmetic. Sixteen bits gives $2^{16} = 65\,536$ levels. The range is $20\,\mathrm{V}$ wide, so $q = 20/65\,536 \approx 0.305\,\mathrm{mV}$. The standard deviation is $q/\sqrt{12} \approx 0.305/3.46 \approx 0.088\,\mathrm{mV} = 88\,\mathrm{\mu V}$.

**What the interviewer learns:** the candidate did not know, said so, and produced the model, when it holds, how it fails, and a size check from first principles. Its one memorized ingredient is a probability fact, not a navigation fact.
:::

## Bluffing, and why it is detected

To **bluff** is to act as if you know something you do not. The failure this lesson prevents is not silence. It is the confident answer built from correct-sounding words, and it is caught almost at once because it has the wrong shape. It is smooth where a real answer would pause. It is vague exactly at the step that matters. And it cannot survive one follow-up. The interviewer asks "which term is that, exactly?" and there is nothing behind it.

The cost is not one question. Every other answer now has to be re-examined, because the interviewer has learned that your confidence does not track your knowledge. One bluff spoils a whole round. One clean "I do not have that" spoils nothing.

::: warning Do not hedge everything either
The opposite failure is the candidate who starts every statement with "I think" and "maybe" and "I could be wrong about this". If you are certain, say it flatly. Save hedges for real doubt, and they become informative — the interviewer can tell your certain statements from your uncertain ones.
:::

## Taking a correction

You will be corrected — sometimes when you were right. The good response: accept it without arguing, restate the corrected fact in your own words so it visibly lands, and carry on rather than starting over.

If you believe the correction is wrong, you may say so — once, with the reason, and calmly: "I may be misremembering, but I had the gain margin measured at the phase crossover rather than at the gain crossover; is that the distinction you mean?" That is a technical disagreement handled as at work, and judged that way. What goes over badly is caving at once to a correction you have good reason to doubt. A GNC engineer who folds on a technical point under mild social pressure is a liability in exactly the review where it matters.

::: example Being corrected mid-answer
**The exchange:**

*Candidate:* "…so the delay margin is the phase margin in radians divided by the crossover frequency."

*Interviewer:* "Divided by the phase crossover frequency."

**A weak response:** "Oh — yes, of course, the phase crossover. Sorry. So, as I was saying…" The candidate has agreed to something false, and the interviewer cannot tell whether the original was understanding or luck.

**A strong response:** "I had it as the *gain* crossover — let me say why, in case I am wrong. A pure delay does not change any magnitude, so it cannot move the frequency where the magnitude is one. The phase it removes at that frequency is the crossover frequency times the delay, and the margin is gone when that equals the phase margin. So the frequency on the bottom has to be the one where the phase margin was measured, which is the gain crossover. Does that match what you have?"

**Why this is the right move:** it is not a contest. The candidate gives reasons, not an assertion, offers a clean way to be corrected if still wrong, and shows the statement came from a derivation, not a flashcard. If the interviewer meant something else, this finds it in one sentence.
:::

## Check yourself

::: check
Give the five steps of the recovery sequence, and say which one carries most of the partial credit.
:::

::: answer
1. Mark the gap in one clause, without apology.
2. Name the object correctly.
3. State the anchor you are reasoning from.
4. Reason forward, marking each assumption as you use it.
5. State your confidence and the check you would run.

Step two — naming the object — carries most of the partial credit. "That is a Rayleigh quotient, so the answer is an extreme eigenvalue" or "that is the Joseph form" proves you have met the thing, gives the interviewer somewhere to help from, and usually supplies the structure the rebuild needs.
:::

::: check
You cannot remember whether the Kalman gain is $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$ or $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{R})^{-1}$. Settle it in two ways without recalling the derivation.
:::

::: answer
**First, by sweeping $\mathbf{R}$.** Take the simplest case: one state, measured directly, so $H = 1$ and the gain is $P/(P + R)$ or $P/(P - R)$. As the sensor gets noisier, the gain must shrink smoothly from $1$ toward $0$ — a noisier measurement should move the estimate less, and never the wrong way. With $P = 1$, the plus version gives $0.67$ at $R = 0.5$, $0.5$ at $R = 1$, and $0.33$ at $R = 2$. The minus version gives $2$ at $R = 0.5$, blows up to infinity at $R = 1$, and is $-1$ at $R = 2$ — a negative gain, which pushes the estimate *away* from the measurement. Only the plus sign behaves. (Note that $\mathbf{R}\to\infty$ alone does not settle this one: both versions go to zero there, one from above and one from below.)

**Second, by positive-definiteness.** The bracket is the covariance of the innovation, so it must be positive semi-definite for every $\mathbf{P}^-$ and $\mathbf{R}$. A sum of two positive semi-definite matrices always is. A difference of two need not be, and a filter that might be asked to invert an indefinite matrix is not a filter anyone flies.

Either argument takes one sentence.
:::

::: check
An interviewer asks about a technique you have truly never met — say, a filter design you have not heard of by name. Write the two or three sentences you would say.
:::

::: answer
"I have not worked with that one, so I will not guess at what it does. What I can tell you is the problem it is presumably solving, if I have placed it correctly: [the family it seems to belong to, and the failure that family addresses]. If that is the right family, I would expect it to trade [cost] for [benefit], which is the trade every member of that family makes. I would want to read the original paper before saying anything stronger."

An honest decline, a structural guess and a next step — a complete answer. It deliberately avoids inventing a mechanism, which the follow-up would find at once.
:::

::: check
Why does one bluffed answer cost more than one declined answer, even when the bluff happens to be partly right?
:::

::: answer
Each answer is evidence of what you know only if your confidence tracks your knowledge. A bluff breaks that link.

After one confident statement turns out to be assembled rather than known, the interviewer must discount the confidence on all the others, including the correct ones — so the cost spreads across the whole round. A clean decline does the opposite: it calibrates them, and makes your other confident statements more believable, not less.
:::

::: check
You are asked how many sigma points a UKF uses for a fifteen-state inertial error filter, and you cannot recall the formula. Rebuild it from what the sigma points are for.
:::

::: answer
The **[[sigma points|sigma-points]]** must reproduce the mean and the covariance of an $n$-dimensional distribution exactly. The covariance has $n$ independent directions. The symmetric construction puts one point out along each direction and one back along it: that is $2n$ points. One more point sits at the mean itself and carries the central weight. So the count is $2n + 1$, which for $n = 15$ is $2 \times 15 + 1 = 31$.

The structure check: the count must grow in step with $n$, not with $n^2$, because what is being matched is a covariance whose square root has $n$ columns — one point per column, per sign.
:::

## Summary

| Item | Content |
| --- | --- |
| The four positions | Recall it, rebuild it, bound it, decline it cleanly |
| Recovery sequence | Mark the gap in one clause; name the object; state the anchor; reason forward marking assumptions; state confidence and a check |
| Three rebuilding levers | Units and dimensions; degrees of freedom and constraints; limiting cases |
| Joseph form, rebuilt | $\mathbf{e}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e}^- - \mathbf{K}\mathbf{v}$ gives $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$ |
| Quantization, bounded | Uniform on a step $q$, variance $q^2/12$; add to $\mathbf{R}$; fails when the signal is too quiet to dither itself |
| Bluffing | Detected by shape, not content; spoils the whole round rather than one question |
| Corrections | Accept, restate in your own words, continue; disagree once, with the reason, calmly |

From here the module is technical. The next lesson starts with the subject that opens more domain rounds than any other: what the three stability margins are, and what each one protects you against.

::: context follow-ups Why interviewers keep asking "and then?"
A single question tells an interviewer little: plenty of people can repeat a definition. A chain of follow-ups — "why?", "what if the noise were correlated?", "how would you know?" — pushes each answer one level deeper until it stops. Where it stops is the useful information. Interviewers are often trained to keep going until the candidate reaches the limit, so hitting a question you cannot answer is expected, not a sign that things are going badly. What they then watch is how you behave at that edge.
:::

::: context four-positions-map Which position am I in?
The four positions form a short decision path. Ask yourself in order: do I remember it? If not, do I have something that generates it? If not, can I at least say what it must be bigger or smaller than? Each "no" moves you one step down. Every one of the four ends in an honest answer; only bluffing leaves the path.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1d6fd1" stroke-width="2">
    <rect x="10" y="10" width="150" height="34" rx="6"/>
    <rect x="10" y="62" width="150" height="34" rx="6"/>
    <rect x="10" y="114" width="150" height="34" rx="6"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="31">Do I remember it?</text>
    <text x="20" y="83">Can I generate it?</text>
    <text x="20" y="135">Can I bound it?</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="160" y1="27" x2="228" y2="27"/><line x1="160" y1="79" x2="228" y2="79"/><line x1="160" y1="131" x2="228" y2="131"/>
    <line x1="85" y1="44" x2="85" y2="58"/><line x1="85" y1="96" x2="85" y2="110"/><line x1="85" y1="148" x2="85" y2="162"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="234,27 226,22 226,32"/><polygon points="234,79 226,74 226,84"/><polygon points="234,131 226,126 226,136"/>
    <polygon points="85,62 80,54 90,54"/><polygon points="85,114 80,106 90,106"/><polygon points="85,166 80,158 90,158"/>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="178" y="21">yes</text><text x="178" y="73">yes</text><text x="178" y="125">yes</text>
    <text x="92" y="55">no</text><text x="92" y="107">no</text><text x="92" y="159">no</text>
  </g>
  <g font-size="12" fill="#1d6fd1" font-weight="700">
    <text x="240" y="31">Recall it</text><text x="240" y="83">Rebuild it</text><text x="240" y="135">Bound it</text>
  </g>
  <text x="20" y="184" font-size="12" fill="#1d6fd1" font-weight="700">Decline it cleanly</text>
  <text x="200" y="184" font-size="11" fill="#b4232c">bluffing: off the map</text>
</svg>
```
:::

::: context joseph-form A name worth carrying
The long, safe covariance update is usually called the **Joseph form**, after Peter Joseph, a researcher in early Kalman filtering. Flight code often uses it even when the gain is optimal, because the short form $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-$ subtracts two nearly equal numbers, and computers that round every number can then produce a covariance with a slightly negative variance — which is physically impossible and can make a filter fall apart. Lesson 6 writes the full linear Kalman filter, where both forms appear.
:::

::: context rayleigh-quotient Where the Rayleigh quotient shows up next
For a symmetric matrix $\mathbf{K}$ and a vector $\mathbf{q}$, the **Rayleigh quotient** is $\mathbf{q}^{\mathsf{T}}\mathbf{K}\mathbf{q} / \mathbf{q}^{\mathsf{T}}\mathbf{q}$. Its largest possible value is the matrix's largest eigenvalue, reached when $\mathbf{q}$ is the matching eigenvector; its smallest is the smallest eigenvalue. So as soon as you spot one, you know the answer is an extreme eigenvalue. This is exactly the trick behind Davenport's q-method for attitude, where the best attitude quaternion maximizes such a quotient. Lesson 10 works it out.
:::

::: context gauss-markov A noise with a memory
A **first-order Gauss–Markov process** is a random signal that drifts but is pulled back toward zero, like a dog on a long elastic leash wandering around its owner. It has two numbers: a **correlation time**, roughly how long it remembers where it has been, and a **steady-state variance**, how far it typically strays. Gyro and accelerometer biases are often modeled this way, because they wander slowly instead of jumping around like white noise. Lesson 12 uses it for bias states in an inertial filter.
:::

::: context dof-count Counting what can vary
Point a flashlight at a star. Knowing the beam hits the star fixes two of your three rotation angles, but you can still roll around the beam without the spot moving. That is why one direction measurement gives two constraints on attitude, and why you need a second, non-parallel direction to pin down the roll. A quaternion uses four numbers but must have length one, so $4 - 1 = 3$ — the same three degrees of freedom. That leftover constraint is why lesson 11's error state has three entries, not four.
:::

::: context outer-product Outer product, in plain words
For a column of numbers $\mathbf{e}$, the **outer product** $\mathbf{e}\mathbf{e}^{\mathsf{T}}$ is a square table made by multiplying every entry by every other entry. For two entries $e_1, e_2$ it is a $2 \times 2$ table with $e_1^2$ and $e_2^2$ on the diagonal and $e_1 e_2$ in both corners. Average that table over many trials and you get the covariance: the diagonal holds each error's variance, and the corners say whether the two errors tend to move together.
:::

::: context psd Positive semi-definite
A matrix $\mathbf{P}$ is **positive semi-definite** when $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} \ge 0$ for every vector $\mathbf{a}$. For a covariance, $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a}$ is the variance of the combination $\mathbf{a}^{\mathsf{T}}\mathbf{e}$, and a variance — an average of squares — can never be negative. Each Joseph term has the shape $\mathbf{A}\mathbf{M}\mathbf{A}^{\mathsf{T}}$ with $\mathbf{M}$ a covariance, and $\mathbf{a}^{\mathsf{T}}\mathbf{A}\mathbf{M}\mathbf{A}^{\mathsf{T}}\mathbf{a} = \mathbf{b}^{\mathsf{T}}\mathbf{M}\mathbf{b} \ge 0$ with $\mathbf{b} = \mathbf{A}^{\mathsf{T}}\mathbf{a}$. So the sum stays safe no matter how the numbers round.
:::

::: context quantization-staircase The staircase
A converter can only output whole steps. As the true signal rises smoothly, the output climbs a staircase, and the error — the gap between the two — saws back and forth, never more than half a step either way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="350" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="150" x2="30" y2="10" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="150" x2="330" y2="30" stroke="#8fb8f0" stroke-width="2.5"/>
  <polyline points="30,150 60,150 60,126 120,126 120,102 180,102 180,78 240,78 240,54 300,54 300,30 330,30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g font-size="11" fill="#1f2a44">
    <text x="200" y="120">true signal</text>
    <text x="125" y="142">converter output</text>
    <text x="336" y="165" text-anchor="end">time</text>
  </g>
  <line x1="318" y1="54" x2="318" y2="30" stroke="#b4232c" stroke-width="2"/>
  <text x="252" y="22" font-size="11" fill="#b4232c">one step q</text>
  <text x="40" y="22" font-size="11" fill="#6c7a93">error stays within ±q/2</text>
</svg>
```

The true line rises one step every 60 units of time, and each step of the output is centered on it, so the gap never exceeds half a step.
:::

::: context uniform-variance Why the variance is q squared over 12
Let the error $e$ be equally likely anywhere from $-q/2$ to $+q/2$. Its average is zero, so its variance is the average of $e^2$:
$$\sigma^2 = \frac{1}{q}\int_{-q/2}^{q/2} e^2\,de = \frac{1}{q}\cdot\frac{2}{3}\left(\frac{q}{2}\right)^3 = \frac{q^2}{12}.$$
The standard deviation is $q/\sqrt{12} \approx 0.289\,q$ — a bit over a quarter of a step, which makes sense, since the error is never more than half a step and is often much less.
:::

::: context dithering Adding noise on purpose
**Dithering** means adding a small random signal, about a step or so in size, before the converter rounds. It sounds backward, but it works. Without it, a steady signal sitting between two levels always rounds the same way, leaving a fixed error the filter cannot average away. With dither, the output hops between the neighboring levels in proportion to where the true value sits, so averaging many samples recovers the value between the steps. The rounding error becomes the white noise the filter model assumes.
:::

::: context sigma-points Sigma points in two dimensions
For $n = 2$, the rule gives $2 \times 2 + 1 = 5$ points: one at the mean, and a pair along each of the two main directions of the uncertainty ellipse, one out and one back. Lesson 8 shows how they are pushed through a nonlinear function and averaged.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="85" rx="110" ry="55" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <line x1="70" y1="85" x2="290" y2="85" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="30" x2="180" y2="140" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="180" cy="85" r="6" fill="#b4232c"/>
  <g fill="#1d6fd1">
    <circle cx="90" cy="85" r="6"/><circle cx="270" cy="85" r="6"/>
    <circle cx="180" cy="40" r="6"/><circle cx="180" cy="130" r="6"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="190" y="101">mean</text>
    <text x="296" y="80">+ axis 1</text>
    <text x="66" y="80" text-anchor="end">− axis 1</text>
    <text x="190" y="36">+ axis 2</text>
    <text x="190" y="150">− axis 2</text>
  </g>
</svg>
```
:::
