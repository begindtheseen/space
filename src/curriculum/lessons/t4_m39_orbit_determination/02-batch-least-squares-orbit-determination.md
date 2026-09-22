---
id: l02-batch-least-squares-orbit-determination
title: Batch least-squares orbit determination with the state transition matrix
minutes: 16
covers:
  - Batch least-squares orbit determination with the state transition matrix
---

The previous lesson turned a handful of observations into a rough state: good enough to know roughly where the object is, nowhere near good enough to predict a conjunction or plan a rendezvous. Batch orbit determination is what closes that gap. Instead of three or four measurements it takes every observation over an arc — hours to weeks, one station or a dozen — and asks a single, precise question: which epoch state, propagated forward through the true dynamics, best explains all of them at once?

This is a nonlinear least-squares problem exactly like the ones the least-squares module built machinery for, with one difference that changes everything practical about it: the "model" connecting the unknown state to a measurement three hours later is not an algebraic formula, it is a numerical integration of the equations of motion. Differentiating through an integrator is exactly what the state transition matrix (STM) is for, and this lesson takes it as given — a matrix Φ(t,t₀) that maps a small change in the epoch state to the resulting change at any later time — while the next lesson derives where it actually comes from. What matters here is what batch OD does with it: build the same normal equations the least-squares module derived, iterate them with Gauss-Newton over the whole trajectory, and confront a conditioning problem that is entirely about units rather than physics.

## The batch problem as nonlinear least squares

Let $\mathbf x_0$ be the state at a chosen epoch $t_0$ — position and velocity, six components, for now. A reference trajectory $\mathbf x_{\text{ref}}(t)$ follows by propagating $\mathbf x_0$ forward with the best available dynamical model. Each measurement $y_i$, taken at time $t_i$, is modelled as $y_i = h_i(\mathbf x(t_i)) + v_i$ — a range, a range-rate, an angle, computed from the true state at $t_i$, corrupted by noise $v_i$.

The state transition matrix is defined by exactly the property its name promises: for a small perturbation $\delta\mathbf x_0$ to the epoch state, the resulting perturbation to the state at any later time $t$ is, to first order,
$$
\delta\mathbf x(t) = \boldsymbol\Phi(t, t_0)\,\delta\mathbf x_0, \qquad \boldsymbol\Phi(t_0,t_0)=\mathbf I, \qquad \boldsymbol\Phi(t_2,t_0)=\boldsymbol\Phi(t_2,t_1)\boldsymbol\Phi(t_1,t_0).
$$
It is the linearization of the *entire nonlinear flow* of the dynamics, not of any one measurement. Chain rule then gives the sensitivity of a measurement to the epoch state through the state at its own time:
$$
\widetilde{\mathbf H}_i \equiv \frac{\partial y_i}{\partial\mathbf x_0} = \underbrace{\frac{\partial h_i}{\partial\mathbf x(t_i)}}_{\mathbf H_i(t_i)}\ \boldsymbol\Phi(t_i, t_0).
$$
$\mathbf H_i(t_i)$ is an ordinary measurement partial, evaluated along the reference trajectory at $t_i$ — the same row of unit line-of-sight vectors and similar partials that any single-epoch fit would use. $\boldsymbol\Phi(t_i,t_0)$ carries that sensitivity back to the one epoch every measurement in the arc shares, which is what lets a batch spanning days be expressed in six (or a few more) unknowns instead of one set per observation.

With the residual $\delta y_i = y_i - h_i(\mathbf x_{\text{ref}}(t_i))$, the linearized model is $\delta y_i \approx \widetilde{\mathbf H}_i\,\delta\mathbf x_0 + v_i$ — precisely the weighted linear least-squares problem of the least-squares module, with $\widetilde{\mathbf H}_i$ playing the role that module called $\mathbf H$. Its normal equations follow immediately:

::: key Batch normal equations
$$
\boldsymbol\Lambda\,\delta\mathbf x_0 = \mathbf N, \qquad
\boldsymbol\Lambda = \sum_i (\mathbf H_i\boldsymbol\Phi_i)^\mathsf T \mathbf W_i (\mathbf H_i\boldsymbol\Phi_i), \qquad
\mathbf N = \sum_i (\mathbf H_i\boldsymbol\Phi_i)^\mathsf T \mathbf W_i\,\delta y_i,
$$
with $\boldsymbol\Phi_i=\boldsymbol\Phi(t_i,t_0)$ and $\mathbf W_i$ the measurement weight (usually $\mathbf R_i^{-1}$). Solve with `np.linalg.solve`, never an explicit inverse — the same advice the least-squares module gave the first time this matrix appeared.
:::

