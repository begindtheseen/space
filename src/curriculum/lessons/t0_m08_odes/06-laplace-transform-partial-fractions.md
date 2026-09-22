---
id: l06-laplace-transform-partial-fractions
title: The Laplace transform, partial fractions, and the value theorems
minutes: 22
covers:
  - "Laplace transform, inverse transform, partial fractions"
  - initial and final value theorems
---

Every method so far has needed a guess. Lesson 2 guessed an exponential, lesson 5 guessed a particular solution shaped like the input, and each time the initial conditions were fitted afterwards in a separate step. The **Laplace transform** removes the guessing. It converts a linear constant-coefficient differential equation, initial conditions and forcing included, into an algebraic equation in a new variable $s$; you solve that by ordinary algebra, then convert the answer back. Derivatives become multiplication by $s$, convolution becomes multiplication, and the characteristic polynomial of lesson 2 appears on its own as the denominator of the answer.

For a GNC engineer the transform is less a solution technique than a language. A plant, a sensor, an actuator and a controller are each described by a ratio of polynomials in $s$; a loop is closed by algebra on those ratios; the poles you learned to read in lesson 3 are the roots of the denominator. The next lesson makes that language precise as the transfer function. This lesson builds the tool: the definition, the short table of transforms you should know cold, the derivative rule that carries the initial conditions, the partial-fraction expansion that inverts the answer, and two theorems that read the first and last values of a response straight off its transform without inverting anything.

Work through the derivations rather than memorising the table. Each entry is one integral, and knowing where it came from is what lets you recover it when a slightly different function appears.

## The transform

The (one-sided) Laplace transform of a function $f(t)$ defined for $t \ge 0$ is

$$
F(s) = \mathcal{L}\{f(t)\} = \int_0^\infty f(t)\,e^{-st}\,dt,
$$

where $s = \sigma + j\omega$ is a complex variable. Since $st$ must be dimensionless, $s$ has units of $\mathrm{s^{-1}}$, the same as a pole — no coincidence, as you will see. Lower-case letters denote time functions and the matching capital denotes the transform: $y(t) \leftrightarrow Y(s)$, $u(t) \leftrightarrow U(s)$.

The integral converges when $\operatorname{Re}s$ is large enough that $e^{-st}$ beats whatever growth $f$ has; for $f = e^{at}$ it converges for $\operatorname{Re}s > a$. Every signal you will meet on a vehicle — bounded, exponential, polynomial, or products of these — has a transform, and once the integral has been done the resulting formula is used for all $s$ by analytic continuation. You will not need to think about convergence again except in one place: the final value theorem.

Two properties follow immediately from the integral. **Linearity**: $\mathcal{L}\{af + bg\} = aF + bG$ for constants $a$, $b$, because the integral is linear. **Uniqueness**: two continuous functions with the same transform are the same function, so a transform can be inverted unambiguously. Inversion is written $f(t) = \mathcal{L}^{-1}\{F(s)\}$; in practice it means recognising $F$ as a sum of entries in the table below, which is what partial fractions are for.

## Building the table

**The constant.** For $f(t) = 1$ (the **unit step**, zero before $t = 0$ and one after),

$$
\mathcal{L}\{1\} = \int_0^\infty e^{-st}\,dt = \left[-\frac{e^{-st}}{s}\right]_0^\infty = \frac{1}{s} \qquad (\operatorname{Re}s > 0).
$$

**The exponential.** For $f = e^{-at}$ with $a$ real or complex,

$$
\mathcal{L}\{e^{-at}\} = \int_0^\infty e^{-(s + a)t}\,dt = \frac{1}{s + a} \qquad (\operatorname{Re}s > -\operatorname{Re}a).
$$

This one entry generates most of the others. A decay $e^{-t/\tau}$ transforms to $1/(s + 1/\tau)$; the pole of the transform sits at $s = -a$, exactly where the mode $e^{-at}$ has its characteristic root. **A pole of the transform at $s = p$ means a term $e^{pt}$ in the time function** — that is the whole connection between this lesson and lesson 2.

