---
id: l02-matrices-as-linear-maps
title: Matrices as linear maps
minutes: 25
covers:
  - matrix multiplication as composition of maps
  - identity, inverse, transpose
---

A **[[matrix|matrix-word]]** is a rectangular table of numbers. If that is all you see when you look at one, the rest of this module will feel like a pile of arbitrary rules to memorize. There is a better way to see it, and this module exists to teach it: a matrix is a *machine*. You feed it a vector, and it hands you back a vector. The numbers in the table are the machine's instructions, not the machine itself. Every rule for working with matrices — the strange-looking way they multiply, the way the inverse flips the order of things — follows in a line or two once you ask what the machine does.

On a vehicle, matrices are the machines that move information from one form to another. A direction cosine matrix takes a vector's components in the body frame and returns its components in the inertial frame. A state-transition matrix takes the navigation state now and returns the state one step later. A measurement matrix takes a state and returns what the sensors would read. A gain matrix takes the gap between a measurement and its prediction and returns a correction to the state. A flight computer spends most of its arithmetic multiplying matrices like these by vectors and by each other.

This lesson builds the machine. It shows why multiplying two matrices means running one machine after the other. Then it introduces three companions every matrix has: the identity, which does nothing; the transpose, which reads the table sideways; and the inverse, which undoes the machine when undoing is possible.

## A matrix is a rule for forming linear combinations

Start in a bakery. A muffin takes 100 g of flour and 50 g of sugar. A cookie takes 30 g of flour and 20 g of sugar. Write each recipe as a column, and put the columns side by side:

$$
\mathbf{A} = \begin{pmatrix} 100 & 30 \\ 50 & 20 \end{pmatrix}.
$$

The top row is flour and the bottom row is sugar, in grams; the left column is a muffin and the right column is a cookie.

An order of 3 muffins and 4 cookies is the vector $\mathbf{x} = (3, 4)^T$. The shopping list is 3 muffin-columns plus 4 cookie-columns: flour $3 \times 100 + 4 \times 30 = 420$ g, sugar $3 \times 50 + 4 \times 20 = 230$ g. The table turned an order into a shopping list. That is a matrix acting on a vector.

Now the general rule. An $m \times n$ matrix $\mathbf{A}$ (read "m by n") has $m$ rows and $n$ columns. The entry in row $i$ and column $j$ is $A_{ij}$, read "A i j". Feed it a vector $\mathbf{x} \in \mathbb{R}^n$. The product $\mathbf{A}\mathbf{x}$ is *defined* as the linear combination of the columns of $\mathbf{A}$, using the components of $\mathbf{x}$ as the amounts. Calling the columns $\mathbf{a}_1, \dots, \mathbf{a}_n$,

$$
\mathbf{A}\mathbf{x} = x_1\,\mathbf{a}_1 + x_2\,\mathbf{a}_2 + \cdots + x_n\,\mathbf{a}_n .
$$

This is the **[[column picture|column-picture]]**: the matrix takes $n$ amounts and returns that mix of its $n$ fixed columns. Each column has $m$ components, so the answer lives in $\mathbb{R}^m$. The size is always said "rows by columns", so an $m \times n$ matrix eats vectors of length $n$ and produces vectors of length $m$. We say it **maps** $\mathbb{R}^n$ to $\mathbb{R}^m$.

There is an equal and opposite **row picture**. Component $i$ of the answer gathers the $i$-th entry of every column, each weighted by its amount:

$$
(\mathbf{A}\mathbf{x})_i = \sum_{j=1}^{n} A_{ij}\,x_j .
$$

That is the dot product of row $i$ with $\mathbf{x}$ — exactly how we got the flour total: row one, $(100, 30)$, dotted with $(3, 4)$. A **[[measurement matrix|measurement-matrix]]** $\mathbf{H}$ is best read this way: each row is one sensor, and that sensor's reading is its row dotted with the state. A direction cosine matrix is best read by columns, as the change-of-basis lesson shows. Both pictures give the same product. Use whichever makes the matrix in front of you make sense.

### Linearity, and why every linear map is a matrix

Two properties come straight from the definition. Scaling the input scales the output: $\mathbf{A}(c\,\mathbf{x}) = c\,\mathbf{A}\mathbf{x}$. Double the order, double the shopping list. And the machine respects addition: $\mathbf{A}(\mathbf{x} + \mathbf{y}) = \mathbf{A}\mathbf{x} + \mathbf{A}\mathbf{y}$. Two orders placed separately need the same flour as one combined order. Each output component is a sum of products in which $\mathbf{x}$ appears only once, to the first power, so both hold. Together they say

$$
\mathbf{A}(\alpha\,\mathbf{x} + \beta\,\mathbf{y}) = \alpha\,\mathbf{A}\mathbf{x} + \beta\,\mathbf{A}\mathbf{y} .
$$

A map with this property is called **linear**. It sends straight lines to straight lines, keeps the origin fixed, and sends evenly spaced points to evenly spaced points.

The surprise runs the other way. *Every* linear map is a matrix. Suppose $f$ is any linear map from $\mathbb{R}^n$ to $\mathbb{R}^m$ — a rotation, a flattening onto a plane, a rule that reads three accelerometers. Then $f$ is completely decided by where it sends the **standard basis vectors** $\mathbf{e}_j$: the vector of all zeros except a one in slot $j$. And its matrix is those images written side by side as columns:

$$
\text{column } j \text{ of the matrix of } f \;=\; f(\mathbf{e}_j) .
$$

This is how you find the matrix of any geometric operation. Work out what happens to $\hat{\mathbf{x}}$, $\hat{\mathbf{y}}$ and $\hat{\mathbf{z}}$, and write the answers down as columns.

::: note Why it has to be true
Any input can be written with the basis vectors: $\mathbf{x} = \sum_j x_j\,\mathbf{e}_j$. For example, $(3, 4)^T = 3\,\mathbf{e}_1 + 4\,\mathbf{e}_2$. Linearity lets you pull the sum and the numbers $x_j$ out through $f$:

$$
f(\mathbf{x}) = f\Big(\sum_j x_j\,\mathbf{e}_j\Big) = \sum_j x_j\,f(\mathbf{e}_j) .
$$

The right side is a linear combination of the $n$ fixed vectors $f(\mathbf{e}_j)$, with amounts $x_j$. By the column picture, that is exactly $\mathbf{A}\mathbf{x}$ for the matrix $\mathbf{A}$ whose $j$-th column is $f(\mathbf{e}_j)$.
:::

::: example The matrix of a rotation in the plane
Turn the whole plane [[counterclockwise|rotation-picture]] through an angle $\theta$. What is its matrix? Follow the two basis vectors.

**Where does $\mathbf{e}_1$ go?** $\mathbf{e}_1 = (1, 0)^T$ sits at angle $0$ on the unit circle. After turning, it sits at angle $\theta$, which is the point $(\cos\theta, \sin\theta)^T$.

**Where does $\mathbf{e}_2$ go?** $\mathbf{e}_2 = (0, 1)^T$ starts at angle $90°$ and ends at $90° + \theta$. That point is $(\cos(90° + \theta), \sin(90° + \theta))^T = (-\sin\theta, \cos\theta)^T$.

**Write the images as columns:**

$$
\mathbf{R}(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}.
$$

**Use it.** For $\theta = 45°$, $\cos\theta = \sin\theta = 0.7071$. The vector $(2, 1)^T$ maps to 2 of the first column plus 1 of the second:

$$
2\,(0.7071, 0.7071)^T + 1\,(-0.7071, 0.7071)^T = (0.7071, 2.121)^T .
$$

**Sanity check.** Its length is $\sqrt{0.7071^2 + 2.121^2} = \sqrt{0.5 + 4.5} = \sqrt{5}$, the same as the input's $\sqrt{2^2 + 1^2}$. A rotation must not change lengths — the first thing to check of any matrix that claims to be one.
:::

## Multiplication is composition

Now put two machines on one conveyor belt. Let $\mathbf{B}$ be $p \times n$ and $\mathbf{A}$ be $m \times p$. So $\mathbf{B}$ takes $\mathbb{R}^n$ to $\mathbb{R}^p$, and $\mathbf{A}$ takes $\mathbb{R}^p$ on to $\mathbb{R}^m$. Feed $\mathbf{x}$ through $\mathbf{B}$ first, then $\mathbf{A}$, and you get $\mathbf{A}(\mathbf{B}\mathbf{x})$.

Is the two-machine belt itself one matrix? It is linear, because a linear map of a linear map is linear:

$$
\mathbf{A}(\mathbf{B}(\alpha\mathbf{x} + \beta\mathbf{y})) = \mathbf{A}(\alpha\,\mathbf{B}\mathbf{x} + \beta\,\mathbf{B}\mathbf{y}) = \alpha\,\mathbf{A}\mathbf{B}\mathbf{x} + \beta\,\mathbf{A}\mathbf{B}\mathbf{y} .
$$

So by the previous section it has a matrix. We *define* the product $\mathbf{A}\mathbf{B}$ to be that matrix:

$$
(\mathbf{A}\mathbf{B})\,\mathbf{x} = \mathbf{A}\,(\mathbf{B}\,\mathbf{x}) \quad \text{for every } \mathbf{x}.
$$

Everything about matrix multiplication follows from this one sentence. Find the columns of $\mathbf{A}\mathbf{B}$ the usual way — send in each basis vector. $\mathbf{B}\mathbf{e}_j$ is the $j$-th column of $\mathbf{B}$, call it $\mathbf{b}_j$. Then $\mathbf{A}$ acts on it. So

$$
\text{column } j \text{ of } \mathbf{A}\mathbf{B} = \mathbf{A}\,\mathbf{b}_j .
$$

By the row picture, entry $i$ of that column is row $i$ of $\mathbf{A}$ dotted with $\mathbf{b}_j$:

$$
(\mathbf{A}\mathbf{B})_{ij} = \sum_{k=1}^{p} A_{ik}\,B_{kj} .
$$

That is the "row times column" recipe you may have learned by rote. It is not arbitrary. It is the only recipe for which the product does what "$\mathbf{B}$, then $\mathbf{A}$" does.

The sizes explain themselves too. $\mathbf{B}$ puts out $p$ components, and $\mathbf{A}$ must accept exactly $p$ components, so the inner sizes must agree. The result goes from $n$ components to $m$, so it is $m \times n$ — the outer sizes.

### Order, associativity and reading direction

Because $\mathbf{A}\mathbf{B}$ means "$\mathbf{B}$ first, then $\mathbf{A}$", matrix products are **[[read right to left|right-to-left]]**, the way the data flows. Running the machines in the other order is a different job, so in general

$$
\mathbf{A}\mathbf{B} \ne \mathbf{B}\mathbf{A}.
$$

