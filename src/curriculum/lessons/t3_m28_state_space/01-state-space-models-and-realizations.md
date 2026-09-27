---
id: l01-state-space-models-and-realizations
title: State-space models and their realizations
minutes: 24
covers:
  - "State-space representation and realizations: controllable canonical, observable canonical, modal"
---

Classical control handed you one loop at a time. One plant $G(s)$, one controller, one Bode plot, one margin. That works while the vehicle behaves like a stack of separate channels that never talk to each other.

Real vehicles talk. On a spacecraft with a spinning momentum wheel, a yaw command tips it in roll. On an airplane, an aileron makes almost as much yaw as roll. On a launch vehicle, a pitch maneuver drives sideways drift that you also have to control. A transfer function has one input and one output. A vehicle has many of each, all tangled together.

**State space** is the bookkeeping that handles the whole tangle at once. You write down a list of everything the system needs to remember, one matrix equation for how that list changes, and a second one for what your sensors see. Everything after this lesson is written in that language: controllability, observability, pole placement, observers, and the Kalman filter in the estimation tier. A Kalman filter is not a frequency-domain object at all. It lives entirely in three matrices called $\mathbf{A}$, $\mathbf{B}$ and $\mathbf{C}$.

This lesson defines those matrices and their sizes, turns them back into a transfer function, and then builds four different state-space models of one real device — an antenna pointing gimbal. All four give exactly the same input-to-output behavior. Knowing which of the four to use for which job is the first practical skill of the module.

## The state: what the system remembers

Throw a ball. To predict where it will be one second from now, what do you need to know? Its position right now, and its velocity right now. You do not need to know who threw it, or where it was a minute ago. Those two numbers carry everything the past can tell you about the future.

That short list is the **[[state|what-state-means]]** — the smallest set of numbers that, together with whatever you do from now on, fixes everything the system will do. For the ball it is position and velocity. For a spacecraft's attitude it is three angles and three spin rates. For an electric motor it might include the current in its windings.

## The state-space equations

A linear, time-invariant, continuous-time system is described by four matrices:

$$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}, \qquad \mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}.$$

Read the first equation aloud as "x dot equals A x plus B u". The dot means "rate of change with time", so $\dot{\mathbf{x}}$ is how fast each state number is changing. The equation says that rate depends on where the state is now ($\mathbf{A}\mathbf{x}$) and on what you are commanding ($\mathbf{B}\mathbf{u}$). The second equation says what the sensors read.

Here is every symbol:

- the **state** $\mathbf{x}$ is a column of $n$ numbers, written $\mathbf{x} \in \mathbb{R}^n$ ("x is in R n": a list of $n$ real numbers);
- the **input** $\mathbf{u} \in \mathbb{R}^m$ is what you command — $m$ numbers, such as motor torques;
- the **output** $\mathbf{y} \in \mathbb{R}^p$ is what you measure — $p$ numbers, such as sensor readings;
- $\mathbf{A}$ is $n\times n$ ("n by n") and holds the **dynamics**: how the state drives its own rate of change;
- $\mathbf{B}$ is $n\times m$ and is the **input map**: how commands push on each state's rate;
- $\mathbf{C}$ is $p\times n$ and is the **measurement map**: how states show up in the sensors;
- $\mathbf{D}$ is $p\times m$ and is the **feed-through**: any path straight from command to measurement.

The shapes are forced. $\mathbf{A}\mathbf{x}$ must be a column of $n$ numbers, so $\mathbf{A}$ needs $n$ rows and $n$ columns. $\mathbf{B}\mathbf{u}$ must also give $n$ numbers from $m$ inputs, so $\mathbf{B}$ is $n\times m$. The same reasoning fixes $\mathbf{C}$ and $\mathbf{D}$.

::: key State-space form
$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, $\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}$. $\mathbf{A}$ is $n\times n$ (dynamics), $\mathbf{B}$ is $n\times m$ (input map), $\mathbf{C}$ is $p\times n$ (measurement map), $\mathbf{D}$ is $p\times m$ (feed-through, usually zero for a physical plant).
:::

### Units check every entry

Every term in row $i$ of the state equation must carry the units of $\dot{x}_i$. So an entry $a_{ij}$ of $\mathbf{A}$ (row $i$, column $j$) has units of $[x_i]/([x_j]\,\mathrm{s})$, where the square brackets mean "the units of". An entry $b_{ij}$ has units $[x_i]/([u_j]\,\mathrm{s})$, and $c_{ij}$ has units $[y_i]/[x_j]$. Check these every time you build a model. It is the fastest way to catch a slip.

One pleasant surprise: the eigenvalues of $\mathbf{A}$ always come out in $\mathrm{s^{-1}}$ ("per second"), whatever units the states are in. The next lesson shows why.

### When is D not zero?

For most physical plants $\mathbf{D} = \mathbf{0}$. A torque applied now cannot move an angle now. It has to be added up over time first. $\mathbf{D}$ is not zero when a sensor reads something tied directly to the command. An accelerometer mounted away from the center of mass feels the control acceleration instantly, for example. When $\mathbf{D} \ne \mathbf{0}$, the plant's response at very high frequency does not fade away, and that matters for noise.

## From state space back to a transfer matrix

You already know transfer functions, so it helps to see how to get one out of the four matrices. The tool is the **[[Laplace transform|laplace-recap]]**, which turns "take the derivative" into "multiply by $s$".

Transform both equations, starting from rest ($\mathbf{x}(0) = \mathbf{0}$). Capital letters are the transformed signals.

