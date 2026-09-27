---
id: l01-quadratic-cost-functional
title: The linear quadratic cost functional
minutes: 21
covers:
  - The linear quadratic cost functional and what Q, R and the cross term weight
---

Think about keeping a car in the middle of its lane. Two things bother you. Drifting off-center is bad, and the farther you drift, the worse it is. But yanking the steering wheel is bad too — it scares the passengers and wears the tires. A good driver balances the two without thinking about it. A **linear quadratic regulator**, or **LQR**, is that balance written down as arithmetic: you put a price on being off-target, a price on using the controls, and let mathematics find the steering rule with the lowest total bill.

Why not keep using the tool from the state-space module? **[[Pole placement|pole-placement]]** asks you to name the closed-loop poles — the numbers that set how fast and how smoothly the system settles. On one axis with two states that is fine: pick a speed and a damping and you are done. On a launch vehicle with six states and three gimbal commands, it breaks down. There are more gains than numbers you have any feel for, and nothing in the method tells you whether the answer is affordable in actuator effort.

LQR swaps "name the poles" for "name what you care about, and how much". The poles come out the other end, as a result of the trade you declared. Because the trade is stated in engineering units — degrees of pointing error, newton-metres of wheel torque — you can defend it in a design review and change it when a requirement moves.

This lesson does none of the optimizing. It builds the thing being optimized: the **[[cost functional|functional]]**, the matrices $\mathbf{Q}$, $\mathbf{R}$ and $\mathbf{N}$, what each one prices, what rules they must obey, and what a sentence like "the cost of this trajectory is 57" means with units attached. Everything after this lesson is machinery for making that number as small as possible.

## The regulator problem

Start with the linear, time-invariant plant from the state-space module:

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}, \qquad \mathbf{x} \in \mathbb{R}^n, \quad \mathbf{u} \in \mathbb{R}^m .
$$

Read $\dot{\mathbf{x}}$ as "x dot", the rate of change of the state. Here $\mathbf{x}$ is the **deviation** — how far the vehicle is from the condition you want to hold — and $\mathbf{u}$ is how far the actuator command is from its trim value (the steady setting that holds the vehicle there with no error). There are $n$ states and $m$ inputs.

A **regulator** is a controller whose job is to drive $\mathbf{x}$ to zero and keep it there. The linear quadratic regulator is the one that does it at least cost, where the cost is

$$
J = \int_0^{\infty}\Big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\Big)\,dt .
$$

Read $\mathbf{x}^\top\mathbf{Q}\mathbf{x}$ as "x transpose Q x". It is one number: a weighted sum of squares of the states. With a diagonal $\mathbf{Q}$ it is $Q_{11}x_1^2 + Q_{22}x_2^2 + \dots$, so each $Q_{ii}$ is the price per unit-squared of error in state $i$. Likewise $\mathbf{u}^\top\mathbf{R}\mathbf{u}$ prices control effort. The integral adds the bill up over all time, like a taxi meter that ticks faster the farther you are from home and the harder you press the pedal.

$\mathbf{Q}$ is an $n\times n$ symmetric matrix that is **[[positive semidefinite|psd]]**, written $\mathbf{Q} \succeq 0$: its quadratic form is never negative. $\mathbf{R}$ is $m\times m$, symmetric and **positive definite**, $\mathbf{R} \succ 0$: its quadratic form is strictly positive for every nonzero $\mathbf{u}$.

When the job has an end time $t_f$ ("t sub f", the final time), the integral stops there and a **terminal penalty** is added for wherever the state ends up:

$$
J = \mathbf{x}(t_f)^\top\mathbf{Q}_f\,\mathbf{x}(t_f) + \int_0^{t_f}\Big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\Big)\,dt, \qquad \mathbf{Q}_f \succeq 0 .
$$

::: key The LQR cost functional
$J = \int_0^\infty (\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u})\,dt$, with $\mathbf{Q}$ positive semidefinite and $\mathbf{R}$ positive definite. The finite horizon adds a terminal term $\mathbf{x}(t_f)^\top\mathbf{Q}_f\mathbf{x}(t_f)$ and truncates the integral at $t_f$.
:::

### Why the sign rules matter

The rules on $\mathbf{Q}$ and $\mathbf{R}$ are not decoration.

$\mathbf{R} \succ 0$ means every direction of control costs something. If some direction of $\mathbf{u}$ were free, the optimizer would use an unlimited amount of it, and there would be no minimum. That is called the **singular** case, and it is a genuinely different problem.

$\mathbf{Q}$ only needs to be semidefinite, because it is fine to care about some states and not others. A reaction-wheel speed you do not want driven to zero can carry zero weight. What you may not do is leave a state both unweighted and unstable. If an unstable mode is invisible to $\mathbf{Q}$, the optimizer sees no reason to control it and lets it run away at zero cost. The exact condition is that the pair $(\mathbf{A}, \mathbf{Q}^{1/2})$ be **[[detectable|detectable]]** — the detectability from the state-space module, applied to the made-up output $\mathbf{Q}^{1/2}\mathbf{x}$ (read "Q to the one-half", a matrix square root of $\mathbf{Q}$). Together with **stabilizability** of $(\mathbf{A}, \mathbf{B})$ — every unstable mode can be pushed on by the actuators — this is exactly what gives the infinite-horizon problem a unique answer that stabilizes the vehicle.

### Why squares?

