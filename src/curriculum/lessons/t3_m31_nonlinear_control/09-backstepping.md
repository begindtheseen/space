---
id: l09-backstepping
title: Backstepping
minutes: 20
covers:
  - 'Backstepping'
---

The Lyapunov lesson left a practical gap. Building a candidate is straightforward when the control torque acts directly on the state you are trying to damp — kinetic energy plus a potential, differentiate, done. It is much harder when the control is two or three integrators away from that state: a wheel torque that changes wheel speed, which changes body rate, which changes attitude; a valve command that changes chamber pressure, which changes thrust, which changes acceleration.

**Backstepping** is a recursive construction for exactly that situation. It works outward from the state you care about toward the state the input actually touches, and at each step it does two things: designs what the *next* state ought to be — a **virtual control** — and enlarges the Lyapunov function to account for the fact that the next state is not yet what it ought to be. The result is a control law with a Lyapunov function attached, built in the same pass, with no guessing at any point.

Backstepping also has a property feedback linearization lacks: it never forces you to cancel a nonlinearity. Terms that are already helping — an aerodynamic restoring moment, a damping term, the $-x^3$ in a stiffening spring — can be kept, and the design is more robust and cheaper in control effort for keeping them.

## Strict-feedback form

Backstepping applies to systems in **strict-feedback form**, where each state is driven by the next one and by states earlier in the chain:

$$
\begin{aligned}
\dot{x}_1 &= f_1(x_1) + g_1(x_1)\,x_2, \\
\dot{x}_2 &= f_2(x_1, x_2) + g_2(x_1, x_2)\,x_3, \\
&\ \ \vdots \\
\dot{x}_n &= f_n(x_1,\ldots,x_n) + g_n(x_1,\ldots,x_n)\,u ,
\end{aligned}
$$

with each $g_i \ne 0$. The shape is a chain: $u$ reaches $x_n$, which reaches $x_{n-1}$, and so on down to $x_1$. Cascaded physical systems are usually in this form already, which is why the method sees so much use.

## One step

Start with the two-state case, $\dot{x}_1 = f_1(x_1) + x_2$ and $\dot{x}_2 = u$, and follow the construction.

**Step 1: pretend $x_2$ is the control.** Choose a candidate $V_1 = \tfrac{1}{2}x_1^2$ and a desired value $x_2 = \alpha(x_1)$ making $\dot{V}_1 = x_1(f_1 + \alpha)$ negative. The obvious choice is $\alpha(x_1) = -f_1(x_1) - k_1x_1$, giving $\dot{V}_1 = -k_1x_1^2$. Note that $\alpha$ is not a control law — $x_2$ is a state, not an input. It is a *target* for $x_2$.

**Step 2: measure the mismatch and pay for it.** Define the error between what $x_2$ is and what you wanted:

$$
z = x_2 - \alpha(x_1) ,
$$

and enlarge the candidate to include it:

$$
V_2 = \tfrac{1}{2}x_1^2 + \tfrac{1}{2}z^2 .
$$

Differentiate, substituting $x_2 = \alpha + z$:

$$
\dot{V}_2 = x_1\left(f_1 + \alpha + z\right) + z\left(u - \dot{\alpha}\right)
= -k_1x_1^2 + \underbrace{x_1z}_{\text{cross term}} + z\left(u - \dot{\alpha}\right) .
$$

The cross term is the whole subject. It appeared because $x_2$ was not equal to $\alpha$, and it has no sign. Collect it into the bracket that $u$ controls:

$$
\dot{V}_2 = -k_1x_1^2 + z\left(x_1 + u - \dot{\alpha}\right) ,
$$

and choose

$$
u = \dot{\alpha} - x_1 - k_2 z
\qquad\Longrightarrow\qquad
\dot{V}_2 = -k_1x_1^2 - k_2z^2 .
$$

