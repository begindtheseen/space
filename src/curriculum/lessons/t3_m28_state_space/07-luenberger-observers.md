---
id: l07-luenberger-observers
title: Luenberger observers and the estimation error dynamics
minutes: 19
covers:
  - Luenberger observers and the estimation error dynamics
---

The controller from Lesson 6 has one big demand: it needs the whole state $\mathbf{x}$. A real vehicle does not hand it over. A spacecraft gives you its attitude from a **[[star tracker|star-tracker]]** — a camera that recognizes star patterns — and perhaps its spin rate from a gyro. It does not tell you the torque inside a motor driver, how far a solar array is bending, how much the gyro has drifted, or how fast a launch vehicle is sliding sideways. Those numbers are real, they matter, and no sensor reports them.

An **observer** makes them up — carefully. Think of a ship's navigator without GPS. She keeps a running guess of the ship's position from its speed and heading, and every time a lighthouse comes into view she nudges the guess toward what the lighthouse says. An observer does exactly that inside the flight computer. It runs a copy of the plant model, and it corrects the copy using the one thing it can check: does the output the model predicts match what the sensors report?

How hard to nudge is set by a gain matrix $\mathbf{L}$. The lovely result of this lesson is that choosing $\mathbf{L}$ is the same math problem as choosing $\mathbf{K}$ — its mirror image, the dual problem of Lesson 5. Everything you know about pole placement carries over, with transposes in the right places. We will see why a model copy on its own fails, build the Luenberger observer, show its error obeys a simple equation of its own, design $\mathbf{L}$, and then face the real trade: fast estimates against noisy ones.

## Why a model copy alone does not work

The first idea is to run the model with no correction at all. Write the estimate as $\hat{\mathbf{x}}$, read "x hat" — the hat means "our best guess of". Then

$$\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u}.$$

The **estimation error** is the gap between truth and guess, $\mathbf{e} = \mathbf{x} - \hat{\mathbf{x}}$. Subtract the guess's equation from the plant's equation, line by line:

$$\dot{\mathbf{e}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} - \mathbf{A}\hat{\mathbf{x}} - \mathbf{B}\mathbf{u} = \mathbf{A}\mathbf{e}.$$

The command $\mathbf{B}\mathbf{u}$ appeared once with each sign and cancelled. What is left says the error behaves exactly like the plant itself.

That is bad news. If $\mathbf{A}$ is unstable, the error grows. If $\mathbf{A}$ has an integrator — and every rigid-body model does — the error never shrinks at all. Start the guess one degree off and it stays one degree off forever. Worse, the model in the computer is never the real vehicle. A $1\,\%$ inertia error, a disturbance torque nobody modeled, an actuator that pushes a little harder than it says — each one makes the guess **[[drift away|dead-reckoning]]**, with nothing to pull it back. A model run with no feedback behaves exactly like any system with no feedback.

## The Luenberger observer

The fix is the navigator's nudge. Compare what the sensors say, $\mathbf{y}$, with what the guess predicts they should say, $\mathbf{C}\hat{\mathbf{x}}$. The difference $\mathbf{y} - \mathbf{C}\hat{\mathbf{x}}$ is the **[[innovation|innovation-word]]** — the part of the measurement that is news to the model. Feed it back through $\mathbf{L}$:

::: key Luenberger observer and its error dynamics
$\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}(\mathbf{y} - \mathbf{C}\hat{\mathbf{x}})$. With $\mathbf{e} = \mathbf{x} - \hat{\mathbf{x}}$, the error obeys $\dot{\mathbf{e}} = (\mathbf{A} - \mathbf{L}\mathbf{C})\mathbf{e}$: the error dynamics are autonomous and independent of $\mathbf{u}$.
:::

This is the **[[Luenberger observer|luenberger]]**. If the guess is right, the innovation is zero and the observer is a plain model copy. If the guess is wrong, the innovation pushes it back toward the truth.

