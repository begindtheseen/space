---
id: l04-sequential-orbit-determination-ekf-ukf
title: Sequential orbit determination with EKF and UKF
minutes: 24
covers:
  - Sequential orbit determination with EKF and UKF
---

Think about a map app that follows a city bus. The bus only reports in when it passes a stop. Between stops, the app guesses: "it was going $30\,\mathrm{km/h}$ up Main Street, so by now it is about here." When the next stop report comes in, the app nudges the dot to where the bus really is and carries on. It keeps one running best guess and fixes it a little every time news arrives.

The other way is to wait for the end of the day, then work out the one route that fits every stop report at once.

The second way is the **batch** orbit determination of the last two lessons: gather an entire arc of tracking, then fit one epoch state to all of it. The first way is **sequential orbit determination** — keeping a running estimate of the orbit and updating it each time a measurement arrives. Real operations need both. A collision-avoidance screen needs the freshest state the moment new tracking lands, and a navigation computer on board a spacecraft has no arc to wait for at all.

The tool for the sequential job is the **[[Kalman filter|kalman-history]]**, in the version for curved (nonlinear) problems called the **Extended Kalman Filter**, or **EKF**. The nonlinear-filters module derived it in full, so this lesson does not repeat the derivation. What is new here is how its pieces map onto an orbit, how its answer compares with batch, and one way it can fail where batch does not.

## Guess, then check: the two steps of the filter

The filter repeats two steps forever.

1. **Predict.** Carry the current best guess forward in time with physics, up to the moment of the next measurement. The guess gets fuzzier as it goes, because small errors grow.
2. **Update.** Compare the new measurement with what the guess says it *should* have been. Move the guess part of the way toward the measurement, and shrink the fuzziness.

To write this down you need a few symbols. Read them aloud as you go.

- $\hat{\mathbf x}$, read "x hat", is the **state estimate**: the filter's best guess of position and velocity (six numbers, sometimes more). The hat means "estimate".
- $\mathbf P$ is the **[[covariance|covariance-picture]]** of that estimate: a $6 \times 6$ table holding the filter's own error bars for each component, plus how the errors lean together. The square root of a diagonal entry is a standard deviation, $\sigma$ ("sigma"), the typical size of the error in that component.
- A superscript minus, as in $\mathbf P^-$ ("P minus"), means *just before* an update. A superscript plus, $\mathbf P^+$, means *just after*.
- $\boldsymbol\Phi$ ("phi") is the state transition matrix from the last lesson. It says how a small error now turns into an error later.
- $\mathbf Q$ is the **process noise**: extra fuzziness added during the predict step for forces the model leaves out.
- $\mathbf z$ is the measurement, and $\mathbf h(\hat{\mathbf x})$ is what the measurement would be if the estimate were exactly right. Their difference $\mathbf y$ is the **innovation**, or residual: the surprise.
- $\mathbf H$ is the partial derivative of the measurement with respect to the state, the same kind of row the batch lesson called $\mathbf H_i$. $\mathbf R$ is the measurement's own noise variance.
- $\mathbf S$ is the expected spread of the surprise, and $\mathbf K$ is the **Kalman gain**: how far to move toward the measurement.

::: key EKF predict/update for orbit determination (recap; derived in full in the nonlinear-filters module)
Predict: $\hat{\mathbf x}^-=\mathbf x(\text{propagated})$, $\mathbf P^-=\boldsymbol\Phi\mathbf P^+\boldsymbol\Phi^\mathsf T+\mathbf Q$. Update: $\mathbf y=\mathbf z-\mathbf h(\hat{\mathbf x}^-)$, $\mathbf S=\mathbf H\mathbf P^-\mathbf H^\mathsf T+\mathbf R$, $\mathbf K=\mathbf P^-\mathbf H^\mathsf T\mathbf S^{-1}$, $\hat{\mathbf x}^+=\hat{\mathbf x}^-+\mathbf K\mathbf y$, $\mathbf P^+=(\mathbf I-\mathbf K\mathbf H)\mathbf P^-(\mathbf I-\mathbf K\mathbf H)^\mathsf T+\mathbf K\mathbf R\mathbf K^\mathsf T$ (Joseph form). $\mathbf H$ is evaluated at the current estimate, exactly as $\mathbf H_i(t_i)$ was in the batch lesson; $\boldsymbol\Phi$ comes from the same variational equations.
:::

