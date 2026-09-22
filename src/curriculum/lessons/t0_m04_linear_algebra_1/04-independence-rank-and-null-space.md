---
id: l04-independence-rank-and-null-space
title: Independence, basis, rank and null space
minutes: 22
covers:
  - linear independence and basis
  - rank, null space, column space
---

Put three accelerometers on a vehicle and you can measure the full specific-force vector — unless two of them point the same way, in which case you have paid for three sensors and bought two numbers. Put a second star tracker next to the first and you have gained redundancy but perhaps no new geometry. Which components of the state a sensor suite can see, and which it is blind to, is a question about the matrix that maps state to measurements, and this lesson gives you the vocabulary and the computation to answer it: linear independence, basis, rank, column space and null space.

The same vocabulary answers the question the previous lesson left open. Elimination fails when a pivot is zero, and the matrix is then called singular. Singular means the columns are dependent, the map collapses at least one direction to nothing, and $\mathbf{A}\mathbf{x} = \mathbf{b}$ has either no solution or infinitely many. The null space is the set of collapsed directions; the column space is the set of right-hand sides that can be reached; the rank measures how much of the map survives.

These are not abstractions for their own sake. When a Kalman filter's covariance in some direction refuses to shrink no matter how many measurements arrive, that direction is in a null space. When a least-squares fit returns wildly different parameters for nearly identical data, the columns are nearly dependent. Learning to see these spaces in a small matrix by hand is what lets you recognise them in a large one by their symptoms.

## Span and subspaces

Given vectors $\mathbf{v}_1, \dots, \mathbf{v}_k$ in $\mathbb{R}^n$, their **span** is the set of all their linear combinations,

$$
\operatorname{span}\{\mathbf{v}_1, \dots, \mathbf{v}_k\} = \{\, c_1\mathbf{v}_1 + \cdots + c_k\mathbf{v}_k \;:\; c_i \in \mathbb{R} \,\}.
$$

The span of one nonzero vector is a line through the origin. The span of two vectors that do not lie on a common line is a plane through the origin. The span of three vectors not lying in a common plane is all of $\mathbb{R}^3$.

A span is always a **subspace**: a set that contains the zero vector and is closed under addition and scaling, so that any linear combination of members is again a member. Lines and planes through the origin are subspaces; a line that misses the origin is not, because doubling one of its points leaves the line. Every subspace you meet in this module is the span of some vectors, and the natural question about it is how many vectors it genuinely takes.

## Linear independence

Vectors $\mathbf{v}_1, \dots, \mathbf{v}_k$ are **linearly independent** if the only way to combine them into the zero vector is with all coefficients zero:

$$
c_1\mathbf{v}_1 + c_2\mathbf{v}_2 + \cdots + c_k\mathbf{v}_k = \mathbf{0} \quad \text{only when} \quad c_1 = c_2 = \cdots = c_k = 0 .
$$

Otherwise they are **linearly dependent**. The definition is equivalent to the more intuitive statement that no vector in the set is a combination of the others. If some $c_j \ne 0$ in a combination that gives zero, divide through by $c_j$ and move $\mathbf{v}_j$ to one side: it is expressed in terms of the rest. Conversely, if $\mathbf{v}_j$ is a combination of the others, move it across and you have a combination giving zero with coefficient $-1$ on $\mathbf{v}_j$. A dependent set carries redundant vectors; an independent set has none.

### Testing independence by elimination

Place the vectors as the columns of a matrix $\mathbf{A}$. A linear combination $\sum_j c_j\mathbf{v}_j$ is exactly $\mathbf{A}\mathbf{c}$, so the vectors are independent precisely when $\mathbf{A}\mathbf{c} = \mathbf{0}$ has only the solution $\mathbf{c} = \mathbf{0}$. Run elimination. Row operations never change the solutions of $\mathbf{A}\mathbf{c} = \mathbf{0}$, and a triangular system has only the zero solution exactly when every column has a pivot. So:

> The columns of $\mathbf{A}$ are linearly independent if and only if elimination produces a pivot in every column.

