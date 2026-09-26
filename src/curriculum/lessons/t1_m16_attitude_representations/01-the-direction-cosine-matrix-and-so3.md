---
id: l01-the-direction-cosine-matrix-and-so3
title: The direction cosine matrix and SO(3)
minutes: 21
covers:
  - the direction cosine matrix and SO(3)
---

Hold your phone out in front of you and tilt it. Where is it pointing? You could say "about $30^\circ$ up and a little to the left" — but up from what, and left of what? Orientation only means something when you compare two sets of directions: the room's (north, east, down) and the phone's own (its long edge, its short edge, the line out of its screen). Every description of orientation is a way of writing down how those two sets of directions line up.

On a spacecraft that orientation is called **attitude** — which way the vehicle is pointing and how it is turned about that line. Attitude is the one part of a vehicle's state with no natural coordinates. Position is three numbers and velocity is three more, and nobody argues about which three. Orientation is different. It lives on a curved set with no edges, and every way of writing it down is a compromise. This module works through the four ways flight software actually writes it down — direction cosine matrices, Euler angles, quaternions and Rodrigues parameters — and how to convert among them.

All four describe one object, and that object is the **direction cosine matrix**, or DCM: nine numbers arranged so that multiplying by them converts a vector's components from one set of axes to another. A **[[star tracker|star-tracker]]** — a camera that recognizes star patterns — reports a quaternion. The flight computer turns it into a DCM to rotate a Sun direction into body axes. The display for the ground crew reads Euler angles off the same matrix. The DCM sits in the middle, and it is the one where the rules are visible: you can look at nine numbers and check them.

Module 15 introduced rotation matrices as coordinate transformations about single axes. This lesson asks the structural question the rest of the module depends on: which nine-number grids are valid DCMs? The answer is a set called $SO(3)$. The nine numbers obey six rules, which leaves three free — and the shape of that three-dimensional set is exactly why Euler angles break down at one attitude and quaternions need a fourth number.

## Conventions used throughout this module

Attitude software fails more often from mixed conventions than from bad mathematics. Every lesson in this module holds to the following, and each lesson restates the part it uses.

- Frames are named with capital letters. A **frame** is a set of three perpendicular axes. $N$ is the reference frame, usually one that does not spin with the vehicle (an **inertial** frame). $B$ is the body frame, bolted to the vehicle.
- $\mathbf{C}_{A \leftarrow B}$, read "C, A from B", is the **coordinate transformation** that takes a vector's $B$ components to its $A$ components. (The **components** of a vector are its three numbers measured along a frame's axes.) In symbols, $\mathbf{v}^{A} = \mathbf{C}_{A \leftarrow B}\,\mathbf{v}^{B}$. The superscript names the frame the numbers are written in. The arrow points from the frame you have to the frame you want. This is module 15's $\mathbf{R}_{A \leftarrow B}$. The letter changes to $\mathbf{C}$ because $\mathbf{R}$ is needed later for the rotation operator of the Rodrigues formula.
- The **attitude matrix** of a vehicle is $\mathbf{C}_{N \leftarrow B}$, whose columns are the body axes written in reference components. Module 14 called this same matrix $\mathbf{R}$ in $\mathbf{r}_N = \mathbf{R}\,\mathbf{r}_B$. Most flight code stores its transpose, $\mathbf{C}_{B \leftarrow N}$, because measurements arrive in reference axes and are needed in body axes.
- Quaternions are unit, scalar-first and Hamilton. Lessons 05 and 06 define exactly what that means and why it matters.

## Direction cosines

Start with the picture. Two sets of arrows share a corner: the room's three axes and the phone's three axes. Pick one arrow from each set. They make some angle with each other. The **cosine** of that angle measures how much the two arrows agree: $1$ if they point the same way, $0$ if they are perpendicular, $-1$ if they point opposite ways. Three arrows times three arrows makes nine pairs, so there are nine such cosines. Written as a $3\times 3$ grid, they are the DCM.

Now the precise version. Let $A$ and $B$ be two frames sharing an origin, each **right-handed** and **orthonormal** — three perpendicular unit arrows that follow the [[right-hand rule|right-handed]]. Call $A$'s axes $\hat{\mathbf{a}}_1,\hat{\mathbf{a}}_2,\hat{\mathbf{a}}_3$ (read "a-hat one", and so on; the hat marks a unit arrow) and $B$'s axes $\hat{\mathbf{b}}_1,\hat{\mathbf{b}}_2,\hat{\mathbf{b}}_3$. A physical vector $\mathbf{r}$ has components $r^A_i = \mathbf{r}\cdot\hat{\mathbf{a}}_i$ in $A$ and $r^B_j = \mathbf{r}\cdot\hat{\mathbf{b}}_j$ in $B$ — each component is the dot product with that axis. Write $\mathbf{r}$ as its $B$ pieces, $\mathbf{r} = \sum_j r^B_j \hat{\mathbf{b}}_j$, and dot both sides with $\hat{\mathbf{a}}_i$:

$$
r^A_i = \sum_{j=1}^{3}\bigl(\hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j\bigr)\,r^B_j,
\qquad
\bigl[\mathbf{C}_{A \leftarrow B}\bigr]_{ij} = \hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j = \cos\alpha_{ij}.
$$

Here $\alpha_{ij}$ ("alpha i j") is the angle between $\hat{\mathbf{a}}_i$ and $\hat{\mathbf{b}}_j$. The dot product of two unit arrows is the [[cosine of the angle between them|cosine-picture]]. So every entry is a cosine of an angle between two axes — that is where the name comes from — and every entry lies between $-1$ and $1$.

Two readings of the matrix are worth memorizing, because they let you write a DCM down from a drawing without any algebra.

- **Column $j$ is $\hat{\mathbf{b}}_j$ written in $A$ components.** Multiply $\mathbf{C}_{A\leftarrow B}$ by $(1,0,0)$ — which is $\hat{\mathbf{b}}_1$ in its own frame — and out comes the first column.
- **Row $i$ is $\hat{\mathbf{a}}_i$ written in $B$ components.** The rows of $\mathbf{C}_{A\leftarrow B}$ are the columns of $\mathbf{C}_{B\leftarrow A}$.

Chaining frames reads like dominoes: $\mathbf{C}_{A\leftarrow C} = \mathbf{C}_{A\leftarrow B}\,\mathbf{C}_{B\leftarrow C}$. The inner labels match ($B$ next to $B$), and the matrix nearest the vector acts first.

::: example A star tracker mount, written down and checked
A star tracker sits on a spacecraft with its **boresight** — the line straight out of its lens — tilted $25^\circ$ away from the body $+z$ axis, leaning toward a direction $40^\circ$ around from body $+x$. Build the sensor frame $S$ by turning the body frame $40^\circ$ about body $z$, then $25^\circ$ about the new $y$ axis. That makes the sensor $z$ axis the boresight. The columns of $\mathbf{C}_{B\leftarrow S}$ are the sensor axes in body components:

$$
\mathbf{C}_{B\leftarrow S} =
\begin{bmatrix}
0.694272 & -0.642788 & 0.323744\\
0.582563 & 0.766044 & 0.271654\\
-0.422618 & 0 & 0.906308
\end{bmatrix}.
$$

**Check it before trusting it.** The third column is the boresight in body axes, $(0.3237,\ 0.2717,\ 0.9063)$. Its $z$ component is $\cos 25^\circ = 0.9063$, so the tilt is right. Its length is $1.000000$. The first two columns also have length $1$, and their dot product is $-2.7\times 10^{-17}$ — zero, up to round-off — so they are perpendicular. Their cross product gives back the third column to within $10^{-16}$, so the set is right-handed. Finally $\det\mathbf{C}_{B\leftarrow S} = 1.0000000$ and the largest entry of $\mathbf{C}^\top\mathbf{C} - \mathbf{I}_3$ is $1.1\times 10^{-16}$. (The next section explains why these are the tests.)

**Now use it.** The tracker sees a star at $\mathbf{m}^{S} = (0.100,\ -0.200,\ 0.9747)$, a unit vector (to four digits) $12.92^\circ$ off the boresight, since $\arccos(0.9747) = 12.92^\circ$. In body axes,

$$
\mathbf{m}^{B} = \mathbf{C}_{B\leftarrow S}\,\mathbf{m}^{S} = (0.5135,\ 0.1698,\ 0.8411).
$$

**Sanity check.** Its length is still $1.0000$, and its angle from the boresight written in body axes, $(0.3237, 0.2717, 0.9063)$, is still $12.92^\circ$. A correct rotation cannot change a length or an angle between two vectors. That is the check to run whenever you suspect a chain of frames: angles between vectors survive any correct DCM.
:::

## The six rules and the determinant

Think of the DCM as nine dials. Can you set them to anything you like? No. The columns are the three body axes, and those must stay unit length and at right angles to each other. Those demands use up most of the freedom.

In matrix form, "the columns are perpendicular unit arrows" is

$$
\mathbf{C}^{\top}\mathbf{C} = \mathbf{I}_3 .
$$

Here $\mathbf{C}^\top$ ("C transpose") is $\mathbf{C}$ flipped across its diagonal, so its rows are the columns of $\mathbf{C}$. $\mathbf{I}_3$ is the $3\times 3$ **identity matrix**: ones on the diagonal, zeros elsewhere. Entry $(i, j)$ of $\mathbf{C}^\top\mathbf{C}$ is column $i$ dotted with column $j$, so the equation says: each column dotted with itself is $1$, and each column dotted with a different one is $0$.

