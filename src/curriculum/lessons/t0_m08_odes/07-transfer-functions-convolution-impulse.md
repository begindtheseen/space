---
id: l07-transfer-functions-convolution-impulse
title: Transfer functions, impulse response and convolution
minutes: 24
covers:
  - transfer functions
  - convolution and impulse response
---

Clap your hands once in an empty church. You hear the clap, then a long, fading echo as the sound bounces around the stone. That echo is the building's answer to one short, sharp input. Now imagine a choir singing in the same church. Every instant of their song gets its own little echo, and what reaches your ears is all those echoes piled on top of each other. If you know how the church answers a single clap, you can work out how it will sound for *any* song.

That is this lesson in one picture. The building's answer to a clap is the **impulse response**. Piling up the echoes of every instant of the input is **convolution**. And the tidy algebraic label that sums up the whole building — a ratio of two polynomials in $s$ — is the **transfer function**. In lesson 6 you saw this label appear on its own: in every zero-state answer, the output's transform was the input's transform multiplied by a fixed ratio that depended only on the system.

From here to the end of the control track, the transfer function is how engineers describe anything linear: a rigid vehicle, an actuator, a rate gyro, a filter, the controller itself. A block diagram is a picture of transfer functions. Closing a feedback loop is algebra on them. The poles you read $\zeta$ and $\omega_n$ from are the roots of a transfer function's bottom line.

## The transfer function

Think of a machine with a label on the side saying how it changes whatever you feed it. The label belongs to the machine, not to what you feed it. The transfer function is that label for a dynamic system.

Take a **[[linear, time-invariant|lti-meaning]]** system — LTI for short — with input $u(t)$ and output $y(t)$. Linear means the effects of two inputs add. Time-invariant means the system behaves the same today as tomorrow. Suppose it is at rest before the input starts, so every initial condition is zero. Its equation looks like

$$
a_n y^{(n)} + \cdots + a_1\dot{y} + a_0 y = b_m u^{(m)} + \cdots + b_1\dot{u} + b_0 u .
$$

($y^{(n)}$ is read "y, n-th derivative".) Transform both sides. With the initial-condition terms all zero, lesson 6's derivative rule becomes plain "each $\frac{d}{dt}$ turns into a factor $s$". So the equation becomes

$$
(a_ns^n + \cdots + a_0)\,Y(s) = (b_ms^m + \cdots + b_0)\,U(s).
$$

Divide to get the **transfer function** — the output's transform over the input's transform:

$$
G(s) = \frac{Y(s)}{U(s)} = \frac{b_ms^m + \cdots + b_1s + b_0}{a_ns^n + \cdots + a_1s + a_0} = \frac{N(s)}{D(s)} .
$$

Read $G(s)$ as "G of s". $N(s)$ is the numerator polynomial (top) and $D(s)$ the denominator polynomial (bottom). The input has been divided out, so $G$ belongs to the system alone. The zero-state response to any input is then one multiplication, $Y(s) = G(s)U(s)$, followed by the partial-fraction inversion of lesson 6.

A few words come with it.

- The **order** is $n$, the degree of $D(s)$. It equals the number of states, or the number of initial conditions you would need.
- The **[[poles|pole-name]]** are the roots of $D(s)$ — the values of $s$ where $G$ blows up. They are the characteristic roots of lesson 2 and the eigenvalues of $\mathbf{A}$ from lesson 4. Each pole $p$ puts a mode $e^{pt}$ into every response.
- The **zeros** are the roots of $N(s)$ — the values of $s$ at which the system passes nothing. A zero at $s = z$ means an input shaped like $e^{zt}$ produces no steady output of that shape. Zeros shape the response and can move a step response's peak, but they do not decide stability.
- The **steady-state gain** (or DC gain) is $G(0) = b_0/a_0$ — output over input for a constant input, once things settle, provided the system is stable. It is what the final value theorem returns for a unit step: $\lim_{s \to 0} s \cdot G(s)/s = G(0)$.
- $G$ is **proper** when $m \le n$ (top degree no bigger than bottom degree) and **strictly proper** when $m < n$. Real physical systems are **[[strictly proper, or at worst proper|why-proper]]**.

The transfer function only exists for LTI systems. A nonlinear equation like $\ddot{\theta} + \sin\theta = u$ does not transform into a ratio of polynomials. A time-varying one has coefficients that will not come out of the integral. Engineers get one anyway by **[[linearizing|linearizing-flight]]** the vehicle about an operating point — that is what "the pitch transfer function at Mach 0.8" means.

::: key Transfer function
$G(s) = Y(s)/U(s)$ with all initial conditions zero — the Laplace transform of the impulse response. It only exists for LTI systems. Poles are the roots of the denominator (the system's characteristic roots), zeros the roots of the numerator, and $G(0)$ is the steady-state gain. Zero-state response to any input: $Y(s) = G(s)U(s)$.
:::

### The standard forms

Here are the systems of this module written as transfer functions.

| System | ODE | $G(s)$ | Poles |
| --- | --- | --- | --- |
| Integrator | $\dot{y} = u$ | $1/s$ | $0$ |
| First-order lag | $\tau\dot{y} + y = u$ | $\dfrac{1}{\tau s + 1}$ | $-1/\tau$ |
| Rigid body (double integrator) | $I\ddot{\theta} = T$ | $\dfrac{1}{Is^2}$ | $0, 0$ |
| Canonical second order | $\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2y = \omega_n^2u$ | $\dfrac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$ | $-\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}$ |
| PD controller | $T = K_p e + K_d\dot{e}$ | $K_ds + K_p$ | none (zero at $-K_p/K_d$) |

