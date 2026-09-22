---
id: l01-partial-derivatives
title: Functions of several variables and partial derivatives
minutes: 20
covers:
  - partial derivatives
---

Almost nothing a GNC engineer measures or commands depends on one variable. Dynamic pressure on a rising booster depends on air density and airspeed. The range a ground station measures depends on all three components of the satellite's position. The acceleration a propagator integrates depends on three position coordinates, and, once drag is included, on three velocity components too. Single-variable calculus gave you the derivative of a function of one input; this lesson extends the idea to functions of several inputs, one input at a time.

That one-at-a-time derivative is the partial derivative, and it is the atom from which everything else in this module is built. The gradient is a column of partial derivatives. The Jacobian — the $\mathbf{H}$ matrix of a Kalman filter — is a table of them. Divergence and curl are sums and differences of them. When a filter engineer asks "how much does this measurement change if the satellite were one metre further along $x$?", they are asking for a partial derivative.

By the end of this lesson you will be able to define partial derivatives, compute them for the functions that appear in orbit determination, use them to build a linear approximation of a nonlinear function, and check them numerically with a finite difference — the check that every flight-software Jacobian must pass before it flies.

## Scalar fields and their level sets

A function $f:\mathbb{R}^n \to \mathbb{R}$ assigns one number to every point of $n$-dimensional space. When the input is a position in space we call $f$ a **scalar field**: a temperature at every point of a heat shield, a gravitational potential at every point around Earth, an air density at every altitude.

Two pictures help. For $n = 2$ the **graph** $z = f(x, y)$ is a surface over the plane. For any $n$ the **level set** $\{\mathbf{x} : f(\mathbf{x}) = c\}$ is the collection of inputs where the output takes the value $c$. Level sets of a function of two variables are curves (contour lines on a map); level sets of a function of three variables are surfaces. The equipotential surfaces of Earth's gravity field are level sets of the potential, and one of them is the geoid — the shape the oceans would take at rest.

Write points as column vectors $\mathbf{x} = [x_1, \dots, x_n]^\top$ and, when $n = 3$, as $(x, y, z)$. A function with several inputs and one output is a scalar function; functions with several outputs come in Lesson 3.

## The partial derivative

Fix every input but one and differentiate with respect to the one you left free. That is the whole idea.

The partial derivative of $f$ with respect to $x_i$ at the point $\mathbf{x}$ is

$$
\frac{\partial f}{\partial x_i}(\mathbf{x}) = \lim_{h \to 0} \frac{f(\mathbf{x} + h\,\mathbf{e}_i) - f(\mathbf{x})}{h},
$$

where $\mathbf{e}_i$ is the unit vector along the $i$-th axis.

The symbol $\partial$ (a curly d) reminds you that the other variables are being held fixed. You will also meet the shorthands $f_x$, $\partial_x f$ and $f_{,x}$; all mean the same thing. Geometrically, $\partial f/\partial x$ at $(x_0, y_0)$ is the slope of the curve you get by slicing the graph of $f$ with the vertical plane $y = y_0$.

Because only one variable moves, every rule you know from single-variable calculus applies unchanged: treat the frozen variables exactly as you would treat constants. For $f(x, y) = x^2 y + \sin(xy)$,

$$
\frac{\partial f}{\partial x} = 2xy + y\cos(xy), \qquad \frac{\partial f}{\partial y} = x^2 + x\cos(xy).
$$

Units follow the same rule as any derivative: output units per input units. If $q$ is a pressure in pascals and $v$ a speed in metres per second, then $\partial q/\partial v$ is in pascals per metre per second.

::: example Sensitivities of dynamic pressure
Dynamic pressure is $q = \tfrac{1}{2}\rho v^2$, with air density $\rho$ and airspeed $v$. Its two partial derivatives are

$$
\frac{\partial q}{\partial v} = \rho v, \qquad \frac{\partial q}{\partial \rho} = \tfrac{1}{2} v^2 .
$$