That is nine equations, but the grid $\mathbf{C}^\top\mathbf{C}$ is symmetric — entry $(1,2)$ is the same dot product as entry $(2,1)$ — so only six are independent: three saying each column has length $1$, three saying each pair is perpendicular. Nine entries minus six rules leaves **three degrees of freedom**, three numbers you can choose freely. Every representation in this module is an attempt to carry those three numbers conveniently, and the three-number ones all pay for it with a bad spot somewhere.

Perpendicular unit columns are not quite enough. A matrix with $\mathbf{C}^\top\mathbf{C}=\mathbf{I}_3$ has **[[determinant|determinant-volume]]** $\det\mathbf{C} = +1$ or $-1$. The minus sign is a mirror. It turns a right-handed set of axes into a left-handed one, the way your right hand looks like a left hand in a mirror. No physical turning can do that. So a DCM satisfies both

$$
\mathbf{C}^{\top}\mathbf{C} = \mathbf{I}_3
\qquad\text{and}\qquad
\det\mathbf{C} = +1 .
$$

The reverse transformation comes for free. The first rule says $\mathbf{C}^\top$ undoes $\mathbf{C}$, so $\mathbf{C}^{-1} = \mathbf{C}^{\top}$, and

$$
\mathbf{C}_{B\leftarrow A} = \mathbf{C}_{A\leftarrow B}^{\top}.
$$

Going back the other way never needs a matrix inversion, only a flip. That matters when it happens a thousand times a second.

::: note Why it has to be true
**Why $\det\mathbf{C} = \pm 1$.** Determinants multiply, $\det(\mathbf{X}\mathbf{Y}) = \det\mathbf{X}\det\mathbf{Y}$, and flipping does not change them, $\det\mathbf{C}^\top = \det\mathbf{C}$. Take the determinant of both sides of $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$: $(\det\mathbf{C})^2 = 1$. So $\det\mathbf{C}$ is $+1$ or $-1$.

**Why a rotation cannot have $-1$.** Any rotation can be reached from "no rotation" by turning smoothly a little at a time. Along the way the determinant changes smoothly too, since it is built from sums and products of the entries. It starts at $\det\mathbf{I}_3 = +1$, and it may only ever be $+1$ or $-1$. A smooth quantity cannot jump between two values without passing the ones in between, so it stays $+1$ the whole way.

**Why the inverse is the transpose.** Multiply both sides of $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$ on the right by $\mathbf{C}^{-1}$. The left becomes $\mathbf{C}^\top(\mathbf{C}\mathbf{C}^{-1}) = \mathbf{C}^\top$, the right becomes $\mathbf{C}^{-1}$.
:::

::: key What a DCM is
$\mathbf{C}_{A\leftarrow B}$ has entries $\hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j$, takes components from $B$ to $A$ as $\mathbf{v}^A = \mathbf{C}_{A\leftarrow B}\mathbf{v}^B$, has column $j$ equal to $\hat{\mathbf{b}}_j$ in $A$ components, satisfies $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$ and $\det\mathbf{C} = +1$, and inverts by transposition. Nine entries, six constraints, three degrees of freedom.
:::

::: warning A determinant of $-1$ is a reflection, not a rotation
Every element of $SO(3)$ has determinant exactly $+1$. A telemetry matrix with $\det = -1$ is not a slightly bad rotation. It is a rotation combined with a mirror. The usual causes are one axis defined with the wrong sign, or a left-handed set of axes typed in as if it were right-handed. "North, east, up" is the classic: north $\times$ east points *down*, so north-east-up is left-handed.

Notice what the determinant will *not* catch. Relabelling north-east-down as east-north-up is the matrix with rows $(0,1,0)$, $(1,0,0)$, $(0,0,-1)$. Its determinant is $+1$ and its trace (the sum of the diagonal) is $-1$: a perfectly proper $180^\circ$ rotation. Both frames are right-handed, so this mix-up passes every structural test and corrupts the data silently.
:::

## SO(3): the group of rotations

Collect every $3\times 3$ grid of real numbers that obeys both rules, and give the collection a name:

$$
SO(3) = \bigl\{\mathbf{C}\in\mathbb{R}^{3\times 3} : \mathbf{C}^{\top}\mathbf{C} = \mathbf{I}_3,\ \det\mathbf{C} = +1\bigr\}.
$$

Read it as "the set of all real $3\times 3$ matrices $\mathbf{C}$ such that…". Say "S O three". The letters stand for *special* (determinant $+1$) *orthogonal* (perpendicular unit columns) group in three dimensions.

A **[[group|group-word]]** is a collection with a way of combining two members that obeys four rules. Here the combining is matrix multiplication, and each rule says something physical.

