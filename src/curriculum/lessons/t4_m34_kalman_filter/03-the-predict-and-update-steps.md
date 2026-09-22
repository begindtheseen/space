---
id: l03-the-predict-and-update-steps
title: The predict and update steps
minutes: 17
covers:
  - The predict and update steps
---

The last lesson solved one problem: fuse a single prior with a single measurement. A flight computer does not have one prior and one measurement — it has a clock. Every tick, the vehicle moves, so the belief you ended the previous tick with is no longer a belief about *now*. Before a new measurement can correct anything, the old estimate has to be carried forward through the dynamics to the instant the new measurement was taken. That carrying-forward is the **predict** step, and it is the piece the one-step problem quietly assumed away by starting from "you hold a prior" without asking where the prior came from.

Put the predict step next to the update step from the last lesson and you have the whole Kalman filter: two half-pages of algebra, executed thousands of times a second on a descending booster, a cruising missile, or a spacecraft between star-tracker fixes. Everything from here to the end of the module — the gain's meaning, the steady-state limit, numerical stability, divergence, consistency — is commentary on this one cycle. This lesson writes the cycle down precisely, indexed by time, derives the predict step from the stochastic model of the first lesson, and runs it for real on the descending-booster scenario that lesson set up.

## Indexing the recursion

Attach every quantity to the time step $k$ at which the measurement $\mathbf{z}_k$ arrives. Write $\hat{\mathbf{x}}_k^-$ and $\mathbf{P}_k^-$ for the estimate and its covariance **before** $\mathbf{z}_k$ is used — the *a priori* values, produced by propagating the previous step's result forward — and $\hat{\mathbf{x}}_k^+$, $\mathbf{P}_k^+$ for the values **after**, the *a posteriori* result the last lesson computed. The recursion alternates:

$$
(\hat{\mathbf{x}}_{k-1}^+, \mathbf{P}_{k-1}^+) \ \xrightarrow{\text{predict}}\ (\hat{\mathbf{x}}_k^-, \mathbf{P}_k^-) \ \xrightarrow{\text{update}}\ (\hat{\mathbf{x}}_k^+, \mathbf{P}_k^+) \ \xrightarrow{\text{predict}}\ (\hat{\mathbf{x}}_{k+1}^-, \mathbf{P}_{k+1}^-) \ \xrightarrow{\text{update}} \cdots
$$

It has to start somewhere. Take whatever you know before any measurement — a pad survey, a previous filter's terminal estimate, an initial-orbit-determination solution — and call it $\hat{\mathbf{x}}_0^+ = \hat{\mathbf{x}}_0$, $\mathbf{P}_0^+ = \mathbf{P}_0$, the $\hat{\mathbf{x}}_0$ and $\mathbf{P}_0$ of the stochastic model in the first lesson. Labelling it a "$+$" is a bookkeeping choice, not a claim that a measurement produced it: it says only that this is the state the recursion should *predict from* at step 1. Some authors instead start from a $\hat{\mathbf{x}}_0^-$ and immediately update it with a measurement at $k=0$; both conventions land on the same sequence of estimates, and the only real mistake is switching between them inside one derivation.

::: warning Minus and plus are a time, not a quality
$\hat{\mathbf{x}}_k^-$ and $\hat{\mathbf{x}}_k^+$ carry the *same* time index $k$ — they are two estimates of $\mathbf{x}_k$, before and after $\mathbf{z}_k$, not an estimate of $\mathbf{x}_{k-1}$ and one of $\mathbf{x}_k$. A predict step advances the *time index* from $k-1$ to $k$; an update step leaves the time index alone and only removes the minus. Writing $\hat{\mathbf{x}}_{k+1}^+$ when you meant $\hat{\mathbf{x}}_k^+$ is the single most common indexing slip in a first implementation, and it is invisible in code until the filter's timing looks one step late.
:::

## The predict step

