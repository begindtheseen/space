---
id: l04-chain-rule-hessian
title: The chain rule for vector functions, and the Hessian
minutes: 24
covers:
  - chain rule for vector functions
  - Jacobian and Hessian
---

Picture three gears in a row. Turn the first gear once and the second turns three times. Each turn of the second makes the third turn twice. So one turn of the first gear makes the third turn $3 \times 2 = 6$ times. When one thing drives another, which drives a third, the rates **multiply**. That is the chain rule, and this lesson is about what it looks like when every gear has many inputs and many outputs.

Almost every function in a guidance, navigation and control (GNC) system is a chain like that. A radar measurement depends on the satellite's position, which depends on time. A landing cost depends on the final state, which depends on the thrust commands. In several variables the answer fits in one sentence: **the Jacobian of a chain is the product of the Jacobians**.

The second half meets the **Hessian**, the table of second derivatives that Lesson 3 put off. The gradient tells you which way is downhill; the Hessian tells you the *shape* of the ground — bowl, dome or saddle. It tells an optimizer whether its flat spot is really a minimum, and it drives Newton's method.

## Rates along a moving point

Walk across a hillside. Each slope (east, north) times your speed in that direction gives a rate of climb, and the rates add.

Lesson 2 wrote this down for a scalar field $f$ of $n$ inputs, evaluated at a moving point $\mathbf{x}(t)$:

$$
\frac{d}{dt} f(\mathbf{x}(t)) = \nabla f \cdot \dot{\mathbf{x}} = \sum_{j=1}^{n} \frac{\partial f}{\partial x_j}\,\dot{x}_j .
$$

Read $\nabla f$ as "grad f" (the symbol $\nabla$ is called "del" or "nabla"), and $\dot{x}_j$ as "x j dot", the rate of change of $x_j$ with time. Each input moves at its own rate $\dot{x}_j$ and contributes that rate times its sensitivity $\partial f/\partial x_j$. The contributions add. Three results come straight out of this.

**Range-rate.** Let the **range** $\rho$ (Greek "rho") be the distance from a ground station fixed at $\mathbf{r}_s$ to a satellite at $\mathbf{r}$: $\rho = \lVert \mathbf{r} - \mathbf{r}_s \rVert$. Lesson 2 found $\nabla\rho = \hat{\mathbf{u}}$, the unit vector along the line of sight. So

$$
\dot\rho = \nabla\rho \cdot \dot{\mathbf{r}} = \hat{\mathbf{u}} \cdot \mathbf{v} = \frac{(\mathbf{r} - \mathbf{r}_s)\cdot\mathbf{v}}{\rho}.
$$

That is the range-rate formula of Lesson 3. It also explains why a **[[Doppler radar|doppler]]** sees only the line-of-sight part of the velocity: the gradient of range is a unit vector along the line of sight, and the dot product keeps only the part of $\mathbf{v}$ that points along it.