A column without a pivot is a **free column**: its variable can be chosen at will, and a nonzero choice produces a nonzero $\mathbf{c}$ with $\mathbf{A}\mathbf{c} = \mathbf{0}$, which is a dependence among the columns. This also proves that more than $n$ vectors in $\mathbb{R}^n$ are always dependent: an $n \times k$ matrix with $k > n$ has at most $n$ pivots, so at least $k - n$ columns are free.

::: example Are these three vectors independent?
Test $\mathbf{v}_1 = (1, 2, 3)^T$, $\mathbf{v}_2 = (2, -1, 0)^T$ and $\mathbf{v}_3 = (4, 3, 6)^T$. As columns,

$$
\mathbf{A} = \begin{pmatrix} 1 & 2 & 4 \\ 2 & -1 & 3 \\ 3 & 0 & 6 \end{pmatrix}.
$$

Eliminate. Column 1: multipliers $2$ and $3$; row 2 becomes $(0, -5, -5)$ and row 3 becomes $(0, -6, -6)$. Column 2: pivot $-5$, multiplier $-6/(-5) = 1.2$; row 3 becomes $(0, -6, -6) - 1.2\,(0, -5, -5) = (0, 0, 0)$. Column 3 has no pivot, so the vectors are dependent.

To find the dependence, solve the reduced system $\mathbf{A}\mathbf{c} = \mathbf{0}$ with the free variable $c_3 = 1$: row 2 gives $-5c_2 - 5 = 0$, so $c_2 = -1$; row 1 gives $c_1 - 2 + 4 = 0$, so $c_1 = -2$. Then $-2\mathbf{v}_1 - \mathbf{v}_2 + \mathbf{v}_3 = \mathbf{0}$, or $\mathbf{v}_3 = 2\mathbf{v}_1 + \mathbf{v}_2$. Check: $2(1, 2, 3) + (2, -1, 0) = (4, 3, 6)$. The three vectors span only a plane.
:::

## Basis and dimension

A **basis** of a subspace is a set of vectors that is linearly independent and spans the subspace. Independence means nothing is redundant; spanning means nothing is missing. The standard basis $\mathbf{e}_1, \dots, \mathbf{e}_n$ is a basis of $\mathbb{R}^n$, and the three axis vectors $\hat{\mathbf{x}}, \hat{\mathbf{y}}, \hat{\mathbf{z}}$ of any reference frame are a basis of $\mathbb{R}^3$.

The payoff of a basis is unique coordinates. Every vector $\mathbf{x}$ in the subspace can be written as $\mathbf{x} = \sum_j c_j\mathbf{v}_j$ because the basis spans, and only in one way because it is independent: if $\sum_j c_j\mathbf{v}_j = \sum_j d_j\mathbf{v}_j$, subtracting gives $\sum_j (c_j - d_j)\mathbf{v}_j = \mathbf{0}$, and independence forces every $c_j = d_j$. The numbers $c_j$ are the **coordinates** of $\mathbf{x}$ in that basis. The components of a vector in a reference frame are exactly its coordinates in the basis of that frame's axes, which is why the same arrow has different components in different frames: different basis, different coordinates, same vector.

A subspace has many bases, but they all contain the same number of vectors. That number is the **dimension** of the subspace. The argument is the one above: if one basis had $k$ vectors and another had more than $k$, write the larger set in coordinates with respect to the smaller; you have more than $k$ vectors in $\mathbb{R}^k$, which must be dependent, a contradiction. A line has dimension 1, a plane 2, and $\mathbb{R}^n$ has dimension $n$. The three vectors of the example span a subspace of dimension 2, and any two of them form a basis for it.

::: key Independence, basis, dimension
Vectors are linearly independent when $\sum_j c_j\mathbf{v}_j = \mathbf{0}$ forces all $c_j = 0$; equivalently, no vector is a combination of the others; equivalently, elimination on the matrix of columns yields a pivot in every column. A basis is an independent spanning set, it gives unique coordinates, and the number of vectors in any basis is the dimension.
:::

