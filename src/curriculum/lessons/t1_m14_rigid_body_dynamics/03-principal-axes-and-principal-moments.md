---
id: l03-principal-axes-and-principal-moments
title: Principal axes and principal moments
minutes: 17
covers:
  - principal axes and principal moments
---

The tensor you assembled in the previous lesson had products of inertia. The bus with a boom-mounted instrument came out with $I_{xz}$ entries of $-19.4\,\mathrm{kg\,m^2}$, and every real vehicle — a satellite with an antenna on one side, a launch vehicle with an asymmetric payload — has them too. Products of inertia are not a property of the body; they are a property of the axes you chose to describe it in. This lesson proves that for any rigid body there is a set of body axes in which every product of inertia vanishes, shows how to find those axes, and names the three diagonal entries that remain.

Those axes are the **principal axes** and the entries are the **principal moments of inertia**. Nearly every result in the rest of this module is stated in them: Euler's equations take their simplest form there, the intermediate axis theorem is a statement about which principal axis you spin about, and a spin-stabilised spacecraft is designed so that its intended spin axis is a principal axis to within a fraction of a degree. A mass-properties report for a flight vehicle always quotes the principal moments and the orientation of the principal frame relative to the structural axes, and the attitude control engineer uses that orientation to decide how much cross-axis coupling the controller must tolerate.

The mathematics is the eigenvalue problem for a real symmetric matrix, which the linear algebra prerequisite covered. Here it acquires a physical meaning, and a physical reason why the answer always exists.

## When is angular momentum parallel to angular velocity?

Lesson 2 established $\mathbf{H}_C = \mathbf{I}\boldsymbol{\omega}$. Because $\mathbf{I}$ is a matrix rather than a number, $\mathbf{H}$ is in general not parallel to $\boldsymbol{\omega}$: the tensor stretches the angular velocity by different amounts along different directions and so rotates it. Ask for the exceptional directions, the unit vectors $\hat{\mathbf{n}}$ for which spinning about $\hat{\mathbf{n}}$ produces angular momentum along $\hat{\mathbf{n}}$:

$$
\mathbf{I}\,\hat{\mathbf{n}} = \lambda\,\hat{\mathbf{n}} .
$$

This is the eigenvalue equation. A direction $\hat{\mathbf{n}}$ that satisfies it is a **principal axis** of the body, and the scalar $\lambda$ is the corresponding **principal moment**. Along a principal axis, $\mathbf{H} = \lambda\boldsymbol{\omega}$ and the relation between spin and angular momentum collapses to the scalar $H = I\omega$ you may have first met for a wheel on a fixed shaft. Off a principal axis, the two vectors point in different directions, and — as lesson 9 shows — the body cannot spin steadily about $\boldsymbol{\omega}$ but must nutate.

Notice what $\lambda$ is physically. Take the dot product of the eigenvalue equation with $\hat{\mathbf{n}}$: $\lambda = \hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}} = I_n$, the moment of inertia about the axis $\hat{\mathbf{n}}$ as defined in lesson 2. A principal moment is an ordinary moment of inertia about a particular axis. It is in $\mathrm{kg\,m^2}$ and it is positive.

## Why three principal axes always exist

The inertia tensor is a real symmetric matrix, and three facts about such matrices carry the whole lesson. Each has a short proof, and each is worth seeing once with the physics attached.

**The eigenvalues are real.** Suppose $\mathbf{I}\mathbf{v} = \lambda\mathbf{v}$ with $\mathbf{v}$ possibly complex. Take the conjugate transpose of the equation and multiply on the right by $\mathbf{v}$, and separately multiply the original on the left by $\bar{\mathbf{v}}^\top$. Both give $\bar{\mathbf{v}}^\top\mathbf{I}\mathbf{v}$ because $\mathbf{I}$ is real and symmetric, so $\bar\lambda\,\bar{\mathbf{v}}^\top\mathbf{v} = \lambda\,\bar{\mathbf{v}}^\top\mathbf{v}$, and since $\bar{\mathbf{v}}^\top\mathbf{v} > 0$ it follows that $\bar\lambda = \lambda$. A real eigenvalue has a real eigenvector, so principal axes are actual directions in the body.

