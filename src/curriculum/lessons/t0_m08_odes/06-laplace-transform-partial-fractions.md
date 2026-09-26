---
id: l06-laplace-transform-partial-fractions
title: The Laplace transform, partial fractions, and the value theorems
minutes: 21
covers:
  - "Laplace transform, inverse transform, partial fractions"
  - initial and final value theorems
---

Before calculators, people multiplied big numbers with logarithms. Look up the log of each number, *add* the logs — adding is easy — then look up which number has that sum as its log. A hard job (multiplying) became an easy one (adding), with a translation on the way in and a translation on the way out.

The **[[Laplace transform|laplace-history]]** plays the same trick on differential equations. It translates a linear constant-coefficient ODE — starting conditions and forcing included — into an ordinary algebra problem in a new variable $s$. You solve the algebra, then translate the answer back. Derivatives become multiplication by $s$. The characteristic polynomial of lesson 2 appears on its own, as the bottom of the answer. And there is no more guessing: lesson 2 guessed an exponential, lesson 5 guessed a particular solution, and each time the starting conditions had to be fitted in a separate step. The transform does it all in one go.

For a GNC engineer the transform is less a solving trick than a language. A plant, a sensor, an actuator and a controller are each described by a ratio of polynomials in $s$. A loop is closed by doing algebra on those ratios. The poles you learned to read in lesson 3 are the roots of the bottom polynomial. The next lesson makes that language exact as the transfer function. This lesson builds the tool: the definition, a short table to know by heart, the derivative rule that carries the starting conditions, partial fractions for translating back, and two theorems that read the first and last values of a response straight off its transform.

## The transform

The (one-sided) Laplace transform of a function $f(t)$, defined for $t \ge 0$, is

$$
F(s) = \mathcal{L}\{f(t)\} = \int_0^\infty f(t)\,e^{-st}\,dt.
$$

Read $\mathcal{L}\{f\}$ as "the Laplace transform of f". In words: multiply $f(t)$ by the fading weight $e^{-st}$ and add up over all time. The result no longer depends on $t$ — the time has been integrated away — and depends only on $s$.

The new variable $s = \sigma + j\omega$ is a **[[complex number|s-plane]]**, with real part $\sigma$ and imaginary part $\omega$. Because $st$ sits in an exponent, it must have no units, so $s$ is measured in $\mathrm{s^{-1}}$ (per second) — the same as a pole. That is no accident, as you will see.

A naming habit: a lower-case letter is a time function, and the matching capital is its transform. So $y(t) \leftrightarrow Y(s)$ and $u(t) \leftrightarrow U(s)$, where $\leftrightarrow$ reads "goes with".

The integral only converges when the real part of $s$ is big enough for $e^{-st}$ to beat whatever growth $f$ has. For $f = e^{at}$ it converges when $\operatorname{Re}s > a$. Every signal you will meet on a vehicle — bounded, exponential, polynomial, or products of these — has a transform. Once the integral has been done, the formula it gives is used for all $s$ (mathematicians call this analytic continuation). You will not need to think about convergence again, with one exception: the final value theorem.

Two properties come straight from the integral:

- **Linearity:** $\mathcal{L}\{af + bg\} = aF + bG$ for constants $a$ and $b$, because an integral of a sum is the sum of the integrals.
- **Uniqueness:** two continuous functions with the same transform are the same function. So a transform can be translated back without ambiguity. That backward step, the **inverse transform**, is written $f(t) = \mathcal{L}^{-1}\{F(s)\}$. In practice it means recognizing $F$ as a sum of entries in the table below — which is what partial fractions are for.

## Building the table

Each entry is one integral. Knowing where it came from is what lets you rebuild it when a slightly different function shows up.

**The constant.** For $f(t) = 1$ — the **[[unit step|unit-step]]**, zero before $t = 0$ and one after:

$$
\mathcal{L}\{1\} = \int_0^\infty e^{-st}\,dt = \left[-\frac{e^{-st}}{s}\right]_0^\infty = 0 - \left(-\frac{1}{s}\right) = \frac{1}{s} \qquad (\operatorname{Re}s > 0).
$$

**The exponential.** For $f = e^{-at}$, with $a$ real or complex, the two exponentials combine:

$$
\mathcal{L}\{e^{-at}\} = \int_0^\infty e^{-(s + a)t}\,dt = \frac{1}{s + a} \qquad (\operatorname{Re}s > -\operatorname{Re}a).
$$

This one entry produces most of the others. A decay $e^{-t/\tau}$ becomes $1/(s + 1/\tau)$. Notice where the bottom is zero: at $s = -a$. A value of $s$ where the transform blows up like this is a **pole** of the transform, and it sits exactly at the characteristic root of the mode $e^{-at}$. **A pole of the transform at $s = p$ means a term $e^{pt}$ in the time function.** That sentence is the whole bridge between this lesson and lesson 2.

**The ramp.** Work out $\int_0^\infty te^{-st}dt$ by **[[integration by parts|by-parts]]**, with $t$ as the part to differentiate and $e^{-st}\,dt$ as the part to integrate. The boundary term is zero at both ends, and what remains is $\frac{1}{s}\int_0^\infty e^{-st}dt = 1/s^2$. Repeating the trick gives $\mathcal{L}\{t^n\} = n!/s^{n+1}$.

**Sine and cosine.** Use Euler's formula to write them as exponentials: $\cos\omega t = \tfrac{1}{2}(e^{j\omega t} + e^{-j\omega t})$ and $\sin\omega t = \tfrac{1}{2j}(e^{j\omega t} - e^{-j\omega t})$. Apply the exponential entry with $a = \mp j\omega$, then put each pair over a common bottom:

$$
\mathcal{L}\{\cos\omega t\} = \frac{1}{2}\left(\frac{1}{s - j\omega} + \frac{1}{s + j\omega}\right) = \frac{s}{s^2 + \omega^2}, \qquad \mathcal{L}\{\sin\omega t\} = \frac{1}{2j}\left(\frac{1}{s - j\omega} - \frac{1}{s + j\omega}\right) = \frac{\omega}{s^2 + \omega^2}.
$$

The poles are at $\pm j\omega$, on the imaginary axis: an oscillation that never dies, as lesson 2 said.

