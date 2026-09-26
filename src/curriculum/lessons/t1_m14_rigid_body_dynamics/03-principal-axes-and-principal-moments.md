---
id: l03-principal-axes-and-principal-moments
title: Principal axes and principal moments
minutes: 22
covers:
  - principal axes and principal moments
---

Spin a coin on a table and it whirls neatly about one line. Try to spin a potato and it wobbles. But even a lumpy potato has a few special directions where, if you could start it turning exactly right, it would spin cleanly without wobbling. This lesson is about those special directions.

The tensor you built in the previous lesson had products of inertia. The bus with an instrument on a boom came out with $xz$ entries of $-19.4\,\mathrm{kg\,m^2}$, and every real vehicle has some — a satellite with an antenna on one side, a rocket with a lopsided payload. Here is the key idea: products of inertia are not a property of the body. They are a property of the *axes you chose* to describe it. For any rigid body there is a set of axes in which every product of inertia is zero. This lesson proves that, shows how to find those axes, and names the three numbers left on the diagonal.

Those axes are the **principal axes**, and the diagonal numbers are the **principal moments of inertia**. Nearly every result in the rest of this module is stated in them. Euler's equations are simplest there. The intermediate axis theorem is about *which* principal axis you spin around. A spinning spacecraft is built so that its spin axis is a principal axis to within a fraction of a degree. And every mass-properties report for a flight vehicle quotes the principal moments and how the principal axes are tilted from the structural axes, because that tilt tells the control engineer how much cross-coupling to expect.

The math is the **[[eigenvalue|eigen-word]]** problem for a real symmetric matrix, from the linear algebra prerequisite. Here it gets a physical meaning.

## When is angular momentum parallel to angular velocity?

Lesson 2 gave $\mathbf{H}_C = \mathbf{I}\boldsymbol{\omega}$. Because $\mathbf{I}$ is a matrix and not a single number, it stretches $\boldsymbol{\omega}$ by different amounts in different directions. So in general $\mathbf{H}$ points somewhere a little different from $\boldsymbol{\omega}$. Think of pushing a shopping cart with one stuck wheel: you push straight ahead, and it goes off at an angle.

Now ask for the exceptional directions: the unit vectors $\hat{\mathbf{n}}$ where spinning about $\hat{\mathbf{n}}$ gives angular momentum along $\hat{\mathbf{n}}$ too:

$$
\mathbf{I}\,\hat{\mathbf{n}} = \lambda\,\hat{\mathbf{n}} .
$$

This is the **eigenvalue equation**. A direction $\hat{\mathbf{n}}$ that satisfies it is a **principal axis** of the body. The number $\lambda$ (read "lambda") is its **principal moment**. Along a principal axis, $\mathbf{H} = \lambda\boldsymbol{\omega}$, and the tensor behaves like the single number $I$ in $H = I\omega$, the rule you may know for a wheel on a fixed shaft. Off a principal axis, the two vectors point different ways, and — as lesson 9 shows — the body cannot spin steadily about $\boldsymbol{\omega}$. It wobbles, or **nutates**.

What is $\lambda$ physically? Take the dot product of both sides with $\hat{\mathbf{n}}$. Since $\hat{\mathbf{n}}\cdot\hat{\mathbf{n}} = 1$, you get $\lambda = \hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}} = I_n$: the moment of inertia about the axis $\hat{\mathbf{n}}$, exactly as defined in lesson 2. So a principal moment is an ordinary moment of inertia about a special axis. It is in $\mathrm{kg\,m^2}$ and it is positive.

## Why three principal axes always exist

The inertia tensor is a **real symmetric matrix**: real numbers, and a mirror image of itself across the diagonal. Three facts about such matrices carry this whole lesson:

1. **The eigenvalues are real numbers.** So principal axes are actual directions in the body, not something imaginary.
2. **Eigenvectors of different eigenvalues are perpendicular.** So three different principal moments come with three principal axes at right angles — a proper set of axes fixed in the body.
3. **The eigenvalues are positive,** because each is a moment of inertia about some axis.

