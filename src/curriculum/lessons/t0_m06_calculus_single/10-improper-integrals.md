---
id: l10-improper-integrals
title: Improper integrals
minutes: 22
covers:
  - improper integrals
---

Throw a ball straight up and it comes back. Throw it harder and it goes higher, but it still comes back. Is there a speed so fast that it never comes back at all? For a rocket leaving Earth, there is. To find it, you have to add up the work against gravity all the way out to "forever" — an integral whose upper end is not a number but **infinity**, written $\infty$. That sounds impossible. Yet the answer comes out finite, and it is the reason a spacecraft can leave Earth for good.

In lesson 8 you found the work, per kilogram, to lift something from Earth's surface to a height $h$: $\mu\left(\frac{1}{R_E} - \frac{1}{R_E + h}\right)$. Here $\mu$ (read "mu") is Earth's gravity constant and $R_E$ is Earth's radius. "Never come back" means $h \to \infty$ ("$h$ goes to infinity"). The integral $\int_{R_E}^{\infty}\mu/r^2\,dr$ has an infinite upper limit, and still it has the finite value $\mu/R_E$. That value is what sets **[[escape velocity|escape-velocity]]**.

The same kind of integral turns up all over guidance, navigation and control:

- A cold-gas thruster's push, $a_0 e^{-t/\tau}$, fades but never quite reaches zero. Its total $\Delta v$ is $\int_0^\infty a\,dt$.
- A bell-shaped (Gaussian) probability curve stretches across the whole number line, and the total area under it must be exactly one.
- The Laplace transform, which the controls module uses on every signal, is $\int_0^\infty e^{-st}f(t)\,dt$.

None of these fits the definite integral of lesson 8. That was a limit of sums over a *bounded* interval, of a *bounded* function — one that never shoots off to infinity.

An **improper integral** extends the definition with one more limit. Integrate over a finite piece, then let the piece grow. Sometimes the answer settles down to a number: the integral **[[converges|converge-diverge]]**. Sometimes it does not: the integral **diverges**. Knowing which is a practical question, not a classroom one. A noise model whose variance integral diverges cannot describe a real sensor. A Laplace transform that diverges does not exist for that $s$. And a rocket with zero dry mass would, on paper, have infinite $\Delta v$ — and the slow, logarithmic way that integral diverges is the whole reason rockets are built in stages.

## Infinite limits of integration

Picture painting a fence that goes on forever. Paint the first 10 meters, then 100, then 1000, and keep a running total of paint used. If the fence gets shorter and shorter as it goes, that total might level off at some amount. That leveling-off number is what we mean by the paint for the whole infinite fence.

Here is the precise rule. Suppose $f$ can be integrated on every finite stretch $[a, b]$. Then define

$$
\int_a^\infty f(x)\,dx = \lim_{b \to \infty}\int_a^b f(x)\,dx,
$$

provided the limit exists as a finite number. Read it as "the integral from $a$ to infinity is the limit, as $b$ goes to infinity, of the integral from $a$ to $b$." If the limit is finite, the integral converges. Otherwise it diverges.

The other end works the same way: $\int_{-\infty}^b f\,dx = \lim_{a \to -\infty}\int_a^b f\,dx$.

When *both* ends are infinite, split at any convenient point $c$. Then require *each* piece to converge on its own:

$$
\int_{-\infty}^{\infty} f\,dx = \int_{-\infty}^{c} f\,dx + \int_{c}^{\infty} f\,dx.
$$

That "each on its own" rule matters. Take $f(x) = x$. Over any balanced stretch, $\int_{-b}^{b} x\,dx = 0$, because the negative part on the left cancels the positive part on the right. But $\int_0^\infty x\,dx$ diverges — the area just keeps growing. So $\int_{-\infty}^\infty x\,dx$ diverges. It is not zero. Letting both ends grow at the same rate is a choice you made, and the definition does not make it for you.

### The power test

Every comparison needs a measuring stick. For improper integrals, the stick is the family of powers $f(x) = x^{-p}$, that is $1/x^p$, on $[1, \infty)$. The number $p$ says how fast the curve sinks toward zero.

For $p \ne 1$, use the power rule for antiderivatives:

$$
\int_1^b \frac{dx}{x^p} = \left[\frac{x^{1-p}}{1-p}\right]_1^b = \frac{b^{1-p} - 1}{1 - p}.
$$

Now let $b$ grow and look at $b^{1-p}$.

- If $p > 1$, the exponent $1 - p$ is negative. So $b^{1-p}$ shrinks to $0$, and the integral converges to $\dfrac{0 - 1}{1 - p} = \dfrac{1}{p - 1}$.
- If $p < 1$, the exponent is positive. So $b^{1-p} \to \infty$ and the integral diverges.
- If $p = 1$, the power rule does not apply. Instead $\int_1^b dx/x = \ln b$, which also goes to infinity. It diverges — but very slowly.

The table shows how slowly. Each column is a running total out to $b$:

| $b$ | $\int_1^b x^{-1/2}dx$ | $\int_1^b x^{-1}dx$ | $\int_1^b x^{-2}dx$ | $\int_1^b x^{-3}dx$ |
| --- | --- | --- | --- | --- |
| $10$ | $4.32$ | $2.30$ | $0.900$ | $0.495$ |
| $100$ | $18.0$ | $4.61$ | $0.990$ | $0.500$ |
| $1000$ | $61.2$ | $6.91$ | $0.999$ | $0.500$ |
| $10^6$ | $1998$ | $13.8$ | $1.000$ | $0.500$ |

