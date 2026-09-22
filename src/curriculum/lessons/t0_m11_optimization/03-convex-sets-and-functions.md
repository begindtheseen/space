---
id: l03-convex-sets-and-functions
title: Convex sets and convex functions
minutes: 25
covers:
  - convex sets and convex functions
---

Two lessons in, the picture is uncomfortable. Gradient methods find stationary points, not minima. The KKT conditions are necessary but not sufficient. Inequality constraints hide a combinatorial search over $2^m$ active sets. A guidance computer with a 100 ms budget cannot afford any of that uncertainty: it needs to know that the answer it finds is *the* answer, and it needs to know in advance how long finding it will take.

There is exactly one broad class of problems for which all of that uncertainty disappears, and it is defined by a single geometric property. A problem is **convex** when its objective is a convex function and its feasible set is a convex set. Recognising convexity on sight is therefore the most valuable skill in this module – the summary of the module says as much – and it is the skill this lesson teaches. The payoff is the next lesson; here the work is learning to look at a constraint or a cost and say, with reasons, "convex" or "not convex".

The definitions are short. The craft is in the catalogue of examples and the closure rules that let you assemble a verdict about a complicated expression from verdicts about its parts, without ever differentiating.

## Convex sets

> A set $C \subseteq \mathbb{R}^n$ is **convex** if for all $\mathbf{x}, \mathbf{y} \in C$ and all $\theta \in [0, 1]$, the point $\theta\mathbf{x} + (1-\theta)\mathbf{y}$ is in $C$.

The point $\theta\mathbf{x} + (1-\theta)\mathbf{y}$ sweeps out the line segment from $\mathbf{y}$ (at $\theta = 0$) to $\mathbf{x}$ (at $\theta = 1$). So the definition says: the segment between any two points of the set stays inside the set. A solid disc is convex; a crescent is not; a ring is not; a square is; a star is not. The empty set and the whole space are convex, trivially.

::: key Convex set
A set $C$ where for all $x, y \in C$ and $\theta \in [0,1]$, $\theta x + (1-\theta) y \in C$ – every segment between two points stays inside. To prove nonconvexity, exhibit two points in the set whose midpoint is outside.
:::

The sets that matter in this module:

- **Hyperplanes and halfspaces.** $\{\mathbf{x} : \mathbf{a}^\top\mathbf{x} = b\}$ and $\{\mathbf{x} : \mathbf{a}^\top\mathbf{x} \le b\}$. Check: if $\mathbf{a}^\top\mathbf{x} \le b$ and $\mathbf{a}^\top\mathbf{y} \le b$ then $\mathbf{a}^\top(\theta\mathbf{x} + (1-\theta)\mathbf{y}) = \theta\,\mathbf{a}^\top\mathbf{x} + (1-\theta)\,\mathbf{a}^\top\mathbf{y} \le \theta b + (1-\theta) b = b$. Every linear inequality constraint is a halfspace.
- **Polyhedra.** Any finite intersection of halfspaces and hyperplanes, $\{\mathbf{x} : \mathbf{A}\mathbf{x} \le \mathbf{b},\ \mathbf{F}\mathbf{x} = \mathbf{g}\}$ (inequality read component-wise). Boxes such as $0 \le T_k \le T_{\max}$ are polyhedra. The feasible set of a linear program is a polyhedron.
- **Norm balls.** $\{\mathbf{x} : \|\mathbf{x} - \mathbf{x}_c\| \le r\}$ for any norm. Check with the triangle inequality: $\|\theta\mathbf{x} + (1-\theta)\mathbf{y} - \mathbf{x}_c\| = \|\theta(\mathbf{x} - \mathbf{x}_c) + (1-\theta)(\mathbf{y} - \mathbf{x}_c)\| \le \theta r + (1-\theta) r = r$. A thrust magnitude limit $\|\mathbf{u}\|_2 \le u_{\max}$ is a Euclidean ball.
- **The second-order cone.** $\mathcal{K} = \{(\mathbf{x}, t) \in \mathbb{R}^{n} \times \mathbb{R} : \|\mathbf{x}\|_2 \le t\}$, the "ice-cream cone". In three dimensions it is the solid cone with apex at the origin, axis along $t$, and a $45^\circ$ half-angle. Convexity follows from the same triangle-inequality argument with $r$ replaced by the variable $t$, which is itself linear in the point. The glide-slope constraint of a landing – stay inside a cone whose apex is the pad – is a second-order cone with its axis vertical and its half-angle set by the allowed approach angle.
- **The positive semidefinite cone.** $\mathbb{S}^n_+ = \{\mathbf{X} = \mathbf{X}^\top : \mathbf{z}^\top\mathbf{X}\mathbf{z} \ge 0 \ \forall \mathbf{z}\}$. For fixed $\mathbf{z}$ the condition $\mathbf{z}^\top\mathbf{X}\mathbf{z} \ge 0$ is a linear inequality in the entries of $\mathbf{X}$, so the cone is an intersection of (infinitely many) halfspaces. This is the set semidefinite programming lives in.

