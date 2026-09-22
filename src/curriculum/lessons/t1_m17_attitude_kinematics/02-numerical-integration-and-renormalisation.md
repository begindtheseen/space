---
id: l02-numerical-integration-and-renormalisation
title: Integrating attitude numerically, and re-normalisation
minutes: 21
covers:
  - numerical integration of attitude with re-normalisation
---

The kinematic equations of the previous lesson are exact, and every one of them preserves its own constraint exactly: the DCM stays orthonormal, the quaternion stays unit-length. A numerical integrator preserves neither, because it does not follow the exact flow. It follows a polynomial approximation to it, and polynomials do not know about spheres.

The consequence is a standing chore in every attitude propagator ever flown. Each cycle the integrator advances the attitude state, the state drifts a little off its constraint manifold, and something has to push it back. That push is **re-normalisation** — dividing a quaternion by its norm, or orthonormalising a DCM — and it costs a few microseconds per cycle on a flight processor. This lesson is about what the drift actually looks like, how big it gets for realistic rates and step sizes, how to correct it cheaply, and the thing re-normalisation emphatically does not do, which is make the answer more accurate.

Get this right once and it disappears into the background for the rest of your career. Get it wrong and you spend a week chasing a 0.06 per cent scale factor in a navigation filter that everyone else assumes is a sensor calibration error.

## Where the error goes

Write the attitude state as a vector $\mathbf{x}$ living on a manifold $\mathcal{M}$ — the unit sphere $S^3$ for a quaternion, the rotation group for a DCM. The exact flow keeps $\mathbf{x}$ on $\mathcal{M}$. One step of a numerical method lands at $\mathbf{x}_{k+1}$ with a local error that has two parts: a component **tangent** to $\mathcal{M}$, which is a wrong attitude, and a component **normal** to it, which is not an attitude at all.

The two behave differently and need different treatment.

- The **tangent** part is ordinary truncation error. For a $p$-th order method it accumulates as $O(\Delta t^{\,p})$ over a fixed interval, and the only cures are a smaller step or a better method. Re-normalisation cannot touch it.
- The **normal** part is the constraint violation. It is visible for free — compute $\lVert\mathbf{q}\rVert$ or $\mathbf{C}^\top\mathbf{C}$ — and it can be removed at any time by projecting back onto $\mathcal{M}$.

That split is the whole mental model. The constraint violation is a *symptom* you can monitor and a *defect* you can repair; it is not the error you care about, and repairing it tells you nothing about the error you do care about.

## How large is the drift, really

For the quaternion, the answer is available in closed form when $\boldsymbol{\omega}$ is constant, because then $\dot{\mathbf{q}} = \mathbf{A}\mathbf{q}$ with $\mathbf{A} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})$ constant and skew. Any explicit Runge–Kutta method of order $p$ applies the same polynomial each step,

$$
\mathbf{q}_{k+1} = P(\mathbf{A}\Delta t)\,\mathbf{q}_k, \qquad P(z) = \sum_{j=0}^{p}\frac{z^j}{j!}\ \ \text{for the classical methods},
$$

and $\mathbf{A}$ has eigenvalues $\pm i\lambda$ with $\lambda = \lVert\boldsymbol{\omega}\rVert/2$. So the norm is multiplied every step by $\lvert P(i\theta)\rvert$ with $\theta = \lambda\Delta t$. Expanding,

$$
\lvert P_{\text{Euler}}(i\theta)\rvert = \sqrt{1 + \theta^2} \approx 1 + \tfrac{1}{2}\theta^2,
\qquad
\lvert P_{\text{RK4}}(i\theta)\rvert \approx 1 - \frac{\theta^6}{144}.
$$

Two facts to carry away. Forward Euler **grows** the norm, at second order in the step — the exponential blow-up everyone has seen. RK4 **shrinks** it, at sixth order per step, which is fifth order over a fixed interval. The sign matters for diagnosis: a norm creeping upward says your integration is worse than second order accurate, which usually means a first-order scheme somewhere, not round-off.

