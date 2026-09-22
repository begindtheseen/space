---
id: l10-improper-integrals
title: Improper integrals
minutes: 22
covers:
  - improper integrals
---

How fast must a vehicle leave the surface to never come back? The work against gravity to reach altitude $h$ was $\mu(1/R_E - 1/(R_E + h))$, and "never come back" means $h \to \infty$. The integral $\int_{R_E}^{\infty}\mu/r^2\,dr$ has an infinite upper limit, and yet it has a finite value, $\mu/R_E$; that value is what defines escape velocity. A cold-gas thruster's acceleration $a_0 e^{-t/\tau}$ never quite reaches zero, and its total $\Delta v$ is $\int_0^\infty a\,dt$. A Gaussian probability density extends over the whole real line and must integrate to exactly one. The Laplace transform, which the controls module uses on every signal, is $\int_0^\infty e^{-st}f(t)\,dt$. None of these fits the definition of the definite integral, which was a limit of sums over a bounded interval of a bounded function.

An **improper integral** is what you get when you extend the definition by one more limit: integrate over a finite piece, then let the piece grow. Sometimes the result settles to a number and the integral **converges**; sometimes it does not and the integral **diverges**. Knowing which is not academic. A covariance that diverges means a noise model is unphysical; a Laplace transform that diverges means the transform does not exist for that $s$; a rocket with zero dry mass has, on paper, infinite $\Delta v$ — and the way the integral diverges, logarithmically, is the whole reason rockets are staged.

## Infinite limits of integration

For $f$ integrable on every $[a, b]$, define

$$
\int_a^\infty f(x)\,dx = \lim_{b \to \infty}\int_a^b f(x)\,dx,
$$

provided the limit exists as a finite number. Then the integral converges; otherwise it diverges. Similarly $\int_{-\infty}^b f\,dx = \lim_{a \to -\infty}\int_a^b f\,dx$. When both limits are infinite, split at any convenient point $c$ and require *both* pieces to converge separately:

$$
\int_{-\infty}^{\infty} f\,dx = \int_{-\infty}^{c} f\,dx + \int_{c}^{\infty} f\,dx.
$$

The separate requirement matters. $\int_{-b}^{b} x\,dx = 0$ for every $b$, but $\int_0^\infty x\,dx$ diverges, so $\int_{-\infty}^\infty x\,dx$ is divergent, not zero; letting the two ends grow at the same rate is a particular choice that the definition does not make for you.

### The power test

The reference family is $f(x) = x^{-p}$ on $[1, \infty)$. For $p \ne 1$,

$$
\int_1^b \frac{dx}{x^p} = \left[\frac{x^{1-p}}{1-p}\right]_1^b = \frac{b^{1-p} - 1}{1 - p}.
$$

If $p > 1$ the exponent $1 - p$ is negative, $b^{1-p} \to 0$, and the integral converges to $\dfrac{1}{p - 1}$. If $p < 1$ then $b^{1-p} \to \infty$ and it diverges. For $p = 1$, $\int_1^b dx/x = \ln b \to \infty$, divergence — but slowly:

| $b$ | $\int_1^b x^{-1/2}dx$ | $\int_1^b x^{-1}dx$ | $\int_1^b x^{-2}dx$ | $\int_1^b x^{-3}dx$ |
| --- | --- | --- | --- | --- |
| $10$ | $4.32$ | $2.30$ | $0.900$ | $0.495$ |
| $100$ | $18.0$ | $4.61$ | $0.990$ | $0.500$ |
| $1000$ | $61.2$ | $6.91$ | $0.999$ | $0.500$ |
| $10^6$ | $1998$ | $13.8$ | $1.000$ | $0.500$ |

So $\displaystyle\int_1^\infty\frac{dx}{x^p}$ converges exactly when $p > 1$, and the boundary case $1/x$ diverges like a logarithm. Inverse-square gravity, $p = 2$, converges — which is why escape is possible at finite speed. A hypothetical $1/r$ force law would not allow escape at any speed.

### Comparison

Usually you need to know *whether* an integral converges before you can find its value, or when no antiderivative exists. If $0 \le f(x) \le g(x)$ for $x \ge a$ and $\int_a^\infty g\,dx$ converges, then $\int_a^\infty f\,dx$ converges too — the partial integrals of $f$ are increasing and bounded above by $\int_a^\infty g$, so they have a limit. Conversely, if $f \ge g \ge 0$ and $\int g$ diverges, so does $\int f$. For example, on $[1, \infty)$, $e^{-x^2} \le e^{-x}$ because $x^2 \ge x$ there, and $\int_1^\infty e^{-x}\,dx = e^{-1} = 0.368$ converges; therefore $\int_1^\infty e^{-x^2}dx$ converges, to something at most $0.368$ (it is $0.139$). For an integrand that changes sign, convergence of $\int |f|$ implies convergence of $\int f$, called **absolute convergence**, and comparison is applied to $|f|$.

