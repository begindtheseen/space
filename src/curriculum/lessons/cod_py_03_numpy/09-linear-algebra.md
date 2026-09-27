---
id: l09-linear-algebra
title: "Linear algebra: solve, lstsq, eig, svd"
minutes: 24
covers:
  - "Linear algebra: solve, lstsq, eig, svd, norm, cond, and why not inv"
---

At a snack stand, three granola bars and one juice cost 7 dollars. One granola bar and two juices cost 4 dollars. What does each one cost? You can work it out with a pencil: two equations, two unknowns. A computer does the same kind of puzzle, only with hundreds or thousands of unknowns at once.

That puzzle is called a **linear system** — a set of equations where each unknown is only multiplied by a number and added up, never squared or put inside a sine. GNC work is full of them: working out an orbit from radar measurements, sharing a push among twelve thrusters, the update step inside every Kalman filter. The tools are in NumPy's `np.linalg` module, read "NumPy linear algebra".

In the last lesson you met matrices as tables of numbers and `@` as the way to multiply them. This lesson runs that machine backwards: `solve`, why the "obvious" way with an inverse is slower *and* less accurate, curve fitting with `lstsq`, and what `eig`, `svd`, `norm` and `cond` tell you about a matrix. You do not need a linear algebra course first.

## A matrix as a machine, run backwards

Write the snack puzzle with the unknown prices in a list $\mathbf{x} = (g, j)$, granola and juice. The two equations are

$$
\begin{aligned}
3g + 1j &= 7 \\
1g + 2j &= 4
\end{aligned}
$$

Put the numbers that multiply the unknowns in a table, $\mathbf{A}$, and the right-hand sides in a column, $\mathbf{b}$:

$$
\mathbf{A} = \begin{bmatrix} 3 & 1 \\ 1 & 2 \end{bmatrix}, \qquad \mathbf{b} = \begin{bmatrix} 7 \\ 4 \end{bmatrix}, \qquad \mathbf{A}\mathbf{x} = \mathbf{b}.
$$

Read $\mathbf{A}\mathbf{x} = \mathbf{b}$ aloud as "A times x equals b". In the last lesson, `A @ x` took a vector in and gave a vector out. Here you know what came *out* ($\mathbf{b}$) and want to know what went *in* ($\mathbf{x}$). That is what "solving" means.

The answer here is $g = 2$, $j = 1$: check $3 \cdot 2 + 1 = 7$ and $2 + 2 \cdot 1 = 4$.

### np.linalg.solve

In NumPy you hand the matrix and the right-hand side to **`np.linalg.solve`**, which returns $\mathbf{x}$. Here is a three-unknown version:

```python
import numpy as np

A = np.array([[4.0, 1.0, 0.0],
              [1.0, 3.0, 1.0],
              [0.0, 1.0, 2.0]])
b = np.array([6.0, 10.0, 8.0])

x = np.linalg.solve(A, b)
print(x)
# [1. 2. 3.]
print(A @ x)
# [ 6. 10.  8.]
```

Always do that second print. Putting the answer back in and seeing $\mathbf{b}$ come out is the check. The difference $\mathbf{A}\mathbf{x} - \mathbf{b}$ has a name: the **residual**, what is left over when you plug your answer back in. A good solution has a residual near zero.

### What solve does inside

`solve` does what you would do by hand: **elimination**. Use the first equation to remove the first unknown from all the others, then use the new second equation to remove the second unknown from the rest, and so on, until the last equation has one unknown. Solve that, then walk back up, filling in one unknown at a time. The walk back up is called **back-substitution**.

Done carefully, elimination splits $\mathbf{A}$ into two triangle-shaped matrices, $\mathbf{A} = \mathbf{L}\mathbf{U}$ — a **[[LU factorization|lu-picture]]**. $\mathbf{L}$ ("lower") holds the recipe for the eliminations. $\mathbf{U}$ ("upper") is the staircase you are left with. Once you have them, solving is two quick walks: down through $\mathbf{L}$, then up through $\mathbf{U}$. NumPy does not do this in Python. It calls **[[LAPACK|lapack]]**, a library of fast, carefully tested routines that nearly every engineering tool uses.

::: key np.linalg.solve
`x = np.linalg.solve(A, b)` solves $\mathbf{A}\mathbf{x} = \mathbf{b}$ for a square $\mathbf{A}$ by LU factorization and back-substitution. Check the **residual** `A @ x - b`; it should be tiny. If $\mathbf{A}$ is singular (has no inverse), `solve` raises `LinAlgError`.
:::

## Why not inv

A matrix has an **inverse**, written $\mathbf{A}^{-1}$ ("A inverse"), if some matrix undoes it: $\mathbf{A}^{-1}\mathbf{A} = \mathbf{I}$, the identity from `np.eye`. On paper, $\mathbf{x} = \mathbf{A}^{-1}\mathbf{b}$, so it is tempting to write `np.linalg.inv(A) @ b`. Do not. It is worse in two separate ways.

To find two snack prices, you do not first build a lookup book for every possible pair of totals. You solve the one puzzle in front of you. Forming $\mathbf{A}^{-1}$ is building the whole lookup book.

### Cost

