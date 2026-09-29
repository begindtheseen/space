---
id: l09-time-varying-lqr
title: Time-varying LQR for trajectory stabilization
minutes: 19
covers:
  - Time-varying LQR along a nominal trajectory for trajectory stabilization
---

Think about carrying a full glass of water across a room while someone keeps topping it up and then drinking from it. The glass gets heavier, then lighter. A steadying motion that was right a moment ago is now too gentle, or too sharp. To carry it well, you keep adjusting *how hard* you correct, as the glass changes.

A launch vehicle has the same problem, much worse. At the end of first-stage burn it is not the vehicle that left the pad. It has lost about two thirds of its mass. Its pitch inertia has fallen with it. Its engine gimbal is three times more effective per degree of swing. And the aerodynamic twisting that dominated the design at maximum dynamic pressure has faded away entirely. A landing booster goes through the same kind of change, in reverse, over its final seconds. There is no single linear plant to design against, and "the closed-loop poles" stops being a meaningful phrase.

**Time-varying LQR** (TVLQR) is the answer that scales. Plan a nominal trajectory. Linearize the vehicle about it at every instant. Integrate the differential Riccati equation backwards along it, once, on the ground. Store the resulting gain schedule $\mathbf{K}(t)$. Onboard, the controller is a [[table lookup and a matrix multiply|table-lookup]]: no Riccati solve in flight, no optimizer, nothing that can fail to converge. It is the standard way to hold a vehicle on a precomputed trajectory, and it is the inner loop of most trajectory-optimization schemes, including the iterative methods at the end of this module.

The lesson also covers a trap for anyone arriving from the time-invariant world. On a time-varying system, the eigenvalues of $\mathbf{A}(t) - \mathbf{B}(t)\mathbf{K}(t)$ at each instant tell you nothing about stability. Not "less" — nothing. There is a two-state example whose frozen-time eigenvalues sit at $-0.25 \pm 0.661j$ for every $t$, yet whose solutions grow like $e^{t/2}$.

## Linearizing about a nominal

Start from the full nonlinear vehicle, $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u}, t)$. Here $\mathbf{f}$ is the complete equation of motion: gravity, thrust, aerodynamics, everything.

Suppose someone hands you a **nominal trajectory** — a planned path $\mathbf{x}_{nom}(t)$ together with the planned control $\mathbf{u}_{nom}(t)$ that flies it. It might come from a trajectory optimizer, a guidance algorithm, or a mission designer. It must satisfy the equations of motion exactly: fly $\mathbf{u}_{nom}$ from $\mathbf{x}_{nom}(t_0)$ and you get $\mathbf{x}_{nom}(t)$.

The real vehicle will not be exactly on that path. Measure how far off it is with **deviations**:

$$
\delta\mathbf{x} = \mathbf{x} - \mathbf{x}_{nom}, \qquad \delta\mathbf{u} = \mathbf{u} - \mathbf{u}_{nom}.
$$

Read $\delta\mathbf{x}$ as "delta x", the small error in the state. For small deviations, the full nonlinear equation can be replaced by its [[straight-line approximation|linearize-word]] around the nominal:

$$
\dot{\delta\mathbf{x}} = \mathbf{A}(t)\,\delta\mathbf{x} + \mathbf{B}(t)\,\delta\mathbf{u},
\qquad
\mathbf{A}(t) = \left.\frac{\partial\mathbf{f}}{\partial\mathbf{x}}\right|_{nom(t)},
\quad
\mathbf{B}(t) = \left.\frac{\partial\mathbf{f}}{\partial\mathbf{u}}\right|_{nom(t)} .
$$

The bar with "nom(t)" means "evaluated on the nominal at time $t$". So $\mathbf{A}(t)$ and $\mathbf{B}(t)$ are the ordinary state-space matrices, except that they change as the vehicle moves along its path.

Now penalize the deviations exactly as before:

$$
J = \delta\mathbf{x}(t_f)^\top\mathbf{Q}_f\,\delta\mathbf{x}(t_f) + \int_{t_0}^{t_f}\Big(\delta\mathbf{x}^\top\mathbf{Q}(t)\,\delta\mathbf{x} + \delta\mathbf{u}^\top\mathbf{R}(t)\,\delta\mathbf{u}\Big)dt.
$$

The weights are allowed to change too. That matters, because what you care about changes through a flight — structural load at max-Q, pointing accuracy near burnout.

Solve the **differential Riccati equation** backwards along the trajectory, starting from the end:

$$
-\dot{\mathbf{P}} = \mathbf{A}(t)^\top\mathbf{P} + \mathbf{P}\mathbf{A}(t) - \mathbf{P}\mathbf{B}(t)\mathbf{R}(t)^{-1}\mathbf{B}(t)^\top\mathbf{P} + \mathbf{Q}(t), \qquad \mathbf{P}(t_f) = \mathbf{Q}_f,
$$