Negative definite, with no LaSalle argument needed. The term $-x_1$ in the control is the signature of backstepping: it cancels the cross term produced by the mismatch, and it is what a naive "design each loop separately" approach leaves out. The term $\dot{\alpha}$ is computed by the chain rule from the states, not differentiated numerically.

::: key Backstepping, one step
Given $\dot{x}_1 = f_1 + g_1x_2$ with a virtual control $\alpha(x_1)$ that stabilises the first subsystem under $V_1$, define the mismatch $z = x_2 - \alpha$ and augment to $V_2 = V_1 + \tfrac{1}{2}z^2$. Differentiating produces a cross term $z\,\partial V_1/\partial x_1\, g_1$; the real control cancels it and adds its own damping $-k_2z$, giving $\dot{V}_2$ negative definite. Repeat outward, one state per step, until the actual input appears.
:::

::: example A cascade a linear design cannot hold
Take $\dot{x}_1 = x_1^2 + x_2$, $\dot{x}_2 = u$ — a first state with a destabilising quadratic, driven by a second state that the input moves. With $k_1 = k_2 = 2$: $\alpha = -x_1^2 - 2x_1$, $z = x_2 + x_1^2 + 2x_1$, $\dot{\alpha} = -(2x_1 + 2)(x_1^2 + x_2)$, and

$$
u = -(2x_1 + 2)\left(x_1^2 + x_2\right) - x_1 - 2\left(x_2 + x_1^2 + 2x_1\right) .
$$

Integrating at $\Delta t = 0.1\,\mathrm{ms}$ from $(x_1, x_2) = (1, 0)$, with $V_2 = \tfrac{1}{2}x_1^2 + \tfrac{1}{2}z^2$:

| $t$ | $x_1$ | $x_2$ | $V_2$ |
| --- | --- | --- | --- |
| $0$ | $1.0000$ | $0.0000$ | $5.00$ |
| $1\,\mathrm{s}$ | $0.41476$ | $-0.89607$ | $9.158\times10^{-2}$ |
| $2\,\mathrm{s}$ | $0.04234$ | $-0.12600$ | $1.677\times10^{-3}$ |
| $4\,\mathrm{s}$ | $-0.00098$ | $0.00156$ | $5.627\times10^{-7}$ |
| $8\,\mathrm{s}$ | $3\times10^{-7}$ | $-8\times10^{-7}$ | $6.33\times10^{-14}$ |

Now the comparison. Linearise the plant at the origin — $\dot{x}_1 = x_2$, $\dot{x}_2 = u$ — and place both poles at $-1$ with $u = -x_1 - 2x_2$. On the *nonlinear* plant, that law is locally asymptotically stable and its region of attraction on the axis $x_2 = 0$ ends at $x_1 = 0.4020$, found by bisection: from $x_1(0) = 0.40$ it converges, from $0.45$ it diverges, and from $x_1(0) = 1$ the state reaches $10.4$ within one second and escapes.

The backstepping law has no such limit. From $x_1(0) = 3$ it converges ($V_2$ falls from $117$ to $1.3\times10^{-5}$ in four seconds), and from $x_1(0) = 50$ it still converges, because $V_2$ is radially unbounded and $\dot{V}_2$ is negative everywhere. The price is control effort: the initial demand is $|u| = 11$ at $x_1 = 1$, $105$ at $x_1 = 3$, and $2.6\times10^5$ at $x_1 = 50$, growing like $x_1^3$ because the virtual control carries an $x_1^2$ that gets differentiated. Global stability is real and it is not free.
:::

## The recursion

For $n$ states the pattern repeats. At step $i$ you hold a candidate $V_i$ and a virtual control $\alpha_i$ for $x_{i+1}$; you define $z_{i+1} = x_{i+1} - \alpha_i$, set $V_{i+1} = V_i + \tfrac{1}{2}z_{i+1}^2$, differentiate, cancel the cross term with the new virtual control, and move on. At the last step $\alpha_n$ is replaced by the real input and the construction closes with

$$
\dot{V}_n = -\sum_{i=1}^{n} k_i z_i^2 .
$$

