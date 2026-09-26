---
id: l01-eigenvalues-and-diagonalisation
title: Eigenvalues, eigenvectors and diagonalisation
minutes: 23
covers:
  - eigenvalues, eigenvectors, diagonalisation
---

Draw a few arrows on a sheet of rubber, all starting from the same dot. Now grab the sheet and stretch it. Most of the arrows do two things at once: they get longer or shorter, and they swing round to point somewhere new. But a few special arrows do not swing at all. They stay on their own line and only get longer, or shorter, or flip to point the other way.

A matrix does the same thing to vectors. Those special directions are its **eigenvectors** — the directions a matrix only stretches, never turns. How much each one is stretched is its **eigenvalue**. Once you know them, the matrix has no secrets left. It is a set of simple stretches, one along each special direction, glued together by a change of viewpoint.

For a GNC engineer this is everyday work, not abstraction. The linearized dynamics of any vehicle are $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$, and the eigenvectors of $\mathbf{A}$ are its **modes** — the shapes of motion that play out independently of one another, each at the rate its eigenvalue sets. Whether a closed control loop $\mathbf{A} - \mathbf{B}\mathbf{K}$ is stable is a question about the eigenvalues of that matrix and nothing else. The axis of a rotation matrix is an eigenvector. The principal axes of a spacecraft's inertia, the shape of an uncertainty cloud, the fast and slow parts of a propagator: all of them are eigenvectors and eigenvalues of some matrix you will meet on a real program.

This lesson defines them, shows you how to find them by hand for $2\times 2$ and $3\times 3$ matrices, and builds the factorization $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ that the rest of this module leans on. Bigger matrices are the computer's job — but you must be able to check the computer.

## Directions that only stretch

Take a square matrix $\mathbf{A}$, with $n$ rows and $n$ columns. Picture it acting on every vector in the plane, or in space. Most vectors come out pointing somewhere new. Now ask only for the vectors that come out on the same line they went in on — maybe longer, maybe shorter, maybe flipped. That demand is the whole definition:

$$\mathbf{A}\mathbf{v} = \lambda\mathbf{v}, \qquad \mathbf{v} \neq \mathbf{0}.$$

Read it aloud as "A times v equals lambda times v". The **[[eigenvalue|eigen-word]]** $\lambda$ (the Greek letter "lambda") is a plain number, the stretch factor. The **eigenvector** $\mathbf{v}$ is a direction that belongs to that $\lambda$. Look at the **[[picture of a stretch|stretch-picture]]** once, and the definition will stay with you.

Three small remarks about the definition matter more than they look.

**The zero vector is banned.** $\mathbf{A}\mathbf{0} = \lambda\mathbf{0}$ is true for every number $\lambda$. If the zero vector counted, every number would be an eigenvalue of every matrix, and the idea would say nothing. The eigenvalue itself *may* be zero. $\lambda = 0$ means $\mathbf{A}\mathbf{v} = \mathbf{0}$ for some nonzero $\mathbf{v}$: the matrix crushes that whole direction flat. Such a matrix is **[[singular|singular-meaning]]** — it has no inverse.

**Only the direction matters.** If $\mathbf{v}$ works, so does $2\mathbf{v}$, or $-5\mathbf{v}$, or any nonzero multiple $c\mathbf{v}$. So "the" eigenvector is really a direction, a whole line of arrows. Software will hand you one of them with some length and some sign, chosen for its own reasons.

**One eigenvalue can own many directions.** All the eigenvectors for one $\lambda$, together with the zero vector, form a flat subspace — a line, a plane, or more. It is called the **eigenspace** of $\lambda$. Moving everything in $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ to one side shows that it is the null space (the set of vectors a matrix sends to zero) of $\mathbf{A} - \lambda\mathbf{I}$.

::: key Definition of eigenvalue and eigenvector
$\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ for some $\mathbf{v} \neq \mathbf{0}$: the map leaves the direction of $\mathbf{v}$ unchanged and only scales it by $\lambda$. The eigenvectors for one $\lambda$ form the eigenspace $\operatorname{null}(\mathbf{A} - \lambda\mathbf{I})$.
:::

### Turning the definition into a calculation

To compute, move everything to one side. Since $\lambda\mathbf{v} = \lambda\mathbf{I}\mathbf{v}$, where $\mathbf{I}$ is the identity matrix,

$$(\mathbf{A} - \lambda\mathbf{I})\mathbf{v} = \mathbf{0}.$$

You want a solution $\mathbf{v}$ that is not zero. From Linear Algebra I, a square matrix sends some nonzero vector to zero exactly when it is singular, and a matrix is singular exactly when its determinant is zero. So the eigenvalues are the numbers that make

$$\det(\mathbf{A} - \lambda\mathbf{I}) = 0.$$

The left side, written out, is a polynomial in $\lambda$ of degree $n$. It is the **[[characteristic polynomial|characteristic-polynomial]]**, written $p(\lambda)$. A polynomial of degree $n$ has exactly $n$ roots when you count repeats, though some may be complex numbers even when every entry of $\mathbf{A}$ is real.

Two ways of counting a repeated eigenvalue will matter at the end of the lesson:

- the **algebraic multiplicity** of $\lambda$ is how many times it appears as a root of $p(\lambda)$;
- the **geometric multiplicity** is the dimension of its eigenspace — how many independent directions it owns.

The geometric count is never bigger than the algebraic one. When it is strictly smaller, the matrix is missing eigenvectors, and that is the awkward case.

So the recipe has two steps. First solve $\det(\mathbf{A} - \lambda\mathbf{I}) = 0$ for the eigenvalues. Then, for each one, find the null space of $\mathbf{A} - \lambda\mathbf{I}$ to get its eigenvectors.