read off the gain at each instant,

$$
\mathbf{K}(t) = \mathbf{R}(t)^{-1}\mathbf{B}(t)^\top\mathbf{P}(t),
$$

and fly

$$
\mathbf{u}(t) = \mathbf{u}_{nom}(t) - \mathbf{K}(t)\big(\mathbf{x}(t) - \mathbf{x}_{nom}(t)\big).
$$

The nominal control is the **[[feedforward|feedforward-feedback]]** — the planned move. The gain schedule times the deviation is the **feedback** — the correction. Nothing else changes from the fixed-plant case. It is the same Riccati equation, integrated through coefficients that happen to vary.

Why backwards? Because $\mathbf{P}(t)$ is the cost still to come from time $t$. At the final time the only cost left is the terminal penalty, so that is where you know $\mathbf{P}$, and you work back toward the start.

A useful choice of terminal weight is $\mathbf{Q}_f = \mathbf{P}_\infty$, the infinite-horizon solution for the frozen plant at $t_f$. Then the schedule starts from the value an infinite-horizon design would use there. It avoids the artificial gain collapse near the end that $\mathbf{Q}_f = \mathbf{0}$ produces, which you saw in the finite-horizon lesson.

## Frozen-time poles prove nothing

Here is the instinct from the time-invariant world: at each instant, freeze $\mathbf{A}(t) - \mathbf{B}(t)\mathbf{K}(t)$, compute its eigenvalues, and check that they are in the left half plane. It is not a valid test, in either direction.

::: example A system with stable frozen eigenvalues that diverges
Take

$$
\mathbf{A}(t) = \begin{bmatrix}-1 + 1.5\cos^2 t & 1 - 1.5\sin t\cos t\\ -1 - 1.5\sin t\cos t & -1 + 1.5\sin^2 t\end{bmatrix} .
$$

Step 1, the trace (sum of the diagonal). $(-1 + 1.5\cos^2 t) + (-1 + 1.5\sin^2 t) = -2 + 1.5(\cos^2 t + \sin^2 t) = -2 + 1.5 = -0.5$.

Step 2, the determinant. Multiplying out and using $\cos^2 t + \sin^2 t = 1$, every $t$-dependent term cancels, leaving $0.5$.

Both are constant. For a $2\times2$ matrix the eigenvalues solve $\mu^2 - (\text{trace})\,\mu + \det = 0$, so here $\mu^2 + 0.5\mu + 0.5 = 0$:

$$
\mu = -0.25 \pm 0.661438j \quad\text{for every } t,
$$

a damping ratio of $0.354$ and a decay rate of $0.25\,\mathrm{s^{-1}}$. By the frozen-time test, this system is comfortably stable at every instant.

Now actually integrate it from $\mathbf{x}(0) = (1, 0)$:

| $t$ | $\mathbf{x}(t)$ | $\|\mathbf{x}(t)\|$ | $e^{t/2}$ |
| --- | --- | --- | --- |
| $1$ | $(0.8908,\ -1.3874)$ | $1.64872$ | $1.64872$ |
| $2$ | $(-1.1312,\ -2.4717)$ | $2.71828$ | $2.71828$ |
| $5$ | $(3.4557,\ 11.6821)$ | $12.18249$ | $12.18249$ |

The size of the state grows exactly as $e^{t/2}$, to six digits. It does not shrink at all. The state vector is rotating while the matrix's own preferred directions rotate with it, and the rotation feeds energy in faster than the frozen decay takes it out.

This is a standard [[counterexample|frozen-counterexample]]. Its lesson: "all eigenvalues in the left half plane at all times" is neither necessary nor sufficient for a linear time-varying system to be stable.
:::

::: warning Do not certify a gain schedule with frozen-time poles
A gain-scheduled design whose frozen closed-loop poles look excellent everywhere can still be unstable. The failure shows up exactly where the schedule moves fastest: through a staging event, a throttle-down, the transonic region. The honest checks are two.

- **Simulate the time-varying closed loop.** For a linear time-varying system, that means propagating the [[state transition matrix|transition-matrix]] and looking at $\|\boldsymbol{\Phi}(t_f, t_0)\|$.
- **Produce a Lyapunov certificate.** For TVLQR you get one for free from $\mathbf{P}(t)$, as the next section shows.

Frozen-time poles are useful for intuition and for rough sizing. They are not evidence.
:::

## The cost-to-go is a certificate