Two operations preserve convexity and let you build up complicated feasible sets. **Intersection**: if $C_1$ and $C_2$ are convex so is $C_1 \cap C_2$, because a segment inside both is inside the intersection; this extends to any number of sets. A feasible set defined by many constraints is convex as soon as each constraint alone defines a convex set. **Affine images and preimages**: if $C$ is convex then so are $\{\mathbf{A}\mathbf{x} + \mathbf{b} : \mathbf{x} \in C\}$ and $\{\mathbf{x} : \mathbf{A}\mathbf{x} + \mathbf{b} \in C\}$, because affine maps send segments to segments. So $\{\mathbf{x} : \|\mathbf{A}\mathbf{x} + \mathbf{b}\|_2 \le \mathbf{c}^\top\mathbf{x} + d\}$ – the preimage of the second-order cone under an affine map – is convex. That set is the building block of the next lessons.

**Union does not preserve convexity.** Two discs that do not overlap have a nonconvex union. Neither does complement: the outside of a ball is not convex.

::: warning Lower bounds on norms
The constraint $\|\mathbf{u}\|_2 \le u_{\max}$ is convex – a ball. The constraint $\|\mathbf{u}\|_2 \ge u_{\min}$ with $u_{\min} > 0$ is not – it is the complement of an open ball, and the midpoint of the two feasible thrust vectors $(u_{\min}, 0, 0)$ and $(-u_{\min}, 0, 0)$ is the origin, which has norm zero and is infeasible. A liquid engine cannot throttle below some minimum, so the physically honest landing problem contains exactly this nonconvex constraint. The second-order cone programming lesson shows how the lower bound is handled without giving up convexity.
:::

::: example Which parts of a landing feasible set are convex?
A lander at position $\mathbf{r} = (r_x, r_y, r_z)$ (with $r_z$ altitude above the pad at the origin) and thrust acceleration $\mathbf{u}$ is subject to four constraints. Classify each.

1. **Glide slope**: $\sqrt{r_x^2 + r_y^2} \le r_z\tan\gamma$ with $\gamma = 4^\circ$ the cone half-angle measured from the vertical: the vehicle must stay inside a narrow cone above the pad. With $\tan 4^\circ = 0.0699$ this reads $\|(r_x, r_y)\|_2 \le 0.0699\,r_z$: a second-order cone in $(r_x, r_y, r_z)$, convex. At 100 m altitude the allowed horizontal offset is $6.99\,\mathrm{m}$.
2. **Thrust upper bound**: $\|\mathbf{u}\|_2 \le 3g_0 = 29.4\,\mathrm{m/s^2}$. A Euclidean ball, convex.
3. **Thrust pointing**: the thrust vector must stay within $45^\circ$ of vertical, $u_z \ge \|\mathbf{u}\|_2\cos 45^\circ$, i.e. $\|\mathbf{u}\|_2 \le u_z/\cos 45^\circ = 1.414\,u_z$. A second-order cone with axis along $u_z$, convex.
4. **Thrust lower bound**: $\|\mathbf{u}\|_2 \ge 0.4 \times 29.4 = 11.8\,\mathrm{m/s^2}$. Take $\mathbf{u}_1 = (0, 0, 11.8)$ and $\mathbf{u}_2 = (0, 11.8, 0)$ – both feasible, at norm exactly $11.8$. Their midpoint is $(0, 5.9, 5.9)$ with norm $8.34 < 11.8$: infeasible. Not convex.