Notice what the predict step uses. The state itself is carried forward with the full nonlinear equations of motion — the same integrator as batch. Only the covariance is carried forward with $\boldsymbol\Phi$, the straight-line (linear) approximation. That straight-line step is the "extended" in EKF: it takes the Kalman filter, which was built for straight-line problems, and uses it on a curved one by **[[linearizing|linearizing]]** — treating the curve as straight near the current guess.

### The gain is a weighted average

The update looks heavy, but with one number instead of six it is an ordinary weighted average. Suppose the filter is unsure of a range by $\sigma^-$ and the radar measures it with noise $\sigma_z$. Then $S = (\sigma^-)^2 + \sigma_z^2$ and

$$
K = \frac{(\sigma^-)^2}{(\sigma^-)^2 + \sigma_z^2}.
$$

$K$ is always between $0$ and $1$. If the guess is poor ($\sigma^-$ big), $K$ is near $1$ and the filter jumps almost all the way to the measurement. If the measurement is poor ($\sigma_z$ big), $K$ is near $0$ and the filter mostly keeps its guess. The new variance is $(1-K)(\sigma^-)^2$, which is always smaller than before.

::: example One range measurement, one update
The filter predicts a range of $1000.000\,\mathrm{km}$ and is unsure of it by $\sigma^- = 20\,\mathrm m$. The radar measures $1000.030\,\mathrm{km}$, with noise $\sigma_z = 5\,\mathrm m$. So the surprise is $y = 30\,\mathrm m$.

**Spread of the surprise.** Add the two variances:

$$
S = 20^2 + 5^2 = 425\,\mathrm{m^2}.
$$

**Gain.** Divide the guess's variance by that:

$$
K = \frac{400}{425} \approx 0.941.
$$

**Correction.** Move $94.1\%$ of the way toward the measurement: $K y = 0.941 \times 30 \approx 28.2\,\mathrm m$. The new range estimate is about $1000.028\,\mathrm{km}$.

**New uncertainty.** The variance shrinks by the factor $1-K = \frac{25}{425}$:

$$
(\sigma^+)^2 = \frac{25}{425} \times 400 \approx 23.5\,\mathrm{m^2}, \qquad \sigma^+ \approx 4.85\,\mathrm m.
$$

Sanity check: the answer sits much closer to the $5\,\mathrm m$ radar than to the $20\,\mathrm m$ guess, because the radar is the better witness. And $4.85\,\mathrm m$ is smaller than *both* $20\,\mathrm m$ and $5\,\mathrm m$ — two independent clues together always beat either one alone.
:::

### The one orbit-specific choice: Q

Two-body motion, even with $J_2$, has no random pushes in it, so a filter that trusted its force model completely would run with $\mathbf Q=\mathbf 0$. Real filters almost never do, because real spacecraft always feel some force the model gets slightly wrong, such as air drag. Choosing $\mathbf Q$ well is the whole subject of the process-noise lesson later in this module. In this lesson the simulated "truth" follows exactly the same two-body dynamics as the filter, so $\mathbf Q = \mathbf 0$ is honest, and the comparison with batch stays in front.

## A sequential fit that lands on the batch answer

Here is the filter at work on the kind of scenario the batch lesson used: a $420\,\mathrm{km}$ orbit ($a = 6798.137\,\mathrm{km}$, $e = 0.001$, $i = 51.6^\circ$), one ground station at $40^\circ$ N, and twelve hours of tracking. Three passes are used, starting $6.22$, $7.86$ and $11.11$ hours after the epoch, giving $99$ looks. Each look has a range (noise $5\,\mathrm m$) and a range-rate (noise $1\,\mathrm{mm/s}$). The filter takes them one scalar at a time: the range, then the range-rate, then on to the next look.

::: example Watching the recursion
The filter starts at the epoch with an error of $105\,\mathrm m$ in position and $58\,\mathrm{mm/s}$ in velocity — about what a short preliminary fit might give, not the raw kilometre-level output of Gibbs or Gauss. Its starting covariance says $100\,\mathrm m$ and $0.1\,\mathrm{m/s}$ per axis. It then coasts $6.2$ hours to the first look.

In the table, "error" is the true distance between the filter's position and the real one. "Sigma" is the filter's own claim about that size (the square root of the sum of the three position variances). Both are in metres.