1. The state equation becomes $s\mathbf{X}(s) = \mathbf{A}\mathbf{X}(s) + \mathbf{B}\mathbf{U}(s)$.
2. Move the $\mathbf{A}\mathbf{X}$ term to the left: $(s\mathbf{I} - \mathbf{A})\mathbf{X} = \mathbf{B}\mathbf{U}$. Here $\mathbf{I}$ is the identity matrix, which lets us write $s$ as a matrix.
3. Multiply both sides on the left by the inverse: $\mathbf{X} = (s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B}\mathbf{U}$.
4. Put that into the output equation:

$$\mathbf{Y}(s) = \left[\mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B} + \mathbf{D}\right]\mathbf{U}(s) \equiv \mathbf{G}(s)\mathbf{U}(s).$$

$\mathbf{G}(s)$ is the **transfer matrix**, a $p\times m$ grid of ordinary transfer functions. Entry $G_{ij}(s)$ is the transfer function from input $j$ to output $i$.

There is a hidden pattern. The inverse of a matrix can be written as $(s\mathbf{I}-\mathbf{A})^{-1} = \operatorname{adj}(s\mathbf{I}-\mathbf{A})/\det(s\mathbf{I}-\mathbf{A})$: a matrix of polynomials (the **adjugate**) divided by one polynomial (the **determinant**). So every entry of $\mathbf{G}$ has the same denominator, $\det(s\mathbf{I}-\mathbf{A})$ — the characteristic polynomial of $\mathbf{A}$. That means every pole of every channel is an eigenvalue of $\mathbf{A}$. The reverse can fail: an eigenvalue can hide and never show up as a pole. That failure is exactly what Lessons 4 and 5 are about.

## Building a model from the physics

The honest way to get a state-space model is to write the equations of motion and read the matrices off them.

Our running example is an antenna pointing gimbal on a geostationary satellite. It is a motorized joint that swings a dish to point at the ground. Look at one axis:

- the moving part (dish, feed, yoke) has **moment of inertia** $J = 0.8\,\mathrm{kg\,m^2}$ about the axis — its resistance to being spun up;
- the bearing and **[[harmonic drive|harmonic-drive]]** add **viscous friction** $b = 0.4\,\mathrm{N\,m\,s/rad}$, a drag torque proportional to spin rate;
- the motor's current loop is fast but not instant: the delivered torque $\tau$ ("tau") chases the commanded torque $u$ with a **first-order lag** of time constant $\tau_m = 0.02\,\mathrm{s}$ (read "tau sub m");
- an encoder reads the gimbal angle $\theta$ ("theta").

::: example The gimbal's physical realization
Three first-order equations describe the axis. In words: angle changes at the spin rate; spin rate changes with torque minus friction; torque chases the command.

$$\dot{\theta} = \omega, \qquad J\dot{\omega} = \tau - b\,\omega, \qquad \tau_m\dot{\tau} = u - \tau.$$

Choose the state $\mathbf{x} = (\theta,\ \omega,\ \tau)^\mathsf{T}$, in $\mathrm{rad}$, $\mathrm{rad/s}$ and $\mathrm{N\,m}$. (The $\mathsf{T}$ means "transpose": it turns the row into a column.) Divide the second equation by $J$ and the third by $\tau_m$, then read off the coefficients row by row:

$$\mathbf{A} = \begin{pmatrix} 0 & 1 & 0 \\ 0 & -b/J & 1/J \\ 0 & 0 & -1/\tau_m \end{pmatrix} = \begin{pmatrix} 0 & 1 & 0 \\ 0 & -0.5 & 1.25 \\ 0 & 0 & -50 \end{pmatrix}, \quad \mathbf{B} = \begin{pmatrix} 0 \\ 0 \\ 1/\tau_m \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \\ 50 \end{pmatrix},$$

with $\mathbf{C} = (1\ \ 0\ \ 0)$, because the encoder reads the first state, and $\mathbf{D} = 0$. So $n = 3$, $m = 1$, $p = 1$.

**Units check.** $a_{23} = 1/J = 1.25\,\mathrm{rad/(s^2\,N\,m)}$. That is $[\omega]/([\tau]\,\mathrm{s})$, as the rule requires. And $b_3 = 50\,\mathrm{s^{-1}}$ is $[\tau]/([u]\,\mathrm{s})$, since $\tau$ and $u$ are both torques.

**Eigenvalues.** $\mathbf{A}$ is **upper triangular** (all zeros below the diagonal), so its eigenvalues sit on the diagonal: $\lambda = 0,\ -0.5,\ -50\ \mathrm{s^{-1}}$. Each one means something:

- $0$ is the free integration from rate to angle. The gimbal has no spring, so it holds any angle you leave it at.
- $-0.5\,\mathrm{s^{-1}}$ is the bearing drag, with time constant $J/b = 2\,\mathrm{s}$.
- $-50\,\mathrm{s^{-1}}$ is the current loop, with time constant $20\,\mathrm{ms}$.

A factor of $100$ between the slowest nonzero mode and the fastest is normal for a mechanism, and it makes the model **[[stiff|stiff-model]]**.

**The transfer function.** The three equations form a [[chain|gimbal-chain]], so you can multiply the links. Torque from command is $\tau/u = 1/(\tau_m s + 1) = 50/(s+50)$. Angle from torque is $\theta/\tau = 1/(Js^2 + bs) = 1.25/(s(s+0.5))$. Multiply:

$$G(s) = \frac{62.5}{s\,(s+0.5)\,(s+50)} = \frac{62.5}{s^3 + 50.5\,s^2 + 25\,s}\ \ \mathrm{rad/(N\,m)}.$$