The first-order lag ($\tau$ is "tau", the time constant) is also written $a/(s + a)$ with $a = 1/\tau$. The two forms are the same thing. The thrust-vector-control (TVC) actuator of lesson 3 is $G(s) = 1600/(s^2 + 48s + 1600)$. Matching its bottom line to the canonical form, $2\zeta\omega_n = 48$ and $\omega_n^2 = 1600$, is now the fastest route to $\omega_n = 40\,\mathrm{rad/s}$ and $\zeta = 0.6$.

::: key Canonical second-order system
$\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2y = \omega_n^2u$, with transfer function $G(s) = \dfrac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$ and poles $s = -\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}$.
:::

::: warning The transfer function forgets the starting state
$Y(s) = G(s)U(s)$ is the *zero-state* response only. If the system starts with nonzero initial conditions, the zero-input terms are missing. They have the same denominator $D(s)$ but a numerator built from the initial conditions (lesson 6). The poles are the same either way; only the residues change. Never try to "add the initial conditions into $U$". Transform the full ODE instead.
:::

## From state space to transfer function

Lesson 4 wrote the same systems as $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$, $y = \mathbf{C}\mathbf{x} + Du$. Transform both equations with $\mathbf{x}(0) = \mathbf{0}$, using the derivative rule on each entry:

$$
s\mathbf{X}(s) = \mathbf{A}\mathbf{X}(s) + \mathbf{B}U(s) \quad\Longrightarrow\quad (s\mathbf{I} - \mathbf{A})\mathbf{X} = \mathbf{B}U \quad\Longrightarrow\quad \mathbf{X} = (s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B}\,U .
$$

Put this $\mathbf{X}$ into the output equation:

$$
G(s) = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B} + D .
$$

The inverse of $s\mathbf{I} - \mathbf{A}$ is its adjugate divided by its determinant. So the denominator of $G$ is $\det(s\mathbf{I} - \mathbf{A})$, and **the poles are the eigenvalues of $\mathbf{A}$**, as lesson 4 promised. (The one exception is when a zero cancels a pole exactly; the control track handles that under controllability and observability.)

For the $2 \times 2$ companion form, $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -a_0 & -a_1 \end{bmatrix}$, $\mathbf{B} = [0, b]^T$, $\mathbf{C} = [1, 0]$:

$$
(s\mathbf{I} - \mathbf{A})^{-1} = \frac{1}{s^2 + a_1s + a_0}\begin{bmatrix} s + a_1 & 1 \\ -a_0 & s \end{bmatrix}, \qquad G(s) = \frac{1}{s^2 + a_1s + a_0}\begin{bmatrix} 1 & 0 \end{bmatrix}\begin{bmatrix} b \\ bs \end{bmatrix} = \frac{b}{s^2 + a_1s + a_0} .
$$

For the pitch-rate model of lesson 4, $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -6.25 & -3 \end{bmatrix}$ and $\mathbf{B} = [0, 6.25]^T$, this gives $G = 6.25/(s^2 + 3s + 6.25)$, with poles $-1.5 \pm 2j$. Both descriptions carry the same poles. State space keeps the internal variables; the transfer function keeps only the path from input to output.

## Block algebra

Because $Y = GU$ is a multiplication, systems wired together combine by ordinary algebra. Three rules cover every **[[block diagram|block-diagram]]**.

**Series.** If $u$ drives $G_1$ and its output drives $G_2$, then $Y = G_2(G_1U)$. The overall transfer function is the product $G_2G_1$, in either order for single-input systems. An actuator feeding a plant is $G_{\mathrm{plant}}G_{\mathrm{act}}$, and its poles are the two sets of poles together.

**Parallel.** If $u$ drives $G_1$ and $G_2$ side by side and their outputs are added, the result is $G_1 + G_2$. A PD controller is a gain $K_p$ in parallel with a differentiator $K_ds$.

**Feedback.** This is the thermostat rule: measure what you got, compare it with what you wanted, act on the difference. Let the forward path $G(s)$ take an error signal $e$ to the output $y$. Feed the output back through a sensor $H(s)$ and form $e = r - Hy$, where $r$ is the reference (the command). Then

$$
Y = GE = G(R - HY) \quad\Longrightarrow\quad (1 + GH)Y = GR \quad\Longrightarrow\quad \frac{Y}{R} = \frac{G}{1 + GH} .
$$

In words: substitute the error, gather the $Y$ terms, divide.

The closed-loop poles are the roots of $1 + G(s)H(s) = 0$, the **characteristic equation** of the loop. They are *not* the poles of $G$ or of $H$. Feedback moves the poles — which is the whole point of control. With $H = 1$ (**unity feedback**, the output measured directly), the formula is $G/(1 + G)$. If $G = N/D$, multiply top and bottom by $D$: $G/(1 + G) = N/(D + N)$. The closed-loop bottom line is the open-loop bottom line plus the open-loop top line.

::: key Block algebra
Series: $G_2G_1$. Parallel: $G_1 + G_2$. Negative feedback with forward path $G$ and feedback path $H$: $Y/R = G/(1 + GH)$; closed-loop poles solve $1 + GH = 0$. For $G = N/D$ and unity feedback the closed-loop transfer function is $N/(D + N)$.
:::

