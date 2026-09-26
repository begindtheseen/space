---
id: l03-jacobian
title: The Jacobian and the measurement matrix
minutes: 24
covers:
  - Jacobian and Hessian
---

Think of a mixing desk at a concert. Six sliders go in; two speaker levels come out. Nudge one slider and each speaker changes by its own small amount. Write down every one of those "this slider moves that speaker by so much" numbers and you get a table with one row per speaker and one column per slider. As long as the nudges stay small, that table tells you everything about how the desk responds. That table, for a mathematical function, is the **Jacobian**.

An **[[extended Kalman filter|ekf]]**, the workhorse of spacecraft navigation, does one thing over and over. It replaces a curved, nonlinear function by its best straight-line version at the current best guess, uses that for one step, and moves on. The straight-line version of a function that takes a list of numbers in and gives a list of numbers out is a matrix, and that matrix is the Jacobian. In an orbit-determination filter, the Jacobian of the measurement model is called $\mathbf{H}$, and the Jacobian of the equations of motion is called $\mathbf{F}$. Both are tables of partial derivatives. And both explain how a filter that passes every unit test can still wander off: one wrong entry quietly misleads every update.

This lesson defines the Jacobian and shows how to read its rows and columns. It then derives the two rows you will program in this module's exercise — how range and range-rate respond to each of a satellite's six state numbers — and the Jacobian of two-body gravity, the heart of $\mathbf{F}$. It ends with the finite-difference test that every hand-derived Jacobian must pass. The Hessian, the table of second derivatives, is the Jacobian of a gradient; it gets its own lesson next.

## Vector-valued functions of a vector

A function $\mathbf{f}:\mathbb{R}^n \to \mathbb{R}^m$ takes $n$ numbers in and gives $m$ numbers out. Write the inputs as $\mathbf{x} = [x_1, \dots, x_n]^\top$ and the outputs as $f_1(\mathbf{x}), \dots, f_m(\mathbf{x})$. Each output on its own is an ordinary scalar field, like the ones in Lessons 1 and 2. A spacecraft is full of such functions:

- a **measurement model** $\mathbf{h}(\mathbf{x})$ turns the six-number state $\mathbf{x} = [\mathbf{r}; \mathbf{v}]$ (three position numbers stacked on three velocity numbers) into the two numbers a radar reports, range and range-rate: $n = 6$, $m = 2$;
- a **coordinate change** turns spherical coordinates $(r, \theta, \varphi)$ into Cartesian $(x, y, z)$: $n = m = 3$;
- the **dynamics** $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ turn a state into its rate of change: $n = m = 6$.

## Definition of the Jacobian

The **Jacobian matrix** of $\mathbf{f}$ at $\mathbf{x}$ is the $m \times n$ table ("m by n": $m$ rows, $n$ columns) of every first partial derivative. The output number sets the row; the input number sets the column:

$$
\mathbf{J}_{\mathbf{f}} = \frac{\partial \mathbf{f}}{\partial \mathbf{x}} =
\begin{bmatrix}
\dfrac{\partial f_1}{\partial x_1} & \cdots & \dfrac{\partial f_1}{\partial x_n} \\
\vdots & & \vdots \\
\dfrac{\partial f_m}{\partial x_1} & \cdots & \dfrac{\partial f_m}{\partial x_n}
\end{bmatrix},
\qquad (\mathbf{J}_{\mathbf{f}})_{ij} = \frac{\partial f_i}{\partial x_j} .
$$

Read $(\mathbf{J}_{\mathbf{f}})_{ij}$ as "the i, j entry of J": row $i$, column $j$. The name honors **[[Carl Jacobi|jacobi-name]]**.

There are two ways to read the table.

- **Row $i$** is the gradient of output $i$, laid on its side: $(\nabla f_i)^\top$. It says how that one output responds to every input.
- **Column $j$** is $\partial \mathbf{f}/\partial x_j$. It says how every output responds to input $j$ alone.

Each entry has the units of its output divided by the units of its input. A Jacobian that mixes positions and velocities therefore mixes units, and you read it cell by cell.

Why is this table the right object? Apply Lesson 1's tangent-plane rule to each output, then stack the results:

$$
f_i(\mathbf{x} + \delta\mathbf{x}) \approx f_i(\mathbf{x}) + \sum_{j} \frac{\partial f_i}{\partial x_j}\,\delta x_j
\quad \Longrightarrow \quad
\mathbf{f}(\mathbf{x} + \delta\mathbf{x}) \approx \mathbf{f}(\mathbf{x}) + \mathbf{J}_{\mathbf{f}}(\mathbf{x})\,\delta\mathbf{x} .
$$

The sum on the left is exactly "row $i$ times the column $\delta\mathbf{x}$" — the rule for multiplying a matrix by a vector. That is the whole point: near $\mathbf{x}$, the curved function acts on small moves like the matrix $\mathbf{J}_{\mathbf{f}}$.

Two special cases make good sanity checks. If $\mathbf{f}$ is already a matrix times a vector, $\mathbf{f}(\mathbf{x}) = \mathbf{A}\mathbf{x}$, then $\partial f_i/\partial x_j = A_{ij}$, and the Jacobian is $\mathbf{A}$ itself, everywhere. If $m = 1$, the Jacobian is a single row, the gradient on its side. That is why derivatives of a scalar with respect to a vector are written as rows.

Three scalar-by-vector derivatives come up so often that they are worth memorizing. For a constant vector $\mathbf{a}$ and a constant **symmetric** matrix $\mathbf{A}$ (one that equals its own transpose):

