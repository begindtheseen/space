---
id: l07-decompositions
title: Decompositions, or taking a matrix apart
minutes: 25
covers:
  - 'Decompositions: LLT and LDLT (Cholesky, the covariance workhorse), PartialPivLU, HouseholderQR, ColPivHouseholderQR, JacobiSVD, BDCSVD, SelfAdjointEigenSolver'
---

Take the number 360. On its own it is one big number. Written as $2 \times 2 \times 2 \times 3 \times 3 \times 5$, it tells you much more: every number that divides it, whether it is a perfect square (no), how to cut it into equal groups. Nothing about 360 changed. You only rewrote it as a product of small, simple pieces, and each question became easy.

Matrices work the same way. A **decomposition** (also called a **factorization**) rewrites a matrix as a product of two or three simpler matrices. "Simple" means one of three shapes. A **triangular** matrix has only zeros on one side of its diagonal, like a staircase. An **orthogonal** matrix is a pure rotation or mirror: it moves vectors around without stretching them. A **diagonal** matrix has numbers only on its diagonal: it stretches each axis and does nothing else. Once a matrix is written in those pieces, solving equations with it, measuring how healthy it is, and finding its natural directions all become short, safe calculations.

A flight computer does this constantly. A Kalman filter factors a small covariance matrix at every measurement. Orbit determination fits a trajectory to hundreds of range measurements by least squares. A star tracker's attitude solution and a spacecraft's principal axes of rotation both come from a decomposition. Eigen has a whole family of decompositions. This lesson covers the eight a GNC engineer reaches for most, and which one to pick when.

A quick reminder of the linear algebra, which the course teaches in full elsewhere. $A\mathbf{x} = \mathbf{b}$ is a set of linear equations: $A$ is a known square table of numbers, $\mathbf{b}$ a known column, and $\mathbf{x}$ the unknown column. $A^T$, read "A transpose", is $A$ flipped across its diagonal. A matrix is **symmetric** when $A^T = A$. A **covariance matrix** $P$ describes the uncertainty of a filter's estimate: its diagonal holds the variances (each spread squared), and the off-diagonal entries say how errors in two quantities move together. Every covariance is symmetric and **[[positive semi-definite|positive-definite]]**, meaning $\mathbf{v}^T P \mathbf{v} \geq 0$ for every vector $\mathbf{v}$: no direction can have negative variance. When the inequality is strict for every nonzero $\mathbf{v}$, it is **positive definite**.

## Why factor at all: triangles are easy

Suppose the matrix is lower triangular, zeros above the diagonal:

$$
\begin{bmatrix} 2 & 0 & 0 \\ 1 & 3 & 0 \\ -1 & 2 & 2 \end{bmatrix}
\begin{bmatrix} y_1 \\ y_2 \\ y_3 \end{bmatrix} =
\begin{bmatrix} 4 \\ 17 \\ 12 \end{bmatrix}.
$$

The first row has one unknown: $2 y_1 = 4$, so $y_1 = 2$. The second row has two, but you already know $y_1$: $1 \cdot 2 + 3 y_2 = 17$, so $y_2 = 5$. The third row: $-1 \cdot 2 + 2 \cdot 5 + 2 y_3 = 12$, so $2 y_3 = 4$ and $y_3 = 2$. Each row hands its answer to the next. This is **forward substitution**. An upper triangular system works the same way from the bottom row up, and that is **back substitution**. For an $n \times n$ system, either one costs about $n^2$ multiplications and additions.

Solving a full, general system directly costs about $n^3$ operations. So the plan behind every decomposition is:

1. Factor $A$ once into triangular, orthogonal or diagonal pieces. This is the expensive step, about $n^3$ **[[flops|flop-count]]**.
2. Solve with the pieces, one cheap substitution at a time, about $n^2$ each.
3. If more right-hand sides arrive, reuse the factors and pay only step 2 again.

Every Eigen decomposition has the same shape in code. It is a class template that takes the matrix type, such as `Eigen::LLT<Eigen::Matrix3d>`. You build it from a matrix, ask `info()` whether the factoring worked, and call `solve(b)`. Each also has a shortcut method on the matrix itself: `A.llt()`, `A.ldlt()`, `A.partialPivLu()`, `A.householderQr()`, `A.colPivHouseholderQr()`, `A.jacobiSvd(...)` and `A.bdcSvd(...)`. With a fixed-size matrix like `Matrix3d`, the decomposition object is fixed-size too and allocates nothing.

## Cholesky: LLT and LDLT, the covariance workhorse

For a symmetric positive definite matrix there is a special factorization, named after André-Louis **[[Cholesky|cholesky-history]]**:

$$
A = L L^T,
$$

read "A equals L times L transpose", where $L$ is lower triangular with positive numbers on its diagonal. Eigen's class for it is `LLT`. The name is the formula.

