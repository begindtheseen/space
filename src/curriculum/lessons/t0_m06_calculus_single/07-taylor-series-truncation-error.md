---
id: l07-taylor-series-truncation-error
title: Taylor series and truncation error
minutes: 26
covers:
  - Taylor series and truncation error
---

The previous lesson replaced a function by its tangent line and found the error was proportional to $h^2$. The tangent line is the first stop on a road that continues: add a quadratic term and the error drops to $h^3$, add a cubic and it drops to $h^4$, and so on. The polynomial you build this way is the **Taylor polynomial**, its infinite continuation is the **Taylor series**, and what you leave off when you stop is the **truncation error**. The name is exact. You truncate the series, and the leading term you discarded tells you what it cost.

For a GNC engineer this is not one topic among many; it is the bookkeeping behind every numerical method you will use. A Runge–Kutta integrator is a scheme for matching as many Taylor terms of the true trajectory as possible per function evaluation, and its "order" is the power of the step size in its truncation error. A finite-difference Jacobian's accuracy is a Taylor remainder. The sine and cosine your flight software calls are truncated series. The state transition matrix of a Kalman filter is a truncated series for a matrix exponential. And the "second-order effects" that bias an Extended Kalman Filter are, literally, the second term of the expansion this lesson writes down. Learn the notation here — $h$ for the step, $O(h^{n+1})$ for the remainder, $\xi$ for the unknown intermediate point — and the later modules will read as applications rather than new material.

## Matching derivatives: the Taylor polynomial

Fix a point $x_0$ and a displacement $h$, so the point of interest is $x = x_0 + h$. The linearisation $f(x_0) + f'(x_0)h$ is the unique polynomial of degree one that agrees with $f$ in value and first derivative at $x_0$. Ask for more: which polynomial of degree $n$ agrees with $f$ in value and in the first $n$ derivatives at $x_0$?

Write the candidate in powers of $h$: $P_n(h) = c_0 + c_1 h + c_2 h^2 + \cdots + c_n h^n$. Its $k$-th derivative with respect to $h$, evaluated at $h = 0$, picks out the single term $c_k h^k$ and differentiates it $k$ times: $\dfrac{d^k}{dh^k}(c_k h^k) = k!\,c_k$, while every lower power has been differentiated to zero and every higher power still carries a factor of $h$. So $P_n^{(k)}(0) = k!\,c_k$, and matching $P_n^{(k)}(0) = f^{(k)}(x_0)$ forces

$$
c_k = \frac{f^{(k)}(x_0)}{k!}.
$$

The Taylor polynomial of degree $n$ about $x_0$ is therefore

$$
P_n(h) = f(x_0) + f'(x_0)\,h + \frac{f''(x_0)}{2!}\,h^2 + \frac{f'''(x_0)}{3!}\,h^3 + \cdots + \frac{f^{(n)}(x_0)}{n!}\,h^n = \sum_{k=0}^{n} \frac{f^{(k)}(x_0)}{k!}\,h^k.
$$

With $n = 1$ it is the linearisation; with $n = 0$ it is the constant $f(x_0)$. Letting $n \to \infty$ gives the **Taylor series** of $f$ about $x_0$, and when $x_0 = 0$ the series is often called a **Maclaurin series**. The factorials are not decoration: they are what makes $k$-fold differentiation of $h^k$ return exactly $f^{(k)}(x_0)$, and they are also what makes the series converge, since $k!$ eventually outgrows any power.

::: key
Taylor expansion of $f$ about $x_0$: $f(x_0 + h) = f(x_0) + f'(x_0)h + \dfrac{f''(x_0)}{2!}h^2 + \dfrac{f'''(x_0)}{3!}h^3 + \cdots$. The coefficient of $h^k$ is $f^{(k)}(x_0)/k!$, chosen so that the polynomial matches $f$ and its first $n$ derivatives at $x_0$.
:::

## The remainder, and what truncation costs

Stop after the $h^n$ term. The **remainder** $R_n(h) = f(x_0 + h) - P_n(h)$ is the truncation error, and it has the same Lagrange form as before, one degree higher:

$$
R_n(h) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\,h^{n+1} \quad \text{for some } \xi \text{ between } x_0 \text{ and } x_0 + h.
$$

