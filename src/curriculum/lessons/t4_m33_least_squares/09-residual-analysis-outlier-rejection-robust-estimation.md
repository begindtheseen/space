---
id: l09-residual-analysis-outlier-rejection-robust-estimation
title: "Residual analysis, outlier rejection, and robust estimation"
minutes: 24
covers:
  - "Residual analysis, outlier rejection, and robust estimation (Huber loss, RANSAC)"
---

Your class measures a bean plant every day for a month and draws the best straight line through the heights. One day somebody reads the ruler upside down and writes $31\,\mathrm{cm}$ instead of $13$. On a graph that dot sits far off the line, and you would spot it in a second. But suppose the bad reading is the *only* one from the first week, and every other measurement comes from the last few days. Now the line swings to pass right through the bad dot, because nothing else is there to argue with it. The graph looks tidy, and the line is wrong.

That second situation is what this lesson is about. Weighted least squares trusts every measurement exactly as much as its stated $\sigma$ says to, and real sensors do not always deserve that trust. A star tracker occasionally locks onto the wrong star. A GNSS signal bounces off a building before it arrives (**[[multipath|multipath]]**). A downlinked telemetry word loses a bit. A measurement that is far more wrong than its noise level allows is an **outlier**.

Lesson one planted a warning about the most dangerous kind: an outlier at a point of high leverage hides in its own residual. This lesson cashes that warning in. It builds a fit that passes every standard check and is still wrong. It shows honestly that the fixes you would reach for first do not fix it, and finds the one that does. Then it builds **Huber loss** and **RANSAC**, two robust methods, for the kind of trouble they are really good at.

## Residuals, leverage and the studentized residual

A **residual** is what is left over after the fit: measured value minus fitted value, $\hat v_i = y_i - \mathbf{h}_i^\mathsf{T}\hat{\mathbf{x}}$. If the model and noise are right, residuals should look like noise. **Residual analysis** is the habit of checking that they do.

Recall from lesson one the **leverage** $\Pi_{ii}$ (read "pi i i"), the $i$-th diagonal entry of the hat matrix. It measures how hard the fit is pulled toward measurement $i$, on a scale from $0$ to $1$. Think of a [[seesaw|leverage-seesaw]]: a kid sitting far out on the end moves it much more than one near the middle. A measurement far from all the others, in the direction the state cares about, sits far out on the end.

Lesson one also showed that the $i$-th residual has variance $\sigma^2(1-\Pi_{ii})$. That is *smaller* than the noise variance $\sigma^2$, and much smaller at high leverage, because the fit chases high-leverage points. So comparing a raw residual with the raw $\sigma$ is unfair: a high-leverage point's residual is always small, whether the point is good or bad. The fair comparison is the **[[studentized|student]] residual**,

$$
\hat{v}_i^{\,*} = \frac{\hat v_i}{\sigma\sqrt{1-\Pi_{ii}}} ,
$$

read "v hat i star". It divides each residual by its own standard deviation. It has variance $1$ for every point regardless of leverage, and if the model and noise assumptions hold it should look like a draw from the standard normal distribution $\mathcal{N}(0,1)$. A value beyond about $3$ is suspicious.

The other standard check is the **chi-square test** of lesson four. The sum $2J = \sum_i \hat v_i^2/\sigma^2$ should be about $m - n$ (measurements minus unknowns), its **degrees of freedom**. The **$p$-value** is the chance that honest noise would produce a sum at least this large. A tiny $p$, say below $0.01$, says something is wrong.

::: example A fit that looks fine and is wrong
Take the bias-and-drift model of lesson one's receiver clock: $y = x_0 + x_1 t$, with true values $x_0 = 1250.0\,\mathrm{m}$ and $x_1 = 3.2\,\mathrm{m/s}$, and noise $\sigma=0.5\,\mathrm{m}$. There is one reading at $t=0$ and five more clustered from $t=20$ to $28\,\mathrm{s}$. The lonely point carries almost the whole job of pinning down the intercept $x_0$.

