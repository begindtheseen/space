---
id: l03-laplace-and-the-transfer-function
title: The Laplace transform and the transfer function
minutes: 19
covers:
  - "The Laplace transform and the transfer function"
---

Long multiplication is tedious. Before calculators, people used logarithms to swap it for addition: look up the logs, add them, look up the answer. A hard operation became an easy one, in a different world, and you came back at the end. The Laplace transform does the same thing for control engineers. It swaps the convolution integral of lesson 2 for plain multiplication.

That matters because the integrals pile up fast. Chaining two systems means convolving two impulse responses. Closing a feedback loop means solving an integral equation. In the Laplace world, both become multiplying and dividing polynomials. That is the only reason control design is practical enough to do on a whiteboard in a design review.

Module 8 built the transform from its integral and used it to solve differential equations. This lesson comes at it from the other side — from the exponentials of lesson 1 — because that explains *why* the variable is called $s$ and why the answer is a ratio of polynomials. Then it pins down the vocabulary for the rest of the tier: proper and strictly proper, relative degree, and three ways of writing the same $G(s)$. All three matter. The pole-zero form is what a root locus needs. The time-constant form is what you sketch a Bode plot from. The expanded form is what you type into code.

By the end you should be able to take a real device — a gimbaled nozzle, a reaction-wheel motor, a vehicle that is unstable in pitch — and write its transfer function from its equations of motion, in whichever form the next step needs.

## Where $s$ comes from

Lesson 1 showed that if an LTI system is fed $e^{st}$, out comes $G(s)e^{st}$, with

$$
G(s) = \int_0^\infty h(\tau)\,e^{-s\tau}\,d\tau.
$$

That integral *is* the **[[Laplace transform|laplace-name]]** of $h$. So the transform is not a trick pulled from a hat. It is the rule that tells you, for each exponential signal, the complex number the system multiplies it by.

What kinds of signal are these exponentials? Write $s = \sigma + j\omega$ ("sigma plus j omega"), with $j = \sqrt{-1}$. Then

$$
e^{st} = e^{\sigma t}(\cos\omega t + j\sin\omega t).
$$

The real part $\sigma$ sets growth or decay. The imaginary part $\omega$ sets how fast it wiggles. So as $s$ roams over the [[complex plane|s-plane]], $e^{st}$ covers signals that grow, die away, or oscillate steadily. One function $G(s)$ of one complex variable holds the system's response to all of them.

For any signal $f(t)$ that starts at $t = 0$, the **one-sided Laplace transform** is

$$
F(s) = \mathcal{L}\{f\}(s) = \int_0^\infty f(t)e^{-st}\,dt.
$$

Read $\mathcal{L}\{f\}$ as "the Laplace transform of f". By custom the transform gets the capital letter: $f$ becomes $F$, $y$ becomes $Y$.

### Where the integral works

The integral does not always give a finite answer. The factor $e^{-st}$ must shrink faster than $f$ can grow. So it works only for $s$ in a half plane, $\operatorname{Re}s > \sigma_0$, called the **[[region of convergence|roc]]**.

Take $f = e^{-at}$. Then $\int_0^\infty e^{-at}e^{-st}\,dt = \int_0^\infty e^{-(s + a)t}\,dt$. That is finite only when $\operatorname{Re}s > -a$, and then it equals $1/(s + a)$. In general $\sigma_0$ is the largest real part among the signal's exponential pieces — which, for a system's impulse response, is the largest real part among its poles.

This has a real consequence. If the system is stable, every pole has $\operatorname{Re}s < 0$. The region of convergence then includes the imaginary axis, so $G(j\omega)$ exists. You can measure the frequency response by shaking the system with sine waves.

If the system has a pole in the right half plane — a launch vehicle that is unstable in pitch, say — the imaginary axis lies *outside* the region of convergence. Then $G(j\omega)$ is a formula you can write down, not an integral that converges. And no open-loop test can measure it, because the vehicle diverges before a single sine wave finishes. So an unstable plant's frequency response is measured [[with a loop closed around it|closed-loop-id]], and the known controller is divided back out.

### Derivatives become multiplication by $s$

Two properties do all the work. The first is **linearity**: $\mathcal{L}\{af + bg\} = aF + bG$. The second is the **derivative rule**:

$$
\mathcal{L}\{\dot{f}\} = sF(s) - f(0), \qquad \mathcal{L}\{\ddot{f}\} = s^2F(s) - sf(0) - \dot{f}(0).
$$

And integrating gives $\mathcal{L}\left\{\int_0^tf\right\} = F(s)/s$. So with every starting value zero, differentiating is multiplying by $s$ and integrating is dividing by $s$. Calculus has turned into algebra.

::: note Why it has to be true
The derivative rule is integration by parts, $\int u\,dv = uv - \int v\,du$. Take $u = e^{-st}$ and $dv = \dot{f}\,dt$, so $v = f$ and $du = -se^{-st}\,dt$:

$$
\int_0^\infty \dot{f}e^{-st}\,dt = \Bigl[f(t)e^{-st}\Bigr]_0^\infty + s\int_0^\infty f(t)e^{-st}\,dt = \bigl(0 - f(0)\bigr) + sF(s).
$$

