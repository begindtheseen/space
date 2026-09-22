---
id: l02-matrices-as-linear-maps
title: Matrices as linear maps
minutes: 21
covers:
  - matrix multiplication as composition of maps
  - identity, inverse, transpose
---

A matrix is a rectangular table of numbers, and if that is all you see when you look at one, the rest of this module will be a set of arbitrary rules to memorise. The alternative view — the one this module exists to install — is that a matrix is a *machine*: it takes in a vector and puts out a vector, and it does so linearly. The numbers in the table are a description of the machine, not the machine itself. Every rule for manipulating matrices, from the strange definition of multiplication to the order-reversing behaviour of the inverse, follows in one or two lines once you think in terms of what the machine does.

On a vehicle, matrices are the machines that move information between representations. A direction cosine matrix takes body-frame components of a vector and returns inertial-frame components. A state-transition matrix takes the navigation state now and returns the state one step later. A measurement matrix takes a state and returns what the sensors would read. A gain matrix takes a measurement residual and returns a correction to the state. A flight computer spends most of its arithmetic multiplying such matrices by vectors and by each other.

This lesson defines the machine, shows why multiplying two matrices means running one machine after the other, and then introduces the three companions of every matrix: the identity, which does nothing; the transpose, which reads the table sideways; and the inverse, which undoes the machine when undoing is possible.

## A matrix is a rule for forming linear combinations

Take an $m \times n$ matrix $\mathbf{A}$: $m$ rows and $n$ columns, entry $A_{ij}$ in row $i$ and column $j$. Feed it a vector $\mathbf{x} \in \mathbb{R}^n$. The product $\mathbf{A}\mathbf{x}$ is defined as the linear combination of the columns of $\mathbf{A}$ with the components of $\mathbf{x}$ as weights. Writing $\mathbf{a}_1, \dots, \mathbf{a}_n$ for the columns,

$$
\mathbf{A}\mathbf{x} = x_1\,\mathbf{a}_1 + x_2\,\mathbf{a}_2 + \cdots + x_n\,\mathbf{a}_n .
$$

Each column has $m$ components, so the result lives in $\mathbb{R}^m$. That is the **column picture**: the matrix is a rule that takes $n$ weights and returns the corresponding combination of $n$ fixed vectors. The matrix maps $\mathbb{R}^n$ to $\mathbb{R}^m$, and the dimensions are read "rows by columns", so an $m \times n$ matrix eats vectors of length $n$ and produces vectors of length $m$.

There is an equivalent **row picture**. Component $i$ of $\mathbf{A}\mathbf{x}$ collects the $i$-th entry of every column, weighted:

$$
(\mathbf{A}\mathbf{x})_i = \sum_{j=1}^{n} A_{ij}\,x_j ,
$$

which is the dot product of row $i$ with $\mathbf{x}$. A measurement matrix $\mathbf{H}$ is best read this way: each row is one sensor, and the sensor's reading is that row dotted with the state. A direction cosine matrix is best read by columns, as you will see in the change-of-basis lesson. Both pictures describe the same product; choose whichever makes the matrix in front of you make sense.

### Linearity, and why every linear map is a matrix

From the definition, two properties follow at once. Scaling the input scales the output, $\mathbf{A}(c\,\mathbf{x}) = c\,\mathbf{A}\mathbf{x}$, and the map respects addition, $\mathbf{A}(\mathbf{x} + \mathbf{y}) = \mathbf{A}\mathbf{x} + \mathbf{A}\mathbf{y}$, because each component of the output is a sum of products in which $\mathbf{x}$ appears once. Together these say

$$
\mathbf{A}(\alpha\,\mathbf{x} + \beta\,\mathbf{y}) = \alpha\,\mathbf{A}\mathbf{x} + \beta\,\mathbf{A}\mathbf{y} ,
$$

and a map with this property is called **linear**. It sends straight lines to straight lines, the origin to the origin, and evenly spaced points to evenly spaced points.

