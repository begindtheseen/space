---
id: l10-wahba-problem
title: "The Wahba problem: aligning two sets of vector observations"
minutes: 15
covers:
  - "The Wahba problem: find the rotation best aligning two sets of vector observations"
---

Every attitude sensor a spacecraft carries reports the same kind of fact: a direction. A sun sensor reports where the Sun is, in body-fixed axes. A magnetometer reports which way the local geomagnetic field points, in body-fixed axes. A star tracker reports where a catalogued star sits, in body-fixed axes. In every case, a model — an ephemeris, a geomagnetic field model, a star catalogue — already says where that same physical direction points in a reference frame that does not rotate with the vehicle. Attitude determination is the problem of finding the single rotation that reconciles a body-frame measurement with its reference-frame counterpart, for every sensor at once, in the least squares sense this module has built. Grace Wahba posed the problem in exactly this form in 1965, and it carries her name.

The linear algebra module and the attitude representations module have already supplied everything needed to state it precisely: the direction cosine matrix as the map between frames, $SO(3)$ as the set of proper rotations, orthogonality and the determinant-one constraint. This lesson adds nothing to that machinery. It restates the least squares problem of lesson one for a state that is a rotation instead of a vector in $\mathbb{R}^n$, and shows that the change of setting turns squared-error minimization into maximizing a single matrix trace — the form every solution method in the next lesson exploits.

## The problem, precisely

Let $\mathbf{r}_1,\ldots,\mathbf{r}_k$ be unit vectors known in a reference frame (inertial, or an orbit frame), and $\mathbf{b}_1,\ldots,\mathbf{b}_k$ the same physical directions as measured in the body frame, related by the true attitude $\mathbf{A}\in SO(3)$: $\mathbf{b}_i = \mathbf{A}\mathbf{r}_i + \text{noise}$. Given a weight $a_i>0$ per sensor — playing exactly the role $1/\sigma_i^2$ played from lesson two onward, larger for a more accurate sensor — Wahba's problem is

$$
\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)} \ \tfrac12 \sum_{i=1}^{k} a_i \lVert \mathbf{b}_i - \mathbf{A}\mathbf{r}_i \rVert^2 .
$$

Every measurement model in this module up to now minimized over $\mathbb{R}^n$; this one minimizes over $SO(3)$, the constraint $\mathbf{A}^\mathsf{T}\mathbf{A}=\mathbf{I}$, $\det\mathbf{A}=+1$ built into the search itself rather than added afterward. Restricted to the group of *all* orthogonal matrices this is the **orthogonal Procrustes problem** — find the orthogonal matrix best mapping one set of vectors onto another, a named problem in numerical linear algebra since the 1960s — and Wahba's contribution was to insist on proper rotations only, ruling out the reflections an unconstrained Procrustes solution can return.

::: key The Wahba problem
$\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)} \tfrac12\sum_i a_i\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2$, given body observations $\mathbf{b}_i$ and reference vectors $\mathbf{r}_i$. The orthogonal Procrustes problem, restricted to proper rotations.
:::

## From squared error to a trace

Because $\mathbf{b}_i$ and $\mathbf{r}_i$ are unit vectors and $\mathbf{A}$ is orthogonal (so $\lVert\mathbf{A}\mathbf{r}_i\rVert=\lVert\mathbf{r}_i\rVert=1$), each squared term expands to

$$
\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2 = \lVert\mathbf{b}_i\rVert^2 - 2\,\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i + \lVert\mathbf{A}\mathbf{r}_i\rVert^2 = 2 - 2\,\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i .
$$

Summing with weights, $\sum_i a_i\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2 = 2\sum_i a_i - 2\sum_i a_i\,\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i$. The first term is a fixed constant, independent of $\mathbf{A}$, so minimizing the cost is exactly maximizing $\sum_i a_i\,\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i$. Write each term as a trace using $\mathbf{u}^\mathsf{T}\mathbf{M}\mathbf{v}=\operatorname{trace}(\mathbf{M}\mathbf{v}\mathbf{u}^\mathsf{T})$ (both sides expand to $\sum_{jl}u_jM_{jl}v_l$):

