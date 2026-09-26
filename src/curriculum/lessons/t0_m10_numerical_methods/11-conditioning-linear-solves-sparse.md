---
id: l11-conditioning-linear-solves-sparse
title: Conditioning, stable linear solves and sparse matrices
minutes: 30
covers:
  - conditioning and stability of linear solves, sparse matrices
---

Almost every method in this module ends by solving $\mathbf{A}\mathbf{x} = \mathbf{b}$: a square grid of numbers $\mathbf{A}$ times an unknown list $\mathbf{x}$ equals a known list $\mathbf{b}$. Newton's step for a targeting problem solves $\mathbf{J}\boldsymbol{\delta} = -\mathbf{f}$. The implicit step of the stiffness lesson solves $(\mathbf{I} - h\beta\mathbf{J})\boldsymbol{\delta} = -\mathbf{G}$. The cubic spline solves for its moments. A Kalman filter update solves $\mathbf{S}\mathbf{k} = \mathbf{z}$ with $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^{\mathsf T} + \mathbf{R}$. If the solve cannot be trusted, none of them can.

Two different things decide whether it can be trusted, and mixing them up is the most common mistake in this area. **Conditioning** belongs to the *problem*: how much the answer moves when the data wiggles a little. **Stability** belongs to the *method*: how much extra error the arithmetic adds on top. A good problem solved by a bad method gives a wrong answer. A bad problem solved by the best method in the world also gives a wrong answer, and no better method exists, because the information is not in the data. You fix the first by changing the method and the second by changing the problem.

This lesson measures both, finds where bad conditioning comes from, and then turns to size: for a big matrix, its pattern of zeros decides whether the solve is affordable at all.

## Conditioning: how much the answer wobbles

Picture a seesaw with the pivot almost under one end. A tiny push on the short side swings the long side a lot. Some problems are like that: a tiny change in the data swings the answer wildly. Others are like a balanced plank, where the answer moves about as much as you push.

To measure it we need the size of a vector. The **norm** $\lVert\mathbf{x}\rVert$ ("norm of x") is its length. For a matrix, $\lVert\mathbf{A}\rVert$ is the most it can stretch any vector.

Now nudge the right-hand side from $\mathbf{b}$ to $\mathbf{b} + \delta\mathbf{b}$ ($\delta$, "delta", marks a small change). The answer moves to $\mathbf{x} + \delta\mathbf{x}$. Since $\mathbf{A}\,\delta\mathbf{x} = \delta\mathbf{b}$, we have $\delta\mathbf{x} = \mathbf{A}^{-1}\delta\mathbf{b}$, so $\lVert\delta\mathbf{x}\rVert \le \lVert\mathbf{A}^{-1}\rVert\,\lVert\delta\mathbf{b}\rVert$. Also $\mathbf{b} = \mathbf{A}\mathbf{x}$ gives $\lVert\mathbf{b}\rVert \le \lVert\mathbf{A}\rVert\,\lVert\mathbf{x}\rVert$. Multiply the two and rearrange:

$$
\frac{\lVert\delta\mathbf{x}\rVert}{\lVert\mathbf{x}\rVert}
\;\le\;
\underbrace{\lVert\mathbf{A}\rVert\,\lVert\mathbf{A}^{-1}\rVert}_{\kappa(\mathbf{A})}\;
\frac{\lVert\delta\mathbf{b}\rVert}{\lVert\mathbf{b}\rVert} .
$$

The number $\kappa(\mathbf{A})$ ("kappa of A") is the **condition number**. It is the worst-case multiplier from relative error in the data to relative error in the answer.

In the usual length (the 2-norm), it equals the ratio of the matrix's biggest to smallest **[[singular values|singular-values]]** — how much it stretches in its most-stretched and least-stretched directions: $\kappa_2 = \sigma_{\max}/\sigma_{\min}$ ($\sigma$ is "sigma"). For a symmetric positive-definite matrix, that is $\lambda_{\max}/\lambda_{\min}$, the ratio of its largest and smallest eigenvalues. Other norms give different numbers, but never by more than a factor of the matrix size, so the power of ten — all that matters — is the same.

The rule of thumb follows. Data stored in `float64` is at best correct to a relative **[[machine epsilon|epsilon-again]]** $\varepsilon \approx 2.2\times10^{-16}$. So the answer is at best correct to about $\kappa(\mathbf{A})\,\varepsilon$: **you lose about $\log_{10}\kappa$ decimal digits**. With $\kappa = 10^{8}$, eight of your sixteen digits are left. With $\kappa = 10^{16}$, none are, and the matrix is effectively singular.

::: key
The condition number $\kappa(\mathbf{A}) = \lVert\mathbf{A}\rVert\lVert\mathbf{A}^{-1}\rVert = \sigma_{\max}/\sigma_{\min}$ bounds the amplification of relative error: $\lVert\delta\mathbf{x}\rVert/\lVert\mathbf{x}\rVert \le \kappa(\mathbf{A})\,\lVert\delta\mathbf{b}\rVert/\lVert\mathbf{b}\rVert$. A solve in `float64` loses about $\log_{10}\kappa$ significant digits, so $\kappa \gtrsim 10^{16}$ means no digits survive. Conditioning is a property of the problem; no algorithm can beat it.
:::