::: example Ten minutes of a spinning upper stage at 100 Hz
A solid-motor upper stage is spun to 60 rpm about its body $z$ axis for a coast, with a residual transverse rate, so $\boldsymbol{\omega} = (0.4,\, -0.3,\, 6.2832)\,\mathrm{rad/s}$ and $\lVert\boldsymbol{\omega}\rVert = 6.303\,\mathrm{rad/s} = 361^\circ/\mathrm{s}$. Its inertial measurement unit propagates the quaternion at $100\,\mathrm{Hz}$, so $\Delta t = 0.01\,\mathrm{s}$ and $\theta = \lambda\Delta t = 0.0315\,\mathrm{rad}$. Ten minutes of coast is 60 000 steps.

```python
import numpy as np

def omega_matrix(w):
    wx, wy, wz = w
    return np.array([[0.0, -wx, -wy, -wz],
                     [wx, 0.0, wz, -wy],
                     [wy, -wz, 0.0, wx],
                     [wz, wy, -wx, 0.0]])

def propagate(w, dt, n, scheme, renorm):
    """Integrate qdot = 0.5 Omega(w) q from the identity, constant w."""
    A = 0.5 * omega_matrix(w)
    q = np.array([1.0, 0.0, 0.0, 0.0])
    for _ in range(n):
        if scheme == "euler":
            q = q + dt * (A @ q)
        else:
            k1 = A @ q
            k2 = A @ (q + 0.5 * dt * k1)
            k3 = A @ (q + 0.5 * dt * k2)
            k4 = A @ (q + dt * k3)
            q = q + dt / 6.0 * (k1 + 2 * k2 + 2 * k3 + k4)
        if renorm:
            q = q / np.linalg.norm(q)
    return q

w = np.array([0.4, -0.3, 6.2832])              # 60 rpm spin plus a transverse rate
for scheme in ("euler", "rk4"):
    for renorm in (False, True):
        q = propagate(w, 0.01, 60000, scheme, renorm)   # 600 s at 100 Hz
        print(f"{scheme:5s} renorm={str(renorm):5s}  norm-1 = {np.linalg.norm(q) - 1: .3e}")
# euler renorm=False  norm-1 =  8.590e+12
# euler renorm=True   norm-1 = -1.110e-16
# rk4   renorm=False  norm-1 = -4.082e-07
# rk4   renorm=True   norm-1 =  0.000e+00
```

Check the Euler number against the formula: $\tfrac{1}{2}\theta^2 = 4.97\times 10^{-4}$ per step, and $(1 + 4.97\times 10^{-4})^{60000} = e^{29.8} = 8.6\times 10^{12}$. The quaternion has not drifted off the sphere; it has left the building. For RK4, $\theta^6/144 = 6.80\times 10^{-12}$ per step gives $-4.08\times 10^{-7}$ over the run, matching to three figures.

Now the part that matters. Compare each result against the exact solution, which for constant $\boldsymbol{\omega}$ is a steady rotation of $\lVert\boldsymbol{\omega}\rVert t$ about the fixed axis $\boldsymbol{\omega}/\lVert\boldsymbol{\omega}\rVert$, and take the angle of the error rotation. RK4 is off by $1.78\times 10^{-3}$ degrees, which is $6.4$ arcseconds after ten minutes and 600 revolutions. Forward Euler is off by $71.7$ degrees. And both numbers are **identical whether or not the code re-normalised** — to every digit, with re-normalisation applied every step, every 10 steps, every 1000 steps or never.
:::

That last sentence deserves its own explanation, because it is not a coincidence of this example.

## Re-normalisation changes length, not direction

The kinematic equation is linear and homogeneous in $\mathbf{q}$: the right-hand side $\tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}$ depends on the state only through that one factor, and $\boldsymbol{\omega}$ comes from the gyros or from the dynamics, not from $\mathbf{q}$. So every stage of a Runge–Kutta step is linear in $\mathbf{q}_k$, and the whole step is a matrix acting on $\mathbf{q}_k$. Scale $\mathbf{q}_k$ by any constant $c$ and $\mathbf{q}_{k+1}$ scales by exactly the same $c$. Re-normalisation is a rescaling. It therefore commutes with the integrator and leaves the *direction* of the propagated quaternion — which is the attitude — untouched.

::: key What re-normalisation does and does not do
Dividing by the norm removes the constraint violation and nothing else. For the linear quaternion kinematic equation it does not change the attitude by one bit, at any cadence. It is there to stop the state diverging in magnitude, to keep the derived DCM a true rotation, and to give you a cheap health monitor — not to improve accuracy. Accuracy comes from the order of the method and the size of the step.
:::

