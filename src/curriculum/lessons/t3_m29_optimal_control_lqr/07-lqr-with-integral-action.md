---
id: l07-lqr-with-integral-action
title: LQR with integral action
minutes: 20
covers:
  - LQR with integral action
---

Picture a car on cruise control climbing a long hill. The hill pulls back on the car the whole time. A controller that only looks at *how far off* the speed is right now will settle a little below the set speed, because it needs some error to have a reason to push harder. A better controller also keeps a running tally of the error. As long as the car is slow, the tally keeps growing, and the push keeps growing with it, until the car is back at exactly the set speed.

That running tally is **integral action**, and this lesson builds it into LQR.

Every controller in this module so far has been a **regulator**: drive the state to zero from wherever it starts, with nothing pushing back. Real vehicles are pushed on all the time. A reaction wheel has bearing drag. A main engine is misaligned by a fraction of a degree, so it shoves the vehicle off-axis every second it burns. A control surface has a small built-in twisting bias. A spacecraft in low orbit feels a steady tug from [[gravity gradient and thin air|steady-torques]]. Each of these acts like a roughly constant torque added to the plant. A pure state-feedback law answers a constant torque with a constant error, forever.

The fix is the one you know from classical control: add up the error over time and feed that back too. The point of this lesson is that LQR will choose the size of that integral gain for you, if you make the running tally one of the states. The construction takes two lines. The interesting parts are what weight to put on the new state, what the integral gain means physically, and one pleasant surprise. Unlike an observer (which you will meet in the LQG lesson), an integrator does **not** cost you LQR's guaranteed margins, because the integral state is computed exactly rather than estimated.

## Why a regulator is left with an error

Start with the plant plus a constant disturbance $d$:

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} + \mathbf{B}_d d .
$$

Here $\mathbf{B}_d$ ("B sub d") says where the disturbance enters, the way $\mathbf{B}$ says where the control enters. Close the loop with $\mathbf{u} = -\mathbf{K}\mathbf{x}$. Once everything has settled, nothing is changing, so $\dot{\mathbf{x}} = \mathbf{0}$. That leaves $(\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x} + \mathbf{B}_d d = \mathbf{0}$, and solving for the state,

$$
\mathbf{x}_{ss} = -(\mathbf{A}-\mathbf{B}\mathbf{K})^{-1}\mathbf{B}_d\, d .
$$

The subscript $ss$ means **steady state** — where the motion ends up after the transients die away. This is zero only if $\mathbf{B}_d d$ is zero. Any real disturbance leaves a permanent offset.

Take the reaction-wheel axis from earlier lessons: states $\theta$ (attitude angle) and $\omega$ (rate), inertia $J = 120\,\mathrm{kg\,m^2}$, and a disturbance torque that enters exactly where the wheel torque does, so $\mathbf{B}_d = \mathbf{B}$. Then

$$
\mathbf{A} - \mathbf{B}\mathbf{K} = \begin{bmatrix}0 & 1\\ -k_1/J & -k_2/J\end{bmatrix},
$$

and the algebra collapses to something you can carry in your head:

$$
\theta_{ss} = \frac{d}{k_1}, \qquad \omega_{ss} = 0 .
$$

Read it this way. The vehicle ends up tilted by exactly the angle at which its own angle feedback, $-k_1\theta$, makes a torque equal and opposite to the disturbance. Nothing else could happen. At rest there is no rate, so the rate gain $k_2$ has nothing to push with, and the only way $-k_1\theta$ can cancel $d$ is for $\theta$ to be $d/k_1$.

::: note Why it has to be true
Write out the two rows of $\dot{\mathbf{x}} = (\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x} + \mathbf{B}d$ and set both to zero.

The first row says $\dot\theta = \omega$. At rest $\dot\theta = 0$, so $\omega_{ss} = 0$.

The second row says $\dot\omega = (-k_1\theta - k_2\omega + d)/J$. At rest this is zero, and $\omega_{ss} = 0$ already, so $-k_1\theta_{ss} + d = 0$, which gives $\theta_{ss} = d/k_1$.

The same reasoning tells you which feedback paths can ever cancel a constant disturbance: only the ones acting on states that are nonzero in the new resting position.
:::

Put numbers on it. A $0.25\,\mathrm{N\,m}$ bias is a plausible [[thrust-vector offset|thrust-offset]] during a station-keeping burn. Against the effort-sized design $\mathbf{K} = (91.67,\ 150.09)$ from the tuning lesson,

$$
\theta_{ss} = \frac{0.25}{91.67} = 2.727\times10^{-3}\,\mathrm{rad} = 0.156^\circ .
$$

