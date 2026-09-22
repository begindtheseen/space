---
id: l03-solving-the-state-equation-and-discretisation
title: Solving the state equation, and the model your computer runs
minutes: 18
covers:
  - "Solution of xdot = Ax + Bu via the matrix exponential; the discrete-time equivalent"
---

You now have a model and you know which parts of it are real. This lesson solves it. Given $\mathbf{x}(0)$ and a command history $\mathbf{u}(t)$, what is $\mathbf{x}(t)$? The answer is one formula, and the Linear Algebra II module already built every piece of it: the matrix exponential $e^{\mathbf{A}t}$, the state transition matrix $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$, and the zero-order-hold pair $(\boldsymbol{\Phi}, \boldsymbol{\Gamma})$ obtained from one exponentiation of a block matrix.

The reason to revisit it here is that the flight computer does not solve a differential equation. It holds a command constant for one sample period, reads sensors, and updates. The model it propagates is therefore a **difference** equation, $\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k$, and every design in the rest of this module — pole placement, observers, the servo — has a discrete-time twin that runs on those matrices. Getting $\mathbf{A}_d$ and $\mathbf{B}_d$ right is not a formality. The difference between the exact discretisation and the Euler approximation that engineers reach for by habit is, at a realistic spacecraft sample rate, the difference between a stable mode and a divergent one.

This lesson states the continuous solution and reads its two halves, derives the exact zero-order-hold discretisation and the block-matrix method for computing it, gives the discrete-time stability test and the eigenvalue map $\mu = e^{\lambda T}$, and then works through what the sample period costs you: aliasing, half-sample delay, and a shrinking margin.

## The solution of the forced state equation

For $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}(t)$, multiply by $e^{-\mathbf{A}t}$ and notice that the left side is a perfect derivative: $\frac{d}{dt}\left(e^{-\mathbf{A}t}\mathbf{x}\right) = e^{-\mathbf{A}t}(\dot{\mathbf{x}} - \mathbf{A}\mathbf{x}) = e^{-\mathbf{A}t}\mathbf{B}\mathbf{u}$. Integrating from $0$ to $t$ and multiplying back by $e^{\mathbf{A}t}$ gives the variation-of-constants formula:

$$\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t-\sigma)}\mathbf{B}\mathbf{u}(\sigma)\,d\sigma, \qquad \mathbf{y}(t) = \mathbf{C}\mathbf{x}(t) + \mathbf{D}\mathbf{u}(t).$$

::: key Solution of the linear state equation
$\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t-\sigma)}\mathbf{B}\mathbf{u}(\sigma)\,d\sigma$. For a time-invariant $\mathbf{A}$ the matrix exponential is the state transition matrix, $\boldsymbol{\Phi}(t, t_0) = e^{\mathbf{A}(t-t_0)}$, and it satisfies $\boldsymbol{\Phi}(t_0,t_0) = \mathbf{I}$, $\boldsymbol{\Phi}(t_2,t_0) = \boldsymbol{\Phi}(t_2,t_1)\boldsymbol{\Phi}(t_1,t_0)$ and $\boldsymbol{\Phi}^{-1}(t,t_0) = \boldsymbol{\Phi}(t_0,t)$.
:::

Two halves, with different jobs. The **free response** $e^{\mathbf{A}t}\mathbf{x}(0)$ is what the vehicle does if you leave it alone; in modal coordinates it is $\sum_i z_i(0)e^{\lambda_it}\mathbf{v}_i$, a weighted sum of modes. The **forced response** is a convolution: the effect of the input at each instant $\sigma$, propagated forward for the remaining $t - \sigma$ seconds, added up. Decomposed by modes it becomes $\sum_i \mathbf{v}_i\int_0^t e^{\lambda_i(t-\sigma)}\bar{\mathbf{b}}_i^\mathsf{T}\mathbf{u}(\sigma)\,d\sigma$, so each mode filters the input through its own first-order lag before contributing. A mode with $\bar{\mathbf{b}}_i^\mathsf{T} = \mathbf{0}$ contributes nothing whatever you command — a fact Lesson 4 turns into the controllability test.

