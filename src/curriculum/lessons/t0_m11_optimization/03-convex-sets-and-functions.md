---
id: l03-convex-sets-and-functions
title: Convex sets and convex functions
minutes: 23
covers:
  - convex sets and convex functions
---

Two lessons in, the picture is uncomfortable. Walking downhill finds stationary points, not necessarily minima. The KKT conditions are necessary but not sufficient. Inequality constraints hide a search over $2^m$ guesses of which ones are active. A guidance computer with a tenth of a second to spare cannot live with that uncertainty. It needs to know that the answer it finds is *the* answer, and it needs to know in advance how long finding it will take.

There is one broad family of problems where all of that uncertainty disappears, and it is defined by a single idea of shape. A problem is **[[convex|convex-word]]** when its cost is a convex function and its feasible set is a convex set. Being able to look at a constraint or a cost and say, with reasons, "convex" or "not convex" is the most valuable skill in this module. This lesson teaches it. The next lesson collects the reward.

The definitions are short. The craft is in a catalog of examples and a handful of **closure rules** that let you judge a complicated expression from its parts, without differentiating anything.

## Convex sets

Think of a room. Call it convex if any two people standing anywhere in it can see each other — the straight line between them never passes through a wall. A plain rectangular room passes. An L-shaped room fails: someone in one arm of the L cannot see someone round the corner in the other arm.

Here is the precise version.

> A set $C \subseteq \mathbb{R}^n$ is **convex** if for all $\mathbf{x}, \mathbf{y} \in C$ and all $\theta \in [0, 1]$, the point $\theta\mathbf{x} + (1-\theta)\mathbf{y}$ is in $C$.

($\theta$ is "theta", and $\theta \in [0, 1]$ means $\theta$ is between $0$ and $1$, ends included.) The point $\theta\mathbf{x} + (1-\theta)\mathbf{y}$ is a weighted mix of the two points. At $\theta = 0$ it is $\mathbf{y}$; at $\theta = 1$ it is $\mathbf{x}$; in between it slides along the straight segment joining them. So the definition says: **the segment between any two points of the set stays inside the set**.

A solid disc is convex. So is a square. A **[[crescent|shapes-picture]]**, a ring and a star are not. The empty set and the whole space count as convex too, because no pair of points in them can break the rule.

To show a set is *not* convex, one bad pair is enough: two points in the set whose midpoint (take $\theta = \tfrac{1}{2}$) is outside.

::: key Convex set
A set $C$ where for all $x, y \in C$ and $\theta \in [0,1]$, $\theta x + (1-\theta) y \in C$ – every segment between two points stays inside. To prove nonconvexity, exhibit two points in the set whose midpoint is outside.
:::

### Convex sets to know on sight

- **Hyperplanes and halfspaces.** A **hyperplane** $\{\mathbf{x} : \mathbf{a}^\top\mathbf{x} = b\}$ is a flat sheet (a line in two dimensions, a plane in three). A **halfspace** $\{\mathbf{x} : \mathbf{a}^\top\mathbf{x} \le b\}$ is everything on one side of it. Check the halfspace: if $\mathbf{a}^\top\mathbf{x} \le b$ and $\mathbf{a}^\top\mathbf{y} \le b$, then
  $\mathbf{a}^\top(\theta\mathbf{x} + (1-\theta)\mathbf{y}) = \theta\,\mathbf{a}^\top\mathbf{x} + (1-\theta)\,\mathbf{a}^\top\mathbf{y} \le \theta b + (1-\theta) b = b$.
  Every linear inequality constraint is a halfspace.
- **Polyhedra.** Any finite intersection of halfspaces and hyperplanes, $\{\mathbf{x} : \mathbf{A}\mathbf{x} \le \mathbf{b},\ \mathbf{F}\mathbf{x} = \mathbf{g}\}$, with the inequality read row by row. A box of limits such as $0 \le T_k \le T_{\max}$ is a polyhedron, and so is the feasible set of any linear program.
- **Norm balls.** $\{\mathbf{x} : \|\mathbf{x} - \mathbf{x}_c\| \le r\}$, all points within distance $r$ of a center $\mathbf{x}_c$, for any norm. The triangle inequality proves it:
  $\|\theta\mathbf{x} + (1-\theta)\mathbf{y} - \mathbf{x}_c\| = \|\theta(\mathbf{x} - \mathbf{x}_c) + (1-\theta)(\mathbf{y} - \mathbf{x}_c)\| \le \theta r + (1-\theta) r = r$.
  A thrust limit $\|\mathbf{u}\|_2 \le u_{\max}$ is a ball.