Count the work in **[[flops|flop]]** — single multiplications or additions of two floats. For an $n \times n$ matrix:

- LU factorization costs about $\tfrac{2}{3}n^3$ flops. The two triangle walks cost about $2n^2$ more, which is small next to $n^3$ when $n$ is large.
- Forming the inverse starts with the same LU, then does about $\tfrac{4}{3}n^3$ more work to build all $n$ columns of $\mathbf{A}^{-1}$. That is about $2n^3$ in total, before you even multiply by $\mathbf{b}$.

So the inverse route does roughly three times the work: $2n^3 \div \tfrac{2}{3}n^3 = 3$. For $n = 2000$ that is about $5.3 \times 10^9$ flops against $1.6 \times 10^{10}$. Measured:

```python
import numpy as np
from timeit import timeit

rng = np.random.default_rng(1)
n = 2000
A = rng.normal(size=(n, n))
b = rng.normal(size=n)

t_solve = min(timeit(lambda: np.linalg.solve(A, b), number=1) for _ in range(5))
t_inv = min(timeit(lambda: np.linalg.inv(A) @ b, number=1) for _ in range(5))
print(f"solve:    {t_solve*1e3:.0f} ms")
print(f"inv @ b:  {t_inv*1e3:.0f} ms")
print(f"ratio:    {t_inv/t_solve:.1f}")
# solve:    47 ms
# inv @ b:  170 ms
# ratio:    3.6
```

`timeit` times a piece of code; the minimum of five runs ignores runs slowed by something else. The milliseconds depend on your machine; the ratio of about three is the flop count showing through.

### Accuracy

Every flop rounds, and the inverse route does more of them, then multiplies by a matrix that already carries rounding error. On a friendly matrix you will not notice. On a touchy one you will.

::: example solve against inv on a Hilbert matrix
The **[[Hilbert matrix|hilbert]]** is a famous touchy matrix: the entry in row $i$, column $j$ is $\frac{1}{i + j - 1}$. Build the $10 \times 10$ one, choose the answer to be all ones, make $\mathbf{b}$ from it, and see how well each method gets the ones back.

```python
import numpy as np

n = 10
i = np.arange(1, n + 1)
H = 1.0 / (i[:, None] + i[None, :] - 1)    # broadcasting builds the table
x_true = np.ones(n)
b = H @ x_true

x_solve = np.linalg.solve(H, b)
x_inv = np.linalg.inv(H) @ b

print(f"cond(H)            = {np.linalg.cond(H):.1e}")
print(f"residual, solve    = {np.linalg.norm(H @ x_solve - b):.1e}")
print(f"residual, inv @ b  = {np.linalg.norm(H @ x_inv - b):.1e}")
print(f"error, solve       = {np.linalg.norm(x_solve - x_true):.1e}")
print(f"error, inv @ b     = {np.linalg.norm(x_inv - x_true):.1e}")
# cond(H)            = 1.6e+13
# residual, solve    = 4.7e-16
# residual, inv @ b  = 2.0e-04
# error, solve       = 7.2e-05
# error, inv @ b     = 1.1e-02
```

**Step 1.** `i[:, None] + i[None, :]` is broadcasting from lesson 5: a column plus a row gives the $10 \times 10$ table of $i + j$.

**Step 2.** `np.linalg.norm` turns an error vector into one size (next section). Now read the results. With `solve`, the residual is $4.7 \times 10^{-16}$: plugging the answer back in reproduces $\mathbf{b}$ to the last digit a float can hold. With the inverse it is $2.0 \times 10^{-4}$, about 400 billion times bigger. The error in $\mathbf{x}$ itself is about 150 times bigger with the inverse ($1.1 \times 10^{-2} \div 7.2 \times 10^{-5} \approx 150$).

**Sanity check.** Even `solve` got $\mathbf{x}$ wrong in the fifth digit. That is not a bug: `cond(H)` $= 1.6 \times 10^{13}$ warns that this matrix can magnify small errors about $10^{13}$ times. Both methods suffer from that; the inverse adds its own damage on top.
:::

::: key Why prefer solve(A, b) over inv(A) @ b
solve factorises once and back-substitutes, costing about a third of the work of forming an explicit inverse, and it avoids the extra rounding of computing and then multiplying by the inverse. Explicit inverses are for when you genuinely need the matrix itself, which is rare.
:::

::: warning Solving for many right-hand sides
"Same $\mathbf{A}$, a thousand different $\mathbf{b}$ — surely the inverse pays off then?" No. Stack the $\mathbf{b}$ vectors as the columns of a matrix $\mathbf{B}$ and call `np.linalg.solve(A, B)`: one factorization, reused for every column. The next module's SciPy `lu_factor` and `lu_solve` let you keep the factors for later.
:::

When $\mathbf{A}$ is **symmetric** (equal to its own transpose) and **positive definite**, like a covariance matrix, a cousin of LU called the **Cholesky** factorization does the job in about half the flops again (`np.linalg.cholesky`; SciPy wraps the whole solve). For a small covariance-like matrix, plain `np.linalg.solve` is already right; never `inv`.

## Measuring size: norm