For a constant input $\mathbf{u}$ and a stable $\mathbf{A}$, the state settles where its derivative vanishes: $\mathbf{0} = \mathbf{A}\mathbf{x}_{ss} + \mathbf{B}\mathbf{u}$, so $\mathbf{x}_{ss} = -\mathbf{A}^{-1}\mathbf{B}\mathbf{u}$ and the **DC gain** of the plant is

$$\mathbf{G}(0) = -\mathbf{C}\mathbf{A}^{-1}\mathbf{B} + \mathbf{D}.$$

This is worth checking on every model you build, because it usually has an interpretation you can verify by hand. For the gimbal's rate subsystem — states $(\omega, \tau)$, $\mathbf{A} = \begin{pmatrix}-0.5 & 1.25 \\ 0 & -50\end{pmatrix}$, $\mathbf{B} = (0, 50)^\mathsf{T}$, $\mathbf{C} = (1\ \ 0)$ — the DC gain comes out at $2.5\,\mathrm{rad/(s\,N\,m)}$, which is $1/b$ with $b = 0.4\,\mathrm{N\,m\,s/rad}$: a steady torque spins the gimbal until friction balances it. If a DC gain does not have a story like that, the model has an error in it.

## Exact discretisation under a zero-order hold

A digital controller writes a command to a digital-to-analogue converter, which holds it constant until the next update $T$ seconds later. So over one step, $\mathbf{u}(\sigma) = \mathbf{u}_k$ for $\sigma \in [t_k, t_k + T)$. Apply the solution formula over exactly that interval, with $\mathbf{x}_k = \mathbf{x}(t_k)$, and substitute $s = t_k + T - \sigma$ in the integral:

$$\mathbf{x}_{k+1} = e^{\mathbf{A}T}\mathbf{x}_k + \left(\int_0^{T}e^{\mathbf{A}s}\,ds\right)\mathbf{B}\,\mathbf{u}_k.$$

That is an **exact** difference equation, not an approximation: if the command really is held constant, this reproduces the continuous trajectory at every sample instant to machine precision, whatever $T$ is.

::: key Exact zero-order-hold discretisation
$\mathbf{A}_d = e^{\mathbf{A}T}$ and $\mathbf{B}_d = \left(\int_0^{T}e^{\mathbf{A}s}\,ds\right)\mathbf{B}$, giving $\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k$ with $\mathbf{C}$ and $\mathbf{D}$ unchanged. In practice both are computed from one exponential of the block matrix $\begin{pmatrix}\mathbf{A} & \mathbf{B} \\ \mathbf{0} & \mathbf{0}\end{pmatrix}$, whose exponential over $T$ is $\begin{pmatrix}\mathbf{A}_d & \mathbf{B}_d \\ \mathbf{0} & \mathbf{I}\end{pmatrix}$.
:::

The block-matrix trick deserves its own sentence. Append the held input to the state, $\tilde{\mathbf{x}} = (\mathbf{x}, \mathbf{u})$ with $\dot{\mathbf{u}} = \mathbf{0}$; its dynamics matrix is the block matrix above; exponentiating it propagates both, and the top-right block is exactly $\int_0^T e^{\mathbf{A}s}ds\,\mathbf{B}$. One call to a well-implemented `expm` — scaling and squaring, as Linear Algebra II describes — gives you both matrices with no separate quadrature and no special case.

When $\mathbf{A}$ is invertible there is a closed form, $\mathbf{B}_d = \mathbf{A}^{-1}(\mathbf{A}_d - \mathbf{I})\mathbf{B}$, which follows from $\int_0^Te^{\mathbf{A}s}ds = \mathbf{A}^{-1}(e^{\mathbf{A}T}-\mathbf{I})$. It is fine for a quick check and useless for most vehicle models, because rigid-body attitude and translation both put integrators in $\mathbf{A}$ and make it singular. The block-matrix route has no such restriction.