A concrete pair: $\mathbf{A} = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$ and $\mathbf{B} = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$, where $\mathbf{B}$ swaps the two components of whatever it is fed.

- $\mathbf{A}\mathbf{B} = \begin{pmatrix} 2 & 1 \\ 4 & 3 \end{pmatrix}$: swap the input first, then apply $\mathbf{A}$. The result is $\mathbf{A}$ with its *columns* swapped.
- $\mathbf{B}\mathbf{A} = \begin{pmatrix} 3 & 4 \\ 1 & 2 \end{pmatrix}$: apply $\mathbf{A}$, then swap the output. The result is $\mathbf{A}$ with its *rows* swapped.

Both are sensible. They are different.

Multiplication *is* **associative**: $(\mathbf{A}\mathbf{B})\mathbf{C} = \mathbf{A}(\mathbf{B}\mathbf{C})$. Both sides describe "do $\mathbf{C}$, then $\mathbf{B}$, then $\mathbf{A}$", and there is only one such machine. That is why you may write $\mathbf{A}\mathbf{B}\mathbf{C}$ with no brackets. It is also **distributive**, $\mathbf{A}(\mathbf{B} + \mathbf{C}) = \mathbf{A}\mathbf{B} + \mathbf{A}\mathbf{C}$, by linearity.

The cost matters on a flight computer. A matrix–vector product with an $n \times n$ matrix takes $n^2$ multiply-adds. A matrix–matrix product takes $n^3$. For a 15-state **[[navigation filter|operation-count]]** that is 225 against 3375. So for a chain $\mathbf{A}\mathbf{B}\mathbf{x}$, compute $\mathbf{A}(\mathbf{B}\mathbf{x})$ — two cheap matrix–vector products — rather than forming $\mathbf{A}\mathbf{B}$ first. Associativity promises the same answer either way.

::: example Two rotations make a rotation
Rotate the plane by $45°$, then by a further $30°$. The combined machine is $\mathbf{R}(30°)\,\mathbf{R}(45°)$. The $45°$ rotation sits on the right because it acts first. Use $\cos 30° = 0.8660$, $\sin 30° = 0.5$ and $\cos 45° = \sin 45° = 0.7071$:

$$
\mathbf{R}(30°)\,\mathbf{R}(45°) = \begin{pmatrix} 0.8660 & -0.5 \\ 0.5 & 0.8660 \end{pmatrix}\begin{pmatrix} 0.7071 & -0.7071 \\ 0.7071 & 0.7071 \end{pmatrix} = \begin{pmatrix} 0.2588 & -0.9659 \\ 0.9659 & 0.2588 \end{pmatrix}.
$$

**Two entries in full.** Top-left is row 1 dotted with column 1: $0.8660 \times 0.7071 + (-0.5) \times 0.7071 = 0.6124 - 0.3536 = 0.2588$. Bottom-left is row 2 dotted with column 1: $0.5 \times 0.7071 + 0.8660 \times 0.7071$. Both terms share the factor $0.7071$, so this is $(0.5 + 0.8660) \times 0.7071 = 1.3660 \times 0.7071 = 0.9659$.

**Does it make sense?** $\cos 75° = 0.2588$ and $\sin 75° = 0.9659$. The product is $\mathbf{R}(75°)$, as the geometry demands.

Done with letters instead of numbers, the top-left entry is $\cos\alpha\cos\beta - \sin\alpha\sin\beta$ — the angle-addition formula for $\cos(\alpha + \beta)$. The trigonometric identities are the statement that rotations stack. In the plane these two rotations happen to commute. In three dimensions, as the change-of-basis lesson shows, [[they do not|book-rotations]].
:::

::: example Coasting for ten seconds, then five
Along one axis, a vehicle coasting freely has position $r$ and velocity $v$. After a time $\Delta t$ ("delta t"), the new position is $r + v\,\Delta t$ and the velocity is still $v$. That is a linear map of the state $(r, v)^T$, with matrix

$$
\boldsymbol{\Phi}(\Delta t) = \begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix},
$$

called the **[[state-transition matrix|state-transition]]**. $\boldsymbol{\Phi}$ is the Greek capital "phi".

**Ten seconds.** From $r = 6\,897\,800\ \mathrm{m}$, $v = 7611\ \mathrm{m/s}$: row 1 gives $6\,897\,800 + 7611 \times 10 = 6\,897\,800 + 76\,110 = 6\,973\,910$ m, and row 2 gives $7611$ m/s.

**Ten, then five more** is the composition $\boldsymbol{\Phi}(5)\,\boldsymbol{\Phi}(10)$ — the ten-second machine on the right, since it runs first:

$$
\begin{pmatrix} 1 & 5 \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 1 & 10 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 1 \cdot 1 + 5 \cdot 0 & 1 \cdot 10 + 5 \cdot 1 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 1 & 15 \\ 0 & 1 \end{pmatrix} = \boldsymbol{\Phi}(15).
$$

Fifteen seconds of coast, as it must be. Every state-transition matrix you meet in the Kalman-filter modules obeys this rule, $\boldsymbol{\Phi}(t_2, t_1)\,\boldsymbol{\Phi}(t_1, t_0) = \boldsymbol{\Phi}(t_2, t_0)$, and it is nothing more than composition of maps.
:::

