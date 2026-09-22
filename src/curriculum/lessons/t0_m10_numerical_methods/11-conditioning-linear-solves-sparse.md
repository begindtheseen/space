---
id: l11-conditioning-linear-solves-sparse
title: Conditioning, stable linear solves and sparse matrices
minutes: 30
covers:
  - conditioning and stability of linear solves, sparse matrices
---

Almost every method in this module ends in a linear solve. Newton's step for a targeting or trim problem solves $\mathbf{J}\boldsymbol{\delta} = -\mathbf{f}$. The implicit ODE step of the stiffness lesson solves $(\mathbf{I} - h\beta\mathbf{J})\boldsymbol{\delta} = -\mathbf{G}$. The cubic spline solves a tridiagonal system for its moments. A Kalman update solves $\mathbf{S}\mathbf{k} = \mathbf{z}$ with $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^{\mathsf T} + \mathbf{R}$. A least-squares orbit determination solves the normal equations. A convex landing solver solves a KKT system at every interior-point iteration. If $\mathbf{A}\mathbf{x} = \mathbf{b}$ cannot be trusted, none of those can.

Two distinct things decide whether it can be trusted, and confusing them is the most common mistake in this area. **Conditioning** is a property of the *problem*: how much the answer moves when the data moves, which is set by the matrix and nothing else. **Stability** is a property of the *algorithm*: how much extra error the arithmetic adds on top. A well-conditioned problem solved by an unstable algorithm gives a wrong answer. An ill-conditioned problem solved by the best algorithm in the world also gives a wrong answer — and no better algorithm exists, because the information is not in the data. You fix the first by choosing the algorithm and the second by reformulating the problem.

This lesson quantifies both, shows where ill-conditioning comes from in GNC work — units, epoch offsets, normal equations, observation geometry — and then turns to the other half of the practical question: when the matrix is large, its *structure* decides whether the solve is affordable at all, and a tridiagonal or banded system costs $O(n)$ where a dense one costs $O(n^3)$.

## Conditioning

Suppose $\mathbf{A}\mathbf{x} = \mathbf{b}$ and the right-hand side is perturbed to $\mathbf{b} + \delta\mathbf{b}$, giving $\mathbf{x} + \delta\mathbf{x}$. Then $\mathbf{A}\,\delta\mathbf{x} = \delta\mathbf{b}$, so $\delta\mathbf{x} = \mathbf{A}^{-1}\delta\mathbf{b}$ and $\lVert\delta\mathbf{x}\rVert \le \lVert\mathbf{A}^{-1}\rVert\,\lVert\delta\mathbf{b}\rVert$. Also $\lVert\mathbf{b}\rVert \le \lVert\mathbf{A}\rVert\,\lVert\mathbf{x}\rVert$. Multiplying the two:

$$
\frac{\lVert\delta\mathbf{x}\rVert}{\lVert\mathbf{x}\rVert}
\;\le\;
\underbrace{\lVert\mathbf{A}\rVert\,\lVert\mathbf{A}^{-1}\rVert}_{\kappa(\mathbf{A})}\;
\frac{\lVert\delta\mathbf{b}\rVert}{\lVert\mathbf{b}\rVert} .
$$

$\kappa(\mathbf{A}) = \lVert\mathbf{A}\rVert\lVert\mathbf{A}^{-1}\rVert$ is the **condition number**. It is the amplification factor from relative error in the data to relative error in the answer, and it is the whole story. In the 2-norm it equals the ratio of the largest to the smallest singular value, $\kappa_2 = \sigma_{\max}/\sigma_{\min}$, and for a symmetric positive-definite matrix that is $\lambda_{\max}/\lambda_{\min}$. Different norms give different numbers, but never by more than a factor of the dimension, so the order of magnitude — which is all that matters — is norm-independent.

The rule of thumb follows immediately. The data you feed a solver is at best correct to a relative $\varepsilon \approx 2.2\times10^{-16}$, so the answer is at best correct to $\kappa(\mathbf{A})\,\varepsilon$: **you lose $\log_{10}\kappa$ decimal digits**. At $\kappa = 10^{8}$ you have eight digits left. At $\kappa = 10^{16}$ you have none, and the matrix is numerically singular.

