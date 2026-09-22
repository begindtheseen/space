---
id: l06-quaternion-multiplication-conjugate-and-inverse
title: Quaternion multiplication, conjugate, inverse and the unit-norm constraint
minutes: 20
covers:
  - quaternion multiplication, conjugate, inverse, unit-norm constraint
---

A representation is useful when its operations mirror the operations you need. Attitude work needs four things constantly: compose two rotations, invert a rotation, rotate a vector, and keep the representation valid as it is integrated forward. The unit quaternion does all four cheaply, and this lesson builds each from the multiplication rule.

The conventions of lesson 05 hold throughout: unit, scalar-first, Hamilton, with $q_{A\leftarrow B}\otimes q_{B\leftarrow C} = q_{A\leftarrow C}$ and $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$. Write a quaternion as $q = [w, \mathbf{v}]$ with scalar $w$ and vector $\mathbf{v} = (x, y, z)$.

There is a structural payoff worth stating up front. The unit quaternions form a group under this multiplication, and that group is the unit sphere $S^3$ in four dimensions. Composing rotations becomes multiplication on a sphere — a smooth, bounded, singularity-free operation — and that is the whole reason flight software carries quaternions rather than angles.

## The product

Multiply out $(w_1 + x_1 i + y_1 j + z_1 k)(w_2 + x_2 i + y_2 j + z_2 k)$ using Hamilton's rules $i^2 = j^2 = k^2 = -1$, $ij = k$, $jk = i$, $ki = j$ (and $ji = -k$, and so on). Collecting the real part and the three imaginary parts gives the compact vector form

$$
q_1\otimes q_2 = \bigl[\,w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2,\ \ w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2\,\bigr].
$$

Three properties follow immediately from that line.

- **It is not commutative.** Swapping the arguments leaves $w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2$ and $w_1\mathbf{v}_2 + w_2\mathbf{v}_1$ alone but reverses the cross product, so

$$
q_1\otimes q_2 - q_2\otimes q_1 = [\,0,\ 2\,\mathbf{v}_1\times\mathbf{v}_2\,] .
$$

  The two orders differ only in the vector part and only by twice the cross product. They share the scalar exactly, so they share the principal angle — the trap from lesson 05. The product commutes exactly when $\mathbf{v}_1\times\mathbf{v}_2 = \mathbf{0}$, that is, when the two rotations share an axis, which matches the fact that co-axial rotations commute.
- **It is associative.** $(q_1\otimes q_2)\otimes q_3 = q_1\otimes(q_2\otimes q_3)$, so a chain of frames needs no bracketing.
- **It is linear in each argument**, so it can be written as a $4\times 4$ matrix acting on the other:

$$
q_1\otimes q_2 = [q_1]_L\,q_2 = [q_2]_R\,q_1,
\qquad
[q]_L = \begin{bmatrix} w & -\mathbf{v}^\top\\ \mathbf{v} & w\mathbf{I}_3 + [\mathbf{v}\times]\end{bmatrix},
\qquad
[q]_R = \begin{bmatrix} w & -\mathbf{v}^\top\\ \mathbf{v} & w\mathbf{I}_3 - [\mathbf{v}\times]\end{bmatrix}.
$$

  These are the forms to use in a Kalman filter, where a quaternion update has to be differentiated with respect to its arguments. For a unit $q$, $[q]_L$ and $[q]_R$ are $4\times 4$ orthogonal matrices with determinant $+1$ — a fact used again in lesson 12.

::: key The Hamilton quaternion product
$(w_1,\mathbf{v}_1)\otimes(w_2,\mathbf{v}_2) = (w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2,\ w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2)$. Non-commutative, exactly like rotation composition; associative; and $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$.
:::

## The norm is multiplicative, so unit quaternions are closed

Take norms of the product. Expanding $\lVert q_1\otimes q_2\rVert^2$ and using $\lVert\mathbf{a}\times\mathbf{b}\rVert^2 = \lVert\mathbf{a}\rVert^2\lVert\mathbf{b}\rVert^2 - (\mathbf{a}\cdot\mathbf{b})^2$ together with $\mathbf{v}_1\times\mathbf{v}_2$ being perpendicular to both $\mathbf{v}_1$ and $\mathbf{v}_2$, everything collapses to

$$
\lVert q_1\otimes q_2\rVert = \lVert q_1\rVert\,\lVert q_2\rVert .
$$

Checked over $300$ random pairs of non-unit quaternions, the identity holds to $1.8\times 10^{-15}$. The consequence is the one that matters: if both factors are unit quaternions, so is the product. The unit quaternions are closed under multiplication, contain the identity $[1,\mathbf{0}]$, and — as the next section shows — contain every inverse. They form a group, and as a set they are the unit sphere $S^3\subset\mathbb{R}^4$.