The gain $62.5 = 1/(J\tau_m)$ has units $\mathrm{rad/(N\,m\,s^3)}$.

**Sanity check.** Evaluate $\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$ numerically at $s = 2\,\mathrm{s^{-1}}$ and you get $0.240385$. The formula gives $62.5/(2\times 2.5\times 52) = 62.5/260 = 0.240385$. The two routes agree.
:::

## Realizations: many models, one plant

Here is a surprise. The gimbal has many correct state-space models, not one.

A **realization** of a transfer matrix $\mathbf{G}(s)$ is any set $(\mathbf{A},\mathbf{B},\mathbf{C},\mathbf{D})$ with $\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} + \mathbf{D} = \mathbf{G}(s)$. There are infinitely many. Change the state's coordinates and you get another one (that is the next lesson). Tack on extra states that the input never reaches, or that the output never sees, and you get yet another. A realization with the smallest possible $n$ is **minimal**. Lesson 5 proves that minimal means exactly "controllable and observable".

Three realizations have names, because each one makes a particular job easy. Each is written for a single-input, single-output (**SISO**) plant

$$G(s) = \frac{b_{n-1}s^{n-1} + \cdots + b_1 s + b_0}{s^n + a_{n-1}s^{n-1} + \cdots + a_1 s + a_0},$$

with the top of the fraction lower in degree than the bottom (**strictly proper**), and the bottom scaled so its leading coefficient is $1$. The $a_i$ are the denominator coefficients and the $b_i$ the numerator coefficients.

### Controllable canonical form

The idea is to split $G(s)$ into two steps: first "divide by the denominator", then "multiply by the numerator".

Invent a helper signal $v$ with $V(s) = U(s)/(s^n + a_{n-1}s^{n-1} + \cdots + a_0)$. Then $Y(s) = (b_{n-1}s^{n-1} + \cdots + b_0)V(s)$. Back in the time domain, where each $s$ is one derivative and $v^{(k)}$ means the $k$-th derivative of $v$:

$$v^{(n)} + a_{n-1}v^{(n-1)} + \cdots + a_0 v = u, \qquad y = b_{n-1}v^{(n-1)} + \cdots + b_0 v.$$

Now take $v$ and its derivatives as the state: $x_1 = v$, $x_2 = \dot{v}$, …, $x_n = v^{(n-1)}$. Each state is the derivative of the one before, so $\dot{x}_i = x_{i+1}$ for $i < n$. The differential equation supplies the last row. The result is

$$\mathbf{A}_c = \begin{pmatrix} 0 & 1 & 0 & \cdots & 0 \\ 0 & 0 & 1 & \cdots & 0 \\ \vdots & & & \ddots & \vdots \\ 0 & 0 & 0 & \cdots & 1 \\ -a_0 & -a_1 & -a_2 & \cdots & -a_{n-1} \end{pmatrix}, \quad \mathbf{B}_c = \begin{pmatrix} 0 \\ 0 \\ \vdots \\ 0 \\ 1 \end{pmatrix}, \quad \mathbf{C}_c = \begin{pmatrix} b_0 & b_1 & \cdots & b_{n-1}\end{pmatrix}.$$

$\mathbf{A}_c$ is a **[[companion matrix|companion-roots]]**: ones directly above the diagonal, and the denominator coefficients, with their signs flipped, across the bottom row. You can read the characteristic polynomial straight off it. That is why pole placement formulas are derived in this form: moving the poles becomes arithmetic on one row. It is also the form to reach for when someone hands you a transfer function and you need a state-space model fast.

### Observable canonical form

For a SISO plant, $G(s)$ is a single number at each $s$. A single number equals its own transpose. So

$$G(s) = G(s)^\mathsf{T} = \mathbf{B}^\mathsf{T}(s\mathbf{I}-\mathbf{A}^\mathsf{T})^{-1}\mathbf{C}^\mathsf{T},$$

using the rule that transposing a product reverses its order. That line says: transpose a realization, swap the roles of $\mathbf{B}$ and $\mathbf{C}$, and you have another realization of the same plant. Doing this to the controllable canonical form gives the **observable canonical form**:

$$\mathbf{A}_o = \mathbf{A}_c^\mathsf{T}, \qquad \mathbf{B}_o = \mathbf{C}_c^\mathsf{T}, \qquad \mathbf{C}_o = \mathbf{B}_c^\mathsf{T}.$$

Now the denominator coefficients run down the last **column**, and $\mathbf{C}_o = (0\ \cdots\ 0\ \ 1)$. Observer gains are derived in this form, for the mirror-image reason: the measurement touches exactly one state, so choosing how fast estimation errors die out is again arithmetic on one column. This transpose trick is called **[[duality|duality-bridge]]**, and Lesson 5 turns it into a theorem.

### Modal form

The third form splits the plant into independent pieces, one per eigenvalue. Expand $G(s)$ in **partial fractions**. If $\mathbf{A}$ has $n$ different eigenvalues $\lambda_i$ ("lambda sub i"), then

$$G(s) = \sum_{i=1}^{n}\frac{r_i}{s - \lambda_i}, \qquad r_i = \lim_{s\to\lambda_i}(s-\lambda_i)G(s).$$

The $\sum$ ("sigma") means "add up the terms for $i = 1$ to $n$". Each term is a tiny first-order system: $\dot{z}_i = \lambda_i z_i + u$ and $y_i = r_i z_i$. Stack them:

$$\mathbf{A}_m = \operatorname{diag}(\lambda_1,\dots,\lambda_n), \qquad \mathbf{B}_m = (1\ \cdots\ 1)^\mathsf{T}, \qquad \mathbf{C}_m = (r_1\ \cdots\ r_n).$$

"diag" means a matrix with those numbers on the diagonal and zeros elsewhere. The modes are completely decoupled: no state affects any other. The **[[residue|parallel-modes]]** $r_i$ tells you how strongly mode $i$ shows up in the output.

That makes the modal form the one to use when you want to see which dynamics matter. It is the front door to model reduction in Lesson 11. It is also how a structural engineer will hand you a flexible-body model.

Two special cases. If two eigenvalues are equal and there are not enough eigenvectors, the diagonal becomes a **Jordan block**, with a $1$ directly above the diagonal. If a pair is complex, $\sigma \pm i\omega$, the $2\times2$ block is usually written in the real form $\begin{pmatrix} \sigma & \omega \\ -\omega & \sigma\end{pmatrix}$, whose eigenvalues are exactly $\sigma \pm i\omega$, so that flight code never needs complex arithmetic.

::: example Three canonical realizations of the same gimbal
Start from $G(s) = 62.5/(s^3 + 50.5s^2 + 25s)$. Match it to the general form: $a_0 = 0$, $a_1 = 25$, $a_2 = 50.5$, $b_0 = 62.5$, $b_1 = b_2 = 0$.

**Controllable canonical.** Put $-a_0, -a_1, -a_2$ across the bottom row and $b_0, b_1, b_2$ into $\mathbf{C}_c$:

$$\mathbf{A}_c = \begin{pmatrix} 0 & 1 & 0 \\ 0 & 0 & 1 \\ 0 & -25 & -50.5\end{pmatrix},\quad \mathbf{B}_c = \begin{pmatrix}0\\0\\1\end{pmatrix},\quad \mathbf{C}_c = \begin{pmatrix}62.5 & 0 & 0\end{pmatrix}.$$

**Observable canonical.** Transpose the set: $\mathbf{A}_o = \mathbf{A}_c^\mathsf{T}$, $\mathbf{B}_o = (62.5,\ 0,\ 0)^\mathsf{T}$, $\mathbf{C}_o = (0\ \ 0\ \ 1)$.

**Modal.** The eigenvalues are $0,\ -0.5,\ -50$. For each residue, cover up that eigenvalue's factor in $G(s) = 62.5/(s(s+0.5)(s+50))$ and put $s = \lambda_i$ into what is left:

$$r_1 = \frac{62.5}{(0.5)(50)} = 2.5,\quad r_2 = \frac{62.5}{(-0.5)(49.5)} = -2.525,\quad r_3 = \frac{62.5}{(-50)(-49.5)} = 0.02525.$$

So $\mathbf{A}_m = \operatorname{diag}(0,\ -0.5,\ -50)$, $\mathbf{B}_m = (1,1,1)^\mathsf{T}$ and $\mathbf{C}_m = (2.5,\ -2.525,\ 0.02525)$.

**Sanity check.** Evaluate all four models — physical, controllable, observable, modal — at $s = 2\,\mathrm{s^{-1}}$. Every one returns $0.240385\,\mathrm{rad/(N\,m)}$. They are the same plant.

**What the residues tell you.** The current-loop mode's residue is $0.025$, a hundred times smaller than the two mechanical ones. A $20\,\mathrm{ms}$ torque transient barely moves a $0.8\,\mathrm{kg\,m^2}$ dish. If you wanted a two-state model for design, the modal form shows at a glance which state to drop.

One more check: $r_1 + r_2 + r_3 = 0$, to within round-off. That has to happen. For large $s$ the expansion looks like $(r_1 + r_2 + r_3)/s$, and this plant falls off like $1/s^3$, so the $1/s$ part must vanish.
:::

The code below builds all four and checks them against each other.

```python
import numpy as np

def tf(A, B, C, D, s):
    n = A.shape[0]
    return (C @ np.linalg.inv(s * np.eye(n) - A) @ B + D)[0, 0]

phys = (np.array([[0.0, 1, 0], [0, -0.5, 1.25], [0, 0, -50]]),
        np.array([[0.0], [0], [50]]), np.array([[1.0, 0, 0]]), np.array([[0.0]]))
ctrl = (np.array([[0.0, 1, 0], [0, 0, 1], [0, -25, -50.5]]),
        np.array([[0.0], [0], [1]]), np.array([[62.5, 0, 0]]), np.array([[0.0]]))
obsv = (ctrl[0].T, ctrl[2].T, ctrl[1].T, ctrl[3])
modal = (np.diag([0.0, -0.5, -50]), np.ones((3, 1)),
         np.array([[2.5, -62.5 / 24.75, 62.5 / 2475]]), np.array([[0.0]]))

for name, sys in [("physical", phys), ("controllable", ctrl),
                  ("observable", obsv), ("modal", modal)]:
    print(f"{name:13s} G(2) = {tf(*sys, 2.0):.6f}   eig = {np.sort(np.linalg.eigvals(sys[0]).real)}")
# physical      G(2) = 0.240385   eig = [-50.   -0.5   0. ]
# controllable  G(2) = 0.240385   eig = [-50.   -0.5   0. ]
# observable    G(2) = 0.240385   eig = [-50.   -0.5   0. ]
# modal         G(2) = 0.240385   eig = [-50.   -0.5   0. ]
```