Where do the entries of $L$ come from? Write $A = L L^T$ out entry by entry and peel them off in order. For our covariance

$$
P = \begin{bmatrix} 4 & 2 & -2 \\ 2 & 10 & 5 \\ -2 & 5 & 9 \end{bmatrix}\ \mathrm{m^2},
$$

- the top-left entry says $l_{11}^2 = 4$, so $l_{11} = 2$;
- the rest of the first column divides by it: $l_{21} = 2/2 = 1$ and $l_{31} = -2/2 = -1$;
- the second diagonal entry: $l_{22} = \sqrt{10 - l_{21}^2} = \sqrt{9} = 3$;
- below it: $l_{32} = (5 - l_{31} l_{21}) / l_{22} = (5 + 1)/3 = 2$;
- the last diagonal entry: $l_{33} = \sqrt{9 - l_{31}^2 - l_{32}^2} = \sqrt{4} = 2$.

That is exactly the triangular matrix you solved a moment ago. Solving $P\mathbf{x} = \mathbf{b}$ is now two substitutions: forward with $L$ to get $\mathbf{y}$, then back with $L^T$ to get $\mathbf{x}$.

::: example Factoring a position covariance with LLT and LDLT
```cpp
#include <Eigen/Dense>
#include <iostream>

int main() {
    // A position covariance in m^2: symmetric, positive definite.
    Eigen::Matrix3d P;
    P <<  4,  2, -2,
          2, 10,  5,
         -2,  5,  9;
    const Eigen::Vector3d b(4, 17, 12);

    const Eigen::LLT<Eigen::Matrix3d> llt(P);          // P = L L^T
    if (llt.info() != Eigen::Success) {
        std::cout << "not positive definite\n";
        return 1;
    }
    const Eigen::Matrix3d L = llt.matrixL();
    std::cout << "L =\n" << L << "\n";
    std::cout << "L L^T - P, largest entry: "
              << (L * L.transpose() - P).cwiseAbs().maxCoeff() << "\n";
    std::cout << "x from LLT  = " << llt.solve(b).transpose() << "\n";

    const Eigen::LDLT<Eigen::Matrix3d> ldlt(P);        // P = P^T L D L^T P
    std::cout << "D from LDLT = " << ldlt.vectorD().transpose() << "\n";
    std::cout << "x from LDLT = " << ldlt.solve(b).transpose() << "\n";
}
```

Built with `g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3`:

```text
L =
 2  0  0
 1  3  0
-1  2  2
L L^T - P, largest entry: 0
x from LLT  = 1 1 1
D from LDLT =      10     6.5 2.21538
x from LDLT = 1 1 1
```

The $L$ Eigen found is the one you built by hand. Now check the solve by hand. Forward substitution gave $\mathbf{y} = (2, 5, 2)$ above. Back substitution with $L^T$ starts at the bottom row: $2x_3 = 2$, so $x_3 = 1$. Next row up: $3x_2 + 2 \cdot 1 = 5$, so $x_2 = 1$. Top row: $2x_1 + 1 - 1 = 2$, so $x_1 = 1$. Both decompositions agree: $\mathbf{x} = (1, 1, 1)$.

**Sanity check** on the LDLT line. Its $D$ looks unrelated to $L$, because LDLT reorders the rows first (more on that below). But the determinant of $P$ is the product of the pivots either way. From LLT it is $(2 \cdot 3 \cdot 2)^2 = 144$. From LDLT it is $10 \times 6.5 \times 2.21538 \approx 144.0$. They match.
:::

### LDLT: Cholesky without the square roots

`LDLT` factors the same kind of matrix as

$$
A = P^T L D L^T P,
$$

