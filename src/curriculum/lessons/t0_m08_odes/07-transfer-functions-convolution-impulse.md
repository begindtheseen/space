---
id: l07-transfer-functions-convolution-impulse
title: Transfer functions, impulse response and convolution
minutes: 22
covers:
  - transfer functions
  - convolution and impulse response
---

In every zero-state response of the last lesson, the transform of the output was the transform of the input multiplied by a fixed ratio of polynomials that depended only on the system. That ratio is the **transfer function**, and from here to the end of the control track it is the standard description of anything linear: a rigid vehicle, an actuator, a rate gyro, a notch filter, the controller itself. A block diagram is a picture of transfer functions; closing a loop is algebra on them; the poles you read $\zeta$ and $\omega_n$ from are the roots of a transfer function's denominator.

The transfer function also has a direct time-domain meaning. Hit the system with an ideal impulse and the output is the **impulse response** $h(t)$, whose transform is exactly $G(s)$. Any input can be regarded as a dense train of impulses, and by linearity the output is the sum of the correspondingly scaled and delayed impulse responses — an integral called **convolution**. Multiplication of transforms in $s$ and convolution in $t$ are the same operation seen from two sides, and the integral that lesson 4 wrote for the forced state-space solution is that convolution.

This lesson defines the transfer function and its vocabulary (poles, zeros, gain, order), derives it from an ODE and from a state-space model, shows how transfer functions combine in series, parallel and feedback with a pitch-rate loop as the example, then turns to the impulse response and the convolution integral and closes the circle by proving that convolution transforms to multiplication.

## Definition

Take a linear time-invariant system with input $u(t)$ and output $y(t)$, at rest before the input starts, so that every initial condition is zero. Transform the governing equation. With the initial-condition terms gone, the derivative rule is just $\frac{d}{dt} \leftrightarrow s$, and an ODE

$$
a_n y^{(n)} + \cdots + a_1\dot{y} + a_0 y = b_m u^{(m)} + \cdots + b_1\dot{u} + b_0 u
$$

becomes $(a_ns^n + \cdots + a_0)Y(s) = (b_ms^m + \cdots + b_0)U(s)$. The **transfer function** is the ratio

$$
G(s) = \frac{Y(s)}{U(s)} = \frac{b_ms^m + \cdots + b_1s + b_0}{a_ns^n + \cdots + a_1s + a_0} = \frac{N(s)}{D(s)},
$$

defined with all initial conditions zero. It is a property of the system alone; the input has been divided out. The zero-state response to any input is then $Y(s) = G(s)U(s)$, one multiplication, followed by the partial-fraction inversion of lesson 6.

The vocabulary:

- The **order** of the system is $n$, the degree of $D(s)$ — the number of states, or the number of initial conditions.
- The **poles** are the roots of $D(s)$: the system's characteristic roots of lesson 2, the eigenvalues of $\mathbf{A}$ of lesson 4, the values of $s$ where $G$ is infinite. Each pole $p$ contributes a mode $e^{pt}$ to every response.
- The **zeros** are the roots of $N(s)$: the values of $s$ at which the system passes nothing. A zero at $s = z$ means an input $e^{zt}$ produces no steady output at that exponential. Zeros shape the response and can move a step response's peak, but they do not decide stability.
- The **steady-state gain** (or DC gain) is $G(0) = b_0/a_0$, the ratio of output to input for a constant input, provided the system is stable. It is what the final value theorem returns for a unit step: $\lim_{s \to 0} s\,G(s)/s = G(0)$.
- $G$ is **proper** when $m \le n$ and **strictly proper** when $m < n$. Physical systems are strictly proper, or at worst proper: a system cannot respond to the derivative of its input faster than to the input itself without infinite bandwidth.

The transfer function only exists for *linear, time-invariant* systems. A nonlinear equation such as $\ddot{\theta} + \sin\theta = u$ does not transform to a ratio of polynomials, and a time-varying one has coefficients that will not come outside the integral. Nonlinear vehicles are linearised about an operating point to obtain one — that is what "the pitch transfer function at Mach 0.8" means.

