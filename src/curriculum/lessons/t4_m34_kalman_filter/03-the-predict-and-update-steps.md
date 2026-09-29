---
id: l03-the-predict-and-update-steps
title: The predict and update steps
minutes: 18
covers:
  - The predict and update steps
---

Go back to the dark room from the first lesson. You take a step, and your guess of where you are moves with you, but it gets a little fuzzier, because the step was not quite the length you thought. Then your friend calls out, and your guess snaps toward her call and gets sharper. Step, call. Step, call. Fuzzier, sharper. Fuzzier, sharper. If you drew your uncertainty over time, it would look like the teeth of a saw.

That two-beat rhythm is the whole Kalman filter. The last lesson solved one beat: fuse a single prior with a single reading. But a flight computer does not have one prior and one reading. It has a clock. Every tick, the vehicle moves, so the belief you ended the last tick with is no longer a belief about *now*. Before a new reading can correct anything, the old estimate has to be carried forward through the dynamics to the moment the new reading was taken. That carrying forward is the **predict** step. The correction is the **update** step.

Put the two side by side and you have two half-pages of algebra, run thousands of times a second on a descending booster, a cruise missile, or a spacecraft between star-tracker fixes. Everything from here to the end of the module is commentary on this one cycle: what the gain means, where it settles, how to keep the arithmetic safe, how filters fail, and how to prove they work. This lesson writes the cycle down with time labels, derives the predict step from the stochastic model, and runs it for real on the descending booster from the first lesson.

## Indexing the recursion

Attach every quantity to the step $k$ at which reading $\mathbf{z}_k$ arrives. Two versions of the estimate live at each step:

- $\hat{\mathbf{x}}_k^-$ and $\mathbf{P}_k^-$ ("x hat k minus", "P k minus") are the values **before** $\mathbf{z}_k$ is used. They are the **[[a priori|latin-labels]]** values, made by carrying the last step's result forward.
- $\hat{\mathbf{x}}_k^+$ and $\mathbf{P}_k^+$ are the values **after**, the **a posteriori** result the last lesson computed.

The recursion alternates, like left foot, right foot:

$$
(\hat{\mathbf{x}}_{k-1}^+, \mathbf{P}_{k-1}^+) \ \xrightarrow{\text{predict}}\ (\hat{\mathbf{x}}_k^-, \mathbf{P}_k^-) \ \xrightarrow{\text{update}}\ (\hat{\mathbf{x}}_k^+, \mathbf{P}_k^+) \ \xrightarrow{\text{predict}}\ (\hat{\mathbf{x}}_{k+1}^-, \mathbf{P}_{k+1}^-) \ \xrightarrow{\text{update}} \cdots
$$

It has to start somewhere. Take whatever you know before any reading (a survey of the launch pad, another filter's last estimate, a first rough orbit solution) and call it $\hat{\mathbf{x}}_0^+ = \hat{\mathbf{x}}_0$, $\mathbf{P}_0^+ = \mathbf{P}_0$. These are the $\hat{\mathbf{x}}_0$ and $\mathbf{P}_0$ of the stochastic model.

Calling it "plus" is bookkeeping, not a claim that a reading produced it. It only says: this is what the recursion should *predict from* at step $1$. Some authors start instead from $\hat{\mathbf{x}}_0^-$ and update it at once with a reading at $k = 0$. Both conventions give the same estimates. The only real mistake is switching between them in the middle of one derivation.

::: warning Minus and plus are a time, not a quality
$\hat{\mathbf{x}}_k^-$ and $\hat{\mathbf{x}}_k^+$ carry the *same* time index $k$. They are two estimates of $\mathbf{x}_k$, before and after $\mathbf{z}_k$. They are not an estimate of $\mathbf{x}_{k-1}$ and one of $\mathbf{x}_k$. A predict step moves the *time index* from $k-1$ to $k$. An update step leaves the time index alone and only turns the minus into a plus. Writing $\hat{\mathbf{x}}_{k+1}^+$ when you meant $\hat{\mathbf{x}}_k^+$ is the most common indexing slip in a first implementation, and it hides in code until the filter's timing looks one step late.
:::

## The predict step

Between $k-1$ and $k$ the true state obeys the stochastic model: $\mathbf{x}_k = \mathbf{F}_{k-1}\mathbf{x}_{k-1} + \mathbf{G}_{k-1}\mathbf{u}_{k-1} + \mathbf{w}_{k-1}$.

**The mean.** Define the prediction as the average of $\mathbf{x}_k$ given every reading so far, $\mathbf{z}_1$ to $\mathbf{z}_{k-1}$. Averages pass through sums and through fixed matrices, so take the average of each term:

$$
\hat{\mathbf{x}}_k^- = \mathbb{E}[\mathbf{x}_k \mid \mathbf{z}_1,\ldots,\mathbf{z}_{k-1}] = \mathbf{F}_{k-1}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}_{k-1}\mathbf{u}_{k-1}.
$$