::: example Closing a pitch-rate loop
An airframe's pitch rate $q$ responds to elevator deflection $\delta$ roughly as a first-order lag, $P(s) = 20/(s + 1)$ in $(\mathrm{rad/s})/\mathrm{rad}$. A $1\,\mathrm{rad}$ elevator step eventually gives $20\,\mathrm{rad/s}$ of pitch rate, with a $1\,\mathrm{s}$ time constant. The elevator actuator is a lag with $\tau = 0.05\,\mathrm{s}$, $A(s) = 1/(0.05s + 1)$. A rate gyro measures $q$ directly ($H = 1$). A proportional controller commands $\delta = K(q_c - q)$ with $K = 0.5\,\mathrm{rad}/(\mathrm{rad/s})$.

**Forward path.** Series product: $G = KAP = 0.5 \cdot 20/((s + 1)(0.05s + 1)) = 10/((s + 1)(0.05s + 1))$. Its open-loop poles are $-1$ and $-20$.

**Close the loop.** Use $N/(D + N)$, then divide top and bottom by $0.05$:

$$
\frac{Q}{Q_c} = \frac{10}{(s + 1)(0.05s + 1) + 10} = \frac{10}{0.05s^2 + 1.05s + 11} = \frac{200}{s^2 + 21s + 220} .
$$

**Read the bottom line.** $\omega_n = \sqrt{220} = 14.8\,\mathrm{rad/s}$ and $\zeta = 21/(2 \times 14.8) = 0.708$. The poles are $-10.5 \pm 10.5j$. Feedback has moved two real poles at $-1$ and $-20$ into a complex pair with almost exactly the **[[Butterworth|butterworth]]** damping $\zeta \approx 0.707$. That means about 4.3% overshoot, and a 2% settling time of $4/10.5 = 0.38\,\mathrm{s}$, against $4\,\mathrm{s}$ for the bare airframe. Ten times faster.

**Steady-state gain.** $G_{\mathrm{cl}}(0) = 200/220 = 0.909$. A commanded $1\,\mathrm{rad/s}$ gives $0.909\,\mathrm{rad/s}$ — a 9% standing error that a proportional loop cannot remove. (Integral action, in the control track, will.)

**Change the gain.** $K = 0.2$ makes the forward gain $4$ and the bottom line $s^2 + 21s + 100$: real poles at $-7.3$ and $-13.7$. $K = 1.0$ gives $s^2 + 21s + 420$: poles $-10.5 \pm 17.6j$, $\zeta = 0.51$. The real part stays at $-10.5$ because the $s$ coefficient does not depend on $K$. As the gain rises the poles slide along a vertical line — the beginning of a root locus.
:::

::: note The PD satellite, as block algebra
Lesson 2's PD satellite is the same algebra with a second-order plant. Plant $1/(Is^2)$ with $I = 50\,\mathrm{kg\,m^2}$, controller $K_ds + K_p = 40s + 20$ in the forward path, unity feedback. The closed loop is $(40s + 20)/(50s^2 + 40s + 20) = (0.8s + 0.4)/(s^2 + 0.8s + 0.4)$: poles $-0.4 \pm 0.490j$ as before, plus a zero at $s = -0.5$ from the controller.

Put the wheel lag $1/(0.05s + 1)$ in series and the bottom line becomes $50s^2(0.05s + 1) + 40s + 20 = 2.5s^3 + 50s^2 + 40s + 20$. Divided by $2.5$, that is $s^3 + 20s^2 + 16s + 8$ — lesson 4's characteristic polynomial, with roots $-19.2$ and $-0.406 \pm 0.502j$.
:::

## The impulse response

Now the time-domain face of $G(s)$ — the clap in the church.

Drive the system, at rest, with the **[[unit impulse|impulse-spike]]** $\delta(t)$ of lesson 6 (read "delta of t"; not the elevator angle): an idealized kick with area $1$ and zero duration. Its transform is $\mathcal{L}\{\delta\} = 1$, so the output's transform is $Y = G \cdot 1 = G(s)$. The **impulse response** — the output after that single kick — is therefore

$$
h(t) = \mathcal{L}^{-1}\{G(s)\} ,
$$

and the other way round, $G(s) = \mathcal{L}\{h(t)\}$. The transfer function *is* the transform of the impulse response. That is the definition on the module's flashcard.

In practice an impulse is any input much shorter than the system's fastest time constant: a **[[hammer tap|hammer-test]]** on a structure, one thruster pulse on a spacecraft, a $20\,\mathrm{ms}$ nozzle twitch against a $400\,\mathrm{ms}$ bending period. The response to such a pulse of area $\alpha$ ("alpha") is $\alpha h(t)$, whatever the pulse's exact shape.

For the standard forms, read $h$ straight off lesson 6's table:

- First-order lag $a/(s + a)$: $h(t) = ae^{-at}$. A kick of area $\alpha$ makes the output jump at once to $\alpha a$, then decay with time constant $1/a$. The jump is finite because the lag is strictly proper by exactly one degree.
- Integrator $1/s$: $h = 1$, a unit step. One kick of velocity leaves a body displaced forever.
- Double integrator $1/(Is^2)$: $h = t/I$. A torque impulse $\alpha$ leaves a rigid body turning at the steady rate $\alpha/I$.
- Canonical second order: complete the square to get $\omega_n^2/((s + \zeta\omega_n)^2 + \omega_d^2)$, where $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ is the damped frequency. Match it to the damped sine in the table:

$$
h(t) = \frac{\omega_n^2}{\omega_d}\,e^{-\zeta\omega_n t}\sin\omega_d t = \frac{\omega_n}{\sqrt{1 - \zeta^2}}\,e^{-\zeta\omega_n t}\sin\omega_d t .
$$

It starts at zero, because a second-order system reaches its output through two integrations and cannot jump. It rises to a peak, then rings at $\omega_d$ inside the fading envelope $e^{-\zeta\omega_n t}$. Its total area from zero to infinity is $G(0) = 1$.