::: key
The condition number $\kappa(\mathbf{A}) = \lVert\mathbf{A}\rVert\lVert\mathbf{A}^{-1}\rVert = \sigma_{\max}/\sigma_{\min}$ bounds the amplification of relative error: $\lVert\delta\mathbf{x}\rVert/\lVert\mathbf{x}\rVert \le \kappa(\mathbf{A})\,\lVert\delta\mathbf{b}\rVert/\lVert\mathbf{b}\rVert$. A solve in `float64` loses about $\log_{10}\kappa$ significant digits, so $\kappa \gtrsim 10^{16}$ means no digits survive. Conditioning is a property of the problem; no algorithm can beat it.
:::

## Stability, and why the residual tells you nothing

Gaussian elimination with partial pivoting — pick the largest available entry in the column as the pivot, swap rows, eliminate — is **backward stable**. The computed $\hat{\mathbf{x}}$ is the *exact* solution of a nearby problem: there is a perturbation $\delta\mathbf{A}$ with

$$
(\mathbf{A} + \delta\mathbf{A})\,\hat{\mathbf{x}} = \mathbf{b},
\qquad
\frac{\lVert\delta\mathbf{A}\rVert}{\lVert\mathbf{A}\rVert} \lesssim c(n)\,\rho\,\varepsilon,
$$

where $\rho$ is the *growth factor*, the largest entry appearing during elimination divided by the largest entry of $\mathbf{A}$. Partial pivoting keeps $\rho$ small in practice — pathological matrices where it grows like $2^{n-1}$ exist but essentially never arise. The forward error then obeys the conditioning bound, $\lVert\hat{\mathbf{x}} - \mathbf{x}\rVert/\lVert\mathbf{x}\rVert \lesssim \kappa(\mathbf{A})\,c(n)\rho\varepsilon$.

An immediate consequence catches people out. Backward stability means the *residual* $\mathbf{r} = \mathbf{b} - \mathbf{A}\hat{\mathbf{x}}$ is always tiny, whatever $\kappa$ is. So a small residual proves nothing about the error. The correct relation is

$$
\frac{\lVert\hat{\mathbf{x}} - \mathbf{x}\rVert}{\lVert\mathbf{x}\rVert} \le \kappa(\mathbf{A})\,\frac{\lVert\mathbf{r}\rVert}{\lVert\mathbf{b}\rVert} ,
$$

with the condition number standing between the two.

::: example A tiny residual and a 100% error
Take

$$
\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & 1.0001\end{pmatrix},
\qquad \mathbf{b} = \begin{pmatrix}2 \\ 2.0001\end{pmatrix},
\qquad \kappa_\infty(\mathbf{A}) = 4.0004\times10^{4} .
$$

The true solution is $\mathbf{x} = (1, 1)$. Offer the candidate $\hat{\mathbf{x}} = (0, 2)$ instead. Its residual is $\mathbf{r} = (0,\,-10^{-4})$, a relative $\lVert\mathbf{r}\rVert/\lVert\mathbf{b}\rVert = 5\times10^{-5}$ — by any residual-based convergence test, an excellent answer. Its relative error is $1.0$: every component is wrong by 100%. The bound is satisfied exactly as advertised, $\kappa \times 5\times10^{-5} = 2.0$, which permits a 200% error and a 100% one happened.

Do not accept a Newton step, a filter update or a trim solution because the residual is small. Check $\kappa$, or better, check the answer against something physical.
:::

::: example Conditioning and stability are different failures
The system

$$
\begin{pmatrix} 10^{-20} & 1 \\ 1 & 1 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 1 \\ 2\end{pmatrix}
$$

