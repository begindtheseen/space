---
id: l01-descent-and-line-search
title: Unconstrained optimisation I: optimality conditions, gradient descent and line search
minutes: 20
covers:
  - "unconstrained optimisation: gradient descent, Newton, BFGS, line search, trust region"
---

Almost every guidance and control computation on a spacecraft is an optimisation problem in disguise. A fuel-optimal transfer asks for the thrust history that reaches a target orbit while burning the least propellant. Powered-descent guidance asks for the thrust vector history that puts a lander on a pad, at rest, without running the engine outside its throttle range. A linear-quadratic regulator (LQR) is nothing more than the minimiser of a quadratic cost over all possible control sequences. Even a Kalman filter is the solution of a weighted least-squares problem, updated one measurement at a time.

This module builds the mathematics that lets you recognise which of these problems are easy, which are hard, and what "easy" buys you when an algorithm has to run onboard with a hard deadline. The destination is convex optimisation and the interior-point solvers that fly on landing vehicles. The starting point is the simplest question of all: given a smooth function of several variables, how do you find a point where it is smallest, and how quickly can you get there?

This lesson covers the unconstrained problem – no side conditions at all – and the two ideas every later algorithm reuses: a direction in which the function decreases, and a step length along it that is neither timid nor reckless. The next lesson adds curvature information (Newton, quasi-Newton, trust regions). The rest of the module adds constraints.

## The standard form of an optimisation problem

Every problem in this module can be written as

$$
\begin{aligned}
\text{minimise}\quad & f(\mathbf{x}) \\
\text{subject to}\quad & g_i(\mathbf{x}) \le 0, \quad i = 1,\dots,m, \\
& h_j(\mathbf{x}) = 0, \quad j = 1,\dots,p,
\end{aligned}
$$

where $\mathbf{x} \in \mathbb{R}^n$ is the decision variable, $f$ is the objective (cost), the $g_i$ are inequality constraints and the $h_j$ are equality constraints. A point that satisfies every constraint is feasible; the set of all feasible points is the feasible set. The optimal value $p^\star$ is the smallest value $f$ takes on the feasible set, and a feasible $\mathbf{x}^\star$ with $f(\mathbf{x}^\star) = p^\star$ is a minimiser or optimal point. Maximising $f$ is the same as minimising $-f$, so nothing is lost by always writing "minimise".

In the powered-descent problem the decision variable stacks the thrust vector at each of $N$ time steps, the objective is the propellant used, the equality constraints are the discretised equations of motion and the terminal position and velocity, and the inequality constraints are the throttle limits, the glide-slope cone and the thrust-pointing cone. With $N = 100$ steps in three dimensions that is a few hundred variables and constraints. In LQR the decision variable is the control sequence and the only constraints are the dynamics.

Two notions of optimality matter. A point $\mathbf{x}^\star$ is a **local minimiser** if $f(\mathbf{x}^\star) \le f(\mathbf{x})$ for every feasible $\mathbf{x}$ within some small ball around it. It is a **global minimiser** if the inequality holds for every feasible $\mathbf{x}$. Algorithms that look at gradients can only see local information, so everything in this lesson finds local minimisers. The gap between local and global is the whole reason convexity matters, and it is the subject of lessons 5 and 6.

This lesson has $m = p = 0$: no constraints, $f$ twice continuously differentiable.

## What a minimum looks like

Expand $f$ around a point $\mathbf{x}$ to second order in a small displacement $\mathbf{p}$:

$$
f(\mathbf{x} + \mathbf{p}) = f(\mathbf{x}) + \nabla f(\mathbf{x})^\top \mathbf{p} + \tfrac{1}{2}\,\mathbf{p}^\top \nabla^2 f(\mathbf{x})\,\mathbf{p} + o(\|\mathbf{p}\|^2).
$$

Here $\nabla f$ is the gradient (the column vector of partial derivatives) and $\nabla^2 f$ is the Hessian, the symmetric $n \times n$ matrix of second partial derivatives $\partial^2 f / \partial x_i \partial x_j$.

