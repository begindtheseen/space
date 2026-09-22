---
id: l01-state-space-models-and-realizations
title: State-space models and their realizations
minutes: 19
covers:
  - "State-space representation and realizations: controllable canonical, observable canonical, modal"
---

Classical control gave you one loop at a time: a scalar plant $G(s)$, a scalar controller, a Bode plot, a margin. That works while the vehicle behaves like a stack of independent channels. It stops working the moment the channels talk to each other — when a yaw command tips a momentum-biased spacecraft in roll, when an aileron deflection produces as much yaw as it does roll, when a pitch manoeuvre on a launch vehicle drives the lateral drift you also have to control. A transfer function has one input and one output. A vehicle has neither.

State space is the bookkeeping that handles the whole coupled plant at once. You write down a vector $\mathbf{x}$ of everything the system needs to remember, a matrix equation for how that vector moves, and a second equation for what your sensors see. Everything after this — controllability, observability, pole placement, observers, the Kalman filter two tiers up — is stated in that notation, and the estimation tier depends on it completely. A Kalman filter is not a frequency-domain object; it lives entirely in $(\mathbf{A}, \mathbf{B}, \mathbf{C})$.

This lesson defines the state-space quadruple and its dimensions, derives the transfer matrix from it, then builds four different state-space models of one physical device — an antenna pointing gimbal — and shows that all four produce exactly the same input-output behaviour. Those four are its **realizations**, and knowing which one to use for which job is the first practical skill of this module.

## The state-space quadruple

A linear time-invariant continuous-time system is four matrices:

$$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}, \qquad \mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}.$$

The **state** $\mathbf{x} \in \mathbb{R}^n$ is the smallest set of numbers that, together with the future input, determines the future output. The **input** $\mathbf{u} \in \mathbb{R}^m$ is what you command; the **output** $\mathbf{y} \in \mathbb{R}^p$ is what you measure. Then $\mathbf{A}$ is $n\times n$ and holds the dynamics, $\mathbf{B}$ is $n\times m$ and maps commands into state derivatives, $\mathbf{C}$ is $p\times n$ and maps states into measurements, and $\mathbf{D}$ is $p\times m$ and is the direct feed-through from command to measurement.

::: key State-space form
$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, $\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}$. $\mathbf{A}$ is $n\times n$ (dynamics), $\mathbf{B}$ is $n\times m$ (input map), $\mathbf{C}$ is $p\times n$ (measurement map), $\mathbf{D}$ is $p\times m$ (feed-through, usually zero for a physical plant).
:::

Units follow from the equations and are worth checking every time you build a model. Every term in row $i$ of the state equation carries the units of $\dot{x}_i$, so $a_{ij}$ has units of $[x_i]/([x_j]\,\mathrm{s})$ and $b_{ij}$ has units of $[x_i]/([u_j]\,\mathrm{s})$. In $\mathbf{C}$, $c_{ij}$ has units $[y_i]/[x_j]$. The eigenvalues of $\mathbf{A}$ always come out in $\mathrm{s^{-1}}$ no matter what the states are measured in, a fact the next lesson explains properly.

$\mathbf{D}$ is zero for most physical plants, because a torque applied now cannot move an angle now — it takes time to integrate. It is non-zero when a sensor reads something algebraically related to the command: an accelerometer mounted off the centre of mass sees the control acceleration instantly, and a model that includes a feed-forward path has a $\mathbf{D}$ term. When $\mathbf{D} \ne 0$ the plant has relative degree zero and its high-frequency gain does not roll off, which matters for noise.

### From state space to a transfer matrix

Take the Laplace transform of both equations with $\mathbf{x}(0) = \mathbf{0}$. The state equation becomes $s\mathbf{X}(s) = \mathbf{A}\mathbf{X}(s) + \mathbf{B}\mathbf{U}(s)$, so $(s\mathbf{I} - \mathbf{A})\mathbf{X} = \mathbf{B}\mathbf{U}$ and $\mathbf{X} = (s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B}\mathbf{U}$. Substituting into the output equation,

