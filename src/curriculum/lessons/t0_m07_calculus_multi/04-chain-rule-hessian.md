---
id: l04-chain-rule-hessian
title: The chain rule for vector functions, and the Hessian
minutes: 26
covers:
  - chain rule for vector functions
  - Jacobian and Hessian
---

Almost every function in a GNC system is a composition. A radar measurement depends on the satellite's position, which depends on time. A cost function depends on the landing state, which depends on the control profile through the dynamics. A body-frame vector depends on inertial components through a rotation matrix that itself depends on the attitude angles. Differentiating any of these means differentiating a chain, and in several variables the chain rule has one memorable form: the Jacobian of a composition is the product of the Jacobians.

This lesson derives that rule from the linear approximation of Lesson 3, uses it to confirm the range-rate formula, to propagate a sensor's noise covariance through a nonlinear coordinate change, and to organise the algebra the module's J2 exercise depends on. It then applies the chain rule along a straight line to build the second-order Taylor expansion, which introduces the **Hessian** — the matrix of second derivatives that Lesson 3 postponed. The Hessian is what tells an optimiser whether the point where the gradient vanishes is a minimum, a maximum or a saddle, and it is the matrix that Newton's method inverts.

By the end you should be able to differentiate a vector function of a vector function by multiplying two Jacobians in the correct order, to write down the time derivative of any state-dependent quantity as $\mathbf{J}\,\dot{\mathbf{x}}$, and to read the Hessian at a solution as a statement about the local shape of the problem.

## The scalar chain rule along a curve

Lesson 2 derived the chain rule for a scalar field evaluated along a moving point. If $f:\mathbb{R}^n \to \mathbb{R}$ and $\mathbf{x}(t)$ is a curve, then

$$
\frac{d}{dt} f(\mathbf{x}(t)) = \nabla f \cdot \dot{\mathbf{x}} = \sum_{j=1}^{n} \frac{\partial f}{\partial x_j}\,\dot{x}_j .
$$

Each input moves at its own rate $\dot{x}_j$, each contributes its rate times the sensitivity $\partial f/\partial x_j$, and the contributions add because the linear approximation adds. Three consequences are worth having at your fingertips.

**Range-rate.** Let $\rho = \lVert \mathbf{r} - \mathbf{r}_s \rVert$ with a station fixed at $\mathbf{r}_s$. Lesson 2 gave $\nabla\rho = \hat{\mathbf{u}}$, the unit line of sight, so

$$
\dot\rho = \nabla\rho \cdot \dot{\mathbf{r}} = \hat{\mathbf{u}} \cdot \mathbf{v} = \frac{(\mathbf{r} - \mathbf{r}_s)\cdot\mathbf{v}}{\rho},
$$

which is the range-rate formula that Lesson 3 used for the second row of $\mathbf{H}$. The chain rule is why a Doppler radar sees only the line-of-sight component of velocity: the gradient of range is a unit vector along the line of sight, and the chain rule projects the velocity onto it.

**Speed.** The speed $v = \lVert \mathbf{v} \rVert$ is the distance function applied to the velocity vector, so by the same gradient, $\dot v = \hat{\mathbf{v}} \cdot \mathbf{a}$: only the component of acceleration along the velocity changes the speed. The perpendicular component turns the velocity without changing its length, which Lesson 5 develops into curvature.

**Specific energy.** Let $\varepsilon(\mathbf{r}, \mathbf{v}) = \tfrac{1}{2}\mathbf{v}\cdot\mathbf{v} - \mu/r$, a scalar field on the six-dimensional state. Its gradient with respect to $\mathbf{v}$ is $\mathbf{v}$; with respect to $\mathbf{r}$ it is $-\mu\nabla(1/r) = \mu\mathbf{r}/r^3$. Along a trajectory with $\dot{\mathbf{r}} = \mathbf{v}$ and $\dot{\mathbf{v}} = \mathbf{a}$,

$$
\dot\varepsilon = \mathbf{v}\cdot\mathbf{a} + \frac{\mu\,\mathbf{r}}{r^3}\cdot\mathbf{v} = \mathbf{v}\cdot\left(\mathbf{a} + \frac{\mu\,\mathbf{r}}{r^3}\right).
$$

Under two-body gravity $\mathbf{a} = -\mu\mathbf{r}/r^3$ the bracket vanishes and $\dot\varepsilon = 0$: the specific energy is constant. Lesson 10 returns to this as the defining property of a conservative field; here it is a one-line application of the chain rule.

