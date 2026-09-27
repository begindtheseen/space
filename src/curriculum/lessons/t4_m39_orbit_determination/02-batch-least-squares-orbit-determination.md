---
id: l02-batch-least-squares-orbit-determination
title: Batch least-squares orbit determination with the state transition matrix
minutes: 19
covers:
  - Batch least-squares orbit determination with the state transition matrix
---

Imagine drawing the best straight line through a scatter of dots on graph paper. No single dot is trustworthy — each one is a little off. But with fifty dots, you can lay a ruler so that it passes as close as possible to all of them at once, and the line you get is far better than any two dots would give you. That "as close as possible to all of them" is **least squares**: choose the line that makes the sum of the squared misses as small as it can be.

The last lesson turned a handful of observations into a rough state — good enough to know roughly where an object is, nowhere near good enough to predict a close approach or plan a rendezvous. **Batch orbit determination** closes that gap. It takes *every* observation over an arc, hours to weeks long, from one station or a dozen, and asks one precise question: which state at a chosen starting time, flown forward through the real dynamics, best explains all of them at once? This is how ground operations centers fit precise orbits every day.

It is the nonlinear least-squares problem you met in the least-squares module, with one twist. There, the model linking the unknowns to a measurement was a formula. Here, the model linking the starting state to a measurement three hours later is a whole numerical integration of the equations of motion. The tool that lets you take derivatives *through* that integration is the **state transition matrix**. This lesson uses it as given; the next lesson shows where it comes from.

## The batch problem as nonlinear least squares

Pick an **[[epoch|epoch-word]]** $t_0$ — the one moment whose state you will solve for. Call that state $\mathbf x_0$: position and velocity, six numbers for now. Flying $\mathbf x_0$ forward with your best force model gives the **reference trajectory** $\mathbf x_{\text{ref}}(t)$.

Each measurement $y_i$, taken at time $t_i$, is modeled as

$$
y_i = h_i(\mathbf x(t_i)) + v_i ,
$$

where $h_i$ computes what the sensor *should* read — a range, a range-rate, an angle — from the true state at $t_i$, and $v_i$ is random measurement noise.

### The state transition matrix, as a black box

Nudge the epoch state by a small amount $\delta\mathbf x_0$ (read "delta x zero", a small change in $\mathbf x_0$). Where the trajectory ends up at a later time $t$ moves by some $\delta\mathbf x(t)$. For small nudges, the two are linked by a matrix:

$$
\delta\mathbf x(t) = \boldsymbol\Phi(t, t_0)\,\delta\mathbf x_0, \qquad \boldsymbol\Phi(t_0,t_0)=\mathbf I, \qquad \boldsymbol\Phi(t_2,t_0)=\boldsymbol\Phi(t_2,t_1)\boldsymbol\Phi(t_1,t_0).
$$

$\boldsymbol\Phi$ is read "phi". It is $6\times6$. The middle rule says no time has passed, so nothing has changed. The last rule says two hops can be chained into one. $\boldsymbol\Phi$ is the **linearization of the whole flow** — the "if I nudge here, it moves there" rule for the dynamics — not of any one measurement.

### Carrying each measurement back to the epoch

Each measurement cares about the state at its own time. The **[[chain rule|chain-rule]]** carries that sensitivity back to the epoch:

$$
\widetilde{\mathbf H}_i \equiv \frac{\partial y_i}{\partial\mathbf x_0} = \underbrace{\frac{\partial h_i}{\partial\mathbf x(t_i)}}_{\mathbf H_i(t_i)}\ \boldsymbol\Phi(t_i, t_0).
$$

Read it right to left: a nudge at the epoch becomes a nudge at $t_i$ through $\boldsymbol\Phi$, and that nudge changes the reading through $\mathbf H_i$. $\mathbf H_i(t_i)$ is an ordinary **measurement partial**, evaluated on the reference trajectory at $t_i$ — for a range, it is the unit vector along the line of sight. $\boldsymbol\Phi(t_i,t_0)$ carries it back to the one epoch every measurement shares. That is what lets a batch spanning days be written in six unknowns instead of a new set at every observation.

### The normal equations

The **residual** is what the sensor read minus what the reference trajectory predicts:

$$
\delta y_i = y_i - h_i(\mathbf x_{\text{ref}}(t_i)).
$$

To first order, $\delta y_i \approx \widetilde{\mathbf H}_i\,\delta\mathbf x_0 + v_i$. That is exactly the weighted linear least-squares problem of the least-squares module, with $\widetilde{\mathbf H}_i$ in the role of $\mathbf H$. Each measurement is weighted by the inverse of its noise covariance $\mathbf R_i$, so precise measurements count for more. Minimizing the weighted sum of squared residuals gives the **normal equations**:

::: key Batch OD normal equations
$$
\boldsymbol\Lambda\,\delta\mathbf x_0 = \mathbf N, \qquad
\boldsymbol\Lambda = \sum_i (\mathbf H_i\boldsymbol\Phi_i)^\mathsf T \mathbf R_i^{-1} (\mathbf H_i\boldsymbol\Phi_i), \qquad
\mathbf N = \sum_i (\mathbf H_i\boldsymbol\Phi_i)^\mathsf T \mathbf R_i^{-1}\,\delta y_i,
$$

with $\boldsymbol\Phi_i=\boldsymbol\Phi(t_i,t_0)$. Accumulate $\boldsymbol\Lambda$ and $\mathbf N$ over every measurement, solve $\boldsymbol\Lambda\,\delta\mathbf x_0=\mathbf N$ (with `np.linalg.solve`, never an explicit inverse), update $\mathbf x_0$, and iterate by re-integrating the reference trajectory.
:::

$\boldsymbol\Lambda$ ("lambda") is the **[[information matrix|information-matrix]]**. Its inverse is the **epoch covariance**, $\mathbf P_0 = \boldsymbol\Lambda^{-1}$: how uncertain the fitted state is, if the noise model is right. The same $\boldsymbol\Phi$ carries that uncertainty to any later time, $\mathbf P(t) = \boldsymbol\Phi(t,t_0)\,\mathbf P_0\,\boldsymbol\Phi(t,t_0)^\mathsf T$.

### Iterating: Gauss-Newton with an integrator inside

One solve is not the end. The linear model was only true near the reference trajectory, so after each correction you repeat the whole loop:

1. Integrate the reference trajectory and $\boldsymbol\Phi$ from the current $\mathbf x_0$.
2. Compute every residual $\delta y_i$ and every $\widetilde{\mathbf H}_i$.
3. Accumulate $\boldsymbol\Lambda$ and $\mathbf N$, and solve for $\delta\mathbf x_0$.
4. Update $\mathbf x_0 \leftarrow \mathbf x_0 + \delta\mathbf x_0$ and go back to step 1, until the correction is negligible.

This is the **Gauss-Newton** method from the least-squares module. The one real difference is the cost. An algebraic model's derivatives are cheap to recompute at a new guess. Here, every iteration means re-integrating the orbit and its $\boldsymbol\Phi$ before a single new residual exists. Batch orbit determination is Gauss-Newton in which every evaluation of the model is a numerical integration.

::: example Three passes, twelve hours, one epoch state
A near-circular orbit at about $420\,\mathrm{km}$ altitude ($a=6798.137\,\mathrm{km}$, $e=0.001$, $i=51.6^\circ$) starts at epoch from

$$
\mathbf r_0=(3149.693,\ 4949.506,\ 3421.126)\,\mathrm{km},\qquad \mathbf v_0=(-6.0904,\ 0.6951,\ 4.6016)\,\mathrm{km/s}.
$$

One station at $40^\circ$ latitude sees it on three passes in the first twelve hours, near $6.2$, $7.9$ and $11.1$ hours after epoch. Sampling every $10\,\mathrm s$ above $10^\circ$ elevation gives $99$ times, each with a range and a range-rate: $198$ numbers. The noise is $\sigma_\rho=5\,\mathrm m$ on range and $\sigma_{\dot\rho}=1\,\mathrm{mm/s}$ on range-rate (read $\sigma$ as "sigma", the standard deviation). Ranges run from $434$ to $1486\,\mathrm{km}$. The starting guess is deliberately rough, like an IOD answer: $3.9\,\mathrm{km}$ off in position and $2.7\,\mathrm{m/s}$ off in velocity.