Why bother at all, then? Three concrete reasons, all from flight software.

1. **The DCM you build from $\mathbf{q}$ carries a scale factor of $\lVert\mathbf{q}\rVert^2$.** The rotation matrix is quadratic in the quaternion components, so a norm of $1.0003$ makes every transformed vector $0.06\,\%$ too long, and the matrix is no longer orthonormal. A star-tracker residual, a wheel-torque command, a thrust direction — all of them come out scaled. Downstream estimators read that as a real signal.
2. **Magnitude divergence is real.** The Euler run above reached $10^{13}$; a single-precision state would have overflowed. Even a well-behaved scheme, left alone for a long mission, wanders far enough to matter.
3. **It is the cheapest health check you own.** One subtraction per cycle tells you whether the integration is behaving. A norm that jumps means corrupted gyro data, a missed cycle, or a bad step.

::: example What one cheap Newton step buys
Dividing by $\lVert\mathbf{q}\rVert$ needs a square root and four divisions. On processors where that hurts, the standard trick is one Newton step on the constraint: with $\varepsilon = \mathbf{q}^\top\mathbf{q} - 1$,

$$
\mathbf{q} \leftarrow \tfrac{1}{2}\,(3 - \mathbf{q}^\top\mathbf{q})\,\mathbf{q},
$$

four multiplies, three adds, no square root, no division. Its residual is second order in $\varepsilon$: expanding $\sqrt{1+\varepsilon}\,(1 - \varepsilon/2) = 1 - \tfrac{3}{8}\varepsilon^2 + O(\varepsilon^3)$.

With $\varepsilon = 10^{-3}$ — an enormous violation — the corrected norm is off by $-3.75\times 10^{-7}$, exactly $-\tfrac{3}{8}\varepsilon^2$. With $\varepsilon = 10^{-6}$ it is off by $-3.75\times 10^{-13}$, and with $\varepsilon = 10^{-9}$ the residual is below double precision and the result is unit to the last bit. For the RK4 run above, where $\varepsilon \approx 2\lvert{-}4.08\times 10^{-7}\rvert = 8.2\times 10^{-7}$, one Newton step leaves a residual of $2.5\times 10^{-13}$ — three million times smaller than the violation it was handed.

The lesson is that the cheap correction is not a compromise. When the violation is already small, one Newton step is indistinguishable from an exact normalisation.
:::

## Orthonormalising a DCM

A DCM has six constraints, so the repair is a little more work. Three options, in increasing cost and quality.

**Gram–Schmidt.** Normalise row 1, subtract its projection from row 2 and normalise, cross them for row 3. Cheap and always available, but it privileges row 1: the error is pushed onto rows 2 and 3 instead of being shared.

**One Newton step, the symmetric version.** With $\mathbf{C}$ nearly orthonormal,

$$
\mathbf{C} \leftarrow \tfrac{3}{2}\mathbf{C} - \tfrac{1}{2}\,\mathbf{C}\,\mathbf{C}^\top\mathbf{C},
$$

which is the matrix analogue of the quaternion Newton step and shares the error evenly. It converges quadratically: starting from a matrix with $\max\lvert\mathbf{C}\mathbf{C}^\top - \mathbf{I}\rvert = 1.62\times 10^{-4}$, one pass gives $4.33\times 10^{-8}$ and a second gives $1.55\times 10^{-15}$.

**Polar decomposition.** $\mathbf{C} \leftarrow \mathbf{C}(\mathbf{C}^\top\mathbf{C})^{-1/2}$, computed from an SVD, gives the nearest orthogonal matrix in the Frobenius norm. It is the right answer and far too expensive for a 400 Hz loop; keep it for ground tools and for recovering a badly corrupted matrix.

::: example DCM against quaternion at the same step size
Run the same spinning stage for the same 600 s, this time propagating $\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C}$ with RK4 at $\Delta t = 0.01\,\mathrm{s}$. Without any repair, the orthonormality defect $\max\lvert\mathbf{C}\mathbf{C}^\top - \mathbf{I}\rvert$ reaches $5.21\times 10^{-5}$ and $\det\mathbf{C} - 1 = -5.22\times 10^{-5}$. Its singular values are $1$, $0.999974$ and $0.999974$: the matrix now shrinks vectors by up to 26 parts per million in two directions as well as rotating them. Apply the symmetric Newton step every cycle and the defect sits at $2.2\times 10^{-16}$, machine precision, for the price of two $3\times 3$ products.