The converse is the deeper fact. Suppose $f$ is *any* linear map from $\mathbb{R}^n$ to $\mathbb{R}^m$ — a rotation, a projection onto a plane, a rule that reads three accelerometers. Write the input in terms of the standard basis vectors $\mathbf{e}_j$ (all zeros except a one in slot $j$): $\mathbf{x} = \sum_j x_j\,\mathbf{e}_j$. Linearity gives

$$
f(\mathbf{x}) = f\Big(\sum_j x_j\,\mathbf{e}_j\Big) = \sum_j x_j\,f(\mathbf{e}_j) .
$$

The output is a linear combination of the $n$ fixed vectors $f(\mathbf{e}_j)$ with weights $x_j$. That is exactly $\mathbf{A}\mathbf{x}$ for the matrix whose $j$-th column is $f(\mathbf{e}_j)$. So a linear map is completely determined by where it sends the basis vectors, and its matrix is those images written side by side. When you need the matrix of some geometric operation, this is how you find it: work out what happens to $\hat{\mathbf{x}}$, $\hat{\mathbf{y}}$, $\hat{\mathbf{z}}$ and write the answers down as columns.

::: example The matrix of a rotation in the plane
Rotate the plane anticlockwise through an angle $\theta$. The basis vector $\mathbf{e}_1 = (1, 0)^T$ goes to $(\cos\theta, \sin\theta)^T$ — the point at angle $\theta$ on the unit circle. The basis vector $\mathbf{e}_2 = (0, 1)^T$ starts at angle $90°$ and ends at angle $90° + \theta$, which is $(\cos(90° + \theta), \sin(90° + \theta))^T = (-\sin\theta, \cos\theta)^T$. Writing the two images as columns,

$$
\mathbf{R}(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}.
$$

For $\theta = 45°$, $\cos\theta = \sin\theta = 0.7071$, and the vector $(2, 1)^T$ maps to $2\,(0.7071, 0.7071)^T + 1\,(-0.7071, 0.7071)^T = (0.7071, 2.121)^T$. Its length is $\sqrt{0.5 + 4.5} = \sqrt{5}$, the same as the input's — a rotation does not change lengths, which is the first thing you should check of any matrix that claims to be one.
:::

## Multiplication is composition

Now run two machines in sequence. Let $\mathbf{B}$ be $p \times n$ and $\mathbf{A}$ be $m \times p$, so that $\mathbf{B}$ takes $\mathbb{R}^n$ to $\mathbb{R}^p$ and $\mathbf{A}$ takes $\mathbb{R}^p$ onward to $\mathbb{R}^m$. Feeding $\mathbf{x}$ through $\mathbf{B}$ first and then $\mathbf{A}$ gives $\mathbf{A}(\mathbf{B}\mathbf{x})$. Is this combined operation itself a matrix? It is linear, because a linear map of a linear map is linear:

$$
\mathbf{A}(\mathbf{B}(\alpha\mathbf{x} + \beta\mathbf{y})) = \mathbf{A}(\alpha\,\mathbf{B}\mathbf{x} + \beta\,\mathbf{B}\mathbf{y}) = \alpha\,\mathbf{A}\mathbf{B}\mathbf{x} + \beta\,\mathbf{A}\mathbf{B}\mathbf{y} .
$$

So by the previous section it has a matrix, and we *define* the product $\mathbf{A}\mathbf{B}$ to be that matrix:

$$
(\mathbf{A}\mathbf{B})\,\mathbf{x} = \mathbf{A}\,(\mathbf{B}\,\mathbf{x}) \quad \text{for every } \mathbf{x}.
$$

Everything about matrix multiplication follows from this one requirement. The columns of $\mathbf{A}\mathbf{B}$ are the images of the basis vectors, and $\mathbf{B}\mathbf{e}_j$ is the $j$-th column $\mathbf{b}_j$ of $\mathbf{B}$, so

$$
\text{column } j \text{ of } \mathbf{A}\mathbf{B} = \mathbf{A}\,\mathbf{b}_j .
$$

Entry $i$ of that column is row $i$ of $\mathbf{A}$ dotted with $\mathbf{b}_j$:

$$
(\mathbf{A}\mathbf{B})_{ij} = \sum_{k=1}^{p} A_{ik}\,B_{kj} .
$$