::: warning Companion forms are for deriving, not for computing
The controllable and observable canonical forms are wonderful on paper and dangerous in a computer. A companion matrix packs the whole characteristic polynomial into one row, and polynomial coefficients are a badly **[[ill-conditioned|wilkinson]]** way to store roots: a tiny change in a coefficient can move a root a long way. For $n$ above roughly ten, a change in the last decimal place of one coefficient can move a pole by a visible amount. Use these forms to derive Ackermann's formula in Lesson 6 and to understand what a realization is. Build flight models from the physics, where each entry is a physical quantity you can check, or in modal form, where each block is one well-separated mode.
:::

## The same shapes work with many inputs and outputs

Nothing above needed one input and one output, except the canonical forms. The state-space equations handle many of each without any change. Here is a plant with six states, four inputs and three outputs.

A three-axis spacecraft carries four **reaction wheels** — heavy spinning wheels whose motors push back on the spacecraft, so speeding a wheel up turns the body the other way. They sit in the standard **[[pyramid|pyramid-geometry]]**. Each wheel's spin axis is tilted $54.74^\circ$ away from the body $+z$ axis, at compass directions (**azimuths**) of $45^\circ$, $135^\circ$, $225^\circ$ and $315^\circ$. That makes the four unit axes the cube diagonals $(\pm1,\pm1,1)/\sqrt{3}$.

Stack the four axes as the columns of a $3\times4$ **distribution matrix** $\mathbf{A}_w$. Then four wheel torques $\mathbf{u}\in\mathbb{R}^4$ produce a body torque $\boldsymbol{\tau} = \mathbf{A}_w\mathbf{u}$.

::: example A six-state, four-input spacecraft
**Linearize** about rest — keep only the terms that matter for small angles and small rates. With body rates $\boldsymbol{\omega}$ and small attitude angles $\boldsymbol{\theta}$:

- the kinematics become $\dot{\boldsymbol{\theta}} = \boldsymbol{\omega}$;
- the dynamics become $\mathbf{J}\dot{\boldsymbol{\omega}} = \boldsymbol{\tau}$, because the **[[gyroscopic term|gyroscopic-term]]** $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ is a product of two small rates and drops out.

Take $\mathbf{x} = (\boldsymbol{\theta},\boldsymbol{\omega})^\mathsf{T} \in \mathbb{R}^6$ and inertia $\mathbf{J} = \operatorname{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$. Then

$$\mathbf{A} = \begin{pmatrix} \mathbf{0}_{3\times3} & \mathbf{I}_3 \\ \mathbf{0}_{3\times3} & \mathbf{0}_{3\times3}\end{pmatrix}, \qquad \mathbf{B} = \begin{pmatrix} \mathbf{0}_{3\times4} \\ \mathbf{J}^{-1}\mathbf{A}_w \end{pmatrix}.$$

The top row of blocks says "angle rate equals body rate". The bottom row says "body rate changes by torque over inertia". So $n = 6$, $m = 4$, and $\mathbf{B}$ is $6\times4$.

**A number.** Row 4 of $\mathbf{B}$ is the $x$-axis rate row. Its first entry — wheel 1's push on the $x$ rate — is $(1/\sqrt{3})/1200 = 4.811\times10^{-4}\,\mathrm{rad/(s^2\,N\,m)}$. The rows for $y$ and $z$ are divided by $1500$ and $2000$ instead. A wheel delivering its full $0.2\,\mathrm{N\,m}$ therefore gives

$$0.2 \times 4.811\times10^{-4} = 9.62\times10^{-5}\,\mathrm{rad/s^2}$$

about $x$. That is $5.5\times10^{-3}\ ^\circ/\mathrm{s^2}$. Spacecraft attitude control is a slow business.

**Outputs.** With a three-axis star tracker, $\mathbf{C} = (\mathbf{I}_3\ \ \mathbf{0}_{3\times3})$ and $p = 3$. With a rate gyro instead, $\mathbf{C} = (\mathbf{0}_{3\times3}\ \ \mathbf{I}_3)$. Either way $\mathbf{D} = \mathbf{0}$, and $\mathbf{G}(s)$ is $3\times4$: three outputs, four inputs, twelve transfer functions, every one with $\det(s\mathbf{I}-\mathbf{A}) = s^6$ underneath. Drawing twelve Bode plots is not a design method. Writing down $(\mathbf{A},\mathbf{B},\mathbf{C})$ is.

This model comes back in Lesson 4. There, failing wheels one at a time turns the rank of a matrix into a statement about which way the spacecraft can no longer turn.
:::

::: note More inputs than you need is a resource, not a problem
Four wheels for three axes means $\mathbf{A}_w$ has a one-dimensional **null space** — a direction of wheel torques that produces nothing. Here it is the vector $(1,-1,1,-1)/2$: spinning the four wheels up in that pattern makes no net body torque. That spare direction is on purpose. It lets the spacecraft survive one wheel failure. It also lets you steer wheel speeds away from zero, where bearing friction is worst, without disturbing the pointing. Choosing where in that null space to sit is called **control allocation**.
:::

## Check yourself

::: check
A launch vehicle model has eight states. Its engine gimbals in pitch and yaw. It measures pitch attitude, yaw attitude, pitch rate and yaw rate. What are the shapes of $\mathbf{A}$, $\mathbf{B}$, $\mathbf{C}$ and $\mathbf{D}$, and how many scalar transfer functions does $\mathbf{G}(s)$ contain?
:::

::: answer
Count first: $n = 8$ states, $m = 2$ inputs (pitch and yaw gimbal), $p = 4$ outputs. So $\mathbf{A}$ is $8\times8$, $\mathbf{B}$ is $8\times2$, $\mathbf{C}$ is $4\times8$ and $\mathbf{D}$ is $4\times2$.

The transfer matrix $\mathbf{G}(s) = \mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} + \mathbf{D}$ is $4\times2$, so it holds eight scalar transfer functions. Each has the same eighth-order denominator, $\det(s\mathbf{I}-\mathbf{A})$.