::: example Two rates along one orbit
Take the geometry of Lesson 3: $\mathbf{r} = (7000, 100, -200)\,\mathrm{km}$, $\mathbf{v} = (0.5, 7.4, 0.1)\,\mathrm{km/s}$, station at $(6378, 0, 0)\,\mathrm{km}$. The analytic range-rate is $\hat{\mathbf{u}}\cdot\mathbf{v} = 1.55982\,\mathrm{km/s}$. To check it, move the satellite along its velocity for $\pm 1\,\mathrm{ms}$ and difference the ranges: $[\rho(10^{-3}) - \rho(-10^{-3})]/(2 \times 10^{-3}) = 1.55982\,\mathrm{km/s}$, agreeing to eleven significant figures.

For the speed, $r = 7003.571\,\mathrm{km}$ and the two-body acceleration is $\mathbf{a} = -\mu\mathbf{r}/r^3 = (-8.1223, -0.1160, 0.2321)\,\mathrm{m/s^2}$, of magnitude $8.1264\,\mathrm{m/s^2}$. The speed is $7417.55\,\mathrm{m/s}$, and

$$
\dot v = \hat{\mathbf{v}}\cdot\mathbf{a} = \frac{\mathbf{v}\cdot\mathbf{a}}{v} = \frac{-4896.6}{7417.55} = -0.660\,\mathrm{m/s^2}.
$$

The satellite is climbing (its radial velocity $\hat{\mathbf{r}}\cdot\mathbf{v}$ is positive), so gravity is slowing it, but only by $0.66\,\mathrm{m/s^2}$ out of $8.13$: the rest of the acceleration bends the path. The energy bookkeeping closes exactly: $\mathbf{v}\cdot\mathbf{a} = -4896.6\,\mathrm{m^2/s^3}$ and $\mu\,\mathbf{r}\cdot\mathbf{v}/r^3 = +4896.6\,\mathrm{m^2/s^3}$, so $\dot\varepsilon = 0$ to the last digit.
:::

## The general chain rule: Jacobians multiply

Now let both functions be vector-valued. Suppose $\mathbf{g}:\mathbb{R}^n \to \mathbb{R}^p$ and $\mathbf{f}:\mathbb{R}^p \to \mathbb{R}^m$, and form the composition $\mathbf{h}(\mathbf{x}) = \mathbf{f}(\mathbf{g}(\mathbf{x}))$. Write $\mathbf{y} = \mathbf{g}(\mathbf{x})$ for the intermediate variable. Lesson 3 showed that each function acts on small displacements like its Jacobian:

$$
\delta\mathbf{y} \approx \mathbf{J}_{\mathbf{g}}(\mathbf{x})\,\delta\mathbf{x}, \qquad \delta\mathbf{f} \approx \mathbf{J}_{\mathbf{f}}(\mathbf{y})\,\delta\mathbf{y} .
$$

Substitute the first into the second: $\delta\mathbf{f} \approx \mathbf{J}_{\mathbf{f}}(\mathbf{y})\,\mathbf{J}_{\mathbf{g}}(\mathbf{x})\,\delta\mathbf{x}$. The best linear approximation of the composition is therefore the product of the two linear approximations, and since the Jacobian *is* the best linear approximation,

$$
\mathbf{J}_{\mathbf{f}\circ\mathbf{g}}(\mathbf{x}) = \mathbf{J}_{\mathbf{f}}(\mathbf{g}(\mathbf{x}))\;\mathbf{J}_{\mathbf{g}}(\mathbf{x}), \qquad
\frac{\partial h_i}{\partial x_j} = \sum_{k=1}^{p} \frac{\partial f_i}{\partial y_k}\,\frac{\partial g_k}{\partial x_j} .
$$

The component form is the matrix product written out: row $i$ of $\mathbf{J}_{\mathbf{f}}$ against column $j$ of $\mathbf{J}_{\mathbf{g}}$, summed over the intermediate index $k$. Every path by which $x_j$ can influence $h_i$ — through $y_1$, through $y_2$, and so on — contributes one term.

Three things to keep straight:

- **Order.** The outer function's Jacobian stands on the left, the inner one on the right, matching the order in which the maps are applied to a displacement. Matrix multiplication does not commute, so swapping them is wrong even when the shapes happen to allow it.
- **Shapes.** $\mathbf{J}_{\mathbf{f}}$ is $m \times p$ and $\mathbf{J}_{\mathbf{g}}$ is $p \times n$; the product is $m \times n$, as it must be for a map from $\mathbb{R}^n$ to $\mathbb{R}^m$. The inner dimension $p$ is the number of intermediate variables.
- **Where to evaluate.** $\mathbf{J}_{\mathbf{f}}$ is evaluated at the intermediate point $\mathbf{g}(\mathbf{x})$, not at $\mathbf{x}$. This is the most common slip in code: computing a rotation's Jacobian at the input rather than the rotated point.

