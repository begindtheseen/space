---
id: l09-time-varying-lqr
title: Time-varying LQR for trajectory stabilization
minutes: 17
covers:
  - Time-varying LQR along a nominal trajectory for trajectory stabilization
---

A launch vehicle at the end of first-stage burn is not the vehicle that left the pad. It has lost two thirds of its mass, its pitch inertia has fallen with it, its gimbal is three times more effective per degree of deflection, and the aerodynamic moment that dominated the design at maximum dynamic pressure has gone away entirely. A landing booster does the same thing in reverse over forty seconds. There is no single linear plant to design against, and "the closed-loop poles" is not a well-posed phrase.

Time-varying LQR is the answer that scales. Fly a nominal trajectory, linearise about it at every instant, integrate the differential Riccati equation backwards along it once, offline, and store the resulting gain schedule $\mathbf{K}(t)$. Onboard the controller is a table lookup and a matrix multiply: no Riccati solve in flight, no optimiser, nothing that can fail to converge. It is the standard way to stabilize a precomputed trajectory, and it is the inner loop under most trajectory-optimisation schemes, including the iterative methods at the end of this module.

The lesson also covers a trap that catches people who arrive from the time-invariant world: on a time-varying system, the eigenvalues of $\mathbf{A}(t) - \mathbf{B}(t)\mathbf{K}(t)$ tell you nothing about stability. Not "tell you less" — nothing. There is a two-state example whose frozen-time eigenvalues sit at $-0.25 \pm 0.661j$ for every $t$ and whose solutions grow like $e^{t/2}$.

## Linearising about a nominal

Start from the nonlinear vehicle $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u}, t)$ and a nominal trajectory $\big(\mathbf{x}_{nom}(t), \mathbf{u}_{nom}(t)\big)$ that satisfies it — produced by a trajectory optimiser, a guidance algorithm, or a mission designer. Define deviations $\delta\mathbf{x} = \mathbf{x} - \mathbf{x}_{nom}$ and $\delta\mathbf{u} = \mathbf{u} - \mathbf{u}_{nom}$. To first order,

$$
\dot{\delta\mathbf{x}} = \mathbf{A}(t)\,\delta\mathbf{x} + \mathbf{B}(t)\,\delta\mathbf{u},
\qquad
\mathbf{A}(t) = \left.\frac{\partial\mathbf{f}}{\partial\mathbf{x}}\right|_{nom(t)},
\quad
\mathbf{B}(t) = \left.\frac{\partial\mathbf{f}}{\partial\mathbf{u}}\right|_{nom(t)} .
$$

Penalise the deviations,

$$
J = \delta\mathbf{x}(t_f)^\top\mathbf{Q}_f\,\delta\mathbf{x}(t_f) + \int_{t_0}^{t_f}\Big(\delta\mathbf{x}^\top\mathbf{Q}(t)\,\delta\mathbf{x} + \delta\mathbf{u}^\top\mathbf{R}(t)\,\delta\mathbf{u}\Big)dt,
$$

with the weights allowed to vary too — which matters, because what you care about changes through a flight. Solve the differential Riccati equation backwards along the trajectory,

$$
-\dot{\mathbf{P}} = \mathbf{A}(t)^\top\mathbf{P} + \mathbf{P}\mathbf{A}(t) - \mathbf{P}\mathbf{B}(t)\mathbf{R}(t)^{-1}\mathbf{B}(t)^\top\mathbf{P} + \mathbf{Q}(t), \qquad \mathbf{P}(t_f) = \mathbf{Q}_f,
$$

read off $\mathbf{K}(t) = \mathbf{R}(t)^{-1}\mathbf{B}(t)^\top\mathbf{P}(t)$, and fly

$$
\mathbf{u}(t) = \mathbf{u}_{nom}(t) - \mathbf{K}(t)\big(\mathbf{x}(t) - \mathbf{x}_{nom}(t)\big).
$$

The nominal control is the feedforward; the gain schedule is the feedback. Nothing else changes from the fixed-plant case — the equation is the same equation, integrated through time-varying coefficients.

