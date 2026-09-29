---
id: l04-the-kalman-gain-as-a-trust-ratio
title: The Kalman gain as a trust ratio between prediction and measurement
minutes: 23
covers:
  - The Kalman gain as a trust ratio between prediction and measurement
---

You are walking across a dark field toward a friend. You cannot see much, so you count your steps: forty steps at about a meter each, so you must be about forty meters out. That is a **prediction** — a guess built from what you know about how you move. Then your friend shouts "you're at forty-five!" That is a **measurement**. Now you hold two answers. Which do you believe?

Almost nobody picks one and throws the other away. If your friend is standing right next to a marker post, you mostly believe the shout. If your friend is far away and guessing too, you mostly believe your own step count. You end up somewhere in between, and *where* in between depends on how much you trust each one. That "how far do I move toward the new information" number has a name in a Kalman filter. It is the **Kalman gain**, written $\mathbf{K}$: the fraction of the way the filter moves its estimate from the prediction toward the measurement.

You already know the formula from the three-derivations lesson:

$$
\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}.
$$

Reciting it is not the same as having a feel for it. An interviewer who hands you a printout of gains and asks "what is this filter thinking?" is checking for that feel. So is a real filter at 2 a.m., when the landing booster's **[[telemetry|telemetry]]** looks wrong and the gain matrix is the only clue on the screen. This lesson builds the feel by reading $\mathbf{K}$ as a **ratio**: how unsure the filter was about its own prediction, compared with the total disagreement it expected once the measurement arrived.

The one-number case makes the ratio literal. The full matrix case bends it in one specific, learnable way: trust is not spent evenly across states that are linked to each other. And it breaks the "a gain is always between zero and one" feeling in a way worth seeing before it surprises you in someone else's code.

## The trust ratio in one dimension

Start with a single number to estimate, like altitude. Two quantities matter.

- $P^-$, read "P minus", is the **[[variance|variance]]** of the prediction: how unsure the filter is about its own guess *before* the measurement. Variance is the square of the standard deviation $\sigma$ ("sigma"), so a guess good to about $5\,\mathrm{m}$ has $P^- = 25\,\mathrm{m^2}$.
- $R$ is the variance of the sensor's noise: how unsure you are about each reading.

With one state measured directly, $\mathbf{H}$ is the number $1$ and the gain formula shrinks to

$$
K = \frac{P^-}{P^- + R}.
$$

The update then moves the estimate a fraction $K$ of the way from the prediction $\hat{x}^-$ ("x hat minus") to the reading $z$:

$$
\hat{x}^+ = \hat{x}^- + K\,(z - \hat{x}^-).
$$

Now do one small piece of algebra. Divide the top and the bottom of $K$ by $R$. Nothing changes, because you divided both by the same number:

$$
K = \frac{P^-/R}{P^-/R + R/R} = \frac{P^-/R}{P^-/R + 1}.
$$

Call the ratio on top $\rho = P^-/R$ (read "rho"). It is the **trust ratio**: how big the prediction's uncertainty is compared with the measurement's. Then

$$
K = \frac{\rho}{1 + \rho}.
$$

This is worth sitting with. $K$ depends on $\rho$ alone — not on $P^-$ and $R$ separately, only on their ratio. Walk through the three landmarks:

- **$\rho$ close to $0$.** A confident prediction against a noisy sensor. The top is tiny, so $K$ is close to $0$, and the update barely moves the estimate.
- **$\rho$ very large.** A vague prediction against a sharp sensor. The top and the bottom are nearly equal, so $K$ is close to $1$, and the update all but replaces the prediction with the reading.
- **$\rho = 1$.** Prediction and sensor equally unsure. Then $K = 1/2$ exactly, and the estimate lands halfway — whether that shared uncertainty is large or small.

::: key The Kalman gain as a trust ratio
$\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$. Large $\mathbf{P}$ or small $\mathbf{R}$ means trust the measurement; small $\mathbf{P}$ or large $\mathbf{R}$ means trust the prediction. In the scalar case $K = P^-/(P^- + R) = \rho/(1+\rho)$ with $\rho = P^-/R$.
:::

The curve $K = \rho/(1+\rho)$ has two properties you will use again. First, it always rises: more relative doubt in the prediction always means a bigger gain. Second, it is balanced around $\rho = 1$. Flip the ratio, and the gain flips around one half:

$$
K(1/\rho) = 1 - K(\rho).
$$

So $\rho = 100$ gives $K \approx 0.990$, and $\rho = 0.01$ gives $K \approx 0.010$. The two are mirror images through $0.5$.

::: note Why it has to be true
**The mirror rule.** Put $1/\rho$ into the formula and multiply the top and bottom by $\rho$:

$$
K(1/\rho) = \frac{1/\rho}{1 + 1/\rho} = \frac{1}{\rho + 1} = 1 - \frac{\rho}{1+\rho} = 1 - K(\rho).
$$

**The curve always rises, fastest near zero.** Write $K = 1 - \frac{1}{1+\rho}$. As $\rho$ grows, $\frac{1}{1+\rho}$ shrinks, so $K$ grows. Its slope is

$$
\frac{dK}{d\rho} = \frac{1}{(1+\rho)^2},
$$

which is positive everywhere, equals $1$ at $\rho = 0$, equals $1/4$ at $\rho = 1$, and is only about $10^{-4}$ at $\rho = 100$. So the gain is most sensitive to a change in trust when $\rho$ is small, still responds noticeably near $\rho = 1$, and has nearly stopped moving once $\rho$ is large: it is already close to $1$ and has nowhere left to go.
:::

::: example The ratio, not the size, decides the gain
Work out $K = P^-/(P^- + R)$ for five pairs. The last pair uses the running example's starting position variance of $25\,\mathrm{m^2}$, matched with a sensor that is equally unsure.

| $P^-$ | $R$ | $\rho = P^-/R$ | $K$ |
| --- | --- | --- | --- |
| $1$ | $1$ | $1$ | $0.500$ |
| $1$ | $100$ | $0.01$ | $0.0099$ |
| $100$ | $1$ | $100$ | $0.9901$ |
| $100$ | $100$ | $1$ | $0.500$ |
| $25$ | $25$ | $1$ | $0.500$ |

Row two, step by step: $\rho = 1/100 = 0.01$, then $K = 0.01/1.01 \approx 0.0099$. Row three: $\rho = 100$, so $K = 100/101 \approx 0.9901$.

Now look at rows one, four and five. All three have $\rho = 1$, and all three give $K = 0.500$ — whether the shared variance is $1\,\mathrm{m^2}$ or $100\,\mathrm{m^2}$. A filter with superb sensors and a superb model, and a filter with poor sensors and a poor model, can carry the very same gain.

**Sense check.** The gain reports *relative* confidence, never absolute accuracy. Reading $K = 0.5$ off a telemetry stream tells you the two sources were trusted equally. It tells you nothing about how good either one was, unless you also know $P^-$ or $R$ on its own.
:::

::: example Two sensors on the same prediction
A prediction says the altitude is uncertain by $\sigma = 5\,\mathrm{m}$, so $P^- = 25\,\mathrm{m^2}$. Compare two sensors.

- A **[[differential GPS|dgps]]** altitude fix, good to $\sigma = 2\,\mathrm{cm}$. Its variance is $R = (0.02)^2 = 4\times10^{-4}\,\mathrm{m^2}$.
- A **[[barometric altimeter|baro]]**, which reads height from air pressure, here good only to $\sigma = 30\,\mathrm{m}$. Its variance is $R = 30^2 = 900\,\mathrm{m^2}$.

**Trust ratios.** Divide the prediction's variance by each sensor's:

$$
\rho_{\mathrm{DGPS}} = \frac{25}{4\times10^{-4}} = 62{,}500, \qquad
\rho_{\mathrm{baro}} = \frac{25}{900} \approx 0.0278.
$$

**DGPS gain.** $K = 62{,}500/62{,}501 \approx 0.999984$. The update all but throws away the prediction and adopts the reading. The new variance is $P^+ = (1-K)P^- \approx 4.00\times10^{-4}\,\mathrm{m^2}$ — the sensor's own variance. Nothing of the prediction was worth keeping.

**Barometer gain.** $K = 0.0278/1.0278 \approx 0.0270$. The update moves the estimate only $2.7\%$ of the way toward the reading. The new variance is $P^+ = (1 - 0.0270) \times 25 \approx 24.32\,\mathrm{m^2}$, so $\sigma^+ = \sqrt{24.32} \approx 4.93\,\mathrm{m}$ — barely better than the $5\,\mathrm{m}$ you started with.