**The ramp.** Integrate $\int_0^\infty te^{-st}dt$ by parts with $u = t$, $dv = e^{-st}dt$: the boundary term vanishes and what remains is $\frac{1}{s}\int_0^\infty e^{-st}dt = 1/s^2$. Repeating, $\mathcal{L}\{t^n\} = n!/s^{n+1}$.

**Sine and cosine.** Use Euler: $\cos\omega t = \tfrac{1}{2}(e^{j\omega t} + e^{-j\omega t})$ and apply the exponential entry with $a = \mp j\omega$:

$$
\mathcal{L}\{\cos\omega t\} = \frac{1}{2}\left(\frac{1}{s - j\omega} + \frac{1}{s + j\omega}\right) = \frac{s}{s^2 + \omega^2}, \qquad \mathcal{L}\{\sin\omega t\} = \frac{1}{2j}\left(\frac{1}{s - j\omega} - \frac{1}{s + j\omega}\right) = \frac{\omega}{s^2 + \omega^2}.
$$

The poles are at $\pm j\omega$, on the imaginary axis: a sustained oscillation, as lesson 2 said.

**The $s$-shift.** Multiplying a time function by $e^{-at}$ shifts its transform: $\mathcal{L}\{e^{-at}f(t)\} = \int_0^\infty f(t)e^{-(s + a)t}dt = F(s + a)$. Apply it to sine and cosine, and to the ramp:

$$
\mathcal{L}\{e^{-at}\cos\omega t\} = \frac{s + a}{(s + a)^2 + \omega^2}, \qquad \mathcal{L}\{e^{-at}\sin\omega t\} = \frac{\omega}{(s + a)^2 + \omega^2}, \qquad \mathcal{L}\{te^{-at}\} = \frac{1}{(s + a)^2}.
$$

These three are the underdamped mode, and the repeated-root mode, of lesson 2. The poles of the damped sinusoid are at $-a \pm j\omega$, where lesson 3 put $-\sigma \pm j\omega_d$.

**The unit impulse.** The **Dirac delta** $\delta(t)$ is the idealised very short, very tall pulse of unit area: $\int\delta(t)\,dt = 1$ with $\delta = 0$ for $t \ne 0$, and for any smooth $g$, $\int g(t)\delta(t)dt = g(0)$ (the **sifting property**). Setting $g = e^{-st}$ gives $\mathcal{L}\{\delta(t)\} = 1$. Lesson 7 makes the impulse the centre of attention; for now it is one more table entry.

**The time delay.** If $f$ is delayed by $T$ — zero until $t = T$, then $f(t - T)$ — substitute $t' = t - T$ in the integral to get $e^{-sT}F(s)$. A transport delay in a sensor or a data bus appears in the control track as the factor $e^{-sT}$.

::: key
Transform pairs to know: $1 \leftrightarrow 1/s$ · $e^{-at} \leftrightarrow 1/(s + a)$ · $t \leftrightarrow 1/s^2$ · $\sin\omega t \leftrightarrow \omega/(s^2 + \omega^2)$ · $\cos\omega t \leftrightarrow s/(s^2 + \omega^2)$ · $e^{-at}\sin\omega t \leftrightarrow \omega/((s + a)^2 + \omega^2)$ · $e^{-at}\cos\omega t \leftrightarrow (s + a)/((s + a)^2 + \omega^2)$ · $te^{-at} \leftrightarrow 1/(s + a)^2$ · $\delta(t) \leftrightarrow 1$ · $f(t - T) \leftrightarrow e^{-sT}F(s)$.
:::

## Derivatives: where the initial conditions go

The rule that makes the transform useful for differential equations comes from integrating by parts once:

$$
\mathcal{L}\{\dot{f}\} = \int_0^\infty \dot{f}e^{-st}dt = \Bigl[f e^{-st}\Bigr]_0^\infty + s\int_0^\infty fe^{-st}dt = sF(s) - f(0).
$$