where $L$ is lower triangular with ones on its diagonal, $D$ is diagonal, and this $P$ is a **permutation**, a reordering of rows and columns (not the covariance; the letter is Eigen's). Think of it as LLT with the square roots pulled out into $D$: no square root is ever taken. The permutation brings the largest remaining diagonal entry to the front at each step, which is the **[[pivoting|pivoting]]** idea you will meet again in LU.

Why does that matter? In LLT, each diagonal entry is a square root of "what is left". For a positive definite matrix, what is left is always positive. For a matrix that is only semi-definite, it can be exactly zero, or round-off can nudge it a hair below zero, and LLT has to stop. Covariances land in that zone more than you would like: two states that are perfectly correlated, or a filter that has converged hard in one direction. LDLT writes the zero into $D$ and carries on.

::: key
**Which decomposition for a covariance matrix and why?** LDLT (or LLT). Covariances are symmetric positive semi-definite, so Cholesky-family factorizations are about twice as fast as LU, numerically stable for this class, and LDLT tolerates semi-definiteness without a square root of a negative.
:::

The "twice as fast" is a count, not a benchmark. Cholesky needs about $n^3/3$ flops. LU needs about $2n^3/3$, because it cannot use the symmetry and must build two different triangles.

::: example Definite, semi-definite, indefinite
```cpp
#include <Eigen/Dense>
#include <iostream>

void test(const char* name, const Eigen::Matrix2d& A) {
    const Eigen::LLT<Eigen::Matrix2d> llt(A);
    const Eigen::LDLT<Eigen::Matrix2d> ldlt(A);
    std::cout << name << ": LLT "
              << (llt.info() == Eigen::Success ? "ok" : "FAILED")
              << ", LDLT " << (ldlt.info() == Eigen::Success ? "ok" : "FAILED")
              << ", D = " << ldlt.vectorD().transpose()
              << ", isPositive = " << ldlt.isPositive() << "\n";
}

int main() {
    Eigen::Matrix2d definite, semi, indefinite;
    definite   << 2, 1,
                  1, 2;     // eigenvalues 3 and 1
    semi       << 1, 1,
                  1, 1;     // eigenvalues 2 and 0: perfectly correlated
    indefinite << 1, 2,
                  2, 1;     // eigenvalues 3 and -1: not a covariance
    test("definite  ", definite);
    test("semi      ", semi);
    test("indefinite", indefinite);
}
```

Output:

```text
definite  : LLT ok, LDLT ok, D =   2 1.5, isPositive = 1
semi      : LLT FAILED, LDLT ok, D = 1 0, isPositive = 1
indefinite: LLT FAILED, LDLT ok, D =  1 -3, isPositive = 0
```

Read the middle line by hand. For the semi-definite matrix, LLT gets $l_{11} = 1$, $l_{21} = 1$, and then needs $l_{22} = \sqrt{1 - 1^2} = \sqrt{0}$. Eigen's LLT refuses a zero pivot, so it reports failure. LDLT puts the zero into $D$ and succeeds.

The last line is the surprise. LDLT "succeeded" on a matrix that is no covariance at all, and only the $-3$ in $D$ and `isPositive() == 0` give it away. **Sanity check:** the product of $D$ is $1 \times (-3) = -3$, and the determinant is $1 \cdot 1 - 2 \cdot 2 = -3$. They agree.
:::

::: warning Check info(), and for LDLT check the signs too
Constructing an `LLT` never throws. If the matrix is not positive definite, the factors are garbage and only `info()` tells you. Always test `info() == Eigen::Success` before using the result; in a filter, a failure is a health-monitoring event, not something to ignore. For `LDLT`, `info()` only says the arithmetic finished. Use `isPositive()`, or look at `vectorD()`, to learn whether the matrix really was a covariance.
:::

::: warning LLT reads only half the matrix
`LLT` and `LDLT` use only the lower triangle. They never check that the upper triangle matches. A covariance that has drifted slightly out of symmetry is silently treated as if it were symmetric. That is one reason filters re-symmetrize their covariance, as lesson 08 shows.
:::

::: note Why it has to be true: the square root of a negative
Take a general symmetric $2 \times 2$ matrix with entries $a$, $b$, $b$, $c$. Writing it as $L L^T$ gives $l_{11}^2 = a$, then $l_{21} l_{11} = b$, then $l_{21}^2 + l_{22}^2 = c$. So $l_{11} = \sqrt{a}$, $l_{21} = b/\sqrt{a}$ and

$$
l_{22} = \sqrt{c - \frac{b^2}{a}} = \sqrt{\frac{ac - b^2}{a}}.
$$

The number under the square root is the determinant $ac - b^2$ divided by $a$. For a positive definite matrix, both are positive, so the square root is real and nonzero. If the matrix is only semi-definite, $ac - b^2 = 0$ and $l_{22} = 0$. If it is indefinite, the determinant is negative and the square root does not exist. The same argument, applied one step at a time, works for any size: the Cholesky factorization exists exactly when every leading block has a positive determinant, which is one of the equivalent definitions of positive definite.
:::

## LU with partial pivoting: the general square solver

Most matrices are not symmetric. A linearized dynamics matrix, or the equations for an aerodynamic model, can be any invertible square matrix. For those, Eigen's default is `PartialPivLU`, which factors

$$
PA = LU,
$$

with $P$ a row reordering, $L$ lower triangular with ones on its diagonal, and $U$ upper triangular. This is the elimination you learned in algebra, written down as matrices.

The **partial pivoting** is the row reordering. Before eliminating each column, the algorithm swaps up the row with the largest entry in that column. Dividing by a tiny pivot would multiply every rounding error by a huge number. The context note on pivoting shows a $2 \times 2$ case where skipping this step turns the right answer into a wrong one.

`PartialPivLU` requires a square, invertible matrix. It does not check that for you, and it cannot tell you the rank. Its slower sibling `FullPivLU` swaps columns too and can report the rank, but in practice the QR and SVD families below are the usual tools when rank is in doubt.

## QR: HouseholderQR and ColPivHouseholderQR

The QR decomposition writes

$$
A = QR,
$$

where $Q$ is orthogonal ($Q^T Q = I$, so it only rotates and reflects) and $R$ is upper triangular. Its great strength is that $A$ does not have to be square. It can be tall: many more rows (measurements) than columns (unknowns). Such a system usually has no exact solution, and the goal becomes **least squares**: find the $\mathbf{x}$ that makes the leftover error $\lVert A\mathbf{x} - \mathbf{b} \rVert$, read "the length of A x minus b", as small as possible.

Because $Q$ does not stretch anything, multiplying by $Q^T$ keeps lengths the same and does not grow errors. What is left is a triangular system in $R$. Eigen builds $Q$ from a sequence of mirror reflections called **[[Householder reflections|householder]]**, hence the class name `HouseholderQR`.

`ColPivHouseholderQR` adds column pivoting: at each step it picks the column that is "most independent" of those already used. That costs a little more, and in return it can tell you the **rank**, the number of truly independent columns, through `rank()`.

::: example Fitting gyro bias against temperature
A gyro's bias drifts with temperature. Five bench measurements, bias in degrees per hour against temperature in degrees Celsius, fit to the model $\text{bias} = c_0 + c_1 T$:

```cpp
#include <Eigen/Dense>
#include <iostream>

int main() {
    // Gyro bias (deg/h) measured at five temperatures (deg C).
    Eigen::VectorXd T(5), bias(5);
    T    << 10, 15, 20, 25, 30;
    bias << 0.52, 0.61, 0.69, 0.81, 0.88;

    // Model: bias = c0 + c1 * T.  One row per measurement.
    Eigen::MatrixXd A(5, 2);
    A.col(0).setOnes();
    A.col(1) = T;

    const Eigen::Vector2d c = A.householderQr().solve(bias);
    std::cout << "HouseholderQR:       c0 = " << c(0) << ", c1 = " << c(1) << "\n";

    // A careless model: also a column for the temperature in Fahrenheit.
    Eigen::MatrixXd B(5, 3);
    B << A, (1.8 * T.array() + 32.0).matrix();

    const Eigen::ColPivHouseholderQR<Eigen::MatrixXd> cpqr(B);
    std::cout << "ColPivHouseholderQR: rank = " << cpqr.rank() << " of " << B.cols() << "\n";

    const Eigen::JacobiSVD<Eigen::MatrixXd> svd(B, Eigen::ComputeThinU | Eigen::ComputeThinV);
    const Eigen::VectorXd s = svd.singularValues();
    std::cout << "JacobiSVD: singular values = " << s.transpose() << "\n";
    std::cout << "JacobiSVD: rank = " << svd.rank() << "\n";
    const Eigen::VectorXd cs = svd.solve(bias);
    std::cout << "JacobiSVD: minimum-norm c = " << cs.transpose() << "\n";
    std::cout << "fit residual, 2 columns: " << (A * c - bias).norm()
              << ", 3 columns: " << (B * cs - bias).norm() << "\n";
}
```

Output:

```text
HouseholderQR:       c0 = 0.334, c1 = 0.0184
ColPivHouseholderQR: rank = 2 of 3
JacobiSVD: singular values =     161.666     7.01268 2.14619e-16
JacobiSVD: rank = 2
JacobiSVD: minimum-norm c = 0.000346534 -0.000368007    0.0104267
fit residual, 2 columns: 0.0209762, 3 columns: 0.0209762
```

The first line is the fit: $\text{bias} \approx 0.334 + 0.0184\,T$. **Sanity check:** at the middle temperature, $0.334 + 0.0184 \times 20 = 0.702$ deg/h, right beside the measured 0.69.

The second half shows why rank matters. A Fahrenheit column is $1.8\,T + 32$: a mix of the other two columns, so it adds no new information. Three columns, but only two independent ones. `ColPivHouseholderQR` reports rank 2. The SVD, from the next section, shows it too: its third singular value is about $2 \times 10^{-16}$, which is zero at double precision. From the rank-deficient problem, the SVD returns the smallest coefficients that fit. They look different but are the same line: $0.000347 + 0.0104267 \times 32 \approx 0.334$ for the constant, and $-0.000368 + 0.0104267 \times 1.8 \approx 0.0184$ for the slope. The two residuals are identical, as they must be.
:::

## SVD: JacobiSVD and BDCSVD

The **singular value decomposition** is the most revealing factorization of all:

$$
A = U \Sigma V^T.
$$

$U$ and $V$ are orthogonal, and $\Sigma$ (capital sigma) is diagonal, holding the **singular values** $\sigma_1 \geq \sigma_2 \geq \dots \geq 0$. In words: every matrix is a rotation, then a stretch along the axes, then another rotation. The singular values are the stretch factors.

That makes the SVD the matrix's health report. The rank is the number of singular values that are not negligible. The condition number from lesson 06 is the ratio of the largest to the smallest, $\kappa = \sigma_{\max} / \sigma_{\min}$, read "kappa". For the two-column gyro fit, the singular values are about 47.5 and 0.745, so $\kappa \approx 64$: comfortable. For the three-column version, $\kappa$ is about $10^{18}$: hopeless, and the SVD tells you so instead of returning nonsense. It is also the classic way to solve **[[Wahba's problem|wahba]]**, the star-tracker attitude fit.

