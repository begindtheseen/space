---
id: l07-luenberger-observers
title: Luenberger observers and the estimation error dynamics
minutes: 20
covers:
  - Luenberger observers and the estimation error dynamics
---

The controller of Lesson 6 needs $\mathbf{x}$. A spacecraft gives you attitude from a star tracker and perhaps rate from a gyro; it does not give you the torque state inside a motor driver, the amplitude of a solar array's first bending mode, the gyro's drift bias, or the lateral drift of a launch vehicle. Those states exist, they matter, and no sensor reports them.

An **observer** manufactures them. It runs a copy of the plant model inside the flight computer, propagating an estimate $\hat{\mathbf{x}}$ with the same $\mathbf{A}$ and $\mathbf{B}$, and corrects that estimate using the one thing it can check: whether the output the model predicts matches the output the sensors report. The correction gain $\mathbf{L}$ is a design variable, and the beautiful result of this lesson is that choosing it is the same mathematical problem as choosing $\mathbf{K}$ — the dual problem, in the exact sense of Lesson 5. Everything you learned about pole placement applies, with the transposes in the right places.

This lesson shows why an uncorrected model copy is useless, builds the Luenberger observer, derives its error dynamics and shows they are autonomous, designs $\mathbf{L}$ by duality, and then works out the trade that decides how fast to make it: estimation transients on one side, amplified sensor noise on the other.

## Why a model copy alone does not work

The naive idea is to run the model open loop:

$$\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u}.$$

Define the estimation error $\mathbf{e} = \mathbf{x} - \hat{\mathbf{x}}$ and subtract: $\dot{\mathbf{e}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} - \mathbf{A}\hat{\mathbf{x}} - \mathbf{B}\mathbf{u} = \mathbf{A}\mathbf{e}$. The error obeys the plant's own dynamics. If $\mathbf{A}$ is unstable the error diverges; if $\mathbf{A}$ has an integrator — as every rigid-body model does — the error never decays at all, so an initial attitude error of one degree stays one degree forever. Worse, the model in the computer is not the vehicle: a $1\,\%$ inertia error, an unmodelled disturbance torque, a slight actuator scale factor, and the estimate walks away with nothing pulling it back. An open-loop propagator has no feedback, and it behaves exactly as you would expect a system with no feedback to behave.

## The Luenberger observer

Add a correction proportional to the **innovation** — the difference between the measured output and the output the estimate predicts:

::: key Luenberger observer and its error dynamics
$\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}(\mathbf{y} - \mathbf{C}\hat{\mathbf{x}})$. With $\mathbf{e} = \mathbf{x} - \hat{\mathbf{x}}$, the error obeys $\dot{\mathbf{e}} = (\mathbf{A} - \mathbf{L}\mathbf{C})\mathbf{e}$: the error dynamics are autonomous and independent of $\mathbf{u}$.
:::

The derivation is three lines and worth doing yourself. Take $\mathbf{y} = \mathbf{C}\mathbf{x}$ (no feed-through, for clarity) and subtract the observer equation from the plant equation:

$$\dot{\mathbf{e}} = (\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}) - \left(\mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}\mathbf{C}(\mathbf{x}-\hat{\mathbf{x}})\right) = \mathbf{A}\mathbf{e} - \mathbf{L}\mathbf{C}\mathbf{e} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e}.$$

Two things vanished, and both matter. The input $\mathbf{u}$ cancelled, because the observer applies the same command to the same $\mathbf{B}$ — so however violently you manoeuvre, the estimation error is unaffected. And $\mathbf{x}$ itself cancelled, leaving a homogeneous equation in $\mathbf{e}$ alone. The observer's convergence is therefore a property of $\mathbf{A} - \mathbf{L}\mathbf{C}$ and nothing else, and the whole design reduces to placing that matrix's eigenvalues in the left half plane. Lesson 8 shows precisely which assumptions bought this cancellation, and what happens when they fail.

