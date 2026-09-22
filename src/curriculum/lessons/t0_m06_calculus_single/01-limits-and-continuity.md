---
id: l01-limits-and-continuity
title: Limits and continuity
minutes: 22
covers:
  - limits and continuity
---

A launch vehicle's flight computer knows the vehicle's position at a sequence of instants. What it needs is the velocity, and behind the velocity the acceleration, because those are what the guidance law steers with. Position over an interval gives you an *average* velocity. Velocity *at an instant* is a different kind of object: it is what the average velocity tends towards as the interval shrinks to nothing. That "tends towards" is a limit, and calculus is the discipline of computing with limits without ever dividing by zero.

Limits also appear in flight software in a less obvious place. The function $\sin\theta/\theta$ shows up whenever a rotation vector is converted into a quaternion, and at $\theta = 0$ it reads $0/0$. The code cannot evaluate that, but the limit exists and equals $1$, so the code branches to a series. Knowing which $0/0$ expressions have limits, and what they are, is a working skill rather than a formality.

This lesson builds the limit idea from motion, states the rules that let you compute limits mechanically, derives the two trigonometric limits that every derivative of $\sin$ and $\cos$ rests on, and closes with continuity — the property that makes "plug in the value" legitimate and that guarantees a root exists when a function changes sign.

## From average velocity to velocity at an instant

Take a vehicle whose altitude in metres is $h(t) = 3t^2 + 0.02t^3$ for $t$ in seconds during the first minute of ascent. Between $t = 10\,\mathrm{s}$ and $t = 11\,\mathrm{s}$ it climbs from $h(10) = 320\,\mathrm{m}$ to $h(11) = 389.62\,\mathrm{m}$, so its average velocity over that second is

$$
\bar v = \frac{h(11) - h(10)}{11 - 10} = \frac{389.62 - 320}{1} = 69.62\,\mathrm{m/s}.
$$

That number depends on the width of the interval. Shrink the interval and the average changes:

| Interval width $\Delta t$ (s) | Average velocity on $[10, 10 + \Delta t]$ (m/s) |
| --- | --- |
| 1 | 69.62 |
| 0.1 | 66.3602 |
| 0.01 | 66.0360 |
| 0.001 | 66.0036 |

The averages are settling on $66\,\mathrm{m/s}$. No single interval gives exactly $66$, and the interval of width zero gives the meaningless $0/0$. Yet the pattern is unmistakable: the average velocity can be made as close to $66$ as you like by taking $\Delta t$ small enough. We say the limit of the average velocity as $\Delta t \to 0$ is $66\,\mathrm{m/s}$, and we call that the velocity at $t = 10\,\mathrm{s}$.

You can see why it must be $66$ by algebra. Expand $h(10 + \Delta t)$:

$$
h(10 + \Delta t) = 3(10 + \Delta t)^2 + 0.02(10 + \Delta t)^3 = 320 + 66\,\Delta t + 3.6\,\Delta t^2 + 0.02\,\Delta t^3 .
$$

Subtract $h(10) = 320$ and divide by $\Delta t$:

$$
\frac{h(10 + \Delta t) - h(10)}{\Delta t} = 66 + 3.6\,\Delta t + 0.02\,\Delta t^2 .
$$

For every $\Delta t \neq 0$ this is exact, and the right-hand side visibly approaches $66$ as $\Delta t$ shrinks. The division by $\Delta t$ was legitimate because $\Delta t$ was never zero; the limit is taken *afterwards*. That order of operations is the whole trick of calculus.

## What a limit is

Write $\lim_{x \to a} f(x) = L$ to mean: the values $f(x)$ can be forced as close to $L$ as anyone demands by restricting $x$ to be close enough to $a$, without ever setting $x = a$. The precise version, which you should be able to read even if you rarely use it: for every tolerance $\varepsilon > 0$ there is a window $\delta > 0$ such that $|f(x) - L| < \varepsilon$ whenever $0 < |x - a| < \delta$.

Three things in that definition matter in practice.

