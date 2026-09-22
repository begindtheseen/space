---
id: l01-eigenvalues-and-diagonalisation
title: Eigenvalues, eigenvectors and diagonalisation
minutes: 20
covers:
  - eigenvalues, eigenvectors, diagonalisation
---

A matrix acting on a vector usually does two things at once: it turns the vector towards a new direction and it changes its length. For a handful of special directions the turning vanishes and the matrix only stretches or shrinks. Those directions are the eigenvectors, and the stretch factors are the eigenvalues. Once you know them the matrix has no secrets left: it is a set of independent scalings, glued together by a change of basis.

For a GNC engineer this is not an abstraction. The linearised dynamics of any vehicle are $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$, and the eigenvectors of $\mathbf{A}$ are its modes — the shapes of motion that evolve independently of one another, each at the rate its eigenvalue dictates. Whether a closed loop $\mathbf{A} - \mathbf{B}\mathbf{K}$ is stable is a question about the eigenvalues of that matrix and nothing else. The axis of a rotation matrix is its eigenvector. The principal axes of an inertia tensor, the semi-axes of a covariance ellipsoid, the fast and slow parts of a propagator: all of them are eigenvectors and eigenvalues of some matrix you will meet on a real programme.

This lesson defines them, shows how to compute them by hand for $2\times 2$ and $3\times 3$ matrices (larger ones are the computer's job, but you must be able to check the computer), and builds the factorisation $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ that the rest of this module leans on.

## The eigen-equation

Take a square matrix $\mathbf{A}$ of size $n\times n$. Picture it acting on every vector in the plane or in space. Most vectors come out pointing somewhere new. Ask instead for the vectors that come out parallel to where they went in — the same line, possibly flipped, possibly rescaled. That demand is the whole definition:

$$\mathbf{A}\mathbf{v} = \lambda\mathbf{v}, \qquad \mathbf{v} \neq \mathbf{0}.$$

The scalar $\lambda$ is an eigenvalue of $\mathbf{A}$ and $\mathbf{v}$ is an eigenvector belonging to it. Three remarks about the definition matter more than they look.

First, $\mathbf{v} = \mathbf{0}$ is excluded, because $\mathbf{A}\mathbf{0} = \lambda\mathbf{0}$ holds for every $\lambda$ and would make the definition empty. The eigenvalue itself may be zero: $\lambda = 0$ means $\mathbf{A}\mathbf{v} = \mathbf{0}$ for a nonzero $\mathbf{v}$, so the matrix collapses that direction and is singular. Second, eigenvectors are defined only up to scale. If $\mathbf{v}$ works then so does $c\mathbf{v}$ for any nonzero $c$, so "the" eigenvector is really a direction, and software will hand you back some arbitrary normalisation and sign. Third, all the eigenvectors for a given $\lambda$, together with the zero vector, form a subspace called the eigenspace of $\lambda$. It can have dimension greater than one.

::: key Definition of eigenvalue and eigenvector
$\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ for some $\mathbf{v} \neq \mathbf{0}$: the map leaves the direction of $\mathbf{v}$ unchanged and only scales it by $\lambda$. The eigenvectors for one $\lambda$ form the eigenspace $\operatorname{null}(\mathbf{A} - \lambda\mathbf{I})$.
:::

To turn the definition into something you can compute, move everything to one side:

$$(\mathbf{A} - \lambda\mathbf{I})\mathbf{v} = \mathbf{0}.$$

You want a nonzero solution $\mathbf{v}$, so the matrix $\mathbf{A} - \lambda\mathbf{I}$ must have a nontrivial null space, which by Linear Algebra I happens exactly when it is singular:

$$\det(\mathbf{A} - \lambda\mathbf{I}) = 0.$$

The left side is a polynomial in $\lambda$ of degree $n$ called the characteristic polynomial, $p(\lambda)$. By the fundamental theorem of algebra it has exactly $n$ roots counted with multiplicity, though some may be complex even when $\mathbf{A}$ is real. The number of times $\lambda$ appears as a root is its algebraic multiplicity; the dimension of its eigenspace is its geometric multiplicity. The geometric multiplicity is never larger than the algebraic one, and the case where it is strictly smaller is the awkward one you will meet at the end of this lesson.

So the procedure is: solve $\det(\mathbf{A} - \lambda\mathbf{I}) = 0$ for the eigenvalues, then for each one find the null space of $\mathbf{A} - \lambda\mathbf{I}$ to get the eigenvectors.

## Computing them by hand for a 2×2

For $\mathbf{A} = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$ the determinant expands directly:

$$\det\begin{pmatrix} a - \lambda & b \\ c & d - \lambda \end{pmatrix} = (a-\lambda)(d-\lambda) - bc = \lambda^2 - (a + d)\lambda + (ad - bc).$$

Notice what the coefficients are: $a + d$ is the trace and $ad - bc$ is the determinant. So every $2\times 2$ characteristic polynomial is

$$\lambda^2 - \operatorname{tr}(\mathbf{A})\,\lambda + \det(\mathbf{A}) = 0,$$

and you can write it down without doing any algebra. Then, for each root, one row of $\mathbf{A} - \lambda\mathbf{I}$ is enough to find the eigenvector, because the matrix is singular and its second row carries no new information. From the first row $(a - \lambda)v_1 + b v_2 = 0$, a convenient choice when $b \neq 0$ is $\mathbf{v} = (b,\ \lambda - a)^\mathsf{T}$.

::: example Eigenvalues, eigenvectors and a cube of a 2×2 matrix
Take $\mathbf{A} = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$. The trace is $4$ and the determinant is $3$, so the characteristic polynomial is $\lambda^2 - 4\lambda + 3 = (\lambda - 3)(\lambda - 1)$, giving $\lambda_1 = 3$ and $\lambda_2 = 1$.

For $\lambda_1 = 3$: $\mathbf{A} - 3\mathbf{I} = \begin{pmatrix} -1 & 1 \\ 1 & -1 \end{pmatrix}$, whose first row says $-v_1 + v_2 = 0$, so $\mathbf{v}_1 = (1, 1)^\mathsf{T}$. Check: $\mathbf{A}\mathbf{v}_1 = (3, 3)^\mathsf{T} = 3\mathbf{v}_1$.

For $\lambda_2 = 1$: $\mathbf{A} - \mathbf{I} = \begin{pmatrix} 1 & 1 \\ 1 & 1 \end{pmatrix}$, first row $v_1 + v_2 = 0$, so $\mathbf{v}_2 = (1, -1)^\mathsf{T}$. Check: $\mathbf{A}\mathbf{v}_2 = (1, -1)^\mathsf{T} = 1\cdot\mathbf{v}_2$.

Geometrically, $\mathbf{A}$ stretches the diagonal direction $(1,1)$ by a factor of $3$ and leaves the anti-diagonal direction $(1,-1)$ alone. Every other vector is a mixture of the two, and gets a mixture of the two treatments.

Now use this to compute $\mathbf{A}^3$ without multiplying three matrices. With $\mathbf{V} = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$ and $\boldsymbol{\Lambda} = \operatorname{diag}(3, 1)$, the inverse is $\mathbf{V}^{-1} = \tfrac{1}{2}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$, and

$$\mathbf{A}^3 = \mathbf{V}\boldsymbol{\Lambda}^3\mathbf{V}^{-1} = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}\begin{pmatrix} 27 & 0 \\ 0 & 1 \end{pmatrix}\tfrac{1}{2}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix} = \begin{pmatrix} 14 & 13 \\ 13 & 14 \end{pmatrix}.$$