Three of four constraints are convex, and their intersection is convex. The fourth, and the nonlinear equations of motion for a vehicle whose mass changes as it burns, are the two obstacles between the landing problem and convexity.
:::

## Convex functions

> A function $f : \mathbb{R}^n \to \mathbb{R}$ is **convex** if its domain is a convex set and for all $\mathbf{x}, \mathbf{y}$ in the domain and $\theta \in [0, 1]$, $f(\theta\mathbf{x} + (1-\theta)\mathbf{y}) \le \theta f(\mathbf{x}) + (1-\theta) f(\mathbf{y})$.

Written out on its own line, the defining inequality is

$$
f(\theta\mathbf{x} + (1-\theta)\mathbf{y}) \le \theta f(\mathbf{x}) + (1-\theta) f(\mathbf{y}) .
$$

The right-hand side is the chord between $(\mathbf{x}, f(\mathbf{x}))$ and $(\mathbf{y}, f(\mathbf{y}))$; the left is the graph beneath it. Convex means the graph lies on or below every chord – the bowl shape. If the inequality is strict whenever $\mathbf{x} \ne \mathbf{y}$ and $\theta \in (0,1)$ the function is **strictly convex**. A function $f$ is **concave** if $-f$ is convex; the graph lies above its chords. An affine function $\mathbf{a}^\top\mathbf{x} + b$ is both convex and concave, since the inequality holds with equality.

Equivalently, $f$ is convex exactly when its **epigraph** $\{(\mathbf{x}, t) : t \ge f(\mathbf{x})\}$, the region on and above the graph, is a convex set. This ties the two definitions together and is the reason set-based facts transfer to functions.

Two calculus characterisations save you from checking chords. For differentiable $f$ on a convex domain, convexity is equivalent to the **first-order condition**

$$
f(\mathbf{y}) \ge f(\mathbf{x}) + \nabla f(\mathbf{x})^\top(\mathbf{y} - \mathbf{x}) \quad \text{for all } \mathbf{x}, \mathbf{y},
$$

which says the tangent plane at any point lies below the whole graph. This is the inequality that makes convex optimisation work: the local information $\nabla f(\mathbf{x})$ gives a *global* lower bound on $f$. In particular, if $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ then $f(\mathbf{y}) \ge f(\mathbf{x}^\star)$ for every $\mathbf{y}$ – a stationary point of a convex function is a global minimiser.

For twice-differentiable $f$, convexity is equivalent to the **second-order condition**

$$
\nabla^2 f(\mathbf{x}) \succeq 0 \quad \text{for all } \mathbf{x} \text{ in the domain},
$$

the Hessian positive semidefinite everywhere. (Deriving the first-order condition from the chord definition: rearrange to $f(\mathbf{y}) - f(\mathbf{x}) \ge [f(\mathbf{x} + \theta(\mathbf{y} - \mathbf{x})) - f(\mathbf{x})]/\theta$ and let $\theta \to 0$; the right side becomes the directional derivative $\nabla f(\mathbf{x})^\top(\mathbf{y} - \mathbf{x})$. The second-order condition follows by expanding the first-order one to second order.) In one variable this is $f'' \ge 0$: the slope never decreases.