- **Closure.** If $\mathbf{C}_1$ and $\mathbf{C}_2$ are in $SO(3)$, so is $\mathbf{C}_1\mathbf{C}_2$. A turn followed by a turn is a turn. This is what makes chains of frames legal.
- **Associativity.** $(\mathbf{C}_1\mathbf{C}_2)\mathbf{C}_3 = \mathbf{C}_1(\mathbf{C}_2\mathbf{C}_3)$. A chain of four frames can be grouped any way without changing the answer. Matrix multiplication already works this way.
- **Identity.** $\mathbf{I}_3$ is in the set. It is "no turn at all".
- **Inverse.** $\mathbf{C}^{\top}$ is in the set. Every turn can be undone.

::: note Why closure and inverse hold
For closure, flip the product and multiply: $(\mathbf{C}_1\mathbf{C}_2)^\top\mathbf{C}_1\mathbf{C}_2 = \mathbf{C}_2^\top(\mathbf{C}_1^\top\mathbf{C}_1)\mathbf{C}_2 = \mathbf{C}_2^\top\mathbf{C}_2 = \mathbf{I}_3$. (Flipping a product reverses its order.) And $\det(\mathbf{C}_1\mathbf{C}_2) = \det\mathbf{C}_1\det\mathbf{C}_2 = (+1)(+1) = +1$. For the inverse, $(\mathbf{C}^\top)^\top\mathbf{C}^\top = \mathbf{C}\mathbf{C}^\top$, which is $\mathbf{I}_3$ because $\mathbf{C}^\top$ is the inverse of $\mathbf{C}$ and an inverse works from either side; flipping does not change the determinant.
:::

What $SO(3)$ is **not** is **commutative** — the order of combining matters. $\mathbf{C}_1\mathbf{C}_2 \neq \mathbf{C}_2\mathbf{C}_1$ in general. This is not a technicality. It is why the order of an Euler sequence is part of its definition, why quaternion multiplication depends on order, and why "turn $90^\circ$ about $x$, then $90^\circ$ about $z$" leaves you somewhere different from the same two turns reversed. [[Try it with a book|book-test]].

Beyond being a group, $SO(3)$ has a shape. It is a smooth three-dimensional surface sitting inside the nine-dimensional space of all $3\times 3$ grids. It is **compact** — closed and bounded, since every entry lies between $-1$ and $1$. It is **connected** — you can reach any rotation from "no rotation" by turning smoothly. And it is *not* the same shape as ordinary flat three-dimensional space: it [[closes back on itself|so3-ball]]. That fact, developed in lesson 13, is why no set of three numbers can describe every attitude without a bad spot. The breakdown in Euler angles is not a poor choice of angles. It is a shadow of the shape of $SO(3)$.

## Keeping a DCM in SO(3)

A flight computer does not measure its DCM once and keep it. It updates it many times a second from the gyros, which measure the body's spin rate $\boldsymbol{\omega}^B$ ("omega in B"). The rule for that update is the kinematic equation from module 14:

$$
\dot{\mathbf{C}}_{N\leftarrow B} = \mathbf{C}_{N\leftarrow B}\,[\boldsymbol{\omega}^B\times],
$$

where the dot on top means "rate of change" and $[\boldsymbol{\omega}\times]$ is the **skew-symmetric** cross-product matrix — the grid that does "$\boldsymbol{\omega}$ cross" when it multiplies a vector.

The computer adds up small changes step by step. Nothing in that stepping knows about the six rules, so the matrix slowly [[drifts off $SO(3)$|drift-picture]] and has to be pushed back.

The cheapest repair is one step of a **Newton iteration** — a repeat-until-close recipe — for the nearest valid rotation:

$$
\mathbf{C} \ \leftarrow\ \mathbf{C} - \tfrac{1}{2}\,\mathbf{C}\bigl(\mathbf{C}^{\top}\mathbf{C} - \mathbf{I}_3\bigr).
$$

The arrow $\leftarrow$ means "replace $\mathbf{C}$ with". The bracket $\mathbf{C}^\top\mathbf{C} - \mathbf{I}_3$ is the rule violation; when it is zero, nothing changes. Each step roughly squares the error (it **converges quadratically**), so two steps are usually plenty. And — this is the point — the repair does not change the attitude at all. It removes stretch, not turn.

::: note Why the repair leaves the attitude alone
Any square matrix with positive determinant can be split as $\mathbf{C} = \mathbf{Q}\mathbf{S}$, a pure rotation $\mathbf{Q}$ times a symmetric stretch $\mathbf{S}$ (the **polar decomposition**). Then $\mathbf{C}^\top\mathbf{C} = \mathbf{S}\mathbf{Q}^\top\mathbf{Q}\mathbf{S} = \mathbf{S}^2$, and the update becomes $\mathbf{Q}\mathbf{S}\bigl(\mathbf{I}_3 - \tfrac12(\mathbf{S}^2-\mathbf{I}_3)\bigr)$. The rotation $\mathbf{Q}$ passes straight through. Only the stretch changes, and it moves toward $\mathbf{I}_3$.
:::

