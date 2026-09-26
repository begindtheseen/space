---
id: l04-independence-rank-and-null-space
title: Independence, basis, rank and null space
minutes: 24
covers:
  - linear independence and basis
  - rank, null space, column space
---

Suppose three friends each give you one step of directions to a picnic. The first says "walk east", the second says "walk north", and the third says "walk north-east". The third friend has told you nothing new. Anywhere you can reach with their help, you could already reach with the first two. You have three instructions but only two directions.

Sensors work the same way. Put three **[[accelerometers|accelerometer]]** on a vehicle and you can measure the full push it feels in three dimensions — unless two of them point the same way. Then you have paid for three sensors and bought two numbers. Add a second **[[star tracker|star-tracker]]** beside the first and you gain a spare, but maybe no new view. Which parts of a vehicle's state a set of sensors can see, and which parts it is blind to, is a question about the matrix that turns state into measurements. This lesson gives you the words and the arithmetic to answer it: **linear independence**, **basis**, **rank**, **column space** and **null space**.

The same words answer the question the previous lesson left open. Elimination fails when a pivot is zero, and the matrix is then called **singular**. Singular means some columns repeat information, the map squashes at least one direction down to nothing, and $\mathbf{A}\mathbf{x} = \mathbf{b}$ has either no solution or infinitely many. When a **[[Kalman filter's uncertainty|kalman-covariance]]** in some direction refuses to shrink no matter how many measurements arrive, that direction is in a null space. Learning to spot these spaces in a small matrix by hand is what lets you recognize them in a big one by their symptoms.

## Span and subspaces

Start with a set of arrows, $\mathbf{v}_1, \dots, \mathbf{v}_k$, in $\mathbb{R}^n$ (read "R n", the space of lists of $n$ real numbers). A **linear combination** of them is what you get by stretching each one by some number and adding the results: $c_1\mathbf{v}_1 + \cdots + c_k\mathbf{v}_k$. The numbers $c_i$ can be anything — positive, negative or zero.

The **span** of the arrows is every place you can reach this way:

$$
\operatorname{span}\{\mathbf{v}_1, \dots, \mathbf{v}_k\} = \{\, c_1\mathbf{v}_1 + \cdots + c_k\mathbf{v}_k \;:\; c_i \in \mathbb{R} \,\}.
$$

Read it as "the set of all $c_1\mathbf{v}_1$ plus and so on, where each $c_i$ is any real number". Picture it:

- One arrow that is not zero spans a **line** through the origin. You can slide forward and back along it, nothing else.
- Two arrows that do not lie on a common line span a **[[plane through the origin|span-plane]]**.
- Three arrows that do not lie in a common plane span all of $\mathbb{R}^3$.

A span is always a **subspace**: a set that contains the zero vector and stays closed when you add or stretch its members. Any linear combination of members is again a member. Lines and planes through the origin are subspaces. A line that misses the origin is not, because doubling one of its points lands you off the line. Every subspace in this module is the span of some arrows, and the natural question is how many arrows it really takes.

## Linear independence

Back to the picnic directions. The third instruction was wasted because it could be built from the other two. That is the idea of dependence.

Arrows $\mathbf{v}_1, \dots, \mathbf{v}_k$ are **linearly independent** when the only way to combine them into the zero vector is to use all zeros:

$$
c_1\mathbf{v}_1 + c_2\mathbf{v}_2 + \cdots + c_k\mathbf{v}_k = \mathbf{0} \quad \text{only when} \quad c_1 = c_2 = \cdots = c_k = 0 .
$$

Otherwise they are **linearly dependent**. This says the same thing as the friendlier version: no arrow in the set is a combination of the others.

::: note Why the two versions agree
Suppose a combination gives zero and some coefficient $c_j$ is not zero. Divide the whole equation by $c_j$ and move $\mathbf{v}_j$ to one side. Now $\mathbf{v}_j$ is written in terms of the rest.

The other way round: if $\mathbf{v}_j$ is a combination of the others, move it across the equals sign. You get a combination equal to zero with coefficient $-1$ on $\mathbf{v}_j$, which is not all zeros. A dependent set carries spare arrows; an independent set has none.
:::

### Testing independence by elimination

Put the arrows side by side as the columns of a matrix $\mathbf{A}$. Then the combination $\sum_j c_j\mathbf{v}_j$ ("the sum over $j$ of $c_j$ times $\mathbf{v}_j$") is exactly the product $\mathbf{A}\mathbf{c}$. So the arrows are independent exactly when $\mathbf{A}\mathbf{c} = \mathbf{0}$ has only the answer $\mathbf{c} = \mathbf{0}$.

Now run elimination. Row operations never change the solutions of $\mathbf{A}\mathbf{c} = \mathbf{0}$. A staircase system has only the zero solution exactly when every column has a pivot. So:

> The columns of $\mathbf{A}$ are linearly independent if and only if elimination produces a pivot in every column.

A column with no pivot is a **free column**. Its unknown can be set to anything you like. A nonzero choice gives a nonzero $\mathbf{c}$ with $\mathbf{A}\mathbf{c} = \mathbf{0}$, and that is a dependence among the columns.

This also shows that more than $n$ arrows in $\mathbb{R}^n$ are always dependent. An $n \times k$ matrix (read "n by k": $n$ rows, $k$ columns) with $k > n$ has at most $n$ pivots, one per row. So at least $k - n$ columns are free. Four arrows in 3D space always carry a spare.

::: example Are these three vectors independent?
Test $\mathbf{v}_1 = (1, 2, 3)^T$, $\mathbf{v}_2 = (2, -1, 0)^T$ and $\mathbf{v}_3 = (4, 3, 6)^T$. As columns,

$$
\mathbf{A} = \begin{pmatrix} 1 & 2 & 4 \\ 2 & -1 & 3 \\ 3 & 0 & 6 \end{pmatrix}.
$$

**Column 1.** The pivot is $1$, and the multipliers are $2$ and $3$. Row 2 minus 2 times row 1 is $(0, -5, -5)$. Row 3 minus 3 times row 1 is $(0, -6, -6)$.

**Column 2.** The pivot is $-5$. The multiplier is $-6/(-5) = 1.2$. Row 3 becomes $(0, -6, -6) - 1.2\,(0, -5, -5) = (0, 0, 0)$.

**Column 3** has no pivot left. So the vectors are dependent.

**Finding the dependence.** Solve $\mathbf{A}\mathbf{c} = \mathbf{0}$ with the free unknown set to $c_3 = 1$. The second row says $-5c_2 - 5 = 0$, so $c_2 = -1$. The first row says $c_1 - 2 + 4 = 0$, so $c_1 = -2$. That means $-2\mathbf{v}_1 - \mathbf{v}_2 + \mathbf{v}_3 = \mathbf{0}$, or

$$
\mathbf{v}_3 = 2\mathbf{v}_1 + \mathbf{v}_2 .
$$

**Check:** $2\,(1, 2, 3) + (2, -1, 0) = (4, 3, 6)$. Correct. The three vectors span only a plane — the third one was the friend saying "north-east".
:::

## Basis and dimension

A **basis** of a subspace is a set of arrows that is independent *and* spans the subspace. Independent means nothing is spare. Spanning means nothing is missing. It is the smallest complete set of directions.

The standard basis $\mathbf{e}_1, \dots, \mathbf{e}_n$ (each is all zeros except a $1$ in one slot) is a basis of $\mathbb{R}^n$. The three axis arrows $\hat{\mathbf{x}}, \hat{\mathbf{y}}, \hat{\mathbf{z}}$ of any reference frame are a basis of $\mathbb{R}^3$.

The reward for having a basis is **unique coordinates**. Every $\mathbf{x}$ in the subspace can be written as $\mathbf{x} = \sum_j c_j\mathbf{v}_j$, because the basis spans. And it can be written in only one way, because the basis is independent. The numbers $c_j$ are the **[[coordinates|basis-recipe]]** of $\mathbf{x}$ in that basis.

::: note Why the coordinates are unique
Suppose $\sum_j c_j\mathbf{v}_j = \sum_j d_j\mathbf{v}_j$. Subtract one side from the other: $\sum_j (c_j - d_j)\mathbf{v}_j = \mathbf{0}$. Independence says every coefficient of a combination that gives zero is zero, so $c_j = d_j$ for every $j$.
:::

The components of a vector in a reference frame are exactly its coordinates in the basis of that frame's axes. That is why the same arrow has different components in different frames: different basis, different coordinates, same arrow.

A subspace has many bases, but they all have the same number of arrows. That number is the **dimension** of the subspace. A line has dimension 1, a plane 2, and $\mathbb{R}^n$ has dimension $n$. The three vectors of the example span a subspace of dimension 2, and any two of them form a basis for it.

::: note Why every basis has the same size
Suppose one basis had $k$ arrows and another had more than $k$. Write each arrow of the bigger set in coordinates with respect to the smaller basis. Each becomes a list of $k$ numbers, so you now have more than $k$ vectors in $\mathbb{R}^k$. Those must be dependent — but a basis cannot be dependent. So no basis can be bigger than another.
:::

::: key Independence, basis, dimension
Vectors are linearly independent when $\sum_j c_j\mathbf{v}_j = \mathbf{0}$ forces all $c_j = 0$; equivalently, no vector is a combination of the others; equivalently, elimination on the matrix of columns yields a pivot in every column. A basis is an independent spanning set, it gives unique coordinates, and the number of vectors in any basis is the dimension.
:::

## The column space and the null space

Every $m \times n$ matrix $\mathbf{A}$ owns two subspaces, one on each side of the map. Think of the matrix as a machine: vectors with $n$ entries go in, vectors with $m$ entries come out.

### What comes out: the column space

The **column space** $C(\mathbf{A})$ is the span of the columns. It is every possible output $\mathbf{A}\mathbf{x}$, and it sits inside $\mathbb{R}^m$. So $\mathbf{A}\mathbf{x} = \mathbf{b}$ has a solution exactly when $\mathbf{b}$ lies in $C(\mathbf{A})$.

For a measurement matrix $\mathbf{H}$, whose rows are the sensor axes, the column space is the set of every reading the sensors could ever report when there is no noise. A reading that falls outside the column space is telling you about noise, a fault or a modeling error. A **[[residual monitor|residual-monitor]]** is a test of how far a measurement sits from the column space.

### What vanishes: the null space

The **null space** $N(\mathbf{A})$ is every input the machine turns into zero:

$$
N(\mathbf{A}) = \{\, \mathbf{x} \in \mathbb{R}^n \;:\; \mathbf{A}\mathbf{x} = \mathbf{0} \,\}.
$$

It is a subspace of $\mathbb{R}^n$. It contains $\mathbf{0}$. And if $\mathbf{A}\mathbf{x} = \mathbf{0}$ and $\mathbf{A}\mathbf{y} = \mathbf{0}$, then any combination also goes to zero: $\mathbf{A}(\alpha\mathbf{x} + \beta\mathbf{y}) = \alpha\mathbf{A}\mathbf{x} + \beta\mathbf{A}\mathbf{y} = \mathbf{0}$. ($\alpha$ and $\beta$, "alpha" and "beta", are any two numbers.)

For a measurement matrix the null space has a sharp physical meaning. Suppose $\mathbf{x}_0$ is in $N(\mathbf{H})$. Then for any state $\mathbf{x}$,

$$
\mathbf{H}(\mathbf{x} + \mathbf{x}_0) = \mathbf{H}\mathbf{x} + \mathbf{H}\mathbf{x}_0 = \mathbf{H}\mathbf{x} .
$$

The states $\mathbf{x}$ and $\mathbf{x} + \mathbf{x}_0$ give identical readings. No estimator, however clever, can tell them apart from these sensors alone. The null space is the set of **[[unobservable|observability-word]]** state directions — the directions you cannot see.

The same fact describes every solution of a system that has one. If $\mathbf{x}_p$ solves $\mathbf{A}\mathbf{x} = \mathbf{b}$, then so does $\mathbf{x}_p + \mathbf{x}_0$ for every $\mathbf{x}_0$ in the null space, and these are all the solutions. A unique solution exists exactly when the null space holds only $\mathbf{0}$.

There is a picture hiding here. Writing $\mathbf{A}\mathbf{x} = \mathbf{0}$ row by row says each row dotted with $\mathbf{x}$ is zero. So **the null space is perpendicular to every row**. An unobservable direction is one at right angles to every sensor axis. That is why accelerometers that all lie in one flat plane cannot feel a push straight out of that plane.

### Rank

The **rank** of $\mathbf{A}$ is the number of pivots elimination produces. It equals the dimension of the column space:

$$
\operatorname{rank}(\mathbf{A}) = \dim C(\mathbf{A}) = \text{number of pivots}.
$$

The pivot columns of $\mathbf{A}$ — of the *original* $\mathbf{A}$, not the reduced one — are a basis for the column space.

::: note Why the pivot columns are a basis
Row operations do not change which combinations of columns add up to zero, because they do not change the solutions of $\mathbf{A}\mathbf{c} = \mathbf{0}$. In the reduced matrix the pivot columns are independent, because each has a pivot where the ones before it have zeros, so the same columns of the original are independent too. Each free column is a combination of the pivot columns to its left — the reduced system you use to find null vectors says exactly which combination. So the pivot columns are independent and span everything the columns span.
:::

Rank can be at most the smaller of $m$ and $n$, since each pivot needs its own row and its own column. A matrix that reaches that limit has **full rank**. A square $n \times n$ matrix is invertible exactly when its rank is $n$: every column has a pivot, the columns are independent, the null space is only $\{\mathbf{0}\}$, and $\mathbf{A}\mathbf{x} = \mathbf{b}$ has one solution for every $\mathbf{b}$. The phrases "singular", "dependent columns", "zero pivot", "nontrivial null space" and "rank less than $n$" all describe the same situation.

### The rank–nullity theorem

Count the columns of an $m \times n$ matrix two ways, like counting the chairs in a room as "occupied plus empty". Every column either has a pivot or is free.

- The pivot columns number $\operatorname{rank}(\mathbf{A})$.
- Each free column makes one null-space vector. Set that free unknown to $1$, the other free unknowns to $0$, and solve for the pivot unknowns. These vectors are independent, because each has a $1$ where the others have $0$. They span the null space, because any null vector is fixed once you know its free-unknown values. So the free columns number $\dim N(\mathbf{A})$.

Adding up,

$$
\operatorname{rank}(\mathbf{A}) + \dim N(\mathbf{A}) = n .
$$

This is the **[[rank–nullity theorem|rank-nullity-picture]]**. The number $\dim N(\mathbf{A})$ is called the **nullity**. Read it for a measurement matrix with $n$ states. The rank counts the independent measurements you really have. The nullity counts the state directions those measurements cannot see. Three sensors and five states with rank 3 leave two blind directions. Six sensors and five states with rank 5 leave none, and the sixth sensor becomes a consistency check.

::: key Rank–nullity
For $\mathbf{A}$ with $n$ columns, $\operatorname{rank}(\mathbf{A}) + \dim N(\mathbf{A}) = n$ (the null space is also written $\operatorname{null}(\mathbf{A})$). Rank is the number of pivots, the dimension of the column space, and the number of independent measurements; the null space is the set of $\mathbf{x}$ with $\mathbf{A}\mathbf{x} = \mathbf{0}$, and its dimension counts the directions you cannot see.
:::

::: example Rank, column space and null space of a 3 by 4 matrix
Take

$$
\mathbf{A} = \begin{pmatrix} 1 & 2 & 0 & 1 \\ 2 & 4 & 1 & 3 \\ 3 & 6 & 1 & 4 \end{pmatrix}.
$$

**Column 1.** Pivot $1$, multipliers $2$ and $3$. Row 2 becomes $(0, 0, 1, 1)$ and row 3 becomes $(0, 0, 1, 1)$.

**Column 2.** Below row 1 it is all zeros, and row 1 is already used. So column 2 is free.

**Column 3.** Pivot $1$ in row 2, multiplier $1$. Row 3 becomes $(0, 0, 0, 0)$.

**Column 4** has no rows left, so it is free. The reduced matrix is

$$
\begin{pmatrix} 1 & 2 & 0 & 1 \\ 0 & 0 & 1 & 1 \\ 0 & 0 & 0 & 0 \end{pmatrix},
$$

with pivots in columns 1 and 3. So $\operatorname{rank}(\mathbf{A}) = 2$, and rank–nullity gives $\dim N(\mathbf{A}) = 4 - 2 = 2$.

**Column space.** Take the pivot columns from the original matrix: $(1, 2, 3)^T$ and $(0, 1, 1)^T$. The column space is a plane inside $\mathbb{R}^3$. The other columns add nothing: the second, $(2, 4, 6)^T$, is twice the first, and the fourth is the first plus the third.

**Null space.** The free unknowns are $x_2$ and $x_4$. The reduced rows say $x_3 = -x_4$ and $x_1 = -2x_2 - x_4$. Setting $(x_2, x_4) = (1, 0)$ gives $(-2, 1, 0, 0)^T$. Setting $(x_2, x_4) = (0, 1)$ gives $(-1, 0, -1, 1)^T$.

**Check** the second one against the original second row: $2(-1) + 4(0) + 1(-1) + 3(1) = -2 - 1 + 3 = 0$. Every null vector is a combination of these two.
:::

::: example What a three-sensor suite cannot see
Three single-axis accelerometers are mounted with sensitive axes $\hat{\mathbf{u}}_1 = (1, 0, 0)^T$, $\hat{\mathbf{u}}_2 = (0.6, 0.8, 0)^T$ and $\hat{\mathbf{u}}_3 = (0.8, 0.6, 0)^T$ in the body frame. Each reads the part of the **specific force** (the push the accelerometer feels, in $\mathrm{m/s^2}$) along its axis. So the measurement matrix has the axes as rows:

$$
\mathbf{H} = \begin{pmatrix} 1 & 0 & 0 \\ 0.6 & 0.8 & 0 \\ 0.8 & 0.6 & 0 \end{pmatrix}, \qquad \mathbf{y} = \mathbf{H}\mathbf{f} .
$$

**Null space.** The third column is all zeros, so $\mathbf{H}\mathbf{e}_3 = \mathbf{0}$: the direction $(0, 0, 1)^T$ is in the null space.

**Rank.** Column 1 has pivot $1$ with multipliers $0.6$ and $0.8$. Row 2 becomes $(0, 0.8, 0)$ and row 3 becomes $(0, 0.6, 0)$. Column 2 has pivot $0.8$; subtracting $0.6/0.8 = 0.75$ times row 2 from row 3 leaves $(0, 0, 0)$. So the rank is 2, $\dim N(\mathbf{H}) = 3 - 2 = 1$, and the null space is exactly the line along $\hat{\mathbf{z}}$.

All three axes lie in the body $xy$-plane, and [[no mix of in-plane readings can feel a push out of that plane|planar-sensors]]. The third sensor added a spare, not a new direction.

**The readings are tied together.** The column space has dimension 2, so the three readings cannot take any values they like. Row 3 is a combination $a\,(\text{row 1}) + b\,(\text{row 2})$. Matching entries: $0.6 = 0.8b$ gives $b = 0.75$, and $0.8 = a + 0.6b$ gives $a = 0.8 - 0.45 = 0.35$. So every noise-free measurement obeys $y_3 = 0.35\,y_1 + 0.75\,y_2$.

**Numbers.** Take $\mathbf{f} = (100, -40, 250)^T\ \mathrm{m/s^2}$, with a big $z$ part on purpose. Then $y_1 = 100$, $y_2 = 0.6(100) + 0.8(-40) = 28$ and $y_3 = 0.8(100) + 0.6(-40) = 56$, all in $\mathrm{m/s^2}$. Check the tie: $0.35 \times 100 + 0.75 \times 28 = 35 + 21 = 56$. Correct.

The $250$ has vanished without a trace. A residual $y_3 - 0.35y_1 - 0.75y_2$ that moves away from zero would flag a sensor fault, but no residual could ever reveal $f_z$. Tilting the third axis to $(0.8, 0, 0.6)^T$ would make the rank 3 and the null space $\{\mathbf{0}\}$: three sensors doing three sensors' work.
:::

::: note Unobservable now is not unobservable forever
The null space of one measurement matrix describes what one snapshot of the sensors cannot see. With a model of how the state moves, the state turns through the sensor geometry over time, and a direction that is blind at one instant can become visible over a stretch of the path. That is the observability analysis of the estimation modules. It stacks the matrices $\mathbf{H}$, $\mathbf{H}\boldsymbol{\Phi}$, $\mathbf{H}\boldsymbol{\Phi}^2, \dots$ (where $\boldsymbol{\Phi}$, "phi", moves the state forward one step) and asks for their combined null space — this lesson's computation, on a taller matrix.
:::

::: warning Rank in floating point
Elimination on a computer rarely produces an exact zero pivot. Two accelerometer axes that differ by $0.01°$ give a matrix of full rank in exact arithmetic but, for every practical purpose, rank 2. Rank decisions in code are made with a tolerance. The reliable tool is the **[[singular value decomposition|svd-bridge]]** of Linear Algebra II, which reports how close to dependent the columns are instead of a yes-or-no verdict. `numpy.linalg.matrix_rank` works this way.
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
Are $(1, 0, 2)^T$, $(0, 1, 1)^T$ and $(2, -1, 3)^T$ linearly independent? If not, write one as a combination of the others.
:::

::: answer
Put them in a matrix as columns: $\begin{pmatrix} 1 & 0 & 2 \\ 0 & 1 & -1 \\ 2 & 1 & 3 \end{pmatrix}$.

Row 3 minus $2$ times row 1 gives $(0, 1, -1)$. Then subtracting row 2 gives $(0, 0, 0)$. Only two pivots, so the vectors are dependent.

Set the free unknown $c_3 = 1$. Row 2 says $c_2 - c_3 = 0$, so $c_2 = 1$. Row 1 says $c_1 + 2c_3 = 0$, so $c_1 = -2$. So $-2\,(1, 0, 2)^T + (0, 1, 1)^T + (2, -1, 3)^T = \mathbf{0}$, which rearranges to $(2, -1, 3)^T = 2\,(1, 0, 2)^T - (0, 1, 1)^T$.

**Check:** $(2, 0, 4) - (0, 1, 1) = (2, -1, 3)$. Correct.
:::

::: check
A measurement matrix is $4 \times 6$ with rank 4. Give the dimensions of its column space and null space, and say in words what each number means for an estimator.
:::

::: answer
The column space has dimension equal to the rank, 4. It lives in $\mathbb{R}^4$, so it fills all of measurement space: any four readings are consistent with some state.

By rank–nullity the null space has dimension $6 - 4 = 2$. Two independent combinations of the six states produce no measurement at all, and they cannot be estimated from these sensors alone.
:::

::: check
Explain why a $5 \times 3$ matrix (five sensors, three states) can never have a column space equal to all of $\mathbb{R}^5$, and what that means for the five readings.
:::

::: answer
The column space is spanned by three columns, so its dimension is at most 3. But $\mathbb{R}^5$ has dimension 5. So at least two directions in measurement space can never be reached by any state.

In practice, the five readings must obey at least two linear consistency rules. Those rules are exactly what a residual monitor checks. A measurement that breaks them cannot have come from a noise-free state.
:::

::: check
Find the null space of $\mathbf{B} = \begin{pmatrix} 1 & 3 & 2 \\ 2 & 6 & 4 \end{pmatrix}$ and state its rank.
:::

::: answer
Row 2 is twice row 1, so elimination leaves one pivot: rank 1, and nullity $3 - 1 = 2$.

The one remaining equation is $x_1 + 3x_2 + 2x_3 = 0$, with $x_2$ and $x_3$ free. Setting $(x_2, x_3) = (1, 0)$ gives $(-3, 1, 0)^T$. Setting $(x_2, x_3) = (0, 1)$ gives $(-2, 0, 1)^T$.

The null space is the plane spanned by these two. It is the plane perpendicular to the row $(1, 3, 2)$, as it must be. Check: $(1, 3, 2)\cdot(-3, 1, 0) = -3 + 3 + 0 = 0$.
:::

::: check
Two gyros have sensitive axes $(1, 0, 0)^T$ and $(0, 1, 0)^T$. A third is to be added. Which choices of axis leave the rank at 2, and why does every other choice give rank 3?
:::

::: answer
The first two rows span the $xy$-plane. Any third axis in that plane — any vector $(a, b, 0)^T$ — is a combination of them and adds no pivot. That leaves rank 2, with the null space along $\hat{\mathbf{z}}$.

Any axis with a nonzero $z$ part is not in the span of the first two. Then the three rows are independent and the rank is 3. The null space shrinks to $\{\mathbf{0}\}$, and all three parts of the turning rate can be seen.

One more thing: the smaller the $z$ part, the closer to dependent the rows are, and the noisier the estimate of the $z$ rate.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\operatorname{span}\{\mathbf{v}_i\}$ | All linear combinations; always a subspace |
| $\sum_j c_j\mathbf{v}_j = \mathbf{0} \Rightarrow c_j = 0$ | Linear independence; a pivot in every column |
| Basis | Independent and spanning; unique coordinates; count = dimension |
| $C(\mathbf{A}) = \{\mathbf{A}\mathbf{x}\}$ | Column space: reachable outputs; solvable right-hand sides |
| $N(\mathbf{A}) = \{\mathbf{x} : \mathbf{A}\mathbf{x} = \mathbf{0}\}$ | Null space: directions squashed to zero; unobservable state directions |
| $\operatorname{rank}(\mathbf{A})$ | Number of pivots $= \dim C(\mathbf{A})$; independent measurements |
| $\operatorname{rank}(\mathbf{A}) + \dim N(\mathbf{A}) = n$ | Rank–nullity; $n$ = number of columns |
| Pivot columns of the original $\mathbf{A}$ | A basis for the column space |
| One null vector per free column | A basis for the null space |
| $N(\mathbf{A}) \perp$ every row | Blind directions are perpendicular to every sensor axis |

The rank decides whether a square matrix can be inverted. The next lesson gives a single number that makes the same decision and tells you more — how much the map stretches volume, and whether it flips space into its mirror image. That number is the determinant.

::: context accelerometer What an accelerometer feels
An accelerometer is a small mass on a spring (or a tiny silicon version of one) inside a box. When the box is pushed, the mass lags behind and stretches the spring, and the stretch is read out as a number.

It feels every push except gravity, because gravity pulls the mass and the box equally. Engineers call what it measures **specific force**. Sitting on the launch pad, it reads about $9.81\,\mathrm{m/s^2}$ upward — the push of the pad holding the rocket up. In free fall, coasting in orbit, it reads zero. A single-axis accelerometer measures only the part of that push along its own sensitive axis, which is why a vehicle needs several.
:::

::: context star-tracker A camera that knows the sky
A star tracker is a small camera with a catalog of star positions in its memory. It photographs a patch of sky, matches the pattern of bright dots to the catalog, and works out which way the spacecraft is pointing, often to a few thousandths of a degree.

A single tracker is weak at telling the roll about its own line of sight, so many spacecraft carry two or three pointed in different directions. A second tracker aimed the same way as the first adds a spare, but not a new view — the same idea as a dependent column.
:::

::: context kalman-covariance The filter's own doubt
A Kalman filter is the estimator that blends a model of motion with noisy sensor readings. Alongside its best guess of the state it carries a **covariance** matrix: a record of how unsure it is in each direction, and how those doubts are linked.

Each good measurement shrinks the doubt along the directions the sensor can see. Along a null-space direction, measurements carry no information, so the doubt there stays put or grows. Watching the covariance refuse to shrink is how engineers often discover a blind direction they did not know they had.
:::

::: context span-plane Two arrows make a plane
Here is the first example of this lesson drawn flat, on the plane the three vectors share. $\mathbf{v}_1$ and $\mathbf{v}_2$ happen to be at right angles ($\mathbf{v}_1\cdot\mathbf{v}_2 = 2 - 2 + 0 = 0$), with lengths $\sqrt{14} \approx 3.74$ and $\sqrt{5} \approx 2.24$. Going two lengths of $\mathbf{v}_1$ and then one of $\mathbf{v}_2$ lands exactly on the tip of $\mathbf{v}_3$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="sp-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="sp-o" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#f2b880"/></marker>
    <marker id="sp-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
  </defs>
  <rect x="20" y="40" width="320" height="150" fill="#fff" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="175" x2="171" y2="175" stroke="#1d6fd1" stroke-width="3" marker-end="url(#sp-b)"/>
  <line x1="171" y1="175" x2="302" y2="175" stroke="#8fb8f0" stroke-width="3" marker-end="url(#sp-b)"/>
  <line x1="40" y1="175" x2="40" y2="97" stroke="#f2b880" stroke-width="3" marker-end="url(#sp-o)"/>
  <line x1="302" y1="175" x2="302" y2="97" stroke="#f2b880" stroke-width="3" stroke-dasharray="6 4" marker-end="url(#sp-o)"/>
  <line x1="40" y1="175" x2="302" y2="97" stroke="#b4232c" stroke-width="3" marker-end="url(#sp-r)"/>
  <circle cx="40" cy="175" r="3" fill="#1f2a44"/>
  <g font-size="12" fill="#1f2a44">
    <text x="95" y="192">v₁</text><text x="220" y="192">v₁ again</text>
    <text x="46" y="110">v₂</text><text x="310" y="140">v₂</text>
    <text x="150" y="122" fill="#b4232c">v₃ = 2v₁ + v₂</text>
    <text x="28" y="30">the plane spanned by v₁ and v₂ (seen face-on)</text>
  </g>
</svg>
```

Nothing you build from these three arrows can leave that plane.
:::

::: context basis-recipe Coordinates are a recipe
Think of a basis as a set of ingredients and the coordinates as the recipe: "two cups of $\mathbf{v}_1$, one cup of $\mathbf{v}_2$". Independence means no ingredient can be mixed from the others, so every dish has exactly one recipe. Spanning means the pantry is complete, so every dish in the subspace has *some* recipe.

Change the pantry and the recipe changes, even though the dish is the same. That is all a change of reference frame is, and the change-of-basis lesson later in this module builds the matrix that rewrites the recipe.
:::

::: context residual-monitor Catching a lying sensor
When a vehicle carries more sensors than it strictly needs, the extra readings must agree with one another in fixed ways — like the rule $y_3 = 0.35\,y_1 + 0.75\,y_2$ in this lesson's sensor example. Flight software computes how far the readings miss those rules. That miss is the **residual**, and the rules are sometimes called **parity relations**.

Near zero, all is well. A residual that grows and stays large points to a failing sensor, and with enough spare sensors the software can also work out which one and switch it off. This is why crewed spacecraft and airliners fly redundant inertial units.
:::

::: context observability-word Where "observable" comes from
The engineer Rudolf Kálmán made the ideas of **observability** and **controllability** precise around 1960, the same years he developed the filter that carries his name. A system is observable when its sensors, watched over time, pin down its whole state.

The word is used exactly as in everyday English: an unobservable direction is one you cannot observe. What Kálmán added was a test you can compute — rank and null space, the tools of this lesson, applied to a stacked matrix.
:::

::: context rank-nullity-picture Counting the columns twice
Here are the four columns of this lesson's $3 \times 4$ example after elimination. Two have pivots and two are free. Every column is one or the other, so the two counts must add up to the number of columns.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="40" y="30" width="60" height="60" fill="#8fb8f0"/>
    <rect x="110" y="30" width="60" height="60" fill="#f2b880"/>
    <rect x="180" y="30" width="60" height="60" fill="#8fb8f0"/>
    <rect x="250" y="30" width="60" height="60" fill="#f2b880"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="22">column 1</text><text x="140" y="22">column 2</text><text x="210" y="22">column 3</text><text x="280" y="22">column 4</text>
    <text x="70" y="65">pivot</text><text x="140" y="65">free</text><text x="210" y="65">pivot</text><text x="280" y="65">free</text>
    <text x="100" y="118" fill="#1d6fd1">2 pivots = rank 2</text>
    <text x="250" y="118">2 free = nullity 2</text>
    <text x="180" y="142" font-weight="700">2 + 2 = 4 columns</text>
  </g>
</svg>
```

Each free column hands you one null-space vector, which is why the free count is the null space's dimension.
:::

::: context planar-sensors Three sensors, one flat plane
Seen from above, the three sensor axes of the example fan out in the body $xy$-plane at $0^\circ$, about $36.9^\circ$ and about $53.1^\circ$ from the $x$ axis. The $z$ axis points straight out of the page, at right angles to all three, so none of them feels any of $f_z$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <defs><marker id="ps-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker></defs>
  <line x1="60" y1="160" x2="180" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="160" x2="60" y2="40" stroke="#6c7a93" stroke-width="1"/>
  <text x="186" y="164" font-size="12" fill="#6c7a93">x</text>
  <text x="56" y="34" font-size="12" fill="#6c7a93">y</text>
  <line x1="60" y1="160" x2="170" y2="160" stroke="#1d6fd1" stroke-width="3" marker-end="url(#ps-b)"/>
  <line x1="60" y1="160" x2="148" y2="94" stroke="#1d6fd1" stroke-width="3" marker-end="url(#ps-b)"/>
  <line x1="60" y1="160" x2="126" y2="72" stroke="#1d6fd1" stroke-width="3" marker-end="url(#ps-b)"/>
  <g font-size="12" fill="#1d6fd1"><text x="150" y="178">u₁</text><text x="154" y="94">u₃</text><text x="130" y="66">u₂</text></g>
  <circle cx="60" cy="160" r="9" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <circle cx="60" cy="160" r="3" fill="#b4232c"/>
  <text x="18" y="184" font-size="12" fill="#b4232c">z: out of the page</text>
  <g font-size="12" fill="#1f2a44">
    <text x="210" y="80">all three axes lie</text>
    <text x="210" y="96">in the xy-plane</text>
    <text x="210" y="124" fill="#b4232c">f_z is invisible:</text>
    <text x="210" y="140" fill="#b4232c">the null space</text>
  </g>
</svg>
```

Tip any one axis up out of the plane and the blind spot disappears.
:::

::: context svd-bridge A dimmer switch instead of an on-off switch
Rank by counting pivots is an on-off switch: a column is either independent or it is not. Real sensors are never perfectly lined up, so the useful question is *how nearly* dependent the columns are.

The singular value decomposition, in Linear Algebra II, answers with a list of numbers — one per direction — saying how strongly the matrix responds in that direction. A value near zero marks a direction that is nearly blind. `numpy.linalg.matrix_rank` counts the values above a small tolerance and calls that count the rank.
:::