The attitude error, though, is $2.85\times 10^{-2}$ degrees — sixteen times worse than the quaternion run at the same step size. The reason is in the eigenvalues. The DCM equation has eigenvalues $\pm i\lVert\boldsymbol{\omega}\rVert$ and $0$; the quaternion equation has $\pm i\lVert\boldsymbol{\omega}\rVert/2$. The quaternion resolves the motion at half the frequency because of the half-angle, so its effective $\theta$ is half, and a fourth-order method is $2^4 = 16$ times more accurate on it. Add the cost — four states against nine, and a $4\times 4$ times $4\times 1$ product against a $3\times 3$ times $3\times 3$ — and the case for propagating the quaternion is not close.

To confirm the order, halve the step: the quaternion RK4 attitude error goes $0.4534^\circ \to 0.02846^\circ \to 1.781\times 10^{-3}\,^\circ \to 1.113\times 10^{-4}\,^\circ$ for $\Delta t = 0.04, 0.02, 0.01, 0.005\,\mathrm{s}$, ratios $15.93$, $15.98$, $16.00$. The norm drift over the same steps goes $-4.171\times 10^{-4} \to -1.306\times 10^{-5} \to -4.082\times 10^{-7}$, ratios of about 32, confirming the fifth-order behaviour the polynomial predicted.
:::

## MRPs: switching, not normalising

Modified Rodrigues parameters have no constraint to violate, so there is nothing to re-normalise. What they need instead is the shadow-set switch: whenever $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} > 1$, replace

$$
\boldsymbol{\sigma} \leftarrow -\frac{\boldsymbol{\sigma}}{\boldsymbol{\sigma}^\top\boldsymbol{\sigma}} .
$$

This is not optional maintenance; without it the state runs to infinity at the first full revolution. Propagating the spinning stage above with MRPs at $\Delta t = 0.001\,\mathrm{s}$ for 3 s — three complete revolutions, since $6.303 \times 3 = 18.91\,\mathrm{rad}$ — the switched version performs exactly three switches, one per revolution as it passes $\Phi = 180^\circ$, and ends at $\lVert\boldsymbol{\sigma}\rVert = 0.01491$. That matches $\tan(\Phi_{\text{final}}/4)$ for the leftover $18.909 - 6\pi = 0.0596\,\mathrm{rad}$ of rotation, to four figures. The unswitched version overflows to a floating-point infinity before the run ends.

Note that the switch *is* a discontinuity in the state, unlike a re-normalisation. Anything reading the state — a filter covariance, a numerical derivative, a controller with memory — has to be told it happened.

::: warning Do not fix the constraint inside the derivative function
The place for a re-normalisation or a shadow switch is between complete integration steps, on the state. Putting one inside the routine that evaluates the derivative, or between the stages of a Runge–Kutta step, makes the effective right-hand side a different, non-smooth function of the state. An adaptive step controller then sees a discontinuity in its error estimate and either refuses to grow the step or thrashes. It also breaks the order conditions the method was derived from, so your fourth-order integrator quietly stops being fourth order.
:::

::: warning A unit quaternion is not a correct quaternion
The most expensive attitude bug is the one where the norm is a perfect $1.000000000$ and the vehicle is pointing somewhere else. Re-normalisation guarantees the first and says nothing about the second. Validate accuracy separately: propagate a constant-rate case against the closed-form $\exp(-[\boldsymbol{\omega}\times]t)$, halve the step and confirm the error falls by the factor your method promises, and — once the dynamics are attached — check the conserved quantities.
:::

::: note What flight software actually does
A common arrangement: integrate the quaternion with RK4 or a fourth-order predictor–corrector at the gyro rate, re-normalise once per cycle with the Newton step, and flag the cycle if $\lvert\mathbf{q}^\top\mathbf{q} - 1\rvert$ exceeds a threshold several orders of magnitude above the expected drift — say $10^{-6}$ when RK4 at that rate produces $10^{-11}$ per cycle. The threshold is a corruption detector, not a drift detector. Strapdown inertial navigators for high-rate vehicles go further and use the exponential-map update of the next lesson, which has no drift to remove at all.
:::

