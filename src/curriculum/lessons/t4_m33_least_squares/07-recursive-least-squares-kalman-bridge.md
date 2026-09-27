---
id: l07-recursive-least-squares-kalman-bridge
title: Recursive least squares and the bridge to the Kalman filter
minutes: 21
covers:
  - Recursive least squares and the bridge to the Kalman filter
---

Suppose your teacher posts quiz scores one at a time, and you want to know your average after every quiz. You could write down every score so far and add them all up again each time. Nobody does that. You keep two numbers — your average so far and how many quizzes you have taken — and when a new score arrives you nudge the average toward it. That trick, "update what you already have instead of starting over", is the whole idea of this lesson.

Every estimator in this module so far assumed all the data were in hand before you computed anything: stack the measurements into $\mathbf{y}$, build the design matrix $\mathbf{H}$, solve. Onboard software rarely gets that luxury. A navigation computer receives one GNSS fix, then another, then a star-tracker attitude a few seconds later. Re-solving the whole batch every time one new number arrives is wasteful, and worse, the batch grows without end, so the time to process it would grow without end too.

**Recursive least squares (RLS)** — least squares that updates its answer one measurement at a time — answers a sharper question. Given an estimate already built from $k-1$ measurements, how do you fold in the $k$-th without looking at the first $k-1$ again? The answer turns out to be nothing new. It is the maximum a posteriori estimate of lesson five, applied to itself. And its final form is the measurement update at the heart of the **[[Kalman filter|kalman-history]]**, reached before any motion of the vehicle has entered the picture at all.

## A running average, one reading at a time

Start with the simplest case: one unknown number $x$, measured over and over with the same noise. The batch answer is the plain average. After $k$ readings $y_1, \dots, y_k$ it is

$$
\hat{x}_k = \frac{y_1 + y_2 + \cdots + y_k}{k}.
$$

Read $\hat{x}_k$ as "x hat sub k": the hat means *estimate*, and the $k$ says how many readings went into it. Now split off the newest reading. The first $k-1$ readings add up to $(k-1)\hat{x}_{k-1}$, so

$$
\hat{x}_k = \frac{(k-1)\hat{x}_{k-1} + y_k}{k} = \hat{x}_{k-1} + \frac{1}{k}\left(y_k - \hat{x}_{k-1}\right).
$$

The second form came from writing $(k-1)\hat{x}_{k-1}/k$ as $\hat{x}_{k-1} - \hat{x}_{k-1}/k$ and collecting the two terms divided by $k$. Look at its shape. New guess equals old guess, plus a fraction of the **surprise** — how far the new reading landed from what you expected. The fraction, $1/k$, is called the **gain**. After one reading the gain is $1$ (believe it completely). After a hundred it is $0.01$ (one more reading barely matters). The gain shrinks because your confidence grows. Every formula below is this running average, grown up to handle vectors, unequal noise and a prior.

## Yesterday's answer is today's prior

Now the general case. The unknown is a vector $\mathbf{x}$ with $n$ entries. Suppose $\hat{\mathbf{x}}_{k-1}$ and $\mathbf{P}_{k-1}$ sum up everything the first $k-1$ measurements said: the estimate and its covariance, exactly as in lesson two for a weighted least squares (or MAP) fit. Recall that $\mathbf{P}$, the **covariance**, says how uncertain the estimate is and in which directions.

A new scalar measurement arrives:

$$
y_k = \mathbf{h}_k^\mathsf{T}\mathbf{x} + v_k .
$$

Here $\mathbf{h}_k^\mathsf{T}$ (read "h sub k transpose") is one row of a design matrix: it says how the unknowns combine into this one reading. The noise $v_k$ has zero mean and variance $\sigma_k^2$, and it is **independent** of everything before it — knowing the earlier noise tells you nothing about this one.

Here is the key move. The pair $\hat{\mathbf{x}}_{k-1}, \mathbf{P}_{k-1}$ is a belief about $\mathbf{x}$ formed *before* this measurement. That is exactly what lesson five called a [[prior|prior-posterior]]. So apply the MAP formula with that prior and one new "batch" consisting of the single number $y_k$:

$$
\mathbf{P}_k^{-1} = \mathbf{P}_{k-1}^{-1} + \frac{\mathbf{h}_k\mathbf{h}_k^\mathsf{T}}{\sigma_k^2}, \qquad
\hat{\mathbf{x}}_k = \mathbf{P}_k\left(\mathbf{P}_{k-1}^{-1}\hat{\mathbf{x}}_{k-1} + \frac{\mathbf{h}_k y_k}{\sigma_k^2}\right) .
$$

The first equation says **information adds**, as it has every time this module added a measurement to anything. ($\mathbf{P}^{-1}$ is the information matrix of lesson two.) The second says the new estimate is an information-weighted blend of the old estimate and the new reading. This is RLS in **information form**, and it is already a complete recursive estimator. Start with $\mathbf{P}_0^{-1} = \mathbf{0}$ — no information at all, an uninformative start — or with real prior information if you have it. Then fold in measurements one at a time. Yesterday's answer (the **posterior**, the belief after the data) becomes today's prior.

::: note Why the scalar version is the running average
Take one unknown, $h_k = 1$ and equal noise $\sigma$. The information form says $1/P_k = 1/P_{k-1} + 1/\sigma^2$. Starting from zero information, after $k$ readings $1/P_k = k/\sigma^2$, so $P_k = \sigma^2/k$ — the familiar "variance of an average". The estimate equation becomes $\hat{x}_k = \frac{\sigma^2}{k}\left(\frac{k-1}{\sigma^2}\hat{x}_{k-1} + \frac{y_k}{\sigma^2}\right) = \frac{(k-1)\hat{x}_{k-1} + y_k}{k}$, which is the running average of the first section.
:::

## The Kalman gain form

Information form needs $\mathbf{P}_{k-1}^{-1}$, an explicit matrix inverse — exactly what lesson one warned against forming when you do not have to. A different form, algebraically identical, works with $\mathbf{P}_{k-1}$ directly. It rests on the **[[Sherman-Morrison identity|sherman-morrison]]**, a shortcut for the inverse of a matrix after a **rank-one update** (adding one outer product $\mathbf{u}\mathbf{u}^\mathsf{T}$). For an invertible matrix $\mathbf{A}$, a number $\sigma^2 > 0$ and a vector $\mathbf{u}$:

$$
\left(\mathbf{A} + \frac{\mathbf{u}\mathbf{u}^\mathsf{T}}{\sigma^2}\right)^{-1} = \mathbf{A}^{-1} - \frac{\mathbf{A}^{-1}\mathbf{u}\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}}{\sigma^2+\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}\mathbf{u}} .
$$

In words: you already know $\mathbf{A}^{-1}$, and adding one outer product changes the inverse by one outer product too. No new inversion is needed except a division by a single number.

::: note Why it has to be true
Multiply the left-hand matrix $(\mathbf{A} + \mathbf{u}\mathbf{u}^\mathsf{T}/\sigma^2)$ by the right-hand side and check that you get $\mathbf{I}$. Write $s = \mathbf{u}^\mathsf{T}\mathbf{A}^{-1}\mathbf{u}$, a single number. Expanding gives four terms:

$$
\mathbf{I} \;-\; \frac{\mathbf{u}\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}}{\sigma^2+s} \;+\; \frac{\mathbf{u}\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}}{\sigma^2} \;-\; \frac{\mathbf{u}\,(\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}\mathbf{u})\,\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}}{\sigma^2(\sigma^2+s)} .
$$

In the last term the middle bracket is the number $s$, so all three extra terms are multiples of the same matrix $\mathbf{u}\mathbf{u}^\mathsf{T}\mathbf{A}^{-1}$. Their coefficients are $-1/(\sigma^2+s)$, $+1/\sigma^2$ and $-s/(\sigma^2(\sigma^2+s))$. Put them over the common denominator $\sigma^2(\sigma^2+s)$: the numerators are $-\sigma^2$, $+(\sigma^2+s)$ and $-s$, which add to zero. Only $\mathbf{I}$ is left.
:::

Apply the identity with $\mathbf{A} = \mathbf{P}_{k-1}^{-1}$ and $\mathbf{u} = \mathbf{h}_k$. Since $\mathbf{A}^{-1} = \mathbf{P}_{k-1}$:

$$
\mathbf{P}_k = \mathbf{P}_{k-1} - \frac{\mathbf{P}_{k-1}\mathbf{h}_k\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}}{\sigma_k^2+\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k} .
$$