**Speed.** The speed $v = \lVert \mathbf{v} \rVert$ is the same "length" function applied to the velocity, so $\dot v = \hat{\mathbf{v}} \cdot \mathbf{a}$. Only the part of the acceleration along the velocity changes the speed; the sideways part turns it (Lesson 5's curvature).

**Specific energy.** The **specific energy** — energy per kilogram — of an orbiting body is $\varepsilon(\mathbf{r}, \mathbf{v}) = \tfrac{1}{2}\mathbf{v}\cdot\mathbf{v} - \mu/r$, where $\mu$ ("mu") is Earth's gravitational parameter. Its gradient with respect to $\mathbf{v}$ is $\mathbf{v}$. Its gradient with respect to $\mathbf{r}$ is $-\mu\nabla(1/r) = \mu\mathbf{r}/r^3$. Along a trajectory, $\dot{\mathbf{r}} = \mathbf{v}$ and $\dot{\mathbf{v}} = \mathbf{a}$, so the chain rule gives

$$
\dot\varepsilon = \mathbf{v}\cdot\mathbf{a} + \frac{\mu\,\mathbf{r}}{r^3}\cdot\mathbf{v} = \mathbf{v}\cdot\left(\mathbf{a} + \frac{\mu\,\mathbf{r}}{r^3}\right).
$$

Under two-body gravity, $\mathbf{a} = -\mu\mathbf{r}/r^3$. The bracket becomes zero, so $\dot\varepsilon = 0$: the specific energy never changes. Lesson 10 comes back to this for conservative fields.

::: example Two rates along one orbit
Use the geometry of Lesson 3: $\mathbf{r} = (7000, 100, -200)\,\mathrm{km}$, $\mathbf{v} = (0.5, 7.4, 0.1)\,\mathrm{km/s}$, station at $(6378, 0, 0)\,\mathrm{km}$.

**Range-rate.** The formula gives $\hat{\mathbf{u}}\cdot\mathbf{v} = 1.55982\,\mathrm{km/s}$. To check it, slide the satellite along its velocity $1\,\mathrm{ms}$ each way and divide the change in range by $2\,\mathrm{ms}$:

$$
\frac{\rho(10^{-3}\,\mathrm{s}) - \rho(-10^{-3}\,\mathrm{s})}{2 \times 10^{-3}\,\mathrm{s}} = 1.55982\,\mathrm{km/s}.
$$

The two agree to about eleven significant figures.

**Rate of change of speed.** The distance from Earth's center is $r = 7003.571\,\mathrm{km}$. The two-body acceleration is $\mathbf{a} = -\mu\mathbf{r}/r^3 = (-8.1223, -0.1160, 0.2321)\,\mathrm{m/s^2}$, of size $8.1264\,\mathrm{m/s^2}$. The speed is $7417.55\,\mathrm{m/s}$. So

$$
\dot v = \hat{\mathbf{v}}\cdot\mathbf{a} = \frac{\mathbf{v}\cdot\mathbf{a}}{v} = \frac{-4896.6\,\mathrm{m^2/s^3}}{7417.55\,\mathrm{m/s}} = -0.660\,\mathrm{m/s^2}.
$$

**Does it make sense?** The satellite is climbing (radial velocity $\hat{\mathbf{r}}\cdot\mathbf{v} = +602.5\,\mathrm{m/s}$), so gravity should slow it, and it does — but only by $0.66$ of the $8.13\,\mathrm{m/s^2}$. The rest bends the path.

**Energy.** The two terms of $\dot\varepsilon$ are $\mathbf{v}\cdot\mathbf{a} = -4896.6\,\mathrm{m^2/s^3}$ and $\mu\,\mathbf{r}\cdot\mathbf{v}/r^3 = +4896.6\,\mathrm{m^2/s^3}$. They cancel to the last digit, so $\dot\varepsilon = 0$ as promised.
:::

## Chains of vector functions: Jacobians multiply

Think of changing money twice: dollars to euros, then euros to yen. The dollars-to-yen rate is the product of the two rates. With many inputs and outputs at once, each "rate" becomes a table — a matrix — and multiplying rates becomes multiplying matrices.

Here is the setup. An inner function $\mathbf{g}$ takes $n$ numbers and returns $p$ numbers (written $\mathbf{g}:\mathbb{R}^n \to \mathbb{R}^p$). An outer function $\mathbf{f}$ takes those $p$ numbers and returns $m$. Chaining them gives the **[[composition|composition]]** $\mathbf{h}(\mathbf{x}) = \mathbf{f}(\mathbf{g}(\mathbf{x}))$, also written $\mathbf{f}\circ\mathbf{g}$ and read "f after g". Call the middle value $\mathbf{y} = \mathbf{g}(\mathbf{x})$, the **intermediate variable**.

Lesson 3 showed that each function acts on small nudges like its Jacobian matrix $\mathbf{J}$:

$$
\delta\mathbf{y} \approx \mathbf{J}_{\mathbf{g}}(\mathbf{x})\,\delta\mathbf{x}, \qquad \delta\mathbf{f} \approx \mathbf{J}_{\mathbf{f}}(\mathbf{y})\,\delta\mathbf{y} .
$$

(Read $\mathbf{J}_{\mathbf{g}}$ as "J sub g", and $\delta\mathbf{x}$ as "delta x", a small nudge to $\mathbf{x}$.) Put the first line into the second: $\delta\mathbf{f} \approx \mathbf{J}_{\mathbf{f}}(\mathbf{y})\,\mathbf{J}_{\mathbf{g}}(\mathbf{x})\,\delta\mathbf{x}$. Since the Jacobian *is* the best linear approximation,

$$
\mathbf{J}_{\mathbf{f}\circ\mathbf{g}}(\mathbf{x}) = \mathbf{J}_{\mathbf{f}}(\mathbf{g}(\mathbf{x}))\;\mathbf{J}_{\mathbf{g}}(\mathbf{x}), \qquad
\frac{\partial h_i}{\partial x_j} = \sum_{k=1}^{p} \frac{\partial f_i}{\partial y_k}\,\frac{\partial g_k}{\partial x_j} .
$$

The second form is the matrix product written out, summed over the middle index $k$. Each term is one *path* by which $x_j$ can push on $h_i$ — through $y_1$, through $y_2$, and so on — and every path counts.

Three things to keep straight:

- **Order.** The outer function's Jacobian goes on the left, the inner one on the right. That is the order in which the maps act on a nudge. Matrix products do not commute, so swapping them is wrong even when the shapes happen to fit.
- **Shapes.** $\mathbf{J}_{\mathbf{f}}$ is $m \times p$ and $\mathbf{J}_{\mathbf{g}}$ is $p \times n$, so the product is $m \times n$ — right for a map from $n$ numbers to $m$ numbers. The inner size $p$ is the number of intermediate variables.
- **Where to evaluate.** $\mathbf{J}_{\mathbf{f}}$ is evaluated at the intermediate point $\mathbf{g}(\mathbf{x})$, not at $\mathbf{x}$. This is the most common slip in code.

::: key
Chain rule for vector functions: if $\mathbf{h} = \mathbf{f}\circ\mathbf{g}$ then $\mathbf{J}_{\mathbf{h}} = \mathbf{J}_{\mathbf{f}}\,\mathbf{J}_{\mathbf{g}}$, outer Jacobian on the left, evaluated at the intermediate point. For a function of a moving state, $\frac{d}{dt}f(\mathbf{x}(t)) = \nabla f\cdot\dot{\mathbf{x}}$ for scalar $f$, and $\frac{d}{dt}\mathbf{f}(\mathbf{x}(t)) = \mathbf{J}_{\mathbf{f}}\,\dot{\mathbf{x}}$ for vector $\mathbf{f}$.
:::

### Three special cases you will use constantly

**A function of time through the state.** If the inner function is a path $\mathbf{x}(t)$, its Jacobian is the $n \times 1$ column $\dot{\mathbf{x}}$. The rule becomes $\frac{d}{dt}\mathbf{f}(\mathbf{x}(t)) = \mathbf{J}_{\mathbf{f}}\,\dot{\mathbf{x}}$. For a navigation filter, this says how a predicted measurement drifts between updates: $\dot{\mathbf{z}} = \mathbf{H}\,\dot{\mathbf{x}}$.

**The gradient of a chain.** If the outer function is a scalar, its Jacobian is the row $(\nabla f)^\top$ (the $\top$, read "transpose", turns a column into a row). So $\partial(f\circ\mathbf{g})/\partial\mathbf{x} = (\nabla f)^\top\mathbf{J}_{\mathbf{g}}$. Transposing back to a column,

$$
\nabla_{\mathbf{x}}(f\circ\mathbf{g}) = \mathbf{J}_{\mathbf{g}}^\top\,\nabla_{\mathbf{y}} f .
$$

The transposed Jacobian carries a gradient *backwards* through a map. That is how a cost defined on the final state of a trajectory becomes a gradient with respect to the thrust commands that produced it. It is also the one operation that **[[reverse-mode automatic differentiation|reverse-mode]]** repeats, link by link.

**Inverse functions.** If $\mathbf{g}$ can be undone, apply the rule to $\mathbf{g}^{-1}\circ\mathbf{g}$, the map that changes nothing. Its Jacobian is the identity $\mathbf{I}$, so $\mathbf{J}_{\mathbf{g}^{-1}}\,\mathbf{J}_{\mathbf{g}} = \mathbf{I}$: the Jacobian of the inverse map is the inverse of the Jacobian. The derivatives of spherical coordinates with respect to Cartesian ones are the inverse of Lesson 3's $3 \times 3$ matrix — which is where the $1/r$ and $1/(r\sin\theta)$ factors in the spherical gradient come from.

::: example Turning radar noise into position uncertainty
A tracking radar reports three numbers: range $\rho$, azimuth $\alpha$ ("alpha", the compass bearing, clockwise from north) and elevation $\epsilon$ ("epsilon", the angle above the horizon). In the station's east–north–up frame the target sits at

$$
\mathbf{p}(\rho, \alpha, \epsilon) = \rho\begin{bmatrix} \cos\epsilon\sin\alpha \\ \cos\epsilon\cos\alpha \\ \sin\epsilon \end{bmatrix},
\qquad
\mathbf{J} = \frac{\partial\mathbf{p}}{\partial(\rho,\alpha,\epsilon)} = \begin{bmatrix} \cos\epsilon\sin\alpha & \rho\cos\epsilon\cos\alpha & -\rho\sin\epsilon\sin\alpha \\ \cos\epsilon\cos\alpha & -\rho\cos\epsilon\sin\alpha & -\rho\sin\epsilon\cos\alpha \\ \sin\epsilon & 0 & \rho\cos\epsilon \end{bmatrix}.
$$

Each column says what one reading does to the position. The first column is the unit line of sight. The second has length $\rho\cos\epsilon$, because a change $d\alpha$ moves the target along a circle of that radius. The third has length $\rho$.

**Step 1: the point.** At $\rho = 1000\,\mathrm{km}$, $\alpha = 30^\circ$, $\epsilon = 45^\circ$ the position is $(353.6, 612.4, 707.1)\,\mathrm{km}$. The determinant of $\mathbf{J}$ is $-\rho^2\cos\epsilon = -7.071 \times 10^{11}\,\mathrm{m^2/rad^2}$. The minus sign comes from the order of the three readings; the volume factor of Lesson 6 is its absolute value.

**Step 2: the noise.** Say the readings have independent errors with standard deviations $\sigma_\rho = 10\,\mathrm{m}$ and $\sigma_\alpha = \sigma_\epsilon = 1\,\mathrm{mrad}$ ($\sigma$ is "sigma"). Their **[[covariance|covariance]]** matrix is $\mathbf{R} = \operatorname{diag}(100\,\mathrm{m^2},\ 10^{-6},\ 10^{-6})$.

**Step 3: push it through.** A small reading error $\delta\mathbf{z}$ becomes a position error $\delta\mathbf{p} \approx \mathbf{J}\,\delta\mathbf{z}$. Averaging $\delta\mathbf{p}\,\delta\mathbf{p}^\top$ over many errors gives

$$
\mathbf{P} = \mathbf{J}\,\mathbf{R}\,\mathbf{J}^\top =
\begin{bmatrix} 500{,}013 & 21.7 & -249{,}975 \\ 21.7 & 500{,}038 & -432{,}969 \\ -249{,}975 & -432{,}969 & 500{,}050 \end{bmatrix}\mathrm{m^2}.
$$

**Reading it.** Each position component has a standard deviation of about $\sqrt{500{,}000} \approx 707\,\mathrm{m}$. The large off-diagonal entries say the errors are strongly linked: together they describe a thin disc across the line of sight, $10\,\mathrm{m}$ thick, and about $707\,\mathrm{m}$ by $1000\,\mathrm{m}$ across ($\rho\cos\epsilon\,\sigma_\alpha$ and $\rho\,\sigma_\epsilon$).

**Check.** The trace (the sum of the diagonal) is $1.5001 \times 10^6\,\mathrm{m^2}$, exactly $\sigma_\rho^2 + (\rho\cos\epsilon\,\sigma_\alpha)^2 + (\rho\,\sigma_\epsilon)^2 = 100 + 500{,}000 + 1{,}000{,}000$. This $\mathbf{J}\mathbf{R}\mathbf{J}^\top$ shape appears in every Kalman filter update.
:::

### Functions of the distance, and the J2 exercise

The module's J2 exercise differentiates a gravity potential written using $r = \sqrt{x^2 + y^2 + z^2}$ and $z$. The chain rule keeps it in order.

For any function $\phi(r)$ ("phi of r") of the distance alone, Lesson 1's $\partial r/\partial x = x/r$ gives

$$
\frac{\partial}{\partial x}\,\phi(r) = \phi'(r)\,\frac{x}{r}, \qquad \nabla\phi(r) = \phi'(r)\,\hat{\mathbf{r}} .
$$

Now take a function $\psi(r, z)$ ("psi") that depends on $z$ in two ways: through $r$, and on its own. Then $z$ reaches $\psi$ along two paths, and both count:

$$
\frac{\partial\psi}{\partial x} = \frac{\partial\psi}{\partial r}\frac{x}{r}, \qquad
\frac{\partial\psi}{\partial z} = \frac{\partial\psi}{\partial r}\frac{z}{r} + \frac{\partial\psi}{\partial z}\bigg|_{r\ \text{fixed}} .
$$

The last term — the direct path — is the one learners drop. It gives the $z$ part of the J2 acceleration its different constant, and it is what the exercise means by "keep every chain-rule term".

::: warning Count every path
When a variable shows up more than once — $z$ inside $r$ and $z$ on its own — the chain rule adds a term for every appearance. Miss one and the answer is wrong by a whole term — with the right units, so no units check catches it.
:::

## The Hessian

Think of a marble resting in a salad bowl, on an upside-down bowl, and on a horse's saddle. In the bowl it rolls back; on the other two it rolls off. At each resting spot the slope is zero, so the slope cannot tell these apart. What tells them apart is how the slope *changes* as you move: the second derivatives.

Lesson 1 defined second partial derivatives and showed that, for smooth functions, the order does not matter: $\partial^2 f/\partial x\,\partial y = \partial^2 f/\partial y\,\partial x$. For a scalar field $f$ of $n$ inputs, collect all of them in one table, the **[[Hessian matrix|hessian-name]]**:

$$
\mathbf{H}_f = \nabla^2 f, \qquad (\mathbf{H}_f)_{ij} = \frac{\partial^2 f}{\partial x_i\,\partial x_j} .
$$

It is $n \times n$ and **symmetric** — the same when flipped across its diagonal. It is also the Jacobian of the gradient. The gradient $\nabla f$ is a vector function of $\mathbf{x}$, and its Jacobian has entries $\partial(\nabla f)_i/\partial x_j = \partial^2 f/\partial x_j\,\partial x_i$, which by symmetry is the Hessian. So it is the best linear approximation of how the gradient changes:

$$
\nabla f(\mathbf{x} + \delta\mathbf{x}) \approx \nabla f(\mathbf{x}) + \mathbf{H}_f\,\delta\mathbf{x} .
$$

**Units.** Each entry has the units of $f$ divided by two input units. A gravity potential $U$ is in $\mathrm{m^2/s^2}$; differentiate twice by position and you get $\mathrm{s^{-2}}$. That is the unit of the gravity-gradient matrix, and not by coincidence: $\mathbf{a} = -\nabla U$, so $\partial\mathbf{a}/\partial\mathbf{r} = -\nabla^2 U$. Lesson 3's matrix $\mathbf{G} = (\mu/r^3)(3\hat{\mathbf{r}}\hat{\mathbf{r}}^\top - \mathbf{I})$ is minus the Hessian of $U = -\mu/r$.

::: note One letter, three jobs
$\mathbf{H}$ means the measurement Jacobian in a filter and the Hessian in an optimizer. And $\nabla^2 f$ means the Hessian matrix here but the Laplacian, a single number, in Lesson 8. The shape tells you which: a Hessian is square and symmetric, a measurement Jacobian is $m \times n$, a Laplacian is a scalar. Check subscripts and shapes before assuming.
:::

### The second-order Taylor expansion

The tangent plane of Lesson 1 is a flat sheet laid on the surface; now add the bend. Fix a point $\mathbf{x}$ and a direction $\mathbf{d}$, and walk along the straight line through $\mathbf{x}$: $\varphi(t) = f(\mathbf{x} + t\mathbf{d})$. That is a function of one variable, so the one-variable Taylor expansion applies, and the chain rule supplies its derivatives. The velocity along the line is $\dot{\mathbf{x}} = \mathbf{d}$, so

$$
\varphi'(t) = \nabla f(\mathbf{x} + t\mathbf{d})\cdot\mathbf{d} = \mathbf{d}^\top\nabla f, \qquad
\varphi''(t) = \frac{d}{dt}\big[\mathbf{d}^\top\nabla f(\mathbf{x} + t\mathbf{d})\big] = \mathbf{d}^\top\,\mathbf{H}_f\,\mathbf{d}.
$$

The second step differentiates the vector function $\nabla f$ along the line with the chain rule: $\frac{d}{dt}\nabla f = \mathbf{J}_{\nabla f}\,\dot{\mathbf{x}} = \mathbf{H}_f\,\mathbf{d}$. Now put these into $\varphi(1) \approx \varphi(0) + \varphi'(0) + \tfrac{1}{2}\varphi''(0)$:

$$
f(\mathbf{x} + \mathbf{d}) \approx f(\mathbf{x}) + \nabla f(\mathbf{x})^\top\mathbf{d} + \tfrac{1}{2}\,\mathbf{d}^\top\mathbf{H}_f(\mathbf{x})\,\mathbf{d} .
$$

The third term is a **quadratic form** — step, times matrix, times step again — and it carries all the curvature. For a step $\mathbf{d}$ of unit length, $\mathbf{d}^\top\mathbf{H}_f\mathbf{d}$ is the second derivative of $f$ along that line.

::: example A quadratic approximation with numbers
Take $f(x, y) = xy + e^{-x} + \tfrac{1}{2}y^2$ at the point $(1, 2)$, where $f = 4.36788$.

**Derivatives.** The gradient is $\nabla f = [y - e^{-x},\ x + y]^\top = [1.63212,\ 3]^\top$. Differentiating again,

$$
\mathbf{H}_f = \begin{bmatrix} e^{-x} & 1 \\ 1 & 1 \end{bmatrix} = \begin{bmatrix} 0.36788 & 1 \\ 1 & 1 \end{bmatrix}.
$$

**The step** is $\mathbf{d} = [0.2, -0.1]^\top$.

- Linear term: $1.63212 \times 0.2 + 3 \times (-0.1) = 0.026424$.
- Quadratic term: $\tfrac{1}{2}(0.36788 \times 0.04 + 2 \times 1 \times 0.2 \times (-0.1) + 1 \times 0.01) = \tfrac{1}{2}(-0.015285) = -0.0076424$.

**Estimates.** The tangent plane predicts $4.36788 + 0.02642 = 4.39430$. Adding the quadratic term gives $4.38666$. The exact value is $f(1.2, 1.9) = 4.38619$.

**Errors.** The linear estimate is off by $8.1 \times 10^{-3}$. The quadratic one is off by $4.7 \times 10^{-4}$ — about seventeen times smaller, and now shrinking like the step cubed.

**Shape.** The Hessian's determinant is $0.36788 - 1 = -0.632 < 0$, so this Hessian is **indefinite**: at this point $f$ curves up along some directions and down along others.
:::

### Classifying stationary points

A point where $\nabla f = \mathbf{0}$ is a **stationary point** — the marble's resting spot. There the quadratic term decides the shape:

$$
f(\mathbf{x}^\star + \mathbf{d}) - f(\mathbf{x}^\star) \approx \tfrac{1}{2}\,\mathbf{d}^\top\mathbf{H}_f\,\mathbf{d} .
$$

($\mathbf{x}^\star$, "x star", is the stationary point.) Because $\mathbf{H}_f$ is symmetric, the spectral theorem from the linear algebra modules gives it real **eigenvalues** $\lambda_i$ ("lambda") and perpendicular eigenvectors. The eigenvectors are the surface's own natural directions, and each eigenvalue is the curvature along one of them:

$$
\mathbf{d}^\top\mathbf{H}_f\mathbf{d} = \sum_i \lambda_i\,(\text{component of } \mathbf{d} \text{ along eigenvector } i)^2 .
$$

So the signs of the eigenvalues give the shape:

- all positive: $\mathbf{H}_f \succ 0$, read "H is **positive definite**". $f$ rises in every direction — a **strict local minimum** (the bowl);
- all negative: $\mathbf{H}_f \prec 0$ — a strict local maximum (the upside-down bowl);
- some of each sign (**indefinite**): $f$ falls along some directions and rises along others — a **[[saddle|saddle]]**;
- some eigenvalue zero: the second-order test says nothing, and higher derivatives decide.

For two variables there is a shortcut: the determinant is the product of the eigenvalues, so it is positive when they share a sign. So $\det\mathbf{H}_f > 0$ with $\partial^2 f/\partial x^2 > 0$ means a minimum; $\det > 0$ with $\partial^2 f/\partial x^2 < 0$ means a maximum; and $\det < 0$ means a saddle.

::: key
The Hessian is $(\mathbf{H}_f)_{ij} = \partial^2 f/\partial x_i\,\partial x_j$, symmetric, and equal to the Jacobian of $\nabla f$. At a point where $\nabla f = \mathbf{0}$, $\mathbf{H}_f \succ 0$ (positive definite) certifies a strict local minimum, $\mathbf{H}_f \prec 0$ a strict local maximum, and an indefinite $\mathbf{H}_f$ means a saddle.
:::

Gravity gives a real example. The Hessian of the two-body potential is $\nabla^2 U = -\mathbf{G} = (\mu/r^3)(\mathbf{I} - 3\hat{\mathbf{r}}\hat{\mathbf{r}}^\top)$. Its eigenvalues are $-2\mu/r^3$ along the radial direction and $+\mu/r^3$ along the two sideways directions. At $400\,\mathrm{km}$ altitude these are $-2.56 \times 10^{-6}$ and $+1.28 \times 10^{-6}\,\mathrm{s^{-2}}$. It is indefinite everywhere, and its trace is $-2 + 1 + 1 = 0$ times $\mu/r^3$. The indefiniteness says the potential has no minimum in empty space: **[[no arrangement of fixed masses|earnshaw]]** can hold a test body at rest in stable balance by gravity alone. The zero trace is Laplace's equation, which Lesson 8 states in general.

### Newton's method

Lesson 2 minimized $f(x, y) = (x - 1)^2 + 4(y + 2)^2$ by gradient descent and watched it zigzag. The Hessian explains the zigzag and removes it.

The idea: near $\mathbf{x}_k$ (the $k$-th guess), replace $f$ by its quadratic model and jump to the model's bottom, where its gradient is zero: $\nabla f(\mathbf{x}_k) + \mathbf{H}_f\,\mathbf{d} = \mathbf{0}$. Solving for the step $\mathbf{d}$,

$$
\mathbf{x}_{k+1} = \mathbf{x}_k - \mathbf{H}_f(\mathbf{x}_k)^{-1}\,\nabla f(\mathbf{x}_k) .
$$

This is **Newton's method**. In the example the Hessian is $\operatorname{diag}(2, 8)$ everywhere (a matrix with $2$ and $8$ on the diagonal and zeros elsewhere). From the origin, $\nabla f = [-2, 16]^\top$, so the Newton step is $-\operatorname{diag}(1/2, 1/8)[-2, 16]^\top = [1, -2]^\top$. That lands exactly on the minimum $(1, -2)$ in one step.

Gradient descent zigzagged because the eigenvalues $2$ and $8$ differ fourfold: the gradient overweights the steep $y$ direction, while $\mathbf{H}_f^{-1}$ rescales each direction by its own curvature. On a function that is not exactly quadratic, Newton's method **[[converges quadratically|quadratic-convergence]]** once it is near a minimum. It is the core of every least-squares orbit fit — where the Hessian is approximated by $\mathbf{J}^\top\mathbf{J}$, the Gauss–Newton method — and of the interior-point solvers behind convex landing guidance.

::: warning Newton finds flat spots, not bottoms
Newton's method heads for any stationary point. If the Hessian at $\mathbf{x}_k$ is indefinite, the step can go uphill toward a saddle. Practical optimizers check that the Hessian is positive definite — or adjust it until it is — before trusting the step. Checking the Hessian at the answer is the test that it is a minimum at all.
:::

## Reading the Hessian at a constrained solution

Real trajectory problems come with rules: reach this target, stay under this pressure limit, never exceed this thrust. Think of finding the lowest point of a hillside while staying on a hiking trail. The lowest point *on the trail* is usually not the valley floor.

Write equality rules as $\mathbf{c}(\mathbf{x}) = \mathbf{0}$. The first-order conditions use the **Lagrangian** $\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}) = f(\mathbf{x}) + \boldsymbol{\lambda}^\top\mathbf{c}(\mathbf{x})$, where $\boldsymbol{\lambda}$ is a vector of **[[Lagrange multipliers|multipliers]]**. At a solution, $\nabla f + \mathbf{J}_{\mathbf{c}}^\top\boldsymbol{\lambda} = \mathbf{0}$. In words: the cost's gradient is a mix of the constraint gradients, so no downhill direction stays on the trail. These conditions, plus feasibility and the sign rules for inequality multipliers, are the **Karush–Kuhn–Tucker (KKT) conditions**. They are necessary, not sufficient — they find flat spots, like Newton's method.

