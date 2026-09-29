---
id: l09-backstepping
title: Backstepping
minutes: 17
covers:
  - 'Backstepping'
---

Imagine a company where you can only talk to the manager. The manager talks to a supervisor, and the supervisor talks to the worker who actually does the job. You care about the job. To get it done right, you work backward: first decide what the worker *should* be told; then decide what the supervisor should be told so that the worker hears the right thing; then decide what to say to the manager so that all of it happens. At each step you also allow for the fact that the message has not arrived yet.

The Lyapunov lesson left exactly this kind of gap. Building a Lyapunov candidate is straightforward when the control torque acts directly on the state you want to damp: kinetic energy plus a potential, differentiate, done. It is much harder when the control sits two or three integrators away from that state. A wheel torque changes wheel speed, which changes body rate, which changes attitude. A valve command changes chamber pressure, which changes thrust, which changes acceleration.

**Backstepping** is a recipe for that situation. It works outward from the state you care about toward the state the input actually touches. At each step it does two things. It designs what the *next* state ought to be — a **virtual control** — and it enlarges the Lyapunov function to pay for the fact that the next state is not yet what it ought to be. The result is a control law with a Lyapunov function attached, built in the same pass, with no guessing at any point. Backstepping has one more advantage over feedback linearization: it never forces you to cancel a nonlinearity. Terms that are already helping — an aerodynamic restoring moment, a damping term, the $-x^3$ of a stiffening spring — can be kept, and keeping them makes the design more robust and cheaper in control effort.

## Strict-feedback form

Backstepping applies to systems in **[[strict-feedback form|chain-picture]]**, where each state is driven by the next one and by states earlier in the chain:

$$
\begin{aligned}
\dot{x}_1 &= f_1(x_1) + g_1(x_1)\,x_2, \\
\dot{x}_2 &= f_2(x_1, x_2) + g_2(x_1, x_2)\,x_3, \\
&\ \ \vdots \\
\dot{x}_n &= f_n(x_1,\ldots,x_n) + g_n(x_1,\ldots,x_n)\,u ,
\end{aligned}
$$

with every $g_i \ne 0$. Read it from the bottom up: the input $u$ reaches $x_n$, which reaches $x_{n-1}$, and so on down to $x_1$. The "strict" part is that each equation may use only its own state and the ones *below* it in the chain, plus the next state up as its driver. Physical cascades — actuator, rate, attitude — usually come in this form already, which is why the method sees so much use.

## One step

Start with the smallest case, two states:

$$
\dot{x}_1 = f_1(x_1) + x_2, \qquad \dot{x}_2 = u .
$$

You care about $x_1$. You can only push on $x_2$.

**Step 1: pretend $x_2$ is the control.** If you could set $x_2$ to anything you liked, stabilizing $x_1$ would be easy. Take the candidate $V_1 = \tfrac{1}{2}x_1^2$. If $x_2$ equaled some chosen function $\alpha(x_1)$ ("alpha of x one"), then $\dot{V}_1 = x_1(f_1 + \alpha)$. Choose

$$
\alpha(x_1) = -f_1(x_1) - k_1x_1 ,
$$

with a gain $k_1 > 0$, and you get $\dot{V}_1 = -k_1x_1^2$, which is negative whenever $x_1 \ne 0$. But notice: $\alpha$ is not a control law. $x_2$ is a state, not an input — you cannot set it. $\alpha$ is a **target** for $x_2$: the value you would like it to have. That target is the virtual control.

**Step 2: measure the mismatch and pay for it.** Define the gap between what $x_2$ is and what you wanted:

$$
z = x_2 - \alpha(x_1) .
$$

Enlarge the candidate to include that gap:

$$
V_2 = \tfrac{1}{2}x_1^2 + \tfrac{1}{2}z^2 .
$$

Differentiate. Write $x_2 = \alpha + z$ in the first equation, and use $\dot{z} = \dot{x}_2 - \dot{\alpha} = u - \dot{\alpha}$ for the second:

$$
\dot{V}_2 = x_1\left(f_1 + \alpha + z\right) + z\left(u - \dot{\alpha}\right)
= -k_1x_1^2 + \underbrace{x_1z}_{\text{cross term}} + z\left(u - \dot{\alpha}\right) .
$$

The **[[cross term|cross-term-meaning]]** $x_1 z$ is the whole subject. It appeared because $x_2$ was not equal to $\alpha$, and it can be positive or negative. Gather it into the bracket that $u$ controls:

$$
\dot{V}_2 = -k_1x_1^2 + z\left(x_1 + u - \dot{\alpha}\right) ,
$$

and choose $u$ to empty that bracket and add damping of its own:

$$
u = \dot{\alpha} - x_1 - k_2 z
\qquad\Longrightarrow\qquad
\dot{V}_2 = -k_1x_1^2 - k_2z^2 .
$$

That is negative definite — negative everywhere except at the origin — with no LaSalle argument needed. The $-x_1$ term in $u$ is the signature of backstepping. It cancels the cross term created by the mismatch, and it is exactly what a naive "design each loop on its own" approach leaves out. The $\dot{\alpha}$ term is computed by the chain rule from the states, $\dot{\alpha} = \frac{\partial \alpha}{\partial x_1}\dot{x}_1$, never by differentiating a measured signal numerically.

::: key Backstepping in one sentence
For a system in strict-feedback form, design a virtual control for the first subsystem with its own Lyapunov function, then recursively augment the Lyapunov function to handle the mismatch as you step out to the real input. One step in symbols: given $\dot{x}_1 = f_1 + g_1x_2$ and a virtual control $\alpha(x_1)$ that stabilizes the first subsystem under $V_1$, define the mismatch $z = x_2 - \alpha$ and augment to $V_2 = V_1 + \tfrac{1}{2}z^2$. Differentiating produces a cross term $z\,\frac{\partial V_1}{\partial x_1}\, g_1$; the real control cancels it and adds its own damping $-k_2z$, making $\dot{V}_2$ negative definite. Repeat outward, one state per step, until the actual input appears.
:::

::: example A cascade a linear design cannot hold
**The plant.** $\dot{x}_1 = x_1^2 + x_2$, $\dot{x}_2 = u$. The first state has a destabilizing quadratic — the bigger $x_1$ gets, the harder it runs away — and it is driven by a second state that the input moves.

**The design**, with $k_1 = k_2 = 2$:

- Virtual control: $\alpha = -x_1^2 - 2x_1$ (cancel the $x_1^2$, then add $-2x_1$).
- Mismatch: $z = x_2 - \alpha = x_2 + x_1^2 + 2x_1$.
- Its rate, by the chain rule: $\dot{\alpha} = \frac{\partial \alpha}{\partial x_1}\dot{x}_1 = -(2x_1 + 2)(x_1^2 + x_2)$.

So the control is

$$
u = -(2x_1 + 2)\left(x_1^2 + x_2\right) - x_1 - 2\left(x_2 + x_1^2 + 2x_1\right) .
$$

**Sanity check at the start**, $(x_1, x_2) = (1, 0)$: $z = 0 + 1 + 2 = 3$, $V_2 = \tfrac{1}{2}(1) + \tfrac{1}{2}(9) = 5$, and $u = -(4)(1) - 1 - 2(3) = -11$.

**Simulate** from $(1, 0)$:

| $t$ | $x_1$ | $x_2$ | $V_2$ |
| --- | --- | --- | --- |
| $0$ | $1.0000$ | $0.0000$ | $5.00$ |
| $1\,\mathrm{s}$ | $0.41476$ | $-0.89607$ | $9.158\times10^{-2}$ |
| $2\,\mathrm{s}$ | $0.04234$ | $-0.12600$ | $1.677\times10^{-3}$ |
| $4\,\mathrm{s}$ | $-0.00098$ | $0.00156$ | $5.627\times10^{-7}$ |
| $8\,\mathrm{s}$ | $3\times10^{-7}$ | $-8\times10^{-7}$ | $6.33\times10^{-14}$ |

$V_2$ falls every time, as the proof promised.

**The comparison.** Linearize the plant at the origin — the $x_1^2$ drops out, leaving $\dot{x}_1 = x_2$, $\dot{x}_2 = u$ — and place both poles at $-1$ with $u = -x_1 - 2x_2$. On the *nonlinear* plant, that law is only locally stable. Along the line $x_2 = 0$, its **[[region of attraction|roa-line]]** ends at $x_1 = 0.4020$, found by bisection: from $x_1(0) = 0.40$ it converges, from $0.45$ it diverges, and from $x_1(0) = 1$ the state reaches $10.4$ within one second and escapes.

The backstepping law has no such limit. From $x_1(0) = 3$ it converges ($V_2$ falls from $117$ to $1.3\times10^{-5}$ in four seconds), and from $x_1(0) = 50$ it still converges, because $V_2$ is **[[radially unbounded|radially-unbounded]]** and $\dot{V}_2$ is negative everywhere.