The value $f(a)$ plays no role. The function need not be defined at $a$ at all — in the velocity example, the difference quotient is undefined at $\Delta t = 0$ — and if it is defined, $f(a)$ can be anything without changing the limit. The limit is about the *neighbourhood* of $a$, not the point.

The approach can come from either side. The **right-hand limit** $\lim_{x \to a^+} f(x)$ uses only $x > a$; the **left-hand limit** $\lim_{x \to a^-} f(x)$ uses only $x < a$. The two-sided limit exists exactly when both one-sided limits exist and agree. The signum-like function $f(x) = |x|/x$ has right-hand limit $1$ and left-hand limit $-1$ at zero, so $\lim_{x \to 0} |x|/x$ does not exist.

A limit can fail to exist in other ways: $f$ can grow without bound, as $1/x^2$ does near $0$, or oscillate without settling, as $\sin(1/x)$ does near $0$. When $f(x)$ grows without bound we write $\lim_{x \to 0} 1/x^2 = +\infty$, which is a statement about behaviour, not a claim that $\infty$ is a number you can do arithmetic with.

::: warning
$0/0$ is not $0$, not $1$ and not undefined-therefore-ignore. It is a signal that the expression as written cannot be evaluated at the point and that a limit may or may not exist. $\sin x / x \to 1$, $(1 - \cos x)/x \to 0$, $x/x^2 \to \pm\infty$ and $|x|/x$ has no limit — four different outcomes from four expressions that all read $0/0$ at zero. You must do the work each time.
:::

## The limit laws

Limits respect arithmetic. If $\lim_{x \to a} f(x) = L$ and $\lim_{x \to a} g(x) = M$, then

$$
\lim_{x \to a} \big(f(x) \pm g(x)\big) = L \pm M, \qquad
\lim_{x \to a} f(x)\,g(x) = LM, \qquad
\lim_{x \to a} \frac{f(x)}{g(x)} = \frac{L}{M} \quad (M \neq 0),
$$

and for a constant $c$, $\lim_{x \to a} c\,f(x) = cL$. Together with the trivial limits $\lim_{x \to a} c = c$ and $\lim_{x \to a} x = a$, these let you evaluate the limit of any polynomial or rational function at a point where the denominator is nonzero by substitution: $\lim_{x \to 2} (x^3 - 4x) = 8 - 8 = 0$.

The interesting cases are the ones where substitution gives $0/0$. The strategy is always the same: rewrite the expression, using algebra that is valid for $x \neq a$, into a form where substitution works.

**Factor and cancel.** $\lim_{x \to 3} \frac{x^2 - 9}{x - 3} = \lim_{x \to 3} \frac{(x - 3)(x + 3)}{x - 3} = \lim_{x \to 3}(x + 3) = 6$. Cancelling $x - 3$ is legal because $x \neq 3$ throughout the limit process.

**Rationalise.** When a square root produces the zero, multiply top and bottom by the conjugate.

::: example A square-root limit by rationalising
Find $\lim_{x \to 0} \dfrac{\sqrt{x + 4} - 2}{x}$.

Substituting gives $(2 - 2)/0 = 0/0$. Multiply numerator and denominator by $\sqrt{x + 4} + 2$:

$$
\frac{\sqrt{x + 4} - 2}{x}\cdot\frac{\sqrt{x + 4} + 2}{\sqrt{x + 4} + 2}
= \frac{(x + 4) - 4}{x\,(\sqrt{x + 4} + 2)}
= \frac{1}{\sqrt{x + 4} + 2}.
$$

The cancellation of $x$ is valid because $x \neq 0$. The result is continuous at $0$, so substitute: the limit is $1/(2 + 2) = 1/4 = 0.25$.

Check numerically: at $x = 0.1$ the original expression is $0.24846$; at $x = 0.01$ it is $0.24984$; at $x = 0.001$ it is $0.24998$. The values close in on $0.25$ from below, as the exact form predicts, since $\sqrt{x + 4} + 2$ is slightly above $4$ for small positive $x$.
:::