The boundary term at infinity vanishes wherever the transform converges, and the one at zero delivers the initial value with a minus sign. Apply the rule to $\dot{f}$ itself to get the second derivative:

$$
\mathcal{L}\{\ddot{f}\} = s\,\mathcal{L}\{\dot{f}\} - \dot{f}(0) = s^2F(s) - sf(0) - \dot{f}(0),
$$

and in general $\mathcal{L}\{f^{(n)}\} = s^nF - s^{n-1}f(0) - \cdots - f^{(n-1)}(0)$. Differentiation in time is multiplication by $s$, with the initial conditions entering as polynomial terms. Its mirror is integration: $\mathcal{L}\{\int_0^t f\,dt'\} = F(s)/s$, division by $s$ — the reason an integrator is written $1/s$ in every block diagram.

::: key
Derivative rule: $\mathcal{L}\{\dot{f}\} = sF(s) - f(0)$ and $\mathcal{L}\{\ddot{f}\} = s^2F(s) - sf(0) - \dot{f}(0)$. Integral rule: $\mathcal{L}\{\int_0^t f\} = F(s)/s$. Initial conditions enter as polynomial terms alongside the transform; with zero initial conditions, $\frac{d}{dt} \leftrightarrow s$.
:::

::: warning
The $f(0)$ in the derivative rule is the value at $t = 0$ of the *whole* function being transformed, and the rule for $\ddot{f}$ needs both $f(0)$ and $\dot{f}(0)$ — attitude and rate, not attitude twice. Transforming $\ddot{y} + 2\dot{y}$ with $y(0) = 1$, $\dot{y}(0) = 0$ produces $s^2Y - s + 2sY - 2$, not $s^2Y - 1 + 2sY - 2$. Write the initial-condition terms out every time until the pattern is automatic.
:::

## Solving a differential equation

The recipe has three steps. Transform every term of the ODE, using the derivative rule for the left side and the table for the forcing. Solve the resulting algebraic equation for $Y(s)$. Invert $Y(s)$ back to $y(t)$, which for a rational $Y$ means partial fractions.

Take $\dot{y} + 2y = 4$ with $y(0) = 1$, a first-order lag with time constant $0.5\,\mathrm{s}$ driven by a step to a final value of 2. Transforming,

$$
sY - 1 + 2Y = \frac{4}{s} \quad\Longrightarrow\quad Y(s) = \frac{1}{s + 2} + \frac{4}{s(s + 2)}.
$$

The first fraction is already in the table: $e^{-2t}$, the initial condition decaying — the **zero-input response**. The second is the input's contribution — the **zero-state response** — and it needs splitting. Write $4/(s(s + 2)) = A/s + B/(s + 2)$; clearing denominators, $4 = A(s + 2) + Bs$, and setting $s = 0$ gives $A = 2$, setting $s = -2$ gives $B = -2$. So

$$
Y(s) = \frac{1}{s + 2} + \frac{2}{s} - \frac{2}{s + 2} = \frac{2}{s} - \frac{1}{s + 2} \quad\Longrightarrow\quad y(t) = 2 - e^{-2t}.
$$

Check: $y(0) = 1$, and $\dot{y} + 2y = 2e^{-2t} + 4 - 2e^{-2t} = 4$. The transform handled the initial condition and the forcing in a single line each, with no separate fitting step. The zero-input part $e^{-2t}$ and the zero-state part $2 - 2e^{-2t}$ are the two terms lesson 4 found in $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t - \tau)}\mathbf{B}\mathbf{u}\,d\tau$, now for a scalar.

## Partial fractions

After transforming and solving, $Y(s)$ is a **rational function**: a polynomial $N(s)$ over a polynomial $D(s)$, and for a physical system the degree of $N$ is less than that of $D$ (a **strictly proper** fraction). The denominator is the characteristic polynomial times whatever the input contributed, so its roots are the system poles plus the input's poles. Factor $D(s)$ and expand $Y$ into a sum of simple terms, one per root, each of which is in the table. Three cases occur.

