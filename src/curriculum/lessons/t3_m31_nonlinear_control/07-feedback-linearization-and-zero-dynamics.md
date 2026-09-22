---
id: l07-feedback-linearization-and-zero-dynamics
title: Feedback linearization, relative degree and zero dynamics
minutes: 21
covers:
  - 'Feedback linearization (input-state and input-output), relative degree, internal and zero dynamics'
---

If the plant is nonlinear and you know the nonlinearity, why not cancel it? Choose the control so that the nonlinear terms are subtracted out exactly, and what remains is a chain of integrators that any linear method can handle. That is **feedback linearization**, and on a rigid body it is not a theoretical device but standard practice: the computed-torque law that every robot arm and every large slew manoeuvre uses is precisely this.

The method is exact, which distinguishes it from linearising about an operating point. There is no small-signal assumption, no gain schedule, and the resulting linear behaviour holds over the whole region where the coordinate change is valid. It is also the most dangerous design in this module, for a reason that has a name: when the number of times you differentiate the output before the input appears is less than the number of states, the leftover states form an **internal dynamics** that the linearisation has hidden. If those are unstable, the output tracks beautifully while the vehicle destroys itself.

That failure is the nonlinear version of cancelling a right-half-plane zero, which classical design forbids. This lesson develops the machinery — Lie derivatives, relative degree, the normal form — then demonstrates the failure with a plant whose output converges exactly while an internal state grows past $10^4$.

## Lie derivatives and relative degree

Write a single-input, single-output system in the standard affine form

$$
\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}) + \mathbf{g}(\mathbf{x})u, \qquad y = h(\mathbf{x}), \qquad \mathbf{x}\in\mathbb{R}^n .
$$

"Affine in the input" means $u$ enters linearly, which almost every mechanical model does. The **Lie derivative** of a scalar $h$ along a vector field $\mathbf{f}$ is the directional derivative

$$
L_{\mathbf{f}}h(\mathbf{x}) = \frac{\partial h}{\partial\mathbf{x}}\,\mathbf{f}(\mathbf{x}) ,
$$

with $L_{\mathbf{f}}^{k}h = L_{\mathbf{f}}\!\left(L_{\mathbf{f}}^{k-1}h\right)$ and $L_{\mathbf{f}}^{0}h = h$. Differentiating the output along trajectories gives $\dot{y} = L_{\mathbf{f}}h + \left(L_{\mathbf{g}}h\right)u$. If $L_{\mathbf{g}}h = 0$ the input has not appeared, so differentiate again, and keep going.

::: key Relative degree
The system has **relative degree** $r$ at a point if $L_{\mathbf{g}}L_{\mathbf{f}}^{k}h = 0$ for $k = 0, 1, \ldots, r-2$ and $L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h \ne 0$ there. Equivalently, $r$ is the number of times the output must be differentiated before the input appears explicitly. For a linear system $r$ is the pole–zero excess, $\deg(\text{denominator}) - \deg(\text{numerator})$. Always $r \le n$.
:::

Once $u$ appears, the $r$-th derivative of the output is

$$
y^{(r)} = L_{\mathbf{f}}^{r}h(\mathbf{x}) + L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h(\mathbf{x})\,u ,
$$

and the cancelling choice is immediate:

$$
u = \frac{1}{L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h(\mathbf{x})}\left(-L_{\mathbf{f}}^{r}h(\mathbf{x}) + v\right)
\qquad\Longrightarrow\qquad
y^{(r)} = v .
$$

The map from the new input $v$ to the output is a chain of $r$ integrators, exactly, and $v$ is then designed by any linear method — for tracking a reference $y_d$, $v = y_d^{(r)} - k_{r-1}e^{(r-1)} - \cdots - k_0 e$ with $e = y - y_d$ and the $k_i$ chosen to place the error poles.

## The normal form, internal dynamics and zero dynamics