That uses up almost a third of a $0.5^\circ$ pointing budget while the vehicle is otherwise behaving perfectly. The Bryson design, with $k_1 = 916.73$, would give $0.0156^\circ$ — ten times better, because the gain is ten times higher. Raising the gain is the only lever proportional feedback has. But raising $k_1$ enough to make a bias negligible means buying bandwidth you may not be able to afford.

## Adding the running tally as a state

Now build the tally. Let $\mathbf{y} = \mathbf{C}\mathbf{x}$ be the output you want to hold, and $\mathbf{r}$ the **reference**, the value you want it to hold at. Make a new state $\mathbf{x}_i$ ("x sub i", i for integral) whose rate of change is the tracking error:

$$
\dot{\mathbf{x}}_i = \mathbf{r} - \mathbf{y} = \mathbf{r} - \mathbf{C}\mathbf{x}.
$$

So $\mathbf{x}_i$ is the [[area under the error curve|running-area]], added up since the start. Stack it underneath the plant:

$$
\frac{d}{dt}\begin{bmatrix}\mathbf{x}\\ \mathbf{x}_i\end{bmatrix}
= \underbrace{\begin{bmatrix}\mathbf{A} & \mathbf{0}\\ -\mathbf{C} & \mathbf{0}\end{bmatrix}}_{\mathbf{A}_a}
\begin{bmatrix}\mathbf{x}\\ \mathbf{x}_i\end{bmatrix}
+ \underbrace{\begin{bmatrix}\mathbf{B}\\ \mathbf{0}\end{bmatrix}}_{\mathbf{B}_a}\mathbf{u}
+ \begin{bmatrix}\mathbf{0}\\ \mathbf{I}\end{bmatrix}\mathbf{r}
+ \begin{bmatrix}\mathbf{B}_d\\ \mathbf{0}\end{bmatrix}d .
$$

The subscript $a$ means **augmented** — the plant with the extra state bolted on. Read the bottom row of $\mathbf{A}_a$: the new state's rate is $-\mathbf{C}\mathbf{x}$ (plus $\mathbf{r}$), which is the error.

Now solve an ordinary LQR problem on $(\mathbf{A}_a, \mathbf{B}_a)$, with a weight $\mathbf{Q}_a = \mathrm{diag}(\mathbf{Q}, \mathbf{Q}_i)$ that adds a penalty $\mathbf{Q}_i$ on the integral state. Out comes one gain, $\mathbf{K}_a = [\,\mathbf{K}_x\quad \mathbf{K}_i\,]$, which you split into the part acting on the plant state and the part acting on the tally. Fly

$$
\mathbf{u} = -\mathbf{K}_x\mathbf{x} - \mathbf{K}_i\mathbf{x}_i .
$$

::: key Integral action in state feedback
Augment the state with the integral of the tracking error, $\dot{\mathbf{x}}_i = \mathbf{r} - \mathbf{y}$, and design $\mathbf{K}$ on the augmented plant. This gives zero steady-state error to step references and step disturbances — the state-space form of the integral term.
:::

### Why the error has to go to zero

This is a one-line argument, and it is worth being able to say it out loud. Suppose the augmented closed loop is stable, and $\mathbf{r}$ and $d$ are constant. Then every state settles, including $\mathbf{x}_i$. A settled $\mathbf{x}_i$ is not changing, so $\dot{\mathbf{x}}_i = \mathbf{0}$. But $\dot{\mathbf{x}}_i = \mathbf{r} - \mathbf{y}$. So $\mathbf{y} = \mathbf{r}$, exactly.

Notice what the argument did *not* need. It did not need the gains to be large. It did not need the model to be accurate. It only needed the loop to be stable. That is why integral action is the standard defense against errors you did not model: a disturbance you never heard of, a misaligned engine, a wrong inertia.

### When it is allowed

You cannot always wrap an integrator around a plant. The augmented pair $(\mathbf{A}_a, \mathbf{B}_a)$ is **controllable** — every state can be steered — if and only if $(\mathbf{A},\mathbf{B})$ is controllable **and**

$$
\begin{bmatrix}\mathbf{A} & \mathbf{B}\\ \mathbf{C} & \mathbf{0}\end{bmatrix}
$$

is nonsingular (its determinant is not zero). In words: the plant has no [[transmission zero at the origin|zero-at-origin]]. A plant that already cannot hold a constant output cannot be given that ability by adding an integrator around it.

For the wheel axis, with $\mathbf{C} = [1\ \ 0]$ (hold the angle), that matrix is

$$
\begin{bmatrix}0&1&0\\0&0&1/120\\1&0&0\end{bmatrix},
$$

whose determinant is $1/120 \ne 0$. The construction is legal.

## Choosing the weight on the tally

