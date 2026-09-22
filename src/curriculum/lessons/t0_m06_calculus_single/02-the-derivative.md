---
id: l02-the-derivative
title: The derivative from first principles
minutes: 24
covers:
  - the derivative: definition, chain, product and quotient rules
---

Every equation of motion a GNC engineer writes is a statement about derivatives. Velocity is the derivative of position, acceleration the derivative of velocity, thrust divided by mass is the acceleration a rocket produces, angular rate is the derivative of attitude. A gyroscope measures a derivative directly; an accelerometer measures another. When a navigation filter propagates its state between measurements it integrates derivatives, and when it linearises a sensor model it differentiates one. The derivative is not one tool among many here; it is the language.

This lesson defines the derivative as the limit of the previous lesson, then does something that most later work will let you skip: it computes derivatives directly from that definition. Powers of $x$, the sine and cosine, the exponential and the logarithm all yield to the definition plus a little algebra, and seeing them yield is what makes the rules of the next lesson believable rather than memorised. Along the way you will meet the notations you will read for the rest of your career, and the numerical derivative that flight software uses when no formula is available.

## The definition

Let $f$ be a function and $x$ a point in its domain. The **derivative of $f$ at $x$** is

$$
f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h},
$$

provided the limit exists. The fraction is the **difference quotient**: the change in $f$ over an interval of width $h$, divided by $h$. Geometrically it is the slope of the secant line through $(x, f(x))$ and $(x + h, f(x + h))$; the derivative is the slope of the tangent line at $x$, the line the secants approach as $h \to 0$. Physically, if $f$ is a position and $x$ a time, the difference quotient is an average velocity and the derivative is the velocity at the instant.

When the limit exists we say $f$ is **differentiable at $x$**. Treating $x$ as variable, $f'$ is itself a function, defined wherever the limit exists.

You will see the same object written many ways, and you must read all of them fluently:

- Lagrange's prime, $f'(x)$, and for higher derivatives $f''(x)$, $f'''(x)$, $f^{(4)}(x)$.
- Leibniz's ratio, $\dfrac{dy}{dx}$ or $\dfrac{df}{dx}$, which records what is being differentiated with respect to what. The second derivative is $\dfrac{d^2 y}{dx^2}$. The operator form $\dfrac{d}{dx}\big(\cdots\big)$ means "differentiate the thing in the brackets with respect to $x$".
- Newton's dot for time derivatives, $\dot x = \dfrac{dx}{dt}$ and $\ddot x = \dfrac{d^2x}{dt^2}$. Dynamics papers and flight-software comments use dots almost exclusively; $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u})$ is how every state-space model is written.
- The differential form $df = f'(x)\,dx$, which reads "a small change $dx$ in the input produces the change $f'(x)\,dx$ in the output", and which the linearisation lesson makes precise.

## Velocity and acceleration

If $s(t)$ is position along a line, then velocity is $v(t) = \dot s(t)$ and acceleration is $a(t) = \dot v(t) = \ddot s(t)$. The units follow the definition: a difference quotient of metres over seconds is metres per second, and a difference quotient of that over seconds is metres per second squared. Because $g_0 = 9.80665\,\mathrm{m/s^2}$ is the reference gravitational acceleration, accelerations are often quoted as multiples of it: a crew vehicle at "$4\,g$" is accelerating at $39.2\,\mathrm{m/s^2}$.

::: example Velocity and acceleration from the definition
The ascent altitude from the previous lesson was $h(t) = 3t^2 + 0.02t^3$ metres. Find $v(t)$ and $a(t)$, and evaluate both at $t = 10\,\mathrm{s}$.

Form the difference quotient for general $t$. Expanding $(t + h)^2 = t^2 + 2th + h^2$ and $(t + h)^3 = t^3 + 3t^2h + 3th^2 + h^3$,

$$
\frac{h(t + \Delta t) - h(t)}{\Delta t}
= \frac{3(2t\,\Delta t + \Delta t^2) + 0.02(3t^2\,\Delta t + 3t\,\Delta t^2 + \Delta t^3)}{\Delta t}
= 6t + 0.06t^2 + (3 + 0.06t)\Delta t + 0.02\Delta t^2 .
$$

(The interval is written $\Delta t$ here so that it is not confused with the altitude $h$.) Every term containing $\Delta t$ vanishes in the limit, leaving $v(t) = 6t + 0.06t^2$. At $t = 10$: $v = 60 + 6 = 66\,\mathrm{m/s}$, matching the table of shrinking averages.

Differentiate again. The difference quotient of $v$ is $\dfrac{6\Delta t + 0.06(2t\,\Delta t + \Delta t^2)}{\Delta t} = 6 + 0.12t + 0.06\Delta t \to 6 + 0.12t$. So $a(t) = 6 + 0.12t$, and $a(10) = 7.2\,\mathrm{m/s^2}$, about $0.73\,g$. The acceleration grows with time, as it does on a real vehicle whose thrust stays roughly constant while its mass falls.
:::

::: example A Falcon 9 leaving the pad
At liftoff a Falcon 9 has mass about $549{,}000\,\mathrm{kg}$ and its nine engines produce about $7{,}607\,\mathrm{kN}$ at sea level. Ignoring drag and the small change in mass over the first few seconds, what is its acceleration, and how fast and how high is it after $5\,\mathrm{s}$?

Newton's second law gives the net acceleration as thrust per unit mass minus gravity:

$$
a = \frac{T}{m} - g_0 = \frac{7.607 \times 10^6}{5.49 \times 10^5} - 9.80665 = 13.856 - 9.807 = 4.05\,\mathrm{m/s^2}.
$$

With constant acceleration from rest, velocity is $v(t) = at$ and altitude is $h(t) = \tfrac12 at^2$ — you can verify both by differentiating: $\dfrac{d}{dt}\big(\tfrac12 a t^2\big) = at$ and $\dfrac{d}{dt}(at) = a$. At $t = 5\,\mathrm{s}$, $v = 20.2\,\mathrm{m/s}$ and $h = 50.6\,\mathrm{m}$. The vehicle takes about five seconds to climb its own height of $70\,\mathrm{m}$, which matches what you see in launch footage. The acceleration $4.05\,\mathrm{m/s^2}$ is only $0.41\,g$: the vehicle is lifting off with a thrust-to-weight ratio of $13.856/9.807 = 1.41$, and most of the thrust is spent holding the vehicle up rather than speeding it up. That waste is the gravity loss, and the rocket-equation lesson quantifies it.
:::

## Derivatives from the definition: powers and linearity

**Constants.** If $f(x) = c$ then $f(x + h) - f(x) = 0$ for every $h$, so $f'(x) = 0$.

**The identity.** If $f(x) = x$ then the difference quotient is $h/h = 1$, so $f'(x) = 1$.

**Squares.** If $f(x) = x^2$, then $\dfrac{(x + h)^2 - x^2}{h} = \dfrac{2xh + h^2}{h} = 2x + h \to 2x$.

**General powers.** For a positive integer $n$, the binomial theorem gives $(x + h)^n = x^n + n x^{n-1} h + \binom{n}{2} x^{n-2} h^2 + \cdots + h^n$. Subtract $x^n$, divide by $h$, and every term after the first still carries at least one factor of $h$:

$$
\frac{(x + h)^n - x^n}{h} = n x^{n-1} + \binom{n}{2} x^{n-2} h + \cdots + h^{n-1} \;\longrightarrow\; n x^{n-1}.
$$

This is the **power rule**, $\dfrac{d}{dx} x^n = n x^{n-1}$. It holds for negative and fractional exponents too, which the next lesson establishes once the chain rule and implicit differentiation are available; for now, here is the case $n = -1$ directly:

$$
\frac{1}{h}\left(\frac{1}{x + h} - \frac{1}{x}\right) = \frac{1}{h}\cdot\frac{x - (x + h)}{x(x + h)} = \frac{-1}{x(x + h)} \;\longrightarrow\; -\frac{1}{x^2} = -x^{-2},
$$

exactly what $n x^{n-1}$ predicts with $n = -1$.

**Linearity.** The derivative of a sum is the sum of the derivatives, and constants pull out: $(f + g)' = f' + g'$ and $(cf)' = c f'$. Both follow from the limit laws, since the difference quotient of $f + g$ is the sum of the two difference quotients, and that of $cf$ is $c$ times the difference quotient of $f$. Linearity plus the power rule differentiates every polynomial: $\dfrac{d}{dt}(3t^2 + 0.02t^3) = 6t + 0.06t^2$, which is the velocity found above without a single limit being written down.

::: note
The exponent comes down as a coefficient and drops by one. A quick sanity check that never fails: the derivative of a polynomial of degree $n$ has degree $n - 1$, and the derivative of a linear function is its slope. When a physical quantity is $\tfrac12 a t^2$, its derivative $at$ has one less power of time and hence units with one less second in the denominator — exactly the unit shift from metres to metres per second.
:::

## Differentiable implies continuous — but not the reverse

If $f$ is differentiable at $x$, then $f$ is continuous there. The argument is one line:

$$
f(x + h) - f(x) = \frac{f(x + h) - f(x)}{h}\cdot h \;\longrightarrow\; f'(x)\cdot 0 = 0 \quad\text{as } h \to 0,
$$

so $f(x + h) \to f(x)$, which is continuity. A function with a jump therefore has no derivative at the jump — a step in a commanded thrust has no well-defined rate of change there.

The converse fails. $f(x) = |x|$ is continuous at $0$ but its difference quotient there is $|h|/h$, which is $+1$ for $h > 0$ and $-1$ for $h < 0$. The one-sided limits disagree, so the derivative does not exist: the graph has a **corner**. Other ways to be continuous but not differentiable are a **cusp**, like $x^{2/3}$ at $0$, and a **vertical tangent**, like $x^{1/3}$ at $0$, where the difference quotient goes to infinity. In flight software these show up as saturation limits and deadbands, which are continuous functions with corners; any linearisation of them at the corner is ill-defined, and designers move the operating point away from it or smooth the corner.

## Derivatives of sine and cosine

Now the two trigonometric limits earn their keep. For $f(x) = \sin x$, use the angle-addition formula $\sin(x + h) = \sin x \cos h + \cos x \sin h$:

$$
\frac{\sin(x + h) - \sin x}{h}
= \frac{\sin x\,(\cos h - 1) + \cos x \sin h}{h}
= -\sin x \cdot \frac{1 - \cos h}{h} + \cos x \cdot \frac{\sin h}{h}.
$$

As $h \to 0$ the first ratio goes to $0$ and the second to $1$, so

$$
\frac{d}{dx}\sin x = \cos x .
$$

For cosine, $\cos(x + h) = \cos x \cos h - \sin x \sin h$, and the same steps give

$$
\frac{\cos(x + h) - \cos x}{h} = -\cos x \cdot \frac{1 - \cos h}{h} - \sin x \cdot \frac{\sin h}{h} \;\longrightarrow\; -\sin x,
$$

so $\dfrac{d}{dx}\cos x = -\sin x$. Notice the structure: differentiating advances the phase by a quarter turn, since $\cos x = \sin(x + \pi/2)$ and $-\sin x = \cos(x + \pi/2)$. Differentiate four times and you return to where you started. This is why $\sin$ and $\cos$ are the natural language of oscillation: a spring-mass system obeys $\ddot x = -\omega^2 x$, and $x = A\sin(\omega t)$ satisfies it because two derivatives bring down $\omega^2$ and a minus sign.

The radian requirement of the previous lesson propagates here. If angles are in degrees, $\dfrac{d}{d\theta}\sin\theta = \dfrac{\pi}{180}\cos\theta$, and a controller gain derived from the radian formula will be off by a factor of $57.3$.

## The exponential and the number $e$

For an exponential $f(x) = b^x$ with base $b > 0$, the difference quotient factors:

$$
\frac{b^{x + h} - b^x}{h} = b^x \cdot \frac{b^h - 1}{h}.
$$

The factor $b^x$ is untouched by the limit; whatever $\lim_{h \to 0}(b^h - 1)/h$ is, call it $L_b$, the derivative is $L_b\, b^x$. So every exponential is proportional to its own derivative, and the constant of proportionality depends only on the base. Evaluate it numerically at $h = 0.001$: for $b = 2$ the quotient is $0.6934$; for $b = 3$ it is $1.0992$. Somewhere between $2$ and $3$ there is a base for which the constant is exactly $1$. That base is defined to be $e$:

$$
e \text{ is the number for which } \lim_{h \to 0} \frac{e^h - 1}{h} = 1, \qquad e = 2.71828\ldots
$$

With this definition, $\dfrac{d}{dx} e^x = e^x$: the exponential with base $e$ is its own derivative. At $h = 0.001$ the quotient for base $2.71828$ is $1.0005$, confirming the choice. The constant $L_b$ for other bases turns out to be $\ln b$, so $\dfrac{d}{dx} b^x = b^x \ln b$; the next lesson derives this from the chain rule. The numbers above already agree: $\ln 2 = 0.6931$ and $\ln 3 = 1.0986$.

The physical meaning is the one that matters most in GNC: a quantity whose rate of change is proportional to itself, $\dot x = kx$, is an exponential $x_0 e^{kt}$. Growth if $k > 0$, decay if $k < 0$. The separable-ODE lesson makes this rigorous; here, note that $\dfrac{d}{dt}\big(x_0 e^{kt}\big) = k x_0 e^{kt}$ follows from $\dfrac{d}{dx}e^x = e^x$ once the chain rule supplies the factor $k$.

## The natural logarithm

The natural logarithm $\ln x$ is the inverse of $e^x$: $\ln(e^y) = y$ and $e^{\ln x} = x$ for $x > 0$. Its derivative also comes straight from the definition. Using $\ln a - \ln b = \ln(a/b)$,

$$
\frac{\ln(x + h) - \ln x}{h} = \frac{1}{h}\ln\!\left(1 + \frac{h}{x}\right).
$$

Put $u = h/x$, so $h = xu$ and $u \to 0$ as $h \to 0$:

$$
\frac{1}{xu}\ln(1 + u) = \frac{1}{x}\cdot\frac{\ln(1 + u)}{u}.
$$

The remaining limit is $1$. To see why, set $u = e^s - 1$, so $s = \ln(1 + u)$ and $s \to 0$ as $u \to 0$; then $\dfrac{\ln(1 + u)}{u} = \dfrac{s}{e^s - 1}$, the reciprocal of the quotient that defines $e$, and its limit is $1/1 = 1$. Numerically, $\ln(1.1)/0.1 = 0.9531$, $\ln(1.01)/0.01 = 0.9950$, $\ln(1.001)/0.001 = 0.9995$. Therefore

$$
\frac{d}{dx}\ln x = \frac{1}{x}, \qquad x > 0.
$$

This is the derivative that produces the logarithm in the rocket equation: integrating $1/m$ with respect to $m$ gives $\ln m$, because $\ln m$ is what differentiates to $1/m$.

::: key
Limit definition of the derivative: $\displaystyle f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}$. It is the slope of the tangent line, and for a position it is the velocity. Notations: $f'(x)$, $\dfrac{dy}{dx}$, $\dot x$ for time derivatives, $df = f'(x)\,dx$ for differentials.
:::

::: key
Derivatives of the elementary functions, in derivative and differential form:
$\dfrac{d}{dx}\sin x = \cos x$, that is $d(\sin x) = \cos x\,dx$;
$\dfrac{d}{dx}\cos x = -\sin x$, that is $d(\cos x) = -\sin x\,dx$;
$\dfrac{d}{dx}e^x = e^x$, that is $d(e^x) = e^x\,dx$;
$\dfrac{d}{dx}\ln x = \dfrac{1}{x}$, that is $d(\ln x) = \dfrac{dx}{x}$.
Together with the power rule $\dfrac{d}{dx}x^n = nx^{n-1}$ and linearity, these are the atoms every other derivative is built from.
:::

## Numerical derivatives

Flight software frequently needs a derivative of a function it can only evaluate — a table-lookup aerodynamic coefficient, or a sensor model too messy to differentiate by hand. The definition suggests the **forward difference**: choose a small $h$ and compute $\dfrac{f(x + h) - f(x)}{h}$. A better estimate at the same cost per point is the **central difference** $\dfrac{f(x + h) - f(x - h)}{2h}$, which is the slope of the secant through points on either side of $x$.

::: example Numerical derivative of sine at one radian
Estimate $\dfrac{d}{dx}\sin x$ at $x = 1$ by forward and central differences and compare with the exact value $\cos 1 = 0.540302$.

| $h$ | Forward difference | Error | Central difference | Error |
| --- | --- | --- | --- | --- |
| 0.1 | 0.497364 | $-4.3 \times 10^{-2}$ | 0.539402 | $-9.0 \times 10^{-4}$ |
| 0.01 | 0.536086 | $-4.2 \times 10^{-3}$ | 0.540293 | $-9.0 \times 10^{-6}$ |
| 0.001 | 0.539881 | $-4.2 \times 10^{-4}$ | 0.540302 | $-9.0 \times 10^{-8}$ |

Each tenfold reduction in $h$ cuts the forward-difference error by ten and the central-difference error by a hundred. The forward error is proportional to $h$ and the central error to $h^2$; the Taylor-series lesson shows exactly why and gives the constants ($\tfrac12 h |f''|$ and $\tfrac16 h^2 |f'''|$). In practice $h$ cannot be shrunk indefinitely, because subtracting two nearly equal floating-point numbers loses digits; a central difference with $h$ around $10^{-5}$ is a common compromise for double precision.
:::

