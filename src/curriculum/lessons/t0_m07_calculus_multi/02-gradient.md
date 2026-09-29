---
id: l02-gradient
title: The gradient and the directional derivative
minutes: 23
covers:
  - gradient and directional derivative
---

You are standing on a hillside in thick fog. You cannot see the top, but you can feel the ground under your boots. Which way should you step to climb fastest? And how steep is that way? Lesson 1 gave you the slope facing east and the slope facing north, one at a time. This lesson packs those slopes into a single arrow, the **gradient**, and it answers both questions at once. The arrow points in the direction of fastest climb. Its length is how steep that climb is. And it always stands at right angles to the [[contour line you are standing on|gradient-picture]]. Three facts, one arrow.

A GNC engineer meets the gradient in two costumes. The first is **a force**. The pull of gravity is minus the gradient of the gravitational potential. That is why gravity points straight down through every surface of equal potential, and why a [[plumb line|plumb-line]] hangs at right angles to "sea level". The second is **a search direction**. Every trajectory optimizer, every least-squares orbit fit and every training loop for a learned controller walks downhill along a negative gradient. And the rate at which a cost changes when you nudge a design in some chosen direction is a **directional derivative** — the other half of this lesson's title.

On the way, you will also derive the first piece of the multivariable chain rule: how a scalar field changes along a moving point. The proof that the gradient stands at right angles to level sets needs it. Lesson 4 will grow it into the full chain rule for vector functions.

## From partials to a vector

Let $f:\mathbb{R}^n \to \mathbb{R}$ have partial derivatives at a point. The **gradient** of $f$ is the column of those partial derivatives, stacked into one vector:

$$
\nabla f = \begin{bmatrix} \dfrac{\partial f}{\partial x_1} \\ \vdots \\ \dfrac{\partial f}{\partial x_n} \end{bmatrix}
= \left[\frac{\partial f}{\partial x_1}, \dots, \frac{\partial f}{\partial x_n}\right]^\top .
$$

The upside-down triangle $\nabla$ is called **[[nabla|nabla-name]]** or "del". Read $\nabla f$ aloud as "grad f" or "del f".

Each component has the units of $f$ divided by a length. Here is a case that matters. Gravitational potential energy per kilogram is measured in $\mathrm{J/kg}$, which is the same as $\mathrm{m^2/s^2}$. Divide by meters and you get $\mathrm{m/s^2}$ — an acceleration. The gradient of a potential is the right kind of thing to be a pull.

In three dimensions, with $\hat{\mathbf{x}}$, $\hat{\mathbf{y}}$, $\hat{\mathbf{z}}$ the unit arrows along the axes ("x hat" and so on):

$$
\nabla f = \frac{\partial f}{\partial x}\,\hat{\mathbf{x}} + \frac{\partial f}{\partial y}\,\hat{\mathbf{y}} + \frac{\partial f}{\partial z}\,\hat{\mathbf{z}} .
$$

The gradient is a field of its own: it puts an arrow at every point. Where $f$ is steep the arrows are long. Where $f$ is flat they shrink. At a hilltop, a valley floor or a saddle (a mountain pass) they vanish.

You have already met one. Take the dynamic pressure $q(\rho, v) = \tfrac{1}{2}\rho v^2$ from Lesson 1, as a function of the two inputs $(\rho, v)$. Its gradient is $\nabla q = [\tfrac{1}{2}v^2,\ \rho v]^\top$. At $\rho = 1.225\,\mathrm{kg/m^3}$ and $v = 250\,\mathrm{m/s}$ that is $[31{,}250,\ 306.25]^\top$. The exchange rates you computed one at a time *are* the gradient.

## The directional derivative

A partial derivative measures the slope along an axis: due east, due north. But you can walk any way you like — northeast, say. The slope in that direction is the **directional derivative**.

To define it, pick a direction as a **[[unit vector|unit-vector]]** $\mathbf{u}$ — an arrow of length one, $\lVert \mathbf{u} \rVert = 1$, so that it says "which way" and nothing about "how far". Step a distance $h$ from $\mathbf{x}$ in that direction. The directional derivative of $f$ along $\mathbf{u}$ is

$$
D_{\mathbf{u}} f(\mathbf{x}) = \lim_{h \to 0} \frac{f(\mathbf{x} + h\mathbf{u}) - f(\mathbf{x})}{h} .
$$

Read $D_{\mathbf{u}} f$ as "D u of f". It is the change in $f$ per unit distance traveled along $\mathbf{u}$. If you choose $\mathbf{u} = \mathbf{e}_i$, one of the axis directions, you get back the partial derivative $\partial f/\partial x_i$.