At sea-level density $\rho = 1.225\,\mathrm{kg/m^3}$ and $v = 250\,\mathrm{m/s}$, the dynamic pressure is $q = 0.5 \times 1.225 \times 250^2 = 38{,}281\,\mathrm{Pa}$, about $38.3\,\mathrm{kPa}$. The sensitivities are

$$
\frac{\partial q}{\partial v} = 1.225 \times 250 = 306\,\mathrm{Pa\ per\ m/s}, \qquad \frac{\partial q}{\partial \rho} = 0.5 \times 250^2 = 31{,}250\,\mathrm{Pa\ per\ kg/m^3}.
$$

Read these as exchange rates. One extra metre per second of airspeed costs about $306\,\mathrm{Pa}$ of dynamic pressure; a density error of $0.01\,\mathrm{kg/m^3}$ costs about $313\,\mathrm{Pa}$. A guidance loop that limits $q$ during ascent needs exactly these two numbers to decide how much a wind gust or an atmosphere-model error will move it towards the structural limit.
:::

## The functions of orbit determination

The single most important function in this module is the distance from a fixed point. Let $\mathbf{r} = (x, y, z)$ be a satellite position and $\mathbf{r}_s = (x_s, y_s, z_s)$ a ground station. The range is

$$
\rho(\mathbf{r}) = \lVert \mathbf{r} - \mathbf{r}_s \rVert = \sqrt{(x - x_s)^2 + (y - y_s)^2 + (z - z_s)^2}.
$$

To differentiate with respect to $x$, hold $y$ and $z$ fixed and use the single-variable chain rule on the square root:

$$
\frac{\partial \rho}{\partial x} = \frac{1}{2\sqrt{(x-x_s)^2 + (y-y_s)^2 + (z-z_s)^2}} \cdot 2(x - x_s) = \frac{x - x_s}{\rho}.
$$

The same computation gives $\partial\rho/\partial y = (y - y_s)/\rho$ and $\partial\rho/\partial z = (z - z_s)/\rho$. Each partial derivative is a component of the relative position divided by its length — a component of the unit vector pointing from the station to the satellite. This is dimensionless, as it must be: metres of range per metre of position.

For the special case of distance from the origin, $r = \lVert \mathbf{r} \rVert = \sqrt{x^2 + y^2 + z^2}$,

$$
\frac{\partial r}{\partial x} = \frac{x}{r}, \qquad \frac{\partial r}{\partial y} = \frac{y}{r}, \qquad \frac{\partial r}{\partial z} = \frac{z}{r}.
$$

Powers of $r$ follow by the chain rule. For any exponent $n$,

$$
\frac{\partial}{\partial x}\, r^n = n r^{n-1} \frac{\partial r}{\partial x} = n r^{n-1}\frac{x}{r} = n\, x\, r^{n-2}.
$$

The two cases you will use most are $n = -1$ and $n = -3$:

$$
\frac{\partial}{\partial x}\left(\frac{1}{r}\right) = -\frac{x}{r^3}, \qquad \frac{\partial}{\partial x}\left(\frac{1}{r^3}\right) = -\frac{3x}{r^5}.
$$

The first is the derivative of the gravitational potential $-\mu/r$; the second appears when you differentiate the gravitational acceleration itself.

::: key
For $r = \sqrt{x^2 + y^2 + z^2}$ the partial derivatives are $\partial r/\partial x = x/r$, and in general $\partial (r^n)/\partial x = n\,x\,r^{n-2}$. For a range $\rho = \lVert \mathbf{r} - \mathbf{r}_s \rVert$, $\partial \rho/\partial x = (x - x_s)/\rho$: each partial derivative of a distance is a component of the unit vector along the line of sight.
:::

## Higher-order partial derivatives

Differentiate twice and you get second partial derivatives. There are pure ones,

$$
f_{xx} = \frac{\partial^2 f}{\partial x^2} = \frac{\partial}{\partial x}\left(\frac{\partial f}{\partial x}\right),
$$