- **The second-order cone.** $\mathcal{K} = \{(\mathbf{x}, t) \in \mathbb{R}^{n} \times \mathbb{R} : \|\mathbf{x}\|_2 \le t\}$, nicknamed the **[[ice-cream cone|ice-cream-cone]]**. In three dimensions it is a solid cone with its tip at the origin, its axis along $t$, and a $45^\circ$ half-angle. It is convex by the same triangle-inequality argument, with the fixed radius $r$ replaced by $t$, which mixes linearly along the segment the same way the points do. A landing's glide-slope rule — stay inside a cone whose tip is the pad — is a second-order cone.
- **The positive semidefinite cone.** $\mathbb{S}^n_+ = \{\mathbf{X} = \mathbf{X}^\top : \mathbf{z}^\top\mathbf{X}\mathbf{z} \ge 0 \ \text{for all } \mathbf{z}\}$, the symmetric matrices with no negative eigenvalues. For one fixed $\mathbf{z}$, the condition $\mathbf{z}^\top\mathbf{X}\mathbf{z} \ge 0$ is a linear inequality in the entries of $\mathbf{X}$, so the cone is an intersection of infinitely many halfspaces. It is the home of **[[semidefinite programming|sdp-bridge]]**.

### Building bigger convex sets

Two operations keep convexity, and they let you build complicated feasible sets from simple pieces.

**Intersection.** If $C_1$ and $C_2$ are convex, so is $C_1 \cap C_2$, the points in both: a segment inside each is inside both. This works for any number of sets. So a feasible set defined by many constraints is convex as soon as each constraint on its own defines a convex set.

**Affine maps.** An **affine** map is a linear map plus a shift, $\mathbf{x} \mapsto \mathbf{A}\mathbf{x} + \mathbf{b}$. It sends straight segments to straight segments. So if $C$ is convex, then so are its image $\{\mathbf{A}\mathbf{x} + \mathbf{b} : \mathbf{x} \in C\}$ and its preimage $\{\mathbf{x} : \mathbf{A}\mathbf{x} + \mathbf{b} \in C\}$. That makes

$$
\{\mathbf{x} : \|\mathbf{A}\mathbf{x} + \mathbf{b}\|_2 \le \mathbf{c}^\top\mathbf{x} + d\}
$$

convex: it is the preimage of the second-order cone under an affine map. That set is the building block of the next few lessons.

What does **not** keep convexity: **union** and **complement**. Two discs that do not overlap make a nonconvex union. The outside of a ball is not convex.

::: warning Lower bounds on norms
The constraint $\|\mathbf{u}\|_2 \le u_{\max}$ is convex — a ball. The constraint $\|\mathbf{u}\|_2 \ge u_{\min}$ with $u_{\min} > 0$ is not. It is the outside of a ball, and the midpoint of the two feasible thrust vectors $(u_{\min}, 0, 0)$ and $(-u_{\min}, 0, 0)$ is the origin, with norm zero: infeasible. A liquid engine cannot **[[throttle below some minimum|thrust-ring]]**, so the physically honest landing problem contains exactly this nonconvex rule. The second-order cone programming lesson shows how to handle it without giving up convexity.
:::

::: example Which parts of a landing's feasible set are convex?
A lander is at position $\mathbf{r} = (r_x, r_y, r_z)$, with $r_z$ its altitude above a pad at the origin, and has thrust acceleration $\mathbf{u}$. Classify four constraints.

**1. Glide slope.** $\sqrt{r_x^2 + r_y^2} \le r_z\tan\gamma$, where $\gamma = 4^\circ$ is the cone's half-angle measured from the vertical — a narrow cone above the pad. With $\tan 4^\circ = 0.0699$ this reads $\|(r_x, r_y)\|_2 \le 0.0699\,r_z$: a second-order cone in $(r_x, r_y, r_z)$. **Convex.** At $100\,\mathrm{m}$ altitude the allowed sideways offset is $0.0699 \times 100 = 6.99\,\mathrm{m}$.

**2. Thrust upper limit.** $\|\mathbf{u}\|_2 \le 3g_0 = 3 \times 9.80665 = 29.4\,\mathrm{m/s^2}$. A ball. **Convex.**

**3. Thrust pointing.** The thrust must stay within $45^\circ$ of vertical: $u_z \ge \|\mathbf{u}\|_2\cos 45^\circ$, which rearranges to $\|\mathbf{u}\|_2 \le u_z/\cos 45^\circ = 1.414\,u_z$. A second-order cone with axis along $u_z$. **Convex.**