::: note Why the three facts have to be true
**Real.** Suppose $\mathbf{I}\mathbf{v} = \lambda\mathbf{v}$, allowing $\mathbf{v}$ and $\lambda$ to be **[[complex|complex-conjugate]]**. Write $\bar{\mathbf{v}}$ for the complex conjugate. Multiply the equation on the left by $\bar{\mathbf{v}}^\top$: $\bar{\mathbf{v}}^\top\mathbf{I}\mathbf{v} = \lambda\,\bar{\mathbf{v}}^\top\mathbf{v}$. Now take the conjugate transpose of the original equation. Since $\mathbf{I}$ is real and symmetric, that gives $\bar{\mathbf{v}}^\top\mathbf{I} = \bar\lambda\,\bar{\mathbf{v}}^\top$; multiply on the right by $\mathbf{v}$ to get $\bar{\mathbf{v}}^\top\mathbf{I}\mathbf{v} = \bar\lambda\,\bar{\mathbf{v}}^\top\mathbf{v}$. The left sides match, so $\lambda\,\bar{\mathbf{v}}^\top\mathbf{v} = \bar\lambda\,\bar{\mathbf{v}}^\top\mathbf{v}$. And $\bar{\mathbf{v}}^\top\mathbf{v}$ is the sum of squared sizes of the components, which is positive. Divide it out: $\bar\lambda = \lambda$, so $\lambda$ is real. A real eigenvalue of a real matrix has a real eigenvector.

**Perpendicular.** Let $\mathbf{I}\mathbf{v}_1 = \lambda_1\mathbf{v}_1$ and $\mathbf{I}\mathbf{v}_2 = \lambda_2\mathbf{v}_2$. Compute $\mathbf{v}_2^\top\mathbf{I}\mathbf{v}_1$ two ways. Using the first equation, it is $\lambda_1\mathbf{v}_2^\top\mathbf{v}_1$. Using symmetry, it is $(\mathbf{I}\mathbf{v}_2)^\top\mathbf{v}_1 = \lambda_2\mathbf{v}_2^\top\mathbf{v}_1$. Subtract: $(\lambda_1 - \lambda_2)\,\mathbf{v}_2^\top\mathbf{v}_1 = 0$. If $\lambda_1 \ne \lambda_2$, the dot product $\mathbf{v}_2^\top\mathbf{v}_1$ must be zero.

**Positive.** From the first section, $\lambda = \hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}} = \int r_\perp^2\,dm > 0$ for any body that is not a line of mass along $\hat{\mathbf{n}}$.
:::

The **characteristic equation** $\det(\mathbf{I} - \lambda\mathbf{I}_3) = 0$ is a cubic in $\lambda$, so there are three eigenvalues (some may repeat). That gives three cases:

- **All three different.** The principal axes are fixed, apart from which way each arrow points.
- **Two equal.** The body is **axisymmetric** in the inertia sense, like lesson 2's cylinder with $\mathrm{diag}(I_t, I_t, I_3)$. Any two perpendicular axes in the plane of the repeated value serve as principal axes.
- **All three equal.** The body is **[[inertially spherical|inertially-spherical]]**. Every axis is principal, and $\mathbf{H}$ is parallel to $\boldsymbol{\omega}$ for every spin. A uniform cube is like this: three equal principal moments, even though it is not round.

::: key Principal axes and principal moments
The principal axes of a rigid body are the eigenvectors of its inertia tensor, and the principal moments $I_1, I_2, I_3$ are the eigenvalues. Because $\mathbf{I}$ is real, symmetric and positive definite, the principal moments are real and positive and the principal axes are mutually perpendicular. In the principal frame $\mathbf{I} = \mathrm{diag}(I_1, I_2, I_3)$ and every product of inertia is zero, so $\mathbf{H}$ is parallel to $\boldsymbol{\omega}$ exactly when $\boldsymbol{\omega}$ lies along a principal axis.
:::

## Diagonalizing the tensor

Lesson 2 showed how the tensor changes when you turn the axes: with $\mathbf{v}' = \mathbf{R}\mathbf{v}$, the new tensor is $\mathbf{I}' = \mathbf{R}\mathbf{I}\mathbf{R}^\top$. So which $\mathbf{R}$ makes $\mathbf{I}'$ diagonal?

Build $\mathbf{R}$ by stacking the three unit eigenvectors as its **rows**: $\mathbf{R} = [\hat{\mathbf{n}}_1\ \hat{\mathbf{n}}_2\ \hat{\mathbf{n}}_3]^\top$. Then $\mathbf{R}^\top$ has them as columns. The eigenvalue equation, applied one column at a time, says $\mathbf{I}\mathbf{R}^\top = \mathbf{R}^\top\mathrm{diag}(I_1, I_2, I_3)$. Multiply on the left by $\mathbf{R}$:

$$
\mathbf{R}\,\mathbf{I}\,\mathbf{R}^\top = \mathbf{R}\mathbf{R}^\top\,\mathrm{diag}(I_1, I_2, I_3) = \mathrm{diag}(I_1, I_2, I_3),
$$