The first term became $\mathbf{F}_{k-1}\hat{\mathbf{x}}_{k-1}^+$ because $\hat{\mathbf{x}}_{k-1}^+$ *is* the average of $\mathbf{x}_{k-1}$ given those readings. The input is known, so it passes straight through. The noise term vanished because $\mathbb{E}[\mathbf{w}_{k-1}] = \mathbf{0}$. In words: run the ordinary dynamics on your best state. Noise with zero mean cannot move where you expect to be. It can only change how sure you are.

**The covariance.** Subtract the prediction from the truth to get the predicted error:

$$
\mathbf{e}_k^- = \mathbf{x}_k - \hat{\mathbf{x}}_k^- = \mathbf{F}_{k-1}\mathbf{e}_{k-1}^+ + \mathbf{w}_{k-1}.
$$

(The input canceled, because truth and prediction both used the same $\mathbf{u}$.) Now take the covariance of this sum. The sandwich rule gives $\mathbf{F}\mathbf{P}^+_{k-1}\mathbf{F}^{\mathsf{T}}$ for the first piece and $\mathbf{Q}$ for the second. There could be a cross term, $\mathbb{E}[\mathbf{e}_{k-1}^+\mathbf{w}_{k-1}^{\mathsf{T}}]$, but it is zero. The old error $\mathbf{e}_{k-1}^+$ is built only from things up to step $k-1$, and $\mathbf{w}_{k-1}$ is independent of all of them. That is the whiteness assumption of the first lesson, doing its job.

::: key Kalman filter PREDICT step
$$
\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}, \qquad
\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}.
$$
(Subscripts on $\mathbf{F}$, $\mathbf{G}$, $\mathbf{Q}$ dropped for the time-invariant case, as in the stochastic-model lesson.) The covariance always grows in prediction.
:::

### What "always grows" means

Read the covariance formula as two moves.

**Move 1: carry.** $\mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}}$ carries the uncertainty through the same map that carries the state. Mathematicians call this a **[[congruence transform|congruence-shear]]**. It keeps $\mathbf{P}$ symmetric and positive definite (every model in this module has an invertible $\mathbf{F}$). But it can reshape the uncertainty: stretch it in one direction, squeeze it in another.

**Move 2: add.** Then $\mathbf{Q}$ is added on top. $\mathbf{Q}$ is positive semi-definite: it can add uncertainty in some directions, and never removes any in any direction.

So the precise statement is $\mathbf{P}_k^- \succeq \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}}$. The symbol $\succeq$ ("is at least") is the **[[Loewner order|loewner]]**, the same matrix inequality the least-squares module used for information matrices. It means $\mathbf{P}_k^- - \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} = \mathbf{Q}$ is positive semi-definite. That is the sense of the flashcard's "always grows": prediction only ever adds uncertainty to what the dynamics carry forward, and never takes any away.

Be careful with the everyday reading of it, though. A single variance *can* come out smaller after a predict step, because Move 1 reshapes. Two cases:

- **A negative correlation, sheared.** In the constant-velocity model with $\Delta t = 1\,\mathrm{s}$, start from $\mathbf{P}^+ = \begin{pmatrix} 4 & -1 \\ -1 & 1 \end{pmatrix}$: the estimate tends to be too far ahead exactly when it is too slow. Carrying it forward gives a position variance of $4 + 2(1)(-1) + (1)^2(1) = 3$, down from $4$, before $\mathbf{Q}$ is added. The velocity error partly cancels the position error.
- **A mean-reverting state.** The gyro bias of the first lesson, $b_{k+1} = \phi b_k + w_{b,k}$ with $\phi = e^{-\Delta t/T_b} < 1$, is pulled back toward zero every step. Its predicted variance is $\phi^2\operatorname{Var}(b_{k-1}^+) + Q_b$. That *falls* whenever the variance starts above the process's steady spread $\sigma_b^2 = Q_b/(1-\phi^2)$. Prediction pulls it back toward that spread, as a Gauss-Markov process does with no readings at all.