**Eigenvectors of distinct eigenvalues are perpendicular.** If $\mathbf{I}\mathbf{v}_1 = \lambda_1\mathbf{v}_1$ and $\mathbf{I}\mathbf{v}_2 = \lambda_2\mathbf{v}_2$, then $\mathbf{v}_2^\top\mathbf{I}\mathbf{v}_1 = \lambda_1\mathbf{v}_2^\top\mathbf{v}_1$ and also, by symmetry, $\mathbf{v}_2^\top\mathbf{I}\mathbf{v}_1 = (\mathbf{I}\mathbf{v}_2)^\top\mathbf{v}_1 = \lambda_2\mathbf{v}_2^\top\mathbf{v}_1$. Subtracting, $(\lambda_1 - \lambda_2)\,\mathbf{v}_2^\top\mathbf{v}_1 = 0$, so if the eigenvalues differ the eigenvectors are orthogonal. Three distinct principal moments therefore come with three mutually perpendicular principal axes: a right-handed frame, fixed in the body.

**The eigenvalues are positive.** From the first section, $\lambda = \hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}} = \int r_\perp^2\,dm > 0$ for any body that is not a line of mass along $\hat{\mathbf{n}}$.

The characteristic equation $\det(\mathbf{I} - \lambda\mathbf{I}_3) = 0$ is a cubic in $\lambda$, so there are three eigenvalues counted with multiplicity. When all three are distinct, the principal frame is unique up to the signs of its axes. When two coincide the body is **axisymmetric** in the inertial sense — the cylinder of lesson 2, with $\mathrm{diag}(I_t, I_t, I_3)$ — and any pair of perpendicular axes in the plane of the repeated eigenvalue serves as principal. When all three coincide the body is **inertially spherical**, every axis is principal, and $\mathbf{H}$ is parallel to $\boldsymbol{\omega}$ for every spin. A cube of uniform density is inertially spherical: it has three equal principal moments even though it is not round.

::: key Principal axes and principal moments
The principal axes of a rigid body are the eigenvectors of its inertia tensor, and the principal moments $I_1, I_2, I_3$ are the eigenvalues. Because $\mathbf{I}$ is real, symmetric and positive definite, the principal moments are real and positive and the principal axes are mutually perpendicular. In the principal frame $\mathbf{I} = \mathrm{diag}(I_1, I_2, I_3)$ and every product of inertia is zero, so $\mathbf{H}$ is parallel to $\boldsymbol{\omega}$ exactly when $\boldsymbol{\omega}$ lies along a principal axis.
:::

## Diagonalising the tensor

Lesson 2 gave the transformation of the tensor under a change of body axes: with $\mathbf{v}' = \mathbf{R}\mathbf{v}$, $\mathbf{I}' = \mathbf{R}\mathbf{I}\mathbf{R}^\top$. Build $\mathbf{R}$ by stacking the three unit eigenvectors as its **rows**, $\mathbf{R} = [\hat{\mathbf{n}}_1\ \hat{\mathbf{n}}_2\ \hat{\mathbf{n}}_3]^\top$. Then $\mathbf{R}^\top$ has the eigenvectors as columns, $\mathbf{I}\mathbf{R}^\top = \mathbf{R}^\top\mathrm{diag}(I_1, I_2, I_3)$ by the eigenvalue equation applied column by column, and

$$
\mathbf{R}\,\mathbf{I}\,\mathbf{R}^\top = \mathbf{R}\mathbf{R}^\top\,\mathrm{diag}(I_1, I_2, I_3) = \mathrm{diag}(I_1, I_2, I_3),
$$