| look | time (h) | error before update | sigma before update | error after update | sigma after update |
| --- | --- | --- | --- | --- | --- |
| 1 (pass 1 starts) | 6.22 | 1807 | 10 111 | 93.9 | 101 |
| 21 | 6.27 | 6.8 | 10.7 | 3.23 | 10.4 |
| 39 (pass 1 ends) | 6.32 | 2.4 | 13.9 | 1.84 | 13.9 |
| 40 (after a 1.5 h gap) | 7.86 | 12.0 | 18.5 | 5.64 | 6.34 |
| 66 (pass 2 ends) | 7.93 | 0.9 | 1.0 | 0.78 | 1.01 |
| 67 (after a 3.2 h gap) | 11.11 | 1.7 | 2.4 | 0.98 | 1.46 |
| 99 (last look) | 11.20 | 0.8 | 0.9 | 0.84 | 0.83 |

During the long first coast, a $105\,\mathrm m$ start has grown to an $1807\,\mathrm m$ miss, and the filter knows it: its sigma has swelled to about $10\,\mathrm{km}$, which is honest (bigger than the real error, not smaller). The very first look cuts the error by a factor of about twenty. By the end of pass 1 the error is under $2\,\mathrm m$.

Each gap makes both columns jump up a little — the **[[blind coast|blind-coast]]** between passes — and each new pass pulls them down again. By the last look, error and sigma are both under a metre and match each other closely. Over the run, the error fell by more than three orders of magnitude.

**Against batch.** Map the final EKF state back to the epoch with the same dynamics, and compare with a batch fit of the same $99$ looks. They differ by only $2.3\,\mathrm{cm}$ in position and $0.046\,\mathrm{mm/s}$ in velocity. Both are about $0.9\,\mathrm m$ from the truth — that last metre is measurement noise, which no estimator can remove. So the two agree with *each other* about forty times more closely than either agrees with the truth.

Even the reported uncertainties match. At the epoch, the EKF's position sigmas are $(0.635,\ 0.423,\ 0.412)\,\mathrm m$ and the batch's are $(0.635,\ 0.423,\ 0.412)\,\mathrm m$, equal to three figures.
:::

::: note Why it has to be true: the filter and batch count the same information
Write the update in "information form": the inverse of a covariance, $\mathbf P^{-1}$, measures how much you know. One update adds exactly what the measurement contributes,

$$
(\mathbf P^+)^{-1} = (\mathbf P^-)^{-1} + \mathbf H^\mathsf T\mathbf R^{-1}\mathbf H .
$$

(This is the Kalman update rewritten with the matrix inversion lemma, derived in the nonlinear-filters module.) With $\mathbf Q = \mathbf 0$, the predict step only moves this knowledge from one time to another with $\boldsymbol\Phi$; it neither adds nor loses any. So carry every contribution back to the epoch. Each one becomes $(\mathbf H_i\boldsymbol\Phi_i)^\mathsf T\mathbf R_i^{-1}(\mathbf H_i\boldsymbol\Phi_i)$, and they add up to

$$
\mathbf P_0^{-1} = \mathbf P_{\text{start}}^{-1} + \sum_i (\mathbf H_i\boldsymbol\Phi_i)^\mathsf T\mathbf R_i^{-1}(\mathbf H_i\boldsymbol\Phi_i) = \mathbf P_{\text{start}}^{-1} + \boldsymbol\Lambda .
$$

That is the batch normal matrix $\boldsymbol\Lambda$, plus the filter's starting knowledge. Here the starting covariance ($100\,\mathrm m$) was loose next to what the data gave (under a metre), so its share is tiny, and the two answers coincide. The small leftover gap comes from the EKF linearizing about slightly different points than the final batch iteration did.
:::

## When the first guess is too rough

Batch can start from a guess kilometres off, because it goes over the *entire* arc again and again. A bad first straight-line approximation just produces a big correction. The next pass re-propagates from the better guess, re-linearizes along the new path, and tries again.

A sequential filter gets no second try. At each look it makes a correction using the straight-line approximation it has *right then*, and moves on. It never goes back.

::: example The same rough start breaks a plain EKF
Take the batch lesson's style of rough start: $3.9\,\mathrm{km}$ off in position and $2.7\,\mathrm{m/s}$ in velocity. Give it to the same batch code and the same EKF, with the same $99$ looks. The EKF's starting covariance now honestly says $3\,\mathrm{km}$ and $3\,\mathrm{m/s}$ per axis.