The impulse response is also the **slope of the step response**. A step is the running total of an impulse, and in transforms the step response is $G(s) \cdot \frac{1}{s}$ — the impulse response divided by $s$, which means integrated in time. That is why lesson 3's step-response slope, $\dot{y} = (\omega_n^2/\omega_d)e^{-\sigma t}\sin\omega_d t$ with $\sigma = \zeta\omega_n$, is exactly the $h(t)$ above. It is also why the step response peaks where $h$ first crosses zero, at $t_p = \pi/\omega_d$: a peak is where the slope is zero.

::: key Impulse response
$h(t) = \mathcal{L}^{-1}\{G(s)\}$; equivalently $G(s) = \mathcal{L}\{h(t)\}$. Step response $= \int_0^t h$, so $h$ is the slope of the step response. Canonical second order: $h(t) = \dfrac{\omega_n}{\sqrt{1 - \zeta^2}}e^{-\zeta\omega_n t}\sin\omega_d t$. First-order lag $a/(s + a)$: $h = ae^{-at}$. In state space, $h(t) = \mathbf{C}e^{\mathbf{A}t}\mathbf{B}$.
:::

::: example Impulse response of the TVC actuator
Take $G(s) = 1600/(s^2 + 48s + 1600)$: $\omega_n = 40\,\mathrm{rad/s}$, $\zeta = 0.6$, so $\zeta\omega_n = 24\,\mathrm{s^{-1}}$ and $\omega_d = 40\sqrt{1 - 0.36} = 32\,\mathrm{rad/s}$.

**The formula.**

$$
h(t) = \frac{1600}{32}e^{-24t}\sin 32t = 50\,e^{-24t}\sin 32t \quad \mathrm{s^{-1}} .
$$

The units are $\mathrm{s^{-1}}$. An impulse of nozzle-angle command has units of degree-seconds, and the output is in degrees, so $h$ must be degrees per degree-second.

**The peak.** Set $\dot{h} = 0$: $50e^{-24t}(32\cos 32t - 24\sin 32t) = 0$, so $\tan 32t = 32/24 = 4/3$. That gives $t = \arctan(4/3)/32 = 0.029\,\mathrm{s}$. There $\sin 32t = 0.8$ and $e^{-24t} = e^{-0.695}$, so $h = 50 \times e^{-0.695} \times 0.8 = 20.0\,\mathrm{s^{-1}}$.

**The first zero** is at $\pi/32 = 0.098\,\mathrm{s}$ — the step response's peak time, as promised. Integrating $h$ numerically from $0$ to $1\,\mathrm{s}$ gives $1.0000$, the steady-state gain.

**A real pulse.** A command of $2^\circ$ lasting $5\,\mathrm{ms}$ is short against the $1/24 = 42\,\mathrm{ms}$ envelope, so it counts as an impulse. Its area is $2 \times 0.005 = 0.01\,\mathrm{deg\,s}$. The nozzle's excursion peaks at $0.01 \times 20.0 = 0.20^\circ$, then rings down within $4/24 = 0.17\,\mathrm{s}$.

Sanity check: a $2^\circ$ command that lasts only an eighth of the envelope time moves the nozzle a tenth as far. Brief pushes do little, as they should.
:::

## Convolution

Take any input $u(t)$ and slice it, like a loaf of bread, into thin slices of width $d\tau$. The slice at time $\tau$ ("tau") has area $u(\tau)\,d\tau$. If the slice is thin compared with the system's time constants, it acts like an impulse of that area, fired at time $\tau$.

Now use the two LTI properties, one at a time.

- **Time-invariance:** the response to an impulse fired at $\tau$ is the ordinary impulse response, started late. At a later time $t$ it has been running for $t - \tau$ seconds, so this slice contributes $u(\tau)\,d\tau\;h(t - \tau)$.
- **Linearity:** the total output is the sum of every slice's contribution, over all slices before $t$.

Summing thin slices is integrating:

$$
y(t) = \int_0^t h(t - \tau)\,u(\tau)\,d\tau = \int_0^t h(\tau)\,u(t - \tau)\,d\tau \equiv (h * u)(t) .
$$

This is the **convolution integral**. Read $h * u$ as "h convolved with u"; the star is not multiplication. The second form comes from renaming $\tau \to t - \tau$, and it shows that the order does not matter: $h * u = u * h$.

The two forms tell the same story two ways. The first says: every past input, weighted by how much of it the system still remembers. The second says: $h(\tau)$ is **[[the weight the system gives|memory-weight]]** to the input from $\tau$ seconds ago. A first-order lag, with $h(\tau) = ae^{-a\tau}$, weights the recent past heavily and forgets older input exponentially. An integrator, with $h = 1$, weights all past input equally — it never forgets.

You have met this integral before. Lesson 4's forced solution was

$$
\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t - \tau)}\mathbf{B}u(\tau)\,d\tau .
$$

Its zero-state part is the convolution of $u$ with $e^{\mathbf{A}t}\mathbf{B}$. Multiply by $\mathbf{C}$ and the impulse response of a state-space system appears: $h(t) = \mathbf{C}e^{\mathbf{A}t}\mathbf{B}$. Its transform, $\mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B}$, is the transfer function found earlier. So $\mathcal{L}\{e^{\mathbf{A}t}\} = (s\mathbf{I} - \mathbf{A})^{-1}$: the matrix called the **resolvent** is the transform of the state transition matrix.

### Convolution in time is multiplication in $s$