Multiplying $\mathbf{A}\cdot\mathbf{A}\cdot\mathbf{A}$ directly gives the same $\begin{pmatrix} 14 & 13 \\ 13 & 14 \end{pmatrix}$. The eigen-route looks longer for a cube, but for $\mathbf{A}^{1000}$, or for $e^{\mathbf{A}t}$ in the next lesson, it is the only sensible route.
:::

## Trace and determinant as eigenvalue checks

Write the characteristic polynomial in factored form, $p(\lambda) = (\lambda_1 - \lambda)(\lambda_2 - \lambda)\cdots(\lambda_n - \lambda)$. Setting $\lambda = 0$ gives $p(0) = \det(\mathbf{A}) = \lambda_1\lambda_2\cdots\lambda_n$. Comparing the coefficient of $\lambda^{n-1}$ on both sides gives the trace. For every square matrix,

$$\operatorname{tr}(\mathbf{A}) = \sum_i \lambda_i, \qquad \det(\mathbf{A}) = \prod_i \lambda_i.$$

You saw both in the $2\times 2$ case above. These are the fastest sanity checks you have: after any eigenvalue computation, by hand or by machine, add the eigenvalues and compare with the diagonal sum. It catches most sign and arithmetic errors in seconds. The determinant identity also restates a fact from Linear Algebra I in eigen-language: a matrix is singular exactly when it has a zero eigenvalue, and the null space is then the eigenspace of $\lambda = 0$.

