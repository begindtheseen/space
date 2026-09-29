---
id: l09-numerically-stable-formulations
title: 'Numerically stable formulations: Joseph form, square-root, and UD factorization'
minutes: 21
covers:
  - 'Numerically stable formulations: Joseph form, square-root (Potter, Carlson), UD factorization (Bierman-Thornton)'
---

Suppose you keep a notebook of the area of a square garden, and every week you adjust the number as the garden changes. Make enough small mistakes and one day you might write down an area of $-3\,\mathrm{m^2}$. That is nonsense — no garden has negative area — but nothing about the pencil stopped you. Now change one habit: write down the *length of the side* instead, and square it whenever you need the area. You can still make mistakes. But whatever number you write for the side, its square can never be negative. You have made the nonsense answer impossible to write down.

That is the idea behind this lesson. A covariance is like the area: it must never have a negative variance in any direction. Every covariance formula in this module so far is exact in exact arithmetic. A flight computer does not have exact arithmetic. It has a fixed number of **[[bits|word-length]]** per number, and a gain that is never quite the theoretically best one — because it was rounded, or read from a stored table, or computed from a slightly stale $\mathbf{P}$. In that gap between "exact" and "what the processor really holds", a covariance can quietly stop being a covariance.

This lesson covers three families of update formula, in order of how much damage they refuse to allow. The **Joseph form**, derived in the three-derivations lesson, is here pushed until the simpler formula breaks. **Square-root filtering** stores the "side length" instead of the "area", so an invalid covariance cannot even be represented. **UD factorization** gets the same guarantee without ever taking a square root. None of this is museum history. The square-root filter was developed at MIT in the early 1960s for **[[Apollo|apollo-agc]]** navigation, on a computer with very short numbers and no room for a covariance to go bad mid-mission. Long-running filters, limited precision and no chance to restart still make these formulations standard in flight software today.

## Why the simple update can fail

Start with one number, to see the mechanism with nothing hidden. For a scalar state measured directly, the simplified update is

$$
P^+ = (1 - K)P^-.
$$

With the best gain, $K = P^-/(P^- + R)$, which is always between $0$ and $1$, so $1 - K$ is positive and so is $P^+$. But suppose the gain in use is a little too big — big enough to pass $1$. Then $1 - K$ is negative, and the formula reports a negative variance. In words: a gain above $1$ means the filter moves its estimate *past* the measurement, and the simplified formula has no way to notice that this made things worse.

The Joseph form from the three-derivations lesson is the honest answer for *any* gain. In the scalar case it reads

$$
P^+ = (1 - K)^2 P^- + K^2 R.
$$

Both terms are squares times variances, so both are at least zero, whatever $K$ is. Overshoot the measurement and the Joseph form correctly reports *more* uncertainty, never a negative amount.

::: key Joseph form covariance update
$$
\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}
$$
is valid for *any* gain, and is symmetric and positive semi-definite by construction: it is a sum of two terms of the form $\mathbf{A}\mathbf{B}\mathbf{A}^{\mathsf{T}}$ with $\mathbf{B}$ a covariance. It costs roughly $2\times$ the flops of the simplified $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$, and is worth it in flight code.
:::

Here "positive semi-definite" means no direction has negative variance; "flops" counts the multiplications and additions the computer does.

::: example A four percent gain error on the first update
Use the constant-velocity model with $\Delta t = 0.1\,\mathrm{s}$, $q = 0.5$, a position measurement with $R = 4\,\mathrm{m^2}$, and a very uncertain start, $\mathbf{P}_0 = \operatorname{diag}(100, 100)$. Take the short-step process noise $\mathbf{Q} = \operatorname{diag}(0,\ q\Delta t)$ from the stochastic-model lesson. One predict step gives

$$
\mathbf{P}^-_1 = \begin{pmatrix}101 & 10\\ 10 & 100.05\end{pmatrix}.
$$

**The right gain.** $S = 101 + 4 = 105$, so the position gain is $K_p = 101/105 = 0.9619$. The filter trusts this first measurement almost completely, which is right: its prediction is far worse than the sensor.

**The wrong gain.** Now use a gain $4\%$ too large, $\mathbf{K}_{\mathrm{used}} = 1.04\,\mathbf{K}$ — the kind of error a stale gain table could produce. The position entry becomes $1.04 \times 0.9619 = 1.0004$. That is a hair past $1$.

**The two updates.** The simplified form gives position variance $(1 - 1.0004) \times 101 = -0.0385$:

| Form | $\mathbf{P}^+$ after the first update | Smallest eigenvalue |
| --- | --- | --- |
| Simplified, $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-$ | $\begin{pmatrix}-0.0385 & -0.0038\\ -0.0038 & 99.0595\end{pmatrix}$ | $-0.0385$ |
| Joseph | $\begin{pmatrix}4.0031 & 0.3963\\ 0.3963 & 99.0991\end{pmatrix}$ | $4.0014$ |

The simplified form reports a negative variance on the very first update — a claim with no meaning at all. The Joseph form, fed the same data and the same wrong gain, reports $4.003\,\mathrm{m^2}$. That is slightly *more* than the $3.848\,\mathrm{m^2}$ the right gain would give, which is exactly correct: a worse gain should leave you less sure.

**Scanning the error.** Repeat with gain errors of $1\%$, $2\%$, $3\%$ and $3.5\%$. The simplified form's smallest eigenvalue falls steadily: $2.88$, $1.90$, $0.93$, $0.45$. It crosses zero at $3.96\%$, the error that pushes $K_p$ to exactly $1$ ($1/0.9619 = 1.0396$). The Joseph form stays between $3.86$ and $4.00$ throughout.

Sanity check: using the exact $\mathbf{Q}$ instead of the short-step one changes $\mathbf{P}^-_1$ by less than $0.001$, and gives the same failure at $4\%$. The cause is the gain passing $1$, not the choice of $\mathbf{Q}$. (Essentially the same numbers come out in 32-bit and 64-bit arithmetic, because this failure is in the formula, not the rounding.)
:::

This example explains the module's coding exercise too. There, a mere $1\%$ gain error breaks the simplified form at once, because the first update's gain is $100/100.25 = 0.9975$ — so close to $1$ that $1\%$ pushes it over.

::: warning A small error is not automatically a safe one
It is tempting to read the example as "the simplified form is fine unless the error is big". But the safe margin here came from *this* problem: a first gain of $0.96$ left $4\%$ of room. A gain closer to $1$ — a very accurate sensor, a very uncertain start — leaves less. And in larger filters, with many states and variances that differ by many powers of ten, ordinary round-off in the last digits can do the same damage with no deliberate error at all. The margin only ever shrinks as problems get harder. The Joseph form costs about twice the arithmetic and removes the question. On any filter that runs for a long mission, in reduced precision, or with a gain that is ever approximate, that is the cheaper option.
:::

## Square-root filtering: make a bad covariance impossible to write down

The Joseph form keeps the covariance valid, but only barely: rounding can still push it to the edge, where some direction has zero variance, one unlucky digit from going negative. **Square-root filtering** removes even that, the way the gardener did — by changing what is stored.

Factor the covariance as $\mathbf{P} = \mathbf{S}\mathbf{S}^{\mathsf{T}}$ and carry $\mathbf{S}$ instead of $\mathbf{P}$. Read $\mathbf{S}$ as "a square root of $\mathbf{P}$". The usual choice is the **[[Cholesky factor|cholesky]]**, a lower-triangular $\mathbf{S}$, but any such factor works. Now any $\mathbf{S}\mathbf{S}^{\mathsf{T}}$ is positive semi-definite for *any* real $\mathbf{S}$ whatsoever, rounding errors included. Short of a hardware fault, no arithmetic slip can make it indefinite.

There is a second reward. A matrix's **[[condition number|condition-number]]** is the ratio of its largest to its smallest stretch; for a covariance, the ratio of its largest to smallest eigenvalue. The condition number of $\mathbf{S}$ is the *square root* of that of $\mathbf{P}$. So a filter working with $\mathbf{S}$ needs about half as many bits of range as one working with $\mathbf{P}$. That was exactly the resource Apollo's computer did not have to spare.

::: note Why it has to be true: S times its transpose is never negative
Take any vector $\mathbf{v}$ and ask how much variance $\mathbf{S}\mathbf{S}^{\mathsf{T}}$ puts in that direction:

$$
\mathbf{v}^{\mathsf{T}}(\mathbf{S}\mathbf{S}^{\mathsf{T}})\mathbf{v} = (\mathbf{S}^{\mathsf{T}}\mathbf{v})^{\mathsf{T}}(\mathbf{S}^{\mathsf{T}}\mathbf{v}) = \lVert \mathbf{S}^{\mathsf{T}}\mathbf{v}\rVert^2 \geq 0.
$$

