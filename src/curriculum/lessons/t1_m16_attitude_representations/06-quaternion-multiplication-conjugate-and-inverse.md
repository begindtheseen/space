---
id: l06-quaternion-multiplication-conjugate-and-inverse
title: Quaternion multiplication, conjugate, inverse and the unit-norm constraint
minutes: 20
covers:
  - quaternion multiplication, conjugate, inverse, unit-norm constraint
---

Think about the moves a dance teacher gives you: "quarter turn left, then lean back." You need to be able to do four things with moves like that. Put two of them together into one. Undo one. Work out where your outstretched hand ends up. And keep your balance — not drift slowly off the floor — while you repeat them a thousand times.

Attitude software needs exactly those four things, constantly. **Compose** two rotations into one. **Invert** a rotation. **Rotate a vector** — carry a sensor's pointing direction into another frame. And **keep the representation valid** as it is stepped forward in time. The unit quaternion does all four cheaply, and this lesson builds each one from a single multiplication rule.

The conventions of lesson 05 hold throughout: unit, scalar-first, Hamilton, with $q_{A\leftarrow B}\otimes q_{B\leftarrow C} = q_{A\leftarrow C}$ and $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$. Write a quaternion as $q = [w, \mathbf{v}]$, with scalar part $w$ and vector part $\mathbf{v} = (x, y, z)$.

One big payoff is worth saying up front. The unit quaternions, with this multiplication, form a closed family — multiply any two and you get another. As a set of points they form a sphere in four dimensions. So combining rotations becomes multiplying points on a sphere: smooth, bounded, with no bad spots. That is the whole reason flight software carries quaternions rather than angles.

## The product

Think of a quaternion as a number $w + xi + yj + zk$ and multiply two of them the way you would multiply any brackets: every piece of the first times every piece of the second. Then tidy up with Hamilton's rules from lesson 05: $i^2 = j^2 = k^2 = -1$, $ij = k$, $jk = i$, $ki = j$, and the reversed products take a minus sign ($ji = -k$, and so on).

The sixteen pieces collect into a compact form using the dot and cross products you already know:

$$
q_1\otimes q_2 = \bigl[\,w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2,\ \ w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2\,\bigr].
$$

In words: the new scalar is "scalar times scalar, minus the dot product of the vectors". The new vector is "each scalar times the other's vector, plus the cross product".

::: note Why it has to be true
Split each quaternion into its scalar and its vector part, treating $\mathbf{v} = xi + yj + zk$ as a quaternion with zero scalar. The product has four pieces:

$$
(w_1 + \mathbf{v}_1)(w_2 + \mathbf{v}_2) = w_1w_2 + w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\mathbf{v}_2 .
$$

The first three are ordinary scaling. Only the last needs the rules. Multiply out $\mathbf{v}_1\mathbf{v}_2 = (x_1 i + y_1 j + z_1 k)(x_2 i + y_2 j + z_2 k)$. The three "same letter" pieces give $x_1x_2 i^2 + y_1y_2 j^2 + z_1z_2 k^2 = -(x_1x_2 + y_1y_2 + z_1z_2) = -\mathbf{v}_1\cdot\mathbf{v}_2$. The six "different letter" pieces pair up: $y_1z_2\,jk + z_1y_2\,kj = (y_1z_2 - z_1y_2)\,i$, and likewise for $j$ and $k$. Those are exactly the components of $\mathbf{v}_1\times\mathbf{v}_2$. So

$$
\mathbf{v}_1\mathbf{v}_2 = -\mathbf{v}_1\cdot\mathbf{v}_2 + \mathbf{v}_1\times\mathbf{v}_2 ,
$$

and adding the four pieces gives the product formula.
:::

::: example Multiplying two quaternions by hand
Use the two turns from lesson 05: $a$ is a $30^\circ$ roll about $x$ and $b$ is a $50^\circ$ yaw about $z$.

$$
a = [0.965926,\ (0.258819,\ 0,\ 0)], \qquad b = [0.906308,\ (0,\ 0,\ 0.422618)].
$$

**Scalar.** The two vector parts point along $x$ and $z$, so their dot product is $0$. The scalar is $0.965926 \times 0.906308 - 0 = 0.875426$.

**Each scalar times the other's vector.** $w_1\mathbf{v}_2 = 0.965926 \times (0, 0, 0.422618) = (0, 0, 0.408218)$. And $w_2\mathbf{v}_1 = 0.906308 \times (0.258819, 0, 0) = (0.234570, 0, 0)$.

**Cross product.** $(0.258819, 0, 0)\times(0, 0, 0.422618)$. The $y$ component is $z_1x_2 - x_1z_2 = 0 - 0.258819\times 0.422618 = -0.109382$; the other two are $0$. So $\mathbf{v}_1\times\mathbf{v}_2 = (0, -0.109382, 0)$.