::: key
Chain rule for vector functions: if $\mathbf{h} = \mathbf{f}\circ\mathbf{g}$ then $\mathbf{J}_{\mathbf{h}} = \mathbf{J}_{\mathbf{f}}\,\mathbf{J}_{\mathbf{g}}$, outer Jacobian on the left, evaluated at the intermediate point. For a function of a moving state, $\frac{d}{dt}f(\mathbf{x}(t)) = \nabla f\cdot\dot{\mathbf{x}}$ for scalar $f$, and $\frac{d}{dt}\mathbf{f}(\mathbf{x}(t)) = \mathbf{J}_{\mathbf{f}}\,\dot{\mathbf{x}}$ for vector $\mathbf{f}$.
:::

### Three special cases you will use constantly

**A function of time through the state.** If the inner function is a curve $\mathbf{x}(t)$, its Jacobian is the $n \times 1$ column $\dot{\mathbf{x}}$, and the rule reads $\frac{d}{dt}\mathbf{f}(\mathbf{x}(t)) = \mathbf{J}_{\mathbf{f}}\,\dot{\mathbf{x}}$. For a filter this says how a predicted measurement drifts between updates: $\dot{\mathbf{z}} = \mathbf{H}\,\dot{\mathbf{x}}$.

**The gradient of a composition.** If the outer function is scalar, $\mathbf{J}_{\mathbf{f}}$ is the row $(\nabla f)^\top$, so $\partial(f\circ\mathbf{g})/\partial\mathbf{x} = (\nabla f)^\top\mathbf{J}_{\mathbf{g}}$, and transposing to get a column,

$$
\nabla_{\mathbf{x}}(f\circ\mathbf{g}) = \mathbf{J}_{\mathbf{g}}^\top\,\nabla_{\mathbf{y}} f .
$$

The transposed Jacobian carries a gradient backwards through a map. This is how a cost defined on the final state of a trajectory becomes a gradient with respect to the controls that produced it, and it is the single operation that reverse-mode automatic differentiation repeats layer by layer.

**Inverse functions.** If $\mathbf{g}$ is invertible, applying the rule to $\mathbf{g}^{-1}\circ\mathbf{g} = \text{identity}$, whose Jacobian is $\mathbf{I}$, gives $\mathbf{J}_{\mathbf{g}^{-1}}\,\mathbf{J}_{\mathbf{g}} = \mathbf{I}$, so the Jacobian of the inverse map is the inverse of the Jacobian. Differentiating spherical coordinates with respect to Cartesian ones is the inverse of the $3 \times 3$ matrix Lesson 3 built, which is where the $1/r$ and $1/(r\sin\theta)$ factors in the spherical gradient come from.

::: example Propagating radar noise into position uncertainty
A tracking radar reports range $\rho$, azimuth $\alpha$ (clockwise from north) and elevation $\epsilon$. In the station's east–north–up frame the target position is

$$
\mathbf{p}(\rho, \alpha, \epsilon) = \rho\begin{bmatrix} \cos\epsilon\sin\alpha \\ \cos\epsilon\cos\alpha \\ \sin\epsilon \end{bmatrix},
\qquad
\mathbf{J} = \frac{\partial\mathbf{p}}{\partial(\rho,\alpha,\epsilon)} = \begin{bmatrix} \cos\epsilon\sin\alpha & \rho\cos\epsilon\cos\alpha & -\rho\sin\epsilon\sin\alpha \\ \cos\epsilon\cos\alpha & -\rho\cos\epsilon\sin\alpha & -\rho\sin\epsilon\cos\alpha \\ \sin\epsilon & 0 & \rho\cos\epsilon \end{bmatrix}.
$$

The first column is the unit line of sight, the second has length $\rho\cos\epsilon$ (a change $d\alpha$ moves the target along a circle of that radius), the third has length $\rho$. At $\rho = 1000\,\mathrm{km}$, $\alpha = 30^\circ$, $\epsilon = 45^\circ$ the position is $(353.6, 612.4, 707.1)\,\mathrm{km}$ and the determinant of $\mathbf{J}$ is $-\rho^2\cos\epsilon = -7.071 \times 10^{11}\,\mathrm{m^3/rad^2}$ (the sign reflects the handedness of the ordering; the volume factor of Lesson 6 is its absolute value).

Now suppose the measurement errors are independent with standard deviations $\sigma_\rho = 10\,\mathrm{m}$ and $\sigma_\alpha = \sigma_\epsilon = 1\,\mathrm{mrad}$, so the measurement covariance is $\mathbf{R} = \operatorname{diag}(100\,\mathrm{m^2},\ 10^{-6},\ 10^{-6})$. A small measurement error $\delta\mathbf{z}$ becomes a position error $\delta\mathbf{p} \approx \mathbf{J}\,\delta\mathbf{z}$, and the expected value of $\delta\mathbf{p}\,\delta\mathbf{p}^\top$ is