Here is the payoff. Convolving in time — a sliding, weighted sum — becomes plain multiplication in the $s$-domain:

$$
\mathcal{L}\{h * u\} = H(s)U(s) .
$$

So the two descriptions of the zero-state response agree: $Y(s) = G(s)U(s)$ in the transform domain *is* $y = h * u$ in time. The series rule $G_2G_1$ also says that the impulse response of two systems in a chain is $h_2 * h_1$. In practice you convolve numerically — a simulation does nothing else — and multiply by hand. The theorem guarantees the two agree.

::: note Why it has to be true
Write out the transform of the convolution. Treat $u$ and $h$ as zero for negative arguments, so the inner integral can run to infinity without changing anything. Then swap the order of integration:

$$
\mathcal{L}\{h * u\} = \int_0^\infty e^{-st}\int_0^\infty h(t - \tau)u(\tau)\,d\tau\,dt = \int_0^\infty u(\tau)\left[\int_0^\infty h(t - \tau)e^{-st}\,dt\right]d\tau .
$$

In the bracket, substitute $\eta = t - \tau$ (read "eta"), remembering $h(\eta) = 0$ for $\eta < 0$. Since $e^{-st} = e^{-s\tau}e^{-s\eta}$, the bracket becomes $e^{-s\tau}\int_0^\infty h(\eta)e^{-s\eta}d\eta = e^{-s\tau}H(s)$. The outer integral is then $H(s)\int_0^\infty u(\tau)e^{-s\tau}d\tau = H(s)U(s)$.
:::

::: key Convolution
$y(t) = (h * u)(t) = \int_0^t h(\tau)u(t - \tau)\,d\tau = \int_0^t h(t - \tau)u(\tau)\,d\tau$. It is the zero-state response to any input, and it transforms to $Y(s) = H(s)U(s)$: multiplication in the $s$-domain is convolution in time. Its state-space form is $\int_0^t \mathbf{C}e^{\mathbf{A}(t - \tau)}\mathbf{B}u(\tau)\,d\tau$.
:::

::: example Convolving a lag with a step, and a booster mode with a pulse
**A lag and a step.** Take the lag $a/(s + a)$, so $h = ae^{-a\tau}$, driven by a unit step from rest. Use the second form of the integral. For $\tau \le t$ the step gives $u(t - \tau) = 1$, so

$$
y(t) = \int_0^t ae^{-a\tau}\,d\tau = \Big[-e^{-a\tau}\Big]_0^t = 1 - e^{-at} .
$$

That is lesson 1's step response, found without an integrating factor. With $a = 20\,\mathrm{s^{-1}}$: $y(0.05) = 0.632$, $y(0.1) = 0.865$, $y(0.2) = 0.982$. It climbs toward $1$ without passing it, as a lag should.

**A lag and a ramp.** For a unit ramp, $u(t - \tau) = t - \tau$, and the integral gives $t - \tau_a + \tau_ae^{-t/\tau_a}$ with $\tau_a = 1/a$. At $t = 0.1\,\mathrm{s}$ with $\tau_a = 0.05\,\mathrm{s}$ that is $0.1 - 0.05 + 0.05e^{-2} = 0.0568$. A numerical convolution with $10^5$ slices reproduces it to nine digits.

**A booster bending mode and a pulse.** Take the bending mode of lessons 3 and 5: $\omega_n = 15.7\,\mathrm{rad/s}$, $\zeta = 0.005$, so $\omega_d \approx \omega_n$. Scale the input so that a steady $u = 1$ bends the mode $1\,\mathrm{mm}$. A thrust-vector transient applies $u = 1$ for $20\,\mathrm{ms}$, one twentieth of the $400\,\mathrm{ms}$ period, so treat it as an impulse of area $0.02\,\mathrm{s}$.

Then $y \approx 0.02\,h(t)$ with $h = (\omega_n^2/\omega_d)e^{-\sigma t}\sin\omega_d t$ and $\omega_n^2/\omega_d = 15.71\,\mathrm{s^{-1}}$. The mode rings with amplitude $0.02 \times 15.71 = 0.314\,\mathrm{mm}$ — a third of the static bend, from a pulse one twentieth of a period long. It first peaks a quarter period ($0.1\,\mathrm{s}$) after the pulse and decays with time constant $1/(\zeta\omega_n) = 12.7\,\mathrm{s}$.

Integrating the exact equation with the rectangular pulse gives $0.310\,\mathrm{mm}$. The 1% difference is the pulse's finite width, and it shrinks as the pulse gets shorter. Against lesson 5's $100\,\mathrm{mm}$ at sustained resonance, one short pulse is harmless. The convolution integral says how a *train* of such pulses adds up.
:::

::: warning Only the past counts
The convolution integral runs only over $0 \le \tau \le t$. A **[[causal|causal]]** system cannot respond to input that has not happened yet, and the input is taken as zero before $t = 0$. In a numerical convolution this means summing $h[k]\,u[n - k]$ for $k$ from $0$ to $n$ only. Summing over all $k$ with a wrap-around, as a fast Fourier transform routine does by default, is **circular convolution**, and it gives the wrong transient.
:::

The same idea in a few lines of Python. It convolves the TVC actuator's impulse response with a unit step, slice by slice, and compares the result with the exact step response.