Neither case breaks the key. In both, prediction still added $\mathbf{Q}$ and removed nothing; the dynamics themselves did the squeezing. What prediction can never do is make you *more* certain than the noiseless dynamics alone would.

## The update step, with time labels

The update step is last lesson's one-step answer, unchanged, now carrying the time label that says which prediction it corrects:

::: key Kalman filter UPDATE step
$$
\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-, \qquad
\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}, \qquad
\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1},
$$
$$
\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k, \qquad
\mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-.
$$
:::

The labels show how little the update needs: only $\hat{\mathbf{x}}_k^-$, $\mathbf{P}_k^-$ and the current $\mathbf{z}_k$. Every earlier reading has already been squeezed into those two objects. That squeezing is the [[Markov property|fixed-memory]] the first lesson built in by making $\mathbf{w}$ white. Given $\mathbf{x}_{k-1}$, the past says nothing more about the future. So a filter never re-reads old readings, and its memory use is fixed however long it runs. A batch least-squares solve over the same data would keep every reading in a growing system of equations. The Kalman recursion keeps exactly $\hat{\mathbf{x}}^+$ and $\mathbf{P}^+$, whether $k$ is $10$ or $10^7$.

The update also provably *removes* uncertainty. The last lesson showed $\mathbf{K}_k\mathbf{S}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}$. Use it, and the symmetry of $\mathbf{P}_k^-$ and $\mathbf{S}_k$, to rewrite what the update subtracts:

$$
\mathbf{P}_k^- - \mathbf{P}_k^+ = \mathbf{K}_k\mathbf{H}\mathbf{P}_k^- = \mathbf{K}_k(\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}})^{\mathsf{T}} = \mathbf{K}_k(\mathbf{K}_k\mathbf{S}_k)^{\mathsf{T}} = \mathbf{K}_k\mathbf{S}_k\mathbf{K}_k^{\mathsf{T}}.
$$

That is the positive definite $\mathbf{S}_k$ sandwiched between $\mathbf{K}_k$ and its transpose, which is positive semi-definite. So $\mathbf{P}_k^- \succeq \mathbf{P}_k^+$ always.

Together the two half-steps say everything a filter does to its own uncertainty. Predict adds $\mathbf{Q}$ on top of what the dynamics carry. Update removes $\mathbf{K}\mathbf{S}\mathbf{K}^{\mathsf{T}}$. Nothing else changes $\mathbf{P}$. That is why an unexplained shrink or jump in a flight filter's reported covariance is the first thing to distrust, a theme the divergence lesson returns to.

## The recursive cycle, run for real

::: example Eight steps of a descending booster's altitude filter
Continue the first lesson's scenario. The model is constant velocity with $q = 0.5\,\mathrm{m^2/s^3}$ and $\Delta t = 0.1\,\mathrm{s}$, so

$$
\mathbf{F} = \begin{pmatrix}1 & 0.1\\0 & 1\end{pmatrix}, \qquad \mathbf{Q} = \begin{pmatrix}1.667\times10^{-4} & 2.5\times10^{-3}\\ 2.5\times10^{-3} & 0.05\end{pmatrix}.
$$

A radar altimeter with $\sigma_r = 2\,\mathrm{m}$ gives $R = 4\,\mathrm{m^2}$ and $\mathbf{H} = (1\ \ 0)$.

**The truth.** The booster starts at $2500\,\mathrm{m}$, falling at $70\,\mathrm{m/s}$ (velocity $-70\,\mathrm{m/s}$, with up positive). It is nudged each step by the same process noise the filter assumes: an honest simulation, not a hand-picked track.