::: example Escape velocity
Find the work needed to take one kilogram from the Earth's surface to infinity against gravity $\mu/r^2$, and the launch speed that supplies it.

$$
W_\infty = \int_{R_E}^{\infty}\frac{\mu}{r^2}\,dr = \lim_{b\to\infty}\left[-\frac{\mu}{r}\right]_{R_E}^{b} = \lim_{b\to\infty}\left(\frac{\mu}{R_E} - \frac{\mu}{b}\right) = \frac{\mu}{R_E}.
$$

With $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ and $R_E = 6371\,\mathrm{km}$, $W_\infty = 62.6\,\mathrm{MJ/kg}$ — seventeen times the $3.70\,\mathrm{MJ/kg}$ for $400\,\mathrm{km}$, because most of the climb out of the well happens far from the surface, where each metre costs little but there are so many of them. A body launched with kinetic energy $\tfrac12 v^2 = \mu/R_E$ per kilogram just reaches infinity with nothing left:

$$
v_{\mathrm{esc}} = \sqrt{\frac{2\mu}{R_E}} = \sqrt{\frac{2 \times 3.986 \times 10^{14}}{6.371 \times 10^6}} = 11\,190\,\mathrm{m/s}.
$$

From $400\,\mathrm{km}$ altitude the same formula with $R_E + h$ gives $10\,850\,\mathrm{m/s}$, which is $\sqrt2$ times the circular speed $7673\,\mathrm{m/s}$ there — a ratio that holds at every radius, since $v_{\mathrm{circ}}^2 = \mu/r$ and $v_{\mathrm{esc}}^2 = 2\mu/r$. The convergence of the integral is why the convention $U(r) = -\mu/r$ for gravitational potential energy, zero at infinity, makes sense: it is minus the work still owed to escape.
:::

::: example Total delta-v and mean burn time of a decaying thruster
The thruster of the previous lesson had $a(t) = a_0 e^{-t/\tau}$ with $a_0 = 2\,\mathrm{m/s^2}$, $\tau = 2\,\mathrm{s}$. Find the total $\Delta v$ if it fires forever, and the mean time at which the $\Delta v$ is delivered.

$$
\Delta v_\infty = \int_0^\infty a_0 e^{-t/\tau}\,dt = \lim_{b\to\infty} a_0\tau\left(1 - e^{-b/\tau}\right) = a_0\tau = 4\,\mathrm{m/s}.
$$

The mean delivery time weights each instant by the fraction of $\Delta v$ delivered then, $a(t)\,dt/\Delta v_\infty = e^{-t/\tau}\,dt/\tau$:

$$
\bar t = \int_0^\infty t\,\frac{e^{-t/\tau}}{\tau}\,dt = \lim_{b\to\infty}\frac{1}{\tau}\Big[-\tau(t + \tau)e^{-t/\tau}\Big]_0^b = \lim_{b\to\infty}\tau\Big[1 - e^{-b/\tau}\Big(1 + \frac{b}{\tau}\Big)\Big] = \tau,
$$

using the by-parts antiderivative of the previous lesson and the limit $b\,e^{-b/\tau} \to 0$, which holds because the exponential beats any power. With $\tau = 2$ the partial integrals to $b = 5, 10, 20\,\mathrm{s}$ are $1.43, 1.92, 1.999$, closing on $2\,\mathrm{s}$. The same computation says the mean of an exponential probability distribution with time constant $\tau$ is $\tau$ — the mean time to failure of a component whose failure rate is constant, or the mean time between arrivals of a Poisson process, both of which the probability module uses.
:::

## The Laplace transform as an improper integral

For a function $f(t)$ defined for $t \ge 0$, the **Laplace transform** is

$$
F(s) = \mathcal{L}\{f\}(s) = \int_0^\infty e^{-st}f(t)\,dt,
$$

an improper integral whose convergence depends on $s$. For $f = 1$: $\int_0^b e^{-st}dt = \dfrac{1 - e^{-sb}}{s} \to \dfrac{1}{s}$ provided $s > 0$; for $s \le 0$ it diverges. For $f = e^{-at}$ the integrand is $e^{-(s + a)t}$, giving $\dfrac{1}{s + a}$ for $s > -a$. For $f = t$, integration by parts gives $\dfrac{1}{s^2}$ for $s > 0$. And the damped-cosine antiderivative of the previous lesson, with $a$ replaced by $s$ and the boundary term at infinity killed by $e^{-st}$, gives $\mathcal{L}\{\cos\omega t\} = \dfrac{s}{s^2 + \omega^2}$ for $s > 0$.

