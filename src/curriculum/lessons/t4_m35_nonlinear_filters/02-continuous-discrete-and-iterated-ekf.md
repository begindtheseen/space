---
id: l02-continuous-discrete-and-iterated-ekf
title: The continuous-discrete EKF and the iterated EKF
minutes: 20
covers:
  - Continuous-discrete EKF and the iterated EKF
---

The Extended Kalman Filter lesson wrote the predict step as a single jump, $\hat{\mathbf x}_k^-=\mathbf f(\hat{\mathbf x}_{k-1}^+,\mathbf u_{k-1})$, as if the dynamics themselves were a discrete-time recipe. For a constant-velocity target that is fine, because the underlying continuous motion really does have a closed-form discrete solution. Almost nothing else in GNC is that convenient. An orbit propagates under a continuous gravity field between GPS fixes; a spacecraft's attitude rotates continuously between star-tracker frames; a descending vehicle's altitude evolves under continuous drag and thrust between radar pings. The filter still only gets to *update* at discrete measurement times, but what happens in between is governed by a differential equation, not a one-line map — and that mismatch has a name and a standard treatment: the **continuous-discrete EKF**.

This lesson covers two extensions to the previous lesson's recipe, both about getting more out of a single predict-update cycle than the plain EKF asks for. The first, continuous-discrete propagation, handles the *time between* measurements properly, integrating the true nonlinear dynamics and its linearized covariance together rather than approximating the whole interval with one frozen Jacobian. The second, the **iterated EKF**, handles a single measurement more thoroughly by relinearizing $\mathbf H$ more than once, closing the gap between "the first-order-accurate answer" and "the best answer the data actually supports." Both ideas will reappear, by name, later in this module.

## Continuous-discrete propagation

Write the continuous-time state equation as $\dot{\mathbf x}(t) = \mathbf f(\mathbf x(t),t) + \mathbf w(t)$, with $\mathbf w(t)$ continuous-time white noise of spectral density $\mathbf Q_c(t)$ — the continuous counterpart of the discrete $\mathbf Q_{k-1}$, exactly as the stochastic-model lesson's discretization of a continuous-time process related the two. Two things must be integrated forward across the interval between measurements, and they are integrated differently.

The mean has no linearization to worry about at all: $\dot{\hat{\mathbf x}}(t) = \mathbf f(\hat{\mathbf x}(t),t)$, integrated numerically (Runge-Kutta or better) across the interval, exactly the nonlinear differential equation the vehicle actually obeys. The covariance, by the same argument the discrete EKF used — linearize only where a genuinely nonlinear transformation law would otherwise be unmanageable — obeys a **continuous-time Lyapunov equation**:

::: key Continuous-discrete EKF propagation
$$
\dot{\hat{\mathbf x}}(t) = \mathbf f(\hat{\mathbf x}(t),t), \qquad \dot{\mathbf P}(t) = \mathbf F(t)\,\mathbf P(t) + \mathbf P(t)\,\mathbf F(t)^{\mathsf T} + \mathbf Q_c(t), \qquad \mathbf F(t) = \left.\frac{\partial\mathbf f}{\partial\mathbf x}\right|_{\hat{\mathbf x}(t)},
$$
integrated together from $t_{k-1}$ to $t_k$ to produce $\hat{\mathbf x}_k^-$ and $\mathbf P_k^-$; the update step is unchanged from the ordinary EKF. $\mathbf F(t)$ is evaluated **along the trajectory** $\hat{\mathbf x}(t)$, not frozen at its value at $t_{k-1}$.
:::

