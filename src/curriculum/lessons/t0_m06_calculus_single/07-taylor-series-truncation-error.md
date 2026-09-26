---
id: l07-taylor-series-truncation-error
title: Taylor series and truncation error
minutes: 26
covers:
  - Taylor series and truncation error
---

Imagine a friend phones you from a car and tells you where she is. Your best guess for where she will be in a minute: about the same place. Then she tells you her speed, and your guess gets much better. Then she says she is speeding up, and by how much. Better again. Every extra fact about *this moment* sharpens your guess about the *next* one.

That is the whole idea of this lesson. The last lesson replaced a function by its tangent line — its value and its slope at one point — and found that the error grew like $h^2$, where $h$ is how far you step away from that point. The tangent line is the first stop on a longer road. Add a term that uses the curve's bend, and the error shrinks to $h^3$. Add one more, and it shrinks to $h^4$. The polynomial you build this way is the **Taylor polynomial**. Keep adding terms forever and you get the **[[Taylor series|taylor-name]]**. What you leave off when you stop is the **truncation error** — "truncate" means "cut off", and the first piece you cut off tells you what it cost.

For a guidance, navigation and control (GNC) engineer this is the bookkeeping behind every numerical method you will use. A Runge–Kutta integrator, which steps an orbit forward in time, is a recipe for matching as many Taylor terms as possible. The sine and cosine that flight software calls are cut-off series. And the "second-order effects" that throw off an Extended Kalman Filter are, quite literally, the second term of the expansion you are about to write down. Learn the notation here — $h$ for the step, $O(h^{n+1})$ for the remainder, $\xi$ for an unknown in-between point — and later modules will read as applications.

## Matching derivatives: the Taylor polynomial

Think of copying a curve while looking at only one point of it. With the height alone you can draw a flat line. Add the slope and you can tilt it to match. Add the bend (the second derivative) and you can curve your copy the same way. Each extra derivative makes the copy hug the original over a wider stretch.

Now the precise version. Fix a point $x_0$ ("x naught", the point you expand about) and a step $h$, so the point you care about is $x = x_0 + h$. The linearization $f(x_0) + f'(x_0)h$ is the one straight line that agrees with $f$ in value and in slope at $x_0$. Ask for more: which polynomial of degree $n$ agrees with $f$ in value *and* in its first $n$ derivatives at $x_0$?

Write the candidate in powers of $h$, with unknown numbers $c_0, c_1, \ldots$ in front:

$$
P_n(h) = c_0 + c_1 h + c_2 h^2 + \cdots + c_n h^n.
$$

To find $c_k$, differentiate $P_n$ exactly $k$ times and then set $h = 0$. Three things happen to the terms:

- Every power lower than $h^k$ has been differentiated to zero. (Differentiate $h^2$ three times: $2h$, then $2$, then $0$.)
- Every power higher than $h^k$ still has at least one factor of $h$ left, so it vanishes when $h = 0$.
- The term $c_k h^k$ itself becomes $k(k-1)\cdots 2 \cdot 1 \cdot c_k$.

That product $k(k-1)\cdots 1$ is written $k!$ and read "**[[k factorial|factorial]]**". For example, $3! = 3 \cdot 2 \cdot 1 = 6$, and $0! = 1$ by agreement. So

$$
P_n^{(k)}(0) = k!\,c_k.
$$

(Read $P_n^{(k)}$ as "the $k$-th derivative of $P_n$".) We want this to equal $f^{(k)}(x_0)$, the $k$-th derivative of $f$ at $x_0$. Divide both sides by $k!$:

$$
c_k = \frac{f^{(k)}(x_0)}{k!}.
$$

That fixes every coefficient. The Taylor polynomial of degree $n$ about $x_0$ is

$$
P_n(h) = f(x_0) + f'(x_0)\,h + \frac{f''(x_0)}{2!}\,h^2 + \frac{f'''(x_0)}{3!}\,h^3 + \cdots + \frac{f^{(n)}(x_0)}{n!}\,h^n = \sum_{k=0}^{n} \frac{f^{(k)}(x_0)}{k!}\,h^k.
$$

The big $\Sigma$ ("sigma") means "add up the terms for $k = 0, 1, \ldots, n$". With $n = 1$ you get back the linearization. With $n = 0$ you get the flat line $f(x_0)$. Let $n$ grow forever and you have the **Taylor series** of $f$ about $x_0$. When $x_0 = 0$ it is often called a **Maclaurin series**.

The factorials are what the matching demanded, and they help the series settle down, because $k!$ eventually grows faster than any power. You can watch the polynomials [[wrap themselves around the sine curve|sine-taylor-picture]] as the degree rises.

::: key Taylor expansion
Taylor expansion of $f$ about $x_0$: $f(x_0 + h) = f(x_0) + f'(x_0)h + \dfrac{f''(x_0)}{2!}h^2 + \dfrac{f'''(x_0)}{3!}h^3 + \cdots$. The coefficient of $h^k$ is $f^{(k)}(x_0)/k!$, chosen so that the polynomial matches $f$ and its first $n$ derivatives at $x_0$.
:::

## The remainder: what stopping costs

Stop after the $h^n$ term. What you left out is the **remainder**, $R_n(h) = f(x_0 + h) - P_n(h)$. It is the truncation error. It has the same form you met last lesson for the tangent line, one degree higher — the **Lagrange form**:

$$
R_n(h) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\,h^{n+1} \quad \text{for some } \xi \text{ between } x_0 \text{ and } x_0 + h.
$$

Read $\xi$ as "ksee" (a Greek x). It is a point somewhere in the step. You do not know exactly where, and you usually do not need to. In words: the error looks like the next term you would have written, except that its derivative is taken at some unknown point inside the step instead of at $x_0$.