**The $s$-shift.** Multiply a time function by $e^{-at}$ and its transform slides over by $a$: $\mathcal{L}\{e^{-at}f(t)\} = \int_0^\infty f(t)e^{-(s + a)t}dt = F(s + a)$. Apply that to cosine, sine and the ramp:

$$
\mathcal{L}\{e^{-at}\cos\omega t\} = \frac{s + a}{(s + a)^2 + \omega^2}, \qquad \mathcal{L}\{e^{-at}\sin\omega t\} = \frac{\omega}{(s + a)^2 + \omega^2}, \qquad \mathcal{L}\{te^{-at}\} = \frac{1}{(s + a)^2}.
$$

These are the underdamped modes and the repeated-root mode of lesson 2. The damped sinusoid's poles are at $-a \pm j\omega$ — where lesson 3 put $-\sigma \pm j\omega_d$.

**The unit impulse.** The **[[Dirac delta|delta-picture]]** $\delta(t)$ is an idealized pulse: very short, very tall, with area exactly $1$. It is zero for every $t \ne 0$, yet $\int\delta(t)\,dt = 1$. For any smooth $g$, $\int g(t)\delta(t)dt = g(0)$ — the pulse "sifts out" the value at zero, so this is called the **sifting property**. Taking $g = e^{-st}$ gives $\mathcal{L}\{\delta(t)\} = e^{0} = 1$. Lesson 7 puts the impulse at the center of attention; for now it is one more table entry.

**The time delay.** Delay $f$ by $T$ seconds — zero until $t = T$, then $f(t - T)$. Substituting $t' = t - T$ in the integral pulls out a factor $e^{-sT}$, so the transform is $e^{-sT}F(s)$. A delay in a sensor or a data bus shows up in the control track as this factor $e^{-sT}$.

::: key
Transform pairs to know: $1 \leftrightarrow 1/s$ · $e^{-at} \leftrightarrow 1/(s + a)$ · $t \leftrightarrow 1/s^2$ · $\sin\omega t \leftrightarrow \omega/(s^2 + \omega^2)$ · $\cos\omega t \leftrightarrow s/(s^2 + \omega^2)$ · $e^{-at}\sin\omega t \leftrightarrow \omega/((s + a)^2 + \omega^2)$ · $e^{-at}\cos\omega t \leftrightarrow (s + a)/((s + a)^2 + \omega^2)$ · $te^{-at} \leftrightarrow 1/(s + a)^2$ · $\delta(t) \leftrightarrow 1$ · $f(t - T) \leftrightarrow e^{-sT}F(s)$.
:::

## Derivatives: where the starting conditions go

This is the rule that makes the transform useful for differential equations. Integrate by parts once, moving the derivative off $f$ and onto $e^{-st}$:

$$
\mathcal{L}\{\dot{f}\} = \int_0^\infty \dot{f}e^{-st}dt = \Bigl[f e^{-st}\Bigr]_0^\infty + s\int_0^\infty fe^{-st}dt = sF(s) - f(0).
$$

The boundary term at infinity is zero wherever the transform converges. The one at zero hands over the starting value, with a minus sign.

Apply the same rule to $\dot{f}$ itself to get the second derivative:

$$
\mathcal{L}\{\ddot{f}\} = s\,\mathcal{L}\{\dot{f}\} - \dot{f}(0) = s\bigl(sF(s) - f(0)\bigr) - \dot{f}(0) = s^2F(s) - sf(0) - \dot{f}(0).
$$

In general, $\mathcal{L}\{f^{(n)}\} = s^nF - s^{n-1}f(0) - \cdots - f^{(n-1)}(0)$. Differentiating in time is multiplying by $s$, with the starting conditions tagging along as extra polynomial terms.

The mirror image is integration: $\mathcal{L}\{\int_0^t f\,dt'\} = F(s)/s$. Integrating is dividing by $s$. That is why an integrator is drawn as a box marked $1/s$ in every **[[block diagram|block-diagram]]**.

::: key
Derivative rule: $\mathcal{L}\{\dot{f}\} = sF(s) - f(0)$ and $\mathcal{L}\{\ddot{f}\} = s^2F(s) - sf(0) - \dot{f}(0)$. Integral rule: $\mathcal{L}\{\int_0^t f\} = F(s)/s$. Initial conditions enter as polynomial terms alongside the transform; with zero initial conditions, $\frac{d}{dt} \leftrightarrow s$.
:::

::: warning Position and rate, not position twice
The $f(0)$ in the rule is the starting value of the *whole* function being transformed. The rule for $\ddot{f}$ needs both $f(0)$ and $\dot{f}(0)$ — for an attitude, the angle and the rate, not the angle twice. Transforming $\ddot{y} + 2\dot{y}$ with $y(0) = 1$ and $\dot{y}(0) = 0$ gives $s^2Y - s + 2sY - 2$, not $s^2Y - 1 + 2sY - 2$. Write the starting-condition terms out every time until the pattern is automatic.
:::

## Solving a differential equation

The recipe has three steps:

1. **Transform** every term of the ODE: the derivative rule for the left side, the table for the forcing.
2. **Solve** the algebra for $Y(s)$.
3. **Invert** $Y(s)$ back to $y(t)$. For a ratio of polynomials, that means partial fractions.

Try it on $\dot{y} + 2y = 4$ with $y(0) = 1$. This is a first-order lag with time constant $0.5\,\mathrm{s}$, pushed by a step toward a final value of $2$.

**Transform.** $\dot{y}$ becomes $sY - 1$, $2y$ becomes $2Y$, and the constant $4$ becomes $4/s$:

$$
sY - 1 + 2Y = \frac{4}{s} \quad\Longrightarrow\quad Y(s) = \frac{1}{s + 2} + \frac{4}{s(s + 2)}.
$$

**Read the pieces.** The first fraction is already in the table: $e^{-2t}$, the starting value fading away. That is the **zero-input response**. The second fraction is the input's contribution, the **zero-state response**, and it needs splitting.

**Split.** Write $\frac{4}{s(s + 2)} = \frac{A}{s} + \frac{B}{s + 2}$. Multiply both sides by $s(s + 2)$: $4 = A(s + 2) + Bs$. Setting $s = 0$ kills the $B$ term and gives $4 = 2A$, so $A = 2$. Setting $s = -2$ kills the $A$ term and gives $4 = -2B$, so $B = -2$. So

$$
Y(s) = \frac{1}{s + 2} + \frac{2}{s} - \frac{2}{s + 2} = \frac{2}{s} - \frac{1}{s + 2} \quad\Longrightarrow\quad y(t) = 2 - e^{-2t}.
$$

**Check.** $y(0) = 2 - 1 = 1$. And $\dot{y} + 2y = 2e^{-2t} + 4 - 2e^{-2t} = 4$. Both right. The transform handled the starting condition and the forcing in one line each, with no separate fitting step. The zero-input part $e^{-2t}$ and the zero-state part $2 - 2e^{-2t}$ are the same two terms lesson 4 found in $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t - \tau)}\mathbf{B}\mathbf{u}\,d\tau$, now for a single number.