## Complex eigenvalues: rotation and oscillation

Real matrices can have complex eigenvalues, and when they do the eigenvalues come in conjugate pairs $\lambda = \sigma \pm i\omega$, because the characteristic polynomial has real coefficients. The cleanest example is a rotation of the plane by an angle $\theta$:

$$\mathbf{R}(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}, \qquad \lambda^2 - 2\cos\theta\,\lambda + 1 = 0, \qquad \lambda = \cos\theta \pm i\sin\theta = e^{\pm i\theta}.$$

A rotation turns every real direction, so no real vector can be an eigenvector, and the algebra agrees: the eigenvalues are off the real axis unless $\theta$ is $0$ or $\pi$. Their modulus is $1$, which is the algebraic shadow of the fact that a rotation preserves length. The general rule of thumb is this: real eigenvalues describe stretching and shrinking along fixed directions; complex pairs describe turning, and in a dynamical system, oscillation. Lesson 3 makes the second half of that sentence precise.

::: example The stable and unstable directions of an inverted pendulum
Linearised about the upright position, a pendulum of length $L$ obeys $\ddot{\theta} = (g/L)\,\theta$. With state $\mathbf{x} = (\theta, \dot{\theta})^\mathsf{T}$ and $L = 1\,\mathrm{m}$, $g/L = 9.80665\,\mathrm{s^{-2}}$ and

$$\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 9.80665 & 0 \end{pmatrix}.$$

The trace is $0$ and the determinant is $-9.80665$, so $\lambda^2 - 9.80665 = 0$ and $\lambda = \pm 3.13\,\mathrm{s^{-1}}$. The eigenvector for $\lambda = +3.13$ comes from the first row of $\mathbf{A} - \lambda\mathbf{I}$, namely $-3.13\,v_1 + v_2 = 0$, so $\mathbf{v}_+ = (1,\ 3.13)^\mathsf{T}$; likewise $\mathbf{v}_- = (1,\ -3.13)^\mathsf{T}$.

Read physically: a state on the $\mathbf{v}_+$ line has $\dot{\theta} = 3.13\,\theta$, the angle and the rate have the same sign, and the pendulum falls away exponentially with time constant $1/3.13 = 0.319\,\mathrm{s}$, doubling every $\ln 2/3.13 = 0.221\,\mathrm{s}$. A state on the $\mathbf{v}_-$ line has $\dot{\theta} = -3.13\,\theta$: it is falling back towards upright at exactly the rate that lets it arrive with zero velocity, and it decays with the same time constant. Any other initial condition is a mixture of the two, and the growing part wins.

Now hang the pendulum downward instead, so $\ddot{\theta} = -(g/L)\,\theta$ and the lower-left entry flips sign to $-9.80665$. The determinant becomes $+9.80665$, the characteristic polynomial is $\lambda^2 + 9.80665 = 0$, and $\lambda = \pm 3.13\,i$. Purely imaginary eigenvalues: no stretching, only turning, which is the phase-plane picture of an undamped oscillation with period $2\pi/3.13 = 2.01\,\mathrm{s}$. Same matrix apart from one sign, completely different eigenvalues, completely different behaviour.
:::

