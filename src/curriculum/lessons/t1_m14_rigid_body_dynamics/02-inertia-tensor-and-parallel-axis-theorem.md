---
id: l02-inertia-tensor-and-parallel-axis-theorem
title: The inertia tensor and the parallel axis theorem
minutes: 20
covers:
  - the moment of inertia tensor, products of inertia, parallel axis theorem
---

Mass is the resistance of a body to being accelerated. For rotation the corresponding quantity depends on the axis: a launch vehicle stage is easy to roll about its long axis and very hard to pitch, by a factor of nearly a hundred, because pitching moves the mass at the ends of a 40 m tube while rolling only moves it around a 1.8 m radius. One number cannot describe that. The object that does is the **inertia tensor**, a symmetric $3\times 3$ matrix that turns the angular velocity of a rigid body into its angular momentum and its rotational kinetic energy.

A GNC engineer meets this matrix constantly. The attitude controller's gains are scaled by it. The torque a reaction wheel must supply for a given slew is proportional to it. The gyroscopic coupling between axes, the subject of Euler's equations later in this module, is driven by the differences between its diagonal entries. On a launch vehicle it changes by an order of magnitude between lift-off and burnout as propellant leaves, and the control system must track that change. On a spacecraft it is assembled, component by component, from the tensors of the bus, tanks, arrays and instruments, each moved to the common centre of mass with the parallel axis theorem — which is the calculation this lesson teaches.

## From angular momentum to the inertia tensor

Lesson 1 gave the velocity of a material point $P$ of a rigid body as $\mathbf{v}_P = \mathbf{v}_C + \boldsymbol{\omega}\times\boldsymbol{\rho}$, with $\boldsymbol{\rho}$ the body-fixed vector from the centre of mass $C$ to $P$. The previous module defined the angular momentum of a system of particles about its centre of mass as the sum over mass elements of position crossed with momentum. For a rigid body the sum becomes an integral over mass elements $dm$, and the centre-of-mass part of the velocity contributes nothing, because $\int\boldsymbol{\rho}\,dm = 0$ by the definition of $C$. What remains is

$$
\mathbf{H}_C = \int \boldsymbol{\rho}\times(\boldsymbol{\omega}\times\boldsymbol{\rho})\,dm .
$$

Expand the triple product with the identity $\mathbf{a}\times(\mathbf{b}\times\mathbf{c}) = \mathbf{b}(\mathbf{a}\cdot\mathbf{c}) - \mathbf{c}(\mathbf{a}\cdot\mathbf{b})$:

$$
\boldsymbol{\rho}\times(\boldsymbol{\omega}\times\boldsymbol{\rho}) = \boldsymbol{\omega}\,(\boldsymbol{\rho}\cdot\boldsymbol{\rho}) - \boldsymbol{\rho}\,(\boldsymbol{\rho}\cdot\boldsymbol{\omega}) = \bigl(\lVert\boldsymbol{\rho}\rVert^2\,\mathbf{I}_3 - \boldsymbol{\rho}\boldsymbol{\rho}^\top\bigr)\boldsymbol{\omega} .
$$

The angular velocity is the same for every mass element, so it comes outside the integral:

$$
\mathbf{H}_C = \mathbf{I}\,\boldsymbol{\omega},
\qquad
\mathbf{I} = \int\bigl(\lVert\mathbf{r}\rVert^2\,\mathbf{I}_3 - \mathbf{r}\mathbf{r}^\top\bigr)\,dm .
$$

This is the **inertia tensor** about the reference point from which $\mathbf{r}$ is measured — the centre of mass, unless stated otherwise. In index form, with $\delta_{ij}$ the Kronecker delta (1 when $i = j$, 0 otherwise),

$$
I_{ij} = \int\bigl(\lVert\mathbf{r}\rVert^2\,\delta_{ij} - r_i r_j\bigr)\,dm .
$$

Written out in body axes $x, y, z$:

$$
\mathbf{I} =
\begin{bmatrix}
\int (y^2 + z^2)\,dm & -\int xy\,dm & -\int xz\,dm \\
-\int xy\,dm & \int (x^2 + z^2)\,dm & -\int yz\,dm \\
-\int xz\,dm & -\int yz\,dm & \int (x^2 + y^2)\,dm
\end{bmatrix}
=
\begin{bmatrix}
I_{xx} & -I_{xy} & -I_{xz} \\
-I_{xy} & I_{yy} & -I_{yz} \\
-I_{xz} & -I_{yz} & I_{zz}
\end{bmatrix}.
$$

The diagonal entries are the **moments of inertia** about the three axes. Each is the integral of the squared perpendicular distance from that axis, so each is positive for any real body. The off-diagonal entries are the negatives of the **products of inertia**, $I_{xy} = \int xy\,dm$ and its two companions. A product of inertia measures how the mass distribution is skewed between two axes: it is zero when the body is symmetric under reflection through the plane containing either axis, because every element at $(x, y, z)$ then has a partner at $(x, -y, z)$ whose contribution to $\int xy\,dm$ cancels it.

The units are $\mathrm{kg\,m^2}$. Three properties hold for any body:

- **Symmetric.** $I_{ij} = I_{ji}$ from the definition, so $\mathbf{I} = \mathbf{I}^\top$. That is what makes the next lesson possible.
- **Positive definite.** For any unit vector $\hat{\mathbf{n}}$, $\hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}} = \int\bigl(\lVert\mathbf{r}\rVert^2 - (\mathbf{r}\cdot\hat{\mathbf{n}})^2\bigr)dm = \int r_\perp^2\,dm$, the integral of the squared distance from the axis $\hat{\mathbf{n}}$. This is the moment of inertia about that axis, $I_n$, and it is positive unless all the mass lies on the axis itself.
- **Frame dependent.** The entries are components, and they change when you change the body axes or the reference point. The tensor describes one physical object, but the numbers in it belong to a frame, as the last two sections of this lesson make precise.

There is a compact way to write the same thing with the cross-product matrix from linear algebra. Since $[\mathbf{r}\times]\mathbf{v} = \mathbf{r}\times\mathbf{v}$ and $[\mathbf{r}\times]^\top = -[\mathbf{r}\times]$, the triple product is $\mathbf{r}\times(\boldsymbol{\omega}\times\mathbf{r}) = -[\mathbf{r}\times][\mathbf{r}\times]\boldsymbol{\omega} = [\mathbf{r}\times]^\top[\mathbf{r}\times]\boldsymbol{\omega}$, so

$$
\mathbf{I} = \int [\mathbf{r}\times]^\top[\mathbf{r}\times]\,dm .
$$

Multiplying out $[\mathbf{r}\times]^\top[\mathbf{r}\times]$ for one entry reproduces $\lVert\mathbf{r}\rVert^2\delta_{ij} - r_ir_j$, and the form makes symmetry and positive semidefiniteness obvious, since $\mathbf{A}^\top\mathbf{A}$ has both properties for any $\mathbf{A}$.

::: key The inertia tensor
$\mathbf{I} = \int\bigl(\lVert\mathbf{r}\rVert^2\,\mathbf{I}_3 - \mathbf{r}\mathbf{r}^\top\bigr)\,dm$, that is $I_{ij} = \int\bigl(\lVert\mathbf{r}\rVert^2\,\delta_{ij} - r_ir_j\bigr)\,dm$, with $\mathbf{r}$ measured from the reference point. It is symmetric, positive definite, and frame dependent. Its diagonal entries are moments of inertia about the axes; its off-diagonal entries are minus the products of inertia $I_{xy} = \int xy\,dm$, which vanish for axes lying in a plane of symmetry.
:::

::: warning Sign of the products of inertia
Some references define the products of inertia as the off-diagonal entries themselves, so that their $I_{xy}$ is the negative of the one used here. Either convention gives the same matrix once written out. When you read a mass-properties report, check whether the numbers quoted as "products of inertia" are the integrals $\int xy\,dm$ or the matrix entries, and check the sign convention of any software that assembles the tensor from them. A sign error here turns into a spurious coupling torque in every simulation downstream.
:::

