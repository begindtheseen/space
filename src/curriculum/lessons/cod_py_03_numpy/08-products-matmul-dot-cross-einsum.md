---
id: l08-products-matmul-dot-cross-einsum
title: "Products: @, dot, cross and einsum"
minutes: 21
covers:
  - matmul and @, dot, cross, einsum
---

Stand facing north, holding a map. A friend says the water tower is 300 meters north and 400 meters east. Now turn to face east. The tower has not moved, but in *your* words it is now 400 meters ahead and 300 meters to your left. Same arrow in the world, different numbers, because you turned.

A spacecraft lives with this every moment. Its star tracker (a camera that recognizes patterns of stars) and its gyros say how it is turned. Its thrusters and sensors are bolted to its own body, so they think in "ahead, left, up" of the vehicle. Its orbit and the Sun's direction are known in a fixed frame tied to the stars. Moving an arrow from one set of words to the other is a multiplication by a small 3-by-3 table of numbers called a **direction cosine matrix**, and doing it for a million arrows at once is one line of NumPy — if you pick the right kind of multiplication.

NumPy has several: `*` multiplies element by element, `@` does matrix multiplication, `np.dot` does something similar but not identical, `np.cross` does the cross product of 3-D vectors, and `np.einsum` lets you spell any of them with letters. This lesson explains vectors and matrices from the start, then each product, then puts them together to rotate a million vectors and to build the **skew-symmetric matrix** that turns a cross product into a matrix product.

## Vectors, matrices and the dot product

A **vector** here is an arrow in space written as three numbers, its x, y and z components. In NumPy it is an array of shape `(3,)`. A stack of $N$ of them, one per row, is `(N, 3)`, as in the earlier lessons.

The **dot product** of two vectors multiplies matching components and adds them up. For $\mathbf{a} = (1, 2, 3)$ and $\mathbf{b} = (4, -5, 6)$, read "a dot b":

$$
\mathbf{a} \cdot \mathbf{b} = 1 \times 4 + 2 \times (-5) + 3 \times 6 = 4 - 10 + 18 = 12.
$$

It measures how much two arrows **[[point the same way|dot-picture]]**: $\mathbf{a} \cdot \mathbf{b} = |\mathbf{a}|\,|\mathbf{b}| \cos\theta$, where $|\mathbf{a}|$ is the length of $\mathbf{a}$ and $\theta$ (theta) is the angle between them. Perpendicular arrows have a dot product of zero. If $\mathbf{b}$ has length 1, then $\mathbf{a} \cdot \mathbf{b}$ is the part of $\mathbf{a}$ that lies along $\mathbf{b}$.

A **matrix** is a rectangular table of numbers, the kind `np.eye` made in the lesson on creating arrays. Multiplying a matrix $\mathbf{M}$ by a vector $\mathbf{x}$ gives a new vector: **each output component is one row of $\mathbf{M}$ dotted with $\mathbf{x}$.**

$$
\begin{bmatrix} 2 & 0 & 1 \\ 0 & 3 & 0 \\ 1 & 0 & 2 \end{bmatrix}
\begin{bmatrix} 1 \\ 2 \\ 3 \end{bmatrix}
=
\begin{bmatrix} 2 \times 1 + 0 \times 2 + 1 \times 3 \\ 0 \times 1 + 3 \times 2 + 0 \times 3 \\ 1 \times 1 + 0 \times 2 + 2 \times 3 \end{bmatrix}
=
\begin{bmatrix} 5 \\ 6 \\ 7 \end{bmatrix}.
$$

In NumPy that is `M @ x`. Read `@` as "matrix-times". Compare it with `*`:

```python
import numpy as np

M = np.array([[2.0, 0.0, 1.0],
              [0.0, 3.0, 0.0],
              [1.0, 0.0, 2.0]])
x = np.array([1.0, 2.0, 3.0])

print(M @ x)
# [5. 6. 7.]
print(M * x)
# [[2. 0. 3.]
#  [0. 6. 0.]
#  [1. 0. 6.]]
a = np.array([1.0, 2.0, 3.0]); b = np.array([4.0, -5.0, 6.0])
print(a @ b, np.dot(a, b))
# 12.0 12.0
```

`M * x` broadcast the `(3,)` vector across the rows and multiplied element by element — a perfectly legal operation that is not a matrix product at all. It gave a `(3, 3)` answer with no error.