$$
\frac{\partial}{\partial \mathbf{x}}(\mathbf{a}^\top \mathbf{x}) = \mathbf{a}^\top, \qquad
\frac{\partial}{\partial \mathbf{x}}(\mathbf{x}^\top \mathbf{x}) = 2\mathbf{x}^\top, \qquad
\frac{\partial}{\partial \mathbf{x}}(\mathbf{x}^\top \mathbf{A}\mathbf{x}) = 2\mathbf{x}^\top \mathbf{A} .
$$

Each comes from writing the expression out in components and differentiating term by term. Take the middle one. $\mathbf{x}^\top\mathbf{x} = x_1^2 + \dots + x_n^2$, and its partial with respect to $x_j$ is $2x_j$. Put those in a row and you have $2\mathbf{x}^\top$. The first works the same way: $\mathbf{a}^\top\mathbf{x} = a_1 x_1 + \dots + a_n x_n$ has partial $a_j$.

::: key
The Jacobian of $\mathbf{f}:\mathbb{R}^n \to \mathbb{R}^m$ is the $m \times n$ matrix $(\mathbf{J}_{\mathbf{f}})_{ij} = \partial f_i/\partial x_j$, with one output per row and one input per column. It is the matrix of the best linear approximation: $\mathbf{f}(\mathbf{x} + \delta\mathbf{x}) \approx \mathbf{f}(\mathbf{x}) + \mathbf{J}_{\mathbf{f}}\,\delta\mathbf{x}$.
:::

::: example The Jacobian of a coordinate transformation
Polar coordinates describe a point by its distance $r$ from the origin and its angle $\theta$. They turn into ordinary coordinates by $(x, y) = (r\cos\theta,\ r\sin\theta)$.

**Step 1: the four partials.** Hold $\theta$ fixed and differentiate by $r$: $\partial x/\partial r = \cos\theta$, $\partial y/\partial r = \sin\theta$. Hold $r$ fixed and differentiate by $\theta$: $\partial x/\partial \theta = -r\sin\theta$, $\partial y/\partial \theta = r\cos\theta$.

$$
\mathbf{J} = \begin{bmatrix} \partial x/\partial r & \partial x/\partial \theta \\ \partial y/\partial r & \partial y/\partial \theta \end{bmatrix}
= \begin{bmatrix} \cos\theta & -r\sin\theta \\ \sin\theta & r\cos\theta \end{bmatrix}.
$$

**Step 2: read the [[columns|polar-columns]].** The first column, $[\cos\theta, \sin\theta]^\top$, is the way you move when $r$ grows: a unit arrow pointing straight outward. The second, $[-r\sin\theta, r\cos\theta]^\top$, is the way you move when $\theta$ grows: sideways, around the circle, and of length $r$. That length makes sense. Turning by a small angle $d\theta$ on a circle of radius $r$ moves you a distance $r\,d\theta$.

**Step 3: numbers.** At $r = 2$, $\theta = 30^\circ$, the matrix is $[[0.866, -1.000], [0.500, 1.732]]$ (rows listed top to bottom).

**Step 4: the determinant.** For a $2 \times 2$ matrix the **determinant** is top-left times bottom-right minus top-right times bottom-left:

$$
\det\mathbf{J} = \cos\theta \cdot r\cos\theta - (-r\sin\theta)\sin\theta = r(\cos^2\theta + \sin^2\theta) = r .
$$

Here that is $2$. Check with the numbers: $0.866 \times 1.732 + 1.000 \times 0.500 = 1.500 + 0.500 = 2.000$. The determinant is the factor by which the map [[stretches small areas|determinant-area]]. That is why $dA = r\,dr\,d\theta$ in Lesson 6.

**Step 5: three dimensions.** For spherical coordinates, $(r, \theta, \varphi) \mapsto (r\sin\theta\cos\varphi,\ r\sin\theta\sin\varphi,\ r\cos\theta)$, the same work gives a $3 \times 3$ Jacobian. Its columns are the outward, polar and around-the-axis directions, with lengths $1$, $r$ and $r\sin\theta$. Its determinant is $r^2 \sin\theta$. At $r = 2$, $\theta = 0.7$, $\varphi = 0.3$ the determinant computes to $2.577$, equal to $r^2\sin\theta = 4 \times 0.6442$.
:::

## Measurement models and the H matrix

Let the state be $\mathbf{x} = [\mathbf{r}; \mathbf{v}]$, six numbers. A sensor returns $\mathbf{z} = \mathbf{h}(\mathbf{x}) + \text{noise}$. The filter does not know the true state. It has an estimate $\hat{\mathbf{x}}$ ("x hat"), and the truth is $\hat{\mathbf{x}} + \delta\mathbf{x}$ for some unknown error $\delta\mathbf{x}$. The **residual** — what the sensor said minus what the filter expected — is then

$$
\mathbf{z} - \mathbf{h}(\hat{\mathbf{x}}) \approx \mathbf{H}\,\delta\mathbf{x} + \text{noise}, \qquad \mathbf{H} = \frac{\partial \mathbf{h}}{\partial \mathbf{x}}\bigg|_{\hat{\mathbf{x}}} .
$$

(The bar with $\hat{\mathbf{x}}$ at its foot means "evaluated at $\hat{\mathbf{x}}$".) Everything the filter learns about its own error comes through $\mathbf{H}$. A column of zeros means that state number is invisible to this measurement at this instant. A wrong entry blames the residual on the wrong state number.

### Range