$$
\mathbf{P} = \mathbf{J}\,\mathbf{R}\,\mathbf{J}^\top =
\begin{bmatrix} 500{,}013 & 21.7 & -249{,}975 \\ 21.7 & 500{,}037 & -432{,}969 \\ -249{,}975 & -432{,}969 & 500{,}050 \end{bmatrix}\mathrm{m^2}.
$$

Each position component has a standard deviation of about $707\,\mathrm{m}$, and the strong off-diagonal terms say the errors are highly correlated: the uncertainty is a thin disc perpendicular to the line of sight, $10\,\mathrm{m}$ thick and about $707\,\mathrm{m}$ by $1000\,\mathrm{m}$ across ($\rho\cos\epsilon\,\sigma_\alpha$ and $\rho\,\sigma_\epsilon$). The trace $1.5001 \times 10^6\,\mathrm{m^2}$ is exactly $\sigma_\rho^2 + (\rho\cos\epsilon\,\sigma_\alpha)^2 + (\rho\,\sigma_\epsilon)^2$. This linearised covariance transform is the chain rule applied to random errors, and it is the same $\mathbf{J}\mathbf{R}\mathbf{J}^\top$ structure that appears in every Kalman filter update.
:::

### Functions of the distance, and the J2 exercise

The module's derivation exercise asks you to differentiate a potential written in terms of $r = \sqrt{x^2 + y^2 + z^2}$ and $z$. The chain rule organises it. For any function $\phi(r)$ of the distance alone, $\partial r/\partial x = x/r$ from Lesson 1 gives

$$
\frac{\partial}{\partial x}\,\phi(r) = \phi'(r)\,\frac{x}{r}, \qquad \nabla\phi(r) = \phi'(r)\,\hat{\mathbf{r}} .
$$

For a function $\psi(r, z)$ that depends on $z$ both through $r$ and directly, $z$ is an intermediate variable on two paths, and both contribute:

$$
\frac{\partial\psi}{\partial x} = \frac{\partial\psi}{\partial r}\frac{x}{r}, \qquad
\frac{\partial\psi}{\partial z} = \frac{\partial\psi}{\partial r}\frac{z}{r} + \frac{\partial\psi}{\partial z}\bigg|_{r\ \text{fixed}} .
$$

The second term on the right of the $z$ partial is the one learners drop. It is the reason the $z$ component of the J2 acceleration has a different constant from the $x$ and $y$ components, and it is what the exercise means by "keep every chain-rule term".

::: warning
When an intermediate variable appears more than once — $z$ inside $r$ and $z$ on its own — the chain rule sums over every occurrence. Differentiating only the explicit appearance, or only the one inside $r$, gives an answer that is wrong by a whole term, and no dimensional check will catch it because both terms have the same units.
:::

## The Hessian

Lesson 1 defined second partial derivatives and showed that for smooth functions the mixed partials agree, $\partial^2 f/\partial x\,\partial y = \partial^2 f/\partial y\,\partial x$. For a scalar field $f:\mathbb{R}^n \to \mathbb{R}$, collect all of them into the **Hessian matrix**

$$
\mathbf{H}_f = \nabla^2 f, \qquad (\mathbf{H}_f)_{ij} = \frac{\partial^2 f}{\partial x_i\,\partial x_j} .
$$

It is $n \times n$ and symmetric. It is also the Jacobian of the gradient: the gradient $\nabla f$ is a vector function of $\mathbf{x}$, and its Jacobian has entries $\partial(\nabla f)_i/\partial x_j = \partial^2 f/\partial x_j\,\partial x_i$, which by symmetry is the Hessian. So everything Lesson 3 said about Jacobians applies: the Hessian is the matrix of the best linear approximation to the gradient,

$$
\nabla f(\mathbf{x} + \delta\mathbf{x}) \approx \nabla f(\mathbf{x}) + \mathbf{H}_f\,\delta\mathbf{x} .
$$

Its entries have the units of $f$ divided by the product of two input units. For a potential in $\mathrm{m^2/s^2}$ differentiated twice with respect to position, the Hessian is in $\mathrm{s^{-2}}$ — the units of the gravity-gradient matrix, and not by coincidence: $\mathbf{a} = -\nabla U$, so $\partial\mathbf{a}/\partial\mathbf{r} = -\nabla^2 U$. Lesson 3's matrix $\mathbf{G} = (\mu/r^3)(3\hat{\mathbf{r}}\hat{\mathbf{r}}^\top - \mathbf{I})$ is minus the Hessian of $U = -\mu/r$.

