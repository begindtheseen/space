---
id: l02-matrix-exponential
title: The matrix exponential and the state transition matrix
minutes: 22
covers:
  - the matrix exponential and the state transition matrix
---

Put a hot cup of coffee on the table. It cools fast at first, then more and more slowly, because the rate it loses heat is proportional to how much hotter than the room it is. Any quantity whose rate of change is proportional to itself — cooling coffee, money earning interest, a decaying radioactive sample — follows the same curve: an exponential. In symbols, $\dot{x} = ax$ has the solution $x(t) = e^{at}x(0)$, and nobody thinks twice about it.

Now put four cups in a row, each touching its neighbors. Each cup's rate of change depends on *all* of them, not only on itself. That is $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ with a matrix $\mathbf{A}$, and it is how nearly every **[[linearized model|linearized]]** a GNC engineer writes down looks: a spring–mass–damper, attitude error under rate feedback, two spacecraft flying near each other, the error growth of an inertial navigator. The wonderful fact is that the answer has exactly the same form: $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$. The object $e^{\mathbf{A}t}$, read "e to the A t", is the **matrix exponential**, and it is the single most used matrix in estimation.

Here is why. A navigation filter does not run in continuous time. Every $\Delta t$ ("delta t", the time step) it must carry its state estimate and its uncertainty forward. For a linear time-invariant system, the matrix that does that is $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$ ("capital phi"), the **state transition matrix**. Get $\boldsymbol{\Phi}$ slightly wrong and the filter drifts. Compute it carelessly for a stiff system and it is not slightly wrong — it is garbage.

This lesson defines $e^{\mathbf{A}t}$, proves the handful of properties you will use, works the hand calculations that cover most textbook cases and many real ones, builds the state transition matrix and its companion for held inputs, and then explains how a computer gets the number reliably.

## From the scalar exponential to the matrix exponential

Start from the series you already know for an ordinary number $a$:

$$e^{at} = \sum_{k=0}^{\infty}\frac{(at)^k}{k!} = 1 + at + \frac{(at)^2}{2!} + \frac{(at)^3}{3!} + \cdots$$

Here $k!$, read "k **[[factorial|factorial-wins]]**", is $1\cdot 2\cdot 3\cdots k$, with $0! = 1$. This series converges — settles down to a finite value — for every $a$ and every $t$. Differentiating it term by term gives $a\,e^{at}$, which is exactly why $e^{at}x(0)$ solves $\dot{x} = ax$.

Now make the bold move. Replace the number $a$ with a square matrix $\mathbf{A}$, and keep $t$ an ordinary number (time):

$$e^{\mathbf{A}t} = \sum_{k=0}^{\infty} \frac{(\mathbf{A}t)^k}{k!} = \mathbf{I} + \mathbf{A}t + \frac{\mathbf{A}^2 t^2}{2!} + \frac{\mathbf{A}^3 t^3}{3!} + \cdots$$

Every term is an $n\times n$ matrix, so the sum is one too. The "1" became $\mathbf{I}$, the identity matrix.

Does it converge? Always. The **norm** $\|\mathbf{A}\|$ — the most $\mathbf{A}$ can stretch any vector — measures a matrix's size. The size of the $k$-th term is at most $\|\mathbf{A}\|^k t^k/k!$, and those ordinary numbers add up to $e^{\|\mathbf{A}\|t}$, which is finite. So the matrix series can never run off to infinity.

Two facts fall straight out of the definition:

- at $t = 0$ only the first term survives, so $e^{\mathbf{A}\cdot 0} = \mathbf{I}$;
- every term is built from powers of $\mathbf{A}$, so $e^{\mathbf{A}t}$ **commutes** with $\mathbf{A}$: $\mathbf{A}e^{\mathbf{A}t} = e^{\mathbf{A}t}\mathbf{A}$.

### Why it solves the equation

Differentiate the series with respect to $t$, one term at a time. The $k$-th term $\mathbf{A}^k t^k/k!$ becomes $\mathbf{A}^k\,k\,t^{k-1}/k!$. Cancel the $k$ against the $k!$ to leave $(k-1)!$, and pull one $\mathbf{A}$ out front:

$$\frac{d}{dt}e^{\mathbf{A}t} = \sum_{k=1}^{\infty} \frac{\mathbf{A}^k\,k\,t^{k-1}}{k!} = \mathbf{A}\sum_{k=1}^{\infty} \frac{\mathbf{A}^{k-1} t^{k-1}}{(k-1)!} = \mathbf{A}\,e^{\mathbf{A}t} = e^{\mathbf{A}t}\mathbf{A}.$$

The last sum is the original series again, only counted from a different starting letter. So $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$ gives $\dot{\mathbf{x}} = \mathbf{A}e^{\mathbf{A}t}\mathbf{x}(0) = \mathbf{A}\mathbf{x}$, and it starts at $\mathbf{x}(0)$. A linear differential equation with a given starting point has exactly one solution, so this is it.

::: key The matrix exponential and the linear system
$e^{\mathbf{A}t} = \sum_k (\mathbf{A}t)^k/k!$, and the solution of $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$. For an LTI system $e^{\mathbf{A}\Delta t}$ is the state transition matrix $\boldsymbol{\Phi}$ that carries the state across one step of length $\Delta t$.
:::

LTI stands for **linear time-invariant**: the matrix $\mathbf{A}$ does not change with time.

## Properties worth proving once

**Composition.** $e^{\mathbf{A}(t+s)} = e^{\mathbf{A}t}e^{\mathbf{A}s}$. Running the system for $t$ seconds and then $s$ more is the same as running it for $t + s$. (Both sides solve the same equation in $t$ and agree at $t = 0$, so they are the same.) You use this every time a filter takes two short steps instead of one long one.

**Inverse.** Put $s = -t$: $e^{\mathbf{A}t}e^{-\mathbf{A}t} = e^{\mathbf{0}} = \mathbf{I}$. So $\left(e^{\mathbf{A}t}\right)^{-1} = e^{-\mathbf{A}t}$. The matrix exponential *always* has an inverse, whatever $\mathbf{A}$ is. That is the math version of a physical fact: a linear system never loses information, so you can always run it backward in time.