A ground station at $\mathbf{r}_s$ measures the range $\rho = \lVert \mathbf{r} - \mathbf{r}_s \rVert$. Write $\Delta\mathbf{r} = \mathbf{r} - \mathbf{r}_s$ ("delta r", the arrow from station to satellite). Then $\rho = (\Delta\mathbf{r}^\top \Delta\mathbf{r})^{1/2}$: the square root of the arrow dotted with itself.

Differentiate with respect to $\mathbf{r}$ in two layers. The outside is a square root: $\tfrac{1}{2}(\cdot)^{-1/2}$. The inside is $\Delta\mathbf{r}^\top\Delta\mathbf{r}$, whose derivative is $2\Delta\mathbf{r}^\top$ by the $\mathbf{x}^\top\mathbf{x}$ rule (since $\Delta\mathbf{r}$ moves exactly as $\mathbf{r}$ moves). Multiply the layers:

$$
\frac{\partial \rho}{\partial \mathbf{r}} = \frac{1}{2}(\Delta\mathbf{r}^\top \Delta\mathbf{r})^{-1/2} \cdot 2\Delta\mathbf{r}^\top = \frac{\Delta\mathbf{r}^\top}{\rho} = \hat{\mathbf{u}}^\top ,
$$

where $\hat{\mathbf{u}} = \Delta\mathbf{r}/\rho$ is the unit line-of-sight arrow from station to satellite. This is Lesson 2's gradient of a distance, written as a row.

Range does not depend on velocity at all, so $\partial\rho/\partial\mathbf{v} = \mathbf{0}^\top$. The full row of $\mathbf{H}$ for a range measurement is

$$
\mathbf{H}_\rho = \begin{bmatrix} \hat{\mathbf{u}}^\top & \mathbf{0}^\top \end{bmatrix} \qquad (1 \times 6).
$$

It has no units, it has length one, and it is blind to any position error at right angles to the line of sight.

::: key
For the range $\rho = \lVert \mathbf{r}_{\text{sat}} - \mathbf{r}_{\text{sta}} \rVert$, the derivative with respect to satellite position is $\partial\rho/\partial\mathbf{r} = (\mathbf{r}_{\text{sat}} - \mathbf{r}_{\text{sta}})^\top/\rho$ — the transposed unit line-of-sight vector. It is the first row of the $\mathbf{H}$ matrix in an orbit-determination filter, and $\partial\rho/\partial\mathbf{v} = \mathbf{0}^\top$.
:::

### Range-rate

A **[[Doppler|doppler]]** radar measures how fast the range is changing, the **range-rate** $\dot\rho$ ("rho dot"). Let the relative velocity be $\Delta\mathbf{v} = \mathbf{v} - \mathbf{v}_s$. For a station held fixed in the inertial frame, as in the exercise, $\Delta\mathbf{v} = \mathbf{v}$. The range-rate is the part of the relative velocity that points along the line of sight:

$$
\dot\rho = \frac{\Delta\mathbf{r} \cdot \Delta\mathbf{v}}{\rho} = \hat{\mathbf{u}} \cdot \Delta\mathbf{v} .
$$

Lesson 4 will confirm, with the chain rule, that this really is $d\rho/dt$.

**Velocity partials.** Velocity appears only in $\Delta\mathbf{v}$, in the top, and there it appears linearly. Hold $\Delta\mathbf{r}$ and $\rho$ fixed, and by the $\mathbf{a}^\top\mathbf{x}$ rule:

$$
\frac{\partial \dot\rho}{\partial \mathbf{v}} = \frac{\Delta\mathbf{r}^\top}{\rho} = \hat{\mathbf{u}}^\top .
$$

**Position partials.** Here is the trap. Position appears in the top, $\Delta\mathbf{r}^\top\Delta\mathbf{v}$, *and* in the bottom, $\rho$. So write $\dot\rho$ as a product, $(\Delta\mathbf{r}^\top\Delta\mathbf{v}) \cdot \rho^{-1}$, and use the product rule. The first factor's derivative is $\Delta\mathbf{v}^\top$. The second factor's derivative is $\partial(\rho^{-1})/\partial\mathbf{r} = -\rho^{-2}\,\partial\rho/\partial\mathbf{r} = -\Delta\mathbf{r}^\top/\rho^3$:

$$
\frac{\partial \dot\rho}{\partial \mathbf{r}} = \frac{\Delta\mathbf{v}^\top}{\rho} + (\Delta\mathbf{r}^\top\Delta\mathbf{v})\,\frac{\partial (\rho^{-1})}{\partial \mathbf{r}}
= \frac{\Delta\mathbf{v}^\top}{\rho} - (\Delta\mathbf{r}^\top\Delta\mathbf{v})\,\frac{\Delta\mathbf{r}^\top}{\rho^3} .
$$

Now tidy up. In the second term, $\Delta\mathbf{r}^\top\Delta\mathbf{v}/\rho$ is $\dot\rho$, and $\Delta\mathbf{r}/\rho$ is $\hat{\mathbf{u}}$. That leaves one factor $1/\rho$:

$$
\frac{\partial \dot\rho}{\partial \mathbf{r}} = \frac{1}{\rho}\left(\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}}\right)^\top .
$$

What does it mean? The arrow $\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}}$ is the relative velocity with its line-of-sight part removed: the motion *across* the line of sight. Now imagine the satellite's position is a little wrong. If it is wrong *along* the line of sight, the line of sight does not turn, and the range-rate does not change. If it is wrong *across* the line of sight, the line of sight turns a little. Then a slice of the across-the-beam velocity leaks into the along-the-beam direction and shows up in the Doppler. The size of the leak is set by how fast the line of sight is sweeping round, $\lVert \Delta\mathbf{v}_\perp \rVert/\rho$.