A useful terminal condition is $\mathbf{Q}_f = \mathbf{P}_\infty$ computed from the frozen plant at $t_f$, which makes the schedule start from the value the infinite-horizon design would use there and avoids the artificial gain collapse that $\mathbf{Q}_f = \mathbf{0}$ produces.

## Frozen-time poles prove nothing

The instinct from the time-invariant world is to check stability by looking at the eigenvalues of $\mathbf{A}(t) - \mathbf{B}(t)\mathbf{K}(t)$ at each instant. It is not a valid test, in either direction.

::: example A system with stable frozen eigenvalues that diverges
Take

$$
\mathbf{A}(t) = \begin{bmatrix}-1 + 1.5\cos^2 t & 1 - 1.5\sin t\cos t\\ -1 - 1.5\sin t\cos t & -1 + 1.5\sin^2 t\end{bmatrix} .
$$

Its trace is $-2 + 1.5 = -0.5$ and its determinant is $0.5$, both independent of $t$, so its eigenvalues are the roots of $\mu^2 + 0.5\mu + 0.5 = 0$:

$$
\mu = -0.25 \pm 0.661438j \quad\text{for every } t,
$$

a damping ratio of $0.354$ and a decay rate of $0.25\,\mathrm{s^{-1}}$. By the frozen-time test this system is comfortably stable at every instant.

Integrate it from $\mathbf{x}(0) = (1, 0)$:

| $t$ | $\mathbf{x}(t)$ | $\|\mathbf{x}(t)\|$ | $e^{t/2}$ |
| --- | --- | --- | --- |
| $1$ | $(0.8908,\ -1.3874)$ | $1.64872$ | $1.64872$ |
| $2$ | $(-1.1312,\ -2.4717)$ | $2.71828$ | $2.71828$ |
| $5$ | $(3.4557,\ 11.6821)$ | $12.18249$ | $12.18249$ |

The norm grows as $e^{t/2}$ to six digits. The state vector is rotating while the eigenvector directions rotate with it, and the rotation feeds energy in faster than the frozen decay takes it out. This is the standard counterexample; the point is that "all eigenvalues in the left half plane at all times" is neither necessary nor sufficient for a linear time-varying system.
:::

::: warning Do not certify a gain schedule with frozen-time poles
A gain-scheduled design whose frozen closed-loop poles look excellent everywhere can still be unstable, and the failure appears exactly where the schedule moves fastest — through a staging event, a throttle-down, a transonic transition. The honest checks are: simulate the time-varying closed loop, which for a linear time-varying system means propagating the state transition matrix and looking at $\|\boldsymbol{\Phi}(t_f, t_0)\|$; or produce a Lyapunov certificate, which for TVLQR you get for free from $\mathbf{P}(t)$. Frozen-time poles are useful for intuition and for sizing, and they are not evidence.
:::

## The cost-to-go is a certificate

TVLQR hands you the Lyapunov function along with the gain. Take $V(t, \delta\mathbf{x}) = \delta\mathbf{x}^\top\mathbf{P}(t)\,\delta\mathbf{x}$ and differentiate along the closed-loop trajectory, with $\mathbf{A}_{cl} = \mathbf{A} - \mathbf{B}\mathbf{K}$ and $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$:

$$
\dot V = \delta\mathbf{x}^\top\big(\dot{\mathbf{P}} + \mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl}\big)\delta\mathbf{x}.
$$

Now $\mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - 2\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$, and the Riccati equation gives $\dot{\mathbf{P}} = -\mathbf{A}^\top\mathbf{P} - \mathbf{P}\mathbf{A} + \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} - \mathbf{Q}$. Adding,

$$
\dot V = -\,\delta\mathbf{x}^\top\big(\mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K}\big)\delta\mathbf{x} \;\le\; 0 .
$$