The proof is the previous lesson's argument repeated. Define $\phi(t) = f(t) - P_n(t - x_0) - K(t - x_0)^{n+1}$ for $t$ between $x_0$ and $x$, with $K$ chosen so $\phi(x) = 0$. Because $P_n$ matches $f$ through $n$ derivatives, $\phi(x_0) = \phi'(x_0) = \cdots = \phi^{(n)}(x_0) = 0$. Rolle's theorem on $\phi$ gives $\xi_1$ with $\phi'(\xi_1) = 0$; since $\phi'(x_0) = 0$ too, Rolle on $\phi'$ gives $\xi_2$ with $\phi''(\xi_2) = 0$; and so on, $n + 1$ times, until $\phi^{(n+1)}(\xi) = 0$ for some $\xi$ strictly between $x_0$ and $x$. But $P_n$ has degree $n$, so its $(n+1)$-th derivative is zero, and $\dfrac{d^{n+1}}{dt^{n+1}}(t - x_0)^{n+1} = (n+1)!$. Hence $f^{(n+1)}(\xi) = (n+1)!\,K$, and $R_n = K h^{n+1}$ is the formula above.

How to use it:

- **As an order statement.** If $f^{(n+1)}$ is bounded near $x_0$, then $|R_n| \le C|h|^{n+1}$: the truncation error is $O(h^{n+1})$. Halving $h$ divides the error of a degree-$n$ polynomial by $2^{n+1}$. This is the sense in which "the method is fourth order" is used throughout numerical analysis.
- **As a bound.** Replace $|f^{(n+1)}(\xi)|$ by its maximum $M$ on the interval: $|R_n| \le \dfrac{M}{(n+1)!}|h|^{n+1}$. For $\sin$ and $\cos$ every derivative is again $\pm\sin$ or $\pm\cos$, so $M = 1$ always and a degree-$k$ truncation obeys $|R_k| \le \dfrac{|h|^{k+1}}{(k+1)!}$ with no further thought.
- **As an estimate.** Replace $\xi$ by $x_0$: $R_n \approx \dfrac{f^{(n+1)}(x_0)}{(n+1)!}h^{n+1}$, which is exactly the first term you omitted. When consecutive terms shrink, the first omitted term is a good estimate of the whole tail, and when the terms alternate in sign and decrease in magnitude it is a rigorous bound.

A truncation error is a property of the *formula*: it would be there with exact arithmetic. It is distinct from **round-off error**, which comes from finite-precision numbers and grows as $h$ shrinks in a finite difference. The two pull in opposite directions, and the numerical-methods module finds the step size where their sum is least.

::: example Third-order sine and cosine at fifteen degrees
Flight software frequently uses $\sin\theta \approx \theta - \theta^3/6$ and $\cos\theta \approx 1 - \theta^2/2$. How accurate are they at $\theta = 15^\circ = 0.261799\,\mathrm{rad}$, and what does the Lagrange bound say?

Both come from the derivatives at $0$. For $\sin$: $\sin 0 = 0$, $\cos 0 = 1$, $-\sin 0 = 0$, $-\cos 0 = -1$, so $P_3 = \theta - \theta^3/6$. For $\cos$: $1, 0, -1, 0$, so $P_3 = 1 - \theta^2/2$, the cubic coefficient being zero.

Sine: $P_3 = 0.261799 - 0.002991 = 0.258809$, against $\sin 15^\circ = 0.258819$. Error $1.02 \times 10^{-5}$. The degree-3 bound is $\theta^4/4! = 1.96 \times 10^{-4}$: valid, but nineteen times too pessimistic, because the $\theta^4$ coefficient of $\sin$ is zero and the true leading error is the $\theta^5$ term, $\theta^5/5! = 1.025 \times 10^{-5}$, which matches the measured error almost exactly.

Cosine: $P_3 = 1 - 0.034270 = 0.965731$, against $\cos 15^\circ = 0.965926$. Error $1.953 \times 10^{-4}$, bound $\theta^4/4! = 1.957 \times 10^{-4}$. Here the bound is tight, because the first omitted term $\theta^4/24$ is genuinely the leading error.