```python
# Gauss-Newton over the whole arc: re-integrate, re-linearize, re-solve.
#  iter   RMS range (m)   RMS rate (mm/s)   correction: |dr| (m)   |dv| (m/s)
#   0       36077.9          349700            19920             40.7
#   1        9188.7           61680            16610             38.6
#   2        5391.5           52260              345.5            0.587
#   3         145.8             307.7            357.2            0.831
#   4           5.370            24.07             0.064          5.1e-05
#   5           4.761             0.948            7.3e-05        1.7e-07
#   6           4.761             0.948            3.8e-07        1.7e-09
```

Read the table row by row. The first two corrections are *bigger* than the starting error: far from the answer, the straight-line model overshoots. Then the iteration locks on, and each step is hundreds of times smaller than the last. After six rounds the correction is under a micrometer.

The final residuals are $4.76\,\mathrm m$ and $0.948\,\mathrm{mm/s}$ — close to the $5\,\mathrm m$ and $1\,\mathrm{mm/s}$ of noise that went in. That is exactly what a correct fit to correctly weighted data should do: explain everything except the noise. The fitted epoch state is $0.15\,\mathrm m$ and $0.18\,\mathrm{mm/s}$ from the truth, inside the formal one-sigma values from $\mathbf P_0$ ($0.41$ to $0.63\,\mathrm m$ per axis). Rerun on noise-free data, the same loop lands within a micrometer of the truth: the leftover above is measurement noise, not estimator error.
:::

::: warning A rough start can diverge
Gauss-Newton only works if the start is close enough for the linear model to point the right way. Keep the same size of start error, $3.9\,\mathrm{km}$ and $2.7\,\mathrm{m/s}$, but point it differently, and the same loop can blow up instead of converging. What decides it is mostly the **[[semi-major axis|sma-drift]]** error. In the run above, the start error changed $a$ by $1.3\,\mathrm{km}$ and drifted $48\,\mathrm{km}$ from the truth by the first pass. Another start of the same size changed $a$ by $4.7\,\mathrm{km}$, drifted $172\,\mathrm{km}$ by the first pass, and diverged. If a batch run blows up, fit a short arc first, then lengthen it.
:::

## Why the normal matrix is badly scaled in kilometers and seconds

Look inside $\boldsymbol\Phi$ before it ever reaches $\boldsymbol\Lambda$. For this orbit, flown one hour with two-body gravity, the four $3\times3$ blocks have very different sizes:

```
Phi(3600 s, 0), position in km, velocity in km/s:
top-left     (dr/dr0)   entries up to   ~8        (no units)
top-right    (dr/dv0)   entries up to   ~7900 s   <- position response to a velocity error
bottom-left  (dv/dr0)   entries up to   ~0.009 1/s <- velocity response to a position error
bottom-right (dv/dv0)   entries up to   ~8        (no units)
det(Phi) = 0.99999999999983
```

In words: a $1\,\mathrm{m/s}$ error in epoch velocity turns into nearly $7.9\,\mathrm{km}$ of position error an hour later. A $1\,\mathrm m$ error in epoch position turns into under a centimeter per second of velocity error. Both are real physics — a velocity error has an hour to pile up distance. (The determinant of exactly $1$ is a check the next lesson explains.)

But it means the entries of $\boldsymbol\Phi$ span about seven orders of magnitude in kilometers and seconds. Every velocity column of $\widetilde{\mathbf H}_i=\mathbf H_i\boldsymbol\Phi_i$ inherits a multiplier of thousands of seconds that the position columns do not have, and $\boldsymbol\Lambda$ squares it. In the example, the diagonal of $\boldsymbol\Lambda$ is

$$
\operatorname{diag}(\boldsymbol\Lambda) \approx \big(6.4\times10^{12},\ 1.6\times10^{13},\ 7.4\times10^{12} \mid 1.4\times10^{19},\ 2.0\times10^{17},\ 8.2\times10^{18}\big).
$$

Position entries sit near $10^{13}$, velocity entries near $10^{17}$ to $10^{19}$. Overall, $\operatorname{cond}(\boldsymbol\Lambda)=1.59\times10^{13}$: in sixteen-digit arithmetic, up to thirteen digits are at risk. That number is not telling you the orbit is poorly observed. It is telling you that kilometers and seconds are the wrong units to solve a linear system in.

