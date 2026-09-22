---
id: l02-matrix-exponential
title: The matrix exponential and the state transition matrix
minutes: 22
covers:
  - the matrix exponential and the state transition matrix
---

Every linearised model a GNC engineer writes down ends up as $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$, possibly with an input term: a spring–mass–damper, attitude error under a rate feedback, relative motion of two spacecraft, the error dynamics of an inertial navigator. For a scalar equation $\dot{x} = ax$ the solution is $x(t) = e^{at}x(0)$ and nobody thinks twice. The matrix version, $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$, is exactly as true, and the object $e^{\mathbf{A}t}$ — the matrix exponential — is the single most used matrix in estimation.

It is used because a filter does not run in continuous time. Every $\Delta t$ it must carry its state estimate and its covariance forward, and the matrix that does so for a linear time-invariant system is $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$, the state transition matrix. Get $\boldsymbol{\Phi}$ wrong by a little and the filter drifts; compute it naively for a stiff system and it is not wrong by a little, it is garbage.

This lesson defines $e^{\mathbf{A}t}$, proves the handful of properties you will use, shows the three hand computations that cover most textbook and many real cases, introduces the state transition matrix and the zero-order-hold input, and then explains how the number is computed reliably on a machine.

## From the scalar exponential to the matrix exponential

Recall the scalar series $e^{at} = \sum_{k=0}^{\infty} (at)^k/k!$. It converges for every $a$ and every $t$, and differentiating it term by term gives $a\,e^{at}$, which is why $e^{at}x(0)$ solves $\dot{x} = ax$. Replace $a$ by a square matrix $\mathbf{A}$, keeping $t$ a scalar:

$$e^{\mathbf{A}t} = \sum_{k=0}^{\infty} \frac{(\mathbf{A}t)^k}{k!} = \mathbf{I} + \mathbf{A}t + \frac{\mathbf{A}^2 t^2}{2!} + \frac{\mathbf{A}^3 t^3}{3!} + \cdots$$

Every term is an $n\times n$ matrix, so the sum is one too. It converges for every $\mathbf{A}$: the norm of the $k$-th term is at most $\|\mathbf{A}\|^k t^k/k!$, and those scalars sum to $e^{\|\mathbf{A}\|t}$, which is finite. Two immediate consequences of the definition: $e^{\mathbf{A}\cdot 0} = \mathbf{I}$, since only the $k = 0$ term survives, and $e^{\mathbf{A}t}$ commutes with $\mathbf{A}$, since every term does.

Now differentiate with respect to $t$, term by term, which the convergence permits:

$$\frac{d}{dt}e^{\mathbf{A}t} = \sum_{k=1}^{\infty} \frac{\mathbf{A}^k\,k\,t^{k-1}}{k!} = \mathbf{A}\sum_{k=1}^{\infty} \frac{\mathbf{A}^{k-1} t^{k-1}}{(k-1)!} = \mathbf{A}\,e^{\mathbf{A}t} = e^{\mathbf{A}t}\mathbf{A}.$$

So $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$ satisfies $\dot{\mathbf{x}} = \mathbf{A}e^{\mathbf{A}t}\mathbf{x}(0) = \mathbf{A}\mathbf{x}$ and starts at $\mathbf{x}(0)$. A linear ODE with a given initial condition has exactly one solution, so this is it.

::: key The matrix exponential and the linear system
$e^{\mathbf{A}t} = \sum_k (\mathbf{A}t)^k/k!$, and the solution of $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$. For an LTI system $e^{\mathbf{A}\Delta t}$ is the state transition matrix $\boldsymbol{\Phi}$ that carries the state across one step of length $\Delta t$.
:::

## Properties worth proving once

**Composition.** $e^{\mathbf{A}(t+s)} = e^{\mathbf{A}t}e^{\mathbf{A}s}$. Propagating for $t$ seconds and then for $s$ more is the same as propagating for $t + s$; formally both sides solve the same ODE in $t$ with the same value at $t = 0$. You use this every time a filter takes two steps instead of one.