Here is where the error equation comes from. Take $\mathbf{y} = \mathbf{C}\mathbf{x}$ (no feed-through, to keep it short). Subtract the observer equation from the plant equation:

$$\dot{\mathbf{e}} = (\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}) - \left(\mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}\mathbf{C}(\mathbf{x}-\hat{\mathbf{x}})\right) = \mathbf{A}\mathbf{e} - \mathbf{L}\mathbf{C}\mathbf{e} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e}.$$

In words: the two $\mathbf{B}\mathbf{u}$ terms cancel, $\mathbf{A}\mathbf{x} - \mathbf{A}\hat{\mathbf{x}}$ becomes $\mathbf{A}\mathbf{e}$, and $\mathbf{L}\mathbf{C}(\mathbf{x}-\hat{\mathbf{x}})$ becomes $\mathbf{L}\mathbf{C}\mathbf{e}$.

Two things vanished, and both matter.

- **The input $\mathbf{u}$ is gone.** The observer applies the same command to the same $\mathbf{B}$, so it predicts the commanded motion perfectly. However hard you maneuver, the estimation error does not care.
- **The state $\mathbf{x}$ is gone.** Only $\mathbf{e}$ is left. The error equation is **autonomous** — it runs on its own, driven by nothing outside it.

So whether the observer converges depends on the matrix $\mathbf{A} - \mathbf{L}\mathbf{C}$ and nothing else. The whole design is: put that matrix's eigenvalues in the left half plane, where errors die out. Lesson 8 shows exactly which assumptions bought these cancellations, and what happens when they fail.

For coding, collect the $\hat{\mathbf{x}}$ terms:

$$\dot{\hat{\mathbf{x}}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}\mathbf{y}.$$

That is a linear system with $n$ states, fed by the measurement and the command, running at the control rate. On the flight computer it runs in discrete time, with $\mathbf{A}_d$ and $\mathbf{B}_d$ from Lesson 3 and a discrete correction gain. Add $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$ and you have an $n$-th order compensator from sensor to actuator — the state-space cousin of the lead-lag networks of classical design, reached by a completely different road.

## Designing L by duality

A matrix and its **transpose** (the matrix flipped across its diagonal) have the [[same eigenvalues|same-eigenvalues]]. So

$$\operatorname{eig}(\mathbf{A} - \mathbf{L}\mathbf{C}) = \operatorname{eig}\left((\mathbf{A}-\mathbf{L}\mathbf{C})^\mathsf{T}\right) = \operatorname{eig}\left(\mathbf{A}^\mathsf{T} - \mathbf{C}^\mathsf{T}\mathbf{L}^\mathsf{T}\right).$$

Look at the right-hand side. It is the state-feedback problem of Lesson 6, $\mathbf{A} - \mathbf{B}\mathbf{K}$, with $\mathbf{A}^\mathsf{T}$ in place of $\mathbf{A}$, $\mathbf{C}^\mathsf{T}$ in place of $\mathbf{B}$, and $\mathbf{L}^\mathsf{T}$ in place of $\mathbf{K}$. So every tool carries over with no new math. Run Ackermann, Bass-Gura or an eigenstructure routine on the pair $(\mathbf{A}^\mathsf{T}, \mathbf{C}^\mathsf{T})$, and transpose the answer.

The condition for success carries over too. Placing the observer poles anywhere you like needs $(\mathbf{A}^\mathsf{T}, \mathbf{C}^\mathsf{T})$ to be controllable. By Lesson 5's duality, that is the same as $(\mathbf{A},\mathbf{C})$ being observable. A merely *stable* observer needs only detectability.

In observable canonical form the answer is as clean as Lesson 6's. The coefficients sit in one column, so

$$\mathbf{L} = (\alpha_0 - a_0,\ \alpha_1 - a_1,\ \dots,\ \alpha_{n-1}-a_{n-1})^\mathsf{T},$$

where $a_i$ are the plant's characteristic-polynomial coefficients and $\alpha_i$ the ones you want. Same differences as for $\mathbf{K}$, now stacked as a column.