::: note
The same symbol $\mathbf{H}$ denotes the measurement Jacobian in filtering and the Hessian in optimisation, and $\nabla^2 f$ denotes the Hessian matrix here but the Laplacian, a scalar, in Lesson 8. Context always disambiguates — a Hessian is square and symmetric, a measurement Jacobian is $m \times n$, a Laplacian is a number — but read subscripts and shapes before assuming.
:::

### The second-order Taylor expansion

Fix a point $\mathbf{x}$ and a direction $\mathbf{d}$, and look at $f$ along the straight line through $\mathbf{x}$: $\varphi(t) = f(\mathbf{x} + t\mathbf{d})$. This is a function of one variable, so the single-variable Taylor expansion applies to it, and the chain rule supplies its derivatives. With $\dot{\mathbf{x}} = \mathbf{d}$,

$$
\varphi'(t) = \nabla f(\mathbf{x} + t\mathbf{d})\cdot\mathbf{d} = \mathbf{d}^\top\nabla f, \qquad
\varphi''(t) = \frac{d}{dt}\big[\mathbf{d}^\top\nabla f(\mathbf{x} + t\mathbf{d})\big] = \mathbf{d}^\top\,\mathbf{H}_f\,\mathbf{d},
$$

where the second step differentiates the vector function $\nabla f$ along the curve using $\frac{d}{dt}\nabla f = \mathbf{J}_{\nabla f}\,\dot{\mathbf{x}} = \mathbf{H}_f\,\mathbf{d}$. Then $\varphi(1) \approx \varphi(0) + \varphi'(0) + \tfrac{1}{2}\varphi''(0)$ gives

$$
f(\mathbf{x} + \mathbf{d}) \approx f(\mathbf{x}) + \nabla f(\mathbf{x})^\top\mathbf{d} + \tfrac{1}{2}\,\mathbf{d}^\top\mathbf{H}_f(\mathbf{x})\,\mathbf{d} .
$$

The first two terms are the tangent plane of Lesson 1. The third is a quadratic form in the displacement, and it carries all the information about curvature: along a direction $\mathbf{d}$ of unit length, $\mathbf{d}^\top\mathbf{H}_f\mathbf{d}$ is the second derivative of $f$ along that line.

::: example A quadratic approximation with numbers
Let $f(x, y) = xy + e^{-x} + \tfrac{1}{2}y^2$ at $(1, 2)$, where $f = 4.36788$. The gradient is $\nabla f = [y - e^{-x},\ x + y]^\top = [1.63212,\ 3]^\top$ and the Hessian is

$$
\mathbf{H}_f = \begin{bmatrix} e^{-x} & 1 \\ 1 & 1 \end{bmatrix} = \begin{bmatrix} 0.36788 & 1 \\ 1 & 1 \end{bmatrix}.
$$

For the step $\mathbf{d} = [0.2, -0.1]^\top$: the linear term is $1.63212 \times 0.2 + 3 \times (-0.1) = 0.026424$, and the quadratic term is $\tfrac{1}{2}(0.36788 \times 0.04 + 2 \times 1 \times 0.2 \times (-0.1) + 1 \times 0.01) = \tfrac{1}{2}(-0.015285) = -0.0076424$. The tangent-plane estimate is $4.39430$, the quadratic estimate is $4.38666$, and the exact value is $f(1.2, 1.9) = 4.38619$. The linear error is $8.1 \times 10^{-3}$; the quadratic error is $4.7 \times 10^{-4}$, seventeen times smaller, and it is now third order in the step. The Hessian's determinant is $0.36788 - 1 = -0.632 < 0$, so this Hessian is indefinite: $f$ curves up along some directions and down along others at this point.
:::

### Classifying stationary points

A point where $\nabla f = \mathbf{0}$ is a **stationary point**. There the linear term of the expansion vanishes and the quadratic term decides what the surface looks like:

$$
f(\mathbf{x}^\star + \mathbf{d}) - f(\mathbf{x}^\star) \approx \tfrac{1}{2}\,\mathbf{d}^\top\mathbf{H}_f\,\mathbf{d} .
$$

Because $\mathbf{H}_f$ is symmetric, the spectral theorem from the linear algebra modules gives it real eigenvalues and orthogonal eigenvectors, and $\mathbf{d}^\top\mathbf{H}_f\mathbf{d} = \sum_i \lambda_i\,(\text{component of } \mathbf{d} \text{ along eigenvector } i)^2$. So:

- all eigenvalues positive, $\mathbf{H}_f \succ 0$ (**positive definite**): $f$ increases in every direction — a **strict local minimum**;
- all eigenvalues negative, $\mathbf{H}_f \prec 0$: a strict local maximum;
- eigenvalues of both signs (**indefinite**): $f$ decreases along some directions and increases along others — a **saddle**;
- some eigenvalue zero (singular): the second-order test is silent and higher derivatives decide.

For two variables there is a shortcut: the determinant is the product of the eigenvalues and the trace is their sum, so $\det\mathbf{H}_f > 0$ with $\partial^2 f/\partial x^2 > 0$ means a minimum, $\det > 0$ with $\partial^2 f/\partial x^2 < 0$ a maximum, and $\det < 0$ a saddle.

::: key
The Hessian is $(\mathbf{H}_f)_{ij} = \partial^2 f/\partial x_i\,\partial x_j$, symmetric, and equal to the Jacobian of $\nabla f$. At a point where $\nabla f = \mathbf{0}$, $\mathbf{H}_f \succ 0$ (positive definite) certifies a strict local minimum, $\mathbf{H}_f \prec 0$ a strict local maximum, and an indefinite $\mathbf{H}_f$ means a saddle.
:::

The gravitational potential gives a physical instance. Its Hessian, $\nabla^2 U = -\mathbf{G} = (\mu/r^3)(\mathbf{I} - 3\hat{\mathbf{r}}\hat{\mathbf{r}}^\top)$, has eigenvalues $-2\mu/r^3$ along the radial direction and $+\mu/r^3$ along the two transverse directions — at $400\,\mathrm{km}$ altitude, $-2.56 \times 10^{-6}$ and $+1.28 \times 10^{-6}\,\mathrm{s^{-2}}$. It is indefinite everywhere, and its trace is zero. The indefiniteness says the potential has no minimum in empty space, so no arrangement of fixed masses can hold a test body at rest in stable equilibrium by gravity alone; the zero trace is Laplace's equation, which Lesson 8 states in general.

### Newton's method

Lesson 2 minimised $f(x, y) = (x - 1)^2 + 4(y + 2)^2$ by gradient descent and saw it zigzag. The Hessian explains the zigzag and removes it. Minimising the quadratic model of $f$ around $\mathbf{x}_k$ means setting the gradient of the model to zero: $\nabla f(\mathbf{x}_k) + \mathbf{H}_f\,\mathbf{d} = \mathbf{0}$, so

$$
\mathbf{x}_{k+1} = \mathbf{x}_k - \mathbf{H}_f(\mathbf{x}_k)^{-1}\,\nabla f(\mathbf{x}_k) .
$$

This is **Newton's method**. For the example the Hessian is $\operatorname{diag}(2, 8)$ everywhere, so from the origin, where $\nabla f = [-2, 16]^\top$, the Newton step is $-\operatorname{diag}(1/2, 1/8)[-2, 16]^\top = [1, -2]^\top$, landing on the exact minimum $(1, -2)$ in a single step. Gradient descent zigzagged because the eigenvalues $2$ and $8$ differ by a factor of four: the gradient overweights the stiff $y$ direction, while $\mathbf{H}_f^{-1}$ rescales each eigendirection by its own curvature. On a non-quadratic function Newton's method converges quadratically once it is near a minimum, and it is the core of every least-squares orbit fit (where the Hessian is approximated by $\mathbf{J}^\top\mathbf{J}$, the Gauss–Newton method) and of the interior-point solvers behind convex landing guidance.

::: warning
Newton's method finds stationary points, not minima. If the Hessian at $\mathbf{x}_k$ is indefinite, the Newton step can head uphill toward a saddle. Practical optimisers check the Hessian's definiteness — or modify it until it is positive definite — before trusting the step. Checking the Hessian at the answer is not a formality; it is the test that the answer is a minimum at all.
:::

## Reading the Hessian at a constrained solution

Trajectory optimisation is rarely unconstrained: the vehicle must reach a target state, stay under a dynamic-pressure limit, respect a thrust bound. With equality constraints $\mathbf{c}(\mathbf{x}) = \mathbf{0}$, the first-order conditions are stated through the **Lagrangian** $\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}) = f(\mathbf{x}) + \boldsymbol{\lambda}^\top\mathbf{c}(\mathbf{x})$: at a solution, $\nabla f + \mathbf{J}_{\mathbf{c}}^\top\boldsymbol{\lambda} = \mathbf{0}$, which says the gradient of the cost is a combination of the constraint gradients — there is no downhill direction that stays on the constraint surface. These, together with feasibility and the sign rules for inequality multipliers, are the Karush–Kuhn–Tucker (KKT) conditions, and they are necessary, not sufficient.