::: note Why it has to be true
This is the last lesson's argument, repeated more times. Build a helper function that measures the gap between $f$ and the polynomial, with an extra adjustable piece:

$$
\phi(t) = f(t) - P_n(t - x_0) - K(t - x_0)^{n+1}.
$$

Choose the number $K$ so that $\phi(x) = 0$ at the far end of the step. Because $P_n$ matches $f$ through $n$ derivatives at $x_0$, the helper and its first $n$ derivatives are all zero there: $\phi(x_0) = \phi'(x_0) = \cdots = \phi^{(n)}(x_0) = 0$.

Now use **[[Rolle's theorem|rolle-chain]]** again and again. $\phi$ is zero at $x_0$ and at $x$, so its slope is zero somewhere in between, at a point $\xi_1$. Now $\phi'$ is zero at $x_0$ and at $\xi_1$, so $\phi''$ is zero at some $\xi_2$ between them. Keep going, $n + 1$ times, and you reach a point $\xi$ where $\phi^{(n+1)}(\xi) = 0$.

What is $\phi^{(n+1)}$? The polynomial $P_n$ has degree $n$, so differentiating it $n + 1$ times gives $0$. And $(t - x_0)^{n+1}$ differentiated $n + 1$ times gives $(n+1)!$. So $\phi^{(n+1)}(\xi) = f^{(n+1)}(\xi) - (n+1)!\,K = 0$, which means $K = f^{(n+1)}(\xi)/(n+1)!$. Since $\phi(x) = 0$, the remainder is $R_n = K h^{n+1}$ — the formula above.
:::

There are three ways to use the remainder.

- **As an order.** If $f^{(n+1)}$ stays below some fixed size near $x_0$, then $|R_n| \le C|h|^{n+1}$ for a constant $C$. We write this as $R_n = O(h^{n+1})$, read "[[big-O|big-o]] of h to the n plus one". It means: halve $h$ and the error of a degree-$n$ polynomial is divided by $2^{n+1}$. When numerical analysts say "the method is fourth order", this is the sense they mean.
- **As a bound.** Replace $|f^{(n+1)}(\xi)|$ by $M$, its largest value anywhere on the step. Then $|R_n| \le \dfrac{M}{(n+1)!}|h|^{n+1}$ — a guarantee. For $\sin$ and $\cos$, every derivative is again $\pm\sin$ or $\pm\cos$, which never exceed $1$. So $M = 1$, and a degree-$k$ cut-off always obeys $|R_k| \le \dfrac{|h|^{k+1}}{(k+1)!}$.
- **As an estimate.** Replace $\xi$ by $x_0$. Then $R_n \approx \dfrac{f^{(n+1)}(x_0)}{(n+1)!}h^{n+1}$, which is exactly the first term you left out. When the terms are shrinking, the first one left out is a good estimate of everything left out. When the terms also alternate in sign (plus, minus, plus…) and keep shrinking, it is a true bound.

A truncation error belongs to the *formula*. It would be there even on a perfect computer. It is different from **[[round-off error|round-off]]**, which comes from storing numbers with a limited number of digits. The two pull opposite ways: in a finite difference, a smaller step shrinks truncation error but makes round-off worse.

::: example Third-order sine and cosine at fifteen degrees
Flight software often uses $\sin\theta \approx \theta - \theta^3/6$ and $\cos\theta \approx 1 - \theta^2/2$. How accurate are they at $\theta = 15^\circ = 0.261799\,\mathrm{rad}$? What does the Lagrange bound promise?

**Build both polynomials.** For $\sin$ at $0$, the value and first three derivatives are $\sin 0 = 0$, $\cos 0 = 1$, $-\sin 0 = 0$, $-\cos 0 = -1$. Dividing by $0!, 1!, 2!, 3!$ gives $P_3 = \theta - \theta^3/6$. For $\cos$ they are $1, 0, -1, 0$, so $P_3 = 1 - \theta^2/2$. The cubic coefficient of the cosine is zero.

**Sine.** $\theta^3/6 = 0.002991$, so $P_3 = 0.261799 - 0.002991 = 0.258809$. The true value is $\sin 15^\circ = 0.258819$. The error is $1.02 \times 10^{-5}$. The degree-3 bound is $\theta^4/4! = 1.96 \times 10^{-4}$. That is a valid bound, but about nineteen times too gloomy. Why? The $\theta^4$ coefficient of the sine is zero, so the real leading error is the $\theta^5$ term, $\theta^5/5! = 1.025 \times 10^{-5}$ — almost exactly the error we measured.

**Cosine.** $\theta^2/2 = 0.034270$, so $P_3 = 1 - 0.034270 = 0.965731$, against $\cos 15^\circ = 0.965926$. The error is $1.953 \times 10^{-4}$ and the bound is $\theta^4/4! = 1.957 \times 10^{-4}$. Here the bound is tight, because the first term left out, $\theta^4/24$, really is the leading error.

| $\theta$ | $\sin$ error | $\theta^5/5!$ | $\cos$ error | $\theta^4/4!$ |
| --- | --- | --- | --- | --- |
| $5^\circ$ | $4.2 \times 10^{-8}$ | $4.2 \times 10^{-8}$ | $2.42 \times 10^{-6}$ | $2.42 \times 10^{-6}$ |
| $15^\circ$ | $1.02 \times 10^{-5}$ | $1.03 \times 10^{-5}$ | $1.95 \times 10^{-4}$ | $1.96 \times 10^{-4}$ |
| $30^\circ$ | $3.26 \times 10^{-4}$ | $3.28 \times 10^{-4}$ | $3.10 \times 10^{-3}$ | $3.13 \times 10^{-3}$ |
| $60^\circ$ | $1.02 \times 10^{-2}$ | $1.05 \times 10^{-2}$ | $4.83 \times 10^{-2}$ | $5.01 \times 10^{-2}$ |
| $90^\circ$ | $7.5 \times 10^{-2}$ | $8.0 \times 10^{-2}$ | $2.34 \times 10^{-1}$ | $2.54 \times 10^{-1}$ |

**Sanity check with the orders.** Going from $15^\circ$ to $30^\circ$ doubles $\theta$. The sine error grows by about $32 = 2^5$ and the cosine error by about $16 = 2^4$, exactly the powers the remainder predicts. At $90^\circ$ the cubic cosine is off by nearly a quarter. At $1\,\mathrm{mrad}$ — a typical attitude-error size inside a filter — the errors are $8 \times 10^{-18}$ for the sine and $4 \times 10^{-14}$ for the cosine. That is far below anything an attitude sensor can measure, so filters linearize small attitude errors without worry.
:::

## The standard series

Each of these comes from the derivatives at $0$. Try rebuilding each one.

**Exponential.** Every derivative of $e^x$ is $e^x$, which equals $1$ at $0$. So every coefficient is $1/k!$:

$$
e^x = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots = \sum_{k=0}^{\infty}\frac{x^k}{k!}.
$$

**Sine and cosine.** The derivatives of $\sin$ cycle through $\cos, -\sin, -\cos, \sin$. At the origin that gives $0, 1, 0, -1$, over and over:

$$
\sin x = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \cdots, \qquad \cos x = 1 - \frac{x^2}{2!} + \frac{x^4}{4!} - \cdots.
$$

The sine is an **odd** function (flip the sign of $x$ and the sign of $\sin x$ flips), and its series has only odd powers. The cosine is **even**, with only even powers. Differentiate the sine series term by term and you get the cosine series, as you should.

**Logarithm.** For $f(x) = \ln(1 + x)$ ("natural log of one plus x"): $f' = (1 + x)^{-1}$, $f'' = -(1 + x)^{-2}$, $f''' = 2(1 + x)^{-3}$. Each new derivative brings down one more factor and flips the sign, so $f^{(k)}(0) = (-1)^{k-1}(k - 1)!$. Dividing by $k!$ leaves $1/k$, with alternating signs:

$$
\ln(1 + x) = x - \frac{x^2}{2} + \frac{x^3}{3} - \frac{x^4}{4} + \cdots, \qquad -1 < x \le 1.
$$

**Geometric series.** Multiply out $(1 - x)(1 + x + x^2 + \cdots + x^n)$. Almost everything cancels in pairs, leaving $1 - x^{n+1}$. When $|x| < 1$, the leftover $x^{n+1}$ fades to zero as $n$ grows, so

$$
\frac{1}{1 - x} = 1 + x + x^2 + x^3 + \cdots, \qquad |x| < 1.
$$

The derivative recipe agrees ($f^{(k)}(0) = k!$, so every coefficient is $1$). This is the one series whose remainder you can write exactly: after the $x^n$ term it is $x^{n+1}/(1 - x)$.

**Binomial.** For $f(x) = (1 + x)^\alpha$, with $\alpha$ ("alpha") any real number, $f^{(k)}(0) = \alpha(\alpha - 1)\cdots(\alpha - k + 1)$:

$$
(1 + x)^\alpha = 1 + \alpha x + \frac{\alpha(\alpha - 1)}{2!}x^2 + \frac{\alpha(\alpha-1)(\alpha-2)}{3!}x^3 + \cdots, \qquad |x| < 1.
$$

Three cases to try:

- $\alpha = \tfrac12$ gives $\sqrt{1 + x} = 1 + \tfrac12 x - \tfrac18 x^2 + \tfrac1{16}x^3 - \cdots$. At $x = 0.1$, three terms give $1 + 0.05 - 0.00125 = 1.04875$, against $\sqrt{1.1} = 1.048809$.
- $\alpha = -1$ gives back the geometric series, with $-x$ in place of $x$.
- $\alpha = -2$ gives $(1 + x)^{-2} = 1 - 2x + 3x^2 - \cdots$. With $x = h/R_E$ (altitude over Earth's radius), that is the inverse-square gravity rule of the last lesson carried one term further: $g(h) = g(0)\left(1 - 2h/R_E + 3h^2/R_E^2 - \cdots\right)$.

**When does a series work?** The exponential, sine and cosine series **converge** — settle down to the right answer — for every real $x$, because $k!$ eventually beats $|x|^k$. The logarithm, geometric and binomial series converge only for $|x| < 1$ (the logarithm also at $x = 1$). All three have trouble at $x = -1$: the logarithm and the geometric series blow up there. The distance from $x_0$ to the nearest such trouble spot is the **[[radius of convergence|radius-of-convergence]]**. Outside it, adding more terms makes the answer *worse*. A series is a tool for the neighborhood of $x_0$. The remainder formula holds for any $n$ either way, so it is the honest measure of a cut-off at a given $h$.

::: example How many terms for the exponential
The **state transition matrix** of a linear system — the matrix that carries a filter's state from one time step to the next — is $\boldsymbol{\Phi} = e^{\mathbf{F}h}$, and it is often computed from the exponential series. The plain-number version asks: how many terms does $e^x$ need? Compute $e^{0.5}$ with an error below $10^{-6}$.

**The bound.** After degree $n$, the remainder is $R_n = \dfrac{e^\xi}{(n+1)!}(0.5)^{n+1}$ with $0 < \xi < 0.5$. The largest $e^\xi$ can be on that step is $e^{0.5}$, so $|R_n| \le \dfrac{e^{0.5}\,(0.5)^{n+1}}{(n+1)!}$.

**The partial sums.** Add up $S_n = \sum_{k=0}^n 0.5^k/k!$ and compare with $e^{0.5} = 1.6487213$:

| $n$ | $S_n$ | Actual error | Bound |
| --- | --- | --- | --- |
| 3 | $1.6458333$ | $2.9 \times 10^{-3}$ | $4.3 \times 10^{-3}$ |
| 5 | $1.6486979$ | $2.3 \times 10^{-5}$ | $3.6 \times 10^{-5}$ |
| 6 | $1.6487196$ | $1.7 \times 10^{-6}$ | $2.6 \times 10^{-6}$ |
| 7 | $1.6487212$ | $1.0 \times 10^{-7}$ | $1.6 \times 10^{-7}$ |

**Read it.** Degree $7$ — eight terms — is the first to get below $10^{-6}$, and the bound predicted that without knowing the answer. Each extra term multiplies the bound by $0.5/(n+2)$, so the series speeds up as it goes.

**When it goes badly.** For $x = 5$ the series needs about twenty terms. For $x = -5$ it is worse: terms as big as $26$ must cancel down to $0.0067$, and digits are lost. Software instead uses $e^x = (e^{x/2^s})^{2^s}$: shrink the argument until a short series is enough, then square the result $s$ times. That trick, **[[scaling and squaring|scaling-squaring]]**, is how the numerical-methods module will compute the matrix exponential.
:::

## Truncation error in finite differences

Lesson 2 measured two numerical derivatives and saw that one error shrank like $h$ and the other like $h^2$. Now you can see why. Expand $f$ about $x$ one step forward and one step back:

$$
f(x + h) = f(x) + f'(x)h + \frac{f''(x)}{2}h^2 + \frac{f'''(x)}{6}h^3 + O(h^4),
$$

$$
f(x - h) = f(x) - f'(x)h + \frac{f''(x)}{2}h^2 - \frac{f'''(x)}{6}h^3 + O(h^4).
$$

The second line is the first with $h$ replaced by $-h$, so the odd powers flip sign.

**Forward difference.** Take the first line, subtract $f(x)$, and divide by $h$:

$$
\frac{f(x + h) - f(x)}{h} = f'(x) + \frac{f''(x)}{2}h + \frac{f'''(x)}{6}h^2 + \cdots
$$

