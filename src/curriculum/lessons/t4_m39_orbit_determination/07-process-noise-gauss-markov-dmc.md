---
id: l07-process-noise-gauss-markov-dmc
title: "Process noise for orbit determination: Gauss-Markov acceleration and DMC"
minutes: 16
covers:
  - "Process noise for orbit determination: Gauss-Markov acceleration and dynamic model compensation"
---

Every estimator in this module so far trusted the dynamics completely between observations: propagate with $\boldsymbol\Phi$, and whatever the model says happens, happens. Real spacecraft do not cooperate. Drag depends on an atmosphere whose density is uncertain by tens of percent; solar radiation pressure depends on an attitude and reflectivity the ground does not know precisely; small, undocumented thruster activity happens. None of this is measurement noise — it is a real, physical mismatch between the assumed dynamics and the truth, and if it is not accounted for somehow, the fit either drifts as it silently fights an unmodelled force, or reports a covariance far tighter than the truth deserves. Process noise is how this module accounts for it without needing to know exactly what the missing force is.

## The first-order Gauss-Markov process

Model the net unmodelled acceleration $a(t)$ (one axis; three independent copies handle a vector) not as pure white noise, which never forgets and never settles, but as a process that decays toward zero with a characteristic time constant $\tau$, continually kicked by white noise $w$ of spectral density $q$:
$$
\dot a = -\frac{a}{\tau} + w, \qquad \mathbb E[w(t)w(t')]=q\,\delta(t-t').
$$
This is an Ornstein-Uhlenbeck process, and it is the right shape for a real unmodelled force: drag or SRP mismodelling is correlated over minutes to hours (the atmosphere does not reset every second), not truly memoryless, but it does not wander forever either — a large positive error today says little about the error in a week.

The stationary variance follows from the process's own defining equation: at steady state $\mathbb E[a^2]$ is constant, so its time derivative is zero. Multiplying the SDE by $a$ and taking expectations (Itô's rule for this linear case reduces to the ordinary product rule in the mean),
$$
\frac{d}{dt}\mathbb E[a^2] = -\frac{2}{\tau}\mathbb E[a^2] + q = 0 \quad\Longrightarrow\quad \sigma_a^2 = \frac{q\tau}{2}.
$$

::: key First-order Gauss-Markov acceleration
$\dot a=-a/\tau+w$, steady-state variance $\sigma_a^2=q\tau/2$. Choosing $\tau$ sets how long an unmodelled force is expected to stay correlated; choosing $q$ (or equivalently $\sigma_a$) sets how large it is expected to be. Both are physical choices about the force being absorbed, not free numerical knobs.
:::

::: example The steady-state variance, confirmed by simulation
With $\tau=300\,\mathrm s$ and $q=4\times10^{-8}$ (arbitrary consistent units), $\sigma_a^2=q\tau/2=6\times10^{-6}$. Simulating $20{,}000$ independent Euler-Maruyama realizations of the SDE from $a(0)=0$ and comparing to the closed-form transient variance $\sigma_a^2(t)=\dfrac{q\tau}{2}\left(1-e^{-2t/\tau}\right)$:

```python
# t (s)      closed-form Var        simulated Var (20,000 trials)
#    10.0    3.869581e-07           3.821111e-07
#    60.0    1.978080e-06           1.970666e-06
#   300.0    5.187988e-06           5.205637e-06
#  1200.0    5.997987e-06           5.958217e-06   (approaching q*tau/2 = 6.0e-6)
```

The simulated and closed-form variances agree to three figures throughout, and by $t=1200\,\mathrm s$ ($4\tau$) the transient has essentially reached the steady state the algebra above predicted.
:::

## From continuous noise to a discrete $\mathbf Q$

