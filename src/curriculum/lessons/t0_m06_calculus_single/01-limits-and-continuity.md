---
id: l01-limits-and-continuity
title: Limits and continuity
minutes: 22
covers:
  - limits and continuity
---

Look at a car's speedometer. It says $60$ right now — not "$60$ on average over the last hour", but $60$ at this instant. That is a strange idea when you think about it. Speed is distance divided by time, and in a single instant no time passes and no distance is covered. So what does "speed at an instant" even mean?

A rocket's flight computer faces exactly this puzzle. It knows the vehicle's position at a string of moments. What it needs is the velocity, and behind that the acceleration, because those are what the guidance law steers with. Position at two moments gives you an *average* velocity. Velocity *at an instant* is the number the average settles on as the two moments squeeze together. That "settles on" is called a **limit**. Calculus is the art of working with limits without ever dividing by zero.

Limits also turn up inside flight software in a sneakier place. Expressions like $\sin\theta/\theta$ appear whenever a small rotation is turned into a **[[quaternion|quaternion]]**, and at $\theta = 0$ they read $0/0$. The computer cannot divide zero by zero. But the limit of $\sin\theta/\theta$ exists and equals $1$, so the code switches to a safe formula near zero. Knowing which $0/0$ expressions have a limit, and what it is, is a working skill.

This lesson builds the limit from motion, gives you the rules for computing limits, proves the two trigonometric limits that the derivatives of $\sin$ and $\cos$ rest on, and ends with **continuity** — the property that makes "plug the number in" legal, and that promises a root exists when a function changes sign.

## From average velocity to velocity at an instant

Take a rocket whose altitude, in meters, is $h(t) = 3t^2 + 0.02t^3$ for $t$ in seconds, during the first minute of flight. (Read $h(t)$ as "h of t": the altitude at time $t$.)

At $t = 10\,\mathrm{s}$ it is at $h(10) = 320\,\mathrm{m}$. One second later it is at $h(11) = 389.62\,\mathrm{m}$. So over that second its average velocity is

$$
\bar v = \frac{h(11) - h(10)}{11 - 10} = \frac{389.62 - 320}{1} = 69.62\,\mathrm{m/s}.
$$

($\bar v$ is read "v bar"; the bar means "average".) That number depends on how long the interval is. Shrink the interval, written $\Delta t$ ("delta t", the change in time), and the average changes:

| Interval width $\Delta t$ (s) | Average velocity on $[10, 10 + \Delta t]$ (m/s) |
| --- | --- |
| 1 | 69.62 |
| 0.1 | 66.3602 |
| 0.01 | 66.0360 |
| 0.001 | 66.0036 |

The averages are homing in on $66\,\mathrm{m/s}$. No interval gives exactly $66$. And an interval of width zero gives the meaningless $0/0$. Yet the pattern is plain to see: you can get the average as close to $66$ as you like by making $\Delta t$ small enough. We say the limit of the average velocity as $\Delta t$ goes to zero is $66\,\mathrm{m/s}$, and we call that the velocity at $t = 10\,\mathrm{s}$.

Algebra shows why it has to be $66$. Expand $h(10 + \Delta t)$, multiplying out the brackets:

$$
h(10 + \Delta t) = 3(10 + \Delta t)^2 + 0.02(10 + \Delta t)^3 = 320 + 66\,\Delta t + 3.6\,\Delta t^2 + 0.02\,\Delta t^3 .
$$

Subtract $h(10) = 320$, then divide by $\Delta t$:

$$
\frac{h(10 + \Delta t) - h(10)}{\Delta t} = 66 + 3.6\,\Delta t + 0.02\,\Delta t^2 .
$$

For every $\Delta t$ that is not zero, this is exact. And now you can *see* the right-hand side head to $66$ as $\Delta t$ shrinks, because the other two terms shrink with it.

Notice the order. We divided by $\Delta t$ while it was still not zero, which is allowed. Only *afterwards* did we let it shrink. Divide first, then take the limit: that order is the whole trick of calculus.

## What a limit is

Here is the idea in words. We write

$$
\lim_{x \to a} f(x) = L
$$

and read it "the limit of $f$ of $x$, as $x$ goes to $a$, is $L$". It means: you can force $f(x)$ as close to $L$ as anyone asks, by keeping $x$ close enough to $a$ — without ever letting $x$ equal $a$.

The precise version is worth being able to read, even if you rarely use it. For every **[[tolerance|tolerance-window]]** $\varepsilon > 0$ there is a window $\delta > 0$ such that $|f(x) - L| < \varepsilon$ whenever $0 < |x - a| < \delta$. ($\varepsilon$ is the Greek letter "epsilon" and $\delta$ is "delta".) Think of it as a game. Someone names how close they want $f(x)$ to be to $L$. You win if you can always name a window around $a$ that delivers it.

Three things in that definition matter in practice.

**The value at $a$ plays no part.** The function need not even be defined at $a$. In the velocity example, the average-velocity formula is undefined at $\Delta t = 0$, and the limit was still $66$. If $f(a)$ is defined, it can be anything without changing the limit. A limit is about the **neighborhood** of $a$ — the points near it — not the point itself.

**You can come from either side.** The **right-hand limit**, written $\lim_{x \to a^+} f(x)$, uses only $x$ bigger than $a$. The **left-hand limit**, $\lim_{x \to a^-} f(x)$, uses only $x$ smaller than $a$. The ordinary two-sided limit exists exactly when both one-sided limits exist and agree.

Try $f(x) = |x|/x$ near zero. (The bars $|x|$ mean the absolute value, the size without the sign.) For any positive $x$ it equals $1$; for any negative $x$ it equals $-1$. So the right-hand limit is $1$, the left-hand limit is $-1$, and $\lim_{x \to 0} |x|/x$ does not exist.

**A limit can fail in other ways too.** The function can grow without bound, as $1/x^2$ does near $0$. Or it can wobble forever without settling, as $\sin(1/x)$ does near $0$. When $f(x)$ grows without bound we write $\lim_{x \to 0} 1/x^2 = +\infty$. That describes behavior. It does not make $\infty$ a number you can do arithmetic with.

::: warning $0/0$ is a question, not an answer
$0/0$ is not $0$, not $1$, and not something to ignore. It tells you the expression as written cannot be evaluated at that point, and that a limit may or may not exist. Here are four expressions that all read $0/0$ at zero, with four different outcomes: $\sin x / x \to 1$; $(1 - \cos x)/x \to 0$; $x/x^2$ blows up to $\pm\infty$; and $|x|/x$ has no limit at all. You have to do the work each time.
:::

## The limit laws

Limits get along with ordinary arithmetic. Suppose $\lim_{x \to a} f(x) = L$ and $\lim_{x \to a} g(x) = M$. Then

$$
\lim_{x \to a} \big(f(x) \pm g(x)\big) = L \pm M, \qquad
\lim_{x \to a} f(x)\,g(x) = LM, \qquad
\lim_{x \to a} \frac{f(x)}{g(x)} = \frac{L}{M} \quad (M \neq 0),
$$