```python
import numpy as np
from scipy import stats

sigma = 0.5
t = np.array([0., 20., 22., 24., 26., 28.])
y = np.array([1249.80, 1314.13, 1320.70, 1326.31, 1333.58, 1339.73])
H = np.column_stack([np.ones_like(t), t])      # bias + drift * t

def check(H, y):
    x = np.linalg.lstsq(H, y, rcond=None)[0]
    r = y - H @ x                               # residuals
    lev = np.diag(H @ np.linalg.inv(H.T @ H) @ H.T)
    stud = r / (sigma * np.sqrt(1 - lev))       # studentized residuals
    chi2 = np.sum(r**2) / sigma**2              # 2J
    p = stats.chi2.sf(chi2, len(y) - H.shape[1])
    return x, lev, stud, chi2, p

x, lev, stud, chi2, p = check(H, y)
print("leverage:", lev.round(3))
print(f"clean:   x0={x[0]:.2f}  stud={stud.round(2)}  2J={chi2:.2f}  p={p:.2f}")
y_bad = y.copy()
y_bad[0] += 3.0                                 # one 3 m glitch at t = 0
x, lev, stud, chi2, p = check(H, y_bad)
print(f"glitch:  x0={x[0]:.2f}  stud={stud.round(2)}  2J={chi2:.2f}  p={p:.2f}")
# leverage: [0.936 0.167 0.174 0.197 0.236 0.29 ]
# clean:   x0=1249.81  stud=[-0.1   0.19  0.52 -1.29  0.62 -0.01]  2J=1.88  p=0.76
# glitch:  x0=1252.62  stud=[ 1.42 -0.9  -0.07 -1.38  1.06  1.  ]  2J=3.89  p=0.42
```

The point at $t=0$ has leverage $0.936$. With clean data the fit recovers the truth to within noise: $\hat x_0 = 1249.81$, and the standard deviation of $\hat x_0$ is $0.484\,\mathrm{m}$. Now add a single $3\,\mathrm{m}$ error to the lonely point — six times $\sigma$, the kind of error a real glitch produces — and refit.

| | clean | $+3\,\mathrm{m}$ at $t=0$ |
| --- | --- | --- |
| $\hat x_0$ (bias) | $1249.81$ | $1252.62$ |
| error in $\hat x_0$ | $-0.19$ | $+2.62$ ($5.4\,\sigma_{\hat x_0}$) |
| $2J$ (chi-square, $4$ degrees of freedom) | $1.88$ | $3.89$ |
| $p$-value | $0.76$ | $0.42$ |
| raw residual at $t=0$ | $-0.01\,\mathrm{m}$ | $0.18\,\mathrm{m}$ |
| studentized residual at $t=0$ | $-0.10$ | $1.42$ |

**Reading the table.** The intercept is now wrong by $5.4$ of its own standard deviations — a serious navigation error. The glitch alone moved it by $0.936 \times 3 = 2.81\,\mathrm{m}$. Yet every ordinary check says the fit is fine. The chi-square statistic is actually *closer* to its expected value of $4$ with the glitch than without it. The raw residual at the bad point is under $0.2\,\mathrm{m}$. The studentized residual, built specifically to correct for leverage, reads $1.42$ — unremarkable, and not even the largest in the list. Leverage $0.936$ means the fit chases this point almost exactly, so the error is absorbed into the parameters instead of being left visible as a residual anywhere.
:::

## Why the obvious fixes do not fix this one

Three repairs come to mind. A **leave-one-out** check refits without the suspect point, predicts its value from the others, and asks how far off the measurement is. **Huber loss** and **RANSAC**, described fully later in this lesson, are tools built for outliers in general. Try all three, honestly, on the same case.