This is Gauss-Newton, exactly as the least-squares module's nonlinear least-squares lesson built it, with $\widetilde{\mathbf H}_i$ standing in for that lesson's $\mathbf H(\mathbf x_k)$. The one genuine difference is what re-linearizing costs: an algebraic model's Jacobian is cheap to re-evaluate at a new guess, but here every iteration means re-integrating the reference trajectory (and its STM) from the epoch forward before a single new residual can even be computed. Batch OD is Gauss-Newton where every evaluation of the model is a numerical integration.

::: example Three passes, twelve hours, one epoch state
A $420\,\mathrm{km}$-altitude, near-circular LEO orbit ($a=6798.137\,\mathrm{km}$, $e=0.001$, $i=51.6^\circ$) is tracked by one station across three passes in a twelve-hour window (centred near $3.1\,\mathrm h$, $4.7\text{-}4.8\,\mathrm h$, and $9.6\,\mathrm h$), giving $111$ epochs of range and range-rate — $222$ scalar observations, range noise $\sigma_\rho=5\,\mathrm m$, range-rate noise $\sigma_{\dot\rho}=1\,\mathrm{mm/s}$, ranges spanning $521$–$1464\,\mathrm{km}$. The starting guess is deliberately rough, in the spirit of the previous lesson's IOD output: $3.9\,\mathrm{km}$ off in position, $2.7\,\mathrm{m/s}$ off in velocity.

```python
# Gauss-Newton over the whole arc: re-integrate, re-linearize, re-solve.
#   it   RMS range(m)  RMS rate(mm/s)   |correction|: dr(m)   dv(m/s)
#    0      15297.730       132839.4          5043       2.937
#    1        738.185         3288.3          1204       4.645
#    2         71.204          625.1            14.17    0.0352
#    3          5.018            0.945           0.026    0.0001
#    4          5.016            0.942         1.6e-05    3.3e-08
```

Four iterations take the correction from kilometres down to fractions of a millimetre, and the residual RMS settles at $5.016\,\mathrm m$ and $0.942\,\mathrm{mm/s}$ — matching the injected $5\,\mathrm m$ and $1\,\mathrm{mm/s}$ to within a few percent, which is exactly what a correctly specified fit to correctly weighted data should do. On noiseless data the same iteration converges to the true epoch state to within $5\times10^{-5}\,\mathrm m$ in position and $7\times10^{-5}\,\mathrm{mm/s}$ in velocity — the residual floor above is measurement noise, not estimator error.
:::

## Why the normal matrix is badly scaled in kilometres and seconds

Look at $\boldsymbol\Phi(t,t_0)$ itself before it ever reaches $\boldsymbol\Lambda$. For the orbit above, propagated one hour with two-body dynamics:

```
Phi(3600 s, 0):
top-left  (dr/dr0)      entries up to    ~8          (dimensionless)
top-right (dr/dv0)      entries up to ~7900  s        <- position response to a velocity error
bottom-left (dv/dr0)    entries down to ~0.009  1/s   <- velocity response to a position error
bottom-right (dv/dv0)   entries up to    ~8          (dimensionless)
det(Phi) = 0.9999999999988   (symplectic: a genuine check on the integration)
```