and for a constant $c$, $\lim_{x \to a} c\,f(x) = cL$. In words: the limit of a sum is the sum of the limits, and the same for differences, products, and quotients, as long as you never divide by a zero limit.

Add two starting facts — a constant stays put, $\lim_{x \to a} c = c$, and $\lim_{x \to a} x = a$ — and these laws let you find the limit of any polynomial by plugging in the number. The same goes for a fraction of polynomials, as long as the bottom is not zero there. For example, $\lim_{x \to 2} (x^3 - 4x) = 8 - 8 = 0$.

The interesting cases are the ones where plugging in gives $0/0$. The plan is always the same: rewrite the expression, using algebra that is true whenever $x \neq a$, into a form you *can* plug into. Here are three ways.

**Factor and cancel.** Take $\dfrac{x^2 - 9}{x - 3}$ near $x = 3$. The top factors as $(x - 3)(x + 3)$:

$$
\lim_{x \to 3} \frac{x^2 - 9}{x - 3} = \lim_{x \to 3} \frac{(x - 3)(x + 3)}{x - 3} = \lim_{x \to 3}(x + 3) = 6 .
$$

Canceling the $x - 3$ is legal because $x$ never equals $3$ during the limit, so you never divide by zero.

**Rationalize.** When a square root causes the zero, multiply top and bottom by the **[[conjugate|conjugate]]** — the same expression with the sign in the middle flipped.

::: example A square-root limit by rationalizing
Find $\lim_{x \to 0} \dfrac{\sqrt{x + 4} - 2}{x}$.

Plugging in gives $(2 - 2)/0 = 0/0$, so we need to rewrite. Multiply top and bottom by the conjugate $\sqrt{x + 4} + 2$. On top, $(\sqrt{x+4} - 2)(\sqrt{x+4} + 2) = (x + 4) - 4 = x$:

$$
\frac{\sqrt{x + 4} - 2}{x}\cdot\frac{\sqrt{x + 4} + 2}{\sqrt{x + 4} + 2}
= \frac{(x + 4) - 4}{x\,(\sqrt{x + 4} + 2)}
= \frac{1}{\sqrt{x + 4} + 2}.
$$

The $x$ on top canceled the $x$ below, which is fine because $x \neq 0$. The new form has no trouble at $0$, so plug in: the limit is $1/(2 + 2) = 1/4 = 0.25$.

Sanity check with numbers. At $x = 0.1$ the original expression is $0.24846$. At $x = 0.01$ it is $0.24984$. At $x = 0.001$ it is $0.24998$. The values close in on $0.25$ from below. That fits the tidy form: for small positive $x$, $\sqrt{x + 4} + 2$ is a little more than $4$, so one over it is a little less than $0.25$.
:::

**Squeeze.** Suppose $g(x) \le f(x) \le h(x)$ near $a$, and the two outside functions have the same limit $L$. Then $f(x)$ is trapped between them, so $f(x) \to L$ too. This is the **[[squeeze theorem|squeeze-picture]]**. It handles limits that algebra cannot crack, and it proves the trigonometric limits below.

It also tames wobbling functions. Since $\sin$ always lies between $-1$ and $1$, we have $-x^2 \le x^2\sin(1/x) \le x^2$. Both outside functions go to $0$, so $x^2 \sin(1/x) \to 0$ — even though $\sin(1/x)$ on its own has no limit.

## Two limits that every derivative of sine and cosine depends on

In the next lesson, finding the derivatives of $\sin$ and $\cos$ comes down to two limits. The angle $\theta$ ("theta") must be in radians:

$$
\lim_{\theta \to 0} \frac{\sin\theta}{\theta} = 1, \qquad
\lim_{\theta \to 0} \frac{1 - \cos\theta}{\theta} = 0 .
$$

The first says that for a tiny angle, $\sin\theta$ and $\theta$ are almost the same number — the small-angle approximation from trigonometry. At $\theta = 0.1$, $\sin\theta = 0.0998$. Here is why it must be exactly $1$ in the limit.

::: note Why the first limit has to be 1
Take $0 < \theta < \pi/2$. On the circle of radius $1$, draw the angle $\theta$ up from the positive $x$-axis. Three shapes nest one inside the next:

- The small triangle with corners at the origin, $(1, 0)$ and $(\cos\theta, \sin\theta)$. Base $1$, height $\sin\theta$, so area $\tfrac12 \sin\theta$.
- The pie slice (the **sector**) between the two radii. It is the fraction $\theta/2\pi$ of the whole disc of area $\pi$, so its area is $\tfrac{\theta}{2\pi}\cdot\pi = \tfrac12 \theta$ — a tidy answer that [[only radians give|radian-area]].
- The big right triangle with corners at the origin, $(1, 0)$ and $(1, \tan\theta)$. Base $1$, height $\tan\theta$, so area $\tfrac12 \tan\theta$.

Each fits inside the next, so

$$
\tfrac12 \sin\theta \le \tfrac12\theta \le \tfrac12 \tan\theta .
$$

Divide everything by $\tfrac12 \sin\theta$, which is positive. Since $\tan\theta/\sin\theta = 1/\cos\theta$,

$$
1 \le \frac{\theta}{\sin\theta} \le \frac{1}{\cos\theta}
\quad\Longrightarrow\quad
\cos\theta \le \frac{\sin\theta}{\theta} \le 1 .
$$

The second form flips each fraction upside down, which reverses the inequalities. As $\theta \to 0^+$, $\cos\theta \to 1$, so $\sin\theta/\theta$ is squeezed to $1$. For negative $\theta$, $\sin(-\theta)/(-\theta) = \sin\theta/\theta$, so the left side gives the same answer. The two-sided limit is $1$.
:::

The second limit follows from the first. Multiply top and bottom by $1 + \cos\theta$, and use $1 - \cos^2\theta = \sin^2\theta$:

$$
\frac{1 - \cos\theta}{\theta} = \frac{1 - \cos^2\theta}{\theta\,(1 + \cos\theta)} = \frac{\sin\theta}{\theta}\cdot\frac{\sin\theta}{1 + \cos\theta}
\;\longrightarrow\; 1 \cdot \frac{0}{2} = 0 .
$$

One more you will use when estimating errors. Keep one extra $\theta$ on the bottom and the same steps give

$$
\frac{1 - \cos\theta}{\theta^2} = \left(\frac{\sin\theta}{\theta}\right)^2\cdot\frac{1}{1 + \cos\theta}
\;\longrightarrow\; 1^2 \cdot \frac{1}{2} = \frac12 .
$$

Numbers agree: at $\theta = 0.1$ the ratio is $0.49958$, and at $\theta = 0.01$ it is $0.499996$.

::: warning These limits need radians
The proof used "the sector's area is $\theta/2$", which is only true in radians. In degrees, $\sin\theta/\theta \to \pi/180 \approx 0.01745$ instead. Flight code that mixes the two does not give an answer that looks broken. It gives one that is off by a factor of $57.3$ — which is worse, because nobody notices.
:::