Now the good part: you do not need a new limit for every direction. Use Lesson 1's tangent-plane approximation with the step $\delta\mathbf{x} = h\mathbf{u}$. Each input $x_i$ moves by $h u_i$, and each contributes its partial derivative times that move:

$$
f(\mathbf{x} + h\mathbf{u}) \approx f(\mathbf{x}) + \sum_{i=1}^{n} \frac{\partial f}{\partial x_i}\, h u_i = f(\mathbf{x}) + h\, \nabla f \cdot \mathbf{u}.
$$

The sum is a dot product: multiply matching components and add. The error is of size $h^2$. Now subtract $f(\mathbf{x})$, divide by $h$, and let $h$ shrink. The error term, being of size $h^2/h = h$, disappears:

$$
D_{\mathbf{u}} f = \nabla f \cdot \mathbf{u} .
$$

That is the whole machine. Know the gradient, and one dot product gives the slope in any direction.

### Reading the dot product as an angle

A dot product can also be written with the **[[angle between the two arrows|dot-cosine]]**, $\theta$: $\mathbf{a} \cdot \mathbf{b} = \lVert \mathbf{a} \rVert \lVert \mathbf{b} \rVert \cos\theta$. Since $\lVert \mathbf{u} \rVert = 1$,

$$
D_{\mathbf{u}} f = \lVert \nabla f \rVert\, \lVert \mathbf{u} \rVert \cos\theta = \lVert \nabla f \rVert \cos\theta .
$$

This one line holds all the geometry of the gradient. Walk through the cases:

- **$\theta = 0$**, walking along $\nabla f$: $\cos\theta = 1$, its largest value. So $f$ increases fastest in the gradient direction, at the rate $\lVert \nabla f \rVert$.
- **$\theta = 180^\circ$**, walking against it: $\cos\theta = -1$. The fastest way *down* is $-\nabla f$, the direction of **steepest descent**.
- **$\theta = 90^\circ$**, walking at right angles to it: $\cos\theta = 0$. Moving that way does not change $f$ at all, to first order. Those are the directions along the contour line — tangent to the level set through the point.

::: key
$\nabla f = [\partial f/\partial x_1, \dots, \partial f/\partial x_n]^\top$. It points in the direction of steepest ascent, its magnitude $\lVert \nabla f \rVert$ is that steepest slope, and it is normal to the level set of $f$ through the point.
:::

::: key
The directional derivative along a unit vector $\mathbf{u}$ is $D_{\mathbf{u}} f = \nabla f \cdot \mathbf{u} = \lVert \nabla f \rVert \cos\theta$, where $\theta$ is the angle between $\mathbf{u}$ and $\nabla f$. It is maximal along $\nabla f$ and zero along the level set.
:::

("Normal" here means "at right angles to", as in the word "normal" for a line standing straight up from a surface.)

::: example A directional derivative in the plane
Let $f(x, y) = x^2 + 3xy$. How fast does $f$ change at the point $(1, 2)$ if you move toward the point $(4, 6)$?

**Step 1: the gradient.** The partials are $f_x = 2x + 3y$ and $f_y = 3x$. At $(1, 2)$: $f_x = 2 + 6 = 8$ and $f_y = 3$, so $\nabla f(1, 2) = [8, 3]^\top$.

**Step 2: the unit direction.** The move from $(1, 2)$ to $(4, 6)$ is $(3, 4)$. Its length is $\sqrt{9 + 16} = 5$. Divide by $5$: $\mathbf{u} = [0.6, 0.8]^\top$.

**Step 3: the dot product.**

$$
D_{\mathbf{u}} f = 8 \times 0.6 + 3 \times 0.8 = 4.8 + 2.4 = 7.2 .
$$

**Step 4: compare with the best possible.** The steepest rate at that point is $\lVert \nabla f \rVert = \sqrt{64 + 9} = \sqrt{73} = 8.54$. So this direction gets $7.2/8.54 = 0.843$ of the maximum. That is the cosine of the angle from the gradient: $\theta = \arccos 0.843 = 32.6^\circ$.

**Step 5: the flat direction.** The direction of no change is at right angles to $[8, 3]^\top$. Swap the components and flip one sign to get $[-3, 8]^\top$, then divide by its length $\sqrt{73}$: $[-0.351, 0.936]^\top$. Check: $8 \times (-3) + 3 \times 8 = 0$. This is the tangent to the level curve $x^2 + 3xy = 7$ through $(1, 2)$ (and indeed $1 + 6 = 7$).

