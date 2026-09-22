---
id: l01-the-extended-kalman-filter
title: The Extended Kalman Filter — linearizing about the estimate
minutes: 21
covers:
  - 'The Extended Kalman Filter: linearization about the current estimate, Jacobians F and H, first-order truncation error'
---

Every filter this curriculum has built so far assumed the world was linear: a constant-velocity target, a linear measurement matrix $\mathbf{H}$, dynamics you could write as $\mathbf{x}_k=\mathbf{F}\mathbf{x}_{k-1}+\mathbf{w}_{k-1}$. Almost nothing a real vehicle senses or does is actually like that. A star tracker reports a unit vector through a nonlinear projection. A radar reports range and bearing, not Cartesian position. A quaternion evolves through a bilinear kinematic equation. An orbit's radius vector obeys an inverse-square law. The Extended Kalman Filter, EKF, is the oldest and still the most common answer to "what do I do with the Kalman filter's machinery when $\mathbf{f}$ and $\mathbf{h}$ are not linear" — it has flown on essentially every crewed and uncrewed spacecraft since Apollo, and it sits inside every consumer GPS receiver today.

The idea is disarmingly simple: keep the Kalman filter's predict-update structure exactly as the Kalman filter module derived it, propagate the state estimate through the true nonlinear functions, and linearize only where linearity is unavoidable — in the covariance's transformation law. That one design choice is both why the EKF works as well as it does on a huge range of real problems, and why it can fail in ways a linear Kalman filter never does. This lesson states the EKF precisely, derives the two Jacobians it needs, and quantifies exactly what "linearize" throws away. The next two lessons in this module build directly on it: one extends it to continuous time and to repeated relinearization, the next shows concretely how the throwing-away catches up with a filter that trusts it too far.

## The nonlinear state-space model

Write the model the way the Kalman filter module wrote the linear one, but let $\mathbf{f}$ and $\mathbf{h}$ be any differentiable functions:

$$
\mathbf{x}_k = \mathbf{f}(\mathbf{x}_{k-1}, \mathbf{u}_{k-1}) + \mathbf{w}_{k-1}, \qquad \mathbf{z}_k = \mathbf{h}(\mathbf{x}_k) + \mathbf{v}_k,
$$

with $\mathbf{w}_{k-1}\sim\mathcal N(\mathbf 0,\mathbf Q_{k-1})$ and $\mathbf{v}_k\sim\mathcal N(\mathbf 0,\mathbf R_k)$, white and mutually independent, exactly as the stochastic-model lesson assumed. Nothing about the noise changes. What changes is that $\mathbf f$ and $\mathbf h$ are no longer matrices — they are whatever nonlinear map the physics hands you: a coordinate transformation, a quaternion product, a $1/r^2$ force law, an $\operatorname{atan2}$.

The predict step of a linear Kalman filter needed only $\mathbb E[\mathbf x_k\mid \mathbf z_{1:k-1}] = \mathbf F\hat{\mathbf x}_{k-1}^+$, which followed from linearity of expectation. That identity has no nonlinear analogue: $\mathbb E[\mathbf f(\mathbf x)] \neq \mathbf f(\mathbb E[\mathbf x])$ in general. The EKF's answer is an approximation, stated plainly rather than hidden: pretend the state is concentrated enough around $\hat{\mathbf x}$ that the two sides are close, and propagate the single point $\hat{\mathbf x}$ through $\mathbf f$ itself rather than trying to propagate a whole distribution through it exactly. Everything else in this lesson is about making that approximation as good as it can be, and naming precisely what it costs.

## The Jacobians F and H

