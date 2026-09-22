---
id: l09-residual-analysis-outlier-rejection-robust-estimation
title: "Residual analysis, outlier rejection, and robust estimation"
minutes: 19
covers:
  - "Residual analysis, outlier rejection, and robust estimation (Huber loss, RANSAC)"
---

Weighted least squares trusts every measurement exactly as much as its stated $\sigma$ says to, and real sensors do not always deserve that trust: a star tracker occasionally locks onto the wrong star, a pseudorange reflects off a structure before it arrives, a downlinked telemetry word loses a bit. Lesson one already planted a warning about the most dangerous version of this problem — a high-leverage outlier hides in its own residual — and this lesson cashes that warning in. It builds a fit that passes every standard check and is nonetheless wrong, shows honestly that the fixes you would reach for first do not fix it, finds the one that does, and then builds Huber loss and RANSAC for the failure mode they are actually good at.

## Recall: the studentized residual

Lesson one showed the $i$-th residual has variance $\sigma^2(1-\Pi_{ii})$, smaller than the raw noise variance by the point's leverage $\Pi_{ii}$. Comparing a raw residual to the raw $\sigma$ therefore *overstates* how unusual a high-leverage point's residual should look; the right comparison is the **studentized residual**,

$$
\hat{v}_i^{\,*} = \frac{\hat v_i}{\sigma\sqrt{1-\Pi_{ii}}} ,
$$

which has unit variance for every point regardless of leverage and should look like a draw from $\mathcal{N}(0,1)$ if the model and noise assumptions hold.

::: example A fit that looks fine and is wrong
A bias-and-drift fit — the receiver-clock model of lesson one — takes one reading at $t=0$ and five more clustered at $t=20$ through $28\,\mathrm{s}$, true parameters $(1250.0,\ 3.2)$, $\sigma=0.5$ in consistent units. The isolated point carries almost the whole burden of pinning down the intercept:

```python
import numpy as np
from scipy import stats

t = np.array([0., 20., 22., 24., 26., 28.])
H = np.column_stack([np.ones(6), t])
sigma = 0.5
leverage = np.diag(H @ np.linalg.inv(H.T @ H) @ H.T)
print("leverage:", leverage.round(3))
# leverage: [0.936 0.167 0.174 0.197 0.236 0.29 ]
```

With clean data the fit recovers the truth to within noise. Add a single $3\,\mathrm{m}$ error to the isolated point — six times $\sigma$, the kind of error a real glitch produces — and refit:

| | clean | $+3\,\mathrm{m}$ at $t=0$ |
| --- | --- | --- |
| $\hat x_0$ (bias) | $1250.19$ | $1253.06$ |
| bias in $\hat x_0$ | — | $+2.81$ ($5.8\,\sigma_{\hat x_0}$) |
| $2J$ (chi-square, $4\,\mathrm{dof}$) | $5.65$ | $6.20$ |
| $p$-value | $0.23$ | $0.19$ |
| raw residual at $t=0$ | $-0.03$ | $0.10$ |
| studentized residual at $t=0$ | $-0.10$ | $0.75$ |

The intercept is wrong by $5.8$ of its own standard deviations — a serious navigation error — and every ordinary check says the fit is fine. The chi-square statistic is *closer* to its expected value of $4$ with the outlier than without. The raw residual at the bad point stays under $0.1\,\mathrm{m}$. The studentized residual, built specifically to correct for leverage, reads $0.75$ — utterly unremarkable. The point's leverage of $0.936$ means the fit chases it almost exactly, which is precisely why the fit absorbs the error into the parameters instead of leaving it visible as a residual anywhere.
:::

## Why the obvious fixes do not fix this one

A leave-one-out residual — refit without the suspect point, compare its predicted value to what was actually measured — sounds like the natural repair, and Huber loss and RANSAC sound like exactly the tools built for outliers in general. Try all three, honestly, on the same case.

