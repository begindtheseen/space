---
id: l12-attitude-covariance-sensor-geometry
title: Covariance of an attitude solution and the effect of sensor geometry
minutes: 18
covers:
  - Covariance of an attitude solution and the effect of sensor geometry
---

Lesson eleven measured attitude error against a known truth, because a simulation can manufacture one. A flight system cannot: it needs to know how good its attitude solution is *before* comparing against anything, from the sensor geometry and noise levels alone — the same question lesson one's covariance-before-the-data note raised for a vector state, now for a rotation. This lesson derives that covariance in closed form, validates it against real Monte Carlo trials rather than asserting it, and finds — with the same algebra used for the Fisher information of every earlier lesson — exactly how it blows up as two observed directions approach each other.

## Attitude error as a small rotation vector

Near the true attitude $\mathbf{A}$, write a nearby candidate as $\mathbf{A}(\boldsymbol{\delta\theta}) = (\mathbf{I}-[\boldsymbol{\delta\theta}\times])\mathbf{A}$, where $[\boldsymbol{\delta\theta}\times]$ is the skew-symmetric matrix with $[\mathbf{v}\times]\mathbf{w}=\mathbf{v}\times\mathbf{w}$ and $\boldsymbol{\delta\theta}\in\mathbb{R}^3$ is a small rotation vector — this is the standard small-angle attitude error the attitude representations module builds MRPs and small quaternions from. Linearize how this moves a predicted body vector, using $\mathbf{b}_i=\mathbf{A}\mathbf{r}_i$ for the true attitude:

$$
\mathbf{A}(\boldsymbol{\delta\theta})\mathbf{r}_i = \mathbf{b}_i - \boldsymbol{\delta\theta}\times\mathbf{b}_i = \mathbf{b}_i + \mathbf{b}_i\times\boldsymbol{\delta\theta} = \mathbf{b}_i + [\mathbf{b}_i\times]\boldsymbol{\delta\theta} .
$$

This is exactly nonlinear least squares from two lessons back, with $\boldsymbol{\delta\theta}$ playing the role of the unknown and $[\mathbf{b}_i\times]$ its Jacobian — a $3\times3$ matrix per vector observation, in place of the row vector a scalar measurement contributed.

## The attitude information matrix

Each vector observation carries weight $a_i$ on all three of its components alike (an isotropic per-vector weight, exactly as Wahba's cost already assumes), so its contribution to the information matrix for $\boldsymbol{\delta\theta}$ is $a_i[\mathbf{b}_i\times]^\mathsf{T}[\mathbf{b}_i\times]$. Because $[\mathbf{v}\times]$ is skew-symmetric, $[\mathbf{v}\times]^\mathsf{T}=-[\mathbf{v}\times]$, and the double cross product identity $\mathbf{v}\times(\mathbf{v}\times\mathbf{w})=\mathbf{v}(\mathbf{v}\cdot\mathbf{w})-\mathbf{w}\lVert\mathbf{v}\rVert^2$ gives $[\mathbf{v}\times]^2=\mathbf{v}\mathbf{v}^\mathsf{T}-\lVert\mathbf{v}\rVert^2\mathbf{I}$, so

$$
[\mathbf{v}\times]^\mathsf{T}[\mathbf{v}\times] = -[\mathbf{v}\times]^2 = \lVert\mathbf{v}\rVert^2\mathbf{I}-\mathbf{v}\mathbf{v}^\mathsf{T} .
$$

With $\mathbf{b}_i$ a unit vector this is $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$, and summing over every observation,

$$
\mathbf{F} = \sum_i a_i\left(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}\right), \qquad \mathbf{P}_{\boldsymbol{\delta\theta}} = \mathbf{F}^{-1} .
$$

Set this against lesson two's information matrix for a vector state, $\boldsymbol{\Lambda}=\sum_i\mathbf{h}_i\mathbf{h}_i^\mathsf{T}/\sigma_i^2$: there, each scalar measurement informed exactly *one* direction (a rank-one term). Here, each vector measurement is blind along exactly *one* direction — rotation about $\mathbf{b}_i$ itself, since $(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})\mathbf{b}_i=\mathbf{0}$ — and informs the other two equally. This is lesson ten's rotation ambiguity, reappearing as an exact algebraic fact: a single vector's contribution to $\mathbf{F}$ has a genuine zero eigenvalue along its own axis, not merely a small one.

