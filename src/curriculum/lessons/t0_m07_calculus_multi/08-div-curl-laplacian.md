---
id: l08-div-curl-laplacian
title: Divergence, curl and the Laplacian
minutes: 25
covers:
  - divergence, curl, Laplacian
---

A vector field assigns an arrow to every point: the gravitational acceleration around a planet, the wind over a launch site, the velocity of propellant in a feed line. Lesson 7 measured two global properties of such a field — the flux through a surface and the circulation around a curve. This lesson defines their local, pointwise counterparts. The **divergence** of a field at a point is the flux out of an infinitesimal volume there, per unit volume: it tells you whether the point is a source, a sink or neither. The **curl** is the circulation around an infinitesimal loop, per unit area: it tells you whether the field swirls locally, and about which axis. Both are built from partial derivatives, and both are needed to state the two integral theorems of Lesson 9 and the conservative-field criterion of Lesson 10.

The third operator, the **Laplacian**, is the divergence of a gradient. Applied to the gravitational potential it gives zero everywhere outside the attracting body: Laplace's equation. That equation is the reason the geopotential can be written as a series of spherical harmonics — the $J_2$ term of the module's exercise is one of them — and it is also why the gravity-gradient matrix of Lesson 3 has zero trace. Inside matter the Laplacian of the potential is proportional to the density, which is Poisson's equation, and Lesson 9 derives it.

## The del operator

Lesson 2 wrote the gradient with the symbol $\nabla$. It helps to treat $\nabla$ as a vector of differentiation operators,

$$
\nabla = \hat{\mathbf{x}}\,\frac{\partial}{\partial x} + \hat{\mathbf{y}}\,\frac{\partial}{\partial y} + \hat{\mathbf{z}}\,\frac{\partial}{\partial z} = \begin{bmatrix} \partial/\partial x \\ \partial/\partial y \\ \partial/\partial z \end{bmatrix},
$$

which can be "multiplied" onto a scalar field $f$ to give the gradient $\nabla f$, or dotted and crossed with a vector field $\mathbf{F} = [F_1, F_2, F_3]^\top$ to give two new fields. The dot product $\nabla\cdot\mathbf{F}$ is a scalar field, the divergence. The cross product $\nabla\times\mathbf{F}$ is a vector field, the curl. Formally each is obtained by writing out the ordinary dot or cross product and letting each $\partial/\partial x_i$ act on the component it multiplies. The formulas below can be taken as the definitions; the derivations show why they measure what they measure.

## Divergence

### Flux out of a small box

Centre a small box of sides $\Delta x$, $\Delta y$, $\Delta z$ at the point $(x, y, z)$ and compute the outward flux of $\mathbf{F}$ through its six faces, as in Lesson 7. On the face at $x + \Delta x/2$ the outward normal is $+\hat{\mathbf{x}}$, the normal component is $F_1$, and the flux is about $F_1(x + \Delta x/2, y, z)\,\Delta y\,\Delta z$. On the opposite face the normal is $-\hat{\mathbf{x}}$ and the flux is $-F_1(x - \Delta x/2, y, z)\,\Delta y\,\Delta z$. Their sum is

$$
\big[F_1(x + \tfrac{1}{2}\Delta x, y, z) - F_1(x - \tfrac{1}{2}\Delta x, y, z)\big]\Delta y\,\Delta z \approx \frac{\partial F_1}{\partial x}\,\Delta x\,\Delta y\,\Delta z ,
$$

by the definition of the partial derivative. The $y$ and $z$ face pairs contribute $\partial F_2/\partial y$ and $\partial F_3/\partial z$ times the same volume $\Delta V = \Delta x\,\Delta y\,\Delta z$. Dividing the total outward flux by the volume and letting the box shrink defines the divergence:

$$
\nabla\cdot\mathbf{F} = \lim_{\Delta V \to 0}\frac{1}{\Delta V}\oiint_{\partial(\Delta V)}\mathbf{F}\cdot\hat{\mathbf{n}}\,dS = \frac{\partial F_1}{\partial x} + \frac{\partial F_2}{\partial y} + \frac{\partial F_3}{\partial z} .
$$