## Stability, and why a small residual proves little

**Gaussian elimination** is the school method: subtract multiples of one row from the others until the matrix is triangular, then solve from the bottom up. **Partial pivoting** adds one habit. Before each step, swap rows so the entry you divide by — the **[[pivot|pivot-word]]** — is the largest available in its column.

With pivoting, elimination is **backward stable**. The computed answer $\hat{\mathbf{x}}$ ("x hat") is the *exact* answer to a slightly different problem:

$$
(\mathbf{A} + \delta\mathbf{A})\,\hat{\mathbf{x}} = \mathbf{b},
\qquad
\frac{\lVert\delta\mathbf{A}\rVert}{\lVert\mathbf{A}\rVert} \lesssim c(n)\,\rho\,\varepsilon .
$$

Here $c(n)$ is a modest number that depends on the size $n$, and $\rho$ ("rho") is the **growth factor**: the largest entry that appears during elimination divided by the largest entry of $\mathbf{A}$. Pivoting keeps $\rho$ small in practice. Matrices where it grows like $2^{n-1}$ exist but essentially never show up. The error in the answer then obeys the conditioning bound: $\lVert\hat{\mathbf{x}} - \mathbf{x}\rVert/\lVert\mathbf{x}\rVert \lesssim \kappa(\mathbf{A})\,c(n)\rho\varepsilon$.

This has a surprising consequence. The **residual** $\mathbf{r} = \mathbf{b} - \mathbf{A}\hat{\mathbf{x}}$ — how far the answer misses when you plug it back in — is always tiny for a backward-stable method, whatever $\kappa$ is. So a small residual does not prove a small error. The true relation has $\kappa$ in the middle:

$$
\frac{\lVert\hat{\mathbf{x}} - \mathbf{x}\rVert}{\lVert\mathbf{x}\rVert} \le \kappa(\mathbf{A})\,\frac{\lVert\mathbf{r}\rVert}{\lVert\mathbf{b}\rVert} .
$$

::: example A tiny residual and a 100% error
Take

$$
\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & 1.0001\end{pmatrix},
\qquad \mathbf{b} = \begin{pmatrix}2 \\ 2.0001\end{pmatrix},
\qquad \kappa_\infty(\mathbf{A}) = 4.0004\times10^{4} .
$$

(The subscript $\infty$ means lengths are measured by the biggest component.) The true answer is $\mathbf{x} = (1, 1)$. Check: $1 + 1 = 2$ and $1 + 1.0001 = 2.0001$.

Now try the wrong candidate $\hat{\mathbf{x}} = (0, 2)$. Plug it in: $0 + 2 = 2$ and $0 + 2.0002 = 2.0002$. The residual is $\mathbf{r} = (0,\,-10^{-4})$, and relative to $\mathbf{b}$ it is $10^{-4}/2.0001 = 5\times10^{-5}$. By a residual test, that looks excellent.

Its relative error is $1.0$: every component is off by 100%. The bound allows it: $\kappa \times 5\times10^{-5} = 4.0004\times10^{4} \times 5\times10^{-5} = 2.0$, which permits up to 200%.

Never accept an answer because its residual is small. Check $\kappa$, or check against physics.
:::

::: example Conditioning and stability are different failures
The system

$$
\begin{pmatrix} 10^{-20} & 1 \\ 1 & 1 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 1 \\ 2\end{pmatrix}
$$

has $\kappa_2 = 2.618$, about as well conditioned as a matrix gets. Its exact answer is $\mathbf{x} = (1, 1)$ to twenty digits.

**Without pivoting**, elimination divides by $10^{-20}$. The multiplier is $10^{20}$, and the new bottom-right entry is $1 - 10^{20}$. In `float64` that rounds to $-10^{20}$: the $1$ is wiped out. Back-substitution then gives $(0, 1)$. The first component is not slightly off. It is completely wrong.

**With pivoting**, the rows are swapped first, and the answer is $(1, 1)$ exactly.

The problem did not change; the method failed. That is what "unstable" means, and why every library solver pivots. Skip pivoting only for a diagonally dominant system like the spline's, where no pivot can be small.
:::

::: example Losing digits to conditioning alone
**[[Hilbert matrices|hilbert-matrix]]**, $H_{ij} = 1/(i+j+1)$ with $i, j$ counted from $0$, are the classic badly conditioned test. They come up for real: they are the normal-equation matrices for fitting a polynomial on $[0,1]$ with the powers $1, x, x^2, \ldots$

Solve $\mathbf{H}\mathbf{x} = \mathbf{b}$, where $\mathbf{b}$ is the row sums, so the exact answer is all ones. Use elimination with pivoting in `float64`:

| $n$ | $\kappa_\infty(\mathbf{H})$ | $\kappa\varepsilon$ | worst error $\max\lvert\hat x_i - 1\rvert$ | relative residual |
| --- | --- | --- | --- | --- |
| 4 | $2.84\times10^{4}$ | $6.3\times10^{-12}$ | about $6\times10^{-13}$ | $\lesssim 10^{-16}$ |
| 6 | $2.91\times10^{7}$ | $6.5\times10^{-9}$ | about $5\times10^{-10}$ | $\lesssim 10^{-16}$ |
| 8 | $3.39\times10^{10}$ | $7.5\times10^{-6}$ | about $6\times10^{-7}$ | $\lesssim 10^{-16}$ |
| 10 | $3.54\times10^{13}$ | $7.9\times10^{-3}$ | about $5\times10^{-4}$ | $\lesssim 10^{-16}$ |

**Reading it.** The residual stays at machine precision for every $n$: the method is doing its job perfectly. The error follows $\kappa\varepsilon$, staying ten to twenty times inside the bound. At $n = 10$, thirteen of sixteen digits are gone. The only cure is changing the problem: fit with Legendre or Chebyshev polynomials instead of plain powers, and the same fit becomes well conditioned.
:::

## Where bad conditioning comes from

In GNC, bad conditioning is rarely built into nature. Usually an engineer's choice made it. Four choices cause most of it.

### Units

Changing the units of one unknown rescales one column of $\mathbf{A}$, and that changes $\kappa$.

::: example A GPS solve wrecked by carrying the clock bias in seconds
A GPS receiver solves for four unknowns: three position corrections and its clock error. The **geometry matrix** $\mathbf{G}$ has one row per satellite, $\left(-\hat{\mathbf{u}}_i^{\mathsf T},\ 1\right)$, where $\hat{\mathbf{u}}_i$ is the unit vector pointing at satellite $i$. The final $1$ means the clock error is expressed as a distance, in meters.

**Good units.** Take four satellites at (azimuth, elevation) $(0^\circ, 80^\circ)$, $(30^\circ, 20^\circ)$, $(150^\circ, 20^\circ)$ and $(270^\circ, 20^\circ)$. Then $\kappa_2(\mathbf{G}) = 4.61$. The **[[geometric dilution of precision|gdop]]**, $\mathrm{GDOP} = \sqrt{\operatorname{tr}\left[(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\right]}$, is $2.42$ (tr, the "trace", is the sum of the diagonal).

**Bad units.** Carry the clock error in *seconds* instead. The last column becomes $c = 2.998\times10^{8}$, the speed of light, instead of $1$. Same physics, one different unit, and $\kappa_2(\mathbf{G}) = 1.09\times10^{9}$. About nine digits lost instead of less than one. The fix is rescaling, not a better solver.
:::

The general cure is **equilibration**: scale rows and columns so all entries are of similar size, solve, then undo the scaling. In a filter, scale each state by its own expected standard deviation. A covariance with $10\,\mathrm{m}$ position uncertainty and $1\,\mathrm{mm/s}$ velocity uncertainty is $\mathbf{P} = \operatorname{diag}(100\,\mathrm{m^2},\ 10^{-6}\,\mathrm{m^2/s^2})$, with $\kappa_2 = 100/10^{-6} = 10^{8}$ before anything happens. Scaled by the sigmas, it becomes the identity, with $\kappa_2 = 1$ exactly.

### Where you put time zero

::: example A tracking pass fitted from the wrong time origin
Fit a straight line $r(t) = a + bt$ to eleven range samples, $6\,\mathrm{s}$ apart, over a one-minute pass. Each sample gives one row $(1, t_i)$ of the matrix $\mathbf{A}$.

**Far origin.** If $t$ counts seconds from an **[[epoch|epoch-word]]** a day earlier, the samples run from $86{,}400$ to $86{,}460\,\mathrm{s}$. The two columns, $(1, 1, \ldots)$ and $(86400, 86406, \ldots)$, point in almost the same direction, and $\kappa_2(\mathbf{A}) = 3.94\times10^{8}$.

**Centered origin.** Measure $t$ from the middle of the pass, so it runs from $-30$ to $+30\,\mathrm{s}$. Now $\kappa_2(\mathbf{A}) = 18.97$.

Same data, same fit: seven powers of ten, for the price of one subtraction.
:::

### Normal equations

A least-squares fit finds the $\mathbf{x}$ that makes $\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert$ smallest. The textbook route solves the **normal equations** $\mathbf{A}^{\mathsf T}\mathbf{A}\mathbf{x} = \mathbf{A}^{\mathsf T}\mathbf{b}$. That is a trap, because

$$
\kappa_2(\mathbf{A}^{\mathsf T}\mathbf{A}) = \kappa_2(\mathbf{A})^2 .
$$

The singular values of $\mathbf{A}^{\mathsf T}\mathbf{A}$ are the squares of those of $\mathbf{A}$. Squaring $\kappa$ doubles the digits lost. In the tracking-pass example, $\kappa_2(\mathbf{A}) = 3.94\times10^{8}$ becomes $1.55\times10^{17}$, past the point where `float64` has anything left. You can watch it happen. The exact normal matrix is

$$
\mathbf{A}^{\mathsf T}\mathbf{A} = \begin{pmatrix} 11 & 950730 \\ 950730 & 82171597860 \end{pmatrix},
$$

and its determinant is $903{,}887{,}576{,}460 - 903{,}887{,}532{,}900 = 43{,}560$. Two numbers agreeing in their first seven digits, subtracted: the catastrophic cancellation of lesson 1, built right into the method.

The cure is never to form $\mathbf{A}^{\mathsf T}\mathbf{A}$. Instead factor $\mathbf{A} = \mathbf{Q}\mathbf{R}$, where $\mathbf{Q}$ is **orthogonal** (it only rotates and reflects, never stretches) and $\mathbf{R}$ is triangular. Then solve $\mathbf{R}\mathbf{x} = \mathbf{Q}^{\mathsf T}\mathbf{b}$. An orthogonal matrix has condition number exactly $1$, so it cannot amplify anything, and accuracy depends on $\kappa(\mathbf{A})$, not its square. That is why serious orbit-determination software is built on QR or the singular value decomposition.

The same reasoning gives **[[square-root filters|square-root-filter]]**. They carry a factor $\mathbf{S}$ with $\mathbf{P} = \mathbf{S}\mathbf{S}^{\mathsf T}$ instead of $\mathbf{P}$ itself. Since $\kappa(\mathbf{S}) = \sqrt{\kappa(\mathbf{P})}$, they work in half the digits: the $\mathbf{P}$ above with $\kappa = 10^{8}$ has a factor with $\kappa = 10^{4}$. And $\mathbf{S}\mathbf{S}^{\mathsf T}$ can never fail to be positive semi-definite, so the filter cannot lose that property through cancellation in $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$, the failure lesson 1 described. The Joseph form $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf T} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf T}$ is a cheaper partial fix that stays symmetric by construction.