A one-metre-per-second error in the epoch velocity turns, one hour later, into nearly an eight-kilometre position error ($7900\,\mathrm s \times 1\,\mathrm{m/s}$); a one-metre error in epoch position turns into less than a centimetre-per-second velocity error. Both are physically real — this is exactly the $g\approx\Delta t$ growth of a velocity error into a position error that the two-body module's Lagrange-coefficients lesson derived — but they mean $\boldsymbol\Phi$'s own entries span about seven orders of magnitude when position is measured in kilometres and time in seconds. Since $\widetilde{\mathbf H}_i=\mathbf H_i\boldsymbol\Phi_i$, every velocity column of $\widetilde{\mathbf H}_i$ inherits that same $10^3$–$10^4$ multiplier relative to the position columns, and $\boldsymbol\Lambda=\sum\widetilde{\mathbf H}_i^\mathsf T\mathbf W_i\widetilde{\mathbf H}_i$ squares it. On the worked example above, the diagonal of $\boldsymbol\Lambda$ reads
$$
\operatorname{diag}(\boldsymbol\Lambda) \approx \big(5.3\times10^{12},\ 1.3\times10^{13},\ 6.3\times10^{12} \mid 1.2\times10^{19},\ 1.8\times10^{17},\ 6.9\times10^{18}\big),
$$
position entries around $10^{12}$–$10^{13}$, velocity entries around $10^{17}$–$10^{19}$ — a five-to-seven order of magnitude gap before a single off-diagonal correlation is even considered, and $\operatorname{cond}(\boldsymbol\Lambda)=1.11\times10^{12}$ overall. That conditioning is not telling you anything about how observable the orbit is; it is telling you that kilometres and seconds are the wrong units to solve a linear system in. Consistent with the least-squares module's own linear least-squares lesson, $\operatorname{cond}(\boldsymbol\Lambda)\approx\operatorname{cond}(\widetilde{\mathbf H})^2$ here too — the design matrix alone has $\operatorname{cond}(\widetilde{\mathbf H})=1.05\times10^6$, and squaring it in the normal equations reproduces $\boldsymbol\Lambda$'s $1.11\times10^{12}$ almost exactly, the same reason that lesson gave for preferring QR on $\widetilde{\mathbf H}$ over forming $\boldsymbol\Lambda$ explicitly whenever the conditioning is already this poor.

## Non-dimensionalising fixes it

The fix is a change of units, not a change of algorithm. Pick a distance unit $DU$ (Earth's equatorial radius is a common, convenient choice; the orbit's own semi-major axis works equally well) and a time unit $TU=\sqrt{DU^3/\mu}$ chosen so that $\mu=1$ in the new units — the canonical units used throughout astrodynamics. A natural velocity unit follows, $DU/TU$, which is of the same order as a circular orbital speed at radius $DU$. With $DU=6378.137\,\mathrm{km}$, $TU=806.811\,\mathrm s$, $DU/TU=7.905\,\mathrm{km/s}$ — a scale actually representative of the problem's own position and velocity magnitudes, unlike "one kilometre" and "one second" which are not.

Write $\delta\mathbf x_0 = \mathbf S^{-1}\delta\mathbf x_0^{\text{nd}}$ with $\mathbf S=\operatorname{diag}(1/DU,1/DU,1/DU,\,TU/DU,TU/DU,TU/DU)$, so $\delta\mathbf x_0^{\text{nd}}$ is dimensionless. The linearized model becomes $\delta y_i \approx (\widetilde{\mathbf H}_i\mathbf S^{-1})\,\delta\mathbf x_0^{\text{nd}} + v_i$: same physics, same measurements, only the columns of the design matrix are rescaled. In these units the same $\boldsymbol\Phi(3600\,\mathrm s,0)$ above has every entry between about $-10$ and $9$ — no block in the thousands, none in the thousandths — and the resulting normal matrix has $\operatorname{cond}(\boldsymbol\Lambda^{\text{nd}})=2.03\times10^7$, an improvement of nearly five orders of magnitude over the $1.11\times10^{12}$ in raw kilometres and seconds. Solving in canonical units and converting $\delta\mathbf x_0=\mathbf S^{-1}\delta\mathbf x_0^{\text{nd}}$ back afterward gives the identical converged state — the two runs above agree to a few hundredths of a millimetre in position and a few hundredths of a micrometre per second in velocity, well inside the noise floor of the fit itself. Non-dimensionalising changes nothing about the answer; it changes how many of the solver's digits are trustworthy on the way there, which matters far more once solve-for parameters or a longer arc push the raw conditioning even further from $1$.

::: key Non-dimensionalise before solving
$\operatorname{cond}(\boldsymbol\Lambda)$ in raw kilometres-and-seconds is dominated by the units, not the observability of the orbit — velocity columns of $\widetilde{\mathbf H}$ carry a multiplier of order $10^3$–$10^4\,\mathrm s$ from $\boldsymbol\Phi$ that position columns do not. Scaling position by $DU$ and velocity by $DU/TU$ before forming $\boldsymbol\Lambda$ removes that artificial gap; the converged estimate is unchanged, only its numerical conditioning improves.
:::