The divergence is the **net outflow per unit volume**. Where it is positive, more field leaves a small neighbourhood than enters — a source. Where it is negative, a sink. Where it is zero the field passes through without accumulating or depleting. Its units are those of $\mathbf{F}$ divided by metres: for a velocity field, $\mathrm{s^{-1}}$; for an acceleration field, $\mathrm{s^{-2}}$. Note that the divergence is also the trace of the Jacobian of $\mathbf{F}$, the sum of its diagonal entries $\partial F_i/\partial x_i$.

::: key
$\nabla\cdot\mathbf{F} = \partial F_1/\partial x + \partial F_2/\partial y + \partial F_3/\partial z$ — the net outflow of $\mathbf{F}$ per unit volume at a point. It equals the trace of the Jacobian $\partial\mathbf{F}/\partial\mathbf{x}$.
:::

### Divergence of radial fields

The position field $\mathbf{F} = \mathbf{r} = [x, y, z]^\top$ has $\nabla\cdot\mathbf{r} = 1 + 1 + 1 = 3$: space is expanding uniformly away from the origin, and every point is a source of equal strength. This is the divergence of Lesson 7's flux example, where $\oiint\mathbf{r}\cdot\hat{\mathbf{n}}\,dS$ was three times the volume.

For a field of the form $g(r)\,\mathbf{r}$ — any radial field, with a magnitude depending only on distance — the product rule for a scalar times a vector gives

$$
\nabla\cdot(g\,\mathbf{r}) = g\,\nabla\cdot\mathbf{r} + \mathbf{r}\cdot\nabla g = 3g + r\,g'(r),
$$

using $\nabla g(r) = g'(r)\,\hat{\mathbf{r}}$ from Lesson 4 and $\mathbf{r}\cdot\hat{\mathbf{r}} = r$. (The product rule itself follows from differentiating each term $g\,x_i$: $\partial(g x_i)/\partial x_i = g + x_i\,\partial g/\partial x_i$, summed over $i$.) For two-body gravity, $\mathbf{a} = -\mu\,\mathbf{r}/r^3$, take $g = -\mu r^{-3}$, so $g' = 3\mu r^{-4}$ and

$$
\nabla\cdot\mathbf{a} = 3(-\mu r^{-3}) + r\,(3\mu r^{-4}) = -\frac{3\mu}{r^3} + \frac{3\mu}{r^3} = 0 \qquad (r \neq 0).
$$

The gravitational field has zero divergence everywhere except at the mass itself. That is what the inverse-square law means locally: the field lines that enter any small region leave it again, none are created or destroyed, and the field weakens with distance only because the same lines spread over a larger area. A central difference of $\nabla\cdot\mathbf{a}$ at $(7000, 100, -200)\,\mathrm{km}$ gives $4 \times 10^{-21}$ in units where each term is about $9 \times 10^{-12}$: zero to round-off. This is also the zero trace of the gravity-gradient matrix in Lesson 3, since $\mathbf{G} = \partial\mathbf{a}/\partial\mathbf{r}$ and the divergence is its trace.

::: example Divergence and curl of a polynomial field
Let $\mathbf{F} = [xy,\ yz,\ zx]^\top$. The divergence is $\partial(xy)/\partial x + \partial(yz)/\partial y + \partial(zx)/\partial z = y + z + x$; at $(1, 2, 3)$ it is $6$. The curl, from the formula in the next section, is

$$
\nabla\times\mathbf{F} = \left[\frac{\partial(zx)}{\partial y} - \frac{\partial(yz)}{\partial z},\ \frac{\partial(xy)}{\partial z} - \frac{\partial(zx)}{\partial x},\ \frac{\partial(yz)}{\partial x} - \frac{\partial(xy)}{\partial y}\right]^\top = [-y,\ -z,\ -x]^\top,
$$

equal to $[-2, -3, -1]^\top$ at $(1, 2, 3)$. Central differences with step $10^{-3}$ reproduce $6.000$ and $[-2.000, -3.000, -1.000]^\top$ to twelve digits. Both operators are linear and act term by term, so a field given as a formula is differentiated exactly as in Lesson 1: freeze the other variables and differentiate.
:::

