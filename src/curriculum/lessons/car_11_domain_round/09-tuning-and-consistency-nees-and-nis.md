---
id: l09-tuning-and-consistency-nees-and-nis
title: "Tuning and consistency: Q, R, NEES and NIS"
minutes: 20
covers:
  - "filter tuning and consistency: process noise, measurement noise, NEES and NIS"
---

A filter that tracks well is not the same thing as a filter that is right. "Tracks well" is a statement about the estimate; "right" is a statement about the covariance, and the covariance is what everything downstream — a gate, a guidance decision, a collision probability, an abort criterion — actually consumes. A filter whose estimate is good and whose covariance is a factor of five too small is a filter that will reject a perfectly good measurement, or report a miss distance with confidence it has not earned.

So the domain round asks two things here. What are $\mathbf{Q}$ and $\mathbf{R}$, really — where do the numbers come from and what happens when each is wrong. And how do you *test* a filter's covariance, on real data, with no truth available. The second question has an exact answer, it is short, and a candidate who can give it has demonstrated something that separates them from most of the field.

## What R is, and where its numbers come from

$\mathbf{R}$ is the covariance of the measurement noise: the sensor's own error, in the units of what it reports. It is the one of the two that is genuinely **measurable**. Put the sensor on a bench with a known reference, collect a long record, and the variance of the residual is $\mathbf{R}$. For an inertial sensor the Allan deviation curve separates the white part from the slowly wandering part, and only the white part belongs in $\mathbf{R}$. For a star tracker it comes from the centroiding accuracy and the catalogue; for a ranging system, from the ranging jitter plus whatever calibration residual is left.

Two failure modes. If $\mathbf{R}$ is **too small**, the filter believes the sensor more than it should, the gain is too large, and the estimate chases noise. If $\mathbf{R}$ is **too large**, the filter under-uses a good sensor: the estimate is smooth, lags, and the covariance is honest but pessimistic.

The common real error is subtler: putting a *bias* into $\mathbf{R}$. A slowly drifting sensor offset is not white noise, and inflating $\mathbf{R}$ to cover it produces a filter that is conservative on average and still wrong in the same direction all the time. The correct move is to estimate the bias as a state.

## What Q is, and why it is the tuning knob

$\mathbf{Q}$ is the covariance of the process noise, which means **everything the dynamics model leaves out**: an unmodelled acceleration, an unmodelled torque, drag you are not computing, a thrust you are not told about, the difference between the real gravity field and the one in the software. None of that is measurable on a bench, which is why $\mathbf{Q}$ is the primary tuning knob of a working filter and $\mathbf{R}$ usually is not.

There is still a right way to start. Ask what acceleration the model is not representing, in physical units, and build $\mathbf{Q}$ from that rather than from a number that makes a plot look tidy. For a constant-velocity model driven by white acceleration of power spectral density $q$ (in $\mathrm{m^2/s^3}$ for a position–velocity state), the standard discrete form over a step $\Delta t$ is

$$\mathbf{Q} = q\begin{pmatrix}\Delta t^3/3 & \Delta t^2/2 \\ \Delta t^2/2 & \Delta t\end{pmatrix},$$

and $\sqrt{q/\Delta t}$ is the root-mean-square acceleration the filter is allowing for over one step. That gives you a sentence to defend at a review: "I set $q$ so the filter allows for about two metres per second squared of unmodelled acceleration per cycle, which is the size of the thrust transients we do not model."

::: key What $\mathbf{Q}$ and $\mathbf{R}$ represent
$\mathbf{R}$ is the sensor's own noise covariance and is measurable on a bench; too small makes the estimate chase noise, too large wastes a good sensor. $\mathbf{Q}$ stands for everything the dynamics model leaves out and is not measurable, so it is the primary tuning knob. Too small: the covariance collapses, the gain goes to zero, and the filter ignores data it should be using — it diverges while its own reported uncertainty keeps shrinking. Too large: the estimate chases sensor noise the model should have smoothed away.
:::

## NEES: the test against truth