## Partial fractions

After transforming and solving, $Y(s)$ is a **rational function**: one polynomial $N(s)$ divided by another, $D(s)$. For a physical system the top has lower degree than the bottom. Such a fraction is called **strictly proper**.

The bottom is the characteristic polynomial times whatever the input added. So its roots are the system's poles plus the input's poles. Factor $D(s)$, then break $Y$ into a sum of simple pieces, one per root, each of which is in the table. Three cases come up.

### Distinct real roots

If $D(s) = (s - p_1)(s - p_2)\cdots(s - p_n)$ with all the $p_i$ different, then

$$
Y(s) = \sum_{i=1}^n \frac{r_i}{s - p_i}, \qquad r_i = \Bigl[(s - p_i)\,Y(s)\Bigr]_{s = p_i},
$$

and $y(t) = \sum r_ie^{p_it}$. The number $r_i$ is the **residue** at $p_i$. The formula for it is the **[[cover-up rule|cover-up]]**: cover the factor $(s - p_i)$ in $Y$ with your thumb, and put $s = p_i$ into what is left. That is exactly what setting $s = 0$ and $s = -2$ did in the example. Always check by picking a handy $s$ that is not a pole and comparing both sides.

### A repeated root

If $(s - p)^2$ divides $D$, the expansion needs two terms for that root: $\frac{r_1}{s - p}$ and $\frac{r_2}{(s - p)^2}$. The second inverts to $r_2te^{pt}$. The cover-up rule gives $r_2$ directly (cover the whole $(s - p)^2$ and evaluate at $p$). Then $r_1$ follows from clearing the fractions and matching a coefficient, or from evaluating both sides at a handy $s$. For example,

$$
\frac{1}{s(s + 1)^2} = \frac{1}{s} - \frac{1}{s + 1} - \frac{1}{(s + 1)^2} \quad\Longrightarrow\quad 1 - e^{-t} - te^{-t}.
$$

Covering $s$ and setting $s = 0$ gives $1$. Covering $(s + 1)^2$ and setting $s = -1$ gives $1/(-1) = -1$. For the last one, try $s = 1$: the left side is $\tfrac{1}{4}$, and the right side is $1 + \tfrac{r_1}{2} - \tfrac{1}{4}$, so $r_1 = -1$. Sanity check: this is the critically damped step response of lesson 3 with $\omega_n = 1$, and it starts at $1 - 1 - 0 = 0$, as a step response from rest must.

### A complex pair

A quadratic factor $s^2 + bs + c$ with $b^2 < 4c$ has complex roots. You could split it into two complex pieces with complex residues, but it is faster and safer to keep it whole, **[[complete the square|complete-square]]**, and match it to the damped sine and cosine entries:

$$
\frac{\alpha s + \beta}{s^2 + bs + c} = \frac{\alpha(s + a) + (\beta - \alpha a)}{(s + a)^2 + \omega^2}, \qquad a = \frac{b}{2}, \quad \omega = \sqrt{c - a^2}.
$$

The top was rewritten so that one part is a multiple of $(s + a)$ — which matches the cosine entry — and the rest is a constant — which matches the sine entry. It inverts to $e^{-at}\bigl(\alpha\cos\omega t + \frac{\beta - \alpha a}{\omega}\sin\omega t\bigr)$. The numbers $a$ and $\omega$ are lesson 3's $\sigma$ and $\omega_d$: the complex pair sits at $-a \pm j\omega$.

::: key
Partial fractions: a strictly proper $Y(s) = N(s)/D(s)$ expands into one term per root of $D$. Distinct real root $p$: term $r/(s - p)$ with residue $r = [(s - p)Y]_{s = p}$ (cover-up rule), inverting to $re^{pt}$. Repeated root: add $r_2/(s - p)^2 \leftrightarrow r_2te^{pt}$. Complex pair: keep the quadratic, complete the square to $(s + a)^2 + \omega^2$, split the numerator into $(s + a)$ and constant parts, and read off $e^{-at}\cos\omega t$ and $e^{-at}\sin\omega t$.
:::

::: example The thrust-vector actuator's step response by transform
Lesson 3's actuator obeys $\ddot{y} + 48\dot{y} + 1600y = 1600u$ ($\omega_n = 40\,\mathrm{rad/s}$, $\zeta = 0.6$). Find its response to a unit step from rest.

**Transform.** Both starting values are zero, so the derivative rule adds nothing extra, and $U = 1/s$:

$$
(s^2 + 48s + 1600)Y = \frac{1600}{s} \quad\Longrightarrow\quad Y(s) = \frac{1600}{s(s^2 + 48s + 1600)} = \frac{A}{s} + \frac{Bs + C}{s^2 + 48s + 1600}.
$$

**Find the numbers.** Cover-up at $s = 0$: $A = 1600/1600 = 1$. Clearing the fractions gives $1600 = A(s^2 + 48s + 1600) + (Bs + C)s$. Matching the $s^2$ terms: $A + B = 0$, so $B = -1$. Matching the $s$ terms: $48A + C = 0$, so $C = -48$.

**Complete the square.** Half of $48$ is $24$, and $24^2 = 576$, so $s^2 + 48s + 1600 = (s + 24)^2 + 1024 = (s + 24)^2 + 32^2$. Split $-(s + 48)$ as $-(s + 24) - 24$:

$$
Y(s) = \frac{1}{s} - \frac{(s + 24) + 24}{(s + 24)^2 + 32^2} = \frac{1}{s} - \frac{s + 24}{(s + 24)^2 + 32^2} - \frac{24}{32}\cdot\frac{32}{(s + 24)^2 + 32^2}.
$$

**Read the table:**

$$
y(t) = 1 - e^{-24t}\bigl(\cos 32t + 0.75\sin 32t\bigr).
$$

**Check.** This is exactly lesson 3's underdamped step response, with $\sigma = 24$, $\omega_d = 32$ and $\zeta/\sqrt{1 - \zeta^2} = 0.6/0.8 = 0.75$ — found without guessing a form or fitting constants. At $t = 0$ it gives $1 - 1 = 0$, as it should. At the peak time $t_p = \pi/32 = 0.098\,\mathrm{s}$ it gives $y = 1.095$, the 9.5% overshoot. At $t = 0.05\,\mathrm{s}$, $y = 0.783$; at $t = 0.3\,\mathrm{s}$, $y = 1.0008$. A step-by-step numerical solution of the original equation (the code at the end of the lesson) matches each of these to six decimals.
:::

::: example A satellite loop that starts off target
A PD attitude loop reduces to $\ddot{y} + 5\dot{y} + 6y = 6u$. A unit step command arrives while the satellite is already at $y(0) = 2$ and moving at $\dot{y}(0) = -1$ (in units of the commanded angle).

**Transform, starting terms included.** $\ddot{y}$ becomes $s^2Y - 2s - (-1) = s^2Y - 2s + 1$, and $5\dot{y}$ becomes $5(sY - 2)$:

$$
s^2Y - 2s + 1 + 5(sY - 2) + 6Y = \frac{6}{s} \quad\Longrightarrow\quad (s^2 + 5s + 6)Y = \frac{6}{s} + 2s + 9.
$$

**Factor.** $s^2 + 5s + 6 = (s + 2)(s + 3)$: two real poles, so the loop is overdamped. Put everything over one bottom:

$$
Y(s) = \frac{2s^2 + 9s + 6}{s(s + 2)(s + 3)} = \frac{r_0}{s} + \frac{r_1}{s + 2} + \frac{r_2}{s + 3}.
$$

**Cover up each factor.** At $s = 0$: $r_0 = 6/(2 \times 3) = 1$. At $s = -2$: $r_1 = (8 - 18 + 6)/\bigl((-2)(1)\bigr) = 2$. At $s = -3$: $r_2 = (18 - 27 + 6)/\bigl((-3)(-1)\bigr) = -1$. So

$$
y(t) = 1 + 2e^{-2t} - e^{-3t}.
$$

**Check.** $y(0) = 1 + 2 - 1 = 2$ and $\dot{y}(0) = -4 + 3 = -1$. Both match. The response slides from $2$ down to the command $1$ with no overshoot: $y(0.5) = 1.513$, $y(1) = 1.221$, $y(2) = 1.034$.

**Two sources, same poles.** The part of $Y$ that came from the starting conditions is $(2s + 9)/((s + 2)(s + 3)) = 5/(s + 2) - 3/(s + 3)$, giving the zero-input response $5e^{-2t} - 3e^{-3t}$. The part from the input is $6/(s(s + 2)(s + 3)) = 1/s - 3/(s + 2) + 2/(s + 3)$, giving the zero-state response $1 - 3e^{-2t} + 2e^{-3t}$. They add up to the $y(t)$ above. Both use the same poles, $-2$ and $-3$, because the poles belong to the system, not to whatever sets it moving.
:::

::: note When the bottom is not factored, or the top is too big
A bottom that is not already factored must be factored. For a quadratic, use the quadratic formula. For a cubic or higher, use a numerical root finder. The roots are the poles, and the response cannot be written without them.

If the top has the *same* degree as the bottom (a **proper** but not strictly proper fraction), divide first, like turning $\tfrac{7}{3}$ into $2 + \tfrac{1}{3}$. The whole-number part inverts to an impulse (a constant) or its derivatives. For a physical output that usually means something is wrong with the model.
:::

## The initial and final value theorems

Sometimes you only want to know where a response starts and where it ends up. Two theorems read those straight off $Y(s)$, without translating back. Both come from the derivative rule, written out as an integral:

$$
\int_0^\infty \dot{f}(t)e^{-st}dt = sF(s) - f(0).
$$

**Initial value theorem.** Let $s$ grow toward infinity along the real axis. The weight $e^{-st}$ then crushes the integrand everywhere except in a tiny sliver near $t = 0$, so the integral shrinks to zero. What is left is

$$
f(0^+) = \lim_{s \to \infty} sF(s).
$$

Read "lim, s to infinity" as "the value $sF(s)$ approaches as $s$ gets huge". The $0^+$ means "the value right after $t = 0$", after any sudden jump at the start. Applying the same limit to the $\ddot{f}$ rule gives the starting slope: $\dot{f}(0^+) = \lim_{s \to \infty} s\bigl(sF(s) - f(0)\bigr)$. For a strictly proper $F$ the starting value is always finite.

**Final value theorem.** Now let $s$ shrink to zero. The weight $e^{-st}$ becomes $1$, and the left side becomes $\int_0^\infty \dot{f}\,dt = f(\infty) - f(0)$. The $f(0)$ cancels on both sides, leaving

$$
f(\infty) = \lim_{t \to \infty} f(t) = \lim_{s \to 0} sF(s).
$$

The step that needs care is $\int_0^\infty \dot{f}\,dt = f(\infty) - f(0)$. It only makes sense if $f(\infty)$ *exists*. If $f$ grows or oscillates forever, the limit $\lim_{s \to 0} sF(s)$ can still come out as a perfectly finite number — and that number then means nothing.

In terms of poles: $f(t)$ settles to a constant exactly when every pole of $F(s)$, apart from a single pole at the origin, lies strictly in the left half of the $s$-plane. Equivalently, **every pole of $sF(s)$ has $\operatorname{Re}s < 0$.** Check that before quoting a final value. A pole on the imaginary axis (a never-ending oscillation, or a repeated pole at zero) or in the right half plane (growth) breaks the condition.