**The price** is control effort. The initial demand is $|u| = 11$ at $x_1 = 1$, $105$ at $x_1 = 3$, and $2.6\times10^5$ at $x_1 = 50$. It grows like $x_1^3$, because the virtual control carries an $x_1^2$ that gets differentiated. Global stability is real, and it is not free.
:::

## The recursion

For $n$ states the pattern repeats. At step $i$ you hold a candidate $V_i$ and a virtual control $\alpha_i$ for the next state $x_{i+1}$. Then:

1. Define the mismatch $z_{i+1} = x_{i+1} - \alpha_i$.
2. Enlarge the candidate: $V_{i+1} = V_i + \tfrac{1}{2}z_{i+1}^2$.
3. Differentiate, and choose the next virtual control to cancel the new cross term and add damping.
4. Move one state outward.

At the last step the real input $u$ takes the place of the virtual control, and the construction closes with

$$
\dot{V}_n = -\sum_{i=1}^{n} k_i z_i^2 ,
$$

where $z_1$ is $x_1$ itself.

Two practical points. First, each $\dot{\alpha}_i$ must be worked out analytically, and $\alpha_i$ depends on all earlier states, so the expressions grow fast with every step. This is the "explosion of terms", and it motivates variants such as **[[dynamic surface control|dynamic-surface]]**, which passes $\alpha_i$ through a filter instead of differentiating it.

Second, at every step you are free to keep any term that is already helping. If $f_1(x_1) = -x_1^3$, choose $\alpha = -k_1x_1$ and leave the cubic alone. Then $\dot{V}_1 = x_1(-x_1^3 - k_1x_1) = -x_1^4 - k_1x_1^2$, which is *better* than canceling it, and cheaper in effort. Feedback linearization would have canceled it out of obligation.

## Backstepping the attitude law

The spacecraft case takes two steps. It produces a law with a strictly negative $\dot{V}$ — an improvement on the quaternion PD law, whose $\dot{V}$ was only semi-definite and needed LaSalle to finish the proof.

**Step 1: treat the rate as the control.** The quaternion kinematics $\dot{\mathbf{q}}_v = \tfrac{1}{2}(q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega})$ have $\boldsymbol{\omega}$ as their input. Take

$$
V_1 = 2(1 - q_0) .
$$

This is zero when the error is zero ($q_0 = 1$) and positive otherwise. Using $\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$, its rate is $\dot{V}_1 = -2\dot{q}_0 = \mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$. The virtual control follows at once:

$$
\boldsymbol{\alpha}(\mathbf{q}) = -c\,\mathbf{q}_v
\qquad\Longrightarrow\qquad
\dot{V}_1 = -c\,\lVert\mathbf{q}_v\rVert^2 .
$$

In words: "if only the body turned at a rate proportional to the error, in the direction that shrinks it."

**Step 2: pay for the rate mismatch.** Define

$$
\mathbf{z} = \boldsymbol{\omega} - \boldsymbol{\alpha} = \boldsymbol{\omega} + c\,\mathbf{q}_v .
$$

That is exactly the sliding surface of the previous lesson, with $\Lambda = c$. Enlarge the candidate with the kinetic energy of the mismatch:

$$
V_2 = 2(1 - q_0) + \tfrac{1}{2}\mathbf{z}^\mathsf{T}\mathbf{J}\mathbf{z} .
$$

Differentiate. The first part gives $\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega} = \mathbf{q}_v^\mathsf{T}(\boldsymbol{\alpha} + \mathbf{z})$. The second gives $\mathbf{z}^\mathsf{T}\mathbf{J}(\dot{\boldsymbol{\omega}} - \dot{\boldsymbol{\alpha}})$, and Euler's equation $\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}$ fills in $\mathbf{J}\dot{\boldsymbol{\omega}}$:

$$
\dot{V}_2 = \mathbf{q}_v^\mathsf{T}(\boldsymbol{\alpha} + \mathbf{z}) + \mathbf{z}^\mathsf{T}\left(-\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u} - \mathbf{J}\dot{\boldsymbol{\alpha}}\right)
= -c\lVert\mathbf{q}_v\rVert^2 + \mathbf{z}^\mathsf{T}\left(\mathbf{q}_v - \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u} - \mathbf{J}\dot{\boldsymbol{\alpha}}\right).
$$