$\mathbf{D}$ is zero here. It would become nonzero if you added a sideways accelerometer mounted away from the center of mass, because deflecting the nozzle produces sideways acceleration at that spot with no delay.
:::

::: check
Write the controllable canonical realization of $G(s) = (2s + 6)/(s^2 + 5s + 6)$, and then its observable canonical realization. Verify both at $s = 1$.
:::

::: answer
Match coefficients: $a_0 = 6$, $a_1 = 5$, $b_0 = 6$, $b_1 = 2$. So

$$\mathbf{A}_c = \begin{pmatrix} 0 & 1 \\ -6 & -5\end{pmatrix},\quad \mathbf{B}_c = \begin{pmatrix}0\\1\end{pmatrix},\quad \mathbf{C}_c = \begin{pmatrix}6 & 2\end{pmatrix}.$$

The observable form is the transpose set: $\mathbf{A}_o = \begin{pmatrix} 0 & -6 \\ 1 & -5\end{pmatrix}$, $\mathbf{B}_o = (6,\ 2)^\mathsf{T}$, $\mathbf{C}_o = (0\ \ 1)$.

At $s = 1$ the transfer function is $(2+6)/(1+5+6) = 8/12 = 0.667$.

For the controllable form, $(s\mathbf{I}-\mathbf{A}_c)^{-1}\mathbf{B}_c$ at $s = 1$ is the solution $\mathbf{x}$ of $\begin{pmatrix}1 & -1 \\ 6 & 6\end{pmatrix}\mathbf{x} = \begin{pmatrix}0\\1\end{pmatrix}$. The top row says $x_1 = x_2$; the bottom then gives $12x_1 = 1$. So $\mathbf{x} = (1/12,\ 1/12)^\mathsf{T}$, and $\mathbf{C}_c\mathbf{x} = (6+2)/12 = 0.667$. It matches.

The observable form gives the same number, because it is the transpose of a single number.
:::

::: check
Why does every entry of $\mathbf{G}(s)$ share the same denominator? And why can an eigenvalue of $\mathbf{A}$ still fail to appear as a pole of $\mathbf{G}(s)$?
:::

::: answer
Because $(s\mathbf{I}-\mathbf{A})^{-1} = \operatorname{adj}(s\mathbf{I}-\mathbf{A})/\det(s\mathbf{I}-\mathbf{A})$, and the entries of the adjugate are polynomials. So every entry of $\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$ is a polynomial over $\det(s\mathbf{I}-\mathbf{A})$, the characteristic polynomial.

An eigenvalue drops out when its factor cancels against the top of the fraction. That happens when its mode cannot be reached from the input, or cannot be seen at the output. The transfer matrix then describes a smaller system than $\mathbf{A}$ does. But the hidden mode is still there, still evolving, and still able to blow up. That is exactly why this module tests controllability and observability instead of trusting $\mathbf{G}(s)$.
:::

::: check
A structural engineer hands you a solar array model as three lightly damped modes at $0.35$, $1.8$ and $4.6\,\mathrm{Hz}$. Which realization is this, what is $n$, and what does the $2\times2$ block for the first mode look like? Take its damping ratio to be $\zeta = 0.005$.
:::

::: answer
It is the modal form, in its real block-diagonal version. Each vibration mode is second order, so three modes give $n = 6$.

For the first mode, the natural frequency is $\omega_n = 2\pi(0.35) = 2.199\,\mathrm{rad/s}$. With damping ratio $\zeta = 0.005$ ("zeta"), its eigenvalues are

$$-\zeta\omega_n \pm i\omega_n\sqrt{1-\zeta^2} = -0.0110 \pm 2.199i\ \mathrm{s^{-1}},$$

and the real block is $\begin{pmatrix}-0.0110 & 2.199 \\ -2.199 & -0.0110\end{pmatrix}$.

The whole $\mathbf{A}$ is block diagonal with three such blocks, so the three modes never trade energy inside the model. All the coupling lives in $\mathbf{B}$ and $\mathbf{C}$ — how hard each input shakes each mode, and how much each mode shows in each sensor.
:::

::: check
The gimbal's physical state is $(\theta, \omega, \tau)$ with units $\mathrm{rad}$, $\mathrm{rad/s}$, $\mathrm{N\,m}$. What are the units of the controllable-canonical state $x_1$, and why is that awkward?
:::

::: answer
Work up the chain from the input. In the controllable form the torque command $u$ (in $\mathrm{N\,m}$) enters $\dot{x}_3$ with coefficient $1$, so $x_3$ has units $\mathrm{N\,m\,s}$. Each earlier state is one more integration: $x_2$ is in $\mathrm{N\,m\,s^2}$ and $x_1$ in $\mathrm{N\,m\,s^3}$. Check with the output: $y = 62.5\,x_1$, and $62.5$ is in $\mathrm{rad/(N\,m\,s^3)}$, so $y$ comes out in $\mathrm{rad}$, as it must.

So $x_1$ is the helper signal $v$, not a physical quantity. Nothing is wrong mathematically. But you can no longer compare an entry with a measurement, start the state from telemetry, or put a meaningful limit on it. That is the practical cost of leaving the physical realization, and it is why flight software almost always carries physical states, even when the gains were designed in a canonical form.
:::