**The filter's start.** A poor guess, $\hat{\mathbf{x}}_0^+ = (2400,\ -60)^{\mathsf{T}}$, with $\mathbf{P}_0^+ = \operatorname{diag}(100,\ 25)$: a $10\,\mathrm{m}$ and $5\,\mathrm{m/s}$ uncertainty. The real errors, $100\,\mathrm{m}$ and $10\,\mathrm{m/s}$, are far bigger than the filter admits.

Running the cycle with a fixed [[random seed|random-seed]], so every number is reproducible:

| $k$ | $z_k\,(\mathrm{m})$ | $\hat{x}_k^-\,(\mathrm{m})$ | $P_{k,pp}^-$ | $K_{k,p}$ | $\hat{x}_k^+\,(\mathrm{m})$ | $P_{k,pp}^+$ |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2498.16 | 2394.00 | 100.25 | 0.962 | 2494.16 | 3.847 |
| 2 | 2485.58 | 2488.41 | 4.116 | 0.507 | 2486.98 | 2.029 |
| 3 | 2479.38 | 2481.14 | 2.527 | 0.387 | 2480.46 | 1.549 |
| 4 | 2472.96 | 2474.52 | 2.224 | 0.357 | 2473.96 | 1.429 |
| 5 | 2463.23 | 2467.91 | 2.196 | 0.354 | 2466.25 | 1.418 |

($P_{k,pp}$ is the position-position entry of $\mathbf{P}$, and $K_{k,p}$ the position entry of the gain.)

**Step 1, by hand.** Predict: $\hat{x}_1^- = 2400 + 0.1\times(-60) = 2394.00\,\mathrm{m}$. The predicted variance is still nearly the initial $100$, so $S_1 = 100.25 + 4 = 104.25$ and $K_{1,p} = 100.25/104.25 = 0.962$. The innovation is $2498.16 - 2394.00 = 104.16\,\mathrm{m}$, and, keeping one more digit of the gain, $2394.00 + 0.9616\times104.16 = 2494.16\,\mathrm{m}$. The filter hardly trusts its rough starting guess, and moves $96\%$ of the way to the first reading.

**Settling.** By $k = 4$ the predicted variance has settled near $2.2\,\mathrm{m^2}$, comparable with $R = 4\,\mathrm{m^2}$, and the gain near $0.36$. It is visibly approaching a fixed value, which the steady-state lesson later derives directly.

**Step 8.** The truth is $(2444.04,\ -69.93)$ and the filter reports $\hat{\mathbf{x}}_8^+ = (2445.90,\ -65.73)$. With error defined as truth minus estimate, that is a position error of $-1.87\,\mathrm{m}$ against $\sigma_p = \sqrt{P_{8,pp}^+} = 1.16\,\mathrm{m}$, and a velocity error of $-4.19\,\mathrm{m/s}$ against $\sigma_v = 2.64\,\mathrm{m/s}$. Neither number condemns the filter. One run of a random process says almost nothing about whether the covariance is honest, which is why the consistency-testing lesson insists on hundreds of runs.

**The full matrices once.** At $k = 1$:

$$
\mathbf{P}_1^- = \begin{pmatrix}100.250 & 2.503\\ 2.503 & 25.050\end{pmatrix}, \quad \mathbf{K}_1 = \begin{pmatrix}0.962\\ 0.0240\end{pmatrix}, \quad \mathbf{P}_1^+ = \begin{pmatrix}3.847 & 0.0960\\ 0.0960 & 24.990\end{pmatrix}.
$$

The table shows only the position variance, because the reading acts on it most directly. But $\mathbf{P}$ does not stay diagonal. The small velocity gain $K_{1,v} = 0.0240$ is not zero only because $\mathbf{P}_1^-$ already carries a position-velocity link of $2.503\,\mathrm{m^2/s}$. One predict step created it from the uncorrelated $\mathbf{P}_0^+$: $0.1\times25 = 2.5$ from the shear in $\mathbf{F}$, plus $0.0025$ from $\mathbf{Q}$.
:::