## Typical magnitudes and the triangle inequality

The moment of inertia about an axis scales as mass times the square of a characteristic size, so it spans an enormous range. A 3U CubeSat of 4 kg and 30 cm length has moments of order $0.05\,\mathrm{kg\,m^2}$. A one-tonne communications bus is in the range $1{,}000$ to $2{,}000\,\mathrm{kg\,m^2}$; this module's running example uses $\mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$. The International Space Station is of order $10^8\,\mathrm{kg\,m^2}$, because its 420 tonnes are spread over a 100 m truss. A loaded first stage, computed in the first example below, has a transverse moment near $6\times 10^7\,\mathrm{kg\,m^2}$ and an axial moment two orders of magnitude smaller.

The diagonal entries also obey a constraint you can use to catch errors. From the definitions,

$$
I_{xx} + I_{yy} = \int (x^2 + y^2 + 2z^2)\,dm \;\ge\; \int (x^2 + y^2)\,dm = I_{zz},
$$

and likewise for the other two pairs. Any pair of moments must sum to at least the third; equality holds only for a body that is flat in the plane of the two axes, like a thin plate, for which $\int z^2\,dm = 0$. A reported tensor with $I_{zz} > I_{xx} + I_{yy}$ describes no physical body.

## Standard shapes

Every real vehicle is assembled from parts that are close to a few standard shapes, each with a tensor you can write down in axes aligned to its symmetry. For a uniform thin rod of mass $m$ and length $L$ along $x$, the axis is a line of symmetry, so every product of inertia is zero and $I_{xx} = 0$ for a rod of negligible thickness. About the transverse axes, with mass per unit length $m/L$,

$$
I_{yy} = I_{zz} = \int_{-L/2}^{L/2} x^2\,\frac{m}{L}\,dx = \frac{m}{L}\left[\frac{x^3}{3}\right]_{-L/2}^{L/2} = \frac{mL^2}{12}.
$$

The others follow by the same route, integrating the squared distance from the axis over the body. All are about the centre of mass, in axes along the body's symmetry directions, and all have zero products of inertia.

| Body (mass $m$) | Moments of inertia about the centre of mass |
| --- | --- |
| Thin rod, length $L$ along $x$ | $I_{xx} = 0$, $I_{yy} = I_{zz} = \tfrac{1}{12}mL^2$ |
| Solid cylinder, radius $R$, length $L$ along $z$ | $I_{zz} = \tfrac{1}{2}mR^2$, $I_{xx} = I_{yy} = \tfrac{1}{12}m(3R^2 + L^2)$ |
| Thin-walled cylinder, radius $R$, length $L$ along $z$ | $I_{zz} = mR^2$, $I_{xx} = I_{yy} = \tfrac{1}{2}mR^2 + \tfrac{1}{12}mL^2$ |
| Solid sphere, radius $R$ | $I_{xx} = I_{yy} = I_{zz} = \tfrac{2}{5}mR^2$ |
| Thin spherical shell, radius $R$ | $I_{xx} = I_{yy} = I_{zz} = \tfrac{2}{3}mR^2$ |
| Rectangular box, sides $a, b, c$ along $x, y, z$ | $I_{xx} = \tfrac{1}{12}m(b^2 + c^2)$ and cyclic permutations |
| Thin plate, sides $a$ along $x$, $b$ along $y$ | $I_{xx} = \tfrac{1}{12}mb^2$, $I_{yy} = \tfrac{1}{12}ma^2$, $I_{zz} = \tfrac{1}{12}m(a^2 + b^2)$ |

The plate is the box with $c \to 0$, and it saturates the triangle inequality: $I_{zz} = I_{xx} + I_{yy}$ exactly.

::: example A first stage as a cylinder, full and empty
Model a Falcon 9 first stage as a uniform solid cylinder of mass $m = 420{,}000\,\mathrm{kg}$ (loaded), radius $R = 1.83\,\mathrm{m}$ and length $L = 41.0\,\mathrm{m}$, with $z$ along the vehicle axis. The axial moment is