::: key np.dot vs @ vs np.multiply
`@` (matmul) is matrix multiplication with batched semantics on the leading axes; `np.dot` behaves differently for arrays above two dimensions; `np.multiply` (and `*`) is element-wise. In GNC code, `*` where you meant `@` is a silent-wrong-answer bug.
:::

## @ and matmul: the shape rules

`a @ b` is the same function as `np.matmul(a, b)`. For two 2-D arrays, a matrix of shape `(n, k)` times a matrix of shape `(k, m)` gives `(n, m)`: each entry is a row of the first dotted with a column of the second, so **the inner lengths must match**. Read the shapes like dominoes: `(2, 3) @ (3, 4)` — the 3s touch and vanish — gives `(2, 4)`.

```python
A = np.ones((2, 3)); B = np.ones((3, 4))
print((A @ B).shape)
# (2, 4)
B @ A
# ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0, with gufunc
#   signature (n?,k),(k,m?)->(n?,m?) (size 2 is different from 4)
```

The error is dense but readable. The **[[signature|gufunc-signature]]** `(n?,k),(k,m?)->(n?,m?)` is the domino rule written out: the `k` must match. `B @ A` puts a 4 against a 2, and they do not match.

Two special cases cover vectors. A 1-D array on the right is treated as a column and the extra axis is dropped afterwards, so `(3, 3) @ (3,)` gives `(3,)`. A 1-D array on both sides gives the dot product, a single number.

### Stacks of matrices

Here is what makes `@` the right tool for GNC work. If the arrays have more than two axes, `@` treats the **last two axes as the matrix** and every axis in front of them as a **stack**, and it broadcasts the stack axes with the rules from the broadcasting lesson.

So a stack of $N$ rotation matrices, `(N, 3, 3)`, times a stack of $N$ column vectors, `(N, 3, 1)`, gives `(N, 3, 1)`: matrix 0 times vector 0, matrix 1 times vector 1, and so on. A single `(3, 3)` matrix times the stack `(N, 3, 1)` also works — the lone matrix is broadcast across the stack.

::: warning A stack of vectors is not a stack of columns
If `Cs` is `(N, 3, 3)` and `vs` is `(N, 3)`, then `Cs @ vs` treats `vs` as *one* `(N, 3)` matrix, not as $N$ vectors. With $N = 5$ you get "size 5 is different from 3". With $N = 3$ the shapes happen to fit and you get a wrong answer with no error. Turn the vectors into columns first, and take the column axis off afterwards:

```python
Cs = np.zeros((5, 3, 3)); vs = np.zeros((5, 3))
print((Cs @ vs[..., None]).shape, (Cs @ vs[..., None])[..., 0].shape)
# (5, 3, 1) (5, 3)
```

The **[[three dots|ellipsis]]** `...` mean "all the leading axes, however many". `vs[..., None]` adds a length-1 axis at the end — the `None` trick from the broadcasting lesson.
:::

## np.dot, and how it differs

For 1-D and 2-D arrays, `np.dot` gives the same answers as `@`. Above two dimensions it does something else. `np.dot(a, b)` sums over the last axis of `a` and the second-to-last axis of `b`, and it pairs *every* stack entry of `a` with *every* stack entry of `b`, instead of pairing them up in order:

```python
print(np.dot(Cs, Cs).shape, np.matmul(Cs, Cs).shape)
# (5, 3, 5, 3) (5, 3, 3)
```

`matmul` gave five products, one per pair. `dot` gave all $5 \times 5 = 25$ combinations, laid out in a 4-D array. With a million matrices, that is $10^{12}$ products — the memory explosion from the broadcasting lesson again. For stacks, use `@`.

::: key Stacked matmul
`@` treats the last two axes as matrices and broadcasts the leading axes as a stack: `(N,3,3) @ (N,3,1)` gives `(N,3,1)`, one product per `n`. `np.dot` on arrays above 2-D instead pairs every stack entry with every other, giving `(N,3,N,1)`-style results. `(N,3)` vectors need `[..., None]` before a stacked `@`.
:::

## The cross product

The **cross product** of two 3-D vectors, $\mathbf{a} \times \mathbf{b}$ (read "a cross b"), is a new vector that is **perpendicular to both**, with length $|\mathbf{a}|\,|\mathbf{b}| \sin\theta$. Its direction comes from the **[[right-hand rule|right-hand]]**: point the fingers of your right hand along $\mathbf{a}$, curl them toward $\mathbf{b}$, and your thumb points along $\mathbf{a} \times \mathbf{b}$. In components:

$$
\mathbf{a} \times \mathbf{b} = \begin{bmatrix} a_y b_z - a_z b_y \\ a_z b_x - a_x b_z \\ a_x b_y - a_y b_x \end{bmatrix}.
$$

Order matters: $\mathbf{b} \times \mathbf{a} = -(\mathbf{a} \times \mathbf{b})$, and any vector crossed with itself is zero. In mechanics it is everywhere. A force $\mathbf{F}$ applied at position $\mathbf{r}$ from the center of mass makes a **torque** — a twisting push — equal to $\mathbf{r} \times \mathbf{F}$. A point at position $\mathbf{r}$ on a body spinning at angular velocity $\boldsymbol{\omega}$ (omega) moves with velocity $\boldsymbol{\omega} \times \mathbf{r}$.

`np.cross` works on the last axis, so two `(N, 3)` arrays give `N` cross products, row by row:

```python
print(np.cross([1.0, 0, 0], [0, 1.0, 0]), np.cross([0, 1.0, 0], [1.0, 0, 0]))
# [0. 0. 1.] [ 0.  0. -1.]
a = np.array([[1.0, 2.0, 3.0], [0.0, 0.0, 2.0]])
b = np.array([[4.0, 5.0, 6.0], [3.0, 0.0, 0.0]])
c = np.cross(a, b)
print(c, c.shape)
# [[-3.  6. -3.]
#  [ 0.  6.  0.]] (2, 3)
```

Check row 0 by the formula: $2 \times 6 - 3 \times 5 = -3$, $3 \times 4 - 1 \times 6 = 6$, $1 \times 5 - 2 \times 4 = -3$. And it is perpendicular to both inputs: $(-3)(1) + 6(2) + (-3)(3) = 0$ and $(-3)(4) + 6(5) + (-3)(6) = 0$.

### The skew-symmetric matrix

A cross product with a fixed $\mathbf{a}$ can be written as a matrix times $\mathbf{b}$. The matrix is

$$
[\mathbf{a}]_\times = \begin{bmatrix} 0 & -a_z & a_y \\ a_z & 0 & -a_x \\ -a_y & a_x & 0 \end{bmatrix},
\qquad [\mathbf{a}]_\times \, \mathbf{b} = \mathbf{a} \times \mathbf{b}.
$$

Read $[\mathbf{a}]_\times$ as "a-cross matrix" or "skew of a". Check the first row: $(0, -a_z, a_y) \cdot (b_x, b_y, b_z) = a_y b_z - a_z b_y$, which is the first component of the cross product. It is called **skew-symmetric** because flipping it across the diagonal flips every sign: its transpose is its negative, $[\mathbf{a}]_\times^{\mathsf{T}} = -[\mathbf{a}]_\times$. Its diagonal is all zeros. Attitude estimators and the equations of rotational motion use it constantly, because it lets a cross product join a chain of matrix products.

For a stack of $N$ vectors you want a stack of $N$ such matrices, `(N, 3, 3)`. You build a stack like that without a loop by creating zeros and filling one matrix position across the whole stack at a time, `out[:, row, col] = …`. The example below builds a stack of rotation matrices that way; the exercise asks you to do the same for the skew matrix.

::: key Cross product and skew matrix
`np.cross(a, b)` on `(N, 3)` arrays gives the `N` row-by-row cross products; $\mathbf{a} \times \mathbf{b}$ is perpendicular to both, and $\mathbf{b} \times \mathbf{a} = -\mathbf{a} \times \mathbf{b}$. The skew-symmetric matrix $[\mathbf{a}]_\times$ has $0$ on the diagonal, $-a_z, a_y$ in row 0, $a_z, -a_x$ in row 1 and $-a_y, a_x$ in row 2, satisfies $[\mathbf{a}]_\times \mathbf{b} = \mathbf{a} \times \mathbf{b}$, and equals minus its transpose.
:::

## Rotation matrices: the direction cosine matrix

Back to the map. A **frame** is a set of three perpendicular unit axes — x, y, z — that you measure components against. The **inertial frame** (I) is fixed to the distant stars. The **body frame** (B) is bolted to the vehicle and turns with it. The same arrow $\mathbf{v}$ has components $\mathbf{v}_I$ in one and $\mathbf{v}_B$ in the other.

The **direction cosine matrix** (DCM) $\mathbf{C}$ converts between them: $\mathbf{v}_B = \mathbf{C}\,\mathbf{v}_I$, read "v sub B equals C times v sub I". Here is the plain reason it works. **Row $i$ of $\mathbf{C}$ is body axis $i$, written in inertial components.** The matrix-vector product dots each row with $\mathbf{v}_I$, and dotting with a unit arrow gives "how much of $\mathbf{v}$ lies along that axis" — which is exactly the body component. Each entry is the cosine of the angle between a body axis and an inertial axis, which is **[[where the name comes from|dcm-name]]**.

