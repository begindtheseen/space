---
id: l06-orthogonality-gram-schmidt-qr
title: Orthogonality, Gram–Schmidt and QR
minutes: 21
covers:
  - orthogonality, Gram-Schmidt, QR
---

Walk east and you get no closer to anything to the north. That is what "perpendicular" really means: moving along one direction does nothing at all along the other. Perpendicular directions do not interfere with each other. Mathematicians call perpendicular directions **orthogonal**, and this lesson is about three places that one idea pays off.

- **Reference frames** use three mutually perpendicular axes, so that a reading along one axis says nothing about the others.
- **[[Least squares|least-squares-history]]**, the standard way to fit a model to noisy data, works by making the leftover error perpendicular to everything the model can explain.
- **Trustworthy number-crunching.** The most reliable algorithms in navigation are built from matrices whose columns are perpendicular unit vectors, because such matrices cannot make errors grow.

The lesson starts with the **projection** of one vector onto another — the "shadow" of one arrow along another, promised in the first lesson. Then come orthonormal sets and the matrices made from them, **orthogonal matrices**, which keep every length and every angle; rotation matrices are the most important example. Finally comes **Gram–Schmidt**, a recipe that turns any independent set into a perpendicular one. Writing down its bookkeeping produces the **QR factorization**, $\mathbf{A} = \mathbf{Q}\mathbf{R}$.

QR is not a curiosity. It is how least-squares problems are solved in production code, and the **[[square-root Kalman filters|square-root-filter]]** flown where numerical toughness matters are built on it. Why — because a perpendicular-column matrix cannot amplify error — is the last thing this lesson explains.

## Projection onto a line

Picture the Sun directly overhead and a stick leaning at an angle. Its shadow on the ground is its projection: the part of the stick that lies along the ground. What is left over — from the shadow's tip straight up to the stick's tip — stands at right angles to the ground.

Now in symbols. Take a nonzero vector $\mathbf{a}$ (the ground direction) and any vector $\mathbf{b}$ (the stick). Split $\mathbf{b}$ into a part along $\mathbf{a}$ and a part perpendicular to it. The part along $\mathbf{a}$ is some multiple $\mathbf{p} = c\,\mathbf{a}$. It is the right multiple when what is left, $\mathbf{b} - c\,\mathbf{a}$, is perpendicular to $\mathbf{a}$ — its dot product with $\mathbf{a}$ is zero:

$$
(\mathbf{b} - c\,\mathbf{a})\cdot\mathbf{a} = 0 \quad\Longrightarrow\quad \mathbf{b}\cdot\mathbf{a} - c\,(\mathbf{a}\cdot\mathbf{a}) = 0 \quad\Longrightarrow\quad c = \frac{\mathbf{a}\cdot\mathbf{b}}{\mathbf{a}\cdot\mathbf{a}} .
$$

The first step spreads the dot product over the bracket. The second moves $c\,(\mathbf{a}\cdot\mathbf{a})$ across and divides. So the **[[projection|projection-shadow]]** of $\mathbf{b}$ onto $\mathbf{a}$, and the leftover part, called the **residual**, are

$$
\operatorname{proj}_{\mathbf{a}}(\mathbf{b}) = \frac{\mathbf{a}\cdot\mathbf{b}}{\mathbf{a}\cdot\mathbf{a}}\,\mathbf{a}, \qquad \mathbf{r} = \mathbf{b} - \operatorname{proj}_{\mathbf{a}}(\mathbf{b}), \qquad \mathbf{r}\cdot\mathbf{a} = 0 .
$$

Read $\operatorname{proj}_{\mathbf{a}}(\mathbf{b})$ as "the projection of b onto a".

If $\mathbf{a}$ is a unit vector $\hat{\mathbf{u}}$ ("u hat", length 1), the bottom is $1$ and the projection is $(\hat{\mathbf{u}}\cdot\mathbf{b})\,\hat{\mathbf{u}}$. That is the component along $\hat{\mathbf{u}}$ from the first lesson, turned back into an arrow.

### The shadow is the closest point

Because $\mathbf{p}$ and $\mathbf{r}$ are perpendicular, Pythagoras holds: $\|\mathbf{b}\|^2 = \|\mathbf{p}\|^2 + \|\mathbf{r}\|^2$. And the projection is the point on the line through $\mathbf{a}$ closest to $\mathbf{b}$. Take any other point $\mathbf{p}'$ on the line. The gap from $\mathbf{b}$ to $\mathbf{p}'$ is $\mathbf{r}$ plus a piece along the line, and those two are perpendicular, so

$$
\|\mathbf{b} - \mathbf{p}'\|^2 = \|\mathbf{r}\|^2 + \|\mathbf{p} - \mathbf{p}'\|^2 \ge \|\mathbf{r}\|^2 .
$$

Every other point is at least as far away. The foot of the perpendicular wins.

### The projection matrix

Projection is linear in $\mathbf{b}$, so it has a matrix. Write the dot product as a row times a column, $\mathbf{a}^T\mathbf{b}$, and regroup:

$$
\operatorname{proj}_{\mathbf{a}}(\mathbf{b}) = \mathbf{a}\,\frac{\mathbf{a}^T\mathbf{b}}{\mathbf{a}^T\mathbf{a}} = \left(\frac{\mathbf{a}\,\mathbf{a}^T}{\mathbf{a}^T\mathbf{a}}\right)\mathbf{b} = \mathbf{P}\,\mathbf{b} .
$$

The matrix $\mathbf{P} = \mathbf{a}\mathbf{a}^T / (\mathbf{a}^T\mathbf{a})$ is the **[[outer product|outer-product]]** of $\mathbf{a}$ with itself — a column times a row — scaled. Three facts about it:

- It is symmetric: $\mathbf{P}^T = \mathbf{P}$.
- Projecting twice is the same as projecting once. A shadow's shadow is the same shadow: $\mathbf{P}^2 = \mathbf{a}(\mathbf{a}^T\mathbf{a})\mathbf{a}^T / (\mathbf{a}^T\mathbf{a})^2 = \mathbf{P}$.
- Its rank is one, since every output is a multiple of $\mathbf{a}$. So it is singular, as anything that flattens space onto a line must be.

::: example Splitting a specific-force vector
An accelerometer's axis lies along $\mathbf{a} = (3, 4, 0)^T$ (not a unit vector), and the specific force is $\mathbf{b} = (2, 1, 5)^T\ \mathrm{m/s^2}$.

**Dot products.** $\mathbf{a}\cdot\mathbf{b} = 3 \cdot 2 + 4 \cdot 1 + 0 \cdot 5 = 6 + 4 + 0 = 10$ and $\mathbf{a}\cdot\mathbf{a} = 9 + 16 + 0 = 25$.

**Projection and residual.**

$$
\operatorname{proj}_{\mathbf{a}}(\mathbf{b}) = \frac{10}{25}\,(3, 4, 0)^T = (1.2, 1.6, 0)^T\ \mathrm{m/s^2}, \qquad \mathbf{r} = (2 - 1.2,\ 1 - 1.6,\ 5 - 0)^T = (0.8, -0.6, 5)^T\ \mathrm{m/s^2}.
$$

**Check perpendicular:** $\mathbf{r}\cdot\mathbf{a} = 0.8 \cdot 3 + (-0.6) \cdot 4 + 5 \cdot 0 = 2.4 - 2.4 + 0 = 0$. Good.

**What the sensor sees.** Along its axis, $\|\mathbf{p}\| = \sqrt{1.44 + 2.56} = 2\ \mathrm{m/s^2}$. That matches $\mathbf{b}\cdot\hat{\mathbf{a}} = 10/5 = 2$, since $\|\mathbf{a}\| = 5$. The sensor is blind to the residual, of size $\sqrt{0.64 + 0.36 + 25} = \sqrt{26} \approx 5.10\ \mathrm{m/s^2}$.

**Pythagoras check:** $2^2 + 26 = 30$, and $\|\mathbf{b}\|^2 = 4 + 1 + 25 = 30$. The pieces add up.
:::

::: key Projection
$\operatorname{proj}_{\mathbf{a}}(\mathbf{b}) = \dfrac{\mathbf{a}\cdot\mathbf{b}}{\mathbf{a}\cdot\mathbf{a}}\,\mathbf{a}$. The residual $\mathbf{b} - \operatorname{proj}_{\mathbf{a}}(\mathbf{b})$ is orthogonal to $\mathbf{a}$, and the projection is the closest point to $\mathbf{b}$ on the line through $\mathbf{a}$. Making the residual orthogonal to what the model can produce is the whole idea behind least squares.
:::

## Orthonormal sets and orthogonal matrices

A set of vectors is **orthogonal** if every pair has zero dot product. It is **orthonormal** if, in addition, each has length 1 — "ortho" for perpendicular, "normal" for unit length. In symbols,

$$
\mathbf{q}_i\cdot\mathbf{q}_j = \delta_{ij} = \begin{cases} 1 & i = j \\ 0 & i \ne j . \end{cases}
$$

The symbol $\delta_{ij}$, read "delta i j", is the **[[Kronecker delta|kronecker-delta]]**: $1$ when the two labels match and $0$ when they differ.

### Perpendicular means independent

An orthogonal set of nonzero vectors is automatically linearly independent. Take any combination that gives zero, $\sum_j c_j\mathbf{q}_j = \mathbf{0}$, and dot both sides with $\mathbf{q}_i$. Every term but one vanishes, leaving $c_i\,(\mathbf{q}_i\cdot\mathbf{q}_i) = 0$. Since $\mathbf{q}_i$ is not zero, $c_i = 0$. That works for every $i$.

So $n$ orthonormal vectors in $\mathbb{R}^n$ form a basis, an **orthonormal basis**, and its coordinates cost almost nothing to find. If $\mathbf{x} = \sum_j c_j\mathbf{q}_j$, dot both sides with $\mathbf{q}_i$ to get

$$
c_i = \mathbf{q}_i\cdot\mathbf{x} .
$$

No system of equations to solve: each coordinate is one dot product, independent of the others. The axes $\hat{\mathbf{x}}, \hat{\mathbf{y}}, \hat{\mathbf{z}}$ of a reference frame are an orthonormal basis. The components of a vector in that frame are its dot products with the axes — exactly what three single-axis sensors along the axes would measure.

### Orthogonal matrices

Stack orthonormal vectors side by side as the columns of a matrix $\mathbf{Q}$. Entry $(i, j)$ of $\mathbf{Q}^T\mathbf{Q}$ is row $i$ of $\mathbf{Q}^T$ dotted with column $j$ of $\mathbf{Q}$. But row $i$ of $\mathbf{Q}^T$ is column $i$ of $\mathbf{Q}$. So the entry is $\mathbf{q}_i\cdot\mathbf{q}_j = \delta_{ij}$: ones on the diagonal, zeros elsewhere.

$$
\mathbf{Q}^T\mathbf{Q} = \mathbf{I} .
$$

This holds for any $m \times n$ matrix with orthonormal columns, square or not. When $\mathbf{Q}$ is square, $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$ says $\mathbf{Q}^T$ undoes $\mathbf{Q}$ from the left, and for square matrices that makes it the inverse. So $\mathbf{Q}^{-1} = \mathbf{Q}^T$, and also $\mathbf{Q}\mathbf{Q}^T = \mathbf{I}$: the rows are orthonormal too. A square matrix with orthonormal columns is called an **orthogonal matrix**. (The name is a little off — "orthonormal matrix" would be better — but it stuck.)