## Solve-for parameters: growing the state

Nothing about the normal equations above required $\mathbf x_0$ to stop at six components. A drag coefficient, a station's range bias, a small thrust — any suspected error source can be added as an extra *solve-for* parameter, with its own column in $\widetilde{\mathbf H}$: the partial of each measurement with respect to that parameter, mapped back to the epoch through its own sensitivity equation exactly as position and velocity are mapped through $\boldsymbol\Phi$. The normal equations, the iteration, the non-dimensionalising — everything above extends unchanged to a seven-, eight-, or larger-dimensional $\delta\mathbf x_0$.

Solving for a parameter is not the only option, and not always the right one: a parameter that the data barely constrains can be solved for anyway, in which case it absorbs noise and can corrupt the epoch state it is estimated alongside, or it can be left fixed at its best-known value while its *uncertainty* is still honestly propagated into the reported covariance — a consider parameter. Which choice fits a drag coefficient, and how unmodelled dynamics are kept from masquerading as noise in the first place, is the subject of the process-noise and consider-covariance lessons later in this module; the mechanism to extend the state is already in hand.

::: example Growing the state by one: a solve-for ballistic coefficient
Repeating the fit above with a seventh state — a drag parameter $B$ multiplying the atmospheric density model — costs one extra column of $\widetilde{\mathbf H}$ per observation (built the same way, by mapping $\partial(\text{acceleration})/\partial B$ back to the epoch) and one extra row and column in $\boldsymbol\Lambda$. The position and velocity solution barely moves, but the formal covariance on $B$ shrinks with more data exactly like any other state component's does — the sign that this parameter, at least on this arc, is observable enough to be worth solving for rather than merely considering. Whether that remains true on a shorter arc is a question about observability, taken up directly in a later lesson.
:::

::: warning Re-linearizing is not optional here
In an algebraic nonlinear least-squares problem, a slightly stale Jacobian from the previous iterate is often harmless. In batch OD it is not: $\boldsymbol\Phi(t_i,t_0)$ is the linearization of the *dynamics themselves* along the *current* reference trajectory, and once $\mathbf x_0$ has moved by more than a small fraction of the orbit's own sensitivity scale, the old $\boldsymbol\Phi$ no longer describes how a further correction would propagate. Every iteration re-propagates the reference trajectory and its STM from the new $\mathbf x_0$ before building a new $\boldsymbol\Lambda$ — skipping this step is the single most common way to make batch OD silently diverge.
:::

## Check yourself

::: check
A colleague computes $\widetilde{\mathbf H}_i$ as $\boldsymbol\Phi(t_i,t_0)\,\mathbf H_i(t_i)$ instead of $\mathbf H_i(t_i)\,\boldsymbol\Phi(t_i,t_0)$. Explain, from the shapes of the matrices alone, why this cannot be right in general.
:::

::: answer
$\mathbf H_i(t_i)$ is $m\times6$ (measurement dimension $m$ by state dimension 6) and $\boldsymbol\Phi(t_i,t_0)$ is $6\times6$. $\mathbf H_i(t_i)\boldsymbol\Phi(t_i,t_0)$ is a valid $m\times6$ product, matching $\widetilde{\mathbf H}_i$'s required shape ($m$ measurements sensitive to $6$ epoch parameters). $\boldsymbol\Phi(t_i,t_0)\,\mathbf H_i(t_i)$ is a $6\times6$ times an $m\times6$, which is not even a conformable product unless $m=6$, so the order is not merely a convention — it is fixed by the chain rule $\partial y_i/\partial\mathbf x_0=(\partial y_i/\partial\mathbf x(t_i))(\partial\mathbf x(t_i)/\partial\mathbf x_0)$, outer derivative first.
:::

::: check
Why does re-scaling the state with $\mathbf S$ leave the converged estimate of $\mathbf x_0$ unchanged, even though it changes $\boldsymbol\Lambda$ and $\operatorname{cond}(\boldsymbol\Lambda)$ dramatically?
:::