and mixed ones,

$$
f_{xy} = \frac{\partial^2 f}{\partial y\,\partial x} = \frac{\partial}{\partial y}\left(\frac{\partial f}{\partial x}\right),
$$

where the subscript order says which derivative was taken first. A function of $n$ variables has $n^2$ second partial derivatives, which in Lesson 4 you will arrange into the Hessian matrix.

The order of mixed differentiation does not matter for any function you will meet in this course. This is **Schwarz's theorem** (also called Clairaut's theorem): if the second partial derivatives of $f$ exist and are continuous near a point, then $f_{xy} = f_{yx}$ there. Every polynomial, exponential, trigonometric function and every gravitational potential away from the mass satisfies the hypothesis. The symmetry is what makes the Hessian a symmetric matrix and what makes the curl of a gradient vanish (Lesson 9), so it is worth seeing it once in a concrete case.

Take $f(x, y) = x^2 y + e^{xy}$. The first partials are $f_x = 2xy + y e^{xy}$ and $f_y = x^2 + x e^{xy}$. Differentiating $f_x$ with respect to $y$ needs the product rule on $y e^{xy}$:

$$
f_{xy} = 2x + e^{xy} + xy\,e^{xy}.
$$

Differentiating $f_y$ with respect to $x$ needs the product rule on $x e^{xy}$:

$$
f_{yx} = 2x + e^{xy} + xy\,e^{xy}.
$$

They agree, as the theorem promises. At the point $(1, 0)$: $f_x = 0$, $f_y = 2$ and $f_{xy} = f_{yx} = 3$.

::: example Second derivatives of the inverse distance
The function $1/r$ is the shape of the gravitational potential, so its second derivatives matter. Start from $\partial(1/r)/\partial x = -x/r^3 = -x\,r^{-3}$ and apply the product rule, using $\partial(r^{-3})/\partial x = -3x\,r^{-5}$:

$$
\frac{\partial^2}{\partial x^2}\left(\frac{1}{r}\right) = -\frac{1}{r^3} - x\left(-\frac{3x}{r^5}\right) = \frac{3x^2 - r^2}{r^5}.
$$

By symmetry of the roles of $x$, $y$ and $z$, the other two pure second derivatives are $(3y^2 - r^2)/r^5$ and $(3z^2 - r^2)/r^5$. Evaluate at the point $(1, 2, 2)$, where $r = 3$ and $r^5 = 243$:

$$
\frac{\partial^2 (1/r)}{\partial x^2} = \frac{3 - 9}{243} = -0.0247, \qquad \frac{\partial^2 (1/r)}{\partial y^2} = \frac{12 - 9}{243} = 0.0123, \qquad \frac{\partial^2 (1/r)}{\partial z^2} = 0.0123.
$$

Their sum is exactly zero, and not only at this point: adding the three general expressions gives $(3x^2 + 3y^2 + 3z^2 - 3r^2)/r^5 = 0$ for every $\mathbf{r} \neq \mathbf{0}$. This sum is the Laplacian of $1/r$, and its vanishing is Laplace's equation, the reason the exterior gravity field can be built from spherical harmonics. You will meet it properly in Lesson 9; for now, notice that a plain partial-derivative computation already contains it.
:::

## Linear approximation and the total differential

The most useful thing a derivative does is replace a curved function by a flat one near a point. For a function of one variable, $f(x_0 + \delta x) \approx f(x_0) + f'(x_0)\,\delta x$. For a function of two variables, move one variable at a time and add the effects:

$$
f(x_0 + \delta x,\, y_0 + \delta y) \approx f(x_0, y_0) + \frac{\partial f}{\partial x}\,\delta x + \frac{\partial f}{\partial y}\,\delta y .
$$