::: key
Transfer function: $G(s) = Y(s)/U(s)$ with all initial conditions zero — the Laplace transform of the impulse response. It only exists for LTI systems. Poles are the roots of the denominator (the system's characteristic roots), zeros the roots of the numerator, and $G(0)$ is the steady-state gain. Zero-state response to any input: $Y(s) = G(s)U(s)$.
:::

### The standard forms

The systems of this module, as transfer functions:

| System | ODE | $G(s)$ | Poles |
| --- | --- | --- | --- |
| Integrator | $\dot{y} = u$ | $1/s$ | $0$ |
| First-order lag | $\tau\dot{y} + y = u$ | $\dfrac{1}{\tau s + 1}$ | $-1/\tau$ |
| Rigid body (double integrator) | $I\ddot{\theta} = T$ | $\dfrac{1}{Is^2}$ | $0, 0$ |
| Canonical second order | $\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2y = \omega_n^2u$ | $\dfrac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$ | $-\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}$ |
| PD controller | $T = K_p e + K_d\dot{e}$ | $K_ds + K_p$ | none (zero at $-K_p/K_d$) |

The first-order lag is also written $a/(s + a)$ with $a = 1/\tau$ the corner frequency; the two forms are identical. The TVC actuator of lesson 3 is $G(s) = 1600/(s^2 + 48s + 1600)$, and reading $2\zeta\omega_n = 48$, $\omega_n^2 = 1600$ off a denominator is now the fastest route to $\zeta$ and $\omega_n$.

::: warning
A transfer function describes the *zero-state* response. If the system starts with nonzero initial conditions, $Y(s) = G(s)U(s)$ is missing the zero-input terms, which have the same denominator $D(s)$ but a numerator built from the initial conditions (lesson 6). The poles are the same either way; only the residues change. Never "add initial conditions into $U$" — transform the full ODE instead.
:::

## From state space to transfer function

Lesson 4 wrote the same systems as $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$, $y = \mathbf{C}\mathbf{x} + Du$. Transform both equations with $\mathbf{x}(0) = \mathbf{0}$, using the derivative rule entrywise:

$$
s\mathbf{X}(s) = \mathbf{A}\mathbf{X}(s) + \mathbf{B}U(s) \quad\Longrightarrow\quad (s\mathbf{I} - \mathbf{A})\mathbf{X} = \mathbf{B}U \quad\Longrightarrow\quad \mathbf{X} = (s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B}\,U,
$$

and so

$$
G(s) = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B} + D.
$$

The inverse of $s\mathbf{I} - \mathbf{A}$ is the adjugate over the determinant, so the denominator of $G$ is $\det(s\mathbf{I} - \mathbf{A})$: **the poles are the eigenvalues of $\mathbf{A}$**, as lesson 4 promised (unless a zero happens to cancel one, which is the subject of controllability and observability in the control track). For the $2 \times 2$ companion form with $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -a_0 & -a_1 \end{bmatrix}$, $\mathbf{B} = [0, b]^T$, $\mathbf{C} = [1, 0]$:

$$
(s\mathbf{I} - \mathbf{A})^{-1} = \frac{1}{s^2 + a_1s + a_0}\begin{bmatrix} s + a_1 & 1 \\ -a_0 & s \end{bmatrix}, \qquad G(s) = \frac{1}{s^2 + a_1s + a_0}\begin{bmatrix} 1 & 0 \end{bmatrix}\begin{bmatrix} b \\ bs \end{bmatrix} = \frac{b}{s^2 + a_1s + a_0}.
$$

For the pitch-rate model of lesson 4, $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -6.25 & -3 \end{bmatrix}$ with $\mathbf{B} = [0, 6.25]^T$, this gives $G = 6.25/(s^2 + 3s + 6.25)$ with poles $-1.5 \pm 2j$. The state-space and transfer-function descriptions carry the same poles; state space keeps the internal variables, the transfer function keeps only input to output.

## Block algebra

Because $Y = GU$ is multiplication, systems connected together combine by algebra. Three rules cover every block diagram.

**Series.** If $u$ drives $G_1$ and its output drives $G_2$, then $Y = G_2(G_1U)$, so the overall transfer function is $G_2G_1$ — the product, in either order for scalar systems. An actuator feeding a plant is $G_{\mathrm{plant}}G_{\mathrm{act}}$, and its poles are the union of the two sets of poles.