using the orthonormality of the eigenvectors, $\mathbf{R}\mathbf{R}^\top = \mathbf{I}_3$. The matrix $\mathbf{R}$ takes components from the original body axes to the principal axes, and the row $i$ of $\mathbf{R}$ is the direction of principal axis $i$ written in the original axes. That is the orientation a mass-properties report quotes, usually as three small angles.

Two quantities do not change under this or any rotation and serve as checks. The trace is preserved, $I_{xx} + I_{yy} + I_{zz} = I_1 + I_2 + I_3$, and so is the determinant, $\det\mathbf{I} = I_1 I_2 I_3$. If your computed principal moments fail either test, the eigen-solve is wrong.

### Naming the axes

Order the principal moments and give the axes names by size. The axis with the largest moment is the **major axis**, the smallest is the **minor axis**, and the remaining one is the **intermediate axis**. The rest of this module uses the labels 1, 2, 3 for the principal axes without committing to an order, so that formulas like Euler's equations can be written once and permuted; when an ordering matters, as it does for spin stability, the lesson says which axis is which. The triangle inequality of lesson 2 holds for principal moments too: each is at most the sum of the other two.

The names carry physical meaning you can often read off the shape. Mass far from an axis raises the moment about it. A long slender body — a launch vehicle stage, Explorer 1, a pencil — has its minor axis along its length and two nearly equal major moments across it; such a body is called **prolate**. A flat body — a disc, a wheel, a squat cylinder wider than it is tall — has its major axis along the symmetry axis and is called **oblate**. A three-axis-stabilised communications bus, roughly a box with unequal sides, has three distinct moments, and its principal axes lie close to the structural axes only if the layout is nearly symmetric.

### The two-dimensional case by hand

When only one product of inertia is non-zero, the eigenvalue problem reduces to a $2\times 2$ block and can be solved without a computer. Take a tensor with entries $a = I_{xx}$, $b = I_{zz}$ and off-diagonal entry $c$ in the $xz$ positions (so $c = -I_{xz}$ in the notation of lesson 2), with the $y$ axis already principal. The characteristic equation of the block is $(a - \lambda)(b - \lambda) - c^2 = 0$, whose roots are

$$
\lambda_\pm = \frac{a + b}{2} \pm \sqrt{\left(\frac{a - b}{2}\right)^2 + c^2}.
$$

The product of inertia always pushes the two principal moments apart: the larger one grows and the smaller one shrinks, by amounts that depend on $c^2$. The eigenvector for $\lambda_-$ makes an angle $\theta$ with the $x$ axis, measured toward $z$, where from the first row of $(\mathbf{I} - \lambda_-\mathbf{I}_3)\hat{\mathbf{n}} = 0$,

$$
\tan\theta = \frac{\lambda_- - a}{c},
\qquad\text{equivalently}\qquad
\tan 2\theta = \frac{2c}{a - b}.
$$

The $\tan 2\theta$ form comes from rotating the $xz$ axes by $\theta$ and demanding that the new off-diagonal entry vanish; both forms give the same angle, and the second is the one to remember, because it shows that the tilt is large when $a$ and $b$ are close and small when they are far apart.

::: example Principal axes of the bus with a boom
Lesson 2 assembled a 600 kg cylindrical bus with a 20 kg instrument on a boom at $(2.5, 0, 0.4)\,\mathrm{m}$ and found, about the assembly centre of mass,

$$
\mathbf{I}_C = \begin{bmatrix} 211.6 & 0 & -19.4 \\ 0 & 332.6 & 0 \\ -19.4 & 0 & 313.0 \end{bmatrix}\mathrm{kg\,m^2}.
$$

The $y$ axis is already principal with $I_y = 332.6\,\mathrm{kg\,m^2}$: its row and column have no off-diagonal entries. For the $xz$ block, $a = 211.6$, $b = 313.0$, $c = -19.4$. The mean is $(a + b)/2 = 262.3$ and the half-difference $(a - b)/2 = -50.7$, so

