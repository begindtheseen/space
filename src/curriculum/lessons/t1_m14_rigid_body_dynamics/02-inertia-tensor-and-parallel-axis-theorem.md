---
id: l02-inertia-tensor-and-parallel-axis-theorem
title: The inertia tensor and the parallel axis theorem
minutes: 24
covers:
  - the moment of inertia tensor, products of inertia, parallel axis theorem
---

Hold a broom in the middle and twist it about its long handle. Easy. Now hold it in the middle and swing it end over end, like a windmill. Much harder — even though it is the same broom with the same mass. The difference is *where the mass is* compared with the axis you turn about. Twisting the handle moves every bit of the broom only a little. Swinging it end over end sends the bristles around a big circle.

A rocket stage is a giant broom. It is easy to **roll** about its long axis and very hard to **pitch** (tip its nose up or down) — by a factor of nearly a hundred — because pitching swings the ends of a $41\,\mathrm{m}$ tube while rolling only turns mass around a $1.8\,\mathrm{m}$ radius. One number cannot describe that. The object that does is the **inertia tensor**: a symmetric $3\times 3$ matrix that turns a body's angular velocity into its angular momentum.

A GNC engineer meets this matrix constantly. Controller gains are scaled by it. The torque a reaction wheel needs for a turn is proportional to it. The coupling between axes in Euler's equations, later in this module, comes from differences between its diagonal entries. On a rocket it shrinks by more than ten times between lift-off and burnout as the fuel leaves, and the control system must keep up. On a satellite it is built piece by piece from the bus, tanks, solar arrays and instruments, each moved to the common center of mass with the **parallel axis theorem** — the calculation this lesson teaches.

## From angular momentum to the inertia tensor

Start with something you know: a single stone of mass $m$ whirled on a string of length $r$ at rate $\omega$. Its speed is $\omega r$, and its angular momentum about your hand is $r \times m\omega r = m r^2\omega$. The factor $mr^2$ is the stone's **moment of inertia**: how hard it is to spin up. Mass far out counts with the *square* of the distance.

A rigid body is a huge number of tiny stones, each of mass $dm$ (read "d m", a tiny bit of mass). Lesson 1 gave the velocity of a point $P$ as $\mathbf{v}_P = \mathbf{v}_C + \boldsymbol{\omega}\times\boldsymbol{\rho}$, with $\boldsymbol{\rho}$ the arrow from the center of mass $C$ to $P$. The previous module defined angular momentum about the center of mass as the sum of position crossed with momentum. For a body the sum becomes an integral over every bit of mass. The $\mathbf{v}_C$ part drops out, because $\int\boldsymbol{\rho}\,dm = 0$ — that is what "center of mass" means. What remains is

$$
\mathbf{H}_C = \int \boldsymbol{\rho}\times(\boldsymbol{\omega}\times\boldsymbol{\rho})\,dm .
$$

Expand the double cross product with $\mathbf{a}\times(\mathbf{b}\times\mathbf{c}) = \mathbf{b}(\mathbf{a}\cdot\mathbf{c}) - \mathbf{c}(\mathbf{a}\cdot\mathbf{b})$:

$$
\boldsymbol{\rho}\times(\boldsymbol{\omega}\times\boldsymbol{\rho}) = \boldsymbol{\omega}\,(\boldsymbol{\rho}\cdot\boldsymbol{\rho}) - \boldsymbol{\rho}\,(\boldsymbol{\rho}\cdot\boldsymbol{\omega}) = \bigl(\lVert\boldsymbol{\rho}\rVert^2\,\mathbf{I}_3 - \boldsymbol{\rho}\boldsymbol{\rho}^\top\bigr)\boldsymbol{\omega} .
$$

The last step rewrote each piece as a matrix times $\boldsymbol{\omega}$: $\boldsymbol{\omega}\lVert\boldsymbol{\rho}\rVert^2 = \lVert\boldsymbol{\rho}\rVert^2\mathbf{I}_3\boldsymbol{\omega}$, and $\boldsymbol{\rho}(\boldsymbol{\rho}\cdot\boldsymbol{\omega}) = \boldsymbol{\rho}\boldsymbol{\rho}^\top\boldsymbol{\omega}$. ($\boldsymbol{\rho}\boldsymbol{\rho}^\top$, a column times a row, is a $3\times 3$ matrix called the **outer product**.) Every bit of mass shares the same $\boldsymbol{\omega}$, so it comes outside the integral:

$$
\mathbf{H}_C = \mathbf{I}\,\boldsymbol{\omega},
\qquad
\mathbf{I} = \int\bigl(\lVert\mathbf{r}\rVert^2\,\mathbf{I}_3 - \mathbf{r}\mathbf{r}^\top\bigr)\,dm .
$$

This is the **[[inertia tensor|tensor-word]]** about the reference point that $\mathbf{r}$ is measured from — the center of mass, unless stated otherwise. Careful with the two I's: bold $\mathbf{I}$ is the inertia tensor, and $\mathbf{I}_3$ is the identity matrix. In index form, with $\delta_{ij}$ (read "delta i j") the **[[Kronecker delta|kronecker-delta]]**, $1$ when $i = j$ and $0$ otherwise,

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