**First-order necessary condition.** Suppose $\mathbf{x}^\star$ is a local minimiser but $\nabla f(\mathbf{x}^\star) \ne \mathbf{0}$. Take $\mathbf{p} = -\epsilon \nabla f(\mathbf{x}^\star)$ with $\epsilon > 0$ small. The first-order term is $-\epsilon \|\nabla f(\mathbf{x}^\star)\|^2 < 0$, and for $\epsilon$ small enough it dominates the second-order remainder, so $f(\mathbf{x}^\star + \mathbf{p}) < f(\mathbf{x}^\star)$, contradicting minimality. Therefore

$$
\nabla f(\mathbf{x}^\star) = \mathbf{0}.
$$

A point where the gradient vanishes is a **stationary point**. Minimisers are stationary; the converse is false – maxima and saddle points are stationary too.

**Second-order conditions.** At a stationary point the linear term is gone, and $f(\mathbf{x}^\star + \mathbf{p}) - f(\mathbf{x}^\star) \approx \tfrac{1}{2}\mathbf{p}^\top \nabla^2 f(\mathbf{x}^\star)\mathbf{p}$. If there were a direction $\mathbf{p}$ with $\mathbf{p}^\top \nabla^2 f(\mathbf{x}^\star) \mathbf{p} < 0$, moving a little along it would decrease $f$, so a local minimiser must have a positive semidefinite Hessian: $\nabla^2 f(\mathbf{x}^\star) \succeq 0$ (all eigenvalues $\ge 0$). Conversely, if $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ and $\nabla^2 f(\mathbf{x}^\star) \succ 0$ (all eigenvalues strictly positive, so $\mathbf{p}^\top \nabla^2 f\, \mathbf{p} \ge \lambda_{\min}\|\mathbf{p}\|^2$), then for small $\mathbf{p}$ the quadratic term is at least $\tfrac{1}{2}\lambda_{\min}\|\mathbf{p}\|^2$ and beats the remainder, so $\mathbf{x}^\star$ is a strict local minimiser. That is the second-order sufficient condition.

The stress-test function used throughout the exercises is Rosenbrock's

$$
f(x, y) = (1 - x)^2 + 100\,(y - x^2)^2,
$$

whose only stationary point is $(1, 1)$ with $f = 0$. Its gradient and Hessian are

$$
\nabla f = \begin{bmatrix} -2(1-x) - 400\,x\,(y - x^2) \\ 200\,(y - x^2) \end{bmatrix},
\qquad
\nabla^2 f = \begin{bmatrix} 2 - 400\,(y - x^2) + 800\,x^2 & -400\,x \\ -400\,x & 200 \end{bmatrix}.
$$

At $(1,1)$ the Hessian is $\begin{bmatrix} 802 & -400 \\ -400 & 200 \end{bmatrix}$ with eigenvalues about $0.399$ and $1001.6$: positive definite, so the second-order sufficient condition confirms a strict local minimum – but the two eigenvalues differ by a factor of about 2,510, and that ratio is going to matter.

## Descent directions

An iterative method produces $\mathbf{x}_{k+1} = \mathbf{x}_k + \alpha_k \mathbf{p}_k$: a direction $\mathbf{p}_k$ and a step length $\alpha_k > 0$. Directional differentiation gives $\frac{d}{d\alpha} f(\mathbf{x}_k + \alpha \mathbf{p}_k)\big|_{\alpha = 0} = \nabla f(\mathbf{x}_k)^\top \mathbf{p}_k$, so $f$ decreases for small enough steps exactly when

$$
\nabla f(\mathbf{x}_k)^\top \mathbf{p}_k < 0 .
$$

Such a $\mathbf{p}_k$ is a **descent direction**. Among all unit vectors the most negative directional derivative is achieved by $\mathbf{p} = -\nabla f / \|\nabla f\|$ (Cauchy–Schwarz), which is why $\mathbf{p}_k = -\nabla f(\mathbf{x}_k)$ is called the steepest-descent direction. Any $\mathbf{p}_k = -\mathbf{B}_k^{-1}\nabla f(\mathbf{x}_k)$ with $\mathbf{B}_k \succ 0$ is also a descent direction, since then $\nabla f^\top \mathbf{p} = -\nabla f^\top \mathbf{B}_k^{-1}\nabla f < 0$. Newton's method takes $\mathbf{B}_k = \nabla^2 f(\mathbf{x}_k)$; quasi-Newton methods build an approximation; gradient descent uses $\mathbf{B}_k = \mathbf{I}$. The direction family is the whole story of unconstrained optimisation, and the next lesson is about choosing $\mathbf{B}_k$ well.