$$
\lambda_\pm = 262.3 \pm \sqrt{50.7^2 + 19.4^2} = 262.3 \pm 54.3 ,
$$

giving principal moments $208.0$ and $316.6\,\mathrm{kg\,m^2}$. Check the trace: $208.0 + 316.6 + 332.6 = 857.2$, and $211.6 + 332.6 + 313.0 = 857.2$. The angle follows from $\tan 2\theta = 2c/(a - b) = -38.8/(-101.4) = 0.383$, so $2\theta = 20.9^\circ$ and $\theta = 10.5^\circ$. Confirm with the other form: $\tan\theta = (208.0 - 211.6)/(-19.4) = 0.186$, and $\arctan 0.186 = 10.5^\circ$.

So the minor axis, with $I_1 = 208.0\,\mathrm{kg\,m^2}$, lies in the $xz$ plane tilted $10.5^\circ$ from body $x$ toward $+z$: as a unit vector, $(0.983, 0, 0.182)$. The intermediate axis, $I_2 = 316.6$, is perpendicular to it in the same plane, $(-0.182, 0, 0.983)$, and the major axis is body $y$ with $I_3 = 332.6$. Ordered by size: $208.0 < 316.6 < 332.6$.

The tilt has a physical reading. The instrument sits at $(2.419, 0, 0.387)\,\mathrm{m}$ from the centre of mass, a direction $9.1^\circ$ above the $x$ axis. Twenty kilograms at 2.4 m dominates the inertia of this assembly, and the axis of least inertia is the one that passes closest to that mass — so the minor axis swings toward the boom, landing at $10.5^\circ$. If this spacecraft were meant to roll steadily about body $x$, it would in fact nutate, because body $x$ is not principal; either the boom is rebalanced or the controller commands a spin about $(0.983, 0, 0.182)$ instead.
:::

::: example A communications bus with an off-centre tank
A bus has principal moments $\mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ in its structural axes before a 40 kg tank is added at $(0.6, 0.9, 0)\,\mathrm{m}$ from the centre of mass (treat the tank as a point mass and ignore the small shift of the centre of mass). With $\lVert\mathbf{d}\rVert^2 = 0.36 + 0.81 = 1.17\,\mathrm{m^2}$, the parallel axis term is

$$
40\begin{bmatrix} 1.17 - 0.36 & -0.54 & 0 \\ -0.54 & 1.17 - 0.81 & 0 \\ 0 & 0 & 1.17 \end{bmatrix}
= \begin{bmatrix} 32.4 & -21.6 & 0 \\ -21.6 & 14.4 & 0 \\ 0 & 0 & 46.8 \end{bmatrix}\mathrm{kg\,m^2},
$$

so the new tensor is

$$
\mathbf{I} = \begin{bmatrix} 1232.4 & -21.6 & 0 \\ -21.6 & 1514.4 & 0 \\ 0 & 0 & 2046.8 \end{bmatrix}\mathrm{kg\,m^2}.
$$

The $z$ axis remains principal with $I_z = 2046.8$. In the $xy$ block, $a = 1232.4$, $b = 1514.4$, $c = -21.6$: mean $1373.4$, half-difference $-141.0$, and $\sqrt{141.0^2 + 21.6^2} = 142.6$. The principal moments are $1230.8$ and $1516.0\,\mathrm{kg\,m^2}$, and $\tan 2\theta = -43.2/(-282.0) = 0.153$ gives $\theta = 4.35^\circ$. The minor axis is rotated $4.35^\circ$ from body $x$ toward $+y$, again toward the added mass.