That is the "row times column" recipe you may have memorised. It is not arbitrary: it is the only recipe for which the product matrix does what $\mathbf{B}$-then-$\mathbf{A}$ does. The dimensions also explain themselves. The output of $\mathbf{B}$ has $p$ components and must fit the input of $\mathbf{A}$, which takes $p$ components, so the inner dimensions must agree; the result is $m \times n$, the outer dimensions.

### Order, associativity and reading direction

Because $\mathbf{A}\mathbf{B}$ means "$\mathbf{B}$ first, then $\mathbf{A}$", matrix products are read **right to left**, in the direction the data flows. Doing the machines in the other order is a different operation, and so in general

$$
\mathbf{A}\mathbf{B} \ne \mathbf{B}\mathbf{A}.
$$

A concrete pair: $\mathbf{A} = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$ and $\mathbf{B} = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$, where $\mathbf{B}$ swaps the two components. Then $\mathbf{A}\mathbf{B} = \begin{pmatrix} 2 & 1 \\ 4 & 3 \end{pmatrix}$, which is $\mathbf{A}$ with its columns swapped (swap the input first, then apply $\mathbf{A}$), while $\mathbf{B}\mathbf{A} = \begin{pmatrix} 3 & 4 \\ 1 & 2 \end{pmatrix}$, which is $\mathbf{A}$ with its rows swapped (apply $\mathbf{A}$, then swap the output). Both are sensible; they are different.

Multiplication *is* associative: $(\mathbf{A}\mathbf{B})\mathbf{C} = \mathbf{A}(\mathbf{B}\mathbf{C})$, because both sides describe "do $\mathbf{C}$, then $\mathbf{B}$, then $\mathbf{A}$", and there is only one such machine. That is why you can write $\mathbf{A}\mathbf{B}\mathbf{C}$ without brackets. It is also distributive, $\mathbf{A}(\mathbf{B} + \mathbf{C}) = \mathbf{A}\mathbf{B} + \mathbf{A}\mathbf{C}$, by linearity.

The cost matters on a flight computer. A matrix–vector product with an $n \times n$ matrix takes $n^2$ multiply-adds; a matrix–matrix product takes $n^3$. For a 15-state filter that is 225 versus 3375 operations, and for a chain $\mathbf{A}\mathbf{B}\mathbf{x}$ you should compute $\mathbf{A}(\mathbf{B}\mathbf{x})$ — two cheap matrix–vector products — rather than form $\mathbf{A}\mathbf{B}$ first. Associativity guarantees the same answer either way.

::: example Two rotations make a rotation
Rotate the plane by $45°$ and then by a further $30°$. The combined machine is $\mathbf{R}(30°)\,\mathbf{R}(45°)$ — the $45°$ rotation is on the right because it acts first. With $\cos 30° = 0.8660$, $\sin 30° = 0.5$ and $\cos 45° = \sin 45° = 0.7071$,

$$
\mathbf{R}(30°)\,\mathbf{R}(45°) = \begin{pmatrix} 0.8660 & -0.5 \\ 0.5 & 0.8660 \end{pmatrix}\begin{pmatrix} 0.7071 & -0.7071 \\ 0.7071 & 0.7071 \end{pmatrix} = \begin{pmatrix} 0.2588 & -0.9659 \\ 0.9659 & 0.2588 \end{pmatrix}.
$$

The top-left entry is $0.8660 \times 0.7071 - 0.5 \times 0.7071 = 0.2588$, which is $\cos 75°$; the bottom-left is $0.5 \times 0.7071 + 0.8660 \times 0.7071 = 0.9659 = \sin 75°$. The product is $\mathbf{R}(75°)$, as geometry demands. Carried out symbolically, the same multiplication gives the top-left entry $\cos\alpha\cos\beta - \sin\alpha\sin\beta$, which is the angle-addition formula for $\cos(\alpha + \beta)$: the trigonometric identities are the statement that rotations compose. In the plane the two rotations happen to commute; in three dimensions, as the change-of-basis lesson shows, they do not.
:::