```python
import numpy as np

rng = np.random.default_rng(34)
dt, q = 0.1, 0.5
F = np.array([[1.0, dt], [0.0, 1.0]])
Q = q * np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])
H = np.array([[1.0, 0.0]]); R = np.array([[4.0]])

x_true = np.array([2500.0, -70.0])
x_plus = np.array([2400.0, -60.0])
P_plus = np.diag([100.0, 25.0])

for k in range(1, 9):
    x_true = F @ x_true + rng.multivariate_normal(np.zeros(2), Q)
    z = H @ x_true + rng.normal(0.0, np.sqrt(R[0, 0]))

    x_minus = F @ x_plus
    P_minus = F @ P_plus @ F.T + Q

    nu = z - H @ x_minus
    S = H @ P_minus @ H.T + R
    K = P_minus @ H.T @ np.linalg.inv(S)
    x_plus = x_minus + K @ nu
    P_plus = (np.eye(2) - K @ H) @ P_minus
    if k <= 5:
        print(f"k={k}  z={z[0]:.2f}  x-_p={x_minus[0]:.2f}  P-_pp={P_minus[0,0]:.3f}  "
              f"K_p={K[0,0]:.3f}  x+_p={x_plus[0]:.2f}  P+_pp={P_plus[0,0]:.3f}")
# k=1  z=2498.16  x-_p=2394.00  P-_pp=100.250  K_p=0.962  x+_p=2494.16  P+_pp=3.847
# k=2  z=2485.58  x-_p=2488.41  P-_pp=4.116  K_p=0.507  x+_p=2486.98  P+_pp=2.029
# k=3  z=2479.38  x-_p=2481.14  P-_pp=2.527  K_p=0.387  x+_p=2480.46  P+_pp=1.549
# k=4  z=2472.96  x-_p=2474.52  P-_pp=2.224  K_p=0.357  x+_p=2473.96  P+_pp=1.429
# k=5  z=2463.23  x-_p=2467.91  P-_pp=2.196  K_p=0.354  x+_p=2466.25  P+_pp=1.418
```

::: example The sawtooth in a one-number filter
Strip away the matrices to see the rhythm alone. Take a scalar **[[random walk|random-walk]]**: a single number that drifts by a random amount each step. Start with $P_0^+ = 25$, process variance $q = 0.2$ per step, and measurement variance $r = 1$. Here $\mathbf{F}$ and $\mathbf{H}$ are both $1$, so the cycle is

$$
P_k^- = P_{k-1}^+ + q, \qquad K_k = \frac{P_k^-}{P_k^- + r}, \qquad P_k^+ = (1 - K_k)P_k^-.
$$

Step 1: $P_1^- = 25 + 0.2 = 25.2$, $K_1 = 25.2/26.2 = 0.962$, $P_1^+ = 0.038\times25.2 = 0.962$. Step 2: $P_2^- = 0.962 + 0.2 = 1.162$, $K_2 = 1.162/2.162 = 0.537$, $P_2^+ = 0.463\times1.162 = 0.537$. And so on:

| $k$ | $P_k^-$ | $K_k$ | $P_k^+$ |
| --- | --- | --- | --- |
| 1 | 25.200 | 0.962 | 0.962 |
| 2 | 1.162 | 0.537 | 0.537 |
| 3 | 0.737 | 0.424 | 0.424 |
| 4 | 0.624 | 0.384 | 0.384 |
| 5 | 0.584 | 0.369 | 0.369 |
| 6 | 0.569 | 0.363 | 0.363 |

(The $K$ and $P^+$ columns match only because $r = 1$: then $P^+ = P^- r/(P^- + r) = K$.)

Every predict step adds exactly $q = 0.2$. Every update multiplies by $(1 - K)$. The two pull in opposite directions, and the $P^+$ values ($0.962, 0.537, 0.424, 0.384, 0.369, 0.363$) are **[[leveling off|fixed-point]]** rather than falling forever. Past $k \approx 5$, what the predict step adds is nearly matched by what the update removes.

**Sanity check.** The variance never goes below zero and never above the $25.2$ it started from, and each prediction is exactly $0.2$ above the previous posterior. Nothing here has *proven* there is a fixed point yet; the steady-state lesson does that.
:::