because the eigenvectors are unit length and perpendicular, so $\mathbf{R}\mathbf{R}^\top = \mathbf{I}_3$. This $\mathbf{R}$ takes components in the original body axes to components in the principal axes. Row $i$ of $\mathbf{R}$ is principal axis $i$ written in the original axes. That is the tilt a mass-properties report quotes, usually as three small angles.

Two numbers do not change under this or any rotation, and they make handy checks:

- the **trace**: $I_{xx} + I_{yy} + I_{zz} = I_1 + I_2 + I_3$;
- the **determinant**: $\det\mathbf{I} = I_1 I_2 I_3$.

If your principal moments fail either check, the calculation is wrong.

### Naming the axes

Sort the principal moments by size and name the axes:

- the **major axis** has the largest moment;
- the **minor axis** has the smallest;
- the **intermediate axis** is the one in the middle.

This module often uses the labels $1, 2, 3$ for the principal axes without promising an order, so formulas like Euler's equations can be written once and shuffled. When the order matters, as it does for spin stability, the lesson will say which axis is which. Lesson 2's triangle inequality holds for principal moments too: each is at most the sum of the other two.

You can often read the names off the shape, because mass far from an axis raises the moment about it. A long, thin body — a rocket stage, the [[Explorer 1|explorer-1]] satellite, a pencil — has its minor axis along its length and two nearly equal large moments across it. Such a body is **[[prolate|prolate-oblate]]**. A flat body — a coin, a wheel, a squat can wider than it is tall — has its major axis along its symmetry axis and is **oblate**. A three-axis-stabilized communications bus, roughly a box with unequal sides, has three different moments. Its principal axes lie close to its structural axes only if its layout is nearly symmetric.

### The two-dimensional case by hand