**Inverse.** Setting $s = -t$ gives $e^{\mathbf{A}t}e^{-\mathbf{A}t} = \mathbf{I}$, so $\left(e^{\mathbf{A}t}\right)^{-1} = e^{-\mathbf{A}t}$. The matrix exponential is always invertible, whatever $\mathbf{A}$ is, which is the algebraic form of a physical fact: a linear flow never loses information, and you can always propagate backwards in time.

**Determinant.** If $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ then applying the series gives $e^{\mathbf{A}t}\mathbf{v} = e^{\lambda t}\mathbf{v}$: the eigenvalues of $e^{\mathbf{A}t}$ are $e^{\lambda_i t}$ with the same eigenvectors. The determinant is their product, so

$$\det e^{\mathbf{A}t} = \prod_i e^{\lambda_i t} = e^{t\sum_i\lambda_i} = e^{\operatorname{tr}(\mathbf{A})\,t}.$$

This is never zero, which re-proves invertibility, and it says how the flow scales volumes in state space. An undamped mechanical system has $\operatorname{tr}\mathbf{A} = 0$ and preserves phase-space volume; a damped one has negative trace and shrinks it.

**Similarity.** If $\mathbf{A} = \mathbf{T}\mathbf{B}\mathbf{T}^{-1}$ then $\mathbf{A}^k = \mathbf{T}\mathbf{B}^k\mathbf{T}^{-1}$ for every $k$ (the inner $\mathbf{T}^{-1}\mathbf{T}$ pairs cancel), so summing the series gives $e^{\mathbf{A}t} = \mathbf{T}e^{\mathbf{B}t}\mathbf{T}^{-1}$. This is the whole basis of the diagonalisation method below.

::: warning The exponential of a sum
$e^{\mathbf{A}+\mathbf{B}} = e^{\mathbf{A}}e^{\mathbf{B}}$ holds only when $\mathbf{A}\mathbf{B} = \mathbf{B}\mathbf{A}$. Expand both sides to second order: the left has $\tfrac{1}{2}(\mathbf{A}+\mathbf{B})^2 = \tfrac{1}{2}(\mathbf{A}^2 + \mathbf{A}\mathbf{B} + \mathbf{B}\mathbf{A} + \mathbf{B}^2)$, the right has $\tfrac{1}{2}\mathbf{A}^2 + \mathbf{A}\mathbf{B} + \tfrac{1}{2}\mathbf{B}^2$, and they differ by $\tfrac{1}{2}(\mathbf{A}\mathbf{B} - \mathbf{B}\mathbf{A})$. Rotations are the everyday case: two rotations about different axes do not commute, so you cannot exponentiate their generators separately and multiply. The same trap appears in a subtler form when $\mathbf{A}$ depends on time, below.
:::

## Computing the exponential by hand

### Diagonalisable matrices

If $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ from Lesson 1, the similarity property gives

$$e^{\mathbf{A}t} = \mathbf{V}e^{\boldsymbol{\Lambda}t}\mathbf{V}^{-1}, \qquad e^{\boldsymbol{\Lambda}t} = \operatorname{diag}\!\left(e^{\lambda_1 t}, \dots, e^{\lambda_n t}\right),$$

because the exponential of a diagonal matrix is computed entry by entry (every power of a diagonal matrix is diagonal). Read it as the same recipe as before: convert to eigen-coordinates, let each coordinate evolve as a scalar exponential $e^{\lambda_i t}$, convert back. If a $\lambda_i$ is complex the corresponding $e^{\lambda_i t}$ is complex, but for a real $\mathbf{A}$ the conjugate pairs recombine and the final matrix is real.

::: example The exponential of a damped second-order system
Take $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ -2 & -3 \end{pmatrix}$, the state matrix of $\ddot{y} + 3\dot{y} + 2y = 0$ with $\mathbf{x} = (y, \dot{y})^\mathsf{T}$. Trace $-3$, determinant $2$: $\lambda^2 + 3\lambda + 2 = (\lambda+1)(\lambda+2)$, so $\lambda_1 = -1$ and $\lambda_2 = -2$. The eigenvectors from the first rows of $\mathbf{A} - \lambda\mathbf{I}$ are $\mathbf{v}_1 = (1, -1)^\mathsf{T}$ and $\mathbf{v}_2 = (1, -2)^\mathsf{T}$, so

