---
id: l03-variational-equations-stm-integration
title: The variational equations and computing the STM by integration
minutes: 16
covers:
  - The variational equations and computing the STM by integration
---

The previous lesson used $\boldsymbol\Phi(t,t_0)$ as a given object and built the batch normal equations on top of it. This lesson opens it up. For an unperturbed two-body orbit a closed form exists — the two-body module's Lagrange-coefficients lesson built exactly this, from the partial derivatives of $f$, $g$, $\dot f$, $\dot g$ — but the moment a real force enters that the closed form did not anticipate, there is no algebraic $\boldsymbol\Phi$ to fall back on. Every orbit determination system in operational use gets $\boldsymbol\Phi$ the general way: by integrating a differential equation for it, alongside the trajectory, using whatever force model — two-body, J2, drag, third-body — the mission needs. That differential equation is the subject of this lesson.

## Differentiating the flow

Write the equations of motion as a first-order system $\dot{\mathbf x}=\mathbf f(\mathbf x,t)$, with $\mathbf x=(\mathbf r,\mathbf v)$ six-dimensional. A solution starting from $\mathbf x_0$ at $t_0$ is a function of both $t$ and the starting point, $\mathbf x(t;\mathbf x_0)$, and $\boldsymbol\Phi(t,t_0)$ is by definition its Jacobian with respect to that starting point:
$$
\boldsymbol\Phi(t,t_0) \equiv \frac{\partial\mathbf x(t;\mathbf x_0)}{\partial\mathbf x_0}.
$$
Differentiate the equation of motion itself with respect to $\mathbf x_0$, exchanging the order of the time derivative and the $\mathbf x_0$-derivative (legitimate wherever $\mathbf f$ is smooth, which every force model in this module is):
$$
\frac{d}{dt}\left(\frac{\partial\mathbf x}{\partial\mathbf x_0}\right) = \frac{\partial}{\partial\mathbf x_0}\dot{\mathbf x} = \frac{\partial\mathbf f}{\partial\mathbf x_0} = \frac{\partial\mathbf f}{\partial\mathbf x}\,\frac{\partial\mathbf x}{\partial\mathbf x_0} .
$$
Writing $\mathbf A(t) \equiv \partial\mathbf f/\partial\mathbf x$, evaluated along the reference trajectory, this is exactly

$$
\dot{\boldsymbol\Phi}(t,t_0) = \mathbf A(t)\,\boldsymbol\Phi(t,t_0), \qquad \boldsymbol\Phi(t_0,t_0)=\mathbf I,
$$

the **variational equations**. The initial condition follows because $\mathbf x(t_0;\mathbf x_0)=\mathbf x_0$ identically, so its Jacobian with respect to $\mathbf x_0$ is the identity. This is a linear, time-varying, matrix ODE — linear in $\boldsymbol\Phi$ even though the underlying dynamics $\mathbf f$ is not linear in $\mathbf x$ — and $\mathbf A(t)$ is just the Jacobian of whatever force model is already being integrated, taken along the same trajectory.

## The two-body $\mathbf A(t)$, derived in full

For pure two-body motion, $\mathbf f(\mathbf x)=(\mathbf v,\ -\mu\mathbf r/r^3)$, independent of $t$ except through $\mathbf r(t)$ itself. In block form, with $\mathbf r$ and $\mathbf v$ each three components,
$$
\mathbf A = \begin{pmatrix} \partial\dot{\mathbf r}/\partial\mathbf r & \partial\dot{\mathbf r}/\partial\mathbf v \\ \partial\dot{\mathbf v}/\partial\mathbf r & \partial\dot{\mathbf v}/\partial\mathbf v \end{pmatrix}
= \begin{pmatrix} \mathbf 0 & \mathbf I \\ \mathbf G(\mathbf r) & \mathbf 0 \end{pmatrix},
$$
since $\dot{\mathbf r}=\mathbf v$ gives the top row directly, and $\dot{\mathbf v}=-\mu\mathbf r/r^3$ does not depend on $\mathbf v$ at all, giving the bottom-right zero block. The only real work is $\mathbf G=\partial\dot{\mathbf v}/\partial\mathbf r$, the gravity-gradient tensor. Componentwise, with $r=\lVert\mathbf r\rVert$,
$$
\frac{\partial}{\partial r_j}\left(-\frac{\mu r_i}{r^3}\right) = -\mu\left(\frac{\delta_{ij}}{r^3} - \frac{3r_ir_j}{r^5}\right) = \frac{\mu}{r^3}\left(\frac{3r_ir_j}{r^2}-\delta_{ij}\right),
$$
using $\partial r/\partial r_j = r_j/r$ and the quotient rule on $r_i/r^3$. In matrix form,
$$
\mathbf G(\mathbf r) = \frac{\mu}{r^3}\left(3\hat{\mathbf r}\hat{\mathbf r}^\mathsf T - \mathbf I\right).
$$
Its trace is $\frac{\mu}{r^3}(3-3)=0$ — Laplace's equation, exactly what is expected of the Hessian of a potential in empty space, away from the mass generating it — and it is symmetric, since it is a genuine Hessian ($\mathbf G=\partial^2/\partial\mathbf r^2$ of the potential $-\mu/r$, and mixed partials commute).