The set of $s$ for which the integral converges is the **region of convergence**, and it is always a half-line $s > s_0$: once $e^{-st}$ decays faster than $f$ grows, adding more decay only helps. A signal that grows like $e^{2t}$ has a transform only for $s > 2$; a signal that grows faster than any exponential, like $e^{t^2}$, has none. This is the first place where "does the integral converge" becomes an engineering statement — it is, in the ODE module, the statement about where a system's poles lie.

## Unbounded integrands

The second kind of improper integral has a finite interval but an integrand that blows up at an endpoint. If $f$ is unbounded near $a$ but integrable on $[a + \epsilon, b]$ for every $\epsilon > 0$, define

$$
\int_a^b f(x)\,dx = \lim_{\epsilon \to 0^+}\int_{a + \epsilon}^b f(x)\,dx,
$$

and similarly at the upper end. If the singularity is at an interior point $c$, split there and require both halves to converge.

The reference family is again a power, now near zero: for $p \ne 1$,

$$
\int_\epsilon^1\frac{dx}{x^p} = \frac{1 - \epsilon^{1-p}}{1 - p},
$$

which converges to $\dfrac{1}{1 - p}$ when $p < 1$ (so $\epsilon^{1-p} \to 0$) and diverges when $p > 1$; for $p = 1$ it is $-\ln\epsilon \to \infty$. The roles have swapped: $\displaystyle\int_0^1\frac{dx}{x^p}$ converges exactly when $p < 1$. So $1/\sqrt{x}$ is integrable across its singularity — $\int_0^1 x^{-1/2}dx = 2$, with partial values $1.37, 1.80, 1.98$ at $\epsilon = 0.1, 0.01, 10^{-4}$ — while $1/x$ and $1/x^2$ are not. A spike that is tall but thin enough has finite area under it.

::: example Free-fall time from the equation of energy
A body released from rest falls a height $h$ under constant $g_0$. Its speed after falling a distance $x$ is $v = \sqrt{2g_0 x}$, so the time to fall is $t = \displaystyle\int_0^h\frac{dx}{v} = \int_0^h\frac{dx}{\sqrt{2g_0 x}}$. The integrand is infinite at $x = 0$, where the body has not yet started moving. Does the fall nevertheless take a finite time?

It must, physically, and the integral confirms it. This is $\dfrac{1}{\sqrt{2g_0}}\displaystyle\int_0^h x^{-1/2}dx$ with $p = \tfrac12 < 1$:

$$
t = \frac{1}{\sqrt{2g_0}}\lim_{\epsilon\to 0}\Big[2\sqrt{x}\Big]_\epsilon^h = \frac{2\sqrt h}{\sqrt{2g_0}} = \sqrt{\frac{2h}{g_0}},
$$

the familiar result, here obtained from energy rather than from integrating acceleration. For $h = 100\,\mathrm{m}$, $t = 4.52\,\mathrm{s}$. The integral converges because the speed grows like $\sqrt x$, fast enough that the body spends only a finite time near the start; had the speed grown only linearly with $x$, as it would for $v \propto x$, the time integral would be $\int dx/x$ and the body would never leave. That is the mathematical content of the statement that an equilibrium with $\dot x \propto x$ cannot be left in finite time — and cannot be reached in finite time either, which is why a first-order lag only ever approaches its final value.
:::

## The Gaussian integral

The normal density $\dfrac{1}{\sigma\sqrt{2\pi}}e^{-x^2/2\sigma^2}$ is the foundation of every covariance you will propagate, and the constant in front exists to make the total probability one. There is no elementary antiderivative, so the value of $\int_{-\infty}^{\infty}e^{-x^2}dx$ has to come from somewhere else. Here is a derivation using only this module's tools.

Define, for $t \ge 0$,

$$
G(t) = \left(\int_0^t e^{-x^2}dx\right)^2 + \int_0^1\frac{e^{-t^2(1 + x^2)}}{1 + x^2}\,dx.
$$