The cost-to-go decreases monotonically along every closed-loop trajectory, with no frozen-time reasoning anywhere in the argument. That is a genuine time-varying stability certificate, and it is the basis of **funnels**: the sublevel set $\{\delta\mathbf{x} : \delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x} \le \rho(t)\}$ is an invariant tube around the nominal, so any dispersion that starts inside it at $t_0$ is still inside it at $t_f$. Sizing $\rho(t)$ so that the tube also respects the neglected nonlinearity and the actuator limits is how region-of-attraction certificates are built for trajectory-stabilized vehicles.

::: key What P means, along a trajectory
$V(t,\delta\mathbf{x}) = \delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x}$ is the optimal cost-to-go from the deviation $\delta\mathbf{x}$ at time $t$. Along the closed loop it satisfies $\dot V = -\delta\mathbf{x}^\top(\mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K})\delta\mathbf{x} \le 0$, so it is a valid time-varying Lyapunov function and the basis of funnel and region-of-attraction arguments.
:::

::: example TVLQR through maximum dynamic pressure
A first stage, pitch plane, states $(\alpha, q)$ and gimbal $\delta$. Mass falls from $3.2\times10^{5}$ to $1.0\times10^{5}\,\mathrm{kg}$ over a $160\,\mathrm{s}$ burn at $1375\,\mathrm{kg/s}$, pitch inertia falls in proportion from $2.6\times10^{7}\,\mathrm{kg\,m^2}$, thrust is $7.6\,\mathrm{MN}$ on a $23\,\mathrm{m}$ arm, and dynamic pressure follows a bell centred at $75\,\mathrm{s}$ peaking at $33\,\mathrm{kPa}$. Linearising gives $\dot\alpha = -Z_\alpha\alpha + q$, $\dot q = M_\alpha\alpha + M_\delta\delta$ with

| $t$ (s) | $\bar q$ (Pa) | $m$ (kg) | $J$ (kg m²) | $V$ (m/s) | $M_\alpha\,(\mathrm{s^{-2}})$ | $M_\delta\,(\mathrm{s^{-2}})$ | open-loop poles $(\mathrm{s^{-1}})$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $0$ | $2052$ | $320000$ | $2.60\times10^{7}$ | $40$ | $0.0302$ | $-6.723$ | $-0.176,\ +0.172$ |
| $40$ | $18022$ | $265000$ | $2.15\times10^{7}$ | $184$ | $0.3199$ | $-8.118$ | $-0.571,\ +0.561$ |
| $75$ | $33000$ | $216875$ | $1.76\times10^{7}$ | $546$ | $0.7158$ | $-9.920$ | $-0.850,\ +0.842$ |
| $110$ | $18022$ | $168750$ | $1.37\times10^{7}$ | $1129$ | $0.5024$ | $-12.749$ | $-0.710,\ +0.708$ |
| $160$ | $931$ | $100000$ | $8.12\times10^{6}$ | $2344$ | $0.0438$ | $-21.514$ | $-0.209,\ +0.209$ |

The vehicle is statically unstable throughout, its instability peaks at maximum dynamic pressure, and its gimbal effectiveness triples over the burn. The weights are scheduled too, in the way real vehicles do it: the angle-of-attack penalty is multiplied by $w(t) = 1 + 9\,\bar q(t)/\bar q_{\max}$, so structural load dominates the cost through the high-$\bar q$ region ($w = 10$ at $75\,\mathrm{s}$) and attitude dominates at the ends ($w = 1.56$ at liftoff, $1.25$ at burnout). Bryson budgets are $3^\circ$ of angle of attack, $4^\circ/\mathrm{s}$ of pitch rate and $5^\circ$ of gimbal.

Integrating the Riccati equation backwards from $\mathbf{Q}_f = \mathbf{P}_\infty(t_f)$:

| $t$ (s) | $0$ | $40$ | $60$ | $75$ | $110$ | $130$ | $160$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $k_\alpha$ | $-2.090$ | $-4.090$ | $-5.070$ | $-5.330$ | $-4.076$ | $-2.897$ | $-1.868$ |
| $k_q$ | $-1.478$ | $-1.603$ | $-1.637$ | $-1.624$ | $-1.483$ | $-1.394$ | $-1.318$ |