An orthogonal matrix keeps the dot product, and with it every length and every angle:

$$
(\mathbf{Q}\mathbf{x})\cdot(\mathbf{Q}\mathbf{y}) = (\mathbf{Q}\mathbf{x})^T(\mathbf{Q}\mathbf{y}) = \mathbf{x}^T\mathbf{Q}^T\mathbf{Q}\,\mathbf{y} = \mathbf{x}^T\mathbf{y} = \mathbf{x}\cdot\mathbf{y}, \qquad \|\mathbf{Q}\mathbf{x}\|_2 = \|\mathbf{x}\|_2 .
$$

Step by step: write the dot product as a row times a column; use $(\mathbf{Q}\mathbf{x})^T = \mathbf{x}^T\mathbf{Q}^T$; replace $\mathbf{Q}^T\mathbf{Q}$ by $\mathbf{I}$. The length result is the case $\mathbf{y} = \mathbf{x}$, since $\|\mathbf{x}\|_2^2 = \mathbf{x}\cdot\mathbf{x}$.

Two more facts. Taking determinants of $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$ gives $(\det\mathbf{Q})^2 = 1$, so $\det\mathbf{Q} = \pm 1$: an orthogonal matrix is a rotation ($+1$) or a rotation combined with a reflection ($-1$). And products of orthogonal matrices are orthogonal, since $(\mathbf{Q}_1\mathbf{Q}_2)^T(\mathbf{Q}_1\mathbf{Q}_2) = \mathbf{Q}_2^T\mathbf{Q}_1^T\mathbf{Q}_1\mathbf{Q}_2 = \mathbf{Q}_2^T\mathbf{Q}_2 = \mathbf{I}$. So is the inverse.

Two consequences run through the whole curriculum.

- **Physically:** a change of reference frame is an orthogonal matrix. So a vehicle's speed, the size of a torque and the angle between two **[[boresights|boresight]]** are the same numbers in every frame.
- **Numerically:** a matrix that changes no lengths cannot magnify an error. Multiplying data by an orthogonal matrix is the one linear operation guaranteed not to make round-off worse. That is why stable algorithms are built from orthogonal pieces.

::: key What an orthogonal matrix preserves
If $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$ then $\|\mathbf{Q}\mathbf{x}\|_2 = \|\mathbf{x}\|_2$ and $(\mathbf{Q}\mathbf{x})\cdot(\mathbf{Q}\mathbf{y}) = \mathbf{x}\cdot\mathbf{y}$: lengths and angles are unchanged. For a square $\mathbf{Q}$, $\mathbf{Q}^{-1} = \mathbf{Q}^T$ and $\det\mathbf{Q} = \pm 1$. This is why changing frames never changes a physical magnitude.
:::

## Gram–Schmidt: manufacturing an orthonormal basis

Suppose you have independent vectors $\mathbf{a}_1, \dots, \mathbf{a}_n$ that are not perpendicular — three sensor axes mounted at odd angles, say, or the columns of a model matrix. You want an orthonormal set $\mathbf{q}_1, \dots, \mathbf{q}_n$ that spans the same space. Projection does it one vector at a time. The idea: take each new vector, cut off its shadow on every direction you already have, and keep what is left.

**First vector.** Scale it to length 1: $\mathbf{q}_1 = \mathbf{a}_1 / \|\mathbf{a}_1\|$.

**Second vector.** Remove from $\mathbf{a}_2$ its shadow along $\mathbf{q}_1$, then scale what is left to length 1:

$$
\mathbf{w}_2 = \mathbf{a}_2 - (\mathbf{q}_1\cdot\mathbf{a}_2)\,\mathbf{q}_1, \qquad \mathbf{q}_2 = \frac{\mathbf{w}_2}{\|\mathbf{w}_2\|} .
$$

The residual of a projection is perpendicular to the direction projected onto, so $\mathbf{w}_2 \perp \mathbf{q}_1$ (read "$\mathbf{w}_2$ is perpendicular to $\mathbf{q}_1$"). And $\mathbf{w}_2 \ne \mathbf{0}$, because $\mathbf{a}_2$ is not a multiple of $\mathbf{a}_1$.

**Every later vector.** Subtract from $\mathbf{a}_k$ its shadows on all the unit vectors found so far:

$$
\mathbf{w}_k = \mathbf{a}_k - \sum_{j < k} (\mathbf{q}_j\cdot\mathbf{a}_k)\,\mathbf{q}_j, \qquad \mathbf{q}_k = \frac{\mathbf{w}_k}{\|\mathbf{w}_k\|} .
$$

This is the **[[Gram–Schmidt process|gram-schmidt-picture]]**.

::: note Why it has to be true
**Each $\mathbf{w}_k$ is perpendicular to every earlier $\mathbf{q}_i$.** Dot $\mathbf{w}_k$ with $\mathbf{q}_i$. In the sum, only the $j = i$ term survives, because the earlier $\mathbf{q}_j$ are already perpendicular to one another. That leaves $\mathbf{q}_i\cdot\mathbf{a}_k - (\mathbf{q}_i\cdot\mathbf{a}_k)(\mathbf{q}_i\cdot\mathbf{q}_i) = \mathbf{q}_i\cdot\mathbf{a}_k - \mathbf{q}_i\cdot\mathbf{a}_k = 0$, using $\mathbf{q}_i\cdot\mathbf{q}_i = 1$.

**No $\mathbf{w}_k$ is zero.** $\mathbf{a}_k$ is not in the span of $\mathbf{a}_1, \dots, \mathbf{a}_{k-1}$, which is the same as the span of $\mathbf{q}_1, \dots, \mathbf{q}_{k-1}$. So taking away pieces along those directions can never use up all of $\mathbf{a}_k$.
:::