Rearranged for implementation, the observer is a linear system driven by the measurement and the command:

$$\dot{\hat{\mathbf{x}}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}\mathbf{y},$$

which is $n$ states of code running at the control rate — in discrete time, with $\mathbf{A}_d$ and $\mathbf{B}_d$ from Lesson 3, plus a discrete correction gain. Combined with $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$ it is an $n$-th order dynamic output-feedback compensator, the state-space counterpart of the lead-lag networks of classical design, arrived at by a completely different route.

## Designing L by duality

The eigenvalues of a matrix and of its transpose are the same, so

$$\operatorname{eig}(\mathbf{A} - \mathbf{L}\mathbf{C}) = \operatorname{eig}\left((\mathbf{A}-\mathbf{L}\mathbf{C})^\mathsf{T}\right) = \operatorname{eig}\left(\mathbf{A}^\mathsf{T} - \mathbf{C}^\mathsf{T}\mathbf{L}^\mathsf{T}\right).$$

The right-hand side is exactly the state-feedback problem of Lesson 6 for the pair $(\mathbf{A}^\mathsf{T}, \mathbf{C}^\mathsf{T})$ with gain $\mathbf{L}^\mathsf{T}$. So every tool transfers with no new mathematics: run Ackermann, Bass-Gura or an eigenstructure routine on $(\mathbf{A}^\mathsf{T}, \mathbf{C}^\mathsf{T})$ and transpose the answer. And the existence condition transfers too. Arbitrary observer-pole placement requires $(\mathbf{A}^\mathsf{T}, \mathbf{C}^\mathsf{T})$ to be controllable, which by Lesson 5's duality is observability of $(\mathbf{A},\mathbf{C})$; a *stable* observer requires only detectability.

In observable canonical form the answer is as transparent as Lesson 6's was: $\mathbf{L} = (\alpha_0 - a_0,\ \alpha_1 - a_1,\ \dots,\ \alpha_{n-1}-a_{n-1})^\mathsf{T}$, the same coefficient differences, now stacked as a column.

::: example An observer for the antenna gimbal
The gimbal has $\mathbf{A} = \begin{pmatrix}0&1&0\\0&-0.5&1.25\\0&0&-50\end{pmatrix}$, $\mathbf{B} = (0,0,50)^\mathsf{T}$ and an encoder reading angle only, $\mathbf{C} = (1\ \ 0\ \ 0)$. Lesson 6 placed the controller poles at $-2\pm2i$ and $-20\ \mathrm{s^{-1}}$. Put the observer poles four times further out, at $-8\pm8i$ and $-80\ \mathrm{s^{-1}}$, so the desired polynomial is

$$(s^2+16s+128)(s+80) = s^3 + 96s^2 + 1408s + 10240.$$

The open-loop polynomial is $s^3 + 50.5s^2 + 25s$, so the coefficient differences are $(10240 - 0,\ 1408 - 25,\ 96 - 50.5) = (10240,\ 1383,\ 45.5)$. Running Ackermann on $(\mathbf{A}^\mathsf{T}, \mathbf{C}^\mathsf{T})$ and transposing gives the gain in physical coordinates:

$$\mathbf{L} = \begin{pmatrix}45.5\\ -914.75\\ 43872\end{pmatrix}.$$

Verify by hand. With $\mathbf{C} = (1\ 0\ 0)$, the product $\mathbf{L}\mathbf{C}$ places $\mathbf{L}$ in the first column, so

$$\mathbf{A} - \mathbf{L}\mathbf{C} = \begin{pmatrix}-45.5 & 1 & 0\\ 914.75 & -0.5 & 1.25\\ -43872 & 0 & -50\end{pmatrix},$$

whose characteristic polynomial expands to $s^3 + 96s^2 + 1408s + 10240$ — the trace immediately gives the $s^2$ coefficient, $45.5 + 0.5 + 50 = 96$, which is the quickest partial check available.