```python
import numpy as np

def orthonormalise(C, n=2):
    """Newton iteration toward the nearest rotation. Leaves the attitude alone."""
    for _ in range(n):
        C = C - 0.5 * C @ (C.T @ C - np.eye(3))
    return C

def skew(v):
    x, y, z = v
    return np.array([[0.0, -z, y], [z, 0.0, -x], [-y, x, 0.0]])

w = np.array([0.0, np.deg2rad(2.0), 0.0])     # 2 deg/s pitch rate
C = np.eye(3)
for _ in range(60000):                        # 600 s at dt = 0.01 s, forward Euler
    C = C + 0.01 * (C @ skew(w))
print(np.abs(C.T @ C - np.eye(3)).max())      # 0.007337606900731153
print(np.linalg.det(C))                       # 1.0073376069007312
print(np.abs(orthonormalise(C).T @ orthonormalise(C) - np.eye(3)).max())
                                              # 1.2169713015097727e-09
```

::: example How fast a propagated DCM leaves SO(3)
Integrate a steady $2^\circ/\mathrm{s}$ pitch with **forward Euler** (take the rate now, times the step) at $\Delta t = 0.01\,\mathrm{s}$ for $600\,\mathrm{s}$. That is $60{,}000$ steps and $1200^\circ$ of rotation.

**The stretch per step.** Each step multiplies by $\mathbf{I}_3 + \Delta t[\boldsymbol{\omega}\times]$. In the plane of rotation that moves a point along the tangent instead of around the circle, which stretches its length by $\sqrt{1 + (\omega\Delta t)^2}$. Here $\omega\Delta t = 3.4907\times 10^{-4}\,\mathrm{rad}$, so the factor is $1.0000000609$ per step.

**The stretch after $60{,}000$ steps.** Raise it to the power $60{,}000$: $(1+(\omega\Delta t)^2)^{30000} = 1.003662$. The measured lengths of the two in-plane columns are $1.0036621$, and the out-of-plane column is still exactly $1$. They agree.

**The rule violation.** So $\max\lvert\mathbf{C}^\top\mathbf{C}-\mathbf{I}_3\rvert = 7.34\times 10^{-3}$ and $\det\mathbf{C} = 1.00734$: a matrix calling itself a rotation while stretching vectors by about a third of a percent.

**The attitude error.** Now the surprise. The *attitude* carried by that matrix is far better than the stretch suggests. Each Euler step turns through $\arctan(\omega\Delta t)$ instead of $\omega\Delta t$, a shortfall of $1.418\times 10^{-11}\,\mathrm{rad}$ per step. Times $60{,}000$ steps, the turn is short by $8.5\times 10^{-7}\,\mathrm{rad}$, which is $4.87\times 10^{-5}$ degrees. Projecting the drifted matrix back onto $SO(3)$ and comparing it with the exact answer gives $4.87\times 10^{-5}$ degrees — the prediction holds.

**The repair.** One Newton step cuts the rule violation from $7.34\times 10^{-3}$ to $4.03\times 10^{-5}$. A second takes it to $1.22\times 10^{-9}$. Neither changes the $4.87\times 10^{-5}$ degree attitude error, because the repair fixes the rules, not the stepping error. If you need a better attitude, you need a better integrator or a smaller step, not more normalizing.
:::

::: warning Re-orthonormalizing is not error correction
It is tempting to read a small $\lVert\mathbf{C}^\top\mathbf{C}-\mathbf{I}_3\rVert$ as proof that the attitude is healthy. It proves nothing of the sort. The two errors are independent. In the example above the rule violation, $7.34\times 10^{-3}$, is about $8600$ times the attitude error of $8.5\times 10^{-7}\,\mathrm{rad}$. An integrator can just as well keep the rules perfectly while drifting badly in angle. Watch the rules to catch corrupted data. Watch the attitude against an independent measurement to catch drift.
:::

## Check yourself

::: check
A matrix arrives over telemetry with columns $(0.36, 0.48, 0.80)$, $(-0.80, 0.60, 0.00)$ and $(-0.48, -0.64, 0.60)$. Is it a valid DCM?
:::

::: answer
**Lengths.** Column 1: $0.36^2+0.48^2+0.80^2 = 0.1296+0.2304+0.64 = 1.0000$. Column 2: $0.64+0.36+0 = 1.0000$. Column 3: $0.2304+0.4096+0.36 = 1.0000$.

**Perpendicular pairs.** Columns 1 and 2: $-0.288+0.288+0 = 0$. Columns 1 and 3: $-0.1728-0.3072+0.48 = 0$. Columns 2 and 3: $0.384-0.384+0 = 0$. So $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$.

**Handedness.** Column 1 $\times$ column 2 $= (0.48\cdot 0 - 0.80\cdot 0.60,\ 0.80\cdot(-0.80) - 0.36\cdot 0,\ 0.36\cdot 0.60 - 0.48\cdot(-0.80)) = (-0.48, -0.64, 0.60)$, which is exactly column 3. The set is right-handed, so $\det = +1$, and the matrix is a valid DCM.
:::