Stacking the range row and the range-rate row gives the complete $2 \times 6$ **[[measurement Jacobian|h-picture]]**:

$$
\mathbf{H} = \begin{bmatrix} \hat{\mathbf{u}}^\top & \mathbf{0}^\top \\[4pt] \dfrac{(\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}})^\top}{\rho} & \hat{\mathbf{u}}^\top \end{bmatrix} .
$$

::: key
For the range-rate $\dot\rho = (\Delta\mathbf{r}\cdot\Delta\mathbf{v})/\rho$, the derivative with respect to velocity is $\partial\dot\rho/\partial\mathbf{v} = \Delta\mathbf{r}^\top/\rho$, again the unit line of sight. Only the component of velocity along the line of sight is observable from Doppler. The position partial is $\partial\dot\rho/\partial\mathbf{r} = (\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}})^\top/\rho$.
:::

::: example The 2 × 6 measurement Jacobian for one geometry
Use the exercise's numbers: $\mathbf{r} = (7000, 100, -200)\,\mathrm{km}$, $\mathbf{v} = (0.5, 7.4, 0.1)\,\mathrm{km/s}$, and the station at $\mathbf{r}_s = (6378, 0, 0)\,\mathrm{km}$, at rest in the inertial frame.

**Step 1: geometry.** $\Delta\mathbf{r} = (622, 100, -200)\,\mathrm{km}$. Its length is $\rho = 660.972\,\mathrm{km}$. Divide to get the line of sight: $\hat{\mathbf{u}} = (0.941038, 0.151292, -0.302585)$.

**Step 2: range-rate.** Dot $\Delta\mathbf{r}$ with $\mathbf{v}$, then divide by $\rho$:

$$
\dot\rho = \frac{622 \times 0.5 + 100 \times 7.4 + (-200)(0.1)}{660.972} = \frac{1031}{660.972} = 1.55982\,\mathrm{km/s}.
$$

**Step 3: the across-the-beam velocity.** Subtract the along-the-beam part $\dot\rho\,\hat{\mathbf{u}} = (1.46785, 0.23599, -0.47198)$ from $\mathbf{v}$:

$$
\mathbf{v} - \dot\rho\,\hat{\mathbf{u}} = (0.5 - 1.46785,\ 7.4 - 0.23599,\ 0.1 + 0.47198) = (-0.96785, 7.16401, 0.57198)\,\mathrm{km/s}.
$$

Its length is $7.2517\,\mathrm{km/s}$ — nearly all of the satellite's $7.4175\,\mathrm{km/s}$ speed. That fits the picture: the satellite is sweeping almost straight across the beam.

**Step 4: assemble.** Divide the across-the-beam velocity by $\rho$ for the position block of the second row (units $\mathrm{s^{-1}}$). Every other block is $\hat{\mathbf{u}}^\top$ or zero:

$$
\mathbf{H} = \begin{bmatrix} 0.941038 & 0.151292 & -0.302585 & 0 & 0 & 0 \\ -0.00146429 & 0.0108386 & 0.00086536 & 0.941038 & 0.151292 & -0.302585 \end{bmatrix}.
$$

**Step 5: check.** A central finite difference with step $10^{-4}\,\mathrm{km}$ (and $10^{-4}\,\mathrm{km/s}$ for velocities) on every state number reproduces every entry to within $2.1 \times 10^{-9}$ absolute and $2.7 \times 10^{-9}$ relative.

**Why the small block matters.** The bottom-left block is small, about $0.011\,\mathrm{s^{-1}}$. It is not negligible. A $1\,\mathrm{km}$ position error across the beam produces about $0.011 \times 1000 = 11\,\mathrm{m/s}$ of range-rate residual. A filter whose Doppler noise is around a metre per second will act on that strongly. Leave the block out and the filter blames that residual on velocity instead.
:::

::: warning The forgotten denominator
The classic error in the range-rate Jacobian is to differentiate only the top of $\Delta\mathbf{r}\cdot\Delta\mathbf{v}/\rho$ with respect to position and forget that the $\rho$ underneath depends on $\mathbf{r}$ too. The missing term is $-\dot\rho\,\hat{\mathbf{u}}^\top/\rho$. Every piece of such a filter unit-tests clean, and the filter still drifts.
:::

### An angle measurement

Cameras and star trackers report angles, not distances. In a flat plane, a sensor at the origin that sees a target at $(x, y)$ measures the **bearing** $\theta = \operatorname{atan2}(y, x)$ — the [[two-argument arctangent|atan2-bridge]] from the trigonometry module. Its partial derivatives are

$$
\frac{\partial\theta}{\partial x} = \frac{-y}{x^2 + y^2}, \qquad \frac{\partial\theta}{\partial y} = \frac{x}{x^2 + y^2}, \qquad \frac{\partial\theta}{\partial (x, y)} = \frac{1}{\rho}\left[-\sin\theta,\ \cos\theta\right].
$$

The last form uses $x = \rho\cos\theta$, $y = \rho\sin\theta$ and $x^2 + y^2 = \rho^2$. It is a row of length $1/\rho$ pointing *across* the line of sight. So angles see exactly the moves that range cannot, and their sensitivity fades with distance: the same sideways step turns the line of sight less when the target is far away.

Numbers: for a target at $(3000, 4000)\,\mathrm{m}$, $\rho = 5000\,\mathrm{m}$ and $\theta = 53.13^\circ$. Then $\partial\theta/\partial x = -4000/(2.5 \times 10^7) = -1.6 \times 10^{-4}\,\mathrm{rad/m}$. Move the target $100\,\mathrm{m}$ in $x$ and the bearing changes by about $-0.016\,\mathrm{rad} = -0.917^\circ$ by the linear rule. The exact change is $-0.906^\circ$. Close, with the small gap from curvature, as Lesson 1 predicts.

