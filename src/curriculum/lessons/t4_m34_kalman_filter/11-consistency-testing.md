---
id: l11-consistency-testing
title: 'Consistency testing: innovation whiteness, NEES and NIS'
minutes: 18
covers:
  - 'Consistency testing: innovation whiteness, NEES and NIS chi-square tests, innovation autocorrelation'
---

A weather forecaster says "70% chance of rain". Tomorrow it stays dry. Was she wrong? You cannot tell from one day. But collect every day she said "70%" over a whole year. If it rained on about seven out of ten of them, her numbers mean what they say. If it rained on only three out of ten, she was overconfident about rain, and you would stop trusting her. Judging a forecaster takes many forecasts, not one.

A Kalman filter is a forecaster too. Every cycle it states an estimate *and* a covariance — a claim about how wrong the estimate probably is. In the last two lessons we caught filters lying about that, but only because we had built the lie on purpose and could see the true state. A flight team looking at real telemetry has no such luxury. They have a stream of numbers from a confident filter, and one honest question: does this covariance mean what it claims?

This lesson turns that question into statistical tests, using the chi-square distribution from the probability module and quantities the filter has been computing since the predict-and-update lesson. A filter whose covariance matches its real errors is called **consistent**. The tests do not change the filter. They read its output and return a verdict, the way a referee watches a game without playing in it.

## The leftovers should look like static

After each update, the **innovation** $\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-$ ("nu k") is the part of the measurement the prediction did not see coming. If the filter has squeezed every bit of usable information out of the past, what is left should be pure surprise, with no pattern. Knowing today's surprise should tell you nothing about tomorrow's. A sequence like that is called **[[white|white-noise]]**, like the hiss of an untuned radio.

If the innovations do have a pattern — if a big positive one tends to be followed by another big positive one — then the past held information the filter failed to use. Something in the model is missing.