Sanity check: $7.2$ is less than $8.54$, as every directional derivative must be.
:::

::: warning Unit vectors only
The formula $D_{\mathbf{u}} f = \nabla f \cdot \mathbf{u}$ needs a unit vector. Dot the gradient with the raw move $(3, 4)$, of length $5$, and you get five times the true rate per meter: $36$ instead of $7.2$. There is one exception, and it is useful. If $\mathbf{v}$ is a *velocity*, then $\nabla f \cdot \mathbf{v}$, with no normalizing, is the rate of change of $f$ per second rather than per meter. That is the chain rule, coming next.
:::

## Why the gradient is normal to level sets

The cosine argument showed that the flat directions are at right angles to $\nabla f$. Let us make sure those flat directions are exactly the directions along the level set, with a cleaner argument.

Picture an ant walking along a contour line of the hill. Its height never changes. Let its position at time $t$ be $\mathbf{r}(t)$, so that $f(\mathbf{r}(t)) = c$ for every $t$. The ant's velocity, $\dot{\mathbf{r}}$ (read "r dot", the time derivative of $\mathbf{r}$), points along the contour: it is a tangent to the level set.

How fast does $f$ change along the ant's path? In a short time $\delta t$ the ant moves by $\delta\mathbf{x} \approx \dot{\mathbf{r}}\,\delta t$. The tangent-plane rule says $f$ changes by about $\nabla f \cdot \dot{\mathbf{r}}\,\delta t$. Divide by $\delta t$ and let it shrink:

$$
\frac{d}{dt} f(\mathbf{r}(t)) = \lim_{\delta t \to 0} \frac{f(\mathbf{r}(t + \delta t)) - f(\mathbf{r}(t))}{\delta t} = \nabla f \cdot \dot{\mathbf{r}} .
$$

This is the **chain rule for a scalar field along a curve**: $\frac{d}{dt} f(\mathbf{r}(t)) = \nabla f \cdot \dot{\mathbf{r}}$. It works for any moving point, not only ants on contours.

Now use the fact that this ant's height never changes. The left side is zero, so

$$
\nabla f \cdot \dot{\mathbf{r}} = 0 .
$$

A zero dot product means a right angle. The gradient is at right angles to the velocity of every path that stays in the level set — so it is at right angles to every tangent direction of the level set. That is exactly what "normal to the level set" means.

Two consequences follow at once.

**The tangent plane to a surface.** A surface given by an equation $F(x, y, z) = c$ is a level set of $F$. At a point $\mathbf{x}_0$ on it, the tangent plane is every point $\mathbf{x}$ with $\nabla F(\mathbf{x}_0) \cdot (\mathbf{x} - \mathbf{x}_0) = 0$ — every point reached by moving at right angles to the gradient. The unit normal to the surface is $\nabla F/\lVert \nabla F \rVert$.

**Gravity and "level".** Gravity is $\mathbf{g} = -\nabla U$ for a potential $U$ (Lesson 10 develops this). So gravity is at right angles to every surface of equal potential. The geoid is one of those surfaces. A plumb line hangs along $\mathbf{g}$, so it stands at right angles to the geoid. "Level" really means "at right angles to gravity".

::: example The normal to the reference ellipsoid and geodetic latitude
Earth is not a perfect ball. It bulges at the equator. Mapmakers and GPS receivers use a smooth, slightly squashed shape called the **[[WGS84 reference ellipsoid|wgs84]]**. It is the level set

$$
F(x, y, z) = \frac{x^2 + y^2}{a^2} + \frac{z^2}{b^2} = 1, \qquad a = 6{,}378{,}137\,\mathrm{m}, \quad b = 6{,}356{,}752.3\,\mathrm{m},
$$

where $a$ is the equatorial radius and $b$ the polar radius, about $21\,\mathrm{km}$ shorter.

**Step 1: the normal.** Differentiate each term: $\nabla F = [2x/a^2,\ 2y/a^2,\ 2z/b^2]^\top$. This arrow points straight out of the surface.

**Step 2: a point.** In the $y = 0$ plane, take $x = a\cos 45^\circ = 4{,}510{,}024\,\mathrm{m}$ and $z = b\sin 45^\circ = 4{,}494{,}903\,\mathrm{m}$. It lies on the surface, because $F = \cos^2 45^\circ + \sin^2 45^\circ = 1$. Put these into $\nabla F$ and drop the common factor $2$: the normal points along $[\cos 45^\circ/a,\ 0,\ \sin 45^\circ/b]^\top$.