The second-order question is: does the cost curve upward in every direction you are still allowed to move? The allowed directions are those tangent to the active constraints, $\mathbf{J}_{\mathbf{c}}\,\mathbf{d} = \mathbf{0}$. The curvature that matters is that of the Lagrangian, not of $f$ alone, because a curved trail changes $f$ through its own bend too. The **second-order sufficient condition** is

$$
\mathbf{d}^\top\,\nabla^2_{\mathbf{x}\mathbf{x}}\mathcal{L}\,\mathbf{d} > 0 \quad\text{for every } \mathbf{d} \neq \mathbf{0} \text{ with } \mathbf{J}_{\mathbf{c}}\mathbf{d} = \mathbf{0}.
$$

In words: the Hessian of the Lagrangian is positive definite on the tangent space of the active constraints. (That restricted matrix is the **reduced Hessian**.) When this holds along with the KKT conditions, the point is a strict local minimizer.

Two limits matter. It need not hold in directions that leave the constraint surface. And it says nothing about other regions: a problem that is not convex may have several local minima, each certified by its own reduced Hessian. Only **[[convexity|convexity]]** of the whole problem — or an exhaustive global search — turns a local certificate into a global one. That is the practical case for convex landing guidance: a convex problem has one minimum, so the local certificate is the global answer, and the solver can be trusted to find it in bounded time on a flight computer.