For a consistent filter, the true error $\mathbf{e}_k = \mathbf{x}_{k,\mathrm{true}} - \hat{\mathbf{x}}_k^+$ is distributed as $\mathcal{N}(\mathbf{0}, \mathbf{P}_k^+)$ — that is what "consistent" means. Whiten it by $\mathbf{P}^+$ and the squared norm of the result is a sum of $n$ squared independent standard normals, which is a chi-squared variable with $n$ degrees of freedom:

$$\mathrm{NEES}_k = \mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k \sim \chi^2_n, \qquad \mathbb{E}[\mathrm{NEES}_k] = n.$$

This is the **normalised estimation error squared**. It is the sharpest test there is, and it needs $\mathbf{x}_{\mathrm{true}}$, so it exists only in simulation. That is not a limitation to apologise for: it is the reason a filter is verified in Monte Carlo before it flies.

## NIS: the test that needs no truth

Apply the identical argument to the innovation instead of the state error. For a consistent filter $\boldsymbol{\nu}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{S}_k)$, so

$$\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k \sim \chi^2_m, \qquad \mathbb{E}[\mathrm{NIS}_k] = m,$$

with $m$ the measurement dimension. The algebra is the same; only the vector being whitened changes. The practical difference is everything: the innovation and its covariance are built from $\mathbf{z}_k$ and $\hat{\mathbf{x}}_k^-$, both of which a flight computer has in hand at every cycle. **NIS is the consistency test that survives contact with a real vehicle.**

::: key NEES and NIS
$\mathrm{NEES}_k = \mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k \sim \chi^2_n$ with expected value $n$, the state dimension; needs truth, so simulation only. $\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k \sim \chi^2_m$ with expected value $m$, the measurement dimension; needs no truth, so it runs on flight data. Above the band means overconfident; below means conservative.
:::

## Turning it into a band

A single draw from a chi-squared distribution is noisy — a perfectly consistent filter will occasionally show a large one. The standard practice is to average over $r$ independent Monte Carlo runs. Since a sum of $r$ independent $\chi^2_n$ variables is $\chi^2_{rn}$, the $95\%$ acceptance interval for the *average* is

$$\left[\frac{\chi^2_{rn}(0.025)}{r},\ \frac{\chi^2_{rn}(0.975)}{r}\right],$$

and the same with $n \to m$ for NIS. More runs narrow the band around the expected value, so the test gets *more* demanding with more data, not less.

Some numbers worth carrying. For a single scalar measurement, $m = 1$ and $r = 1$, the two-sided $95\%$ band is $[0.00098,\ 5.024]$ — enormous, which is why a single NIS value tells you almost nothing and why gating thresholds are set generously. For $r = 300$ runs with $n = 2$ states the NEES band is $[1.780,\ 2.233]$ around an expected $2$; with $m = 1$ the NIS band is $[0.846,\ 1.166]$ around an expected $1$.

## The other test: whiteness

Consistency in magnitude is not the same as absence of structure. For a correct model the innovation sequence is not only the right size, it is **white** — zero-mean, and uncorrelated from one step to the next. The sample autocorrelation at lag $\ell$ of a genuinely white sequence of length $N$ is approximately normal with standard deviation $1/\sqrt{N}$, giving a $95\%$ band of $\pm1.96/\sqrt{N}$.

Two distinct things to test, because they catch different defects. A nonzero **mean** innovation says the filter is consistently predicting the measurement wrong in one direction — a bias, or a steady unmodelled acceleration. A nonzero **autocorrelation** that decays slowly says there is a smooth, persistent effect the model is not tracking. A defect can show in one and not the other.

::: example Four filters, judged
A lander altimeter filter: state $(h, \dot h)$, $\Delta t = 0.1\,\mathrm{s}$, altimeter noise $\sigma = 1.5\,\mathrm{m}$, truth driven by white acceleration of PSD $q_{\mathrm{true}} = 0.5\,\mathrm{m^2/s^3}$. Three hundred independent runs of $150$ steps each, averaged over the settled window from step $50$ onward. With $n = 2$ and $r = 300$ the NEES band is $[1.780,\ 2.233]$; with $m = 1$ the NIS band is $[0.846,\ 1.166]$.

