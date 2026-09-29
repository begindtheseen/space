---
id: l01-descent-and-line-search
title: "Finding the bottom: descent, line search and Newton's method"
minutes: 24
covers:
  - "unconstrained optimization: gradient descent, Newton, BFGS, line search, trust region"
---

Imagine standing on a hillside in thick fog. You want the lowest point in the valley, but you can only see the ground under your boots. So you feel which way the ground slopes, take a step downhill, and feel again. How big a step? Too small and you walk all night. Too big and you stride across the valley floor and up the other side.

Almost every guidance computation is a "find the lowest point" problem in disguise. A fuel-optimal transfer wants the thrust history that reaches the target orbit with the least propellant. Powered-descent guidance wants the thrust history that sets a lander on its pad, at rest, inside the engine's throttle range. Even a **[[Kalman filter|kalman-least-squares]]**, the estimator that blends sensor readings into one best guess, is solving a least-squares problem at every update.

This lesson starts with no rules in the way: a smooth function of several variables, and how to walk downhill on it. You will meet the two ideas every later algorithm reuses — a direction that goes down, and a step length that is neither timid nor reckless — and then two faster walkers: **Newton's method**, which feels how the ground curves, and **BFGS**, which learns the curve as it goes.

## Writing down an optimization problem

An optimization problem has three parts, like a shopping trip: what you choose, what you pay, and the rules. Every problem in this module can be written as

$$
\begin{aligned}
\text{minimize}\quad & f(\mathbf{x}) \\
\text{subject to}\quad & g_i(\mathbf{x}) \le 0, \quad i = 1,\dots,m, \\
& h_j(\mathbf{x}) = 0, \quad j = 1,\dots,p.
\end{aligned}
$$

- $\mathbf{x}$ is the **decision variable**, the list of $n$ numbers you choose, written $\mathbf{x} \in \mathbb{R}^n$ ("x in R n").
- $f$ is the **objective**, or cost: the single number you want small.
- The $g_i$ are **inequality constraints** ("this must be at most zero").
- The $h_j$ are **equality constraints** ("this must be exactly zero").

A point that obeys every rule is **feasible**, and all of them together make the **feasible set**. The smallest value $f$ takes there is the **optimal value** $p^\star$ ("p star"). A feasible $\mathbf{x}^\star$ with $f(\mathbf{x}^\star) = p^\star$ is a **minimizer**. To maximize something, minimize its negative, so "minimize" loses nothing.

In powered descent, the decision variable stacks the thrust vector at each of $N$ time steps. The objective is propellant. The equalities are the equations of motion and the requirement to stop at the pad. The inequalities are the throttle limits and two cones: one the vehicle must stay inside, one the thrust must point inside. With $N = 100$ steps in three dimensions that is a few hundred variables and constraints.

### Local and global

A mountain range has several valleys. Each valley floor is lower than everything nearby, but only one is the lowest in the whole range.

A point $\mathbf{x}^\star$ is a **[[local minimizer|local-global]]** if $f(\mathbf{x}^\star) \le f(\mathbf{x})$ for every feasible $\mathbf{x}$ in some small ball around it. It is a **global minimizer** if that holds for every feasible $\mathbf{x}$. An algorithm that feels only the slope under its feet can find only local minimizers; it cannot know a deeper valley lies over the ridge. That gap is the whole reason convexity matters, and it is the subject of lessons 3 and 4.

For the rest of this lesson there are no constraints ($m = p = 0$), and $f$ is smooth: its first and second derivatives exist and change continuously.

## What the bottom of a valley looks like

Picture a marble at the bottom of a salad bowl. The floor is flat there, and the bowl curves *up* whichever way you move. Those two facts are the conditions for a minimum.

To make them precise, take a small step $\mathbf{p}$ from a point $\mathbf{x}$. Taylor's formula from the calculus module says

$$
f(\mathbf{x} + \mathbf{p}) = f(\mathbf{x}) + \nabla f(\mathbf{x})^\top \mathbf{p} + \tfrac{1}{2}\,\mathbf{p}^\top \nabla^2 f(\mathbf{x})\,\mathbf{p} + o(\|\mathbf{p}\|^2).
$$

- $\nabla f$ ("grad f") is the **gradient**, the column of partial derivatives $\partial f / \partial x_i$. It points straight uphill, and its length is the steepness.
- $\nabla^2 f$ is the **[[Hessian|hessian-name]]**, the symmetric $n \times n$ matrix of second partial derivatives $\partial^2 f / \partial x_i \partial x_j$. It says how the slope bends.
- $o(\|\mathbf{p}\|^2)$ ("little o") stands for leftovers that shrink faster than $\|\mathbf{p}\|^2$.

### The floor is flat

**First-order necessary condition.** At a local minimizer,

$$
\nabla f(\mathbf{x}^\star) = \mathbf{0}.
$$

If the gradient were not zero, a tiny step along $-\nabla f$ would go downhill, so $\mathbf{x}^\star$ would not be lowest nearby.

::: note Why the gradient has to vanish
Suppose $\mathbf{x}^\star$ is a local minimizer but $\nabla f(\mathbf{x}^\star) \ne \mathbf{0}$. Take $\mathbf{p} = -\epsilon \nabla f(\mathbf{x}^\star)$ with $\epsilon > 0$ small. The first-order term of Taylor's formula is $-\epsilon \|\nabla f(\mathbf{x}^\star)\|^2 < 0$. The rest is proportional to $\epsilon^2$, so for small enough $\epsilon$ the negative term wins and $f(\mathbf{x}^\star + \mathbf{p}) < f(\mathbf{x}^\star)$ — a lower point right next door, which contradicts minimality.
:::