## The column space and the null space

Two subspaces belong to every $m \times n$ matrix $\mathbf{A}$, one on each side of the map.

The **column space** $C(\mathbf{A})$ is the span of the columns — the set of every possible output $\mathbf{A}\mathbf{x}$. It is a subspace of $\mathbb{R}^m$. In the row picture of a measurement matrix $\mathbf{H}$, whose rows are sensor axes, the column space of $\mathbf{H}$ is the set of measurement vectors the suite could ever report for a noise-free state. A system $\mathbf{A}\mathbf{x} = \mathbf{b}$ has a solution exactly when $\mathbf{b}$ lies in $C(\mathbf{A})$. A measurement vector that falls outside the column space is telling you about noise, a fault or a modelling error, and a residual monitor is precisely a test of how far a measurement lies from the column space.

The **null space** $N(\mathbf{A})$ is the set of inputs the map sends to zero:

$$
N(\mathbf{A}) = \{\, \mathbf{x} \in \mathbb{R}^n \;:\; \mathbf{A}\mathbf{x} = \mathbf{0} \,\}.
$$

It is a subspace of $\mathbb{R}^n$: it contains $\mathbf{0}$, and if $\mathbf{A}\mathbf{x} = \mathbf{0}$ and $\mathbf{A}\mathbf{y} = \mathbf{0}$ then $\mathbf{A}(\alpha\mathbf{x} + \beta\mathbf{y}) = \alpha\mathbf{A}\mathbf{x} + \beta\mathbf{A}\mathbf{y} = \mathbf{0}$. For a measurement matrix the null space has a sharp physical meaning. If $\mathbf{x}_0 \in N(\mathbf{H})$, then

$$
\mathbf{H}(\mathbf{x} + \mathbf{x}_0) = \mathbf{H}\mathbf{x} + \mathbf{H}\mathbf{x}_0 = \mathbf{H}\mathbf{x} ,
$$

so the states $\mathbf{x}$ and $\mathbf{x} + \mathbf{x}_0$ produce identical measurements. No estimator, however clever, can tell them apart from these sensors alone. The null space is the set of **unobservable** state directions — the directions you cannot see. The same fact describes all solutions of a consistent system: if $\mathbf{x}_p$ solves $\mathbf{A}\mathbf{x} = \mathbf{b}$, then so does $\mathbf{x}_p + \mathbf{x}_0$ for every $\mathbf{x}_0$ in the null space, and these are all the solutions. A unique solution exists exactly when the null space is $\{\mathbf{0}\}$.

The null space is perpendicular to every row. Writing $\mathbf{A}\mathbf{x} = \mathbf{0}$ row by row says that each row dotted with $\mathbf{x}$ is zero. So an unobservable direction is one that is orthogonal to every sensor axis — the geometric reason a set of accelerometers lying in a common plane cannot sense the force normal to that plane.

### Rank

The **rank** of $\mathbf{A}$ is the number of pivots elimination produces. It equals the dimension of the column space: the pivot columns of the original matrix are independent, since the pivot columns of the eliminated matrix are and row operations preserve dependence relations among columns, while each free column is a combination of the pivot columns to its left, by the same reduced system used to find null vectors. So the pivot columns of $\mathbf{A}$ — of the *original* $\mathbf{A}$, not of the reduced form — are a basis for the column space, and

$$
\operatorname{rank}(\mathbf{A}) = \dim C(\mathbf{A}) = \text{number of pivots}.
$$

Rank is at most the smaller of $m$ and $n$. A matrix that attains that bound has **full rank**. A square $n \times n$ matrix is invertible exactly when its rank is $n$: every column has a pivot, the columns are independent, the null space is $\{\mathbf{0}\}$, and $\mathbf{A}\mathbf{x} = \mathbf{b}$ has one solution for every $\mathbf{b}$. Every one of the words "singular", "dependent columns", "zero pivot", "nontrivial null space" and "rank less than $n$" describes the same situation.

### The rank–nullity theorem

