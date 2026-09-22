---
id: l03-jacobian
title: The Jacobian and the measurement matrix
minutes: 22
covers:
  - Jacobian and Hessian
---

An extended Kalman filter does one thing over and over: it replaces a nonlinear function by its best linear approximation at the current estimate, works with the linear version for one step, and moves on. The linear version of a function that takes a vector in and gives a vector out is a matrix, and that matrix is the Jacobian. In an orbit-determination filter the Jacobian of the measurement model is called $\mathbf{H}$ and the Jacobian of the dynamics is called $\mathbf{F}$. Both are tables of partial derivatives, and both are the reason a filter that passes every unit test can still diverge: a single wrong entry quietly misinforms every update.

This lesson defines the Jacobian, shows how to read its rows and columns, and derives the two Jacobians you will implement in this module's programming exercise — the partial derivatives of range and range-rate with respect to the six-component state of a satellite — together with the Jacobian of two-body gravity, which is the heart of $\mathbf{F}$. It closes with the finite-difference test that every analytic Jacobian must pass.

The Hessian, the matrix of second derivatives of a scalar function, is the Jacobian of a gradient. It gets its own lesson next.

## Vector-valued functions of a vector

A function $\mathbf{f}:\mathbb{R}^n \to \mathbb{R}^m$ takes $n$ inputs and returns $m$ outputs. Write the inputs as $\mathbf{x} = [x_1, \dots, x_n]^\top$ and the outputs as components $f_1(\mathbf{x}), \dots, f_m(\mathbf{x})$, each an ordinary scalar field. Examples from a spacecraft:

- a measurement model $\mathbf{h}(\mathbf{x})$ mapping a six-component state $\mathbf{x} = [\mathbf{r}; \mathbf{v}]$ to the two numbers a radar reports, range and range-rate ($n = 6$, $m = 2$);
- a coordinate transformation from spherical $(r, \theta, \varphi)$ to Cartesian $(x, y, z)$ ($n = m = 3$);
- the dynamics $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ mapping a state to its rate of change ($n = m = 6$).

## Definition of the Jacobian

The **Jacobian matrix** of $\mathbf{f}$ at $\mathbf{x}$ is the $m \times n$ matrix of all first partial derivatives, output index down the rows and input index across the columns:

$$
\mathbf{J}_{\mathbf{f}} = \frac{\partial \mathbf{f}}{\partial \mathbf{x}} =
\begin{bmatrix}
\dfrac{\partial f_1}{\partial x_1} & \cdots & \dfrac{\partial f_1}{\partial x_n} \\
\vdots & & \vdots \\
\dfrac{\partial f_m}{\partial x_1} & \cdots & \dfrac{\partial f_m}{\partial x_n}
\end{bmatrix},
\qquad (\mathbf{J}_{\mathbf{f}})_{ij} = \frac{\partial f_i}{\partial x_j} .
$$

Row $i$ is the transposed gradient of the $i$-th output, $(\nabla f_i)^\top$: it tells you how output $i$ responds to every input. Column $j$ is the vector $\partial \mathbf{f}/\partial x_j$: it tells you how every output responds to input $j$ alone. The entry in row $i$, column $j$ has the units of $f_i$ divided by the units of $x_j$, so a Jacobian mixing positions and velocities carries mixed units and must be read cell by cell.

Apply the tangent-plane approximation of Lesson 1 to each component and stack the results:

$$
f_i(\mathbf{x} + \delta\mathbf{x}) \approx f_i(\mathbf{x}) + \sum_{j} \frac{\partial f_i}{\partial x_j}\,\delta x_j
\quad \Longrightarrow \quad
\mathbf{f}(\mathbf{x} + \delta\mathbf{x}) \approx \mathbf{f}(\mathbf{x}) + \mathbf{J}_{\mathbf{f}}(\mathbf{x})\,\delta\mathbf{x} .
$$

This is the whole point: near $\mathbf{x}$, the nonlinear map acts on small displacements like the matrix $\mathbf{J}_{\mathbf{f}}$. If $\mathbf{f}$ is already linear, $\mathbf{f}(\mathbf{x}) = \mathbf{A}\mathbf{x}$, then $\partial f_i/\partial x_j = A_{ij}$ and the Jacobian is $\mathbf{A}$ itself, everywhere. If $m = 1$ the Jacobian is a single row, the transposed gradient — which is why derivatives of scalars with respect to vectors are written as rows.