Why not the integral of $|\mathbf{x}|$, say? Three reasons, from most to least honest. First, a quadratic cost on a linear system gives a linear feedback law with a closed-form solution; that is the real reason. Second, a square punishes a big miss far more than a small one, which matches how requirements are written: a pointing error twice the budget is much more than twice as bad. Third, a quadratic is the natural cost when disturbances are Gaussian (bell-curve shaped), which is why the noisy version of the problem later in this module comes out the same shape.

## The cost of a trajectory, in seconds

Suppose someone hands you a feedback law $\mathbf{u} = -\mathbf{K}\mathbf{x}$ that stabilizes the vehicle. How big is its bill, starting from some state $\mathbf{x}_0$? You might expect to simulate the whole response and add up the integral. You do not have to.

Close the loop: $\dot{\mathbf{x}} = \mathbf{A}_{cl}\mathbf{x}$ with $\mathbf{A}_{cl} = \mathbf{A} - \mathbf{B}\mathbf{K}$ ("A sub c-l", the closed-loop matrix). Since $\mathbf{u} = -\mathbf{K}\mathbf{x}$, the control cost is $\mathbf{x}^\top\mathbf{K}^\top\mathbf{R}\mathbf{K}\mathbf{x}$, so the whole running cost is one quadratic form $\mathbf{x}^\top\mathbf{W}\mathbf{x}$ with $\mathbf{W} = \mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K}$. Now find the matrix $\mathbf{P}$ that solves the **[[Lyapunov equation|lyapunov]]**

$$
\mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl} + \mathbf{W} = \mathbf{0}.
$$

Then the whole infinite integral collapses to one line:

$$
J(\mathbf{x}_0) = \int_0^\infty \mathbf{x}^\top\mathbf{W}\mathbf{x}\,dt = \mathbf{x}_0^\top\mathbf{P}\mathbf{x}_0 .
$$

Here is the picture. Think of $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ as a fuel gauge showing how much cost is still to come. The Lyapunov equation is chosen so the gauge drops at exactly the rate the meter is charging you. When the vehicle has settled, the gauge reads zero. So the starting reading was the whole bill.

::: note Why it has to be true
Differentiate the gauge along the closed-loop motion. Using $\dot{\mathbf{x}} = \mathbf{A}_{cl}\mathbf{x}$ and the product rule,

$$
\frac{d}{dt}\big(\mathbf{x}^\top\mathbf{P}\mathbf{x}\big) = \dot{\mathbf{x}}^\top\mathbf{P}\mathbf{x} + \mathbf{x}^\top\mathbf{P}\dot{\mathbf{x}} = \mathbf{x}^\top\big(\mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl}\big)\mathbf{x} = -\,\mathbf{x}^\top\mathbf{W}\mathbf{x},
$$

where the last step used the Lyapunov equation. Integrate both sides from $0$ to $\infty$. Because $\mathbf{A}_{cl}$ is stable, $\mathbf{x}(\infty) = \mathbf{0}$, so the left side becomes $0 - \mathbf{x}_0^\top\mathbf{P}\mathbf{x}_0$. The right side is $-J$. Cancel the minus signs and $J = \mathbf{x}_0^\top\mathbf{P}\mathbf{x}_0$.
:::

Keep this identity. The whole module lives inside it: the *best* $\mathbf{P}$ turns out to satisfy a Riccati equation instead of a Lyapunov equation, and $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ is then the optimal **cost-to-go** — the cheapest possible bill from here on.

Units follow the weights. Suppose you scale each state and input by its budget: $Q_{ii} = 1/x_{i,\max}^2$ and $R_{jj} = 1/u_{j,\max}^2$. Then every term inside the integral has no units, and equals one when that signal sits exactly at its limit. The integral of a unitless number over time has units of **seconds**. So the cost reads as "the number of seconds the vehicle would have to spend pinned at its limits to run up this much penalty". That is a number an engineer can argue about.

::: example What the integral adds up for a reaction-wheel axis
One axis of a spacecraft steered by a **[[reaction wheel|reaction-wheel]]**. Inertia $J = 120\,\mathrm{kg\,m^2}$ (this $J$ is the moment of inertia, not the cost — the context tells them apart). The state is $\mathbf{x} = (\theta, \omega)$, pointing angle and turn rate, and the control $u$ is the wheel torque. Torque divided by inertia is angular acceleration, so

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ 0 & 0\end{bmatrix}, \qquad
\mathbf{B} = \begin{bmatrix} 0 \\ 1/J \end{bmatrix} = \begin{bmatrix} 0 \\ 8.333\times10^{-3}\end{bmatrix}.
$$

The requirements: hold pointing to $0.5^\circ$, rate to $2^\circ/\mathrm{s}$, torque to $8\,\mathrm{N\,m}$. Convert to radians ($0.5^\circ = 8.727\times10^{-3}$ rad, $2^\circ = 3.491\times10^{-2}$ rad) and weight by one over the square:

$$
\mathbf{Q} = \mathrm{diag}\big(1.3131\times10^{4},\ 8.207\times10^{2}\big),\qquad
\mathbf{R} = \big[1.5625\times10^{-2}\big] .
$$

For example $1/(8.727\times10^{-3})^2 = 1.3131\times10^4\,\mathrm{rad^{-2}}$, and $1/8^2 = 1/64 = 0.015625\,\mathrm{(N\,m)^{-2}}$.