| Filter | Mean NEES | Mean NIS | Verdict |
| --- | --- | --- | --- |
| Nominal, $q = 0.5$ | $1.997$ | $1.000$ | Both inside the band |
| $q = 0.005$, a hundred times too small | $83.92$ | $1.937$ | Both far above — overconfident |
| $q = 50$, a hundred times too large | $1.096$ | $0.865$ | NEES far below; NIS barely inside |
| $q = 0.5$ with an unmodelled $-3\,\mathrm{m/s^2}$ | $21.98$ | $2.821$ | Both far above |

Three readings worth taking from this table.

**The under-tuned filter is caught by both tests, and NEES is the more dramatic.** A mean NEES of $83.92$ against an expected $2$ means the true error is, in normalised terms, about forty times the variance the filter is reporting — the estimate is roughly six and a half standard deviations from the truth, continuously, while the filter reports shrinking uncertainty.

**The over-tuned filter is caught sharply by NEES and barely by NIS.** $1.096$ is decisively below the NEES band, but $0.865$ sits just inside the NIS band's lower edge. The reason is structural: $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ contains the measurement noise, which is unchanged, so inflating $\mathbf{Q}$ moves $\mathbf{S}$ proportionally less than it moves $\mathbf{P}$. This is a real limitation of the truth-free test and it is exactly why NEES is run in simulation before the filter flies.

**The unmodelled acceleration produces the same signature as under-tuning, and the right response is different.** On a single $400$-step record the whiteness band is $\pm1.96/\sqrt{400} = \pm0.098$. The under-tuned filter's innovation autocorrelation is $0.417$ at lag one and still $0.325$ at lag ten — far outside the band, decaying slowly, the signature of a smooth effect being missed. The unmodelled-acceleration case instead shows a mean innovation of $-2.21\,\mathrm{m}$ against the nominal filter's $-0.014\,\mathrm{m}$, with autocorrelations inside the band once the mean is removed: a steady acceleration produces a steady offset rather than a wandering one. Two different signatures, two different diagnoses, and only the first is fixed by raising $\mathbf{Q}$.
:::

## A tuning procedure you can defend

1. **Fix $\mathbf{R}$ from the sensor**, not from the filter's behaviour. Bench data, Allan deviation, calibration residuals. Write down where each number came from.
2. **Start $\mathbf{Q}$ from a physical argument** — the size of the acceleration, torque or force the model is not representing — rather than from what makes the output look smooth.
3. **Run NEES in Monte Carlo** against a truth model that is deliberately *not* the filter's model. A filter tested against its own assumptions will always pass and will have proved nothing.
4. **Run NIS, the innovation mean and the innovation autocorrelation on real data.** These are the three you will have in flight.
5. **Read the direction of the failure.** Above the band: the filter is overconfident, its assumed noise is smaller than reality, and it will reject good measurements and report unearned precision. Below the band: it is conservative, safe, and under-using the information it has.
6. **Diagnose before you tune.** If the innovations are non-white with a slow decay, or their mean is not zero, the problem is a missing state and not a wrong number. Add the bias, the drag coefficient, the residual acceleration. Inflating $\mathbf{Q}$ is the remedy for genuinely unstructured model error and a patch for everything else.

::: warning Tuning until the plots look good is not tuning
The failure this procedure exists to prevent is adjusting $\mathbf{Q}$ and $\mathbf{R}$ until the estimate looks smooth, then declaring the filter tuned. A smooth estimate is produced by a large $\mathbf{R}$ or a small $\mathbf{Q}$, both of which make the filter trust its model more — which is precisely the direction that produces a confident, wrong filter. Smoothness is a symptom of low gain, not evidence of accuracy, and the consistency statistics exist because the eye cannot tell the two apart.
:::

::: example "Your filter's NIS runs consistently high. Walk me through it."
**A weak answer:** "High NIS means the innovations are bigger than expected, so the filter is overconfident. I would increase $\mathbf{Q}$ until it comes back inside the bounds."

