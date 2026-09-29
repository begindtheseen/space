---
id: l09-tuning-and-consistency-nees-and-nis
title: "Tuning and consistency: Q, R, NEES and NIS"
minutes: 24
covers:
  - "filter tuning and consistency: process noise, measurement noise, NEES and NIS"
---

Picture a weather forecaster who said "70% chance of rain" on a hundred different days. If she is honest about her uncertainty, it rained on about seventy of them. If it rained on ninety-five, or on thirty, her "70%" was not an honest number. Being right and being honest about how sure you are are two different skills.

A filter has the same two skills. "Tracks well" is about the **estimate** — the best guess. "Right" is about the **covariance** — how sure the filter says it is. And the covariance is what everything downstream actually uses: a measurement gate, a guidance decision, a **[[collision probability|collision-probability]]**, an abort rule. A filter whose estimate is good but whose covariance is five times too small will throw away a perfectly good measurement, or report a near-miss distance with confidence it has not earned.

So the domain round asks two things. What are $\mathbf{Q}$ and $\mathbf{R}$ — where do the numbers come from, and what happens when each is wrong? And how do you *test* a filter's covariance on real data, with no truth available? The second has an exact, short answer, and giving it sets a candidate apart.

## What R is, and where its numbers come from

$\mathbf{R}$ is the covariance of the **measurement noise**: the sensor's own error, in the units of what it reports. Of the two, it is the one you can genuinely **measure**. Put the sensor on a bench next to a known reference, record for a long time, and the variance of the difference is $\mathbf{R}$.

For an inertial sensor, an **[[Allan deviation|allan-deviation]]** curve separates the white, jumpy part of the noise from the slowly wandering part, and only the white part belongs in a noise covariance. (When the inertial sensor drives the propagation instead of acting as a measurement, as gyros usually do, that white noise goes into $\mathbf{Q}$.) For a star tracker, $\mathbf{R}$ comes from how precisely it can locate star centers and from its catalog. For a ranging system, it comes from the ranging jitter plus whatever calibration error is left over.

Two ways to get it wrong:

- $\mathbf{R}$ **too small**: the filter believes the sensor more than it should. The gain is too large, and the estimate chases noise.
- $\mathbf{R}$ **too large**: the filter under-uses a good sensor. The estimate is smooth but lags, and the covariance is honest but gloomy.

The common real mistake is subtler: hiding a *bias* in $\mathbf{R}$. A slowly drifting offset is not white noise; inflating $\mathbf{R}$ to cover it gives a filter that is cautious on average and still wrong in the same direction all the time. The correct move is to estimate the bias as a state.

## What Q is, and why it is the tuning knob

$\mathbf{Q}$ is the covariance of the **process noise**, which means *everything the dynamics model leaves out*: an unmodeled push or twist, drag you are not computing, a thrust nobody told the filter about, the difference between the real gravity field and the one in the software. None of that can be measured on a bench. That is why $\mathbf{Q}$ is the main tuning knob of a working filter, and $\mathbf{R}$ usually is not.

Still, start right: ask what acceleration the model is *not* representing, in physical units, and build $\mathbf{Q}$ from that — not from a number that makes a plot look tidy.

The standard case is a **constant-velocity model**: the state is position and velocity, and an unknown random acceleration jiggles it. That acceleration is described by its **[[power spectral density|psd]]** $q$, in $\mathrm{m^2/s^3}$. Over one time step $\Delta t$ ("delta t"), the process noise works out to

$$\mathbf{Q} = q\begin{pmatrix}\Delta t^3/3 & \Delta t^2/2 \\ \Delta t^2/2 & \Delta t\end{pmatrix},$$

and $\sqrt{q/\Delta t}$ is the root-mean-square (typical) acceleration the filter is allowing for over one step. That gives you a sentence you can defend at a review: "I set $q$ so the filter allows for about two meters per second squared of unmodeled acceleration per cycle, which is the size of the thrust transients we do not model."

::: example Building Q from a physical number
A lander altimeter filter runs at $\Delta t = 0.1\,\mathrm{s}$ with $q = 0.5\,\mathrm{m^2/s^3}$.