**Determinant.** If $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$, then every power gives $\mathbf{A}^k\mathbf{v} = \lambda^k\mathbf{v}$, and summing the series gives $e^{\mathbf{A}t}\mathbf{v} = e^{\lambda t}\mathbf{v}$. So the eigenvalues of $e^{\mathbf{A}t}$ are $e^{\lambda_i t}$, with the same eigenvectors. The determinant is the product of the eigenvalues, and a product of exponentials is the exponential of the sum:

$$\det e^{\mathbf{A}t} = \prod_i e^{\lambda_i t} = e^{t\sum_i\lambda_i} = e^{\operatorname{tr}(\mathbf{A})\,t}.$$

This is never zero, which proves invertibility a second way. It also tells you how the system **[[squeezes volumes|trace-volume]]** in state space. An undamped mechanical system has $\operatorname{tr}\mathbf{A} = 0$ and keeps volumes the same; a damped one has a negative trace and shrinks them.

**Similarity.** If $\mathbf{A} = \mathbf{T}\mathbf{B}\mathbf{T}^{-1}$ for some invertible $\mathbf{T}$, then $\mathbf{A}^k = \mathbf{T}\mathbf{B}^k\mathbf{T}^{-1}$ for every $k$, because every inner $\mathbf{T}^{-1}\mathbf{T}$ cancels. Summing the series gives $e^{\mathbf{A}t} = \mathbf{T}e^{\mathbf{B}t}\mathbf{T}^{-1}$. This is the whole basis of the diagonalisation method below.

::: warning The exponential of a sum
$e^{\mathbf{A}+\mathbf{B}} = e^{\mathbf{A}}e^{\mathbf{B}}$ holds only when $\mathbf{A}\mathbf{B} = \mathbf{B}\mathbf{A}$. To see why, expand both sides as far as the squared terms. The left has $\tfrac{1}{2}(\mathbf{A}+\mathbf{B})^2 = \tfrac{1}{2}(\mathbf{A}^2 + \mathbf{A}\mathbf{B} + \mathbf{B}\mathbf{A} + \mathbf{B}^2)$. The right has $\tfrac{1}{2}\mathbf{A}^2 + \mathbf{A}\mathbf{B} + \tfrac{1}{2}\mathbf{B}^2$. They differ by $\tfrac{1}{2}(\mathbf{A}\mathbf{B} - \mathbf{B}\mathbf{A})$, which is zero only if the matrices commute. **[[Rotations|rotations-order]]** are the everyday case: two rotations about different axes do not commute, so you cannot exponentiate them separately and multiply. The same trap comes back in disguise when $\mathbf{A}$ changes with time, below.
:::

## Computing the exponential by hand

### Diagonalisable matrices

If $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ as in Lesson 1, the similarity property gives

$$e^{\mathbf{A}t} = \mathbf{V}e^{\boldsymbol{\Lambda}t}\mathbf{V}^{-1}, \qquad e^{\boldsymbol{\Lambda}t} = \operatorname{diag}\!\left(e^{\lambda_1 t}, \dots, e^{\lambda_n t}\right).$$

The exponential of a diagonal matrix is found one entry at a time, because every power of a diagonal matrix is diagonal with the entries raised to that power. So the recipe is the same one as in Lesson 1: switch to eigenvector coordinates, let each coordinate evolve as its own ordinary exponential $e^{\lambda_i t}$, switch back. If some $\lambda_i$ are complex, the $e^{\lambda_i t}$ are complex too — but for a real $\mathbf{A}$ the conjugate pairs recombine and the final matrix comes out real.

::: example The exponential of a damped second-order system
A mass on a spring with a damper obeys $\ddot{y} + 3\dot{y} + 2y = 0$. Take the state $\mathbf{x} = (y, \dot{y})^\mathsf{T}$, position and velocity. Then $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ with

$$\mathbf{A} = \begin{pmatrix} 0 & 1 \\ -2 & -3 \end{pmatrix}.$$

**Eigenvalues.** Trace $-3$, determinant $0\cdot(-3) - 1\cdot(-2) = 2$. So $\lambda^2 + 3\lambda + 2 = (\lambda + 1)(\lambda + 2) = 0$, giving $\lambda_1 = -1$ and $\lambda_2 = -2$.

**Eigenvectors.** For $\lambda_1 = -1$, the first row of $\mathbf{A} + \mathbf{I}$ is $(1, 1)$, so $\mathbf{v}_1 = (1, -1)^\mathsf{T}$. For $\lambda_2 = -2$, the first row of $\mathbf{A} + 2\mathbf{I}$ is $(2, 1)$, so $\mathbf{v}_2 = (1, -2)^\mathsf{T}$. That gives

$$\mathbf{V} = \begin{pmatrix} 1 & 1 \\ -1 & -2 \end{pmatrix}, \qquad \mathbf{V}^{-1} = \begin{pmatrix} 2 & 1 \\ -1 & -1 \end{pmatrix}.$$

(Check: $\det\mathbf{V} = -2 + 1 = -1$, and the $2\times 2$ inverse rule gives $\frac{1}{-1}\begin{pmatrix} -2 & -1 \\ 1 & 1 \end{pmatrix}$, which is the matrix shown.)

**Multiply out.**

$$e^{\mathbf{A}t} = \begin{pmatrix} 1 & 1 \\ -1 & -2 \end{pmatrix}\begin{pmatrix} e^{-t} & 0 \\ 0 & e^{-2t} \end{pmatrix}\begin{pmatrix} 2 & 1 \\ -1 & -1 \end{pmatrix} = \begin{pmatrix} 2e^{-t} - e^{-2t} & e^{-t} - e^{-2t} \\ -2e^{-t} + 2e^{-2t} & -e^{-t} + 2e^{-2t} \end{pmatrix}.$$

**Check at $t = 0$.** Every exponential is $1$, so the matrix is $\begin{pmatrix} 2-1 & 1-1 \\ -2+2 & -1+2 \end{pmatrix} = \mathbf{I}$, as it must be.

**At $t = 0.5\,\mathrm{s}$.** With $e^{-0.5} = 0.6065$ and $e^{-1} = 0.3679$,

$$e^{0.5\mathbf{A}} = \begin{pmatrix} 0.8452 & 0.2387 \\ -0.4773 & 0.1292 \end{pmatrix}.$$

Its determinant is $0.8452\times 0.1292 + 0.2387\times 0.4773 = 0.2231$, and $e^{\operatorname{tr}(\mathbf{A})t} = e^{-1.5} = 0.2231$. They match.