A velocity field with $\nabla\cdot\mathbf{v} = 0$ is **incompressible**: fluid neither piles up nor thins out anywhere, and what flows into a duct section must flow out. Rigid-body rotation $\mathbf{v} = \boldsymbol{\omega}\times\mathbf{r} = [-\omega y, \omega x, 0]^\top$ has divergence $0 + 0 + 0 = 0$, as it must — a rigid body does not change volume.

## Curl

### Circulation around a small loop

Now compute the circulation of $\mathbf{F}$ around a small rectangle in the plane $z = $ const, centred at $(x, y, z)$ with sides $\Delta x$ and $\Delta y$, traversed counter-clockwise when viewed from $+\hat{\mathbf{z}}$. Along the bottom edge (at $y - \Delta y/2$, going in the $+x$ direction) the tangential component is $F_1$ and the contribution is about $F_1(x, y - \tfrac{1}{2}\Delta y, z)\,\Delta x$. Along the top edge, going in the $-x$ direction, it is $-F_1(x, y + \tfrac{1}{2}\Delta y, z)\,\Delta x$. Together,

$$
-\big[F_1(x, y + \tfrac{1}{2}\Delta y, z) - F_1(x, y - \tfrac{1}{2}\Delta y, z)\big]\Delta x \approx -\frac{\partial F_1}{\partial y}\,\Delta x\,\Delta y .
$$

The right edge ($+y$ direction, at $x + \Delta x/2$) and left edge ($-y$ direction) give $+\partial F_2/\partial x\,\Delta x\,\Delta y$ by the same argument. The circulation per unit area of the loop, in the limit, is

$$
(\nabla\times\mathbf{F})_z = \frac{\partial F_2}{\partial x} - \frac{\partial F_1}{\partial y} .
$$

Repeating for loops in the other two coordinate planes, and assembling the three results into a vector whose component along each axis is the circulation per unit area of the loop perpendicular to that axis, gives the **curl**:

$$
\nabla\times\mathbf{F} = \begin{vmatrix} \hat{\mathbf{x}} & \hat{\mathbf{y}} & \hat{\mathbf{z}} \\ \partial/\partial x & \partial/\partial y & \partial/\partial z \\ F_1 & F_2 & F_3 \end{vmatrix}
= \begin{bmatrix} \partial F_3/\partial y - \partial F_2/\partial z \\ \partial F_1/\partial z - \partial F_3/\partial x \\ \partial F_2/\partial x - \partial F_1/\partial y \end{bmatrix}.
$$

The determinant is a mnemonic for the same cross-product pattern as $\mathbf{a}\times\mathbf{b}$, with the operator entries acting on the third row. The curl is a vector: its direction is the axis about which the field circulates most strongly (by the right-hand rule), and its magnitude is that maximal circulation per unit area. Its units are those of $\mathbf{F}$ per metre. Where $\nabla\times\mathbf{F} = \mathbf{0}$ the field is **irrotational** — a tiny paddle wheel placed in the field would not spin.

::: key
$\nabla\times\mathbf{F} = [\partial_y F_3 - \partial_z F_2,\ \partial_z F_1 - \partial_x F_3,\ \partial_x F_2 - \partial_y F_1]^\top$ measures the local circulation of $\mathbf{F}$ — circulation per unit area about each axis. It is zero for any gradient field: $\nabla\times(\nabla f) = \mathbf{0}$.
:::

::: example The curl of a rigid rotation is twice the angular velocity
Earth's rotation carries every fixed point with velocity $\mathbf{v} = \boldsymbol{\omega}\times\mathbf{r}$, and for $\boldsymbol{\omega} = \omega_E\hat{\mathbf{z}}$ this is $\mathbf{v} = [-\omega_E y,\ \omega_E x,\ 0]^\top$. Its curl is

$$
\nabla\times\mathbf{v} = \left[0 - 0,\ 0 - 0,\ \frac{\partial(\omega_E x)}{\partial x} - \frac{\partial(-\omega_E y)}{\partial y}\right]^\top = [0, 0, 2\omega_E]^\top = 2\boldsymbol{\omega} .
$$