::: example The gimbal at 100 Hz and at 10 Hz
With $\mathbf{A} = \begin{pmatrix}0&1&0\\0&-0.5&1.25\\0&0&-50\end{pmatrix}$ and $\mathbf{B} = (0,0,50)^\mathsf{T}$, exponentiating the $4\times4$ block matrix over $T = 0.01\,\mathrm{s}$ gives

$$\mathbf{A}_d = \begin{pmatrix} 1 & 0.009975 & 0.0000527 \\ 0 & 0.995012 & 0.009810 \\ 0 & 0 & 0.606531\end{pmatrix}, \qquad \mathbf{B}_d = \begin{pmatrix}8.98\times10^{-6}\\ 0.002659 \\ 0.393469\end{pmatrix},$$

and over $T = 0.1\,\mathrm{s}$,

$$\mathbf{A}_d = \begin{pmatrix} 1 & 0.097541 & 0.001962 \\ 0 & 0.951229 & 0.023851 \\ 0 & 0 & 0.006738\end{pmatrix}, \qquad \mathbf{B}_d = \begin{pmatrix}0.004186\\ 0.098076 \\ 0.993262\end{pmatrix}.$$

Check the entries you can. The eigenvalues of $\mathbf{A}_d$ are $e^{\lambda T}$: at $T = 0.1$ they are $1$, $e^{-0.05} = 0.951229$ and $e^{-5} = 0.006738$, and because $\mathbf{A}$ is triangular so is $\mathbf{A}_d$, so they sit on the diagonal. The entry $\Phi_{12} = \int_0^{T}e^{-0.5s}ds = 2\left(1 - e^{-0.05}\right) = 0.097541$. The entry $\Phi_{23} = 1.25\int_0^Te^{-0.5(T-s)}e^{-50s}ds = 1.25\,e^{-0.05}\left(1-e^{-4.95}\right)/49.5 = 0.023851$. And $B_{d,3} = 1 - e^{-5} = 0.993262$, which says that in one $0.1\,\mathrm{s}$ step the motor torque reaches $99.3\,\%$ of its commanded value — at $T = 0.01\,\mathrm{s}$ it reaches only $39.3\,\%$, because the step is half a time constant.

Now the forward-Euler model $\mathbf{A}_d \approx \mathbf{I} + \mathbf{A}T$, $\mathbf{B}_d \approx \mathbf{B}T$. At $T = 0.01\,\mathrm{s}$ its eigenvalues are $1$, $0.995$ and $0.5$ — the fast mode is off by $18\,\%$, which is survivable. At $T = 0.1\,\mathrm{s}$ they are $1$, $0.95$ and $1 + (-50)(0.1) = -4$. A mode with time constant $20\,\mathrm{ms}$, comfortably stable in the real hardware, has become a discrete mode of magnitude four that multiplies by four and flips sign every step. The Euler model does not merely lose accuracy; it lies about stability. Exact discretisation costs one `expm` call at initialisation and removes the question entirely.
:::

::: warning Euler is a solver, not a discretisation
Forward Euler is an integration rule for simulating a plant with a small step. The zero-order hold is a statement about what the actuator physically does between updates. They are different objects and only one of them is exact. Use the exponential for the design model; if you must use Euler inside a simulation, its step has to be small compared with the fastest time constant in $\mathbf{A}$, which for a stiff vehicle model means far smaller than the control period.
:::

## The discrete-time model and its stability

The discrete model is a state-space system in its own right:

$$\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k, \qquad \mathbf{y}_k = \mathbf{C}\mathbf{x}_k + \mathbf{D}\mathbf{u}_k,$$