::: warning
The derivative at a point is a number; the derivative as a function is a rule. Students slip when asked for $f'(2)$ and answer with $f'(x)$, or when they substitute $x = 2$ *before* differentiating and get $\dfrac{d}{dx}(\text{constant}) = 0$. Differentiate first, then substitute. In Leibniz notation the evaluation is written $\left.\dfrac{dy}{dx}\right|_{x = 2}$.
:::

## Check yourself

::: check
Use the definition to find the derivative of $f(x) = \dfrac{1}{x^2}$, and check it against the power rule.
:::

::: answer
The difference quotient is $\dfrac{1}{h}\left(\dfrac{1}{(x + h)^2} - \dfrac{1}{x^2}\right) = \dfrac{x^2 - (x + h)^2}{h\,x^2(x + h)^2} = \dfrac{-2xh - h^2}{h\,x^2(x + h)^2} = \dfrac{-2x - h}{x^2(x + h)^2}$. As $h \to 0$ this tends to $\dfrac{-2x}{x^4} = -\dfrac{2}{x^3}$. The power rule with $n = -2$ gives $-2x^{-3}$, the same thing.
:::

::: check
A spacecraft's along-track position during a burn is $s(t) = 4t + 0.9t^2 - 0.01t^3$ metres. Find its velocity and acceleration as functions of time, and the time at which the acceleration is zero.
:::

