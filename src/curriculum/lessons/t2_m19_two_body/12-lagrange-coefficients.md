---
id: l12-lagrange-coefficients
title: The Lagrange f and g coefficients
minutes: 17
covers:
  - Lagrange f and g coefficients
---

Picture a flat city laid out on a grid. "Three blocks east and two blocks north" gets you to any corner, because two directions are enough to reach every point on a flat map. You never need a third.

A two-body orbit is flat in the same way. It lies in one fixed plane, and the starting position $\mathbf{r}_0$ and starting velocity $\mathbf{v}_0$ are two different directions in that plane. So the position at any later time is "so much of $\mathbf{r}_0$ plus so much of $\mathbf{v}_0$" — and the same goes for the later velocity. The four "how much" numbers are the **Lagrange coefficients** $f$, $g$, $\dot{f}$ and $\dot{g}$. They depend only on how far the spacecraft has gone round (in time, in true anomaly, or in the universal anomaly $\chi$), and they turn propagation into one small matrix multiplication. No orbital elements, no rotation matrices, no quadrant checks.

These coefficients are the working core of several tools you will meet: the universal-variable propagator of this module's exercise, the Lambert solvers of the targeting module, **[[Gibbs's method|gibbs]]** and Herrick–Gibbs orbit determination from position fixes, and the two-body **[[state transition matrix|stm]]** that a navigation filter builds its predictions on. Wherever a state at one time is written in terms of a state at another time, $f$ and $g$ are inside.

This lesson derives the coefficients twice — first as functions of the true-anomaly change $\Delta\nu$, then as functions of the universal anomaly $\chi$ — proves the identity that ties the four together, and applies them to the GTO and to the ISS-like state, closing the loop with the propagations of the last two lessons.

## Why a mix of r₀ and v₀ works

### The plane never changes

The angular momentum $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ is constant. A cross product is always square to both of its inputs, so $\mathbf{r}(t)$ and $\mathbf{v}(t)$ stay square to the same fixed $\mathbf{h}$ forever. They never leave the plane.

The starting vectors $\mathbf{r}_0$ and $\mathbf{v}_0$ lie in that same plane, and they point in different directions (if they were parallel, $\mathbf{h}$ would be zero and there would be no orbit). Two different directions in a plane form a **[[basis|basis]]**: every vector in the plane can be built from them. So there must be numbers $f, g, \dot{f}, \dot{g}$ — changing with time — such that

$$
\mathbf{r}(t) = f\,\mathbf{r}_0 + g\,\mathbf{v}_0, \qquad \mathbf{v}(t) = \dot{f}\,\mathbf{r}_0 + \dot{g}\,\mathbf{v}_0 .
$$

### The dots are real derivatives

The dots are honest time derivatives. Differentiate the first equation, remembering that $\mathbf{r}_0$ and $\mathbf{v}_0$ are fixed, and you get the second.

At the start, $t = t_0$, nothing has moved: $f = 1$, $g = 0$, $\dot{f} = 0$, $\dot{g} = 1$.

The units follow from the equations. $f$ multiplies a position to give a position, so it has no units; the same for $\dot{g}$. $g$ multiplies a velocity to give a position, so it is in seconds. $\dot{f}$ multiplies a position to give a velocity, so it is in "per second", $\mathrm{s^{-1}}$.

### The identity fġ − ḟg = 1

Take the **[[cross product|equal-areas]]** of the two expansions. The $\mathbf{r}_0 \times \mathbf{r}_0$ and $\mathbf{v}_0 \times \mathbf{v}_0$ pieces are zero (any vector crossed with itself is zero), and swapping the order of a cross product flips its sign, so:

$$
\mathbf{h} = \mathbf{r} \times \mathbf{v} = (f\mathbf{r}_0 + g\mathbf{v}_0) \times (\dot{f}\mathbf{r}_0 + \dot{g}\mathbf{v}_0) = f\dot{g}\,(\mathbf{r}_0 \times \mathbf{v}_0) + g\dot{f}\,(\mathbf{v}_0 \times \mathbf{r}_0) = (f\dot{g} - \dot{f}g)\,\mathbf{h}_0 .
$$

But $\mathbf{h}$ never changes, so $\mathbf{h} = \mathbf{h}_0$, and therefore

$$
f\dot{g} - \dot{f}g = 1
$$

at every moment. This is conservation of angular momentum, written in the language of the coefficients. It has two uses. Only three of the four are independent: given $f$, $g$ and $\dot{g}$, the fourth is $\dot{f} = (f\dot{g} - 1)/g$. And it is the first thing to check in any code that computes them.

::: key The Lagrange coefficients
$$
\mathbf{r}(t) = f\,\mathbf{r}_0 + g\,\mathbf{v}_0, \qquad \mathbf{v}(t) = \dot{f}\,\mathbf{r}_0 + \dot{g}\,\mathbf{v}_0 ,
$$
the new state as a linear combination of the old position and velocity, valid because the motion stays in the plane they span. They satisfy $f\dot{g} - \dot{f}g = 1$.
:::

## Coefficients from the change in true anomaly

### Setting up

Work in the **[[perifocal frame|perifocal]]**, the flat frame with $x$ toward periapsis. Put $\mathbf{r}_0$ at true anomaly $\nu_0$ and the new position at $\nu = \nu_0 + \Delta\nu$. From the elements lesson,