Compare the two effects. The product of inertia of $21.6\,\mathrm{kg\,m^2}$ is under two per cent of the smallest moment, yet it turns the principal frame by more than four degrees, because the two moments it couples are only $282\,\mathrm{kg\,m^2}$ apart. The same product on a body whose moments differed by thousands would tilt the axes by a fraction of a degree. On the diagonal the effect is tiny: $1230.8$ instead of $1232.4$. The tilt of the axes, not the shift in the moments, is what the attitude controller notices.
:::

## The inertia ellipsoid

There is a picture of the tensor that will be used again in lesson 6. The moment of inertia about a unit direction $\hat{\mathbf{n}}$ is the quadratic form $I_n = \hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}}$. Now consider the set of vectors $\mathbf{x}$ satisfying

$$
\mathbf{x}^\top\mathbf{I}\,\mathbf{x} = 1 .
$$

Because $\mathbf{I}$ is positive definite this is an ellipsoid centred at the origin, the **inertia ellipsoid** of the body. In principal axes it reads $I_1x_1^2 + I_2x_2^2 + I_3x_3^2 = 1$, so its semi-axes lie along the principal axes with lengths $1/\sqrt{I_1}$, $1/\sqrt{I_2}$, $1/\sqrt{I_3}$: the ellipsoid is longest along the minor axis and shortest along the major axis. For a direction $\hat{\mathbf{n}}$, the point of the ellipsoid along $\hat{\mathbf{n}}$ is at distance $1/\sqrt{I_n}$. A prolate body has a prolate inertia ellipsoid in the opposite sense — long where the body is thin — which is a source of confusion worth noting once and then forgetting.

The ellipsoid makes the diagonalisation geometric. Finding the principal axes is finding the symmetry axes of this ellipsoid, and a product of inertia is the statement that the body axes are not aligned with them. The gradient of the quadratic form at $\mathbf{x}$ is $2\mathbf{I}\mathbf{x}$, proportional to $\mathbf{H}$ when $\mathbf{x}$ is taken along $\boldsymbol{\omega}$. So the normal to the inertia ellipsoid at the point where $\boldsymbol{\omega}$ pierces it is the direction of $\mathbf{H}$, and $\mathbf{H}$ and $\boldsymbol{\omega}$ are parallel exactly where the normal is radial — at the ends of the semi-axes, the principal axes. That fact is the geometric core of the torque-free motion in lesson 6.

## Computing principal axes in code

For a general tensor with three products of inertia, solve the eigenvalue problem numerically. For a symmetric matrix use a symmetric solver: it returns real eigenvalues in ascending order and an orthonormal set of eigenvectors as columns.

```python
import numpy as np

I = np.array([[211.6, 0.0, -19.4],
              [0.0, 332.6, 0.0],
              [-19.4, 0.0, 313.0]])

moments, axes = np.linalg.eigh(I)     # ascending eigenvalues, columns are axes
if np.linalg.det(axes) < 0:           # keep the principal frame right-handed
    axes[:, 2] *= -1
R = axes.T                            # rows: principal axes in body coordinates
print(np.round(moments, 1))           # [208.  316.6 332.6]
print(np.round(R @ I @ R.T, 6))       # diagonal, off-diagonals ~1e-14
print(np.round(np.degrees(np.arctan2(R[0, 2], R[0, 0])), 2))   # 10.47
```

Three things to check every time. The eigenvectors returned by a solver have arbitrary sign, so the frame they form may be left-handed; flip one axis if the determinant is $-1$, or the principal frame will contain a reflection and every rotation built on it will be wrong. Sort the moments and their axes together, never separately. And confirm $\mathbf{R}\mathbf{I}\mathbf{R}^\top$ is diagonal to numerical precision — a cheap test that catches a transposed $\mathbf{R}$, which is the commonest error.