::: key Multiplication is composition
$(\mathbf{A}\mathbf{B})\mathbf{x} = \mathbf{A}(\mathbf{B}\mathbf{x})$: the product is the machine that runs $\mathbf{B}$ first, then $\mathbf{A}$. Read products right to left. Entry $(i, j)$ is row $i$ of $\mathbf{A}$ dotted with column $j$ of $\mathbf{B}$, and the inner dimensions must match. In general $\mathbf{A}\mathbf{B} \ne \mathbf{B}\mathbf{A}$.
:::

## The identity

The machine that does nothing has a matrix too: the **identity** $\mathbf{I}$, with ones down the diagonal and zeros everywhere else. Its $j$-th column is $\mathbf{e}_j$, because the do-nothing map sends each basis vector to itself. For every $\mathbf{x}$, $\mathbf{I}\mathbf{x} = \mathbf{x}$, and for every matrix of a size that fits,

$$
\mathbf{I}\mathbf{A} = \mathbf{A}\mathbf{I} = \mathbf{A}.
$$

It is the matrix version of multiplying by $1$. When the size needs saying, write $\mathbf{I}_n$ for the $n \times n$ identity.

The identity is the yardstick other matrices are measured against. A rotation matrix that has drifted through round-off is checked by how far $\mathbf{R}^T\mathbf{R}$ is from $\mathbf{I}$. A state-transition matrix over a very short step is $\mathbf{I}$ plus a small correction.

## The transpose

The **transpose** $\mathbf{A}^T$ (read "A transpose") of an $m \times n$ matrix is the $n \times m$ matrix you get by flipping it across its main diagonal — the diagonal from top-left down to the right:

$$
(\mathbf{A}^T)_{ij} = A_{ji} .
$$

Rows become columns and columns become rows. The first row of $\mathbf{A}$ is the first column of $\mathbf{A}^T$. Transposing twice gets you back where you started, $(\mathbf{A}^T)^T = \mathbf{A}$, and the transpose of a sum is the sum of the transposes.

A column vector $\mathbf{a} \in \mathbb{R}^n$ is an $n \times 1$ matrix, so $\mathbf{a}^T$ is a $1 \times n$ **row vector**. That is what the notation $(a_1, a_2, a_3)^T$ in the previous lesson was doing: a row written across the page, transposed back into a column.

The transpose earns its place through the dot product. Multiply a $1 \times n$ row by an $n \times 1$ column and you get a $1 \times 1$ matrix — one number — equal to $\sum_i a_i b_i$. So

$$
\mathbf{a}^T\mathbf{b} = \mathbf{a}\cdot\mathbf{b}, \qquad \mathbf{a}^T\mathbf{a} = \|\mathbf{a}\|_2^2 .
$$

Now every dot product can be written as a matrix product and handled with the same rules. The expression $\mathbf{x}^T\mathbf{A}\mathbf{y}$ is one number: the dot product of $\mathbf{x}$ with $\mathbf{A}\mathbf{y}$. An expression like $\mathbf{x}^T\mathbf{M}\mathbf{x}$, with the same vector on both sides, is called a **[[quadratic form|quadratic-form]]**. Built from a covariance matrix $\mathbf{P}$ — as $\mathbf{x}^T\mathbf{P}^{-1}\mathbf{x}$ — it is how a navigation filter turns a state error $\mathbf{x}$ into one number saying how large that error is. The product the other way round, $\mathbf{a}\,\mathbf{b}^T$, is an $n \times n$ matrix called the **outer product**, with entries $a_i b_j$. You will meet it when building projections.

### The transpose of a product reverses the order

The sizes alone tell you the order must flip. If $\mathbf{A}$ is $m \times p$ and $\mathbf{B}$ is $p \times n$, then $\mathbf{A}\mathbf{B}$ is $m \times n$ and its transpose is $n \times m$. Now try $\mathbf{A}^T\mathbf{B}^T$: that is $(p \times m)$ times $(n \times p)$, which does not even fit unless $m = n$. But $\mathbf{B}^T\mathbf{A}^T$ is $(n \times p)$ times $(p \times m)$, which fits and gives $n \times m$. The rule is

$$
(\mathbf{A}\mathbf{B})^T = \mathbf{B}^T\mathbf{A}^T .
$$

Check it with the pair $\mathbf{A}$, $\mathbf{B}$ from the order example. $(\mathbf{A}\mathbf{B})^T$ is $\begin{pmatrix} 2 & 1 \\ 4 & 3 \end{pmatrix}$ flipped, which is $\begin{pmatrix} 2 & 4 \\ 1 & 3 \end{pmatrix}$. And

$$
\mathbf{B}^T\mathbf{A}^T = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}\begin{pmatrix} 1 & 3 \\ 2 & 4 \end{pmatrix} = \begin{pmatrix} 2 & 4 \\ 1 & 3 \end{pmatrix},
$$

the same.

::: note Why it has to be true
Work out entry $(i, j)$ of $(\mathbf{A}\mathbf{B})^T$ from the definitions, one step at a time. Transposing swaps the indices; then use the entry recipe; then read each factor as an entry of a transpose; then recognize the entry recipe again:

$$
\big((\mathbf{A}\mathbf{B})^T\big)_{ij} = (\mathbf{A}\mathbf{B})_{ji} = \sum_k A_{jk}\,B_{ki} = \sum_k (\mathbf{B}^T)_{ik}\,(\mathbf{A}^T)_{kj} = (\mathbf{B}^T\mathbf{A}^T)_{ij} .
$$