When only one product of inertia is nonzero, the problem shrinks to a $2\times 2$ block you can solve with a pencil. Take a tensor with $a = I_{xx}$, $b = I_{zz}$ and off-diagonal entry $c$ in the two $xz$ spots (so $c = -I_{xz}$ in lesson 2's notation). The $y$ axis is already principal.

The characteristic equation of the block is $(a - \lambda)(b - \lambda) - c^2 = 0$. It is a quadratic, and the quadratic formula gives

$$
\lambda_\pm = \frac{a + b}{2} \pm \sqrt{\left(\frac{a - b}{2}\right)^2 + c^2}.
$$

Read it like this: start at the average of the two diagonal entries, then step up and down by the same amount. That step is always at least $|a - b|/2$, so the product of inertia *pushes the two principal moments apart*: the larger grows and the smaller shrinks.

The eigenvector for $\lambda_-$ makes an angle $\theta$ ("theta") with the $x$ axis, measured toward $z$. The first row of $(\mathbf{I} - \lambda_-\mathbf{I}_3)\hat{\mathbf{n}} = 0$ with $\hat{\mathbf{n}} = (\cos\theta, \sin\theta)$ reads $(a - \lambda_-)\cos\theta + c\sin\theta = 0$, so

$$
\tan\theta = \frac{\lambda_- - a}{c},
\qquad\text{equivalently}\qquad
\tan 2\theta = \frac{2c}{a - b}.
$$

The $\tan 2\theta$ form comes from turning the $xz$ axes by $\theta$ and asking for the new off-diagonal entry to vanish. It is the one to remember, because it shows that the **[[tilt|tilt-picture]]** is large when $a$ and $b$ are close and small when they are far apart. One catch: $\tan 2\theta$ only fixes $\theta$ up to a quarter turn, so it finds a principal axis near $x$, not necessarily the minor one. Use the $\tan\theta$ form, or the sizes, to tell which is which.

::: example Principal axes of the bus with a boom
Lesson 2 found, about the center of mass of the $600\,\mathrm{kg}$ bus with its $20\,\mathrm{kg}$ instrument at $(2.5, 0, 0.4)\,\mathrm{m}$,

$$
\mathbf{I}_C = \begin{bmatrix} 211.6 & 0 & -19.4 \\ 0 & 332.6 & 0 \\ -19.4 & 0 & 313.0 \end{bmatrix}\mathrm{kg\,m^2}.
$$

**The $y$ axis** is already principal, with $I_y = 332.6\,\mathrm{kg\,m^2}$: its row and column have nothing off the diagonal.

**The $xz$ block** has $a = 211.6$, $b = 313.0$, $c = -19.4$. The average is $(a + b)/2 = 262.3$. The half-difference is $(a - b)/2 = -50.7$. So

$$
\lambda_\pm = 262.3 \pm \sqrt{50.7^2 + 19.4^2} = 262.3 \pm \sqrt{2570 + 376} = 262.3 \pm 54.3 ,
$$

giving principal moments $208.0$ and $316.6\,\mathrm{kg\,m^2}$.

**Trace check:** $208.0 + 316.6 + 332.6 = 857.2$, and $211.6 + 332.6 + 313.0 = 857.2$. They match.

**Angle.** $\tan 2\theta = 2c/(a - b) = -38.8/(-101.4) = 0.383$, so $2\theta = 20.9^\circ$ and $\theta = 10.5^\circ$. Confirm with the other form: $\tan\theta = (208.0 - 211.6)/(-19.4) = 0.186$, and $\arctan 0.186 = 10.5^\circ$.

**Result.** The minor axis, $I_1 = 208.0\,\mathrm{kg\,m^2}$, lies in the $xz$ plane, tilted $10.5^\circ$ from body $x$ toward $+z$: as a unit vector, $(\cos 10.5^\circ, 0, \sin 10.5^\circ) = (0.983, 0, 0.182)$. The intermediate axis, $I_2 = 316.6$, is perpendicular to it in the same plane, $(-0.182, 0, 0.983)$. The major axis is body $y$, $I_3 = 332.6$. (For a right-handed set in the order minor, intermediate, major, point the third one along $-y$.) In order of size: $208.0 < 316.6 < 332.6$.

**Sanity check.** The instrument sits at $(2.419, 0, 0.387)\,\mathrm{m}$ from the center of mass, a direction $9.1^\circ$ above the $x$ axis. Twenty kilograms at $2.4\,\mathrm{m}$ dominates this assembly, and the axis of *least* inertia is the one that passes closest to that mass — so the minor axis swings toward the boom, to $10.5^\circ$. If this spacecraft were told to roll steadily about body $x$, it would wobble, because body $x$ is not principal. Either the boom gets a counterweight, or the controller spins it about $(0.983, 0, 0.182)$ instead.
:::

::: example A communications bus with an off-center tank
A bus has principal moments $\mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ in its structural axes. Then a $40\,\mathrm{kg}$ tank is added at $(0.6, 0.9, 0)\,\mathrm{m}$ from the center of mass. Treat the tank as a point mass and ignore the small shift of the center of mass.

**Parallel axis term.** $\lVert\mathbf{d}\rVert^2 = 0.36 + 0.81 = 1.17\,\mathrm{m^2}$ and $d_xd_y = 0.54$, so

$$
40\begin{bmatrix} 1.17 - 0.36 & -0.54 & 0 \\ -0.54 & 1.17 - 0.81 & 0 \\ 0 & 0 & 1.17 \end{bmatrix}
= \begin{bmatrix} 32.4 & -21.6 & 0 \\ -21.6 & 14.4 & 0 \\ 0 & 0 & 46.8 \end{bmatrix}\mathrm{kg\,m^2},
$$

and the new tensor is

$$
\mathbf{I} = \begin{bmatrix} 1232.4 & -21.6 & 0 \\ -21.6 & 1514.4 & 0 \\ 0 & 0 & 2046.8 \end{bmatrix}\mathrm{kg\,m^2}.
$$

**The $z$ axis** stays principal, with $I_z = 2046.8$.

**The $xy$ block** has $a = 1232.4$, $b = 1514.4$, $c = -21.6$. Average $1373.4$, half-difference $-141.0$, and $\sqrt{141.0^2 + 21.6^2} = 142.6$. The principal moments are $1373.4 - 142.6 = 1230.8$ and $1373.4 + 142.6 = 1516.0\,\mathrm{kg\,m^2}$.

**Angle.** $\tan 2\theta = -43.2/(-282.0) = 0.153$, so $2\theta = 8.71^\circ$ and $\theta = 4.35^\circ$. The minor axis is turned $4.35^\circ$ from body $x$ toward $+y$ — again toward the added mass.

**Compare the two effects.** The product of inertia, $21.6\,\mathrm{kg\,m^2}$, is under $2\%$ of the smallest moment. Yet it turns the principal axes by more than four degrees, because the two moments it couples are only $282\,\mathrm{kg\,m^2}$ apart. On the diagonal the change is tiny: $1230.8$ instead of $1232.4$. The tilt of the axes, not the shift in the moments, is what the attitude controller notices.
:::

## The inertia ellipsoid

Lesson 6 will use a picture of the tensor. The moment of inertia about a direction $\hat{\mathbf{n}}$ is $I_n = \hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}}$. Now collect every point $\mathbf{x}$ with