The error is $\tfrac12 f''(x)h$ plus smaller pieces: first order in $h$, with the constant $\tfrac12|f''|$ promised in lesson 2.

**Central difference.** Subtract the second line from the first. The terms with even powers are the same in both lines, so they cancel — $f(x)$, the $h^2$ terms, all of them. Only odd powers survive. Divide by $2h$:

$$
\frac{f(x + h) - f(x - h)}{2h} = f'(x) + \frac{f'''(x)}{6}h^2 + O(h^4).
$$

That is second order, with constant $\tfrac16|f'''|$. The central difference gains an order for free, because of symmetry. The same trick — placing your evaluations so that unwanted Taylor terms cancel — is the design idea behind every higher-order integrator.

::: example Predicting the finite-difference errors
For $f = \sin$ at $x = 1$ with $h = 0.1$, lesson 2 measured a forward-difference error of $-4.29 \times 10^{-2}$ and a central-difference error of $-9.00 \times 10^{-4}$. Check these against the Taylor prediction. (Here $f'' = -\sin$ and $f''' = -\cos$.)

**Forward.** The leading term is $\tfrac12 f''(1)\,h = \tfrac12(-\sin 1)(0.1) = -0.04207$. Add the next term, $\tfrac16 f'''(1)h^2 = \tfrac16(-\cos 1)(0.01) = -0.00090$, and you get $-0.04297$. The measured value is $-0.04294$. The leftover $3 \times 10^{-5}$ is the $h^3$ term, $\tfrac{1}{24}\sin 1\,(0.001) = 3.5 \times 10^{-5}$.

**Central.** $\tfrac16 f'''(1)h^2 = \tfrac16(-0.5403)(0.01) = -9.005 \times 10^{-4}$, against the measured $-9.0005 \times 10^{-4}$. The prediction is right to four digits. What is left is the $O(h^4)$ term.