**Parallel.** If $u$ drives $G_1$ and $G_2$ and the outputs are summed, the result is $G_1 + G_2$. A PD controller is the parallel combination of a gain $K_p$ and a differentiator $K_ds$.

**Feedback.** Let the forward path be $G(s)$ from an error signal $e$ to the output $y$, and feed the output back through $H(s)$ to form $e = r - Hy$, with $r$ the reference. Then $Y = GE = G(R - HY)$, so $(1 + GH)Y = GR$ and

$$
\frac{Y}{R} = \frac{G}{1 + GH}.
$$

The closed-loop poles are the roots of $1 + G(s)H(s) = 0$, the **characteristic equation** of the loop. Its roots are *not* the poles of $G$ or $H$: feedback moves the poles, which is the whole point of control. With $H = 1$ (unity feedback, the output measured directly) the formula is $G/(1 + G)$. If $G = N/D$ then $G/(1 + G) = N/(D + N)$: the closed-loop denominator is the open-loop denominator plus the open-loop numerator.

::: key
Series: $G_2G_1$. Parallel: $G_1 + G_2$. Negative feedback with forward path $G$ and feedback path $H$: $Y/R = G/(1 + GH)$; closed-loop poles solve $1 + GH = 0$. For $G = N/D$ and unity feedback the closed-loop transfer function is $N/(D + N)$.
:::

::: example Closing a pitch-rate loop
A rigid airframe's pitch rate $q$ responds to elevator deflection $\delta$ approximately as a first-order lag, $P(s) = 20/(s + 1)$ in $(\mathrm{rad/s})/\mathrm{rad}$: a $1\,\mathrm{rad}$ elevator step eventually produces $20\,\mathrm{rad/s}$ of pitch rate, with a $1\,\mathrm{s}$ time constant set by pitch damping. The elevator actuator is a lag with $\tau = 0.05\,\mathrm{s}$, $A(s) = 1/(0.05s + 1)$. A rate gyro measures $q$ directly ($H = 1$) and a proportional controller commands $\delta = K(q_c - q)$ with $K = 0.5\,\mathrm{rad}/(\mathrm{rad/s})$.

The forward path is the series product $G = KAP = 10/((s + 1)(0.05s + 1))$, with open-loop poles at $-1$ and $-20$. Unity feedback gives

$$
\frac{Q}{Q_c} = \frac{G}{1 + G} = \frac{10}{(s + 1)(0.05s + 1) + 10} = \frac{10}{0.05s^2 + 1.05s + 11} = \frac{200}{s^2 + 21s + 220}.
$$

Read the denominator: $\omega_n = \sqrt{220} = 14.8\,\mathrm{rad/s}$ and $\zeta = 21/(2 \times 14.8) = 0.708$, poles at $-10.5 \pm 10.5j$. The loop has moved two real poles at $-1$ and $-20$ into a complex pair with almost exactly the Butterworth damping: about 4.3% overshoot, 2% settling in $4/10.5 = 0.38\,\mathrm{s}$, against $4\,\mathrm{s}$ for the open airframe. The steady-state gain is $G_{\mathrm{cl}}(0) = 200/220 = 0.909$: a commanded $1\,\mathrm{rad/s}$ produces $0.909\,\mathrm{rad/s}$, a 9% standing error that a proportional loop cannot remove (integral action, in the control track, will). Change the gain and the poles move: $K = 0.2$ gives $s^2 + 21s + 100$ with real poles $-7.3$ and $-13.7$; $K = 1.0$ gives $s^2 + 21s + 420$, poles $-10.5 \pm 17.6j$ and $\zeta = 0.51$. The real part stays at $-10.5$ because the coefficient of $s$ does not depend on $K$ — the poles move along a vertical line, the beginning of a root locus.
:::