What should $\mathbf{Q}_i$ be? Use Bryson's rule, which says to weight each signal by one over the square of the largest value you will accept. The catch is units. $\mathbf{x}_i$ is error added up over time, so it has units of (output units) $\times$ seconds. The budget you need is the largest error-times-time you are willing to pile up.

A natural way to say that: "I accept an error of $y_{\max}$, for about $T_i$ seconds." Then the budget is $y_{\max}T_i$, and

$$
Q_i = \frac{1}{(y_{\max}T_i)^2}.
$$

Here $T_i$ ("T sub i") is a recovery time you pick. As the example below shows, it lands almost exactly on the integral pole, so you are really choosing how fast the integrator works, in seconds.

::: example Disturbance rejection on the reaction-wheel axis
Use the wheel axis with $J = 120\,\mathrm{kg\,m^2}$ and the effort-sized weights, $\mathbf{Q} = \mathrm{diag}(1.3131\times10^4,\ 820.70)$ and $R = 1.5625$. Hit it with a $0.25\,\mathrm{N\,m}$ torque bias that switches on at $t = 0$, and set $Q_i = 1/(0.5^\circ \times T_i)^2$ (with $0.5^\circ$ written in radians) for four recovery times. For example, at $T_i = 5\,\mathrm{s}$: $0.5^\circ = 8.727\times10^{-3}\,\mathrm{rad}$, times $5$ is $0.04363\,\mathrm{rad\,s}$, and $1/0.04363^2 = 525.2$.

In the table, $\mathbf{K}_a = (k_1, k_2, k_i)$; "back inside $2\,\%$" is when $\theta$ last leaves a band of $2\,\%$ of its peak; and $\min_\omega\lvert1+L\rvert$ is the smallest distance of the loop's Nyquist curve from the $-1$ point, which is at least $1$ for any true LQR loop.

| $T_i$ (s) | $Q_i$ | $\mathbf{K}_a = (k_1, k_2, k_i)$ | closed-loop poles $(\mathrm{s^{-1}})$ | peak $\lvert\theta\rvert$ | back inside $2\,\%$ | $\min_\omega\lvert1+L\rvert$ |
| --- | --- | --- | --- | --- | --- | --- |
| $2$ | $3283$ | $(163.3,\ 199.3,\ -45.84)$ | $-0.482$, $-0.590\pm0.667j$ | $0.0750^\circ$ | $9.8\,\mathrm{s}$ | $1.000$ |
| $5$ | $525.2$ | $(121.3,\ 172.2,\ -18.33)$ | $-0.200$, $-0.617\pm0.619j$ | $0.1067^\circ$ | $23.1\,\mathrm{s}$ | $1.000$ |
| $10$ | $131.3$ | $(106.6,\ 161.6,\ -9.167)$ | $-0.100$, $-0.623\pm0.613j$ | $0.1269^\circ$ | $42.8\,\mathrm{s}$ | $1.000$ |
| $20$ | $32.83$ | $(99.17,\ 156.0,\ -4.584)$ | $-0.050$, $-0.625\pm0.611j$ | $0.1415^\circ$ | $81.9\,\mathrm{s}$ | $1.000$ |

Without the integrator, the same disturbance leaves a permanent $0.156^\circ$ error. With it, the error is only temporary in every case. At $T_i = 5\,\mathrm{s}$ the attitude peaks at $0.107^\circ$ after $3.35\,\mathrm{s}$, is back inside $2\,\%$ of that peak by $23\,\mathrm{s}$, and is down to $2.3\times10^{-8}\,\mathrm{rad}$ after a minute. Sanity check: every peak is smaller than $0.156^\circ$, as it should be — the integrator starts helping before the error can grow to the no-integrator value.

Three things to read from the table.

1. **The integral pole sits at $-1/T_i$** to three digits: $-0.482$ is close to $-1/2$, and $-0.200$, $-0.100$, $-0.050$ are exact. The recovery time you chose *is* the integral time constant, so you pick the weight directly from "how long may the bias persist?".
2. **The oscillating pair barely moves.** It goes from $-0.590\pm0.667j$ to $-0.625\pm0.611j$ while the integral pole changes by a factor of ten. Integral action is a [[slow loop added underneath a fast one|slow-under-fast]], and the optimizer keeps the two apart.
3. **The trade is peak error against recovery time**, and it runs one way. Faster integral action shrinks the excursion but needs a larger $k_i$ — authority spent on the disturbance rather than on the states.

Finally, look at where the tally ends up. In steady state $\theta = 0$ and $\omega = 0$, so the whole command comes from the integrator: $\mathbf{u} = -k_i x_i$. To cancel the disturbance that command must be $-d$, so $-k_i x_i = -d$ and