## The Jacobian of the dynamics

Two-body gravity is $\mathbf{a}(\mathbf{r}) = -\mu\,\mathbf{r}/r^3$ (Lesson 2). To linearize the equations of motion, you need $\partial\mathbf{a}/\partial\mathbf{r}$: how each of the three acceleration numbers responds to each of the three position numbers. That is a $3 \times 3$ matrix.

Write $\mathbf{a} = g(\mathbf{r})\,\mathbf{r}$, where $g = -\mu r^{-3}$ is a scalar field. Entry $(i, j)$ is the partial of $g\,x_i$ with respect to $x_j$. By the product rule, that is $g$ times $\partial x_i/\partial x_j$, plus $x_i$ times $\partial g/\partial x_j$. The first piece is $g$ when $i = j$ and zero otherwise — the identity matrix $\mathbf{I}$ times $g$. The second piece is the column $\mathbf{r}$ times the row $(\nabla g)^\top$:

$$
\frac{\partial}{\partial\mathbf{r}}\big(g\,\mathbf{r}\big) = g\,\mathbf{I} + \mathbf{r}\,(\nabla g)^\top .
$$

From Lesson 2, $\nabla(r^{-3}) = -3\mathbf{r}/r^5$, so $\nabla g = -\mu\,\nabla(r^{-3}) = 3\mu\,\mathbf{r}/r^5$. Substitute:

$$
\mathbf{G} = \frac{\partial\mathbf{a}}{\partial\mathbf{r}} = -\frac{\mu}{r^3}\mathbf{I} + \frac{3\mu}{r^5}\,\mathbf{r}\mathbf{r}^\top = \frac{\mu}{r^3}\left(3\,\hat{\mathbf{r}}\hat{\mathbf{r}}^\top - \mathbf{I}\right).
$$

The last step pulled out $\mu/r^3$ and used $\mathbf{r}\mathbf{r}^\top/r^2 = \hat{\mathbf{r}}\hat{\mathbf{r}}^\top$.

This is the **gravity-gradient matrix**. It is symmetric. Its **trace** (the sum of its diagonal entries) is $(\mu/r^3)(3 - 3) = 0$, because $\hat{\mathbf{r}}\hat{\mathbf{r}}^\top$ has trace $\lVert\hat{\mathbf{r}}\rVert^2 = 1$ and $\mathbf{I}$ has trace $3$.

What it does to a small displacement is worth picturing:

- **Radial** (straight up): $\mathbf{G}$ gives $+2\mu/r^3$ times the displacement. Move outward and gravity weakens, so relative to where you were, you are pulled *further* outward.
- **Sideways** (across the radius): $\mathbf{G}$ gives $-\mu/r^3$ times the displacement. All the pulls point at Earth's center, so two side-by-side points are pulled toward each other.

These are **[[tidal accelerations|tidal-picture]]**. Since velocity does not appear in $\mathbf{a}$, and $\dot{\mathbf{r}} = \mathbf{v}$ exactly, the full $6 \times 6$ dynamics Jacobian is

$$
\mathbf{F} = \frac{\partial}{\partial \mathbf{x}}\begin{bmatrix} \mathbf{v} \\ \mathbf{a}(\mathbf{r}) \end{bmatrix} = \begin{bmatrix} \mathbf{0} & \mathbf{I} \\ \mathbf{G} & \mathbf{0} \end{bmatrix} .
$$

Read it block by block. The top row says "position changes at the rate $\mathbf{v}$": a $1$ for each velocity number and nothing from position. The bottom row says "velocity changes by gravity, which depends on position only".

::: example Tidal accelerations at 400 km
Take $\mathbf{r} = (6778.137, 0, 0)\,\mathrm{km}$, a point $400\,\mathrm{km}$ above the equator. Then $\hat{\mathbf{r}} = (1, 0, 0)$, and in SI units

$$
\frac{\mu}{r^3} = \frac{3.986 \times 10^{14}}{(6.778137 \times 10^6)^3} = 1.280 \times 10^{-6}\,\mathrm{s^{-2}} .
$$

With $\hat{\mathbf{r}}\hat{\mathbf{r}}^\top$ having a single $1$ in the top-left corner, $3\hat{\mathbf{r}}\hat{\mathbf{r}}^\top - \mathbf{I}$ has diagonal $3 - 1 = 2$, then $-1$, $-1$:

$$
\mathbf{G} = 1.280 \times 10^{-6}\begin{bmatrix} 2 & 0 & 0 \\ 0 & -1 & 0 \\ 0 & 0 & -1 \end{bmatrix}\,\mathrm{s^{-2}} .
$$

Now picture a $100\,\mathrm{m}$ tether hanging straight down from a spacecraft. Its two ends feel different gravity. The difference is $2 \times 1.280 \times 10^{-6} \times 100 = 2.56 \times 10^{-4}\,\mathrm{m/s^2}$, pulling them apart. Lay the same tether across the orbit instead and its ends are squeezed together at half that rate, $1.28 \times 10^{-4}\,\mathrm{m/s^2}$. Tiny, but it never stops, and it is enough to keep a long tether — or a whole satellite — [[pointing along the vertical|gravity-gradient-stabilization]].

Sanity check: a central difference on $\mathbf{a}(\mathbf{r})$ with a $1\,\mathrm{m}$ step reproduces these entries to nine digits.
:::

