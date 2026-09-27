---
id: l07-feedback-linearization-and-zero-dynamics
title: Feedback linearization, relative degree and zero dynamics
minutes: 20
covers:
  - 'Feedback linearization (input-state and input-output), relative degree, internal and zero dynamics'
---

Picture a shopping cart with one bad wheel. It always pulls to the left, and it pulls harder the faster you go. After a few aisles you stop noticing, because your hands have learned to push a little to the right — exactly as much as the wheel pulls, at every speed. The cart now feels like a perfect cart. You have *cancelled* the fault with your own push.

That is the whole idea of **feedback linearization**: if you know the nonlinear part of a plant, choose the control so that it subtracts that part out exactly. What is left behaves like the simplest linear system there is — a chain of integrators — and any linear method from earlier in the course can finish the job. On a rigid body this is not a classroom trick. The **[[computed-torque|computed-torque-in-practice]]** law used on robot arms and in large spacecraft slews is exactly this.

The method is exact, which sets it apart from linearizing about one operating point. There is no small-signal assumption and no gain schedule. The linear behavior holds everywhere the change of coordinates is valid. It is also the most dangerous design in this module. When you have to differentiate the output fewer times than there are states before the control shows up, some states are left over. They form hidden **internal dynamics** that the cancellation never touches. If those are unstable, the output tracks beautifully while the vehicle tears itself apart. This lesson builds the tools — Lie derivatives, relative degree, the normal form — and then shows that failure on a plant whose output converges perfectly while a hidden state grows past $10^4$.

## Cancel what you know

Start with the smallest possible case. A single state obeys

$$
\dot{x} = x^2 + u .
$$

(Read $\dot{x}$ aloud as "x dot": the rate of change of $x$.) The $x^2$ term is the bad wheel. It pushes $x$ upward harder and harder as $x$ grows. Choose

$$
u = -x^2 + v ,
$$

where $v$ is a brand-new input you get to design. Substitute and the $x^2$ terms cancel: $\dot{x} = v$. The plant is now a pure **integrator** — a system whose output is the running total of its input. Choose $v = -2x$ and you get $\dot{x} = -2x$, which decays to zero with a time constant of $0.5\,\mathrm{s}$ from *any* starting point, not only small ones.

Two things made this work. First, you knew the nonlinearity exactly. Second, the control reached the state you cared about directly. The rest of the lesson is about the second condition: what happens when the control has to pass through other states before it reaches the output.

## Lie derivatives: how fast the output changes

Write a single-input, single-output system in the standard form

$$
\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}) + \mathbf{g}(\mathbf{x})u, \qquad y = h(\mathbf{x}), \qquad \mathbf{x}\in\mathbb{R}^n .
$$

Here $\mathbf{x}$ is the state, a list of $n$ numbers ($\mathbf{x}\in\mathbb{R}^n$ reads "x is in R n"). $\mathbf{f}$ is the **drift** — what the state does with no control. $\mathbf{g}$ says how the input $u$ pushes on each state. $y = h(\mathbf{x})$ is the output, the one number you measure and want to control. This shape is called **[[affine in the input|affine-meaning]]**: $u$ enters multiplied by something, never squared or inside a sine. Almost every mechanical model has this shape, because force and torque enter Newton's laws linearly.

Now ask: how fast is the output changing? By the chain rule, $\dot{y}$ is the slope of $h$ in each direction times how fast the state moves in that direction. That combination has a name. The **[[Lie derivative|lie-derivative-picture]]** of a scalar function $h$ along a vector field $\mathbf{f}$ (say "L f of h") is

$$
L_{\mathbf{f}}h(\mathbf{x}) = \frac{\partial h}{\partial\mathbf{x}}\,\mathbf{f}(\mathbf{x}) .
$$

In words: the rate at which $h$ would change if the state drifted along $\mathbf{f}$. Here $\partial h/\partial\mathbf{x}$ is the row of slopes of $h$ (its gradient), and multiplying by the column $\mathbf{f}$ adds up slope times speed in every direction. Repeating the operation is written with a power: $L_{\mathbf{f}}^{k}h = L_{\mathbf{f}}\!\left(L_{\mathbf{f}}^{k-1}h\right)$, and $L_{\mathbf{f}}^{0}h = h$. A mixed one like $L_{\mathbf{g}}L_{\mathbf{f}}h$ means "take $L_{\mathbf{f}}h$, then take its Lie derivative along $\mathbf{g}$."