**4. Thrust lower limit.** $\|\mathbf{u}\|_2 \ge 0.4 \times 29.4 = 11.8\,\mathrm{m/s^2}$. Test a pair: $\mathbf{u}_1 = (0, 0, 11.8)$ and $\mathbf{u}_2 = (0, 11.8, 0)$ both have norm exactly $11.8$, so both are feasible. Their midpoint is $(0, 5.9, 5.9)$, with norm $\sqrt{5.9^2 + 5.9^2} = 8.34 < 11.8$. Infeasible. **Not convex.**

**Verdict.** Three of the four are convex, and their intersection is convex. The fourth, together with the equations of motion of a vehicle whose mass drops as it burns, are the two obstacles between the landing problem and convexity.
:::

## Convex functions

Hold a piece of string taut between two points on the edge of a salad bowl. The bowl's surface stays below the string all the way across. That is a convex function: **the graph lies on or below every chord**.

> A function $f : \mathbb{R}^n \to \mathbb{R}$ is **convex** if its domain is a convex set and for all $\mathbf{x}, \mathbf{y}$ in the domain and $\theta \in [0, 1]$,

$$
f(\theta\mathbf{x} + (1-\theta)\mathbf{y}) \le \theta f(\mathbf{x}) + (1-\theta) f(\mathbf{y}) .
$$

The right side is the height of the **[[chord|chord-picture]]** — the straight string between $(\mathbf{x}, f(\mathbf{x}))$ and $(\mathbf{y}, f(\mathbf{y}))$. The left side is the height of the graph at the same place. (The domain must be convex so that the in-between points exist.)

A few relatives:

- **Strictly convex**: the inequality is strict ($<$) whenever $\mathbf{x} \ne \mathbf{y}$ and $0 < \theta < 1$. The graph never touches a chord except at its ends.
- **Concave**: $-f$ is convex. The graph lies *above* its chords, like an upside-down bowl.
- **Affine** functions $\mathbf{a}^\top\mathbf{x} + b$ are both convex and concave, because the inequality holds with equality: their graph *is* the chord.

There is a neat bridge between the set idea and the function idea. The **[[epigraph|epigraph-word]]** of $f$ is everything on or above its graph, $\{(\mathbf{x}, t) : t \ge f(\mathbf{x})\}$. A function is convex exactly when its epigraph is a convex set. That is why facts about convex sets carry over to convex functions.

### Two calculus tests

Checking every chord is impossible. Two tests from calculus do the job instead.

**First-order condition.** A differentiable $f$ on a convex domain is convex exactly when

$$
f(\mathbf{y}) \ge f(\mathbf{x}) + \nabla f(\mathbf{x})^\top(\mathbf{y} - \mathbf{x}) \quad \text{for all } \mathbf{x}, \mathbf{y}.
$$

The right side is the tangent line (or tangent plane) at $\mathbf{x}$. So the test says: **every tangent lies below the whole graph**. This is the inequality that makes convex optimization work. Local information — the gradient at one point — gives a *global* lower bound on $f$ everywhere. In particular, if $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ the tangent plane is flat, and then $f(\mathbf{y}) \ge f(\mathbf{x}^\star)$ for every $\mathbf{y}$. **A stationary point of a convex function is a global minimizer.**

**Second-order condition.** A twice-differentiable $f$ is convex exactly when

$$
\nabla^2 f(\mathbf{x}) \succeq 0 \quad \text{for all } \mathbf{x} \text{ in the domain}:
$$

the Hessian is positive semidefinite everywhere. In one variable this is $f'' \ge 0$: the slope never decreases as you move right.

::: note Why the tangent test follows from the chord test
Rearrange the chord inequality, writing the mixed point as $\mathbf{x} + \theta(\mathbf{y} - \mathbf{x})$:

$$
f(\mathbf{y}) - f(\mathbf{x}) \ge \frac{f(\mathbf{x} + \theta(\mathbf{y} - \mathbf{x})) - f(\mathbf{x})}{\theta}.
$$

Now let $\theta$ shrink to $0$. The right side becomes the rate of change of $f$ at $\mathbf{x}$ in the direction $\mathbf{y} - \mathbf{x}$, which is $\nabla f(\mathbf{x})^\top(\mathbf{y} - \mathbf{x})$. That is the first-order condition. The second-order condition comes from applying the first-order one to nearby points and expanding to second order: a tangent can only stay below the graph if the graph bends upward, $\mathbf{p}^\top\nabla^2 f\,\mathbf{p} \ge 0$.
:::

::: key Convex function
$f(\theta x + (1-\theta) y) \le \theta f(x) + (1-\theta) f(y)$ for $\theta \in [0,1]$: the graph lies below every chord. Twice-differentiable equivalent: $\nabla^2 f \succeq 0$ everywhere. First-order equivalent: $f(y) \ge f(x) + \nabla f(x)^\top (y - x)$, the tangent plane is a global underestimator.
:::