For a vector, the everyday size is its length: for $(3, -4, 12)$ that is $\sqrt{3^2 + 4^2 + 12^2} = \sqrt{169} = 13$. That length is called the **norm**, written $\lVert\mathbf{v}\rVert$ and read "the norm of v". There are other useful ways to measure size, picked with `ord=`:

```python
v = np.array([3.0, -4.0, 12.0])
print(np.linalg.norm(v))               # 13.0   straight-line length (ord=2)
print(np.linalg.norm(v, ord=1))        # 19.0   sum of sizes: 3 + 4 + 12
print(np.linalg.norm(v, ord=np.inf))   # 12.0   biggest single size
```

- **`ord=2`** (the default for vectors) is the straight-line length. Use it for position errors and speeds.
- **`ord=1`** adds up the sizes. It is the **[[taxicab distance|taxicab]]**.
- **`ord=np.inf`** is the biggest single component. It answers "what is the worst axis?".

For a table of vectors, pass `axis=` just as with the reductions of lesson 6: `np.linalg.norm(P, axis=1)` gives one length per row.

A matrix also has sizes. The default, the **Frobenius norm**, treats the table as one long vector. The one engineers usually mean is **`ord=2`**: the most the matrix can stretch any vector. For $\mathbf{M} = \begin{bmatrix} 2 & 0 \\ 0 & 0.5 \end{bmatrix}$, which doubles $x$ and halves $y$, `norm(M, ord=2)` is $2.0$ and the Frobenius norm is $\sqrt{4 + 0.25} \approx 2.06$.

::: key norm
`np.linalg.norm(v)` is the length $\sqrt{\sum v_i^2}$; `ord=1` sums sizes, `ord=np.inf` takes the largest; `axis=1` gives one norm per row. For a matrix the default is Frobenius, and `ord=2` is the largest stretch (the largest singular value).
:::

## The condition number: how touchy is this matrix?

Picture a see-saw with the pivot close to one end: a tiny push on the short end makes the long end swing wildly. Some matrices are like that: a tiny change in $\mathbf{b}$ — a rounding error, a bit of sensor noise — makes a huge change in the solution $\mathbf{x}$.

The **condition number**, $\kappa(\mathbf{A})$ (read "kappa of A"), measures that. It is the most the matrix stretches any direction divided by the least it stretches any direction. For the matrix $\mathbf{M}$ above, that is $2 \div 0.5 = 4$. NumPy computes it with `np.linalg.cond(A)`. The rule of thumb:

$$
\frac{\lVert \Delta\mathbf{x} \rVert}{\lVert \mathbf{x} \rVert} \;\lesssim\; \kappa(\mathbf{A}) \, \frac{\lVert \Delta\mathbf{b} \rVert}{\lVert \mathbf{b} \rVert}
$$

In words: the relative error in the answer can be up to $\kappa$ times the relative error in the input. The sign $\lesssim$ reads "is at most about".

A `float64` holds about 16 significant digits, so its rounding error is about $10^{-16}$ of each number. If $\kappa = 10^{k}$, you can lose about $k$ of those [[16 digits|digits-lost]]. The Hilbert matrix, with $\kappa \approx 1.6 \times 10^{13}$, can eat 13 of 16 digits. `solve` actually lost about 5 there; the bound is a worst case. A matrix with $\kappa$ near $10^{16}$ or more has nothing left to give. NumPy calls a matrix **singular** when it has no inverse at all — it squashes some direction all the way to zero, so $\kappa$ is infinite.

::: key What the condition number tells you
The factor by which relative input error can be amplified in the solution: a cond of 1e12 means you can lose twelve digits, and double precision has about sixteen. Check cond before trusting a least-squares or covariance result.
:::

::: warning A good residual does not mean a good answer
In the Hilbert example, `solve` gave a residual of $4.7 \times 10^{-16}$ and an answer wrong in the fifth digit. Both are true at once. A small residual says "this $\mathbf{x}$ fits the equations as well as floats can". Only a small condition number says "and nothing else fits nearly as well". Check both.
:::

## Fitting a curve: lstsq

Now suppose you have *more* equations than unknowns. A radar tracks a sounding rocket coasting upward after its motor burns out and gives you 21 altitude readings. You believe the height follows $h(t) = c_0 + c_1 t + c_2 t^2$: a start height, a starting climb rate, and a term from gravity. Three unknowns, 21 equations. With noisy data, no curve passes through every point, so you want the one that misses by the least overall. **Least squares** picks the unknowns that make the sum of squared misses as small as possible:

$$
\min_{\mathbf{c}} \; \lVert \mathbf{A}\mathbf{c} - \mathbf{h} \rVert^2 = \min_{\mathbf{c}} \sum_k \big(c_0 + c_1 t_k + c_2 t_k^2 - h_k\big)^2
$$

Read $\min_{\mathbf{c}}$ as "the smallest value you can get by choosing $\mathbf{c}$". Each row of $\mathbf{A}$, the **design matrix**, holds $(1, t_k, t_k^2)$ for one reading. [[Squaring the misses|why-squares]] makes misses above and below count the same, and makes big misses count extra.

**`np.linalg.lstsq(A, h)`** solves it and returns four things: the best coefficients, the sum of squared residuals, the **rank** of $\mathbf{A}$ (how many truly independent columns it has), and its singular values (see below).

