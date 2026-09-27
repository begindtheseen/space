---
id: l03-solving-the-state-equation-and-discretisation
title: Solving the state equation, and the model your computer runs
minutes: 21
covers:
  - "Solution of xdot = Ax + Bu via the matrix exponential; the discrete-time equivalent"
---

You now have a model, and you know which parts of it are real. This lesson solves it. You know where the state starts, $\mathbf{x}(0)$, and you know every command you will send, $\mathbf{u}(t)$. Where is the state at time $t$?

The answer is one formula. Linear Algebra II already built every piece of it: the **matrix exponential** $e^{\mathbf{A}t}$, the **state transition matrix**, and the trick of getting two matrices from one exponential of a bigger block matrix. Here those pieces meet the vehicle.

There is a practical twist. A flight computer does not solve differential equations. It reads its sensors, computes a command, sends it, and holds it steady until the next tick of its clock. So the model it really runs is a **difference equation** — a rule for jumping from one tick to the next:

$$\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k.$$

Read it as "the state at the next tick equals A-d times the state now, plus B-d times the command now". The subscript $k$ counts ticks, and the $d$ stands for "discrete". Every design in the rest of this module — pole placement, observers, the servo — has a discrete twin that runs on these two matrices. Getting them right is not a formality. At a realistic sample rate, the gap between the exact version and the quick approximation engineers reach for by habit can be the gap between a stable mode and one that blows up.

## The solution of the forced state equation

Start with the simplest case you already know: one number, no input. The equation $\dot{x} = a x$ says "the rate of change is proportional to the amount", like money growing with interest or a hot drink cooling. Its solution is $x(t) = e^{at}x(0)$.

The matrix version works the same way. With no input, $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ has the solution $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$, where the **[[matrix exponential|why-exponential]]** is the same power series as for a number:

$$e^{\mathbf{A}t} = \mathbf{I} + \mathbf{A}t + \frac{(\mathbf{A}t)^2}{2!} + \frac{(\mathbf{A}t)^3}{3!} + \cdots$$

Now add the input. The command keeps nudging the state, and each nudge then evolves on its own. The full answer is the **[[variation-of-constants|variation-of-constants]]** formula:

$$\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t-\sigma)}\mathbf{B}\mathbf{u}(\sigma)\,d\sigma, \qquad \mathbf{y}(t) = \mathbf{C}\mathbf{x}(t) + \mathbf{D}\mathbf{u}(t).$$

Here $\sigma$ ("sigma") is a dummy time variable that runs from $0$ to $t$ inside the integral.

::: note Why it has to be true
Multiply the state equation by $e^{-\mathbf{A}t}$ and look at the left side. By the product rule,

$$\frac{d}{dt}\left(e^{-\mathbf{A}t}\mathbf{x}\right) = e^{-\mathbf{A}t}\dot{\mathbf{x}} - \mathbf{A}e^{-\mathbf{A}t}\mathbf{x} = e^{-\mathbf{A}t}(\dot{\mathbf{x}} - \mathbf{A}\mathbf{x}) = e^{-\mathbf{A}t}\mathbf{B}\mathbf{u}.$$

(The middle step uses the fact that $\mathbf{A}$ and $e^{-\mathbf{A}t}$ commute — both are built from powers of $\mathbf{A}$.) The left side is a perfect derivative, so integrate both sides from $0$ to $t$:

$$e^{-\mathbf{A}t}\mathbf{x}(t) - \mathbf{x}(0) = \int_0^t e^{-\mathbf{A}\sigma}\mathbf{B}\mathbf{u}(\sigma)\,d\sigma.$$

Multiply through on the left by $e^{\mathbf{A}t}$, and combine $e^{\mathbf{A}t}e^{-\mathbf{A}\sigma} = e^{\mathbf{A}(t-\sigma)}$. That is the formula.
:::

::: key Solution of the linear state equation
$\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t-\sigma)}\mathbf{B}\mathbf{u}(\sigma)\,d\sigma$. For a time-invariant $\mathbf{A}$ the matrix exponential is the state transition matrix, $\boldsymbol{\Phi}(t, t_0) = e^{\mathbf{A}(t-t_0)}$, and it satisfies $\boldsymbol{\Phi}(t_0,t_0) = \mathbf{I}$, $\boldsymbol{\Phi}(t_2,t_0) = \boldsymbol{\Phi}(t_2,t_1)\boldsymbol{\Phi}(t_1,t_0)$ and $\boldsymbol{\Phi}^{-1}(t,t_0) = \boldsymbol{\Phi}(t_0,t)$.
:::

$\boldsymbol{\Phi}$ is capital "phi". Its three rules say something plain: doing nothing for zero seconds changes nothing; going from $t_0$ to $t_2$ is the same as stopping at $t_1$ on the way; and running the clock backward undoes running it forward.

### The two halves

The formula has two halves with different jobs.

The **free response**, $e^{\mathbf{A}t}\mathbf{x}(0)$, is what the vehicle does if you leave it alone. In modal coordinates it is $\sum_i z_i(0)e^{\lambda_it}\mathbf{v}_i$: a blend of the modes, each growing or fading at its own rate.

The **forced response** is a **[[convolution|convolution-picture]]**. Each instant $\sigma$, the input gives the state a small push. That push then evolves freely for the remaining $t - \sigma$ seconds. The integral adds up all those pushes. Split by modes, it becomes $\sum_i \mathbf{v}_i\int_0^t e^{\lambda_i(t-\sigma)}\bar{\mathbf{b}}_i^\mathsf{T}\mathbf{u}(\sigma)\,d\sigma$, where $\bar{\mathbf{b}}_i^\mathsf{T}$ is row $i$ of the modal input matrix from Lesson 2. So each mode filters the input through its own first-order lag before it contributes. A mode with $\bar{\mathbf{b}}_i^\mathsf{T} = \mathbf{0}$ contributes nothing, whatever you command. Lesson 4 turns that fact into the controllability test.