| $\theta$ | $\sin$ error | $\theta^5/5!$ | $\cos$ error | $\theta^4/4!$ |
| --- | --- | --- | --- | --- |
| $5^\circ$ | $4.2 \times 10^{-8}$ | $4.2 \times 10^{-8}$ | $2.42 \times 10^{-6}$ | $2.42 \times 10^{-6}$ |
| $15^\circ$ | $1.02 \times 10^{-5}$ | $1.03 \times 10^{-5}$ | $1.95 \times 10^{-4}$ | $1.96 \times 10^{-4}$ |
| $30^\circ$ | $3.26 \times 10^{-4}$ | $3.28 \times 10^{-4}$ | $3.10 \times 10^{-3}$ | $3.13 \times 10^{-3}$ |
| $60^\circ$ | $1.02 \times 10^{-2}$ | $1.05 \times 10^{-2}$ | $4.83 \times 10^{-2}$ | $5.01 \times 10^{-2}$ |
| $90^\circ$ | $7.5 \times 10^{-2}$ | $8.0 \times 10^{-2}$ | $2.34 \times 10^{-1}$ | $2.54 \times 10^{-1}$ |

Going from $15^\circ$ to $30^\circ$ multiplies the sine error by $32 = 2^5$ and the cosine error by $16 = 2^4$, the orders in action. At $90^\circ$ the cubic cosine is wrong by a quarter, and no one should use it there. The same error at $1\,\mathrm{mrad}$ — a typical attitude-error scale in a filter — is $8 \times 10^{-18}$ for sine and $4 \times 10^{-14}$ for cosine, below double-precision round-off, which is why filters linearise attitude without a second thought.
:::

## The standard series

Each of these follows from the derivatives at $0$; you should be able to reproduce every one.

**Exponential.** Every derivative of $e^x$ is $e^x$, equal to $1$ at $0$:

$$
e^x = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots = \sum_{k=0}^{\infty}\frac{x^k}{k!}.
$$

**Sine and cosine.** The derivatives of $\sin$ cycle through $\cos, -\sin, -\cos, \sin$, giving $0, 1, 0, -1$ at the origin and then repeating:

$$
\sin x = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \cdots, \qquad \cos x = 1 - \frac{x^2}{2!} + \frac{x^4}{4!} - \cdots.
$$

Sine is odd and its series has only odd powers; cosine is even. Differentiating the sine series term by term gives the cosine series, as it must.

**Logarithm.** For $f(x) = \ln(1 + x)$: $f' = (1 + x)^{-1}$, $f'' = -(1 + x)^{-2}$, $f''' = 2(1 + x)^{-3}$, and in general $f^{(k)}(0) = (-1)^{k-1}(k - 1)!$. Dividing by $k!$ leaves $1/k$:

$$
\ln(1 + x) = x - \frac{x^2}{2} + \frac{x^3}{3} - \frac{x^4}{4} + \cdots, \qquad -1 < x \le 1.
$$

**Geometric series.** For $|x| < 1$, multiplying out $(1 - x)(1 + x + x^2 + \cdots + x^n) = 1 - x^{n+1}$ and letting $n \to \infty$ gives

$$
\frac{1}{1 - x} = 1 + x + x^2 + x^3 + \cdots, \qquad |x| < 1.
$$

This agrees with the derivative recipe ($f^{(k)}(0) = k!$), and it is the one series whose remainder you can write exactly: $x^{n+1}/(1 - x)$.

**Binomial.** For $f(x) = (1 + x)^\alpha$ with any real $\alpha$, $f^{(k)}(0) = \alpha(\alpha - 1)\cdots(\alpha - k + 1)$:

$$
(1 + x)^\alpha = 1 + \alpha x + \frac{\alpha(\alpha - 1)}{2!}x^2 + \frac{\alpha(\alpha-1)(\alpha-2)}{3!}x^3 + \cdots, \qquad |x| < 1.
$$

With $\alpha = \tfrac12$ this is $\sqrt{1 + x} = 1 + \tfrac12 x - \tfrac18 x^2 + \tfrac1{16}x^3 - \cdots$; at $x = 0.1$ three terms give $1.04875$ against $\sqrt{1.1} = 1.048809$. With $\alpha = -1$ it reproduces the geometric series in $-x$. With $\alpha = -2$ it gives $(1 + x)^{-2} = 1 - 2x + 3x^2 - \cdots$, which is the inverse-square gravity expansion of the previous lesson carried one term further: $g(h) = g(0)\left(1 - 2h/R_E + 3h^2/R_E^2 - \cdots\right)$.