with $z$-domain transfer matrix $\mathbf{G}_d(z) = \mathbf{C}(z\mathbf{I}-\mathbf{A}_d)^{-1}\mathbf{B}_d + \mathbf{D}$. Everything in this module transfers: similarity transforms work the same way, the controllability matrix is $[\mathbf{B}_d, \mathbf{A}_d\mathbf{B}_d, \dots]$, and pole placement puts the eigenvalues of $\mathbf{A}_d - \mathbf{B}_d\mathbf{K}_d$ where you want them. Only the stability region changes. Unrolling the recursion gives $\mathbf{x}_k = \mathbf{A}_d^k\mathbf{x}_0 + \cdots$, whose modes are $\mu_i^k$, so the discrete system is asymptotically stable exactly when every eigenvalue of $\mathbf{A}_d$ satisfies $|\mu_i| < 1$: **inside the unit circle**, not in the left half plane.

The two pictures agree, because $\mu_i = e^{\lambda_iT}$ gives $|\mu_i| = e^{\operatorname{Re}(\lambda_i)T}$, which is below one exactly when $\operatorname{Re}\lambda_i < 0$. The map $\lambda \mapsto e^{\lambda T}$ sends the left half plane onto the open unit disc, the imaginary axis onto the unit circle, and the real axis onto the positive reals. Applying the left-half-plane test to a $\mathbf{A}_d$ matrix is a silent and common error: the gimbal's $\mathbf{A}_d$ has all-positive eigenvalues and is perfectly stable.

The map is many-to-one in the imaginary direction. Since $e^{(\lambda + 2\pi ik/T)T} = e^{\lambda T}$ for every integer $k$, continuous modes whose frequencies differ by a multiple of the sample rate are indistinguishable in the discrete model. That is aliasing, stated in state-space terms.

::: example A bending mode that the sample rate moves
A launch vehicle's first bending mode is at $12\,\mathrm{Hz}$ with damping $\zeta = 0.005$, so $\omega_n = 2\pi(12) = 75.40\,\mathrm{rad/s}$ and $\lambda = -\zeta\omega_n \pm i\omega_n\sqrt{1-\zeta^2} = -0.377 \pm 75.397i\ \mathrm{s^{-1}}$. Discretise at $10\,\mathrm{Hz}$, $T = 0.1\,\mathrm{s}$:

$$\mu = e^{\lambda T} = e^{-0.0377}e^{\,i\,7.5397} = 0.9630\,e^{\,i\,1.2565},$$

because $7.5397 - 2\pi = 1.2565$. The discrete model reports a mode at an angle of $1.2565\,\mathrm{rad}$ per step, which reads back as a continuous frequency of $1.2565/0.1 = 12.57\,\mathrm{rad/s} = 2.00\,\mathrm{Hz}$. The $12\,\mathrm{Hz}$ mode has been folded to $2\,\mathrm{Hz}$ — exactly $|12 - 10|$ — and the magnitude $0.9630$ correctly reports its very light damping, so the discrete model contains a persistent $2\,\mathrm{Hz}$ oscillation that does not exist on the vehicle.

Nothing here is a numerical error. The discretisation is exact at the sample instants; it is the frequency label that is meaningless above the Nyquist rate of $5\,\mathrm{Hz}$. The remedies are physical, not numerical: sample faster than twice the highest dynamics you care to represent, and put an analogue anti-alias filter ahead of the converter so that energy above Nyquist never enters the sampler in the first place. A digital filter cannot undo aliasing, because by the time the samples exist the information is gone.
:::

## What the sample period costs

Exactness at the sample instants is not the same as a free lunch. Three effects scale with $T$:

- **Hold lag.** Holding a command constant across a step delays its average effect by about $T/2$. At a loop crossover frequency $\omega_c$ that is a phase loss of roughly $\omega_cT/2$ radians. At $\omega_c = 1\,\mathrm{rad/s}$ and $T = 0.1\,\mathrm{s}$ it is $0.05\,\mathrm{rad} = 2.9^\circ$ — negligible. At $\omega_c = 10\,\mathrm{rad/s}$ and the same $T$ it is $28.6^\circ$, which is most of a typical phase margin.
- **Computation delay.** The sample read at $t_k$ produces a command applied at $t_{k+1}$ in most real architectures, which is a further full step of delay. In state space you model it honestly by appending the held command as an extra state: $\tilde{\mathbf{x}} = (\mathbf{x}, \mathbf{u}_{k-1})$ with $\tilde{\mathbf{A}} = \begin{pmatrix}\mathbf{A}_d & \mathbf{B}_d \\ \mathbf{0} & \mathbf{0}\end{pmatrix}$ and $\tilde{\mathbf{B}} = \begin{pmatrix}\mathbf{0}\\\mathbf{I}\end{pmatrix}$. A fixed delay is a modelled, compensable thing; jitter in that delay is not.
- **Aliasing**, as above.