The term at infinity vanishes inside the region of convergence, because there $e^{-st}$ beats $f$. Apply the rule twice for $\ddot{f}$: $\mathcal{L}\{\ddot{f}\} = s\,\mathcal{L}\{\dot{f}\} - \dot{f}(0) = s^2F - sf(0) - \dot{f}(0)$.
:::

## The transfer function

Take an LTI system at rest and transform its governing equation. A differential equation

$$
a_ny^{(n)} + \cdots + a_1\dot{y} + a_0y = b_mu^{(m)} + \cdots + b_1\dot{u} + b_0u
$$

(where $y^{(n)}$ means the $n$-th derivative of $y$) becomes, with every derivative turned into a power of $s$,

$$
D(s)Y(s) = N(s)U(s), \qquad D(s) = a_ns^n + \cdots + a_0, \quad N(s) = b_ms^m + \cdots + b_0.
$$

Divide, and the ratio of output to input is a ratio of two polynomials: $G(s) = N(s)/D(s)$. The roots of $D$ are the **poles**; the roots of $N$ are the **zeros**.

::: key
**Transfer function**: $G(s) = Y(s)/U(s)$, the Laplace transform of the output over the input **with all initial conditions zero**. It exists only for LTI systems. Equivalently $G(s) = \mathcal{L}\{h(t)\}$, the transform of the impulse response, and the zero-state response to any input is $Y(s) = G(s)U(s)$.
:::

The same recipe works on a **state-space** model, $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$, $y = \mathbf{C}\mathbf{x} + Du$. Transform with zero starting state, solve for $\mathbf{X}$, and substitute:

$$
G(s) = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B} + D.
$$

Its denominator is $\det(s\mathbf{I} - \mathbf{A})$, so the poles are the eigenvalues of $\mathbf{A}$ — unless a factor in the numerator cancels one.

### Proper, strictly proper, relative degree

Let $n = \deg D$ (the highest power of $s$ in the denominator) and $m = \deg N$. The **relative degree** is $n - m$. Then:

- $m \le n$: **[[proper|proper-word]]**. $G(s)$ settles to a finite value as $|s| \to \infty$.
- $m < n$: **strictly proper**. $G \to 0$ at high frequency; relative degree at least one.
- $m > n$: **improper**. $|G| \to \infty$ as frequency rises.

Every physical system is proper, and almost all are strictly proper, because no real device has infinite gain at infinite frequency.

A pure differentiator, $G = s$, is improper, and it cannot be built. Feed it a tiny $1\,\mathrm{mrad}$ sensor ripple at $10\,\mathrm{kHz}$. The derivative of $A\sin\omega t$ has size $A\omega$, so out comes $0.001 \times 2\pi \times 10^4 = 62.8\,\mathrm{rad/s}$ — a huge fake rate. Real differentiators are always filtered, $G = s/(\tau s + 1)$. That is proper, and it stops rising above $1/\tau$.

Relative degree also tells you how the response starts. By the initial value theorem (below), $h(0^+) = \lim_{s\to\infty}sG(s)$. So relative degree one gives a step response with a nonzero starting slope, and relative degree two or more gives one that leaves the origin flat. On a vehicle, relative degree counts the integrations between command and measurement. Torque to rate is one. Torque to attitude is two. Add a second-order actuator in front and it is four.

### The initial and final value theorems, and when they lie

Two shortcuts read the start and the end of a signal straight from its transform:

$$
f(0^+) = \lim_{s\to\infty}sF(s), \qquad f(\infty) = \lim_{s\to 0}sF(s).
$$

The initial value theorem is safe for any proper $F$. The final value theorem is valid **only if $sF(s)$ has all its poles strictly in the left half plane**. Ignore that and it lies to you:

- $F = 1/(s - 1)$: the theorem gives 0, but $f = e^{t}$ runs away.
- $F = \omega/(s^2 + \omega^2)$: the theorem gives 0, but $f = \sin\omega t$ keeps oscillating forever.

Check the poles before you take the limit. It is not optional. The second worked example below shows a plausible-looking wrong answer that comes from forgetting.

## Three ways to write the same $G$

Think of the number one half. You can write it $\tfrac{1}{2}$, $0.5$ or $50\%$. Same amount, three outfits, each handy for a different job. Transfer functions are the same. Take this one, from a filtered rate signal:

$$
G(s) = \frac{40s + 80}{s^2 + 22s + 40}.
$$

**Expanded polynomial form** is what you have now. It is what numerical libraries want: two lists of coefficients, highest power first.

**Pole-zero (root-locus) form** factors both polynomials and pulls out the ratio of leading coefficients:

$$
G(s) = \frac{k\,(s - z_1)\cdots}{(s - p_1)\cdots} = \frac{40(s + 2)}{(s + 2)(s + 20)}.
$$

Here $k = 40$. Each factor $(s - z_i)$ shows a zero at $z_i$; each $(s - p_i)$ shows a pole at $p_i$. This is what a root locus is drawn from. It also reveals that this $G$ has a pole and a zero at the same spot, $-2$. That is a **cancellation**, and lesson 4 explains why it can be dangerous.

**Time-constant (Bode) form** rescales every factor so its constant term is one:

$$
G(s) = K\,\frac{(1 + s/z_1)\cdots}{(1 + s/p_1)\cdots} = 2\,\frac{(1 + s/2)}{(1 + s/2)(1 + s/20)}.
$$

(In this form each factor is written with the *size* of its corner, $1 + s/|z_i|$ or $1 + s/|p_i|$, for a pole or zero in the left half plane.) The front number is $K = G(0) = 80/40 = 2$, the DC gain. This is the form to [[sketch a Bode plot from|bode-form]]. Each factor is about 1 ($0\,\mathrm{dB}$) below its corner frequency and adds its slope only above it, and $K$ sets the height of the whole curve.

Notice that $k$ and $K$ are different numbers — 40 and 2 here. Mixing them up is the commonest way to draw a hand-sketched Bode plot at the wrong height.

::: warning Two gains, and one that may not exist
With no pole or zero at the origin, the two gains are linked by $K = G(0) = k\prod(-z_i)/\prod(-p_i)$. When every pole and zero is in the left half plane, each $-z_i$ and $-p_i$ is positive (or comes in complex pairs whose product is positive), so this is $K = k\prod|z_i|/\prod|p_i|$. A right-half-plane zero flips the sign: for $(1 - s)/(1 + s)$, $k = -1$ but $K = +1$.

When $G$ has an integrator there is no finite DC gain at all. The time-constant form is written with the $1/s$ pulled out, for example $G(s) = \dfrac{10}{s(1 + s/10)}$. The front number, 10, is then the value of $\omega|G(j\omega)|$ at low frequency, not $G(0)$. Lesson 9 uses exactly this to place the low-frequency line of a Bode plot.
:::

::: example The transfer function of a reaction-wheel motor
A brushless wheel motor has one electrical equation and one mechanical one. The symbols: armature voltage $V$, current $i$, wheel speed $\omega$, resistance $R = 2.5\,\Omega$, inductance $L = 1.2\,\mathrm{mH}$, torque constant $K_t = 0.035\,\mathrm{N\,m/A}$, **[[back-emf|back-emf]]** constant $K_e = 0.035\,\mathrm{V\,s/rad}$, rotor inertia $J = 9.55\times10^{-3}\,\mathrm{kg\,m^2}$, and viscous friction $b = 1.5\times10^{-5}\,\mathrm{N\,m\,s/rad}$:

$$
V = Ri + L\frac{di}{dt} + K_e\omega, \qquad J\dot{\omega} = K_ti - b\omega.
$$

**Step 1: transform** with zero starting values. Each $d/dt$ becomes $s$:

$$
V = (Ls + R)I + K_e\Omega, \qquad (Js + b)\Omega = K_tI.
$$

**Step 2: eliminate the current.** From the second, $I = (Js + b)\Omega/K_t$. Put that into the first and solve for $\Omega/V$:

$$
\frac{\Omega(s)}{V(s)} = \frac{K_t}{(Ls + R)(Js + b) + K_tK_e}.
$$

**Step 3: expand.** The denominator is $LJ\,s^2 + (Lb + RJ)s + (Rb + K_tK_e)$. With numbers: $LJ = 1.146\times10^{-5}$; $Lb + RJ = 2.3875\times10^{-2}$; and $Rb + K_tK_e = 3.75\times10^{-5} + 1.225\times10^{-3} = 1.2625\times10^{-3}$. So in **expanded** form

$$
G(s) = \frac{0.035}{1.146\times10^{-5}s^2 + 2.3875\times10^{-2}s + 1.2625\times10^{-3}}.
$$

**Step 4: factor.** Divide top and bottom by $LJ$ to make the denominator **[[monic|monic]]**: $s^2 + 2083.3s + 110.17$. Its roots are $-2083.3$ and $-0.0529\,\mathrm{rad/s}$. So in **pole-zero** form, with $k = K_t/(LJ) = 3054$,

$$
G(s) = \frac{3054}{(s + 0.0529)(s + 2083.3)}.
$$

The fast pole is electrical: close to $-R/L = -2083\,\mathrm{rad/s}$, a time constant of $0.48\,\mathrm{ms}$. The slow pole is mechanical, a time constant of $1/0.0529 = 18.9\,\mathrm{s}$. It is set almost entirely by back-emf, not friction: $K_tK_e/(Rb) = 32.7$. The two poles are about 39,000 times apart, which lesson 6 uses to throw one of them away.

**Step 5: time-constant form.**

$$
G(s) = \frac{27.72}{(1 + s/0.0529)(1 + s/2083.3)}\ \ \mathrm{(rad/s)/V}.
$$

The front number is the DC gain: $K_t/(Rb + K_tK_e) = 0.035/(1.2625\times10^{-3}) = 27.72\,(\mathrm{rad/s})$ per volt. On a $28\,\mathrm{V}$ supply the wheel tops out at $28 \times 27.72 = 776\,\mathrm{rad/s}$, about $7410\,\mathrm{rpm}$. That top speed sets how much momentum the spacecraft can store before the wheel saturates.

**Check.** All three forms are the same function. At $s = 0$: expanded gives $0.035/(1.2625\times10^{-3}) = 27.72$; pole-zero gives $3054/(0.0529 \times 2083.3) = 27.7$; time-constant gives $27.72$. They agree.
:::