**Convergence.** The exponential, sine and cosine series converge for every real $x$, because $k!$ beats $|x|^k$; the logarithm, geometric and binomial series converge only for $|x| < 1$ (the logarithm also at $x = 1$). The distance from $x_0$ to the nearest point where the function misbehaves — the pole at $x = -1$ for all three — is the **radius of convergence**. Outside it, adding terms makes the approximation *worse*. A series is a tool for the neighbourhood of $x_0$, and the remainder formula, which holds for any $n$ regardless of convergence, is the honest measure of how good it is at a given $h$.

::: example How many terms for the exponential
The state transition matrix of a linear system, $\boldsymbol{\Phi} = e^{\mathbf{F}h}$, is often computed from the exponential series; the scalar version is the question of how many terms $e^x$ needs. Compute $e^{0.5}$ to an absolute error below $10^{-6}$.

The remainder after degree $n$ is $R_n = \dfrac{e^\xi}{(n+1)!}(0.5)^{n+1}$ with $0 < \xi < 0.5$, so $|R_n| \le \dfrac{e^{0.5}\,(0.5)^{n+1}}{(n+1)!}$. Tabulating the partial sums $S_n = \sum_{k=0}^n 0.5^k/k!$ against $e^{0.5} = 1.6487213$:

| $n$ | $S_n$ | Actual error | Bound |
| --- | --- | --- | --- |
| 3 | $1.6458333$ | $2.9 \times 10^{-3}$ | $4.3 \times 10^{-3}$ |
| 5 | $1.6486979$ | $2.3 \times 10^{-5}$ | $3.6 \times 10^{-5}$ |
| 6 | $1.6487196$ | $1.7 \times 10^{-6}$ | $2.6 \times 10^{-6}$ |
| 7 | $1.6487212$ | $1.0 \times 10^{-7}$ | $1.6 \times 10^{-7}$ |

Degree $7$ — eight terms — is the first that meets $10^{-6}$, and the bound predicted it without knowing the answer. Each extra term divides the bound by $(n+2)/0.5 = 2(n+2)$, so the series accelerates as it goes. For $x = 5$ the same series needs more than twenty terms and suffers cancellation; software instead uses $e^x = (e^{x/2^s})^{2^s}$, shrinking the argument until a short series suffices and then squaring $s$ times. That "scaling and squaring" is exactly how the matrix exponential is computed in the numerical-methods module.
:::

## Truncation error in finite differences

Here is the promised explanation of the two error rates in the numerical-derivative table of the second lesson. Expand $f$ about $x$ in both directions:

$$
f(x + h) = f(x) + f'(x)h + \frac{f''(x)}{2}h^2 + \frac{f'''(x)}{6}h^3 + O(h^4), \qquad
f(x - h) = f(x) - f'(x)h + \frac{f''(x)}{2}h^2 - \frac{f'''(x)}{6}h^3 + O(h^4).
$$

**Forward difference.** Subtract $f(x)$ from the first and divide by $h$:

$$
\frac{f(x + h) - f(x)}{h} = f'(x) + \frac{f''(x)}{2}h + \frac{f'''(x)}{6}h^2 + \cdots
$$

The error is $\tfrac12 f''(x)h + O(h^2)$: first order in $h$, with the constant $\tfrac12|f''|$ promised earlier.

**Central difference.** Subtract the second expansion from the first. The even powers cancel — $f(x)$, the $h^2$ terms, all of them — leaving only odd powers:

$$
\frac{f(x + h) - f(x - h)}{2h} = f'(x) + \frac{f'''(x)}{6}h^2 + O(h^4).
$$

Second order, constant $\tfrac16|f'''|$. The central difference gains an order for free because of symmetry, and the same trick — arranging evaluations so that unwanted Taylor terms cancel — is the design principle behind every higher-order integrator.

::: example Predicting the finite-difference errors
For $f = \sin$ at $x = 1$ with $h = 0.1$, the second lesson measured a forward-difference error of $-4.29 \times 10^{-2}$ and a central-difference error of $-9.00 \times 10^{-4}$. Check these against the Taylor prediction.

Forward: $\tfrac12 f''(1)\,h = \tfrac12(-\sin 1)(0.1) = -0.04207$; adding the next term $\tfrac16 f'''(1)h^2 = \tfrac16(-\cos 1)(0.01) = -0.00090$ gives $-0.04297$, against the measured $-0.04294$. The remaining $3 \times 10^{-5}$ is the $h^3$ term, $\tfrac{1}{24}\sin 1\,(0.001) = 3.5 \times 10^{-5}$.