## Computing them by hand for a 2×2

Write a general $2\times 2$ matrix as $\mathbf{A} = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$. Subtract $\lambda$ from the diagonal and take the determinant:

$$\det\begin{pmatrix} a - \lambda & b \\ c & d - \lambda \end{pmatrix} = (a-\lambda)(d-\lambda) - bc = \lambda^2 - (a + d)\lambda + (ad - bc).$$

Look at the two coefficients. $a + d$ is the **trace** — the sum of the diagonal entries, written $\operatorname{tr}(\mathbf{A})$. And $ad - bc$ is the determinant. So every $2\times 2$ characteristic polynomial is

$$\lambda^2 - \operatorname{tr}(\mathbf{A})\,\lambda + \det(\mathbf{A}) = 0,$$

and you can write it down without any algebra at all.

For the eigenvector, one row of $\mathbf{A} - \lambda\mathbf{I}$ is enough. That matrix is singular, so its second row carries no new information — it is a multiple of the first. The first row says $(a - \lambda)v_1 + b v_2 = 0$. When $b \neq 0$, a handy solution is $\mathbf{v} = (b,\ \lambda - a)^\mathsf{T}$. (Put it back in: $(a - \lambda)b + b(\lambda - a) = 0$.)

::: example Eigenvalues, eigenvectors and a cube of a 2×2 matrix
Take $\mathbf{A} = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$.

**Eigenvalues.** The trace is $2 + 2 = 4$ and the determinant is $2\cdot 2 - 1\cdot 1 = 3$. So the characteristic polynomial is $\lambda^2 - 4\lambda + 3$, which factors as $(\lambda - 3)(\lambda - 1)$. The eigenvalues are $\lambda_1 = 3$ and $\lambda_2 = 1$.

**First eigenvector.** For $\lambda_1 = 3$: $\mathbf{A} - 3\mathbf{I} = \begin{pmatrix} -1 & 1 \\ 1 & -1 \end{pmatrix}$. Its first row says $-v_1 + v_2 = 0$, so $v_2 = v_1$ and $\mathbf{v}_1 = (1, 1)^\mathsf{T}$. Check: $\mathbf{A}\mathbf{v}_1 = (2 + 1,\ 1 + 2)^\mathsf{T} = (3, 3)^\mathsf{T} = 3\mathbf{v}_1$.

**Second eigenvector.** For $\lambda_2 = 1$: $\mathbf{A} - \mathbf{I} = \begin{pmatrix} 1 & 1 \\ 1 & 1 \end{pmatrix}$. The first row says $v_1 + v_2 = 0$, so $\mathbf{v}_2 = (1, -1)^\mathsf{T}$. Check: $\mathbf{A}\mathbf{v}_2 = (2 - 1,\ 1 - 2)^\mathsf{T} = (1, -1)^\mathsf{T} = 1\cdot\mathbf{v}_2$.

**What it means.** $\mathbf{A}$ stretches the diagonal direction $(1, 1)$ by a factor of $3$ and leaves the other diagonal, $(1, -1)$, alone. Every other vector is a mix of those two, and gets a mix of the two treatments.

**Using it.** Now find $\mathbf{A}^3$ without multiplying three matrices. Put the eigenvectors in the columns of $\mathbf{V} = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$ and the eigenvalues on the diagonal of $\boldsymbol{\Lambda} = \operatorname{diag}(3, 1)$. The inverse is $\mathbf{V}^{-1} = \tfrac{1}{2}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$. Cubing a diagonal matrix cubes its entries, $3^3 = 27$ and $1^3 = 1$, so

$$\mathbf{A}^3 = \mathbf{V}\boldsymbol{\Lambda}^3\mathbf{V}^{-1} = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}\begin{pmatrix} 27 & 0 \\ 0 & 1 \end{pmatrix}\tfrac{1}{2}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix} = \begin{pmatrix} 14 & 13 \\ 13 & 14 \end{pmatrix}.$$

**Sanity check.** Multiplying $\mathbf{A}\cdot\mathbf{A}\cdot\mathbf{A}$ directly gives the same $\begin{pmatrix} 14 & 13 \\ 13 & 14 \end{pmatrix}$. For a cube the eigen-route looks longer. For $\mathbf{A}^{1000}$, or for $e^{\mathbf{A}t}$ in the next lesson, it is the only sensible route.
:::

## Trace and determinant as eigenvalue checks

The $2\times 2$ formula hid a pattern that holds for every square matrix. The eigenvalues add up to the trace, and they multiply to the determinant:

$$\operatorname{tr}(\mathbf{A}) = \sum_i \lambda_i, \qquad \det(\mathbf{A}) = \prod_i \lambda_i.$$

The symbol $\sum$ (capital sigma) means "add them all up", and $\prod$ (capital pi) means "multiply them all together". In the example, $3 + 1 = 4$ is the trace and $3 \times 1 = 3$ is the determinant.

These are the fastest checks you own. After any eigenvalue calculation — by hand or by machine — add up the eigenvalues and compare with the sum of the diagonal. It catches most sign and arithmetic slips in seconds.

The determinant rule also says something you already knew, in new words. A matrix is singular exactly when one of its eigenvalues is zero, because then the product is zero. The null space is then the eigenspace of $\lambda = 0$.