::: note
Lesson 2's PD satellite is the same algebra with a second-order plant. Plant $1/(Is^2)$ with $I = 50\,\mathrm{kg\,m^2}$, controller $K_ds + K_p = 40s + 20$ in the forward path, unity feedback: closed loop $(40s + 20)/(50s^2 + 40s + 20) = (0.8s + 0.4)/(s^2 + 0.8s + 0.4)$, poles $-0.4 \pm 0.490j$ as before, plus a zero at $s = -0.5$ from the controller. Insert the wheel lag $1/(0.05s + 1)$ in series and the denominator becomes $50s^2(0.05s + 1) + 40s + 20$, i.e. $2.5s^3 + 50s^2 + 40s + 20$, or $s^3 + 20s^2 + 16s + 8$ — lesson 4's characteristic polynomial, with roots $-19.2$ and $-0.406 \pm 0.502j$.
:::

## The impulse response

Now the time-domain face of $G(s)$. Drive the system, at rest, with the unit impulse $\delta(t)$ of lesson 6: an idealised kick of unit area and zero duration. Since $\mathcal{L}\{\delta\} = 1$, the output transform is $Y = G \cdot 1 = G(s)$. The **impulse response** is therefore

$$
h(t) = \mathcal{L}^{-1}\{G(s)\},
$$

and conversely $G(s) = \mathcal{L}\{h(t)\}$ — the transfer function *is* the transform of the impulse response, which is the definition on the module's flashcard. Physically an impulse is any input much shorter than the system's fastest time constant: a hammer tap on a structure, a single thruster pulse on a spacecraft, one $20\,\mathrm{ms}$ nozzle twitch against a $400\,\mathrm{ms}$ bending period. The response to such a pulse of area $\alpha$ is $\alpha h(t)$, whatever the pulse's exact shape.

For the standard forms, read $h$ straight from the lesson 6 table:

- First-order lag $a/(s + a)$: $h(t) = ae^{-at}$. A kick of area $\alpha$ produces an instantaneous jump to $\alpha a$ followed by decay with time constant $1/a$. The jump is finite because the lag is strictly proper by exactly one degree.
- Integrator $1/s$: $h = 1$, the unit step. A velocity impulse leaves a body displaced forever.
- Double integrator $1/(Is^2)$: $h = t/I$. A torque impulse $\alpha$ leaves a rigid body rotating at the constant rate $\alpha/I$.
- Canonical second order: complete the square, $\omega_n^2/((s + \zeta\omega_n)^2 + \omega_d^2)$, and match the damped sine:

$$
h(t) = \frac{\omega_n^2}{\omega_d}\,e^{-\zeta\omega_n t}\sin\omega_d t = \frac{\omega_n}{\sqrt{1 - \zeta^2}}\,e^{-\zeta\omega_n t}\sin\omega_d t.
$$

It starts at zero — a second-order system driven through two integrations cannot jump — rises to a peak, and rings at $\omega_d$ inside the envelope $e^{-\zeta\omega_n t}$. Its integral from zero to infinity is $G(0) = 1$.

The impulse response is also the derivative of the step response: a step is the integral of an impulse, $1/s = (1/s)\cdot 1$, so the step response transform is $G(s)/s$, and dividing by $s$ is integration in time. This is why lesson 3's step-response slope, $\dot{y} = (\omega_n^2/\omega_d)e^{-\sigma t}\sin\omega_d t$, is precisely the $h(t)$ above, and why the peak of the step response falls at the first zero of $h$, $t_p = \pi/\omega_d$.

::: key
Impulse response $h(t) = \mathcal{L}^{-1}\{G(s)\}$; equivalently $G(s) = \mathcal{L}\{h(t)\}$. Step response $= \int_0^t h$, so $h$ is the slope of the step response. Canonical second order: $h(t) = \dfrac{\omega_n}{\sqrt{1 - \zeta^2}}e^{-\zeta\omega_n t}\sin\omega_d t$. First-order lag $a/(s + a)$: $h = ae^{-at}$. In state space, $h(t) = \mathbf{C}e^{\mathbf{A}t}\mathbf{B}$.
:::

::: example Impulse response of the TVC actuator
For $G(s) = 1600/(s^2 + 48s + 1600)$, $\omega_n = 40$, $\zeta = 0.6$, $\omega_d = 32$:

$$
h(t) = \frac{1600}{32}e^{-24t}\sin 32t = 50\,e^{-24t}\sin 32t \quad \mathrm{s^{-1}}.
$$