::: example The standard remedies, tested against the same fit
```python
import numpy as np

sigma = 0.5
t = np.array([0., 20., 22., 24., 26., 28.])
y = np.array([1252.80, 1314.13, 1320.70, 1326.31, 1333.58, 1339.73])  # glitch included
H = np.column_stack([np.ones_like(t), t])

# 1. Leave-one-out: refit without t = 0, then predict it
keep = np.arange(6) != 0
x_loo = np.linalg.lstsq(H[keep], y[keep], rcond=None)[0]
pred = H[0] @ x_loo
var_pred = sigma**2 + sigma**2 * H[0] @ np.linalg.inv(H[keep].T @ H[keep]) @ H[0]
print(f"leave-one-out: predicted {pred:.2f}, off by {(y[0] - pred) / np.sqrt(var_pred):.2f} sigma")

# 2. Huber by iteratively reweighted least squares
def huber_fit(H, y, k=1.345, iters=30):
    x = np.linalg.lstsq(H, y, rcond=None)[0]
    for _ in range(iters):
        r = np.abs(y - H @ x) / sigma
        w = np.minimum(1.0, k / np.maximum(r, 1e-12))
        x = np.linalg.lstsq(H * np.sqrt(w)[:, None], y * np.sqrt(w), rcond=None)[0]
    return x, w
x_h, w = huber_fit(H, y)
print(f"Huber: x0={x_h[0]:.2f}, weights={w.round(2)}")

# 3. RANSAC: lines through random pairs, keep the one most points agree with
rng = np.random.default_rng(0)
best = None
for _ in range(1000):
    i, j = rng.choice(6, 2, replace=False)
    x = np.linalg.solve(H[[i, j]], y[[i, j]])
    inliers = np.abs(y - H @ x) < 3 * sigma
    if best is None or inliers.sum() > best.sum():
        best = inliers
x_r = np.linalg.lstsq(H[best], y[best], rcond=None)[0]
print(f"RANSAC: x0={x_r[0]:.2f}, inliers={best}")
# leave-one-out: predicted 1249.99, off by 1.42 sigma
# Huber: x0=1252.62, weights=[1. 1. 1. 1. 1. 1.]
# RANSAC: x0=1252.62, inliers=[ True  True  True  True  True  True]
```

| Method | Result at $t=0$ | Verdict |
| --- | --- | --- |
| Leave-one-out (externally studentized) residual | $1.42$ | Not flagged |
| Huber weight ($k=1.345\sigma$) | $1.00$ (full weight) | Not flagged; no point is down-weighted at all |
| RANSAC (2-point samples, $1000$ trials) | marked an inlier | Not flagged; same $\hat x_0=1252.62$ as plain least squares |

**Leave-one-out.** The leave-one-out prediction, $1249.99$, is actually close to the truth, and the measurement is $2.8\,\mathrm{m}$ away from it. So why only $1.42$? Removing the lonely point removes the *only* data near $t=0$. Predicting its value from the cluster at $20$ to $28\,\mathrm{s}$ means extending a line a long way back, so the prediction is itself very uncertain: its standard deviation is $1.97\,\mathrm{m}$. The ratio stays small. In fact, when $\sigma$ is known this ratio is *always* exactly equal to the ordinary studentized residual ($1.42$ both times), so leave-one-out can never see more than the studentized residual already did.

**Huber and RANSAC.** These fail for a blunter reason. Both decide what to trust by looking at residuals from a fit, and the fit had already bent itself around the bad point before either method got a chance to notice. RANSAC fares no better: every line through the bad point and any one cluster point fits all six points within $3\sigma$, so it happily reports all six as inliers.
:::

::: note Why leave-one-out equals the studentized residual
Remove point $i$ and refit. A standard identity from the hat matrix says the leave-one-out prediction error is the ordinary residual scaled up: $y_i - \mathbf{h}_i^\mathsf{T}\hat{\mathbf{x}}_{(i)} = \hat v_i/(1-\Pi_{ii})$. Its variance is $\sigma^2 + \sigma^2\mathbf{h}_i^\mathsf{T}(\mathbf{H}_{(i)}^\mathsf{T}\mathbf{H}_{(i)})^{-1}\mathbf{h}_i = \sigma^2/(1-\Pi_{ii})$, by the Sherman-Morrison identity of lesson seven. Divide the first by the square root of the second:

$$
\frac{\hat v_i/(1-\Pi_{ii})}{\sigma/\sqrt{1-\Pi_{ii}}} = \frac{\hat v_i}{\sigma\sqrt{1-\Pi_{ii}}} = \hat v_i^{\,*}.
$$

With $\Pi_{ii} = 0.936$: the residual $0.18$ becomes a prediction error of $0.18/0.064 = 2.8\,\mathrm{m}$, and the standard deviation $0.5$ becomes $0.5/\sqrt{0.064} = 1.97\,\mathrm{m}$. (When $\sigma$ has to be estimated from the data, the two versions differ a little, because leaving the point out also changes the noise estimate.)
:::

::: warning Residual-based checks share a blind spot
Every method in the table above — studentized residuals, leave-one-out residuals, Huber's weights, RANSAC's inlier count — is built from how far a point sits from a fit computed from the data. A point with leverage near $1$ pulls any fit that includes it almost exactly onto itself, so no check built only from post-fit residuals can reliably see an error there, however large. This is not a flaw in one method. It is a limit shared by the whole family.
:::

## The fix that actually works