A useful rule is to sample fifteen to thirty times faster than the closed-loop bandwidth you intend to achieve, and faster still if there are lightly damped modes above it that must be gain-stabilised.

::: example Propagating a spacecraft exactly, with no exponential at all
Take the six-state pyramid-wheel spacecraft of Lesson 1: $\mathbf{A} = \begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{0}&\mathbf{0}\end{pmatrix}$ and $\mathbf{B} = \begin{pmatrix}\mathbf{0}\\\mathbf{J}^{-1}\mathbf{A}_w\end{pmatrix}$. Here $\mathbf{A}^2 = \mathbf{0}$, so the exponential series terminates after two terms and the integral after three:

$$\mathbf{A}_d = \mathbf{I} + \mathbf{A}T = \begin{pmatrix}\mathbf{I} & T\mathbf{I}\\ \mathbf{0} & \mathbf{I}\end{pmatrix}, \qquad \mathbf{B}_d = \left(T\mathbf{I} + \tfrac{1}{2}T^2\mathbf{A}\right)\mathbf{B} = \begin{pmatrix}\tfrac{1}{2}T^2\,\mathbf{J}^{-1}\mathbf{A}_w \\ T\,\mathbf{J}^{-1}\mathbf{A}_w\end{pmatrix}.$$

Computing the block exponential numerically at $T = 0.1\,\mathrm{s}$ agrees with these closed forms to $4\times10^{-22}$. The discrete model is the familiar constant-acceleration update, $\boldsymbol{\theta}_{k+1} = \boldsymbol{\theta}_k + T\boldsymbol{\omega}_k + \tfrac{1}{2}T^2\boldsymbol{\alpha}_k$ and $\boldsymbol{\omega}_{k+1} = \boldsymbol{\omega}_k + T\boldsymbol{\alpha}_k$, with the wheel geometry supplying $\boldsymbol{\alpha} = \mathbf{J}^{-1}\mathbf{A}_w\mathbf{u}$.

Put numbers on it. Wheel 1 commanded to its full $0.2\,\mathrm{N\,m}$ at a $10\,\mathrm{Hz}$ control rate gives $B_{d,41}u_1 = 0.1\times4.811\times10^{-4}\times0.2 = 9.62\times10^{-6}\,\mathrm{rad/s}$ of body rate about $x$ per step, and $4.81\times10^{-7}\,\mathrm{rad}$ of attitude per step. Held for a full minute — 600 steps — the body rate reaches $5.77\times10^{-3}\,\mathrm{rad/s} = 0.331\ ^\circ/\mathrm{s}$. That is a realistic slew-acceleration budget for a $1200\,\mathrm{kg\,m^2}$ axis, and it explains why a $90^\circ$ slew on a spacecraft of this class takes minutes rather than seconds.

Notice one thing this exactness does not buy: $\mathbf{A}$ being nilpotent makes the discretisation exact for any $T$ whatsoever, but a $10\,\mathrm{s}$ step would still be a terrible control period. Exactness of the model and adequacy of the sample rate are separate questions.
:::

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

::: note Process noise discretises too
The estimation tier needs one more piece of this machinery. A continuous process-noise model $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{G}\mathbf{w}$ with spectral density $\mathbf{Q}_c$ produces a discrete covariance increment $\mathbf{Q}_d = \int_0^T e^{\mathbf{A}s}\mathbf{G}\mathbf{Q}_c\mathbf{G}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}s}ds$, which comes from a single exponential of a different block matrix — Van Loan's method. The structure is the same as the $\mathbf{B}_d$ trick, and the discipline is the same: compute it once at initialisation from the continuous model rather than tuning a discrete number until the filter looks happy.
:::