::: check
Why do nine direction cosines carry only three independent numbers, and what does that predict about three-number attitude representations?
:::

::: answer
The columns must be perpendicular unit arrows, which is $\mathbf{C}^\top\mathbf{C}=\mathbf{I}_3$. That grid is symmetric, so the equation gives six independent rules — three lengths and three right angles — on nine entries, leaving $9-6=3$ free. The determinant rule only picks one of two separate pieces (rotations rather than mirror images) and costs no further freedom. So $SO(3)$ is three-dimensional.

A three-number representation therefore has the right count. But $SO(3)$ is curved and closes back on itself, and no single three-number labelling can cover it everywhere. Every three-number representation must fail somewhere: Euler angles at gimbal lock, classical Rodrigues parameters at $180^\circ$, modified Rodrigues parameters at $360^\circ$.
:::

::: check
You have $\mathbf{C}_{B\leftarrow N}$ and need the body-axis components of a Sun direction known in inertial axes as $\mathbf{s}^N$. Which product do you form, which one would a careless engineer form instead, and how would you notice?
:::

::: answer
You want $\mathbf{s}^{B} = \mathbf{C}_{B\leftarrow N}\,\mathbf{s}^{N}$. The arrow already points from $N$ to $B$, so no transpose. The careless version is $\mathbf{C}_{B\leftarrow N}^{\top}\mathbf{s}^{N}$, which applies the reverse turn.

Structural checks will not notice. Both answers are unit vectors, and since the transpose is itself a valid rotation, angles *between* transformed vectors are preserved either way — transforming two vectors and checking their mutual angle proves nothing. What catches it is an independent body-frame measurement of the same thing: compare the predicted $\mathbf{s}^B$ with what a Sun sensor on the body actually reports. The right product agrees and the transposed one does not. And test at a non-zero attitude. At zero attitude $\mathbf{C} = \mathbf{I}_3 = \mathbf{C}^\top$ and the two answers coincide, which is why this bug survives unit tests written around the identity.
:::

::: check
A propagated DCM has $\max\lvert\mathbf{C}^\top\mathbf{C}-\mathbf{I}_3\rvert = 4\times 10^{-3}$. Estimate how much a unit vector's length changes when it is transformed, and say whether re-orthonormalizing will improve the attitude.
:::

::: answer
Write $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3 + \mathbf{E}$ with $\mathbf{E}$ about $4\times 10^{-3}$ in size. For a unit vector, $\lVert\mathbf{C}\mathbf{v}\rVert^2 = \mathbf{v}^\top\mathbf{C}^\top\mathbf{C}\mathbf{v} = 1 + \mathbf{v}^\top\mathbf{E}\mathbf{v} \approx 1 + 4\times 10^{-3}$ at worst. The length is the square root, and $\sqrt{1 + x} \approx 1 + x/2$ for small $x$, so the length changes by up to about $2\times 10^{-3}$, or $0.2\%$.

Re-orthonormalizing removes that stretch entirely. It will not improve the attitude: the Newton update leaves the rotation part $\mathbf{Q}$ of the polar split untouched. The attitude error comes from the integrator's stepping and can only be reduced by integrating better.
:::

::: check
Show that $SO(3)$ is closed under multiplication, but that $\mathbf{C}_1\mathbf{C}_2 \neq \mathbf{C}_2\mathbf{C}_1$ in general, using a concrete pair.
:::

::: answer
**Closure.** $(\mathbf{C}_1\mathbf{C}_2)^\top(\mathbf{C}_1\mathbf{C}_2) = \mathbf{C}_2^\top(\mathbf{C}_1^\top\mathbf{C}_1)\mathbf{C}_2 = \mathbf{C}_2^\top\mathbf{C}_2 = \mathbf{I}_3$, and $\det(\mathbf{C}_1\mathbf{C}_2) = (+1)(+1) = +1$.