Central: $\tfrac16 f'''(1)h^2 = \tfrac16(-0.5403)(0.01) = -9.005 \times 10^{-4}$, against the measured $-9.0005 \times 10^{-4}$. The prediction is right to four digits, and the leftover is the $O(h^4)$ term. Adding the two expansions instead of subtracting gives the second-derivative formula, which one of the check questions asks you to derive.
:::

## Truncation error in a time step

Let $x(t)$ be the true solution of $\dot x = f(x, t)$. Its Taylor expansion in time over a step $h$ is

$$
x(t + h) = x(t) + \dot x(t)\,h + \frac{\ddot x(t)}{2}h^2 + \frac{\dddot x(t)}{6}h^3 + \cdots
$$

**Euler's method** keeps two terms, $x_{k+1} = x_k + h f(x_k, t_k)$, and so commits a **local truncation error** of $\tfrac12\ddot x(\xi)h^2 = O(h^2)$ on each step. To cover a fixed interval $T$ it takes $N = T/h$ steps, and the local errors accumulate — roughly $N$ of them, each $O(h^2)$ — into a **global truncation error** of $N \cdot O(h^2) = O(h)$. The general rule, which the numerical-methods module states as a flashcard: a method whose local error is $O(h^{p+1})$ has global error $O(h^p)$ and is called a method of **order** $p$. Euler is order $1$. The classical Runge–Kutta method arranges four evaluations of $f$ per step so that the result matches the Taylor expansion of $x(t + h)$ through the $h^4$ term; its local error is $O(h^5)$, its global error $O(h^4)$, and halving the step divides the global error by sixteen.

::: example One Euler step against the series
Take the oscillator solution $x(t) = \cos t$, which satisfies $\dot x = -\sin t$, and step it from $t = 0$ with Euler's method.

At $t = 0$: $x_0 = 1$ and $\dot x_0 = 0$, so Euler gives $x_1 = 1 + h \cdot 0 = 1$ for any $h$. The truth is $\cos h$. The local error is $1 - \cos h$, and the Taylor prediction is $\tfrac12|\ddot x|h^2 = \tfrac12 h^2$ since $\ddot x(0) = -1$.

| $h$ | Euler $x_1$ | Exact $\cos h$ | Error | $h^2/2$ |
| --- | --- | --- | --- | --- |
| $0.1$ | $1$ | $0.995004$ | $5.00 \times 10^{-3}$ | $5.00 \times 10^{-3}$ |
| $0.05$ | $1$ | $0.998750$ | $1.25 \times 10^{-3}$ | $1.25 \times 10^{-3}$ |

Halving $h$ quarters the local error, and the constant $\tfrac12\ddot x$ is right to three digits (the discrepancy is the $h^4/24$ term of the cosine series). Over one period, $2\pi/h$ such steps compound into an error of order $h$; at $h = 0.1$ that is tens of percent, which is why nobody propagates an orbit with Euler's method.
:::

## The second-order term in a filter

Suppose $x$ is uncertain, with mean $\hat x$ and variance $\sigma^2$, and you need the mean of $y = f(x)$. Expand about $\hat x$ and take the expectation term by term. The first-order term $f'(\hat x)(x - \hat x)$ averages to zero because $x - \hat x$ has zero mean; the second-order term does not:

$$
\mathbb{E}[f(x)] \approx f(\hat x) + \frac{f''(\hat x)}{2}\,\sigma^2.
$$

Pushing the mean through a nonlinear function *biases* it by half the curvature times the variance. An EKF, which uses $f(\hat x)$ as the propagated mean, omits this term; for $g(h) = \mu/(R_E + h)^2$ at $400\,\mathrm{km}$ with a $50\,\mathrm{km}$ altitude uncertainty, $\tfrac12 g''\sigma^2 = \tfrac12(1.14 \times 10^{-12})(5 \times 10^4)^2 = 1.4 \times 10^{-3}\,\mathrm{m/s^2}$, small against $g = 8.69$ but not zero, and it accumulates. Second-order and sigma-point filters exist to keep this term. For a quadratic $f$ the formula is exact, since $f''' = 0$, which a check question below exploits.