The cross term $\mathbf{q}_v^\mathsf{T}\mathbf{z}$ has been moved inside the bracket, where the control can reach it. Choose the control to empty the bracket and add damping with a positive definite gain matrix $\mathbf{K}_z$:

$$
\mathbf{u} = \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{J}\dot{\boldsymbol{\alpha}} - \mathbf{q}_v - \mathbf{K}_z\mathbf{z},
\qquad
\dot{\boldsymbol{\alpha}} = -c\,\dot{\mathbf{q}}_v = -\tfrac{c}{2}\left(q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega}\right),
$$

which gives

$$
\dot{V}_2 = -c\lVert\mathbf{q}_v\rVert^2 - \mathbf{z}^\mathsf{T}\mathbf{K}_z\mathbf{z} .
$$

This is zero only when $\mathbf{q}_v = \mathbf{0}$ and $\mathbf{z} = \mathbf{0}$, and then $\boldsymbol{\omega} = \mathbf{z} - c\mathbf{q}_v = \mathbf{0}$ too. So it is negative definite in the state. The same **[[double-cover caveat|double-cover-region]]** applies as before: $q_0 = -1$ is the other point where $\mathbf{q}_v = \mathbf{0}$, and there $V_2 = 2(1 - (-1)) = 4$. So the certified region is $\{V_2 \lt 4\}$.

::: example Backstepping against the PD law, from 150 degrees
**Setup.** $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$, $c = 0.4\,\mathrm{s^{-1}}$, $\mathbf{K}_z = 80\,\mathbf{I}$. The competitor is the PD law $\mathbf{u} = -20\,\mathbf{q}_v - 80\,\boldsymbol{\omega}$ from the Lyapunov lesson. The initial condition is the same as there: $150^\circ$ about the axis $(1,2,2)/3$, with $\boldsymbol{\omega}(0) = (0.02, -0.03, 0.01)\,\mathrm{rad/s}$.

| $t$ | Backstepping error | $\lVert\mathbf{u}\rVert$ ($\mathrm{N\,m}$) | PD error | $\lVert\mathbf{u}\rVert$ ($\mathrm{N\,m}$) |
| --- | --- | --- | --- | --- |
| $0$ | $150.000^\circ$ | $31.56$ | $150.000^\circ$ | $19.01$ |
| $5\,\mathrm{s}$ | $76.832^\circ$ | $3.46$ | $99.455^\circ$ | $1.18$ |
| $10\,\mathrm{s}$ | $28.325^\circ$ | $1.95$ | $51.771^\circ$ | $1.49$ |
| $20\,\mathrm{s}$ | $3.549^\circ$ | $0.26$ | $11.745^\circ$ | $0.46$ |
| $40\,\mathrm{s}$ | $0.0551^\circ$ | $0.00$ | $0.5640^\circ$ | $0.02$ |
| $60\,\mathrm{s}$ | $0.000854^\circ$ | $0.00$ | $0.0278^\circ$ | $0.00$ |

**Reading it.** At $40\,\mathrm{s}$ backstepping is about ten times tighter ($0.564/0.0551 \approx 10.2$). It pays with a peak torque $31.56/19.01 \approx 1.66$ times larger at the start — $66$ percent more. This compares two particular gain choices, not two methods in general. The fair reading is that the backstepping form gives you an extra knob ($c$, separate from $\mathbf{K}_z$) and an exact convergence rate on the mismatch. The **[[error plot|comparison-plot]]** shows the gap opening on a log scale.

**Checking the proof numerically.** Compute $\dot{V}_2$ from the simulated derivatives by the chain rule, $-2\dot{q}_0 + (\mathbf{J}(\dot{\boldsymbol{\omega}} - \dot{\boldsymbol{\alpha}}))^\mathsf{T}\mathbf{z}$, and compare it with the formula $-c\lVert\mathbf{q}_v\rVert^2 - \mathbf{z}^\mathsf{T}\mathbf{K}_z\mathbf{z}$. At $t = 0$ both give $-12.01563931$; at $t = 0.5\,\mathrm{s}$, $-5.08269775$; at $t = 2\,\mathrm{s}$, $-0.62151963$; at $t = 4\,\mathrm{s}$, $-0.21246887$. Eight-digit agreement at every point — the algebra above is right.
:::

## How it relates to what you already have