Count the columns of an $m \times n$ matrix two ways. Every column either has a pivot or is free. The pivot columns number $\operatorname{rank}(\mathbf{A})$. Each free column produces one null-space vector — set that free variable to $1$, the other free variables to $0$, and solve for the pivot variables — and these vectors are independent, because each has a $1$ where the others have $0$, and they span the null space, because any null vector is determined by its free-variable values. So the free columns number $\dim N(\mathbf{A})$, and

$$
\operatorname{rank}(\mathbf{A}) + \dim N(\mathbf{A}) = n .
$$

This is the **rank–nullity theorem**; $\dim N(\mathbf{A})$ is called the nullity. Read for a measurement matrix with $n$ states: the rank counts the independent measurements you actually have, and the nullity counts the state directions those measurements cannot see. Three sensors and five states with rank 3 leaves two blind directions; six sensors and five states with rank 5 leaves none, and the sixth sensor is a consistency check.

::: key Rank–nullity
For $\mathbf{A}$ with $n$ columns, $\operatorname{rank}(\mathbf{A}) + \dim N(\mathbf{A}) = n$. Rank is the number of pivots, the dimension of the column space, and the number of independent measurements; the null space is the set of $\mathbf{x}$ with $\mathbf{A}\mathbf{x} = \mathbf{0}$, the directions you cannot see.
:::

::: example Rank, column space and null space of a 3 by 4 matrix
Take

$$
\mathbf{A} = \begin{pmatrix} 1 & 2 & 0 & 1 \\ 2 & 4 & 1 & 3 \\ 3 & 6 & 1 & 4 \end{pmatrix}.
$$

Eliminate. Column 1: multipliers $2$ and $3$; row 2 becomes $(0, 0, 1, 1)$ and row 3 becomes $(0, 0, 1, 1)$. Column 2 of the reduced matrix is all zeros below row 1 and row 1 is already used, so column 2 is free. Column 3: pivot $1$ in row 2, multiplier $1$; row 3 becomes $(0, 0, 0, 0)$. Column 4 is free. The reduced matrix is

$$
\begin{pmatrix} 1 & 2 & 0 & 1 \\ 0 & 0 & 1 & 1 \\ 0 & 0 & 0 & 0 \end{pmatrix},
$$

with pivots in columns 1 and 3. So $\operatorname{rank}(\mathbf{A}) = 2$, and rank–nullity gives $\dim N(\mathbf{A}) = 4 - 2 = 2$.

**Column space.** A basis is the pivot columns of the original matrix: $(1, 2, 3)^T$ and $(0, 1, 1)^T$. The column space is a plane inside $\mathbb{R}^3$; the second column $(2, 4, 6)^T$ is twice the first and the fourth is the first plus the third.

**Null space.** Free variables $x_2$ and $x_4$. From the reduced rows, $x_3 = -x_4$ and $x_1 = -2x_2 - x_4$. Setting $(x_2, x_4) = (1, 0)$ gives $(-2, 1, 0, 0)^T$; setting $(0, 1)$ gives $(-1, 0, -1, 1)^T$. Check the second against the original second row: $2(-1) + 4(0) + 1(-1) + 3(1) = 0$. Every null vector is a combination of these two.
:::

::: example What a three-sensor suite cannot see
Three single-axis accelerometers are mounted with sensitive axes $\hat{\mathbf{u}}_1 = (1, 0, 0)^T$, $\hat{\mathbf{u}}_2 = (0.6, 0.8, 0)^T$ and $\hat{\mathbf{u}}_3 = (0.8, 0.6, 0)^T$ in the body frame. Each reads the component of specific force along its axis, so the measurement matrix has the axes as rows:

$$
\mathbf{H} = \begin{pmatrix} 1 & 0 & 0 \\ 0.6 & 0.8 & 0 \\ 0.8 & 0.6 & 0 \end{pmatrix}, \qquad \mathbf{y} = \mathbf{H}\mathbf{f} .
$$