### Where the state settles

Hold a constant input $\mathbf{u}$ on a stable plant and wait. The state stops changing, so $\dot{\mathbf{x}} = \mathbf{0}$:

$$\mathbf{0} = \mathbf{A}\mathbf{x}_{ss} + \mathbf{B}\mathbf{u} \quad\Longrightarrow\quad \mathbf{x}_{ss} = -\mathbf{A}^{-1}\mathbf{B}\mathbf{u}.$$

The subscript $ss$ means "steady state". Put that into the output equation to get the **DC gain** — the output per unit of steady input:

$$\mathbf{G}(0) = -\mathbf{C}\mathbf{A}^{-1}\mathbf{B} + \mathbf{D}.$$

Check it on every model you build, because it usually has a story you can verify by hand. Take the gimbal's rate subsystem: states $(\omega, \tau)$, $\mathbf{A} = \begin{pmatrix}-0.5 & 1.25 \\ 0 & -50\end{pmatrix}$, $\mathbf{B} = (0, 50)^\mathsf{T}$, $\mathbf{C} = (1\ \ 0)$. The DC gain comes out at $2.5\,\mathrm{rad/(s\,N\,m)}$. That is $1/b$, with $b = 0.4\,\mathrm{N\,m\,s/rad}$. The story: a steady torque spins the gimbal faster and faster until friction pushes back equally hard. If a DC gain has no story like that, the model probably has a mistake in it.

## Exact discretization under a zero-order hold

A digital controller writes each command to a **[[digital-to-analog converter|zoh-staircase]]**, which holds it steady until the next update, $T$ seconds later. $T$ is the **sample period**. Holding a value flat like this is called a **zero-order hold** (ZOH). Over one step, then,

$$\mathbf{u}(\sigma) = \mathbf{u}_k \quad \text{for} \quad t_k \le \sigma < t_k + T.$$

Now use the solution formula over exactly one step, starting from $\mathbf{x}_k = \mathbf{x}(t_k)$:

1. The free part carries $\mathbf{x}_k$ forward by $T$: $e^{\mathbf{A}T}\mathbf{x}_k$.
2. In the forced part, the input is the constant $\mathbf{u}_k$, so it comes out of the integral.
3. Change the variable to $s = t_k + T - \sigma$, the time remaining until the end of the step. As $\sigma$ runs across the step, $s$ runs from $T$ down to $0$.

The result:

$$\mathbf{x}_{k+1} = e^{\mathbf{A}T}\mathbf{x}_k + \left(\int_0^{T}e^{\mathbf{A}s}\,ds\right)\mathbf{B}\,\mathbf{u}_k.$$

This is an **exact** difference equation, not an approximation. If the command really is held flat, it lands on the continuous trajectory at every tick, to machine precision, whatever $T$ is.

::: key Exact zero-order-hold discretization
$\mathbf{A}_d = e^{\mathbf{A}T}$ and $\mathbf{B}_d = \left(\int_0^{T}e^{\mathbf{A}s}\,ds\right)\mathbf{B}$, giving $\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k$ with $\mathbf{C}$ and $\mathbf{D}$ unchanged. In practice both are computed from one exponential of the block matrix $\begin{pmatrix}\mathbf{A} & \mathbf{B} \\ \mathbf{0} & \mathbf{0}\end{pmatrix}$, whose exponential over $T$ is $\begin{pmatrix}\mathbf{A}_d & \mathbf{B}_d \\ \mathbf{0} & \mathbf{I}\end{pmatrix}$.
:::

### The block-matrix trick

Here is why one exponential gives both matrices. Pretend the held input is part of the state: $\tilde{\mathbf{x}} = (\mathbf{x}, \mathbf{u})$ ("x tilde"). During a step the input does not change, so $\dot{\mathbf{u}} = \mathbf{0}$. The dynamics of the bigger state are

$$\frac{d}{dt}\begin{pmatrix}\mathbf{x}\\ \mathbf{u}\end{pmatrix} = \begin{pmatrix}\mathbf{A} & \mathbf{B} \\ \mathbf{0} & \mathbf{0}\end{pmatrix}\begin{pmatrix}\mathbf{x}\\ \mathbf{u}\end{pmatrix}.$$

Exponentiating that block matrix over $T$ carries both pieces forward one step. The top-left block is $e^{\mathbf{A}T}$. The top-right block is exactly $\int_0^T e^{\mathbf{A}s}ds\,\mathbf{B}$. One call to a good `expm` routine — one using **[[scaling and squaring|nineteen-dubious-ways]]**, as Linear Algebra II describes — gives you both, with no separate integration and no special cases.

### A closed form, and why it often fails

When $\mathbf{A}$ can be inverted, $\int_0^Te^{\mathbf{A}s}ds = \mathbf{A}^{-1}(e^{\mathbf{A}T}-\mathbf{I})$, the same way that $\int_0^T e^{as}ds = (e^{aT}-1)/a$ for a number. So

$$\mathbf{B}_d = \mathbf{A}^{-1}(\mathbf{A}_d - \mathbf{I})\mathbf{B}.$$

It is fine for a quick check. It is useless for most vehicle models, because rigid-body attitude and position both put integrators — zero eigenvalues — into $\mathbf{A}$, and a matrix with a zero eigenvalue cannot be inverted. The block-matrix route has no such limit.

::: example The gimbal at 100 Hz and at 10 Hz
The gimbal has $\mathbf{A} = \begin{pmatrix}0&1&0\\0&-0.5&1.25\\0&0&-50\end{pmatrix}$ and $\mathbf{B} = (0,0,50)^\mathsf{T}$. Build the $4\times4$ block matrix and exponentiate it.

