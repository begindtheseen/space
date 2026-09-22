---
id: l06-orthogonality-gram-schmidt-qr
title: Orthogonality, Gram–Schmidt and QR
minutes: 23
covers:
  - orthogonality, Gram-Schmidt, QR
---

Perpendicular directions do not interfere with each other. That single fact is why reference frames use mutually perpendicular axes, why a least-squares fit is found by making the leftover error perpendicular to everything the model can explain, and why the most numerically trustworthy algorithms in navigation are built from matrices whose columns are perpendicular unit vectors. This lesson is about orthogonality in all three of those roles.

It begins with the projection of one vector onto another, which was promised in the first lesson and is the elementary operation from which everything else here is assembled. It then treats orthonormal sets and the matrices made from them — orthogonal matrices, which preserve every length and every angle, and of which rotation matrices are the most important case. Finally it gives the procedure that manufactures an orthonormal set from any independent set, Gram–Schmidt, and shows that recording the procedure's bookkeeping produces the QR factorisation, $\mathbf{A} = \mathbf{Q}\mathbf{R}$.

QR is not a curiosity. It is how least-squares problems are solved in production code, and the square-root Kalman filters flown on vehicles where numerical robustness matters are built on it. The reason — that an orthogonal matrix cannot amplify error, so QR avoids squaring the condition number — is explained at the end of the lesson.

## Projection onto a line

Given a nonzero vector $\mathbf{a}$ and any vector $\mathbf{b}$, split $\mathbf{b}$ into a part along $\mathbf{a}$ and a part perpendicular to it. The part along $\mathbf{a}$ is some multiple $\mathbf{p} = c\,\mathbf{a}$, and it is the right multiple when what is left over, $\mathbf{b} - c\,\mathbf{a}$, is orthogonal to $\mathbf{a}$:

$$
(\mathbf{b} - c\,\mathbf{a})\cdot\mathbf{a} = 0 \quad\Longrightarrow\quad \mathbf{b}\cdot\mathbf{a} - c\,(\mathbf{a}\cdot\mathbf{a}) = 0 \quad\Longrightarrow\quad c = \frac{\mathbf{a}\cdot\mathbf{b}}{\mathbf{a}\cdot\mathbf{a}} .
$$

So the **projection** of $\mathbf{b}$ onto $\mathbf{a}$ and the **residual** are

$$
\operatorname{proj}_{\mathbf{a}}(\mathbf{b}) = \frac{\mathbf{a}\cdot\mathbf{b}}{\mathbf{a}\cdot\mathbf{a}}\,\mathbf{a}, \qquad \mathbf{r} = \mathbf{b} - \operatorname{proj}_{\mathbf{a}}(\mathbf{b}), \qquad \mathbf{r}\cdot\mathbf{a} = 0 .
$$

If $\mathbf{a}$ is a unit vector $\hat{\mathbf{u}}$ the denominator is $1$ and the projection is $(\hat{\mathbf{u}}\cdot\mathbf{b})\,\hat{\mathbf{u}}$: the component along $\hat{\mathbf{u}}$ from the first lesson, turned back into a vector. Because $\mathbf{p}$ and $\mathbf{r}$ are orthogonal, Pythagoras holds, $\|\mathbf{b}\|^2 = \|\mathbf{p}\|^2 + \|\mathbf{r}\|^2$, and the projection is the point on the line through $\mathbf{a}$ closest to $\mathbf{b}$: any other point $\mathbf{p}'$ on the line has $\|\mathbf{b} - \mathbf{p}'\|^2 = \|\mathbf{r}\|^2 + \|\mathbf{p} - \mathbf{p}'\|^2 \ge \|\mathbf{r}\|^2$.

Projection is linear in $\mathbf{b}$, so it has a matrix. Writing the dot product as $\mathbf{a}^T\mathbf{b}$ and regrouping,

$$
\operatorname{proj}_{\mathbf{a}}(\mathbf{b}) = \mathbf{a}\,\frac{\mathbf{a}^T\mathbf{b}}{\mathbf{a}^T\mathbf{a}} = \left(\frac{\mathbf{a}\,\mathbf{a}^T}{\mathbf{a}^T\mathbf{a}}\right)\mathbf{b} = \mathbf{P}\,\mathbf{b} ,
$$