The remedy is not a cleverer statistic. It is more data in the direction that had none. Add one more reading near $t=0$ — say at $t=1\,\mathrm{s}$, reading $1253.24$ — and the lonely point's leverage drops from $0.936$ to $0.503$, because it no longer has to explain the intercept alone. Apply the same $3\,\mathrm{m}$ glitch at $t=0$ as before:

| Readings near $t=0$ | Leverage at $t=0$ | Studentized at $t=0$ | Others near $t=0$ | $2J$ (dof) | $p$-value | Shift in $\hat x_0$ from the glitch |
| --- | --- | --- | --- | --- | --- | --- |
| one ($t=0$) | $0.936$ | $1.42$ | — | $3.89$ ($4$) | $0.42$ | $2.81\,\mathrm{m}$ |
| two ($t=0, 1$) | $0.503$ | $3.90$ | $-3.63$ | $17.07$ ($5$) | $0.0044$ | $1.51\,\mathrm{m}$ |
| three ($t=0, 1, 2$) | $0.354$ | $4.48$ | $-2.24$, $-2.20$ | $21.93$ ($6$) | $0.0012$ | $1.06\,\mathrm{m}$ |

(The reading at $t=2\,\mathrm{s}$ is $1256.40$.)

With a second reading nearby, the same glitch produces a studentized residual of $3.90$ and a chi-square that is plainly wrong ($p = 0.0044$). The damage the glitch can do to $\hat x_0$ roughly halves, because one bad point can no longer single-handedly set the intercept.

Notice something honest in the middle row, though. *Both* early readings light up, one at $+3.90$ and one at $-3.63$. With only two witnesses you can tell they disagree, but not which one is lying. A third witness breaks the tie: in the last row the bad point stands out at $4.48$, and the good ones sit near $-2.2$. That is lesson eight's prescription again, now shown to matter for robustness as well as for variance: never let one measurement alone carry a whole direction of the state.

## Huber loss: squares for small errors, straight lines for big ones

Once no single point has outsized leverage, residual-based methods work as advertised. The first is Huber loss.

Least squares punishes a residual $r$ by $\tfrac12 r^2$. Double the miss and the penalty quadruples. That is why one wild point can drag the whole fit: its huge squared penalty dominates everything. Punishing by $|r|$ instead (the absolute value) is much calmer about wild points, but it is less efficient when the noise really is Gaussian. **[[Huber loss|huber-history]]** blends the two: squares for small residuals, a straight line for big ones.

$$
\rho_k(r) = \begin{cases} \tfrac12 r^2 & \lvert r\rvert \le k \\ k\lvert r\rvert - \tfrac12 k^2 & \lvert r\rvert > k \end{cases}
$$

Read $\rho_k$ as "rho sub k"; $k$ is the threshold where the loss switches from curve to line. The two pieces join smoothly. At $\lvert r\rvert=k$ both give the value $\tfrac12k^2$ (the second is $k \cdot k - \tfrac12 k^2$), and both have slope $k$.

The slope of the loss, $\psi_k(r) = d\rho_k/dr$ (read "psi"), is what pulls on the fit. It equals $r$ for small residuals and $k\,\mathrm{sign}(r)$ beyond $k$. So the pull is **clipped**: no single point can pull harder than $k$, however far off it is. With squared loss the pull grows forever.

To solve it, write the pull as a weight times the residual, $\psi_k(r)=w(r)\,r$, with

$$
w(r)=\min\left(1,\ \frac{k}{\lvert r\rvert}\right).
$$

Points inside the threshold get full weight $1$. A point at $3k$ gets weight $\tfrac13$. Then run **[[iteratively reweighted least squares|irls]] (IRLS)**: fit weighted least squares with these weights, recompute the residuals, recompute the weights, and repeat until nothing changes. Residuals here are measured in units of $\sigma$. The standard choice is $k=1.345\sigma$.

::: key Huber loss
Quadratic for $\lvert r\rvert\le k$, linear beyond it. $k=1.345\sigma$ gives about $95\%$ efficiency relative to least squares under Gaussian data while bounding the influence of any single large residual, unlike the unbounded influence of a squared-error term — without the all-or-nothing behavior of hard rejection. Solved by IRLS: weight $w=\min(1,k/\lvert r\rvert)$, re-solve WLS, repeat.
:::

**[[Efficiency|efficiency]]** here means: how small is the estimator's variance compared with the best possible one for Gaussian noise? An efficiency of $95\%$ means Huber's variance is about $1/0.95 \approx 1.05$ times that of plain least squares when the data are clean. That is the premium you pay for the insurance.