**The entries.**
- Top left: $q\,\Delta t^3/3 = 0.5 \times 0.001 / 3 = 1.67\times10^{-4}\,\mathrm{m^2}$.
- Off-diagonal: $q\,\Delta t^2/2 = 0.5 \times 0.01 / 2 = 0.0025\,\mathrm{m^2/s}$.
- Bottom right: $q\,\Delta t = 0.5 \times 0.1 = 0.05\,\mathrm{m^2/s^2}$.

**The physical meaning.** $\sqrt{q/\Delta t} = \sqrt{0.5/0.1} = \sqrt{5} = 2.24\,\mathrm{m/s^2}$. This filter allows for a typical unmodeled acceleration of about $2.2\,\mathrm{m/s^2}$ each step — a bit over a fifth of Earth's gravity.

**Sanity check.** Units: $\mathrm{m^2/s^3} \times \mathrm{s^3} = \mathrm{m^2}$ for position, $\mathrm{m^2/s^3} \times \mathrm{s} = \mathrm{m^2/s^2}$ for velocity. And the velocity entry is far bigger than the position one, as it should be: a tenth of a second of random acceleration disturbs velocity directly but has barely begun to move the position.
:::

::: key What $\mathbf{Q}$ and $\mathbf{R}$ represent
$\mathbf{R}$ is the sensor's own noise covariance and is measurable on a bench; too small makes the estimate chase noise, too large wastes a good sensor. $\mathbf{Q}$ stands for everything the dynamics model leaves out and is not measurable, so it is the primary tuning knob. Too small: the covariance collapses, the gain goes to zero, and the filter ignores data it should be using — it diverges while its own reported uncertainty keeps shrinking. Too large: the estimate chases sensor noise the model should have smoothed away.
:::

## NEES: the test against truth

Now the test. Start with what "consistent" means. A filter is **consistent** when its true error really does have the spread its covariance claims. In symbols: the true error $\mathbf{e}_k = \mathbf{x}_{k,\mathrm{true}} - \hat{\mathbf{x}}_k^+$ follows $\mathcal{N}(\mathbf{0}, \mathbf{P}_k^+)$ — a bell curve centered on zero with covariance $\mathbf{P}_k^+$.

Here is the trick. Divide each error by the standard deviation the filter claimed for it. If the filter is honest, each piece becomes a "standard" bell-curve number — typical size $1$. This rescaling is called **[[whitening|whitening]]**. Square the pieces and add them up. A sum of $n$ squared standard bell-curve numbers has a famous, fully known distribution: **[[chi-squared|chi-squared]]** with $n$ **degrees of freedom**, written $\chi^2_n$ (said "kye-squared n"). Its average is exactly $n$, because each squared piece averages $1$.

For a full covariance, the matrix inverse does the dividing, and the result is

$$\mathrm{NEES}_k = \mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k \sim \chi^2_n, \qquad \mathbb{E}[\mathrm{NEES}_k] = n.$$

This is the **normalized estimation error squared**, NEES (said "neez"). The $\sim$ means "is distributed as", and $\mathbb{E}$ means "expected value", the long-run average.

NEES is the sharpest test there is, but it needs $\mathbf{x}_{\mathrm{true}}$, so it exists only in simulation. That is not a weakness; it is the reason a filter is checked in **[[Monte Carlo|monte-carlo-verification]]** simulation before it flies.

## NIS: the test that needs no truth

Apply the identical argument to the **innovation** instead of the state error. The innovation $\boldsymbol{\nu}_k$ ("nu") is what the sensor said minus what the filter expected, and the filter already predicts its covariance $\mathbf{S}_k$. For a consistent filter, $\boldsymbol{\nu}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{S}_k)$, so

$$\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k \sim \chi^2_m, \qquad \mathbb{E}[\mathrm{NIS}_k] = m,$$

where $m$ is the number of numbers in each measurement. This is the **normalized innovation squared**, NIS (said "niss").

Same algebra, different vector — but the practical difference is everything. The innovation and its covariance are built from the measurement $\mathbf{z}_k$ and the prediction $\hat{\mathbf{x}}_k^-$, and a flight computer has both in hand every cycle. **NIS is the consistency test that survives contact with a real vehicle.**