With this notation, differentiating the output along the motion gives

$$
\dot{y} = L_{\mathbf{f}}h + \left(L_{\mathbf{g}}h\right)u .
$$

If $L_{\mathbf{g}}h = 0$, the input has not appeared yet — the output's rate does not depend on $u$ directly. So differentiate again, and keep going until $u$ shows up.

## Relative degree

The number of differentiations it takes is the key number of this lesson. Think of it as how many links sit between your hand and the thing you want to move. Push a box directly and you change its velocity at once: one link. Push on a box that is tied to a second box by a rope, and the second box's position responds only after its velocity, which responds only after the rope's pull: more links.

::: key Relative degree
The **relative degree** $r$ is the number of times the output must be differentiated before the input appears explicitly. Precisely: $L_{\mathbf{g}}L_{\mathbf{f}}^{k}h = 0$ for $k = 0, 1, \ldots, r-2$ and $L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h \ne 0$ at the point of interest. Feedback linearization gives a chain of $r$ integrators; the remaining $n - r$ states are the internal dynamics. For a linear system $r$ is the pole–zero excess, $\deg(\text{denominator}) - \deg(\text{numerator})$. Always $r \le n$.
:::

Once $u$ appears, the $r$-th derivative of the output (written $y^{(r)}$, "y, r-th derivative") is

$$
y^{(r)} = L_{\mathbf{f}}^{r}h(\mathbf{x}) + L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h(\mathbf{x})\,u .
$$

The first term is everything the plant does on its own. The second is the input times a gain that depends on the state. The cancelling choice follows the shopping-cart recipe: undo the first term, divide out the gain, and put in your new input $v$.

$$
u = \frac{1}{L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h(\mathbf{x})}\left(-L_{\mathbf{f}}^{r}h(\mathbf{x}) + v\right)
\qquad\Longrightarrow\qquad
y^{(r)} = v .
$$

The map from $v$ to $y$ is now a **[[chain of r integrators|integrator-chain]]**, exactly. You then design $v$ by any linear method. For tracking a reference $y_d$ with error $e = y - y_d$, take

$$
v = y_d^{(r)} - k_{r-1}e^{(r-1)} - \cdots - k_0 e ,
$$

which makes the error obey $e^{(r)} + k_{r-1}e^{(r-1)} + \cdots + k_0 e = 0$. You choose the $k_i$ to put the error's poles wherever you like.

::: note Why the r-th derivative has that form
Differentiate $y = h(\mathbf{x})$ once by the chain rule: $\dot{y} = \frac{\partial h}{\partial \mathbf{x}}(\mathbf{f} + \mathbf{g}u) = L_{\mathbf{f}}h + (L_{\mathbf{g}}h)u$. If $L_{\mathbf{g}}h = 0$, then $\dot{y} = L_{\mathbf{f}}h$, a plain function of the state. Differentiate that the same way: $\ddot{y} = L_{\mathbf{f}}^2h + (L_{\mathbf{g}}L_{\mathbf{f}}h)u$. Each step, if the coefficient of $u$ is zero, leaves the next derivative as a function of $\mathbf{x}$ alone, and the pattern repeats. The first step where the coefficient is not zero is step $r$, and there $y^{(r)} = L_{\mathbf{f}}^{r}h + (L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h)u$.
:::

## The normal form, internal dynamics and zero dynamics

Use the output and its first $r - 1$ derivatives as new coordinates:

$$
\xi_1 = h, \quad \xi_2 = L_{\mathbf{f}}h, \quad \ldots, \quad \xi_r = L_{\mathbf{f}}^{r-1}h .
$$

($\xi$ is the Greek letter "xi", said "ksee" or "zai".) If $r = n$, these are all the coordinates you need. If $r \lt n$, there are $n - r$ coordinates left over. They can always be chosen, at least locally, as functions $\boldsymbol{\eta}$ ("eta") whose rates do not involve $u$. In these coordinates — the **normal form** — the system reads