::: answer
By linearity and the power rule, $v(t) = 4 + 1.8t - 0.03t^2\,\mathrm{m/s}$ and $a(t) = 1.8 - 0.06t\,\mathrm{m/s^2}$. Setting $a = 0$ gives $t = 30\,\mathrm{s}$. Before that the vehicle speeds up; after it, it slows. At $t = 30$ the velocity is $4 + 54 - 27 = 31\,\mathrm{m/s}$, its maximum, since velocity stops increasing exactly when acceleration passes through zero.
:::

::: check
Compute $\dfrac{d}{dx}\big(5\sin x - 2\cos x + 3e^x - 7\ln x + x^4\big)$.
:::

::: answer
Term by term: $5\cos x + 2\sin x + 3e^x - \dfrac{7}{x} + 4x^3$. The sign flip on the cosine term is the usual trap: $\dfrac{d}{dx}(-2\cos x) = -2 \cdot (-\sin x) = +2\sin x$.
:::

::: check
Explain, using the definition, why $\dfrac{d}{dx}\sin x$ evaluated at $x = 0$ equals $1$, and what this has to do with the small-angle approximation $\sin\theta \approx \theta$.
:::

::: answer
At $x = 0$ the definition reads $f'(0) = \lim_{h \to 0} \dfrac{\sin h - \sin 0}{h} = \lim_{h \to 0}\dfrac{\sin h}{h} = 1$. So the tangent line to $\sin$ at the origin is $y = x$, and the small-angle approximation $\sin\theta \approx \theta$ is precisely the statement that near zero the function is well approximated by its tangent line. The approximation is good because the slope is exactly $1$ there; how good, and for how far, is the subject of the linearisation and Taylor lessons.
:::