::: key
Initial value theorem: $f(0^+) = \lim_{s \to \infty} sF(s)$. Final value theorem: $\lim_{t \to \infty} f(t) = \lim_{s \to 0} sF(s)$, valid only when all poles of $sF(s)$ lie strictly in the open left half plane. Apply it to an unstable or oscillating response and you get a confident wrong number.
:::

### Using them

Go back to the actuator's step response, $Y(s) = 1600/(s(s^2 + 48s + 1600))$. Multiply by $s$: $sY = 1600/(s^2 + 48s + 1600)$. Its poles, $-24 \pm 32j$, are in the left half plane, so the final value theorem applies: set $s = 0$ and get $y(\infty) = 1600/1600 = 1$.

The starting value is $\lim_{s \to \infty} 1600/(s^2 + \cdots) = 0$, and the starting slope is $\lim s\cdot sY = \lim 1600s/(s^2 + \cdots) = 0$. The response starts from rest with zero slope, as a second-order system pushed by a finite input must.

Now drive the same actuator with a unit ramp, $U = 1/s^2$, and ask for the following error $e = u - y$. With $G = 1600/(s^2 + 48s + 1600)$, the error is $E(s) = (1 - G(s))/s^2$. Working out $1 - G$ over a common bottom and cancelling one $s$,

$$
E(s) = \frac{s^2 + 48s}{s^2(s^2 + 48s + 1600)} = \frac{s + 48}{s(s^2 + 48s + 1600)}, \qquad \lim_{s \to 0} sE(s) = \frac{48}{1600} = 0.03.
$$

The nozzle ends up $0.03\,\mathrm{s}$ behind the ramp — the ramp lag $2\zeta/\omega_n$ that lesson 5 found by guessing, now read off in one line. The poles of $sE$ are the actuator's own, so the theorem is allowed.

Now two cases where it is not.

- $F(s) = \omega/(s^2 + \omega^2)$. The limit $\lim_{s \to 0} sF$ is $0$, but $f = \sin\omega t$ never settles. The poles of $sF$ are at $\pm j\omega$, on the axis, so the theorem does not apply.
- $F(s) = 2/(s(s - 3))$. The limit gives $-2/3$. But $sF$ has a pole at $s = +3$, so $f$ contains $e^{3t}$ and runs off to infinity. The number $-2/3$ describes nothing.

::: warning Check the poles, not the answer
The condition is about the poles of $sF(s)$, not about whether the limit is finite. Both bad examples above gave finite limits. People who skip the check tend to be caught by exactly the case that matters most in control: an **[[unstable closed loop|unstable-trap]]** whose "steady-state error" comes out as a reasonable-looking number.
:::

::: note Why small s means late and big s means early
The weight $e^{-st}$ mostly counts times up to about $1/\operatorname{Re}s$. A **[[small s|kernel-weights]]** fades slowly and sees the whole history, so it picks out the final value. A big $s$ fades fast and sees only the first instants.

The same picture explains lesson 5's frequency response. On the imaginary axis, $s = j\omega$, the weight is a pure wave, and $F(j\omega)$ measures how much of that frequency the signal contains. Time constants, frequencies and poles all live on the same $s$-plane, in units of $\mathrm{s^{-1}}$.
:::

