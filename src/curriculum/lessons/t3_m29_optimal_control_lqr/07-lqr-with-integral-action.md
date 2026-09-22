---
id: l07-lqr-with-integral-action
title: LQR with integral action
minutes: 18
covers:
  - LQR with integral action
---

Everything so far has been a regulator: drive the state to zero, from wherever it starts, against nothing in particular. Real vehicles are not left alone. A reaction wheel has bearing drag. A main engine is misaligned by a fraction of a degree and pushes the vehicle off-axis every second it burns. An aerodynamic surface has a hinge-moment bias. A spacecraft in low orbit is pulled by gravity gradient and residual atmosphere. Each of these is a roughly constant torque added to the plant, and a pure state-feedback law responds to a constant torque with a constant error.

The fix is the one you already know from classical control — integrate the error and feed that back too — and the point of this lesson is that the optimiser will size the integral gain for you if you make the integral a state. The construction takes two lines. The interesting parts are what weight to put on the new state, what the integral gain means physically, and one pleasant surprise: unlike an observer, an integrator does **not** cost the guaranteed margins, because the integral state is computed exactly rather than estimated.

## Why a regulator has steady-state error

Add a constant disturbance to the plant, $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} + \mathbf{B}_d d$, and close the loop with $\mathbf{u} = -\mathbf{K}\mathbf{x}$. At equilibrium $\dot{\mathbf{x}} = \mathbf{0}$, so

$$
\mathbf{x}_{ss} = -(\mathbf{A}-\mathbf{B}\mathbf{K})^{-1}\mathbf{B}_d\, d .
$$

This is zero only if $\mathbf{B}_d d$ is zero. For the reaction-wheel axis, where the disturbance enters exactly where the control does ($\mathbf{B}_d = \mathbf{B}$), the algebra collapses to something you can carry in your head. With $\mathbf{A} - \mathbf{B}\mathbf{K} = \begin{bmatrix}0 & 1\\ -k_1/J & -k_2/J\end{bmatrix}$, its inverse has determinant $k_1/J$, and working through,

$$
\theta_{ss} = \frac{d}{k_1}, \qquad \omega_{ss} = 0 .
$$

The controller ends up tilted by exactly the angle at which its own proportional feedback generates a torque equal and opposite to the disturbance. Nothing else could happen: the only way $-k_1\theta$ can cancel $d$ is for $\theta$ to be $d/k_1$.

Put numbers on it. A $0.25\,\mathrm{N\,m}$ bias — a plausible thrust-vector offset during a station-keeping burn — against the effort-sized design $\mathbf{K} = (91.67,\ 150.09)$ gives

$$
\theta_{ss} = \frac{0.25}{91.67} = 2.727\times10^{-3}\,\mathrm{rad} = 0.156^\circ,
$$

which consumes a third of a $0.5^\circ$ pointing budget with the vehicle otherwise behaving perfectly. The Bryson design with $k_1 = 916.73$ would give $0.0156^\circ$ — ten times better, because the gain is ten times higher, which is the only lever proportional feedback has. Raising $k_1$ enough to make a bias negligible is the same as buying bandwidth you may not be able to afford.

## Augmenting the state

Introduce a new state that integrates the tracking error. With output $\mathbf{y} = \mathbf{C}\mathbf{x}$ and reference $\mathbf{r}$,

$$
\dot{\mathbf{x}}_i = \mathbf{r} - \mathbf{y} = \mathbf{r} - \mathbf{C}\mathbf{x},
$$

and stack it under the plant:

$$
\frac{d}{dt}\begin{bmatrix}\mathbf{x}\\ \mathbf{x}_i\end{bmatrix}
= \underbrace{\begin{bmatrix}\mathbf{A} & \mathbf{0}\\ -\mathbf{C} & \mathbf{0}\end{bmatrix}}_{\mathbf{A}_a}
\begin{bmatrix}\mathbf{x}\\ \mathbf{x}_i\end{bmatrix}
+ \underbrace{\begin{bmatrix}\mathbf{B}\\ \mathbf{0}\end{bmatrix}}_{\mathbf{B}_a}\mathbf{u}
+ \begin{bmatrix}\mathbf{0}\\ \mathbf{I}\end{bmatrix}\mathbf{r}
+ \begin{bmatrix}\mathbf{B}_d\\ \mathbf{0}\end{bmatrix}d .
$$