The first step regroups the product; the second recognizes a vector dotted with itself, which is a sum of squares. A sum of squares of real numbers cannot be negative. Nothing here asked whether $\mathbf{S}$ was accurate — the guarantee lives in the *shape* of the calculation.
:::

### The array update

How do you update $\mathbf{S}$ directly, without ever forming $\mathbf{P}$? Take one scalar measurement ($\mathbf{H}$ a single row, $R$ a number) and stack a **pre-array**:

$$
\mathbf{M} = \begin{pmatrix}\sqrt{R} & \mathbf{H}\mathbf{S}^- \\ \mathbf{0} & \mathbf{S}^-\end{pmatrix}.
$$

It is $(n+1) \times (n+1)$. Multiply it by its own transpose, block by block:

$$
\mathbf{M}\mathbf{M}^{\mathsf{T}} = \begin{pmatrix}R + \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} & \mathbf{H}\mathbf{P}^-\\ \mathbf{P}^-\mathbf{H}^{\mathsf{T}} & \mathbf{P}^-\end{pmatrix}.
$$

Every piece of the Kalman update is in there: the innovation variance top left, the cross term $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ that builds the gain, and $\mathbf{P}^-$ itself.

Now multiply $\mathbf{M}$ on the right by an **[[orthogonal|orthogonal]]** matrix $\mathbf{T}$ — one that rotates or reflects without stretching, so $\mathbf{T}\mathbf{T}^{\mathsf{T}} = \mathbf{I}$. Choose $\mathbf{T}$ so the result $\mathbf{L} = \mathbf{M}\mathbf{T}$ is lower-triangular: the **post-array**. Because $\mathbf{T}\mathbf{T}^{\mathsf{T}} = \mathbf{I}$, we get $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \mathbf{M}\mathbf{T}\mathbf{T}^{\mathsf{T}}\mathbf{M}^{\mathsf{T}} = \mathbf{M}\mathbf{M}^{\mathsf{T}}$. The rotation changes nothing that matters.

Write the post-array in blocks as $\mathbf{L} = \begin{pmatrix}\sqrt{\alpha} & \mathbf{0}\\ \mathbf{c} & \mathbf{S}^+\end{pmatrix}$ and multiply it out: $\mathbf{L}\mathbf{L}^{\mathsf{T}}$ has $\alpha$ top left, $\sqrt{\alpha}\,\mathbf{c}$ bottom left, and $\mathbf{c}\mathbf{c}^{\mathsf{T}} + \mathbf{S}^+(\mathbf{S}^+)^{\mathsf{T}}$ bottom right. Match these with $\mathbf{M}\mathbf{M}^{\mathsf{T}}$, one block at a time:

- top left: $\alpha = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + R$, the innovation variance;
- bottom left: $\mathbf{c} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}/\sqrt{\alpha}$, so $\mathbf{c}/\sqrt{\alpha} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}/\alpha$ is the Kalman gain;
- bottom right: $\mathbf{S}^+(\mathbf{S}^+)^{\mathsf{T}} = \mathbf{P}^- - \mathbf{c}\mathbf{c}^{\mathsf{T}} = \mathbf{P}^- - \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{H}\mathbf{P}^-/\alpha$, which is the updated covariance.

::: key The square-root array update
Triangularize $\mathbf{M} = \begin{pmatrix}\sqrt{R} & \mathbf{H}\mathbf{S}^-\\ \mathbf{0} & \mathbf{S}^-\end{pmatrix}$ into lower-triangular $\mathbf{L} = \begin{pmatrix}\sqrt{\alpha} & \mathbf{0}\\ \mathbf{c} & \mathbf{S}^+\end{pmatrix}$. Then $\alpha = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}+R$ is the innovation variance, $\mathbf{S}^+$ is the updated square root, and $\mathbf{K} = \mathbf{c}/\sqrt{\alpha}$ is the Kalman gain — all three read out of one triangularization.
:::

A **QR decomposition** is a standard library routine that does exactly this kind of orthogonal triangularization, so the code is short.

