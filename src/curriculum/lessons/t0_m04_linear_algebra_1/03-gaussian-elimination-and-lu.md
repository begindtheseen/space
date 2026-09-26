---
id: l03-gaussian-elimination-and-lu
title: Gaussian elimination and LU factorisation
minutes: 20
covers:
  - Gaussian elimination and LU factorisation
---

Almost every number-crunching routine in a GNC stack ends up asking the same question. Given a square matrix $\mathbf{A}$ and a vector $\mathbf{b}$, which vector $\mathbf{x}$ makes $\mathbf{A}\mathbf{x} = \mathbf{b}$ true? A Kalman filter asks it at every update, when it works out how much to trust a new measurement. A least-squares fit asks it when it finds the best line through noisy data. A trim routine asks it when it balances the forces and the twisting effects, called moments, on an aircraft. The previous lesson gave the paper answer, $\mathbf{x} = \mathbf{A}^{-1}\mathbf{b}$, and warned you not to compute it that way. This lesson gives the real answer.

The real answer is **[[Gaussian elimination|nine-chapters]]**: subtract multiples of one equation from the others until the system is shaped like a staircase, then solve the staircase from the bottom step up. Written with matrices, those subtractions split $\mathbf{A}$ into a lower-triangular matrix $\mathbf{L}$ times an upper-triangular matrix $\mathbf{U}$. That **LU factorisation** is what `numpy.linalg.solve` and every serious linear-algebra library actually computes. Knowing what is inside the box tells you what it costs, when it fails, and why it insists on swapping rows even when nothing seems to need swapping.

That row swapping is called **partial pivoting**. It is the part most often skipped in a first course, and most often the reason a home-made solver produces garbage. This lesson shows it with a worked example in which skipping it wipes out every correct digit of the answer.

## Triangular systems are easy

Start with a kind of system that needs no cleverness. Picture three equations stacked like the steps of a staircase, where the bottom step has one unknown, the next has two, and the top has three:

$$
\begin{aligned}
U_{11} x_1 + U_{12} x_2 + U_{13} x_3 &= y_1 \\
U_{22} x_2 + U_{23} x_3 &= y_2 \\
U_{33} x_3 &= y_3 .
\end{aligned}
$$

The matrix of numbers on the left, $\mathbf{U}$, is **upper triangular**: every entry below its main diagonal is zero. ($U_{23}$ is read "U two three": row 2, column 3.)

Solve it from the [[bottom up|staircase]]. The last equation has one unknown, so $x_3 = y_3 / U_{33}$. Put that value into the second equation, and it now has one unknown too: $x_2 = (y_2 - U_{23} x_3)/U_{22}$. Then the top equation gives $x_1$. This is **back substitution**, and in general

$$
x_i = \frac{1}{U_{ii}}\Big( y_i - \sum_{j > i} U_{ij}\,x_j \Big), \qquad i = n, n-1, \dots, 1 .
$$

In words: for row $i$, take the right-hand side, subtract everything already known, and divide by the diagonal entry. The $\sum_{j > i}$ means "add up over the columns to the right of the diagonal".

It works as long as no diagonal entry $U_{ii}$ is zero, since you divide by each one. Row $i$ costs about $n - i$ multiply-adds, so the whole solve costs about $n^2/2$ multiply-adds — about $n^2$ **[[floating-point operations|flops]]** if you count each multiplication and each addition separately.

A **lower-triangular** matrix $\mathbf{L}$ has zeros *above* its diagonal. The system $\mathbf{L}\mathbf{y} = \mathbf{b}$ is solved the same way from the top down, and that is called **forward substitution**.

Elimination is the process of turning any system into a triangular one.

## Elimination by row operations

You already know the idea from shopping. Receipt one says 2 apples and 1 banana cost 5 dollars. Receipt two says 2 apples and 3 bananas cost 9 dollars. Subtract the first receipt from the second: the apples cancel, and 2 bananas cost 4 dollars. So a banana is 2 dollars, and then an apple is $(5 - 2)/2 = 1.5$ dollars. Subtracting one equation from another to knock out an unknown — that is elimination.

To keep the bookkeeping tidy, write the matrix and the right-hand side side by side as one table, the **augmented system** $[\mathbf{A} \mid \mathbf{b}]$. Three things can be done to its rows without changing the solution:

1. Swap two rows.
2. Multiply a row by a number that is not zero.
3. Add a multiple of one row to another row.