Because the three rows are perpendicular unit vectors, a DCM has two properties you will check again and again:

- $\mathbf{C}\mathbf{C}^{\mathsf{T}} = \mathbf{I}$ (read "C times C transpose is the identity"): its **transpose is its inverse**, the matrix that undoes it. $\mathbf{C}^{\mathsf{T}}$ converts back, $\mathbf{v}_I = \mathbf{C}^{\mathsf{T}}\mathbf{v}_B$.
- Its **determinant** — a single number that `np.linalg.det` computes from a square matrix — is $+1$. For a mirror it would be $-1$, so $+1$ says "a pure rotation".

### One rotation about one axis

Turn the body by an angle $\psi$ (psi, the **yaw**) about the shared z axis. Body x now points at $(\cos\psi, \sin\psi, 0)$ in inertial components and body y at $(-\sin\psi, \cos\psi, 0)$; body z has not moved. Those are the rows:

$$
\mathbf{R}_3(\psi) = \begin{bmatrix} \cos\psi & \sin\psi & 0 \\ -\sin\psi & \cos\psi & 0 \\ 0 & 0 & 1 \end{bmatrix}.
$$

The subscript 3 means "about axis 3", the z axis. The same reasoning about x (axis 1) and y (axis 2) gives

$$
\mathbf{R}_1(\phi) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\phi & \sin\phi \\ 0 & -\sin\phi & \cos\phi \end{bmatrix},
\qquad
\mathbf{R}_2(\theta) = \begin{bmatrix} \cos\theta & 0 & -\sin\theta \\ 0 & 1 & 0 \\ \sin\theta & 0 & \cos\theta \end{bmatrix}.
$$

Sanity check with the map: yaw by $90^\circ$, so $\cos\psi = 0$ and $\sin\psi = 1$. The inertial x arrow $(1, 0, 0)$ becomes $\mathbf{R}_3 (1, 0, 0) = (0, -1, 0)$ in body components. The body turned left by $90^\circ$, so something that was straight ahead is now on the body's right, the $-y$ side. That matches the walk-around picture.

A general attitude is built from three turns in a row. The common aerospace **3-2-1 sequence** is: yaw $\psi$ about z, then pitch $\theta$ about the new y, then roll $\phi$ about the newest x. Each turn multiplies on the *left*, so the first turn sits on the right:

$$
\mathbf{C} = \mathbf{R}_1(\phi)\,\mathbf{R}_2(\theta)\,\mathbf{R}_3(\psi).
$$

::: example A 3-2-1 attitude, checked
Yaw $30^\circ$, pitch $10^\circ$, roll $0^\circ$. Build the DCM and check it.

```python
def R1(p):
    c, s = np.cos(p), np.sin(p); return np.array([[1.0, 0, 0], [0, c, s], [0, -s, c]])
def R2(t):
    c, s = np.cos(t), np.sin(t); return np.array([[c, 0, -s], [0, 1.0, 0], [s, 0, c]])
def R3(p):
    c, s = np.cos(p), np.sin(p); return np.array([[c, s, 0], [-s, c, 0], [0, 0, 1.0]])

yaw, pitch, roll = np.radians([30.0, 10.0, 0.0])
C = R1(roll) @ R2(pitch) @ R3(yaw)
print(C.round(4))
# [[ 0.8529  0.4924 -0.1736]
#  [-0.5     0.866   0.    ]
#  [ 0.1504  0.0868  0.9848]]
print(np.allclose(C @ C.T, np.eye(3)), round(np.linalg.det(C), 12))
# True 1.0
```

Check the top-left entry by hand. Row 0 of $\mathbf{R}_2$ is $(\cos\theta, 0, -\sin\theta)$ and column 0 of $\mathbf{R}_3$ is $(\cos\psi, -\sin\psi, 0)$, so the entry is $\cos\theta\cos\psi = 0.9848 \times 0.8660 = 0.8529$. The top-right entry is $-\sin 10^\circ = -0.1736$. Both match.

Notice the check uses `np.allclose`, not `==`. `C @ C.T` comes out with entries like `7.4e-18` where the exact answer is 0, so `(C @ C.T == np.eye(3)).all()` is `False`. Every sine, cosine and product rounds in the last bits. Floating-point comparison gets a whole lesson later in this module.