It also shows a rule from the least-squares module. Scale each row of $\widetilde{\mathbf H}$ by one over its noise sigma, and the stacked design matrix has $\operatorname{cond}=3.99\times10^{6}$. Squared, that is $1.59\times10^{13}$ — exactly $\operatorname{cond}(\boldsymbol\Lambda)$. **Forming the normal equations squares the condition number.** That is why a QR solve on $\widetilde{\mathbf H}$ itself is preferred whenever the conditioning is this poor.

## Non-dimensionalizing fixes it

The fix is a change of units, not a change of algorithm. It is like measuring a road trip in miles and hours instead of millimeters and years: the trip is the same, but the numbers become sensible.

Pick a **distance unit** $DU$. Earth's equatorial radius is the usual choice. Then pick a **time unit** $TU=\sqrt{DU^3/\mu}$, chosen so that $\mu=1$ in the new units. These are the **[[canonical units|canonical-units]]** of astrodynamics. The matching velocity unit is $DU/TU$, about the speed of a circular orbit at radius $DU$. With $DU=6378.137\,\mathrm{km}$:

$$
TU=\sqrt{\frac{6378.137^3}{398600.4418}}\,\mathrm s = 806.811\,\mathrm s, \qquad \frac{DU}{TU} = 7.905\,\mathrm{km/s}.
$$

Those are sizes the problem actually has, unlike one kilometer and one second.

Now rescale the unknowns: $\delta\mathbf x_0 = \mathbf S^{-1}\delta\mathbf x_0^{\text{nd}}$, with

$$
\mathbf S=\operatorname{diag}(1/DU,\ 1/DU,\ 1/DU,\ TU/DU,\ TU/DU,\ TU/DU),
$$

so the new unknown $\delta\mathbf x_0^{\text{nd}}$ has no units. The linear model becomes $\delta y_i \approx (\widetilde{\mathbf H}_i\mathbf S^{-1})\,\delta\mathbf x_0^{\text{nd}} + v_i$. Same physics, same measurements; only the columns of the design matrix are rescaled.

In these units, every entry of the same one-hour $\boldsymbol\Phi$ lies between about $-10$ and $9$. No block in the thousands, none in the thousandths. The normal matrix now has $\operatorname{cond}(\boldsymbol\Lambda^{\text{nd}})=1.64\times10^8$ — nearly five orders of magnitude better than $1.59\times10^{13}$. Solve in canonical units, convert back with $\delta\mathbf x_0=\mathbf S^{-1}\delta\mathbf x_0^{\text{nd}}$, and you get the same converged state as before, to under a micrometer. The answer does not change. What changes is how many of the solver's digits you can trust on the way there — and that matters more and more as extra parameters and longer arcs push the raw conditioning further.

::: key Non-dimensionalize before solving
$\operatorname{cond}(\boldsymbol\Lambda)$ in raw kilometers and seconds is dominated by the units, not by how well the orbit is observed: the velocity columns of $\widetilde{\mathbf H}$ carry a multiplier of order $10^3$ to $10^4\,\mathrm s$ from $\boldsymbol\Phi$. Scaling position by $DU$ and velocity by $DU/TU$, with $TU=\sqrt{DU^3/\mu}$, removes that artificial gap. The converged estimate is unchanged; only its numerical conditioning improves.
:::

## Solve-for parameters: growing the state

Nothing forces $\mathbf x_0$ to stop at six numbers. A drag coefficient, a station's range bias, a small thrust — any suspected error source can be added as an extra **solve-for parameter**. It gets its own column in $\widetilde{\mathbf H}$: how each measurement changes when that parameter changes, carried back to the epoch the same way position and velocity are. The normal equations, the iteration and the scaling all extend unchanged to seven, eight or more unknowns.

Solving for a parameter is not the only choice. A parameter the data barely constrains can soak up noise and drag the rest of the state with it. The alternative is to hold it at its best-known value and still pass its *uncertainty* honestly into the reported covariance — a **consider parameter**. Which choice fits a drag coefficient, and how to keep unmodeled forces from looking like noise, are the subjects of the process-noise and consider-covariance lessons later in this module. The machinery to grow the state is already here.