$$\mathbf{V} = \begin{pmatrix} 1 & 1 \\ -1 & -2 \end{pmatrix}, \qquad \mathbf{V}^{-1} = \begin{pmatrix} 2 & 1 \\ -1 & -1 \end{pmatrix}.$$

Then

$$e^{\mathbf{A}t} = \begin{pmatrix} 1 & 1 \\ -1 & -2 \end{pmatrix}\begin{pmatrix} e^{-t} & 0 \\ 0 & e^{-2t} \end{pmatrix}\begin{pmatrix} 2 & 1 \\ -1 & -1 \end{pmatrix} = \begin{pmatrix} 2e^{-t} - e^{-2t} & e^{-t} - e^{-2t} \\ -2e^{-t} + 2e^{-2t} & -e^{-t} + 2e^{-2t} \end{pmatrix}.$$

Check at $t = 0$: $\begin{pmatrix} 2-1 & 1-1 \\ -2+2 & -1+2 \end{pmatrix} = \mathbf{I}$. At $t = 0.5\,\mathrm{s}$, with $e^{-0.5} = 0.6065$ and $e^{-1} = 0.3679$,

$$e^{0.5\mathbf{A}} = \begin{pmatrix} 0.8452 & 0.2387 \\ -0.4773 & 0.1292 \end{pmatrix},$$

and its determinant is $0.8452\times 0.1292 + 0.2387\times 0.4773 = 0.2231 = e^{-1.5}$, matching $e^{\operatorname{tr}(\mathbf{A})t}$. Released from $\mathbf{x}(0) = (1, 0)^\mathsf{T}$ — unit displacement, at rest — the state after half a second is the first column, $(0.845, -0.477)^\mathsf{T}$: it has moved back towards zero and is now moving at $0.477$ units per second towards it. The two exponentials $e^{-t}$ and $e^{-2t}$ are the two modes of the system; the next lesson is about reading them.
:::

### Nilpotent matrices: the series stops

If $\mathbf{A}^k = \mathbf{0}$ for some $k$, the series has only $k$ terms and the exponential is a polynomial in $t$. The double integrator from Lesson 1 is the case you will meet most:

$$\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}, \qquad \mathbf{A}^2 = \mathbf{0}, \qquad e^{\mathbf{A}t} = \mathbf{I} + \mathbf{A}t = \begin{pmatrix} 1 & t \\ 0 & 1 \end{pmatrix}.$$

With $\mathbf{x} = (p, v)^\mathsf{T}$ this says $p(t) = p_0 + v_0 t$ and $v(t) = v_0$: unforced kinematics, as it should. Notice that this matrix is defective and has no diagonalisation, yet its exponential is trivial. The series definition does not care about eigenvectors. A three-state chain (position, velocity, acceleration) has $\mathbf{A}^3 = \mathbf{0}$ and $e^{\mathbf{A}t} = \mathbf{I} + \mathbf{A}t + \tfrac{1}{2}\mathbf{A}^2 t^2$, which produces the familiar $\tfrac{1}{2}a t^2$.

### Skew-symmetric matrices: the exponential is a rotation

From Linear Algebra I, the cross-product matrix $[\mathbf{k}\times]$ of a unit vector $\mathbf{k}$ is skew-symmetric, and multiplying out gives $[\mathbf{k}\times]^2 = \mathbf{k}\mathbf{k}^\mathsf{T} - \mathbf{I}$ and hence $[\mathbf{k}\times]^3 = -[\mathbf{k}\times]$. So the powers cycle with period two up to sign, and the series for $e^{[\mathbf{k}\times]\theta}$ splits into odd terms, which collect into $\sin\theta$, and even terms, which collect into $1 - \cos\theta$:

$$e^{[\mathbf{k}\times]\theta} = \mathbf{I} + \sin\theta\,[\mathbf{k}\times] + (1 - \cos\theta)\,[\mathbf{k}\times]^2.$$

This is the Rodrigues rotation formula: a rotation by $\theta$ about the axis $\mathbf{k}$. It has to be a rotation. Because $[\mathbf{k}\times]^\mathsf{T} = -[\mathbf{k}\times]$, the transpose of the exponential is $e^{-[\mathbf{k}\times]\theta}$, which is its inverse, so the matrix is orthogonal; and its determinant is $e^{\operatorname{tr}([\mathbf{k}\times])\theta} = e^{0} = 1$, so it is a proper rotation with no reflection. For a body rotating at constant rate $\boldsymbol{\omega}$, the attitude change over $\Delta t$ is $e^{[\boldsymbol{\omega}\times]\Delta t}$: a rotation by $\|\boldsymbol{\omega}\|\Delta t$ about $\hat{\boldsymbol{\omega}}$. For $\boldsymbol{\omega} = (0, 0, 0.3)\,\mathrm{rad/s}$ over one second,

$$e^{[\boldsymbol{\omega}\times]} = \begin{pmatrix} \cos 0.3 & -\sin 0.3 & 0 \\ \sin 0.3 & \cos 0.3 & 0 \\ 0 & 0 & 1 \end{pmatrix} = \begin{pmatrix} 0.9553 & -0.2955 & 0 \\ 0.2955 & 0.9553 & 0 \\ 0 & 0 & 1 \end{pmatrix}.$$

### Defective matrices with a nonzero eigenvalue

Write a $2\times 2$ Jordan block as $\mathbf{A} = \lambda\mathbf{I} + \mathbf{N}$ with $\mathbf{N} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$. The two pieces commute because $\lambda\mathbf{I}$ commutes with everything, so the sum rule is allowed here, and $\mathbf{N}$ is nilpotent:

$$e^{\mathbf{A}t} = e^{\lambda t}e^{\mathbf{N}t} = e^{\lambda t}\begin{pmatrix} 1 & t \\ 0 & 1 \end{pmatrix}.$$

The entry $t\,e^{\lambda t}$ is the signature of a repeated eigenvalue without a full set of eigenvectors. For $\lambda = -1$ and $t = 2\,\mathrm{s}$ the matrix is $0.1353\begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$. Every matrix, defective or not, can be written as a block-diagonal Jordan form after a similarity transform, and the blocks are handled exactly like this — but in practice you will let a library compute it, for reasons that come at the end.

## The state transition matrix

For the LTI system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$, the state transition matrix from time $t_0$ to time $t$ is

$$\boldsymbol{\Phi}(t, t_0) = e^{\mathbf{A}(t - t_0)}, \qquad \mathbf{x}(t) = \boldsymbol{\Phi}(t, t_0)\,\mathbf{x}(t_0).$$

It inherits the properties of the exponential: $\boldsymbol{\Phi}(t_0, t_0) = \mathbf{I}$; $\boldsymbol{\Phi}(t_2, t_0) = \boldsymbol{\Phi}(t_2, t_1)\boldsymbol{\Phi}(t_1, t_0)$ (propagate in stages, right to left); $\boldsymbol{\Phi}(t_0, t) = \boldsymbol{\Phi}(t, t_0)^{-1}$; and $\dot{\boldsymbol{\Phi}} = \mathbf{A}\boldsymbol{\Phi}$. For a filter running with a fixed step, $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$ is a constant matrix computed once, and the state propagates as $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k$. The covariance propagates as $\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}$, a formula Lesson 5 derives.

When $\mathbf{A}$ depends on time the state transition matrix still exists — it is the solution of $\dot{\boldsymbol{\Phi}} = \mathbf{A}(t)\boldsymbol{\Phi}$ with $\boldsymbol{\Phi}(t_0, t_0) = \mathbf{I}$, and an EKF obtains it by integrating that equation alongside the state — but it is not $e^{\int\mathbf{A}\,dt}$ unless the matrices $\mathbf{A}(t)$ at different times commute. This is the sum-rule warning in disguise, and it is a real error source in hand-derived propagators.

