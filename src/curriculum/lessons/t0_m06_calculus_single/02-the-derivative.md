---
id: l02-the-derivative
title: The derivative from first principles
minutes: 21
covers:
  - the derivative: definition, chain, product and quotient rules
---

Ride a bike down a hill. At every moment you have a position on the road, a speed, and a sense of how fast that speed is growing. Speed is how fast position changes. The growth in speed is how fast speed changes. "How fast something changes, at this very moment" has a name in mathematics: the **derivative**.

Every equation of motion a guidance, navigation and control (GNC) engineer writes is a statement about derivatives. Velocity is the derivative of position. Acceleration is the derivative of velocity. Thrust divided by mass is the acceleration a rocket's engine gives it. Angular rate — how fast the vehicle is turning — is the derivative of its attitude. A **[[gyroscope|gyro-accel]]** measures a derivative directly, and an accelerometer measures another. When a navigation filter steps its estimate forward between measurements, it adds up derivatives. When it simplifies a sensor model, it takes one. The derivative is not one tool among many here. It is the language.

This lesson defines the derivative using the limit from the last lesson. Then it does something most later work lets you skip: it computes derivatives straight from that definition. Powers of $x$, sine and cosine, the exponential and the logarithm all give way to the definition plus a little algebra. Seeing them give way is what makes the rules of the next lesson believable instead of memorized. Along the way you will meet the notations you will read for the rest of your career, and the numerical derivative that flight software uses when no formula is available.

## The definition

Picture a curve and a point on it. Pick a second point a little farther along. The straight line through the two points is a **secant** — a line that cuts through the curve at two places. Its slope (rise over run) is the average rate of change between them. Now slide the second point toward the first. The secant swings round and settles on the **[[tangent line|secant-tangent]]** — the line that touches the curve at that one point and runs in the same direction as the curve there. The slope of the tangent is the derivative.

In symbols: let $f$ be a function and $x$ a point where it is defined. The **derivative of $f$ at $x$** is

$$
f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h},
$$

provided the limit exists. Read $f'(x)$ as "f prime of x". Here $h$ is the step from the first point to the second. The fraction is the **difference quotient**: the change in $f$ across a step of width $h$, divided by $h$. It is the slope of the secant. Its limit, as the step shrinks, is the slope of the tangent.

If $f$ is a position and $x$ is a time, the difference quotient is an average velocity — exactly what you computed in the table of the last lesson — and the derivative is the velocity at the instant.

When the limit exists, we say $f$ is **differentiable at $x$**. Let $x$ vary, and $f'$ becomes a function of its own, defined wherever the limit exists.

### Four ways to write it

You will see the same idea written in several ways, and you need to read all of them fluently.

- **Prime notation** (from the mathematician Lagrange): $f'(x)$. Higher derivatives — the derivative of the derivative, and so on — are $f''(x)$, $f'''(x)$, then $f^{(4)}(x)$.
- **[[Leibniz notation|notation-history]]**: $\dfrac{dy}{dx}$ or $\dfrac{df}{dx}$, read "d y d x". It records what is being differentiated and with respect to what. The second derivative is $\dfrac{d^2 y}{dx^2}$. The operator $\dfrac{d}{dx}\big(\cdots\big)$ means "take the derivative of what is in the brackets, with respect to $x$".
- **Newton's dot**, for derivatives with respect to time only: $\dot x = \dfrac{dx}{dt}$ ("x dot") and $\ddot x = \dfrac{d^2x}{dt^2}$ ("x double dot"). Dynamics papers and flight-software comments use dots almost everywhere. Every **state-space model** — the standard way to write a vehicle's equations of motion — is written $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u})$.
- **Differential form**: $df = f'(x)\,dx$. Read it as "a small change $dx$ in the input makes the change $f'(x)\,dx$ in the output". The linearization lesson makes this precise.

## Velocity and acceleration

If $s(t)$ is position along a line, then velocity is $v(t) = \dot s(t)$, and acceleration is $a(t) = \dot v(t) = \ddot s(t)$.

The units come straight from the definition. A difference quotient of meters over seconds is meters per second. Another one of those over seconds is meters per second squared, $\mathrm{m/s^2}$.

Engineers often quote accelerations as multiples of $g_0 = 9.80665\,\mathrm{m/s^2}$, the standard pull of gravity at Earth's surface. A crew vehicle pulling "$4\,g$" — **[[four g|g-load]]** — is accelerating at $4 \times 9.80665 = 39.2\,\mathrm{m/s^2}$.

::: example Velocity and acceleration from the definition
The rocket in the last lesson had altitude $h(t) = 3t^2 + 0.02t^3$ meters. Find $v(t)$ and $a(t)$, and evaluate both at $t = 10\,\mathrm{s}$.

We call the step $\Delta t$ here, so it is not confused with the altitude $h$. First expand the two powers: $(t + \Delta t)^2 = t^2 + 2t\,\Delta t + \Delta t^2$ and $(t + \Delta t)^3 = t^3 + 3t^2\,\Delta t + 3t\,\Delta t^2 + \Delta t^3$. Subtract $h(t)$, so the $t^2$ and $t^3$ terms cancel, and divide by $\Delta t$:

$$
\frac{h(t + \Delta t) - h(t)}{\Delta t}
= \frac{3(2t\,\Delta t + \Delta t^2) + 0.02(3t^2\,\Delta t + 3t\,\Delta t^2 + \Delta t^3)}{\Delta t}
= 6t + 0.06t^2 + (3 + 0.06t)\Delta t + 0.02\Delta t^2 .
$$

Every term that still has a $\Delta t$ in it vanishes in the limit. What is left is

$$
v(t) = 6t + 0.06t^2 .
$$

At $t = 10$: $v = 60 + 6 = 66\,\mathrm{m/s}$. That matches the table of shrinking averages in the last lesson.

Now do it again to $v$. Its difference quotient is $\dfrac{6\Delta t + 0.06(2t\,\Delta t + \Delta t^2)}{\Delta t} = 6 + 0.12t + 0.06\Delta t$, which tends to $6 + 0.12t$. So

$$
a(t) = 6 + 0.12t, \qquad a(10) = 7.2\,\mathrm{m/s^2},
$$

about $0.73\,g$. The acceleration grows with time. That fits a real rocket: its thrust stays roughly constant while its mass falls as propellant burns.
:::

::: example A Falcon 9 leaving the pad
At liftoff a Falcon 9 has a mass of about $549{,}000\,\mathrm{kg}$, and its nine engines push with about $7{,}607\,\mathrm{kN}$ at sea level. Ignore air drag and the small drop in mass over the first few seconds. What is its acceleration, and how fast and how high is it after $5\,\mathrm{s}$?

Newton's second law: the net acceleration is thrust per kilogram, minus gravity's pull.

$$
a = \frac{T}{m} - g_0 = \frac{7.607 \times 10^6}{5.49 \times 10^5} - 9.80665 = 13.856 - 9.807 = 4.05\,\mathrm{m/s^2}.
$$

Starting from rest with constant acceleration, velocity is $v(t) = at$ and altitude is $h(t) = \tfrac12 at^2$. You can check both by differentiating: $\dfrac{d}{dt}\big(\tfrac12 a t^2\big) = at$ and $\dfrac{d}{dt}(at) = a$.

At $t = 5\,\mathrm{s}$: $v = 4.05 \times 5 = 20.2\,\mathrm{m/s}$ and $h = \tfrac12 \times 4.05 \times 25 = 50.6\,\mathrm{m}$. The rocket is about $70\,\mathrm{m}$ tall, so it needs $t = \sqrt{2 \times 70 / 4.05} \approx 5.9\,\mathrm{s}$ to climb its own height. That slow, heavy start matches launch footage.

Why so gentle? $4.05\,\mathrm{m/s^2}$ is only $0.41\,g$. The thrust-to-weight ratio is $13.856/9.807 = 1.41$, so most of the thrust goes into holding the rocket up rather than speeding it up. That wasted effort is the **gravity loss**, and the last lesson of this module puts a number on it.
:::

## Derivatives from the definition: powers and linearity

Now let's feed the definition some simple functions and see what comes out.

**Constants.** If $f(x) = c$, a constant, then $f(x + h) - f(x) = 0$ for every $h$. So $f'(x) = 0$. A flat line has zero slope.

**The identity.** If $f(x) = x$, the difference quotient is $h/h = 1$. So $f'(x) = 1$.

**Squares.** If $f(x) = x^2$, expand $(x + h)^2 = x^2 + 2xh + h^2$:

$$
\frac{(x + h)^2 - x^2}{h} = \frac{2xh + h^2}{h} = 2x + h \;\longrightarrow\; 2x .
$$

**General powers.** For a whole number $n$, the **[[binomial theorem|binomial]]** expands the power:

$$
(x + h)^n = x^n + n x^{n-1} h + \binom{n}{2} x^{n-2} h^2 + \cdots + h^n .
$$

($\binom{n}{2}$, read "n choose 2", is a fixed whole number; its value does not matter here.) Subtract $x^n$ and divide by $h$. Every term after the first still carries at least one $h$:

$$
\frac{(x + h)^n - x^n}{h} = n x^{n-1} + \binom{n}{2} x^{n-2} h + \cdots + h^{n-1} \;\longrightarrow\; n x^{n-1}.
$$

This is the **power rule**, $\dfrac{d}{dx} x^n = n x^{n-1}$: bring the power down in front, then lower the power by one. It also holds for negative and fractional powers; the next lesson proves that using the chain rule. For now, here is $n = -1$ straight from the definition. Combine the two fractions over a common bottom:

$$
\frac{1}{h}\left(\frac{1}{x + h} - \frac{1}{x}\right) = \frac{1}{h}\cdot\frac{x - (x + h)}{x(x + h)} = \frac{-1}{x(x + h)} \;\longrightarrow\; -\frac{1}{x^2} = -x^{-2}.
$$

That is exactly what $n x^{n-1}$ predicts with $n = -1$.

**Linearity.** The derivative of a sum is the sum of the derivatives, and constant multipliers pull out front:

$$
(f + g)' = f' + g', \qquad (cf)' = c f' .
$$

Both follow from the limit laws. The difference quotient of $f + g$ is the sum of the two difference quotients, and that of $cf$ is $c$ times the difference quotient of $f$.