Swap the order by mistake — `R3(yaw) @ R2(pitch)` — and `np.allclose` against the right `C` is `False`. Rotations do not commute: order matters.
:::

## Rotating a million vectors in one expression

Now the payoff. `V` holds a million vectors as rows, shape `(N, 3)`, all in the inertial frame. You want each one in the body frame: row `i` of the answer should be `C @ V[i]`.

`C @ V` does not fit (`(3, 3) @ (N, 3)` puts 3 against N). The one-expression answer is

```python
W = V @ C.T
```

It fits by the domino rule, `(N, 3) @ (3, 3)` gives `(N, 3)`, and it computes the right thing: **[[each row of the result is C times the matching row of V|transpose-trick]]**. Another spelling, with named axes, is `np.einsum('ij,nj->ni', C, V)`, explained in the next section.

::: example A million vectors, three ways, timed
```python
import timeit

rng = np.random.default_rng(42)
V = rng.normal(size=(1_000_000, 3))
C = R3(np.radians(30.0))

W1 = V @ C.T
W2 = np.einsum('ij,nj->ni', C, V)
print(W1.shape, np.allclose(W1, W2), np.allclose(W1[123456], C @ V[123456]))
# (1000000, 3) True True
print(np.allclose(V @ C, W1))
# False

def loop(V):
    out = np.empty_like(V)
    for i in range(len(V)):
        out[i] = C @ V[i]
    return out
```

Shape checks first: `(1000000, 3)`, as wanted. Both spellings agree, and a spot check on row 123,456 matches a direct `C @ V[i]`. A rotation never changes lengths, so `np.linalg.norm(W1, axis=1)` equals `np.linalg.norm(V, axis=1)` row for row — another check worth running. `V @ C` (forgetting the `.T`) gives a different answer with no error: it rotates the other way.

Timed with `timeit` (best of several runs, one machine; your numbers will differ):

| Method | Time | Relative to the loop |
| --- | --- | --- |
| Python loop, `C @ V[i]` per row | about 1.0 s | 1 |
| `V @ C.T` | 1.4 to 2.4 ms | about 430 to 730 times faster |
| `np.einsum('ij,nj->ni', C, V)` | about 14 ms | about 75 times faster |
| same, with `optimize=True` | about 1.4 ms | as fast as `@` |

The loop pays Python's per-call cost a million times. `@` hands the whole job to a compiled matrix-multiply routine. Plain `einsum` is compiled too, but it uses a general-purpose loop; `optimize=True` lets it hand this case to the same fast routine.
:::

### A different rotation for every vector

Often each vector has its own DCM — one attitude per time step. Then you have `Cs` of shape `(N, 3, 3)` and `V` of shape `(N, 3)`. Two correct spellings:

```python
def R3_stack(psi):
    c, s = np.cos(psi), np.sin(psi)
    out = np.zeros(psi.shape + (3, 3))
    out[:, 0, 0] = c;  out[:, 0, 1] = s
    out[:, 1, 0] = -s; out[:, 1, 1] = c
    out[:, 2, 2] = 1.0
    return out

Cs = R3_stack(np.radians([0.0, 30.0, 90.0]))
v = np.array([[1.0, 0.0, 0.0]] * 3)
print((Cs @ v[:, :, None])[:, :, 0].round(4))
# [[ 1.     0.     0.   ]
#  [ 0.866 -0.5    0.   ]
#  [ 0.    -1.    0.   ]]
print(np.allclose(np.einsum('nij,nj->ni', Cs, v), (Cs @ v[:, :, None])[:, :, 0]))
# True
```

`R3_stack` is the fill-one-position-at-a-time pattern: `out[:, 0, 0] = c` writes the `(N,)` array of cosines into position `[0, 0]` of every matrix at once. The results make sense: yaw 0 leaves $(1, 0, 0)$ alone, yaw $30^\circ$ gives $(\cos 30^\circ, -\sin 30^\circ, 0)$, and yaw $90^\circ$ gives $(0, -1, 0)$, as in the map check. For a million matrices, `einsum('nij,nj->ni', …)` took about 15 ms here and the stacked `@` about 33 ms — this time `einsum` won. Neither always wins; measure your case.

## einsum: products with named axes

`np.einsum` — "Einstein summation" — lets you describe a product by **[[naming the axes with letters|einstein]]**. The string before `->` labels the axes of each input, separated by commas. The string after `->` labels the output. Two rules:

1. **A letter that appears in the inputs but not in the output is multiplied across and summed away.**
2. **Letters in the output are kept, in the order written.**

Read `'nij,nj->ni'` aloud: "first input has axes n, i, j; second has n, j; output has n, i. So for each n and each i, multiply along j and add up." That is: for each n, matrix `A[n]` times vector `b[n]`. The shared `n` is *not* summed, because it appears in the output — it pairs matrix n with vector n.

| einsum string | Read aloud | Same as |
| --- | --- | --- |
| `'i,i->'` | multiply along i, sum it away | `a @ b` (dot product) |
| `'ij,j->i'` | for each i, sum over j | `M @ x` |
| `'ij,jk->ik'` | for each i, k, sum over j | `A @ B` |
| `'ij->ji'` | swap the letters | `A.T` |
| `'ni,ni->n'` | for each n, sum over i | row-by-row dot products, `(U * V).sum(axis=1)` |
| `'ij,nj->ni'` | for each n, i, sum over j | `V @ C.T`, one C for all rows |
| `'nij,nj->ni'` | for each n, i, sum over j | a stack of matrices times a stack of vectors |

::: key What einsum("nij,nj->ni", A, b) computes
A batched matrix-vector product: for each n, the 3x3 matrix `A[n]` times the vector `b[n]`. It is the readable way to express stacked linear algebra without reshaping gymnastics. Letters missing from the output are summed; letters in the output are kept in that order.
:::

::: warning A misspelled einsum still runs
`'nij,nj->nj'` or `'nji,nj->ni'` are legal strings that compute something else — the transpose's product, or a sum over the wrong axis — with no error. After writing one, check the output shape, and compare a few rows against a plain `C @ v` for a single `n`.
:::

## Check yourself

::: check
Give the result shape, or say it fails: (a) `(4, 3) @ (3,)`; (b) `(3,) @ (3,)`; (c) `(10, 3, 3) @ (3, 3)`; (d) `(10, 3, 3) @ (10, 3)`; (e) `(7, 2) @ (7, 2)`.
:::

::: answer
(a) The 3s touch: `(4,)` — four row-dot-products. (b) Both 1-D: a single number, the dot product. (c) The lone `(3, 3)` is broadcast across the stack of 10: `(10, 3, 3)`. (d) `(10, 3)` is read as one matrix, and its first axis, 10, must match the 3 before it: fails with "size 10 is different from 3". Write `(A @ v[..., None])[..., 0]` to get `(10, 3)`. (e) The inner lengths are 2 and 7: fails. `(7, 2) @ (2, 7)` would give `(7, 7)`, and `(2, 7) @ (7, 2)` would give `(2, 2)`.
:::

::: check
A reaction wheel's spin axis in body components is $\mathbf{h} = (0, 0, 2)\,\mathrm{N\,m\,s}$ (its angular momentum: how much spin it carries, and about which axis), and the body turns at $\boldsymbol{\omega} = (0.1, 0, 0)\,\mathrm{rad/s}$. The torque on the body from carrying the spinning wheel around is $-\boldsymbol{\omega} \times \mathbf{h}$. Compute it by hand, then write it as a skew matrix times $\mathbf{h}$.
:::

::: answer
$\boldsymbol{\omega} \times \mathbf{h}$ with $\omega = (0.1, 0, 0)$ and $h = (0, 0, 2)$: x component $0 \times 2 - 0 \times 0 = 0$; y component $0 \times 0 - 0.1 \times 2 = -0.2$; z component $0.1 \times 0 - 0 \times 0 = 0$. So $\boldsymbol{\omega} \times \mathbf{h} = (0, -0.2, 0)$, and the torque is $(0, 0.2, 0)\,\mathrm{N\,m}$. As a matrix: $[\boldsymbol{\omega}]_\times$ has rows $(0, 0, 0)$, $(0, 0, -0.1)$, $(0, 0.1, 0)$; times $\mathbf{h}$ that gives $(0, -0.2, 0)$, the same. Perpendicular to both, as a cross product must be: it has no x part (so it is perpendicular to $\omega$) and no z part (perpendicular to $h$).
:::

::: check
A teammate rotates `(N, 3)` sun vectors with `S_B = S_I @ C`, where `C` is the body-from-inertial DCM. The output has the right shape and every vector has length 1. What is wrong, and how could a test catch it?
:::