Gram–Schmidt keeps the nesting. $\mathbf{q}_1$ spans the same line as $\mathbf{a}_1$. $\mathbf{q}_1, \mathbf{q}_2$ span the same plane as $\mathbf{a}_1, \mathbf{a}_2$. And so on. If some $\mathbf{w}_k$ comes out zero, the input vectors were dependent — so Gram–Schmidt is also a test of independence.

::: example Orthonormalizing three vectors
Apply Gram–Schmidt to $\mathbf{a}_1 = (1, 1, 0)^T$, $\mathbf{a}_2 = (1, 0, 1)^T$, $\mathbf{a}_3 = (0, 1, 1)^T$.

**Step 1.** $\|\mathbf{a}_1\| = \sqrt{1 + 1 + 0} = \sqrt{2}$, so $\mathbf{q}_1 = (1, 1, 0)^T/\sqrt{2} = (0.7071, 0.7071, 0)^T$.

**Step 2.** The shadow coefficient is $\mathbf{q}_1\cdot\mathbf{a}_2 = 0.7071 \cdot 1 + 0.7071 \cdot 0 + 0 \cdot 1 = 0.7071$. Remove the shadow:

$$
\mathbf{w}_2 = (1, 0, 1)^T - 0.7071\,(0.7071, 0.7071, 0)^T = (1, 0, 1)^T - (0.5, 0.5, 0)^T = (0.5, -0.5, 1)^T .
$$

Its length is $\sqrt{0.25 + 0.25 + 1} = \sqrt{1.5} = 1.2247$, so $\mathbf{q}_2 = (0.4082, -0.4082, 0.8165)^T$.

**Step 3.** Two shadow coefficients: $\mathbf{q}_1\cdot\mathbf{a}_3 = 0 + 0.7071 + 0 = 0.7071$ and $\mathbf{q}_2\cdot\mathbf{a}_3 = 0 - 0.4082 + 0.8165 = 0.4082$. Remove both shadows:

$$
\begin{aligned}
\mathbf{w}_3 &= (0, 1, 1)^T - 0.7071\,(0.7071, 0.7071, 0)^T - 0.4082\,(0.4082, -0.4082, 0.8165)^T \\
&= (0, 1, 1)^T - (0.5, 0.5, 0)^T - (0.1667, -0.1667, 0.3333)^T = (-0.6667, 0.6667, 0.6667)^T .
\end{aligned}
$$

Its length is $\sqrt{3 \times 0.4444} = 1.1547$, so $\mathbf{q}_3 = (-0.5774, 0.5774, 0.5774)^T = (-1, 1, 1)^T/\sqrt{3}$.

**Check:** $\mathbf{q}_1\cdot\mathbf{q}_3 = (-0.5774 + 0.5774 + 0)/\sqrt{2} = 0$, and $\mathbf{q}_2\cdot\mathbf{q}_3 = (-0.4082 - 0.4082 + 0.8165) \times 0.5774 = 0$ to the precision shown. The three unit vectors are mutually perpendicular and span $\mathbb{R}^3$, and the matrix with them as columns is orthogonal.
:::

## The QR factorization

Gram–Schmidt built each $\mathbf{q}_k$ out of $\mathbf{a}_k$ and the earlier $\mathbf{q}$'s. Now turn that around and write each $\mathbf{a}_k$ in terms of the $\mathbf{q}$'s. Since $\mathbf{w}_k = \|\mathbf{w}_k\|\,\mathbf{q}_k$, moving the sum to the other side of the Gram–Schmidt formula gives

$$
\mathbf{a}_k = \sum_{j < k} (\mathbf{q}_j\cdot\mathbf{a}_k)\,\mathbf{q}_j + \|\mathbf{w}_k\|\,\mathbf{q}_k .
$$

Give the coefficients names: $r_{jk} = \mathbf{q}_j\cdot\mathbf{a}_k$ for $j < k$, and $r_{kk} = \|\mathbf{w}_k\|$. Then $\mathbf{a}_k = \sum_{j \le k} r_{jk}\,\mathbf{q}_j$. In words: column $k$ of $\mathbf{A}$ is the matrix $\mathbf{Q} = [\mathbf{q}_1 \cdots \mathbf{q}_n]$ times a column of coefficients whose entries below position $k$ are zero. Put all the columns together:

$$
\mathbf{A} = \mathbf{Q}\mathbf{R}, \qquad \mathbf{Q}^T\mathbf{Q} = \mathbf{I}, \qquad \mathbf{R} = \begin{pmatrix} r_{11} & r_{12} & \cdots & r_{1n} \\ 0 & r_{22} & \cdots & r_{2n} \\ \vdots & & \ddots & \vdots \\ 0 & 0 & \cdots & r_{nn} \end{pmatrix}.
$$

This is the **QR factorization**. An $m \times n$ matrix with independent columns is the product of:

- an $m \times n$ matrix $\mathbf{Q}$ with orthonormal columns — an orthonormal basis for the column space of $\mathbf{A}$;
- an $n \times n$ upper-triangular $\mathbf{R}$ with positive diagonal, which records how each original column is built from that basis.

$\mathbf{R}$ is triangular because Gram–Schmidt only ever looks backward: $\mathbf{a}_k$ uses $\mathbf{q}_1$ to $\mathbf{q}_k$ and nothing later. And since $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$, multiplying $\mathbf{A} = \mathbf{Q}\mathbf{R}$ on the left by $\mathbf{Q}^T$ recovers $\mathbf{R} = \mathbf{Q}^T\mathbf{A}$.

::: example QR of a line-fit matrix
A **[[radar|radar-range]]** reports the range (distance) to a target at $t = 1, 2, 3\ \mathrm{s}$. The model is a straight line, $\rho(t) = x_1 + x_2 t$ ($\rho$ is "rho", the range; $x_1$ is the starting range and $x_2$ the rate). The model matrix has a column of ones and a column of times:

$$
\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & 2 \\ 1 & 3 \end{pmatrix}.
$$

**First column.** $r_{11} = \|\mathbf{a}_1\| = \sqrt{3} = 1.7321$ and $\mathbf{q}_1 = (1, 1, 1)^T/\sqrt{3}$.

**Second column.** $r_{12} = \mathbf{q}_1\cdot\mathbf{a}_2 = (1 + 2 + 3)/\sqrt{3} = 6/\sqrt{3} = 2\sqrt{3} = 3.4641$. Remove the shadow:

$$
\mathbf{w}_2 = (1, 2, 3)^T - 2\sqrt{3}\,\frac{(1, 1, 1)^T}{\sqrt{3}} = (1, 2, 3)^T - (2, 2, 2)^T = (-1, 0, 1)^T ,
$$

so $r_{22} = \sqrt{2} = 1.4142$ and $\mathbf{q}_2 = (-1, 0, 1)^T/\sqrt{2}$. Therefore

$$
\mathbf{Q} = \begin{pmatrix} 0.5774 & -0.7071 \\ 0.5774 & 0 \\ 0.5774 & 0.7071 \end{pmatrix}, \qquad \mathbf{R} = \begin{pmatrix} 1.7321 & 3.4641 \\ 0 & 1.4142 \end{pmatrix}.
$$

**Check** the second column of $\mathbf{Q}\mathbf{R}$: $3.4641\,\mathbf{q}_1 + 1.4142\,\mathbf{q}_2 = (2, 2, 2)^T + (-1, 0, 1)^T = (1, 2, 3)^T$. Correct.

**Reading it.** The first column of $\mathbf{Q}$ is the direction "same value at every time". The second is the direction "steady trend", made perpendicular to the first — which is why it is centered on the middle time, $-1$, $0$, $+1$.
:::

### Least squares through QR

Suppose $\mathbf{A}\mathbf{x} = \mathbf{b}$ has more equations than unknowns — three ranges, two line parameters — and no exact solution, because $\mathbf{b}$ is not in the column space of $\mathbf{A}$. Three noisy points rarely lie on one straight line. The **least-squares** solution makes the residual length $\|\mathbf{b} - \mathbf{A}\mathbf{x}\|_2$ as small as possible.

The projection picture tells you where the best answer is. Stretch "projection onto a line" to "projection onto the column space": the best $\mathbf{A}\mathbf{x}$ is the shadow of $\mathbf{b}$ on the column space, and the residual $\mathbf{b} - \mathbf{A}\mathbf{x}$ is perpendicular to every column of $\mathbf{A}$. Stacking "column dotted with residual equals zero" for all the columns gives

$$
\mathbf{A}^T(\mathbf{b} - \mathbf{A}\mathbf{x}) = \mathbf{0} \quad\Longrightarrow\quad \mathbf{A}^T\mathbf{A}\,\mathbf{x} = \mathbf{A}^T\mathbf{b} .
$$

These are the **normal equations** ("normal" is an old word for perpendicular). Now put in $\mathbf{A} = \mathbf{Q}\mathbf{R}$:

- the left side becomes $\mathbf{R}^T\mathbf{Q}^T\mathbf{Q}\mathbf{R}\,\mathbf{x} = \mathbf{R}^T\mathbf{R}\,\mathbf{x}$, because $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$;
- the right side becomes $\mathbf{R}^T\mathbf{Q}^T\mathbf{b}$.

$\mathbf{R}^T$ is triangular with a nonzero diagonal, so it is invertible, and it cancels from both sides:

$$
\mathbf{R}\,\mathbf{x} = \mathbf{Q}^T\mathbf{b} .
$$

That is one matrix–vector product and one back substitution.

**Continuing the radar example** with measured ranges $\mathbf{b} = (2.1, 3.9, 6.2)^T\ \mathrm{m}$:

1. $\mathbf{Q}^T\mathbf{b} = \big((2.1 + 3.9 + 6.2)/\sqrt{3},\ (6.2 - 2.1)/\sqrt{2}\big)^T = (12.2/1.7321,\ 4.1/1.4142)^T = (7.0437, 2.8991)^T$.
2. Bottom row: $1.4142\,x_2 = 2.8991$, so $x_2 = 2.05$.
3. Top row: $1.7321\,x_1 + 3.4641 \times 2.05 = 7.0437$, so $x_1 = (7.0437 - 7.1014)/1.7321 = -0.0333$.

The fitted line is $\rho(t) = -0.033 + 2.05\,t$ m: the target is moving away at $2.05\ \mathrm{m/s}$.

**Check the geometry.** The residual is $\mathbf{b} - \mathbf{A}\mathbf{x} = (0.083, -0.167, 0.083)^T$ m. Its dot product with the column of ones is $0.083 - 0.167 + 0.083 = 0$, and with the column of times it is $0.083 - 0.333 + 0.250 = 0$, as the perpendicular condition demands.

The normal equations give the same answer — $\mathbf{A}^T\mathbf{A} = \begin{pmatrix} 3 & 6 \\ 6 & 14 \end{pmatrix}$, $\mathbf{A}^T\mathbf{b} = (12.2, 28.5)^T$, solution $(-0.0333, 2.05)^T$. But for the reason explained next, they are the wrong way to get it in code.

### Why QR and not the normal equations

Every matrix stretches some input directions more than others. The ratio of its largest stretch to its smallest is its **[[condition number|condition-picture]]**, $\kappa(\mathbf{A})$ ("kappa of A"). It is the factor by which relative errors in the data can be magnified into relative errors in the answer. (Linear Algebra II computes it from the singular values; here only the idea is needed.) In double precision you have about 16 significant digits, and a problem with $\kappa = 10^{8}$ can lose 8 of them.