### Distinct real roots

If $D(s) = (s - p_1)(s - p_2)\cdots(s - p_n)$ with all $p_i$ different, then

$$
Y(s) = \sum_{i=1}^n \frac{r_i}{s - p_i}, \qquad r_i = \Bigl[(s - p_i)\,Y(s)\Bigr]_{s = p_i},
$$

and $y(t) = \sum r_ie^{p_it}$. The coefficient $r_i$ is the **residue** at $p_i$, and the formula for it is the **cover-up rule**: cover the factor $(s - p_i)$ in $Y$ with your thumb and evaluate what is left at $s = p_i$. That is what setting $s = 0$ and $s = -2$ did in the example above. Always check the result by picking a convenient $s$ not equal to any pole and comparing both sides.

### A repeated root

If $(s - p)^2$ divides $D$, the expansion needs both $\frac{r_1}{s - p}$ and $\frac{r_2}{(s - p)^2}$, the second inverting to $r_2te^{pt}$. The cover-up rule gives $r_2$ directly (cover $(s - p)^2$, evaluate at $p$); $r_1$ then follows by clearing denominators and matching a coefficient, or by evaluating at a convenient $s$. For instance,

$$
\frac{1}{s(s + 1)^2} = \frac{1}{s} - \frac{1}{s + 1} - \frac{1}{(s + 1)^2} \quad\Longrightarrow\quad 1 - e^{-t} - te^{-t},
$$

where covering $s$ gives $1$, covering $(s + 1)^2$ gives $1/(-1) = -1$, and evaluating both sides at $s = 1$ ($\tfrac{1}{4} = 1 - \tfrac{1}{2} - \tfrac{1}{4}$) fixes the remaining $-1$. This is the critically damped step response of lesson 3 with $\omega_n = 1$.

### A complex pair

A quadratic factor $s^2 + bs + c$ with $b^2 < 4c$ could be split into two complex linear factors with complex residues, but it is faster and less error-prone to keep it whole, **complete the square**, and match to the damped sine and cosine entries:

$$
\frac{\alpha s + \beta}{s^2 + bs + c} = \frac{\alpha(s + a) + (\beta - \alpha a)}{(s + a)^2 + \omega^2}, \qquad a = \frac{b}{2}, \quad \omega = \sqrt{c - a^2},
$$

which inverts to $e^{-at}\bigl(\alpha\cos\omega t + \frac{\beta - \alpha a}{\omega}\sin\omega t\bigr)$. The numbers $a$ and $\omega$ are lesson 3's $\sigma$ and $\omega_d$: the complex pair is at $-a \pm j\omega$.

::: key
Partial fractions: a strictly proper $Y(s) = N(s)/D(s)$ expands into one term per root of $D$. Distinct real root $p$: term $r/(s - p)$ with residue $r = [(s - p)Y]_{s = p}$ (cover-up rule), inverting to $re^{pt}$. Repeated root: add $r_2/(s - p)^2 \leftrightarrow r_2te^{pt}$. Complex pair: keep the quadratic, complete the square to $(s + a)^2 + \omega^2$, split the numerator into $(s + a)$ and constant parts, and read off $e^{-at}\cos\omega t$ and $e^{-at}\sin\omega t$.
:::

::: example The thrust-vector actuator's step response by transform
Lesson 3's actuator obeys $\ddot{y} + 48\dot{y} + 1600y = 1600u$ ($\omega_n = 40\,\mathrm{rad/s}$, $\zeta = 0.6$). For a unit step from rest, both initial-condition terms vanish and

$$
(s^2 + 48s + 1600)Y = \frac{1600}{s} \quad\Longrightarrow\quad Y(s) = \frac{1600}{s(s^2 + 48s + 1600)} = \frac{A}{s} + \frac{Bs + C}{s^2 + 48s + 1600}.
$$

