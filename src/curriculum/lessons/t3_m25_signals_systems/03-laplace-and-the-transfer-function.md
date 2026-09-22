---
id: l03-laplace-and-the-transfer-function
title: The Laplace transform and the transfer function
minutes: 16
covers:
  - "The Laplace transform and the transfer function"
---

The convolution integral of lesson 2 is complete but clumsy. Cascading two systems means convolving two impulse responses; closing a loop means solving an integral equation. The Laplace transform replaces both with multiplication and division of polynomials, and that is the only reason control theory is practical enough to do on a whiteboard during a design review.

Module 8 built the transform from the integral and used it to solve initial-value problems. This lesson comes at it from the other side — from the eigenfunction property of lesson 1 — because that view explains *why* the variable is called $s$ and why the answer is a ratio of polynomials. It then nails down the vocabulary you will use for the rest of the tier: proper and strictly proper, relative degree, and the three algebraically identical but practically different ways of writing the same $G(s)$. Being fluent in all three is not pedantry. The pole-zero form is what a root locus needs, the time-constant form is what you sketch a Bode plot from, and the expanded polynomial form is what you type into code.

By the end you should be able to take a physical device — a gimballed nozzle, a brushless wheel motor, a rigid vehicle with an unstable aerodynamic moment — and produce its transfer function from the equations of motion, in whichever form the next step requires.

## Where $s$ comes from

Lesson 1 showed that if an LTI system is driven by $e^{st}$, the output is $G(s)e^{st}$ with

$$
G(s) = \int_0^\infty h(\tau)\,e^{-s\tau}\,d\tau.
$$

That integral *is* the Laplace transform of $h$. The transform is not an arbitrary trick; it is the map that assigns to each complex exponential the complex gain the system applies to it. Writing $s = \sigma + j\omega$, the family $e^{st} = e^{\sigma t}(\cos\omega t + j\sin\omega t)$ covers growing, decaying and pure oscillations, so one function $G(s)$ of one complex variable encodes the system's response to all of them.

For a general signal $f(t)$ defined for $t \ge 0$, the **one-sided Laplace transform** is

$$
F(s) = \mathcal{L}\{f\}(s) = \int_0^\infty f(t)e^{-st}\,dt,
$$

and the integral converges only for $s$ in a half plane $\operatorname{Re}s > \sigma_0$, the **region of convergence**. For $f = e^{-at}$ the integral converges for $\operatorname{Re}s > -a$ and gives $1/(s + a)$; the abscissa $\sigma_0$ is the largest real part among the signal's exponential modes, which for the impulse response of a system is the largest real part among its poles.

That fact has a consequence worth pausing on. If the system is stable, every pole has $\operatorname{Re}s < 0$, the region of convergence contains the imaginary axis, and $G(j\omega)$ exists: the frequency response is well defined and can be measured by shaking the system with sinusoids. If the system has a pole in the right half plane — a statically unstable launch vehicle, for example — the imaginary axis is *outside* the region of convergence, $G(j\omega)$ is a formal substitution rather than a convergent integral, and no open-loop frequency-response measurement is possible, because the vehicle diverges before a single sine wave completes. This is why an unstable plant's frequency response is identified from closed-loop test data, with the loop's known controller divided back out.

The two properties that do all the work are linearity and the derivative rule. For the one-sided transform, integrating by parts gives

$$
\mathcal{L}\{\dot{f}\} = sF(s) - f(0), \qquad \mathcal{L}\{\ddot{f}\} = s^2F(s) - sf(0) - \dot{f}(0),
$$

and $\mathcal{L}\left\{\int_0^tf\right\} = F(s)/s$. With every initial condition zero, differentiation is multiplication by $s$ and integration is division by $s$ — nothing more.

## The transfer function

Take an LTI system at rest and transform its governing equation. An ODE

$$
a_ny^{(n)} + \cdots + a_1\dot{y} + a_0y = b_mu^{(m)} + \cdots + b_1\dot{u} + b_0u
$$

becomes $D(s)Y(s) = N(s)U(s)$ with $D(s) = a_ns^n + \cdots + a_0$ and $N(s) = b_ms^m + \cdots + b_0$.