### Convex functions to know on sight

- Affine functions $\mathbf{a}^\top\mathbf{x} + b$ (also concave).
- Every norm: $\|\mathbf{x}\|_1$, $\|\mathbf{x}\|_2$, $\|\mathbf{x}\|_\infty$, by the triangle inequality. Note that $\|\mathbf{x}\|_2$ is convex but has a sharp point at the origin, where it is not differentiable. Convexity does not need smoothness.
- Quadratics $\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x} + r$ with $\mathbf{P} \succeq 0$, since the Hessian is $2\mathbf{P}$. With $\mathbf{P} \succ 0$ they are strictly convex. The least-squares cost $\|\mathbf{A}\mathbf{x} - \mathbf{b}\|_2^2$ has $\mathbf{P} = \mathbf{A}^\top\mathbf{A} \succeq 0$.
- $e^{ax}$ for any real $a$; $x^p$ on $x > 0$ for $p \ge 1$ or $p \le 0$; $-\log x$ on $x > 0$ (second derivative $1/x^2 > 0$); $x\log x$ on $x > 0$.
- The **quadratic-over-linear** function $x^2/y$ on $y > 0$. Its Hessian is $\frac{2}{y^3}\begin{bmatrix} y^2 & -xy \\ -xy & x^2 \end{bmatrix} = \frac{2}{y^3}\begin{bmatrix} y \\ -x \end{bmatrix}\begin{bmatrix} y & -x \end{bmatrix}$, a positive number times a vector times itself, so it is positive semidefinite.
- The **[[log-sum-exp|soft-max]]** $\log(e^{x_1} + \dots + e^{x_n})$, a smooth stand-in for $\max_i x_i$.
- The largest of several affine functions, $\max_i(\mathbf{a}_i^\top\mathbf{x} + b_i)$: a bowl made of flat pieces.

And some that are not: $x^3$ on the whole line ($f'' = 6x$ changes sign); $\sin x$; $\sqrt{x}$ on $x > 0$ (concave); products like $x_1 x_2$ (Hessian eigenvalues $+1$ and $-1$); and any function with two separate strict local minima.

## Closure rules: a verdict without differentiating

The Hessian test is decisive, but often painful, and useless for functions with sharp corners. Faster is to recognize a function as built from known convex pieces by operations that keep convexity. Think of them as the rules of a construction kit.

1. **Nonnegative weighted sums.** If $f_1, \dots, f_k$ are convex and the weights $w_i \ge 0$, then $\sum_i w_i f_i$ is convex. (Chords add up.) A propellant cost plus a weighted tracking-error penalty is convex if each part is.
2. **Composition with an affine map.** If $f$ is convex, so is $f(\mathbf{A}\mathbf{x} + \mathbf{b})$. Hence $\|\mathbf{A}\mathbf{x} - \mathbf{b}\|_2$ is convex for any $\mathbf{A}$ and $\mathbf{b}$: a norm of an affine map.
3. **Pointwise maximum.** If $f_1, \dots, f_k$ are convex, then $\max_i f_i(\mathbf{x})$ is convex. (The epigraph of the max is the intersection of the epigraphs.) This extends to the largest value over an infinite family, which is how the largest eigenvalue $\lambda_{\max}(\mathbf{X}) = \max_{\|\mathbf{z}\|=1}\mathbf{z}^\top\mathbf{X}\mathbf{z}$ is seen to be convex in $\mathbf{X}$.
4. **Composition with a monotone function.** If $h$ is convex and nondecreasing and $g$ is convex, then $h(g(\mathbf{x}))$ is convex. So $e^{\|\mathbf{x}\|}$ is convex, and so is $\|\mathbf{A}\mathbf{x} - \mathbf{b}\|_2^2$ (squaring is convex and nondecreasing on the nonnegative values a norm takes). If instead $h$ is convex and nonincreasing and $g$ is concave, $h(g(\mathbf{x}))$ is again convex. Example: $-\log(b - \mathbf{a}^\top\mathbf{x})$ on the halfspace where it is defined, the **[[barrier function|barrier-bridge]]** that interior-point methods are built from.
5. **Partial minimization.** If $f(\mathbf{x}, \mathbf{y})$ is convex in both together and $C$ is a convex set, then $\min_{\mathbf{y} \in C} f(\mathbf{x}, \mathbf{y})$ is convex in $\mathbf{x}$. So the optimal cost of a convex program is a convex function of its constraint bounds — which is why the shadow prices of lesson 2 behave so well.

Not on the list: differences, products, and compositions the wrong way round. Both $e^x$ and $x^2$ are convex, but $e^x - x^2$ has second derivative $e^x - 2$, which is negative for every $x < \ln 2 = 0.693$. Subtracting a convex function, or adding one with a negative weight, breaks convexity as a rule, not as an exception.