```python
import math

# Impulse response of the TVC actuator G(s) = 1600 / (s^2 + 48 s + 1600),
# convolved numerically with a unit step, against the closed-form step response.
def h(t):
    return 50.0 * math.exp(-24.0 * t) * math.sin(32.0 * t)

def step_closed(t):
    return 1.0 - math.exp(-24.0 * t) * (math.cos(32.0 * t) + 0.75 * math.sin(32.0 * t))

dt = 1e-5
for t in (0.05, math.pi / 32, 0.3):
    n = int(round(t / dt))
    # y(t) = integral_0^t h(tau) u(t - tau) dtau with u = 1: midpoint rule
    y = sum(h((k + 0.5) * dt) for k in range(n)) * dt
    print(f"{t:.3f}  {y:.5f}  {step_closed(t):.5f}")
# 0.050  0.78300  0.78300
# 0.098  1.09478  1.09478
# 0.300  1.00083  1.00083
```

The middle row is the peak time $\pi/32$, and $1.09478$ is the step response's 9.5% overshoot — the value lesson 3's formula gives for $\zeta = 0.6$.

## Check yourself

::: check
A system obeys $\ddot{y} + 6\dot{y} + 25y = \dot{u} + 2u$. Write its transfer function, list its poles and zeros, give $\zeta$, $\omega_n$ and the steady-state gain, and say whether it is strictly proper.
:::

::: answer
With zero initial conditions, each derivative becomes a factor $s$: $(s^2 + 6s + 25)Y = (s + 2)U$. So $G(s) = (s + 2)/(s^2 + 6s + 25)$.

Poles: $s = \frac{-6 \pm \sqrt{36 - 100}}{2} = -3 \pm 4j$. Then $\omega_n = \sqrt{25} = 5\,\mathrm{rad/s}$ and $\zeta = 6/(2 \times 5) = 0.6$. One zero, at $s = -2$. Steady-state gain $G(0) = 2/25 = 0.08$.

The top has degree 1 and the bottom degree 2, so $G$ is strictly proper. The impulse response starts at a finite value — here $h(0^+) = \lim_{s \to \infty} sG(s) = 1$ by the initial value theorem — and the step response starts at zero.
:::

::: check
Two first-order lags with time constants $0.05\,\mathrm{s}$ and $0.2\,\mathrm{s}$ are connected in series. What is the overall transfer function, what are its poles, and what is its impulse response?
:::

::: answer
Series means multiply: $G = \dfrac{1}{(0.05s + 1)(0.2s + 1)}$. Multiply top and bottom by $20 \times 5 = 100$ to get $G = \dfrac{100}{(s + 20)(s + 5)}$, with poles at $-20$ and $-5$.

Partial fractions by cover-up: at $s = -5$ the other factor is $15$, giving $100/15 = 20/3$; at $s = -20$ it is $-15$, giving $-20/3$. So $G = \frac{20/3}{s + 5} - \frac{20/3}{s + 20}$ and

$$
h(t) = \tfrac{20}{3}\bigl(e^{-5t} - e^{-20t}\bigr).
$$

It starts at zero — two lags in a row cannot jump — and it is also $h_1 * h_2$ with $h_1 = 20e^{-20t}$ and $h_2 = 5e^{-5t}$.
:::

::: check
A plant $P(s) = 4/(s(s + 2))$ is placed under unity feedback with a proportional gain $K$. For what $K$ are the closed-loop poles critically damped, and where are they for $K = 2$?
:::

::: answer
Forward path $G = 4K/(s(s + 2))$. With $N/(D + N)$ the closed loop is $4K/(s^2 + 2s + 4K)$.

Match to $s^2 + 2\zeta\omega_n s + \omega_n^2$: $\omega_n = 2\sqrt{K}$ and $2\zeta\omega_n = 2$, so $\zeta = 1/(2\sqrt{K})$. Critical damping, $\zeta = 1$, needs $K = 1/4$, with a double pole at $-1$.

For $K = 2$: $s^2 + 2s + 8$, poles $-1 \pm j\sqrt{7} = -1 \pm 2.65j$, $\omega_n = 2.83\,\mathrm{rad/s}$, $\zeta = 0.354$. For every $K > 1/4$ the real part stays at $-1$; raising the gain only speeds up the ringing and lowers the damping.
:::

::: check
A rigid spacecraft with $I = 50\,\mathrm{kg\,m^2}$ receives a thruster torque pulse of $5\,\mathrm{N\,m}$ lasting $0.1\,\mathrm{s}$. Using the impulse response, what is its turn rate afterwards, and what is its attitude $10\,\mathrm{s}$ after the pulse?
:::

::: answer
From torque to attitude the transfer function is $1/(Is^2)$, with impulse response $h = t/I$. The pulse's area (the angular impulse) is $\alpha = 5 \times 0.1 = 0.5\,\mathrm{N\,m\,s}$. It is short compared with any timescale we care about, so

$$
\theta(t) \approx \alpha h(t) = \frac{0.5\,t}{50} = 0.01\,t\ \mathrm{rad}.
$$

The rate is the slope, $0.01\,\mathrm{rad/s}$ (the same as $\alpha/I$). At $t = 10\,\mathrm{s}$ the attitude is $0.1\,\mathrm{rad}$, about $5.7^\circ$.

The exact convolution with the rectangular pulse differs only by the pulse's half-width of $0.05\,\mathrm{s}$: $\theta(10) = 0.01 \times 9.95 = 0.0995\,\mathrm{rad}$.
:::

::: check
Use the convolution integral to explain why a very short input to a system whose impulse response starts at zero gives an output that also starts at zero — and why the same input to a first-order lag gives a jump.
:::

::: answer
For a short pulse of area $\alpha$ the output is $\alpha h(t)$, so the output starts wherever $h$ starts, at $h(0^+)$.