::: warning Keep Q, R and the variable names straight
$\mathbf{Q}$ and $\mathbf{R}$ belong outside the predict-update loop, computed once, or again only when $\Delta t$ really changes (the first lesson's warning about $\mathbf{Q}$ scaling with the step). A filter that accidentally resets $\mathbf{P}_0$ inside the loop, or reuses last cycle's $\mathbf{z}$ instead of this cycle's, will run without crashing and produce a smoothly wrong answer. These are easy copy-paste errors when predict and update are two separate functions, and nothing in the shape of the output warns you. The only defense is discipline about which variable holds $\hat{\mathbf{x}}_k^-$ and which holds $\hat{\mathbf{x}}_k^+$ at every line. That is why this lesson's naming is worth keeping in code, not only on paper.
:::

## Check yourself

::: check
Derive the predict step's mean equation from the stochastic model, and say exactly where the whiteness of $\mathbf{w}$ is used.
:::

::: answer
Start from $\mathbf{x}_k = \mathbf{F}\mathbf{x}_{k-1} + \mathbf{G}\mathbf{u}_{k-1} + \mathbf{w}_{k-1}$ and average both sides given the readings through step $k-1$ (written $\mathbf{z}_{1:k-1}$):

$$
\hat{\mathbf{x}}_k^- = \mathbf{F}\,\mathbb{E}[\mathbf{x}_{k-1}\mid\mathbf{z}_{1:k-1}] + \mathbf{G}\mathbf{u}_{k-1} + \mathbb{E}[\mathbf{w}_{k-1}\mid\mathbf{z}_{1:k-1}].
$$

The first average is $\hat{\mathbf{x}}_{k-1}^+$ by definition. The last term is zero only because $\mathbf{w}_{k-1}$ is independent of every reading through step $k-1$. Whiteness, together with the assumption that $\mathbf{w}$ and $\mathbf{v}$ are uncorrelated, guarantees that. Without it, knowing past readings could shift the expected noise away from zero, and the predict step would need a correction term.
:::

::: check
Why does $\mathbf{P}_k^- \succeq \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}}$ hold for every model in this module? Is it ever an equality?
:::

::: answer
$\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$, and $\mathbf{Q}$ is positive semi-definite by the model's assumptions. So the difference, $\mathbf{Q}$, is always $\succeq \mathbf{0}$. This needs nothing at all about $\mathbf{F}$.

It is an equality exactly when $\mathbf{Q} = \mathbf{0}$: a model with no process noise. The module treats that as a limiting case (used on purpose later, for instance to show what an unobservable direction does to the covariance), not a realistic one, because $\mathbf{Q} = \mathbf{0}$ claims the dynamics model is perfect.
:::

::: check
In the eight-step example, $K_{1,v} = 0.0240$ is small but not zero, although velocity is never measured. Explain why, using $\mathbf{P}_1^-$.
:::

::: answer
The gain is $\mathbf{K}_1 = \mathbf{P}_1^-\mathbf{H}^{\mathsf{T}}S_1^{-1}$. With $\mathbf{H} = (1\ \ 0)$, $\mathbf{P}_1^-\mathbf{H}^{\mathsf{T}}$ is the first column of $\mathbf{P}_1^- = \begin{pmatrix}100.250 & 2.503\\ 2.503 & 25.050\end{pmatrix}$, namely $(100.250,\ 2.503)^{\mathsf{T}}$.

The velocity entry, $2.503$, is not zero because one predict step from the uncorrelated $\mathbf{P}_0^+ = \operatorname{diag}(100,25)$ already mixes the two states: $\mathbf{F}\mathbf{P}_0^+\mathbf{F}^{\mathsf{T}}$ contributes $\Delta t \times 25 = 2.5$, and the off-diagonal entry of $\mathbf{Q}$ adds $0.0025$. Dividing by $S_1 = 104.25$ gives $K_{1,v} = 2.503/104.25 = 0.0240$: a small but real correction to velocity from a position-only reading, driven entirely by the correlation the dynamics created.
:::

::: check
A colleague's code updates `P` before it updates `x` inside the update step. Does the order matter?
:::

::: answer
What matters is that $\mathbf{K}_k$ is computed from $\mathbf{P}_k^-$, the *predicted* covariance. As long as the code computes $\boldsymbol{\nu}_k$, $\mathbf{S}_k$ and $\mathbf{K}_k$ from $\mathbf{P}_k^-$ before overwriting the variable that holds it, the order of the last two assignments makes no difference. Neither $\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k$ nor $\mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$ uses the other's result.