::: note Why it has to be true
If the eigenvalues are $\lambda_1, \dots, \lambda_n$, the characteristic polynomial factors as $p(\lambda) = (\lambda_1 - \lambda)(\lambda_2 - \lambda)\cdots(\lambda_n - \lambda)$. Put $\lambda = 0$ on both sides: the left is $\det(\mathbf{A} - 0\mathbf{I}) = \det\mathbf{A}$, and the right is $\lambda_1\lambda_2\cdots\lambda_n$. For the trace, compare the coefficient of $\lambda^{n-1}$. On the factored side, you get $\lambda^{n-1}$ by picking $-\lambda$ from all but one bracket, so its coefficient is $\pm(\lambda_1 + \cdots + \lambda_n)$. On the determinant side, only the product of the diagonal entries $(a_{11} - \lambda)\cdots(a_{nn} - \lambda)$ can reach that power, and it gives $\pm(a_{11} + \cdots + a_{nn})$ with the same sign. So the two sums are equal.
:::

## Complex eigenvalues: turning and ringing

A real matrix can have **complex eigenvalues** — eigenvalues with an imaginary part. When it does, they come in **[[conjugate pairs|conjugate-pairs]]** $\lambda = \sigma \pm i\omega$, where $\sigma$ ("sigma") is the real part and $\omega$ ("omega") the imaginary part.

The cleanest example is a turn. The matrix that rotates the plane by an angle $\theta$ is

$$\mathbf{R}(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}, \qquad \lambda^2 - 2\cos\theta\,\lambda + 1 = 0, \qquad \lambda = \cos\theta \pm i\sin\theta = e^{\pm i\theta}.$$

The polynomial comes straight from the $2\times 2$ shortcut: trace $2\cos\theta$, determinant $\cos^2\theta + \sin^2\theta = 1$. The last step is the Euler formula from the trigonometry module.

This makes sense. A rotation turns *every* real direction, so no real arrow can stay on its line — and the algebra agrees, putting the eigenvalues off the real axis unless $\theta$ is $0$ or $\pi$ (no turn, or a half turn that flips every arrow). Their size is $|e^{\pm i\theta}| = 1$. That is the algebra's way of saying that a rotation keeps lengths.

Here is the rule of thumb to carry. **Real eigenvalues describe stretching and shrinking along fixed directions. Complex pairs describe turning** — and in a system that moves in time, turning means oscillation. Lesson 3 makes the second half of that sentence precise.

::: example The stable and unstable directions of an inverted pendulum
Balance a broomstick on your palm. Near upright, a pendulum of length $L$ obeys $\ddot{\theta} = (g/L)\,\theta$: the farther it leans, the harder gravity pulls it over. Here $\ddot{\theta}$ ("theta double-dot") is the angular acceleration.

**Set it up.** Use the state $\mathbf{x} = (\theta, \dot{\theta})^\mathsf{T}$, angle and angular rate. With $L = 1\,\mathrm{m}$, $g/L = 9.80665\,\mathrm{s^{-2}}$, and $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ with

$$\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 9.80665 & 0 \end{pmatrix}.$$

The top row says "the rate of change of angle is the rate". The bottom row is the physics.

**Eigenvalues.** The trace is $0$ and the determinant is $0\cdot 0 - 1\cdot 9.80665 = -9.80665$. So $\lambda^2 - 9.80665 = 0$ and $\lambda = \pm\sqrt{9.80665} = \pm 3.13\,\mathrm{s^{-1}}$.

**Eigenvectors.** For $\lambda = +3.13$, the first row of $\mathbf{A} - \lambda\mathbf{I}$ says $-3.13\,v_1 + v_2 = 0$, so $\mathbf{v}_+ = (1,\ 3.13)^\mathsf{T}$. In the same way, $\mathbf{v}_- = (1,\ -3.13)^\mathsf{T}$.

**Read it physically.** Look at the **[[phase-plane picture|pendulum-phase]]**. A state on the $\mathbf{v}_+$ line has $\dot{\theta} = 3.13\,\theta$: it is leaning and moving the same way. It falls away exponentially, with time constant $1/3.13 = 0.319\,\mathrm{s}$, doubling every $\ln 2/3.13 = 0.221\,\mathrm{s}$. A state on the $\mathbf{v}_-$ line has $\dot{\theta} = -3.13\,\theta$: it is swinging back toward upright at exactly the rate that brings it to rest there, and it shrinks with the same time constant. Any other start is a mix of the two, and the growing part wins.

**Now hang it down.** Flip the pendulum to hang below its pivot, so $\ddot{\theta} = -(g/L)\,\theta$. The lower-left entry becomes $-9.80665$, the determinant becomes $+9.80665$, the polynomial is $\lambda^2 + 9.80665 = 0$, and $\lambda = \pm 3.13\,i$. The eigenvalues are purely imaginary: no stretching, only turning. That is an undamped swing, with period $2\pi/3.13 = 2.01\,\mathrm{s}$.

**Sanity check.** A real $1\,\mathrm{m}$ pendulum swings with a period close to $2\,\mathrm{s}$ — that is why a "seconds pendulum", which ticks once per second each way, is about a meter long. One sign changed, and the behavior changed completely.
:::

## Three by three, and the axis of a rotation

For a $3\times 3$ matrix, the determinant takes more work, so look for shortcuts before you grind:

- expand $\det(\mathbf{A} - \lambda\mathbf{I})$ along the row or column with the most zeros;
- a **triangular** matrix (all zeros below, or all zeros above, the diagonal) has its eigenvalues sitting on the diagonal, because its determinant is the product of the diagonal entries, so $\det(\mathbf{A} - \lambda\mathbf{I}) = \prod_i (a_{ii} - \lambda)$;
- a **block-diagonal** matrix has the eigenvalues of its blocks;
- if you can spot one eigenvector, factor its root out and finish with a quadratic.