## Summary

| Item | Statement |
| --- | --- |
| State-space form | $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, $\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}$ |
| Dimensions | $\mathbf{A}$: $n\times n$; $\mathbf{B}$: $n\times m$; $\mathbf{C}$: $p\times n$; $\mathbf{D}$: $p\times m$ |
| Units | $[a_{ij}] = [x_i]/([x_j]\,\mathrm{s})$; eigenvalues of $\mathbf{A}$ in $\mathrm{s^{-1}}$ |
| Transfer matrix | $\mathbf{G}(s) = \mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} + \mathbf{D}$, size $p\times m$, common denominator $\det(s\mathbf{I}-\mathbf{A})$ |
| Realization | any $(\mathbf{A},\mathbf{B},\mathbf{C},\mathbf{D})$ with that transfer matrix; **minimal** means smallest $n$ |
| Controllable canonical | companion $\mathbf{A}_c$ with $-a_i$ in the last row, $\mathbf{B}_c = (0\cdots0\,1)^\mathsf{T}$, $\mathbf{C}_c = (b_0\cdots b_{n-1})$ |
| Observable canonical | the transpose set: $\mathbf{A}_o = \mathbf{A}_c^\mathsf{T}$, $\mathbf{B}_o = \mathbf{C}_c^\mathsf{T}$, $\mathbf{C}_o = \mathbf{B}_c^\mathsf{T}$ |
| Modal | $\mathbf{A}_m = \operatorname{diag}(\lambda_i)$, $\mathbf{B}_m = \mathbf{1}$, $\mathbf{C}_m = (r_i)$ from $G(s) = \sum_i r_i/(s-\lambda_i)$ |
| Gimbal example | $\lambda = 0,\ -0.5,\ -50\,\mathrm{s^{-1}}$; $G(s) = 62.5/(s(s+0.5)(s+50))$; residues $2.5,\ -2.525,\ 0.02525$ |
| Numerics | companion forms are ill-conditioned for large $n$; build flight models from physics or in modal form |

Four sets of matrices described one gimbal, and all four gave the same answer. The next lesson makes that precise: the map between realizations is a **similarity transformation**, and the list of things that survive it is the list of things that belong to the vehicle rather than to your choice of state.

::: context what-state-means Why "state" is the right word
Think of a board game saved halfway through. To pick it up tomorrow you need the position of every piece and whose turn it is — nothing about the moves that got there. That saved position is the game's state.

A physical system works the same way. For a mass on a spring you need position and velocity. Add a motor with a lagging current and you need the current too. A good test: if two copies of the system share the same state and get the same commands from now on, they must do exactly the same thing forever. If they could still differ, your state is missing something.
:::

::: context laplace-recap The Laplace transform in one line
You met the Laplace transform in the signals and systems module. The one fact this lesson uses: if a signal $x(t)$ starts at zero, its derivative $\dot{x}$ transforms to $s\,X(s)$. Differentiating becomes multiplying by $s$, and integrating becomes dividing by $s$. That turns differential equations into algebra, which is why transfer functions are ratios of polynomials in $s$. For a vector of signals the same rule applies to each entry at once.
:::

::: context harmonic-drive What a harmonic drive is
A **harmonic drive** is a compact gearbox that gives a very large gear reduction, often 50:1 to 160:1, in one small stage, with almost no play between the teeth. Inside, a flexible toothed cup is squeezed into an oval by a spinning cam, so its teeth mesh with a rigid ring gear at two points that walk around the circle. It is popular in spacecraft mechanisms and robot arms because precise pointing needs a gear with no slop. The price is some friction and a little springiness, which is part of why our gimbal model has a drag term.
:::

::: context stiff-model What "stiff" means for a model
A model is **stiff** when it has some very fast modes and some very slow ones at the same time. The gimbal's current loop settles in about $0.1\,\mathrm{s}$; its bearing drag takes about $10\,\mathrm{s}$. A simple step-by-step simulator must take tiny steps to follow the fast mode, even long after that mode has died out, or it goes unstable. You will see exactly this in Lesson 3, where a forward-Euler step that is too long turns the gimbal's current loop into a mode that grows fourfold every step.
:::

::: context gimbal-chain The gimbal as a chain of blocks
The three equations feed into each other in a line, so the transfer function is the product of three simple blocks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="34" y="30" width="72" height="36" rx="4"/>
    <rect x="144" y="30" width="80" height="36" rx="4"/>
    <rect x="262" y="30" width="44" height="36" rx="4"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="2" fill="#1d6fd1">
    <line x1="6" y1="48" x2="28" y2="48"/><polygon points="34,48 27,44 27,52"/>
    <line x1="106" y1="48" x2="138" y2="48"/><polygon points="144,48 137,44 137,52"/>
    <line x1="224" y1="48" x2="256" y2="48"/><polygon points="262,48 255,44 255,52"/>
    <line x1="306" y1="48" x2="346" y2="48"/><polygon points="352,48 345,44 345,52"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="70" y="53">50/(s+50)</text>
    <text x="184" y="53">1.25/(s+0.5)</text>
    <text x="284" y="53">1/s</text>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="14" y="36">u</text><text x="125" y="36">τ</text><text x="243" y="36">ω</text><text x="330" y="36">θ</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="70" y="86">current loop</text><text x="184" y="86">inertia + drag</text><text x="284" y="86">integrate</text>
  </g>