::: example The sinc function in a quaternion update
A small rotation is described by a **rotation vector** $\boldsymbol{\phi}$ ("phi"): its direction is the axis to turn about, and its length $\theta = |\boldsymbol{\phi}|$ is the angle. Turning it into a quaternion needs the coefficient $\dfrac{\sin(\theta/2)}{\theta}$, which multiplies $\boldsymbol{\phi}$. At $\theta = 0$ this reads $0/0$. What value should the code use?

Rename the half-angle: let $u = \theta/2$, so $\theta = 2u$, and $u \to 0$ as $\theta \to 0$. Then

$$
\lim_{\theta \to 0} \frac{\sin(\theta/2)}{\theta} = \lim_{u \to 0} \frac{\sin u}{2u} = \frac12 \lim_{u \to 0}\frac{\sin u}{u} = \frac12 \cdot 1 = \frac12 .
$$

So the coefficient tends to $0.5$. Check: at $\theta = 0.001$, $\sin(0.0005)/0.001 = 0.49999998$. A careful program returns $0.5$ (or the first terms of a series) when $\theta$ is below some small threshold, instead of dividing.

The same renaming trick handles $\lim_{h \to 0} \sin(3h)/h$. Multiply and divide by $3$: $3 \cdot \dfrac{\sin(3h)}{3h} \to 3 \cdot 1 = 3$. In general $\sin(kh)/h \to k$, because $u = kh$ still goes to zero; it only rescales the variable.
:::

## Limits at infinity

Some questions ask where a quantity ends up after a long time. A sensor is switched on: what reading does it **[[settle to|steady-state]]** as $t \to \infty$? That is a limit at infinity. $\lim_{x \to \infty} f(x) = L$ means $f(x)$ gets as close to $L$ as you like once $x$ is large enough. On a graph, the line $y = L$ is a **horizontal asymptote** — a level line the curve creeps toward.

The basic fact: $\lim_{x \to \infty} 1/x^p = 0$ for any power $p > 0$. One over a huge number is tiny.

For a fraction of polynomials, divide top and bottom by the highest power of $x$ on the bottom. Every leftover piece like $5/x^2$ then goes to zero:

$$
\lim_{x \to \infty} \frac{3x^2 + 5}{2x^2 - x}
= \lim_{x \to \infty} \frac{3 + 5/x^2}{2 - 1/x}
= \frac{3 + 0}{2 - 0} = \frac32 .
$$

Numbers agree: at $x = 10$ the expression is $1.605$, at $x = 100$ it is $1.5078$, and at $x = 1000$ it is $1.50075$.

A rule of thumb for comparing the **degree** (highest power) of top and bottom: equal degrees give the ratio of the leading numbers; a smaller degree on top gives $0$; a bigger degree on top gives $\pm\infty$.

Exponentials beat powers: $\lim_{t \to \infty} t^n e^{-t} = 0$ for every $n$. A decaying exponential eventually crushes any polynomial growth it multiplies. Later you will meet this as the reason that, in a stable system, the start-up wobbles always die out, however they began.

## Continuity

Draw a graph without lifting your pencil. That is the everyday picture of **continuity**. The precise version: $f$ is **continuous at $a$** when three things hold.

1. $f(a)$ is defined.
2. $\lim_{x \to a} f(x)$ exists.
3. The two are equal.

For working purposes, continuity is your license to find a limit by plugging in. A function is continuous on an interval when it is continuous at every point of it.

Polynomials, fractions of polynomials (where the bottom is not zero), $\sin$, $\cos$, $e^x$, $\ln x$ (for $x > 0$), $\sqrt{x}$ (for $x \ge 0$) and $\arctan$ are all continuous wherever they are defined. Sums, products, quotients (bottom not zero) and functions of functions built from continuous pieces are continuous too. That is why the "rationalize, then plug in" step earlier was legal: $1/(\sqrt{x + 4} + 2)$ is continuous at $0$.

Breaks in a graph come in three kinds worth naming.

- A **[[removable|removable-hole]]** discontinuity: the limit exists, but $f(a)$ is missing or wrong — a single hole in the graph. $\sin x / x$ at $0$ is the classic case. Define its value there to be $1$ and the hole is filled. That is exactly what the quaternion code does.
- A **jump** discontinuity: the two one-sided limits differ, as with $|x|/x$. A sudden step in the command sent to an **actuator** (a motor or valve that moves something on the vehicle) is a jump.
- An **infinite** discontinuity: the graph shoots off to infinity at a vertical asymptote, as $\tan x$ does at $\pi/2$.

::: note Angle wrapping is a jump you have already met
The function $\operatorname{atan2}(y, x)$ **[[jumps|angle-wrap]]** from $+\pi$ to $-\pi$ as you cross the negative $x$-axis. Nothing physical jumps — the vehicle turns smoothly — but the *number* used to describe it does. So every heading controller has to subtract angles in a way that handles the wrap. Smooth physics does not guarantee smooth numbers.
:::

### The intermediate value theorem

Walk from the bottom of a hill to the top, and at some moment you must pass every height in between. You cannot skip one without teleporting.

The math version: if $f$ is continuous on $[a, b]$ (the interval from $a$ to $b$, ends included), then $f$ takes every value between $f(a)$ and $f(b)$ somewhere in the interval. In particular, if $f(a)$ and $f(b)$ have opposite signs, then $f(c) = 0$ for some $c$ strictly between $a$ and $b$. This is the **intermediate value theorem**.

It is the reason **bisection** works for finding a root (a place where $f$ is zero). Trap a sign change between two points. Cut the interval in half. Keep the half that still has the sign change. Repeat.

::: example Locating a root by bisection
Show that $x = \cos x$ has a solution between $0$ and $1$, and find it to two decimal places.

Move everything to one side: let $f(x) = x - \cos x$. A solution of $x = \cos x$ is a root of $f$. This $f$ is continuous everywhere.

Check the ends. $f(0) = 0 - 1 = -1$, negative. $f(1) = 1 - 0.5403 = 0.4597$, positive. The signs differ, so by the intermediate value theorem there is a root between $0$ and $1$.

Now bisect, keeping the half where the sign still changes:

| Midpoint | $f$ at midpoint | Root is now in |
| --- | --- | --- |
| $0.5$ | $-0.3776$ | $(0.5, 1)$ |
| $0.75$ | $+0.0183$ | $(0.5, 0.75)$ |
| $0.625$ | $-0.1860$ | $(0.625, 0.75)$ |
| $0.6875$ | $-0.0853$ | $(0.6875, 0.75)$ |
| $0.71875$ | $-0.0339$ | $(0.71875, 0.75)$ |
| $0.734375$ | $-0.0079$ | $(0.734375, 0.75)$ |

After six halvings the bracket is $1/64 \approx 0.016$ wide, so the root is $0.74 \pm 0.01$. The true value is $0.739085$ — inside the bracket, as it must be.