$$
\sum_i a_i\,\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i = \sum_i a_i\operatorname{trace}(\mathbf{A}\mathbf{r}_i\mathbf{b}_i^\mathsf{T}) = \operatorname{trace}\!\left(\mathbf{A}\sum_i a_i\mathbf{r}_i\mathbf{b}_i^\mathsf{T}\right) = \operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T}),
$$

defining the **attitude profile matrix** $\mathbf{B}=\sum_i a_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$ (so $\mathbf{B}^\mathsf{T}=\sum_i a_i\mathbf{r}_i\mathbf{b}_i^\mathsf{T}$, matching the line above). Wahba's problem is therefore

$$
\hat{\mathbf{A}} = \arg\max_{\mathbf{A}\in SO(3)}\ \operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T}) .
$$

::: key Attitude profile matrix
$\mathbf{B}=\sum_i a_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$, a $3\times3$ matrix built once from all the data. Minimizing the Wahba cost equals maximizing $\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$; every solver in the next lesson is a different way of doing that maximization.
:::

::: example The identity, checked on real vector geometry
A CubeSat's sun sensor and magnetometer see, in the inertial frame, the Sun near the equinox and the local geomagnetic field direction, at $74.5^\circ$ separation:

```python
import numpy as np

def dcm_from_axis_angle(axis, angle):
    axis = axis / np.linalg.norm(axis)
    K = np.array([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    return np.eye(3) + np.sin(angle) * K + (1 - np.cos(angle)) * (K @ K)

A_true = dcm_from_axis_angle(np.array([0.3, -0.5, 0.8]), np.radians(32.0))
r_sun = np.array([0.7660, 0.6428, 0.0])
r_mag = np.array([0.2050, 0.1720, 0.9636])
r_sun, r_mag = r_sun / np.linalg.norm(r_sun), r_mag / np.linalg.norm(r_mag)
b_sun, b_mag = A_true @ r_sun, A_true @ r_mag             # noiseless body observations

a = (1.0, (0.05 / 0.2) ** 2)                                # sun sensor 4x more accurate
B = a[0] * np.outer(b_sun, r_sun) + a[1] * np.outer(b_mag, r_mag)

for label, A in (("truth", A_true), ("40 deg off about b_sun", dcm_from_axis_angle(b_sun, np.radians(40)) @ A_true)):
    cost = 0.5 * (a[0] * np.sum((b_sun - A @ r_sun) ** 2) + a[1] * np.sum((b_mag - A @ r_mag) ** 2))
    print(f"{label:25s} trace(A B^T) = {np.trace(A @ B.T):.4f}   sum(a)-trace = {sum(a)-np.trace(A@B.T):.4f}   actual cost = {cost:.4f}")
# truth                     trace(A B^T) = 1.0625   sum(a)-trace = 0.0000   actual cost = 0.0000
# 40 deg off about b_sun    trace(A B^T) = 0.4593   sum(a)-trace = 0.6032   actual cost = 0.6032
```

$\sum a_i-\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$ matches the directly computed cost to every digit shown, at the truth and away from it — the identity holds exactly, not approximately, and the true attitude is exactly the one achieving the maximum possible trace, $\sum a_i=1.0625$, with zero cost on noiseless data.
:::

## How many vectors does it take?

$SO(3)$ has three degrees of freedom. A single unit-vector pair supplies only two independent constraints — a direction on a sphere has two degrees of freedom, not three — so one pair alone cannot pin an attitude down completely: the rotation about the observed vector's own axis is free to be anything at all, contributing nothing to the cost whichever value it takes.

::: example The rotation that stays hidden
Using only the sun-sensor pair from the previous example, apply an arbitrary extra rotation about $\mathbf{b}_{\mathrm{sun}}$ itself after the true attitude, and check the cost of matching $\mathbf{b}_{\mathrm{sun}}$ alone:

```python
for extra_deg in (0, 40, 137, 250):
    A_c = dcm_from_axis_angle(b_sun, np.radians(extra_deg)) @ A_true
    cost_sun_only = 0.5 * np.sum((b_sun - A_c @ r_sun) ** 2)
    print(f"extra spin {extra_deg:4d} deg about b_sun: cost on r_sun alone = {cost_sun_only:.2e}   predicted b_mag = {np.round(A_c @ r_mag, 3)}")
# extra spin    0 deg about b_sun: cost on r_sun alone = 0.00e+00   predicted b_mag = [-0.123  0.021  0.992]
# extra spin   40 deg about b_sun: cost on r_sun alone = 9.24e-33   predicted b_mag = [ 0.486 -0.188  0.853]
# extra spin  137 deg about b_sun: cost on r_sun alone = 2.00e-32   predicted b_mag = [ 0.853  0.117 -0.509]
# extra spin  250 deg about b_sun: cost on r_sun alone = 3.74e-33   predicted b_mag = [-0.640  0.688 -0.342]
```

Every one of these four rotations reproduces $\mathbf{b}_{\mathrm{sun}}$ exactly — the cost is zero to machine precision regardless of the extra spin — and yet they predict four different values for where the magnetometer vector should point, confirming they are four genuinely different attitudes, not numerical duplicates of one. This is lesson eight's observability idea in a new setting: rotation about the observed vector is a direction in attitude space a single vector cannot see, exactly as a design matrix missing a column direction cannot see the state combination that column would have informed.

A second, non-parallel reference vector removes the ambiguity — two vectors give up to four constraints for three unknowns — but only if the two are genuinely non-parallel. Repeat the same extra-spin test with a second reference vector placed closer and closer to $\mathbf{r}_{\mathrm{sun}}$:

| Separation between $\mathbf{r}_1,\mathbf{r}_2$ | Cost at $+30^\circ$ spurious spin |
| --- | --- |
| $74.5^\circ$ | $7.78\times10^{-3}$ |
| $5.0^\circ$ | $6.36\times10^{-5}$ |
| $0.1^\circ$ | $2.55\times10^{-8}$ |

The second vector never stops constraining the spurious spin exactly — the cost is never zero for $\mathrm{separation}>0$ — but as the two reference vectors approach parallel, the penalty for an incorrect rotation about the shared axis shrinks toward zero, and the problem behaves more and more like the single-vector case above: technically observable, practically indistinguishable from unobservable once noise is added. This is the same mechanism, in $SO(3)$ instead of $\mathbb{R}^n$, as two nearly parallel columns of a design matrix, and the next two lessons show exactly how much it costs a real solver.
:::

::: warning A unit vector is worth two constraints, not three
It is tempting to count "one vector observation" as "one measurement" the way a scalar range or a scalar bias was earlier in this module, and conclude that three unit-vector observations vastly over-determine three rotational unknowns. Each unit vector observation is two-dimensional, not one, because a unit vector's own length carries no information — but two non-parallel vectors, not three, are already enough in principle, and three add robustness against noise and a single bad sensor rather than closing a gap that two genuinely non-parallel vectors leave open.
:::

## Check yourself

::: check
Starting from $\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2$, show it equals $2-2\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i$, and say which two facts about $\mathbf{A}$ and the vectors make the simplification possible.
:::

::: answer
Expand: $\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2 = \mathbf{b}_i^\mathsf{T}\mathbf{b}_i - 2\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i + (\mathbf{A}\mathbf{r}_i)^\mathsf{T}(\mathbf{A}\mathbf{r}_i)$. The first term is $\lVert\mathbf{b}_i\rVert^2=1$ because $\mathbf{b}_i$ is a unit vector. The last term is $\mathbf{r}_i^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{r}_i=\mathbf{r}_i^\mathsf{T}\mathbf{r}_i=1$ because $\mathbf{A}$ is orthogonal ($\mathbf{A}^\mathsf{T}\mathbf{A}=\mathbf{I}$) and $\mathbf{r}_i$ is a unit vector. Both terms being fixed at $1$ leaves $2-2\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i$.
:::

