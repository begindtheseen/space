---
id: l06-multiple-integrals
title: Double and triple integrals
minutes: 25
covers:
  - multiple integrals
---

A single integral adds up a quantity along a line. A vehicle is not a line: its mass is spread through a volume, the pressure on a heat shield is spread over a surface, and the probability that a filter's estimate is within a kilometre of the truth is spread over an area of the error ellipse. Adding up a quantity over a region of two or three dimensions is a multiple integral, and the mass properties that every attitude controller and every guidance law depend on — total mass, centre of mass, inertia tensor — are triple integrals of the density over the vehicle.

The mechanics of multiple integration reduce to doing single integrals one variable at a time, from the inside out, and the only genuinely new idea is how to change variables. When you describe a region in polar, cylindrical or spherical coordinates instead of Cartesian ones, the little area or volume elements are no longer rectangles, and the correction factor is the absolute value of the Jacobian determinant from Lesson 3. That one fact explains the $r\,dr\,d\theta$ of polar coordinates and the $r^2\sin\theta$ of spherical coordinates, and it is what makes the gravitational field of a sphere computable.

This lesson covers double integrals over plane regions, the change-of-variables formula, triple integrals over solids, and the mass-property integrals. Line and surface integrals — integrals over curved one- and two-dimensional objects sitting in space — follow in Lesson 7.

## The double integral

Let $f(x, y)$ be a scalar field on a bounded region $D$ of the plane. Cut $D$ into small rectangles of area $\Delta A_k = \Delta x_k\,\Delta y_k$, evaluate $f$ at a point in each, and add:

$$
\iint_D f(x, y)\,dA = \lim_{\Delta A \to 0}\sum_k f(x_k, y_k)\,\Delta A_k .
$$

If $f = 1$ the sum is the area of $D$. If $f$ is a surface density in $\mathrm{kg/m^2}$ the sum is a mass. If $f$ is a probability density in $\mathrm{m^{-2}}$ the sum is a probability. If $f$ is a height, the sum is the volume under the graph of $f$ over $D$. The units are always those of $f$ times $\mathrm{m^2}$.

### Iterated integrals

For a rectangle $D = [a, b]\times[c, d]$ the sum can be organised row by row: first add along each strip of fixed $x$, which is a single integral in $y$, then add the strips, which is a single integral in $x$:

$$
\iint_D f\,dA = \int_a^b\left(\int_c^d f(x, y)\,dy\right)dx = \int_c^d\left(\int_a^b f(x, y)\,dx\right)dy .
$$

