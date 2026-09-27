---
id: l06-multiple-integrals
title: Double and triple integrals
minutes: 23
covers:
  - multiple integrals
---

Picture a pan of brownies that came out lumpy: thick in one corner, thin at the other. How much does the whole pan weigh? One way is to cut it into small squares, weigh each square, and add up the weights. The smaller the squares, the better the answer. That is a **multiple integral**: adding up something that is spread over an area or a volume, one tiny piece at a time.

A single integral adds up a quantity along a line. A vehicle is not a line. Its mass is spread through a volume. The pressure on a heat shield is spread over a surface. The chance that a navigation filter's estimate is within a kilometer of the truth is spread over an area. The mass properties that every attitude controller and guidance law depends on — total mass, **center of mass**, inertia tensor — are all integrals of density over the whole vehicle.

The mechanics come down to doing ordinary single integrals, one variable at a time, from the inside out. The only truly new idea is **changing variables**. When you describe a region in polar, cylindrical or spherical coordinates, the tiny pieces are no longer little rectangles, and you need a correction factor. That factor is the absolute value of Lesson 3's Jacobian determinant. It explains the $r\,dr\,d\theta$ of polar coordinates and the $r^2\sin\theta$ of spherical ones, and it is what makes the gravity of a planet computable. Integrals along curves and over curved surfaces come in Lesson 7.

## The double integral

Let $f(x, y)$ be a scalar field — a number at every point — on a bounded region $D$ of the plane. Cut $D$ into small rectangles of area $\Delta A_k = \Delta x_k\,\Delta y_k$. Take the value of $f$ at a point in each rectangle, multiply by the rectangle's area, and add them all up. As the rectangles shrink, the sum settles to the **double integral**:

$$
\iint_D f(x, y)\,dA = \lim_{\Delta A \to 0}\sum_k f(x_k, y_k)\,\Delta A_k .
$$

Read $\iint_D f\,dA$ as "the double integral of f over D, d A". The **[[integral sign|long-s]]** is doubled because the region has two directions, and $dA$ stands for a tiny piece of area.

What the answer means depends on what $f$ is:

- if $f = 1$, the sum is the area of $D$;
- if $f$ is a surface density in $\mathrm{kg/m^2}$, the sum is a mass;
- if $f$ is a probability density in $\mathrm{m^{-2}}$, the sum is a probability;
- if $f$ is a height, the sum is the volume under the surface $f$ above $D$.

The units are always those of $f$ times $\mathrm{m^2}$.

### Iterated integrals

How do you actually do the adding? Think of a spreadsheet of numbers. You can total each row and then add the row totals — or total each column and add those. Either way you get the grand total.

For a rectangle $D = [a, b]\times[c, d]$ ($x$ from $a$ to $b$, $y$ from $c$ to $d$), do the same. First add along each thin strip of fixed $x$; that is a single integral in $y$. Then add up the strips; that is a single integral in $x$:

$$
\iint_D f\,dA = \int_a^b\left(\int_c^d f(x, y)\,dy\right)dx = \int_c^d\left(\int_a^b f(x, y)\,dx\right)dy .
$$