Each halving gains one **[[binary digit|binary-digit]]** of accuracy. Newton's method, in the linearization lesson, gains far faster, but it needs a derivative and a good starting guess. Bisection needs only continuity and a sign change.
:::

::: key Limits
A limit describes the value a function approaches, not the value it takes. $\lim_{x \to a} f(x) = L$ requires nothing of $f(a)$. Limits of sums, products and quotients are the sums, products and quotients of the limits (denominator limit nonzero). A $0/0$ form must be rewritten — by factoring, rationalizing or squeezing — before substituting.
:::

::: key The two trigonometric limits
In radians, $\displaystyle \lim_{\theta \to 0}\frac{\sin\theta}{\theta} = 1$ and $\displaystyle \lim_{\theta \to 0}\frac{1 - \cos\theta}{\theta} = 0$, with the refinement $\displaystyle \lim_{\theta \to 0}\frac{1 - \cos\theta}{\theta^2} = \frac12$. Rescaling the variable gives $\sin(kh)/h \to k$.
:::

::: key Continuity
$f$ is continuous at $a$ when $\lim_{x \to a} f(x) = f(a)$. Elementary functions are continuous on their domains, so limits of them are evaluated by substitution. On an interval where $f$ is continuous, a sign change guarantees a root (intermediate value theorem), which is what makes bisection a valid root finder.
:::

## Check yourself

::: check
A vehicle's downrange position is $x(t) = 2t^2$ meters. Write the average velocity over $[5, 5 + \Delta t]$ as a formula in $\Delta t$, and read off the velocity at $t = 5\,\mathrm{s}$.
:::

::: answer
Expand: $x(5 + \Delta t) = 2(25 + 10\Delta t + \Delta t^2) = 50 + 20\Delta t + 2\Delta t^2$, and $x(5) = 50$. Subtract and divide by $\Delta t$: the average velocity is $\dfrac{20\Delta t + 2\Delta t^2}{\Delta t} = 20 + 2\Delta t$, for $\Delta t \neq 0$.

As $\Delta t \to 0$ this tends to $20$, so the velocity at $t = 5\,\mathrm{s}$ is $20\,\mathrm{m/s}$. Sanity check: the average over any interval starting at $5$ is a bit more than $20$, which makes sense because the vehicle is speeding up.
:::

::: check
Find $\lim_{x \to 2} \dfrac{x^2 - 5x + 6}{x^2 - 4}$.
:::

::: answer
Plugging in gives $0/0$, so factor. Top: $x^2 - 5x + 6 = (x - 2)(x - 3)$. Bottom: $x^2 - 4 = (x - 2)(x + 2)$. For $x \neq 2$ the fraction equals $\dfrac{x - 3}{x + 2}$, which is continuous at $2$. Plug in: $\dfrac{2 - 3}{2 + 2} = -\dfrac14$.
:::

::: check
Find $\lim_{\theta \to 0} \dfrac{\tan 2\theta}{\theta}$ and $\lim_{\theta \to 0} \dfrac{1 - \cos 3\theta}{\theta^2}$.
:::

::: answer
First: write $\tan 2\theta = \sin 2\theta / \cos 2\theta$, then multiply and divide by $2$:

$$
\frac{\tan 2\theta}{\theta} = 2\cdot\frac{\sin 2\theta}{2\theta}\cdot\frac{1}{\cos 2\theta} \to 2 \cdot 1 \cdot 1 = 2 .
$$

Second: let $u = 3\theta$, so $\theta = u/3$ and $\theta^2 = u^2/9$. Then $\dfrac{1 - \cos u}{u^2/9} = 9\cdot\dfrac{1 - \cos u}{u^2} \to 9 \cdot \dfrac12 = \dfrac92$.
:::

::: check
The function $g(x) = \dfrac{x^2 - 1}{x - 1}$ is not defined at $x = 1$. Does it have a limit there? Can it be made continuous at $1$, and how?
:::

::: answer
Factor the top: $x^2 - 1 = (x - 1)(x + 1)$. So for $x \neq 1$, $g(x) = x + 1$, and $\lim_{x \to 1} g(x) = 2$.

The break is removable. Define $g(1) = 2$, and the filled-in function is $x + 1$ everywhere, which is continuous. The limit did not change at all — you only supplied the missing value at one point.
:::

::: check
An altitude controller commands thrust $T(h) = 10 - 4h$ for $h < 1$ and $T(h) = 3h + 2$ for $h \ge 1$ (thrust in kilonewtons, $h$ in kilometers). Is the command continuous at $h = 1$? What are the one-sided limits?
:::

::: answer
From the left: $\lim_{h \to 1^-} (10 - 4h) = 10 - 4 = 6$. From the right: $\lim_{h \to 1^+} (3h + 2) = 3 + 2 = 5$. They differ, so the two-sided limit does not exist. The command has a jump of $1\,\mathrm{kN}$ at $h = 1\,\mathrm{km}$. A vehicle crossing that altitude would feel a sudden thrust step — exactly the kind of thing a guidance designer smooths out.
:::

::: check
Explain why $\lim_{x \to \infty} \dfrac{5x^3 - x}{2x^3 + 7x^2} = \dfrac52$, and find $\lim_{x \to \infty} \dfrac{5x^2 - x}{2x^3 + 7x^2}$.
:::

::: answer
Divide top and bottom by $x^3$: $\dfrac{5 - 1/x^2}{2 + 7/x}$. As $x$ grows, $1/x^2 \to 0$ and $7/x \to 0$, leaving $\dfrac52$.

For the second, the same division gives $\dfrac{5/x - 1/x^2}{2 + 7/x} \to \dfrac{0}{2} = 0$. The bottom grows faster than the top (degree $3$ against $2$), so the fraction dies away.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Limit | $\lim_{x \to a} f(x) = L$: $f(x)$ is as close to $L$ as required for all $x$ close enough to $a$, $x \neq a$ |
| One-sided limits | The two-sided limit exists exactly when $\lim_{x \to a^-} f = \lim_{x \to a^+} f$ |
| Limit laws | Limits of sums, products, quotients (nonzero denominator) are the sums, products, quotients of limits |
| $0/0$ forms | Factor, rationalize, or squeeze, then substitute |
| Trig limits (radians) | $\sin\theta/\theta \to 1$, $(1 - \cos\theta)/\theta \to 0$, $(1 - \cos\theta)/\theta^2 \to \tfrac12$ |
| Limits at infinity | Fractions of polynomials: compare degrees; $t^n e^{-t} \to 0$ |
| Continuity | $\lim_{x \to a} f(x) = f(a)$; elementary functions are continuous on their domains |
| Intermediate value theorem | Continuous on $[a, b]$ with a sign change gives a root in $(a, b)$; bisection finds it |

The velocity calculation at the start of this lesson — form the average over a short interval, simplify while the interval is not zero, then take the limit — is the definition of the **derivative**. The next lesson names it, works it out for every basic function, and turns it into rules so the limit itself fades from view.