Cover-up at $s = 0$ gives $A = 1600/1600 = 1$. Clearing denominators, $1600 = A(s^2 + 48s + 1600) + (Bs + C)s$; matching $s^2$ gives $A + B = 0$ so $B = -1$, and matching $s$ gives $48A + C = 0$ so $C = -48$. Complete the square: $s^2 + 48s + 1600 = (s + 24)^2 + 1024 = (s + 24)^2 + 32^2$. Then

$$
Y(s) = \frac{1}{s} - \frac{(s + 24) + 24}{(s + 24)^2 + 32^2} = \frac{1}{s} - \frac{s + 24}{(s + 24)^2 + 32^2} - \frac{24}{32}\cdot\frac{32}{(s + 24)^2 + 32^2},
$$

and reading the table,

$$
y(t) = 1 - e^{-24t}\bigl(\cos 32t + 0.75\sin 32t\bigr).
$$

This is exactly lesson 3's underdamped step response with $\sigma = 24$, $\omega_d = 32$ and $\zeta/\sqrt{1 - \zeta^2} = 0.6/0.8 = 0.75$ — obtained without guessing a form or fitting constants. At the peak time $t_p = \pi/32 = 0.098\,\mathrm{s}$ it gives $y = 1.095$, the 9.5% overshoot; at $t = 0.05\,\mathrm{s}$, $y = 0.783$; at $t = 0.3\,\mathrm{s}$, $y = 1.0008$. A fourth-order Runge–Kutta integration of the original equation reproduces each of these to seven decimals.
:::

::: example A satellite loop with nonzero initial conditions
A PD attitude loop reduces to $\ddot{y} + 5\dot{y} + 6y = 6u$, with a unit step command applied while the satellite is already at $y(0) = 2$ and moving with $\dot{y}(0) = -1$ (in units of the commanded angle). Transforming with the initial-condition terms,

$$
s^2Y - 2s + 1 + 5(sY - 2) + 6Y = \frac{6}{s} \quad\Longrightarrow\quad (s^2 + 5s + 6)Y = \frac{6}{s} + 2s + 9.
$$

The characteristic polynomial factors as $(s + 2)(s + 3)$: two real poles, overdamped. Putting everything over a common denominator,

$$
Y(s) = \frac{2s^2 + 9s + 6}{s(s + 2)(s + 3)} = \frac{r_0}{s} + \frac{r_1}{s + 2} + \frac{r_2}{s + 3}.
$$

Cover-up: at $s = 0$, $r_0 = 6/(2 \times 3) = 1$; at $s = -2$, $r_1 = (8 - 18 + 6)/((-2)(1)) = 2$; at $s = -3$, $r_2 = (18 - 27 + 6)/((-3)(-1)) = -1$. So

$$
y(t) = 1 + 2e^{-2t} - e^{-3t}.
$$

Check the initial conditions: $y(0) = 1 + 2 - 1 = 2$ and $\dot{y}(0) = -4 + 3 = -1$. The response decays from 2 toward the command 1 with no overshoot: $y(0.5) = 1.513$, $y(1) = 1.221$, $y(2) = 1.034$. Splitting $Y$ into the part that came from initial conditions, $(2s + 9)/((s + 2)(s + 3)) = 5/(s + 2) - 3/(s + 3)$, and the part that came from the input, $6/(s(s + 2)(s + 3)) = 1/s - 3/(s + 2) + 2/(s + 3)$, gives the zero-input response $5e^{-2t} - 3e^{-3t}$ and the zero-state response $1 - 3e^{-2t} + 2e^{-3t}$; their sum is the $y(t)$ above. Both share the same poles, because the poles belong to the system, not to what excites it.
:::

::: note
A denominator that is not already factored must be factored: for a quadratic use the formula, for a cubic or higher use a numerical root finder — the roots are the poles, and the step response cannot be written without them. If the numerator degree equals the denominator degree (a **proper** but not strictly proper fraction), divide first; the polynomial quotient inverts to an impulse (a constant quotient) or its derivatives, which for physical outputs signals a modelling error.
:::

## The initial and final value theorems