The $p = 2$ column closes in on $\frac{1}{2-1} = 1$ and the $p = 3$ column on $\frac{1}{3-1} = \frac12$, as the formula says. The $1/x$ column keeps climbing, though it has only reached $13.8$ after a million.

So $\displaystyle\int_1^\infty\frac{dx}{x^p}$ converges exactly when $p > 1$, and the [[borderline case $1/x$|power-picture]] diverges like a logarithm. Gravity falls off as $1/r^2$, so $p = 2$, and the work to escape is finite. That is why escape is possible at a finite speed. If gravity fell off only as $1/r$, no speed would ever be enough.

### Comparison

Often you want to know *whether* an integral converges before you work out its value. Sometimes there is no antiderivative to work with at all. Then you compare.

Think of two hoses filling two buckets. If hose $f$ never pours faster than hose $g$, and bucket $g$ ends up holding a finite amount, bucket $f$ must too.

Precisely: if $0 \le f(x) \le g(x)$ for all $x \ge a$, and $\int_a^\infty g\,dx$ converges, then $\int_a^\infty f\,dx$ converges too. The running totals of $f$ only ever increase (since $f \ge 0$), and they can never pass $\int_a^\infty g$. A total that keeps rising but is capped must level off. The test also runs the other way: if $f \ge g \ge 0$ and $\int g$ diverges, so does $\int f$.

Here is an example. On $[1, \infty)$, $x^2 \ge x$, so $e^{-x^2} \le e^{-x}$. And $\int_1^\infty e^{-x}\,dx = e^{-1} = 0.368$ converges. So $\int_1^\infty e^{-x^2}dx$ converges too, to something no bigger than $0.368$. (Its actual value is $0.139$.)

When $f$ swings between positive and negative, apply the test to its size $|f|$. If $\int |f|$ converges, then $\int f$ converges too. This is called **absolute convergence**.

::: example Escape velocity
Find the work needed to carry one kilogram from Earth's surface out to infinity against gravity, which pulls with $\mu/r^2$ newtons per kilogram at distance $r$ from Earth's center. Then find the launch speed that supplies that work.

**Step 1: set up the limit.** Integrate out to a finite distance $b$, then let $b$ grow:

$$
W_\infty = \int_{R_E}^{\infty}\frac{\mu}{r^2}\,dr = \lim_{b\to\infty}\left[-\frac{\mu}{r}\right]_{R_E}^{b} = \lim_{b\to\infty}\left(\frac{\mu}{R_E} - \frac{\mu}{b}\right) = \frac{\mu}{R_E}.
$$

The $\mu/b$ term shrinks to zero as $b$ grows, so only $\mu/R_E$ is left.

**Step 2: put in numbers.** With $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ and $R_E = 6371\,\mathrm{km}$:

$$
W_\infty = \frac{3.986 \times 10^{14}}{6.371 \times 10^6} = 6.26 \times 10^7\,\mathrm{J/kg} = 62.6\,\mathrm{MJ/kg}.
$$

Compare that with the $3.70\,\mathrm{MJ/kg}$ you found in lesson 8 for climbing to $400\,\mathrm{km}$. Escaping costs about seventeen times as much. Most of the climb out of Earth's [[gravity well|gravity-well]] happens far from the surface. Each meter out there is cheap, but there are a great many of them.

**Step 3: the speed.** A body launched with kinetic energy $\tfrac12 v^2$ per kilogram equal to $\mu/R_E$ reaches infinity with nothing to spare. Set $\tfrac12 v^2 = \mu/R_E$ and solve for $v$:

$$
v_{\mathrm{esc}} = \sqrt{\frac{2\mu}{R_E}} = \sqrt{\frac{2 \times 3.986 \times 10^{14}}{6.371 \times 10^6}} = 11\,190\,\mathrm{m/s}.
$$

That is about $11.2\,\mathrm{km/s}$, a bit less than one and a half times the $7.7\,\mathrm{km/s}$ of low orbit. Sensible: escaping should take more than circling.

**Step 4: from orbit.** From $400\,\mathrm{km}$ up, use $R_E + h$ in place of $R_E$ and the same formula gives $10\,850\,\mathrm{m/s}$. The circular orbit speed there is $\sqrt{\mu/r} = 7673\,\mathrm{m/s}$, and $10\,850/7673 = 1.414 = \sqrt2$. That ratio holds at every radius, because $v_{\mathrm{circ}}^2 = \mu/r$ and $v_{\mathrm{esc}}^2 = 2\mu/r$.

The finite answer also explains a convention. The **[[gravitational potential energy|zero-at-infinity]]** is written $U(r) = -\mu/r$, which is zero at infinity and negative everywhere else. It is minus the work you still owe to escape.
:::

::: example Total delta-v and mean burn time of a fading thruster
Lesson 9's cold-gas thruster had acceleration $a(t) = a_0 e^{-t/\tau}$ with $a_0 = 2\,\mathrm{m/s^2}$ and time constant $\tau = 2\,\mathrm{s}$ ($\tau$ is "tau"). Suppose it fires forever. Find the total $\Delta v$, and the average time at which that $\Delta v$ arrives.