That last clause is the entire content of this section, and it is easy to miss in a hurried implementation. A tempting shortcut treats the interval as though $\mathbf F$ were constant — evaluate $\mathbf F$ once, at $t_{k-1}$, and use the exact linear-time-invariant discretization for that *frozen* system (the matrix exponential $\boldsymbol\Phi=\exp(\mathbf F\,\Delta t)$ and its associated discrete process noise, the same Van Loan construction a linear time-invariant Kalman filter would use). That shortcut is exact for a genuinely linear system, and it is a perfectly good approximation when $\Delta t$ is small relative to how fast $\mathbf F$ itself changes along the trajectory. It stops being a good approximation exactly when the trajectory sweeps through a region where the curvature of $\mathbf f$ changes quickly within a single interval — which, for a nonlinear system, is not a corner case, it is the normal situation.

::: example A pendulum's covariance, integrated properly against frozen at the start
Take the pendulum of the previous lesson, $L=1\,\mathrm m$, continuous process noise $\mathbf Q_c=\operatorname{diag}(0,\,q)$ with $q=0.02\,\mathrm{rad^2/s^3}$ on the angular-acceleration channel, and $\mathbf P_0=\operatorname{diag}\!\left((2^\circ)^2,(1^\circ/\mathrm s)^2\right)$. Propagate for $\Delta t=0.5\,\mathrm s$ two ways: (a) integrate $\dot{\hat{\mathbf x}}$ and $\dot{\mathbf P}$ together, with $\mathbf F(\hat\theta(t))$ re-evaluated continuously along the swing, using an adaptive eighth-order integrator; (b) freeze $\mathbf F$ at its value at $\theta_0$, and use the exact matrix-exponential discretization of that frozen linear system.

| $\theta_0$ | $\operatorname{tr}\mathbf P$, integrated (a) | $\operatorname{tr}\mathbf P$, frozen-$\mathbf F$ (b) | relative error |
| --- | --- | --- | --- |
| $5^\circ$ | $0.017483$ | $0.017469$ | $-0.08\%$ |
| $45^\circ$ | $0.015728$ | $0.014565$ | $-7.40\%$ |
| $80^\circ$ | $0.011908$ | $0.011255$ | $-5.49\%$ |

At $5^\circ$ the pendulum is nearly linear and freezing $\mathbf F$ costs almost nothing. At $45^\circ$ the frozen approximation understates the true propagated variance by $7.4\%$ over a single half-second step — not catastrophic on its own, but compounding every cycle of a filter that runs for minutes. The error does not increase monotonically with $\theta_0$ (it is smaller again at $80^\circ$ than at $45^\circ$ here) precisely because $\mathbf F$'s time history over the *whole* interval matters, not just its value at the interval's start; $\cos\theta$ is heading toward zero as $\theta_0$ grows past $45^\circ$, so the frozen value happens to be closer to the interval's time-average in that region. The lesson is not "errors grow monotonically with amplitude" — it is that freezing $\mathbf F$ silently substitutes one instant's curvature for the whole interval's, and how much that costs depends on the trajectory, not on a simple rule of thumb.
:::

```python
import numpy as np
from scipy.integrate import solve_ivp
from scipy.linalg import expm

G0, L, q = 9.80665, 1.0, 0.02
Qc = np.array([[0.0, 0.0], [0.0, q]])

def f(x):
    theta, omega = x
    return np.array([omega, -(G0/L)*np.sin(theta)])

def Fjac(x):
    theta, omega = x
    return np.array([[0.0, 1.0], [-(G0/L)*np.cos(theta), 0.0]])

def propagate_true(x0, P0, dt):
    def rhs(t, y):
        x, P = y[:2], y[2:].reshape(2, 2)
        F = Fjac(x)
        return np.concatenate([f(x), (F@P + P@F.T + Qc).flatten()])
    sol = solve_ivp(rhs, [0, dt], np.concatenate([x0, P0.flatten()]), method='DOP853', rtol=1e-11, atol=1e-12)
    y = sol.y[:, -1]
    return y[:2], y[2:].reshape(2, 2)

def propagate_frozen(x0, P0, dt):
    F0 = Fjac(x0)
    M = np.zeros((4, 4)); M[:2,:2] = -F0; M[:2,2:] = Qc; M[2:,2:] = F0.T
    eM = expm(M*dt)
    Phi = eM[2:, 2:].T
    Qd = Phi @ eM[:2, 2:]
    return Phi @ P0 @ Phi.T + Qd

P0 = np.diag([np.radians(2.0)**2, np.radians(1.0)**2])
for theta0_deg in [5.0, 45.0, 80.0]:
    x0 = np.array([np.radians(theta0_deg), 0.0])
    _, P_true = propagate_true(x0, P0, 0.5)
    P_frozen = propagate_frozen(x0, P0, 0.5)
    print(theta0_deg, np.trace(P_true), np.trace(P_frozen))
# 5.0  0.01748291840... 0.01746851...
# 45.0 0.01572786...    0.01456467...
# 80.0 0.01190834...    0.01125523...
```