::: example A launch vehicle's pitch transfer function, and a final value that lies
Lesson 1 linearized a vehicle at max q to $\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta$, with $\mu_\alpha = 0.02657\,\mathrm{s^{-2}}$ and $\mu_\delta = 1.745\,\mathrm{s^{-2}}$. Here $\theta$ is the pitch error and $\delta$ the nozzle angle.

**The rigid vehicle.** Transform with zero starting values: $s^2\Theta = \mu_\alpha\Theta + \mu_\delta\Delta$. Collect the $\Theta$ terms and divide:

$$
\frac{\Theta(s)}{\Delta(s)} = \frac{\mu_\delta}{s^2 - \mu_\alpha} = \frac{1.745}{(s - 0.1630)(s + 0.1630)}.
$$

Two real poles, one on each side of the imaginary axis. The one at $+0.1630\,\mathrm{rad/s}$ is the aerodynamic instability: $\ln2/0.163 = 4.25\,\mathrm{s}$ to double.

**Add the actuator.** The nozzle does not move instantly. Put lesson 2's $10\,\mathrm{Hz}$, $\zeta = 0.7$ actuator in front: $A(s) = 3947.8/(s^2 + 87.96s + 3947.8)$. Blocks in a row multiply, so

$$
\frac{\Theta(s)}{\Delta_c(s)} = \frac{1.745 \times 3947.8}{(s^2 - 0.02657)(s^2 + 87.96s + 3947.8)} = \frac{6889}{(s^2 - 0.02657)(s^2 + 87.96s + 3947.8)}.
$$

Four poles — $\pm0.1630$ and $-43.98 \pm 44.87j$ — no zeros, relative degree 4. Multiplied out, the denominator is $s^4 + 87.96s^3 + 3947.8s^2 - 2.337s - 104.9$. The two negative coefficients give the game away: a polynomial whose roots all lie in the left half plane has [[all its coefficients positive|coefficient-test]], so at least one root must be in the right half plane.

**The trap.** Plug in $s = 0$ and you get $G(0) = 6889/(-104.9) = -65.7$. It is a perfectly finite number, and it means nothing. The final value theorem needs every pole of $sG(s)/s = G(s)$ in the open left half plane, and this $G$ has one at $+0.163$. A $1^\circ$ nozzle step does not drive the vehicle to $-65.7^\circ$ and leave it there. It drives it toward $-65.7^\circ + Ce^{0.163t} + \cdots$, and the growing term takes over within seconds. Always check the poles before taking the limit.
:::

::: note Same answer from state space
Write the pitch equation with state $\mathbf{x} = [\theta, \dot{\theta}]^T$. Then $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ \mu_\alpha & 0\end{bmatrix}$, $\mathbf{B} = [0, \mu_\delta]^T$, $\mathbf{C} = [1, 0]$, and $\det(s\mathbf{I} - \mathbf{A}) = s^2 - \mu_\alpha$. Same denominator, and the eigenvalues of $\mathbf{A}$ are the same $\pm0.163$. Which description you carry depends on the job. State space keeps the internal variables and handles many inputs and outputs. The transfer function keeps only the input-to-output map, and makes loop algebra easy.
:::

## Check yourself

::: check
A sensor obeys $0.02\,\dot{y} + y = 0.02\,\dot{u} + 1.4u$. Write $G(s)$ in all three forms, give the relative degree, and say what the step response does at $t = 0^+$.
:::

::: answer
Transform at rest: $(0.02s + 1)Y = (0.02s + 1.4)U$.

**Expanded:** $G(s) = (0.02s + 1.4)/(0.02s + 1)$.

**Pole-zero:** divide the top by its leading coefficient $0.02$ and the bottom by its leading coefficient $0.02$. Then $G(s) = 1\cdot(s + 70)/(s + 50)$: $k = 1$, a zero at $-70$, a pole at $-50$.

**Time-constant:** $G(s) = 1.4\,(1 + s/70)/(1 + s/50)$, so $K = G(0) = 1.4$.

Relative degree is $1 - 1 = 0$: proper but not strictly proper. By the initial value theorem, the step response starts at $\lim_{s\to\infty}sG(s)\cdot\tfrac{1}{s} = \lim_{s\to\infty} G(s) = 0.02/0.02 = 1$. Then it relaxes to $1.4$. A relative-degree-zero system passes a step's jump straight through.
:::

::: check
Why does an unstable plant have no measurable open-loop frequency response, and what does an engineer do instead?
:::

::: answer
The Laplace integral $\int_0^\infty h(\tau)e^{-s\tau}d\tau$ converges only when $\operatorname{Re}s$ is bigger than the largest real part among the poles. With a pole at $+0.163$, that means $\operatorname{Re}s > 0.163$. The imaginary axis is outside that region, so $G(j\omega)$ is a formula extended past where the integral works, not the result of any physical experiment.

Physically: inject a sine wave into an open-loop unstable vehicle, and the response diverges and saturates the actuator before any steady sine wave appears.

The standard method: close a stabilizing loop, inject the test signal inside it, measure the closed-loop response, and recover the plant by dividing out the known controller and loop structure.
:::

