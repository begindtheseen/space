---
id: l08-div-curl-laplacian
title: Divergence, curl and the Laplacian
minutes: 23
covers:
  - divergence, curl, Laplacian
---

Stand in a gentle river and hold out your open hand. Two questions tell you a lot about the water right there. Is more water leaving the space around your hand than arriving — is there a spring bubbling up under it? And would a tiny paddle wheel held at that spot start to spin? The first question is the **divergence**. The second is the **curl**.

A vector field puts an arrow at every point: the gravitational acceleration around a planet, the wind over a launch site, the velocity of propellant in a feed line. Lesson 7 measured two *big-picture* properties of a field — the flux through a surface and the circulation around a curve. This lesson shrinks both down to a single point. The divergence at a point is the flux out of a tiny box there, per unit volume: it says whether the point is a **source** (field is created), a **sink** (field disappears) or neither. The curl is the circulation around a tiny loop, per unit area: it says whether the field swirls there, and about which axis.

The third tool, the **Laplacian**, is the divergence of a gradient. Applied to the gravitational potential, it gives zero everywhere outside the planet. That one fact — Laplace's equation — is why Earth's gravity can be written as a series of spherical harmonics (the $J_2$ term of this module's exercise is one of them). It is also why the gravity-gradient matrix of Lesson 3 has zero trace. All three tools are needed for the two integral theorems of Lesson 9 and the conservative-field test of Lesson 10.

## The del operator

Lesson 2 wrote the gradient with the symbol $\nabla$, read "**[[del|nabla-name]]**". It helps to treat $\nabla$ as a vector whose entries are "take the partial derivative" instructions:

$$
\nabla = \hat{\mathbf{x}}\,\frac{\partial}{\partial x} + \hat{\mathbf{y}}\,\frac{\partial}{\partial y} + \hat{\mathbf{z}}\,\frac{\partial}{\partial z} = \begin{bmatrix} \partial/\partial x \\ \partial/\partial y \\ \partial/\partial z \end{bmatrix}.
$$

On its own it does nothing, like a recipe with no ingredients. You use it three ways:

- **Times a scalar field** $f$: $\nabla f$, the gradient, a vector field.
- **Dotted with a vector field** $\mathbf{F} = [F_1, F_2, F_3]^\top$: $\nabla\cdot\mathbf{F}$ ("del dot F"), the divergence, a scalar field.
- **Crossed with a vector field**: $\nabla\times\mathbf{F}$ ("del cross F"), the curl, a vector field.

In each case you write out the ordinary dot or cross product and let each $\partial/\partial x_i$ act on the component it multiplies. You can take the formulas below as the definitions. The derivations show *why* they measure what they measure.

## Divergence

### Flux out of a small box

Think of a crowded hallway. Put an imaginary box around a small stretch of it and count people. If more walk out of the box each second than walk in, someone must be coming out of a door inside it: that stretch is a source. If fewer leave than arrive, people are going into a room: a sink.

Now do the same count for a field. Center a small box with sides $\Delta x$, $\Delta y$, $\Delta z$ on the point $(x, y, z)$, and add up the outward flux of $\mathbf{F}$ through its six faces, as in Lesson 7.

**The two faces facing along $x$.** On the right face, at $x + \Delta x/2$, the outward normal is $+\hat{\mathbf{x}}$. The normal component there is $F_1$, and the face has area $\Delta y\,\Delta z$, so the flux out is about $F_1(x + \Delta x/2, y, z)\,\Delta y\,\Delta z$. On the left face the outward normal is $-\hat{\mathbf{x}}$, so the flux out is $-F_1(x - \Delta x/2, y, z)\,\Delta y\,\Delta z$. Together:

$$
\big[F_1(x + \tfrac{1}{2}\Delta x, y, z) - F_1(x - \tfrac{1}{2}\Delta x, y, z)\big]\Delta y\,\Delta z \approx \frac{\partial F_1}{\partial x}\,\Delta x\,\Delta y\,\Delta z .
$$

The bracket is "how much $F_1$ changes across the box", which is about $\partial F_1/\partial x$ times the width $\Delta x$ — that is what a partial derivative means.

**The other four faces.** The $y$ pair and the $z$ pair give $\partial F_2/\partial y$ and $\partial F_3/\partial z$ times the same volume $\Delta V = \Delta x\,\Delta y\,\Delta z$.

**Divide by the volume and shrink the box.** That gives the divergence:

$$
\nabla\cdot\mathbf{F} = \lim_{\Delta V \to 0}\frac{1}{\Delta V}\oiint_{\partial(\Delta V)}\mathbf{F}\cdot\hat{\mathbf{n}}\,dS = \frac{\partial F_1}{\partial x} + \frac{\partial F_2}{\partial y} + \frac{\partial F_3}{\partial z} .
$$

Here $\partial(\Delta V)$ means "the surface of the little box".

So the divergence is the **[[net outflow per unit volume|box-flux]]**. Positive: more field leaves a small neighborhood than enters — a source. Negative: a sink. Zero: the field passes through without piling up or thinning out. Its units are those of $\mathbf{F}$ divided by meters: $\mathrm{s^{-1}}$ for a velocity field, $\mathrm{s^{-2}}$ for an acceleration field.

One more way to see it. The Jacobian of $\mathbf{F}$ (Lesson 3) is the $3 \times 3$ table of all $\partial F_i/\partial x_j$. The divergence adds up its diagonal entries $\partial F_i/\partial x_i$ — the Jacobian's **[[trace|trace-word]]**.

::: key
$\nabla\cdot\mathbf{F} = \partial F_1/\partial x + \partial F_2/\partial y + \partial F_3/\partial z$ — the net outflow of $\mathbf{F}$ per unit volume at a point. It equals the trace of the Jacobian $\partial\mathbf{F}/\partial\mathbf{x}$.
:::

### Divergence of radial fields

**The position field.** Take $\mathbf{F} = \mathbf{r} = [x, y, z]^\top$, arrows pointing straight away from the origin and growing with distance. Then $\nabla\cdot\mathbf{r} = 1 + 1 + 1 = 3$. It is like the dots on a balloon being blown up: everything spreads away from everything else, and every point is a source of the same strength. This is the divergence behind Lesson 7's check, where the flux of $\mathbf{r}$ out of a sphere was three times the volume.

**Any radial field.** A field $g(r)\,\mathbf{r}$ points straight out (or in), with a size that depends only on the distance $r$. Use the product rule for "scalar times vector":

$$
\nabla\cdot(g\,\mathbf{r}) = g\,\nabla\cdot\mathbf{r} + \mathbf{r}\cdot\nabla g .
$$

(Why: each term of the divergence is $\partial(g x_i)/\partial x_i = g + x_i\,\partial g/\partial x_i$, by the ordinary product rule; add the three.) Now $\nabla\cdot\mathbf{r} = 3$, and $\nabla g(r) = g'(r)\,\hat{\mathbf{r}}$ (Lesson 4), and $\mathbf{r}\cdot\hat{\mathbf{r}} = r$. So

$$
\nabla\cdot(g\,\mathbf{r}) = 3g + r\,g'(r).
$$

**Gravity.** Two-body gravity is $\mathbf{a} = -\mu\,\mathbf{r}/r^3$, so $g = -\mu r^{-3}$ and $g' = 3\mu r^{-4}$. Put them in:

$$
\nabla\cdot\mathbf{a} = 3(-\mu r^{-3}) + r\,(3\mu r^{-4}) = -\frac{3\mu}{r^3} + \frac{3\mu}{r^3} = 0 \qquad (r \neq 0).
$$

Gravity has zero divergence everywhere except at the mass itself. That is what the inverse-square law means up close. Field lines that enter any small empty region leave it again; none are created or destroyed. The field weakens with distance only because the same lines **[[spread over a bigger area|spreading-lines]]**.

A computer check: central differences with a $1\,\mathrm{m}$ step at $(7000, 100, -200)\,\mathrm{km}$ give the three terms $2.317 \times 10^{-6}$, $-1.160 \times 10^{-6}$ and $-1.157 \times 10^{-6}\,\mathrm{s^{-2}}$. Their sum is about $10^{-16}$: zero, up to round-off. This is the zero trace of Lesson 3's gravity-gradient matrix, because $\mathbf{G} = \partial\mathbf{a}/\partial\mathbf{r}$ is the Jacobian of $\mathbf{a}$ and the divergence is its trace.

::: example Divergence and curl of a polynomial field
Let $\mathbf{F} = [xy,\ yz,\ zx]^\top$. Find both at the point $(1, 2, 3)$.

**Divergence.** Differentiate each component by its own variable, holding the others fixed:

$$
\nabla\cdot\mathbf{F} = \frac{\partial(xy)}{\partial x} + \frac{\partial(yz)}{\partial y} + \frac{\partial(zx)}{\partial z} = y + z + x .
$$

At $(1, 2, 3)$ that is $2 + 3 + 1 = 6$.

**Curl**, using the formula in the next section:

$$
\nabla\times\mathbf{F} = \left[\frac{\partial(zx)}{\partial y} - \frac{\partial(yz)}{\partial z},\ \frac{\partial(xy)}{\partial z} - \frac{\partial(zx)}{\partial x},\ \frac{\partial(yz)}{\partial x} - \frac{\partial(xy)}{\partial y}\right]^\top = [0 - y,\ 0 - z,\ 0 - x]^\top = [-y,\ -z,\ -x]^\top .
$$

At $(1, 2, 3)$ that is $[-2, -3, -1]^\top$.

**Check.** Central differences with step $10^{-3}$ give $6.000$ and $[-2.000, -3.000, -1.000]^\top$, agreeing to twelve digits. Both operators work term by term, so a formula is differentiated exactly as in Lesson 1: freeze the other variables and differentiate.
:::

A velocity field with $\nabla\cdot\mathbf{v} = 0$ is **incompressible**: the fluid neither piles up nor thins out anywhere. What flows into a section of pipe must flow out. A spinning solid, $\mathbf{v} = \boldsymbol{\omega}\times\mathbf{r} = [-\omega y, \omega x, 0]^\top$, has divergence $0 + 0 + 0 = 0$, as it must — a solid body does not change its volume by turning.

## Curl

### Circulation around a small loop

Drop a tiny paddle wheel into a stream. It spins if the water pushes harder on one side of it than the other. The curl measures that push, by adding up the field around a tiny loop.

Take a small rectangle in the plane $z = $ constant, centered at $(x, y, z)$, with sides $\Delta x$ and $\Delta y$. Go around it **counterclockwise** as seen from above (from $+\hat{\mathbf{z}}$ looking down), and add up $\mathbf{F}\cdot d\mathbf{r}$ on each **[[edge of the loop|loop-edges]]**.

**Bottom and top edges.** The bottom edge sits at $y - \Delta y/2$ and you travel in the $+x$ direction. The part of $\mathbf{F}$ along it is $F_1$, so it contributes about $F_1(x, y - \tfrac{1}{2}\Delta y, z)\,\Delta x$. The top edge sits at $y + \Delta y/2$ and you travel in the $-x$ direction, so it contributes $-F_1(x, y + \tfrac{1}{2}\Delta y, z)\,\Delta x$. Together:

$$
-\big[F_1(x, y + \tfrac{1}{2}\Delta y, z) - F_1(x, y - \tfrac{1}{2}\Delta y, z)\big]\Delta x \approx -\frac{\partial F_1}{\partial y}\,\Delta x\,\Delta y .
$$

**Right and left edges.** On the right edge you go in $+y$, on the left in $-y$. The same argument gives $+\frac{\partial F_2}{\partial x}\,\Delta x\,\Delta y$.

**Divide by the area and shrink the loop.** The circulation per unit area about the $z$ axis is

$$
(\nabla\times\mathbf{F})_z = \frac{\partial F_2}{\partial x} - \frac{\partial F_1}{\partial y} .
$$

Do the same with loops in the other two coordinate planes. Each gives the circulation per unit area about one axis. Stack the three into a vector and you have the **curl**:

$$
\nabla\times\mathbf{F} = \begin{vmatrix} \hat{\mathbf{x}} & \hat{\mathbf{y}} & \hat{\mathbf{z}} \\ \partial/\partial x & \partial/\partial y & \partial/\partial z \\ F_1 & F_2 & F_3 \end{vmatrix}
= \begin{bmatrix} \partial F_3/\partial y - \partial F_2/\partial z \\ \partial F_1/\partial z - \partial F_3/\partial x \\ \partial F_2/\partial x - \partial F_1/\partial y \end{bmatrix}.
$$

The determinant is a memory aid. It is the same pattern as the cross product $\mathbf{a}\times\mathbf{b}$, with the derivative instructions in the middle row acting on the bottom row.

The curl is a vector. Its direction is the axis the field swirls around most strongly, by the **right-hand rule**: curl your right hand's fingers the way the field circulates, and your thumb points along the curl. Its length is that strongest circulation per unit area. Its units are those of $\mathbf{F}$ per meter. Where $\nabla\times\mathbf{F} = \mathbf{0}$, the field is **irrotational**: a tiny paddle wheel placed in it would not spin.

We write $\partial_x$ as a short form of $\partial/\partial x$ in the box below.

::: key
$\nabla\times\mathbf{F} = [\partial_y F_3 - \partial_z F_2,\ \partial_z F_1 - \partial_x F_3,\ \partial_x F_2 - \partial_y F_1]^\top$ measures the local circulation of $\mathbf{F}$ — circulation per unit area about each axis. It is zero for any gradient field: $\nabla\times(\nabla f) = \mathbf{0}$.
:::

::: example The curl of a rigid rotation is twice the angular velocity
Earth's spin carries every point on the ground with velocity $\mathbf{v} = \boldsymbol{\omega}\times\mathbf{r}$. With $\boldsymbol{\omega} = \omega_E\hat{\mathbf{z}}$ ($\omega_E$ is "omega sub E", Earth's spin rate), that is $\mathbf{v} = [-\omega_E y,\ \omega_E x,\ 0]^\top$.