**Step 3: two latitudes.** The angle the normal makes with the equator is the **geodetic latitude** $\varphi$ ("phi") — the latitude on every map and in every GPS receiver. Its tangent is the $z$ part over the $x$ part:

$$
\tan\varphi = \frac{\sin 45^\circ/b}{\cos 45^\circ/a} = \frac{a}{b} = 1.003364, \qquad \varphi = 45.096^\circ .
$$

The angle of the arrow from Earth's center to the point is the **geocentric latitude** $\psi$ ("psi"): $\tan\psi = z/x = b/a$, so $\psi = 44.904^\circ$.

**Step 4: what the gap means.** Because the surface is squashed, the normal line does not pass through Earth's center. The two latitudes differ by $0.192^\circ$, which is $11.5$ arcminutes, and on the ground that is about $21\,\mathrm{km}$. A tracking station's latitude given as geodetic but read as geocentric would put the station in the wrong place by roughly that much — a real and classic error.

Sanity check: the normal tilts toward the pole more steeply than the radius, so $\varphi > \psi$. On a flattened Earth, that is the way [[the difference must go|latitude-picture]].
:::

## Gradients of the distance function

Lesson 1 found the partial derivatives of $r = \lVert \mathbf{r} \rVert$: $\partial r/\partial x = x/r$, and the same for $y$ and $z$. Stack them into a column:

$$
\nabla r = \frac{1}{r}\begin{bmatrix} x \\ y \\ z \end{bmatrix} = \frac{\mathbf{r}}{r} = \hat{\mathbf{r}} .
$$

The gradient of distance-from-the-origin is $\hat{\mathbf{r}}$, the unit arrow pointing straight outward. Read it through the three facts. Distance grows fastest when you move straight outward. It grows at exactly one meter per meter, since $\lVert \hat{\mathbf{r}} \rVert = 1$. And it does not change at all when you move sideways, around a sphere centered on the origin.

The same calculation for the range to a station gives

$$
\nabla \lVert \mathbf{r} - \mathbf{r}_s \rVert = \frac{\mathbf{r} - \mathbf{r}_s}{\lVert \mathbf{r} - \mathbf{r}_s \rVert} = \hat{\mathbf{u}},
$$

the unit line-of-sight arrow from station to satellite. So a range measurement is **[[blind to sideways motion|range-blind]]**: the directional derivative of range along any direction at right angles to the line of sight is zero. Lesson 3 turns this into the first row of a filter's $\mathbf{H}$ matrix.

For powers of the distance, Lesson 1 gave $\partial(r^n)/\partial x = n\,x\,r^{n-2}$. Stacking the three components:

$$
\nabla (r^n) = n\,r^{n-2}\,\mathbf{r}, \qquad \text{in particular} \qquad \nabla\!\left(\frac{1}{r}\right) = -\frac{\mathbf{r}}{r^3}, \qquad \nabla\!\left(\frac{1}{r^3}\right) = -\frac{3\,\mathbf{r}}{r^5}.
$$

::: key
$\nabla \lVert \mathbf{r} \rVert = \hat{\mathbf{r}}$ and $\nabla \lVert \mathbf{r} - \mathbf{r}_s \rVert = (\mathbf{r} - \mathbf{r}_s)/\lVert \mathbf{r} - \mathbf{r}_s \rVert$, the unit line of sight. For powers, $\nabla (r^n) = n r^{n-2}\mathbf{r}$, so $\nabla(1/r) = -\mathbf{r}/r^3$.
:::

::: example Gravitational acceleration from the potential
The **gravitational potential** is the potential energy per kilogram at each point. For a single round planet — the two-body problem — it is $U = -\mu/r$. Here $\mu$ ("mu") is the planet's gravitational parameter, $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ for Earth. The minus sign makes $U$ negative everywhere and rising toward zero far away: climbing costs energy.

**Step 1: the gradient.** $\mu$ is a constant, so pull it out and use $\nabla(1/r) = -\mathbf{r}/r^3$:

$$
\nabla U = -\mu\,\nabla\!\left(\frac{1}{r}\right) = \frac{\mu\,\mathbf{r}}{r^3}.
$$

**Step 2: the pull.** The acceleration is minus the gradient:

$$
\mathbf{a} = -\nabla U = -\frac{\mu\,\mathbf{r}}{r^3} = -\frac{\mu}{r^2}\hat{\mathbf{r}} .
$$

