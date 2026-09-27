---
id: l07-process-noise-gauss-markov-dmc
title: "Process noise for orbit determination: Gauss-Markov acceleration and DMC"
minutes: 26
covers:
  - "Process noise for orbit determination: Gauss-Markov acceleration and dynamic model compensation"
---

Picture yourself rowing a small boat across a wide lake at night. You know your rowing speed and your heading, so every minute you can mark on the map where you *should* be. But the lake has a current. You cannot see it, and you do not know exactly how strong it is. It is not random from one second to the next — a current that pushes you left now will still be pushing you left a minute from now. Yet it does not keep one fixed value forever either. Over half an hour it drifts, weakens, changes direction. If you ignore it, your map position slides further and further from the truth. If you admit "some current I can't see is pushing me around", you stay humble about where you are, and each time you glimpse the shore you correct more readily.

A satellite's orbit determination has exactly this problem. Every estimator in this module so far trusted its force model completely between measurements: propagate with the state transition matrix $\boldsymbol\Phi$, and whatever the model says happens, happens. Real spacecraft do not cooperate. Air drag depends on the density of the upper atmosphere, which is uncertain by tens of percent. **[[Solar radiation pressure|srp]]** — the tiny push of sunlight — depends on the spacecraft's attitude and how shiny its surfaces are, which the ground knows only roughly. Small, undocumented thruster puffs happen. None of this is measurement noise. It is a real, physical mismatch between the assumed dynamics and the truth.

**Process noise** is the name for an estimator's allowance for that mismatch: extra uncertainty added to the dynamics themselves, so the filter knows its prediction may be wrong even when the measurements are perfect. This lesson builds the standard model for it, turns that model into the matrix $\mathbf Q$ a Kalman filter needs, and shows what goes wrong with too little and with too much of it.

## White noise, random walks, and the leash in between

Call the net unmodelled acceleration along one axis $a(t)$. (Three independent copies handle a full three-axis vector.) How should an estimator describe a force it does not know?

The simplest idea is **[[white noise|white-noise]]** — a signal whose value at one instant tells you nothing at all about its value at any other instant, however close. White noise has no memory. Its size is set by its **spectral density**, written $q$: a measure of how much random "kick" it delivers per second. Mathematically, for white noise $w(t)$,