where $\mathbf{P} = \mathbf{a}\mathbf{a}^T / (\mathbf{a}^T\mathbf{a})$ is the outer product of $\mathbf{a}$ with itself, scaled. It is symmetric, and projecting twice is the same as projecting once: $\mathbf{P}^2 = \mathbf{a}(\mathbf{a}^T\mathbf{a})\mathbf{a}^T / (\mathbf{a}^T\mathbf{a})^2 = \mathbf{P}$. Its rank is one — every output is a multiple of $\mathbf{a}$ — so it is singular, as anything that flattens space onto a line must be.

::: example Splitting a specific-force vector
An accelerometer axis lies along $\mathbf{a} = (3, 4, 0)^T$ (not a unit vector) and the specific force is $\mathbf{b} = (2, 1, 5)^T\ \mathrm{m/s^2}$. Then $\mathbf{a}\cdot\mathbf{b} = 6 + 4 + 0 = 10$ and $\mathbf{a}\cdot\mathbf{a} = 9 + 16 = 25$, so

$$
\operatorname{proj}_{\mathbf{a}}(\mathbf{b}) = \frac{10}{25}\,(3, 4, 0)^T = (1.2, 1.6, 0)^T\ \mathrm{m/s^2}, \qquad \mathbf{r} = (2 - 1.2,\ 1 - 1.6,\ 5)^T = (0.8, -0.6, 5)^T\ \mathrm{m/s^2}.
$$

Check orthogonality: $\mathbf{r}\cdot\mathbf{a} = 2.4 - 2.4 + 0 = 0$. The sensor sees a magnitude of $\|\mathbf{p}\| = 2\ \mathrm{m/s^2}$ along its axis (which is $\mathbf{b}\cdot\hat{\mathbf{a}} = 10/5$) and is blind to the residual of magnitude $\sqrt{0.64 + 0.36 + 25} = 5.10\ \mathrm{m/s^2}$. Pythagoras: $4 + 26 = 30 = \|\mathbf{b}\|^2$.
:::

::: key Projection
$\operatorname{proj}_{\mathbf{a}}(\mathbf{b}) = \dfrac{\mathbf{a}\cdot\mathbf{b}}{\mathbf{a}\cdot\mathbf{a}}\,\mathbf{a}$. The residual $\mathbf{b} - \operatorname{proj}_{\mathbf{a}}(\mathbf{b})$ is orthogonal to $\mathbf{a}$, and the projection is the closest point to $\mathbf{b}$ on the line through $\mathbf{a}$. Making the residual orthogonal to what the model can produce is the whole idea behind least squares.
:::

## Orthonormal sets and orthogonal matrices

A set of vectors is **orthogonal** if every pair has zero dot product, and **orthonormal** if in addition each has unit length:

$$
\mathbf{q}_i\cdot\mathbf{q}_j = \delta_{ij} = \begin{cases} 1 & i = j \\ 0 & i \ne j . \end{cases}
$$

An orthogonal set of nonzero vectors is automatically linearly independent. Dot any dependence $\sum_j c_j\mathbf{q}_j = \mathbf{0}$ with $\mathbf{q}_i$: every term but one vanishes, leaving $c_i\,(\mathbf{q}_i\cdot\mathbf{q}_i) = 0$, so $c_i = 0$. Hence $n$ orthonormal vectors in $\mathbb{R}^n$ form a basis, an **orthonormal basis**, and its coordinates cost nothing to find. If $\mathbf{x} = \sum_j c_j\mathbf{q}_j$, dot with $\mathbf{q}_i$ to get

$$
c_i = \mathbf{q}_i\cdot\mathbf{x} .
$$

No system to solve: each coordinate is a single dot product, independent of the others. The axes $\hat{\mathbf{x}}, \hat{\mathbf{y}}, \hat{\mathbf{z}}$ of a reference frame are an orthonormal basis, and the components of a vector in that frame are its dot products with the axes, which is exactly what three single-axis sensors along the axes measure.

### Orthogonal matrices

Stack orthonormal vectors as the columns of a matrix $\mathbf{Q}$. Entry $(i, j)$ of $\mathbf{Q}^T\mathbf{Q}$ is row $i$ of $\mathbf{Q}^T$ dotted with column $j$ of $\mathbf{Q}$, which is $\mathbf{q}_i\cdot\mathbf{q}_j = \delta_{ij}$. So