::: key
**Transfer function**: $G(s) = Y(s)/U(s)$, the Laplace transform of the output over the input **with all initial conditions zero**. It exists only for LTI systems. Equivalently $G(s) = \mathcal{L}\{h(t)\}$, the transform of the impulse response, and the zero-state response to any input is $Y(s) = G(s)U(s)$.
:::

From a state-space model $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$, $y = \mathbf{C}\mathbf{x} + Du$, the same procedure gives $G(s) = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B} + D$, whose denominator is $\det(s\mathbf{I} - \mathbf{A})$, so the poles are the eigenvalues of $\mathbf{A}$ unless a numerator factor cancels one.

### Proper, strictly proper, relative degree

Let $n = \deg D$ and $m = \deg N$. The **relative degree** is $n - m$. Then:

- $m \le n$: **proper**. $G(s)$ tends to a finite limit as $|s| \to \infty$.
- $m < n$: **strictly proper**. $G \to 0$ at high frequency; relative degree at least one.
- $m > n$: **improper**. $|G| \to \infty$ with frequency.

Every physical system is proper, and almost all are strictly proper, because no device has infinite gain at infinite frequency. A pure differentiator $G = s$ is improper and cannot be built: it would amplify a $1\,\mathrm{mrad}$ sensor ripple at $10\,\mathrm{kHz}$ into a $62.8\,\mathrm{rad/s}$ rate signal. Real differentiation is always filtered, $G = s/(\tau s + 1)$, which is proper and rolls off above $1/\tau$.

Relative degree also tells you how the response starts. By the initial value theorem, $h(0^+) = \lim_{s\to\infty}sG(s)$, so relative degree one gives a step response with a nonzero initial slope and relative degree two or more gives one that leaves the origin flat. On a vehicle, relative degree counts the integrations between the command and the measurement: torque to rate is one, torque to attitude is two, and adding a second-order actuator makes it four.

### The initial and final value theorems, and when they lie

$$
f(0^+) = \lim_{s\to\infty}sF(s), \qquad f(\infty) = \lim_{s\to 0}sF(s).
$$

The initial value theorem is safe for any proper $F$. The final value theorem is valid **only if $sF(s)$ has all its poles strictly in the left half plane**. Apply it to $F = 1/(s - 1)$ and it returns 0 while $f = e^{t}$ runs away; apply it to $F = \omega/(s^2 + \omega^2)$ and it returns 0 while $f = \sin\omega t$ keeps oscillating. Checking the poles before taking the limit is not optional, and the second worked example below shows a case where forgetting costs you a plausible-looking wrong answer.

## Three ways to write the same $G$

Take the transfer function of a filtered rate signal,

$$
G(s) = \frac{40s + 80}{s^2 + 22s + 40}.
$$

**Expanded polynomial form** is what you have; it is what numerical libraries want, as two coefficient arrays highest power first.

**Pole-zero (root-locus) form** factors both polynomials and pulls out the leading coefficient:

$$
G(s) = \frac{k\,(s - z_1)\cdots}{(s - p_1)\cdots} = \frac{40(s + 2)}{(s + 2)(s + 20)}.
$$

The constant $k$ here is $40$, the ratio of leading coefficients. This form shows the poles and zeros directly and is what a root locus is drawn from. It also shows that this particular $G$ has a pole and a zero at the same place — a cancellation, whose hazards lesson 4 takes up.

**Time-constant (Bode) form** normalises every factor so that its constant term is one:

$$
G(s) = K\,\frac{(1 + s/z_1)\cdots}{(1 + s/p_1)\cdots} = 2\,\frac{(1 + s/2)}{(1 + s/2)(1 + s/20)},
$$

where $K = G(0) = 80/40 = 2$ is the DC gain. This is the form to sketch a Bode plot from, because each factor is 1 (that is, $0\,\mathrm{dB}$) below its corner frequency and contributes its slope only above it, and the leading $K$ sets the whole curve's height. Note that $k$ and $K$ are different numbers — here 40 and 2 — and confusing them is the commonest way to put a hand-drawn Bode plot at the wrong level.

::: warning
The two gains are related by $K = k\prod|z_i|/\prod|p_i|$ only when there is no pole or zero at the origin. When $G$ has an integrator there is no finite DC gain at all, and the time-constant form is written with the $1/s$ pulled out, for example $G(s) = \dfrac{10}{s(1 + s/10)}$: the leading constant, 10, is then the value of $|G(j\omega)\omega|$ at low frequency, not $G(0)$. Lesson 9 uses exactly this reading to place the low-frequency asymptote.
:::