::: answer
Row `i` of `S_I @ C` is $\mathbf{C}^{\mathsf{T}}\mathbf{s}_i$, which converts body to inertial — the opposite direction. Shapes and lengths are both unchanged by any rotation, so neither check can catch it. The right expression is `S_I @ C.T`. A test that compares one row against `C @ S_I[i]`, or checks a known case (yaw $90^\circ$ must turn inertial x into body $-y$), catches it at once.
:::

::: check
Write an `einsum` string for each: (a) the `(N,)` array of dot products between matching rows of two `(N, 3)` arrays; (b) the `(N, 3, 3)` stack of products `A[n] @ B[n]`; (c) the `(N, 3, 3)` stack of transposes of `A`.
:::

::: answer
(a) `'ni,ni->n'`: `i` is missing from the output, so it is multiplied and summed; `n` is kept. (b) `'nij,njk->nik'`: for each `n`, the ordinary matrix-product pattern `ij,jk->ik`, with `n` carried along. (c) `'nij->nji'`: keep everything, swap the last two letters. That is the same as `A.swapaxes(-1, -2)` from the last lesson.
:::

::: check
Why does `np.dot(Cs, vs_col)` with `Cs` of shape `(1000, 3, 3)` and `vs_col` of shape `(1000, 3, 1)` go wrong, and what shape does it produce?
:::

::: answer
Above two dimensions, `np.dot` sums the last axis of `Cs` against the second-to-last axis of `vs_col`, and pairs every one of the 1,000 matrices with every one of the 1,000 vectors. The result has shape `(1000, 3, 1000, 1)`: a million products where you wanted a thousand, most of them meaningless. `Cs @ vs_col` pairs them in order and gives `(1000, 3, 1)`.
:::

## Summary

| Product | Shapes | Meaning |
| --- | --- | --- |
| `a * b`, `np.multiply` | broadcast | element by element — not a matrix product |
| `a @ b`, `np.matmul` | `(n,k) @ (k,m) -> (n,m)`; last two axes are matrices, leading axes a stack | matrix product, batched |
| `np.dot` | same as `@` up to 2-D; above that, every stack entry with every other | avoid for stacks |
| `np.cross(a, b)` | `(N,3), (N,3) -> (N,3)` | perpendicular to both; right-hand rule |
| $[\mathbf{a}]_\times$ | `(3,3)`, or `(N,3,3)` for a stack | skew matrix; $[\mathbf{a}]_\times\mathbf{b} = \mathbf{a}\times\mathbf{b}$ |
| DCM $\mathbf{C}$ | `(3,3)` | $\mathbf{v}_B = \mathbf{C}\mathbf{v}_I$; $\mathbf{C}\mathbf{C}^{\mathsf{T}} = \mathbf{I}$; det $= +1$ |
| 3-2-1 | | $\mathbf{C} = \mathbf{R}_1(\phi)\mathbf{R}_2(\theta)\mathbf{R}_3(\psi)$ |
| Rotate rows | `V @ C.T` or `einsum('ij,nj->ni', C, V)` | row `i` equals `C @ V[i]` |
| Batched | `einsum('nij,nj->ni', Cs, V)` or `(Cs @ V[..., None])[..., 0]` | one DCM per vector |

The next lesson uses `@` and these shapes to solve equations: `np.linalg.solve`, least squares, eigenvalues and the singular value decomposition — and explains why you almost never compute an inverse matrix, even though the DCM's inverse is conveniently [[its transpose|attitude-bridge]].

::: context dot-picture The dot product as a shadow
Shine a light straight down onto the line of $\mathbf{b}$. The shadow that $\mathbf{a}$ casts on that line has length $|\mathbf{a}|\cos\theta$. The dot product is that shadow times the length of $\mathbf{b}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="330" y2="120" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="330,120 318,114 318,126" fill="#1d6fd1"/>
  <text x="318" y="140" font-size="12" fill="#1d6fd1">b</text>
  <line x1="40" y1="120" x2="200" y2="30" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="200,30 186,32 193,43" fill="#1f2a44"/>
  <text x="120" y="62" font-size="12" fill="#1f2a44">a</text>
  <line x1="200" y1="30" x2="200" y2="120" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="40" y1="128" x2="200" y2="128" stroke="#b4232c" stroke-width="4"/>
  <text x="120" y="146" font-size="12" text-anchor="middle" fill="#b4232c">|a| cos θ</text>
  <path d="M80,120 A40,40 0 0,0 75,101" fill="none" stroke="#1f2a44"/>
  <text x="86" y="112" font-size="12" fill="#1f2a44">θ</text>