The diagonal entries are the **moments of inertia** about the three axes. Look at $I_{xx} = \int(y^2 + z^2)\,dm$: $y^2 + z^2$ is the squared distance of a bit of mass from the $x$ axis. So each diagonal entry is the whirled-stone $mr^2$, added up over the body, and it is positive for any real object.

The off-diagonal entries are minus the **[[products of inertia|products-of-inertia]]**, $I_{xy} = \int xy\,dm$ and its two partners. A product of inertia measures how lopsided the mass is between two axes. $I_{xy}$ is zero when the body is mirror-symmetric in a way that flips the sign of $x$ or of $y$. Then every bit of mass at $(x, y, z)$ has a twin — at $(x, -y, z)$, say — and their $xy$ values cancel. Put another way: $I_{xy}$ vanishes whenever the $x$ axis or the $y$ axis is perpendicular to a plane of symmetry.

The units are $\mathrm{kg\,m^2}$ (kilogram meter squared). Three properties hold for any body:

- **Symmetric.** $I_{ij} = I_{ji}$ straight from the definition, so $\mathbf{I} = \mathbf{I}^\top$. That is what makes the next lesson possible.
- **[[Positive definite|positive-definite]].** For any unit vector $\hat{\mathbf{n}}$ ("n hat"), $\hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}} = \int\bigl(\lVert\mathbf{r}\rVert^2 - (\mathbf{r}\cdot\hat{\mathbf{n}})^2\bigr)dm = \int r_\perp^2\,dm$. By Pythagoras, $\lVert\mathbf{r}\rVert^2 - (\mathbf{r}\cdot\hat{\mathbf{n}})^2$ is the squared distance $r_\perp^2$ from the axis along $\hat{\mathbf{n}}$. So this is the moment of inertia about that axis, $I_n$, and it is positive unless all the mass sits on the axis itself.
- **Frame dependent.** The entries are components. They change when you change the body axes or the reference point. The tensor describes one physical object, but its numbers belong to a frame — the last two sections make that precise.

There is a compact way to write the same thing with lesson 1's cross-product matrix. Since $[\mathbf{r}\times]\mathbf{v} = \mathbf{r}\times\mathbf{v}$ and $[\mathbf{r}\times]^\top = -[\mathbf{r}\times]$, the double cross product is $\mathbf{r}\times(\boldsymbol{\omega}\times\mathbf{r}) = -[\mathbf{r}\times][\mathbf{r}\times]\boldsymbol{\omega} = [\mathbf{r}\times]^\top[\mathbf{r}\times]\boldsymbol{\omega}$, so

$$
\mathbf{I} = \int [\mathbf{r}\times]^\top[\mathbf{r}\times]\,dm .
$$

Multiplying out one entry of $[\mathbf{r}\times]^\top[\mathbf{r}\times]$ gives back $\lVert\mathbf{r}\rVert^2\delta_{ij} - r_ir_j$. This form shows the symmetry at a glance, because $\mathbf{A}^\top\mathbf{A}$ is symmetric for any matrix $\mathbf{A}$, and never negative along any direction.

::: key The inertia tensor
$\mathbf{I} = \int\bigl(\lVert\mathbf{r}\rVert^2\,\mathbf{I}_3 - \mathbf{r}\mathbf{r}^\top\bigr)\,dm$, that is $I_{ij} = \int\bigl(\lVert\mathbf{r}\rVert^2\,\delta_{ij} - r_ir_j\bigr)\,dm$, with $\mathbf{r}$ measured from the reference point. It is symmetric, positive definite, and frame dependent. Its diagonal entries are moments of inertia about the axes. Its off-diagonal entries are minus the products of inertia $I_{xy} = \int xy\,dm$, and a product of inertia vanishes when one of its two axes is perpendicular to a plane of symmetry.
:::

::: warning Sign of the products of inertia
Some books call the off-diagonal *entries* the products of inertia, so their $I_{xy}$ is minus the one used here. The written-out matrix is the same either way. When you read a mass-properties report or use software that builds the tensor, check which convention it uses. A sign slip here becomes a fake coupling torque in every simulation downstream.
:::

## Typical sizes, and a quick error check

Moments of inertia grow like mass times size squared, so they span a huge range. A 3U CubeSat — $4\,\mathrm{kg}$, $10\times 10\times 30\,\mathrm{cm}$ — has about $0.03\,\mathrm{kg\,m^2}$ across its length and $0.007$ along it. A one-tonne communications satellite is around $1{,}000$ to $2{,}000\,\mathrm{kg\,m^2}$; this module's running example uses $\mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ (a matrix with those numbers on the diagonal and zeros elsewhere). The ISS is around $10^8\,\mathrm{kg\,m^2}$, because its $420$ tonnes are spread over a $100\,\mathrm{m}$ truss. A loaded first stage, worked out below, has a sideways moment near $6\times 10^7$ and a roll moment almost a hundred times smaller.

The diagonal entries also obey a rule that catches mistakes. From the definitions,

$$
I_{xx} + I_{yy} = \int (x^2 + y^2 + 2z^2)\,dm \;\ge\; \int (x^2 + y^2)\,dm = I_{zz},
$$