## RANSAC: let random pairs vote

RANSAC, short for **[[random sample consensus|ransac-history]]**, takes a completely different approach. It never trusts a fit to all the data. For a straight line:

1. Pick the smallest set of points that fixes the model — for a line, two points. This is a **minimal sample**.
2. Draw the line through them.
3. Count how many of *all* the points lie within a **gate** of that line, say $3\sigma$. Those points are its **consensus set**, or **inliers**.
4. Repeat many times with new random pairs. Keep the line with the biggest consensus set.
5. Refit by ordinary least squares using only that line's inliers.

The idea: if even one pair is outlier-free, its line will pass near all the good points and collect a big consensus set, while lines through bad points collect few. How many tries do you need? If a fraction $w$ of the points are good and each sample has $s$ points, one sample is all-good with probability $w^s$. To be $99\%$ sure at least one of $N$ samples is all-good, choose

$$
N = \frac{\log(1-0.99)}{\log(1-w^s)} .
$$

With $45\%$ contamination ($w = 0.55$) and pairs ($s = 2$), $w^s = 0.3025$ and $N = \log 0.01/\log 0.6975 \approx 12.8$, so $13$ tries. Samples are cheap, so real code usually runs many more.

::: example Huber earns its 95%, and RANSAC survives where it cannot
**Clean data first.** Under pure Gaussian noise with no outliers at all, Huber should cost a little efficiency compared with the mean. Here are $100{,}000$ clean data sets of $25$ readings each:

```python
import numpy as np

def huber_mean(y, k=1.345, iters=30):
    """Huber location estimate (sigma = 1), one row of y per data set."""
    x = np.median(y, axis=-1, keepdims=True)
    for _ in range(iters):
        r = np.abs(y - x)
        w = np.minimum(1.0, k / np.maximum(r, 1e-12))   # IRLS weights
        x = np.sum(w * y, axis=-1, keepdims=True) / np.sum(w, axis=-1, keepdims=True)
    return x[:, 0]

rng = np.random.default_rng(5)
y = rng.normal(0.0, 1.0, size=(100_000, 25))   # 100,000 clean data sets of 25 readings
var_mean = np.var(y.mean(axis=1))
var_huber = np.var(huber_mean(y))
print(f"Var(mean) = {var_mean:.5f}, Var(Huber) = {var_huber:.5f}, "
      f"efficiency = {var_mean / var_huber:.3f}")
# Var(mean) = 0.04010, Var(Huber) = 0.04226, efficiency = 0.949
```

$94.9\%$, matching the textbook $95\%$ to within the scatter of the simulation. The cost on clean data is small.

**Now dirty data.** Take a well-conditioned $20$-point bias-and-drift fit, evenly spaced at $t=0,1,\ldots,19$, so no leverage is above about $0.19$. Spoil a random set of points with gross errors of $8$ to $15\sigma$, of random sign, and compare the error in the fitted intercept over $200$ trials:

```python
import numpy as np

sigma = 1.0
t = np.arange(20.0)
H = np.column_stack([np.ones_like(t), t])
x_true = np.array([10.0, 0.5])

def wls(H, y):
    return np.linalg.lstsq(H, y, rcond=None)[0]

def huber_fit(H, y, k=1.345, iters=30):
    x = wls(H, y)                              # start from the plain fit
    for _ in range(iters):
        r = np.abs(y - H @ x) / sigma
        w = np.sqrt(np.minimum(1.0, k / np.maximum(r, 1e-12)))
        x = wls(H * w[:, None], y * w)         # weighted refit
    return x

def ransac_fit(H, y, rng, trials=200, gate=3.0):
    best = None
    for _ in range(trials):
        i, j = rng.choice(len(y), 2, replace=False)
        x = np.linalg.solve(H[[i, j]], y[[i, j]])      # line through 2 points
        inliers = np.abs(y - H @ x) < gate * sigma     # who agrees with it?
        if best is None or inliers.sum() > best.sum():
            best = inliers
    return wls(H[best], y[best])               # refit on the consensus set

rng = np.random.default_rng(1)
for n_bad in (4, 9):
    err = {"plain": [], "Huber": [], "RANSAC": []}
    for _ in range(200):
        y = H @ x_true + rng.normal(0, sigma, 20)
        bad = rng.choice(20, n_bad, replace=False)
        y[bad] += rng.choice([-1, 1], n_bad) * rng.uniform(8, 15, n_bad) * sigma
        for name, x in (("plain", wls(H, y)), ("Huber", huber_fit(H, y)),
                        ("RANSAC", ransac_fit(H, y, rng))):
            err[name].append(x[0] - x_true[0])   # error in the intercept
    print(n_bad, "bad:", {k: round(float(np.sqrt(np.mean(np.square(v)))), 2) for k, v in err.items()})
# 4 bad: {'plain': 2.32, 'Huber': 0.68, 'RANSAC': 0.49}
# 9 bad: {'plain': 3.39, 'Huber': 1.64, 'RANSAC': 1.11}
```

