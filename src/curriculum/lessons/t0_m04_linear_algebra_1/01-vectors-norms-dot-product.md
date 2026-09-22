---
id: l01-vectors-norms-dot-product
title: Vectors, norms and the dot product
minutes: 19
covers:
  - vectors, dot and cross products, norms, projections
---

A spacecraft's navigation state is, at its simplest, two vectors: where the vehicle is and how fast it is moving. Everything else in guidance, navigation and control is built from vectors like these — thrust directions, sensor boresights, angular rates, attitude errors — and from a small set of rules for combining them. This lesson sets down those rules and answers the first two questions you can ask of a vector: how long is it, and how much of it points along some other direction?

Both questions come up on every vehicle, every cycle. A range-safety monitor asks whether the length of a position error has crossed a limit. A sun sensor reports the cosine of the angle between its axis and the Sun, which is a dot product. A star-tracker keep-out constraint is an angle between two unit vectors. A reaction-wheel saturation check asks for the largest single component of a torque command, which is also a length, though measured with a different rule.

The lesson also plants a distinction you will lean on for the rest of the module. A vector is a physical arrow. Its components are numbers that depend on the reference frame you chose to write them in. The arrow does not change when you change frames; the numbers do.

## Vectors and their components

Geometrically, a vector is an arrow: it has a magnitude and a direction, and nothing else. Two arrows of the same length pointing the same way are the same vector, wherever you draw them. A displacement of 10 m northward is the same vector whether it starts at the launch pad or at the top of the tower.

To compute with arrows you need numbers, and numbers require a frame. Choose three mutually perpendicular unit vectors $\hat{\mathbf{x}}$, $\hat{\mathbf{y}}$, $\hat{\mathbf{z}}$ — a set of axes, meeting at an origin, arranged so that the usual right-hand rule takes $\hat{\mathbf{x}}$ to $\hat{\mathbf{y}}$ to $\hat{\mathbf{z}}$. Any vector can then be written as a sum of stretched axes:

$$
\mathbf{r} = x\,\hat{\mathbf{x}} + y\,\hat{\mathbf{y}} + z\,\hat{\mathbf{z}} = \begin{pmatrix} x \\ y \\ z \end{pmatrix}.
$$

The three numbers $x, y, z$ are the **components** of $\mathbf{r}$ in that frame. Throughout ORBIT vectors are written as columns, bold lowercase letters name vectors ($\mathbf{r}$, $\mathbf{v}$), plain italics name scalars ($x$, $t$, $m$), and a hat marks a vector of length one ($\hat{\mathbf{x}}$, $\hat{\mathbf{u}}$). When components are indexed rather than named, $\mathbf{a} = (a_1, a_2, a_3)^T$; the superscript $T$ turns a written-out row into the column it stands for, and you will meet it properly in the transpose lesson.

Two operations define everything else. **Addition** is componentwise, $\mathbf{a} + \mathbf{b} = (a_1 + b_1,\ a_2 + b_2,\ a_3 + b_3)^T$, and geometrically it is tip-to-tail: walk along $\mathbf{a}$, then along $\mathbf{b}$, and the sum is the arrow from where you started to where you ended. **Scalar multiplication** stretches: $c\,\mathbf{a} = (c a_1, c a_2, c a_3)^T$ has $|c|$ times the length of $\mathbf{a}$ and points the same way if $c$ is positive, the opposite way if $c$ is negative. The **zero vector** $\mathbf{0}$ has all components zero and no direction.

Put together, they give the **linear combination** $\alpha\,\mathbf{a} + \beta\,\mathbf{b}$, which is the single most important expression in this module. A position after a coast is $\mathbf{r} + t\,\mathbf{v}$: a linear combination of position and velocity. A thrust vector is a linear combination of body axes. A matrix, when you meet one two lessons from now, is nothing but a rule for forming linear combinations.

### Beyond three dimensions

Nothing in the algebra depends on there being three components. The navigation state of a vehicle,

$$
\mathbf{x} = \begin{pmatrix} x \\ y \\ z \\ v_x \\ v_y \\ v_z \end{pmatrix},
$$

