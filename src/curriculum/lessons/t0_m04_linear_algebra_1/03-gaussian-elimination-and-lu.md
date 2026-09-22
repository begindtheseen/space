---
id: l03-gaussian-elimination-and-lu
title: Gaussian elimination and LU factorisation
minutes: 18
covers:
  - Gaussian elimination and LU factorisation
---

Almost every numerical routine in a GNC stack eventually asks the same question: given a square matrix $\mathbf{A}$ and a vector $\mathbf{b}$, which $\mathbf{x}$ satisfies $\mathbf{A}\mathbf{x} = \mathbf{b}$? A Kalman filter asks it at every update when it forms its gain. A least-squares fit asks it when it solves the normal equations. A trim routine asks it when it balances forces and moments. The previous lesson gave the paper answer, $\mathbf{x} = \mathbf{A}^{-1}\mathbf{b}$, and warned you not to compute it that way. This lesson gives the real answer.

The real answer is **Gaussian elimination**: subtract multiples of one equation from the others until the system is triangular, then solve the triangular system from the bottom up. Written as matrices, the elimination steps factor $\mathbf{A}$ into a lower-triangular $\mathbf{L}$ times an upper-triangular $\mathbf{U}$, and that **LU factorisation** is what `numpy.linalg.solve` and every serious linear-algebra library actually computes. Knowing what is inside the box tells you what it costs, when it fails, and why it insists on swapping rows even when no row needs swapping.

The row swapping — **partial pivoting** — is the part most often skipped in a first course and most often the reason a hand-rolled solver produces garbage. It is treated here with a worked example in which skipping it destroys every significant digit of the answer.

## Triangular systems are easy

Start with the case that needs no cleverness. An **upper-triangular** matrix $\mathbf{U}$ has zeros below its main diagonal, so the system $\mathbf{U}\mathbf{x} = \mathbf{y}$ looks like

$$
\begin{aligned}
U_{11} x_1 + U_{12} x_2 + U_{13} x_3 &= y_1 \\
U_{22} x_2 + U_{23} x_3 &= y_2 \\
U_{33} x_3 &= y_3 .
\end{aligned}
$$

The last equation has one unknown: $x_3 = y_3 / U_{33}$. Substituting it into the second leaves one unknown there, $x_2 = (y_2 - U_{23} x_3)/U_{22}$, and so on upward. This is **back substitution**:

$$
x_i = \frac{1}{U_{ii}}\Big( y_i - \sum_{j > i} U_{ij}\,x_j \Big), \qquad i = n, n-1, \dots, 1 .
$$

It works as long as no diagonal entry $U_{ii}$ is zero. Row $i$ costs about $n - i$ multiply-adds, so the whole thing costs about $n^2/2$ multiply-adds, or $n^2$ floating-point operations counting additions and multiplications separately. A **lower-triangular** system $\mathbf{L}\mathbf{y} = \mathbf{b}$ is solved the same way from the top down, which is **forward substitution**.

Elimination is the process of turning a general system into a triangular one.

## Elimination by row operations

Three operations on the rows of the augmented system $[\mathbf{A} \mid \mathbf{b}]$ leave its solution set unchanged: swapping two rows, multiplying a row by a nonzero scalar, and adding a multiple of one row to another. Each reorders or recombines the equations without adding or losing information, and each can be undone, so any $\mathbf{x}$ that satisfied the old equations satisfies the new ones and vice versa.

Gaussian elimination uses the third operation systematically. Take the first row, whose leading entry $A_{11}$ is called the **pivot**. For each row $i$ below it, compute the **multiplier**

$$
m_{i1} = \frac{A_{i1}}{A_{11}}
$$

and subtract $m_{i1}$ times row 1 from row $i$. The new row $i$ has a zero in column 1. Now move to the second row, whose new leading entry is the second pivot, and clear the entries below it in column 2. Continue until the matrix is upper triangular.

::: example Eliminating a three-by-three system
Solve