## Check yourself

::: check
A plant has $\mathbf{A} = \operatorname{diag}(-1, -100)\ \mathrm{s^{-1}}$ and $\mathbf{B} = (1, 1)^\mathsf{T}$. Write $\mathbf{A}_d$ and $\mathbf{B}_d$ exactly for $T = 0.02\,\mathrm{s}$, and compare with forward Euler.
:::

::: answer
Both matrices are diagonal, so everything decouples. $\mathbf{A}_d = \operatorname{diag}(e^{-0.02}, e^{-2}) = \operatorname{diag}(0.980199, 0.135335)$. For a diagonal $\mathbf{A}$, $\mathbf{B}_d = \mathbf{A}^{-1}(\mathbf{A}_d - \mathbf{I})\mathbf{B}$ entry by entry: $(1-e^{-0.02})/1 = 0.019801$ and $(1-e^{-2})/100 = 0.008647$. Forward Euler gives $\mathbf{A}_d \approx \operatorname{diag}(0.98, -1)$ and $\mathbf{B}_d \approx (0.02, 0.02)^\mathsf{T}$. The slow mode is fine; the fast mode has $|\mu| = 1$, sitting exactly on the stability boundary and oscillating at the Nyquist frequency forever, and a step $1\,\%$ longer would push it outside. The input gain on that channel is wrong by a factor of $2.3$ as well.
:::

::: check
The gimbal's discrete model at $T = 0.1\,\mathrm{s}$ has all three eigenvalues real and positive: $1$, $0.951$ and $0.0067$. Is it stable? What are the corresponding continuous eigenvalues?
:::

::: answer
It is marginally stable, not asymptotically stable, because one eigenvalue sits at $\mu = 1$ — exactly on the unit circle. Positive real eigenvalues say nothing on their own; the test is $|\mu| < 1$. Inverting the map, $\lambda = \ln\mu/T$: $\ln 1/0.1 = 0$, $\ln 0.951229/0.1 = -0.5\ \mathrm{s^{-1}}$, and $\ln 0.006738/0.1 = -50\ \mathrm{s^{-1}}$, recovering the continuous eigenvalues. The $\mu = 1$ mode is the free integration from rate to angle, which is a property of the gimbal, not of the sampling.
:::

::: check
Why can you not compute $\mathbf{B}_d$ for the six-state spacecraft model using $\mathbf{B}_d = \mathbf{A}^{-1}(\mathbf{A}_d - \mathbf{I})\mathbf{B}$?
:::

::: answer
Because $\mathbf{A} = \begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{0}&\mathbf{0}\end{pmatrix}$ is nilpotent and therefore singular — all six eigenvalues are zero, and $\mathbf{A}^{-1}$ does not exist. Rigid-body models always have this structure, because position integrates velocity with nothing pulling it back. Use the block-matrix exponential, which never needs an inverse, or in this particular case use the terminating series directly: $\int_0^Te^{\mathbf{A}s}ds = T\mathbf{I} + \tfrac{1}{2}T^2\mathbf{A}$.
:::

::: check
A control loop is to be closed at $2\,\mathrm{Hz}$ crossover. Estimate the phase lost to a zero-order hold plus one step of computation delay at sample rates of $20\,\mathrm{Hz}$ and $100\,\mathrm{Hz}$.
:::

::: answer
Crossover $\omega_c = 2\pi(2) = 12.57\,\mathrm{rad/s}$. The hold contributes about $\omega_cT/2$ and the one-step computation delay about $\omega_cT$, so roughly $1.5\,\omega_cT$ in total. At $20\,\mathrm{Hz}$, $T = 0.05\,\mathrm{s}$ and the loss is $1.5(12.57)(0.05) = 0.943\,\mathrm{rad} = 54^\circ$ — more than any reasonable phase margin, so the design will not work. At $100\,\mathrm{Hz}$, $T = 0.01\,\mathrm{s}$ and the loss is $0.189\,\mathrm{rad} = 10.8^\circ$, which is an affordable bite out of a $45^\circ$ budget. The ratio of sample rate to bandwidth is $10$ in the first case and $50$ in the second, which brackets the usual rule of fifteen to thirty.
:::