is a vector in $\mathbb{R}^6$, the set of all six-component columns. You cannot draw it as an arrow, but you can add two of them, scale one, form linear combinations, and measure lengths, and every rule in this module applies unchanged. When a statement holds for any number of components we write $\mathbf{a} \in \mathbb{R}^n$ and index the components $a_1, \dots, a_n$.

### The same arrow, different numbers

Here is the point that makes linear algebra matter to a GNC engineer. Take the vehicle's velocity — one physical arrow. Written in an Earth-centred inertial frame its components might be $(-6.8, -1.2, -3.2)^T$ km/s. Written in the vehicle's body frame, with the nose along $\hat{\mathbf{x}}$, the same arrow might be $(7.61, 0.02, -0.05)^T$ km/s. Neither set of numbers is "the velocity"; each is the velocity's shadow on a particular set of axes. Two later lessons are about converting between such shadows. For now, the rule is: never add, dot or compare components unless they are written in the same frame.

## Norms: how long is a vector?

### The 2-norm

In two dimensions the length of $(x, y)^T$ is $\sqrt{x^2 + y^2}$ by Pythagoras. In three dimensions apply Pythagoras twice: the horizontal shadow of $\mathbf{r}$ has length $\sqrt{x^2 + y^2}$, and that shadow together with the vertical component $z$ forms a second right triangle, so the full length is $\sqrt{(x^2 + y^2) + z^2}$. In $n$ dimensions the pattern continues:

$$
\|\mathbf{x}\|_2 = \sqrt{\sum_{i} x_i^2} = \sqrt{x_1^2 + x_2^2 + \cdots + x_n^2}.
$$

This is the **2-norm**, also called the Euclidean norm. When there is no risk of confusion it is written $|\mathbf{x}|$, and the two notations mean the same thing. It is the norm of distance and of energy: the distance between two points is $\|\mathbf{r}_1 - \mathbf{r}_2\|_2$, and kinetic energy per unit mass is $\tfrac{1}{2}\|\mathbf{v}\|_2^2$. Squaring a 2-norm removes the root, so $\|\mathbf{x}\|_2^2 = \sum_i x_i^2$, which is why the 2-norm appears everywhere a sum of squares does — including least squares.

A **unit vector** is a vector of 2-norm one. Any nonzero vector can be turned into one by dividing by its length:

$$
\hat{\mathbf{a}} = \frac{\mathbf{a}}{\|\mathbf{a}\|_2}.
$$

The result carries only the direction of $\mathbf{a}$. For $\mathbf{a} = (3, -4, 12)^T$, the norm is $\sqrt{9 + 16 + 144} = \sqrt{169} = 13$, so $\hat{\mathbf{a}} = (0.231, -0.308, 0.923)^T$. Sensor boresights, line-of-sight directions and thrust directions are always stored as unit vectors, and the first thing to check when a computed direction misbehaves is whether its norm is still one.

### The infinity-norm and the 1-norm

The 2-norm is not the only reasonable notion of size. The **infinity-norm** is the largest component in magnitude,

$$
\|\mathbf{x}\|_\infty = \max_i |x_i|,
$$

and it is the right measure whenever a limit applies to each channel separately. Three reaction wheels each rated to 0.25 N·m are not violated when the 2-norm of the command exceeds 0.25; they are violated when any single wheel is asked for more than 0.25, which is exactly what the infinity-norm reports. The **1-norm**, $\|\mathbf{x}\|_1 = \sum_i |x_i|$, adds the magnitudes and measures total effort, such as the total propellant a set of thrusters would burn if each channel fired independently.

The three norms are related. Every component is at most the largest one, and the largest one is at most the root-sum-square, so

$$
\|\mathbf{x}\|_\infty \le \|\mathbf{x}\|_2 \le \sqrt{n}\,\|\mathbf{x}\|_\infty .
$$

The left inequality holds because the sum of squares contains the square of the largest component. The right one holds because each of the $n$ squared terms is at most $\|\mathbf{x}\|_\infty^2$.

### What every norm satisfies