Start from a $5^\circ$ offset, $\mathbf{x}_0 = (0.08727\,\mathrm{rad},\ 0)$. Compare three feedbacks by solving the Lyapunov equation for each.

| Feedback | $\mathbf{K}$ (N m/rad, N m s/rad) | Closed-loop poles (1/s) | $J$ (s) | state part | control part | peak $|u|$ (N m) | 2 % settling (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hand-placed, $\omega_n = 0.424$, $\zeta = 0.707$ | $(21.6,\ 72.0)$ | $-0.300 \pm 0.300j$ | $251.0$ | $250.9$ | $0.046$ | $1.89$ | $14.05$ |
| LQR optimum | $(916.7,\ 522.1)$ | $-2.175 \pm 1.705j$ | $56.95$ | $45.45$ | $11.49$ | $80.0$ | $1.32$ |
| Twice the LQR gain | $(1833,\ 1044)$ | $-2.441,\ -6.260$ | $62.69$ | $39.71$ | $22.99$ | $160.0$ | $1.80$ |

Read the rows one at a time.

- **The gentle hand-placed design** spends almost nothing on torque — $0.046$ out of $251$, about $0.018\,\%$ of its bill. It pays $251\,\mathrm{s}$ anyway, because it sits off-target for fourteen seconds.
- **The optimum** splits its bill about $80/20$ between pointing error and torque ($45.45/56.95 = 0.80$) and totals $56.95\,\mathrm{s}$. That is $251/56.95 = 4.4$ times better.
- **Doubling the optimal gain** makes the pointing part *smaller* ($39.7$ against $45.5$) but the total *larger*. That is what a minimum looks like from the far side: you can always buy more speed, but past the optimum the torque bill grows faster than the pointing bill shrinks.

Sanity check: the optimum really is the lowest of the three totals, $56.95 < 62.69 < 251.0$, as it must be.

Now look at the peak torque. At $t = 0$ the rate is zero, so $|u(0)| = k_1\theta_0 = 916.7 \times 0.08727 = 80.0\,\mathrm{N\,m}$. That is ten times the $8\,\mathrm{N\,m}$ budget — because the starting offset, $5^\circ$, is ten times the $0.5^\circ$ pointing budget. Weights scaled to steady-state budgets say nothing about the transient from a big upset. This is where most first LQR designs **[[saturate|saturation]]**.
:::

::: warning Only the ratio of Q to R matters
Replace $(\mathbf{Q}, \mathbf{R})$ by $(\alpha\mathbf{Q}, \alpha\mathbf{R})$ for any $\alpha > 0$. Every possible trajectory's cost gets multiplied by the same $\alpha$, so the ranking of trajectories does not change and the best gain is identical. In the example above, scaling both by $17$ returns $\mathbf{K} = (916.7,\ 522.1)$ to every digit. In matrix terms, $\mathbf{P}$ scales by $\alpha$ and $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ does not change. So "increase $\mathbf{Q}$" and "decrease $\mathbf{R}$" are the same move. Fix one — most people set $\mathbf{R} = \mathbf{I}$ or $\mathbf{R} = \mathrm{diag}(1/u_{j,\max}^2)$ — and tune only the other, or you will spend an afternoon chasing a knob that does nothing.
:::

::: key What actually matters in Q and R
Only the ratio. Scaling $\mathbf{Q}$ and $\mathbf{R}$ by the same positive constant leaves $\mathbf{K}$ unchanged, since $\mathbf{P}$ scales identically. Fix $\mathbf{R} = \mathbf{I}$ and tune $\mathbf{Q}$, or the other way round.
:::

## The cross term, and where it comes from

The most general quadratic cost has one more matrix, $\mathbf{N}$:

$$
J = \int_0^\infty \begin{bmatrix}\mathbf{x} \\ \mathbf{u}\end{bmatrix}^\top
\begin{bmatrix}\mathbf{Q} & \mathbf{N} \\ \mathbf{N}^\top & \mathbf{R}\end{bmatrix}
\begin{bmatrix}\mathbf{x} \\ \mathbf{u}\end{bmatrix} dt
= \int_0^\infty\Big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + 2\,\mathbf{x}^\top\mathbf{N}\mathbf{u} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\Big)dt .
$$

The $n \times m$ matrix $\mathbf{N}$ is the **cross term**: it prices *products* of a state and an input. For the cost to be a sensible penalty, the whole block matrix must be positive semidefinite. That works out to $\mathbf{R} \succ 0$ together with $\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top \succeq 0$ (this combination is called a **Schur complement**; you will see below where it comes from).

Nobody adds a cross term for fun. It appears the moment you penalize a **performance output** instead of the states themselves. Suppose what you really care about is $\mathbf{z} = \mathbf{C}_z\mathbf{x} + \mathbf{D}_z\mathbf{u}$ — a structural load, a sideways acceleration, a line-of-sight rate — and the cost is $J = \int \mathbf{z}^\top\mathbf{z}\,dt$. Multiply out the square:

$$
\mathbf{z}^\top\mathbf{z} = \mathbf{x}^\top\mathbf{C}_z^\top\mathbf{C}_z\mathbf{x} + 2\,\mathbf{x}^\top\mathbf{C}_z^\top\mathbf{D}_z\mathbf{u} + \mathbf{u}^\top\mathbf{D}_z^\top\mathbf{D}_z\mathbf{u}.
$$

