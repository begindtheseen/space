---
id: l01-partial-derivatives
title: Functions of several variables and partial derivatives
minutes: 25
covers:
  - partial derivatives
---

Think about how hot a shower feels. It depends on two knobs, hot and cold. Turn only the hot knob a little and the water warms up by some amount. Turn only the cold knob and it cools by a different amount. Those two answers — "how much does the output change when I turn *this one* knob, and leave the other alone?" — are what this lesson is about. They are called **partial derivatives**.

Almost nothing a guidance, navigation and control (GNC) engineer works with depends on one number alone. The air pushing on a climbing rocket depends on the air's density *and* the rocket's speed. The distance a ground station measures to a satellite depends on all three of the satellite's position coordinates. The pull of gravity that a trajectory program adds up, step after step, depends on three coordinates too, and once air drag is included, on three velocity components as well. Single-variable calculus gave you the derivative of a function with one input. Here you extend it to many inputs, one input at a time.

That one-at-a-time derivative is the building block for everything else in this module. The gradient (next lesson) is a column of partial derivatives. The Jacobian — the $\mathbf{H}$ matrix inside a Kalman filter — is a table of them. When a filter engineer asks "how much would this measurement change if the satellite were one metre further along $x$?", she is asking for a partial derivative. By the end of this lesson you will be able to define one, compute the ones orbit determination needs, use them to predict small changes, and check them with a computer — the test every flight-software derivative must pass before it flies.

## Scalar fields and their level sets

A weather map gives one number, the temperature, at every place. A function like that — several inputs, one output — is written $f:\mathbb{R}^n \to \mathbb{R}$. Read it aloud as "f maps n-dimensional space to the real numbers": you feed in $n$ numbers and get one number back.

When the inputs are a position in space, $f$ is called a **[[scalar field|scalar-field]]** — a single number attached to every point. Examples: the temperature at every point of a heat shield, the gravitational potential at every point around Earth, the air density at every altitude.

Two pictures help you see one.

- **The graph.** For two inputs, draw $z = f(x, y)$ as a height above the floor. You get a surface, like a landscape of hills and valleys.
- **Level sets.** Collect every input where the output equals one chosen value $c$. That collection, written $\{\mathbf{x} : f(\mathbf{x}) = c\}$, is a **level set**. For two inputs, level sets are curves — the **[[contour lines|contour-map]]** of a hiking map, each one a single height. For three inputs they are surfaces.

The surfaces of equal gravitational potential around Earth are level sets. One of them is the **[[geoid|geoid]]** — the shape the oceans would take if they were perfectly at rest.

We write points as column vectors, $\mathbf{x} = [x_1, \dots, x_n]^\top$ (the $\top$, read "transpose", turns a row into a column), and in three dimensions as $(x, y, z)$. Functions with several *outputs* come in Lesson 3.

## The partial derivative

Here is the whole idea in one sentence: freeze every input except one, and take the ordinary derivative with respect to the one you left free.

On a hill, stand at a point and face exactly east. The slope under your feet in that direction is the partial derivative with respect to $x$. Face north instead and you get the partial derivative with respect to $y$. Same hill, same spot, different answers.

In symbols, the partial derivative of $f$ with respect to $x_i$ at the point $\mathbf{x}$ is

$$
\frac{\partial f}{\partial x_i}(\mathbf{x}) = \lim_{h \to 0} \frac{f(\mathbf{x} + h\,\mathbf{e}_i) - f(\mathbf{x})}{h},
$$

where $\mathbf{e}_i$ is the unit vector along the $i$-th axis. Read $\partial f/\partial x_i$ as "partial f, partial x i". The recipe is the same as for any derivative: step a small distance $h$, see how much the output changed, divide by the step, and let the step shrink. The only difference is that the step goes along one axis and nowhere else.

The **[[curly d|curly-d]]**, $\partial$, reminds you that the other variables are being held fixed. You will also meet the shorthands $f_x$, $\partial_x f$ and $f_{,x}$. All four mean the same thing.

There is a picture for it too. Slice the graph of $f$ with the upright plane $y = y_0$. The cut edge is an ordinary curve, and $\partial f/\partial x$ at $(x_0, y_0)$ is the **[[slope of that curve|slice-slope]]**.

Because only one variable moves, every rule you know from single-variable calculus still works. Treat the frozen variables exactly as you would treat constants like $3$ or $\pi$. For $f(x, y) = x^2 y + \sin(xy)$:

- To find $\partial f/\partial x$, treat $y$ as a constant. The derivative of $x^2 y$ is $2xy$. The derivative of $\sin(xy)$ is $\cos(xy)$ times the derivative of the inside, $xy$, which is $y$.
- To find $\partial f/\partial y$, treat $x$ as a constant. The derivative of $x^2 y$ is $x^2$. The derivative of $\sin(xy)$ is $\cos(xy)$ times $x$.