::: example The standard remedies, tested against the same fit
```python
import numpy as np

# H, y (with the +3 m error), sigma, leverage as above
mask = np.arange(6) != 0
H_loo, y_loo = H[mask], y[mask]
x_loo = np.linalg.lstsq(H_loo, y_loo, rcond=None)[0]
pred0 = H[0] @ x_loo
P_loo = np.linalg.inv(H_loo.T @ H_loo / sigma**2)
var_pred0 = sigma**2 + H[0] @ P_loo @ H[0]
ext_studentized = (y[0] - pred0) / np.sqrt(var_pred0)
print("leave-one-out prediction at t=0:", pred0, " externally studentized:", ext_studentized)
# leave-one-out prediction at t=0: 1251.68   externally studentized: 0.748
```

| Method | Result at $t=0$ | Verdict |
| --- | --- | --- |
| Externally studentized (leave-one-out) residual | $0.75$ | Not flagged |
| Huber/IRLS weight ($k=1.345\sigma$) | $1.00$ (full weight) | Not flagged — a different point (weight $0.78$) is down-weighted instead |
| RANSAC (2-point minimal sample, $1000$ trials) | marked an inlier | Not flagged; same $\hat x_0=1253.06$ as plain WLS |

The leave-one-out check fails for a subtle reason worth understanding, not just noting: excluding the isolated point removes the *only* data near $t=0$, so predicting its value from the remaining cluster is itself highly uncertain, and that uncertainty grows in exactly the proportion needed to keep the ratio unremarkable. Huber and RANSAC fail for a blunter reason: both decide what to trust by looking at residuals from a fit, and the fit already bent itself around the bad point before either method got a chance to notice anything wrong.
:::

::: warning Residual-based diagnostics share a blind spot
Every method in the table above — studentized residuals, leave-one-out residuals, Huber's weights, RANSAC's inlier count — is a function of how far a point sits from a fit computed from the data. A point with leverage near $1$ pulls any such fit almost exactly onto itself by construction, so no diagnostic built only from post-fit residuals can reliably see an error there, however large. This is not a flaw in any one method; it is a structural limit shared by the whole family.
:::

## The fix that actually works

The remedy is not a cleverer statistic; it is more data in the direction that had none. Add one more measurement near $t=0$ — say $t=1$ — and the isolated point's leverage drops from $0.936$ to $0.503$, because it no longer has to explain the intercept alone.

```python
# same setup, with an added measurement at t=1, same +3 m error at t=0
# leverage becomes [0.503, 0.463, 0.152, 0.170, 0.197, 0.234, 0.281]
# studentized residual at t=0 becomes 4.64  (was 0.75)
# chi-square: 23.3 on 5 dof, p = 0.0003  (was 6.2 on 4 dof, p = 0.19)
# bias in x0 drops from +2.81 to +1.43
```

With a second point nearby, the same $3\,\mathrm{m}$ error produces a studentized residual of $4.64$ and a chi-square that is unmistakably wrong — and the bias the outlier can still inflict drops by half, because one bad point can no longer single-handedly set the intercept. This is lesson eight's prescription again, now shown to matter for robustness as well as variance: never let one measurement alone carry an entire direction of the state.

## Where robust loss earns its keep

Once no single point has outsized leverage, residual-based methods work exactly as advertised. **Huber loss** blends the best of squared-error and absolute-error cost:

$$
\rho_k(r) = \begin{cases} \tfrac12 r^2 & \lvert r\rvert \le k \\ k\lvert r\rvert - \tfrac12 k^2 & \lvert r\rvert > k \end{cases}
$$

matching value and slope at $\lvert r\rvert=k$ (both pieces give $\tfrac12k^2$ and slope $k$ there, so the transition is smooth). Its derivative $\psi_k(r)=r$ for small residuals and $k\,\mathrm{sign}(r)$ beyond $k$ — the gradient clips rather than growing without bound — which is exactly the weight an iteratively reweighted least squares (IRLS) solve needs: write $\psi_k(r)=w(r)\,r$ with $w(r)=\min(1,\,k/\lvert r\rvert)$, solve WLS with weights $w$ applied to the current residuals, recompute residuals, and repeat. The standard choice $k=1.345\sigma$ trades a small amount of efficiency under perfectly Gaussian data for a bounded response to everything else.