The first sentence is right. The second is a reflex, and it is the reflex that buries a real modelling error under a bigger noise number.

**A strong answer:**

"High NIS means the innovations are larger than $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ says they should be, so either the filter's covariance is too small or its predictions are wrong, and those are different problems. Before touching a number I would look at two more statistics I already have.

The innovation mean. If it is not zero, the filter is predicting the measurement wrong in a consistent direction, and that is a bias or an unmodelled force, not a noise level. In a case I would expect to see on a descent, an unmodelled acceleration of a few metres per second squared shows as an innovation mean of a couple of metres with NIS around three against an expected one.

The innovation autocorrelation. If it is large at lag one and still large at lag ten, decaying slowly, there is a smooth effect the model is not tracking. Genuine unmodelled noise gives white residuals of the wrong size; a missing state gives correlated residuals.

If both of those are clean and only the magnitude is wrong, then the problem really is that $\mathbf{Q}$ or $\mathbf{R}$ understates reality and I would raise the one I can justify — and I would check $\mathbf{R}$ first, because $\mathbf{R}$ is measurable and a wrong $\mathbf{R}$ means someone's bench characterisation was wrong, which is worth knowing.

If either of them is dirty, the fix is a state, not a number: estimate the bias, the drag coefficient, the residual acceleration. Raising $\mathbf{Q}$ to cover a structured error does make the statistic pass, and it does it by making the filter uncertain about everything instead of correcting the one thing that is wrong. The estimate gets worse and the test stops complaining, which is the worst combination available.

Last check: NEES in simulation. If the covariance is genuinely too small, NEES will show it far more sharply than NIS does, because $\mathbf{S}$ contains $\mathbf{R}$ and is therefore less sensitive to a mistuned $\mathbf{Q}$ than $\mathbf{P}$ is."

**What the interviewer learns:** the candidate treats the statistic as one piece of evidence rather than a target to optimise, names two other statistics available from the same data, gives the distinct diagnosis each one supports, prefers a structural fix to a numerical one, and knows the sensitivity difference between the two consistency tests.
:::

## Check yourself

::: check
Define NEES and NIS, give the distribution and expected value of each, and say why only one of them can be computed in flight.
:::

::: answer
$\mathrm{NEES}_k = \mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k$, distributed $\chi^2_n$ with expected value $n$, the state dimension; $\mathbf{e}_k = \mathbf{x}_{k,\mathrm{true}} - \hat{\mathbf{x}}_k^+$. $\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$, distributed $\chi^2_m$ with expected value $m$, the measurement dimension. NEES requires the true state, which exists only in simulation. NIS is built from the measurement and the filter's own prediction, both of which a flight computer holds at every cycle, so it is the test that runs on real telemetry.
:::

::: check
A filter's averaged NEES over $300$ runs comes out at $84$ for a two-state system. Translate that into a statement about how far the estimate is from the truth in units the filter reports.
:::

::: answer
The expected value is $n = 2$, so a NEES of $84$ means the normalised squared error is about $42$ times what a consistent filter would produce. Since NEES is a squared quantity, the error in units of the reported standard deviation is roughly $\sqrt{84/2} \approx 6.5$: the estimate sits about six and a half reported standard deviations from the truth, on average, continuously. A filter reporting a one-metre uncertainty is therefore about six and a half metres out. That is the specific sense in which an under-tuned filter is "confident and wrong" — not merely inaccurate, but inaccurate by a margin its own covariance declares essentially impossible.
:::

::: check
Why does an over-tuned filter (with $\mathbf{Q}$ far too large) show up much more clearly in NEES than in NIS?
:::