::: key
At a KKT point, positive definiteness of the Hessian of the Lagrangian on the tangent space of the active constraints is the second-order sufficient condition for a strict local minimum. It certifies local optimality only; global optimality needs convexity or a global method.
:::

## Check yourself

::: check
Let $\mathbf{g}(x, y) = [x^2 - y,\ 2xy]^\top$ and $f(u, v) = u\,v$. Find $\nabla_{(x,y)}(f\circ\mathbf{g})$ at $(1, 1)$ by the chain rule. Then check by substituting first and differentiating.
:::

::: answer
**Inner Jacobian.** $\mathbf{J}_{\mathbf{g}} = \begin{bmatrix} 2x & -1 \\ 2y & 2x \end{bmatrix}$, which at $(1, 1)$ is $\begin{bmatrix} 2 & -1 \\ 2 & 2 \end{bmatrix}$.

**Intermediate point.** $\mathbf{g}(1, 1) = (1 - 1,\ 2) = (0, 2)$. There $\nabla f = [v, u]^\top = [2, 0]^\top$.

**Chain rule.** $\nabla(f\circ\mathbf{g}) = \mathbf{J}_{\mathbf{g}}^\top\nabla f = \begin{bmatrix} 2 & 2 \\ -1 & 2 \end{bmatrix}\begin{bmatrix} 2 \\ 0 \end{bmatrix} = [4, -2]^\top$.