TVLQR hands you a stability proof along with the gain. Picture a marble in a bowl. If you can show the marble's height only ever goes down, the marble must settle at the bottom — you do not need to know exactly how it rolls. A function that works like that height is a **[[Lyapunov function|lyapunov-bowl]]**. For TVLQR the bowl is the cost-to-go.

Take

$$
V(t, \delta\mathbf{x}) = \delta\mathbf{x}^\top\mathbf{P}(t)\,\delta\mathbf{x},
$$

the optimal cost still to come from deviation $\delta\mathbf{x}$ at time $t$. Differentiate it along the closed-loop motion, using $\mathbf{A}_{cl} = \mathbf{A} - \mathbf{B}\mathbf{K}$ for the closed-loop matrix and $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$:

$$
\dot V = \delta\mathbf{x}^\top\big(\dot{\mathbf{P}} + \mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl}\big)\delta\mathbf{x}.
$$

(Three terms, because $V$ changes when $\mathbf{P}$ changes and when $\delta\mathbf{x}$ changes on either side.)

Now expand the two closed-loop terms:

$$
\mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - 2\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}.
$$

The Riccati equation says

$$
\dot{\mathbf{P}} = -\mathbf{A}^\top\mathbf{P} - \mathbf{P}\mathbf{A} + \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} - \mathbf{Q}.
$$

Add them. The $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A}$ terms cancel, and $-2\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ leaves $-\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$, which equals $-\mathbf{K}^\top\mathbf{R}\mathbf{K}$. So

$$
\dot V = -\,\delta\mathbf{x}^\top\big(\mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K}\big)\delta\mathbf{x} \;\le\; 0 .
$$

The cost-to-go goes down along every closed-loop trajectory, with no frozen-time reasoning anywhere in the argument. That is a real time-varying stability certificate.

It is also the basis of **[[funnels|funnel-picture]]**. The set

$$
\{\delta\mathbf{x} : \delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x} \le \rho(t)\}
$$

is a tube around the nominal that nothing leaves: any dispersion that starts inside it at $t_0$ is still inside at $t_f$. (Here $\rho(t)$ is the tube's size, not the control weight of the last lesson.) Choosing $\rho(t)$ so the tube also respects the neglected nonlinear terms and the actuator limits is how **region-of-attraction** certificates are built for trajectory-stabilized vehicles.

::: key What P means, along a trajectory
$V(t,\delta\mathbf{x}) = \delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x}$ is the optimal cost-to-go from the deviation $\delta\mathbf{x}$ at time $t$. Along the closed loop it satisfies $\dot V = -\delta\mathbf{x}^\top(\mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K})\delta\mathbf{x} \le 0$, so it is a valid time-varying Lyapunov function and the basis of funnel and region-of-attraction arguments.
:::

::: example TVLQR through maximum dynamic pressure
Take a first stage in the pitch plane. The states are $(\alpha, q)$ — angle of attack and pitch rate — and the control is the gimbal angle $\delta$.

The vehicle:

- mass falls from $3.2\times10^{5}$ to $1.0\times10^{5}\,\mathrm{kg}$ over a $160\,\mathrm{s}$ burn at $1375\,\mathrm{kg/s}$ (check: $1375 \times 160 = 220{,}000\,\mathrm{kg}$ burned);
- pitch inertia falls in proportion, from $2.6\times10^{7}\,\mathrm{kg\,m^2}$;
- thrust is $7.6\,\mathrm{MN}$ acting on a $23\,\mathrm{m}$ arm;
- dynamic pressure follows a bell-shaped curve centered at $75\,\mathrm{s}$, peaking at $33\,\mathrm{kPa}$.

Linearizing gives $\dot\alpha = -Z_\alpha\alpha + q$ and $\dot q = M_\alpha\alpha + M_\delta\delta$. Here $M_\alpha$ ("M alpha") is how strongly angle of attack twists the vehicle, $M_\delta$ is how strongly the gimbal does, and $Z_\alpha$ is a small aerodynamic damping term. At five points in the flight:

| $t$ (s) | $\bar q$ (Pa) | $m$ (kg) | $J$ (kg m²) | $V$ (m/s) | $M_\alpha\,(\mathrm{s^{-2}})$ | $M_\delta\,(\mathrm{s^{-2}})$ | open-loop poles $(\mathrm{s^{-1}})$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $0$ | $2052$ | $320000$ | $2.60\times10^{7}$ | $40$ | $0.0302$ | $-6.723$ | $-0.176,\ +0.172$ |
| $40$ | $18022$ | $265000$ | $2.15\times10^{7}$ | $184$ | $0.3199$ | $-8.118$ | $-0.571,\ +0.561$ |
| $75$ | $33000$ | $216875$ | $1.76\times10^{7}$ | $546$ | $0.7158$ | $-9.920$ | $-0.850,\ +0.842$ |
| $110$ | $18022$ | $168750$ | $1.37\times10^{7}$ | $1129$ | $0.5024$ | $-12.749$ | $-0.710,\ +0.707$ |
| $160$ | $931$ | $100000$ | $8.12\times10^{6}$ | $2344$ | $0.0438$ | $-21.514$ | $-0.209,\ +0.209$ |