Three scalar-by-vector derivatives recur so often that they are worth memorising. For constant $\mathbf{a}$ and a symmetric constant matrix $\mathbf{A}$:

$$
\frac{\partial}{\partial \mathbf{x}}(\mathbf{a}^\top \mathbf{x}) = \mathbf{a}^\top, \qquad
\frac{\partial}{\partial \mathbf{x}}(\mathbf{x}^\top \mathbf{x}) = 2\mathbf{x}^\top, \qquad
\frac{\partial}{\partial \mathbf{x}}(\mathbf{x}^\top \mathbf{A}\mathbf{x}) = 2\mathbf{x}^\top \mathbf{A} .
$$

Each follows by writing the quadratic out in components and differentiating term by term; the middle one, for instance, is $\partial(\sum_k x_k^2)/\partial x_j = 2x_j$, assembled into a row.

::: key
The Jacobian of $\mathbf{f}:\mathbb{R}^n \to \mathbb{R}^m$ is the $m \times n$ matrix $(\mathbf{J}_{\mathbf{f}})_{ij} = \partial f_i/\partial x_j$, with one output per row and one input per column. It is the matrix of the best linear approximation: $\mathbf{f}(\mathbf{x} + \delta\mathbf{x}) \approx \mathbf{f}(\mathbf{x}) + \mathbf{J}_{\mathbf{f}}\,\delta\mathbf{x}$.
:::

::: example The Jacobian of a coordinate transformation
Polar coordinates map $(r, \theta)$ to $(x, y) = (r\cos\theta,\ r\sin\theta)$. The Jacobian is

$$
\mathbf{J} = \begin{bmatrix} \partial x/\partial r & \partial x/\partial \theta \\ \partial y/\partial r & \partial y/\partial \theta \end{bmatrix}
= \begin{bmatrix} \cos\theta & -r\sin\theta \\ \sin\theta & r\cos\theta \end{bmatrix}.
$$

Read the columns: the first, $[\cos\theta, \sin\theta]^\top$, is the direction you move when $r$ increases — a unit radial vector. The second, $[-r\sin\theta, r\cos\theta]^\top$, is the direction you move when $\theta$ increases, tangential and of length $r$: a change $d\theta$ moves you $r\,d\theta$. At $r = 2$, $\theta = 30^\circ$ the matrix is $[[0.866, -1.000], [0.500, 1.732]]$ and its determinant is $\cos^2\theta \cdot r + r\sin^2\theta = r = 2$. The determinant is the factor by which the map scales small areas, which is why $dA = r\,dr\,d\theta$ in Lesson 6.

For spherical coordinates $(r, \theta, \varphi) \mapsto (r\sin\theta\cos\varphi,\ r\sin\theta\sin\varphi,\ r\cos\theta)$ the same computation gives a $3 \times 3$ Jacobian whose columns are the radial, polar and azimuthal tangent vectors, with lengths $1$, $r$ and $r\sin\theta$, and whose determinant is $r^2 \sin\theta$. Numerically, at $r = 2$, $\theta = 0.7$, $\varphi = 0.3$ the determinant is $2.577$, equal to $r^2\sin\theta = 4 \times 0.6442$.
:::

## Measurement models and the H matrix

Let the state be $\mathbf{x} = [\mathbf{r}; \mathbf{v}] \in \mathbb{R}^6$ and a sensor return $\mathbf{z} = \mathbf{h}(\mathbf{x}) + \text{noise}$. If the filter's estimate is $\hat{\mathbf{x}}$ and the true state is $\hat{\mathbf{x}} + \delta\mathbf{x}$, the measurement residual is

$$
\mathbf{z} - \mathbf{h}(\hat{\mathbf{x}}) \approx \mathbf{H}\,\delta\mathbf{x} + \text{noise}, \qquad \mathbf{H} = \frac{\partial \mathbf{h}}{\partial \mathbf{x}}\bigg|_{\hat{\mathbf{x}}} .
$$

Everything the filter learns about the state error comes through $\mathbf{H}$. A zero column means the corresponding state component is invisible to this measurement at this instant; a wrong entry attributes the residual to the wrong component.

### Range