The number in the denominator deserves a name. Call it $S_k = \sigma_k^2 + \mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k$. It is the variance of the reading you expect: the sensor's own noise plus the spread that your uncertain estimate would put into the prediction. Now define the **Kalman gain**

$$
\mathbf{K}_k = \frac{\mathbf{P}_{k-1}\mathbf{h}_k}{\sigma_k^2 + \mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k} = \frac{\mathbf{P}_{k-1}\mathbf{h}_k}{S_k},
$$

a column vector with one entry per unknown. It says how much each unknown should move per unit of surprise. With it the covariance update reads $\mathbf{P}_k = \mathbf{P}_{k-1} - \mathbf{K}_k\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1} = (\mathbf{I}-\mathbf{K}_k\mathbf{h}_k^\mathsf{T})\mathbf{P}_{k-1}$. Substituting into the information-form estimate and simplifying (the note below shows every line) gives

$$
\hat{\mathbf{x}}_k = \hat{\mathbf{x}}_{k-1} + \mathbf{K}_k\left(y_k - \mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1}\right), \qquad \mathbf{P}_k = (\mathbf{I}-\mathbf{K}_k\mathbf{h}_k^\mathsf{T})\mathbf{P}_{k-1} .
$$

The quantity $y_k-\mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1}$ is the **[[innovation|innovation-word]]**: the part of the new measurement that the current estimate did not already predict. It is the "surprise" of the running average, in its grown-up form. The new estimate is the old one plus the gain times the innovation. Nothing is recomputed. Nothing from before $k$ is revisited. For a scalar measurement, no inverse is formed at all except dividing by the single number $S_k$.

::: note Why the estimate update has to be true
Start from the information form, $\hat{\mathbf{x}}_k = \mathbf{P}_k\mathbf{P}_{k-1}^{-1}\hat{\mathbf{x}}_{k-1} + \mathbf{P}_k\mathbf{h}_k y_k/\sigma_k^2$, and handle the two pieces one at a time.

First piece. Multiply $\mathbf{P}_k = (\mathbf{I}-\mathbf{K}_k\mathbf{h}_k^\mathsf{T})\mathbf{P}_{k-1}$ on the right by $\mathbf{P}_{k-1}^{-1}$: $\mathbf{P}_k\mathbf{P}_{k-1}^{-1} = \mathbf{I}-\mathbf{K}_k\mathbf{h}_k^\mathsf{T}$.

Second piece. $\mathbf{P}_k\mathbf{h}_k = \mathbf{P}_{k-1}\mathbf{h}_k - \mathbf{K}_k(\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k)$. By the definition of the gain, $\mathbf{P}_{k-1}\mathbf{h}_k = \mathbf{K}_k S_k$, so this is $\mathbf{K}_k(S_k - \mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k) = \mathbf{K}_k\sigma_k^2$. Dividing by $\sigma_k^2$: $\mathbf{P}_k\mathbf{h}_k/\sigma_k^2 = \mathbf{K}_k$.

Put them together: $\hat{\mathbf{x}}_k = (\mathbf{I}-\mathbf{K}_k\mathbf{h}_k^\mathsf{T})\hat{\mathbf{x}}_{k-1} + \mathbf{K}_k y_k = \hat{\mathbf{x}}_{k-1} + \mathbf{K}_k(y_k - \mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1})$.
:::

::: key Recursive least squares, Kalman gain form
$\mathbf{K}_k = \mathbf{P}_{k-1}\mathbf{h}_k/(\sigma_k^2+\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k)$; $\hat{\mathbf{x}}_k = \hat{\mathbf{x}}_{k-1}+\mathbf{K}_k(y_k-\mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1})$; $\mathbf{P}_k=(\mathbf{I}-\mathbf{K}_k\mathbf{h}_k^\mathsf{T})\mathbf{P}_{k-1}$. Algebraically identical to the information-form update and to reprocessing the full batch; this is the gain form the Kalman filter uses for its measurement update.
:::

For one unknown with $h_k = 1$ everything becomes ordinary numbers: $K_k = P_{k-1}/(P_{k-1} + \sigma_k^2)$, a fraction between $0$ and $1$. If your current estimate is much less certain than the sensor ($P_{k-1} \gg \sigma_k^2$), the gain is near $1$ and you mostly believe the reading. If your estimate is much more certain, the gain is near $0$ and the reading barely moves you. The gain is a trust ratio.