**At 100 Hz** ($T = 0.01\,\mathrm{s}$):

$$\mathbf{A}_d = \begin{pmatrix} 1 & 0.009975 & 0.0000532 \\ 0 & 0.995012 & 0.009810 \\ 0 & 0 & 0.606531\end{pmatrix}, \qquad \mathbf{B}_d = \begin{pmatrix}9.22\times10^{-6}\\ 0.002659 \\ 0.393469\end{pmatrix}.$$

**At 10 Hz** ($T = 0.1\,\mathrm{s}$):

$$\mathbf{A}_d = \begin{pmatrix} 1 & 0.097541 & 0.001962 \\ 0 & 0.951229 & 0.023851 \\ 0 & 0 & 0.006738\end{pmatrix}, \qquad \mathbf{B}_d = \begin{pmatrix}0.004186\\ 0.098076 \\ 0.993262\end{pmatrix}.$$

**Check what you can by hand** (all at $T = 0.1$):

- The eigenvalues of $\mathbf{A}_d$ are $e^{\lambda T}$: $e^{0} = 1$, $e^{-0.05} = 0.951229$ and $e^{-5} = 0.006738$. $\mathbf{A}$ is triangular, so $\mathbf{A}_d$ is too, and these sit on its diagonal.
- $\Phi_{12} = \int_0^{T}e^{-0.5s}ds = 2\left(1 - e^{-0.05}\right) = 0.097541$. This is how far the angle moves per unit of starting rate, allowing for drag.
- $\Phi_{23} = 1.25\int_0^Te^{-0.5(T-s)}e^{-50s}ds = 1.25\,e^{-0.05}\left(1-e^{-4.95}\right)/49.5 = 0.023851$.
- $B_{d,3} = 1 - e^{-5} = 0.993262$. In one $0.1\,\mathrm{s}$ step, the motor torque reaches $99.3\,\%$ of its command. At $T = 0.01\,\mathrm{s}$ it reaches only $39.3\,\%$, because that step is half a time constant.

**Now try forward Euler.** The habit is to write $\mathbf{A}_d \approx \mathbf{I} + \mathbf{A}T$ and $\mathbf{B}_d \approx \mathbf{B}T$ — the first two terms of the series.

- At $T = 0.01\,\mathrm{s}$ its eigenvalues are $1$, $0.995$ and $0.5$. The fast mode should be $0.6065$, so it is off by $18\,\%$. Survivable.
- At $T = 0.1\,\mathrm{s}$ they are $1$, $0.95$ and $1 + (-50)(0.1) = -4$.

A mode with a $20\,\mathrm{ms}$ time constant, comfortably stable in the real hardware, has become a discrete mode that multiplies by four and flips sign every step. The Euler model does not merely lose accuracy. It lies about stability. The exact discretization costs one `expm` call at start-up and removes the question.
:::

::: warning Euler is a solver, not a discretization
Forward Euler is a rule for simulating a plant with small steps. The zero-order hold is a statement about what the actuator physically does between updates. They are different things, and only the hold is exact. Use the exponential for the design model. If you must use Euler inside a simulation, its step has to be small compared with the fastest time constant in $\mathbf{A}$ — which, for a stiff vehicle model, means far smaller than the control period.
:::

## The discrete model and its stability

The discrete model is a state-space system in its own right:

$$\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k, \qquad \mathbf{y}_k = \mathbf{C}\mathbf{x}_k + \mathbf{D}\mathbf{u}_k.$$

Its transfer matrix uses $z$ instead of $s$: $\mathbf{G}_d(z) = \mathbf{C}(z\mathbf{I}-\mathbf{A}_d)^{-1}\mathbf{B}_d + \mathbf{D}$. Everything in this module carries over. Similarity transforms work the same way. The controllability matrix is $[\mathbf{B}_d, \mathbf{A}_d\mathbf{B}_d, \dots]$. Pole placement puts the eigenvalues of $\mathbf{A}_d - \mathbf{B}_d\mathbf{K}_d$ where you want them.

Only the test for stability changes. With no input, each tick multiplies the state by $\mathbf{A}_d$, so after $k$ ticks $\mathbf{x}_k = \mathbf{A}_d^k\mathbf{x}_0$. Its modes behave like $\mu_i^k$, where $\mu_i$ ("mu sub i") are the eigenvalues of $\mathbf{A}_d$. A number raised to higher and higher powers shrinks to zero only if its size is less than one. So the discrete system is **asymptotically stable** — every mode dies away — exactly when every eigenvalue satisfies $|\mu_i| < 1$. The eigenvalues must lie **[[inside the unit circle|unit-circle-map]]**, not in the left half plane.

The two pictures agree. Because $\mu_i = e^{\lambda_iT}$, the size is $|\mu_i| = e^{\operatorname{Re}(\lambda_i)T}$, which is below one exactly when $\operatorname{Re}\lambda_i < 0$. The map $\lambda \mapsto e^{\lambda T}$ sends:

- the left half plane onto the inside of the unit circle;
- the imaginary axis onto the unit circle itself;
- the real axis onto the positive real numbers.

Applying the left-half-plane test to an $\mathbf{A}_d$ matrix is a silent and common error. The gimbal's $\mathbf{A}_d$ has all-positive eigenvalues — a left-half-plane test would call every mode unstable — yet none lies outside the unit circle.

### Aliasing, in state-space terms

The map is many-to-one in the imaginary direction. Adding $2\pi ik/T$ to $\lambda$, for any whole number $k$, adds a full turn to the angle of $e^{\lambda T}$:

$$e^{(\lambda + 2\pi ik/T)T} = e^{\lambda T}e^{2\pi ik} = e^{\lambda T}.$$

So continuous modes whose frequencies differ by a multiple of the sample rate look identical once sampled. That is **[[aliasing|wagon-wheel]]**.

::: example A bending mode that the sample rate moves
A launch vehicle's first bending mode is at $12\,\mathrm{Hz}$, with damping ratio $\zeta = 0.005$. Its natural frequency is $\omega_n = 2\pi(12) = 75.40\,\mathrm{rad/s}$, and its eigenvalues are

$$\lambda = -\zeta\omega_n \pm i\omega_n\sqrt{1-\zeta^2} = -0.377 \pm 75.397i\ \mathrm{s^{-1}}.$$

Discretize at $10\,\mathrm{Hz}$, so $T = 0.1\,\mathrm{s}$. Take the upper eigenvalue:

$$\mu = e^{\lambda T} = e^{-0.0377}e^{\,i\,7.5397} = 0.9630\,e^{\,i\,1.2565}.$$

The angle $7.5397\,\mathrm{rad}$ is more than a full turn. Subtract one turn: $7.5397 - 2\pi = 1.2565$.

**What the discrete model reports.** A mode turning $1.2565\,\mathrm{rad}$ per step reads back as a continuous frequency of $1.2565/0.1 = 12.57\,\mathrm{rad/s}$, which is $2.00\,\mathrm{Hz}$. The $12\,\mathrm{Hz}$ mode has been folded down to $2\,\mathrm{Hz}$ — exactly $|12 - 10|$. The size $0.9630$ correctly reports its very light damping. So the discrete model contains a slow, persistent $2\,\mathrm{Hz}$ wobble that does not exist on the vehicle.

**Sanity check.** $12\,\mathrm{Hz}$ is above the **[[Nyquist frequency|nyquist-frequency]]** of $5\,\mathrm{Hz}$ (half the sample rate), so it had to fold down to something below $5\,\mathrm{Hz}$. $2\,\mathrm{Hz}$ is.

Nothing here is a numerical error. The discretization is exact at the sample instants. It is the frequency label that means nothing above the Nyquist frequency. The fixes are physical, not numerical: sample faster than twice the highest dynamics you need to represent, and put an analog **anti-alias filter** ahead of the converter, so that energy above the Nyquist frequency never reaches the sampler. A digital filter cannot undo aliasing, because by the time the samples exist, the information is gone.
:::

## What the sample period costs

Being exact at the sample instants is not a free lunch. Three effects grow with $T$:

- **Hold lag.** Holding a command flat across a step delays its average effect by about $T/2$. At a loop crossover frequency $\omega_c$, that costs roughly $\omega_cT/2$ radians of phase. At $\omega_c = 1\,\mathrm{rad/s}$ and $T = 0.1\,\mathrm{s}$ it is $0.05\,\mathrm{rad} = 2.9^\circ$ — negligible. At $\omega_c = 10\,\mathrm{rad/s}$ and the same $T$ it is $28.6^\circ$, most of a typical phase margin.
- **Computation delay.** In most real systems, the sample read at $t_k$ produces a command applied at $t_{k+1}$ — a further full step of delay. In state space you model it honestly by adding the held command as an extra state: $\tilde{\mathbf{x}} = (\mathbf{x}, \mathbf{u}_{k-1})$, with $\tilde{\mathbf{A}} = \begin{pmatrix}\mathbf{A}_d & \mathbf{B}_d \\ \mathbf{0} & \mathbf{0}\end{pmatrix}$ and $\tilde{\mathbf{B}} = \begin{pmatrix}\mathbf{0}\\\mathbf{I}\end{pmatrix}$. A fixed delay can be modeled and compensated. Jitter in that delay cannot.
- **Aliasing**, as above.

A useful rule of thumb: sample fifteen to thirty times faster than the closed-loop bandwidth you want, and faster still if lightly damped modes above it must be kept stable by the controller.

::: example Propagating a spacecraft exactly, with no exponential at all
Take the six-state pyramid-wheel spacecraft of Lesson 1: $\mathbf{A} = \begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{0}&\mathbf{0}\end{pmatrix}$ and $\mathbf{B} = \begin{pmatrix}\mathbf{0}\\\mathbf{J}^{-1}\mathbf{A}_w\end{pmatrix}$.

**The series stops.** Multiply $\mathbf{A}$ by itself: $\mathbf{A}^2 = \mathbf{0}$. A matrix with a power equal to zero is called **nilpotent**. Every term of the exponential series from $\mathbf{A}^2$ on vanishes, so the exponential stops after two terms and its integral after three:

$$\mathbf{A}_d = \mathbf{I} + \mathbf{A}T = \begin{pmatrix}\mathbf{I} & T\mathbf{I}\\ \mathbf{0} & \mathbf{I}\end{pmatrix}, \qquad \mathbf{B}_d = \left(T\mathbf{I} + \tfrac{1}{2}T^2\mathbf{A}\right)\mathbf{B} = \begin{pmatrix}\tfrac{1}{2}T^2\,\mathbf{J}^{-1}\mathbf{A}_w \\ T\,\mathbf{J}^{-1}\mathbf{A}_w\end{pmatrix}.$$

Computing the block exponential numerically at $T = 0.1\,\mathrm{s}$ agrees with these formulas to round-off (about $10^{-22}$).

**Read it.** Write $\boldsymbol{\alpha} = \mathbf{J}^{-1}\mathbf{A}_w\mathbf{u}$ ("alpha") for the angular acceleration the wheels produce. The model is the constant-acceleration update from physics class:

$$\boldsymbol{\theta}_{k+1} = \boldsymbol{\theta}_k + T\boldsymbol{\omega}_k + \tfrac{1}{2}T^2\boldsymbol{\alpha}_k, \qquad \boldsymbol{\omega}_{k+1} = \boldsymbol{\omega}_k + T\boldsymbol{\alpha}_k.$$

**Put numbers on it.** Command wheel 1 to its full $0.2\,\mathrm{N\,m}$ at a $10\,\mathrm{Hz}$ control rate. Per step, the $x$ body rate grows by

$$B_{d,41}u_1 = 0.1\times4.811\times10^{-4}\times0.2 = 9.62\times10^{-6}\,\mathrm{rad/s},$$

and, starting from rest, the $x$ attitude moves $\tfrac{1}{2}(0.1)^2(9.62\times10^{-5}) = 4.81\times10^{-7}\,\mathrm{rad}$ in that first step. Hold it for a full minute — 600 steps — and the rate reaches $600 \times 9.62\times10^{-6} = 5.77\times10^{-3}\,\mathrm{rad/s}$, which is $0.331\ ^\circ/\mathrm{s}$. That is a realistic slew-acceleration budget for a $1200\,\mathrm{kg\,m^2}$ axis. It explains why a $90^\circ$ turn on a spacecraft of this class takes minutes rather than seconds.

**One thing exactness does not buy.** Because $\mathbf{A}$ is nilpotent, this discretization is exact for any $T$ at all. But a $10\,\mathrm{s}$ step would still be a terrible control period. Whether the model is exact and whether the sample rate is adequate are separate questions.
:::

The code below discretizes the gimbal both ways and compares the eigenvalue sizes. It writes its own `expm` by scaling and squaring, to show there is no magic inside.

```python
import numpy as np

def expm(A, terms=24):                      # scaling and squaring
    nrm = np.abs(A).sum(axis=1).max()
    s = max(0, int(np.ceil(np.log2(nrm / 0.5)))) if nrm > 0.5 else 0
    X, E, T = A / 2.0 ** s, np.eye(len(A)), np.eye(len(A))
    for k in range(1, terms + 1):
        T = T @ X / k
        E = E + T
    for _ in range(s):
        E = E @ E
    return E

def zoh(A, B, T):                           # one exponential, both matrices
    n, m = A.shape[0], B.shape[1]
    M = np.zeros((n + m, n + m))
    M[:n, :n], M[:n, n:] = A, B
    E = expm(M * T)
    return E[:n, :n], E[:n, n:]

A = np.array([[0.0, 1, 0], [0, -0.5, 1.25], [0, 0, -50]])
B = np.array([[0.0], [0], [50]])
for T in (0.01, 0.1):
    Ad, Bd = zoh(A, B, T)
    euler = np.linalg.eigvals(np.eye(3) + A * T)
    print(f"T={T}:  |eig(Ad)| = {np.abs(np.linalg.eigvals(Ad)).round(6)}"
          f"   |eig(Euler)| = {np.abs(euler).round(6)}")
# T=0.01:  |eig(Ad)| = [1.       0.995012 0.606531]   |eig(Euler)| = [1.    0.995 0.5  ]
# T=0.1:  |eig(Ad)| = [1.       0.951229 0.006738]   |eig(Euler)| = [1.   0.95 4.  ]
```

::: note Process noise discretizes too
The estimation tier needs one more piece of this machinery. Suppose random pushes $\mathbf{w}$ drive the plant: $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{G}\mathbf{w}$, with spectral density $\mathbf{Q}_c$ (how strong the noise is per unit bandwidth). Over one step these pushes add a covariance $\mathbf{Q}_d = \int_0^T e^{\mathbf{A}s}\mathbf{G}\mathbf{Q}_c\mathbf{G}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}s}ds$ to the state's uncertainty. It comes from a single exponential of a different block matrix — **[[Van Loan's method|van-loan]]**. The structure is the same as the $\mathbf{B}_d$ trick, and so is the discipline: compute it once at start-up from the continuous model, rather than tuning a discrete number until the filter looks happy.
:::

## Check yourself

::: check
A plant has $\mathbf{A} = \operatorname{diag}(-1, -100)\ \mathrm{s^{-1}}$ and $\mathbf{B} = (1, 1)^\mathsf{T}$. Write $\mathbf{A}_d$ and $\mathbf{B}_d$ exactly for $T = 0.02\,\mathrm{s}$, and compare with forward Euler.
:::

::: answer
Both matrices are diagonal, so the two states never interact, and each can be done on its own.

$\mathbf{A}_d = \operatorname{diag}(e^{-0.02}, e^{-2}) = \operatorname{diag}(0.980199, 0.135335)$.

$\mathbf{A}$ is invertible, so use $\mathbf{B}_d = \mathbf{A}^{-1}(\mathbf{A}_d - \mathbf{I})\mathbf{B}$ entry by entry: $(1-e^{-0.02})/1 = 0.019801$ and $(1-e^{-2})/100 = 0.008647$.

Forward Euler gives $\mathbf{A}_d \approx \operatorname{diag}(1 - 0.02,\ 1 - 2) = \operatorname{diag}(0.98, -1)$ and $\mathbf{B}_d \approx (0.02, 0.02)^\mathsf{T}$.

The slow mode is fine. The fast mode has $|\mu| = 1$: it sits exactly on the stability boundary, flipping sign every step forever. A step only $1\,\%$ longer would push it outside. And the input gain on that channel is wrong by a factor of $0.02/0.008647 = 2.3$.
:::

::: check
The gimbal's discrete model at $T = 0.1\,\mathrm{s}$ has three real, positive eigenvalues: $1$, $0.951$ and $0.0067$. Is it stable? What are the matching continuous eigenvalues?
:::