$$
\mathbf{x}^\top\mathbf{I}\,\mathbf{x} = 1 .
$$

Because $\mathbf{I}$ is positive definite, this is an egg-shaped surface around the origin — an **ellipsoid**, called the **[[inertia ellipsoid|inertia-ellipsoid]]**. In principal axes it reads $I_1x_1^2 + I_2x_2^2 + I_3x_3^2 = 1$. Its three half-widths lie along the principal axes, with lengths $1/\sqrt{I_1}$, $1/\sqrt{I_2}$ and $1/\sqrt{I_3}$. So it is longest along the minor axis and shortest along the major axis. In any direction $\hat{\mathbf{n}}$, the surface is a distance $1/\sqrt{I_n}$ from the center. The result is roughly the body's own shape: a pencil gives an ellipsoid stretched along its length, and a coin gives a flattened one.

The ellipsoid turns the eigenvalue problem into geometry. Finding the principal axes means finding the ellipsoid's symmetry axes. A product of inertia says your body axes are not lined up with them.

There is one more fact to carry forward. The direction straight out of a surface — its **normal** — at a point $\mathbf{x}$ is along the **gradient** of $\mathbf{x}^\top\mathbf{I}\mathbf{x}$ — the direction in which that expression grows fastest — which is $2\mathbf{I}\mathbf{x}$. Take $\mathbf{x}$ along $\boldsymbol{\omega}$, and $2\mathbf{I}\mathbf{x}$ is along $\mathbf{I}\boldsymbol{\omega} = \mathbf{H}$. So the normal to the ellipsoid, where $\boldsymbol{\omega}$ pierces it, points along $\mathbf{H}$. $\mathbf{H}$ and $\boldsymbol{\omega}$ are parallel exactly where the normal points straight out from the center — at the ends of the half-widths, the principal axes. That fact is the geometric heart of torque-free motion in lesson 6.

## Computing principal axes in code

For a general tensor with three products of inertia, let the computer solve it. Use a solver made for symmetric matrices, like NumPy's `eigh`. It returns real eigenvalues in increasing order and perpendicular unit eigenvectors as columns.

```python
import numpy as np

I = np.array([[211.6, 0.0, -19.4],
              [0.0, 332.6, 0.0],
              [-19.4, 0.0, 313.0]])

moments, axes = np.linalg.eigh(I)      # ascending eigenvalues; columns are axes
for k in range(3):                     # a solver's signs are arbitrary: make the
    big = np.argmax(np.abs(axes[:, k]))  # largest part of each axis positive
    if axes[big, k] < 0:
        axes[:, k] *= -1
if np.linalg.det(axes) < 0:            # keep the principal frame right-handed
    axes[:, 2] *= -1
R = axes.T                             # rows: principal axes in body coordinates
print(np.round(moments, 1))            # [208.  316.6 332.6]
print(np.round(R @ I @ R.T, 1))        # diagonal: 208.0, 316.6, 332.6
print(np.round(np.degrees(np.arctan2(R[0, 2], R[0, 0])), 2))   # 10.47
```

Check three things every time:

1. **Signs and handedness.** A solver may return $\hat{\mathbf{n}}$ or $-\hat{\mathbf{n}}$. Pick signs on purpose, as the loop does, or the angles you read off can come out a half turn wrong ($-169.5^\circ$ instead of $10.5^\circ$ here). Then make sure the frame is **[[right-handed|right-handed]]**: if the determinant is $-1$, flip one axis.
2. **Sort together.** Keep each moment with its own axis; never sort one list without the other.
3. **Diagonal test.** Confirm $\mathbf{R}\mathbf{I}\mathbf{R}^\top$ is diagonal to rounding error. This cheap test catches a transposed $\mathbf{R}$, the most common error.

::: warning Principal axes are directions, not arrows, and are not always unique
A solver may return $\hat{\mathbf{n}}$ or $-\hat{\mathbf{n}}$. Both are the same principal axis, and the physics does not care which — but the frame you build must still be right-handed. When two principal moments are equal or nearly equal, the solver's choice of axes in their plane is arbitrary and can jump between runs after tiny changes in the tensor. So a nearly axisymmetric spinner's sideways principal axes are not something to line hardware up with. Only the spin axis is well defined.
:::