::: example Recovering gravity from noisy altitude telemetry
Simulate the coast: start at $1200\,\mathrm{m}$, climbing at $150\,\mathrm{m/s}$, gravity $9.81\,\mathrm{m/s^2}$, one reading every half second for 10 s, each with $2\,\mathrm{m}$ of noise. Then fit.

```python
import numpy as np

rng = np.random.default_rng(3)
t = np.arange(0.0, 10.5, 0.5)                   # s, 21 samples
h_true = 1200.0 + 150.0 * t - 0.5 * 9.81 * t**2
h = h_true + rng.normal(0.0, 2.0, size=t.size)  # m, 2 m noise

A = np.column_stack([np.ones_like(t), t, t**2])
print(A.shape)
# (21, 3)
coef, res, rank, sv = np.linalg.lstsq(A, h)
print(coef)
# [1199.73799129  149.86831673   -4.88537311]
print(res, rank)
# [119.68279255] 3
print("g estimate:", -2 * coef[2])
# g estimate: 9.77074622200113
print("rms residual:", np.sqrt(res[0] / t.size))
# rms residual: 2.3872956661390217
```

**Step 1.** `np.column_stack` (lesson 7) builds the design matrix: a column of ones for $c_0$, a column of times for $c_1$, a column of squared times for $c_2$. Shape $(21, 3)$: 21 equations, 3 unknowns.

**Step 2.** `lstsq` returns $c_0 \approx 1199.7\,\mathrm{m}$, $c_1 \approx 149.9\,\mathrm{m/s}$ and $c_2 \approx -4.885\,\mathrm{m/s^2}$.

**Step 3.** The model says $c_2 = -\tfrac{1}{2}g$, so $g = -2c_2 \approx 9.77\,\mathrm{m/s^2}$.

**Step 4.** The sum of squared residuals is $119.7\,\mathrm{m^2}$. Divide by 21 and take the square root to get a typical miss of about $2.4\,\mathrm{m}$.

**Sanity check.** $c_0$ and $c_1$ are within $0.1\%$ of the truth and $g$ within $0.5\%$. The typical miss, $2.4\,\mathrm{m}$, is about the $2\,\mathrm{m}$ noise we put in, so the curve fits the trend without chasing the noise. Rank 3 means the three columns are independent.
:::

A straight-line fit is the same with two columns: `np.column_stack([np.ones_like(t), t])`. That is how you estimate a clock drifting at a steady rate, or a gyro bias creeping with temperature.

::: warning Center big time stamps before fitting
If `t` were counted from midnight, so every reading was near $86\,400\,\mathrm{s}$, the columns $1$, $t$ and $t^2$ would look almost like multiples of each other. The condition number of the design matrix jumps from about $1.4 \times 10^{2}$ to about $6.8 \times 10^{18}$ — past the 16 digits a float has. Fit against `t - t.mean()` instead and it drops to about $19$. Always subtract a reference time first.
:::

`lstsq` also copes with a square system that is singular, but for a well-behaved square system it is several times slower than `solve`. The **pseudo-inverse**, `np.linalg.pinv`, is the lookup-book version of `lstsq`, with the same objection as `inv`.

::: key lstsq
`coef, res, rank, sv = np.linalg.lstsq(A, y)` finds the $\mathbf{c}$ that minimizes $\lVert\mathbf{A}\mathbf{c} - \mathbf{y}\rVert^2$ for a tall (more rows than columns) design matrix. Build $\mathbf{A}$ with one column per unknown; check `rank` equals the number of columns.
:::

## Directions that only stretch: eig and eigh

Pull a sheet of rubber sideways. Most arrows drawn on it get turned as well as stretched, but an arrow drawn exactly along the pull only gets longer.

For a matrix, a direction $\mathbf{v}$ that is only stretched, never turned, is an **eigenvector** (the [[word|eigen-word]] is German for "own"), and the stretch factor $\lambda$ ("lambda") is its **eigenvalue**:

$$
\mathbf{A}\mathbf{v} = \lambda\mathbf{v}.
$$

Two functions find them:

- **`np.linalg.eigh(A)`** is for symmetric matrices, where $\mathbf{A}$ equals its transpose. Covariance matrices and inertia tensors are symmetric. It is faster, always returns real numbers, gives eigenvalues in increasing order, and gives eigenvectors at right angles to each other as the *columns* of its second output.
- **`np.linalg.eig(A)`** is for any square matrix. Its answers may be **complex numbers**, and come in no particular order.

::: example Principal axes of a spacecraft
A spacecraft's **[[inertia tensor|principal-axes]]** $\mathbf{J}$ says how hard it is to spin about each axis. Measured in the body frame it is

$$
\mathbf{J} = \begin{bmatrix} 1200 & -30 & 15 \\ -30 & 950 & 40 \\ 15 & 40 & 700 \end{bmatrix}\,\mathrm{kg\,m^2}.
$$

The off-diagonal numbers mean the body axes are not quite the axes it naturally spins about. `eigh` finds those.

