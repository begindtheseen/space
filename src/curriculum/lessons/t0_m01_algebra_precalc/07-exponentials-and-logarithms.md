---
id: l07-exponentials-and-logarithms
title: Exponentials, logarithms and the rocket equation
minutes: 17
covers:
  - exponentials and logarithms
---

The exponents lesson had a fixed exponent and a varying base: $r^{-2}$, $r^{3/2}$. This lesson swaps them. In $2^t$, $e^{-h/H}$ or $(0.5)^{t/87.7}$ the *exponent* is the variable, and the function grows or shrinks by a fixed factor every time the input advances by a fixed step. That is how a bank balance grows, how atmospheric density thins with altitude, how a radioisotope power source fades over a mission, and — turned around — how the propellant a rocket needs grows with the velocity change you ask of it.

The logarithm is the inverse of the exponential in exactly the sense of the last lesson: it answers "what exponent gets me here?" Its algebra turns multiplication into addition, which is the reason a launch vehicle is designed stage by stage — the mass ratios of the stages multiply, and the logarithm makes their velocity contributions add. By the end of this lesson you will be able to write the rocket equation, solve it in either direction, and see why a single stage to orbit is so hard from one line of algebra.

The lesson also introduces two constants you will use for the rest of the track: the standard gravity $g_0 = 9.80665\,\mathrm{m/s^2}$ and the relation between an engine's specific impulse and its exhaust velocity.

## Exponential functions

An **exponential function** has the form $f(x) = a^x$ with a fixed positive base $a \neq 1$. Everything the exponents lesson proved still holds — $a^{x+y} = a^x a^y$, $a^{-x} = 1/a^x$, $a^0 = 1$ — but read now as statements about the function. The first says: advancing the input by $y$ multiplies the output by $a^y$, whatever the starting $x$. That constant-ratio property is the defining behaviour. A quantity that grows by $5\%$ every year is $1.05^t$ times its starting value after $t$ years, and it grows by the same $5\%$ in year $30$ as in year $1$ — of a bigger base, so by more in absolute terms. After $10$ years the factor is $1.05^{10} = 1.63$; after $20$, $1.05^{20} = 2.65$, more than twice $1.63$, because exponentials compound.

If $a > 1$ the function increases without bound, faster eventually than any power of $x$: $2^x$ overtakes $x^{10}$ before $x = 60$. If $0 < a < 1$ it decays towards zero without ever reaching it, and $(1/2)^x = 2^{-x}$, so decay is growth with a negative exponent. Both pass through $(0, 1)$, both are always positive, and both are one-to-one, so both have inverses. The natural domain is all real $x$; the range is $(0, \infty)$.

### The number $e$

Among all bases one is special. Compound growth at rate $r$ per year, applied $n$ times a year, gives a factor $\left(1 + \frac{r}{n}\right)^{n}$ per year. Let the compounding become continuous, $n \to \infty$, with $r = 1$: $(1 + 1)^1 = 2$, $(1 + \tfrac{1}{10})^{10} = 2.594$, $(1 + \tfrac{1}{100})^{100} = 2.705$, $(1 + \tfrac{1}{1000})^{1000} = 2.717$. The sequence settles on

$$
e = 2.71828\ldots,
$$

an irrational number like $\pi$. The function $e^x$, also written $\exp(x)$, is the **natural exponential**. Its special property, which the calculus module proves, is that its rate of change equals its value: $e^x$ grows at exactly the speed it has. That makes $e$ the base in which every continuously changing quantity — decaying density, draining propellant, a control loop settling — is most naturally written. Any other exponential is an $e$-exponential in disguise: $2^x = e^{x \ln 2}$, as you will see once logarithms are in hand.

Some anchor values worth carrying: $e^{0.5} = 1.65$, $e^{1} = 2.72$, $e^{2} = 7.39$, $e^{3} = 20.1$, $e^{-1} = 0.368$. An exponent of $3$ is a factor of twenty; an exponent of $-1$ leaves about a third.

## Logarithms as inverse exponentials

Because $a^x$ is one-to-one, it has an inverse. The **logarithm to base $a$** is that inverse:

$$
\log_a x = y \quad\text{means exactly}\quad a^y = x .
$$