$$
\mathbf{Q}^T\mathbf{Q} = \mathbf{I} .
$$

This holds for any $m \times n$ matrix with orthonormal columns. When $\mathbf{Q}$ is square, $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$ says $\mathbf{Q}^T$ is a left inverse, and for square matrices a left inverse is the inverse, so $\mathbf{Q}^{-1} = \mathbf{Q}^T$ and also $\mathbf{Q}\mathbf{Q}^T = \mathbf{I}$: the rows are orthonormal too. A square matrix with orthonormal columns is called an **orthogonal matrix**.

An orthogonal matrix preserves the dot product, and with it every length and every angle:

$$
(\mathbf{Q}\mathbf{x})\cdot(\mathbf{Q}\mathbf{y}) = (\mathbf{Q}\mathbf{x})^T(\mathbf{Q}\mathbf{y}) = \mathbf{x}^T\mathbf{Q}^T\mathbf{Q}\,\mathbf{y} = \mathbf{x}^T\mathbf{y} = \mathbf{x}\cdot\mathbf{y}, \qquad \|\mathbf{Q}\mathbf{x}\|_2 = \|\mathbf{x}\|_2 .
$$

Taking determinants of $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$ gives $(\det\mathbf{Q})^2 = 1$, so $\det\mathbf{Q} = \pm 1$: an orthogonal matrix is a rotation ($+1$) or a rotation combined with a reflection ($-1$). Products of orthogonal matrices are orthogonal, since $(\mathbf{Q}_1\mathbf{Q}_2)^T(\mathbf{Q}_1\mathbf{Q}_2) = \mathbf{Q}_2^T\mathbf{Q}_1^T\mathbf{Q}_1\mathbf{Q}_2 = \mathbf{I}$, and so is the inverse.

Two consequences run through the whole curriculum. Physically: a change of reference frame is an orthogonal matrix, so the speed of a vehicle, the magnitude of a torque and the angle between two boresights are the same numbers in every frame. Numerically: a matrix that changes no lengths cannot magnify an error. Multiplying data by an orthogonal matrix is the one linear operation that is guaranteed not to make round-off worse, which is why stable algorithms are built from orthogonal factors.

::: key What an orthogonal matrix preserves
If $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$ then $\|\mathbf{Q}\mathbf{x}\|_2 = \|\mathbf{x}\|_2$ and $(\mathbf{Q}\mathbf{x})\cdot(\mathbf{Q}\mathbf{y}) = \mathbf{x}\cdot\mathbf{y}$: lengths and angles are unchanged. For a square $\mathbf{Q}$, $\mathbf{Q}^{-1} = \mathbf{Q}^T$ and $\det\mathbf{Q} = \pm 1$. This is why changing frames never changes a physical magnitude.
:::

## Gram–Schmidt: manufacturing an orthonormal basis

Suppose you have independent vectors $\mathbf{a}_1, \dots, \mathbf{a}_n$ that are not orthogonal — three sensor axes mounted at odd angles, or the columns of a model matrix — and you want an orthonormal set $\mathbf{q}_1, \dots, \mathbf{q}_n$ spanning the same space. Projection does it one vector at a time.

Start with $\mathbf{q}_1 = \mathbf{a}_1 / \|\mathbf{a}_1\|$. For the second, remove from $\mathbf{a}_2$ its component along $\mathbf{q}_1$ and normalise what is left:

$$
\mathbf{w}_2 = \mathbf{a}_2 - (\mathbf{q}_1\cdot\mathbf{a}_2)\,\mathbf{q}_1, \qquad \mathbf{q}_2 = \frac{\mathbf{w}_2}{\|\mathbf{w}_2\|} .
$$

The residual of a projection is orthogonal to the direction projected onto, so $\mathbf{w}_2 \perp \mathbf{q}_1$, and $\mathbf{w}_2 \ne \mathbf{0}$ because $\mathbf{a}_2$ is not a multiple of $\mathbf{a}_1$. In general, subtract from $\mathbf{a}_k$ its projections onto all the unit vectors found so far:

$$
\mathbf{w}_k = \mathbf{a}_k - \sum_{j < k} (\mathbf{q}_j\cdot\mathbf{a}_k)\,\mathbf{q}_j, \qquad \mathbf{q}_k = \frac{\mathbf{w}_k}{\|\mathbf{w}_k\|} .
$$

To see that $\mathbf{w}_k$ is orthogonal to each earlier $\mathbf{q}_i$, dot it with $\mathbf{q}_i$: the sum contributes only its $j = i$ term because the $\mathbf{q}_j$ are already orthonormal, giving $\mathbf{q}_i\cdot\mathbf{a}_k - (\mathbf{q}_i\cdot\mathbf{a}_k)(\mathbf{q}_i\cdot\mathbf{q}_i) = 0$. And $\mathbf{w}_k \ne \mathbf{0}$ because $\mathbf{a}_k$ is not in the span of $\mathbf{a}_1, \dots, \mathbf{a}_{k-1}$, which is the span of $\mathbf{q}_1, \dots, \mathbf{q}_{k-1}$. This is the **Gram–Schmidt process**. It preserves the nesting: $\mathbf{q}_1$ spans the same line as $\mathbf{a}_1$, $\mathbf{q}_1, \mathbf{q}_2$ span the same plane as $\mathbf{a}_1, \mathbf{a}_2$, and so on. If some $\mathbf{w}_k$ comes out zero, the input vectors were dependent — Gram–Schmidt is also a test of independence.

::: example Orthonormalising three vectors
Apply Gram–Schmidt to $\mathbf{a}_1 = (1, 1, 0)^T$, $\mathbf{a}_2 = (1, 0, 1)^T$, $\mathbf{a}_3 = (0, 1, 1)^T$.

**Step 1.** $\|\mathbf{a}_1\| = \sqrt{2}$, so $\mathbf{q}_1 = (1, 1, 0)^T/\sqrt{2} = (0.7071, 0.7071, 0)^T$.

**Step 2.** $\mathbf{q}_1\cdot\mathbf{a}_2 = 0.7071$, so $\mathbf{w}_2 = (1, 0, 1)^T - 0.7071\,(0.7071, 0.7071, 0)^T = (1, 0, 1)^T - (0.5, 0.5, 0)^T = (0.5, -0.5, 1)^T$. Its length is $\sqrt{0.25 + 0.25 + 1} = \sqrt{1.5} = 1.2247$, so $\mathbf{q}_2 = (0.4082, -0.4082, 0.8165)^T$.

**Step 3.** $\mathbf{q}_1\cdot\mathbf{a}_3 = 0.7071$ and $\mathbf{q}_2\cdot\mathbf{a}_3 = -0.4082 + 0.8165 = 0.4082$. Then

$$
\mathbf{w}_3 = (0, 1, 1)^T - 0.7071\,(0.7071, 0.7071, 0)^T - 0.4082\,(0.4082, -0.4082, 0.8165)^T = (0, 1, 1)^T - (0.5, 0.5, 0)^T - (0.1667, -0.1667, 0.3333)^T = (-0.6667, 0.6667, 0.6667)^T,
$$

with length $\sqrt{3 \times 0.4444} = 1.1547$, so $\mathbf{q}_3 = (-0.5774, 0.5774, 0.5774)^T = (-1, 1, 1)^T/\sqrt{3}$.

Check: $\mathbf{q}_1\cdot\mathbf{q}_3 = (-0.5774 + 0.5774)/\sqrt{2} = 0$ and $\mathbf{q}_2\cdot\mathbf{q}_3 = (-0.4082 - 0.4082 + 0.8165)\times 0.5774 = 0$ to the precision shown. The three unit vectors are mutually perpendicular and span $\mathbb{R}^3$, and the matrix with them as columns is orthogonal.
:::

## The QR factorisation

Gram–Schmidt produced each $\mathbf{q}_k$ from $\mathbf{a}_k$ and earlier $\mathbf{q}$'s. Turn the relations around to express each $\mathbf{a}_k$ in terms of the $\mathbf{q}$'s. From $\mathbf{w}_k = \|\mathbf{w}_k\|\,\mathbf{q}_k$,

$$
\mathbf{a}_k = \sum_{j < k} (\mathbf{q}_j\cdot\mathbf{a}_k)\,\mathbf{q}_j + \|\mathbf{w}_k\|\,\mathbf{q}_k .
$$