Its units are $\mathrm{s^{-1}}$, because an impulse of nozzle-angle command has units of degree-seconds and the output is degrees. The peak occurs where $\dot{h} = 0$, i.e. $\tan 32t = 32/24$, at $t = \arctan(4/3)/32 = 0.029\,\mathrm{s}$, where $h = 50e^{-0.695}\times 0.8 = 20.0\,\mathrm{s^{-1}}$; the first zero crossing is at $\pi/32 = 0.098\,\mathrm{s}$, the step response's peak time. Numerically integrating $h$ from 0 to $1\,\mathrm{s}$ gives $1.0000$, the steady-state gain. A command pulse of $2^\circ$ lasting $5\,\mathrm{ms}$ — short against the $1/24 = 42\,\mathrm{ms}$ envelope — has area $0.01\,\mathrm{deg\,s}$ and produces a nozzle excursion peaking at $0.01 \times 20.0 = 0.20^\circ$, then ringing down within $4/24 = 0.17\,\mathrm{s}$.
:::

## Convolution

Take an arbitrary input $u(t)$ and chop it into thin slices of width $d\tau$. The slice at time $\tau$ has area $u(\tau)\,d\tau$ and, if $d\tau$ is short compared with the system's time constants, acts as an impulse of that area applied at $\tau$. By time invariance its response at a later time $t$ is $u(\tau)\,d\tau\;h(t - \tau)$: the impulse response, started at $\tau$, evaluated $t - \tau$ later. By linearity the total output is the sum over all slices before $t$:

$$
y(t) = \int_0^t h(t - \tau)\,u(\tau)\,d\tau = \int_0^t h(\tau)\,u(t - \tau)\,d\tau \equiv (h * u)(t).
$$

This is the **convolution integral**; the second form follows from the substitution $\tau \to t - \tau$ and shows that the operation is symmetric, $h * u = u * h$. Read the first form as "each past input, weighted by how much of it the system still remembers". Read the second as "the impulse response, run backwards over the recent input": $h(\tau)$ is the weight the system gives to the input $\tau$ seconds ago. For a first-order lag, $h(\tau) = ae^{-a\tau}$ weights the recent past heavily and forgets exponentially; for an integrator, $h = 1$ weights all past input equally.

Lesson 4's forced solution $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t - \tau)}\mathbf{B}u(\tau)\,d\tau$ is this integral: the zero-state part is the convolution of $u$ with $e^{\mathbf{A}t}\mathbf{B}$, and multiplying by $\mathbf{C}$ identifies the impulse response of the state-space system as $h(t) = \mathbf{C}e^{\mathbf{A}t}\mathbf{B}$. Its transform, $\mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B}$, is the transfer function found above, so $\mathcal{L}\{e^{\mathbf{A}t}\} = (s\mathbf{I} - \mathbf{A})^{-1}$: the resolvent is the transform of the state transition matrix.

### Convolution in time is multiplication in $s$

The claim $\mathcal{L}\{h * u\} = H(s)U(s)$ follows from the definition and one change in the order of integration. Write the transform of the convolution, extending $u$ and $h$ by zero for negative arguments so that the inner limit can be taken to infinity:

$$
\mathcal{L}\{h * u\} = \int_0^\infty e^{-st}\int_0^\infty h(t - \tau)u(\tau)\,d\tau\,dt = \int_0^\infty u(\tau)\left[\int_0^\infty h(t - \tau)e^{-st}\,dt\right]d\tau.
$$

In the inner integral substitute $\eta = t - \tau$ (with $h(\eta) = 0$ for $\eta < 0$): it becomes $e^{-s\tau}\int_0^\infty h(\eta)e^{-s\eta}d\eta = e^{-s\tau}H(s)$. Then the outer integral is $H(s)\int_0^\infty u(\tau)e^{-s\tau}d\tau = H(s)U(s)$.

So the two descriptions of the zero-state response coincide: $Y(s) = G(s)U(s)$ in the transform domain is $y = h * u$ in time, and the series rule $G_2G_1$ says that the impulse response of two systems in cascade is $h_2 * h_1$. In practice you convolve numerically (a simulation does nothing else) and multiply analytically; the theorem guarantees they agree.