$$\mathbf{Y}(s) = \left[\mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B} + \mathbf{D}\right]\mathbf{U}(s) \equiv \mathbf{G}(s)\mathbf{U}(s).$$

$\mathbf{G}(s)$ is the $p\times m$ **transfer matrix**: entry $G_{ij}(s)$ is the transfer function from input $j$ to output $i$. Using the cofactor formula $(s\mathbf{I}-\mathbf{A})^{-1} = \operatorname{adj}(s\mathbf{I}-\mathbf{A})/\det(s\mathbf{I}-\mathbf{A})$, every entry of $\mathbf{G}$ has the characteristic polynomial $\det(s\mathbf{I}-\mathbf{A})$ as its denominator. So every pole of every channel is an eigenvalue of $\mathbf{A}$ — although the converse can fail, and the failure is exactly what Lessons 4 and 5 are about.

## Building a realization from the physics

The honest way to get a state-space model is to write the equations of motion and read the matrices off. Take a two-axis antenna pointing gimbal on a geostationary satellite. Per axis, the moving assembly (dish, feed, yoke) has inertia $J = 0.8\,\mathrm{kg\,m^2}$ about the gimbal axis. The bearing and harmonic drive contribute viscous friction $b = 0.4\,\mathrm{N\,m\,s/rad}$. The motor's current loop is fast but not instantaneous: the delivered torque $\tau$ chases the commanded torque $u$ with a first-order lag of $\tau_m = 0.02\,\mathrm{s}$. An encoder reads the gimbal angle $\theta$.

::: example The gimbal's physical realization
Three first-order equations describe the axis:

$$\dot{\theta} = \omega, \qquad J\dot{\omega} = \tau - b\,\omega, \qquad \tau_m\dot{\tau} = u - \tau.$$

Choose the state $\mathbf{x} = (\theta,\ \omega,\ \tau)^\mathsf{T}$ in $\mathrm{rad}$, $\mathrm{rad/s}$ and $\mathrm{N\,m}$. Dividing through,

$$\mathbf{A} = \begin{pmatrix} 0 & 1 & 0 \\ 0 & -b/J & 1/J \\ 0 & 0 & -1/\tau_m \end{pmatrix} = \begin{pmatrix} 0 & 1 & 0 \\ 0 & -0.5 & 1.25 \\ 0 & 0 & -50 \end{pmatrix}, \quad \mathbf{B} = \begin{pmatrix} 0 \\ 0 \\ 1/\tau_m \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \\ 50 \end{pmatrix},$$

with $\mathbf{C} = (1\ \ 0\ \ 0)$ and $\mathbf{D} = 0$. Here $n = 3$, $m = 1$, $p = 1$. Check the units: $a_{23} = 1/J = 1.25\,\mathrm{rad/(s^2\,N\,m)}$, which is $[\omega]/([\tau]\,\mathrm{s})$ as required; $b_3 = 50\,\mathrm{s^{-1}}$ is $[\tau]/([u]\,\mathrm{s})$.

$\mathbf{A}$ is upper triangular, so its eigenvalues are on the diagonal: $\lambda = 0,\ -0.5,\ -50\ \mathrm{s^{-1}}$. The zero is the free integration from rate to angle — the gimbal has no spring, so it holds any angle. The $-0.5\,\mathrm{s^{-1}}$ mode is the bearing drag with time constant $J/b = 2\,\mathrm{s}$; the $-50\,\mathrm{s^{-1}}$ mode is the current loop with time constant $20\,\mathrm{ms}$. A factor of 100 between the slowest non-zero mode and the fastest is normal in a mechanism model and is what makes the model stiff.

Now the transfer function. Because the equations chain, you can compose them: $\tau/u = 1/(\tau_m s + 1) = 50/(s+50)$ and $\theta/\tau = 1/(Js^2 + bs) = 1.25/(s(s+0.5))$, so