### Inputs and the zero-order hold

With an input, $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}(t)$. Multiply through by $e^{-\mathbf{A}t}$ and notice that $\frac{d}{dt}\left(e^{-\mathbf{A}t}\mathbf{x}\right) = e^{-\mathbf{A}t}(\dot{\mathbf{x}} - \mathbf{A}\mathbf{x}) = e^{-\mathbf{A}t}\mathbf{B}\mathbf{u}$. Integrate from $0$ to $t$ and multiply by $e^{\mathbf{A}t}$:

$$\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t-\tau)}\mathbf{B}\mathbf{u}(\tau)\,d\tau.$$

The first term is the free response; the second adds up the effect of the input at each instant $\tau$, propagated forward for the remaining $t - \tau$. In a digital controller the command is held constant over each step (a zero-order hold), so over one step $\mathbf{u}(\tau) = \mathbf{u}_k$ and the integral collapses:

$$\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k + \boldsymbol{\Gamma}\mathbf{u}_k, \qquad \boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}, \qquad \boldsymbol{\Gamma} = \int_0^{\Delta t} e^{\mathbf{A}\tau}\,d\tau\;\mathbf{B}.$$

::: example A braking descent with a held thrust command
A lander's vertical motion, with state $(p, v)^\mathsf{T}$ and a commanded net acceleration $a$ as the input, is a double integrator: $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$, $\mathbf{B} = (0, 1)^\mathsf{T}$. From above, $e^{\mathbf{A}\tau} = \begin{pmatrix} 1 & \tau \\ 0 & 1 \end{pmatrix}$, so

$$\boldsymbol{\Gamma} = \int_0^{\Delta t}\begin{pmatrix} 1 & \tau \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 0 \\ 1 \end{pmatrix}d\tau = \int_0^{\Delta t}\begin{pmatrix} \tau \\ 1 \end{pmatrix}d\tau = \begin{pmatrix} \tfrac{1}{2}\Delta t^2 \\ \Delta t \end{pmatrix}.$$

With a guidance step of $\Delta t = 2\,\mathrm{s}$: $\boldsymbol{\Phi} = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$ and $\boldsymbol{\Gamma} = (2, 2)^\mathsf{T}$. Starting at $p = 100\,\mathrm{m}$ above the pad descending at $v = -5\,\mathrm{m/s}$ (take up as positive, so $\mathbf{x}_0 = (100, -5)^\mathsf{T}$) with a held net acceleration of $a = +1.5\,\mathrm{m/s^2}$ (thrust exceeding gravity):

$$\mathbf{x}_1 = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 100 \\ -5 \end{pmatrix} + \begin{pmatrix} 2 \\ 2 \end{pmatrix}(1.5) = \begin{pmatrix} 90 \\ -5 \end{pmatrix} + \begin{pmatrix} 3 \\ 3 \end{pmatrix} = \begin{pmatrix} 93\,\mathrm{m} \\ -2\,\mathrm{m/s} \end{pmatrix}.$$

The lander has descended $7\,\mathrm{m}$ and slowed from $5$ to $2\,\mathrm{m/s}$, exactly what $p_0 + v_0\Delta t + \tfrac{1}{2}a\Delta t^2$ and $v_0 + a\Delta t$ give, but now packaged as one matrix update the flight software can apply to any linear model.
:::

::: note Getting Φ and Γ in one call
Stack the state and the held input into one vector $(\mathbf{x}, \mathbf{u})$ with $\dot{\mathbf{u}} = \mathbf{0}$. Its dynamics matrix is the block matrix $\begin{pmatrix} \mathbf{A} & \mathbf{B} \\ \mathbf{0} & \mathbf{0} \end{pmatrix}$, and exponentiating it over $\Delta t$ gives $\begin{pmatrix} \boldsymbol{\Phi} & \boldsymbol{\Gamma} \\ \mathbf{0} & \mathbf{I} \end{pmatrix}$ — both matrices from a single `expm`. For the lander above this returns $\begin{pmatrix} 1 & 2 & 2 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{pmatrix}$. The same trick, with a different augmented matrix, yields the discrete process-noise covariance $\mathbf{Q}$; it is known as Van Loan's method.
:::