::: key
Convolution: $y(t) = (h * u)(t) = \int_0^t h(\tau)u(t - \tau)\,d\tau = \int_0^t h(t - \tau)u(\tau)\,d\tau$. It is the zero-state response to any input and it transforms to $Y(s) = H(s)U(s)$: multiplication in the $s$-domain is convolution in time. Its state-space form is $\int_0^t \mathbf{C}e^{\mathbf{A}(t - \tau)}\mathbf{B}u(\tau)\,d\tau$.
:::

::: example Convolving a lag with a step, and a booster mode with a pulse
First the lag $a/(s + a)$, $h = ae^{-a\tau}$, driven by a unit step from rest. Using the second form of the integral with $u(t - \tau) = 1$ for $\tau \le t$,

$$
y(t) = \int_0^t ae^{-a\tau}\,d\tau = 1 - e^{-at},
$$

lesson 1's step response, obtained without an integrating factor. With $a = 20\,\mathrm{s^{-1}}$: $y(0.05) = 0.632$, $y(0.1) = 0.865$, $y(0.2) = 0.982$. For a unit ramp instead, $u(t - \tau) = t - \tau$ and the integral gives $t - \tau_a + \tau_ae^{-t/\tau_a}$ with $\tau_a = 1/a$; at $t = 0.1\,\mathrm{s}$ with $\tau_a = 0.05\,\mathrm{s}$ that is $0.0568$, which a numerical convolution with $10^5$ slices reproduces to nine digits.

Now the bending mode of lessons 3 and 5 ($\omega_n = 15.7\,\mathrm{rad/s}$, $\zeta = 0.005$, $\omega_d \approx \omega_n$), with the input scaled so that a unit constant $u$ deflects the mode $1\,\mathrm{mm}$ statically. A thrust-vector transient applies $u = 1$ for $20\,\mathrm{ms}$, one twentieth of the $400\,\mathrm{ms}$ period, so treat it as an impulse of area $0.02\,\mathrm{s}$. Then $y \approx 0.02\,h(t)$ with $h = (\omega_n^2/\omega_d)e^{-\sigma t}\sin\omega_d t$ and $\omega_n^2/\omega_d = 15.71\,\mathrm{s^{-1}}$, so the mode rings with amplitude $0.02 \times 15.71 = 0.314\,\mathrm{mm}$ — a third of the static deflection from a pulse one twentieth of a period long — first peaking a quarter period ($0.1\,\mathrm{s}$) after the pulse and decaying with the $12.7\,\mathrm{s}$ time constant. Integrating the exact equation with the rectangular pulse gives an amplitude of $0.311\,\mathrm{mm}$; the 1% difference is the pulse's finite width, and it shrinks as the pulse shortens. Compared with lesson 5's $100\,\mathrm{mm}$ at sustained resonance, a single short pulse is harmless; the impulse response says how much, and the convolution integral says how a *train* of such pulses adds up.
:::

::: warning
The convolution integral runs only over $0 \le \tau \le t$: a causal system cannot respond to input that has not happened yet, and the input is taken as zero before $t = 0$. When you convolve numerically, this shows up as summing $h[k]u[n - k]$ for $k$ from 0 to $n$ only. Summing over all $k$ with a periodic wrap-around, as a fast Fourier transform routine does by default, is circular convolution and gives the wrong transient.
:::

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

## Check yourself

::: check
A system obeys $\ddot{y} + 6\dot{y} + 25y = \dot{u} + 2u$. Write its transfer function, list its poles and zeros, give $\zeta$, $\omega_n$ and the steady-state gain, and say whether it is strictly proper.
:::

::: answer
With zero initial conditions, $(s^2 + 6s + 25)Y = (s + 2)U$, so $G(s) = (s + 2)/(s^2 + 6s + 25)$. Poles: $s = -3 \pm 4j$ ($\omega_n = 5\,\mathrm{rad/s}$, $\zeta = 3/5 = 0.6$). One zero at $s = -2$. Steady-state gain $G(0) = 2/25 = 0.08$. Numerator degree 1, denominator degree 2: strictly proper, so the impulse response starts at a finite value (here $h(0^+) = \lim_{s \to \infty} sG = 1$ by the initial value theorem) and the step response starts at zero.
:::