The third column is entirely zero, so $\mathbf{H}\mathbf{e}_3 = \mathbf{0}$: the direction $(0, 0, 1)^T$ is in the null space. Elimination confirms the rank is 2 — column 1 has pivot $1$ with multipliers $0.6$ and $0.8$, after which row 2 is $(0, 0.8, 0)$ and row 3 is $(0, 0.6, 0)$; column 2 has pivot $0.8$, and subtracting $0.75$ times row 2 from row 3 leaves $(0, 0, 0)$ — so $\dim N(\mathbf{H}) = 3 - 2 = 1$ and the null space is exactly the line along $\hat{\mathbf{z}}$. All three axes lie in the body $xy$-plane, and no combination of in-plane readings can sense a force normal to that plane. The third sensor added redundancy, not geometry.

The column space is two-dimensional, so the three readings are not free to take any values. Row 3 is a combination of rows 1 and 2: solving $0.8 = a + 0.6b$ and $0.6 = 0.8b$ gives $b = 0.75$ and $a = 0.35$, so every noise-free measurement satisfies $y_3 = 0.35\,y_1 + 0.75\,y_2$. For $\mathbf{f} = (100, -40, 250)^T$ m/s² (deliberately including a large $z$ component), the readings are $\mathbf{y} = (100, 28, 56)^T$ m/s², and $0.35 \times 100 + 0.75 \times 28 = 56$ as predicted. The $250$ has vanished without trace. A residual $y_3 - 0.35y_1 - 0.75y_2$ that departs from zero would indicate a sensor fault, but no residual could ever reveal $f_z$. Tilting the third axis to $(0.8, 0, 0.6)^T$ would make the rank 3 and the null space $\{\mathbf{0}\}$, with three sensors doing three sensors' work.
:::

::: note Unobservable now is not unobservable forever
The null space of a single measurement matrix describes what one snapshot of sensors cannot see. With a dynamic model, the state rotates through the measurement geometry over time, and a direction that is blind at one instant can become visible over an arc. That is the observability analysis of the estimation modules, and it is built from stacking the matrices $\mathbf{H}$, $\mathbf{H}\boldsymbol{\Phi}$, $\mathbf{H}\boldsymbol{\Phi}^2, \dots$ and asking for their combined null space — this lesson's computation, applied to a taller matrix.
:::

::: warning Rank in floating point
Elimination on a computer rarely produces an exact zero pivot. Two accelerometer axes differing by $0.01°$ give a matrix of full rank in exact arithmetic and, for every practical purpose, rank 2. Rank decisions in code are made with a tolerance, and the reliable tool is the singular value decomposition of Linear Algebra II, which reports how close to dependent the columns are rather than a yes-or-no verdict. `numpy.linalg.matrix_rank` works this way.
:::

::: warning Take the basis of the column space from the original matrix
Row operations change the column space. The pivot columns of the reduced matrix span a different plane from the pivot columns of $\mathbf{A}$. Use elimination to learn *which* columns are pivot columns, then take those columns from the matrix you started with.
:::

```python
import numpy as np

H = np.array([[1.0, 0.0, 0.0],
              [0.6, 0.8, 0.0],
              [0.8, 0.6, 0.0]])
print(np.linalg.matrix_rank(H))          # 2
f = np.array([100.0, -40.0, 250.0])
y = H @ f
print(y, 0.35 * y[0] + 0.75 * y[1])      # [100.  28.  56.] 56.0
print(H @ np.array([0.0, 0.0, 1.0]))     # [0. 0. 0.]  z is in the null space
```

## Check yourself

::: check
Are $(1, 0, 2)^T$, $(0, 1, 1)^T$ and $(2, -1, 3)^T$ linearly independent? If not, express one as a combination of the others.
:::

::: answer
Columns of a matrix: $\begin{pmatrix} 1 & 0 & 2 \\ 0 & 1 & -1 \\ 2 & 1 & 3 \end{pmatrix}$. Row 3 minus $2$ times row 1 gives $(0, 1, -1)$; minus row 2 gives $(0, 0, 0)$. Only two pivots: dependent. With $c_3 = 1$, row 2 gives $c_2 - 1 = 0$, so $c_2 = 1$; row 1 gives $c_1 + 2 = 0$, so $c_1 = -2$. Hence $(2, -1, 3)^T = 2\,(1, 0, 2)^T - (0, 1, 1)^T$. Check: $(2, 0, 4) - (0, 1, 1) = (2, -1, 3)$.
:::