$$
\frac{\partial f}{\partial x} = 2xy + y\cos(xy), \qquad \frac{\partial f}{\partial y} = x^2 + x\cos(xy).
$$

Units work the same way as for any derivative: output units divided by input units. If $q$ is a pressure in pascals and $v$ a speed in metres per second, then $\partial q/\partial v$ is in pascals per metre per second.

::: example Sensitivities of dynamic pressure
Stick your hand out of a moving car's window and you feel the air push. That push per unit area is the **dynamic pressure**, $q = \tfrac{1}{2}\rho v^2$, where $\rho$ (the Greek letter "rho") is the air density and $v$ the airspeed. It has two inputs, so it has two partial derivatives.

Hold $\rho$ fixed and differentiate $v^2$ to get $2v$; hold $v$ fixed and $\rho$ has derivative $1$:

$$
\frac{\partial q}{\partial v} = \rho v, \qquad \frac{\partial q}{\partial \rho} = \tfrac{1}{2} v^2 .
$$

Now put in numbers: sea-level density $\rho = 1.225\,\mathrm{kg/m^3}$ and $v = 250\,\mathrm{m/s}$. The dynamic pressure itself is

$$
q = 0.5 \times 1.225 \times 250^2 = 38{,}281.25\,\mathrm{Pa},
$$

about $38.3\,\mathrm{kPa}$. The two sensitivities are

$$
\frac{\partial q}{\partial v} = 1.225 \times 250 = 306.25\,\mathrm{Pa\ per\ m/s}, \qquad \frac{\partial q}{\partial \rho} = 0.5 \times 250^2 = 31{,}250\,\mathrm{Pa\ per\ kg/m^3}.
$$

Read them like **exchange rates**. One extra metre per second of airspeed costs about $306\,\mathrm{Pa}$. A density error of $0.01\,\mathrm{kg/m^3}$ costs $31{,}250 \times 0.01 \approx 313\,\mathrm{Pa}$. A guidance loop that keeps $q$ under a [[structural limit|max-q]] during ascent needs exactly these two numbers to judge how far a wind gust or a wrong atmosphere model will push it toward the limit.

Sanity check: both rates are positive. Faster air or thicker air should both push harder, and they do.
:::

## The functions of orbit determination

The most important function in this module is the plain distance from one point to another. Let $\mathbf{r} = (x, y, z)$ be a satellite's position and $\mathbf{r}_s = (x_s, y_s, z_s)$ a ground station. The **range** — the straight-line distance between them — is

$$
\rho(\mathbf{r}) = \lVert \mathbf{r} - \mathbf{r}_s \rVert = \sqrt{(x - x_s)^2 + (y - y_s)^2 + (z - z_s)^2}.
$$

(Here $\rho$ means range, not density; engineers reuse letters. The double bars $\lVert\cdot\rVert$ mean "length of".)

To differentiate with respect to $x$, hold $y$ and $z$ fixed. The square root of "stuff" has derivative $1/(2\sqrt{\text{stuff}})$ times the derivative of the stuff. Only the first term of the stuff contains $x$, and its derivative is $2(x - x_s)$:

$$
\frac{\partial \rho}{\partial x} = \frac{1}{2\sqrt{(x-x_s)^2 + (y-y_s)^2 + (z-z_s)^2}} \cdot 2(x - x_s) = \frac{x - x_s}{\rho}.
$$

The same steps give $\partial\rho/\partial y = (y - y_s)/\rho$ and $\partial\rho/\partial z = (z - z_s)/\rho$.

Look at what came out. Each partial derivative is one component of the arrow from station to satellite, divided by that arrow's length. Together they are the components of the **[[unit vector|line-of-sight]]** — an arrow of length one — pointing from the station toward the satellite, along the **line of sight**. The units check out too: metres of range per metre of position, so no units at all.

For the distance from the origin, $r = \lVert \mathbf{r} \rVert = \sqrt{x^2 + y^2 + z^2}$, put the station at zero:

$$
\frac{\partial r}{\partial x} = \frac{x}{r}, \qquad \frac{\partial r}{\partial y} = \frac{y}{r}, \qquad \frac{\partial r}{\partial z} = \frac{z}{r}.
$$

Powers of $r$ follow from the chain rule. For any exponent $n$, the outer derivative of $r^n$ is $n r^{n-1}$, and the inner derivative is $\partial r/\partial x = x/r$:

$$
\frac{\partial}{\partial x}\, r^n = n r^{n-1} \frac{\partial r}{\partial x} = n r^{n-1}\frac{x}{r} = n\, x\, r^{n-2}.
$$

The two cases you will use most are $n = -1$ and $n = -3$:

$$
\frac{\partial}{\partial x}\left(\frac{1}{r}\right) = -\frac{x}{r^3}, \qquad \frac{\partial}{\partial x}\left(\frac{1}{r^3}\right) = -\frac{3x}{r^5}.
$$