::: answer
It is marginally stable, not asymptotically stable, because one eigenvalue sits at $\mu = 1$ — exactly on the unit circle. Being positive and real says nothing by itself; the test is $|\mu| < 1$.

To go back, invert the map: $\lambda = \ln\mu/T$.

- $\ln 1/0.1 = 0$.
- $\ln 0.951229/0.1 = -0.5\ \mathrm{s^{-1}}$.
- $\ln 0.006738/0.1 = -50\ \mathrm{s^{-1}}$.

These are the continuous eigenvalues. The $\mu = 1$ mode is the free integration from rate to angle. It belongs to the gimbal, not to the sampling.
:::

::: check
Why can you not compute $\mathbf{B}_d$ for the six-state spacecraft model using $\mathbf{B}_d = \mathbf{A}^{-1}(\mathbf{A}_d - \mathbf{I})\mathbf{B}$?
:::

::: answer
Because $\mathbf{A} = \begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{0}&\mathbf{0}\end{pmatrix}$ is nilpotent and therefore singular. All six eigenvalues are zero, and $\mathbf{A}^{-1}$ does not exist. Rigid-body models always look like this, because attitude is the running total of rate with nothing pulling it back.

Use the block-matrix exponential, which never needs an inverse. Or, in this particular case, use the series that stops: $\int_0^Te^{\mathbf{A}s}ds = T\mathbf{I} + \tfrac{1}{2}T^2\mathbf{A}$.
:::

::: check
A control loop is to have its crossover at $2\,\mathrm{Hz}$. Estimate the phase lost to a zero-order hold plus one step of computation delay at sample rates of $20\,\mathrm{Hz}$ and $100\,\mathrm{Hz}$.
:::

::: answer
Crossover is $\omega_c = 2\pi(2) = 12.57\,\mathrm{rad/s}$. The hold costs about $\omega_cT/2$ and the one-step delay about $\omega_cT$, so roughly $1.5\,\omega_cT$ in total.

- At $20\,\mathrm{Hz}$, $T = 0.05\,\mathrm{s}$: $1.5(12.57)(0.05) = 0.943\,\mathrm{rad} = 54^\circ$. That is more than any reasonable phase margin, so the design will not work.
- At $100\,\mathrm{Hz}$, $T = 0.01\,\mathrm{s}$: $0.189\,\mathrm{rad} = 10.8^\circ$. An affordable bite out of a $45^\circ$ budget.

The ratio of sample rate to crossover is $10$ in the first case and $50$ in the second, on either side of the usual rule of fifteen to thirty.
:::

::: check
A model is discretized at $50\,\mathrm{Hz}$, and its discrete spectrum shows a mode at $\mu = 0.99\,e^{\pm i\,0.5}$. Name two continuous modes consistent with that.
:::

::: answer
Use $\mu = e^{\lambda T}$ with $T = 0.02\,\mathrm{s}$.

The size gives the real part: $\operatorname{Re}\lambda = \ln 0.99/0.02 = -0.503\,\mathrm{s^{-1}}$.

The angle gives the imaginary part, up to whole turns: $\operatorname{Im}\lambda = (0.5 + 2\pi k)/0.02$ for any whole number $k$.

- With $k = 0$: $25.0\,\mathrm{rad/s}$, or $3.98\,\mathrm{Hz}$.
- With $k = 1$: $(0.5 + 6.283)/0.02 = 339\,\mathrm{rad/s}$, or $53.98\,\mathrm{Hz}$.

The second is the first plus the $50\,\mathrm{Hz}$ sample rate, exactly as aliasing requires. The samples cannot tell them apart. Only knowledge of the physics — or an anti-alias filter that removed everything above $25\,\mathrm{Hz}$ before sampling — settles which one you are looking at.
:::

## Summary

| Item | Statement |
| --- | --- |
| Solution | $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^te^{\mathbf{A}(t-\sigma)}\mathbf{B}\mathbf{u}(\sigma)d\sigma$ |
| Transition matrix | $\boldsymbol{\Phi}(t,t_0) = e^{\mathbf{A}(t-t_0)}$; composes, inverts, $\dot{\boldsymbol{\Phi}} = \mathbf{A}\boldsymbol{\Phi}$ |
| Steady state | $\mathbf{x}_{ss} = -\mathbf{A}^{-1}\mathbf{B}\mathbf{u}$; DC gain $\mathbf{G}(0) = -\mathbf{C}\mathbf{A}^{-1}\mathbf{B} + \mathbf{D}$ |
| ZOH discretization | $\mathbf{A}_d = e^{\mathbf{A}T}$, $\mathbf{B}_d = \left(\int_0^Te^{\mathbf{A}s}ds\right)\mathbf{B}$; exact for a held input |
| Block-matrix method | $\exp\!\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{0}&\mathbf{0}\end{pmatrix}T = \begin{pmatrix}\mathbf{A}_d&\mathbf{B}_d\\\mathbf{0}&\mathbf{I}\end{pmatrix}$ |
| Invertible $\mathbf{A}$ only | $\mathbf{B}_d = \mathbf{A}^{-1}(\mathbf{A}_d-\mathbf{I})\mathbf{B}$ — fails for rigid-body models |
| Discrete stability | $\lvert\mu_i\rvert < 1$; $\mu_i = e^{\lambda_iT}$, so the left half plane maps to the unit disc |
| Aliasing | $\lambda$ and $\lambda + 2\pi ik/T$ give the same $\mu$; $12\,\mathrm{Hz}$ at $10\,\mathrm{Hz}$ reads as $2\,\mathrm{Hz}$ |
| Cost of $T$ | hold lag $\approx\omega_cT/2$, computation delay $\approx\omega_cT$; sample 15–30 times the bandwidth |
| Rigid body | $\mathbf{A}^2 = \mathbf{0}$ gives $\mathbf{A}_d = \mathbf{I}+\mathbf{A}T$, $\mathbf{B}_d = (T\mathbf{I}+\tfrac12T^2\mathbf{A})\mathbf{B}$, exact for any $T$ |