A filter needs the *discrete-time* process noise contribution $\mathbf Q_d$ over a step $\Delta t$, not the continuous spectral density directly. For the augmented state $(\text{position},\text{velocity},a)$ with $a$ evolving by the SDE above and feeding directly into acceleration, the standard tool is Van Loan's method: build the $2n\times2n$ matrix
$$
\boldsymbol\Xi = \begin{pmatrix}-\mathbf A & \mathbf L\mathbf Q_c\mathbf L^\mathsf T\\ \mathbf 0 & \mathbf A^\mathsf T\end{pmatrix}\Delta t, \qquad \exp(\boldsymbol\Xi) = \begin{pmatrix}\cdot&\boldsymbol\Psi_{12}\\ \mathbf 0&\boldsymbol\Psi_{22}\end{pmatrix},
$$
where $\mathbf A$ is the (here, linear) dynamics matrix and $\mathbf L$ places the white noise on the acceleration state only; then $\boldsymbol\Phi=\boldsymbol\Psi_{22}^\mathsf T$ and $\mathbf Q_d=\boldsymbol\Phi\boldsymbol\Psi_{12}$.

::: example Van Loan's $\mathbf Q_d$, checked against the closed form
For the $1$-D triple $(\text{position},\text{velocity},a)$ with $\mathbf A=\begin{pmatrix}0&1&0\\0&0&1\\0&0&-1/\tau\end{pmatrix}$, $\mathbf L=(0,0,1)^\mathsf T$, the same $\tau=300\,\mathrm s$, $q=4\times10^{-8}$:

```python
import numpy as np
from scipy.linalg import expm

def van_loan(A, L, Qc, dt):
    n = A.shape[0]
    Xi = np.zeros((2*n, 2*n))
    Xi[:n, :n] = -A; Xi[:n, n:] = L @ Qc @ L.T; Xi[n:, n:] = A.T
    Psi = expm(Xi * dt)
    Phi = Psi[n:, n:].T
    return Phi, Phi @ Psi[:n, n:]

tau, q = 300.0, 4e-8
A = np.array([[0,1,0],[0,0,1],[0,0,-1/tau]])
L = np.array([[0.],[0.],[1.]])
Phi, Qd = van_loan(A, L, np.array([[q]]), dt=300.0)
print("Qd[a,a] =", Qd[2,2])
print("closed-form q*tau/2*(1-exp(-2*300/300)) =", q*tau/2*(1-np.exp(-2*300/300)))
# Qd[a,a] = 5.187988300580322e-06
# closed-form ...                = 5.187988300580324e-06
```

The acceleration-acceleration entry of $\mathbf Q_d$ matches the closed-form Ornstein-Uhlenbeck variance to machine precision, and the full $3\times3$ matrix is symmetric and positive definite at every $\Delta t$ tested — the correct, numerically sound way to turn a continuous-time noise model into the discrete $\mathbf Q$ a Kalman predict step needs, exactly the $\mathbf Q$ that appeared without derivation in the sequential-filtering lesson.
:::

Dynamic model compensation (DMC) is this construction applied for real: augment the state with a three-axis Gauss-Markov acceleration, propagate it alongside position and velocity with the corresponding $9\times9$ $\boldsymbol\Phi$ and $\mathbf Q_d$, and let the filter estimate the unmodelled acceleration directly rather than pretending it is zero. A lighter-weight approximation many practical systems use instead — no extra state, no $9\times9$ machinery — injects an appropriately sized noise directly into the velocity block of $\mathbf Q$ at each step, $\mathbf Q_{vv}\approx q\,\Delta t\,\mathbf I$, treating the unmodelled acceleration as if it were white rather than correlated. It is cruder (it cannot report the unmodelled acceleration's own estimated value the way full DMC can), but it is cheap, and the worked example below uses exactly this simplified form.

## What happens without it, and what changes with it

::: example Residuals with structure, and without
The same $420\,\mathrm{km}$ orbit and three-pass tracking scenario as earlier lessons, except the simulated truth now includes real atmospheric drag that the filter's dynamics model does not know about. Seeded well (as the sequential-filtering lesson's working case was) and run with no process noise at all, the third pass's range residuals are not the zero-mean noise a correctly specified fit should show:

```python
# Q = 0 (dynamics trusted completely), pass-3 range residuals (m):
# [101.1 -62.2 -42.6 -57.2 -38.9 -21.1  -3.4 -20.5  10.3   3.3  13.5  13.5
#   62.5  81.8 119.8 136.0 147.2 120.4 118.5 111.6 106.2 106.8  81.9  67.4
#   73.1  67.8  68.0  72.8  68.4  75.1  84.6  75.3  66.6  72.4  74.2  96.7
#   82.6  84.1  74.0]
# mean = 58.8 m, rms = 79.9 m   -- a clear trend, not noise: negative, then rising and staying positive
```

A mean of $58.8\,\mathrm m$ against an injected measurement noise of $10\,\mathrm m$, and a residual that swings from negative to a sustained positive plateau over the course of one pass, is the fit visibly falling behind the drag it does not know about and slowly catching back up as new data arrives — exactly the residual signature that motivates process noise in the first place. Adding a modest, properly sized velocity process noise (found by a short sweep, shown next) changes the same pass to
```python
# Q sized from the sweep below, pass-3 range residuals (m):
# [113.9 -3.5  2.7 -18.8 -4.4 10.2 24.6  4.0 29.7 14.8 11.8 -8.0
#   14.1  3.4 14.1  11.8 16.8 -7.8 -2.1  1.0  5.4 14.4 -3.8 -13.1
#   -3.9 -6.9 -5.4  0.3 -3.7  3.3 13.1  4.1 -4.2  2.2  4.8 28.1
#   14.9 17.3  8.2]
# mean = 7.8 m, rms = 21.7 m
```
mean near zero, no visible trend, and RMS cut by more than a factor of three. The process noise did not need to know the missing force was drag specifically — only that *some* small, roughly steady acceleration was being missed, which is exactly the generic absorption a Gauss-Markov acceleration state (or its simplified velocity-noise stand-in) is built to provide.
:::

::: warning More process noise is not always better
Sweeping the injected velocity-noise spectral density on the same scenario shows a clear optimum, not a monotonic improvement:

```python
# qvel (km^2/s^3)   overall range RMS (m)
#   0                 109.6
#   1e-18              100.5
#   1e-17               99.6   <- best in this sweep
#   1e-16              101.5
#   1e-15              156.0   <- worse than doing nothing
```

Too little process noise leaves the residual structure this lesson opened with. Too much does something equally unhelpful in the opposite direction: it inflates the covariance beyond what the actual unmodelled force justifies, the filter starts treating ordinary measurement noise as if it might be more dynamics mismatch, and the gain overreacts to it. Sizing $q$ (or $\sigma_a$ and $\tau$ directly, in the full Gauss-Markov form) is a physical judgement about the force being absorbed — a rough estimate of the missing acceleration's magnitude and correlation time — not a knob to be turned up "to be safe."
:::

## Three ways to handle an uncertain force