## Check yourself

::: check
A quaternion propagator runs at 200 Hz on a vehicle whose peak rate is $30^\circ/\mathrm{s}$. Estimate the per-step norm drift for forward Euler and for RK4, and say how long each takes to reach a norm error of $10^{-6}$.
:::

::: answer
$\lVert\boldsymbol{\omega}\rVert = 30^\circ/\mathrm{s} = 0.5236\,\mathrm{rad/s}$, $\Delta t = 0.005\,\mathrm{s}$, so $\theta = \lVert\boldsymbol{\omega}\rVert\Delta t/2 = 1.309\times 10^{-3}$.

Forward Euler grows the norm by $\tfrac{1}{2}\theta^2 = 8.57\times 10^{-7}$ per step. Reaching $10^{-6}$ takes about $10^{-6}/8.57\times 10^{-7} \approx 1.2$ steps — 6 milliseconds. Forward Euler is unusable here without re-normalisation every cycle, and even then its attitude error is second order and unacceptable.

RK4 shrinks the norm by $\theta^6/144 = (1.309\times 10^{-3})^6/144 = 3.5\times 10^{-20}$ per step. Reaching $10^{-6}$ would take $2.8\times 10^{13}$ steps, or about 4500 years. In practice the RK4 norm drift at this rate and step is entirely round-off — a random walk of order $10^{-16}$ per step — and re-normalisation exists to stop that random walk accumulating, not to fight truncation.
:::

::: check
Your propagator's quaternion norm is $1.0003$. Quantify what that does to a $7.7\,\mathrm{km/s}$ velocity vector transformed from inertial to body axes, and to the orthonormality of the matrix.
:::

::: answer
The DCM built from a quaternion is quadratic in its components, so a non-unit quaternion produces $\lVert\mathbf{q}\rVert^2\,\mathbf{R}$ for the true rotation $\mathbf{R}$. Here $\lVert\mathbf{q}\rVert^2 = 1.0003^2 = 1.00060009$, so every transformed vector is $0.060\,\%$ too long: the velocity comes out as $7.7 \times 1.0006 = 7.7046\,\mathrm{km/s}$, an error of $4.6\,\mathrm{m/s}$. The matrix satisfies $\mathbf{C}^\top\mathbf{C} = 1.0006\,\mathbf{I}$ rather than $\mathbf{I}$, so it is a rotation composed with a uniform stretch — still invertible, no longer a rotation, and with a determinant of $1.0018$ rather than 1. A navigation filter fed this will attribute the scale error to an accelerometer or a gyro scale factor and calibrate a real sensor to compensate for a software bug.
:::

::: check
Prove that re-normalising a quaternion between RK4 steps cannot change the attitude the propagation produces, when $\boldsymbol{\omega}$ does not depend on $\mathbf{q}$.
:::

::: answer
With $\boldsymbol{\omega}$ independent of $\mathbf{q}$, the right-hand side is $f(\mathbf{q}) = \mathbf{A}\mathbf{q}$ with $\mathbf{A} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})$, a linear homogeneous map. Each RK4 stage is a linear combination of $\mathbf{q}_k$ and previous stages, and each stage evaluates $\mathbf{A}$ on such a combination, so by induction every stage is linear and homogeneous in $\mathbf{q}_k$. Hence $\mathbf{q}_{k+1} = \mathbf{P}\,\mathbf{q}_k$ for a matrix $\mathbf{P}$ that depends on $\mathbf{A}$ and $\Delta t$ but not on $\mathbf{q}_k$.

Replace $\mathbf{q}_k$ by $c\,\mathbf{q}_k$ for a scalar $c$, and the next state becomes $c\,\mathbf{P}\mathbf{q}_k = c\,\mathbf{q}_{k+1}$. So a rescaling at any step propagates forward as an overall scale and never rotates the state. Since the attitude is the direction of $\mathbf{q}$, it is unchanged. The argument fails when $\boldsymbol{\omega}$ depends on $\mathbf{q}$ — an attitude feedback law, for instance — but then the norm error is also feeding the controller, which is a reason to re-normalise, not a reason to doubt the result.
:::