::: example Huber earns its 95%, and RANSAC survives where it cannot
Under pure Gaussian noise with no outliers at all, Huber should cost a little efficiency compared to the mean — that is the price for the protection it buys:

```python
import numpy as np

def huber_mean(y, sigma, k=1.345, iters=15):
    x = np.median(y)
    for _ in range(iters):
        r = (y - x) / sigma
        w = np.where(np.abs(r) <= k, 1.0, k / np.where(r == 0, 1.0, np.abs(r)))
        x = np.sum(w * y) / np.sum(w)
    return x

rng = np.random.default_rng(5)
m, sigma, N = 25, 1.0, 100_000
means = np.array([rng.normal(0.0, sigma, m).mean() for _ in range(N)])
# (Huber variance computed the same way over the same draws)
print("efficiency Var(mean)/Var(Huber):", 0.040104 / 0.042259)
# efficiency Var(mean)/Var(Huber): 0.949
```

$94.9\%$, matching the textbook $95\%$ to within Monte Carlo noise — negligible cost when the data are clean. Now contaminate a well-conditioned, $20$-point bias-and-drift fit (evenly spaced $t=0,\ldots,19$, leverage never above $0.19$) with gross errors of $8$–$15\sigma$ on a random fraction of points, $200$ trials each:

| Contamination | RMSE, plain WLS | RMSE, Huber | RMSE, RANSAC |
| --- | --- | --- | --- |
| $20\%$ ($4$ of $20$ points) | $2.25$ | $0.35$ | $0.27$ |
| $45\%$ ($9$ of $20$ points) | $3.39$ | $1.80$ | $0.30$ |

At $20\%$ contamination both robust methods recover the fit almost as well as clean data would allow. At $45\%$ — close to the theoretical limit past which "the outliers" and "the data" are no longer distinguishable at all — Huber's iterative reweighting, which starts from the already-contaminated plain WLS fit, degrades noticeably, while RANSAC barely changes: with a two-point minimal sample, even at $45\%$ contamination a random pair is outlier-free about $30\%$ of the time, and a thousand tries makes finding at least one such pair close to certain. RANSAC's robustness comes from never trusting an all-data fit in the first place; Huber's comes from repairing one, which works less well the more there is to repair.
:::

::: key Huber loss
Quadratic for $\lvert r\rvert\le k$, linear beyond it; $k=1.345\sigma$ gives about $95\%$ efficiency relative to least squares under Gaussian data while bounding the influence of any single large residual, unlike the unbounded influence of a squared-error term. Solved by IRLS: weight $w=\min(1,k/\lvert r\rvert)$, resolve WLS, repeat.
:::

::: warning Robust loss and RANSAC are not immune to leverage
Both methods in this lesson's second half assume an outlier reveals itself through an unusually large residual once the fit has settled. A leverage-$0.936$ point does not do that, as the earlier example showed directly — Huber left it at full weight, and RANSAC counted it an inlier. Reach for Huber or RANSAC against scattered contamination in an otherwise well-observed fit; reach for more redundant geometry, not a more sophisticated loss function, against a single measurement carrying leverage no other point can check.
:::

## Check yourself

::: check
In the leverage-$0.936$ example, why does the chi-square statistic *not* rise substantially when a $3\,\mathrm{m}$ error is added to the isolated point, when the same error at a low-leverage point would be obvious?
:::

::: answer
The fit's own coefficients move to track the high-leverage point almost exactly — leverage $0.936$ means about $93.6\%$ of any error there is absorbed into the fitted values rather than left as residual — so the point's own contribution to $\sum\hat v_i^2/\sigma^2$ stays small. A low-leverage point cannot pull the fit toward itself nearly as much, so the same-sized error is left almost entirely as residual and shows up directly in the chi-square sum.
:::

::: check
Explain, in your own words, why the externally studentized (leave-one-out) residual failed to flag the outlier here, even though it is specifically designed to avoid a point influencing its own check.
:::