Take $\xi_1 = h$, $\xi_2 = L_{\mathbf{f}}h$, …, $\xi_r = L_{\mathbf{f}}^{r-1}h$ as the first $r$ new coordinates. If $r \lt n$ there are $n - r$ coordinates left over. They can always be chosen (locally) as functions $\boldsymbol{\eta}$ whose derivatives do not involve $u$, and in those coordinates the system reads

$$
\dot{\xi}_i = \xi_{i+1}\ (i \lt r), \qquad \dot{\xi}_r = v, \qquad \dot{\boldsymbol{\eta}} = \mathbf{w}(\boldsymbol{\xi}, \boldsymbol{\eta}) .
$$

The $\boldsymbol{\eta}$ equations are the **internal dynamics**: real states, evolving, invisible from the output and untouched by the control. Setting the output and all its derivatives to zero, $\boldsymbol{\xi} \equiv \mathbf{0}$, leaves

$$
\dot{\boldsymbol{\eta}} = \mathbf{w}(\mathbf{0}, \boldsymbol{\eta}) ,
$$

the **zero dynamics**. A system whose zero dynamics are asymptotically stable is **minimum phase**; one whose zero dynamics are unstable is **non-minimum phase**, and input–output feedback linearization is unusable on it.

::: key Internal and zero dynamics
When the relative degree $r$ is less than the state dimension $n$, input–output linearization leaves $n - r$ states unaffected by the control and unobservable from the output: the internal dynamics. Their behaviour with the output held identically at zero is the zero dynamics. Unstable zero dynamics means the plant is non-minimum phase, and the design is unusable — the nonlinear counterpart of cancelling a right-half-plane zero. For a linear plant, the zero dynamics eigenvalues are exactly the transmission zeros.
:::

When $r = n$ there are no leftover states, the coordinate change $\mathbf{z} = \mathbf{T}(\mathbf{x})$ is a full change of variables, and the whole state — not only the output — obeys a linear equation. That is **input-state linearization**, and it is the case you want.

::: example Computed torque: input-state linearization of a rigid body
Euler's equations are $\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) + \mathbf{u}$, with the state $\boldsymbol{\omega}$ and the torque $\mathbf{u}$ entering through the invertible matrix $\mathbf{J}^{-1}$. Take the output to be $\boldsymbol{\omega}$ itself: one differentiation produces the input, so the relative degree is $1$ on each of the three channels, and the total, $3$, equals the state dimension. No internal dynamics exist. The cancelling law is

$$
\mathbf{u} = \boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) + \mathbf{J}\mathbf{v}
\qquad\Longrightarrow\qquad
\dot{\boldsymbol{\omega}} = \mathbf{v} ,
$$

three decoupled integrators. The first term is the classic gyroscopic **feedforward**: it supplies precisely the torque the body needs to not precess.

With $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$, $\boldsymbol{\omega}(0) = (0.30, -0.20, 0.15)\,\mathrm{rad/s}$ and $\mathbf{v} = -0.5\,\boldsymbol{\omega}$, the closed loop must be $\boldsymbol{\omega}(t) = \boldsymbol{\omega}(0)e^{-0.5t}$ exactly, on all three axes, with no coupling. Integrating the *full nonlinear* equations at $\Delta t = 1\,\mathrm{ms}$ reproduces that to $4\times10^{-16}\,\mathrm{rad/s}$ over ten seconds — the cancellation is algebraic, not approximate.

Now break the model. Use $\hat{\mathbf{J}} = \mathrm{diag}(132, 90, 88)$, errors of $+10$, $-10$ and $+10$ per cent, in both the feedforward and the gain:

| $t$ | Ideal $\boldsymbol{\omega}$ | With $\hat{\mathbf{J}}$ |
| --- | --- | --- |
| $1\,\mathrm{s}$ | $(0.18196, -0.12131, 0.09098)$ | $(0.17091, -0.12665, 0.09413)$ |
| $2\,\mathrm{s}$ | $(0.11036, -0.07358, 0.05518)$ | $(0.09776, -0.08045, 0.05706)$ |
| $10\,\mathrm{s}$ | $(0.00202, -0.00135, 0.00101)$ | $(0.00118, -0.00219, 0.00076)$ |