Name the coefficients $r_{jk} = \mathbf{q}_j\cdot\mathbf{a}_k$ for $j < k$ and $r_{kk} = \|\mathbf{w}_k\|$. Then $\mathbf{a}_k = \sum_{j \le k} r_{jk}\,\mathbf{q}_j$: column $k$ of $\mathbf{A}$ is the matrix $\mathbf{Q} = [\mathbf{q}_1 \cdots \mathbf{q}_n]$ times a vector whose entries below position $k$ are zero. Assembling all the columns,

$$
\mathbf{A} = \mathbf{Q}\mathbf{R}, \qquad \mathbf{Q}^T\mathbf{Q} = \mathbf{I}, \qquad \mathbf{R} = \begin{pmatrix} r_{11} & r_{12} & \cdots & r_{1n} \\ 0 & r_{22} & \cdots & r_{2n} \\ \vdots & & \ddots & \vdots \\ 0 & 0 & \cdots & r_{nn} \end{pmatrix}.
$$

This is the **QR factorisation**: an $m \times n$ matrix with independent columns is the product of an $m \times n$ matrix $\mathbf{Q}$ with orthonormal columns and an $n \times n$ upper-triangular $\mathbf{R}$ with positive diagonal. $\mathbf{Q}$ holds an orthonormal basis for the column space of $\mathbf{A}$; $\mathbf{R}$ records how the original columns are built from that basis, and it is triangular precisely because Gram–Schmidt only ever looks backward. Since $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$, the factor $\mathbf{R}$ can be recovered as $\mathbf{R} = \mathbf{Q}^T\mathbf{A}$.

::: example QR of a line-fit matrix
A radar reports range to a target at $t = 1, 2, 3\ \mathrm{s}$, and the model is a straight line $\rho(t) = x_1 + x_2 t$. The model matrix has a column of ones and a column of times:

$$
\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & 2 \\ 1 & 3 \end{pmatrix}.
$$

Gram–Schmidt on the columns: $r_{11} = \|\mathbf{a}_1\| = \sqrt{3} = 1.7321$ and $\mathbf{q}_1 = (1, 1, 1)^T/\sqrt{3}$. Then $r_{12} = \mathbf{q}_1\cdot\mathbf{a}_2 = 6/\sqrt{3} = 2\sqrt{3} = 3.4641$, and $\mathbf{w}_2 = (1, 2, 3)^T - 2\sqrt{3}\,(1, 1, 1)^T/\sqrt{3} = (1, 2, 3)^T - (2, 2, 2)^T = (-1, 0, 1)^T$, with $r_{22} = \sqrt{2} = 1.4142$ and $\mathbf{q}_2 = (-1, 0, 1)^T/\sqrt{2}$. So

$$
\mathbf{Q} = \begin{pmatrix} 0.5774 & -0.7071 \\ 0.5774 & 0 \\ 0.5774 & 0.7071 \end{pmatrix}, \qquad \mathbf{R} = \begin{pmatrix} 1.7321 & 3.4641 \\ 0 & 1.4142 \end{pmatrix}.
$$

Verify the second column of $\mathbf{Q}\mathbf{R}$: $3.4641\,\mathbf{q}_1 + 1.4142\,\mathbf{q}_2 = (2, 2, 2)^T + (-1, 0, 1)^T = (1, 2, 3)^T$. The first column of $\mathbf{Q}$ is the direction of "same value at every time" and the second is the direction of "linear trend", made orthogonal to it — which is why the second is centred on the middle time.
:::

### Least squares through QR

Suppose $\mathbf{A}\mathbf{x} = \mathbf{b}$ has more equations than unknowns — three ranges, two line parameters — and no exact solution because $\mathbf{b}$ is not in the column space of $\mathbf{A}$. The **least-squares** solution minimises the residual length $\|\mathbf{b} - \mathbf{A}\mathbf{x}\|_2$. By the projection argument at the start of the lesson, extended from a line to the column space, the minimising $\mathbf{A}\mathbf{x}$ is the projection of $\mathbf{b}$ onto the column space, and the residual $\mathbf{b} - \mathbf{A}\mathbf{x}$ is orthogonal to every column of $\mathbf{A}$:

$$
\mathbf{A}^T(\mathbf{b} - \mathbf{A}\mathbf{x}) = \mathbf{0} \quad\Longrightarrow\quad \mathbf{A}^T\mathbf{A}\,\mathbf{x} = \mathbf{A}^T\mathbf{b} .
$$

These are the **normal equations**. Now substitute $\mathbf{A} = \mathbf{Q}\mathbf{R}$: the left side becomes $\mathbf{R}^T\mathbf{Q}^T\mathbf{Q}\mathbf{R}\,\mathbf{x} = \mathbf{R}^T\mathbf{R}\,\mathbf{x}$ and the right side $\mathbf{R}^T\mathbf{Q}^T\mathbf{b}$. The triangular $\mathbf{R}^T$ has a nonzero diagonal and is invertible, so it cancels:

$$
\mathbf{R}\,\mathbf{x} = \mathbf{Q}^T\mathbf{b} .
$$

One matrix–vector product and one back substitution. Continuing the example with measured ranges $\mathbf{b} = (2.1, 3.9, 6.2)^T\ \mathrm{m}$: $\mathbf{Q}^T\mathbf{b} = ((2.1 + 3.9 + 6.2)/\sqrt{3},\ (6.2 - 2.1)/\sqrt{2})^T = (7.0437, 2.8991)^T$. Back substitution: $x_2 = 2.8991/1.4142 = 2.05$ and $x_1 = (7.0437 - 3.4641 \times 2.05)/1.7321 = -0.0333$. The fitted line is $\rho(t) = -0.033 + 2.05\,t$ m: a closing speed of $2.05\ \mathrm{m/s}$. The residual is $\mathbf{b} - \mathbf{A}\mathbf{x} = (0.083, -0.167, 0.083)^T$ m, whose dot products with both columns of $\mathbf{A}$ are $0$ and $0.083 - 0.333 + 0.250 = 0$, as the orthogonality condition demands. The normal equations give the same answer — $\mathbf{A}^T\mathbf{A} = \begin{pmatrix} 3 & 6 \\ 6 & 14 \end{pmatrix}$, $\mathbf{A}^T\mathbf{b} = (12.2, 28.5)^T$, solution $(-0.0333, 2.05)^T$ — but for a reason explained next, they are the wrong way to get it in code.

### Why QR and not the normal equations

Every matrix stretches some input directions more than others. The ratio of its largest stretch to its smallest is its **condition number** $\kappa(\mathbf{A})$, and it is the factor by which relative errors in the data can be amplified into relative errors in the solution. (Linear Algebra II computes it from the singular values; here only the idea is needed.) In double precision you have about 16 significant digits; a problem with $\kappa = 10^{8}$ can lose 8 of them.

Forming $\mathbf{A}^T\mathbf{A}$ squares the stretches — the largest becomes largest squared, the smallest becomes smallest squared — so

$$
\kappa(\mathbf{A}^T\mathbf{A}) = \kappa(\mathbf{A})^2 .
$$

A model matrix with $\kappa = 10^8$, which QR handles with 8 digits to spare, becomes a normal-equation matrix with $\kappa = 10^{16}$, and the solution is noise. QR never squares anything. Multiplying by $\mathbf{Q}^T$ preserves the 2-norm and so introduces no amplification, and the triangular system $\mathbf{R}\mathbf{x} = \mathbf{Q}^T\mathbf{b}$ has $\kappa(\mathbf{R}) = \kappa(\mathbf{A})$ exactly, because $\mathbf{R} = \mathbf{Q}^T\mathbf{A}$ and an orthogonal factor changes no lengths. That is why `numpy.linalg.lstsq` and every serious least-squares routine go through an orthogonal factorisation, and why square-root Kalman filters propagate a triangular factor of the covariance with QR updates instead of the covariance itself.

::: key The QR factorisation
$\mathbf{A} = \mathbf{Q}\mathbf{R}$ with $\mathbf{Q}$ having orthonormal columns ($\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$) and $\mathbf{R}$ upper triangular. $\mathbf{Q}$ comes from Gram–Schmidt on the columns of $\mathbf{A}$; $\mathbf{R} = \mathbf{Q}^T\mathbf{A}$. Least squares becomes $\mathbf{R}\mathbf{x} = \mathbf{Q}^T\mathbf{b}$, and because $\mathbf{Q}$ preserves the 2-norm this avoids squaring the condition number, which the normal equations $\mathbf{A}^T\mathbf{A}\mathbf{x} = \mathbf{A}^T\mathbf{b}$ do.
:::