**Squeeze.** If $g(x) \le f(x) \le h(x)$ near $a$ and the outer two functions have the same limit $L$, then $f(x) \to L$ as well. This is the tool for limits that resist algebra, and it is how the trigonometric limits below are proved. It also disposes of oscillating examples: $-x^2 \le x^2\sin(1/x) \le x^2$, and both bounds go to $0$, so $x^2 \sin(1/x) \to 0$ even though $\sin(1/x)$ itself has no limit.

## Two limits that every derivative of sine and cosine depends on

The derivatives of $\sin$ and $\cos$, coming in the next lesson, reduce to two limits in which the angle $\theta$ is measured in radians:

$$
\lim_{\theta \to 0} \frac{\sin\theta}{\theta} = 1, \qquad
\lim_{\theta \to 0} \frac{1 - \cos\theta}{\theta} = 0 .
$$

Here is the derivation of the first, for $0 < \theta < \pi/2$. On the unit circle, draw the angle $\theta$ from the positive $x$-axis. Three regions nest inside one another. The triangle with vertices at the origin, $(1, 0)$ and $(\cos\theta, \sin\theta)$ has area $\tfrac12 \sin\theta$. The circular sector between the two radii has area $\tfrac12 \theta$ — that is what radian measure means: a sector of angle $\theta$ in a unit circle has area $\theta/2$. The right triangle with vertices at the origin, $(1, 0)$ and $(1, \tan\theta)$ has area $\tfrac12 \tan\theta$. The triangle sits inside the sector, which sits inside the larger triangle, so

$$
\tfrac12 \sin\theta \le \tfrac12\theta \le \tfrac12 \tan\theta .
$$

Divide through by $\tfrac12 \sin\theta$, which is positive:

$$
1 \le \frac{\theta}{\sin\theta} \le \frac{1}{\cos\theta}
\quad\Longrightarrow\quad
\cos\theta \le \frac{\sin\theta}{\theta} \le 1 .
$$

As $\theta \to 0^+$, $\cos\theta \to 1$, so the squeeze forces $\sin\theta/\theta \to 1$. For negative $\theta$, note $\sin(-\theta)/(-\theta) = \sin\theta/\theta$, so the left-hand limit is the same. The two-sided limit is $1$.

The second limit follows from the first. Multiply top and bottom by $1 + \cos\theta$:

$$
\frac{1 - \cos\theta}{\theta} = \frac{1 - \cos^2\theta}{\theta\,(1 + \cos\theta)} = \frac{\sin\theta}{\theta}\cdot\frac{\sin\theta}{1 + \cos\theta}
\;\longrightarrow\; 1 \cdot \frac{0}{2} = 0 .
$$

A refinement you will use when estimating errors: $(1 - \cos\theta)/\theta^2 \to \tfrac12$, by the same manipulation with one more factor of $\theta$ kept in the denominator. Numerically, at $\theta = 0.1$ the ratio $(1 - \cos\theta)/\theta^2 = 0.49958$; at $\theta = 0.01$ it is $0.499996$.

::: warning
Both limits require radians. The sector-area step used "area equals $\theta/2$", which is false in degrees. In degrees, $\sin\theta/\theta \to \pi/180 \approx 0.01745$. Flight code that mixes units here does not produce a visibly wrong answer — it produces one that is wrong by a factor of $57.3$, which is worse.
:::

::: example The sinc function in a quaternion update
A small rotation by the rotation vector $\boldsymbol{\phi}$, of magnitude $\theta = |\boldsymbol{\phi}|$, is converted to a quaternion whose vector part is $\dfrac{\sin(\theta/2)}{\theta}\,\boldsymbol{\phi}$. At $\theta = 0$ this coefficient reads $0/0$. What value should the code use?

Write $u = \theta/2$, so $\theta = 2u$ and $u \to 0$ as $\theta \to 0$:

$$
\lim_{\theta \to 0} \frac{\sin(\theta/2)}{\theta} = \lim_{u \to 0} \frac{\sin u}{2u} = \frac12 \lim_{u \to 0}\frac{\sin u}{u} = \frac12 .
$$

So the coefficient tends to $0.5$, and a careful implementation returns $0.5$ (or the first terms of a series) when $\theta$ is below some threshold, rather than dividing. A second limit of the same family: $\lim_{h \to 0} \sin(3h)/h = 3 \lim_{h \to 0} \sin(3h)/(3h) = 3$. The pattern is general — $\sin(kh)/h \to k$ — because the substitution $u = kh$ rescales the variable without changing where it goes.
:::

## Limits at infinity

Steady-state questions are limits at infinity: what does the response of a sensor settle to as $t \to \infty$? The definition mirrors the finite case. $\lim_{x \to \infty} f(x) = L$ means $f(x)$ can be made as close to $L$ as required by taking $x$ large enough. Graphically, $y = L$ is a horizontal asymptote.

The basic fact is $\lim_{x \to \infty} 1/x^p = 0$ for any $p > 0$. For a ratio of polynomials, divide numerator and denominator by the highest power of $x$ present in the denominator:

$$
\lim_{x \to \infty} \frac{3x^2 + 5}{2x^2 - x}
= \lim_{x \to \infty} \frac{3 + 5/x^2}{2 - 1/x}
= \frac{3 + 0}{2 - 0} = \frac32 .
$$

At $x = 10$ the expression is $1.605$; at $x = 100$ it is $1.5078$; at $x = 1000$ it is $1.50075$. The rule of thumb: equal degrees give the ratio of leading coefficients, a lower degree on top gives $0$, a higher degree on top gives $\pm\infty$.

Exponentials dominate powers: $\lim_{t \to \infty} t^n e^{-t} = 0$ for every $n$, which is why a decaying exponential eventually beats any polynomial growth multiplying it. You will meet this as the reason that transients in a stable linear system die out no matter how they start.

## Continuity

A function is **continuous at $a$** when three things hold: $f(a)$ is defined, $\lim_{x \to a} f(x)$ exists, and the two are equal. Informally, the graph has no break at $a$; operationally, continuity is the licence to evaluate a limit by substitution. A function is continuous on an interval when it is continuous at every point of it.

Polynomials, rational functions (where defined), $\sin$, $\cos$, $e^x$, $\ln x$ (for $x > 0$), $\sqrt{x}$ (for $x \ge 0$) and $\arctan$ are all continuous on their domains, and sums, products, quotients (with nonzero denominators) and compositions of continuous functions are continuous. This is why the "rationalise then substitute" step above was legitimate: $1/(\sqrt{x + 4} + 2)$ is continuous at $0$.

Discontinuities come in kinds worth naming. A **removable** discontinuity is one where the limit exists but $f(a)$ is missing or wrong: $\sin x / x$ at $0$ is the canonical case, and defining the value to be $1$ removes it — which is exactly what the quaternion code does. A **jump** discontinuity has different one-sided limits, as $|x|/x$ does; a step command to an actuator is a jump. An **infinite** discontinuity is a vertical asymptote, as $\tan x$ has at $\pi/2$.

::: note
Angle wrapping is a jump discontinuity you have already met. The function $\operatorname{atan2}(y, x)$ jumps from $+\pi$ to $-\pi$ across the negative $x$-axis. Nothing physical jumps — the vehicle rotates smoothly — but the *representation* does, and every heading controller has to be written so that it differences angles across the wrap correctly. Continuity of the physics does not guarantee continuity of the numbers.
:::

### The intermediate value theorem

If $f$ is continuous on $[a, b]$ and $f(a)$ and $f(b)$ have opposite signs, then $f(c) = 0$ for some $c$ strictly between $a$ and $b$. More generally, $f$ takes every value between $f(a)$ and $f(b)$ somewhere on the interval. This is the **intermediate value theorem**, and it is the reason bisection works as a root finder: bracket a sign change, halve the bracket, keep the half that still changes sign.