The mismatch $\mathbf{z} = \boldsymbol{\omega} + c\,\mathbf{q}_v$ *is* the sliding surface, and $\boldsymbol{\alpha} = -c\mathbf{q}_v$ is the rate that sliding mode drives you toward. The difference is what happens off the surface. Sliding mode switches hard, reaches the surface in finite time and rejects matched disturbances completely. Backstepping applies a smooth law, reaches the surface only asymptotically, and gives a Lyapunov function for the whole state rather than for the surface alone. They are the switching and smooth versions of the same geometry, and hybrids — smooth backstepping with a switching term added — are common.

Compared with feedback linearization, backstepping cancels the terms it must and keeps the rest. In the attitude law it canceled the gyroscopic term $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$, but it did not have to. That term **[[does no work|gyro-no-work]]**, so leaving it in changes $\dot{V}_2$ only by $-\mathbf{z}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})$, which a larger $\mathbf{K}_z$ can dominate over any bounded range of rates. A design that does not depend on canceling an inertia matrix is a design that survives a mass-property update.

::: warning The virtual control is not a command
The virtual control is not something you send anywhere. $\boldsymbol{\alpha} = -c\mathbf{q}_v$ is a rate the vehicle *should* have; the only thing sent to the actuators is $\mathbf{u}$ from the last step. Building $\boldsymbol{\alpha}$ into an inner-loop rate command with its own separate controller is a different (cascaded) design. Its stability does not follow from this proof, and it usually needs the inner loop to be much faster than the outer one.
:::

::: warning Watch the derivatives grow
Each step differentiates the previous virtual control, so a quadratic $\alpha$ produces a cubic term in $u$, and a chain of four states can produce expressions pages long and numerically delicate. If the terms are exploding, the usual remedies are simpler virtual controls, a filtered derivative (dynamic surface control), or no longer canceling nonlinearities that are helping.
:::

## Check yourself

::: check
For $\dot{x}_1 = -x_1^3 + x_2$, $\dot{x}_2 = u$, design a backstepping law that does *not* cancel the cubic, and give $\dot{V}_2$.
:::

::: answer
**Step 1.** $V_1 = \tfrac{1}{2}x_1^2$, so $\dot{V}_1 = x_1(-x_1^3 + x_2)$. Choose $\alpha = -k_1x_1$ and leave the cubic in place: $\dot{V}_1 = -x_1^4 - k_1x_1^2$. That is already negative definite, with an extra quartic margin.

**Step 2.** $z = x_2 - \alpha = x_2 + k_1x_1$ and $V_2 = \tfrac{1}{2}x_1^2 + \tfrac{1}{2}z^2$. Then $\dot{V}_2 = -x_1^4 - k_1x_1^2 + z(x_1 + u - \dot{\alpha})$, with $\dot{\alpha} = -k_1\dot{x}_1 = -k_1(-x_1^3 + x_2)$.

Take $u = \dot{\alpha} - x_1 - k_2z = -k_1(-x_1^3 + x_2) - x_1 - k_2(x_2 + k_1x_1)$. This gives

$$
\dot{V}_2 = -x_1^4 - k_1x_1^2 - k_2z^2 .
$$

Canceling the cubic instead would have needed a $+x_1^3$ term in $\alpha$, a $3x_1^2$ factor in $\dot{\alpha}$, and more control effort — for a weaker bound.
:::

::: check
Why does backstepping's $\dot{V}$ come out negative definite, while the quaternion PD law's was only negative semi-definite?
:::

::: answer
Because the candidates measure different things. The PD law's $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1-q_0)$ measures rate and attitude separately. Its derivative, $-\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$, is zero at every attitude with zero rate — so it cannot, on its own, tell a still vehicle pointing the wrong way from one pointing the right way.

Backstepping's $V_2 = 2(1-q_0) + \tfrac{1}{2}\mathbf{z}^\mathsf{T}\mathbf{J}\mathbf{z}$ measures attitude and the *mismatch* $\mathbf{z} = \boldsymbol{\omega} + c\mathbf{q}_v$. Its derivative, $-c\lVert\mathbf{q}_v\rVert^2 - \mathbf{z}^\mathsf{T}\mathbf{K}_z\mathbf{z}$, penalizes attitude error directly. The control paid for that with the extra $-\mathbf{q}_v$ term and the $\mathbf{J}\dot{\boldsymbol{\alpha}}$ feedforward. A strict $\dot{V}$ is bought with structure in $\mathbf{u}$.
:::