::: check
A measurement matrix is $4 \times 6$ with rank 4. Give the dimensions of its column space and null space, and say in words what each number means for an estimator.
:::

::: answer
The column space has dimension equal to the rank, 4, and lives in $\mathbb{R}^4$, so it is all of measurement space: any four readings are consistent with some state. By rank–nullity the null space has dimension $6 - 4 = 2$: two independent combinations of the six states produce no measurement at all and cannot be estimated from these sensors alone.
:::

::: check
Explain why a $5 \times 3$ matrix (five sensors, three states) can never have a column space equal to all of $\mathbb{R}^5$, and what that means about the five readings.
:::

::: answer
The column space is spanned by three columns, so its dimension is at most 3, and $\mathbb{R}^5$ has dimension 5. At least two directions in measurement space are unreachable by any state: the five readings must satisfy at least two linear consistency relations. Those relations are exactly what a residual monitor checks; a measurement that violates them cannot have come from a noise-free state.
:::

::: check
Find the null space of $\mathbf{B} = \begin{pmatrix} 1 & 3 & 2 \\ 2 & 6 & 4 \end{pmatrix}$ and state its rank.
:::

::: answer
Row 2 is twice row 1, so elimination leaves one pivot: rank 1, nullity $3 - 1 = 2$. The single equation is $x_1 + 3x_2 + 2x_3 = 0$ with $x_2, x_3$ free. Setting $(x_2, x_3) = (1, 0)$ gives $(-3, 1, 0)^T$; setting $(0, 1)$ gives $(-2, 0, 1)^T$. The null space is the plane spanned by these two, which is the plane perpendicular to the row $(1, 3, 2)$.
:::

::: check
Two gyros have sensitive axes $(1, 0, 0)^T$ and $(0, 1, 0)^T$. A third is to be added. Which choice of axis leaves the rank at 2, and why does every other choice give rank 3?
:::

::: answer
The first two rows span the $xy$-plane. Any third axis in that plane — any vector $(a, b, 0)^T$ — is a combination of them and adds no pivot, leaving rank 2 with the null space along $\hat{\mathbf{z}}$. Any axis with a nonzero $z$ component is not in the span of the first two, so the three rows are independent and the rank is 3; the null space then shrinks to $\{\mathbf{0}\}$ and all three components of the rate are observable. The smaller the $z$ component, the closer to dependent the rows are and the noisier the estimate of the $z$ rate.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\operatorname{span}\{\mathbf{v}_i\}$ | All linear combinations; always a subspace |
| $\sum_j c_j\mathbf{v}_j = \mathbf{0} \Rightarrow c_j = 0$ | Linear independence; a pivot in every column |
| Basis | Independent and spanning; unique coordinates; count = dimension |
| $C(\mathbf{A}) = \{\mathbf{A}\mathbf{x}\}$ | Column space: reachable outputs; solvable right-hand sides |
| $N(\mathbf{A}) = \{\mathbf{x} : \mathbf{A}\mathbf{x} = \mathbf{0}\}$ | Null space: directions collapsed to zero; unobservable state directions |
| $\operatorname{rank}(\mathbf{A})$ | Number of pivots $= \dim C(\mathbf{A})$; independent measurements |
| $\operatorname{rank}(\mathbf{A}) + \dim N(\mathbf{A}) = n$ | Rank–nullity; $n$ = number of columns |
| Pivot columns of the original $\mathbf{A}$ | A basis for the column space |
| One null vector per free column | A basis for the null space |
| $N(\mathbf{A}) \perp$ every row | Blind directions are orthogonal to every sensor axis |

The rank decides whether a square matrix is invertible. The next lesson gives a single number that makes the same decision and tells you more — how much the map stretches volume, and whether it flips orientation: the determinant.