Here is the actuator's closed-form answer checked against a direct numerical solution (the fourth-order Runge–Kutta method, which steps the equation forward in tiny time slices):

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
# 0.098  1.094780  1.094780
# 0.300  1.000833  1.000833
```

## Check yourself

::: check
Write down the Laplace transform of $f(t) = 3 + 2e^{-4t} - \sin 3t$, and find its poles.
:::

::: answer
By linearity and the table, $F(s) = 3/s + 2/(s + 4) - 3/(s^2 + 9)$.

The poles are at $s = 0$ (from the constant), $s = -4$ (from the decay) and $s = \pm 3j$ (from the oscillation). Each pole's position names a kind of term: the origin for a constant, the negative real axis for a decay, an imaginary pair for a never-ending wave at that frequency.
:::

::: check
Invert $F(s) = (s + 7)/(s^2 + 4s + 13)$.
:::

::: answer
The discriminant $4^2 - 4 \times 13 = 16 - 52$ is negative, so complete the square: $s^2 + 4s + 13 = (s + 2)^2 + 9$. That gives $a = 2$ and $\omega = 3$.

Split the top to match: $s + 7 = (s + 2) + 5$. Then

$$
F = \frac{s + 2}{(s + 2)^2 + 9} + \frac{5}{3}\cdot\frac{3}{(s + 2)^2 + 9}, \qquad f(t) = e^{-2t}\left(\cos 3t + \tfrac{5}{3}\sin 3t\right).
$$

Check at $s = 0$: the original gives $7/13$. The expansion gives $2/13 + \tfrac{5}{3}\cdot 3/13 = 2/13 + 5/13 = 7/13$.
:::

::: check
Solve $\dot{y} + 3y = 6e^{-3t}$ with $y(0) = 0$ by transform. Where is the peak, and why does the answer contain a factor $t$?
:::

::: answer
Transform: $sY + 3Y = 6/(s + 3)$, so $Y = 6/(s + 3)^2$ and $y(t) = 6te^{-3t}$.

The input's pole sits on top of the system's pole at $-3$. Together they make a repeated root, and a repeated root means a $te^{-3t}$ term. It is the transform's version of pushing a system at its own mode — lesson 5's resonance, in a decaying form.

For the peak, set $\dot{y} = 6e^{-3t}(1 - 3t) = 0$: $t = 1/3\,\mathrm{s}$, where $y = 6 \times \tfrac{1}{3}e^{-1} = 2e^{-1} = 0.736$. By $t = 1\,\mathrm{s}$ it has fallen to $6e^{-3} = 0.299$.
:::

::: check
For each transform, decide whether the final value theorem applies, and if it does, give the final value: $F_1(s) = 10/(s(s^2 + 2s + 10))$ and $F_2(s) = 10/(s(s^2 + 10))$.
:::

::: answer
$sF_1 = 10/(s^2 + 2s + 10)$ has poles at $-1 \pm 3j$, strictly in the left half plane. The theorem applies: $f_1(\infty) = 10/10 = 1$. It is a step response with $\omega_n = \sqrt{10}$ and $\zeta = 1/\sqrt{10} = 0.316$, settling at $1$.

$sF_2 = 10/(s^2 + 10)$ has poles at $\pm j\sqrt{10}$, on the imaginary axis. The theorem does not apply. The limit, $10/10 = 1$, is only the middle line that $f_2 = 1 - \cos\sqrt{10}\,t$ swings about forever — not a final value.
:::

::: check
A response has transform $F(s) = (2s^2 + 3s + 1)/(s(s^2 + 4s + 5))$. Without inverting, find $f(0^+)$ and $f(\infty)$, checking the condition for the second one.
:::

::: answer
**Start.** $sF = (2s^2 + 3s + 1)/(s^2 + 4s + 5)$. As $s$ gets huge, only the top powers matter, so $sF \to 2/1 = 2$ and $f(0^+) = 2$. The response starts at a nonzero value. That happens because the bottom of $F$ has degree exactly one more than the top; when the gap is two or more, as in the actuator, the start is zero.

**End.** The poles of $sF$ are the roots of $s^2 + 4s + 5$, namely $-2 \pm j$, both in the left half plane. So the theorem applies, and $f(\infty) = \lim_{s \to 0} sF = 1/5 = 0.2$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $F(s) = \int_0^\infty f(t)e^{-st}dt$ | Laplace transform; $s$ complex, units $\mathrm{s^{-1}}$ |
| $1 \leftrightarrow 1/s$, $e^{-at} \leftrightarrow 1/(s + a)$, $t \leftrightarrow 1/s^2$, $\delta \leftrightarrow 1$ | Basic pairs; a pole at $p$ means a term $e^{pt}$ |
| $\sin\omega t \leftrightarrow \omega/(s^2 + \omega^2)$, $\cos\omega t \leftrightarrow s/(s^2 + \omega^2)$ | Poles at $\pm j\omega$ |
| $e^{-at}f(t) \leftrightarrow F(s + a)$ | $s$-shift; gives $e^{-at}\sin$, $e^{-at}\cos$, $te^{-at}$ |
| $f(t - T) \leftrightarrow e^{-sT}F(s)$ | Time delay |
| $\mathcal{L}\{\dot{f}\} = sF - f(0)$, $\mathcal{L}\{\ddot{f}\} = s^2F - sf(0) - \dot{f}(0)$ | Derivative rule; the starting conditions enter here |
| $\mathcal{L}\{\int_0^t f\} = F/s$ | An integrator is $1/s$ |
| $r_i = [(s - p_i)Y]_{s = p_i}$ | Cover-up rule for a distinct real pole |
| $(s + a)^2 + \omega^2$ | Complete the square for a complex pair; poles $-a \pm j\omega$ |
| $f(0^+) = \lim_{s \to \infty} sF(s)$ | Initial value theorem |
| $f(\infty) = \lim_{s \to 0} sF(s)$ | Final value theorem, only if all poles of $sF(s)$ have $\operatorname{Re}s < 0$ |

The next lesson takes the ratio $Y(s)/U(s)$ that appeared in every zero-state response here, names it the transfer function, and shows that multiplying transfer functions in $s$ is the same as an operation in time called convolution.

::: context laplace-history Who Laplace was
Pierre-Simon Laplace (1749–1827) was a French mathematician and astronomer. He worked out, among much else, how the planets tug on each other's orbits, and he used integrals of this shape in his work on probability.

Using them to solve differential equations came later. In the 1880s and 1890s the English engineer Oliver Heaviside solved electrical-circuit equations by treating "differentiate" as if it were a number he could do algebra with. It worked, but mathematicians distrusted it. In the early twentieth century they showed that Laplace's integral explains why Heaviside's shortcuts are right, and the method has carried Laplace's name ever since.
:::

::: context s-plane Where a pole sits tells you what it does
Draw $s$ as a point on a flat map: real part $\sigma$ across, imaginary part $\omega$ up. Each pole, marked ×, produces a term in time shown by the small sketch beside it. Left of the vertical axis things die out; on it they last forever; right of it they grow.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="8" width="160" height="200" fill="#8fb8f0" fill-opacity="0.25"/>
  <line x1="20" y1="110" x2="345" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="8" x2="180" y2="208" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="338" y="126" font-size="12" fill="#1f2a44" text-anchor="end">σ</text>
  <text x="186" y="206" font-size="12" fill="#1f2a44">jω</text>
  <path d="M95,45 L105,55 M95,55 L105,45" stroke="#b4232c" stroke-width="2.5"/><path d="M95,165 L105,175 M95,175 L105,165" stroke="#b4232c" stroke-width="2.5"/><path d="M175,45 L185,55 M175,55 L185,45" stroke="#b4232c" stroke-width="2.5"/><path d="M175,165 L185,175 M175,175 L185,165" stroke="#b4232c" stroke-width="2.5"/><path d="M95,105 L105,115 M95,115 L105,105" stroke="#b4232c" stroke-width="2.5"/><path d="M175,105 L185,115 M175,115 L185,105" stroke="#b4232c" stroke-width="2.5"/><path d="M265,105 L275,115 M265,115 L275,105" stroke="#b4232c" stroke-width="2.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.8" points="110.0,38.0 111.2,34.6 112.5,31.9 113.8,30.2 115.0,29.5 116.2,29.8 117.5,30.7 118.8,32.3 120.0,34.1 121.2,36.1 122.5,38.0 123.8,39.6 125.0,40.9 126.2,41.7 127.5,42.0 128.8,41.9 130.0,41.4 131.2,40.7 132.5,39.8 133.8,38.9 135.0,38.0 136.2,37.2 137.5,36.6 138.8,36.3 140.0,36.1 141.2,36.2 142.5,36.4 143.8,36.7 145.0,37.1 146.2,37.6 147.5,38.0 148.8,38.4 150.0,38.6 151.2,38.8 152.5,38.9 153.8,38.9 155.0,38.8 156.2,38.6 157.5,38.4 158.8,38.2 160.0,38.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.8" points="190.0,38.0 191.2,34.3 192.5,30.9 193.8,28.3 195.0,26.6 196.2,26.0 197.5,26.6 198.8,28.3 200.0,30.9 201.2,34.3 202.5,38.0 203.8,41.7 205.0,45.1 206.2,47.7 207.5,49.4 208.8,50.0 210.0,49.4 211.2,47.7 212.5,45.1 213.8,41.7 215.0,38.0 216.2,34.3 217.5,30.9 218.8,28.3 220.0,26.6 221.2,26.0 222.5,26.6 223.8,28.3 225.0,30.9 226.2,34.3 227.5,38.0 228.8,41.7 230.0,45.1 231.2,47.7 232.5,49.4 233.8,50.0 235.0,49.4 236.2,47.7 237.5,45.1 238.8,41.7 240.0,38.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.8" points="110.0,87.2 111.2,88.4 112.5,89.5 113.8,90.6 115.0,91.6 116.2,92.5 117.5,93.3 118.8,94.1 120.0,94.8 121.2,95.4 122.5,96.1 123.8,96.6 125.0,97.2 126.2,97.7 127.5,98.1 128.8,98.5 130.0,98.9 131.2,99.3 132.5,99.6 133.8,100.0 135.0,100.3 136.2,100.5 137.5,100.8 138.8,101.0 140.0,101.2 141.2,101.4 142.5,101.6 143.8,101.8 145.0,101.9 146.2,102.1 147.5,102.2 148.8,102.4 150.0,102.5 151.2,102.6 152.5,102.7 153.8,102.8 155.0,102.9 156.2,103.0 157.5,103.0 158.8,103.1 160.0,103.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.8" points="280.0,103.2 281.2,103.1 282.5,103.0 283.8,103.0 285.0,102.9 286.2,102.8 287.5,102.7 288.8,102.6 290.0,102.5 291.2,102.4 292.5,102.2 293.8,102.1 295.0,101.9 296.2,101.8 297.5,101.6 298.8,101.4 300.0,101.2 301.2,101.0 302.5,100.8 303.8,100.5 305.0,100.3 306.2,100.0 307.5,99.6 308.8,99.3 310.0,98.9 311.2,98.5 312.5,98.1 313.8,97.7 315.0,97.2 316.2,96.6 317.5,96.1 318.8,95.4 320.0,94.8 321.2,94.1 322.5,93.3 323.8,92.5 325.0,91.6 326.2,90.6 327.5,89.5 328.8,88.4 330.0,87.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.8" points="190,104 190,87.2 240,87.2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="130">decay</text><text x="186" y="130" text-anchor="start">constant</text><text x="270" y="130">growth</text>
    <text x="135" y="66">rings, dies</text><text x="215" y="66">rings forever</text>
  </g>
  <text x="28" y="200" font-size="11" fill="#1d6fd1">left half: dies out</text>
  <text x="252" y="200" font-size="11" fill="#b4232c">right half: grows</text>
</svg>
```