If the bottom degree is at least two more than the top degree (for example, any second-order system with a constant numerator), then $h(0^+) = \lim_{s \to \infty} sG(s) = 0$. The output is reached through two integrations of the input and cannot jump.

For a first-order lag $a/(s + a)$, $sG(s) \to a$ as $s \to \infty$, so $h(0^+) = a$ and the output jumps to $\alpha a$.

In state-space terms $h(0) = \mathbf{C}\mathbf{B}$. That is zero for the companion form of a second-order system ($\mathbf{C} = [1, 0]$, $\mathbf{B} = [0, b]^T$) and nonzero for a first-order one.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $G(s) = Y(s)/U(s)$, zero initial conditions | Transfer function; exists only for LTI systems |
| $G = N(s)/D(s)$ | Poles: roots of $D$ (characteristic roots, eigenvalues of $\mathbf{A}$); zeros: roots of $N$; order $= \deg D$ |
| $G(0)$ | Steady-state (DC) gain |
| $1/s$, $\dfrac{1}{\tau s + 1}$, $\dfrac{1}{Is^2}$, $\dfrac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$ | Integrator, first-order lag, rigid body, canonical second order |
| $G(s) = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B} + D$ | From state space; denominator $\det(s\mathbf{I} - \mathbf{A})$ |
| $G_2G_1$, $G_1 + G_2$, $\dfrac{G}{1 + GH}$ | Series, parallel, negative feedback; closed-loop poles solve $1 + GH = 0$ |
| $h(t) = \mathcal{L}^{-1}\{G(s)\}$ | Impulse response; $G = \mathcal{L}\{h\}$; $h = \mathbf{C}e^{\mathbf{A}t}\mathbf{B}$ |
| $h = \dfrac{\omega_n}{\sqrt{1 - \zeta^2}}e^{-\zeta\omega_n t}\sin\omega_d t$ | Canonical second-order impulse response; step response is $\int_0^t h$ |
| $y = h * u = \int_0^t h(\tau)u(t - \tau)\,d\tau$ | Convolution: the zero-state response to any input |
| $\mathcal{L}\{h * u\} = H(s)U(s)$ | Multiplication in $s$ is convolution in time |

Every transfer function carries its poles with it. The next lesson uses their locations to settle the question that matters most — does the response die away, keep going, or grow? — and then draws the motion of second-order systems as curves in the phase plane.

::: context lti-meaning The two promises behind "LTI"
**Linear** means effects add. Push twice as hard and the response is twice as big; push with two inputs at once and the response is the sum of the two separate responses. **Time-invariant** means the rules do not change with the clock: the same push on Monday or on Friday gives the same response, just shifted in time.

A real rocket keeps neither promise perfectly. It burns propellant, so its mass changes, and its aerodynamics are nonlinear. But over a few seconds, and for small motions about a steady flight condition, both promises hold well enough. Those two promises are exactly what make the whole toolkit of this lesson work.
:::

::: context pole-name Why they are called poles
Picture the size of $G(s)$, $|G(s)|$, drawn as a height above the flat plane of complex numbers $s$. At a root of the denominator the height shoots up to infinity, like a tent pushed up by a tent pole. At a root of the numerator the height drops to zero and the surface touches the ground — a zero.

That is a handy way to remember the names. Engineers draw the "pole–zero map" as a flat plane marked with an $\times$ for each pole and a $\circ$ for each zero, and they read a system's personality off that map at a glance.
:::

::: context why-proper Why real systems are proper
Suppose the numerator's degree beat the denominator's, as in $G(s) = s$, a pure differentiator. Feed it a wiggle $\sin\omega t$ and out comes $\omega\cos\omega t$: the faster the wiggle, the bigger the output, without limit. Every sensor has some high-frequency noise, so a pure differentiator would turn tiny, fast noise into huge output.

Real hardware always runs out of speed somewhere, so its response to very fast inputs falls off. That fall-off is what "strictly proper" says in algebra. When engineers build a "derivative" controller, they add a small lag to make it proper.
:::

::: context linearizing-flight One rocket, many transfer functions
A launch vehicle's aerodynamics change enormously during ascent: the air gets thinner, the speed climbs through Mach 1, the vehicle gets lighter. No single transfer function describes the whole flight.

So engineers pick a list of moments along the planned trajectory — lift-off, Mach 0.8, maximum dynamic pressure, and so on. At each moment they freeze the flight condition and treat small motions about it as linear. That gives one transfer function per moment. They design a controller for each, then blend the controller gains smoothly between moments as the flight goes on. This is called **gain scheduling**, and it is how most ascent autopilots are built.
:::

::: context block-diagram A loop, drawn as blocks
Each box is a transfer function; each arrow carries a signal. The circle is a summing junction: it adds the signals coming in, using the signs written beside it. Here it forms the error $e = r - Hy$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="14" y1="50" x2="84" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="84,50 76,46 76,54" fill="#1f2a44"/>
  <text x="30" y="42" font-size="13" fill="#1f2a44">r</text>
  <circle cx="96" cy="50" r="12" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="74" y="40" font-size="12" fill="#1f2a44">+</text>
  <text x="100" y="80" font-size="14" fill="#b4232c">−</text>
  <line x1="108" y1="50" x2="160" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="160,50 152,46 152,54" fill="#1f2a44"/>
  <text x="128" y="42" font-size="13" fill="#1f2a44">e</text>
  <rect x="160" y="30" width="60" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="55" font-size="14" text-anchor="middle" fill="#1f2a44">G(s)</text>
  <line x1="220" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="340,50 332,46 332,54" fill="#1f2a44"/>
  <text x="318" y="42" font-size="13" fill="#1f2a44">y</text>
  <line x1="290" y1="50" x2="290" y2="115" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="290" y1="115" x2="226" y2="115" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="220,115 228,111 228,119" fill="#1f2a44"/>
  <rect x="160" y="97" width="60" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="120" font-size="14" text-anchor="middle" fill="#1f2a44">H(s)</text>
  <line x1="160" y1="115" x2="96" y2="115" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="96" y1="115" x2="96" y2="68" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="96,62 92,70 100,70" fill="#1f2a44"/>