::: example The transfer function of a reaction-wheel motor
A brushless wheel motor is modelled by one electrical and one mechanical equation. With armature voltage $V$, current $i$, wheel rate $\omega$, resistance $R = 2.5\,\Omega$, inductance $L = 1.2\,\mathrm{mH}$, torque constant $K_t = 0.035\,\mathrm{N\,m/A}$, back-emf constant $K_e = 0.035\,\mathrm{V\,s/rad}$, rotor inertia $J = 9.55\times10^{-3}\,\mathrm{kg\,m^2}$ and viscous friction $b = 1.5\times10^{-5}\,\mathrm{N\,m\,s/rad}$:

$$
V = Ri + L\frac{di}{dt} + K_e\omega, \qquad J\dot{\omega} = K_ti - b\omega.
$$

Transform both with zero initial conditions: $V = (Ls + R)I + K_e\Omega$ and $(Js + b)\Omega = K_tI$. Eliminate $I$ from the second and substitute:

$$
\frac{\Omega(s)}{V(s)} = \frac{K_t}{(Ls + R)(Js + b) + K_tK_e}.
$$

The denominator expands to $LJ\,s^2 + (Lb + RJ)s + (Rb + K_tK_e)$. Numerically $LJ = 1.146\times10^{-5}$, $Lb + RJ = 2.3875\times10^{-2}$, and $Rb + K_tK_e = 3.75\times10^{-5} + 1.225\times10^{-3} = 1.2625\times10^{-3}$, so in **expanded** form

$$
G(s) = \frac{0.035}{1.146\times10^{-5}s^2 + 2.3875\times10^{-2}s + 1.2625\times10^{-3}}.
$$

Dividing through by $LJ$ gives the monic denominator $s^2 + 2083.3s + 110.17$, whose roots are $-2083.3$ and $-0.0529\,\mathrm{rad/s}$. In **pole-zero** form,

$$
G(s) = \frac{3054}{(s + 0.0529)(s + 2083.3)},
$$

with $k = K_t/(LJ) = 3054$. The fast pole is the electrical one, $-R/L = -2083\,\mathrm{rad/s}$, a time constant of $0.48\,\mathrm{ms}$; the slow pole is mechanical, a time constant of $18.9\,\mathrm{s}$, set almost entirely by back-emf rather than friction (their ratio $K_tK_e/(Rb) = 32.7$). The two are separated by a factor of 39,000, which lesson 6 uses to throw one of them away.

In **time-constant** form,

$$
G(s) = \frac{27.72}{(1 + s/0.0529)(1 + s/2083.3)}\ \ \mathrm{(rad/s)/V},
$$

and the leading constant is the DC gain: $K_t/(Rb + K_tK_e) = 0.035/1.2625\times10^{-3} = 27.72\,(\mathrm{rad/s})$ per volt. At a $28\,\mathrm{V}$ bus the wheel runs out at $776\,\mathrm{rad/s} = 7410\,\mathrm{rpm}$, which is what sets the momentum storage the spacecraft can command before the wheel saturates. All three forms are the same function; check by evaluating any of them at, say, $s = 0$.
:::

::: example A launch vehicle's pitch transfer function, and a final value that lies
Lesson 1 linearised a vehicle at max q to $\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta$ with $\mu_\alpha = 0.02657\,\mathrm{s^{-2}}$ and $\mu_\delta = 1.745\,\mathrm{s^{-2}}$, where $\theta$ is pitch error and $\delta$ the nozzle angle. Transforming with zero initial conditions,

$$
\frac{\Theta(s)}{\Delta(s)} = \frac{\mu_\delta}{s^2 - \mu_\alpha} = \frac{1.745}{(s - 0.1630)(s + 0.1630)},
$$

a pair of real poles straddling the imaginary axis. The right-half-plane pole at $+0.1630\,\mathrm{rad/s}$ is the aerodynamic instability: $\ln2/0.163 = 4.25\,\mathrm{s}$ to double.