and the same for the other two pairs. This is the **[[triangle inequality|triangle-inequality]]** for moments: any two must add up to at least the third. They are equal only for a body that is flat in the plane of the two axes, like a thin plate, where $\int z^2\,dm = 0$. A reported tensor with $I_{zz} > I_{xx} + I_{yy}$ describes no real object.

## Standard shapes

Real vehicles are built from parts close to a few standard shapes. Each has a tensor you can write down in axes lined up with its symmetry.

Take a uniform thin rod of mass $m$ and length $L$ along $x$. Every product of inertia is zero by symmetry, and $I_{xx} = 0$ for a rod with no thickness, since no mass is off the $x$ axis. For a sideways axis, the rod's mass per meter is $m/L$, and a slice at position $x$ sits distance $|x|$ from the axis:

$$
I_{yy} = I_{zz} = \int_{-L/2}^{L/2} x^2\,\frac{m}{L}\,dx = \frac{m}{L}\left[\frac{x^3}{3}\right]_{-L/2}^{L/2} = \frac{m}{L}\cdot\frac{2}{3}\cdot\frac{L^3}{8} = \frac{mL^2}{12}.
$$

The other shapes follow the same way: add up squared distance from the axis over the body. All entries below are about the center of mass, in axes along the body's symmetry directions, with every product of inertia zero.

| Body (mass $m$) | Moments of inertia about the center of mass |
| --- | --- |
| Thin rod, length $L$ along $x$ | $I_{xx} = 0$, $I_{yy} = I_{zz} = \tfrac{1}{12}mL^2$ |
| Solid cylinder, radius $R$, length $L$ along $z$ | $I_{zz} = \tfrac{1}{2}mR^2$, $I_{xx} = I_{yy} = \tfrac{1}{12}m(3R^2 + L^2)$ |
| Thin-walled cylinder, radius $R$, length $L$ along $z$ | $I_{zz} = mR^2$, $I_{xx} = I_{yy} = \tfrac{1}{2}mR^2 + \tfrac{1}{12}mL^2$ |
| Solid sphere, radius $R$ | $I_{xx} = I_{yy} = I_{zz} = \tfrac{2}{5}mR^2$ |
| Thin spherical shell, radius $R$ | $I_{xx} = I_{yy} = I_{zz} = \tfrac{2}{3}mR^2$ |
| Rectangular box, sides $a, b, c$ along $x, y, z$ | $I_{xx} = \tfrac{1}{12}m(b^2 + c^2)$, and the same pattern for $y$ and $z$ |
| Thin plate, sides $a$ along $x$, $b$ along $y$ | $I_{xx} = \tfrac{1}{12}mb^2$, $I_{yy} = \tfrac{1}{12}ma^2$, $I_{zz} = \tfrac{1}{12}m(a^2 + b^2)$ |

The plate is the box squashed to $c = 0$, and it hits the triangle inequality exactly: $I_{zz} = I_{xx} + I_{yy}$.

::: example A first stage as a cylinder, full and empty
Model a Falcon 9 first stage as a uniform solid cylinder: loaded mass $m = 420{,}000\,\mathrm{kg}$, radius $R = 1.83\,\mathrm{m}$, length $L = 41.0\,\mathrm{m}$, with $z$ along the vehicle.

**Roll moment** (about the long axis):

$$
I_{zz} = \tfrac{1}{2}mR^2 = 0.5\times 420{,}000\times 1.83^2 = 0.5\times 420{,}000\times 3.349 = 7.03\times 10^5\,\mathrm{kg\,m^2}.
$$

**Pitch moment** (sideways):

$$
I_{xx} = I_{yy} = \tfrac{1}{12}m(3R^2 + L^2) = \tfrac{1}{12}\times 420{,}000\times(10.05 + 1681) = 5.92\times 10^7\,\mathrm{kg\,m^2}.
$$

Notice that $L^2 = 1681$ swamps $3R^2 = 10.05$: the length is what makes pitching hard. The ratio is $5.92\times 10^7 / 7.03\times 10^5 = 84$. Pitching this vehicle at a given rate takes $84$ times the angular momentum that rolling it does — the broom again. A small roll torque goes a long way; pitch needs the big gimbaled main engines.

**Near burnout,** treat the almost-empty stage as a thin-walled cylinder of $m = 25{,}000\,\mathrm{kg}$, same size. Then

$$
I_{zz} = mR^2 = 25{,}000\times 3.349 = 8.37\times 10^4\,\mathrm{kg\,m^2},
$$

$$
I_{xx} = \tfrac{1}{2}mR^2 + \tfrac{1}{12}mL^2 = 4.19\times 10^4 + 3.50\times 10^6 = 3.54\times 10^6\,\mathrm{kg\,m^2}.
$$

**Sanity check.** The mass fell by a factor of $420{,}000/25{,}000 = 16.8$, and the pitch moment fell by $5.92\times 10^7/3.54\times 10^6 = 16.7$ — almost the same, as it should be when the shape stays the same length. A pitch controller with fixed gains would see its response speed (its **bandwidth**) rise by $\sqrt{16.7} \approx 4.1$, up toward the vehicle's bending wobbles. That is one reason rocket controllers use **[[gain scheduling|gain-scheduling]]**.
:::

