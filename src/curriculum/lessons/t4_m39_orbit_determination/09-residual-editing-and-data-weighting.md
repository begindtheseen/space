---
id: l09-residual-editing-and-data-weighting
title: Residual editing and data weighting
minutes: 24
covers:
  - Residual editing and data weighting
---

Imagine you are baking and checking the oven with a digital thermometer every few minutes. The readings say $180$, $181$, $179$, $180$ degrees — and then, once, $912$. You do not decide the oven is on fire. You decide the thermometer glitched, ignore that one reading, and carry on. But suppose instead the readings go $180$, $183$, $187$, $192$, $198$, climbing steadily after a certain moment. Ignoring the "strange" readings one by one would be a mistake. Something real changed — somebody turned the dial — and the right response is to update your picture of the oven, not to throw away the evidence.

Orbit determination faces exactly this choice, every day. A tracking arc is a few hundred measurements, and a few of them may be simply wrong: a radar locked onto the wrong object, a clock glitch at a station. Throwing those out is called **editing**. But a run of measurements that disagree with the fit can also mean the satellite itself did something the force model does not know about, like firing its thrusters. Mistaking the second for the first is how a **[[flight dynamics|flight-dynamics]]** team turns one bad data point into a genuinely wrong orbit — or edits away the only evidence that a maneuver happened.

This lesson covers the tools for telling the two apart: the normalized residual, the $3\sigma$ edit rule and when it is safe to use, the pattern that marks a missed maneuver, and **weighting**, the gentler alternative to throwing data away.

## The normalized residual

A **residual** is what the measurement said minus what the fit predicted. On its own, its size means little. A $12\,\mathrm m$ residual is huge for a laser that measures to a centimeter and tiny for a radar good to $100\,\mathrm m$. So divide by the measurement's own expected noise $\sigma_i$:

$$
\text{normalized residual} = \frac{r_i}{\sigma_i}.
$$

Read it as "r sub i over sigma sub i". It counts how many standard deviations the residual sits from zero. It has no units, so residuals from different stations and different kinds of measurement can be compared on one scale.

If the fit is right and the noise is **[[Gaussian|gaussian-tails]]** (the familiar bell curve), about two-thirds of normalized residuals fall between $-1$ and $+1$, and only $0.27\%$ fall beyond $\pm3$. That makes $3\sigma$ a natural line: a good measurement lands outside it only about three times in a thousand, while a measurement that is wrong by hundreds of $\sigma$ lands far outside it.

**Residual editing** is the rule built on this: reject any measurement whose normalized residual exceeds a threshold, and refit without it.

::: key Residual editing
Reject measurements whose normalized residual $|r_i/\sigma_i|$ exceeds a threshold (commonly $3\sigma$), but always count and trend the rejections. A rising edit rate is the first symptom of an unmodelled maneuver or a dynamics error.
:::

::: example Reading normalized residuals
A station measures range with noise $\sigma = 5\,\mathrm m$. After a fit, three residuals are $12\,\mathrm m$, $17\,\mathrm m$ and $2004.6\,\mathrm m$. Which does a $3\sigma$ rule keep?

Divide each by $5\,\mathrm m$:

$$
\frac{12}{5} = 2.4, \qquad \frac{17}{5} = 3.4, \qquad \frac{2004.6}{5} \approx 401.
$$

The first is kept: $2.4\sigma$ is a little unusual but not suspicious. The second is edited, since $3.4 > 3$ — even though it may well be a perfectly good measurement having an unlucky moment. The third is not "a bit unusual". It is four hundred standard deviations out, the fingerprint of a measurement that is simply wrong.

**How many good points should a $3\sigma$ rule cut by bad luck alone?** With $111$ range measurements, expect $111 \times 0.0027 \approx 0.3$ of them. So on a clean arc the rule should cut nothing at all, most of the time. If it cuts ten, something is going on.
:::

### Converge first, then edit

A normalized residual only means something once the fit has **converged** — once the iterations of the batch fit have stopped changing the answer. Before that, the residuals are measured against a trajectory that may still be kilometers from the truth. They are enormous everywhere, by construction, and they say nothing yet about which individual points are bad.