::: example Two magnetometer readings, by hand
A **magnetometer** measures the magnetic field; here it is being used to pin down one constant bias, in consistent units. The first reading is $y_1 = 1250.3$ with $\sigma_1 = 0.8$. The second is $y_2 = 1249.1$ with $\sigma_2 = 1.5$, a noisier pass.

**Reading 1.** With no prior information, $P_0$ is effectively infinite, so $K_1 = 1$: believe the reading. That gives $\hat{x}_1 = 1250.3$ and $P_1 = \sigma_1^2 = 0.64$.

**Reading 2.** The predicted variance of the reading is $S_2 = P_1 + \sigma_2^2 = 0.64 + 2.25 = 2.89$. The gain is $K_2 = 0.64/2.89 = 0.2215$. The innovation is $1249.1 - 1250.3 = -1.2$. So

$$
\hat{x}_2 = 1250.3 + 0.2215 \times (-1.2) = 1250.3 - 0.2657 = 1250.034 .
$$

The new variance is $P_2 = (1 - 0.2215) \times 0.64 = 0.498$.

**Sanity check.** The batch weighted average uses weights $1/0.64 = 1.5625$ and $1/2.25 = 0.4444$: $(1.5625 \times 1250.3 + 0.4444 \times 1249.1)/2.0069 = 1250.034$, with variance $1/2.0069 = 0.498$. Same numbers. The estimate moved only about a fifth of the way toward the second reading, because that reading was the noisier one.
:::

::: example Recursive matches batch, exactly
Six readings of the same bias arrive over successive orbit passes, with noise that differs from pass to pass: $y = (1250.3,\ 1249.1,\ 1251.8,\ 1250.9,\ 1249.6,\ 1250.4)$ and $\sigma = (0.8,\ 1.5,\ 0.5,\ 1.2,\ 2.0,\ 0.6)$.

```python
import numpy as np

y = np.array([1250.3, 1249.1, 1251.8, 1250.9, 1249.6, 1250.4])
sigma = np.array([0.8, 1.5, 0.5, 1.2, 2.0, 0.6])

def rls(order):
    x, P = 0.0, 1e12                   # "I know nothing" start
    for i in order:
        S = P + sigma[i]**2            # predicted variance of the reading
        K = P / S                      # gain
        x = x + K * (y[i] - x)         # old guess + gain * surprise
        P = P * sigma[i]**2 / S        # same as (1 - K) * P, without round-off
    return x, P

x, P = rls([0, 1, 2, 3, 4, 5])
print(f"recursive:      x_hat={x:.6f}  P={P:.6f}")
x2, P2 = rls([3, 0, 5, 1, 4, 2])
print(f"shuffled order: x_hat={x2:.6f}  P={P2:.6f}")

w = 1 / sigma**2                       # batch: information adds
print(f"batch:          x_hat={np.sum(w * y) / np.sum(w):.6f}  P={1 / np.sum(w):.6f}")
# recursive:      x_hat=1250.915275  P=0.102784
# shuffled order: x_hat=1250.915275  P=0.102784
# batch:          x_hat=1250.915275  P=0.102784
```

Recursive and batch agree to every digit shown: $\hat{x} = 1250.915$ with $P = 0.1028$, a standard deviation of $0.321$. Feeding the same six numbers in a different order — pass 4, then 1, then 6, then 2, then 5, then 3 — gives the same answer. The final estimate does not care what order the measurements arrived in, only what they said. That is because information adds, and addition does not care about order.

**Sanity check.** The total information is $\sum 1/\sigma_i^2 = 9.73$, so $P = 1/9.73 = 0.103$. The answer, $1250.9$, sits nearest the two most precise readings ($1251.8$ with $\sigma = 0.5$ and $1250.4$ with $\sigma = 0.6$), as a weighted average should.
:::