The first is the building block of the gravitational potential $-\mu/r$. The second appears when you differentiate the gravitational acceleration itself.

::: key
For $r = \sqrt{x^2 + y^2 + z^2}$ the partial derivatives are $\partial r/\partial x = x/r$, and in general $\partial (r^n)/\partial x = n\,x\,r^{n-2}$. For a range $\rho = \lVert \mathbf{r} - \mathbf{r}_s \rVert$, $\partial \rho/\partial x = (x - x_s)/\rho$: each partial derivative of a distance is a component of the unit vector along the line of sight.
:::

## Higher-order partial derivatives

A partial derivative is itself a function of all the inputs, so you can differentiate it again. That gives **second partial derivatives**. There are two kinds.

**Pure** ones differentiate twice along the same variable:

$$
f_{xx} = \frac{\partial^2 f}{\partial x^2} = \frac{\partial}{\partial x}\left(\frac{\partial f}{\partial x}\right).
$$

**Mixed** ones switch variables:

$$
f_{xy} = \frac{\partial^2 f}{\partial y\,\partial x} = \frac{\partial}{\partial y}\left(\frac{\partial f}{\partial x}\right).
$$

In the subscript, read left to right: $f_{xy}$ means "first $x$, then $y$". A function of $n$ variables has $n^2$ second partial derivatives. In Lesson 4 you will arrange them in a square table called the Hessian.