With $\omega_E = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$ the curl is $1.4584 \times 10^{-4}\,\mathrm{s^{-1}}$ along the axis, everywhere — the same at the pole as at the equator, even though the velocity itself is zero on the axis. The factor of two is general: for any rigid rotation, $\nabla\times(\boldsymbol{\omega}\times\mathbf{r}) = 2\boldsymbol{\omega}$. A fluid's local angular velocity is therefore half its **vorticity** $\nabla\times\mathbf{v}$, and an inertial navigation system on a stationary vehicle measures, through its gyroscopes, exactly half the curl of the ground's velocity field.

Compare Lesson 7's direct computation: the circulation of $[-y, x, 0]^\top$ (the case $\omega = 1$) around a circle of radius $2$ was $8\pi$, and the curl $2$ times the enclosed area $4\pi$ is also $8\pi$. That equality is Stokes' theorem, coming in Lesson 9.
:::

### Two identities

**The curl of a gradient is zero.** Take $\mathbf{F} = \nabla f$, so $F_i = \partial f/\partial x_i$. The $z$ component of the curl is $\partial_x(\partial_y f) - \partial_y(\partial_x f)$, which vanishes because mixed partial derivatives of a smooth function agree (Lesson 1). The other components vanish the same way:

$$
\nabla\times(\nabla f) = \mathbf{0} \quad\text{for every smooth } f .
$$

Since $\mathbf{a} = -\nabla U$, gravity is irrotational, as any force with a potential must be. Lesson 10 turns this around and asks when a curl-free field has a potential.

**The divergence of a curl is zero.** Expanding $\nabla\cdot(\nabla\times\mathbf{F})$ gives six mixed second partials of the components of $\mathbf{F}$ which cancel in pairs by the same symmetry, so $\nabla\cdot(\nabla\times\mathbf{F}) = 0$: a curl field has no sources. The magnetic field is the standard example. Both identities are the reason the two integral theorems of Lesson 9 fit together.

## The Laplacian

The divergence of the gradient of a scalar field is the **Laplacian**,

$$
\nabla^2 f = \nabla\cdot(\nabla f) = \frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2} + \frac{\partial^2 f}{\partial z^2},
$$

also written $\Delta f$. It is a scalar field with the units of $f$ per square metre, and it is the trace of the Hessian of Lesson 4: the sum of the second derivatives along the three axes, which is also the sum of the Hessian's eigenvalues. Intuitively, $\nabla^2 f$ compares the value of $f$ at a point with its average over a small surrounding sphere: positive where $f$ sits below its neighbours' average (a local dip, gradient arrows pointing out, positive divergence), negative where it sits above. A function with $\nabla^2 f = 0$ throughout a region is **harmonic** and equals its local average everywhere, which forbids it from having a maximum or minimum inside the region — consistent with the indefinite Hessian of the gravitational potential found in Lesson 4.

### Radial functions and the potential

For a function of distance only, $\phi(r)$, the gradient is $\phi'(r)\,\hat{\mathbf{r}} = (\phi'/r)\,\mathbf{r}$, a radial field with $g = \phi'/r$. The divergence formula $3g + rg'$ gives