::: key The variational equations and the two-body Jacobian
$\dot{\boldsymbol\Phi}=\mathbf A(t)\boldsymbol\Phi$, $\boldsymbol\Phi(t_0,t_0)=\mathbf I$, with $\mathbf A=\partial\mathbf f/\partial\mathbf x$ along the reference trajectory. For two-body motion, $\mathbf A=\begin{pmatrix}\mathbf 0&\mathbf I\\ \mu r^{-3}(3\hat{\mathbf r}\hat{\mathbf r}^\mathsf T-\mathbf I)&\mathbf 0\end{pmatrix}$: velocity feeds position directly, and the gravity-gradient tensor feeds position error into velocity error, with zero trace and no dependence on velocity.
:::

::: example Checking $\mathbf G$ two ways
For the $420\,\mathrm{km}$-altitude orbit of the previous lesson at its epoch position ($r\approx6798\,\mathrm{km}$), evaluating $\mathbf G$ from the closed form above and from a central-difference Jacobian of the raw acceleration $-\mu\mathbf r/r^3$ agree to $1.2\times10^{-14}\,\mathrm{s^{-2}}$ — machine precision — and the computed trace is $-1.2\times10^{-21}\,\mathrm{s^{-2}}$, zero to round-off:

```python
import numpy as np
MU = 398600.4418   # km^3/s^2

def accel(r):
    return -MU*r/np.linalg.norm(r)**3

def G_analytic(r):
    rn = np.linalg.norm(r)
    rhat = r/rn
    return MU/rn**3 * (3*np.outer(rhat, rhat) - np.eye(3))

r0 = np.array([3149.693, 4949.506, 3421.126])   # km, this orbit's epoch position
G_a = G_analytic(r0)
h = 1e-4
G_fd = np.column_stack([(accel(r0+h*e) - accel(r0-h*e))/(2*h) for e in np.eye(3)])
print("max |G_analytic - G_fd| =", np.max(np.abs(G_a - G_fd)))
print("trace(G) =", np.trace(G_a))
# max |G_analytic - G_fd| = 1.1927514987e-14
# trace(G) = -1.164670302474663e-21
```
:::

## Integrating $\boldsymbol\Phi$ alongside the trajectory

$\boldsymbol\Phi$'s own ODE has $36$ scalar components — too many to integrate separately from the $6$-component trajectory it depends on, and pointless to try, since $\mathbf A(t)$ needs the current $\mathbf r(t)$ at every step anyway. The standard technique stacks both into one state: a $42$-vector $\big(\mathbf x,\ \operatorname{vec}\boldsymbol\Phi\big)$, with derivative $\big(\mathbf f(\mathbf x,t),\ \operatorname{vec}(\mathbf A(t)\boldsymbol\Phi)\big)$, integrated as a single ODE system from $\boldsymbol\Phi(t_0,t_0)=\mathbf I$ with `scipy.integrate.solve_ivp` exactly as any other trajectory. One integration produces both the propagated state and its exact (to integrator tolerance) sensitivity to the epoch, with no separate finite-difference step to tune.

That last point is worth demonstrating, because finite-differencing the propagator — perturb $\mathbf x_0$ in one direction, integrate twice, subtract, divide — is the obvious alternative and it has a real cost: the result depends on a step size $h$ that trades two competing errors.

::: example Why not just finite-difference the propagator?
Perturbing only the $x$-position by $\pm h$ and re-propagating one hour, then comparing the resulting column of the finite-difference Jacobian against the one obtained by integrating the variational equations directly:

```python
# h (km)     max error in the finite-difference column (vs. integrated Phi)
#  1e+00        3.96e-07
#  1e-01        4.30e-09
#  1e-02        3.14e-09   <- best trade-off for this case
#  1e-03        1.08e-08
#  1e-04        6.19e-08
#  1e-05        9.14e-07
#  1e-06        5.73e-06
#  1e-07        4.04e-05
```