The nozzle does not move instantly. Put the $10\,\mathrm{Hz}$, $\zeta = 0.7$ actuator of lesson 2 in front of it, $A(s) = 3947.8/(s^2 + 87.96s + 3947.8)$, and multiply:

$$
\frac{\Theta(s)}{\Delta_c(s)} = \frac{6889}{(s^2 - 0.02657)(s^2 + 87.96s + 3947.8)}.
$$

Four poles — $\pm0.1630$ and $-43.98 \pm 44.87j$ — no zeros, relative degree 4. Expanded, the denominator is $s^4 + 87.96s^3 + 3947.8s^2 - 2.337s - 104.88$; the two negative coefficients are a giveaway that a root lies in the right half plane, since a polynomial with all roots in the left half plane has all coefficients positive.

Now the trap. The expression $G(0) = 6889/(-104.88) = -65.7$ is a perfectly finite number, and it is meaningless. The final value theorem needs every pole of $sG(s)/s = G(s)$ in the open left half plane, and this $G$ has one at $+0.163$. A $1^\circ$ nozzle step does not drive the vehicle to $-65.7^\circ$ and stay there; it drives it to $-65.7^\circ + Ce^{0.163t} + \cdots$, and the growing term takes over within seconds. Always check the poles before you take the limit.
:::

::: note
The same $G(s)$ can be reached from a state-space model. Writing the pitch equations with $\mathbf{x} = [\theta, \dot{\theta}]^T$ gives $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ \mu_\alpha & 0\end{bmatrix}$, $\mathbf{B} = [0, \mu_\delta]^T$, $\mathbf{C} = [1, 0]$, and $\det(s\mathbf{I} - \mathbf{A}) = s^2 - \mu_\alpha$ — the same denominator, and the eigenvalues of $\mathbf{A}$ are the same $\pm0.163$. Which description you carry depends on what you are doing: state space keeps the internal variables and scales to many inputs and outputs, the transfer function keeps only the input-output map and makes loop algebra trivial.
:::

## Check yourself

::: check
A sensor obeys $0.02\,\dot{y} + y = 0.02\,\dot{u} + 1.4u$. Write $G(s)$ in all three forms, give the relative degree, and say what the step response does at $t = 0^+$.
:::

::: answer
Transforming at rest, $(0.02s + 1)Y = (0.02s + 1.4)U$, so in expanded form $G(s) = (0.02s + 1.4)/(0.02s + 1)$. Pole-zero form: divide numerator and denominator leading coefficients out, $G(s) = 1\cdot(s + 70)/(s + 50)$, so $k = 1$, one zero at $-70$, one pole at $-50$. Time-constant form: $G(s) = 1.4\,(1 + s/70)/(1 + s/50)$, so $K = G(0) = 1.4$. Relative degree is $1 - 1 = 0$: the system is proper but not strictly proper. By the initial value theorem the step response starts at $\lim_{s\to\infty}sG(s)/s = \lim G = 0.02/0.02 = 1$, then relaxes to $1.4$. A relative-degree-zero system passes a step's jump straight through.
:::

::: check
Why does an unstable plant have no measurable open-loop frequency response, and what does an engineer do instead?
:::

::: answer
The Laplace integral $\int_0^\infty h(\tau)e^{-s\tau}d\tau$ converges only for $\operatorname{Re}s$ greater than the largest real part among the poles. With a pole at $+0.163$, convergence requires $\operatorname{Re}s > 0.163$, so the imaginary axis lies outside the region of convergence and $G(j\omega)$ is a formal continuation, not the limit of a physical experiment. Physically, injecting a sine into an open-loop unstable vehicle produces a diverging response that saturates the actuator before any steady sinusoid appears. The standard method is to close a stabilising loop, inject the test signal inside the loop, measure the closed-loop response, and recover the plant by dividing out the known controller and loop structure.
:::

::: check
A thrust-vector actuator's manufacturer quotes "DC gain 1.0, bandwidth 10 Hz, damping 0.7". Write a transfer function consistent with that, and state its relative degree and $h(0^+)$.
:::