$$
\nabla^2\phi(r) = \frac{3\phi'}{r} + r\left(\frac{\phi''}{r} - \frac{\phi'}{r^2}\right) = \phi'' + \frac{2\phi'}{r}, \qquad\text{so}\qquad \nabla^2(r^n) = n(n-1)r^{n-2} + 2n\,r^{n-2} = n(n+1)\,r^{n-2}.
$$

Two cases matter. For $n = 2$, $\nabla^2(r^2) = 6$, and a central difference at a test point returns $6.000$. For $n = -1$, $\nabla^2(1/r) = (-1)(0)\,r^{-3} = 0$: the inverse distance is harmonic away from the origin. The two-body potential $U = -\mu/r$ therefore satisfies

$$
\nabla^2 U = 0 \qquad (r \neq 0),
$$

**Laplace's equation**. Numerically, second differences of $U$ at $400\,\mathrm{km}$ altitude with a $100\,\mathrm{m}$ step give $3 \times 10^{-12}\,\mathrm{s^{-2}}$ against individual terms of order $10^{-6}\,\mathrm{s^{-2}}$ — zero to round-off. For contrast, $1/r^2$ is not harmonic: $\nabla^2(r^{-2}) = (-2)(-1)r^{-4} = 2/r^4$, and a numerical check at $r = 1.87$ gives $0.1633$ against $2/r^4 = 0.1633$.

::: key
The Laplacian $\nabla^2 f = \nabla\cdot\nabla f = \partial^2 f/\partial x^2 + \partial^2 f/\partial y^2 + \partial^2 f/\partial z^2$ is the trace of the Hessian. Outside a body the gravitational potential satisfies Laplace's equation $\nabla^2 U = 0$, which is why the exterior geopotential can be expanded in spherical harmonics — they are the solutions of $\nabla^2 U = 0$. Inside matter, $\nabla^2 U = 4\pi G\rho$ (Poisson's equation).
:::

### Why the geopotential is a series of spherical harmonics

Earth is not a point mass, so its exterior potential is not exactly $-\mu/r$. But whatever its shape and internal density, the potential outside it is a sum of the potentials of its mass elements, each of the form $-G\,dm/\lVert\mathbf{r} - \mathbf{r}'\rVert$, and each of those is harmonic in $\mathbf{r}$ by the computation above (the origin shifted to $\mathbf{r}'$). The Laplacian is linear, so the total exterior potential satisfies $\nabla^2 U = 0$. Everything you can know about the exterior field is therefore constrained to be a solution of Laplace's equation, and the solutions of Laplace's equation that decay at infinity have a known catalogue: in spherical coordinates they are products $r^{-(n+1)}\,Y_n(\theta, \varphi)$ where the $Y_n$ are the **spherical harmonics** of degree $n$. Expanding the geopotential in that catalogue gives the familiar series with coefficients $J_2, J_3, \dots$ and the tesseral terms; the $J_2$ term is the degree-two, axially symmetric member.

You can verify the $J_2$ shape directly. The exercise's potential has the angular and radial dependence $f = (3z^2 - r^2)/r^5 = 3z^2 r^{-5} - r^{-3}$. Using $\nabla^2(fg) = f\nabla^2 g + 2\nabla f\cdot\nabla g + g\nabla^2 f$ (the product rule applied twice), with $\nabla(z^2) = 2z\hat{\mathbf{z}}$, $\nabla^2(z^2) = 2$, $\nabla(r^{-5}) = -5r^{-7}\mathbf{r}$ and $\nabla^2(r^{-5}) = (-5)(-4)r^{-7} = 20r^{-7}$:

$$
\nabla^2(z^2 r^{-5}) = 2r^{-5} + 2(2z\hat{\mathbf{z}})\cdot(-5r^{-7}\mathbf{r}) + 20z^2r^{-7} = 2r^{-5} - 20z^2r^{-7} + 20z^2r^{-7} = 2r^{-5},
$$

so $\nabla^2(3z^2r^{-5}) = 6r^{-5}$, while $\nabla^2(r^{-3}) = (-3)(-2)r^{-5} = 6r^{-5}$. The difference is zero: the $J_2$ term is harmonic, as every term of the exterior geopotential must be. A second-difference check at the point $(1, 1.5, 0.5)$ gives $1 \times 10^{-5}$ against a function value of $-0.120$, zero within finite-difference error. At $400\,\mathrm{km}$ over the equator the $J_2$ potential is $-2.82 \times 10^{4}\,\mathrm{J/kg}$, a fraction $4.8 \times 10^{-4}$ of the two-body $-5.88 \times 10^{7}\,\mathrm{J/kg}$, yet it is the dominant perturbation of every low Earth orbit.