::: warning Editing before convergence can destroy a fit that would otherwise work
Switching on a $3\sigma$ edit rule from the very first iteration of a batch fit that started from a rough guess is not a careful choice. It can fail outright. With a starting error of a few kilometers, every first-iteration residual is hundreds or thousands of $\sigma$ from zero (against a few meters of assumed noise). A naive edit rule rejects most or all of the data before the fit has any chance to converge, and with too few points left the normal equations can become singular — impossible to solve. The right order: converge first without editing, *then* edit against residuals that really reflect data quality, then converge again.
:::

## Finding genuinely bad data

::: example Three bad points, found and removed
Use the same three-pass tracking arc as the batch lesson ($111$ epochs, range noise $5\,\mathrm m$). Corrupt three of the $111$ range measurements by $2\,\mathrm{km}$ each — the size of error a **[[data-association|data-association]]** mistake or a station timing glitch can produce.

First converge without editing. The result is usable but contaminated: the epoch position error is $1.9\,\mathrm m$, against $0.5\,\mathrm m$ for the same arc with clean data. Then continue from that converged state with $3\sigma$ editing switched on:

```python
# it 0: used 111/111  RMS range  328.6 m   (the 3 bad points dominate the mean square)
# it 1: used 104/111  RMS range    4.9 m   (7 points cut on the first editing pass, some good ones too)
# it 2: used 108/111  RMS range    5.0 m   (down to exactly the 3 injected bad points)
# it 3: used 108/111  RMS range    5.0 m   (stable)
#
# final edited indices: [10, 55, 95]  <- exactly the three injected
# residuals at those three points, final iteration: [2004.6, 2002.4, 1990.3] m  (~400 sigma)
# final epoch error: 0.47 m position, 1.47 mm/s velocity  -- matches the clean-data fit closely
```

Walk through it.

- **Iteration 0.** Three $2\,\mathrm{km}$ errors among $111$ points give an RMS of about $\sqrt{3\times2000^2/111} \approx 329\,\mathrm m$, which is what the log shows. The three bad points are the whole story.
- **Iteration 1.** The first editing pass over-corrects. It cuts seven points: the three bad ones plus four good ones. Why? The fit was still pulled slightly off by the bad data, so a few good points sat just over the line.
- **Iteration 2.** With the bad points gone, the refit moves closer to the truth, and the four good points drop back under $3\sigma$. They are readmitted. Only the three injected points stay out.
- **Iteration 3.** Nothing changes. The edit set is stable.

**Sanity check.** The RMS settles at $5.0\,\mathrm m$, matching the injected $5\,\mathrm m$ noise, and the final position error of $0.47\,\mathrm m$ matches the clean-data fit. The edited points were wrong by about $400\sigma$, not a borderline handful. Notice too that good points were readmitted: a sound editor re-tests every point at every iteration, rather than banning a point forever the first time it looks odd.
:::

## When the residual pattern means something else

A few points wrong by hundreds of $\sigma$, scattered randomly through the arc, is the signature of bad data. A different pattern means something different. When residuals grow steadily and cluster in the data *after* a particular moment, the data is fine. The **dynamics** — the model of how the satellite moves — is missing something real. Most often it is an unplanned or **[[undocumented maneuver|undocumented-maneuvers]]**.

::: example An unmodelled one-millimeter-per-second maneuver, and what it leaves behind
Inject a tiny velocity change into the truth — $1\,\mathrm{mm/s}$, applied once between the second and third passes. Then fit the whole arc with ordinary two-body-plus-$J_2$ dynamics that know nothing about it. For each pass, count what fraction of range residuals exceed $3\sigma$:

```python
#          N    fraction of range residuals exceeding 3-sigma   RMS range residual
# pass 1  37                     0.0 %                              6.1 m
# pass 2  35                     2.9 %                              7.4 m
# pass 3  39                    41.0 %                             14.5 m   <- after the maneuver
```

Check the percentages against the counts. In pass 2, $2.9\%$ of $35$ is one point ($1/35 \approx 0.029$). In pass 3, $41.0\%$ of $39$ is sixteen points ($16/39 \approx 0.410$).