## Line search: choosing the step length

Given a descent direction, how far should you go? The **exact line search** picks $\alpha_k = \arg\min_{\alpha > 0} f(\mathbf{x}_k + \alpha\mathbf{p}_k)$. For a quadratic $f(\mathbf{x}) = \tfrac{1}{2}\mathbf{x}^\top\mathbf{A}\mathbf{x} - \mathbf{b}^\top\mathbf{x}$ this has a closed form: with $\mathbf{g}_k = \nabla f(\mathbf{x}_k) = \mathbf{A}\mathbf{x}_k - \mathbf{b}$, setting the derivative of $\phi(\alpha) = f(\mathbf{x}_k + \alpha \mathbf{p}_k)$ to zero gives $\mathbf{g}_k^\top\mathbf{p}_k + \alpha\,\mathbf{p}_k^\top\mathbf{A}\mathbf{p}_k = 0$, so $\alpha_k = -\mathbf{g}_k^\top\mathbf{p}_k / (\mathbf{p}_k^\top\mathbf{A}\mathbf{p}_k)$. For a general $f$ an exact search costs many function evaluations and is not worth it.

The practical alternative is **backtracking**, which enforces the **Armijo (sufficient decrease) condition**

$$
f(\mathbf{x}_k + \alpha\mathbf{p}_k) \le f(\mathbf{x}_k) + c_1\,\alpha\,\nabla f(\mathbf{x}_k)^\top \mathbf{p}_k,
\qquad 0 < c_1 < 1 .
$$

The right-hand side is a line through $f(\mathbf{x}_k)$ with a fraction $c_1$ of the initial slope. Any step that lands below that line has achieved a decrease proportional to the step length and the slope – it is not merely "some decrease", which could shrink to nothing and let the iterates stall. Backtracking starts at $\alpha = 1$ (the natural scale for Newton-type steps) and multiplies by a contraction factor $\rho \in (0, 1)$ until the condition holds. Typical values are $c_1 = 10^{-4}$ and $\rho = 0.5$. Because $\mathbf{p}_k$ is a descent direction the condition holds for all sufficiently small $\alpha$, so the loop terminates.

A complete line search also asks the step not to be too short. The **Wolfe curvature condition** requires the slope at the new point to be less negative than a fraction $c_2 \in (c_1, 1)$ of the starting slope, $\nabla f(\mathbf{x}_k + \alpha\mathbf{p}_k)^\top\mathbf{p}_k \ge c_2\,\nabla f(\mathbf{x}_k)^\top\mathbf{p}_k$, with $c_2 = 0.9$ common. Backtracking from $\alpha = 1$ usually satisfies it automatically, which is why simple codes skip it; quasi-Newton methods need it, for a reason the next lesson explains.

::: example Backtracking on Rosenbrock's first step
Start gradient descent at $\mathbf{x}_0 = (-1.2, 1.0)$, the standard starting point. There $f = 24.2$ and the gradient is $\nabla f = (-215.6, -88.0)$, with norm 232.9. The steepest-descent direction is $\mathbf{p}_0 = (215.6, 88.0)$ and the initial slope is $\nabla f^\top\mathbf{p}_0 = -232.9^2 = -54{,}227$.

With $c_1 = 10^{-4}$, $\rho = 0.5$ and $\alpha = 1$: the trial point is $(214.4, 89)$ and $f$ there is astronomically large, so the test fails. Halving ten times gives $\alpha = 2^{-10} = 9.77 \times 10^{-4}$, trial point $(-0.989, 1.086)$ and $f = 5.10$. The Armijo threshold is $24.2 - 10^{-4} \times 9.77 \times 10^{-4} \times 54{,}227 = 24.19$, so the step is accepted. Ten halvings means eleven function evaluations for a single iteration, and the step moved the point only about 0.23 units. The gradient is huge but the valley is narrow: a unit step is wildly too long, and the algorithm has to discover the right scale by trial.
:::

