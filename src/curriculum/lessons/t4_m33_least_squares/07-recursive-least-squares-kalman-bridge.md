---
id: l07-recursive-least-squares-kalman-bridge
title: Recursive least squares and the bridge to the Kalman filter
minutes: 15
covers:
  - Recursive least squares and the bridge to the Kalman filter
---

Every estimator in this module so far assumes all the data are in hand before you compute anything: stack $\mathbf{y}$, form $\mathbf{H}$, solve. Real onboard software rarely gets that luxury. A navigation filter receives one GNSS fix, then another, then a star-tracker attitude a few seconds later, and re-solving the entire batch from scratch each time a single new number arrives is not just wasteful — the batch grows without bound, and so would the time to process it. **Recursive least squares (RLS)** answers a sharper question: given an estimate already built from $k-1$ measurements, how do you fold in the $k$-th without looking at the first $k-1$ again? The answer turns out to be nothing new. It is maximum a posteriori estimation, applied to itself, and its final form is the equation at the heart of the Kalman filter, arrived at before any dynamics have entered the picture at all.

## Yesterday's posterior is today's prior

Suppose $\hat{\mathbf{x}}_{k-1}$ and $\mathbf{P}_{k-1}$ summarize everything the first $k-1$ measurements said, in the sense of lesson two: mean and covariance of a WLS (or MAP) estimate. A new scalar measurement arrives, $y_k = \mathbf{h}_k^\mathsf{T}\mathbf{x} + v_k$, $v_k$ independent of everything before it, $\operatorname{Var}(v_k)=\sigma_k^2$. Treat $\hat{\mathbf{x}}_{k-1}$ and $\mathbf{P}_{k-1}$ exactly as lesson five treated a prior — because that is exactly what they are, a belief about $\mathbf{x}$ formed before this particular measurement — and apply the MAP formula with one new "measurement" $y_k$:

$$
\mathbf{P}_k^{-1} = \mathbf{P}_{k-1}^{-1} + \frac{\mathbf{h}_k\mathbf{h}_k^\mathsf{T}}{\sigma_k^2}, \qquad
\hat{\mathbf{x}}_k = \mathbf{P}_k\left(\mathbf{P}_{k-1}^{-1}\hat{\mathbf{x}}_{k-1} + \frac{\mathbf{h}_k y_k}{\sigma_k^2}\right) .
$$

Information adds, exactly as it has every time this module has added a measurement to anything. This is RLS in **information form**, and it is already a complete recursive estimator: initialize $\mathbf{P}_0^{-1}=\mathbf{0}$ (no information, an uninformative start) or with real prior information if you have it, and fold in measurements one at a time.

## The Kalman gain form

Information form needs $\mathbf{P}_{k-1}^{-1}$ explicitly, which is exactly the matrix inversion lesson one warned against forming unnecessarily. A different, algebraically equivalent form works with $\mathbf{P}_{k-1}$ directly, using the **Sherman-Morrison identity** for a rank-one update of an inverse: for invertible $\mathbf{A}$, scalar $\sigma^2>0$, and vector $\mathbf{u}$,

$$
\left(\mathbf{A} + \frac{\mathbf{u}\mathbf{u}^\mathsf{T}}{\sigma^2}\right)^{-1} = \mathbf{A}^{-1} - \frac{\mathbf{A}^{-1}\mathbf{u}\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}}{\sigma^2+\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}\mathbf{u}} .
$$

Check it by multiplying the two sides together: writing $s=\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}\mathbf{u}$ and expanding $(\mathbf{A}+\mathbf{u}\mathbf{u}^\mathsf{T}/\sigma^2)$ times the right-hand side gives $\mathbf{I}$ plus three terms proportional to $\mathbf{u}\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}$, with coefficients $-1/(\sigma^2+s)$, $+1/\sigma^2$, and $-s/(\sigma^2(\sigma^2+s))$; put over the common denominator $\sigma^2(\sigma^2+s)$ and the numerators are $-\sigma^2$, $+(\sigma^2+s)$, and $-s$, which sum to zero. Apply the identity with $\mathbf{A}=\mathbf{P}_{k-1}^{-1}$ and $\mathbf{u}=\mathbf{h}_k$:

$$
\mathbf{P}_k = \mathbf{P}_{k-1} - \frac{\mathbf{P}_{k-1}\mathbf{h}_k\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}}{\sigma_k^2+\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k} .
$$

Define the **Kalman gain** $\mathbf{K}_k = \mathbf{P}_{k-1}\mathbf{h}_k / (\sigma_k^2 + \mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k)$, a column vector with one entry per state. Substituting back into the information-form update and simplifying (the algebra is mechanical: expand $\hat{\mathbf{x}}_k$, use the $\mathbf{P}_k$ just derived, and collect terms) gives

$$
\hat{\mathbf{x}}_k = \hat{\mathbf{x}}_{k-1} + \mathbf{K}_k\left(y_k - \mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1}\right), \qquad \mathbf{P}_k = (\mathbf{I}-\mathbf{K}_k\mathbf{h}_k^\mathsf{T})\mathbf{P}_{k-1} .
$$

The quantity $y_k-\mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1}$ is the **innovation**: what the new measurement says that the current estimate did not already predict. The new estimate is the old one plus the gain times the innovation — nothing is recomputed, nothing from before $k$ is revisited, and no matrix inverse larger than the scalar $\sigma_k^2+\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k$ needs to be formed for a scalar measurement.

::: key Recursive least squares, Kalman gain form
$\mathbf{K}_k = \mathbf{P}_{k-1}\mathbf{h}_k/(\sigma_k^2+\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k)$; $\hat{\mathbf{x}}_k = \hat{\mathbf{x}}_{k-1}+\mathbf{K}_k(y_k-\mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1})$; $\mathbf{P}_k=(\mathbf{I}-\mathbf{K}_k\mathbf{h}_k^\mathsf{T})\mathbf{P}_{k-1}$. Algebraically identical to the information-form update and to reprocessing the full batch; this is the gain form the Kalman filter uses for its measurement update.
:::

::: example Recursive matches batch, exactly
Six readings of a magnetometer bias, in consistent units, arrive over successive orbit passes with pass-dependent noise: $y=(1250.3,\ 1249.1,\ 1251.8,\ 1250.9,\ 1249.6,\ 1250.4)$, $\sigma=(0.8,\ 1.5,\ 0.5,\ 1.2,\ 2.0,\ 0.6)$.

```python
import numpy as np

y = np.array([1250.3, 1249.1, 1251.8, 1250.9, 1249.6, 1250.4])
sigma = np.array([0.8, 1.5, 0.5, 1.2, 2.0, 0.6])

x, P = 0.0, 1e12                       # uninformative start
for yi, si in zip(y, sigma):
    K = P / (P + si**2)
    x = x + K * (yi - x)
    P = (1 - K) * P
print(f"recursive: x_hat={x:.6f}  P={P:.6f}")

H = np.ones((6, 1))
Rinv = np.diag(1 / sigma**2)
P_batch = np.linalg.inv(H.T @ Rinv @ H)
x_batch = (P_batch @ H.T @ Rinv @ y)[0]
print(f"batch:     x_hat={x_batch:.6f}  P={P_batch[0,0]:.6f}")
# recursive: x_hat=1250.915275  P=0.102784
# batch:     x_hat=1250.915275  P=0.102784
```

Recursive and batch agree to every digit shown. Feeding the same six numbers through in a different order — pass 4, then 1, then 6, then 2, then 5, then 3 — gives $\hat x=1250.9152748$ against the original order's $1250.9152748$, matching to floating-point round-off: the final estimate does not care what order the measurements arrived in, only what they said, because information adds and addition commutes.
:::

## When the state does not hold still: the forgetting factor

The gain $\mathbf{K}_k$ shrinks as $\mathbf{P}_{k-1}$ shrinks — the more settled the estimate, the less any single new measurement moves it. For a genuinely constant $\mathbf{x}$ this is correct and is exactly what the Gauss-Markov theorem promises: more data, monotonically less uncertainty. It becomes a liability the moment $\mathbf{x}$ is not actually constant — a bias that drifts slowly with temperature, a scale factor that ages — because the filter grows more stubborn precisely as it becomes more important to stay responsive to new information.