**The curl.** $v_3 = 0$, and $v_1$, $v_2$ do not depend on $z$, so the first two entries are $0 - 0$. The third is

$$
\nabla\times\mathbf{v} = \left[0 - 0,\ 0 - 0,\ \frac{\partial(\omega_E x)}{\partial x} - \frac{\partial(-\omega_E y)}{\partial y}\right]^\top = [0,\ 0,\ \omega_E + \omega_E]^\top = [0, 0, 2\omega_E]^\top = 2\boldsymbol{\omega} .
$$

**The numbers.** With $\omega_E = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$, the curl is $1.4584 \times 10^{-4}\,\mathrm{s^{-1}}$ along the axis — and it is the same everywhere. It is the same at the pole as at the equator, even though the velocity itself is zero on the axis.

**Why twice?** The factor of two holds for any rigid rotation: $\nabla\times(\boldsymbol{\omega}\times\mathbf{r}) = 2\boldsymbol{\omega}$. So a fluid's local spin rate is half its **[[vorticity|vorticity-gyro]]** $\nabla\times\mathbf{v}$. And an inertial navigation system sitting still on the ground measures, through its gyroscopes, exactly half the curl of the ground's velocity field.

**Check against Lesson 7.** There the circulation of $[-y, x, 0]^\top$ (the case $\omega = 1$) around a circle of radius $2$ was $8\pi$. The curl, $2$, times the enclosed area, $\pi \cdot 2^2 = 4\pi$, is also $8\pi$. That match is Stokes' theorem, coming in Lesson 9.
:::