::: check
A thrust-vector actuator's maker quotes "DC gain 1.0, bandwidth 10 Hz, damping 0.7". Write a transfer function consistent with that, and give its relative degree and $h(0^+)$.
:::

::: answer
A second-order model with unit DC gain is $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$. Read $\omega_n = 2\pi(10) = 62.83\,\mathrm{rad/s}$ and $\zeta = 0.7$. Then $\omega_n^2 = 3948$ and $2\zeta\omega_n = 87.96$, so $G(s) = 3948/(s^2 + 87.96s + 3948)$.

Relative degree is $2 - 0 = 2$, so $h(0^+) = \lim_{s\to\infty}sG(s) = 0$. The nozzle's speed starts at zero, and the step response leaves the origin flat.

(We have read "bandwidth" as $\omega_n$. If the maker means the frequency where the gain has fallen by $3\,\mathrm{dB}$, the two can differ — but at $\zeta = 0.7$ they happen to agree within about 1%. Lesson 9 gives the conversion.)
:::

::: check
Find the transfer function from wheel voltage to *spacecraft* attitude, for the motor of the first worked example driving a wheel inside a spacecraft of inertia $I_{sc} = 1200\,\mathrm{kg\,m^2}$. Take the torque on the spacecraft as $-J\dot{\omega}$ and ignore friction on the spacecraft side. What does a constant voltage do?
:::

::: answer
The torque on the spacecraft is $-J\dot{\omega}$, so $I_{sc}\ddot{\theta} = -J\dot{\omega}$. Transform: $I_{sc}s^2\Theta = -Js\Omega$. Divide by $I_{sc}s^2$: $\Theta = -\dfrac{J}{I_{sc}s}\Omega$.

Chain it with $\Omega/V$ from the example:

$$
\frac{\Theta(s)}{V(s)} = -\frac{J}{I_{sc}s}\cdot\frac{3054}{(s + 0.0529)(s + 2083.3)} = \frac{-0.0243}{s(s + 0.0529)(s + 2083.3)}.
$$

The numerator is $-(9.55\times10^{-3}/1200)(3054) = -0.0243$. Relative degree 3. A pole at the origin, from the integration. A minus sign, because the spacecraft turns the opposite way to the wheel.

There is no DC gain, because of the pole at $s = 0$. A constant voltage spins the wheel up to a constant speed — $27.72\,\mathrm{rad/s}$ per volt. Once the wheel stops speeding up, there is no more torque, so the spacecraft stops *speeding up* too. But it keeps turning at a steady rate: $J\omega_{wheel}/I_{sc} = 9.55\times10^{-3} \times 27.72/1200 = 2.2\times10^{-4}\,\mathrm{rad/s}$ per volt, about $0.013\,^\circ/\mathrm{s}$. The attitude ramps forever. The wheel's momentum and the spacecraft's are equal and opposite — which is momentum storage, in transfer-function language. To make the spacecraft stop turning, the wheel speed must come back to where it started.
:::

::: check
Explain why $G(s) = (s^2 + 4)/(s + 3)$ cannot describe a physical system, and give a proper transfer function that behaves the same up to $10\,\mathrm{rad/s}$.
:::

::: answer
The top has higher degree than the bottom, so the relative degree is $-1$ and $|G(j\omega)| \to \infty$ as $\omega \to \infty$. That is infinite gain at infinite frequency: unlimited amplification of any sensor noise, and unlimited output power from a bounded input. Nothing built from real parts does that.

Fix it by adding a fast pole far above the band you care about, for example $G(s) = (s^2 + 4)/\left[(s + 3)(1 + s/1000)\right]$. At $10\,\mathrm{rad/s}$ the extra factor has size $|1 + 0.01j| = 1.00005$ and angle $\arctan 0.01 = 0.57^\circ$, so it changes the magnitude by about 0.005% and the phase by less than $0.6^\circ$. This version is proper: at high frequency it levels off at a finite gain of $1000$ instead of growing without limit. To make it actually roll off (strictly proper), add a second fast pole.
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

The next lesson reads the physics back out of those factored forms: what each pole and each zero does to a response, what the DC gain means and when it means nothing, and why a pole and a zero that seem to cancel sometimes do not.

::: context laplace-name Named for a French astronomer
Pierre-Simon Laplace (1749–1827) was a French mathematician and astronomer who used integrals of this kind in his work on probability. The engineering use came much later. In the 1880s and 1890s the English engineer Oliver Heaviside solved circuit equations by treating $d/dt$ as if it were an ordinary number he could multiply and divide by. It worked, but nobody could say why. In the early twentieth century mathematicians showed that the Laplace transform justified his rules, and that is the version you learn today.
:::