::: context quaternion Four numbers for a turn
A **quaternion** is a set of four numbers that describes how a spacecraft is turned — any amount of turn about any axis. One number carries the cosine of half the angle; the other three carry the axis, scaled by the sine of half the angle. Nearly every modern spacecraft and many rockets store their attitude this way, because quaternions have no trouble spots at any angle. You will build them properly in the attitude modules. For now, all you need is that a formula inside them divides by the angle.
:::

::: context tolerance-window The tolerance game, drawn
The blue band is the tolerance: every value within $\varepsilon$ of $L$. The orange strip is your window: every $x$ within $\delta$ of $a$. The definition says that for any band, however thin, you can find a strip narrow enough that the curve stays inside the band across the whole strip. The hollow dot is a reminder that the point $x = a$ itself is left out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="40.0" y="86.4" width="272.0" height="31.2" fill="#8fb8f0" opacity="0.45"/>
  <rect x="188.8" y="18.8" width="42.5" height="161.2" fill="#f2b880" opacity="0.5"/>
  <line x1="40" y1="180" x2="312.0" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="18.8" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="40.0,154.0 46.8,153.9 53.6,153.7 60.4,153.3 67.2,152.7 74.0,151.9 80.8,151.0 87.6,149.9 94.4,148.7 101.2,147.3 108.0,145.7 114.8,143.9 121.6,142.0 128.4,139.9 135.2,137.7 142.0,135.3 148.8,132.7 155.6,130.0 162.4,127.0 169.2,124.0 176.0,120.7 182.8,117.3 189.6,113.7 196.4,110.0 203.2,106.1 210.0,102.0 216.8,97.8 223.6,93.3 230.4,88.8 237.2,84.0 244.0,79.1 250.8,74.0 257.6,68.8 264.4,63.4 271.2,57.8 278.0,52.1 284.8,46.2 291.6,40.1 298.4,33.9 305.2,27.5 312.0,20.9"/>
  <line x1="40" y1="102.0" x2="210.0" y2="102.0" stroke="#1d6fd1" stroke-width="1.2" stroke-dasharray="4 3"/>
  <line x1="210.0" y1="102.0" x2="210.0" y2="180" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <circle cx="210.0" cy="102.0" r="4" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="34" y="106.0" font-size="12" text-anchor="end" fill="#1d6fd1">L</text>
  <text x="34" y="90.4" font-size="11" text-anchor="end" fill="#1d6fd1">L+ε</text>
  <text x="34" y="121.6" font-size="11" text-anchor="end" fill="#1d6fd1">L−ε</text>
  <text x="210.0" y="194" font-size="12" text-anchor="middle" fill="#1f2a44">a</text>
  <text x="186.8" y="194" font-size="11" text-anchor="end" fill="#1f2a44">a−δ</text>
  <text x="233.2" y="194" font-size="11" fill="#1f2a44">a+δ</text>
  <text x="250" y="30" font-size="11" fill="#1f2a44">y = f(x)</text>
  <text x="48" y="80.4" font-size="11" fill="#1d6fd1">tolerance band</text>
  <text x="258" y="140" font-size="11" fill="#1f2a44">every x in the</text>
  <text x="258" y="154" font-size="11" fill="#1f2a44">window puts f(x)</text>
  <text x="258" y="168" font-size="11" fill="#1f2a44">inside the band</text>