Nothing before the maneuver looks alarming. Pass 1 is clean, and pass 2 has a single flagged point. Pass 3, entirely after the event, has sixteen of its $39$ points over the line and an RMS almost three times the $5\,\mathrm m$ noise ($14.5/5 = 2.9$). Yet the maneuver was far too small to move the fitted orbit by anything dramatic.

Scale it up and the pattern spreads. At $3\,\mathrm{mm/s}$, every pass-3 point is flagged, and pass 2 starts to suffer too ($51\%$), because the fit bends the whole trajectory trying to reach pass 3. At $10\,\mathrm{mm/s}$, every pass is saturated.

**The lesson.** An edit rate that rises and concentrates in the later part of an arc, rather than scattering evenly through it, is not telling you to edit harder. It is telling you the dynamics model is what needs fixing. Blindly editing away a real maneuver's aftermath, instead of recognizing the pattern and splitting the arc at the event, is the classic mistake.
:::

Why does a velocity change of one millimeter per second — slower than a snail — show up so clearly? Because orbits amplify velocity errors over time. The variational-equations lesson showed that the position-velocity block of $\boldsymbol\Phi$ grows to thousands of seconds within an hour. A velocity error multiplied by thousands of seconds becomes a position error of meters, and it keeps growing the longer you wait.

## Weighting instead of rejecting

Suppose two friends time a race. One uses a proper stopwatch. The other counts "one Mississippi, two Mississippi". Neither is wrong, exactly, but you would trust the stopwatch much more. You would not throw away your friend's count — you would give it less say in the answer.

That is **weighting**. A station whose data is noisier than average, but not wrong, does not belong in the reject pile. It belongs with a smaller weight. The rule is the one the batch lesson built into the normal equations: weight each measurement by the inverse of its noise variance, $\mathbf W_i=\mathbf R_i^{-1}$. For a single measurement that is $w_i = 1/\sigma_i^2$. A measurement twice as noisy gets a quarter of the weight.

::: example Two stations, weighted and unweighted
Two stations measure the same range at the same moment. Station A, a precise modern system, has $\sigma_A = 2\,\mathrm m$ and reads $100.0\,\mathrm m$ (offset from some reference value). Station B, an older radar, has $\sigma_B = 10\,\mathrm m$ and reads $112.0\,\mathrm m$.

**Weights.** $w_A = 1/2^2 = 0.25$ and $w_B = 1/10^2 = 0.01$, in $\mathrm{m^{-2}}$.

**Weighted estimate.** Each reading counts in proportion to its weight:

$$
\hat y = \frac{w_A y_A + w_B y_B}{w_A + w_B} = \frac{0.25\times100.0 + 0.01\times112.0}{0.26} = \frac{26.12}{0.26} \approx 100.46\,\mathrm m.
$$

Its uncertainty is one over the total weight, square-rooted: $\sigma = 1/\sqrt{0.26} \approx 1.96\,\mathrm m$. Slightly better than station A alone, as it should be — station B added a little information.

**Unweighted average.** Treating both alike gives $(100.0 + 112.0)/2 = 106.0\,\mathrm m$, with uncertainty $\sqrt{2^2 + 10^2}/2 = \sqrt{104}/2 \approx 5.10\,\mathrm m$. That is *worse than station A on its own*. Giving the noisy station equal say made the answer less accurate than simply ignoring it.

**Sanity check.** The weighted answer sits close to A, since A carries $0.25/0.26 \approx 96\%$ of the total weight.
:::

In practice, orbit determination applies weights station by station and measurement type by measurement type. A **[[laser ranging|laser-ranging]]** station and a decades-old radar feeding the same arc do not deserve the same trust. Treating them alike lets the noisier source pull the fit far harder than its real information justifies.

::: warning Weighting cannot fix a bias
Down-weighting controls how much a measurement's *random* scatter influences the fit. It does nothing to a *systematic* offset. A station with a consistent $+8\,\mathrm m$ range bias still pulls the fit toward $+8\,\mathrm m$; a smaller weight only means it pulls less hard, not that the offset is corrected. And a biased station's measurements are not independent evidence at all, as the bathroom-scale example of the consider-covariance lesson showed: a whole pass of them carries about as much information about the bias as one measurement does. A suspected bias needs to be solved for or considered — the tools of the batch and consider-covariance lessons. Weighting addresses precision, not accuracy.
:::