has $\kappa_2 = 2.618$: as well conditioned as a matrix gets. Its exact solution is $\mathbf{x} = (1, 1)$ to twenty digits. Gaussian elimination *without* pivoting takes $10^{-20}$ as its first pivot, forms the multiplier $10^{20}$, and computes $1 - 10^{20}$, which in `float64` rounds to $-10^{20}$: the information in the original entry is annihilated. The answer comes out $(0, 1)$ — the first component is not merely inaccurate, it is completely wrong. With partial pivoting the rows are swapped first and the answer is $(1, 1)$ exactly.

Nothing about the problem changed. The failure was entirely in the algorithm. That is what "unstable" means, and it is why every library solver pivots and why you should never write your own elimination without it — with one exception, the diagonally dominant tridiagonal system of the spline lesson, where no pivot can be small.
:::

::: example Losing digits to conditioning alone
Hilbert matrices, $H_{ij} = 1/(i+j+1)$, are the standard badly conditioned test case, and they arise naturally: they are the normal-equation matrices of polynomial least-squares fitting in the monomial basis on $[0,1]$. Solve $\mathbf{H}\mathbf{x} = \mathbf{b}$ where $\mathbf{b}$ is the row sums, so the exact answer is $\mathbf{x} = (1, 1, \ldots, 1)$, using Gaussian elimination with partial pivoting in `float64`:

| $n$ | $\kappa_\infty(\mathbf{H})$ (exact) | $\kappa\varepsilon$ | measured $\max\lvert\hat x_i - 1\rvert$ | relative residual |
| --- | --- | --- | --- | --- |
| 4 | $2.84\times10^{4}$ | $6.3\times10^{-12}$ | $6.1\times10^{-13}$ | $1.1\times10^{-16}$ |
| 6 | $2.91\times10^{7}$ | $6.5\times10^{-9}$ | $5.3\times10^{-10}$ | $9.1\times10^{-17}$ |
| 8 | $3.39\times10^{10}$ | $7.5\times10^{-6}$ | $4.2\times10^{-7}$ | $1.6\times10^{-16}$ |
| 10 | $3.54\times10^{13}$ | $7.9\times10^{-3}$ | $3.2\times10^{-4}$ | $3.0\times10^{-16}$ |

The residual column is flat at machine precision for every $n$: the algorithm is doing its job perfectly. The error column tracks $\kappa\varepsilon$, staying about a factor of ten inside the bound. At $n = 10$ you have lost thirteen of your sixteen digits, and the only cure is to change the problem — fit in a Legendre or Chebyshev basis rather than the monomial basis, which makes the same fit well conditioned.
:::

## Where the conditioning comes from

In GNC, ill-conditioning is rarely intrinsic. It is usually manufactured by a choice the engineer made, and four choices account for most of it.

### Units

A condition number is not invariant under a change of units, because scaling a column of $\mathbf{A}$ scales the corresponding unknown.