```python
import numpy as np

def sqrt_update(S_minus, H, R):
    """Square-root measurement update by orthogonal triangularization.
    S_minus: lower-triangular Cholesky factor of P_minus (n x n).
    H: 1 x n. R: 1 x 1. Returns (S_plus, K, sqrt_alpha)."""
    n = S_minus.shape[0]
    M = np.block([[np.sqrt(R), H @ S_minus], [np.zeros((n, 1)), S_minus]])
    Q, Rtri = np.linalg.qr(M.T)          # M.T = Q Rtri, so M Q = Rtri.T (lower-triangular)
    signs = np.sign(np.diag(Rtri)); signs[signs == 0] = 1
    L = M @ (Q * signs)                  # post-array with a positive diagonal
    sqrt_alpha = L[0, 0]
    K = L[1:, 0:1] / sqrt_alpha
    return L[1:, 1:], K, sqrt_alpha

rng = np.random.default_rng(3)
A = rng.normal(size=(3, 3)); P = A @ A.T + 3 * np.eye(3)
H = rng.normal(size=(1, 3)); R = np.array([[0.7]])
S = np.linalg.cholesky(P)
S_plus, K, sqrt_alpha = sqrt_update(S, H, R)

alpha = (H @ P @ H.T + R)[0, 0]
K_direct = P @ H.T / alpha
I = np.eye(3)
P_joseph = (I - K_direct @ H) @ P @ (I - K_direct @ H).T + K_direct @ R @ K_direct.T
print(sqrt_alpha, np.sqrt(alpha))                       # 12.798048087555047 12.79804808755505
print(np.abs(K - K_direct).max())                       # 5.551115123125783e-17
print(np.abs(S_plus @ S_plus.T - P_joseph).max())       # 8.881784197001252e-16
```

::: example The array update, checked against the Joseph form
Take a random $3 \times 3$ positive definite $\mathbf{P}^-$, a random row $\mathbf{H}$ and $R = 0.7$ (the code above).

**Innovation variance.** The post-array's corner is $\sqrt{\alpha} = 12.798048$. Computing $\sqrt{\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + R}$ directly gives $12.798048$ too.

**Gain.** The recovered gain is $(0.28968,\ -0.0000388,\ -0.093942)^{\mathsf{T}}$, and it differs from the directly computed $\mathbf{K}$ by at most $6 \times 10^{-17}$.

**Covariance.** $\mathbf{S}^+(\mathbf{S}^+)^{\mathsf{T}}$ matches the Joseph-form $\mathbf{P}^+$ to within $8.9 \times 10^{-16}$ in every entry. That is the size of double-precision rounding: the two are the same matrix.

**Dynamic range.** This $\mathbf{P}^-$ has condition number $5.27$, and its Cholesky factor has $2.29$ — the square root, as promised.
:::

### Potter and Carlson

Engineers did not always have a QR routine on board, so they solved this same triangularization by hand, once, and coded the answer.

**Potter's algorithm** is the closed-form answer for one scalar measurement. Let $\boldsymbol{\phi} = (\mathbf{S}^-)^{\mathsf{T}}\mathbf{H}^{\mathsf{T}}$ (read "phi") and $\gamma = 1/(\alpha + \sqrt{\alpha R})$ (read "gamma"). Then

$$
\mathbf{S}^+ = \mathbf{S}^-\big(\mathbf{I} - \gamma\,\boldsymbol{\phi}\boldsymbol{\phi}^{\mathsf{T}}\big).
$$

On the same random example, it reproduces the Joseph-form $\mathbf{P}^+$ to within $6.4 \times 10^{-16}$. One catch: Potter's $\mathbf{S}^+$ is a full matrix, not a triangular one.

**Carlson's algorithm** (1973) is a third route to the same answer. It updates a *triangular* square root directly, one column at a time, so the factor stays triangular after every measurement. That saves storage and work compared with Potter, at the cost of one square root per state per measurement.

## UD factorization: the same guarantee with no square roots

A square root is slow on hardware that has no instruction for it, and the classical alternative avoids square roots entirely. Factor

$$
\mathbf{P} = \mathbf{U}\mathbf{D}\mathbf{U}^{\mathsf{T}},
$$

with $\mathbf{U}$ **unit triangular** (ones on its diagonal) and $\mathbf{D}$ diagonal. This holds the same information as a Cholesky factor, split two ways: the triangle carries the shape and no scale, and the diagonal carries the scale with no square roots. As long as every entry of $\mathbf{D}$ stays positive, $\mathbf{P}$ is a valid covariance, automatically.

**[[Bierman and Thornton|bierman-thornton]]** built the classical algorithms: Bierman's for the measurement update, Thornton's for the predict step. They arrange $\mathbf{U}$ as upper-triangular because of the order they process states in. Below, the same idea is built with a lower-triangular arrangement, $\mathbf{P} = \mathbf{L}\mathbf{D}\mathbf{L}^{\mathsf{T}}$ — mathematically equivalent, and checked here rather than quoted.