Linearity plus the power rule differentiates every polynomial. For example, $\dfrac{d}{dt}(3t^2 + 0.02t^3) = 3 \cdot 2t + 0.02 \cdot 3t^2 = 6t + 0.06t^2$. That is the velocity from the first example — found this time without writing a single limit.

::: note A units check that never fails
The power comes down as a multiplier and drops by one. So the derivative of a polynomial of degree $n$ (highest power $n$) has degree $n - 1$, and the derivative of a straight line is its slope. When a quantity is $\tfrac12 a t^2$, its derivative $at$ has one less power of time — and units with one less "per second". That is exactly the step from meters to meters per second.
:::

## Differentiable means continuous — but not the other way round

If $f$ has a derivative at $x$, then $f$ is continuous there. Here is why. Write the change in $f$ as the difference quotient times $h$:

$$
f(x + h) - f(x) = \frac{f(x + h) - f(x)}{h}\cdot h \;\longrightarrow\; f'(x)\cdot 0 = 0 \quad\text{as } h \to 0 .
$$

So $f(x + h) \to f(x)$, which is continuity. A function with a jump therefore has no derivative at the jump. A sudden step in a commanded thrust has no sensible rate of change at the moment of the step.

The reverse is false. $f(x) = |x|$ is continuous at $0$, but look at its difference quotient there: $|h|/h$. That is $+1$ for $h > 0$ and $-1$ for $h < 0$. The one-sided limits disagree, so there is no derivative. The graph has a **corner**, a sharp point where the slope changes suddenly.

There are other ways to be continuous without a derivative. A **cusp** is a sharp point where both sides arrive heading straight up, like $x^{2/3}$ at $0$. A **vertical tangent**, like $x^{1/3}$ at $0$, has a difference quotient that shoots off to infinity.

In flight software these turn up as **[[saturation limits and deadbands|saturation-corner]]**. A saturation limit caps a command at the most an actuator can deliver. A deadband ignores inputs too small to matter. Both are continuous, and both have corners. A straight-line model of them at a corner is not well defined, so designers keep the **operating point** — the input value the design is centered on — away from the corner, or round the corner off.

## Derivatives of sine and cosine

Now the two trigonometric limits from the last lesson earn their keep. For $f(x) = \sin x$, use the angle-addition formula $\sin(x + h) = \sin x \cos h + \cos x \sin h$, then group the terms:

$$
\frac{\sin(x + h) - \sin x}{h}
= \frac{\sin x\,(\cos h - 1) + \cos x \sin h}{h}
= -\sin x \cdot \frac{1 - \cos h}{h} + \cos x \cdot \frac{\sin h}{h}.
$$

As $h \to 0$, the first ratio goes to $0$ and the second to $1$. So

$$
\frac{d}{dx}\sin x = \cos x .
$$

For cosine, $\cos(x + h) = \cos x \cos h - \sin x \sin h$, and the same steps give

$$
\frac{\cos(x + h) - \cos x}{h} = -\cos x \cdot \frac{1 - \cos h}{h} - \sin x \cdot \frac{\sin h}{h} \;\longrightarrow\; -\sin x,
$$

so $\dfrac{d}{dx}\cos x = -\sin x$.

Look at the **[[pattern|sin-cos-slopes]]**. Taking the derivative shifts the wave a quarter turn ahead: $\cos x = \sin(x + \pi/2)$, and $-\sin x = \cos(x + \pi/2)$. Differentiate four times and you are back where you started. That is why sine and cosine are the natural language of anything that vibrates. A weight on a spring obeys $\ddot x = -\omega^2 x$, where $\omega$ ("omega") is how fast it swings. The motion $x = A\sin(\omega t)$ fits, because two derivatives bring out $\omega^2$ and a minus sign.

The radian rule from the last lesson carries over. With angles in degrees, $\dfrac{d}{d\theta}\sin\theta = \dfrac{\pi}{180}\cos\theta$, and a controller gain worked out with the radian formula would be off by a factor of $57.3$.

## The exponential and the number $e$

Now try an **exponential**, $f(x) = b^x$, where the base $b$ is a positive number and the variable sits up in the power. Using $b^{x + h} = b^x \cdot b^h$, the difference quotient splits into two factors:

$$
\frac{b^{x + h} - b^x}{h} = b^x \cdot \frac{b^h - 1}{h}.
$$

The factor $b^x$ does not involve $h$, so the limit leaves it alone. Call the other limit $L_b$:

$$
L_b = \lim_{h \to 0}\frac{b^h - 1}{h} .
$$

Then the derivative is $L_b\, b^x$. So every exponential is its own derivative times a constant, and the constant depends only on the base.

Estimate $L_b$ with $h = 0.001$. For $b = 2$ the quotient is $0.6934$. For $b = 3$ it is $1.0992$. Somewhere between $2$ and $3$ there must be a base whose constant is exactly $1$. That base is defined to be the **[[number e|number-e]]**:

$$
e \text{ is the number for which } \lim_{h \to 0} \frac{e^h - 1}{h} = 1, \qquad e = 2.71828\ldots
$$

With this choice,

$$
\frac{d}{dx} e^x = e^x .
$$

The exponential with base $e$ is its own derivative. Check: at $h = 0.001$ the quotient for base $2.71828$ is $1.0005$, as close to $1$ as this step size allows.