::: answer
NEES normalises by $\mathbf{P}^+$, which is affected by $\mathbf{Q}$ directly and strongly. NIS normalises by $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, which contains the measurement noise covariance as an additive term that $\mathbf{Q}$ does not touch. When the prior is already reasonably sharp, $\mathbf{R}$ is a large fraction of $\mathbf{S}$, so inflating $\mathbf{Q}$ by a factor of a hundred changes $\mathbf{S}$ by much less than it changes $\mathbf{P}$. In the worked example a hundredfold over-tuning put the mean NEES at $1.096$, decisively below its band of $[1.780,\ 2.233]$, while the mean NIS was $0.865$, just inside its band of $[0.846,\ 1.166]$. This is the concrete reason to run NEES in simulation rather than relying on the flight-available test alone.
:::

::: check
Two filters both fail their NIS test high. One has strongly autocorrelated innovations that decay slowly; the other has innovations that are white but whose mean is clearly nonzero. Give the diagnosis and the remedy for each.
:::

::: answer
Slowly decaying autocorrelation means there is a smooth, persistent effect the model is not tracking, and the residuals are carrying information the filter has not used — a wandering bias, a drag term, a slow thermal drift. The remedy is a state: estimate the thing, with dynamics appropriate to its correlation time, rather than covering it with noise. White innovations with a nonzero mean mean the prediction is wrong in a fixed direction rather than in a wandering one — a constant unmodelled acceleration, a sensor offset, a frame or lever-arm error. The remedy is again a state, but a different one: a constant bias or a constant acceleration. In both cases raising $\mathbf{Q}$ would make the statistic pass while leaving the estimate worse, because it widens the filter's uncertainty about everything instead of correcting the one thing that is wrong.
:::

::: check
Why does the acceptance band for an averaged consistency statistic get narrower as you run more Monte Carlo trials, and what does that mean for a filter that "passed" on five runs?
:::

::: answer
Averaging $r$ independent $\chi^2_n$ draws gives $\chi^2_{rn}/r$, whose standard deviation falls as $1/\sqrt{r}$ while its mean stays at $n$. So the band tightens around $n$ and the test becomes more demanding, not less — more data means less room to hide. A filter that passed on five runs has been tested against a band so wide that a badly mistuned filter could easily fall inside it: for a single scalar measurement and one run, the two-sided $95\%$ band runs from $0.00098$ to $5.024$ around an expected value of $1$. Passing that is close to no evidence at all. The claim "consistent" needs enough runs that the band is tight, which in practice means hundreds.
:::

## Summary

| Item | Content |
| --- | --- |
| $\mathbf{R}$ | Sensor noise covariance; measurable on a bench; too small chases noise, too large wastes the sensor |
| $\mathbf{Q}$ | Everything the dynamics model omits; not measurable; the primary tuning knob |
| Discrete $\mathbf{Q}$, constant velocity | $Q_{11} = q\Delta t^3/3$, $Q_{12} = Q_{21} = q\Delta t^2/2$, $Q_{22} = q\Delta t$; $\sqrt{q/\Delta t}$ is the RMS unmodelled acceleration per step |
| NEES | $\mathbf{e}^{\mathsf{T}}(\mathbf{P}^+)^{-1}\mathbf{e} \sim \chi^2_n$, expected $n$; needs truth |
| NIS | $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu} \sim \chi^2_m$, expected $m$; needs no truth |
| Acceptance band | $[\chi^2_{rn}(0.025)/r,\ \chi^2_{rn}(0.975)/r]$; narrows with more runs |
| Worked bands | $n=2$, $r=300$: $[1.780, 2.233]$. $m=1$, $r=300$: $[0.846, 1.166]$. $m=1$, $r=1$: $[0.00098, 5.024]$ |
| Whiteness | Innovation autocorrelation band $\pm1.96/\sqrt{N}$; test the mean separately from the correlation |
| Above the band | Overconfident: assumed noise smaller than reality; rejects good data, reports unearned precision |
| Below the band | Conservative: assumed noise larger than reality; safe but under-using the information |
| The discipline | Diagnose before tuning; structured residuals mean a missing state, not a bigger $\mathbf{Q}$ |

The next lesson leaves filtering for the other estimation subject this module names: attitude determination from vector observations, stated as Wahba posed it, and the four solutions an interviewer expects you to be able to name and distinguish.