::: key Convex function
$f(\theta x + (1-\theta) y) \le \theta f(x) + (1-\theta) f(y)$ for $\theta \in [0,1]$: the graph lies below every chord. Twice-differentiable equivalent: $\nabla^2 f \succeq 0$ everywhere. First-order equivalent: $f(y) \ge f(x) + \nabla f(x)^\top (y - x)$, the tangent plane is a global underestimator.
:::

Functions you should recognise as convex without computation:

- Affine functions $\mathbf{a}^\top\mathbf{x} + b$ (also concave).
- Every norm: $\|\mathbf{x}\|_1$, $\|\mathbf{x}\|_2$, $\|\mathbf{x}\|_\infty$, by the triangle inequality and homogeneity. Note that $\|\mathbf{x}\|_2$ is convex but *not* differentiable at the origin; convexity does not need smoothness.
- Quadratic forms $\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x} + r$ with $\mathbf{P} \succeq 0$, since the Hessian is $2\mathbf{P}$. With $\mathbf{P} \succ 0$ they are strictly convex. Least-squares costs $\|\mathbf{A}\mathbf{x} - \mathbf{b}\|_2^2$ have $\mathbf{P} = \mathbf{A}^\top\mathbf{A} \succeq 0$.
- $e^{ax}$ for any real $a$; $x^p$ on $x > 0$ for $p \ge 1$ or $p \le 0$; $-\log x$ on $x > 0$ (second derivative $1/x^2 > 0$); $x\log x$ on $x > 0$.
- The log-sum-exp $\log(e^{x_1} + \dots + e^{x_n})$, a smooth approximation of $\max_i x_i$.
- The pointwise maximum of affine functions, $\max_i(\mathbf{a}_i^\top\mathbf{x} + b_i)$ – a piecewise-linear bowl.

And functions that are not: $x^3$ on the real line ($f'' = 6x$ changes sign); $\sin x$; $\sqrt{x}$ on $x > 0$ (concave); products like $x_1 x_2$ (Hessian has eigenvalues $\pm 1$); and any function with more than one strict local minimum.

## Closure rules: building a verdict without differentiating

The Hessian test is decisive but often painful, and impossible for nonsmooth functions. Faster is to recognise a function as assembled from known convex pieces by operations that preserve convexity:

1. **Nonnegative weighted sums.** If $f_1, \dots, f_k$ are convex and $w_i \ge 0$, then $\sum_i w_i f_i$ is convex. (Chords add.) A propellant cost plus a weighted tracking-error penalty is convex if each is.
2. **Composition with an affine map.** If $f$ is convex then $g(\mathbf{x}) = f(\mathbf{A}\mathbf{x} + \mathbf{b})$ is convex. Hence $\|\mathbf{A}\mathbf{x} - \mathbf{b}\|_2$ is convex for any $\mathbf{A}, \mathbf{b}$: a norm composed with an affine map.
3. **Pointwise maximum.** If $f_1, \dots, f_k$ are convex then $\max_i f_i(\mathbf{x})$ is convex. (The epigraph of the max is the intersection of the epigraphs.) This extends to a supremum over an infinite family, which is how the largest eigenvalue $\lambda_{\max}(\mathbf{X}) = \sup_{\|\mathbf{z}\|=1}\mathbf{z}^\top\mathbf{X}\mathbf{z}$ is seen to be convex in $\mathbf{X}$.
4. **Composition.** If $h$ is convex and nondecreasing and $g$ is convex, then $h(g(\mathbf{x}))$ is convex. So $e^{\|\mathbf{x}\|}$ and $\|\mathbf{A}\mathbf{x} - \mathbf{b}\|_2^2$ (square is convex and nondecreasing on the nonnegative range of a norm) are convex. If $h$ is convex and nonincreasing and $g$ is concave, $h(g(\mathbf{x}))$ is again convex: $-\log(b - \mathbf{a}^\top\mathbf{x})$ on the halfspace where it is defined, the barrier function that interior-point methods are built from.
5. **Partial minimisation.** If $f(\mathbf{x}, \mathbf{y})$ is jointly convex and $C$ is convex, then $\inf_{\mathbf{y} \in C} f(\mathbf{x}, \mathbf{y})$ is convex in $\mathbf{x}$. The optimal cost of a convex program is a convex function of the constraint bounds – this is why the shadow prices of lesson 2 behave so well.