## The parallel axis theorem

The table gives each part's tensor about *its own* center of mass. To combine parts into one vehicle, every tensor must be moved to the *same* point — the vehicle's center of mass.

The everyday picture: a door. Turning a door about its hinges is harder than spinning the same slab about a line through its middle, because swinging from the hinge carries the whole door around a circle. The extra effort is exactly what the door would need if all its mass were squeezed into one point at its center.

Here is the precise rule. Let $C$ be the body's center of mass and $P$ another point, with $\mathbf{d}$ the arrow from $C$ to $P$. A bit of mass at $\mathbf{r}'$ from $C$ sits at $\mathbf{r} = \mathbf{r}' - \mathbf{d}$ from $P$. Put that into the definition:

$$
\mathbf{I}_P = \int\bigl(\lVert\mathbf{r}' - \mathbf{d}\rVert^2\,\mathbf{I}_3 - (\mathbf{r}' - \mathbf{d})(\mathbf{r}' - \mathbf{d})^\top\bigr)\,dm .
$$

Multiply out the brackets and sort the terms into three piles:

1. Terms with $\mathbf{r}'$ twice. These add up to $\mathbf{I}_C$, the tensor about the center of mass.
2. Terms with $\mathbf{d}$ twice. $\mathbf{d}$ is the same for every bit of mass, so these add up to $m\bigl(\lVert\mathbf{d}\rVert^2\,\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top\bigr)$.
3. Cross terms, with one $\mathbf{r}'$ and one $\mathbf{d}$: $-2(\mathbf{r}'\cdot\mathbf{d})\mathbf{I}_3 + \mathbf{r}'\mathbf{d}^\top + \mathbf{d}\mathbf{r}'^\top$. Every one contains $\int\mathbf{r}'\,dm$, which is zero because $\mathbf{r}'$ is measured from the center of mass. This pile vanishes.

So

$$
\mathbf{I}_P = \mathbf{I}_C + m\bigl(\lVert\mathbf{d}\rVert^2\,\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top\bigr).
$$

This is the **parallel axis theorem** in tensor form. The extra term is exactly the inertia tensor of a point mass $m$ sitting at $\mathbf{d}$ — [[the door squeezed into a point|door-picture]]. For one diagonal entry it reads $I_{P,xx} = I_{C,xx} + m(d_y^2 + d_z^2)$, the scalar form you may have seen. The tensor form also gives off-diagonal terms $-m\,d_xd_y$. That is how products of inertia appear when perfectly symmetric parts are mounted off-center.

Two facts matter in practice. First, the theorem only works *from or to the center of mass*: the cross terms vanished only because one of the two points was $C$. To move a tensor from a point $P$ to a point $Q$, neither of them the center of mass, go through $C$: subtract the correction for $P$, then add the correction for $Q$. Second, the added term is never negative along any axis. So among all parallel axes pointing the same way, the one through the center of mass has the smallest moment of inertia.

::: key The parallel axis theorem
$\mathbf{I}_P = \mathbf{I}_C + m\bigl(\lVert\mathbf{d}\rVert^2\,\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top\bigr)$, where $\mathbf{d}$ is the vector from the center of mass to the new reference point $P$. The correction is the tensor of a point mass $m$ at $\mathbf{d}$. It applies only between the center of mass and another point; to go between two arbitrary points, pass through the center of mass.
:::

::: example A point mass moved off-center
A $30\,\mathrm{kg}$ avionics box, small enough to treat as a point mass, sits at $\mathbf{d} = (0.5, 0.8, 0)\,\mathrm{m}$ from a spacecraft's center of mass. Its own tensor about its own center is negligible, so it adds only the parallel-axis term.

**Squared distance:** $\lVert\mathbf{d}\rVert^2 = 0.5^2 + 0.8^2 + 0^2 = 0.25 + 0.64 = 0.89\,\mathrm{m^2}$.

**Outer product** $\mathbf{d}\mathbf{d}^\top$ has entries $d_id_j$: $0.25$, $0.40$, $0.64$ and zeros wherever $d_z$ appears.

**Assemble:**

$$
m\bigl(\lVert\mathbf{d}\rVert^2\,\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top\bigr)
= 30\begin{bmatrix} 0.89 - 0.25 & -0.40 & 0 \\ -0.40 & 0.89 - 0.64 & 0 \\ 0 & 0 & 0.89 \end{bmatrix}
= \begin{bmatrix} 19.2 & -12.0 & 0 \\ -12.0 & 7.5 & 0 \\ 0 & 0 & 26.7 \end{bmatrix}\mathrm{kg\,m^2}.
$$

**Read the entries.** About $z$, the box is $\sqrt{0.89} = 0.943\,\mathrm{m}$ from the axis and adds $30\times 0.89 = 26.7\,\mathrm{kg\,m^2}$. About $x$ it is only $0.8\,\mathrm{m}$ away, adding $30\times 0.64 = 19.2$. The product of inertia $I_{xy} = 30\times 0.5\times 0.8 = 12.0\,\mathrm{kg\,m^2}$ appears because the box sits on one side of the $xz$ plane. A twin box at $(0.5, -0.8, 0)$ would cancel it.