$$
\mathbf{r}_0 = r_0\,(\cos\nu_0,\ \sin\nu_0), \quad
\mathbf{v}_0 = \frac{\mu}{h}\,(-\sin\nu_0,\ e + \cos\nu_0), \quad
\mathbf{r} = r\,(\cos\nu,\ \sin\nu).
$$

Write $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$ one component at a time:

$$
r\cos\nu = f\,r_0\cos\nu_0 - g\,\frac{\mu}{h}\sin\nu_0, \qquad
r\sin\nu = f\,r_0\sin\nu_0 + g\,\frac{\mu}{h}\,(e + \cos\nu_0).
$$

That is two equations for two unknowns, $f$ and $g$. The trick is to combine them so that one unknown drops out.

### Finding g

To get rid of $f$, multiply the first equation by $\sin\nu_0$ and the second by $\cos\nu_0$, then subtract the first from the second. The $f$ terms are identical and cancel:

$$
r\,(\sin\nu\cos\nu_0 - \cos\nu\sin\nu_0) = g\,\frac{\mu}{h}\left(\sin^2\nu_0 + e\cos\nu_0 + \cos^2\nu_0\right) = g\,\frac{\mu}{h}\,(1 + e\cos\nu_0).
$$

The left side is $r\sin\Delta\nu$ (the sine-of-a-difference identity). On the right, the orbit equation says $1 + e\cos\nu_0 = h^2/(\mu r_0)$, so the right side is $g\,h/r_0$. Solve for $g$:

$$
g = \frac{r\,r_0}{h}\,\sin\Delta\nu .
$$

### Finding f

To get rid of $g$ instead, multiply the first equation by $(e + \cos\nu_0)$ and the second by $\sin\nu_0$, and add:

$$
r\left[\cos\nu\,(e + \cos\nu_0) + \sin\nu\sin\nu_0\right] = f\,r_0\left[\cos\nu_0\,(e + \cos\nu_0) + \sin^2\nu_0\right] = f\,r_0\,(1 + e\cos\nu_0) = f\,\frac{h^2}{\mu}.
$$

The bracket on the left is $e\cos\nu + \cos\Delta\nu$ (the cosine-of-a-difference identity). The orbit equation gives $r\,e\cos\nu = h^2/\mu - r$. So the left side is $h^2/\mu - r + r\cos\Delta\nu = h^2/\mu - r(1 - \cos\Delta\nu)$. Divide by $h^2/\mu$:

$$
f = 1 - \frac{\mu\,r}{h^2}\,(1 - \cos\Delta\nu).
$$

### The other two

The last two come cheaply. Solve the pair of expansions for $\mathbf{r}_0$ instead (using the identity) and you get the reverse relation $\mathbf{r}_0 = \dot{g}\,\mathbf{r} - g\,\mathbf{v}$. That is the same problem with the two times swapped and $\Delta\nu$ replaced by $-\Delta\nu$. So $\dot{g}$ must be the $f$ formula with the roles of $r$ and $r_0$ exchanged:

$$
\dot{g} = 1 - \frac{\mu\,r_0}{h^2}\,(1 - \cos\Delta\nu),
$$

and the identity supplies $\dot{f} = (f\dot{g} - 1)/g$, which after some algebra reads

$$
\dot{f} = \frac{\mu}{h}\,\frac{1 - \cos\Delta\nu}{\sin\Delta\nu}\left[\frac{\mu}{h^2}(1 - \cos\Delta\nu) - \frac{1}{r_0} - \frac{1}{r}\right].
$$

Notice the pleasing symmetry: $f$ contains the *new* radius $r$, $\dot{g}$ the *old* radius $r_0$, and otherwise they are identical.

### You need r first — and you can get it

To use these formulas you need the new radius $r$ before you know the new position. That sounds circular, but it is not: the orbit equation gives $r$ from $\Delta\nu$ alone. Expand $1 + e\cos(\nu_0 + \Delta\nu)$ and substitute $e\cos\nu_0 = h^2/(\mu r_0) - 1$ and $e\sin\nu_0 = h\,v_{r0}/\mu$ (from the radial speed $v_r = (\mu/h)e\sin\nu$):

$$
r = \frac{h^2/\mu}{1 + \left(\dfrac{h^2}{\mu r_0} - 1\right)\cos\Delta\nu - \dfrac{h\,v_{r0}}{\mu}\sin\Delta\nu},
$$

with $v_{r0} = \mathbf{r}_0 \cdot \mathbf{v}_0/r_0$. Everything on the right is known from the starting state and $\Delta\nu$.

::: example Ninety degrees around a GTO
**Start** at perigee of the GTO: $\mathbf{r}_0 = (6628.137, 0, 0)\,\mathrm{km}$ and $\mathbf{v}_0 = (0, 10.1949, 0)\,\mathrm{km/s}$. Then $h = 6628.137 \times 10.1949 = 67\,573.4\,\mathrm{km^2/s}$, $h^2/\mu = p = 11\,455.49\,\mathrm{km}$, and $v_{r0} = 0$ because position and velocity are square at perigee.

**New radius** for $\Delta\nu = 90^\circ$ ($\cos = 0$, $\sin = 1$):

$$
r = \frac{11\,455.49}{1 + \left(\dfrac{11\,455.49}{6628.137} - 1\right)\cdot 0 - 0} = 11\,455.49\,\mathrm{km},
$$

which is $p$, as it should be at $\nu = 90^\circ$.

**Coefficients.** With $\mu r/h^2 = r/p$:

$$
f = 1 - \frac{r}{p}(1 - 0) = 1 - 1 = 0, \qquad g = \frac{r\,r_0}{h}\sin 90^\circ = \frac{11\,455.49 \times 6628.137}{67\,573.4} = 1123.65\,\mathrm{s},
$$