::: example An observer for the antenna gimbal
The gimbal from Lesson 1 has

$$\mathbf{A} = \begin{pmatrix}0&1&0\\0&-0.5&1.25\\0&0&-50\end{pmatrix}, \qquad \mathbf{B} = (0,0,50)^\mathsf{T},$$

and an **[[encoder|encoder]]** that reads the angle only, $\mathbf{C} = (1\ \ 0\ \ 0)$. Lesson 6 put the controller poles at $-2\pm2i$ and $-20\ \mathrm{s^{-1}}$. Put the observer poles four times farther out, at $-8\pm8i$ and $-80\ \mathrm{s^{-1}}$.

**Step 1: the polynomial you want.** Multiply out the factors:

$$(s^2+16s+128)(s+80) = s^3 + 96s^2 + 1408s + 10240.$$

**Step 2: the polynomial you have.** The plant's is $s^3 + 50.5s^2 + 25s$.

**Step 3: the differences.** Constant term, $s$ term, $s^2$ term: $(10240 - 0,\ 1408 - 25,\ 96 - 50.5) = (10240,\ 1383,\ 45.5)$. That is $\mathbf{L}$ in canonical coordinates.

**Step 4: back to physical coordinates.** Running Ackermann on $(\mathbf{A}^\mathsf{T}, \mathbf{C}^\mathsf{T})$ and transposing gives

$$\mathbf{L} = \begin{pmatrix}45.5\\ -914.75\\ 43872\end{pmatrix}.$$

**Check by hand.** With $\mathbf{C} = (1\ 0\ 0)$, the product $\mathbf{L}\mathbf{C}$ puts $\mathbf{L}$ into the first column and zeros elsewhere. So

$$\mathbf{A} - \mathbf{L}\mathbf{C} = \begin{pmatrix}-45.5 & 1 & 0\\ 914.75 & -0.5 & 1.25\\ -43872 & 0 & -50\end{pmatrix}.$$

Its characteristic polynomial expands to $s^3 + 96s^2 + 1408s + 10240$. The fastest partial check is the trace: the $s^2$ coefficient is minus the sum of the diagonal, $45.5 + 0.5 + 50 = 96$. It matches.

**What the numbers mean.** Read the units. $L_1 = 45.5\,\mathrm{s^{-1}}$: each radian of innovation corrects the angle guess at $45.5$ radians per second. $L_3 = 43872\,\mathrm{N\,m/(rad\,s)}$ corrects the torque guess: a $1\,\mathrm{mrad}$ innovation drives it at $43.9\,\mathrm{N\,m/s}$. Gains this big are what you get when you ask a chain of three integrations to settle fast from one measurement. They are also why the encoder's resolution matters. The innovation is counted in encoder steps, and $L_3$ multiplies their rounding noise.
:::

## How fast should the observer be?

It is tempting to make $\mathbf{A}-\mathbf{L}\mathbf{C}$ very fast, so the estimation error is gone before the controller notices. The catch is that sensor noise enters through the innovation, and $\mathbf{L}$ multiplies it straight into the estimate. From there it goes into $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$ and out to the actuator. A navigator who swings the whole plot at every flicker of the lighthouse gets a jumpy position.

::: key How fast should the observer be?
Typically 2–6 times the controller bandwidth, so estimation transients die before the controller reacts to them. Faster costs noise amplification through $\mathbf{L}$, exactly as faster controller poles cost control effort through $\mathbf{K}$.
:::

::: example What each factor of observer speed costs
Take the spacecraft axis with inertia $J = 120\,\mathrm{kg\,m^2}$ and state $\mathbf{x} = (\theta,\omega)$ — angle and spin rate. A star tracker measures $\theta$ four times a second ($4\,\mathrm{Hz}$) with $10$ **[[arcseconds|arcsecond]]** of noise per sample, which is $4.85\times10^{-5}\,\mathrm{rad}$. Lesson 6 set the controller poles at $-a(1\pm i)$ with $a = 0.1\,\mathrm{rad/s}$, giving $\mathbf{K} = (2.4,\ 24)$.