## What a flight dynamics team actually watches

Put together, this lesson and the two before it describe most of a routine orbit determination day. Fit the arc. Look at the normalized residuals and the edit rate, not only the final RMS. Then ask two separate questions before trusting the result.

1. **Did the fit converge?** Is the correction from one iteration to the next negligible?
2. **Is the converged fit correct?** Does the post-fit residual RMS match the assumed measurement noise? The cleanest check divides each residual by its $\sigma$ first: the RMS of the normalized residuals, the **[[weighted RMS|weighted-rms]]**, should come out close to $1$. That is the chi-square check from the nonlinear least-squares lesson. A value well above $1$ says the fit is hiding something — bad weights, bad data or unmodelled dynamics.

A fit that converges cleanly to a wrong answer looks, from outside, exactly like one that converged to the right answer — until someone checks the residuals. The tracking-geometry lesson showed that an arc can leave some directions of the state barely constrained. This lesson adds that even a well-observed arc can be quietly corrupted by a handful of bad points or a missed event, and only a careful look at *where* the residuals are bad, not only how big they are, will catch it.

Operations teams add one more habit: comparing **[[overlapping arcs|overlap-arcs]]**. Fit two arcs that share a stretch of time, and compare the two orbits over the shared stretch. Their disagreement is an honest, data-driven measure of the real accuracy, and a check on whether the reported covariance is realistic.

::: key Editing and weighting, in one paragraph
Converge before editing, never the reverse. A scattered handful of points with large normalized residuals, with no pattern in time, is bad data: edit it and converge again. A residual pattern that grows and concentrates after some moment is not bad data. It is the dynamics model missing something real, and the fix is a better force model, a solved-for or considered parameter, or splitting the arc — not a smaller edit threshold. Weight by genuine measurement quality; never use weighting to paper over a systematic bias.
:::

## Check yourself

::: check
Why did the first editing iteration in the bad-data example cut seven points when only three were corrupted, and why did that sort itself out by the second iteration?
:::

::: answer
The state at the start of editing had converged, but on *contaminated* data, so it was still pulled slightly away from the truth by the three bad points. Measured against that not-quite-right trajectory, a few good measurements had normalized residuals just over $3\sigma$. Once those and the three bad points were removed and the fit converged again on cleaner data, the state moved closer to the truth. The borderline good points then fell back under the threshold on the next pass and were readmitted. Only the three points wrong by hundreds of $\sigma$ stayed out — a discrepancy no amount of refitting could explain away.
:::

::: check
A $1\,\mathrm{mm/s}$ maneuver left pass 3 with a $41\%$ edit rate while pass 1 stayed at $0\%$. Explain why such a tiny velocity change has such a visible effect, using the state transition matrix.
:::

::: answer
The position-velocity block of $\boldsymbol\Phi$ carries a multiplier of order $10^3$ to $10^4$ seconds even over an hour. Suppose roughly $14{,}500$ seconds (about four hours) pass between the maneuver and pass 3. A $1\,\mathrm{mm/s}$ velocity error left uncorrected over that time gives a position error of order

$$
1\,\mathrm{mm/s}\times14{,}500\,\mathrm s = 14.5\,\mathrm m.
$$

That is several times the $5\,\mathrm m$ noise the fit assumes, and it grows with elapsed time. So pass 3, the latest after the event, shows the largest effect, while pass 1, entirely before it, shows none.
:::

::: check
A pass of $40$ range measurements with $\sigma = 5\,\mathrm m$ leaves a post-fit RMS of $5.5\,\mathrm m$, and the $3\sigma$ rule flags one point. A second pass leaves an RMS of $15\,\mathrm m$ and flags eleven points, all in the last half of the pass. What does each suggest?
:::

::: answer
**First pass.** The weighted RMS is about $5.5/5 = 1.1$, close to $1$. Chance alone would flag about $40\times0.0027 \approx 0.1$ points, so one flag is a little unlucky or one genuinely bad point — either way, editing it and refitting is fine.