The gradient of $U$ points outward, because potential energy increases as you climb. The acceleration, being minus the gradient, points inward, with size $\mu/r^2$ — the inverse-square law.

**Step 3: numbers at the International Space Station's height.** At $400\,\mathrm{km}$ altitude, $r = 6{,}778.137\,\mathrm{km}$. Then $\mu/r^2 = 8.676\,\mathrm{m/s^2}$ and $U = -58.81\,\mathrm{MJ/kg}$. Sanity check: $8.676$ is a bit less than the $9.81\,\mathrm{m/s^2}$ at the surface, as it should be about $400\,\mathrm{km}$ up.

**Step 4: a slanted move.** From the point $(r, 0, 0)$, move along $\mathbf{u} = [\cos 45^\circ, \sin 45^\circ, 0]^\top$, half outward and half sideways. The gradient there is $(\mu/r^2)\,\hat{\mathbf{x}}$, so

$$
D_{\mathbf{u}} U = \nabla U \cdot \mathbf{u} = \frac{\mu}{r^2}\cos 45^\circ = 6.135\,\mathrm{J/kg\ per\ meter}.
$$

Climbing straight up would cost the full $8.676\,\mathrm{J/kg}$ per meter. Moving purely sideways costs nothing — the statement that each sphere $r = \text{const}$ is a surface of equal potential.
:::

::: key Gravity from a potential
Two-body gravitational potential and the acceleration derived from it: $U = -\mu/r$, so $\mathbf{a} = -\nabla U = -\mu\,\hat{\mathbf{r}}/r^2 = -\mu\,\mathbf{r}/r^3$.
:::

## Descending a gradient

Back to the foggy hill, but now you want to get *down* to the valley. The rule: feel which way is steepest downhill, take a step that way, and repeat. Because $-\nabla f$ is the direction of steepest decrease, the step is

$$
\mathbf{x}_{k+1} = \mathbf{x}_k - \alpha\, \nabla f(\mathbf{x}_k).
$$

Here $\mathbf{x}_k$ is where you are after $k$ steps, and $\alpha$ ("alpha") is the **step length**. Choose it small enough that the tangent-plane picture still holds over one step. This method is called **[[gradient descent|gradient-descent]]**, or steepest descent.

::: example Two steps into a valley
Take $f(x, y) = (x - 1)^2 + 4(y + 2)^2$. Both terms are squares, so $f$ is never negative. Its lowest value is $0$, at $(1, -2)$.

**Start** at the origin: $f = 1 + 4 \times 4 = 17$. The gradient is $\nabla f = [2(x-1),\ 8(y+2)]^\top = [-2, 16]^\top$.

**Step** with $\alpha = 0.1$: $(0, 0) - 0.1 \times (-2, 16) = (0.2, -1.6)$. There $f = 0.8^2 + 4 \times 0.4^2 = 0.64 + 0.64 = 1.28$. That is a drop of over $90\%$ in one step.

**Best step along this line.** Minimizing $f$ along the ray from the origin gives $\alpha = 0.1265$. It reaches $(0.253, -2.023)$ with $f = 0.560$.

Look at where that best step landed. It went *past* $y = -2$ and barely moved toward $x = 1$. The gradient at the start was dominated by the steep $y$ direction ($16$ against $2$), so the step followed $y$. Keep going and the path zigzags across the narrow valley. Lesson 4 explains this zigzag with the Hessian and shows how Newton's method avoids it.
:::

::: note The gradient in spherical coordinates
In spherical coordinates $(r, \theta, \varphi)$, with polar angle $\theta$ measured from the $z$ axis and azimuth $\varphi$ around it, the gradient is *not* the plain list of partial derivatives. The angle parts must be divided by how far a small turn actually moves you:

$$
\nabla f = \frac{\partial f}{\partial r}\,\hat{\mathbf{r}} + \frac{1}{r}\frac{\partial f}{\partial \theta}\,\hat{\boldsymbol{\theta}} + \frac{1}{r\sin\theta}\frac{\partial f}{\partial \varphi}\,\hat{\boldsymbol{\varphi}} .
$$

The factors appear because a small change $d\theta$ moves you a distance $r\,d\theta$, not $d\theta$, and a small change $d\varphi$ moves you around a circle of radius $r\sin\theta$. The gradient is a rate per meter, so it must divide by those distances. This is why the module's $J_2$ exercise asks you to work in Cartesian coordinates, where no such factors arise.
:::