::: key Attitude information matrix
$\mathbf{F}=\sum_i a_i(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})$, the linearized Fisher information for the small-angle attitude error $\boldsymbol{\delta\theta}$ (body frame). $\mathbf{P}_{\boldsymbol{\delta\theta}}=\mathbf{F}^{-1}$ is the attitude covariance. Each vector observation contributes a rank-two term, blind exactly along its own direction — the dual of a scalar measurement's rank-one, direction-informing contribution.
:::

::: example Validated against the actual, nonlinear solution
For the two-vector case of the previous lesson ($\sigma=0.2^\circ$ per axis, $3000$ noise trials per separation), compare $\sqrt{\operatorname{trace}(\mathbf{F}^{-1})}$ against the Monte Carlo RMS attitude error of the SVD solution, and the individual diagonal entries of $\mathbf{P}_{\boldsymbol{\delta\theta}}$ against the empirical covariance of the actual small-rotation error:

| Separation | $\sqrt{\operatorname{trace}\mathbf{F}^{-1}}$ | Monte Carlo RMS (SVD) |
| --- | --- | --- |
| $90^\circ$ | $0.316^\circ$ | $0.316^\circ$ |
| $10^\circ$ | $1.635^\circ$ | $1.645^\circ$ |
| $2^\circ$ | $8.106^\circ$ | $8.220^\circ$ |

```python
# at 10 deg separation:
# P = F^-1 diagonal (rad^2):            [0.00054,  0.00019,  0.000084]
# empirical Cov(rotation error) diag:    [0.000546, 0.000193, 0.000085]
```

The linearized prediction and the full nonlinear Monte Carlo agree to three figures at good geometry and within about $1.4\%$ even at $2^\circ$ separation, component by component, not only in aggregate — the small discrepancy at extreme angles is exactly the linearization error the nonlinear least squares lesson warned $\mathbf{H}(\hat{\mathbf{x}})$-based covariances carry, growing as the true error itself grows large enough that "small angle" stops being quite true.
:::

## The closed form, and where the blind spot goes as vectors merge

For two equally weighted vectors ($a_i=a$) separated by angle $\theta$, $\mathbf{F}$'s eigenvalues can be found directly (place $\mathbf{r}_1,\mathbf{r}_2$ in a plane and expand $\mathbf{F}=a[2\mathbf{I}-\mathbf{b}_1\mathbf{b}_1^\mathsf{T}-\mathbf{b}_2\mathbf{b}_2^\mathsf{T}]$; the eigenvalues do not depend on the overall attitude, only on the angle between the vectors, since a common rotation leaves $\mathbf{F}$ similar to itself):

$$
\lambda \in \{\,a(1+\cos\theta),\ \ a(1-\cos\theta),\ \ 2a\,\}, \qquad \sigma_{\text{worst}} = \frac{1}{\sqrt{a(1-\cos\theta)}} = \frac{\sigma_{\text{sensor}}}{\sqrt{2}\,\sin(\theta/2)} ,
$$

using $a=1/\sigma_{\text{sensor}}^2$ and the half-angle identity $1-\cos\theta=2\sin^2(\theta/2)$. This is the exact attitude-domain analogue of lesson one's $\kappa(\mathbf{H})=\cot(\phi/2)$ for two nearly parallel columns — the same $\sin(\theta/2)$ in the denominator, now governing a rotation's worst-observed direction instead of a vector's.

| $\theta$ | $\lambda_{\text{best}}$ | $\lambda_{\text{worst}}$ | $\sigma_{\text{worst}}$ (closed form) |
| --- | --- | --- | --- |
| $90^\circ$ | $82{,}070$ | $82{,}070$ | $0.200^\circ$ |
| $30^\circ$ | $153{,}145$ | $10{,}995$ | $0.546^\circ$ |
| $10^\circ$ | $162{,}893$ | $1{,}247$ | $1.623^\circ$ |
| $5^\circ$ | $163{,}828$ | $312$ | $3.242^\circ$ |
| $2^\circ$ | $164{,}090$ | $50.0$ | $8.103^\circ$ |

(A third eigenvalue, $2a=164{,}140$, belongs to the direction perpendicular to the plane containing both vectors and stays essentially constant throughout — only the *in-plane* worst direction degrades.) The eigenvector for $\lambda_{\text{worst}}$ works out to $(1,\ \tan(\theta/2),\ 0)$ in the plane of $\mathbf{r}_1,\mathbf{r}_2$: as $\theta\to0$ this points along $\mathbf{r}_1$ itself, continuously approaching the exact rotation axis a single vector cannot see at all. The two-vector blind spot does not appear out of nowhere as vectors merge — it is lesson ten's one-vector blind spot, arrived at gradually, and no Wahba solver, optimal or not, can be exempt from it: this is a statement about how much information two nearly identical directions can possibly carry, not about any one algorithm's cleverness.