A logarithm is an exponent. $\log_2 8 = 3$ because $2^3 = 8$; $\log_{10} 1000 = 3$ because $10^3 = 1000$; $\log_{10} 0.001 = -3$; $\log_a 1 = 0$ for every base because $a^0 = 1$; $\log_a a = 1$. Whenever a logarithm confuses you, rewrite it as the exponential statement it abbreviates.

Two bases matter in practice. The **common logarithm** $\log_{10}$ counts powers of ten — $\log_{10} 7673 = 3.88$ says that $7673$ is $10^{3.88}$, a number between $10^3$ and $10^4$ — and it will run the estimation lesson at the end of the module. The **natural logarithm** $\ln x = \log_e x$ is the inverse of $e^x$ and is the one that appears in physics. Since the two functions undo each other,

$$
\ln(e^x) = x, \qquad e^{\ln x} = x \;\; (x > 0) .
$$

The domain of every logarithm is $(0, \infty)$ — the range of the exponential — and the range is all real numbers. There is no logarithm of zero or of a negative number, for the same reason there is no exponent that makes $a^y \leq 0$. The graph of $\ln x$ is the graph of $e^x$ reflected across $y = x$: through $(1, 0)$, steep near zero, and rising ever more slowly. $\ln 2 = 0.693$, $\ln 10 = 2.303$, $\ln 1000 = 6.91$, and $\ln(3.986 \times 10^{14}) = 33.6$: a factor of $4 \times 10^{14}$ in the argument becomes a factor of $34$ in the logarithm. Logarithms compress.

## The laws of logarithms

Every law of logarithms is an exponent law read backwards. Let $x = a^m$ and $y = a^n$, so that $m = \log_a x$ and $n = \log_a y$.

**Product.** $xy = a^m a^n = a^{m+n}$, so the exponent that produces $xy$ is $m + n$:

$$
\log_a (xy) = \log_a x + \log_a y .
$$

**Quotient.** $x/y = a^{m-n}$, so

$$
\log_a \frac{x}{y} = \log_a x - \log_a y .
$$

**Power.** $x^p = (a^m)^p = a^{mp}$, so

$$
\log_a (x^p) = p \log_a x .
$$

The power law is the product law applied $p$ times, and it includes roots: $\log_a \sqrt{x} = \tfrac{1}{2}\log_a x$. Check the laws with numbers you know: $\log_{10}(100 \times 1000) = \log_{10} 10^5 = 5 = 2 + 3$; $\log_2(1024/8) = \log_2 128 = 7 = 10 - 3$.

**Change of base.** Calculators and programming languages give you $\ln$ and $\log_{10}$, not $\log_2$ or $\log_{1.05}$. Start from $x = b^y$ with $y = \log_b x$ and take $\ln$ of both sides: $\ln x = y \ln b$ by the power law, so

$$
\log_b x = \frac{\ln x}{\ln b} .
$$

Any base works in place of $\ln$, since the same argument runs with $\log_{10}$. So $\log_2 1024 = \ln 1024 / \ln 2 = 6.931 / 0.6931 = 10$, and the equation $2^x = 10$ is solved by $x = \log_2 10 = \ln 10 / \ln 2 = 2.303 / 0.693 = 3.32$: ten is a little more than three doublings, which agrees with $2^3 = 8$. The same identity, run the other way, is the promise made above: $b^x = e^{x \ln b}$, so every exponential is a natural exponential with a scaled exponent.

::: key Laws of logarithms
$\log(ab) = \log a + \log b$; $\log(a/b) = \log a - \log b$; $\log(a^n) = n \log a$; $\log_a 1 = 0$; $\log_a a = 1$. Logs turn multiplication into addition. Change of base: $\log_b(x) = \ln(x) / \ln(b)$. $\ln$ is $\log_e$ with $e = 2.71828\ldots$, and $\ln(e^x) = x$, $e^{\ln x} = x$.
:::

::: warning There is no law for the log of a sum
$\log(a + b)$ is not $\log a + \log b$, and it does not simplify at all. Test: $\log_{10}(10 + 100) = \log_{10} 110 = 2.04$, while $\log_{10} 10 + \log_{10} 100 = 3$. Likewise $(\ln x)^2$ and $\ln(x^2) = 2\ln x$ are different things, and $\ln x / \ln y$ is not $\ln(x/y)$. When you cannot name the law that justifies a step, there is no such law.
:::

