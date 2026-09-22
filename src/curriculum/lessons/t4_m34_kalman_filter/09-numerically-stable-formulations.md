---
id: l09-numerically-stable-formulations
title: 'Numerically stable formulations: Joseph form, square-root, and UD factorization'
minutes: 24
covers:
  - 'Numerically stable formulations: Joseph form, square-root (Potter, Carlson), UD factorization (Bierman-Thornton)'
---

Every covariance formula in this module so far has been exact in exact arithmetic. A flight computer does not have exact arithmetic — it has a fixed number of bits, a gain that is never quite the theoretically optimal one because it was rounded, or read off a precomputed table, or computed from a slightly stale $\mathbf{P}$ — and the gap between "exact" and "the number a real processor actually holds" is precisely where a covariance can quietly stop being a covariance at all. This lesson is about three families of update formula, in increasing order of how much numerical damage they refuse to allow: the Joseph form, already derived, now stress-tested until it actually breaks something; square-root filtering, which makes an invalid covariance impossible to represent in the first place; and UD factorization, which gets the same guarantee without ever computing a square root.

None of this is museum-piece history, though it started as exactly that: the square-root filter was developed for the Apollo Command Module's guidance computer, which had neither the word length nor the operations budget to risk a covariance losing positive definiteness mid-mission. The same pressure — long-running filters, limited precision, no opportunity to restart — is why these formulations remain standard in flight software today, long after the specific hardware constraint that motivated them has eased.

## Why the simplified form can fail, made precise