</svg>
```

Here $f(x) = 0.25x^2 + 0.5$, $a = 2$, $L = 1.5$, $\varepsilon = 0.3$ and $\delta = 0.25$. Across the strip, $f$ runs from about $1.27$ to $1.77$ — inside the band from $1.2$ to $1.8$.
:::

::: context conjugate Why the conjugate works
The conjugate of $\sqrt{x + 4} - 2$ is $\sqrt{x + 4} + 2$: same pieces, middle sign flipped. The reason to use it is the pattern $(p - q)(p + q) = p^2 - q^2$. The middle terms cancel, and squaring kills the square root. So $(\sqrt{x + 4} - 2)(\sqrt{x + 4} + 2) = (x + 4) - 4 = x$. The troublesome difference of two nearly equal numbers becomes a plain $x$ that can cancel.
:::

::: context squeeze-picture Trapped between two curves
The blue curve $x^2\sin(1/x)$ wiggles faster and faster as it nears zero, but it can never escape the two red parabolas $x^2$ and $-x^2$. Both parabolas pinch together at the origin, so the blue curve is pinched to $0$ as well. Some books call this the sandwich theorem.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="15" y1="100" x2="345" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="15" x2="180" y2="185" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.8" stroke-dasharray="5 3" points="29.6,29.3 32.8,32.3 36.0,35.2 39.2,38.0 42.4,40.8 45.6,43.6 48.8,46.2 52.0,48.8 55.2,51.3 58.4,53.8 61.6,56.2 64.8,58.5 68.0,60.8 71.2,63.0 74.4,65.2 77.6,67.2 80.8,69.2 84.0,71.2 87.2,73.1 90.4,74.9 93.6,76.7 96.8,78.4 100.0,80.0 103.2,81.6 106.4,83.1 109.6,84.5 112.8,85.9 116.0,87.2 119.2,88.4 122.4,89.6 125.6,90.8 128.8,91.8 132.0,92.8 135.2,93.7 138.4,94.6 141.6,95.4 144.8,96.1 148.0,96.8 151.2,97.4 154.4,98.0 157.6,98.4 160.8,98.8 164.0,99.2 167.2,99.5 170.4,99.7 173.6,99.9 176.8,100.0 180.0,100.0 183.2,100.0 186.4,99.9 189.6,99.7 192.8,99.5 196.0,99.2 199.2,98.8 202.4,98.4 205.6,98.0 208.8,97.4 212.0,96.8 215.2,96.1 218.4,95.4 221.6,94.6 224.8,93.7 228.0,92.8 231.2,91.8 234.4,90.8 237.6,89.6 240.8,88.4 244.0,87.2 247.2,85.9 250.4,84.5 253.6,83.1 256.8,81.6 260.0,80.0 263.2,78.4 266.4,76.7 269.6,74.9 272.8,73.1 276.0,71.2 279.2,69.2 282.4,67.2 285.6,65.2 288.8,63.0 292.0,60.8 295.2,58.5 298.4,56.2 301.6,53.8 304.8,51.3 308.0,48.8 311.2,46.2 314.4,43.6 317.6,40.8 320.8,38.0 324.0,35.2 327.2,32.3 330.4,29.3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.8" stroke-dasharray="5 3" points="29.6,170.7 32.8,167.7 36.0,164.8 39.2,162.0 42.4,159.2 45.6,156.4 48.8,153.8 52.0,151.2 55.2,148.7 58.4,146.2 61.6,143.8 64.8,141.5 68.0,139.2 71.2,137.0 74.4,134.8 77.6,132.8 80.8,130.8 84.0,128.8 87.2,126.9 90.4,125.1 93.6,123.3 96.8,121.6 100.0,120.0 103.2,118.4 106.4,116.9 109.6,115.5 112.8,114.1 116.0,112.8 119.2,111.6 122.4,110.4 125.6,109.2 128.8,108.2 132.0,107.2 135.2,106.3 138.4,105.4 141.6,104.6 144.8,103.9 148.0,103.2 151.2,102.6 154.4,102.0 157.6,101.6 160.8,101.2 164.0,100.8 167.2,100.5 170.4,100.3 173.6,100.1 176.8,100.0 180.0,100.0 183.2,100.0 186.4,100.1 189.6,100.3 192.8,100.5 196.0,100.8 199.2,101.2 202.4,101.6 205.6,102.0 208.8,102.6 212.0,103.2 215.2,103.9 218.4,104.6 221.6,105.4 224.8,106.3 228.0,107.2 231.2,108.2 234.4,109.2 237.6,110.4 240.8,111.6 244.0,112.8 247.2,114.1 250.4,115.5 253.6,116.9 256.8,118.4 260.0,120.0 263.2,121.6 266.4,123.3 269.6,125.1 272.8,126.9 276.0,128.8 279.2,130.8 282.4,132.8 285.6,134.8 288.8,137.0 292.0,139.2 295.2,141.5 298.4,143.8 301.6,146.2 304.8,148.7 308.0,151.2 311.2,153.8 314.4,156.4 317.6,159.2 320.8,162.0 324.0,164.8 327.2,167.7 330.4,170.7"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.6" points="29.6,160.0 42.5,142.9 53.4,128.9 62.7,117.3 70.7,107.9 77.7,100.5 83.8,94.7 89.3,90.3 94.2,87.3 98.5,85.3 102.5,84.3 106.1,84.2 109.3,84.7 112.3,85.7 115.1,87.1 117.6,88.9 119.9,90.8 122.1,92.8 124.1,94.9 126.0,96.8 127.8,98.7 129.4,100.4 131.0,101.8 132.4,103.0 133.8,104.0 135.1,104.7 136.3,105.2 137.5,105.3 138.6,105.3 139.6,105.1 140.6,104.7 141.6,104.1 142.5,103.4 143.3,102.7 144.2,101.9 144.9,101.1 145.7,100.4 146.4,99.6 147.1,99.0 147.8,98.4 148.4,98.0 149.0,97.6 149.6,97.4 150.2,97.3 150.7,97.3 151.2,97.4 151.8,97.6 152.2,97.9 152.7,98.3 153.2,98.7 153.6,99.1 154.0,99.5 154.5,99.9 154.9,100.3 155.2,100.7 155.6,101.0 156.0,101.2 156.3,101.4 156.7,101.6 157.0,101.6 157.3,101.6 157.7,101.5 158.0,101.4 158.3,101.2 158.6,101.0 158.8,100.8 159.1,100.5 159.4,100.2 159.7,100.0 159.9,99.7 160.2,99.5 160.4,99.3 160.6,99.1 160.9,99.0 161.1,99.0 161.3,98.9 161.5,98.9 161.7,99.0 161.9,99.1 162.2,99.2 162.3,99.4 162.5,99.5 162.7,99.7 162.9,99.9 163.1,100.1 163.3,100.2 163.4,100.4 163.6,100.5 163.8,100.6 163.9,100.7 164.1,100.8 164.3,100.8 164.4,100.8 164.6,100.7 164.7,100.6 164.9,100.5 165.0,100.4 165.1,100.3 165.3,100.2 165.4,100.0 165.5,99.9 165.7,99.8 165.8,99.7 165.9,99.6 166.0,99.5 166.2,99.5 166.3,99.4 166.4,99.4 166.5,99.4 166.6,99.5 166.7,99.5 166.8,99.6 167.0,99.7 167.1,99.8 167.2,99.9 167.3,100.0 167.4,100.1 167.5,100.2 167.6,100.3 167.7,100.3 167.8,100.4 167.8,100.4 167.9,100.4 168.0,100.4 168.1,100.4 168.2,100.4 168.3,100.3 168.4,100.3 168.5,100.2 168.5,100.1 168.6,100.1 168.7,100.0 168.8,99.9 168.9,99.8 168.9,99.8 169.0,99.7 169.1,99.7 169.2,99.7 169.2,99.6 169.3,99.6 169.4,99.7 169.4,99.7 169.5,99.7 169.6,99.8 169.7,99.8 169.7,99.9 169.8,100.0 169.9,100.0 169.9,100.1 170.0,100.2 170.0,100.2 170.1,100.2 170.2,100.3 170.2,100.3 170.3,100.3 170.3,100.3 170.4,100.3 170.5,100.2 170.5,100.2 170.6,100.2 170.6,100.1 170.7,100.1 170.7,100.0 170.8,100.0 170.8,99.9 170.9,99.9 170.9,99.8 171.0,99.8 171.0,99.8 171.1,99.8 171.1,99.8 171.2,99.8 171.2,99.8 171.3,99.8 171.3,99.8 171.4,99.9 171.4,99.9 171.5,100.0 171.5,100.0 171.6,100.1 171.6,100.1 171.7,100.1 171.7,100.2 171.7,100.2 171.8,100.2 171.8,100.2 171.9,100.2 171.9,100.2 171.9,100.2 172.0,100.2 172.0,100.1 172.1,100.1 172.1,100.1 172.1,100.0 172.2,100.0 172.2,99.9 172.3,99.9 172.3,99.9 172.3,99.9 172.4,99.8 172.4,99.8 172.4,99.8 172.5,99.8 172.5,99.8 172.5,99.8 172.6,99.9 172.6,99.9 172.6,99.9 172.7,100.0 172.7,100.0 172.7,100.0 172.8,100.1 172.8,100.1 172.8,100.1 172.9,100.1 172.9,100.1 172.9,100.2 173.0,100.2 173.0,100.2 173.0,100.1 173.1,100.1 173.1,100.1 173.1,100.1 173.2,100.1 173.2,100.0 173.2,100.0 173.2,100.0 173.3,99.9 173.3,99.9 173.3,99.9 173.4,99.9 173.4,99.9 173.4,99.9 173.4,99.9 173.5,99.9 173.5,99.9 173.5,99.9 173.5,99.9 173.6,99.9 173.6,100.0 173.6,100.0 173.6,100.0 173.7,100.0 173.7,100.1 173.7,100.1 173.7,100.1 173.8,100.1 173.8,100.1 173.8,100.1 173.8,100.1 173.9,100.1 173.9,100.1 173.9,100.1 173.9,100.1 174.0,100.1 174.0,100.0 174.0,100.0 174.0,100.0 174.0,100.0 174.1,99.9 174.1,99.9 174.1,99.9 174.1,99.9 174.2,99.9 174.2,99.9 174.2,99.9 174.2,99.9 174.2,99.9 174.3,99.9 174.3,99.9 174.3,100.0 174.3,100.0 174.3,100.0 174.4,100.0 174.4,100.0 174.4,100.1 174.4,100.1 174.4,100.1 174.5,100.1 174.5,100.1 174.5,100.1 174.5,100.1 174.5,100.1 174.6,100.1 174.6,100.1 174.6,100.0 174.6,100.0 174.6,100.0 174.6,100.0 174.7,100.0 180.0,100.0 185.3,100.0 185.4,100.0 185.4,100.0 185.4,100.0 185.4,100.0 185.4,99.9 185.4,99.9 185.5,99.9 185.5,99.9 185.5,99.9 185.5,99.9 185.5,99.9 185.6,99.9 185.6,99.9 185.6,99.9 185.6,100.0 185.6,100.0 185.7,100.0 185.7,100.0 185.7,100.0 185.7,100.1 185.7,100.1 185.8,100.1 185.8,100.1 185.8,100.1 185.8,100.1 185.8,100.1 185.9,100.1 185.9,100.1 185.9,100.1 185.9,100.1 186.0,100.0 186.0,100.0 186.0,100.0 186.0,100.0 186.0,99.9 186.1,99.9 186.1,99.9 186.1,99.9 186.1,99.9 186.2,99.9 186.2,99.9 186.2,99.9 186.2,99.9 186.3,99.9 186.3,99.9 186.3,99.9 186.3,100.0 186.4,100.0 186.4,100.0 186.4,100.0 186.4,100.1 186.5,100.1 186.5,100.1 186.5,100.1 186.5,100.1 186.6,100.1 186.6,100.1 186.6,100.1 186.6,100.1 186.7,100.1 186.7,100.1 186.7,100.1 186.8,100.0 186.8,100.0 186.8,100.0 186.8,99.9 186.9,99.9 186.9,99.9 186.9,99.9 187.0,99.9 187.0,99.8 187.0,99.8 187.1,99.8 187.1,99.9 187.1,99.9 187.2,99.9 187.2,99.9 187.2,99.9 187.3,100.0 187.3,100.0 187.3,100.0 187.4,100.1 187.4,100.1 187.4,100.1 187.5,100.2 187.5,100.2 187.5,100.2 187.6,100.2 187.6,100.2 187.6,100.2 187.7,100.1 187.7,100.1 187.7,100.1 187.8,100.1 187.8,100.0 187.9,100.0 187.9,99.9 187.9,99.9 188.0,99.9 188.0,99.8 188.1,99.8 188.1,99.8 188.1,99.8 188.2,99.8 188.2,99.8 188.3,99.8 188.3,99.8 188.3,99.9 188.4,99.9 188.4,99.9 188.5,100.0 188.5,100.0 188.6,100.1 188.6,100.1 188.7,100.2 188.7,100.2 188.8,100.2 188.8,100.2 188.9,100.2 188.9,100.2 189.0,100.2 189.0,100.2 189.1,100.2 189.1,100.1 189.2,100.1 189.2,100.0 189.3,100.0 189.3,99.9 189.4,99.9 189.4,99.8 189.5,99.8 189.5,99.8 189.6,99.7 189.7,99.7 189.7,99.7 189.8,99.7 189.8,99.7 189.9,99.8 190.0,99.8 190.0,99.8 190.1,99.9 190.1,100.0 190.2,100.0 190.3,100.1 190.3,100.2 190.4,100.2 190.5,100.3 190.6,100.3 190.6,100.3 190.7,100.4 190.8,100.4 190.8,100.3 190.9,100.3 191.0,100.3 191.1,100.2 191.1,100.2 191.2,100.1 191.3,100.0 191.4,99.9 191.5,99.9 191.5,99.8 191.6,99.7 191.7,99.7 191.8,99.6 191.9,99.6 192.0,99.6 192.1,99.6 192.2,99.6 192.2,99.6 192.3,99.7 192.4,99.7 192.5,99.8 192.6,99.9 192.7,100.0 192.8,100.1 192.9,100.2 193.0,100.3 193.2,100.4 193.3,100.5 193.4,100.5 193.5,100.6 193.6,100.6 193.7,100.6 193.8,100.5 194.0,100.5 194.1,100.4 194.2,100.3 194.3,100.2 194.5,100.1 194.6,100.0 194.7,99.8 194.9,99.7 195.0,99.6 195.1,99.5 195.3,99.4 195.4,99.3 195.6,99.2 195.7,99.2 195.9,99.2 196.1,99.3 196.2,99.4 196.4,99.5 196.6,99.6 196.7,99.8 196.9,99.9 197.1,100.1 197.3,100.3 197.5,100.5 197.7,100.6 197.8,100.8 198.1,100.9 198.3,101.0 198.5,101.1 198.7,101.1 198.9,101.0 199.1,101.0 199.4,100.9 199.6,100.7 199.8,100.5 200.1,100.3 200.3,100.0 200.6,99.8 200.9,99.5 201.2,99.2 201.4,99.0 201.7,98.8 202.0,98.6 202.3,98.5 202.7,98.4 203.0,98.4 203.3,98.4 203.7,98.6 204.0,98.8 204.4,99.0 204.8,99.3 205.1,99.7 205.5,100.1 206.0,100.5 206.4,100.9 206.8,101.3 207.3,101.7 207.8,102.1 208.2,102.4 208.8,102.6 209.3,102.7 209.8,102.7 210.4,102.6 211.0,102.4 211.6,102.0 212.2,101.6 212.9,101.0 213.6,100.4 214.3,99.6 215.1,98.9 215.8,98.1 216.7,97.3 217.5,96.6 218.4,95.9 219.4,95.3 220.4,94.9 221.4,94.7 222.5,94.7 223.7,94.8 224.9,95.3 226.2,96.0 227.6,97.0 229.0,98.2 230.6,99.6 232.2,101.3 234.0,103.2 235.9,105.1 237.9,107.2 240.1,109.2 242.4,111.1 244.9,112.9 247.7,114.3 250.7,115.3 253.9,115.8 257.5,115.7 261.5,114.7 265.8,112.7 270.7,109.7 276.2,105.3 282.3,99.5 289.3,92.1 297.3,82.7 306.6,71.1 317.5,57.1 330.4,40.0"/>
  <text x="262" y="22" font-size="12" fill="#b4232c">y = x²</text>
  <text x="250" y="192" font-size="12" fill="#b4232c">y = −x²</text>
  <text x="20" y="16" font-size="12" fill="#1d6fd1">y = x² sin(1/x)</text>
  <text x="186" y="116" font-size="11" fill="#1f2a44">0</text>
</svg>
```
:::