$$
\dot{g} = 1 - \frac{r_0}{p} = 1 - \frac{6628.137}{11\,455.49} = 0.42140, \qquad \dot{f} = \frac{f\dot{g} - 1}{g} = -\frac{1}{1123.65} = -8.8996 \times 10^{-4}\,\mathrm{s^{-1}} .
$$

$f = 0$ is no accident. A quarter-turn from perigee, the new position is square to $\mathbf{r}_0$, so it has no $\mathbf{r}_0$ part at all.

**New state.**

$$
\mathbf{r} = 0 \cdot \mathbf{r}_0 + 1123.65\,\mathbf{v}_0 = (0,\; 11\,455.5,\; 0)\,\mathrm{km}, \qquad
\mathbf{v} = -8.8996 \times 10^{-4}\,\mathbf{r}_0 + 0.42140\,\mathbf{v}_0 = (-5.8988,\; 4.2962,\; 0)\,\mathrm{km/s}.
$$

**Checks.** This is exactly the perifocal velocity $(\mu/h)(-\sin\nu, e + \cos\nu)$ at $\nu = 90^\circ$ from the elements lesson. Its length, $\lVert \mathbf{v} \rVert = 7.2974\,\mathrm{km/s}$, agrees with vis-viva at $r = p$.

**A trap.** The time taken, $25.7\,\mathrm{min}$ (from the anomalies lesson), is *not* $g$. $g$ is in seconds, but it is a coefficient, not an elapsed time.
:::

## Coefficients from the universal anomaly

The $\Delta\nu$ form answers "where is the spacecraft after it has turned through this angle?" Propagation asks "where is it after this much *time*?" For that you want the coefficients in terms of $\chi$, which the universal Kepler equation gives you from $\Delta t$. The route: derive them on an ellipse using $\Delta E$, then translate.

### On an ellipse, with the eccentric anomaly

In perifocal coordinates with the eccentric anomaly, the position is $\mathbf{r} = \big(a(\cos E - e),\ b\sin E\big)$, where $b = a\sqrt{1 - e^2}$ is the semi-minor axis. Since $\dot{E} = na/r = \sqrt{\mu a}/r$, the velocity is

$$
\mathbf{v} = \frac{\sqrt{\mu a}}{r}\,\big(-\sin E,\ \sqrt{1 - e^2}\cos E\big).
$$