**Total.** Integrate to $b$, then let $b$ grow:

$$
\Delta v_\infty = \int_0^\infty a_0 e^{-t/\tau}\,dt = \lim_{b\to\infty} a_0\tau\left(1 - e^{-b/\tau}\right) = a_0\tau = 2 \times 2 = 4\,\mathrm{m/s}.
$$

Even firing forever, it only ever delivers $4\,\mathrm{m/s}$, because the push fades so fast.

**Average time.** Weight each instant by the share of the $\Delta v$ delivered then. That share is $a(t)\,dt/\Delta v_\infty = e^{-t/\tau}\,dt/\tau$. So the average time $\bar t$ ("t bar") is

$$
\bar t = \int_0^\infty t\,\frac{e^{-t/\tau}}{\tau}\,dt = \lim_{b\to\infty}\frac{1}{\tau}\Big[-\tau(t + \tau)e^{-t/\tau}\Big]_0^b = \lim_{b\to\infty}\tau\Big[1 - e^{-b/\tau}\Big(1 + \frac{b}{\tau}\Big)\Big] = \tau.
$$

The antiderivative is the one integration by parts gave you in lesson 9. The last step needs $b\,e^{-b/\tau} \to 0$. That holds because an exponential decay always beats a power of $b$ in the end.

**Sanity check.** With $\tau = 2\,\mathrm{s}$, the running totals out to $b = 5$, $10$ and $20\,\mathrm{s}$ are $1.43$, $1.92$ and $1.999\,\mathrm{s}$. They close in on $2\,\mathrm{s}$, as promised.

The same calculation says the average of an [[exponential probability distribution|exponential-waiting]] with time constant $\tau$ is $\tau$. That is the mean time to failure of a part that fails at a steady rate, or the mean time between arrivals of random events, both of which the probability module uses.
:::

## The Laplace transform as an improper integral

The **[[Laplace transform|laplace-name]]** turns a function of time $f(t)$, defined for $t \ge 0$, into a function of a new variable $s$:

$$
F(s) = \mathcal{L}\{f\}(s) = \int_0^\infty e^{-st}f(t)\,dt.
$$

Read $\mathcal{L}\{f\}$ as "the Laplace transform of $f$". The factor $e^{-st}$ is a fading weight. Whether the integral converges depends on $s$: the weight must fade faster than $f$ grows.

Four transforms come straight from your integration tools:

- $f = 1$: $\int_0^b e^{-st}dt = \dfrac{1 - e^{-sb}}{s} \to \dfrac{1}{s}$, provided $s > 0$. For $s \le 0$ it diverges.
- $f = e^{-at}$: the integrand is $e^{-(s + a)t}$, which gives $\dfrac{1}{s + a}$ for $s > -a$.
- $f = t$: integration by parts gives $\dfrac{1}{s^2}$ for $s > 0$.
- $f = \cos\omega t$: take the damped-cosine antiderivative of lesson 9, replace $a$ by $s$, and let $e^{-st}$ kill the boundary term at infinity. You get $\mathcal{L}\{\cos\omega t\} = \dfrac{s}{s^2 + \omega^2}$ for $s > 0$.

The set of $s$ for which the integral converges is the **region of convergence**. It is a half-line to the right: once $e^{-st}$ fades faster than $f$ grows, a bigger $s$ only adds more fading. (For some signals the region is empty.) A signal that grows like $e^{2t}$ has a transform only for $s > 2$. A signal that grows faster than any exponential, like $e^{t^2}$, has no transform at all. This is the first place where "does the integral converge?" becomes an engineering question. In the ODE module it turns into the question of where a system's **[[poles|poles-bridge]]** lie.

## Unbounded integrands

The second kind of improper integral has a finite interval, but the function shoots up to infinity at one end. Picture a very tall, very thin spike. Is the area under it finite?

The trick is the same: stay a small distance away from the trouble, then close in. If $f$ blows up near $a$ but can be integrated on $[a + \epsilon, b]$ for every small $\epsilon > 0$ ($\epsilon$ is "epsilon", the usual name for a small positive number), define

$$
\int_a^b f(x)\,dx = \lim_{\epsilon \to 0^+}\int_{a + \epsilon}^b f(x)\,dx.
$$

The $0^+$ means $\epsilon$ shrinks toward zero from the positive side. The upper end works the same way. If the blow-up is at a point $c$ inside the interval, split there and require both halves to converge.

The measuring stick is again a power, now near zero. For $p \ne 1$,

$$
\int_\epsilon^1\frac{dx}{x^p} = \frac{1 - \epsilon^{1-p}}{1 - p}.
$$

- If $p < 1$, then $\epsilon^{1-p} \to 0$, and the integral converges to $\dfrac{1}{1 - p}$.
- If $p > 1$, then $\epsilon^{1-p} \to \infty$, and it diverges.
- If $p = 1$, it is $-\ln\epsilon \to \infty$, so it diverges.