The second-order question is: does the cost curve upward in every direction you are still allowed to move? Allowed directions are those tangent to the active constraints, $\mathbf{J}_{\mathbf{c}}\,\mathbf{d} = \mathbf{0}$. The relevant curvature is that of the Lagrangian, not of $f$ alone, because moving along a curved constraint surface changes $f$ through the constraint's curvature too. The **second-order sufficient condition** is

$$
\mathbf{d}^\top\,\nabla^2_{\mathbf{x}\mathbf{x}}\mathcal{L}\,\mathbf{d} > 0 \quad\text{for every } \mathbf{d} \neq \mathbf{0} \text{ with } \mathbf{J}_{\mathbf{c}}\mathbf{d} = \mathbf{0},
$$

that is, the Hessian of the Lagrangian is positive definite on the tangent space of the active constraints (the **reduced Hessian** is positive definite). When it holds alongside the KKT conditions, the point is a strict local minimiser. It does not have to hold in directions that leave the constraint surface, and it says nothing about other feasible regions: a nonconvex problem may have several local minima, each certified by its own reduced Hessian, and only convexity of the whole problem — or an exhaustive global search — promotes a local certificate to a global one. That is the practical argument for convexifying landing guidance: a convex problem has one minimum, so the local certificate is the global answer, and the solver can be trusted to return it in bounded time on a flight computer.

::: key
At a KKT point, positive definiteness of the Hessian of the Lagrangian on the tangent space of the active constraints is the second-order sufficient condition for a strict local minimum. It certifies local optimality only; global optimality needs convexity or a global method.
:::

## Check yourself

::: check
$\mathbf{g}(x, y) = [x^2 - y,\ 2xy]^\top$ and $f(u, v) = u\,v$. Find $\nabla_{(x,y)}(f\circ\mathbf{g})$ at $(1, 1)$ by the chain rule, then confirm by substituting first.
:::

::: answer
$\mathbf{J}_{\mathbf{g}} = [[2x, -1],[2y, 2x]]$, at $(1,1)$ equal to $[[2, -1],[2, 2]]$. The intermediate point is $\mathbf{g}(1,1) = (0, 2)$, where $\nabla f = [v, u]^\top = [2, 0]^\top$. Then $\nabla(f\circ\mathbf{g}) = \mathbf{J}_{\mathbf{g}}^\top\nabla f = [[2, 2],[-1, 2]][2, 0]^\top = [4, -2]^\top$. Directly, $f\circ\mathbf{g} = (x^2 - y)(2xy) = 2x^3y - 2xy^2$, with gradient $[6x^2y - 2y^2,\ 2x^3 - 4xy]^\top = [4, -2]^\top$ at $(1, 1)$. Note that $\nabla f$ had to be evaluated at $(0, 2)$, not at $(1, 1)$.
:::

::: check
A measurement $\mathbf{z} = \mathbf{h}(\mathbf{x})$ is taken of a state obeying $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$. Express $\dot{\mathbf{z}}$, and then $\ddot{\mathbf{z}}$ under the approximation that $\mathbf{H}$ is constant, in terms of $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ and $\mathbf{F} = \partial\mathbf{f}/\partial\mathbf{x}$.
:::

::: answer
By the chain rule $\dot{\mathbf{z}} = \mathbf{H}\,\dot{\mathbf{x}} = \mathbf{H}\,\mathbf{f}(\mathbf{x})$. Differentiating again with $\mathbf{H}$ held fixed, $\ddot{\mathbf{z}} = \mathbf{H}\,\frac{d}{dt}\mathbf{f}(\mathbf{x}(t)) = \mathbf{H}\,\mathbf{F}\,\dot{\mathbf{x}} = \mathbf{H}\mathbf{F}\mathbf{f}(\mathbf{x})$. The products $\mathbf{H}$, $\mathbf{H}\mathbf{F}$, $\mathbf{H}\mathbf{F}^2, \dots$ are the rows of the observability matrix: they describe what successive derivatives of the measurement reveal about the state, which is why range-only tracking can determine velocity over time even though $\partial\rho/\partial\mathbf{v} = \mathbf{0}^\top$ at any instant.
:::

::: check
Classify the stationary points of $f(x, y) = x^3 - 3x + y^2$.
:::

::: answer
$\nabla f = [3x^2 - 3,\ 2y]^\top = \mathbf{0}$ at $(\pm 1, 0)$. The Hessian is $\operatorname{diag}(6x, 2)$. At $(1, 0)$ it is $\operatorname{diag}(6, 2)$, positive definite: a strict local minimum, with $f = -2$. At $(-1, 0)$ it is $\operatorname{diag}(-6, 2)$, indefinite: a saddle, with $f = 2$. Neither is global — $f \to -\infty$ as $x \to -\infty$ — which illustrates that a positive-definite Hessian certifies only a local minimum.
:::