A ground station at $\mathbf{r}_s$ measures the range $\rho = \lVert \mathbf{r} - \mathbf{r}_s \rVert$. Write $\Delta\mathbf{r} = \mathbf{r} - \mathbf{r}_s$, so $\rho = (\Delta\mathbf{r}^\top \Delta\mathbf{r})^{1/2}$. Since $\partial\Delta\mathbf{r}/\partial\mathbf{r} = \mathbf{I}$, the rule for $\mathbf{x}^\top\mathbf{x}$ and the chain rule for the square root give

$$
\frac{\partial \rho}{\partial \mathbf{r}} = \frac{1}{2}(\Delta\mathbf{r}^\top \Delta\mathbf{r})^{-1/2} \cdot 2\Delta\mathbf{r}^\top = \frac{\Delta\mathbf{r}^\top}{\rho} = \hat{\mathbf{u}}^\top ,
$$

where $\hat{\mathbf{u}} = \Delta\mathbf{r}/\rho$ is the unit line-of-sight vector from station to satellite. This is Lesson 2's gradient of a distance, written as a row. Range does not depend on velocity, so $\partial\rho/\partial\mathbf{v} = \mathbf{0}^\top$. The full row of $\mathbf{H}$ for a range measurement is therefore

$$
\mathbf{H}_\rho = \begin{bmatrix} \hat{\mathbf{u}}^\top & \mathbf{0}^\top \end{bmatrix} \qquad (1 \times 6),
$$

dimensionless, of unit length, and blind to any position error perpendicular to the line of sight.

::: key
For the range $\rho = \lVert \mathbf{r}_{\text{sat}} - \mathbf{r}_{\text{sta}} \rVert$, the derivative with respect to satellite position is $\partial\rho/\partial\mathbf{r} = (\mathbf{r}_{\text{sat}} - \mathbf{r}_{\text{sta}})^\top/\rho$ — the transposed unit line-of-sight vector. It is the first row of the $\mathbf{H}$ matrix in an orbit-determination filter, and $\partial\rho/\partial\mathbf{v} = \mathbf{0}^\top$.
:::

### Range-rate

A Doppler radar measures the rate of change of range. With relative velocity $\Delta\mathbf{v} = \mathbf{v} - \mathbf{v}_s$ (and $\Delta\mathbf{v} = \mathbf{v}$ for a station fixed in the inertial frame, as in the exercise), the range-rate is the component of relative velocity along the line of sight:

$$
\dot\rho = \frac{\Delta\mathbf{r} \cdot \Delta\mathbf{v}}{\rho} = \hat{\mathbf{u}} \cdot \Delta\mathbf{v} .
$$

Lesson 4 will confirm by the chain rule that this is indeed $d\rho/dt$. Differentiate first with respect to velocity, which appears linearly with $\Delta\mathbf{r}$ and $\rho$ held fixed:

$$
\frac{\partial \dot\rho}{\partial \mathbf{v}} = \frac{\Delta\mathbf{r}^\top}{\rho} = \hat{\mathbf{u}}^\top .
$$

Now differentiate with respect to position. Both the numerator $\Delta\mathbf{r}^\top\Delta\mathbf{v}$ and the denominator $\rho$ depend on $\mathbf{r}$, so use the product rule on $(\Delta\mathbf{r}^\top\Delta\mathbf{v}) \cdot \rho^{-1}$:

$$
\frac{\partial \dot\rho}{\partial \mathbf{r}} = \frac{\Delta\mathbf{v}^\top}{\rho} + (\Delta\mathbf{r}^\top\Delta\mathbf{v})\,\frac{\partial (\rho^{-1})}{\partial \mathbf{r}}
= \frac{\Delta\mathbf{v}^\top}{\rho} - (\Delta\mathbf{r}^\top\Delta\mathbf{v})\,\frac{\Delta\mathbf{r}^\top}{\rho^3} .
$$

Recognising $\Delta\mathbf{r}^\top\Delta\mathbf{v}/\rho = \dot\rho$ and $\Delta\mathbf{r}/\rho = \hat{\mathbf{u}}$,

$$
\frac{\partial \dot\rho}{\partial \mathbf{r}} = \frac{1}{\rho}\left(\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}}\right)^\top .
$$