::: context s-plane A map of every kind of motion
Every point $s$ in the complex plane stands for one signal $e^{st}$. Left of the vertical axis, signals die away. Right of it, they grow. On the axis, they neither grow nor shrink. Height above the real axis sets how fast they wiggle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 192" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="185" x2="180" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="343" y="166" font-size="11" fill="#6c7a93" text-anchor="end">real part σ</text>
  <text x="186" y="22" font-size="12" fill="#6c7a93" text-anchor="start">jω</text>
  <path d="M85,145 L95,155 M85,155 L95,145" stroke="#b4232c" stroke-width="2"/>
  <path d="M60.0,112.0 L61.5,113.0 L63.1,114.0 L64.6,114.9 L66.2,115.7 L67.7,116.5 L69.2,117.2 L70.8,117.8 L72.3,118.4 L73.8,119.0 L75.4,119.5 L76.9,120.0 L78.5,120.4 L80.0,120.8 L81.5,121.2 L83.1,121.6 L84.6,121.9 L86.2,122.2 L87.7,122.5 L89.2,122.8 L90.8,123.0 L92.3,123.2 L93.8,123.4 L95.4,123.6 L96.9,123.8 L98.5,124.0 L100.0,124.1 L101.5,124.2 L103.1,124.4 L104.6,124.5 L106.2,124.6 L107.7,124.7 L109.2,124.8 L110.8,124.9 L112.3,125.0 L113.8,125.1 L115.4,125.1 L116.9,125.2 L118.5,125.2 L120.0,125.3" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M265,145 L275,155 M265,155 L275,145" stroke="#b4232c" stroke-width="2"/>
  <path d="M240.0,125.3 L241.5,125.2 L243.1,125.2 L244.6,125.1 L246.2,125.1 L247.7,125.0 L249.2,124.9 L250.8,124.8 L252.3,124.7 L253.8,124.6 L255.4,124.5 L256.9,124.4 L258.5,124.2 L260.0,124.1 L261.5,124.0 L263.1,123.8 L264.6,123.6 L266.2,123.4 L267.7,123.2 L269.2,123.0 L270.8,122.8 L272.3,122.5 L273.8,122.2 L275.4,121.9 L276.9,121.6 L278.5,121.2 L280.0,120.8 L281.5,120.4 L283.1,120.0 L284.6,119.5 L286.2,119.0 L287.7,118.4 L289.2,117.8 L290.8,117.2 L292.3,116.5 L293.8,115.7 L295.4,114.9 L296.9,114.0 L298.5,113.0 L300.0,112.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M85,70 L95,80 M85,80 L95,70" stroke="#b4232c" stroke-width="2"/>
  <path d="M60.0,49.0 L61.5,45.4 L63.1,42.7 L64.6,40.9 L66.2,40.1 L67.7,40.3 L69.2,41.4 L70.8,43.1 L72.3,45.2 L73.8,47.4 L75.4,49.5 L76.9,51.3 L78.5,52.7 L80.0,53.5 L81.5,53.8 L83.1,53.6 L84.6,52.9 L86.2,51.9 L87.7,50.8 L89.2,49.6 L90.8,48.5 L92.3,47.5 L93.8,46.9 L95.4,46.5 L96.9,46.4 L98.5,46.6 L100.0,47.0 L101.5,47.6 L103.1,48.2 L104.6,48.8 L106.2,49.4 L107.7,49.9 L109.2,50.2 L110.8,50.4 L112.3,50.4 L113.8,50.2 L115.4,50.0 L116.9,49.7 L118.5,49.3 L120.0,49.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M175,70 L185,80 M175,80 L185,70" stroke="#b4232c" stroke-width="2"/>
  <path d="M150.0,49.0 L151.5,45.2 L153.1,41.8 L154.6,39.1 L156.2,37.5 L157.7,37.0 L159.2,37.8 L160.8,39.7 L162.3,42.6 L163.8,46.1 L165.4,50.0 L166.9,53.7 L168.5,57.0 L170.0,59.4 L171.5,60.8 L173.1,60.9 L174.6,59.8 L176.2,57.7 L177.7,54.6 L179.2,50.9 L180.8,47.1 L182.3,43.4 L183.8,40.3 L185.4,38.2 L186.9,37.1 L188.5,37.2 L190.0,38.6 L191.5,41.0 L193.1,44.3 L194.6,48.0 L196.2,51.9 L197.7,55.4 L199.2,58.3 L200.8,60.2 L202.3,61.0 L203.8,60.5 L205.4,58.9 L206.9,56.2 L208.5,52.8 L210.0,49.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M265,70 L275,80 M265,80 L275,70" stroke="#b4232c" stroke-width="2"/>
  <path d="M240.0,49.0 L241.5,48.7 L243.1,48.3 L244.6,48.0 L246.2,47.8 L247.7,47.6 L249.2,47.6 L250.8,47.8 L252.3,48.1 L253.8,48.6 L255.4,49.2 L256.9,49.8 L258.5,50.4 L260.0,51.0 L261.5,51.4 L263.1,51.6 L264.6,51.5 L266.2,51.1 L267.7,50.5 L269.2,49.5 L270.8,48.4 L272.3,47.2 L273.8,46.1 L275.4,45.1 L276.9,44.4 L278.5,44.2 L280.0,44.5 L281.5,45.3 L283.1,46.7 L284.6,48.5 L286.2,50.6 L287.7,52.8 L289.2,54.9 L290.8,56.6 L292.3,57.7 L293.8,57.9 L295.4,57.1 L296.9,55.3 L298.5,52.6 L300.0,49.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="90" y="182" font-size="12" fill="#1f2a44" text-anchor="middle">left: dies away</text>
  <text x="270" y="182" font-size="12" fill="#1f2a44" text-anchor="middle">right: grows</text>
  <text x="180" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">on the axis: steady</text>