Forming $\mathbf{A}^T\mathbf{A}$ squares the stretches — the largest becomes largest squared, the smallest becomes smallest squared. So

$$
\kappa(\mathbf{A}^T\mathbf{A}) = \kappa(\mathbf{A})^2 .
$$

A model matrix with $\kappa = 10^8$, which QR handles with 8 digits to spare, becomes a normal-equation matrix with $\kappa = 10^{16}$, and the answer is noise.

QR never squares anything. Multiplying by $\mathbf{Q}^T$ keeps the 2-norm, so it adds no magnification. And the triangular system $\mathbf{R}\mathbf{x} = \mathbf{Q}^T\mathbf{b}$ has $\kappa(\mathbf{R}) = \kappa(\mathbf{A})$ exactly, because $\mathbf{R} = \mathbf{Q}^T\mathbf{A}$ and an orthogonal factor changes no lengths. That is why `numpy.linalg.lstsq` and every serious least-squares routine go through an orthogonal factorization. It is also why square-root Kalman filters carry a triangular factor of the covariance, updated with QR, instead of the covariance itself.

::: key The QR factorization
$\mathbf{A} = \mathbf{Q}\mathbf{R}$ with $\mathbf{Q}$ having orthonormal columns ($\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$) and $\mathbf{R}$ upper triangular. $\mathbf{Q}$ comes from Gram–Schmidt on the columns of $\mathbf{A}$; $\mathbf{R} = \mathbf{Q}^T\mathbf{A}$. Least squares becomes $\mathbf{R}\mathbf{x} = \mathbf{Q}^T\mathbf{b}$, and because $\mathbf{Q}$ preserves the 2-norm this avoids squaring the condition number, which the normal equations $\mathbf{A}^T\mathbf{A}\mathbf{x} = \mathbf{A}^T\mathbf{b}$ do.
:::

::: warning Classical Gram–Schmidt loses orthogonality in floating point
Computing all the shadows of $\mathbf{a}_k$ from the original $\mathbf{a}_k$, as written above, lets round-off in one subtraction spoil the next. For nearly dependent inputs the resulting $\mathbf{q}$'s can be far from perpendicular. **Modified Gram–Schmidt** subtracts the shadows one at a time from the running $\mathbf{w}_k$ — project the current remainder, not the original vector — and is much better. Library QR uses **[[Householder reflections|householder]]**, which stay orthogonal to within round-off. `numpy.linalg.qr` returns $\mathbf{Q}$ and $\mathbf{R}$ computed that way. Do not hand-roll Gram–Schmidt for anything that matters.
:::

::: warning Orthonormal columns do not make a matrix square
An $m \times n$ matrix $\mathbf{Q}$ with $m > n$ can have $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}_n$ while $\mathbf{Q}\mathbf{Q}^T \ne \mathbf{I}_m$. The second product is the projection matrix onto the column space, not the identity. Only a square $\mathbf{Q}$ has $\mathbf{Q}^{-1} = \mathbf{Q}^T$.
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
$\mathbf{a}\cdot\mathbf{b} = 1 \cdot 4 + (-1) \cdot 2 + 2 \cdot (-1) = 4 - 2 - 2 = 0$. So the projection is $\frac{0}{6}\,\mathbf{a} = \mathbf{0}$: $\mathbf{b}$ is already perpendicular to $\mathbf{a}$.

The residual is then $\mathbf{b}$ itself, and $\mathbf{b}\cdot\mathbf{a} = 0$ is the calculation you already did. A zero projection means the two directions do not interfere at all — $\mathbf{b}$ casts no shadow along $\mathbf{a}$.
:::

::: check
The columns of $\mathbf{Q} = \begin{pmatrix} 0.6 & -0.8 \\ 0.8 & 0.6 \end{pmatrix}$ are claimed to be orthonormal. Verify, state $\mathbf{Q}^{-1}$ without solving anything, and find $\|\mathbf{Q}\mathbf{x}\|$ for $\mathbf{x} = (3, 4)^T$ without forming $\mathbf{Q}\mathbf{x}$.
:::

::: answer
**Lengths:** $0.6^2 + 0.8^2 = 0.36 + 0.64 = 1$ for the first column, and $(-0.8)^2 + 0.6^2 = 1$ for the second.

**Perpendicular:** $0.6 \times (-0.8) + 0.8 \times 0.6 = -0.48 + 0.48 = 0$.

So $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$, and $\mathbf{Q}^{-1} = \mathbf{Q}^T = \begin{pmatrix} 0.6 & 0.8 \\ -0.8 & 0.6 \end{pmatrix}$.

An orthogonal matrix keeps lengths, so $\|\mathbf{Q}\mathbf{x}\| = \|\mathbf{x}\| = \sqrt{9 + 16} = 5$. (It is a rotation: $\det\mathbf{Q} = 0.36 + 0.64 = +1$.)
:::

::: check
Run Gram–Schmidt on $\mathbf{a}_1 = (2, 0, 0)^T$ and $\mathbf{a}_2 = (1, 3, 0)^T$, and write the resulting $\mathbf{Q}$ and $\mathbf{R}$.
:::

::: answer
**First:** $r_{11} = \|\mathbf{a}_1\| = 2$ and $\mathbf{q}_1 = (1, 0, 0)^T$.

**Second:** $r_{12} = \mathbf{q}_1\cdot\mathbf{a}_2 = 1$. Then $\mathbf{w}_2 = (1, 3, 0)^T - 1\,(1, 0, 0)^T = (0, 3, 0)^T$, so $r_{22} = 3$ and $\mathbf{q}_2 = (0, 1, 0)^T$.

So $\mathbf{Q} = \begin{pmatrix} 1 & 0 \\ 0 & 1 \\ 0 & 0 \end{pmatrix}$ and $\mathbf{R} = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}$.