### Geometry

Sometimes the bad conditioning is real: the measurements genuinely cannot pin down the state. Bunch four GPS satellites together at $(20^\circ, 55^\circ)$, $(35^\circ, 62^\circ)$, $(50^\circ, 58^\circ)$ and $(38^\circ, 70^\circ)$. Then $\kappa_2(\mathbf{G}) = 368$, $\kappa_2(\mathbf{G}^{\mathsf T}\mathbf{G}) = 1.36\times10^{5}$, and $\mathrm{GDOP} = 131$ against $2.42$ for the spread-out sky. The position is $131/2.42 \approx 54$ times noisier from the same ranging accuracy. A gyro bias barely seen over a short arc, or two burns with nearly parallel effects, are the same story. Here $\kappa$ tells the truth about the experiment. The fix is more or better-placed measurements, a longer arc, or prior knowledge — not a better solver.

## Never invert the matrix

The Newton lesson said to solve $\mathbf{J}\boldsymbol{\delta} = -\mathbf{f}$ rather than compute $\mathbf{J}^{-1}$. Here is why.

**Cost.** Solving starts with an **LU factorization**: elimination records $\mathbf{A}$ as a lower-triangular $\mathbf{L}$ times an upper-triangular $\mathbf{U}$, for about $n^3/3$ multiply-adds. Each solve with it is then two quick triangular sweeps, about $n^2$. Building the full inverse from the same factors costs about $n^3$ in all — three times the work — and applying it is no cheaper than the sweeps.

**Accuracy.** Multiplying by a computed inverse is not backward stable. Its residual can be up to $\kappa$ times larger than a direct solve's.

**Structure.** The inverse of a tridiagonal matrix is completely full. Inverting the spline system turns $O(n)$ work and storage into $O(n^3)$ work and $O(n^2)$ storage. ($O(n)$, "order n", means "grows in proportion to $n$".)