**Step 1: the update is a subtraction.** At the optimal gain, the update removes one rank-one piece: $\mathbf{P}^+ = \mathbf{P}^- - \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{H}\mathbf{P}^-/\alpha$. (That is the bottom-right block of the array update above.)

**Step 2: move into the factor's frame.** Write $\mathbf{P}^- = \mathbf{L}\mathbf{D}\mathbf{L}^{\mathsf{T}}$ and set $\mathbf{y} = \mathbf{D}\mathbf{L}^{\mathsf{T}}\mathbf{H}^{\mathsf{T}}$, so that $\mathbf{L}\mathbf{y} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}$. Then

$$
\mathbf{P}^+ = \mathbf{L}\Big(\mathbf{D} - \tfrac{1}{\alpha}\,\mathbf{y}\mathbf{y}^{\mathsf{T}}\Big)\mathbf{L}^{\mathsf{T}}.
$$

**Step 3: factor the small problem.** The middle is a diagonal matrix minus a rank-one piece. Factor it as $\mathbf{L}'\mathbf{D}'\mathbf{L}'^{\mathsf{T}}$, and the answer is $\mathbf{L}^+ = \mathbf{L}\mathbf{L}'$ and $\mathbf{D}^+ = \mathbf{D}'$. That small factorization has a neat step-by-step solution. Keep a running total $p_k$ ("p sub k"), starting at $p_0 = 0$, and use the *original* diagonal entries $d_k$:

::: key The diagonal-minus-rank-one recursion
For $\mathbf{D} - c\,\mathbf{y}\mathbf{y}^{\mathsf{T}}$ with $c = 1/\alpha$, set $p_0 = 0$ and, for $k = 1, \ldots, n$ in order,
$$
p_k = p_{k-1} + \frac{c\,y_k^2}{d_k}, \qquad d_k' = d_k\,\frac{1-p_k}{1-p_{k-1}}, \qquad L'_{ik} = -\frac{c\,y_i\,y_k}{d_k(1-p_k)} \ \ (i > k).
$$
No square root appears anywhere.
:::

::: note Why it has to be true: every new diagonal entry stays positive
The running total ends at $p_n = c\sum_k y_k^2/d_k = \mathbf{y}^{\mathsf{T}}\mathbf{D}^{-1}\mathbf{y}/\alpha$. Since $\mathbf{y} = \mathbf{D}\mathbf{L}^{\mathsf{T}}\mathbf{H}^{\mathsf{T}}$, that is $\mathbf{H}\mathbf{L}\mathbf{D}\mathbf{L}^{\mathsf{T}}\mathbf{H}^{\mathsf{T}}/\alpha = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}/(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + R)$, which is less than $1$ whenever $R > 0$. Every term added to the total is non-negative, so $0 = p_0 \leq p_1 \leq \cdots \leq p_n < 1$. Then each $1 - p_k$ is positive, each ratio $(1 - p_k)/(1 - p_{k-1})$ is positive, and each $d_k'$ is a positive number times a positive ratio. The updated $\mathbf{D}$ is positive, so the updated covariance is valid. The algebra that produces the recursion is the ordinary column-by-column factorization of $\mathbf{D} - c\,\mathbf{y}\mathbf{y}^{\mathsf{T}}$: after column $k$, the leftover piece is again "diagonal minus rank one", with $c$ replaced by $c/(1 - p_k)$.
:::

```python
import numpy as np

def diag_minus_rank1(d, y, c):
    """Factor diag(d) - c*y*y^T = Lp @ diag(dp) @ Lp.T, Lp unit lower-triangular.
    No square roots anywhere."""
    n = len(d)
    dp = np.zeros(n)
    Lp = np.eye(n)
    p_prev = 0.0
    for k in range(n):
        p_k = p_prev + c * y[k]**2 / d[k]
        dp[k] = d[k] * (1 - p_k) / (1 - p_prev)
        Lp[k+1:, k] = -c * y[k] * y[k+1:] / (d[k] * (1 - p_k))
        p_prev = p_k
    return Lp, dp

def ldl_update(L, d, H, R):
    """Measurement update of P = L diag(d) L^T for one scalar measurement."""
    f = L.T @ H.ravel()              # f = L^T H^T
    y = d * f                        # y = D L^T H^T, so L y = P H^T
    alpha = f @ y + R                # innovation variance H P H^T + R
    Lp, dp = diag_minus_rank1(d, y, 1.0 / alpha)
    return L @ Lp, dp, (L @ y) / alpha   # new factors and the gain K

rng = np.random.default_rng(7)
for trial in range(5):
    A = rng.normal(size=(4, 4)); P = A @ A.T + np.eye(4)
    H = rng.normal(size=(1, 4)); R = rng.uniform(0.1, 2.0)
    C = np.linalg.cholesky(P)                  # set-up only: build the starting L and d
    d = np.diag(C)**2; L = C / np.diag(C)
    Lp, dp, K = ldl_update(L, d, H, R)
    Kd = P @ H.T / ((H @ P @ H.T)[0, 0] + R)
    I = np.eye(4)
    P_joseph = (I - Kd @ H) @ P @ (I - Kd @ H).T + R * Kd @ Kd.T
    print(f"{np.abs(Lp @ np.diag(dp) @ Lp.T - P_joseph).max():.1e}", dp.min() > 0)
# 4.4e-16 True
# 1.8e-15 True
# 3.3e-15 True
# 1.8e-15 True
# 1.3e-15 True
```