Now solve an ordinary LQR problem on $(\mathbf{A}_a, \mathbf{B}_a)$ with a weight $\mathbf{Q}_a = \mathrm{diag}(\mathbf{Q}, \mathbf{Q}_i)$, obtain $\mathbf{K}_a = [\,\mathbf{K}_x\quad \mathbf{K}_i\,]$, and implement

$$
\mathbf{u} = -\mathbf{K}_x\mathbf{x} - \mathbf{K}_i\mathbf{x}_i .
$$

::: key Integral action in state feedback
Augment the state with the integral of the tracking error, $\dot{\mathbf{x}}_i = \mathbf{r} - \mathbf{y}$, and design $\mathbf{K}$ on the augmented plant. This gives zero steady-state error to step references and step disturbances — the state-space form of the integral term.
:::

Why the error goes to zero is a one-line argument, and it is worth being able to give it. If the augmented closed loop is stable, then for constant $\mathbf{r}$ and $d$ every state settles, including $\mathbf{x}_i$. But $\dot{\mathbf{x}}_i = \mathbf{r} - \mathbf{y}$, and a settled $\mathbf{x}_i$ has $\dot{\mathbf{x}}_i = \mathbf{0}$, so $\mathbf{y} = \mathbf{r}$ exactly. The result requires nothing about the size of the gains or the accuracy of the model — only that the loop be stable — which is why integral action is the standard defence against errors you did not model.

The augmented pair $(\mathbf{A}_a, \mathbf{B}_a)$ is controllable if and only if $(\mathbf{A},\mathbf{B})$ is controllable **and**

$$
\begin{bmatrix}\mathbf{A} & \mathbf{B}\\ \mathbf{C} & \mathbf{0}\end{bmatrix}
$$

is nonsingular — that is, the plant has no transmission zero at the origin. A plant that already cannot hold a constant output cannot be given integral action by wrapping an integrator round it. For the wheel axis that matrix is $\begin{bmatrix}0&1&0\\0&0&1/120\\1&0&0\end{bmatrix}$ with determinant $1/120 \ne 0$, so the construction is legal.

## Sizing the integral weight

$\mathbf{x}_i$ has units of (output units) $\times$ seconds, so a Bryson weight for it needs a budget with those units: the largest error-time product you are willing to accumulate. Writing that budget as $y_{\max}T_i$ for a chosen recovery time $T_i$ gives $Q_i = 1/(y_{\max}T_i)^2$, and $T_i$ turns out to land almost exactly on the integral pole.

::: example Disturbance rejection on the reaction-wheel axis
$J = 120\,\mathrm{kg\,m^2}$, the effort-sized weights ($\mathbf{Q} = \mathrm{diag}(1.3131\times10^4,\ 820.70)$, $R = 1.5625$), a $0.25\,\mathrm{N\,m}$ torque bias applied as a step, and $Q_i = 1/(0.5^\circ \times T_i)^2$ for a range of $T_i$:

| $T_i$ (s) | $Q_i$ | $\mathbf{K}_a = (k_1, k_2, k_i)$ | closed-loop poles $(\mathrm{s^{-1}})$ | peak $\lvert\theta\rvert$ | back inside $2\,\%$ | $\min_\omega\lvert1+L\rvert$ |
| --- | --- | --- | --- | --- | --- | --- |
| $2$ | $3283$ | $(163.3,\ 199.3,\ -45.84)$ | $-0.482$, $-0.590\pm0.667j$ | $0.0750^\circ$ | $9.8\,\mathrm{s}$ | $1.000$ |
| $5$ | $525.2$ | $(121.3,\ 172.2,\ -18.33)$ | $-0.200$, $-0.617\pm0.619j$ | $0.1067^\circ$ | $23.1\,\mathrm{s}$ | $1.000$ |
| $10$ | $131.3$ | $(106.6,\ 161.6,\ -9.167)$ | $-0.100$, $-0.623\pm0.613j$ | $0.1269^\circ$ | $42.8\,\mathrm{s}$ | $1.000$ |
| $20$ | $32.83$ | $(99.17,\ 156.0,\ -4.584)$ | $-0.050$, $-0.625\pm0.611j$ | $0.1415^\circ$ | $81.9\,\mathrm{s}$ | $1.000$ |

Without the integrator the same disturbance leaves a permanent $0.156^\circ$ error. With it, the error is transient in every case: at $T_i = 5\,\mathrm{s}$ the attitude peaks at $0.107^\circ$ after $3.35\,\mathrm{s}$ and is back inside $2\,\%$ of that peak by $23\,\mathrm{s}$, with $\theta$ down to $2.3\times10^{-8}\,\mathrm{rad}$ after a minute.