## Three by three, and a fact about rotations

For a $3\times 3$ matrix, expand $\det(\mathbf{A} - \lambda\mathbf{I})$ along whichever row or column has the most zeros, and look for structure before you grind. Triangular matrices have their eigenvalues on the diagonal, because the determinant of a triangular matrix is the product of its diagonal entries and $\det(\mathbf{A} - \lambda\mathbf{I}) = \prod (a_{ii} - \lambda)$. Block-diagonal matrices have the eigenvalues of their blocks. A matrix with an obvious eigenvector lets you factor one root out immediately and finish with a quadratic.

::: example The axis of a rotation is its eigenvector
Every rotation matrix $\mathbf{R} \in SO(3)$ leaves its axis unchanged, so the axis is an eigenvector with eigenvalue $1$ — this is Euler's rotation theorem in eigen-language. Take a rotation of $30^\circ$ about the $z$-axis, with $\cos 30^\circ = 0.866$ and $\sin 30^\circ = 0.5$:

$$\mathbf{R} = \begin{pmatrix} 0.866 & -0.5 & 0 \\ 0.5 & 0.866 & 0 \\ 0 & 0 & 1 \end{pmatrix}.$$

Expanding $\det(\mathbf{R} - \lambda\mathbf{I})$ along the third row, only the $(3,3)$ entry survives:

$$\det(\mathbf{R} - \lambda\mathbf{I}) = (1 - \lambda)\left[(0.866 - \lambda)^2 + 0.25\right] = (1 - \lambda)\left(\lambda^2 - 1.732\lambda + 1\right).$$

The roots are $\lambda = 1$ and $\lambda = 0.866 \pm 0.5\,i = e^{\pm i\,30^\circ}$. The eigenvector for $\lambda = 1$ solves $(\mathbf{R} - \mathbf{I})\mathbf{v} = \mathbf{0}$; the third row of $\mathbf{R} - \mathbf{I}$ is all zeros and the first two force $v_1 = v_2 = 0$, so $\mathbf{v} = (0, 0, 1)^\mathsf{T}$, the $z$-axis, as it must be. The other two eigenvalues are exactly the planar rotation pair from the previous section, living in the plane perpendicular to the axis.

Two checks and one useful by-product. Trace: $0.866 + 0.866 + 1 = 2.732$, and $1 + e^{i30^\circ} + e^{-i30^\circ} = 1 + 2\cos 30^\circ = 2.732$. Determinant: $1\cdot e^{i30^\circ}e^{-i30^\circ} = 1$, as every proper rotation must have. And since $\operatorname{tr}(\mathbf{R}) = 1 + 2\cos\theta$ for any rotation, $\theta = \arccos\left((\operatorname{tr}\mathbf{R} - 1)/2\right)$ recovers the rotation angle from the matrix — here $\arccos(0.866) = 30^\circ$. Attitude-error code does exactly this to extract a single angle from a rotation-matrix error.
:::

## Diagonalisation

Suppose $\mathbf{A}$ has $n$ linearly independent eigenvectors $\mathbf{v}_1, \dots, \mathbf{v}_n$ with eigenvalues $\lambda_1, \dots, \lambda_n$. Put the eigenvectors side by side as the columns of a matrix $\mathbf{V}$ and the eigenvalues on the diagonal of $\boldsymbol{\Lambda}$. Multiplying column by column,

$$\mathbf{A}\mathbf{V} = \begin{pmatrix} \mathbf{A}\mathbf{v}_1 & \cdots & \mathbf{A}\mathbf{v}_n \end{pmatrix} = \begin{pmatrix} \lambda_1\mathbf{v}_1 & \cdots & \lambda_n\mathbf{v}_n \end{pmatrix} = \mathbf{V}\boldsymbol{\Lambda}.$$

Because the columns are independent, $\mathbf{V}$ is invertible, and

$$\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}, \qquad \boldsymbol{\Lambda} = \mathbf{V}^{-1}\mathbf{A}\mathbf{V}.$$