</svg>
```

Points below the real axis mirror the ones above; for real signals they come in pairs. This map is the stage for the rest of the module: poles plotted here tell you at a glance how a system moves.
:::

::: context roc Where the integral gives a finite answer
Suppose a signal has pieces that behave like $e^{-2t}$ and $e^{+t}$. The factor $e^{-st}$ can only tame both if its real part is bigger than the fastest-growing piece, so the integral works only to the right of $\operatorname{Re}s = 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <rect x="195" y="15" width="155" height="140" fill="#8fb8f0" opacity="0.6"/>
  <line x1="15" y1="85" x2="350" y2="85" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="150" y1="15" x2="150" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="195" y1="15" x2="195" y2="155" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M55,80 L65,90 M55,90 L65,80" stroke="#b4232c" stroke-width="2"/>
  <path d="M190,80 L200,90 M190,90 L200,80" stroke="#b4232c" stroke-width="2"/>
  <line x1="15" y1="82" x2="15" y2="88" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="60" y1="82" x2="60" y2="88" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="105" y1="82" x2="105" y2="88" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="195" y1="82" x2="195" y2="88" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="240" y1="82" x2="240" y2="88" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="285" y1="82" x2="285" y2="88" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="60" y="105" font-size="11" fill="#b4232c" text-anchor="middle">pole −2</text>
  <text x="199" y="105" font-size="11" fill="#b4232c" text-anchor="start">pole +1</text>
  <text x="289.5" y="40" font-size="12" fill="#1f2a44" text-anchor="middle">integral converges</text>
  <text x="289.5" y="56" font-size="12" fill="#1f2a44" text-anchor="middle">Re s &gt; 1</text>
  <text x="144" y="30" font-size="11" fill="#1f2a44" text-anchor="end">jω axis</text>
  <text x="144" y="45" font-size="11" fill="#1f2a44" text-anchor="end">left out</text>
  <text x="154" y="166" font-size="11" fill="#1f2a44" text-anchor="start">0</text>
  <text x="195" y="166" font-size="11" fill="#1d6fd1" text-anchor="middle">1</text>
</svg>
```

The imaginary axis, where the frequency response lives, is outside the shaded region. That is the picture behind "you cannot measure the frequency response of an unstable plant open loop".
:::

::: context closed-loop-id Flight-testing an unstable airplane
Unstable plants are tested all the time. The F-16 fighter was designed with relaxed static stability — not enough natural stability to fly without its computer — so its dynamics can only be measured with the flight-control loop running. Engineers add a small known test signal inside the loop, record what comes out at several points, and then use the known controller equations to work backwards to the airframe alone. Launch vehicles are handled the same way, in flight and in simulation.
:::

::: context proper-word Proper, like a proper fraction
The name echoes fractions. A proper fraction, like $\tfrac{3}{4}$, has a top smaller than its bottom, and its value stays below 1. A proper transfer function has a numerator degree no bigger than its denominator degree, and its size stays finite at high frequency. An "improper" one, like $\tfrac{7}{4}$, can be split into a whole part plus a proper remainder — and an improper $G(s)$ splits into a polynomial in $s$ (pure differentiators) plus a proper part. The differentiators are the part no hardware can build.
:::