The units tell the story. $L_1 = 45.5\,\mathrm{s^{-1}}$ corrects the angle estimate at $45.5$ radians per second per radian of innovation. $L_3 = 43872\,\mathrm{N\,m/(rad\,s)}$ corrects the torque estimate: a $1\,\mathrm{mrad}$ innovation drives the torque estimate at $43.9\,\mathrm{N\,m/s}$. Gains that large are the signature of asking a chain of three integrations to converge fast from one measurement, and they are the reason the next section is about restraint. They are also why the encoder's resolution matters directly — the innovation is measured in encoder counts, and $L_3$ multiplies its quantisation noise.
:::

## How fast should the observer be?

The temptation is to make $\mathbf{A}-\mathbf{L}\mathbf{C}$ very fast, so that estimation error vanishes before the controller notices. The cost is that $\mathbf{L}$ multiplies sensor noise, which enters through the innovation and is injected directly into the estimate — and from there into $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$ and out to the actuator.

::: key How fast should the observer be?
Typically 2–6 times the controller bandwidth, so estimation transients die before the controller reacts to them. Faster costs noise amplification through $\mathbf{L}$, exactly as faster controller poles cost control effort through $\mathbf{K}$.
:::

::: example What each factor of observer speed costs
Take the $J = 120\,\mathrm{kg\,m^2}$ spacecraft axis with $\mathbf{x} = (\theta,\omega)$ and a star tracker measuring $\theta$ at $4\,\mathrm{Hz}$ with $10'' = 4.85\times10^{-5}\,\mathrm{rad}$ of noise per sample. Lesson 6 set the controller at $a = 0.1\,\mathrm{rad/s}$, giving $\mathbf{K} = (2.4,\ 24)$. Place the observer poles at $-ra(1\pm i)$ for a speed ratio $r$. With $\mathbf{C} = (1\ \ 0)$,

$$\mathbf{A} - \mathbf{L}\mathbf{C} = \begin{pmatrix}-L_1 & 1\\ -L_2 & 0\end{pmatrix}, \qquad s^2 + L_1 s + L_2,$$

and matching $s^2 + 2ras + 2r^2a^2$ gives $L_1 = 2ra$ and $L_2 = 2r^2a^2$ — the observer twin of $\mathbf{K} = (2a^2J,\ 2aJ)$, with the roles of the two entries swapped exactly as duality predicts.