::: example The axis of a rotation is its eigenvector
Spin a globe. Every point moves except the two poles: the axis stays put. So the axis of any rotation matrix is an eigenvector with eigenvalue $1$. Every rotation matrix $\mathbf{R}$ in **[[SO(3)|so3]]**, the set of all 3-D rotation matrices, has such an axis; this is **[[Euler's rotation theorem|euler-theorem]]** in eigen-language.

Take a rotation of $30^\circ$ about the $z$-axis, with $\cos 30^\circ = 0.866$ and $\sin 30^\circ = 0.5$:

$$\mathbf{R} = \begin{pmatrix} 0.866 & -0.5 & 0 \\ 0.5 & 0.866 & 0 \\ 0 & 0 & 1 \end{pmatrix}.$$

**Characteristic polynomial.** Expand $\det(\mathbf{R} - \lambda\mathbf{I})$ along the third row. Only its last entry, $1 - \lambda$, is nonzero, so

$$\det(\mathbf{R} - \lambda\mathbf{I}) = (1 - \lambda)\left[(0.866 - \lambda)^2 + 0.25\right] = (1 - \lambda)\left(\lambda^2 - 1.732\lambda + 1\right).$$

The bracket came from the top-left $2\times 2$ block: $(0.866 - \lambda)^2 - (-0.5)(0.5)$.

**Roots.** One root is $\lambda = 1$. The quadratic gives $\lambda = 0.866 \pm 0.5\,i = e^{\pm i\,30^\circ}$ — the planar rotation pair from the last section, living in the plane at right angles to the axis.

**The axis.** For $\lambda = 1$, solve $(\mathbf{R} - \mathbf{I})\mathbf{v} = \mathbf{0}$. The third row of $\mathbf{R} - \mathbf{I}$ is all zeros, so it says nothing. The first two rows, $-0.134v_1 - 0.5v_2 = 0$ and $0.5v_1 - 0.134v_2 = 0$, force $v_1 = v_2 = 0$. So $\mathbf{v} = (0, 0, 1)^\mathsf{T}$: the $z$-axis, as it must be.

**Checks.** Trace: $0.866 + 0.866 + 1 = 2.732$, and the eigenvalues add to $1 + e^{i30^\circ} + e^{-i30^\circ} = 1 + 2\cos 30^\circ = 2.732$. Determinant: $1\cdot e^{i30^\circ}e^{-i30^\circ} = 1$, as every proper rotation must have.

**A bonus.** For any rotation, $\operatorname{tr}(\mathbf{R}) = 1 + 2\cos\theta$. Turn that around and you can read the angle straight off the matrix: $\theta = \arccos\left((\operatorname{tr}\mathbf{R} - 1)/2\right)$. Here $\arccos(0.866) = 30^\circ$. Attitude software does exactly this to squeeze a **[[single angle out of a rotation error|attitude-error-angle]]**.
:::

## Diagonalisation

Suppose $\mathbf{A}$ has $n$ independent eigenvectors $\mathbf{v}_1, \dots, \mathbf{v}_n$, with eigenvalues $\lambda_1, \dots, \lambda_n$. Stand the eigenvectors side by side as the columns of a matrix $\mathbf{V}$. Put the eigenvalues down the diagonal of $\boldsymbol{\Lambda}$ ("capital lambda"), with zeros everywhere else. Multiplying one column at a time,

$$\mathbf{A}\mathbf{V} = \begin{pmatrix} \mathbf{A}\mathbf{v}_1 & \cdots & \mathbf{A}\mathbf{v}_n \end{pmatrix} = \begin{pmatrix} \lambda_1\mathbf{v}_1 & \cdots & \lambda_n\mathbf{v}_n \end{pmatrix} = \mathbf{V}\boldsymbol{\Lambda}.$$

The last step works because multiplying $\mathbf{V}$ on the right by a diagonal matrix scales each column by its diagonal entry. The columns of $\mathbf{V}$ are independent, so $\mathbf{V}$ has an inverse, and multiplying by $\mathbf{V}^{-1}$ ("V inverse") on one side or the other gives

$$\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}, \qquad \boldsymbol{\Lambda} = \mathbf{V}^{-1}\mathbf{A}\mathbf{V}.$$

This is **diagonalisation**, and it is best read as a recipe, right to left. To apply $\mathbf{A}$ to a vector $\mathbf{x}$:

1. Compute $\mathbf{z} = \mathbf{V}^{-1}\mathbf{x}$. These are the coordinates of $\mathbf{x}$ measured along the eigenvectors — "how much of each eigenvector is in $\mathbf{x}$".
2. Scale each coordinate by its own eigenvalue: $\boldsymbol{\Lambda}\mathbf{z}$.
3. Convert back to ordinary coordinates with $\mathbf{V}$.

In the eigenvector coordinates, the matrix is nothing but $n$ separate stretches. So anything you can do to a diagonal matrix one entry at a time, you can now do to $\mathbf{A}$:

- $\mathbf{A}^k = \mathbf{V}\boldsymbol{\Lambda}^k\mathbf{V}^{-1}$, because in $\mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}\,\mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}\cdots$ every inner $\mathbf{V}^{-1}\mathbf{V}$ cancels;
- $\mathbf{A}^{-1} = \mathbf{V}\boldsymbol{\Lambda}^{-1}\mathbf{V}^{-1}$, if no eigenvalue is zero;
- and in the next lesson, $e^{\mathbf{A}t} = \mathbf{V}e^{\boldsymbol{\Lambda}t}\mathbf{V}^{-1}$.

### When does it work?