::: example Coasting for ten seconds, then five
Along one axis, a vehicle in free coast has position $r$ and velocity $v$, and after a time $\Delta t$ the new state is $r + v\,\Delta t$ and $v$. That is a linear map of the state $(r, v)^T$, with matrix

$$
\boldsymbol{\Phi}(\Delta t) = \begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix},
$$

called the state-transition matrix. From $r = 6\,897\,800\ \mathrm{m}$, $v = 7611\ \mathrm{m/s}$, ten seconds of coast gives $\boldsymbol{\Phi}(10)\,(r, v)^T = (6\,897\,800 + 76\,110,\ 7611)^T = (6\,973\,910\ \mathrm{m},\ 7611\ \mathrm{m/s})^T$.

Coasting ten seconds and then five more is the composition $\boldsymbol{\Phi}(5)\,\boldsymbol{\Phi}(10)$:

$$
\begin{pmatrix} 1 & 5 \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 1 & 10 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 1 & 15 \\ 0 & 1 \end{pmatrix} = \boldsymbol{\Phi}(15),
$$

fifteen seconds of coast, as it must be. Every state-transition matrix you meet in the Kalman-filter modules obeys this rule, $\boldsymbol{\Phi}(t_2, t_1)\,\boldsymbol{\Phi}(t_1, t_0) = \boldsymbol{\Phi}(t_2, t_0)$, and it is nothing more than composition of maps.
:::

::: key Multiplication is composition
$(\mathbf{A}\mathbf{B})\mathbf{x} = \mathbf{A}(\mathbf{B}\mathbf{x})$: the product is the machine that runs $\mathbf{B}$ first, then $\mathbf{A}$. Read products right to left. Entry $(i, j)$ is row $i$ of $\mathbf{A}$ dotted with column $j$ of $\mathbf{B}$, and the inner dimensions must match. In general $\mathbf{A}\mathbf{B} \ne \mathbf{B}\mathbf{A}$.
:::

## The identity

The machine that does nothing has a matrix too: the **identity** $\mathbf{I}$, with ones on the diagonal and zeros elsewhere. Its $j$-th column is $\mathbf{e}_j$, because the do-nothing map sends each basis vector to itself. For every $\mathbf{x}$, $\mathbf{I}\mathbf{x} = \mathbf{x}$, and for every matrix of compatible size,

$$
\mathbf{I}\mathbf{A} = \mathbf{A}\mathbf{I} = \mathbf{A}.
$$

When the size needs saying, write $\mathbf{I}_n$ for the $n \times n$ identity. The identity is the reference against which other matrices are judged: a rotation matrix that has drifted through round-off is checked by how far $\mathbf{R}^T\mathbf{R}$ is from $\mathbf{I}$, and a state-transition matrix over a short step is $\mathbf{I}$ plus a small correction.

## The transpose

The **transpose** $\mathbf{A}^T$ of an $m \times n$ matrix is the $n \times m$ matrix obtained by flipping it across its main diagonal:

$$
(\mathbf{A}^T)_{ij} = A_{ji} .
$$

Rows become columns and columns become rows. Transposing twice returns the original, $(\mathbf{A}^T)^T = \mathbf{A}$, and the transpose of a sum is the sum of the transposes. A column vector $\mathbf{a} \in \mathbb{R}^n$ is an $n \times 1$ matrix, so $\mathbf{a}^T$ is a $1 \times n$ **row vector**, which is what the notation $(a_1, a_2, a_3)^T$ in the previous lesson was using: a row written out, transposed back into a column.

The transpose earns its place through the dot product. The matrix product of a $1 \times n$ row with an $n \times 1$ column is a $1 \times 1$ matrix — a scalar — and its single entry is $\sum_i a_i b_i$. So

$$
\mathbf{a}^T\mathbf{b} = \mathbf{a}\cdot\mathbf{b}, \qquad \mathbf{a}^T\mathbf{a} = \|\mathbf{a}\|_2^2 .
$$