This is diagonalisation, and it deserves to be read as a recipe rather than a formula. To apply $\mathbf{A}$ to a vector $\mathbf{x}$: first compute $\mathbf{z} = \mathbf{V}^{-1}\mathbf{x}$, the coordinates of $\mathbf{x}$ in the eigenbasis; then scale each coordinate by its eigenvalue, $\boldsymbol{\Lambda}\mathbf{z}$; then convert back with $\mathbf{V}$. In the eigenbasis the matrix is nothing but $n$ independent scalings. Anything you can do to a diagonal matrix by acting on its entries, you can now do to $\mathbf{A}$: $\mathbf{A}^k = \mathbf{V}\boldsymbol{\Lambda}^k\mathbf{V}^{-1}$ because the inner $\mathbf{V}^{-1}\mathbf{V}$ factors cancel in the product, $\mathbf{A}^{-1} = \mathbf{V}\boldsymbol{\Lambda}^{-1}\mathbf{V}^{-1}$ if no eigenvalue is zero, and in the next lesson $e^{\mathbf{A}t} = \mathbf{V}e^{\boldsymbol{\Lambda}t}\mathbf{V}^{-1}$.

When are there $n$ independent eigenvectors? Always, if the $n$ eigenvalues are distinct. The argument for two is the whole idea: if $\mathbf{v}_2 = c\,\mathbf{v}_1$ with $\lambda_1 \neq \lambda_2$, then $\lambda_2\mathbf{v}_2 = \mathbf{A}\mathbf{v}_2 = c\,\mathbf{A}\mathbf{v}_1 = c\lambda_1\mathbf{v}_1 = \lambda_1\mathbf{v}_2$, so $(\lambda_2 - \lambda_1)\mathbf{v}_2 = \mathbf{0}$, impossible for a nonzero eigenvector. With repeated eigenvalues it depends. The identity matrix has $\lambda = 1$ twice and every vector is an eigenvector, so it is (already) diagonal. But consider

$$\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}.$$

Its characteristic polynomial is $\lambda^2$, so $\lambda = 0$ with algebraic multiplicity two, yet $\mathbf{A} - 0\mathbf{I} = \mathbf{A}$ has rank one and its null space is the single direction $(1, 0)^\mathsf{T}$. Geometric multiplicity one, algebraic multiplicity two: there is no second eigenvector, no invertible $\mathbf{V}$, and the matrix cannot be diagonalised. Such matrices are called defective. This particular one is not exotic at all — it is the double integrator, position and velocity with no force acting, and every kinematic chain in a navigation model contains one. Lesson 3 shows how to handle it.

::: warning Eigenvectors need not be orthogonal
In the first example the eigenvectors $(1,1)$ and $(1,-1)$ happened to be perpendicular, because that matrix was symmetric. For a general matrix the eigenvectors are merely independent. In the pendulum example $(1, 3.13)$ and $(1, -3.13)$ are far from orthogonal. Do not use $\mathbf{V}^\mathsf{T}$ where you need $\mathbf{V}^{-1}$ unless you have checked that $\mathbf{V}$ is orthogonal — Lesson 4 tells you exactly when that is guaranteed.
:::

## Eigenvalues of related matrices

Once you have the eigenvalues of $\mathbf{A}$ you have them for a whole family of matrices, usually with the same eigenvectors. Each row below is a one-line derivation from $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$.

| Matrix | Eigenvalues | Eigenvectors | Why |
| --- | --- | --- | --- |
| $\mathbf{A}^\mathsf{T}$ | same $\lambda_i$ | different in general | $\det(\mathbf{A}^\mathsf{T} - \lambda\mathbf{I}) = \det(\mathbf{A} - \lambda\mathbf{I})^\mathsf{T}$, and a transpose has the same determinant |
| $c\mathbf{A}$ | $c\lambda_i$ | same | scale both sides of $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ |
| $\mathbf{A} + c\mathbf{I}$ | $\lambda_i + c$ | same | $(\mathbf{A} + c\mathbf{I})\mathbf{v} = \lambda\mathbf{v} + c\mathbf{v}$ |
| $\mathbf{A}^k$ | $\lambda_i^k$ | same | apply $\mathbf{A}$ repeatedly |
| $\mathbf{A}^{-1}$ | $1/\lambda_i$ | same | $\mathbf{v} = \lambda\mathbf{A}^{-1}\mathbf{v}$, needs $\lambda \neq 0$ |
| triangular | diagonal entries | — | determinant is the product of the diagonal |
| block diagonal | union of the blocks' eigenvalues | — | determinant factorises by block |
| orthogonal $\mathbf{Q}$ | all with modulus $1$ | — | $\mathbf{Q}$ preserves length, so it cannot stretch |