**Check.** Substituting, $f\circ\mathbf{g} = (x^2 - y)(2xy) = 2x^3y - 2xy^2$. Its gradient is $[6x^2y - 2y^2,\ 2x^3 - 4xy]^\top$, which at $(1, 1)$ is $[4, -2]^\top$. They match. Notice that $\nabla f$ had to be evaluated at $(0, 2)$, not at $(1, 1)$.
:::

::: check
A measurement $\mathbf{z} = \mathbf{h}(\mathbf{x})$ is taken of a state that obeys $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$. Write $\dot{\mathbf{z}}$ in terms of $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$. Then write $\ddot{\mathbf{z}}$, treating $\mathbf{H}$ as constant, using also $\mathbf{F} = \partial\mathbf{f}/\partial\mathbf{x}$.
:::

::: answer
By the chain rule, $\dot{\mathbf{z}} = \mathbf{H}\,\dot{\mathbf{x}} = \mathbf{H}\,\mathbf{f}(\mathbf{x})$.

Differentiate again with $\mathbf{H}$ held fixed. The chain rule applies once more, now to $\mathbf{f}(\mathbf{x}(t))$: $\ddot{\mathbf{z}} = \mathbf{H}\,\frac{d}{dt}\mathbf{f}(\mathbf{x}(t)) = \mathbf{H}\,\mathbf{F}\,\dot{\mathbf{x}} = \mathbf{H}\mathbf{F}\mathbf{f}(\mathbf{x})$.