$$
x_i(\infty) = \frac{d}{k_i} = \frac{0.25}{-18.33} = -0.01364\ \mathrm{rad\,s}.
$$

The simulation agrees exactly, and the command settles at $-0.25000\,\mathrm{N\,m}$. The integrator has *learned* the disturbance and cancels it with no help from any attitude error.
:::

## The margins survive

Look at the last column of that table again: $\min_\omega|1 + L(j\omega)| = 1.000000$ for every design. That is no coincidence. It is the practical reason to build integral action this way, instead of bolting an integrator onto a design you already have.

Recall from the margins lesson that $L(s)$ is the **loop transfer function** broken at the plant input — what a signal goes through on one trip around the loop — and that LQR's **return-difference identity** forces $|1 + L(j\omega)| \ge 1$ at every frequency. That one inequality is where the $-6\,\mathrm{dB}$ to $+\infty$ gain margin and the $60^\circ$ phase margin come from.

The augmented problem is an ordinary LQR problem. Its loop is $\mathbf{L}(s) = \mathbf{K}_a(s\mathbf{I} - \mathbf{A}_a)^{-1}\mathbf{B}_a$. Its gain comes from the Riccati equation for $(\mathbf{A}_a, \mathbf{B}_a, \mathbf{Q}_a, \mathbf{R})$. So the return-difference identity applies word for word.

Why does nothing get lost? Because $\mathbf{x}_i$ is not measured or estimated. It is the output of an integrator running in your own flight software, so it is known exactly. Compare the observer case in the LQG lesson, where the estimate is wrong during transients and the estimator's own dynamics sit inside the loop. An integrator adds a state you *own*. An estimator adds a state you *guess*.

::: example What hand-tuning the integral gain costs
Take the $T_i = 5\,\mathrm{s}$ LQR design, $\mathbf{K}_a = (121.3,\ 172.2,\ -18.33)$. Now try the natural shortcut instead: keep $k_1$ and $k_2$ at the old non-integral values, $(91.67,\ 150.09)$, because that controller already works, and pick $k_i$ by hand.

"Gain reduction limit" below is how far the actuator's strength can drop before the loop goes unstable: $0.105$ means it survives down to $10.5\,\%$ of the modeled strength.

| $\mathbf{K}_a$ | closed-loop poles $(\mathrm{s^{-1}})$ | $\min_\omega\lvert1+L\rvert$ | phase margin | gain reduction limit |
| --- | --- | --- | --- | --- |
| $(121.3,\ 172.2,\ -18.33)$, LQR | $-0.200$, $-0.617\pm0.619j$ | $1.000$ | $64.1^\circ$ | $0.105$ |
| $(91.67,\ 150.1,\ -55.00)$, $3\times k_i$ | $-0.954$, $-0.149\pm0.677j$ | $0.682$ | $52.3^\circ$ | $0.480$ |
| $(91.67,\ 150.1,\ -110.0)$, $6\times k_i$ | $-1.234$, $-0.0085\pm0.862j$ | $0.034$ | $3.5^\circ$ | $0.959$ |

At three times the integral gain the loop is still stable and the step response is faster. But the [[margins have already dropped below the LQR guarantee|margin-bars]]: $0.682$ is less than $1$.

At six times, the oscillating pair has been dragged to within a hundredth of the imaginary axis ($-0.0085$). The phase margin is $3.5^\circ$. The loop goes unstable if the actuator is only $4\,\%$ weaker than modeled ($1 - 0.959 = 0.041$). And nothing in the nominal step response warns you: every pole is in the left half plane, and the disturbance is rejected.

The LQR design reached the same kind of integral authority by also raising $k_1$ from $91.67$ to $121.3$ and $k_2$ from $150.1$ to $172.2$. That is the teamwork the optimizer does and hand-tuning leaves out. Integral action adds phase lag at low frequency, so the angle and rate loops must be stiffened alongside it, or nothing holds the loop up.
:::

## Windup, and when to leave the integrator out

An integrator keeps adding up error even when the actuator cannot deliver what it asks for. Suppose the wheel **saturates** — hits its limit — at $8\,\mathrm{N\,m}$, while the command is $30\,\mathrm{N\,m}$. For as long as the error lasts, $\mathbf{x}_i$ keeps growing. When the error finally reverses, all that stored-up tally has to be unwound before the loop can respond, and the result is a long, ugly overshoot. This is called **[[integrator windup|windup-word]]**. The two standard defenses work unchanged here:

- **Clamping**: stop integrating whenever the command is saturated and the error would push it further into saturation.
- **Back-calculation**: drive the integrator with $\mathbf{r} - \mathbf{y} + \mathbf{K}_{aw}(\mathbf{u}_{sat} - \mathbf{u}_{cmd})$. Here $\mathbf{u}_{cmd}$ is what the controller asked for, $\mathbf{u}_{sat}$ is what the actuator actually delivered, and $\mathbf{K}_{aw}$ ("anti-windup gain") sets how hard the tally is pulled back toward matching reality.

::: warning Integral action is not always wanted
A launch vehicle flying through a [[wind shear|wind-shear]] at maximum dynamic pressure is the standard counterexample. An attitude integrator sees the wind-caused attitude error as something to wipe out. So it commands a sustained gimbal deflection to hold the vehicle on its planned inertial attitude. That forces the vehicle to fly at an angle of attack equal to the full wind angle — which makes the $\bar q \alpha$ load (dynamic pressure times angle of attack) as large as possible.

The load-relief design in the first lesson of this module does the opposite. It lets the vehicle turn into the wind, accepting an attitude error in exchange for a smaller bending moment. So real launch vehicles scale their integral term down toward zero through the high-$\bar q$ region and bring it back afterwards. The general rule: an integrator insists that the output must equal the reference in steady state, and there are flight phases where that insistence is exactly wrong.
:::

## Check yourself

::: check
Derive $\theta_{ss} = d/k_1$ for the reaction-wheel axis and explain why $k_2$ does not appear.
:::

::: answer
At rest, both $\dot\theta$ and $\dot\omega$ are zero.

The first row of $\dot{\mathbf{x}} = (\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x} + \mathbf{B}d$ reads $\dot\theta = \omega$, so $\omega_{ss} = 0$.

The second row reads $\dot\omega = (-k_1\theta - k_2\omega + d)/J$. Setting it to zero with $\omega_{ss} = 0$ gives $k_1\theta_{ss} = d$, so $\theta_{ss} = d/k_1$.

The rate gain is missing because at rest there is no rate for it to act on. A rate feedback term can shape the transient, but it can never supply a steady trim torque. The same reasoning tells you exactly which feedback paths can cancel a constant disturbance: only those acting on states that are nonzero in the new resting position.
:::

::: check
The integral pole came out at $-1/T_i$ for every $T_i$ in the table. Why should the weight $Q_i = 1/(y_{\max}T_i)^2$ produce that?
:::

::: answer
The integral loop is slow compared with the attitude loop. So near the integral pole, the fast states have already caught up to wherever the slow state is leading them, and the system behaves like a first-order problem in $x_i$ alone.

In that reduced problem, $\dot x_i = -\theta$: the attitude acts like the "control" for the slow loop, and it is charged $Q_{11}\theta^2$ with $Q_{11} = 1/y_{\max}^2$. A first-order LQR problem $\dot x = v$ with cost $q x^2 + r v^2$ has its pole at $-\sqrt{q/r}$. Here $q = Q_i$ and $r = Q_{11}$, so

$$
\frac{Q_i}{Q_{11}} = \frac{1/(y_{\max}T_i)^2}{1/y_{\max}^2} = \frac{1}{T_i^2},
$$

and the pole is at $-\sqrt{1/T_i^2} = -1/T_i$.

The practical point: you choose the recovery time directly, in seconds, and the weight follows. If the integral pole comes out far from $-1/T_i$, the timescale separation has broken down. That usually means the integral action is being asked to be as fast as the attitude loop, and the design should be rethought rather than retuned.
:::

::: check
Why does adding an integrator preserve the LQR margins while adding an observer destroys them, when both add states to the controller?
:::

::: answer
Because the integrator state is exact and the estimator state is not.

More formally: the augmented problem $(\mathbf{A}_a, \mathbf{B}_a, \mathbf{Q}_a, \mathbf{R})$ is an ordinary LQR problem, and its optimal gain satisfies the Riccati equation for that plant. The return-difference identity comes from the Riccati equation for whatever plant appears in the loop transfer function. Here the loop at the plant input is $\mathbf{K}_a(s\mathbf{I}-\mathbf{A}_a)^{-1}\mathbf{B}_a$, built from those same matrices, so the identity holds and $|1+L| \ge 1$ — confirmed numerically at $1.000000$ for every design in the table.

In the LQG case the loop contains $(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}_f\mathbf{C})^{-1}\mathbf{L}_f\mathbf{C}$ (with $\mathbf{L}_f$ the filter gain), which satisfies no Riccati equation for the plant being controlled. The difference is not "extra states". It is "extra states that depend on the measurement" versus "extra states that depend only on quantities you compute yourself".
:::

::: check
A colleague adds integral action to a working controller by keeping the existing gains and turning $k_i$ up until the disturbance recovery looks fast enough. What should you check before this flies?
:::