$$
\dot{\xi}_i = \xi_{i+1}\ (i \lt r), \qquad \dot{\xi}_r = v, \qquad \dot{\boldsymbol{\eta}} = \mathbf{w}(\boldsymbol{\xi}, \boldsymbol{\eta}) .
$$

Here is a picture for the $\boldsymbol{\eta}$ part. Think of a puppet whose strings run only to its hands. You can steer the hands perfectly. The legs still swing, driven by how the hands move, and no string reaches them. The $\boldsymbol{\eta}$ equations are those legs: the **internal dynamics**. They are real states, still moving, invisible from the output and untouched by the control.

Now hold the hands perfectly still — output and all its derivatives at zero, $\boldsymbol{\xi} \equiv \mathbf{0}$. What the legs do then is

$$
\dot{\boldsymbol{\eta}} = \mathbf{w}(\mathbf{0}, \boldsymbol{\eta}) ,
$$

the **zero dynamics**. If they settle down (asymptotically stable), the system is **[[minimum phase|minimum-phase-name]]**. If they run away, it is **non-minimum phase**, and input–output feedback linearization cannot be used on it.

::: key Zero dynamics
The zero dynamics are the internal dynamics with the output held identically at zero. When the relative degree $r$ is less than the state dimension $n$, input–output linearization leaves $n - r$ states unaffected by the control and unobservable from the output. Unstable zero dynamics means the plant is non-minimum phase, and input–output feedback linearization is then unusable — the nonlinear version of cancelling an unstable (right-half-plane) zero. For a linear plant, the zero-dynamics eigenvalues are exactly the transmission zeros.
:::

When $r = n$ there are no leftover states. The change of coordinates $\mathbf{z} = \mathbf{T}(\mathbf{x})$ covers the whole state, and the whole state — not only the output — obeys a linear equation. That is **input-state linearization**, and it is the case you want. When $r \lt n$ and you linearize only the path from input to output, it is **input–output linearization**, and the zero dynamics decide whether it is safe.

::: example Computed torque: input-state linearization of a rigid body
**Setup.** Euler's equations for a spinning rigid body are $\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) + \mathbf{u}$. Here $\boldsymbol{\omega}$ is the body rate (three numbers, in $\mathrm{rad/s}$), $\mathbf{J}$ the inertia matrix and $\mathbf{u}$ the control torque. The torque enters through $\mathbf{J}^{-1}$, which is invertible.

**Relative degree.** Take the output to be $\boldsymbol{\omega}$ itself. One differentiation brings in $\mathbf{u}$, so the relative degree is $1$ on each of the three channels. The total, $1 + 1 + 1 = 3$, equals the number of states. No internal dynamics exist.

**The law.** Cancel the cross-product term and scale by $\mathbf{J}$:

$$
\mathbf{u} = \boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) + \mathbf{J}\mathbf{v}
\qquad\Longrightarrow\qquad
\dot{\boldsymbol{\omega}} = \mathbf{v} .
$$

Three separate integrators, one per axis, with no coupling. The first term is the classic **[[gyroscopic feedforward|gyroscopic-term]]**: it supplies exactly the torque the body needs so that it does not precess.

**Numbers.** Take $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$, $\boldsymbol{\omega}(0) = (0.30, -0.20, 0.15)\,\mathrm{rad/s}$ and $\mathbf{v} = -0.5\,\boldsymbol{\omega}$. The closed loop must then be $\boldsymbol{\omega}(t) = \boldsymbol{\omega}(0)e^{-0.5t}$, exactly, on all three axes. Integrating the *full nonlinear* equations reproduces that to better than $10^{-13}\,\mathrm{rad/s}$ over ten seconds — rounding error. The cancellation is algebra, not approximation.

**Now break the model.** Use $\hat{\mathbf{J}} = \mathrm{diag}(132, 90, 88)$ ("J hat", the model you *think* you have) in both the feedforward and the gain. Those are errors of $+10$, $-10$ and $+10$ percent.

| $t$ | Ideal $\boldsymbol{\omega}$ | With $\hat{\mathbf{J}}$ |
| --- | --- | --- |
| $1\,\mathrm{s}$ | $(0.18196, -0.12131, 0.09098)$ | $(0.17091, -0.12665, 0.09413)$ |
| $2\,\mathrm{s}$ | $(0.11036, -0.07358, 0.05518)$ | $(0.09776, -0.08045, 0.05706)$ |
| $10\,\mathrm{s}$ | $(0.00202, -0.00135, 0.00101)$ | $(0.00118, -0.00219, 0.00076)$ |