Eigen has two SVD classes with the same interface.

- **`JacobiSVD`** uses a sequence of tiny $2 \times 2$ rotations. It is very accurate and the right choice for small matrices, including fixed-size ones. It gets slow as matrices grow.
- **`BDCSVD`** ("bidiagonal divide and conquer") splits a large problem into halves and recurses. It is much faster for big matrices. For small blocks (below 16 columns by default) it hands the work to `JacobiSVD` anyway.

Pass `Eigen::ComputeThinU | Eigen::ComputeThinV` if you want to call `solve()`. Without them only the singular values are computed, which is cheaper when that is all you need.

## SelfAdjointEigenSolver: the natural axes of a symmetric matrix

For a symmetric matrix, the SVD simplifies into the **eigendecomposition**:

$$
A = V \Lambda V^T,
$$

with $V$ orthogonal (its columns are the **eigenvectors**) and $\Lambda$ (capital lambda) diagonal (the **eigenvalues**). An eigenvector is a direction the matrix only stretches, never turns: $A\mathbf{v} = \lambda \mathbf{v}$. "Self-adjoint" is the general name for symmetric, and `SelfAdjointEigenSolver` is Eigen's class for it. It is faster and more accurate than the general `EigenSolver`, and its eigenvalues are always real.

For a covariance, the eigenvectors point along the axes of the uncertainty **[[ellipsoid|error-ellipsoid]]**, and the square roots of the eigenvalues are the one-sigma lengths of those axes. For a spacecraft's **[[inertia tensor|principal-axes]]**, the eigenvectors are the principal axes and the eigenvalues are the principal moments of inertia.