**Batch.** The corrections from one iteration to the next run about $14\,\mathrm{km}$, $14\,\mathrm{km}$, $0.25\,\mathrm{km}$, $0.19\,\mathrm{km}$, $2\,\mathrm{cm}$, and then almost nothing. It lands $0.90\,\mathrm m$ from the truth — the same noise-limited answer as before.

**EKF.** After the $6.2$-hour coast, the guess is $48\,\mathrm{km}$ from the truth. The first update brings it to about $2.9\,\mathrm{km}$, but the second one throws it out to about $21\,\mathrm{km}$: the straight-line approximation it used was made about a point that was far off. It never recovers. After the last look it is still $1.83\,\mathrm{km}$ wrong while reporting a sigma of about $1.0\,\mathrm m$.

The filter is not "honestly unsure"; it is **confidently wrong**, claiming metre-level accuracy for a state kilometres off. And making the starting covariance looser does not help: at $10\,\mathrm{km}$ and $10\,\mathrm{m/s}$ per axis, the same run ends about $410\,\mathrm{km}$ off. The starting error, not the random noise, is what breaks it.
:::

This is not a flaw in the Kalman filter's mathematics. When the guess is far from the truth, the partials $\mathbf H$ and $\boldsymbol\Phi$ computed at the guess point in the wrong directions. The correction built from them lands somewhere else wrong. The next step linearizes about that wrong place, and the error feeds itself instead of shrinking.

The cure used in real operations is the one the first example quietly assumed: start a sequential filter from a state good enough for straight lines to be trusted. That usually means a short batch fit of the first data, or the tail of a longer batch solution. Raw initial-orbit-determination output, with all its roughness, is batch's starting point, not the filter's. A partial remedy is the **iterated EKF**, which re-linearizes several times inside a single update until the correction settles (the nonlinear-filters module covers it). It fixes a stale straight-line approximation at one moment, but it still cannot go back over the whole arc the way batch does.

::: warning Numerical conditioning bites sequential filters too
Processing many very precise measurements from one fixed geometry in quick succession can, over enough updates, shrink the covariance's smallest eigenvalue toward the edge of what **[[double-precision numbers|double-precision]]** can hold — the same kilometres-and-seconds sensitivity the batch lesson met in $\boldsymbol\Lambda$, now hitting $\mathbf P$ update after update instead of once. Joseph form (used above) is more forgiving than the short update $\mathbf P^+=(\mathbf I-\mathbf K\mathbf H)\mathbf P^-$, but it is not immune. That is exactly why the Kalman filter module built **[[square-root and UD forms|square-root-filters]]**: they carry a factor of $\mathbf P$ that cannot represent a negative eigenvalue at all, however small the true uncertainty in some direction becomes. A sequential orbit determination filter chewing through dense, high-precision tracking is the setting those forms exist for.
:::

## The unscented alternative

Nothing about orbit determination forces the EKF's straight-line approximation. The **Unscented Kalman Filter**, or **UKF**, takes a different approach. Instead of carrying one path plus its straight-line matrix $\boldsymbol\Phi$, it sends out a small team of scouts.

The scouts are called **[[sigma points|sigma-points]]**. For a state with $n$ numbers there are $2n+1$ of them: one at the best guess, and a pair on either side of it along each main direction of $\mathbf P$, placed to match its spread. Each scout is flown through the *exact* nonlinear dynamics and the exact measurement function. Then the filter measures the new average and spread of the scouts. No partial derivatives are ever formed. The result captures the mean and covariance to second order, one step better than the EKF's first order. The full construction, and why it often beats the EKF when the problem is strongly curved, is the nonlinear-filters module's own subject.

For orbit determination, the UKF's appeal shows up in exactly the failure above. A poorly known state carried across a long curved coast is where scouts, which sample the real spread of possible states, tend to degrade more gently than one straight-line approximation. The cost is flying $2n+1$ trajectories instead of one reference trajectory plus its $\boldsymbol\Phi$. For a six-number state that is $13$ trajectories. That matters more for a large state with many bias parameters than for a typical six-to-ten-state filter.

::: key Batch versus sequential
Batch: every measurement in the arc at once, iterated with Gauss-Newton, best accuracy and easiest to diagnose from residuals, tolerant of a rough starting guess because it can re-linearize the whole arc — but offline; the natural choice for definitive orbit determination. Sequential (EKF/UKF): recursive, one measurement (or one look) at a time, real-time and onboard-capable, but each step commits to its local linearization — it needs a trustworthy starting point and careful process noise and numerical-conditioning treatment. Operations typically run both and compare: a periodic batch solution to anchor accuracy, a sequential filter to stay current between batch runs.
:::