Three things to see. The vehicle is statically unstable the whole way (there is always a positive pole). The instability is worst at maximum dynamic pressure. And the gimbal effectiveness $|M_\delta|$ triples over the burn, from $6.72$ to $21.5$, because the same thrust acts on a lighter vehicle.

The weights are scheduled too, the way real vehicles do it. The angle-of-attack penalty is multiplied by

$$
w(t) = 1 + 9\,\frac{\bar q(t)}{\bar q_{\max}},
$$

so structural load dominates the cost through the high-$\bar q$ region ($w = 10$ at $75\,\mathrm{s}$) and attitude dominates at the ends ($w = 1.56$ at liftoff, $1.25$ at burnout). The Bryson budgets are $3^\circ$ of angle of attack, $4^\circ/\mathrm{s}$ of pitch rate and $5^\circ$ of gimbal.

Integrating the Riccati equation backwards from $\mathbf{Q}_f = \mathbf{P}_\infty(t_f)$ gives this [[gain schedule|gain-schedule-plot]]:

| $t$ (s) | $0$ | $40$ | $60$ | $75$ | $110$ | $130$ | $160$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $k_\alpha$ | $-2.090$ | $-4.090$ | $-5.070$ | $-5.330$ | $-4.076$ | $-2.897$ | $-1.868$ |
| $k_q$ | $-1.478$ | $-1.603$ | $-1.637$ | $-1.624$ | $-1.483$ | $-1.394$ | $-1.318$ |

The angle-of-attack gain changes by a factor of $5.330/1.868 = 2.9$ across the flight, peaking where the loads do.

Now fly $200$ dispersed cases. Each starts with a random error ($\sigma_\alpha = 1.0^\circ$, $\sigma_q = 0.5^\circ/\mathrm{s}$, where $\sigma$ is the standard deviation), and each meets a wind shear, modeled as a sudden jump in $\alpha$ with $\sigma = 2.5^\circ$ at $t = 65\,\mathrm{s}$. Compare TVLQR against two fixed gains, each the infinite-horizon LQR solution frozen at one flight condition:

| Design | total cost | cost $0$–$40\,\mathrm{s}$ | cost $40$–$110\,\mathrm{s}$ | peak $\lvert\delta\rvert$, $0$–$40\,\mathrm{s}$ | post-shear load $\int\bar q\lvert\alpha\rvert dt$ | $\lvert\alpha\rvert$ $1\,\mathrm{s}$ after the shear |
| --- | --- | --- | --- | --- | --- | --- |
| TVLQR | $2.064$ | $0.1015$ | $1.963$ | $1.62^\circ$ | $19.2\,\mathrm{kPa\,deg\,s}$ | $0.037^\circ$ |
| Fixed at $75\,\mathrm{s}$ | $2.128$ | $0.1609$ | $1.967$ | $3.81^\circ$ | $18.6\,\mathrm{kPa\,deg\,s}$ | $0.031^\circ$ |
| Fixed at liftoff | $2.768$ | $0.1015$ | $2.667$ | $1.62^\circ$ | $43.5\,\mathrm{kPa\,deg\,s}$ | $0.455^\circ$ |

(The costs, peaks and angles are averages over the $200$ cases.)

Each fixed gain is excellent where it was designed and poor elsewhere, and the two fail in different ways.

The **max-Q gain is too aggressive early.** It costs $58\,\%$ more over the first forty seconds ($0.1609/0.1015 = 1.59$). It uses $3.81^\circ$ of gimbal against TVLQR's $1.62^\circ$ for the same starting errors — more than twice the actuator activity, at a time when none of it is needed. On a real vehicle that means more [[slosh|slosh-word]] excitation and more bending-mode drive during the very phase engineers worry about.

The **liftoff gain is too sluggish late.** One second after the shear it leaves $0.455^\circ$ of angle of attack against TVLQR's $0.037^\circ$, a factor of twelve. It piles up $2.3$ times the structural load after the shear ($43.5/19.2$). Its total cost is $34\,\%$ higher ($2.768/2.064 = 1.34$), and nearly all of that comes between $40$ and $110\,\mathrm{s}$.

TVLQR is the only design that is right at both ends. That is not because it is a clever compromise. It solves the correct problem at every instant, including the instants where the cost itself has changed.
:::

## Implementation