This is a mission-design calculation as much as an error analysis, and it can be run before a sensor is ever built, exactly as lesson one's covariance-before-the-data note promised. A magnetometer and a sun sensor are separated by whatever angle the orbit and season happen to produce on a given day — near the poles of the orbit-normal-to-Sun geometry that separation can shrink toward zero for a real spacecraft, not merely a textbook one — and $\sigma_{\text{worst}}=\sigma_{\text{sensor}}/(\sqrt2\sin(\theta/2))$ says precisely how bad the attitude knowledge gets on those days, before any telemetry comes down. A mission that budgets attitude accuracy against a single "typical" separation angle and never checks the worst day in the orbit is budgeting against the wrong number.

::: example The fix, quantified
Two vectors $2^\circ$ apart, $\sigma=0.2^\circ$: $\kappa(\mathbf{F})=3283$, worst-direction $\sigma=8.10^\circ$. Add a third vector, weighted equally:

| Added third vector | $\kappa(\mathbf{F})$ | Worst-direction $\sigma$ | Improvement |
| --- | --- | --- | --- |
| — (2 vectors only) | $3283$ | $8.10^\circ$ | — |
| $90^\circ$ from both (genuinely diverse) | $3.00$ | $0.200^\circ$ | $40.5\times$ |
| Only $4^\circ$ from the first (still nearly parallel) | — | $4.05^\circ$ | $2.0\times$ |

A well-separated third vector does not merely help — it restores $\mathbf{F}$ to near-perfect conditioning and returns the worst-direction uncertainty almost exactly to the single-sensor noise floor, $0.2^\circ$. A third vector that is itself only a few degrees from the first two helps far less, a factor of two rather than forty, because it barely constrains the direction the first two already failed to constrain. This is lesson eight's prescription again, in its third domain this module has applied it to: geometric diversity, not measurement count, is what conditioning actually asks for.
:::

## Check yourself

::: check
Derive $\mathbf{A}(\boldsymbol{\delta\theta})\mathbf{r}_i = \mathbf{b}_i + [\mathbf{b}_i\times]\boldsymbol{\delta\theta}$ from $\mathbf{A}(\boldsymbol{\delta\theta})=(\mathbf{I}-[\boldsymbol{\delta\theta}\times])\mathbf{A}$, stating which cross-product identity converts $\boldsymbol{\delta\theta}\times\mathbf{b}_i$ into $[\mathbf{b}_i\times]\boldsymbol{\delta\theta}$.
:::

::: answer
$\mathbf{A}(\boldsymbol{\delta\theta})\mathbf{r}_i = (\mathbf{I}-[\boldsymbol{\delta\theta}\times])\mathbf{A}\mathbf{r}_i = \mathbf{b}_i - \boldsymbol{\delta\theta}\times\mathbf{b}_i$, using $\mathbf{A}\mathbf{r}_i=\mathbf{b}_i$. Anticommutativity of the cross product, $\boldsymbol{\delta\theta}\times\mathbf{b}_i=-\mathbf{b}_i\times\boldsymbol{\delta\theta}$, turns this into $\mathbf{b}_i+\mathbf{b}_i\times\boldsymbol{\delta\theta}$, and $\mathbf{b}_i\times\boldsymbol{\delta\theta}=[\mathbf{b}_i\times]\boldsymbol{\delta\theta}$ by the definition of the skew-symmetric cross-product matrix.
:::

::: check
Show that $(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})\mathbf{b}_i=\mathbf{0}$, and explain in words what this says about a single vector observation's contribution to $\mathbf{F}$.
:::

::: answer
$(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})\mathbf{b}_i = \mathbf{b}_i - \mathbf{b}_i(\mathbf{b}_i^\mathsf{T}\mathbf{b}_i) = \mathbf{b}_i - \mathbf{b}_i(1) = \mathbf{0}$, using $\mathbf{b}_i^\mathsf{T}\mathbf{b}_i=1$ for a unit vector. This means $\mathbf{b}_i$ is an eigenvector of $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ with eigenvalue exactly zero: a rotation about $\mathbf{b}_i$ itself contributes nothing to this term's information, for any $a_i$, confirming that one vector observation genuinely cannot see rotation about its own direction.
:::