The vector $\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}}$ is the relative velocity with its line-of-sight component removed: the part of the motion *across* the line of sight. So a position error along the line of sight does not change the range-rate at all, while a position error across it rotates the line of sight and lets some of the cross-track velocity leak into the measured Doppler, in proportion to the angular rate $\lVert \Delta\mathbf{v}_\perp \rVert/\rho$. The complete $2 \times 6$ measurement Jacobian is

$$
\mathbf{H} = \begin{bmatrix} \hat{\mathbf{u}}^\top & \mathbf{0}^\top \\[4pt] \dfrac{(\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}})^\top}{\rho} & \hat{\mathbf{u}}^\top \end{bmatrix} .
$$

::: key
For the range-rate $\dot\rho = (\Delta\mathbf{r}\cdot\Delta\mathbf{v})/\rho$, the derivative with respect to velocity is $\partial\dot\rho/\partial\mathbf{v} = \Delta\mathbf{r}^\top/\rho$, again the unit line of sight. Only the component of velocity along the line of sight is observable from Doppler. The position partial is $\partial\dot\rho/\partial\mathbf{r} = (\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}})^\top/\rho$.
:::

::: example The 2 × 6 measurement Jacobian for one geometry
Take the exercise's numbers: $\mathbf{r} = (7000, 100, -200)\,\mathrm{km}$, $\mathbf{v} = (0.5, 7.4, 0.1)\,\mathrm{km/s}$, station $\mathbf{r}_s = (6378, 0, 0)\,\mathrm{km}$ at rest in the inertial frame. Then $\Delta\mathbf{r} = (622, 100, -200)\,\mathrm{km}$, $\rho = 660.972\,\mathrm{km}$ and $\hat{\mathbf{u}} = (0.941038, 0.151292, -0.302585)$. The range-rate is

$$
\dot\rho = \frac{622 \times 0.5 + 100 \times 7.4 + (-200)(0.1)}{660.972} = \frac{1031}{660.972} = 1.55982\,\mathrm{km/s}.
$$

The cross-line-of-sight velocity is $\mathbf{v} - \dot\rho\,\hat{\mathbf{u}} = (0.5 - 1.46786,\ 7.4 - 0.23598,\ 0.1 + 0.47197) = (-0.96785, 7.16401, 0.57198)\,\mathrm{km/s}$, of magnitude $7.2517\,\mathrm{km/s}$ — nearly all of the $7.4176\,\mathrm{km/s}$ speed, since the satellite is passing almost across the beam. Dividing by $\rho$ gives the position row of the range-rate, in $\mathrm{s^{-1}}$:

$$
\mathbf{H} = \begin{bmatrix} 0.941038 & 0.151292 & -0.302585 & 0 & 0 & 0 \\ -0.00146429 & 0.0108386 & 0.00086536 & 0.941038 & 0.151292 & -0.302585 \end{bmatrix}.
$$

A central finite difference with step $10^{-4}\,\mathrm{km}$ (and $10^{-4}\,\mathrm{km/s}$) on every state component reproduces every entry to within $2.1 \times 10^{-9}$ absolute and $2.7 \times 10^{-9}$ relative. The bottom-left block is small — about $0.011\,\mathrm{s^{-1}}$ — but it is not negligible: a $1\,\mathrm{km}$ cross-track position error produces an $11\,\mathrm{m/s}$ range-rate residual, which a filter with metre-per-second Doppler noise will act on strongly. Leave the block out and the filter mis-attributes that residual to velocity.
:::

::: warning
The classic error in the range-rate Jacobian is to differentiate only the numerator of $\Delta\mathbf{r}\cdot\Delta\mathbf{v}/\rho$ with respect to position and forget that $\rho$ in the denominator depends on $\mathbf{r}$ too. The missing term is $-\dot\rho\,\hat{\mathbf{u}}^\top/\rho$. Every component of such a filter unit-tests clean, and the filter still drifts.
:::

### An angle measurement

Optical sensors report angles, not distances. In the plane, a bearing $\theta = \operatorname{atan2}(y, x)$ from a sensor at the origin has

$$
\frac{\partial\theta}{\partial x} = \frac{-y}{x^2 + y^2}, \qquad \frac{\partial\theta}{\partial y} = \frac{x}{x^2 + y^2}, \qquad \frac{\partial\theta}{\partial (x, y)} = \frac{1}{\rho}\left[-\sin\theta,\ \cos\theta\right],
$$