::: example Locating a root by bisection
Show that $x = \cos x$ has a solution in $[0, 1]$ and locate it to two decimal places.

Let $f(x) = x - \cos x$, continuous everywhere. $f(0) = 0 - 1 = -1 < 0$ and $f(1) = 1 - 0.5403 = 0.4597 > 0$. The signs differ, so by the intermediate value theorem there is a root in $(0, 1)$.

Bisect. The midpoint $0.5$ gives $f(0.5) = -0.3776$, negative, so the root is in $(0.5, 1)$. Midpoint $0.75$: $f(0.75) = +0.0183$, so the root is in $(0.5, 0.75)$. Midpoint $0.625$: $f = -0.1860$, root in $(0.625, 0.75)$. Midpoint $0.6875$: $f = -0.0853$, root in $(0.6875, 0.75)$. Midpoint $0.71875$: $f = -0.0339$, root in $(0.71875, 0.75)$. Midpoint $0.734375$: $f = -0.0079$, root in $(0.734375, 0.75)$.

After six halvings the bracket has width $1/64 \approx 0.016$, so the root is $0.74 \pm 0.01$. The true value is $0.739085$. Each halving gains one binary digit; Newton's method, which comes in the linearisation lesson, gains far faster, but it needs a derivative and a good starting point, while bisection needs only continuity and a sign change.
:::

::: key
A limit describes the value a function approaches, not the value it takes. $\lim_{x \to a} f(x) = L$ requires nothing of $f(a)$. Limits of sums, products and quotients are the sums, products and quotients of the limits (denominator limit nonzero). A $0/0$ form must be rewritten — by factoring, rationalising or squeezing — before substituting.
:::

::: key
In radians, $\displaystyle \lim_{\theta \to 0}\frac{\sin\theta}{\theta} = 1$ and $\displaystyle \lim_{\theta \to 0}\frac{1 - \cos\theta}{\theta} = 0$, with the refinement $\displaystyle \lim_{\theta \to 0}\frac{1 - \cos\theta}{\theta^2} = \frac12$. Rescaling the variable gives $\sin(kh)/h \to k$.
:::

::: key
$f$ is continuous at $a$ when $\lim_{x \to a} f(x) = f(a)$. Elementary functions are continuous on their domains, so limits of them are evaluated by substitution. On an interval where $f$ is continuous, a sign change guarantees a root (intermediate value theorem), which is what makes bisection a valid root finder.
:::

## Check yourself

::: check
A vehicle's downrange position is $x(t) = 2t^2$ metres. Write the average velocity over $[5, 5 + \Delta t]$ as a function of $\Delta t$, and read off the velocity at $t = 5\,\mathrm{s}$.
:::

::: answer
$x(5 + \Delta t) = 2(25 + 10\Delta t + \Delta t^2) = 50 + 20\Delta t + 2\Delta t^2$, and $x(5) = 50$. The average velocity is $\dfrac{20\Delta t + 2\Delta t^2}{\Delta t} = 20 + 2\Delta t$ for $\Delta t \neq 0$. As $\Delta t \to 0$ this tends to $20$, so the velocity at $t = 5\,\mathrm{s}$ is $20\,\mathrm{m/s}$. Note that the average over any finite interval starting at $5$ is slightly more than $20$, because the vehicle is accelerating.
:::

::: check
Evaluate $\lim_{x \to 2} \dfrac{x^2 - 5x + 6}{x^2 - 4}$.
:::

::: answer
Substitution gives $0/0$. Factor: $x^2 - 5x + 6 = (x - 2)(x - 3)$ and $x^2 - 4 = (x - 2)(x + 2)$. For $x \neq 2$ the fraction equals $\dfrac{x - 3}{x + 2}$, which is continuous at $2$, so the limit is $\dfrac{2 - 3}{2 + 2} = -\dfrac14$.
:::