**Sense check.** Same prediction, same update equations, yet the two gains differ by a factor of about $37$, and the two trust ratios by a factor of more than two million. The gain can never pass $1$, so once $\rho$ is huge it saturates. The barometer is not telling the filter much it did not already believe, and the gain says so.
:::

::: warning The gain is not the accuracy
It is tempting to read a high gain as "the filter is doing well" or a low gain as "the filter is sure of itself, so it must be right". Neither follows. The gain only compares two uncertainties. To judge accuracy you need $P^+$ itself — and, as later lessons show, you need to check that $P^+$ is honest.
:::

## The general gain: two jobs in one formula

With many states and many sensors, $\mathbf{K}$ is a **matrix** — a grid of numbers. The formula does two separate jobs, and it helps to pull them apart. Read $\mathbf{H}^{\mathsf{T}}$ as "H transpose": $\mathbf{H}$ flipped over its diagonal, so rows become columns. $\mathbf{H}$ is the matrix that picks out what the sensor sees.

**Job one: find the overlap.** The product $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ is the **[[cross-covariance|cross-covariance]]** between the error in the *whole state* and the error in the *predicted measurement*. In plain words: for each state, how much does an error in that state show up in what the sensor would read? A state the sensor cannot see, and that is not linked to anything the sensor sees, has zero overlap.

**Job two: divide by the total disagreement.** The **innovation covariance**

$$
\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}
$$

is how big you expect the gap between reading and prediction to be. It has two parts: the prediction's uncertainty as seen through the sensor, $\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$, plus the sensor's own noise, $\mathbf{R}$. Multiplying by $\mathbf{S}^{-1}$ is the matrix version of dividing by it.

Put together, $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$ is the trust ratio grown up: overlap with the measurement, divided by the total disagreement that measurement can produce. With one state, the overlap is $P^-$ and the total is $P^- + R$, and you are back at $K = P^-/(P^- + R)$.

### The same gain, read from the other end

There is a second way to write the gain, from a check-yourself answer in the three-derivations lesson:

$$
\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}.
$$

Read it right to left. $\mathbf{R}^{-1}$ is the sensor's **precision** — the inverse of its variance, so a sharper sensor has a bigger precision. $\mathbf{H}^{\mathsf{T}}$ carries that precision back from "what the sensor sees" into the full state. Then $\mathbf{P}^+$, the uncertainty that is *still left after* the update, scales it.

So a gain is large only when two things are true at once: the new information is precise, *and* the state is still genuinely uncertain in the directions that information touches. Point a superb sensor at a state the filter already knows cold, and the gain is small anyway, because $\mathbf{P}^+$ in that direction is already small. It is the same content as $\rho/(1+\rho)$, seen through the uncertainty *after* the update instead of before.

::: note Why it has to be true
Start from the definition $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$ and multiply both sides on the right by $\mathbf{S}$. That gives $\mathbf{P}^-\mathbf{H}^{\mathsf{T}} = \mathbf{K}\mathbf{S}$. Now take the update $\mathbf{P}^+ = \mathbf{P}^- - \mathbf{K}\mathbf{H}\mathbf{P}^-$, multiply on the right by $\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$, and swap in $\mathbf{K}\mathbf{S}$ wherever $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ appears:

$$
\mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}
= \big(\mathbf{K}\mathbf{S} - \mathbf{K}\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\big)\mathbf{R}^{-1}
= \mathbf{K}\big(\mathbf{S} - \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\big)\mathbf{R}^{-1}
= \mathbf{K}\,\mathbf{R}\,\mathbf{R}^{-1} = \mathbf{K}.
$$

The middle step used $\mathbf{S} - \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} = \mathbf{R}$, which is the definition of $\mathbf{S}$ read backwards.
:::

## Trust is not spent evenly across linked states

In one dimension there is a single dial between "believe the model" and "believe the sensor". A state with several parts has one dial per direction, and a **correlated** $\mathbf{P}^-$ — one with nonzero numbers off its diagonal — links the dials together. Correlated means "an error in one tends to come with an error in the other".

Go back to the eight-step altitude filter of the last lesson. The state is position and velocity; the altimeter measures position only. It starts from an uncorrelated $\mathbf{P}_0^+ = \operatorname{diag}(100, 25)$ ("diag" means a matrix with these numbers on the diagonal and zeros elsewhere).