Every entry agrees, so the matrices are equal.
:::

A matrix equal to its own transpose, $\mathbf{S}^T = \mathbf{S}$, is **symmetric** — a mirror image of itself across the diagonal. Covariance matrices, inertia matrices and the matrix $\mathbf{A}^T\mathbf{A}$ of least squares are all symmetric. The last one follows from the product rule: $(\mathbf{A}^T\mathbf{A})^T = \mathbf{A}^T(\mathbf{A}^T)^T = \mathbf{A}^T\mathbf{A}$. A matrix with $\mathbf{S}^T = -\mathbf{S}$ is **skew-symmetric**, and the final lesson of this module is about the most important one.

## The inverse

If a square matrix $\mathbf{A}$ turns $\mathbf{x}$ into $\mathbf{y} = \mathbf{A}\mathbf{x}$, the natural question is whether some machine turns $\mathbf{y}$ back into $\mathbf{x}$. When one exists it is linear, so it has a matrix. It is written $\mathbf{A}^{-1}$ ("A inverse") and called the **inverse**. Undoing after doing, or doing after undoing, leaves everything as it was:

$$
\mathbf{A}^{-1}\mathbf{A} = \mathbf{A}\mathbf{A}^{-1} = \mathbf{I} .
$$

Not every matrix has one. Think of a machine that flattens all of 3D space onto a floor, the way the Sun flattens you into a shadow. Two different inputs — a bird and a stone directly under it — land on the same spot. From the output alone, no machine can tell which input it came from. So there is no inverse. Such a matrix is called **singular**. A matrix with an inverse is **invertible**, or **nonsingular**.

Only square matrices can be invertible in this two-sided sense. The tests for whether a square matrix is — independent columns, a nonzero determinant — are the business of two later lessons. When the inverse exists there is only one, and it solves the linear system: start from $\mathbf{A}\mathbf{x} = \mathbf{b}$, multiply both sides on the left by $\mathbf{A}^{-1}$, and get $\mathbf{x} = \mathbf{A}^{-1}\mathbf{b}$.

### The inverse of a product also reverses the order

In the morning you put on socks, then shoes. At night you undo it by taking off the shoes first, then the socks. The last thing done is the first thing undone. To undo "$\mathbf{B}$ then $\mathbf{A}$", you must undo $\mathbf{A}$ first and then $\mathbf{B}$:

$$
(\mathbf{A}\mathbf{B})^{-1} = \mathbf{B}^{-1}\mathbf{A}^{-1} .
$$

The check is one line. Multiply and regroup, which associativity allows:

$$
(\mathbf{A}\mathbf{B})(\mathbf{B}^{-1}\mathbf{A}^{-1}) = \mathbf{A}\,(\mathbf{B}\mathbf{B}^{-1})\,\mathbf{A}^{-1} = \mathbf{A}\,\mathbf{I}\,\mathbf{A}^{-1} = \mathbf{A}\mathbf{A}^{-1} = \mathbf{I} .
$$

The transpose and the inverse also swap places freely. Transpose both sides of $\mathbf{A}^{-1}\mathbf{A} = \mathbf{I}$ using the product rule: $\mathbf{A}^T(\mathbf{A}^{-1})^T = \mathbf{I}^T = \mathbf{I}$. That says $(\mathbf{A}^{-1})^T$ is the matrix that undoes $\mathbf{A}^T$:

$$
(\mathbf{A}^T)^{-1} = (\mathbf{A}^{-1})^T .
$$

### The two-by-two inverse

For a $2 \times 2$ matrix there is a formula worth knowing by heart. We want $\mathbf{X}$ with $\mathbf{A}\mathbf{X} = \mathbf{I}$ for $\mathbf{A} = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$. Try $\mathbf{X} = \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$ — the diagonal swapped, the other two entries negated — and multiply:

$$
\begin{pmatrix} a & b \\ c & d \end{pmatrix}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix} = \begin{pmatrix} ad - bc & -ab + ba \\ cd - dc & -cb + da \end{pmatrix} = (ad - bc)\,\mathbf{I} .
$$

The off-diagonal entries cancel, and both diagonal entries are the same number, $ad - bc$. Divide by it, and you have the inverse — provided that number is not zero:

$$
\mathbf{A}^{-1} = \frac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}.
$$

The number $ad - bc$ is the **[[determinant|determinant-area]]** of $\mathbf{A}$. The determinant lesson explains why its being zero is exactly the test for a singular matrix, in any size.

Try it on the rotation $\mathbf{R}(\theta)$. There $ad - bc = \cos^2\theta + \sin^2\theta = 1$, and the formula gives

$$
\mathbf{R}(\theta)^{-1} = \begin{pmatrix} \cos\theta & \sin\theta \\ -\sin\theta & \cos\theta \end{pmatrix} = \mathbf{R}(-\theta),
$$

which is also $\mathbf{R}(\theta)^T$. Undoing a rotation means rotating back, and for rotations the inverse is free: it is the transpose. The orthogonality lesson shows that this holds for every rotation in any dimension.

::: example Inverting a two-by-two matrix
Let $\mathbf{A} = \begin{pmatrix} 4 & 7 \\ 2 & 6 \end{pmatrix}$.

**The determinant.** $ad - bc = 4 \times 6 - 7 \times 2 = 24 - 14 = 10$. Not zero, so the inverse exists.

**Swap, negate, divide:**