The right-hand side is the equation of the **tangent plane** to the graph at $(x_0, y_0)$. For $n$ variables the sum runs over all $n$ partial derivatives. The error of the approximation is of second order — proportional to the squares and products of the displacements — which is what "linear approximation" means in practice: halve the step and the error falls by four.

Writing the displacements as infinitesimals gives the **total differential**,

$$
df = \frac{\partial f}{\partial x}\,dx + \frac{\partial f}{\partial y}\,dy + \frac{\partial f}{\partial z}\,dz ,
$$

a bookkeeping device that says how a small change in every input adds up to a small change in the output. Error-budget tables in GNC are total differentials: each row is a partial derivative times an input uncertainty.

::: example How good is the tangent plane?
Return to dynamic pressure at $\rho = 1.225\,\mathrm{kg/m^3}$, $v = 250\,\mathrm{m/s}$. Suppose a gust raises airspeed by $\delta v = 5\,\mathrm{m/s}$ while the true density is $\delta\rho = -0.02\,\mathrm{kg/m^3}$ below the model. The linear prediction is

$$
\delta q \approx 306.25 \times 5 + 31{,}250 \times (-0.02) = 1531.25 - 625 = 906\,\mathrm{Pa}.
$$

The exact change is $\tfrac{1}{2}(1.205)(255)^2 - 38{,}281.25 = 896\,\mathrm{Pa}$. The tangent plane is off by about $10\,\mathrm{Pa}$, one percent of the change. That $10\,\mathrm{Pa}$ is entirely second-order: $\tfrac{1}{2}\rho\,\delta v^2 + v\,\delta v\,\delta\rho + \tfrac{1}{2}\delta\rho\,\delta v^2 = 15.31 - 25 - 0.25 = -9.94\,\mathrm{Pa}$, matching the discrepancy to the last digit. When you see a linearised filter perform well for small errors and poorly for large ones, this is the mechanism.
:::

## Checking partial derivatives numerically

Every analytic derivative you write for flight software should be checked against a finite difference. The **forward difference**

$$
\frac{\partial f}{\partial x} \approx \frac{f(x + h) - f(x)}{h}
$$

follows directly from the definition. Its error can be read off a Taylor expansion: $f(x + h) = f(x) + h f_x + \tfrac{1}{2}h^2 f_{xx} + \dots$, so the forward difference equals $f_x + \tfrac{1}{2} h f_{xx} + \dots$, an error proportional to $h$.

The **central difference**

$$
\frac{\partial f}{\partial x} \approx \frac{f(x + h) - f(x - h)}{2h}
$$

does better. Expanding both $f(x + h)$ and $f(x - h)$ and subtracting, the even-order terms cancel: the result is $f_x + \tfrac{1}{6} h^2 f_{xxx} + \dots$, an error proportional to $h^2$. Halving $h$ cuts the truncation error by four rather than two.

There is a floor, though. Subtracting two nearly equal numbers in floating point loses digits: with double-precision round-off $\epsilon \approx 2 \times 10^{-16}$, the round-off contribution to a central difference grows like $\epsilon\,|f|/h$. The total error is smallest when the two effects balance, near $h \approx \epsilon^{1/3} \approx 6 \times 10^{-6}$ relative to the scale of $x$. Below that, smaller steps make the estimate worse, not better.

::: example A finite-difference check of the range partial
Take the geometry used in this module's programming exercise: satellite at $\mathbf{r} = (7000, 100, -200)\,\mathrm{km}$ and station at $\mathbf{r}_s = (6378, 0, 0)\,\mathrm{km}$. Then $\mathbf{r} - \mathbf{r}_s = (622, 100, -200)\,\mathrm{km}$ and

$$
\rho = \sqrt{622^2 + 100^2 + 200^2} = 660.972\,\mathrm{km}, \qquad \frac{\partial \rho}{\partial x} = \frac{622}{660.972} = 0.941038.
$$