Between $k-1$ and $k$ the true state obeys the stochastic model exactly as the first lesson wrote it: $\mathbf{x}_k = \mathbf{F}_{k-1}\mathbf{x}_{k-1} + \mathbf{G}_{k-1}\mathbf{u}_{k-1} + \mathbf{w}_{k-1}$. Define the prediction as the conditional mean given everything measured through step $k-1$, and expand using linearity of expectation:

$$
\hat{\mathbf{x}}_k^- = \mathbb{E}[\mathbf{x}_k \mid \mathbf{z}_1,\ldots,\mathbf{z}_{k-1}] = \mathbf{F}_{k-1}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}_{k-1}\mathbf{u}_{k-1},
$$

since $\hat{\mathbf{x}}_{k-1}^+ = \mathbb{E}[\mathbf{x}_{k-1}\mid \mathbf{z}_1,\ldots,\mathbf{z}_{k-1}]$ and $\mathbb{E}[\mathbf{w}_{k-1}] = \mathbf{0}$. In words: run the deterministic dynamics of the state-space module on the best available state, using the same $\mathbf{F}$ and $\mathbf{G}$, with the process noise contributing nothing to the mean — noise with zero mean cannot move where you expect to be, only how sure you are.

For the covariance, subtract to get the predicted error, $\mathbf{e}_k^- = \mathbf{x}_k - \hat{\mathbf{x}}_k^- = \mathbf{F}_{k-1}\mathbf{e}_{k-1}^+ + \mathbf{w}_{k-1}$, and take its covariance. The cross term $\mathbb{E}[\mathbf{e}_{k-1}^+\mathbf{w}_{k-1}^{\mathsf{T}}]$ vanishes because $\mathbf{e}_{k-1}^+$ is built from $\mathbf{x}_{k-1}$ and measurement noise through step $k-1$ only, and $\mathbf{w}_{k-1}$ is independent of all of that — precisely the whiteness assumption of the first lesson, doing its job. What remains is the **predict step**:

::: key Kalman filter PREDICT step
$$
\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}, \qquad
\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}.
$$
(Subscripts on $\mathbf{F}$, $\mathbf{G}$, $\mathbf{Q}$ dropped for the time-invariant case, as in the first lesson.) The covariance always grows in prediction.
:::

Read the covariance formula as two operations. $\mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}}$ is a **congruence transform**: it carries $\mathbf{P}_{k-1}^+$ through the same linear map that carries the state, and because $\mathbf{F}$ is invertible for every model in this module it preserves symmetry and positive definiteness exactly, without asking whether $\mathbf{F}$ shrinks or grows anything (the constant-velocity $\mathbf{F}$ above has both eigenvalues equal to $1$ and determinant $1$: it neither inflates nor deflates $\mathbf{P}$ on its own). Then $\mathbf{Q}$, positive semi-definite, is added on top. Since a congruence by an invertible matrix cannot undo what a positive semi-definite addition does, $\mathbf{P}_k^- \succeq \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}}$ always, in the same Loewner (matrix-inequality) sense the least-squares module used for information matrices. For every model this module builds — constant velocity, the gyro-and-bias pair, anything with $\mathbf{F}$'s eigenvalues on or outside the unit circle — that inequality is exactly the flashcard's statement: prediction can only add uncertainty.

::: note A mean-reverting exception worth knowing
The gyro-bias state of the first lesson, $b_{k+1} = \phi b_k + w_{b,k}$ with $\phi = e^{-\Delta t/T_b} < 1$, is contractive rather than neutral. Its predicted variance is $\phi^2\operatorname{Var}(b_{k-1}^+) + Q_b$, which *decreases* if $\operatorname{Var}(b_{k-1}^+)$ starts above the process's stationary variance $\sigma_b^2 = Q_b/(1-\phi^2)$ — prediction pulls a mean-reverting state back toward its equilibrium spread, exactly as the probability module's Gauss-Markov process does with no measurement involved at all. This never happens for the position/velocity pair above, whose $\mathbf{F}$ has no eigenvalue inside the unit circle, and it is the only case in this module where "prediction grows the covariance" needs the qualifier "for the states that do not mean-revert."
:::