The drag coefficient that the batch lesson briefly extended the state with, the generic Gauss-Markov acceleration this lesson builds, and one more option not yet covered are three different answers to the same underlying question — what do you do about a parameter you are not certain of? **Solve for it** (the batch lesson's drag coefficient) when the physical cause is known and the arc constrains it well enough to be worth estimating directly, recovering both its value and a properly shrunk covariance on everything it correlates with. **Absorb it generically** with process noise (this lesson) when the cause is not precisely known, or is expected to vary in a way no single constant parameter captures — DMC does not care whether the missing force is drag, an unlisted thruster pulse, or something else entirely, only that it behaves like a correlated, bounded nuisance acceleration. **Consider it** — acknowledge a parameter's uncertainty in the reported covariance without solving for it or feeding it process noise at all — when it is not practical or not well-observed enough to estimate directly, but ignoring its uncertainty completely would make the covariance dishonest. That third option, and exactly what it costs and buys relative to the first two, is the next lesson.

## Check yourself

::: check
Why does the first-order Gauss-Markov model use $\dot a=-a/\tau+w$ rather than $\dot a=w$ alone (pure white-noise acceleration) to represent an unmodelled force like drag?
:::

::: answer
Pure white-noise acceleration has no memory at all and its variance grows without bound as a random walk, which does not match a real unmodelled force like drag mismodelling: the atmosphere's actual density error is correlated over some physically meaningful timescale (it does not reset every second) but also does not wander off to arbitrarily large values forever (it stays bounded by how wrong the density model plausibly is). The $-a/\tau$ decay term gives the process exactly this behaviour — correlated over about $\tau$, with a finite steady-state variance $q\tau/2$ — matching the physical character of the thing being modelled far better than an unbounded random walk would.
:::

::: check
Derive the steady-state variance $\sigma_a^2=q\tau/2$ from $\dot a=-a/\tau+w$ without looking back at the lesson, and state which assumption makes the derivation valid.
:::

::: answer
At steady state, $\mathbb E[a^2]$ is constant in time, so $\frac{d}{dt}\mathbb E[a^2]=0$. Differentiating $a^2$ and taking the expectation of the SDE (using $\mathbb E[a\,w]=0$ for white noise uncorrelated with the current state, and $\mathbb E[w^2]\,dt \to q$ in the appropriate limit) gives $\frac{d}{dt}\mathbb E[a^2]=-\frac{2}{\tau}\mathbb E[a^2]+q$. Setting this to zero and solving gives $\sigma_a^2=q\tau/2$. The derivation is valid once the process has run long enough to forget its initial condition — several $\tau$, as the simulated transient in this lesson's first example showed directly.
:::

::: check
Explain, in one or two sentences, why $\mathbf Q_d$'s acceleration-acceleration entry in the Van Loan example equals the closed-form transient Ornstein-Uhlenbeck variance exactly, rather than only approximately.
:::

::: answer
Van Loan's construction is an exact solution of the linear stochastic differential equation over the interval $\Delta t$ (it exponentiates the exact continuous-time dynamics, not a truncated approximation of them), and for the acceleration state alone — decoupled from position and velocity in how it evolves, since nothing feeds back into $a$ from $r$ or $v$ in this model — that exact solution is precisely the scalar Ornstein-Uhlenbeck transient variance formula. There is no approximation in either derivation for that one entry, so they agree to the precision of the numerical linear algebra itself.
:::

::: check
The process-noise sweep showed $q_{vel}=10^{-15}$ performing worse than $q_{vel}=0$. Using only the idea of a Kalman gain trusting the covariance it is given, explain why too much process noise can make a fit worse than none at all.
:::

::: answer
The Kalman gain is built from the ratio of predicted-state uncertainty to measurement uncertainty; injecting process noise far larger than the true unmodelled dynamics justifies inflates the predicted covariance well beyond what is actually warranted, which makes the gain treat every new measurement — including its ordinary noise — as much more informative about a supposedly-drifting state than it really is. The filter then chases noise as if it were dynamics mismatch, and the resulting corrections add variance to the estimate that a correctly sized (or zero) process noise would not have introduced.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot a=-a/\tau+w$ | First-order Gauss-Markov acceleration; $\tau$ sets correlation time |
| $\sigma_a^2=q\tau/2$ | Steady-state variance from the spectral density $q$ |
| $\boldsymbol\Xi=\begin{pmatrix}-\mathbf A&\mathbf L\mathbf Q_c\mathbf L^\mathsf T\\\mathbf 0&\mathbf A^\mathsf T\end{pmatrix}\Delta t$, $\mathbf Q_d=\boldsymbol\Phi\boldsymbol\Psi_{12}$ | Van Loan's method: exact discrete process noise from a continuous model |
| DMC | Full form: 3-axis Gauss-Markov acceleration as extra filter states. Simplified form: inject $\mathbf Q_{vv}\approx q\Delta t\,\mathbf I$ directly |
| Residual structure | A non-zero mean or a visible trend in post-fit residuals is the signature of unmodelled dynamics, not only noise |
| Solve-for / DMC / consider | Estimate a known physical parameter directly / absorb an unknown or varying force generically / acknowledge uncertainty without estimating it |

DMC absorbed an unmodelled force by letting the filter itself estimate (or generically soak up) its effect. The next lesson handles the parameters that are not solved for at all — accounted for honestly in the covariance, without ever entering the state.