::: example A GPS solve wrecked by carrying the clock bias in seconds
The GPS least-squares geometry matrix has one row per satellite, $\left(-\hat{\mathbf{u}}_i^{\mathsf T},\ 1\right)$, with $\hat{\mathbf{u}}_i$ the unit line-of-sight vector; the four unknowns are the three position corrections and the receiver clock bias *expressed as a range*. Take four satellites at (azimuth, elevation) of $(0^\circ, 80^\circ)$, $(30^\circ, 20^\circ)$, $(150^\circ, 20^\circ)$ and $(270^\circ, 20^\circ)$: $\kappa_2(\mathbf{G}) = 4.61$, and the geometric dilution of precision, $\mathrm{GDOP} = \sqrt{\operatorname{tr}\left[(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\right]}$, is $2.42$.

Now carry the clock bias in *seconds* instead of metres. The last column becomes $c = 2.998\times10^{8}$ instead of 1 — the same physics, one different unit — and $\kappa_2(\mathbf{G})$ becomes $7.20\times10^{8}$. Nine digits gone, and the fix is a scaling, not a better solver.
:::

The general cure is **equilibration**: scale rows and columns so that all entries are of comparable magnitude, solve the scaled system, and unscale. For a filter, scale each state by its own expected standard deviation, which makes the covariance dimensionless and its diagonal of order 1. A covariance with $10\,\mathrm{m}$ position uncertainty and $1\,\mathrm{mm/s}$ velocity uncertainty is $\mathbf{P} = \operatorname{diag}(100\,\mathrm{m^2},\ 10^{-6}\,\mathrm{m^2/s^2})$, with $\kappa_2 = 10^{8}$ before you have done anything at all; scaling by the sigmas gives $\kappa_2 = 1$ exactly.

### Epoch offsets

::: example A tracking pass fitted from the wrong time origin
Fit $r(t) = a + bt$ to eleven range samples spaced $6\,\mathrm{s}$ apart across a one-minute pass. If $t$ is seconds since an epoch a day earlier, the samples run from $86{,}400$ to $86{,}460\,\mathrm{s}$, and the design matrix has columns $(1,1,\ldots)$ and $(86400, 86406, \ldots)$ which are nearly parallel: $\kappa_2(\mathbf{A}) = 3.94\times10^{8}$. Re-centre time on the middle of the pass, so $t$ runs from $-30$ to $+30\,\mathrm{s}$, and $\kappa_2(\mathbf{A}) = 18.97$. Same data, same fit, seven orders of magnitude of conditioning, for the cost of a subtraction.
:::

### Normal equations

The least-squares problem $\min\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert$ is classically solved through the normal equations $\mathbf{A}^{\mathsf T}\mathbf{A}\mathbf{x} = \mathbf{A}^{\mathsf T}\mathbf{b}$. That is a trap, because

$$
\kappa_2(\mathbf{A}^{\mathsf T}\mathbf{A}) = \kappa_2(\mathbf{A})^2 .
$$

Squaring the condition number doubles the digits lost. In the tracking-pass example, $\kappa_2(\mathbf{A}) = 3.94\times10^{8}$ becomes $\kappa_2(\mathbf{A}^{\mathsf T}\mathbf{A}) = 1.55\times10^{17}$ — past the point where `float64` has anything left. You can watch it happen in the arithmetic. The exact normal matrix is

$$
\mathbf{A}^{\mathsf T}\mathbf{A} = \begin{pmatrix} 11 & 950730 \\ 950730 & 82171597860 \end{pmatrix},
$$

and its determinant is $903{,}887{,}576{,}460 - 903{,}887{,}532{,}900 = 43{,}560$: two numbers agreeing in their first seven digits, differenced. That is the catastrophic cancellation of the first lesson, built into the method.

The cure is to never form $\mathbf{A}^{\mathsf T}\mathbf{A}$. Factor $\mathbf{A} = \mathbf{Q}\mathbf{R}$ with $\mathbf{Q}$ orthogonal and solve $\mathbf{R}\mathbf{x} = \mathbf{Q}^{\mathsf T}\mathbf{b}$: the accuracy then depends on $\kappa(\mathbf{A})$, not its square, because an orthogonal transformation has condition number exactly 1 and cannot amplify anything. This is why serious orbit-determination and calibration software is built on QR or on singular value decomposition rather than on normal equations, and why **square-root filters** exist: a square-root or UD filter propagates a factor $\mathbf{S}$ with $\mathbf{P} = \mathbf{S}\mathbf{S}^{\mathsf T}$ instead of $\mathbf{P}$ itself, and since $\kappa(\mathbf{S}) = \sqrt{\kappa(\mathbf{P})}$ it works in half the digits. The $\mathbf{P}$ above with $\kappa = 10^{8}$ has a factor with $\kappa = 10^{4}$. A square-root filter also cannot produce a covariance that is not positive semi-definite, because $\mathbf{S}\mathbf{S}^{\mathsf T}$ never is — which is the failure mode the floating-point lesson described, a filter quietly losing positive-definiteness through cancellation in $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$. The Joseph form $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf T} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf T}$ is the cheaper partial fix, symmetric by construction.

### Geometry