### Two identities

**The curl of a gradient is zero.** Take $\mathbf{F} = \nabla f$, so $F_i = \partial f/\partial x_i$. The $z$ component of its curl is

$$
\partial_x(\partial_y f) - \partial_y(\partial_x f) = 0,
$$

because **[[mixed partial derivatives|mixed-partials]]** of a smooth function agree (Lesson 1): the order you differentiate in does not matter. The other components vanish the same way:

$$
\nabla\times(\nabla f) = \mathbf{0} \quad\text{for every smooth } f .
$$

Since gravity is $\mathbf{a} = -\nabla U$, gravity is irrotational, as any force with a potential must be. Lesson 10 turns this around and asks when a curl-free field has a potential.

**The divergence of a curl is zero.** Write out $\nabla\cdot(\nabla\times\mathbf{F})$ and you get six mixed second partials of the components of $\mathbf{F}$. They cancel in pairs, by the same symmetry. So $\nabla\cdot(\nabla\times\mathbf{F}) = 0$: a curl field has no sources. The **[[magnetic field|magnetic-field]]** is the standard example. These two identities are why the two integral theorems of Lesson 9 fit together.

## The Laplacian

Put a warm pebble on a cold plate. The pebble is hotter than the average of its surroundings, so heat flows away from it. The Laplacian measures exactly that: how a value compares with the average of its neighbors.