## Validating a Jacobian numerically

Every column of a Jacobian is a partial derivative along one input axis. So Lesson 1's central difference applies one column at a time: nudge input $j$ up and down, and see how every output moves.

$$
\mathbf{J}_{:,j} \approx \frac{\mathbf{f}(\mathbf{x} + h\mathbf{e}_j) - \mathbf{f}(\mathbf{x} - h\mathbf{e}_j)}{2h} .
$$

(Read $\mathbf{J}_{:,j}$ as "all of column $j$".) For positions in kilometres, a step of $h = 10^{-4}\,\mathrm{km}$ works well, as Lesson 1 showed. Compare entry by entry with a relative tolerance near $10^{-6}$, plus a small absolute tolerance for entries that should be zero.

Do this in a test, never in the flight code. A finite-difference Jacobian costs $2n$ extra function evaluations every time, and it carries the round-off noise you met in Lesson 1.

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

The printed row matches $\hat{\mathbf{u}}^\top$ from the worked example, to the eight decimals shown.

::: warning Rows are outputs, columns are inputs
A $2 \times 6$ measurement Jacobian times a $6 \times 1$ state error gives a $2 \times 1$ residual. If you build the transpose out of habit, the product $\mathbf{H}\,\delta\mathbf{x}$ is not even defined, and the error gets caught. But the product $\mathbf{H}\mathbf{P}\mathbf{H}^\top$ inside a filter may silently come out the wrong shape in a language that **[[broadcasts|broadcasting]]** — stretches arrays to make mismatched shapes fit. Check shapes explicitly.
:::

::: note Why range-only tracking still finds velocity
A range measurement has $\partial\rho/\partial\mathbf{v} = \mathbf{0}^\top$, yet tracking by range alone does pin down velocity. The information arrives through the dynamics. A velocity error today becomes a position error tomorrow, and the $\mathbf{F}$ matrix carries it into the range row of later measurements. Whether a state can be found — its **[[observability|observability]]** — is a property of $\mathbf{H}$ and $\mathbf{F}$ together over time, not of one row at one instant.
:::

## Check yourself

::: check
Write the Jacobian of $\mathbf{f}(x, y) = [x^2 y,\ \sin x + y]^\top$ and use it to estimate $\mathbf{f}(1.1, 2.05)$ from $\mathbf{f}(1, 2)$.
:::

::: answer
Row 1 differentiates $x^2 y$: $[2xy,\ x^2]$. Row 2 differentiates $\sin x + y$: $[\cos x,\ 1]$. So $\mathbf{J} = [[2xy,\ x^2],[\cos x,\ 1]]$, which at $(1, 2)$ is $[[4, 1],[0.5403, 1]]$.

The move is $\delta\mathbf{x} = [0.1, 0.05]^\top$. Then $\mathbf{J}\delta\mathbf{x} = [4 \times 0.1 + 1 \times 0.05,\ 0.5403 \times 0.1 + 1 \times 0.05]^\top = [0.45, 0.1040]^\top$. Since $\mathbf{f}(1, 2) = [2, 2.8415]^\top$, the estimate is $[2.45, 2.9455]^\top$.

The exact value is $[2.4805, 2.9412]^\top$. The $x^2 y$ output bends more, so its estimate has the larger error.
:::

::: check
A station measures a satellite directly overhead, with zero relative velocity. What is $\partial\dot\rho/\partial\mathbf{r}$, and what does it mean physically?
:::

::: answer
With $\Delta\mathbf{v} = \mathbf{0}$, the range-rate is $\dot\rho = 0$, so $\partial\dot\rho/\partial\mathbf{r} = (\Delta\mathbf{v} - \dot\rho\hat{\mathbf{u}})^\top/\rho = \mathbf{0}^\top$.

Physically: a small position error changes the range-rate only by turning the line of sight so that some across-the-beam velocity leaks in. Here there is no velocity to leak. The velocity partial is still $\hat{\mathbf{u}}^\top$, though: the Doppler would notice any along-the-beam velocity at once.
:::

::: check
Why is the range row of $\mathbf{H}$ free of units, while the range-rate row has entries in $\mathrm{s^{-1}}$ in its position block and unit-free entries in its velocity block?
:::

::: answer
Each entry has the units of its output divided by the units of its input.

- Range over position: $\mathrm{km/km}$, no units.
- Range-rate over position: $(\mathrm{km/s})/\mathrm{km} = \mathrm{s^{-1}}$.
- Range-rate over velocity: $(\mathrm{km/s})/(\mathrm{km/s})$, no units.

Reading the units off a Jacobian is a fast check that you differentiated with respect to the right thing.
:::

::: check
Show that the gravity-gradient matrix $\mathbf{G} = (\mu/r^3)(3\hat{\mathbf{r}}\hat{\mathbf{r}}^\top - \mathbf{I})$ has eigenvalues $2\mu/r^3$, $-\mu/r^3$, $-\mu/r^3$.
:::

::: answer
An eigenvector is an arrow the matrix only stretches, and the eigenvalue is the stretch factor.

**Radial.** $\mathbf{G}\hat{\mathbf{r}} = (\mu/r^3)(3\hat{\mathbf{r}}(\hat{\mathbf{r}}^\top\hat{\mathbf{r}}) - \hat{\mathbf{r}})$. Since $\hat{\mathbf{r}}^\top\hat{\mathbf{r}} = 1$, this is $(\mu/r^3)(3 - 1)\hat{\mathbf{r}} = (2\mu/r^3)\hat{\mathbf{r}}$.