Three readings. First, the integral pole sits at $-1/T_i$ to three digits — the chosen recovery time *is* the integral time constant, so the weight is picked directly from "how long may the bias persist?". Second, the oscillatory pair barely moves: integral action is a slow loop added underneath a fast one, and the optimiser keeps them separated. Third, the trade is peak error against recovery time, and it is monotone: faster integral action reduces the excursion and costs a larger $k_i$, which is authority spent on a disturbance rather than on the states.

The integral state settles at the value that supplies the trim command. At steady state $\mathbf{u} = -k_i x_i = -d$, so

$$
x_i(\infty) = \frac{d}{k_i} = \frac{0.25}{-18.33} = -0.01364\ \mathrm{rad\,s},
$$

matching the simulation exactly, and the command settles at $-0.25000\,\mathrm{N\,m}$ — the integrator has learned the disturbance and is cancelling it with no help from the attitude error.
:::

## The margins survive

Look at the last column of that table: $\min_\omega|1 + L(j\omega)| = 1.000000$ for every design. This is not a coincidence, and it is the practical reason to build integral action this way rather than bolting an integrator onto an existing design.

The augmented problem is an ordinary LQR problem. Its loop broken at the plant input is $\mathbf{L}(s) = \mathbf{K}_a(s\mathbf{I} - \mathbf{A}_a)^{-1}\mathbf{B}_a$, its gain comes from the CARE for $(\mathbf{A}_a, \mathbf{B}_a, \mathbf{Q}_a, \mathbf{R})$, and the return-difference identity applies verbatim. The reason nothing is lost is that $\mathbf{x}_i$ is not measured or estimated — it is the output of an integrator you run in your own software, known exactly. Compare with the observer case, where the estimate is wrong during transients and its dynamics sit inside the loop. An integrator adds a state you own; an estimator adds a state you guess.

::: example What hand-tuning the integral gain costs
Take the $T_i = 5\,\mathrm{s}$ design, $\mathbf{K}_a = (121.3,\ 172.2,\ -18.33)$, keep $k_1$ and $k_2$ at the non-integral design's values $(91.67,\ 150.09)$ — a natural thing to do when adding integral action to a controller that already works — and pick $k_i$ by hand.

| $\mathbf{K}_a$ | closed-loop poles $(\mathrm{s^{-1}})$ | $\min_\omega\lvert1+L\rvert$ | phase margin | gain reduction limit |
| --- | --- | --- | --- | --- |
| $(121.3,\ 172.2,\ -18.33)$, LQR | $-0.200$, $-0.617\pm0.619j$ | $1.000$ | $64.1^\circ$ | $0.105$ |
| $(91.67,\ 150.1,\ -55.00)$, $3\times k_i$ | $-0.954$, $-0.149\pm0.677j$ | $0.682$ | $52.3^\circ$ | $0.480$ |
| $(91.67,\ 150.1,\ -110.0)$, $6\times k_i$ | $-1.234$, $-0.0085\pm0.862j$ | $0.034$ | $3.5^\circ$ | $0.959$ |

At three times the integral gain the loop is still stable and the step response is faster, and the margins have already dropped below the LQR guarantee. At six times, the oscillatory pair has been dragged to within a hundredth of the imaginary axis, the phase margin is $3.5^\circ$, and the loop goes unstable if the actuator is $4\,\%$ weaker than modelled. Nothing in the nominal step response advertises this — the poles are all in the left half plane and the disturbance is rejected.

The LQR design reached the same integral authority by also raising $k_1$ from $91.67$ to $121.3$ and $k_2$ from $150.1$ to $172.2$. That is the coordination the optimiser performs and hand-tuning omits: integral action needs the proportional and rate loops stiffened alongside it, or the phase it adds at low frequency has nothing holding the loop up.
:::

## Windup, and when to leave the integrator out

An integrator whose output cannot be delivered keeps integrating. If the wheel saturates at $8\,\mathrm{N\,m}$ and the commanded torque is $30\,\mathrm{N\,m}$, $\mathbf{x}_i$ grows for as long as the error persists and then has to be unwound before the loop can respond again — a long, ugly overshoot. The two standard defences both apply unchanged here:

- **Clamping**: stop integrating whenever the command is saturated and the error would push it further into saturation.
- **Back-calculation**: drive the integrator with $\mathbf{r} - \mathbf{y} + \mathbf{K}_{aw}(\mathbf{u}_{sat} - \mathbf{u}_{cmd})$, so the integrator state is continuously pulled towards consistency with what the actuator actually delivered.

::: warning Integral action is not always wanted
A launch vehicle flying through a wind shear at maximum dynamic pressure is the standard counterexample. An attitude integrator sees the wind-induced attitude error as something to eliminate, so it commands sustained gimbal deflection to hold the vehicle on its inertial reference — which forces the vehicle to fly at an angle of attack equal to the full wind angle and maximises the $\bar q \alpha$ load. The load-relief design in the first lesson does the opposite: it lets the vehicle weathercock, accepting an attitude error in exchange for a reduced bending moment. Real launch vehicles therefore gain-schedule their integral term down towards zero through the high-$\bar q$ region and bring it back afterwards. The general rule: an integrator asserts that the output must equal the reference in steady state, and there are flight phases where that assertion is precisely wrong.
:::

## Check yourself

::: check
Derive $\theta_{ss} = d/k_1$ for the reaction-wheel axis and explain why $k_2$ does not appear.
:::

::: answer
At equilibrium both $\dot\theta$ and $\dot\omega$ vanish. The first row of $\dot{\mathbf{x}} = (\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x} + \mathbf{B}d$ reads $\dot\theta = \omega$, so $\omega_{ss} = 0$. The second row reads $\dot\omega = (-k_1\theta - k_2\omega + d)/J$; setting it to zero with $\omega_{ss} = 0$ gives $k_1\theta_{ss} = d$, hence $\theta_{ss} = d/k_1$. The rate gain is absent because at equilibrium there is no rate for it to act on — a rate feedback term can shape the transient but can never supply a steady trim torque. The same reasoning identifies exactly which feedback paths can null a constant disturbance: only those acting on states that are nonzero in the new equilibrium.
:::

::: check
The integral pole came out at $-1/T_i$ for every $T_i$ in the table. Why should the weight $Q_i = 1/(y_{\max}T_i)^2$ produce that?
:::

::: answer
The integral loop is slow compared with the attitude loop, so near the integral pole the fast states have essentially reached their quasi-steady values and the augmented system behaves like a first-order system in $x_i$ alone. For that reduced first-order problem the LQR pole is set by the ratio of the state weight to the effective control weight, and the Bryson scaling $Q_i = 1/(y_{\max}T_i)^2$ against a state weight $Q_{11} = 1/y_{\max}^2$ makes that ratio exactly $1/T_i^2$ — a square-root of which is the pole. The practical consequence is what matters: you choose the recovery time directly, in seconds, and the weight follows. If the observed integral pole is far from $-1/T_i$, the timescale separation has broken down, which usually means the integral action is being asked to be as fast as the attitude loop, and the design should be re-examined rather than re-tuned.
:::

::: check
Why does adding an integrator preserve the LQR margins while adding an observer destroys them, when both add states to the controller?
:::

::: answer
Because the integrator state is exact and the estimator state is not. Formally, the augmented problem $(\mathbf{A}_a, \mathbf{B}_a, \mathbf{Q}_a, \mathbf{R})$ is an ordinary LQR problem whose optimal gain satisfies the CARE for that plant, and the return-difference identity was derived from the CARE for whatever plant appears in the loop transfer function. Here the loop transfer function at the plant input is $\mathbf{K}_a(s\mathbf{I}-\mathbf{A}_a)^{-1}\mathbf{B}_a$ built from those same matrices, so the identity holds and $|1+L| \ge 1$ — confirmed numerically at $1.000000$ for every design in the table. In the LQG case the loop contains $(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}_f\mathbf{C})^{-1}\mathbf{L}_f\mathbf{C}$, which satisfies no Riccati equation for the plant being controlled. The distinction is not "extra states" but "extra states that are a function of the measurement rather than of the command".
:::

::: check
A colleague adds integral action to a working controller by keeping the existing gains and tuning $k_i$ upward until the disturbance recovery looks fast enough. What should you check before this flies?
:::

::: answer
The margins, at the plant input, for the augmented loop — not the step response, which will look excellent right up to the point of failure. The table in this lesson shows a design at six times the optimal integral gain whose poles are all stable, whose disturbance rejection is faster than the LQR design's, and whose phase margin is $3.5^\circ$ and gain reduction tolerance $4\,\%$. Concretely: compute $\min_\omega|1 + L(j\omega)|$ and require it above about $0.5$; sweep a real input gain and a transport delay across the flight envelope; and check whether the proportional and rate gains were raised alongside $k_i$, because they need to be. Then check windup behaviour against the actuator limit, since integral action and saturation interact badly and the nominal simulation may never saturate.
:::