$$G(s) = \frac{62.5}{s\,(s+0.5)\,(s+50)} = \frac{62.5}{s^3 + 50.5\,s^2 + 25\,s}\ \ \mathrm{rad/(N\,m)}.$$

The gain $62.5 = 1/(J\tau_m)$ has units $\mathrm{rad/(N\,m\,s^3)}$. Evaluating $\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$ at $s = 2\,\mathrm{s^{-1}}$ numerically gives $0.240385$, and $62.5/(2\times 2.5\times 52) = 62.5/260 = 0.240385$: the two routes agree.
:::

## Realizations: many models, one plant

A **realization** of a transfer matrix $\mathbf{G}(s)$ is any quadruple $(\mathbf{A},\mathbf{B},\mathbf{C},\mathbf{D})$ with $\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} + \mathbf{D} = \mathbf{G}(s)$. There are infinitely many. Any invertible change of state coordinates produces another one (the next lesson), and you can always pad a model with extra states that the input never reaches or the output never sees. A realization with the smallest possible $n$ is **minimal**, and minimality turns out to be exactly controllability plus observability — the theorem lands in Lesson 5.

Three realizations have names because each makes one job easy. The following forms are for a strictly proper SISO plant

$$G(s) = \frac{b_{n-1}s^{n-1} + \cdots + b_1 s + b_0}{s^n + a_{n-1}s^{n-1} + \cdots + a_1 s + a_0},$$

where the denominator has been normalised so its leading coefficient is $1$.

### Controllable canonical form

Introduce an intermediate signal $v$ defined by $V(s) = U(s)/(s^n + a_{n-1}s^{n-1} + \cdots + a_0)$, so that $Y(s) = (b_{n-1}s^{n-1} + \cdots + b_0)V(s)$. In the time domain those two statements are

$$v^{(n)} + a_{n-1}v^{(n-1)} + \cdots + a_0 v = u, \qquad y = b_{n-1}v^{(n-1)} + \cdots + b_0 v.$$

Take the state to be $v$ and its derivatives: $x_1 = v$, $x_2 = \dot{v}$, …, $x_n = v^{(n-1)}$. Then $\dot{x}_i = x_{i+1}$ for $i < n$, and the differential equation supplies the last row:

$$\mathbf{A}_c = \begin{pmatrix} 0 & 1 & 0 & \cdots & 0 \\ 0 & 0 & 1 & \cdots & 0 \\ \vdots & & & \ddots & \vdots \\ 0 & 0 & 0 & \cdots & 1 \\ -a_0 & -a_1 & -a_2 & \cdots & -a_{n-1} \end{pmatrix}, \quad \mathbf{B}_c = \begin{pmatrix} 0 \\ 0 \\ \vdots \\ 0 \\ 1 \end{pmatrix}, \quad \mathbf{C}_c = \begin{pmatrix} b_0 & b_1 & \cdots & b_{n-1}\end{pmatrix}.$$

This is a **companion matrix**: the denominator coefficients sit in the bottom row with a sign flip, so you can read the characteristic polynomial straight off the model. That is why pole placement formulas are derived in this form — putting the poles where you want becomes arithmetic on one row. It is also the form to reach for when you are handed a transfer function and need a state-space model.

### Observable canonical form

For a SISO plant $G(s)$ is a scalar, so $G(s) = G(s)^\mathsf{T} = \mathbf{B}^\mathsf{T}(s\mathbf{I}-\mathbf{A}^\mathsf{T})^{-1}\mathbf{C}^\mathsf{T}$. Transposing a realization therefore gives another realization of the same plant. Applying that to the controllable canonical form gives the **observable canonical form**

$$\mathbf{A}_o = \mathbf{A}_c^\mathsf{T}, \qquad \mathbf{B}_o = \mathbf{C}_c^\mathsf{T}, \qquad \mathbf{C}_o = \mathbf{B}_c^\mathsf{T},$$