## Computing the exponential numerically

Diagonalisation is the right tool for understanding and for small hand problems, but a library does not use it as its default: a defective matrix has no $\mathbf{V}^{-1}$, a nearly defective one has an ill-conditioned $\mathbf{V}$ (Lesson 10) that amplifies round-off, and the eigen-decomposition itself costs more than the alternative.

The Taylor series is not the default either, and the reason is instructive. Consider the scalar $e^{-10}$, whose true value is $4.540\times 10^{-5}$. The terms $10^k/k!$ grow until $k \approx 10$, where the term is $10^{10}/10! = 2756$, before they start to shrink. The partial sums swing through values in the thousands with alternating signs — after $10$ terms the sum is $1343$, after $20$ terms $54.5$, after $30$ terms $0.0085$ — and only after $40$ terms is the answer correct to three digits. The final answer is a difference of numbers of order $10^3$ that must cancel down to $10^{-5}$: eight orders of magnitude of cancellation, costing eight of the sixteen digits float64 carries. For a matrix with an eigenvalue of $-1000$ and $t = 1$ it is far worse: the terms peak around $10^{432}$, which overflows float64 entirely. A stiff system — one whose eigenvalues span several orders of magnitude, like a fast actuator loop inside a slow vehicle loop — always has this problem, because the interesting slow dynamics need a step long enough to make $\|\mathbf{A}\Delta t\|$ large for the fast mode.

The fix is scaling and squaring, which uses the composition property in reverse. Choose an integer $s$ so that $\|\mathbf{A}t\|/2^s \le 0.5$, evaluate the series for the small matrix $\mathbf{X} = \mathbf{A}t/2^s$, whose terms decrease from the start (with $\|\mathbf{X}\| \le 0.5$ the eighteenth term is below $10^{-21}$), then square the result $s$ times:

$$e^{\mathbf{A}t} = \left(e^{\mathbf{A}t/2^s}\right)^{2^s}.$$

Each squaring is one matrix product, so the cost is $s$ extra products with $s \approx \log_2\|\mathbf{A}t\|$, which is tiny. Production code replaces the Taylor polynomial with a Padé approximant — a ratio of two matrix polynomials that matches the exponential to a higher order for the same degree, at the price of one linear solve — and picks the degree and $s$ together from a backward-error analysis. That is what `scipy.linalg.expm` does. Whichever polynomial is used, the scaling step is what makes stiff systems tractable.

::: example Scaling and squaring on a stiff system
Take $\mathbf{A} = \begin{pmatrix} -1 & 0 \\ 0 & -1000 \end{pmatrix}\,\mathrm{s^{-1}}$ with a step $\Delta t = 0.01\,\mathrm{s}$, so $\mathbf{A}\Delta t = \operatorname{diag}(-0.01, -10)$ and the exact answer is $\operatorname{diag}(e^{-0.01}, e^{-10}) = \operatorname{diag}(0.990050, 4.5400\times 10^{-5})$. The norm of $\mathbf{A}\Delta t$ is $10$. The smallest $s$ with $10/2^s \le 0.5$ is $s = 5$, giving $\|\mathbf{X}\| = 0.3125$.

An eighteen-term Taylor series on $\mathbf{X} = \operatorname{diag}(-0.0003125, -0.3125)$ has a last term of at most $0.3125^{18}/18! \approx 10^{-25}$, so the polynomial is essentially exact. Squaring the result five times raises it to the $32$nd power and returns $\operatorname{diag}(0.9900498337, 4.53999\times 10^{-5})$, matching the exact values to a relative error of about $1.5\times 10^{-15}$ — round-off level. Cutting the series to eight terms still gives a relative error of only $10^{-7}$ after the squarings, which shows how much of the accuracy comes from the scaling rather than from the length of the series.