Any function deserving the name norm obeys three rules. It is positive: $\|\mathbf{x}\| \ge 0$, with equality only for the zero vector. It scales: $\|c\,\mathbf{x}\| = |c|\,\|\mathbf{x}\|$. And it obeys the **triangle inequality**, $\|\mathbf{x} + \mathbf{y}\| \le \|\mathbf{x}\| + \|\mathbf{y}\|$, which says that a detour is never shorter than the direct path. For $\mathbf{p} = (1, 2, 2)^T$ and $\mathbf{q} = (2, -1, 0)^T$: $\|\mathbf{p}\|_2 = 3$, $\|\mathbf{q}\|_2 = 2.24$, and $\|\mathbf{p} + \mathbf{q}\|_2 = \|(3, 1, 2)^T\|_2 = \sqrt{14} = 3.74$, which is indeed at most $5.24$.

Typical magnitudes to keep in your head: a low-Earth-orbit position vector has a 2-norm of about $6.8 \times 10^6$ m, an orbital velocity about $7.7 \times 10^3$ m/s, and a good GNSS position fix has an error vector whose norm is a few metres.

::: key Norms
$\|\mathbf{x}\|_2 = \sqrt{\sum_i x_i^2}$ measures energy or distance; it is the default meaning of "length". $\|\mathbf{x}\|_\infty = \max_i |x_i|$ measures the worst single channel, and is the norm to use for actuator limits. A unit vector is $\hat{\mathbf{a}} = \mathbf{a} / \|\mathbf{a}\|_2$.
:::

::: example Which norm catches a saturating wheel?
A reaction-wheel array receives the torque command $\boldsymbol{\tau} = (0.05, 0.28, 0.04)^T$ N·m. The array as a whole is budgeted for a 2-norm of 0.30 N·m, and each wheel is rated to 0.25 N·m.

The 2-norm is $\sqrt{0.05^2 + 0.28^2 + 0.04^2} = \sqrt{0.0025 + 0.0784 + 0.0016} = \sqrt{0.0825} = 0.287$ N·m, under the 0.30 N·m budget. The infinity-norm is $\max(0.05, 0.28, 0.04) = 0.28$ N·m, over the per-wheel rating. The second wheel saturates even though the array-level check passes. A limit that applies per channel must be checked with the infinity-norm.
:::

## The dot product

### Two definitions

The **dot product** of two vectors with the same number of components is the sum of the products of matching components:

$$
\mathbf{a} \cdot \mathbf{b} = \sum_i a_i b_i = a_1 b_1 + a_2 b_2 + \cdots + a_n b_n .
$$

The result is a scalar, not a vector. From the definition, three algebraic facts follow immediately. It is symmetric: $\mathbf{a} \cdot \mathbf{b} = \mathbf{b} \cdot \mathbf{a}$. It is linear in each argument: $(\alpha\mathbf{a} + \beta\mathbf{b}) \cdot \mathbf{c} = \alpha\,(\mathbf{a}\cdot\mathbf{c}) + \beta\,(\mathbf{b}\cdot\mathbf{c})$, because each component of the left side is $(\alpha a_i + \beta b_i) c_i$ and the sum splits. And dotting a vector with itself gives its squared 2-norm: $\mathbf{a} \cdot \mathbf{a} = \sum_i a_i^2 = \|\mathbf{a}\|_2^2$.

The second definition is geometric. If $\theta$ is the angle between the two arrows when they are placed tail to tail, then

$$
\mathbf{a} \cdot \mathbf{b} = \|\mathbf{a}\|\,\|\mathbf{b}\| \cos\theta .
$$

That these two expressions agree is the fact that makes the dot product useful, so it deserves a derivation rather than an assertion.

### Why the two definitions agree

Place $\mathbf{a}$ and $\mathbf{b}$ tail to tail. The arrow from the tip of $\mathbf{b}$ to the tip of $\mathbf{a}$ is $\mathbf{a} - \mathbf{b}$, and the three arrows form a triangle with sides $\|\mathbf{a}\|$, $\|\mathbf{b}\|$ and $\|\mathbf{a} - \mathbf{b}\|$, with the angle $\theta$ opposite the third side. The law of cosines from trigonometry says