$$
\mathbf{A}^{-1} = \frac{1}{10}\begin{pmatrix} 6 & -7 \\ -2 & 4 \end{pmatrix} = \begin{pmatrix} 0.6 & -0.7 \\ -0.2 & 0.4 \end{pmatrix}.
$$

**Check by multiplying $\mathbf{A}\mathbf{A}^{-1}$, entry by entry.** Top-left: $4 \times 0.6 + 7 \times (-0.2) = 2.4 - 1.4 = 1$. Top-right: $4 \times (-0.7) + 7 \times 0.4 = -2.8 + 2.8 = 0$. Bottom-left: $2 \times 0.6 + 6 \times (-0.2) = 1.2 - 1.2 = 0$. Bottom-right: $2 \times (-0.7) + 6 \times 0.4 = -1.4 + 2.4 = 1$. The product is $\mathbf{I}$.

**Use it.** To solve $\mathbf{A}\mathbf{x} = (1, 0)^T$, compute $\mathbf{A}^{-1}(1, 0)^T$, which picks out the first column of the inverse: $\mathbf{x} = (0.6, -0.2)^T$. Check: $4 \times 0.6 + 7 \times (-0.2) = 1$ and $2 \times 0.6 + 6 \times (-0.2) = 0$.
:::

::: key Transpose and inverse of a product
$(\mathbf{A}\mathbf{B})^T = \mathbf{B}^T\mathbf{A}^T$ and $(\mathbf{A}\mathbf{B})^{-1} = \mathbf{B}^{-1}\mathbf{A}^{-1}$ — both reverse the order. Also $\mathbf{a}^T\mathbf{b} = \mathbf{a}\cdot\mathbf{b}$, $(\mathbf{A}^T)^{-1} = (\mathbf{A}^{-1})^T$, and a $2 \times 2$ matrix is inverted by swapping the diagonal, negating the off-diagonal and dividing by $ad - bc$.
:::

::: warning Do not invert a matrix to solve a system
Writing $\mathbf{x} = \mathbf{A}^{-1}\mathbf{b}$ is fine on paper. In code, forming $\mathbf{A}^{-1}$ and then multiplying costs about three times as much as solving $\mathbf{A}\mathbf{x} = \mathbf{b}$ directly, and loses accuracy along the way. Use a solver — the next lesson builds one — and save the explicit inverse for the rare case where you truly need the matrix itself.
:::

::: warning Elementwise is not matrix multiplication
In NumPy, `A * B` multiplies entry by entry and `A @ B` is the **[[matrix product|at-operator]]**. The two agree only for plain numbers. A rotation applied with `*` produces a matrix of the right shape and completely wrong values, and nothing will warn you.
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
Check the inner sizes each time.

- $\mathbf{A}\mathbf{B}$: $(3 \times 5)(5 \times 2)$. Inner sizes 5 and 5 match, so it is defined, and it is $3 \times 2$.
- $\mathbf{B}\mathbf{A}$: $(5 \times 2)(3 \times 5)$. Inner sizes 2 and 3 do not match: not defined.
- $\mathbf{A}^T\mathbf{B}$: $(5 \times 3)(5 \times 2)$. Inner sizes 3 and 5: not defined.
- $\mathbf{B}^T\mathbf{A}^T$: $(2 \times 5)(5 \times 3)$. Defined, and $2 \times 3$. It is $(\mathbf{A}\mathbf{B})^T$, as the product rule for transposes says.
:::

::: check
A linear map in the plane sends $\mathbf{e}_1$ to $(3, 1)^T$ and $\mathbf{e}_2$ to $(-1, 2)^T$. Write its matrix and compute the image of $(2, -1)^T$.
:::

::: answer
The columns are the images of the basis vectors: $\mathbf{A} = \begin{pmatrix} 3 & -1 \\ 1 & 2 \end{pmatrix}$.

The image of $(2, -1)^T$ is 2 of the first column minus 1 of the second: $2\,(3, 1)^T - 1\,(-1, 2)^T = (6 + 1,\ 2 - 2)^T = (7, 0)^T$.
:::

::: check
A gyro measures the body rate $\boldsymbol{\omega}$ ("omega") through a misalignment matrix $\mathbf{M}$ and then a scale-factor matrix $\mathbf{S}$, so the raw output is $\mathbf{y} = \mathbf{S}\mathbf{M}\boldsymbol{\omega}$. Both are invertible. Write $\boldsymbol{\omega}$ in terms of $\mathbf{y}$ using the individual inverses, in the correct order.
:::

::: answer
The inverse of a product reverses the order: $(\mathbf{S}\mathbf{M})^{-1} = \mathbf{M}^{-1}\mathbf{S}^{-1}$. So $\boldsymbol{\omega} = \mathbf{M}^{-1}\mathbf{S}^{-1}\mathbf{y}$.

Reading right to left: undo the scale factors first (they were applied last), then the misalignment. Writing $\mathbf{S}^{-1}\mathbf{M}^{-1}\mathbf{y}$ would be wrong unless the two matrices happen to commute.
:::

::: check
Show that $\mathbf{x}^T\mathbf{A}\mathbf{y} = \mathbf{y}^T\mathbf{A}^T\mathbf{x}$ for any vectors $\mathbf{x}, \mathbf{y}$ and matrix $\mathbf{A}$ of sizes that fit. What does this say when $\mathbf{A}$ is symmetric?
:::

::: answer
$\mathbf{x}^T\mathbf{A}\mathbf{y}$ is a $1 \times 1$ matrix — one number — so it equals its own transpose. Transposing a product of three factors reverses their order and transposes each one:

$(\mathbf{x}^T\mathbf{A}\mathbf{y})^T = \mathbf{y}^T\mathbf{A}^T(\mathbf{x}^T)^T = \mathbf{y}^T\mathbf{A}^T\mathbf{x}$.

If $\mathbf{A}^T = \mathbf{A}$, this reads $\mathbf{x}^T\mathbf{A}\mathbf{y} = \mathbf{y}^T\mathbf{A}\mathbf{x}$: swapping the two vectors does not change the number. That symmetry is what makes a quadratic form built from a symmetric covariance matrix a well-behaved "squared size" of a vector.
:::

::: check
Find the inverse of $\mathbf{C} = \begin{pmatrix} 2 & 5 \\ 1 & 3 \end{pmatrix}$, and use it to solve $\mathbf{C}\mathbf{x} = (1, 1)^T$.
:::

::: answer
$ad - bc = 2 \times 3 - 5 \times 1 = 6 - 5 = 1$. Swap the diagonal, negate the rest, divide by 1: $\mathbf{C}^{-1} = \begin{pmatrix} 3 & -5 \\ -1 & 2 \end{pmatrix}$.

Then $\mathbf{x} = \mathbf{C}^{-1}(1, 1)^T = (3 - 5,\ -1 + 2)^T = (-2, 1)^T$.

Check: $2(-2) + 5(1) = 1$ and $1(-2) + 3(1) = 1$.
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

The next lesson takes up the job the inverse only pretends to do — finding $\mathbf{x}$ with $\mathbf{A}\mathbf{x} = \mathbf{b}$ — and builds the method that really does it: Gaussian elimination with partial pivoting, packaged as the LU factorisation.

::: context matrix-word Where the word comes from
"Matrix" is Latin, from the word for "mother", and came to mean a mold or source from which other things are made. The English mathematician James Joseph Sylvester borrowed it in 1850 for a rectangular array of numbers, because smaller determinants could be carved out of it — it was the source they came from.

The name stuck, even though today we care more about what a matrix *does* than what can be cut out of it.
:::

::: context column-picture A matrix mixes its columns
The matrix $\begin{pmatrix} 3 & -1 \\ 1 & 2 \end{pmatrix}$ has columns $\mathbf{a}_1 = (3, 1)$ and $\mathbf{a}_2 = (-1, 2)$. Feeding it $(2, -1)$ means: take 2 of $\mathbf{a}_1$ (blue), then $-1$ of $\mathbf{a}_2$ (orange), tip to tail. You land at $(7, 0)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="cp-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="cp-o" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#f2b880"/></marker>
    <marker id="cp-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
    <marker id="cp-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#6c7a93"/></marker>
  </defs>
  <line x1="10" y1="150" x2="350" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="170" x2="50" y2="20" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="150" x2="170" y2="110" stroke="#6c7a93" stroke-width="1.5" marker-end="url(#cp-g)"/>
  <line x1="50" y1="150" x2="10" y2="70" stroke="#6c7a93" stroke-width="1.5" marker-end="url(#cp-g)"/>
  <line x1="50" y1="150" x2="290" y2="70" stroke="#1d6fd1" stroke-width="3" marker-end="url(#cp-b)"/>
  <line x1="290" y1="70" x2="330" y2="150" stroke="#f2b880" stroke-width="3" marker-end="url(#cp-o)"/>
  <line x1="50" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="2.5" marker-end="url(#cp-k)"/>
  <text x="176" y="122" font-size="12" fill="#6c7a93">a₁</text>
  <text x="16" y="62" font-size="12" fill="#6c7a93">a₂</text>
  <text x="200" y="88" font-size="12" fill="#1d6fd1" text-anchor="end">2 a₁ = (6, 2)</text>
  <text x="318" y="100" font-size="12" fill="#b4232c">−a₂</text>
  <text x="250" y="168" font-size="12" fill="#1f2a44">A x = (7, 0)</text>
</svg>
```
:::

::: context measurement-matrix One row per sensor
In a navigation filter the measurement matrix $\mathbf{H}$ has one row for each sensor reading and one column for each state component. If the state is position and velocity along one axis, $(r, v)^T$, and the only sensor measures position, then $\mathbf{H} = \begin{pmatrix} 1 & 0 \end{pmatrix}$: the sensor sees all of $r$ and none of $v$.

A Doppler radar that measures speed would add the row $\begin{pmatrix} 0 & 1 \end{pmatrix}$. Lesson 4 asks which state directions a given $\mathbf{H}$ cannot see at all.
:::

::: context rotation-picture Follow the two basis vectors
Turning by $45°$ counterclockwise carries $\mathbf{e}_1$ (along $x$) to $(\cos 45°, \sin 45°) = (0.707, 0.707)$, and $\mathbf{e}_2$ (along $y$) to $(-0.707, 0.707)$. Those two landing points, written as columns, are the whole rotation matrix.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="rp-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#6c7a93"/></marker>
    <marker id="rp-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="rp-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
  </defs>
  <circle cx="180" cy="130" r="80" fill="none" stroke="#8fb8f0" stroke-width="1.2"/>
  <line x1="80" y1="130" x2="290" y2="130" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="212" x2="180" y2="40" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="130" x2="260" y2="130" stroke="#6c7a93" stroke-width="2.5" stroke-dasharray="5 3" marker-end="url(#rp-g)"/>
  <line x1="180" y1="130" x2="180" y2="50" stroke="#6c7a93" stroke-width="2.5" stroke-dasharray="5 3" marker-end="url(#rp-g)"/>
  <line x1="180" y1="130" x2="236.57" y2="73.43" stroke="#1d6fd1" stroke-width="3" marker-end="url(#rp-b)"/>
  <line x1="180" y1="130" x2="123.43" y2="73.43" stroke="#b4232c" stroke-width="3" marker-end="url(#rp-r)"/>
  <path d="M210,130 A30,30 0 0,0 201.21,108.79" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="214" y="122" font-size="11" fill="#1f2a44">45°</text>
  <text x="266" y="146" font-size="12" fill="#6c7a93">e₁</text>
  <text x="186" y="46" font-size="12" fill="#6c7a93">e₂</text>
  <text x="242" y="68" font-size="12" fill="#1d6fd1">(0.707, 0.707)</text>
  <text x="118" y="68" font-size="12" fill="#b4232c" text-anchor="end">(−0.707, 0.707)</text>
</svg>
```
:::