Apply the plain eighteen-term series to $\mathbf{A}\Delta t$ directly, with no scaling, and the $(2,2)$ entry is computed as a partial sum of $(-10)^k/k!$ truncated at $k = 17$; the terms it dropped are of order $10^{18}/18! \approx 156$, so the answer is off by two orders of magnitude in absolute terms on a quantity whose true value is $4.5\times 10^{-5}$. Same series, same matrix, same machine: only the scaling differs.
:::

## Check yourself

::: check
Write down $e^{\mathbf{A}t}$ at $t = 3\,\mathrm{s}$ for $\mathbf{A} = \operatorname{diag}(-1, 2)$ and for $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$.
:::

::: answer
A diagonal matrix exponentiates entry by entry: $e^{\mathbf{A}t} = \operatorname{diag}(e^{-3}, e^{6}) = \operatorname{diag}(0.0498, 403.4)$. One direction has decayed to five percent, the other has grown by a factor of four hundred — the eigenvalue $+2$ is an instability. The second matrix is nilpotent with $\mathbf{A}^2 = \mathbf{0}$, so $e^{\mathbf{A}t} = \mathbf{I} + \mathbf{A}t = \begin{pmatrix} 1 & 3 \\ 0 & 1 \end{pmatrix}$: position advances by three seconds' worth of velocity and velocity is unchanged.
:::

::: check
Why is $e^{\mathbf{A}t}$ invertible for every square $\mathbf{A}$, and what does that mean for a filter?
:::

::: answer
Two proofs: $e^{\mathbf{A}t}e^{-\mathbf{A}t} = e^{\mathbf{0}} = \mathbf{I}$ exhibits the inverse directly, and $\det e^{\mathbf{A}t} = e^{\operatorname{tr}(\mathbf{A})t}$ is an exponential of a real number and therefore never zero. For a filter it means the state transition matrix can always be inverted: you can smooth backwards through stored data, and a propagation step never collapses two distinct states into one. Note that this does not mean the inverse is well conditioned — for the stiff example, $\boldsymbol{\Phi}^{-1}$ has an entry $e^{10}$.
:::

::: check
Let $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$ and $\mathbf{B} = \begin{pmatrix} 0 & 0 \\ 1 & 0 \end{pmatrix}$. Compute $e^{\mathbf{A}}e^{\mathbf{B}}$ and $e^{\mathbf{A}+\mathbf{B}}$ and explain the discrepancy.
:::

::: answer
Both $\mathbf{A}$ and $\mathbf{B}$ square to zero, so $e^{\mathbf{A}} = \mathbf{I} + \mathbf{A} = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ and $e^{\mathbf{B}} = \begin{pmatrix} 1 & 0 \\ 1 & 1 \end{pmatrix}$, whose product is $\begin{pmatrix} 2 & 1 \\ 1 & 1 \end{pmatrix}$. The sum $\mathbf{A} + \mathbf{B} = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$ is symmetric with eigenvalues $\pm 1$ and eigenvectors $(1, 1)$ and $(1, -1)$; diagonalising gives $e^{\mathbf{A}+\mathbf{B}} = \begin{pmatrix} \cosh 1 & \sinh 1 \\ \sinh 1 & \cosh 1 \end{pmatrix} = \begin{pmatrix} 1.543 & 1.175 \\ 1.175 & 1.543 \end{pmatrix}$. They differ because $\mathbf{A}\mathbf{B} = \begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix}$ while $\mathbf{B}\mathbf{A} = \begin{pmatrix} 0 & 0 \\ 0 & 1 \end{pmatrix}$: the matrices do not commute, so the sum rule does not apply.
:::

::: check
A spacecraft holds a constant body rate $\boldsymbol{\omega} = (0, 0, 0.02)\,\mathrm{rad/s}$ for $50\,\mathrm{s}$. Write the matrix that maps its initial attitude to its final attitude.
:::