The largest deviation from the ideal exponential is $1.26\times10^{-2}\,\mathrm{rad/s}$, $3.2$ per cent of the initial rate magnitude. The loop is still stable and still converges — the leftover cross-axis term is small compared with the damping — but the exactness is gone, and it went as fast as the model did. Feedback linearization buys exactness at the price of depending on the model for it, which is why flight implementations combine a computed-torque feedforward with a feedback law that is proved stable *without* relying on cancellation, such as the quaternion law of this module.
:::

::: example The output converges, the vehicle does not
Take the plant $G(s) = (s-1)/\left((s+2)(s+3)\right)$, open-loop stable, with a zero in the right half plane. In state-space form,

$$
\dot{x}_1 = x_2, \qquad \dot{x}_2 = -6x_1 - 5x_2 + u, \qquad y = -x_1 + x_2 .
$$

Differentiate the output once: $\dot{y} = -x_2 + \dot{x}_2 = -6x_1 - 6x_2 + u$. The input has appeared, so $r = 1$, which matches the pole–zero excess $2 - 1 = 1$. Cancel:

$$
u = 6x_1 + 6x_2 + v \qquad\Longrightarrow\qquad \dot{y} = v ,
$$

and choose $v = -2y$ for a clean first-order output response. There are $n - r = 1$ internal states. Take $\eta = x_1$; since $x_2 = y + x_1$, its equation is $\dot{\eta} = x_2 = y + \eta$. Setting $y \equiv 0$ gives the zero dynamics $\dot{\eta} = \eta$ — growth at $e^{t}$, the right-half-plane zero at $s = +1$ reappearing as an internal mode.

Simulate from $\mathbf{x}(0) = (1, 0)$, so $y(0) = -1$, at $\Delta t = 0.1\,\mathrm{ms}$:

| $t$ | $y$ | $x_1$ | $u$ |
| --- | --- | --- | --- |
| $0$ | $-1.000$ | $1.000$ | $8.00$ |
| $1\,\mathrm{s}$ | $-1.3534\times10^{-1}$ | $1.857$ | $21.7$ |
| $2\,\mathrm{s}$ | $-1.8316\times10^{-2}$ | $4.932$ | $59.1$ |
| $5\,\mathrm{s}$ | $-4.5400\times10^{-5}$ | $98.94$ | $1.19\times10^{3}$ |
| $10\,\mathrm{s}$ | $-2.07\times10^{-9}$ | $1.4684\times10^{4}$ | $1.76\times10^{5}$ |

The output follows $-e^{-2t}$ to five figures — a textbook first-order response, and exactly what a tracking-error plot would show. Meanwhile $x_1$ follows $\tfrac{1}{3}e^{-2t} + \tfrac{2}{3}e^{t}$, the analytic solution of $\dot{\eta} = \eta - e^{-2t}$ from $\eta(0) = 1$, reaching $1.47\times10^4$ at ten seconds while the control demand reaches $1.76\times10^5$. Any real actuator saturates within the first few seconds, at which point the cancellation stops and the loop is left with an unstable plant and no control authority.

Change the output and the problem disappears. Take $y = x_1$ instead: $\dot{y} = x_2$ and $\ddot{y} = -6x_1 - 5x_2 + u$, so $r = 2 = n$, no internal dynamics at all. With $u = 6x_1 + 5x_2 + v$ and $v = -4x_1 - 4x_2$ the closed loop is $\ddot{y} + 4\dot{y} + 4y = 0$, a double pole at $-2$, giving $y = (1 + 2t)e^{-2t}$; the simulation returns $0.09158$ at $2\,\mathrm{s}$ and $4.99\times10^{-4}$ at $5\,\mathrm{s}$, matching the closed form to eight digits. Whether feedback linearization is safe is a property of the *output you chose*, not of the plant alone.
:::