The largest deviation of any component from the ideal exponential is $1.27\times10^{-2}\,\mathrm{rad/s}$. The initial rate has magnitude $\sqrt{0.30^2 + 0.20^2 + 0.15^2} \approx 0.391\,\mathrm{rad/s}$, so that is about $3.2$ percent.

**Sanity check.** The loop is still stable and still converges — the leftover cross-axis term is small next to the damping. But the exactness is gone, and it left as soon as the model did. Feedback linearization buys exactness by depending on the model for it. That is why flight software usually pairs a computed-torque feedforward with a feedback law that is proved stable *without* relying on cancellation, such as the quaternion law of this module.
:::

::: example The output converges, the vehicle does not
**The plant.** Take $G(s) = (s-1)/\left((s+2)(s+3)\right)$. Its poles, $-2$ and $-3$, are stable. Its zero, at $s = +1$, is in the right half plane. In state-space form:

$$
\dot{x}_1 = x_2, \qquad \dot{x}_2 = -6x_1 - 5x_2 + u, \qquad y = -x_1 + x_2 .
$$

**Relative degree.** Differentiate the output once: $\dot{y} = -\dot{x}_1 + \dot{x}_2 = -x_2 + (-6x_1 - 5x_2 + u) = -6x_1 - 6x_2 + u$. The input has appeared, so $r = 1$. That matches the pole–zero excess, $2 - 1 = 1$.

**Cancel.** Choose

$$
u = 6x_1 + 6x_2 + v \qquad\Longrightarrow\qquad \dot{y} = v ,
$$

and $v = -2y$ for a clean first-order output response, $y(t) = y(0)e^{-2t}$.

**The hidden state.** There are $n - r = 2 - 1 = 1$ internal states. Take $\eta = x_1$. Since $y = -x_1 + x_2$, we have $x_2 = y + x_1$, so $\dot{\eta} = x_2 = y + \eta$. Hold $y \equiv 0$ and you get the zero dynamics $\dot{\eta} = \eta$: growth like $e^{t}$. The right-half-plane zero at $s = +1$ has come back as an internal mode at $+1$.

**Simulate** from $\mathbf{x}(0) = (1, 0)$, so $y(0) = -1 + 0 = -1$:

| $t$ | $y$ | $x_1$ | $u$ |
| --- | --- | --- | --- |
| $0$ | $-1.000$ | $1.000$ | $8.00$ |
| $1\,\mathrm{s}$ | $-1.3534\times10^{-1}$ | $1.857$ | $21.7$ |
| $2\,\mathrm{s}$ | $-1.8316\times10^{-2}$ | $4.932$ | $59.1$ |
| $5\,\mathrm{s}$ | $-4.5400\times10^{-5}$ | $98.94$ | $1.19\times10^{3}$ |
| $10\,\mathrm{s}$ | $-2.06\times10^{-9}$ | $1.4684\times10^{4}$ | $1.76\times10^{5}$ |

(Check the first row: $u = 6(1) + 6(0) - 2(-1) = 8$.) The output follows $-e^{-2t}$ to five figures — a textbook response, and exactly what a tracking-error plot would show. Meanwhile **[[x₁ climbs|hidden-growth-plot]]** as $\tfrac{1}{3}e^{-2t} + \tfrac{2}{3}e^{t}$, the exact solution of $\dot{\eta} = \eta - e^{-2t}$ from $\eta(0) = 1$. It reaches $1.47\times10^4$ at ten seconds while the control demand reaches $1.76\times10^5$. Any real actuator saturates within the first few seconds. At that moment the cancellation stops, and the loop is left with an unstable internal mode and no authority to fight it.

