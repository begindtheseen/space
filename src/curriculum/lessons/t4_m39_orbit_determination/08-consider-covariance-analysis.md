---
id: l08-consider-covariance-analysis
title: Consider-covariance analysis
minutes: 19
covers:
  - Consider-covariance analysis
---

Imagine you want to know your weight very precisely. You step on the bathroom scale a hundred times and average the readings. Each reading wobbles by about half a kilogram, but the wobbles are random, so they mostly cancel. The average of a hundred readings wobbles by only a twentieth of a kilogram. Impressive.

Now suppose the scale itself might be off. Nobody ever checked it against a known weight, so it could read a few hundred grams too high or too low — the same amount every time. Averaging does nothing about that. A hundred readings from a scale that reads $0.3\,\mathrm{kg}$ heavy average to a number that is $0.3\,\mathrm{kg}$ heavy. If you report "my weight, plus or minus $0.05\,\mathrm{kg}$", you are claiming far more than you know. The honest statement includes the scale's own uncertainty.

That is this lesson in one picture. The previous lesson ended with three ways to handle a parameter you are not sure of: solve for it, absorb it with process noise, or **consider** it. To consider a parameter means to leave it out of the state — you never estimate it — but still add its uncertainty to the covariance you report. A station's range bias, a slightly wrong **[[area-to-mass ratio|area-to-mass]]** in the drag model, a **[[gravity field coefficient|gravity-coefficients]]** left out of the force model: each may be too poorly observed by a given arc to solve for sensibly, or not worth an extra state in a routine fit, and still not be zero. **Consider-covariance analysis** is the honest middle ground. The estimate does not change. The reported covariance does, by exactly the amount the unestimated parameter's uncertainty deserves.

## The bathroom scale, done with matrices

Before the general formula, work the scale with the tools of the batch lesson. It is the smallest possible case, and every piece of the general answer shows up in it.

Two kinds of error are hiding in the readings.

- **Random noise**: different on every reading, averaging away as you take more.
- A **[[bias|bias]]**: an offset that is the same on every reading, and does not average away.

The estimator solves only for your weight $x$. It fixes the scale's offset $c$ at its best guess, $\bar c = 0$, and never solves for it. The parameter $c$ is called a **consider parameter**: its uncertainty is considered, its value is not estimated.

::: example The bathroom scale, naive and honest
You take $N = 100$ readings. Each has random noise $\sigma = 0.5\,\mathrm{kg}$. The scale's offset is unknown, with uncertainty $\sigma_c = 0.3\,\mathrm{kg}$.

**The naive answer.** Averaging $N$ readings divides the noise by $\sqrt N$:

$$
\sigma_{\text{naive}} = \frac{\sigma}{\sqrt N} = \frac{0.5}{\sqrt{100}} = 0.05\,\mathrm{kg}.
$$

**How much does the offset move the answer?** Every reading carries the full offset, so the average carries all of it too. An offset of $0.3\,\mathrm{kg}$ moves your estimated weight by exactly $0.3\,\mathrm{kg}$. The **sensitivity** — the shift in the estimate per unit of offset — is $S = 1$.

**The honest answer.** The noise and the offset are independent, so their variances add (the proof is in the next section):

$$
\sigma_{\text{consider}}^2 = 0.05^2 + 1^2 \times 0.3^2 = 0.0025 + 0.09 = 0.0925\,\mathrm{kg^2},
$$

so $\sigma_{\text{consider}} = \sqrt{0.0925} \approx 0.304\,\mathrm{kg}$.

The honest uncertainty is six times the naive one. Here is the same calculation with matrices, plus a **[[Monte Carlo|monte-carlo]]** check that draws a fresh random offset and fresh noise in each of $20{,}000$ trials:

```python
import numpy as np

N, sigma, sigma_c = 100, 0.5, 0.3         # readings, noise per reading (kg), offset uncertainty (kg)
Hx = np.ones((N, 1))                      # every reading measures the weight directly
Hc = np.ones((N, 1))                      # ...and every reading carries the same offset
W = np.eye(N) / sigma**2
Lam = Hx.T @ W @ Hx
S = np.linalg.solve(Lam, Hx.T @ W @ Hc)
P_naive = np.linalg.inv(Lam)
P_consider = P_naive + S @ [[sigma_c**2]] @ S.T
print("S =", S[0, 0], " naive sigma =", np.sqrt(P_naive[0, 0]), " consider sigma =", np.sqrt(P_consider[0, 0]))

rng = np.random.default_rng(3)            # Monte Carlo: a new scale offset every trial
errs = [np.mean(sigma_c * rng.normal() + sigma * rng.normal(size=N)) for _ in range(20_000)]
print("Monte Carlo sigma =", np.std(errs))
# S = 1.0  naive sigma = 0.05  consider sigma = 0.30413812651491096
# Monte Carlo sigma = 0.30283934241173077
```

**Sanity check.** The Monte Carlo scatter, $0.303\,\mathrm{kg}$, matches the consider answer, not the naive one. And it makes sense: taking more readings can never beat the scale's own offset.
:::

Notice what that means for information. With a shared offset, a hundred readings are not a hundred independent pieces of evidence about your weight. As far as the offset goes, they are all the *same* piece of evidence, repeated. However many readings you add, the consider uncertainty never drops below $\sigma_c$. An estimator that counts them as independent believes it knows far more than it does. That is the most common way a tracking pass with a station bias produces a covariance that is too small.

## The general formula

Now the full version. Suppose the true measurement model is

$$
\mathbf y=\mathbf H_x\mathbf x+\mathbf H_c\mathbf c+\mathbf v.
$$

Here $\mathbf x$ is the state being estimated, $\mathbf c$ is the vector of consider parameters, $\mathbf H_x$ and $\mathbf H_c$ say how each one shows up in the measurements, and $\mathbf v$ is random noise with covariance $\mathbf R$. The estimator fixes $\mathbf c$ at a nominal value $\bar{\mathbf c}$ (zero, for a bias) and runs ordinary weighted least squares on $\mathbf x$ alone. From the batch lesson, its correction is

$$
\delta\hat{\mathbf x} = \boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\,\delta\mathbf y, \qquad \boldsymbol\Lambda=\mathbf H_x^\mathsf T\mathbf W\mathbf H_x,
$$

with the weight matrix $\mathbf W=\mathbf R^{-1}$. ($\boldsymbol\Lambda$ is capital "lambda", the normal matrix.)

What does the data really contain? Linearize about the true $\mathbf x$, so the $\mathbf H_x$ term drops out of the residual. What is left is the offset piece plus the noise: $\delta\mathbf y=\mathbf H_c(\mathbf c-\bar{\mathbf c})+\mathbf v$. The estimator cannot tell the offset piece from a genuine state error. Substitute and split into two parts:

$$
\delta\hat{\mathbf x} = \underbrace{\boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf H_c}_{\mathbf S}\,(\mathbf c-\bar{\mathbf c}) + \boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf v.
$$

The matrix $\mathbf S$ is the **sensitivity matrix**: how much the state estimate moves for a given error in the consider parameter. It has one row per state component and one column per consider parameter. In the scale example it was the single number $1$.

The two parts are independent — one comes from $\mathbf c$, the other from the noise. So their covariances add. Let $\mathbf P_{cc}$ be the covariance describing how uncertain $\mathbf c$ is (in the scale example, $\sigma_c^2$). Then:

::: key The consider covariance
$$
\mathbf P_{xx}^{\text{consider}} = \boldsymbol\Lambda^{-1} + \mathbf S\mathbf P_{cc}\mathbf S^\mathsf T, \qquad \mathbf S=\boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf H_c.
$$
Consider covariance accounts for the uncertainty of a parameter you do NOT estimate (a station bias, a gravity coefficient, an area-to-mass ratio). The estimate $\hat{\mathbf x}$ itself is unchanged from ordinary weighted least squares, but the covariance is correctly inflated by a second term. That term is always **[[positive semi-definite|psd]]**, and it grows with how sensitive the fit is to the parameter ($\mathbf S$) and how uncertain the parameter really is ($\mathbf P_{cc}$). $\boldsymbol\Lambda^{-1}$ alone, the "naive" covariance, is a lower bound, honest only when $\mathbf P_{cc}=\mathbf 0$. Considering is the honest answer for poorly observable parameters.
:::