$$
I_{zz} = \tfrac{1}{2}mR^2 = 0.5\times 420{,}000\times 1.83^2 = 7.03\times 10^5\,\mathrm{kg\,m^2},
$$

and the transverse moment is

$$
I_{xx} = I_{yy} = \tfrac{1}{12}m(3R^2 + L^2) = \tfrac{1}{12}\times 420{,}000\times(3\times 1.83^2 + 41.0^2) = 5.92\times 10^7\,\mathrm{kg\,m^2}.
$$

The ratio is 84: pitching this vehicle takes 84 times the angular momentum that rolling it does at the same rate, which is why roll control on a launch vehicle is a small-thruster job while pitch needs the gimballed main engines.

Near burnout, treat the nearly empty stage as a thin-walled cylinder of $m = 25{,}000\,\mathrm{kg}$ with the same dimensions. Then $I_{zz} = mR^2 = 25{,}000\times 1.83^2 = 8.37\times 10^4\,\mathrm{kg\,m^2}$ and $I_{xx} = \tfrac{1}{2}mR^2 + \tfrac{1}{12}mL^2 = 4.19\times 10^4 + 3.50\times 10^6 = 3.54\times 10^6\,\mathrm{kg\,m^2}$. The transverse moment has fallen by a factor of 17 during the burn. A pitch controller with fixed gains would have its bandwidth rise by the square root of that factor, into the range of the vehicle's bending modes, which is one of several reasons launch vehicle controllers are gain-scheduled against propellant load.
:::

## The parallel axis theorem

The table gives tensors about each part's own centre of mass. To combine parts into one vehicle you need every tensor about the same point — the vehicle's centre of mass — and that means moving each one. Let the body's centre of mass be $C$ and let $P$ be another point, with $\mathbf{d}$ the vector from $C$ to $P$. A mass element at $\mathbf{r}'$ relative to $C$ sits at $\mathbf{r} = \mathbf{r}' - \mathbf{d}$ relative to $P$. Substitute into the definition:

$$
\mathbf{I}_P = \int\bigl(\lVert\mathbf{r}' - \mathbf{d}\rVert^2\,\mathbf{I}_3 - (\mathbf{r}' - \mathbf{d})(\mathbf{r}' - \mathbf{d})^\top\bigr)\,dm .
$$

Expand. The terms quadratic in $\mathbf{r}'$ integrate to $\mathbf{I}_C$. The terms quadratic in $\mathbf{d}$ are constant over the body and integrate to $m\bigl(\lVert\mathbf{d}\rVert^2\,\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top\bigr)$. The cross terms are all linear in $\mathbf{r}'$ — they are $-2(\mathbf{r}'\cdot\mathbf{d})\mathbf{I}_3 + \mathbf{r}'\mathbf{d}^\top + \mathbf{d}\mathbf{r}'^\top$ — and every one of them contains $\int\mathbf{r}'\,dm$, which is zero because $\mathbf{r}'$ is measured from the centre of mass. So

$$
\mathbf{I}_P = \mathbf{I}_C + m\bigl(\lVert\mathbf{d}\rVert^2\,\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top\bigr).
$$

This is the **parallel axis theorem** in tensor form. The correction is exactly the inertia tensor of a point mass $m$ located at $\mathbf{d}$: moving the reference point away from the centre of mass adds the inertia the whole body would have if it were concentrated at its centre of mass. For a single diagonal entry it reads $I_{P,xx} = I_{C,xx} + m(d_y^2 + d_z^2)$, the scalar form you may have seen; the tensor form also produces off-diagonal terms $-m\,d_xd_y$, which is how products of inertia arise in an assembly of symmetric parts that are mounted off-centre.

Two things about the theorem matter in practice. First, it is one-directional: the cross terms vanish only because one of the two points is the centre of mass. To move a tensor from a point $P$ to another point $Q$, neither of them the centre of mass, go through $C$: subtract the correction for $P$, then add the correction for $Q$. Second, since the added term is positive semidefinite, the moment of inertia about any axis is smallest when that axis passes through the centre of mass.

::: key The parallel axis theorem
$\mathbf{I}_P = \mathbf{I}_C + m\bigl(\lVert\mathbf{d}\rVert^2\,\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top\bigr)$, where $\mathbf{d}$ is the vector from the centre of mass to the new reference point $P$. The correction is the tensor of a point mass $m$ at $\mathbf{d}$. It applies only between the centre of mass and another point; to go between two arbitrary points, pass through the centre of mass.
:::

::: example A point mass moved off-centre
A 30 kg avionics box, small enough to treat as a point mass, is mounted at $\mathbf{d} = (0.5, 0.8, 0)\,\mathrm{m}$ from a spacecraft's centre of mass. Its own tensor about its own centre is negligible, so its contribution to the vehicle tensor is the parallel-axis term alone. With $\lVert\mathbf{d}\rVert^2 = 0.25 + 0.64 = 0.89\,\mathrm{m^2}$,

$$
m\bigl(\lVert\mathbf{d}\rVert^2\,\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top\bigr)
= 30\begin{bmatrix} 0.89 - 0.25 & -0.40 & 0 \\ -0.40 & 0.89 - 0.64 & 0 \\ 0 & 0 & 0.89 \end{bmatrix}
= \begin{bmatrix} 19.2 & -12.0 & 0 \\ -12.0 & 7.5 & 0 \\ 0 & 0 & 26.7 \end{bmatrix}\mathrm{kg\,m^2}.
$$

Read the entries. About $z$, the box is $\sqrt{0.89} = 0.943\,\mathrm{m}$ from the axis and contributes $30\times 0.89 = 26.7\,\mathrm{kg\,m^2}$. About $x$ it is only $0.8\,\mathrm{m}$ away, giving $30\times 0.64 = 19.2$. The product of inertia $I_{xy} = 30\times 0.5\times 0.8 = 12.0\,\mathrm{kg\,m^2}$ appears because the box sits in the first quadrant of the $xy$ plane; a second identical box at $(0.5, -0.8, 0)$ would cancel it, restoring the symmetry. The triangle inequality holds with equality, $19.2 + 7.5 = 26.7$, as it must for a mass distribution that is flat in the $xy$ plane.
:::

## Assembling a vehicle

The procedure for a whole spacecraft has four steps, and the module's inertia-tensor exercise asks you to carry it out on a bus with two arrays and a tank.

1. Write the tensor of each component about its own centre of mass, in the vehicle's body axes. If the component is aligned with those axes, the table applies directly; if not, rotate it as described in the last section.
2. Find the assembly's centre of mass as the mass-weighted mean of the component centres, using the additivity property from the previous module.
3. Move each component's tensor to the assembly centre of mass with the parallel axis theorem, using $\mathbf{d}_k$ from the assembly centre of mass to component $k$'s centre. (The theorem was stated with $\mathbf{d}$ from the body's centre of mass to $P$; here component $k$'s own centre plays the role of $C$ and the assembly centre plays $P$, and since only $\lVert\mathbf{d}\rVert^2$ and $\mathbf{d}\mathbf{d}^\top$ appear, the sign of $\mathbf{d}$ does not matter.)
4. Sum. The integral defining $\mathbf{I}$ is additive over disjoint pieces of the body, so the vehicle tensor is the sum of the moved component tensors.

::: example A bus with a boom-mounted instrument
A spacecraft bus is a uniform solid cylinder of $m_b = 600\,\mathrm{kg}$, radius $0.8\,\mathrm{m}$ and length $1.5\,\mathrm{m}$, axis along body $z$, centred at the body origin. An instrument of $m_i = 20\,\mathrm{kg}$, treated as a point mass, sits on a boom at $\mathbf{r}_i = (2.5, 0, 0.4)\,\mathrm{m}$.

Step 1. From the table, the bus about its own centre has $I_{zz} = 0.5\times 600\times 0.8^2 = 192\,\mathrm{kg\,m^2}$ and $I_{xx} = I_{yy} = \tfrac{1}{12}\times 600\times(3\times 0.64 + 2.25) = 208.5\,\mathrm{kg\,m^2}$, with no products of inertia.

Step 2. The assembly centre of mass is $\mathbf{r}_C = (20\times\mathbf{r}_i)/620 = (0.0806, 0, 0.0129)\,\mathrm{m}$. The instrument is light, but the offset is not negligible.

Step 3. The bus centre is at $\mathbf{d}_b = -\mathbf{r}_C = (-0.0806, 0, -0.0129)\,\mathrm{m}$ from the assembly centre, and the instrument at $\mathbf{d}_i = \mathbf{r}_i - \mathbf{r}_C = (2.419, 0, 0.387)\,\mathrm{m}$. For the instrument, $\lVert\mathbf{d}_i\rVert^2 = 5.853 + 0.150 = 6.003\,\mathrm{m^2}$, and its moved tensor is

$$
20\begin{bmatrix} 6.003 - 5.853 & 0 & -2.419\times 0.387 \\ 0 & 6.003 & 0 \\ -2.419\times 0.387 & 0 & 6.003 - 0.150 \end{bmatrix}
= \begin{bmatrix} 3.0 & 0 & -18.7 \\ 0 & 120.1 & 0 \\ -18.7 & 0 & 117.1 \end{bmatrix}\mathrm{kg\,m^2}.
$$

The bus correction is small: $600\times\lVert\mathbf{d}_b\rVert^2 = 600\times 0.00667 = 4.0\,\mathrm{kg\,m^2}$ on the $yy$ entry, $600\times 0.0129^2 = 0.1$ on $xx$, $600\times 0.0806^2 = 3.9$ on $zz$, and $-600\times 0.0806\times 0.0129 = -0.62$ on the $xz$ entries.

Step 4. Summing,

$$
\mathbf{I}_C = \begin{bmatrix} 211.6 & 0 & -19.4 \\ 0 & 332.6 & 0 \\ -19.4 & 0 & 313.0 \end{bmatrix}\mathrm{kg\,m^2}.
$$

A 20 kg instrument, three per cent of the mass, has raised the $yy$ moment by 60 per cent and introduced a product of inertia of $19.4\,\mathrm{kg\,m^2}$, because it sits $2.4\,\mathrm{m}$ out. Mass far from the centre dominates the inertia. The next lesson finds the axes in which this tensor is diagonal.
:::

In code, the whole procedure is a few lines. With NumPy conventions:

```python
import numpy as np

def point_mass_tensor(m, d):
    d = np.asarray(d, dtype=float)
    return m * (d @ d * np.eye(3) - np.outer(d, d))

def cylinder_tensor(m, R, L):
    It = m * (3 * R**2 + L**2) / 12
    return np.diag([It, It, 0.5 * m * R**2])

parts = [(600.0, [0.0, 0.0, 0.0], cylinder_tensor(600.0, 0.8, 1.5)),
         (20.0, [2.5, 0.0, 0.4], np.zeros((3, 3)))]
M = sum(m for m, _, _ in parts)
r_cm = sum(m * np.asarray(r) for m, r, _ in parts) / M
I_cm = sum(I + point_mass_tensor(m, np.asarray(r) - r_cm) for m, r, I in parts)
print(np.round(I_cm, 1))
# [[211.6   0.  -19.4]
#  [  0.  332.6   0. ]
#  [-19.4   0.  313. ]]
```

::: warning Moving the tensor the wrong way
The commonest error is to compute the vehicle tensor about a convenient geometric point — the base of the bus, or the launch adapter — and then use it in Euler's equations, which are written about the centre of mass. The result overstates every moment of inertia and invents products of inertia that do not exist. Assemble about the centre of mass, and if the centre of mass moves (propellant use, a deployed boom), reassemble.
:::

## Changing the body axes

The tensor's entries depend on which body axes you use. Suppose a second set of body axes $B'$ is related to the first by a rotation matrix $\mathbf{R}$, with components transforming as $\mathbf{v}' = \mathbf{R}\mathbf{v}$. Angular momentum and angular velocity are vectors, so $\mathbf{H}' = \mathbf{R}\mathbf{H}$ and $\boldsymbol{\omega}' = \mathbf{R}\boldsymbol{\omega}$. Then

$$
\mathbf{H}' = \mathbf{R}\,\mathbf{I}\,\boldsymbol{\omega} = \mathbf{R}\,\mathbf{I}\,\mathbf{R}^\top\boldsymbol{\omega}'
\qquad\Longrightarrow\qquad
\mathbf{I}' = \mathbf{R}\,\mathbf{I}\,\mathbf{R}^\top .
$$

This is how a component's tensor, known in its own symmetry axes, is expressed in the vehicle axes when the component is mounted at an angle: rotate it with $\mathbf{R}\mathbf{I}\mathbf{R}^\top$ first, then apply the parallel axis theorem. A rotation preserves the trace ($I_{xx} + I_{yy} + I_{zz}$, equal to $2\int\lVert\mathbf{r}\rVert^2\,dm$) and the determinant, but redistributes the entries, and in general a tensor that is diagonal in one set of axes has products of inertia in another. The next lesson turns this around and asks for the rotation that makes a given tensor diagonal.

::: note The tensor of a symmetric body
For a body with an axis of symmetry, such as a cylinder, the two transverse moments are equal and the tensor is unchanged by any rotation about that axis. Such a body is called **axisymmetric**, and its tensor is written $\mathrm{diag}(I_t, I_t, I_3)$ with $I_3$ the axial and $I_t$ the transverse moment. Spin-stabilised spacecraft are designed to be nearly axisymmetric, and lessons 9 and 10 use this form throughout.
:::

## Check yourself

::: check
A mass-properties report lists $I_{xx} = 900$, $I_{yy} = 700$ and $I_{zz} = 1{,}700\,\mathrm{kg\,m^2}$ for a spacecraft bus. Is the report physically possible? What kind of body would come closest to those numbers?
:::

::: answer
The triangle inequality requires $I_{xx} + I_{yy} \ge I_{zz}$. Here $900 + 700 = 1{,}600 < 1{,}700$, so no mass distribution can produce these values; the report contains an error. Equality, $I_{zz} = I_{xx} + I_{yy}$, would hold only for a body flat in the $xy$ plane, such as a thin plate — and a bus with $I_{zz}$ close to the sum of the other two would have to be very flat. A three-dimensional bus should show $I_{zz}$ well below the sum.
:::

::: check
Use the parallel axis theorem to find the moment of inertia of a uniform thin rod of mass $m$ and length $L$ about a transverse axis through one end.
:::

::: answer
About the centre of mass, $I_C = \tfrac{1}{12}mL^2$. The end is $d = L/2$ from the centre along the rod, perpendicular to the axis in question, so the correction is $md^2 = mL^2/4$. Then $I_{\mathrm{end}} = \tfrac{1}{12}mL^2 + \tfrac{1}{4}mL^2 = \tfrac{1}{3}mL^2$, four times the value about the centre. Only the scalar form is needed because the offset is perpendicular to the axis; the tensor form gives the same $md^2$ on that diagonal entry and adds nothing on the others that would matter for this axis.
:::

::: check
A spacecraft has $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ in its body axes. What is its moment of inertia about the axis $\hat{\mathbf{n}} = (1, 1, 0)/\sqrt{2}$, which lies midway between body $x$ and body $y$?
:::

::: answer
The moment about an axis is $I_n = \hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}}$. With $\hat{\mathbf{n}} = (1/\sqrt{2}, 1/\sqrt{2}, 0)$ and a diagonal tensor, $I_n = \tfrac{1}{2}\times 1200 + \tfrac{1}{2}\times 1500 + 0\times 2000 = 1{,}350\,\mathrm{kg\,m^2}$. In general the moment about a tilted axis is a weighted average of the diagonal entries by the squared direction cosines, plus product-of-inertia terms $-2n_xn_yI_{xy}$ and so on, which are zero here.
:::