## Check yourself

::: check
A filter is unsure of a range by $\sigma^- = 50\,\mathrm m$. A measurement with noise $\sigma_z = 10\,\mathrm m$ comes in $40\,\mathrm m$ *shorter* than predicted. Find the gain, the correction, and the new sigma.
:::

::: answer
The surprise is $y = -40\,\mathrm m$. The spread of the surprise is $S = 50^2 + 10^2 = 2600\,\mathrm{m^2}$.

The gain is $K = \frac{2500}{2600} \approx 0.962$. The correction is $K y \approx 0.962 \times (-40) \approx -38.5\,\mathrm m$, so the range estimate moves $38.5\,\mathrm m$ shorter.

The new variance is $(1-K)(\sigma^-)^2 = \frac{100}{2600} \times 2500 \approx 96.2\,\mathrm{m^2}$, so $\sigma^+ \approx 9.81\,\mathrm m$ — a bit better than the $10\,\mathrm m$ measurement alone, and far better than the $50\,\mathrm m$ guess.
:::

::: check
Explain, in terms of what each estimator re-linearizes and when, why batch least squares recovered the $3.9\,\mathrm{km}$ starting error on the same data that made the plain EKF diverge.
:::

::: answer
Batch re-linearizes the *entire* reference trajectory at every iteration. After a bad first correction it re-propagates from the new epoch guess, recomputes $\boldsymbol\Phi$ along that new path, and solves again. A poor first linearization only costs an extra iteration or two.

The EKF linearizes once, locally, at each measurement time, about whatever state it holds at that moment. If that state is still far from the truth when the first measurement arrives, the linearization is unreliable. The correction it produces can move the filter to an even worse point for the *next* linearization, and there is no mechanism to go back and start again from a fresh whole-arc guess.
:::

::: check
In the recursion example the reported sigma rose from about $1.0\,\mathrm m$ at the end of pass 2 to $2.4\,\mathrm m$ just before the first update of pass 3, then fell again. Is this growth a sign of a problem?
:::

::: answer
No. It is exactly what a correct predict step must do. During a $3.2$-hour coast with no measurements, $\mathbf P^-=\boldsymbol\Phi\mathbf P^+\boldsymbol\Phi^\mathsf T+\mathbf Q$ carries the existing uncertainty forward, and small velocity errors stretch into larger position errors along the way ($\mathbf Q$ would add a little more, if it were not zero here).

A covariance that stayed at $1.0\,\mathrm m$ through a gap with no data would be the one to distrust: nothing would support that much confidence. What matters is that it shrinks quickly again once pass 3's measurements arrive, just as it did after the gap before pass 2.
:::

::: check
Why does Joseph form help against the numerical conditioning problem in this lesson, and why is it not a complete fix?
:::

::: answer
Joseph form, $\mathbf P^+=(\mathbf I-\mathbf K\mathbf H)\mathbf P^-(\mathbf I-\mathbf K\mathbf H)^\mathsf T+\mathbf K\mathbf R\mathbf K^\mathsf T$, writes the new covariance as a sum of two pieces that are each, by construction, positive semi-definite: a "sandwich" of $\mathbf P^-$, plus $\mathbf K\mathbf R\mathbf K^\mathsf T$. So round-off is much less likely to produce a small negative eigenvalue than with the algebraically equal but fragile short form $\mathbf P^+=(\mathbf I-\mathbf K\mathbf H)\mathbf P^-$. It also stays correct even if $\mathbf K$ is slightly off.

It is not a complete fix because both pieces are still computed and added in finite precision. If the true uncertainty in some direction becomes tiny compared with the largest one, the subtraction hidden inside $\mathbf I-\mathbf K\mathbf H$ can still wear away that direction's digits after enough updates. Square-root and UD forms avoid this by never forming $\mathbf P$ directly at all.
:::

::: check
An engineer proposes replacing the EKF with a UKF, expecting it to converge even from the $3.9\,\mathrm{km}$ start that broke the EKF. Is that expectation well founded?
:::