::: check
Why does maximizing $\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$ only need $\mathbf{B}$, a single $3\times3$ matrix, rather than the full list of every $\mathbf{b}_i$ and $\mathbf{r}_i$ separately?
:::

::: answer
Every $\mathbf{b}_i,\mathbf{r}_i,a_i$ enters the cost only through the sum $\mathbf{B}=\sum_i a_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$; once $\mathbf{B}$ is formed, the individual measurements can be discarded and the optimization proceeds from $\mathbf{B}$ alone. This is the attitude analogue of the information matrix from lesson two: many measurements compress losslessly, for the purpose of finding $\hat{\mathbf{A}}$, into one fixed-size object.
:::

::: check
With exactly one vector pair, describe the full set of rotations that achieve zero Wahba cost, geometrically.
:::

::: answer
Every rotation of the form $\mathbf{R}(\mathbf{b}_i,\theta)\,\mathbf{A}_{\mathrm{true}}$ for any angle $\theta$, where $\mathbf{R}(\mathbf{b}_i,\theta)$ is a rotation about the axis $\mathbf{b}_i$ itself: applying $\mathbf{A}_{\mathrm{true}}$ first sends $\mathbf{r}_i$ to $\mathbf{b}_i$, and any subsequent rotation about $\mathbf{b}_i$ leaves $\mathbf{b}_i$ fixed, so the composite still sends $\mathbf{r}_i$ to $\mathbf{b}_i$ exactly. This is a one-parameter family — a full circle of equally valid attitudes — geometrically the statement that rotation about the observed direction is completely unconstrained by that one observation.
:::

::: check
Two reference vectors are separated by only $0.1^\circ$. Is the Wahba problem with these two vectors technically well-posed? Is it a good idea to rely on it in practice?
:::

::: answer
Technically yes: for any separation greater than $0^\circ$, the two vectors are not parallel, a unique minimizer exists, and the problem is well-posed in the strict mathematical sense. In practice it is a poor idea, because the cost's sensitivity to rotation about the shared near-axis is proportional to how far from parallel the two vectors are, and at $0.1^\circ$ that sensitivity is small enough that ordinary sensor noise will dominate it completely — mathematically observable and practically unobservable are different questions, and the second one is what an engineer actually needs answered.
:::

::: check
A star tracker reports three star directions instead of two. Using this lesson's degree-of-freedom count, explain why this is more than the minimum needed, and name one reason it is still worth having beyond redundancy against a single bad measurement.
:::

::: answer
Two non-parallel unit vectors already supply four constraints for three unknowns, so a third is not needed to make the problem well-posed; three vectors give six constraints for three unknowns, three more than the minimum. Beyond guarding against one bad star identification, a third vector improves the *geometry* — if the first two happen to be closer to parallel than ideal, a third at a different orientation can restore the conditioning the near-parallel pair alone would have lacked, exactly as an added measurement fixed the observability problem in lesson eight.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{b}_i, \mathbf{r}_i$ | Unit vector observed in the body frame; same physical direction, known in the reference frame |
| $\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)}\tfrac12\sum_i a_i\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2$ | The Wahba problem; orthogonal Procrustes restricted to proper rotations |
| $\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2 = 2-2\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i$ | Unit vectors and an orthogonal $\mathbf{A}$ collapse the squared error |
| $\mathbf{B}=\sum_i a_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$ | Attitude profile matrix; compresses every measurement losslessly |
| $\hat{\mathbf{A}} = \arg\max_{\mathbf{A}\in SO(3)}\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$ | Equivalent trace-maximization form every solver works from |
| One vector | Two constraints; leaves rotation about it completely free |
| Two non-parallel vectors | Four constraints for three unknowns; well-posed, but weak if nearly parallel |

The next lesson takes $\mathbf{B}$ from a definition to a computation: five different ways of finding the $\mathbf{A}$ that maximizes $\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$, from a two-vector construction that needs no optimization at all to the eigenvalue problem flown on most operational spacecraft.