::: warning Principal axes are directions, not vectors, and are not always unique
An eigenvector solver may return $\hat{\mathbf{n}}$ or $-\hat{\mathbf{n}}$; both are the same principal axis, and the physics does not distinguish them, but the frame you build from them must still be right-handed. When two principal moments are equal or nearly equal, the solver's choice of axes within their plane is arbitrary and can jump between runs with tiny changes in the tensor. A nearly axisymmetric spinner's transverse principal axes are therefore not a reliable thing to align hardware to — only the spin axis is well defined.
:::

::: warning The rotation goes one way
Rows of $\mathbf{R}$ are principal axes written in body coordinates, and $\mathbf{R}$ maps body components to principal components: $\boldsymbol{\omega}_{\mathrm{prin}} = \mathbf{R}\,\boldsymbol{\omega}_{\mathrm{body}}$. Using $\mathbf{R}^\top$ where $\mathbf{R}$ belongs produces a tensor that is not diagonal, which is easy to notice, but it also silently transforms gyro measurements into the wrong frame in a simulation, which is not. Test the convention on a tensor whose answer you know before using it on one you do not.
:::

::: note Degenerate moments in real vehicles
Spin-stabilised spacecraft are deliberately built close to axisymmetric, so two of their principal moments are nearly equal and the axisymmetric form $\mathrm{diag}(I_t, I_t, I_3)$ of lesson 2 applies. Lessons 9 and 10 exploit this to solve the equations of motion in closed form. Three-axis-stabilised spacecraft, by contrast, usually have three distinct moments and a principal frame a few degrees from the structural frame; their controllers are designed in the structural frame and treat the products of inertia as a known coupling.
:::

## Check yourself

::: check
A body has $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ in its body axes. Name the major, intermediate and minor axes, and state whether the body is closer to prolate or oblate.
:::

::: answer
The tensor is already diagonal, so the body axes are principal. The largest moment, $2000\,\mathrm{kg\,m^2}$ about $z$, marks $z$ as the major axis; $x$ with $1200$ is the minor axis; $y$ with $1500$ is intermediate. With three distinct moments the body is neither exactly prolate nor oblate. The two smaller moments are closer to each other ($1200$ and $1500$) than either is to the largest, so it is nearer an oblate body — a squat shape with its symmetry axis along $z$ — than a slender one.
:::

::: check
Show that if a body has a plane of symmetry, the axis perpendicular to that plane is a principal axis.
:::

::: answer
Take the symmetry plane to be $z = 0$ and the axis in question to be $z$. Lesson 2 showed that products of inertia involving an axis vanish when the body is symmetric under reflection through a plane containing that axis — but here use the mirror directly: for every mass element at $(x, y, z)$ there is one at $(x, y, -z)$, so $I_{xz} = \int xz\,dm$ and $I_{yz} = \int yz\,dm$ both vanish by cancellation. The third row and column of the tensor are then $(0, 0, I_{zz})$, so $\mathbf{I}\hat{\mathbf{z}} = I_{zz}\hat{\mathbf{z}}$ and $\hat{\mathbf{z}}$ is an eigenvector. The other two principal axes lie in the symmetry plane but need not coincide with $x$ and $y$, because $I_{xy}$ can still be non-zero.
:::

::: check
A tensor has $I_{xx} = 500$, $I_{yy} = 500$ and an off-diagonal $xy$ entry of $-100\,\mathrm{kg\,m^2}$, with $z$ principal. Find the principal moments in the $xy$ plane and the orientation of the principal axes.
:::

::: answer
With $a = b = 500$ and $c = -100$, the principal moments are $\lambda_\pm = 500 \pm \sqrt{0 + 100^2} = 400$ and $600\,\mathrm{kg\,m^2}$. The angle comes from $\tan 2\theta = 2c/(a - b)$, whose denominator is zero, so $2\theta = \pm 90^\circ$ and $\theta = \pm 45^\circ$: the principal axes bisect the body axes. Use $\tan\theta = (\lambda_- - a)/c = (400 - 500)/(-100) = 1$ to place the minor axis ($400$) at $\theta = +45^\circ$, along $(1, 1, 0)/\sqrt{2}$, and the axis with $600$ along $(-1, 1, 0)/\sqrt{2}$. Equal diagonal entries with any coupling at all give the maximum possible tilt, which is the extreme case of the rule that close moments mean large tilts.
:::