A point with zero gradient is a **stationary point**. Every minimizer is stationary, but a hilltop is flat too, and so is a **[[saddle|saddle-point]]**: a point that is lowest along one direction and highest along another.

### The bowl curves up

**Second-order conditions.** At a stationary point the slope term is gone, so

$$
f(\mathbf{x}^\star + \mathbf{p}) - f(\mathbf{x}^\star) \approx \tfrac{1}{2}\,\mathbf{p}^\top \nabla^2 f(\mathbf{x}^\star)\,\mathbf{p}.
$$

If some direction had $\mathbf{p}^\top \nabla^2 f\, \mathbf{p} < 0$, the ground would curve down that way. So a local minimizer needs a **positive semidefinite** Hessian, written $\nabla^2 f(\mathbf{x}^\star) \succeq 0$: all eigenvalues $\ge 0$. That is the **second-order necessary condition**.

Going the other way: if $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ and the Hessian is **positive definite**, $\nabla^2 f(\mathbf{x}^\star) \succ 0$ (all eigenvalues strictly positive), then $\mathbf{x}^\star$ is a strict local minimizer. The ground curves up in every direction at least as fast as the smallest eigenvalue allows, $\mathbf{p}^\top \nabla^2 f\, \mathbf{p} \ge \lambda_{\min}\|\mathbf{p}\|^2$, and for small steps that beats the leftovers. This is the **second-order sufficient condition**.

### The test function