**Sideways.** For any $\mathbf{t}$ at right angles to $\hat{\mathbf{r}}$, $\hat{\mathbf{r}}^\top\mathbf{t} = 0$, so the first term vanishes and $\mathbf{G}\mathbf{t} = -(\mu/r^3)\mathbf{t}$. Such $\mathbf{t}$ fill a whole plane, which supplies two independent eigenvectors.

Check: the eigenvalues add to the trace, $2 - 1 - 1 = 0$, matching the trace found in the lesson.
:::

::: check
Your hand-derived Jacobian and a central-difference Jacobian with $h = 10^{-4}\,\mathrm{km}$ agree to $10^{-9}$ in every entry except one, which differs by $3\%$. Which is wrong, and how would you find the bug?
:::

::: answer
The hand-derived one. Finite differences behave the same way in every entry: if the step is good for five entries, it is good for the sixth. A $3\%$ gap in a single entry is the fingerprint of a missing or wrong-signed term in one partial derivative. Find that entry's row (which output) and column (which input), and re-derive that one partial by hand. Look especially for a product-rule term through a denominator such as $\rho$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $(\mathbf{J}_{\mathbf{f}})_{ij} = \partial f_i/\partial x_j$ | Jacobian, $m \times n$: rows are outputs, columns are inputs |
| $\mathbf{f}(\mathbf{x} + \delta\mathbf{x}) \approx \mathbf{f}(\mathbf{x}) + \mathbf{J}_{\mathbf{f}}\delta\mathbf{x}$ | linearization of a vector function |
| $\partial(\mathbf{x}^\top\mathbf{x})/\partial\mathbf{x} = 2\mathbf{x}^\top$, $\partial(\mathbf{a}^\top\mathbf{x})/\partial\mathbf{x} = \mathbf{a}^\top$ | scalar-by-vector derivatives as rows |
| $\det\mathbf{J} = r$ (polar), $r^2\sin\theta$ (spherical) | area and volume stretch factors |
| $\partial\rho/\partial\mathbf{r} = \Delta\mathbf{r}^\top/\rho = \hat{\mathbf{u}}^\top$, $\partial\rho/\partial\mathbf{v} = \mathbf{0}^\top$ | range row of $\mathbf{H}$ |
| $\partial\dot\rho/\partial\mathbf{v} = \hat{\mathbf{u}}^\top$, $\partial\dot\rho/\partial\mathbf{r} = (\Delta\mathbf{v} - \dot\rho\hat{\mathbf{u}})^\top/\rho$ | range-rate row of $\mathbf{H}$ |
| $\mathbf{G} = \partial\mathbf{a}/\partial\mathbf{r} = (\mu/r^3)(3\hat{\mathbf{r}}\hat{\mathbf{r}}^\top - \mathbf{I})$ | gravity gradient; eigenvalues $2\mu/r^3, -\mu/r^3, -\mu/r^3$ |
| $\mathbf{F} = [[\mathbf{0}, \mathbf{I}], [\mathbf{G}, \mathbf{0}]]$ | dynamics Jacobian of the two-body problem |
| $\mathbf{J}_{:,j} \approx [\mathbf{f}(\mathbf{x} + h\mathbf{e}_j) - \mathbf{f}(\mathbf{x} - h\mathbf{e}_j)]/2h$ | central-difference validation, column by column |

The next lesson takes the Jacobian of a gradient — the Hessian — and uses it to decide whether a point where the gradient vanishes is a minimum, a maximum or a saddle. It also shows that the Jacobian of a chain of functions is the product of their Jacobians.

::: context ekf The filter that flew to the Moon
Rudolf Kálmán published his filter in 1960 for systems described by straight-line (linear) equations. Spacecraft motion and radar measurements are not linear. Engineers at NASA's Ames Research Center, led by Stanley Schmidt, adapted the filter for Apollo navigation by linearizing around the current estimate at every step — using exactly the Jacobians of this lesson. That approach is what is now called the extended Kalman filter, and versions of it still navigate most spacecraft.
:::

::: context jacobi-name Who Jacobi was
Carl Gustav Jacob Jacobi (1804–1851) was a German mathematician who worked on mechanics, number theory and the motion of planets. In 1841 he published a long study of "functional determinants" — the determinants of tables of partial derivatives. Both the matrix and its determinant now carry his name; many engineers say "the Jacobian" for either one, so check which is meant.
:::

::: context polar-columns The two columns, drawn
At $r = 2$, $\theta = 30^\circ$: the first column (blue) points straight out with length $1$; the second (red) points around the circle with length $r = 2$. They are at right angles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="pcb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="pcr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
  </defs>
  <line x1="60" y1="180" x2="300" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="180" x2="60" y2="10" stroke="#6c7a93" stroke-width="1"/>
  <path d="M180,180 A120,120 0 0,0 91.1,64.1" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="60" y1="180" x2="163.9" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="163.9" y1="120" x2="215.9" y2="90" stroke="#1d6fd1" stroke-width="3" marker-end="url(#pcb)"/>
  <line x1="163.9" y1="120" x2="103.9" y2="16.1" stroke="#b4232c" stroke-width="3" marker-end="url(#pcr)"/>
  <circle cx="163.9" cy="120" r="4" fill="#1f2a44"/>
  <text x="100" y="140" font-size="12" fill="#1f2a44">r = 2</text>
  <text x="222" y="92" font-size="12" fill="#1d6fd1">∂(x, y)/∂r</text>
  <text x="222" y="108" font-size="12" fill="#1d6fd1">length 1</text>
  <text x="112" y="24" font-size="12" fill="#b4232c">∂(x, y)/∂θ, length r = 2</text>
  <text x="196" y="170" font-size="11" fill="#6c7a93">circle of radius 2</text>