**What it means.** Release the mass from $\mathbf{x}(0) = (1, 0)^\mathsf{T}$ — pulled out one unit, at rest. Half a second later its state is the first column, $(0.845, -0.477)^\mathsf{T}$. It has moved back toward zero and is heading there at $0.477$ units per second. That makes sense for a spring pulling it home. The two exponentials $e^{-t}$ and $e^{-2t}$ are the two **modes** of the system; the next lesson is about reading them.
:::

### Nilpotent matrices: the series stops

A matrix is **nilpotent** if some power of it is exactly zero. Then the series has only a few terms, and the exponential is a polynomial in $t$. The double integrator from Lesson 1 is the case you will meet most:

$$\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}, \qquad \mathbf{A}^2 = \mathbf{0}, \qquad e^{\mathbf{A}t} = \mathbf{I} + \mathbf{A}t = \begin{pmatrix} 1 & t \\ 0 & 1 \end{pmatrix}.$$

With $\mathbf{x} = (p, v)^\mathsf{T}$, position and velocity, this says $p(t) = p_0 + v_0 t$ and $v(t) = v_0$: coasting at constant speed, as it should. Notice that this matrix is defective — it has no diagonalisation — and yet its exponential is the easiest one in the lesson. The series definition does not care about eigenvectors.

A three-state chain (position, velocity, acceleration) has $\mathbf{A}^3 = \mathbf{0}$, so $e^{\mathbf{A}t} = \mathbf{I} + \mathbf{A}t + \tfrac{1}{2}\mathbf{A}^2 t^2$. The $\tfrac{1}{2}\mathbf{A}^2t^2$ term produces the familiar $\tfrac{1}{2}at^2$ of school physics.

### Skew-symmetric matrices: the exponential is a rotation

From Linear Algebra I, the cross-product matrix $[\mathbf{k}\times]$ of a unit vector $\mathbf{k}$ is **skew-symmetric**: its transpose is its negative. Multiplying it out gives $[\mathbf{k}\times]^2 = \mathbf{k}\mathbf{k}^\mathsf{T} - \mathbf{I}$, and then $[\mathbf{k}\times]^3 = -[\mathbf{k}\times]$. So the powers repeat in a cycle, up to sign. Sort the series for $e^{[\mathbf{k}\times]\theta}$ into odd and even powers. The odd terms collect into the sine series, $\theta - \theta^3/3! + \cdots = \sin\theta$. The even terms (after the $\mathbf{I}$) collect into $\theta^2/2! - \theta^4/4! + \cdots = 1 - \cos\theta$. The result is

$$e^{[\mathbf{k}\times]\theta} = \mathbf{I} + \sin\theta\,[\mathbf{k}\times] + (1 - \cos\theta)\,[\mathbf{k}\times]^2.$$

This is the **[[Rodrigues rotation formula|rodrigues]]**: a rotation by angle $\theta$ about the axis $\mathbf{k}$.

It *has* to be a rotation. Since $[\mathbf{k}\times]^\mathsf{T} = -[\mathbf{k}\times]$, the transpose of the exponential is $e^{-[\mathbf{k}\times]\theta}$ — its inverse. A matrix whose transpose is its inverse is orthogonal: it keeps lengths. And its determinant is $e^{\operatorname{tr}([\mathbf{k}\times])\theta} = e^{0} = 1$, so it is a proper rotation, not a mirror image.

On a spacecraft spinning at a constant rate $\boldsymbol{\omega}$ ("omega", in $\mathrm{rad/s}$), the attitude change over $\Delta t$ is $e^{[\boldsymbol{\omega}\times]\Delta t}$: a rotation by $\|\boldsymbol{\omega}\|\Delta t$ about the spin axis $\hat{\boldsymbol{\omega}}$. For $\boldsymbol{\omega} = (0, 0, 0.3)\,\mathrm{rad/s}$ over one second, that is $0.3\,\mathrm{rad}$ about $z$:

$$e^{[\boldsymbol{\omega}\times]} = \begin{pmatrix} \cos 0.3 & -\sin 0.3 & 0 \\ \sin 0.3 & \cos 0.3 & 0 \\ 0 & 0 & 1 \end{pmatrix} = \begin{pmatrix} 0.9553 & -0.2955 & 0 \\ 0.2955 & 0.9553 & 0 \\ 0 & 0 & 1 \end{pmatrix}.$$

### Defective matrices with a nonzero eigenvalue

Here is how to handle the defective case in general. Write a $2\times 2$ **Jordan block** — a repeated eigenvalue with only one eigenvector — as $\mathbf{A} = \lambda\mathbf{I} + \mathbf{N}$, where $\mathbf{N} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$. The two pieces commute, because $\lambda\mathbf{I}$ commutes with everything. So the sum rule is allowed here, and $\mathbf{N}$ is nilpotent:

$$e^{\mathbf{A}t} = e^{\lambda t}e^{\mathbf{N}t} = e^{\lambda t}\begin{pmatrix} 1 & t \\ 0 & 1 \end{pmatrix}.$$

That entry $t\,e^{\lambda t}$ is the fingerprint of a repeated eigenvalue without a full set of eigenvectors. For $\lambda = -1$ and $t = 2\,\mathrm{s}$, the matrix is $e^{-2}\begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix} = 0.1353\begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$.

Every matrix, defective or not, can be brought by a similarity transform to a block-diagonal **Jordan form**, and each block is handled exactly like this. In practice you will let a library do it, for reasons that come at the end of the lesson.

## The state transition matrix

For the LTI system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$, the state transition matrix from time $t_0$ to time $t$ is

$$\boldsymbol{\Phi}(t, t_0) = e^{\mathbf{A}(t - t_0)}, \qquad \mathbf{x}(t) = \boldsymbol{\Phi}(t, t_0)\,\mathbf{x}(t_0).$$

Read $\boldsymbol{\Phi}(t, t_0)$ as "phi from $t_0$ to $t$". It inherits every property of the exponential:

- $\boldsymbol{\Phi}(t_0, t_0) = \mathbf{I}$ — no time, no change;
- $\boldsymbol{\Phi}(t_2, t_0) = \boldsymbol{\Phi}(t_2, t_1)\boldsymbol{\Phi}(t_1, t_0)$ — propagate in stages, reading right to left;
- $\boldsymbol{\Phi}(t_0, t) = \boldsymbol{\Phi}(t, t_0)^{-1}$ — going backward undoes going forward;
- $\dot{\boldsymbol{\Phi}} = \mathbf{A}\boldsymbol{\Phi}$.

For a filter with a fixed step, $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$ is one constant matrix, computed once. The state then moves forward as $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k$, where $k$ counts steps. The covariance — the filter's uncertainty — moves forward as $\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}$, a formula Lesson 5 derives.

When $\mathbf{A}$ changes with time, a state transition matrix still exists. It is the solution of $\dot{\boldsymbol{\Phi}} = \mathbf{A}(t)\boldsymbol{\Phi}$ starting from $\boldsymbol{\Phi}(t_0, t_0) = \mathbf{I}$, and an **[[EKF|ekf-phi]]** gets it by integrating that equation alongside the state. But it is *not* $e^{\int\mathbf{A}\,dt}$, unless the matrices $\mathbf{A}(t)$ at different times all commute with each other. This is the sum-rule warning in disguise, and it is a real source of errors in hand-built propagators.

### Inputs and the zero-order hold

Add an input — a thrust or a torque command $\mathbf{u}$ — and the system becomes $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}(t)$. Here is the trick for solving it, step by step.

1. Multiply through by $e^{-\mathbf{A}t}$.
2. Notice, using the product rule, that $\frac{d}{dt}\left(e^{-\mathbf{A}t}\mathbf{x}\right) = e^{-\mathbf{A}t}(\dot{\mathbf{x}} - \mathbf{A}\mathbf{x})$, and by the equation that equals $e^{-\mathbf{A}t}\mathbf{B}\mathbf{u}$.
3. Integrate both sides from $0$ to $t$, then multiply by $e^{\mathbf{A}t}$:

$$\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t-\tau)}\mathbf{B}\mathbf{u}(\tau)\,d\tau.$$

The first term is the **free response** — what the system does on its own. The second adds up the effect of the input at each earlier instant $\tau$ ("tau"), carried forward for the remaining time $t - \tau$.

A digital controller holds each command constant for a whole step. That is a **[[zero-order hold|zoh-picture]]**. Over one step, $\mathbf{u}(\tau) = \mathbf{u}_k$ is constant and comes out of the integral, which collapses to

$$\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k + \boldsymbol{\Gamma}\mathbf{u}_k, \qquad \boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}, \qquad \boldsymbol{\Gamma} = \int_0^{\Delta t} e^{\mathbf{A}\tau}\,d\tau\;\mathbf{B}.$$

$\boldsymbol{\Gamma}$ ("capital gamma") says how much one held input moves the state over one step.

::: example A braking descent with a held thrust command
A lander's vertical motion has state $(p, v)^\mathsf{T}$ — height and vertical velocity — and its input is a commanded net acceleration $a$. That is a double integrator: $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$ and $\mathbf{B} = (0, 1)^\mathsf{T}$.

**Find $\boldsymbol{\Gamma}$.** From the nilpotent section, $e^{\mathbf{A}\tau} = \begin{pmatrix} 1 & \tau \\ 0 & 1 \end{pmatrix}$. Multiply by $\mathbf{B}$, then integrate each entry:

$$\boldsymbol{\Gamma} = \int_0^{\Delta t}\begin{pmatrix} 1 & \tau \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 0 \\ 1 \end{pmatrix}d\tau = \int_0^{\Delta t}\begin{pmatrix} \tau \\ 1 \end{pmatrix}d\tau = \begin{pmatrix} \tfrac{1}{2}\Delta t^2 \\ \Delta t \end{pmatrix}.$$

**Plug in the step.** With a guidance step of $\Delta t = 2\,\mathrm{s}$: $\boldsymbol{\Phi} = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$ and $\boldsymbol{\Gamma} = (\tfrac{1}{2}\cdot 4,\ 2)^\mathsf{T} = (2, 2)^\mathsf{T}$.

**Propagate.** Take up as positive. The lander starts $100\,\mathrm{m}$ above the pad, descending at $5\,\mathrm{m/s}$, so $\mathbf{x}_0 = (100, -5)^\mathsf{T}$. It holds a net acceleration of $a = +1.5\,\mathrm{m/s^2}$ — thrust beating gravity, so it is braking:

$$\mathbf{x}_1 = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 100 \\ -5 \end{pmatrix} + \begin{pmatrix} 2 \\ 2 \end{pmatrix}(1.5) = \begin{pmatrix} 90 \\ -5 \end{pmatrix} + \begin{pmatrix} 3 \\ 3 \end{pmatrix} = \begin{pmatrix} 93\,\mathrm{m} \\ -2\,\mathrm{m/s} \end{pmatrix}.$$

**Sanity check.** The lander has dropped $7\,\mathrm{m}$ and slowed from $5$ to $2\,\mathrm{m/s}$. School physics agrees: $p_0 + v_0\Delta t + \tfrac{1}{2}a\Delta t^2 = 100 - 10 + 3 = 93$ and $v_0 + a\Delta t = -5 + 3 = -2$. The difference is that now it is one matrix update, which the flight software can apply to *any* linear model, not only this one.
:::