::: warning Column or row?
In this module the gradient is a column. The derivative of a scalar with respect to a vector, $\partial f/\partial \mathbf{x}$, is often written as a row. They hold the same numbers: the row is $(\nabla f)^\top$. Keep track of which you have. In Lesson 3 the rows of a Jacobian are gradients turned on their side, and the difference decides whether a matrix product is even defined.
:::

## Check yourself

::: check
For $f(x, y, z) = xyz$, find the gradient at $(1, 2, 3)$, the direction of steepest ascent as a unit vector, and the steepest rate of increase.
:::

::: answer
Each partial freezes the other two letters: $\nabla f = [yz,\ xz,\ xy]^\top$. At $(1, 2, 3)$ that is $[6, 3, 2]^\top$.

Its length is $\sqrt{36 + 9 + 4} = \sqrt{49} = 7$. So the steepest rate is $7$, and the direction is $[6, 3, 2]^\top/7 = [0.857, 0.429, 0.286]^\top$.
:::

::: check
At some point $\nabla f = [3, 4]^\top$. Find all unit directions along which $f$ is not changing, and the directional derivative along $\mathbf{u} = [1, 0]^\top$.
:::

::: answer
Directions of no change are at right angles to the gradient. Swap and flip a sign to get $[-4, 3]^\top$, of length $5$. So the two directions are $\pm[-4, 3]^\top/5 = \pm[-0.8, 0.6]^\top$.

Along $[1, 0]^\top$ the directional derivative is $\nabla f \cdot \mathbf{u} = 3 \times 1 + 4 \times 0 = 3$. That is also $\partial f/\partial x$, as it must be for an axis direction. The maximum rate is $\lVert \nabla f \rVert = 5$, so the $x$ axis achieves $60\%$ of it.
:::

::: check
Find the tangent plane to the sphere $x^2 + y^2 + z^2 = 9$ at the point $(1, 2, 2)$.
:::

::: answer
The sphere is a level set of $F = x^2 + y^2 + z^2$. Then $\nabla F = [2x, 2y, 2z]^\top = [2, 4, 4]^\top$ at the point. It is parallel to the position arrow $(1, 2, 2)$, as it should be: on a ball, "straight out" is the radius.

The plane is every point reached by moving at right angles to it: $2(x - 1) + 4(y - 2) + 4(z - 2) = 0$. Expand and divide by $2$: $x + 2y + 2z = 9$. Check: the point itself gives $1 + 4 + 4 = 9$.
:::

::: check
During a range-only tracking pass (no Doppler), a satellite moves, for one instant, exactly across the line of sight. What does the range measurement tell you about the satellite's velocity at that instant, and why?
:::

::: answer
Nothing about its speed across the beam. The rate of change of range along a direction $\mathbf{u}$ is $D_{\mathbf{u}}\rho = \hat{\mathbf{u}}_{\text{los}} \cdot \mathbf{u}$, where $\hat{\mathbf{u}}_{\text{los}} = \nabla\rho$ is the unit line of sight. Motion at right angles to the line of sight runs along a level set of $\rho$ — a sphere centered on the station — so its directional derivative is zero. The range is momentarily not changing, however fast the satellite crosses. Only the line-of-sight part of the velocity changes the range.
:::

::: check
The potential $U = -\mu/r$ has the same value everywhere on a sphere of radius $r$. Use the gradient to explain why a satellite in a perfectly circular two-body orbit feels no acceleration along its direction of travel.
:::

::: answer
The acceleration is $\mathbf{a} = -\nabla U = -\mu\,\mathbf{r}/r^3$. It points along $\hat{\mathbf{r}}$, at right angles to the sphere $r = \text{const}$. That sphere is a level set of $U$, and gradients are normal to level sets. On a circular orbit the velocity is tangent to that sphere, so $\mathbf{a} \cdot \mathbf{v} = 0$. No part of the pull lies along the velocity, so nothing speeds the satellite up or slows it down: its speed stays constant.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\nabla f = [\partial f/\partial x_1, \dots, \partial f/\partial x_n]^\top$ | gradient: column of partial derivatives, a vector field |
| $D_{\mathbf{u}} f = \nabla f \cdot \mathbf{u} = \lVert \nabla f \rVert\cos\theta$ | directional derivative along unit $\mathbf{u}$ |
| $\nabla f \perp$ level set | zero directional derivative along tangents; unit normal $\nabla F/\lVert\nabla F\rVert$ |
| $\frac{d}{dt} f(\mathbf{r}(t)) = \nabla f \cdot \dot{\mathbf{r}}$ | chain rule along a curve (scalar case) |
| $\nabla \lVert \mathbf{r} \rVert = \hat{\mathbf{r}}$, $\nabla \lVert \mathbf{r} - \mathbf{r}_s \rVert = \hat{\mathbf{u}}$ | distance gradients are unit arrows along the line of sight |
| $\nabla (r^n) = n r^{n-2}\mathbf{r}$, $\nabla(1/r) = -\mathbf{r}/r^3$ | gradients of powers of distance |
| $\mathbf{a} = -\nabla(-\mu/r) = -\mu\mathbf{r}/r^3$ | gravitational acceleration, $8.68\,\mathrm{m/s^2}$ at $400\,\mathrm{km}$ |
| $\mathbf{x}_{k+1} = \mathbf{x}_k - \alpha\nabla f$ | gradient descent step |