$$
\|\mathbf{a} - \mathbf{b}\|^2 = \|\mathbf{a}\|^2 + \|\mathbf{b}\|^2 - 2\,\|\mathbf{a}\|\,\|\mathbf{b}\| \cos\theta .
$$

Now expand the left side with the algebraic definition, using linearity and symmetry:

$$
\|\mathbf{a} - \mathbf{b}\|^2 = (\mathbf{a} - \mathbf{b}) \cdot (\mathbf{a} - \mathbf{b})
= \mathbf{a}\cdot\mathbf{a} - 2\,\mathbf{a}\cdot\mathbf{b} + \mathbf{b}\cdot\mathbf{b}
= \|\mathbf{a}\|^2 - 2\,\mathbf{a}\cdot\mathbf{b} + \|\mathbf{b}\|^2 .
$$

The two right-hand sides describe the same number. Cancel $\|\mathbf{a}\|^2 + \|\mathbf{b}\|^2$ from both and divide by $-2$:

$$
\mathbf{a} \cdot \mathbf{b} = \|\mathbf{a}\|\,\|\mathbf{b}\| \cos\theta .
$$

So the component formula, which is what a computer evaluates, always equals the geometric formula, which is what you picture.

### What the dot product tells you

Because $\|\mathbf{a}\|$ and $\|\mathbf{b}\|$ are never negative, the sign of $\mathbf{a}\cdot\mathbf{b}$ is the sign of $\cos\theta$. A positive dot product means the arrows lean the same way ($\theta$ less than $90°$), a negative one means they lean apart, and zero means they are **orthogonal** — perpendicular. The zero vector has zero dot product with everything and counts as orthogonal to everything.

Solving for the angle gives

$$
\cos\theta = \frac{\mathbf{a}\cdot\mathbf{b}}{\|\mathbf{a}\|\,\|\mathbf{b}\|}, \qquad 0 \le \theta \le \pi .
$$

In code, round-off can push the quotient to $1.0000000002$, and the inverse cosine of that is not a number. Either clamp the quotient to $[-1, 1]$ before taking the inverse cosine or, better, compute the angle with the two-argument arctangent once you have the cross product from the next lesson.

The dot product with a unit vector has a special reading. Since $\|\hat{\mathbf{u}}\| = 1$,

$$
\mathbf{a} \cdot \hat{\mathbf{u}} = \|\mathbf{a}\| \cos\theta ,
$$

which is the **component of $\mathbf{a}$ along $\hat{\mathbf{u}}$**: the length of the shadow $\mathbf{a}$ casts on the line through $\hat{\mathbf{u}}$, with a sign. This is what a single-axis instrument measures. An accelerometer whose sensitive axis is $\hat{\mathbf{u}}$ reads $\mathbf{f} \cdot \hat{\mathbf{u}}$, where $\mathbf{f}$ is the specific force acting on it. A cosine-law sun sensor reads a current proportional to $\hat{\mathbf{s}} \cdot \hat{\mathbf{n}}$, the cosine of the angle between the Sun direction and the cell's normal. Three such instruments along three perpendicular axes recover the whole vector, one component each.

::: key The dot product two ways
$\mathbf{a}\cdot\mathbf{b} = \sum_i a_i b_i = |\mathbf{a}|\,|\mathbf{b}|\cos\theta$. A zero dot product means the vectors are orthogonal. Dotting with a unit vector gives the component along it.
:::

### Flight-path angle: a dot product you will use constantly

The **flight-path angle** $\gamma$ is the angle between the velocity vector and the local horizontal plane, positive when the vehicle is climbing. The local horizontal is the plane perpendicular to the position vector $\mathbf{r}$, so the angle between $\mathbf{r}$ and $\mathbf{v}$ is $90° - \gamma$, and $\cos(90° - \gamma) = \sin\gamma$. Therefore

$$
\sin\gamma = \frac{\mathbf{r}\cdot\mathbf{v}}{\|\mathbf{r}\|\,\|\mathbf{v}\|} .
$$

A positive $\mathbf{r}\cdot\mathbf{v}$ means the radius is growing: the vehicle is moving away from the centre of the Earth. On a circular orbit $\mathbf{r}\cdot\mathbf{v} = 0$ at every instant.