It is the divergence of the gradient of a scalar field:

$$
\nabla^2 f = \nabla\cdot(\nabla f) = \frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2} + \frac{\partial^2 f}{\partial z^2} .
$$

Read $\nabla^2 f$ as "del squared f". It is also written $\Delta f$. It is a scalar field, with the units of $f$ per square meter. It is the trace of the Hessian of Lesson 4: the sum of the second derivatives along the three axes, which is also the sum of the Hessian's eigenvalues.

**What it means.** $\nabla^2 f$ compares the value of $f$ at a point with its **[[average over a small sphere|neighbor-average]]** around it:

- positive where $f$ sits below its neighbors' average — a little dip, with gradient arrows pointing out of it (positive divergence);
- negative where $f$ sits above the average — a little bump.

A function with $\nabla^2 f = 0$ throughout a region is **harmonic**. It equals its local average everywhere. So it can have no peak or pit inside the region: a peak is above its neighbors' average, a pit below. This matches the Hessian of the gravitational potential in Lesson 4, which was indefinite — a saddle — everywhere.

### Radial functions and the potential

For a function of distance only, $\phi(r)$ ("phi of r"), the gradient points straight out: $\nabla\phi = \phi'(r)\,\hat{\mathbf{r}} = (\phi'/r)\,\mathbf{r}$. That is a radial field with $g = \phi'/r$. Its derivative, by the quotient rule, is $g' = \phi''/r - \phi'/r^2$. The radial divergence formula $3g + rg'$ then gives