::: check
A model is discretised at $50\,\mathrm{Hz}$ and its discrete spectrum shows a mode at $\mu = 0.99\,e^{\pm i\,0.5}$. Name two continuous modes consistent with that observation.
:::

::: answer
From $\mu = e^{\lambda T}$ with $T = 0.02\,\mathrm{s}$: $\operatorname{Re}\lambda = \ln 0.99/0.02 = -0.503\,\mathrm{s^{-1}}$, and $\operatorname{Im}\lambda = (0.5 + 2\pi k)/0.02$ for any integer $k$. With $k = 0$ that is $25.0\,\mathrm{rad/s}$, or $3.98\,\mathrm{Hz}$. With $k = 1$ it is $(0.5 + 6.283)/0.02 = 339\,\mathrm{rad/s}$, or $53.98\,\mathrm{Hz}$ — which is the first case plus the $50\,\mathrm{Hz}$ sample rate, as aliasing requires. The samples cannot distinguish them, and only knowledge of the physics, or an anti-alias filter that removed everything above $25\,\mathrm{Hz}$ before sampling, settles which one you are looking at.
:::

## Summary

| Item | Statement |
| --- | --- |
| Solution | $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^te^{\mathbf{A}(t-\sigma)}\mathbf{B}\mathbf{u}(\sigma)d\sigma$ |
| Transition matrix | $\boldsymbol{\Phi}(t,t_0) = e^{\mathbf{A}(t-t_0)}$; composes, inverts, $\dot{\boldsymbol{\Phi}} = \mathbf{A}\boldsymbol{\Phi}$ |
| Steady state | $\mathbf{x}_{ss} = -\mathbf{A}^{-1}\mathbf{B}\mathbf{u}$; DC gain $\mathbf{G}(0) = -\mathbf{C}\mathbf{A}^{-1}\mathbf{B} + \mathbf{D}$ |
| ZOH discretisation | $\mathbf{A}_d = e^{\mathbf{A}T}$, $\mathbf{B}_d = \left(\int_0^Te^{\mathbf{A}s}ds\right)\mathbf{B}$; exact for a held input |
| Block-matrix method | $\exp\!\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{0}&\mathbf{0}\end{pmatrix}T = \begin{pmatrix}\mathbf{A}_d&\mathbf{B}_d\\\mathbf{0}&\mathbf{I}\end{pmatrix}$ |
| Invertible $\mathbf{A}$ only | $\mathbf{B}_d = \mathbf{A}^{-1}(\mathbf{A}_d-\mathbf{I})\mathbf{B}$ — fails for rigid-body models |
| Discrete stability | $\lvert\mu_i\rvert < 1$; $\mu_i = e^{\lambda_iT}$, so the left half plane maps to the unit disc |
| Aliasing | $\lambda$ and $\lambda + 2\pi ik/T$ give the same $\mu$; $12\,\mathrm{Hz}$ at $10\,\mathrm{Hz}$ reads as $2\,\mathrm{Hz}$ |
| Cost of $T$ | hold lag $\approx\omega_cT/2$, computation delay $\approx\omega_cT$; sample 15–30 times the bandwidth |
| Rigid body | $\mathbf{A}^2 = \mathbf{0}$ gives $\mathbf{A}_d = \mathbf{I}+\mathbf{A}T$, $\mathbf{B}_d = (T\mathbf{I}+\tfrac12T^2\mathbf{A})\mathbf{B}$, exact for any $T$ |

You can now write a model, change its coordinates and propagate it. What you cannot yet do is say whether your actuators can move it where you want. That is the next lesson, and it is the single most consequential question in this module.