::: answer
Only partly, and it should not be assumed. The UKF avoids linearizing $\boldsymbol\Phi$ and $\mathbf H$ by flying sigma points through the true nonlinear functions, so it tends to degrade more gently than a single-linearization EKF when the starting spread is large. That is a genuine advantage here.

But the sigma points still have to cross the same long, uncorrected coast before any measurement helps, and second-order accuracy cannot fix a starting spread that has become badly non-Gaussian by the time the data arrives. In fact, run on this very scenario, a plain UKF from the same start also ended several kilometres off (about $7\,\mathrm{km}$) while reporting a sigma near $1\,\mathrm m$. It is an improvement in some cases, not a guarantee; the robust cure is still a good starting state from a short batch fit.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat{\mathbf x}$, $\mathbf P$ | The running estimate and its covariance (its own error bars) |
| Predict: $\mathbf P^-=\boldsymbol\Phi\mathbf P^+\boldsymbol\Phi^\mathsf T+\mathbf Q$ | Same $\boldsymbol\Phi$ as the batch and variational-equations lessons; the state itself is propagated with the full dynamics |
| Update: $\mathbf K=\mathbf P^-\mathbf H^\mathsf T\mathbf S^{-1}$, Joseph form for $\mathbf P^+$ | Recap — full derivation in the nonlinear-filters module |
| Scalar gain $K = (\sigma^-)^2/((\sigma^-)^2+\sigma_z^2)$ | A weighted average: trust whichever clue is sharper |
| Batch vs. sequential agreement | Same data, same information: $2.3\,\mathrm{cm}$ apart in the example, both noise-limited at about $0.9\,\mathrm m$ |
| Large start error + long blind coast | Can make a plain EKF diverge, confidently wrong, where iterated batch still converges |
| Covariance growth during a data gap | Expected and correct; a covariance that did not grow would be the red flag |
| Joseph form | More robust than the short update, not immune to eigenvalue collapse under many precise updates |
| UKF | $2n+1$ sigma points through the true nonlinear model; often more graceful under large spread, not a cure-all |

Both estimators here used measurements of range and range-rate and took their partials $\mathbf H$ as given. The next lesson opens that box: what each kind of tracking measurement — range, Doppler, angles, GNSS, VLBI, crosslinks — really measures, and how to write its $h(\mathbf x)$ and its partials.

::: context kalman-history A filter that flew to the Moon
Rudolf Kálmán published the filter in 1960 for straight-line (linear) problems. Almost at once, Stanley Schmidt's group at NASA's Ames Research Center saw that it could navigate Apollo if the curved orbital equations were linearized about the current best guess. That adaptation is what we now call the Extended Kalman Filter, and it became part of the Apollo guidance computer's navigation. The name "filter" comes from radio engineering: it filters the noise out of a stream of measurements to leave the signal, which here is the orbit.
:::

::: context covariance-picture A cloud with a shape
Picture the filter's uncertainty as a cloud of possible positions around its best guess. The covariance $\mathbf P$ describes the cloud's size and shape. Its diagonal holds the spread in each direction; its off-diagonal entries say whether errors lean together, which tilts the cloud. For an orbit the cloud is almost never round — it is usually stretched out along the direction of travel.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="130" x2="30" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330" y="146" font-size="11" fill="#1f2a44" text-anchor="end">error in x</text>
  <text x="36" y="22" font-size="11" fill="#1f2a44">error in y</text>
  <ellipse cx="185" cy="75" rx="110" ry="28" transform="rotate(-20 185 75)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="185" cy="75" r="4" fill="#b4232c"/>
  <text x="195" y="92" font-size="11" fill="#b4232c">best guess</text>
  <text x="258" y="36" font-size="11" fill="#1d6fd1">1-sigma cloud</text>
</svg>
```

A tilted cloud means that when the $x$ error is positive, the $y$ error tends to be positive too.
:::

::: context linearizing Treating a curve as straight
Zoom in far enough on any smooth curve and it looks like a straight line. Linearizing means replacing the curve by that straight line, called the tangent, at the point where you stand. Near the point the tangent is an excellent stand-in. Far away it can point somewhere quite wrong. The EKF linearizes about its current guess, so when the guess is far from the truth, it is working with the wrong straight line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M20,130 Q180,-30 340,130" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="100" x2="220" y2="10" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="100" cy="70" r="4" fill="#1d6fd1"/>
  <text x="104" y="90" font-size="11" fill="#1d6fd1">guess: tangent here</text>
  <circle cx="260" cy="70" r="4" fill="#b4232c"/>
  <text x="250" y="92" font-size="11" fill="#b4232c">truth: far away</text>
  <text x="122" y="32" font-size="11" fill="#1d6fd1">tangent line</text>
  <text x="300" y="140" font-size="11" fill="#1f2a44">true curve</text>
</svg>
```