You need $n$ independent eigenvectors. You are guaranteed them whenever the $n$ eigenvalues are all different.

::: note Why it has to be true
Take two eigenvectors with different eigenvalues, $\lambda_1 \neq \lambda_2$, and suppose they were on the same line: $\mathbf{v}_2 = c\,\mathbf{v}_1$. Apply $\mathbf{A}$ two ways. Directly, $\mathbf{A}\mathbf{v}_2 = \lambda_2\mathbf{v}_2$. Through $\mathbf{v}_1$, $\mathbf{A}\mathbf{v}_2 = c\,\mathbf{A}\mathbf{v}_1 = c\lambda_1\mathbf{v}_1 = \lambda_1\mathbf{v}_2$. Subtract: $(\lambda_2 - \lambda_1)\mathbf{v}_2 = \mathbf{0}$. The bracket is not zero and $\mathbf{v}_2$ is not zero, so this is impossible. The same idea, applied one eigenvector at a time, handles any number of distinct eigenvalues.
:::

With repeated eigenvalues, it depends. The identity matrix has $\lambda = 1$ twice, and every vector is an eigenvector — it is already diagonal. But now look at

$$\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}.$$

It is triangular, so its eigenvalues are its diagonal entries: $0$ and $0$. That is algebraic multiplicity two. But $\mathbf{A} - 0\mathbf{I} = \mathbf{A}$ has only one independent row, so its null space is the single direction $(1, 0)^\mathsf{T}$. That is geometric multiplicity one. There is no second eigenvector, so there is no invertible $\mathbf{V}$, and the matrix cannot be diagonalized. A matrix like this is called **defective** — it has too few eigenvectors to fill a basis. The **[[shear|shear-picture]]** is the picture of what goes wrong.

This one is not exotic at all. It is the **[[double integrator|double-integrator]]**: position and velocity with no force acting. Every navigation model with a position–velocity chain contains one. Lesson 2 shows that its exponential is easy anyway.

::: warning Eigenvectors need not be at right angles
In the first example the eigenvectors $(1, 1)$ and $(1, -1)$ happened to be perpendicular, because that matrix was **symmetric** (equal to its own transpose). For a general matrix the eigenvectors are only independent. In the pendulum example, $(1, 3.13)$ and $(1, -3.13)$ are far from perpendicular. Never use $\mathbf{V}^\mathsf{T}$ where you need $\mathbf{V}^{-1}$ unless you have checked that $\mathbf{V}$ is orthogonal — that its transpose is its inverse. Lesson 4 tells you exactly when that is guaranteed.
:::

## Eigenvalues of related matrices

Once you know the eigenvalues of $\mathbf{A}$, you know them for a whole family of matrices — usually with the same eigenvectors. Each row below is a one-line argument starting from $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$.

| Matrix | Eigenvalues | Eigenvectors | Why |
| --- | --- | --- | --- |
| $\mathbf{A}^\mathsf{T}$ | same $\lambda_i$ | different in general | $\det(\mathbf{A}^\mathsf{T} - \lambda\mathbf{I}) = \det(\mathbf{A} - \lambda\mathbf{I})^\mathsf{T}$, and a transpose has the same determinant |
| $c\mathbf{A}$ | $c\lambda_i$ | same | scale both sides of $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ |
| $\mathbf{A} + c\mathbf{I}$ | $\lambda_i + c$ | same | $(\mathbf{A} + c\mathbf{I})\mathbf{v} = \lambda\mathbf{v} + c\mathbf{v}$ |
| $\mathbf{A}^k$ | $\lambda_i^k$ | same | apply $\mathbf{A}$ again and again |
| $\mathbf{A}^{-1}$ | $1/\lambda_i$ | same | $\mathbf{v} = \lambda\mathbf{A}^{-1}\mathbf{v}$, needs $\lambda \neq 0$ |
| triangular | diagonal entries | — | determinant is the product of the diagonal |
| block diagonal | all the blocks' eigenvalues together | — | determinant splits block by block |
| orthogonal $\mathbf{Q}$ | all of size $1$ | — | $\mathbf{Q}$ keeps lengths, so it cannot stretch |

Two things are missing from this list because they are false. The eigenvalues of $\mathbf{A} + \mathbf{B}$ are *not* the sums of the separate eigenvalues. The eigenvalues of $\mathbf{A}\mathbf{B}$ are *not* the products. Both fail unless $\mathbf{A}$ and $\mathbf{B}$ share their eigenvectors. Remember that exception: sharing eigenvectors makes the two matrices **commute** ($\mathbf{A}\mathbf{B} = \mathbf{B}\mathbf{A}$), and commuting is exactly what the next lesson needs for $e^{\mathbf{A}+\mathbf{B}} = e^{\mathbf{A}}e^{\mathbf{B}}$ to hold.

## Eigenvalues in NumPy

```python
import numpy as np

A = np.array([[2.0, 1.0], [1.0, 2.0]])
w, V = np.linalg.eig(A)      # w: eigenvalues, V: eigenvectors as columns
print(w)                     # [3. 1.]
print(V[:, 0])               # [0.70710678 0.70710678]   unit-length, sign arbitrary
print(np.allclose(A @ V, V * w))   # True: A V = V Lambda, column by column
```

Four habits will save you hours of debugging with **[[`np.linalg.eig`|numpy-eig]]**:

- The eigenvectors are the **columns** of `V`, not the rows.
- They come back with length $1$ and an arbitrary sign. So $(0.707, 0.707)$ is the same eigenvector as our $(1, 1)$.
- The eigenvalues come back in no particular order — and as complex numbers as soon as any one of them is complex.
- For a symmetric matrix, call `np.linalg.eigh` instead. It is faster, always returns real eigenvalues, sorts them from smallest to largest, and returns perpendicular eigenvectors. Lesson 4 explains why it can promise all that.