::: note Getting Φ and Γ in one call
Treat the held input as extra state that does not change: stack $(\mathbf{x}, \mathbf{u})$ with $\dot{\mathbf{u}} = \mathbf{0}$. The stacked system has the block dynamics matrix $\begin{pmatrix} \mathbf{A} & \mathbf{B} \\ \mathbf{0} & \mathbf{0} \end{pmatrix}$, and its exponential over $\Delta t$ is $\begin{pmatrix} \boldsymbol{\Phi} & \boldsymbol{\Gamma} \\ \mathbf{0} & \mathbf{I} \end{pmatrix}$ — both matrices from a single `expm`. For the lander above it returns $\begin{pmatrix} 1 & 2 & 2 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{pmatrix}$. The same trick, with a different stacked matrix, produces the discrete process-noise covariance $\mathbf{Q}$; it is known as **[[Van Loan's method|van-loan]]**.
:::

## Computing the exponential numerically

Diagonalisation is the right tool for understanding and for small hand problems. But libraries do not use it by default, for three reasons. A defective matrix has no $\mathbf{V}^{-1}$ at all. A *nearly* defective one has an ill-conditioned $\mathbf{V}$ (Lesson 10) that magnifies rounding errors. And the eigen-decomposition itself costs more than the alternative.

The plain Taylor series is not the default either, and the reason is worth seeing. Take the ordinary number $e^{-10}$, whose true value is $4.540\times 10^{-5}$. The terms $(-10)^k/k!$ alternate in sign and **[[grow before they shrink|term-sizes]]**: they climb until $k \approx 10$, where the term is $10^{10}/10! = 2756$, and only then start to fall. So the running totals swing wildly through the thousands:

- stopping at the $k = 10$ term, the sum is $1343$;
- at $k = 20$, it is $13.4$;
- at $k = 30$, it is $0.00097$ — still twenty times too big;
- only by $k = 40$ is it right to about four digits.

The final answer is what is left when numbers in the thousands cancel down to $10^{-5}$. That is about eight orders of magnitude of cancellation, and each order costs one of the roughly sixteen digits a float64 — the standard 64-bit computer number — carries. For an eigenvalue of $-1000$ and $t = 1$ it is far worse: the terms peak around $10^{432}$, far beyond the largest float64 (about $10^{308}$), so the computation overflows.

A **[[stiff|stiff-word]]** system — one whose eigenvalues span several orders of magnitude, like a fast actuator loop inside a slow vehicle loop — always has this problem. The step must be long enough for the interesting slow dynamics, and that makes $\|\mathbf{A}\Delta t\|$ large for the fast mode.

### Scaling and squaring

The fix uses the composition property backward. **Halve the problem until it is small, solve the small problem, then double back up.**

1. Choose a whole number $s$ so that $\|\mathbf{A}t\|/2^s \le 0.5$.
2. Evaluate the series for the small matrix $\mathbf{X} = \mathbf{A}t/2^s$. Its terms shrink from the start: with $\|\mathbf{X}\| \le 0.5$, the eighteenth term is below $10^{-21}$.
3. Square the result $s$ times:

$$e^{\mathbf{A}t} = \left(e^{\mathbf{A}t/2^s}\right)^{2^s}.$$

Squaring once doubles the time covered; squaring $s$ times multiplies it by $2^s$. Each squaring is one matrix product, and $s \approx \log_2\|\mathbf{A}t\|$, so the extra cost is tiny.

Production code replaces the Taylor polynomial with a **[[Padé approximant|pade]]** — a ratio of two matrix polynomials that matches the exponential more closely for the same degree, at the price of one linear solve — and picks the degree and $s$ together from a careful error analysis. That is what `scipy.linalg.expm` does. Whichever polynomial is used, the scaling step is what makes stiff systems tractable, as **[[the flow of the method|scaling-squaring]]** shows.

::: example Scaling and squaring on a stiff system
Take $\mathbf{A} = \begin{pmatrix} -1 & 0 \\ 0 & -1000 \end{pmatrix}\,\mathrm{s^{-1}}$ with a step $\Delta t = 0.01\,\mathrm{s}$.

**The target.** $\mathbf{A}\Delta t = \operatorname{diag}(-0.01, -10)$, so the exact answer is $\operatorname{diag}(e^{-0.01}, e^{-10}) = \operatorname{diag}(0.990050,\ 4.5400\times 10^{-5})$.

**Choose $s$.** The norm of $\mathbf{A}\Delta t$ is $10$. Try powers of two: $10/16 = 0.625$ is too big, $10/32 = 0.3125$ is fine. So $s = 5$ and $\|\mathbf{X}\| = 0.3125$.

**Series.** An eighteen-term Taylor series on $\mathbf{X} = \operatorname{diag}(-0.0003125, -0.3125)$ has a last term of at most $0.3125^{18}/18! \approx 10^{-25}$. The polynomial is essentially exact.

**Square back up.** Squaring five times raises it to the power $2^5 = 32$, and returns $\operatorname{diag}(0.9900498337,\ 4.53999\times 10^{-5})$. That matches the exact values to a relative error of about $1.5\times 10^{-15}$ — rounding level. Even cutting the series to eight terms gives a relative error of only $10^{-7}$ after the squarings. Most of the accuracy comes from the scaling, not from the length of the series.

**Without scaling.** Apply the same eighteen-term series straight to $\mathbf{A}\Delta t$. The $(2,2)$ entry is then the sum of $(-10)^k/k!$ for $k = 0$ to $17$, which comes out as about $-102$ — for a quantity whose true value is $4.5\times 10^{-5}$. The first dropped term alone is $10^{18}/18! \approx 156$. Same series, same matrix, same machine: only the scaling differs.
:::

## Check yourself

::: check
Write down $e^{\mathbf{A}t}$ at $t = 3\,\mathrm{s}$ for $\mathbf{A} = \operatorname{diag}(-1, 2)$, and for $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$.
:::

::: answer
**Diagonal.** A diagonal matrix exponentiates one entry at a time: $e^{\mathbf{A}t} = \operatorname{diag}(e^{-3}, e^{6}) = \operatorname{diag}(0.0498,\ 403.4)$. One direction has shrunk to five percent; the other has grown about four hundred times. The eigenvalue $+2$ is an instability.

**Double integrator.** This matrix is nilpotent with $\mathbf{A}^2 = \mathbf{0}$, so $e^{\mathbf{A}t} = \mathbf{I} + \mathbf{A}t = \begin{pmatrix} 1 & 3 \\ 0 & 1 \end{pmatrix}$. Position moves on by three seconds' worth of velocity; velocity is unchanged.
:::

::: check
Why is $e^{\mathbf{A}t}$ invertible for every square $\mathbf{A}$, and what does that mean for a filter?
:::

::: answer
Two proofs. First, $e^{\mathbf{A}t}e^{-\mathbf{A}t} = e^{\mathbf{0}} = \mathbf{I}$ shows the inverse directly. Second, $\det e^{\mathbf{A}t} = e^{\operatorname{tr}(\mathbf{A})t}$ is $e$ raised to a real number, which is never zero.

For a filter, it means the state transition matrix can always be inverted. You can run backward through stored data (smoothing), and one propagation step never merges two different states into one.

A caution: invertible does not mean *comfortably* invertible. For the stiff example, $\boldsymbol{\Phi}^{-1}$ has an entry $e^{10} \approx 22\,000$.
:::

::: check
Let $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$ and $\mathbf{B} = \begin{pmatrix} 0 & 0 \\ 1 & 0 \end{pmatrix}$. Compute $e^{\mathbf{A}}e^{\mathbf{B}}$ and $e^{\mathbf{A}+\mathbf{B}}$, and explain why they differ.
:::

::: answer
**The product.** Both matrices square to zero, so $e^{\mathbf{A}} = \mathbf{I} + \mathbf{A} = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ and $e^{\mathbf{B}} = \mathbf{I} + \mathbf{B} = \begin{pmatrix} 1 & 0 \\ 1 & 1 \end{pmatrix}$. Their product is $\begin{pmatrix} 2 & 1 \\ 1 & 1 \end{pmatrix}$.

**The sum.** $\mathbf{A} + \mathbf{B} = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$ is symmetric, with eigenvalues $\pm 1$ and eigenvectors $(1, 1)$ and $(1, -1)$. Diagonalising gives

$$e^{\mathbf{A}+\mathbf{B}} = \begin{pmatrix} \cosh 1 & \sinh 1 \\ \sinh 1 & \cosh 1 \end{pmatrix} = \begin{pmatrix} 1.543 & 1.175 \\ 1.175 & 1.543 \end{pmatrix},$$

where $\cosh 1 = (e + e^{-1})/2$ and $\sinh 1 = (e - e^{-1})/2$.

**Why.** $\mathbf{A}\mathbf{B} = \begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix}$ but $\mathbf{B}\mathbf{A} = \begin{pmatrix} 0 & 0 \\ 0 & 1 \end{pmatrix}$. The matrices do not commute, so the sum rule does not apply.
:::

::: check
A spacecraft holds a constant body rate $\boldsymbol{\omega} = (0, 0, 0.02)\,\mathrm{rad/s}$ for $50\,\mathrm{s}$. Write the matrix that maps its initial attitude to its final attitude.
:::

::: answer
The attitude change is $e^{[\boldsymbol{\omega}\times]\,\Delta t}$: a rotation about $\hat{\boldsymbol{\omega}} = (0, 0, 1)$ by $\|\boldsymbol{\omega}\|\Delta t = 0.02\times 50 = 1\,\mathrm{rad}$ (about $57^\circ$).

By the Rodrigues formula this is the rotation about $z$ by $1\,\mathrm{rad}$. With $\cos 1 = 0.5403$ and $\sin 1 = 0.8415$:

$$\begin{pmatrix} 0.5403 & -0.8415 & 0 \\ 0.8415 & 0.5403 & 0 \\ 0 & 0 & 1 \end{pmatrix}.$$

Because $[\boldsymbol{\omega}\times]$ is skew-symmetric, the result is automatically orthogonal with determinant $+1$. Check one column: $0.5403^2 + 0.8415^2 = 1.000$.
:::

::: check
You implement scaling and squaring with the rule $\|\mathbf{A}\Delta t\|/2^s \le 0.5$, for a system whose fastest eigenvalue is $-1000\,\mathrm{s^{-1}}$ and whose step is $\Delta t = 0.01\,\mathrm{s}$. How many squarings will you do? What would go wrong if you skipped the scaling and used the Taylor series directly?
:::

::: answer
**Squarings.** $\|\mathbf{A}\Delta t\|$ is about $1000\times 0.01 = 10$. You need $10/2^s \le 0.5$, so $2^s \ge 20$. The smallest power of two that works is $32 = 2^5$, so $s = 5$ squarings.

**Without scaling.** The fast mode's series is $\sum(-10)^k/k!$. Its terms grow to about $2756$ before shrinking. Stopping anywhere short of roughly forty terms leaves an error far bigger than the answer $e^{-10} = 4.5\times 10^{-5}$, and even a long series loses about eight digits to cancellation. With a step ten times longer, the terms would peak near $10^{42}$ and the result would be meaningless.
:::

## Summary

| Item | Statement |
| --- | --- |
| Definition | $e^{\mathbf{A}t} = \sum_{k=0}^\infty (\mathbf{A}t)^k/k!$, converges for every square $\mathbf{A}$ |
| Derivative | $\frac{d}{dt}e^{\mathbf{A}t} = \mathbf{A}e^{\mathbf{A}t}$, so $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$ solves $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ |
| Properties | $e^{\mathbf{A}(t+s)} = e^{\mathbf{A}t}e^{\mathbf{A}s}$; $(e^{\mathbf{A}t})^{-1} = e^{-\mathbf{A}t}$; $\det e^{\mathbf{A}t} = e^{\operatorname{tr}(\mathbf{A})t}$ |
| Sum rule | $e^{\mathbf{A}+\mathbf{B}} = e^{\mathbf{A}}e^{\mathbf{B}}$ only if $\mathbf{A}\mathbf{B} = \mathbf{B}\mathbf{A}$ |
| Diagonalisable | $e^{\mathbf{A}t} = \mathbf{V}\operatorname{diag}(e^{\lambda_i t})\mathbf{V}^{-1}$ |
| Nilpotent | series stops; double integrator gives $\begin{pmatrix} 1 & t \\ 0 & 1 \end{pmatrix}$ |
| Skew-symmetric | $e^{[\mathbf{k}\times]\theta} = \mathbf{I} + \sin\theta[\mathbf{k}\times] + (1-\cos\theta)[\mathbf{k}\times]^2$, a rotation |
| Jordan block | $e^{(\lambda\mathbf{I}+\mathbf{N})t} = e^{\lambda t}(\mathbf{I} + \mathbf{N}t)$, the $t e^{\lambda t}$ term |
| State transition | $\boldsymbol{\Phi}(t,t_0) = e^{\mathbf{A}(t-t_0)}$; $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k + \boldsymbol{\Gamma}\mathbf{u}_k$ with $\boldsymbol{\Gamma} = \int_0^{\Delta t}e^{\mathbf{A}\tau}d\tau\,\mathbf{B}$ |
| Numerics | scale so $\lVert\mathbf{A}t\rVert/2^s \le 0.5$, series or Padé, square $s$ times; naive Taylor fails for stiff $\mathbf{A}$ |

The next lesson takes the modes $e^{\lambda_i t}$ that appeared inside $e^{\mathbf{A}t}$ and reads them: which coordinates pull a system apart into independent pieces, what the real and imaginary parts of an eigenvalue mean physically, and when $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is stable.

::: context linearized What "linearized" means
Real vehicle dynamics are curved: drag grows with the square of speed, gravity weakens with distance, attitude involves sines and cosines. But zoom in far enough on any smooth curve and it looks like a straight line. **Linearizing** means doing exactly that around one operating point — hover, a circular orbit, level flight — and keeping only the straight-line part. What is left is $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ for the small *deviations* from that point. It is only trusted near the point, which is why filters keep re-linearizing as the vehicle moves.
:::

::: context factorial-wins Why the factorial always wins
$k!$ grows faster than any power $a^k$. Once $k$ passes $a$, each new term multiplies the last by $a/k$, which is less than one and keeps getting smaller. So however big $a$ is, the terms of $\sum a^k/k!$ eventually shrink faster and faster, and the sum settles. That is why $e^{x}$ converges for every $x$ — and also why a large $a$ is a problem in practice: the terms grow for about $a$ steps before the factorial takes over.
:::

::: context trace-volume The trace squeezes volume
Picture a small cloud of starting states, all near each other. As the system runs, the cloud moves and changes shape. The determinant of $e^{\mathbf{A}t}$ is the factor by which the cloud's area (or volume) has changed, and it equals $e^{\operatorname{tr}(\mathbf{A})t}$. For the damped oscillator in this lesson, $\operatorname{tr}\mathbf{A} = -3$, so after half a second the cloud has shrunk to $e^{-1.5} = 22\%$ of its area. Friction throws away information about where you started; a system with no friction keeps the area exactly.
:::

::: context rotations-order Try it with a book
Hold a book flat, front cover up. Turn it $90^\circ$ about a left–right axis, then $90^\circ$ about a vertical axis. Note where the spine points. Start again and do the same two turns in the other order. The book ends up in a different position. Rotations in three dimensions do not commute, so their generators do not either — and that is why attitude code cannot add up rotation vectors from different moments and exponentiate the total.
:::

::: context rodrigues Who Rodrigues was
Olinde Rodrigues was a French mathematician and banker. In 1840 he published a paper on how rigid bodies turn, including the formula now named after him. Engineers still use it constantly: it turns an axis and an angle into a rotation matrix with a handful of multiplications, and it sits inside attitude propagators and robot-arm kinematics code everywhere.
:::

::: context ekf-phi Where Φ comes from in a real filter
An **EKF**, or extended Kalman filter, estimates a nonlinear system by linearizing it around its current best guess at every step. So its $\mathbf{A}$ changes as the guess changes, and there is no single $e^{\mathbf{A}\Delta t}$ to compute. Instead the filter integrates $\dot{\boldsymbol{\Phi}} = \mathbf{A}(t)\boldsymbol{\Phi}$ numerically alongside the state, or — when the step is short — uses $e^{\mathbf{A}\Delta t}$ with $\mathbf{A}$ frozen at the start of the step, or even the first two terms $\mathbf{I} + \mathbf{A}\Delta t$. Real filters use all three, depending on how long the step is and how much accuracy they need.
:::

::: context zoh-picture What a zero-order hold looks like
The smooth grey curve is what a controller would like to command. The computer only updates its output once per step $\Delta t$ (the dots), and holds each value flat until the next update — a staircase. "Zero-order" means each piece is a polynomial of degree zero: a constant. The $\boldsymbol{\Gamma}$ formula is exact for that staircase, which is why the discrete model matches the real hardware.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3" points="40.0,100.0 50.0,92.1 60.0,84.4 70.0,77.4 80.0,71.3 90.0,66.3 100.0,62.7 110.0,60.6 120.0,60.0 130.0,61.0 140.0,63.6 150.0,67.7 160.0,73.0 170.0,79.4 180.0,86.6 190.0,94.4 200.0,102.3 210.0,110.2 220.0,117.7 230.0,124.5 240.0,130.3 250.0,134.9 260.0,138.1 270.0,139.7 280.0,139.8 290.0,138.4 300.0,135.3 310.0,130.9 320.0,125.3 330.0,118.6 340.0,111.2"/>
  <path d="M40,100 H90 V66.3 H140 V63.6 H190 V94.4 H240 V130.3 H290 V138.4 H340" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1d6fd1"><circle cx="40" cy="100" r="3.5"/><circle cx="90" cy="66.3" r="3.5"/><circle cx="140" cy="63.6" r="3.5"/><circle cx="190" cy="94.4" r="3.5"/><circle cx="240" cy="130.3" r="3.5"/><circle cx="290" cy="138.4" r="3.5"/></g>
  <g stroke="#1f2a44" stroke-width="1"><line x1="90" y1="150" x2="90" y2="155"/><line x1="140" y1="150" x2="140" y2="155"/><line x1="190" y1="150" x2="190" y2="155"/><line x1="240" y1="150" x2="240" y2="155"/><line x1="290" y1="150" x2="290" y2="155"/></g>
  <text x="65" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">Δt</text>
  <text x="300" y="168" font-size="11" fill="#1f2a44">time</text>
  <text x="46" y="28" font-size="11" fill="#1f2a44">command u</text>
  <text x="200" y="52" font-size="12" fill="#6c7a93">wanted</text>
  <text x="200" y="68" font-size="12" fill="#1d6fd1">held each step</text>
</svg>
```
:::

::: context van-loan Van Loan's method
Charles Van Loan, a numerical analyst at Cornell, published the stacked-matrix idea in 1978 in a paper on computing integrals that involve the matrix exponential. Integrals like $\boldsymbol{\Gamma}$, and the harder one that gives the discrete noise covariance $\mathbf{Q}$, turn into blocks of one bigger exponential. Because a good `expm` is available in every numerical library, this is how many navigation filters get $\boldsymbol{\Phi}$, $\boldsymbol{\Gamma}$ and $\mathbf{Q}$ without writing a single integral by hand.
:::

::: context term-sizes The terms of the series for e^(−10)
Bar heights are the sizes $10^k/k!$ of the terms, on a scale where each grid line is ten thousand times the one below. They rise to about $2756$ at $k = 9$ and $10$, and only then fall. The red line is the true answer, $4.54\times 10^{-5}$ — far below the biggest terms, so the sum has to cancel almost everything it adds.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3">
    <line x1="44" y1="20" x2="340" y2="20"/><line x1="44" y1="70" x2="340" y2="70"/><line x1="44" y1="120" x2="340" y2="120"/>
  </g>
  <line x1="44" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="40" y="24">10⁴</text><text x="40" y="74">1</text><text x="40" y="124">10⁻⁴</text><text x="40" y="174">10⁻⁸</text>
  </g>
  <g fill="#1d6fd1">
<rect x="47.5" y="70.0" width="5" height="100.0"/>
<rect x="54.5" y="57.5" width="5" height="112.5"/>
<rect x="61.5" y="48.8" width="5" height="121.2"/>
<rect x="68.5" y="42.4" width="5" height="127.6"/>
<rect x="75.5" y="37.6" width="5" height="132.4"/>
<rect x="82.5" y="33.9" width="5" height="136.1"/>
<rect x="89.5" y="31.2" width="5" height="138.8"/>
<rect x="96.5" y="29.2" width="5" height="140.8"/>
<rect x="103.5" y="27.8" width="5" height="142.2"/>
<rect x="110.5" y="27.0" width="5" height="143.0"/>
<rect x="117.5" y="27.0" width="5" height="143.0"/>
<rect x="124.5" y="27.5" width="5" height="142.5"/>
<rect x="131.5" y="28.5" width="5" height="141.5"/>
<rect x="138.5" y="30.0" width="5" height="140.0"/>
<rect x="145.5" y="31.8" width="5" height="138.2"/>
<rect x="152.5" y="34.0" width="5" height="136.0"/>
<rect x="159.5" y="36.5" width="5" height="133.5"/>
<rect x="166.5" y="39.4" width="5" height="130.6"/>
<rect x="173.5" y="42.6" width="5" height="127.4"/>
<rect x="180.5" y="46.1" width="5" height="123.9"/>
<rect x="187.5" y="49.8" width="5" height="120.2"/>
<rect x="194.5" y="53.8" width="5" height="116.2"/>
<rect x="201.5" y="58.1" width="5" height="111.9"/>
<rect x="208.5" y="62.6" width="5" height="107.4"/>
<rect x="215.5" y="67.3" width="5" height="102.7"/>
<rect x="222.5" y="72.2" width="5" height="97.8"/>
<rect x="229.5" y="77.3" width="5" height="92.7"/>
<rect x="236.5" y="82.6" width="5" height="87.4"/>
<rect x="243.5" y="88.1" width="5" height="81.9"/>
<rect x="250.5" y="93.7" width="5" height="76.3"/>
<rect x="257.5" y="99.5" width="5" height="70.5"/>
<rect x="264.5" y="105.4" width="5" height="64.6"/>
<rect x="271.5" y="111.4" width="5" height="58.6"/>
<rect x="278.5" y="117.6" width="5" height="52.4"/>
<rect x="285.5" y="123.9" width="5" height="46.1"/>
<rect x="292.5" y="130.3" width="5" height="39.7"/>
<rect x="299.5" y="136.8" width="5" height="33.2"/>
<rect x="306.5" y="143.4" width="5" height="26.6"/>
<rect x="313.5" y="150.1" width="5" height="19.9"/>
<rect x="320.5" y="156.9" width="5" height="13.1"/>
<rect x="327.5" y="168.9" width="5" height="1.1"/>
  </g>
  <line x1="44" y1="124.3" x2="340" y2="124.3" stroke="#b4232c" stroke-width="1.8"/>
  <rect x="244" y="129" width="80" height="16" fill="#ffffff"/>
  <text x="250" y="141" font-size="11" fill="#b4232c">true e^(−10)</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">k = 0</text><text x="120" y="186">10</text><text x="190" y="186">20</text><text x="260" y="186">30</text><text x="330" y="186">40</text>
  </g>
</svg>
```
:::

::: context stiff-word Why "stiff"
The word comes from mechanics. A very stiff spring makes a mass vibrate very fast, while the rest of the machine moves slowly. A model with both has one huge eigenvalue and some small ones. The fast part dies out almost at once and hardly matters to the answer, but it still forces naive numerical methods to take tiny steps or go unstable. Launch vehicles are full of this: engine and actuator dynamics in milliseconds, trajectory dynamics over minutes.
:::

::: context pade Padé approximants
Henri Padé, a French mathematician, studied these approximations in his 1892 thesis. Instead of a single polynomial, a Padé approximant is one polynomial divided by another, with coefficients chosen so its own series matches the function's for as many terms as possible. For $e^x$, the simplest one is $(1 + x/2)/(1 - x/2)$, which already matches $1 + x + x^2/2$. SciPy's `expm` uses a scaling-and-squaring Padé algorithm published by Al-Mohy and Higham in 2009. The classic survey of what can go wrong is Moler and Van Loan's paper "Nineteen Dubious Ways to Compute the Exponential of a Matrix" (1978, revisited in 2003).
:::

::: context scaling-squaring Scaling and squaring, step by step
The stiff example from this lesson. Halving the matrix five times makes it small enough that a short series is essentially exact; squaring five times puts the halvings back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="l2ss" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/></marker>
  </defs>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="15" width="150" height="46" rx="6" fill="#ffffff"/>
    <rect x="200" y="15" width="150" height="46" rx="6" fill="#8fb8f0" fill-opacity="0.35"/>
    <rect x="200" y="105" width="150" height="46" rx="6" fill="#8fb8f0" fill-opacity="0.35"/>
    <rect x="10" y="105" width="150" height="46" rx="6" fill="#f2b880" fill-opacity="0.45"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="162" y1="38" x2="197" y2="38" marker-end="url(#l2ss)"/>
    <line x1="275" y1="63" x2="275" y2="102" marker-end="url(#l2ss)"/>
    <line x1="198" y1="128" x2="163" y2="128" marker-end="url(#l2ss)"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="85" y="35">A·Δt</text><text x="85" y="52">size 10</text>
    <text x="275" y="35">X = A·Δt / 32</text><text x="275" y="52">size 0.3125</text>
    <text x="275" y="125">18-term series</text><text x="275" y="142">≈ exact e^X</text>
    <text x="85" y="125">square 5 times</text><text x="85" y="142">(e^X)³² = e^(AΔt)</text>
  </g>
  <text x="180" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">÷ 2⁵</text>
</svg>
```
:::