::: answer
The margins at the plant input, for the augmented loop — not the step response, which will look excellent right up to the point of failure. The hand-tuning table in this lesson shows a design at six times the optimal integral gain whose poles are all stable and whose disturbance rejection is faster than the LQR design's, yet whose phase margin is $3.5^\circ$ and which tolerates only a $4\,\%$ drop in actuator strength.

Concretely:

- compute $\min_\omega|1 + L(j\omega)|$ and require it above about $0.5$;
- sweep a real input-gain change and a time delay across the flight envelope;
- check whether the angle and rate gains were raised alongside $k_i$, because they need to be;
- check windup against the actuator limit, since integral action and saturation interact badly and the nominal simulation may never saturate.
:::

::: check
Write the augmented matrices for a plant with two outputs to be tracked and three inputs, and say how many states the controller has.
:::

::: answer
Let $\mathbf{x} \in \mathbb{R}^n$ (read "$\mathbf{x}$ is a list of $n$ real numbers"), $\mathbf{u} \in \mathbb{R}^3$ and $\mathbf{y} = \mathbf{C}\mathbf{x} \in \mathbb{R}^2$. The integral state is $\mathbf{x}_i \in \mathbb{R}^2$, one integrator per tracked output. Then:

- $\mathbf{A}_a = \begin{bmatrix}\mathbf{A} & \mathbf{0}_{n\times2}\\ -\mathbf{C} & \mathbf{0}_{2\times2}\end{bmatrix}$ is $(n+2)\times(n+2)$;
- $\mathbf{B}_a = \begin{bmatrix}\mathbf{B}\\ \mathbf{0}_{2\times3}\end{bmatrix}$ is $(n+2)\times3$;
- the reference enters through $\begin{bmatrix}\mathbf{0}_{n\times2}\\ \mathbf{I}_2\end{bmatrix}$;
- $\mathbf{K}_a$ is $3\times(n+2)$, split as $[\mathbf{K}_x\ \ \mathbf{K}_i]$ with $\mathbf{K}_i$ of size $3\times2$.

The controller itself carries two states, the two integrators. The other $n$ belong to the plant and are assumed measured.

Controllability of the augmented pair needs $\begin{bmatrix}\mathbf{A} & \mathbf{B}\\ \mathbf{C} & \mathbf{0}\end{bmatrix}$ to have full row rank $n+2$, which needs at least as many inputs as tracked outputs. Three inputs for two outputs is comfortable, and the extra input direction is free for the state-regulation part of the job.
:::

## Summary

| Object | Statement |
| --- | --- |
| Regulator error | $\mathbf{x}_{ss} = -(\mathbf{A}-\mathbf{B}\mathbf{K})^{-1}\mathbf{B}_d d$; for the wheel axis $\theta_{ss} = d/k_1$ |
| Augmented state | $\dot{\mathbf{x}}_i = \mathbf{r} - \mathbf{y} = \mathbf{r} - \mathbf{C}\mathbf{x}$ |
| Augmented plant | $\mathbf{A}_a = \begin{bmatrix}\mathbf{A} & \mathbf{0}\\ -\mathbf{C} & \mathbf{0}\end{bmatrix}$, $\mathbf{B}_a = \begin{bmatrix}\mathbf{B}\\ \mathbf{0}\end{bmatrix}$; $\mathbf{u} = -\mathbf{K}_x\mathbf{x} - \mathbf{K}_i\mathbf{x}_i$ |
| Zero-error argument | Stable loop $\Rightarrow$ $\dot{\mathbf{x}}_i \to \mathbf{0}$ $\Rightarrow$ $\mathbf{y} \to \mathbf{r}$, whatever the model error |
| Controllability | $(\mathbf{A},\mathbf{B})$ controllable and $\begin{bmatrix}\mathbf{A}&\mathbf{B}\\ \mathbf{C}&\mathbf{0}\end{bmatrix}$ nonsingular: no plant zero at the origin |
| Integral weight | $Q_i = 1/(y_{\max}T_i)^2$; the integral pole lands at $-1/T_i$ |
| Trim | $x_i(\infty) = d/k_i$, the value that makes the feedback supply the trim command |
| Margins | Kept: the augmented problem is an LQR problem, so $\lvert1+L\rvert \ge 1$ still holds |
| Hand-tuned $k_i$ | $6\times$ the optimal value gave a $3.5^\circ$ phase margin with an unremarkable step response |
| Windup | Clamp when saturated, or back-calculate from $\mathbf{u}_{sat} - \mathbf{u}_{cmd}$ |
| When to leave it out | High-$\bar q$ load relief: integral attitude action maximizes $\bar q\alpha$ instead of reducing it |
| Worked numbers | $d = 0.25\,\mathrm{N\,m}$: $0.156^\circ$ permanent error without; $0.107^\circ$ peak and zero steady error with $T_i = 5\,\mathrm{s}$ |