::: key NEES and NIS
$\mathrm{NEES}_k = \mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k \sim \chi^2_n$ with expected value $n$, the state dimension; needs truth, so simulation only. $\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k \sim \chi^2_m$ with expected value $m$, the measurement dimension; needs no truth, so it runs on flight data. Above the band means overconfident; below means conservative.
:::

## Turning it into a band

One chi-squared number is noisy. Even a perfectly honest filter will sometimes show a big one — like one rainy day on a 30% forecast. So you average over $r$ independent Monte Carlo runs. A sum of $r$ independent $\chi^2_n$ numbers is $\chi^2_{rn}$, so the $95\%$ **acceptance band** for the *average* is

$$\left[\frac{\chi^2_{rn}(0.025)}{r},\ \frac{\chi^2_{rn}(0.975)}{r}\right],$$

and the same with $n$ replaced by $m$ for NIS. Here $\chi^2_{rn}(0.025)$ is the value that a $\chi^2_{rn}$ number falls below only $2.5\%$ of the time. More runs squeeze the band toward the expected value, so the test gets *stricter* with more data, not looser.

Numbers worth carrying:

- One scalar measurement, one run ($m = 1$, $r = 1$): the band is $[0.00098,\ 5.024]$. That is enormous. It is why a single NIS value tells you almost nothing, and why **[[gating thresholds|gating]]** are set generously.
- $r = 300$ runs, $n = 2$ states: the NEES band is $[1.780,\ 2.233]$ around an expected $2$.
- $r = 300$ runs, $m = 1$: the NIS band is $[0.846,\ 1.166]$ around an expected $1$.

## The other test: whiteness

Being the right *size* is not the same as having no *pattern*. For a correct model, the innovations are also **white** — zero on average, and unrelated from one step to the next, like fair coin flips.

To check, compute the **[[autocorrelation|autocorrelation]]** at lag $\ell$ ("ell"): how much each innovation resembles the one $\ell$ steps later, on a scale from $-1$ to $1$. For a genuinely white sequence of length $N$, this number is roughly bell-shaped around zero with standard deviation $1/\sqrt{N}$. So the $95\%$ band is $\pm1.96/\sqrt{N}$.

Test two things separately, because they catch different defects:

- A nonzero **mean** innovation says the filter keeps predicting the measurement wrong in one direction — a bias, or a steady unmodeled acceleration.
- A nonzero **autocorrelation** that dies away slowly says there is a smooth, lasting effect the model is not tracking.

::: example Four filters, judged
The lander altimeter filter again. State: height and vertical speed, $(h, \dot h)$. Time step $\Delta t = 0.1\,\mathrm{s}$. Altimeter noise $\sigma = 1.5\,\mathrm{m}$. The simulated truth is driven by white acceleration with $q_{\mathrm{true}} = 0.5\,\mathrm{m^2/s^3}$. Three hundred independent runs of $150$ steps each, averaged over the settled stretch from step $50$ on. With $n = 2$ and $r = 300$ the NEES band is $[1.780,\ 2.233]$; with $m = 1$ the NIS band is $[0.846,\ 1.166]$.

| Filter | Mean NEES | Mean NIS | Verdict |
| --- | --- | --- | --- |
| Nominal, $q = 0.5$ | $1.997$ | $1.000$ | Both inside the band |
| $q = 0.005$, a hundred times too small | $83.92$ | $1.937$ | Both far above — overconfident |
| $q = 50$, a hundred times too large | $1.096$ | $0.865$ | NEES far below; NIS barely inside |
| $q = 0.5$ with an unmodeled $-3\,\mathrm{m/s^2}$ | $21.98$ | $2.821$ | Both far above |

**The under-tuned filter is caught by both tests, and NEES shouts louder.** A mean NEES of $83.92$ against an expected $2$ means the squared error is $83.92/2 \approx 42$ times what the filter claims. Taking the square root, $\sqrt{42} \approx 6.5$: the estimate sits about six and a half claimed standard deviations from the truth, all the time, while the filter reports shrinking uncertainty.

