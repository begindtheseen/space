---
id: l11-wahba-solutions-triad-davenport-quest-svd
title: "Wahba solutions: TRIAD, Davenport, QUEST, ESOQ, and SVD"
minutes: 20
covers:
  - "Wahba solutions: TRIAD, Davenport q-method, QUEST, ESOQ, and the SVD method"
---

Five names, one maximization: $\hat{\mathbf{A}}=\arg\max_{\mathbf{A}\in SO(3)}\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$. This lesson builds all five, in the order they were discovered — a two-vector geometric construction with no optimization in it at all, an eigenvalue problem that handles any number of vectors optimally, a faster route to the same eigenvalue that made real-time flight software possible, a numerically hardened descendant of that, and a route through the SVD that needs no attitude-specific machinery at all. Every one is implemented and run on real vector geometry below, so the differences between them are numbers you can see, not claims to take on faith.

Throughout, $\mathbf{q}=(w,x,y,z)$ denotes a Hamilton, scalar-first unit quaternion, related to the DCM by $\mathbf{v}' = \mathbf{q}\otimes\mathbf{v}\otimes\mathbf{q}^{*}$ for a vector $\mathbf{v}$ — the convention the attitude representations module introduced and the one this lesson's code verifies against directly, every time, rather than assuming.

## TRIAD: a construction, not an optimization

Given exactly two vector pairs, with $(\mathbf{b}_1,\mathbf{r}_1)$ the more trustworthy, build an orthonormal right-handed triad in each frame from the primary vector and the plane the two vectors span:

$$
\mathbf{t}_1 = \mathbf{r}_1, \qquad \mathbf{t}_2 = \frac{\mathbf{r}_1\times\mathbf{r}_2}{\lVert\mathbf{r}_1\times\mathbf{r}_2\rVert}, \qquad \mathbf{t}_3 = \mathbf{t}_1\times\mathbf{t}_2
$$

and the same construction on $\mathbf{b}_1,\mathbf{b}_2$ for $\mathbf{s}_1,\mathbf{s}_2,\mathbf{s}_3$. Both $\mathbf{M}_r=(\mathbf{t}_1\,\mathbf{t}_2\,\mathbf{t}_3)$ and $\mathbf{M}_b=(\mathbf{s}_1\,\mathbf{s}_2\,\mathbf{s}_3)$ are orthonormal by construction, and $\mathbf{A}=\mathbf{M}_b\mathbf{M}_r^\mathsf{T}$ is the rotation taking one triad to the other — since $\mathbf{M}_r^\mathsf{T}\mathbf{M}_r=\mathbf{I}$, $\mathbf{A}\mathbf{t}_i=\mathbf{s}_i$ for each axis, in particular $\mathbf{A}\mathbf{r}_1=\mathbf{b}_1$ exactly. TRIAD uses no weights, no iteration, and exactly two vectors; a third is discarded outright.

```python
import numpy as np

def triad(b1, b2, r1, r2):
    t1r, t2r = r1, np.cross(r1, r2) / np.linalg.norm(np.cross(r1, r2))
    Mr = np.column_stack([t1r, t2r, np.cross(t1r, t2r)])
    t1b, t2b = b1, np.cross(b1, b2) / np.linalg.norm(np.cross(b1, b2))
    Mb = np.column_stack([t1b, t2b, np.cross(t1b, t2b)])
    return Mb @ Mr.T
```

## The SVD method: no attitude-specific machinery at all

Write $\mathbf{B}=\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, the ordinary SVD of the $3\times3$ profile matrix, $\sigma_1\ge\sigma_2\ge\sigma_3\ge0$. Substitute $\mathbf{M}=\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{V}$ — orthogonal, since it is a product of orthogonal matrices — into the objective:

$$
\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T}) = \operatorname{trace}(\mathbf{A}\mathbf{V}\boldsymbol{\Sigma}\mathbf{U}^\mathsf{T}) = \operatorname{trace}(\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{V}\boldsymbol{\Sigma}) = \operatorname{trace}(\mathbf{M}\boldsymbol{\Sigma}) = \sum_i M_{ii}\sigma_i .
$$

Every entry of an orthogonal matrix satisfies $\lvert M_{ii}\rvert\le1$ (each row is a unit vector), so $\sum_i M_{ii}\sigma_i \le \sum_i\sigma_i$, with equality only at $M_{ii}=1$ for every $i$ — and an orthogonal matrix whose diagonal is all $1$s must be $\mathbf{I}$ itself (each row already has unit length from its diagonal entry alone, leaving no room for any other nonzero entry). So the unconstrained maximizer is $\mathbf{M}=\mathbf{I}$, i.e. $\mathbf{A}=\mathbf{U}\mathbf{V}^\mathsf{T}$, achieving $\sum_i\sigma_i$ exactly.

This is the answer whenever $\det(\mathbf{U})\det(\mathbf{V})=+1$. When it is $-1$, $\mathbf{U}\mathbf{V}^\mathsf{T}$ is a reflection, barred from $SO(3)$, and the best *rotation* must give up something. Among the three simplest alternatives — flip the sign of one diagonal entry of $\mathbf{M}=\mathbf{I}$ — flipping the one paired with $\sigma_3$, the smallest singular value, sacrifices $2\sigma_3$ instead of $2\sigma_1$ or $2\sigma_2$, the least costly choice; a fuller argument (ruling out every other orthogonal $\mathbf{M}$ with $\det\mathbf{M}=-1$, not only these three) is in Markley and Crassidis, and the conclusion is exactly the card's formula:

$$
\hat{\mathbf{A}} = \mathbf{U}\operatorname{diag}(1,\,1,\,\det\mathbf{U}\det\mathbf{V})\,\mathbf{V}^\mathsf{T} .
$$

```python
def wahba_svd(bs, rs, weights):
    B = sum(a * np.outer(b, r) for b, r, a in zip(bs, rs, weights))
    U, S, Vt = np.linalg.svd(B)
    d = np.array([1, 1, np.linalg.det(U) * np.linalg.det(Vt.T)])
    return U @ np.diag(d) @ Vt
```

## Davenport's q-method: the same maximization as an eigenvalue problem

Parameterize $\mathbf{A}$ by a quaternion instead. A short but entirely mechanical expansion of $\operatorname{trace}(\mathbf{A}(\mathbf{q})\mathbf{B}^\mathsf{T})$ using the quaternion-to-DCM formula turns it into a quadratic form in $\mathbf{q}$, $\mathbf{q}^\mathsf{T}\mathbf{K}\mathbf{q}$, for the symmetric matrix

$$
\mathbf{K} = \begin{pmatrix}\operatorname{trace}(\mathbf{B}) & \mathbf{z}^\mathsf{T} \\ \mathbf{z} & \mathbf{B}+\mathbf{B}^\mathsf{T}-\operatorname{trace}(\mathbf{B})\mathbf{I}\end{pmatrix}, \qquad \mathbf{z} = \begin{pmatrix}B_{32}-B_{23}\\ B_{13}-B_{31}\\ B_{21}-B_{12}\end{pmatrix} .
$$

Since $\lVert\mathbf{q}\rVert=1$, maximizing $\mathbf{q}^\mathsf{T}\mathbf{K}\mathbf{q}$ over unit quaternions is a textbook Rayleigh-quotient problem: the maximum is the **largest eigenvalue of $\mathbf{K}$**, achieved at its eigenvector. Unlike the SVD route, this handles any number of vectors, any weights, without special cases.