$$
\nabla^2\phi(r) = \frac{3\phi'}{r} + r\left(\frac{\phi''}{r} - \frac{\phi'}{r^2}\right) = \phi'' + \frac{2\phi'}{r}.
$$

For a power, $\phi = r^n$, we have $\phi' = n r^{n-1}$ and $\phi'' = n(n-1)r^{n-2}$, so

$$
\nabla^2(r^n) = n(n-1)r^{n-2} + 2n\,r^{n-2} = n(n+1)\,r^{n-2}.
$$

Two cases matter.

- $n = 2$: $\nabla^2(r^2) = 2 \cdot 3 = 6$. A central-difference check at a test point returns $6.000$.
- $n = -1$: $\nabla^2(1/r) = (-1)(0)\,r^{-3} = 0$. One over distance is harmonic, away from the origin.

So the two-body potential $U = -\mu/r$ satisfies

$$
\nabla^2 U = 0 \qquad (r \neq 0),
$$

**[[Laplace's equation|laplace-poisson]]**. Numerically, second differences of $U$ at $400\,\mathrm{km}$ altitude with a $100\,\mathrm{m}$ step give $3 \times 10^{-12}\,\mathrm{s^{-2}}$, while the three separate terms are about $10^{-6}\,\mathrm{s^{-2}}$ — zero, up to round-off.

For contrast, $1/r^2$ is not harmonic: $n = -2$ gives $\nabla^2(r^{-2}) = (-2)(-1)r^{-4} = 2/r^4$. A numerical check at $r = 1.87$ gives $0.1633$, and $2/r^4 = 0.1633$.

::: key
The Laplacian $\nabla^2 f = \nabla\cdot\nabla f = \partial^2 f/\partial x^2 + \partial^2 f/\partial y^2 + \partial^2 f/\partial z^2$ is the trace of the Hessian. Outside a body the gravitational potential satisfies Laplace's equation $\nabla^2 U = 0$, which is why the exterior geopotential can be expanded in spherical harmonics — they are the solutions of $\nabla^2 U = 0$. Inside matter, $\nabla^2 U = 4\pi G\rho$ (Poisson's equation).
:::

### Why the geopotential is a series of spherical harmonics

Earth is not a point, so its outside potential is not exactly $-\mu/r$. But think of Earth as a pile of tiny mass pieces. Each piece $dm$ at position $\mathbf{r}'$ adds a potential $-G\,dm/\lVert\mathbf{r} - \mathbf{r}'\rVert$ — one over distance, with the origin moved to $\mathbf{r}'$. Each of those is harmonic, by the computation above. The Laplacian of a sum is the sum of the Laplacians, so the total outside potential also satisfies $\nabla^2 U = 0$, whatever Earth's shape and inner layers.

That is a strong constraint: the outside field *must* be a solution of Laplace's equation. And the solutions that fade away far from Earth come from a known catalog. In spherical coordinates they are products $r^{-(n+1)}\,Y_n(\theta, \varphi)$, where the $Y_n$ are the **[[spherical harmonics|spherical-harmonics]]** of degree $n$. Expanding the geopotential in that catalog gives the familiar series with coefficients $J_2, J_3, \dots$ and the tesseral terms. The $J_2$ term is the degree-two member that is the same at every longitude.

**You can check the $J_2$ shape directly.** The exercise's potential depends on position through $f = (3z^2 - r^2)/r^5 = 3z^2 r^{-5} - r^{-3}$. You need the product rule for the Laplacian, $\nabla^2(fg) = f\nabla^2 g + 2\nabla f\cdot\nabla g + g\nabla^2 f$ (the ordinary product rule, used twice). The pieces:

- $\nabla(z^2) = 2z\hat{\mathbf{z}}$ and $\nabla^2(z^2) = 2$;
- $\nabla(r^{-5}) = -5r^{-7}\mathbf{r}$ and $\nabla^2(r^{-5}) = (-5)(-4)r^{-7} = 20r^{-7}$.

Put them together, using $\hat{\mathbf{z}}\cdot\mathbf{r} = z$:

$$
\nabla^2(z^2 r^{-5}) = 2r^{-5} + 2(2z\hat{\mathbf{z}})\cdot(-5r^{-7}\mathbf{r}) + 20z^2r^{-7} = 2r^{-5} - 20z^2r^{-7} + 20z^2r^{-7} = 2r^{-5}.
$$

So $\nabla^2(3z^2r^{-5}) = 6r^{-5}$. And $\nabla^2(r^{-3}) = (-3)(-2)r^{-5} = 6r^{-5}$. Subtract: zero. The $J_2$ term is harmonic, as every term of the outside geopotential must be.

A second-difference check (step $0.01$) at the point $(1, 1.5, 0.5)$ gives $1 \times 10^{-5}$, against a function value of $-0.120$ — zero within the method's error. At $400\,\mathrm{km}$ over the equator the $J_2$ potential is $-2.82 \times 10^{4}\,\mathrm{J/kg}$. That is only $4.8 \times 10^{-4}$ of the two-body $-5.88 \times 10^{7}\,\mathrm{J/kg}$, yet it is the biggest disturbance on every low Earth orbit.

::: example Poisson's equation and the mean density of Earth
Lesson 9 will show that inside matter the divergence of gravity is $\nabla\cdot\mathbf{a} = -4\pi G\rho$, where $G$ is the gravitational constant and $\rho$ the density. Since $\mathbf{a} = -\nabla U$, that gives $\nabla^2 U = 4\pi G\rho$ — **Poisson's equation**. Where $\rho = 0$ it becomes Laplace's.

**Gravity inside a uniform ball.** Take a sphere of radius $R$ and constant density $\rho$. By symmetry the field inside points straight in, $\mathbf{a} = g(r)\,\mathbf{r}$. The radial divergence formula says

$$
3g + rg' = -4\pi G\rho .
$$

The solution that stays finite at the center is the constant $g = -\tfrac{4}{3}\pi G\rho$ (then $g' = 0$ and $3g = -4\pi G\rho$). So inside, $\mathbf{a} = -\tfrac{4}{3}\pi G\rho\,\mathbf{r}$: gravity grows in proportion to the distance from the center. At the surface its size is

$$
g_{\text{surf}} = \tfrac{4}{3}\pi G\rho R .
$$

**Solve for the density.** $\rho = 3g_{\text{surf}}/(4\pi G R)$. With $g_{\text{surf}} = 9.82\,\mathrm{m/s^2}$, $R = 6371\,\mathrm{km}$ and $G = 6.6743 \times 10^{-11}\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$:

$$
\rho = \frac{3 \times 9.82}{4\pi \times 6.6743\times 10^{-11}\times 6.371\times 10^{6}} = \frac{29.46}{5.343\times 10^{-3}} = 5513\,\mathrm{kg/m^3}.
$$

**Sanity check.** That matches the value from $\mu/G$ and the volume in Lesson 6. It is about $5.5$ times water — more than surface rock at about $2700\,\mathrm{kg/m^3}$, as it should be, since Earth's iron core is much denser.

The Laplacian of the potential inside Earth is then, on average, $4\pi G\rho = 4.62 \times 10^{-6}\,\mathrm{s^{-2}}$. That is the same size as the tidal terms $\mu/r^3$ of Lesson 3. No coincidence: both are of order $G\rho$.
:::

::: warning One symbol, two meanings
$\nabla^2 f$ is a number at each point (the Laplacian) when $f$ is a scalar field. But optimization books, including Lesson 4, also write $\nabla^2 f$ for the Hessian *matrix*. The Laplacian is the trace of the Hessian. When you see $\nabla^2$, check whether the result is being used as a number or as a matrix.
:::

::: warning Do not judge by the look of the arrows
Divergence is not "the arrows point outward", and curl is not "the arrows go round". The inverse-square field points inward everywhere yet has zero divergence. The **[[shear flow|shear-paddle]]** $\mathbf{v} = [y, 0, 0]^\top$ runs in straight lines yet has curl $[0, 0, -1]^\top$, because a paddle wheel in it is pushed harder on one side than the other. Trust the derivatives, not the picture.
:::

## Check yourself

::: check
Compute the divergence and curl of $\mathbf{F} = [x^2,\ 2xy,\ -z^2]^\top$ at $(1, 1, 2)$.
:::

::: answer
**Divergence.** $\partial_x(x^2) + \partial_y(2xy) + \partial_z(-z^2) = 2x + 2x - 2z = 4x - 2z$. At $(1, 1, 2)$: $4 - 4 = 0$.

**Curl**, entry by entry:

- $\partial_y(-z^2) - \partial_z(2xy) = 0 - 0 = 0$;
- $\partial_z(x^2) - \partial_x(-z^2) = 0 - 0 = 0$;
- $\partial_x(2xy) - \partial_y(x^2) = 2y - 0 = 2y$.

So $\nabla\times\mathbf{F} = [0, 0, 2y]^\top$, which is $[0, 0, 2]^\top$ at that point. The field neither gains nor loses volume there, but it does swirl about the $z$ axis. Since its curl is not zero, it is not a gradient field.
:::

::: check
Show that $f(x, y, z) = x^2 - y^2$ is harmonic, and explain why it cannot have a maximum or minimum anywhere.
:::

::: answer
The second derivatives are $\partial^2 f/\partial x^2 = 2$, $\partial^2 f/\partial y^2 = -2$ and $\partial^2 f/\partial z^2 = 0$. They add to $\nabla^2 f = 0$, so $f$ is harmonic.

Its Hessian is $\operatorname{diag}(2, -2, 0)$ at every point: indefinite, curving up along $x$ and down along $y$. So any stationary point is a saddle. In general, a zero trace means the eigenvalues add to zero, so a positive one always comes with a negative one. That is the situation for every harmonic function, and it is why a gravitational potential has no minimum in empty space.
:::

::: check
In a stretch of a rocket nozzle, modeled as flow along $x$ only, the gas velocity is $\mathbf{v} = [v_0(1 + x/L),\ 0,\ 0]^\top$ with $v_0 = 500\,\mathrm{m/s}$ and $L = 0.5\,\mathrm{m}$. What is $\nabla\cdot\mathbf{v}$, and what does its sign say about the gas?
:::

::: answer
Only the first component changes, and only with $x$: $\nabla\cdot\mathbf{v} = \partial_x[v_0(1 + x/L)] = v_0/L = 500/0.5 = 1000\,\mathrm{s^{-1}}$. It is positive and the same everywhere.

A positive divergence of velocity means each parcel of gas is expanding: its volume grows at the fractional rate $\nabla\cdot\mathbf{v}$. Its density therefore falls at the rate $\dot\rho/\rho = -\nabla\cdot\mathbf{v}$ (Lesson 9 derives this from conservation of mass). At $1000\,\mathrm{s^{-1}}$ a parcel thins out by a factor of $e \approx 2.72$ in $1/1000\,\mathrm{s} = 1\,\mathrm{ms}$. That is what happens to a compressible gas speeding up through a nozzle.
:::

::: check
Without computing anything, state the curl of $\mathbf{F} = \nabla(x^2 y z + \sin z)$ and the divergence of $\mathbf{G} = \nabla\times[x^2 y,\ e^z,\ \cos(xy)]^\top$.
:::

::: answer
Both are zero. $\mathbf{F}$ is a gradient, and the curl of any gradient vanishes because mixed second partials agree: $\nabla\times\mathbf{F} = \mathbf{0}$. $\mathbf{G}$ is a curl, and the divergence of any curl vanishes for the same reason: $\nabla\cdot\mathbf{G} = 0$. These identities hold however complicated the functions are, as long as their second derivatives exist and are continuous — which is true here.
:::

::: check
Use the divergence to explain why the gravity of a point mass falls off as exactly $1/r^2$ and not some other power.
:::

::: answer
Away from the mass there are no sources, so $\nabla\cdot\mathbf{a} = 0$. For a radial field $\mathbf{a} = g(r)\,\mathbf{r}$ this means $3g + rg' = 0$, so $g'/g = -3/r$ and $g = C r^{-3}$ for some constant $C$. The field's size is then $\lVert\mathbf{a}\rVert = \lvert g\rvert\,r = \lvert C\rvert/r^2$.

Any other power would have nonzero divergence, and would need sources or sinks spread through empty space. Put another way: the flux $-4\pi\mu$ through a sphere must be the same at every radius (Lesson 7), and only $1/r^2$ keeps "field times area $4\pi r^2$" constant.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\nabla = [\partial_x, \partial_y, \partial_z]^\top$ | del: $\nabla f$ gradient, $\nabla\cdot\mathbf{F}$ divergence, $\nabla\times\mathbf{F}$ curl |
| $\nabla\cdot\mathbf{F} = \partial_x F_1 + \partial_y F_2 + \partial_z F_3$ | net outflow per unit volume; trace of the Jacobian |
| $\nabla\cdot(g\,\mathbf{r}) = 3g + rg'$; $\nabla\cdot\mathbf{r} = 3$; $\nabla\cdot(\mathbf{r}/r^3) = 0$ | radial fields; inverse-square gravity has zero divergence for $r \neq 0$ |
| $\nabla\times\mathbf{F} = [\partial_y F_3 - \partial_z F_2,\ \partial_z F_1 - \partial_x F_3,\ \partial_x F_2 - \partial_y F_1]^\top$ | local circulation per unit area about each axis |
| $\nabla\times(\boldsymbol{\omega}\times\mathbf{r}) = 2\boldsymbol{\omega}$ | rigid rotation: curl is twice the angular velocity ($1.46 \times 10^{-4}\,\mathrm{s^{-1}}$ for Earth) |
| $\nabla\times\nabla f = \mathbf{0}$, $\nabla\cdot(\nabla\times\mathbf{F}) = 0$ | gradients do not swirl; curls have no sources |
| $\nabla^2 f = \nabla\cdot\nabla f = \partial_x^2 f + \partial_y^2 f + \partial_z^2 f$ | Laplacian; trace of the Hessian |
| $\nabla^2\phi(r) = \phi'' + 2\phi'/r$; $\nabla^2(r^n) = n(n+1)r^{n-2}$ | radial Laplacian; $\nabla^2(1/r) = 0$ |
| $\nabla^2 U = 0$ outside matter | Laplace's equation; the outside geopotential is a series of spherical harmonics |
| $\nabla^2 U = 4\pi G\rho$ inside matter | Poisson's equation; $4.62 \times 10^{-6}\,\mathrm{s^{-2}}$ for Earth's mean density |

Next lesson adds the tiny boxes and tiny loops back up. The flux out of a closed surface equals the volume integral of the divergence inside it; the circulation around a closed curve equals the surface integral of the curl across it. These are the divergence and Stokes theorems, and the first one proves that a round planet pulls like a point mass.

::: context nabla-name An upside-down triangle
The symbol $\nabla$ is an upside-down capital delta, $\Delta$. People call it "del" or "nabla". "Nabla" is the Greek name of a kind of harp, which the triangle was thought to resemble. Whatever you call it, it is not a number or a vector you can measure. It is an instruction waiting for something to act on — the way "double it" means nothing until you say what to double.
:::

::: context box-flux Counting what goes in and out
Here field arrows cross a small box along $x$. On the left the arrow entering is short; on the right the arrow leaving is long. More leaves than enters, so the box holds a source: positive divergence. When the two match, the divergence is zero, however big the arrows are.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="65" y="40" width="60" height="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="70" x2="56" y2="70" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="65,70 55,65 55,75" fill="#1d6fd1"/>
  <line x1="125" y1="70" x2="161" y2="70" stroke="#b4232c" stroke-width="3"/>
  <polygon points="170,70 160,65 160,75" fill="#b4232c"/>
  <text x="95" y="125" font-size="12" text-anchor="middle" fill="#1f2a44">in 35, out 45</text>
  <text x="95" y="142" font-size="12" text-anchor="middle" fill="#1f2a44">source: ∇·F &gt; 0</text>
  <rect x="245" y="40" width="60" height="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="200" y1="70" x2="236" y2="70" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="245,70 235,65 235,75" fill="#1d6fd1"/>
  <line x1="305" y1="70" x2="341" y2="70" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="350,70 340,65 340,75" fill="#1d6fd1"/>
  <text x="275" y="125" font-size="12" text-anchor="middle" fill="#1f2a44">in 45, out 45</text>
  <text x="275" y="142" font-size="12" text-anchor="middle" fill="#1f2a44">∇·F = 0</text>
</svg>
```
:::

::: context trace-word The trace of a matrix
The **trace** of a square matrix is the sum of the numbers on its main diagonal, from top left to bottom right. For $\begin{bmatrix} 2 & 7 \\ 1 & 5 \end{bmatrix}$ it is $2 + 5 = 7$; the off-diagonal $7$ and $1$ are ignored. A useful fact: the trace also equals the sum of the matrix's eigenvalues. That is why a zero-trace Hessian must have eigenvalues of both signs (unless all are zero).
:::

::: context spreading-lines Same lines, bigger sphere
Draw gravity as lines running into the planet. Every line that crosses a small sphere also crosses a sphere twice as big. The big sphere has four times the area, so the lines there are four times as thin — the field is four times weaker. That is the inverse-square law, and it works only because no lines start or end in the empty space between: zero divergence.
:::

::: context loop-edges Adding up around a tiny loop
Go counterclockwise around the rectangle. On the bottom you travel with $F_1$; on the top, against it. On the right you travel with $F_2$; on the left, against it. What survives is how much $F_1$ changes from bottom to top and how much $F_2$ changes from left to right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <g stroke="#1d6fd1" stroke-width="3" fill="none">
    <line x1="120" y1="140" x2="232" y2="140"/>
    <line x1="240" y1="140" x2="240" y2="58"/>
    <line x1="240" y1="50" x2="128" y2="50"/>
    <line x1="120" y1="50" x2="120" y2="132"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="190,140 178,134 178,146"/>
    <polygon points="240,90 234,102 246,102"/>
    <polygon points="170,50 182,44 182,56"/>
    <polygon points="120,100 114,88 126,88"/>
  </g>
  <text x="180" y="165" font-size="12" text-anchor="middle" fill="#1f2a44">+F₁ at y − Δy/2</text>
  <text x="180" y="35" font-size="12" text-anchor="middle" fill="#1f2a44">−F₁ at y + Δy/2</text>
  <text x="250" y="99" font-size="12" fill="#1f2a44">+F₂ at x + Δx/2</text>
  <text x="110" y="99" font-size="12" text-anchor="end" fill="#1f2a44">−F₂ at x − Δx/2</text>
  <text x="180" y="99" font-size="12" text-anchor="middle" fill="#6c7a93">Δx by Δy</text>
</svg>
```
:::

::: context vorticity-gyro Vorticity and a gyroscope on the ground
**Vorticity** is the name for the curl of a velocity field. Weather forecasters use it to spot spinning storm systems. For Earth's ground, the vorticity is $2\omega_E$ everywhere. A navigation-grade gyroscope sitting still on a launch pad senses Earth's spin, $\omega_E$ — about $15.04$ degrees per hour. Some inertial systems use that tiny signal to find true north before launch, a trick called gyrocompassing.
:::

::: context mixed-partials Why the order does not matter
For a smooth function, "change $x$, then $y$" and "change $y$, then $x$" give the same second derivative: $\partial_x\partial_y f = \partial_y\partial_x f$. Picture a small rectangle on a hill. The difference in height from one corner to the opposite corner is the same whichever way round the rectangle you walk. That shared "corner-to-corner" change is what both mixed partials measure.
:::

::: context magnetic-field A field with no sources
A magnet's field lines always form closed loops: out of the north pole, round, and back in at the south pole. Nobody has ever found a lone magnetic pole — a point where lines start or end. So the magnetic field has zero divergence everywhere, which fits it being a curl. Many small satellites measure Earth's magnetic field with a magnetometer to help work out which way they are pointing.
:::

::: context neighbor-average The Laplacian as "you minus your neighbors"
Average $f$ over a tiny sphere of radius $h$ around a point. The average differs from the center value by about $\tfrac{h^2}{6}\nabla^2 f$. So $\nabla^2 f > 0$ means the neighbors are higher on average — you sit in a dip. For $f = r^2$ around the origin, the average over the sphere is $h^2$, the center value is $0$, and $\tfrac{h^2}{6}\times 6 = h^2$. Heat flow, diffusion and gravity all use this "compare with the neighbors" idea.
:::

::: context laplace-poisson Two French mathematicians
Pierre-Simon Laplace worked with this equation in the late 1700s while studying how bodies attract one another under gravity. In the early 1800s Siméon Denis Poisson showed that inside matter the right-hand side is not zero but proportional to the density. You meet their equations again wherever something spreads out smoothly: heat in a wall, electric fields, slow steady fluid flow.
:::

::: context spherical-harmonics Patterns on a sphere
Spherical harmonics are standard wave patterns drawn on a sphere, the way sines and cosines are standard waves along a line. Degree $0$ is the same everywhere. Degree $2$ with no longitude dependence, $3\sin^2\phi - 1$ in latitude $\phi$, is bigger at the poles than at the equator: the pattern of Earth's equatorial bulge, and the shape of the $J_2$ term. Gravity models used for orbit work add up hundreds of degrees of these patterns.
:::

::: context shear-paddle A straight flow that still spins a wheel
In the flow $\mathbf{v} = [y, 0, 0]^\top$, water above the wheel moves right and water below moves left. Every arrow is straight, yet the wheel turns clockwise — the curl points into the page, $[0, 0, -1]^\top$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="40" y1="30" x2="92" y2="30"/><line x1="55" y1="60" x2="77" y2="60"/>
    <line x1="85" y1="120" x2="63" y2="120"/><line x1="100" y1="150" x2="48" y2="150"/>
    <line x1="250" y1="30" x2="302" y2="30"/><line x1="265" y1="60" x2="287" y2="60"/>
    <line x1="295" y1="120" x2="273" y2="120"/><line x1="310" y1="150" x2="258" y2="150"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="100,30 90,25 90,35"/><polygon points="85,60 75,55 75,65"/>
    <polygon points="55,120 65,115 65,125"/><polygon points="40,150 50,145 50,155"/>
    <polygon points="310,30 300,25 300,35"/><polygon points="295,60 285,55 285,65"/>
    <polygon points="265,120 275,115 275,125"/><polygon points="250,150 260,145 260,155"/>
  </g>
  <circle cx="70" cy="90" r="3" fill="#1d6fd1"/><circle cx="280" cy="90" r="3" fill="#1d6fd1"/>
  <circle cx="180" cy="90" r="26" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="180" y1="64" x2="180" y2="116"/><line x1="154" y1="90" x2="206" y2="90"/>
  </g>
  <path d="M158,58 A40,40 0 0,1 212,62" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="216,66 205,63 213,55" fill="#b4232c"/>
  <text x="180" y="150" font-size="12" text-anchor="middle" fill="#b4232c">spins clockwise</text>
  <text x="180" y="180" font-size="12" text-anchor="middle" fill="#1f2a44">arrow length ∝ height y</text>
</svg>
```
:::