Two practical observations. First, $\dot{\alpha}_i$ must be computed analytically, and $\alpha_i$ depends on all earlier states, so the expressions grow quickly — the "explosion of terms" that motivates variants such as dynamic surface control, which filters $\alpha_i$ instead of differentiating it. Second, you are free at every step to keep any term that is already helping. If $f_1(x_1) = -x_1^3$, choosing $\alpha = -k_1x_1$ and leaving the cubic alone gives $\dot{V}_1 = -x_1^4 - k_1x_1^2$, which is better than cancelling it and cheaper in effort. Feedback linearization would have cancelled it out of obligation.

## Backstepping the attitude law

The spacecraft case is two steps, and it produces a law with a strictly negative $\dot{V}$ — an improvement on the quaternion PD law, whose $\dot{V}$ was only semi-definite and needed LaSalle.

**Step 1.** The kinematics $\dot{\mathbf{q}}_v = \tfrac{1}{2}(q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega})$ have $\boldsymbol{\omega}$ as their input. Take $V_1 = 2(1 - q_0)$, so $\dot{V}_1 = -2\dot{q}_0 = \mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$ using $\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$. The virtual control is immediate:

$$
\boldsymbol{\alpha}(\mathbf{q}) = -c\,\mathbf{q}_v
\qquad\Longrightarrow\qquad
\dot{V}_1 = -c\,\lVert\mathbf{q}_v\rVert^2 .
$$

**Step 2.** Define $\mathbf{z} = \boldsymbol{\omega} - \boldsymbol{\alpha} = \boldsymbol{\omega} + c\,\mathbf{q}_v$ — which is exactly the sliding surface of the previous lesson with $\Lambda = c$. Augment with the kinetic energy of the mismatch:

$$
V_2 = 2(1 - q_0) + \tfrac{1}{2}\mathbf{z}^\mathsf{T}\mathbf{J}\mathbf{z} .
$$

Differentiating, with $\boldsymbol{\omega} = \boldsymbol{\alpha} + \mathbf{z}$ and $\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}$:

$$
\dot{V}_2 = \mathbf{q}_v^\mathsf{T}(\boldsymbol{\alpha} + \mathbf{z}) + \mathbf{z}^\mathsf{T}\left(-\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u} - \mathbf{J}\dot{\boldsymbol{\alpha}}\right)
= -c\lVert\mathbf{q}_v\rVert^2 + \mathbf{z}^\mathsf{T}\left(\mathbf{q}_v - \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u} - \mathbf{J}\dot{\boldsymbol{\alpha}}\right).
$$

Choose the control to empty the bracket and add damping:

$$
\mathbf{u} = \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{J}\dot{\boldsymbol{\alpha}} - \mathbf{q}_v - \mathbf{K}_z\mathbf{z},
\qquad
\dot{\boldsymbol{\alpha}} = -c\,\dot{\mathbf{q}}_v = -\tfrac{c}{2}\left(q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega}\right),
$$

giving

$$
\dot{V}_2 = -c\lVert\mathbf{q}_v\rVert^2 - \mathbf{z}^\mathsf{T}\mathbf{K}_z\mathbf{z} .
$$

This vanishes only when $\mathbf{q}_v = \mathbf{0}$ and $\mathbf{z} = \mathbf{0}$, hence $\boldsymbol{\omega} = \mathbf{0}$: negative definite in the state. The same double-cover caveat applies as before — $q_0 = -1$ is the other zero of $\mathbf{q}_v$, and $V_2 = 4$ there, so the certified region is $\{V_2 \lt 4\}$.

::: example Backstepping against the PD law, from $150^\circ$
Take $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$, $c = 0.4\,\mathrm{s^{-1}}$, $\mathbf{K}_z = 80\,\mathbf{I}$, against the PD law $\mathbf{u} = -20\,\mathbf{q}_v - 80\,\boldsymbol{\omega}$ from the Lyapunov lesson. Same initial condition as there: $150^\circ$ about $(1,2,2)/3$ with $\boldsymbol{\omega}(0) = (0.02, -0.03, 0.01)\,\mathrm{rad/s}$, integrated at $\Delta t = 1\,\mathrm{ms}$.