**Order matters.** Let $\mathbf{C}_1$ be a $90^\circ$ turn about $z$ that takes $\hat{\mathbf{x}}\to\hat{\mathbf{y}}$ and $\hat{\mathbf{y}}\to-\hat{\mathbf{x}}$. Let $\mathbf{C}_2$ be a $90^\circ$ turn about $x$ that takes $\hat{\mathbf{y}}\to\hat{\mathbf{z}}$ and $\hat{\mathbf{z}}\to-\hat{\mathbf{y}}$. Follow $\hat{\mathbf{x}}$. With $\mathbf{C}_1$ first, then $\mathbf{C}_2$: it goes to $\hat{\mathbf{y}}$, then to $\hat{\mathbf{z}}$. With $\mathbf{C}_2$ first, then $\mathbf{C}_1$: it stays at $\hat{\mathbf{x}}$ (a turn about $x$ leaves $x$ alone), then moves to $\hat{\mathbf{y}}$. The same vector ends in different places, so the two products differ.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{C}_{A\leftarrow B}$ | DCM, "C, A from B": $\mathbf{v}^A = \mathbf{C}_{A\leftarrow B}\mathbf{v}^B$; entries $\hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j$ |
| Columns and rows | Column $j$ is $\hat{\mathbf{b}}_j$ in $A$; row $i$ is $\hat{\mathbf{a}}_i$ in $B$ |
| $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$ | Six independent constraints on nine entries |
| $\det\mathbf{C} = +1$ | Proper rotation; $-1$ means a reflection has crept in |
| $\mathbf{C}_{B\leftarrow A} = \mathbf{C}_{A\leftarrow B}^{\top}$ | Inverse is the transpose, never a matrix inversion |
| $\mathbf{C}_{A\leftarrow C} = \mathbf{C}_{A\leftarrow B}\mathbf{C}_{B\leftarrow C}$ | Chaining; inner labels must match |
| $SO(3)$ | Group of such matrices: closed, associative, identity $\mathbf{I}_3$, inverse $\mathbf{C}^\top$, not commutative |
| Dimension | $9 - 6 = 3$ degrees of freedom on a compact, connected, curved set |
| $\mathbf{C}\leftarrow\mathbf{C}-\tfrac12\mathbf{C}(\mathbf{C}^\top\mathbf{C}-\mathbf{I}_3)$ | Newton re-orthonormalization; fixes the constraint, not the attitude |
| Worked drift figure | $60{,}000$ Euler steps at $2^\circ/\mathrm{s}$: constraint error $7.34\times 10^{-3}$, attitude error $4.87\times 10^{-5}$ degrees |

Nine numbers with six rules is safe but wasteful. The next lesson spends the three degrees of freedom directly, as three turns in a row about coordinate axes — yaw, pitch and roll — and finds out what that costs.

::: context star-tracker A camera that knows the sky
A star tracker is a small digital camera with a computer attached. It photographs a patch of sky, finds the bright dots, and matches the pattern of distances between them against a catalog of a few thousand stars — the way you might recognize the Big Dipper. Once it knows which stars it is seeing, it knows exactly which way it is pointing. Good trackers are accurate to a few arcseconds, about a thousandth of a degree. Nearly every modern satellite carries at least one.
:::

::: context right-handed The right-hand rule
Point the fingers of your right hand along $x$ and curl them toward $y$. Your thumb points along $z$. That is a right-handed set of axes, and it is the one physics and flight software use. Its mirror image is left-handed: same three arrows, but $z$ points the other way. No turning can change one into the other, any more than you can turn your right glove into a left one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="2.5">
    <line x1="90" y1="110" x2="160" y2="110"/>
    <line x1="90" y1="110" x2="90" y2="40"/>
    <line x1="90" y1="110" x2="50" y2="150"/>
  </g>
  <polygon points="166,110 156,105 156,115" fill="#1f2a44"/>
  <polygon points="90,34 85,44 95,44" fill="#1f2a44"/>
  <polygon points="45.8,154.2 49.3,143.6 56.4,150.7" fill="#1f2a44"/>
  <g font-size="13" fill="#1f2a44">
    <text x="164" y="128">x</text><text x="98" y="42">y</text><text x="34" y="150">z</text>
  </g>
  <text x="95" y="20" font-size="12" text-anchor="middle" fill="#1d6fd1">right-handed: z = x × y</text>
  <line x1="180" y1="30" x2="180" y2="160" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="180" y="168" font-size="11" text-anchor="middle" fill="#6c7a93">mirror</text>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="270" y1="110" x2="200" y2="110"/>
    <line x1="270" y1="110" x2="270" y2="40"/>
    <line x1="270" y1="110" x2="310" y2="150"/>
  </g>
  <polygon points="194,110 204,105 204,115" fill="#b4232c"/>
  <polygon points="270,34 265,44 275,44" fill="#b4232c"/>
  <polygon points="314.2,154.2 303.6,150.7 310.7,143.6" fill="#b4232c"/>
  <g font-size="13" fill="#b4232c">
    <text x="190" y="128">x</text><text x="278" y="42">y</text><text x="318" y="150">z</text>
  </g>
  <text x="270" y="20" font-size="12" text-anchor="middle" fill="#b4232c">left-handed: det = −1</text>