::: warning Subtracting two nearly equal numbers
The textbook covariance update $P_k = (1 - K_k)P_{k-1}$ has a trap when you start with a huge $P_0$. With $P_0 = 10^{12}$ the first gain is $K_1 = 0.99999999999936$, and $1 - K_1$ is computed from two numbers that agree in their first twelve digits. Only about four [[correct digits survive|round-off]]. Run the six readings above that way and the recursive answer comes out $1250.915282$ instead of $1250.915275$. Write the update as $P_{k-1}\sigma_k^2/S_k$ (the same number, rearranged), or start from a sensible finite $P_0$. The Kalman filter module meets the matrix version of this problem and fixes it with the Joseph form.
:::

## When the state does not hold still: the forgetting factor

The gain $\mathbf{K}_k$ shrinks as $\mathbf{P}_{k-1}$ shrinks. The more settled the estimate, the less any single new measurement moves it — the $1/k$ of the running average. For a truly constant $\mathbf{x}$ this is correct. It is what the Gauss-Markov theorem of lesson three promises: more data, steadily less uncertainty.

It becomes a liability the moment $\mathbf{x}$ is not actually constant. Think of a bias that drifts slowly with temperature, or a scale factor that ages. The filter grows more stubborn at exactly the time it most needs to stay responsive.

A crude but common fix is a **[[forgetting factor|forgetting-weights]]** $\beta$ (the Greek letter "beta"), a number slightly less than $1$. Before each update, inflate the covariance:

$$
\mathbf{P}_{k-1} \leftarrow \mathbf{P}_{k-1}/\beta ,
$$

then carry on as before. (The arrow means "replace with".) This manufactures a little fresh uncertainty every step, from nowhere in particular, which keeps the gain from decaying to zero. For one unknown measured directly, the gain settles at a steady value of exactly $1 - \beta$: with $\beta = 0.95$, each new reading moves the estimate $5\%$ of the way toward itself, forever.

::: note Why the steady gain is 1 − β
At steady state the covariance after an update equals the one before, $P$. One step inflates it to $P/\beta$, then updates it to $\frac{(P/\beta)\sigma^2}{P/\beta + \sigma^2}$. Setting that equal to $P$ and dividing both sides by $P$ gives $\frac{\sigma^2}{P + \beta\sigma^2} = 1$, so $P = \sigma^2(1 - \beta)$. The gain is then $K = \frac{P/\beta}{P/\beta + \sigma^2} = \frac{(1-\beta)/\beta}{(1-\beta)/\beta + 1} = 1 - \beta$.
:::

::: example Tracking a drifting bias
A true bias drifts steadily, $x_{\mathrm{true}} = 2.0 + 0.03k$, over $200$ steps. It is measured with $\sigma = 0.5$ at each step. The drift is real, but the estimator is only told the noise level, not that the state moves.

```python
import numpy as np

rng = np.random.default_rng(3)
N, sigma = 200, 0.5
x_true = 2.0 + 0.03 * np.arange(N)
meas = x_true + rng.normal(0, sigma, N)

def rls(meas, sigma, beta=1.0):
    x, P, xs = 0.0, 1e6, []
    for yv in meas:
        P = P / beta                   # forgetting: inflate before updating
        S = P + sigma**2
        K = P / S
        x = x + K * (yv - x)
        P = P * sigma**2 / S
        xs.append(x)
    return np.array(xs), K

for beta in (1.0, 0.95):
    xs, K = rls(meas, sigma, beta)
    rmse = np.sqrt(np.mean((xs[50:] - x_true[50:])**2))
    print(f"beta={beta}: final gain={K:.4f}, RMSE steps 50-199={rmse:.3f}")
# beta=1.0: final gain=0.0050, RMSE steps 50-199=1.980
# beta=0.95: final gain=0.0500, RMSE steps 50-199=0.531
```

**RMSE** is the root-mean-square error: square each error, average, take the square root. It is a typical size of the error.

Without forgetting, the gain has decayed to $0.005 = 1/200$ by the last step, and $P$ to about $0.0013$. The filter barely moves, even though the true bias keeps climbing. By step $200$ the estimate reads $5.01$ while the truth is $7.97$, a lag of about $3$. Over steps $50$ to $199$ the RMSE is nearly $2.0$ — four times the measurement noise itself.

With $\beta = 0.95$ the gain settles at a steady $0.05$, matching $1 - \beta$, and the RMSE drops to $0.53$. That is about the size of the noise on a single reading, a reasonable result for a filter chasing a moving target through noisy measurements.
:::