That the two orders agree — for any function continuous on the region — is **[[Fubini's theorem|fubini]]**. It is the spreadsheet fact: rows first or columns first, same total. While you do the inner integral, the outer variable is held fixed, exactly as a partial derivative holds the other variable fixed.

Most regions are not rectangles. If $D$ lies between a lower curve $y = g_1(x)$ and an upper curve $y = g_2(x)$, for $a \le x \le b$, the inner limits depend on the outer variable:

$$
\iint_D f\,dA = \int_a^b\int_{g_1(x)}^{g_2(x)} f(x, y)\,dy\,dx .
$$

Read it from the inside out. At a fixed $x$, the strip runs from $g_1(x)$ up to $g_2(x)$. Then the strips are stacked from $x = a$ to $x = b$. The outer limits are always plain numbers. **Always sketch the region before writing limits** — most mistakes in multiple integrals are mistakes in the limits.

::: example A double integral over a triangle, both ways
Let $D$ be the **[[triangle|triangle-strips]]** with corners $(0, 0)$, $(2, 0)$ and $(2, 2)$. Find $\iint_D xy\,dA$.

**Vertical strips first.** The triangle sits under the line $y = x$. So for each $x$ between $0$ and $2$, $y$ runs from $0$ up to $x$. Do the inner $y$ integral with $x$ held fixed, then the outer one:

$$
\iint_D xy\,dA = \int_0^2\int_0^x xy\,dy\,dx = \int_0^2 x\left[\frac{y^2}{2}\right]_0^x dx = \int_0^2 \frac{x^3}{2}\,dx = \frac{2^4}{8} = 2 .
$$

**Horizontal strips first.** Now fix $y$ between $0$ and $2$. The strip runs from the slanted edge $x = y$ across to the right edge $x = 2$:

$$
\int_0^2\int_y^2 xy\,dx\,dy = \int_0^2 y\left[\frac{x^2}{2}\right]_y^2 dy = \int_0^2 \left(2y - \frac{y^3}{2}\right)dy = 4 - 2 = 2 .
$$

**Check.** Both orders give $2$. Swapping the order changed the limits completely — from $0 \le y \le x$ to $y \le x \le 2$ — but not the answer. A computer check, adding up $400$ strips each cut into $400$ pieces with the midpoint rule, gives $1.99999$.
:::

## Changing variables: the Jacobian determinant

Some regions are awkward in $x$ and $y$ and easy in other coordinates. A disc of radius $R$ is the tidy $0 \le r \le R$, $0 \le \theta < 2\pi$ in polar coordinates ($r$ is the distance from the center, $\theta$, "theta", the angle). In Cartesian coordinates the same disc needs the limits $-\sqrt{R^2 - x^2} \le y \le \sqrt{R^2 - x^2}$.

But there is a catch. Think of a pizza cut by circles and by straight cuts from the center. The pieces near the crust are much bigger than the pieces near the middle, even though every piece has the same width $dr$ and the same angle $d\theta$. When you add up pieces, you must count each at its true size.

Here is the general rule. Let $(x, y) = \mathbf{T}(u, v)$ be a smooth map that sends each point of a region $D^\ast$ ("D star") in the $(u, v)$ plane to exactly one point of $D$. A tiny rectangle in $(u, v)$, with sides $\Delta u$ and $\Delta v$, lands on a tiny patch in $(x, y)$.

**Step 1: the patch's edges.** By Lesson 3's linear approximation, the patch's edges are the vectors $\frac{\partial\mathbf{T}}{\partial u}\,\Delta u$ and $\frac{\partial\mathbf{T}}{\partial v}\,\Delta v$ — the columns of the Jacobian $\mathbf{J}_{\mathbf{T}}$, scaled by the side lengths.

**Step 2: the patch's area.** Two edge vectors span a parallelogram, and its area is the absolute value of the $2 \times 2$ determinant built from them:

$$
\Delta A = \left|\det\mathbf{J}_{\mathbf{T}}\right|\,\Delta u\,\Delta v, \qquad \det\mathbf{J}_{\mathbf{T}} = \frac{\partial x}{\partial u}\frac{\partial y}{\partial v} - \frac{\partial x}{\partial v}\frac{\partial y}{\partial u} .
$$

**Step 3: add up the patches.** Summing and taking the limit gives the **change-of-variables formula**:

$$
\iint_D f(x, y)\,dx\,dy = \iint_{D^\ast} f(\mathbf{T}(u, v))\,\left|\det\mathbf{J}_{\mathbf{T}}(u, v)\right|\,du\,dv .
$$

The determinant is the map's local "area magnifier". Lesson 3 found it for polar coordinates, $(x, y) = (r\cos\theta, r\sin\theta)$: $\det\mathbf{J} = r$. So $dA = r\,dr\,d\theta$. The factor $r$ says a patch is $dr$ wide and $r\,d\theta$ long — far from the center, the same angle sweeps **[[more area|polar-patch]]**, like the pizza.

The one-variable substitution rule $dx = (dx/du)\,du$ is the same idea in one dimension. The Jacobian is the $1 \times 1$ matrix $dx/du$, and the absolute value keeps the direction straight.

::: key
Under a change of variables $(x, y) = \mathbf{T}(u, v)$, $dA = \lvert\det\mathbf{J}_{\mathbf{T}}\rvert\,du\,dv$: the Jacobian determinant is the local area-scaling factor. Polar coordinates give $dA = r\,dr\,d\theta$; cylindrical give $dV = r\,dr\,d\theta\,dz$; spherical $(r, \theta, \varphi)$ with polar angle $\theta$ give $dV = r^2\sin\theta\,dr\,d\theta\,d\varphi$.
:::

::: example How much of a Gaussian error cloud lies inside a circle
A filter reports a horizontal position error with independent, equal standard deviations $\sigma$ in $x$ and $y$. The **[[Gaussian|gaussian-trick]]** (bell-curve) probability density is

$$
p(x, y) = \frac{1}{2\pi\sigma^2}\exp\!\left(-\frac{x^2 + y^2}{2\sigma^2}\right).
$$

**Step 1: check the total is one.** Every probability density must add up to $1$. Switch to polar coordinates: $x^2 + y^2 = r^2$ and $dA = r\,dr\,d\theta$. The $\theta$ integral gives $2\pi$, and the $r$ integral has an exact antiderivative:

$$
\int_0^{2\pi}\!\int_0^\infty \frac{1}{2\pi\sigma^2}e^{-r^2/2\sigma^2}\,r\,dr\,d\theta = \frac{2\pi}{2\pi\sigma^2}\left[-\sigma^2 e^{-r^2/2\sigma^2}\right]_0^\infty = \frac{2\pi}{2\pi\sigma^2}\,(0 + \sigma^2) = 1 .
$$

The factor $r$ from the Jacobian is exactly what makes the integrand the derivative of $-\sigma^2 e^{-r^2/2\sigma^2}$. In Cartesian coordinates the same integral has no antiderivative made of ordinary functions; this polar trick is the standard way to do it. A computer midpoint sum of $e^{-(x^2+y^2)/2}$ over a $16 \times 16$ square confirms the value $2\pi = 6.2832$ to nine digits.

**Step 2: stop at a radius.** Now end the $r$ integral at $r = k\sigma$ instead of infinity. The chance that the true position lies within $k\sigma$ of the estimate is

$$
P(r \le k\sigma) = 1 - e^{-k^2/2}: \qquad 39.3\%\ (k = 1),\quad 86.5\%\ (k = 2),\quad 98.9\%\ (k = 3).
$$

**Step 3: compare.** In one dimension the familiar numbers are $68.3\%$, $95.4\%$ and $99.7\%$. The two-dimensional ones are lower, because in two dimensions there are more ways to be wrong. A $95\%$ circle needs $k = \sqrt{-2\ln 0.05} = 2.448$. For the $707\,\mathrm{m}$ standard deviations of Lesson 4's radar example, that is a circle of radius $2.448 \times 707 = 1731\,\mathrm{m}$. Calling a "$2\sigma$" horizontal error "$95\%$ containment" overstates the confidence.
:::

## Triple integrals

Everything carries over to three dimensions. For a scalar field on a solid region $V$,

$$
\iiint_V f(x, y, z)\,dV = \lim\sum_k f(x_k, y_k, z_k)\,\Delta V_k ,
$$

done as three nested single integrals, innermost first. The inner limits may depend on the two outer variables; the outermost limits are plain numbers. The change-of-variables formula holds with the $3 \times 3$ Jacobian determinant, which is the volume of the slanted box spanned by its three columns. Two coordinate systems cover nearly every case in this course:

- **Cylindrical** $(r, \theta, z)$, with $x = r\cos\theta$, $y = r\sin\theta$. The $z$ column of the Jacobian is $[0, 0, 1]^\top$, so the determinant is the polar one: $dV = r\,dr\,d\theta\,dz$. Use it for tanks, stages, nozzles — anything with an axis.
- **Spherical** $(r, \theta, \varphi)$, with $x = r\sin\theta\cos\varphi$, $y = r\sin\theta\sin\varphi$, $z = r\cos\theta$. Here $\theta \in [0, \pi]$ is the **polar angle** down from the $z$ axis and $\varphi \in [0, 2\pi)$ ("phi") is the **azimuth** around it. Lesson 3 found the determinant $r^2\sin\theta$, so $dV = r^2\sin\theta\,dr\,d\theta\,d\varphi$. The little box has edges $dr$, $r\,d\theta$ and $r\sin\theta\,d\varphi$. Use it for planets, spherical tanks — anything with a center. (Watch out: **[[some books swap the two angles|theta-phi]]**.)

**Check: the volume of a ball.** For radius $R$, integrate $1$ in spherical coordinates. The three integrals separate: $\varphi$ gives $2\pi$, $\int_0^\pi \sin\theta\,d\theta$ gives $2$, and $\int_0^R r^2\,dr$ gives $R^3/3$:

$$
\int_0^{2\pi}\!\int_0^\pi\!\int_0^R r^2\sin\theta\,dr\,d\theta\,d\varphi = 2\pi \cdot 2 \cdot \frac{R^3}{3} = \frac{4}{3}\pi R^3 .
$$

That is the familiar formula, as it should be. Now use it on Earth. From $\mu = GM$, with $G = 6.6743 \times 10^{-11}\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$, Earth's mass is $M = 5.972 \times 10^{24}\,\mathrm{kg}$. Divide by the volume of a ball of mean radius $6371\,\mathrm{km}$ and you get a mean density of $5513\,\mathrm{kg/m^3}$. That is about twice the density of surface rock — the first clue that Earth has a **[[dense core|dense-core]]**.

## Mass properties

Let a body fill the region $V$, with mass density $\rho(\mathbf{r})$ ("rho") in $\mathrm{kg/m^3}$. A tiny piece of volume $dV$ has mass $dm = \rho\,dV$. The three mass properties a GNC engineer needs are all integrals over $V$:

$$
m = \iiint_V \rho\,dV, \qquad
\mathbf{r}_{cm} = \frac{1}{m}\iiint_V \mathbf{r}\,\rho\,dV, \qquad
\mathbf{I} = \iiint_V \left(\lVert\mathbf{r}\rVert^2\,\mathbf{I}_3 - \mathbf{r}\mathbf{r}^\top\right)\rho\,dV .
$$

**Mass** $m$ is the total. The **center of mass** $\mathbf{r}_{cm}$ is the balance point: the average position, with heavier pieces counting more. Its vector integral is three ordinary integrals, one per component.

The **inertia tensor** $\mathbf{I}$ says how hard the body is to spin about each axis. ($\mathbf{I}_3$ is the $3 \times 3$ identity matrix, renamed so it does not clash with $\mathbf{I}$.) It is a symmetric $3 \times 3$ matrix in $\mathrm{kg\,m^2}$.

- Its diagonal entries are the **[[moments of inertia|skater]]**: $I_{xx} = \iiint (y^2 + z^2)\,dm$, and likewise for $y$ and $z$. Each is mass times squared distance from that axis, added up.
- Its off-diagonal entries are the **products of inertia**, $I_{xy} = -\iiint xy\,dm$ and so on. They are zero when the axes are symmetry axes.

The rigid-body module will show that $\mathbf{I}\boldsymbol{\omega}$ is the angular momentum, and that a torque $\boldsymbol{\tau}$ ("tau") produces the angular acceleration $\mathbf{I}^{-1}\boldsymbol{\tau}$ (for a body spinning about a principal axis). So the moments of inertia set the gains of every attitude control loop. For a body with a symmetry axis $z$, the moment about that axis is traditionally called $C$ and the moment about a sideways axis $A$.

::: example Moments of inertia of a cylindrical propellant load
Model a full first-stage tank as a solid cylinder of even density: radius $R = 1.83\,\mathrm{m}$, length $L = 12\,\mathrm{m}$, mass $m = 100{,}000\,\mathrm{kg}$. Its volume is $\pi R^2 L = 126.3\,\mathrm{m^3}$, so the density is $100{,}000/126.3 = 792\,\mathrm{kg/m^3}$ — close to kerosene, a good sign. Put the axis along $z$ with the center at the origin, and use cylindrical coordinates, so the distance from the axis is $r$.

**About the long axis.** $I_{zz} = \iiint r^2\,dm$. With $dm = \rho\,r\,dr\,d\theta\,dz$:

$$
I_{zz} = \rho\int_{-L/2}^{L/2}\!\int_0^{2\pi}\!\int_0^R r^2\cdot r\,dr\,d\theta\,dz = \rho\,L\cdot 2\pi\cdot\frac{R^4}{4} = \frac{1}{2}\,(\rho\pi R^2 L)\,R^2 = \frac{1}{2}mR^2 = 1.674 \times 10^5\,\mathrm{kg\,m^2}.
$$

The Jacobian's $r$ turned $r^2$ into $r^3$ and produced the $R^4/4$. In the last step, $\rho\pi R^2 L$ is density times volume, which is $m$. A computer sum over $2000$ thin cylindrical shells gives $167{,}445\,\mathrm{kg\,m^2}$, matching to six digits.

**About a sideways axis through the center**, say $y$. The squared distance from the $y$ axis is $x^2 + z^2 = r^2\cos^2\theta + z^2$:

$$
I_{yy} = \rho\int_{-L/2}^{L/2}\!\int_0^{2\pi}\!\int_0^R (r^2\cos^2\theta + z^2)\,r\,dr\,d\theta\,dz
= \rho\left(L\cdot\pi\cdot\frac{R^4}{4} + \frac{L^3}{12}\cdot 2\pi\cdot\frac{R^2}{2}\right) = \frac{m R^2}{4} + \frac{m L^2}{12} = \frac{m(3R^2 + L^2)}{12}.
$$

The two pieces used $\int_0^{2\pi}\cos^2\theta\,d\theta = \pi$ and $\int_{-L/2}^{L/2}z^2\,dz = L^3/12$. With numbers: $I_{yy} = 100{,}000 \times (3 \times 3.349 + 144)/12 = 1.284 \times 10^6\,\mathrm{kg\,m^2}$.

**What it means.** That is about $7.7$ times the axial value. The stage is far easier to roll than to pitch, which is why roll control uses small thrusters while pitch control needs the main engine's gimbal. As **[[propellant drains|draining-tank]]**, both numbers shrink and $\mathbf{r}_{cm}$ moves, so the autopilot's gains must follow.
:::

::: example Center of mass of a conical nose
A solid cone of even density has base radius $a = 1.83\,\mathrm{m}$ and height $h = 5\,\mathrm{m}$. Its base sits in the plane $z = 0$ and its tip points up the $z$ axis. At height $z$ the cross-section is a disc of radius $a(1 - z/h)$ — full size at the base, zero at the tip.

**Slice it.** Instead of three separate integrals, integrate each disc first: its area is $\pi a^2(1 - z/h)^2$. Then add the discs up the height:

$$
V = \int_0^h \pi a^2\left(1 - \frac{z}{h}\right)^2 dz = \pi a^2\,\frac{h}{3} = 17.53\,\mathrm{m^3}, \qquad
\iiint z\,dV = \int_0^h z\,\pi a^2\left(1 - \frac{z}{h}\right)^2 dz = \pi a^2\,\frac{h^2}{12} .
$$

**The second integral, step by step.** Expand $(1 - z/h)^2 = 1 - 2z/h + z^2/h^2$. Multiply by $z$ and integrate each term from $0$ to $h$: $\tfrac{h^2}{2} - \tfrac{2h^2}{3} + \tfrac{h^2}{4} = h^2(\tfrac{6 - 8 + 3}{12}) = \tfrac{h^2}{12}$.

**Divide.** $z_{cm} = (h^2/12)/(h/3) = h/4 = 1.25\,\mathrm{m}$ above the base. It does not depend on $a$ or on the density. By symmetry $x_{cm} = y_{cm} = 0$. Sense check: most of a cone's volume is near its wide base, so the balance point sits low, below the halfway height of $2.5\,\mathrm{m}$.

**A whole vehicle.** The center of mass of an assembly is the **[[mass-weighted average|balance-beam]]** of its parts' centers. Along the vehicle axis, with a $100\,\mathrm{t}$ propellant load centered at $6\,\mathrm{m}$, $20\,\mathrm{t}$ of structure at $7\,\mathrm{m}$ and $8\,\mathrm{t}$ of engines at $0.5\,\mathrm{m}$:

$$
z_{cm} = \frac{100 \times 6 + 20 \times 7 + 8 \times 0.5}{100 + 20 + 8} = \frac{600 + 140 + 4}{128} = 5.81\,\mathrm{m}.
$$

That is how a mass-properties table is built: integrals for the simple shapes, weighted sums for the assembly.
:::

::: note Earth's flattening is a mass property
Earth bulges at the equator, so it is harder to spin about its polar axis than about an equatorial one. The second zonal harmonic in the module's J2 exercise measures exactly that difference: $J_2 = (C - A)/(M R_e^2)$, the polar moment minus the equatorial moment, in units of $M R_e^2$. With $J_2 = 1.08263 \times 10^{-3}$, $C - A = 2.63 \times 10^{35}\,\mathrm{kg\,m^2}$. More generally, the gravity a satellite feels is a triple integral of $-G\,dm/\lVert\mathbf{r} - \mathbf{r}'\rVert$ over the whole planet, and the terms of that integral's expansion are the planet's mass moments.
:::

::: warning Do not drop the Jacobian factor
The volume element is not $dr\,d\theta\,d\varphi$. Leaving out the factor $r$ or $r^2\sin\theta$ is the most common error in cylindrical and spherical integrals. It gives answers with the wrong units: angles in radians have no units, so a $\theta$ integral without its $r$ is short one meter. Check units on every multiple integral — $\iiint f\,dV$ has the units of $f$ times $\mathrm{m^3}$, whatever coordinates you used.
:::

::: warning Inner limits depend on outer variables, never the reverse
If you find yourself writing $\int_0^{x}\!\int_0^2 \dots dx\,dy$, with $x$ in the limits of the *outer* integral, the order and the limits have been swapped inconsistently. Sketch the region, fix the outer variable, and read off the range of the inner one.
:::

## Check yourself

::: check
Find $\iint_D (x^2 + y^2)\,dA$ over the disc $x^2 + y^2 \le 4$, and explain why polar coordinates are the right choice.
:::

::: answer
**Set up.** In polar coordinates the integrand $x^2 + y^2$ is $r^2$, the disc is $0 \le r \le 2$, $0 \le \theta < 2\pi$, and $dA = r\,dr\,d\theta$.

**Integrate.** $\int_0^{2\pi}\!\int_0^2 r^2 \cdot r\,dr\,d\theta = 2\pi \times \frac{2^4}{4} = 2\pi \times 4 = 8\pi = 25.1$.

**Why polar.** Both the region and the integrand depend only on $r$, so the integral splits into an easy $\theta$ part and a one-line $r$ part. In Cartesian coordinates the limits would be square roots and the integrand would not simplify. Physically, this is $I_{zz}/\sigma$ for a flat, even disc of surface density $\sigma$: $\tfrac{1}{2}(\sigma\pi R^2)R^2$ with $R = 2$ gives $8\pi\sigma$.
:::

::: check
The Jacobian determinant of a map is $-3$ at some point. What does the sign mean, and what does the size mean, for a change of variables?
:::

::: answer
**The size, $3$:** a small patch of $(u, v)$ area lands on a patch three times as big in $(x, y)$, so $dA = 3\,du\,dv$ there.

**The minus sign:** the map flips orientation, like a mirror — a counterclockwise loop in $(u, v)$ becomes a clockwise loop in $(x, y)$. That does not change how much of a density sits in a region, which is why the formula uses $\lvert\det\mathbf{J}\rvert$. Lesson 4's radar-to-east–north–up map had a negative determinant for the same reason, and its volume factor was the absolute value.
:::

::: check
Find the moment of inertia of a thin, even spherical shell of mass $m$ and radius $R$ about a diameter. Start from the surface element $dS = R^2\sin\theta\,d\theta\,d\varphi$.
:::

::: answer
**Density.** The mass is spread over area $4\pi R^2$, so the surface density is $\sigma = m/(4\pi R^2)$.

**Distance from the axis.** Take the $z$ axis. The squared distance is $x^2 + y^2 = R^2\sin^2\theta$.

**Integrate.** $I_{zz} = \sigma\int_0^{2\pi}\!\int_0^\pi R^2\sin^2\theta\cdot R^2\sin\theta\,d\theta\,d\varphi = 2\pi\sigma R^4\int_0^\pi\sin^3\theta\,d\theta$. Using $\int_0^\pi\sin^3\theta\,d\theta = 4/3$: $I_{zz} = 2\pi\sigma R^4 \cdot \tfrac{4}{3} = \tfrac{8}{3}\pi\sigma R^4$. Put $\sigma$ back in: $\tfrac{8}{3}\pi R^4 \cdot \frac{m}{4\pi R^2} = \tfrac{2}{3}mR^2$.

**Going further.** A solid even sphere is a stack of such shells, with $dm = (3m/R^3)r^2\,dr$ for the shell at radius $r$. Adding them, $\int_0^R \tfrac{2}{3}r^2\,dm = \tfrac{2}{5}mR^2$. Earth's actual polar moment is $0.3307\,MR_e^2$, less than $0.4$ — another sign that its mass is packed toward the center.
:::

::: check
A propellant tank is a hemisphere (half a ball) of radius $R$, flat face at $z = 0$, dome pointing up $+z$, filled evenly. Where is its center of mass?
:::

::: answer
**Symmetry.** $x_{cm} = y_{cm} = 0$.

**Slices.** At height $z$ the slice is a disc of radius $\sqrt{R^2 - z^2}$ (Pythagoras), so its area is $\pi(R^2 - z^2)$.

**Volume.** $V = \int_0^R \pi(R^2 - z^2)\,dz = \pi(R^3 - R^3/3) = \tfrac{2}{3}\pi R^3$ — half a ball's volume, as it should be.

**Moment.** $\int z\,dV = \int_0^R \pi z(R^2 - z^2)\,dz = \pi(R^4/2 - R^4/4) = \pi R^4/4$.

**Divide.** $z_{cm} = (\pi R^4/4)/(\tfrac{2}{3}\pi R^3) = 3R/8$. For $R = 1.83\,\mathrm{m}$ that is $0.686\,\mathrm{m}$ above the flat face — below the dome's halfway height, because the wide part is at the bottom. This matters when a stage's center of mass is tracked as the tank drains.
:::

::: check
Why is the chance of landing inside a $1\sigma$ circle in two dimensions ($39.3\%$) so much lower than the $68.3\%$ inside $\pm 1\sigma$ in one dimension?
:::

::: answer
The two-dimensional density is the product of two one-dimensional ones. Being inside the circle, $x^2 + y^2 \le \sigma^2$, is much stricter than $\lvert x\rvert \le \sigma$. It needs $\lvert y\rvert \le \sigma$ too, which alone gives the square $\pm\sigma$ with $0.683^2 = 46.6\%$. The circle then also cuts off the square's corners, leaving $39.3\%$.

Each extra dimension is one more independent way for the error to be large. So at a fixed $k$, containment falls as the number of dimensions rises. Position-error requirements must therefore say whether they are per axis, circular or spherical.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\iint_D f\,dA = \int_a^b\int_{g_1(x)}^{g_2(x)} f\,dy\,dx$ | double integral as an iterated integral; inner limits may depend on the outer variable |
| Fubini: either order gives the same value | swap the order by re-describing the region |
| $dA = \lvert\det\mathbf{J}_{\mathbf{T}}\rvert\,du\,dv$ | change of variables; the Jacobian determinant is the area-scaling factor |
| $dA = r\,dr\,d\theta$; $dV = r\,dr\,d\theta\,dz$; $dV = r^2\sin\theta\,dr\,d\theta\,d\varphi$ | polar, cylindrical, spherical elements |
| $P(r \le k\sigma) = 1 - e^{-k^2/2}$ | 2-D Gaussian containment: $39.3\%$, $86.5\%$, $98.9\%$ at $k = 1, 2, 3$ |
| $m = \iiint\rho\,dV$, $\mathbf{r}_{cm} = \frac{1}{m}\iiint\mathbf{r}\,\rho\,dV$ | mass and center of mass |
| $\mathbf{I} = \iiint(\lVert\mathbf{r}\rVert^2\mathbf{I}_3 - \mathbf{r}\mathbf{r}^\top)\,dm$ | inertia tensor; $I_{zz} = \iiint(x^2 + y^2)\,dm$ |
| cylinder: $I_{\text{axial}} = \tfrac{1}{2}mR^2$, $I_{\text{trans}} = m(3R^2 + L^2)/12$ | $1.67 \times 10^5$ and $1.28 \times 10^6\,\mathrm{kg\,m^2}$ for the tank example |
| cone: $z_{cm} = h/4$ from the base; hemisphere: $3R/8$ | centers of mass of common shapes |
| $J_2 = (C - A)/(MR_e^2)$ | oblateness as a difference of moments of inertia |

The next lesson integrates along curves and over surfaces sitting in space: the work a force does along a trajectory, and the flow of a field through a surface. Both use the parametrizations of this lesson and the arc length of Lesson 5.

::: context long-s The integral sign is a stretched S
Gottfried Leibniz, one of the two inventors of calculus, chose $\int$ in the 1670s as a tall, stretched letter S, for *summa* — Latin for "sum". It is a reminder of what every integral really is: a sum of very many very small pieces. Two of them, $\iint$, mean the pieces are spread over an area; three, $\iiint$, over a volume.
:::

::: context fubini Who Fubini was
Guido Fubini was an Italian mathematician who proved, in 1907, a very general version of the rule that a double integral can be done as two single integrals in either order. The rule needs the function to be well behaved — for instance continuous on a bounded region, or with a finite integral of its absolute value. Every function in this course passes, so you may swap the order freely as long as you re-describe the region correctly.
:::

::: context triangle-strips Two ways to slice a triangle
Left: fix $x$ and run a vertical strip from $y = 0$ up to the slanted edge $y = x$. Right: fix $y$ and run a horizontal strip from the slanted edge $x = y$ across to $x = 2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="30,160 150,160 150,40" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="98" y="88" width="8" height="72" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <text x="70" y="90" font-size="11" fill="#1f2a44" text-anchor="middle">y = x</text>
  <text x="30" y="176" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="150" y="176" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
  <text x="90" y="194" font-size="12" fill="#1d6fd1" text-anchor="middle">fix x: 0 ≤ y ≤ x</text>
  <polygon points="210,160 330,160 330,40" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="258" y="108" width="72" height="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="250" y="90" font-size="11" fill="#1f2a44" text-anchor="middle">x = y</text>
  <text x="210" y="176" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="330" y="176" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
  <text x="270" y="194" font-size="12" fill="#1f2a44" text-anchor="middle">fix y: y ≤ x ≤ 2</text>
</svg>
```

Same triangle, same total, different limits.
:::

::: context polar-patch Why the factor r appears
Each patch below has the same radial width $dr$ and the same angle $d\theta$. The one far from the center is much bigger, because its curved side has length $r\,d\theta$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="180" x2="200" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="180" x2="168.6" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="180" x2="143.1" y2="66.9" stroke="#6c7a93" stroke-width="1"/>
  <path d="M64.6,160 L90.6,145 A70,70 0 0 0 79.5,130.5 L58.3,151.7 A40,40 0 0 1 64.6,160 Z" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <path d="M116.6,130 L142.6,115 A130,130 0 0 0 121.9,88.1 L100.7,109.3 A100,100 0 0 1 116.6,130 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="30" cy="180" r="3" fill="#1f2a44"/>
  <text x="240" y="60" font-size="12" fill="#1f2a44" text-anchor="middle">same dr, same dθ</text>
  <text x="240" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">far patch ≈ dr × r dθ</text>
  <text x="240" y="140" font-size="12" fill="#1d6fd1" text-anchor="middle">near the center: small</text>
</svg>
```

So $dA = r\,dr\,d\theta$: the Jacobian determinant $r$ counts each patch at its true size.
:::

::: context gaussian-trick A famous trick
The one-dimensional bell-curve integral $\int_{-\infty}^{\infty} e^{-x^2}\,dx$ has no antiderivative built from ordinary functions. The way around it is to square it. The square is a double integral of $e^{-(x^2 + y^2)}$ over the whole plane. Switch to polar coordinates, and the $r$ from $dA = r\,dr\,d\theta$ makes it easy: the answer is $\pi$. So the original integral is $\sqrt{\pi}$. That $\sqrt{\pi}$ is where the $\sqrt{2\pi}$ in every Gaussian formula comes from.
:::

::: context theta-phi Two conventions for the same angles
This course, like most physics and engineering books, uses $\theta$ for the angle down from the $z$ axis and $\varphi$ for the angle around it. Many mathematics books swap the two letters. And geographers use **latitude**, measured up from the equator instead of down from the pole, so latitude is $90^\circ - \theta$. The formulas all agree once you know which angle is which — check before copying a formula from anywhere else.
:::

::: context dense-core What the density says about Earth
Surface rocks like granite have a density of about $2700\,\mathrm{kg/m^3}$. Earth's average is about twice that, so something much denser must be hiding inside. Earthquake waves later confirmed it: a metal core, mostly iron and nickel, with densities of roughly $10{,}000$ to $13{,}000\,\mathrm{kg/m^3}$. A single number — mass divided by volume — was the first clue.
:::

::: context skater Why distance from the axis matters so much
A figure skater spins faster when she pulls her arms in. Her mass has not changed; it has moved closer to the spin axis, and the moment of inertia counts distance *squared*. Mass twice as far from the axis counts four times as much. That is why a long, thin rocket stage has a moment about its long axis that is small compared with the moment about a sideways axis.
:::

::: context draining-tank A moving target for the autopilot
During a burn, a first stage can lose most of its mass in a couple of minutes. Tanks drain from the bottom of the liquid upward, so the center of mass slides along the vehicle and the moments of inertia fall. Flight software therefore stores mass properties as tables against propellant used, and control gains are scheduled to match. Sloshing liquid adds its own motion, which is why large tanks have internal baffles.
:::

::: context balance-beam The center of mass is a balance point
Put the three parts on a weightless beam at their positions. The center of mass is where a support would balance it: the heavy propellant near $6\,\mathrm{m}$ pulls the balance point far to the right of the light engines.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="80" x2="330" y2="80" stroke="#1f2a44" stroke-width="3"/>
  <rect x="42.8" y="66" width="12" height="14" fill="#6c7a93"/>
  <rect x="237" y="44" width="36" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="284.5" y="64" width="16" height="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <polygon points="248,82 238,104 258,104" fill="#b4232c"/>
  <text x="48.8" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">8 t</text>
  <text x="255" y="38" font-size="11" fill="#1f2a44" text-anchor="middle">100 t</text>
  <text x="300" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">20 t</text>
  <text x="48.8" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">0.5 m</text>
  <text x="248" y="122" font-size="12" fill="#b4232c" text-anchor="middle">balance: 5.81 m</text>
  <text x="30" y="142" font-size="11" fill="#6c7a93">0 m</text>
  <text x="330" y="142" font-size="11" fill="#6c7a93" text-anchor="end">8 m</text>
</svg>
```
:::