The products $\mathbf{H}$, $\mathbf{H}\mathbf{F}$, $\mathbf{H}\mathbf{F}^2, \dots$ are the rows of the **observability matrix**: what each further derivative of the measurement reveals about the state. That is why range-only tracking can pin down velocity over time, even though $\partial\rho/\partial\mathbf{v} = \mathbf{0}^\top$ at any one instant.
:::

::: check
Find and classify the stationary points of $f(x, y) = x^3 - 3x + y^2$.
:::

::: answer
**Flat spots.** $\nabla f = [3x^2 - 3,\ 2y]^\top$. This is zero when $x^2 = 1$ and $y = 0$, so at $(1, 0)$ and $(-1, 0)$.

**Hessian.** $\mathbf{H}_f = \operatorname{diag}(6x, 2)$.

- At $(1, 0)$: $\operatorname{diag}(6, 2)$, both eigenvalues positive, so positive definite — a strict local minimum, with $f = 1 - 3 + 0 = -2$.
- At $(-1, 0)$: $\operatorname{diag}(-6, 2)$, one of each sign, so indefinite — a saddle, with $f = -1 + 3 + 0 = 2$.

Neither is a global answer: $f \to -\infty$ as $x \to -\infty$. A positive-definite Hessian certifies only a *local* minimum.
:::

::: check
Why does the linearized covariance $\mathbf{P} = \mathbf{J}\mathbf{R}\mathbf{J}^\top$ follow from the chain rule? When does it stop working?
:::