## The iterated EKF

The ordinary EKF's update linearizes $\mathbf h$ exactly once, at $\hat{\mathbf x}_k^-$, and takes a single step from there. If $\hat{\mathbf x}_k^-$ is close to the truth and $\mathbf h$ is mild, one step is essentially all there is to gain. If the prior is far off, or the measurement is unusually informative, or $\mathbf h$ curves sharply, that single linearization can leave real accuracy on the table — the update moves the estimate, but the *new* $\hat{\mathbf x}_k^+$ is itself a better place to have linearized from than $\hat{\mathbf x}_k^-$ was.

The **iterated EKF (IEKF)** does exactly that: it repeats the update, relinearizing $\mathbf H$ at the newest iterate each time, but always measures the innovation against the *original* prior $\hat{\mathbf x}_k^-,\mathbf P_k^-$, so each iteration is a genuine update from the prior, not a chain of updates from updates.

::: key Iterated EKF update
Starting from $\mathbf x^{(0)}=\hat{\mathbf x}_k^-$, repeat for $i=0,1,2,\ldots$:
$$
\mathbf H^{(i)} = \left.\frac{\partial\mathbf h}{\partial\mathbf x}\right|_{\mathbf x^{(i)}}, \qquad \mathbf S^{(i)} = \mathbf H^{(i)}\mathbf P_k^-\mathbf H^{(i)\mathsf T}+\mathbf R_k, \qquad \mathbf K^{(i)} = \mathbf P_k^-\mathbf H^{(i)\mathsf T}\mathbf S^{(i)-1},
$$
$$
\mathbf x^{(i+1)} = \hat{\mathbf x}_k^- + \mathbf K^{(i)}\Big[\mathbf z_k-\mathbf h(\mathbf x^{(i)})-\mathbf H^{(i)}\big(\hat{\mathbf x}_k^--\mathbf x^{(i)}\big)\Big],
$$
until $\|\mathbf x^{(i+1)}-\mathbf x^{(i)}\|$ is negligible; then $\hat{\mathbf x}_k^+=\mathbf x^{(i+1)}$ and $\mathbf P_k^+=(\mathbf I-\mathbf K^{(i)}\mathbf H^{(i)})\mathbf P_k^-$ using the final iterate's $\mathbf H^{(i)}$.
:::

This is not a new idea invented for filtering — it is **Gauss-Newton**, the exact algorithm the nonlinear least-squares lesson derived, applied to the cost function $J(\mathbf x)=\tfrac12(\mathbf x-\hat{\mathbf x}_k^-)^{\mathsf T}(\mathbf P_k^-)^{-1}(\mathbf x-\hat{\mathbf x}_k^-)+\tfrac12(\mathbf z_k-\mathbf h(\mathbf x))^{\mathsf T}\mathbf R_k^{-1}(\mathbf z_k-\mathbf h(\mathbf x))$ — the negative log-posterior for a Gaussian prior and a Gaussian-noise nonlinear measurement, exactly the maximum-a-posteriori cost that lesson's MAP treatment wrote down for a static parameter. A single EKF update *is* one Gauss-Newton step from $\hat{\mathbf x}_k^-$; the iterated EKF is Gauss-Newton carried to convergence, and what it converges to is the local maximum of the true posterior, the *mode* — not merely the endpoint of one linear approximation to it. Where the ordinary Gauss-Newton lesson had no prior term (or an implicit flat one), the extra $(\mathbf P_k^-)^{-1}$ term here is exactly the prior-information matrix the recursive-least-squares/Kalman-bridge lesson identified as $\mathbf P^{-1}$, doing precisely the regularizing job it did there.