::: check
Why does the linearised covariance $\mathbf{P} = \mathbf{J}\mathbf{R}\mathbf{J}^\top$ follow from the chain rule, and when does it fail?
:::

::: answer
A small measurement error $\delta\mathbf{z}$ maps to a position error $\delta\mathbf{p} \approx \mathbf{J}\,\delta\mathbf{z}$ because the Jacobian is the linear approximation of the map. Taking the expectation of $\delta\mathbf{p}\,\delta\mathbf{p}^\top = \mathbf{J}\,\delta\mathbf{z}\,\delta\mathbf{z}^\top\mathbf{J}^\top$ gives $\mathbf{J}\mathbf{R}\mathbf{J}^\top$ since $\mathbf{J}$ is deterministic. It fails when the errors are large enough that the map curves noticeably across the error distribution — for instance a $1\,\mathrm{mrad}$ bearing error at $1000\,\mathrm{km}$ is fine, but a $10^\circ$ bearing error is not, because the arc of length $\rho\,\sigma_\alpha$ no longer resembles a straight line. In that regime the Hessian terms of the map matter and the transformed error is no longer Gaussian.
:::

::: check
The reduced Hessian at a KKT point of a landing-trajectory problem has one negative eigenvalue. What do you conclude, and what do you do?
:::

::: answer
The point satisfies the first-order conditions but is not a local minimum: there is a feasible direction, tangent to the active constraints, along which the cost decreases at second order, so it is a saddle of the constrained problem. The optimiser has stalled at a stationary point, not converged to a solution. Move along the negative-curvature direction (the eigenvector) — the cost will fall while the constraints are maintained to first order — and continue from there. If the problem were convex this could not happen, which is one of the reasons convex formulations are preferred for onboard guidance.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\frac{d}{dt}f(\mathbf{x}(t)) = \nabla f\cdot\dot{\mathbf{x}}$ | scalar chain rule along a curve |
| $\dot\rho = \hat{\mathbf{u}}\cdot\mathbf{v}$, $\dot v = \hat{\mathbf{v}}\cdot\mathbf{a}$, $\dot\varepsilon = \mathbf{v}\cdot(\mathbf{a} + \mu\mathbf{r}/r^3)$ | range-rate, speed rate, energy rate as chain-rule results |
| $\mathbf{J}_{\mathbf{f}\circ\mathbf{g}} = \mathbf{J}_{\mathbf{f}}(\mathbf{g}(\mathbf{x}))\,\mathbf{J}_{\mathbf{g}}(\mathbf{x})$ | chain rule for vector functions: outer on the left, evaluated at the intermediate point |
| $\frac{d}{dt}\mathbf{f}(\mathbf{x}(t)) = \mathbf{J}_{\mathbf{f}}\,\dot{\mathbf{x}}$ | time derivative of a vector function of the state |
| $\nabla_{\mathbf{x}}(f\circ\mathbf{g}) = \mathbf{J}_{\mathbf{g}}^\top\nabla_{\mathbf{y}}f$ | gradient carried backwards through a map |
| $\mathbf{P} = \mathbf{J}\mathbf{R}\mathbf{J}^\top$ | linearised covariance transform |
| $\partial_x\phi(r) = \phi'(r)\,x/r$; $\partial_z\psi(r,z) = \psi_r\,z/r + \psi_z$ | chain rule through the distance, both paths |
| $(\mathbf{H}_f)_{ij} = \partial^2 f/\partial x_i\partial x_j = \mathbf{J}_{\nabla f}$ | Hessian: symmetric, Jacobian of the gradient |
| $f(\mathbf{x}+\mathbf{d}) \approx f + \nabla f^\top\mathbf{d} + \tfrac{1}{2}\mathbf{d}^\top\mathbf{H}_f\mathbf{d}$ | second-order Taylor expansion |
| $\mathbf{H}_f \succ 0$ at $\nabla f = \mathbf{0}$ | strict local minimum; indefinite means saddle |
| $\nabla^2 U = -\mathbf{G}$, eigenvalues $-2\mu/r^3, \mu/r^3, \mu/r^3$ | Hessian of the two-body potential: indefinite, trace zero |
| $\mathbf{x}_{k+1} = \mathbf{x}_k - \mathbf{H}_f^{-1}\nabla f$ | Newton step |
| reduced Hessian $\succ 0$ at a KKT point | second-order sufficient condition, local only |

The next lesson turns to vector functions of a single variable, time: the trajectories $\mathbf{r}(t)$ themselves. It differentiates dot and cross products, derives curvature from the component of acceleration perpendicular to the velocity, and shows how to differentiate a vector whose components are given in a rotating frame.