::: answer
The Jacobian is the map's linear approximation, so $\delta\mathbf{p} \approx \mathbf{J}\,\delta\mathbf{z}$. Then $\delta\mathbf{p}\,\delta\mathbf{p}^\top = \mathbf{J}\,\delta\mathbf{z}\,\delta\mathbf{z}^\top\mathbf{J}^\top$. Averaging, and using that $\mathbf{J}$ is a fixed matrix, gives $\mathbf{J}\mathbf{R}\mathbf{J}^\top$.

It stops working when the map bends noticeably across the errors. A $1\,\mathrm{mrad}$ bearing error at $1000\,\mathrm{km}$ is fine; a $10^\circ$ one is not, because the arc of length $\rho\,\sigma_\alpha$ no longer looks straight. Then the Hessian terms of the map matter, and the transformed error is no longer Gaussian (bell-shaped).
:::

::: check
At a KKT point of a landing-trajectory problem, the reduced Hessian has one negative eigenvalue. What do you conclude, and what do you do?
:::

::: answer
It meets the first-order conditions but is **not** a local minimum. Some allowed direction — tangent to the active constraints — lowers the cost at second order. It is a saddle of the constrained problem: the optimizer has stalled, not converged.

What to do: step along the negative-curvature direction (that eigenvector), where the cost falls while the constraints stay satisfied to first order, and continue from there. In a convex problem this could not happen — one reason convex formulations are preferred for onboard guidance.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\frac{d}{dt}f(\mathbf{x}(t)) = \nabla f\cdot\dot{\mathbf{x}}$ | scalar chain rule along a path |
| $\dot\rho = \hat{\mathbf{u}}\cdot\mathbf{v}$, $\dot v = \hat{\mathbf{v}}\cdot\mathbf{a}$, $\dot\varepsilon = \mathbf{v}\cdot(\mathbf{a} + \mu\mathbf{r}/r^3)$ | range-rate, rate of change of speed, energy rate |
| $\mathbf{J}_{\mathbf{f}\circ\mathbf{g}} = \mathbf{J}_{\mathbf{f}}(\mathbf{g}(\mathbf{x}))\,\mathbf{J}_{\mathbf{g}}(\mathbf{x})$ | chain rule for vector functions: outer on the left, at the intermediate point |
| $\frac{d}{dt}\mathbf{f}(\mathbf{x}(t)) = \mathbf{J}_{\mathbf{f}}\,\dot{\mathbf{x}}$ | time rate of a vector function of the state |
| $\nabla_{\mathbf{x}}(f\circ\mathbf{g}) = \mathbf{J}_{\mathbf{g}}^\top\nabla_{\mathbf{y}}f$ | gradient carried backwards through a map |
| $\mathbf{P} = \mathbf{J}\mathbf{R}\mathbf{J}^\top$ | linearized covariance transform |
| $\partial_x\phi(r) = \phi'(r)\,x/r$; $\partial_z\psi(r,z) = \psi_r\,z/r + \psi_z$ | chain rule through the distance, every path counted |
| $(\mathbf{H}_f)_{ij} = \partial^2 f/\partial x_i\partial x_j = \mathbf{J}_{\nabla f}$ | Hessian: symmetric, Jacobian of the gradient |
| $f(\mathbf{x}+\mathbf{d}) \approx f + \nabla f^\top\mathbf{d} + \tfrac{1}{2}\mathbf{d}^\top\mathbf{H}_f\mathbf{d}$ | second-order Taylor expansion |
| $\mathbf{H}_f \succ 0$ at $\nabla f = \mathbf{0}$ | strict local minimum; indefinite means saddle |
| $\nabla^2 U = -\mathbf{G}$, eigenvalues $-2\mu/r^3, \mu/r^3, \mu/r^3$ | Hessian of the two-body potential: indefinite, trace zero |
| $\mathbf{x}_{k+1} = \mathbf{x}_k - \mathbf{H}_f^{-1}\nabla f$ | Newton step |
| reduced Hessian $\succ 0$ at a KKT point | second-order sufficient condition, local only |

The next lesson turns to vector functions of one variable, time: the trajectories $\mathbf{r}(t)$ themselves. It differentiates dot and cross products, finds curvature from the part of the acceleration perpendicular to the velocity, and shows how to differentiate a vector whose components are given in a rotating frame.

::: context doppler Why radar hears only the line of sight
An ambulance siren sounds higher as it comes toward you and lower as it goes away. The pitch shift depends only on how fast the distance between you is changing — not on any sideways motion. A car crossing far in front of you at right angles barely shifts at all.

A tracking radar does the same with radio waves. The shift in frequency measures $\dot\rho$, the rate of change of range, and nothing else. That is the chain rule's projection $\hat{\mathbf{u}}\cdot\mathbf{v}$ made physical: the two sideways components of velocity are invisible in a single Doppler reading.
:::

::: context composition Chaining functions, drawn
The ring $\circ$ in $\mathbf{f}\circ\mathbf{g}$ means "do $\mathbf{g}$ first, then feed the result to $\mathbf{f}$". Read it right to left, as "f after g". Each box passes its outputs to the next, and the Jacobians multiply in the same right-to-left order.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="22" y="58" font-size="14" fill="#1f2a44" text-anchor="middle">x</text>
  <text x="22" y="78" font-size="11" fill="#6c7a93" text-anchor="middle">n</text>
  <line x1="34" y1="54" x2="80" y2="54" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="88,54 78,49 78,59" fill="#1f2a44"/>
  <rect x="90" y="30" width="60" height="48" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="59" font-size="14" fill="#1f2a44" text-anchor="middle">g</text>
  <line x1="150" y1="54" x2="196" y2="54" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="204,54 194,49 194,59" fill="#1f2a44"/>
  <text x="177" y="44" font-size="14" fill="#1f2a44" text-anchor="middle">y</text>
  <text x="177" y="72" font-size="11" fill="#6c7a93" text-anchor="middle">p</text>
  <rect x="206" y="30" width="60" height="48" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="236" y="59" font-size="14" fill="#1f2a44" text-anchor="middle">f</text>
  <line x1="266" y1="54" x2="312" y2="54" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="320,54 310,49 310,59" fill="#1f2a44"/>
  <text x="336" y="58" font-size="14" fill="#1f2a44" text-anchor="middle">h</text>
  <text x="336" y="78" font-size="11" fill="#6c7a93" text-anchor="middle">m</text>
  <text x="180" y="112" font-size="13" fill="#b4232c" text-anchor="middle">J_h = J_f · J_g   (m×p)(p×n) = m×n</text>