```python
import numpy as np
np.set_printoptions(precision=4, suppress=True)

J = np.array([[1200.0,  -30.0,   15.0],
              [ -30.0,  950.0,   40.0],
              [  15.0,   40.0,  700.0]])   # kg m^2
w, V = np.linalg.eigh(J)
print(w)
# [ 693.0058  953.2355 1203.7587]
print(V)
# [[-0.0385  0.1094 -0.9932]
#  [-0.1581  0.9808  0.1142]
#  [ 0.9867  0.1614 -0.0205]]
print(J @ V[:, 0])
# [ -26.7121 -109.5442  683.7716]
print(w[0] * V[:, 0])
# [ -26.7121 -109.5442  683.7716]
print(np.allclose(V @ np.diag(w) @ V.T, J))
# True
print(w.sum(), np.trace(J))
# 2850.0 2850.0
```

**Step 1.** `w` holds the three **principal moments**, smallest first: about $693$, $953$ and $1204\,\mathrm{kg\,m^2}$.

**Step 2.** Each *column* of `V` is an axis. The first column, about $(-0.04, -0.16, 0.99)$, lies close to the body $z$ axis — which makes sense, since $J_{zz} = 700$ was the smallest diagonal entry.

**Step 3.** `J @ V[:, 0]` and `w[0] * V[:, 0]` print the same numbers: multiplying by $\mathbf{J}$ only stretched that axis by $693$. That is the definition, checked.

**Step 4.** $\mathbf{V}\,\mathrm{diag}(\mathbf{w})\,\mathbf{V}^T$ rebuilds $\mathbf{J}$, so the three axes and moments describe it completely.

**Sanity check.** The eigenvalues always add up to the sum of the diagonal (the **trace**): $2850 = 1200 + 950 + 700$. And the moments moved only a little from the diagonal values, as expected when the off-diagonal terms are small.
:::

A rotation of $30°$ about $z$ turns every direction except the axis itself, so `np.linalg.eig` finds an eigenvalue of exactly $1$ with eigenvector `[0, 0, 1]`. Its other two eigenvalues come out complex, `0.866+0.5j` and `0.866-0.5j` — NumPy's way of saying "these directions get turned, not stretched".

::: warning Columns, not rows
The eigenvectors are the **columns** of `V`: `V[:, k]` goes with `w[k]`. Taking `V[k]` (a row) gives a vector that is not an eigenvector at all, and nothing warns you. Check with `A @ v` against `w[k] * v` the first time.
:::

::: key eig and eigh
$\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$. `w, V = np.linalg.eigh(A)` for symmetric $\mathbf{A}$: real eigenvalues ascending, orthonormal eigenvectors in the columns of `V`. `np.linalg.eig(A)` for any square $\mathbf{A}$: possibly complex, unordered.
:::

## Rotate, stretch, rotate: svd

Every matrix, square or not, does the same three things to space: it turns, it stretches along perpendicular directions, and it turns again. A circle of arrows goes in and a tilted ellipse comes out. That is the **singular value decomposition**, or **SVD**:

$$
\mathbf{A} = \mathbf{U}\,\boldsymbol{\Sigma}\,\mathbf{V}^T.
$$

$\mathbf{V}^T$ and $\mathbf{U}$ are the turns (rotations, possibly with a mirror flip). $\boldsymbol{\Sigma}$ ("capital sigma") holds the stretch factors on its diagonal: the **singular values**, $\sigma_1 \geq \sigma_2 \geq \dots \geq 0$, biggest first. They are never negative.

```python
A = np.array([[3.0, 0.0], [4.0, 5.0]])
U, s, Vt = np.linalg.svd(A)
print(s)                                    # [6.70820393 2.23606798]
print(np.allclose(U @ np.diag(s) @ Vt, A))  # True
print(np.linalg.cond(A), s[0] / s[-1])      # 3.000000000000001 3.000000000000001
print(np.linalg.norm(A, ord=2))             # 6.70820393249937
```

`s` is a flat array, and the third output is already $\mathbf{V}^T$, so the rebuild is `U @ np.diag(s) @ Vt`.

The SVD explains the two earlier ideas. The largest stretch, $\sigma_1$, is `norm(A, ord=2)`. The condition number is the largest stretch over the smallest, $\kappa = \sigma_1 / \sigma_n$ — here $6.708 / 2.236 = 3$. In the altitude fit, `lstsq` handed back the singular values $214.1$, $7.15$ and $1.55$, and $214.1 / 1.55 \approx 138$ is the $1.4 \times 10^{2}$ quoted earlier.

If a singular value is zero (or tiny next to $\sigma_1$), the matrix squashes a whole direction flat, and no method can recover what happened along it. The number of singular values that are not tiny is the matrix's **[[rank|rank]]**:

```python
B = np.array([[1.0, 2.0, 1.0],
              [2.0, 4.0, 0.0],
              [3.0, 6.0, 1.0]])
print(np.linalg.svd(B, compute_uv=False))
# [8.43544852e+00 9.18263762e-01 5.39224266e-16]
print(np.linalg.matrix_rank(B))
# 2
np.linalg.solve(B, np.array([1.0, 2.0, 3.0]))
# LinAlgError: Singular matrix
```