**Change the output and the problem disappears.** Take $y = x_1$ instead. Then $\dot{y} = x_2$ (no $u$ yet) and $\ddot{y} = -6x_1 - 5x_2 + u$, so $r = 2 = n$: no internal dynamics at all. With $u = 6x_1 + 5x_2 + v$ and $v = -4x_1 - 4x_2$, the closed loop is $\ddot{y} + 4\dot{y} + 4y = 0$, a double pole at $-2$, giving $y = (1 + 2t)e^{-2t}$. The simulation returns $0.09158$ at $2\,\mathrm{s}$ and $4.99\times10^{-4}$ at $5\,\mathrm{s}$, matching the formula to eight digits.

**The lesson.** Whether feedback linearization is safe is a property of the *output you chose*, not of the plant alone.
:::

## What to do about unstable zero dynamics

There are three honest responses, and no fourth.

**Choose a different output.** The example shows it working: same plant, a different measured quantity, relative degree $n$, no internal dynamics. On a vehicle this means regulating something else — flight-path angle instead of altitude, for example, or a quantity measured at a different point on the airframe. On a flexible body, moving the sensor forward or aft changes whether sensor and actuator sit at the same spot (**collocation**) and can move a zero from one side of the axis to the other.

**Accept approximate tracking.** Drop the small terms that cause the non-minimum-phase behavior, design for the simpler model, and accept some leftover tracking error. This is common when the right-half-plane zero is fast compared with the bandwidth you actually need.

**Use a method that does not invert the plant.** Lyapunov-based design, backstepping and sliding mode do not need to cancel the plant's own dynamics, so they are never forced to cancel an unstable zero. The price is that you give up an exactly linear closed loop.

::: warning The divisor can go to zero
Relative degree is a local property, and it can collapse. The cancelling law divides by $L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h$. Wherever that function passes through zero, the control demand is unbounded and the design is undefined. On a real vehicle this is loss of control effectiveness — a stalled elevator, a gimbal at its stop, a wheel at its speed limit — and it arrives at the exact moment you most need authority. Check the sign and size of that term over the whole flight envelope, not only at the design point.
:::

::: warning A tiny tracking error is not proof
Do not read "the tracking error is tiny" as "the design is working". In the example above, the tracking error at five seconds is $4.5\times10^{-5}$ while an internal state sits at $99$ and climbing. Always plot the full state and the commanded control. If the model has more states than the relative degree, know what those extra states are doing.
:::

::: note Several inputs and outputs
The same construction works with $m$ inputs and $m$ outputs. Each output $i$ gets its own relative degree $r_i$, so the system has a **vector relative degree** $(r_1, \ldots, r_m)$. In place of the single number $L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h$ there is an $m \times m$ **decoupling matrix**, and the law inverts it, cancelling and decoupling at once. The leftover dimension is $n - \sum_i r_i$. The rigid-body example is this case with $(1,1,1)$ and $\mathbf{J}^{-1}$ as the decoupling matrix. Its total is $3 = n$, which is why computed torque has no internal dynamics to worry about.
:::

## Check yourself

::: check
For $\dot{x}_1 = x_2 + x_1^2$, $\dot{x}_2 = u$, $y = x_1$, find the relative degree and the linearizing control that gives $\ddot{y} = v$.
:::

::: answer
First derivative: $\dot{y} = \dot{x}_1 = x_2 + x_1^2$. No $u$ yet, so differentiate again, using the chain rule on $x_1^2$:

$$
\ddot{y} = \dot{x}_2 + 2x_1\dot{x}_1 = u + 2x_1(x_2 + x_1^2) .
$$

The input appears, so $r = 2$. Choosing $u = v - 2x_1(x_2 + x_1^2)$ cancels the extra term and gives $\ddot{y} = v$ exactly. Since $r = 2 = n$, this is full input-state linearization with no internal dynamics. The new coordinates are $z_1 = x_1$ and $z_2 = x_2 + x_1^2$, and you can always solve back for $x_2 = z_2 - z_1^2$, so the change of coordinates is a **[[global diffeomorphism|diffeomorphism-word]]**.
:::

::: check
A plant has $n = 4$ states and relative degree $r = 2$. How many internal states are there, and what must you check before using input–output linearization?
:::

::: answer
There are $n - r = 4 - 2 = 2$ internal states. Before using the design, compute the zero dynamics — the internal dynamics with the output and its derivative held at zero — and confirm they are asymptotically stable.