::: answer
The attitude change is $e^{[\boldsymbol{\omega}\times]\,\Delta t}$, a rotation about $\hat{\boldsymbol{\omega}} = (0, 0, 1)$ by $\|\boldsymbol{\omega}\|\Delta t = 0.02\times 50 = 1\,\mathrm{rad}$. By the Rodrigues formula this is $\mathbf{R}_z(1)$ with $\cos 1 = 0.5403$ and $\sin 1 = 0.8415$: $\begin{pmatrix} 0.5403 & -0.8415 & 0 \\ 0.8415 & 0.5403 & 0 \\ 0 & 0 & 1 \end{pmatrix}$. Because $[\boldsymbol{\omega}\times]$ is skew-symmetric the result is automatically orthogonal with determinant $+1$.
:::

::: check
You are implementing scaling and squaring with the rule $\|\mathbf{A}\Delta t\|/2^s \le 0.5$ for a system whose fastest eigenvalue is $-1000\,\mathrm{s^{-1}}$ and whose step is $\Delta t = 0.01\,\mathrm{s}$. How many squarings will you perform, and what would go wrong if you skipped the scaling and used the Taylor series directly?
:::

::: answer
$\|\mathbf{A}\Delta t\|$ is about $10$, so you need $2^s \ge 20$, which means $s = 5$ squarings. Without scaling, the series for the fast mode is $\sum(-10)^k/k!$, whose terms grow to about $2756$ before shrinking; any truncation short of roughly forty terms leaves an error far larger than the answer $e^{-10} = 4.5\times 10^{-5}$, and even a long series loses about eight digits to cancellation. With a step ten times longer the terms would peak near $10^{42}$ and the computation would be meaningless.
:::

## Summary

| Item | Statement |
| --- | --- |
| Definition | $e^{\mathbf{A}t} = \sum_{k=0}^\infty (\mathbf{A}t)^k/k!$, converges for every square $\mathbf{A}$ |
| Derivative | $\frac{d}{dt}e^{\mathbf{A}t} = \mathbf{A}e^{\mathbf{A}t}$, so $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$ solves $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ |
| Properties | $e^{\mathbf{A}(t+s)} = e^{\mathbf{A}t}e^{\mathbf{A}s}$; $(e^{\mathbf{A}t})^{-1} = e^{-\mathbf{A}t}$; $\det e^{\mathbf{A}t} = e^{\operatorname{tr}(\mathbf{A})t}$ |
| Sum rule | $e^{\mathbf{A}+\mathbf{B}} = e^{\mathbf{A}}e^{\mathbf{B}}$ only if $\mathbf{A}\mathbf{B} = \mathbf{B}\mathbf{A}$ |
| Diagonalisable | $e^{\mathbf{A}t} = \mathbf{V}\operatorname{diag}(e^{\lambda_i t})\mathbf{V}^{-1}$ |
| Nilpotent | series terminates; double integrator gives $\begin{pmatrix} 1 & t \\ 0 & 1 \end{pmatrix}$ |
| Skew-symmetric | $e^{[\mathbf{k}\times]\theta} = \mathbf{I} + \sin\theta[\mathbf{k}\times] + (1-\cos\theta)[\mathbf{k}\times]^2$, a rotation |
| Jordan block | $e^{(\lambda\mathbf{I}+\mathbf{N})t} = e^{\lambda t}(\mathbf{I} + \mathbf{N}t)$, the $t e^{\lambda t}$ term |
| State transition | $\boldsymbol{\Phi}(t,t_0) = e^{\mathbf{A}(t-t_0)}$; $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k + \boldsymbol{\Gamma}\mathbf{u}_k$ with $\boldsymbol{\Gamma} = \int_0^{\Delta t}e^{\mathbf{A}\tau}d\tau\,\mathbf{B}$ |
| Numerics | scale so $\lVert\mathbf{A}t\rVert/2^s \le 0.5$, series or Padé, square $s$ times; naive Taylor fails for stiff $\mathbf{A}$ |

The next lesson takes the modes $e^{\lambda_i t}$ that appeared inside $e^{\mathbf{A}t}$ and reads them: which coordinates decouple a system, what the real and imaginary parts of an eigenvalue mean physically, and when $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is stable.