::: warning Classical Gram–Schmidt loses orthogonality in floating point
Computing all the projections of $\mathbf{a}_k$ from the original $\mathbf{a}_k$, as written above, lets round-off in one subtraction contaminate the next, and for nearly dependent inputs the resulting $\mathbf{q}$'s can be far from orthogonal. **Modified Gram–Schmidt** subtracts the projections one at a time from the running $\mathbf{w}_k$ — project the current remainder, not the original vector — and is much better. Library QR uses Householder reflections, which are orthogonal to round-off. `numpy.linalg.qr` returns $\mathbf{Q}$ and $\mathbf{R}$ computed that way; do not hand-roll Gram–Schmidt for anything that matters.
:::

::: warning Orthonormal columns do not make a matrix square
An $m \times n$ matrix $\mathbf{Q}$ with $m > n$ can have $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}_n$ while $\mathbf{Q}\mathbf{Q}^T \ne \mathbf{I}_m$. The second product is the projection matrix onto the column space, not the identity. Only square $\mathbf{Q}$ has $\mathbf{Q}^{-1} = \mathbf{Q}^T$.
:::

```python
import numpy as np

A = np.array([[1.0, 1.0], [1.0, 2.0], [1.0, 3.0]])
b = np.array([2.1, 3.9, 6.2])
Q, R = np.linalg.qr(A)                 # signs may differ from the hand computation
x = np.linalg.solve(R, Q.T @ b)        # triangular solve in practice
print(x)                               # [-0.03333333  2.05      ]
print(np.allclose(Q.T @ Q, np.eye(2))) # True
print(A.T @ (b - A @ x))               # ~[0. 0.]  residual orthogonal to the columns
```

## Check yourself

::: check
Project $\mathbf{b} = (4, 2, -1)^T$ onto $\mathbf{a} = (1, -1, 2)^T$, and verify that the residual is orthogonal to $\mathbf{a}$.
:::

::: answer
$\mathbf{a}\cdot\mathbf{b} = 4 - 2 - 2 = 0$. The projection is $\mathbf{0}$: $\mathbf{b}$ is already orthogonal to $\mathbf{a}$, so the residual is $\mathbf{b}$ itself and $\mathbf{b}\cdot\mathbf{a} = 0$ holds trivially. A zero projection means the two directions do not interfere at all.
:::

::: check
The columns of $\mathbf{Q} = \begin{pmatrix} 0.6 & -0.8 \\ 0.8 & 0.6 \end{pmatrix}$ are claimed to be orthonormal. Verify, state $\mathbf{Q}^{-1}$ without solving anything, and compute $\|\mathbf{Q}\mathbf{x}\|$ for $\mathbf{x} = (3, 4)^T$ without forming $\mathbf{Q}\mathbf{x}$.
:::

::: answer
Column lengths: $0.36 + 0.64 = 1$ for both. Dot product of the columns: $0.6 \times (-0.8) + 0.8 \times 0.6 = 0$. So $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$ and $\mathbf{Q}^{-1} = \mathbf{Q}^T = \begin{pmatrix} 0.6 & 0.8 \\ -0.8 & 0.6 \end{pmatrix}$. Because an orthogonal matrix preserves length, $\|\mathbf{Q}\mathbf{x}\| = \|\mathbf{x}\| = 5$. (It is a rotation: $\det\mathbf{Q} = 0.36 + 0.64 = +1$.)
:::

::: check
Run Gram–Schmidt on $\mathbf{a}_1 = (2, 0, 0)^T$ and $\mathbf{a}_2 = (1, 3, 0)^T$, and write the resulting $\mathbf{Q}$ and $\mathbf{R}$.
:::