**Sanity check.** Everything here lies in the $xy$ plane, so the triangle inequality should hold exactly: $19.2 + 7.5 = 26.7$. It does.
:::

## Assembling a vehicle

Building the tensor of a whole spacecraft takes four steps. The module's inertia-tensor exercise asks you to do this for a bus with two solar arrays and a tank.

1. Write each part's tensor about its own center of mass, in the vehicle's body axes. If the part is lined up with those axes, use the table. If it is mounted at an angle, rotate it first (last section).
2. Find the whole vehicle's center of mass: the mass-weighted average of the parts' centers, from the previous module.
3. Move each part's tensor to the vehicle's center of mass with the parallel axis theorem, using $\mathbf{d}_k$, the arrow between part $k$'s center and the vehicle's center. (The part's own center plays the role of $C$. Only $\lVert\mathbf{d}\rVert^2$ and $\mathbf{d}\mathbf{d}^\top$ appear, so the arrow may point either way.)
4. Add them up. The integral that defines $\mathbf{I}$ can be split over separate pieces, so the vehicle's tensor is the sum of the moved part tensors.

::: example A bus with a boom-mounted instrument
A spacecraft bus is a uniform solid cylinder: $m_b = 600\,\mathrm{kg}$, radius $0.8\,\mathrm{m}$, length $1.5\,\mathrm{m}$, axis along body $z$, centered at the body origin. An instrument of $m_i = 20\,\mathrm{kg}$, treated as a point mass, sits on a **[[boom|boom]]** at $\mathbf{r}_i = (2.5, 0, 0.4)\,\mathrm{m}$.

**Step 1 — parts about their own centers.** From the table, the bus has $I_{zz} = 0.5\times 600\times 0.8^2 = 192\,\mathrm{kg\,m^2}$ and $I_{xx} = I_{yy} = \tfrac{1}{12}\times 600\times(3\times 0.64 + 2.25) = 50\times 4.17 = 208.5\,\mathrm{kg\,m^2}$, with no products of inertia. The point-mass instrument has nothing about its own center.

**Step 2 — center of mass.** $\mathbf{r}_C = (600\times\mathbf{0} + 20\times\mathbf{r}_i)/620 = (0.0806, 0, 0.0129)\,\mathrm{m}$. The instrument is light, but the shift is not zero.

**Step 3 — move each part.** The bus center is at $\mathbf{d}_b = -\mathbf{r}_C = (-0.0806, 0, -0.0129)\,\mathrm{m}$ from the vehicle center. The instrument is at $\mathbf{d}_i = \mathbf{r}_i - \mathbf{r}_C = (2.419, 0, 0.387)\,\mathrm{m}$. For the instrument, $\lVert\mathbf{d}_i\rVert^2 = 2.419^2 + 0.387^2 = 5.853 + 0.150 = 6.003\,\mathrm{m^2}$, and its moved tensor is

$$
20\begin{bmatrix} 6.003 - 5.853 & 0 & -2.419\times 0.387 \\ 0 & 6.003 & 0 \\ -2.419\times 0.387 & 0 & 6.003 - 0.150 \end{bmatrix}
= \begin{bmatrix} 3.0 & 0 & -18.7 \\ 0 & 120.1 & 0 \\ -18.7 & 0 & 117.1 \end{bmatrix}\mathrm{kg\,m^2}.
$$

The bus correction is small: $600\times\lVert\mathbf{d}_b\rVert^2 = 600\times 0.00667 = 4.0\,\mathrm{kg\,m^2}$ on the $yy$ entry, $600\times 0.0129^2 = 0.1$ on $xx$, $600\times 0.0806^2 = 3.9$ on $zz$, and $-600\times 0.0806\times 0.0129 = -0.62$ on the two $xz$ entries.

**Step 4 — add.** Bus, plus bus correction, plus instrument:

$$
\mathbf{I}_C = \begin{bmatrix} 211.6 & 0 & -19.4 \\ 0 & 332.6 & 0 \\ -19.4 & 0 & 313.0 \end{bmatrix}\mathrm{kg\,m^2}.
$$

**Sanity check.** A $20\,\mathrm{kg}$ instrument — about $3\%$ of the mass — raised the $yy$ moment from $208.5$ to $332.6$, about $60\%$, and created a product of inertia of $19.4\,\mathrm{kg\,m^2}$, because it sits $2.4\,\mathrm{m}$ out. Mass far out dominates, as the whirled stone promised. The next lesson finds the axes in which this tensor has no off-diagonal entries.
:::

In code, the whole recipe is a few lines of NumPy:

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
The most common error is building the tensor about a handy point — the base of the bus, or the launch adapter — and using it in Euler's equations, which are written about the center of mass. The result overstates every moment of inertia and invents products of inertia that do not exist. Build about the center of mass. If the center of mass moves (fuel used up, a boom deployed), build it again.
:::

## Changing the body axes

The tensor's entries depend on which body axes you use. Suppose a second set of body axes $B'$ ("B prime") is turned relative to the first by a rotation matrix $\mathbf{R}$, so that components change as $\mathbf{v}' = \mathbf{R}\mathbf{v}$. Angular momentum and angular velocity are arrows, so they change the same way: $\mathbf{H}' = \mathbf{R}\mathbf{H}$ and $\boldsymbol{\omega}' = \mathbf{R}\boldsymbol{\omega}$, which means $\boldsymbol{\omega} = \mathbf{R}^\top\boldsymbol{\omega}'$. Then

$$
\mathbf{H}' = \mathbf{R}\,\mathbf{I}\,\boldsymbol{\omega} = \mathbf{R}\,\mathbf{I}\,\mathbf{R}^\top\boldsymbol{\omega}'
\qquad\Longrightarrow\qquad
\mathbf{I}' = \mathbf{R}\,\mathbf{I}\,\mathbf{R}^\top .
$$

This is how a part's tensor, known in its own symmetry axes, is written in the vehicle's axes when the part is mounted at an angle. Rotate it with $\mathbf{R}\mathbf{I}\mathbf{R}^\top$ first, then apply the parallel axis theorem.

A rotation keeps two things fixed: the **trace** (the sum of the diagonal, $I_{xx} + I_{yy} + I_{zz}$, which equals $2\int\lVert\mathbf{r}\rVert^2\,dm$ and so cannot depend on direction) and the **determinant**. But it shuffles the entries. A tensor with no products of inertia in one set of axes usually has some in another. The next lesson turns this around and asks for the rotation that *removes* them.

::: note The tensor of a symmetric body
For a body with an axis of symmetry, like a cylinder, the two sideways moments are equal, and the tensor does not change under any turn about that axis. Such a body is called **axisymmetric**. Its tensor is written $\mathrm{diag}(I_t, I_t, I_3)$, with $I_3$ the axial moment and $I_t$ ("I sub t") the transverse, or sideways, moment. Spinning spacecraft are designed to be nearly axisymmetric, and lessons 9 and 10 use this form throughout.
:::

## Check yourself

::: check
A mass-properties report lists $I_{xx} = 900$, $I_{yy} = 700$ and $I_{zz} = 1{,}700\,\mathrm{kg\,m^2}$ for a spacecraft bus. Is the report physically possible? What kind of body would come closest to those numbers?
:::

::: answer
The triangle inequality needs $I_{xx} + I_{yy} \ge I_{zz}$. Here $900 + 700 = 1{,}600$, which is less than $1{,}700$. No arrangement of mass can give these values, so the report has an error.

Equality, $I_{zz} = I_{xx} + I_{yy}$, happens only for a body flat in the $xy$ plane, like a thin plate. A bus with $I_{zz}$ close to the sum of the other two would have to be very flat. A normal three-dimensional bus should show $I_{zz}$ well below the sum.
:::

::: check
Use the parallel axis theorem to find the moment of inertia of a uniform thin rod of mass $m$ and length $L$ about a sideways axis through one end.
:::

::: answer
About the center of mass, $I_C = \tfrac{1}{12}mL^2$. The end is $d = L/2$ from the center, along the rod, which is perpendicular to the axis. The correction is $md^2 = m(L/2)^2 = \tfrac{1}{4}mL^2$. So

$$
I_{\mathrm{end}} = \tfrac{1}{12}mL^2 + \tfrac{3}{12}mL^2 = \tfrac{4}{12}mL^2 = \tfrac{1}{3}mL^2 ,
$$

four times the value about the center. The scalar form is enough because the offset is perpendicular to the axis. The tensor form gives the same $md^2$ on that diagonal entry, and nothing else that matters for this axis.
:::

::: check
A spacecraft has $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ in its body axes. What is its moment of inertia about the axis $\hat{\mathbf{n}} = (1, 1, 0)/\sqrt{2}$, halfway between body $x$ and body $y$?
:::

::: answer
The moment about an axis is $I_n = \hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}}$. With $\hat{\mathbf{n}} = (1/\sqrt{2}, 1/\sqrt{2}, 0)$ and a diagonal tensor, each diagonal entry is weighted by the square of its component, and $(1/\sqrt{2})^2 = \tfrac{1}{2}$:

$$
I_n = \tfrac{1}{2}\times 1200 + \tfrac{1}{2}\times 1500 + 0\times 2000 = 600 + 750 = 1{,}350\,\mathrm{kg\,m^2}.
$$

In general the moment about a tilted axis is an average of the diagonal entries, weighted by the squared direction components, plus product-of-inertia terms like $-2n_xn_yI_{xy}$ — zero here. Sanity check: $1{,}350$ sits between $1{,}200$ and $1{,}500$, as a halfway axis should.
:::

::: check
A part's tensor is known about some point $P$, and you want it about another point $Q$. Neither $P$ nor $Q$ is the part's center of mass. A colleague uses $\mathbf{I}_Q = \mathbf{I}_P + m(\lVert\mathbf{d}\rVert^2\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top)$ with $\mathbf{d}$ from $P$ to $Q$. What is wrong, and what is the right way?
:::

::: answer
The theorem's cross terms vanish only because one of the two points is the center of mass. Between two other points they do not vanish, so the colleague's answer is off by those leftover cross terms — too big or too small, depending on the directions.

The right route goes through the center of mass $C$. First recover

$$
\mathbf{I}_C = \mathbf{I}_P - m(\lVert\mathbf{d}_P\rVert^2\mathbf{I}_3 - \mathbf{d}_P\mathbf{d}_P^\top),
$$