The second column is exactly twice the first, so one direction is lost: the third singular value is zero up to rounding, and `matrix_rank` counts 2. In estimation this happens when two unknowns always move together — two thrusters that always fire at once — so the data pin down their sum but never tell them apart.

::: key svd
`U, s, Vt = np.linalg.svd(A)` gives $\mathbf{A} = \mathbf{U}\,\mathrm{diag}(\mathbf{s})\,\mathbf{V}^T$ with singular values `s` in decreasing order. `norm(A, 2)` $= \sigma_1$, `cond(A)` $= \sigma_1 / \sigma_n$, and the rank is the number of singular values that are not negligible.
:::

## Check yourself

::: check
A navigation script does `K = P @ H.T @ np.linalg.inv(S)` to form a filter gain, where `S` is a small symmetric matrix. Rewrite it without `inv`, using `solve`. (Hint: $\mathbf{K}\mathbf{S} = \mathbf{P}\mathbf{H}^T$, and transposing both sides gives $\mathbf{S}^T\mathbf{K}^T = (\mathbf{P}\mathbf{H}^T)^T$.)
:::

::: answer
Multiply $\mathbf{K} = \mathbf{P}\mathbf{H}^T\mathbf{S}^{-1}$ on the right by $\mathbf{S}$: $\mathbf{K}\mathbf{S} = \mathbf{P}\mathbf{H}^T$. `solve` wants the unknown on the right of the matrix, so transpose both sides: $\mathbf{S}^T\mathbf{K}^T = (\mathbf{P}\mathbf{H}^T)^T$. Since $\mathbf{S}$ is symmetric, $\mathbf{S}^T = \mathbf{S}$. So

`K = np.linalg.solve(S, (P @ H.T).T).T`

The columns of $(\mathbf{P}\mathbf{H}^T)^T$ are many right-hand sides, handled with one factorization. It is cheaper and more accurate than forming $\mathbf{S}^{-1}$, and it is how production filters are written.
:::

::: check
For a $1000 \times 1000$ system, estimate the flops for `solve` and for `inv(A) @ b`. If your computer does about $5 \times 10^{10}$ flops per second on this kind of work, roughly how long does each take?
:::

::: answer
`solve`: about $\tfrac{2}{3} \times 1000^3 \approx 6.7 \times 10^{8}$ flops, plus $2 \times 1000^2 = 2 \times 10^{6}$ for the triangle walks, which is negligible. Time $\approx 6.7 \times 10^8 / 5 \times 10^{10} \approx 0.013\,\mathrm{s}$, about 13 ms.

`inv(A) @ b`: about $2 \times 1000^3 = 2 \times 10^9$ flops, plus $2 \times 10^6$ for the multiply. Time $\approx 0.04\,\mathrm{s}$, about 40 ms. Three times the work, as expected.
:::

::: check
A least-squares fit reports `cond` of $10^{9}$ for its design matrix. Your data were measured to about 6 significant digits. Can you trust 6 digits of the fitted coefficients? Explain with the digit-counting rule.
:::

::: answer
No. The relative error in the answer can be up to $\kappa$ times the relative error in the input. Here the input error is about $10^{-6}$ (the measurement is the weak link, not float rounding), so the coefficients could be off by up to $10^{9} \times 10^{-6} = 10^{3}$ — a thousand times their own size. Look for the cause: badly scaled columns (center and scale them) or two unknowns the data cannot tell apart (check the singular values).
:::

::: check
`w, V = np.linalg.eigh(C)` for a $3 \times 3$ covariance matrix of position error gives `w = [0.25, 1.0, 16.0]` in $\mathrm{m^2}$. What is the largest standard deviation of the error, and how do you get the direction it points in?
:::

::: answer
Eigenvalues of a covariance matrix are variances along the eigenvector directions. The largest is $16.0\,\mathrm{m^2}$, so the largest standard deviation is $\sqrt{16} = 4\,\mathrm{m}$. Its direction is the eigenvector that goes with it, the *last column*, `V[:, 2]` (last because `eigh` sorts eigenvalues from smallest to largest). The smallest is $\sqrt{0.25} = 0.5\,\mathrm{m}$, along `V[:, 0]`.
:::

::: check
The singular values of a $4 \times 4$ matrix are $[12, 3, 0.5, 10^{-14}]$. Give its 2-norm, its condition number, and say whether you would call `solve` on it.
:::

::: answer
The 2-norm is the largest singular value, $12$. The condition number is $12 / 10^{-14} = 1.2 \times 10^{15}$. That could eat about 15 of the 16 digits a `float64` holds, so a solution from `solve` would be almost pure rounding noise in one direction. The last singular value is effectively zero: the matrix is numerically rank 3. Rethink the problem (which unknowns cannot be told apart?) or use `lstsq`, which will return the least-squares answer and report the rank.
:::

## Summary