**Sanity check.** Both errors are negative, matching lesson 2's picture: the sine curves downward near $x = 1$. If you *add* the two expansions instead of subtracting them, you get a formula for the second derivative, which one of the check questions asks you to derive.
:::

## Truncation error in a time step

A spacecraft's state obeys a rule like $\dot x = f(x, t)$: "the rate of change of the state is some known function of the state and the time". Its true path $x(t)$ has a Taylor expansion over a time step $h$:

$$
x(t + h) = x(t) + \dot x(t)\,h + \frac{\ddot x(t)}{2}h^2 + \frac{\dddot x(t)}{6}h^3 + \cdots
$$

(Each dot is one time derivative; $\dddot x$ is "x triple-dot".)

**Euler's method** keeps the first two terms: $x_{k+1} = x_k + h f(x_k, t_k)$. It walks along the tangent line for one step. So on each step it makes a **local truncation error** of $\tfrac12\ddot x(\xi)h^2$, which is $O(h^2)$.

To cover a fixed stretch of time $T$ takes $N = T/h$ steps. The errors pile up — roughly $N$ of them, each $O(h^2)$ — into a **global truncation error** of $N \cdot O(h^2) = O(h)$. One power of $h$ is lost, because a smaller step means more steps. The general rule, which the numerical-methods module states as a flashcard: a method whose local error is $O(h^{p+1})$ has global error $O(h^p)$ and is called a method of **order** $p$.