A crude but common fix is a **forgetting factor** $\beta$, slightly less than $1$: before each update, inflate the covariance, $\mathbf{P}_{k-1}\leftarrow\mathbf{P}_{k-1}/\beta$, then proceed as before. This manufactures a small amount of fresh uncertainty every step, from nowhere in particular, which keeps the gain from decaying to zero.

::: example Tracking a drifting bias
A true bias drifts linearly, $x_{\mathrm{true}}=2.0+0.03k$ over $200$ steps, measured with $\sigma=0.5$ each step — the drift is real, but the estimator is only told the noise level, not that the state moves.

```python
import numpy as np

rng = np.random.default_rng(3)
N, sigma = 200, 0.5
x_true = 2.0 + 0.03 * np.arange(N)
meas = x_true + rng.normal(0, sigma, N)

def rls(meas, sigma, forget=1.0):
    x, P, xs = 0.0, 1e6, []
    for yv in meas:
        P /= forget
        K = P / (P + sigma**2)
        x = x + K * (yv - x)
        P = (1 - K) * P
        xs.append(x)
    return np.array(xs)

xs_plain = rls(meas, sigma, forget=1.0)
xs_forget = rls(meas, sigma, forget=0.95)
rmse_plain = np.sqrt(np.mean((xs_plain[50:] - x_true[50:])**2))
rmse_forget = np.sqrt(np.mean((xs_forget[50:] - x_true[50:])**2))
print(f"RMSE, steps 50-200: no forgetting = {rmse_plain:.3f}, forgetting (0.95) = {rmse_forget:.3f}")
# RMSE, steps 50-200: no forgetting = 1.980, forgetting (0.95) = 0.531
```

Without forgetting, the gain has decayed to about $0.005$ by step $200$ ($\mathbf{P}$ near $0.0013$), so the filter barely moves even though the true bias has walked more than five units away from where the gain last responded strongly; RMSE over the second half of the run is nearly $2.0$, four times the measurement noise itself. With $\beta=0.95$, the gain settles to a steady $0.05$ instead of decaying further, and RMSE drops to $0.53$, close to what a filter tracking a moving target through noisy measurements should achieve.
:::

::: warning A forgetting factor is a patch, not a model
Inflating $\mathbf{P}$ by a fixed factor every step adds uncertainty equally in every direction of the state, on a schedule with no connection to how the physical quantity actually moves — it is tuned by trial and error against $\beta$, a number with no direct physical meaning. It is a reasonable field expedient for a single slowly wandering scalar. It is not a substitute for a real model of how $\mathbf{x}$ evolves between measurements, which needs a state transition and an honestly derived process noise, not a knob.
:::

## The bridge to the Kalman filter

Nothing in this lesson let $\mathbf{x}$ move between measurements — $\hat{\mathbf{x}}_{k-1}$ carried forward unchanged into the next update, exactly as it stood. The Kalman filter module builds the general case by inserting a **predict** step between updates: propagate $\hat{\mathbf{x}}_{k-1}$ and $\mathbf{P}_{k-1}$ forward through a state transition, adding process noise to account for how much the state could have moved, before the next measurement's update step runs. Set that state transition to the identity and the process noise to zero — a state asserted not to move at all — and the predict step does nothing, leaving exactly the recursive update just derived. **RLS is the Kalman filter for a static state.** The forgetting factor is a rough, direction-blind sketch of what process noise does properly: both exist to stop the gain from decaying to zero when the thing being estimated will not hold still, and the Kalman filter module replaces the sketch with a model.

## Check yourself

::: check
Derive the information-form RLS update by applying the MAP formula of lesson five with $\hat{\mathbf{x}}_{k-1}, \mathbf{P}_{k-1}$ as the prior and $y_k$ as the sole new measurement.
:::

::: answer
Lesson five's MAP estimate is $\hat{\mathbf{x}}=(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y})$. Substitute $\mathbf{x}_0\to\hat{\mathbf{x}}_{k-1}$, $\mathbf{P}_0\to\mathbf{P}_{k-1}$, and a single scalar measurement $\mathbf{H}\to\mathbf{h}_k^\mathsf{T}$, $\mathbf{y}\to y_k$, $\mathbf{R}\to\sigma_k^2$: $\mathbf{P}_k^{-1}=\mathbf{P}_{k-1}^{-1}+\mathbf{h}_k\mathbf{h}_k^\mathsf{T}/\sigma_k^2$ and $\hat{\mathbf{x}}_k=\mathbf{P}_k(\mathbf{P}_{k-1}^{-1}\hat{\mathbf{x}}_{k-1}+\mathbf{h}_ky_k/\sigma_k^2)$, the RLS information-form update.
:::