::: key Innovation whiteness
For a correctly modeled, consistent filter, $\boldsymbol{\nu}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{S}_k)$ and $\mathbb{E}[\boldsymbol{\nu}_j\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{0}$ for $j \neq k$: the innovation sequence is zero-mean and white. Any structure left in it — a nonzero mean, a nonzero autocorrelation at some lag — is information the model failed to extract, still sitting unused in the residuals.
:::

Read $\mathcal{N}(\mathbf{0}, \mathbf{S}_k)$ as "normal with mean zero and covariance $\mathbf{S}_k$", and $\mathbb{E}[\cdot]$ as "the average over many repeats".

::: note Why it has to be true: the innovations are white
The minimum-variance derivation proved the **orthogonality principle**: at the optimal gain, $\mathbb{E}[\mathbf{e}_k^+\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{0}$. The updated error $\mathbf{e}_k^+$ carries no leftover correlation with the innovation that produced it. Now step forward in time. The next innovation is

$$
\boldsymbol{\nu}_{k+1} = \mathbf{H}\mathbf{e}_{k+1}^- + \mathbf{v}_{k+1} = \mathbf{H}(\mathbf{F}\mathbf{e}_k^+ + \mathbf{w}_k) + \mathbf{v}_{k+1}.
$$

Multiply by $\boldsymbol{\nu}_k^{\mathsf{T}}$ and average, one term at a time:

$$
\mathbb{E}[\boldsymbol{\nu}_{k+1}\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{H}\mathbf{F}\,\mathbb{E}[\mathbf{e}_k^+\boldsymbol{\nu}_k^{\mathsf{T}}] + \mathbf{H}\,\mathbb{E}[\mathbf{w}_k\boldsymbol{\nu}_k^{\mathsf{T}}] + \mathbb{E}[\mathbf{v}_{k+1}\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{H}\mathbf{F}\cdot\mathbf{0} + \mathbf{0} + \mathbf{0} = \mathbf{0}.
$$

The first term is zero by orthogonality. The second and third are zero because $\boldsymbol{\nu}_k$ is built only from data up to step $k$, while $\mathbf{w}_k$ and $\mathbf{v}_{k+1}$ are fresh noise, independent of all of it — the whiteness assumption of the stochastic-model lesson at work. Repeating the argument one step further back each time covers every lag: $\mathbb{E}[\boldsymbol{\nu}_j\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{0}$ whenever $j \neq k$.
:::

### Turning the theorem into a test

To check whiteness on real data, measure how much each innovation resembles the one $\ell$ steps later ($\ell$ is the **lag**, read "ell"). For a scalar sequence $\nu_1, \ldots, \nu_N$ with average $\bar\nu$ ("nu bar"), the **[[sample autocorrelation|autocorrelation]]** at lag $\ell$ is

$$
\hat{\rho}_\ell = \frac{\sum_k (\nu_k-\bar\nu)(\nu_{k+\ell}-\bar\nu)}{\sum_k(\nu_k-\bar\nu)^2}.
$$

Read $\hat\rho_\ell$ as "rho hat ell". It runs from $-1$ to $1$. Near $1$ means each innovation looks like the one $\ell$ steps later; near $0$ means no resemblance. For a truly white sequence of length $N$, $\hat{\rho}_\ell$ is roughly normal with standard deviation $1/\sqrt{N}$. That is a standard result of time-series analysis, used here without proof. So $95\%$ of the time a white sequence stays inside the band $\pm 1.96/\sqrt{N}$.

Whiteness has a partner test: the **mean**. The average innovation should be zero, give or take its own standard error, about $\sqrt{S/N}$.

::: example Whiteness catches what a covariance hides
Run the booster filter (constant velocity, $\Delta t = 0.1\,\mathrm{s}$, $R = 4\,\mathrm{m^2}$) for $520$ steps and keep the last $N = 500$ innovations, dropping the start-up. The band is $\pm 1.96/\sqrt{500} = \pm 0.0877$, and the standard error of the mean is about $\sqrt{4.6/500} \approx 0.096\,\mathrm{m}$. Three cases:

- **Healthy:** $q = 0.5$, and the truth really is constant velocity with that noise.
- **Under-tuned:** $q = 0.005$, and the truth hides a $-3\,\mathrm{m/s^2}$ deceleration.
- **Tuned but biased:** $q = 0.5$, with the same hidden deceleration.

| Case | $\hat\rho_1$ | $\hat\rho_2$ | $\hat\rho_3$ | $\hat\rho_5$ | $\hat\rho_{10}$ | Mean $\bar\nu$ |
| --- | --- | --- | --- | --- | --- | --- |
| Healthy | $0.032$ | $-0.025$ | $0.040$ | $-0.059$ | $0.070$ | $-0.001\,\mathrm{m}$ |
| Under-tuned | $0.917$ | $0.906$ | $0.901$ | $0.871$ | $0.820$ | $-24.6\,\mathrm{m}$ |
| Tuned but biased | $0.039$ | $-0.014$ | $0.051$ | $-0.050$ | $0.071$ | $-2.87\,\mathrm{m}$ |

The healthy filter stays inside $\pm 0.0877$ at every lag, and its mean is a hundredth of a standard error. The under-tuned filter fails loudly: above $0.8$ out to lag $10$ (a full second), fading only slowly. That slow fade is the fingerprint of a smooth, persistent effect the model is missing — exactly the hidden deceleration — rather than one-off noise. Its mean is $-24.6\,\mathrm{m}$: on average the measurement comes in $25\,\mathrm{m}$ below the prediction, every step, each innovation telling the same story as the last.

The third row is sneaky. Its autocorrelation passes. But its mean, $-2.87\,\mathrm{m}$, is about $30$ standard errors from zero ($2.87 / 0.096 \approx 30$). A bigger $\mathbf{Q}$ let the filter keep up with the deceleration, but only by trailing a steady $3\,\mathrm{m}$ behind. Always check the mean as well as the pattern.
:::

## NEES: grading the error against the truth

Whiteness catches *patterns*. It does not say whether the covariance is the right *size*. For that, grade each error in units of the filter's own claimed standard deviation.

Start with one number. If a filter says its altitude is good to $\sigma = 0.8\,\mathrm{m}$ and the real error is $1.2\,\mathrm{m}$, the error is $1.2/0.8 = 1.5$ claimed sigmas. Square it: $2.25$. For an honest filter, the average of that squared score over many trials is exactly $1$, because the average squared error equals the variance by definition.

For a whole state vector, the same score is

$$
\mathrm{NEES}_k = \mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k, \qquad \mathbf{e}_k = \mathbf{x}_{k,\mathrm{true}} - \hat{\mathbf{x}}_k^+,
$$

the **normalized estimation error squared**. The inverse covariance does the dividing-by-sigma in every direction at once, correlations included. It is a squared **[[Mahalanobis distance|mahalanobis]]**. With $n$ states, an honest filter's NEES averages $n$ — one for each state.

::: key NEES (normalized estimation error squared)
$\mathrm{NEES}_k = \mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k \sim \chi^2_n$ for a consistent filter, with $\mathbb{E}[\mathrm{NEES}_k] = n$, the state dimension. It requires the true state, so it is a simulation-only test.
:::

Read $\chi^2_n$ as "chi-square with $n$ **[[degrees of freedom|degrees-of-freedom]]**": the **[[chi-square distribution|chi-square]]** of a sum of $n$ squared independent standard normal numbers.

::: note Why it has to be true: NEES is chi-square
For a consistent filter, the error $\mathbf{e}_k$ really is distributed as $\mathcal{N}(\mathbf{0}, \mathbf{P}_k^+)$ — that is what "consistent" means. Pick any matrix square root $\mathbf{P}^{-1/2}$ with $(\mathbf{P}^{-1/2})^{\mathsf{T}}\mathbf{P}^{-1/2} = \mathbf{P}^{-1}$ (a Cholesky factor works). The probability module's rule for a linear change of a random vector gives $\mathbf{P}^{-1/2}\mathbf{e}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{I}_n)$: $n$ independent standard normals. The sum of their squares is, by definition, chi-square with $n$ degrees of freedom. And that sum is

$$
\big(\mathbf{P}^{-1/2}\mathbf{e}_k\big)^{\mathsf{T}}\big(\mathbf{P}^{-1/2}\mathbf{e}_k\big) = \mathbf{e}_k^{\mathsf{T}}\mathbf{P}^{-1}\mathbf{e}_k = \mathrm{NEES}_k.
$$

The square root cancels out, so NEES does not depend on which one you picked. Each squared standard normal averages $1$, so the sum averages $n$.
:::

## NIS: the test that needs no truth

NEES has a fatal flaw for flight: it needs $\mathbf{x}_{\mathrm{true}}$, which exists only in a simulation. So run the same argument on the innovation instead. For a consistent filter $\boldsymbol{\nu}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{S}_k)$, so

$$
\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k \sim \chi^2_m,
$$

with $m$ the number of measurements. The algebra is identical; only the vector being graded changes. The practical difference is everything. The innovation is built from $\mathbf{z}_k$ and $\hat{\mathbf{x}}_k^-$, which a real flight computer has in hand every cycle. NIS is the consistency test that survives contact with an actual vehicle.

::: key NIS (normalized innovation squared)
$\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k \sim \chi^2_m$ for a consistent filter, with $\mathbb{E}[\mathrm{NIS}_k] = m$, the measurement dimension. It needs no truth — this is the consistency test that runs on real flight data.
:::

## From one number to a band you can defend

A single NEES value is noisy. Even a perfect filter throws a big one now and then, by pure chance, like one dry "70%" day. So engineers run many independent trials — a **[[Monte Carlo|monte-carlo]]** campaign — and average.

Here is the fact that makes the average testable. Add up $r$ independent $\chi^2_n$ numbers. Each is a sum of $n$ squared standard normals, so the total is a sum of $rn$ of them, which is $\chi^2_{rn}$ by definition. The average is that total divided by $r$. So the band for the average is the $\chi^2_{rn}$ band, divided by $r$.

::: key Consistency acceptance bounds
For $r$ independent runs and $n$ degrees of freedom, the run-averaged NEES (or NIS, with $n \to m$) should fall, at a $95\%$ two-sided level, in
$$
\left[\frac{\chi^2_{rn}(0.025)}{r},\ \frac{\chi^2_{rn}(0.975)}{r}\right],
$$
where $\chi^2_{rn}(p)$ is the $p$-**[[quantile|quantile]]** of the chi-square distribution with $rn$ degrees of freedom. More runs narrow the band around the expected value $n$ (or $m$): the test gets *more* demanding with more data, not less.
:::

```python
from scipy.stats import chi2

def consistency_bounds(dof, runs, alpha=0.05):
    lo = chi2.ppf(alpha / 2, dof * runs) / runs
    hi = chi2.ppf(1 - alpha / 2, dof * runs) / runs
    return lo, hi

print("NEES band: [%.3f, %.3f]" % consistency_bounds(dof=2, runs=300))
print("NIS band:  [%.3f, %.3f]" % consistency_bounds(dof=1, runs=300))
# NEES band: [1.780, 2.233]
# NIS band:  [0.846, 1.166]
```

Once you have the band, reading it is simple.

::: key Reading a consistency test
Average NEES above the bound means the filter is **optimistic**: its real error is bigger than its claimed covariance. That is the dangerous direction, because everything downstream trusts the covariance. Below the bound means it is **conservative**: safe, but wasting information it could have used.
:::

::: example Three hundred flights, three filters, one verdict
Fly $300$ independent booster descents of $150$ steps each. The truth is a genuine constant-velocity flight with process noise $q = 0.5$, and each filter starts from an initial guess drawn honestly from its $\mathbf{P}_0 = \operatorname{diag}(100, 25)$. Run three filters on every flight: correctly tuned ($q = 0.5$), under-tuned a hundredfold ($q = 0.005$), and over-tuned a hundredfold ($q = 50$).

With $r = 300$ and $n = 2$ states, the NEES band is $[1.780,\ 2.233]$ around $2$. With $m = 1$ measurement, the NIS band is $[0.846,\ 1.166]$ around $1$. Average NEES and NIS over the $300$ runs at each step, and look at the settled stretch, steps $50$ to $150$ ($101$ steps):

| Filter | Mean NEES | NEES verdict | Mean NIS | NIS verdict |
| --- | --- | --- | --- | --- |
| Tuned, $q = 0.5$ | $1.97$ | inside at $95\%$ of steps | $1.01$ | inside at $96\%$ of steps |
| Under-tuned, $q = 0.005$ | $87.1$ | above at every step | $1.75$ | above at $96\%$ of steps |
| Over-tuned, $q = 50$ | $1.05$ | below at every step | $0.89$ | below at $30\%$ of steps |

The under-tuned filter's mean NEES of $87$ is not a near miss: it is about $39$ times the ceiling ($87.1 / 2.233 \approx 39$), and above it at every single step. Its covariance is wildly optimistic. And the NIS column reaches the same verdict using only innovations — no truth needed — so this failure would be caught on a real vehicle.

The over-tuned filter sits below its NEES band at every step: reliably conservative, the safe-but-wasteful direction. NIS leans the same way, more faintly. The tuned filter sits inside both bands almost all the time. Its handful of out-of-band steps is what chance alone should produce at a $95\%$ level — a healthy filter tested this hard is *supposed* to look like that.
:::

::: warning A 95% band still misses one time in twenty
A perfectly consistent filter still falls outside a $95\%$ band about one step in twenty, by chance. In the example, the tuned filter's NIS was outside on $4\%$ of steps — about what the test is built to tolerate. One out-of-band step is not a diagnosis. A filter above its band at *every* step of a hundred-step window, like the under-tuned one, is not chance at any sensible confidence level. That difference is the whole reason the test runs over many steps and many trials.
:::

## Check yourself

::: check
A filter's run-averaged NIS comes out at $0.98$, comfortably inside its band. Does that prove its $\mathbf{Q}$ and $\mathbf{R}$ are each correct?
:::

::: answer
No. NIS only tests whether the innovations' real spread matches $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, a single combined quantity. A $\mathbf{Q}$ somewhat too large paired with an $\mathbf{R}$ somewhat too small (or the reverse) can give a well-calibrated $\mathbf{S}_k$ by cancellation, even though neither matrix is right. A passing NIS says the filter's *predictions of the measurement* are well calibrated. It does not split that calibration between $\mathbf{Q}$ and $\mathbf{R}$. That is one reason the process-noise lesson's likelihood tuning and a consistency test work together rather than replacing each other.
:::

::: check
The over-tuned filter was below its NEES band at every step, but below its NIS band at only $30\%$ of steps. Both tests are looking at the same problem. Why is NIS less decisive?
:::

::: answer
NEES compares the *true* error directly with $\mathbf{P}_k^+$, so an oversized $\mathbf{P}_k^+$ shows up fully, every time. NIS compares the innovation with $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, which includes $\mathbf{R}$ — a fixed amount the mistuned $\mathbf{Q}$ never touched. In the booster filter, raising $q$ a hundredfold (from $0.5$ to $50$) nearly triples the steady position variance $P^+_{pp}$ (from $0.56$ to $1.51\,\mathrm{m^2}$), but it grows $S$ only from $4.65$ to $6.42\,\mathrm{m^2}$, because $R = 4\,\mathrm{m^2}$ makes up most of it. The same fault is diluted in the quantity NIS measures, so it shows up more faintly in the one test that works without the truth.
:::

::: check
Why does averaging over more independent runs make the consistency band *narrower* — harder to pass — rather than easier?
:::

::: answer
The band brackets the *average* of $r$ chi-square draws, and averaging shrinks spread: with more independent samples, the average huddles more tightly around its true expected value $n$ (or $m$). This is the same law-of-large-numbers effect that makes more Monte Carlo trials give a tighter confidence interval. A filter whose true average NEES is, say, $2.3$ instead of $2.0$ could hide inside a wide band built from a handful of runs, only because that band was too loose to see anything. With hundreds of runs the band tightens around $2.0$ and the $2.3$ is caught. A test run on too few trials can pass a filter that a properly sized test would fail.
:::

::: check
The under-tuned filter's autocorrelation stayed above $0.8$ out to lag $10$, a full second. What does the *slowness* of that fade say about the kind of model error, compared with a single spike or a fast wiggle?
:::

::: answer
A slow fade means a persistent, smoothly changing effect is missing from the model — such as an unmodelled constant or slowly varying acceleration. Its influence on the altitude residual barely changes from one sample to the next, so nearby innovations stay strongly alike for many lags. A single huge innovation followed by autocorrelation dropping straight back into the white band is the outlier signature from the divergence lesson: one bad measurement, not an ongoing modeling gap. A fast, oscillating pattern would suggest a periodic unmodelled effect, such as a sensor error tied to a vibration mode. The *shape* of the autocorrelation, not just whether it leaves the band, tells you which divergence cause is present.
:::

::: check
A colleague suggests skipping NEES in the simulation campaign, since NIS is the one that flies. What would be lost?
:::

::: answer
NIS checks whether the innovations are calibrated. That is necessary for consistency, but not enough. A filter's predicted measurements can be well calibrated while part of its state is not: a weakly observable or unobservable state (the observability lesson's subject) can carry a badly wrong covariance in a direction that barely affects $\mathbf{H}\hat{\mathbf{x}}^-$, so the innovations stay calm while the state is genuinely inconsistent. In simulation the truth is available, so NEES checks the *whole* state, not only the part the sensor can see. Skipping it trades a strictly stronger pre-flight test for a weaker one, to save an experiment that costs almost nothing once the truth is already being simulated.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Consistent filter | Its covariance matches its real errors, on average, over many trials |
| Whiteness | $\mathbb{E}[\boldsymbol{\nu}_j\boldsymbol{\nu}_k^{\mathsf{T}}] = \mathbf{0}$ for $j \neq k$; from orthogonality plus white $\mathbf{w}, \mathbf{v}$ |
| Autocorrelation test | $\hat\rho_\ell$ should stay inside $\pm 1.96/\sqrt{N}$; also check the mean against $\sqrt{S/N}$ |
| NEES | $\mathbf{e}_k^{\mathsf{T}}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k \sim \chi^2_n$, average $n$; needs truth, simulation only |
| NIS | $\boldsymbol\nu_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol\nu_k \sim \chi^2_m$, average $m$; needs no truth, flies |
| Multi-run band | $[\chi^2_{rn}(0.025)/r,\ \chi^2_{rn}(0.975)/r]$; tightens as $r$ grows |
| Verdict | Above the band: optimistic, dangerous. Below: conservative, wasteful. Outside at most steps: a real finding, not chance |
| In the example | Tuned filter inside; under-tuned NEES $39\times$ over the ceiling, caught by NIS too; over-tuned below its NEES band at every step |

These tests ask whether a filter is honest about what it knows, using only what it already computes. The next lesson asks a related question, one measurement at a time: should the filter trust this reading enough to use it at all?

::: context white-noise Why "white"
White light is a mix of every color at equal strength. By analogy, **white noise** is a jiggle that contains every frequency — every speed of wiggle — at equal strength, so no rhythm stands out. In time, that means each value is unrelated to the one before it. The hiss of a radio tuned between stations is close to white. "Colored" noise, by contrast, has some rhythms stronger than others: **pink** or **red** noise is dominated by slow wanders, and a sequence like that shows up as correlation from one step to the next.
:::

::: context autocorrelation Does each value lean on the last?
The top sequence is white: each value is a fresh draw, and knowing one tells you nothing about the next, so its autocorrelation at lag $1$ is near $0$. The bottom sequence is correlated: each value is $0.9$ times the previous one plus a little fresh noise, so it wanders in slow swells and its lag-$1$ autocorrelation is near $0.9$. Innovations from a healthy filter should look like the top one. The under-tuned filter's innovations look like the bottom one, only worse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#6c7a93" stroke-width="0.8"/>
  <line x1="20" y1="130" x2="340" y2="130" stroke="#6c7a93" stroke-width="0.8"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.6" points="20,59.6 28,65.9 36,53.0 44,45.0 52,36.4 60,48.7 68,56.6 76,59.4 84,41.0 92,30.4 100,46.7 108,64.8 116,61.5 124,30.8 132,47.6 140,70.8 148,51.0 156,64.0 164,57.6 172,55.9 180,58.6 188,43.4 196,50.8 204,57.1 212,45.1 220,40.0 228,69.7 236,53.1 244,61.8 252,52.1 260,65.5 268,49.8 276,50.5 284,53.7 292,62.6 300,54.8 308,63.1 316,66.3 324,47.3 332,63.3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.6" points="20,130.0 28,126.3 36,137.1 44,134.9 52,140.2 60,139.0 68,137.9 76,147.5 84,147.0 92,146.6 100,139.9 108,145.1 116,139.7 124,144.5 132,144.8 140,147.7 148,138.4 156,134.6 164,121.4 172,118.9 180,115.6 188,112.6 196,117.5 204,119.1 212,113.2 220,116.9 228,117.2 236,118.6 244,116.6 252,119.8 260,121.6 268,121.2 276,121.6 284,126.9 292,122.5 300,130.1 308,136.4 316,142.4 324,136.1 332,137.4"/>
  <text x="20" y="18" font-size="12" fill="#1d6fd1">white: no pattern</text>
  <text x="20" y="100" font-size="12" fill="#b4232c">correlated: slow swells</text>
  <text x="340" y="166" font-size="11" fill="#1f2a44" text-anchor="end">time step</text>
</svg>
```
:::

::: context mahalanobis Distance measured in sigmas
Ordinary distance treats every direction the same. The **Mahalanobis distance**, named after the Indian statistician P. C. Mahalanobis, measures distance in units of the spread in each direction. Below, the ellipse is the set of points one standard deviation away, for a state whose first part has $\sigma = 2$ and second part $\sigma = 0.5$. Points A and B are the same straight-line distance, $1.5$, from the center. A is well inside the ellipse: a squared score of $(1.5/2)^2 = 0.56$. B is far outside: $(1.5/0.5)^2 = 9$. NEES is exactly this squared score.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="10" x2="180" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="180" cy="100" rx="120" ry="30" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="180" cy="100" r="90" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="270" cy="100" r="5" fill="#1d6fd1"/>
  <circle cx="180" cy="10" r="5" fill="#b4232c"/>
  <text x="276" y="124" font-size="12" fill="#1d6fd1">A: 0.56</text>
  <text x="192" y="14" font-size="12" fill="#b4232c">B: score 9</text>
  <text x="62" y="148" font-size="11" fill="#1d6fd1">1σ ellipse</text>
  <text x="352" y="192" font-size="11" fill="#6c7a93" text-anchor="end">dashed: same plain distance</text>
</svg>
```
:::

::: context degrees-of-freedom Counting the independent pieces
**Degrees of freedom** here just counts how many independent squared standard normals are added up. One measurement gives one; a two-state error gives two. The name comes from mechanics and statistics, where it counts how many numbers are free to vary independently. Each piece contributes an average of $1$, so a chi-square with $k$ degrees of freedom averages $k$ — which is why NEES averages the state dimension $n$ and NIS the measurement dimension $m$.
:::

::: context chi-square The shape of a squared score
The **chi-square distribution** (from the Greek letter $\chi$, "kai") is what you get by adding up squares of independent standard normal numbers. Karl Pearson made it famous in 1900 as a test of whether data fit a model. Here is the one with $2$ degrees of freedom, the NEES of a two-state filter. Most values are small, the average is $2$, and only $5\%$ of values land beyond $5.99$ (shaded).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <polygon fill="#f2b880" points="219.7,160 219.7,154.0 227.2,154.7 234.8,155.3 242.3,155.9 249.8,156.4 257.3,156.8 264.8,157.2 272.3,157.5 279.9,157.8 287.4,158.1 294.9,158.3 302.4,158.5 309.9,158.7 317.4,158.8 325.0,159.0 332.5,159.1 340.0,159.2 340,160"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,40.0 47.5,54.1 55.0,66.5 62.5,77.5 70.0,87.2 77.5,95.8 85.0,103.3 92.5,110.0 100.0,115.9 107.5,121.0 115.0,125.6 122.5,129.7 130.0,133.2 137.5,136.4 145.0,139.1 152.5,141.6 160.0,143.8 167.5,145.7 175.0,147.4 182.5,148.8 190.0,150.1 197.5,151.3 205.0,152.3 212.5,153.2 220.0,154.0 227.5,154.7 235.0,155.3 242.5,155.9 250.0,156.4 257.5,156.8 265.0,157.2 272.5,157.5 280.0,157.8 287.5,158.1 295.0,158.3 302.5,158.5 310.0,158.7 317.5,158.8 325.0,159.0 332.5,159.1 340.0,159.2"/>
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="160" x2="100" y2="115.9" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="175">0</text><text x="100" y="175">2</text><text x="160" y="175">4</text><text x="220" y="175">6</text><text x="280" y="175">8</text><text x="340" y="175">10</text>
  </g>
  <text x="106" y="110" font-size="12" fill="#b4232c">average 2</text>
  <line x1="219.7" y1="160" x2="219.7" y2="132" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="226" y="136" font-size="12" fill="#1f2a44">top 5%: above 5.99</text>
</svg>
```
:::

::: context monte-carlo Named after a casino
A **Monte Carlo** method answers a question by running many random trials and counting what happens, instead of solving it with a formula. The name, after the famous casino in Monaco, was coined in the 1940s by scientists at Los Alamos, including Stanislaw Ulam and Nicholas Metropolis, who used random sampling to study neutrons. In GNC, a Monte Carlo campaign means hundreds or thousands of simulated flights, each with fresh random noise and errors, to see how a design behaves across everything that might happen.
:::

::: context quantile Cutting the distribution at a percentage
The **$p$-quantile** of a distribution is the value with a fraction $p$ of the probability below it. The median is the $0.5$-quantile. For the $95\%$ band we want the $0.025$-quantile at the low end and the $0.975$-quantile at the high end, leaving $2.5\%$ outside on each side. In Python, `scipy.stats.chi2.ppf(p, dof)` returns the chi-square quantile; "ppf" stands for "percent point function", another name for the same thing.
:::