Complex poles always come in mirror-image pairs above and below the axis, and each pair makes one real wave.
:::

::: context unit-step The unit step
The **unit step** is a switch flipped on at $t = 0$: the value is $0$ before and $1$ after. It is often called the **Heaviside step function**, after Oliver Heaviside, and written $H(t)$ or $1(t)$.

Because the one-sided Laplace transform only looks at $t \ge 0$, the functions $1$ and "the step" have the same transform, $1/s$. Engineers use the step constantly: a new command, a valve opening, an engine lighting — anything that switches on and stays on.
:::

::: context by-parts Integration by parts, in one line
Integration by parts is the product rule run backward:

$$
\int_0^\infty u\,dv = \Bigl[uv\Bigr]_0^\infty - \int_0^\infty v\,du.
$$

It lets you move a derivative from one factor to the other. Choose as $u$ the factor that gets simpler when differentiated. For the ramp, $u = t$ becomes $du = dt$, and $dv = e^{-st}dt$ gives $v = -e^{-st}/s$. At $t = 0$ the boundary term $uv$ is zero because $t = 0$; at infinity it is zero because the exponential crushes $t$.
:::

::: context delta-picture Squeezing a pulse into an impulse
Each rectangle has area $1$: wide and low (grey), narrower and taller (orange), very narrow and very tall (blue). Keep squeezing while holding the area at $1$ and you approach the impulse $\delta(t)$ — all its area packed into the single instant $t = 0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <rect x="140.0" y="162.5" width="80.0" height="17.5" fill="#6c7a93" fill-opacity="0.55" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="160.0" y="145.0" width="40.0" height="35.0" fill="#f2b880" fill-opacity="0.55" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="175.0" y="40.0" width="10.0" height="140.0" fill="#8fb8f0" fill-opacity="0.55" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="320" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="196">−1</text><text x="180" y="196">0</text><text x="220" y="196">1</text><text x="310" y="196">t</text>
  </g>
  <text x="228" y="170" font-size="11" fill="#6c7a93">2 wide × ½ tall</text>
  <text x="206" y="138" font-size="11" fill="#1f2a44">1 × 1</text>
  <text x="190" y="50" font-size="11" fill="#1d6fd1">¼ wide × 4 tall</text>
  <text x="40" y="40" font-size="12" fill="#1f2a44">every area = 1</text>