For a linear plant, that means checking that the two transmission zeros lie in the left half plane. For a nonlinear plant it means analyzing the two-state system $\dot{\boldsymbol{\eta}} = \mathbf{w}(\mathbf{0}, \boldsymbol{\eta})$. That is a nonlinear stability problem in its own right and may need a Lyapunov argument. You should also check that the divisor $L_{\mathbf{g}}L_{\mathbf{f}}h$ stays well away from zero over the operating region.
:::

::: check
Why does the computed-torque law for a rigid body have no zero dynamics, while the two-state example does?
:::

::: answer
Because on the rigid body the relative degree equals the number of states. Regulating $\boldsymbol{\omega}$, the input reaches every state after one differentiation, and the three channels use up all three states. Nothing is left over.

In the two-state example, the output $y = -x_1 + x_2$ is reached after one differentiation, leaving one state unaccounted for. The general rule: internal dynamics exist exactly when $r \lt n$. For a linear plant, that is when the transfer function has zeros.
:::

::: check
In the computed-torque example, a $10$ percent inertia error produced a $3.2$ percent rate deviation. Why is that mild, and when would it not be?
:::

::: answer
It is mild because the part that failed to cancel — the mismatch $\mathbf{J} - \hat{\mathbf{J}}$ acting through the gyroscopic and gain terms — is small next to the damping $\mathbf{v} = -0.5\boldsymbol{\omega}$ that the feedback still provides. The design has stability margin left over after the cancellation is spoiled.

It would not be mild if the feedback part were weak compared with the cancelled term. That happens at high rates. The gyroscopic term $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ grows with the *square* of the rate, while linear damping grows only in proportion. Doubling the rate quadruples the uncancelled residual and only doubles the restoring term. Fast slews are where cancellation error hurts.
:::

::: check
An engineer proposes feedback-linearizing the altitude of an aircraft by cancelling the dynamics from elevator to altitude. What should you ask first?
:::

::: answer
Ask about the zero dynamics of that input–output pair. **[[Elevator to altitude|elevator-altitude]]** is the classic non-minimum-phase channel. Pulling the elevator first pushes the tail *down* with extra downward lift, so the aircraft sinks slightly before the higher angle of attack lifts it. That initial wrong-way response is a right-half-plane zero.

Inverting that channel cancels the unstable zero and leaves an internal mode growing exponentially — in the model, the same picture as the table above; in the vehicle, saturation followed by divergence. The standard alternatives are to control flight-path angle or pitch attitude in an inner loop and command altitude through it, or to keep the altitude bandwidth well below the zero's frequency.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\dot{\mathbf{x}} = \mathbf{f} + \mathbf{g}u$, $y = h$ | Affine-in-input form: drift plus input times a gain |
| $L_{\mathbf{f}}h = (\partial h/\partial\mathbf{x})\mathbf{f}$ | Lie derivative: rate of change of $h$ along $\mathbf{f}$; $L_{\mathbf{f}}^{k}h$ repeated |
| Relative degree $r$ | Differentiations of $y$ before $u$ appears; pole–zero excess for a linear plant |
| $u = \left(-L_{\mathbf{f}}^{r}h + v\right)/L_{\mathbf{g}}L_{\mathbf{f}}^{r-1}h$ | Linearizing law; gives $y^{(r)} = v$, a chain of $r$ integrators |
| $n - r$ internal states | Untouched by $u$, invisible from $y$ |
| $\dot{\boldsymbol{\eta}} = \mathbf{w}(\mathbf{0},\boldsymbol{\eta})$ | Zero dynamics; unstable means non-minimum phase |
| $r = n$ | Input-state linearization; no internal dynamics |
| $\mathbf{u} = \boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) + \mathbf{J}\mathbf{v}$ | Computed torque; gives $\dot{\boldsymbol{\omega}} = \mathbf{v}$ exactly |
| $\hat{\mathbf{J}}$ off by $10\%$ | $3.2\%$ peak rate deviation from the ideal exponential |
| $(s-1)/((s+2)(s+3))$, $y = -x_1 + x_2$ | $r = 1$, zero dynamics $\dot{\eta} = \eta$; $y \to 0$ while $x_1$ reaches $1.47\times10^4$ at $10\,\mathrm{s}$ |
| Same plant, $y = x_1$ | $r = 2 = n$; closed loop $(1+2t)e^{-2t}$, no internal dynamics |