::: check
A reaction wheel has torque dynamics $\tau\dot{u}_{\text{applied}} = u_{\text{cmd}} - u_{\text{applied}}$ with $\tau = 0.05\,\mathrm{s}$. How would you extend the attitude design, and how many steps would it take?
:::

::: answer
Three steps. The chain is now attitude, then rate, then applied torque, with $u_{\text{cmd}}$ as the real input.

Steps 1 and 2 are as above, except that what step 2 designs is now a *virtual* torque $\boldsymbol{\alpha}_2$, because the applied torque is a state, not an input. Step 3 defines the third mismatch $\mathbf{z}_3 = \mathbf{u}_{\text{applied}} - \boldsymbol{\alpha}_2$. Writing $\mathbf{u}_{\text{applied}} = \boldsymbol{\alpha}_2 + \mathbf{z}_3$ in step 2's result leaves a new cross term $\mathbf{z}_2^\mathsf{T}\mathbf{z}_3$ (with $\mathbf{z}_2$ the rate mismatch). Augment to $V_3 = V_2 + \tfrac{1}{2}\mathbf{z}_3^\mathsf{T}\mathbf{z}_3$. Since $\dot{\mathbf{z}}_3 = (\mathbf{u}_{\text{cmd}} - \mathbf{u}_{\text{applied}})/\tau - \dot{\boldsymbol{\alpha}}_2$, choose

$$
\mathbf{u}_{\text{cmd}} = \mathbf{u}_{\text{applied}} + \tau\left(\dot{\boldsymbol{\alpha}}_2 - \mathbf{z}_2 - k_3\mathbf{z}_3\right)
$$

to cancel the cross term and add damping, giving $\dot{V}_3 = -c\lVert\mathbf{q}_v\rVert^2 - \mathbf{z}_2^\mathsf{T}\mathbf{K}_z\mathbf{z}_2 - k_3\lVert\mathbf{z}_3\rVert^2$. (Writing $\boldsymbol{\alpha}_2$ in place of $\mathbf{u}_{\text{applied}}$ in front also works; it adds extra damping $\lVert\mathbf{z}_3\rVert^2/\tau$.)

The proof now covers the actuator lag explicitly instead of assuming it away. A rigid-body-only design assumes it away, which is why an actuator that is not fast enough can break such a design without warning.
:::

::: check
The initial control demand for the scalar example grew from $11$ at $x_1 = 1$ to $2.6\times10^5$ at $x_1 = 50$. Where does that growth come from, and what does it mean for an implementation?
:::

::: answer
It comes from the virtual control. $\alpha = -x_1^2 - k_1x_1$ is quadratic, so $\dot{\alpha} = -(2x_1 + k_1)(x_1^2 + x_2)$ is cubic in $x_1$, and $u$ inherits that. At $x_1 = 50$ the biggest term is about $-(2 \times 50)(50^2) = -2.5\times10^5$.

The global stability proof is valid, but it assumes an unlimited actuator. On a real system the guarantee holds only where the demand fits inside the torque limit. The practical fix is to bound the virtual control — saturate $\alpha$ at a rate the vehicle can actually hold — and redo the analysis with that saturation included. That turns the global claim into a regional one you can defend.
:::

::: check
What is the relationship between the backstepping mismatch $\mathbf{z}$ and the sliding surface $\mathbf{s}$, and why does it matter?
:::

::: answer
They are the same variable: $\mathbf{z} = \boldsymbol{\omega} + c\mathbf{q}_v$ and $\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v$ with $c = \Lambda$. Both designs pick the same target surface, on which the attitude decays as $\dot{\mathbf{q}}_v = -\tfrac{1}{2}cq_0\mathbf{q}_v$. They differ in how they get there and hold it.