Now propagate the noise. Discrete measurement noise of standard deviation $\sigma$ at period $T$ has equivalent continuous intensity $\sigma^2T$, and the steady-state estimate covariance is $\sigma^2T\,\mathbf{P}$ where $\mathbf{P}$ solves the Lyapunov equation $(\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{P} + \mathbf{P}(\mathbf{A}-\mathbf{L}\mathbf{C})^\mathsf{T} + \mathbf{L}\mathbf{L}^\mathsf{T} = \mathbf{0}$:

| $r$ | observer poles | $\mathbf{L}$ | $\sigma_{\hat\theta}$ | $\sigma_{\hat\omega}$ | torque noise |
| --- | --- | --- | --- | --- | --- |
| 1 | $-0.1(1\pm i)$ | $(0.2,\ 0.02)$ | $1.94''$ | $0.158\ ^\circ/\mathrm{hr}$ | $3.9\times10^{-5}\,\mathrm{N\,m}$ |
| 2 | $-0.2(1\pm i)$ | $(0.4,\ 0.08)$ | $2.74''$ | $0.447\ ^\circ/\mathrm{hr}$ | $8.0\times10^{-5}\,\mathrm{N\,m}$ |
| 4 | $-0.4(1\pm i)$ | $(0.8,\ 0.32)$ | $3.87''$ | $1.26\ ^\circ/\mathrm{hr}$ | $1.9\times10^{-4}\,\mathrm{N\,m}$ |
| 10 | $-1.0(1\pm i)$ | $(2.0,\ 2.0)$ | $6.12''$ | $5.00\ ^\circ/\mathrm{hr}$ | $6.4\times10^{-4}\,\mathrm{N\,m}$ |

Two clean scaling laws fall out. The attitude-estimate noise grows as $\sqrt{r}$ — a fast observer trusts the noisy measurement more and the smooth model less — while the **rate**-estimate noise grows as $r^{3/2}$, because differentiating a noisy signal is what a rate estimate fundamentally is. Ten times faster costs $3.2$ times more attitude noise and $32$ times more rate noise.

Reading the table against the hardware: at $r = 4$ the observer settles in about $4.6/0.4 = 11.5\,\mathrm{s}$, roughly a quarter of the controller's $46\,\mathrm{s}$, the rate estimate is good to $1.3\ ^\circ/\mathrm{hr}$, and the noise-driven torque of $1.9\times10^{-4}\,\mathrm{N\,m}$ is a tenth of a percent of the $0.2\,\mathrm{N\,m}$ wheel authority. At $r = 10$ the rate estimate has degraded to $5\ ^\circ/\mathrm{hr}$ for an observer settling time the controller cannot exploit. The rule of two to six is not a superstition; it is where these two curves cross for most vehicles.

One more constraint the table does not show: the observer poles have to stay well inside the sample rate. At $4\,\mathrm{Hz}$, an observer pole beyond about $2.5\,\mathrm{rad/s}$ is no longer meaningful, because the discrete observer gain would be asking for a correction larger than one sample's worth of information.
:::

::: warning An observer is not a low-pass filter you can tune by feel
It is tempting to treat $\mathbf{L}$ as a smoothing knob and turn it down when the output looks noisy. Two things break. A slow observer lags the true state, and that lag appears inside the control loop as phase loss at crossover, eating the margin you designed for. And an observer slower than an unstable plant mode cannot track it at all: if $\mathbf{A}-\mathbf{L}\mathbf{C}$ has an eigenvalue to the right of an unstable plant eigenvalue, the estimate diverges more slowly than the truth and the error grows. When noise is the real problem, the principled answer is to choose $\mathbf{L}$ from the noise statistics rather than by hand — which is the Kalman filter, and is what the estimation modules of the next tier are for.
:::

## Reduced-order observers

If $\mathbf{C}$ has rank $p$, then $p$ combinations of the state are measured directly and only $n-p$ need estimating. A **reduced-order** or Luenberger observer estimates exactly those, with $n-p$ states of code instead of $n$. Partition the state as $\mathbf{x} = (\mathbf{x}_a, \mathbf{x}_b)$ with $\mathbf{x}_a = \mathbf{y}$ measured, write out the two blocks of the dynamics, and treat the $\mathbf{x}_a$ block as an extra measurement equation for $\mathbf{x}_b$; the result is an $(n-p)$-state observer whose error matrix is $\mathbf{A}_{bb} - \mathbf{L}_r\mathbf{A}_{ab}$, and $\mathbf{L}_r$ is placed by exactly the same duality.

The saving is real on a small processor, and it comes with a cost that decides most flight designs against it: the reduced-order estimate contains the raw measurement undifferentiated and unfiltered, so measurement noise passes straight into $\hat{\mathbf{x}}_a$ and, through the coupling, into $\hat{\mathbf{x}}_b$. A full-order observer filters everything, including the states you measured. With a noisy star tracker the full-order form is usually the better vehicle even though it is estimating something you already know.

```python
import numpy as np

def obsv(A, C):
    rows, blk = [C], C
    for _ in range(A.shape[0] - 1):
        blk = blk @ A
        rows.append(blk)
    return np.vstack(rows)

def observer_gain(A, C, poles):          # Ackermann on the dual pair
    n = A.shape[0]
    P = np.zeros((n, n))
    for c in np.poly(np.asarray(poles, complex)).real:
        P = P @ A.T + c * np.eye(n)          # Horner in A-transpose
    dual_ctrb = obsv(A, C).T                 # [C^T, A^T C^T, ...] by duality
    e_n = np.zeros((1, n)); e_n[0, -1] = 1.0
    return (e_n @ np.linalg.inv(dual_ctrb) @ P).T

A = np.array([[0.0, 1, 0], [0, -0.5, 1.25], [0, 0, -50]])
C = np.array([[1.0, 0, 0]])
L = observer_gain(A, C, [-8 + 8j, -8 - 8j, -80])
print("L =", L.ravel())
print("eig(A - LC) =", np.sort_complex(np.linalg.eigvals(A - L @ C)))
print("trace check  =", -np.trace(A - L @ C))
# L = [   45.5   -914.75 43872.  ]
# eig(A - LC) = [-80.+0.j  -8.-8.j  -8.+8.j]
# trace check  = 96.00000000000001
```

## Check yourself

::: check
A plant has $\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$ and $\mathbf{C} = (1\ \ 0)$. Find $\mathbf{L}$ placing the observer poles at $-5$ and $-5$, and say what $\hat{x}_2$ is doing physically.
:::

::: answer
$\mathbf{A}-\mathbf{L}\mathbf{C} = \begin{pmatrix}-L_1&1\\-L_2&0\end{pmatrix}$ with characteristic polynomial $s^2 + L_1s + L_2$. Matching $(s+5)^2 = s^2 + 10s + 25$ gives $\mathbf{L} = (10,\ 25)^\mathsf{T}$. Physically $x_2$ is the rate and $x_1$ the position, so the observer is a filtered differentiator: it drives $\hat{x}_2$ at $25$ units per second for every unit of position innovation, and the double pole at $-5$ means the rate estimate is effectively a second-order low pass on the position derivative with a $0.2\,\mathrm{s}$ time constant. Any rate estimate built from a position measurement is a differentiator in disguise, which is why its noise grows so much faster than the position estimate's.
:::

::: check
Show that the estimation error is unaffected by the command $\mathbf{u}$, and explain why that is more than an algebraic accident.
:::

::: answer
Subtracting the observer equation from the plant equation, the terms $\mathbf{B}\mathbf{u}$ appear once each with opposite sign and cancel, leaving $\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e}$ with no input term. It is not an accident: the observer knows exactly what command was applied and applies the same command to the same model, so the commanded part of the motion is predicted perfectly and never appears in the innovation. The consequence is that estimation error is a property of the observer design and the model quality, independent of how the vehicle is being flown — which is what allows the controller and the observer to be designed separately. If the observer used a different $\mathbf{B}$, or did not know $\mathbf{u}$, the cancellation would fail and a term $(\mathbf{B}-\hat{\mathbf{B}})\mathbf{u}$ would drive the error. That is the subject of the next lesson.
:::