in which the denominator coefficients sit in the last **column** and $\mathbf{C}_o = (0\ \cdots\ 0\ \ 1)$. Observer gains are derived in this form for the mirror-image reason: the measurement touches exactly one state, so choosing the estimation-error poles is again arithmetic on one column. The transpose trick you have now seen twice is **duality**, and Lesson 5 makes it a theorem.

### Modal form

Expand $G(s)$ in partial fractions. If $\mathbf{A}$ has $n$ distinct eigenvalues $\lambda_i$ then

$$G(s) = \sum_{i=1}^{n}\frac{r_i}{s - \lambda_i}, \qquad r_i = \lim_{s\to\lambda_i}(s-\lambda_i)G(s),$$

and each term is a first-order system $\dot{z}_i = \lambda_i z_i + u$, $y_i = r_i z_i$. Stacking them,

$$\mathbf{A}_m = \operatorname{diag}(\lambda_1,\dots,\lambda_n), \qquad \mathbf{B}_m = (1\ \cdots\ 1)^\mathsf{T}, \qquad \mathbf{C}_m = (r_1\ \cdots\ r_n).$$

The state matrix is diagonal, the modes are completely decoupled, and the **residue** $r_i$ says how strongly mode $i$ shows up in the output. That makes the modal form the one to use when you want to see which dynamics matter — it is the front door to model reduction in Lesson 11, and it is the form in which a structural dynamicist will hand you a flexible-body model. When two eigenvalues coincide and the eigenvectors run out, the diagonal becomes a Jordan block with a $1$ above the diagonal; when a pair is complex the corresponding $2\times2$ block is usually written in the real form $\begin{pmatrix} \sigma & \omega \\ -\omega & \sigma\end{pmatrix}$ so that no complex arithmetic enters the flight code.

::: example Three canonical realizations of the same gimbal
For $G(s) = 62.5/(s^3 + 50.5s^2 + 25s)$: $a_0 = 0$, $a_1 = 25$, $a_2 = 50.5$, $b_0 = 62.5$, $b_1 = b_2 = 0$. So

$$\mathbf{A}_c = \begin{pmatrix} 0 & 1 & 0 \\ 0 & 0 & 1 \\ 0 & -25 & -50.5\end{pmatrix},\quad \mathbf{B}_c = \begin{pmatrix}0\\0\\1\end{pmatrix},\quad \mathbf{C}_c = \begin{pmatrix}62.5 & 0 & 0\end{pmatrix},$$

and the observable form is the transpose set: $\mathbf{A}_o = \mathbf{A}_c^\mathsf{T}$, $\mathbf{B}_o = (62.5,\ 0,\ 0)^\mathsf{T}$, $\mathbf{C}_o = (0\ \ 0\ \ 1)$.

For the modal form, the residues at $\lambda = 0,\ -0.5,\ -50$ are

$$r_1 = \frac{62.5}{(0.5)(50)} = 2.5,\quad r_2 = \frac{62.5}{(-0.5)(49.5)} = -2.525,\quad r_3 = \frac{62.5}{(-50)(-49.5)} = 0.02525,$$

giving $\mathbf{A}_m = \operatorname{diag}(0,\ -0.5,\ -50)$, $\mathbf{B}_m = (1,1,1)^\mathsf{T}$, $\mathbf{C}_m = (2.5,\ -2.525,\ 0.02525)$.

Evaluate all four models — physical, controllable, observable, modal — at $s = 2\,\mathrm{s^{-1}}$ and every one returns $0.240385\,\mathrm{rad/(N\,m)}$. They are the same plant.

The residues say something the other forms hide. The current-loop mode contributes a residue of $0.025$, a hundred times smaller than the two mechanical residues, because a $20\,\mathrm{ms}$ transient barely moves an $0.8\,\mathrm{kg\,m^2}$ dish. If you needed a two-state design model, the modal form tells you at a glance which state to drop. Notice also that $r_1 + r_2 + r_3 = 0$ to within round-off: with relative degree three the output cannot respond instantaneously, so the $1/s$ term of the expansion at large $s$ has to vanish.
:::

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
The controllable and observable canonical forms are wonderful on paper and dangerous in floating point. A companion matrix packs the entire characteristic polynomial into one row, and polynomial coefficients are an extremely ill-conditioned way to represent roots: for $n$ above roughly ten, a change in the last decimal place of one coefficient can move a pole by a visible amount. Use these forms to derive Ackermann's formula in Lesson 6 and to understand what a realization is. Build actual flight models from the physics, where each entry is a physical quantity you can check, or in modal form, where each block is one well-separated mode.
:::