**Add the three vectors:**

$$
a\otimes b = [\,0.875426,\ (0.234570,\ -0.109382,\ 0.408218)\,].
$$

**Check the length.** $0.875426^2 + 0.234570^2 + 0.109382^2 + 0.408218^2 = 1.000000$. Two unit quaternions multiplied to a unit quaternion — the next section proves this always happens.
:::

### Three properties

- **Order matters.** Swap the two arguments. The scalar $w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2$ and the sum $w_1\mathbf{v}_2 + w_2\mathbf{v}_1$ do not change, but the cross product flips sign. So

$$
q_1\otimes q_2 - q_2\otimes q_1 = [\,0,\ 2\,\mathbf{v}_1\times\mathbf{v}_2\,] .
$$

  The two orders differ only in the vector part, and only by twice the cross product. They share the scalar exactly, so they share the principal angle — the trap from lesson 05. The product is the same both ways exactly when $\mathbf{v}_1\times\mathbf{v}_2 = \mathbf{0}$: when the two turns share an axis. That matches the geometry, since turns about one axis can be done in either order.
- **Brackets do not matter.** $(q_1\otimes q_2)\otimes q_3 = q_1\otimes(q_2\otimes q_3)$. This is called being **associative**, and it means a chain of frames needs no brackets.
- **It can be written as a matrix.** Each output number is a sum of "one number from $q_1$ times one from $q_2$". So holding either quaternion fixed, the product is a $4\times 4$ matrix times the other:

$$
q_1\otimes q_2 = [q_1]_L\,q_2 = [q_2]_R\,q_1,
\qquad
[q]_L = \begin{bmatrix} w & -\mathbf{v}^\top\\ \mathbf{v} & w\mathbf{I}_3 + [\mathbf{v}\times]\end{bmatrix},
\qquad
[q]_R = \begin{bmatrix} w & -\mathbf{v}^\top\\ \mathbf{v} & w\mathbf{I}_3 - [\mathbf{v}\times]\end{bmatrix}.
$$

  Read $[q]_L$ as "q, left-multiplication matrix" and $[q]_R$ as "q, right-multiplication matrix". The only difference is the sign of the cross-product block, because the cross product is what flips with order. These forms are what a [[Kalman filter|kalman-matrices]] uses, where a quaternion update must be differentiated. For a unit $q$, both are $4\times 4$ orthogonal matrices with determinant $+1$ — a fact used again in lesson 12.

::: key The Hamilton quaternion product
$(w_1,\mathbf{v}_1)\otimes(w_2,\mathbf{v}_2) = (w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2,\ w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2)$. Non-commutative, exactly like rotation composition; associative; and $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$.
:::

## Lengths multiply, so unit quaternions stay unit

For ordinary numbers, $\lvert ab\rvert = \lvert a\rvert\,\lvert b\rvert$: the size of a product is the product of the sizes. Complex numbers do the same — lengths multiply, angles add. Quaternions keep that habit:

$$
\lVert q_1\otimes q_2\rVert = \lVert q_1\rVert\,\lVert q_2\rVert .
$$

A numerical check over hundreds of random pairs of non-unit quaternions agrees to about $10^{-15}$, which is round-off.

::: note Why it has to be true
Square the length of the product: scalar squared plus vector squared.

The scalar squared is $(w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2)^2 = w_1^2w_2^2 - 2w_1w_2(\mathbf{v}_1\cdot\mathbf{v}_2) + (\mathbf{v}_1\cdot\mathbf{v}_2)^2$.

The vector is $w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2$. The cross product is perpendicular to both $\mathbf{v}_1$ and $\mathbf{v}_2$, so every mixed term involving it has zero dot product. What is left of its length squared is $w_1^2\lVert\mathbf{v}_2\rVert^2 + w_2^2\lVert\mathbf{v}_1\rVert^2 + 2w_1w_2(\mathbf{v}_1\cdot\mathbf{v}_2) + \lVert\mathbf{v}_1\times\mathbf{v}_2\rVert^2$.

Add the two. The $2w_1w_2(\mathbf{v}_1\cdot\mathbf{v}_2)$ terms cancel. Then use [[the identity|lagrange-identity]] $\lVert\mathbf{a}\times\mathbf{b}\rVert^2 + (\mathbf{a}\cdot\mathbf{b})^2 = \lVert\mathbf{a}\rVert^2\lVert\mathbf{b}\rVert^2$:

$$
w_1^2w_2^2 + w_1^2\lVert\mathbf{v}_2\rVert^2 + w_2^2\lVert\mathbf{v}_1\rVert^2 + \lVert\mathbf{v}_1\rVert^2\lVert\mathbf{v}_2\rVert^2
= \bigl(w_1^2 + \lVert\mathbf{v}_1\rVert^2\bigr)\bigl(w_2^2 + \lVert\mathbf{v}_2\rVert^2\bigr).
$$