Each of these reorders or recombines the equations without adding or losing any information, and each can be undone. So any $\mathbf{x}$ that satisfied the old equations satisfies the new ones, and the other way round.

Gaussian elimination uses the third operation, over and over, in a fixed order. Look at the first row. Its leading entry, $A_{11}$, is called the **[[pivot|pivot-word]]** — the entry the step turns on. For each row $i$ below it, compute the **multiplier**

$$
m_{i1} = \frac{A_{i1}}{A_{11}}
$$

(the entry you want to clear, divided by the pivot), and subtract $m_{i1}$ times row 1 from row $i$. The new row $i$ has a zero in column 1. Then move to row 2. Its leading entry, as it now stands, is the second pivot, and you clear everything below it in column 2. Keep going until the matrix is upper triangular.

::: example Eliminating a three-by-three system
Solve

$$
\begin{pmatrix} 2 & 1 & 1 \\ 4 & -1 & 4 \\ -2 & -10 & 9 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 3 \\ 18 \\ 45 \end{pmatrix}.
$$

**Column 1.** The pivot is $2$. The multipliers are $m_{21} = 4/2 = 2$ and $m_{31} = -2/2 = -1$.

- Row 2 minus 2 times row 1: $(4, -1, 4 \mid 18) - 2\,(2, 1, 1 \mid 3) = (4 - 4,\ -1 - 2,\ 4 - 2 \mid 18 - 6) = (0, -3, 2 \mid 12)$.
- Row 3 minus $(-1)$ times row 1, which means *plus* row 1: $(-2, -10, 9 \mid 45) + (2, 1, 1 \mid 3) = (0, -9, 10 \mid 48)$.

**Column 2.** The pivot is now $-3$. The multiplier is $m_{32} = -9/(-3) = 3$.

- Row 3 minus 3 times row 2: $(0, -9, 10 \mid 48) - 3\,(0, -3, 2 \mid 12) = (0,\ -9 + 9,\ 10 - 6 \mid 48 - 36) = (0, 0, 4 \mid 12)$.

The system is now a staircase:

$$
\begin{pmatrix} 2 & 1 & 1 \\ 0 & -3 & 2 \\ 0 & 0 & 4 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 3 \\ 12 \\ 12 \end{pmatrix}.
$$

**Back substitution.** Bottom row: $4x_3 = 12$, so $x_3 = 3$. Middle row: $-3x_2 + 2(3) = 12$, so $-3x_2 = 6$ and $x_2 = -2$. Top row: $2x_1 + (-2) + 3 = 3$, so $2x_1 = 2$ and $x_1 = 1$. The answer is $\mathbf{x} = (1, -2, 3)^T$.

**Check** in the original second equation: $4(1) - 1(-2) + 4(3) = 4 + 2 + 12 = 18$. Correct.
:::

## Elimination is a factorisation

Look at what the elimination did to the matrix alone, ignoring the right-hand side. It turned $\mathbf{A}$ into the upper-triangular

$$
\mathbf{U} = \begin{pmatrix} 2 & 1 & 1 \\ 0 & -3 & 2 \\ 0 & 0 & 4 \end{pmatrix},
$$

whose diagonal entries are the pivots: $2$, $-3$, $4$.

Each step — "subtract $m_{ij}$ times row $j$ from row $i$" — is itself a linear map acting on the rows. So by the previous lesson it is a matrix, applied on the left. That matrix is the identity with $-m_{ij}$ placed in position $(i, j)$. Call it $\mathbf{E}_{ij}$, an **elimination matrix**. The whole elimination, read right to left, is

$$
\mathbf{E}_{32}\,\mathbf{E}_{31}\,\mathbf{E}_{21}\,\mathbf{A} = \mathbf{U} .
$$

Each $\mathbf{E}_{ij}$ is easy to undo: add the multiple back. Its inverse is the identity with $+m_{ij}$ in position $(i, j)$. Multiply both sides on the left by the inverses, in reverse order (socks and shoes again):

$$
\mathbf{A} = \mathbf{E}_{21}^{-1}\,\mathbf{E}_{31}^{-1}\,\mathbf{E}_{32}^{-1}\,\mathbf{U} = \mathbf{L}\mathbf{U} .
$$

The product $\mathbf{L}$ of those three inverses turns out to be wonderfully simple. The multipliers drop into their own slots below the diagonal, with no mixing:

$$
\mathbf{L} = \begin{pmatrix} 1 & 0 & 0 \\ m_{21} & 1 & 0 \\ m_{31} & m_{32} & 1 \end{pmatrix} = \begin{pmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ -1 & 3 & 1 \end{pmatrix}.
$$

::: note Why it has to be true
Build $\mathbf{L} = \mathbf{E}_{21}^{-1}\,\mathbf{E}_{31}^{-1}\,\mathbf{E}_{32}^{-1}\,\mathbf{I}$ by applying the three row operations to the identity, starting with the factor nearest to $\mathbf{I}$.

- $\mathbf{E}_{32}^{-1}$ adds $m_{32}$ times row 2 to row 3. Row 2 of the identity is $(0, 1, 0)$, so this puts $m_{32}$ in position $(3, 2)$.
- $\mathbf{E}_{31}^{-1}$ adds $m_{31}$ times row 1 to row 3. Row 1 is still $(1, 0, 0)$, so this puts $m_{31}$ in position $(3, 1)$ and touches nothing else.
- $\mathbf{E}_{21}^{-1}$ adds $m_{21}$ times row 1 to row 2, putting $m_{21}$ in position $(2, 1)$.

Every step adds a row that is still a plain row of the identity, so the multipliers land in their own slots without interfering.
:::

$\mathbf{L}$ is **unit lower triangular**: ones on the diagonal, the multipliers below it, zeros above. It is a record of the elimination. Multiply it out to confirm. Row 3 of $\mathbf{L}\mathbf{U}$ is $-1$ of row 1 of $\mathbf{U}$, plus 3 of row 2, plus 1 of row 3:

$$
-1\,(2, 1, 1) + 3\,(0, -3, 2) + 1\,(0, 0, 4) = (-2 + 0 + 0,\ -1 - 9 + 0,\ -1 + 6 + 4) = (-2, -10, 9),
$$

the third row of $\mathbf{A}$. The factorisation is exact:

$$
\begin{pmatrix} 2 & 1 & 1 \\ 4 & -1 & 4 \\ -2 & -10 & 9 \end{pmatrix} = \begin{pmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ -1 & 3 & 1 \end{pmatrix}\begin{pmatrix} 2 & 1 & 1 \\ 0 & -3 & 2 \\ 0 & 0 & 4 \end{pmatrix}.
$$

This is the **LU factorisation**. Elimination on the matrix, with the multipliers written down, *is* the factorisation. No extra work is needed.

### Solving with the factors

Once you know $\mathbf{A} = \mathbf{L}\mathbf{U}$, the system $\mathbf{A}\mathbf{x} = \mathbf{b}$ reads $\mathbf{L}(\mathbf{U}\mathbf{x}) = \mathbf{b}$. Give the inside part a name, $\mathbf{y} = \mathbf{U}\mathbf{x}$, and solve two staircases:

$$
\mathbf{L}\mathbf{y} = \mathbf{b} \quad \text{(forward substitution)}, \qquad \mathbf{U}\mathbf{x} = \mathbf{y} \quad \text{(back substitution)}.
$$

The vector $\mathbf{y}$ is exactly the changed right-hand side that elimination produced — $(3, 12, 12)^T$ in the example. So this is the same computation, split so that the work on the matrix and the work on the right-hand side happen separately.

That split is the whole point. Factoring costs about $\tfrac{2}{3}n^3$ floating-point operations. Here is where that comes from: clearing column 1 needs $n - 1$ multipliers and updates about $(n-1)^2$ entries; column 2 updates about $(n-2)^2$; and so on. The sum of those squares is about $n^3/3$, and each update is a multiply and an add, which doubles it. The two triangular solves cost about $2n^2$ between them.

For $n = 1000$, that is about $6.7 \times 10^8$ operations to factor and $2 \times 10^6$ to solve. If you must solve with the same $\mathbf{A}$ and many different $\mathbf{b}$, you factor once and reuse $\mathbf{L}$ and $\mathbf{U}$ for each new right-hand side, at a tiny fraction of the cost. A [[Kalman filter does exactly this|kalman-reuse]] when it computes its gain.

::: example Reusing the factors for a new right-hand side
Solve the same matrix against $\mathbf{b} = (3, 4, -13)^T$, using the $\mathbf{L}$ and $\mathbf{U}$ already found.

**Forward substitution with $\mathbf{L}$**, top row first:

- $y_1 = 3$.
- $y_2 = 4 - 2\,y_1 = 4 - 6 = -2$.
- $y_3 = -13 - (-1)\,y_1 - 3\,y_2 = -13 + 3 + 6 = -4$.

So $\mathbf{y} = (3, -2, -4)^T$.

**Back substitution with $\mathbf{U}$**, bottom row first:

- $x_3 = -4/4 = -1$.
- $x_2 = (-2 - 2\,x_3)/(-3) = (-2 + 2)/(-3) = 0$.
- $x_1 = (3 - x_2 - x_3)/2 = (3 - 0 + 1)/2 = 2$.

So $\mathbf{x} = (2, 0, -1)^T$.

**Check** in the third original equation: $-2(2) - 10(0) + 9(-1) = -4 - 9 = -13$. Correct. The factorisation did not have to be repeated. The new solve took fifteen arithmetic operations — six for the forward pass and nine for the back pass.
:::

The pivots carry one more piece of information. The determinant lesson will show that the determinant of a product is the product of the determinants, and that the determinant of a triangular matrix is the product of its diagonal. Since $\mathbf{L}$ has ones on its diagonal, $\det\mathbf{L} = 1$, and so the determinant of $\mathbf{A}$ is the product of the pivots: here $2 \times (-3) \times 4 = -24$. Elimination hands you the determinant for free. That is how software computes determinants.

::: key LU factorisation
Gaussian elimination without row swaps writes $\mathbf{A} = \mathbf{L}\mathbf{U}$, with $\mathbf{U}$ upper triangular (its diagonal holds the pivots) and $\mathbf{L}$ unit lower triangular holding the multipliers $m_{ij} = A_{ij}/A_{jj}$ (the entry to clear divided by the pivot, both as they stand at that step). Solve $\mathbf{A}\mathbf{x} = \mathbf{b}$ by $\mathbf{L}\mathbf{y} = \mathbf{b}$ then $\mathbf{U}\mathbf{x} = \mathbf{y}$. Factoring costs about $\tfrac{2}{3}n^3$ operations; each solve about $2n^2$.
:::

## Why you must pivot

### A zero pivot

Elimination divides by each pivot, so it fails outright if a pivot is zero. Look at

$$
\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 2 \\ 3 \end{pmatrix}.
$$

Read it as two equations: $x_2 = 2$ and $x_1 = 3$. The answer is $\mathbf{x} = (3, 2)^T$ — you can see it without doing anything. Yet the first pivot is $0$, and the multiplier $m_{21} = 1/0$ does not exist.

The cure is the row operation we have not used yet: swap rows 1 and 2, then eliminate. A zero pivot never means the system has no answer. It means the equations are in an unhelpful order.

### A small pivot

The sneakier failure is a pivot that is not zero but tiny. To see it, work in **[[three-significant-figure arithmetic|significant-figures]]**: round every intermediate result to three significant figures, the way a computer rounds everything to its own fixed number of digits. Take

$$
\begin{pmatrix} 0.0001 & 1 \\ 1 & 1 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 1 \\ 2 \end{pmatrix}.
$$

First, the true answer, worked exactly. Subtract the first equation from the second: $0.9999\,x_1 = 1$, so $x_1 = 1/0.9999 = 1.0001$, and then $x_2 = 2 - x_1 = 0.9999$. To three figures, [[the answer is|crossing-lines]] $\mathbf{x} = (1.00, 1.00)^T$.

**Without pivoting**, the pivot is $0.0001$ and the multiplier is $m_{21} = 1/0.0001 = 10\,000$.

- Row 2's second entry becomes $1 - 10\,000 \times 1 = -9999$, which rounds to $-10\,000$.
- Its right-hand side becomes $2 - 10\,000 \times 1 = -9998$, which also rounds to $-10\,000$.
- Back substitution gives $x_2 = -10\,000 / -10\,000 = 1.00$. Correct so far.
- Then

$$
x_1 = \frac{1 - x_2}{0.0001} = \frac{1 - 1.00}{0.0001} = 0 .
$$

The computed $x_1$ is $0$. The true value is $1.00$. Every correct digit is gone.

What went wrong? The huge multiplier turned row 2's entries into numbers around $10^4$. Rounding those to three figures threw away the original information in that row — its $1$ and its $2$ — as if it were noise. Then back substitution found $x_1$ by subtracting two nearly equal numbers, $1$ and $1.00$, and dividing the tiny leftover by a tiny pivot. That division magnified the rounding error by $10^4$.

**With partial pivoting**, first look down column 1 for the entry with the largest size. It is the $1$ in row 2. Swap the rows before eliminating:

$$
\begin{pmatrix} 1 & 1 \\ 0.0001 & 1 \end{pmatrix}\mathbf{x} = \begin{pmatrix} 2 \\ 1 \end{pmatrix}.
$$

Now the multiplier is $m_{21} = 0.0001/1 = 0.0001$.

- Row 2's second entry becomes $1 - 0.0001 \times 1 = 0.9999$, which rounds to $1.00$.
- Its right-hand side becomes $1 - 0.0001 \times 2 = 0.9998$, which rounds to $1.00$.
- So $x_2 = 1.00$, and then $x_1 = 2 - 1.00 = 1.00$.

Both components are right to the working precision.

The rule is **partial pivoting**: at each step, before clearing column $k$, look at the rows not yet used and swap into the pivot position the one with the largest $|A_{ik}|$. The pivot is then the biggest entry in its column, so every multiplier has size at most one: $|m_{ik}| \le 1$. A multiplier no bigger than one cannot blow up the row it is applied to. The rounding in each step stays about as small as the rounding already there, and elimination is numerically stable in practice.

In double precision, the arithmetic laptops and many flight computers use, the same story plays out with a pivot of $10^{-17}$ instead of $10^{-4}$, and the unpivoted answer is equally wrong.

::: key Why Gaussian elimination pivots
Dividing by a tiny pivot amplifies round-off into the multipliers and the rows they modify. Partial pivoting swaps in the largest-magnitude entry of the column, which bounds every multiplier by $1$ and keeps elimination numerically stable. A zero pivot is handled by the same swap.
:::

### The factorisation with pivoting

Row swaps are linear maps too. Swapping rows is multiplying on the left by a **permutation matrix** $\mathbf{P}$ — an identity with its rows put in a different order. So elimination with partial pivoting produces

$$
\mathbf{P}\mathbf{A} = \mathbf{L}\mathbf{U},
$$

the LU factorisation of a row-shuffled copy of $\mathbf{A}$. To solve $\mathbf{A}\mathbf{x} = \mathbf{b}$, shuffle the right-hand side the same way, then carry on as before: $\mathbf{L}\mathbf{y} = \mathbf{P}\mathbf{b}$, then $\mathbf{U}\mathbf{x} = \mathbf{y}$.

In code, $\mathbf{P}$ is never stored as a full matrix. A list of integers recording the row order does the same job in $n$ entries instead of $n^2$. This is what `numpy.linalg.solve` does, through the **[[LAPACK|lapack]]** routine `gesv`, which factors with `getrf` and then solves. Because the library pivots, the [[factors it returns|library-factors]] can differ from the ones you get by hand without swaps.

Each row swap flips the sign of the determinant. So with pivoting, $\det\mathbf{A} = (-1)^{s}\prod_i U_{ii}$, where $s$ is the number of swaps and $\prod_i$ (a capital Greek pi, read "product over i") means multiply the diagonal entries together.

### Detecting a singular matrix

Suppose that after choosing the largest available entry in a column, that entry is still zero. Then every remaining row has a zero in that column, and no row operation can make a pivot there. The matrix is **singular**: its columns depend on one another, and $\mathbf{A}\mathbf{x} = \mathbf{b}$ has either no solution or infinitely many.

In floating point the pivot is rarely exactly zero. The practical test is whether it is negligible compared with the size of the entries you started with — for example $|U_{kk}| < 10^{-12} \max_{ij} |A_{ij}|$. At that point a solver should stop and report the problem — in Python, `raise ValueError("matrix is singular")` — rather than divide by a number that is pure round-off. That refusal is one of the tests in this module's solver exercise. A matrix that is not quite singular but **[[nearly singular|ill-conditioned]]** is a different, deeper problem, and the warning below says why.

::: warning Small pivots are not the same as an ill-conditioned matrix
Pivoting cures the artificial trouble that comes from a bad row order. It does not cure a matrix whose columns are nearly dependent — two accelerometers pointing almost the same way, for instance. Such a matrix loses digits in *any* order of elimination, because the problem itself magnifies errors in $\mathbf{b}$ into much larger errors in $\mathbf{x}$. That magnification factor is the condition number, and Linear Algebra II measures it with the singular value decomposition.
:::

::: warning Do not test a pivot against exactly zero
`if U[k, k] == 0` will let a pivot of $10^{-300}$ through and then divide by it. Compare against a tolerance scaled to the matrix, and treat anything below it as singular.
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
The pivot is $3$ and the multiplier is $m_{21} = 6/3 = 2$. Row 2 minus 2 times row 1: $(6, 7 \mid 20) - 2\,(3, 2 \mid 7) = (0, 3 \mid 6)$.

Back substitution: $3x_2 = 6$ gives $x_2 = 2$. Then $3x_1 + 2(2) = 7$ gives $3x_1 = 3$ and $x_1 = 1$.

The factors are $\mathbf{L} = \begin{pmatrix} 1 & 0 \\ 2 & 1 \end{pmatrix}$ and $\mathbf{U} = \begin{pmatrix} 3 & 2 \\ 0 & 3 \end{pmatrix}$. Check: row 2 of $\mathbf{L}\mathbf{U}$ is $2\,(3, 2) + (0, 3) = (6, 7)$.

The determinant is the product of the pivots, $3 \times 3 = 9$, which agrees with $ad - bc = 3 \times 7 - 2 \times 6 = 9$.
:::

::: check
You have $\mathbf{L}$ and $\mathbf{U}$ for a $200 \times 200$ matrix and need to solve against 50 right-hand sides. Roughly how many floating-point operations does it take, and how does that compare with refactoring for each one?
:::

::: answer
Each solve is two triangular substitutions at about $n^2$ operations each, so about $2 \times 200^2 = 80\,000$ operations. Fifty of them cost about $4 \times 10^6$.

Refactoring each time would cost $50 \times \tfrac{2}{3} \times 200^3 \approx 2.7 \times 10^8$ — about 67 times more. Factor once, solve many.
:::

::: check
In the three-figure example, the pivoted elimination rounded row 2's entry $0.9999$ to $1.00$, throwing away the $0.0001$. Why did that rounding not harm the answer, when the rounding in the unpivoted case did?
:::

::: answer
The discarded $0.0001$ was small compared with the entry it belonged to, so the error it introduced was about $10^{-4}$ of that entry — within the three-figure precision anyway.

In the unpivoted case, the multiplier of $10^4$ made the row's entries about $10^4$ times larger than the original data. Rounding those to three figures threw away amounts of order $10$ — which wiped out the entire original row. Pivoting keeps the multipliers at most $1$, so rounding errors stay at the level of the working precision instead of being multiplied by one over the pivot.
:::

::: check
Elimination on a $3 \times 3$ matrix needed one swap, of rows 1 and 2, at the first step, and produced pivots $3$, $2$ and $-1.5$. What is the determinant?
:::

::: answer
The product of the pivots is $3 \times 2 \times (-1.5) = -9$. One row swap flips the sign, so $\det\mathbf{A} = (-1)^1 \times (-9) = 9$.
:::

::: check
During pivoted elimination on a $4 \times 4$ matrix, the largest entry available for the third pivot is $3 \times 10^{-17}$, while the original matrix entries were around $1$. What should the solver conclude, and what does that say about the matrix?
:::

::: answer
A pivot of $3 \times 10^{-17}$ against data of size about $1$ is smaller than double-precision round-off, which is about $2 \times 10^{-16}$ relative to the numbers involved. It is indistinguishable from zero. The solver should treat it as zero and raise a singular-matrix error rather than divide by it.

The matrix is singular to working precision. Its columns (and its rows) are linearly dependent, or so close to dependent that the difference is lost in rounding, and no unique solution can be trusted.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $x_i = \big(y_i - \sum_{j>i} U_{ij} x_j\big)/U_{ii}$ | Back substitution for an upper-triangular system; about $n^2$ operations |
| $m_{ij} = A_{ij}/A_{jj}$ | Multiplier: subtract $m_{ij}$ times pivot row $j$ from row $i$ |
| $\mathbf{A} = \mathbf{L}\mathbf{U}$ | Elimination as a factorisation: $\mathbf{L}$ unit lower triangular (multipliers), $\mathbf{U}$ upper triangular (pivots) |
| $\mathbf{L}\mathbf{y} = \mathbf{b}$, then $\mathbf{U}\mathbf{x} = \mathbf{y}$ | Two triangular solves replace one general solve |
| $\tfrac{2}{3}n^3$ and $2n^2$ | Cost to factor, and cost of each later solve |
| $\mathbf{P}\mathbf{A} = \mathbf{L}\mathbf{U}$ | LU with partial pivoting; $\mathbf{P}$ records the row swaps |
| $\lvert m_{ik} \rvert \le 1$ | What pivoting guarantees, and why it is stable |
| $\det\mathbf{A} = (-1)^s \prod_i U_{ii}$ | Determinant from the pivots, $s$ = number of swaps |

Elimination told you when a system has exactly one solution: every pivot was nonzero. The next lesson asks what failure looks like — which directions of $\mathbf{x}$ a singular matrix cannot see, and which right-hand sides it can reach — and names the answers rank, null space and column space.

::: context nine-chapters Older than Gauss
The method is far older than the man it is named after. A Chinese book, *The Nine Chapters on the Mathematical Art*, compiled roughly two thousand years ago, solves systems of equations by laying numbers out in a grid of counting rods and subtracting columns from one another — elimination in all but name.

Carl Friedrich Gauss's name became attached after he used the method in the early 1800s to work out asteroid orbits from telescope sightings. The name stuck.
:::

::: context staircase Why the bottom step comes first
In an upper-triangular system, the shaded entries can be anything and everything below the diagonal is zero. The bottom row holds only $x_3$, so it is solved first; each row above then has only one new unknown.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <defs><marker id="st-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker></defs>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="40" y="30" width="44" height="44" fill="#8fb8f0"/><rect x="84" y="30" width="44" height="44" fill="#8fb8f0"/><rect x="128" y="30" width="44" height="44" fill="#8fb8f0"/>
    <rect x="40" y="74" width="44" height="44" fill="#fff"/><rect x="84" y="74" width="44" height="44" fill="#8fb8f0"/><rect x="128" y="74" width="44" height="44" fill="#8fb8f0"/>
    <rect x="40" y="118" width="44" height="44" fill="#fff"/><rect x="84" y="118" width="44" height="44" fill="#fff"/><rect x="128" y="118" width="44" height="44" fill="#8fb8f0"/>
    <rect x="186" y="30" width="36" height="44" fill="#fff"/><rect x="186" y="74" width="36" height="44" fill="#fff"/><rect x="186" y="118" width="36" height="44" fill="#fff"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="62" y="57">U₁₁</text><text x="106" y="57">U₁₂</text><text x="150" y="57">U₁₃</text>
    <text x="62" y="101">0</text><text x="106" y="101">U₂₂</text><text x="150" y="101">U₂₃</text>
    <text x="62" y="145">0</text><text x="106" y="145">0</text><text x="150" y="145">U₃₃</text>
    <text x="204" y="57">x₁</text><text x="204" y="101">x₂</text><text x="204" y="145">x₃</text>
    <text x="238" y="101">=</text>
    <text x="264" y="57">y₁</text><text x="264" y="101">y₂</text><text x="264" y="145">y₃</text>
  </g>
  <g font-size="11" fill="#1d6fd1">
    <text x="292" y="57">3rd</text><text x="292" y="101">2nd</text><text x="292" y="145">1st</text>
  </g>
  <line x1="335" y1="155" x2="335" y2="35" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#st-k)"/>
  <text x="106" y="20" font-size="11" fill="#1f2a44" text-anchor="middle">U (upper triangular)</text>
</svg>
```
:::

::: context flops Counting the work
A **floating-point operation**, or flop, is one arithmetic step — an add, a subtract, a multiply or a divide — on numbers stored the way computers store decimals. Counting flops is how engineers compare methods before writing any code: it tells you how the time grows as the problem grows.

The count matters most through its power of $n$. Double the size of a system and a triangular solve ($n^2$) takes four times as long, but a factorisation ($n^3$) takes eight times as long.
:::

::: context pivot-word The point everything turns on
A pivot, in everyday English, is the fixed point something turns around — the pin in a hinge, or the foot a basketball player keeps planted while turning. In elimination, the pivot is the entry every other row in its column is measured against and cleared with. Each step of the method turns on it, and dividing by it is the one delicate moment, which is why choosing it well matters so much.
:::

::: context kalman-reuse Why a filter factors once
When a Kalman filter takes in a measurement, it needs its **gain** — a matrix saying how far to move each state component toward what the sensor reported. Computing the gain means solving a system with the **innovation covariance**, the expected spread of the measurement surprises, as the matrix, and one right-hand side for every state component.

The matrix is the same for all of those right-hand sides. So the filter factors it once and runs the cheap triangular solves for each column. In practice this matrix is symmetric, and filters use a close cousin of LU, the Cholesky factorisation, which you meet in Linear Algebra II.
:::

::: context significant-figures How computers round
A computer stores each number with a fixed count of significant digits, the way a calculator display has room for only so many. Standard double precision keeps about 16 decimal digits. Anything smaller than about $2 \times 10^{-16}$ of a number's own size is lost when the number is stored.

Three-figure arithmetic is the same rule, shrunk so you can watch it happen by hand. The failure you see at three figures happens at sixteen figures too; it needs a smaller pivot to trigger it.
:::

::: context crossing-lines The problem was never hard
Each equation is a line in the plane, and the solution is where they cross. The two lines of the small-pivot example cross cleanly, almost at right angles, near $(1, 1)$. Nothing about the problem is delicate — only the unpivoted *method* was.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="185" x2="330" y2="185" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="195" x2="60" y2="20" stroke="#6c7a93" stroke-width="1"/>
  <g stroke="#6c7a93" stroke-width="1"><line x1="130" y1="181" x2="130" y2="189"/><line x1="200" y1="181" x2="200" y2="189"/><line x1="56" y1="115" x2="64" y2="115"/><line x1="56" y1="45" x2="64" y2="45"/></g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle"><text x="130" y="199">1</text><text x="200" y="199">2</text></g>
  <g font-size="11" fill="#6c7a93" text-anchor="end"><text x="52" y="119">1</text><text x="52" y="49">2</text></g>
  <line x1="60" y1="45" x2="200" y2="185" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="60" y1="115" x2="300" y2="115" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="130" cy="115" r="5" fill="#1f2a44"/>
  <text x="124" y="134" font-size="12" fill="#1f2a44" text-anchor="end">(1.00, 1.00)</text>
  <text x="190" y="150" font-size="12" fill="#b4232c">x₁ + x₂ = 2</text>
  <text x="200" y="106" font-size="12" fill="#1d6fd1">0.0001 x₁ + x₂ = 1</text>
  <text x="336" y="189" font-size="12" fill="#1f2a44">x₁</text>
  <text x="66" y="24" font-size="12" fill="#1f2a44">x₂</text>
</svg>
```
:::

::: context lapack The library under everything
**LAPACK**, the Linear Algebra PACKage, is a collection of carefully tested routines for solving systems, factoring matrices and finding eigenvalues. It was first released in 1992, written in Fortran, and it sits underneath NumPy, SciPy, MATLAB and much of the world's scientific software.

Its routine names are compact codes. In `dgesv`, the `d` means double precision, `ge` means a general matrix, and `sv` means solve. `getrf` means "triangular factorisation of a general matrix" — LU with partial pivoting.
:::

::: context library-factors Why the library's L and U look different
Ask SciPy for the LU factors of this lesson's example matrix and you will not get the $\mathbf{L}$ and $\mathbf{U}$ worked by hand. Partial pivoting sees that $4$, not $2$, is the largest entry in column 1, so it swaps rows first, and every factor after that changes.

Both answers are correct: they factor differently ordered copies of the same matrix. The product of the pivots still gives $\det\mathbf{A} = -24$ once you count the swaps.
:::

::: context ill-conditioned When the lines nearly coincide
Take $x_1 + x_2 = 2$ (blue) together with $x_1 + 1.01\,x_2 = b_2$. The lines are almost the same line. With $b_2 = 2.01$ (black) they cross at $(1, 1)$, the blue dot. Nudge $b_2$ to $2.02$ (red, dashed) — a change of half a percent — and the crossing jumps to $(0, 2)$, the red dot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="175" x2="250" y2="175" stroke="#6c7a93" stroke-width="1"/>
  <line x1="77.5" y1="195" x2="77.5" y2="8" stroke="#6c7a93" stroke-width="1"/>
  <line x1="70" y1="17.5" x2="235" y2="182.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="70" y1="18.32" x2="235" y2="181.68" stroke="#1f2a44" stroke-width="1"/>
  <line x1="70" y1="17.57" x2="235" y2="180.94" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="5 3"/>
  <circle cx="152.5" cy="100" r="5" fill="#1d6fd1"/>
  <circle cx="77.5" cy="25" r="5" fill="#b4232c"/>
  <text x="162" y="96" font-size="12" fill="#1d6fd1">(1, 1)</text>
  <text x="88" y="21" font-size="12" fill="#b4232c">(0, 2)</text>
  <text x="234" y="60" font-size="11" fill="#1f2a44">three lines, almost</text>
  <text x="234" y="75" font-size="11" fill="#1f2a44">on top of each other</text>
  <text x="252" y="179" font-size="12" fill="#1f2a44">x₁</text>
  <text x="72" y="14" font-size="12" fill="#1f2a44" text-anchor="end">x₂</text>
</svg>
```

No row order fixes this. The trouble is in the problem itself, and its size is measured by the condition number.
:::