- At step $k = 1$ the gain was $\mathbf{K}_1 = (0.962,\ 0.0240)^{\mathsf{T}}$: heavy trust in the position correction, almost none in velocity. One predict step had barely begun to link the two.
- By $k = 2$ the velocity gain had grown to $0.320$.
- By $k = 4$ it was $0.721$ — twice the position gain at that same step, $0.357$.

Nothing changed about how the altimeter measures position. What changed is how strongly the filter's own model links a position surprise to a velocity correction. That link lives in the position–velocity covariance, which grows a little with every predict step: if you are wrong about speed, you drift wrong about position, and the model knows it. Trust in a state you never measure is borrowed entirely from its correlation with one you do. And that correlation is something the filter learns as it runs, not a fixed property of $\mathbf{H}$.

::: example When a gain entry is bigger than one
"Between zero and one" is a one-number habit, not a law. Take a position–velocity state with

$$
\mathbf{P}^- = \begin{pmatrix}1.0 & 1.5\\ 1.5 & 3.0\end{pmatrix},
$$

which is a proper covariance: its **[[eigenvalues|eigenvalues]]**, about $0.197$ and $3.803$, are both positive. The sensor measures position only, $\mathbf{H} = (1\ \ 0)$, and is precise: $R = 0.01$.

**Step 1: the total disagreement.** $\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ picks the top-left entry, $1.0$. So $S = 1.0 + 0.01 = 1.01$.

**Step 2: the overlap.** $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ picks the first column, $(1.0,\ 1.5)^{\mathsf{T}}$.

**Step 3: divide.**

$$
\mathbf{K} = \frac{1}{1.01}\begin{pmatrix}1.0\\ 1.5\end{pmatrix} = \begin{pmatrix}0.9901\\ 1.4851\end{pmatrix}.
$$

The velocity gain is $1.485$. A one-meter surprise in position moves the velocity estimate by $1.485\,\mathrm{m/s}$ — more than the surprise itself.