::: example One-shot against iterated against the true MAP, on a single bearing
Take a prior $\hat{\mathbf x}_k^-=(200,\,200)\,\mathrm m$ (position only, for a static single-update illustration), $\mathbf P_k^-=\operatorname{diag}(80^2,80^2)\,\mathrm m^2$, and one very precise bearing measurement, $\sigma_\theta=0.5^\circ$, $z=\operatorname{atan2}(y,x)$ generated from a true position $(80,\,260)\,\mathrm m$, giving $z=72.8973^\circ$ (the prior itself implies a bearing of only $45.000^\circ$ — a large, genuinely nonlinear correction is needed).

**One-shot EKF**: $\mathbf H=(-0.0025,\ 0.0025)$ at the prior, innovation $27.897^\circ$, gain $\mathbf K=(-199.81,\ 199.81)$, giving $\hat{\mathbf x}^+=(102.71,\,297.29)\,\mathrm m$.

**Iterated EKF**, relinearizing at each new iterate: $(200,200)\to(102.71,297.29)\to(73.05,243.86)\to(73.36,237.94)\to(73.63,238.96)\to(73.623,238.940)$, converged after five steps to $(73.6228,\,238.9397)\,\mathrm m$ (the last step moved the estimate by only $1.2\times10^{-4}\,\mathrm m$).

**Numerical MAP**, found independently by direct minimization of $J(\mathbf x)$ with no linearization at all: $(73.6228,\,238.9397)\,\mathrm m$ — agreeing with the iterated EKF to within $6\,\mathrm{\mu m}$. The one-shot EKF, by contrast, is $65.2\,\mathrm m$ from this same numerical MAP. A single bearing cannot fully pin down a 2-D position (it constrains only the direction, not the range along it), so neither answer matches the true $(80,260)$ exactly — that is a genuine, expected limit of the information in one measurement, not a filter error. What the comparison shows is narrower and sharper: the iterated update converges to the correct *mode of the posterior the prior and the measurement actually define*, and the one-shot update does not.
:::

```python
import numpy as np
from scipy.optimize import minimize

def h(x): return np.arctan2(x[1], x[0])
def Hjac(x):
    r2 = x[0]**2 + x[1]**2
    return np.array([-x[1]/r2, x[0]/r2])

def wrap(a): return (a+np.pi) % (2*np.pi) - np.pi

x0m = np.array([200.0, 200.0]); P0 = np.diag([80.0**2, 80.0**2])
sigma_th = np.radians(0.5); R = sigma_th**2
x_true = np.array([80.0, 260.0]); z = h(x_true)
P0inv = np.linalg.inv(P0)

x_iter = x0m.copy()
for i in range(6):
    Hi = Hjac(x_iter)
    Si = Hi@P0@Hi.T + R
    Ki = P0@Hi.T/Si
    resid = wrap(z - h(x_iter) - Hi@(x0m-x_iter))
    x_iter = x0m + Ki*resid

def cost(x):
    dx = x-x0m
    rz = wrap(z - h(x))
    return 0.5*dx@P0inv@dx + 0.5*rz**2/R

res = minimize(cost, x0m, method='Nelder-Mead',
                options=dict(xatol=1e-12, fatol=1e-16, maxiter=50000, maxfev=50000))
print(x_iter, res.x, np.linalg.norm(x_iter-res.x))
# [ 73.6228315  238.93972163] [ 73.6228299  238.93971622] 5.6e-06
```