</svg>
```

A hammer tap, a short thruster firing, a sudden kick: any push much shorter than the system's own response time acts like an impulse of the same area.
:::

::: context block-diagram Boxes and arrows
A **block diagram** draws a system as boxes joined by arrows. Signals travel along the arrows; each box multiplies its incoming signal by what is written inside it. A box marked $1/s$ is an integrator: velocity goes in, position comes out.

Because the Laplace transform turns calculus into multiplication, a whole guidance loop — sensor, computer, actuator, vehicle — can be drawn and simplified with algebra on the boxes. Lesson 7 shows how.
:::

::: context cover-up Why the cover-up rule works
Take $Y = \frac{r_1}{s - p_1} + \frac{r_2}{s - p_2} + \cdots$. Multiply every term by $(s - p_1)$. The first term becomes plain $r_1$. Every other term still has the factor $(s - p_1)$ on top. Now set $s = p_1$: those other terms all become zero, and only $r_1$ is left.

Covering the factor with your thumb is a shortcut for "multiply by it". Evaluating at the pole is what wipes out every other term.
:::

::: context complete-square Completing the square
Any quadratic $s^2 + bs + c$ can be rewritten as a perfect square plus a leftover:

$$
s^2 + bs + c = \left(s + \frac{b}{2}\right)^2 + \left(c - \frac{b^2}{4}\right).
$$

Check by expanding: $(s + b/2)^2 = s^2 + bs + b^2/4$, and the leftover takes the $b^2/4$ back off. When $b^2 < 4c$ the leftover is positive, so it can be written as $\omega^2$. For $s^2 + 48s + 1600$: $b/2 = 24$ and $1600 - 576 = 1024 = 32^2$.
:::

::: context unstable-trap The unstable loop that looks fine
Suppose a closed loop has a pole in the right half plane, but you do not notice. You ask for its steady-state error, apply the final value theorem, and get $0.02$ — a small, believable number. You write it in the report.

In reality there is no steady state: the vehicle's error grows exponentially until an actuator hits its limits. The theorem only works on a response that settles, so it cannot warn you that yours does not. That is why control engineers find the closed-loop poles *first*, every time, and only then quote a final value.
:::

::: context kernel-weights How the weight fades
The weight $e^{-st}$ for three values of $s$. With $s = 0.2\,\mathrm{s^{-1}}$ (blue) it is still above a third after $5\,\mathrm{s}$, so it counts the long-term behavior. With $s = 5\,\mathrm{s^{-1}}$ (red) it has fallen below $1\%$ within the first second, so it only sees the very start.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,30.0 46.0,33.0 52.0,35.9 58.0,38.7 64.0,41.5 70.0,44.3 76.0,47.0 82.0,49.6 88.0,52.2 94.0,54.7 100.0,57.2 106.0,59.6 112.0,62.0 118.0,64.3 124.0,66.6 130.0,68.9 136.0,71.1 142.0,73.2 148.0,75.3 154.0,77.4 160.0,79.5 166.0,81.4 172.0,83.4 178.0,85.3 184.0,87.2 190.0,89.0 196.0,90.8 202.0,92.6 208.0,94.3 214.0,96.0 220.0,97.7 226.0,99.3 232.0,100.9 238.0,102.5 244.0,104.0 250.0,105.5 256.0,107.0 262.0,108.4 268.0,109.9 274.0,111.2 280.0,112.6 286.0,113.9 292.0,115.2 298.0,116.5 304.0,117.8 310.0,119.0 316.0,120.2 322.0,121.4 328.0,122.6 334.0,123.7 340.0,124.8"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="40.0,30.0 46.0,44.3 52.0,57.2 58.0,68.9 64.0,79.5 70.0,89.0 76.0,97.7 82.0,105.5 88.0,112.6 94.0,119.0 100.0,124.8 106.0,130.1 112.0,134.8 118.0,139.1 124.0,143.0 130.0,146.5 136.0,149.7 142.0,152.6 148.0,155.2 154.0,157.6 160.0,159.7 166.0,161.6 172.0,163.4 178.0,165.0 184.0,166.4 190.0,167.7 196.0,168.9 202.0,169.9 208.0,170.9 214.0,171.7 220.0,172.5 226.0,173.2 232.0,173.9 238.0,174.5 244.0,175.0 250.0,175.5 256.0,175.9 262.0,176.3 268.0,176.6 274.0,177.0 280.0,177.3 286.0,177.5 292.0,177.8 298.0,178.0 304.0,178.2 310.0,178.3 316.0,178.5 322.0,178.6 328.0,178.8 334.0,178.9 340.0,179.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,30.0 43.0,63.2 46.0,89.0 49.0,109.1 52.0,124.8 55.0,137.0 58.0,146.5 61.0,153.9 64.0,159.7 67.0,164.2 70.0,167.7 73.0,170.4 76.0,172.5 79.0,174.2 82.0,175.5 85.0,176.5 88.0,177.3 91.0,177.9 94.0,178.3 97.0,178.7 100.0,179.0 103.0,179.2 106.0,179.4 109.0,179.5 112.0,179.6 115.0,179.7 118.0,179.8 121.0,179.8 124.0,179.9 127.0,179.9 130.0,179.9 133.0,179.9 136.0,179.9 139.0,180.0 142.0,180.0 145.0,180.0 148.0,180.0 151.0,180.0 154.0,180.0 157.0,180.0 160.0,180.0 163.0,180.0 166.0,180.0 169.0,180.0 172.0,180.0 175.0,180.0 178.0,180.0 181.0,180.0 184.0,180.0 187.0,180.0 190.0,180.0 193.0,180.0 196.0,180.0 199.0,180.0 202.0,180.0 205.0,180.0 208.0,180.0 211.0,180.0 214.0,180.0 217.0,180.0 220.0,180.0 223.0,180.0 226.0,180.0 229.0,180.0 232.0,180.0 235.0,180.0 238.0,180.0 241.0,180.0 244.0,180.0 247.0,180.0 250.0,180.0 253.0,180.0 256.0,180.0 259.0,180.0 262.0,180.0 265.0,180.0 268.0,180.0 271.0,180.0 274.0,180.0 277.0,180.0 280.0,180.0 283.0,180.0 286.0,180.0 289.0,180.0 292.0,180.0 295.0,180.0 298.0,180.0 301.0,180.0 304.0,180.0 307.0,180.0 310.0,180.0 313.0,180.0 316.0,180.0 319.0,180.0 322.0,180.0 325.0,180.0 328.0,180.0 331.0,180.0 334.0,180.0 337.0,180.0 340.0,180.0"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="196">0</text><text x="100" y="196">1</text><text x="160" y="196">2</text><text x="220" y="196">3</text><text x="280" y="196">4</text><text x="340" y="196">5 s</text>
  </g>
  <text x="34" y="34" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="250" y="97.5" font-size="12" fill="#1d6fd1">s = 0.2</text>
  <text x="112" y="118.8" font-size="12" fill="#1f2a44">s = 1</text>
  <text x="80" y="156" font-size="12" fill="#b4232c">s = 5</text>
</svg>
```

Letting $s \to 0$ flattens the weight to $1$ everywhere; letting $s \to \infty$ squeezes it onto $t = 0$.
:::