## What to do about unstable zero dynamics

There are three honest responses, and no fourth.

**Choose a different output.** The example above shows it working: the same plant, a different measured quantity, relative degree $n$, no internal dynamics. On a vehicle this means regulating something else — flight-path angle instead of altitude, for example, or an output evaluated at a different point on the airframe. Moving the controlled point forward or aft along a flexible body changes the collocation and can move a zero across the axis.

**Accept approximate tracking.** Drop the terms responsible for the small non-minimum-phase behaviour and design for the reduced model, accepting a residual tracking error. This is common where the right-half-plane zero is fast compared with the bandwidth you need.

**Use a method that does not invert the plant.** Lyapunov-based design, backstepping and sliding mode do not require cancelling the plant's own dynamics, so they are not obliged to cancel an unstable zero either. The price is that you give up exact linearity of the closed loop.

::: warning
Relative degree is a local property and it can collapse. The cancelling law divides by $L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h$, so wherever that function passes through zero the control demand is unbounded and the design is undefined. For a control surface this is loss of effectiveness — a stalled elevator, a saturated gimbal, a wheel at speed limit — and it happens at the exact moment you need authority most. Check the sign and magnitude of the decoupling term over the whole flight envelope, not at the design point.
:::

::: warning
Do not read "the tracking error is tiny" as "the design is working". In the example above the tracking error at five seconds is $4.5\times10^{-5}$ while an internal state is at $99$ and rising. Always plot the full state and the commanded control, and if the model has more states than the relative degree, know what those states are doing.
:::

::: note
The same construction applies to several inputs and outputs with a vector relative degree $(r_1, \ldots, r_m)$ and a decoupling matrix in place of the scalar $L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h$; the design cancels and decouples at once, and the leftover dimension is $n - \sum_i r_i$. The rigid-body example is this case with $(1,1,1)$ and $\mathbf{J}^{-1}$ as the decoupling matrix, and its total is $3 = n$, which is why the computed-torque law has no internal dynamics to worry about.
:::

## Check yourself

::: check
For $\dot{x}_1 = x_2 + x_1^2$, $\dot{x}_2 = u$, $y = x_1$, find the relative degree and the linearising control for $\ddot{y} = v$.
:::

::: answer
$\dot{y} = \dot{x}_1 = x_2 + x_1^2$ contains no $u$. Differentiate again: $\ddot{y} = \dot{x}_2 + 2x_1\dot{x}_1 = u + 2x_1(x_2 + x_1^2)$. The input appears, so $r = 2$. Setting $u = v - 2x_1(x_2 + x_1^2)$ gives $\ddot{y} = v$ exactly. Since $r = 2 = n$ this is full input-state linearization, with no internal dynamics; the coordinate change is $z_1 = x_1$, $z_2 = x_2 + x_1^2$, which is a global diffeomorphism.
:::

::: check
A plant has $n = 4$ states and relative degree $r = 2$. How many internal states are there, and what must you check before using input–output linearization?
:::

::: answer
There are $n - r = 2$ internal states. Before using the design you must compute the zero dynamics — the internal dynamics with the output and its derivative held at zero — and confirm they are asymptotically stable. For a linear plant that means checking the two transmission zeros lie in the left half plane; for a nonlinear plant it means a stability analysis of the two-state $\dot{\boldsymbol{\eta}} = \mathbf{w}(\mathbf{0}, \boldsymbol{\eta})$ system, which is a nonlinear stability problem in its own right and may need a Lyapunov argument. You should also check that the decoupling term $L_{\mathbf{g}}L_{\mathbf{f}}h$ is bounded away from zero over the operating region.
:::

::: check
Why does the computed-torque law for a rigid body have no zero dynamics, while the two-state example does?
:::