The next lesson moves from functions with one output to functions with several. It stacks the gradients of the outputs, each turned on its side, into a table: the Jacobian, which is the $\mathbf{H}$ matrix of an orbit-determination filter.

::: context gradient-picture Arrows across the contours
The bowl $f = x^2 + 4y^2$, drawn as contour lines $f = 1, 4, 9$. The gradient arrows (blue) on the middle contour all cross it at right angles and point uphill. The dashed red line is the contour's tangent at one point: the direction of no change.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs><marker id="gpa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker></defs>
  <ellipse cx="130" cy="110" rx="40" ry="20" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <ellipse cx="130" cy="110" rx="80" ry="40" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <ellipse cx="130" cy="110" rx="120" ry="60" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#gpa)">
    <line x1="210" y1="110" x2="240" y2="110"/>
    <line x1="170" y1="75.4" x2="178.3" y2="46.5"/>
    <line x1="90" y1="75.4" x2="81.7" y2="46.5"/>
    <line x1="50" y1="110" x2="20" y2="110"/>
    <line x1="90" y1="144.6" x2="81.7" y2="173.5"/>
    <line x1="170" y1="144.6" x2="178.3" y2="173.5"/>
  </g>
  <line x1="131.6" y1="64.3" x2="208.4" y2="86.5" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="130" cy="110" r="3" fill="#1f2a44"/>
  <text x="258" y="40" font-size="12" fill="#1f2a44">f = 1, 4, 9</text>
  <text x="258" y="80" font-size="12" fill="#1d6fd1">∇f: uphill,</text>
  <text x="258" y="96" font-size="12" fill="#1d6fd1">across the</text>
  <text x="258" y="112" font-size="12" fill="#1d6fd1">contour</text>
  <text x="258" y="150" font-size="12" fill="#b4232c">tangent: flat</text>
</svg>
```

The arrows are not aimed at the center. On an oval contour, "straight across the line" and "toward the middle" are different directions, and the gradient always picks the first.
:::

::: context plumb-line The oldest level
A plumb line is a weight hanging on a string. Builders have used one for thousands of years to make walls vertical: the string lines up with gravity. Surveyors define "level" as at right angles to that string. Because gravity is the gradient of a potential, the plumb line always points straight across the surfaces of equal potential — which is why this lesson's geometry is also the geometry of every spirit level.
:::

::: context nabla-name Why an upside-down triangle
The symbol $\nabla$ is named after a kind of ancient harp, whose shape it resembles; "nabla" is the Greek word for that harp. It is also called "del". You will see it again in Lesson 8, where $\nabla \cdot \mathbf{F}$ (divergence) and $\nabla \times \mathbf{F}$ (curl) treat it as if it were a vector of derivatives, $[\partial/\partial x,\ \partial/\partial y,\ \partial/\partial z]^\top$. Here, next to a scalar, it makes the gradient.
:::

::: context unit-vector Making a unit vector
A unit vector is any arrow of length exactly one. It carries direction and nothing else. To turn any nonzero arrow into one, divide it by its own length. The arrow $(3, 4)$ has length $\sqrt{9 + 16} = 5$, so the unit vector in its direction is $(0.6, 0.8)$. Check: $0.36 + 0.64 = 1$. A hat on a letter, as in $\hat{\mathbf{r}}$, is the usual sign that an arrow has been shrunk (or stretched) to length one.
:::

::: context dot-cosine The dot product as a shadow
Shine a light straight down onto the direction $\mathbf{u}$. The shadow of the gradient arrow on that line has length $\lVert \nabla f \rVert \cos\theta$. That shadow is the directional derivative.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="dcb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="dck" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
  </defs>
  <line x1="20" y1="170" x2="340" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="40" y1="170" x2="185.5" y2="47.9" stroke="#1d6fd1" stroke-width="3" marker-end="url(#dcb)"/>
  <line x1="185.5" y1="47.9" x2="185.5" y2="170" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="40" y1="176" x2="185.5" y2="176" stroke="#b4232c" stroke-width="4"/>
  <line x1="40" y1="170" x2="100" y2="170" stroke="#1f2a44" stroke-width="2.5" marker-end="url(#dck)"/>
  <path d="M85,170 A45,45 0 0,0 74.5,141.1" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="156" font-size="12" fill="#1f2a44">θ</text>
  <text x="120" y="80" font-size="12" fill="#1d6fd1">∇f</text>
  <text x="60" y="162" font-size="11" fill="#1f2a44">u</text>
  <text x="112" y="194" font-size="12" fill="#b4232c" text-anchor="middle">‖∇f‖ cos θ</text>
  <text x="200" y="100" font-size="12" fill="#1f2a44">θ = 0: shadow is longest</text>
  <text x="200" y="118" font-size="12" fill="#1f2a44">θ = 90°: no shadow</text>
</svg>
```