What is *not* on the list: differences of convex functions, products, and compositions in the wrong order. $-\log x$ is convex and $x^2$ is convex, but $-\log x - x^2$ is a difference, and its second derivative $1/x^2 - 2$ is negative for $x > 1/\sqrt{2} = 0.707$. Sums with negative weights break convexity as a rule, not as an exception.

::: example Three functions, three verdicts
**(a)** $f(x, y) = x^2 - xy + y^2$. Hessian $\begin{bmatrix} 2 & -1 \\ -1 & 2 \end{bmatrix}$, constant, with eigenvalues $1$ and $3$, both positive: strictly convex everywhere. Alternatively, complete the square: $f = (x - y/2)^2 + \tfrac{3}{4}y^2$, a nonnegative sum of squares of affine functions – closure rule 1 applied to rule 2.

**(b)** $f(x, y) = x^2 y^2$. Hessian $\begin{bmatrix} 2y^2 & 4xy \\ 4xy & 2x^2 \end{bmatrix}$ with determinant $4x^2y^2 - 16x^2y^2 = -12x^2y^2$, negative wherever $xy \ne 0$; at $(1,1)$ it is $-12$. A negative determinant means eigenvalues of opposite sign, so the Hessian is indefinite: not convex. Indeed along $x = y = t$ the function is $t^4$ (convex) but along $x = 1/y$ it is constant while the segment between $(2, 0.5)$ and $(0.5, 2)$ passes through $(1.25, 1.25)$ where $f = 2.44 > 1$: the graph pokes above the chord.

**(c)** Rosenbrock's $f(x, y) = (1-x)^2 + 100(y - x^2)^2$. It is a sum of two squares, which looks like rule 1 – but the inner function $y - x^2$ is not affine, so rule 2 does not apply, and squaring a nonconvex function is not covered by rule 4. The Hessian's top-left entry, $2 - 400(y - x^2) + 800x^2$, equals $-398$ at $(0, 1)$: a negative diagonal entry means the Hessian is not positive semidefinite there. Not convex, which is why it is the standard stress test for local methods.
:::

::: example Jensen's inequality and the rocket equation
The definition of convexity with $\theta = \tfrac{1}{2}$ says $f\!\left(\tfrac{x+y}{2}\right) \le \tfrac{f(x) + f(y)}{2}$: the function of the average is at most the average of the function. This is the simplest case of **Jensen's inequality**, and it gives a quick numerical convexity check.

The mass ratio required for a velocity change $\Delta v$ with exhaust velocity $v_e = I_{sp} g_0$ is $f(\Delta v) = e^{\Delta v / v_e}$. For $I_{sp} = 311\,\mathrm{s}$, $v_e = 311 \times 9.80665 = 3050\,\mathrm{m/s}$. Compare $\Delta v = 1000$ and $3000\,\mathrm{m/s}$ with their average $2000\,\mathrm{m/s}$:

$$
f(1000) = 1.388,\quad f(3000) = 2.674,\quad \tfrac{1}{2}\big(f(1000) + f(3000)\big) = 2.031,\quad f(2000) = 1.927 .
$$

The chord midpoint $2.031$ lies above the graph value $1.927$, as convexity demands, and the gap of about 5 % is the curvature of the exponential over that interval. The check does not *prove* convexity (one chord is not all chords), but a single violation *disproves* it, which is what you usually need when a suspicious expression turns up in a cost function.
:::

## Convex optimisation problems

A **convex optimisation problem** in standard form is