::: answer
Because the relative degree equals the state dimension. Regulating $\boldsymbol{\omega}$ on a rigid body, the input reaches every state after one differentiation and the three channels use up all three states, so the change of coordinates is onto and nothing is left over. In the two-state example the output $y = -x_1 + x_2$ is reached after one differentiation, leaving one state unaccounted for. The general rule: internal dynamics exist exactly when $r \lt n$, which for a linear plant is when the transfer function has zeros.
:::

::: check
In the computed-torque example a $10$ per cent inertia error produced a $3.2$ per cent rate deviation. Why is that mild, and when would it not be?
:::

::: answer
It is mild because the term that failed to cancel, $(\mathbf{J} - \hat{\mathbf{J}})$ acting through the gyroscopic and gain terms, is small compared with the damping $\mathbf{v} = -0.5\boldsymbol{\omega}$ that the feedback still provides — the design has stability margin left over after the cancellation is spoiled. It would not be mild if the feedback part were weak relative to the cancelled term, which happens at high rates, where $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ grows quadratically while the linear damping grows only linearly. Doubling the rate quadruples the uncancelled gyroscopic residual and only doubles the restoring term. Fast slews are where cancellation error hurts.
:::

::: check
An engineer proposes feedback-linearizing the altitude of an aircraft by cancelling the dynamics from elevator to altitude. What should you ask first?
:::

::: answer
Ask about the zero dynamics of that input–output pair. Elevator to altitude is the textbook non-minimum-phase channel: pulling the elevator first pushes the tail up and the aircraft *down* before the increased incidence lifts it, which is a right-half-plane zero. Inverting that channel cancels the unstable zero and leaves an internal mode growing exponentially — in the model, the same picture as the table above, and in the vehicle, saturation followed by divergence. The standard alternatives are to control flight-path angle or pitch attitude in an inner loop and command altitude through it, or to keep the altitude bandwidth well below the zero's frequency.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\dot{\mathbf{x}} = \mathbf{f} + \mathbf{g}u$, $y = h$ | Affine-in-input form |
| $L_{\mathbf{f}}h = (\partial h/\partial\mathbf{x})\mathbf{f}$ | Lie derivative; $L_{\mathbf{f}}^{k}h$ iterated |
| $r$: $L_{\mathbf{g}}L_{\mathbf{f}}^{k}h = 0$ for $k \lt r-1$, $\ne 0$ at $k = r-1$ | Relative degree; pole–zero excess for a linear plant |
| $u = \left(-L_{\mathbf{f}}^{r}h + v\right)/L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h$ | Input–output linearizing law; gives $y^{(r)} = v$ |
| $n - r$ internal states | Unaffected by $u$, unobservable from $y$ |
| $\dot{\boldsymbol{\eta}} = \mathbf{w}(\mathbf{0},\boldsymbol{\eta})$ | Zero dynamics; unstable means non-minimum phase |
| $r = n$ | Input-state linearization; no internal dynamics |
| $\mathbf{u} = \boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) + \mathbf{J}\mathbf{v}$ | Computed torque; gives $\dot{\boldsymbol{\omega}} = \mathbf{v}$ exactly |
| $\hat{\mathbf{J}}$ off by $10\%$ | $3.2\%$ peak rate deviation from the ideal exponential |
| $(s-1)/((s+2)(s+3))$, $y = -x_1 + x_2$ | $r = 1$, zero dynamics $\dot{\eta} = \eta$; $y \to 0$ while $x_1 \to 1.47\times10^4$ at $10\,\mathrm{s}$ |
| Same plant, $y = x_1$ | $r = 2 = n$; closed loop $(1+2t)e^{-2t}$, no internal dynamics |

Cancellation needs an exact model and a well-behaved output. The next design method needs neither: sliding mode control gives up exactness and buys, in exchange, a closed loop whose behaviour on the surface is insensitive to a large class of model errors and disturbances.