The angle-of-attack gain varies by a factor of $2.9$ across the flight, peaking where the loads do. Now fly $200$ dispersed cases — initial $\sigma_\alpha = 1.0^\circ$, $\sigma_q = 0.5^\circ/\mathrm{s}$, plus a wind shear modelled as a step in $\alpha$ of $\sigma = 2.5^\circ$ at $t = 65\,\mathrm{s}$ — and compare TVLQR against two fixed gains, each the infinite-horizon LQR solution frozen at one flight condition:

| Design | total cost | cost $0$–$40\,\mathrm{s}$ | cost $40$–$110\,\mathrm{s}$ | peak $\lvert\delta\rvert$, $0$–$40\,\mathrm{s}$ | post-shear load $\int\bar q\lvert\alpha\rvert dt$ | $\lvert\alpha\rvert$ $1\,\mathrm{s}$ after the shear |
| --- | --- | --- | --- | --- | --- | --- |
| TVLQR | $2.064$ | $0.1015$ | $1.963$ | $1.62^\circ$ | $19.2\,\mathrm{kPa\,deg\,s}$ | $0.037^\circ$ |
| Fixed at $75\,\mathrm{s}$ | $2.128$ | $0.1609$ | $1.967$ | $3.81^\circ$ | $18.6\,\mathrm{kPa\,deg\,s}$ | $0.031^\circ$ |
| Fixed at liftoff | $2.768$ | $0.1015$ | $2.667$ | $1.62^\circ$ | $43.5\,\mathrm{kPa\,deg\,s}$ | $0.455^\circ$ |

Each fixed gain is excellent where it was designed and poor elsewhere, and the two failures are different. The max-Q gain is **too aggressive early**: it costs $58\,\%$ more over the first forty seconds and uses $3.81^\circ$ of gimbal against TVLQR's $1.62^\circ$ for the same initial dispersion — more than twice the actuator activity, at a flight condition where none of it is needed, which on a real vehicle means more slosh excitation and more bending-mode drive during the very phase engineers worry about. The liftoff gain is **too sluggish late**: at the shear it leaves $0.455^\circ$ of angle of attack one second later against TVLQR's $0.037^\circ$, a factor of twelve, and accumulates $2.3$ times the post-shear structural load. Its total cost is $34\,\%$ higher, essentially all of it incurred between $40$ and $110\,\mathrm{s}$.

TVLQR is the only design that is right at both ends, and the reason is that it is not a compromise: it solves the correct problem at each instant, including the instants where the cost itself has changed.
:::

## Implementation

- **Solve backwards, once, offline.** The nominal is known before flight, so the schedule is a preflight product. A vehicle with a $160\,\mathrm{s}$ burn and a $50\,\mathrm{Hz}$ control cycle needs $8000$ gains; at two gains per axis per cycle that is a table of a few tens of kilobytes.
- **Store sparsely and interpolate.** $\mathbf{K}(t)$ is smooth wherever the plant is, so knots every second with linear interpolation are usually enough; put extra knots where $\mathbf{A}(t)$ moves fast, which is staging, throttle steps and the transonic region.
- **Index by something physical.** Storing against time alone means a schedule that is wrong the moment the vehicle is off-nominal in time. Real designs index against a monotone flight variable — non-dimensional time, velocity, or mass — so that a slow vehicle uses the gains appropriate to where it actually is.
- **Keep the feedforward exact.** The entire construction assumes $\mathbf{u}_{nom}$ really does produce $\mathbf{x}_{nom}$ on the nonlinear plant. If it does not, the "deviation" being regulated includes a bias, and the loop is fighting a modelling error rather than a dispersion.
- **Check the linearisation is still good.** Beyond a certain dispersion the neglected second-order terms are not small, and the funnel is the right tool for saying how far that is.

## Check yourself

::: check
Write the control law for TVLQR, define every symbol, and say which parts are computed offline.
:::