::: note Why it has to be true
Write the estimate error as $\mathbf e = \mathbf S\boldsymbol\gamma + \mathbf M\mathbf v$, where $\boldsymbol\gamma = \mathbf c - \bar{\mathbf c}$ and $\mathbf M = \boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W$. Both $\boldsymbol\gamma$ and $\mathbf v$ have mean zero, so $\mathbf e$ does too, and its covariance is $\mathbb E[\mathbf e\mathbf e^\mathsf T]$. Multiply out:

$$
\mathbb E[\mathbf e\mathbf e^\mathsf T] = \mathbf S\,\mathbb E[\boldsymbol\gamma\boldsymbol\gamma^\mathsf T]\,\mathbf S^\mathsf T + \mathbf M\,\mathbb E[\mathbf v\mathbf v^\mathsf T]\,\mathbf M^\mathsf T + (\text{cross terms}).
$$

The cross terms contain $\mathbb E[\boldsymbol\gamma\mathbf v^\mathsf T]$, which is zero because the offset and the noise are independent. The first term is $\mathbf S\mathbf P_{cc}\mathbf S^\mathsf T$. For the second, use $\mathbb E[\mathbf v\mathbf v^\mathsf T] = \mathbf R = \mathbf W^{-1}$:

$$
\mathbf M\mathbf R\mathbf M^\mathsf T = \boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf W^{-1}\mathbf W\mathbf H_x\boldsymbol\Lambda^{-1} = \boldsymbol\Lambda^{-1}\boldsymbol\Lambda\boldsymbol\Lambda^{-1} = \boldsymbol\Lambda^{-1}.
$$

Adding the two gives the key formula. The cancellation in the second term is why $\boldsymbol\Lambda^{-1}$ is the right covariance when there are no consider parameters at all.
:::

::: warning Consider is not solve-for
It is tempting to build the correction from $\mathbf H_c^\mathsf T\mathbf W\mathbf H_c$, which looks symmetric and tidy. That matrix answers a different question: how well the data would pin down $\mathbf c$ *if you were solving for it*. This estimator never solves for $\mathbf c$. The correction must track how an error in $\mathbf c$ leaks into $\hat{\mathbf x}$ through the estimator that actually runs, $\boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W$. That is why $\mathbf S$ has $\mathbf H_x$ on the left and $\mathbf H_c$ on the right.
:::

## A station bias, considered rather than solved