a row of length $1/\rho$ perpendicular to the line of sight. Angles are sensitive to exactly the displacements that range cannot see, and their sensitivity falls off with distance. For a target at $(3000, 4000)\,\mathrm{m}$, $\rho = 5000\,\mathrm{m}$, $\theta = 53.13^\circ$, and $\partial\theta/\partial x = -4000/(2.5 \times 10^7) = -1.6 \times 10^{-4}\,\mathrm{rad/m}$. A $100\,\mathrm{m}$ shift in $x$ changes the bearing by about $-0.016\,\mathrm{rad} = -0.917^\circ$ linearly, against an exact $-0.906^\circ$.

## The Jacobian of the dynamics

Two-body gravity is $\mathbf{a}(\mathbf{r}) = -\mu\,\mathbf{r}/r^3$. To linearise the dynamics you need $\partial\mathbf{a}/\partial\mathbf{r}$, a $3 \times 3$ matrix. Write $\mathbf{a} = g(\mathbf{r})\,\mathbf{r}$ with the scalar $g = -\mu r^{-3}$. The product rule for a scalar field times the position vector is

$$
\frac{\partial}{\partial\mathbf{r}}\big(g\,\mathbf{r}\big) = g\,\mathbf{I} + \mathbf{r}\,(\nabla g)^\top ,
$$

because entry $(i, j)$ is $\partial(g\,x_i)/\partial x_j = g\,\delta_{ij} + x_i\,\partial g/\partial x_j$. With $\nabla g = -\mu\,\nabla(r^{-3}) = 3\mu\,\mathbf{r}/r^5$ from Lesson 2,

$$
\mathbf{G} = \frac{\partial\mathbf{a}}{\partial\mathbf{r}} = -\frac{\mu}{r^3}\mathbf{I} + \frac{3\mu}{r^5}\,\mathbf{r}\mathbf{r}^\top = \frac{\mu}{r^3}\left(3\,\hat{\mathbf{r}}\hat{\mathbf{r}}^\top - \mathbf{I}\right).
$$

This is the **gravity-gradient matrix**. It is symmetric, and its trace is $(\mu/r^3)(3 - 3) = 0$. Acting on a radial displacement it gives $+2\mu/r^3$ times the displacement (moving outward, gravity weakens, so the differential acceleration points outward); on a transverse displacement it gives $-\mu/r^3$ (the field lines converge). These are tidal accelerations. Since velocity does not enter $\mathbf{a}$ and $\dot{\mathbf{r}} = \mathbf{v}$ exactly, the full $6 \times 6$ dynamics Jacobian is

$$
\mathbf{F} = \frac{\partial}{\partial \mathbf{x}}\begin{bmatrix} \mathbf{v} \\ \mathbf{a}(\mathbf{r}) \end{bmatrix} = \begin{bmatrix} \mathbf{0} & \mathbf{I} \\ \mathbf{G} & \mathbf{0} \end{bmatrix} .
$$

::: example Tidal accelerations at 400 km
At $\mathbf{r} = (6778.137, 0, 0)\,\mathrm{km}$, $\mu/r^3 = 3.986 \times 10^{14}/(6.778137 \times 10^6)^3 = 1.280 \times 10^{-6}\,\mathrm{s^{-2}}$ and $\hat{\mathbf{r}} = (1, 0, 0)$, so

$$
\mathbf{G} = 1.280 \times 10^{-6}\begin{bmatrix} 2 & 0 & 0 \\ 0 & -1 & 0 \\ 0 & 0 & -1 \end{bmatrix}\,\mathrm{s^{-2}} .
$$

Two ends of a $100\,\mathrm{m}$ tether aligned along the radius feel a differential gravitational acceleration of $2 \times 1.280 \times 10^{-6} \times 100 = 2.56 \times 10^{-4}\,\mathrm{m/s^2}$ pulling them apart; the same tether laid across the orbit is squeezed together at half that rate. A central difference on $\mathbf{a}(\mathbf{r})$ with a $1\,\mathrm{m}$ step reproduces these entries to nine digits.
:::

## Validating a Jacobian numerically

Every column of a Jacobian is a directional derivative along a coordinate axis, so the central difference of Lesson 1 applies column by column:

$$
\mathbf{J}_{:,j} \approx \frac{\mathbf{f}(\mathbf{x} + h\mathbf{e}_j) - \mathbf{f}(\mathbf{x} - h\mathbf{e}_j)}{2h} .
$$

Choose $h$ around $10^{-7}$ of the scale of $x_j$ — for positions in kilometres, $h = 10^{-4}\,\mathrm{km}$ — and compare entry by entry with a relative tolerance near $10^{-6}$ and a small absolute tolerance for entries that should be zero. Do this in a test, never in the flight code: finite differences cost $2n$ function evaluations per Jacobian and inherit the round-off noise you saw in Lesson 1.

```python
import numpy as np

def numerical_jacobian(f, x, h=1e-4):
    x = np.asarray(x, float); fx = f(x)
    J = np.zeros((fx.size, x.size))
    for j in range(x.size):
        e = np.zeros_like(x); e[j] = h
        J[:, j] = (f(x + e) - f(x - e)) / (2 * h)
    return J

rs = np.array([6378.0, 0.0, 0.0])
def h_meas(x):
    d = x[:3] - rs; rho = np.linalg.norm(d)
    return np.array([rho, d @ x[3:] / rho])

x = np.array([7000.0, 100.0, -200.0, 0.5, 7.4, 0.1])
print(numerical_jacobian(h_meas, x)[0, :3])  # [ 0.94103833  0.15129234 -0.30258467]
```

::: warning
Rows are outputs, columns are inputs. A $2 \times 6$ measurement Jacobian multiplies a $6 \times 1$ state error to give a $2 \times 1$ residual; if you build the transpose by habit, the product $\mathbf{H}\,\delta\mathbf{x}$ is not even defined and the error is caught, but the product $\mathbf{H}\mathbf{P}\mathbf{H}^\top$ inside a filter may silently come out with the wrong shape in a language that broadcasts. Check shapes explicitly.
:::

::: note
A range measurement has $\partial\rho/\partial\mathbf{v} = \mathbf{0}^\top$, yet range-only tracking does determine velocity. The information arrives through the dynamics: a velocity error today becomes a position error tomorrow, and the $\mathbf{F}$ matrix carries it into the range row of later measurements. Observability is a property of $\mathbf{H}$ and $\mathbf{F}$ together over time, not of one row at one instant.
:::

## Check yourself

::: check
Write the Jacobian of $\mathbf{f}(x, y) = [x^2 y,\ \sin x + y]^\top$ and use it to estimate $\mathbf{f}(1.1, 2.05)$ from $\mathbf{f}(1, 2)$.
:::

::: answer
$\mathbf{J} = [[2xy,\ x^2],[\cos x,\ 1]]$, which at $(1, 2)$ is $[[4, 1],[0.5403, 1]]$. With $\delta\mathbf{x} = [0.1, 0.05]^\top$, $\mathbf{J}\delta\mathbf{x} = [0.45, 0.1040]^\top$. Since $\mathbf{f}(1, 2) = [2, 2.8415]^\top$, the estimate is $[2.45, 2.9455]^\top$. The exact value is $[2.4805, 2.9412]^\top$; the $x^2 y$ component, being more curved, has the larger error.
:::

::: check
A station measures range to a satellite directly overhead at zero relative velocity. What is $\partial\dot\rho/\partial\mathbf{r}$, and what does it mean physically?
:::

::: answer
With $\Delta\mathbf{v} = \mathbf{0}$, $\dot\rho = 0$ and $\partial\dot\rho/\partial\mathbf{r} = (\Delta\mathbf{v} - \dot\rho\hat{\mathbf{u}})^\top/\rho = \mathbf{0}^\top$. A small position error cannot change the range-rate when nothing is moving, because rotating the line of sight leaks in a fraction of the cross-track velocity, and there is none. The velocity partial is still $\hat{\mathbf{u}}^\top$: the Doppler measurement would immediately see any line-of-sight velocity.
:::

::: check
Why is the range row of $\mathbf{H}$ dimensionless while the range-rate row has entries in $\mathrm{s^{-1}}$ in its position block and dimensionless entries in its velocity block?
:::