::: example Poisson's equation and the mean density of Earth
Lesson 9 will show that inside matter the divergence of the gravitational field is $\nabla\cdot\mathbf{a} = -4\pi G\rho$, so with $\mathbf{a} = -\nabla U$, $\nabla^2 U = 4\pi G\rho$ — **Poisson's equation**, which reduces to Laplace's where $\rho = 0$. For a uniform sphere of density $\rho$ and radius $R$ the field inside must be radial and, by the divergence formula $3g + rg'$ with $\mathbf{a} = g(r)\,\mathbf{r}$, satisfy $3g + rg' = -4\pi G\rho$, whose solution finite at the centre is the constant $g = -\tfrac{4}{3}\pi G\rho$. So $\mathbf{a} = -\tfrac{4}{3}\pi G\rho\,\mathbf{r}$ inside, growing linearly with radius, and at the surface its magnitude is $g_{\text{surf}} = \tfrac{4}{3}\pi G\rho R$.

Solve for the density: $\rho = 3g_{\text{surf}}/(4\pi G R)$. With $g_{\text{surf}} = 9.82\,\mathrm{m/s^2}$, $R = 6371\,\mathrm{km}$ and $G = 6.6743 \times 10^{-11}\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$,

$$
\rho = \frac{3 \times 9.82}{4\pi \times 6.6743\times 10^{-11}\times 6.371\times 10^{6}} = 5513\,\mathrm{kg/m^3},
$$

matching the value from $\mu/G$ and the volume in Lesson 6. The Laplacian of the potential inside Earth is then $4\pi G\rho = 4.62 \times 10^{-6}\,\mathrm{s^{-2}}$ on average — the same order as the tidal terms $\mu/r^3$ of Lesson 3, which is no coincidence, since both are $\sim G\rho$.
:::

::: warning
$\nabla^2 f$ is a scalar (the Laplacian) when $f$ is a scalar field, but $\nabla^2 f$ also denotes the Hessian matrix in optimisation texts, including Lesson 4. The Laplacian is the trace of the Hessian. When you see $\nabla^2$, check whether the result is being used as a number or as a matrix.
:::

::: warning
Divergence is not "the field points outward" and curl is not "the field goes round". The inverse-square field points outward everywhere yet has zero divergence; the shear flow $\mathbf{v} = [y, 0, 0]^\top$ goes straight yet has curl $[0, 0, -1]^\top$, because a paddle wheel in it is pushed harder on one side than the other. Trust the derivatives, not the picture of the arrows.
:::

## Check yourself

::: check
Compute the divergence and curl of $\mathbf{F} = [x^2,\ 2xy,\ -z^2]^\top$ at $(1, 1, 2)$.
:::

::: answer
$\nabla\cdot\mathbf{F} = 2x + 2x - 2z = 4x - 2z$, which is $0$ at $(1, 1, 2)$. The curl: $\partial_y(-z^2) - \partial_z(2xy) = 0$; $\partial_z(x^2) - \partial_x(-z^2) = 0$; $\partial_x(2xy) - \partial_y(x^2) = 2y - 0 = 2y$. So $\nabla\times\mathbf{F} = [0, 0, 2y]^\top = [0, 0, 2]^\top$ there. The field is locally volume-preserving at that point but does swirl about the $z$ axis, so it is not a gradient field.
:::

::: check
Show that $f(x, y, z) = x^2 - y^2$ is harmonic, and explain why it cannot have a maximum or minimum anywhere.
:::

::: answer
$\partial^2 f/\partial x^2 = 2$, $\partial^2 f/\partial y^2 = -2$, $\partial^2 f/\partial z^2 = 0$, so $\nabla^2 f = 0$. Its Hessian is $\operatorname{diag}(2, -2, 0)$, indefinite at every point, so any stationary point is a saddle: the trace being zero forces at least one negative eigenvalue whenever there is a positive one. This is the general situation for harmonic functions, and it is why a gravitational potential has no minimum in empty space.
:::

::: check
The velocity of gas in a converging nozzle section is $\mathbf{v} = [v_0(1 + x/L),\ 0,\ 0]^\top$ with $v_0 = 500\,\mathrm{m/s}$ and $L = 0.5\,\mathrm{m}$. What is $\nabla\cdot\mathbf{v}$, and what does its sign say about the gas?
:::