::: check
Two solvers return the principal axes of the same tensor as the rows of $\mathbf{R}_a$ and $\mathbf{R}_b$, with $\det\mathbf{R}_a = +1$ and $\det\mathbf{R}_b = -1$. Are they describing different principal axes? Which should you use to build a principal frame?
:::

::: answer
They describe the same axes: an eigenvector is defined only up to sign, and $\mathbf{R}_b$ differs from $\mathbf{R}_a$ by the sign of one or three of its rows. But $\mathbf{R}_b$ is a reflection, not a rotation, so a frame built from it is left-handed and the cross product rules used in every rigid-body formula fail in it — angular velocities composed in that frame come out with the wrong sign. Use $\mathbf{R}_a$, or flip one row of $\mathbf{R}_b$ to make its determinant $+1$. Always test the determinant before trusting a computed principal frame.
:::

::: check
Without solving an eigenvalue problem, what are the principal moments of a uniform solid cube of mass $m$ and side $a$ about its centre, and what does that imply for $\mathbf{H}$ when it spins about a diagonal through two opposite corners?
:::

::: answer
From the box formula in lesson 2 with all sides equal, $I_{xx} = I_{yy} = I_{zz} = \tfrac{1}{12}m(a^2 + a^2) = \tfrac{1}{6}ma^2$, and the coordinate planes are planes of symmetry so every product of inertia is zero. The tensor is $\tfrac{1}{6}ma^2\,\mathbf{I}_3$: all three principal moments are equal and the cube is inertially spherical. Every direction is then a principal axis, including the body diagonal, so $\mathbf{H} = \tfrac{1}{6}ma^2\,\boldsymbol{\omega}$ is exactly parallel to $\boldsymbol{\omega}$ and the cube spins steadily about any axis without nutation.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{I}\hat{\mathbf{n}} = \lambda\hat{\mathbf{n}}$ | Eigenvalue equation; $\hat{\mathbf{n}}$ is a principal axis, $\lambda = I_n$ a principal moment |
| $I_1, I_2, I_3$ | Principal moments: real, positive, eigenvalues of $\mathbf{I}$; sum equals the trace, product equals the determinant |
| Major, intermediate, minor axis | Principal axes of largest, middle and smallest moment |
| Prolate, oblate | Slender body, minor axis along the length; flat body, major axis along the symmetry axis |
| $\mathbf{R}\mathbf{I}\mathbf{R}^\top = \mathrm{diag}(I_1, I_2, I_3)$ | Diagonalisation; rows of $\mathbf{R}$ are the principal axes in body coordinates |
| $\lambda_\pm = \tfrac{a + b}{2} \pm \sqrt{\left(\tfrac{a - b}{2}\right)^2 + c^2}$ | Principal moments of a $2\times 2$ block with diagonal $a, b$ and off-diagonal $c$ |
| $\tan 2\theta = 2c/(a - b)$ | Tilt of the principal axes from the body axes in that plane |
| $\mathbf{x}^\top\mathbf{I}\mathbf{x} = 1$ | Inertia ellipsoid; semi-axes $1/\sqrt{I_k}$ along the principal axes; its normal at $\boldsymbol{\omega}$ is along $\mathbf{H}$ |
| Bus with boom | $208.0, 316.6, 332.6\,\mathrm{kg\,m^2}$; minor axis $10.5^\circ$ from body $x$ toward the boom |

The next lesson takes $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ seriously as a vector equation: how far $\mathbf{H}$ is rotated away from $\boldsymbol{\omega}$ off a principal axis, what the rotational kinetic energy is, and why both matter before the equations of motion are written down.