::: warning A forgetting factor is a patch, not a model
Inflating $\mathbf{P}$ by a fixed factor every step adds uncertainty equally in every direction of the state, on a schedule with no connection to how the physical quantity actually moves. It is tuned by trial and error, and $\beta$ is a number with no direct physical meaning. It is a reasonable field fix for a single slowly wandering scalar. It is not a substitute for a real model of how $\mathbf{x}$ changes between measurements. That needs a state transition and an honestly derived process noise, not a knob.
:::

## The bridge to the Kalman filter

Nothing in this lesson let $\mathbf{x}$ move between measurements. Each $\hat{\mathbf{x}}_{k-1}$ carried forward, unchanged, into the next update.

The Kalman filter module builds the general case by inserting a **predict** step between updates. It pushes $\hat{\mathbf{x}}_{k-1}$ and $\mathbf{P}_{k-1}$ forward through a **state transition** matrix $\mathbf{F}$ (how the state evolves in one time step), and adds **process noise** $\mathbf{Q}$ (how much the state could have wandered that the model does not capture). Then the next measurement's update step runs — the update you now know.

Set the state transition to the identity, $\mathbf{F} = \mathbf{I}$, and the process noise to zero, $\mathbf{Q} = \mathbf{0}$. That asserts the state does not move at all. The predict step then does nothing, and what remains is exactly the recursive update derived here. **RLS is the Kalman filter for a static state.**

The forgetting factor is a rough, direction-blind sketch of what [[process noise|process-noise]] does properly. Both exist to stop the gain from decaying to zero when the thing being estimated will not hold still. The Kalman filter module replaces the sketch with a model.

## Check yourself

::: check
Derive the information-form RLS update by applying the MAP formula of lesson five with $\hat{\mathbf{x}}_{k-1}, \mathbf{P}_{k-1}$ as the prior and $y_k$ as the only new measurement.
:::

::: answer
Lesson five's MAP estimate is $\hat{\mathbf{x}}=(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y})$. Replace the prior mean $\mathbf{x}_0$ by $\hat{\mathbf{x}}_{k-1}$ and the prior covariance $\mathbf{P}_0$ by $\mathbf{P}_{k-1}$. For a single scalar measurement, $\mathbf{H}$ becomes the row $\mathbf{h}_k^\mathsf{T}$, $\mathbf{y}$ becomes $y_k$ and $\mathbf{R}$ becomes $\sigma_k^2$. Then $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H} = \mathbf{h}_k\mathbf{h}_k^\mathsf{T}/\sigma_k^2$ and $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y} = \mathbf{h}_k y_k/\sigma_k^2$. The bracket being inverted is the new information, so $\mathbf{P}_k^{-1}=\mathbf{P}_{k-1}^{-1}+\mathbf{h}_k\mathbf{h}_k^\mathsf{T}/\sigma_k^2$, and $\hat{\mathbf{x}}_k=\mathbf{P}_k(\mathbf{P}_{k-1}^{-1}\hat{\mathbf{x}}_{k-1}+\mathbf{h}_ky_k/\sigma_k^2)$. That is the RLS information-form update.
:::

::: check
What is the innovation, in words? Why is $\hat{\mathbf{x}}_k=\hat{\mathbf{x}}_{k-1}+\mathbf{K}_k\times(\text{innovation})$ a sensible way to write an update rule?
:::

::: answer
The innovation $y_k-\mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1}$ is the part of the new measurement the current estimate could not already have predicted. If it were zero, the new data would confirm the estimate exactly, and no update should be needed. Writing the update as old estimate plus gain times innovation builds that in: no innovation, no change. A large innovation moves the estimate in proportion to how much the gain says to trust this particular measurement.
:::

::: check
In the six-reading magnetometer example, why does processing the same six numbers in a different order return the same final $\hat x$ and $P$, up to round-off?
:::

::: answer
Both the batch and the recursive form compute the same total information and the same information-weighted sum: $\Lambda = \sum_i 1/\sigma_i^2 = 9.73$ and $\Lambda\hat x = \sum_i y_i/\sigma_i^2$. Adding numbers gives the same total in any order, and so does the final division, apart from floating-point round-off. RLS adds one term at a time instead of all at once, but it is computing the same sums.
:::

::: check
A colleague proposes a forgetting factor of $\beta=0.5$ to "make the filter more responsive." What happens to the steady-state gain, and what is the downside?
:::