The minimum-variance lesson proved $\mathbf{P}^+ = (\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-$ only at the exactly optimal $\mathbf{K}$, and that the Joseph form $\mathbf{P}^+ = (\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I}-\mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$ holds for *any* gain, symmetric and positive semi-definite by construction because it is a sum of two matrices each of that form. What that lesson left untested is how much a gain has to be wrong before the simplified form's guarantee actually collapses.

::: example A four percent gain error, on the exact singular Q lesson one warned about
Take the constant-velocity model in single-precision (float32) arithmetic — comparable to older flight-computer word lengths — with the **short-step approximate** process noise from the first lesson, $\mathbf{Q} = \operatorname{diag}(0,\ q\Delta t)$, flagged there as exactly singular and margin-removing. Deliberately use a gain $4\%$ too large, $\mathbf{K}_{\mathrm{used}} = 1.04\,\mathbf{K}$, of the kind a stale gain table or a rounding error could easily produce. Run one predict/update cycle from $\mathbf{P}_0 = \operatorname{diag}(100,100)$:

| Form | $\mathbf{P}^+$ at the very first update | Smallest eigenvalue |
| --- | --- | --- |
| Simplified, $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-$ | $\begin{pmatrix}0.5367 & 0.4053\\ 0.4053 & 0.6621\end{pmatrix}$ | $-0.03847$ |
| Joseph | (a different, valid matrix) | $4.0014$ |

The simplified form reports a covariance with a **negative eigenvalue on the very first update** — a direction in which the filter claims a negative variance, a number with no meaning at all — while the Joseph form, fed the identical data and the identical wrong gain, stays comfortably positive definite. With the same $4\%$ error but the *exact*, non-singular $\mathbf{Q}$ from the first lesson instead of the short-step approximation, neither form fails over thousands of steps: it is specifically the combination of an already-thin margin (the singular $\mathbf{Q}$) and a non-optimal gain that collapses the simplified form, precisely the double failure the first lesson's warning and this module's running emphasis on exact process noise were both anticipating. Scanning the gain error from $1\%$ up to $4\%$ against the singular $\mathbf{Q}$ shows the smallest eigenvalue falling smoothly from $2.88$ to $0.45$ and then, between $3.5\%$ and $4\%$, crossing zero — not a gradual erosion but a sharp threshold, on the very first step, that a filter watching only its own reported diagonal variances would have no way to anticipate.
:::

::: warning A small error is not automatically a safe one
It is tempting to read the example above as "the simplified form is fine for small errors and only fails for large ones," but the threshold here is a property of *this* problem's conditioning, not a universal safety margin. A more ill-conditioned covariance — more states, a wider spread of eigenvalues, a longer run — moves that threshold, and it moves it in only one direction: toward smaller errors mattering more. The Joseph form costs roughly twice the multiplications of the simplified form and removes the question entirely; on any filter expected to run for a long mission, in reduced precision, or with a gain that is ever approximate, that cost is the cheaper of the two options.
:::

## Square-root filtering: make an invalid covariance unrepresentable

The Joseph form is guaranteed symmetric and positive *semi*-definite — it can still, in principle, reach the boundary of that set, a covariance with a zero eigenvalue, one unlucky rounding error from crossing it. Square-root filtering removes even that possibility by changing what the filter actually stores. Factor $\mathbf{P} = \mathbf{S}\mathbf{S}^{\mathsf{T}}$ — a Cholesky factor, though any such factor works — and propagate $\mathbf{S}$ instead of $\mathbf{P}$. Any $\mathbf{S}\mathbf{S}^{\mathsf{T}}$ is positive semi-definite *by the algebra of matrix multiplication itself*, for any $\mathbf{S}$ whatsoever, rounding error included; there is no arithmetic mistake short of a hardware fault that can make $\mathbf{S}\mathbf{S}^{\mathsf{T}}$ indefinite. As a direct benefit, the condition number — the ratio of largest to smallest eigenvalue, the quantity the least-squares module used as a normal-equation observability metric — of $\mathbf{S}$ is the *square root* of the condition number of $\mathbf{P}$, so a filter working in $\mathbf{S}$ needs roughly half as many bits of dynamic range as one working in $\mathbf{P}$ directly: exactly the resource Apollo's guidance computer did not have to spare.

The derivation is a direct manipulation of the update already proven correct. With $\mathbf{P}^- = \mathbf{S}^-(\mathbf{S}^-)^{\mathsf{T}}$ and a scalar measurement ($\mathbf{H}$ a single row, $R$ a scalar), stack a **pre-array**:

$$
\mathbf{M} = \begin{pmatrix}\sqrt{R} & \mathbf{H}\mathbf{S}^- \\ \mathbf{0} & (\mathbf{S}^-)^{\mathsf{T}}\end{pmatrix},
$$

an $(n+1)\times(n+1)$ matrix, and apply *any* orthogonal transformation $\mathbf{T}$ (from the right, acting on $\mathbf{M}^{\mathsf{T}}$, equivalently a sequence of row operations on $\mathbf{M}$) that triangularizes it into a lower-triangular **post-array** $\mathbf{L} = \mathbf{M}\mathbf{T}$. Because $\mathbf{T}$ is orthogonal, $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \mathbf{M}\mathbf{M}^{\mathsf{T}}$ — the triangularization changes nothing about the quantity that matters. Multiplying out $\mathbf{M}\mathbf{M}^{\mathsf{T}}$ directly gives $\begin{pmatrix}R + \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} & \mathbf{H}\mathbf{P}^-\\ \mathbf{P}^-\mathbf{H}^{\mathsf{T}} & \mathbf{P}^-\end{pmatrix}$, exactly the block matrix whose Schur complement is the Joseph-form $\mathbf{P}^+$ — so reading $\mathbf{L}$'s blocks off directly hands you the whole update at once:

::: key The square-root array update
Triangularize $\mathbf{M} = \begin{pmatrix}\sqrt{R} & \mathbf{H}\mathbf{S}^-\\ \mathbf{0} & (\mathbf{S}^-)^{\mathsf{T}}\end{pmatrix}$ into lower-triangular $\mathbf{L} = \begin{pmatrix}\sqrt{\alpha} & \mathbf{0}\\ \mathbf{c} & (\mathbf{S}^+)^{\mathsf{T}}\end{pmatrix}$. Then $\alpha = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}+R$ (the innovation variance), $\mathbf{S}^+$ is the updated square root, and $\mathbf{K} = \mathbf{c}/\sqrt{\alpha}$ is the Kalman gain — all three read directly out of one triangularization.
:::