Euler is order $1$. The classical **[[Runge–Kutta method|runge-kutta]]** evaluates $f$ four times per step, arranged so the result matches the Taylor expansion of $x(t + h)$ through the $h^4$ term. Its local error is $O(h^5)$, its global error is $O(h^4)$, and halving the step divides the global error by sixteen.

::: example One Euler step against the series
Take a spring-like oscillator whose position is $x(t) = \cos t$ and whose velocity is $v = \dot x = -\sin t$. Step it from $t = 0$ with Euler's method, treating position and velocity as the pair $\dot x = v$, $\dot v = -x$.

**One step.** At $t = 0$: $x_0 = 1$ and $v_0 = 0$. Euler gives $x_1 = x_0 + h v_0 = 1 + h \cdot 0 = 1$, for any $h$. The truth is $\cos h$. So the local error is $1 - \cos h$. The Taylor prediction is $\tfrac12|\ddot x|h^2 = \tfrac12 h^2$, since $\ddot x(0) = -\cos 0 = -1$. [[The picture|euler-gap]] shows the gap.

| $h$ | Euler $x_1$ | Exact $\cos h$ | Error | $h^2/2$ |
| --- | --- | --- | --- | --- |
| $0.1$ | $1$ | $0.995004$ | $5.00 \times 10^{-3}$ | $5.00 \times 10^{-3}$ |
| $0.05$ | $1$ | $0.998750$ | $1.25 \times 10^{-3}$ | $1.25 \times 10^{-3}$ |

**Check the order.** Halving $h$ divides the local error by four, as $O(h^2)$ says. The constant $\tfrac12\ddot x$ is right to three digits; the tiny difference is the $h^4/24$ term of the cosine series.

**Over a whole swing.** One full period takes $2\pi/h$ steps — $63$ steps at $h = 0.1$. Euler's small errors compound, and after one period the swing has grown by $37\%$. That is why nobody propagates an orbit with Euler's method.
:::

## The second-order term in a filter

Suppose you do not know $x$ exactly. You know its average, $\hat x$ ("x hat", the estimate), and its **variance** $\sigma^2$ ("sigma squared"), which measures how spread out it is. You need the average of $y = f(x)$. Is it $f(\hat x)$?

Not quite. Expand $f$ about $\hat x$ and average each term. The first-order term $f'(\hat x)(x - \hat x)$ averages to zero, because $x$ lands above and below $\hat x$ equally. The second-order term does not average to zero, because $(x - \hat x)^2$ is never negative — and its average is exactly the variance. So, writing $\mathbb{E}[\cdot]$ ("the expected value of") for the average,

$$
\mathbb{E}[f(x)] \approx f(\hat x) + \frac{f''(\hat x)}{2}\,\sigma^2.
$$

A curved function **biases** an average — shifts it — by half the curvature times the variance. You can see [[why a curve shifts the average|curved-average]] in a picture.

An Extended Kalman Filter uses $f(\hat x)$ as its predicted average, so it drops this term. Take gravity $g(h) = \mu/(R_E + h)^2$ at $400\,\mathrm{km}$ altitude, with an altitude uncertainty of $50\,\mathrm{km}$. Its curvature is $g'' = 1.14 \times 10^{-12}\,\mathrm{s^{-2}m^{-1}}$, so the missing bias is $\tfrac12 g''\sigma^2 = \tfrac12(1.14 \times 10^{-12})(5 \times 10^4)^2 = 1.4 \times 10^{-3}\,\mathrm{m/s^2}$. That is small next to $g = 8.69\,\mathrm{m/s^2}$, but it is not zero, and it builds up over time. Second-order and **[[sigma-point filters|sigma-point]]** exist to keep this term. For a quadratic $f$ the formula is exact, since $f''' = 0$; a check question below uses that.

::: warning Take the worst derivative on the whole step
The Lagrange bound uses the largest $|f^{(n+1)}|$ anywhere between $x_0$ and $x_0 + h$ — not its value at $x_0$. For $e^x$ on $[0, 0.5]$ that meant $e^{0.5}$, not $e^0 = 1$. Skip this and you get a "bound" the true error can break. And the other way round: the first-left-out-term *estimate* uses $f^{(n+1)}(x_0)$, and it is not a bound at all unless the series alternates with shrinking terms.
:::

::: warning A zero coefficient does not mean zero error
Cutting $\sin\theta$ off after $\theta^3$ has the "degree-3 bound" $\theta^4/24$. But the $\theta^4$ coefficient is zero, and the real error is about $\theta^5/120$. For an estimate, find the *first non-zero* term you left out. And remember that the bound $|h|^{k+1}/(k+1)!$ for $\sin$ and $\cos$ is always safe, but it can be loose by a large factor.
:::

::: note The series for sin θ / θ
Lesson 1 needed $\sin\theta/\theta$ at $\theta = 0$, where the formula divides zero by zero. Now it is one line: divide the sine series by $\theta$ to get $1 - \theta^2/6 + \theta^4/120 - \cdots$, which is plainly $1$ at $\theta = 0$. At $\theta = 0.5$, two terms give $0.95833$ and three give $0.958854$, against the true $0.958851$. Software that turns a rotation vector into a quaternion takes exactly this branch for small angles, because dividing a tiny $\sin\theta$ by a tiny $\theta$ directly would lose digits.
:::

## Check yourself

::: check
Write the Taylor expansion of $f(x_0 + h)$ through the $h^3$ term, together with its Lagrange remainder. State the order of the truncation error.
:::

::: answer
$$
f(x_0 + h) = f(x_0) + f'(x_0)h + \frac{f''(x_0)}{2!}h^2 + \frac{f'''(x_0)}{3!}h^3 + \frac{f^{(4)}(\xi)}{4!}h^4
$$