</svg>
```

A small turn $d\theta$ slides the point along the red arrow; a small $dr$ slides it along the blue one.
:::

::: context determinant-area Why the determinant measures area
Nudge $r$ by $dr$ and $\theta$ by $d\theta$. The point sweeps out a tiny patch whose edges are the two Jacobian columns scaled by $dr$ and $d\theta$: an outward edge of length $dr$ and a sideways edge of length $r\,d\theta$. They are at right angles, so the patch is a little rectangle of area $r\,dr\,d\theta$. The determinant, $r$, is exactly that stretch factor. For any map, the absolute value of the Jacobian's determinant is the area (or volume) of the little patch the columns span.
:::

::: context doppler Doppler shift
A passing ambulance's siren sounds higher as it comes toward you and lower as it drives away. Radio waves do the same. A transmitter moving away at range-rate $\dot\rho$ arrives lowered in frequency by about $f\,\dot\rho/c$, with $c$ the speed of light. At a typical S-band frequency of $2.2\,\mathrm{GHz}$ and the $1.56\,\mathrm{km/s}$ of this lesson's example, that is about $11.4\,\mathrm{kHz}$ — easy to measure very precisely, which is why Doppler tracking is so accurate.
:::

::: context h-picture The shape of H
Rows are the two measurements; columns are the six state numbers. Blue blocks hold the unit line of sight; the red block is the small across-the-beam term; grey blocks are zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="85" y="28">x</text><text x="125" y="28">y</text><text x="165" y="28">z</text>
    <text x="205" y="28">vx</text><text x="245" y="28">vy</text><text x="285" y="28">vz</text>
  </g>
  <rect x="65" y="40" width="120" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="185" y="40" width="120" height="40" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="65" y="80" width="120" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="185" y="80" width="120" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="125" y="64">ûᵀ</text><text x="245" y="64">0</text>
    <text x="125" y="104">(Δv − ρ̇ û)ᵀ/ρ</text><text x="245" y="104">ûᵀ</text>
  </g>
  <text x="55" y="64" font-size="12" fill="#1f2a44" text-anchor="end">ρ</text>
  <text x="55" y="104" font-size="12" fill="#1f2a44" text-anchor="end">ρ̇</text>
  <text x="125" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">position columns</text>
  <text x="245" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">velocity columns</text>
  <text x="125" y="160" font-size="11" fill="#b4232c" text-anchor="middle">bottom block in 1/s</text>
</svg>
```

The pattern is easy to remember: the line of sight appears twice, on the diagonal of the blocks.
:::

::: context atan2-bridge Back to atan2
The trigonometry module introduced $\operatorname{atan2}(y, x)$, the arctangent that looks at the signs of $x$ and $y$ separately so that it returns the right angle in all four quadrants. Its partial derivatives are the same as those of plain $\arctan(y/x)$ wherever both are defined, which is why the formulas here hold in every quadrant.
:::

::: context tidal-picture Stretched along, squeezed across
A small cloud of points near a satellite, seen relative to its center. Earth is off to the left. Gravity stretches the cloud along the radius (twice as strongly) and squeezes it across.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs><marker id="tpa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker></defs>
  <circle cx="30" cy="100" r="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="30" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">Earth</text>
  <line x1="52" y1="100" x2="330" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <circle cx="230" cy="100" r="40" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="230" cy="100" r="4" fill="#1f2a44"/>
  <g stroke="#b4232c" stroke-width="3" marker-end="url(#tpa)">
    <line x1="270" y1="100" x2="310" y2="100"/>
    <line x1="190" y1="100" x2="150" y2="100"/>
    <line x1="230" y1="60" x2="230" y2="80"/>
    <line x1="230" y1="140" x2="230" y2="120"/>
  </g>
  <text x="292" y="88" font-size="12" fill="#b4232c" text-anchor="middle">+2</text>
  <text x="168" y="88" font-size="12" fill="#b4232c" text-anchor="middle">+2</text>
  <text x="246" y="74" font-size="12" fill="#b4232c">−1</text>
  <text x="246" y="134" font-size="12" fill="#b4232c">−1</text>
  <text x="230" y="185" font-size="11" fill="#1f2a44" text-anchor="middle">arrows in units of (μ/r³) × distance</text>
</svg>
```

The same pattern, from the Moon's gravity across the Earth, raises the two ocean bulges that give most places two high tides a day.
:::

::: context gravity-gradient-stabilization Satellites that hang straight
Because a long body is stretched along the vertical, gravity gently turns it until its long axis points at Earth. Some satellites use this on purpose: a long boom with a weight at the end keeps them pointing downward with no fuel at all. NASA's Long Duration Exposure Facility, a bus-sized rack of experiments that orbited from 1984 to 1990, held its attitude this way.
:::

::: context broadcasting Broadcasting
NumPy and similar libraries let you combine arrays of different shapes by stretching the smaller one: adding a length-3 row to a $3 \times 3$ matrix adds it to every row. That is handy, but it means a wrongly shaped matrix can produce an answer of plausible size instead of an error. A single `assert H.shape == (2, 6)` in your code costs nothing and catches it.
:::

::: context observability Where observability comes back
Later in the course, the estimation module asks a precise question: from a sequence of measurements, can the whole state be worked out? The test stacks $\mathbf{H}$, $\mathbf{H}$ times the dynamics, $\mathbf{H}$ times the dynamics twice, and so on, and checks whether the stack has enough independent rows. The Jacobians of this lesson are the raw material for that test.
:::