::: check
What is the innovation, in words, and why is $\hat{\mathbf{x}}_k=\hat{\mathbf{x}}_{k-1}+\mathbf{K}_k\times(\text{innovation})$ a sensible way to write an update rule?
:::

::: answer
The innovation $y_k-\mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1}$ is the part of the new measurement the current estimate could not already have predicted — if it were zero, the new data would confirm the estimate exactly and no update should be needed. Writing the update as the old estimate plus a gain times the innovation makes that built in: no innovation, no change, and a large innovation moves the estimate in proportion to how much the gain says to trust this particular measurement.
:::

::: check
In the six-measurement magnetometer example, why does processing the same six numbers in a different order return the same final $\hat x$ and $P$ to numerical precision?
:::

::: answer
Both the batch and the recursive form compute the same information matrix and the same information-weighted sum, $\Lambda = \sum_i 1/\sigma_i^2$ and $\Lambda\hat x = \sum_i y_i/\sigma_i^2$, and both addition and the final division are independent of the order the terms are summed in, up to floating-point round-off. RLS updates one term at a time instead of all at once, but it is computing the same sums.
:::

::: check
A colleague proposes a forgetting factor of $\beta=0.5$ to "make the filter more responsive." What happens to the steady-state gain, and what is the downside?
:::

::: answer
A smaller $\beta$ inflates $\mathbf{P}$ more aggressively every step, so the steady-state gain is larger and the filter tracks changes faster — but the same inflation happens whether or not the true state actually moved, so the filter also responds more to ordinary measurement noise, with a nervous, higher-variance estimate even when $\mathbf{x}$ is genuinely constant. Forgetting trades bias-from-staleness for variance-from-noise, the same trade every estimator in this module has made in one form or another, and $\beta$ has no principled value without knowing how fast $\mathbf{x}$ actually drifts.
:::

::: check
State precisely what has to be true of a Kalman filter's state transition and process noise for its measurement updates to reduce exactly to the recursive least squares of this lesson.
:::

::: answer
The state transition must be the identity (the predict step carries $\hat{\mathbf{x}}_{k-1}$ forward unchanged) and the process noise must be zero (the predict step adds no uncertainty), so that the filter's prior for the $k$-th update is exactly $\hat{\mathbf{x}}_{k-1}, \mathbf{P}_{k-1}$ with nothing having changed since the last update — at which point the Kalman update step is, term for term, the RLS update derived here.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{P}_k^{-1}=\mathbf{P}_{k-1}^{-1}+\mathbf{h}_k\mathbf{h}_k^\mathsf{T}/\sigma_k^2$ | RLS, information form: MAP with the previous estimate as the prior |
| $\mathbf{K}_k=\mathbf{P}_{k-1}\mathbf{h}_k/(\sigma_k^2+\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k)$ | Kalman gain, via the Sherman-Morrison identity |
| $\hat{\mathbf{x}}_k=\hat{\mathbf{x}}_{k-1}+\mathbf{K}_k(y_k-\mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1})$ | Update: old estimate plus gain times innovation |
| $\mathbf{P}_k=(\mathbf{I}-\mathbf{K}_k\mathbf{h}_k^\mathsf{T})\mathbf{P}_{k-1}$ | Covariance update; algebraically identical to reprocessing the batch |
| Order-independence | Recursive and batch agree because information addition commutes |
| Forgetting factor $\beta<1$: $\mathbf{P}_{k-1}\to\mathbf{P}_{k-1}/\beta$ | Crude, direction-blind stand-in for process noise; keeps the gain from decaying to zero for a drifting state |
| $\mathbf{F}=\mathbf{I}$, $\mathbf{Q}=\mathbf{0}$ | The Kalman filter's predict step reduces to nothing; its update step reduces to RLS |

The next lesson turns to a different question about the same normal equations: not how to update them as data arrive, but how to read, from the condition number of the information matrix, exactly which directions in state space the data have barely constrained at all.