::: check
Compute $\lim_{\theta \to 0} \dfrac{\tan 2\theta}{\theta}$ and $\lim_{\theta \to 0} \dfrac{1 - \cos 3\theta}{\theta^2}$.
:::

::: answer
For the first, $\dfrac{\tan 2\theta}{\theta} = \dfrac{\sin 2\theta}{\theta}\cdot\dfrac{1}{\cos 2\theta} = 2\,\dfrac{\sin 2\theta}{2\theta}\cdot\dfrac{1}{\cos 2\theta} \to 2 \cdot 1 \cdot 1 = 2$.

For the second, set $u = 3\theta$ so $\theta^2 = u^2/9$: $\dfrac{1 - \cos u}{u^2/9} = 9\,\dfrac{1 - \cos u}{u^2} \to 9 \cdot \dfrac12 = \dfrac92$.
:::

::: check
The function $g(x) = \dfrac{x^2 - 1}{x - 1}$ is not defined at $x = 1$. Does it have a limit there? Can it be made continuous at $1$, and if so how?
:::

::: answer
For $x \neq 1$, $g(x) = x + 1$, so $\lim_{x \to 1} g(x) = 2$. The discontinuity is removable: define $g(1) = 2$ and the extended function is $x + 1$ everywhere, which is continuous. Nothing about the limit changed — only the value at the single point was supplied.
:::

::: check
An altitude controller's commanded thrust is $T(h) = 10 - 4h$ for $h < 1$ and $T(h) = 3h + 2$ for $h \ge 1$ (kilonewtons, $h$ in kilometres). Is the command continuous at $h = 1$? What are the one-sided limits?
:::

::: answer
Left-hand limit: $\lim_{h \to 1^-} (10 - 4h) = 6$. Right-hand limit: $\lim_{h \to 1^+} (3h + 2) = 5$. They differ, so the two-sided limit does not exist and the command has a jump discontinuity of $1\,\mathrm{kN}$ at $h = 1\,\mathrm{km}$. A vehicle crossing that altitude would see an instantaneous thrust step, which is exactly the kind of thing a guidance designer blends out.
:::

::: check
Explain why $\lim_{x \to \infty} \dfrac{5x^3 - x}{2x^3 + 7x^2}$ equals $\dfrac52$, and what $\lim_{x \to \infty} \dfrac{5x^2 - x}{2x^3 + 7x^2}$ equals.
:::

::: answer
Divide top and bottom by $x^3$: $\dfrac{5 - 1/x^2}{2 + 7/x} \to \dfrac{5}{2}$ because $1/x^2 \to 0$ and $7/x \to 0$. For the second expression the same division gives $\dfrac{5/x - 1/x^2}{2 + 7/x} \to \dfrac{0}{2} = 0$: the denominator grows faster than the numerator, so the ratio dies away.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Limit | $\lim_{x \to a} f(x) = L$: $f(x)$ is as close to $L$ as required for all $x$ close enough to $a$, $x \neq a$ |
| One-sided limits | The two-sided limit exists iff $\lim_{x \to a^-} f = \lim_{x \to a^+} f$ |
| Limit laws | Limits of sums, products, quotients (nonzero denominator) are the sums, products, quotients of limits |
| $0/0$ forms | Factor, rationalise, or squeeze, then substitute |
| Trig limits (radians) | $\sin\theta/\theta \to 1$, $(1 - \cos\theta)/\theta \to 0$, $(1 - \cos\theta)/\theta^2 \to \tfrac12$ |
| Limits at infinity | Rational functions: compare degrees; $t^n e^{-t} \to 0$ |
| Continuity | $\lim_{x \to a} f(x) = f(a)$; elementary functions are continuous on their domains |
| Intermediate value theorem | Continuous on $[a, b]$ with a sign change gives a root in $(a, b)$; bisection finds it |

The velocity computation at the start of this lesson — form the difference quotient, simplify for $\Delta t \neq 0$, take the limit — is the definition of the derivative. The next lesson names it, works out its value for every elementary function, and turns it into a set of rules that make the limit itself disappear from view.