| $t$ | Backstepping error | $\lVert\mathbf{u}\rVert$ | PD error | $\lVert\mathbf{u}\rVert$ |
| --- | --- | --- | --- | --- |
| $0$ | $150.000^\circ$ | $31.56$ | $150.000^\circ$ | $19.01$ |
| $5\,\mathrm{s}$ | $76.832^\circ$ | $3.46$ | $99.455^\circ$ | $1.18$ |
| $10\,\mathrm{s}$ | $28.325^\circ$ | $1.95$ | $51.771^\circ$ | $1.49$ |
| $20\,\mathrm{s}$ | $3.549^\circ$ | $0.26$ | $11.745^\circ$ | $0.46$ |
| $40\,\mathrm{s}$ | $0.0551^\circ$ | $0.00$ | $0.5640^\circ$ | $0.02$ |
| $60\,\mathrm{s}$ | $0.000854^\circ$ | $0.00$ | $0.0278^\circ$ | $0.00$ |

Backstepping settles about ten times tighter at $40\,\mathrm{s}$, at the cost of a $66$ per cent larger peak torque at the start — the comparison is between two particular gain choices, not a universal ranking, and the fair reading is that the backstepping form gives you the extra knob ($c$ separately from $\mathbf{K}_z$) and an exact convergence rate on the mismatch.

The identity is checkable. Computing $\dot{V}_2$ from the simulated derivatives by the chain rule, $-2\dot{q}_0 + (\mathbf{J}(\dot{\boldsymbol{\omega}} - \dot{\boldsymbol{\alpha}}))^\mathsf{T}\mathbf{z}$, and comparing with $-c\lVert\mathbf{q}_v\rVert^2 - \mathbf{z}^\mathsf{T}\mathbf{K}_z\mathbf{z}$: at $t = 0$ both give $-12.01563931$; at $t = 0.5\,\mathrm{s}$, $-5.08269775$; at $t = 2\,\mathrm{s}$, $-0.62151963$; at $t = 4\,\mathrm{s}$, $-0.21246887$. Eight-digit agreement at every point.
:::

## How it relates to what you already have

The mismatch variable $\mathbf{z} = \boldsymbol{\omega} + c\,\mathbf{q}_v$ is the sliding surface, and $\boldsymbol{\alpha} = -c\mathbf{q}_v$ is the rate command that sliding mode drives you toward. The difference is what happens off the surface: sliding mode switches hard and reaches it in finite time with guaranteed rejection of matched disturbance; backstepping applies a smooth law and reaches it asymptotically, with a Lyapunov function for the whole state rather than for the surface alone. The two are the discontinuous and smooth versions of the same geometry, and hybrids — smooth backstepping with a switching term appended — are common.

Against feedback linearization, backstepping cancels the terms it must and keeps the rest. In the attitude law it cancelled the gyroscopic term $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$, but it need not: that term does no work, so leaving it in changes $\dot{V}_2$ by $-\mathbf{z}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})$, which can be dominated by a larger $\mathbf{K}_z$ over any bounded rate envelope. A design that does not depend on cancelling an inertia matrix is a design that survives a mass-property update.

::: warning
The virtual control is not a command you send anywhere. $\boldsymbol{\alpha} = -c\mathbf{q}_v$ is a rate the vehicle *should* have; the only thing sent to the actuators is $\mathbf{u}$ from the final step. Implementing $\boldsymbol{\alpha}$ as an inner-loop rate command, with its own controller, is a different (cascaded) design whose stability does not follow from this proof, and it usually requires the inner loop to be much faster than the outer one.
:::