::: warning Fixed steps and unit mistakes
If you skip the line search and use a fixed $\alpha$, gradient descent on a quadratic with largest Hessian eigenvalue $L$ diverges for $\alpha > 2/L$ and is safe for $\alpha \le 1/L$. On Rosenbrock, $L$ varies from about 200 near the origin to over 2,000 in the valley, so no single fixed step works everywhere. In GNC problems the same trap appears through units: a state mixing metres and radians, or seconds and kilometres, gives a Hessian with eigenvalues spread over many decades, and the step that is stable for one variable is useless for another. Scale the variables so that a unit change in each is "equally significant" before you run anything.
:::

## Gradient descent and the condition number

Gradient descent is

$$
\mathbf{x}_{k+1} = \mathbf{x}_k - \alpha_k \nabla f(\mathbf{x}_k).
$$

To see how fast it converges, analyse the quadratic model $f(\mathbf{x}) = \tfrac{1}{2}\mathbf{x}^\top\mathbf{A}\mathbf{x}$ with $\mathbf{A} \succ 0$, minimised at $\mathbf{x}^\star = \mathbf{0}$. A fixed step gives $\mathbf{x}_{k+1} = (\mathbf{I} - \alpha\mathbf{A})\mathbf{x}_k$. In the eigenbasis of $\mathbf{A}$ each component is multiplied by $1 - \alpha\lambda_i$ per iteration, so the error contracts by at most $\max_i |1 - \alpha \lambda_i|$. The best fixed step balances the extremes, $\alpha = 2/(\lambda_{\min} + \lambda_{\max})$, and gives the contraction factor

$$
\frac{\lambda_{\max} - \lambda_{\min}}{\lambda_{\max} + \lambda_{\min}} = \frac{\kappa - 1}{\kappa + 1},
\qquad \kappa = \frac{\lambda_{\max}}{\lambda_{\min}},
$$

where $\kappa$ is the **condition number** of the Hessian. With exact line search the same factor bounds the error in $f$ per iteration squared: $f(\mathbf{x}_{k}) \le \left(\frac{\kappa-1}{\kappa+1}\right)^{2k} f(\mathbf{x}_0)$. Either way the convergence is **linear** – the error shrinks by a constant factor each step – and for large $\kappa$ the factor is $\frac{\kappa-1}{\kappa+1} \approx 1 - 2/\kappa$, so reducing the error by $10^{-6}$ takes roughly $\kappa \ln(10^6)/2 \approx 6.9\,\kappa$ iterations. Iteration count grows in proportion to the condition number. Geometrically, the level sets of an ill-conditioned quadratic are long thin ellipses, the gradient is nearly perpendicular to the long axis, and the iterates zig-zag across the valley instead of walking along it.

For a general smooth $f$ the same conclusion holds near the minimiser, with $\kappa$ the condition number of $\nabla^2 f(\mathbf{x}^\star)$. A function whose gradient is Lipschitz, $\|\nabla f(\mathbf{x}) - \nabla f(\mathbf{y})\| \le L\|\mathbf{x} - \mathbf{y}\|$, satisfies the **descent lemma** $f(\mathbf{y}) \le f(\mathbf{x}) + \nabla f(\mathbf{x})^\top(\mathbf{y} - \mathbf{x}) + \tfrac{L}{2}\|\mathbf{y} - \mathbf{x}\|^2$ (integrate the gradient along the segment and bound the change), and plugging in $\mathbf{y} = \mathbf{x} - \tfrac{1}{L}\nabla f(\mathbf{x})$ gives the guaranteed decrease $f(\mathbf{y}) \le f(\mathbf{x}) - \tfrac{1}{2L}\|\nabla f(\mathbf{x})\|^2$. So gradient descent with step $1/L$ always makes progress, and it stalls only where the gradient is small – which is where you want to be.

::: example Steepest descent on an ill-conditioned quadratic
Take $f(x_1, x_2) = \tfrac{1}{2}(x_1^2 + \kappa\,x_2^2)$, a stand-in for an LQR cost in which one state is weighted $\kappa$ times more heavily than another. Start from $(\kappa, 1)$ and use exact line search until $f$ has fallen by a factor $10^{6}$.