The next lesson goes to the far end of the weighting range and asks what happens when control is made almost free. The answer exposes a hard limit that no amount of actuator authority can buy past.

::: context steady-torques Where steady torques come from in orbit
A spacecraft is not quite a rigid ball in empty space. Gravity pulls slightly harder on the end nearer Earth, so a long spacecraft feels a gentle twist that tries to line it up with the vertical — the **gravity-gradient torque**. In low orbit there is still a trace of atmosphere, and if the center of drag is not over the center of mass, the drag twists the vehicle too. Sunlight pushes as well. On a small satellite these torques are tiny, often well under a thousandth of a newton-meter, but they act for hours on end, and a controller that tolerates a small error per unit of torque ends up with a steady offset. Integral action is what removes it.
:::

::: context thrust-offset Why an engine pushes off-axis
An engine's thrust line never passes exactly through the vehicle's center of mass. Manufacturing tolerances tilt the nozzle a little, and the center of mass moves as propellant drains. A thrust of a few hundred newtons acting ten centimeters off the center of mass makes a torque of tens of newton-meters. So even a small misalignment turns a propulsive burn into a steady twisting disturbance that the attitude control must hold against for the whole burn.
:::

::: context running-area The integral as a running area
Plot the error against time. The integral state at any moment is the area between that curve and the zero line so far. While the error is positive, the area keeps growing. When the error reaches zero, the area stops changing — but it does not go back to zero. It holds whatever value it reached, and that held value is exactly the steady push needed to cancel the disturbance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <path d="M40,130 L40.0,40.0 L52.0,56.3 L64.0,69.7 L76.0,80.6 L88.0,89.6 L100.0,96.9 L112.0,102.9 L124.0,107.8 L136.0,111.8 L148.0,115.1 L160.0,117.8 L172.0,120.0 L184.0,121.8 L196.0,123.3 L208.0,124.5 L220.0,125.5 L232.0,126.3 L244.0,127.0 L256.0,127.5 L268.0,128.0 L280.0,128.4 L292.0,128.7 L304.0,128.9 L316.0,129.1 L328.0,129.3 L340.0,129.4 L340,130 Z" fill="#f2b880" opacity="0.6"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,40.0 52.0,56.3 64.0,69.7 76.0,80.6 88.0,89.6 100.0,96.9 112.0,102.9 124.0,107.8 136.0,111.8 148.0,115.1 160.0,117.8 172.0,120.0 184.0,121.8 196.0,123.3 208.0,124.5 220.0,125.5 232.0,126.3 244.0,127.0 256.0,127.5 268.0,128.0 280.0,128.4 292.0,128.7 304.0,128.9 316.0,129.1 328.0,129.3 340.0,129.4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,130.0 52.0,113.7 64.0,100.3 76.0,89.4 88.0,80.4 100.0,73.1 112.0,67.1 124.0,62.2 136.0,58.2 148.0,54.9 160.0,52.2 172.0,50.0 184.0,48.2 196.0,46.7 208.0,45.5 220.0,44.5 232.0,43.7 244.0,43.0 256.0,42.5 268.0,42.0 280.0,41.6 292.0,41.3 304.0,41.1 316.0,40.9 328.0,40.7 340.0,40.6"/>
  <line x1="40" y1="130" x2="345" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="118" font-size="11" fill="#b4232c">error</text>
  <text x="200" y="36" font-size="11" fill="#1d6fd1">running area (the integral)</text>
  <text x="340" y="148" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
