---
id: l09-residual-editing-and-data-weighting
title: Residual editing and data weighting
minutes: 14
covers:
  - Residual editing and data weighting
---

The least-squares module's own lesson on residual analysis, outlier rejection and robust estimation built the statistical machinery this lesson leans on directly: normalized residuals, why a $3\sigma$ threshold is a reasonable default, and robust alternatives to a hard cutoff. What is specific to orbit determination is the setting that machinery operates in — a batch fit iterated over an arc, where the residual pattern left behind by a bad measurement looks nothing like the pattern left by dynamics quietly doing something the model did not expect, and confusing the two is how a flight dynamics team turns one bad data point into a genuinely wrong orbit.

## The normalized residual, and when it is safe to trust

A measurement's normalized (or standardized) residual, $r_i/\sigma_i$, is the same quantity the least-squares module built a whole lesson around: how many assumed standard deviations a residual sits from zero. In an orbit determination arc it is only meaningful once the fit has actually converged — residuals computed against a reference trajectory that is still kilometres from the truth are enormous everywhere, by construction, and say nothing yet about which individual points are bad.

::: warning Editing before convergence can destroy a fit that would otherwise work
Turning on a $3\sigma$ edit rule from the very first iteration of a batch fit that started from a rough guess is not a conservative choice — it can fail outright. With a starting error of a few kilometres, every residual in the first iteration is hundreds or thousands of sigma from zero (measured against a few metres of assumed noise), so a naive edit rule rejects most or all of the data before the fit has had any chance to converge, and the normal equations can become singular from too few points left to constrain the state. The correct order is: converge first without editing, *then* edit against residuals that actually reflect data quality, and re-converge.
:::

## Finding genuinely bad data

::: example Three bad points, found and removed
The same three-pass tracking arc as the batch lesson, with three range measurements (out of $111$) corrupted by a $2\,\mathrm{km}$ error each — a plausible data-association mistake or station timing glitch. Converging first without editing gives a usable but contaminated fit (epoch position error $1.9\,\mathrm m$, against $0.5\,\mathrm m$ on clean data); resuming from that converged state with $3\sigma$ editing turned on:

```python
# it 0: used 111/111  RMS range  328.6 m   (huge -- the 3 bad points dominate the mean-square)
# it 1: used 104/111  RMS range    4.9 m   (7 points cut on the first editing pass, some good ones too)
# it 2: used 108/111  RMS range    5.0 m   (down to exactly the 3 injected bad points)
# it 3: used 108/111  RMS range    5.0 m   (stable)
#
# final edited indices: [10, 55, 95]  <- exactly the three injected
# residuals at those three points, final iteration: [2004.6, 2002.4, 1990.3] m  (~400 sigma)
# final epoch error: 0.47 m position, 1.47 mm/s velocity  -- matches the clean-data fit closely
```

The first editing pass over-corrects, cutting four good points along with the three bad ones — a residual that is merely unlucky, not systematically wrong, can briefly cross a $3\sigma$ threshold on a still-settling fit. By the second pass the edit set has stabilized on exactly the three points that are actually wrong by four hundred standard deviations, not a borderline handful, and the recovered epoch state matches the uncontaminated fit from the batch lesson to within about a metre.
:::

## When the residual pattern means something else entirely

A handful of points that are wrong by hundreds of sigma, scattered arbitrarily through the arc, is the signature of bad data. A residual pattern that grows steadily and concentrates in the data *after* a particular moment is a different signature — dynamics doing something the model did not include, most often an unplanned or undocumented manoeuvre.

::: example An unmodelled one-millimetre-per-second manoeuvre, and what it leaves behind
Injecting a genuinely tiny velocity change — $1\,\mathrm{mm/s}$, applied once between the second and third passes — into the truth trajectory, then fitting the whole arc with ordinary two-body-plus-J2 dynamics that know nothing about it:

```python
#          N    fraction of range residuals exceeding 3-sigma   RMS range residual
# pass 1  37                     0.0 %                              6.1 m
# pass 2  35                     2.9 %                              7.4 m
# pass 3  39                    41.0 %                             14.5 m   <- after the manoeuvre
```

Nothing before the manoeuvre looks unusual — pass 1 is entirely clean, pass 2 only marginally elevated. Pass 3, entirely after the event, has more than a third of its points crossing the edit threshold and a residual RMS nearly three times the pre-manoeuvre level, even though the manoeuvre itself was too small to move the epoch fit by anything dramatic. Scaling the same manoeuvre up to $3\,\mathrm{mm/s}$ pushes pass 3 to $100\,\%$ flagged and starts contaminating pass 2 as well ($51\,\%$); at $10\,\mathrm{mm/s}$ every pass is saturated. **An edit rate that rises and concentrates in the later part of an arc, rather than scattering evenly through it, is not telling you to edit harder — it is telling you the dynamics model, not the data, is what needs fixing.** Blindly editing away a real manoeuvre's aftermath, rather than recognising the pattern and splitting the arc at the event, is exactly the mistake the module's own flashcard for this topic warns against.
:::

## Weighting instead of rejecting

A station whose data is noisier than average, but not wrong, does not belong in the reject pile — it belongs with a smaller weight. Setting $\mathbf W_i=\mathbf R_i^{-1}$ per measurement (or per station, or per pass) is the same weighting the very first lesson of the least-squares module built the normal equations around; the only OD-specific habit is applying it station by station and measurement-type by measurement-type, since a laser ranging system and a decades-old radar feeding the same arc do not deserve the same trust, and treating them as if they did lets the noisier source distort the fit far more than its actual information content justifies. A station suspected of a small, roughly constant bias — rather than simply noisier data — is better handled with the solve-for or consider treatment of the earlier lessons than with weighting alone, since down-weighting does nothing to correct a systematic offset.