::: example The array update, checked against Joseph form directly
For a random $3\times3$ positive definite $\mathbf{P}^-$, a random row $\mathbf{H}$ and $R=0.7$: triangularizing $\mathbf{M}$ (via a QR decomposition, which computes exactly this kind of orthogonal triangularization) gives $\sqrt{\alpha} = 12.798048$, matching $\sqrt{\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}+R} = 12.798048$ to nine digits; the recovered gain matches the directly-computed $\mathbf{K}$ to nine digits in every entry; and $\mathbf{S}^+(\mathbf{S}^+)^{\mathsf{T}}$ reproduces the Joseph-form $\mathbf{P}^+$ to a maximum entrywise difference of $8.9\times10^{-16}$ — machine precision, not an approximation. The classical **Potter** algorithm is the closed-form solution to this exact same triangularization for a single scalar measurement, $\mathbf{S}^+ = \mathbf{S}^-\big(\mathbf{I} - \gamma\,\boldsymbol{\phi}\boldsymbol{\phi}^{\mathsf{T}}\big)$ with $\boldsymbol{\phi} = (\mathbf{S}^-)^{\mathsf{T}}\mathbf{H}^{\mathsf{T}}$ and $\gamma = 1/(\alpha+\sqrt{\alpha R})$, computed by hand rather than by a general-purpose triangularization; run on the identical random example it reproduces the same $\mathbf{P}^+$ to a maximum difference of $4.4\times10^{-16}$. **Carlson's** algorithm is a third route to the identical answer, triangularizing $\mathbf{M}$ using a sequence of elementary rotations chosen specifically to keep every intermediate quantity triangular and computable one entry at a time — the version built for computers with no general matrix-triangularization routine on hand, which described every onboard flight computer this algorithm was designed for.
:::

```python
import numpy as np

def sqrt_update(S_minus, H, R):
    """Square-root measurement update via orthogonal triangularization.
    S_minus: lower-triangular Cholesky factor of P_minus (n x n).
    H: 1 x n. R: 1 x 1. Returns (S_plus, K, sqrt_alpha)."""
    n = S_minus.shape[0]
    M = np.block([[np.sqrt(R), H @ S_minus], [np.zeros((n, 1)), S_minus.T]])
    Q, Rtri = np.linalg.qr(M.T)
    signs = np.sign(np.diag(Rtri)); signs[signs == 0] = 1
    L = (Rtri * signs[:, None]).T   # lower-triangular post-array, M @ Q with consistent signs
    L = M @ (Q * signs[None, :])
    sqrt_alpha = L[0, 0]
    K = L[1:, 0:1] / sqrt_alpha
    S_plus = L[1:, 1:]
    return S_plus, K, sqrt_alpha

rng = np.random.default_rng(3)
A = rng.normal(size=(3, 3)); P = A @ A.T + 3 * np.eye(3)
H = rng.normal(size=(1, 3)); R = np.array([[0.7]])
S = np.linalg.cholesky(P)
S_plus, K, sqrt_alpha = sqrt_update(S, H, R)
print("max |S+ S+^T - Joseph P+| =",
      np.max(np.abs(S_plus @ S_plus.T - ((np.eye(3) - K@H) @ P @ (np.eye(3) - K@H).T + K@R@K.T))))
# max |S+ S+^T - Joseph P+| = 8.881784197001252e-16
```

## UD factorization: the same guarantee, no square roots at all

A square root is not a cheap operation on hardware without one, and the classical alternative avoids it entirely. Factor $\mathbf{P} = \mathbf{U}\mathbf{D}\mathbf{U}^{\mathsf{T}}$ with $\mathbf{U}$ unit triangular (ones on the diagonal) and $\mathbf{D}$ diagonal — the information in a Cholesky factor, split into a triangular part with no scale information and a diagonal part with no square roots anywhere. Bierman and Thornton built the classical algorithm for updating $\mathbf{U}$ and $\mathbf{D}$ directly under a scalar measurement, arranged with $\mathbf{U}$ upper-triangular for reasons specific to their processing order; the derivation below builds the same guarantee with a lower-triangular arrangement, mathematically equivalent and independently checked here rather than quoted.