Near the guess the blue line hugs the curve; out at the red dot the curve has turned down while the line keeps climbing.
:::

::: context blind-coast Why the error bars swell between passes
A satellite in low orbit is only above a given station's horizon for a few minutes at a time. In between, the filter is flying blind, predicting with physics alone. A tiny velocity error of a few millimetres per second becomes a larger and larger position error as the minutes pass, so the error bars grow. The next pass then snaps them back down. Plotted over a day, the sigma looks like a saw blade that trends downward.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="125" x2="345" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="125" x2="30" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340" y="142" font-size="11" fill="#1f2a44" text-anchor="end">time</text>
  <text x="36" y="22" font-size="11" fill="#1f2a44">sigma (log scale)</text>
  <rect x="90" y="12" width="14" height="113" fill="#f2b880" fill-opacity="0.6"/>
  <rect x="180" y="12" width="12" height="113" fill="#f2b880" fill-opacity="0.6"/>
  <rect x="300" y="12" width="12" height="113" fill="#f2b880" fill-opacity="0.6"/>
  <path d="M30,60 L90,28 L104,78 L180,72 L192,105 L300,96 L312,110 L340,111" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="97" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">pass 1</text>
  <text x="186" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">pass 2</text>
  <text x="306" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">pass 3</text>
</svg>
```

Shaded strips are passes: sigma drops inside each one and creeps up in each gap.
:::

::: context double-precision How many digits a computer keeps
Most scientific software stores each number as a 64-bit "double", which holds about 16 significant digits. That sounds like plenty, but it is shared across a whole matrix. If one direction of the covariance is known to a millimetre and another to a thousand kilometres, that is a spread of $10^9$ before any squaring, and the small numbers can lose most of their digits when added to the big ones. Round-off then eats away exactly the tiny, precise directions you care about.
:::

::: context square-root-filters Carrying the square root instead
A variance is a squared number, so its digits run out twice as fast. Square-root filters carry a matrix $\mathbf C$ with $\mathbf P = \mathbf C\mathbf C^\mathsf T$ instead, just as you might carry a standard deviation instead of a variance. Anything written as $\mathbf C\mathbf C^\mathsf T$ can never have a negative eigenvalue, so round-off cannot make the covariance impossible. Gerald Bierman's UD factorization, from the 1970s, is the form still flown in many spacecraft navigation filters.
:::

::: context sigma-points Scouts instead of a straight line
Picture the uncertainty cloud in just two dimensions. The UKF places $2n+1 = 5$ scouts: one at the center and one on each side along each main axis of the cloud. It flies each scout through the true curved dynamics, then fits a new cloud to where they land. For the six-number orbit state there are $13$ scouts.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <ellipse cx="80" cy="75" rx="50" ry="25" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="80" cy="75" r="4" fill="#b4232c"/>
  <circle cx="130" cy="75" r="4" fill="#1f2a44"/><circle cx="30" cy="75" r="4" fill="#1f2a44"/>
  <circle cx="80" cy="50" r="4" fill="#1f2a44"/><circle cx="80" cy="100" r="4" fill="#1f2a44"/>
  <text x="80" y="130" font-size="11" fill="#1f2a44" text-anchor="middle">5 scouts before</text>
  <path d="M150,75 L200,75" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="208,75 198,70 198,80" fill="#1f2a44"/>
  <text x="178" y="66" font-size="11" fill="#1f2a44" text-anchor="middle">true dynamics</text>
  <path d="M230,100 Q280,40 340,70" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="282" cy="62" r="4" fill="#b4232c"/>
  <circle cx="335" cy="68" r="4" fill="#1f2a44"/><circle cx="232" cy="98" r="4" fill="#1f2a44"/>
  <circle cx="275" cy="45" r="4" fill="#1f2a44"/><circle cx="292" cy="82" r="4" fill="#1f2a44"/>
  <text x="285" y="130" font-size="11" fill="#1f2a44" text-anchor="middle">bent after: refit the cloud</text>
</svg>
```

The scouts land on a bent arc, and the new cloud is fitted to them — no tangent lines needed.
:::