::: warning
Watch the growth of $\dot{\alpha}_i$. Each step differentiates the previous virtual control, so a quadratic $\alpha$ produces a cubic term in $u$, and a chain of four states can produce expressions that are pages long and numerically delicate. If the terms are exploding, the usual remedies are to choose simpler virtual controls, to use a filtered derivative (dynamic surface control), or to stop cancelling nonlinearities that are helping.
:::

## Check yourself

::: check
For $\dot{x}_1 = -x_1^3 + x_2$, $\dot{x}_2 = u$, design a backstepping law that does *not* cancel the cubic, and give $\dot{V}_2$.
:::

::: answer
Step 1: $V_1 = \tfrac{1}{2}x_1^2$, $\dot{V}_1 = x_1(-x_1^3 + x_2)$. Choose $\alpha = -k_1x_1$, leaving the cubic in place: $\dot{V}_1 = -x_1^4 - k_1x_1^2$, already negative definite and with an extra quartic margin. Step 2: $z = x_2 + k_1x_1$, $V_2 = \tfrac{1}{2}x_1^2 + \tfrac{1}{2}z^2$, and $\dot{V}_2 = -x_1^4 - k_1x_1^2 + z(x_1 + u - \dot{\alpha})$ with $\dot{\alpha} = -k_1(-x_1^3 + x_2)$. Take $u = \dot{\alpha} - x_1 - k_2z = -k_1(-x_1^3 + x_2) - x_1 - k_2(x_2 + k_1x_1)$, giving $\dot{V}_2 = -x_1^4 - k_1x_1^2 - k_2z^2$. Cancelling the cubic instead would have required a $+x_1^3$ term in $\alpha$, a $3x_1^2$ factor in $\dot{\alpha}$, and more control effort for a weaker bound.
:::

::: check
Why does backstepping's $\dot{V}$ come out negative definite while the quaternion PD law's was only negative semi-definite?
:::

::: answer
Because the candidates differ. The PD law's $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1-q_0)$ measures rate and attitude separately, and its derivative $-\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$ vanishes at every attitude with zero rate. Backstepping's $V_2 = 2(1-q_0) + \tfrac{1}{2}\mathbf{z}^\mathsf{T}\mathbf{J}\mathbf{z}$ measures attitude and the *mismatch* $\mathbf{z} = \boldsymbol{\omega} + c\mathbf{q}_v$, and its derivative $-c\lVert\mathbf{q}_v\rVert^2 - \mathbf{z}^\mathsf{T}\mathbf{K}_z\mathbf{z}$ penalises attitude directly. The control paid for that with the extra $-\mathbf{q}_v$ term and the $\mathbf{J}\dot{\boldsymbol{\alpha}}$ feedforward. Strictness in $\dot{V}$ is bought with structure in $\mathbf{u}$.
:::

::: check
A reaction wheel has torque dynamics $\tau\dot{u}_{\text{applied}} = u_{\text{cmd}} - u_{\text{applied}}$ with $\tau = 0.05\,\mathrm{s}$. How would you extend the attitude design, and how many steps would it take?
:::

::: answer
Three steps. The chain is attitude, then rate, then applied torque, with $u_{\text{cmd}}$ the real input. Steps 1 and 2 are as above, except that the quantity designed at step 2 is now a *virtual* torque $\boldsymbol{\alpha}_2$ rather than the actual one. Step 3 defines the third mismatch $\mathbf{z}_3 = \mathbf{u}_{\text{applied}} - \boldsymbol{\alpha}_2$, augments to $V_3 = V_2 + \tfrac{1}{2}\mathbf{z}_3^\mathsf{T}\mathbf{z}_3$, and chooses $\mathbf{u}_{\text{cmd}} = \boldsymbol{\alpha}_2 + \tau\left(\dot{\boldsymbol{\alpha}}_2 - \mathbf{z}_2 - k_3\mathbf{z}_3\right)$ to cancel the new cross term $\mathbf{z}_2^\mathsf{T}\mathbf{z}_3$ and add damping. The proof then covers the actuator lag explicitly rather than assuming it away — which is what a rigid-body-only design does, and why an actuator that is not fast enough breaks such designs without warning.
:::