**Second pass.** The weighted RMS is $15/5 = 3$, far above $1$. Eleven flags where chance predicts about $0.1$, all bunched late in the pass, is a pattern in time, not scattered bad data. The dynamics model is probably missing something — possibly a maneuver or a drag change. The right response is to investigate the model (or split the arc), not to edit the eleven points away.
:::

::: check
Why is down-weighting the wrong remedy for a station with a small, consistent range bias, even though the station's data genuinely disagrees with the fit?
:::

::: answer
Weighting only controls how much a measurement's *random* scatter influences the fit relative to other measurements. It does nothing to remove a *systematic* offset: the biased data still pulls the fit in the same direction, just less hard. A smaller weight means less influence, not a corrected bias. A consistent bias needs to be solved for, considered or otherwise modelled directly — the tools of the batch and consider-covariance lessons — because weighting addresses precision, not accuracy.
:::

::: check
An operator sees a rising edit rate concentrated in the most recent third of an arc and responds by loosening the threshold from $3\sigma$ to $5\sigma$, so the fit "uses more data". What is likely to go wrong?
:::

::: answer
If the rising edit rate is the signature of a real, unmodelled event such as a maneuver, loosening the threshold does not fix the problem. It lets more of the maneuver-corrupted data back into a fit whose dynamics still do not include the maneuver. The epoch state is then dragged to a compromise between the before and after trajectories, representing neither correctly. The edit rate was diagnostic information that the dynamics model is wrong. Editing less aggressively treats the symptom as if it were the disease.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $r_i/\sigma_i$ | Normalized residual; only meaningful once the fit has converged |
| $3\sigma$ edit rule | Only $0.27\%$ of good Gaussian data falls beyond it |
| Converge, then edit, then converge again | Editing before convergence can cut most or all of the data and make the fit unsolvable |
| Scattered large-residual points | Genuinely bad data; safe to edit, re-testing every point each iteration |
| Residuals rising after a moment in time | Unmodelled dynamics (often a maneuver), not bad data; fix the model or split the arc |
| $\mathbf W_i=\mathbf R_i^{-1}$, per station and type | Weighting handles precision differences; it cannot correct a systematic bias |
| Weighted RMS $\approx 1$ | Post-fit residuals match the assumed noise; well above $1$ means something is hidden |
| Converged $\ne$ correct | Check *where* residuals disagree, not only *how much* |

Every decision in this lesson judged a fit from residuals and a covariance in plain $(x, y, z)$ components. The next lesson gives that covariance a frame tied to the orbit — radial, in-track, cross-track — in which its shape, and not only its size, finally means something physical.

::: context flight-dynamics The people who keep track of the orbit
The flight dynamics team is the group in mission operations that owns the spacecraft's trajectory. They take in tracking data every day, run orbit determination, predict where the satellite will be, plan maneuvers, and hand pointing predictions to the ground antennas so they know where to look. Residual plots are their daily bread. Much of the judgment in this lesson — is this bad data, or did something real happen? — is exactly the call they make, often under time pressure before the next pass.
:::