::: check
A component's tensor is known about its own centre of mass at point $P$, and you want it about point $Q$, where neither $P$ nor $Q$ is the component's centre of mass. A colleague applies $\mathbf{I}_Q = \mathbf{I}_P + m(\lVert\mathbf{d}\rVert^2\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top)$ with $\mathbf{d}$ from $P$ to $Q$. What is wrong, and what is the correct procedure?
:::

::: answer
The parallel axis theorem's cross terms vanish only because one reference point is the centre of mass, so it cannot be applied directly between two arbitrary points. The correct route passes through the centre of mass $C$: first recover $\mathbf{I}_C = \mathbf{I}_P - m(\lVert\mathbf{d}_P\rVert^2\mathbf{I}_3 - \mathbf{d}_P\mathbf{d}_P^\top)$ with $\mathbf{d}_P$ from $C$ to $P$, then add the correction for $\mathbf{d}_Q$ from $C$ to $Q$. The colleague's formula overstates the result whenever $P \ne C$, because the correction terms do not accumulate along a chain of points.
:::

::: check
Two identical 30 kg boxes are mounted at $(0.5, 0.8, 0)$ and $(0.5, -0.8, 0)\,\mathrm{m}$ from the centre of mass. What is their combined contribution to the inertia tensor, and which products of inertia survive?
:::