::: example Growing the state by one: a drag parameter
Add a seventh unknown to the fit above: a **[[ballistic coefficient|ballistic-coefficient]]** $B$ that scales the drag force. It never changes on its own, so its equation of motion is $\dot B = 0$.

Count what grows. The state is now $7$ numbers, so $\boldsymbol\Phi$ is $7\times7$: $49$ entries. Integrated together with the $7$-number state, that is $7 + 49 = 56$ equations instead of $6 + 36 = 42$. Each measurement row of $\widetilde{\mathbf H}$ gains one entry, and $\boldsymbol\Lambda$ grows from $6\times6$ to $7\times7$. The new column of $\boldsymbol\Phi$ holds how the position and velocity at $t_i$ move when $B$ changes at the epoch, built from $\partial(\text{acceleration})/\partial B$.

Whether $B$ is worth solving for shows up in two places: its formal sigma in $\mathbf P_0 = \boldsymbol\Lambda^{-1}$ should shrink as data is added, and a slow drift in the residuals — the signature of a mis-modeled drag — should disappear. Whether that still holds on a short arc is a question about observability, taken up later in the module.
:::

::: warning Re-linearizing is not optional here
In an algebraic least-squares problem, reusing a slightly stale Jacobian is often harmless. In batch OD it is not. $\boldsymbol\Phi(t_i,t_0)$ is the linearization of the *dynamics* along the *current* reference trajectory. Once $\mathbf x_0$ has moved, the old $\boldsymbol\Phi$ no longer describes how a further correction would spread through the orbit. Every iteration must re-integrate the reference trajectory and its $\boldsymbol\Phi$ from the new $\mathbf x_0$ before building a new $\boldsymbol\Lambda$. Skipping this is the most common way to make batch OD silently diverge.
:::

## Check yourself

::: check
A colleague computes $\widetilde{\mathbf H}_i$ as $\boldsymbol\Phi(t_i,t_0)\,\mathbf H_i(t_i)$ instead of $\mathbf H_i(t_i)\,\boldsymbol\Phi(t_i,t_0)$. Explain from the shapes of the matrices alone why this cannot be right.
:::

::: answer
$\mathbf H_i(t_i)$ is $m\times6$ ($m$ measurement components, $6$ state components) and $\boldsymbol\Phi(t_i,t_0)$ is $6\times6$. The product $\mathbf H_i\boldsymbol\Phi$ is $m\times6$: $m$ measurements, each sensitive to $6$ epoch parameters, which is the shape $\widetilde{\mathbf H}_i$ must have. The product $\boldsymbol\Phi\,\mathbf H_i$ is a $6\times6$ times an $m\times6$, which cannot even be multiplied unless $m=6$. The order is fixed by the chain rule, $\partial y_i/\partial\mathbf x_0=(\partial y_i/\partial\mathbf x(t_i))(\partial\mathbf x(t_i)/\partial\mathbf x_0)$: outer derivative first.
:::

::: check
Why does rescaling the state with $\mathbf S$ leave the converged estimate unchanged, even though it changes $\boldsymbol\Lambda$ and its condition number enormously?
:::

::: answer
It is a linear change of variables applied consistently. Substituting $\delta\mathbf x_0=\mathbf S^{-1}\delta\mathbf x_0^{\text{nd}}$ into $\widetilde{\mathbf H}_i\delta\mathbf x_0$ gives $(\widetilde{\mathbf H}_i\mathbf S^{-1})\delta\mathbf x_0^{\text{nd}}$: the same linear map written in different coordinates. Solving for $\delta\mathbf x_0^{\text{nd}}$ and converting back with $\mathbf S^{-1}$ gives exactly the $\delta\mathbf x_0$ the unscaled system would give, in exact arithmetic. Only the intermediate matrix changes, and with it how many digits round-off can spoil before the answer is affected.
:::

::: check
In the example, the noise-weighted design matrix has condition number $3.99\times10^6$ and $\boldsymbol\Lambda$ has $1.59\times10^{13}$. State the general rule and why it favors solving with QR rather than forming $\boldsymbol\Lambda$.
:::