::: example The shape of a position uncertainty
```cpp
#include <Eigen/Dense>
#include <cmath>
#include <iostream>

int main() {
    Eigen::Matrix3d P;                       // the position covariance, m^2
    P <<  4,  2, -2,
          2, 10,  5,
         -2,  5,  9;

    const Eigen::SelfAdjointEigenSolver<Eigen::Matrix3d> es(P);
    const Eigen::Vector3d lambda = es.eigenvalues();      // ascending order
    const Eigen::Matrix3d V = es.eigenvectors();          // one per column

    std::cout << "eigenvalues (m^2):      " << lambda.transpose() << "\n";
    std::cout << "1-sigma semi-axes (m):  " << lambda.cwiseSqrt().transpose() << "\n";
    std::cout << "longest axis direction: " << V.col(2).transpose() << "\n";
    std::cout << "sum of eigenvalues = " << lambda.sum()
              << ", trace = " << P.trace() << "\n";
    std::cout << "product            = " << lambda.prod()
              << ", det   = " << P.determinant() << "\n";
    std::cout << "P v - lambda v, largest entry: "
              << (P * V.col(2) - lambda(2) * V.col(2)).cwiseAbs().maxCoeff() << "\n";
}
```

Output:

```text
eigenvalues (m^2):      1.40183  7.0712  14.527
1-sigma semi-axes (m):  1.18399 2.65917 3.81143
longest axis direction: -0.0144742  -0.744098  -0.667913
sum of eigenvalues = 23, trace = 23
product            = 144, det   = 144
P v - lambda v, largest entry: 1.77636e-15
```

The uncertainty is a squashed egg. Its one-sigma semi-axes, the distances from the center to the surface along each axis, are about 3.8 m, 2.7 m and 1.2 m. Its long axis points mostly between $-y$ and $-z$, which fits the large 10 and 9 variances and the positive 5 correlation between $y$ and $z$.

**Sanity checks.** The eigenvalues add to the trace, $4 + 10 + 9 = 23$, and multiply to the determinant, 144, the same determinant the Cholesky example found. And $P\mathbf{v} - \lambda\mathbf{v}$ is about $10^{-15}$, zero at double precision, so the long axis really is an eigenvector.
:::

::: warning Eigenvectors have no preferred sign
If $\mathbf{v}$ is an eigenvector, so is $-\mathbf{v}$. Eigen may return either, and a different compiler, library version or input can flip it. Here the long axis came out as $(-0.014, -0.744, -0.668)$; another tool may print $(0.014, 0.744, 0.668)$, and both are right. Never compare eigenvectors entry by entry in a test. Compare $|\mathbf{v}_1 \cdot \mathbf{v}_2|$ with 1 instead. Also remember the eigenvalues come out in increasing order, so the largest is the last one.
:::