::: check
Write the augmented matrices for a plant with two outputs to be tracked and three inputs, and say how many states the controller has.
:::

::: answer
With $\mathbf{x} \in \mathbb{R}^n$, $\mathbf{u} \in \mathbb{R}^3$, $\mathbf{y} = \mathbf{C}\mathbf{x} \in \mathbb{R}^2$, the integral state is $\mathbf{x}_i \in \mathbb{R}^2$, one per tracked output. Then $\mathbf{A}_a = \begin{bmatrix}\mathbf{A} & \mathbf{0}_{n\times2}\\ -\mathbf{C} & \mathbf{0}_{2\times2}\end{bmatrix}$ is $(n+2)\times(n+2)$, $\mathbf{B}_a = \begin{bmatrix}\mathbf{B}\\ \mathbf{0}_{2\times3}\end{bmatrix}$ is $(n+2)\times3$, the reference enters through $\begin{bmatrix}\mathbf{0}_{n\times2}\\ \mathbf{I}_2\end{bmatrix}$, and $\mathbf{K}_a$ is $3\times(n+2)$, partitioned as $[\mathbf{K}_x\ \ \mathbf{K}_i]$ with $\mathbf{K}_i$ of size $3\times2$. The controller itself carries two states, the two integrators; the other $n$ are the plant's, assumed measured. Controllability of the augmented pair requires $\begin{bmatrix}\mathbf{A} & \mathbf{B}\\ \mathbf{C} & \mathbf{0}\end{bmatrix}$ to have full row rank $n+2$, which needs at least as many inputs as tracked outputs — three inputs for two outputs is comfortable, and the extra input direction is free for the state-regulation part of the job.
:::

## Summary

| Object | Statement |
| --- | --- |
| Regulator error | $\mathbf{x}_{ss} = -(\mathbf{A}-\mathbf{B}\mathbf{K})^{-1}\mathbf{B}_d d$; for the wheel axis $\theta_{ss} = d/k_1$ |
| Augmented state | $\dot{\mathbf{x}}_i = \mathbf{r} - \mathbf{y} = \mathbf{r} - \mathbf{C}\mathbf{x}$ |
| Augmented plant | $\mathbf{A}_a = \begin{bmatrix}\mathbf{A} & \mathbf{0}\\ -\mathbf{C} & \mathbf{0}\end{bmatrix}$, $\mathbf{B}_a = \begin{bmatrix}\mathbf{B}\\ \mathbf{0}\end{bmatrix}$; $\mathbf{u} = -\mathbf{K}_x\mathbf{x} - \mathbf{K}_i\mathbf{x}_i$ |
| Zero-error argument | Stable loop $\Rightarrow$ $\dot{\mathbf{x}}_i \to \mathbf{0}$ $\Rightarrow$ $\mathbf{y} \to \mathbf{r}$, regardless of model error |
| Controllability | $(\mathbf{A},\mathbf{B})$ controllable and $\begin{bmatrix}\mathbf{A}&\mathbf{B}\\ \mathbf{C}&\mathbf{0}\end{bmatrix}$ nonsingular: no plant zero at the origin |
| Integral weight | $Q_i = 1/(y_{\max}T_i)^2$; the integral pole lands at $-1/T_i$ |
| Trim | $x_i(\infty) = d/k_i$, the value that makes the feedback supply the trim command |
| Margins | Preserved: the augmented problem is an LQR problem, so $\lvert1+L\rvert \ge 1$ still holds |
| Hand-tuned $k_i$ | $6\times$ the optimal value gave PM $3.5^\circ$ with an unremarkable step response |
| Windup | Clamp when saturated, or back-calculate from $\mathbf{u}_{sat} - \mathbf{u}_{cmd}$ |
| When to omit | High-$\bar q$ load relief: integral attitude action maximises $\bar q\alpha$ rather than minimising it |
| Worked numbers | $d = 0.25\,\mathrm{N\,m}$: $0.156^\circ$ permanent error without, $0.107^\circ$ peak and zero steady state with $T_i = 5\,\mathrm{s}$ |

The next lesson goes to the other end of the weighting range and asks what happens when control is made almost free — which turns out to expose a hard limit that no amount of authority can buy past.