Two things are not on this list because they are false: the eigenvalues of $\mathbf{A} + \mathbf{B}$ are not the sums of eigenvalues, and the eigenvalues of $\mathbf{A}\mathbf{B}$ are not the products, unless $\mathbf{A}$ and $\mathbf{B}$ share eigenvectors. The exception is worth remembering because it is exactly the condition that lets $e^{\mathbf{A}+\mathbf{B}} = e^{\mathbf{A}}e^{\mathbf{B}}$ hold in the next lesson.

## Eigenvalues in NumPy

```python
import numpy as np

A = np.array([[2.0, 1.0], [1.0, 2.0]])
w, V = np.linalg.eig(A)      # w: eigenvalues, V: eigenvectors as columns
print(w)                     # [3. 1.]
print(V[:, 0])               # [0.70710678 0.70710678]   unit-length, sign arbitrary
print(np.allclose(A @ V, V * w))   # True: A V = V Lambda, column by column
```

Four habits save hours of debugging. The eigenvectors are the columns of `V`, not the rows. They are normalised to unit length with an arbitrary sign, so $(0.707, 0.707)$ is the same eigenvector as our $(1,1)$. The eigenvalues come back in no particular order, and as complex numbers as soon as any one of them is complex. And for a symmetric matrix you should call `np.linalg.eigh` instead, which is faster, guarantees real output, and returns orthonormal eigenvectors sorted in ascending order — Lesson 4 explains why it can promise all that.

## Check yourself

::: check
Find the eigenvalues and eigenvectors of $\mathbf{A} = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$ and verify them with the trace and determinant.
:::

::: answer
The trace is $7$ and the determinant is $12 - 2 = 10$, so $\lambda^2 - 7\lambda + 10 = (\lambda - 5)(\lambda - 2) = 0$ and $\lambda_1 = 5$, $\lambda_2 = 2$. Sum $7$ and product $10$: they match the trace and determinant.

For $\lambda_1 = 5$ the first row of $\mathbf{A} - 5\mathbf{I}$ is $(-1, 1)$, so $-v_1 + v_2 = 0$ and $\mathbf{v}_1 = (1, 1)^\mathsf{T}$. Check: $\mathbf{A}\mathbf{v}_1 = (5, 5)^\mathsf{T}$. For $\lambda_2 = 2$ the first row of $\mathbf{A} - 2\mathbf{I}$ is $(2, 1)$, so $2v_1 + v_2 = 0$ and $\mathbf{v}_2 = (1, -2)^\mathsf{T}$. Check: $\mathbf{A}\mathbf{v}_2 = (4 - 2,\ 2 - 6)^\mathsf{T} = (2, -4)^\mathsf{T} = 2\mathbf{v}_2$. Note the eigenvectors are not orthogonal: the matrix is not symmetric.
:::

::: check
Why does the definition insist on $\mathbf{v} \neq \mathbf{0}$, and does it also forbid $\lambda = 0$?
:::

::: answer
The zero vector satisfies $\mathbf{A}\mathbf{0} = \lambda\mathbf{0}$ for every scalar $\lambda$, so allowing it would make every number an eigenvalue of every matrix and the concept would say nothing. The eigenvalue, by contrast, is allowed to be zero: $\lambda = 0$ means there is a nonzero $\mathbf{v}$ with $\mathbf{A}\mathbf{v} = \mathbf{0}$, which is precisely the statement that $\mathbf{A}$ is singular. The eigenspace of $\lambda = 0$ is the null space of $\mathbf{A}$.
:::