::: check
Two first-order lags with time constants $0.05\,\mathrm{s}$ and $0.2\,\mathrm{s}$ are connected in series. What is the overall transfer function, its poles and its impulse response?
:::

::: answer
$G = \dfrac{1}{(0.05s + 1)(0.2s + 1)} = \dfrac{100}{(s + 20)(s + 5)}$, poles at $-20$ and $-5$. Partial fractions: $100/((s + 20)(s + 5)) = \frac{20/3}{s + 5} - \frac{20/3}{s + 20}$ (cover-up: at $s = -5$, $100/15$; at $s = -20$, $100/(-15)$). So $h(t) = \tfrac{20}{3}\bigl(e^{-5t} - e^{-20t}\bigr)$, which starts at zero — two lags in series cannot jump — and is also $h_1 * h_2$ with $h_1 = 20e^{-20t}$, $h_2 = 5e^{-5t}$.
:::

::: check
A plant $P(s) = 4/(s(s + 2))$ is placed under unity feedback with a proportional gain $K$. For what $K$ are the closed-loop poles critically damped, and where are they for $K = 2$?
:::

::: answer
Forward path $G = 4K/(s(s + 2))$; closed loop $G/(1 + G) = 4K/(s^2 + 2s + 4K)$. Compare with $s^2 + 2\zeta\omega_n s + \omega_n^2$: $\omega_n = 2\sqrt{K}$ and $2\zeta\omega_n = 2$, so $\zeta = 1/(2\sqrt{K})$. Critical damping, $\zeta = 1$, needs $K = 1/4$, with a double pole at $-1$. For $K = 2$: $s^2 + 2s + 8$, poles $-1 \pm j\sqrt{7} = -1 \pm 2.65j$, $\omega_n = 2.83\,\mathrm{rad/s}$, $\zeta = 0.354$. The real part is fixed at $-1$ for all $K > 1/4$; raising the gain only speeds the ringing and lowers the damping.
:::

::: check
A rigid spacecraft with $I = 50\,\mathrm{kg\,m^2}$ receives a thruster torque pulse of $5\,\mathrm{N\,m}$ lasting $0.1\,\mathrm{s}$. Using the impulse response, what is the body's rate afterwards, and what is its attitude $10\,\mathrm{s}$ after the pulse?
:::

::: answer
The transfer function from torque to attitude is $1/(Is^2)$ with impulse response $h = t/I$. The pulse has area (angular impulse) $\alpha = 5 \times 0.1 = 0.5\,\mathrm{N\,m\,s}$ and is short against any timescale of interest, so $\theta(t) \approx \alpha h(t) = 0.5t/50 = 0.01t\ \mathrm{rad}$: the rate is $0.01\,\mathrm{rad/s}$ (the derivative of the response, equivalently $\alpha/I$) and the attitude at $t = 10\,\mathrm{s}$ is $0.1\,\mathrm{rad}$, about $5.7^\circ$. The exact convolution with the rectangular pulse differs only by the $0.05\,\mathrm{s}$ half-width: $\theta(10) = 0.01 \times 9.95 = 0.0995\,\mathrm{rad}$.
:::

::: check
Explain, from the convolution integral, why an input applied for a very short time to a system whose impulse response starts at zero produces an output that also starts at zero, and why the same input to a first-order lag produces a jump.
:::

::: answer
For a short pulse of area $\alpha$ the output is $\alpha h(t)$, so the output inherits $h(0^+)$. For a strictly proper system of relative degree two or more, such as any second-order system with a constant numerator, $h(0^+) = \lim_{s \to \infty} sG(s) = 0$: the output has to be integrated twice from the input and cannot jump. For a first-order lag $a/(s + a)$, $sG \to a$, so $h(0^+) = a$ and the output jumps to $\alpha a$. In state-space terms $h(0) = \mathbf{C}\mathbf{B}$, which is zero for the companion form of a second-order system ($\mathbf{C} = [1, 0]$, $\mathbf{B} = [0, b]^T$) and nonzero for a first-order one.
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

The next lesson uses the pole locations that every transfer function carries to settle the question that matters most — whether the response decays, persists, or grows — and then draws the state-space trajectories of second-order systems in the phase plane.