::: answer
$\mathbf{u}(t) = \mathbf{u}_{nom}(t) - \mathbf{K}(t)\big(\mathbf{x}(t) - \mathbf{x}_{nom}(t)\big)$, where $\mathbf{x}_{nom}(t)$ and $\mathbf{u}_{nom}(t)$ are the nominal state and control trajectories, $\mathbf{x}(t)$ is the measured or estimated state, and $\mathbf{K}(t) = \mathbf{R}(t)^{-1}\mathbf{B}(t)^\top\mathbf{P}(t)$ with $\mathbf{P}$ from the differential Riccati equation integrated backwards from $\mathbf{P}(t_f) = \mathbf{Q}_f$ along the nominal, using $\mathbf{A}(t) = \partial\mathbf{f}/\partial\mathbf{x}$ and $\mathbf{B}(t) = \partial\mathbf{f}/\partial\mathbf{u}$ evaluated on the nominal. Everything except the subtraction and the multiply is offline: the nominal trajectory, the linearisations, the Riccati sweep and the gain table are all preflight products. Onboard the controller does one table lookup, one vector subtraction and one matrix-vector product per cycle, with a bounded and known execution time — which is the main reason this architecture is trusted with a vehicle.
:::

::: check
The frozen eigenvalues of the counterexample are constant at $-0.25 \pm 0.661j$, yet the solution grows. Reconcile this with the fact that a time-invariant system with those eigenvalues is stable.
:::

::: answer
For a time-invariant $\mathbf{A}$, the solution is $e^{\mathbf{A}t}\mathbf{x}_0$ and the eigenvalues govern it because the eigenvectors are fixed — a trajectory can be decomposed once into modal components that then evolve independently. For a time-varying $\mathbf{A}(t)$ the solution is the state transition matrix, which is **not** $e^{\int\mathbf{A}\,dt}$ unless $\mathbf{A}(t)$ commutes with its own integral, and here it does not. The eigenvectors of this $\mathbf{A}(t)$ rotate at $1\,\mathrm{rad/s}$; the state ends up persistently misaligned with the decaying directions, and the energy the rotation injects exceeds the $0.25\,\mathrm{s^{-1}}$ decay, netting $+0.5\,\mathrm{s^{-1}}$. The general lesson is that eigenvalues are a similarity-invariant of a fixed matrix, and a time-varying system is not described by any fixed matrix.
:::

::: check
Show that $\mathbf{P}(t)$ from the TVLQR sweep is a Lyapunov function for the closed loop, and state what that gives you that a simulation does not.
:::

::: answer
With $V = \delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x}$ and $\mathbf{A}_{cl} = \mathbf{A}-\mathbf{B}\mathbf{K}$, $\dot V = \delta\mathbf{x}^\top(\dot{\mathbf{P}} + \mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl})\delta\mathbf{x}$. Substituting $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ gives $\mathbf{A}_{cl}^\top\mathbf{P}+\mathbf{P}\mathbf{A}_{cl} = \mathbf{A}^\top\mathbf{P}+\mathbf{P}\mathbf{A}-2\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$, and the Riccati equation supplies $\dot{\mathbf{P}}$; the sum is $-(\mathbf{Q}+\mathbf{K}^\top\mathbf{R}\mathbf{K})$, which is negative semidefinite. What it gives beyond simulation is a statement about **all** initial conditions in a set rather than the ones you happened to sample: any $\delta\mathbf{x}(t_0)$ with $\delta\mathbf{x}^\top\mathbf{P}(t_0)\delta\mathbf{x} \le \rho$ satisfies the same bound for all later $t$, so a single matrix inequality certifies an entire tube. A Monte Carlo of two hundred cases certifies two hundred cases.
:::

::: check
Your TVLQR schedule is indexed by time. The vehicle flies five seconds behind the nominal because of a low-thrust engine. What goes wrong, and what is the standard fix?
:::