This lets every dot product be written as a matrix product and manipulated with the same rules. The expression $\mathbf{x}^T\mathbf{A}\mathbf{y}$ is a scalar, the dot product of $\mathbf{x}$ with $\mathbf{A}\mathbf{y}$, and $\mathbf{x}^T\mathbf{P}\mathbf{x}$ — a **quadratic form** — is how a covariance matrix $\mathbf{P}$ turns a state error $\mathbf{x}$ into a scalar measure of its size. The product in the other order, $\mathbf{a}\,\mathbf{b}^T$, is an $n \times n$ matrix, the **outer product**, with entries $a_i b_j$; you will meet it when building projections.

### The transpose of a product reverses the order

Compute entry $(i, j)$ of $(\mathbf{A}\mathbf{B})^T$ from the definitions:

$$
\big((\mathbf{A}\mathbf{B})^T\big)_{ij} = (\mathbf{A}\mathbf{B})_{ji} = \sum_k A_{jk}\,B_{ki} = \sum_k (\mathbf{B}^T)_{ik}\,(\mathbf{A}^T)_{kj} = (\mathbf{B}^T\mathbf{A}^T)_{ij} .
$$

Therefore

$$
(\mathbf{A}\mathbf{B})^T = \mathbf{B}^T\mathbf{A}^T .
$$

The order reverses. You can see why from dimensions alone: if $\mathbf{A}$ is $m \times p$ and $\mathbf{B}$ is $p \times n$, then $\mathbf{A}^T\mathbf{B}^T$ would try to multiply $p \times m$ by $n \times p$, which is not even defined unless $m = n$. With the pair $\mathbf{A}$, $\mathbf{B}$ from the order example, $(\mathbf{A}\mathbf{B})^T = \begin{pmatrix} 2 & 4 \\ 1 & 3 \end{pmatrix}$, and $\mathbf{B}^T\mathbf{A}^T = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}\begin{pmatrix} 1 & 3 \\ 2 & 4 \end{pmatrix} = \begin{pmatrix} 2 & 4 \\ 1 & 3 \end{pmatrix}$, the same.

A matrix equal to its own transpose, $\mathbf{S}^T = \mathbf{S}$, is **symmetric**. Covariance matrices, inertia tensors and the normal-equation matrix $\mathbf{A}^T\mathbf{A}$ of least squares are symmetric; the last one because $(\mathbf{A}^T\mathbf{A})^T = \mathbf{A}^T(\mathbf{A}^T)^T = \mathbf{A}^T\mathbf{A}$. A matrix with $\mathbf{S}^T = -\mathbf{S}$ is **skew-symmetric**, and the final lesson of this module is about the most important one.

## The inverse

If a square matrix $\mathbf{A}$ maps $\mathbf{x}$ to $\mathbf{y} = \mathbf{A}\mathbf{x}$, the natural question is whether a machine exists that maps $\mathbf{y}$ back to $\mathbf{x}$. When it does, it is linear, so it has a matrix, written $\mathbf{A}^{-1}$ and called the **inverse**. Undoing after doing, or doing after undoing, leaves everything unchanged:

$$
\mathbf{A}^{-1}\mathbf{A} = \mathbf{A}\mathbf{A}^{-1} = \mathbf{I} .
$$

Not every matrix has one. If $\mathbf{A}$ sends two different inputs to the same output — a projection that flattens $\mathbb{R}^3$ onto a plane, say — no machine can tell from the output which input it came from, and there is no inverse. Such a matrix is called **singular**; a matrix with an inverse is **invertible** or **nonsingular**. Only square matrices can be invertible in this two-sided sense, and the tests for whether a square matrix is — independent columns, nonzero determinant — are the business of two later lessons. When the inverse exists it is unique, and it solves the linear system: from $\mathbf{A}\mathbf{x} = \mathbf{b}$, multiply on the left by $\mathbf{A}^{-1}$ to get $\mathbf{x} = \mathbf{A}^{-1}\mathbf{b}$.

### The inverse of a product also reverses the order

To undo "$\mathbf{B}$ then $\mathbf{A}$", you must undo $\mathbf{A}$ first and then $\mathbf{B}$ — take off your boots before your socks. The claim is $(\mathbf{A}\mathbf{B})^{-1} = \mathbf{B}^{-1}\mathbf{A}^{-1}$, and the check is one line:

$$
(\mathbf{A}\mathbf{B})(\mathbf{B}^{-1}\mathbf{A}^{-1}) = \mathbf{A}\,(\mathbf{B}\mathbf{B}^{-1})\,\mathbf{A}^{-1} = \mathbf{A}\,\mathbf{I}\,\mathbf{A}^{-1} = \mathbf{I} .
$$

The transpose and the inverse also commute with each other. Transpose both sides of $\mathbf{A}^{-1}\mathbf{A} = \mathbf{I}$ using the product rule: $\mathbf{A}^T(\mathbf{A}^{-1})^T = \mathbf{I}^T = \mathbf{I}$, which says that $(\mathbf{A}^{-1})^T$ is the inverse of $\mathbf{A}^T$:

$$
(\mathbf{A}^T)^{-1} = (\mathbf{A}^{-1})^T .
$$

### The two-by-two inverse

For a $2 \times 2$ matrix there is a closed form worth knowing. Seek $\mathbf{X}$ with $\mathbf{A}\mathbf{X} = \mathbf{I}$ for $\mathbf{A} = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$. Try $\mathbf{X} = \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$ — the diagonal swapped, the off-diagonal negated — and multiply:

$$
\begin{pmatrix} a & b \\ c & d \end{pmatrix}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix} = \begin{pmatrix} ad - bc & -ab + ba \\ cd - dc & -cb + da \end{pmatrix} = (ad - bc)\,\mathbf{I} .
$$

Dividing by the scalar $ad - bc$ gives the inverse, provided that scalar is not zero:

$$
\mathbf{A}^{-1} = \frac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}.
$$

The quantity $ad - bc$ is the determinant of $\mathbf{A}$, and the determinant lesson explains why its vanishing is exactly the condition for singularity in any dimension. For the rotation $\mathbf{R}(\theta)$, $ad - bc = \cos^2\theta + \sin^2\theta = 1$ and the formula gives $\mathbf{R}(\theta)^{-1} = \begin{pmatrix} \cos\theta & \sin\theta \\ -\sin\theta & \cos\theta \end{pmatrix} = \mathbf{R}(-\theta)$, which is also $\mathbf{R}(\theta)^T$. Undoing a rotation is rotating back, and for rotations the inverse is free: it is the transpose. The orthogonality lesson shows that this holds for every rotation in any dimension.

::: example Inverting a two-by-two matrix
Let $\mathbf{A} = \begin{pmatrix} 4 & 7 \\ 2 & 6 \end{pmatrix}$. Then $ad - bc = 24 - 14 = 10$, and

$$
\mathbf{A}^{-1} = \frac{1}{10}\begin{pmatrix} 6 & -7 \\ -2 & 4 \end{pmatrix} = \begin{pmatrix} 0.6 & -0.7 \\ -0.2 & 0.4 \end{pmatrix}.
$$

Check by multiplying: the top-left entry of $\mathbf{A}\mathbf{A}^{-1}$ is $4 \times 0.6 + 7 \times (-0.2) = 2.4 - 1.4 = 1$; the top-right is $4 \times (-0.7) + 7 \times 0.4 = -2.8 + 2.8 = 0$; the bottom row gives $2 \times 0.6 + 6 \times (-0.2) = 0$ and $2 \times (-0.7) + 6 \times 0.4 = 1$. The product is $\mathbf{I}$. To solve $\mathbf{A}\mathbf{x} = (1, 0)^T$, read off the first column of the inverse: $\mathbf{x} = (0.6, -0.2)^T$, and indeed $4 \times 0.6 + 7 \times (-0.2) = 1$ and $2 \times 0.6 + 6 \times (-0.2) = 0$.
:::