You can now write a model, change its coordinates and propagate it. What you cannot yet do is say whether your actuators can push it where you want. That is the next lesson, and it is the most consequential question in this module.

::: context why-exponential Why an exponential of a matrix makes sense
For one number, $e^{at}$ is the only function whose rate of change is $a$ times itself. The series $1 + at + (at)^2/2! + \cdots$ is how you compute it. Nothing in that series needs $a$ to be a number: you can square a square matrix, divide it by $2$, and add matrices. So the same series defines $e^{\mathbf{A}t}$, and differentiating it term by term gives $\mathbf{A}e^{\mathbf{A}t}$. That is exactly the property that makes $e^{\mathbf{A}t}\mathbf{x}(0)$ solve $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$. For a diagonal $\mathbf{A}$ it is the plain exponential of each diagonal entry.
:::

::: context variation-of-constants Where the name comes from
With no input, the solution is $e^{\mathbf{A}t}\mathbf{c}$, where $\mathbf{c}$ is a constant vector fixed by the starting state. The trick behind the forced solution is to let that "constant" vary: try $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{c}(t)$ and ask how $\mathbf{c}$ must change for the input to be accounted for. The answer is $\dot{\mathbf{c}} = e^{-\mathbf{A}t}\mathbf{B}\mathbf{u}$, and integrating gives the formula. Hence "variation of constants", also called "variation of parameters".
:::

::: context convolution-picture Every push leaves a fading wake
Here one mode with a $1.2\,\mathrm{s}$ time constant gets three short kicks, at $0$, $1$ and $2\,\mathrm{s}$, of sizes $1$, $0.6$ and $0.8$. Each kick starts its own decaying wake (dashed). The state is the sum of all the wakes (solid). The convolution integral is this picture with the kicks packed infinitely close together.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="352" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="150" x2="30" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#b4232c" stroke-width="4">
    <line x1="30" y1="150" x2="30" y2="80"/><line x1="94" y1="150" x2="94" y2="108"/><line x1="158" y1="150" x2="158" y2="94"/>
  </g>
  <g fill="none" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4">
    <polyline points="30.0,80.0 42.8,90.7 55.6,99.8 68.4,107.5 81.2,114.1 94.0,119.6 106.8,124.2 119.6,128.2 132.4,131.5 145.2,134.4 158.0,136.8 170.8,138.8 183.6,140.5 196.4,142.0 209.2,143.2 222.0,144.3 234.8,145.1 247.6,145.9 260.4,146.5 273.2,147.0 286.0,147.5 298.8,147.9 311.6,148.2 324.4,148.5 337.2,148.7 350.0,148.9"/>
    <polyline points="94.0,108.0 106.8,114.4 119.6,119.9 132.4,124.5 145.2,128.4 158.0,131.7 170.8,134.5 183.6,136.9 196.4,138.9 209.2,140.6 222.0,142.1 234.8,143.3 247.6,144.3 260.4,145.2 273.2,145.9 286.0,146.6 298.8,147.1 311.6,147.5 324.4,147.9 337.2,148.2 350.0,148.5"/>
    <polyline points="158.0,94.0 170.8,102.6 183.6,109.9 196.4,116.0 209.2,121.2 222.0,125.7 234.8,129.4 247.6,132.6 260.4,135.2 273.2,137.5 286.0,139.4 298.8,141.0 311.6,142.4 324.4,143.6 337.2,144.6 350.0,145.4"/>
  </g>
  <polyline points="30.0,80.0 36.4,85.6 42.8,90.7 49.2,95.5 55.6,99.8 62.0,103.9 68.4,107.5 74.8,110.9 81.2,114.1 87.6,116.9 94.0,119.6 94.0,77.6 100.4,83.4 106.8,88.7 113.2,93.6 119.6,98.1 126.0,102.3 132.4,106.1 138.8,109.6 145.2,112.8 151.6,115.8 158.0,118.6 158.0,62.5 164.4,69.5 170.8,76.0 177.2,81.9 183.6,87.3 190.0,92.3 196.4,96.9 202.8,101.2 209.2,105.1 215.6,108.7 222.0,112.0 228.4,115.0 234.8,117.8 241.2,120.4 247.6,122.8 254.0,124.9 260.4,126.9 266.8,128.8 273.2,130.5 279.6,132.0 286.0,133.5 292.4,134.8 298.8,136.0 305.2,137.1 311.6,138.2 318.0,139.1 324.4,140.0 330.8,140.8 337.2,141.5 343.6,142.2 350.0,142.8" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="166">0</text><text x="94" y="166">1</text><text x="158" y="166">2</text><text x="222" y="166">3</text><text x="286" y="166">4</text><text x="350" y="166">5</text>
    <text x="190" y="181">time (s)</text>
  </g>
  <text x="200" y="80" font-size="12" fill="#1d6fd1">sum of the wakes</text>
  <text x="170" y="56" font-size="12" fill="#b4232c">kicks</text>