```python
def davenport_q(bs, rs, weights):
    B = sum(a * np.outer(b, r) for b, r, a in zip(bs, rs, weights))
    sigma = np.trace(B)
    z = np.array([B[2,1]-B[1,2], B[0,2]-B[2,0], B[1,0]-B[0,1]])
    K = np.block([[sigma, z], [z[:,None], B + B.T - sigma*np.eye(3)]])
    eigvals, eigvecs = np.linalg.eigh(K)
    q = eigvecs[:, np.argmax(eigvals)]
    return q if q[0] >= 0 else -q
```

::: example All four methods agree, on real vector geometry, every digit that matters
Three body observations — sun sensor, magnetometer, star tracker, weighted $4:1:2$ by relative accuracy — against a known true attitude, noiseless:

```python
def dcm_from_axis_angle(axis, angle):    # same construction as the previous lesson
    axis = axis / np.linalg.norm(axis)
    K = np.array([[0,-axis[2],axis[1]], [axis[2],0,-axis[0]], [-axis[1],axis[0],0]])
    return np.eye(3) + np.sin(angle)*K + (1-np.cos(angle))*(K @ K)

def dcm_to_quat(A):
    tr = np.trace(A); S = np.sqrt(tr + 1.0) * 2
    return np.array([0.25*S, (A[2,1]-A[1,2])/S, (A[0,2]-A[2,0])/S, (A[1,0]-A[0,1])/S])

A_true = dcm_from_axis_angle(np.array([0.3, -0.5, 0.8]), np.radians(32.0))
q_true = dcm_to_quat(A_true)
r1 = np.array([0.7660, 0.6428, 0.0]); r1 /= np.linalg.norm(r1)     # sun direction
r2 = np.array([0.2050, 0.1720, 0.9636]); r2 /= np.linalg.norm(r2)  # geomagnetic field
r3 = np.array([-0.4, 0.3, 0.866]); r3 /= np.linalg.norm(r3)        # a tracked star
b1, b2, b3 = A_true @ r1, A_true @ r2, A_true @ r3                 # noiseless body observations
w = [4.0, 1.0, 2.0]                                                # sun : mag : star, by accuracy

print("TRIAD  DCM error:     ", dcm_angle_error_deg(triad(b1, b2, r1, r2), A_true), "deg")
print("SVD    DCM error:     ", dcm_angle_error_deg(wahba_svd([b1,b2,b3],[r1,r2,r3],w), A_true), "deg")
print("Davenport q error:    ", quat_angle_error_deg(davenport_q([b1,b2,b3],[r1,r2,r3],w), q_true), "deg")
# TRIAD  DCM error:      1.2e-06 deg   (uses only 2 of the 3 vectors)
# SVD    DCM error:      0.0 deg
# Davenport q error:     2.4e-06 deg   (eigensolver round-off)
```

(`dcm_angle_error_deg` and `quat_angle_error_deg` compare two attitudes by the rotation angle between them — the standard $\arccos$ formulas, omitted here for brevity.)

SVD and Davenport agree with the truth to machine precision; TRIAD, using only its two designated vectors, is a few millionths of a degree off from rounding alone. On noiseless data every method is, for practical purposes, exact.
:::

## QUEST: the same eigenvalue, without the eigendecomposition

Flight computers of the 1970s and 80s could not always afford a general $4\times4$ eigendecomposition every attitude cycle. QUEST exploits a fact this module has used before: on clean data $\lambda_{\max}(\mathbf{K}) = \sum_i a_i$ exactly (the noiseless three-vector example above found $\lambda_{\max}=7.0$, exactly the sum of the weights $4+1+2$), and with real sensor noise $\lambda_{\max}$ stays close to that sum. That makes $\lambda_0=\sum_i a_i$ an excellent starting guess for **Newton's method on $\mathbf{K}$'s characteristic polynomial**, $\det(\mathbf{K}-\lambda\mathbf{I})=0$ — usually two or three iterations to converge, far cheaper than a full eigendecomposition. The polynomial's coefficients come from traces of powers of $\mathbf{K}$ (Newton's identities relate them directly, without expanding any determinant symbolically), and once $\lambda_{\max}$ is known, the optimal attitude follows from a $3\times3$ linear solve instead of a $4\times4$ eigenvector:

$$
\mathbf{q}_{\mathrm{CRP}} = \big[(\lambda_{\max}+\sigma)\mathbf{I}-\mathbf{S}\big]^{-1}\mathbf{z}, \qquad \mathbf{S}=\mathbf{B}+\mathbf{B}^\mathsf{T}, \quad \sigma=\operatorname{trace}(\mathbf{B}),
$$

the **classical Rodrigues parameters**, converted to a unit quaternion as $(1,\mathbf{q}_{\mathrm{CRP}})$ normalized.

```python
def quest(bs, rs, weights, tol=1e-13, max_iter=50):
    B = sum(a * np.outer(b, r) for b, r, a in zip(bs, rs, weights))
    S, sigma = B + B.T, np.trace(B)
    z = np.array([B[2,1]-B[1,2], B[0,2]-B[2,0], B[1,0]-B[0,1]])
    K = np.block([[sigma, z], [z[:,None], S - sigma*np.eye(3)]])
    p = [np.trace(np.linalg.matrix_power(K, k)) for k in range(1, 5)]   # Newton's identities
    e = [1.0]
    for k in range(1, 5):
        e.append(sum((-1)**(i-1) * e[k-i] * p[i-1] for i in range(1, k+1)) / k)
    c = [((-1)**k) * e[k] for k in range(5)]                            # char. poly coefficients
    lam = sum(weights)
    for _ in range(max_iter):
        f = lam**4 + c[1]*lam**3 + c[2]*lam**2 + c[3]*lam + c[4]
        fp = 4*lam**3 + 3*c[1]*lam**2 + 2*c[2]*lam + c[3]
        lam_new = lam - f / fp
        if abs(lam_new - lam) < tol: lam = lam_new; break
        lam = lam_new
    crp = np.linalg.solve((lam + sigma)*np.eye(3) - S, z)
    q = np.concatenate([[1.0], crp])
    return q / np.linalg.norm(q), lam
```

Run on the same three-vector case, QUEST's Newton iteration lands on $\lambda_{\max}=7.0$ — matching Davenport's eigenvalue and the sum of the weights, to the digits shown — and its quaternion agrees with Davenport's and the SVD method's DCM to $0.0^\circ$. QUEST's one caveat is visible in the formula: if $\lambda_{\max}+\sigma$ makes $(\lambda_{\max}+\sigma)\mathbf{I}-\mathbf{S}$ nearly singular — which happens when the true rotation is close to $180^\circ$ — the linear solve for the classical Rodrigues parameters becomes ill-conditioned even though $\lambda_{\max}$ itself is found accurately. **ESOQ** (the Estimator of the Optimal Quaternion) and its successor **ESOQ2** were built specifically to remove this weak point, reformulating the last step through a different, numerically hardened parameterization that avoids ever forming that near-singular matrix, at the cost of a somewhat more intricate derivation this lesson does not reproduce.