For $\kappa = 10$ the contraction factor per iteration in $f$ is $\left(\frac{9}{11}\right)^2 = 0.669$ and the run takes 35 iterations (the bound predicts $\ln(10^{-6})/\ln 0.669 = 34.4$). For $\kappa = 100$ the factor is $0.9608$ and the run takes 346 iterations. For $\kappa = 1000$ it is $0.99601$ and the run takes 3,454 iterations. Ten times the condition number costs ten times the iterations – linear convergence with a rate that degrades linearly in $\kappa$. The Rosenbrock valley has $\kappa \approx 2{,}500$ at the solution and worse further out, which is why gradient descent on it needs tens of thousands of iterations: from $(-1.2, 1.0)$ with backtracking ($c_1 = 10^{-4}$, $\rho = 0.5$) it takes 19,435 iterations to bring $\|\nabla f\|$ below $10^{-8}$. Newton's method, next lesson, does it in 21.
:::

::: key Gradient descent
Gradient descent: $x \leftarrow x - \alpha\nabla f$, linear convergence with rate set by the Hessian condition number $\kappa = \lambda_{\max}/\lambda_{\min}$; the contraction factor per step is about $(\kappa-1)/(\kappa+1)$, so the iteration count grows in proportion to $\kappa$. Each step costs one gradient evaluation and no linear algebra.
:::

::: key Optimality conditions for unconstrained problems
Necessary: $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ and $\nabla^2 f(\mathbf{x}^\star) \succeq 0$. Sufficient: $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ and $\nabla^2 f(\mathbf{x}^\star) \succ 0$. A descent direction satisfies $\nabla f^\top\mathbf{p} < 0$; the Armijo condition $f(\mathbf{x} + \alpha\mathbf{p}) \le f(\mathbf{x}) + c_1\alpha\nabla f^\top\mathbf{p}$ makes backtracking safe.
:::

## Stopping, scaling and checking your gradient

An algorithm stops when $\|\nabla f(\mathbf{x}_k)\| \le \varepsilon$ for a tolerance such as $10^{-8}$, or when the step or the change in $f$ falls below a threshold. The gradient norm is the honest test: a small step can mean a small step size rather than convergence.

Whenever you write an analytic gradient, check it before you trust it. Central finite differences $\partial f/\partial x_j \approx (f(\mathbf{x} + \epsilon\mathbf{e}_j) - f(\mathbf{x} - \epsilon\mathbf{e}_j))/2\epsilon$ with $\epsilon \approx 10^{-6}$ agree with a correct gradient to about five digits. The complex-step derivative $\partial f/\partial x_j \approx \operatorname{Im} f(\mathbf{x} + i\epsilon\mathbf{e}_j)/\epsilon$ with $\epsilon = 10^{-20}$ agrees to machine precision, because no subtraction takes place; it works for any function written in operations that extend to complex arguments. A gradient bug produces an optimiser that "converges" to a point that is not stationary, or a line search that fails because the direction is not a descent direction, and both symptoms are easy to misread as a bad algorithm.

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
Near an ill-conditioned minimiser the gradient can be tiny while the point is still far from the solution along the flat direction: on a quadratic, $\nabla f = \mathbf{A}(\mathbf{x} - \mathbf{x}^\star)$, so an error of size $e$ along the eigenvector with eigenvalue $\lambda_{\min}$ produces a gradient of size only $\lambda_{\min} e$. On Rosenbrock at the solution $\lambda_{\min} \approx 0.4$, so a gradient norm of $10^{-8}$ certifies the position only to about $2.5 \times 10^{-8}$ – fine here, but for $\lambda_{\min} = 10^{-6}$ the same gradient tolerance would leave a position error of $10^{-2}$.
:::

## Check yourself

::: check
The function $f(x, y) = x^2 - y^2$ has $\nabla f = (2x, -2y)$, which vanishes at the origin. Is the origin a minimiser?
:::

::: answer
No. The Hessian is $\operatorname{diag}(2, -2)$, which has a negative eigenvalue, so the second-order necessary condition $\nabla^2 f \succeq 0$ fails. Along the $y$-axis $f = -y^2$ decreases away from the origin. The origin is a saddle point: stationary, but neither a minimum nor a maximum.
:::

::: check
You are minimising a quadratic whose Hessian has eigenvalues 4 and 400. Gradient descent with exact line search has reduced $f$ by a factor of 10 after some iterations. Roughly how many more iterations will it need to reduce $f$ by another factor of $10^{3}$?
:::

::: answer
The condition number is $\kappa = 100$, so the per-iteration contraction factor in $f$ is at worst $\left(\frac{99}{101}\right)^2 = 0.9608$. A factor $10^{-3}$ needs $k$ with $0.9608^k = 10^{-3}$, so $k = \ln(10^{-3})/\ln(0.9608) \approx 6.91/0.0400 \approx 173$ iterations. (The rate is a worst case; a lucky starting point converges faster.)
:::