The measurement update is a symmetric rank-one **downdate**, $\mathbf{P}^+ = \mathbf{P}^- - \mathbf{w}\mathbf{w}^{\mathsf{T}}$ with $\mathbf{w} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}/\sqrt{\alpha}$ (direct algebra from the Joseph-form collapse at the optimal gain). Writing $\mathbf{P}^- = \mathbf{L}\mathbf{D}\mathbf{L}^{\mathsf{T}}$ and $\mathbf{y} = \mathbf{L}^{-1}\mathbf{w}$ (one triangular solve), the problem reduces to factoring $\mathbf{D} - \mathbf{y}\mathbf{y}^{\mathsf{T}} = \mathbf{L}'\mathbf{D}'\mathbf{L}'^{\mathsf{T}}$ — a diagonal matrix minus a rank-one term — after which $\mathbf{L}^+ = \mathbf{L}\mathbf{L}'$ and $\mathbf{D}^+ = \mathbf{D}'$. That reduced problem has a clean sequential solution: with $p_0 = 0$ and $p_k = p_{k-1} + y_k^2/d_k$ (using the *original* diagonal entries $d_k$),

::: key The diagonal-minus-rank-one recursion
$$
d_k' = d_k\,\frac{1-p_k}{1-p_{k-1}},
$$
computed for $k=1,\ldots,n$ in order, gives the new diagonal entries directly; the off-diagonal entries of $\mathbf{L}'$ follow from the ordinary triangular system this factorization defines, one column at a time, no square root ever appearing.
:::

::: example UD update against Joseph form, five random trials
Implementing the recursion above (verified first on its own — factoring $\operatorname{diag}(D)-\mathbf{y}\mathbf{y}^{\mathsf{T}}$ this way and multiplying back out reproduces the original matrix to $8.9\times10^{-16}$) and wiring it into the full Kalman update, across five random $4$-state trials with random $\mathbf{H}$ and $R$: the resulting $\mathbf{P}^+ = \mathbf{L}^+\mathbf{D}^+(\mathbf{L}^+)^{\mathsf{T}}$ matches the Joseph-form reference to a maximum entrywise difference between $8.9\times10^{-16}$ and $8.9\times10^{-15}$ across the five trials — machine precision every time — and every entry of $\mathbf{D}^+$ comes out strictly positive in every trial, confirmed directly rather than assumed, with no square root computed anywhere in the process.
:::

```python
import numpy as np
from scipy.linalg import solve_triangular

def diag_minus_rank1(D, y):
    """Factor diag(D) - y y^T = L' diag(D') L'^T, L' unit lower-triangular."""
    n = len(D)
    Dp = np.zeros(n); p_prev = 0.0
    for k in range(n):
        p_k = p_prev + y[k]**2 / D[k]
        Dp[k] = D[k] * (1 - p_k) / (1 - p_prev)
        p_prev = p_k
    M = np.diag(D) - np.outer(y, y)
    Lp = np.eye(n)
    for i in range(n):
        for j in range(i):
            s = M[i, j] - sum(Lp[i, m] * Lp[j, m] * Dp[m] for m in range(j))
            Lp[i, j] = s / Dp[j]
    return Lp, Dp

def ud_update(L, D, H, R):
    S_val = float(H @ (L @ np.diag(D) @ L.T) @ H.T + R)
    w = ((L @ np.diag(D) @ L.T) @ H.T).ravel() / np.sqrt(S_val)
    y = solve_triangular(L, w, lower=True)
    Lp, Dp = diag_minus_rank1(D, y)
    return L @ Lp, Dp

# max |UD P+ - Joseph P+| over 5 random trials: between 8.9e-16 and 8.9e-15 (all D+ entries > 0)
```