**The over-tuned filter is caught sharply by NEES and barely by NIS.** $1.096$ is far below the NEES band. But $0.865$ sits barely inside the NIS band's lower edge of $0.846$. The reason is built in: $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ contains the measurement noise, which did not change. So inflating $\mathbf{Q}$ moves $\mathbf{S}$ proportionally less than it moves $\mathbf{P}$. This is a real limit of the truth-free test, and exactly why NEES is run in simulation before flight.

**The unmodeled acceleration looks like under-tuning, but the right response is different.** On one $400$-step record, the whiteness band is $\pm1.96/\sqrt{400} = \pm1.96/20 = \pm0.098$. The under-tuned filter's innovation autocorrelation is $0.417$ at lag one and still $0.325$ at lag ten — far outside the band and fading slowly, the sign of a smooth effect being missed. The unmodeled-acceleration case instead shows a mean innovation of $-2.21\,\mathrm{m}$ (the nominal filter's is $-0.014\,\mathrm{m}$), with autocorrelations inside the band once that mean is removed. A steady acceleration makes a steady offset, not a wandering one. Two signatures, two diagnoses, and only the first is fixed by raising $\mathbf{Q}$.
:::

## A tuning procedure you can defend

1. **Fix $\mathbf{R}$ from the sensor**, not from the filter's behavior: bench data, Allan deviation, calibration leftovers. Write down where each number came from.
2. **Start $\mathbf{Q}$ from a physical argument** — the size of the acceleration, torque or force the model is not representing — not from what makes the output look smooth.
3. **Run NEES in Monte Carlo** against a truth model that is deliberately *[[not the filter's model|different-truth]]*. A filter tested against its own assumptions will always pass and will have proved nothing.
4. **Run NIS, the innovation mean and the innovation autocorrelation on real data.** These three are what you will have in flight.
5. **Read the direction of the failure.** Above the band: the filter is overconfident. Its assumed noise is smaller than reality, and it will reject good measurements and report unearned precision. Below the band: it is conservative — safe, but under-using the information it has.
6. **Diagnose before you tune.** If the innovations are patterned and fade slowly, or their mean is not zero, the problem is a missing state, not a wrong number. Add the bias, the drag coefficient, the leftover acceleration. Inflating $\mathbf{Q}$ is the fix for truly patternless model error, and a patch for everything else.

::: warning Tuning until the plots look good is not tuning
The failure this procedure prevents is adjusting $\mathbf{Q}$ and $\mathbf{R}$ until the estimate looks smooth, then calling the filter tuned. A smooth estimate comes from a large $\mathbf{R}$ or a small $\mathbf{Q}$. Both make the filter trust its model more — exactly the direction that produces a confident, wrong filter. Smoothness is a sign of low gain, not evidence of accuracy, and the consistency statistics exist because the eye cannot tell the two apart.
:::

::: example "Your filter's NIS runs consistently high. Walk me through it."
**A weak answer:** "High NIS means the innovations are bigger than expected, so the filter is overconfident. I would increase $\mathbf{Q}$ until it comes back inside the bounds."

The first sentence is right. The second is the reflex that buries a real modeling error under a bigger noise number.

**A strong answer:**

"High NIS means the innovations are larger than $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ says they should be. So either the covariance is too small or the predictions are wrong — different problems. Before touching a number, I would look at two more statistics I already have.

The innovation mean. If it is not zero, the filter predicts the measurement wrong in a consistent direction. That is a bias or an unmodeled force, not a noise level. On a descent, I would expect an unmodeled acceleration of a few meters per second squared to show as an innovation mean of a couple of meters, with NIS around three against an expected one.

The innovation autocorrelation. If it is large at lag one and still large at lag ten, there is a smooth effect the model is not tracking. Genuine unmodeled noise gives white residuals of the wrong size; a missing state gives correlated residuals.

If both are clean and only the size is wrong, then $\mathbf{Q}$ or $\mathbf{R}$ really does understate reality, and I would raise the one I can justify. I would check $\mathbf{R}$ first, because it is measurable, and a wrong $\mathbf{R}$ means someone's bench characterization was wrong — worth knowing.

If either is dirty, the fix is a state, not a number: estimate the bias, the drag coefficient, the leftover acceleration. Raising $\mathbf{Q}$ to cover a structured error does make the statistic pass — by making the filter uncertain about everything instead of correcting the one thing that is wrong. The estimate gets worse and the test stops complaining, the worst combination there is.

Last: NEES in simulation. If the covariance really is too small, NEES shows it far more sharply than NIS, because $\mathbf{S}$ contains $\mathbf{R}$ and so is less sensitive to a mistuned $\mathbf{Q}$ than $\mathbf{P}$ is."

**What the interviewer learns:** the candidate treats the statistic as evidence, not a target; uses two more statistics from the same data, each with its own diagnosis; prefers a structural fix to a numerical one; and knows why the two tests differ in sensitivity.
:::

## Check yourself

::: check
Define NEES and NIS, give the distribution and expected value of each, and say why only one of them can be computed in flight.
:::

::: answer
$\mathrm{NEES}_k = \mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k$, with $\mathbf{e}_k = \mathbf{x}_{k,\mathrm{true}} - \hat{\mathbf{x}}_k^+$. It is distributed $\chi^2_n$, with expected value $n$, the state dimension.

$\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$. It is distributed $\chi^2_m$, with expected value $m$, the measurement dimension.

NEES needs the true state, which exists only in simulation. NIS is built from the measurement and the filter's own prediction, which a flight computer holds every cycle, so it is the test that runs on real telemetry.
:::

::: check
A filter's averaged NEES over $300$ runs comes out at $84$ for a two-state system. Translate that into a statement about how far the estimate is from the truth in units the filter reports.
:::

::: answer
The expected value is $n = 2$. So a NEES of $84$ means the normalized squared error is $84/2 = 42$ times what an honest filter would produce.

NEES is a *squared* quantity, so take the square root to get back to standard deviations: $\sqrt{42} \approx 6.5$. The estimate sits about six and a half reported standard deviations from the truth, on average, all the time. A filter reporting a one-meter uncertainty is about six and a half meters out.

That is the precise sense in which an under-tuned filter is "confident and wrong": not merely inaccurate, but inaccurate by a margin its own covariance calls essentially impossible.
:::

::: check
Why does an over-tuned filter (with $\mathbf{Q}$ far too large) show up much more clearly in NEES than in NIS?
:::

::: answer
NEES divides by $\mathbf{P}^+$, which $\mathbf{Q}$ affects directly and strongly. NIS divides by $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, which contains the measurement noise covariance as an added term that $\mathbf{Q}$ does not touch.

When the prior is already fairly sharp, $\mathbf{R}$ is a large share of $\mathbf{S}$. So inflating $\mathbf{Q}$ a hundredfold changes $\mathbf{S}$ by much less than it changes $\mathbf{P}$.

In the worked example, a hundredfold over-tuning put the mean NEES at $1.096$, far below its band of $[1.780,\ 2.233]$, while the mean NIS was $0.865$, barely inside its band of $[0.846,\ 1.166]$. That is the concrete reason to run NEES in simulation rather than rely on the flight-available test alone.
:::

::: check
Two filters both fail their NIS test high. One has strongly autocorrelated innovations that decay slowly; the other has innovations that are white but whose mean is definitely nonzero. Give the diagnosis and the remedy for each.
:::

::: answer
**Slowly fading autocorrelation:** there is a smooth, lasting effect the model is not tracking, and the residuals carry information the filter has not used — a wandering bias, a drag term, a slow thermal drift. The remedy is a state: estimate the thing, with dynamics that match how slowly it changes, instead of covering it with noise.

**White innovations with a nonzero mean:** the prediction is wrong in a *fixed* direction, not a wandering one — a constant unmodeled acceleration, a sensor offset, a frame or **[[lever-arm|lever-arm]]** error. The remedy is again a state, but a different one: a constant bias or a constant acceleration.

In both cases, raising $\mathbf{Q}$ would make the statistic pass and leave the estimate worse, because it widens the filter's uncertainty about everything instead of fixing the one thing that is wrong.
:::

::: check
Why does the acceptance band for an averaged consistency statistic get narrower as you run more Monte Carlo trials, and what does that mean for a filter that "passed" on five runs?
:::

::: answer
Averaging $r$ independent $\chi^2_n$ numbers gives $\chi^2_{rn}/r$. Its mean stays at $n$, but its standard deviation falls as $1/\sqrt{r}$. So the band tightens around $n$ and the test gets stricter — more data, less room to hide.

A filter that passed on five runs was tested against a wide band. For a scalar measurement, five runs give a NIS band of about $[0.166,\ 2.567]$ — a filter off by a factor of two could land inside it. With one run the band is $[0.00098,\ 5.024]$ around an expected $1$. Passing that is close to no evidence at all. The claim "consistent" needs enough runs that the band is tight, which in practice means hundreds.
:::

## Summary

| Item | Content |
| --- | --- |
| $\mathbf{R}$ | Sensor noise covariance; measurable on a bench; too small chases noise, too large wastes the sensor |
| $\mathbf{Q}$ | Everything the dynamics model omits; not measurable; the primary tuning knob |
| Discrete $\mathbf{Q}$, constant velocity | $Q_{11} = q\Delta t^3/3$, $Q_{12} = Q_{21} = q\Delta t^2/2$, $Q_{22} = q\Delta t$; $\sqrt{q/\Delta t}$ is the RMS unmodeled acceleration per step |
| NEES | $\mathbf{e}^{\mathsf{T}}(\mathbf{P}^+)^{-1}\mathbf{e} \sim \chi^2_n$, expected $n$; needs truth |
| NIS | $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu} \sim \chi^2_m$, expected $m$; needs no truth |
| Acceptance band | $[\chi^2_{rn}(0.025)/r,\ \chi^2_{rn}(0.975)/r]$; narrows with more runs |
| Worked bands | $n=2$, $r=300$: $[1.780, 2.233]$. $m=1$, $r=300$: $[0.846, 1.166]$. $m=1$, $r=1$: $[0.00098, 5.024]$ |
| Whiteness | Innovation autocorrelation band $\pm1.96/\sqrt{N}$; test the mean separately from the correlation |
| Above the band | Overconfident: assumed noise smaller than reality; rejects good data, reports unearned precision |
| Below the band | Conservative: assumed noise larger than reality; safe but under-using the information |
| The discipline | Diagnose before tuning; structured residuals mean a missing state, not a bigger $\mathbf{Q}$ |

The next lesson leaves filtering for the other estimation subject this module names: attitude determination from vector observations, stated as Wahba posed it, and the four solutions an interviewer expects you to be able to name and tell apart.

::: context collision-probability Why the covariance decides a dodge
When two satellites are predicted to pass close, operators work out the **probability of collision** from the two position estimates *and their covariances*. The same predicted miss distance can mean a tiny risk or a serious one, depending on how uncertain the positions are. A covariance that is too small can make a real risk look negligible — or, with a small miss distance, make a harmless pass look alarming and trigger a maneuver that burns fuel for nothing. Either way, the decision is only as good as the covariance.
:::

::: context allan-deviation Allan deviation
David Allan developed this measure in the 1960s to describe the stability of atomic clocks, and it is now standard for gyros and accelerometers. You average the sensor output over windows of length $\tau$ and ask how much neighboring averages differ. Plotted on log-log axes, it makes a rough "V". On the left, averaging longer helps (white noise, slope $-1/2$). At the bottom it flattens (bias instability). On the right, averaging longer hurts, because a slow wander takes over (slope $+1/2$).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="14" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="190" font-size="12" fill="#1f2a44">log τ</text>
  <text x="8" y="24" font-size="12" fill="#1f2a44">log σ</text>
  <polyline points="50,40 150,90 170,96 190,98 210,96 230,90 330,40" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <text x="50" y="128" font-size="12" fill="#1f2a44">white noise</text>
  <text x="50" y="143" font-size="12" fill="#1f2a44">slope −1/2</text>
  <text x="190" y="122" font-size="12" fill="#1f2a44" text-anchor="middle">bias instability</text>
  <text x="256" y="128" font-size="12" fill="#1f2a44">random walk</text>
  <text x="256" y="143" font-size="12" fill="#1f2a44">slope +1/2</text>
</svg>
```

The white part on the left is what belongs in a noise covariance; the slow parts are candidates for bias states.
:::

::: context psd Power spectral density, in plain words
White noise has no single size at an instant — it is infinitely jumpy — so engineers describe how strong it is per unit of frequency instead. That is the **power spectral density**. For acceleration noise, $q$ in $\mathrm{m^2/s^3}$ says how much velocity variance piles up per second: after $t$ seconds of this noise, the velocity variance has grown by $q\,t$. That is why the bottom-right entry of $\mathbf{Q}$ is $q\,\Delta t$.
:::

::: context whitening Whitening: squash the ellipse into a circle
A covariance can be pictured as an ellipse of uncertainty, stretched along the uncertain directions. Whitening rescales space so that ellipse becomes a circle of radius one. After that, every direction counts equally, and the squared distance from the center is the NEES or NIS.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <ellipse cx="85" cy="70" rx="70" ry="28" transform="rotate(-20 85 70)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="85" cy="70" r="3" fill="#1f2a44"/>
  <line x1="165" y1="70" x2="205" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="213,70 203,64 203,76" fill="#1f2a44"/>
  <text x="189" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">whiten</text>
  <circle cx="285" cy="70" r="40" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="285" cy="70" r="3" fill="#1f2a44"/>
  <text x="85" y="135" font-size="12" fill="#1f2a44" text-anchor="middle">error cloud, covariance P</text>
  <text x="285" y="135" font-size="12" fill="#1f2a44" text-anchor="middle">every direction size 1</text>
</svg>
```
:::

::: context chi-squared Where chi-squared comes from
Karl Pearson named and used this distribution around 1900 to test whether data fit a theory. The Greek letter $\chi$ is "chi", said "kye" (rhymes with "sky"). The "degrees of freedom" are how many independent squared pieces were added. With one piece the distribution is lopsided, with most values near zero and a long tail. With many pieces it becomes nearly a bell curve centered on the number of pieces. That is why averaging hundreds of runs gives a tight, symmetric band.
:::

::: context monte-carlo-verification How flight filters are checked
Before flight, GNC teams run the navigation software thousands of times in simulation, each run with randomly varied starting errors, sensor noise, winds, engine performance and so on — the "dispersions". Because the simulation knows the truth, NEES can be computed for every run. Landers, rockets and spacecraft are typically verified this way, and a filter that fails its consistency checks in Monte Carlo does not fly until the cause is understood.
:::

::: context gating Gating, and why it is generous
A measurement gate throws out a measurement whose NIS is too large to be believable. Since a single honest NIS for a scalar measurement lands above $5.024$ about one time in forty, a gate set there would throw away one good measurement in forty. So real gates are set further out — the $99\%$ or $99.9\%$ point, or higher — to reject only measurements that are almost surely broken. Lesson 7 used the gate against outliers.
:::

::: context autocorrelation Does today predict tomorrow?
**Autocorrelation** asks: if this innovation was positive, is the next one likely to be positive too? For coin flips, no — the autocorrelation is about zero. For daily temperatures, yes — a hot day tends to follow a hot day, so the autocorrelation is high. Innovations from a correct filter should behave like coin flips. If they behave like temperatures, something smooth is being missed.
:::

::: context different-truth Why the truth model must differ
If the simulation that makes the "truth" uses exactly the filter's own model and noise assumptions, the filter is being graded against the answer key it wrote. It will pass, and the pass means nothing. The truth model should be richer: a fuller gravity field, real drag, sensor biases and errors the filter does not know about. People working on inverse problems have a name for the mistake of testing a method on data made with its own model: the "inverse crime".
:::

::: context lever-arm Lever-arm errors
A **lever arm** is the offset between where a sensor is mounted and the point the filter tracks, such as the vehicle's center of mass. If a GPS antenna sits two meters from the center of mass and the filter forgets that offset, every measurement is off by a fixed amount in the vehicle's frame. When the vehicle turns, the error shows up as a pattern tied to its attitude. Fixed errors like this produce the nonzero innovation mean the lesson describes.
:::