## The shapes generalise to MIMO without changing

Nothing above needed $m = p = 1$ except the canonical forms. Take a three-axis spacecraft with four reaction wheels in the standard pyramid: each wheel's spin axis is canted $54.74^\circ$ from the body $+z$ axis, at azimuths $45^\circ$, $135^\circ$, $225^\circ$ and $315^\circ$, so the four unit axes are the cube diagonals $(\pm1,\pm1,1)/\sqrt{3}$. Stack them as the columns of a $3\times4$ distribution matrix $\mathbf{A}_w$, so that wheel torques $\mathbf{u}\in\mathbb{R}^4$ produce a body torque $\boldsymbol{\tau} = \mathbf{A}_w\mathbf{u}$.

::: example A six-state, four-input spacecraft
Linearise the attitude kinematics and dynamics about rest with small angles. With body rates $\boldsymbol{\omega}$ and small attitude angles $\boldsymbol{\theta}$, the kinematics reduce to $\dot{\boldsymbol{\theta}} = \boldsymbol{\omega}$ and the dynamics to $\mathbf{J}\dot{\boldsymbol{\omega}} = \boldsymbol{\tau}$, because the gyroscopic term $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ is second order in the rates and drops out. Taking $\mathbf{x} = (\boldsymbol{\theta},\boldsymbol{\omega})^\mathsf{T} \in \mathbb{R}^6$ and $\mathbf{J} = \operatorname{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$,

$$\mathbf{A} = \begin{pmatrix} \mathbf{0}_{3\times3} & \mathbf{I}_3 \\ \mathbf{0}_{3\times3} & \mathbf{0}_{3\times3}\end{pmatrix}, \qquad \mathbf{B} = \begin{pmatrix} \mathbf{0}_{3\times4} \\ \mathbf{J}^{-1}\mathbf{A}_w \end{pmatrix}.$$

So $n = 6$, $m = 4$, and $\mathbf{B}$ is $6\times4$. Its bottom-left entry is $(1/\sqrt{3})/1200 = 4.811\times10^{-4}\,\mathrm{rad/(s^2\,N\,m)}$; the bottom-right block rows scale as $1/1200$, $1/1500$, $1/2000$. A wheel delivering its full $0.2\,\mathrm{N\,m}$ therefore produces $0.2 \times 4.811\times10^{-4} = 9.62\times10^{-5}\,\mathrm{rad/s^2}$ about $x$, which is $5.5\times10^{-3}\ ^\circ/\mathrm{s^2}$ — a reminder that spacecraft attitude control is a slow business.

With a three-axis star tracker, $\mathbf{C} = (\mathbf{I}_3\ \ \mathbf{0}_{3\times3})$ and $p = 3$; with a rate gyro instead, $\mathbf{C} = (\mathbf{0}_{3\times3}\ \ \mathbf{I}_3)$. Either way $\mathbf{D} = \mathbf{0}$ and $\mathbf{G}(s)$ is $3\times4$: three outputs, four inputs, twelve scalar transfer functions, every one of them with $\det(s\mathbf{I}-\mathbf{A}) = s^6$ underneath. Writing twelve Bode plots is not a design method. Writing $(\mathbf{A},\mathbf{B},\mathbf{C})$ is.

This model comes back in Lesson 4, where failing wheels one at a time turns the rank of a matrix into a statement about which way the spacecraft can no longer turn.
:::

::: note More inputs than you need is a resource, not a problem
Four wheels for three axes means $\mathbf{A}_w$ has a one-dimensional null space — the vector $(1,-1,1,-1)/2$, which spins all four wheels in a pattern that produces no net body torque. That redundancy is deliberate: it lets you survive one wheel failure, and it lets you steer wheel speeds away from zero, where bearing friction is worst, without disturbing the attitude. Control allocation is the business of choosing where in that null space to sit.
:::

## Check yourself

::: check
A launch vehicle model has eight states, a gimballed engine deflecting in pitch and yaw, and measurements of pitch attitude, yaw attitude, pitch rate and yaw rate. What are the shapes of $\mathbf{A}$, $\mathbf{B}$, $\mathbf{C}$ and $\mathbf{D}$, and how many scalar transfer functions does $\mathbf{G}(s)$ contain?
:::

::: answer
$n = 8$, $m = 2$, $p = 4$. So $\mathbf{A}$ is $8\times8$, $\mathbf{B}$ is $8\times2$, $\mathbf{C}$ is $4\times8$ and $\mathbf{D}$ is $4\times2$. The transfer matrix $\mathbf{G}(s) = \mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} + \mathbf{D}$ is $4\times2$, so eight scalar transfer functions, each with the same eighth-order denominator $\det(s\mathbf{I}-\mathbf{A})$. $\mathbf{D}$ would be zero here; it would become non-zero if you added a lateral accelerometer mounted away from the centre of mass, because nozzle deflection produces lateral acceleration at that station with no delay.
:::