::: check
You halve the step size in an attitude propagator and the attitude error falls by a factor of 4, not 16, although the code calls a fourth-order integrator. Name two explanations and how to tell them apart.
:::

::: answer
First: something in the loop is lower order. A common case is the angular velocity being held constant across the step at its value at $t_k$ instead of being re-evaluated at the RK4 stage times $t_k$, $t_k + \Delta t/2$, $t_k + \Delta t$ — a zero-order hold on $\boldsymbol{\omega}$ makes the whole scheme first or second order regardless of the tableau. Test by running a constant-$\boldsymbol{\omega}$ case, where the hold is exact; if the ratio returns to 16, that was it.

Second: the error has stopped being truncation. At small steps, round-off accumulates as roughly $\sqrt{N}$ and eventually dominates, so the total error curve flattens and then rises again. Test by plotting error against step size on log axes and looking for the minimum, or by repeating in higher precision: a truncation-dominated run is unchanged, a round-off-dominated one improves.

A third possibility worth checking: a constraint fix applied inside the stages, which breaks the order conditions as described above.
:::

::: check
For the MRP propagation of a vehicle tumbling at $6.3\,\mathrm{rad/s}$, how often does a shadow-set switch occur, and why is that number not twice as large?
:::

::: answer
The switch fires when $\lVert\boldsymbol{\sigma}\rVert$ crosses 1, which is $\Phi = 180^\circ$ since $\lVert\boldsymbol{\sigma}\rVert = \tan(\Phi/4)$. At $6.3\,\mathrm{rad/s}$ a full revolution takes $2\pi/6.3 = 0.997\,\mathrm{s}$, so switches come about once a second.

Once, not twice, per revolution. Going up through $\Phi = 180^\circ$, $\lVert\boldsymbol{\sigma}\rVert$ crosses 1 from below and the switch replaces it with the shadow vector, whose norm is $1/\lVert\boldsymbol{\sigma}\rVert$ and which then *decreases* back toward zero as $\Phi$ runs on to $360^\circ$. The shadow set is describing the same attitude as the rotation the short way round, by $360^\circ - \Phi$, and that angle is shrinking. So each revolution has exactly one crossing, and the state stays inside the unit ball with $\Phi \le 180^\circ$ at all times.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Tangent vs normal error | Truncation (a wrong attitude) vs constraint violation (not an attitude) |
| $\theta = \lVert\boldsymbol{\omega}\rVert\Delta t/2$ | The quaternion step parameter; half the DCM value |
| $\lvert P_{\text{Euler}}\rvert \approx 1 + \theta^2/2$ | Forward Euler grows the norm; $8.6\times 10^{12}$ after 60 000 steps at $\theta = 0.0315$ |
| $\lvert P_{\text{RK4}}\rvert \approx 1 - \theta^6/144$ | RK4 shrinks it; $-4.1\times 10^{-7}$ over the same run |
| $\mathbf{q} \leftarrow \mathbf{q}/\lVert\mathbf{q}\rVert$ | Exact re-normalisation; changes length only, never attitude |
| $\mathbf{q} \leftarrow \tfrac{1}{2}(3 - \mathbf{q}^\top\mathbf{q})\mathbf{q}$ | Newton step; residual $-\tfrac{3}{8}\varepsilon^2$, no square root |
| $\mathbf{C} \leftarrow \tfrac{3}{2}\mathbf{C} - \tfrac{1}{2}\mathbf{C}\mathbf{C}^\top\mathbf{C}$ | DCM orthonormalisation, quadratically convergent |
| $\lVert\mathbf{q}\rVert^2$ scale factor | Norm $1.0003$ stretches every rotated vector by $0.06\,\%$ |
| $\boldsymbol{\sigma} \leftarrow -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ | MRP shadow switch at $\lVert\boldsymbol{\sigma}\rVert > 1$, once per revolution |
| Quaternion RK4 at 100 Hz, $361^\circ/\mathrm{s}$ | $6.4$ arcseconds of attitude error after 10 minutes |

The next lesson stays with the quaternion and goes through the integration schemes one by one — Euler, Heun, RK4, the closed-form exponential map — measuring the drift each produces and showing the update that has no norm drift by construction.