Large $h$ leaves truncation error from the quadratic (and higher) terms the finite difference throws away; small $h$ leaves floating-point cancellation error, since $\mathbf x(\mathbf x_0+h)$ and $\mathbf x(\mathbf x_0-h)$ become nearly equal numbers whose difference loses precision. The error bottoms out somewhere in between — here around $h\approx10^{-2}\,\mathrm{km}$ — and that optimum shifts with the propagation time, the orbit, and even which state component is perturbed, so there is no single $h$ that is simply correct. Integrating the variational equations sidesteps the trade-off entirely: as an independent check, differencing $\boldsymbol\Phi$ at $t=1799\,\mathrm s$ and $t=1801\,\mathrm s$ to estimate $\dot{\boldsymbol\Phi}$ by a *time*-central-difference and comparing to $\mathbf A(1800\,\mathrm s)\boldsymbol\Phi(1800\,\mathrm s)$ agrees to $1.3\times10^{-6}$ — confirming the integrated $\boldsymbol\Phi$ genuinely satisfies its own defining equation, not merely that the code ran.
:::

## A free correctness check: $\det\boldsymbol\Phi$

Two-body motion (and J2, and any force that comes from a potential — conservative, in the physicist's sense) preserves phase-space volume, by Liouville's theorem; the flow map is measure-preserving, and a linear map that preserves volume has unit determinant. So $\det\boldsymbol\Phi(t,t_0)=1$ for every $t$, for any conservative force model, and checking it costs one `np.linalg.det` call on a matrix already being computed for other reasons. On the orbit above, two-body motion for one full period gives $\det\boldsymbol\Phi=1.0000000000$; adding J2 and propagating five periods still gives $\det\boldsymbol\Phi=0.9999999999$ — J2 comes from a (slightly more complicated) potential too, so the same conservation applies. Adding atmospheric drag — genuinely dissipative, removing energy from the orbit — breaks it on purpose: over one period with a representative drag parameter, $\det\boldsymbol\Phi=0.9999977521$, measurably below $1$. That is not integration error; it is the correct signature of a non-conservative force, and a $\boldsymbol\Phi$ that stayed at exactly $1.0$ under drag would be the one to distrust.

::: warning $\det\boldsymbol\Phi=1$ is necessary, not sufficient
A determinant of exactly $1$ under two-body or J2 dynamics is strong evidence the integration is healthy, but it is a single scalar summary of a $36$-number matrix — plenty of wrong matrices still have determinant $1$. Use it as a fast sanity check on every run, not as a substitute for the direct $\dot{\boldsymbol\Phi}=\mathbf A\boldsymbol\Phi$ check or a finite-difference cross-check when something is first being brought into service.
:::

## Extending to a real force model

Nothing about the variational-equation machinery changes when the dynamics gain the perturbations the perturbations module introduced — J2, drag, third-body, solar radiation pressure. Only $\mathbf A(t)$ grows a corresponding correction: the top-right block stays $\mathbf I$ (velocity always feeds position the same way), and for any perturbation that depends only on position, like J2 or a smooth third-body term, the bottom-right block stays exactly zero and only the gravity-gradient block $\mathbf G$ picks up extra terms. Atmospheric drag is different in one structural respect: because it depends on velocity relative to a corotating atmosphere, $\partial\dot{\mathbf v}/\partial\mathbf v$ is no longer zero, and the bottom-right block of $\mathbf A$ becomes genuinely nonzero for the first time — consistent with drag being the term that also breaks $\det\boldsymbol\Phi=1$. Whether a given correction to $\mathbf A$ is obtained by extending the analytic derivation above or by a local finite difference of just that one extra force term (cheap and safe when only a small piece of $\mathbf f$ is not in closed form) is a matter of convenience; the ODE for $\boldsymbol\Phi$, the augmented-state integration, and the correctness checks above apply unchanged either way. This is also exactly the STM a Cowell-method propagator — numerically integrating the full, unsimplified equations of motion, the perturbations module's own numerical-integration approach — produces alongside its trajectory, which is why Cowell integration and batch orbit determination pair so naturally.

::: example Drag breaks the free-flight symmetry of $\mathbf A$
Two-body and J2 both leave $\partial\dot{\mathbf v}/\partial\mathbf v=\mathbf 0$, so a small velocity error at one instant produces no *immediate* change in acceleration — it only matters once it has had time to move the position. With drag included, $\mathbf A$'s bottom-right block is nonzero: a velocity error immediately changes the relative-wind speed the drag force depends on, and hence the acceleration, in the same instant. This is a real physical difference, not a numerical artifact of one force model versus another; it is also, concretely, why $\det\boldsymbol\Phi$ stops being exactly $1$ the moment drag enters the dynamics.
:::

## Check yourself

::: check
Derive the initial condition $\boldsymbol\Phi(t_0,t_0)=\mathbf I$ directly from the definition $\boldsymbol\Phi(t,t_0)=\partial\mathbf x(t;\mathbf x_0)/\partial\mathbf x_0$, without appealing to "it's the identity because nothing has happened yet."
:::

::: answer
At $t=t_0$, the solution $\mathbf x(t;\mathbf x_0)$ evaluated at $t=t_0$ is, by the definition of an initial-value problem, just $\mathbf x_0$ itself: $\mathbf x(t_0;\mathbf x_0)=\mathbf x_0$ for every $\mathbf x_0$. Differentiating both sides of this identity with respect to $\mathbf x_0$ gives $\partial\mathbf x(t_0;\mathbf x_0)/\partial\mathbf x_0 = \partial\mathbf x_0/\partial\mathbf x_0=\mathbf I$, which is exactly $\boldsymbol\Phi(t_0,t_0)$.
:::

::: check
Why is $\mathbf G=\partial\dot{\mathbf v}/\partial\mathbf r$ symmetric for two-body motion, and would you expect that to remain true once J2 is added?
:::

::: answer
$-\mu\mathbf r/r^3$ is the gradient of the scalar potential $-\mu/r$, so $\mathbf G$ is that potential's Hessian, $\partial^2(-\mu/r)/\partial\mathbf r^2$, and mixed second partial derivatives of a smooth scalar function commute — that is precisely why $\mathbf G$ comes out symmetric. J2's contribution to the acceleration is also the gradient of a (more complicated, oblateness) potential term, so its contribution to $\mathbf G$ is a Hessian too, and the sum of two symmetric matrices is symmetric: $\mathbf G$ stays symmetric with J2 included. It would not stay symmetric if a force were added that could not be written as the gradient of a potential.
:::

::: check
A finite-difference STM computed with $h=10^{-6}\,\mathrm{km}$ is less accurate than one computed with $h=10^{-2}\,\mathrm{km}$, on the same propagation. Explain why smaller is not simply better here, using the two error sources named in this lesson.
:::

::: answer
Two error sources trade off against each other as $h$ shrinks. Truncation error — from dropping the quadratic and higher terms of the Taylor expansion that a central difference approximates — shrinks like $h^2$, favouring small $h$. Floating-point cancellation error — from subtracting two propagated states that become nearly identical as $h\to0$ and dividing by the now-tiny $2h$ — grows like (machine epsilon)$/h$, favouring large $h$. At $h=10^{-6}\,\mathrm{km}$ the cancellation term already dominates the truncation term, so the total error is larger than at the intermediate $h=10^{-2}\,\mathrm{km}$ where the two are roughly balanced.
:::

::: check
Propagating a drag-perturbed orbit for one orbital period gives $\det\boldsymbol\Phi=0.9999977521$. Is this evidence of a bug in the integrator?
:::

::: answer
No — it is the expected signature of a genuinely non-conservative force. Liouville's theorem guarantees $\det\boldsymbol\Phi=1$ only for dynamics derivable from a potential (conservative forces, like two-body gravity and J2); drag removes energy from the orbit and correspondingly contracts phase-space volume along the flow, so $\det\boldsymbol\Phi<1$ is exactly what a correct integration of a dissipative system should produce. It would be cause for concern only if this same contraction appeared under pure two-body or J2-only dynamics, where no such mechanism exists.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\boldsymbol\Phi(t,t_0)=\partial\mathbf x(t)/\partial\mathbf x_0$ | Definition; a Jacobian of the flow, not of one measurement |
| $\dot{\boldsymbol\Phi}=\mathbf A(t)\boldsymbol\Phi$, $\boldsymbol\Phi(t_0,t_0)=\mathbf I$ | The variational equations; $\mathbf A=\partial\mathbf f/\partial\mathbf x$ along the reference trajectory |
| $\mathbf A_{\text{2-body}}=\begin{pmatrix}\mathbf 0&\mathbf I\\ \mathbf G&\mathbf 0\end{pmatrix}$, $\mathbf G=\dfrac{\mu}{r^3}(3\hat{\mathbf r}\hat{\mathbf r}^\mathsf T-\mathbf I)$ | Two-body Jacobian; $\mathbf G$ symmetric, traceless |
| Augmented-state integration | Stack $(\mathbf x,\operatorname{vec}\boldsymbol\Phi)$, integrate one $42$-component ODE — no FD step size to tune |
| $\det\boldsymbol\Phi=1$ | Conservative forces only (two-body, J2, third-body); drag and other dissipative forces give $\det\boldsymbol\Phi<1$ |
| Drag's extra term | $\partial\dot{\mathbf v}/\partial\mathbf v\neq\mathbf 0$ — the one perturbation here that makes the bottom-right block of $\mathbf A$ nonzero |

With $\boldsymbol\Phi$ now fully in hand — its meaning, its equation, and how to get it for any force model — the next lesson leaves the batch formulation behind and asks what happens when observations are processed one at a time instead of all at once: the sequential filters the nonlinear-filters module already built, applied here to the orbit determination problem specifically.