::: check
Using the closed form, what happens to the worst-direction standard deviation if the per-vector sensor noise $\sigma_{\text{sensor}}$ is cut in half, at fixed separation $\theta$? Compare that to what happens if $\theta$ is instead cut in half at fixed $\sigma_{\text{sensor}}$, for a small $\theta$.
:::

::: answer
$\sigma_{\text{worst}}=\sigma_{\text{sensor}}/(\sqrt2\sin(\theta/2))$ is directly proportional to $\sigma_{\text{sensor}}$, so halving the sensor noise exactly halves the worst-direction uncertainty, at any separation. Halving $\theta$ at small angles roughly doubles $\sigma_{\text{worst}}$, since $\sin(\theta/2)\approx\theta/2$ there — geometry and sensor noise enter the same formula, but only better sensors help linearly everywhere, while better geometry helps most exactly where it is worst.
:::

::: check
The eigenvalue belonging to the direction perpendicular to the plane of $\mathbf{r}_1$ and $\mathbf{r}_2$ is $2a$ regardless of $\theta$. Explain why this direction does not degrade as the two vectors approach each other.
:::

::: answer
A rotation about the axis perpendicular to the plane containing both vectors moves each of $\mathbf{b}_1,\mathbf{b}_2$ by a full-strength amount regardless of how close together the two vectors are — that rotation axis is never close to either vector's own direction, so neither vector loses sensitivity to it as $\theta$ shrinks. Only the direction *in* the plane, close to the vectors' shared direction, is where information collapses.
:::

::: check
Two engineers each have a two-vector attitude solution with $\sigma_{\text{sensor}}=0.2^\circ$ and want to add a third sensor. One proposes doubling the accuracy of an existing sensor; the other proposes adding a third vector $90^\circ$ from the existing near-parallel pair. Using this lesson's numbers, which does more for the worst-direction uncertainty at $2^\circ$ separation, and why?
:::

::: answer
Doubling one sensor's accuracy, at best, roughly doubles the relevant piece of information in a formula where $\sigma_{\text{worst}}$ already scales only linearly with $\sigma_{\text{sensor}}$ — a factor of about $2$. Adding a well-separated third vector, per this lesson's worked example, improved the worst-direction standard deviation by a factor of $40.5$, because it attacks the actual bottleneck — a direction with almost no information at all — rather than incrementally improving directions that were already well observed. When one direction is catastrophically under-informed, fixing the geometry beats improving any one sensor.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{A}(\boldsymbol{\delta\theta})=(\mathbf{I}-[\boldsymbol{\delta\theta}\times])\mathbf{A}$ | Small-angle attitude perturbation; $\boldsymbol{\delta\theta}$ a rotation vector, body frame |
| $[\mathbf{v}\times]^\mathsf{T}[\mathbf{v}\times] = \lVert\mathbf{v}\rVert^2\mathbf{I}-\mathbf{v}\mathbf{v}^\mathsf{T}$ | Double cross product identity; reduces to $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ for unit $\mathbf{b}_i$ |
| $\mathbf{F}=\sum_i a_i(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})$, $\mathbf{P}_{\boldsymbol{\delta\theta}}=\mathbf{F}^{-1}$ | Attitude information matrix and covariance; validated against Monte Carlo to $1$–$2\%$ |
| Each vector: rank-two info, blind along $\mathbf{b}_i$ | Dual of a scalar measurement's rank-one, direction-*informing* contribution |
| Two vectors, angle $\theta$: $\lambda\in\{a(1+\cos\theta),\,a(1-\cos\theta),\,2a\}$ | Closed form; worst eigenvalue $\to0$ as $\theta\to0$ |
| $\sigma_{\text{worst}} = \sigma_{\text{sensor}}/(\sqrt2\sin(\theta/2))$ | Exact attitude-domain analogue of $\kappa(\mathbf{H})=\cot(\phi/2)$ |
| Fix: geometric diversity, not sensor count | A well-placed third vector beat doubling a sensor's accuracy by $20\times$ in this lesson's numbers |

This module opened with a single question — given more measurements than unknowns, all slightly wrong, what is the best estimate? — and has now answered it for a state as ordinary as a clock bias and as structured as a rotation, with the same normal equations, the same information matrix, and the same conditioning arguments doing the work in both. The Kalman filter module picks up exactly where lesson seven left off: a state that moves, and an estimator that predicts as well as it updates.