## Check yourself

::: check
Find the eigenvalues and eigenvectors of $\mathbf{A} = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$, and check them against the trace and determinant.
:::

::: answer
**Eigenvalues.** The trace is $4 + 3 = 7$ and the determinant is $4\cdot 3 - 1\cdot 2 = 10$. So $\lambda^2 - 7\lambda + 10 = (\lambda - 5)(\lambda - 2) = 0$, giving $\lambda_1 = 5$ and $\lambda_2 = 2$. Check: they add to $7$ (the trace) and multiply to $10$ (the determinant).

**Eigenvectors.** For $\lambda_1 = 5$, the first row of $\mathbf{A} - 5\mathbf{I}$ is $(-1, 1)$, so $-v_1 + v_2 = 0$ and $\mathbf{v}_1 = (1, 1)^\mathsf{T}$. Check: $\mathbf{A}\mathbf{v}_1 = (4 + 1,\ 2 + 3)^\mathsf{T} = (5, 5)^\mathsf{T}$.

For $\lambda_2 = 2$, the first row of $\mathbf{A} - 2\mathbf{I}$ is $(2, 1)$, so $2v_1 + v_2 = 0$ and $\mathbf{v}_2 = (1, -2)^\mathsf{T}$. Check: $\mathbf{A}\mathbf{v}_2 = (4 - 2,\ 2 - 6)^\mathsf{T} = (2, -4)^\mathsf{T} = 2\mathbf{v}_2$.

Notice the eigenvectors are not perpendicular: their dot product is $1 - 2 = -1$. The matrix is not symmetric, so nothing promised they would be.
:::

::: check
Why does the definition insist on $\mathbf{v} \neq \mathbf{0}$? Does it also forbid $\lambda = 0$?
:::

::: answer
The zero vector satisfies $\mathbf{A}\mathbf{0} = \lambda\mathbf{0}$ for every number $\lambda$. Allowing it would make every number an eigenvalue of every matrix, and the idea would say nothing.

The eigenvalue, on the other hand, may be zero. $\lambda = 0$ means there is a nonzero $\mathbf{v}$ with $\mathbf{A}\mathbf{v} = \mathbf{0}$ — which is exactly the statement that $\mathbf{A}$ is singular. The eigenspace of $\lambda = 0$ is the null space of $\mathbf{A}$.
:::

::: check
A $3\times 3$ matrix has trace $6$ and determinant $6$, and you know that $1$ is one of its eigenvalues. Find the other two.
:::

::: answer
The eigenvalues add to the trace and multiply to the determinant. With $\lambda_1 = 1$, the other two must satisfy

- $1 + \lambda_2 + \lambda_3 = 6$, so $\lambda_2 + \lambda_3 = 5$;
- $1\cdot\lambda_2\lambda_3 = 6$, so $\lambda_2\lambda_3 = 6$.

Two numbers with sum $5$ and product $6$ are the roots of $\lambda^2 - 5\lambda + 6 = (\lambda - 2)(\lambda - 3)$. So the other two eigenvalues are $2$ and $3$. Check: $1 + 2 + 3 = 6$ and $1\cdot 2\cdot 3 = 6$.
:::

::: check
The matrix $\mathbf{A} = \begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix}$ is singular. Find both eigenvalues and eigenvectors, and describe what the matrix does to the plane.
:::

::: answer
**Eigenvalues.** Trace $5$, determinant $1\cdot 4 - 2\cdot 2 = 0$. So $\lambda^2 - 5\lambda = \lambda(\lambda - 5) = 0$, giving $\lambda = 0$ and $\lambda = 5$.

**Eigenvectors.** For $\lambda = 0$, solve $\mathbf{A}\mathbf{v} = \mathbf{0}$: the first row says $v_1 + 2v_2 = 0$, so $\mathbf{v} = (2, -1)^\mathsf{T}$. This is the null space. For $\lambda = 5$, the first row of $\mathbf{A} - 5\mathbf{I}$ is $(-4, 2)$, so $-4v_1 + 2v_2 = 0$ and $\mathbf{v} = (1, 2)^\mathsf{T}$.

**Geometry.** The matrix flattens the whole plane onto the line through $(1, 2)$. Everything along $(2, -1)$ is crushed to zero, and the part along $(1, 2)$ is stretched by $5$. You can see the same fact from the columns: both columns of $\mathbf{A}$, $(1, 2)$ and $(2, 4)$, lie on that line.
:::

::: check
Is $\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ diagonalisable? Explain.
:::

::: answer
It is triangular, so its eigenvalues are its diagonal entries: $\lambda = 1$, twice (algebraic multiplicity two).

The eigenvectors solve $(\mathbf{A} - \mathbf{I})\mathbf{v} = \mathbf{0}$, with $\mathbf{A} - \mathbf{I} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$. Its first row says $v_2 = 0$, which leaves only the direction $(1, 0)^\mathsf{T}$ (geometric multiplicity one).

One eigenvector is not enough to build an invertible $2\times 2$ matrix $\mathbf{V}$, so the matrix is defective and cannot be diagonalized. It matters in practice: this is the state transition matrix of a double integrator over one unit of time, as the next lesson shows.
:::

## Summary