Match the pieces: $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$, $\mathbf{N} = \mathbf{C}_z^\top\mathbf{D}_z$ and $\mathbf{R} = \mathbf{D}_z^\top\mathbf{D}_z$. A **direct feedthrough** $\mathbf{D}_z \neq \mathbf{0}$ — the actuator changing the thing you care about instantly — is exactly a cross term.

### Removing the cross term

The cross term can always be moved out of the way. The trick is the same "complete the square" you used on $x^2 + 2bx$ in algebra. Write the control as a new variable $\mathbf{v}$ plus a fixed piece of state feedback:

$$
\mathbf{u} = \mathbf{v} - \mathbf{R}^{-1}\mathbf{N}^\top\mathbf{x}.
$$

Put that into the running cost and expand. The cross term cancels, and what is left is

$$
\mathbf{x}^\top\mathbf{Q}\mathbf{x} + 2\mathbf{x}^\top\mathbf{N}\mathbf{u} + \mathbf{u}^\top\mathbf{R}\mathbf{u}
= \mathbf{x}^\top\big(\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top\big)\mathbf{x} + \mathbf{v}^\top\mathbf{R}\mathbf{v}.
$$

Put the same $\mathbf{u}$ into the dynamics and you get $\dot{\mathbf{x}} = \bar{\mathbf{A}}\mathbf{x} + \mathbf{B}\mathbf{v}$, where (read $\bar{\mathbf{A}}$ as "A bar")

$$
\bar{\mathbf{A}} = \mathbf{A} - \mathbf{B}\mathbf{R}^{-1}\mathbf{N}^\top, \qquad \bar{\mathbf{Q}} = \mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top .
$$

So a problem with a cross term is a plain problem on a shifted plant. Solve the plain one for its gain $\bar{\mathbf{K}}$, then add the fixed piece back to get the gain for the original problem:

$$
\mathbf{K} = \bar{\mathbf{K}} + \mathbf{R}^{-1}\mathbf{N}^\top .
$$

::: note Why the expansion works
Expand the right-hand side with $\mathbf{v} = \mathbf{u} + \mathbf{R}^{-1}\mathbf{N}^\top\mathbf{x}$. Using $\mathbf{R}^\top = \mathbf{R}$:

$$
\mathbf{v}^\top\mathbf{R}\mathbf{v} = \mathbf{u}^\top\mathbf{R}\mathbf{u} + 2\,\mathbf{x}^\top\mathbf{N}\mathbf{u} + \mathbf{x}^\top\mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top\mathbf{x}.
$$

Add $\mathbf{x}^\top(\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top)\mathbf{x}$ and the last term cancels, leaving the left-hand side. The same identity shows why $\bar{\mathbf{Q}} \succeq 0$ is the right condition: set $\mathbf{v} = \mathbf{0}$ and the cost is $\mathbf{x}^\top\bar{\mathbf{Q}}\mathbf{x}$, which must not go negative.
:::

Standard solvers — MATLAB's `lqr`, SciPy's `solve_continuous_are` through its `s` argument — accept an $\mathbf{N}$ and do this substitution inside. It is worth knowing it happens, because $\bar{\mathbf{Q}}$ can be much weaker than $\mathbf{Q}$, and in one important case it vanishes.

::: example Load relief on a launch vehicle at maximum dynamic pressure
Pitch plane, near **[[max-Q|max-q]]**. The state is $\mathbf{x} = (\alpha, q)$: $\alpha$ ("alpha") is the angle of attack, the angle between the rocket's nose and the oncoming air, and $q$ is the pitch rate. The control $\delta$ ("delta") is the engine gimbal angle. The vehicle has mass $3.2\times10^{5}\,\mathrm{kg}$, speed $V = 450\,\mathrm{m/s}$, dynamic pressure $\bar q = 33\,\mathrm{kPa}$, reference area $S = 10.5\,\mathrm{m^2}$, normal-force slope $C_{N\alpha} = 2.6\,\mathrm{rad^{-1}}$ and pitch inertia $2.6\times10^{7}\,\mathrm{kg\,m^2}$. The sideways air force per radian of $\alpha$ is $N_\alpha = \bar q S C_{N\alpha} = 33{,}000 \times 10.5 \times 2.6 = 9.01\times10^{5}\,\mathrm{N/rad}$, and the model is

$$
\mathbf{A} = \begin{bmatrix}-0.00626 & 1 \\ 0.4851 & 0\end{bmatrix},\qquad
\mathbf{B} = \begin{bmatrix}0 \\ -6.723\end{bmatrix},
$$

with $\mathbf{A}$ in $\mathrm{s^{-1}}$ (top row) and $\mathrm{s^{-2}}$ (bottom row), and $\mathbf{B}$ in $\mathrm{s^{-2}}$. The open-loop poles are $-0.700$ and $+0.693\,\mathrm{s^{-1}}$. The positive one means the rocket is **aerodynamically unstable**: left alone, a small nose-off-wind angle grows. Every launcher whose center of pressure sits ahead of its center of mass is like this.

What the structures team cares about is the **bending moment** at the interstage — how hard the rocket is being flexed there. Two forces make it: the air's sideways push acting $11\,\mathrm{m}$ from that station, and the gimballed thrust ($7.6\times10^{6}\,\mathrm{N}$) acting $12\,\mathrm{m}$ from it, in the opposite sense. Dividing by the airframe's capability $M_{\lim} = 1.0\times10^{7}\,\mathrm{N\,m}$:

$$
z = \frac{M_b}{M_{\lim}} = 0.9910\,\alpha - 9.120\,\delta, \qquad \mathbf{C}_z = [\,0.9910\quad 0\,],\quad D_z = -9.120 .
$$

Check the two coefficients: $9.01\times10^5 \times 11 / 10^7 = 0.991$ and $7.6\times10^6 \times 12/10^7 = 9.12$. So a gimbal angle bends the rocket about nine times as hard as the same angle of attack. The controller cannot ignore its own push.

Take $J = \int (z^2 + \rho\,\delta^2)\,dt$, with $\rho$ ("rho") $= 1/\delta_{\max}^2 = 131.3\,\mathrm{rad^{-2}}$ for a $5^\circ$ gimbal limit. Matching pieces as above:

$$
\mathbf{Q} = \begin{bmatrix}0.9821 & 0\\ 0 & 0\end{bmatrix},\quad
\mathbf{N} = \begin{bmatrix}-9.038\\ 0\end{bmatrix},\quad
R = 83.17 + 131.3 = 214.5 .
$$

Here $0.9821 = 0.9910^2$, $-9.038 = 0.9910 \times (-9.120)$ and $83.17 = 9.120^2$.

Completing the square gives $\bar{\mathbf{Q}} = \mathrm{diag}(0.6012,\ 0)$. The fixed piece of feedback is $R^{-1}\mathbf{N}^\top = (-0.04214,\ 0)$, and in $\bar{\mathbf{A}}$ the $(2,1)$ entry drops from $0.4851$ to $0.2018$. Absorbing the cross term has already removed more than half the aerodynamic instability, because part of the best gimbal command pushes straight against $\alpha$. Solving the shifted problem and adding the fixed piece back:

$$
\mathbf{K} = (-0.1320,\ -0.1635), \qquad \text{closed-loop poles } -0.5527 \pm 0.3220j\ \mathrm{s^{-1}} .
$$

Both poles now have negative real parts: the unstable rocket is stabilized, as it should be.

Now fly a $4^\circ$ angle-of-attack upset — a wind gust — and compare with a design that drops $\mathbf{N}$ and keeps only $\mathbf{Q}$ and $R$:

| Design | $\mathbf{K}$ | peak $|\delta|$ | peak $|M_b|$ | true cost |
| --- | --- | --- | --- | --- |
| Cross term included | $(-0.1320,\ -0.1635)$ | $0.528^\circ$ | $1.69\times10^{5}\,\mathrm{N\,m}$ | $0.010315$ |
| Cross term dropped | $(-0.1697,\ -0.2247)$ | $0.679^\circ$ | $3.88\times10^{5}\,\mathrm{N\,m}$ | $0.010950$ |

Dropping the cross term costs $6.2\,\%$ more in the very cost it was meant to minimize ($0.010950/0.010315 = 1.062$). Worse, it gives **2.3 times the peak bending moment** ($3.88/1.69$) while using *more* gimbal, not less. The cross-term design knows its own deflection loads the airframe, so it accepts a slower attitude response and lets the two moments cancel. Launch vehicle engineers call that trade **[[load relief|load-relief]]**.
:::

::: warning One output with feedthrough gives a singular problem
Take the load-relief example with no control penalty, $\rho = 0$. Then $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$, $\mathbf{N} = \mathbf{C}_z^\top D_z$, $R = D_z^2$, and

$$
\bar{\mathbf{Q}} = \mathbf{C}_z^\top\mathbf{C}_z - \mathbf{C}_z^\top D_z (D_z^2)^{-1} D_z \mathbf{C}_z = \mathbf{0}
$$

exactly — not small, zero, for any $\mathbf{C}_z$ and any nonzero number $D_z$. The shifted problem has no state cost at all, so its best gain is $\bar{\mathbf{K}} = \mathbf{0}$. The "optimal" law $\delta = -R^{-1}\mathbf{N}^\top\mathbf{x}$ zeroes $z$ at every instant and does nothing else, leaving the unstable mode uncontrolled. The cost is zero and the vehicle is lost. Penalizing a single output that the input feeds directly is a broken problem. Add a real control penalty $\rho$, or penalize more than one output, and it is fixed. Here $\rho = 131.3$ pulled $\bar{\mathbf{Q}}$ back up to $0.601$.
:::

## Check yourself

::: check
A colleague sets $\mathbf{Q} = \mathbf{I}$ and $\mathbf{R} = \mathbf{I}$ on a plant whose states are altitude in meters, velocity in meters per second and pitch angle in radians, with thrust in newtons as the input. What is wrong with this, before anything is solved?
:::

::: answer
The cost adds numbers in different units and of wildly different sizes. A $100\,\mathrm{m}$ altitude error adds $100^2 = 10^4$ to the integrand. A $0.1\,\mathrm{rad}$ ($5.7^\circ$) pitch error — a far more serious event — adds only $0.1^2 = 0.01$. Meanwhile a $10^5\,\mathrm{N}$ thrust change adds $10^{10}$ and swamps everything, so the controller refuses to move. The weights encode a trade, and a trade between numbers in different units means nothing until they are scaled. Make everything unitless first: divide each state and input by the largest value you will accept, so every term is about one at its limit.
:::

::: check
The identity $J(\mathbf{x}_0) = \mathbf{x}_0^\top\mathbf{P}\mathbf{x}_0$ used $\mathbf{x}(\infty) = \mathbf{0}$. What happens to the argument, and to $J$, if $\mathbf{K}$ does not stabilize the loop?
:::