::: key The Extended Kalman Filter
$$
\hat{\mathbf x}_k^- = \mathbf f(\hat{\mathbf x}_{k-1}^+,\mathbf u_{k-1}), \qquad \mathbf P_k^- = \mathbf F_{k-1}\mathbf P_{k-1}^+\mathbf F_{k-1}^{\mathsf T} + \mathbf Q_{k-1},
$$
$$
\boldsymbol\nu_k = \mathbf z_k - \mathbf h(\hat{\mathbf x}_k^-), \qquad \mathbf H_k = \left.\frac{\partial \mathbf h}{\partial \mathbf x}\right|_{\hat{\mathbf x}_k^-}, \qquad \mathbf S_k = \mathbf H_k\mathbf P_k^-\mathbf H_k^{\mathsf T}+\mathbf R_k,
$$
$$
\mathbf K_k = \mathbf P_k^-\mathbf H_k^{\mathsf T}\mathbf S_k^{-1}, \qquad \hat{\mathbf x}_k^+ = \hat{\mathbf x}_k^- + \mathbf K_k\boldsymbol\nu_k, \qquad \mathbf P_k^+ = (\mathbf I-\mathbf K_k\mathbf H_k)\mathbf P_k^-,
$$
with $\mathbf F_{k-1}=\left.\dfrac{\partial \mathbf f}{\partial \mathbf x}\right|_{\hat{\mathbf x}_{k-1}^+,\,\mathbf u_{k-1}}$. The mean is carried through the true nonlinear $\mathbf f$ and $\mathbf h$; only $\mathbf P$'s transformation is linearized.
:::

Read that block slowly, because every symbol in it is doing exactly what the predict-and-update lesson's symbol did, with one substitution. $\hat{\mathbf x}_k^-$ is still the *a priori* state estimate, $\mathbf P_k^+$ still the *a posteriori* covariance, $\boldsymbol\nu_k$ still the innovation, $\mathbf K_k$ still the gain that balances how much the filter trusts its prediction against how much it trusts the new measurement. The gain formula, the covariance update, the innovation covariance $\mathbf S_k$ — all unchanged in *form*. What is new is $\mathbf F_{k-1}$ and $\mathbf H_k$: the **Jacobian matrices** of $\mathbf f$ and $\mathbf h$, matrices of partial derivatives that give the best *local, linear* approximation to a nonlinear map at a single point.

For a vector-valued $\mathbf h:\mathbb R^n\to\mathbb R^m$, the Jacobian is the $m\times n$ matrix whose $(i,j)$ entry is $\partial h_i/\partial x_j$, every entry evaluated at one specific point. That point matters enormously, and it is the detail this lesson is building toward: $\mathbf H_k$ is evaluated at $\hat{\mathbf x}_k^-$, the filter's own prediction — not at the true state $\mathbf x_k$, which no one, filter included, ever gets to see. $\mathbf F_{k-1}$ is evaluated at $\hat{\mathbf x}_{k-1}^+$ for the identical reason. The Jacobian answers "if I nudge the state a little starting from *here*, how does the output change" — and "here" is always the filter's best current guess, because that is the only point the filter has.

::: example The bearing-sensor Jacobian, exactly
A common GNC sensor model is bearing-only: a fixed or slowly-moving observer measures only the direction to a target, not its range. With state $\mathbf x=(x,\,y,\,\dot x,\,\dot y)^{\mathsf T}$ (target position and velocity relative to the observer) and measurement $h(\mathbf x)=\operatorname{atan2}(y,x)$, the Jacobian follows from ordinary calculus: with $r^2=x^2+y^2$,
$$
\frac{\partial h}{\partial x} = \frac{-y}{x^2+y^2}, \qquad \frac{\partial h}{\partial y} = \frac{x}{x^2+y^2}, \qquad \frac{\partial h}{\partial \dot x}=\frac{\partial h}{\partial \dot y}=0,
$$
so $\mathbf H(\mathbf x) = \left(-y/r^2,\ \ x/r^2,\ \ 0,\ \ 0\right)$. Evaluate this at $\hat{\mathbf x}=(812,\ 431,\ -60,\ 15)^{\mathsf T}\,\mathrm m$, so $r=919.30\,\mathrm m$:
$$
\mathbf H(\hat{\mathbf x}) = \left(-0.00051000,\ \ 0.00096083,\ \ 0,\ \ 0\right)\ \mathrm{rad/m}.
$$
A central finite difference at the same point, $\left[h(\hat{\mathbf x}+\epsilon\mathbf e_i)-h(\hat{\mathbf x}-\epsilon\mathbf e_i)\right]/2\epsilon$ with $\epsilon=10^{-6}\,\mathrm m$, gives the identical four numbers to at least eleven significant figures (the two agree to within $9.3\times10^{-12}$). This is the standard way to catch a wrong hand-derived Jacobian before it ever reaches a filter: code the finite difference once, diff it against the analytic formula on a handful of random states, and treat any disagreement bigger than the finite-difference step size itself as a bug in the analytic derivative, not in the numerics.
:::