::: check
A $3\times 3$ matrix has trace $6$ and determinant $6$, and you know that $1$ is one of its eigenvalues. Find the other two.
:::

::: answer
The eigenvalues sum to the trace and multiply to the determinant, so with $\lambda_1 = 1$ the remaining pair satisfies $\lambda_2 + \lambda_3 = 5$ and $\lambda_2\lambda_3 = 6$. They are the roots of $\lambda^2 - 5\lambda + 6 = (\lambda - 2)(\lambda - 3)$, so the other two eigenvalues are $2$ and $3$.
:::

::: check
The matrix $\mathbf{A} = \begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix}$ is singular. Find both eigenvalues and eigenvectors and describe what the matrix does geometrically.
:::

::: answer
Trace $5$, determinant $0$: $\lambda^2 - 5\lambda = 0$, so $\lambda = 0$ and $\lambda = 5$. For $\lambda = 0$ solve $\mathbf{A}\mathbf{v} = \mathbf{0}$: $v_1 + 2v_2 = 0$ gives $\mathbf{v} = (2, -1)^\mathsf{T}$, which is the null space. For $\lambda = 5$ the first row of $\mathbf{A} - 5\mathbf{I}$ is $(-4, 2)$, so $\mathbf{v} = (1, 2)^\mathsf{T}$. Geometrically the matrix flattens the plane onto the line through $(1, 2)$: everything along $(2, -1)$ is crushed to zero, and the component along $(1, 2)$ is stretched by $5$. Both columns of $\mathbf{A}$ are multiples of $(1,2)$, which is the same fact seen from the column-space side.
:::

::: check
Is $\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ diagonalisable? Explain.
:::

::: answer
It is triangular, so the eigenvalues are the diagonal entries: $\lambda = 1$ with algebraic multiplicity two. The eigenvectors solve $(\mathbf{A} - \mathbf{I})\mathbf{v} = \mathbf{0}$ with $\mathbf{A} - \mathbf{I} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$, which forces $v_2 = 0$ and leaves only the direction $(1, 0)^\mathsf{T}$. One eigenvector for a $2\times 2$ matrix is not enough to build an invertible $\mathbf{V}$, so the matrix is defective and cannot be diagonalised. It is the state transition matrix of a double integrator over a unit time step, which is why this case matters in practice.
:::

## Summary

| Item | Statement |
| --- | --- |
| Eigen-equation | $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$, $\mathbf{v} \neq \mathbf{0}$; eigenspace $= \operatorname{null}(\mathbf{A} - \lambda\mathbf{I})$ |
| Characteristic polynomial | $\det(\mathbf{A} - \lambda\mathbf{I}) = 0$, degree $n$, $n$ roots with multiplicity |
| $2\times 2$ shortcut | $\lambda^2 - \operatorname{tr}(\mathbf{A})\lambda + \det(\mathbf{A}) = 0$; eigenvector $(b,\ \lambda - a)^\mathsf{T}$ |
| Checks | $\sum\lambda_i = \operatorname{tr}\mathbf{A}$, $\prod\lambda_i = \det\mathbf{A}$; singular $\Leftrightarrow$ some $\lambda = 0$ |
| Complex pairs | $\sigma \pm i\omega$ for real $\mathbf{A}$; rotation by $\theta$ has $e^{\pm i\theta}$ |
| Rotations | axis is the eigenvector for $\lambda = 1$; $\operatorname{tr}\mathbf{R} = 1 + 2\cos\theta$ |
| Diagonalisation | $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ when $n$ independent eigenvectors exist; $\mathbf{A}^k = \mathbf{V}\boldsymbol{\Lambda}^k\mathbf{V}^{-1}$ |
| Guaranteed | distinct eigenvalues $\Rightarrow$ diagonalisable |
| Defective | repeated $\lambda$ with too few eigenvectors, e.g. the double integrator $\begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$ |

The next lesson uses $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ to compute $e^{\mathbf{A}t}$, the matrix that carries the state of a linear system forward in time, and shows what to do when the matrix is defective.