## Solving exponential and logarithmic equations

Because the two functions are inverses, each undoes the other, and that is the whole method. If the unknown is in an exponent, take a logarithm of both sides (the equation's sides are positive, so this is legal) and use the power law to bring the exponent down. If the unknown is inside a logarithm, exponentiate both sides — and then check the candidate in the original, because the domain restriction $x > 0$ can reject it.

Atmospheric density in the simplest model falls as $\rho(h) = \rho_0 e^{-h/H}$, with sea-level density $\rho_0 = 1.225\,\mathrm{kg/m^3}$ and a **scale height** $H \approx 8.5\,\mathrm{km}$: every $8.5\,\mathrm{km}$ of altitude divides the density by $e$. At what altitude is the density a thousandth of its sea-level value? Set $\rho_0 e^{-h/H} = \rho_0 / 1000$, divide by $\rho_0$, and take $\ln$:

$$
-\frac{h}{H} = \ln\frac{1}{1000} = -\ln 1000 \quad\Rightarrow\quad h = H \ln 1000 = 8.5 \times 6.908 = 58.7\,\mathrm{km} .
$$

The density halves at $h = H \ln 2 = 5.9\,\mathrm{km}$, about the height of the tallest mountains — consistent with climbers needing oxygen. The model is crude above $100\,\mathrm{km}$ or so, but its shape, and the way $\ln$ pulled $h$ out of the exponent, are exactly right.

::: example An isotope power source over a mission
A plutonium-238 heat source loses power by radioactive decay with a **half-life** of $87.7$ years: whatever the power is now, it is half that $87.7$ years later. So the fraction remaining after $t$ years is

$$
f(t) = \left(\tfrac{1}{2}\right)^{t / 87.7} .
$$

After a $14$-year mission, $f = 0.5^{14/87.7} = 0.5^{0.1596}$. Rewrite with base $e$: $0.5^{0.1596} = e^{0.1596 \ln 0.5} = e^{-0.1106} = 0.895$. About $10.5\%$ of the thermal power has gone.

The same law in natural form is $f(t) = e^{-\lambda t}$ with **decay constant** $\lambda$. Matching the two forms at $t = 87.7$: $e^{-87.7\lambda} = \tfrac{1}{2}$, so $\lambda = \ln 2 / 87.7 = 0.00790\,\mathrm{yr^{-1}}$. In general $\lambda = \ln 2 / t_{1/2}$, and every half-life problem is a decay-constant problem in disguise. When does the source fall to $70\%$? Solve $e^{-\lambda t} = 0.7$: $t = -\ln 0.7 / \lambda = 0.3567 / 0.00790 = 45.1$ years. The mission planner reads that as the design life of any instrument that needs seventy percent of launch power.
:::

## Standard gravity and specific impulse

Before the rocket equation, two definitions. The **standard gravity**

$$
g_0 = 9.80665\,\mathrm{m/s^2}
$$

is a defined constant — a conventional number agreed in 1901, not a measurement, and not the local gravity at your pad (which is $9.78$ at the equator, $9.83$ at the poles, and $9.82$ from the inverse-square law of the exponents lesson). Its job is to convert between mass and weight in a fixed, reproducible way, and it is what the symbol means whenever you see it in a propulsion formula.

An engine's **specific impulse** $I_{sp}$ is the impulse (force times time) it delivers per unit *weight* of propellant, and it comes out in seconds. The corresponding **effective exhaust velocity** is

$$
v_e = I_{sp}\, g_0 .
$$

An $I_{sp}$ of $311\,\mathrm{s}$ — typical of a kerosene–oxygen engine at sea level — means $v_e = 311 \times 9.80665 = 3050\,\mathrm{m/s}$; a hydrogen–oxygen upper stage at $452\,\mathrm{s}$ gives $4430\,\mathrm{m/s}$. The seconds are a historical convenience (the number is the same in US customary and SI units, because $g_0$ cancels the unit system); the velocity is the physical quantity, and the $g_0$ in the definition is *always* the standard value, never the local one.

::: key Standard gravity and exhaust velocity
$g_0 = 9.80665\,\mathrm{m/s^2}$, a defined constant. $v_e = I_{sp} \cdot g_0$; an $I_{sp}$ of $311\,\mathrm{s}$ gives $v_e \approx 3050\,\mathrm{m/s}$.
:::

## The rocket equation

A rocket accelerates by throwing mass backwards. The dynamics module derives the result from conservation of momentum; here is what it says and why the logarithm is in it. Expelling a small mass $\Delta m$ at speed $v_e$ relative to the vehicle gives the remaining mass $m$ a velocity increment of about $v_e\,\Delta m / m$: the same $\Delta m$ buys more speed when the vehicle is lighter. Each equal parcel of propellant therefore adds a *larger* fraction of the remaining mass than the last, and the total velocity change comes from summing $\Delta m / m$ as $m$ runs from $m_0$ down to $m_f$. That sum is exactly what the natural logarithm measures — the calculus module shows that the "sum of $\Delta m / m$" is $\ln(m_0/m_f)$ — and the result is the **Tsiolkovsky rocket equation**:

$$
\Delta v = v_e \ln\frac{m_0}{m_f} = v_e \ln MR .
$$

Here $\Delta v$ is the velocity change the burn delivers in the absence of gravity and drag, $v_e = I_{sp} g_0$, and $MR = m_0 / m_f$ is the mass ratio from the first lesson. The argument of the logarithm is dimensionless, as it must be, and the units of $\Delta v$ are those of $v_e$.

Solving it the other way is where the algebra of this lesson pays off. Divide by $v_e$ and exponentiate:

$$
MR = e^{\Delta v / v_e}, \qquad m_f = m_0\, e^{-\Delta v / v_e}, \qquad \frac{m_p}{m_0} = 1 - e^{-\Delta v / v_e} .
$$

The mass ratio grows *exponentially* with the $\Delta v$ demanded. Reaching low Earth orbit takes about $9.4\,\mathrm{km/s}$ once gravity and drag losses are counted. With $v_e = 3050\,\mathrm{m/s}$ that requires $MR = e^{9400/3050} = e^{3.08} = 21.8$: the vehicle at lift-off must weigh nearly twenty-two times what reaches orbit, so $1 - 1/21.8 = 95.4\%$ of it must be propellant, leaving $4.6\%$ for tanks, engines, structure *and* payload. That is why single-stage-to-orbit with chemical propulsion is so nearly impossible, and it fell out of one exponential.

::: example How much can a stage deliver?
A vehicle of lift-off mass $m_0 = 549\,\mathrm{t}$ has engines with $I_{sp} = 311\,\mathrm{s}$, so $v_e = 3050\,\mathrm{m/s}$. What mass remains after the stage has delivered $\Delta v = 3000\,\mathrm{m/s}$?

$$
m_f = m_0\, e^{-\Delta v / v_e} = 549 \times e^{-3000/3050} = 549 \times e^{-0.9836} = 549 \times 0.374 = 205\,\mathrm{t} .
$$

So $549 - 205 = 344\,\mathrm{t}$ of propellant is consumed. Check by running forward: $MR = 549/205 = 2.68$, $\ln 2.68 = 0.984$, $v_e \ln MR = 3050 \times 0.984 = 3000\,\mathrm{m/s}$. Now the inverse question with different numbers: an upper stage with $v_e = 4430\,\mathrm{m/s}$ must supply $\Delta v = 6000\,\mathrm{m/s}$. Then $MR = e^{6000/4430} = e^{1.354} = 3.87$, and the propellant fraction of that stage at ignition is $1 - 1/3.87 = 0.742$. Three-quarters of the stage must be propellant before any structure is counted.
:::

### Why staging works: logs add

Suppose a vehicle has two stages. The first burns with mass ratio $MR_1$ and exhaust velocity $v_{e1}$, is dropped, and the second burns with $MR_2$ and $v_{e2}$. Each burn obeys the rocket equation on its own, so the total is

$$
\Delta v = v_{e1} \ln MR_1 + v_{e2} \ln MR_2 .
$$

If the exhaust velocities are equal, the product law collapses this to $v_e \ln(MR_1 MR_2)$: the *mass ratios multiply* while the *velocity increments add*. Two stages of $MR = 4.5$ each, with $v_e = 3050\,\mathrm{m/s}$, deliver $2 \times 3050 \times \ln 4.5 = 2 \times 4587 = 9175\,\mathrm{m/s}$ — enough for orbit — and the equivalent single-stage mass ratio is $4.5^2 = 20.25$. But no single stage could *be* built with $MR = 20.25$, because it would have to carry its emptied first-stage tanks all the way up; splitting the vehicle lets the second stage start with a fresh, smaller $m_0$. The logarithm is what makes this a stage-by-stage sum, and it is why every launch vehicle analysis is a table of per-stage $\Delta v$ that are added.

::: key The rocket equation
$\Delta v = v_e \ln(m_0/m_f) = v_e \ln MR$, with $v_e = I_{sp} g_0$. Inverted: $MR = e^{\Delta v / v_e}$ and $m_f = m_0 e^{-\Delta v/v_e}$. Stage mass ratios multiply; because $\ln(MR_1 MR_2) = \ln MR_1 + \ln MR_2$, stage $\Delta v$'s add.
:::

::: warning The exponent is the ratio, not the answer
Given $\Delta v / v_e = 0.667$, the mass ratio is $e^{0.667} = 1.95$, not $0.667$ and not $e = 2.72$. Learners in a hurry report the exponent, or report $e$ itself because "the answer has $e$ in it". Always finish the exponentiation, and sanity-check that $MR > 1$ and grows as $\Delta v$ grows.
:::

## Logarithmic scales

Because logarithms compress, engineers plot on them. A quantity spanning $10^{-6}$ to $10^{3}$ is unreadable on a linear axis and perfectly clear on a $\log_{10}$ axis, where each decade is the same width. A **decibel** is ten times the $\log_{10}$ of a power ratio, so $+3\,\mathrm{dB}$ is a factor of $10^{0.3} = 2$ in power and $+10\,\mathrm{dB}$ is a factor of ten; a link budget that "loses $6\,\mathrm{dB}$" has lost three quarters of its signal power. The control modules will spend weeks on Bode plots, which are logarithmic in both frequency and gain, and the reason they are is the product law: gains that multiply in series add on a log plot.

A cheap habit to start now: when a number is large or small, know its common logarithm to one decimal. $\log_{10} 2 = 0.30$, $\log_{10} 3 = 0.48$, $\log_{10} 5 = 0.70$. Then $\log_{10}(4.45 \times 10^6) = \log_{10} 4.45 + 6 \approx 0.65 + 6 = 6.65$, and you can multiply and divide big numbers by adding and subtracting small ones. The estimation lesson is built on it.

## Check yourself

::: check
Without a calculator, evaluate $\log_2 32$, $\log_{10} 0.01$, $\ln e^{4}$ and $\log_5 1$.
:::

::: answer
$2^5 = 32$, so $\log_2 32 = 5$. $10^{-2} = 0.01$, so $\log_{10} 0.01 = -2$. $\ln e^4 = 4$ since $\ln$ undoes $e^{(\cdot)}$. $5^0 = 1$, so $\log_5 1 = 0$.
:::

::: check
Write $2\ln x - \tfrac{1}{2}\ln y + \ln 3$ as a single logarithm, and expand $\ln\dfrac{\sqrt{a}\,b^3}{c}$ into a sum of simple terms.
:::

::: answer
Power law first: $2\ln x = \ln x^2$ and $\tfrac{1}{2}\ln y = \ln\sqrt{y}$. Then product and quotient: $\ln x^2 + \ln 3 - \ln\sqrt{y} = \ln\dfrac{3x^2}{\sqrt{y}}$. For the second: $\ln\sqrt{a} + \ln b^3 - \ln c = \tfrac{1}{2}\ln a + 3\ln b - \ln c$.
:::

::: check
A balance grows by $5\%$ a year. How long until it doubles? Explain the "rule of $70$" that bankers use for this.
:::

::: answer
Solve $1.05^t = 2$: $t = \ln 2 / \ln 1.05 = 0.6931 / 0.04879 = 14.2$ years. For a small rate $r$ (as a fraction), $\ln(1 + r) \approx r$, so $t \approx \ln 2 / r = 0.693 / r$, or $69.3$ divided by the rate in percent — rounded to $70$ for mental arithmetic: $70 / 5 = 14$ years. The approximation is good to a few percent for rates under $10\%$.
:::

::: check
An engine has $I_{sp} = 348\,\mathrm{s}$. What is its effective exhaust velocity, and what $\Delta v$ does a stage with $MR = 6$ deliver with it?
:::

::: answer
$v_e = 348 \times 9.80665 = 3413\,\mathrm{m/s}$. $\Delta v = v_e \ln 6 = 3413 \times 1.792 = 6115\,\mathrm{m/s}$, about $6.1\,\mathrm{km/s}$. Note $g_0$ is the standard value regardless of where the engine flies.
:::

::: check
Two stages with $v_{e1} = 3050\,\mathrm{m/s}$, $MR_1 = 3.5$ and $v_{e2} = 3400\,\mathrm{m/s}$, $MR_2 = 5$. What total $\Delta v$ do they deliver, and why can you not collapse the two logarithms into one?
:::

::: answer
$\Delta v_1 = 3050 \ln 3.5 = 3050 \times 1.253 = 3821\,\mathrm{m/s}$ and $\Delta v_2 = 3400 \ln 5 = 3400 \times 1.609 = 5472\,\mathrm{m/s}$, total $9293\,\mathrm{m/s}$. The product law $\ln MR_1 + \ln MR_2 = \ln(MR_1 MR_2)$ needs a common factor in front; with different $v_e$'s the two terms have different coefficients, so the sum stays a sum. You could write it as $\ln(MR_1^{v_{e1}} MR_2^{v_{e2}})$ by the power law, but that is no simpler.
:::

::: check
Solve $\ln(x - 3) + \ln x = \ln 10$.
:::

::: answer
Product law on the left: $\ln(x(x - 3)) = \ln 10$, so $x^2 - 3x = 10$, $x^2 - 3x - 10 = (x - 5)(x + 2) = 0$, giving $x = 5$ or $x = -2$. The candidate $-2$ makes $\ln(x - 3) = \ln(-5)$, undefined, so it is rejected. The solution is $x = 5$; check: $\ln 2 + \ln 5 = \ln 10$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Exponential $a^x$ | fixed ratio per fixed step; domain $\mathbb{R}$, range $(0, \infty)$; growth for $a > 1$, decay for $a < 1$ |
| $e$ | $2.71828\ldots$, the limit of $(1 + 1/n)^n$; $e^x = \exp(x)$ grows at the rate of its own value |
| Logarithm | $\log_a x = y \iff a^y = x$; domain $(0, \infty)$; $\log_a 1 = 0$, $\log_a a = 1$ |
| Laws | $\log(ab) = \log a + \log b$, $\log(a/b) = \log a - \log b$, $\log a^n = n\log a$ |
| Change of base | $\log_b x = \ln x / \ln b$; also $b^x = e^{x \ln b}$ |
| No law | $\log(a + b)$ does not simplify |
| Solving | unknown in exponent: take $\ln$; unknown in log: exponentiate, then check $x > 0$ |
| Half-life | $f(t) = (1/2)^{t/t_{1/2}} = e^{-\lambda t}$ with $\lambda = \ln 2 / t_{1/2}$ |
| Scale height | $\rho = \rho_0 e^{-h/H}$, $H \approx 8.5\,\mathrm{km}$ |
| $g_0$ | $9.80665\,\mathrm{m/s^2}$, defined constant |
| $I_{sp}$ | $v_e = I_{sp} g_0$; $311\,\mathrm{s} \Rightarrow 3050\,\mathrm{m/s}$ |
| Rocket equation | $\Delta v = v_e \ln MR$, $MR = e^{\Delta v/v_e}$; stage $\Delta v$'s add |
| Anchors | $\ln 2 = 0.693$, $\ln 10 = 2.303$, $\log_{10} 2 = 0.30$, $e^3 \approx 20$ |

The next lesson takes the "sum of many small contributions" idea that produced the rocket equation and gives it notation: sequences, series, and the sigma sign, including the geometric series that a fixed-ratio process always generates.