$$
\begin{pmatrix} 2 & 1 & 1 \\ 4 & -1 & 4 \\ -2 & -10 & 9 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 3 \\ 18 \\ 45 \end{pmatrix}.
$$

**Column 1.** The pivot is $2$. Multipliers: $m_{21} = 4/2 = 2$ and $m_{31} = -2/2 = -1$. Row 2 becomes $(4, -1, 4 \mid 18) - 2\,(2, 1, 1 \mid 3) = (0, -3, 2 \mid 12)$. Row 3 becomes $(-2, -10, 9 \mid 45) + 1\,(2, 1, 1 \mid 3) = (0, -9, 10 \mid 48)$.

**Column 2.** The pivot is $-3$. Multiplier $m_{32} = -9/(-3) = 3$. Row 3 becomes $(0, -9, 10 \mid 48) - 3\,(0, -3, 2 \mid 12) = (0, 0, 4 \mid 12)$.

The system is now triangular:

$$
\begin{pmatrix} 2 & 1 & 1 \\ 0 & -3 & 2 \\ 0 & 0 & 4 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 3 \\ 12 \\ 12 \end{pmatrix}.
$$

**Back substitution.** $x_3 = 12/4 = 3$. Then $-3x_2 + 2(3) = 12$ gives $x_2 = (12 - 6)/(-3) = -2$. Then $2x_1 + (-2) + 3 = 3$ gives $x_1 = 1$. So $\mathbf{x} = (1, -2, 3)^T$. Check in the original second equation: $4(1) - 1(-2) + 4(3) = 4 + 2 + 12 = 18$.
:::

## Elimination is a factorisation

Watch what the elimination did to the matrix alone. It turned $\mathbf{A}$ into the upper-triangular

$$
\mathbf{U} = \begin{pmatrix} 2 & 1 & 1 \\ 0 & -3 & 2 \\ 0 & 0 & 4 \end{pmatrix},
$$

whose diagonal entries are the pivots. Each step, "subtract $m_{ij}$ times row $j$ from row $i$", is itself a linear map on the rows, so it is left-multiplication by a matrix: the identity with $-m_{ij}$ placed in position $(i, j)$. Call it $\mathbf{E}_{ij}$. The whole elimination is

$$
\mathbf{E}_{32}\,\mathbf{E}_{31}\,\mathbf{E}_{21}\,\mathbf{A} = \mathbf{U} .
$$

Each $\mathbf{E}_{ij}$ is easy to undo: adding the multiple back, which is the identity with $+m_{ij}$ in position $(i, j)$. Multiply both sides by the inverses in reverse order:

$$
\mathbf{A} = \mathbf{E}_{21}^{-1}\,\mathbf{E}_{31}^{-1}\,\mathbf{E}_{32}^{-1}\,\mathbf{U} = \mathbf{L}\mathbf{U} .
$$

The product $\mathbf{L}$ of these inverses is remarkably simple. Build it by applying the three operations to the identity from the right factor outward. $\mathbf{E}_{32}^{-1}$ adds $m_{32}$ times row 2 to row 3, placing $m_{32}$ in position $(3, 2)$. $\mathbf{E}_{31}^{-1}$ then adds $m_{31}$ times row 1 to row 3; row 1 is still $\mathbf{e}_1^T$, so this places $m_{31}$ in position $(3, 1)$ and disturbs nothing else. $\mathbf{E}_{21}^{-1}$ adds $m_{21}$ times row 1 to row 2, placing $m_{21}$ in position $(2, 1)$. Because each step only ever adds a row that is still a row of the identity, the multipliers land in their own slots without interacting:

$$
\mathbf{L} = \begin{pmatrix} 1 & 0 & 0 \\ m_{21} & 1 & 0 \\ m_{31} & m_{32} & 1 \end{pmatrix} = \begin{pmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ -1 & 3 & 1 \end{pmatrix}.
$$

$\mathbf{L}$ is **unit lower triangular** — ones on the diagonal, the multipliers below it — and it records the elimination. Multiply it out to confirm: row 3 of $\mathbf{L}\mathbf{U}$ is $-1\,(2, 1, 1) + 3\,(0, -3, 2) + 1\,(0, 0, 4) = (-2, -10, 9)$, the third row of $\mathbf{A}$. The factorisation is exact:

$$
\begin{pmatrix} 2 & 1 & 1 \\ 4 & -1 & 4 \\ -2 & -10 & 9 \end{pmatrix} = \begin{pmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ -1 & 3 & 1 \end{pmatrix}\begin{pmatrix} 2 & 1 & 1 \\ 0 & -3 & 2 \\ 0 & 0 & 4 \end{pmatrix}.
$$

This is the **LU factorisation**. Elimination on the matrix, with the multipliers kept, *is* the factorisation; no extra work is involved.

### Solving with the factors

Once $\mathbf{A} = \mathbf{L}\mathbf{U}$ is known, $\mathbf{A}\mathbf{x} = \mathbf{b}$ reads $\mathbf{L}(\mathbf{U}\mathbf{x}) = \mathbf{b}$. Name the inner product $\mathbf{y} = \mathbf{U}\mathbf{x}$ and solve two triangular systems:

$$
\mathbf{L}\mathbf{y} = \mathbf{b} \quad \text{(forward substitution)}, \qquad \mathbf{U}\mathbf{x} = \mathbf{y} \quad \text{(back substitution)}.
$$

The vector $\mathbf{y}$ is exactly the transformed right-hand side that elimination produced — $(3, 12, 12)^T$ in the example — so this is the same computation, organised so that the matrix work and the right-hand-side work are separated.

That separation is the point. Factoring costs about $\tfrac{2}{3}n^3$ floating-point operations: the first column needs $(n-1)$ multipliers and $(n-1)^2$ updates, the second $(n-2)^2$, and the sum of squares is about $n^3/3$, doubled for the multiply and the add. The two triangular solves cost about $2n^2$ between them. For $n = 1000$ that is roughly $6.7 \times 10^8$ operations to factor and $2 \times 10^6$ to solve. If you must solve with the same $\mathbf{A}$ and many different $\mathbf{b}$ — as a Kalman filter does when it computes its gain, solving with the same innovation covariance for every column of a cross-covariance — you factor once and reuse $\mathbf{L}$ and $\mathbf{U}$ for each right-hand side at a tiny fraction of the cost.

::: example Reusing the factors for a new right-hand side
Solve the same matrix against $\mathbf{b} = (3, 4, -13)^T$ using the factors already computed.

Forward substitution with $\mathbf{L}$: $y_1 = 3$; $y_2 = 4 - 2\,y_1 = 4 - 6 = -2$; $y_3 = -13 - (-1)\,y_1 - 3\,y_2 = -13 + 3 + 6 = -4$. So $\mathbf{y} = (3, -2, -4)^T$.

Back substitution with $\mathbf{U}$: $x_3 = -4/4 = -1$; $x_2 = (-2 - 2\,x_3)/(-3) = (-2 + 2)/(-3) = 0$; $x_1 = (3 - x_2 - x_3)/2 = (3 - 0 + 1)/2 = 2$. So $\mathbf{x} = (2, 0, -1)^T$.

Check in the third original equation: $-2(2) - 10(0) + 9(-1) = -4 - 9 = -13$. The factorisation did not have to be repeated; the new solve took eighteen multiply-adds.
:::

The pivots carry one more piece of information. The determinant lesson will show that the determinant of a product is the product of determinants and that the determinant of a triangular matrix is the product of its diagonal. Since $\det\mathbf{L} = 1$, the determinant of $\mathbf{A}$ is the product of the pivots: here $2 \times (-3) \times 4 = -24$. Elimination gives you the determinant for free, and this is how software computes determinants — never by expanding cofactors.

::: key LU factorisation
Gaussian elimination without row swaps writes $\mathbf{A} = \mathbf{L}\mathbf{U}$, with $\mathbf{U}$ upper triangular (its diagonal holds the pivots) and $\mathbf{L}$ unit lower triangular holding the multipliers $m_{ij} = A_{ij}/A_{jj}$ (the entry to clear divided by the pivot). Solve $\mathbf{A}\mathbf{x} = \mathbf{b}$ by $\mathbf{L}\mathbf{y} = \mathbf{b}$ then $\mathbf{U}\mathbf{x} = \mathbf{y}$. Factoring costs about $\tfrac{2}{3}n^3$ operations; each solve about $2n^2$.
:::

## Why you must pivot

### A zero pivot

Elimination as described divides by each pivot, so it fails outright if a pivot is zero. The system

$$
\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 2 \\ 3 \end{pmatrix}
$$

is perfectly well posed — its solution is $\mathbf{x} = (3, 2)^T$ by inspection — yet the first pivot is $0$ and the multiplier $m_{21} = 1/0$ does not exist. The cure is the row operation not yet used: swap rows 1 and 2, then eliminate. A zero pivot never means the system is unsolvable; it means the equations are in an unhelpful order.

### A small pivot

The subtler failure is a pivot that is not zero but small. Work through a system in **three-significant-figure arithmetic**, rounding every intermediate result to three significant figures the way a computer rounds to its own fixed precision:

$$
\begin{pmatrix} 0.0001 & 1 \\ 1 & 1 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 1 \\ 2 \end{pmatrix}.
$$

Subtracting the equations exactly gives $x_1 = 1/0.9999 = 1.0001$ and $x_2 = 2 - x_1 = 0.9999$; to three figures the answer is $\mathbf{x} = (1.00, 1.00)^T$.

**Without pivoting**, the multiplier is $m_{21} = 1/0.0001 = 10\,000$. Row 2 becomes $1 - 10\,000 \times 1 = -9999$, which rounds to $-10\,000$, and the right-hand side becomes $2 - 10\,000 \times 1 = -9998$, which also rounds to $-10\,000$. Back substitution gives $x_2 = -10\,000 / -10\,000 = 1.00$, correct, and then

$$
x_1 = \frac{1 - x_2}{0.0001} = \frac{1 - 1.00}{0.0001} = 0 .
$$

The computed $x_1$ is $0$; the true value is $1.00$. Every significant digit is gone. The damage was done when the large multiplier turned the entries of row 2 into numbers around $10^4$, so that the original information in that row — the $1$ and the $2$ — was rounded away as noise. Back substitution then recovered $x_1$ by subtracting two nearly equal numbers, $1$ and $1.00$, and dividing the tiny difference by a tiny pivot, which amplified the rounding error by $10^4$.

**With partial pivoting**, look down column 1 for the largest entry in magnitude, which is the $1$ in row 2, and swap the rows first:

$$
\begin{pmatrix} 1 & 1 \\ 0.0001 & 1 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 2 \\ 1 \end{pmatrix}.
$$

Now $m_{21} = 0.0001$. Row 2 becomes $1 - 0.0001 \times 1 = 0.9999$, which rounds to $1.00$, and its right-hand side becomes $1 - 0.0002 = 0.9998$, rounding to $1.00$. Then $x_2 = 1.00$ and $x_1 = 2 - 1.00 = 1.00$. Both components are correct to the working precision.

The rule is **partial pivoting**: at each step, before eliminating in column $k$, swap into the pivot position the row (among those not yet used) with the largest $|A_{ik}|$. Because the pivot is then the largest entry in its column, every multiplier satisfies $|m_{ik}| \le 1$. Multipliers bounded by one cannot inflate the rows they act on, so the round-off in each row operation stays comparable to the round-off already present, and the elimination is numerically stable in practice. In double precision the same story plays out with a pivot of $10^{-17}$ instead of $10^{-4}$, and the result without pivoting is just as wrong.

::: key Why Gaussian elimination pivots
Dividing by a tiny pivot amplifies round-off into the multipliers and the rows they modify. Partial pivoting swaps in the largest-magnitude entry of the column, which bounds every multiplier by $1$ and keeps elimination numerically stable. A zero pivot is handled by the same swap.
:::

### The factorisation with pivoting

Row swaps are linear maps too: swapping rows is left-multiplication by a **permutation matrix** $\mathbf{P}$, an identity with its rows reordered. Elimination with partial pivoting therefore produces

$$
\mathbf{P}\mathbf{A} = \mathbf{L}\mathbf{U},
$$

the LU factorisation of a row-reordered copy of $\mathbf{A}$. To solve $\mathbf{A}\mathbf{x} = \mathbf{b}$, apply the same reordering to the right-hand side and proceed as before: $\mathbf{L}\mathbf{y} = \mathbf{P}\mathbf{b}$, then $\mathbf{U}\mathbf{x} = \mathbf{y}$. In code, $\mathbf{P}$ is never stored as a matrix — an integer array recording the row order does the same job in $n$ entries instead of $n^2$. This is what `numpy.linalg.solve` does, through the LAPACK routine `getrf`. Each row swap flips the sign of the determinant, so with pivoting $\det\mathbf{A} = (-1)^{s}\prod_i U_{ii}$ where $s$ is the number of swaps performed.

### Detecting a singular matrix

If, after choosing the largest available entry in a column, that entry is still zero, then every remaining row has a zero in that column, and no row operation can create a pivot. The matrix is **singular**: its columns are dependent, and $\mathbf{A}\mathbf{x} = \mathbf{b}$ has either no solution or infinitely many. In floating point the pivot is rarely exactly zero; the practical test is whether it is negligible compared with the size of the entries you started with, say $|U_{kk}| < 10^{-12} \max_{ij} |A_{ij}|$. A solver should refuse to continue at that point rather than divide by a number that is pure round-off — that refusal is one of the tests in this module's solver exercise.

::: warning Small pivots are not the same as an ill-conditioned matrix
Pivoting cures the artificial instability that comes from a bad row order. It does not cure a matrix whose columns are nearly dependent — two accelerometers pointing almost the same way, for instance. Such a matrix loses digits in *any* order of elimination, because the problem itself amplifies errors in $\mathbf{b}$ into much larger errors in $\mathbf{x}$. That amplification factor is the condition number, and Linear Algebra II measures it with the singular value decomposition.
:::

::: warning Do not test a pivot against exactly zero
`if U[k, k] == 0` will pass a pivot of $10^{-300}$ and then divide by it. Compare against a tolerance scaled to the matrix, and treat anything below it as singular.
:::

```python
import numpy as np

def back_substitute(U: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Solve U x = y for upper-triangular U, from the bottom row up."""
    n = len(y)
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (y[i] - U[i, i + 1:] @ x[i + 1:]) / U[i, i]
    return x

U = np.array([[2.0, 1.0, 1.0], [0.0, -3.0, 2.0], [0.0, 0.0, 4.0]])
print(back_substitute(U, np.array([3.0, 12.0, 12.0])))   # [ 1. -2.  3.]
```

## Check yourself

::: check
Solve $\begin{pmatrix} 3 & 2 \\ 6 & 7 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 7 \\ 20 \end{pmatrix}$ by elimination, and write down the $\mathbf{L}$ and $\mathbf{U}$ factors you produced along the way.
:::

::: answer
Pivot $3$, multiplier $m_{21} = 6/3 = 2$. Row 2 becomes $(6, 7 \mid 20) - 2\,(3, 2 \mid 7) = (0, 3 \mid 6)$. Back substitution: $x_2 = 2$, then $3x_1 + 4 = 7$ gives $x_1 = 1$. The factors are $\mathbf{L} = \begin{pmatrix} 1 & 0 \\ 2 & 1 \end{pmatrix}$ and $\mathbf{U} = \begin{pmatrix} 3 & 2 \\ 0 & 3 \end{pmatrix}$; check that row 2 of $\mathbf{L}\mathbf{U}$ is $2\,(3, 2) + (0, 3) = (6, 7)$. The determinant is the product of pivots, $3 \times 3 = 9$, which agrees with $3 \times 7 - 2 \times 6 = 9$.
:::

::: check
You have $\mathbf{L}$ and $\mathbf{U}$ for a $200 \times 200$ matrix and need to solve against 50 right-hand sides. Roughly how many floating-point operations does it take, and how does that compare with refactoring for each one?
:::

::: answer
Each solve is two triangular substitutions at about $n^2$ operations each, so about $2 \times 200^2 = 80\,000$ operations, and 50 of them cost about $4 \times 10^6$. Refactoring each time would cost $50 \times \tfrac{2}{3}\,200^3 \approx 2.7 \times 10^8$ — nearly seventy times more. Factor once, solve many.
:::

::: check
In the three-figure example, the pivoted elimination computed row 2 as $0.9999 \to 1.00$, throwing away the $0.0001$. Why did that rounding not harm the answer, when the rounding in the unpivoted case did?
:::

::: answer
The discarded $0.0001$ was small relative to the entry it was part of, so the relative error introduced was $10^{-4}$, within the working precision. In the unpivoted case the multiplier of $10^4$ made the row entries about $10^4$ times larger than the original data, so rounding to three figures discarded quantities of order $10$ — the entire original row. Pivoting keeps the multipliers at most $1$, so the rounding error stays at the level of the precision instead of being multiplied by the reciprocal of the pivot.
:::

::: check
Elimination on a $3 \times 3$ matrix required swapping rows 1 and 2 at the first step and produced pivots $3$, $2$ and $-1.5$. What is the determinant?
:::

::: answer
The product of pivots is $3 \times 2 \times (-1.5) = -9$. One row swap flips the sign, so $\det\mathbf{A} = (-1)^1 \times (-9) = 9$.
:::

::: check
During pivoted elimination the largest entry available for the third pivot of a $4 \times 4$ matrix is $3 \times 10^{-17}$, while the original matrix entries were of order $1$. What should the solver conclude, and what does that say about the matrix?
:::

::: answer
A pivot of $3 \times 10^{-17}$ against data of order $1$ is below double-precision round-off (about $2 \times 10^{-16}$ relative). The solver should treat it as zero and raise a singular-matrix error rather than divide by it. The matrix is singular to working precision: its columns (equivalently, its rows) are linearly dependent, or so close to dependent that the difference is indistinguishable from rounding noise, and no unique solution can be trusted.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $x_i = \big(y_i - \sum_{j>i} U_{ij} x_j\big)/U_{ii}$ | Back substitution for an upper-triangular system; about $n^2$ operations |
| $m_{ij} = A_{ij}/A_{jj}$ | Multiplier: subtract $m_{ij}$ times pivot row $j$ from row $i$ |
| $\mathbf{A} = \mathbf{L}\mathbf{U}$ | Elimination as a factorisation: $\mathbf{L}$ unit lower triangular (multipliers), $\mathbf{U}$ upper triangular (pivots) |
| $\mathbf{L}\mathbf{y} = \mathbf{b}$, then $\mathbf{U}\mathbf{x} = \mathbf{y}$ | Two triangular solves replace one general solve |
| $\tfrac{2}{3}n^3$ and $2n^2$ | Cost to factor, and cost of each subsequent solve |
| $\mathbf{P}\mathbf{A} = \mathbf{L}\mathbf{U}$ | LU with partial pivoting; $\mathbf{P}$ records the row swaps |
| $\lvert m_{ik} \rvert \le 1$ | What pivoting guarantees, and why it is stable |
| $\det\mathbf{A} = (-1)^s \prod_i U_{ii}$ | Determinant from the pivots, $s$ = number of swaps |

Elimination told you when a system has a unique solution: every pivot was nonzero. The next lesson asks what the failure looks like — which directions of $\mathbf{x}$ a singular matrix cannot see, and which right-hand sides it can reach — and names the answers rank, null space and column space.