::: example Consider covariance versus what actually happens
Take the same three-pass, twelve-hour tracking arc as the batch lesson. Add a station range bias whose true value is unknown: zero on average, with $\sigma_{\text{bias}}=5\,\mathrm m$, and never solved for. Build $\mathbf H_x$ (the usual six-column design matrix, in the batch lesson's canonical units) and $\mathbf H_c$. The consider column $\mathbf H_c$ is $1$ on every range row and $0$ on every range-rate row, because a range bias does not affect range-rate.

Then compare three things: the naive covariance, the consider covariance, and a Monte Carlo run of $3000$ trials, each with a fresh random bias the estimator is never told about. Each line lists the standard deviation of the epoch state errors, three position components and three velocity components:

```python
# naive (Lambda^-1 only)   pos (m) = [0.204, 0.114, 0.096]   vel (mm/s) = [0.053, 0.700, 0.077]
# consider (+ S Pcc S^T)   pos (m) = [0.276, 0.157, 0.126]   vel (mm/s) = [0.053, 0.980, 0.091]
# Monte Carlo (3000)       pos (m) = [0.269, 0.153, 0.125]   vel (mm/s) = [0.052, 0.958, 0.090]
```

Read it column by column. The consider covariance predicts the Monte Carlo scatter to within a few percent everywhere. The naive covariance is too small in every component. The worst is the second velocity component, where the consider value is $40\%$ larger than the naive one ($0.980 / 0.700 = 1.4$).

**The estimate itself does not move.** The Monte Carlo trials use exactly the same estimator, with the same $\mathbf H_x$, that produced the naive covariance. The only thing that changed is the honest description of how much that estimate really varies — because a real, uncertain bias was in the data and nothing accounted for it.
:::

## When the consider parameter lives in the dynamics

A bias is a fixed offset added to measurements. A parameter can also enter through the *dynamics* — how the satellite moves. The drag parameter is the classic case: a wrong drag value bends the trajectory a little more every minute. That works exactly the same way. The only change is how you build $\mathbf H_c$. Instead of a constant column of ones, each entry is the measurement's sensitivity to the parameter through the trajectory: $\partial\mathbf x(t)/\partial c$, integrated alongside the orbit the same way $\boldsymbol\Phi$ is, then passed through the measurement partials.

::: example An unconsidered drag parameter, and what it really costs
Repeat the construction with the drag parameter $B$ of the batch lesson (the seventh state that lesson solved for) as the consider parameter, with $\sigma_B=0.003\,\mathrm{m^2/kg}$. It is never solved for and never given process noise. This is exactly the situation of the previous lesson's "$\mathbf Q=0$" case, now examined through the covariance rather than the residuals. This run was set up as its own simulation, so its naive numbers differ from the bias example's; compare the three lines with each other.

```python
# naive epoch sigma:     pos (m) = [1.83, 1.03, 0.87]     vel (mm/s) = [0.53, 6.18, 0.72]
# consider epoch sigma:  pos (m) = [187., 53.8, 107.]      vel (mm/s) = [76.8, 356., 48.1]
# Monte Carlo:           pos (m) = [186., 53.3, 106.]      vel (mm/s) = [76.2, 353., 47.7]
```

This time naive and consider do not differ by tens of percent. They differ by a factor of roughly $50$ to $150$, depending on the component. For the first position component, $187 / 1.83 \approx 102$. And the Monte Carlo agrees with the consider line again.

**What this means.** A drag uncertainty that looked safely ignorable dominates the true uncertainty of this fit completely, once its effect flows through $\mathbf S$ into every state component. It is the covariance side of the previous lesson's residual story: the same unmodelled force that leaves a trend in the residuals also leaves the reported covariance wrong by a huge factor — even in a fit whose residuals happen to look acceptable.
:::

::: warning A small parameter uncertainty does not mean a small consider correction
Nothing about $\sigma_c$ being modest guarantees that $\mathbf S\mathbf P_{cc}\mathbf S^\mathsf T$ is modest. The correction depends on $\mathbf S$ as much as on $\mathbf P_{cc}$. And $\mathbf S$ is large exactly when the tracking geometry cannot tell the parameter's effect apart from a change in the state. A drag error keeps pushing the satellite along its path, and a slightly different starting orbit can mimic that push very well — so this arc converts drag uncertainty into state uncertainty far more strongly than it converts a range bias. There is no shortcut for computing $\mathbf S$ and looking.
:::

## Consider covariance changes the honesty, not the answer

Be precise about what considering a parameter does and does not do.

- **It does not improve the estimate.** $\hat{\mathbf x}$ is exactly what plain weighted least squares on $\mathbf H_x$ produces, considered or not.
- **It does not need the parameter's value.** It needs only a prior on its *uncertainty*, $\mathbf P_{cc}$. If that prior is wrong, the consider correction is wrong in the same proportion.
- **It stops the covariance from silently understating risk.** A downstream user of the covariance — a **[[collision-probability|conjunction-bridge]]** calculation, a hand-off to another tracking station, a decision about how much maneuver margin to carry — trusts the reported uncertainty, not only the point estimate. The naive $\boldsymbol\Lambda^{-1}$ quietly assumed every unestimated parameter in the force and measurement models is known perfectly. That is never quite true, and the drag example shows how badly it can fail.

## Check yourself

::: check
Explain why $\mathbf S=\boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf H_c$ is called a sensitivity matrix, using its role in the formula for $\delta\hat{\mathbf x}$.
:::

::: answer
$\mathbf S$ is exactly the factor multiplying $(\mathbf c-\bar{\mathbf c})$ in the formula for $\delta\hat{\mathbf x}$. So it says how much the state estimate shifts per unit error in the consider parameter: $\partial\hat{\mathbf x}/\partial\mathbf c$ for the linear estimator being used. That is what "sensitivity" means here. It is not the sensitivity of a measurement to the state (that is $\mathbf H_x$, or $\mathbf H_c$ for the parameter). It is the sensitivity of the already-computed *estimate* to an error in a parameter the estimate never saw directly.
:::

::: check
A colleague says that since the consider covariance never changes $\hat{\mathbf x}$, it is a pure reporting exercise with no operational consequence. Use the drag example to argue against this.
:::

::: answer
Every downstream use of the covariance — a collision probability, a hand-off uncertainty to another tracking station, the maneuver margin you carry — depends on the *reported* uncertainty, not on the point estimate alone. In the drag example the naive covariance reports a position uncertainty about $100$ times smaller than the truth in the first component ($1.83\,\mathrm m$ versus about $187\,\mathrm m$). That could make a genuinely risky close approach look negligible, or make a rendezvous look as if it needs far less margin than it does. The estimate is the same either way; the decisions made from it are not.
:::

::: check
Go back to the bathroom scale, but now take $50$ readings on the uncalibrated scale (offset uncertainty $0.3\,\mathrm{kg}$) and $50$ on a perfectly calibrated one, all with noise $0.5\,\mathrm{kg}$. The estimator averages all $100$. Find $S$ and the consider standard deviation.
:::

::: answer
Now $\mathbf H_x$ is $100$ ones, but $\mathbf H_c$ is $1$ for the first $50$ readings and $0$ for the other $50$. With $\mathbf W = \mathbf I/\sigma^2$:

$$
\boldsymbol\Lambda = \frac{100}{\sigma^2}, \qquad \mathbf H_x^\mathsf T\mathbf W\mathbf H_c = \frac{50}{\sigma^2}, \qquad S = \frac{50}{100} = 0.5.
$$

That makes sense: only half the readings carry the offset, so the average carries half of it. The naive variance is unchanged at $0.05^2 = 0.0025\,\mathrm{kg^2}$. The consider variance is

$$
0.0025 + 0.5^2 \times 0.3^2 = 0.0025 + 0.0225 = 0.025\,\mathrm{kg^2},
$$

so $\sigma_{\text{consider}} = \sqrt{0.025} \approx 0.158\,\mathrm{kg}$ — about half the one-scale answer, because the calibrated scale dilutes the offset.
:::

::: check
Under what condition does the consider covariance reduce exactly to the naive covariance $\boldsymbol\Lambda^{-1}$?
:::

::: answer
When $\mathbf P_{cc}=\mathbf 0$: the consider parameter is in fact known exactly, with no uncertainty at all. Then $\mathbf S\mathbf P_{cc}\mathbf S^\mathsf T$ vanishes however large $\mathbf S$ is, and $\mathbf P_{xx}^{\text{consider}}=\boldsymbol\Lambda^{-1}$ exactly. (It also vanishes if $\mathbf S = \mathbf 0$, when the parameter has no effect on the estimate at all.) So the naive covariance is the special case of considering a parameter whose uncertainty is zero, not a different calculation.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| Consider parameter $\mathbf c$ | Left out of the state and never estimated, but its uncertainty is still counted |
| $\mathbf y=\mathbf H_x\mathbf x+\mathbf H_c\mathbf c+\mathbf v$ | True model; the estimator fixes $\mathbf c$ at $\bar{\mathbf c}$ |
| $\mathbf S=\boldsymbol\Lambda^{-1}\mathbf H_x^\mathsf T\mathbf W\mathbf H_c$ | Sensitivity of the estimate to the consider parameter |
| $\mathbf P_{xx}^{\text{consider}}=\boldsymbol\Lambda^{-1}+\mathbf S\mathbf P_{cc}\mathbf S^\mathsf T$ | Honest covariance; equals $\boldsymbol\Lambda^{-1}$ only when $\mathbf P_{cc}=\mathbf 0$ |
| Shared bias | Many readings with a common offset carry no more information about it than one; the uncertainty floors at $\sigma_c$ |
| Estimate unchanged | Considering never alters $\hat{\mathbf x}$, only the reported uncertainty |
| Small $\sigma_c$ is not a small correction | The correction depends on $\mathbf S$ as much as on $\mathbf P_{cc}$ |

Solve for it, absorb it with process noise, or consider it — the module has now built all three answers to an uncertain parameter. The next lesson turns to the data itself: what a fit does when some of its observations are simply wrong.

::: context area-to-mass The number drag really cares about
Drag's push grows with the area a satellite presents to the oncoming air and shrinks with its mass, because heavier objects are harder to slow down. So the orbit only feels the ratio of the two, in square meters per kilogram. Usually it is folded together with the drag coefficient into one **ballistic parameter**, $B = C_D A/m$. A crumpled sheet of foil has a huge area-to-mass ratio and falls out of orbit fast; a dense steel ball barely notices the air. For a tumbling piece of debris nobody knows its area well, which is why this parameter is so often considered rather than trusted.
:::

::: context gravity-coefficients The bumps in Earth's gravity
Earth is not a perfect ball. It bulges at the equator and has lumps of denser rock here and there. Models describe this with a long list of numbers, the gravity field coefficients, each describing one pattern of bumps — the equatorial bulge is the famous $J_2$. Modern models carry thousands of coefficients. A routine fit keeps only as many as it needs and drops the rest. Each is known only to some accuracy, so the truncated and imperfect ones are natural consider parameters.
:::

::: context bias Where a station bias comes from
A radar or antenna measures range by timing a signal's round trip. Anything that adds the same small delay to every measurement shows up as a range bias: the length of cable between the antenna and the electronics, a calibration done imperfectly, a timing offset in the station clock. These errors do not change from one measurement to the next within a pass. That is exactly what makes them dangerous: averaging a thousand measurements does nothing to them. Stations are calibrated regularly, but some bias always survives.
:::

::: context monte-carlo Checking a formula by brute force
A Monte Carlo run answers "how much does the answer scatter?" by trying it many times with fresh random errors and measuring the scatter directly. The name comes from the casino in Monaco. It was the code name chosen in the 1940s by Stanislaw Ulam, John von Neumann and Nicholas Metropolis for random-sampling calculations at Los Alamos. It is slow, but it assumes nothing, which makes it the referee for formulas like the consider covariance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="50" y2="165" stroke="#1f2a44"/>
  <text x="50" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <line x1="122" y1="160" x2="122" y2="165" stroke="#1f2a44"/>
  <text x="122" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">10</text>
  <line x1="195" y1="160" x2="195" y2="165" stroke="#1f2a44"/>
  <text x="195" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">100</text>
  <line x1="268" y1="160" x2="268" y2="165" stroke="#1f2a44"/>
  <text x="268" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">1000</text>
  <line x1="340" y1="160" x2="340" y2="165" stroke="#1f2a44"/>
  <text x="340" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">10000</text>
  <text x="195" y="194" font-size="11" text-anchor="middle" fill="#1f2a44">number of readings N</text>
  <text x="45" y="94" font-size="11" text-anchor="end" fill="#1f2a44">0.3 kg</text>
  <line x1="47" y1="90.0" x2="50" y2="90.0" stroke="#1f2a44"/>
  <text x="45" y="47" font-size="11" text-anchor="end" fill="#1f2a44">0.5 kg</text>
  <line x1="47" y1="43.3" x2="50" y2="43.3" stroke="#1f2a44"/>
  <text x="45" y="164" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <line x1="50" y1="90.0" x2="340" y2="90.0" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <polyline points="50.0,43.3 53.6,49.9 57.2,56.0 60.9,61.8 64.5,67.3 68.1,72.5 71.8,77.4 75.4,82.0 79.0,86.4 82.6,90.5 86.2,94.4 89.9,98.1 93.5,101.5 97.1,104.8 100.8,107.9 104.4,110.8 108.0,113.6 111.6,116.2 115.2,118.6 118.9,120.9 122.5,123.1 126.1,125.2 129.8,127.1 133.4,129.0 137.0,130.7 140.6,132.3 144.2,133.9 147.9,135.3 151.5,136.7 155.1,138.0 158.8,139.3 162.4,140.4 166.0,141.5 169.6,142.5 173.2,143.5 176.9,144.4 180.5,145.3 184.1,146.1 187.8,146.9 191.4,147.6 195.0,148.3 198.6,149.0 202.2,149.6 205.9,150.2 209.5,150.7 213.1,151.3 216.8,151.7 220.4,152.2 224.0,152.6 227.6,153.1 231.2,153.4 234.9,153.8 238.5,154.2 242.1,154.5 245.8,154.8 249.4,155.1 253.0,155.4 256.6,155.6 260.2,155.9 263.9,156.1 267.5,156.3 271.1,156.5 274.8,156.7 278.4,156.9 282.0,157.1 285.6,157.2 289.2,157.4 292.9,157.5 296.5,157.7 300.1,157.8 303.8,157.9 307.4,158.0 311.0,158.2 314.6,158.3 318.2,158.4 321.9,158.4 325.5,158.5 329.1,158.6 332.8,158.7 336.4,158.8 340.0,158.8" fill="none" stroke="#1d6fd1" stroke-width="2.2"/>
  <polyline points="50.0,23.9 53.6,29.5 57.2,34.7 60.9,39.4 64.5,43.9 68.1,48.0 71.8,51.7 75.4,55.2 79.0,58.4 82.6,61.4 86.2,64.1 89.9,66.5 93.5,68.8 97.1,70.9 100.8,72.7 104.4,74.4 108.0,76.0 111.6,77.4 115.2,78.7 118.9,79.8 122.5,80.9 126.1,81.8 129.8,82.7 133.4,83.4 137.0,84.1 140.6,84.7 144.2,85.3 147.9,85.8 151.5,86.2 155.1,86.6 158.8,87.0 162.4,87.3 166.0,87.6 169.6,87.9 173.2,88.1 176.9,88.3 180.5,88.5 184.1,88.6 187.8,88.8 191.4,88.9 195.0,89.0 198.6,89.1 202.2,89.2 205.9,89.3 209.5,89.4 213.1,89.5 216.8,89.5 220.4,89.6 224.0,89.6 227.6,89.7 231.2,89.7 234.9,89.7 238.5,89.8 242.1,89.8 245.8,89.8 249.4,89.8 253.0,89.8 256.6,89.9 260.2,89.9 263.9,89.9 267.5,89.9 271.1,89.9 274.8,89.9 278.4,89.9 282.0,89.9 285.6,89.9 289.2,90.0 292.9,90.0 296.5,90.0 300.1,90.0 303.8,90.0 307.4,90.0 311.0,90.0 314.6,90.0 318.2,90.0 321.9,90.0 325.5,90.0 329.1,90.0 332.8,90.0 336.4,90.0 340.0,90.0" fill="none" stroke="#b4232c" stroke-width="2.2"/>
  <text x="157" y="74" font-size="12" fill="#b4232c">consider: floor at 0.3 kg</text>
  <text x="157" y="130" font-size="12" fill="#1d6fd1">naive: 0.5/√N, toward 0</text>
</svg>
```

The scale example as $N$ grows: the naive uncertainty keeps shrinking, but the true one stops at the scale's own offset uncertainty.
:::

::: context psd Why the correction can never shrink the covariance
A covariance matrix is **positive semi-definite**: for any direction you pick, the variance along that direction is zero or positive, never negative. The term $\mathbf S\mathbf P_{cc}\mathbf S^\mathsf T$ has this property too, because it is itself the covariance of $\mathbf S(\mathbf c - \bar{\mathbf c})$. Adding it can only make the uncertainty grow or stay the same, in every direction. Considering a parameter can never make you more confident.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="60,165 192.6,165 192.6,44.1" fill="#8fb8f0" fill-opacity="0.25" stroke="none"/>
  <line x1="60" y1="165" x2="192.6" y2="165" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="192.6" y1="165" x2="192.6" y2="44.1" stroke="#f2b880" stroke-width="3"/>
  <line x1="60" y1="165" x2="192.6" y2="44.1" stroke="#b4232c" stroke-width="3"/>
  <polyline points="182.6,165 182.6,155 192.6,155" fill="none" stroke="#1f2a44" stroke-width="1"/>
  <text x="126" y="183" font-size="12" text-anchor="middle" fill="#1d6fd1">noise part 0.204 m</text>
  <text x="201" y="109" font-size="12" fill="#1f2a44">bias part 0.186 m</text>
  <text x="116" y="93" font-size="12" text-anchor="end" fill="#b4232c">total 0.276 m</text>
</svg>
```

For independent errors the standard deviations add like the sides of a right triangle. Here is the first position component of the station-bias example: $\sqrt{0.204^2 + 0.186^2} \approx 0.276\,\mathrm m$.
:::

::: context conjunction-bridge Where the honest covariance gets used
Lesson 11 of this module computes the probability that two objects in orbit collide. That probability comes straight from the combined covariance of the two orbits. If the covariance is too small, the calculation can badly misjudge the risk — and, surprisingly, the error can go either way, which that lesson explains. Operators decide whether to spend fuel dodging based on this number, so the consider term is not bookkeeping: it can be the difference between a maneuver and no maneuver.
:::