::: answer
Non-dimensionalising is a linear change of variables applied consistently to the unknown and to every column of the design matrix that multiplies it — $\delta\mathbf x_0=\mathbf S^{-1}\delta\mathbf x_0^{\text{nd}}$ substituted into $\widetilde{\mathbf H}_i\delta\mathbf x_0$ gives $(\widetilde{\mathbf H}_i\mathbf S^{-1})\delta\mathbf x_0^{\text{nd}}$, the same linear map in different coordinates. Solving for $\delta\mathbf x_0^{\text{nd}}$ and converting back with $\mathbf S^{-1}$ recovers exactly the $\delta\mathbf x_0$ that solving the original, unscaled system would have given, in exact arithmetic. What changes is only how the intermediate matrix $\boldsymbol\Lambda$ is scaled, and hence how many of its digits round-off can afford to corrupt before the solved-for correction is affected.
:::

::: check
On the worked example, $\operatorname{cond}(\widetilde{\mathbf H})=1.05\times10^6$ and $\operatorname{cond}(\boldsymbol\Lambda)=1.11\times10^{12}$. State the general relationship this illustrates and why it favours solving the batch problem with QR rather than by forming and inverting $\boldsymbol\Lambda$.
:::

::: answer
Forming the normal equations squares the condition number, $\operatorname{cond}(\boldsymbol\Lambda)\approx\operatorname{cond}(\widetilde{\mathbf H})^2$, because $\boldsymbol\Lambda=\widetilde{\mathbf H}^\mathsf T\mathbf W\widetilde{\mathbf H}$ effectively squares the singular values that the condition number is a ratio of. A QR (or SVD) solve works with $\widetilde{\mathbf H}$ directly and never forms this squared quantity, so it loses roughly half as many significant digits to round-off as solving the normal equations does — the same reason the least-squares module gave the first time a design matrix's conditioning came up, now mattering twice as much because $\boldsymbol\Phi$ has already made $\widetilde{\mathbf H}$'s conditioning worse before any observation geometry is considered.
:::

::: check
A batch fit is set up with the state extended to include a solve-for station range bias, but the arc used is a single four-minute pass from that one station. Without computing anything, what do you expect to go wrong, and why does it look different from the kilometres-and-seconds scaling problem this lesson focused on?
:::

::: answer
A single short pass from one station gives the range-bias parameter and the radial/epoch-timing part of the state very similar sensitivity patterns — a constant offset in every range residual can be explained almost as well by a small epoch state shift as by the bias itself, so the corresponding columns of $\widetilde{\mathbf H}$ are nearly parallel. That is a genuine observability problem: no rescaling of units fixes two columns that are pointing in almost the same direction, unlike the scaling issue in this lesson, which was an artifact of measuring position and velocity in mismatched units and vanished entirely once both were expressed in comparable canonical units. This case is taken up properly in the lesson on tracking geometry and observability.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\delta\mathbf x(t)=\boldsymbol\Phi(t,t_0)\,\delta\mathbf x_0$ | STM's defining property; $\boldsymbol\Phi(t_0,t_0)=\mathbf I$, chain rule composes |
| $\widetilde{\mathbf H}_i=\mathbf H_i(t_i)\,\boldsymbol\Phi(t_i,t_0)$ | Measurement partial mapped back to the epoch |
| $\boldsymbol\Lambda\,\delta\mathbf x_0=\mathbf N$, $\boldsymbol\Lambda=\sum\widetilde{\mathbf H}_i^\mathsf T\mathbf W_i\widetilde{\mathbf H}_i$ | Batch normal equations; Gauss-Newton with the whole trajectory as the model |
| Iterate: solve, update $\mathbf x_0$, **re-propagate**, re-linearize | Unlike algebraic Gauss-Newton, every step re-integrates the reference trajectory |
| $\operatorname{cond}(\boldsymbol\Lambda)\approx\operatorname{cond}(\widetilde{\mathbf H})^2$ | Normal equations square the design matrix's conditioning |
| $DU$, $TU=\sqrt{DU^3/\mu}$, $DU/TU$ | Canonical length/time/velocity units; $\mathbf S=\operatorname{diag}(1/DU,\,\cdot,\,TU/DU,\,\cdot)$ |
| Solve-for vs consider | Extra state component (own $\widetilde{\mathbf H}$ column) vs fixed value with propagated uncertainty only |

The normal matrix here came from a black-box $\boldsymbol\Phi$ and treated observability as a units problem to be scaled away. The next lesson opens $\boldsymbol\Phi$ up: the variational equations that generate it, why integrating them alongside the trajectory is the only way to get it right once real forces are added, and what the closed-form two-body case reveals about the structure every numerically integrated STM shares.