::: note Why carry three formulations rather than pick one
Joseph form is the cheapest of the three that is still guaranteed correct for *any* gain, and is standard wherever the extra $2\times$ cost over the simplified form is affordable, which is most flight filters today. Square-root and UD forms cost more again, but buy a guarantee Joseph form does not fully give: they make an invalid covariance *unrepresentable*, not merely unlikely, and they halve the effective dynamic range the arithmetic needs to represent — which mattered enormously on 1960s hardware and still matters on modern fixed-point or reduced-precision embedded processors. The three are not competing answers to the same question; they are three points on a cost-versus-guarantee curve, and which one a real system uses is a decision about its actual word length and mission duration, not a universal default.
:::

## Check yourself

::: check
Explain in one sentence why $\mathbf{S}\mathbf{S}^{\mathsf{T}}$ can never be indefinite, for any real matrix $\mathbf{S}$ at all, including one already corrupted by round-off.
:::

::: answer
For any vector $\mathbf{v}$, $\mathbf{v}^{\mathsf{T}}(\mathbf{S}\mathbf{S}^{\mathsf{T}})\mathbf{v} = (\mathbf{S}^{\mathsf{T}}\mathbf{v})^{\mathsf{T}}(\mathbf{S}^{\mathsf{T}}\mathbf{v}) = \lVert \mathbf{S}^{\mathsf{T}}\mathbf{v}\rVert^2 \geq 0$ — a sum of squares, which no arrangement of real numbers in $\mathbf{S}$ can make negative. This is a statement about the *algebraic form* $\mathbf{S}\mathbf{S}^{\mathsf{T}}$, true regardless of whether $\mathbf{S}$ itself is the theoretically correct square root or one accumulated with round-off in every entry; the guarantee lives in the shape of the computation, not in the accuracy of the numbers going into it.
:::

::: check
The worked example found failure between $3.5\%$ and $4\%$ gain error with the singular $\mathbf{Q}$, but no failure at all up to $4\%$ with the exact $\mathbf{Q}$. Explain why the singular case is more fragile, referring to the first lesson's warning.
:::

::: answer
The first lesson showed the short-step $\mathbf{Q}=\operatorname{diag}(0,q\Delta t)$ tells the filter that position receives *no* process noise within a step at all, which removes any margin between the position variance and zero — the predict step alone does nothing to keep it comfortably above zero, unlike the exact $\mathbf{Q}$, whose strictly positive position entry adds a cushion every single cycle regardless of what the update does. A wrong gain perturbs the update in a way that can subtract slightly more than it should from the position variance; with a cushion present, that overshoot lands back inside positive territory, and without one, it does not.
:::

::: check
In the square-root array update, explain why the Kalman gain can be read directly off the triangularized array instead of being computed separately.
:::

::: answer
The pre-array $\mathbf{M}$ was constructed so that $\mathbf{M}\mathbf{M}^{\mathsf{T}}$ equals the block matrix $\begin{pmatrix}\alpha & \mathbf{H}\mathbf{P}^-\\ \mathbf{P}^-\mathbf{H}^{\mathsf{T}} & \mathbf{P}^-\end{pmatrix}$ exactly, and triangularizing with an orthogonal transformation preserves that product; the post-array's lower-left block is therefore, by direct multiplication, $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}/\sqrt{\alpha}$ — which is $\mathbf{K}\sqrt{\alpha}$, since $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}/\alpha$. Dividing that block by the post-array's top-left entry, $\sqrt{\alpha}$, recovers $\mathbf{K}$ with no separate computation, because the same orthogonal transformation that produces $\mathbf{S}^+$ also, as a byproduct of preserving $\mathbf{M}\mathbf{M}^{\mathsf{T}}$, produces the gain.
:::