::: check
Is $f(x) = |x - 3|$ differentiable at $x = 3$? Is it continuous there? What does this say about a saturation function such as $\operatorname{sat}(u) = \min(\max(u, -1), 1)$ at $u = 1$?
:::

::: answer
Continuous, yes: $|x - 3| \to 0 = f(3)$. Differentiable, no: the difference quotient at $3$ is $|h|/h$, which is $+1$ from the right and $-1$ from the left. The saturation function is continuous everywhere but has corners at $u = \pm 1$: slope $1$ inside, slope $0$ outside, no derivative at the corner itself. A linearised model of an actuator that is sitting exactly at its limit is therefore ambiguous, which is one reason control designers keep the trim point away from saturation.
:::

## Summary

| Symbol or rule | Meaning |
| --- | --- |
| $f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}$ | Definition of the derivative; slope of the tangent; instantaneous rate |
| $\dfrac{dy}{dx}$, $\dot x$, $\ddot x$, $df = f'\,dx$ | Leibniz, Newton and differential notations |
| $v = \dot s$, $a = \dot v = \ddot s$ | Velocity and acceleration, m/s and m/s² |
| $\frac{d}{dx}c = 0$, $\frac{d}{dx}x^n = nx^{n-1}$ | Constants and the power rule |
| $(f + g)' = f' + g'$, $(cf)' = cf'$ | Linearity |
| $\frac{d}{dx}\sin x = \cos x$, $\frac{d}{dx}\cos x = -\sin x$ | Trigonometric derivatives (radians) |
| $\frac{d}{dx}e^x = e^x$, $\frac{d}{dx}\ln x = 1/x$ | The exponential and the logarithm |
| Differentiable $\Rightarrow$ continuous | Corners, cusps and jumps have no derivative |
| Forward and central differences | Numerical derivatives with errors $\propto h$ and $\propto h^2$ |

The definition handles individual functions well but becomes painful for combinations: products, quotients and, above all, functions of functions. The next lesson proves the product, quotient and chain rules and shows that with them the limit never needs to be written again.