| Tool | What it answers | Remember |
| --- | --- | --- |
| `np.linalg.solve(A, b)` | $\mathbf{x}$ with $\mathbf{A}\mathbf{x} = \mathbf{b}$ | LU, about $\tfrac{2}{3}n^3$ flops; check the residual |
| `np.linalg.inv(A)` | the whole inverse matrix | about $2n^3$ flops and extra rounding; rarely needed |
| `np.linalg.norm(v, ord=)` | size of a vector or matrix | 2: length; 1: sum; `inf`: biggest; `axis=1` per row |
| `np.linalg.cond(A)` | how much errors can grow | $\kappa = \sigma_1/\sigma_n$; $10^k$ loses about $k$ of 16 digits |
| `np.linalg.lstsq(A, y)` | best fit for more equations than unknowns | returns `coef, res, rank, sv`; center time stamps |
| `np.linalg.eigh(A)` | stretch-only directions of a symmetric matrix | ascending, real, eigenvectors in columns |
| `np.linalg.eig(A)` | the same for any square matrix | may be complex, unordered |
| `np.linalg.svd(A)` | rotate, stretch, rotate | $\mathbf{A} = \mathbf{U}\,\mathrm{diag}(\mathbf{s})\,\mathbf{V}^T$; rank = count of non-tiny $\sigma$ |

Every number in this lesson came out of floats that round. The next lesson looks straight at that rounding: why `0.1 + 0.2` misbehaves in arrays too, how to compare with `allclose`, and why subtracting two nearly equal numbers can wreck an answer the way a big condition number does.

::: context lu-picture Two triangles
Elimination turns a full square into a staircase. The steps you used are recorded in a lower triangle; the staircase itself is the upper triangle. Multiply them and you get the original matrix back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="20" width="80" height="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="54" y="66" font-size="16" text-anchor="middle" fill="#1f2a44">A</text>
  <text x="112" y="66" font-size="18" text-anchor="middle" fill="#1f2a44">=</text>
  <rect x="132" y="20" width="80" height="80" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="132,20 132,100 212,100" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="156" y="86" font-size="16" text-anchor="middle" fill="#1f2a44">L</text>
  <rect x="236" y="20" width="80" height="80" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="236,20 316,20 316,100" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="296" y="48" font-size="16" text-anchor="middle" fill="#fff">U</text>
  <text x="224" y="66" font-size="14" text-anchor="middle" fill="#1f2a44">×</text>
  <text x="172" y="114" font-size="11" text-anchor="middle" fill="#6c7a93">zeros above</text>
  <text x="276" y="114" font-size="11" text-anchor="middle" fill="#6c7a93">zeros below</text>
</svg>
```

A triangle is quick to solve: the last row of $\mathbf{U}$ has one unknown, the row above has two, one of which you now know, and so on up. In practice LAPACK also swaps rows as it goes, to avoid dividing by tiny numbers.
:::

::: context lapack The library under np.linalg
LAPACK, short for "Linear Algebra PACKage", was first released in 1992 as a Fortran library. It sits on top of BLAS, the "Basic Linear Algebra Subprograms", which do the raw multiply-and-add loops tuned for each kind of processor. NumPy, SciPy, MATLAB, Julia and Eigen-based C++ code all end up calling LAPACK or a close copy. So `np.linalg.solve` in a notebook and the solver in a flight-dynamics tool are often the same routine underneath — which is why their answers agree to the last digit.
:::

::: context flop What a flop is
A flop is one floating-point operation: one addition, subtraction, multiplication or division of two floats. Counting flops is a quick way to compare methods before you time anything. The count grows as $n^3$ for factorizing an $n \times n$ matrix because there are about $n$ elimination steps, and each one updates up to $n \times n$ entries. Double $n$ and the work goes up eight times. A modern laptop core does billions of flops per second on this kind of work, and many cores together do tens of billions.
:::

::: context hilbert The Hilbert matrix
David Hilbert, a German mathematician, studied this matrix in 1894 while fitting polynomials. It turns up whenever you fit a polynomial with columns $1, t, t^2, \dots$ over an interval starting at zero — the same trap as the uncentered time stamps in this lesson. Its condition number grows roughly 30 times with each extra row: about $1.5 \times 10^{7}$ at size 6, $1.6 \times 10^{13}$ at size 10, and past $10^{16}$ at size 12, where a float64 has no correct digits left to give. That makes it a favorite test case for solvers.
:::

::: context taxicab Why it is called the taxicab norm
A taxi in a city laid out in square blocks cannot drive diagonally through buildings. To go 3 blocks east and 4 blocks north it drives $3 + 4 = 7$ blocks, even though a bird would fly only 5. The 1-norm adds up the sizes of the components the same way, so it is also called the Manhattan distance. In GNC it shows up in fuel budgets: a thruster that can only push along one axis at a time spends fuel in proportion to the sum of the sizes, not the straight-line length.
:::

::: context digits-lost Digits eaten by the condition number
A float64 carries about 16 significant digits. A condition number of $10^{k}$ can use up about $k$ of them, leaving roughly $16 - k$ you can trust.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="14" y="18" font-size="12" fill="#1f2a44">16 digits of a float64</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="14" y="28" width="20" height="22" fill="#1d6fd1"/><rect x="34" y="28" width="20" height="22" fill="#1d6fd1"/><rect x="54" y="28" width="20" height="22" fill="#1d6fd1"/>
    <rect x="74" y="28" width="20" height="22" fill="#b4232c"/><rect x="94" y="28" width="20" height="22" fill="#b4232c"/><rect x="114" y="28" width="20" height="22" fill="#b4232c"/>
    <rect x="134" y="28" width="20" height="22" fill="#b4232c"/><rect x="154" y="28" width="20" height="22" fill="#b4232c"/><rect x="174" y="28" width="20" height="22" fill="#b4232c"/>
    <rect x="194" y="28" width="20" height="22" fill="#b4232c"/><rect x="214" y="28" width="20" height="22" fill="#b4232c"/><rect x="234" y="28" width="20" height="22" fill="#b4232c"/>
    <rect x="254" y="28" width="20" height="22" fill="#b4232c"/><rect x="274" y="28" width="20" height="22" fill="#b4232c"/><rect x="294" y="28" width="20" height="22" fill="#b4232c"/>
    <rect x="314" y="28" width="20" height="22" fill="#b4232c"/>
  </g>
  <text x="44" y="68" font-size="11" text-anchor="middle" fill="#1d6fd1">3 safe</text>
  <text x="204" y="68" font-size="11" text-anchor="middle" fill="#b4232c">13 at risk when cond ≈ 1e13 (Hilbert, size 10)</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="14" y="84" width="20" height="22" fill="#1d6fd1"/><rect x="34" y="84" width="20" height="22" fill="#1d6fd1"/><rect x="54" y="84" width="20" height="22" fill="#1d6fd1"/>
    <rect x="74" y="84" width="20" height="22" fill="#1d6fd1"/><rect x="94" y="84" width="20" height="22" fill="#1d6fd1"/><rect x="114" y="84" width="20" height="22" fill="#1d6fd1"/>
    <rect x="134" y="84" width="20" height="22" fill="#1d6fd1"/><rect x="154" y="84" width="20" height="22" fill="#1d6fd1"/><rect x="174" y="84" width="20" height="22" fill="#1d6fd1"/>
    <rect x="194" y="84" width="20" height="22" fill="#1d6fd1"/><rect x="214" y="84" width="20" height="22" fill="#1d6fd1"/><rect x="234" y="84" width="20" height="22" fill="#1d6fd1"/>
    <rect x="254" y="84" width="20" height="22" fill="#1d6fd1"/><rect x="274" y="84" width="20" height="22" fill="#1d6fd1"/>
    <rect x="294" y="84" width="20" height="22" fill="#b4232c"/><rect x="314" y="84" width="20" height="22" fill="#b4232c"/>
  </g>
  <text x="174" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">cond ≈ 1e2 (centered altitude fit): 14 safe, 2 at risk</text>
</svg>
```