::: context gaussian-tails How rare is three sigma?
For bell-curve noise, about $68\%$ of values fall within one standard deviation of the middle, about $95\%$ within two, and about $99.73\%$ within three. So only $0.27\%$ land beyond $\pm3\sigma$ — about one in $370$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="294.0,130 294.0,128.9 297.8,129.2 301.6,129.4 305.4,129.6 309.2,129.7 313.0,129.8 316.8,129.8 320.6,129.9 324.4,129.9 328.2,130.0 332.0,130.0 335.8,130.0 339.6,130.0 343.4,130.0 343.4,130" fill="#b4232c"/>
  <polygon points="66.0,130 66.0,128.9 62.2,129.2 58.4,129.4 54.6,129.6 50.8,129.7 47.0,129.8 43.2,129.8 39.4,129.9 35.6,129.9 31.8,130.0 28.0,130.0 24.2,130.0 20.4,130.0 16.6,130.0 16.6,130" fill="#b4232c"/>
  <polyline points="16.6,130.0 20.4,130.0 24.2,130.0 28.0,130.0 31.8,130.0 35.6,129.9 39.4,129.9 43.2,129.8 47.0,129.8 50.8,129.7 54.6,129.6 58.4,129.4 62.2,129.2 66.0,128.9 69.8,128.5 73.6,128.0 77.4,127.4 81.2,126.6 85.0,125.6 88.8,124.4 92.6,122.9 96.4,121.1 100.2,119.0 104.0,116.5 107.8,113.6 111.6,110.2 115.4,106.4 119.2,102.2 123.0,97.5 126.8,92.5 130.6,87.0 134.4,81.3 138.2,75.4 142.0,69.3 145.8,63.3 149.6,57.4 153.4,51.7 157.2,46.5 161.0,41.8 164.8,37.7 168.6,34.4 172.4,32.0 176.2,30.5 180.0,30.0 183.8,30.5 187.6,32.0 191.4,34.4 195.2,37.7 199.0,41.8 202.8,46.5 206.6,51.7 210.4,57.4 214.2,63.3 218.0,69.3 221.8,75.4 225.6,81.3 229.4,87.0 233.2,92.5 237.0,97.5 240.8,102.2 244.6,106.4 248.4,110.2 252.2,113.6 256.0,116.5 259.8,119.0 263.6,121.1 267.4,122.9 271.2,124.4 275.0,125.6 278.8,126.6 282.6,127.4 286.4,128.0 290.2,128.5 294.0,128.9 297.8,129.2 301.6,129.4 305.4,129.6 309.2,129.7 313.0,129.8 316.8,129.8 320.6,129.9 324.4,129.9 328.2,130.0 332.0,130.0 335.8,130.0 339.6,130.0 343.4,130.0" fill="none" stroke="#1d6fd1" stroke-width="2.2"/>
  <line x1="16.6" y1="130" x2="343.4" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="66.0" y1="130" x2="66.0" y2="135" stroke="#1f2a44"/>
  <text x="66.0" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">−3σ</text>
  <line x1="104.0" y1="130" x2="104.0" y2="135" stroke="#1f2a44"/>
  <text x="104.0" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">−2σ</text>
  <line x1="142.0" y1="130" x2="142.0" y2="135" stroke="#1f2a44"/>
  <text x="142.0" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">−σ</text>
  <line x1="180.0" y1="130" x2="180.0" y2="135" stroke="#1f2a44"/>
  <text x="180.0" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <line x1="218.0" y1="130" x2="218.0" y2="135" stroke="#1f2a44"/>
  <text x="218.0" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">+σ</text>
  <line x1="256.0" y1="130" x2="256.0" y2="135" stroke="#1f2a44"/>
  <text x="256.0" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">+2σ</text>
  <line x1="294.0" y1="130" x2="294.0" y2="135" stroke="#1f2a44"/>
  <text x="294.0" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">+3σ</text>
  <line x1="294.0" y1="130" x2="294.0" y2="40" stroke="#b4232c" stroke-dasharray="4 3"/>
  <line x1="66.0" y1="130" x2="66.0" y2="40" stroke="#b4232c" stroke-dasharray="4 3"/>
  <text x="294.0" y="34" font-size="12" text-anchor="middle" fill="#b4232c">edit line</text>
  <text x="66.0" y="34" font-size="12" text-anchor="middle" fill="#b4232c">edit line</text>
  <text x="180" y="162" font-size="12" text-anchor="middle" fill="#b4232c">only 0.27% of good data falls beyond ±3σ</text>