::: answer
A smaller $\beta$ inflates $\mathbf{P}$ harder every step, so the steady-state gain is larger — for one directly measured scalar it is $1 - \beta = 0.5$, so every reading moves the estimate halfway toward itself. The filter tracks changes faster. On the drifting bias of the example, $\beta = 0.5$ cuts the RMSE over steps $50$ to $199$ to about $0.29$. But the same inflation happens whether or not the true state moved. On a bias that really is constant, with the same noise, $\beta = 0.5$ gives an RMSE of about $0.29$ where no forgetting gives about $0.02$: a nervous, noisy estimate. Forgetting trades error-from-staleness (bias) for error-from-noise (variance), the same trade every estimator in this module has made in some form. Without knowing how fast $\mathbf{x}$ really drifts, $\beta$ has no principled value.
:::

::: check
State precisely what has to be true of a Kalman filter's state transition and process noise for its measurement updates to reduce exactly to the recursive least squares of this lesson.
:::

::: answer
The state transition must be the identity, $\mathbf{F} = \mathbf{I}$, so the predict step carries $\hat{\mathbf{x}}_{k-1}$ forward unchanged. The process noise must be zero, $\mathbf{Q} = \mathbf{0}$, so the predict step adds no uncertainty. Then the filter's prior for the $k$-th update is exactly $\hat{\mathbf{x}}_{k-1}, \mathbf{P}_{k-1}$, with nothing changed since the last update, and the Kalman update step is, term for term, the RLS update derived here.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat{x}_k = \hat{x}_{k-1} + \frac{1}{k}(y_k - \hat{x}_{k-1})$ | Running average: the simplest recursive estimator, gain $1/k$ |
| $\mathbf{P}_k^{-1}=\mathbf{P}_{k-1}^{-1}+\mathbf{h}_k\mathbf{h}_k^\mathsf{T}/\sigma_k^2$ | RLS, information form: MAP with the previous estimate as the prior |
| $\mathbf{K}_k=\mathbf{P}_{k-1}\mathbf{h}_k/(\sigma_k^2+\mathbf{h}_k^\mathsf{T}\mathbf{P}_{k-1}\mathbf{h}_k)$ | Kalman gain, via the Sherman-Morrison identity |
| $\hat{\mathbf{x}}_k=\hat{\mathbf{x}}_{k-1}+\mathbf{K}_k(y_k-\mathbf{h}_k^\mathsf{T}\hat{\mathbf{x}}_{k-1})$ | Update: old estimate plus gain times innovation |
| $\mathbf{P}_k=(\mathbf{I}-\mathbf{K}_k\mathbf{h}_k^\mathsf{T})\mathbf{P}_{k-1}$ | Covariance update; algebraically identical to reprocessing the batch |
| Order-independence | Recursive and batch agree because information adds, and addition ignores order |
| Forgetting factor $\beta<1$: $\mathbf{P}_{k-1}\to\mathbf{P}_{k-1}/\beta$ | Crude, direction-blind stand-in for process noise; steady scalar gain $1-\beta$ |
| $\mathbf{F}=\mathbf{I}$, $\mathbf{Q}=\mathbf{0}$ | The Kalman filter's predict step does nothing; its update step is RLS |

The next lesson asks a different question about the same equations. Not how to update them as data arrive, but how to read, from the condition number of the information matrix, which directions in the state the data have barely pinned down at all.

::: context kalman-history Who Kalman was, and where his filter first flew
Rudolf Kálmán, a Hungarian-born American engineer, published the filter in 1960 in a paper titled "A New Approach to Linear Filtering and Prediction Problems". Almost at once, Stanley Schmidt's group at NASA Ames saw that it could navigate a spacecraft to the Moon, and a version of it ran in the Apollo navigation software. Today some form of it runs in nearly every GPS receiver, phone, drone and launch vehicle. This lesson reaches half of it — the update step — without any dynamics at all.
:::