Differentiate with respect to $t$. The first term, by the chain rule and part one of the fundamental theorem, has derivative $2e^{-t^2}\displaystyle\int_0^t e^{-x^2}dx$. In the second, differentiate under the integral sign (legitimate here because the integrand is smooth in both variables on a bounded interval): $\displaystyle\int_0^1 -2t\,e^{-t^2(1 + x^2)}dx = -2t\,e^{-t^2}\int_0^1 e^{-t^2x^2}dx$. Substitute $u = tx$, $du = t\,dx$, limits $0 \to t$: this is $-2e^{-t^2}\displaystyle\int_0^t e^{-u^2}du$. The two derivatives cancel exactly: $G'(t) = 0$, so $G$ is constant, and $G(0) = 0 + \displaystyle\int_0^1\frac{dx}{1 + x^2} = \arctan 1 = \frac{\pi}{4}$.

Now let $t \to \infty$. The second term is at most $e^{-t^2}\cdot\pi/4 \to 0$, so

$$
\left(\int_0^\infty e^{-x^2}dx\right)^2 = \frac{\pi}{4}, \qquad \int_0^\infty e^{-x^2}dx = \frac{\sqrt\pi}{2} = 0.8862, \qquad \int_{-\infty}^{\infty}e^{-x^2}dx = \sqrt\pi.
$$

The substitution $x = \sigma\sqrt2\,u$, $dx = \sigma\sqrt2\,du$ then gives $\displaystyle\int_{-\infty}^\infty e^{-x^2/2\sigma^2}dx = \sigma\sqrt{2\pi}$, which is the normalising constant of the normal density. Its variance follows by parts: with $\sigma = 1$, take $u = x$ and $dv = x e^{-x^2/2}dx$, so $v = -e^{-x^2/2}$, and

$$
\int_{-\infty}^{\infty}x^2 e^{-x^2/2}dx = \Big[-x e^{-x^2/2}\Big]_{-\infty}^{\infty} + \int_{-\infty}^{\infty}e^{-x^2/2}dx = 0 + \sqrt{2\pi},
$$

so dividing by the normalising constant gives variance $1$ — and $\sigma^2$ in general. Every one of these steps was an improper integral whose convergence rested on $e^{-x^2}$ beating any power of $x$.

::: key
An improper integral is a limit of proper ones: $\displaystyle\int_a^\infty f\,dx = \lim_{b\to\infty}\int_a^b f\,dx$ for an infinite limit, and $\displaystyle\int_a^b f\,dx = \lim_{\epsilon\to 0^+}\int_{a+\epsilon}^b f\,dx$ for an integrand unbounded at $a$. It converges when the limit is finite. Power test: $\displaystyle\int_1^\infty x^{-p}dx$ converges for $p > 1$; $\displaystyle\int_0^1 x^{-p}dx$ converges for $p < 1$; $p = 1$ diverges logarithmically in both cases.
:::

::: warning
A convergent improper integral is a limit, and you must take it — write the finite integral, then let $b \to \infty$ or $\epsilon \to 0$. Plugging $\infty$ into an antiderivative as if it were a number gives nonsense for anything that does not tend to a limit ($\int_0^\infty \cos x\,dx$ oscillates and diverges, though $-\sin\infty$ "looks" bounded). And when both limits are infinite, or the singularity is interior, check the two halves separately; symmetric cancellation is not convergence.
:::

::: warning
The integrand going to zero does not make the integral converge. $1/x \to 0$ as $x \to \infty$, but $\int_1^\infty dx/x = \infty$. What matters is *how fast* it goes to zero, and the threshold is $1/x$: faster than $1/x^{1+\delta}$ for some $\delta > 0$ converges, $1/x$ or slower diverges. The rocket equation's $\int dm/m$ sits exactly on this threshold, which is why $\Delta v$ grows without bound as $m_f \to 0$ but only logarithmically — each tenfold increase in mass ratio adds the same $v_e\ln 10 = 2.3\,v_e$ of $\Delta v$.
:::

::: note
The escape-velocity integral and the rocket-equation integral are the two sides of the same threshold. $\int_{R}^{\infty} dr/r^2$ converges, so a finite speed escapes gravity; $\int_{m_f}^{m_0} dm/m$ diverges as $m_f \to 0$, so no finite mass ratio gives unbounded $\Delta v$, but the divergence is so slow that $\Delta v = 3\,v_e$ needs a mass ratio of $e^3 = 20$. Reaching orbit needs about $3\,v_e$ for a kerosene engine, and a structure that is $95\%$ propellant is not buildable in one piece — hence staging.
:::

## Check yourself

::: check
Determine whether $\displaystyle\int_1^\infty\frac{dx}{x^3}$ and $\displaystyle\int_1^\infty\frac{dx}{\sqrt x}$ converge, and evaluate the one that does.
:::