## What a flight dynamics team actually watches

Put together, this lesson and the two before it describe most of what a routine orbit determination pass actually involves day to day: fit the arc, examine the normalized residuals and the edit rate rather than only the final RMS, and ask two questions before trusting the result. Did the fit converge — is the correction from one iteration to the next negligible? And is the converged fit *correct* — does the post-fit residual RMS actually match the assumed measurement noise, the way the nonlinear least-squares lesson's chi-square check asked, or is it inflated in a way that a tighter edit or a longer arc would reveal as unmodelled dynamics rather than bad luck? A fit that converges cleanly to a wrong answer looks, from the outside, exactly like a fit that converged to the right one until someone checks the residuals; the tracking-geometry lesson showed the same arc can leave some directions of the state barely constrained at all, and this lesson shows that even a well-observed arc can be quietly corrupted by a handful of bad points or a missed event that only a careful look at *where* the residuals are bad, not just how big they are, will catch.

::: key Editing and weighting, in one paragraph
Converge before editing, never the reverse. A scattered handful of large-normalized-residual points, uncorrelated with time, is bad data — edit it, and re-converge. A residual pattern that grows and concentrates after some moment is not bad data — it is the dynamics model missing something real, and the fix is a better force model, a solved-for or considered parameter, or splitting the arc, not a smaller edit threshold. Weight by genuine measurement quality; never use weighting to paper over a systematic bias.
:::

## Check yourself

::: check
Why did the first editing iteration in the outlier example cut seven points when only three were actually corrupted, and why did that resolve itself by the second iteration?
:::

::: answer
The state estimate at the start of the editing stage, while converged for the *contaminated* data, was still pulled slightly away from the truth by the three bad points; against that not-quite-right reference trajectory, a few otherwise good measurements had normalized residuals that happened to exceed $3\sigma$ by chance or by the state's own small residual bias. Once those (and the three genuinely bad points) were removed and the fit re-converged on cleaner data, the state moved closer to the truth, and the previously-borderline good points settled back under the threshold on the next pass, leaving exactly the three points that are wrong by hundreds of sigma — a discrepancy no amount of re-convergence could explain away.
:::

::: check
A $1\,\mathrm{mm/s}$ manoeuvre left pass 3 with a $41\,\%$ edit rate while pass 1 stayed at $0\,\%$. Explain why such a tiny velocity change produces such a visible effect, using the state transition matrix from earlier lessons.
:::

::: answer
The variational-equations lesson showed $\boldsymbol\Phi$'s position-velocity block carries a multiplier of order $10^3$–$10^4$ seconds even over a single hour; a velocity change of $1\,\mathrm{mm/s}$ left uncorrected for the roughly $14{,}500$ seconds between the manoeuvre and pass 3 corresponds to a position error on the order of $1\,\mathrm{mm/s}\times14{,}500\,\mathrm s\approx14.5\,\mathrm m$ — comfortably larger than the few-metre measurement noise the fit assumes, and growing with elapsed time, which is exactly why pass 3 (the most time removed from the event) shows the largest effect while pass 1, entirely before it, shows none at all.
:::

::: check
Why is down-weighting the wrong remedy for a station with a small, consistent range bias, even though the station's data genuinely disagrees with the fit?
:::

::: answer
Weighting only controls how much a measurement's *random* scatter influences the fit relative to other measurements; it does nothing to remove a *systematic* offset, which biases the fit by roughly the same amount regardless of how heavily or lightly that station's data is weighted (a smaller weight only means the biased data has less influence, not that its bias is corrected). A consistent bias needs to be solved for, considered, or otherwise modelled directly — the tools the batch and consider-covariance lessons already built — because weighting addresses precision, not accuracy.
:::

::: check
An operator sees a rising edit rate concentrated in the most recent third of an arc and responds by loosening the edit threshold from $3\sigma$ to $5\sigma$ so the fit "uses more data." What is likely to go wrong?
:::

::: answer
If the rising edit rate is the signature of a real, unmodelled event such as a manoeuvre rather than ordinary bad data, loosening the threshold does not fix the underlying problem — it simply admits more of the manoeuvre-corrupted data back into a fit whose dynamics model still does not include the manoeuvre, biasing the epoch state to compromise between the pre- and post-event trajectories rather than correctly representing either one. The edit rate was diagnostic information about the dynamics model being wrong, and responding to it by editing less aggressively treats the symptom as if it were the disease.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $r_i/\sigma_i$ | Normalized residual; only meaningful once the fit has converged |
| Converge, then edit, then re-converge | Editing before convergence can cut most or all of the data and singularize the fit |
| Scattered large-residual points | Genuinely bad data; safe to edit |
| Residual pattern rising after a moment in time | Unmodelled dynamics (often a manoeuvre), not bad data; fix the model, do not just edit harder |
| $\mathbf W_i=\mathbf R_i^{-1}$, per station/type | Weighting corrects for precision differences; it cannot correct a systematic bias |
| Converged $\ne$ correct | Check the post-fit RMS against the assumed noise, and check *where*, not only *how much*, residuals disagree |

Every editing and weighting decision in this lesson assumed the resulting fit's accuracy could be judged from Cartesian residuals and a single covariance number. The next lesson gives that covariance a frame — radial, in-track, cross-track — in which its shape, and not just its size, finally means something physical.