## The update step, indexed

The update step is the last lesson's single-step result, unchanged in substance and now carrying the time index that names which prediction it corrects:

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

What indexing makes visible is how little the update step needs: only $\hat{\mathbf{x}}_k^-$, $\mathbf{P}_k^-$ and the current $\mathbf{z}_k$ enter. Every measurement before step $k$, and every state before step $k-1$, has already been compressed into those two objects. That compression is the Markov property the first lesson built in by assuming $\mathbf{w}$ is white: given $\mathbf{x}_{k-1}$, the past carries no information about the future that $\mathbf{x}_{k-1}$ does not already carry, so a filter never needs to re-read old measurements, and its memory footprint is fixed regardless of how long it has been running. A batch least-squares solve over the same data would need every measurement kept in a growing normal-equation system; the Kalman recursion needs exactly $\hat{\mathbf{x}}^+$ and $\mathbf{P}^+$, no matter whether $k$ is $10$ or $10^7$.

The reduction from predict to update is also provably a reduction, not merely a name: using $\mathbf{K}_k\mathbf{S}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}$ from the minimum-variance derivation, $\mathbf{P}_k^- - \mathbf{P}_k^+ = \mathbf{K}_k\mathbf{H}\mathbf{P}_k^- = \mathbf{K}_k\mathbf{S}_k\mathbf{K}_k^{\mathsf{T}}$, a sandwich of the positive definite $\mathbf{S}_k$ between $\mathbf{K}_k$ and its transpose — positive semi-definite by construction, so $\mathbf{P}_k^- \succeq \mathbf{P}_k^+$ always. Between the two half-steps, then, is a complete statement of what a filter does to its own uncertainty: predict can only add it (barring the mean-reverting exception above), update can only remove it. Nothing else changes $\mathbf{P}$, which is exactly why an unexplained shrink or growth in a flight filter's reported covariance is the first thing to distrust — a theme the divergence lesson later in this module returns to in earnest.

## The recursive cycle, run for real

::: example Eight steps of a descending booster's altitude filter
Continue the scenario of the first lesson: constant-velocity model, $q = 0.5\,\mathrm{m^2/s^3}$, $\Delta t = 0.1\,\mathrm{s}$, so $\mathbf{F} = \begin{pmatrix}1 & 0.1\\0 & 1\end{pmatrix}$ and $\mathbf{Q} = \begin{pmatrix}1.667\times10^{-4} & 2.5\times10^{-3}\\ 2.5\times10^{-3} & 0.05\end{pmatrix}$, a radar altimeter with $\sigma_r = 2\,\mathrm{m}$ so $R = 4\,\mathrm{m^2}$, and $\mathbf{H} = (1\ \ 0)$. The true altitude starts at $2500\,\mathrm{m}$ descending at $70\,\mathrm{m/s}$, itself perturbed step to step by the same process noise the filter assumes — an honest simulation rather than a hand-picked track. The filter starts from a poor guess, $\hat{\mathbf{x}}_0^+ = (2400,\ -60)^{\mathsf{T}}$ with $\mathbf{P}_0^+ = \operatorname{diag}(100,\ 25)$, a $10\,\mathrm{m}$, $5\,\mathrm{m/s}$ initial uncertainty.

Running the predict–update cycle for eight steps, with a fixed random seed so every number below is reproducible:

| $k$ | $z_k\,(\mathrm{m})$ | $\hat{x}_k^-\,(\mathrm{m})$ | $P_{k,pp}^-$ | $K_{k,p}$ | $\hat{x}_k^+\,(\mathrm{m})$ | $P_{k,pp}^+$ |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2498.16 | 2394.00 | 100.25 | 0.962 | 2494.16 | 3.847 |
| 2 | 2485.58 | 2488.41 | 4.116 | 0.507 | 2486.98 | 2.029 |
| 3 | 2479.38 | 2481.14 | 2.527 | 0.387 | 2480.46 | 1.549 |
| 4 | 2472.96 | 2474.52 | 2.224 | 0.357 | 2473.96 | 1.429 |
| 5 | 2463.23 | 2467.91 | 2.196 | 0.354 | 2466.25 | 1.418 |