::: example The UD-style update against the Joseph form, five random trials
Run the update above on five random $4$-state problems, each with a random $\mathbf{H}$ and a random $R$ between $0.1$ and $2$.

**Accuracy.** In every trial, $\mathbf{L}^+\mathbf{D}^+(\mathbf{L}^+)^{\mathsf{T}}$ matches the Joseph-form $\mathbf{P}^+$ to within $4.4 \times 10^{-16}$ to $3.3 \times 10^{-15}$ — rounding level each time. The gain it returns matches the direct gain to within $2.2 \times 10^{-16}$.

**Validity.** Every entry of $\mathbf{D}^+$ is strictly positive in every trial, as the proof above says it must be.

**No square roots.** The update itself never calls one. (The Cholesky call in the test only builds a starting factor; a real filter would carry $\mathbf{L}$ and $\mathbf{d}$ from the start and never need it.)
:::

::: note Why carry three formulations instead of picking one
The Joseph form is the cheapest of the three that stays correct for *any* gain, and it is standard wherever its $2\times$ cost is affordable — most flight filters today. Square-root and UD forms cost more again, but buy something the Joseph form does not fully give: they make an invalid covariance *impossible to represent*, not merely unlikely, and they halve the range of numbers the arithmetic must handle. That mattered enormously on 1960s hardware and still matters on small fixed-point or reduced-precision processors. The three are not rival answers. They are three points on a cost-versus-guarantee curve, and the right one depends on a real system's word length and mission length.
:::

## Check yourself

::: check
In one or two sentences, explain why $\mathbf{S}\mathbf{S}^{\mathsf{T}}$ can never have a negative variance in any direction, for *any* real matrix $\mathbf{S}$ — even one full of rounding errors.
:::

::: answer
For any direction $\mathbf{v}$, the variance is $\mathbf{v}^{\mathsf{T}}(\mathbf{S}\mathbf{S}^{\mathsf{T}})\mathbf{v} = (\mathbf{S}^{\mathsf{T}}\mathbf{v})^{\mathsf{T}}(\mathbf{S}^{\mathsf{T}}\mathbf{v}) = \lVert \mathbf{S}^{\mathsf{T}}\mathbf{v}\rVert^2 \geq 0$, a sum of squares. That is a property of the *form* $\mathbf{S}\mathbf{S}^{\mathsf{T}}$, true whether or not $\mathbf{S}$ is accurate, so rounding errors in $\mathbf{S}$ can make the covariance wrong but never invalid.
:::

::: check
In the worked example, the simplified form failed at a $4\%$ gain error but not at $3.5\%$. Explain exactly where the threshold comes from, and what the Joseph form reports instead.
:::

::: answer
For the position entry, the simplified update is $P^+_{pp} = (1 - K_p)P^-_{pp}$. It goes negative exactly when the gain in use passes $1$. The optimal first gain was $101/105 = 0.9619$, so the threshold error is $1/0.9619 - 1 = 3.96\%$. At $3.5\%$ the gain is $0.9956$, still below $1$; at $4\%$ it is $1.0004$, a hair above.

The Joseph form's scalar version is $(1 - K_p)^2 P^-_{pp} + K_p^2 R$, a sum of two non-negative terms, so it cannot go negative for any gain. At $4\%$ it reports $4.003\,\mathrm{m^2}$ — a bit more than the $3.848\,\mathrm{m^2}$ the optimal gain gives — which correctly says that a worse gain leaves the filter less sure.
:::

::: check
In the square-root array update, why can the Kalman gain be read off the triangularized array instead of being computed separately?
:::