| Contamination | RMS intercept error, plain | Huber | RANSAC |
| --- | --- | --- | --- |
| none (for reference) | $0.43$ | — | — |
| $20\%$ ($4$ of $20$ points) | $2.32$ | $0.68$ | $0.49$ |
| $45\%$ ($9$ of $20$ points) | $3.39$ | $1.64$ | $1.11$ |

**Reading it.** With clean data the intercept's standard deviation would be $0.43$. At $20\%$ contamination, plain least squares is five times worse than that, while RANSAC is nearly back to clean-data quality and Huber is close behind.

At $45\%$ — close to the $50\%$ **[[breakdown point|breakdown]]**, past which "the outliers" and "the data" can no longer be told apart — Huber degrades badly. Its reweighting starts from the already-spoiled plain fit, and with nearly half the points bad it cannot fully repair it. RANSAC holds up better. Even at $45\%$ a random pair is outlier-free about $29\%$ of the time ($\tfrac{11}{20}\times\tfrac{10}{19}$), and $200$ tries make finding one nearly certain.

RANSAC is not magic, though. In one of those $200$ trials, five of the outliers happened to line up with eight good points, and RANSAC picked that false consensus of $13$; that single trial accounts for much of its $1.11$. RANSAC's strength comes from never trusting an all-data fit. Huber's comes from repairing one, which works less well the more there is to repair.
:::

::: warning Robust loss and RANSAC are not immune to leverage
Both methods assume an outlier shows itself through an unusually large residual once the fit settles. A leverage-$0.936$ point does not do that, as the earlier example showed directly: Huber left it at full weight, and RANSAC counted it an inlier. Reach for Huber or RANSAC against scattered contamination in an otherwise well-observed fit. Against a single measurement carrying leverage no other point can check, reach for more redundant geometry, not a fancier loss function.
:::

## Check yourself

::: check
In the leverage-$0.936$ example, why does the chi-square statistic *not* rise much when a $3\,\mathrm{m}$ error is added to the lonely point, when the same error at a low-leverage point would be obvious?
:::

::: answer
The fit's coefficients move to track the high-leverage point almost exactly. Leverage $0.936$ means about $93.6\%$ of any error there is absorbed into the fitted values, and only about $6.4\%$ ($0.064 \times 3 = 0.19\,\mathrm{m}$) is left as that point's residual. So its contribution to $\sum\hat v_i^2/\sigma^2$ stays small. A low-leverage point cannot pull the fit toward itself nearly as much. The same error is left almost entirely as residual, and at six times $\sigma$ it would add roughly $36$ to the chi-square sum.
:::

::: check
Explain in your own words why the leave-one-out (externally studentized) residual failed to flag the outlier here, even though it is designed so that a point cannot influence its own check.
:::

::: answer
Removing the one point near $t=0$ leaves nothing nearby to anchor a prediction there. The leave-one-out fit must extend a line from $t=20$ back to $t=0$, so its prediction at $t=0$ is very uncertain ($1.97\,\mathrm{m}$ standard deviation). The same isolation that gave the point its leverage also inflates the denominator of the check. The numerator (how far the measurement is from the leave-one-out prediction, $2.8\,\mathrm{m}$) and the denominator grow together, and the ratio stays at $1.42$ — exactly the ordinary studentized residual.
:::

::: check
A colleague proposes always running RANSAC instead of computing leverage, since RANSAC "handles outliers automatically". What is wrong with treating RANSAC as a substitute for checking leverage?
:::

::: answer
RANSAC decides what counts as an inlier by residual size relative to a candidate fit, just like the other residual-based checks, so it inherits the same blind spot. A point with leverage near $1$ pulls any fit that includes it close enough that its residual looks small; in the worked example, every line through the bad point fit all six readings, and RANSAC counted the bad point as an inlier. RANSAC is a strong tool against scattered contamination among otherwise redundant points. It does not replace checking whether any single point carries a direction of the state alone.
:::