</svg>
```

Here the error decays as $e^{-t}$ (red) and its running area $1 - e^{-t}$ (blue) climbs to a plateau of $1$ instead of returning to zero.
:::

::: context zero-at-origin What "a zero at the origin" means
A plant has a zero at the origin when a constant input produces no constant output. Its transfer function has a factor $s$ on top, so at zero frequency — a steady signal — it gives out nothing. A **washout filter**, $s/(s+1)$, is the classic example: push on it steadily and its output fades to zero. No integrator wrapped around such a plant can hold its output at a nonzero value, because no steady input exists that would do it. The determinant test in the lesson is the state-space way of catching this before you try.
:::

::: context slow-under-fast A slow loop under a fast one
Think of adjusting a shower. Your hand jerks the tap quickly to fix big temperature swings. Meanwhile, over a minute or so, you slowly settle on the tap position that feels right. The fast correction and the slow correction work on different timescales and do not fight. Here the attitude loop acts in about a second and a half (poles near $-0.6$), while the integral loop acts over $T_i$ seconds. Keeping them several times apart is what lets the slow one learn the disturbance without shaking the fast one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="296.7" y1="25" x2="296.7" y2="195" stroke="#6c7a93" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="96.7" y="126">−0.6</text><text x="163.3" y="126">−0.4</text><text x="230" y="126">−0.2</text><text x="306" y="126">0</text>
    <text x="316" y="64">0.5j</text><text x="318" y="164">−0.5j</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1"><line x1="96.7" y1="106" x2="96.7" y2="114"/><line x1="163.3" y1="106" x2="163.3" y2="114"/><line x1="230" y1="106" x2="230" y2="114"/><line x1="292.7" y1="60" x2="300.7" y2="60"/><line x1="292.7" y1="160" x2="300.7" y2="160"/></g>
  <g stroke="#b4232c" stroke-width="2">
    <path d="M132,106 l8,8 M140,106 l-8,8"/><path d="M226,106 l8,8 M234,106 l-8,8"/><path d="M259.3,106 l8,8 M267.3,106 l-8,8"/><path d="M276,106 l8,8 M284,106 l-8,8"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <path d="M96,39.3 l8,8 M104,39.3 l-8,8"/><path d="M87,44.1 l8,8 M95,44.1 l-8,8"/><path d="M85,44.7 l8,8 M93,44.7 l-8,8"/><path d="M84.3,44.9 l8,8 M92.3,44.9 l-8,8"/>
    <path d="M96,172.7 l8,8 M104,172.7 l-8,8"/><path d="M87,167.9 l8,8 M95,167.9 l-8,8"/><path d="M85,167.3 l8,8 M93,167.3 l-8,8"/><path d="M84.3,167.1 l8,8 M92.3,167.1 l-8,8"/>
  </g>
  <text x="136" y="100" font-size="11" text-anchor="middle" fill="#b4232c">Ti = 2</text>
  <text x="230" y="100" font-size="11" text-anchor="middle" fill="#b4232c">5</text>
  <text x="264" y="100" font-size="11" text-anchor="middle" fill="#b4232c">10</text>
  <text x="280" y="140" font-size="11" text-anchor="middle" fill="#b4232c">20</text>
  <text x="112" y="30" font-size="11" fill="#1d6fd1">attitude pair: barely moves</text>
  <text x="170" y="185" font-size="11" fill="#b4232c">red: integral pole at −1/Ti</text>
</svg>
```

The red crosses are the integral poles for $T_i = 2, 5, 10, 20\,\mathrm{s}$; the blue crosses are the attitude pair for the same four designs, nearly on top of each other.
:::

::: context margin-bars How close to the edge each design sits
The distance from the Nyquist curve to the $-1$ point, $\min_\omega|1+L|$, is a one-number summary of robustness. LQR guarantees at least $1$. The hand-tuned designs fall below it, and the six-times design is almost touching $-1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="20" x2="60" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="40" x2="340" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="54" y="44" font-size="11" text-anchor="end" fill="#1f2a44">1.0</text>
  <text x="54" y="94" font-size="11" text-anchor="end" fill="#1f2a44">0.5</text>
  <text x="54" y="144" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <rect x="85" y="40" width="50" height="100" fill="#1d6fd1"/>
  <rect x="175" y="71.8" width="50" height="68.2" fill="#f2b880"/>
  <rect x="265" y="136.6" width="50" height="3.4" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="110" y="34">1.000</text><text x="200" y="66">0.682</text><text x="290" y="130">0.034</text>
    <text x="110" y="158">LQR</text><text x="200" y="158">3× ki</text><text x="290" y="158">6× ki</text>
  </g>
  <text x="336" y="34" font-size="11" text-anchor="end" fill="#6c7a93">LQR guarantee</text>
</svg>
```
:::

::: context windup-word Why it is called windup
Think of winding a toy car's spring while holding its wheels. The longer you wind, the more energy is stored, and when you let go the car shoots off much farther than you wanted. A saturated integrator does the same: it keeps "winding up" its tally while the actuator is stuck at its limit, then releases it all when the error flips sign. The name comes from that picture, and the fixes — clamping and back-calculation — amount to not winding the spring while the wheels are held.
:::

::: context wind-shear Why winds matter so much at max-Q
A wind shear is a sudden change of wind speed or direction with altitude. Near maximum dynamic pressure, a crosswind of a few tens of meters per second tilts the oncoming air by a few degrees relative to a vehicle moving at several hundred meters per second. Since the sideways air load is dynamic pressure times angle of attack, that tilt can use up a large part of the structure's margin. That is why launch teams measure the upper-level winds with weather balloons on launch day and can hold a launch when the winds aloft are too strong.
:::