Put the observer poles at $-ra(1\pm i)$, where $r$ is the **speed ratio**: how many times faster the observer is than the controller. With $\mathbf{C} = (1\ \ 0)$,

$$\mathbf{A} - \mathbf{L}\mathbf{C} = \begin{pmatrix}-L_1 & 1\\ -L_2 & 0\end{pmatrix}, \qquad \text{characteristic polynomial } s^2 + L_1 s + L_2.$$

The poles $-ra(1\pm i)$ give $s^2 + 2ras + 2r^2a^2$. Match coefficients: $L_1 = 2ra$ and $L_2 = 2r^2a^2$. Compare $\mathbf{K} = (2a^2J,\ 2aJ)$ — the two entries swap roles, exactly as duality predicts.

Now follow the noise. Noise of standard deviation $\sigma$ (read "sigma") sampled every $T$ seconds acts like continuous noise of intensity $\sigma^2T$. The steady spread of the estimate is then $\sigma^2T\,\mathbf{P}$, where $\mathbf{P}$ solves a Lyapunov equation — the same kind of matrix equation that gave the controllability Gramian in Lesson 4

$$(\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{P} + \mathbf{P}(\mathbf{A}-\mathbf{L}\mathbf{C})^\mathsf{T} + \mathbf{L}\mathbf{L}^\mathsf{T} = \mathbf{0}.$$

Here $T = 0.25\,\mathrm{s}$. Solving for four speed ratios:

| $r$ | observer poles | $\mathbf{L}$ | $\sigma_{\hat\theta}$ | $\sigma_{\hat\omega}$ | torque noise |
| --- | --- | --- | --- | --- | --- |
| 1 | $-0.1(1\pm i)$ | $(0.2,\ 0.02)$ | $1.94''$ | $0.158\ ^\circ/\mathrm{hr}$ | $3.9\times10^{-5}\,\mathrm{N\,m}$ |
| 2 | $-0.2(1\pm i)$ | $(0.4,\ 0.08)$ | $2.74''$ | $0.447\ ^\circ/\mathrm{hr}$ | $8.0\times10^{-5}\,\mathrm{N\,m}$ |
| 4 | $-0.4(1\pm i)$ | $(0.8,\ 0.32)$ | $3.87''$ | $1.26\ ^\circ/\mathrm{hr}$ | $1.9\times10^{-4}\,\mathrm{N\,m}$ |
| 10 | $-1.0(1\pm i)$ | $(2.0,\ 2.0)$ | $6.12''$ | $5.00\ ^\circ/\mathrm{hr}$ | $6.4\times10^{-4}\,\mathrm{N\,m}$ |

Two clean patterns fall out. The angle-estimate noise grows as $\sqrt{r}$: a fast observer trusts the noisy measurement more and the smooth model less. The **rate**-estimate noise grows as $r^{3/2}$, much faster, because a rate estimate built from angle readings is a **[[differentiator|noise-scaling]]** in disguise. Ten times faster costs $\sqrt{10} \approx 3.2$ times the angle noise and $10^{3/2} \approx 32$ times the rate noise.

**Reading it against the hardware.** A second-order mode settles in about $4.6$ divided by its decay rate. At $r = 4$ the observer settles in about $4.6/0.4 = 11.5\,\mathrm{s}$, a quarter of the controller's $4.6/0.1 = 46\,\mathrm{s}$. Its rate estimate is good to $1.3\ ^\circ/\mathrm{hr}$. The noise torque of $1.9\times10^{-4}\,\mathrm{N\,m}$ is a tenth of a percent of a $0.2\,\mathrm{N\,m}$ wheel. At $r = 10$ the rate estimate has slipped to $5\ ^\circ/\mathrm{hr}$, and the extra speed buys a settling time the controller cannot use. The two-to-six rule is not superstition. It is where these two costs cross for most vehicles.

One limit the table does not show: the observer poles must stay well below the sample rate. At $4\,\mathrm{Hz}$ ($T = 0.25\,\mathrm{s}$), a pole much beyond about $2$ to $4\,\mathrm{rad/s}$ means the estimate changes a lot within a single sample. The continuous design then no longer describes the discrete observer you actually fly, and you must design $\mathbf{L}$ in discrete time.
:::

::: warning An observer is not a smoothing knob to tune by feel
It is tempting to treat $\mathbf{L}$ as a smoothing knob and turn it down when the estimate looks noisy. Two things break. First, a slow observer lags the truth. That lag sits inside the control loop as phase loss at crossover and eats the margin you designed for. Second, turn $\mathbf{L}$ down far enough and $\mathbf{A}-\mathbf{L}\mathbf{C}$ heads back toward $\mathbf{A}$. If the plant has an unstable mode, the error matrix inherits it, and the estimation error grows without bound. When noise is the real problem, the principled answer is to choose $\mathbf{L}$ from the noise statistics, not by hand. That is the **[[Kalman filter|kalman-bridge]]**, and it is what the estimation modules of the next tier are for.
:::

## Reduced-order observers

Suppose $\mathbf{C}$ has rank $p$. Then $p$ combinations of the state are measured directly, and only $n-p$ need guessing. A **reduced-order observer** estimates only those, using $n-p$ states of code instead of $n$.

The recipe: split the state as $\mathbf{x} = (\mathbf{x}_a, \mathbf{x}_b)$, with $\mathbf{x}_a = \mathbf{y}$ measured. Write out the two blocks of the dynamics. The $\mathbf{x}_a$ block contains $\mathbf{x}_b$, so it works as an extra measurement of $\mathbf{x}_b$. The result is an $(n-p)$-state observer whose error matrix is $\mathbf{A}_{bb} - \mathbf{L}_r\mathbf{A}_{ab}$, and $\mathbf{L}_r$ is placed by the same duality.

The saving is real on a small processor. But it has a cost that decides most flight designs against it. The reduced-order estimate uses the raw measurement as-is, unfiltered. Sensor noise passes straight into $\hat{\mathbf{x}}_a$, and through the coupling into $\hat{\mathbf{x}}_b$. A full-order observer filters everything, including what you measured. With a noisy star tracker, the full-order form is usually better, even though it is estimating something you already "know".

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
# trace check  = 96.0
```

## Check yourself

::: check
A plant has $\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$ and $\mathbf{C} = (1\ \ 0)$. Find $\mathbf{L}$ placing the observer poles at $-5$ and $-5$, and say what $\hat{x}_2$ is doing physically.
:::

::: answer
First build the error matrix: $\mathbf{A}-\mathbf{L}\mathbf{C} = \begin{pmatrix}-L_1&1\\-L_2&0\end{pmatrix}$, with characteristic polynomial $s^2 + L_1s + L_2$. The poles you want give $(s+5)^2 = s^2 + 10s + 25$. Match coefficients: $\mathbf{L} = (10,\ 25)^\mathsf{T}$.

Physically, $x_1$ is position and $x_2$ is rate. The transfer function from the measurement to $\hat{x}_2$ is $25s/(s+5)^2$: a derivative $s$, followed by a smoothing filter with a double pole at $-5$, a time constant of $1/5 = 0.2\,\mathrm{s}$. So the observer is a filtered differentiator. It drives $\hat{x}_2$ at $25$ units per second for each unit of position innovation. Any rate estimate built from position readings is a differentiator in disguise, which is why its noise grows so much faster than the position estimate's.
:::

::: check
Show that the estimation error is unaffected by the command $\mathbf{u}$, and explain why that is more than an algebraic accident.
:::

::: answer
Subtract the observer equation from the plant equation. The term $\mathbf{B}\mathbf{u}$ appears once in each with opposite sign and cancels, leaving $\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e}$ with no input term.

It is not an accident. The observer knows exactly what command was sent, and applies it to the same model. So the commanded part of the motion is predicted perfectly and never shows up in the innovation. The result: estimation error depends on the observer design and the model quality, not on how the vehicle is being flown. That is what lets the controller and the observer be designed separately. If the observer used a different $\mathbf{B}$, or did not know $\mathbf{u}$, the cancellation would fail and a term $(\mathbf{B}-\hat{\mathbf{B}})\mathbf{u}$ would drive the error. That is the subject of the next lesson.
:::

::: check
A gyro is available as well as a star tracker, so $\mathbf{C} = \mathbf{I}_2$ for the $(\theta,\omega)$ model. Is an observer still worth building?
:::

::: answer
Yes, for two reasons, even though both states are measured and the rank test passes at once.

First, filtering. Both sensors are noisy. The observer blends them with the model, so $\hat{\theta}$ and $\hat{\omega}$ come out less noisy than the raw readings and agree with each other.

Second, and more important on a real vehicle, the state usually needs to grow: a gyro bias state, a disturbance-torque state, a bending-mode amplitude. None of those is measured, and once one is added the observer is doing real estimation again.

What does change with $\mathbf{C} = \mathbf{I}$: a reduced-order observer would have nothing to estimate. And $\mathbf{L}$ becomes a $2\times2$ matrix, four numbers to place two poles — the multi-output freedom of Lesson 6, mirrored.
:::

::: check
An observer is designed with poles ten times faster than the controller. In hardware the estimate is visibly noisy and the wheels chatter. Name two fixes and one non-fix.
:::

::: answer
**Fix 1:** slow the observer to two to four times the controller bandwidth, and accept a longer estimation transient. Rate-estimate noise grows as $r^{3/2}$, so going from $r=10$ to $r=4$ cuts it by $(10/4)^{3/2} \approx 4$.

**Fix 2:** choose $\mathbf{L}$ from the noise statistics instead of by pole placement. That is the Kalman filter, and it gives the best trade possible for the noise you actually have. A third real fix is a better measurement — a better sensor or a faster sample rate moves the whole trade.

**Non-fix:** low-pass filtering the estimate after the observer. That adds phase lag inside the control loop without removing the noise already injected into the states. It also destroys the clean error dynamics that the next lesson's separation argument relies on.
:::

::: check
For the gimbal observer above, the innovation at some instant is $2\,\mathrm{mrad}$. What correction rate does each state receive, and what does the size of $L_3$ tell you about the encoder you need?
:::

::: answer
The correction is $\mathbf{L}(y - \mathbf{C}\hat{\mathbf{x}})$, with innovation $2\times10^{-3}\,\mathrm{rad}$. Multiply each entry:

- $\hat{\theta}$: $45.5\times2\times10^{-3} = 0.091\,\mathrm{rad/s}$;
- $\hat{\omega}$: $-914.75\times2\times10^{-3} = -1.83\,\mathrm{rad/s^2}$;
- $\hat{\tau}$: $43872\times2\times10^{-3} = 87.7\,\mathrm{N\,m/s}$.

The last one slews the torque guess fast enough to cross the motor's whole range in a fraction of a second. So even a few microradians of encoder noise matter: one microradian of rounding makes $43872\times10^{-6} = 0.044\,\mathrm{N\,m/s}$ of jitter in the torque estimate. Either the encoder needs a count well below a microradian, or the observer poles need to come in.
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

You now have a controller that assumes it knows the state, and an observer that supplies a guess. Wiring them together raises a worry: the controller was designed for the true state and is being fed a guess, so surely the poles move. The next lesson shows that on an exact model they do not — and says exactly what "exact" has to mean.

::: context star-tracker How a star tracker works
A star tracker is a small digital camera pointed at the sky, with a catalog of thousands of star positions in its memory. It photographs a patch of sky, finds the bright dots, and matches the pattern of angles between them against the catalog — like recognizing a constellation. Once it knows which stars it is looking at, it can work out the spacecraft's full orientation. Good trackers are accurate to a few arcseconds and update a few to ten times a second. They measure *angle*, not rate — which is why the rate often has to be estimated.
:::

::: context dead-reckoning Dead reckoning, and why it drifts
Sailors called navigating from speed, heading and elapsed time "dead reckoning". Every small error in speed or heading adds up, and with no landmark to check against, the plotted position wanders off. An open-loop model copy is dead reckoning. For the rigid body below, an initial angle error sits there forever, while an observer (poles at $-5$, $-5$) wipes it out in about a second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="30" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="44" y="44" font-size="11" text-anchor="end" fill="#1f2a44">1°</text>
  <text x="44" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="195" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">time, 0 to 2 s</text>
  <line x1="50" y1="40" x2="340" y2="40" stroke="#b4232c" stroke-width="2"/>
  <text x="195" y="32" font-size="11" text-anchor="middle" fill="#b4232c">model copy: error never shrinks</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,40.0 57.2,85.7 64.5,116.6 71.8,137.0 79.0,150.0 86.2,157.9 93.5,162.3 100.8,164.3 108.0,164.9 115.2,164.5 122.5,163.5 129.8,162.3 137.0,161.0 144.2,159.6 151.5,158.3 158.8,157.1 166.0,156.0 173.2,155.1 180.5,154.3 187.8,153.6 195.0,153.0 202.2,152.5 209.5,152.0 216.8,151.7 224.0,151.4 231.2,151.1 238.5,150.9 245.8,150.7 253.0,150.6 260.2,150.5 267.5,150.4 274.8,150.3 282.0,150.3 289.2,150.2 296.5,150.2 303.8,150.1 311.0,150.1 318.2,150.1 325.5,150.1 332.8,150.1 340.0,150.0"/>
  <text x="200" y="130" font-size="11" text-anchor="middle" fill="#1d6fd1">observer: error dies out</text>
</svg>
```
:::

::: context innovation-word Why "innovation"
In everyday English an innovation is something new. In estimation it means the same thing: the part of a fresh measurement that the model did not already predict. If the model predicted the reading exactly, the measurement brought no news and the innovation is zero. Kalman-filter engineers watch innovations in flight telemetry closely. A good filter's innovations look like small, patternless noise. A steady drift or a pattern in them is the first sign that the model is wrong.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="90" y="25" width="100" height="40" rx="4"/>
    <rect x="90" y="100" width="100" height="40" rx="4"/>
    <rect x="215" y="152" width="40" height="24" rx="4"/>
    <circle cx="300" cy="120" r="11"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="140" y="50">real vehicle</text>
    <text x="140" y="125">model copy</text>
    <text x="235" y="169">L</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <polyline points="10,45 84,45"/>
    <polyline points="50,45 50,120 84,120"/>
    <polyline points="190,45 300,45 300,103"/>
    <polyline points="190,120 283,120"/>
    <polyline points="300,131 300,164 261,164"/>
    <polyline points="215,164 140,164 140,146"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="90,45 83,41 83,49"/>
    <polygon points="90,120 83,116 83,124"/>
    <polygon points="300,109 296,102 304,102"/>
    <polygon points="289,120 282,116 282,124"/>
    <polygon points="255,164 262,160 262,168"/>
    <polygon points="140,140 136,147 144,147"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="14" y="38">u</text>
    <text x="240" y="38">y (sensors)</text>
    <text x="222" y="113">C x̂</text>
    <text x="306" y="104">+</text>
    <text x="276" y="113">−</text>
    <text x="294" y="148" text-anchor="end">innovation</text>
  </g>
</svg>
```
:::

::: context luenberger Who Luenberger is
David Luenberger worked out this observer in his doctoral research at Stanford, published in 1964 as "Observing the state of a linear system". Before that, state-feedback designs had an awkward gap: they assumed every state could be measured. His idea — run a model and correct it with the output error — closed that gap for deterministic systems. Kalman's filter, a few years earlier, answered the same question when the noise is random, and picks $\mathbf{L}$ from the noise statistics instead of from chosen poles.
:::

::: context same-eigenvalues Why a transpose keeps the eigenvalues
The eigenvalues of $\mathbf{M}$ are the roots of $\det(s\mathbf{I} - \mathbf{M}) = 0$. A determinant does not change when you flip a matrix across its diagonal, and $\mathbf{I}$ is its own transpose. So

$$\det(s\mathbf{I} - \mathbf{M}^\mathsf{T}) = \det\left((s\mathbf{I} - \mathbf{M})^\mathsf{T}\right) = \det(s\mathbf{I} - \mathbf{M}).$$

Same polynomial, same roots. The eigen*vectors* do change, but pole placement only cares about the eigenvalues. That one-line fact is the whole reason observer design costs nothing new.
:::

::: context encoder What an encoder is
An encoder measures how far a shaft has turned. An optical encoder shines light through a disk ringed with thousands of fine slots and counts the flashes as the disk turns. Its **resolution** is the angle of one count. A disk with $2^{20}$ counts per turn (about a million) resolves $2\pi/2^{20} \approx 6\,\mu\mathrm{rad}$ per count. The reading is always rounded to a whole count, and that rounding acts like a small noise on every measurement — noise the observer gain then multiplies.
:::

::: context arcsecond How small an arcsecond is
A degree is split into $60$ arcminutes, and each arcminute into $60$ arcseconds, written $''$. So one arcsecond is $1/3600$ of a degree, or $4.85\,\mu\mathrm{rad}$. That is the angle a US quarter (about $24\,\mathrm{mm}$ across) fills when seen from $5\,\mathrm{km}$ away. A handy unit fact for the table: one arcsecond per second is the same as one degree per hour, since both are $1/3600$ of a degree per second.
:::

::: context noise-scaling Two costs on one chart
The table's noise, scaled so that $r = 1$ is $1$, on log axes. Straight lines on a log-log chart are power laws: the angle noise climbs with slope $1/2$, the rate noise with slope $3/2$. By $r = 10$ the rate estimate is $32$ times noisier; the angle estimate only $3.2$ times.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="20" x2="60" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="60" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="54" y="174">1</text><text x="54" y="132">3</text><text x="54" y="87">10</text><text x="54" y="45">30</text>
  </g>
  <g stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3">
    <line x1="60" y1="128.3" x2="340" y2="128.3"/><line x1="60" y1="82.6" x2="340" y2="82.6"/><line x1="60" y1="40.9" x2="340" y2="40.9"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="186">1</text><text x="141.3" y="186">2</text><text x="222.6" y="186">4</text><text x="330" y="186">10</text>
    <text x="200" y="198">speed ratio r</text>
  </g>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="60,170 141.3,130.5 222.6,91.1 330,38.9"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="60,170 141.3,156.8 222.6,143.7 330,126.3"/>
  <g fill="#b4232c"><circle cx="60" cy="170" r="3"/><circle cx="141.3" cy="130.5" r="3"/><circle cx="222.6" cy="91.1" r="3"/><circle cx="330" cy="38.9" r="3"/></g>
  <g fill="#1d6fd1"><circle cx="141.3" cy="156.8" r="3"/><circle cx="222.6" cy="143.7" r="3"/><circle cx="330" cy="126.3" r="3"/></g>
  <text x="200" y="62" font-size="11" fill="#b4232c">rate noise, slope 3/2</text>
  <text x="250" y="150" font-size="11" fill="#1d6fd1">angle noise, slope 1/2</text>
</svg>
```
:::

::: context kalman-bridge Where L comes from next
Pole placement asks you to pick where the observer poles go, then accept whatever noise results. The Kalman filter turns the question around. You describe how noisy the sensors are and how much the model can be trusted, and it computes the $\mathbf{L}$ that makes the estimate's spread as small as possible. Its structure is exactly the Luenberger observer of this lesson — model copy plus gain times innovation. Only the recipe for $\mathbf{L}$ changes. You will build one in the estimation tier.
:::