</svg>
```

Multiply the three: $50 \times 1.25 = 62.5$ on top, and $s(s+0.5)(s+50)$ underneath.
:::

::: context companion-roots Your calculator uses a companion matrix
The link between a polynomial and its companion matrix runs both ways. The eigenvalues of a companion matrix are exactly the roots of its polynomial. So one standard way to find the roots of a polynomial is to build its companion matrix and hand it to an eigenvalue routine. NumPy's `np.roots` does precisely that. The name "companion" is apt: every monic polynomial has one matrix that travels with it and carries the same roots.
:::

::: context duality-bridge Duality, previewed
In the observable form, the numbers that were in $\mathbf{B}$ move into $\mathbf{C}$, and $\mathbf{A}$ is flipped across its diagonal. This mirror image runs through the whole module. In Lesson 5 you will see that "can the input reach every state?" and "can the output see every state?" are the same question asked of the matrices $(\mathbf{A},\mathbf{B})$ and $(\mathbf{A}^\mathsf{T},\mathbf{C}^\mathsf{T})$. Each controller result then hands you an observer result for free.
:::

::: context parallel-modes The modal form as parallel channels
In modal form the input feeds several separate first-order blocks side by side, and the output adds their results. Here is the gimbal, with its residues.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <line x1="10" y1="75" x2="50" y2="75"/>
    <line x1="50" y1="25" x2="50" y2="125"/>
    <line x1="50" y1="25" x2="82" y2="25"/><line x1="50" y1="75" x2="82" y2="75"/><line x1="50" y1="125" x2="82" y2="125"/>
    <line x1="232" y1="25" x2="290" y2="25"/><line x1="290" y1="25" x2="296" y2="66"/>
    <line x1="232" y1="75" x2="286" y2="75"/>
    <line x1="232" y1="125" x2="290" y2="125"/><line x1="290" y1="125" x2="296" y2="84"/>
    <line x1="314" y1="75" x2="344" y2="75"/>
  </g>
  <polygon points="350,75 343,71 343,79" fill="#1d6fd1"/>
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="82" y="10" width="150" height="30" rx="4"/>
    <rect x="82" y="60" width="150" height="30" rx="4"/>
    <rect x="82" y="110" width="150" height="30" rx="4"/>
    <circle cx="300" cy="75" r="14"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="157" y="30">2.5 / s</text>
    <text x="157" y="80">−2.525 / (s + 0.5)</text>
    <text x="157" y="130">0.02525 / (s + 50)</text>
    <text x="300" y="80">+</text>
    <text x="20" y="66">u</text><text x="336" y="66">y</text>
  </g>
</svg>
```

The bottom channel is the current loop. Its residue is a hundred times smaller than the others, so it adds almost nothing to the output.
:::

::: context wilkinson Wilkinson's warning
In the late 1950s the numerical analyst James Wilkinson studied the polynomial with roots $1, 2, 3, \ldots, 20$. Multiplied out, one coefficient is $-210$. He changed that one coefficient by $2^{-23}$, less than one part in a billion of its size, and several of the roots moved a long way — some pairs even became complex. He later called it the most traumatic experience of his career as a numerical analyst. The lesson stuck: a list of polynomial coefficients is a fragile way to hold a set of roots, and a companion matrix is exactly such a list.
:::

::: context pyramid-geometry The four-wheel pyramid
Looking down the body $z$ axis, the four wheel axes point to the four diagonal corners. From the side, each axis leans $54.74^\circ$ away from $z$ — the angle between a cube's diagonal and one of its edges, $\arccos(1/\sqrt{3})$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3">
    <line x1="30" y1="105" x2="190" y2="105"/><line x1="110" y1="25" x2="110" y2="185"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="110" y1="105" x2="150.4" y2="64.6"/><line x1="110" y1="105" x2="69.6" y2="64.6"/>
    <line x1="110" y1="105" x2="69.6" y2="145.4"/><line x1="110" y1="105" x2="150.4" y2="145.4"/>
  </g>
  <g fill="#1d6fd1"><circle cx="150.4" cy="64.6" r="4"/><circle cx="69.6" cy="64.6" r="4"/><circle cx="69.6" cy="145.4" r="4"/><circle cx="150.4" cy="145.4" r="4"/></g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="162" y="56">1 (45°)</text><text x="58" y="56">2 (135°)</text><text x="58" y="164">3 (225°)</text><text x="162" y="164">4 (315°)</text>
    <text x="196" y="109">x</text><text x="110" y="19">y</text>
    <text x="110" y="202">top view, z out of page</text>
  </g>
  <line x1="280" y1="170" x2="280" y2="40" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="240" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="280" y1="170" x2="345.3" y2="123.8" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="345.3" cy="123.8" r="4" fill="#1d6fd1"/>
  <path d="M280,130 A40,40 0 0,1 312.7,146.9" fill="none" stroke="#b4232c" stroke-width="2"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="280" y="33">z</text>
    <text x="302" y="122" fill="#b4232c">54.74°</text>
    <text x="290" y="202">side view</text>
  </g>
</svg>
```
:::

::: context gyroscopic-term Why the gyroscopic term drops out
The full rotational equation is $\mathbf{J}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} = \boldsymbol{\tau}$. The second term multiplies rate by rate. If the rates are around $0.01\,\mathrm{rad/s}$, that term is around $10^{-4}$ times the inertia — a small number times a small number. Linearizing keeps only terms that are first order in small quantities, so it goes. That is fine for holding pointing. But when the body is really spinning, this term couples the axes together — an effect the linear model cannot see. Lesson 4 comes back to it.
:::