$$
\begin{aligned}
\text{minimise}\quad & f(\mathbf{x}) \\
\text{subject to}\quad & g_i(\mathbf{x}) \le 0, \quad i = 1,\dots,m, \\
& \mathbf{A}\mathbf{x} = \mathbf{b},
\end{aligned}
$$

with $f$ and every $g_i$ convex and the equality constraints **affine**. The feasible set is then convex: each $\{\mathbf{x} : g_i(\mathbf{x}) \le 0\}$ is a **sublevel set** of a convex function, which is convex (if $g_i(\mathbf{x}) \le 0$ and $g_i(\mathbf{y}) \le 0$ then by the chord inequality $g_i$ on the segment is at most $0$), the affine set $\{\mathbf{A}\mathbf{x} = \mathbf{b}\}$ is convex, and intersections are convex.

Two subtleties catch people.

First, the standard form matters. The problem "minimise $x^2$ subject to $x^2 \ge 1$" has a convex objective and a convex constraint *function*, but the constraint is written as $\ge$, the feasible set $|x| \ge 1$ is not convex, and the problem has two separated minimisers at $\pm 1$. Convexity of a problem is a property of the objective and the feasible *set*, and the standard form (convex $\le 0$, affine $= 0$) is the way of writing constraints that guarantees a convex set.

Second, **nonlinear equality constraints are nonconvex**, full stop. The set $\{\mathbf{x} : h(\mathbf{x}) = 0\}$ for nonaffine $h$ is a curved surface, and a segment between two of its points leaves it. The equations of motion of a rocket, $\dot{\mathbf{v}} = \mathbf{T}/m + \mathbf{g}$ with $\dot m = -\|\mathbf{T}\|/v_e$, are nonlinear in the unknowns because thrust is divided by a mass that is itself a variable. Writing them as equality constraints produces a nonconvex problem no matter how convex everything else is. The landing-guidance literature spends a great deal of effort on exactly this point – changing variables so that the dynamics become affine – and the next lessons return to it.

::: warning Convex is not the same as smooth, or bowl-shaped in one variable
Learners tend to conflate three different things. A function can be convex without being differentiable ($|x|$, any norm). A function can be smooth and bowl-shaped along every coordinate axis and still not be convex ($x^2y^2$ above, whose restriction to each axis is a parabola or a constant). And a *set* can be convex while the function used to describe it is not: $\{\mathbf{x} : \|\mathbf{x}\|_2^2 \le 1\}$ is the same convex ball whether you write its constraint as $\|\mathbf{x}\|_2^2 - 1 \le 0$ or as $\log\|\mathbf{x}\|_2^2 \le 0$, and the second constraint function is not convex. Convexity of the *set* is what matters for the feasible region; convexity of the *constraint functions* is a sufficient condition for it, and the one that solvers and modelling tools can verify.
:::

## Check yourself

::: check
Is the set $\{(x, y) : y \ge x^2\}$ convex? Is $\{(x, y) : y \le x^2\}$? Give a one-line reason for each.
:::

::: answer
The first is the epigraph of the convex function $x^2$, hence convex. The second is the region below a parabola: the points $(-1, 1)$ and $(1, 1)$ are both in it (each has $y = x^2$), but their midpoint $(0, 1)$ has $y = 1 > 0 = x^2$, so it is outside. Not convex.
:::

::: check
Without differentiating, decide whether $f(\mathbf{x}) = \|\mathbf{A}\mathbf{x} - \mathbf{b}\|_2 + 3\max(x_1, x_2 - 1) + e^{\mathbf{c}^\top\mathbf{x}}$ is convex.
:::

::: answer
Yes. $\|\mathbf{A}\mathbf{x} - \mathbf{b}\|_2$ is a norm composed with an affine map (rule 2). $\max(x_1, x_2 - 1)$ is a pointwise maximum of affine functions (rule 3), and multiplying by $3 \ge 0$ keeps convexity. $e^{\mathbf{c}^\top\mathbf{x}}$ is the convex exponential composed with an affine map. The sum of three convex functions with nonnegative weights is convex (rule 1).
:::