::: context radian-area Why the slice has area θ/2
A whole circle of radius $1$ has area $\pi \cdot 1^2 = \pi$, and a full turn is $2\pi$ radians. A slice with angle $\theta$ is the fraction $\theta/(2\pi)$ of the full turn, so its area is $\frac{\theta}{2\pi}\cdot\pi = \frac{\theta}{2}$. That neat answer only works because radians measure the angle by arc length on the unit circle. In degrees you would get $\frac{\pi\theta}{360}$, and the extra $\pi/180$ follows you through every formula.
:::

::: context steady-state Where a sensor settles
Many sensors respond to a sudden change the way a thermometer does when you move it into a warm room: fast at first, then slower and slower. A common model is $y(t) = y_\infty\left(1 - e^{-t/\tau}\right)$, where $\tau$ ("tau") is a time constant. As $t \to \infty$, $e^{-t/\tau} \to 0$, so the reading tends to $y_\infty$ ("y infinity"), its steady-state value. It never quite gets there, but after $5\tau$ it is within about $0.7\%$. The last lesson of this module works with this exponential and its time constant.
:::

::: context removable-hole A graph with one missing point
The curve $\sin x / x$ is smooth everywhere except at $x = 0$, where the formula gives $0/0$ and the graph has a single missing point. The limit from both sides is $1$, so filling in the point at height $1$ repairs it completely.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="15" y1="150" x2="345" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="176" y1="40" x2="184" y2="40" stroke="#6c7a93" stroke-width="1"/>
  <text x="172" y="44" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="20.0,156.0 21.6,155.1 23.2,154.1 24.8,153.1 26.4,152.0 28.0,150.9 29.6,149.7 31.2,148.5 32.8,147.3 34.4,146.1 36.0,145.0 37.6,143.8 39.2,142.7 40.8,141.6 42.4,140.6 44.0,139.7 45.6,138.8 47.2,138.0 48.8,137.4 50.4,136.8 52.0,136.4 53.6,136.1 55.2,135.9 56.8,135.9 58.4,136.0 60.0,136.2 61.6,136.6 63.2,137.2 64.8,137.9 66.4,138.7 68.0,139.7 69.6,140.8 71.2,142.0 72.8,143.4 74.4,144.8 76.0,146.4 77.6,148.0 79.2,149.7 80.8,151.5 82.4,153.3 84.0,155.1 85.6,157.0 87.2,158.8 88.8,160.6 90.4,162.4 92.0,164.1 93.6,165.7 95.2,167.3 96.8,168.7 98.4,170.0 100.0,171.1 101.6,172.1 103.2,172.8 104.8,173.4 106.4,173.8 108.0,173.9 109.6,173.8 111.2,173.4 112.8,172.8 114.4,172.0 116.0,170.8 117.6,169.4 119.2,167.7 120.8,165.8 122.4,163.5 124.0,161.0 125.6,158.3 127.2,155.3 128.8,152.0 130.4,148.5 132.0,144.8 133.6,140.9 135.2,136.8 136.8,132.6 138.4,128.2 140.0,123.7 141.6,119.0 143.2,114.3 144.8,109.6 146.4,104.8 148.0,100.0 149.6,95.2 151.2,90.5 152.8,85.8 154.4,81.3 156.0,76.9 157.6,72.6 159.2,68.5 160.8,64.6 162.4,60.9 164.0,57.4 165.6,54.3 167.2,51.4 168.8,48.8 170.4,46.5 172.0,44.5 173.6,42.9 175.2,41.6 176.8,40.7 178.4,40.2 179.7,40.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="180.3,40.0 181.6,40.2 183.2,40.7 184.8,41.6 186.4,42.9 188.0,44.5 189.6,46.5 191.2,48.8 192.8,51.4 194.4,54.3 196.0,57.4 197.6,60.9 199.2,64.6 200.8,68.5 202.4,72.6 204.0,76.9 205.6,81.3 207.2,85.8 208.8,90.5 210.4,95.2 212.0,100.0 213.6,104.8 215.2,109.6 216.8,114.3 218.4,119.0 220.0,123.7 221.6,128.2 223.2,132.6 224.8,136.8 226.4,140.9 228.0,144.8 229.6,148.5 231.2,152.0 232.8,155.3 234.4,158.3 236.0,161.0 237.6,163.5 239.2,165.8 240.8,167.7 242.4,169.4 244.0,170.8 245.6,172.0 247.2,172.8 248.8,173.4 250.4,173.8 252.0,173.9 253.6,173.8 255.2,173.4 256.8,172.8 258.4,172.1 260.0,171.1 261.6,170.0 263.2,168.7 264.8,167.3 266.4,165.7 268.0,164.1 269.6,162.4 271.2,160.6 272.8,158.8 274.4,157.0 276.0,155.1 277.6,153.3 279.2,151.5 280.8,149.7 282.4,148.0 284.0,146.4 285.6,144.8 287.2,143.4 288.8,142.0 290.4,140.8 292.0,139.7 293.6,138.7 295.2,137.9 296.8,137.2 298.4,136.6 300.0,136.2 301.6,136.0 303.2,135.9 304.8,135.9 306.4,136.1 308.0,136.4 309.6,136.8 311.2,137.4 312.8,138.0 314.4,138.8 316.0,139.7 317.6,140.6 319.2,141.6 320.8,142.7 322.4,143.8 324.0,145.0 325.6,146.1 327.2,147.3 328.8,148.5 330.4,149.7 332.0,150.9 333.6,152.0 335.2,153.1 336.8,154.1 338.4,155.1 340.0,156.0"/>
  <circle cx="180" cy="40" r="4.5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="196" y="36" font-size="12" fill="#b4232c">hole at (0, 1):</text>
  <text x="196" y="51" font-size="12" fill="#b4232c">the formula gives 0/0</text>
  <g stroke="#6c7a93" stroke-width="1"><line x1="230.3" y1="146" x2="230.3" y2="154"/><line x1="280.5" y1="146" x2="280.5" y2="154"/><line x1="129.7" y1="146" x2="129.7" y2="154"/><line x1="79.5" y1="146" x2="79.5" y2="154"/></g>
  <text x="236.3" y="142" font-size="11" fill="#1f2a44">π</text>
  <text x="286.5" y="168" font-size="11" fill="#1f2a44">2π</text>
  <text x="123.7" y="142" font-size="11" text-anchor="end" fill="#1f2a44">−π</text>
  <text x="73.5" y="168" font-size="11" text-anchor="end" fill="#1f2a44">−2π</text>
  <text x="250" y="90" font-size="12" fill="#1d6fd1">y = sin x / x</text>
</svg>
```

Engineers call the repaired function **sinc** (short for the Latin *sinus cardinalis*). It shows up in signal processing as well as in attitude code.
:::

::: context angle-wrap Why the heading number jumps
An angle and the angle plus a full turn point the same way, so software picks one standard range, usually from $-\pi$ to $+\pi$ ($-180^\circ$ to $+180^\circ$). A vehicle turning smoothly through the direction at $180^\circ$ makes the number leap from about $+180^\circ$ to about $-180^\circ$. Subtracting the raw numbers across that seam gives an error of nearly $360^\circ$ instead of a few degrees. The trigonometry module's lesson on atan2 shows the standard fix: wrap every angle difference back into the range.
:::

::: context binary-digit One binary digit per halving
Each halving shrinks the bracket by a factor of $2$. After $n$ halvings it is $2^{-n}$ times its starting width. Since $2^{10} = 1024$, ten halvings buy about three decimal places, and a double-precision number (about $16$ decimal digits) takes around $50$ halvings to pin down completely. Slow but certain: bisection can never lose the root once it has trapped a sign change.
:::