Cancellation needs an exact model and a well-behaved output. The next design method needs neither. Sliding mode control gives up exactness and gets, in exchange, a closed loop whose behavior is insensitive to a large class of model errors and disturbances.

::: context computed-torque-in-practice Where computed torque shows up
Industrial robot arms have used "inverse dynamics" or computed-torque control for decades: the controller computes, from a model of the arm's masses and links, the joint torques that would produce the desired acceleration, and adds feedback to clean up what the model gets wrong. A spacecraft slew uses the same idea with Euler's equations in place of the arm's equations. In both cases the model-based part does most of the work and the feedback part does the correcting.
:::

::: context affine-meaning What "affine" means here
"Affine" is a math word for "linear plus a constant". A function of $u$ like $a + bu$ is affine: a straight line that need not pass through zero. Saying a system is affine in the input means that, if you freeze the state, the rate $\dot{\mathbf{x}}$ is a straight-line function of $u$. That is what lets you solve for $u$ by dividing. A system like $\dot{x} = \sin u$ is not affine in $u$, and the recipe in this lesson does not apply to it directly.
:::

::: context lie-derivative-picture The Lie derivative as a picture
Draw the level lines of $h$, like contour lines on a hiking map. At any point, the vector $\mathbf{f}$ is where the state is heading. The Lie derivative $L_{\mathbf{f}}h$ is how fast you cross the contour lines while moving along $\mathbf{f}$. Only the part of $\mathbf{f}$ pointing across the lines (along the gradient) counts; the part running along a line changes nothing. The name honors Sophus Lie, the 19th-century Norwegian mathematician who studied flows along vector fields.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="2">
    <line x1="100" y1="20" x2="100" y2="150"/>
    <line x1="180" y1="20" x2="180" y2="150"/>
    <line x1="260" y1="20" x2="260" y2="150"/>
  </g>
  <g font-size="12" fill="#1d6fd1" text-anchor="middle">
    <text x="100" y="165">h = 1</text><text x="180" y="165">h = 2</text><text x="260" y="165">h = 3</text>
  </g>
  <circle cx="140" cy="115" r="4" fill="#1f2a44"/>
  <line x1="140" y1="115" x2="224" y2="59" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="230,55 216,57 223,67" fill="#b4232c"/>
  <text x="196" y="50" font-size="13" fill="#b4232c">f</text>
  <line x1="140" y1="115" x2="230" y2="115" stroke="#1f2a44" stroke-width="2" stroke-dasharray="5,4"/>
  <line x1="230" y1="55" x2="230" y2="115" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="185" y="132" font-size="12" fill="#1f2a44" text-anchor="middle">part across the lines: L_f h</text>
  <text x="20" y="40" font-size="12" fill="#1f2a44">level lines of h</text>
</svg>
```
:::

::: context integrator-chain What a chain of integrators looks like
After cancellation, the new input $v$ is the $r$-th derivative of the output. Integrate it once and you get the $(r-1)$-th derivative; integrate again and you get the one below; after $r$ integrations you reach $y$ itself. Here is the chain for $r = 3$. It is the simplest possible dynamic system, and linear design handles it completely.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 90" font-family="Inter, Arial, sans-serif">
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="60" y="28" width="44" height="34" rx="4"/>
    <rect x="160" y="28" width="44" height="34" rx="4"/>
    <rect x="260" y="28" width="44" height="34" rx="4"/>
  </g>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="82" y="50">1/s</text><text x="182" y="50">1/s</text><text x="282" y="50">1/s</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="14" y1="45" x2="56" y2="45"/><line x1="104" y1="45" x2="156" y2="45"/>
    <line x1="204" y1="45" x2="256" y2="45"/><line x1="304" y1="45" x2="346" y2="45"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="60,45 52,41 52,49"/><polygon points="160,45 152,41 152,49"/>
    <polygon points="260,45 252,41 252,49"/><polygon points="350,45 342,41 342,49"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="32" y="22">v = y'''</text><text x="130" y="22">y''</text><text x="230" y="22">y'</text><text x="328" y="22">y</text>
  </g>
  <text x="180" y="82" font-size="11" fill="#6c7a93" text-anchor="middle">1/s means "integrate once"</text>
</svg>
```
:::