::: example Three functions, three verdicts
**(a) $f(x, y) = x^2 - xy + y^2$.** The Hessian is the constant matrix $\begin{bmatrix} 2 & -1 \\ -1 & 2 \end{bmatrix}$, with eigenvalues $1$ and $3$. Both positive, so $f$ is strictly convex everywhere. A second route: complete the square to get $f = (x - y/2)^2 + \tfrac{3}{4}y^2$, a nonnegative sum (rule 1) of squares of affine functions (rule 2).

**(b) $f(x, y) = x^2 y^2$.** The Hessian is $\begin{bmatrix} 2y^2 & 4xy \\ 4xy & 2x^2 \end{bmatrix}$, with determinant $4x^2y^2 - 16x^2y^2 = -12x^2y^2$. That is negative wherever $xy \ne 0$ (it is $-12$ at $(1, 1)$). A negative determinant means one positive and one negative eigenvalue, so the Hessian is indefinite: not convex. See it with a chord: $(2, 0.5)$ and $(0.5, 2)$ both have $f = 1$, but their midpoint $(1.25, 1.25)$ has $f = 1.5625^2 = 2.44 > 1$. The graph pokes above the chord.

**(c) Rosenbrock, $f(x, y) = (1-x)^2 + 100(y - x^2)^2$.** It is a sum of two squares, which looks like rule 1. But the inside of the second square, $y - x^2$, is not affine, so rule 2 does not apply, and squaring a non-affine function is not covered by rule 4. Check the Hessian: its top-left entry, $2 - 400(y - x^2) + 800x^2$, is $2 - 400 = -398$ at $(0, 1)$. A negative diagonal entry means the Hessian is not positive semidefinite there. Not convex — which is exactly why it is the standard stress test for local methods.
:::