That is $\lVert q_1\rVert^2\lVert q_2\rVert^2$. Take square roots.
:::

The consequence is the one that matters. If both factors have length $1$, so does the product. The unit quaternions are closed under multiplication. They contain the identity $[1,\mathbf{0}]$. And, as the next section shows, they contain every inverse. A collection with those properties is called a **group**. As a set of points, this group is the [[unit sphere in four dimensions|four-d-sphere]], written $S^3$ — all four-number points at distance $1$ from the origin.

Compare the rotation matrix. Multiplying two exact rotation matrices gives an exact rotation matrix, in principle. In floating point, both inputs are slightly off, and the product is a little worse than either. The same is true of quaternions. The difference is what it costs to fix. A quaternion has a single rule, $w^2 + \mathbf{v}^\top\mathbf{v} = 1$, so the repair is one square root and four divisions. A rotation matrix has six rules, and the repair is a matrix iteration.

## Conjugate and inverse

The **conjugate** of a quaternion flips the sign of its vector part. Write it $q^{*}$, read "q star":

$$
q^{*} = [\,w,\ -\mathbf{v}\,] .
$$

What does it mean? Since $q = [\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$, the conjugate is $[\cos(\Phi/2), (-\hat{\mathbf{e}})\sin(\Phi/2)]$ — the same angle about the reversed axis. Lesson 04 showed that is the inverse rotation: turn the same amount the other way.

Check it with the product formula. Multiply $q$ by its conjugate:

$$
q\otimes q^{*} = \bigl[\,w^2 + \mathbf{v}\cdot\mathbf{v},\ \ -w\mathbf{v} + w\mathbf{v} + \mathbf{v}\times(-\mathbf{v})\,\bigr] = \bigl[\lVert q\rVert^2,\ \mathbf{0}\bigr].
$$

The scalar is $w\cdot w - \mathbf{v}\cdot(-\mathbf{v}) = w^2 + \mathbf{v}\cdot\mathbf{v}$. The vector is $w(-\mathbf{v}) + w\mathbf{v} = \mathbf{0}$, plus a cross product of an arrow with (minus) itself, which is also zero. So the result is an ordinary number — the length squared. Divide by it and you have the identity. That gives the **inverse**, the quaternion that undoes $q$:

$$
q^{-1} = \frac{q^{*}}{\lVert q\rVert^{2}},
\qquad\text{and for a unit quaternion}\qquad
q^{-1} = q^{*} .
$$

Inverting a rotation costs three sign flips. Nothing in attitude work is cheaper.

The conjugate of a product reverses the order — like taking off socks and shoes: shoes come off first.

$$
(q_1\otimes q_2)^{*} = q_2^{*}\otimes q_1^{*} .
$$

This matches $(\mathbf{C}_1\mathbf{C}_2)^\top = \mathbf{C}_2^\top\mathbf{C}_1^\top$, as it must, since $\mathbf{C}(q^*) = \mathbf{C}(q)^\top$.

::: key Conjugate, inverse and the unit-norm constraint
$q^{*} = [w, -\mathbf{v}]$; $q\otimes q^{*} = [\lVert q\rVert^2, \mathbf{0}]$; in general $q^{-1} = q^{*}/\lVert q\rVert^2$, and for a unit quaternion $q^{-1} = q^{*}$. The constraint $w^2 + \mathbf{v}^\top\mathbf{v} = 1$ is a single scalar equation on four parameters, leaving three degrees of freedom, and $(q_1\otimes q_2)^{*} = q_2^{*}\otimes q_1^{*}$.
:::

## Rotating a vector

To rotate an ordinary arrow $\mathbf{p}$ with a quaternion, first dress it up as a quaternion: put a zero in the scalar slot. That makes a **[[pure quaternion|pure-quaternion]]**, $[0, \mathbf{p}]$. Then **sandwich** it — $q$ on the left, $q^*$ on the right:

$$
[\,0,\ \mathbf{p}'\,] = q\otimes[\,0,\ \mathbf{p}\,]\otimes q^{*} .
$$

Write $q = [w, \mathbf{u}]$ here, so the letter $\mathbf{v}$ is free. Expand the two products with the formula.

**The scalar part** of the result comes out as $-w(\mathbf{u}\cdot\mathbf{p}) + w(\mathbf{p}\cdot\mathbf{u}) + (\mathbf{u}\times\mathbf{p})\cdot\mathbf{u}$. The first two cancel, and the last is zero because a cross product is perpendicular to each of its inputs. So the scalar is $0$: the sandwich turns a pure quaternion into a pure quaternion. That is why it is the right form.

**The vector part** works out to

$$
\mathbf{p}' = (w^2 - \mathbf{u}^\top\mathbf{u})\,\mathbf{p} + 2(\mathbf{u}\cdot\mathbf{p})\,\mathbf{u} + 2w\,(\mathbf{u}\times\mathbf{p})
= \bigl[(w^2-\mathbf{u}^\top\mathbf{u})\mathbf{I}_3 + 2\mathbf{u}\mathbf{u}^\top + 2w[\mathbf{u}\times]\bigr]\mathbf{p},
$$

which is exactly the matrix $\mathbf{C}(q)$ of lesson 05. So the sandwich and the rotation matrix are the same operation.

The same derivation shows why $\operatorname{tr}\mathbf{C} = 4w^2 - 1$. The cross-product matrix $[\mathbf{u}\times]$ has zeros on its diagonal. The identity contributes $3(w^2 - \mathbf{u}^\top\mathbf{u})$ and $2\mathbf{u}\mathbf{u}^\top$ contributes $2\mathbf{u}^\top\mathbf{u}$. Total: $3w^2 - \mathbf{u}^\top\mathbf{u}$. On the unit sphere $\mathbf{u}^\top\mathbf{u} = 1 - w^2$, so the trace is $4w^2 - 1$.

For a unit quaternion, $w^2 - \mathbf{u}^\top\mathbf{u} = 1 - 2\mathbf{u}^\top\mathbf{u}$, and the formula rearranges into a form that is handy when only one or two arrows need rotating:

$$
\mathbf{p}' = \mathbf{p} + 2w\,(\mathbf{u}\times\mathbf{p}) + 2\,\mathbf{u}\times(\mathbf{u}\times\mathbf{p}) .
$$

### What each operation costs

Count directly off the formulas, with $m$ for multiplications and $a$ for additions:

| Operation | Quaternion | Rotation matrix |
| --- | --- | --- |
| Storage | 4 numbers | 9 numbers |
| Compose two rotations | $16m$, $12a$ | $27m$, $18a$ |
| Invert | 3 sign flips | 9 entry moves (transpose) |
| Rotate one vector | $18m$, $12a$ | $9m$, $6a$ |
| Restore the constraint | 1 square root, 4 divisions | one iteration step: $2\times 27m$ plus scaling |

The quaternion wins on storage, on composing, and by a mile on repair. The matrix wins on rotating vectors. So real flight software carries the quaternion as its state, and converts to a matrix whenever more than a couple of arrows must be turned at the same attitude — a star catalog, a set of thruster directions, a batch of measurements.

::: example Composing an attitude with a sensor mount
A spacecraft's attitude is a $50^\circ$ turn about the reference $y$ axis: $q_{N\leftarrow B} = [0.906308,\ 0,\ 0.422618,\ 0]$. (Check: $\cos 25^\circ = 0.906308$ and $\sin 25^\circ = 0.422618$.)

A star tracker is mounted the way lesson 01 described: turn $40^\circ$ about body $z$, then $25^\circ$ about the new $y$. Composing those two turns gives

$$
q_{B\leftarrow S} = [0.917418,\ -0.074027,\ 0.203387,\ 0.333913],
\qquad \lVert q_{B\leftarrow S}\rVert = 1.000000 .
$$

Its matrix $\mathbf{C}(q_{B\leftarrow S})$ is exactly the $\mathbf{C}_{B\leftarrow S}$ of lesson 01.

**Compose in the order the labels demand** — inner labels matching, $B$ next to $B$:

$$
q_{N\leftarrow S} = q_{N\leftarrow B}\otimes q_{B\leftarrow S} = [\,0.745508,\ 0.074027,\ 0.572049,\ 0.333913\,].
$$

Its length is $1.000000$, as the last section promised. Its principal angle is $2\arcsin\lVert\mathbf{v}\rVert = 83.594^\circ$. That agrees with $\arccos\bigl((\operatorname{tr}\mathbf{C}-1)/2\bigr)$ on its matrix to twelve digits, and $\mathbf{C}(q_{N\leftarrow S})$ equals $\mathbf{C}(q_{N\leftarrow B})\mathbf{C}(q_{B\leftarrow S})$ to within $1.1\times 10^{-16}$.

**Now the wrong order.** $q_{B\leftarrow S}\otimes q_{N\leftarrow B} = [0.745508,\ -0.208209,\ 0.572049,\ 0.271343]$. Same scalar, so the same $83.594^\circ$ principal angle — but an attitude $33.243^\circ$ away from the truth. The difference between the two vector parts is $(0.282235,\ 0,\ 0.062570)$. That is exactly $2\,\mathbf{v}_1\times\mathbf{v}_2$, as the order formula predicts.

**Finally, the boresight.** In sensor axes the tracker looks along $\mathbf{b}^{S} = (0,0,1)$. The sandwich gives

$$
q_{N\leftarrow S}\otimes[0,\mathbf{b}^{S}]\otimes q_{N\leftarrow S}^{*} = [\,0,\ 0.902371,\ 0.271654,\ 0.334561\,].
$$

The scalar is exactly zero, as it must be. The vector matches $\mathbf{C}(q_{N\leftarrow S})\mathbf{b}^{S}$ to within $1.1\times 10^{-16}$, and the compact form $\mathbf{p} + 2w(\mathbf{u}\times\mathbf{p}) + 2\mathbf{u}\times(\mathbf{u}\times\mathbf{p})$ agrees to within $5.6\times 10^{-17}$. Sanity check: its length is $\sqrt{0.902371^2 + 0.271654^2 + 0.334561^2} = 1.000000$, the length of a unit boresight.
:::

::: example Norm drift, and why it is four times smaller than the DCM's
The quaternion changes in time by the **[[kinematic equation|half-factor]]** $\dot{q} = \tfrac12\,q\otimes[0,\boldsymbol{\omega}^{B}]$, where $\boldsymbol{\omega}^{B}$ ("omega in B") is the spin rate in body axes and $\dot q$ ("q dot") is the rate of change of $q$.

**Why the true path stays on the sphere.** Think of $q$ and $\dot q$ as four-number arrows. Their dot product is $-w(\mathbf{u}\cdot\boldsymbol{\omega}) + \mathbf{u}\cdot(w\boldsymbol{\omega} + \mathbf{u}\times\boldsymbol{\omega})$, times $\tfrac12$. The first two terms cancel, and $\mathbf{u}\cdot(\mathbf{u}\times\boldsymbol{\omega}) = 0$. So $\dot q$ is always perpendicular to $q$ — it points along the sphere, never out of it — and the exact solution keeps length $1$ forever.

**Why a simple step leaves it.** A forward Euler step, $q \leftarrow q + \Delta t\,\dot q$, moves in a [[straight line along the sphere's surface|tangent-step]]. The step has length $\lVert q\rVert\,\lVert\boldsymbol{\omega}\rVert\Delta t/2$ and is perpendicular to $q$. By Pythagoras, each step multiplies the length by $\sqrt{1 + (\lVert\boldsymbol{\omega}\rVert\Delta t/2)^2}$.

**Numbers.** Run the same case as lesson 01: $\lVert\boldsymbol{\omega}\rVert = 2^\circ/\mathrm{s} = 0.0349066\,\mathrm{rad/s}$, $\Delta t = 0.01\,\mathrm{s}$, $60{,}000$ steps. Then $\lVert\boldsymbol{\omega}\rVert\Delta t/2 = 1.74533\times 10^{-4}$, whose square is $3.046\times 10^{-8}$. After $60{,}000$ steps the length is $\bigl(\sqrt{1 + 3.046\times 10^{-8}}\bigr)^{60000} = (1 + 3.046\times 10^{-8})^{30000} = 1.00091427$.

| $t$ | $60\,\mathrm{s}$ | $300\,\mathrm{s}$ | $600\,\mathrm{s}$ |
| --- | --- | --- | --- |
| $\lVert q\rVert - 1$ | $9.139\times 10^{-5}$ | $4.570\times 10^{-4}$ | $9.143\times 10^{-4}$ |

The code below measures $1.0009142699$ at $600\,\mathrm{s}$, matching the prediction to ten digits.

**Compare the DCM.** Lesson 01's rotation matrix, stepped the same way, reached a column length of $1.0036621$ — a drift $4.005$ times larger. The half-angle is why. The quaternion's step is half as long, and the drift grows with the *square* of the step, so it is a quarter as large. The same factor shows in the attitude itself: after $60{,}000$ steps the quaternion's angle falls short by $1.22\times 10^{-5}$ degrees, against the DCM's $4.87\times 10^{-5}$.

```python
import numpy as np

def qmul(a, b):
    w1, v1 = a[0], a[1:]
    w2, v2 = b[0], b[1:]
    return np.concatenate(([w1 * w2 - v1 @ v2], w1 * v2 + w2 * v1 + np.cross(v1, v2)))

w = np.array([0.0, np.deg2rad(2.0), 0.0])
q = np.array([1.0, 0.0, 0.0, 0.0])
for _ in range(60000):                       # 600 s at dt = 0.01 s
    q = q + 0.01 * 0.5 * qmul(q, np.array([0.0, *w]))
print(np.linalg.norm(q) - 1.0)               # 0.0009142699356297079
q /= np.linalg.norm(q)                       # the entire repair
```
:::

::: warning Renormalizing does not fix the attitude, here either
One division restores $\lVert q\rVert = 1$ exactly. That is satisfying, and incomplete. Scaling a quaternion by a positive number does not change the rotation it stands for — once you divide by the length, $\mathbf{C}(\lambda q) = \mathbf{C}(q)$ for any $\lambda > 0$. So normalizing removes something that was never affecting the answer. The attitude error from the stepping survives untouched, exactly as with the DCM in lesson 01. Normalize to keep the state bounded and the formulas valid. Step more accurately to get a better attitude.
:::

::: warning The sandwich needs the conjugate on the right, and the vector in the right slots
Two slips are common. First, writing $q^{*}\otimes[0,\mathbf{p}]\otimes q$ — conjugate on the wrong side — gives the inverse rotation. That is the transpose error of lesson 05 and costs $2\Phi$ of pointing. Second, building the pure quaternion in the wrong storage order: putting $\mathbf{p}$ in the first three slots and the zero last, then handing it to a scalar-first routine. With the example's $q_{N\leftarrow S}$ and $\mathbf{p} = (0,0,1)$, the routine reads the array $(0,0,1,0)$ as $[0, (0,1,0)]$ and returns the rotated $y$ axis, $(-0.413176,\ 0.766044,\ 0.492404)$, instead of the boresight. Both slips produce unit-length output, and neither is caught by a structural check.
:::

## Check yourself

::: check
Show that $q\otimes q^{*} = [\lVert q\rVert^2, \mathbf{0}]$ straight from the product formula, and use it to find $q^{-1}$ for a quaternion that is not unit length.
:::

::: answer
Put $q_1 = [w,\mathbf{v}]$ and $q_2 = [w, -\mathbf{v}]$ into $[w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2,\ w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2]$.

**Scalar.** $w^2 - \mathbf{v}\cdot(-\mathbf{v}) = w^2 + \mathbf{v}\cdot\mathbf{v} = \lVert q\rVert^2$.

**Vector.** $w(-\mathbf{v}) + w\mathbf{v} + \mathbf{v}\times(-\mathbf{v}) = \mathbf{0} + \mathbf{0} = \mathbf{0}$, since any arrow crossed with itself is zero.

So $q\otimes q^* = [\lVert q\rVert^2,\mathbf{0}] = \lVert q\rVert^2\,[1,\mathbf{0}]$. Divide both sides by the number $\lVert q\rVert^2$: $q\otimes\bigl(q^*/\lVert q\rVert^2\bigr) = [1,\mathbf{0}]$, the identity. Hence $q^{-1} = q^{*}/\lVert q\rVert^2$, which becomes $q^*$ when $\lVert q\rVert = 1$.
:::

::: check
Two unit quaternions have the same scalar part but different vector parts. Could they be the two orders of one product? Could they be two genuinely different attitudes with the same principal angle?
:::

::: answer
Yes to both.

**Two orders.** The order formula $q_1\otimes q_2 - q_2\otimes q_1 = [0, 2\mathbf{v}_1\times\mathbf{v}_2]$ says the two orders always share a scalar and differ only in the vector part.

**Different attitudes.** The scalar is $\cos(\Phi/2)$, so equal scalars mean equal principal angles. Any two unit quaternions with the same $w$ are turns through the same angle about different axes.

The lesson: matching principal angles is weak evidence that two attitudes agree. They agree only when all four numbers agree, up to an overall sign.
:::

::: check
Why does the sandwich need the conjugate on the right instead of $q$ again? What would $q\otimes[0,\mathbf{p}]\otimes q$ give?
:::

::: answer
The sandwich must turn a pure quaternion into a pure quaternion, and must keep the arrow's length. With $q^{*}$ on the right, the scalar part cancels exactly, as the derivation showed.

With $q$ on the right, slip $q^*\otimes q = [1,\mathbf{0}]$ into the middle: $q\otimes[0,\mathbf{p}]\otimes q = \bigl(q\otimes[0,\mathbf{p}]\otimes q^*\bigr)\otimes q\otimes q = [0,\mathbf{p}']\otimes q^2$. That multiplies the correctly rotated arrow by $q^2$, which is a turn through $2\Phi$. The result is not pure: its scalar is $-2w(\mathbf{u}\cdot\mathbf{p})$ in general. And its vector part is not a rotation of $\mathbf{p}$ by anything — once the leaked scalar is thrown away, it does not even keep the arrow's length.
:::

::: check
A propagator steps the quaternion with forward Euler at $100\,\mathrm{Hz}$ while a spacecraft spins at $30^\circ/\mathrm{s}$, and never normalizes. How far does the length drift in one hour? Does it matter?
:::

::: answer
**Per step.** $30^\circ/\mathrm{s} = 0.5236\,\mathrm{rad/s}$ and $\Delta t = 0.01\,\mathrm{s}$, so $\lVert\boldsymbol{\omega}\rVert\Delta t/2 = 0.5236 \times 0.01/2 = 2.618\times 10^{-3}$. Its square is $6.854\times 10^{-6}$, so each step multiplies the length by $\sqrt{1 + 6.854\times 10^{-6}}$.

**Per hour.** One hour is $n = 360{,}000$ steps. The length grows by $(1 + 6.854\times 10^{-6})^{180000} = e^{1.234} = 3.43$. The quaternion's length more than triples.

**Does it matter?** Not for the attitude it stands for, since $\mathbf{C}(\lambda q) = \mathbf{C}(q)$ after normalizing. Everywhere else it does. The numbers leave the range any [[fixed-point|fixed-point]] storage assumed. Any code that reads $w$ as $\cos(\Phi/2)$ gets nonsense. And a drift this large comes with a large stepping error in the attitude too. Normalize every step; it costs one square root.
:::

::: check
You have $q_{N\leftarrow B}$ and need the body-axis components of an arrow known in reference axes. Write the sandwich. What goes wrong if you use $q_{N\leftarrow B}$ where $q_{B\leftarrow N}$ belongs?
:::

::: answer
You need $q_{B\leftarrow N} = q_{N\leftarrow B}^{*}$, so

$$
[0, \mathbf{p}^{B}] = q_{N\leftarrow B}^{*}\otimes[0,\mathbf{p}^{N}]\otimes q_{N\leftarrow B} .
$$

Using the un-conjugated quaternion applies the inverse rotation — the transpose error of lesson 05. The resulting arrow still has the right length, passes any length check, and is wrong by twice the principal angle of $q_{N\leftarrow B}$. At a $7^\circ$ attitude the error is $14^\circ$. At the identity attitude it is zero, which is why the bug survives bench testing.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $q = [w,\mathbf{v}]$ | Scalar-first, Hamilton, unit |
| $q_1\otimes q_2 = [w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2,\ w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2]$ | The product |
| $q_1\otimes q_2 - q_2\otimes q_1 = [0, 2\mathbf{v}_1\times\mathbf{v}_2]$ | Order matters; both orders share the scalar and the principal angle |
| $[q]_L, [q]_R$ | $4\times 4$ left and right multiplication matrices |
| $\lVert q_1\otimes q_2\rVert = \lVert q_1\rVert\lVert q_2\rVert$ | Unit quaternions are closed: the group $S^3$ |
| $q^{*} = [w,-\mathbf{v}]$ | Conjugate; $(q_1\otimes q_2)^{*} = q_2^{*}\otimes q_1^{*}$ |
| $q\otimes q^{*} = [\lVert q\rVert^2,\mathbf{0}]$, $q^{-1} = q^{*}/\lVert q\rVert^2$ | Inverse; equals $q^{*}$ for unit $q$ |
| $[0,\mathbf{p}'] = q\otimes[0,\mathbf{p}]\otimes q^{*}$ | Rotating a vector; equals $\mathbf{C}(q)\mathbf{p}$ |
| $\mathbf{p}' = \mathbf{p} + 2w(\mathbf{u}\times\mathbf{p}) + 2\mathbf{u}\times(\mathbf{u}\times\mathbf{p})$ | Compact form for one or two vectors |
| $w^2 + \mathbf{v}^\top\mathbf{v} = 1$ | One scalar constraint; repair by one square root |
| Worked figures | Norm drift $9.14\times 10^{-4}$ after $60{,}000$ Euler steps, a quarter of the DCM's |

The algebra is complete, and the group is the sphere $S^3$. The next lesson asks what it means that this sphere has twice as many points as there are attitudes — and what a controller must do about it.

::: context kalman-matrices Why a filter wants matrices
A Kalman filter — the estimator that blends gyro and star tracker data into one best attitude — works by linear algebra: it predicts, compares with a measurement, and corrects, all with matrices. To use a quaternion product inside that machinery, the filter needs the product written as "a matrix times a four-number column". $[q]_L$ and $[q]_R$ are exactly that. They also make derivatives easy: the change of $q_1\otimes q_2$ with respect to $q_2$ is simply $[q_1]_L$.
:::

::: context lagrange-identity Dot and cross share one triangle
For two arrows at angle $\theta$, the dot product is $\lVert\mathbf{a}\rVert\lVert\mathbf{b}\rVert\cos\theta$ and the cross product's length is $\lVert\mathbf{a}\rVert\lVert\mathbf{b}\rVert\sin\theta$ — the area of the slanted box the two arrows span. Square both and add: $\cos^2\theta + \sin^2\theta = 1$ leaves $\lVert\mathbf{a}\rVert^2\lVert\mathbf{b}\rVert^2$. That is the whole identity.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="60,150 220,150 284.3,73.4 124.3,73.4" fill="#8fb8f0" fill-opacity="0.5" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="150" x2="210" y2="150" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="220.0,150.0 210.0,155.0 210.0,145.0" fill="#1f2a44"/>
  <line x1="60" y1="150" x2="117.9" y2="81.1" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="124.3,73.4 121.7,84.3 114.0,77.8" fill="#1d6fd1"/>
  <line x1="124.3" y1="73.4" x2="124.3" y2="150" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="212" y="168" font-size="13" fill="#1f2a44">a</text>
  <text x="100" y="68" font-size="13" fill="#1d6fd1">b</text>
  <path d="M85,150 A25,25 0 0,0 76.1,130.8" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="90" y="140" font-size="12" fill="#1f2a44">θ</text>
  <text x="130" y="118" font-size="11" fill="#b4232c">height |b| sin θ</text>
  <text x="200" y="100" font-size="11" fill="#1f2a44">area = |a × b|</text>
  <text x="92" y="170" font-size="11" text-anchor="middle" fill="#1f2a44">|b| cos θ</text>
</svg>
```
:::

::: context four-d-sphere A sphere you cannot see, but can picture
Unit complex numbers $\cos\theta + i\sin\theta$ are the points of a circle: two numbers at distance $1$ from the center. Multiplying by one of them turns the plane. Unit quaternions are the same idea one step up: four numbers at distance $1$ from the center, a "sphere" with three directions to move in. Nobody can draw it, but it behaves like the circle: lengths multiply, so multiplying two points on it lands on it again.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="90" x2="200" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <line x1="110" y1="10" x2="110" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="110" cy="90" r="65" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="175" cy="90" r="4" fill="#1f2a44"/>
  <circle cx="110" cy="25" r="4" fill="#1f2a44"/>
  <circle cx="45" cy="90" r="4" fill="#1f2a44"/>
  <circle cx="110" cy="155" r="4" fill="#1f2a44"/>
  <text x="182" y="84" font-size="12" fill="#1f2a44">1</text>
  <text x="116" y="20" font-size="12" fill="#1f2a44">i</text>
  <text x="26" y="84" font-size="12" fill="#1f2a44">−1</text>
  <text x="116" y="170" font-size="12" fill="#1f2a44">−i</text>
  <text x="215" y="70" font-size="12" fill="#1d6fd1">unit complex numbers:</text>
  <text x="215" y="86" font-size="12" fill="#1d6fd1">a circle, S¹</text>
  <text x="215" y="118" font-size="12" fill="#1f2a44">unit quaternions:</text>
  <text x="215" y="134" font-size="12" fill="#1f2a44">the same, in 4-D: S³</text>
</svg>
```
:::

::: context pure-quaternion Why the zero goes in front
A pure quaternion has scalar part $0$ and only a vector part. It is how an ordinary arrow enters quaternion arithmetic. Hamilton himself named the two parts: he called the vector part the "vector" — which is where the everyday word in mathematics comes from — and the leftover number the "scalar", because ordinary numbers only scale things. In a scalar-first array the zero goes first: $(0, p_x, p_y, p_z)$.
:::

::: context half-factor Where the one-half comes from
The quaternion is built from *half* the rotation angle. If the body spins at $1^\circ$ per second, the angle $\Phi$ grows at $1^\circ$ per second, but $\Phi/2$ — the angle the quaternion actually carries — grows at only half a degree per second. That is the $\tfrac12$ in front of the kinematic equation. Lesson 12 and the attitude filters later in the course use this equation constantly.
:::

::: context tangent-step Stepping off the sphere
A forward Euler step moves along the straight tangent line instead of following the curve, so each step lands a little outside the sphere. The overshoot grows with the square of the step length. The quaternion's step is half the length of the matrix's (the half-angle), so its overshoot is about a quarter as big. The drawing exaggerates the steps enormously.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M40,137.5 A160,160 0 0,1 320,137.5" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="55" r="4" fill="#1f2a44"/>
  <line x1="180" y1="55" x2="290" y2="55" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="300.0,55.0 290.0,60.0 290.0,50.0" fill="#b4232c"/>
  <line x1="180" y1="51" x2="230" y2="51" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="240.0,51.0 230.0,56.0 230.0,46.0" fill="#1d6fd1"/>
  <line x1="276" y1="87" x2="300" y2="55" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="3,3"/>
  <line x1="236.2" y1="65.2" x2="240" y2="55" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="3,3"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">quaternion step: half as long</text>
  <text x="300" y="44" font-size="12" text-anchor="middle" fill="#b4232c">matrix step</text>
  <text x="180" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">true path stays on the sphere</text>
  <text x="310" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">overshoot</text>
</svg>
```
:::

::: context fixed-point Fixed-point numbers
Some small flight computers store numbers as whole numbers with an agreed scale — for example, "the stored integer divided by $2^{30}$" — instead of the floating-point numbers a laptop uses. This is called fixed-point. It is fast and predictable, but it can only hold values in a set range. A unit quaternion's numbers never go beyond $\pm 1$, so a designer may pick a range just past $1$. Let the length drift to $3.43$ and the numbers overflow — clipped at the limit or wrapped around to garbage, depending on the hardware.
:::