At $k=1$ the predicted position variance is still nearly the initial $100$, so $S_1 = 100.25 + 4 = 104.25$ and $K_{1,p} = 100.25/104.25 = 0.962$: the filter barely trusts its own week-old guess and moves $96\%$ of the way to the first measurement. By $k=4$ the predicted variance has settled near $2.2\,\mathrm{m^2}$, comparable to $R = 4\,\mathrm{m^2}$, and the gain has settled near $0.36$ — visibly approaching a fixed point, which the steady-state lesson later in this module derives directly rather than watching it happen. Carrying the recursion to $k=8$, the true state is $(2444.04,\ -69.93)$ and the filter reports $\hat{\mathbf{x}}_8^+ = (2445.90,\ -65.73)$, a position error of $-1.87\,\mathrm{m}$ against $\sigma_p = \sqrt{P_{8,pp}^+} = 1.16\,\mathrm{m}$ and a velocity error of $-4.19\,\mathrm{m/s}$ against $\sigma_v = 2.64\,\mathrm{m/s}$. Neither number indicts the filter — one realization of a random process says almost nothing about consistency, which is exactly why the consistency-testing lesson later in this module insists on hundreds of realizations before drawing a conclusion.

Also worth writing out once in full: at $k=1$, $\mathbf{P}_1^- = \begin{pmatrix}100.250 & 2.503\\ 2.503 & 25.050\end{pmatrix}$, $\mathbf{K}_1 = (0.962,\ 0.0240)^{\mathsf{T}}$, and $\mathbf{P}_1^+ = \begin{pmatrix}3.847 & 0.0960\\ 0.0960 & 24.990\end{pmatrix}$. The table above shows only the position variance because it is what the measurement acts on most directly, but $\mathbf{P}$ is never diagonal for long: the small velocity gain $K_{1,v} = 0.0240$ is nonzero only because $\mathbf{P}_1^-$ already carries a position–velocity correlation of $2.503\,\mathrm{m^2/s}$, inherited from a single predict step acting on an initially uncorrelated $\mathbf{P}_0^+$ — the same mechanism the first lesson's constant-velocity discretization built into $\mathbf{Q}$ itself.
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

::: example The sawtooth in a scalar filter with no coupling
Strip away the vector bookkeeping to see the predict/update pattern on its own. Take a scalar random walk with $P_0^+ = 25$, process variance $q = 0.2$ per step and measurement variance $r = 1$ (no $\mathbf{F}$, no $\mathbf{H}$ but the identity, so $P^- = P^+ + q$ and $K = P^-/(P^- + r)$, $P^+ = (1-K)P^-$):

| $k$ | $P_k^-$ | $K_k$ | $P_k^+$ |
| --- | --- | --- | --- |
| 1 | 25.200 | 0.962 | 0.962 |
| 2 | 1.162 | 0.537 | 0.537 |
| 3 | 0.737 | 0.424 | 0.424 |
| 4 | 0.624 | 0.384 | 0.384 |
| 5 | 0.584 | 0.369 | 0.369 |
| 6 | 0.569 | 0.363 | 0.363 |

Every predict step adds exactly $q = 0.2$; every update step multiplies by $(1-K)$. The two operations pull in opposite directions and the sequence of $P^+$ values — $0.962, 0.537, 0.424, 0.384, 0.369, 0.363,\ldots$ — is visibly converging rather than continuing to fall: past $k \approx 5$ the variance predict step adds is nearly matched by what the update step removes. A filter running at fixed $q$ and $r$ forever reaches a fixed point of this cycle, the subject of the steady-state lesson later in the module; nothing here has proven that yet, only shown it happening in six rows of arithmetic.
:::