::: answer
A second-order model with unit DC gain is $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$. Reading $\omega_n = 2\pi(10) = 62.83\,\mathrm{rad/s}$ and $\zeta = 0.7$ gives $G(s) = 3948/(s^2 + 87.96s + 3948)$. Relative degree is $2 - 0 = 2$, so $h(0^+) = \lim_{s\to\infty}sG(s) = 0$: the nozzle's velocity starts at zero and the step response leaves the origin flat. (Strictly, "bandwidth" quoted this way usually means $\omega_n$; if the manufacturer means the $-3\,\mathrm{dB}$ frequency the two differ, and lesson 9 gives the conversion.)
:::

::: check
Compute the transfer function from wheel voltage to *spacecraft* attitude, given the motor of the first worked example driving a wheel whose reaction torque acts on a spacecraft of inertia $I_{sc} = 1200\,\mathrm{kg\,m^2}$. Take the reaction torque as $-J\dot{\omega}$ and ignore friction on the spacecraft side.
:::

::: answer
The torque on the spacecraft is $T_{sc} = -J\dot{\omega}$, so $I_{sc}\ddot{\theta} = -J\dot{\omega}$ and, transforming, $I_{sc}s^2\Theta = -Js\Omega$, that is $\Theta = -\dfrac{J}{I_{sc}s}\Omega$. Cascading with $\Omega/V$ from the example,

$$
\frac{\Theta(s)}{V(s)} = -\frac{J}{I_{sc}s}\cdot\frac{3054}{(s + 0.0529)(s + 2083.3)} = \frac{-0.0243}{s(s + 0.0529)(s + 2083.3)}.
$$

The numerator constant is $-(9.55\times10^{-3}/1200)(3054) = -0.0243$. Relative degree 3, a pole at the origin from the integration, and a negative sign because the spacecraft turns opposite to the wheel. There is no DC gain: a constant voltage spins the wheel to a constant rate, which produces no steady reaction torque, so the attitude stops changing — but the pole at $s = 0$ means the attitude it stops at depends on the whole history, which is momentum storage stated in transfer-function language.
:::

::: check
Explain why $G(s) = (s^2 + 4)/(s + 3)$ cannot describe a physical system, and give a proper transfer function with the same behaviour up to $10\,\mathrm{rad/s}$.
:::

::: answer
The numerator degree exceeds the denominator degree, so the relative degree is $-1$ and $|G(j\omega)| \to \infty$ as $\omega \to \infty$: infinite gain at infinite frequency, meaning infinite output power from a bounded input and unbounded amplification of any sensor noise. Nothing built from real components does that. Add enough fast poles to make it at least proper, placed far above the band of interest — for example $G(s) = (s^2 + 4)/\left[(s + 3)(1 + s/1000)\right]$, whose extra pole at $1000\,\mathrm{rad/s}$ changes the magnitude by less than 0.005% and the phase by less than $0.6^\circ$ at $10\,\mathrm{rad/s}$, but which rolls the response off at high frequency instead of letting it grow.
:::

## Summary

| Item | Statement |
| --- | --- |
| Laplace transform | $F(s) = \int_0^\infty f(t)e^{-st}dt$, convergent for $\operatorname{Re}s > \sigma_0$ |
| Region of convergence | $\sigma_0 = $ largest real part among the poles; contains the $j\omega$ axis only if stable |
| Derivative rule | $\mathcal{L}\{\dot{f}\} = sF - f(0)$; with zero initial conditions, $d/dt \leftrightarrow s$ |
| Transfer function | $G(s) = Y(s)/U(s)$ with zero initial conditions $= \mathcal{L}\{h(t)\}$; LTI only |
| From state space | $G(s) = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B} + D$; denominator $\det(s\mathbf{I} - \mathbf{A})$ |
| Relative degree | $n - m$; proper if $m \le n$, strictly proper if $m < n$; improper is unphysical |
| Initial value | $h(0^+) = \lim_{s\to\infty}sG(s)$ |
| Final value | $f(\infty) = \lim_{s\to 0}sF(s)$, valid only if all poles of $sF$ are in the open left half plane |
| Pole-zero form | $G = k\prod(s - z_i)/\prod(s - p_i)$ — for root locus |
| Time-constant form | $G = K\prod(1 + s/z_i)/\prod(1 + s/p_i)$, $K = G(0)$ — for Bode sketching |

The next lesson reads the physics back out of those factored forms: what each pole and each zero does to a response, what the DC gain means and when it means nothing, and why a pole and a zero that appear to cancel sometimes do not.