::: check
Write the controllable canonical realization of $G(s) = (2s + 6)/(s^2 + 5s + 6)$, and then its observable canonical realization. Verify both at $s = 1$.
:::

::: answer
Here $a_0 = 6$, $a_1 = 5$, $b_0 = 6$, $b_1 = 2$, so

$$\mathbf{A}_c = \begin{pmatrix} 0 & 1 \\ -6 & -5\end{pmatrix},\quad \mathbf{B}_c = \begin{pmatrix}0\\1\end{pmatrix},\quad \mathbf{C}_c = \begin{pmatrix}6 & 2\end{pmatrix},$$

and the observable form is $\mathbf{A}_o = \begin{pmatrix} 0 & -6 \\ 1 & -5\end{pmatrix}$, $\mathbf{B}_o = (6,\ 2)^\mathsf{T}$, $\mathbf{C}_o = (0\ \ 1)$. At $s = 1$ the transfer function is $(2+6)/(1+5+6) = 8/12 = 0.667$. For the controllable form, $(s\mathbf{I}-\mathbf{A}_c)^{-1}\mathbf{B}_c$ at $s = 1$ solves $\begin{pmatrix}1 & -1 \\ 6 & 6\end{pmatrix}\mathbf{x} = \begin{pmatrix}0\\1\end{pmatrix}$, giving $\mathbf{x} = (1/12,\ 1/12)^\mathsf{T}$, and $\mathbf{C}_c\mathbf{x} = (6+2)/12 = 0.667$. The observable form gives the same number because it is the transpose of a scalar.
:::

::: check
Why does every entry of $\mathbf{G}(s)$ share the same denominator, and why can an eigenvalue of $\mathbf{A}$ still fail to appear as a pole of $\mathbf{G}(s)$?
:::

::: answer
Because $(s\mathbf{I}-\mathbf{A})^{-1} = \operatorname{adj}(s\mathbf{I}-\mathbf{A})/\det(s\mathbf{I}-\mathbf{A})$, and the adjugate entries are polynomials. Every entry of $\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$ is therefore a polynomial over $\det(s\mathbf{I}-\mathbf{A})$, which is the characteristic polynomial. An eigenvalue drops out when its factor cancels against the numerator, which happens when the corresponding mode is either unreachable from the input or invisible at the output. The transfer matrix then describes a lower-order system than $\mathbf{A}$ does — and the hidden mode is still there, still evolving, and still able to diverge. That is precisely why this module tests controllability and observability instead of trusting $\mathbf{G}(s)$.
:::