For other bases the constant $L_b$ turns out to be $\ln b$, the natural logarithm of $b$ (defined in the next section), so $\dfrac{d}{dx} b^x = b^x \ln b$. The next lesson proves this with the chain rule. The numbers already agree: $\ln 2 = 0.6931$ and $\ln 3 = 1.0986$.

Here is why this matters in GNC. A quantity whose rate of change is proportional to itself, $\dot x = kx$, is an exponential, $x = x_0 e^{kt}$. It grows if $k > 0$ and decays if $k < 0$. A capacitor draining, a spinning wheel slowing in oil, a filter forgetting old data: all follow this law. The separable-ODE lesson makes this rigorous. Here, note that $\dfrac{d}{dt}\big(x_0 e^{kt}\big) = k x_0 e^{kt}$ follows from $\dfrac{d}{dx}e^x = e^x$ once the chain rule supplies the factor $k$.

## The natural logarithm

The **natural logarithm** $\ln x$ (read "L N of x") undoes $e^x$: $\ln(e^y) = y$, and $e^{\ln x} = x$ for $x > 0$. It answers the question "$e$ to what power gives $x$?"

Its derivative also comes straight from the definition. Use the log rule $\ln a - \ln b = \ln(a/b)$:

$$
\frac{\ln(x + h) - \ln x}{h} = \frac{1}{h}\ln\!\left(1 + \frac{h}{x}\right).
$$

Rename the small quantity: let $u = h/x$, so $h = xu$, and $u \to 0$ as $h \to 0$. Then

$$
\frac{1}{xu}\ln(1 + u) = \frac{1}{x}\cdot\frac{\ln(1 + u)}{u}.
$$

The last fraction tends to $1$. Numbers first: $\ln(1.1)/0.1 = 0.9531$, $\ln(1.01)/0.01 = 0.9950$, $\ln(1.001)/0.001 = 0.9995$. Therefore

$$
\frac{d}{dx}\ln x = \frac{1}{x}, \qquad x > 0.
$$

::: note Why that last fraction tends to 1
Let $s = \ln(1 + u)$. Then $e^s = 1 + u$, so $u = e^s - 1$, and $s \to 0$ as $u \to 0$. Substitute:

$$
\frac{\ln(1 + u)}{u} = \frac{s}{e^s - 1} = \frac{1}{\;\dfrac{e^s - 1}{s}\;} .
$$

The bottom is the very fraction that defines $e$, and it tends to $1$. So the whole thing tends to $1/1 = 1$.
:::

This is the derivative that puts the logarithm into the **[[rocket equation|rocket-log]]**. Adding up $1/m$ as the mass $m$ falls gives $\ln m$, because $\ln m$ is the function whose derivative is $1/m$.

::: key The derivative
Limit definition of the derivative: $\displaystyle f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}$. It is the slope of the tangent line, and for a position it is the velocity. Notations: $f'(x)$, $\dfrac{dy}{dx}$, $\dot x$ for time derivatives, $df = f'(x)\,dx$ for differentials.
:::

::: key Derivatives of sin, cos, e^x and ln x
Derivatives of the elementary functions, in derivative and differential form:
$\dfrac{d}{dx}\sin x = \cos x$, that is $d(\sin x) = \cos x\,dx$;
$\dfrac{d}{dx}\cos x = -\sin x$, that is $d(\cos x) = -\sin x\,dx$;
$\dfrac{d}{dx}e^x = e^x$, that is $d(e^x) = e^x\,dx$;
$\dfrac{d}{dx}\ln x = \dfrac{1}{x}$, that is $d(\ln x) = \dfrac{dx}{x}$.
Together with the power rule $\dfrac{d}{dx}x^n = nx^{n-1}$ and linearity, these are the atoms every other derivative is built from.
:::

## Numerical derivatives

Sometimes flight software needs the derivative of a function it can only *evaluate* — a table of wind-tunnel data, or a sensor model too messy to differentiate by hand. The definition suggests the natural move, the **forward difference**: pick a small $h$ and compute

$$
\frac{f(x + h) - f(x)}{h} .
$$

A better estimate for the same effort is the **central difference**, the slope of the secant through points on *both* sides of $x$:

$$
\frac{f(x + h) - f(x - h)}{2h} .
$$

::: example Numerical derivative of sine at one radian
Estimate $\dfrac{d}{dx}\sin x$ at $x = 1$ with forward and central differences, and compare with the exact answer $\cos 1 = 0.540302$.

| $h$ | Forward difference | Error | Central difference | Error |
| --- | --- | --- | --- | --- |
| 0.1 | 0.497364 | $-4.3 \times 10^{-2}$ | 0.539402 | $-9.0 \times 10^{-4}$ |
| 0.01 | 0.536086 | $-4.2 \times 10^{-3}$ | 0.540293 | $-9.0 \times 10^{-6}$ |
| 0.001 | 0.539881 | $-4.2 \times 10^{-4}$ | 0.540302 | $-9.0 \times 10^{-8}$ |