</svg>
```
:::

::: context zoh-staircase What a zero-order hold looks like
The computer decides a new command only at each tick. Between ticks, the converter keeps putting out the last value, so a smooth command (grey) reaches the actuator as a staircase (blue). The dots are the values the computer chose. The staircase trails the smooth curve by about half a step on average — the hold lag this lesson counts later.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="352" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="140" x2="30" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="30.0,75.0 38.0,65.6 46.0,56.6 54.0,48.2 62.0,40.8 70.0,34.5 78.0,29.8 86.0,26.6 94.0,25.1 102.0,25.4 110.0,27.4 118.0,31.2 126.0,36.5 134.0,43.1 142.0,50.9 150.0,59.5 158.0,68.7 166.0,78.1 174.0,87.4 182.0,96.3 190.0,104.4 198.0,111.4 206.0,117.2 214.0,121.5 222.0,124.1 230.0,125.0 238.0,124.1 246.0,121.5 254.0,117.2 262.0,111.4 270.0,104.4 278.0,96.3 286.0,87.4 294.0,78.1 302.0,68.7 310.0,59.5 318.0,50.9 326.0,43.1 334.0,36.5 342.0,31.2 350.0,27.4" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <polyline points="30.0,75.0 62.0,75.0 62.0,40.8 94.0,40.8 94.0,25.1 126.0,25.1 126.0,36.5 158.0,36.5 158.0,68.7 190.0,68.7 190.0,104.4 222.0,104.4 222.0,124.1 254.0,124.1 254.0,117.2 286.0,117.2 286.0,87.4 318.0,87.4 318.0,50.9 350.0,50.9" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1f2a44"><circle cx="30" cy="75" r="3"/><circle cx="62" cy="40.8" r="3"/><circle cx="94" cy="25.1" r="3"/><circle cx="126" cy="36.5" r="3"/><circle cx="158" cy="68.7" r="3"/><circle cx="190" cy="104.4" r="3"/><circle cx="222" cy="124.1" r="3"/><circle cx="254" cy="117.2" r="3"/><circle cx="286" cy="87.4" r="3"/><circle cx="318" cy="50.9" r="3"/></g>
  <g stroke="#1f2a44" stroke-width="1"><line x1="62" y1="140" x2="62" y2="145"/><line x1="94" y1="140" x2="94" y2="145"/></g>
  <text x="78" y="157" font-size="11" text-anchor="middle" fill="#1f2a44">one step T</text>
</svg>
```
:::

::: context nineteen-dubious-ways Nineteen dubious ways
Computing a matrix exponential well is harder than it looks. Summing the series directly can lose every digit when $\mathbf{A}t$ is large. In 1978 Cleve Moler and Charles Van Loan published a famous survey called "Nineteen Dubious Ways to Compute the Exponential of a Matrix", and revisited it in 2003. The method that came out on top uses the rule $e^{\mathbf{M}} = \bigl(e^{\mathbf{M}/2^s}\bigr)^{2^s}$: shrink the matrix by halving it $s$ times until the series converges fast, then square the result $s$ times. That is what `scipy.linalg.expm` does, with a refined rational approximation in place of the plain series.
:::

::: context unit-circle-map Where the gimbal's eigenvalues land
The unit circle is the stability boundary for a discrete model. At $T = 0.1\,\mathrm{s}$ the exact gimbal eigenvalues (blue) sit at $1$, $0.951$ and $0.0067$ — on or inside it. Forward Euler puts the fast one at $-4$ (red), far outside. The aliased $12\,\mathrm{Hz}$ bending mode from the example (orange) lands a little inside, at $0.963$ in size and $\pm1.2565\,\mathrm{rad}$ in angle. Drawn to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="95" y1="100" x2="345" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="250" y1="40" x2="250" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="250" cy="100" r="35" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="281" y1="96" x2="289" y2="104"/><line x1="281" y1="104" x2="289" y2="96"/>
    <line x1="279.3" y1="96" x2="287.3" y2="104"/><line x1="279.3" y1="104" x2="287.3" y2="96"/>
    <line x1="246.2" y1="96" x2="254.2" y2="104"/><line x1="246.2" y1="104" x2="254.2" y2="96"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5"><line x1="106" y1="96" x2="114" y2="104"/><line x1="106" y1="104" x2="114" y2="96"/></g>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1"><circle cx="260.4" cy="67.9" r="4"/><circle cx="260.4" cy="132.1" r="4"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="110" y="120">−4 (Euler)</text>
    <text x="250" y="178">unit circle, radius 1</text>
    <text x="318" y="92">1, 0.951</text>
    <text x="236" y="120">0.0067</text>
    <text x="298" y="62">aliased mode</text>
  </g>
</svg>
```
:::

::: context wagon-wheel The wagon-wheel effect
In old films, a wagon wheel sometimes seems to turn slowly backward while the wagon races forward. The camera takes a fixed number of pictures per second. If a spoke moves almost exactly one spoke-spacing between frames, each picture shows the wheel nearly where it was — shifted a little back. Your eye reads that as slow backward rotation. It is aliasing: a fast motion, sampled too slowly, is mistaken for a slow one. The $12\,\mathrm{Hz}$ bending mode seen at $10\,\mathrm{Hz}$ is the same trick.
:::

::: context nyquist-frequency The Nyquist frequency
The **Nyquist frequency** is half the sample rate. Below it, each sampled frequency corresponds to one true frequency. Above it, frequencies fold back down into the range below, like a sheet of paper folded at that line. It is named after Harry Nyquist, a Bell Labs engineer whose work in the 1920s showed how fast a signal must be sampled to carry a given bandwidth. Claude Shannon later stated the sampling theorem in its well-known form: to capture everything below some frequency, sample at more than twice that frequency.
:::

::: context van-loan A bridge to the Kalman filter
In 1978 Charles Van Loan published a short paper showing that several integrals involving the matrix exponential — including $\mathbf{Q}_d$ — can be read off one exponential of a larger block matrix, the way $\mathbf{B}_d$ is. Kalman filters on real spacecraft use this every time they turn a continuous noise model into a per-step covariance. You will meet $\mathbf{Q}_d$ again in the estimation tier, where it decides how much the filter trusts its model between measurements.
:::