::: answer
The pre-array was built so that $\mathbf{M}\mathbf{M}^{\mathsf{T}}$ equals $\begin{pmatrix}\alpha & \mathbf{H}\mathbf{P}^-\\ \mathbf{P}^-\mathbf{H}^{\mathsf{T}} & \mathbf{P}^-\end{pmatrix}$, and an orthogonal transformation keeps that product unchanged. Multiplying out the triangular post-array, its bottom-left block times $\sqrt{\alpha}$ must equal $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$, so the block is $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}/\sqrt{\alpha} = \mathbf{K}\sqrt{\alpha}$, since $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}/\alpha$. Dividing it by the corner entry $\sqrt{\alpha}$ gives $\mathbf{K}$. The same rotation that produces $\mathbf{S}^+$ produces the gain as a by-product.
:::

::: check
Why does the UD recursion use the *original* $d_k$ (not the new $d_k'$) in the running total $p_k = p_{k-1} + c\,y_k^2/d_k$?
:::

::: answer
$p_k$ is bookkeeping about the matrix being factored, $\mathbf{D} - c\,\mathbf{y}\mathbf{y}^{\mathsf{T}}$, whose ingredients are the original $d_k$ and $y_k$. It tracks how much of the rank-one piece has been absorbed so far, measured against the original diagonal. It is not a record of the factorization's own output. Mixing in $d_k'$ would combine an input quantity with an output quantity at the same step, and the identity checked in this lesson — $\mathbf{L}'\mathbf{D}'\mathbf{L}'^{\mathsf{T}}$ reproducing $\mathbf{D} - c\,\mathbf{y}\mathbf{y}^{\mathsf{T}}$ to rounding level — depends on the recursion using only the original $\mathbf{D}$ and $\mathbf{y}$.
:::

::: check
A colleague argues that since square-root and UD forms both guarantee a valid covariance, there is never a reason to use plain Joseph form. What is the counter-argument?
:::

::: answer
A guarantee is not the only cost that matters. The Joseph form costs roughly twice the simplified update. Square-root and UD forms cost more again — a triangularization or a column-by-column factorization per measurement, instead of a few matrix products — and that cost is paid every cycle for the whole mission.

For a short mission, with comfortable precision and a gain that is always freshly computed near the optimum, the Joseph form's guarantee (valid for any gain, positive semi-definite by construction as a sum of two such terms) is already enough. Paying for a stronger guarantee than the mission's arithmetic ever needs is a real, avoidable cost on a flight computer's cycle budget.
:::

## Summary

| Item | Statement |
| --- | --- |
| Why the simple form fails | $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-$ is right only at the optimal gain; a gain pushed past $1$ in a direction gives a negative variance there |
| Joseph form | $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I}-\mathbf{K}\mathbf{H})^{\mathsf{T}}+\mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$: any gain, symmetric and positive semi-definite by construction, about $2\times$ the flops |
| Square root | Carry $\mathbf{S}$ with $\mathbf{P}=\mathbf{S}\mathbf{S}^{\mathsf{T}}$; valid for any $\mathbf{S}$; condition number square-rooted, so half the bits of range |
| Array update | Triangularize $\begin{pmatrix}\sqrt{R}&\mathbf{H}\mathbf{S}^-\\\mathbf{0}&\mathbf{S}^-\end{pmatrix}$ to read off $\sqrt{\alpha}$, $\mathbf{K}=\mathbf{c}/\sqrt{\alpha}$ and $\mathbf{S}^+$ together |
| Potter / Carlson | Potter: $\mathbf{S}^+=\mathbf{S}^-(\mathbf{I}-\gamma\boldsymbol\phi\boldsymbol\phi^{\mathsf{T}})$, $\boldsymbol\phi=(\mathbf{S}^-)^{\mathsf{T}}\mathbf{H}^{\mathsf{T}}$, $\gamma=1/(\alpha+\sqrt{\alpha R})$. Carlson: keeps the factor triangular, column by column |
| UD (Bierman-Thornton) | $\mathbf{P}=\mathbf{U}\mathbf{D}\mathbf{U}^{\mathsf{T}}$, no square roots; $p_k=p_{k-1}+c\,y_k^2/d_k$, $d_k'=d_k(1-p_k)/(1-p_{k-1})$, all $d_k'>0$ |
| Cost against guarantee | Simplified (cheapest, weakest) → Joseph ($2\times$, valid for any gain) → square root or UD (more, invalid covariance unrepresentable) |