for some $\xi$ between $x_0$ and $x_0 + h$. The truncation error after the cubic term is $O(h^4)$: halving $h$ divides it by $2^4 = 16$. Its size is at most $\dfrac{M}{24}|h|^4$, where $M$ is the largest value of $|f^{(4)}|$ on the step.
:::

::: check
Estimate $\ln 1.1$ from four terms of the logarithm series. Bound the error using the alternating-series property, and compare with the exact value $0.0953102$.
:::

::: answer
Use $\ln(1 + x) = x - \dfrac{x^2}{2} + \dfrac{x^3}{3} - \dfrac{x^4}{4} + \cdots$ with $x = 0.1$:

$$
0.1 - 0.005 + 0.000333 - 0.000025 = 0.0953083.
$$

The terms alternate in sign and keep shrinking, so the error is at most the first term left out, $0.1^5/5 = 2.0 \times 10^{-6}$. The exact value minus the estimate is $1.85 \times 10^{-6}$. That is inside the bound, and it is positive, as the left-out term ($+x^5/5$) predicts.
:::

::: check
Up to what power must the sine series be kept so that the truncation error is below $10^{-9}$ for every $|\theta| \le \pi/4$?
:::

::: answer
The sine series has only odd powers. So if the first term you leave out is $\theta^m$, the even power right before it has a zero coefficient, and the Lagrange bound is $|\theta|^m/m!$.

Check the worst case, $\theta = \pi/4 = 0.7854$:

- Keep through $\theta^9$, leaving out $\theta^{11}$ onward: $0.7854^{11}/11! = 1.8 \times 10^{-9}$. Not enough.
- Keep through $\theta^{11}$, leaving out $\theta^{13}$ onward: $0.7854^{13}/13! = 6.9 \times 10^{-12}$. Enough.

So keep terms through $\theta^{11}$ — six terms ($\theta, \theta^3, \ldots, \theta^{11}$). Library sine routines work along these lines: first shift the angle into the range $|\theta| \le \pi/4$, then use a short series.
:::

::: check
Derive the central-difference formula for the second derivative,

$$
f''(x) \approx \frac{f(x + h) - 2f(x) + f(x - h)}{h^2},
$$

find its leading truncation error, and check it for $\sin$ at $x = 1$, $h = 0.1$.
:::

::: answer
Add the forward and backward expansions. The odd powers cancel this time:

$$
f(x + h) + f(x - h) = 2f(x) + f''(x)h^2 + \frac{f^{(4)}(x)}{12}h^4 + O(h^6).
$$

(The $h^4$ coefficient is $2 \times \tfrac{1}{24} = \tfrac{1}{12}$.) Subtract $2f(x)$ and divide by $h^2$:

$$
\frac{f(x+h) - 2f(x) + f(x-h)}{h^2} = f''(x) + \frac{f^{(4)}(x)}{12}h^2 + O(h^4).
$$

It is second order, with constant $\tfrac{1}{12}|f^{(4)}|$. For $\sin$ at $1$, the formula gives $-0.840770$ against the true $-\sin 1 = -0.841471$, an error of $7.01 \times 10^{-4}$. The prediction, with $f^{(4)} = \sin$, is $\tfrac{1}{12}\sin 1\,(0.01) = 7.01 \times 10^{-4}$. They agree.
:::

::: check
A quantity $x$ has average $\hat x$ and variance $\sigma^2$. Show by Taylor expansion that $\mathbb{E}[x^2] = \hat x^2 + \sigma^2$ exactly. What does that mean for a filter that squares an estimate?
:::

::: answer
Expand $f(x) = x^2$ about $\hat x$. The pieces are $f(\hat x) = \hat x^2$, $f' = 2\hat x$, $f'' = 2$, and every higher derivative is zero. So the expansion stops with no remainder:

$$
x^2 = \hat x^2 + 2\hat x(x - \hat x) + (x - \hat x)^2.
$$

Take averages. The middle term averages to zero, and the last averages to $\sigma^2$. So $\mathbb{E}[x^2] = \hat x^2 + \sigma^2$ — the $\tfrac12 f''\sigma^2$ term with $f'' = 2$.

Squaring an estimate that is right on average gives a result that is too big on average, by the variance. A squared range or an energy computed from a noisy estimate carries this bias unless you subtract it.
:::

::: check
An integrator has local truncation error $O(h^5)$. If you halve the step, by what factor do the local and global errors fall? What is the method's order?
:::

::: answer
The local error scales as $h^5$, so halving $h$ divides it by $2^5 = 32$. The global error is one power lower, $O(h^4)$, because you now take twice as many steps. It falls by $2^4 = 16$. The method is of order $4$.