Compare this with the DCM. Composing two rotation matrices also stays in $SO(3)$ exactly, in principle; in floating point, the product of two slightly non-orthogonal matrices is worse than either. For quaternions the same is true but the constraint is a single scalar equation rather than six, so the repair is one square root and four divisions instead of a Newton iteration on a matrix.

## Conjugate and inverse

The **conjugate** negates the vector part:

$$
q^{*} = [\,w,\ -\mathbf{v}\,] .
$$

Since $q = [\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$, the conjugate is $[\cos(\Phi/2), (-\hat{\mathbf{e}})\sin(\Phi/2)]$ — the same angle about the reversed axis, which lesson 04 showed is the inverse rotation. Two identities follow.

$$
q\otimes q^{*} = \bigl[\,w^2 + \mathbf{v}\cdot\mathbf{v},\ \ -w\mathbf{v} + w\mathbf{v} + \mathbf{v}\times(-\mathbf{v})\,\bigr] = \bigl[\lVert q\rVert^2,\ \mathbf{0}\bigr],
$$

so the **inverse** is

$$
q^{-1} = \frac{q^{*}}{\lVert q\rVert^{2}},
\qquad\text{and for a unit quaternion}\qquad
q^{-1} = q^{*} .
$$

Inverting a rotation costs three sign flips. Nothing in attitude work is cheaper.

The conjugate of a product reverses the order, exactly like a matrix transpose:

$$
(q_1\otimes q_2)^{*} = q_2^{*}\otimes q_1^{*},
$$

which matches $(\mathbf{C}_1\mathbf{C}_2)^\top = \mathbf{C}_2^\top\mathbf{C}_1^\top$, as it must, since $\mathbf{C}(q^*) = \mathbf{C}(q)^\top$.

::: key Conjugate, inverse and the unit-norm constraint
$q^{*} = [w, -\mathbf{v}]$; $q\otimes q^{*} = [\lVert q\rVert^2, \mathbf{0}]$; in general $q^{-1} = q^{*}/\lVert q\rVert^2$, and for a unit quaternion $q^{-1} = q^{*}$. The constraint $w^2 + \mathbf{v}^\top\mathbf{v} = 1$ is a single scalar equation on four parameters, leaving three degrees of freedom, and $(q_1\otimes q_2)^{*} = q_2^{*}\otimes q_1^{*}$.
:::

## Rotating a vector

Embed the vector $\mathbf{v}$ as a **pure quaternion** $[0, \mathbf{v}]$, with zero scalar part. Then

$$
[\,0,\ \mathbf{v}'\,] = q\otimes[\,0,\ \mathbf{v}\,]\otimes q^{*} .
$$

Expanding the two products with $q = [w, \mathbf{u}]$: the scalar part of the result is $-w(\mathbf{u}\cdot\mathbf{v}) + w(\mathbf{v}\cdot\mathbf{u}) + (\mathbf{u}\times\mathbf{v})\cdot\mathbf{u} = 0$, so the result is again pure — the sandwich maps pure quaternions to pure quaternions, which is why it is the right form. The vector part works out to

$$
\mathbf{v}' = (w^2 - \mathbf{u}^\top\mathbf{u})\,\mathbf{v} + 2(\mathbf{u}\cdot\mathbf{v})\,\mathbf{u} + 2w\,(\mathbf{u}\times\mathbf{v})
= \bigl[(w^2-\mathbf{u}^\top\mathbf{u})\mathbf{I}_3 + 2\mathbf{u}\mathbf{u}^\top + 2w[\mathbf{u}\times]\bigr]\mathbf{v},
$$

which is exactly the matrix $\mathbf{C}(q)$ of lesson 05. So the sandwich product and the DCM are the same operation, and the derivation shows why the trace identity $\operatorname{tr}\mathbf{C} = 4w^2 - 1$ holds: $[\mathbf{u}\times]$ is traceless, so $\operatorname{tr}\mathbf{C} = 3(w^2 - \mathbf{u}^\top\mathbf{u}) + 2\mathbf{u}^\top\mathbf{u} = 3w^2 - \mathbf{u}^\top\mathbf{u} = 4w^2 - 1$ on the unit sphere.

For a unit quaternion, $w^2 - \mathbf{u}^\top\mathbf{u} = 1 - 2\mathbf{u}^\top\mathbf{u}$, and the expression rearranges into the form used when only one or two vectors need rotating:

$$
\mathbf{v}' = \mathbf{v} + 2w\,(\mathbf{u}\times\mathbf{v}) + 2\,\mathbf{u}\times(\mathbf{u}\times\mathbf{v}) .
$$

### What each operation costs

Counting directly off the formulas, with $m$ for multiplications and $a$ for additions:

| Operation | Quaternion | Rotation matrix |
| --- | --- | --- |
| Storage | 4 doubles | 9 doubles |
| Compose two rotations | $16m$, $12a$ | $27m$, $18a$ |
| Invert | 3 sign flips | 9 element moves (transpose) |
| Rotate one vector | $18m$, $12a$ | $9m$, $6a$ |
| Restore the constraint | 1 square root, 4 divisions | Newton step: $2\times 27m$ plus scaling |

The quaternion wins on storage, on composition and overwhelmingly on repair; the matrix wins on rotating vectors. That is why real flight software carries the quaternion as the state and converts to a matrix whenever more than a couple of vectors have to be transformed at the same attitude — a star catalogue, a set of thruster directions, a batch of measurement residuals.

::: example Composing an attitude with a sensor mount
A spacecraft's attitude is a $50^\circ$ rotation about the reference $y$ axis, $q_{N\leftarrow B} = [0.906308,\ 0,\ 0.422618,\ 0]$. A star tracker is mounted by yawing $40^\circ$ about body $z$ and then pitching $25^\circ$ about the new $y$, so

$$
q_{B\leftarrow S} = [0.917418,\ -0.074027,\ 0.203387,\ 0.333913],
\qquad \lVert q_{B\leftarrow S}\rVert = 1.000000 .
$$

Compose in the order the subscripts demand:

$$
q_{N\leftarrow S} = q_{N\leftarrow B}\otimes q_{B\leftarrow S} = [\,0.745508,\ 0.074027,\ 0.572049,\ 0.333913\,],
$$

norm $1.000000$. Its principal angle is $2\arcsin\lVert\mathbf{v}\rVert = 83.594^\circ$, which agrees with $\arccos\bigl((\operatorname{tr}\mathbf{C}-1)/2\bigr)$ on the corresponding matrix to twelve digits, and $\mathbf{C}(q_{N\leftarrow S})$ equals $\mathbf{C}(q_{N\leftarrow B})\mathbf{C}(q_{B\leftarrow S})$ to $1.1\times 10^{-16}$.

Now the wrong order. $q_{B\leftarrow S}\otimes q_{N\leftarrow B} = [0.745508,\ -0.208209,\ 0.572049,\ 0.271343]$ — same scalar part, so the same $83.594^\circ$ principal angle, and an attitude $33.243^\circ$ away from the truth. The difference between the two vector parts is $(0.282235,\ 0,\ 0.062570)$, which is exactly $2\,\mathbf{v}_1\times\mathbf{v}_2$ as the commutator formula predicts.

Finally, push the tracker boresight through. In sensor axes it is $\mathbf{b}^{S} = (0,0,1)$. The sandwich gives

$$
q_{N\leftarrow S}\otimes[0,\mathbf{b}^{S}]\otimes q_{N\leftarrow S}^{*} = [\,0,\ 0.902371,\ 0.271654,\ 0.334561\,],
$$

with a scalar part of exactly zero as required, and the vector part matches $\mathbf{C}(q_{N\leftarrow S})\mathbf{b}^{S}$ to $1.1\times 10^{-16}$. The compact form $\mathbf{v} + 2w(\mathbf{u}\times\mathbf{v}) + 2\mathbf{u}\times(\mathbf{u}\times\mathbf{v})$ agrees to $5.6\times 10^{-17}$.
:::

::: example Norm drift, and why it is four times smaller than the DCM's
The quaternion kinematic equation is $\dot{q} = \tfrac12\,q\otimes[0,\boldsymbol{\omega}^{B}]$. Note that $\dot q$ is orthogonal to $q$ in $\mathbb{R}^4$: their inner product is $-w(\mathbf{u}\cdot\boldsymbol{\omega}) + \mathbf{u}\cdot(w\boldsymbol{\omega} + \mathbf{u}\times\boldsymbol{\omega}) = 0$, because the first two terms cancel and $\mathbf{u}\cdot(\mathbf{u}\times\boldsymbol{\omega}) = 0$. The true solution therefore stays on the sphere exactly; a forward Euler step, being a straight line along the tangent, leaves it.

Each step multiplies the norm by $\sqrt{1 + (\lVert\boldsymbol{\omega}\rVert\Delta t/2)^2}$. Run the same case as lesson 01: $\lVert\boldsymbol{\omega}\rVert = 2^\circ/\mathrm{s}$, $\Delta t = 0.01\,\mathrm{s}$, $60{,}000$ steps. Here $\lVert\boldsymbol{\omega}\rVert\Delta t/2 = 1.74533\times 10^{-4}$, so the prediction is $(1 + 3.046\times 10^{-8})^{30000} = 1.00091427$.

| $t$ | $60\,\mathrm{s}$ | $300\,\mathrm{s}$ | $600\,\mathrm{s}$ |
| --- | --- | --- | --- |
| $\lVert q\rVert - 1$ | $9.139\times 10^{-5}$ | $4.570\times 10^{-4}$ | $9.143\times 10^{-4}$ |

The measured value at $600\,\mathrm{s}$ is $1.0009142699$, matching the prediction to ten digits. Lesson 01's DCM under identical conditions reached a column norm of $1.0036621$ — larger by a factor $4.005$. The half-angle is why: the quaternion's tangent step is half the size, and the error is quadratic, so it is a quarter as large. The same factor appears in the attitude itself, where the quaternion's angle deficit after $60{,}000$ steps is $1.22\times 10^{-5}$ degrees against the DCM's $4.87\times 10^{-5}$.

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

::: warning Renormalising does not fix the attitude, here either
One division restores $\lVert q\rVert = 1$ exactly, which is satisfying and incomplete. Scaling a quaternion by a positive number does not change the rotation it represents at all — $\mathbf{C}(\lambda q) = \mathbf{C}(q)$ for any $\lambda > 0$ once you divide by the norm — so normalising removes a quantity that was never affecting the answer. The attitude error from truncation survives untouched, exactly as with the DCM in lesson 01. Normalise to keep the state bounded and the formulas valid, and integrate better to get a better attitude.
:::

::: warning The sandwich needs a pure quaternion, and the conjugate on the right
Two slips are common. Writing $q\otimes[\,1,\mathbf{v}\,]\otimes q^{*}$ with a scalar part of $1$ instead of $0$ returns a quaternion whose vector part is the rotated vector plus $2w\mathbf{u}$ — plausible-looking and wrong. Writing $q^{*}\otimes[0,\mathbf{v}]\otimes q$ gives the inverse rotation, which is the transpose error of lesson 05 and costs $2\Phi$ of pointing. Both produce unit-norm output and neither is caught by a structural check.
:::

## Check yourself

::: check
Show that $q\otimes q^{*} = [\lVert q\rVert^2, \mathbf{0}]$ directly from the product formula, and deduce $q^{-1}$ for a non-unit quaternion.
:::

::: answer
Put $q_1 = [w,\mathbf{v}]$ and $q_2 = [w, -\mathbf{v}]$ into $[w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2,\ w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2]$. The scalar is $w^2 - \mathbf{v}\cdot(-\mathbf{v}) = w^2 + \mathbf{v}\cdot\mathbf{v} = \lVert q\rVert^2$. The vector is $w(-\mathbf{v}) + w\mathbf{v} + \mathbf{v}\times(-\mathbf{v}) = \mathbf{0} - \mathbf{0} = \mathbf{0}$, using $\mathbf{v}\times\mathbf{v} = \mathbf{0}$. So $q\otimes q^* = [\lVert q\rVert^2,\mathbf{0}] = \lVert q\rVert^2\,[1,\mathbf{0}]$, and dividing by $\lVert q\rVert^2$ gives $q\otimes\bigl(q^*/\lVert q\rVert^2\bigr) = [1,\mathbf{0}]$, the identity. Hence $q^{-1} = q^{*}/\lVert q\rVert^2$, which reduces to $q^*$ when $\lVert q\rVert = 1$.
:::

::: check
Two quaternions have the same scalar part but different vector parts. Can they be the two orders of one product? Can they be two genuinely different attitudes with the same principal angle?
:::

::: answer
Both. The commutator identity $q_1\otimes q_2 - q_2\otimes q_1 = [0, 2\mathbf{v}_1\times\mathbf{v}_2]$ says the two orders always share a scalar part and differ only in the vector part, so yes to the first. And since the scalar part is $\cos(\Phi/2)$, equal scalars mean equal principal angles, so any two unit quaternions with the same $w$ represent rotations through the same angle about different axes — yes to the second. The lesson is that matching principal angles is weak evidence of agreement. Two attitudes agree only when all four components agree, up to an overall sign.
:::

::: check
Why does the sandwich product need a conjugate on the right rather than repeating $q$, and what would $q\otimes[0,\mathbf{v}]\otimes q$ give?
:::

::: answer
The sandwich must map pure quaternions to pure quaternions, and it must be norm-preserving on vectors. With $q^{*}$ on the right, the scalar part cancels identically, as shown in the derivation. With $q$ on the right you get $q\otimes[0,\mathbf{v}]\otimes q = \bigl(q\otimes[0,\mathbf{v}]\otimes q^*\bigr)\otimes q^2$, which multiplies the rotated vector's quaternion by $q^2$, a rotation through $2\Phi$ — so the result is not pure, its scalar part is $-2(\mathbf{u}\cdot\mathbf{v})w$ in general, and the vector part is not a rotation of $\mathbf{v}$ by anything. It is not even length-preserving as a map on $\mathbf{v}$ once the scalar leakage is discarded.
:::

::: check
A propagator runs at $100\,\mathrm{Hz}$ with forward Euler on the quaternion while a spacecraft spins at $30^\circ/\mathrm{s}$. How far does the norm drift in one hour, and does that matter?
:::

::: answer
$\lVert\boldsymbol{\omega}\rVert\Delta t/2 = (0.5236\,\mathrm{rad/s})(0.01\,\mathrm{s})/2 = 2.618\times 10^{-3}$. Per step the norm grows by $\sqrt{1 + 6.854\times 10^{-6}}$, so over $n = 360{,}000$ steps it grows by $(1 + 6.854\times 10^{-6})^{180000} = e^{1.234} = 3.43$. The quaternion's norm more than triples in an hour. Does it matter? Not for the attitude it represents, since $\mathbf{C}(\lambda q) = \mathbf{C}(q)$ after normalisation — but it matters everywhere else: the components leave the range any fixed-point representation assumed, any code that reads $w$ as $\cos(\Phi/2)$ gets nonsense, and the truncation error that comes with a drift this size is enormous. Normalise every step; it costs one square root.
:::

::: check
You have a quaternion $q_{N\leftarrow B}$ and need the components, in body axes, of a vector known in reference axes. Write the sandwich, and say what goes wrong if you use $q_{N\leftarrow B}$ where $q_{B\leftarrow N}$ belongs.
:::

::: answer
You need $q_{B\leftarrow N} = q_{N\leftarrow B}^{*}$, so $[0, \mathbf{v}^{B}] = q_{N\leftarrow B}^{*}\otimes[0,\mathbf{v}^{N}]\otimes q_{N\leftarrow B}$. Using the un-conjugated quaternion applies the inverse rotation, producing the transpose error of lesson 05: the resulting vector is still a unit vector if the input was, still passes any norm check, and the attitude implied is wrong by twice the principal angle of $q_{N\leftarrow B}$. At a $7^\circ$ attitude the error is $14^\circ$; at the identity attitude it is zero, which is why the bug survives bench testing.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $q = [w,\mathbf{v}]$ | Scalar-first, Hamilton, unit |
| $q_1\otimes q_2 = [w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2,\ w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2]$ | The product |
| $q_1\otimes q_2 - q_2\otimes q_1 = [0, 2\mathbf{v}_1\times\mathbf{v}_2]$ | Commutator; equal scalar parts, equal principal angles |
| $[q]_L, [q]_R$ | $4\times 4$ left and right multiplication matrices |
| $\lVert q_1\otimes q_2\rVert = \lVert q_1\rVert\lVert q_2\rVert$ | Unit quaternions are closed: the group $S^3$ |
| $q^{*} = [w,-\mathbf{v}]$ | Conjugate; $(q_1\otimes q_2)^{*} = q_2^{*}\otimes q_1^{*}$ |
| $q\otimes q^{*} = [\lVert q\rVert^2,\mathbf{0}]$, $q^{-1} = q^{*}/\lVert q\rVert^2$ | Inverse; equals $q^{*}$ for unit $q$ |
| $[0,\mathbf{v}'] = q\otimes[0,\mathbf{v}]\otimes q^{*}$ | Rotating a vector; equals $\mathbf{C}(q)\mathbf{v}$ |
| $\mathbf{v}' = \mathbf{v} + 2w(\mathbf{u}\times\mathbf{v}) + 2\mathbf{u}\times(\mathbf{u}\times\mathbf{v})$ | Compact form for one or two vectors |
| $w^2 + \mathbf{v}^\top\mathbf{v} = 1$ | One scalar constraint; repair by one square root |
| Worked figures | Norm drift $9.14\times 10^{-4}$ after $60{,}000$ Euler steps, a quarter of the DCM's |

The algebra is complete and the group is the sphere $S^3$. The next lesson asks what it means that this sphere has twice as many points as there are attitudes — and what a controller does about it.