with $\mathbf{d}_P$ from $C$ to $P$. Then add the correction for $\mathbf{d}_Q$, from $C$ to $Q$. Corrections do not stack up along a chain of points; each one must start at the center of mass.
:::

::: check
Two identical $30\,\mathrm{kg}$ boxes are mounted at $(0.5, 0.8, 0)$ and $(0.5, -0.8, 0)\,\mathrm{m}$ from the center of mass. What do they add to the inertia tensor together, and which products of inertia survive?
:::

::: answer
Each adds $30(\lVert\mathbf{d}\rVert^2\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top)$ with $\lVert\mathbf{d}\rVert^2 = 0.89$. The diagonal entries are the same for both — $19.2$, $7.5$ and $26.7\,\mathrm{kg\,m^2}$ — so together they give $38.4$, $15.0$ and $53.4$.

The $xy$ entry is $-30\,d_xd_y$: $-30\times 0.5\times 0.8 = -12.0$ for the first box and $-30\times 0.5\times(-0.8) = +12.0$ for the second. They cancel. No $xz$ or $yz$ terms appear because $d_z = 0$ for both.

The pair is mirror-symmetric across the $xz$ plane, so every product of inertia involving $y$ vanishes. Mirror-image placement is the standard way to keep a vehicle's products of inertia small.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{I} = \int(\lVert\mathbf{r}\rVert^2\mathbf{I}_3 - \mathbf{r}\mathbf{r}^\top)\,dm$ | Inertia tensor about the reference point; $\mathbf{H}_C = \mathbf{I}\boldsymbol{\omega}$ |
| $I_{ij} = \int(\lVert\mathbf{r}\rVert^2\delta_{ij} - r_ir_j)\,dm$ | Component form; symmetric, positive definite, frame dependent, units $\mathrm{kg\,m^2}$ |
| $I_{xx} = \int(y^2 + z^2)\,dm$ | Moment of inertia about $x$; $I_n = \hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}}$ about any axis $\hat{\mathbf{n}}$ |
| $I_{xy} = \int xy\,dm$ | Product of inertia; appears as $-I_{xy}$ in the matrix; zero when $x$ or $y$ is perpendicular to a plane of symmetry |
| $I_{xx} + I_{yy} \ge I_{zz}$ | Triangle inequality; equality only for a body flat in the $xy$ plane |
| $\mathbf{I} = \int[\mathbf{r}\times]^\top[\mathbf{r}\times]\,dm$ | The same tensor via the cross-product matrix |
| $\mathbf{I}_P = \mathbf{I}_C + m(\lVert\mathbf{d}\rVert^2\mathbf{I}_3 - \mathbf{d}\mathbf{d}^\top)$ | Parallel axis theorem, $\mathbf{d}$ from the center of mass to $P$ |
| $\mathbf{I}' = \mathbf{R}\mathbf{I}\mathbf{R}^\top$ | Change of body axes under the rotation $\mathbf{v}' = \mathbf{R}\mathbf{v}$; trace and determinant unchanged |
| Solid cylinder | $I_3 = \tfrac{1}{2}mR^2$, $I_t = \tfrac{1}{12}m(3R^2 + L^2)$; loaded first stage $7.0\times 10^5$ and $5.9\times 10^7\,\mathrm{kg\,m^2}$ |

A real vehicle's tensor has products of inertia. The next lesson shows that you can always turn the body axes so that they disappear, and that the resulting **principal moments** and **principal axes** are the eigenvalues and eigenvectors of $\mathbf{I}$.

::: context tensor-word Why "tensor" and not "matrix"?
A matrix is a grid of numbers. A **tensor** is the physical thing those numbers describe — here, the body's resistance to turning in every direction at once. Turn your axes and the grid of numbers changes, following the rule $\mathbf{R}\mathbf{I}\mathbf{R}^\top$, but the object does not. The word comes from the Latin *tendere*, "to stretch", because tensors were first used for stretching and stress in materials. The inertia tensor "stretches" $\boldsymbol{\omega}$ into $\mathbf{H}$ by different amounts in different directions.
:::

::: context kronecker-delta A switch written as a symbol
$\delta_{ij}$ ("delta i j") is a tiny on-off switch named after the German mathematician Leopold Kronecker: it is $1$ when the two indices match and $0$ when they differ. So $\delta_{11} = 1$ and $\delta_{12} = 0$. Written as a grid, the $\delta_{ij}$ are exactly the identity matrix $\mathbf{I}_3$. In $I_{ij} = \int(\lVert\mathbf{r}\rVert^2\delta_{ij} - r_ir_j)\,dm$ the switch puts the $\lVert\mathbf{r}\rVert^2$ term on the diagonal only.
:::