::: answer
$r_{11} = 2$, $\mathbf{q}_1 = (1, 0, 0)^T$. $r_{12} = \mathbf{q}_1\cdot\mathbf{a}_2 = 1$; $\mathbf{w}_2 = (1, 3, 0)^T - 1\,(1, 0, 0)^T = (0, 3, 0)^T$; $r_{22} = 3$, $\mathbf{q}_2 = (0, 1, 0)^T$. So $\mathbf{Q} = \begin{pmatrix} 1 & 0 \\ 0 & 1 \\ 0 & 0 \end{pmatrix}$ and $\mathbf{R} = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}$. Check: $\mathbf{Q}\mathbf{R}$ has columns $(2, 0, 0)^T$ and $(1, 3, 0)^T$.
:::

::: check
Why does the residual of a least-squares fit have to be orthogonal to every column of $\mathbf{A}$? Argue from the projection picture rather than from calculus.
:::

::: answer
The set of all $\mathbf{A}\mathbf{x}$ is the column space, a subspace. The closest point in a subspace to $\mathbf{b}$ is the foot of the perpendicular from $\mathbf{b}$ — if the residual had a component along some column, moving $\mathbf{A}\mathbf{x}$ a little in that direction would shorten the residual, by the same Pythagoras argument that made the projection onto a line the closest point. So at the minimum the residual is perpendicular to every direction available in the column space, which is every column: $\mathbf{A}^T(\mathbf{b} - \mathbf{A}\mathbf{x}) = \mathbf{0}$.
:::

::: check
A model matrix has condition number $\kappa(\mathbf{A}) = 3 \times 10^{5}$. Roughly how many significant digits can you expect in the least-squares solution via QR, and via the normal equations, in double precision?
:::

::: answer
Double precision carries about 16 digits. QR loses about $\log_{10}(3 \times 10^5) \approx 5.5$ digits, leaving roughly 10. The normal equations work with $\kappa(\mathbf{A}^T\mathbf{A}) = 9 \times 10^{10}$, losing about 11 digits and leaving roughly 5. For a navigation solution that needs millimetres out of thousands of kilometres — ten digits — only the QR route is acceptable.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\operatorname{proj}_{\mathbf{a}}(\mathbf{b}) = \dfrac{\mathbf{a}\cdot\mathbf{b}}{\mathbf{a}\cdot\mathbf{a}}\,\mathbf{a}$ | Projection onto a line; residual orthogonal to $\mathbf{a}$ |
| $\mathbf{P} = \mathbf{a}\mathbf{a}^T/(\mathbf{a}^T\mathbf{a})$ | Projection matrix: symmetric, $\mathbf{P}^2 = \mathbf{P}$, rank one |
| $\mathbf{q}_i\cdot\mathbf{q}_j = \delta_{ij}$ | Orthonormal set; automatically independent |
| $c_i = \mathbf{q}_i\cdot\mathbf{x}$ | Coordinates in an orthonormal basis are dot products |
| $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$ | Orthonormal columns; square case gives $\mathbf{Q}^{-1} = \mathbf{Q}^T$, $\det\mathbf{Q} = \pm 1$ |
| $\lVert\mathbf{Q}\mathbf{x}\rVert_2 = \lVert\mathbf{x}\rVert_2$, $(\mathbf{Q}\mathbf{x})\cdot(\mathbf{Q}\mathbf{y}) = \mathbf{x}\cdot\mathbf{y}$ | Orthogonal matrices preserve lengths and angles |
| $\mathbf{w}_k = \mathbf{a}_k - \sum_{j<k}(\mathbf{q}_j\cdot\mathbf{a}_k)\mathbf{q}_j$, $\mathbf{q}_k = \mathbf{w}_k/\lVert\mathbf{w}_k\rVert$ | Gram–Schmidt step |
| $\mathbf{A} = \mathbf{Q}\mathbf{R}$, $\mathbf{R} = \mathbf{Q}^T\mathbf{A}$ | QR factorisation; $\mathbf{R}$ upper triangular |
| $\mathbf{A}^T\mathbf{A}\mathbf{x} = \mathbf{A}^T\mathbf{b}$ | Normal equations; $\kappa(\mathbf{A}^T\mathbf{A}) = \kappa(\mathbf{A})^2$ |
| $\mathbf{R}\mathbf{x} = \mathbf{Q}^T\mathbf{b}$ | Least squares via QR; condition number not squared |

The next lesson applies orthogonal matrices to the problem they were made for: a $3 \times 3$ orthogonal matrix with determinant $+1$ is a rotation, and it is how the components of a vector in one reference frame become its components in another.