::: answer
Each contributes $30(\lVert\mathbf{d}\rVert^2\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top)$ with $\lVert\mathbf{d}\rVert^2 = 0.89$. The diagonal entries are the same for both: $19.2$, $7.5$ and $26.7\,\mathrm{kg\,m^2}$, so they double to $38.4$, $15.0$ and $53.4$. The $xy$ entry is $-30\,d_xd_y$, equal to $-12.0$ for the first box and $+12.0$ for the second, so they cancel. No $xz$ or $yz$ terms arise because $d_z = 0$. The pair is symmetric about the $xz$ plane, and the products of inertia vanish accordingly — a mirror-image placement is the standard way to keep an assembly's products of inertia small.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{I} = \int(\lVert\mathbf{r}\rVert^2\mathbf{I}_3 - \mathbf{r}\mathbf{r}^\top)\,dm$ | Inertia tensor about the reference point; $\mathbf{H}_C = \mathbf{I}\boldsymbol{\omega}$ |
| $I_{ij} = \int(\lVert\mathbf{r}\rVert^2\delta_{ij} - r_ir_j)\,dm$ | Component form; symmetric, positive definite, frame dependent, units $\mathrm{kg\,m^2}$ |
| $I_{xx} = \int(y^2 + z^2)\,dm$ | Moment of inertia about $x$; $I_n = \hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}}$ about any axis $\hat{\mathbf{n}}$ |
| $I_{xy} = \int xy\,dm$ | Product of inertia; appears as $-I_{xy}$ in the matrix; zero across a plane of symmetry |
| $I_{xx} + I_{yy} \ge I_{zz}$ | Triangle inequality; equality only for a body flat in the $xy$ plane |
| $\mathbf{I} = \int[\mathbf{r}\times]^\top[\mathbf{r}\times]\,dm$ | The same tensor via the cross-product matrix |
| $\mathbf{I}_P = \mathbf{I}_C + m(\lVert\mathbf{d}\rVert^2\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top)$ | Parallel axis theorem, $\mathbf{d}$ from the centre of mass to $P$ |
| $\mathbf{I}' = \mathbf{R}\mathbf{I}\mathbf{R}^\top$ | Change of body axes under the rotation $\mathbf{v}' = \mathbf{R}\mathbf{v}$ |
| Solid cylinder | $I_3 = \tfrac{1}{2}mR^2$, $I_t = \tfrac{1}{12}m(3R^2 + L^2)$; loaded first stage $7.0\times 10^5$ and $5.9\times 10^7\,\mathrm{kg\,m^2}$ |

The assembled tensor of a real vehicle has products of inertia. The next lesson shows that a rotation of the body axes always exists that removes them, and that the resulting principal moments and principal axes are the eigenvalues and eigenvectors of $\mathbf{I}$.