</svg>
```
:::

::: context cosine-picture Why a dot product is a cosine
Lay a unit arrow $\hat{\mathbf{b}}$ at angle $\alpha$ to another unit arrow $\hat{\mathbf{a}}$. Drop a line from the tip of $\hat{\mathbf{b}}$ straight onto $\hat{\mathbf{a}}$. The shadow it casts has length $\cos\alpha$, and that shadow is the dot product $\hat{\mathbf{a}}\cdot\hat{\mathbf{b}}$. So each DCM entry says how far one axis reaches along another.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="130" x2="300" y2="130" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="306,130 296,125 296,135" fill="#1f2a44"/>
  <text x="300" y="150" font-size="13" fill="#1f2a44">â</text>
  <line x1="60" y1="130" x2="174.91" y2="33.58" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="179.5,29.7 175.1,40.0 168.6,32.3" fill="#1d6fd1"/>
  <text x="186" y="32" font-size="13" fill="#1d6fd1">b̂ (length 1)</text>
  <line x1="174.91" y1="33.58" x2="174.91" y2="130" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <path d="M100,130 A40,40 0 0,0 90.64,104.29" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="106" y="120" font-size="13" fill="#1f2a44">α</text>
  <line x1="60" y1="138" x2="174.91" y2="138" stroke="#b4232c" stroke-width="4"/>
  <text x="117" y="156" font-size="12" text-anchor="middle" fill="#b4232c">cos α = â · b̂</text>
</svg>
```
:::

::: context determinant-volume What a determinant measures
The three columns of a $3\times 3$ matrix are three arrows. They outline a slanted box. The determinant is the volume of that box, with a sign: plus if the arrows are right-handed, minus if they are left-handed. Three perpendicular unit arrows outline a cube of volume $1$, so a DCM's determinant can only be $+1$ or $-1$. A determinant of $0$ would mean the arrows lie flat in one plane — you will meet exactly that in the gimbal lock lesson.
:::

::: context group-word Why mathematicians say "group"
The word comes from the French mathematician Évariste Galois, who in the 1830s studied the ways the solutions of an equation can be shuffled among themselves. He noticed that doing one shuffle and then another is always a shuffle, that every shuffle can be undone, and that "do nothing" counts as one. Any collection with those properties is now called a group. Rotations are the same kind of thing: one turn then another is a turn, every turn can be undone, and "no turn" is one of them.
:::

::: context book-test The book experiment
Lay a book flat on a table, cover up, spine toward you. Turn it a quarter turn about the left–right line, so the cover faces you. Then turn it a quarter turn about the up–down line. Note where the spine ends up. Now start again and do the two turns in the opposite order. The book finishes in a different position. Nothing about the turns changed except their order — which is why every rotation formula in this module is careful about which turn comes first.
:::

::: context so3-ball The shape of all rotations
Here is one way to picture $SO(3)$. Every rotation is a turn by some angle about some axis. Draw an arrow pointing along the axis, with length equal to the angle. All rotations then fill a solid ball of radius $\pi$ (half a turn). But a half turn about an axis is the same as a half turn about the opposite axis, so opposite points on the surface of the ball are the *same* rotation. Walk out through the surface and you come back in on the other side. No flat three-number map can have that property without a bad spot, which lesson 13 makes precise.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="95" r="70" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="62.66" y1="135.15" x2="177.34" y2="54.85" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="177.34" cy="54.85" r="5" fill="#b4232c"/>
  <circle cx="62.66" cy="135.15" r="5" fill="#b4232c"/>
  <circle cx="120" cy="95" r="3" fill="#1f2a44"/>
  <line x1="120" y1="95" x2="150" y2="118" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="154.8,121.7 143.8,119.5 149.9,111.6" fill="#1d6fd1"/>
  <text x="120" y="182" font-size="12" text-anchor="middle" fill="#1f2a44">ball of radius π</text>
  <text x="206" y="50" font-size="12" fill="#b4232c">opposite surface points:</text>
  <text x="206" y="66" font-size="12" fill="#b4232c">the same half turn</text>
  <text x="206" y="112" font-size="12" fill="#1d6fd1">arrow: direction = axis,</text>
  <text x="206" y="128" font-size="12" fill="#1d6fd1">length = angle</text>
  <text x="206" y="158" font-size="12" fill="#1f2a44">center: no rotation</text>
</svg>
```
:::

::: context drift-picture Why stepping drifts off the circle
Watch one axis tip as the body turns. It should slide around a circle. Forward Euler moves it along the straight tangent line instead — the direction it was heading at the start of the step. A straight step always lands slightly outside the circle, so the axis grows a little longer every step. The drawing exaggerates one step enormously; in the example each step adds only six parts in a hundred million, but sixty thousand of them add up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M180,150 A120,120 0 0,0 101.04,37.24" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="150" x2="151.93" y2="72.87" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="60" cy="150" r="3" fill="#1f2a44"/>
  <circle cx="151.93" cy="72.87" r="4" fill="#1d6fd1"/>
  <line x1="151.93" y1="72.87" x2="113.36" y2="26.9" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="113.36" cy="26.9" r="4" fill="#b4232c"/>
  <text x="200" y="40" font-size="12" fill="#b4232c">straight Euler step</text>
  <text x="200" y="56" font-size="12" fill="#b4232c">lands outside: longer</text>
  <text x="200" y="110" font-size="12" fill="#1f2a44">true path stays on</text>
  <text x="200" y="126" font-size="12" fill="#1f2a44">the circle: length 1</text>
</svg>
```
:::