| Item | Statement |
| --- | --- |
| Eigen-equation | $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$, $\mathbf{v} \neq \mathbf{0}$; eigenspace $= \operatorname{null}(\mathbf{A} - \lambda\mathbf{I})$ |
| Characteristic polynomial | $\det(\mathbf{A} - \lambda\mathbf{I}) = 0$, degree $n$, $n$ roots counting repeats |
| $2\times 2$ shortcut | $\lambda^2 - \operatorname{tr}(\mathbf{A})\lambda + \det(\mathbf{A}) = 0$; eigenvector $(b,\ \lambda - a)^\mathsf{T}$ |
| Checks | $\sum\lambda_i = \operatorname{tr}\mathbf{A}$, $\prod\lambda_i = \det\mathbf{A}$; singular $\Leftrightarrow$ some $\lambda = 0$ |
| Complex pairs | $\sigma \pm i\omega$ for real $\mathbf{A}$; rotation by $\theta$ has $e^{\pm i\theta}$ |
| Rotations | axis is the eigenvector for $\lambda = 1$; $\operatorname{tr}\mathbf{R} = 1 + 2\cos\theta$ |
| Diagonalisation | $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ when $n$ independent eigenvectors exist; $\mathbf{A}^k = \mathbf{V}\boldsymbol{\Lambda}^k\mathbf{V}^{-1}$ |
| Guaranteed | distinct eigenvalues $\Rightarrow$ diagonalisable |
| Defective | repeated $\lambda$ with too few eigenvectors, e.g. the double integrator $\begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$ |

The next lesson uses $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ to compute $e^{\mathbf{A}t}$, the matrix that carries the state of a linear system forward in time — and shows how to handle defective matrices like the double integrator, which have no such factorization.

::: context eigen-word Where "eigen" comes from
*Eigen* is German for "own", as in "its own". An eigenvector is a matrix's own direction, and an eigenvalue is its own value — the English word is a half-translation of the German *Eigenwert*. Older English books say "characteristic value" or "proper value" for the same thing, and that is why the polynomial that finds them is still called the *characteristic* polynomial.
:::

::: context stretch-picture Which arrows turn and which do not
The matrix $\begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$ from the first example, acting on three arrows. The eigenvector $(1, 1)$ stays on its dashed line and triples in length. The eigenvector $(1, -1)$ is left exactly as it was. The ordinary arrow $(1, 0)$ is turned: it comes out as $(2, 1)$, on a new line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="l1a-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1d6fd1"/></marker>
    <marker id="l1a-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b4232c"/></marker>
    <marker id="l1a-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#6c7a93"/></marker>
  </defs>
  <line x1="40" y1="130" x2="220" y2="130" stroke="#6c7a93" stroke-width="1"/>
  <line x1="110" y1="20" x2="110" y2="195" stroke="#6c7a93" stroke-width="1"/>
  <line x1="68" y1="172" x2="210.8" y2="29.2" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="68" y1="88" x2="174.4" y2="194.4" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="110" y1="130" x2="194" y2="46" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#l1a-b)"/>
  <line x1="110" y1="130" x2="138" y2="102" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="130" x2="138" y2="158" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#l1a-b)"/>
  <line x1="110" y1="130" x2="138" y2="130" stroke="#6c7a93" stroke-width="2" marker-end="url(#l1a-g)"/>
  <line x1="110" y1="130" x2="166" y2="102" stroke="#b4232c" stroke-width="2" marker-end="url(#l1a-r)"/>
  <text x="200" y="44" font-size="12" fill="#1d6fd1">A(1,1) = (3,3)</text>
  <text x="64" y="186" font-size="12" fill="#1d6fd1">(1,−1): same</text>
  <text x="142" y="146" font-size="11" fill="#6c7a93">(1,0)</text>
  <text x="170" y="100" font-size="12" fill="#b4232c">(2,1)</text>
  <text x="246" y="120" font-size="12" fill="#1f2a44">blue: eigenvectors</text>
  <text x="246" y="136" font-size="12" fill="#1f2a44">stay on their line</text>
  <text x="246" y="160" font-size="12" fill="#b4232c">red: an ordinary</text>
  <text x="246" y="176" font-size="12" fill="#b4232c">arrow is turned</text>