::: answer
$\nabla\cdot\mathbf{v} = v_0/L = 1000\,\mathrm{s^{-1}}$, positive and constant. A positive divergence of velocity means each parcel of gas is expanding: its volume grows at a fractional rate $\nabla\cdot\mathbf{v}$, so its density falls at the rate $\dot\rho/\rho = -\nabla\cdot\mathbf{v}$ (Lesson 9 derives this from mass conservation). A parcel crossing this section thins out by a factor $e$ in $1\,\mathrm{ms}$, which is what happens to a compressible gas accelerating through a nozzle.
:::

::: check
Without computing anything, state the curl of $\mathbf{F} = \nabla(x^2 y z + \sin z)$ and the divergence of $\mathbf{G} = \nabla\times[x^2 y,\ e^z,\ \cos(xy)]^\top$.
:::

::: answer
Both are zero. The curl of any gradient vanishes because mixed second partials commute, so $\nabla\times\mathbf{F} = \mathbf{0}$. The divergence of any curl vanishes for the same reason, so $\nabla\cdot\mathbf{G} = 0$. These identities hold regardless of how complicated the underlying functions are, provided they are twice continuously differentiable, which these are.
:::

::: check
Explain, using the divergence, why the gravitational field of a point mass falls off as exactly $1/r^2$ and not some other power.
:::

::: answer
Away from the mass there are no sources, so $\nabla\cdot\mathbf{a} = 0$. For a radial field $\mathbf{a} = g(r)\,\mathbf{r}$ this requires $3g + rg' = 0$, whose solution is $g = C r^{-3}$, so $\lVert\mathbf{a}\rVert = \lvert g\rvert\,r = \lvert C\rvert/r^2$. Any other power law would have non-zero divergence and would need sources or sinks spread through empty space. Equivalently, the flux $-4\pi\mu$ through a sphere must be the same for every radius (Lesson 7), and only $1/r^2$ makes the field times the area $4\pi r^2$ constant.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\nabla = [\partial_x, \partial_y, \partial_z]^\top$ | del operator: $\nabla f$ gradient, $\nabla\cdot\mathbf{F}$ divergence, $\nabla\times\mathbf{F}$ curl |
| $\nabla\cdot\mathbf{F} = \partial_x F_1 + \partial_y F_2 + \partial_z F_3$ | net outflow per unit volume; trace of the Jacobian |
| $\nabla\cdot(g\,\mathbf{r}) = 3g + rg'$; $\nabla\cdot\mathbf{r} = 3$; $\nabla\cdot(\mathbf{r}/r^3) = 0$ | radial fields; inverse-square gravity is divergence-free for $r \neq 0$ |
| $\nabla\times\mathbf{F} = [\partial_y F_3 - \partial_z F_2,\ \partial_z F_1 - \partial_x F_3,\ \partial_x F_2 - \partial_y F_1]^\top$ | local circulation per unit area about each axis |
| $\nabla\times(\boldsymbol{\omega}\times\mathbf{r}) = 2\boldsymbol{\omega}$ | rigid rotation: curl is twice the angular velocity ($1.46 \times 10^{-4}\,\mathrm{s^{-1}}$ for Earth) |
| $\nabla\times\nabla f = \mathbf{0}$, $\nabla\cdot(\nabla\times\mathbf{F}) = 0$ | gradients are irrotational; curls are source-free |
| $\nabla^2 f = \nabla\cdot\nabla f = \partial_x^2 f + \partial_y^2 f + \partial_z^2 f$ | Laplacian; trace of the Hessian |
| $\nabla^2\phi(r) = \phi'' + 2\phi'/r$; $\nabla^2(r^n) = n(n+1)r^{n-2}$ | radial Laplacian; $\nabla^2(1/r) = 0$ |
| $\nabla^2 U = 0$ outside matter | Laplace's equation; exterior geopotential is a series of spherical harmonics |
| $\nabla^2 U = 4\pi G\rho$ inside matter | Poisson's equation; $4.62 \times 10^{-6}\,\mathrm{s^{-2}}$ for Earth's mean density |

The next lesson proves that the flux of a field through a closed surface is the volume integral of its divergence, and that the circulation around a closed curve is the surface integral of its curl — the divergence and Stokes theorems — and uses the first to show that a spherically symmetric planet attracts as a point mass.