The stress test for this lesson and its exercise is **[[Rosenbrock's function|rosenbrock-banana]]**:

$$
f(x, y) = (1 - x)^2 + 100\,(y - x^2)^2 ,
$$

$$
\nabla f = \begin{bmatrix} -2(1-x) - 400\,x\,(y - x^2) \\ 200\,(y - x^2) \end{bmatrix},
\qquad
\nabla^2 f = \begin{bmatrix} 2 - 400\,(y - x^2) + 800\,x^2 & -400\,x \\ -400\,x & 200 \end{bmatrix}.
$$

Its only stationary point is $(1, 1)$, where $f = 0$. There the Hessian is $\begin{bmatrix} 802 & -400 \\ -400 & 200 \end{bmatrix}$, with eigenvalues about $0.399$ and $1001.6$. Both positive: a strict local minimum. But the ground curves about $2{,}510$ times more steeply one way than the other. The minimum sits in a long, narrow, curved valley, and that ratio will matter.

::: key Optimality conditions for unconstrained problems
Necessary: $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ and $\nabla^2 f(\mathbf{x}^\star) \succeq 0$. Sufficient: $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ and $\nabla^2 f(\mathbf{x}^\star) \succ 0$. A descent direction satisfies $\nabla f^\top\mathbf{p} < 0$; the Armijo condition $f(\mathbf{x} + \alpha\mathbf{p}) \le f(\mathbf{x}) + c_1\alpha\nabla f^\top\mathbf{p}$ makes backtracking safe.
:::

## Which way is downhill

Every method here walks the same way. From the current guess $\mathbf{x}_k$ it picks a direction $\mathbf{p}_k$ and a step length $\alpha_k > 0$ ("alpha") and moves to $\mathbf{x}_{k+1} = \mathbf{x}_k + \alpha_k \mathbf{p}_k$.

The rate at which $f$ changes as you set off along $\mathbf{p}_k$ is the **directional derivative** $\nabla f(\mathbf{x}_k)^\top \mathbf{p}_k$. If it is negative, the start of the step goes downhill. So $\mathbf{p}_k$ is a **descent direction** exactly when

$$
\nabla f(\mathbf{x}_k)^\top \mathbf{p}_k < 0 .
$$

Among directions of length one, the most negative directional derivative belongs to $\mathbf{p} = -\nabla f / \|\nabla f\|$. (By the **Cauchy–Schwarz inequality**, $\nabla f^\top \mathbf{p} \ge -\|\nabla f\|\,\|\mathbf{p}\|$, with equality only when $\mathbf{p}$ points exactly opposite $\nabla f$.) So $-\nabla f$ is the **steepest-descent direction**.

It is not the only good one. For any positive definite matrix $\mathbf{B}_k$, the direction $\mathbf{p}_k = -\mathbf{B}_k^{-1}\nabla f(\mathbf{x}_k)$ gives $\nabla f^\top \mathbf{p}_k = -\nabla f^\top \mathbf{B}_k^{-1}\nabla f < 0$, because the inverse of a positive definite matrix is positive definite too. The methods in this lesson are different choices of $\mathbf{B}_k$:

- **gradient descent** uses $\mathbf{B}_k = \mathbf{I}$, the identity;
- **Newton's method** uses the Hessian, $\mathbf{B}_k = \nabla^2 f(\mathbf{x}_k)$;
- **quasi-Newton** methods such as BFGS build an approximate Hessian as they go.

## How far to step: line search

Choosing how far to go along $\mathbf{p}_k$ is a **line search**: a search along one line.

The perfect choice, the **exact line search**, takes the $\alpha$ that makes $\phi(\alpha) = f(\mathbf{x}_k + \alpha \mathbf{p}_k)$ ("phi of alpha") smallest. For a quadratic $f(\mathbf{x}) = \tfrac{1}{2}\mathbf{x}^\top\mathbf{A}\mathbf{x} - \mathbf{b}^\top\mathbf{x}$ there is a formula. With $\mathbf{g}_k = \nabla f(\mathbf{x}_k) = \mathbf{A}\mathbf{x}_k - \mathbf{b}$, setting $\phi'(\alpha) = 0$ gives $\mathbf{g}_k^\top\mathbf{p}_k + \alpha\,\mathbf{p}_k^\top\mathbf{A}\mathbf{p}_k = 0$, so

$$
\alpha_k = -\frac{\mathbf{g}_k^\top\mathbf{p}_k}{\mathbf{p}_k^\top\mathbf{A}\mathbf{p}_k}.
$$

For a general $f$ the exact search costs many function evaluations. A good-enough step, found cheaply, is better.

### Backtracking and the Armijo condition

**Backtracking** starts with a full step, $\alpha = 1$, and multiplies it by a factor $\rho$ ("rho", between 0 and 1) until the step passes a test.

"The function went down" is not a good enough test: the decreases could shrink to nothing and the walk could stall far from the bottom. Instead we demand a decrease in proportion to the slope and the step length. That is the **[[Armijo condition|armijo-picture]]**, or sufficient-decrease condition:

$$
f(\mathbf{x}_k + \alpha\mathbf{p}_k) \le f(\mathbf{x}_k) + c_1\,\alpha\,\nabla f(\mathbf{x}_k)^\top \mathbf{p}_k,
\qquad 0 < c_1 < 1 .
$$

The right side is a straight line starting at the current height with a fraction $c_1$ of the starting slope. A step passes if it lands on or below that line. Typical values are $c_1 = 10^{-4}$ and $\rho = 0.5$. The loop always ends: along a descent direction the ground starts off falling faster than the line, so small enough steps pass. Starting at $\alpha = 1$ suits Newton-type directions, whose natural step is $1$.

A complete line search also refuses steps that are too timid. The **Wolfe curvature condition** asks that the slope where you stop be less steep than a fraction $c_2$ of the starting slope, $\nabla f(\mathbf{x}_k + \alpha\mathbf{p}_k)^\top\mathbf{p}_k \ge c_2\,\nabla f(\mathbf{x}_k)^\top\mathbf{p}_k$, with $c_1 < c_2 < 1$ and $c_2 = 0.9$ common. Backtracking from $\alpha = 1$ usually passes it anyway, so simple codes skip it. BFGS needs it, as you will see.

::: example Backtracking on Rosenbrock's first step
Start gradient descent at the standard point $\mathbf{x}_0 = (-1.2, 1.0)$, with $c_1 = 10^{-4}$ and $\rho = 0.5$.

**Where you are.** $f(\mathbf{x}_0) = 24.2$ and $\nabla f = (-215.6, -88.0)$, of length $232.9$. The direction is $\mathbf{p}_0 = -\nabla f = (215.6, 88.0)$, and the starting slope is $\nabla f^\top\mathbf{p}_0 = -232.9^2 = -54{,}227$ — negative, as it must be.

**Try $\alpha = 1$.** The trial point is $(-1.2 + 215.6,\ 1.0 + 88.0) = (214.4, 89)$, where $f \approx 2 \times 10^{11}$. Rejected.

**Keep halving.** The test fails for $\alpha = 1, \tfrac{1}{2}, \dots, \tfrac{1}{512}$. After ten halvings, $\alpha = 2^{-10} = 9.77 \times 10^{-4}$, the trial point is $(-0.989, 1.086)$ and $f = 5.10$.

**Check the test.** The Armijo line there is at $24.2 - 10^{-4} \times 9.77 \times 10^{-4} \times 54{,}227 = 24.19$. Since $5.10 \le 24.19$, the step is accepted.

**Does it make sense?** Eleven function evaluations bought a move of only $0.23$ units. The gradient is huge but the valley narrow, so the algorithm had to find the right scale by trial.
:::

::: warning Fixed steps and unit mistakes
With a fixed $\alpha$ and no line search, gradient descent on a quadratic whose largest Hessian eigenvalue is $L$ blows up for $\alpha > 2/L$ and is safe for $\alpha \le 1/L$. On Rosenbrock, $L$ runs from about $200$ near the origin to over $2{,}000$ in the valley, so no fixed step works everywhere. In GNC the same trap arrives through units: a state mixing meters and radians, or seconds and kilometers, spreads the Hessian's eigenvalues over many powers of ten. Scale the variables so a change of $1$ in each is about equally important before you run anything.
:::

## Gradient descent and the condition number

**Gradient descent** always steps along the steepest-descent direction:

$$
\mathbf{x}_{k+1} = \mathbf{x}_k - \alpha_k \nabla f(\mathbf{x}_k).
$$

Each step costs one gradient, no matrix work. How many steps does it need?

Test it on a perfect bowl, $f(\mathbf{x}) = \tfrac{1}{2}\mathbf{x}^\top\mathbf{A}\mathbf{x}$ with $\mathbf{A} \succ 0$ and bottom at $\mathbf{0}$. The gradient is $\mathbf{A}\mathbf{x}$, so a fixed step gives $\mathbf{x}_{k+1} = (\mathbf{I} - \alpha\mathbf{A})\,\mathbf{x}_k$. Along an eigenvector of $\mathbf{A}$ with eigenvalue $\lambda_i$, the matrix acts like the number $\lambda_i$, so that piece of the error is multiplied by $1 - \alpha\lambda_i$ every step.

That sets up a tug of war. A big $\alpha$ suits the flat directions (small $\lambda$) but overshoots in the steep ones. A small $\alpha$ is safe in the steep directions but crawls in the flat ones. The best compromise, $\alpha = 2/(\lambda_{\min} + \lambda_{\max})$, shrinks the error each step by

$$
\frac{\lambda_{\max} - \lambda_{\min}}{\lambda_{\max} + \lambda_{\min}} = \frac{\kappa - 1}{\kappa + 1},
\qquad \kappa = \frac{\lambda_{\max}}{\lambda_{\min}} .
$$

The number $\kappa$ ("kappa") is the **condition number** of the Hessian: how much more sharply the bowl curves in its steepest direction than its flattest. A round bowl has $\kappa = 1$; a long thin trough has a huge $\kappa$. With exact line search the function value obeys a matching bound, $f(\mathbf{x}_{k}) \le \left(\frac{\kappa-1}{\kappa+1}\right)^{2k} f(\mathbf{x}_0)$.

Either way the convergence is **linear**: the error shrinks by a fixed factor each step. For large $\kappa$ that factor is about $1 - 2/\kappa$, painfully close to $1$, and cutting the error by $10^{6}$ takes about $\kappa \ln(10^6)/2 \approx 6.9\,\kappa$ iterations. **The iteration count grows in proportion to the condition number.** In a picture: the level curves of an ill-conditioned bowl are long thin ellipses, the gradient points almost straight across the narrow way, and the walk **[[zig-zags|zigzag-picture]]** between the walls instead of heading down the valley. Near the minimizer of any smooth $f$ the same holds, with $\kappa$ the condition number of $\nabla^2 f(\mathbf{x}^\star)$.

::: note Why gradient descent always makes progress
Suppose the gradient never changes too fast: $\|\nabla f(\mathbf{x}) - \nabla f(\mathbf{y})\| \le L\|\mathbf{x} - \mathbf{y}\|$ everywhere (the gradient is **Lipschitz** with constant $L$). Integrating the gradient along the segment from $\mathbf{x}$ to $\mathbf{y}$ and bounding how much it can change gives the **descent lemma**:

$$
f(\mathbf{y}) \le f(\mathbf{x}) + \nabla f(\mathbf{x})^\top(\mathbf{y} - \mathbf{x}) + \tfrac{L}{2}\|\mathbf{y} - \mathbf{x}\|^2 .
$$

Put in $\mathbf{y} = \mathbf{x} - \tfrac{1}{L}\nabla f(\mathbf{x})$. The middle term becomes $-\tfrac{1}{L}\|\nabla f\|^2$ and the last $+\tfrac{1}{2L}\|\nabla f\|^2$, so

$$
f(\mathbf{y}) \le f(\mathbf{x}) - \tfrac{1}{2L}\|\nabla f(\mathbf{x})\|^2 .
$$

A step of $1/L$ always goes down, by an amount set by the gradient. It stalls only where the gradient is small — which is where you want to be.
:::

::: example Steepest descent on a stretched bowl
Take $f(x_1, x_2) = \tfrac{1}{2}(x_1^2 + \kappa\,x_2^2)$, like a controller's cost that weights one error $\kappa$ times more than another. Start from $(\kappa, 1)$, use exact line search, and stop when $f$ has fallen by $10^{6}$.

**$\kappa = 10$.** The factor per iteration in $f$ is $\left(\frac{9}{11}\right)^2 = 0.669$. The bound predicts $\ln(10^{-6})/\ln 0.669 = 34.4$ iterations; the run takes $35$.

**$\kappa = 100$.** Factor $\left(\frac{99}{101}\right)^2 = 0.9608$; the run takes $346$ iterations.

**$\kappa = 1000$.** Factor $0.99601$; the run takes $3{,}454$ iterations.

**The pattern.** Ten times the condition number, ten times the iterations, as predicted.

**Back to Rosenbrock.** Its valley has $\kappa \approx 2{,}500$ at the solution and worse further out. From $(-1.2, 1.0)$ with backtracking ($c_1 = 10^{-4}$, $\rho = 0.5$), gradient descent takes $19{,}435$ iterations to bring $\|\nabla f\|$ below $10^{-8}$.
:::

## Newton's method: use the curvature

Gradient descent feels only the slope. Newton's method also feels how the ground curves and uses that to guess where the bottom is.

Near $\mathbf{x}_k$, Taylor's formula says the ground looks like a bowl, the **quadratic model**

$$
m_k(\mathbf{p}) = f(\mathbf{x}_k) + \nabla f(\mathbf{x}_k)^\top\mathbf{p} + \tfrac{1}{2}\,\mathbf{p}^\top\nabla^2 f(\mathbf{x}_k)\,\mathbf{p} .
$$

Jump to the bottom of the model. There its gradient is zero, $\nabla f(\mathbf{x}_k) + \nabla^2 f(\mathbf{x}_k)\,\mathbf{p} = \mathbf{0}$, which gives the **Newton step**

$$
\mathbf{p}_k = -\mathbf{H}_k^{-1}\nabla f(\mathbf{x}_k), \qquad \mathbf{H}_k = \nabla^2 f(\mathbf{x}_k),
$$

and the update $\mathbf{x} \leftarrow \mathbf{x} - \mathbf{H}^{-1}\nabla f$ (read "$\leftarrow$" as "is replaced by"). Four facts make it special.

- **On a perfect bowl it takes one step.** If $f$ is quadratic, the model *is* $f$, and the step lands exactly on the minimizer whatever $\kappa$ is.
- **It does not care about units.** Rescale the variables, $\mathbf{x} = \mathbf{D}\tilde{\mathbf{x}}$, and the Newton steps rescale with them: the same walk. Gradient descent has no such protection.
- **It converges quadratically near the answer.** Once close, the error roughly squares each step, $\|\mathbf{x}_{k+1} - \mathbf{x}^\star\| \le C\,\|\mathbf{x}_k - \mathbf{x}^\star\|^2$ for some constant $C$, so the number of correct digits **[[doubles|digits-double]]** each iteration.
- **It costs a factorization per step.** You need all the second derivatives, then the solution of an $n \times n$ linear system. You never form $\mathbf{H}^{-1}$; you factor $\mathbf{H}$ (Cholesky, about $n^3/3$ multiply-adds) and solve. Cheap for a few hundred variables, expensive for a hundred thousand.

::: example Watching the digits double
Minimize $f(x) = x - \ln x$ for $x > 0$. Here $f'(x) = 1 - 1/x$ and $f''(x) = 1/x^2$, so the minimizer is $x^\star = 1$.

**The step.** In one variable $\mathbf{H}^{-1}\nabla f$ is $f'/f''$, so

$$
x_{k+1} = x_k - \frac{1 - 1/x_k}{1/x_k^2} = x_k - (x_k^2 - x_k) = 2x_k - x_k^2 .
$$

**Run it from $x_0 = 0.5$.** The iterates are $0.5$, $0.75$, $0.9375$, $0.99609$, $0.9999847$, $0.9999999998$.

**Check the errors.** $1 - x_k$ runs $0.5$, $0.25$, $0.0625$, $0.0039$, $1.5 \times 10^{-5}$, $2.3 \times 10^{-10}$. Each is exactly the square of the one before, because $1 - (2x - x^2) = (1 - x)^2$. Five steps take one correct digit to nine.
:::

Far from the answer the model can mislead. Where the Hessian is not positive definite, near a hilltop or saddle, the Newton step need not even go downhill. The standard fixes: backtrack from $\alpha = 1$ (so near the answer the full step is kept), and if $\mathbf{H}_k$ is not positive definite, use $\mathbf{H}_k + \sigma\mathbf{I}$ with $\sigma$ only as big as needed to make it so. With backtracking, Newton's method on Rosenbrock from $(-1.2, 1.0)$ reaches $\|\nabla f\| < 10^{-8}$ in $21$ iterations, against $19{,}435$ for gradient descent.

::: key Gradient descent vs Newton step
Gradient descent: $x \leftarrow x - \alpha\nabla f$, linear convergence with rate set by the Hessian condition number $\kappa = \lambda_{\max}/\lambda_{\min}$; the contraction factor per step is about $(\kappa-1)/(\kappa+1)$, so the iteration count grows in proportion to $\kappa$. Each gradient step costs one gradient evaluation and no linear algebra. Newton: $x \leftarrow x - H^{-1}\nabla f$, quadratic local convergence, cost of a factorization per step.
:::

## BFGS and trust regions

Newton is fast but expensive; gradient descent is cheap but slow. Two ideas sit between them; both return in lesson 10.

**BFGS learns the curvature as it goes.** After each step, record how far you moved and how the gradient changed:

$$
\mathbf{s}_k = \mathbf{x}_{k+1} - \mathbf{x}_k, \qquad \mathbf{y}_k = \nabla f(\mathbf{x}_{k+1}) - \nabla f(\mathbf{x}_k).
$$

For a quadratic, $\mathbf{y}_k = \mathbf{H}\mathbf{s}_k$ exactly. So a good approximate inverse Hessian $\mathbf{M}_{k+1}$ should satisfy the **secant condition** $\mathbf{M}_{k+1}\mathbf{y}_k = \mathbf{s}_k$. BFGS — named for Broyden, Fletcher, Goldfarb and Shanno, who each published it in 1970 — makes the smallest sensible change to $\mathbf{M}_k$ that meets it. With $\gamma_k = 1/(\mathbf{y}_k^\top\mathbf{s}_k)$,

$$
\mathbf{M}_{k+1} = (\mathbf{I} - \gamma_k\,\mathbf{s}_k\mathbf{y}_k^\top)\,\mathbf{M}_k\,(\mathbf{I} - \gamma_k\,\mathbf{y}_k\mathbf{s}_k^\top) + \gamma_k\,\mathbf{s}_k\mathbf{s}_k^\top .
$$

The change is built from two vectors, so it is a **rank-two update**. The step is $\mathbf{p}_k = -\mathbf{M}_k\nabla f(\mathbf{x}_k)$, a descent direction while $\mathbf{M}_k$ stays positive definite — which it does provided $\mathbf{y}_k^\top\mathbf{s}_k > 0$, exactly what the Wolfe condition guarantees. SciPy's BFGS takes Rosenbrock from $(-1.2, 1.0)$ to $\|\nabla f\| < 10^{-8}$ in $34$ iterations.

::: key BFGS
Builds an approximate inverse Hessian from successive gradient differences (a rank-two update), giving near-Newton convergence without ever forming or factorizing the true Hessian. It converges superlinearly (faster than any fixed factor, slower than squaring) and costs about $n^2$ operations per step.
:::

**A trust region decides the distance first.** A line search picks a direction, then a distance. A **trust region** method picks a radius $\Delta_k$ ("delta") within which it trusts the quadratic model, then minimizes the model inside it:

$$
\text{minimize } m_k(\mathbf{p}) \quad \text{subject to } \|\mathbf{p}\| \le \Delta_k .
$$

Then it compares the promised decrease with the real one. A good match grows the radius; a poor one rejects the step and shrinks it. Because the step is always bounded, this works even when the Hessian is not positive definite, which makes trust regions a natural partner for exact Newton steps on awkward problems.

## Stopping, scaling and checking your gradient

A method stops when $\|\nabla f(\mathbf{x}_k)\| \le \varepsilon$, say $10^{-8}$. That is the honest test; a tiny step may only mean a tiny step length.

Check every hand-written gradient before trusting it. **Central differences**, $\partial f/\partial x_j \approx (f(\mathbf{x} + \epsilon\mathbf{e}_j) - f(\mathbf{x} - \epsilon\mathbf{e}_j))/2\epsilon$ with $\mathbf{e}_j$ the unit vector along coordinate $j$ and $\epsilon \approx 10^{-6}$, agree with a correct gradient to about five digits. The **[[complex-step derivative|complex-step]]**, $\partial f/\partial x_j \approx \operatorname{Im} f(\mathbf{x} + i\epsilon\mathbf{e}_j)/\epsilon$ with $\epsilon = 10^{-20}$, agrees to full machine precision, because nothing is subtracted. ($i$ is the imaginary unit and $\operatorname{Im}$ takes the imaginary part; it works for any function built from operations that make sense for complex numbers.) A gradient bug looks like a bad algorithm: "convergence" to a point that is not stationary, or a line search failing on a direction that is not really downhill.

```python
import numpy as np

def rosenbrock(x):
    return (1 - x[0])**2 + 100 * (x[1] - x[0]**2)**2

def grad(x):
    return np.array([-2 * (1 - x[0]) - 400 * x[0] * (x[1] - x[0]**2),
                     200 * (x[1] - x[0]**2)])

x = np.array([-1.2, 1.0])
h = 1e-20
fd = np.array([rosenbrock(x + 1j * h * e).imag / h for e in np.eye(2)])
print(grad(x), fd)  # [-215.6  -88. ] [-215.6  -88. ]
```

::: warning Small gradient is not small error
Near an ill-conditioned minimizer the gradient can be tiny while the point is still far off along the flat direction. On a quadratic, $\nabla f = \mathbf{A}(\mathbf{x} - \mathbf{x}^\star)$, so an error $e$ along the flattest eigenvector produces a gradient of only $\lambda_{\min} e$. On Rosenbrock $\lambda_{\min} \approx 0.4$, so a gradient of $10^{-8}$ pins the position to about $2.5 \times 10^{-8}$ — fine. With $\lambda_{\min} = 10^{-6}$ the same test would allow a position error of $10^{-2}$.
:::

## Check yourself

::: check
The function $f(x, y) = x^2 - y^2$ has $\nabla f = (2x, -2y)$, which is zero at the origin. Is the origin a minimizer?
:::

::: answer
No. The Hessian is $\begin{bmatrix} 2 & 0 \\ 0 & -2 \end{bmatrix}$, with a negative eigenvalue $-2$, so the necessary condition $\nabla^2 f \succeq 0$ fails. Directly: along the $y$-axis $f = -y^2$, which drops as you leave the origin. The origin is a saddle point — stationary, but neither a minimum nor a maximum.
:::

::: check
You are minimizing a quadratic whose Hessian has eigenvalues $4$ and $400$. Gradient descent with exact line search has already cut $f$ by a factor of $10$. Roughly how many more iterations to cut it by another factor of $10^{3}$?
:::

::: answer
The condition number is $\kappa = 400/4 = 100$, so the worst-case factor per iteration in $f$ is $\left(\frac{99}{101}\right)^2 = 0.9608$. You need $0.9608^k = 10^{-3}$, so $k = \ln(10^{-3})/\ln(0.9608) \approx 6.91/0.0400 \approx 173$ iterations. That is a worst case; a lucky start converges faster.
:::

::: check
At some point $\nabla f = (3, -4)$. Is $\mathbf{p} = (1, 2)$ a descent direction? Is $\mathbf{p} = (-1, 2)$? Which is better?
:::

::: answer
Check the sign of $\nabla f^\top \mathbf{p}$. For $(1, 2)$: $3 - 8 = -5 < 0$, a descent direction. For $(-1, 2)$: $-3 - 8 = -11 < 0$, also a descent direction.

Both have length $\sqrt{5}$, so per unit length they give $-2.24$ and $-4.92$: $(-1, 2)$ goes down faster. The steepest direction, $-\nabla f = (-3, 4)$, has length $5$ and gives $-25/5 = -5$ per unit length, steeper than both, as Cauchy–Schwarz promises.
:::

::: check
With $c_1 = 10^{-4}$ and $\rho = 0.5$, backtracking from $\alpha = 1$ accepts $\alpha = 1/8$ at a point where $f(\mathbf{x}_k) = 2.0$ and $\nabla f^\top\mathbf{p}_k = -16$. What is the largest value $f(\mathbf{x}_k + \tfrac{1}{8}\mathbf{p}_k)$ can have had? How many function evaluations did the iteration take?
:::

::: answer
The Armijo line at $\alpha = 1/8$ is at $2.0 + 10^{-4} \times \tfrac{1}{8} \times (-16) = 2.0 - 0.0002 = 1.9998$, so the accepted value was at most $1.9998$. The steps $1, \tfrac{1}{2}, \tfrac{1}{4}$ were tried and rejected and $\tfrac{1}{8}$ accepted: four function evaluations, plus one gradient evaluation at $\mathbf{x}_k$.
:::

::: check
Why does gradient descent on a function with badly mixed units behave as if the problem were ill-conditioned, even when the physics is tame?
:::

::: answer
The Hessian's eigenvalues carry the units of the variables. If one variable is a position in meters and another an angle in radians, a change of $1$ in each means wildly different things, and the second derivatives can differ by many powers of ten for no physical reason. The condition number, and so the iteration count, reflects that arbitrary choice.

Rescaling each variable by a typical size is a change of variables $\mathbf{x} = \mathbf{D}\tilde{\mathbf{x}}$ that turns the Hessian into $\mathbf{D}\nabla^2 f\,\mathbf{D}$ and can shrink $\kappa$ enormously. Newton's method is unaffected by such rescaling, which is one of its great strengths.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\min f(\mathbf{x})$ s.t. $g_i \le 0$, $h_j = 0$ | Standard form; $p^\star$ optimal value, $\mathbf{x}^\star$ minimizer |
| $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ | First-order necessary condition (stationary point) |
| $\nabla^2 f(\mathbf{x}^\star) \succeq 0$ / $\succ 0$ | Second-order necessary / sufficient condition |
| $\nabla f^\top \mathbf{p} < 0$ | $\mathbf{p}$ is a descent direction |
| $f(\mathbf{x}+\alpha\mathbf{p}) \le f(\mathbf{x}) + c_1\alpha\nabla f^\top\mathbf{p}$ | Armijo sufficient-decrease condition, $c_1 \approx 10^{-4}$ |
| $\mathbf{x} \leftarrow \mathbf{x} - \alpha\nabla f$ | Gradient descent: linear convergence |
| $\kappa = \lambda_{\max}/\lambda_{\min}$ | Condition number of the Hessian |
| $(\kappa-1)/(\kappa+1)$ | Contraction factor per step; iterations $\propto \kappa$ |
| $\mathbf{x} \leftarrow \mathbf{x} - \mathbf{H}^{-1}\nabla f$ | Newton: quadratic local convergence, one factorization per step |
| $\mathbf{M}_{k+1}\mathbf{y}_k = \mathbf{s}_k$ | BFGS secant condition; rank-two update, superlinear |
| $\min m_k(\mathbf{p})$ s.t. $\|\mathbf{p}\| \le \Delta_k$ | Trust-region step |
| Rosenbrock $(1-x)^2 + 100(y-x^2)^2$ | Test function; $\kappa \approx 2{,}500$ at $(1,1)$; $19{,}435$ gradient steps vs $21$ Newton steps |

Next lesson: the rules come back. When the lowest point is pinned against a constraint — a thrust limit, a landing target — the gradient no longer has to be zero. Instead it must be *balanced* by the constraints, and the balancing numbers, the Lagrange multipliers, turn out to be the price of each rule.

::: context kalman-least-squares A filter that is really an optimizer
A **Kalman filter** estimates where a vehicle is and how fast it is moving by blending a prediction with noisy sensor readings. Each update picks the estimate that minimizes a weighted sum of squared mismatches — how far the estimate is from the prediction, and how far it is from the measurement, each weighted by how much you trust it. That is a least-squares problem, the friendliest kind of optimization there is: its minimizer has a formula. The navigation modules build the filter on exactly this idea.
:::

::: context local-global A valley that is not the deepest
The curve has two valleys. A marble dropped on the right slope rolls into the right valley and stays there, happy, even though the left valley is much deeper. Everything it can feel — a flat floor, walls curving up — looks exactly like a true minimum.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="30.0,50.1 37.3,84.0 44.6,111.2 52.0,132.4 59.3,148.3 66.6,159.6 73.9,167.0 81.2,171.0 88.5,172.2 95.9,171.1 103.2,168.3 110.5,164.0 117.8,158.8 125.1,153.0 132.4,146.9 139.8,140.8 147.1,135.0 154.4,129.7 161.7,125.0 169.0,121.1 176.3,118.1 183.7,116.0 191.0,114.9 198.3,114.7 205.6,115.4 212.9,116.9 220.2,119.0 227.6,121.6 234.9,124.5 242.2,127.4 249.5,130.0 256.8,132.0 264.1,133.1 271.5,132.7 278.8,130.6 286.1,126.2 293.4,119.0 300.7,108.4 308.0,93.9 315.4,74.8 322.7,50.4 330.0,20.0"/>
  <circle cx="88.5" cy="166.2" r="6" fill="#1d6fd1"/>
  <circle cx="266.4" cy="127.1" r="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="88" y="194" font-size="12" text-anchor="middle" fill="#1d6fd1">global minimum</text>
  <text x="266" y="156" font-size="12" text-anchor="middle" fill="#1f2a44">local minimum</text>
  <text x="198" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">ridge</text>
</svg>
```

The curve is $f(x) = x^4 - 3x^2 + x$: its right-hand valley bottoms out at about $-1.07$, its left-hand one at about $-3.51$.
:::

::: context hessian-name Who Hesse was
The matrix of second derivatives is named after Otto Hesse, a nineteenth-century German mathematician who used it to study curves and surfaces. For a function of two variables it is a $2 \times 2$ table: the second derivative along $x$, the second derivative along $y$, and the mixed one (change $x$, then $y$) in both off-diagonal places. The mixed ones are equal for smooth functions, which is why the Hessian is always symmetric — and a symmetric matrix always has real eigenvalues, which is what makes the "all eigenvalues positive" test work.
:::

::: context saddle-point Saddles and potato chips
A horse's saddle dips down from front to back but curves up from side to side. Sit in the middle and you are at the lowest point along one direction and the highest point along the other. The function $x^2 - y^2$ has exactly this shape at the origin. A curved potato chip has it too. In problems with many variables, saddles are far more common than hilltops, so an algorithm that only checks "is the gradient zero?" will often stop on one.
:::

::: context rosenbrock-banana The banana function
Howard Rosenbrock, a British control engineer, published this function in 1960 as a hard test for minimization methods. Its valley is shaped like a banana: long, narrow and curved. The floor of the valley follows the curve $y = x^2$, and along it the function falls only gently toward $(1, 1)$. Finding the valley is easy. Following its bend to the end is what defeats simple methods, and that is why nearly every optimization textbook and library still tests on it.
:::

::: context armijo-picture The sufficient-decrease line, drawn
The blue curve is the height of the ground along the search line, $\phi(\alpha)$. The gray dashed line is the starting slope. The red line has a fraction $c_1$ of that slope — drawn here with $c_1 = 0.3$ so you can see it, far larger than the usual $10^{-4}$. A step is accepted when the curve is below the red line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="190" x2="350" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="190" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="190" x2="236" y2="190" stroke="#1d6fd1" stroke-width="6" opacity="0.5"/>
  <line x1="40" y1="49" x2="208" y2="185" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="40" y1="49" x2="348" y2="123.8" stroke="#b4232c" stroke-width="2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,49.0 54.0,59.8 68.0,69.4 82.0,77.9 96.0,85.3 110.0,91.5 124.0,96.6 138.0,100.6 152.0,103.4 166.0,105.1 180.0,105.7 194.0,105.1 208.0,103.4 222.0,100.6 236.0,96.6 250.0,91.5 264.0,85.3 278.0,77.9 292.0,69.4 306.0,59.8 320.0,49.0 334.0,37.1 348.0,24.1"/>
  <circle cx="320" cy="49" r="5" fill="#b4232c"/>
  <circle cx="180" cy="105.7" r="5" fill="#1d6fd1"/>
  <text x="312" y="40" font-size="11" text-anchor="end" fill="#b4232c">α = 1 rejected</text>
  <text x="180" y="126" font-size="11" text-anchor="middle" fill="#1d6fd1">α = ½ accepted</text>
  <text x="286" y="136" font-size="11" fill="#b4232c">Armijo line</text>
  <text x="215" y="182" font-size="11" fill="#6c7a93">starting slope</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="204">0</text><text x="180" y="204">0.5</text><text x="320" y="204">1</text>
  </g>
  <text x="138" y="184" font-size="11" text-anchor="middle" fill="#1d6fd1">accepted steps</text>
  <text x="46" y="30" font-size="12" fill="#1f2a44">φ(α)</text>
</svg>
```

Here $\phi(\alpha) = 1 - 2\alpha + 2\alpha^2$, so every $\alpha$ up to $0.7$ passes. Backtracking tries $1$, fails, and accepts $\tfrac{1}{2}$.
:::

::: context zigzag-picture Why steepest descent zig-zags
The ellipses are level curves of $\tfrac{1}{2}(x_1^2 + 10\,x_2^2)$, drawn to scale, so $\kappa = 10$. The orange path is steepest descent with exact line search from $(10, 1)$. Each step leaves the level curve at right angles and stops where it barely touches a lower one, so consecutive steps are perpendicular and the walk bounces between the walls. The red dashed arrow is Newton's method: one step, straight to the bottom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#8fb8f0" stroke-width="1.5">
    <ellipse cx="180" cy="100" rx="157.3" ry="49.7"/>
    <ellipse cx="180" cy="100" rx="105.3" ry="33.3"/>
    <ellipse cx="180" cy="100" rx="70.5" ry="22.3"/>
    <ellipse cx="180" cy="100" rx="47.2" ry="14.9"/>
    <ellipse cx="180" cy="100" rx="31.6" ry="10.0"/>
  </g>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="330.0,85.0 302.7,112.3 280.4,90.0 262.2,108.2 247.2,93.3 235.0,105.5 225.0,95.5 216.8,103.7 210.1,97.0"/>
  <line x1="330" y1="85" x2="186" y2="99.4" stroke="#b4232c" stroke-width="1.8" stroke-dasharray="5 4"/>
  <circle cx="330" cy="85" r="4" fill="#1f2a44"/>
  <circle cx="180" cy="100" r="4" fill="#1f2a44"/>
  <text x="330" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">start</text>
  <text x="180" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">minimum</text>
  <text x="250" y="170" font-size="12" text-anchor="middle" fill="#1f2a44">steepest descent: 8 steps shown</text>
  <text x="200" y="40" font-size="12" text-anchor="middle" fill="#b4232c">Newton: 1 step</text>
</svg>
```

Raise $\kappa$ and the bounces get shorter and more numerous.
:::

::: context digits-double Digits that double
Newton's method is older than calculus textbooks. The ancient way of finding a square root — guess, then average the guess with the number divided by the guess — is Newton's method applied to $x^2 - a = 0$. Try it on $\sqrt{2}$ starting from $1$: you get $1.5$, then $1.41667$, then $1.4142157$, then $1.41421356237469$. The correct digits go $1, 3, 6, 12$. That doubling is quadratic convergence, and it is why a Newton-based solver on a flight computer usually needs only a handful of iterations once it is close.
:::

::: context complex-step A derivative without subtraction
Ordinary finite differences subtract two nearly equal numbers, and a computer holds only about 16 significant digits, so most of them cancel. Step into the complex numbers instead: $f(x + ih) \approx f(x) + ih f'(x)$, so the derivative sits alone in the imaginary part, with nothing subtracted. The step can then be absurdly small, like $10^{-20}$, and the answer is accurate to every digit. The idea goes back to Lyness and Moler in 1967; Squire and Trapp made it popular in 1998, and it is now a standard way to check gradients in aerospace design codes.
:::