::: answer
Forming the normal equations squares the condition number: $\operatorname{cond}(\boldsymbol\Lambda)=\operatorname{cond}(\widetilde{\mathbf H}_w)^2$, where $\widetilde{\mathbf H}_w$ is $\widetilde{\mathbf H}$ with each row divided by its noise sigma. The condition number is a ratio of singular values, and $\boldsymbol\Lambda=\widetilde{\mathbf H}_w^\mathsf T\widetilde{\mathbf H}_w$ squares every singular value. Check: $(3.99\times10^6)^2\approx1.59\times10^{13}$. A QR (or SVD) solve works on $\widetilde{\mathbf H}_w$ directly and never forms the squared matrix, so it loses about half as many digits to round-off. Here that is the difference between risking six or seven digits and risking thirteen.
:::

::: check
The fit's residual RMS came out at $4.76\,\mathrm m$ for range and $0.948\,\mathrm{mm/s}$ for range-rate. Suppose instead it had settled at $50\,\mathrm m$ and $10\,\mathrm{mm/s}$, with the same data noise. What would that tell you, and what would you check first?
:::

::: answer
A correct model with correct weights should leave residuals about the size of the noise, $5\,\mathrm m$ and $1\,\mathrm{mm/s}$. Residuals ten times larger mean something the model does not explain: a force left out (drag, for instance), a maneuver during the arc, a station bias or timing error, or an iteration that stopped before converging. First check that the corrections really shrank to nothing, then plot the residuals against time: a slow drift or a jump points to a missing force or a maneuver, while a constant offset on one station points to a bias. Adding a solve-for parameter for the suspected cause should make the drift disappear.
:::

::: check
A batch fit adds a solve-for station range bias, but uses a single four-minute pass from that one station. Without computing anything, what do you expect to go wrong, and why is it different from the kilometers-and-seconds problem?
:::

::: answer
On one short pass, a constant offset in every range can be explained almost as well by a small shift in the epoch state as by the bias itself. So the bias column of $\widetilde{\mathbf H}$ is nearly parallel to some combination of the state columns, and $\boldsymbol\Lambda$ is nearly singular. That is a real observability problem: no change of units fixes two columns pointing almost the same way. The kilometers-and-seconds problem was only mismatched units, and it vanished once everything was expressed in comparable canonical units. The observability lesson later in the module takes this up properly.
:::

## Summary

| Symbol or idea | Meaning |
| --- | --- |
| $\delta\mathbf x(t)=\boldsymbol\Phi(t,t_0)\,\delta\mathbf x_0$ | What the STM does; $\boldsymbol\Phi(t_0,t_0)=\mathbf I$, and hops chain |
| $\widetilde{\mathbf H}_i=\mathbf H_i(t_i)\,\boldsymbol\Phi(t_i,t_0)$ | Measurement partial carried back to the epoch |
| $\boldsymbol\Lambda\,\delta\mathbf x_0=\mathbf N$ | Batch normal equations, accumulated over all measurements |
| $\boldsymbol\Lambda=\sum(\mathbf H_i\boldsymbol\Phi_i)^\mathsf T\mathbf R_i^{-1}(\mathbf H_i\boldsymbol\Phi_i)$ | Information matrix; $\mathbf P_0=\boldsymbol\Lambda^{-1}$ is the epoch covariance |
| Iterate: solve, update, re-integrate | Gauss-Newton with the whole trajectory as the model |
| $\operatorname{cond}(\boldsymbol\Lambda)=\operatorname{cond}(\widetilde{\mathbf H}_w)^2$ | Normal equations square the design matrix's conditioning |
| $DU$, $TU=\sqrt{DU^3/\mu}$, $DU/TU$ | Canonical units; with Earth's radius, $806.811\,\mathrm s$ and $7.905\,\mathrm{km/s}$ |
| Solve-for vs consider | Extra unknown with its own column, vs a fixed value whose uncertainty is still counted |

This lesson treated $\boldsymbol\Phi$ as a black box. The next lesson opens it: the variational equations that generate it, why integrating them alongside the trajectory is the way to get it once real forces are added, and the free checks that tell you the integration is healthy.