::: answer
The step where the integral collapses fails: $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ does not go to zero, so nothing cancels at the upper limit. Physically the integral blows up. An unstable mode makes $\mathbf{x}^\top\mathbf{W}\mathbf{x}$ grow without bound, so $J = \infty$ for any $\mathbf{x}_0$ that excites that mode (unless the mode is invisible to both $\mathbf{Q}$ and $\mathbf{K}$ — the detectability loophole). The Lyapunov equation itself can still have a solution — it does whenever no two eigenvalues of $\mathbf{A}_{cl}$ add to zero — but that solution is not positive semidefinite and is not a cost. This is why the infinite-horizon problem automatically produces a stabilizing controller: every non-stabilizing candidate has infinite cost and loses.
:::

::: check
In the reaction-wheel example the LQR peak torque was $80\,\mathrm{N\,m}$ against an $8\,\mathrm{N\,m}$ budget. Give two different ways to fix it, and say what each one costs.
:::

::: answer
First, raise $\mathbf{R}$ (or lower $\mathbf{Q}$). For this plant $k_1 = \sqrt{Q_{11}/R}$, so multiplying $R$ by $100$ — the same as dividing $Q_{11}$ by $100$ — divides $k_1$ by $10$. The new gain is $\mathbf{K} = (91.7,\ 150.1)$, and the starting torque drops to $91.7 \times 0.08727 = 8.0\,\mathrm{N\,m}$, right on budget. The price is speed: the closed-loop poles move from $-2.175 \pm 1.705j$ to $-0.625 \pm 0.611j$, about $\sqrt{10} = 3.16$ times closer to the origin, and the 2 % settling time stretches from $1.3\,\mathrm{s}$ to about $6.8\,\mathrm{s}$.

Second, keep the gain and stop handing the controller a $5^\circ$ step. Feed it a smoothly moving, rate-limited target, so the tracking error never exceeds the $0.5^\circ$ the weights were scaled for. That keeps tight regulation for the small errors of normal operation and gives the big turn to a separate profile generator. Flight software does this, and it is why a saturating LQR is usually a reference-shaping problem, not a weighting problem.
:::

::: check
For the general cost with a cross term, show that the block matrix being positive semidefinite requires $\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top \succeq 0$, and connect this to the substitution $\mathbf{u} = \mathbf{v} - \mathbf{R}^{-1}\mathbf{N}^\top\mathbf{x}$.
:::

::: answer
Completing the square gave $\mathbf{x}^\top\mathbf{Q}\mathbf{x} + 2\mathbf{x}^\top\mathbf{N}\mathbf{u} + \mathbf{u}^\top\mathbf{R}\mathbf{u} = \mathbf{x}^\top(\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top)\mathbf{x} + \mathbf{v}^\top\mathbf{R}\mathbf{v}$ with $\mathbf{v} = \mathbf{u} + \mathbf{R}^{-1}\mathbf{N}^\top\mathbf{x}$. The change from $(\mathbf{x},\mathbf{u})$ to $(\mathbf{x},\mathbf{v})$ can be undone, so the form is never negative for any $(\mathbf{x},\mathbf{u})$ exactly when it is never negative for any $(\mathbf{x},\mathbf{v})$. Choose $\mathbf{v} = \mathbf{0}$: what is left is $\mathbf{x}^\top(\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top)\mathbf{x} \ge 0$, the Schur complement condition. Going the other way, if that condition holds, both terms are nonnegative, so the whole form is. The substitution is the same algebra read as a change of variable instead of a matrix identity, which is why the shifted problem carries $\bar{\mathbf{Q}}$ as its state weight.
:::

::: check
Two designs for the same plant give costs $J_1 = 56.9\,\mathrm{s}$ and $J_2 = 62.7\,\mathrm{s}$ from the same starting state. Design 2 has a lower state cost. Is design 2 ever the right choice?
:::

::: answer
Often. $J$ ranks designs against the trade *you declared*, and that declaration is a model of the requirements, not the requirements themselves. Suppose the real need is a hard pointing limit during a science exposure, and the torque authority is already paid for and would otherwise sit unused. Then the lower state cost is exactly what you are buying, and the bigger total is bookkeeping. The right response is to change the weights so the cost says what you mean — raise $\mathbf{Q}$ until the optimum sits where design 2 does — and then check what that costs elsewhere. "Design 2 is $10\,\%$ worse" is only true for a $\mathbf{Q}$ and $\mathbf{R}$ that someone chose, and those are the shakiest numbers in the whole calculation.
:::

## Summary