- **Solve backwards, once, offline.** The nominal is known before flight, so the gain schedule is a preflight product, computed on the ground.
- **Store sparsely and interpolate.** A $160\,\mathrm{s}$ burn with a $50\,\mathrm{Hz}$ control cycle has $8000$ cycles. Storing a gain for every cycle — two gains per axis, three axes, four bytes each — would take about $190\,\mathrm{kB}$. But $\mathbf{K}(t)$ is smooth wherever the plant is, so knots every second with linear interpolation are usually enough, and that table is under $4\,\mathrm{kB}$. Add extra knots where $\mathbf{A}(t)$ moves fast: staging, throttle steps and the transonic region.
- **Index by something physical.** A schedule stored against clock time alone is wrong the moment the vehicle runs early or late. Real designs index against a quantity that only ever increases along the flight — normalized burn time, velocity, or mass burned — so a slow vehicle uses the gains that match where it actually is.
- **Keep the feedforward exact.** The whole construction assumes $\mathbf{u}_{nom}$ really does produce $\mathbf{x}_{nom}$ on the nonlinear plant. If it does not, the "deviation" being regulated includes a bias, and the loop is fighting a modeling error rather than a dispersion.
- **Check the linearization is still good.** Beyond some size of dispersion, the neglected higher-order terms are not small. The funnel is the right tool for saying how far that is.

## Check yourself

::: check
Write the control law for TVLQR, define every symbol, and say which parts are computed offline.
:::

::: answer
$$
\mathbf{u}(t) = \mathbf{u}_{nom}(t) - \mathbf{K}(t)\big(\mathbf{x}(t) - \mathbf{x}_{nom}(t)\big),
$$

where:

- $\mathbf{x}_{nom}(t)$ and $\mathbf{u}_{nom}(t)$ are the nominal state and control trajectories;
- $\mathbf{x}(t)$ is the measured or estimated state;
- $\mathbf{K}(t) = \mathbf{R}(t)^{-1}\mathbf{B}(t)^\top\mathbf{P}(t)$, with $\mathbf{P}$ from the differential Riccati equation integrated backwards from $\mathbf{P}(t_f) = \mathbf{Q}_f$ along the nominal;
- $\mathbf{A}(t) = \partial\mathbf{f}/\partial\mathbf{x}$ and $\mathbf{B}(t) = \partial\mathbf{f}/\partial\mathbf{u}$, evaluated on the nominal.

Everything except the subtraction and the multiply is offline: the nominal trajectory, the linearizations, the Riccati sweep and the gain table are all preflight products. Onboard, the controller does one table lookup, one vector subtraction and one matrix-vector product per cycle. Its execution time is bounded and known in advance, which is a main reason this architecture is trusted with a vehicle.
:::

::: check
The frozen eigenvalues of the counterexample are constant at $-0.25 \pm 0.661j$, yet the solution grows. Reconcile this with the fact that a time-invariant system with those eigenvalues is stable.
:::

::: answer
For a constant $\mathbf{A}$, the solution is $e^{\mathbf{A}t}\mathbf{x}_0$. The eigenvalues govern it because the eigenvectors stay fixed: you split the starting state into modal pieces once, and each piece then decays on its own.

For a time-varying $\mathbf{A}(t)$, the solution is given by the state transition matrix. That is **not** $e^{\int\mathbf{A}\,dt}$ unless $\mathbf{A}(t)$ commutes with its own integral, and here it does not.

The eigenvectors of this $\mathbf{A}(t)$ rotate at $1\,\mathrm{rad/s}$. The state ends up persistently out of line with the decaying directions, and the energy the rotation pumps in exceeds the $0.25\,\mathrm{s^{-1}}$ decay, for a net growth rate of $+0.5\,\mathrm{s^{-1}}$.

The general lesson: eigenvalues describe a *fixed* matrix, and a time-varying system is not described by any fixed matrix.
:::

::: check
Show that $\mathbf{P}(t)$ from the TVLQR sweep is a Lyapunov function for the closed loop, and state what that gives you that a simulation does not.
:::

::: answer
Let $V = \delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x}$ and $\mathbf{A}_{cl} = \mathbf{A}-\mathbf{B}\mathbf{K}$. Then $\dot V = \delta\mathbf{x}^\top(\dot{\mathbf{P}} + \mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl})\delta\mathbf{x}$.

Substituting $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ gives $\mathbf{A}_{cl}^\top\mathbf{P}+\mathbf{P}\mathbf{A}_{cl} = \mathbf{A}^\top\mathbf{P}+\mathbf{P}\mathbf{A}-2\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$. The Riccati equation supplies $\dot{\mathbf{P}}$. The sum is $-(\mathbf{Q}+\mathbf{K}^\top\mathbf{R}\mathbf{K})$, which is negative semidefinite, so $\dot V \le 0$.