Now perturb $x$ by $h = 10^{-4}\,\mathrm{km}$ (ten centimetres) and recompute $\rho$ on both sides. The central difference returns $0.9410383331$, which differs from the analytic value by $-1.4 \times 10^{-10}$, a relative error of $1.5 \times 10^{-10}$. The forward difference with the same $h$ is off by $+8.4 \times 10^{-9}$ — about sixty times worse — and that error is predicted almost exactly by $\tfrac{1}{2} h f_{xx}$, where $f_{xx} = (\Delta y^2 + \Delta z^2)/\rho^3 = 1.73 \times 10^{-4}\,\mathrm{km^{-1}}$ gives $8.7 \times 10^{-9}$.

Varying the step shows the two error regimes. Central-difference errors for $h = 1$, $10^{-2}$, $10^{-4}$, $10^{-6}$ and $10^{-8}\,\mathrm{km}$ are about $1.2 \times 10^{-7}$, $1.6 \times 10^{-11}$, $1.4 \times 10^{-10}$, $3.2 \times 10^{-8}$ and $4.5 \times 10^{-6}$. The error falls, bottoms out, then rises again as round-off takes over. A step of $10^{-4}\,\mathrm{km}$ on a $10^3\,\mathrm{km}$ coordinate — a relative step of $10^{-7}$ — sits comfortably in the good region, which is why the exercise asks for agreement near $10^{-7}$ relative.

```python
import numpy as np

def rng(r, rs):
    return np.linalg.norm(r - rs)

r = np.array([7000.0, 100.0, -200.0]); rs = np.array([6378.0, 0.0, 0.0])
h = 1e-4
e = np.array([h, 0.0, 0.0])
central = (rng(r + e, rs) - rng(r - e, rs)) / (2 * h)
analytic = (r - rs)[0] / rng(r, rs)
print(central, analytic, central - analytic)  # 0.94103833305 0.94103833319 -1.41e-10
```
:::

::: warning
"Hold everything else fixed" means fixed in the coordinate system you are actually using. Writing the same quantity in Cartesian coordinates $(x, y, z)$ or spherical coordinates $(r, \theta, \varphi)$ changes what "everything else" is, and $\partial f/\partial r$ holding $\theta$ and $\varphi$ fixed is a different number from a derivative along $x$. Always name the full set of independent variables before you differentiate.
:::

::: warning
The existence of all partial derivatives at a point does not by itself make a function smooth there. The function $f(x, y) = xy/(x^2 + y^2)$ (with $f(0,0) = 0$) has both partials equal to zero at the origin yet is not even continuous there. The functions in this module — polynomials, exponentials, distances away from the singular point — have continuous partial derivatives, which is enough to make every result here hold. Distance functions fail exactly at zero range: never linearise $\rho$ at $\mathbf{r} = \mathbf{r}_s$.
:::

::: note
Notation you will meet elsewhere: engineers often write $\partial \rho/\partial \mathbf{r}$ for the row of all three partials at once, which is the gradient transposed, and some texts write $D_1 f$ for $\partial f/\partial x_1$. The meaning is always the one-variable-at-a-time limit above.
:::

## Check yourself

::: check
For $f(x, y, z) = x^2 z + y e^{z}$, compute all three first partial derivatives and evaluate them at $(2, 1, 0)$.
:::

::: answer
Holding the other variables fixed: $f_x = 2xz$, $f_y = e^{z}$, $f_z = x^2 + y e^{z}$. At $(2, 1, 0)$: $f_x = 0$, $f_y = 1$, $f_z = 4 + 1 = 5$. Note that $f_x$ vanishes there even though $f$ depends on $x$ — the slice at $z = 0$ has no $x$ dependence.
:::

::: check
A satellite is at $\mathbf{r} = (7000, 100, -200)\,\mathrm{km}$ and the station at $(6378, 0, 0)\,\mathrm{km}$. Use the tangent-plane approximation to estimate the change in range if the position estimate is moved by $(1, 1, 1)\,\mathrm{km}$, and compare with the exact change.
:::