::: answer
At any clock time the controller applies the gain computed for a flight condition the vehicle has not reached. Five seconds is a lot on the way into maximum dynamic pressure: at $t = 70\,\mathrm{s}$ the schedule supplies $k_\alpha = -5.2$ while the vehicle is really at the $65\,\mathrm{s}$ condition wanting about $-4.8$, and worse, the feedforward $\mathbf{u}_{nom}(t)$ and the reference $\mathbf{x}_{nom}(t)$ are also wrong, so the "deviation" being regulated contains a large bias that the loop fights continuously. The standard fix is to index the schedule — and usually the whole guidance law — by a monotone physical variable rather than by clock time: relative velocity, altitude, mass, or a normalised burn fraction. Then a slow vehicle reaches each gain later, which is correct. Where time must be used, the nominal is re-generated in flight so that $\mathbf{x}_{nom}$ and $\mathbf{u}_{nom}$ stay consistent with where the vehicle is.
:::

::: check
In the ascent comparison the fixed max-Q gain cost only $3\,\%$ more overall. Why would anyone bother with TVLQR for a $3\,\%$ improvement?
:::

::: answer
Because the total cost is the wrong number to look at, and the table shows why. The $3\,\%$ is an average over a flight that is mostly benign; the damage is concentrated and it is physical. Over the first forty seconds the fixed max-Q gain uses $3.81^\circ$ of gimbal against $1.62^\circ$ — more than double the actuator activity during the phase where the vehicle is heaviest, its bending modes lowest and its slosh least damped, so the cost is paid in structural excitation and duty cycle rather than in the quadratic index. Meanwhile the other fixed design is $34\,\%$ worse overall and leaves twelve times the angle of attack one second after a shear, which is a load case, not a statistic. TVLQR also costs almost nothing: the schedule is computed once on the ground, and the onboard implementation is identical to a fixed gain apart from a table lookup. The question is not whether $3\,\%$ is worth the effort but whether there is any reason to accept a design that is wrong at both ends of the flight when the correct one is the same price.
:::

## Summary

| Object | Statement |
| --- | --- |
| Linearisation | $\mathbf{A}(t) = \partial\mathbf{f}/\partial\mathbf{x}$, $\mathbf{B}(t) = \partial\mathbf{f}/\partial\mathbf{u}$, both evaluated on the nominal |
| Deviation dynamics | $\dot{\delta\mathbf{x}} = \mathbf{A}(t)\delta\mathbf{x} + \mathbf{B}(t)\delta\mathbf{u}$ |
| Sweep | $-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P}+\mathbf{P}\mathbf{A}-\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}+\mathbf{Q}$ backwards from $\mathbf{Q}_f$, along the nominal |
| Control law | $\mathbf{u}(t) = \mathbf{u}_{nom}(t) - \mathbf{K}(t)(\mathbf{x}(t)-\mathbf{x}_{nom}(t))$, $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ |
| Certificate | $\dot V = -\delta\mathbf{x}^\top(\mathbf{Q}+\mathbf{K}^\top\mathbf{R}\mathbf{K})\delta\mathbf{x} \le 0$ for $V = \delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x}$ |
| Funnel | $\{\delta\mathbf{x}: \delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x} \le \rho(t)\}$ is an invariant tube about the nominal |
| Frozen poles | Neither necessary nor sufficient; counterexample has poles at $-0.25\pm0.661j$ and grows as $e^{t/2}$ |
| Ascent schedule | $k_\alpha$ from $-2.09$ at liftoff to $-5.33$ at max-$\bar q$ to $-1.87$ at burnout, a factor $2.9$ |
| Against a max-$\bar q$ fixed gain | $58\,\%$ more early cost, $2.4\times$ the gimbal activity in the first $40\,\mathrm{s}$ |
| Against a liftoff fixed gain | $34\,\%$ more total cost, $12\times$ the angle of attack one second after a shear |
| Implementation | Offline sweep, sparse table with interpolation, indexed by a monotone physical variable |

Everything so far has assumed the state is known. The next lesson removes that assumption and builds the controller that actually flies — with the consequences for robustness already established.