::: check
A gyro is available as well as a star tracker, so $\mathbf{C} = \mathbf{I}_2$ for the $(\theta,\omega)$ model. Is an observer still worth building?
:::

::: answer
Yes, for two reasons, even though both states are measured and the rank test is trivially satisfied. First, filtering: both measurements are noisy, and the observer blends them with the dynamic model, so $\hat{\theta}$ and $\hat{\omega}$ are less noisy than the raw readings and mutually consistent. Second, and more importantly on a real vehicle, the state usually needs to grow: a gyro bias state, a disturbance-torque state, a flexible-mode amplitude. Those are not measured, and once one is added the observer is doing genuine estimation again. What changes with $\mathbf{C} = \mathbf{I}$ is that a reduced-order observer would have nothing to estimate, and $\mathbf{L}$ becomes a $2\times2$ matrix with four degrees of freedom to place two poles — the multi-output freedom of Lesson 6, dualised.
:::

::: check
An observer is designed with poles ten times faster than the controller. In hardware the estimate is visibly noisy and the wheels chatter. Name two fixes and one non-fix.
:::

::: answer
Fixes: slow the observer to two to four times the controller bandwidth, accepting a longer estimation transient — the noise in the rate estimate falls as $r^{3/2}$, so going from $r=10$ to $r=4$ cuts it by a factor of about $4$. Or choose $\mathbf{L}$ from the noise statistics instead of by pole placement, which is the Kalman filter and gives the best achievable trade for the noise you actually have. A third real fix is to improve the measurement: a better sensor or a faster sample rate moves the whole trade curve. The non-fix is to low-pass the estimate after the observer. That adds phase lag inside the control loop without reducing the noise the observer has already injected into the states, and it destroys the clean error dynamics that make the next lesson's separation argument work.
:::