::: warning The iterated EKF still uses a single Gaussian
Iterating removes the *linearization* error of a single update — it does not touch the deeper assumption that the posterior is well described by one Gaussian in the first place. If the true posterior is multi-modal (this module returns to exactly that case with particle filters), Gauss-Newton will converge to whichever mode its starting point happens to fall into and report a covariance that says nothing about the other mode's existence. Iterating fixes *how well* the filter finds a peak; it does not fix *which* peak, nor does it notice there might be more than one.
:::

::: warning Continuous-discrete propagation needs an actual ODE integrator, not a bigger discrete step
A common shortcut for "continuous dynamics" is simply to shrink $\Delta t$ and reuse the ordinary discrete EKF's one-Jacobian-per-step recipe many times across the interval. That converges to the continuous-discrete result as $\Delta t\to0$, but for a fixed, practical step count it is doing the same frozen-$\mathbf F$ approximation this lesson's example measured, just chopped into smaller pieces — better than one big frozen step, still not the same as integrating $\mathbf F(t)$ continuously along the true trajectory with a real integrator.
:::

## Check yourself

::: check
State which two quantities are integrated together in the continuous-discrete EKF's predict step, and which one requires no linearization at all.
:::

::: answer
The mean $\hat{\mathbf x}(t)$, obeying $\dot{\hat{\mathbf x}}=\mathbf f(\hat{\mathbf x},t)$, and the covariance $\mathbf P(t)$, obeying $\dot{\mathbf P}=\mathbf F(t)\mathbf P+\mathbf P\mathbf F(t)^{\mathsf T}+\mathbf Q_c(t)$, integrated together from $t_{k-1}$ to $t_k$. The mean equation needs no linearization whatsoever — it is the true nonlinear ODE, integrated numerically exactly as it stands; only the covariance equation uses the Jacobian $\mathbf F(t)$, and that Jacobian must be evaluated along the evolving $\hat{\mathbf x}(t)$, not frozen at its value at $t_{k-1}$.
:::

::: check
Explain, in one sentence, why the iterated EKF is described as "Gauss-Newton applied to the MAP cost," and identify which term in that cost plays the role the prior's information matrix played in the recursive-least-squares lesson.
:::

::: answer
Each iteration of the IEKF update is algebraically identical to one Gauss-Newton step on $J(\mathbf x)=\tfrac12(\mathbf x-\hat{\mathbf x}_k^-)^{\mathsf T}(\mathbf P_k^-)^{-1}(\mathbf x-\hat{\mathbf x}_k^-)+\tfrac12(\mathbf z_k-\mathbf h(\mathbf x))^{\mathsf T}\mathbf R_k^{-1}(\mathbf z_k-\mathbf h(\mathbf x))$, so repeating the update to convergence is exactly Gauss-Newton run to convergence rather than stopped after one step; the prior term's $(\mathbf P_k^-)^{-1}$ is the same information-matrix regularizer that appeared as $\mathbf P^{-1}$ in the recursive-least-squares/Kalman-bridge lesson, keeping the cost well-posed even where the measurement alone would not fully determine $\mathbf x$.
:::

::: check
In the bearing worked example, the iterated EKF's converged estimate is $22.0\,\mathrm m$ from the true position $(80,260)$, even though it matches the numerical MAP to within six microns. Is this a failure of the iterated EKF? Explain.
:::

::: answer
No — it is the correct behavior of a filter that has been given exactly one scalar measurement (a bearing) against a two-dimensional unknown. A single bearing constrains only the *direction* from the observer, leaving an entire line of positions equally consistent with it; the posterior's mode along that line is determined by where the Gaussian prior happens to weight it, not by the true position, which the data alone cannot distinguish from any other point on the same line. The iterated EKF is faithfully finding the correct answer to the well-posed problem "what is the MAP estimate given this prior and this one measurement" — the fact that this MAP estimate is not the true position reflects a genuine limit on the *information available*, not an error in how the filter used it.
:::