::: check
The peak control demand for the scalar example grew from $11$ at $x_1 = 1$ to $2.6\times10^5$ at $x_1 = 50$. Where does that growth come from, and what does it mean for an implementation?
:::

::: answer
From the virtual control. $\alpha = -x_1^2 - k_1x_1$ is quadratic, so $\dot{\alpha} = -(2x_1 + k_1)(x_1^2 + x_2)$ is cubic in $x_1$, and $u$ inherits that: at $x_1 = 50$ the dominant term is $-(2\times50)(50^2) = -2.5\times10^5$. The global stability proof is valid but assumes an unlimited actuator, so on a real system the guarantee holds only where the demand fits inside the torque limit. The practical fix is to bound the virtual control — saturate $\alpha$ at the rate the vehicle can actually hold — and redo the analysis with that saturation included, which turns the global claim into a regional one you can defend.
:::

::: check
What is the relationship between the backstepping mismatch $\mathbf{z}$ and the sliding surface $\mathbf{s}$, and why does that matter?
:::

::: answer
They are the same variable: $\mathbf{z} = \boldsymbol{\omega} + c\mathbf{q}_v$ and $\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v$ with $c = \Lambda$. Both designs pick the same target manifold, on which the attitude decays as $\dot{\mathbf{q}}_v = -\tfrac{1}{2}cq_0\mathbf{q}_v$; they differ in how they get there and hold it. It matters because the two methods' strengths combine: use the backstepping construction to obtain a Lyapunov function for the whole state including any actuator dynamics, then append a switching or super-twisting term on $\mathbf{z}$ to recover the sliding mode's rejection of matched disturbance. That hybrid is a standard modern attitude-control structure.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Strict-feedback form | $\dot{x}_i = f_i + g_ix_{i+1}$, $\dot{x}_n = f_n + g_nu$ |
| Virtual control $\alpha_i$ | The value the next state should take; not a command |
| $z_{i+1} = x_{i+1} - \alpha_i$ | Mismatch; the new state of the augmented system |
| $V_{i+1} = V_i + \tfrac{1}{2}z_{i+1}^2$ | Augmented candidate |
| Cross term | Produced by the mismatch; cancelled by the next control |
| $u = \dot{\alpha} - x_1 - k_2z$ | Two-state law; gives $\dot{V}_2 = -k_1x_1^2 - k_2z^2$ |
| $\dot{x}_1 = x_1^2 + x_2$, $k_1 = k_2 = 2$ | Global; linear pole placement diverges beyond $x_1 = 0.4020$ |
| $V_1 = 2(1-q_0)$, $\boldsymbol{\alpha} = -c\mathbf{q}_v$ | Attitude step 1: $\dot{V}_1 = -c\lVert\mathbf{q}_v\rVert^2$ |
| $\mathbf{z} = \boldsymbol{\omega} + c\mathbf{q}_v$, $V_2 = 2(1-q_0) + \tfrac{1}{2}\mathbf{z}^\mathsf{T}\mathbf{J}\mathbf{z}$ | Attitude step 2 |
| $\mathbf{u} = \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{J}\dot{\boldsymbol{\alpha}} - \mathbf{q}_v - \mathbf{K}_z\mathbf{z}$ | Backstepping attitude law; $\dot{V}_2 = -c\lVert\mathbf{q}_v\rVert^2 - \mathbf{z}^\mathsf{T}\mathbf{K}_z\mathbf{z}$ |
| $c = 0.4$, $\mathbf{K}_z = 80\mathbf{I}$, from $150^\circ$ | $3.549^\circ$ at $20\,\mathrm{s}$ against the PD law's $11.745^\circ$ |
| Explosion of terms | $\dot{\alpha}_i$ grows in degree each step; dynamic surface control filters instead |

Backstepping and sliding mode both build a controller and its proof together. The next method starts one step earlier, from the observation that a well-posed mechanical system already has a function that does not increase — its energy — and asks what the control should do to that function rather than to the states.