Every formulation here computes the *same* $\mathbf{P}^+$ in exact arithmetic; they differ only in what happens when arithmetic is not exact. The next lesson turns to failures that have nothing to do with arithmetic: a filter that is internally consistent and numerically spotless, and still wrong, because the world it assumes is not the world it is flying through.

::: context word-length How many digits a computer keeps
A computer stores each number in a fixed number of **bits** (binary digits). A standard 64-bit "double" keeps about $16$ significant decimal digits; a 32-bit "single" keeps about $7$. Every multiplication rounds its answer to fit. One rounding is harmless. Millions of them in a filter that runs for days can add up — especially when a covariance holds variances that differ by many powers of ten, so the small ones live in the last few digits of the big ones.
:::

::: context apollo-agc A navigation filter in 1960s hardware
The Apollo Guidance Computer used 16-bit words — 15 bits of data and one bit for error checking — with about 2,048 words of erasable memory. Its onboard navigation combined star and landmark sightings with a recursive estimator of the Kalman type. With so few digits, a covariance that drifted slightly negative through rounding could ruin the estimate with no way to restart. James Potter, at MIT's Instrumentation Laboratory, worked out the square-root formulation in that setting, which is why his name is on the scalar square-root update.
:::

::: context cholesky A square root for matrices
Every positive definite matrix can be written as $\mathbf{P} = \mathbf{S}\mathbf{S}^{\mathsf{T}}$ with $\mathbf{S}$ lower-triangular and a positive diagonal — its **Cholesky factor**. For a $1 \times 1$ matrix it is the ordinary square root. André-Louis Cholesky, a French army officer and surveyor, devised the method to solve the least-squares problems of mapping; it was published after he was killed in the First World War. It is still the fastest safe way to solve a system with a covariance matrix in it.
:::

::: context condition-number How lopsided a matrix is
The **condition number** measures how unevenly a matrix stretches things: the biggest stretch divided by the smallest. A round covariance, equally uncertain in every direction, has condition number $1$. A thin cigar-shaped one has a huge condition number, and the thin direction's small numbers are the first to be lost to rounding. Taking the square root shortens the cigar: a condition number of $10^{8}$ becomes $10^{4}$, which is why square-root filters need half as many digits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="50" y="30" width="36" height="100" fill="#1d6fd1"/>
  <rect x="100" y="129" width="36" height="1" fill="#b4232c" stroke="#b4232c" stroke-width="1"/>
  <rect x="220" y="30" width="36" height="100" fill="#1d6fd1"/>
  <rect x="270" y="120" width="36" height="10" fill="#b4232c"/>
  <text x="68" y="24" font-size="11" fill="#1f2a44" text-anchor="middle">100</text>
  <text x="118" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="238" y="24" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <text x="288" y="113" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="93" y="148" font-size="12" fill="#1f2a44" text-anchor="middle">P: ratio 100 to 1</text>
  <text x="263" y="148" font-size="12" fill="#1f2a44" text-anchor="middle">S: ratio 10 to 1</text>
  <text x="180" y="164" font-size="11" fill="#6c7a93" text-anchor="middle">bars drawn to the same top height</text>
</svg>
```
:::

::: context orthogonal Turning without stretching
An **orthogonal** matrix rotates or reflects vectors without changing their lengths — like turning a photo on a table without resizing it. Algebraically, $\mathbf{T}\mathbf{T}^{\mathsf{T}} = \mathbf{I}$. Because it never stretches, it never magnifies rounding errors either, which is why algorithms built from orthogonal steps are the gold standard for numerical safety.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="3" fill="#1f2a44"/>
  <line x1="180" y1="110" x2="280" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="180" y1="110" x2="250.7" y2="39.3" stroke="#b4232c" stroke-width="3"/>
  <path d="M 230 110 A 50 50 0 0 0 215.4 74.6" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="230" y="128" font-size="12" fill="#1d6fd1" text-anchor="middle">before: length 1</text>
  <text x="240" y="30" font-size="12" fill="#b4232c" text-anchor="end">after: still length 1</text>
  <text x="236" y="92" font-size="11" fill="#6c7a93">45°</text>
</svg>
```
:::

::: context bierman-thornton The JPL factorization
Gerald Bierman and Catherine Thornton developed the UD methods at NASA's Jet Propulsion Laboratory in the 1970s, for orbit determination of deep-space probes, where filters run for years and variances span many powers of ten. Thornton's 1976 work gave the UD predict step; Bierman's 1977 book, *Factorization Methods for Discrete Sequential Estimation*, collected the measurement update and made the approach standard. UD filters are still common in spacecraft navigation software.
:::