## Choosing a decomposition

Here is the whole family in one place. The "speed" column is for a square $n \times n$ matrix, measured against Cholesky.

| Eigen class | Factors into | Needs | Relative cost | Typical GNC use |
|---|---|---|---|---|
| `LLT` | $L L^T$ | symmetric positive definite | fastest, about $n^3/3$ | covariance solves; testing that a covariance is still healthy |
| `LDLT` | $P^T L D L^T P$ | symmetric, positive or negative semi-definite | about the same as LLT | Kalman gain; covariances that may be nearly singular |
| `PartialPivLU` | $P^{-1} L U$ | square and invertible | about twice LLT | general square systems, such as linearized dynamics |
| `HouseholderQR` | $QR$ | any shape, full column rank | about four times LLT when square | least-squares fits with a well-posed model |
| `ColPivHouseholderQR` | $Q R P^T$ | any shape | a little more than HouseholderQR | least squares when rank is in doubt; `rank()` |
| `JacobiSVD` | $U \Sigma V^T$ | any shape | slowest; fine when small | small matrices, condition numbers, attitude from vector pairs |
| `BDCSVD` | $U \Sigma V^T$ | any shape | much faster than Jacobi when large | big least-squares or data problems |
| `SelfAdjointEigenSolver` | $V \Lambda V^T$ | symmetric | many times LLT; iterative | error ellipsoids, principal axes of inertia |

A short rule of thumb: if the matrix is a covariance or any other symmetric positive (semi-)definite matrix, use `LDLT` or `LLT`. If it is square and general, `PartialPivLU`. If it is tall, a QR. If you need to know how close to singular it is, an SVD. If you need its natural axes, `SelfAdjointEigenSolver`.

## Check yourself

::: check
Factor $A = \begin{bmatrix} 9 & 6 \\ 6 & 5 \end{bmatrix}$ as $L L^T$ by hand.
:::

::: answer
Peel off the entries in order. $l_{11}^2 = 9$, so $l_{11} = 3$. Then $l_{21} \cdot 3 = 6$, so $l_{21} = 2$. Then $l_{21}^2 + l_{22}^2 = 5$, so $l_{22} = \sqrt{5 - 4} = 1$. So

$$
L = \begin{bmatrix} 3 & 0 \\ 2 & 1 \end{bmatrix}.
$$

Check: $L L^T$ has top-left $3 \cdot 3 = 9$, off-diagonal $3 \cdot 2 = 6$ and bottom-right $2 \cdot 2 + 1 \cdot 1 = 5$. That is $A$.
:::

::: check
A filter's $6 \times 6$ covariance has two states that have become almost perfectly correlated. Why might `P.llt()` report failure while `P.ldlt()` succeeds, and what extra check should the code make after the LDLT?
:::

::: answer
Perfect correlation makes the covariance semi-definite: one direction has (nearly) zero variance. In LLT, the diagonal entry for that direction is a square root of a number that is zero, or a hair below zero after round-off, and Eigen's LLT stops when that number is not positive. LDLT takes no square roots: it writes the zero into $D$ and finishes. But `info()` succeeding says only that the arithmetic finished. The code should also check `isPositive()` (or inspect `vectorD()`) to be sure no entry of $D$ went negative, which would mean the matrix is no longer a valid covariance.
:::

::: check
You fit a model with four coefficients to 200 measurements, and you are not sure two of the model's terms are independent. Which Eigen decomposition would you pick first, and what would you call on it?
:::

::: answer
The matrix is tall (200 by 4), so it is a least-squares problem, which rules out LLT, LDLT and PartialPivLU on the matrix itself. Because the rank is in doubt, pick `ColPivHouseholderQR` and call `rank()`: a result of 3 means one term is a combination of the others. A `JacobiSVD` would also work and would show the tiny singular value directly, at a higher cost; with only four columns that cost is small, so either is reasonable.
:::

::: check
A symmetric matrix has eigenvalues $0.5$, $2$ and $8$. What are its determinant, its trace, and its condition number?
:::

::: answer
The determinant is the product of the eigenvalues: $0.5 \times 2 \times 8 = 8$. The trace is their sum: $0.5 + 2 + 8 = 10.5$. For a symmetric positive definite matrix the singular values equal the eigenvalues, so the condition number is the largest over the smallest: $8 / 0.5 = 16$.
:::

::: check
A teammate's unit test compares the eigenvectors from `SelfAdjointEigenSolver` with numbers copied from MATLAB, entry by entry, and it fails on a new compiler. The eigenvalues still match. What is most likely wrong with the test?
:::