::: warning
The Lagrange bound uses the largest $|f^{(n+1)}|$ on the *whole interval* from $x_0$ to $x_0 + h$, not its value at $x_0$. For $e^x$ on $[0, 0.5]$ that meant $e^{0.5}$, not $e^0 = 1$; skipping this step gives a "bound" the true error can exceed. Conversely, the first-omitted-term *estimate* uses $f^{(n+1)}(x_0)$ and is not a bound at all unless the series alternates with decreasing terms.
:::

::: warning
A zero coefficient does not mean the error is zero. Truncating $\sin\theta$ after $\theta^3$ has a "degree-3 bound" $\theta^4/24$, but the $\theta^4$ coefficient vanishes and the real error is $\theta^5/120$. Read off the *first non-zero* omitted term for the estimate, and remember that the bound $|h|^{k+1}/(k+1)!$ for $\sin$ and $\cos$ is safe but sometimes loose by a large factor.
:::

::: note
The series for $\sin\theta/\theta$, which the first lesson needed at $\theta = 0$, is now one line: divide the sine series by $\theta$ to get $1 - \theta^2/6 + \theta^4/120 - \cdots$. At $\theta = 0.5$ two terms give $0.95833$ and three give $0.958854$ against the true $0.958851$. This is the branch a rotation-vector-to-quaternion routine takes for small angles, where dividing $\sin\theta$ by $\theta$ directly would lose digits.
:::

## Check yourself

::: check
Write the Taylor expansion of $f(x_0 + h)$ through the $h^3$ term together with its Lagrange remainder, and state the order of the truncation error.
:::

::: answer
$f(x_0 + h) = f(x_0) + f'(x_0)h + \dfrac{f''(x_0)}{2!}h^2 + \dfrac{f'''(x_0)}{3!}h^3 + \dfrac{f^{(4)}(\xi)}{4!}h^4$ for some $\xi$ between $x_0$ and $x_0 + h$. The truncation error after the cubic term is $O(h^4)$: halving $h$ divides it by sixteen, and its magnitude is at most $\dfrac{M}{24}|h|^4$ where $M$ bounds $|f^{(4)}|$ on the interval.
:::

::: check
Estimate $\ln 1.1$ from four terms of the logarithm series. Bound the error using the alternating-series property and compare with the exact value $0.0953102$.
:::

::: answer
$\ln(1 + x) = x - \dfrac{x^2}{2} + \dfrac{x^3}{3} - \dfrac{x^4}{4} + \cdots$ at $x = 0.1$: $0.1 - 0.005 + 0.000333 - 0.000025 = 0.0953083$. The terms alternate and decrease, so the error is at most the first omitted term, $0.1^5/5 = 2.0 \times 10^{-6}$. Exact minus estimate is $1.85 \times 10^{-6}$, inside the bound and with the sign the omitted positive term predicts.
:::

::: check
Through what degree must the sine series be kept so that the truncation error is below $10^{-9}$ for all $|\theta| \le \pi/4$?
:::

::: answer
The bound for a truncation whose first omitted term has degree $m$ is $|\theta|^m/m!$ (the sine coefficient of the intermediate even degree is zero, so the Lagrange bound at that degree is the relevant one). At $\theta = \pi/4 = 0.7854$: omitting from $\theta^{11}$ on gives $0.7854^{11}/11! = 1.8 \times 10^{-9}$, not enough; omitting from $\theta^{13}$ on gives $0.7854^{13}/13! = 6.9 \times 10^{-12}$. So keep terms through $\theta^{11}$ — six terms — for $10^{-9}$ on the octant. Argument reduction to $|\theta| \le \pi/4$ followed by a short series is how library sine routines work.
:::

::: check
Derive the central-difference formula for the second derivative, $f''(x) \approx \dfrac{f(x + h) - 2f(x) + f(x - h)}{h^2}$, find its leading truncation error, and check it for $\sin$ at $x = 1$, $h = 0.1$.
:::