::: warning Re-deriving Q or R inside the loop is a bug waiting to happen
$\mathbf{Q}$ and $\mathbf{R}$ belong outside the predict/update loop, computed once (or recomputed only when $\Delta t$ genuinely changes, per the first lesson's warning about $\mathbf{Q}$ scaling with the step). A filter that accidentally recomputes $\mathbf{P}_0$ or reuses last cycle's $\mathbf{z}$ instead of this cycle's — both easy copy-paste errors when predict and update are written as two separate function calls — will run without crashing and produce a smoothly wrong answer, because nothing about the recursion's shape signals that the wrong number went in. The only defence is discipline about which variable holds $\hat{\mathbf{x}}_k^-$ versus $\hat{\mathbf{x}}_k^+$ at every line, which is exactly why the naming convention of this lesson is worth keeping in code, not only on paper.
:::

## Check yourself

::: check
Derive the predict step's mean equation from the stochastic model, stating exactly where whiteness of $\mathbf{w}$ is used.
:::

::: answer
With $\mathbf{x}_k = \mathbf{F}\mathbf{x}_{k-1} + \mathbf{G}\mathbf{u}_{k-1} + \mathbf{w}_{k-1}$, take the conditional expectation given measurements through step $k-1$: $\hat{\mathbf{x}}_k^- = \mathbb{E}[\mathbf{x}_k\mid \mathbf{z}_{1:k-1}] = \mathbf{F}\mathbb{E}[\mathbf{x}_{k-1}\mid\mathbf{z}_{1:k-1}] + \mathbf{G}\mathbf{u}_{k-1} + \mathbb{E}[\mathbf{w}_{k-1}\mid\mathbf{z}_{1:k-1}]$. The first conditional expectation is $\hat{\mathbf{x}}_{k-1}^+$ by definition. The last term is zero only because $\mathbf{w}_{k-1}$ is independent of every measurement through step $k-1$ — which is what whiteness (together with the mutual-independence assumption from the first lesson) guarantees; without it, conditioning on past measurements could shift the expected noise away from zero and the predict step would need a correction term.
:::

::: check
Why does $\mathbf{P}_k^- \succeq \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}}$ hold for every model in this module, and is the inequality ever an equality?
:::

::: answer
$\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ and $\mathbf{Q}$ is positive semi-definite by the first lesson's assumptions, so the difference $\mathbf{P}_k^- - \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} = \mathbf{Q} \succeq \mathbf{0}$ always — this needs nothing about $\mathbf{F}$ at all. It is an equality exactly when $\mathbf{Q} = \mathbf{0}$: a model with no process noise, which this module treats as a limiting case (used deliberately, for instance, to show what an unobservable direction does to the covariance later on) rather than a realistic one, since $\mathbf{Q} = \mathbf{0}$ says the dynamics model is exact.
:::

::: check
In the eight-step example, $K_{1,v} = 0.0240$ is small but not zero, even though velocity is never measured directly. Explain why, in terms of $\mathbf{P}_1^-$.
:::

::: answer
The gain is $\mathbf{K}_1 = \mathbf{P}_1^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_1^{-1}$, and with $\mathbf{H} = (1\ \ 0)$, $\mathbf{P}_1^-\mathbf{H}^{\mathsf{T}}$ is exactly the first column of $\mathbf{P}_1^- = \begin{pmatrix}100.250 & 2.503\\ 2.503 & 25.050\end{pmatrix}$, namely $(100.250,\ 2.503)^{\mathsf{T}}$. The velocity row is nonzero, $2.503$, because a single predict step from an uncorrelated $\mathbf{P}_0^+ = \operatorname{diag}(100,25)$ already mixes the two states through $\mathbf{F}\mathbf{P}_0^+\mathbf{F}^{\mathsf{T}}$ and through the off-diagonal entry of $\mathbf{Q}$ itself. Dividing by $S_1 = 104.25$ gives $K_{1,v} = 2.503/104.25 = 0.0240$: a small but real correction to velocity from a position-only measurement, driven entirely by the correlation the dynamics created.
:::