</svg>
```

The tails beyond the edit lines are so thin they barely show. Real tracking noise often has slightly fatter tails than a perfect bell curve, which is one more reason a single borderline point is not cause for alarm.
:::

::: context data-association Which blip is which?
A radar sees blips; it does not see name tags. **Data association** is the job of deciding which measurement belongs to which object. In a crowded patch of sky — a rocket body, its payload and a few pieces of debris all flying close together after a launch — a measurement can easily be tagged to the wrong object. The result is a point that looks perfectly clean on its own but is kilometers off from the orbit it was assigned to. That is exactly the kind of error editing exists to catch.
:::

::: context undocumented-maneuvers Why maneuvers go unreported
Many satellites maneuver without telling anyone outside their own operators, and some now do it autonomously, deciding for themselves when to raise their orbit or dodge debris. Anyone tracking such a satellite independently — a space surveillance network, say — sees a maneuver only as a sudden change in the residuals. Even a satellite's own team can be surprised by an unexpected thruster firing or a leaking valve. Lesson 12 of this module is about estimating maneuvers from the tracking data itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="140" x2="60" y2="32" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="144" font-size="11" text-anchor="end" fill="#1f2a44">0%</text>
  <line x1="57" y1="140" x2="60" y2="140" stroke="#1f2a44"/>
  <text x="55" y="96" font-size="11" text-anchor="end" fill="#1f2a44">20%</text>
  <line x1="57" y1="92" x2="60" y2="92" stroke="#1f2a44"/>
  <text x="55" y="48" font-size="11" text-anchor="end" fill="#1f2a44">40%</text>
  <line x1="57" y1="44" x2="60" y2="44" stroke="#1f2a44"/>
  <rect x="85" y="140.0" width="50" height="0.0" fill="#8fb8f0"/>
  <text x="110" y="134.0" font-size="12" text-anchor="middle" fill="#1f2a44">0.0%</text>
  <text x="110" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">pass 1</text>
  <rect x="165" y="133.0" width="50" height="7.0" fill="#8fb8f0"/>
  <text x="190" y="127.0" font-size="12" text-anchor="middle" fill="#1f2a44">2.9%</text>
  <text x="190" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">pass 2</text>
  <rect x="245" y="41.6" width="50" height="98.4" fill="#b4232c"/>
  <text x="270" y="35.6" font-size="12" text-anchor="middle" fill="#1f2a44">41.0%</text>
  <text x="270" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">pass 3</text>
  <line x1="230" y1="144" x2="230" y2="30" stroke="#1f2a44" stroke-dasharray="4 3"/>
  <text x="226" y="28" font-size="12" text-anchor="end" fill="#1f2a44">1 mm/s burn</text>
  <text x="200" y="174" font-size="11" text-anchor="middle" fill="#6c7a93">share of range residuals beyond 3σ</text>
</svg>
```

The pattern from the example: nothing before the burn, a spike after it.
:::

::: context laser-ranging Measuring distance with light
Satellite laser ranging fires short laser pulses from a telescope at a satellite carrying small corner-cube mirrors, which bounce the light straight back. Timing the round trip gives the range with an accuracy of millimeters to a few centimeters, far better than most radars. A worldwide network of such stations tracks geodesy and navigation satellites. Their data deserves far more weight than a meter-level radar pass — which is exactly why weighting, not equal treatment, matters when both feed the same fit.
:::

::: context weighted-rms One number for "does the fit match the noise?"
Divide each residual by its own $\sigma$, square, average, and take the square root. If the model is right and the $\sigma$ values are honest, the answer should be close to $1$. Much above $1$: the residuals are bigger than the noise explains, so something is missing from the model or the $\sigma$ values are too optimistic. Well below $1$: the $\sigma$ values are too pessimistic, and the covariance is bigger than it needs to be. It is the square root of the chi-square statistic divided by the number of measurements, which is where the name of the check comes from.
:::

::: context overlap-arcs An honest accuracy test
A covariance is the fit's own opinion of its accuracy. Overlap comparisons get a second opinion from the data. Fit arc 1, fit arc 2 that shares part of its time with arc 1, and compare the two orbits over the shared part. If the reported covariances say each orbit is good to $2\,\mathrm m$ but the two disagree by $30\,\mathrm m$, the covariances are too optimistic, and operators scale them up to match.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="170" y="20" width="100" height="72" fill="#f2b880" fill-opacity="0.45"/>
  <rect x="30" y="30" width="240" height="16" fill="#1d6fd1"/>
  <rect x="170" y="66" width="160" height="16" fill="#8fb8f0"/>
  <text x="36" y="24" font-size="12" fill="#1d6fd1">arc 1 (fit)</text>
  <text x="276" y="62" font-size="12" fill="#1f2a44">arc 2</text>
  <line x1="20" y1="104" x2="340" y2="104" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="340,104 330,99 330,109" fill="#1f2a44"/>
  <text x="332" y="122" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
  <text x="220" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">overlap: compare orbits here</text>
</svg>
```

The shaded window is where the two solutions should agree within their stated uncertainties.
:::