The real hazard is a single variable `P` that gets overwritten with $\mathbf{P}_k^+$ *before* $\mathbf{K}_k$ is computed. Then the gain comes from the wrong covariance. The filter still runs and still looks roughly sensible, which is what makes the bug easy to miss.
:::

::: check
Predict what the one-number sawtooth example would look like with $q$ ten times larger ($q = 2$) and $r$ unchanged. Which rows change most, and does it settle faster or slower? Then check with the recursion.
:::

::: answer
A larger $q$ makes every predict step add more variance, so every $P_k^-$ rises. That pushes every gain $K_k = P_k^-/(P_k^- + r)$ toward $1$: the filter trusts each reading more because it trusts its own prediction less. The level it settles at is higher, since a noisier process means more leftover uncertainty.

It settles *faster*. The gap to the settling value shrinks by roughly a factor of $(1 - K)$ each step, and a bigger $K$ makes that factor smaller.

The first row barely changes, because $k = 1$ is dominated by the large $P_0^+ = 25$. The later rows change the most.

Checking: $P_1^- = 27$, $K_1 = 27/28 = 0.964$, $P_1^+ = 0.964$. Then $P_2^- = 2.964$, $K_2 = P_2^+ = 0.748$; then $0.733$, then $0.732$, where it stays. So $P^+$ levels off at about $0.732$ by the third or fourth step, about twice the $0.358$ that the $q = 0.2$ filter approaches, and in fewer steps.
:::

## Summary

| Item | Statement |
| --- | --- |
| Time labels | $\hat{\mathbf{x}}_k^-, \mathbf{P}_k^-$: before $\mathbf{z}_k$; $\hat{\mathbf{x}}_k^+, \mathbf{P}_k^+$: after. Start with $\hat{\mathbf{x}}_0^+=\hat{\mathbf{x}}_0$, $\mathbf{P}_0^+=\mathbf{P}_0$ |
| Predict step | $\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}$, $\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ |
| Update step | $\boldsymbol{\nu}_k=\mathbf{z}_k-\mathbf{H}\hat{\mathbf{x}}_k^-$, $\mathbf{S}_k=\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}+\mathbf{R}$, $\mathbf{K}_k=\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$, $\hat{\mathbf{x}}_k^+=\hat{\mathbf{x}}_k^-+\mathbf{K}_k\boldsymbol{\nu}_k$, $\mathbf{P}_k^+=(\mathbf{I}-\mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$ |
| Prediction only adds | $\mathbf{P}_k^- - \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} = \mathbf{Q} \succeq \mathbf{0}$; a single variance can still fall if $\mathbf{F}$ squeezes it (negative correlation sheared, or a mean-reverting state with $\phi<1$) |
| Update only removes | $\mathbf{P}_k^- - \mathbf{P}_k^+ = \mathbf{K}_k\mathbf{S}_k\mathbf{K}_k^{\mathsf{T}} \succeq \mathbf{0}$ |
| Fixed memory | The update needs only $\hat{\mathbf{x}}_k^-, \mathbf{P}_k^-, \mathbf{z}_k$, however long the filter has run |

Both examples showed the gain and the covariance leveling off to fixed values. The next lesson looks straight at what $\mathbf{K}_k$ *is*: a ratio of how much the filter trusts its prediction against how much it trusts the reading.

::: context latin-labels Before the fact and after it
*A priori* and *a posteriori* are Latin for "from what comes before" and "from what comes after". Philosophers used them for knowledge you have before experience and knowledge you gain from it. Estimation borrowed them for "before this reading" and "after this reading". Engineers often shorten them to "prior" and "posterior", or say "minus" and "plus" after the superscripts.
:::