| Symbol / result | Meaning |
| --- | --- |
| $J = \int_0^\infty (\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u})dt$ | The LQR cost functional; $\mathbf{Q} \succeq 0$, $\mathbf{R} \succ 0$ |
| $\mathbf{x}(t_f)^\top\mathbf{Q}_f\mathbf{x}(t_f)$ | Terminal penalty in the finite-horizon problem, $\mathbf{Q}_f \succeq 0$ |
| $\mathbf{Q} \succeq 0$, detectable $(\mathbf{A},\mathbf{Q}^{1/2})$ | No unstable mode may be invisible to the cost |
| $\mathbf{R} \succ 0$ | Every control direction costs something; otherwise the problem is singular |
| $\mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl} + \mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K} = 0$ | Lyapunov equation giving $J(\mathbf{x}_0) = \mathbf{x}_0^\top\mathbf{P}\mathbf{x}_0$ for a fixed $\mathbf{K}$ |
| $Q_{ii} = 1/x_{i,\max}^2$, $R_{jj} = 1/u_{j,\max}^2$ | Scaling that makes the integrand unitless and $J$ read in seconds |
| $\alpha\mathbf{Q}, \alpha\mathbf{R}$ | Gives the same $\mathbf{K}$; only the ratio matters |
| $2\mathbf{x}^\top\mathbf{N}\mathbf{u}$ | Cross term; well posed if and only if $\mathbf{R} \succ 0$ and $\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top \succeq 0$ |
| $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$, $\mathbf{N} = \mathbf{C}_z^\top\mathbf{D}_z$, $\mathbf{R} = \mathbf{D}_z^\top\mathbf{D}_z$ | Weighting an output $\mathbf{z} = \mathbf{C}_z\mathbf{x} + \mathbf{D}_z\mathbf{u}$ |
| $\bar{\mathbf{A}} = \mathbf{A} - \mathbf{B}\mathbf{R}^{-1}\mathbf{N}^\top$, $\bar{\mathbf{Q}} = \mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top$, $\mathbf{K} = \bar{\mathbf{K}} + \mathbf{R}^{-1}\mathbf{N}^\top$ | Removing the cross term |
| Wheel axis, $J = 120\,\mathrm{kg\,m^2}$ | $\mathbf{K} = (916.7,\ 522.1)$, poles $-2.175 \pm 1.705j$, $J = 56.95\,\mathrm{s}$ from $5^\circ$ |
| Load relief | Cross term more than halves the peak bending moment: $1.69\times10^{5}$ against $3.88\times10^{5}\,\mathrm{N\,m}$ |

The cost is now defined, but nothing here says how to minimize it. The next lesson does that twice — once by dynamic programming, once by the calculus of variations — and both routes arrive at the same matrix equation for $\mathbf{P}$.

::: context pole-placement What pole placement did
In the state-space module you chose a gain $\mathbf{K}$ so that the closed-loop matrix $\mathbf{A} - \mathbf{B}\mathbf{K}$ had eigenvalues ("poles") exactly where you wanted them. A pole's real part sets how fast a motion dies away; its imaginary part sets how fast it wiggles. With one input and $n$ states there are exactly $n$ gains for $n$ poles, so the answer is unique. With several inputs there are more gains than poles, and the leftover freedom — which way each mode points — is exactly what pole placement leaves you to guess and LQR decides for you.
:::

::: context functional Why "functional" and not "function"
An ordinary function takes a number and gives a number: $f(3) = 9$. A **functional** takes a whole *function* — an entire history $\mathbf{x}(t)$, $\mathbf{u}(t)$ over time — and gives back one number. The cost $J$ is like that: feed it a full flight and it returns a single score. Minimizing a functional means searching over whole trajectories, not over a few numbers, which is why the next lesson needs new tools (dynamic programming and the calculus of variations) instead of ordinary calculus.
:::

::: context psd Bowls and troughs
Picture the cost $\mathbf{x}^\top\mathbf{Q}\mathbf{x}$ for two states as a surface over the $(x_1, x_2)$ floor. Draw its level curves (lines of equal cost). If $\mathbf{Q}$ is **positive definite**, the surface is a bowl: every direction goes uphill, and the level curves are closed ellipses around the origin. If $\mathbf{Q}$ is only **semidefinite**, the surface is a trough: along one direction it stays flat at zero, and the level curves become parallel lines.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g transform="translate(90,80)">
    <line x1="-70" y1="0" x2="70" y2="0" stroke="#6c7a93" stroke-width="1"/>
    <line x1="0" y1="-60" x2="0" y2="60" stroke="#6c7a93" stroke-width="1"/>
    <ellipse cx="0" cy="0" rx="20" ry="10" fill="none" stroke="#1d6fd1" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="40" ry="20" fill="none" stroke="#1d6fd1" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="60" ry="30" fill="none" stroke="#1d6fd1" stroke-width="2"/>
    <text x="64" y="14" font-size="11" fill="#1f2a44">x₁</text>
    <text x="5" y="-50" font-size="11" fill="#1f2a44">x₂</text>
  </g>
  <text x="90" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">Q = diag(1, 4): a bowl</text>
  <g transform="translate(270,80)">
    <line x1="-70" y1="0" x2="70" y2="0" stroke="#6c7a93" stroke-width="1"/>
    <line x1="0" y1="-60" x2="0" y2="60" stroke="#6c7a93" stroke-width="1"/>
    <g stroke="#b4232c" stroke-width="2">
      <line x1="-20" y1="-60" x2="-20" y2="60"/><line x1="20" y1="-60" x2="20" y2="60"/>
      <line x1="-40" y1="-60" x2="-40" y2="60"/><line x1="40" y1="-60" x2="40" y2="60"/>
      <line x1="-60" y1="-60" x2="-60" y2="60"/><line x1="60" y1="-60" x2="60" y2="60"/>
    </g>
    <text x="64" y="14" font-size="11" fill="#1f2a44">x₁</text>
    <text x="5" y="-50" font-size="11" fill="#1f2a44">x₂</text>
  </g>
  <text x="270" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">Q = diag(1, 0): a trough</text>