</svg>
```
:::

::: context singular-meaning What "singular" means for a matrix
A **singular** matrix is one that squashes at least one direction all the way down to zero. Once two different inputs land on the same output, no rule can tell you which input you started from — so a singular matrix has no inverse. Its determinant, which measures how much the matrix scales areas or volumes, is zero: a squashed shape has no area left. The opposite word is **invertible** (or nonsingular).
:::

::: context characteristic-polynomial Why it is always a polynomial
Every entry of $\mathbf{A} - \lambda\mathbf{I}$ is either a plain number or a number minus $\lambda$. A determinant is built only by multiplying entries and adding the products. Multiply $n$ such entries together and the highest power you can reach is $\lambda^n$, from the diagonal. So $\det(\mathbf{A} - \lambda\mathbf{I})$ is a polynomial of degree $n$. The fact that it then has exactly $n$ roots, counting repeats and allowing complex ones, is called the fundamental theorem of algebra.
:::

::: context conjugate-pairs Why complex roots come in pairs
If every entry of $\mathbf{A}$ is real, every coefficient of its characteristic polynomial is real too. Now take the complex conjugate — flip the sign of every $i$ — of the equation $p(\lambda) = 0$. The real coefficients do not change, so you get $p(\bar\lambda) = 0$. Whenever $\sigma + i\omega$ is a root, $\sigma - i\omega$ is one as well. That is why a real system's oscillations always show up as a matched pair of eigenvalues, mirror images across the real axis.
:::

::: context pendulum-phase The pendulum's two special lines
Each point in this picture is a state: angle across, angular rate up. The axes use different scales ($0.5\,\mathrm{rad}$ across matches $1.5\,\mathrm{rad/s}$ up). A state on the red line $\dot{\theta} = 3.13\,\theta$ runs away from upright. A state on the blue line $\dot{\theta} = -3.13\,\theta$ slides back to rest at upright. Every other state is a mix, and the red part takes over.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="100" x2="300" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="12" x2="180" y2="188" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="130" y1="96" x2="130" y2="104"/><line x1="230" y1="96" x2="230" y2="104"/>
    <line x1="176" y1="62.5" x2="184" y2="62.5"/><line x1="176" y1="137.5" x2="184" y2="137.5"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="230" y="118" text-anchor="middle">0.5</text><text x="130" y="118" text-anchor="middle">−0.5</text>
    <text x="188" y="66">1.5</text><text x="188" y="141">−1.5</text>
    <text x="304" y="104">angle</text><text x="186" y="22">rate</text>
  </g>
  <line x1="90" y1="170.5" x2="270" y2="29.5" stroke="#b4232c" stroke-width="2"/>
  <line x1="90" y1="29.5" x2="270" y2="170.5" stroke="#1d6fd1" stroke-width="2"/>
  <g fill="#b4232c"><polygon points="240.0,53.0 235.2,63.1 229.0,55.2"/><polygon points="120.0,147.0 124.8,136.9 131.0,144.8"/></g>
  <g fill="#1d6fd1"><polygon points="240.0,147.0 251.0,149.2 244.8,157.1"/><polygon points="120.0,53.0 109.0,50.8 115.2,42.9"/></g>
  <text x="276" y="34" font-size="12" fill="#b4232c">v₊ grows</text>
  <text x="276" y="176" font-size="12" fill="#1d6fd1">v₋ decays</text>
</svg>
```
:::

::: context so3 What SO(3) stands for
$SO(3)$, read "S O three", is the name for the set of all rotation matrices in three dimensions. The letters say what they are: **O**rthogonal (the columns are perpendicular unit vectors, so $\mathbf{R}^\mathsf{T}\mathbf{R} = \mathbf{I}$ and lengths are kept), **S**pecial (the determinant is $+1$, not $-1$, which rules out mirror images), and **3** for three dimensions. Every spacecraft attitude is one member of $SO(3)$.
:::

::: context euler-theorem Euler's rotation theorem
Leonhard Euler proved in the 1770s that any way of turning a rigid body about a fixed point, however complicated it looks, ends up the same as one single turn about one axis. The eigenvector argument above is a modern proof: a $3\times 3$ rotation always has a real eigenvalue equal to $1$, and its eigenvector is the axis. This is why an attitude error can always be described as "this many degrees about that axis".
:::

::: context attitude-error-angle Reading the angle, with care
Flight software often compares where the vehicle points with where it should point, forms the rotation between them, and reports one number: the total pointing error. $\theta = \arccos\left((\operatorname{tr}\mathbf{R} - 1)/2\right)$ gives it. One catch: for tiny angles the argument of $\arccos$ is very close to $1$, where the function is extremely steep, so rounding in the trace becomes a large angle error. Near zero, code usually gets the angle from the off-diagonal entries (or from a quaternion) instead.
:::

::: context shear-picture The picture of a defective matrix
The matrix $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ is a **shear**: it slides the top of a square sideways, like pushing the top of a deck of cards. The bottom edge, along $(1, 0)$, stays where it is — that is the one eigenvector. The upright edge $(0, 1)$ tips over to $(1, 1)$. Every direction except the horizontal one gets turned, so there is no second eigenvector to find.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="l1s-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1d6fd1"/></marker>
    <marker id="l1s-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b4232c"/></marker>
  </defs>
  <polygon points="100,150 170,150 170,80 100,80" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polygon points="100,150 170,150 240,80 170,80" fill="#8fb8f0" fill-opacity="0.35" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="150" x2="170" y2="150" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#l1s-b)"/>
  <line x1="100" y1="150" x2="100" y2="82" stroke="#6c7a93" stroke-width="2"/>
  <line x1="100" y1="150" x2="168" y2="82" stroke="#b4232c" stroke-width="2" marker-end="url(#l1s-r)"/>
  <text x="112" y="168" font-size="12" fill="#1d6fd1">(1,0) stays</text>
  <text x="60" y="76" font-size="12" fill="#6c7a93">(0,1)</text>
  <text x="176" y="74" font-size="12" fill="#b4232c">→ (1,1)</text>
  <text x="254" y="112" font-size="12" fill="#1f2a44">grey: before</text>
  <text x="254" y="128" font-size="12" fill="#1f2a44">blue: after</text>
</svg>
```
:::

::: context double-integrator Why "double integrator"
Integrating means adding up a rate over time. Integrate acceleration once and you get velocity; integrate again and you get position. A system whose input is acceleration and whose output is position does that twice, so it is a double integrator. With no input at all, its dynamics matrix is $\begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$: "position changes at the velocity, velocity does not change". A spacecraft coasting in deep space, a navigation filter's position–velocity model, and a lander's vertical channel all start from this matrix.
:::

::: context numpy-eig What runs underneath
`np.linalg.eig` does not solve the characteristic polynomial — finding polynomial roots is a badly behaved way to get eigenvalues. It calls LAPACK, a long-established Fortran library of linear-algebra routines, which uses the QR algorithm: it applies a long sequence of orthogonal similarity transforms (the idea of Lesson 3) until the matrix is nearly triangular, and then reads the eigenvalues off the diagonal. MATLAB, Julia and most flight-software toolchains call the same family of routines.
:::