What it gives beyond simulation is a statement about **all** starting conditions in a set, not only the ones you happened to try. Any $\delta\mathbf{x}(t_0)$ with $\delta\mathbf{x}^\top\mathbf{P}(t_0)\delta\mathbf{x} \le \rho$ keeps satisfying that bound at every later $t$. A single matrix inequality certifies an entire tube. A Monte Carlo of two hundred cases certifies two hundred cases.
:::

::: check
Your TVLQR schedule is indexed by time. The vehicle flies five seconds behind the nominal because of a low-thrust engine. What goes wrong, and what is the standard fix?
:::

::: answer
At every clock time, the controller applies the gain computed for a flight condition the vehicle has not reached yet.

On the climb toward maximum dynamic pressure the gain is rising fast. At $t = 40\,\mathrm{s}$ the schedule supplies $k_\alpha = -4.09$, while the vehicle is really at the $35\,\mathrm{s}$ condition, which wants about $-3.79$ — roughly $8\,\%$ too much gain. (Near the peak the schedule is flat, so there the gain error is small.)

The bigger problem is that the feedforward $\mathbf{u}_{nom}(t)$ and the reference $\mathbf{x}_{nom}(t)$ are also five seconds wrong. The "deviation" being regulated then contains a large bias, and the loop fights it continuously.

The standard fix is to index the schedule — and usually the whole guidance law — by a physical quantity that only ever increases along the flight, rather than by clock time: velocity, altitude, mass burned, or a normalized burn fraction. Then a slow vehicle reaches each gain later, which is correct. Where time must be used, the nominal is regenerated in flight so that $\mathbf{x}_{nom}$ and $\mathbf{u}_{nom}$ stay consistent with where the vehicle actually is.
:::

::: check
In the ascent comparison the fixed max-Q gain cost only $3\,\%$ more overall. Why would anyone bother with TVLQR for a $3\,\%$ improvement?
:::

::: answer
Because the total cost is the wrong number to look at, and the table shows why ($2.128/2.064 = 1.03$).

The $3\,\%$ is an average over a flight that is mostly calm. The damage is concentrated, and it is physical. Over the first forty seconds the fixed max-Q gain uses $3.81^\circ$ of gimbal against $1.62^\circ$ — more than double the actuator activity, during the phase where the vehicle is heaviest, its bending modes lowest and its slosh least damped. That cost is paid in structural shaking and actuator wear, not in the quadratic index.

Meanwhile the other fixed design is $34\,\%$ worse overall and leaves twelve times the angle of attack one second after a shear. That is a load case, not a statistic.

And TVLQR costs almost nothing extra. The schedule is computed once on the ground, and onboard it differs from a fixed gain only by a table lookup. So the real question is not whether $3\,\%$ is worth the effort. It is whether there is any reason to accept a design that is wrong at both ends of the flight, when the correct one costs the same.
:::

## Summary

| Object | Statement |
| --- | --- |
| Linearization | $\mathbf{A}(t) = \partial\mathbf{f}/\partial\mathbf{x}$, $\mathbf{B}(t) = \partial\mathbf{f}/\partial\mathbf{u}$, both evaluated on the nominal |
| Deviation dynamics | $\dot{\delta\mathbf{x}} = \mathbf{A}(t)\delta\mathbf{x} + \mathbf{B}(t)\delta\mathbf{u}$ |
| Sweep | $-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P}+\mathbf{P}\mathbf{A}-\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}+\mathbf{Q}$ backwards from $\mathbf{Q}_f$, along the nominal |
| Control law | $\mathbf{u}(t) = \mathbf{u}_{nom}(t) - \mathbf{K}(t)(\mathbf{x}(t)-\mathbf{x}_{nom}(t))$, $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ |
| Certificate | $\dot V = -\delta\mathbf{x}^\top(\mathbf{Q}+\mathbf{K}^\top\mathbf{R}\mathbf{K})\delta\mathbf{x} \le 0$ for $V = \delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x}$ |
| Funnel | $\{\delta\mathbf{x}: \delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x} \le \rho(t)\}$ is an invariant tube about the nominal |
| Frozen poles | Neither necessary nor sufficient; the counterexample has poles at $-0.25\pm0.661j$ and grows as $e^{t/2}$ |
| Ascent schedule | $k_\alpha$ from $-2.09$ at liftoff to $-5.33$ at max-$\bar q$ to $-1.87$ at burnout, a factor of $2.9$ |
| Against a max-$\bar q$ fixed gain | $58\,\%$ more early cost, $2.4\times$ the gimbal activity in the first $40\,\mathrm{s}$ |
| Against a liftoff fixed gain | $34\,\%$ more total cost, $12\times$ the angle of attack one second after a shear |
| Implementation | Offline sweep, sparse table with interpolation, indexed by a physical variable that only increases |