It matters because the strengths combine. Use the backstepping construction to get a Lyapunov function for the whole state, including any actuator dynamics. Then add a switching or super-twisting term on $\mathbf{z}$ to recover sliding mode's rejection of matched disturbance. That hybrid is a standard modern attitude-control structure.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Strict-feedback form | $\dot{x}_i = f_i + g_ix_{i+1}$, $\dot{x}_n = f_n + g_nu$ |
| Virtual control $\alpha_i$ | The value the next state should take; a target, not a command |
| $z_{i+1} = x_{i+1} - \alpha_i$ | Mismatch; the new state of the enlarged system |
| $V_{i+1} = V_i + \tfrac{1}{2}z_{i+1}^2$ | Enlarged candidate |
| Cross term | Created by the mismatch; canceled by the next control |
| $u = \dot{\alpha} - x_1 - k_2z$ | Two-state law; gives $\dot{V}_2 = -k_1x_1^2 - k_2z^2$ |
| $\dot{x}_1 = x_1^2 + x_2$, $k_1 = k_2 = 2$ | Global; linear pole placement diverges beyond $x_1 = 0.4020$ |
| $V_1 = 2(1-q_0)$, $\boldsymbol{\alpha} = -c\mathbf{q}_v$ | Attitude step 1: $\dot{V}_1 = -c\lVert\mathbf{q}_v\rVert^2$ |
| $\mathbf{z} = \boldsymbol{\omega} + c\mathbf{q}_v$, $V_2 = 2(1-q_0) + \tfrac{1}{2}\mathbf{z}^\mathsf{T}\mathbf{J}\mathbf{z}$ | Attitude step 2; $\mathbf{z}$ is the sliding surface |
| $\mathbf{u} = \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{J}\dot{\boldsymbol{\alpha}} - \mathbf{q}_v - \mathbf{K}_z\mathbf{z}$ | Backstepping attitude law; $\dot{V}_2 = -c\lVert\mathbf{q}_v\rVert^2 - \mathbf{z}^\mathsf{T}\mathbf{K}_z\mathbf{z}$ |
| $c = 0.4$, $\mathbf{K}_z = 80\mathbf{I}$, from $150^\circ$ | $3.549^\circ$ at $20\,\mathrm{s}$ against the PD law's $11.745^\circ$ |
| Explosion of terms | $\dot{\alpha}_i$ grows in degree each step; dynamic surface control filters instead |

Backstepping and sliding mode both build a controller and its proof together. The next method starts one step earlier, from the fact that a mechanical system already has a quantity that cannot grow on its own — its energy — and asks what the control should do to that quantity rather than to the states.

::: context chain-picture The chain, drawn
Strict-feedback form is a line of boxes. The input pushes only on the last state; each state pushes on the one before it; the state you care about, $x_1$, sits at the far end. Backstepping designs from the right-hand end of this picture back toward the input — hence the name: you step back along the chain, one box per step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="62" y="30" width="56" height="34" rx="4"/>
    <rect x="166" y="30" width="56" height="34" rx="4"/>
    <rect x="270" y="30" width="56" height="34" rx="4"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="52">x₃</text><text x="194" y="52">x₂</text><text x="298" y="52">x₁</text>
    <text x="24" y="52">u</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="34" y1="47" x2="58" y2="47"/><line x1="118" y1="47" x2="162" y2="47"/><line x1="222" y1="47" x2="266" y2="47"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="62,47 54,43 54,51"/><polygon points="166,47 158,43 158,51"/><polygon points="270,47 262,43 262,51"/>
  </g>
  <text x="298" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">you care about</text>
  <line x1="298" y1="96" x2="80" y2="96" stroke="#b4232c" stroke-width="2"/>
  <polygon points="72,96 82,91 82,101" fill="#b4232c"/>
  <text x="190" y="88" font-size="11" fill="#b4232c" text-anchor="middle">design steps back toward u</text>
</svg>
```

The name and the systematic recipe come from work by Petar Kokotović and his collaborators around 1990, collected in the 1995 book *Nonlinear and Adaptive Control Design* by Krstić, Kanellakopoulos and Kokotović.
:::

::: context cross-term-meaning Why the cross term cannot be ignored
A term like $x_1 z$ is a product of two different states, so its sign depends on both. When $x_1$ and $z$ have the same sign it is positive and pushes $V_2$ up; when they differ it pushes $V_2$ down. A Lyapunov proof needs $\dot{V}$ negative *everywhere*, so a term that is sometimes positive has to be dealt with. Backstepping deals with it the cleanest way possible: it puts the term next to $u$ and cancels it exactly.
:::

::: context roa-line Where each law works, along one line
Start the example at rest, $x_2 = 0$, with different values of $x_1(0)$. The linear pole-placement law brings the state home only for $x_1(0)$ below $0.4020$; beyond that the $x_1^2$ term wins and the state escapes. The backstepping law brings it home from every starting point, because its $V_2$ grows without limit and always decreases.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="60" x2="345" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="55" x2="40" y2="65"/><line x1="160.6" y1="52" x2="160.6" y2="68"/><line x1="340" y1="55" x2="340" y2="65"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="80">0</text><text x="160.6" y="80">0.402</text><text x="340" y="80">1.0</text>
    <text x="190" y="112">starting value x₁(0), with x₂(0) = 0</text>
  </g>
  <rect x="40" y="30" width="120.6" height="10" fill="#1d6fd1"/>
  <rect x="160.6" y="30" width="179.4" height="10" fill="#b4232c"/>
  <text x="100" y="24" font-size="11" fill="#1d6fd1" text-anchor="middle">linear: converges</text>
  <text x="250" y="24" font-size="11" fill="#b4232c" text-anchor="middle">linear: escapes</text>
  <rect x="40" y="90" width="300" height="6" fill="#8fb8f0"/>
  <text x="46" y="104" font-size="11" fill="#1f2a44">backstepping converges everywhere</text>
</svg>
```
:::