::: check
Why is $k=1.345\sigma$ a reasonable default for Huber's threshold? What would happen to efficiency and outlier resistance if $k$ were set much smaller, say $0.1\sigma$?
:::

::: answer
$k=1.345\sigma$ gives about $95\%$ efficiency under purely Gaussian data — a small, usually acceptable cost — while still bounding the pull of any genuine outlier. With $k=0.1\sigma$, most *ordinary* residuals would be down-weighted: about $92\%$ of a standard normal distribution lies more than $0.1$ from its center. The estimator would throw away most of the information in good data along with any outliers, and its efficiency would fall far below $95\%$ (it would behave almost like a median). A much smaller $k$ trades a lot of efficiency for very little extra outlier resistance beyond what $1.345\sigma$ already gives.
:::

::: check
Two data sets have the same number of points and the same fraction of gross outliers, $45\%$. In one, all points have similar, low leverage. In the other, the outliers include the one or two highest-leverage points. Which is more dangerous, and why does the contamination fraction alone not answer the question?
:::

::: answer
The second is far more dangerous. The contamination fraction measures how much of the data is bad, but this lesson's first example showed that a single high-leverage point can bias a fit by several standard deviations while leaving every residual check — and even Huber and RANSAC — unremarkable. A few well-placed bad points can do more damage than many low-leverage ones, which robust methods handle reasonably up to near the $50\%$ breakdown point. Leverage, not count, decides how much damage a bad point can do and how visible that damage will be.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat v_i^{\,*} = \hat v_i/(\sigma\sqrt{1-\Pi_{ii}})$ | Studentized residual; variance $1$ regardless of leverage, but still a post-fit residual |
| Leave-one-out with known $\sigma$ | Exactly equal to the studentized residual |
| High leverage ($\Pi_{ii}\to1$) | Hides an outlier from raw residuals, studentized residuals, chi-square, leave-one-out, Huber and RANSAC alike |
| Fix for leverage-masked outliers | Add redundant, geometry-diverse measurements near the lonely point; three can outvote one |
| $\rho_k(r)$: quadratic up to $k$, linear beyond | Huber loss; its slope $\psi_k(r)=r$ is clipped to $k\,\mathrm{sign}(r)$ |
| $w(r)=\min(1,k/\lvert r\rvert)$, IRLS | Solve WLS with these weights, recompute, repeat |
| $k=1.345\sigma$ | About $95\%$ efficiency under Gaussian data; checked by simulation here |
| RANSAC | Minimal-sample fit, consensus count, refit on inliers; $N = \log(0.01)/\log(1-w^s)$ tries for $99\%$ |

Every estimator built so far in this module has fit an ordinary vector of numbers. The remaining lessons turn to a state that is not an ordinary vector at all — an attitude, with three degrees of freedom but no natural straight-line structure — and to the least squares problem, first posed in 1965, of finding the rotation that best explains a set of vector observations.

::: context multipath When a signal takes the long way round
Radio signals bounce. Near a tall building, a GNSS receiver may get a satellite's signal both directly and after a reflection, or only after a reflection. A reflected signal travels farther, so it makes the satellite look a few meters to tens of meters more distant than it really is. Nothing in the signal itself says "I bounced". To the estimator it is simply a measurement that is far more wrong than its stated noise, which is exactly what an outlier is. Urban navigation fights this constantly.
:::

::: context leverage-seesaw A lonely point on a long lever
The dots show the six readings after the steady climb of $3.2\,\mathrm{m}$ per second is subtracted, so the true line is flat at zero (grey). The lonely reading at $t=0$ is the glitched one. With nothing else near it, the fitted line (blue) swings up to pass almost through it, and the five far points barely object:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="155" font-size="11" fill="#1f2a44" text-anchor="middle">t = 0</text>
  <text x="280" y="155" font-size="11" fill="#1f2a44" text-anchor="middle">t = 20 to 28 s</text>
  <line x1="40" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="120" y="126" font-size="11" fill="#6c7a93">truth</text>
  <line x1="40" y1="44.5" x2="340" y2="122.4" stroke="#1d6fd1" stroke-width="2"/>
  <text x="120" y="56" font-size="11" fill="#1d6fd1">fit</text>
  <circle cx="40" cy="40" r="5" fill="#b4232c"/>
  <text x="52" y="30" font-size="11" fill="#b4232c">glitch, leverage 0.94</text>
  <g fill="#1f2a44">
    <circle cx="240" cy="106.7" r="4"/>
    <circle cx="260" cy="102.5" r="4"/>
    <circle cx="280" cy="122.3" r="4"/>
    <circle cx="300" cy="100.5" r="4"/>
    <circle cx="320" cy="106.7" r="4"/>
  </g>