</svg>
```

When the arrows are perpendicular, the shadow shrinks to a point and the dot product is zero.
:::

::: context gufunc-signature Reading the matmul signature
NumPy builds `matmul` as a "generalized universal function", which works on a small **core** — here a matrix — and loops over any stack axes in front. The signature `(n?,k),(k,m?)->(n?,m?)` lists the core axes of each input and of the output. The shared letter `k` is the length that must match and then disappears; the question marks mean that axis may be missing, which is how 1-D vectors are allowed. So "mismatch in its core dimension 0 … size 2 is different from 4" means the two `k`s disagreed.
:::

::: context ellipsis The three dots
`...` is a real Python object called `Ellipsis`. Inside NumPy indexing it stands for "as many `:` as needed to fill in the leading axes". So for an `(N, 3)` array, `v[..., None]` is `v[:, :, None]`, and for a `(D, N, 3)` array it is `v[:, :, :, None]`. Code written with `...` works for a single vector, a stack of vectors, or a stack of stacks, without changes.
:::

::: context right-hand The right-hand rule
Point your right hand's fingers along $\mathbf{a}$ and curl them toward $\mathbf{b}$. Your thumb points along $\mathbf{a} \times \mathbf{b}$. For x cross y, the thumb points along z.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="150" y1="120" x2="280" y2="120" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="290,120 278,114 278,126" fill="#1d6fd1"/>
  <text x="292" y="140" font-size="12" fill="#1d6fd1">a = x</text>
  <line x1="150" y1="120" x2="80" y2="155" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="72,159 80,149 86,160" fill="#1f2a44"/>
  <text x="30" y="150" font-size="12" fill="#1f2a44">b = y</text>
  <line x1="150" y1="120" x2="150" y2="25" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="150,15 144,27 156,27" fill="#b4232c"/>
  <text x="160" y="24" font-size="12" fill="#b4232c">a × b = z</text>
  <path d="M230,112 C215,150 150,160 110,140" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polygon points="104,137 116,136 112,146" fill="#6c7a93"/>
  <text x="200" y="160" font-size="11" fill="#6c7a93">fingers curl from a to b</text>
</svg>
```

Swap the order and you must curl the other way, so the thumb flips: $\mathbf{y} \times \mathbf{x} = -\mathbf{z}$.
:::

::: context dcm-name Why "direction cosines"
The entry in row $i$, column $j$ of the DCM is the dot product of body axis $i$ with inertial axis $j$. Both are unit arrows, so that dot product is the cosine of the angle between them. Nine angles, nine cosines — the direction cosines. You rarely compute them from angles directly; they come out of Euler angles, quaternions or an attitude filter. But the name tells you how to read any entry: `C[2, 0]` near 1 means body z points almost along inertial x.
:::

::: context transpose-trick Why V @ C.T does the right thing
Write $\mathbf{W} = \mathbf{V}\mathbf{C}^{\mathsf{T}}$ entry by entry. Entry $(i, k)$ is row $i$ of $\mathbf{V}$ dotted with column $k$ of $\mathbf{C}^{\mathsf{T}}$. Column $k$ of $\mathbf{C}^{\mathsf{T}}$ is row $k$ of $\mathbf{C}$. So

$$
W_{ik} = \sum_j V_{ij} C_{kj} = \sum_j C_{kj} V_{ij},
$$

which is component $k$ of $\mathbf{C}\,\mathbf{v}_i$. Every row of $\mathbf{W}$ is $\mathbf{C}$ times the matching row of $\mathbf{V}$. It is the same as `(C @ V.T).T`, without building the transposed copy.
:::

::: context einstein Einstein's shorthand
In 1916, writing up general relativity, Albert Einstein got tired of writing the summation sign $\sum$ in front of nearly every formula. He adopted a rule: whenever an index letter appears twice in a product, sum over it. So $A_{ij} x_j$ means $\sum_j A_{ij} x_j$. NumPy's `einsum` uses the same idea, with one addition — the `->` part lets you say which letters to keep, so a letter can be repeated across inputs (like `n` in `'nij,nj->ni'`) without being summed.
:::

::: context attitude-bridge Where DCMs come back
The attitude-determination and Kalman-filter modules use DCMs, their stacks, and the skew matrix constantly: the rate of change of a DCM is $-[\boldsymbol{\omega}]_\times \mathbf{C}$, and small attitude errors are written with skew matrices. The floating-point lesson later in this module explains why a DCM propagated for hours drifts away from $\mathbf{C}\mathbf{C}^{\mathsf{T}} = \mathbf{I}$, and how to measure that drift with `np.allclose` and a norm.
:::