::: context epoch-word A timestamp you pin the answer to
An epoch is just a chosen instant that the answer refers to, like writing "as of 9:00 a.m." on a weather report. The satellite never stops moving, so "where is it?" means nothing until you name a time. Orbit centers pick an epoch near the middle or start of the tracking arc and publish the state there; anyone who needs the state at another time flies it forward or backward with the same force model. The word comes from astronomy, where star catalogs are tagged with the epoch their positions were measured for.
:::

::: context chain-rule Changes passed along a chain
If turning a dial by one click moves a gear by three teeth, and one tooth of the gear moves a needle by two millimeters, then one click moves the needle six millimeters. Multiply the rates along the chain. Here the "dial" is the epoch state, the "gear" is the state at $t_i$, and the "needle" is the sensor reading.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="90" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">epoch x₀</text>
  <rect x="135" y="30" width="90" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">state x(tᵢ)</text>
  <rect x="260" y="30" width="90" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">reading yᵢ</text>
  <line x1="100" y1="50" x2="127" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="135,50 125,45 125,55" fill="#1f2a44"/>
  <line x1="225" y1="50" x2="252" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="260,50 250,45 250,55" fill="#1f2a44"/>
  <text x="117" y="22" font-size="12" text-anchor="middle" fill="#1d6fd1">Φ</text>
  <text x="242" y="22" font-size="12" text-anchor="middle" fill="#b4232c">Hᵢ</text>
  <text x="180" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">total sensitivity: Hᵢ Φ (last link written first)</text>
</svg>
``` With many numbers at each stage, the rates become matrices, and "multiply" becomes matrix multiplication — in the order the chain runs, last link first.
:::

::: context information-matrix Why "information"
Each measurement adds a term to $\boldsymbol\Lambda$, and a precise measurement (small $\mathbf R_i$) adds a big one. So $\boldsymbol\Lambda$ literally piles up how much the data tells you about each direction of the state. Its inverse, the covariance, shrinks as the pile grows: more data, more information, less uncertainty. A direction where $\boldsymbol\Lambda$ stays small is one the data barely sees — the observability lesson is about exactly those directions. The exercise for this module checks that more measurements shrink the covariance's trace.
:::

::: context sma-drift A wrong orbit size becomes a timing error
The **semi-major axis** $a$ is half the long diameter of the orbit's ellipse, and it alone sets the period: $T=2\pi\sqrt{a^3/\mu}$. Get $a$ wrong and your predicted satellite runs a little fast or slow, falling further behind (or ahead) every lap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="85" r="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="89" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="180" cy="85" r="70" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="250" cy="85" r="6" fill="#1d6fd1"/>
  <circle cx="237.3" cy="44.9" r="6" fill="#1d6fd1"/>
  <circle cx="203.9" cy="19.2" r="6" fill="#b4232c"/>
  <text x="262" y="89" font-size="11" fill="#1d6fd1">start: both together</text>
  <text x="250" y="38" font-size="11" fill="#1d6fd1">true</text>
  <text x="130" y="14" font-size="11" fill="#b4232c">wrong-a model</text>
  <text x="20" y="160" font-size="11" fill="#1f2a44">same path, different period: the gap grows along the track every orbit</text>
</svg>
```

The error does not grow sideways or up and down so much as *along the track*. Lesson 10 turns this into the reason orbit covariances are long, thin cigars.
:::

::: context canonical-units Units that fit the problem
Canonical units pick the problem's own natural sizes as "1". One distance unit is Earth's radius; one time unit is how long it takes to swing about one radian around a low circular orbit at that radius (a full orbit takes $2\pi\,TU$, about $84.5$ minutes). In these units a low orbit's position is about $1.07$ and its speed about $0.97$ — every number near 1. Astronomers do the same with the astronomical unit and the year for planets around the Sun, where $\mu$ also becomes $4\pi^2$ or $1$ depending on the choice.
:::

::: context ballistic-coefficient How easily drag slows you
Drag acceleration is $\tfrac12\rho v^2 C_D A/m$: air density, speed squared, a shape factor $C_D$, and frontal area $A$ over mass $m$. The combination $C_D A/m$ says how easily the air slows the object, like a feather versus a marble. It is badly known in practice — area changes as solar panels turn, and $C_D$ in the thin upper atmosphere is hard to model — which is why orbit determination so often solves for it. (Some books define the ballistic coefficient as the upside-down version, $m/(C_D A)$.)
:::