::: check
A colleague argues that since the iterated EKF converges to the MAP estimate, its reported covariance $\mathbf P_k^+$ must automatically be more accurate than the one-shot EKF's. Is this necessarily true?
:::

::: answer
Not necessarily. $\mathbf P_k^+=(\mathbf I-\mathbf K^{(i)}\mathbf H^{(i)})\mathbf P_k^-$ using the *final* iterate's Jacobian is a better local approximation to the posterior's curvature at its actual mode than the one-shot filter's covariance (built from a Jacobian evaluated at the prior, possibly far from the mode) — so in practice it usually is an improvement. But this covariance is still only the Gaussian (Laplace-type) approximation to the posterior's curvature at the mode found; if the true posterior is skewed, heavy-tailed, or has other modes nearby, converging exactly to the right mode does not by itself guarantee the quadratic approximation around that mode is a good description of the whole distribution.
:::

::: check
Suppose a filter uses a fixed $\Delta t=0.5\,\mathrm s$ discrete EKF (no continuous-discrete integration) on the pendulum problem, freezing $\mathbf F$ at the start of every interval. Based on this lesson's numbers, at which swing amplitude would you expect the accumulated covariance error, over many cycles, to be most concerning: consistently large-amplitude swings near $80^\circ$, or swings that vary between $5^\circ$ and $45^\circ$ from cycle to cycle?
:::

::: answer
The single-interval relative errors measured were $-0.08\%$ at $5^\circ$, $-7.40\%$ at $45^\circ$, and $-5.49\%$ at $80^\circ$ — the worst single-step error in this data was at $45^\circ$, not at the largest amplitude, because the frozen Jacobian's mismatch depends on how much $\mathbf F(t)$ changes across the *specific* interval, not simply on how large $\theta_0$ is. A filter whose swings vary between $5^\circ$ and $45^\circ$ would be expected to accumulate more error per cycle, on this evidence, than one sitting consistently near $80^\circ$ — a reminder that "more nonlinear region" and "worse frozen-Jacobian error" are correlated but not the same statement, and the only reliable way to know is to check the specific trajectory, as this lesson's table did.
:::

## Summary

| Item | Statement |
| --- | --- |
| Continuous-discrete predict | $\dot{\hat{\mathbf x}}=\mathbf f(\hat{\mathbf x},t)$ integrated exactly; $\dot{\mathbf P}=\mathbf F(t)\mathbf P+\mathbf P\mathbf F(t)^{\mathsf T}+\mathbf Q_c(t)$ integrated with $\mathbf F(t)$ evaluated along the trajectory |
| Frozen-$\mathbf F$ shortcut | Exact only for a truly LTI interval; measured $-0.08\%$ to $-7.40\%$ trace error over $0.5\,\mathrm s$ on the pendulum, depending on how much $\mathbf F$ actually varies across that interval |
| Iterated EKF | Relinearize $\mathbf H$ at each new iterate, always measuring the innovation against the original prior; equivalent to Gauss-Newton on the MAP cost, converging to the posterior mode |
| IEKF vs one-shot | On the bearing example, the iterated update matched the independently-computed numerical MAP to $6\,\mathrm{\mu m}$; the one-shot update was $65.2\,\mathrm m$ off |
| Limits of iterating | Fixes the accuracy of finding *a* mode; does nothing for a genuinely multi-modal posterior, which needs the tools later in this module |

Both extensions in this lesson make a single EKF cycle work harder without changing its fundamental character: still one Gaussian, still linearized about an estimate. The next lesson turns to what happens when that character itself becomes the problem — a concrete case where the EKF's linearization-about-the-estimate causes the filter to diverge outright.