Factor once, solve many times. For twenty right-hand sides, factor once and do twenty cheap solves. The only good reason to form an inverse is needing its *entries* — the diagonal of $(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$ for a GDOP, or a covariance to report — and even then better routes exist.

## Sparse matrices

Think of a seating chart where each person only talks to their neighbors. Write down who talks to whom as a grid, and almost every box is empty. A matrix is **sparse** when enough of its entries are zero that it pays to skip them. Almost every large matrix in GNC is, because the physics is local:

- The spline equations are **tridiagonal**: each knot couples only to its two neighbors.
- A collocation or multiple-shooting trajectory is **block banded**: node $k$'s constraint involves only nodes $k$ and $k+1$, so the nonzeros hug the diagonal within about twice the state dimension.
- The implicit-step matrix $\mathbf{I} - h\beta\mathbf{J}$ is as sparse as $\mathbf{J}$.
- Big estimation problems — batch orbit determination over many passes, mapping and localization — are block sparse, because each measurement touches only a few states.

Sparsity changes the cost class. Dense LU is about $n^3/3$ operations and $n^2$ storage. A tridiagonal solve is about $8n$ operations and $3n$ storage. A banded solve with half-bandwidth $b$ is about $2nb^2$:

| $n$ | dense $n^3/3$ | banded, $b = 13$ | tridiagonal $8n$ |
| --- | --- | --- | --- |
| 100 | $3.3\times10^{5}$ | $3.4\times10^{4}$ | 800 |
| 1,000 | $3.3\times10^{8}$ | $3.4\times10^{5}$ | 8,000 |
| 10,000 | $3.3\times10^{11}$ | $3.4\times10^{6}$ | 80,000 |

Take a trajectory with 100 nodes and a 6-state vehicle: 600 unknowns, band $b = 12$. Dense costs $600^3/3 = 7.2\times10^{7}$. Banded costs $2 \times 600 \times 12^2 = 1.7\times10^{5}$, about 417 times less. That factor decides whether a landing solver can close its guidance loop at 1 Hz.

### Fill-in is the whole problem

Elimination does not keep zeros zero. When you subtract a multiple of row $k$ from row $i$, every column where row $k$ has a nonzero becomes nonzero in row $i$. Those new nonzeros are **fill-in**, and how much you get depends entirely on the order you eliminate in.

::: example The same matrix, two orderings
An **[[arrow matrix|arrow-matrix]]** is diagonal except for one full row and one full column. It shows up whenever one unknown touches everything: a total mass, a shared clock bias, a global scale factor. With $n = 200$ it has $200 + 2 \times 199 = 598$ nonzeros.

**Full row and column first.** The first elimination step touches every other row in every column. $\mathbf{L} + \mathbf{U}$ ends up with $200^2 = 40{,}000$ nonzeros: completely full, and the solve costs the full $n^3/3 \approx 2.7\times10^{6}$.

**Full row and column last.** Renumber the unknowns so the busy one comes last. Now each of the first $n - 1$ steps touches only its diagonal entry and the last row. $\mathbf{L} + \mathbf{U}$ has 598 nonzeros: no fill at all, and the solve is $O(n)$.

Same matrix, same arithmetic, one renumbering: a factor of $40{,}000/598 \approx 67$ in storage and more than a thousand in work.
:::

Finding the order with the least fill is NP-hard — no fast method is known that always finds the best one. So sparse libraries use good rules of thumb (approximate minimum degree, nested dissection) in a **symbolic analysis** step. It looks only at *where* the nonzeros are, before any numbers are touched. In GNC that pattern is fixed by the problem's structure, not the data, so the analysis runs once and is reused for every later factorization. Tridiagonal and banded matrices need no reordering: eliminating in natural order makes no fill. That is why the spline's **Thomas algorithm** works, and, since the matrix is diagonally dominant, why it needs no pivoting.

### Iterative methods

When $n$ reaches millions, even a sparse factorization is too much. Then you use **iterative methods**, which only ever multiply by $\mathbf{A}$ and improve a guess step by step. **Conjugate gradient** handles symmetric positive-definite systems; **GMRES** handles general ones. Each step costs one matrix-vector product, proportional to the number of nonzeros. How many steps? Conditioning again. For conjugate gradient, after $k$ steps

$$
\frac{\lVert\mathbf{e}_k\rVert_{\mathbf{A}}}{\lVert\mathbf{e}_0\rVert_{\mathbf{A}}} \le 2\left(\frac{\sqrt{\kappa} - 1}{\sqrt{\kappa} + 1}\right)^{k},
$$

where $\mathbf{e}_k$ is the error after $k$ steps, measured in a length set by $\mathbf{A}$. The step count grows like $\sqrt{\kappa}$. So a **preconditioner** — a rough inverse $\mathbf{M}^{-1} \approx \mathbf{A}^{-1}$ applied to both sides so that $\kappa(\mathbf{M}^{-1}\mathbf{A}) \ll \kappa(\mathbf{A})$ — is not an optional speed-up. It is the method: without one, a realistic problem does not converge in usable time. For GNC-sized problems, a direct sparse factorization is almost always right.

### Determinism in flight software

A real-time solver must finish within a guaranteed worst-case time. A direct sparse factorization on a *fixed* pattern does the same arithmetic in the same order every run: the symbolic analysis is done offline, and the operation count is a constant. The only data-dependent choice, the pivot, can be fixed in advance for a stable pattern. This is what makes onboard **[[convex-optimization guidance|onboard-convex]]** possible. A powered-descent solver runs a fixed number of interior-point iterations, each solving a system with an unchanging sparsity pattern, so its worst-case time can be certified. An iterative solver, whose step count depends on the data, could not be.

## Check yourself

::: check
A Newton solve for a trim problem reports a residual of $10^{-12}$ relative to the right-hand side. The Jacobian's condition number is $3\times10^{9}$. How many digits of the answer can you trust?
:::

::: answer
The bound is $\lVert\hat{\mathbf{x}} - \mathbf{x}\rVert/\lVert\mathbf{x}\rVert \le \kappa\,\lVert\mathbf{r}\rVert/\lVert\mathbf{b}\rVert = 3\times10^{9}\times10^{-12} = 3\times10^{-3}$. That is about two and a half digits, not twelve.

Separately, any solve is limited by the data's own precision: $\kappa\varepsilon = 3\times10^{9} \times 2.2\times10^{-16} = 6.7\times10^{-7}$, about six digits at best. Which one wins depends on where the residual came from. Either way, the twelve digits of residual are not twelve digits of answer.

If the trim unknowns mix an angle in radians with a thrust in newtons, $\kappa = 3\times10^{9}$ is probably a units problem. Rescale first.
:::

::: check
Why does solving the normal equations lose twice as many digits as QR on the same least-squares problem?
:::

::: answer
The singular values of $\mathbf{A}^{\mathsf T}\mathbf{A}$ are the squares of those of $\mathbf{A}$, so $\kappa_2(\mathbf{A}^{\mathsf T}\mathbf{A}) = \sigma_{\max}^2/\sigma_{\min}^2 = \kappa_2(\mathbf{A})^2$. Digits lost is $\log_{10}\kappa$, and $\log_{10}(\kappa^2) = 2\log_{10}\kappa$: double.

QR writes $\mathbf{A} = \mathbf{Q}\mathbf{R}$ and solves $\mathbf{R}\mathbf{x} = \mathbf{Q}^{\mathsf T}\mathbf{b}$. $\mathbf{Q}$ is orthogonal, with $\kappa_2 = 1$, and keeps lengths exactly, so accuracy depends on $\kappa(\mathbf{R}) = \kappa(\mathbf{A})$.

In the tracking-pass fit, $\kappa(\mathbf{A}) = 3.9\times10^{8}$: about eight digits survive through QR, and none through the normal equations, where $\kappa = 1.6\times10^{17}$.
:::

::: check
A batch orbit-determination problem has 4,000 unknowns. After reordering, its matrix is banded with $b \approx 40$. Compare the cost with a dense solve, and say what the symbolic analysis buys you.
:::

::: answer
Dense: $n^3/3 = 4000^3/3 = 2.1\times10^{10}$ operations. Banded: $2nb^2 = 2 \times 4000 \times 1600 = 1.3\times10^{7}$. About 1,600 times less work — minutes become milliseconds. Storage drops from $4000^2 = 1.6\times10^{7}$ entries to about $3\times10^{5}$.

The symbolic analysis finds the ordering that gives that small band, from the pattern of nonzeros alone. The pattern comes from the measurement structure and does not change between batches, so the analysis runs once and is reused for every later factorization.
:::

::: check
A filter had a matrix with $\kappa = 10^{14}$. Someone says switching from Gaussian elimination to a "more stable" solver fixed it. What really happened?
:::

::: answer
Not what was claimed. Elimination with pivoting already gives the exact answer to a problem within about $\varepsilon$ of the one posed. No solver does better, and none can recover the fourteen digits that $\kappa = 10^{14}$ destroys. Three explanations fit:

- The old code had no pivoting, or formed an explicit inverse. Then it really was unstable, and the fix was real.
- The new solver changes the *problem*: it rescales rows and columns, or throws away tiny singular values (a truncated SVD or pseudo-inverse). That regularizes rather than solves.
- The bad $\kappa$ came from units, and the new code happens to rescale.

Find out which. A $\kappa$ of $10^{14}$ in a filter usually means some state is nearly unobservable, and its estimate is untrustworthy however it is computed.
:::

::: check
A cubic spline through 5,000 knots is set up as a dense $5000\times5000$ system and solved with a library LU. Estimate the waste, and say what the spline's structure guarantees about pivoting.
:::

::: answer
Dense LU: $n^3/3 = 4.2\times10^{10}$ operations and $n^2 = 2.5\times10^{7}$ stored numbers. At 8 bytes each, that is 200 MB. The Thomas algorithm: about $8n = 4\times10^{4}$ operations and $3n = 15{,}000$ numbers, about 120 kB. A factor of a million in work and about 1,700 in memory, for the same answer.

Row $i$ of the spline equations has diagonal $2(h_{i-1}+h_i)$ and off-diagonals $h_{i-1}$ and $h_i$, all positive. The diagonal is bigger than the other two combined, so the matrix is strictly diagonally dominant. Elimination in natural order is then stable with no row swaps and makes no fill. Diagonal dominance is the license to skip pivoting. Without it, skipping pivoting is exactly the $10^{-20}$ failure above.
:::

## Summary

| Item | Statement |
| --- | --- |
| Condition number | $\kappa(\mathbf{A}) = \lVert\mathbf{A}\rVert\lVert\mathbf{A}^{-1}\rVert = \sigma_{\max}/\sigma_{\min}$; symmetric positive-definite: $\lambda_{\max}/\lambda_{\min}$ |
| Perturbation bound | $\lVert\delta\mathbf{x}\rVert/\lVert\mathbf{x}\rVert \le \kappa\,\lVert\delta\mathbf{b}\rVert/\lVert\mathbf{b}\rVert$; lose $\log_{10}\kappa$ digits |
| Backward stability | Pivoted elimination solves $(\mathbf{A}+\delta\mathbf{A})\hat{\mathbf{x}} = \mathbf{b}$, $\lVert\delta\mathbf{A}\rVert/\lVert\mathbf{A}\rVert \sim \rho\varepsilon$ |
| Residual is not error | $\lVert\hat{\mathbf{x}}-\mathbf{x}\rVert/\lVert\mathbf{x}\rVert \le \kappa\,\lVert\mathbf{r}\rVert/\lVert\mathbf{b}\rVert$ |
| Pivoting | Needed even when $\kappa_2 = 2.6$ |
| Units | Clock bias in seconds: $\kappa$ from 4.6 to $10^{9}$; equilibrate |
| Time origin | Day-old epoch: $\kappa = 3.9\times10^{8}$; centered: 19 |
| Normal equations | $\kappa(\mathbf{A}^{\mathsf T}\mathbf{A}) = \kappa(\mathbf{A})^2$; use QR or SVD; square-root filters, $\kappa(\mathbf{S}) = \sqrt{\kappa(\mathbf{P})}$ |
| Geometry | GDOP $= \sqrt{\operatorname{tr}[(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}]}$: 131 clustered, 2.4 spread |
| Never invert | Three times the work, less accurate, destroys sparsity |
| Sparse cost | Dense $n^3/3$; banded $2nb^2$; tridiagonal $8n$ |
| Fill-in | Arrow matrix: 40,000 or 598 nonzeros in $\mathbf{L}+\mathbf{U}$, by ordering alone |
| Iterative methods | Conjugate gradient needs about $\sqrt{\kappa}$ steps; preconditioning is essential |

That closes the module. One thread runs through all eleven lessons: every number a computer gives you carries two kinds of error, truncation from the formula and round-off from the arithmetic, and engineering judgment means knowing which one dominates and what it costs. A step size, a tolerance, a table spacing, a difference increment, a node count and a condition number are the same question asked about different things. Answer it with a number you computed, not a default someone else chose.

::: context singular-values Stretch factors of a matrix
Feed every arrow of length 1 into a 2-by-2 matrix. The tips, which formed a circle, come out as an ellipse. The longest half-axis is $\sigma_{\max}$ and the shortest is $\sigma_{\min}$: the most and least the matrix stretches anything. Their ratio is $\kappa_2$. A long, thin ellipse means some direction is nearly squashed flat, and undoing the matrix must blow that direction back up — amplifying whatever error rides along with it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="70" cy="90" r="25" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="70" y1="90" x2="95" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">all lengths 1</text>
  <line x1="115" y1="90" x2="160" y2="90" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="166,90 156,85 156,95" fill="#6c7a93"/>
  <text x="138" y="80" font-size="13" text-anchor="middle" fill="#1f2a44">A</text>
  <ellipse cx="250" cy="90" rx="75" ry="12.5" transform="rotate(-25 250 90)" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="182.0" y1="121.7" x2="318.0" y2="58.3" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="244.7" y1="78.7" x2="255.3" y2="101.3" stroke="#1f2a44" stroke-width="2"/>
  <text x="300" y="45" font-size="12" fill="#b4232c">σ_max = 3</text>
  <text x="262" y="120" font-size="12" fill="#1f2a44">σ_min = 0.5</text>
  <text x="250" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">κ₂ = 3 / 0.5 = 6</text>
</svg>
```
:::

::: context epsilon-again Machine epsilon, again
Lesson 1 met $\varepsilon$: the gap between $1$ and the next number `float64` can store, $2^{-52} \approx 2.2\times10^{-16}$. It means every stored number can be off by about one part in $10^{16}$, before any calculation starts. That is why $\kappa\varepsilon$ is the best accuracy you can hope for: the condition number multiplies an error that is already there, however carefully you compute.
:::

::: context pivot-word Why it's called a pivot
In elimination, the pivot is the entry that every other row in its column gets measured against — the point the step turns on, like the pivot of a seesaw. Dividing by a tiny pivot makes a huge multiplier, and a huge multiplier swamps every other number in its row with rounding error. Choosing the biggest available entry keeps every multiplier at size $1$ or less, so nothing gets swamped.
:::

::: context hilbert-matrix A famous troublemaker
David Hilbert studied these matrices in 1894 while working on how well polynomials can approximate functions. They look harmless — every entry is a simple fraction like $1/3$ or $1/7$ — yet their condition number grows roughly like $e^{3.5n}$. By $n = 12$ or so, `float64` cannot solve them at all. They are now the standard test for whether a solver reports its trouble honestly.
:::

::: context gdop Why spread-out satellites are better
Each satellite pins your position to a sphere around it. If the satellites are spread across the sky, those spheres cross at sharp angles and the crossing point is crisp. If they are bunched in one patch, the spheres meet at shallow angles and the crossing smears into a long blob. GDOP measures that smearing. Both sky views below look straight up; the center is overhead and the rim is the horizon.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="95" r="62" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="270" cy="95" r="62" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.8"><circle cx="90" cy="95" r="31" fill="none"/><circle cx="270" cy="95" r="31" fill="none"/></g>
  <text x="90" y="28" font-size="11" text-anchor="middle" fill="#1f2a44">N</text>
  <text x="270" y="28" font-size="11" text-anchor="middle" fill="#1f2a44">N</text>
  <g fill="#1d6fd1"><circle cx="90" cy="88.1" r="5"/><circle cx="114.1" cy="53.2" r="5"/><circle cx="114.1" cy="136.8" r="5"/><circle cx="41.8" cy="95" r="5"/></g>
  <g fill="#b4232c"><circle cx="278.2" cy="72.3" r="5"/><circle cx="281.1" cy="79.2" r="5"/><circle cx="286.9" cy="80.8" r="5"/><circle cx="278.5" cy="84.1" r="5"/></g>
  <text x="90" y="178" font-size="12" text-anchor="middle" fill="#1f2a44">spread: GDOP 2.4</text>
  <text x="270" y="178" font-size="12" text-anchor="middle" fill="#1f2a44">clustered: GDOP 131</text>
</svg>
```
:::

::: context epoch-word What an epoch is
An epoch is the moment chosen as time zero. Orbit software often counts seconds from a standard epoch such as J2000 — noon on January 1, 2000 — so by now those counts run into the hundreds of millions. Big time values next to small ones are a classic source of bad conditioning, and of lost digits even in plain subtraction. Measuring time from a nearby reference moment is a cheap habit that avoids both.
:::

::: context square-root-filter Square roots on the way to the Moon
James Potter at MIT worked out a square-root form of the Kalman filter in the early 1960s, for Apollo's navigation, because the flight computer's short word length made the ordinary covariance update fragile. Gerald Bierman's 1977 book *Factorization Methods for Discrete Sequential Estimation* made the UD form standard. Many navigation filters still carry a factor of $\mathbf{P}$ rather than $\mathbf{P}$ itself for exactly the reasons in this lesson: half the digits lost, and a covariance that cannot go negative.
:::

::: context arrow-matrix Where the fill lands
Here is an 8-by-8 arrow matrix (blue dots are nonzeros). Eliminate with the busy row and column first, and every empty box fills in (red). Put them last, and nothing fills.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g transform="translate(20,20)">
    <rect width="72" height="72" fill="#fff" stroke="#1f2a44"/>
    <g fill="#1d6fd1">
      <rect x="0" y="0" width="72" height="9"/><rect x="0" y="0" width="9" height="72"/>
      <rect x="9" y="9" width="9" height="9"/><rect x="18" y="18" width="9" height="9"/><rect x="27" y="27" width="9" height="9"/><rect x="36" y="36" width="9" height="9"/><rect x="45" y="45" width="9" height="9"/><rect x="54" y="54" width="9" height="9"/><rect x="63" y="63" width="9" height="9"/>
    </g>
  </g>
  <text x="100" y="60" font-size="16" fill="#1f2a44">→</text>
  <g transform="translate(118,20)">
    <rect width="72" height="72" fill="#b4232c" stroke="#1f2a44"/>
    <g fill="#1d6fd1">
      <rect x="0" y="0" width="72" height="9"/><rect x="0" y="0" width="9" height="72"/>
      <rect x="9" y="9" width="9" height="9"/><rect x="18" y="18" width="9" height="9"/><rect x="27" y="27" width="9" height="9"/><rect x="36" y="36" width="9" height="9"/><rect x="45" y="45" width="9" height="9"/><rect x="54" y="54" width="9" height="9"/><rect x="63" y="63" width="9" height="9"/>
    </g>
  </g>
  <g transform="translate(222,20)">
    <rect width="72" height="72" fill="#fff" stroke="#1f2a44"/>
    <g fill="#1d6fd1">
      <rect x="0" y="63" width="72" height="9"/><rect x="63" y="0" width="9" height="72"/>
      <rect x="0" y="0" width="9" height="9"/><rect x="9" y="9" width="9" height="9"/><rect x="18" y="18" width="9" height="9"/><rect x="27" y="27" width="9" height="9"/><rect x="36" y="36" width="9" height="9"/><rect x="45" y="45" width="9" height="9"/><rect x="54" y="54" width="9" height="9"/>
    </g>
  </g>
  <text x="302" y="60" font-size="16" fill="#1f2a44">→</text>
  <text x="320" y="62" font-size="11" fill="#1f2a44">same</text>
  <text x="105" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">busy first: 64 of 64 filled</text>
  <text x="258" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">busy last: stays at 22</text>
</svg>
```

At $n = 200$ the same picture is 40,000 against 598.
:::

::: context onboard-convex Convex guidance that flew
In 2012 and 2013, NASA's Jet Propulsion Laboratory flight-tested an algorithm called G-FOLD on Masten Space Systems' Xombie test rocket. In those tests the vehicle computed a fuel-optimal divert trajectory onboard, by solving a convex optimization problem, and then flew it. Solvers like this can be trusted in a flight loop because their inner linear systems keep the same sparsity pattern every iteration, so their running time can be bounded ahead of time — the property this section describes.
:::