**Check:** the columns of $\mathbf{Q}\mathbf{R}$ are $2\,\mathbf{q}_1 = (2, 0, 0)^T$ and $1\,\mathbf{q}_1 + 3\,\mathbf{q}_2 = (1, 3, 0)^T$. Correct.
:::

::: check
Why does the residual of a least-squares fit have to be orthogonal to every column of $\mathbf{A}$? Argue from the projection picture, not from calculus.
:::

::: answer
The set of all $\mathbf{A}\mathbf{x}$ is the column space, a subspace. The closest point of a subspace to $\mathbf{b}$ is the foot of the perpendicular from $\mathbf{b}$.

Suppose the residual had some component along a column. Then moving $\mathbf{A}\mathbf{x}$ a little in that direction would shorten the residual — the same Pythagoras argument that made the projection onto a line the closest point. So at the best fit the residual has no component along any direction in the column space, which includes every column: $\mathbf{A}^T(\mathbf{b} - \mathbf{A}\mathbf{x}) = \mathbf{0}$.
:::

::: check
A model matrix has condition number $\kappa(\mathbf{A}) = 3 \times 10^{5}$. Roughly how many significant digits can you expect in the least-squares solution via QR, and via the normal equations, in double precision?
:::

::: answer
Double precision carries about 16 digits.

**QR** loses about $\log_{10}(3 \times 10^5) \approx 5.5$ digits, leaving roughly 10.

**The normal equations** work with $\kappa(\mathbf{A}^T\mathbf{A}) = (3 \times 10^5)^2 = 9 \times 10^{10}$. That loses about 11 digits, leaving roughly 5.

For a navigation solution that needs millimeters out of thousands of kilometers — about ten digits — only the QR route is good enough.
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
| $\mathbf{A} = \mathbf{Q}\mathbf{R}$, $\mathbf{R} = \mathbf{Q}^T\mathbf{A}$ | QR factorization; $\mathbf{R}$ upper triangular |
| $\mathbf{A}^T\mathbf{A}\mathbf{x} = \mathbf{A}^T\mathbf{b}$ | Normal equations; $\kappa(\mathbf{A}^T\mathbf{A}) = \kappa(\mathbf{A})^2$ |
| $\mathbf{R}\mathbf{x} = \mathbf{Q}^T\mathbf{b}$ | Least squares via QR; condition number not squared |

The next lesson puts orthogonal matrices to the job they were made for. A $3 \times 3$ orthogonal matrix with determinant $+1$ is a rotation, and it is how the components of a vector in one reference frame become its components in another.

::: context least-squares-history A race to publish
The French mathematician Adrien-Marie Legendre published the method of least squares in 1805, as a way to fit orbits of comets. Carl Friedrich Gauss published his own account in 1809 and said he had been using it since 1795 — including, in 1801, to predict where the newly found and then lost dwarf planet Ceres would reappear. It did reappear close to where he said.

Two centuries later, the same idea — choose the answer whose leftover error is smallest — sits at the heart of orbit determination and every navigation filter.
:::

::: context square-root-filter Filters that carry a square root
A Kalman filter's covariance matrix must stay symmetric with no negative "sizes" of doubt. With short computer numbers, rounding can quietly break that, and the filter then goes badly wrong.

A square-root filter carries a triangular matrix $\mathbf{S}$ with $\mathbf{S}\mathbf{S}^T$ equal to the covariance, and updates $\mathbf{S}$ with orthogonal steps such as QR. The product $\mathbf{S}\mathbf{S}^T$ can never go negative, and the entries of $\mathbf{S}$ span only about half as many powers of ten as the covariance does. James Potter devised the first square-root form in the early 1960s, during work on Apollo navigation, where the onboard computer's short words made this robustness worth having.
:::

::: context projection-shadow The shadow and the leftover
Here $\mathbf{a} = (3, 1)$ and $\mathbf{b} = (1, 2)$. Then $\mathbf{a}\cdot\mathbf{b} = 5$ and $\mathbf{a}\cdot\mathbf{a} = 10$, so the projection is $\tfrac{5}{10}\,(3, 1) = (1.5, 0.5)$ and the residual is $(-0.5, 1.5)$. The residual meets the line of $\mathbf{a}$ at a right angle: $(-0.5)(3) + (1.5)(1) = 0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="pj-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
    <marker id="pj-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="pj-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
  </defs>
  <line x1="40" y1="170" x2="280" y2="90" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="170" x2="220" y2="110" stroke="#1f2a44" stroke-width="2" marker-end="url(#pj-k)"/>
  <line x1="40" y1="170" x2="100" y2="50" stroke="#1f2a44" stroke-width="2" marker-end="url(#pj-k)"/>
  <line x1="40" y1="170" x2="130" y2="140" stroke="#1d6fd1" stroke-width="4" marker-end="url(#pj-b)"/>
  <line x1="130" y1="140" x2="100" y2="50" stroke="#b4232c" stroke-width="2.5" marker-end="url(#pj-r)"/>
  <polyline points="120.5,143.2 117.4,133.7 126.8,130.5" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <g font-size="12">
    <text x="224" y="108" fill="#1f2a44">a</text>
    <text x="80" y="46" fill="#1f2a44">b</text>
    <text x="96" y="168" fill="#1d6fd1">proj = (1.5, 0.5)</text>
    <text x="122" y="84" fill="#b4232c">r = (−0.5, 1.5)</text>
  </g>