```python
import numpy as np

def h(x):
    return np.array([np.arctan2(x[1], x[0])])

def H_analytic(x):
    r2 = x[0]**2 + x[1]**2
    return np.array([[-x[1]/r2, x[0]/r2, 0.0, 0.0]])

def H_finite_diff(x, eps=1e-6):
    H = np.zeros((1, len(x)))
    for i in range(len(x)):
        dx = np.zeros(len(x)); dx[i] = eps
        H[:, i] = (h(x+dx) - h(x-dx)) / (2*eps)
    return H

x0 = np.array([812.0, 431.0, -60.0, 15.0])
print(H_analytic(x0))
print(H_finite_diff(x0))
print(np.max(np.abs(H_analytic(x0) - H_finite_diff(x0))))
# [[-0.00051     0.00096083  0.          0.        ]]
# [[-0.00051     0.00096083  0.          0.        ]]
# 9.303408195736329e-12
```

Two Jacobians appear in the key block, and they are computed the same way but play different roles. $\mathbf H_k$ tells the filter how sensitive this measurement is to each state component, near the current prediction — it decides which combinations of states this particular sensor can and cannot see, exactly as the linear $\mathbf H$ did, only now that sensitivity itself changes from one estimate to the next. $\mathbf F_{k-1}$ plays the corresponding role for the dynamics: it tells the filter how a small error in yesterday's estimate grows (or shrinks) by today. A nonlinear $\mathbf f$ typically has an $\mathbf F$ that depends on the state itself, so unlike the time-invariant $\mathbf F$ of the constant-velocity model, an EKF's process-noise-covariance recursion $\mathbf P_k^-=\mathbf F_{k-1}\mathbf P_{k-1}^+\mathbf F_{k-1}^{\mathsf T}+\mathbf Q_{k-1}$ uses a *different* $\mathbf F_{k-1}$ nearly every cycle.

::: example A pendulum's Jacobian, and how fast it changes
A simple pendulum of length $L$ obeys $\ddot\theta = -(g_0/L)\sin\theta$. With state $\mathbf x=(\theta,\omega)^{\mathsf T}$, $\dot{\mathbf x}=\mathbf f(\mathbf x)=(\omega,\ -(g_0/L)\sin\theta)^{\mathsf T}$, and the Jacobian is
$$
\mathbf F(\mathbf x) = \frac{\partial \mathbf f}{\partial \mathbf x} = \begin{pmatrix}0 & 1\\ -(g_0/L)\cos\theta & 0\end{pmatrix}.
$$
Take $L=1\,\mathrm m$, $g_0=9.80665\,\mathrm{m/s^2}$. At $\theta_0=5^\circ$, $F_{21}=-(g_0/L)\cos 5^\circ = -9.76933\,\mathrm{s^{-2}}$; at $\theta_0=60^\circ$, $F_{21}=-4.90333\,\mathrm{s^{-2}}$; at $\theta_0=90^\circ$, $F_{21}=0$ exactly, since $\cos90^\circ=0$. The single derivative that governs how a nearby error grows changes by more than a factor of two, and passes through zero, over the same $90^\circ$ of swing a real pendulum-like attitude motion might cover in one orbit of an unstable spacecraft. A filter that computed $\mathbf F$ once and reused it for many cycles would be using a stale local slope in a region where the true slope has already changed sign.
:::