Sometimes the conditioning is physical and no reformulation helps: the measurements genuinely do not determine the state. Clustered GPS satellites at $(20^\circ, 55^\circ)$, $(35^\circ, 62^\circ)$, $(50^\circ, 58^\circ)$ and $(38^\circ, 70^\circ)$ give $\kappa_2(\mathbf{G}) = 368$, $\kappa_2(\mathbf{G}^{\mathsf T}\mathbf{G}) = 1.36\times10^{5}$ and $\mathrm{GDOP} = 131$ against the well-spread geometry's $2.42$ — a position solution 54 times noisier from the same ranging accuracy. The same shape appears as weak observability of a gyro bias over a short arc, or a station-keeping burn whose effect on two orbital elements is nearly collinear. Here $\kappa$ is telling you something true about the experiment, and the answer is more or better-placed measurements, a longer arc, or a prior — not a better linear solver.

## Never invert the matrix

The Newton lesson said to solve $\mathbf{J}\boldsymbol{\delta} = -\mathbf{f}$ rather than form $\mathbf{J}^{-1}$. Here is why. Computing an explicit inverse costs about $2n^3$ operations against $n^3/3$ for an LU factorisation, and then each use costs another $n^2$ for the matrix-vector product, so it is roughly six times the work. It is also less accurate: the product $\mathbf{J}^{-1}\mathbf{f}$ commits $n$ extra rounding errors per component with no backward-stability guarantee, where a triangular solve has one. And for a structured matrix it is a disaster — the inverse of a tridiagonal matrix is completely dense, so inverting the spline system turns $O(n)$ work and $O(n)$ storage into $O(n^3)$ and $O(n^2)$.