</svg>
```

The blue shadow is the closest point to $\mathbf{b}$ anywhere on the dashed line.
:::

::: context outer-product Column times row
A row times a column, $\mathbf{a}^T\mathbf{b}$, gives one number — the dot product, or inner product. Turn it round, a column times a row, and you get a whole matrix: the **outer product** $\mathbf{a}\mathbf{b}^T$, whose entry $(i, j)$ is $a_i b_j$.

For $\mathbf{a} = (1, 2)^T$, $\mathbf{a}\mathbf{a}^T = \begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix}$. Every row is a multiple of $(1, 2)$, so its rank is one. Divide by $\mathbf{a}^T\mathbf{a} = 5$ and it becomes the matrix that projects onto the line through $(1, 2)$.
:::

::: context kronecker-delta A switch with two labels
The Kronecker delta is named after the German mathematician Leopold Kronecker. It is a tiny on-off switch: $\delta_{ij}$ is $1$ when $i$ and $j$ are the same and $0$ when they differ. So $\delta_{22} = 1$ and $\delta_{23} = 0$.

Written out as a table, the deltas form the identity matrix: ones down the diagonal, zeros everywhere else. That is why "$\mathbf{q}_i\cdot\mathbf{q}_j = \delta_{ij}$ for every pair" and "$\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$" are the same statement.
:::

::: context boresight Which way a sensor looks
A sensor's **boresight** is the direction it looks straight down — the center line of a camera, a star tracker or an antenna. The word comes from gunmaking, where it meant sighting straight down the bore of a barrel.

Engineers often care about the angle between two boresights, for example to keep a star tracker's view well away from the Sun. Because rotations keep angles, that angle comes out the same in whichever frame you compute it.
:::

::: context gram-schmidt-picture One step, drawn
Take $\mathbf{a}_1 = (2, 0)$ and $\mathbf{a}_2 = (1, 1.5)$. First $\mathbf{q}_1 = (1, 0)$. The shadow of $\mathbf{a}_2$ on it has length $\mathbf{q}_1\cdot\mathbf{a}_2 = 1$. Cut it off and $\mathbf{w}_2 = (0, 1.5)$ is left, standing straight up. Scale it to length 1 and $\mathbf{q}_2 = (0, 1)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="gs-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#6c7a93"/></marker>
    <marker id="gs-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="gs-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
  </defs>
  <line x1="40" y1="170" x2="180" y2="170" stroke="#6c7a93" stroke-width="2" marker-end="url(#gs-k)"/>
  <line x1="40" y1="170" x2="110" y2="65" stroke="#6c7a93" stroke-width="2" marker-end="url(#gs-k)"/>
  <line x1="40" y1="170" x2="110" y2="170" stroke="#1d6fd1" stroke-width="4" marker-end="url(#gs-b)"/>
  <line x1="40" y1="170" x2="40" y2="100" stroke="#1d6fd1" stroke-width="4" marker-end="url(#gs-b)"/>
  <line x1="110" y1="170" x2="110" y2="65" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 3" marker-end="url(#gs-r)"/>
  <polyline points="110,160 100,160 100,170" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <g font-size="12">
    <text x="184" y="174" fill="#6c7a93">a₁</text>
    <text x="114" y="62" fill="#6c7a93">a₂</text>
    <text x="64" y="188" fill="#1d6fd1">q₁ (shadow of a₂)</text>
    <text x="14" y="96" fill="#1d6fd1">q₂</text>
    <text x="118" y="120" fill="#b4232c">w₂ = a₂ − shadow</text>
    <text x="210" y="40" fill="#1f2a44">Gram (1883) and</text>
    <text x="210" y="56" fill="#1f2a44">Schmidt (1907)</text>
  </g>
</svg>
```

The method is named after the Danish mathematician Jørgen Pedersen Gram and the German mathematician Erhard Schmidt, who published versions of it in 1883 and 1907.
:::

::: context radar-range How a radar measures range
A radar sends out a pulse of radio waves and times the echo. Radio travels at the speed of light, about $3 \times 10^8\,\mathrm{m/s}$, and the pulse goes out and back, so the range is the speed of light times the echo time, divided by two. An echo after one millionth of a second means a target about $150\,\mathrm{m}$ away.

Each timing is a little noisy, so a string of ranges never lies exactly on a line — which is why fitting one is a least-squares problem.
:::

::: context condition-picture A circle squashed into a thin ellipse
Feed every unit-length arrow into a matrix and the outputs trace an ellipse. The condition number is the long half-axis divided by the short one. Here the matrix stretches one direction by 3 and squeezes the other to 0.5, so $\kappa = 3 / 0.5 = 6$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="70" cy="85" r="30" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="85" x2="145" y2="85" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="152,85 142,80 142,90" fill="#1f2a44"/>
  <ellipse cx="250" cy="85" rx="90" ry="15" fill="#f2b880" fill-opacity="0.6" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="250" y1="85" x2="340" y2="85" stroke="#b4232c" stroke-width="2"/>
  <line x1="250" y1="85" x2="250" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="12" fill="#1f2a44">
    <text x="70" y="135" text-anchor="middle">unit circle</text>
    <text x="295" y="120" text-anchor="middle" fill="#b4232c">long half-axis 3</text>
    <text x="250" y="60" text-anchor="middle" fill="#1d6fd1">short half-axis 0.5</text>
    <text x="250" y="150" text-anchor="middle">κ = 3 / 0.5 = 6</text>
  </g>
</svg>
```

$\mathbf{A}^T\mathbf{A}$ would stretch by $9$ and $0.25$, giving $\kappa = 36 = 6^2$. An orthogonal matrix maps the circle to a circle: $\kappa = 1$, the best possible.
:::

::: context householder Mirrors instead of shadows
Alston Householder, an American numerical analyst, published in 1958 a way to build QR out of reflections. Each **Householder reflection** is a mirror placed so that it swings a whole column onto one axis in a single move, zeroing everything below the diagonal at once.

A reflection is an orthogonal matrix, so it keeps lengths exactly, and a product of reflections stays orthogonal even when rounded. That is why library QR routines use mirrors rather than the shadow-subtracting of Gram–Schmidt.
:::
