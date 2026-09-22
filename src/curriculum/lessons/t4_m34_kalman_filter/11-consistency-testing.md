---
id: l11-consistency-testing
title: 'Consistency testing: innovation whiteness, NEES and NIS'
minutes: 25
covers:
  - 'Consistency testing: innovation whiteness, NEES and NIS chi-square tests, innovation autocorrelation'
---

Every diverging filter in the last two lessons was caught by an author who already knew the answer — the truth was simulated, the wrong $\mathbf{Q}$ was chosen on purpose, the eigenvalue was checked because the story needed it checked. A flight team looking at real telemetry has none of that. They have a stream of numbers a filter is confidently reporting, and the only honest question is: does this filter's covariance mean what it claims to mean? This lesson turns that question into an actual statistical test — several of them — built entirely from the probability module's chi-square distribution, applied to quantities this module has been computing since the third lesson.

The tests below are not a new filter technique. They consume a filter's output and return a verdict, the way a code review consumes a program and returns a list of bugs rather than new features. Every filter this module has diverged on purpose in the last two lessons gets tested properly for the first time in this lesson, and at least one of them fails in exactly the way its designer, working only from the numbers a real flight computer would report, ought to be able to catch.

## Whiteness of the innovations, derived

The minimum-variance derivation proved the orthogonality principle at a single time step: $\mathbb{E}[\mathbf{e}_k^+\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{0}$ at the optimal gain — the posterior error carries no leftover correlation with the innovation that produced it. Extend this across time. The next innovation is $\boldsymbol{\nu}_{k+1} = \mathbf{H}\mathbf{e}_{k+1}^- + \mathbf{v}_{k+1} = \mathbf{H}(\mathbf{F}\mathbf{e}_k^+ + \mathbf{w}_k) + \mathbf{v}_{k+1}$, so

$$
\mathbb{E}[\boldsymbol{\nu}_{k+1}\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{H}\mathbf{F}\,\mathbb{E}[\mathbf{e}_k^+\boldsymbol{\nu}_k^{\mathsf{T}}] + \mathbf{H}\,\mathbb{E}[\mathbf{w}_k\boldsymbol{\nu}_k^{\mathsf{T}}] + \mathbb{E}[\mathbf{v}_{k+1}\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{H}\mathbf{F}\cdot\mathbf{0} + \mathbf{0} + \mathbf{0} = \mathbf{0}.
$$

The first term vanishes by orthogonality; the second and third vanish because $\boldsymbol{\nu}_k$ is built entirely from data through step $k$, and $\mathbf{w}_k$, $\mathbf{v}_{k+1}$ are independent of all of it — the first lesson's whiteness assumption, doing its job three lessons after it was introduced. The same argument, applied one step further back at a time, extends to any lag: $\mathbb{E}[\boldsymbol{\nu}_j\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{0}$ for every $j \neq k$.

::: key Innovation whiteness
For a correctly modelled, consistent filter, $\boldsymbol{\nu}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{S}_k)$ and $\mathbb{E}[\boldsymbol{\nu}_j\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{0}$ for $j \neq k$: the innovation sequence is zero-mean and white. Any structure left in it — a nonzero mean, a nonzero autocorrelation at some lag — is the model failing to extract everything the data could tell it, still sitting unused in the residuals.
:::

A practical test needs a threshold, not just the theorem. The **sample autocorrelation** at lag $\ell$, $\hat{\rho}_\ell = \sum_k (\nu_k-\bar\nu)(\nu_{k+\ell}-\bar\nu) \big/ \sum_k(\nu_k-\bar\nu)^2$, is approximately normally distributed with standard deviation $1/\sqrt{N}$ for a genuinely white sequence of length $N$ (a standard result of time-series analysis, used here rather than re-derived), giving a $95\%$ band of $\pm 1.96/\sqrt{N}$.

::: example Whiteness catches the same divergence a covariance number hides
Run the settled altitude filter for $500$ steps two ways: correctly tuned ($q=0.5$, matching the truth), and the under-tuned filter from the process-noise lesson ($q=0.005$, with the same unmodelled $-3\,\mathrm{m/s^2}$ deceleration in the truth). With $N=500$, the band is $\pm1.96/\sqrt{500} = \pm0.0877$.

| Lag | $1$ | $2$ | $3$ | $5$ | $10$ |
| --- | --- | --- | --- | --- | --- |
| Healthy filter $\hat{\rho}_\ell$ | $-0.052$ | $-0.064$ | $-0.028$ | $-0.066$ | $-0.045$ |
| Under-tuned filter $\hat{\rho}_\ell$ | $0.934$ | $0.925$ | $0.912$ | $0.894$ | $0.844$ |

The healthy filter's autocorrelation sits inside $\pm0.0877$ at every lag tested, exactly what whiteness predicts. The under-tuned filter's autocorrelation is above $0.84$ out to lag $10$ — every single lag tested is outside the band, and the decay is slow, the signature of a smooth, persistent effect the model is not tracking (precisely the unmodelled acceleration), not of one-off measurement noise. Its mean innovation over the last $200$ steps is $-26.15\,\mathrm{m}$, against $-0.07\,\mathrm{m}$ for the healthy filter — a filter that is supposed to be predicting the measurement correctly on average is instead consistently $26\,\mathrm{m}$ off, and every single one of its residuals is telling the same story, correlated with the last one, which is exactly what "unused information sitting in the residuals" looks like in real numbers.
:::

## NEES: testing against truth

Whiteness catches *structure* in the residuals; it does not, by itself, say whether the reported covariance is the right *size*. That needs the probability module's chi-square distribution, applied to the state error itself. For a consistent filter, the true error $\mathbf{e}_k = \mathbf{x}_{k,\mathrm{true}} - \hat{\mathbf{x}}_k^+$ is (by definition of what "consistent" means) distributed as $\mathcal{N}(\mathbf{0}, \mathbf{P}_k^+)$. Whitening it — the same linear-transformation-of-a-random-vector rule the probability module used throughout — with any matrix $\mathbf{P}_k^{+-1/2}$ satisfying $\mathbf{P}_k^{+-1/2}\mathbf{P}_k^{+-1/2}{}^{\mathsf{T}} = \mathbf{P}_k^{+-1}$ gives $\mathbf{P}_k^{+-1/2}\mathbf{e}_k \sim \mathcal{N}(\mathbf{0},\mathbf{I}_n)$, a vector of $n$ independent standard normals. The squared norm of $n$ independent standard normals is exactly the probability module's definition of a chi-square random variable with $n$ degrees of freedom, and that squared norm is

$$
\mathrm{NEES}_k = \big(\mathbf{P}_k^{+-1/2}\mathbf{e}_k\big)^{\mathsf{T}}\big(\mathbf{P}_k^{+-1/2}\mathbf{e}_k\big) = \mathbf{e}_k^{\mathsf{T}}\mathbf{P}_k^{+-1}\mathbf{e}_k,
$$

because the specific square root cancels out of the product. This is the **normalized estimation error squared**, and it does not depend on which square root was used to derive it — only on $\mathbf{e}_k$ and $\mathbf{P}_k^+$ themselves.

::: key NEES (normalized estimation error squared)
$\mathrm{NEES}_k = \mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k \sim \chi^2_n$ for a consistent filter, with $\mathbb{E}[\mathrm{NEES}_k] = n$, the state dimension. Requires the true state, so it is a simulation-only test.
:::

## NIS: the test that needs no truth

Apply the identical argument to the innovation instead of the state error. A consistent filter's innovation is $\boldsymbol{\nu}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{S}_k)$ — established above, and originally in the minimum-variance derivation — so whitening it the same way gives

$$
\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k \sim \chi^2_m,
$$

with $m$ the measurement dimension. The algebra is identical to NEES; what changes is only which vector gets whitened. The practical difference is everything: $\mathbf{e}_k$ needs $\mathbf{x}_{k,\mathrm{true}}$, which exists only in simulation, while $\boldsymbol{\nu}_k$ is built from $\mathbf{z}_k$ and $\hat{\mathbf{x}}_k^-$, both of which a real flight computer has in hand at every cycle it runs. NIS is the consistency test that survives contact with an actual vehicle.

::: key NIS (normalized innovation squared)
$\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k \sim \chi^2_m$ for a consistent filter, $\mathbb{E}[\mathrm{NIS}_k] = m$, the measurement dimension. Needs no truth — this is the test that runs on real flight data.
:::

## From one number to a defensible band

A single NEES or NIS draw from a $\chi^2_n$ distribution is noisy — even a perfectly consistent filter will occasionally show a large one, purely by chance. The standard practice is to run many independent trials and average, and the resulting band follows from one more probability-module fact: the sum of $r$ independent $\chi^2_n$ variables is itself $\chi^2_{rn}$ — a direct consequence of the chi-square distribution's own definition as a sum of squared independent standard normals, since stacking $r$ independent groups of $n$ such normals and summing all their squares is exactly the same as summing $rn$ squared independent standard normals. Averaging $r$ runs of NEES divides that sum by $r$, so the acceptance interval for the *average* is the $\chi^2_{rn}$ interval, itself divided by $r$:

::: key Consistency acceptance bounds
For $r$ independent runs and dof $n$, the average NEES (or NIS, with $n\to m$) at a $95\%$ two-sided level should fall in
$$
\left[\frac{\chi^2_{rn}(0.025)}{r},\ \frac{\chi^2_{rn}(0.975)}{r}\right],
$$
where $\chi^2_{rn}(p)$ is the $p$-quantile of the chi-square distribution with $rn$ degrees of freedom. More runs narrow the band around the expected value $n$ (or $m$); the test gets *more* demanding, not less, with more data.
:::

## The Monte Carlo verdict: three filters, judged

::: example Three hundred runs settle the question a single covariance number cannot
Run $300$ independent $150$-step realizations of the altitude filter at three settings of $q$: correctly tuned ($0.5$, matching the truth), under-tuned by a factor of $100$ ($0.005$), and over-tuned by a factor of $100$ ($50$). With $r=300$ and $n=2$ states, the NEES band is $[1.780,\ 2.233]$ around an expected value of $2$; with $m=1$ measurement, the NIS band is $[0.846,\ 1.166]$ around an expected value of $1$. Averaging NEES and NIS across all $300$ runs at every step, then summarizing over the settled window (steps $50$–$150$):

| Filter | Mean NEES | NEES verdict | Mean NIS | NIS verdict |
| --- | --- | --- | --- | --- |
| Nominal, $q=0.5$ | $1.956$ | inside band at every step | $0.987$ | inside band at $95\%$ of steps |
| Under-tuned, $q=0.005$ | $83.07$ | **above band at every step** | $1.722$ | **above band at $95\%$ of steps** |
| Over-tuned, $q=50$ | $1.051$ | **below band at every step** | $0.875$ | below band at $36\%$ of steps |

The under-tuned filter's mean NEES of $83$ is not a marginal violation — it is over $37$ times the acceptance ceiling of $2.233$, and it is above that ceiling at every single one of the $101$ steps checked: a filter reporting a covariance dramatically smaller than its actual error, caught with full statistical confidence and no access to anything a real vehicle would not also have, since the NIS column reaches the identical verdict using only innovations, no truth required. The over-tuned filter sits below its band consistently on NEES — reliably conservative, exactly the safe-but-wasteful direction the divergence lesson described — with NIS showing the same downward lean, though less sharply, since $\mathbf{S}_k$ (built from the filter's own, over-large $\mathbf{P}$) is a less sensitive gauge of true accuracy than $\mathbf{P}_k^+$ itself is. The nominal filter's NEES sits inside its band throughout, and its NIS sits inside the band at $95\%$ of the steps checked — consistent with pure chance at a $95\%$ confidence level, which is exactly the behaviour a genuinely healthy filter, tested this rigorously, is supposed to show.
:::

```python
import numpy as np
from scipy.stats import chi2

def consistency_bounds(dof, runs, alpha=0.05):
    lo = chi2.ppf(alpha / 2, dof * runs) / runs
    hi = chi2.ppf(1 - alpha / 2, dof * runs) / runs
    return lo, hi

lo, hi = consistency_bounds(dof=2, runs=300)
print(f"NEES band: [{lo:.3f}, {hi:.3f}]")
# NEES band: [1.780, 2.233]
```

::: warning A verdict at one confidence level is still a probabilistic statement
The $95\%$ band means precisely that: a genuinely consistent filter will still fall outside it on roughly one window in twenty, purely by chance — visible above in the nominal filter's NIS column, sitting outside the band at $1\%$ of the steps on the high side and $4\%$ on the low side, close to the $2.5\%$-and-$2.5\%$ the test is built to tolerate. One out-of-band step is not a diagnosis. A filter above its band at *every* step of a hundred-step window, as the under-tuned filter was, is not a chance event at any reasonable confidence level — the difference between those two readings is the entire reason the test is run over many steps and many trials rather than once.
:::

## Check yourself

::: check
A filter's average NIS over many runs comes out at $0.98$, comfortably inside its band. Does this, by itself, prove the filter's $\mathbf{Q}$ and $\mathbf{R}$ are individually correct?
:::

::: answer
No. NIS tests only whether the innovation's actual spread matches $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}+\mathbf{R}$, a single combined quantity; a $\mathbf{Q}$ that is somewhat too large paired with an $\mathbf{R}$ that is somewhat too small (or the reverse) could produce a well-calibrated $\mathbf{S}_k$ by cancellation even though neither individual matrix is right. A passing NIS test says the filter's *predictions of the measurement* are well calibrated; it does not by itself separate how much of that calibration came from $\mathbf{Q}$ versus $\mathbf{R}$, which is one reason the process-noise-tuning lesson's likelihood-based approach and a consistency test are complementary rather than substitutes for each other.
:::

::: check
Explain why the over-tuned filter's NIS verdict ($36\%$ of steps below band) was less decisive than its NEES verdict ($100\%$ of steps below band), even though both are testing the same underlying over-confidence-in-the-wrong-direction problem.
:::

::: answer
NEES compares the *true* error directly against $\mathbf{P}_k^+$, so an over-large $\mathbf{P}_k^+$ shows up immediately and completely — the true error is simply smaller than the (inflated) covariance claims, every time. NIS compares the innovation against $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}+\mathbf{R}$, which includes $\mathbf{R}$, a fixed quantity the mistuned $\mathbf{Q}$ never touched; a large $\mathbf{Q}$ inflates $\mathbf{P}_k^-$ and hence $\mathbf{S}_k$, but $\mathbf{R}$'s unchanged contribution dilutes the effect on the combined quantity NIS actually measures, making the same underlying problem show up more faintly in a test that, unlike NEES, has to work without ever seeing $\mathbf{P}_k^+$ or the true error directly.
:::

::: check
Why does averaging over more independent runs make the consistency band *narrower* rather than easier to pass?
:::

::: answer
The band brackets the *average* of $r$ chi-square draws, and averaging reduces variance — with more independent samples, the average concentrates more tightly around the true expected value $n$ (or $m$), the same law-of-large-numbers effect the probability module's Monte Carlo lesson used to justify running more trials for a tighter confidence interval. A filter whose true average NEES is, say, $2.3$ instead of $2.0$ might well hide inside a wide band built from only a handful of runs, purely because the band itself was too loose to detect anything; with hundreds of runs the band tightens around $2.0$ and that same $2.3$ becomes detectable, which is exactly why a consistency test run on too few trials can pass a filter that a properly-sized test would catch.
:::

::: check
The whiteness test on the under-tuned filter showed autocorrelation still above $0.84$ even out at lag $10$ (a full second of data). What does the *slowness* of that decay indicate about the kind of model error present, as opposed to a fast-decaying or single-spike pattern?
:::

::: answer
A slowly-decaying autocorrelation indicates a persistent, smoothly-varying effect the model is missing — consistent with an unmodelled constant or slowly-changing acceleration, whose influence on the position residual barely changes from one sample to the next and so keeps nearby innovations strongly correlated for many lags. A single large spike with autocorrelation returning to the white-noise band immediately afterward, by contrast, is the signature the divergence lesson's outlier example would produce — one bad measurement, not an ongoing modelling gap — and a fast, oscillatory decay pattern would suggest a periodic unmodelled effect, such as a sensor error correlated with an onboard vibration mode. The *shape* of the autocorrelation, not just whether it exceeds the band, is diagnostic of which of this module's divergence causes is actually present.
:::

::: check
A colleague proposes skipping NEES entirely in the test campaign, since NIS is the one that flies. What is lost by doing this in simulation, before flight?
:::

::: answer
NIS tests whether the innovations are calibrated, which is necessary for consistency but not sufficient: it is possible, in principle, for a filter's predicted measurements to be well calibrated while its full state estimate is not — for instance, an unobservable or weakly observable state (the observability lesson's subject) can carry a badly wrong covariance in a direction that never influences $\mathbf{H}\hat{\mathbf{x}}^-$ enough to disturb the innovation noticeably, while still being genuinely inconsistent in the sense NEES is built to catch directly. In simulation, where truth is available, running NEES alongside NIS checks the *entire* state, not only the part the sensor happens to be sensitive to; skipping it trades a strictly stronger pre-flight test for a strictly weaker one, to save an experiment that costs nothing once the truth is already being simulated.
:::