::: check
At some iterate the gradient is $\nabla f = (3, -4)$ and a proposed direction is $\mathbf{p} = (1, 2)$. Is it a descent direction? What about $\mathbf{p} = (-1, 2)$?
:::

::: answer
Check the sign of $\nabla f^\top \mathbf{p}$. For $(1, 2)$: $3 \times 1 + (-4) \times 2 = -5 < 0$, so it is a descent direction. For $(-1, 2)$: $-3 - 8 = -11 < 0$, also a descent direction – and a better one, since its directional derivative per unit length is $-11/\sqrt{5} = -4.92$ against $-5/\sqrt{5} = -2.24$. The steepest direction $-\nabla f = (-3, 4)$ has $-25/5 = -5$ per unit length.
:::

::: check
With $c_1 = 10^{-4}$ and $\rho = 0.5$, backtracking from $\alpha = 1$ accepts $\alpha = 1/8$ at some iterate where $f(\mathbf{x}_k) = 2.0$ and $\nabla f^\top\mathbf{p}_k = -16$. What is the largest value $f(\mathbf{x}_k + \tfrac{1}{8}\mathbf{p}_k)$ can have had? How many function evaluations did this iteration take?
:::

::: answer
The Armijo threshold at $\alpha = 1/8$ is $2.0 + 10^{-4} \times \tfrac{1}{8} \times (-16) = 2.0 - 2 \times 10^{-4} = 1.9998$, so the accepted value was at most $1.9998$. The steps $\alpha = 1, 1/2, 1/4$ were each tried and rejected and $\alpha = 1/8$ accepted: four function evaluations, plus the one gradient evaluation at $\mathbf{x}_k$.
:::

::: check
Why does gradient descent on a function with badly mixed units behave as if the problem were ill-conditioned even when the underlying physics is benign?
:::

::: answer
The Hessian's eigenvalues carry the units of the variables. If one variable is a position in metres and another an angle in radians, a "unit" change in each has wildly different physical significance, and the second derivatives with respect to each can differ by many orders of magnitude for no physical reason. The condition number, and hence the iteration count, reflects that arbitrary choice. Rescaling each variable by a typical magnitude (so that a change of 1 in each scaled variable is comparably important) is a change of variables $\mathbf{x} = \mathbf{D}\tilde{\mathbf{x}}$ that transforms the Hessian to $\mathbf{D}\nabla^2 f\,\mathbf{D}$ and can shrink $\kappa$ dramatically. Newton's method, next lesson, is invariant to such rescalings, which is one of its great virtues.
:::

## Summary

| Symbol / result | Meaning |
| --- | --- |
| $\min f(\mathbf{x})$ s.t. $g_i \le 0$, $h_j = 0$ | Standard form; $p^\star$ optimal value, $\mathbf{x}^\star$ minimiser |
| $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ | First-order necessary condition (stationarity) |
| $\nabla^2 f(\mathbf{x}^\star) \succeq 0$ / $\succ 0$ | Second-order necessary / sufficient condition |
| $\nabla f^\top \mathbf{p} < 0$ | $\mathbf{p}$ is a descent direction |
| $f(\mathbf{x}+\alpha\mathbf{p}) \le f(\mathbf{x}) + c_1\alpha\nabla f^\top\mathbf{p}$ | Armijo sufficient-decrease condition, $c_1 \approx 10^{-4}$ |
| $\mathbf{x} \leftarrow \mathbf{x} - \alpha\nabla f$ | Gradient descent |
| $(\kappa-1)/(\kappa+1)$ | Contraction factor per step; iterations $\propto \kappa$ |
| $\kappa = \lambda_{\max}/\lambda_{\min}$ | Condition number of the Hessian |
| Rosenbrock $(1-x)^2 + 100(y-x^2)^2$ | Test function; $\kappa \approx 2{,}500$ at $(1,1)$ |

The next lesson replaces the identity in $\mathbf{p} = -\mathbf{B}^{-1}\nabla f$ with the Hessian or an approximation of it. That removes the dependence on $\kappa$ and turns tens of thousands of iterations into tens.