::: example A low-Earth-orbit state vector
In an Earth-centred inertial frame a spacecraft has position and velocity

$$
\mathbf{r} = \begin{pmatrix} -2690 \\ 5320 \\ 3470 \end{pmatrix}\,\mathrm{km}, \qquad
\mathbf{v} = \begin{pmatrix} -6.8 \\ -1.2 \\ -3.2 \end{pmatrix}\,\mathrm{km/s}.
$$

The radius is $\|\mathbf{r}\|_2 = \sqrt{2690^2 + 5320^2 + 3470^2} = \sqrt{47\,579\,400} = 6897.8$ km, which is $519.6$ km above the $6378.1$ km equatorial radius. The speed is $\|\mathbf{v}\|_2 = \sqrt{46.24 + 1.44 + 10.24} = \sqrt{57.92} = 7.611$ km/s — the familiar LEO speed. The dot product is

$$
\mathbf{r}\cdot\mathbf{v} = (-2690)(-6.8) + (5320)(-1.2) + (3470)(-3.2) = 18\,292 - 6384 - 11\,104 = 804\ \mathrm{km^2/s} .
$$

It is positive and small compared with $\|\mathbf{r}\|\,\|\mathbf{v}\| = 52\,497$ km²/s, so the orbit is nearly circular and the vehicle is climbing gently:

$$
\sin\gamma = \frac{804}{52\,497} = 0.01532, \qquad \gamma = 0.878° .
$$

For comparison, a circular orbit at this radius would need $\sqrt{\mu / r} = \sqrt{3.986 \times 10^5 / 6897.8} = 7.602$ km/s. The vehicle is a little faster than that, so it is on a slightly elliptical orbit heading up toward apoapsis. The unit position vector, which you will need next lesson, is $\hat{\mathbf{r}} = \mathbf{r} / 6897.8 = (-0.3900, 0.7713, 0.5031)^T$.
:::

::: example A star-tracker keep-out check
A star tracker has boresight $\hat{\mathbf{b}} = (0, 0.6, 0.8)^T$ in the body frame and must keep the Sun at least $30°$ off its axis. The current Sun direction in the body frame is $\hat{\mathbf{s}} = (0.5, 0.5, 0.7071)^T$. Both are unit vectors: $0.36 + 0.64 = 1$ and $0.25 + 0.25 + 0.5 = 1$.

$$
\hat{\mathbf{b}}\cdot\hat{\mathbf{s}} = 0 \times 0.5 + 0.6 \times 0.5 + 0.8 \times 0.7071 = 0.3 + 0.5657 = 0.8657 ,
$$

so $\theta = \arccos(0.8657) = 30.04°$. The Sun is $0.04°$ outside the exclusion cone — legal, but only barely, and a guidance engineer would want margin. Notice that the dot product needed no square roots and no trigonometry beyond one inverse cosine at the end.
:::

::: warning Components from different frames
$\mathbf{a}\cdot\mathbf{b} = \sum_i a_i b_i$ is only the geometric dot product when both sets of components are written in the same frame. Dotting a body-frame boresight with an inertial-frame Sun vector produces a number with no meaning, and the code will not complain. Rotate one into the other's frame first.
:::

::: warning Norms of differences
$\|\mathbf{a} - \mathbf{b}\|$ is the distance between two points; $\|\mathbf{a}\| - \|\mathbf{b}\|$ is the difference of two distances from the origin. They are different numbers, and the first is never smaller than the magnitude of the second (this is the triangle inequality in disguise). A position-error requirement means the first.
:::

## Check yourself

::: check
Find the unit vector in the direction of $\mathbf{a} = (2, -3, 6)^T$, and state its infinity-norm.
:::

::: answer
$\|\mathbf{a}\|_2 = \sqrt{4 + 9 + 36} = \sqrt{49} = 7$, so $\hat{\mathbf{a}} = (2/7, -3/7, 6/7)^T = (0.286, -0.429, 0.857)^T$. Its infinity-norm is the largest magnitude component, $6/7 = 0.857$, which is less than its 2-norm of $1$, as the inequality $\|\mathbf{x}\|_\infty \le \|\mathbf{x}\|_2$ requires.
:::