Here $\theta = 40^\circ$, so the shadow is $\cos 40^\circ \approx 0.77$ of the arrow's length.
:::

::: context wgs84 The world's reference shape
WGS84, the World Geodetic System of 1984, is the reference that GPS uses. It defines an ellipsoid with equatorial radius $a = 6{,}378{,}137\,\mathrm{m}$ and a flattening of $1/298.257223563$, which makes the polar radius about $21.4\,\mathrm{km}$ shorter. The squashing is small — about a third of a percent — but at the scale of a planet, $21\,\mathrm{km}$ is far too much to ignore in navigation.
:::

::: context latitude-picture Two latitudes, drawn
An ellipse much flatter than Earth, so the effect is visible. The normal to the surface (blue) crosses the equator away from the center; the radius (gray) runs to the center.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="190" x2="215" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="190" x2="50" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="200.0,190.0 199.4,182.2 197.7,174.4 194.9,166.7 191.0,159.2 185.9,152.0 179.9,145.0 172.9,138.4 164.9,132.1 156.1,126.4 146.4,121.1 136.0,116.3 125.0,112.1 113.4,108.4 101.3,105.4 88.8,103.1 76.0,101.4 63.1,100.3 50.0,100.0"/>
  <line x1="50" y1="190" x2="156.1" y2="126.4" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="117.9" y1="190" x2="179.2" y2="87.8" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="156.1" cy="126.4" r="4" fill="#b4232c"/>
  <path d="M80,190 A30,30 0 0,0 75.7,174.6" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M139.9,190 A22,22 0 0,0 129.2,171.1" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="84" y="184" font-size="12" fill="#6c7a93">ψ</text>
  <text x="143" y="184" font-size="12" fill="#1d6fd1">φ</text>
  <text x="44" y="78" font-size="11" fill="#1f2a44">pole</text>
  <text x="218" y="194" font-size="11" fill="#1f2a44">equator</text>
  <text x="222" y="60" font-size="11" fill="#1d6fd1">normal: geodetic φ</text>
  <text x="222" y="80" font-size="11" fill="#6c7a93">radius: geocentric ψ</text>
  <text x="222" y="120" font-size="11" fill="#1f2a44">flattening exaggerated</text>
</svg>
```

In this cartoon $\varphi \approx 59^\circ$ and $\psi \approx 31^\circ$. For the real Earth the gap is at most about a fifth of a degree.
:::

::: context range-blind What a radar cannot see
Stand at the center of a merry-go-round and hold a tape measure to a rider. However fast the ride spins, the tape reads the same: the rider moves at right angles to your line of sight. A radar measuring range has the same blind spot. It sees motion toward or away from it instantly, and motion across its beam not at all — until that motion, over time, changes the geometry. Filters recover the sideways motion by combining many measurements with the laws of motion.
:::

::: context gradient-descent The same step, everywhere
Gradient descent is one of the most widely used ideas in engineering. Machine-learning systems are trained with versions of it, adjusting millions of numbers a little at a time downhill on an error measure. Trajectory optimizers and orbit-fitting programs use smarter relatives — Newton-like methods that also look at curvature (Lesson 4) — but every one of them starts from the gradient. The direction $-\nabla f$ is the steepest way down, and any direction less than $90^\circ$ away from it also goes downhill for a small enough step.
:::