::: context prior-posterior Before and after
"Prior" is Latin for "earlier", and "posterior" for "later". The prior is what you believe about $\mathbf{x}$ before a measurement; the posterior is what you believe after it. Recursive estimation is a chain in which each posterior is handed on as the next prior:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="40" width="70" height="34" rx="6"/>
    <rect x="145" y="40" width="70" height="34" rx="6"/>
    <rect x="280" y="40" width="70" height="34" rx="6"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="62">x̂₁, P₁</text>
    <text x="180" y="62">x̂₂, P₂</text>
    <text x="315" y="62">x̂₃, P₃</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="80" y1="57" x2="138" y2="57"/>
    <line x1="215" y1="57" x2="273" y2="57"/>
  </g>
  <polygon points="145,57 136,52 136,62" fill="#1d6fd1"/>
  <polygon points="280,57 271,52 271,62" fill="#1d6fd1"/>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="112" y1="16" x2="112" y2="50"/>
    <line x1="247" y1="16" x2="247" y2="50"/>
  </g>
  <g font-size="12" fill="#b4232c" text-anchor="middle">
    <text x="112" y="12">y₂</text>
    <text x="247" y="12">y₃</text>
  </g>
  <text x="180" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">each posterior becomes the next prior</text>
</svg>
```
:::

::: context sherman-morrison A shortcut from 1950
Jack Sherman and Winifred Morrison published this formula around 1950; Max Woodbury gave the version for adding a whole block of rows at once, now called the Woodbury identity. Its value is speed. Inverting an $n \times n$ matrix from scratch takes on the order of $n^3$ operations. Updating an inverse you already have after adding one outer product takes on the order of $n^2$. For a 15-state navigation filter that is roughly fifteen times less work per measurement, and the saving grows with $n$.
:::

::: context innovation-word Why "innovation"
The word means "something new". The innovation is the one part of a measurement that is news: the part your current estimate could not have predicted. When a filter's model and noise levels are right, its innovations look like pure random noise — zero on average and unrelated from one step to the next. The Kalman filter module turns that into a test: if the innovations show a pattern, something in the model is wrong.
:::

::: context round-off How digits disappear when you subtract
A computer's double-precision number keeps about 16 significant digits. Subtract two numbers that agree in their first 12 digits and the answer has only about 4 trustworthy digits left: the matching digits cancel, and what remains is mostly the rounding left over in the last places. With $P_0 = 10^{12}$ and $\sigma_1^2 = 0.64$, the gain $K_1$ differs from $1$ only in its thirteenth digit, so $1 - K_1$ is computed to about four digits — and that error is carried into every later step. Engineers call this **catastrophic cancellation**.
:::

::: context forgetting-weights What forgetting does to old readings
Plain recursive least squares weights every past reading equally. With a forgetting factor $\beta$, a reading from $j$ steps ago counts only $\beta^j$ as much as the newest one, so old readings fade away smoothly. With $\beta = 0.95$ a reading $20$ steps old counts $0.95^{20} = 0.36$ as much; the filter's "memory" is roughly $1/(1-\beta) = 20$ steps. The bars below show the weights for the last ten readings.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="310" y="20" width="22" height="100"/>
    <rect x="280" y="25" width="22" height="95"/>
    <rect x="250" y="29.75" width="22" height="90.25"/>
    <rect x="220" y="34.26" width="22" height="85.74"/>
    <rect x="190" y="38.55" width="22" height="81.45"/>
    <rect x="160" y="42.62" width="22" height="77.38"/>
    <rect x="130" y="46.49" width="22" height="73.51"/>
    <rect x="100" y="50.17" width="22" height="69.83"/>
    <rect x="70" y="53.66" width="22" height="66.34"/>
    <rect x="40" y="56.98" width="22" height="63.02"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="321" y="136">newest</text>
    <text x="51" y="136">9 steps ago</text>
    <text x="321" y="14">1.00</text>
    <text x="51" y="50">0.63</text>
  </g>
  <text x="185" y="148" font-size="11" fill="#6c7a93" text-anchor="middle">weight of each reading, β = 0.95</text>
</svg>
```
:::

::: context process-noise What process noise really is
Process noise, written $\mathbf{Q}$, is an honest statement of how much the state can change between measurements in ways the model does not predict: a gyro bias wandering with temperature, a small unmodeled thrust, the push of sunlight on solar panels. Unlike a forgetting factor, it can be different for each state and can be worked out from physics or sensor data sheets. A gyro's data sheet, for example, gives a "bias instability" figure that feeds straight into $\mathbf{Q}$. You will derive and tune it in the Kalman filter module.
:::