</svg>
```

Follow the loop once around and you get $Y = G(R - HY)$, which rearranges to $Y/R = G/(1 + GH)$.
:::

::: context butterworth Where the 0.707 comes from
In 1930 the British engineer Stephen Butterworth published a design for radio filters whose response is as flat as possible across the frequencies they let through, with no bump before they cut off. For a second-order filter, that "maximally flat" design has damping ratio $\zeta = 1/\sqrt{2} \approx 0.707$.

In the time domain the same $\zeta$ gives a step response that overshoots by only about 4.3% and settles quickly. That pleasant middle ground between sluggish and ringing is why $0.707$ became the default target for so many control loops — and why landing on $0.708$ in the example is good news.
:::

::: context impulse-spike Squeezing a pulse into an impulse
Take a rectangle of area $1$: width $w$, height $1/w$. Make it narrower and it has to get taller to keep the same area. The unit impulse is what you get in the limit: no width, unlimited height, area exactly $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="186" x2="40" y2="24" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="144" width="80" height="36" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <rect x="40" y="108" width="40" height="72" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="40" y="36" width="20" height="144" fill="#8fb8f0" fill-opacity="0.5" stroke="#b4232c" stroke-width="2"/>
  <text x="128" y="158" font-size="12" fill="#6c7a93">width 0.5, height 2</text>
  <text x="88" y="118" font-size="12" fill="#1d6fd1">width 0.25, height 4</text>
  <text x="68" y="46" font-size="12" fill="#b4232c">width 0.125, height 8</text>
  <text x="200" y="100" font-size="13" fill="#1f2a44">every one has area 1</text>
  <text x="330" y="196" font-size="12" text-anchor="end" fill="#1f2a44">t</text>
</svg>
```

A system cannot tell these pulses apart once they are much shorter than its own response time. So any short, sharp kick works as "an impulse", scaled by its area.
:::

::: context hammer-test Tapping a structure to learn its secrets
Engineers really do measure impulse responses with a hammer. In **modal testing**, a technician taps a part with a special hammer that has a force sensor in its tip, while accelerometers on the part record how it rings. From the tap and the ringing, software works out the part's natural frequencies and damping ratios — its poles.

Whole aircraft and launch vehicles go through a larger version, a **ground vibration test**, with electric shakers instead of a hammer. The bending-mode frequencies and damping in this module's booster examples are the kind of numbers that come out of those tests.
:::

::: context memory-weight How a lag remembers the past
For a lag with $a = 20\,\mathrm{s^{-1}}$, $h(\tau) = 20e^{-20\tau}$ is the weight the output gives to the input from $\tau$ seconds ago. Input from right now counts fully. Input from $0.05\,\mathrm{s}$ ago counts $37\%$ as much, and from $0.15\,\mathrm{s}$ ago only $5\%$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="336" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="164" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,30.0 47.0,42.4 54.0,53.6 61.0,63.7 68.0,72.9 75.0,81.2 82.0,88.7 89.0,95.4 96.0,101.6 103.0,107.1 110.0,112.2 117.0,116.7 124.0,120.8 131.0,124.6 138.0,127.9 145.0,131.0 152.0,133.8 159.0,136.3 166.0,138.5 173.0,140.6 180.0,142.4 187.0,144.1 194.0,145.6 201.0,147.0 208.0,148.2 215.0,149.3 222.0,150.3 229.0,151.3 236.0,152.1 243.0,152.8 250.0,153.5 257.0,154.1 264.0,154.7 271.0,155.2 278.0,155.7 285.0,156.1 292.0,156.4 299.0,156.8 306.0,157.1 313.0,157.4 320.0,157.6"/>
  <line x1="110" y1="160" x2="110" y2="112.2" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="250" y1="160" x2="250" y2="153.5" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="110" cy="112.2" r="3.5" fill="#b4232c"/>
  <circle cx="250" cy="153.5" r="3.5" fill="#b4232c"/>
  <text x="118" y="106" font-size="12" fill="#b4232c">37% at 0.05 s</text>
  <text x="250" y="140" font-size="12" text-anchor="middle" fill="#b4232c">5% at 0.15 s</text>
  <text x="48" y="28" font-size="12" fill="#1f2a44">h(τ) = 20 at τ = 0</text>
  <text x="40" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="110" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">0.05</text>
  <text x="180" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">0.10</text>
  <text x="250" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">0.15</text>
  <text x="320" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">0.20</text>
  <text x="330" y="195" font-size="12" text-anchor="end" fill="#1f2a44">τ, seconds ago</text>
</svg>
```

An integrator's curve would be a flat line: it remembers everything forever.
:::

::: context causal Causal: no peeking at the future
A **causal** system's output at time $t$ depends only on inputs up to time $t$. Every physical system is causal — a rocket cannot react to a gust before the gust arrives. In the convolution integral, this is why $h(\tau)$ is zero for negative $\tau$ and the integral stops at $\tau = t$.

Software that processes recorded data afterwards does not have to be causal. A smoothing filter run over a finished flight log can look at both earlier and later samples. But anything that runs live, inside the loop on the flight computer, must be causal.
:::