The roles have swapped. $\displaystyle\int_0^1\frac{dx}{x^p}$ converges exactly when $p < 1$. So $1/\sqrt{x}$ has finite area across its spike: $\int_0^1 x^{-1/2}dx = \frac{1}{1 - 1/2} = 2$. The running values at $\epsilon = 0.1$, $0.01$ and $10^{-4}$ are $1.37$, $1.80$ and $1.98$. Meanwhile $1/x$ and $1/x^2$ have infinite area. A spike that is tall but [[thin enough|thin-spike]] has a finite area under it.

::: example Free-fall time from energy
A body dropped from rest falls a height $h$ under constant gravity $g_0$. After falling a distance $x$ its speed is $v = \sqrt{2g_0 x}$. Time is distance over speed, piece by piece, so the time to fall is

$$
t = \int_0^h\frac{dx}{v} = \int_0^h\frac{dx}{\sqrt{2g_0 x}}.
$$

At $x = 0$ the body has not started moving, so $v = 0$ and the integrand is infinite. Does the fall still take a finite time?

It must — you have watched things fall. The integral agrees. Pull out the constant and you have $\dfrac{1}{\sqrt{2g_0}}\displaystyle\int_0^h x^{-1/2}dx$, a power with $p = \tfrac12 < 1$. It converges:

$$
t = \frac{1}{\sqrt{2g_0}}\lim_{\epsilon\to 0}\Big[2\sqrt{x}\Big]_\epsilon^h = \frac{2\sqrt h}{\sqrt{2g_0}} = \sqrt{\frac{2h}{g_0}}.
$$

The middle step: $2\sqrt\epsilon \to 0$, leaving $2\sqrt h$. The last step writes $2/\sqrt2$ as $\sqrt2$. This is the familiar free-fall formula, reached from energy instead of from acceleration. For $h = 100\,\mathrm{m}$, $t = \sqrt{200/9.80665} = 4.52\,\mathrm{s}$ — about right for a drop from a 30-story building.

Why does it converge? The speed grows like $\sqrt x$, fast enough that the body spends only a finite time near the start. If the speed grew only in step with $x$, as in $v \propto x$ ("$v$ proportional to $x$"), the time would be $\int dx/x$, which diverges: the body would never get going. That is the math behind a useful fact. When the rate is proportional to the distance from a resting point ($\dot x \propto x$), that point can never be left in finite time — and never reached in finite time either. That is why a first-order lag only ever *approaches* its final value.
:::

## The Gaussian integral

The **normal** ([[Gaussian|gauss-bell]]) density is the bell curve

$$
\frac{1}{\sigma\sqrt{2\pi}}e^{-x^2/2\sigma^2},
$$