::: answer
Add the two expansions: $f(x + h) + f(x - h) = 2f(x) + f''(x)h^2 + \dfrac{f^{(4)}(x)}{12}h^4 + O(h^6)$, the odd powers cancelling. Subtract $2f(x)$ and divide by $h^2$: $\dfrac{f(x+h) - 2f(x) + f(x-h)}{h^2} = f''(x) + \dfrac{f^{(4)}(x)}{12}h^2 + O(h^4)$, second-order accurate with constant $\tfrac{1}{12}|f^{(4)}|$. For $\sin$ at $1$: the formula gives $-0.840770$ against $-\sin 1 = -0.841471$, an error of $7.01 \times 10^{-4}$; the prediction is $\tfrac{1}{12}\sin 1\,(0.01) = 7.01 \times 10^{-4}$.
:::

::: check
A quantity $x$ has mean $\hat x$ and variance $\sigma^2$. Show that $\mathbb{E}[x^2] = \hat x^2 + \sigma^2$ exactly by Taylor expansion, and say what it means for a filter that squares an estimate.
:::

::: answer
Expand $f(x) = x^2$ about $\hat x$: $f(\hat x) = \hat x^2$, $f' = 2\hat x$, $f'' = 2$, and all higher derivatives vanish, so $x^2 = \hat x^2 + 2\hat x(x - \hat x) + (x - \hat x)^2$ with no remainder. Taking expectations, the middle term is zero and the last is $\sigma^2$: $\mathbb{E}[x^2] = \hat x^2 + \sigma^2$. Squaring an unbiased estimate therefore gives a result biased high by the variance — the $\tfrac12 f''\sigma^2$ term with $f'' = 2$. A range-squared or energy computed from a noisy estimate carries this bias unless it is subtracted.
:::

::: check
An integrator has local truncation error $O(h^5)$. If the step is halved, by what factor do the local and the global errors fall, and what is the method's order?
:::

::: answer
Local error scales as $h^5$, so halving $h$ divides it by $2^5 = 32$. The global error is one power lower, $O(h^4)$, because twice as many steps are taken; it falls by $2^4 = 16$. The method is of order $4$ — this is the signature of classical Runge–Kutta, and measuring a factor of $16$ under step halving is the standard test that such an integrator is coded correctly.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Taylor polynomial | $P_n(h) = \sum_{k=0}^{n} \dfrac{f^{(k)}(x_0)}{k!}h^k$, matching $f$ through $n$ derivatives |
| Lagrange remainder | $R_n = \dfrac{f^{(n+1)}(\xi)}{(n+1)!}h^{n+1} = O(h^{n+1})$ |
| Bound for $\sin, \cos$ | Degree-$k$ truncation: $\lvert R_k\rvert \le \dfrac{\lvert\theta\rvert^{k+1}}{(k+1)!}$ |
| $e^x$ | $\sum x^k/k!$, all $x$ |
| $\sin x$, $\cos x$ | $x - x^3/3! + x^5/5! - \cdots$; $1 - x^2/2! + x^4/4! - \cdots$, all $x$ |
| $\ln(1 + x)$ | $x - x^2/2 + x^3/3 - \cdots$, $-1 < x \le 1$ |
| $1/(1 - x)$, $(1 + x)^\alpha$ | $1 + x + x^2 + \cdots$; $1 + \alpha x + \frac{\alpha(\alpha-1)}{2}x^2 + \cdots$, $\lvert x\rvert < 1$ |
| Forward / central difference | Error $\tfrac12 f'' h$ / $\tfrac16 f''' h^2$ |
| Second difference | $\dfrac{f(x+h) - 2f(x) + f(x-h)}{h^2} = f'' + \tfrac{1}{12}f^{(4)}h^2$ |
| Local vs global error | Local $O(h^{p+1})$ $\Rightarrow$ global $O(h^p)$, order $p$; Euler $p = 1$, RK4 $p = 4$ |
| Mean through a nonlinearity | $\mathbb{E}[f(x)] \approx f(\hat x) + \tfrac12 f''(\hat x)\sigma^2$ |

Differentiation is now complete, from the limit definition to the full expansion and its error. The next lesson reverses the operation: the definite integral, and the theorem that says integration undoes differentiation.