::: check
For the gimbal observer above, the innovation at some instant is $2\,\mathrm{mrad}$. What correction rate does each state receive, and what does the size of $L_3$ tell you about the encoder you need?
:::

::: answer
The correction term is $\mathbf{L}(y - \mathbf{C}\hat{\mathbf{x}})$, so with an innovation of $2\times10^{-3}\,\mathrm{rad}$: $\hat{\theta}$ is corrected at $45.5\times2\times10^{-3} = 0.091\,\mathrm{rad/s}$, $\hat{\omega}$ at $-914.75\times2\times10^{-3} = -1.83\,\mathrm{rad/s^2}$, and $\hat{\tau}$ at $43872\times2\times10^{-3} = 87.7\,\mathrm{N\,m/s}$. The last number says the torque estimate is being slewed at a rate that would traverse the motor's entire range in a fraction of a second, so encoder noise of even a few microradians is significant: at $L_3 = 43872$, one microradian of quantisation produces $0.044\,\mathrm{N\,m/s}$ of torque-estimate jitter. Either the encoder needs enough resolution that a count is well below a microradian, or the observer poles need to come in.
:::

## Summary

| Item | Statement |
| --- | --- |
| Open-loop copy | $\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u}$ gives $\dot{\mathbf{e}} = \mathbf{A}\mathbf{e}$ — no correction, never converges for an integrator |
| Luenberger observer | $\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}(\mathbf{y}-\mathbf{C}\hat{\mathbf{x}})$ |
| Error dynamics | $\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e}$: autonomous, independent of $\mathbf{u}$ |
| Design by duality | $\operatorname{eig}(\mathbf{A}-\mathbf{L}\mathbf{C}) = \operatorname{eig}(\mathbf{A}^\mathsf{T}-\mathbf{C}^\mathsf{T}\mathbf{L}^\mathsf{T})$: place on $(\mathbf{A}^\mathsf{T},\mathbf{C}^\mathsf{T})$, transpose |
| Existence | arbitrary placement needs observability; a stable observer needs only detectability |
| Observable canonical | $\mathbf{L} = (\alpha_0-a_0,\ \dots,\ \alpha_{n-1}-a_{n-1})^\mathsf{T}$ |
| Speed rule | 2–6 times the controller bandwidth; faster amplifies noise through $\mathbf{L}$ |
| Noise scaling | double integrator with position measurement: $\sigma_{\hat\theta}\propto\sqrt{r}$, $\sigma_{\hat\omega}\propto r^{3/2}$ |
| Implementation | $\dot{\hat{\mathbf{x}}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}\mathbf{y}$; with $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$, an $n$-state compensator |
| Reduced order | $n-p$ states, error matrix $\mathbf{A}_{bb}-\mathbf{L}_r\mathbf{A}_{ab}$; cheaper but passes measurement noise through unfiltered |

You now have a controller that assumes it knows the state and an observer that supplies one. Wiring them together raises an obvious worry: the controller was designed for the true state and is being fed an estimate, so surely the poles move. The next lesson shows that on an exact model they do not — and states exactly what "exact" has to mean for that to be true.