::: context products-of-inertia Twins that cancel
A product of inertia adds up $x \cdot y$ for every bit of mass. A bit in the upper-right quarter of the $xy$ plane has $xy > 0$; a bit in the lower-right quarter has $xy < 0$. If the body is a mirror image of itself across the $x$ axis, every bit has a twin in the opposite quarter, and the sum is zero. A lone box with no twin leaves a leftover — a product of inertia.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="100" x2="300" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="308,100 298,95 298,105" fill="#1f2a44"/>
  <line x1="120" y1="185" x2="120" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="120,12 115,22 125,22" fill="#1f2a44"/>
  <text x="312" y="104" font-size="12" fill="#1f2a44">x</text>
  <text x="128" y="20" font-size="12" fill="#1f2a44">y</text>
  <rect x="190" y="48" width="24" height="24" fill="#1d6fd1"/>
  <rect x="190" y="128" width="24" height="24" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="202" y1="72" x2="202" y2="128" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="222" y="58" font-size="12" fill="#1f2a44">(x, y): xy &gt; 0</text>
  <text x="222" y="146" font-size="12" fill="#1f2a44">twin (x, −y): xy &lt; 0</text>
  <text x="180" y="196" font-size="12" text-anchor="middle" fill="#1f2a44">together: I_xy = 0</text>
</svg>
```
:::

::: context positive-definite Always positive, whichever way you turn
A matrix is **positive definite** when $\hat{\mathbf{n}}^\top\mathbf{I}\hat{\mathbf{n}} > 0$ for every direction $\hat{\mathbf{n}}$. For inertia this has a plain meaning: spinning the body about *any* axis takes effort, because some mass is always off that axis. The only way to get zero is an ideal line of mass spun about itself — the thin rod's $I_{xx} = 0$ in the table. That is why engineers sometimes say "positive semidefinite" to include such idealized shapes; real objects have some thickness and are strictly positive.
:::

::: context triangle-inequality Why the name fits
For triangles, any two sides add up to at least the third. Moments of inertia obey the same pattern: $I_{xx} + I_{yy} \ge I_{zz}$, and likewise in every order. Flight engineers use it as a first check on any mass-properties report. For example, $\mathrm{diag}(1200, 1500, 2000)$ passes: $1200 + 1500 = 2700 \ge 2000$. A flat plate sits exactly on the edge, the way a squashed, flat "triangle" has one side equal to the other two combined.
:::

::: context gain-scheduling Changing the controller as the fuel burns
A controller's **gains** are the numbers that say how hard to push back against a given error. The right gains depend on the vehicle's inertia: push a light vehicle as hard as a heavy one and it overshoots. Because a rocket's inertia falls by a factor of ten or more during a burn, flight software stores a table of gains and looks up the right set as time or fuel use goes on. That is **gain scheduling**, and nearly every launch vehicle uses it. You will design one in the control modules.
:::

::: context door-picture A rod about its middle and about its end
The same rod, two parallel axes. About its middle, $I_C = \tfrac{1}{12}mL^2$. Move the axis a distance $d = L/2$ to one end and add $md^2 = \tfrac{1}{4}mL^2$, the inertia of the whole mass squeezed into a point at the center: $I_{\mathrm{end}} = \tfrac{1}{3}mL^2$, four times as much.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="80" y="66" width="200" height="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="20" x2="180" y2="120" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="80" y1="20" x2="80" y2="120" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="180" cy="70" r="4" fill="#1f2a44"/>
  <text x="186" y="18" font-size="12" fill="#1d6fd1">axis through C: mL²/12</text>
  <text x="10" y="18" font-size="12" fill="#b4232c">end: mL²/3</text>
  <line x1="80" y1="100" x2="180" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="80,100 90,96 90,104" fill="#1f2a44"/>
  <polygon points="180,100 170,96 170,104" fill="#1f2a44"/>
  <text x="130" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">d = L/2</text>
  <text x="180" y="142" font-size="12" text-anchor="middle" fill="#1f2a44">rod of length L</text>
</svg>
```
:::

::: context boom Why put instruments on a boom?
Some instruments hate the spacecraft they ride on. A magnetometer measuring Earth's faint magnetic field is fooled by currents in the bus, so it is mounted a few meters away on a folding arm, a **boom**. The price is inertia: a light instrument far out adds a lot, as the example shows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="326" y="104" font-size="12" fill="#6c7a93">x</text>
  <line x1="100" y1="150" x2="100" y2="30" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="96" y="24" font-size="12" fill="#6c7a93">z</text>
  <rect x="60" y="62.5" width="80" height="75" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="100" y="125" font-size="12" text-anchor="middle" fill="#1f2a44">bus</text>
  <line x1="140" y1="95" x2="225" y2="80" stroke="#1f2a44" stroke-width="3"/>
  <circle cx="225" cy="80" r="6" fill="#b4232c"/>
  <text x="225" y="64" font-size="12" text-anchor="middle" fill="#b4232c">instrument 20 kg</text>
  <circle cx="100" cy="100" r="3.5" fill="#1f2a44"/>
  <text x="100" y="164" font-size="12" text-anchor="middle" fill="#1f2a44">600 kg bus, 1.6 m wide; instrument at (2.5, 0.4) m</text>
</svg>
```

Drawn to scale, $x$ to the right and $z$ up. The dot marks the bus's own center. The whole vehicle's center of mass sits about $8\,\mathrm{cm}$ toward the instrument — less than the width of the dot.
:::