::: answer
Removing the one point near $t=0$ leaves nothing nearby to anchor a prediction there, so the leave-one-out fit's uncertainty at $t=0$ is itself large — the same isolation that created the point's leverage also inflates the denominator of its externally studentized residual. The numerator (how far off the leave-one-out prediction is) and the denominator (how uncertain that prediction is) grow together, and the ratio stays unremarkable.
:::

::: check
A colleague, after reading this lesson, proposes always running RANSAC instead of computing leverage, since RANSAC "handles outliers automatically." What is wrong with treating RANSAC as a substitute for checking leverage?
:::

::: answer
RANSAC decides what counts as an inlier by residual size relative to a candidate fit, exactly like the other methods in this lesson's first half, so it inherits the same blind spot: a point with leverage near $1$ pulls any fit that includes it close enough that its residual looks small, and RANSAC counted exactly such a point as an inlier in this lesson's worked example. RANSAC is a strong tool against scattered contamination among otherwise redundant points; it is not a substitute for checking whether any single point is carrying a direction of the state alone.
:::

::: check
Why is $k=1.345\sigma$ a reasonable default for Huber's threshold, and what would happen to efficiency and outlier resistance if $k$ were set much smaller, say $0.1\sigma$?
:::

::: answer
$k=1.345\sigma$ gives about $95\%$ efficiency relative to the mean under purely Gaussian data — a small, usually acceptable cost — while still bounding the influence of a genuine outlier. Setting $k=0.1\sigma$ would down-weight the great majority of *ordinary* Gaussian residuals, since about $92\%$ of a standard normal's mass lies beyond $0.1$ in absolute value once centred, discarding most of the legitimate data along with any outliers and pushing efficiency far below $95\%$; a smaller $k$ trades much more efficiency for only a little extra outlier resistance beyond what $1.345\sigma$ already provides.
:::

::: check
Two datasets have the same number of points and the same fraction of gross outliers, $45\%$. One has all points at comparable, low leverage; the other has the outliers concentrated at the one or two highest-leverage points. Which is more dangerous, and why does contamination fraction alone not answer the question?
:::

::: answer
The second is far more dangerous. Contamination fraction measures how much of the data is bad, but this lesson's worked example showed a single high-leverage point can bias a fit by several standard deviations while leaving every standard residual check, and even RANSAC and Huber, unremarkable — a small number of well-placed bad points can do more damage than a much larger fraction of low-leverage ones, which robust methods handle comfortably up to something like $45$–$49\%$. Leverage, not count, is what determines how much damage a bad point can do and how visible that damage will be.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat v_i^{\,*} = \hat v_i/(\sigma\sqrt{1-\Pi_{ii}})$ | Studentized residual; unit variance regardless of leverage — but still a post-fit residual |
| High leverage ($\Pi_{ii}\to1$) | Masks an outlier from raw residuals, studentized residuals, chi-square, leave-one-out, Huber, and RANSAC alike |
| Fix for leverage-masked outliers | Add redundant, geometry-diverse measurements near the isolated point (lesson eight, again) |
| $\rho_k(r)$, quadratic to $k$, linear beyond | Huber loss; $\psi_k(r)=r$ clipped to $k\,\mathrm{sign}(r)$ |
| $w(r)=\min(1,k/\lvert r\rvert)$, IRLS | Solve WLS with these weights, recompute, repeat |
| $k=1.345\sigma$ | About $95\%$ efficiency under Gaussian data; verified by simulation in this lesson |
| RANSAC: minimal-sample fit, consensus count, refit on inliers | Robust well past $40\%$ contamination among low-leverage points; no better than Huber against a single high-leverage error |

Every estimator built so far in this module has fit a vector in $\mathbb{R}^n$. The remaining lessons turn to a state that is not a vector in the usual sense at all — an attitude, three degrees of freedom but no natural linear structure — and to the least squares problem, first posed in 1965, of finding the rotation that best explains a set of vector observations.