Everything so far has assumed the full state is known exactly. The next lesson removes that assumption and builds the controller that actually flies — with the consequences for robustness you already met in the margins lesson.

::: context table-lookup Why flight software likes a lookup table
Flight computers run on a fixed clock: every cycle, perhaps fifty times a second, the control law must finish before the next one starts. An onboard optimizer might take a few iterations one cycle and many more the next, and in a bad case might not converge at all. Reading two numbers from a table, blending them, and doing one small matrix multiply takes the same short time every cycle. That predictability is easy to test and to certify, and it is a big reason precomputed gain schedules have flown on launch vehicles for decades.
:::

::: context linearize-word What linearizing means
Zoom in far enough on any smooth curve and it looks like a straight line — the tangent line. Linearizing does the same for the equations of motion: near the nominal, a small change in state or control causes a change in $\dot{\mathbf{x}}$ that is very nearly proportional to it. The matrices $\mathbf{A}(t)$ and $\mathbf{B}(t)$ are those proportions, the slopes of the tangent. The approximation is excellent for small deviations and gets worse as they grow, which is why the funnel later matters.
:::

::: context feedforward-feedback Feedforward and feedback, on a road trip
Driving a winding road you know well, you turn the wheel for each bend as it arrives — that is feedforward, the planned move. You also nudge the wheel whenever you drift toward the edge — that is feedback, the correction. Feedforward alone drifts off the road at the first gust. Feedback alone is always late to every bend. TVLQR uses both: $\mathbf{u}_{nom}$ flies the plan, and $-\mathbf{K}(t)\,\delta\mathbf{x}$ fixes the drift.
:::

::: context frozen-counterexample Growing while every snapshot says "decay"
The blue curve is what the frozen eigenvalues promise: a size shrinking like $e^{-t/4}$. The red curve is what actually happens from the same start: the size grows like $e^{t/2}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,135.0 48.8,134.0 57.5,133.0 66.2,131.9 75.0,130.7 83.8,129.5 92.5,128.2 101.2,126.8 110.0,125.3 118.8,123.7 127.5,122.0 136.2,120.2 145.0,118.2 153.8,116.2 162.5,114.0 171.2,111.7 180.0,109.2 188.8,106.6 197.5,103.8 206.2,100.8 215.0,97.6 223.8,94.3 232.5,90.7 241.2,86.8 250.0,82.8 258.8,78.4 267.5,73.8 276.2,68.9 285.0,63.7 293.8,58.1 302.5,52.2 311.2,45.9 320.0,39.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,135.0 48.8,135.5 57.5,135.9 66.2,136.3 75.0,136.8 83.8,137.2 92.5,137.6 101.2,137.9 110.0,138.3 118.8,138.7 127.5,139.0 136.2,139.4 145.0,139.7 153.8,140.0 162.5,140.3 171.2,140.6 180.0,140.9 188.8,141.2 197.5,141.5 206.2,141.7 215.0,142.0 223.8,142.2 232.5,142.5 241.2,142.7 250.0,142.9 258.8,143.1 267.5,143.3 276.2,143.5 285.0,143.7 293.8,143.9 302.5,144.1 311.2,144.3 320.0,144.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="34" y="139">1</text><text x="34" y="43">7.4</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="110" y="166">1</text><text x="180" y="166">2</text><text x="250" y="166">3</text><text x="320" y="166">4 s</text></g>
  <text x="200" y="72" font-size="11" fill="#b4232c">actual size, e^(t/2)</text>
  <text x="120" y="130" font-size="11" fill="#1d6fd1">frozen promise, e^(−t/4)</text>