Solve $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$ for $f$ and $g$ with **[[Cramer's rule|cramers-rule]]**. Write the components as $\mathbf{r} = (x, y)$, $\mathbf{r}_0 = (x_0, y_0)$, $\mathbf{v}_0 = (\dot{x}_0, \dot{y}_0)$. The determinant of the system is $x_0\dot{y}_0 - y_0\dot{x}_0 = h$ (the $z$-component of $\mathbf{r}_0 \times \mathbf{v}_0$). Then

$$
f = \frac{x\,\dot{y}_0 - y\,\dot{x}_0}{h}
= \frac{1}{h}\,\frac{\sqrt{\mu a}}{r_0}\Big[a(\cos E - e)\sqrt{1 - e^2}\cos E_0 + b\sin E\sin E_0\Big]
= \frac{\sqrt{\mu a}\,b}{h\,r_0}\Big[(\cos E - e)\cos E_0 + \sin E\sin E_0\Big].
$$

Tidy it in three moves:

1. $h = \sqrt{\mu a(1 - e^2)} = \sqrt{\mu a}\,b/a$, so the fraction in front is $a/r_0$.
2. The bracket is $\cos\Delta E - e\cos E_0$.
3. $e\cos E_0 = 1 - r_0/a$ (from $r_0 = a(1 - e\cos E_0)$).

So

$$
f = \frac{a}{r_0}\left[\cos\Delta E - 1 + \frac{r_0}{a}\right] = 1 - \frac{a}{r_0}\,(1 - \cos\Delta E).
$$

The same way, $g = (x_0 y - y_0 x)/h = (ab/h)\big[\sin E\cos E_0 - \cos E\sin E_0 - e(\sin E - \sin E_0)\big]$, and $ab/h = a^2/\sqrt{\mu a} = 1/n$. Kepler's equation between the two times, $n\Delta t = \Delta E - e(\sin E - \sin E_0)$, replaces the last term:

$$
g = \frac{1}{n}\big[\sin\Delta E - \Delta E + n\Delta t\big] = \Delta t - \sqrt{\frac{a^3}{\mu}}\,(\Delta E - \sin\Delta E).
$$

The same Cramer's-rule work on $\mathbf{v} = \dot{f}\mathbf{r}_0 + \dot{g}\mathbf{v}_0$ gives $\dot{g} = 1 - (a/r)(1 - \cos\Delta E)$ — the $f$ formula with $r$ in place of $r_0$ — and $\dot{f} = -\big(\sqrt{\mu a}/(r r_0)\big)\sin\Delta E$.

### Translating to χ

Now swap every elliptic quantity for a universal one, using $\chi = \sqrt{a}\,\Delta E$, $z = \alpha\chi^2 = (\Delta E)^2$, $a = \chi^2/z$, and the Stumpff identities $1 - \cos\sqrt{z} = zC(z)$ and $\sqrt{z} - \sin\sqrt{z} = z^{3/2}S(z)$:

$$
\frac{a}{r_0}(1 - \cos\Delta E) = \frac{\chi^2}{z\,r_0}\,z\,C(z) = \frac{\chi^2}{r_0}\,C(z), \qquad
\sqrt{\frac{a^3}{\mu}}(\Delta E - \sin\Delta E) = \frac{\chi^3}{z^{3/2}\sqrt{\mu}}\,z^{3/2}S(z) = \frac{\chi^3}{\sqrt{\mu}}\,S(z),
$$

and $\sqrt{\mu a}\sin\Delta E = \sqrt{\mu}\,\sqrt{a}\,\sqrt{z}\,(1 - zS) = \sqrt{\mu}\,\chi\,(1 - zS)$. So

$$
f = 1 - \frac{\chi^2}{r_0}\,C(z), \qquad
g = \Delta t - \frac{\chi^3}{\sqrt{\mu}}\,S(z), \qquad
\dot{f} = \frac{\sqrt{\mu}}{r\,r_0}\,\chi\,\big(z\,S(z) - 1\big), \qquad
\dot{g} = 1 - \frac{\chi^2}{r}\,C(z).
$$

The derivation used an ellipse, but every $a$, $\Delta E$, $\cos$ and $\sin$ has been swallowed by $\chi$, $C$ and $S$. The same derivation on a hyperbola, with $\cosh$ and $\sinh$, lands on the same four expressions. So they hold for every conic.

### The complete universal propagator

With $r = r(\chi)$ from the universal-variables lesson, you now have a propagator with no branch on orbit type:

1. From $\mathbf{r}_0, \mathbf{v}_0$, compute $r_0$, $\alpha$, $\sigma_0$.
2. Solve the universal Kepler equation for $\chi$; compute $z$, $C$, $S$.
3. Compute $f$ and $g$; then $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$ and $r = \lVert \mathbf{r} \rVert$.
4. Compute $\dot{f}$ and $\dot{g}$ (which need $r$); then $\mathbf{v} = \dot{f}\mathbf{r}_0 + \dot{g}\mathbf{v}_0$.
5. Check $f\dot{g} - \dot{f}g = 1$.

::: example The ISS-like state, one hour ahead, by f and g
**From the last lesson:** $r_0 = 6787.470\,\mathrm{km}$, $\chi = 334.6132$, $z = 16.4874$, $C = 0.097451$, $S = 0.072526$, $\sqrt{\mu} = 631.348$, $\Delta t = 3600\,\mathrm{s}$. Powers of $\chi$: $\chi^2 = 111\,966$ and $\chi^3 = 3.74653 \times 10^{7}$.

**Position coefficients.**

$$
f = 1 - \frac{111\,966 \times 0.097451}{6787.470} = -0.60754, \qquad
g = 3600 - \frac{3.74653 \times 10^{7} \times 0.072526}{631.348} = 3600 - 4303.8 = -703.83\,\mathrm{s}.
$$

**New position.** $\mathbf{r} = -0.60754\,\mathbf{r}_0 - 703.83\,\mathbf{v}_0 = (-2148.598,\; 6242.669,\; -1592.817)\,\mathrm{km}$, with $r = 6791.499\,\mathrm{km}$. That is the same as the elements-based propagation two lessons ago, to within $10^{-8}\,\mathrm{km}$.

**Velocity coefficients.** First $\sqrt{\mu}/(r\,r_0) = 631.348/(6791.499 \times 6787.470) = 1.36960 \times 10^{-5}$, and $zS - 1 = 16.4874 \times 0.072526 - 1 = 0.19577$. So

$$
\dot{f} = 1.36960 \times 10^{-5} \times 0.19577 \times 334.6132 = 8.9720 \times 10^{-4}\,\mathrm{s^{-1}},
$$

$$
\dot{g} = 1 - \frac{111\,966 \times 0.097451}{6791.499} = -0.60659, \qquad
\mathbf{v} = \dot{f}\,\mathbf{r}_0 + \dot{g}\,\mathbf{v}_0 = (-5.07304,\; -0.28820,\; 5.73305)\,\mathrm{km/s}.
$$

**Identity check.** $f\dot{g} = 0.36853$ and $-\dot{f}g = 0.63147$, so $f\dot{g} - \dot{f}g = 1.00000$. The code, carrying all digits, gives $1.0000000000$.

**Do the signs make sense?** Both $f$ and $\dot{g}$ are negative because the spacecraft has gone about $233^\circ$ round, to the **[[far side|far-side]]** of the orbit. $g$ is negative because the new position points partly backward along $\mathbf{v}_0$.
:::

::: warning g is a coefficient with units of time, not a time
$g$ multiplies $\mathbf{v}_0$ to give a length, so it must carry seconds. For a short step $g \approx \Delta t$ (since $f \approx 1$ and $\mathbf{r} \approx \mathbf{r}_0 + \mathbf{v}_0\Delta t$). For longer steps it wanders away from $\Delta t$ and can even be negative, as in the ISS example, where $g = -704\,\mathrm{s}$ for a $3600\,\mathrm{s}$ step. Never read $g$ as an elapsed time.
:::

::: warning Compute r before ḟ and ġ
The velocity coefficients contain the *new* radius $r$. You only know it after forming $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$ (or from $r(\chi) = F'(\chi)$ in the universal Kepler equation, which is the same number). Using $r_0$ in its place is a common slip. The identity check $f\dot{g} - \dot{f}g = 1$ catches it immediately.
:::

## Running the relation backwards

### Two positions, no velocity

Because the expansion is linear in $\mathbf{r}_0$ and $\mathbf{v}_0$, you can solve it for whichever vector you do not know. The most useful case has two positions and the time between them, but no velocity. That is the orbit-determination setting, and it is **[[Lambert's problem|lambert-bridge]]**. From $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$,

$$
\mathbf{v}_0 = \frac{\mathbf{r} - f\,\mathbf{r}_0}{g}, \qquad \mathbf{v} = \dot{f}\,\mathbf{r}_0 + \dot{g}\,\mathbf{v}_0 = \frac{\dot{g}\,\mathbf{r} - \mathbf{r}_0}{g},
$$

where the second form uses $f\dot{g} - \dot{f}g = 1$ to get rid of $\dot{f}$. So if you know the coefficients, both velocities follow from the two positions by plain vector arithmetic.

The catch: $f$ and $g$ depend on the orbit — through $h$ in the $\Delta\nu$ form, or through $\alpha$ and $\chi$ in the universal form — and the orbit is exactly what you are trying to find. Lambert's problem is the one-number search that closes this loop: guess the orbit parameter, work out the time of flight the coefficients imply, compare it with the required time, adjust, repeat. Everything in that loop comes from this module; the targeting module puts it together.

### Backwards in time

The relation also runs backwards in time:

$$
\mathbf{r}_0 = \dot{g}\,\mathbf{r} - g\,\mathbf{v}, \qquad \mathbf{v}_0 = -\dot{f}\,\mathbf{r} + f\,\mathbf{v}.
$$

You can check it by substituting the forward relations and using the identity. In matrix terms, the inverse of the coefficient matrix is its **[[adjugate|adjugate]]**, because its determinant is one — a compact way of restating $f\dot{g} - \dot{f}g = 1$.

## Which form to use when

The two forms are exact and equivalent, but they behave differently with real, rounded numbers.

**The $\Delta\nu$ form** is natural when the *geometry* is given — a transfer through a stated angle, a position fix at a known true anomaly — and it needs no iteration at all. Its weak spot is very small angles. Both $1 - \cos\Delta\nu$ and $\sin\Delta\nu$ head to zero, $\dot{f}$ divides one by the other, and for $\Delta\nu$ of a few **[[arcseconds|arcsecond]]** the coefficients carry several fewer good digits than the inputs.

**The universal form** is natural when *time* is given, which is the propagation problem. It needs the Newton solution for $\chi$, but it behaves well everywhere, including as $\Delta t \to 0$, where the series branches of $C$ and $S$ take over.

In practice a propagator uses the universal form. A Lambert solver uses both: the $\Delta\nu$ form to relate positions to $p$, and the universal form to relate $p$ to time. Orbit determination from angles uses the $\Delta\nu$ form.

### A surprising kind of linearity

There is also a deeper payoff. For a *linear* system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ the state at time $t$ is $e^{\mathbf{A}t}\mathbf{x}_0$ — a **[[matrix exponential|matrix-exponential]]** times the starting state. The two-body problem is *not* linear. Yet within one orbit plane, the position and velocity at time $t$ are still linear in the starting position and velocity, through a $2 \times 2$ block matrix of $f, g, \dot{f}, \dot{g}$. That matrix depends on the starting state only through $r_0$, $\sigma_0$ and $\alpha$. It is a strong statement about the structure of Keplerian motion, and it is why the state transition matrix of a Kepler orbit can be written in closed form.

## Where the coefficients appear next

**Lambert's problem.** You know $\mathbf{r}_0$ and $\mathbf{r}$ and the time between them, but not $\mathbf{v}_0$. The $\Delta\nu$ forms of $f$ and $g$ give $\mathbf{v}_0 = (\mathbf{r} - f\mathbf{r}_0)/g$ once the transfer's $p$ or $\chi$ has been found, and the whole Lambert iteration is a search for the $\chi$ that makes the universal Kepler equation return the required time.

**Gibbs's method.** Three position vectors fix the orbit, and $f$ and $g$ deliver the velocity at the middle one.

**Navigation filters.** The state transition matrix — how a small change in $(\mathbf{r}_0, \mathbf{v}_0)$ changes $(\mathbf{r}, \mathbf{v})$ — is built from $f$, $g$, $\dot{f}$, $\dot{g}$ and their partial derivatives. Its block $g\,\mathbf{I}$ is the leading term saying that a velocity error grows into a position error linearly in time.

Here is the propagator in code, using `universal_anomaly`, `stumpff_C` and `stumpff_S` from the universal-variables lesson:

```python
def propagate_fg(r0, v0, dt, mu=MU):
    chi, alpha = universal_anomaly(r0, v0, dt, mu)     # from the universal-variables lesson
    rn = np.linalg.norm(r0)
    z = alpha * chi**2
    C, S = stumpff_C(z), stumpff_S(z)
    f = 1 - chi**2 / rn * C
    g = dt - chi**3 / np.sqrt(mu) * S
    r = f * r0 + g * v0
    rmag = np.linalg.norm(r)
    fdot = np.sqrt(mu) / (rmag * rn) * (z * S - 1) * chi
    gdot = 1 - chi**2 / rmag * C
    v = fdot * r0 + gdot * v0
    assert abs(f * gdot - fdot * g - 1) < 1e-10
    return r, v
```

Run it on the $e = 0.0$, $0.7$, $1.0$ and $1.5$ cases of the exercise. The same short function handles each one, and the assertion on the identity is your built-in test.

## Check yourself

::: check
For a very short time step $\Delta t$, expand $f$, $g$, $\dot{f}$, $\dot{g}$ to first order and interpret the result.
:::

::: answer
**Small-step values.** For small $\Delta t$ the universal Kepler equation is dominated by $r_0\chi \approx \sqrt{\mu}\,\Delta t$, so $\chi \approx \sqrt{\mu}\,\Delta t/r_0$. Also $z \to 0$, so $C \to \tfrac{1}{2}$ and $S \to \tfrac{1}{6}$.

**Coefficients.** Put these in:
- $f \approx 1 - \tfrac{1}{2}(\mu/r_0^3)\Delta t^2$;
- $g \approx \Delta t$ (the $\chi^3$ term is third order);
- $\dot{f} \approx -(\mu/r_0^3)\Delta t$;
- $\dot{g} \approx 1 - \tfrac{1}{2}(\mu/r_0^3)\Delta t^2$.

**Interpretation.** $\mathbf{r} \approx \mathbf{r}_0 + \mathbf{v}_0\Delta t - \tfrac{1}{2}(\mu/r_0^3)\mathbf{r}_0\Delta t^2$. That is straight-line motion plus half the gravitational acceleration, $-\mu\mathbf{r}_0/r_0^3$, times $\Delta t^2$ — the familiar "$\tfrac{1}{2}at^2$" of a thrown ball, as it must be.
:::

::: check
Prove that $f\dot{g} - \dot{f}g = 1$ using only the definitions and conservation of angular momentum.
:::

::: answer
Cross the two expansions: $\mathbf{r} \times \mathbf{v} = (f\mathbf{r}_0 + g\mathbf{v}_0) \times (\dot{f}\mathbf{r}_0 + \dot{g}\mathbf{v}_0)$.

The $\mathbf{r}_0 \times \mathbf{r}_0$ and $\mathbf{v}_0 \times \mathbf{v}_0$ terms are zero. The two cross terms give $f\dot{g}\,\mathbf{r}_0 \times \mathbf{v}_0 + g\dot{f}\,\mathbf{v}_0 \times \mathbf{r}_0 = (f\dot{g} - g\dot{f})\,\mathbf{h}_0$, because swapping a cross product flips its sign.

The left side is $\mathbf{h}$, which equals $\mathbf{h}_0$ and is not zero. So the number in front must be $1$.
:::

::: check
A spacecraft at $\mathbf{r}_0 = (7000, 0, 0)\,\mathrm{km}$ with $\mathbf{v}_0 = (0, 7.5461, 0)\,\mathrm{km/s}$ (circular) has moved through $\Delta\nu = 60^\circ$. Compute $f$, $g$, $\dot{f}$, $\dot{g}$ and the new state.
:::

::: answer
**Orbit numbers.** Circular, so $r = r_0 = 7000\,\mathrm{km}$. $h = 7000 \times 7.5461 = 52\,822.7\,\mathrm{km^2/s}$ and $h^2/\mu = 7000\,\mathrm{km}$, so $\mu r/h^2 = 1$.

**Coefficients.**
- $f = 1 - 1 \times (1 - \cos 60^\circ) = 1 - 0.5 = 0.5$.
- $g = (7000^2/52\,822.7)\sin 60^\circ = 927.63 \times 0.86603 = 803.4\,\mathrm{s}$.
- $\dot{g} = 1 - (1 - \cos 60^\circ) = 0.5$.
- $\dot{f} = (f\dot{g} - 1)/g = (0.25 - 1)/803.4 = -9.335 \times 10^{-4}\,\mathrm{s^{-1}}$.

**New state.** $\mathbf{r} = 0.5\,\mathbf{r}_0 + 803.4\,\mathbf{v}_0 = (3500,\; 6062.2,\; 0)\,\mathrm{km}$: length $7000$, at $60^\circ$. $\mathbf{v} = -9.335 \times 10^{-4}\,\mathbf{r}_0 + 0.5\,\mathbf{v}_0 = (-6.535,\; 3.773,\; 0)\,\mathrm{km/s}$: length $7.546$, square to $\mathbf{r}$.

**Pattern.** For a circle $f = \dot{g} = \cos\Delta\nu$ and $\dot{f} = -n\sin\Delta\nu$, as here: $n = 7.5461/7000 = 1.078 \times 10^{-3}\,\mathrm{s^{-1}}$ and $-n\sin 60^\circ = -9.34 \times 10^{-4}\,\mathrm{s^{-1}}$.
:::

::: check
In the ISS example $g$ came out negative for a positive time step. Explain it with a picture.
:::

::: answer
$g$ is the amount of $\mathbf{v}_0$ in $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$. After about $233^\circ$ of travel the spacecraft is on the far side of the orbit. Split its position along the two nearly square directions $\mathbf{r}_0$ and $\mathbf{v}_0$: it points partly backward along $-\mathbf{r}_0$ (so $f < 0$) and partly backward along $-\mathbf{v}_0$ (so $g < 0$).

For a circular orbit $g = (r^2/h)\sin\Delta\nu$, which is negative whenever $180^\circ < \Delta\nu < 360^\circ$.
:::

::: check
Why does the universal form of the Lagrange coefficients hold for hyperbolas when it was derived on an ellipse?
:::

::: answer
The elliptic derivation produced expressions in $a$, $\Delta E$, $\cos\Delta E$ and $\sin\Delta E$. Each was then rewritten in terms of $\chi = \sqrt{a}\,\Delta E$ and the Stumpff functions of $z = (\Delta E)^2$.

Repeating the derivation on a hyperbola, with $a < 0$, $\Delta H$, $\cosh$ and $\sinh$, produces the same structure. The hyperbolic Stumpff branches ($C = (\cosh\sqrt{-z} - 1)/(-z)$, and so on) turn those into the identical formulas with $z = -(\Delta H)^2 < 0$.

And $C(z)$ and $S(z)$ are each one smooth function straight through $z = 0$. So the four expressions are one formula for every conic.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$, $\mathbf{v} = \dot{f}\mathbf{r}_0 + \dot{g}\mathbf{v}_0$ | New state as a mix of the starting state |
| $f\dot{g} - \dot{f}g = 1$ | Conservation of $\mathbf{h}$; the built-in check |
| $f = 1 - \dfrac{\mu r}{h^2}(1 - \cos\Delta\nu)$, $g = \dfrac{r r_0}{h}\sin\Delta\nu$ | True-anomaly form |
| $\dot{g} = 1 - \dfrac{\mu r_0}{h^2}(1 - \cos\Delta\nu)$, $\dot{f} = (f\dot{g} - 1)/g$ | True-anomaly form, velocity |
| $r = \dfrac{h^2/\mu}{1 + (h^2/(\mu r_0) - 1)\cos\Delta\nu - (h v_{r0}/\mu)\sin\Delta\nu}$ | New radius from $\Delta\nu$ |
| $f = 1 - \dfrac{\chi^2}{r_0}C$, $g = \Delta t - \dfrac{\chi^3}{\sqrt{\mu}}S$ | Universal form |
| $\dot{f} = \dfrac{\sqrt{\mu}}{r r_0}\chi(zS - 1)$, $\dot{g} = 1 - \dfrac{\chi^2}{r}C$ | Universal form, velocity |
| Elliptic special case | $f = 1 - \frac{a}{r_0}(1 - \cos\Delta E)$, $g = \Delta t - \sqrt{a^3/\mu}(\Delta E - \sin\Delta E)$ |
| Units | $f$, $\dot{g}$ none; $g$ in s; $\dot{f}$ in $\mathrm{s^{-1}}$ |

Next: the last two lessons leave the abstract orbit for the real sky — what different orbits look like from the ground, the named orbit families of real spaceflight, and the two-line element sets in which the world's satellite catalog is published.

::: context gibbs Three dots make an orbit
Josiah Willard Gibbs, the American physicist better known for thermodynamics, published a method in 1889 for finding an orbit from three position vectors measured at three times. Because a two-body orbit is flat and a conic, three points pin it down.

Herrick–Gibbs is a later variant for when the three positions are very close together, as they are when a radar tracks a satellite through one short pass.
:::

::: context stm How errors travel forward
A navigation filter never knows the state exactly. It needs to know how a small error *now* turns into an error *later*. The **state transition matrix** answers that: it is a table of how much each later position and velocity component changes when each starting component is nudged.

For a two-body orbit it can be written in closed form from $f$, $g$, $\dot{f}$, $\dot{g}$ and their derivatives — no numerical integration needed.
:::

::: context basis Two directions reach the whole plane
Any arrow in a flat plane can be built from two arrows that do not point along the same line. Here is the circular orbit from the Check yourself question, $60^\circ$ after the start: half of $\mathbf{r}_0$ plus $803.4\,\mathrm{s}$ worth of $\mathbf{v}_0$ lands exactly on the new position.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M200,180 A140,140 0 0,0 130,58.8" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <line x1="60" y1="180" x2="200" y2="180" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="200,180 190,175 190,185" fill="#1f2a44"/>
  <line x1="200" y1="180" x2="200" y2="140" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="200,140 195,150 205,150" fill="#1d6fd1"/>
  <line x1="60" y1="180" x2="130" y2="180" stroke="#f2b880" stroke-width="5"/>
  <line x1="130" y1="180" x2="130" y2="58.8" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="60" y1="180" x2="130" y2="58.8" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="130,58.8 128.3,71.7 119.7,66.7" fill="#b4232c"/>
  <circle cx="60" cy="180" r="4" fill="#1f2a44"/>
  <text x="206" y="194" font-size="11" fill="#1f2a44">r₀</text>
  <text x="208" y="148" font-size="11" fill="#1d6fd1">v₀ (direction)</text>
  <text x="95" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">f r₀, f = 0.5</text>
  <text x="134" y="128" font-size="11" fill="#1d6fd1">g v₀</text>
  <text x="134" y="144" font-size="11" fill="#1d6fd1">g = 803.4 s</text>
  <text x="84" y="100" font-size="11" text-anchor="end" fill="#b4232c">r after 60°</text>
</svg>
```
:::

::: context equal-areas Equal areas, before and after
The length of $\mathbf{r} \times \mathbf{v}$ is the area of the parallelogram built on the two arrows. So $f\dot{g} - \dot{f}g = 1$ says: the parallelogram made by the new position and velocity has exactly the same area, in the same plane, as the one made by the old pair. Shown for the GTO at perigee and $90^\circ$ later (positions $1\,\mathrm{px}$ per $100\,\mathrm{km}$, velocities $8\,\mathrm{px}$ per $\mathrm{km/s}$):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="40,160 106.3,160 106.3,78.4 40,78.4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="106.3" y2="160" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="40" y1="160" x2="40" y2="78.4" stroke="#b4232c" stroke-width="2.5"/>
  <text x="73" y="176" font-size="11" text-anchor="middle" fill="#1f2a44">r₀</text>
  <text x="34" y="122" font-size="11" text-anchor="end" fill="#b4232c">v₀</text>
  <text x="73" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">at perigee</text>
  <polygon points="280,170 280,55.4 232.8,21.0 232.8,135.6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="280" y1="170" x2="280" y2="55.4" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="280" y1="170" x2="232.8" y2="135.6" stroke="#b4232c" stroke-width="2.5"/>
  <text x="287" y="112" font-size="11" fill="#1f2a44">r</text>
  <text x="250" y="164" font-size="11" text-anchor="end" fill="#b4232c">v</text>
  <text x="270" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">at ν = 90°</text>
  <text x="170" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">same area</text>
  <text x="170" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">h = 67 573 km²/s</text>
</svg>
```

The shape changes; the area does not.
:::

::: context perifocal The orbit's own flat frame
The **perifocal frame** is centered on the planet and lies flat in the orbit plane. Its $x$-axis points at periapsis, its $y$-axis points along the direction of motion at $\nu = 90^\circ$, and its $z$-axis points along $\mathbf{h}$.

In this frame every position has $z = 0$, so the whole problem is two-dimensional. That is what makes the component algebra here short enough to do by hand.
:::

::: context cramers-rule Solving two equations by a formula
For two equations $a_1 f + b_1 g = c_1$ and $a_2 f + b_2 g = c_2$, **Cramer's rule** gives the answer directly:

$$
f = \frac{c_1 b_2 - c_2 b_1}{a_1 b_2 - a_2 b_1}, \qquad g = \frac{a_1 c_2 - a_2 c_1}{a_1 b_2 - a_2 b_1}.
$$

The bottom, the **determinant**, is zero only when the two equations say the same thing. Here it is $h$, which is never zero for a real orbit — one more way of seeing that $\mathbf{r}_0$ and $\mathbf{v}_0$ always make a usable pair.
:::

::: context far-side The far side of the orbit
After about $233^\circ$ the new position points down and to the left of where the spacecraft started. Split it into an $\mathbf{r}_0$ part and a $\mathbf{v}_0$ part, and both parts point backward — that is why $f$ and $g$ are both negative. (Drawn as a circle, which the ISS-like orbit very nearly is.)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="105" r="70" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <line x1="180" y1="105" x2="250" y2="105" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="250,105 240,100 240,110" fill="#1f2a44"/>
  <line x1="250" y1="105" x2="250" y2="45" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="250,45 245,55 255,55" fill="#1d6fd1"/>
  <line x1="180" y1="105" x2="137.5" y2="105" stroke="#f2b880" stroke-width="5"/>
  <line x1="137.5" y1="105" x2="137.5" y2="160.6" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="180" y1="105" x2="137.5" y2="160.6" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="137.5" cy="160.6" r="4" fill="#b4232c"/>
  <circle cx="180" cy="105" r="3.5" fill="#1f2a44"/>
  <text x="256" y="120" font-size="11" fill="#1f2a44">r₀</text>
  <text x="256" y="50" font-size="11" fill="#1d6fd1">v₀</text>
  <text x="130" y="98" font-size="11" text-anchor="end" fill="#1f2a44">f r₀, f &lt; 0</text>
  <text x="130" y="140" font-size="11" text-anchor="end" fill="#1d6fd1">g v₀, g &lt; 0</text>
  <text x="146" y="185" font-size="11" fill="#b4232c">r after 233°</text>
</svg>
```
:::

::: context lambert-bridge Aiming at a place and a time
Lambert's problem is the aiming problem of spaceflight: "I am here now, I want to be *there* at *that* time — what velocity do I need?" Every interplanetary launch window and every rendezvous plan is built from solutions to it.

With $f$ and $g$ in hand, the answer is one line, $\mathbf{v}_0 = (\mathbf{r} - f\mathbf{r}_0)/g$. The hard part is finding the orbit that makes $f$ and $g$ right, and that is what the targeting module's solver does.
:::

::: context adjugate Undoing a 2 × 2 matrix in your head
For a $2 \times 2$ matrix, the inverse is: swap the two diagonal entries, flip the sign of the other two, and divide by the determinant.

$$
\begin{pmatrix} f & g \\ \dot{f} & \dot{g} \end{pmatrix}^{-1} = \frac{1}{f\dot{g} - g\dot{f}}\begin{pmatrix} \dot{g} & -g \\ -\dot{f} & f \end{pmatrix}.
$$

Since the determinant is exactly $1$, the division disappears. That is where the backward formulas $\mathbf{r}_0 = \dot{g}\,\mathbf{r} - g\,\mathbf{v}$ and $\mathbf{v}_0 = -\dot{f}\,\mathbf{r} + f\,\mathbf{v}$ come from.
:::

::: context arcsecond How small is an arcsecond?
A degree is split into $60$ arcminutes, and each arcminute into $60$ arcseconds, so an arcsecond is $1/3600$ of a degree. A low-Earth-orbit spacecraft moves through a few arcseconds of its orbit in a fraction of a second.

At angles that small, $1 - \cos\Delta\nu$ is around $10^{-10}$ — the same kind of near-cancellation that the Stumpff series was built to avoid.
:::

::: context matrix-exponential Where this comes back
In the linear systems modules, the state of $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ after time $t$ is $e^{\mathbf{A}t}\mathbf{x}_0$: one fixed matrix carries every starting state forward.

For an orbit, the $f$ and $g$ matrix does the same job for one orbit — but it has to be recomputed for each starting state, because gravity is not linear. When the navigation modules linearize around an orbit, the state transition matrix they use plays the role of $e^{\mathbf{A}t}$.
:::