</svg>
```

In the trough, $x_2$ can wander anywhere for free. That is fine if $x_2$ is harmless, and a disaster if it is unstable.
:::

::: context detectable What "detectable" means here
A system is **observable** from an output if every motion of the state shows up in that output. **Detectable** is the weaker, practical version: every motion that does *not* show up must die away on its own. For LQR, the "output" is whatever the cost can see, $\mathbf{Q}^{1/2}\mathbf{x}$. So detectability says: any mode the cost is blind to had better be stable by itself, because the optimizer will never spend effort on something it cannot see.
:::

::: context lyapunov Who Lyapunov was
Aleksandr Lyapunov was a Russian mathematician whose 1892 doctoral thesis, on the stability of motion, introduced the idea used here: find an energy-like quantity that can only go down along the motion, and you have proved the motion settles. The quantity $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ is exactly such a "Lyapunov function" for the closed loop. Later in this module the same quantity becomes the certificate that a time-varying LQR keeps a rocket inside a safe tube around its planned path.
:::

::: context reaction-wheel How a reaction wheel turns a spacecraft
A reaction wheel is a heavy flywheel driven by an electric motor. Spin the wheel faster one way and, because angular momentum is conserved, the spacecraft turns the other way. The motor torque on the wheel is the control $u$; the equal and opposite torque on the spacecraft is what points the telescope or antenna. Wheels deliver small torques — typically from about a hundredth of a newton-metre up to around one newton-metre. The $8\,\mathrm{N\,m}$ budget in this lesson is a round, generous teaching number; spacecraft that need torques that large use control moment gyroscopes, a heavier cousin of the wheel. Either way the limit is real, and the controller has to respect it.
:::

::: context saturation When the actuator hits its stop
Every actuator has a limit: a wheel motor has a maximum torque, a gimbal a maximum angle. When the controller asks for more, the actuator delivers its maximum and no more. That is **saturation**. The math of LQR assumes the actuator delivers exactly what is commanded, so a saturated loop is no longer the loop you designed — it is slower, and in bad cases unstable. Asking for $80\,\mathrm{N\,m}$ from an $8\,\mathrm{N\,m}$ wheel means much of the first second of the maneuver is not LQR at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="32" width="300" height="16" fill="#8fb8f0" opacity="0.5"/>
  <line x1="40" y1="40" x2="340" y2="40" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="20" x2="40" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,120.0 50.0,89.5 60.0,66.7 70.0,50.3 80.0,39.1 90.0,31.8 100.0,27.7 110.0,25.7 120.0,25.4 130.0,26.0 140.0,27.3 150.0,28.9 160.0,30.6 170.0,32.3 180.0,33.9 190.0,35.3 200.0,36.5 210.0,37.5 220.0,38.3 230.0,38.9 240.0,39.4 250.0,39.7 260.0,39.9 270.0,40.1 280.0,40.2 290.0,40.2 300.0,40.3 310.0,40.3 320.0,40.2 330.0,40.2 340.0,40.2"/>
  <text x="34" y="44" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="34" y="124" font-size="11" text-anchor="end" fill="#1f2a44">−80</text>
  <text x="150" y="60" font-size="11" fill="#1d6fd1">shaded: ±8 N m the wheel can give</text>
  <text x="70" y="110" font-size="11" fill="#b4232c">torque LQR asks for</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="140">0</text><text x="140" y="140">1</text><text x="240" y="140">2</text><text x="340" y="140">3 s</text>
  </g>
</svg>
```

The commanded torque (in N m, from the $5^\circ$ start) is outside the shaded band for the first $0.32\,\mathrm{s}$, then overshoots to about $+14.7\,\mathrm{N\,m}$ and stays outside again from $0.50$ to $1.28\,\mathrm{s}$. A real $8\,\mathrm{N\,m}$ wheel would clip both stretches.
:::

::: context max-q The hardest moment for the airframe
Dynamic pressure, $\bar q = \tfrac12\rho V^2$, measures how hard the air is pushing on the vehicle. Early in ascent the rocket is slow; late in ascent the air is thin. In between, the product peaks — "max-Q". For many launchers it comes roughly a minute after liftoff, at a few tens of kilopascals, and it is when aerodynamic loads on the structure are largest. Some vehicles throttle their engines down through max-Q to keep the loads in check.
:::

::: context load-relief Letting the rocket lean into the wind
A gust tilts the oncoming air, and the air pushes sideways on the rocket. A stiff attitude controller fights that by gimballing hard to hold the nose exactly on course — and the sideways engine push adds its own bending. A load-relief controller instead lets the rocket turn a little into the wind, so less air pushes on it and less gimbal is used. The two designs in the example, compared on peak bending moment:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">Peak bending moment, 4° gust (×10⁵ N m)</text>
  <text x="10" y="52" font-size="12" fill="#1f2a44">with N</text>
  <rect x="90" y="38" width="101.4" height="20" fill="#1d6fd1"/>
  <text x="197" y="52" font-size="12" fill="#1f2a44">1.69</text>
  <text x="10" y="90" font-size="12" fill="#1f2a44">without N</text>
  <rect x="90" y="76" width="232.8" height="20" fill="#b4232c"/>
  <text x="328" y="90" font-size="12" fill="#1f2a44">3.88</text>
  <line x1="90" y1="32" x2="90" y2="102" stroke="#1f2a44" stroke-width="1.5"/>
</svg>
```

Bar lengths are drawn to scale: 60 units per $10^5\,\mathrm{N\,m}$.
:::