</svg>
```

The same idea hides in gain-scheduled designs: stable snapshots, unstable motion, especially where the schedule changes fastest.
:::

::: context transition-matrix The state transition matrix
For a linear system, the state at time $t$ is some matrix times the state at time $t_0$: $\mathbf{x}(t) = \boldsymbol{\Phi}(t, t_0)\,\mathbf{x}(t_0)$. That matrix $\boldsymbol{\Phi}$ ("Phi") is the state transition matrix. For a constant $\mathbf{A}$ it is $e^{\mathbf{A}(t-t_0)}$. For a time-varying $\mathbf{A}(t)$ there is usually no formula, so you get it by integrating $\dot{\boldsymbol{\Phi}} = \mathbf{A}(t)\boldsymbol{\Phi}$ from the identity matrix. Its size tells you the most any starting error can grow over the interval — the honest answer to "is this stable?".
:::

::: context lyapunov-bowl A bowl whose shape changes
For a fixed plant, $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ is a fixed bowl, and the state rolls downhill in it. For TVLQR the bowl $\delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x}$ changes shape as the flight goes on — steeper where the Riccati solution is large, flatter where it is small. The proof in the lesson shows something stronger than "the bowl is a bowl": whatever the bowl is doing, the state's height in it never goes up. That is what makes it a certificate over time, and it is the same idea iLQR and DDP use at the end of this module, where every iteration runs a TVLQR backward pass.
:::

::: context funnel-picture Funnels around a trajectory
Picture the nominal trajectory as a line through state space, and around it a tube whose cross-section at each time is the ellipse $\delta\mathbf{x}^\top\mathbf{P}(t)\delta\mathbf{x} \le \rho(t)$. Any vehicle that starts inside the tube stays inside it. Chaining tubes end to end — each one's exit fitting inside the next one's entrance — is how motion planners in robotics build guaranteed paths, an approach often called "LQR-trees".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M30,140 C120,140 200,70 330,45" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M30,105 C120,110 200,55 330,35 L330,55 C200,85 120,170 30,175 Z" fill="#8fb8f0" opacity="0.45"/>
  <g fill="none" stroke="#1d6fd1" stroke-width="1.5">
    <ellipse cx="30" cy="140" rx="8" ry="35"/><ellipse cx="130" cy="130" rx="7" ry="28"/><ellipse cx="230" cy="80" rx="6" ry="18"/><ellipse cx="330" cy="45" rx="5" ry="10"/>
  </g>
  <circle cx="30" cy="118" r="4" fill="#b4232c"/>
  <path d="M30,118 C80,120 150,108 230,72 S310,44 330,42" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="200" y="130" font-size="11" fill="#1f2a44">nominal trajectory</text>
  <text x="44" y="30" font-size="11" fill="#b4232c">dispersed start stays inside</text>
  <text x="250" y="160" font-size="11" fill="#1d6fd1">schematic, not to scale</text>
</svg>
```
:::

::: context gain-schedule-plot The schedule follows the load
The computed angle-of-attack gain (blue, magnitude $|k_\alpha|$) rises and falls with dynamic pressure (orange), because the weight on $\alpha$ was scheduled with $\bar q$ and the instability grows with $\bar q$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="25" x2="40" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="40.0,143.8 49.4,141.1 58.8,137.6 68.1,133.1 77.5,127.5 86.9,120.9 96.2,113.2 105.6,104.6 115.0,95.4 124.4,85.9 133.8,76.6 143.1,67.9 152.5,60.5 161.9,54.8 171.2,51.2 180.6,50.0 190.0,51.2 199.4,54.8 208.8,60.5 218.1,67.9 227.5,76.6 236.9,85.9 246.2,95.4 255.6,104.6 265.0,113.2 274.4,120.9 283.8,127.5 293.1,133.1 302.5,137.6 311.9,141.1 321.2,143.8 330.6,145.8 340.0,147.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,108.2 49.4,105.1 58.8,101.3 68.1,96.8 77.5,91.7 86.9,86.2 96.2,80.3 105.6,74.2 115.0,68.2 124.4,62.4 133.8,57.1 143.1,52.4 152.5,48.6 161.9,45.7 171.2,44.0 180.6,43.4 190.0,44.0 199.4,45.8 208.8,48.7 218.1,52.6 227.5,57.3 236.9,62.7 246.2,68.5 255.6,74.5 265.0,80.6 274.4,86.5 283.8,92.1 293.1,97.1 302.5,101.6 311.9,105.4 321.2,108.5 330.6,110.9 340.0,112.6"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="40" y="166">0</text><text x="180.6" y="166">75</text><text x="340" y="166">160 s</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="34" y="47">5.33</text><text x="34" y="112">2.09</text></g>
  <text x="200" y="36" font-size="11" fill="#1d6fd1">|kα|</text>
  <text x="215" y="100" font-size="11" fill="#f2b880">dynamic pressure</text>
</svg>
```

The gain at burnout, $1.87$, is below the liftoff value, $2.09$. Two things push it down: the weight on $\alpha$ is a little lower there ($w = 1.25$ against $1.56$), and the gimbal is three times more effective by then, so less gain buys the same torque.
:::

::: context slosh-word What slosh is
Slosh is the propellant swinging back and forth inside a partly empty tank, like water in a carried bucket. A liquid mass of many metric tons sloshing at about one cycle per second pushes on the vehicle in rhythm, and if the attitude controller keeps jerking the gimbal near that rhythm, it can pump the motion up. Tanks carry baffles to damp it, and control designers try not to move the gimbal more than they must — which is why doubling gimbal activity early in the flight is a real cost, not a cosmetic one.
:::