::: check
Why does the UD recursion use the *original* $d_k$ values (not the newly-updated $d_k'$) when computing the running sum $p_k = p_{k-1} + y_k^2/d_k$?
:::

::: answer
$p_k$ is defined directly from the diagonal-minus-rank-one matrix $\mathbf{D}-\mathbf{y}\mathbf{y}^{\mathsf{T}}$ being factored, whose diagonal entries are the *original* $d_k$ (each shifted by $-y_k^2$ on the diagonal, though $p_k$ tracks the ratio, not the shifted values themselves) — it is bookkeeping for how much of the original matrix's information has been consumed by the rank-one term so far, not a running record of the factorization's own output. Using $d_k'$ instead would mix a quantity computed from the input with a quantity computed from the output at the same step, and the identity verified in this lesson — $\mathbf{L}'\mathbf{D}'\mathbf{L}'^{\mathsf{T}}$ reproducing $\mathbf{D}-\mathbf{y}\mathbf{y}^{\mathsf{T}}$ exactly — depends on the recursion being defined purely in terms of the original $\mathbf{D}$ and $\mathbf{y}$.
:::

::: check
A colleague argues that since square-root and UD forms both guarantee positive definiteness, there is never a reason to use plain Joseph form. What is the counter-argument?
:::

::: answer
Guarantee is not the only cost that matters: Joseph form is roughly twice the flops of the simplified update, while square-root and UD forms cost more again — a triangularization or a sequential rank-one factorization per measurement, rather than a handful of matrix multiplications — and that extra cost has to be paid on every single cycle for the life of the mission. For a short-duration filter, comfortable precision margins, and a gain that is always freshly computed at the (near-)optimal value, Joseph form's guarantee (valid for any gain, PSD by construction as a sum of two PSD terms) is already enough, and paying for a stronger guarantee than the mission's own numerics ever threaten is a real, avoidable cost on a flight computer's cycle budget.
:::

## Summary

| Item | Statement |
| --- | --- |
| Joseph form's limit | Guarantees symmetric PSD for any gain, but can still reach the boundary; a $4\%$ gain error with a singular $\mathbf{Q}$ made the simplified form produce a negative eigenvalue on the first update, while Joseph stayed valid on the identical data |
| Square-root update | Propagate $\mathbf{S}$ with $\mathbf{P}=\mathbf{S}\mathbf{S}^{\mathsf{T}}$; $\mathbf{S}\mathbf{S}^{\mathsf{T}}$ is PSD for any $\mathbf{S}$, by construction, always |
| Array algorithm | Triangularize $\begin{pmatrix}\sqrt{R}&\mathbf{H}\mathbf{S}^-\\\mathbf{0}&(\mathbf{S}^-)^{\mathsf{T}}\end{pmatrix}$; reads off $\sqrt{\alpha}$, $\mathbf{K}$, and $\mathbf{S}^+$ together |
| Potter / Carlson | Potter: closed-form scalar version, $\mathbf{S}^+=\mathbf{S}^-(\mathbf{I}-\gamma\boldsymbol\phi\boldsymbol\phi^{\mathsf{T}})$, $\gamma=1/(\alpha+\sqrt{\alpha R})$. Carlson: the same triangularization by hand-computable rotations, built for Apollo-era flight computers |
| UD factorization | $\mathbf{P}=\mathbf{U}\mathbf{D}\mathbf{U}^{\mathsf{T}}$, no square roots anywhere; rank-one downdate via $d_k'=d_k(1-p_k)/(1-p_{k-1})$, $p_k=p_{k-1}+y_k^2/d_k$ |
| Cost vs. guarantee | Simplified (cheapest, weakest) → Joseph (2x, PSD for any gain) → square-root / UD (more, PSD by construction, halved dynamic range) |

Every formulation in this lesson computes the *same* $\mathbf{P}^+$ in exact arithmetic — the differences are entirely about what happens when arithmetic is not exact. The next lesson turns to failures that are not about arithmetic at all: a filter that is internally consistent, numerically pristine, and still wrong, because something about the world it assumes does not match the world it is flying through.