::: example Jensen's inequality and the rocket equation
Take $\theta = \tfrac{1}{2}$ in the definition: $f\!\left(\tfrac{x+y}{2}\right) \le \tfrac{f(x) + f(y)}{2}$. The function of the average is at most the average of the function. This is the simplest case of **[[Jensen's inequality|jensen]]**, and it makes a quick numerical test.

**The function.** The rocket equation says the mass ratio needed for a speed change $\Delta v$ is $f(\Delta v) = e^{\Delta v / v_e}$, where $v_e = I_{sp}\,g_0$ is the exhaust velocity. For $I_{sp} = 311\,\mathrm{s}$, $v_e = 311 \times 9.80665 = 3050\,\mathrm{m/s}$.

**The numbers.** Compare $\Delta v = 1000$ and $3000\,\mathrm{m/s}$ with their average, $2000\,\mathrm{m/s}$:

$$
f(1000) = 1.388,\quad f(3000) = 2.674,\quad \tfrac{1}{2}\big(f(1000) + f(3000)\big) = 2.031,\quad f(2000) = 1.927 .
$$

**The verdict.** The chord's midpoint, $2.031$, is above the graph's value, $1.927$, as convexity demands. The gap of about $5\%$ is the bend of the exponential over that stretch. One chord does not *prove* convexity — you would need all of them — but one failed chord *disproves* it, and that is usually what you need when a suspicious term turns up in a cost function.
:::

## Convex optimization problems

A **convex optimization problem** in standard form is

$$
\begin{aligned}
\text{minimize}\quad & f(\mathbf{x}) \\
\text{subject to}\quad & g_i(\mathbf{x}) \le 0, \quad i = 1,\dots,m, \\
& \mathbf{A}\mathbf{x} = \mathbf{b},
\end{aligned}
$$

with $f$ and every $g_i$ convex and every equality constraint **affine**. The feasible set is then convex, for three reasons:

- each $\{\mathbf{x} : g_i(\mathbf{x}) \le 0\}$ is a **sublevel set** of a convex function (the points where it is at most some level), and that is convex: if $g_i(\mathbf{x}) \le 0$ and $g_i(\mathbf{y}) \le 0$, the chord inequality keeps $g_i$ at most $0$ all along the segment;
- the affine set $\{\mathbf{A}\mathbf{x} = \mathbf{b}\}$ is convex;
- intersections of convex sets are convex.

Two subtleties catch people.

**The direction of the inequality matters.** "Minimize $x^2$ subject to $x^2 \ge 1$" has a convex cost and a convex constraint *function*. But the rule points the wrong way: the feasible set $|x| \ge 1$ is two separate pieces, and there are two separate minimizers, $\pm 1$. Convexity of a problem is about the cost and the feasible *set*. The standard form — convex function $\le 0$, affine $= 0$ — is the way of writing constraints that guarantees a convex set.

**Nonlinear equality constraints are nonconvex.** The set $\{\mathbf{x} : h(\mathbf{x}) = 0\}$ for a non-affine $h$ is, apart from freak cases such as a single point, a curved surface, and a straight segment between two of its points leaves it. A rocket's equations of motion, $\dot{\mathbf{v}} = \mathbf{T}/m + \mathbf{g}$ with $\dot m = -\|\mathbf{T}\|/v_e$, are nonlinear in the unknowns, because the thrust $\mathbf{T}$ is divided by a mass $m$ that is itself unknown. Written as equality constraints, they make the problem nonconvex no matter how convex everything else is. Landing-guidance research spends a great deal of effort on exactly this — changing variables so the dynamics become affine — and the next lessons return to it.

::: warning Convex is not the same as smooth, or as bowl-shaped along each axis
Three different things get muddled. A function can be convex without being differentiable ($|x|$, any norm). A function can be smooth and bowl-shaped along every coordinate axis and still not be convex ($x^2y^2$ above: along each axis it is a parabola or a constant). And a *set* can be convex while the function used to describe it is not: $\{\mathbf{x} : \|\mathbf{x}\|_2^2 \le 1\}$ is the same ball whether you write the rule as $\|\mathbf{x}\|_2^2 - 1 \le 0$ or as $\log\|\mathbf{x}\|_2^2 \le 0$, and the second function is not convex. Convexity of the *set* is what matters. Convex constraint *functions* are a sufficient way to get it — and the way solvers and modeling tools can check.
:::

## Check yourself

::: check
Is the set $\{(x, y) : y \ge x^2\}$ convex? Is $\{(x, y) : y \le x^2\}$? Give a one-line reason for each.
:::

::: answer
The first is the epigraph of the convex function $x^2$ (everything on or above the parabola), so it is convex.

The second is everything below the parabola. The points $(-1, 1)$ and $(1, 1)$ are both in it (each has $y = x^2$), but their midpoint $(0, 1)$ has $y = 1 > 0 = x^2$, so it is outside. Not convex.
:::

::: check
Without differentiating, decide whether $f(\mathbf{x}) = \|\mathbf{A}\mathbf{x} - \mathbf{b}\|_2 + 3\max(x_1, x_2 - 1) + e^{\mathbf{c}^\top\mathbf{x}}$ is convex.
:::

::: answer
Yes, piece by piece. $\|\mathbf{A}\mathbf{x} - \mathbf{b}\|_2$ is a norm of an affine map (rule 2). $\max(x_1, x_2 - 1)$ is the largest of two affine functions (rule 3), and multiplying by $3 \ge 0$ keeps it convex. $e^{\mathbf{c}^\top\mathbf{x}}$ is the convex exponential of an affine function (rule 2). A sum of convex functions with nonnegative weights is convex (rule 1).
:::

::: check
A rule says "stay at least $50\,\mathrm{m}$ from a hazard at $\mathbf{p}$": $\|\mathbf{r} - \mathbf{p}\|_2 \ge 50$. Is the set of allowed positions convex? Show it with two specific points.
:::

::: answer
No. Take $\mathbf{r}_1 = \mathbf{p} + (50, 0, 0)$ and $\mathbf{r}_2 = \mathbf{p} - (50, 0, 0)$. Both are exactly $50\,\mathrm{m}$ from the hazard, so both are allowed. Their midpoint is $\mathbf{p}$ itself, at distance zero — forbidden.

A **[[keep-out zone|keep-out]]** is the outside of a ball and is never convex. The usual fix is to replace it with a halfspace — a flat wall between the trajectory and the hazard — which is convex but more cautious than it needs to be.
:::

::: check
For which values of the constant $a$ is $f(x, y) = x^2 + a\,xy + y^2$ convex everywhere?
:::

::: answer
The Hessian is the constant matrix $\begin{bmatrix} 2 & a \\ a & 2 \end{bmatrix}$, with eigenvalues $2 + a$ and $2 - a$. Both are nonnegative exactly when $|a| \le 2$.

So $f$ is convex for $-2 \le a \le 2$, strictly convex for $|a| < 2$, and a saddle (indefinite) for $|a| > 2$. At $a = \pm 2$ the function is $(x \pm y)^2$: convex, but perfectly flat along one line.
:::

::: check
A colleague says: "The feasible set is $g(\mathbf{x}) \le 0$, and I checked that $g$ is not convex, so the problem is nonconvex." Is the conclusion justified?
:::

::: answer
Not necessarily. A convex $g$ is *enough* to make the set convex, but it is not *required*. The set $\{\mathbf{x} : \log\|\mathbf{x}\|_2^2 \le 0\}$ is the unit ball, which is convex, even though its constraint function is not.

The same set may have a convex description, here $\|\mathbf{x}\|_2^2 - 1 \le 0$. The right questions are: is the feasible *set* convex, and if so, can it be written with convex constraint functions so a solver can use that?
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\theta\mathbf{x} + (1-\theta)\mathbf{y} \in C$, $\theta \in [0,1]$ | Convex set: segments stay inside |
| Midpoint outside | One bad pair proves a set is not convex |
| Halfspace, polyhedron, norm ball, second-order cone, PSD cone | Convex sets to recognize on sight |
| Intersection, affine image and preimage | Keep sets convex (union and complement do not) |
| $f(\theta\mathbf{x} + (1-\theta)\mathbf{y}) \le \theta f(\mathbf{x}) + (1-\theta)f(\mathbf{y})$ | Convex function: graph below every chord |
| $f(\mathbf{y}) \ge f(\mathbf{x}) + \nabla f(\mathbf{x})^\top(\mathbf{y} - \mathbf{x})$ | First-order test: every tangent is a global underestimator |
| $\nabla^2 f \succeq 0$ everywhere | Second-order test |
| Nonnegative sums, affine composition, pointwise max, monotone composition, partial minimization | Closure rules for convex functions |
| Convex $f$, convex $g_i \le 0$, affine $\mathbf{A}\mathbf{x} = \mathbf{b}$ | Standard form of a convex optimization problem |
| $\|\mathbf{u}\|_2 \le u_{\max}$ convex; $\|\mathbf{u}\|_2 \ge u_{\min}$ not | The thrust-limit asymmetry at the heart of landing guidance |
| Nonlinear equality constraint | Nonconvex (barring freak cases such as a single point) |

Next lesson: the reward. For a convex problem every local minimum is global, every KKT point is optimal, the problem can be solved in a number of steps you can bound in advance, and the solver can hand back a certificate that its answer is right.

::: context convex-word Arched like a vault
"Convex" comes from the Latin *convexus*, meaning arched or vaulted — curved outward, like the outside of a dome. Its partner "concave" means hollowed, like the inside of a bowl. The names can feel backwards: a convex *function* looks like a bowl, which is concave when seen from above. The name really describes the region *above* the graph, the epigraph, and for a convex function that region is a convex set.
:::

::: context shapes-picture The segment test, drawn
On the left, any two points of the disc are joined by a segment that stays inside: convex. On the right, the two points in the horns of the crescent are both in the set, but the dashed segment between them crosses the bite, which is outside: not convex.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="100" r="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="70" x2="120" y2="135" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="60" cy="70" r="4" fill="#1f2a44"/>
  <circle cx="120" cy="135" r="4" fill="#1f2a44"/>
  <path d="M287.14,52.88 A60,60 0 1,0 287.14,147.12 A48,48 0 1,1 287.14,52.88 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="265" y1="48" x2="265" y2="152" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 4"/>
  <circle cx="265" cy="48" r="4" fill="#1f2a44"/>
  <circle cx="265" cy="152" r="4" fill="#1f2a44"/>
  <text x="90" y="185" font-size="12" text-anchor="middle" fill="#1f2a44">disc: convex</text>
  <text x="250" y="185" font-size="12" text-anchor="middle" fill="#b4232c">crescent: not convex</text>
</svg>
```
:::

::: context ice-cream-cone The cone that landing guidance runs on
Stand the cone on its tip. At height $t$ it is a disc of radius $t$: higher up, wider. That is the second-order cone. Tilt it, squash it or narrow it with an affine map and you get the glide-slope cone above a landing pad, or the cone around the vertical that the thrust vector must point inside. Lesson 6 shows that a whole family of problems — second-order cone programs — is built from nothing but these cones and flat constraints, and that family is what flies on landing boosters.
:::

::: context sdp-bridge Matrices as unknowns
In **semidefinite programming**, the unknowns fill a matrix, and the rule is that the matrix must be positive semidefinite. It sounds exotic, but it is exactly what you need to prove a control system is stable for a whole range of conditions at once, by searching for a matrix that certifies it. Lesson 8 is devoted to it.
:::

::: context thrust-ring Why the minimum throttle breaks convexity
Draw the allowed thrust vectors in two dimensions. The upper limit alone gives a filled disc — convex. Adding the lower limit cuts a hole in the middle, leaving a ring. The two blue points are allowed, but the point halfway between them, the red center, lies in the hole.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M100,100 A80,80 0 1,0 260,100 A80,80 0 1,0 100,100 Z M148,100 A32,32 0 1,0 212,100 A32,32 0 1,0 148,100 Z" fill="#8fb8f0" fill-rule="evenodd" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="148" y1="100" x2="212" y2="100" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="148" cy="100" r="4.5" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="212" cy="100" r="4.5" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="180" cy="100" r="4.5" fill="#b4232c"/>
  <text x="180" y="119" font-size="11" text-anchor="middle" fill="#b4232c">origin</text>
  <line x1="180" y1="100" x2="236.6" y2="43.4" stroke="#1f2a44" stroke-width="1"/>
  <text x="244" y="40" font-size="11" fill="#1f2a44">u_max</text>
  <text x="272" y="104" font-size="11" fill="#1f2a44">allowed ring</text>
  <text x="180" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">hole: ‖u‖ &lt; u_min is forbidden</text>
</svg>
```

A real engine that is lit cannot produce a thrust in the hole, and the landing problem has to live with that.
:::

::: context chord-picture Below every chord, above every tangent
The blue curve is $f(x) = x^2/4$. The orange chord joins the points at $x = 0$ and $x = 4$; halfway along, the chord is at height $2$ but the curve is only at $1$. The gray line is the tangent at $x = 1$, and it stays under the curve everywhere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,173.8 52.5,176.5 65.0,178.4 77.5,179.6 90.0,180.0 102.5,179.6 115.0,178.4 127.5,176.5 140.0,173.8 152.5,170.2 165.0,165.9 177.5,160.9 190.0,155.0 202.5,148.4 215.0,140.9 227.5,132.7 240.0,123.8 252.5,114.0 265.0,103.4 277.5,92.1 290.0,80.0 302.5,67.1 315.0,53.4 327.5,39.0 340.0,23.8"/>
  <line x1="90" y1="180" x2="290" y2="80" stroke="#f2b880" stroke-width="2.5"/>
  <line x1="65" y1="192.5" x2="340" y2="123.75" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="190" y1="130" x2="190" y2="155" stroke="#b4232c" stroke-width="2"/>
  <circle cx="190" cy="130" r="3.5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="190" cy="155" r="3.5" fill="#1d6fd1"/>
  <circle cx="140" cy="173.75" r="3.5" fill="#6c7a93"/>
  <text x="196" y="122" font-size="11" fill="#1f2a44">chord: 2</text>
  <text x="196" y="170" font-size="11" fill="#1d6fd1">curve: 1</text>
  <text x="300" y="36" font-size="12" text-anchor="end" fill="#1d6fd1">f(x) = x²/4</text>
  <text x="340" y="162" font-size="11" text-anchor="end" fill="#6c7a93">tangent at x = 1</text>
  <text x="90" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="290" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">4</text>
</svg>
```
:::

::: context epigraph-word "Upon the graph"
*Epi* is Greek for "upon" or "above", the same prefix as in *epicenter*, the point on the surface above an earthquake. The epigraph is the region upon the graph: every point on it or above it. For $f(x) = x^2$, the epigraph is the inside of the parabola cup. Filling in the region above the graph turns a question about a function into a question about a set, which is often easier to picture.
:::

::: context soft-max A smooth maximum
For numbers far apart, $\log(e^{x_1} + e^{x_2})$ is very close to the larger one: $\log(e^{10} + e^{0}) = 10.0000454$. When they are equal it overshoots the maximum by exactly $\log 2 = 0.693$. So it behaves like $\max$, but with its sharp corner rounded off — handy when a solver needs smooth derivatives. The same idea, under the name "softmax", sits inside the neural networks used in machine learning.
:::

::: context barrier-bridge Walls that push harder the closer you get
The term $-\log(b - \mathbf{a}^\top\mathbf{x})$ is small when you are far inside the halfspace and shoots up to infinity as you approach its edge. Add such a term for every constraint to the cost, and a plain downhill walk can never cross a boundary — the walls push you back. That is the idea behind interior-point methods, the solvers that run onboard landing vehicles. Lesson 9 builds them, and the closure rule here is what guarantees the walls keep the problem convex.
:::

::: context jensen A telephone engineer's inequality
Johan Jensen was a Danish mathematician who spent his working life as an engineer at the Copenhagen telephone company, doing mathematics in his spare time. He published the general form of this inequality in 1906. In words: for a convex $f$, the $f$ of an average is at most the average of $f$. It turns up everywhere, from probability to information theory to rocket staging.
:::

::: context keep-out Keep-out zones in real missions
Spacecraft that fly close to something else — a docking port, a space station, an asteroid — are given keep-out zones they must not enter. Because the allowed region outside a sphere is not convex, onboard planners usually replace the sphere with a flat wall, or a sequence of walls updated along the approach, keeping each subproblem convex. The price is a slightly longer path than a perfect planner would find.
:::