Read down the error columns. Each time $h$ gets ten times smaller, the forward error gets ten times smaller, but the central error gets a hundred times smaller. So the forward error is proportional to $h$, and the central error to $h^2$. The Taylor-series lesson shows exactly why and gives the constants: $\tfrac12 h |f''|$ and $\tfrac16 h^2 |f'''|$.

Sanity check on the sign: the forward error is negative because $\sin$ curves downward near $x = 1$, so a secant reaching forward sits below the tangent's slope.

You cannot shrink $h$ forever, though. Subtracting two nearly equal computer numbers **[[loses digits|roundoff]]**. A central difference with $h$ around $10^{-5}$ is a common compromise for standard double-precision numbers.
:::

::: warning A number versus a rule
The derivative at a point is a number. The derivative as a function is a rule. Two slips follow. Asked for $f'(2)$, people answer with the formula $f'(x)$. Or they plug in $x = 2$ *before* differentiating, get a constant, and conclude the derivative is $0$. Differentiate first, then plug in. In Leibniz notation the plugging-in is written $\left.\dfrac{dy}{dx}\right|_{x = 2}$, read "d y d x, evaluated at x equals 2".
:::

## Check yourself

::: check
Use the definition to find the derivative of $f(x) = \dfrac{1}{x^2}$, and check it against the power rule.
:::

::: answer
Put the two fractions over a common bottom, then expand $(x + h)^2$:

$$
\frac{1}{h}\left(\frac{1}{(x + h)^2} - \frac{1}{x^2}\right) = \frac{x^2 - (x + h)^2}{h\,x^2(x + h)^2} = \frac{-2xh - h^2}{h\,x^2(x + h)^2} = \frac{-2x - h}{x^2(x + h)^2}.
$$

As $h \to 0$ this tends to $\dfrac{-2x}{x^4} = -\dfrac{2}{x^3}$. The power rule with $n = -2$ gives $-2x^{-3}$ — the same thing.
:::

::: check
A spacecraft's along-track position during a burn is $s(t) = 4t + 0.9t^2 - 0.01t^3$ meters. Find its velocity and acceleration as functions of time, and the time at which the acceleration is zero.
:::

::: answer
Linearity and the power rule, term by term: $v(t) = 4 + 1.8t - 0.03t^2\,\mathrm{m/s}$, and $a(t) = 1.8 - 0.06t\,\mathrm{m/s^2}$.

Set $a = 0$: $0.06t = 1.8$, so $t = 30\,\mathrm{s}$. Before that the spacecraft speeds up; after, it slows down. At $t = 30$ the velocity is $4 + 54 - 27 = 31\,\mathrm{m/s}$, its maximum — velocity stops rising exactly when acceleration passes through zero.
:::

::: check
Find $\dfrac{d}{dx}\big(5\sin x - 2\cos x + 3e^x - 7\ln x + x^4\big)$.
:::

::: answer
Term by term: $5\cos x + 2\sin x + 3e^x - \dfrac{7}{x} + 4x^3$.

Watch the cosine term, the usual trap: $\dfrac{d}{dx}(-2\cos x) = -2 \cdot (-\sin x) = +2\sin x$. Two minus signs make a plus.
:::

::: check
Use the definition to explain why the derivative of $\sin x$ at $x = 0$ equals $1$. What does this have to do with the small-angle approximation $\sin\theta \approx \theta$?
:::

::: answer
At $x = 0$ the definition reads

$$
f'(0) = \lim_{h \to 0} \frac{\sin h - \sin 0}{h} = \lim_{h \to 0}\frac{\sin h}{h} = 1 .
$$

So the tangent line to $\sin$ at the origin is $y = x$. The small-angle approximation $\sin\theta \approx \theta$ says exactly this: near zero, the sine curve is close to its tangent line. It works so well because the slope there is exactly $1$. How well, and out to what angle, is the subject of the linearization and Taylor lessons.
:::

::: check
Is $f(x) = |x - 3|$ differentiable at $x = 3$? Is it continuous there? What does this say about a saturation function such as $\operatorname{sat}(u) = \min(\max(u, -1), 1)$ at $u = 1$?
:::

::: answer
Continuous, yes: as $x \to 3$, $|x - 3| \to 0 = f(3)$. Differentiable, no: the difference quotient at $3$ is $|h|/h$, which is $+1$ from the right and $-1$ from the left.

The saturation function is continuous everywhere but has corners at $u = \pm 1$: slope $1$ inside, slope $0$ outside, and no derivative at the corner itself. So a straight-line model of an actuator sitting exactly at its limit is ambiguous. That is one reason control designers keep the operating point away from saturation.
:::

## Summary

| Symbol or rule | Meaning |
| --- | --- |
| $f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}$ | Definition of the derivative; slope of the tangent; rate at an instant |
| $\dfrac{dy}{dx}$, $\dot x$, $\ddot x$, $df = f'\,dx$ | Leibniz, Newton and differential notations |
| $v = \dot s$, $a = \dot v = \ddot s$ | Velocity and acceleration, m/s and m/s² |
| $\frac{d}{dx}c = 0$, $\frac{d}{dx}x^n = nx^{n-1}$ | Constants and the power rule |
| $(f + g)' = f' + g'$, $(cf)' = cf'$ | Linearity |
| $\frac{d}{dx}\sin x = \cos x$, $\frac{d}{dx}\cos x = -\sin x$ | Trigonometric derivatives (radians) |
| $\frac{d}{dx}e^x = e^x$, $\frac{d}{dx}\ln x = 1/x$ | The exponential and the logarithm |
| Differentiable $\Rightarrow$ continuous | Corners, cusps and jumps have no derivative |
| Forward and central differences | Numerical derivatives with errors $\propto h$ and $\propto h^2$ |

The definition handles single functions well, but it gets painful for combinations: products, quotients and, above all, functions inside other functions. The next lesson proves the product, quotient and chain rules, and with them you never need to write the limit again.

::: context gyro-accel What the two sensors measure
A **gyroscope** on a spacecraft reports how fast the vehicle is turning — its angular rate, in radians per second. That is the time derivative of its attitude. An **accelerometer** reports acceleration, the time derivative of velocity — with one twist you will meet in navigation: it cannot feel gravity, because gravity pulls on the sensor and its case equally. Together the two form an **inertial measurement unit**, and navigation software adds up their readings over time to track where the vehicle is and which way it points.
:::

::: context secant-tangent Secants closing in on the tangent
On the curve $y = x^2$, the point $P$ is at $x = 1$. Each blue secant joins $P$ to a second point a step $h$ further on; its slope is $2 + h$, so $3.5$, $2.8$ and $2.3$. As $h$ shrinks the secants swing down onto the red tangent, whose slope is $2$ — the derivative $2x$ at $x = 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="185" x2="340" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="185" x2="40" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="40.0,185.0 42.2,185.0 44.4,185.0 46.6,184.9 48.8,184.8 51.0,184.8 53.2,184.6 55.4,184.5 57.6,184.4 59.8,184.2 62.0,184.0 64.2,183.8 66.4,183.6 68.6,183.3 70.8,183.0 73.0,182.8 75.2,182.4 77.4,182.1 79.6,181.8 81.8,181.4 84.0,181.0 86.2,180.6 88.4,180.2 90.6,179.7 92.8,179.2 95.0,178.8 97.2,178.2 99.4,177.7 101.6,177.2 103.8,176.6 106.0,176.0 108.2,175.4 110.4,174.8 112.6,174.1 114.8,173.4 117.0,172.8 119.2,172.0 121.4,171.3 123.6,170.6 125.8,169.8 128.0,169.0 130.2,168.2 132.4,167.4 134.6,166.5 136.8,165.6 139.0,164.8 141.2,163.8 143.4,162.9 145.6,162.0 147.8,161.0 150.0,160.0 152.2,159.0 154.4,158.0 156.6,156.9 158.8,155.8 161.0,154.8 163.2,153.6 165.4,152.5 167.6,151.4 169.8,150.2 172.0,149.0 174.2,147.8 176.4,146.6 178.6,145.3 180.8,144.0 183.0,142.8 185.2,141.4 187.4,140.1 189.6,138.8 191.8,137.4 194.0,136.0 196.2,134.6 198.4,133.2 200.6,131.7 202.8,130.2 205.0,128.8 207.2,127.2 209.4,125.7 211.6,124.2 213.8,122.6 216.0,121.0 218.2,119.4 220.4,117.8 222.6,116.1 224.8,114.4 227.0,112.8 229.2,111.0 231.4,109.3 233.6,107.6 235.8,105.8 238.0,104.0 240.2,102.2 242.4,100.4 244.6,98.5 246.8,96.6 249.0,94.8 251.2,92.8 253.4,90.9 255.6,89.0 257.8,87.0 260.0,85.0 262.2,83.0 264.4,81.0 266.6,78.9 268.8,76.8 271.0,74.8 273.2,72.6 275.4,70.5 277.6,68.4 279.8,66.2 282.0,64.0 284.2,61.8 286.4,59.6 288.6,57.3 290.8,55.0 293.0,52.8 295.2,50.4 297.4,48.1 299.6,45.8 301.8,43.4 304.0,41.0 306.2,38.6 308.4,36.2 310.6,33.7 312.8,31.2 315.0,28.8 317.2,26.2 319.4,23.7 321.6,21.2 323.8,18.6 326.0,16.0"/>
  <line x1="118.6" y1="185.0" x2="326.0" y2="20.0" stroke="#1d6fd1" stroke-width="1.3" opacity="0.7"/>
  <circle cx="315.0" cy="28.8" r="3" fill="#1d6fd1"/>
  <line x1="110.7" y1="185.0" x2="326.0" y2="48.0" stroke="#1d6fd1" stroke-width="1.3" opacity="0.7"/>
  <circle cx="238.0" cy="104.0" r="3" fill="#1d6fd1"/>
  <line x1="102.2" y1="185.0" x2="326.0" y2="68.0" stroke="#1d6fd1" stroke-width="1.3" opacity="0.7"/>
  <circle cx="183.0" cy="142.8" r="3" fill="#1d6fd1"/>
  <line x1="95.0" y1="185.0" x2="326.0" y2="80.0" stroke="#b4232c" stroke-width="2.2"/>
  <circle cx="150.0" cy="160.0" r="4" fill="#b4232c"/>
  <text x="156.0" y="176.0" font-size="12" fill="#b4232c">P</text>
  <text x="210" y="150" font-size="11" fill="#1d6fd1">blue: secants for</text>
  <text x="210" y="164" font-size="11" fill="#1d6fd1">h = 1.5, 0.8, 0.3</text>
  <text x="210" y="178" font-size="11" fill="#b4232c">red: tangent, slope 2</text>
  <text x="50" y="30" font-size="12" fill="#1f2a44">y = x²</text>
</svg>
```
:::

::: context notation-history Two inventors, two notations
Isaac Newton in England and Gottfried Wilhelm Leibniz in Germany each developed calculus in the late 1600s, independently. Newton wrote a dot over a letter for its rate of change, which he called a "fluxion". Leibniz wrote $dy/dx$, thinking of a tiny change in $y$ over a tiny change in $x$. The two men and their supporters fought bitterly over who came first. Leibniz's notation won out in most of mathematics because it makes the chain rule look like canceling fractions, while Newton's dot survives in physics and engineering for time derivatives. The prime came later, from Joseph-Louis Lagrange.
:::

::: context g-load What "g" means on a vehicle
An acceleration written in "g" is compared with the standard pull of gravity, $9.80665\,\mathrm{m/s^2}$. Sitting still in a chair you feel $1\,g$. Astronauts on a launch commonly feel somewhere around $3$ to $4\,g$ near the end of a stage's burn, when the vehicle is lightest. Engineers set limits on this number both for the crew and for the structure, which is one reason engines are throttled back late in a burn.
:::

::: context binomial Where the binomial coefficients come from
Multiply $(x + h)$ by itself $n$ times. Each term of the answer picks either $x$ or $h$ from every bracket. To get $x^{n-1}h$ you pick $h$ from exactly one bracket, and there are $n$ ways to do that — which is why the coefficient is $n$. For example, $(x + h)^3 = x^3 + 3x^2h + 3xh^2 + h^3$: the $3x^2h$ is the source of the derivative $3x^2$. The full set of coefficients forms Pascal's triangle: $1$; $1, 1$; $1, 2, 1$; $1, 3, 3, 1$.
:::

::: context saturation-corner A saturation limit has corners
A **saturation** function passes small commands through unchanged but caps anything beyond what the actuator can deliver — an engine can only swivel so far. Here the cap is $\pm 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="30.0,155 120,155 240,45 330.0,45"/>
  <circle cx="240" cy="45" r="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <circle cx="120" cy="155" r="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="240" y="33" font-size="11" text-anchor="middle" fill="#b4232c">corner</text>
  <text x="120" y="175" font-size="11" text-anchor="middle" fill="#b4232c">corner</text>
  <text x="288.0" y="63" font-size="11" text-anchor="middle" fill="#1f2a44">slope 0</text>
  <text x="72.0" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">slope 0</text>
  <text x="201.0" y="94.5" font-size="11" fill="#1f2a44">slope 1</text>
  <text x="240" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="120" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">−1</text>
  <text x="332" y="94" font-size="11" text-anchor="end" fill="#1f2a44">command u</text>
  <text x="172" y="30" font-size="11" text-anchor="end" fill="#1f2a44">output</text>
</svg>
```

Inside the limits the slope is $1$; outside it is $0$. At the two circled corners the slope jumps, so the derivative does not exist there.
:::

::: context sin-cos-slopes Reading cos off the slope of sin
The blue curve is $\sin x$ and the orange one is $\cos x$. Wherever the blue curve is steepest going up, at $x = 0$, its slope is $1$ and the orange curve is at its top, $1$. Where the blue curve peaks, at $x = \pi/2$, its slope is $0$ and the orange curve crosses zero. The height of the orange curve is the slope of the blue one, everywhere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="95" x2="345" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="20" x2="60" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="60.0,35.0 62.3,35.1 64.6,35.3 66.9,35.7 69.2,36.3 71.5,37.0 73.8,37.9 76.1,39.0 78.4,40.2 80.7,41.5 83.0,43.0 85.3,44.7 87.6,46.5 89.9,48.4 92.3,50.4 94.6,52.6 96.9,54.9 99.2,57.2 101.5,59.7 103.8,62.3 106.1,65.0 108.4,67.8 110.7,70.6 113.0,73.5 115.3,76.5 117.6,79.5 119.9,82.5 122.2,85.6 124.5,88.7 126.8,91.9 129.1,95.0 131.4,98.1 133.7,101.3 136.0,104.4 138.3,107.5 140.6,110.5 142.9,113.5 145.2,116.5 147.5,119.4 149.8,122.2 152.2,125.0 154.5,127.7 156.8,130.3 159.1,132.8 161.4,135.1 163.7,137.4 166.0,139.6 168.3,141.6 170.6,143.5 172.9,145.3 175.2,147.0 177.5,148.5 179.8,149.8 182.1,151.0 184.4,152.1 186.7,153.0 189.0,153.7 191.3,154.3 193.6,154.7 195.9,154.9 198.2,155.0 200.5,154.9 202.8,154.7 205.1,154.3 207.4,153.7 209.7,153.0 212.1,152.1 214.4,151.0 216.7,149.8 219.0,148.5 221.3,147.0 223.6,145.3 225.9,143.5 228.2,141.6 230.5,139.6 232.8,137.4 235.1,135.1 237.4,132.8 239.7,130.3 242.0,127.7 244.3,125.0 246.6,122.2 248.9,119.4 251.2,116.5 253.5,113.5 255.8,110.5 258.1,107.5 260.4,104.4 262.7,101.3 265.0,98.1 267.3,95.0 269.6,91.9 272.0,88.7 274.3,85.6 276.6,82.5 278.9,79.5 281.2,76.5 283.5,73.5 285.8,70.6 288.1,67.8 290.4,65.0 292.7,62.3 295.0,59.7 297.3,57.2 299.6,54.9 301.9,52.6 304.2,50.4 306.5,48.4 308.8,46.5 311.1,44.7 313.4,43.0 315.7,41.5 318.0,40.2 320.3,39.0 322.6,37.9 324.9,37.0 327.2,36.3 329.5,35.7 331.9,35.3 334.2,35.1 336.5,35.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="60.0,95.0 62.3,91.9 64.6,88.7 66.9,85.6 69.2,82.5 71.5,79.5 73.8,76.5 76.1,73.5 78.4,70.6 80.7,67.8 83.0,65.0 85.3,62.3 87.6,59.7 89.9,57.2 92.3,54.9 94.6,52.6 96.9,50.4 99.2,48.4 101.5,46.5 103.8,44.7 106.1,43.0 108.4,41.5 110.7,40.2 113.0,39.0 115.3,37.9 117.6,37.0 119.9,36.3 122.2,35.7 124.5,35.3 126.8,35.1 129.1,35.0 131.4,35.1 133.7,35.3 136.0,35.7 138.3,36.3 140.6,37.0 142.9,37.9 145.2,39.0 147.5,40.2 149.8,41.5 152.2,43.0 154.5,44.7 156.8,46.5 159.1,48.4 161.4,50.4 163.7,52.6 166.0,54.9 168.3,57.2 170.6,59.7 172.9,62.3 175.2,65.0 177.5,67.8 179.8,70.6 182.1,73.5 184.4,76.5 186.7,79.5 189.0,82.5 191.3,85.6 193.6,88.7 195.9,91.9 198.2,95.0 200.5,98.1 202.8,101.3 205.1,104.4 207.4,107.5 209.7,110.5 212.1,113.5 214.4,116.5 216.7,119.4 219.0,122.2 221.3,125.0 223.6,127.7 225.9,130.3 228.2,132.8 230.5,135.1 232.8,137.4 235.1,139.6 237.4,141.6 239.7,143.5 242.0,145.3 244.3,147.0 246.6,148.5 248.9,149.8 251.2,151.0 253.5,152.1 255.8,153.0 258.1,153.7 260.4,154.3 262.7,154.7 265.0,154.9 267.3,155.0 269.6,154.9 272.0,154.7 274.3,154.3 276.6,153.7 278.9,153.0 281.2,152.1 283.5,151.0 285.8,149.8 288.1,148.5 290.4,147.0 292.7,145.3 295.0,143.5 297.3,141.6 299.6,139.6 301.9,137.4 304.2,135.1 306.5,132.8 308.8,130.3 311.1,127.7 313.4,125.0 315.7,122.2 318.0,119.4 320.3,116.5 322.6,113.5 324.9,110.5 327.2,107.5 329.5,104.4 331.9,101.3 334.2,98.1 336.5,95.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.6" points="46.8,113.0 99.6,41.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.6" points="102.7,35.0 155.5,35.0"/>
  <text x="129.1" y="27" font-size="11" text-anchor="middle" fill="#b4232c">slope 0, cos = 0</text>
  <text x="56" y="65.0" font-size="11" text-anchor="end" fill="#b4232c">slope 1</text>
  <text x="266.8" y="181" font-size="12" fill="#1d6fd1">sin x</text>
  <text x="306.4" y="30.0" font-size="12" fill="#1f2a44">cos x</text>
  <text x="198.2" y="111" font-size="11" text-anchor="middle" fill="#1f2a44">π</text>
  <text x="336.5" y="111" font-size="11" text-anchor="middle" fill="#1f2a44">2π</text>
</svg>
```
:::

::: context number-e Another road to e
The number $e$ also appears in money. Put $\$1$ in a bank paying $100\%$ interest a year. Paid once, you end with $\$2$. Paid in $n$ equal installments that each earn interest, you end with $\left(1 + \frac{1}{n}\right)^n$ dollars. With $n = 1000$ that is $\$2.7169$; with a million it is $\$2.71828$. As $n \to \infty$ the amount tends to $e$. It is the same number as the one defined by the slope, which a later course proves.
:::

::: context rocket-log Where the logarithm in rocketry comes from
The ideal rocket equation, $\Delta v = v_e \ln(m_0/m_f)$, gives the change in speed from burning propellant: $v_e$ is the exhaust speed, $m_0$ the starting mass and $m_f$ the final mass. The logarithm appears because each kilogram of propellant pushes a rocket that is getting lighter, so each kilogram adds a little more speed than the one before. Adding up $dm/m$ over the burn is what makes $\ln$. The last lesson of this module derives it in full.
:::

::: context roundoff Why a tiny step goes wrong
A standard double-precision number keeps about $16$ significant digits. When $h$ is tiny, $f(x + h)$ and $f(x - h)$ agree in most of those digits, and subtracting them throws the matching digits away, leaving mostly rounding noise. Dividing by the tiny $2h$ then magnifies that noise. For $\sin$ at $x = 1$, the central-difference error is about $10^{-11}$ at $h = 10^{-5}$ but grows to about $10^{-5}$ at $h = 10^{-12}$. The best $h$ balances truncation error, which shrinks with $h$, against rounding error, which grows as $h$ shrinks.
:::