Factor once, solve many times. If you need $\mathbf{J}^{-1}$ applied to twenty right-hand sides, compute the LU factorisation once ($n^3/3$) and do twenty triangular solves ($n^2$ each). The only legitimate reason to form an inverse is that you need its *entries* — the diagonal of $(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$ for a GDOP, or a covariance to report — and even then there are better routes.

## Sparse matrices

A matrix is **sparse** when enough of its entries are zero that it pays to exploit them. Almost every large matrix in GNC is, because the structure comes from the physics:

- The spline moment equations are **tridiagonal**: each knot couples only to its neighbours.
- A collocation or multiple-shooting discretisation of a trajectory is **block banded**: node $k$'s defect constraint involves only nodes $k$ and $k+1$, so the Jacobian has bandwidth about twice the state dimension.
- The implicit-ODE matrix $\mathbf{I} - h\beta\mathbf{J}$ inherits the sparsity of $\mathbf{J}$, which for a vehicle model with local couplings is mostly zero.
- A large estimation problem — bundle adjustment, batch orbit determination over many passes, SLAM — has an information matrix that is block sparse because each measurement touches few states.

Sparsity changes the cost class. A dense LU is $n^3/3$ operations and $n^2$ storage. A tridiagonal solve is about $8n$ operations and $3n$ storage. A banded solve with bandwidth $b$ is about $2nb^2$:

| $n$ | dense $n^3/3$ | banded, $b = 13$ | tridiagonal |
| --- | --- | --- | --- |
| 100 | $3.3\times10^{5}$ | $3.4\times10^{4}$ | 800 |
| 1,000 | $3.3\times10^{8}$ | $3.4\times10^{5}$ | 8,000 |
| 10,000 | $3.3\times10^{11}$ | $3.4\times10^{6}$ | 80,000 |

For a trajectory optimisation with 100 nodes and a 6-state vehicle — 600 unknowns in the block-banded part — a dense factorisation is $7.2\times10^{7}$ operations and a banded one is $1.7\times10^{5}$, a factor of 417. That factor is the difference between a landing solver that closes its guidance loop at 1 Hz and one that does not.

### Fill-in is the whole problem

Sparsity is not preserved by elimination. When row $i$ is updated by row $k$, every column where row $k$ is nonzero becomes nonzero in row $i$ — including columns that were zero. Those new nonzeros are **fill-in**, and how much you get depends entirely on the order in which you eliminate.

::: example The same matrix, two orderings
An *arrow* matrix is diagonal except for one dense row and one dense column. It appears whenever one variable couples to everything — a total mass, a common clock bias, a global scale factor. With $n = 200$ it has 598 nonzeros.

Eliminate with the dense row and column *first*: the first elimination step updates every remaining row in every column, and $\mathbf{L} + \mathbf{U}$ ends up with $40{,}000$ nonzeros — completely dense, 100% fill, and the solve costs the full $n^3/3$.

Renumber so the dense row and column come *last*, and eliminate: each of the first $n-1$ steps touches only the diagonal entry and the final row and column, and $\mathbf{L} + \mathbf{U}$ has 598 nonzeros. No fill at all, and the solve is $O(n)$.

Identical matrix, identical arithmetic, one renumbering of the unknowns, and a factor of 67 in storage and more than a thousand in work.
:::

Finding the ordering that minimises fill is NP-hard, so sparse libraries use heuristics — approximate minimum degree, nested dissection — in a *symbolic analysis* phase that runs once on the sparsity pattern, before any numbers are touched. Because the pattern of a GNC problem is fixed by the problem structure and not by the data, that analysis is done once and reused for every subsequent factorisation. Tridiagonal and banded matrices need no reordering at all: elimination in the natural order produces no fill, which is exactly why the Thomas algorithm of the spline lesson works and why it needs no pivoting, the matrix being diagonally dominant.

### Iterative methods

When $n$ reaches the millions, even a sparse factorisation is too much, and you turn to iterative methods that only ever multiply by $\mathbf{A}$. **Conjugate gradient** for symmetric positive-definite systems is the canonical one; **GMRES** handles the general case. Each iteration costs one matrix-vector product, $O(\mathrm{nnz})$, and the convergence rate depends on — conditioning again. For conjugate gradient the error after $k$ iterations is bounded by

$$
\frac{\lVert\mathbf{e}_k\rVert_{\mathbf{A}}}{\lVert\mathbf{e}_0\rVert_{\mathbf{A}}} \le 2\left(\frac{\sqrt{\kappa} - 1}{\sqrt{\kappa} + 1}\right)^{k},
$$

so the iteration count scales as $\sqrt{\kappa}$. That is why a **preconditioner** — an approximate inverse $\mathbf{M}^{-1} \approx \mathbf{A}^{-1}$ applied to both sides, so that $\kappa(\mathbf{M}^{-1}\mathbf{A}) \ll \kappa(\mathbf{A})$ — is not an optimisation but the method: an unpreconditioned Krylov solver on a realistic problem does not converge in usable time. For GNC-sized problems, though, direct sparse factorisation is almost always the right answer; iterative methods belong to the CFD and structural-analysis end of the building.

### Determinism in flight software

A real-time solver needs a bounded worst-case execution time, and the two properties above make that achievable. A direct sparse factorisation on a *fixed* sparsity pattern does exactly the same arithmetic, in the same order, every time it runs: the symbolic analysis is done once offline, the floating-point operation count is a compile-time constant, and there is no data-dependent branching except pivot selection, which can be fixed in advance for a structurally stable pattern. This is what makes onboard convex-optimisation guidance possible — a powered-descent solver runs a fixed number of interior-point iterations, each solving a KKT system with an unchanging sparsity pattern, and its worst-case time can be certified. An iterative solver, whose iteration count depends on the data, could not be.

## Check yourself

::: check
A Newton solve for a trim problem reports a residual of $10^{-12}$ relative to the right-hand side, and the Jacobian's condition number is $3\times10^{9}$. How many digits of the answer can you rely on?
:::

::: answer
The bound is $\lVert\hat{\mathbf{x}} - \mathbf{x}\rVert/\lVert\mathbf{x}\rVert \le \kappa\,\lVert\mathbf{r}\rVert/\lVert\mathbf{b}\rVert = 3\times10^{9}\times10^{-12} = 3\times10^{-3}$: about two and a half digits, not twelve. Separately, even with an exact right-hand side, the data itself is only good to $\varepsilon$, so $\kappa\varepsilon = 6.7\times10^{-7}$ is the floor — about six digits. Which of the two dominates depends on where the $10^{-12}$ residual came from; in either case the twelve digits in the residual are not digits of the answer. If the trim variables include an angle in radians and a thrust in newtons, a $\kappa$ of $3\times10^{9}$ is probably a units artefact worth removing before anything else.
:::

::: check
Why does solving the normal equations lose twice as many digits as a QR factorisation on the same least-squares problem?
:::

::: answer
$\kappa_2(\mathbf{A}^{\mathsf T}\mathbf{A}) = \kappa_2(\mathbf{A})^2$, because the singular values of $\mathbf{A}^{\mathsf T}\mathbf{A}$ are the squares of those of $\mathbf{A}$, so $\sigma_{\max}^2/\sigma_{\min}^2$. Digits lost is $\log_{10}\kappa$, so squaring $\kappa$ doubles the loss. QR writes $\mathbf{A} = \mathbf{Q}\mathbf{R}$ with $\mathbf{Q}$ orthogonal and solves $\mathbf{R}\mathbf{x} = \mathbf{Q}^{\mathsf T}\mathbf{b}$; an orthogonal matrix has $\kappa_2 = 1$ and preserves the 2-norm exactly, so the accuracy depends on $\kappa(\mathbf{R}) = \kappa(\mathbf{A})$. Concretely, the tracking-pass fit in this lesson has $\kappa(\mathbf{A}) = 3.9\times10^{8}$, leaving about eight digits through QR and none at all through the normal equations, where $\kappa = 1.6\times10^{17}$.
:::

::: check
A batch orbit-determination solver runs on a 4,000-state problem whose information matrix is block sparse with bandwidth about 40 after reordering. Estimate the cost against a dense solve, and say what the symbolic analysis phase buys you.
:::

::: answer
Dense: $n^3/3 = 4000^3/3 = 2.1\times10^{10}$ operations. Banded with $b = 40$: about $2nb^2 = 2\times4000\times1600 = 1.3\times10^{7}$. A factor of about 1,600, which turns a solve of minutes into one of milliseconds — and the storage falls from $1.6\times10^{7}$ entries to about $3\times10^{5}$. The symbolic analysis finds the ordering that produces that bandwidth (or that small fill) from the sparsity pattern alone, before any numeric values exist. Because the pattern is fixed by the measurement structure and does not change from one batch to the next, it is computed once and reused for every subsequent numeric factorisation, so its cost is amortised to nothing.
:::

::: check
You are told that a matrix with $\kappa = 10^{14}$ appeared in a filter and that switching from Gaussian elimination to a "more stable" solver fixed the problem. What actually happened?
:::

::: answer
Not what was claimed. Backward stability says Gaussian elimination with partial pivoting already produces the exact solution of a problem within $\varepsilon$ of the one posed; no solver can do better, and none can recover the fourteen digits that $\kappa = 10^{14}$ has destroyed. Three explanations are plausible. The original code may have had no pivoting, or formed an explicit inverse, in which case it was genuinely unstable and the fix was real. The new solver may be doing something that changes the *problem* — equilibrating the rows and columns, or refusing to use tiny singular values (a truncated SVD or a pseudo-inverse), which regularises rather than solves. Or the matrix may have been ill-conditioned only through units, and the new code scaled it. In every case the right next step is to find out which, because a $\kappa$ of $10^{14}$ in a filter usually means the state is nearly unobservable and the estimate is not trustworthy however it is computed.
:::

::: check
A cubic spline through 5,000 knots is set up as a general $5000\times5000$ dense linear system and solved with a library LU. Estimate the waste, and say what the spline's structure guarantees about pivoting.
:::

::: answer
Dense LU costs $n^3/3 = 4.2\times10^{10}$ operations and $n^2 = 2.5\times10^{7}$ stored doubles, about 200 MB. The Thomas algorithm on the tridiagonal system costs about $8n = 4\times10^{4}$ operations and $3n = 15{,}000$ doubles, about 120 kB. That is a factor of a million in work and 1,700 in memory, for the same answer. The structure also guarantees no pivoting is needed: row $i$ of the moment equations has diagonal $2(h_{i-1}+h_i)$ and off-diagonals $h_{i-1}$ and $h_i$, all positive, so the matrix is strictly diagonally dominant, elimination in the natural order is stable without row interchanges, and no fill-in is generated. Diagonal dominance is the licence to skip pivoting; without it, skipping pivoting is the failure in the $10^{-20}$ pivot example.
:::

## Summary

| Item | Statement |
| --- | --- |
| Condition number | $\kappa(\mathbf{A}) = \lVert\mathbf{A}\rVert\lVert\mathbf{A}^{-1}\rVert = \sigma_{\max}/\sigma_{\min}$; for symmetric positive-definite, $\lambda_{\max}/\lambda_{\min}$ |
| Perturbation bound | $\lVert\delta\mathbf{x}\rVert/\lVert\mathbf{x}\rVert \le \kappa\,\lVert\delta\mathbf{b}\rVert/\lVert\mathbf{b}\rVert$; you lose $\log_{10}\kappa$ digits |
| Conditioning vs stability | Conditioning is the problem, stability the algorithm; no algorithm beats the conditioning |
| Backward stability | Gaussian elimination with partial pivoting solves $(\mathbf{A}+\delta\mathbf{A})\hat{\mathbf{x}} = \mathbf{b}$ with $\lVert\delta\mathbf{A}\rVert/\lVert\mathbf{A}\rVert \sim \rho\varepsilon$ |
| Residual is not error | $\lVert\hat{\mathbf{x}}-\mathbf{x}\rVert/\lVert\mathbf{x}\rVert \le \kappa\,\lVert\mathbf{r}\rVert/\lVert\mathbf{b}\rVert$; a small residual proves nothing |
| Pivoting | Without it a perfectly conditioned system ($\kappa_2 = 2.6$) can return a 100% wrong component; skip it only when diagonally dominant |
| Units | Scaling a column rescales $\kappa$: a GPS clock bias in seconds instead of metres costs nine digits. Equilibrate; scale filter states by their sigmas |
| Epoch offsets | Fitting over a one-minute pass from a day-old epoch: $\kappa = 3.9\times10^{8}$; re-centred, $\kappa = 19$ |
| Normal equations | $\kappa(\mathbf{A}^{\mathsf T}\mathbf{A}) = \kappa(\mathbf{A})^2$ — use QR or SVD; square-root filters for the same reason, $\kappa(\mathbf{S}) = \sqrt{\kappa(\mathbf{P})}$ |
| Geometry | GDOP $= \sqrt{\operatorname{tr}[(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}]}$; clustered satellites give GDOP 131 against 2.4 well spread — physical, not numerical |
| Never invert | Inverse costs $2n^3$ against $n^3/3$, is less accurate, and destroys sparsity; factor once, solve many times |
| Sparse cost | Dense $n^3/3$; banded $2nb^2$; tridiagonal $8n$. At $n = 1000$: $3.3\times10^{8}$, $3.4\times10^{5}$, $8\times10^{3}$ |
| Fill-in | Elimination order decides everything: an arrow matrix with 598 nonzeros gives 40,000 or 598 in $\mathbf{L}+\mathbf{U}$ depending on the ordering |
| Symbolic analysis | Reordering heuristics run once on the pattern; reused for every numeric factorisation, which makes flight-time cost deterministic |
| Iterative methods | Conjugate gradient converges in $O(\sqrt{\kappa})$ iterations; preconditioning is the method, not an optimisation |

That closes the module. The thread running through all eleven lessons is the same: every number a computer produces is an approximation with two error sources, truncation from the formula and round-off from the arithmetic, and engineering judgement means knowing which one dominates and what it costs. An integrator's step, a root finder's tolerance, a table's spacing, a finite difference's increment, a quadrature's node count and a matrix's condition number are all the same question asked about different objects. Answer it with a number you computed, not with a default someone else chose.