::: context congruence-shear How the carry step reshapes uncertainty
The constant-velocity $\mathbf{F}$ is a **shear**: it slides each point sideways by an amount proportional to its velocity. Picture the one-sigma ellipse of $\mathbf{P}^+ = \begin{pmatrix} 4 & -1 \\ -1 & 1 \end{pmatrix}$, tilted because position and velocity errors have opposite signs. With $\Delta t = 1\,\mathrm{s}$ the shear straightens it into $\begin{pmatrix} 3 & 0 \\ 0 & 1 \end{pmatrix}$: the position spread falls from $2$ to $\sqrt{3} \approx 1.73$. The area of the ellipse, set by the determinant, stays at $3$, since the shear has determinant $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="80" x2="170" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <line x1="90" y1="20" x2="90" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="90" cy="80" rx="62.2" ry="25" transform="rotate(16.85 90 80)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <text x="90" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">before: σp = 2</text>
  <line x1="190" y1="80" x2="350" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <line x1="270" y1="20" x2="270" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="270" cy="80" rx="52" ry="30" fill="#f2b880" fill-opacity="0.6" stroke="#b4232c" stroke-width="2"/>
  <text x="270" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">after F: σp = 1.73</text>
  <text x="164" y="94" font-size="11" fill="#1f2a44">p</text>
  <text x="96" y="28" font-size="11" fill="#1f2a44">v</text>
  <text x="344" y="94" font-size="11" fill="#1f2a44">p</text>
  <text x="276" y="28" font-size="11" fill="#1f2a44">v</text>
</svg>
```
:::

::: context loewner Comparing two matrices
You cannot say one matrix is "bigger" than another in general. The Loewner order, named after the mathematician Charles Loewner (born Karel Löwner), gives a precise meaning for symmetric matrices: $\mathbf{A} \succeq \mathbf{B}$ when $\mathbf{A} - \mathbf{B}$ is positive semi-definite. Then $\mathbf{y}^{\mathsf{T}}\mathbf{A}\mathbf{y} \geq \mathbf{y}^{\mathsf{T}}\mathbf{B}\mathbf{y}$ for every direction $\mathbf{y}$. For covariances it says: in *every* direction, uncertainty $\mathbf{A}$ is at least as wide as uncertainty $\mathbf{B}$. Its ellipse contains the other's.
:::

::: context fixed-memory A filter that fits in a tiny computer
Because the filter keeps only its latest estimate and covariance, its memory never grows. That mattered enormously in the 1960s. The Apollo Guidance Computer had about $2048$ words of erasable memory, yet it ran a Kalman-type navigation filter to the Moon. A batch least-squares solution, which keeps every past measurement, would not have fit. Today the same property lets a filter run for years on a satellite without ever running out of room.
:::

::: context random-seed Why a fixed seed
A computer's "random" numbers come from a formula that produces a long, jumbled sequence starting from a number called the seed. Same seed, same sequence. Fixing the seed (here $34$) means anyone who runs the code gets exactly the same fake measurements and noise, so the table can be checked digit by digit. Change the seed and you get a different, equally valid run, with different errors.
:::

::: context random-walk A drunkard's walk
A random walk adds an independent random step to a value at each tick. Its spread grows like the square root of the number of steps: after $100$ steps of variance $0.2$, the variance is $20$ and the spread about $4.5$. A gyro's angle error from white rate noise behaves exactly like this, which is where the name "angle random walk" comes from.
:::

::: context fixed-point Where the sawtooth settles
At the settling point, one full cycle leaves $P^+$ unchanged. Call the predicted value $P$. Then $P = P^+ + q$ and $P^+ = Pr/(P + r)$. Put them together: $P^2 - qP - qr = 0$, so $P = \bigl(q + \sqrt{q^2 + 4qr}\bigr)/2$. With $q = 0.2$ and $r = 1$ that gives $P = 0.558$ and $P^+ = 0.358$, the value the table is heading for. This little equation is the scalar version of the discrete Riccati equation in the steady-state lesson.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="117" x2="345" y2="117" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="60,44.6 110,20.6 110,95.5 160,71.5 160,109.1 210,85.1 210,113.9 260,89.9 260,115.7 310,91.7 310,116.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="176">1</text><text x="110" y="176">2</text><text x="160" y="176">3</text><text x="210" y="176">4</text><text x="260" y="176">5</text><text x="310" y="176">6</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="35" y="164">0</text><text x="35" y="104">0.5</text><text x="35" y="44">1.0</text>
  </g>
  <text x="340" y="112" font-size="11" fill="#6c7a93" text-anchor="end">settles at 0.358</text>
  <text x="120" y="18" font-size="11" fill="#1d6fd1">predict: up by 0.2</text>
  <text x="118" y="74" font-size="11" fill="#b4232c">update: down</text>
  <text x="190" y="188" font-size="12" fill="#1f2a44" text-anchor="middle">step k</text>
</svg>
```
:::