::: warning The rotation goes one way
Rows of $\mathbf{R}$ are principal axes written in body coordinates, and $\mathbf{R}$ takes body components to principal components: $\boldsymbol{\omega}_{\mathrm{prin}} = \mathbf{R}\,\boldsymbol{\omega}_{\mathrm{body}}$. Using $\mathbf{R}^\top$ by mistake gives a tensor that is not diagonal, which is easy to notice. But in a simulation it also quietly turns gyro readings into the wrong frame, which is not. Test the convention on a tensor whose answer you know before trusting it on one you do not.
:::

::: note Nearly equal moments on real vehicles
Spinning spacecraft are built to be nearly axisymmetric on purpose, so two principal moments are almost equal and the form $\mathrm{diag}(I_t, I_t, I_3)$ applies. Lessons 9 and 10 use this to solve the equations of motion exactly. Three-axis-stabilized spacecraft usually have three different moments and principal axes a few degrees from the structural axes. Their controllers are designed in the structural axes and treat the products of inertia as a known coupling.
:::

## Check yourself

::: check
A body has $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ in its body axes. Name the major, intermediate and minor axes, and say whether the body is closer to prolate or oblate.
:::

::: answer
The tensor is already diagonal, so the body axes are principal. The largest moment, $2000\,\mathrm{kg\,m^2}$ about $z$, makes $z$ the major axis. $x$, with $1200$, is the minor axis. $y$, with $1500$, is intermediate.

With three different moments, the body is not exactly prolate or oblate. The two smaller moments ($1200$ and $1500$, which are $300$ apart) are closer to each other than either is to the largest ($500$ above $1500$). Two similar smaller moments and one big one is the oblate pattern. So it is nearer a squat shape with its symmetry axis along $z$ than a slender one.
:::

::: check
Show that if a body has a plane of symmetry, the axis perpendicular to that plane is a principal axis.
:::