Two limits of the derivative rule read the ends of a response directly off $Y(s)$, without inverting. Start from $\mathcal{L}\{\dot{f}\} = sF(s) - f(0)$, that is $\int_0^\infty \dot{f}(t)e^{-st}dt = sF(s) - f(0)$.

**Initial value theorem.** Let $s \to \infty$ along the real axis. The factor $e^{-st}$ kills the integrand everywhere except in a shrinking neighbourhood of $t = 0$, so the integral tends to zero (for any $\dot{f}$ that is integrable near zero), leaving

$$
f(0^+) = \lim_{s \to \infty} sF(s).
$$

The notation $0^+$ means the value just after any jump at $t = 0$. Applying the same limit to $\mathcal{L}\{\ddot{f}\}$ gives the initial slope, $\dot{f}(0^+) = \lim_{s \to \infty} s\bigl(sF(s) - f(0)\bigr)$. The theorem holds whenever the limit exists; for a strictly proper $F$ the initial value is finite.

**Final value theorem.** Let $s \to 0$ instead. Then $e^{-st} \to 1$ and the left side becomes $\int_0^\infty \dot{f}\,dt = f(\infty) - f(0)$, so

$$
f(\infty) = \lim_{t \to \infty} f(t) = \lim_{s \to 0} sF(s).
$$

The step that needs care is $\int_0^\infty \dot{f}\,dt = f(\infty) - f(0)$: it requires that $f(\infty)$ *exist*. If $f$ grows or oscillates forever, the algebraic limit $\lim_{s \to 0} sF(s)$ may still be a perfectly finite number, and it is then meaningless. In terms of poles: $f(t)$ settles to a constant if and only if every pole of $F(s)$ other than a single pole at the origin lies strictly in the left half plane; equivalently, **every pole of $sF(s)$ has $\operatorname{Re}s < 0$**. Check that before quoting a final value. A pole on the imaginary axis (a sustained oscillation, or a repeated pole at zero) or in the right half plane (growth) violates the condition.

::: key
Initial value theorem: $f(0^+) = \lim_{s \to \infty} sF(s)$. Final value theorem: $\lim_{t \to \infty} f(t) = \lim_{s \to 0} sF(s)$, valid only when all poles of $sF(s)$ lie strictly in the open left half plane. Apply it to an unstable or oscillating response and you get a confident wrong number.
:::

Return to the actuator step response, $Y(s) = 1600/(s(s^2 + 48s + 1600))$. Here $sY = 1600/(s^2 + 48s + 1600)$, whose poles $-24 \pm 32j$ are in the left half plane, so the theorem applies: $y(\infty) = 1600/1600 = 1$. The initial value is $\lim_{s \to \infty} 1600/(s^2 + \cdots) = 0$, and the initial slope $\lim s\cdot sY = \lim 1600s/(s^2 + \cdots) = 0$ — the response starts from rest with zero slope, as a second-order system driven by a finite input must. Now drive the same actuator with a unit ramp, $U = 1/s^2$, and ask for the tracking error $e = u - y$: $E(s) = (1 - G(s))/s^2$ with $G = 1600/(s^2 + 48s + 1600)$, so

$$
E(s) = \frac{s^2 + 48s}{s^2(s^2 + 48s + 1600)} = \frac{s + 48}{s(s^2 + 48s + 1600)}, \qquad \lim_{s \to 0} sE(s) = \frac{48}{1600} = 0.03.
$$

The nozzle ends up $0.03\,\mathrm{s}$ behind the ramp — the ramp lag $2\zeta/\omega_n$ that lesson 5 found with undetermined coefficients, now read off in one line. The poles of $sE$ are the actuator's, so the theorem is legitimate.

Two cases where it is not. For $F(s) = \omega/(s^2 + \omega^2)$, the limit $\lim_{s \to 0} sF = 0$, but $f = \sin\omega t$ has no final value; the poles of $sF$ are at $\pm j\omega$, on the axis, and the theorem does not apply. For $F(s) = 2/(s(s - 3))$, the limit gives $-2/3$, but the pole of $sF$ at $s = +3$ means $f$ contains $e^{3t}$ and diverges. The number $-2/3$ describes nothing.