::: key Transpose and inverse of a product
$(\mathbf{A}\mathbf{B})^T = \mathbf{B}^T\mathbf{A}^T$ and $(\mathbf{A}\mathbf{B})^{-1} = \mathbf{B}^{-1}\mathbf{A}^{-1}$ — both reverse the order. Also $\mathbf{a}^T\mathbf{b} = \mathbf{a}\cdot\mathbf{b}$, $(\mathbf{A}^T)^{-1} = (\mathbf{A}^{-1})^T$, and a $2 \times 2$ matrix is inverted by swapping the diagonal, negating the off-diagonal and dividing by $ad - bc$.
:::

::: warning Do not invert a matrix to solve a system
Writing $\mathbf{x} = \mathbf{A}^{-1}\mathbf{b}$ is fine on paper. In code, forming $\mathbf{A}^{-1}$ and multiplying costs about three times as much as solving $\mathbf{A}\mathbf{x} = \mathbf{b}$ directly and loses accuracy on the way. Use a solver — the next lesson builds one — and reserve the explicit inverse for the rare case where you genuinely need the matrix itself.
:::

::: warning Elementwise is not matrix multiplication
In NumPy, `A * B` multiplies entry by entry and `A @ B` is the matrix product. The two agree only for scalars. A rotation applied with `*` produces a matrix of the right shape and completely wrong values, and nothing will warn you.
:::

```python
import numpy as np

th = np.radians(45.0)
R = np.array([[np.cos(th), -np.sin(th)],
              [np.sin(th),  np.cos(th)]])
v = np.array([2.0, 1.0])
print(R @ v)                 # [0.70710678 2.12132034]
print(np.allclose(R.T @ R, np.eye(2)))   # True: the transpose undoes a rotation
print(np.linalg.solve(R, R @ v))         # [2. 1.]  solve, do not invert
```

## Check yourself

::: check
$\mathbf{A}$ is $3 \times 5$ and $\mathbf{B}$ is $5 \times 2$. Which of $\mathbf{A}\mathbf{B}$, $\mathbf{B}\mathbf{A}$, $\mathbf{A}^T\mathbf{B}$ and $\mathbf{B}^T\mathbf{A}^T$ are defined, and what size is each?
:::

::: answer
$\mathbf{A}\mathbf{B}$ is defined (inner dimensions 5 and 5) and is $3 \times 2$. $\mathbf{B}\mathbf{A}$ would need the 2 columns of $\mathbf{B}$ to match the 3 rows of $\mathbf{A}$: not defined. $\mathbf{A}^T\mathbf{B}$ is $5 \times 3$ times $5 \times 2$: not defined. $\mathbf{B}^T\mathbf{A}^T$ is $2 \times 5$ times $5 \times 3$, defined and $2 \times 3$ — it is $(\mathbf{A}\mathbf{B})^T$, as the product rule for transposes says.
:::

::: check
A linear map in the plane sends $\mathbf{e}_1$ to $(3, 1)^T$ and $\mathbf{e}_2$ to $(-1, 2)^T$. Write its matrix and compute the image of $(2, -1)^T$.
:::

::: answer
The columns are the images of the basis vectors: $\mathbf{A} = \begin{pmatrix} 3 & -1 \\ 1 & 2 \end{pmatrix}$. The image of $(2, -1)^T$ is $2\,(3, 1)^T - 1\,(-1, 2)^T = (6 + 1, 2 - 2)^T = (7, 0)^T$.
:::

::: check
A gyro measures the body rate $\boldsymbol{\omega}$ through a misalignment matrix $\mathbf{M}$ and then a scale-factor matrix $\mathbf{S}$, so the raw output is $\mathbf{y} = \mathbf{S}\mathbf{M}\boldsymbol{\omega}$. Both are invertible. Write $\boldsymbol{\omega}$ in terms of $\mathbf{y}$ using the individual inverses, in the correct order.
:::

::: answer
$(\mathbf{S}\mathbf{M})^{-1} = \mathbf{M}^{-1}\mathbf{S}^{-1}$, so $\boldsymbol{\omega} = \mathbf{M}^{-1}\mathbf{S}^{-1}\mathbf{y}$. Reading right to left: undo the scale factors first (they were applied last), then the misalignment. Writing $\mathbf{S}^{-1}\mathbf{M}^{-1}\mathbf{y}$ would be wrong unless the two matrices happen to commute.
:::