::: context right-to-left Why products read backwards
You already read function notation this way. In $f(g(x))$, the function nearest to $x$ — here $g$ — acts first, even though you read $f$ first. Matrices sit in the same place functions do, so $\mathbf{A}\mathbf{B}\mathbf{x}$ means "$\mathbf{B}$ acts on $\mathbf{x}$, then $\mathbf{A}$ acts on the result".

A good habit: trace a product from the vector outward, right to left, saying what each matrix does to the data as it passes.
:::

::: context operation-count Counting the arithmetic
A 15-state filter is common: position and velocity (6), attitude error (3), and gyro and accelerometer biases (6). Each $15 \times 15$ matrix–vector product is $15^2 = 225$ multiply-adds; each matrix–matrix product is $15^3 = 3375$.

A filter runs many such products every cycle, often 50 or 100 times a second, on a flight computer much slower than a laptop. Choosing $\mathbf{A}(\mathbf{B}\mathbf{x})$ over $(\mathbf{A}\mathbf{B})\mathbf{x}$ when only the vector is needed is one of the cheapest speed-ups there is.
:::

::: context book-rotations Try it with a book
Lay a book flat, cover up. Turn it $90°$ about the left-to-right axis, then $90°$ about the vertical axis. Note where the spine points. Reset, and do the same two turns in the opposite order. The book ends up facing a different way.

In the plane, every rotation turns about the same point, so the order does not matter. In three dimensions each turn has its own axis, and the order does matter. That is why attitude software is careful about which rotation is written on which side.
:::

::: context state-transition The matrix that moves time forward
A **state-transition matrix** carries the state from one time to a later time. For motion with no forces it is exact. For a real orbit, gravity makes the true motion nonlinear, and the matrix is an approximation that holds for small changes around a reference path.

It is the "predict" half of the Kalman filter: every cycle, the filter multiplies its state by $\boldsymbol{\Phi}$ to guess where the vehicle is now, before a measurement arrives to correct the guess.
:::

::: context quadratic-form A covariance turns an error into one number
A covariance matrix $\mathbf{P}$ describes how uncertain each state component is, and how the uncertainties are tied together. The number $\mathbf{x}^T\mathbf{P}^{-1}\mathbf{x}$ says how surprising an error $\mathbf{x}$ is: large errors in directions where the filter is confident count heavily, and large errors in directions it is unsure about count lightly.

Filters use numbers like this to reject bad measurements. Linear Algebra II explains why a covariance must make every such number non-negative.
:::

::: context determinant-area Why ad − bc?
The columns of $\begin{pmatrix} 4 & 7 \\ 2 & 6 \end{pmatrix}$ are $(4, 2)$ and $(7, 6)$. They span a parallelogram, and its area is $4 \times 6 - 7 \times 2 = 10$. If the columns pointed the same way, the parallelogram would be squashed flat, the area would be $0$, and no inverse could exist.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="da-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="da-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
  </defs>
  <line x1="40" y1="185" x2="340" y2="185" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="195" x2="60" y2="10" stroke="#6c7a93" stroke-width="1"/>
  <polygon points="60,185 140,145 280,25 200,65" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="60" y1="185" x2="140" y2="145" stroke="#1d6fd1" stroke-width="3" marker-end="url(#da-b)"/>
  <line x1="60" y1="185" x2="200" y2="65" stroke="#b4232c" stroke-width="3" marker-end="url(#da-r)"/>
  <text x="146" y="162" font-size="12" fill="#1d6fd1">(4, 2)</text>
  <text x="192" y="56" font-size="12" fill="#b4232c" text-anchor="end">(7, 6)</text>
  <text x="200" y="112" font-size="13" fill="#1f2a44">area = 10</text>
  <text x="190" y="172" font-size="12" fill="#1f2a44">ad − bc = 24 − 14 = 10</text>
</svg>
```

Lesson 5 shows that this holds in every dimension: the determinant is the factor by which the matrix scales area or volume.
:::

::: context at-operator Python's matrix-multiply sign
The `@` operator was added to Python in version 3.5, in 2015, specifically so that matrix code would read like the math. Before that, NumPy users wrote `np.dot(A, np.dot(B, x))`, which is correct but hard to read.

In NumPy, `A @ B` works for matrices, `A @ x` for a matrix times a vector, and `a @ b` for two plain vectors gives the dot product.
:::