## First-order truncation error

Every derivative-based approximation drops something, and Taylor's theorem says exactly what. For a scalar $h$ and a perturbation $\boldsymbol\delta = \mathbf x-\hat{\mathbf x}$,

$$
h(\mathbf x) = h(\hat{\mathbf x}) + \mathbf H\boldsymbol\delta + \underbrace{\tfrac12\boldsymbol\delta^{\mathsf T}\nabla^2h(\hat{\mathbf x})\,\boldsymbol\delta + O(\|\boldsymbol\delta\|^3)}_{\text{first-order truncation error}},
$$

with $\mathbf H=\nabla h(\hat{\mathbf x})^{\mathsf T}$ as before. The EKF keeps the first two terms and calls the result the innovation's mean; the bracketed remainder is real, it does not vanish because the filter ignores it, and it is what the name "first-order truncation error" refers to — the filter is *first-order accurate*, exact only in the limit $\boldsymbol\delta\to \mathbf 0$. The remainder's size depends on two things a GNC engineer can actually reason about: how curved $h$ is near $\hat{\mathbf x}$ (how large $\nabla^2h$ is), and how large the actual spread of the state is (how big $\boldsymbol\delta$ typically gets, which the filter's own $\mathbf P$ reports).

::: example The bearing sensor's truncation error, exactly
Continue the bearing-sensor example, at $\hat{\mathbf x}$ with $r_0=919.30\,\mathrm m$, $\theta_0=27.959^\circ$. Perturb purely in the **cross-range** direction (perpendicular to the line of sight), $\mathbf x = \hat{\mathbf x}+s\,\hat{\mathbf u}_\perp$. This particular direction has a closed form: writing the position as a complex number, $x+iy = e^{i\theta_0}(r_0+is)$ exactly, so the true bearing is $\theta_0+\arctan(s/r_0)$ — no approximation. The first-order (linear) prediction is $\theta_0+s/r_0$, since $H=1/r_0$ for a pure cross-range offset. The truncation error is therefore the exact, closed-form remainder of the arctangent series,
$$
\arctan(s/r_0)-s/r_0 = -\tfrac13(s/r_0)^3+O\!\left((s/r_0)^5\right),
$$
**cubic**, not quadratic, in the offset — the quadratic term vanishes by symmetry for a perturbation exactly perpendicular to the line of sight. Numerically, at $s=150\,\mathrm m$ ($s/r_0=0.1632$): true bearing $=0.649717\,\mathrm{rad}$, linear prediction $=0.651142\,\mathrm{rad}$, truncation error $=-1.425\,\mathrm{mrad}$, against a cubic-term prediction of $-\tfrac13(0.1632)^3=-1.448\times10^{-3}\,\mathrm{rad}$ — matching to four significant figures. At $s=10\,\mathrm m$ the same error is only $-4.29\times10^{-7}\,\mathrm{rad}$: fifteen times smaller $s$ gives roughly $15^3\approx3400$ times smaller error, exactly the cubic scaling. A perturbation purely **along** the line of sight, by contrast, changes $r$ but not $\theta$ at all — the true and linear predictions agree exactly, to machine precision, at every offset tested up to $150\,\mathrm m$, because $H$ already captures all of the (zero) first-order sensitivity in that direction and there is no curvature left over to truncate.
:::

```python
import numpy as np

x0 = np.array([812.0, 431.0, -60.0, 15.0])
r0 = np.hypot(x0[0], x0[1])
theta0 = np.arctan2(x0[1], x0[0])
u_cross = np.array([-np.sin(theta0), np.cos(theta0), 0, 0])

for s in [10, 30, 60, 100, 150]:
    true_b = np.arctan2(*(x0 + s*u_cross)[[1, 0]])
    lin_b = theta0 + s/r0
    print(s, true_b - lin_b, -(s/r0)**3/3)
# 10  -4.29024315e-07  -4.29054774e-07
# 30  -1.15770823e-05  -1.15844789e-05
# 60  -9.24396798e-05  -9.26758312e-05
# 100 -4.26034121e-04  -4.29054774e-04
# 150 -1.42535904e-03  -1.44805986e-03
```

::: example How truncation error grows with the trajectory's own nonlinearity
Truncation error does not only grow with the *size* of the perturbation — it also grows with how nonlinear the *nominal* trajectory already is. Take the pendulum again and ask a different question: starting exactly at $(\theta_0,0)$, how well does the linearized map $\Phi(\Delta t)=\exp(\mathbf F(\theta_0)\Delta t)$ (built once, at the start of a $\Delta t=1\,\mathrm s$ interval) predict where a *nearby* trajectory, started $\delta\theta_0$ away, actually ends up — compared with numerically integrating both trajectories exactly and taking the difference? With $\delta\theta_0=2^\circ$ held fixed:

| $\theta_0$ | true $\Delta\theta$ after 1 s | linear-STM prediction | truncation error |
| --- | --- | --- | --- |
| $5^\circ$ | $-1.99974^\circ$ | $-1.99980^\circ$ | $0.054\ \mathrm{mdeg}$ |
| $30^\circ$ | $-1.98045^\circ$ | $-1.98264^\circ$ | $2.195\ \mathrm{mdeg}$ |
| $60^\circ$ | $-1.76284^\circ$ | $-1.77705^\circ$ | $14.204\ \mathrm{mdeg}$ |
| $90^\circ$ | $-0.97634^\circ$ | $-1.01651^\circ$ | $40.174\ \mathrm{mdeg}$ |

For exactly the same $2^\circ$ nudge, the linearization error is $40.174/0.054\approx744$ times larger at $\theta_0=90^\circ$ than at $\theta_0=5^\circ$. Nothing about the perturbation changed; only the curvature of $\sin\theta$ at the point being linearized about did. This is the mechanism to hold onto for the rest of this module: an EKF is not "accurate" or "inaccurate" in the abstract — it is accurate near where its own Jacobian was evaluated, and the size of that region shrinks wherever the true dynamics or measurement curve sharply.
:::

::: key First-order truncation error
The EKF keeps the constant and linear terms of a Taylor expansion of $\mathbf f$ and $\mathbf h$ about the current estimate and drops the rest. The dropped remainder is $O(\|\boldsymbol\delta\|^2)$ in general (cubic in special symmetric directions, as the bearing example shows) and grows with both the size of the state spread $\boldsymbol\delta$ and the local curvature of $\mathbf f$ or $\mathbf h$. Nothing in the filter's own reported $\mathbf P$ accounts for this term — it is gone entirely.
:::

## Why the evaluation point is the whole story

Look again at where $\mathbf F_{k-1}$ and $\mathbf H_k$ are evaluated in the key block: at $\hat{\mathbf x}_{k-1}^+$ and $\hat{\mathbf x}_k^-$, the filter's own estimates. A linear Kalman filter's $\mathbf F$ and $\mathbf H$ do not depend on the state at all, so this question never arises there — the matrices are fixed, correct, and identical whether the filter's current guess is close to the truth or badly wrong. An EKF has no such luxury. Its Jacobians are only as good as the point they are evaluated at, and the only point available is the filter's own, possibly wrong, current belief. If $\hat{\mathbf x}_k^-$ happens to sit somewhere the true curvature is severe, or far from where the true state actually is, $\mathbf H_k$ measures the sensitivity *there*, not at the truth — and every downstream quantity in the update, $\mathbf S_k$, $\mathbf K_k$, $\mathbf P_k^+$, inherits that mismatch silently, with no warning flag anywhere in the algebra. This single fact — linearizing about the estimate, never the truth, because the truth is exactly the one thing a filter never has — is the thread the rest of this module pulls on: the next lesson extends the recipe to continuous time and to relinearizing more than once per cycle, and the one after it shows a real filter breaking because of precisely this gap.

::: warning Do not confuse "linearize the covariance" with "linearize the state"
A common first-implementation bug is to propagate the *mean* through $\mathbf F\hat{\mathbf x}$ instead of through $\mathbf f(\hat{\mathbf x})$ — treating the EKF as if it were a linear Kalman filter with a state-dependent $\mathbf F$. This throws away exactly the accuracy the EKF is designed to keep: the mean update is supposed to use the *true* nonlinear function, with linearization confined entirely to how the *covariance* transforms. Propagating the mean linearly too turns a first-order-accurate filter into a much cruder one, and the error compounds silently because nothing in the covariance update reveals that the mean itself is now wrong.
:::

::: warning A Jacobian derived once is not a Jacobian derived forever
Because $\mathbf F$ and $\mathbf H$ generally depend on the state, a Jacobian that was correct at initialization can be badly wrong ten seconds later if the state has moved through a region of different curvature — as the pendulum's $F_{21}$ swinging from $-9.77$ to $0$ to $-4.90\,\mathrm{s^{-2}}$ shows. Every cycle needs its own evaluation, at the current estimate, not a cached value from a more convenient earlier state.
:::

## Check yourself

::: check
Write the EKF predict step for a general nonlinear $\mathbf f$, and state precisely which parts use $\mathbf f$ itself and which parts use $\mathbf F$.
:::

::: answer
$\hat{\mathbf x}_k^- = \mathbf f(\hat{\mathbf x}_{k-1}^+,\mathbf u_{k-1})$ uses the true nonlinear function directly — no linearization anywhere in the mean update. $\mathbf P_k^- = \mathbf F_{k-1}\mathbf P_{k-1}^+\mathbf F_{k-1}^{\mathsf T}+\mathbf Q_{k-1}$ uses only the Jacobian $\mathbf F_{k-1}=\partial\mathbf f/\partial\mathbf x$ evaluated at $\hat{\mathbf x}_{k-1}^+$; the covariance is transformed as though $\mathbf f$ were the linear map $\mathbf F_{k-1}$ near that point, which is the filter's one approximation.
:::

::: check
For $h(\mathbf x)=\sqrt{x^2+y^2}$ (a range-only sensor, in place of the bearing sensor's $\operatorname{atan2}$), derive the Jacobian $\mathbf H$ with respect to $\mathbf x=(x,y,\dot x,\dot y)^{\mathsf T}$.
:::

::: answer
$\partial h/\partial x = x/\sqrt{x^2+y^2}=x/r$ and $\partial h/\partial y=y/r$, by the chain rule on $r=(x^2+y^2)^{1/2}$; the velocity components do not appear in $h$, so both of those partials are zero. $\mathbf H(\mathbf x) = (x/r,\ \ y/r,\ \ 0,\ \ 0)$ — a unit vector pointing from the observer toward the target, exactly the direction along which range actually changes fastest, which is the geometric picture worth keeping alongside the algebra.
:::

::: check
Explain, without redoing the arithmetic, why a perturbation purely along the line of sight produced zero truncation error in the bearing-sensor example, while a perturbation purely across it produced a nonzero (cubic) error.
:::

::: answer
Bearing depends only on the *direction* to the target, not its range, so moving the target along the line already occupied changes $r$ but leaves $\theta$ completely unchanged — the function is exactly constant along that direction, so both its first derivative and every higher derivative along that direction are zero, and the linear approximation is exact, not merely close. Moving across the line of sight is the direction bearing is actually sensitive to; $H$ captures the *first* derivative of that sensitivity exactly, but $\theta_0+\arctan(s/r_0)$ is not itself linear in $s$, so something is necessarily left over — here, by the symmetry of a perpendicular offset, the something starts at third order rather than second.
:::

::: check
A different sensor has a measurement Jacobian whose magnitude is ten times larger at the filter's current estimate than it was one cycle ago, with the state's uncertainty $\mathbf P$ essentially unchanged. What does this imply about the innovation covariance $\mathbf S_k$ and the gain $\mathbf K_k$, and why might that be dangerous if the Jacobian's new, larger value is itself inaccurate?
:::

::: answer
$\mathbf S_k=\mathbf H_k\mathbf P_k^-\mathbf H_k^{\mathsf T}+\mathbf R_k$ grows roughly with $H^2$, so a tenfold larger $|\mathbf H_k|$ inflates the $\mathbf H_k\mathbf P_k^-\mathbf H_k^{\mathsf T}$ term roughly a hundredfold (before $\mathbf R_k$ is added), which in turn changes $\mathbf K_k=\mathbf P_k^-\mathbf H_k^{\mathsf T}\mathbf S_k^{-1}$ and how aggressively the update trusts the new measurement. If this new, larger Jacobian is itself only a first-order approximation evaluated at a poorly-placed estimate — exactly the truncation-error concern this lesson raises — the filter is computing a large, confident correction from a local slope that may not represent the true sensitivity at all, which is precisely the mechanism the next lesson in this module examines as a cause of divergence.
:::

::: check
Sketch what happens to the pendulum's truncation-error table if $\delta\theta_0$ is halved from $2^\circ$ to $1^\circ$ at every value of $\theta_0$, without recomputing anything numerically.
:::

::: answer
The dominant, leading-order part of the truncation error scales with $\delta\theta_0^2$ for a generic (non-symmetric) perturbation direction, since it is the first term the linearization drops in the Taylor expansion. Halving $\delta\theta_0$ should therefore cut every entry in the truncation-error column by roughly a factor of four, while the *ratio* between entries at different $\theta_0$ — driven entirely by how much $\sin\theta$ curves at each point, not by the size of the perturbation — stays close to what it was, so $\theta_0=90^\circ$ should still show an error on the order of several hundred times that at $\theta_0=5^\circ$.
:::

## Summary

| Item | Statement |
| --- | --- |
| Nonlinear model | $\mathbf x_k=\mathbf f(\mathbf x_{k-1},\mathbf u_{k-1})+\mathbf w_{k-1}$, $\mathbf z_k=\mathbf h(\mathbf x_k)+\mathbf v_k$; noise assumptions unchanged from the linear Kalman filter |
| EKF predict | $\hat{\mathbf x}_k^-=\mathbf f(\hat{\mathbf x}_{k-1}^+,\mathbf u_{k-1})$ (nonlinear); $\mathbf P_k^-=\mathbf F_{k-1}\mathbf P_{k-1}^+\mathbf F_{k-1}^{\mathsf T}+\mathbf Q_{k-1}$ (linearized) |
| EKF update | $\boldsymbol\nu_k=\mathbf z_k-\mathbf h(\hat{\mathbf x}_k^-)$ (nonlinear); $\mathbf K_k,\mathbf P_k^+$ formulas identical in form to the linear filter, built from $\mathbf H_k$ |
| Jacobians | $\mathbf F_{k-1}=\partial\mathbf f/\partial\mathbf x$ at $\hat{\mathbf x}_{k-1}^+$; $\mathbf H_k=\partial\mathbf h/\partial\mathbf x$ at $\hat{\mathbf x}_k^-$ — always at the current **estimate**, never the unknown truth |
| Truncation error | The Taylor remainder the EKF drops: $O(\|\boldsymbol\delta\|^2)$ generically, growing with both perturbation size and local curvature of $\mathbf f$ or $\mathbf h$ |
| Bearing-sensor example | $\mathbf H=(-y/r^2,\ x/r^2,\ 0,\ 0)$; cross-range truncation error is exactly cubic, $-\tfrac13(s/r_0)^3$; along-range error is exactly zero |

The next lesson keeps this same recipe but asks two further questions: what happens between measurements, when the dynamics are integrated in continuous time rather than advanced in one discrete jump, and what happens if the filter is allowed to relinearize more than once per measurement instead of settling for a single evaluation of $\mathbf H_k$.