That the two orders agree (for any function continuous on the region — **Fubini's theorem**) is the statement that adding a table of numbers by rows first or by columns first gives the same total. The inner integral is done with the outer variable held fixed, exactly as a partial derivative holds the other variable fixed.

For a region whose boundary is not made of coordinate lines, the inner limits depend on the outer variable. If $D$ lies between the curves $y = g_1(x)$ and $y = g_2(x)$ for $a \le x \le b$,

$$
\iint_D f\,dA = \int_a^b\int_{g_1(x)}^{g_2(x)} f(x, y)\,dy\,dx .
$$

Read it from the inside out: at a fixed $x$, the strip runs from $g_1(x)$ up to $g_2(x)$; then the strips are stacked from $x = a$ to $x = b$. The outer limits are always constants. Sketching the region before writing limits is not optional; most errors in multiple integrals are errors in the limits.

::: example A double integral over a triangle, both ways
Let $D$ be the triangle with vertices $(0, 0)$, $(2, 0)$ and $(2, 2)$ and compute $\iint_D xy\,dA$. The triangle lies under the line $y = x$: for each $x$ in $[0, 2]$, $y$ runs from $0$ to $x$. So

$$
\iint_D xy\,dA = \int_0^2\int_0^x xy\,dy\,dx = \int_0^2 x\left[\frac{y^2}{2}\right]_0^x dx = \int_0^2 \frac{x^3}{2}\,dx = \frac{2^4}{8} = 2 .
$$

In the other order, for each $y$ in $[0, 2]$, $x$ runs from the line $x = y$ to the edge $x = 2$:

$$
\int_0^2\int_y^2 xy\,dx\,dy = \int_0^2 y\left[\frac{x^2}{2}\right]_y^2 dy = \int_0^2 \left(2y - \frac{y^3}{2}\right)dy = 4 - 2 = 2 .
$$

A midpoint Riemann sum on a $400 \times 400$ grid gives $1.99999$. Swapping the order changed the limits completely — from $0 \le y \le x$ to $y \le x \le 2$ — but not the answer.
:::

## Changing variables: the Jacobian determinant

Many regions are awkward in Cartesian coordinates and natural in others. A disc is $0 \le r \le R$, $0 \le \theta < 2\pi$ in polar coordinates; the same disc in Cartesian coordinates needs $-\sqrt{R^2 - x^2} \le y \le \sqrt{R^2 - x^2}$. Changing coordinates changes the shape of the little area elements, and the integral must account for it.

Let $(x, y) = \mathbf{T}(u, v)$ be a smooth, one-to-one map from a region $D^\ast$ in the $(u, v)$ plane to $D$. A small rectangle in $(u, v)$ with sides $\Delta u$ and $\Delta v$ is carried to a small patch in $(x, y)$. By the linear approximation of Lesson 3 the edges of the patch are the vectors $\partial\mathbf{T}/\partial u\,\Delta u$ and $\partial\mathbf{T}/\partial v\,\Delta v$ — the columns of the Jacobian $\mathbf{J}_{\mathbf{T}}$ scaled by the side lengths. The area of the parallelogram they span is the absolute value of the $2 \times 2$ determinant of those edge vectors, which is

$$
\Delta A = \left|\det\mathbf{J}_{\mathbf{T}}\right|\,\Delta u\,\Delta v, \qquad \det\mathbf{J}_{\mathbf{T}} = \frac{\partial x}{\partial u}\frac{\partial y}{\partial v} - \frac{\partial x}{\partial v}\frac{\partial y}{\partial u} .
$$

Summing over patches and taking the limit gives the **change-of-variables formula**

$$
\iint_D f(x, y)\,dx\,dy = \iint_{D^\ast} f(\mathbf{T}(u, v))\,\left|\det\mathbf{J}_{\mathbf{T}}(u, v)\right|\,du\,dv .
$$

The determinant is the local area-magnification factor of the map. Lesson 3 computed it for polar coordinates, $(x, y) = (r\cos\theta, r\sin\theta)$: $\det\mathbf{J} = r$, so $dA = r\,dr\,d\theta$. The factor $r$ says that a patch $dr$ by $d\theta$ is $dr$ wide and $r\,d\theta$ long; far from the origin the same angular step sweeps more area. The single-variable substitution rule $dx = (dx/du)\,du$ is the one-dimensional case, where the Jacobian is the $1 \times 1$ matrix $dx/du$ and the absolute value is what keeps the orientation straight.

::: key
Under a change of variables $(x, y) = \mathbf{T}(u, v)$, $dA = \lvert\det\mathbf{J}_{\mathbf{T}}\rvert\,du\,dv$: the Jacobian determinant is the local area-scaling factor. Polar coordinates give $dA = r\,dr\,d\theta$; cylindrical give $dV = r\,dr\,d\theta\,dz$; spherical $(r, \theta, \varphi)$ with polar angle $\theta$ give $dV = r^2\sin\theta\,dr\,d\theta\,d\varphi$.
:::

::: example How much of a Gaussian error cloud lies inside a circle
A filter reports a position error in the horizontal plane with independent, equal standard deviations $\sigma$ in $x$ and $y$. The probability density is $p(x, y) = \frac{1}{2\pi\sigma^2}\exp\!\left(-\frac{x^2 + y^2}{2\sigma^2}\right)$. First check that it integrates to one. In polar coordinates $x^2 + y^2 = r^2$ and $dA = r\,dr\,d\theta$:

$$
\int_0^{2\pi}\!\int_0^\infty \frac{1}{2\pi\sigma^2}e^{-r^2/2\sigma^2}\,r\,dr\,d\theta = \frac{2\pi}{2\pi\sigma^2}\left[-\sigma^2 e^{-r^2/2\sigma^2}\right]_0^\infty = 1 .
$$

The factor $r$ from the Jacobian is exactly what makes the integrand a derivative of $e^{-r^2/2\sigma^2}$; in Cartesian coordinates the same integral has no elementary antiderivative, and this polar trick is the standard way to evaluate it. A numerical midpoint sum of $e^{-(x^2+y^2)/2}$ over a $16 \times 16$ square confirms the value $2\pi = 6.2832$ to nine digits.

Now stop the radial integral at $r = k\sigma$. The probability that the true position lies within a circle of radius $k\sigma$ of the estimate is

$$
P(r \le k\sigma) = 1 - e^{-k^2/2}: \qquad 39.3\%\ (k = 1),\quad 86.5\%\ (k = 2),\quad 98.9\%\ (k = 3).
$$

These are markedly lower than the one-dimensional $68.3\%$, $95.4\%$ and $99.7\%$, because in two dimensions there are more ways to be wrong. A $95\%$ containment circle needs $k = \sqrt{-2\ln 0.05} = 2.448$; for the $707\,\mathrm{m}$ standard deviations of Lesson 4's radar example that is a circle of radius $1731\,\mathrm{m}$. Quoting a "$2\sigma$" horizontal error as $95\%$ containment overstates the confidence.
:::

## Triple integrals

Everything extends to three variables. For a scalar field on a solid region $V$,

$$
\iiint_V f(x, y, z)\,dV = \lim\sum_k f(x_k, y_k, z_k)\,\Delta V_k ,
$$

evaluated as three nested single integrals, innermost first, with the innermost limits allowed to depend on the two outer variables and the outermost limits constant. The change-of-variables formula holds with the $3 \times 3$ Jacobian determinant, the volume of the parallelepiped spanned by its three columns. Two coordinate systems cover almost every case in this curriculum:

- **Cylindrical** $(r, \theta, z)$ with $x = r\cos\theta$, $y = r\sin\theta$: the $z$ column is $[0, 0, 1]^\top$ and the determinant is the polar one, so $dV = r\,dr\,d\theta\,dz$. Use it for tanks, stages, nozzles and anything else with an axis.
- **Spherical** $(r, \theta, \varphi)$ with $x = r\sin\theta\cos\varphi$, $y = r\sin\theta\sin\varphi$, $z = r\cos\theta$, polar angle $\theta \in [0, \pi]$ from the $z$ axis and azimuth $\varphi \in [0, 2\pi)$: Lesson 3 found the determinant $r^2\sin\theta$, so $dV = r^2\sin\theta\,dr\,d\theta\,d\varphi$. The three edges of the volume element have lengths $dr$, $r\,d\theta$ and $r\sin\theta\,d\varphi$. Use it for planets, spherical tanks and anything with a centre.

As a check, the volume of a ball of radius $R$ in spherical coordinates is $\int_0^{2\pi}\!\int_0^\pi\!\int_0^R r^2\sin\theta\,dr\,d\theta\,d\varphi = 2\pi \cdot 2 \cdot R^3/3 = \tfrac{4}{3}\pi R^3$, with the $\theta$ integral of $\sin\theta$ contributing the $2$. Earth's mass follows from $\mu = GM$: with $G = 6.6743 \times 10^{-11}\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$, $M = 5.972 \times 10^{24}\,\mathrm{kg}$, and dividing by the volume of a sphere of mean radius $6371\,\mathrm{km}$ gives a mean density of $5513\,\mathrm{kg/m^3}$ — about twice that of surface rock, the first evidence that Earth has a dense core.

## Mass properties

Let a body occupy the region $V$ with mass density $\rho(\mathbf{r})$ in $\mathrm{kg/m^3}$, and write $dm = \rho\,dV$. The three mass properties that a GNC engineer needs are integrals over $V$:

$$
m = \iiint_V \rho\,dV, \qquad
\mathbf{r}_{cm} = \frac{1}{m}\iiint_V \mathbf{r}\,\rho\,dV, \qquad
\mathbf{I} = \iiint_V \left(\lVert\mathbf{r}\rVert^2\,\mathbf{I}_3 - \mathbf{r}\mathbf{r}^\top\right)\rho\,dV .
$$

The **centre of mass** is the density-weighted average position; the vector integral is three scalar integrals, one per component. The **inertia tensor** $\mathbf{I}$ (here $\mathbf{I}_3$ is the identity, to avoid a clash of symbols) is a symmetric $3 \times 3$ matrix whose diagonal entries are the **moments of inertia**, $I_{xx} = \iiint (y^2 + z^2)\,dm$ and cyclically — the mass-weighted mean square distance from each axis — and whose off-diagonal entries $I_{xy} = -\iiint xy\,dm$ are the **products of inertia**, which vanish when the axes are symmetry axes. Its units are $\mathrm{kg\,m^2}$. The rigid-body module will show that $\mathbf{I}\boldsymbol{\omega}$ is the angular momentum and that a torque $\boldsymbol{\tau}$ produces the angular acceleration $\mathbf{I}^{-1}\boldsymbol{\tau}$ (for a body spinning about a principal axis); the moments of inertia are therefore the gains of every attitude control loop. For a body with a symmetry axis $z$, the moments about it and about a transverse axis are conventionally called $C$ and $A$.

::: example Moments of inertia of a cylindrical propellant load
Model a fully loaded first-stage tank as a uniform solid cylinder of radius $R = 1.83\,\mathrm{m}$, length $L = 12\,\mathrm{m}$ and mass $m = 100{,}000\,\mathrm{kg}$; its volume is $\pi R^2 L = 126.3\,\mathrm{m^3}$, so the density is $792\,\mathrm{kg/m^3}$, close to that of kerosene. Put the axis along $z$ with the centre at the origin, and use cylindrical coordinates so that the distance from the axis is $r$.

About the axis, $I_{zz} = \iiint r^2\,dm$:

$$
I_{zz} = \rho\int_{-L/2}^{L/2}\!\int_0^{2\pi}\!\int_0^R r^2\cdot r\,dr\,d\theta\,dz = \rho\,L\cdot 2\pi\cdot\frac{R^4}{4} = \frac{1}{2}\,(\rho\pi R^2 L)\,R^2 = \frac{1}{2}mR^2 = 1.674 \times 10^5\,\mathrm{kg\,m^2}.
$$

The Jacobian factor $r$ turned $r^2$ into $r^3$ and produced the $R^4/4$. A midpoint sum over $2000$ radial shells reproduces $167{,}445\,\mathrm{kg\,m^2}$ to six digits.

About a transverse axis through the centre, say $y$, the squared distance from the axis is $x^2 + z^2 = r^2\cos^2\theta + z^2$:

$$
I_{yy} = \rho\int_{-L/2}^{L/2}\!\int_0^{2\pi}\!\int_0^R (r^2\cos^2\theta + z^2)\,r\,dr\,d\theta\,dz
= \rho\left(L\cdot\pi\cdot\frac{R^4}{4} + \frac{L^3}{12}\cdot 2\pi\cdot\frac{R^2}{2}\right) = \frac{m R^2}{4} + \frac{m L^2}{12} = \frac{m(3R^2 + L^2)}{12},
$$

using $\int_0^{2\pi}\cos^2\theta\,d\theta = \pi$ and $\int_{-L/2}^{L/2}z^2\,dz = L^3/12$. Numerically, $I_{yy} = 100{,}000 \times (3 \times 3.349 + 144)/12 = 1.284 \times 10^6\,\mathrm{kg\,m^2}$, about $7.7$ times the axial value: the stage is far easier to roll than to pitch, which is why roll control needs small thrusters and pitch control needs the main engine gimbal. As propellant drains, both integrals shrink and $\mathbf{r}_{cm}$ moves, and the autopilot gains must follow.
:::

::: example Centre of mass of a conical nose
A uniform solid cone has base radius $a = 1.83\,\mathrm{m}$ and height $h = 5\,\mathrm{m}$, apex up along $z$ with the base in the plane $z = 0$. At height $z$ the cross-section is a disc of radius $a(1 - z/h)$. In cylindrical coordinates, integrating the disc at each height first,

$$
V = \int_0^h \pi a^2\left(1 - \frac{z}{h}\right)^2 dz = \pi a^2\,\frac{h}{3} = 17.53\,\mathrm{m^3}, \qquad
\iiint z\,dV = \int_0^h z\,\pi a^2\left(1 - \frac{z}{h}\right)^2 dz = \pi a^2\,\frac{h^2}{12} .
$$

The second integral expands $(1 - z/h)^2 = 1 - 2z/h + z^2/h^2$ and integrates $z$, $z^2$ and $z^3$ termwise: $h^2(\tfrac{1}{2} - \tfrac{2}{3} + \tfrac{1}{4}) = h^2/12$. Dividing, $z_{cm} = (h^2/12)/(h/3) = h/4 = 1.25\,\mathrm{m}$ above the base, independent of $a$ and of the density. By symmetry $x_{cm} = y_{cm} = 0$. The centre of mass of a composite vehicle is then the mass-weighted average of its parts' centres: with a $100\,\mathrm{t}$ propellant load centred at $6\,\mathrm{m}$, $20\,\mathrm{t}$ of structure at $7\,\mathrm{m}$ and $8\,\mathrm{t}$ of engines at $0.5\,\mathrm{m}$, $x_{cm} = (600 + 140 + 4)/128 = 5.81\,\mathrm{m}$. That is how a mass-properties table is built: integrals for the primitives, weighted sums for the assembly.
:::

::: note
Earth's oblateness is a mass-property statement. The second zonal harmonic in the module's J2 exercise is $J_2 = (C - A)/(M R_e^2)$, the difference between the polar and equatorial moments of inertia in units of $M R_e^2$; with $J_2 = 1.08263 \times 10^{-3}$, $C - A = 2.63 \times 10^{35}\,\mathrm{kg\,m^2}$. The gravity field a satellite feels is a triple integral of $-G\,dm/\lVert\mathbf{r} - \mathbf{r}'\rVert$ over the planet, and the multipole terms of that integral are the planet's mass moments.
:::

::: warning
The volume element is not $dr\,d\theta\,d\varphi$. Leaving out the Jacobian factor is the single most common error in spherical and cylindrical integrals; it gives dimensionally wrong answers (radians are dimensionless, so a $\theta$ integral without its $r$ has one too few metres). Check units on every multiple integral: the result of $\iiint f\,dV$ has the units of $f$ times $\mathrm{m^3}$, whatever coordinates you used.
:::

::: warning
The inner limits may depend on the outer variables, never the reverse. If you find yourself writing $\int_0^{x}\!\int_0^2 \dots dx\,dy$ with $x$ in the outer limit, the order of integration and the limits have been swapped inconsistently. Sketch the region, fix the outer variable, and read off the range of the inner one.
:::

## Check yourself

::: check
Evaluate $\iint_D (x^2 + y^2)\,dA$ over the disc $x^2 + y^2 \le 4$, and explain why polar coordinates are the right choice.
:::

::: answer
In polar coordinates the integrand is $r^2$, the region is $0 \le r \le 2$, $0 \le \theta < 2\pi$, and $dA = r\,dr\,d\theta$. So $\int_0^{2\pi}\!\int_0^2 r^3\,dr\,d\theta = 2\pi \times 16/4 = 8\pi = 25.1$. Both the region and the integrand depend only on $r$, so the polar form separates into a trivial $\theta$ integral and a one-line $r$ integral; in Cartesian coordinates the limits would be square roots and the integrand would not simplify. Physically this is $I_{zz}/\sigma$ for a uniform disc of surface density $\sigma$: $\tfrac{1}{2}(\sigma\pi R^2)R^2$ with $R = 2$.
:::

::: check
The Jacobian determinant of a map is $-3$ at some point. What does the sign mean, and what does the magnitude mean for a change of variables?
:::

::: answer
The magnitude $3$ means a small patch of $(u, v)$ area is mapped to a patch of three times the area in $(x, y)$, so $dA = 3\,du\,dv$ there. The negative sign means the map reverses orientation — a counter-clockwise loop in $(u, v)$ becomes a clockwise loop in $(x, y)$ — which does not affect the integral of a scalar density; that is why the formula uses $\lvert\det\mathbf{J}\rvert$. Lesson 4's radar-to-ENU map had a negative determinant for the same reason, and the volume factor was its absolute value.
:::

::: check
Find the moment of inertia of a thin uniform spherical shell of mass $m$ and radius $R$ about a diameter, starting from the surface element $dS = R^2\sin\theta\,d\theta\,d\varphi$.
:::

::: answer
The surface density is $\sigma = m/(4\pi R^2)$. The squared distance from the $z$ axis is $x^2 + y^2 = R^2\sin^2\theta$, so $I_{zz} = \sigma\int_0^{2\pi}\!\int_0^\pi R^2\sin^2\theta\cdot R^2\sin\theta\,d\theta\,d\varphi = 2\pi\sigma R^4\int_0^\pi\sin^3\theta\,d\theta$. With $\int_0^\pi\sin^3\theta\,d\theta = 4/3$, $I_{zz} = 2\pi\sigma R^4 \cdot 4/3 = \tfrac{8}{3}\pi\sigma R^4 = \tfrac{2}{3}mR^2$. A solid uniform sphere, built from such shells with $dm = (3m/R^3)r^2\,dr$, gives $\int_0^R \tfrac{2}{3}r^2\,dm = \tfrac{2}{5}mR^2$. Earth's actual polar moment is $0.3307\,MR_e^2$, less than $0.4$, another sign that its mass is concentrated toward the centre.
:::

::: check
A propellant tank is a hemisphere of radius $R$ with its flat face at $z = 0$ and the dome toward $+z$, filled uniformly. Where is the centre of mass?
:::

::: answer
By symmetry $x_{cm} = y_{cm} = 0$. Slice at height $z$: the disc has radius $\sqrt{R^2 - z^2}$ and area $\pi(R^2 - z^2)$. Then $V = \int_0^R \pi(R^2 - z^2)\,dz = \tfrac{2}{3}\pi R^3$ and $\int z\,dV = \int_0^R \pi z(R^2 - z^2)\,dz = \pi(R^4/2 - R^4/4) = \pi R^4/4$. Dividing, $z_{cm} = (\pi R^4/4)/(\tfrac{2}{3}\pi R^3) = 3R/8$; for $R = 1.83\,\mathrm{m}$ that is $0.686\,\mathrm{m}$ above the flat face. A dome of propellant sits lower than its geometric midpoint, which matters when a stage's centre of mass is tracked as the tank drains.
:::

::: check
Why does the probability inside a $1\sigma$ circle in two dimensions ($39.3\%$) differ so much from the $68.3\%$ inside $\pm 1\sigma$ in one dimension?
:::

::: answer
The two-dimensional density is the product of two one-dimensional densities, and the condition $r \le \sigma$ is stricter than $\lvert x\rvert \le \sigma$: it also requires $\lvert y\rvert \le \sigma$, and indeed $x^2 + y^2 \le \sigma^2$, which excludes the corners of the $\pm\sigma$ square. The square itself contains $0.683^2 = 46.6\%$; the inscribed circle contains less, $39.3\%$. Each added dimension is another independent way for the error to be large, so containment probabilities at a fixed $k$ fall as the dimension rises. Position-error specifications must therefore state whether they are per axis, circular or spherical.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\iint_D f\,dA = \int_a^b\int_{g_1(x)}^{g_2(x)} f\,dy\,dx$ | double integral as an iterated integral; inner limits may depend on the outer variable |
| Fubini: either order gives the same value | swap the order by re-describing the region |
| $dA = \lvert\det\mathbf{J}_{\mathbf{T}}\rvert\,du\,dv$ | change of variables; the Jacobian determinant is the area-scaling factor |
| $dA = r\,dr\,d\theta$; $dV = r\,dr\,d\theta\,dz$; $dV = r^2\sin\theta\,dr\,d\theta\,d\varphi$ | polar, cylindrical, spherical elements |
| $P(r \le k\sigma) = 1 - e^{-k^2/2}$ | 2-D Gaussian containment: $39.3\%$, $86.5\%$, $98.9\%$ at $k = 1, 2, 3$ |
| $m = \iiint\rho\,dV$, $\mathbf{r}_{cm} = \frac{1}{m}\iiint\mathbf{r}\,\rho\,dV$ | mass and centre of mass |
| $\mathbf{I} = \iiint(\lVert\mathbf{r}\rVert^2\mathbf{I}_3 - \mathbf{r}\mathbf{r}^\top)\,dm$ | inertia tensor; $I_{zz} = \iiint(x^2 + y^2)\,dm$ |
| cylinder: $I_{\text{axial}} = \tfrac{1}{2}mR^2$, $I_{\text{trans}} = m(3R^2 + L^2)/12$ | $1.67 \times 10^5$ and $1.28 \times 10^6\,\mathrm{kg\,m^2}$ for the tank example |
| cone: $z_{cm} = h/4$ from the base; hemisphere: $3R/8$ | centres of mass of common primitives |
| $J_2 = (C - A)/(MR_e^2)$ | oblateness as a difference of moments of inertia |

The next lesson integrates along curves and over surfaces embedded in space: the work done by a force along a trajectory and the flux of a field through a surface. Both use the parametrisations of this lesson and the arc length of Lesson 5.