## Summary

| Item | Statement |
| --- | --- |
| Whiteness | $\mathbb{E}[\boldsymbol{\nu}_j\boldsymbol{\nu}_k^{\mathsf{T}}]=\mathbf{0}$ for $j\neq k$, derived from the orthogonality principle plus whiteness of $\mathbf{w},\mathbf{v}$; tested via sample autocorrelation against a $\pm1.96/\sqrt{N}$ band |
| NEES | $\mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k \sim \chi^2_n$, $\mathbb{E}=n$; needs truth, simulation only |
| NIS | $\boldsymbol\nu_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol\nu_k \sim \chi^2_m$, $\mathbb{E}=m$; needs no truth, runs on real flight data |
| Multi-run bound | Average of $r$ independent draws: $[\chi^2_{rn}(0.025)/r,\ \chi^2_{rn}(0.975)/r]$; tightens around the expected value as $r$ grows |
| Reading the verdict | Above the band: optimistic, dangerous. Below: conservative, wasteful. Consistently outside across many steps: a real finding, not chance |
| Demonstrated | $300$-run Monte Carlo: nominal filter inside both bands; under-tuned filter's mean NEES $37\times$ over its ceiling, caught by NIS alone too; over-tuned filter below its NEES band at every step |

Every test in this lesson answers "is this filter honest about what it knows," using only what the filter itself already computes. The next lesson turns to a related but different question — not whether a filter's uncertainty is honest, but how it should decide, cycle to cycle, which measurements to trust enough to use at all.