::: context radially-unbounded Why "radially unbounded" gives a global result
Recall from the Lyapunov lesson: if $V$ grows without limit as the state moves far away in any direction, then every level set $\{V \le c\}$ is a closed, bounded region. A trajectory that starts anywhere is trapped inside the level set it starts on, because $V$ can only fall. So no trajectory can escape to infinity, and with $\dot{V}$ negative definite, every one of them ends at the origin. $V_2 = \tfrac{1}{2}x_1^2 + \tfrac{1}{2}z^2$ has this property, since it grows as either $x_1$ or $z$ grows.
:::

::: context dynamic-surface Dynamic surface control in one paragraph
Instead of differentiating the virtual control $\alpha_i$ by hand, pass it through a fast first-order filter, $T\dot{\bar{\alpha}}_i + \bar{\alpha}_i = \alpha_i$, and use the filter's output rate $\dot{\bar{\alpha}}_i = (\alpha_i - \bar{\alpha}_i)/T$ in place of the exact derivative. The algebra stays short no matter how long the chain is. The proof becomes weaker — you get an ultimate bound that shrinks with the filter time constant $T$, not exact convergence — which is often a fair trade for a four-state chain.
:::

::: context double-cover-region Why the proof stops at V₂ = 4
The quaternions $\mathbf{q}$ and $-\mathbf{q}$ describe the same physical attitude. The point $q_0 = -1$, $\mathbf{q}_v = \mathbf{0}$ is a perfect pointing solution in disguise, but $V_1 = 2(1 - q_0)$ gives it the value $4$, its largest possible. The Lyapunov argument can only promise convergence to $q_0 = +1$ from states with $V_2 \lt 4$, which keeps them away from the other representation. The spacecraft attitude lesson later in this module handles the rest with the $\mathrm{sign}(q_0)$ fix.
:::

::: context comparison-plot The two laws on a log scale
The attitude error of each law from the table, plotted on a log scale so that exponential decay looks like a straight line. Both start at $150^\circ$. Backstepping (blue) falls more steeply; by $60\,\mathrm{s}$ it is about thirty times tighter than the PD law (red).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="15" x2="50" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#8fb8f0" stroke-width="0.6" stroke-dasharray="3,3">
    <line x1="50" y1="148.6" x2="340" y2="148.6"/><line x1="50" y1="105.7" x2="340" y2="105.7"/>
    <line x1="50" y1="62.9" x2="340" y2="62.9"/><line x1="50" y1="20" x2="340" y2="20"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="152">0.001°</text><text x="44" y="109">0.1°</text><text x="44" y="66">10°</text><text x="44" y="24">1000°</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="188">0</text><text x="143.3" y="188">20</text><text x="236.7" y="188">40</text><text x="330" y="188">60 s</text>
  </g>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="50.0,37.7 73.3,41.5 96.7,47.6 143.3,61.4 236.7,89.6 330.0,117.6"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,37.7 73.3,43.9 96.7,53.2 143.3,72.5 236.7,111.3 330.0,150.0"/>
  <text x="250" y="80" font-size="12" fill="#b4232c">PD</text>
  <text x="250" y="132" font-size="12" fill="#1d6fd1">backstepping</text>
</svg>
```
:::

::: context gyro-no-work Why the gyroscopic term does no work
Power is torque dotted with rate. For the gyroscopic term that is $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})$, and a cross product is always at right angles to both of its factors, so the dot product with $\boldsymbol{\omega}$ is exactly zero. The term reshuffles the motion among the axes without adding or removing kinetic energy. That is why the PD proof in the Lyapunov lesson could ignore it, and why backstepping may choose to leave it in.
:::