::: answer
Eigenvectors are only defined up to sign: if $\mathbf{v}$ is one, so is $-\mathbf{v}$. A different compiler or library can return the opposite sign, which is equally correct. The test should compare $|\mathbf{v}_{\text{Eigen}} \cdot \mathbf{v}_{\text{MATLAB}}|$ with 1 (for unit vectors), or check $A\mathbf{v} \approx \lambda\mathbf{v}$ directly. It should also make sure both tools list the eigenvalues in the same order; Eigen's are increasing.
:::

## Summary

| Idea | Meaning | Formula or fact |
|---|---|---|
| Decomposition | a matrix rewritten as a product of simple pieces | factor once (about $n^3$), solve many times (about $n^2$ each) |
| `LLT` | Cholesky | $A = L L^T$, needs symmetric positive definite; check `info()` |
| `LDLT` | Cholesky without square roots, with pivoting | $A = P^T L D L^T P$; tolerates semi-definite; check `isPositive()` |
| `PartialPivLU` | elimination with row swaps | $PA = LU$, square and invertible, about twice the cost of Cholesky |
| `HouseholderQR` | orthogonal times triangular | $A = QR$, least squares on tall matrices |
| `ColPivHouseholderQR` | QR with column pivoting | reveals `rank()` |
| `JacobiSVD`, `BDCSVD` | rotation, stretch, rotation | $A = U \Sigma V^T$; $\kappa = \sigma_{\max}/\sigma_{\min}$; Jacobi for small, BDC for large |
| `SelfAdjointEigenSolver` | natural axes of a symmetric matrix | $A = V \Lambda V^T$, eigenvalues ascending, eigenvector sign arbitrary |
| Covariance rule | which to use for $P$ | LDLT or LLT: about twice as fast as LU and stable for this class |

The next lesson, *Solve, do not invert*, puts `ldlt().solve()` to work where it matters most: computing a Kalman gain without ever forming a matrix inverse, and keeping the covariance healthy with the Joseph form.

::: context positive-definite A bowl, not a saddle
Picture the number $\mathbf{v}^T P \mathbf{v}$ as a height above the floor, for every direction $\mathbf{v}$. For a positive definite matrix the surface is a bowl: it rises in every direction from the bottom. A semi-definite matrix is a trough, flat along one line. An indefinite matrix is a saddle, going up one way and down another.

For a covariance, the height is a variance, and a variance is a spread squared. It cannot be negative. So a real covariance is always a bowl or a trough, never a saddle. When a filter's covariance turns into a saddle, the filter believes something impossible, and its next steps can go badly wrong.
:::

::: context flop-count Counting flops
A **flop** is one floating-point operation: one addition, subtraction, multiplication or division. Counting flops is the rough way numerical analysts compare algorithms before timing them.

For an $n \times n$ matrix, Cholesky costs about $n^3/3$ flops and LU about $2n^3/3$. For the $6 \times 6$ covariance of a small filter that is roughly 72 against 144 flops: both finish in well under a microsecond. For a $1000 \times 1000$ problem, Cholesky is about 333 million flops, and the factor-of-two saving is real time. At small sizes, memory access and branching matter as much as the count, so treat flop counts as a guide, not a stopwatch.
:::

::: context cholesky-history A mapmaker's method
André-Louis Cholesky was a French army officer and surveyor who worked on geodesy, the precise measurement of the Earth for maps. Adjusting a survey network means solving large symmetric systems by hand, and he devised his method to make those calculations faster and more reliable. He was killed in the First World War in 1918, and the method was published after his death by a fellow officer, in 1924.

A century later, the same idea runs inside nearly every navigation filter, where the job is still, at heart, adjusting uncertain measurements so they agree.
:::

::: context pivoting Why the biggest pivot goes first
Solve $10^{-20} x_1 + x_2 = 1$ and $x_1 + x_2 = 2$. The true answer is very close to $x_1 = 1$, $x_2 = 1$.

Without pivoting, elimination divides by $10^{-20}$ and subtracts $10^{20}$ times the first row from the second. The second row becomes $(1 - 10^{20}) x_2 = 2 - 10^{20}$. In double precision the 1 and the 2 are rounded away, both sides are $-10^{20}$, and $x_2 = 1$. Back in the first row, $x_1 = (1 - x_2)/10^{-20} = 0$. Completely wrong.