::: check
A colleague's filter code updates `P` before it updates `x` inside the update step. Does the order matter, and why?
:::

::: answer
It matters because $\mathbf{K}_k$ and $\hat{\mathbf{x}}_k^+$ both need $\mathbf{P}_k^-$, the *predicted* covariance, not $\mathbf{P}_k^+$. As long as the code computes $\boldsymbol{\nu}_k$, $\mathbf{S}_k$ and $\mathbf{K}_k$ from $\mathbf{P}_k^-$ before overwriting the variable that holds it, the order of the two final assignments — writing $\hat{\mathbf{x}}_k^+$ then $\mathbf{P}_k^+$, or the reverse — makes no difference, since neither formula in the key block depends on the other's result. The real hazard is a single variable named `P` that gets overwritten by $\mathbf{P}_k^+$ before $\mathbf{K}_k$ has been computed from $\mathbf{P}_k^-$; that bug produces a gain computed from the wrong covariance and is easy to miss because the filter still runs and still looks roughly sensible.
:::

::: check
Sketch, without computing new numbers, what the scalar sawtooth example would look like if $q$ were increased tenfold with $r$ unchanged. Which rows of the table change the most?
:::

::: answer
A larger $q$ makes every predict step add more variance, so every $P_k^-$ rises, which in turn raises every gain $K_k = P_k^-/(P_k^- + r)$ toward $1$ — the filter trusts each new measurement more because it trusts its own prediction less. The fixed point the sequence settles toward is higher: a noisier assumed process caps out at a larger steady-state uncertainty, reached in about the same few steps, since the number of steps to reach the fixed point is set by how fast $(1-K)$ multiplies the gap to it, not by the fixed point's value. The later rows change proportionally more than the first, since $k=1$ is already dominated by the large initial $P_0^+ = 25$ regardless of $q$.
:::

## Summary

| Item | Statement |
| --- | --- |
| Time indexing | $\hat{\mathbf{x}}_k^-, \mathbf{P}_k^-$: before $\mathbf{z}_k$; $\hat{\mathbf{x}}_k^+, \mathbf{P}_k^+$: after. Initialize $\hat{\mathbf{x}}_0^+=\hat{\mathbf{x}}_0$, $\mathbf{P}_0^+=\mathbf{P}_0$ |
| Predict step | $\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}$, $\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ |
| Update step | $\boldsymbol{\nu}_k=\mathbf{z}_k-\mathbf{H}\hat{\mathbf{x}}_k^-$, $\mathbf{S}_k=\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}+\mathbf{R}$, $\mathbf{K}_k=\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$, $\hat{\mathbf{x}}_k^+=\hat{\mathbf{x}}_k^-+\mathbf{K}_k\boldsymbol{\nu}_k$, $\mathbf{P}_k^+=(\mathbf{I}-\mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$ |
| Predict never shrinks $\mathbf{P}$ | $\mathbf{P}_k^- \succeq \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}}$ always; a mean-reverting state ($\phi<1$) can still have its variance fall toward its stationary value |
| Update never grows $\mathbf{P}$ | $\mathbf{P}_k^- - \mathbf{P}_k^+ = \mathbf{K}_k\mathbf{S}_k\mathbf{K}_k^{\mathsf{T}} \succeq \mathbf{0}$ |
| Markov property in practice | The update needs only $\hat{\mathbf{x}}_k^-, \mathbf{P}_k^-, \mathbf{z}_k$ — fixed memory regardless of how long the filter has run |

Two rows of that table — the gain settling near a fixed value, the covariance sequence flattening out — are the same phenomenon seen twice, in the vector example and the scalar one. The next lesson looks directly at what $\mathbf{K}_k$ *is*, as a ratio of two things the filter believes, rather than as the output of a formula.