::: warning
The precondition is on the poles of $sF(s)$, not on whether the limit is finite. Both bad examples above give finite limits. Students who skip the check tend to be caught by exactly the case that matters most in control: an unstable closed loop whose "steady-state error" comes out as a reasonable-looking number.
:::

::: note
Why $s \to 0$ is the long-time limit and $s \to \infty$ the short-time one: the kernel $e^{-st}$ weights the integral toward $t \lesssim 1/\operatorname{Re}s$. Small $s$ sees the whole history, hence the final value; large $s$ sees only the first instants. The same picture explains the frequency response of lesson 5: on the imaginary axis $s = j\omega$, the kernel is a sinusoid, and $F(j\omega)$ measures how much of that frequency the signal contains. Time constants, frequencies and poles all live in the same $s$-plane in units of $\mathrm{s^{-1}}$.
:::

```python
import math

# Closed-form inverse of Y(s) = 1600 / (s (s^2 + 48 s + 1600)) against a direct
# integration of ydd + 48 yd + 1600 y = 1600, from rest, by RK4.
def closed(t):
    return 1.0 - math.exp(-24 * t) * (math.cos(32 * t) + 0.75 * math.sin(32 * t))

def rk4(t_end, dt=1e-4):
    y, v, t = 0.0, 0.0, 0.0
    f = lambda y, v: (v, -48 * v - 1600 * y + 1600)
    while t < t_end - 1e-12:
        k1 = f(y, v)
        k2 = f(y + 0.5 * dt * k1[0], v + 0.5 * dt * k1[1])
        k3 = f(y + 0.5 * dt * k2[0], v + 0.5 * dt * k2[1])
        k4 = f(y + dt * k3[0], v + dt * k3[1])
        y += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
        v += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
        t += dt
    return y

for t in (0.05, math.pi / 32, 0.3):
    print(f"{t:.3f}  {closed(t):.6f}  {rk4(t):.6f}")
# 0.050  0.782995  0.782995
# 0.098  1.094778  1.094778
# 0.300  1.000833  1.000833
```

## Check yourself

::: check
Write down the Laplace transform of $f(t) = 3 + 2e^{-4t} - \sin 3t$, and locate its poles.
:::

::: answer
By linearity and the table, $F(s) = 3/s + 2/(s + 4) - 3/(s^2 + 9)$. Poles at $s = 0$ (the constant), $s = -4$ (the decay) and $s = \pm 3j$ (the oscillation). Each pole position names a term of the time function: origin for a constant, negative real for a decay, imaginary pair for a sustained sinusoid at that frequency.
:::

::: check
Invert $F(s) = (s + 7)/(s^2 + 4s + 13)$.
:::

::: answer
The discriminant $16 - 52$ is negative, so complete the square: $s^2 + 4s + 13 = (s + 2)^2 + 9$, giving $a = 2$ and $\omega = 3$. Split the numerator: $s + 7 = (s + 2) + 5$. Then $F = (s + 2)/((s + 2)^2 + 9) + \tfrac{5}{3}\cdot 3/((s + 2)^2 + 9)$, so $f(t) = e^{-2t}\bigl(\cos 3t + \tfrac{5}{3}\sin 3t\bigr)$. Check at $s = 0$: the original gives $7/13$; the expansion gives $2/13 + \tfrac{5}{3}\cdot 3/13 = 7/13$.
:::

::: check
Solve $\dot{y} + 3y = 6e^{-3t}$ with $y(0) = 0$ by transform. What happens at the peak, and why does the answer contain a factor $t$?
:::