Swap the rows first, so the pivot is 1 instead of $10^{-20}$. The multiplier becomes $10^{-20}$, nothing important is rounded away, and elimination returns $x_1 = 1$, $x_2 = 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="20" font-size="13" fill="#b4232c" text-anchor="middle" font-weight="700">no pivoting</text>
  <text x="270" y="20" font-size="13" fill="#1d6fd1" text-anchor="middle" font-weight="700">rows swapped</text>
  <rect x="20" y="32" width="140" height="56" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="200" y="32" width="140" height="56" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="30" y="54" font-size="12" fill="#1f2a44">pivot 1e-20</text>
  <text x="30" y="76" font-size="12" fill="#1f2a44">multiplier 1e20</text>
  <text x="210" y="54" font-size="12" fill="#1f2a44">pivot 1</text>
  <text x="210" y="76" font-size="12" fill="#1f2a44">multiplier 1e-20</text>
  <text x="90" y="116" font-size="13" fill="#b4232c" text-anchor="middle">x1 = 0, x2 = 1</text>
  <text x="270" y="116" font-size="13" fill="#1d6fd1" text-anchor="middle">x1 = 1, x2 = 1</text>
  <text x="90" y="138" font-size="11" fill="#6c7a93" text-anchor="middle">wrong</text>
  <text x="270" y="138" font-size="11" fill="#6c7a93" text-anchor="middle">right</text>
</svg>
```
:::

::: context householder A mirror that zeroes a column
A Householder reflection is a mirror placed exactly halfway between a vector $\mathbf{a}$ and a coordinate axis. Reflecting $\mathbf{a}$ in that mirror lands it on the axis, with the same length, so every entry but the first becomes zero. Apply one mirror per column and the matrix turns upper triangular: that is $R$. The product of all the mirrors is $Q$.

Mirrors never change lengths, which is why the method is so stable. Alston Householder published it in 1958, and it has been the standard way to compute a QR ever since.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="170" x2="330" y2="170" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="170" x2="60" y2="20" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="170" x2="164" y2="30" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="60" y1="170" x2="234" y2="170" stroke="#b4232c" stroke-width="3"/>
  <line x1="60" y1="170" x2="310" y2="44" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="6,4"/>
  <line x1="164" y1="30" x2="234" y2="170" stroke="#f2b880" stroke-width="1.5" stroke-dasharray="3,3"/>
  <text x="120" y="60" font-size="13" fill="#1d6fd1">a</text>
  <text x="200" y="190" font-size="13" fill="#b4232c">reflected a</text>
  <text x="250" y="40" font-size="12" fill="#1f2a44">mirror</text>
  <text x="66" y="30" font-size="11" fill="#6c7a93">y</text>
  <text x="320" y="186" font-size="11" fill="#6c7a93">x</text>
</svg>
```

Both arrows have length 174 in the picture, and the mirror bisects the angle between them.
:::

::: context wahba Attitude from star directions
A star tracker measures the directions of several stars in the spacecraft's own frame. A star catalog gives the same directions in an inertial frame. The attitude is the rotation that lines the two sets up best. Grace Wahba posed this as a least-squares problem in 1965, and it has carried her name since.

One classic solution builds a $3 \times 3$ matrix from the paired directions and takes its SVD; the best rotation comes straight out of $U$ and $V$. A $3 \times 3$ fixed-size `JacobiSVD` is fast and accurate for exactly this. The attitude-determination module works through it in full.
:::

::: context error-ellipsoid Drawing the uncertainty
In two dimensions the one-sigma uncertainty of a covariance is an ellipse. The eigenvectors point along its axes, and the semi-axis lengths are the square roots of the eigenvalues. For $\begin{bmatrix} 5 & 3 \\ 3 & 5 \end{bmatrix}\ \mathrm{m^2}$ the eigenvalues are 8 and 2, along the diagonals, so the ellipse's semi-axes are about 2.8 m and 1.4 m, tilted 45 degrees.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="10" x2="180" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="180" cy="100" rx="85" ry="42" transform="rotate(-45 180 100)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="100" x2="240" y2="40" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="180" y1="100" x2="150" y2="70" stroke="#f2b880" stroke-width="2.5"/>
  <text x="246" y="38" font-size="12" fill="#b4232c">sqrt(8) = 2.8 m</text>
  <text x="70" y="62" font-size="12" fill="#1f2a44">sqrt(2) = 1.4 m</text>
  <text x="310" y="116" font-size="11" fill="#6c7a93">x</text>
  <text x="186" y="20" font-size="11" fill="#6c7a93">y</text>
</svg>
```

In three dimensions the ellipse becomes an ellipsoid with three axes, like the squashed egg in the example.
:::

::: context principal-axes Principal axes and a famous wobble
A spacecraft's inertia tensor is a symmetric $3 \times 3$ matrix, so `SelfAdjointEigenSolver` finds its principal axes and principal moments. A body spinning about a principal axis spins cleanly; about any other axis it wobbles.

Which axis matters too. A rigid body can spin stably about its largest or smallest moment, but a body that loses energy, through flexing antennas or sloshing fuel, drifts toward spinning about its largest-moment axis. Explorer 1, the first US satellite, launched in 1958, was spun about its long axis, the one of smallest moment. Its flexible whip antennas dissipated energy, and soon after launch it had tipped over into a flat spin about its axis of largest moment. It has been the textbook warning for spin-stabilized designs ever since.
:::