::: check
A structural dynamicist hands you a solar array model as three lightly damped modes at $0.35$, $1.8$ and $4.6\,\mathrm{Hz}$. Which realization is this, what is $n$, and what does the $2\times2$ block for the first mode look like?
:::

::: answer
It is the modal form, written in its real block-diagonal version. Each mode is second order, so three modes give $n = 6$. The first mode has $\omega_n = 2\pi(0.35) = 2.199\,\mathrm{rad/s}$; with a damping ratio $\zeta = 0.005$ its eigenvalues are $-\zeta\omega_n \pm i\omega_n\sqrt{1-\zeta^2} = -0.0110 \pm 2.199i\ \mathrm{s^{-1}}$, and the real block is $\begin{pmatrix}-0.0110 & 2.199 \\ -2.199 & -0.0110\end{pmatrix}$. The whole $\mathbf{A}$ is block diagonal with three such blocks, so the three modes never exchange energy in the model — all the coupling lives in $\mathbf{B}$ and $\mathbf{C}$, as the modal participation and observation factors.
:::

::: check
The gimbal's physical state is $(\theta, \omega, \tau)$ with units $\mathrm{rad}$, $\mathrm{rad/s}$, $\mathrm{N\,m}$. What are the units of the controllable-canonical state $x_1$, and why is that awkward?
:::

::: answer
In the controllable canonical form $y = 62.5\,x_1$ with $y$ in $\mathrm{rad}$, so $x_1$ has units of $\mathrm{rad\,N\,m\,s^3}$ — it is the intermediate variable $v$, not a physical quantity. Its derivatives $x_2$ and $x_3$ carry one and two fewer powers of seconds. Nothing is wrong mathematically, but you lose the ability to sanity-check an entry against a measurement, to initialise the state from telemetry, or to put a physically meaningful bound on it. That is the practical cost of leaving the physical realization, and it is why flight software almost always carries physical states even when the gain design was done in a canonical form.
:::

## Summary

| Item | Statement |
| --- | --- |
| State-space form | $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, $\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}$ |
| Dimensions | $\mathbf{A}$: $n\times n$; $\mathbf{B}$: $n\times m$; $\mathbf{C}$: $p\times n$; $\mathbf{D}$: $p\times m$ |
| Transfer matrix | $\mathbf{G}(s) = \mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} + \mathbf{D}$, size $p\times m$, common denominator $\det(s\mathbf{I}-\mathbf{A})$ |
| Realization | any $(\mathbf{A},\mathbf{B},\mathbf{C},\mathbf{D})$ with that transfer matrix; **minimal** means smallest $n$ |
| Controllable canonical | companion $\mathbf{A}_c$ with $-a_i$ in the last row, $\mathbf{B}_c = (0\cdots0\,1)^\mathsf{T}$, $\mathbf{C}_c = (b_0\cdots b_{n-1})$ |
| Observable canonical | the transpose set: $\mathbf{A}_o = \mathbf{A}_c^\mathsf{T}$, $\mathbf{B}_o = \mathbf{C}_c^\mathsf{T}$, $\mathbf{C}_o = \mathbf{B}_c^\mathsf{T}$ |
| Modal | $\mathbf{A}_m = \operatorname{diag}(\lambda_i)$, $\mathbf{B}_m = \mathbf{1}$, $\mathbf{C}_m = (r_i)$ from $G(s) = \sum_i r_i/(s-\lambda_i)$ |
| Gimbal example | $\lambda = 0,\ -0.5,\ -50\,\mathrm{s^{-1}}$; $G(s) = 62.5/(s(s+0.5)(s+50))$; residues $2.5,\ -2.525,\ 0.02525$ |
| Numerics | companion forms are ill-conditioned for large $n$; build flight models from physics or in modal form |

Four matrices described one gimbal in four different sets of coordinates and gave the same answer every time. The next lesson makes that precise: the map between realizations is a similarity transform, and the list of quantities that survive it is the list of things that belong to the vehicle rather than to your choice of state.