::: check
For what value of $k$ are $\mathbf{u} = (2, k, -1)^T$ and $\mathbf{w} = (4, 3, 2)^T$ orthogonal?
:::

::: answer
Orthogonal means zero dot product: $\mathbf{u}\cdot\mathbf{w} = 8 + 3k - 2 = 3k + 6 = 0$, so $k = -2$. Check: $(2, -2, -1)\cdot(4, 3, 2) = 8 - 6 - 2 = 0$.
:::

::: check
A spacecraft has $\mathbf{r}\cdot\mathbf{v} = -1.24 \times 10^{3}$ km²/s with $\|\mathbf{r}\| = 7100$ km and $\|\mathbf{v}\| = 7.45$ km/s. Is it climbing or descending, and by what flight-path angle?
:::

::: answer
$\sin\gamma = -1240 / (7100 \times 7.45) = -1240 / 52\,895 = -0.02344$, so $\gamma = -1.34°$. The negative sign means the radius is shrinking: the vehicle is descending toward periapsis.
:::

::: check
Without computing any norms, explain why $\|\mathbf{a} + \mathbf{b}\|_2^2 = \|\mathbf{a}\|_2^2 + \|\mathbf{b}\|_2^2$ exactly when $\mathbf{a}$ and $\mathbf{b}$ are orthogonal.
:::

::: answer
Expand with linearity: $\|\mathbf{a} + \mathbf{b}\|^2 = (\mathbf{a} + \mathbf{b})\cdot(\mathbf{a} + \mathbf{b}) = \|\mathbf{a}\|^2 + 2\,\mathbf{a}\cdot\mathbf{b} + \|\mathbf{b}\|^2$. The cross term $2\,\mathbf{a}\cdot\mathbf{b}$ vanishes exactly when the dot product is zero, which is the definition of orthogonal. This is Pythagoras written in dot-product language.
:::

::: check
An accelerometer with sensitive axis $\hat{\mathbf{u}} = (0.6, 0, 0.8)^T$ sits in a specific-force field $\mathbf{f} = (0.5, -0.2, 9.7)^T$ m/s². What does it read, and what angle does $\mathbf{f}$ make with the axis?
:::

::: answer
The reading is the component along the axis: $\mathbf{f}\cdot\hat{\mathbf{u}} = 0.3 + 0 + 7.76 = 8.06$ m/s². The magnitude of $\mathbf{f}$ is $\sqrt{0.25 + 0.04 + 94.09} = \sqrt{94.38} = 9.715$ m/s², so $\cos\theta = 8.06 / 9.715 = 0.8296$ and $\theta = 33.9°$. The instrument sees $\cos 33.9°$ of the field, about 83 percent of it.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{r} = (x, y, z)^T$ | A vector as a column of components in a chosen frame |
| $\alpha\mathbf{a} + \beta\mathbf{b}$ | Linear combination: the basic operation of the module |
| $\lVert\mathbf{x}\rVert_2 = \sqrt{\sum_i x_i^2}$ | 2-norm: distance, energy, root-sum-square |
| $\lVert\mathbf{x}\rVert_\infty = \max_i \lvert x_i \rvert$ | Infinity-norm: worst single channel, actuator limits |
| $\hat{\mathbf{a}} = \mathbf{a}/\lVert\mathbf{a}\rVert_2$ | Unit vector: direction only |
| $\mathbf{a}\cdot\mathbf{b} = \sum_i a_i b_i = \lVert\mathbf{a}\rVert\,\lVert\mathbf{b}\rVert\cos\theta$ | Dot product; zero means orthogonal |
| $\mathbf{a}\cdot\hat{\mathbf{u}}$ | Component of $\mathbf{a}$ along $\hat{\mathbf{u}}$: what a single-axis sensor reads |
| $\sin\gamma = \mathbf{r}\cdot\mathbf{v} / (\lVert\mathbf{r}\rVert\,\lVert\mathbf{v}\rVert)$ | Flight-path angle from a state vector |

The next lesson uses the dot product to split a vector into the part along a direction and the part across it — the projection — and introduces the cross product, which produces the direction perpendicular to two given vectors and underlies angular momentum, torque and rotation.