::: check
Show that $\mathbf{x}^T\mathbf{A}\mathbf{y} = \mathbf{y}^T\mathbf{A}^T\mathbf{x}$ for any vectors $\mathbf{x}, \mathbf{y}$ and matrix $\mathbf{A}$ of compatible sizes. What does this say when $\mathbf{A}$ is symmetric?
:::

::: answer
$\mathbf{x}^T\mathbf{A}\mathbf{y}$ is a $1 \times 1$ matrix, so it equals its own transpose. Transposing the triple product reverses the order and transposes each factor: $(\mathbf{x}^T\mathbf{A}\mathbf{y})^T = \mathbf{y}^T\mathbf{A}^T(\mathbf{x}^T)^T = \mathbf{y}^T\mathbf{A}^T\mathbf{x}$. If $\mathbf{A}^T = \mathbf{A}$ this reads $\mathbf{x}^T\mathbf{A}\mathbf{y} = \mathbf{y}^T\mathbf{A}\mathbf{x}$: a symmetric matrix defines a symmetric pairing of vectors, which is what makes $\mathbf{x}^T\mathbf{P}\mathbf{x}$ a well-defined "squared size" for a covariance $\mathbf{P}$.
:::

::: check
Find the inverse of $\mathbf{C} = \begin{pmatrix} 2 & 5 \\ 1 & 3 \end{pmatrix}$, and use it to solve $\mathbf{C}\mathbf{x} = (1, 1)^T$.
:::

::: answer
$ad - bc = 6 - 5 = 1$, so $\mathbf{C}^{-1} = \begin{pmatrix} 3 & -5 \\ -1 & 2 \end{pmatrix}$. Then $\mathbf{x} = \mathbf{C}^{-1}(1, 1)^T = (3 - 5, -1 + 2)^T = (-2, 1)^T$. Check: $2(-2) + 5(1) = 1$ and $1(-2) + 3(1) = 1$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{A}\mathbf{x} = \sum_j x_j\,\mathbf{a}_j$ | Matrix–vector product: a linear combination of the columns |
| $(\mathbf{A}\mathbf{x})_i = \sum_j A_{ij} x_j$ | Row picture: each output component is a row dotted with $\mathbf{x}$ |
| Column $j$ of $\mathbf{A}$ is $f(\mathbf{e}_j)$ | The matrix of a linear map is the images of the basis vectors |
| $(\mathbf{A}\mathbf{B})\mathbf{x} = \mathbf{A}(\mathbf{B}\mathbf{x})$ | Multiplication is composition; read right to left |
| $(\mathbf{A}\mathbf{B})_{ij} = \sum_k A_{ik} B_{kj}$ | Entry recipe; $(m \times p)(p \times n) = m \times n$ |
| $\mathbf{I}$ | Identity: $\mathbf{I}\mathbf{A} = \mathbf{A}\mathbf{I} = \mathbf{A}$ |
| $(\mathbf{A}^T)_{ij} = A_{ji}$ | Transpose; $\mathbf{a}^T\mathbf{b} = \mathbf{a}\cdot\mathbf{b}$ |
| $(\mathbf{A}\mathbf{B})^T = \mathbf{B}^T\mathbf{A}^T$ | Transpose of a product reverses the order |
| $\mathbf{A}^{-1}\mathbf{A} = \mathbf{A}\mathbf{A}^{-1} = \mathbf{I}$ | Inverse; exists only for nonsingular square matrices |
| $(\mathbf{A}\mathbf{B})^{-1} = \mathbf{B}^{-1}\mathbf{A}^{-1}$ | Inverse of a product reverses the order |
| $\begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1} = \frac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$ | Two-by-two inverse |
| $\mathbf{R}(\theta)^{-1} = \mathbf{R}(\theta)^T$ | Undoing a rotation is free |

The next lesson takes up the problem the inverse only pretends to solve — finding $\mathbf{x}$ with $\mathbf{A}\mathbf{x} = \mathbf{b}$ — and builds the algorithm that actually does it: Gaussian elimination with partial pivoting, packaged as the LU factorisation.