$$
\mathbb E[w(t)\,w(t')] = q\,\delta(t-t').
$$

Read $\mathbb E[\cdot]$ as "the expected value of" — the average over many imagined repeats. The $\delta$ is the Dirac delta: zero unless $t = t'$. So the equation says two different instants of $w$ are completely unrelated.

White noise is a poor model for a mismodelled force, for two reasons.

- If the acceleration itself were white, it would change completely from one instant to the next. A real density error does not. The atmosphere does not reset every second.
- If instead you let white noise *drive* the acceleration, $\dot a = w$ (read "a dot equals w"), then $a$ becomes a **random walk**: each kick adds to the last, nothing pulls it back, and its variance grows forever. A real drag error does not grow without limit either. It stays about as large as the density model is wrong.

What we want is in between: a process that remembers its recent past, but gets pulled gently back toward zero. Think of a dog on a long elastic leash. The dog darts around at random (the white-noise kicks), but the leash always tugs it back toward you. That is the **first-order Gauss-Markov process**:

$$
\dot a = -\frac{a}{\tau} + w, \qquad \mathbb E[w(t)w(t')]=q\,\delta(t-t').
$$

The new term $-a/\tau$ is the leash. The larger $a$ gets, the harder it is pulled back. The symbol $\tau$ ("tau") is the **time constant**, in seconds: how long the process takes to forget where it was. Mathematicians call this the **[[Ornstein-Uhlenbeck|ornstein-uhlenbeck]]** process.

How much does $a$ at one moment tell you about $a$ a time $\Delta t$ later? With no new kicks, the leash alone shrinks it by the factor $e^{-\Delta t/\tau}$. That factor is the **correlation** between the two values. After one time constant the process has kept $e^{-1}\approx 0.37$ of its memory. After three it keeps $e^{-3}\approx 0.05$ — almost nothing. A drag error that is large now says a great deal about the next ten minutes and very little about next week. That is the right shape for a real unmodelled force: correlated over minutes to hours, but bounded.

### How big does it get?

Because of the leash, the random kicks and the pull-back eventually balance. The variance of $a$ settles at a steady value, the **steady-state variance** $\sigma_a^2$ (read "sigma sub a, squared"):

$$
\sigma_a^2 = \frac{q\tau}{2}.
$$

It grows with $q$ (harder kicks) and with $\tau$ (a looser leash, so the dog wanders further before being pulled back). The proof is below.

::: key First-order Gauss-Markov acceleration
$\dot a=-a/\tau+w$, steady-state variance $\sigma_a^2=q\tau/2$. Choosing $\tau$ sets how long an unmodelled force is expected to stay correlated; choosing $q$ (or equivalently $\sigma_a$) sets how large it is expected to be. Both are physical choices about the force being absorbed, not free numerical knobs.
:::

::: note Why it has to be true
At steady state, $\mathbb E[a^2]$ no longer changes, so its time derivative is zero. We need a formula for that derivative.

Over a tiny step $dt$, the equation says $a$ changes by $da = -\frac{a}{\tau}dt + dW$, where $dW$ is the white-noise kick accumulated over $dt$. The kick has mean zero and variance $q\,dt$.

Now square: $(a + da)^2 = a^2 + 2a\,da + (da)^2$. Take the expected value of each piece.

- $\mathbb E[2a\,da] = -\frac{2}{\tau}\mathbb E[a^2]\,dt + 2\,\mathbb E[a\,dW]$. The last term is zero, because the new kick is independent of the current $a$.
- $\mathbb E[(da)^2]$ is not negligible here, which is the surprising part. The piece $(dW)^2$ has expected value $q\,dt$ — first order in $dt$, not second. Every other piece of $(da)^2$ is of order $dt^2$ or has zero mean. This is the **[[Itô|ito]]** correction.

Divide by $dt$:

$$
\frac{d}{dt}\mathbb E[a^2] = -\frac{2}{\tau}\mathbb E[a^2] + q = 0 \quad\Longrightarrow\quad \sigma_a^2 = \frac{q\tau}{2}.
$$

The same equation, solved from the start $a(0) = 0$ instead of at steady state, gives the growing variance

$$
\sigma_a^2(t) = \frac{q\tau}{2}\left(1 - e^{-2t/\tau}\right),
$$

which climbs toward $q\tau/2$ and is within $2\%$ of it after two time constants, since $e^{-4}\approx 0.018$.
:::

::: example Sizing a Gauss-Markov model for drag
Your drag model predicts an acceleration of about $1\times10^{-6}\,\mathrm{m/s^2}$ on a satellite at $420\,\mathrm{km}$. You believe the density model is wrong by about $30\%$, and that a density error tends to persist for about half an hour. What $q$ should the model use?

**Step 1: the size.** Thirty percent of $1\times10^{-6}$ is $3\times10^{-7}$. So set $\sigma_a = 3.0\times10^{-7}\,\mathrm{m/s^2}$.

**Step 2: the memory.** Half an hour is $1800\,\mathrm s$, so $\tau = 1800\,\mathrm s$.

**Step 3: solve $\sigma_a^2 = q\tau/2$ for $q$.** Multiply both sides by $2$ and divide by $\tau$:

$$
q = \frac{2\sigma_a^2}{\tau} = \frac{2\times(3.0\times10^{-7})^2}{1800} = \frac{1.8\times10^{-13}}{1800} = 1.0\times10^{-16}\,\mathrm{m^2/s^5}.
$$

The units look strange but are right: $\mathrm{m^2/s^4}$ (a squared acceleration) divided by seconds.

**Step 4: how much memory survives one filter step?** If the filter steps every $\Delta t = 60\,\mathrm s$, the correlation from one step to the next is

$$
e^{-\Delta t/\tau} = e^{-60/1800} \approx 0.967.
$$

So from one minute to the next the unmodelled acceleration keeps about $97\%$ of its value. That is exactly the "slowly changing current" we wanted.

**Sanity check.** $q$ is tiny, but it should be: it describes an acceleration a million times smaller than gravity's pull at the surface. What matters is that $\sigma_a$ came out at the size you believe the error really is.
:::

::: example The growing variance, confirmed by simulation
Take $\tau = 300\,\mathrm s$ and $q = 4\times10^{-8}$ (any consistent units). The steady state is $\sigma_a^2 = q\tau/2 = 6\times10^{-6}$. To check the formula for $\sigma_a^2(t)$, run $20{,}000$ independent random copies of the process, all starting at $a = 0$, stepping forward one second at a time with the **[[Euler-Maruyama|euler-maruyama]]** rule: add the leash term times $dt$, plus a random kick of variance $q\,dt$.

```python
import numpy as np

tau, q, dt = 300.0, 4e-8, 1.0            # time constant (s), noise density, step (s)
rng = np.random.default_rng(1)
a = np.zeros(20_000)                      # 20,000 runs, all starting at a = 0
for k in range(1, 1201):
    a += -a / tau * dt + rng.normal(0.0, np.sqrt(q * dt), a.size)
    if k in (10, 60, 300, 1200):
        exact = q * tau / 2 * (1 - np.exp(-2 * k * dt / tau))
        print(f"t = {k:5d} s   formula {exact:.3e}   simulated {a.var():.3e}")
# t =    10 s   formula 3.870e-07   simulated 3.908e-07
# t =    60 s   formula 1.978e-06   simulated 1.989e-06
# t =   300 s   formula 5.188e-06   simulated 5.129e-06
# t =  1200 s   formula 5.998e-06   simulated 5.926e-06
```

The simulated and formula variances agree to about $1\%$ at every time. That is the scatter you should expect: with $20{,}000$ runs, a measured variance wobbles by about $\sqrt{2/20000} = 1\%$. By $t = 1200\,\mathrm s$, which is $4\tau$, the variance has reached the steady state $q\tau/2 = 6\times10^{-6}$, as the algebra predicted.
:::

## From continuous noise to a discrete $\mathbf Q$

A Kalman filter does not work in continuous time. It jumps from one measurement to the next, and its predict step, $\mathbf P^-=\boldsymbol\Phi\mathbf P^+\boldsymbol\Phi^\mathsf T+\mathbf Q$, needs one matrix: the **discrete process noise** $\mathbf Q_d$, the extra covariance the random forcing adds over one step $\Delta t$. The job is to turn the continuous description ($q$ and $\tau$) into that matrix.

For the acceleration state alone, the answer is exact and short. Over one step the leash shrinks the old value, and the kicks during the step add a fresh random piece:

$$
a_{k+1} = e^{-\Delta t/\tau}\,a_k + w_k, \qquad \operatorname{Var}(w_k) = \frac{q\tau}{2}\left(1-e^{-2\Delta t/\tau}\right).
$$

This is the growing-variance formula again, over one step: the fresh piece $w_k$ is what the process builds up in time $\Delta t$ starting from zero.

But the acceleration does not sit alone. It feeds velocity, and velocity feeds position, so kicks to $a$ also spread uncertainty into $v$ and $r$, with correlations between all three. Working out those cross terms by hand is tedious and easy to get wrong. The standard tool is **Van Loan's method**, which gets everything at once from one **[[matrix exponential|matrix-exponential]]**.

Write the dynamics of the stacked state as $\dot{\mathbf x} = \mathbf A\mathbf x + \mathbf L w$. Here $\mathbf A$ is the dynamics matrix and $\mathbf L$ is a column that says where the white noise enters — on the acceleration state only. Let $\mathbf Q_c$ be the continuous noise density ($q$, as a $1\times1$ matrix). Build the $2n\times2n$ block matrix and exponentiate it:

$$
\boldsymbol\Xi = \begin{pmatrix}-\mathbf A & \mathbf L\mathbf Q_c\mathbf L^\mathsf T\\ \mathbf 0 & \mathbf A^\mathsf T\end{pmatrix}\Delta t, \qquad \exp(\boldsymbol\Xi) = \begin{pmatrix}\cdot&\boldsymbol\Psi_{12}\\ \mathbf 0&\boldsymbol\Psi_{22}\end{pmatrix}.
$$

($\boldsymbol\Xi$ is the Greek capital "xi", and $\boldsymbol\Psi$ is "psi".) Then read off the two answers: the state transition matrix is $\boldsymbol\Phi=\boldsymbol\Psi_{22}^\mathsf T$, and the discrete process noise is $\mathbf Q_d=\boldsymbol\Phi\boldsymbol\Psi_{12}$. The top-left block is not needed.

::: example Van Loan's $\mathbf Q_d$, checked against the closed form
Stack one axis into $(\text{position},\text{velocity},a)$. Position changes at the velocity, velocity changes at the acceleration, and $a$ follows the Gauss-Markov equation. So

$$
\mathbf A=\begin{pmatrix}0&1&0\\0&0&1\\0&0&-1/\tau\end{pmatrix}, \qquad \mathbf L=\begin{pmatrix}0\\0\\1\end{pmatrix}.
$$

Use the same $\tau=300\,\mathrm s$ and $q=4\times10^{-8}$, and a step $\Delta t = 300\,\mathrm s$:

```python
import numpy as np
from scipy.linalg import expm

def van_loan(A, L, Qc, dt):
    n = A.shape[0]
    Xi = np.zeros((2 * n, 2 * n))
    Xi[:n, :n] = -A
    Xi[:n, n:] = L @ Qc @ L.T
    Xi[n:, n:] = A.T
    Psi = expm(Xi * dt)
    Phi = Psi[n:, n:].T
    return Phi, Phi @ Psi[:n, n:]

tau, q = 300.0, 4e-8
A = np.array([[0, 1, 0], [0, 0, 1], [0, 0, -1 / tau]])
L = np.array([[0.0], [0.0], [1.0]])
Phi, Qd = van_loan(A, L, np.array([[q]]), dt=300.0)
print("Qd[a,a]  =", Qd[2, 2])
print("formula  =", q * tau / 2 * (1 - np.exp(-2.0)))
print("Phi[a,a] =", Phi[2, 2])
print("symmetric:", np.allclose(Qd, Qd.T), " min eigenvalue:", np.linalg.eigvalsh(Qd).min())
# Qd[a,a]  = 5.187988300580322e-06
# formula  = 5.187988300580324e-06
# Phi[a,a] = 0.3678794411714422
# symmetric: True  min eigenvalue: 1.1896885938516804e-06
```

Read the output line by line.

- The acceleration-acceleration entry of $\mathbf Q_d$ matches the one-step formula $\frac{q\tau}{2}(1-e^{-2\Delta t/\tau})$ to the last digit the computer carries. With $\Delta t = \tau$, that is $6\times10^{-6}\times(1 - e^{-2}) \approx 5.19\times10^{-6}$.
- $\Phi[a,a] = e^{-1}$: over one time constant the leash keeps $37\%$ of the old acceleration, as it should.
- $\mathbf Q_d$ is symmetric with all eigenvalues positive, so it is a valid covariance.

The other six entries (the position and velocity parts, and their cross terms) came for free. This is the $\mathbf Q$ that appeared without derivation in the sequential-filtering lesson.
:::

## Dynamic model compensation

**Dynamic model compensation (DMC)** is this construction put to work. Add a three-axis Gauss-Markov acceleration to the filter's state, so the state grows from six numbers (position and velocity) to nine. Propagate it with the $9\times9$ $\boldsymbol\Phi$ and $\mathbf Q_d$ that Van Loan's method gives. The filter then *estimates* the unmodelled acceleration directly, instead of pretending it is zero. Its estimate of $a$ is a useful product in its own right: a plot of it over a day shows the drag or sunlight error the force model missed. The method was worked out in the **[[early 1970s|dmc-history]]** and is still a workhorse in low-orbit tracking.

Many practical systems use a lighter shortcut. They add no extra states at all. Instead they inject a noise straight into the velocity block of $\mathbf Q$ each step:

$$
\mathbf Q_{vv}\approx q\,\Delta t\,\mathbf I.
$$

(Here $\mathbf I$ is the $3\times3$ identity matrix.) This treats the unmodelled acceleration as if it were white rather than correlated. It is cruder — it cannot report an estimate of the missing acceleration the way full DMC can — but it is cheap. The next worked example uses this simple form.

## What happens without it, and what changes with it

The clearest way to see process noise at work is to look at **[[residuals|residual-picture]]** — measurement minus prediction — pass by pass.

::: example Residuals with structure, and without
Use the same $420\,\mathrm{km}$ orbit and three-pass tracking scenario as earlier lessons, with one change: the simulated truth now includes real atmospheric drag that the filter's dynamics model does not know about. (This run uses $10\,\mathrm m$ range noise.) The filter starts from a good initial estimate, as in the sequential-filtering lesson, and runs with no process noise at all. Here are the third pass's range residuals:

```python
# Q = 0 (dynamics trusted completely), pass-3 range residuals (m):
# [101.1 -62.2 -42.6 -57.2 -38.9 -21.1  -3.4 -20.5  10.3   3.3  13.5  13.5
#   62.5  81.8 119.8 136.0 147.2 120.4 118.5 111.6 106.2 106.8  81.9  67.4
#   73.1  67.8  68.0  72.8  68.4  75.1  84.6  75.3  66.6  72.4  74.2  96.7
#   82.6  84.1  74.0]
# mean = 58.8 m, rms = 79.9 m   -- a clear trend, not noise
```

A correct fit would leave residuals that scatter around zero at about the $10\,\mathrm m$ noise level. These do not. The mean is $58.8\,\mathrm m$, almost six times the noise. And the residuals have a shape: negative early in the pass, then rising to a long positive plateau. That is the fit falling behind a drag force it does not know about, and slowly catching up as new data arrives.

Now add a modest velocity process noise, sized by the sweep in the warning below. The same pass becomes:

```python
# Q sized from the sweep below, pass-3 range residuals (m):
# [113.9 -3.5  2.7 -18.8 -4.4 10.2 24.6  4.0 29.7 14.8 11.8 -8.0
#   14.1  3.4 14.1  11.8 16.8 -7.8 -2.1  1.0  5.4 14.4 -3.8 -13.1
#   -3.9 -6.9 -5.4  0.3 -3.7  3.3 13.1  4.1 -4.2  2.2  4.8 28.1
#   14.9 17.3  8.2]
# mean = 7.8 m, rms = 21.7 m
```

The mean drops to near zero, the trend is gone, and the RMS falls by more than a factor of three ($79.9 / 21.7 \approx 3.7$). Only the first point of the pass, taken right after a long gap with no data, is still large. Leave it out and the other $38$ residuals have an RMS of about $12\,\mathrm m$, close to the $10\,\mathrm m$ noise.

**Sanity check.** The process noise never knew the missing force was drag. It only knew that *some* small, slowly varying acceleration was being missed. That generic absorption is exactly what a Gauss-Markov state, or its simpler velocity-noise stand-in, is built to provide.
:::

::: warning More process noise is not always better
Sweeping the injected velocity-noise density $q_{vel}$ on the same scenario shows a clear best value, not steady improvement:

```python
# qvel (km^2/s^3)   overall range RMS (m)
#   0                 109.6
#   1e-18             100.5
#   1e-17              99.6   <- best in this sweep
#   1e-16             101.5
#   1e-15             156.0   <- worse than doing nothing
```

Too little process noise leaves the residual structure you saw above. Too much fails in the opposite direction. The Kalman gain decides how much to trust each new measurement by comparing the predicted uncertainty with the measurement's. Inflate the predicted uncertainty far beyond what the real force justifies, and the gain starts treating every bit of ordinary measurement noise as a real change in the orbit. The filter chases noise. Size $q$ (or $\sigma_a$ and $\tau$) from a physical estimate of the missing force — how big it is and how long it lasts — never by turning it up "to be safe".
:::

## Three ways to handle an uncertain force

Step back. The drag coefficient that the batch lesson added as a seventh state, and the Gauss-Markov acceleration of this lesson, are two answers to one question: what do you do about something in the model you are not sure of? There is a third answer, and together they make a toolkit.

- **Solve for it.** When you know the physical cause and the arc pins it down well, add it to the state and estimate it, as the batch lesson did with the drag coefficient. You get its value and an honestly shrunk covariance on everything linked to it.
- **Absorb it with process noise.** When you do not know the cause precisely, or it changes in a way no single constant can capture, let DMC soak it up. DMC does not care whether the missing force is drag, an unlisted thruster pulse or something else, only that it behaves like a correlated, bounded nuisance acceleration.
- **Consider it.** When a parameter is too poorly observed to estimate, but ignoring its uncertainty would make the covariance dishonest, leave it out of the state and add its uncertainty to the reported covariance anyway.

That third option, and what it costs and buys compared with the first two, is the next lesson.

## Check yourself

::: check
Why does the first-order Gauss-Markov model use $\dot a=-a/\tau+w$ rather than $\dot a=w$ alone to represent an unmodelled force like drag?
:::

::: answer
With $\dot a = w$ alone, each random kick adds to the last and nothing pulls $a$ back, so $a$ is a random walk whose variance grows forever. A real drag error does not behave like that. It is correlated over some physical timescale (the atmosphere does not reset every second), but it also stays bounded by how wrong the density model plausibly is. The $-a/\tau$ term is the leash that gives exactly this behavior: correlated over about $\tau$, with a finite steady-state variance $q\tau/2$. That matches the physics far better than an unbounded random walk.
:::

::: check
Derive the steady-state variance $\sigma_a^2=q\tau/2$ from $\dot a=-a/\tau+w$, and state which assumption makes the derivation valid.
:::

::: answer
At steady state $\mathbb E[a^2]$ is constant, so $\frac{d}{dt}\mathbb E[a^2]=0$. Over a step $dt$, $a$ changes by $da = -\frac{a}{\tau}dt + dW$ with $\operatorname{Var}(dW) = q\,dt$. Squaring and taking expectations: $\mathbb E[a\,dW]=0$ because the new kick is independent of the current state, and $\mathbb E[(dW)^2] = q\,dt$ survives at first order. That gives $\frac{d}{dt}\mathbb E[a^2]=-\frac{2}{\tau}\mathbb E[a^2]+q$. Setting it to zero gives $\sigma_a^2=q\tau/2$. The derivation is valid once the process has run long enough to forget its starting value — several $\tau$ — as the simulation in this lesson showed.
:::

::: check
Your spacecraft's solar radiation pressure model is thought to be wrong by about $2\times10^{-8}\,\mathrm{m/s^2}$, and the error changes as the spacecraft turns, roughly every $3000\,\mathrm s$. Find $q$ for a Gauss-Markov model, and the step-to-step correlation for a filter that steps every $300\,\mathrm s$.
:::

::: answer
Set $\sigma_a = 2\times10^{-8}\,\mathrm{m/s^2}$ and $\tau = 3000\,\mathrm s$. Solve $\sigma_a^2 = q\tau/2$ for $q$:

$$
q = \frac{2\sigma_a^2}{\tau} = \frac{2\times(2\times10^{-8})^2}{3000} = \frac{8\times10^{-16}}{3000} \approx 2.7\times10^{-19}\,\mathrm{m^2/s^5}.
$$

The step-to-step correlation is $e^{-\Delta t/\tau} = e^{-300/3000} = e^{-0.1} \approx 0.905$. So each step keeps about $90\%$ of the previous value of the unmodelled acceleration.
:::

::: check
Explain why the acceleration-acceleration entry of $\mathbf Q_d$ in the Van Loan example equals the closed-form variance exactly, rather than only approximately.
:::

::: answer
Van Loan's construction solves the linear stochastic equation exactly over the step $\Delta t$: it exponentiates the true continuous-time dynamics rather than a truncated approximation of them. In this model nothing feeds back into $a$ from position or velocity, so the acceleration state evolves on its own, and its part of the exact solution is precisely the scalar formula $\frac{q\tau}{2}(1-e^{-2\Delta t/\tau})$. Neither calculation makes an approximation for that entry, so they agree to the precision of the computer's arithmetic.
:::

::: check
The sweep showed $q_{vel}=10^{-15}$ doing worse than $q_{vel}=0$. Using only the idea that a Kalman gain trusts the covariance it is given, explain how too much process noise can make a fit worse than none at all.
:::

::: answer
The Kalman gain weighs the predicted-state uncertainty against the measurement uncertainty. Process noise far larger than the true unmodelled force inflates the predicted covariance well beyond what is warranted. The gain then treats every new measurement, including its ordinary noise, as strong evidence that the state has drifted. The filter chases that noise as if it were real dynamics, and those corrections add error that a correctly sized (or even zero) process noise would not have introduced.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| Process noise | The estimator's allowance for real, unmodelled forces in the dynamics |
| $\dot a=-a/\tau+w$ | First-order Gauss-Markov acceleration; $\tau$ sets the correlation time |
| $e^{-\Delta t/\tau}$ | Correlation between values $\Delta t$ apart |
| $\sigma_a^2=q\tau/2$ | Steady-state variance from the spectral density $q$ |
| $\operatorname{Var}(w_k)=\frac{q\tau}{2}(1-e^{-2\Delta t/\tau})$ | Fresh noise added to $a$ over one step |
| $\boldsymbol\Xi=\begin{pmatrix}-\mathbf A&\mathbf L\mathbf Q_c\mathbf L^\mathsf T\\\mathbf 0&\mathbf A^\mathsf T\end{pmatrix}\Delta t$, $\mathbf Q_d=\boldsymbol\Phi\boldsymbol\Psi_{12}$ | Van Loan's method: exact discrete process noise from a continuous model |
| DMC | Full form: three-axis Gauss-Markov acceleration as extra filter states. Simple form: inject $\mathbf Q_{vv}\approx q\Delta t\,\mathbf I$ |
| Residual structure | A non-zero mean or a visible trend in residuals signals unmodelled dynamics, not only noise |
| Solve-for / DMC / consider | Estimate a known parameter / absorb an unknown or varying force / account for uncertainty without estimating |

DMC absorbed an unmodelled force by letting the filter estimate, or soak up, its effect. The next lesson handles the parameters that are never estimated at all — accounted for honestly in the covariance, without ever entering the state.

::: context srp The push of sunlight
Light carries momentum. When sunlight hits a surface it pushes, very gently. Near Earth the pressure is about $4.6\times10^{-6}$ newtons per square meter for a surface that absorbs everything, and up to about twice that for a perfect mirror. On a satellite with a few square meters of solar panels and a mass of a few hundred kilograms, that gives accelerations of order $10^{-8}$ to $10^{-7}\,\mathrm{m/s^2}$. Tiny — but over days it can shift a predicted position by hundreds of meters or more, and it depends on which way the panels face and how their coatings have aged, which is exactly what the ground does not know precisely.
:::

::: context white-noise Why "white"
The name borrows from light. White light mixes every color, every frequency, in equal amounts. White noise likewise has equal power at every frequency — which is the same as saying it has no memory, since any memory would favor slow changes over fast ones. The hiss between radio stations is close to white. True white noise is an idealization (it would need infinite power), but it is a superb building block. You never use it as a force directly; you feed it into an equation like the Gauss-Markov one, which smooths it into something physical.
:::

::: context ornstein-uhlenbeck A model borrowed from a jiggling particle
Leonard Ornstein and George Uhlenbeck wrote this equation down in 1930 to describe the *velocity* of a tiny particle jostled by molecules in a fluid. The molecules kick it at random (the white noise), and friction with the fluid drags its velocity back toward zero (the $-a/\tau$ term). Orbit determination borrows the same mathematics for a different purpose: the "particle" is the unmodelled acceleration, the kicks are the unpredictable changes in the atmosphere or sunlight, and the friction is our belief that the error stays bounded.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="20" y1="78.5" x2="340" y2="78.5" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="20" y1="121.5" x2="340" y2="121.5" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline points="20.0,100.0 23.2,101.6 26.4,104.1 29.6,103.7 32.8,102.0 36.1,102.4 39.3,109.2 42.5,115.3 45.7,116.8 48.9,122.7 52.1,125.4 55.3,129.5 58.5,129.1 61.7,128.8 64.9,130.7 68.2,130.9 71.4,130.3 74.6,127.4 77.8,126.6 81.0,124.3 84.2,122.5 87.4,125.3 90.6,125.1 93.8,126.8 97.1,130.1 100.3,126.8 103.5,128.5 106.7,127.0 109.9,127.0 113.1,129.8 116.3,126.6 119.5,124.0 122.7,125.3 126.0,131.5 129.2,133.4 132.4,132.0 135.6,131.0 138.8,129.2 142.0,131.1 145.2,134.1 148.4,131.8 151.6,136.8 154.8,142.0 158.1,142.3 161.3,142.2 164.5,140.1 167.7,141.0 170.9,141.8 174.1,144.4 177.3,144.8 180.5,144.2 183.7,145.8 187.0,149.6 190.2,149.3 193.4,148.0 196.6,152.2 199.8,154.1 203.0,154.5 206.2,157.8 209.4,158.5 212.6,158.8 215.9,159.1 219.1,157.2 222.3,156.3 225.5,155.3 228.7,153.2 231.9,150.8 235.1,148.8 238.3,142.9 241.5,145.3 244.7,145.7 248.0,151.0 251.2,150.9 254.4,155.2 257.6,160.2 260.8,158.7 264.0,163.5 267.2,166.2 270.4,161.2 273.6,162.3 276.9,165.8 280.1,164.5 283.3,162.9 286.5,171.8 289.7,176.2 292.9,180.0 296.1,177.6 299.3,176.1 302.5,176.6 305.8,174.9 309.0,177.5 312.2,174.1 315.4,172.9 318.6,177.3 321.8,179.6 325.0,177.2 328.2,175.4 331.4,176.6 334.6,171.9 337.9,171.8" fill="none" stroke="#b4232c" stroke-width="1.8"/>
  <polyline points="20.0,100.0 23.2,101.6 26.4,103.9 29.6,103.2 32.8,101.2 36.1,101.5 39.3,107.9 42.5,113.0 45.7,113.2 48.9,117.7 52.1,118.7 55.3,120.9 58.5,118.6 61.7,116.5 64.9,116.9 68.2,115.6 71.4,113.6 74.6,109.7 77.8,108.0 81.0,105.0 84.2,102.9 87.4,105.3 90.6,104.5 93.8,105.9 97.1,108.6 100.3,104.5 103.5,105.7 106.7,103.9 109.9,103.5 113.1,105.9 116.3,102.2 119.5,99.6 122.7,100.9 126.0,106.9 129.2,108.1 132.4,106.1 135.6,104.6 138.8,102.3 142.0,104.0 145.2,106.5 148.4,103.7 151.6,108.2 154.8,112.6 158.1,111.6 161.3,110.4 164.5,107.2 167.7,107.4 170.9,107.4 174.1,109.3 177.3,108.7 180.5,107.4 183.7,108.3 187.0,111.2 190.2,109.8 193.4,107.5 196.6,110.8 199.8,111.5 203.0,110.8 206.2,112.9 209.4,112.3 212.6,111.5 215.9,110.7 219.1,107.8 222.3,106.3 225.5,104.6 228.7,102.0 231.9,99.6 235.1,97.7 238.3,92.1 241.5,95.4 244.7,96.3 248.0,101.9 251.2,101.7 254.4,105.7 257.6,110.2 260.8,107.7 264.0,111.6 267.2,113.1 270.4,107.0 273.6,107.3 276.9,110.0 280.1,107.8 283.3,105.6 286.5,113.6 289.7,116.3 292.9,118.5 296.1,114.4 299.3,111.6 302.5,111.1 305.8,108.4 309.0,110.0 312.2,105.6 315.4,103.8 318.6,107.6 321.8,109.1 325.0,105.8 328.2,103.6 331.4,104.3 334.6,99.4 337.9,99.3" fill="none" stroke="#1d6fd1" stroke-width="1.8"/>
  <text x="20" y="16" font-size="12" fill="#b4232c">random walk (ȧ = w): wanders off</text>
  <text x="20" y="194" font-size="12" fill="#1d6fd1">Gauss-Markov: pulled back, stays inside the ±3σ lines</text>
</svg>
```

The red path is a random walk; the blue one gets the same kicks but with the leash.
:::

::: context ito Why the square of a kick does not vanish
In ordinary calculus, the square of a tiny change is negligible: if $dx$ is small, $dx^2$ is much smaller. Random kicks break this rule. The kick over a step $dt$ has a typical size of $\sqrt{q\,dt}$ — much larger than $dt$ itself when $dt$ is small — so its square is about $q\,dt$, first order. Kiyosi Itô built the calculus that keeps this term in the 1940s. It is the reason the $+q$ appears in the variance equation: every kick adds a little spread, even though its average is zero.
:::

::: context euler-maruyama The simplest way to simulate a noisy equation
For an ordinary equation $\dot a = f(a)$, Euler's method steps forward with $a \leftarrow a + f(a)\,dt$. The Euler-Maruyama method adds one thing: a random number drawn with variance $q\,dt$ (so standard deviation $\sqrt{q\,dt}$) at each step. Using $\sqrt{dt}$ rather than $dt$ for the random part is the whole trick, and it follows from the same fact as the Itô note: random kicks add up in variance, not in size. Gisiro Maruyama published the method in 1955.
:::

::: context matrix-exponential The exponential of a matrix
For a number, $e^x = 1 + x + x^2/2! + x^3/3! + \cdots$. The same series works when $x$ is a square matrix, and the answer is again a matrix. Its key property: the solution of $\dot{\mathbf x} = \mathbf A\mathbf x$ is $\mathbf x(t) = e^{\mathbf A t}\mathbf x(0)$. So for constant dynamics, the state transition matrix *is* a matrix exponential. SciPy's `expm` computes it reliably. Van Loan's 1978 trick was to stack the dynamics and the noise into one bigger matrix so that a single `expm` delivers both $\boldsymbol\Phi$ and $\mathbf Q_d$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40.0,25.0 47.5,35.9 55.0,45.8 62.5,54.8 70.0,62.9 77.5,70.2 85.0,76.9 92.5,82.9 100.0,88.3 107.5,93.2 115.0,97.7 122.5,101.7 130.0,105.4 137.5,108.7 145.0,111.6 152.5,114.3 160.0,116.8 167.5,119.0 175.0,121.0 182.5,122.8 190.0,124.4 197.5,125.9 205.0,127.3 212.5,128.5 220.0,129.6 227.5,130.6 235.0,131.5 242.5,132.3 250.0,133.0 257.5,133.7 265.0,134.3 272.5,134.8 280.0,135.3 287.5,135.8 295.0,136.2 302.5,136.5 310.0,136.9 317.5,137.2 325.0,137.4 332.5,137.7 340.0,137.9" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="115" y1="140" x2="115" y2="145" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="115" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">τ</text>
  <line x1="190" y1="140" x2="190" y2="145" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">2τ</text>
  <line x1="265" y1="140" x2="265" y2="145" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="265" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">3τ</text>
  <line x1="340" y1="140" x2="340" y2="145" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">4τ</text>
  <text x="40" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="34" y="29" font-size="12" text-anchor="end" fill="#1f2a44">1</text>
  <line x1="40" y1="97.7" x2="115.0" y2="97.7" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
  <line x1="115.0" y1="97.7" x2="115.0" y2="140" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
  <circle cx="115.0" cy="97.7" r="4" fill="#b4232c"/>
  <text x="34" y="102" font-size="12" text-anchor="end" fill="#b4232c">0.37</text>
  <text x="125" y="90" font-size="12" fill="#b4232c">after one τ: 37% left</text>
  <text x="212" y="77" font-size="12" fill="#1d6fd1">correlation e^(−Δt/τ)</text>
</svg>
```

The diagonal entry $\Phi[a,a] = e^{-\Delta t/\tau}$ follows this curve.
:::

::: context dmc-history Where DMC came from
Dynamic model compensation grew out of work at the University of Texas at Austin in the early 1970s, when Byron Tapley and his students faced low-orbit satellites whose drag and radiation forces could not be modeled well enough. Their answer was not a better force model but an honest admission that one was missing, estimated as a correlated acceleration. The idea has since been used in precise orbit work for many missions, and in onboard GPS navigation filters where there is no room for a full force model at all — the topic of this module's last lesson.
:::

::: context residual-picture Seeing the trend
Plot the two sets of pass-3 residuals from the example side by side. With no process noise (red), the dots swing negative and then settle on a plateau far above zero — a shape, not noise. With sized process noise (blue), they hug zero except the very first point after the data gap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="46" y1="112" x2="345" y2="112" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="46" y1="167.0" x2="345" y2="167.0" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="42" y="171.0" font-size="11" text-anchor="end" fill="#6c7a93">-100 m</text>
  <line x1="46" y1="57.0" x2="345" y2="57.0" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="42" y="61.0" font-size="11" text-anchor="end" fill="#6c7a93">+100 m</text>
  <text x="42" y="116" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <circle cx="54.0" cy="56.4" r="2.6" fill="#b4232c"/>
  <circle cx="54.0" cy="49.4" r="2.6" fill="#1d6fd1"/>
  <circle cx="61.4" cy="146.2" r="2.6" fill="#b4232c"/>
  <circle cx="61.4" cy="113.9" r="2.6" fill="#1d6fd1"/>
  <circle cx="68.9" cy="135.4" r="2.6" fill="#b4232c"/>
  <circle cx="68.9" cy="110.5" r="2.6" fill="#1d6fd1"/>
  <circle cx="76.3" cy="143.5" r="2.6" fill="#b4232c"/>
  <circle cx="76.3" cy="122.3" r="2.6" fill="#1d6fd1"/>
  <circle cx="83.8" cy="133.4" r="2.6" fill="#b4232c"/>
  <circle cx="83.8" cy="114.4" r="2.6" fill="#1d6fd1"/>
  <circle cx="91.2" cy="123.6" r="2.6" fill="#b4232c"/>
  <circle cx="91.2" cy="106.4" r="2.6" fill="#1d6fd1"/>
  <circle cx="98.7" cy="113.9" r="2.6" fill="#b4232c"/>
  <circle cx="98.7" cy="98.5" r="2.6" fill="#1d6fd1"/>
  <circle cx="106.1" cy="123.3" r="2.6" fill="#b4232c"/>
  <circle cx="106.1" cy="109.8" r="2.6" fill="#1d6fd1"/>
  <circle cx="113.6" cy="106.3" r="2.6" fill="#b4232c"/>
  <circle cx="113.6" cy="95.7" r="2.6" fill="#1d6fd1"/>
  <circle cx="121.0" cy="110.2" r="2.6" fill="#b4232c"/>
  <circle cx="121.0" cy="103.9" r="2.6" fill="#1d6fd1"/>
  <circle cx="128.5" cy="104.6" r="2.6" fill="#b4232c"/>
  <circle cx="128.5" cy="105.5" r="2.6" fill="#1d6fd1"/>
  <circle cx="135.9" cy="104.6" r="2.6" fill="#b4232c"/>
  <circle cx="135.9" cy="116.4" r="2.6" fill="#1d6fd1"/>
  <circle cx="143.4" cy="77.6" r="2.6" fill="#b4232c"/>
  <circle cx="143.4" cy="104.2" r="2.6" fill="#1d6fd1"/>
  <circle cx="150.8" cy="67.0" r="2.6" fill="#b4232c"/>
  <circle cx="150.8" cy="110.1" r="2.6" fill="#1d6fd1"/>
  <circle cx="158.3" cy="46.1" r="2.6" fill="#b4232c"/>
  <circle cx="158.3" cy="104.2" r="2.6" fill="#1d6fd1"/>
  <circle cx="165.7" cy="37.2" r="2.6" fill="#b4232c"/>
  <circle cx="165.7" cy="105.5" r="2.6" fill="#1d6fd1"/>
  <circle cx="173.2" cy="31.0" r="2.6" fill="#b4232c"/>
  <circle cx="173.2" cy="102.8" r="2.6" fill="#1d6fd1"/>
  <circle cx="180.6" cy="45.8" r="2.6" fill="#b4232c"/>
  <circle cx="180.6" cy="116.3" r="2.6" fill="#1d6fd1"/>
  <circle cx="188.1" cy="46.8" r="2.6" fill="#b4232c"/>
  <circle cx="188.1" cy="113.2" r="2.6" fill="#1d6fd1"/>
  <circle cx="195.5" cy="50.6" r="2.6" fill="#b4232c"/>
  <circle cx="195.5" cy="111.5" r="2.6" fill="#1d6fd1"/>
  <circle cx="202.9" cy="53.6" r="2.6" fill="#b4232c"/>
  <circle cx="202.9" cy="109.0" r="2.6" fill="#1d6fd1"/>
  <circle cx="210.4" cy="53.3" r="2.6" fill="#b4232c"/>
  <circle cx="210.4" cy="104.1" r="2.6" fill="#1d6fd1"/>
  <circle cx="217.8" cy="67.0" r="2.6" fill="#b4232c"/>
  <circle cx="217.8" cy="114.1" r="2.6" fill="#1d6fd1"/>
  <circle cx="225.3" cy="74.9" r="2.6" fill="#b4232c"/>
  <circle cx="225.3" cy="119.2" r="2.6" fill="#1d6fd1"/>
  <circle cx="232.7" cy="71.8" r="2.6" fill="#b4232c"/>
  <circle cx="232.7" cy="114.1" r="2.6" fill="#1d6fd1"/>
  <circle cx="240.2" cy="74.7" r="2.6" fill="#b4232c"/>
  <circle cx="240.2" cy="115.8" r="2.6" fill="#1d6fd1"/>
  <circle cx="247.6" cy="74.6" r="2.6" fill="#b4232c"/>
  <circle cx="247.6" cy="115.0" r="2.6" fill="#1d6fd1"/>
  <circle cx="255.1" cy="72.0" r="2.6" fill="#b4232c"/>
  <circle cx="255.1" cy="111.8" r="2.6" fill="#1d6fd1"/>
  <circle cx="262.5" cy="74.4" r="2.6" fill="#b4232c"/>
  <circle cx="262.5" cy="114.0" r="2.6" fill="#1d6fd1"/>
  <circle cx="270.0" cy="70.7" r="2.6" fill="#b4232c"/>
  <circle cx="270.0" cy="110.2" r="2.6" fill="#1d6fd1"/>
  <circle cx="277.4" cy="65.5" r="2.6" fill="#b4232c"/>
  <circle cx="277.4" cy="104.8" r="2.6" fill="#1d6fd1"/>
  <circle cx="284.9" cy="70.6" r="2.6" fill="#b4232c"/>
  <circle cx="284.9" cy="109.7" r="2.6" fill="#1d6fd1"/>
  <circle cx="292.3" cy="75.4" r="2.6" fill="#b4232c"/>
  <circle cx="292.3" cy="114.3" r="2.6" fill="#1d6fd1"/>
  <circle cx="299.8" cy="72.2" r="2.6" fill="#b4232c"/>
  <circle cx="299.8" cy="110.8" r="2.6" fill="#1d6fd1"/>
  <circle cx="307.2" cy="71.2" r="2.6" fill="#b4232c"/>
  <circle cx="307.2" cy="109.4" r="2.6" fill="#1d6fd1"/>
  <circle cx="314.7" cy="58.8" r="2.6" fill="#b4232c"/>
  <circle cx="314.7" cy="96.5" r="2.6" fill="#1d6fd1"/>
  <circle cx="322.1" cy="66.6" r="2.6" fill="#b4232c"/>
  <circle cx="322.1" cy="103.8" r="2.6" fill="#1d6fd1"/>
  <circle cx="329.6" cy="65.7" r="2.6" fill="#b4232c"/>
  <circle cx="329.6" cy="102.5" r="2.6" fill="#1d6fd1"/>
  <circle cx="337.0" cy="71.3" r="2.6" fill="#b4232c"/>
  <circle cx="337.0" cy="107.5" r="2.6" fill="#1d6fd1"/>
  <text x="46" y="16" font-size="12" fill="#b4232c">no process noise: mean 58.8 m, a trend</text>
  <text x="46" y="194" font-size="12" fill="#1d6fd1">sized process noise: mean 7.8 m, no trend</text>
</svg>
```

The eye catches in a second what a single RMS number hides. Flight dynamics teams plot residuals for exactly this reason.
:::