::: answer
By the power test, $p = 3 > 1$ converges and $p = \tfrac12 < 1$ diverges. $\displaystyle\int_1^\infty x^{-3}dx = \lim_{b\to\infty}\left[-\frac{1}{2x^2}\right]_1^b = \lim_{b\to\infty}\left(\frac12 - \frac{1}{2b^2}\right) = \frac12$. For the other, $\displaystyle\int_1^b x^{-1/2}dx = 2\sqrt b - 2 \to \infty$.
:::

::: check
Evaluate $\displaystyle\int_0^\infty x\,e^{-x^2}dx$.
:::

::: answer
Substitute $u = -x^2$, $du = -2x\,dx$: $\displaystyle\int_0^b x e^{-x^2}dx = \left[-\tfrac12 e^{-x^2}\right]_0^b = \tfrac12\left(1 - e^{-b^2}\right) \to \tfrac12$ as $b \to \infty$. The integral converges to $\tfrac12$. (This is half the mean of $|x|$ for a standard normal, up to the normalising constant — the kind of moment integral the probability module computes.)
:::

::: check
Show that $\displaystyle\int_0^1\ln x\,dx$ converges and find its value.
:::

::: answer
$\ln x \to -\infty$ as $x \to 0^+$, so this is a type-II improper integral. By parts, $\int\ln x\,dx = x\ln x - x$, so $\displaystyle\int_\epsilon^1\ln x\,dx = \big[x\ln x - x\big]_\epsilon^1 = -1 - \epsilon\ln\epsilon + \epsilon$. As $\epsilon \to 0^+$, $\epsilon\ln\epsilon \to 0$ (the logarithm diverges more slowly than any power, so $\epsilon$ wins) and the value is $-1$. The partial integrals at $\epsilon = 0.1, 0.01, 0.001$ are $-0.670, -0.944, -0.992$. A logarithmic singularity is always integrable: it is weaker than $x^{-p}$ for every $p > 0$.
:::

::: check
The Moon has $\mu = 4.905 \times 10^{12}\,\mathrm{m^3/s^2}$ and radius $1737\,\mathrm{km}$. What is escape velocity from its surface, and how does it compare with Earth's?
:::

::: answer
$v_{\mathrm{esc}} = \sqrt{2\mu/R} = \sqrt{2 \times 4.905 \times 10^{12}/1.737 \times 10^6} = 2376\,\mathrm{m/s}$, about $21\%$ of Earth's $11.19\,\mathrm{km/s}$. The energy per kilogram to escape, $\mu/R = 2.82\,\mathrm{MJ/kg}$, is less than the $3.70\,\mathrm{MJ/kg}$ needed merely to reach $400\,\mathrm{km}$ above the Earth — the reason a lunar ascent stage can be small.
:::

::: check
Using the by-parts result $\displaystyle\int e^{-at}\sin\omega t\,dt = -\frac{1}{a}e^{-at}\sin\omega t + \frac{\omega}{a}\int e^{-at}\cos\omega t\,dt$ from the previous lesson, find the Laplace transform of $\sin\omega t$ and its region of convergence.
:::

::: answer
Set $a = s > 0$ and integrate from $0$ to $b$. The boundary term $-\tfrac1s e^{-sb}\sin\omega b \to 0$ as $b \to \infty$ because $e^{-sb} \to 0$ and $|\sin| \le 1$; at $b = 0$ it is zero. The remaining integral is $\mathcal{L}\{\cos\omega t\} = \dfrac{s}{s^2 + \omega^2}$. So $\mathcal{L}\{\sin\omega t\} = \dfrac{\omega}{s}\cdot\dfrac{s}{s^2 + \omega^2} = \dfrac{\omega}{s^2 + \omega^2}$, converging for $s > 0$. For $s \le 0$ the factor $e^{-st}$ no longer decays and the oscillating integrand has no limit. At $s = 1$, $\omega = 2$ the transform is $0.4$.
:::

::: check
Does $\displaystyle\int_1^\infty\frac{\sin^2 x}{x^2}\,dx$ converge? You need not evaluate it.
:::

::: answer
Yes. The integrand is non-negative and $\dfrac{\sin^2 x}{x^2} \le \dfrac{1}{x^2}$ for all $x \ge 1$; since $\displaystyle\int_1^\infty x^{-2}dx = 1$ converges, the comparison test gives convergence, with value at most $1$. No antiderivative in elementary terms exists, so comparison is the only route to the answer; a numerical quadrature would then give the value.
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

The integrals in this lesson were all evaluated from known functions. The final lesson turns the problem around: given an equation relating a function to its own derivative — a rocket losing mass, a sensor lagging its input — find the function. For the equations that separate, the answer is one integration on each side.