It is a worst case. Often fewer digits are lost, as with `solve` on the Hilbert matrix, but you cannot count on that.
:::

::: context why-squares Why squares, and who thought of it
Squaring does two useful things. A miss of $-3$ and a miss of $+3$ count the same, so misses cannot cancel. And the best answer comes out of a linear system, which computers solve quickly. Adrien-Marie Legendre published the method in 1805. Carl Friedrich Gauss said he had used it since 1795, and in 1801 he used his orbit methods to predict where the newly found dwarf planet Ceres would reappear after it was lost in the Sun's glare. Astronomers found it there. Orbit determination has been a least-squares problem ever since.
:::

::: context eigen-word Where "eigen" comes from
"Eigen" is German for "own" or "characteristic", as in *eigene*, "one's own". An eigenvector is a matrix's own direction: the one it leaves pointing the same way. Hilbert used it in 1904 for "eigenfunctions", and English-speaking mathematicians later borrowed it half-translated, as "eigenvalue" and "eigenvector". You will meet it again in the control modules, where the eigenvalues of a system matrix decide whether a controller is stable.
:::

::: context principal-axes Why spacecraft care about principal axes
Spin a body about one of its principal axes and it keeps spinning about that axis cleanly. Spin it about any other axis and it wobbles. Spinning satellites are balanced so their spin axis is a principal axis. Explorer 1, the first US satellite, in 1958, was spun about its long axis — the axis of *smallest* moment. Its flexible wire antennas slowly dissipated energy, and soon after launch it was tumbling end over end about the axis of *largest* moment. That surprise taught engineers the major-axis rule: a spinning body that loses energy ends up spinning about the axis of largest moment of inertia.
:::

::: context rank Rank: how many directions survive
The rank of a matrix is the number of independent directions it keeps. A $2 \times 2$ matrix of rank 2 turns a disk into an ellipse: stretched, but still two-dimensional. A $2 \times 2$ matrix of rank 1 squashes the disk flat onto a line. In three dimensions, rank 2 flattens space onto a plane, like a shadow on a wall.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <circle cx="70" cy="68" r="42" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">input: a disk</text>
  <line x1="122" y1="68" x2="158" y2="68" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="164,68 154,63 154,73" fill="#1f2a44"/>
  <ellipse cx="220" cy="68" rx="46" ry="16" transform="rotate(-20 220 68)" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">rank 2: ellipse</text>
  <line x1="286" y1="98" x2="346" y2="38" stroke="#b4232c" stroke-width="4"/>
  <text x="316" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">rank 1: line</text>
</svg>
```

In an estimation problem, a rank less than the number of unknowns means some combination of unknowns has no effect on the data at all, so the data cannot tell you its value.
:::