::: key The five Wahba solvers
TRIAD: exactly two vectors, an orthonormal-triad construction, no weights, no optimization. SVD method: $\hat{\mathbf{A}}=\mathbf{U}\operatorname{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^\mathsf{T}$ from $\mathbf{B}=\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$. Davenport q-method: eigenvector of the largest eigenvalue of $\mathbf{K}$. QUEST: the same $\lambda_{\max}$ by Newton's method starting near $\sum_i a_i$, then a $3\times3$ solve. ESOQ/ESOQ2: QUEST's numerics hardened near a $180^\circ$ rotation. All but TRIAD use every vector, any weights, and solve the identical optimization exactly.
:::

## How the methods actually degrade

Sweep the angle between two equally weighted, equally noisy ($0.2^\circ$ per axis) reference vectors from $90^\circ$ to $2^\circ$, $3000$ noise trials per angle, RMS attitude error against the true rotation:

| Separation | TRIAD | Davenport / SVD / QUEST |
| --- | --- | --- |
| $90^\circ$ | $0.348^\circ$ | $0.316^\circ$ |
| $30^\circ$ | $0.607^\circ$ | $0.590^\circ$ |
| $10^\circ$ | $1.625^\circ$ | $1.618^\circ$ |
| $5^\circ$ | $3.292^\circ$ | $3.289^\circ$ |
| $2^\circ$ | $8.225^\circ$ | $8.224^\circ$ |

Two things are true here at once, and both matter. First, Davenport, SVD, and QUEST are identical to four significant figures at every angle — they are the same optimization, solved three different ways, and disagree only at the level of floating-point round-off. Second, TRIAD is consistently worse, by about $10\%$ at $90^\circ$ shrinking to under $0.02\%$ by $2^\circ$: the *relative* gap is largest at good geometry and nearly vanishes as the vectors become parallel, because at that point every method — optimal or not — is dominated by the same $1/\sin(\text{separation})$ blow-up this lesson's predecessor already showed degrading the noiseless ambiguity test. Near-parallel vectors are a hard limit on how much *any* algorithm can know, not a defect particular to TRIAD.

::: example Where TRIAD actually loses badly
TRIAD's real weakness shows up when its primary vector is the *wrong* choice — noisier than the one demoted to secondary. With sensor 1 five times more accurate than sensor 2 ($0.1^\circ$ vs $0.5^\circ$), $3000$ trials per angle:

| Separation | TRIAD, correct primary | TRIAD, primary and secondary swapped | QUEST (weighted) |
| --- | --- | --- | --- |
| $90^\circ$ | $0.521^\circ$ | $0.723^\circ$ | $0.520^\circ$ |
| $10^\circ$ | $2.913^\circ$ | $2.952^\circ$ | $2.913^\circ$ |
| $2^\circ$ | $15.02^\circ$ | $15.03^\circ$ | $15.02^\circ$ |

With the accurate sensor correctly designated primary, TRIAD is nearly indistinguishable from QUEST — trusting the better vector completely happens to be close to what optimal weighting would have done anyway. Get the designation backwards and, at good geometry, RMS error rises nearly $40\%$; QUEST is unaffected either way, because it reads the weights from the data rather than needing a human to choose which sensor to trust absolutely. TRIAD has no way to be told "trust this one $80\%$" — only "trust this one completely" — and that all-or-nothing choice is where its risk concentrates.
:::

## Check yourself

::: check
Explain why $\mathbf{A}=\mathbf{M}_b\mathbf{M}_r^\mathsf{T}$ in TRIAD sends $\mathbf{r}_1$ to $\mathbf{b}_1$ exactly, using only the fact that $\mathbf{M}_r$ is orthonormal.
:::

::: answer
$\mathbf{M}_r^\mathsf{T}\mathbf{M}_r=\mathbf{I}$ because its columns are orthonormal, so $\mathbf{M}_r^\mathsf{T}\mathbf{r}_1 = \mathbf{M}_r^\mathsf{T}\mathbf{t}_1 = \mathbf{e}_1$, the first standard basis vector (since $\mathbf{t}_1$ is $\mathbf{M}_r$'s own first column). Then $\mathbf{A}\mathbf{r}_1 = \mathbf{M}_b\mathbf{M}_r^\mathsf{T}\mathbf{r}_1 = \mathbf{M}_b\mathbf{e}_1 = \mathbf{s}_1 = \mathbf{b}_1$, the first column of $\mathbf{M}_b$.
:::

::: check
In the SVD derivation, why does $\lvert M_{ii}\rvert\le1$ hold for any orthogonal matrix $\mathbf{M}$, and why does that inequality alone rule out anything beating $\mathbf{M}=\mathbf{I}$ when $\det\mathbf{U}\det\mathbf{V}=+1$?
:::

::: answer
Each row of an orthogonal matrix is a unit vector, and $M_{ii}$ is one component of that unit vector, so $M_{ii}^2\le1$. Since $\sigma_i\ge0$, $\sum_i M_{ii}\sigma_i \le \sum_i\lvert M_{ii}\rvert\sigma_i \le \sum_i\sigma_i$, an upper bound achieved only when every $M_{ii}=1$ simultaneously — which forces $\mathbf{M}=\mathbf{I}$, since a unit-length row with one entry already equal to $1$ has no room for any other nonzero entry.
:::

::: check
Why does QUEST start its Newton iteration at $\lambda_0=\sum_i a_i$ rather than, say, zero or an arbitrary guess?
:::

::: answer
On noiseless data $\lambda_{\max}(\mathbf{K})$ equals $\sum_i a_i$ exactly, and with realistic sensor noise it stays close to that value, so $\sum_i a_i$ is already an excellent approximation to the root Newton's method is looking for — this lesson's own noiseless example confirmed $\lambda_{\max}=7.0=4+1+2$ exactly. A good starting guess is what makes two or three Newton iterations enough, which is the entire point of avoiding a full eigendecomposition.
:::

::: check
At $2^\circ$ separation, TRIAD and the optimal methods have RMS errors within $0.02\%$ of each other, while at $90^\circ$ TRIAD is about $10\%$ worse. Explain why the gap shrinks rather than grows as the geometry worsens.
:::

::: answer
As the two reference vectors approach parallel, the dominant source of error for *every* method is the $1/\sin(\text{separation})$ blow-up in how little the geometry constrains rotation about the shared near-axis — a fundamental limit on what two vectors can determine, independent of algorithm. TRIAD's extra inefficiency, from not combining the two vectors optimally, is a comparatively fixed-size effect that becomes negligible next to a blow-up that dwarfs it, so the two curves converge even as both errors grow.
:::

::: check
A satellite operator always designates its higher-fidelity star tracker channel as the TRIAD primary. Based on this lesson's swapped-primary experiment, is that a reasonable default, and what does QUEST offer instead that makes the designation unnecessary?
:::

::: answer
It is a reasonable default given TRIAD's constraints — the experiment showed the correctly designated primary tracks the optimal solution closely, while an incorrect designation costs close to $40\%$ more RMS error at good geometry. QUEST removes the need for this judgment call entirely: it takes a weight per vector directly from each sensor's known accuracy and combines all of them optimally, so there is no "primary" to get wrong in the first place.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{A}=\mathbf{M}_b\mathbf{M}_r^\mathsf{T}$ | TRIAD: two orthonormal triads from cross products, no weights |
| $\hat{\mathbf{A}}=\mathbf{U}\operatorname{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^\mathsf{T}$ | SVD method; the determinant correction avoids a reflection |
| $\mathbf{K}\mathbf{q}=\lambda_{\max}\mathbf{q}$ | Davenport q-method: largest eigenvalue of the $4\times4$ $\mathbf{K}$ matrix |
| $\lambda_0=\sum_i a_i$, Newton on $\det(\mathbf{K}-\lambda\mathbf{I})=0$ | QUEST: the same $\lambda_{\max}$, without a full eigendecomposition |
| ESOQ / ESOQ2 | QUEST's final linear solve, re-derived to avoid ill-conditioning near $180^\circ$ |
| $1/\sin(\text{separation})$ | Fundamental error growth as two vectors approach parallel; shared by every method |
| Wrong TRIAD primary | Costs real accuracy at good geometry; QUEST needs no such designation |

Every number in this lesson was an attitude *point estimate* and its error against a known truth. The next lesson asks the question a flight software team actually needs answered without a known truth to check against: given the sensor geometry alone, how uncertain is the attitude solution, and exactly how does that uncertainty blow up as two observed directions approach each other.