::: answer
Let the symmetry plane be $z = 0$, so the axis in question is $z$. The mirror sends every bit of mass at $(x, y, z)$ to a twin at $(x, y, -z)$. Their contributions to $I_{xz} = \int xz\,dm$ and $I_{yz} = \int yz\,dm$ cancel in pairs, so both are zero. (This is lesson 2's rule: a product of inertia vanishes when one of its axes, here $z$, is perpendicular to a plane of symmetry.)

The third row and column of the tensor are then $(0, 0, I_{zz})$. So $\mathbf{I}\hat{\mathbf{z}} = I_{zz}\hat{\mathbf{z}}$, and $\hat{\mathbf{z}}$ is an eigenvector — a principal axis. The other two principal axes lie in the symmetry plane, but they need not be $x$ and $y$, because $I_{xy}$ can still be nonzero.
:::

::: check
A tensor has $I_{xx} = 500$, $I_{yy} = 500$ and an off-diagonal $xy$ entry of $-100\,\mathrm{kg\,m^2}$, with $z$ principal. Find the principal moments in the $xy$ plane and the directions of the principal axes.
:::

::: answer
Here $a = b = 500$ and $c = -100$. The principal moments are $\lambda_\pm = 500 \pm \sqrt{0^2 + 100^2} = 500 \pm 100$, so $400$ and $600\,\mathrm{kg\,m^2}$.

For the angle, $\tan 2\theta = 2c/(a - b)$ has a zero denominator, so $2\theta = \pm 90^\circ$ and $\theta = \pm 45^\circ$: the principal axes cut the body axes exactly in half. To tell which is which, use $\tan\theta = (\lambda_- - a)/c = (400 - 500)/(-100) = 1$, so $\theta = +45^\circ$. The minor axis ($400$) is along $(1, 1, 0)/\sqrt{2}$, and the axis with $600$ is along $(-1, 1, 0)/\sqrt{2}$.

Equal diagonal entries with any coupling at all give the biggest possible tilt, $45^\circ$ — the extreme case of "close moments mean large tilts". Trace check: $400 + 600 = 1000 = 500 + 500$.
:::

::: check
Two solvers return the principal axes of the same tensor as the rows of $\mathbf{R}_a$ and $\mathbf{R}_b$, with $\det\mathbf{R}_a = +1$ and $\det\mathbf{R}_b = -1$. Are they describing different principal axes? Which should you use to build a principal frame?
:::

::: answer
They describe the same axes. An eigenvector is only defined up to its sign, and $\mathbf{R}_b$ differs from $\mathbf{R}_a$ by the sign of one or three of its rows.

But $\mathbf{R}_b$ is a reflection, like a mirror, not a rotation. A frame built from it is left-handed, and the cross-product rules used in every rigid-body formula fail in it — angular velocities in that frame come out with the wrong sign. Use $\mathbf{R}_a$, or flip one row of $\mathbf{R}_b$ to make its determinant $+1$. Always test the determinant before trusting a computed principal frame.
:::

::: check
Without solving an eigenvalue problem, what are the principal moments of a uniform solid cube of mass $m$ and side $a$ about its center? What does that mean for $\mathbf{H}$ when it spins about a diagonal through two opposite corners?
:::

::: answer
Lesson 2's box formula with all sides equal gives $I_{xx} = I_{yy} = I_{zz} = \tfrac{1}{12}m(a^2 + a^2) = \tfrac{1}{6}ma^2$. The three coordinate planes are planes of symmetry, so every product of inertia is zero. The tensor is $\tfrac{1}{6}ma^2\,\mathbf{I}_3$: three equal principal moments, so the cube is inertially spherical.

Then every direction is a principal axis, including the corner-to-corner diagonal. So $\mathbf{H} = \tfrac{1}{6}ma^2\,\boldsymbol{\omega}$ is exactly parallel to $\boldsymbol{\omega}$, and the cube spins steadily about any axis without wobbling.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{I}\hat{\mathbf{n}} = \lambda\hat{\mathbf{n}}$ | Eigenvalue equation; $\hat{\mathbf{n}}$ is a principal axis, $\lambda = I_n$ a principal moment |
| $I_1, I_2, I_3$ | Principal moments: real, positive, eigenvalues of $\mathbf{I}$; sum equals the trace, product equals the determinant |
| Major, intermediate, minor axis | Principal axes of largest, middle and smallest moment |
| Prolate, oblate | Slender body, minor axis along the length; flat body, major axis along the symmetry axis |
| Axisymmetric, inertially spherical | Two equal principal moments; all three equal (every axis principal) |
| $\mathbf{R}\mathbf{I}\mathbf{R}^\top = \mathrm{diag}(I_1, I_2, I_3)$ | Diagonalization; rows of $\mathbf{R}$ are the principal axes in body coordinates |
| $\lambda_\pm = \tfrac{a + b}{2} \pm \sqrt{\left(\tfrac{a - b}{2}\right)^2 + c^2}$ | Principal moments of a $2\times 2$ block with diagonal $a, b$ and off-diagonal $c$ |
| $\tan 2\theta = 2c/(a - b)$ | Tilt of the principal axes from the body axes in that plane |
| $\mathbf{x}^\top\mathbf{I}\mathbf{x} = 1$ | Inertia ellipsoid; half-widths $1/\sqrt{I_k}$ along the principal axes; its normal where $\boldsymbol{\omega}$ pierces it is along $\mathbf{H}$ |
| Bus with boom | $208.0, 316.6, 332.6\,\mathrm{kg\,m^2}$; minor axis $10.5^\circ$ from body $x$ toward the boom |

The next lesson takes $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ seriously as a vector equation: how far $\mathbf{H}$ is turned away from $\boldsymbol{\omega}$ off a principal axis, what the rotational kinetic energy is, and why both matter before the equations of motion are written down.

::: context eigen-word "Its own" direction
*Eigen* is German for "own" or "characteristic". An **eigenvector** of a matrix is a direction the matrix does not turn — it only stretches it, by a factor called the **eigenvalue**. Most directions get both stretched and turned. For the inertia tensor, the directions that are only stretched are exactly the ones where angular momentum lines up with the spin: the body's "own" axes.
:::

::: context complex-conjugate A quick reminder about complex numbers
A complex number is $p + qi$, where $i^2 = -1$. Its **conjugate** is $p - qi$: the same number with the sign of the imaginary part flipped. Multiply a number by its conjugate and you get $p^2 + q^2$, which is real and never negative. That is why $\bar{\mathbf{v}}^\top\mathbf{v}$ in the proof is positive: it adds up $p^2 + q^2$ for each component. A number equal to its own conjugate has $q = 0$ — it is real.
:::

::: context inertially-spherical A cube that behaves like a ball
Rotation cannot "see" the corners of a uniform cube. Its moment about every axis through its center is the same, $\tfrac{1}{6}ma^2$, whether the axis goes through the middle of a face, the middle of an edge, or two opposite corners. So as far as spinning is concerned, a cube behaves exactly like a sphere. Many CubeSats are close to this, which is why their $\mathbf{H}$ and $\boldsymbol{\omega}$ nearly line up whichever way they tumble.
:::

::: context explorer-1 A long, thin satellite that surprised everyone
Explorer 1, the first American satellite, launched in January 1958, was a slender pencil-like cylinder with four thin whip antennas. It was spun about its long axis — its minor axis — which rigid-body theory says is a stable spin. Soon after launch it was instead found tumbling end over end about its major axis. The flexing antennas had been quietly draining energy. Lesson 8 explains why that pushes any spinning body toward its major axis, and why simple spinners have been designed to spin about their major axis ever since.
:::

::: context prolate-oblate A football and a coin
A **prolate** shape is stretched along one axis, like an American football or a pencil: small moment along the length, two big equal ones across it. An **oblate** shape is squashed along one axis, like a coin or a doughnut: big moment along the symmetry axis, two smaller equal ones across it. Earth itself is slightly oblate — fatter at the equator.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <ellipse cx="95" cy="80" rx="75" ry="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="5" y1="80" x2="185" y2="80" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="95" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">prolate</text>
  <text x="95" y="148" font-size="12" text-anchor="middle" fill="#b4232c">minor axis along the length</text>
  <ellipse cx="270" cy="80" rx="60" ry="18" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <line x1="270" y1="30" x2="270" y2="115" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="270" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">oblate (coin, edge on)</text>
  <text x="270" y="148" font-size="12" text-anchor="middle" fill="#1d6fd1">major axis through the face</text>
</svg>
```
:::

::: context tilt-picture Why the minor axis leans toward the boom
The boom example, drawn in the $xz$ plane. The instrument lies $9.1^\circ$ above body $x$. The minor axis (red) comes out at $10.5^\circ$ — right next to it — because the axis of least inertia is the one that runs closest to the biggest far-out mass. The intermediate axis (blue) is at right angles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="150" x2="330" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="318" y="168" font-size="12" fill="#6c7a93">body x</text>
  <line x1="60" y1="190" x2="60" y2="15" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="68" y="18" font-size="12" fill="#6c7a93">body z</text>
  <line x1="60" y1="150" x2="315.7" y2="102.6" stroke="#b4232c" stroke-width="3"/>
  <text x="206" y="110" font-size="12" fill="#b4232c">minor 10.5°</text>
  <line x1="60" y1="150" x2="35.4" y2="17.3" stroke="#1d6fd1" stroke-width="3"/>
  <text x="2" y="40" font-size="12" fill="#1d6fd1">inter.</text>
  <circle cx="302" cy="111.3" r="6" fill="#1f2a44"/>
  <text x="302" y="96" font-size="12" text-anchor="middle" fill="#1f2a44">instrument 9.1°</text>
</svg>
```
:::

::: context inertia-ellipsoid The ellipsoid, sliced
A slice through the inertia ellipsoid in the plane of two principal axes, with $I_1 = 1$ and $I_2 = 4$ (in some unit), so the half-widths are $1$ and $\tfrac{1}{2}$. Where $\boldsymbol{\omega}$ (grey) pierces the surface, the normal to the surface (red) points along $\mathbf{H}$. They agree only at the ends of the axes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="110" rx="140" ry="70" fill="#8fb8f0" fill-opacity="0.35" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="110" x2="330" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="30" x2="180" y2="190" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="300" y="126" font-size="12" fill="#1f2a44">minor (I₁)</text>
  <text x="186" y="30" font-size="12" fill="#1f2a44">major (I₂)</text>
  <line x1="180" y1="110" x2="282.6" y2="71.5" stroke="#6c7a93" stroke-width="2.5"/>
  <polygon points="292,68 284.4,76.2 280.8,66.8" fill="#6c7a93"/>
  <text x="232" y="100" font-size="12" fill="#6c7a93">ω</text>
  <line x1="292" y1="68" x2="311.4" y2="38.9" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="317,30.6 315.6,41.7 307.3,36.1" fill="#b4232c"/>
  <text x="322" y="34" font-size="12" fill="#b4232c">H</text>
</svg>
```

Here $\boldsymbol{\omega} = (0.8, 0.3)$ sits $21^\circ$ above the minor axis, but $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} = (0.8, 1.2)$ sits $56^\circ$ above it, leaning toward the major axis — the one with more inertia.
:::

::: context right-handed Right-handed frames
Point your right hand's fingers along the first axis and curl them toward the second. Your thumb points along the third. A frame that obeys this is **right-handed**, and every cross-product formula in physics assumes it. A mirror image of a right-handed frame is left-handed: it looks fine, but $\hat{\mathbf{x}}\times\hat{\mathbf{y}}$ comes out as $-\hat{\mathbf{z}}$. The determinant of the matrix of axes tells them apart: $+1$ for right-handed, $-1$ for left-handed.
:::