::: check
The constraint "the vehicle must be at least 50 m from a hazard at $\mathbf{p}$": $\|\mathbf{r} - \mathbf{p}\|_2 \ge 50$. Is the set of allowed positions convex? Show it with two specific points.
:::

::: answer
No. Take $\mathbf{r}_1 = \mathbf{p} + (50, 0, 0)$ and $\mathbf{r}_2 = \mathbf{p} - (50, 0, 0)$, both exactly 50 m from the hazard and feasible. Their midpoint is $\mathbf{p}$ itself, at distance zero, which is forbidden. A keep-out zone is the complement of a ball and is never convex; the usual remedy is to replace it with a halfspace (a plane that separates the trajectory from the hazard), which is convex but more conservative.
:::

::: check
For which values of the constant $a$ is $f(x, y) = x^2 + a\,xy + y^2$ convex on $\mathbb{R}^2$?
:::

::: answer
The Hessian is constant, $\begin{bmatrix} 2 & a \\ a & 2 \end{bmatrix}$, with eigenvalues $2 \pm a$. Both are nonnegative exactly when $|a| \le 2$. So $f$ is convex for $-2 \le a \le 2$, strictly convex for $|a| < 2$, and indefinite (a saddle) for $|a| > 2$. At $a = \pm 2$ the function is $(x \pm y)^2$, convex but flat along a line.
:::

::: check
A colleague says: "the feasible set is defined by $g(\mathbf{x}) \le 0$ and I checked that $g$ is not convex, so the problem is nonconvex." Is the conclusion justified?
:::

::: answer
Not necessarily. Convexity of $g$ is sufficient for the sublevel set to be convex, not necessary. The set $\{\mathbf{x} : \log\|\mathbf{x}\|_2^2 \le 0\}$ is the unit ball, which is convex, although the constraint function is not. The problem may be convex under a different description of the same set, for instance $\|\mathbf{x}\|_2^2 - 1 \le 0$. The right question is whether the feasible *set* is convex, and if it is, whether it can be written with convex constraint functions so a solver can exploit it.
:::

## Summary

| Symbol / result | Meaning |
| --- | --- |
| $\theta\mathbf{x} + (1-\theta)\mathbf{y} \in C$, $\theta \in [0,1]$ | Convex set: segments stay inside |
| Halfspace, polyhedron, norm ball, second-order cone, PSD cone | Convex sets to recognise on sight |
| Intersection, affine image and preimage | Operations that preserve set convexity (union and complement do not) |
| $f(\theta\mathbf{x} + (1-\theta)\mathbf{y}) \le \theta f(\mathbf{x}) + (1-\theta)f(\mathbf{y})$ | Convex function: graph below every chord |
| $f(\mathbf{y}) \ge f(\mathbf{x}) + \nabla f(\mathbf{x})^\top(\mathbf{y} - \mathbf{x})$ | First-order condition: tangent plane is a global underestimator |
| $\nabla^2 f \succeq 0$ everywhere | Second-order condition |
| Nonnegative sums, affine composition, pointwise max, monotone composition | Closure rules for building convex functions |
| Convex $f$, convex $g_i \le 0$, affine $\mathbf{A}\mathbf{x} = \mathbf{b}$ | Standard form of a convex optimisation problem |
| $\|\mathbf{u}\|_2 \le u_{\max}$ convex; $\|\mathbf{u}\|_2 \ge u_{\min}$ not | The thrust-bound asymmetry at the heart of landing guidance |
| Nonlinear equality constraint | Always nonconvex |

The next lesson cashes in these definitions: for a convex problem every local minimum is global, every KKT point is optimal, the problem can be solved in a provably bounded number of steps, and a solver can hand back a certificate that its answer is right.