::: context minimum-phase-name Why "minimum phase"
The name comes from linear frequency response. Take two stable transfer functions with the same gain at every frequency, one with a zero at $s = -a$ and one with a zero at $s = +a$. The magnitudes match, but the one with the right-half-plane zero has more phase lag. Among all systems with a given gain curve, the one with every zero in the left half plane has the least phase lag — the minimum phase. The nonlinear definition borrows the name: stable zero dynamics play the role of left-half-plane zeros.
:::

::: context gyroscopic-term Why a spinning body needs a torque to stay put
A body spinning about an axis that is not one of its principal axes does not keep its rate vector fixed on its own. The term $\boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega})$ describes how the angular momentum and the rate point in slightly different directions, so the rate vector wanders in the body frame. Feeding that term forward supplies exactly the torque needed to stop the wandering. It does no work — it is always at right angles to $\boldsymbol{\omega}$ — so it steers the motion without adding or removing energy.
:::

::: context hidden-growth-plot The plot a tracking display never shows
Here are the first three seconds of the example. The output $y$ (blue) rises from $-1$ and hugs zero. The hidden state $x_1$ (red) follows $\tfrac{1}{3}e^{-2t} + \tfrac{2}{3}e^{t}$ and is already above $13$ at three seconds. A display that shows only tracking error would show a perfect loop.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="46" y1="120" x2="50" y2="120"/><line x1="46" y1="70" x2="50" y2="70"/>
    <line x1="143.3" y1="170" x2="143.3" y2="174"/><line x1="236.7" y1="170" x2="236.7" y2="174"/><line x1="330" y1="170" x2="330" y2="174"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="42" y="174">0</text><text x="42" y="124">5</text><text x="42" y="74">10</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="200">0</text><text x="143.3" y="200">1</text><text x="236.7" y="200">2</text><text x="330" y="200">3 s</text>
  </g>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="50.0,160.0 59.3,159.9 68.7,159.6 78.0,159.2 87.3,158.6 96.7,157.8 106.0,156.8 115.3,155.8 124.7,154.5 134.0,153.1 143.3,151.4 152.7,149.6 162.0,147.6 171.3,145.3 180.7,142.8 190.0,140.0 199.3,136.8 208.7,133.4 218.0,129.6 227.3,125.4 236.7,120.7 246.0,115.5 255.3,109.8 264.7,103.5 274.0,96.5 283.3,88.8 292.7,80.2 302.0,70.8 311.3,60.4 320.7,48.8 330.0,36.1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,180.0 59.3,178.2 68.7,176.7 78.0,175.5 87.3,174.5 96.7,173.7 106.0,173.0 115.3,172.5 124.7,172.0 134.0,171.7 143.3,171.4 152.7,171.1 162.0,170.9 171.3,170.7 180.7,170.6 190.0,170.5 199.3,170.4 208.7,170.3 218.0,170.3 227.3,170.2 236.7,170.2 246.0,170.1 255.3,170.1 264.7,170.1 274.0,170.1 283.3,170.1 292.7,170.1 302.0,170.0 311.3,170.0 320.7,170.0 330.0,170.0"/>
  <text x="250" y="60" font-size="12" fill="#b4232c">hidden x₁</text>
  <text x="200" y="160" font-size="12" fill="#1d6fd1">output y</text>
</svg>
```
:::

::: context diffeomorphism-word What "diffeomorphism" means
A diffeomorphism is a change of coordinates that is smooth in both directions: every old state maps to exactly one new state, every new state maps back to exactly one old state, and both maps can be differentiated. "Global" means it works for every state, not only near one point. Here $z_2 = x_2 + x_1^2$ can always be undone by $x_2 = z_2 - z_1^2$, so no information is lost and nothing blows up.
:::

::: context elevator-altitude The wrong-way start of a pitch-up
To climb, a conventional airplane deflects its elevator trailing edge up. That pushes the tail down, which rotates the nose up. But the tail force that starts the rotation points downward, so for a moment the whole aircraft's lift drops and its center of mass sinks slightly. Only after the angle of attack builds does the wing's extra lift win. Control engineers see this wrong-way start in the elevator-to-altitude transfer function as a right-half-plane zero.
:::