::: answer
Each entry has the units of the output divided by the units of the input. Range over position is $\mathrm{km/km}$, dimensionless. Range-rate over position is $(\mathrm{km/s})/\mathrm{km} = \mathrm{s^{-1}}$; range-rate over velocity is $(\mathrm{km/s})/(\mathrm{km/s})$, dimensionless. Reading the units off the Jacobian is a fast check that you have differentiated with respect to the right variable.
:::

::: check
Show that the gravity-gradient matrix $\mathbf{G} = (\mu/r^3)(3\hat{\mathbf{r}}\hat{\mathbf{r}}^\top - \mathbf{I})$ has eigenvalues $2\mu/r^3$, $-\mu/r^3$, $-\mu/r^3$.
:::

::: answer
For the radial direction, $\mathbf{G}\hat{\mathbf{r}} = (\mu/r^3)(3\hat{\mathbf{r}}(\hat{\mathbf{r}}^\top\hat{\mathbf{r}}) - \hat{\mathbf{r}}) = (\mu/r^3)(3 - 1)\hat{\mathbf{r}} = (2\mu/r^3)\hat{\mathbf{r}}$. For any $\mathbf{t}$ perpendicular to $\hat{\mathbf{r}}$, $\hat{\mathbf{r}}^\top\mathbf{t} = 0$ so $\mathbf{G}\mathbf{t} = -(\mu/r^3)\mathbf{t}$, and there is a two-dimensional space of such vectors. The trace $2 - 1 - 1 = 0$ confirms the count.
:::

::: check
Your analytic Jacobian and a central-difference Jacobian with $h = 10^{-4}\,\mathrm{km}$ agree to $10^{-9}$ in every entry except one, which differs by $3\%$. Which is wrong, and how would you find the bug?
:::

::: answer
The analytic one. Finite differences are uniform in their behaviour — if the step is good for five entries it is good for the sixth — whereas a $3\%$ discrepancy in a single entry is the signature of a missing or mis-signed term in one partial derivative. Locate the entry's row (which output) and column (which input), and re-derive that single partial by hand, looking especially for a product-rule term through a denominator such as $\rho$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $(\mathbf{J}_{\mathbf{f}})_{ij} = \partial f_i/\partial x_j$ | Jacobian, $m \times n$: rows are outputs, columns are inputs |
| $\mathbf{f}(\mathbf{x} + \delta\mathbf{x}) \approx \mathbf{f}(\mathbf{x}) + \mathbf{J}_{\mathbf{f}}\delta\mathbf{x}$ | linearisation of a vector function |
| $\partial(\mathbf{x}^\top\mathbf{x})/\partial\mathbf{x} = 2\mathbf{x}^\top$, $\partial(\mathbf{a}^\top\mathbf{x})/\partial\mathbf{x} = \mathbf{a}^\top$ | scalar-by-vector derivatives as rows |
| $\partial\rho/\partial\mathbf{r} = \Delta\mathbf{r}^\top/\rho = \hat{\mathbf{u}}^\top$, $\partial\rho/\partial\mathbf{v} = \mathbf{0}^\top$ | range row of $\mathbf{H}$ |
| $\partial\dot\rho/\partial\mathbf{v} = \hat{\mathbf{u}}^\top$, $\partial\dot\rho/\partial\mathbf{r} = (\Delta\mathbf{v} - \dot\rho\hat{\mathbf{u}})^\top/\rho$ | range-rate row of $\mathbf{H}$ |
| $\mathbf{G} = \partial\mathbf{a}/\partial\mathbf{r} = (\mu/r^3)(3\hat{\mathbf{r}}\hat{\mathbf{r}}^\top - \mathbf{I})$ | gravity gradient; eigenvalues $2\mu/r^3, -\mu/r^3, -\mu/r^3$ |
| $\mathbf{F} = [[\mathbf{0}, \mathbf{I}], [\mathbf{G}, \mathbf{0}]]$ | dynamics Jacobian of the two-body problem |
| $\mathbf{J}_{:,j} \approx [\mathbf{f}(\mathbf{x} + h\mathbf{e}_j) - \mathbf{f}(\mathbf{x} - h\mathbf{e}_j)]/2h$ | central-difference validation, column by column |

The next lesson takes the Jacobian of a gradient — the Hessian — and uses its eigenvalues to decide whether a stationary point of a cost function is a minimum, a maximum or a saddle.