::: answer
$sY + 3Y = 6/(s + 3)$, so $Y = 6/(s + 3)^2$ and $y(t) = 6te^{-3t}$. The input's pole coincides with the system's pole at $-3$, producing a repeated root and hence the $te^{-3t}$ term — the transform's version of forcing a system at its own mode (lesson 5's resonance, in a decaying form). Setting $\dot{y} = 6e^{-3t}(1 - 3t) = 0$ gives a peak at $t = 1/3\,\mathrm{s}$ where $y = 2e^{-1} = 0.736$; by $t = 1\,\mathrm{s}$ it has fallen to $6e^{-3} = 0.299$.
:::

::: check
For each transform, decide whether the final value theorem applies and, if it does, give the final value: $F_1(s) = 10/(s(s^2 + 2s + 10))$ and $F_2(s) = 10/(s(s^2 + 10))$.
:::

::: answer
$sF_1 = 10/(s^2 + 2s + 10)$ has poles at $-1 \pm 3j$, strictly in the left half plane, so the theorem applies and $f_1(\infty) = 10/10 = 1$: a step response with $\omega_n = \sqrt{10}$, $\zeta = 1/\sqrt{10} = 0.316$ settling at 1. $sF_2 = 10/(s^2 + 10)$ has poles at $\pm j\sqrt{10}$, on the imaginary axis, so the theorem does not apply; the limit $10/10 = 1$ is the average about which $f_2 = 1 - \cos\sqrt{10}\,t$ oscillates forever, not a final value.
:::

::: check
A response has transform $F(s) = (2s^2 + 3s + 1)/(s(s^2 + 4s + 5))$. Without inverting, find $f(0^+)$ and $f(\infty)$, checking the precondition for the latter.
:::

::: answer
Initial value: $sF = (2s^2 + 3s + 1)/(s^2 + 4s + 5) \to 2$ as $s \to \infty$ (ratio of leading coefficients), so $f(0^+) = 2$: the response jumps at $t = 0$, which is possible because $F$ is only proper, not strictly proper, after the factor $s$ is removed. Final value: the poles of $sF$ are the roots of $s^2 + 4s + 5$, namely $-2 \pm j$, both in the left half plane, so $f(\infty) = \lim_{s \to 0} sF = 1/5 = 0.2$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $F(s) = \int_0^\infty f(t)e^{-st}dt$ | Laplace transform; $s$ complex, units $\mathrm{s^{-1}}$ |
| $1 \leftrightarrow 1/s$, $e^{-at} \leftrightarrow 1/(s + a)$, $t \leftrightarrow 1/s^2$, $\delta \leftrightarrow 1$ | Basic pairs; a pole at $p$ means a term $e^{pt}$ |
| $\sin\omega t \leftrightarrow \omega/(s^2 + \omega^2)$, $\cos\omega t \leftrightarrow s/(s^2 + \omega^2)$ | Poles at $\pm j\omega$ |
| $e^{-at}f(t) \leftrightarrow F(s + a)$ | $s$-shift; gives $e^{-at}\sin$, $e^{-at}\cos$, $te^{-at}$ |
| $f(t - T) \leftrightarrow e^{-sT}F(s)$ | Time delay |
| $\mathcal{L}\{\dot{f}\} = sF - f(0)$, $\mathcal{L}\{\ddot{f}\} = s^2F - sf(0) - \dot{f}(0)$ | Derivative rule; initial conditions enter here |
| $\mathcal{L}\{\int_0^t f\} = F/s$ | Integrator is $1/s$ |
| $r_i = [(s - p_i)Y]_{s = p_i}$ | Cover-up rule for a distinct real pole |
| $(s + a)^2 + \omega^2$ | Complete the square for a complex pair; poles $-a \pm j\omega$ |
| $f(0^+) = \lim_{s \to \infty} sF(s)$ | Initial value theorem |
| $f(\infty) = \lim_{s \to 0} sF(s)$ | Final value theorem, only if all poles of $sF(s)$ have $\operatorname{Re}s < 0$ |

The next lesson takes the ratio $Y(s)/U(s)$ that appeared in every zero-state response here, names it the transfer function, and shows that multiplying transfer functions in $s$ is convolution in time.