::: context bode-form Reading the height and the corner
In time-constant form, $G(s) = 2/(1 + s/20)$ after the cancellation. Below $20\,\mathrm{rad/s}$ the factor $1 + s/20$ is close to 1, so the gain is $K = 2$, which is $20\log_{10}2 = 6\,\mathrm{dB}$. Above it, the gain falls by a factor of ten for every factor of ten in frequency: $-20\,\mathrm{dB}$ per decade.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 192" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="60" x2="330" y2="60" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 3"/>
  <text x="46" y="64" font-size="11" fill="#1f2a44" text-anchor="end">0 dB</text>
  <line x1="50" y1="120" x2="330" y2="120" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 3"/>
  <text x="46" y="124" font-size="11" fill="#1f2a44" text-anchor="end">−20 dB</text>
  <line x1="50" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50.0" y1="150" x2="50.0" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50.0" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">0.1</text>
  <line x1="120.0" y1="150" x2="120.0" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120.0" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <line x1="190.0" y1="150" x2="190.0" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190.0" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <line x1="260.0" y1="150" x2="260.0" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="260.0" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">100</text>
  <line x1="330.0" y1="150" x2="330.0" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330.0" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">1000</text>
  <path d="M50.0,41.9 L53.5,41.9 L57.1,41.9 L60.6,41.9 L64.2,41.9 L67.7,41.9 L71.3,41.9 L74.8,41.9 L78.4,41.9 L81.9,41.9 L85.4,41.9 L89.0,41.9 L92.5,41.9 L96.1,41.9 L99.6,41.9 L103.2,41.9 L106.7,41.9 L110.3,41.9 L113.8,41.9 L117.3,41.9 L120.9,41.9 L124.4,41.9 L128.0,41.9 L131.5,41.9 L135.1,41.9 L138.6,41.9 L142.2,41.9 L145.7,41.9 L149.2,41.9 L152.8,41.9 L156.3,41.9 L159.9,41.9 L163.4,41.9 L167.0,41.9 L170.5,41.9 L174.1,41.9 L177.6,41.9 L181.1,41.9 L184.7,41.9 L188.2,41.9 L191.8,41.9 L195.3,41.9 L198.9,41.9 L202.4,41.9 L205.9,41.9 L209.5,41.9 L213.0,43.6 L216.6,46.7 L220.1,49.7 L223.7,52.7 L227.2,55.8 L230.8,58.8 L234.3,61.9 L237.8,64.9 L241.4,67.9 L244.9,71.0 L248.5,74.0 L252.0,77.0 L255.6,80.1 L259.1,83.1 L262.7,86.2 L266.2,89.2 L269.7,92.2 L273.3,95.3 L276.8,98.3 L280.4,101.3 L283.9,104.4 L287.5,107.4 L291.0,110.5 L294.6,113.5 L298.1,116.5 L301.6,119.6 L305.2,122.6 L308.7,125.6 L312.3,128.7 L315.8,131.7 L319.4,134.8 L322.9,137.8 L326.5,140.8 L330.0,143.9" fill="none" stroke="#f2b880" stroke-width="3"/>
  <path d="M50.0,41.9 L53.5,41.9 L57.1,41.9 L60.6,41.9 L64.2,41.9 L67.7,41.9 L71.3,41.9 L74.8,41.9 L78.4,41.9 L81.9,41.9 L85.4,41.9 L89.0,41.9 L92.5,41.9 L96.1,41.9 L99.6,41.9 L103.2,41.9 L106.7,42.0 L110.3,42.0 L113.8,42.0 L117.3,42.0 L120.9,42.0 L124.4,42.0 L128.0,42.0 L131.5,42.0 L135.1,42.0 L138.6,42.0 L142.2,42.1 L145.7,42.1 L149.2,42.2 L152.8,42.2 L156.3,42.3 L159.9,42.4 L163.4,42.5 L167.0,42.6 L170.5,42.8 L174.1,43.0 L177.6,43.3 L181.1,43.6 L184.7,44.1 L188.2,44.6 L191.8,45.2 L195.3,45.9 L198.9,46.8 L202.4,47.8 L205.9,49.0 L209.5,50.3 L213.0,51.8 L216.6,53.5 L220.1,55.4 L223.7,57.5 L227.2,59.6 L230.8,62.0 L234.3,64.4 L237.8,67.0 L241.4,69.6 L244.9,72.3 L248.5,75.1 L252.0,77.9 L255.6,80.8 L259.1,83.7 L262.7,86.6 L266.2,89.5 L269.7,92.5 L273.3,95.5 L276.8,98.5 L280.4,101.5 L283.9,104.5 L287.5,107.5 L291.0,110.5 L294.6,113.6 L298.1,116.6 L301.6,119.6 L305.2,122.6 L308.7,125.7 L312.3,128.7 L315.8,131.7 L319.4,134.8 L322.9,137.8 L326.5,140.8 L330.0,143.9" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="211.1" y1="35.9" x2="211.1" y2="150" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 2"/>
  <text x="211.1" y="184" font-size="11" fill="#1f2a44" text-anchor="middle">corner 20 rad/s   (ω in rad/s)</text>
  <text x="70" y="33.94" font-size="11" fill="#1f2a44" text-anchor="start">K = 2 (6 dB)</text>
  <text x="318" y="136" font-size="11" fill="#1f2a44" text-anchor="end">−20 dB/decade</text>
</svg>
```

The orange lines are the hand sketch; the blue curve is the exact answer. They differ most at the corner, by $3\,\mathrm{dB}$.
:::

::: context back-emf A motor is also a generator
Spin an electric motor by hand and it makes a voltage — that is how a bicycle dynamo lights a lamp. So when the wheel motor spins, it pushes back against the supply with a voltage $K_e\omega$, the back electromotive force. The faster the wheel, the less voltage is left to drive current, and the less torque the motor makes. That self-braking is what stops the wheel at a top speed, and why back-emf, not friction, sets the slow pole here.
:::

::: context monic Leading coefficient one
A polynomial is **monic** when its highest power has coefficient 1, like $s^2 + 2083.3s + 110.17$. Making it monic does not change its roots — you divided the whole equation by the same number — but it makes the roots easy to read. For a monic quadratic $s^2 + bs + c$, the two roots add up to $-b$ and multiply to $c$. Here, $-2083.28$ and $-0.0529$ add to $-2083.33$ and multiply to $110.2$ — matching the coefficients.
:::

::: context coefficient-test A quick check for trouble
Multiply out $(s + a)(s + b)$ with $a$ and $b$ positive — poles in the left half plane — and every coefficient comes out positive: $s^2 + (a + b)s + ab$. That stays true with more factors and with complex pairs. So a missing or negative coefficient proves that some root is on the axis or in the right half plane. The reverse is not guaranteed: above second order, all-positive coefficients can still hide an unstable root. The complete test is the Routh–Hurwitz criterion, which you met in the ODE module and which the classical-control module puts to work.
:::