This is the signature of classical Runge–Kutta. Halving the step and seeing the error fall by $16$ is the standard test that such an integrator is coded correctly.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Taylor polynomial | $P_n(h) = \sum_{k=0}^{n} \dfrac{f^{(k)}(x_0)}{k!}h^k$, matching $f$ through $n$ derivatives |
| Lagrange remainder | $R_n = \dfrac{f^{(n+1)}(\xi)}{(n+1)!}h^{n+1} = O(h^{n+1})$ |
| Bound for $\sin, \cos$ | Degree-$k$ cut-off: $\lvert R_k\rvert \le \dfrac{\lvert\theta\rvert^{k+1}}{(k+1)!}$ |
| $e^x$ | $\sum x^k/k!$, all $x$ |
| $\sin x$, $\cos x$ | $x - x^3/3! + x^5/5! - \cdots$; $1 - x^2/2! + x^4/4! - \cdots$, all $x$ |
| $\ln(1 + x)$ | $x - x^2/2 + x^3/3 - \cdots$, $-1 < x \le 1$ |
| $1/(1 - x)$, $(1 + x)^\alpha$ | $1 + x + x^2 + \cdots$; $1 + \alpha x + \frac{\alpha(\alpha-1)}{2}x^2 + \cdots$, $\lvert x\rvert < 1$ |
| Forward / central difference | Error $\tfrac12 f'' h$ / $\tfrac16 f''' h^2$ |
| Second difference | $\dfrac{f(x+h) - 2f(x) + f(x-h)}{h^2} = f'' + \tfrac{1}{12}f^{(4)}h^2$ |
| Local vs global error | Local $O(h^{p+1})$ $\Rightarrow$ global $O(h^p)$, order $p$; Euler $p = 1$, RK4 $p = 4$ |
| Average through a curve | $\mathbb{E}[f(x)] \approx f(\hat x) + \tfrac12 f''(\hat x)\sigma^2$ |

That completes differentiation, from the limit definition all the way to the full expansion and its error. The next lesson runs the other way. It adds things up instead of breaking them apart: the definite integral, and the theorem that says integration undoes differentiation.

::: context taylor-name Taylor and Maclaurin
The English mathematician Brook Taylor published the general series in 1715. The Scottish mathematician Colin Maclaurin used the special case about $x_0 = 0$ heavily in his 1742 *Treatise of Fluxions*, which is why that case carries his name. Neither man invented the idea from nothing: series for sine, cosine and arctangent had been found earlier, including by mathematicians in Kerala, India, centuries before. The names are labels, not a full history.
:::

::: context factorial Why the exclamation mark
$k!$ means $k \times (k - 1) \times \cdots \times 2 \times 1$. It counts the ways to line up $k$ different things: three books can stand on a shelf in $3! = 6$ orders. It grows astonishingly fast — $10! = 3\,628\,800$ and $20!$ is about $2.4 \times 10^{18}$. That fast growth is why the terms $x^k/k!$ of the exponential series eventually shrink toward zero for any $x$ at all, no matter how big. And $0! = 1$: there is exactly one way to line up nothing, and it keeps formulas like $c_0 = f(x_0)/0!$ tidy.
:::

::: context sine-taylor-picture The polynomials hug the sine curve
The dark curve is $\sin x$. The red line is the degree-1 polynomial $x$; the blue curve adds $-x^3/6$; the orange curve adds $+x^5/120$. Each one hugs the sine for longer before peeling away. The degree-5 curve stays close almost to $x = 2$, then drifts off too.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="95" x2="340" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="15" x2="40" y2="175" stroke="#6c7a93" stroke-width="1"/>
  <line x1="36" y1="41.7" x2="44" y2="41.7" stroke="#6c7a93" stroke-width="1"/>
  <line x1="36" y1="148.3" x2="44" y2="148.3" stroke="#6c7a93" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="122.9" y="108">1</text><text x="205.7" y="108">2</text><text x="288.6" y="108">3</text>
  </g>
  <text x="32" y="45" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="32" y="152" font-size="11" fill="#1f2a44" text-anchor="end">−1</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,95.0 73.8,73.2 107.7,51.4 141.5,29.7 160.8,17.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,95.0 59.3,82.7 78.7,71.0 98.0,60.7 117.3,52.4 136.7,46.9 156.0,44.7 175.3,46.6 194.7,53.3 214.0,65.3 233.3,83.5 252.7,108.4 272.0,140.8 286.5,170.4"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="3" points="40.0,95.0 59.3,82.7 78.7,71.0 98.0,60.6 117.3,52.1 136.7,45.9 156.0,42.3 175.3,41.5 194.7,43.2 214.0,47.2 233.3,52.7 252.7,58.9 272.0,64.3 291.3,67.2 310.7,65.3 330.0,56.0"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="40.0,95.0 59.3,82.7 78.7,71.0 98.0,60.6 117.3,52.1 136.7,46.0 156.0,42.4 175.3,41.8 194.7,44.0 214.0,49.0 233.3,56.4 252.7,66.0 272.0,77.1 291.3,89.2 310.7,101.7 330.0,113.7"/>
  <text x="166" y="22" font-size="12" fill="#b4232c">x</text>
  <text x="190" y="165" font-size="12" fill="#1d6fd1">x − x³/6</text>
  <text x="250" y="36" font-size="12" fill="#f2b880">+ x⁵/120</text>
  <text x="300" y="128" font-size="12" fill="#1f2a44">sin x</text>
</svg>
```
:::

::: context rolle-chain Rolle's theorem, used in a chain
Rolle's theorem, proved in the maxima and minima lesson, says: if a smooth function has the same value at two points, its slope is zero somewhere between them. Think of a ball thrown up that comes back to the same height — at the top of its flight it was moving neither up nor down. The Taylor proof uses this as a ladder. Each rung gives a new zero of the next derivative, squeezed between the old zero and $x_0$, until after $n + 1$ rungs you reach the point $\xi$.
:::

::: context big-o Reading big-O
$O(h^{n+1})$ is shorthand for "some amount no bigger than a fixed number times $|h|^{n+1}$, when $h$ is small". It hides the constant and keeps the power. The power is what tells you how fast the error falls as you shrink the step. So $O(h^2)$ and $O(h^4)$ can be the same size at one particular $h$, but halve the step and the first falls by $4$ while the second falls by $16$. The letter O stands for "order".
:::

::: context round-off Round-off: the other error
A computer stores a number with a fixed number of digits. Standard double precision keeps about $16$ significant decimal digits, so $1 + 10^{-17}$ is stored as exactly $1$. When you subtract two nearly equal numbers — as in $f(x + h) - f(x)$ for tiny $h$ — the matching leading digits cancel, and the rounding noise in the last few digits becomes a large part of what is left. That is round-off error. Unlike truncation error, it grows as $h$ shrinks.
:::

::: context radius-of-convergence Why a series can stop working
Plug $x = 2$ into $1 + x + x^2 + \cdots$ and the sum runs away — $1 + 2 + 4 + 8 + \cdots$ — even though $1/(1 - x) = -1$ is a perfectly good number there. The series was built from information at $x = 0$, and it cannot see past the blow-up at $x = 1$. The distance from the expansion point to the nearest point where the function misbehaves is the radius of convergence; for this series, and for $\ln(1 + x)$, it is $1$. Inside that distance, more terms help. Outside it, more terms make things worse.
:::

::: context scaling-squaring Halve, then square
Scaling and squaring rests on one fact: $e^{x} = \left(e^{x/2}\right)^2$. Halve the argument $s$ times, until it is small enough that a few series terms are extremely accurate. Then square the result $s$ times to undo the halving. For $e^5$ with $s = 4$, you compute $e^{0.3125}$ from a short series and square it four times. For a matrix $e^{\mathbf{F}h}$, each squaring is one matrix multiplication. Scientific software computes the matrix exponential with this same halve-then-square idea, usually paired with a fraction-shaped approximation in place of the plain series.
:::

::: context runge-kutta Where Runge–Kutta comes from
The German mathematicians Carl Runge (1895) and Martin Wilhelm Kutta (1901) worked out how to take a few carefully placed slope samples inside one step and blend them so the result matches the Taylor series to high order — without ever computing a second or third derivative. The fourth-order version, "RK4", became the workhorse of engineering simulation. Orbit propagators today often use higher-order members of the same family that also estimate their own error and adjust the step size.
:::

::: context euler-gap The gap after one Euler step
Euler's method walks along the tangent line. Starting at the top of the cosine curve, the tangent is flat, so after a step $h$ Euler still says $x = 1$. The true curve has dropped by $1 - \cos h$, close to $h^2/2$. The step here is exaggerated to $h = 0.6$ so the gap is visible: $1 - \cos 0.6 = 0.175$, and $h^2/2 = 0.18$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="330" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="20" x2="50" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,42.9 63.0,43.1 76.0,44.0 89.0,45.4 102.0,47.4 115.0,50.0 128.0,53.1 141.0,56.7 154.0,60.9 167.0,65.6 180.0,70.8 193.0,76.6 206.0,82.8 219.0,89.5 232.0,96.6 245.0,104.2 258.0,112.2 271.0,120.6 284.0,129.3 297.0,138.5 310.0,147.9"/>
  <line x1="50" y1="42.9" x2="240" y2="42.9" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="50" cy="42.9" r="4" fill="#1f2a44"/>
  <circle cx="206" cy="42.9" r="4" fill="#b4232c"/>
  <circle cx="206" cy="82.8" r="4" fill="#1d6fd1"/>
  <line x1="206" y1="46" x2="206" y2="79" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="206" y1="180" x2="206" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="206" y="195" font-size="11" fill="#1f2a44" text-anchor="middle">t = h</text>
  <text x="50" y="195" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="212" y="66" font-size="12" fill="#1f2a44">error ≈ h²/2</text>
  <text x="150" y="34" font-size="12" fill="#b4232c">Euler: stays at 1</text>
  <text x="250" y="140" font-size="12" fill="#1d6fd1">true: cos t</text>
</svg>
```
:::

::: context curved-average Why a curve shifts the average
Take $f(x) = x^2$, an average $\hat x = 1$, and let $x$ be equally likely to land at $0.4$ or $1.6$ — a spread with $\sigma = 0.6$. The outputs are $0.16$ and $2.56$, whose average is $1.36$. But $f(\hat x) = 1$. The curve bends upward, so the high side gains more than the low side loses. The shift, $0.36$, is exactly $\tfrac12 f''\sigma^2 = \tfrac12 \cdot 2 \cdot 0.36$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 212" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="190" x2="260" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,190.0 60.0,189.4 70.0,187.7 80.0,184.9 90.0,180.9 100.0,175.8 110.0,169.6 120.0,162.2 130.0,153.7 140.0,144.1 150.0,133.3 160.0,121.4 170.0,108.4 180.0,94.2 190.0,78.9 200.0,62.5 210.0,44.9 220.0,26.2"/>
  <line x1="90" y1="180.9" x2="210" y2="44.9" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="90" cy="180.9" r="4" fill="#1f2a44"/>
  <circle cx="210" cy="44.9" r="4" fill="#1f2a44"/>
  <circle cx="150" cy="133.3" r="4.5" fill="#1d6fd1"/>
  <circle cx="150" cy="112.9" r="4.5" fill="#b4232c"/>
  <line x1="150" y1="190" x2="150" y2="137" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="90" y="204" font-size="11" fill="#1f2a44" text-anchor="middle">0.4</text>
  <text x="150" y="204" font-size="11" fill="#1f2a44" text-anchor="middle">x̂ = 1</text>
  <text x="210" y="204" font-size="11" fill="#1f2a44" text-anchor="middle">1.6</text>
  <text x="232" y="110" font-size="12" fill="#b4232c">average of f = 1.36</text>
  <text x="232" y="138" font-size="12" fill="#1d6fd1">f(x̂) = 1</text>
  <text x="230" y="30" font-size="12" fill="#1f2a44">f(x) = x²</text>
</svg>
```
:::

::: context sigma-point Filters that keep the curve
A sigma-point filter — the unscented Kalman filter is the best known — does not expand $f$ at all. It picks a handful of sample points spread around the estimate by the right amount, pushes each one through the full nonlinear $f$, and averages the results. The picture of the curved average is exactly what it does, and so it captures the $\tfrac12 f''\sigma^2$ shift automatically. You will build both the extended and the unscented filters in the estimation modules and see where each one earns its keep.
:::