**Step 4: is anything broken?** Compute $\mathbf{P}^+ = (\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-$:

$$
\mathbf{P}^+ = \begin{pmatrix}0.00990 & 0.01485\\ 0.01485 & 0.77228\end{pmatrix},
$$

with eigenvalues about $0.0096$ and $0.773$, both positive. Uncertainty fell in every direction, as the last lesson proved it must.

**Sense check.** The unmeasured state is more uncertain to begin with ($3$ against $1$), and it is strongly linked to the measured one. Its **correlation coefficient** is $1.5/\sqrt{1.0 \times 3.0} \approx 0.87$, on a scale where $1$ would be a perfect link. So a position surprise counts as strong evidence about velocity — strong enough to move velocity by more than the raw gap. The trust-ratio picture still holds in spirit: more correlation and more relative doubt both raise the gain. But here the "ratio" is a matrix acting on a vector, not a number stuck between $0$ and $1$.
:::

::: warning Do not read one gain entry as a probability
Because the one-number gain lives between $0$ and $1$, it is tempting to expect every entry of a gain matrix to do the same, and to read an entry near $1$ as "full trust" and one near $0$ as "no trust". Only a state that is measured directly, and not correlated with anything else, behaves that neatly. A correlated, unmeasured state can carry a gain entry above $1$ — or below $0$, because a negative correlation flips the sign of the correction. Neither is a bug.

What the trust-ratio picture gets right with no exceptions is the *direction of change*. Shrinking $\mathbf{R}$, or growing $\mathbf{P}^-$ in a direction the sensor can see, can only push the gain toward trusting the measurement more, never less.
:::

## The two ways trust goes wrong

Every gain lives between two extremes, and each extreme has a failure attached. The **[[divergence lesson|divergence-bridge]]** later in the module studies them in depth; here is their shape.

- **Gain stuck near zero for a bad reason.** The prediction is more confident than it has earned — its $P^-$ shrank without the real accuracy to back it. The filter has stopped listening. No measurement, however good, can fix an estimate the filter refuses to move.
- **Gain stuck near one on a sensor you do not really understand.** If $R$ is set too small for a noisy sensor, the filter chases every wobble in the readings instead of smoothing them out. It trades a steady estimate for a jumpy one.

Both show up in the same place. Watch $\mathbf{K}$, not only the estimate. A filter that has quietly stopped trusting its measurements announces itself in the gain long before its output looks wrong to the eye.

## Check yourself

::: check
Two one-number filters report the same gain, $K = 0.9$. Filter A has $P^- = 9$ and $R = 1$. Filter B has $P^- = 900$ and $R = 100$. Are they equally accurate?
:::

::: answer
Not necessarily, and the gain alone cannot tell you. Both have $\rho = 9$ ($9/1$ and $900/100$), so both give $K = 9/10 = 0.9$: the gain depends only on the ratio.

Now compute what is left after the update. Filter A: $P^+ = (1 - 0.9) \times 9 = 0.9$. Filter B: $P^+ = (1 - 0.9) \times 900 = 90$, a hundred times larger. Filter A is far more accurate, even though it reports the identical gain. Filter B started from, and ends with, an uncertainty that is the same *in proportion* but much bigger in absolute terms. To judge accuracy you need $P^+$ itself, not the gain that produced it.
:::

::: check
For the matrix gain $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$, suppose $\mathbf{H}$ picks out one state, and $\mathbf{P}^-$ is exactly diagonal, so the measured state is uncorrelated with every other state. What happens to $\mathbf{K}$, in words?
:::

::: answer
With a diagonal $\mathbf{P}^-$, the product $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ has a single nonzero entry: the one in the row of the measured state. Here $\mathbf{S}$ is a single positive number, so multiplying by $\mathbf{S}^{-1}$ cannot create a nonzero entry where there was none. Every other row of $\mathbf{K}$ is exactly zero.

So the update corrects only the measured state, by the ordinary one-number trust ratio for that state's own $P^-_{ii}$ and $R$. Every other state's estimate and variance are left untouched at this step. No trust is extended to anything unmeasured, because nothing links it to what was measured. This is almost the situation at $k = 1$ of the running altitude example, before one predict step had built up any correlation.
:::

::: check
A filter's gain for one state has been essentially zero for the last hundred cycles, and that state's reported uncertainty has also been essentially zero the whole time. Give two different explanations that fit these facts: one harmless and one worrying.
:::

::: answer
**Harmless:** the state really is that well known. Think of a slowly varying sensor bias that was pinned down early by plenty of consistent measurements. Its $P^-$ has honestly fallen so far that even a precise sensor changes little.

**Worrying:** the covariance collapsed for a reason that has nothing to do with real accuracy. A process-noise entry was left at zero or set too small, a numerical underflow went unnoticed, or the measurements happened by chance to agree with a wrong prediction for a while. Now $P^-$ is artificially tiny, the trust ratio $\rho = P^-/R$ sits near zero, and new evidence is thrown away whatever it says.

The two cases look identical in the gain and the covariance. Telling them apart needs the innovation itself — the gap between reading and prediction. The consistency-testing lesson later in this module turns that into a formal test instead of a guess.
:::

::: check
Using $\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$, explain why a state the filter already knows extremely well earns almost no gain from a new measurement of it, even a very precise one.
:::

::: answer
$\mathbf{P}^+$ is the uncertainty left *after* the very update whose gain you are computing. A state already pinned down has a small $\mathbf{P}^+$ whatever the incoming sensor is like. A small $\mathbf{P}^+$ times even a large precision $\mathbf{R}^{-1}$ can still give a small product.

In one dimension you can check it exactly. The formula says $K = P^+/R = (1-K)P^-/R$. Multiply both sides by $R$ to get $KR = P^- - KP^-$, then collect the $K$ terms: $K(R + P^-) = P^-$, so $K = P^-/(P^- + R)$ — the familiar gain. With a tiny $P^-$, $K$ is tiny no matter how small $R$ also is, because there is very little left for even a perfect sensor to correct. Precision in the sensor cannot create uncertainty in the state that is not already there.
:::

::: check
Describe how $K = \rho/(1+\rho)$ behaves as $\rho$ runs from $0.01$ to $100$, without recomputing the table. Where does $K$ change fastest as $\rho$ changes?
:::

::: answer
$K$ rises steadily from near $0$ to near $1$, passing through exactly $0.5$ at $\rho = 1$. It obeys the mirror rule $K(\rho) = 1 - K(1/\rho)$: the table's $\rho = 100$ row gives $K = 0.9901$ and its $\rho = 0.01$ row gives $K = 0.0099$, reflections of each other through $0.5$.

The slope is $dK/d\rho = 1/(1+\rho)^2$. It is largest at $\rho = 0$ (slope $1$) and falls off as $\rho$ grows. So $K$ is most sensitive to changes in $\rho$ when $\rho$ is small. Near $\rho = 1$ (slope $1/4$) a modest change in relative trust still moves $K$ noticeably. Out at $\rho = 100$ the gain has saturated near $1$, and even a further tenfold change in $\rho$ moves it by less than one percent.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Scalar trust ratio | $\rho = P^-/R$ and $K = \rho/(1+\rho)$ — depends only on the ratio, not the absolute size |
| Shape of the curve | always rising; $K = 1/2$ at $\rho = 1$; mirror rule $K(1/\rho) = 1 - K(\rho)$; slope $1/(1+\rho)^2$ |
| Matrix gain | $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$: overlap with the measurement, divided by the total disagreement $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ |
| Other form | $\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$ — uncertainty left over times sensor precision |
| Correlation carries trust | an unmeasured but correlated state earns a nonzero gain; the correlation grows with each predict step |
| Bounds | scalar $K$ is always between $0$ and $1$; an entry of a matrix gain can exceed $1$ or be negative, and $\mathbf{P}^+$ still stays positive definite |
| Two failures | gain stuck low without reason: the filter stops listening; gain stuck high on a badly understood sensor: the filter chases noise |

Both ingredients of the matrix gain, $\mathbf{P}^-$ and $\mathbf{S}$, come from a recursion running in the background: the covariance grows at every predict step and shrinks at every update. The next lesson writes that recursion down on its own, as the discrete Riccati equation, and finds that it never needs a single measurement value to run.

::: context telemetry Data sent home from a moving vehicle
**Telemetry** is the stream of numbers a vehicle radios back while it flies: temperatures, pressures, positions — and, for a navigation filter, its estimate, its covariance and often its gain. The word is Greek for "measuring from afar". Engineers on the ground cannot open the flight computer, so telemetry is all they see. That is why this lesson cares about reading a gain: on a bad night, the gain printed in the telemetry may be the first sign of trouble.
:::

::: context variance Variance and standard deviation
If you measure the same thing many times, the readings scatter. The **standard deviation** $\sigma$ is the typical size of that scatter, in the same units as the reading — meters, say. The **variance** is $\sigma^2$, in meters squared. Filters carry variances because they add up neatly: independent errors add their variances, not their standard deviations. To get back to something you can picture, take the square root: $P = 25\,\mathrm{m^2}$ means "good to about $5\,\mathrm{m}$".
:::

::: context dgps How GPS gets down to centimeters
Plain GPS is good to a few meters, because the signals are bent a little by the upper atmosphere and the satellites' clocks and orbits are not perfectly known. **Differential GPS** puts a second receiver at a surveyed spot nearby. It sees nearly the same errors, so it can broadcast corrections. The best versions track the radio wave's phase, not only its timing code, and reach about a centimeter. Test ranges use such systems as a "truth" source when judging other navigation sensors.
:::

::: context baro Reading height from air pressure
Air pressure falls as you climb — near the ground, by roughly one percent for every $80\,\mathrm{m}$. A barometric altimeter measures the pressure through a small hole in the skin, the **static port**, and turns it into height. It is cheap and never goes dark, but it is easily fooled: weather changes the pressure at the ground, and at high speed the air rushing past the port changes the reading. Near the speed of sound, shock waves sweeping over the skin can throw it off badly. That is why a filter may give such a sensor a large $R$.
:::

::: context cross-covariance How much two errors move together
A **covariance** measures whether two errors tend to move together. Positive: when one is too high, the other tends to be too high too. Negative: when one is high, the other tends to be low. Zero: knowing one tells you nothing about the other. The cross-covariance $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ lists this for every state against the predicted reading. That is exactly what the filter needs: a state whose error moves with the reading's error can be corrected by the reading.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="20" y1="120" x2="110" y2="120"/><line x1="20" y1="120" x2="20" y2="30"/>
    <line x1="135" y1="120" x2="225" y2="120"/><line x1="135" y1="120" x2="135" y2="30"/>
    <line x1="250" y1="120" x2="340" y2="120"/><line x1="250" y1="120" x2="250" y2="30"/>
  </g>
  <ellipse cx="65" cy="75" rx="38" ry="10" transform="rotate(-45 65 75)" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <ellipse cx="180" cy="75" rx="38" ry="10" transform="rotate(45 180 75)" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <circle cx="295" cy="75" r="25" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="65" y="140">positive</text><text x="180" y="140">negative</text><text x="295" y="140">zero</text>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="24" y="26">error B</text><text x="84" y="114">error A</text>
  </g>
</svg>
```

Each patch shows where pairs of errors usually land. A tilted patch means the two errors are linked; a round one means they are not.
:::

::: context eigenvalues A quick test for a real covariance
An **eigenvalue** of a matrix is a stretch factor along one special direction. For a covariance matrix, the eigenvalues are the variances along the directions where the errors are *not* linked — the long and short axes of its uncertainty ellipse. A variance can never be negative, so a real covariance must have every eigenvalue positive (or zero). That makes eigenvalues a handy health check. If a filter's $\mathbf{P}$ ever shows a negative eigenvalue, something has gone numerically wrong — a problem the numerically-stable-forms lesson later in this module is all about.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="105" x2="300" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="18" x2="180" y2="192" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="180" cy="105" rx="78" ry="17.8" transform="rotate(-61.85 180 105)" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="143.2" y1="173.8" x2="216.8" y2="36.2" stroke="#1f2a44" stroke-width="2"/>
  <line x1="164.3" y1="96.6" x2="195.7" y2="113.4" stroke="#b4232c" stroke-width="2.5"/>
  <text x="16" y="34" font-size="11" fill="#1f2a44">long half-axis √3.803 ≈ 1.95</text>
  <text x="16" y="186" font-size="11" fill="#b4232c">short half-axis √0.197 ≈ 0.44</text>
  <text x="296" y="98" font-size="11" fill="#6c7a93" text-anchor="end">position error</text>
  <text x="186" y="24" font-size="11" fill="#6c7a93">velocity error</text>
</svg>
```

The picture is the one-sigma ellipse of the lesson's example, $\mathbf{P}^- = \begin{pmatrix}1.0 & 1.5\\ 1.5 & 3.0\end{pmatrix}$, with both axes drawn to scale (40 pixels per unit).
:::

::: context divergence-bridge Where these two failures come back
The divergence lesson, later in this module, lists five classic ways a Kalman filter goes wrong. The first, underestimated process noise, is the "gain stuck near zero" failure seen from the inside: the covariance shrinks, the gain follows, and the filter stops correcting. The process-noise lesson, two lessons from now, runs that failure on real numbers and watches the reported uncertainty keep falling while the true error grows. The picture below shows the gain curve both failures live on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="160" x2="335" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="50" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="30" x2="330" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="50" y1="95" x2="190" y2="95" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="190" y1="95" x2="190" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,158.7 57.0,158.4 64.0,158.0 71.0,157.5 78.0,156.8 85.0,156.0 92.0,155.0 99.0,153.8 106.0,152.3 113.0,150.4 120.0,148.2 127.0,145.5 134.0,142.2 141.0,138.4 148.0,133.9 155.0,128.8 162.0,123.0 169.0,116.6 176.0,109.7 183.0,102.5 190.0,95.0 197.0,87.5 204.0,80.3 211.0,73.4 218.0,67.0 225.0,61.2 232.0,56.1 239.0,51.6 246.0,47.8 253.0,44.5 260.0,41.8 267.0,39.6 274.0,37.7 281.0,36.2 288.0,35.0 295.0,34.0 302.0,33.2 309.0,32.5 316.0,32.0 323.0,31.6 330.0,31.3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="176">0.01</text><text x="120" y="176">0.1</text><text x="190" y="176">1</text><text x="260" y="176">10</text><text x="330" y="176">100</text>
    <text x="190" y="194">trust ratio ρ = P⁻/R (log scale)</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="164">0</text><text x="44" y="99">0.5</text><text x="44" y="34">1</text>
  </g>
  <text x="58" y="146" font-size="11" fill="#b4232c">stops listening</text>
  <text x="330" y="50" font-size="11" fill="#b4232c" text-anchor="end">chases noise</text>
  <text x="14" y="95" font-size="12" fill="#1d6fd1">K</text>
</svg>
```
:::