Here is a pleasant surprise. For every function in this course, the order of mixed differentiation does not matter: $f_{xy} = f_{yx}$. This is **[[Schwarz's theorem|schwarz-name]]** (also called Clairaut's theorem). The precise statement: if the second partial derivatives of $f$ exist and are continuous near a point, then $f_{xy} = f_{yx}$ there. Polynomials, exponentials, sines and cosines, and gravitational potentials away from the attracting mass all qualify.

This symmetry is what makes the Hessian a symmetric table, and what makes the curl of a gradient vanish (Lesson 8). So it is worth watching it happen once.

Take $f(x, y) = x^2 y + e^{xy}$. The first partials are $f_x = 2xy + y e^{xy}$ and $f_y = x^2 + x e^{xy}$.

Now differentiate $f_x$ with respect to $y$. The term $2xy$ gives $2x$. The term $y e^{xy}$ is a product, so use the product rule: $1 \cdot e^{xy} + y \cdot x e^{xy}$.

$$
f_{xy} = 2x + e^{xy} + xy\,e^{xy}.
$$

Go the other way: differentiate $f_y$ with respect to $x$. The term $x^2$ gives $2x$. The product $x e^{xy}$ gives $1 \cdot e^{xy} + x \cdot y e^{xy}$.

$$
f_{yx} = 2x + e^{xy} + xy\,e^{xy}.
$$

They match, as promised. At the point $(1, 0)$: $f_x = 0$, $f_y = 2$ and $f_{xy} = f_{yx} = 2 + 1 + 0 = 3$.

::: note Why it has to be true
Take four points at the corners of a tiny rectangle: $(x, y)$, $(x + h, y)$, $(x, y + k)$ and $(x + h, y + k)$. Form the "corner sum"

$$
S = f(x + h, y + k) - f(x + h, y) - f(x, y + k) + f(x, y).
$$

Group it one way: $[f(x+h, y+k) - f(x+h, y)] - [f(x, y+k) - f(x, y)]$. Each bracket is about $k\,f_y$, taken at $x + h$ and at $x$. Their difference is about $h k\,f_{yx}$. Group it the other way: $[f(x+h, y+k) - f(x, y+k)] - [f(x+h, y) - f(x, y)]$. Now each bracket is about $h\,f_x$, and the difference is about $h k\,f_{xy}$. It is the same $S$ both times. Divide by $hk$ and shrink the rectangle: when the second partials are continuous, both approximations become exact, so $f_{xy} = f_{yx}$.
:::

::: example Second derivatives of the inverse distance
The function $1/r$ is the shape of the gravitational potential, so its second derivatives matter. Start from $\partial(1/r)/\partial x = -x/r^3 = -x\,r^{-3}$. This is a product of $-x$ and $r^{-3}$, so use the product rule, with $\partial(r^{-3})/\partial x = -3x\,r^{-5}$ from the power formula:

$$
\frac{\partial^2}{\partial x^2}\left(\frac{1}{r}\right) = -\frac{1}{r^3} - x\left(-\frac{3x}{r^5}\right) = \frac{3x^2 - r^2}{r^5}.
$$

The last step put both terms over $r^5$: $-1/r^3 = -r^2/r^5$.

Nothing about $x$ is special, so the other two pure second derivatives are $(3y^2 - r^2)/r^5$ and $(3z^2 - r^2)/r^5$. Evaluate at the point $(1, 2, 2)$, where $r = \sqrt{1 + 4 + 4} = 3$ and $r^5 = 243$:

$$
\frac{\partial^2 (1/r)}{\partial x^2} = \frac{3 - 9}{243} = -0.0247, \qquad \frac{\partial^2 (1/r)}{\partial y^2} = \frac{12 - 9}{243} = 0.0123, \qquad \frac{\partial^2 (1/r)}{\partial z^2} = 0.0123.
$$

Add them: $-6/243 + 3/243 + 3/243 = 0$. Exactly zero. And not only at this point. Adding the three general expressions gives

$$
\frac{3x^2 + 3y^2 + 3z^2 - 3r^2}{r^5} = 0
$$

for every $\mathbf{r} \neq \mathbf{0}$, because $x^2 + y^2 + z^2 = r^2$. This sum is called the **[[Laplacian|laplace-preview]]** of $1/r$, and "it is zero" is Laplace's equation. You will meet it properly in Lesson 8. For now, notice that a plain partial-derivative calculation already contains it.
:::

## Linear approximation and the total differential

The most useful thing a derivative does is replace a curved function by a flat one near a point. Zoom in far enough on any smooth curve and it looks like a straight line. Zoom in on a smooth surface and it looks like a flat plane.

For one variable you know the rule: $f(x_0 + \delta x) \approx f(x_0) + f'(x_0)\,\delta x$. (Read $\delta x$, "delta x", as "a small change in $x$".) For two variables, move one variable at a time and add the two effects:

$$
f(x_0 + \delta x,\, y_0 + \delta y) \approx f(x_0, y_0) + \frac{\partial f}{\partial x}\,\delta x + \frac{\partial f}{\partial y}\,\delta y .
$$

The right-hand side is the equation of the **tangent plane** — the flat sheet that touches the graph at $(x_0, y_0)$ and tilts the same way. For $n$ variables the sum runs over all $n$ partial derivatives.

How good is it? The error is **second order**: it grows like the squares and products of the small steps. In practice, halve the step and the error falls to a quarter. That is what "linear approximation" promises.

If you shrink the steps all the way to infinitely small ones, $dx$, $dy$, $dz$, you get the **total differential**:

$$
df = \frac{\partial f}{\partial x}\,dx + \frac{\partial f}{\partial y}\,dy + \frac{\partial f}{\partial z}\,dz .
$$

It is bookkeeping: each input's small change, times that input's exchange rate, all added up. An **[[error budget|error-budget]]** in GNC is a total differential written as a table. Each row is one partial derivative times one input's uncertainty.

::: example How good is the tangent plane?
Go back to dynamic pressure at $\rho = 1.225\,\mathrm{kg/m^3}$, $v = 250\,\mathrm{m/s}$. A gust raises airspeed by $\delta v = 5\,\mathrm{m/s}$. At the same time the real air is thinner than the model by $\delta\rho = -0.02\,\mathrm{kg/m^3}$. The linear prediction multiplies each change by its exchange rate and adds:

$$
\delta q \approx 306.25 \times 5 + 31{,}250 \times (-0.02) = 1531.25 - 625 = 906.25\,\mathrm{Pa}.
$$

The exact new value uses $\rho = 1.205$ and $v = 255$: $q = \tfrac{1}{2}(1.205)(255)^2 = 39{,}177.56\,\mathrm{Pa}$. Subtract the old $38{,}281.25\,\mathrm{Pa}$ and the true change is $896.31\,\mathrm{Pa}$.

The tangent plane is off by about $10\,\mathrm{Pa}$ — about one percent of the change. Where does the $10\,\mathrm{Pa}$ come from? Expand $\tfrac{1}{2}(\rho + \delta\rho)(v + \delta v)^2$ fully. The leftover terms, the ones the linear rule drops, all contain two small changes multiplied together:

$$
\tfrac{1}{2}\rho\,\delta v^2 + v\,\delta v\,\delta\rho + \tfrac{1}{2}\delta\rho\,\delta v^2 = 15.31 - 25 - 0.25 = -9.94\,\mathrm{Pa}.
$$

That matches the gap to the last digit: $896.31 - 906.25 = -9.94$. When a linearized filter works well for small errors and badly for large ones, this is the mechanism: the dropped second-order terms grow faster than the kept ones.
:::

## Checking partial derivatives numerically

Every derivative you work out by hand for flight software should be checked by a computer. The check comes straight from the definition: take a small but not infinitely small step, and divide.

The **forward difference** is

$$
\frac{\partial f}{\partial x} \approx \frac{f(x + h) - f(x)}{h}.
$$

How wrong is it? Use a Taylor expansion, which says what $f$ does a short distance away: $f(x + h) = f(x) + h f_x + \tfrac{1}{2}h^2 f_{xx} + \dots$. Subtract $f(x)$ and divide by $h$. You get $f_x + \tfrac{1}{2} h f_{xx} + \dots$ So the error is about $\tfrac{1}{2} h f_{xx}$: proportional to $h$.

The **central difference** steps both ways:

$$
\frac{\partial f}{\partial x} \approx \frac{f(x + h) - f(x - h)}{2h}.
$$

Expand $f(x + h)$ and $f(x - h)$ and subtract. The $f(x)$ terms cancel, and so do the $h^2$ terms, because $(+h)^2$ and $(-h)^2$ are equal. What is left, divided by $2h$, is $f_x + \tfrac{1}{6} h^2 f_{xxx} + \dots$ The error is proportional to $h^2$. Halve $h$ and the error falls by four, not two.

Then why not make $h$ tiny? Because computers keep only about sixteen significant digits. Subtracting two nearly equal numbers throws most of those digits away. This **[[round-off|round-off]]** error grows like $\epsilon\,|f|/h$, where $\epsilon \approx 2 \times 10^{-16}$ is the smallest relative difference a double-precision number can hold. So one error shrinks as $h$ shrinks and the other grows. The total is smallest where they balance. For a central difference that is near $h \approx \epsilon^{1/3} \approx 6 \times 10^{-6}$ times the distance over which the function noticeably bends. Below that, smaller steps make the answer *worse*.

::: example A finite-difference check of the range partial
Use the geometry from this module's programming exercise: satellite at $\mathbf{r} = (7000, 100, -200)\,\mathrm{km}$, station at $\mathbf{r}_s = (6378, 0, 0)\,\mathrm{km}$.

**Step 1: the analytic answer.** Subtract to get $\mathbf{r} - \mathbf{r}_s = (622, 100, -200)\,\mathrm{km}$. Then

$$
\rho = \sqrt{622^2 + 100^2 + 200^2} = 660.972\,\mathrm{km}, \qquad \frac{\partial \rho}{\partial x} = \frac{622}{660.972} = 0.941038.
$$

Sanity check: the arrow from station to satellite points mostly along $x$ ($622$ of the $661\,\mathrm{km}$), so the $x$ partial should be close to $1$. It is.

**Step 2: the numerical answer.** Nudge $x$ by $h = 10^{-4}\,\mathrm{km}$ (ten centimetres) each way and recompute $\rho$. The central difference agrees with the analytic value to about $2 \times 10^{-9}$ — nine matching digits.

**Step 3: compare the methods.** The forward difference with the same $h$ is off by about $1.1 \times 10^{-8}$, five times worse. Most of that is the predicted $\tfrac{1}{2} h f_{xx}$, where $f_{xx} = (\Delta y^2 + \Delta z^2)/\rho^3 = 1.73 \times 10^{-4}\,\mathrm{km^{-1}}$ (with $\Delta y = 100$, $\Delta z = -200$) gives $8.7 \times 10^{-9}$. The rest is round-off.

**Step 4: vary the step.** Central-difference errors for $h = 1$, $10^{-2}$, $10^{-4}$, $10^{-6}$ and $10^{-8}\,\mathrm{km}$ come out about $1.2 \times 10^{-7}$, $6 \times 10^{-12}$, $2 \times 10^{-9}$, $3 \times 10^{-7}$ and $7 \times 10^{-6}$. The error falls, bottoms out, then rises again as round-off takes over — the **[[V shape|error-v]]** the theory predicts. At $h = 10^{-4}\,\mathrm{km}$ the error is already past the bottom of the V. It is still about forty times smaller than the $10^{-7}$ relative agreement the exercise asks for, so that step is a safe choice.

```python
import numpy as np

def rng(r, rs):
    return np.linalg.norm(r - rs)

r = np.array([7000.0, 100.0, -200.0]); rs = np.array([6378.0, 0.0, 0.0])
h = 1e-4
e = np.array([h, 0.0, 0.0])
central = (rng(r + e, rs) - rng(r - e, rs)) / (2 * h)
analytic = (r - rs)[0] / rng(r, rs)
print(f"{central:.10f} {analytic:.10f} {central - analytic:.2e}")
# 0.9410383353 0.9410383332 2.13e-09
```

The last digits of a round-off error depend on the machine and the library, so your own run may differ slightly in the third line. The first seven digits will not.
:::

::: warning Fixed in which coordinates?
"Hold everything else fixed" means fixed in the coordinate system you are actually using. Describe the same point in Cartesian coordinates $(x, y, z)$ or in spherical coordinates $(r, \theta, \varphi)$ and "everything else" changes. The derivative $\partial f/\partial r$ with $\theta$ and $\varphi$ held fixed is a different number from a derivative along $x$. Always name the full set of independent variables before you differentiate.
:::

::: warning Partials can exist where the function misbehaves
Having all partial derivatives at a point does not by itself make a function smooth there. The function $f(x, y) = xy/(x^2 + y^2)$, with $f(0,0) = 0$, has both partials equal to zero at the origin. Yet it is not even continuous there: along the line $y = x$ it equals $\tfrac{1}{2}$ everywhere except the origin. The functions in this module — polynomials, exponentials, distances away from zero — have continuous partial derivatives, and that is enough for every result here. Distance functions fail exactly at zero range: never linearize $\rho$ at $\mathbf{r} = \mathbf{r}_s$.
:::

::: note Notation you will meet elsewhere
Engineers often write $\partial \rho/\partial \mathbf{r}$ for the row of all three partials at once. That row is the gradient, turned on its side. Some books write $D_1 f$ for $\partial f/\partial x_1$. The meaning is always the one-variable-at-a-time limit above.
:::

## Check yourself

::: check
For $f(x, y, z) = x^2 z + y e^{z}$, compute all three first partial derivatives and evaluate them at $(2, 1, 0)$.
:::

::: answer
Hold the other two variables fixed each time.

- $f_x$: only $x^2 z$ contains $x$, so $f_x = 2xz$.
- $f_y$: only $y e^z$ contains $y$, so $f_y = e^{z}$.
- $f_z$: both terms contain $z$, so $f_z = x^2 + y e^{z}$.

At $(2, 1, 0)$: $f_x = 2 \cdot 2 \cdot 0 = 0$, $f_y = e^0 = 1$, $f_z = 4 + 1 = 5$. Notice that $f_x$ is zero there even though $f$ depends on $x$. On the slice $z = 0$ the $x^2 z$ term vanishes, so moving along $x$ changes nothing.
:::

::: check
A satellite is at $\mathbf{r} = (7000, 100, -200)\,\mathrm{km}$ and the station at $(6378, 0, 0)\,\mathrm{km}$. Use the tangent-plane approximation to estimate the change in range if the position estimate moves by $(1, 1, 1)\,\mathrm{km}$, and compare with the exact change.
:::

::: answer
The partials of $\rho$ are the components of $(622, 100, -200)/660.972 = (0.9410, 0.1513, -0.3026)$. Multiply each by its $1\,\mathrm{km}$ step and add: $\delta\rho \approx 0.9410 + 0.1513 - 0.3026 = 0.790\,\mathrm{km}$.

Exactly: the new relative position is $(623, 101, -199)$, whose length is $661.764\,\mathrm{km}$, so $\delta\rho = 661.764 - 660.972 = 0.792\,\mathrm{km}$.

The tangent plane is off by about two metres on a change of $790\,\mathrm{m}$. That is good, because the step, about $1.7\,\mathrm{km}$ long, is small compared with the $661\,\mathrm{km}$ range.
:::

::: check
Show that $g(x, y) = \ln(x^2 + y^2)$ satisfies $g_{xx} + g_{yy} = 0$ away from the origin.
:::

::: answer
First, $g_x = 2x/(x^2 + y^2)$ by the chain rule. Differentiate again with the quotient rule (bottom times derivative of top, minus top times derivative of bottom, over bottom squared):

$$
g_{xx} = \frac{2(x^2 + y^2) - 2x \cdot 2x}{(x^2 + y^2)^2} = \frac{2y^2 - 2x^2}{(x^2 + y^2)^2}.
$$

Swapping the roles of $x$ and $y$ gives $g_{yy} = (2x^2 - 2y^2)/(x^2 + y^2)^2$. The tops are opposites, so the sum is zero. This is the flat, two-dimensional cousin of the $1/r$ calculation in the lesson: $\ln r$ plays the role in the plane that $1/r$ plays in space.
:::

::: check
A forward difference of a smooth function with step $h = 10^{-3}$ gives an error of $2 \times 10^{-6}$. Roughly what error would you expect from a forward difference with $h = 10^{-4}$, and from a central difference with $h = 10^{-3}$? Assume round-off is negligible.
:::

::: answer
Forward-difference error is proportional to $h$. Shrinking $h$ by ten cuts the error by ten, to about $2 \times 10^{-7}$.

Central-difference error is proportional to $h^2$, with a different constant in front ($f_{xxx}/6$ instead of $f_{xx}/2$). So you cannot convert exactly. But if the function's derivatives are of similar size, the central error at $h = 10^{-3}$ is about $h^2 = 10^{-6}$ times a constant near one — roughly a thousand times smaller than the forward error at the same step, which is about $h$ times a similar constant. The exact ratio depends on the function; the scaling laws do not.
:::

::: check
Why should a filter engineer care about Schwarz's theorem, even if she never writes a second derivative by hand?
:::

::: answer
Two reasons, both later in this module. First, the Hessian of a cost function — the table of second partials used to judge whether a least-squares fit or a trajectory optimization has found a minimum — is symmetric only because mixed partials match. Second, the curl of a gradient field is always zero for the same reason, and that is what makes a gravity field built from a potential automatically conservative. Both facts rest on $f_{xy} = f_{yx}$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $f:\mathbb{R}^n \to \mathbb{R}$ | scalar field: several inputs, one output |
| level set $f(\mathbf{x}) = c$ | inputs sharing one output value; contours, equipotentials |
| $\partial f/\partial x_i = \lim_{h\to 0}[f(\mathbf{x} + h\mathbf{e}_i) - f(\mathbf{x})]/h$ | partial derivative: one input moves, the rest are held fixed |
| $\partial r/\partial x = x/r$, $\partial(r^n)/\partial x = n x r^{n-2}$ | derivatives of distance and its powers |
| $\partial\rho/\partial x = (x - x_s)/\rho$ | range partial: a component of the unit line of sight |
| $f_{xy} = f_{yx}$ | Schwarz: mixed partials match when they are continuous |
| $f(\mathbf{x} + \delta\mathbf{x}) \approx f(\mathbf{x}) + \sum_i (\partial f/\partial x_i)\,\delta x_i$ | tangent-plane (linear) approximation, second-order error |
| $df = f_x\,dx + f_y\,dy + f_z\,dz$ | total differential: the shape of an error budget |
| $[f(x+h) - f(x-h)]/2h$ | central difference, error $\propto h^2$; best $h \approx \epsilon^{1/3}$ times the function's scale |

The next lesson gathers the partial derivatives of a scalar field into a single arrow, the gradient. You will see that it points uphill as steeply as possible and stands at right angles to the level sets.

::: context scalar-field Why "scalar" and why "field"
A **scalar** is a plain number that has a size but no direction: a temperature, a mass, an energy. The word comes from "scale", like the marks on a thermometer. A **vector** has a direction as well, like a velocity.

A **field** is a quantity spread over space, with a value at every point. A weather map of temperatures is a scalar field. A weather map of wind arrows is a vector field. Gravity around Earth can be described either way: as a scalar field (the potential energy per kilogram at each point) or as a vector field (the pull at each point). Lesson 2 shows how to get the second from the first.
:::

::: context contour-map Reading a contour map
A hiking map draws a line through every place at the same height. Here the "hill" is the bowl $f = x^2 + y^2$, and the rings are the level sets $f = 1, 2, 3, 4$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="5" y1="110" x2="200" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="100" y1="15" x2="100" y2="205" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="100" cy="110" r="45" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="100" cy="110" r="63.64" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="100" cy="110" r="77.94" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="100" cy="110" r="90" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44"><text x="147" y="104">1</text><text x="165" y="104">2</text><text x="179" y="104">3</text><text x="191" y="104">4</text></g>
  <text x="205" y="30" font-size="12" fill="#1f2a44">rings: f = 1, 2, 3, 4</text>
  <text x="205" y="60" font-size="12" fill="#1f2a44">equal steps in f</text>
  <text x="205" y="90" font-size="12" fill="#b4232c">rings crowd together</text>
  <text x="205" y="106" font-size="12" fill="#b4232c">where the bowl</text>
  <text x="205" y="122" font-size="12" fill="#b4232c">gets steeper</text>
  <text x="205" y="160" font-size="12" fill="#1f2a44">radius of ring f = c</text>
  <text x="205" y="176" font-size="12" fill="#1f2a44">is √c</text>
</svg>
```

Rings far apart mean gentle ground; rings close together mean steep ground. Next lesson turns that into a formula.
:::

::: context geoid The shape of "sea level"
If the oceans stopped moving — no tides, no currents, no wind — their surface would settle on one surface of constant gravitational potential. That surface, continued under the land, is the **geoid**. It is lumpy, because Earth's mass is spread unevenly: it rises and dips about a hundred metres from a smooth ellipsoid. Heights on maps and "metres above sea level" are measured from it, and a spirit level sits flat along it.
:::

::: context curly-d The curly d
The symbol $\partial$ is a rounded "d". Mathematicians use it so that nobody confuses a partial derivative, where other inputs are frozen, with an ordinary derivative $d/dx$, where there is only one input.

Say it "partial": $\partial f/\partial x$ is "partial f, partial x". You will also hear "del" or "dee". The symbol was used this way by Adrien-Marie Legendre in the 1780s and made standard by Carl Jacobi in the 1840s — the same Jacobi whose name is on the matrix in Lesson 3.
:::

::: context slice-slope Slicing the surface
Take $f(x, y) = x^2 y$ and freeze $y = 1$. The slice is the curve $z = x^2$. Its slope at $x = 1$ is $2$, which is $\partial f/\partial x = 2xy$ at $(1, 1)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="195" x2="260" y2="195" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="195" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="264" y="199" font-size="12" fill="#1f2a44">x</text>
  <text x="30" y="20" font-size="12" fill="#1f2a44">z</text>
  <line x1="140" y1="191" x2="140" y2="199" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="240" y1="191" x2="240" y2="199" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="211" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="240" y="211" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,195.0 50.0,194.6 60.0,193.4 70.0,191.4 80.0,188.6 90.0,185.0 100.0,180.6 110.0,175.4 120.0,169.4 130.0,162.6 140.0,155.0 150.0,146.6 160.0,137.4 170.0,127.4 180.0,116.6 190.0,105.0 200.0,92.6 210.0,79.4 220.0,65.4 230.0,50.6 240.0,35.0"/>
  <line x1="95" y1="191" x2="220" y2="91" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="140" cy="155" r="4.5" fill="#b4232c"/>
  <text x="250" y="40" font-size="12" fill="#1d6fd1">slice y = 1:</text>
  <text x="250" y="56" font-size="12" fill="#1d6fd1">z = x²</text>
  <text x="228" y="100" font-size="12" fill="#b4232c">tangent,</text>
  <text x="228" y="116" font-size="12" fill="#b4232c">slope 2</text>
</svg>
```

Freeze $y = 2$ instead and the slice is $z = 2x^2$, with slope $4$ at $x = 1$. Different slice, different partial derivative.
:::

::: context max-q Max Q
As a rocket climbs, it speeds up while the air thins out. Dynamic pressure $q = \tfrac{1}{2}\rho v^2$ first rises (speed wins) and then falls (thin air wins). The peak is called **max Q**, and it is the moment of greatest aerodynamic stress on the structure. Many rockets throttle their engines down briefly as they pass through it; launch commentators often call out "max Q" about a minute after lift-off. For many launchers the peak is a few tens of kilopascals, close to the $38\,\mathrm{kPa}$ in this example.
:::

::: context line-of-sight The unit line of sight
Point from the station to the satellite. Shrink that arrow to length one without turning it. Its three components are the three partial derivatives of range. Move the satellite along this arrow and the range grows metre for metre. Move it at right angles to the arrow and the range, to first order, does not change at all — a fact you will use again and again in the next two lessons.
:::

::: context schwarz-name Two names for one theorem
The rule that mixed partial derivatives match is named after two mathematicians. Alexis Clairaut used it in the 1740s. Hermann Schwarz, in the 1800s, gave a careful proof and pinned down exactly when it holds: the second partials must be continuous. Many textbooks use one name, some the other; they mean the same rule.
:::

::: context laplace-preview Where the zero sum comes back
The sum $f_{xx} + f_{yy} + f_{zz}$ is written $\nabla^2 f$ and called the Laplacian. Functions for which it is zero are called **harmonic**. Outside a planet, the gravitational potential is harmonic. That single fact lets engineers describe Earth's lumpy gravity with a tidy list of numbers called spherical-harmonic coefficients — the $J_2$ term in this module's exercise is the largest correction among them. Lesson 8 explains why.
:::

::: context error-budget What an error budget looks like
An error budget is a table an engineer builds before a mission to see which uncertainties matter. Each row names one error source — a sensor bias, a timing error, an atmosphere model — and multiplies its size by the partial derivative that turns it into the quantity you care about, such as landing position. Adding the rows (often as a root-sum-square, when the errors are independent) gives the total. The biggest row tells you where to spend money on a better sensor.
:::

::: context round-off Why computers lose digits
A double-precision number keeps about sixteen significant digits. Suppose two ranges are $660.97201151032$ and $660.97201141032$ km. Their difference is $0.0000001$, but only the last few stored digits carry it, so the difference is known to only about six digits instead of sixteen. Divide by a tiny $h$ and that fuzz is magnified. This loss is called **cancellation**, and it is why the smallest step is not the best step.
:::

::: context error-v The V-shaped error curve
The central-difference error for this range partial, measured at step sizes from $10^{-8}$ to $1\,\mathrm{km}$ (both axes are powers of ten).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">10⁻⁸</text><text x="115" y="186">10⁻⁶</text><text x="190" y="186">10⁻⁴</text><text x="265" y="186">10⁻²</text><text x="340" y="186">1</text>
    <text x="190" y="206">step h (km)</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="36" y="45">10⁻⁶</text><text x="36" y="88">10⁻⁸</text><text x="36" y="131">10⁻¹⁰</text><text x="36" y="174">10⁻¹²</text>
  </g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,23.4 58.8,20.2 77.5,39.6 96.2,51.8 115.0,52.1 133.8,93.3 152.5,75.9 171.2,82.3 190.0,98.7 208.8,112.0 227.5,123.8 246.2,126.1 265.0,152.8 283.8,125.0 302.5,103.8 321.2,82.3 340.0,60.9"/>
  <circle cx="190" cy="98.7" r="4" fill="#b4232c"/>
  <text x="196" y="94" font-size="11" fill="#b4232c">h = 10⁻⁴</text>
  <text x="60" y="130" font-size="12" fill="#1f2a44">round-off wins</text>
  <text x="250" y="40" font-size="12" fill="#1f2a44">truncation wins</text>
</svg>
```

On the right, the error falls by a factor of $100$ for each factor of $10$ in $h$: the $h^2$ law. On the left, round-off makes it jumpy and rising.
:::