</svg>
```

The inner sizes $p$ must match, which is a free check on the order.
:::

::: context reverse-mode How computers do the chain rule backwards
Software can differentiate a long program automatically by applying the chain rule to every step. There are two ways to go. **Forward mode** pushes a nudge from the inputs to the outputs, multiplying Jacobians left to right as it goes. **Reverse mode** starts from a single output — a cost — and passes its gradient backwards through each step with $\mathbf{J}^\top$.

When there is one output and thousands of inputs, reverse mode gets the whole gradient in one backward pass. That is exactly the situation in trajectory optimization (one cost, many thrust commands) and in training neural networks, where the same idea is called backpropagation.
:::

::: context covariance What a covariance matrix holds
A **variance** is the average of an error squared: $\sigma^2$, the standard deviation squared. A **covariance** measures whether two errors tend to move together. A covariance matrix puts variances on the diagonal and covariances off it. A large off-diagonal entry means "when this error is big, that one usually is too".

Drawn as a shape, a covariance is an ellipse (in 3D, an ellipsoid) of likely errors. For the radar, the range is sharp and the angles are blurry, so the shape is a thin disc standing across the line of sight:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="30" cy="120" r="6" fill="#1f2a44"/>
  <text x="30" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">radar</text>
  <line x1="30" y1="120" x2="270" y2="40" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="120" y="104" font-size="11" fill="#6c7a93" text-anchor="middle">line of sight</text>
  <ellipse cx="240" cy="50" rx="5" ry="40" transform="rotate(-18.43 240 50)" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="240" cy="50" r="2.5" fill="#b4232c"/>
  <text x="308" y="48" font-size="11" fill="#1f2a44" text-anchor="middle">thin: range error</text>
  <text x="308" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">wide: angle error</text>
  <text x="308" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">× distance</text>
</svg>
```
:::

::: context hessian-name Who Hesse was
The matrix is named after Ludwig Otto Hesse, a German mathematician of the 1800s who used determinants of second-derivative matrices in his work on curves and surfaces. The name stuck to the matrix itself. In optimization papers you will also see it written $\nabla^2 f$ or $\nabla\nabla f$, all meaning the same table of second partials.
:::

::: context saddle Bowl, dome and saddle
Three flat spots, seen along the two eigen-directions. In a bowl both cross-sections curve up. In a dome both curve down. On a saddle one curves up and the other curves down — so a marble sitting there rolls off sideways.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <path d="M20,30 Q60,110 100,30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="60" cy="66" r="4" fill="#1f2a44"/>
  <text x="60" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">minimum</text>
  <text x="60" y="118" font-size="11" fill="#6c7a93" text-anchor="middle">λ₁ &gt; 0, λ₂ &gt; 0</text>
  <path d="M130,80 Q170,0 210,80" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="170" cy="36" r="4" fill="#1f2a44"/>
  <text x="170" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">maximum</text>
  <text x="170" y="118" font-size="11" fill="#6c7a93" text-anchor="middle">λ₁ &lt; 0, λ₂ &lt; 0</text>
  <path d="M240,24 Q290,84 340,24" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M240,84 Q290,24 340,84" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="290" cy="54" r="4" fill="#1f2a44"/>
  <text x="290" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">saddle</text>
  <text x="290" y="118" font-size="11" fill="#6c7a93" text-anchor="middle">signs differ</text>
</svg>
```

Blue curves up, red curves down. A Pringles chip is a saddle you can eat.
:::

::: context earnshaw Why gravity cannot hold anything still
This is Earnshaw's theorem, proved by the English mathematician Samuel Earnshaw in 1842. The Hessian argument is short. Stable rest needs a minimum of the potential, so every eigenvalue of the Hessian must be positive and the trace must be positive. But in empty space the trace of the gravity Hessian is always zero (Laplace's equation). Positive numbers cannot add to zero, so no minimum exists.

The Lagrange points of the Earth–Moon system do not break this: they are balance points in a *rotating* frame, where extra terms enter, and $L_1$, $L_2$ and $L_3$ are unstable — spacecraft parked near them must fire thrusters now and then to stay.
:::

::: context quadratic-convergence Digits that double
"Quadratic convergence" means each step roughly squares the error. If you are off by $10^{-2}$, the next step is off by about $10^{-4}$, then $10^{-8}$, then $10^{-16}$. The number of correct digits doubles each time, so a few steps reach full machine precision. Gradient descent, by contrast, shrinks the error by a roughly fixed factor per step, which can take hundreds of steps on a stretched bowl.
:::

::: context multipliers What a multiplier measures
A Lagrange multiplier has a useful meaning: it is the price of its constraint. If you loosened the constraint by a tiny amount, the best cost would change by about the multiplier times that amount. A large multiplier on a thrust limit says "this limit is costing you a lot of fuel"; a zero multiplier on an inequality says "this limit is not even touching the answer". Engineers read multipliers to see which requirement is driving a design.
:::

::: context convexity What convex means
A problem is **convex** when its cost is bowl-shaped everywhere (never a saddle or a dome) and the set of allowed points has no dents: the straight line between any two allowed points stays allowed. Then any local minimum is the global one.

Landing a rocket with a thrust that cannot drop below a minimum is not naturally convex. In the 2000s, Behçet Açıkmeşe and colleagues at NASA's Jet Propulsion Laboratory showed how to rewrite that problem as a convex one without changing its answer. SpaceX has said publicly that it uses convex optimization to guide Falcon 9 boosters to their landings.
:::