::: answer
The partials of $\rho$ are the components of $(622, 100, -200)/660.972 = (0.9410, 0.1513, -0.3026)$. The linear estimate is $\delta\rho \approx 0.9410 + 0.1513 - 0.3026 = 0.790\,\mathrm{km}$. Exactly, the new relative position is $(623, 101, -199)$ with length $661.764\,\mathrm{km}$, so $\delta\rho = 0.792\,\mathrm{km}$. The tangent plane is off by about two metres on a change of $790\,\mathrm{m}$, because the step of $1.7\,\mathrm{km}$ is small compared with the $661\,\mathrm{km}$ range.
:::

::: check
Show that $g(x, y) = \ln(x^2 + y^2)$ satisfies $g_{xx} + g_{yy} = 0$ away from the origin.
:::

::: answer
$g_x = 2x/(x^2 + y^2)$. By the quotient rule, $g_{xx} = \left[2(x^2 + y^2) - 2x \cdot 2x\right]/(x^2 + y^2)^2 = (2y^2 - 2x^2)/(x^2 + y^2)^2$. By symmetry $g_{yy} = (2x^2 - 2y^2)/(x^2 + y^2)^2$. The sum is zero. This is the two-dimensional analogue of the $1/r$ computation in the lesson: $\ln r$ plays the role in the plane that $1/r$ plays in space.
:::

::: check
A forward difference of a smooth function with step $h = 10^{-3}$ gives an error of $2 \times 10^{-6}$. Roughly what error would you expect from a forward difference with $h = 10^{-4}$, and from a central difference with $h = 10^{-3}$, assuming round-off is negligible?
:::

::: answer
Forward-difference error is proportional to $h$, so shrinking $h$ by ten cuts the error to about $2 \times 10^{-7}$. Central-difference error is proportional to $h^2$ with a different constant ($f_{xxx}/6$ instead of $f_{xx}/2$), so you cannot convert exactly, but for a function whose derivatives are of similar size the central difference with $h = 10^{-3}$ would be around $10^{-6}$ times a constant of order one, roughly a thousand times smaller than the forward difference at the same step. The exact ratio depends on the function; the scaling laws do not.
:::

::: check
Why is Schwarz's theorem relevant to a filter engineer who never writes a second derivative by hand?
:::

::: answer
Two reasons that appear later in this module. The Hessian of any cost function — the matrix of second partials used to judge whether a least-squares fit or a trajectory optimisation has found a minimum — is symmetric only because mixed partials commute. And the curl of a gradient field is identically zero for the same reason, which is what makes a gravity field derived from a potential automatically conservative. Both facts rest on $f_{xy} = f_{yx}$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $f:\mathbb{R}^n \to \mathbb{R}$ | scalar field: several inputs, one output |
| level set $f(\mathbf{x}) = c$ | inputs sharing one output value; contours, equipotentials |
| $\partial f/\partial x_i = \lim_{h\to 0}[f(\mathbf{x} + h\mathbf{e}_i) - f(\mathbf{x})]/h$ | partial derivative: one input moves, the rest are held fixed |
| $\partial r/\partial x = x/r$, $\partial(r^n)/\partial x = n x r^{n-2}$ | derivatives of distance and its powers |
| $\partial\rho/\partial x = (x - x_s)/\rho$ | range partial: a component of the unit line of sight |
| $f_{xy} = f_{yx}$ | Schwarz: mixed partials commute when continuous |
| $f(\mathbf{x} + \delta\mathbf{x}) \approx f(\mathbf{x}) + \sum_i (\partial f/\partial x_i)\,\delta x_i$ | tangent-plane (linear) approximation, second-order error |
| $[f(x+h) - f(x-h)]/2h$ | central difference, error $\propto h^2$; best $h \approx \epsilon^{1/3}$ relative |

The next lesson assembles the partial derivatives of a scalar field into a single vector, the gradient, and shows that it points in the direction of steepest ascent and stands perpendicular to the level sets.