where $\sigma$ ("sigma") sets the width. It sits under every error estimate a navigation filter carries (the filter's "covariance"). The constant in front is there to make the total area, the total probability, exactly one. But $e^{-x^2}$ has no antiderivative made of ordinary functions, so the value of $\int_{-\infty}^{\infty}e^{-x^2}dx$ has to come from somewhere cleverer. Here is a way that uses only this module's tools. The idea: build a function that you can show never changes, then read off its value at both ends.

Define, for $t \ge 0$,

$$
G(t) = \left(\int_0^t e^{-x^2}dx\right)^2 + \int_0^1\frac{e^{-t^2(1 + x^2)}}{1 + x^2}\,dx.
$$

**Differentiate the first term.** By the chain rule and part one of the fundamental theorem, its derivative is $2e^{-t^2}\displaystyle\int_0^t e^{-x^2}dx$.

**Differentiate the second term.** Take the $t$-derivative [[inside the integral|under-the-integral]]. That is allowed here because the integrand is smooth in both variables over a bounded interval. The $1 + x^2$ cancels and you get

$$
\int_0^1 -2t\,e^{-t^2(1 + x^2)}dx = -2t\,e^{-t^2}\int_0^1 e^{-t^2x^2}dx.
$$

Now substitute $u = tx$, so $du = t\,dx$ and the limits run from $0$ to $t$. This becomes $-2e^{-t^2}\displaystyle\int_0^t e^{-u^2}du$.

**Add them.** The two derivatives cancel exactly, so $G'(t) = 0$. $G$ never changes. At $t = 0$ the first term is $0$ and the second is $\displaystyle\int_0^1\frac{dx}{1 + x^2} = \arctan 1 = \frac{\pi}{4}$. So $G(t) = \pi/4$ for every $t$.

**Let $t \to \infty$.** The second term is at most $e^{-t^2}\cdot\pi/4$, which goes to $0$. Only the first term survives:

$$
\left(\int_0^\infty e^{-x^2}dx\right)^2 = \frac{\pi}{4}, \qquad \int_0^\infty e^{-x^2}dx = \frac{\sqrt\pi}{2} = 0.8862, \qquad \int_{-\infty}^{\infty}e^{-x^2}dx = \sqrt\pi.
$$

The last one doubles the half-line, since the bell is the same on both sides.

To get the bell with width $\sigma$, substitute $x = \sigma\sqrt2\,u$, so $dx = \sigma\sqrt2\,du$. Then $\displaystyle\int_{-\infty}^\infty e^{-x^2/2\sigma^2}dx = \sigma\sqrt2\cdot\sqrt\pi = \sigma\sqrt{2\pi}$. That is exactly the constant in the normal density.

The spread of the bell, its **variance**, follows by parts. With $\sigma = 1$, take $u = x$ and $dv = x e^{-x^2/2}dx$, so $v = -e^{-x^2/2}$:

$$
\int_{-\infty}^{\infty}x^2 e^{-x^2/2}dx = \Big[-x e^{-x^2/2}\Big]_{-\infty}^{\infty} + \int_{-\infty}^{\infty}e^{-x^2/2}dx = 0 + \sqrt{2\pi}.
$$

Divide by the constant $\sqrt{2\pi}$ and the variance is $1$ — and $\sigma^2$ for a general width. Every step here was an improper integral, and each converged because $e^{-x^2}$ beats any power of $x$.

::: key Improper integrals
An improper integral is a limit of proper ones: $\displaystyle\int_a^\infty f\,dx = \lim_{b\to\infty}\int_a^b f\,dx$ for an infinite limit, and $\displaystyle\int_a^b f\,dx = \lim_{\epsilon\to 0^+}\int_{a+\epsilon}^b f\,dx$ for an integrand unbounded at $a$. It converges when the limit is finite. Power test: $\displaystyle\int_1^\infty x^{-p}dx$ converges for $p > 1$; $\displaystyle\int_0^1 x^{-p}dx$ converges for $p < 1$; $p = 1$ diverges logarithmically in both cases.
:::

::: warning Take the limit — do not plug in infinity
A convergent improper integral is a limit, and you have to take it. Write the finite integral first, then let $b \to \infty$ or $\epsilon \to 0$. Plugging $\infty$ into an antiderivative as if it were a number fails whenever the antiderivative has no limit. For example, $\int_0^\infty \cos x\,dx$ diverges: $\sin b$ keeps swinging between $-1$ and $1$ forever, even though "$\sin\infty$" looks like it should be some number in that range. And when both ends are infinite, or the blow-up is inside the interval, check the two halves separately. Cancelling a left side against a right side is not convergence.
:::

::: warning Going to zero is not enough
A function heading to zero does not make its integral converge. $1/x \to 0$ as $x \to \infty$, yet $\int_1^\infty dx/x = \infty$. What matters is *how fast* it goes to zero, and the dividing line is $1/x$. Anything that falls faster than $1/x^{1+\delta}$ for some $\delta > 0$ ("delta", a small positive number) converges. $1/x$ or slower diverges. The rocket equation's $\int dm/m$ sits exactly on this line. So $\Delta v$ grows without limit as the final mass $m_f \to 0$, but only like a logarithm: each tenfold increase in mass ratio adds the same $v_e\ln 10 = 2.3\,v_e$ of $\Delta v$.
:::

::: note Why rockets have stages
The escape integral and the rocket-equation integral sit on opposite sides of the same dividing line. $\int_{R}^{\infty} dr/r^2$ converges, so a finite speed escapes gravity. $\int_{m_f}^{m_0} dm/m$ diverges as $m_f \to 0$, so a big enough mass ratio could in principle give any $\Delta v$ — but the divergence is so slow that $\Delta v = 3\,v_e$ already needs a mass ratio of $e^3 \approx 20$. Reaching orbit needs about $3\,v_e$ for a kerosene engine, so the rocket would have to be $95\%$ propellant at liftoff. A structure that light is not buildable in one piece. Hence staging.
:::

## Check yourself

::: check
Do $\displaystyle\int_1^\infty\frac{dx}{x^3}$ and $\displaystyle\int_1^\infty\frac{dx}{\sqrt x}$ converge? Evaluate the one that does.
:::

::: answer
By the power test: $p = 3 > 1$, so the first converges. $\frac{1}{\sqrt x} = x^{-1/2}$ has $p = \tfrac12 < 1$, so the second diverges.

The first: $\displaystyle\int_1^\infty x^{-3}dx = \lim_{b\to\infty}\left[-\frac{1}{2x^2}\right]_1^b = \lim_{b\to\infty}\left(\frac12 - \frac{1}{2b^2}\right) = \frac12$. That matches $\frac{1}{p-1} = \frac{1}{2}$.

The second: $\displaystyle\int_1^b x^{-1/2}dx = 2\sqrt b - 2$, which grows without limit.
:::

::: check
Evaluate $\displaystyle\int_0^\infty x\,e^{-x^2}dx$.
:::

::: answer
Substitute $u = -x^2$, so $du = -2x\,dx$. Then $\displaystyle\int_0^b x e^{-x^2}dx = \left[-\tfrac12 e^{-x^2}\right]_0^b = \tfrac12\left(1 - e^{-b^2}\right)$. As $b \to \infty$, $e^{-b^2} \to 0$, so the integral converges to $\tfrac12$.

Since the bell is symmetric, this is half of $\int_{-\infty}^{\infty}|x|\,e^{-x^2}dx = 1$. Integrals like this, of $x$ or $|x|$ times a density, are the "moments" the probability module computes.
:::

::: check
Show that $\displaystyle\int_0^1\ln x\,dx$ converges and find its value.
:::

::: answer
$\ln x \to -\infty$ as $x \to 0^+$, so this is the unbounded-integrand kind. By parts, $\int\ln x\,dx = x\ln x - x$. So

$$
\int_\epsilon^1\ln x\,dx = \big[x\ln x - x\big]_\epsilon^1 = (0 - 1) - (\epsilon\ln\epsilon - \epsilon) = -1 - \epsilon\ln\epsilon + \epsilon.
$$

As $\epsilon \to 0^+$, $\epsilon\ln\epsilon \to 0$: the logarithm blows up more slowly than $1/\epsilon$ does, so the factor $\epsilon$ wins. The value is $-1$. The running values at $\epsilon = 0.1$, $0.01$ and $0.001$ are $-0.670$, $-0.944$ and $-0.992$. A logarithmic spike always has finite area: it is weaker than $x^{-p}$ for every $p > 0$.
:::

::: check
The Moon has $\mu = 4.905 \times 10^{12}\,\mathrm{m^3/s^2}$ and radius $1737\,\mathrm{km}$. What is the escape velocity from its surface, and how does it compare with Earth's?
:::

::: answer
$$
v_{\mathrm{esc}} = \sqrt{\frac{2\mu}{R}} = \sqrt{\frac{2 \times 4.905 \times 10^{12}}{1.737 \times 10^6}} = 2376\,\mathrm{m/s}.
$$

That is about $21\%$ of Earth's $11.19\,\mathrm{km/s}$. The energy per kilogram to escape, $\mu/R = 2.82\,\mathrm{MJ/kg}$, is less than the $3.70\,\mathrm{MJ/kg}$ it takes merely to climb $400\,\mathrm{km}$ above Earth. That is why a lunar ascent stage can be small.
:::

::: check
Lesson 9 found, by parts, $\displaystyle\int e^{-at}\sin\omega t\,dt = -\frac{1}{a}e^{-at}\sin\omega t + \frac{\omega}{a}\int e^{-at}\cos\omega t\,dt$. Use it to find the Laplace transform of $\sin\omega t$ and its region of convergence.
:::

::: answer
Set $a = s > 0$ and integrate from $0$ to $b$.

The boundary term is $-\tfrac1s e^{-sb}\sin\omega b$. It goes to $0$ as $b \to \infty$, because $e^{-sb} \to 0$ and $|\sin| \le 1$. At the lower end, $\sin 0 = 0$, so it is zero there too.

What remains is $\dfrac{\omega}{s}$ times $\mathcal{L}\{\cos\omega t\} = \dfrac{s}{s^2 + \omega^2}$. So

$$
\mathcal{L}\{\sin\omega t\} = \frac{\omega}{s}\cdot\frac{s}{s^2 + \omega^2} = \frac{\omega}{s^2 + \omega^2}, \qquad s > 0.
$$

For $s \le 0$ the factor $e^{-st}$ no longer fades, and the swinging integrand has no limit. Check a number: at $s = 1$, $\omega = 2$ the transform is $\frac{2}{1 + 4} = 0.4$.
:::

::: check
Does $\displaystyle\int_1^\infty\frac{\sin^2 x}{x^2}\,dx$ converge? You do not need its value.
:::

::: answer
Yes. The integrand is never negative, and since $\sin^2 x \le 1$, $\dfrac{\sin^2 x}{x^2} \le \dfrac{1}{x^2}$ for all $x \ge 1$. Because $\displaystyle\int_1^\infty x^{-2}dx = 1$ converges, the comparison test says this one converges too, to at most $1$.

There is no antiderivative in ordinary functions, so comparison is the only way to settle the question. A numerical integration would then give the value.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Infinite limit | $\displaystyle\int_a^\infty f\,dx = \lim_{b\to\infty}\int_a^b f\,dx$; two infinite ends need both halves to converge |
| Unbounded integrand | $\displaystyle\int_a^b f\,dx = \lim_{\epsilon\to 0^+}\int_{a+\epsilon}^b f\,dx$ |
| Power test at infinity | $\displaystyle\int_1^\infty x^{-p}dx = \frac{1}{p-1}$ for $p > 1$; diverges for $p \le 1$ |
| Power test at zero | $\displaystyle\int_0^1 x^{-p}dx = \frac{1}{1-p}$ for $p < 1$; diverges for $p \ge 1$ |
| Comparison | $0 \le f \le g$, $\int g$ converges $\Rightarrow$ $\int f$ converges |
| Escape | $\displaystyle\int_{R}^\infty\frac{\mu}{r^2}dr = \frac{\mu}{R}$; $v_{\mathrm{esc}} = \sqrt{2\mu/R} = \sqrt2\,v_{\mathrm{circ}}$; $11.19\,\mathrm{km/s}$ at Earth's surface |
| Exponential mean | $\displaystyle\int_0^\infty\frac{t}{\tau}e^{-t/\tau}dt = \tau$ |
| Laplace transform | $F(s) = \displaystyle\int_0^\infty e^{-st}f(t)\,dt$; $\mathcal{L}\{1\} = 1/s$, $\mathcal{L}\{e^{-at}\} = 1/(s+a)$, $\mathcal{L}\{\cos\omega t\} = s/(s^2+\omega^2)$ |
| Gaussian | $\displaystyle\int_{-\infty}^\infty e^{-x^2}dx = \sqrt\pi$; $\displaystyle\int_{-\infty}^\infty e^{-x^2/2\sigma^2}dx = \sigma\sqrt{2\pi}$; variance $\sigma^2$ |

Every integral in this lesson started from a function you already knew. The last lesson turns the problem around. You are given an equation that ties a function to its own rate of change — a rocket losing mass, a sensor lagging behind its input — and you have to find the function. When the equation separates, the answer is one integration on each side.

::: context escape-velocity Escape velocity, in real flight
Escape velocity is the launch speed at which a coasting object never falls back. It is about $11.2\,\mathrm{km/s}$ from Earth's surface. No rocket actually leaves the ground that fast — it would burn up in the thick lower air. Instead it climbs above most of the atmosphere, then speeds up. Probes bound for other planets are pushed past escape energy from a parking orbit a few hundred kilometers up, where escape speed is lower, about $10.9\,\mathrm{km/s}$ at $400\,\mathrm{km}$.
:::

::: context converge-diverge Where the words come from
**Converge** comes from Latin for "to lean together": the running totals crowd in toward one number. **Diverge** means "to lean apart": the totals run off without settling. A diverging integral does not always run off to infinity. It may instead swing back and forth forever, like $\int_0^b\cos x\,dx = \sin b$. Either way there is no single number to call its value.
:::

::: context power-picture Two curves that look alike
The curves $1/x$ (dark) and $1/x^2$ (blue) both start at height $1$ and both sink toward zero. From a distance they look like the same kind of curve. But the area under $1/x^2$ from $1$ onward adds up to exactly $1$, while the area under $1/x$ grows forever, like $\ln b$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="40,150 40.0,30.0 49.4,73.2 58.8,96.7 68.1,110.8 77.5,120.0 86.9,126.3 96.2,130.8 105.6,134.1 115.0,136.7 124.4,138.6 133.8,140.2 143.1,141.5 152.5,142.5 161.9,143.4 171.2,144.1 180.6,144.7 190.0,145.2 199.4,145.6 208.8,146.0 218.1,146.4 227.5,146.7 236.9,146.9 246.2,147.2 255.6,147.4 265.0,147.6 274.4,147.7 283.8,147.9 293.1,148.0 302.5,148.1 311.9,148.2 321.2,148.3 330.6,148.4 340.0,148.5 340,150" fill="#8fb8f0" opacity="0.6"/>
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="40.0,30.0 49.4,54.0 58.8,70.0 68.1,81.4 77.5,90.0 86.9,96.7 96.2,102.0 105.6,106.4 115.0,110.0 124.4,113.1 133.8,115.7 143.1,118.0 152.5,120.0 161.9,121.8 171.2,123.3 180.6,124.7 190.0,126.0 199.4,127.1 208.8,128.2 218.1,129.1 227.5,130.0 236.9,130.8 246.2,131.5 255.6,132.2 265.0,132.9 274.4,133.4 283.8,134.0 293.1,134.5 302.5,135.0 311.9,135.5 321.2,135.9 330.6,136.3 340.0,136.7"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,30.0 49.4,73.2 58.8,96.7 68.1,110.8 77.5,120.0 86.9,126.3 96.2,130.8 105.6,134.1 115.0,136.7 124.4,138.6 133.8,140.2 143.1,141.5 152.5,142.5 161.9,143.4 171.2,144.1 180.6,144.7 190.0,145.2 199.4,145.6 208.8,146.0 218.1,146.4 227.5,146.7 236.9,146.9 246.2,147.2 255.6,147.4 265.0,147.6 274.4,147.7 283.8,147.9 293.1,148.0 302.5,148.1 311.9,148.2 321.2,148.3 330.6,148.4 340.0,148.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="166">1</text><text x="115" y="166">3</text><text x="190" y="166">5</text><text x="265" y="166">7</text><text x="340" y="166">9</text>
    <text x="30" y="34" text-anchor="end">1</text><text x="30" y="154" text-anchor="end">0</text>
  </g>
  <text x="200" y="112" font-size="12" fill="#1f2a44">1/x: area has no limit</text>
  <text x="120" y="60" font-size="12" fill="#1d6fd1">1/x²: shaded area → 1</text>
</svg>
```

The difference is all in how fast the tail sinks. $1/x^2$ at $x = 100$ is $0.0001$; $1/x$ there is still $0.01$, a hundred times bigger.
:::

::: context gravity-well Why most of the climb is far away
Physicists call the dip that a planet makes in energy a **gravity well**. The pull is strongest near the surface, but only a short distance is spent there. Going from Earth's surface to $400\,\mathrm{km}$ costs $3.70\,\mathrm{MJ/kg}$, only about $6\%$ of the $62.6\,\mathrm{MJ/kg}$ needed to escape. The other $94\%$ is spent crossing the huge distance beyond, where gravity is weak but the path is endless. Getting to orbit is mostly about *speed*, not height: an orbit at $400\,\mathrm{km}$ also needs the kinetic energy of moving at $7.7\,\mathrm{km/s}$, about $29\,\mathrm{MJ/kg}$.
:::

::: context zero-at-infinity Why potential energy is negative
Only *differences* in energy matter, so you may put the zero anywhere. Near the ground, people pick the floor. For orbits, engineers pick infinity, because the escape integral is finite: $U(r) = -\mu/r$. A negative total energy then means "bound" — the object will come back. Zero total energy means it only just escapes. Positive means it leaves with speed to spare. The orbital mechanics modules sort every orbit this way.
:::

::: context exponential-waiting The exponential waiting time
Some events happen at random but at a steady average rate: a part failing, a cosmic ray hitting a memory chip. The time until the next one follows the density $\frac{1}{\tau}e^{-t/\tau}$ — the same shape as the thruster's fading push, rescaled to have total area $1$. Its average, found in the example, is $\tau$. So if a reaction wheel fails at a steady rate of once per $\tau = 10$ years on average, its mean time to failure is $10$ years, even though many fail sooner and some last much longer.
:::

::: context laplace-name Who Laplace was
Pierre-Simon Laplace (1749–1827) was a French mathematician and astronomer. He spent much of his life on the motions of the planets and on probability, and integrals of this shape appear in his work on probability. The transform carries his name, but the way engineers use it today — turning differential equations into algebra — was developed long after him. You will lean on it heavily in the controls modules.
:::

::: context poles-bridge A preview of poles
Look at $\mathcal{L}\{e^{-at}\} = \frac{1}{s + a}$, valid for $s > -a$. At $s = -a$ the formula blows up. That point is called a **pole**, and the region of convergence starts right at it. A pole at a negative $s$ means the signal decays; a pole at a positive $s$ means it grows. Control engineers read a system's stability off where its poles sit, and it all starts with asking when this improper integral converges.
:::

::: context thin-spike A tall spike with finite area
The curve $1/\sqrt x$ on $(0, 1]$ has no top: it climbs past every height as $x$ approaches $0$. Yet the shaded area is exactly $2$. The spike gets thin fast enough to make up for getting tall.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <polygon points="44.4,170 44.4,20.0 45.5,35.8 46.8,50.0 48.5,62.7 50.7,74.0 53.4,84.1 56.7,93.2 60.9,101.3 66.1,108.6 72.6,115.0 80.7,120.8 90.9,126.0 103.7,130.7 119.6,134.8 139.5,138.5 164.3,141.9 195.4,144.8 234.3,147.5 282.9,149.9 320.0,151.2 320,170" fill="#8fb8f0" opacity="0.6"/>
  <line x1="40" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="14" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="44.4,20.0 45.5,35.8 46.8,50.0 48.5,62.7 50.7,74.0 53.4,84.1 56.7,93.2 60.9,101.3 66.1,108.6 72.6,115.0 80.7,120.8 90.9,126.0 103.7,130.7 119.6,134.8 139.5,138.5 164.3,141.9 195.4,144.8 234.3,147.5 282.9,149.9 320.0,151.2"/>
  <g font-size="11" fill="#1f2a44">
    <text x="40" y="184" text-anchor="middle">0</text><text x="320" y="184" text-anchor="middle">1</text>
    <text x="34" y="155" text-anchor="end">1</text><text x="34" y="99" text-anchor="end">4</text><text x="34" y="24" text-anchor="end">8</text>
  </g>
  <text x="120" y="60" font-size="12" fill="#1f2a44">y = 1/√x keeps climbing</text>
  <text x="150" y="162" font-size="12" fill="#1f2a44">shaded area = 2</text>
</svg>
```

Compare $1/x$: near zero it climbs so much faster that its area really is infinite.
:::

::: context gauss-bell The bell curve and the orbit of Ceres
The shaded area under $e^{-x^2}$ over the whole line is $\sqrt\pi \approx 1.77$, even though the curve never touches zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="30.0,160.0 36.2,160.0 42.5,159.9 48.8,159.9 55.0,159.8 61.2,159.6 67.5,159.3 73.8,158.8 80.0,158.0 86.2,156.7 92.5,154.9 98.8,152.2 105.0,148.4 111.2,143.4 117.5,136.9 123.8,129.0 130.0,119.5 136.2,108.8 142.5,97.3 148.8,85.6 155.0,74.3 161.2,64.4 167.5,56.7 173.8,51.7 180.0,50.0 186.2,51.7 192.5,56.7 198.8,64.4 205.0,74.3 211.2,85.6 217.5,97.3 223.8,108.8 230.0,119.5 236.2,129.0 242.5,136.9 248.8,143.4 255.0,148.4 261.2,152.2 267.5,154.9 273.8,156.7 280.0,158.0 286.2,158.8 292.5,159.3 298.8,159.6 305.0,159.8 311.2,159.9 317.5,159.9 323.8,160.0 330.0,160.0" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="20" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="160" x2="180" y2="30" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="175">−2</text><text x="130" y="175">−1</text><text x="180" y="175">0</text><text x="230" y="175">1</text><text x="280" y="175">2</text>
  </g>
  <text x="190" y="44" font-size="12" fill="#1f2a44">height 1</text>
  <text x="262" y="110" font-size="12" fill="#1f2a44">area = √π</text>
</svg>
```

It is called Gaussian after Carl Friedrich Gauss, who in 1809 used this curve to justify his method of least squares for fitting orbits to telescope measurements. His work on the orbit of the dwarf planet Ceres is an ancestor of the orbit determination done in navigation today.
:::

::: context under-the-integral Differentiating inside an integral
Here the $t$ sits inside the integrand while $x$ is the variable being integrated over, and the limits $0$ and $1$ do not depend on $t$. Then the rate of change of the whole integral is the integral of the rate of change of each slice. Think of a row of sandcastles all rising with the tide: how fast the total height grows is the sum of how fast each castle grows. Care is needed when the limits move with $t$ or the interval is infinite, which is why the proof keeps the second integral on $[0, 1]$.
:::