</svg>
```
:::

::: context student Why "studentized"
The name honors William Sealy Gosset, a chemist at the Guinness brewery in Dublin. The brewery did not want its staff publishing under their own names, so in 1908 he published his work on small samples under the pen name "Student" — hence the Student's $t$ distribution. "Studentizing" came to mean dividing a quantity by an estimate of its own standard deviation, which is exactly what this lesson does to each residual.
:::

::: context huber-history A statistician's insurance policy
Peter Huber, a Swiss statistician, introduced this loss in 1964, in a paper that helped found the field of robust statistics. His question was: what estimator does best in the *worst* case, when the noise is mostly Gaussian but a small fraction is something else entirely? The answer was this blend of square and straight line. The picture shows squared loss (grey) and Huber loss with $k = 1$ (blue); they agree inside the dashed marks and part ways outside:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="190" x2="340" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="40" x2="180" y2="195" stroke="#1f2a44" stroke-width="1"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="30,55 42.5,76.6 55,96.2 67.5,114.1 80,130 92.5,144.1 105,156.2 117.5,166.6 130,175 142.5,181.6 155,186.2 167.5,189.1 180,190 192.5,189.1 205,186.2 217.5,181.6 230,175 242.5,166.6 255,156.2 267.5,144.1 280,130 292.5,114.1 305,96.2 317.5,76.6 330,55"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="30,115 130,175 142.5,181.6 155,186.2 167.5,189.1 180,190 192.5,189.1 205,186.2 217.5,181.6 230,175 330,115"/>
  <g stroke="#b4232c" stroke-width="1" stroke-dasharray="3 3">
    <line x1="130" y1="120" x2="130" y2="195"/>
    <line x1="230" y1="120" x2="230" y2="195"/>
  </g>
  <g font-size="11" text-anchor="middle">
    <text x="130" y="206" fill="#b4232c">−k</text>
    <text x="230" y="206" fill="#b4232c">+k</text>
    <text x="330" y="206" fill="#1f2a44">r = 3</text>
    <text x="300" y="70" fill="#6c7a93">½ r²</text>
    <text x="300" y="148" fill="#1d6fd1">Huber</text>
  </g>
</svg>
```
:::

::: context irls Solving a hard problem as a string of easy ones
Minimizing Huber loss directly is not a least squares problem, so the tidy formulas of this module do not apply. Iteratively reweighted least squares turns it into a sequence of problems that *are* least squares, each with fixed weights. Because each step is an ordinary weighted fit, all the good machinery carries over — QR, whitening, covariance. The same trick solves many other robust losses; only the weight formula changes.
:::

::: context efficiency What 95 percent buys you
Efficiency compares variances. At $95\%$, Huber on clean Gaussian data behaves as if it had thrown away about one reading in twenty. That is the premium. The payout comes when something goes wrong: one wild reading ten $\sigma$ off can move a plain average of $25$ readings by $0.4\sigma$ on its own, while Huber's clipped pull limits its effect to roughly an ordinary reading's worth. The median is the other extreme — very tough, but only about $64\%$ efficient on large clean samples.
:::

::: context ransac-history Born in computer vision
Martin Fischler and Robert Bolles of SRI International published RANSAC in 1981, for the problem of working out where a camera is from points in an image, when many of the automatically matched points are simply wrong. It is still everywhere in vision: phone panorama stitching, robot and drone visual navigation, and the terrain-relative navigation that helped guide NASA's Perseverance rover to its landing site in 2021 by matching camera images to a stored map.
:::

::: context breakdown Where any method must give up
The breakdown point of an estimator is the fraction of the data that can be made arbitrarily bad before the estimate can be dragged arbitrarily far. For the plain average it is $0\%$: one wild point is enough. For the median it is $50\%$, the most possible. Past half, a gang of outliers that agree with each other looks exactly like "the data", and nothing can tell which group is honest.
:::
