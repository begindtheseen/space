---
id: l07-exponentials-and-logarithms
title: Exponentials, logarithms and the rocket equation
minutes: 21
covers:
  - exponentials and logarithms
---

Suppose someone offers you a deal: one cent today, two cents tomorrow, four the day after, doubling every day for a month. It sounds like pocket change. By day 30 the payment alone is [[over five million dollars|penny-doubling]]. Things that grow by the same *factor* every step start slow and then explode. That kind of growth is called **exponential**, and it is the first half of this lesson.

The exponents lesson had a fixed power and a changing base: $r^{-2}$, $r^{3/2}$. This lesson swaps them. In $2^t$, $e^{-h/H}$ or $(0.5)^{t/87.7}$, the *exponent* is the thing that changes. Each time the input moves on by a fixed step, the output gets multiplied by a fixed factor. That is how savings grow, how the air thins as you climb, how a [[nuclear battery|rtg]] on a space probe fades over a mission — and, turned around, how the fuel a rocket needs grows with the change in speed you ask of it.

The second half is the **[[logarithm|logarithm-word]]**, the inverse of the exponential in exactly the sense of the last lesson. It answers the question "what exponent gets me here?" — for the penny deal, "how many doublings until I have a million?" Its rules turn multiplying into adding. That is the reason rockets are built in stages: the stages' mass ratios multiply, and the logarithm makes their speed gains add. By the end you will be able to write the rocket equation, solve it both ways, and see in one line why a single-stage rocket to orbit is so hard. Along the way you meet two numbers you will use for the rest of the course: the standard gravity $g_0$, and the link between an engine's specific impulse and its exhaust speed.

## Exponential functions

An **exponential function** has the form

$$
f(x) = a^x
$$

where the **base** $a$ is a fixed positive number, not equal to $1$, and the input $x$ sits up in the exponent.

Everything the exponents lesson proved still holds — $a^{x+y} = a^x a^y$, $a^{-x} = 1/a^x$, $a^0 = 1$ — but now read it as a fact about the function. The first rule says: *move the input on by $y$, and the output gets multiplied by $a^y$, wherever you started.* That fixed-factor-per-step behaviour is what makes a function exponential.

Take savings that grow by $5\%$ a year. Each year the balance is multiplied by $1.05$, so after $t$ years it is $1.05^t$ times what you started with. Year 30 adds the same $5\%$ as year 1 — but $5\%$ of a bigger balance, so more dollars. After $10$ years the factor is $1.05^{10} = 1.63$. After $20$ it is $1.05^{20} = 2.65$ — more than twice $1.63$, because the growth itself grows. That is **compounding**.

If $a > 1$, the function grows without limit, and eventually faster than any power of $x$: $2^x$ overtakes $x^{10}$ before $x = 60$. If $0 < a < 1$, it shrinks towards zero without ever getting there — think of a ball that bounces back to half its height every time. Since $(1/2)^x = 2^{-x}$, **decay** is growth with a negative exponent.

Both kinds pass through the point $(0, 1)$, because $a^0 = 1$. Both are always positive. Both are one-to-one — they only go up, or only go down — so both can be run backwards. The natural domain is every number; the range is $(0, \infty)$.

### The number $e$

Among all bases, one is special, and [[banks found it|who-found-e]].

Say a bank pays $100\%$ interest a year. Paid once, at year's end, your money doubles: a factor $(1 + 1)^1 = 2$. Now say it pays in instalments — $\tfrac{1}{10}$ of the interest, ten times a year, each time on the whole balance so far. The factor becomes $(1 + \tfrac{1}{10})^{10} = 2.594$. Pay a hundred times, $(1 + \tfrac{1}{100})^{100} = 2.705$. A thousand times, $(1 + \tfrac{1}{1000})^{1000} = 2.717$. In general, $n$ payments at rate $r$ give $\left(1 + \frac{r}{n}\right)^{n}$, here with $r = 1$.

More payments help, but less and less. As $n$ grows without end ("continuous compounding"), the factor settles on a fixed number,

$$
e = 2.71828\ldots,
$$

whose digits never end or repeat, like $\pi$. The function $e^x$, also written $\exp(x)$, is the **natural exponential**. Its special property, proved in the calculus module, is that *its rate of growth equals its own value*: $e^x$ grows at exactly the speed it has. That makes $e$ the natural base for anything that changes smoothly — air thinning with height, fuel draining, a control loop settling down. Every other exponential is an $e$-exponential in disguise: $2^x = e^{x \ln 2}$, as you will see once logarithms are in hand.

Some values worth remembering: $e^{0.5} = 1.65$, $e^{1} = 2.72$, $e^{2} = 7.39$, $e^{3} = 20.1$, $e^{-1} = 0.368$. So an exponent of $3$ is a factor of about twenty, and an exponent of $-1$ leaves about a third.

## Logarithms: what exponent gets me here?

$\log_{10} 1000$ asks: "how many $10$s do I multiply to get $1000$?" Three: $10 \times 10 \times 10$. So $\log_{10} 1000 = 3$ — the number of zeros.

In general, because $a^x$ is one-to-one, it has an inverse, and the **logarithm to base $a$** is that inverse:

$$
\log_a x = y \quad\text{means exactly}\quad a^y = x .
$$

Read $\log_a x$ aloud as "log base a of x". **A logarithm is an exponent.** Some examples:

- $\log_2 8 = 3$, because $2^3 = 8$.
- $\log_{10} 0.001 = -3$, because $10^{-3} = 0.001$.
- $\log_a 1 = 0$ for every base, because $a^0 = 1$.
- $\log_a a = 1$, because $a^1 = a$.

Whenever a logarithm confuses you, rewrite it as the exponent statement it stands for.

Two bases matter in practice. The **common logarithm** $\log_{10}$ counts powers of ten. $\log_{10} 7673 = 3.88$ says that $7673 = 10^{3.88}$, a number between $10^3$ and $10^4$ — roughly "three point nine zeros". It will run the estimation lesson at the end of the module. The **natural logarithm**, written $\ln x$ (say "L-N of x") and meaning $\log_e x$, is the inverse of $e^x$. It is the one that turns up in physics. Since the two undo each other,

$$
\ln(e^x) = x, \qquad e^{\ln x} = x \;\; (x > 0) .
$$

The domain of every logarithm is $(0, \infty)$ — the range of the exponential. Its range is every number. There is no logarithm of zero or of a negative number, because no exponent can make $a^y$ zero or negative.

The graph of $\ln x$ is the graph of $e^x$ flipped across the line $y = x$. It passes through $(1, 0)$, is steep near zero, and then rises more and more slowly. Look at how slowly: $\ln 2 = 0.693$, $\ln 10 = 2.303$, $\ln 1000 = 6.91$, and $\ln(3.986 \times 10^{14}) = 33.6$. A number four hundred trillion times bigger than $1$ has a logarithm of only $34$. Logarithms squash huge ranges into small ones.

## The laws of logarithms

Here is the picture behind all of them. $100$ has two zeros and $1000$ has three. Multiply them: $100 \times 1000 = 100\,000$, which has $2 + 3 = 5$ zeros. **Multiplying numbers adds their logarithms.**

The precise rules:

$$
\log_a (xy) = \log_a x + \log_a y \qquad \text{(product)}
$$

$$
\log_a \frac{x}{y} = \log_a x - \log_a y \qquad \text{(quotient)}
$$

$$
\log_a (x^p) = p \log_a x \qquad \text{(power)}
$$

The power law is the product law used $p$ times, and it covers roots too: $\log_a \sqrt{x} = \tfrac{1}{2}\log_a x$, because $\sqrt{x} = x^{1/2}$.

Check them with numbers you know. $\log_{10}(100 \times 1000) = \log_{10} 10^5 = 5 = 2 + 3$. And $\log_2(1024/8) = \log_2 128 = 7 = 10 - 3$, since $2^{10} = 1024$, $2^3 = 8$ and $2^7 = 128$.

::: note Why the laws have to be true
Every law of logarithms is an exponent law read backwards. Let $x = a^m$ and $y = a^n$, so $m = \log_a x$ and $n = \log_a y$.

**Product:** $xy = a^m a^n = a^{m+n}$. The exponent that makes $xy$ is $m + n$, so $\log_a(xy) = m + n = \log_a x + \log_a y$.

**Quotient:** $x/y = a^m / a^n = a^{m-n}$, so $\log_a(x/y) = m - n$.

**Power:** $x^p = (a^m)^p = a^{mp}$, so $\log_a(x^p) = mp = p \log_a x$.
:::

### Change of base

Calculators and programming languages give you $\ln$ and $\log_{10}$, but not $\log_2$ or $\log_{1.05}$. The fix is the **change-of-base formula**:

$$
\log_b x = \frac{\ln x}{\ln b} .
$$

Where it comes from: let $y = \log_b x$, which means $x = b^y$. Take $\ln$ of both sides and use the power law: $\ln x = y \ln b$. Divide by $\ln b$ and you have $y = \ln x / \ln b$. Any base would work in place of $\ln$ — the same steps run with $\log_{10}$.

So $\log_2 1024 = \ln 1024 / \ln 2 = 6.931 / 0.6931 = 10$. And the equation $2^x = 10$ ("how many doublings make ten?") is solved by

$$
x = \log_2 10 = \frac{\ln 10}{\ln 2} = \frac{2.303}{0.693} = 3.32 .
$$

A little more than three doublings — which makes sense, since three doublings give $2^3 = 8$ and four give $16$.

Run the same identity the other way and you get the promise made earlier: $b = e^{\ln b}$, so $b^x = e^{x \ln b}$. Every exponential is a natural exponential with a stretched exponent.

::: key Laws of logarithms
$\log(ab) = \log a + \log b$; $\log(a/b) = \log a - \log b$; $\log(a^n) = n \log a$; $\log_a 1 = 0$; $\log_a a = 1$. Logs turn multiplication into addition. Change of base: $\log_b(x) = \ln(x) / \ln(b)$. $\ln$ is $\log_e$ with $e = 2.71828\ldots$, and $\ln(e^x) = x$, $e^{\ln x} = x$.
:::

::: warning There is no law for the log of a sum
$\log(a + b)$ is not $\log a + \log b$, and it does not simplify at all. Test it: $\log_{10}(10 + 100) = \log_{10} 110 = 2.04$, while $\log_{10} 10 + \log_{10} 100 = 1 + 2 = 3$. In the same way, $(\ln x)^2$ is not $\ln(x^2) = 2\ln x$, and $\ln x / \ln y$ is not $\ln(x/y)$. If you cannot name the law that allows a step, there is no such law.
:::

## Solving exponential and logarithmic equations

The exponential and the logarithm undo each other, and that is the whole method.

- **Unknown up in an exponent?** Take the logarithm of both sides (allowed, since both sides are positive). The power law brings the exponent down to where you can reach it.
- **Unknown inside a logarithm?** Make each side the exponent of $e$ (or of the log's base) — "exponentiate" — which undoes the log. Then **check** your answer in the original equation. Logs only accept positive inputs, and that can rule out an answer the algebra produced.

Here is one from the atmosphere. In the simplest model, air density falls with height $h$ as

$$
\rho(h) = \rho_0 e^{-h/H} .
$$

Here $\rho$ ("rho") is density, $\rho_0 = 1.225\,\mathrm{kg/m^3}$ ("rho nought") is its value at sea level, and $H \approx 8.5\,\mathrm{km}$ is the **[[scale height|scale-height]]**: every $8.5\,\mathrm{km}$ you climb, the density is divided by $e$.

At what height is the air a thousandth as dense as at sea level? Set $\rho_0 e^{-h/H} = \rho_0 / 1000$. Divide both sides by $\rho_0$: $e^{-h/H} = 1/1000$. Take $\ln$ of both sides:

$$
-\frac{h}{H} = \ln\frac{1}{1000} = -\ln 1000 \quad\Rightarrow\quad h = H \ln 1000 = 8.5 \times 6.908 = 58.7\,\mathrm{km} .
$$

(Here $\ln(1/1000) = -\ln 1000$ is the quotient law, since $\ln 1 = 0$.) In the same way, the density halves at $h = H \ln 2 = 8.5 \times 0.693 = 5.9\,\mathrm{km}$, about the height of the tallest mountains — which fits with climbers there needing bottled oxygen. The model gets rough above about $100\,\mathrm{km}$, but its shape, and the way $\ln$ pulled $h$ out of the exponent, are exactly right.

::: example A nuclear battery over a mission
Deep-space probes are often powered by the heat of plutonium-238. It loses power by radioactive decay, with a **half-life** of $87.7$ years: whatever the power is now, it will be half that $87.7$ years later. So the fraction remaining after $t$ years is

$$
f(t) = \left(\tfrac{1}{2}\right)^{t / 87.7} .
$$

(Check: at $t = 87.7$ the exponent is $1$ and $f = \tfrac{1}{2}$.)

**After a $14$-year mission.** The exponent is $14 / 87.7 = 0.1596$, so $f = 0.5^{0.1596}$. To work that out, rewrite with base $e$ using $b^x = e^{x \ln b}$:

$$
0.5^{0.1596} = e^{0.1596 \ln 0.5} = e^{0.1596 \times (-0.693)} = e^{-0.1106} = 0.895 .
$$

About $10.5\%$ of the heat output is gone. Less than a fifth of a half-life passed, so losing a bit more than a tenth sounds right.

**The natural form.** The same law can be written $f(t) = e^{-\lambda t}$, with a **decay constant** $\lambda$ ("lambda"). Match the two forms at $t = 87.7$, where $f$ must be $\tfrac{1}{2}$: $e^{-87.7\lambda} = \tfrac{1}{2}$. Take $\ln$: $-87.7\lambda = \ln \tfrac{1}{2} = -\ln 2$, so

$$
\lambda = \frac{\ln 2}{87.7} = 0.00790\,\mathrm{yr^{-1}} .
$$

In general, $\lambda = \ln 2 / t_{1/2}$, where $t_{1/2}$ is the half-life. Every half-life problem is a decay-constant problem in disguise.

**When does it fall to $70\%$?** Solve $e^{-\lambda t} = 0.7$. Take $\ln$: $-\lambda t = \ln 0.7 = -0.3567$. So $t = 0.3567 / 0.00790 = 45.1$ years. A mission planner reads that as the design life of any instrument that needs seventy percent of its launch power.
:::

## Standard gravity and specific impulse

Two definitions before the rocket equation.

The **standard gravity** is

$$
g_0 = 9.80665\,\mathrm{m/s^2} .
$$

It is a *defined* number, agreed on in 1901 — not a measurement, and not the actual gravity at your launch pad. (That is about $9.78$ at the equator, $9.83$ at the poles, and $9.82$ from the inverse-square law of the exponents lesson.) Its job is to turn mass into weight in one fixed, agreed way. Whenever $g_0$ appears in a rocket-engine formula, it means this exact value.

Next, how good is an engine? A push (a force) kept up for some time delivers an **impulse**: force times time. An engine's **[[specific impulse|specific-word]]**, $I_{sp}$ ("I sub s p"), is the impulse it gets out of each unit of propellant *weight*. Force times time, divided by a force, leaves a time — so $I_{sp}$ is measured in seconds. A bigger number means more push from the same propellant, like a car's miles per gallon.

The physical quantity behind it is the **effective exhaust velocity**, how fast the engine effectively throws its exhaust out the back:

$$
v_e = I_{sp}\, g_0 .
$$

An $I_{sp}$ of $311\,\mathrm{s}$ — typical for a kerosene-and-oxygen engine at sea level — means $v_e = 311 \times 9.80665 = 3050\,\mathrm{m/s}$. A hydrogen-and-oxygen upper stage at $452\,\mathrm{s}$ gives about $4430\,\mathrm{m/s}$. The seconds are a historical convenience: the number comes out the same in US customary and SI units, because $g_0$ cancels the unit system. The velocity is what really matters, and the $g_0$ in it is *always* the standard value, never the local one.

::: key Standard gravity and exhaust velocity
$g_0 = 9.80665\,\mathrm{m/s^2}$, a defined constant. $v_e = I_{sp} \cdot g_0$; an $I_{sp}$ of $311\,\mathrm{s}$ gives $v_e \approx 3050\,\mathrm{m/s}$.
:::

## The rocket equation

Stand on a skateboard holding a pile of heavy balls. Throw one backwards, hard, and you roll forwards a little. Throw another and you speed up a little more. That is all a rocket does: it throws mass out the back.

Here is the key detail. Each throw pushes you with the same kick, but as the pile shrinks, *you* get lighter. The same kick moves a lighter you more. So the last few balls give you much more speed than the first few.

In symbols: throwing a small mass $\Delta m$ backwards at speed $v_e$ gives the remaining mass $m$ an extra speed of about $v_e\,\Delta m / m$. Divide by a smaller $m$ and you get a bigger gain. The total change in speed comes from adding up $\Delta m / m$ over every throw, as the mass goes from $m_0$ down to $m_f$. That sum is exactly what the natural logarithm measures — the sequences lesson and the calculus module show that the "sum of $\Delta m / m$" is $\ln(m_0/m_f)$. The dynamics module derives the whole thing from conservation of momentum. The result is the **[[Tsiolkovsky rocket equation|tsiolkovsky]]**:

$$
\Delta v = v_e \ln\frac{m_0}{m_f} = v_e \ln MR .
$$

Here $\Delta v$ ("delta v") is the change in speed the burn gives, if there were no gravity or air to fight. $v_e = I_{sp} g_0$ is the exhaust velocity. And $MR = m_0 / m_f$ is the mass ratio from the first lesson: lift-off mass over burnout mass. The inside of the logarithm is a plain number with no units, as it must be, and $\Delta v$ has the units of $v_e$.

### Running it backwards

Solving it the other way is where this lesson pays off. Divide both sides by $v_e$ to get $\ln MR = \Delta v / v_e$. Then exponentiate — make each side a power of $e$ — which undoes the $\ln$:

$$
MR = e^{\Delta v / v_e}, \qquad m_f = m_0\, e^{-\Delta v / v_e}, \qquad \frac{m_p}{m_0} = 1 - e^{-\Delta v / v_e} .
$$

(The second comes from $m_f = m_0 / MR$. The third is the propellant mass $m_p = m_0 - m_f$ as a fraction of $m_0$.)

The mass ratio grows *exponentially* with the $\Delta v$ you ask for. Reaching low Earth orbit takes about $9.4\,\mathrm{km/s}$, once the losses to gravity and air are counted. With $v_e = 3050\,\mathrm{m/s}$:

$$
MR = e^{9400/3050} = e^{3.08} = 21.8 .
$$

The rocket at lift-off must weigh nearly twenty-two times what reaches orbit. So $1 - 1/21.8 = 95.4\%$ of it must be propellant, leaving $4.6\%$ for the tanks, engines, frame *and* the payload together. Picture a [[soda can|thin-tanks]] that is $95\%$ soda and $5\%$ can, with a satellite in there too. That is why a [[single-stage rocket to orbit|tyranny]] on chemical fuel is so nearly impossible — and it fell out of one exponential.

::: example How much can a stage deliver?
A rocket has lift-off mass $m_0 = 549\,\mathrm{t}$ and engines with $I_{sp} = 311\,\mathrm{s}$, so $v_e = 3050\,\mathrm{m/s}$. What mass is left after the stage has added $\Delta v = 3000\,\mathrm{m/s}$?

Use the backwards form. First the exponent: $3000 / 3050 = 0.9836$. Then

$$
m_f = m_0\, e^{-\Delta v / v_e} = 549 \times e^{-0.9836} = 549 \times 0.374 = 205.3\,\mathrm{t} .
$$

So $549 - 205.3 = 343.7\,\mathrm{t}$, about $344\,\mathrm{t}$, of propellant was burned.

**Check by running forwards.** $MR = 549 / 205.3 = 2.674$, and $\ln 2.674 = 0.9836$, so $v_e \ln MR = 3050 \times 0.9836 = 3000\,\mathrm{m/s}$. It matches.

**The backwards question with other numbers.** An upper stage with $v_e = 4430\,\mathrm{m/s}$ must supply $\Delta v = 6000\,\mathrm{m/s}$. Then $MR = e^{6000/4430} = e^{1.354} = 3.87$. The propellant fraction of that stage at ignition is $1 - 1/3.87 = 1 - 0.258 = 0.742$. Three quarters of the stage must be propellant before a single bolt of structure is counted.
:::

### Why staging works: logs add

On a long hike, you would not carry your empty water bottles and your finished lunch box all the way to the top. You would leave them behind and climb lighter. Rockets do the same: when a stage's tanks are empty, the whole stage is dropped.

Say a rocket has two stages. The first burns with mass ratio $MR_1$ and exhaust velocity $v_{e1}$, then falls away. The second burns with $MR_2$ and $v_{e2}$. Each burn obeys the rocket equation on its own, so the total is

$$
\Delta v = v_{e1} \ln MR_1 + v_{e2} \ln MR_2 .
$$

If the two exhaust velocities are equal, the product law squeezes this into $v_e \ln(MR_1 MR_2)$. So the *mass ratios multiply* while the *speed gains add*.

Try it. Two stages, each with $MR = 4.5$ and $v_e = 3050\,\mathrm{m/s}$. Each one gives $3050 \times \ln 4.5 = 4587.4\,\mathrm{m/s}$, so together they give $2 \times 4587.4 = 9175\,\mathrm{m/s}$ — enough for orbit. The single-stage rocket that would do the same needs $MR = 4.5^2 = 20.25$. But no single stage could actually be built that way, because it would carry its emptied lower tanks all the way up. Splitting the rocket lets the second stage start fresh with a smaller $m_0$.

The logarithm is what turns this into a stage-by-stage sum. That is why every launch vehicle analysis is a table of per-stage $\Delta v$'s, added up.

::: key The rocket equation
$\Delta v = v_e \ln(m_0/m_f) = v_e \ln MR$, with $v_e = I_{sp} g_0$. Inverted: $MR = e^{\Delta v / v_e}$ and $m_f = m_0 e^{-\Delta v/v_e}$. Stage mass ratios multiply; because $\ln(MR_1 MR_2) = \ln MR_1 + \ln MR_2$, stage $\Delta v$'s add.
:::

::: warning The exponent is not the answer
Say $\Delta v / v_e = 0.8$. The mass ratio is $e^{0.8} = 2.23$ — not $0.8$, and not $e = 2.72$. In a hurry, people report the exponent itself, or report $e$ because "the answer has $e$ in it". Always finish the step: work out $e$ to that power. Then sanity-check that $MR > 1$, and that it grows when $\Delta v$ grows.
:::

## Logarithmic scales

Because logarithms squash big ranges, engineers draw graphs with them. A quantity running from $10^{-6}$ to $10^{3}$ is unreadable on an ordinary axis: everything below $10$ is crushed flat against zero. On a $\log_{10}$ axis, every factor of ten (a **[[decade|log-axis]]**) gets the same width, and it all fits.

The **[[decibel|decibel-bell]]** (dB) works the same way. It is ten times the $\log_{10}$ of a power ratio. So $+10\,\mathrm{dB}$ is a factor of ten in power, and $+3\,\mathrm{dB}$ is a factor of $10^{0.3} = 2$. A radio link that "loses $6\,\mathrm{dB}$" keeps $10^{-0.6} = 0.25$ of its power — it has lost three quarters of its signal. The control modules spend weeks on Bode plots, which use log scales for both frequency and gain. The reason is the product law: gains that multiply one after another *add* on a log plot.

A cheap habit to start now: when a number is very big or very small, know its $\log_{10}$ to one decimal place. Remember $\log_{10} 2 = 0.30$, $\log_{10} 3 = 0.48$ and $\log_{10} 5 = 0.70$. Then, by the product law, $\log_{10}(4.45 \times 10^6) = \log_{10} 4.45 + 6 \approx 0.65 + 6 = 6.65$. You can multiply and divide huge numbers by adding and subtracting small ones. The estimation lesson is built on this.

## Check yourself

::: check
Without a calculator, work out $\log_2 32$, $\log_{10} 0.01$, $\ln e^{4}$ and $\log_5 1$.
:::

::: answer
Turn each into an exponent question. $2^5 = 32$, so $\log_2 32 = 5$. $10^{-2} = 0.01$, so $\log_{10} 0.01 = -2$. $\ln e^4 = 4$, because $\ln$ undoes $e$ to a power. $5^0 = 1$, so $\log_5 1 = 0$.
:::

::: check
Write $2\ln x - \tfrac{1}{2}\ln y + \ln 3$ as a single logarithm. Then expand $\ln\dfrac{\sqrt{a}\,b^3}{c}$ into a sum of simple terms.
:::

::: answer
Power law first: $2\ln x = \ln x^2$ and $\tfrac{1}{2}\ln y = \ln\sqrt{y}$. Then product and quotient: $\ln x^2 + \ln 3 - \ln\sqrt{y} = \ln\dfrac{3x^2}{\sqrt{y}}$.

For the second, quotient and product laws first, then power: $\ln\sqrt{a} + \ln b^3 - \ln c = \tfrac{1}{2}\ln a + 3\ln b - \ln c$.
:::

::: check
Savings grow by $5\%$ a year. How long until they double? Explain the "rule of $70$" that bankers use for this.
:::

::: answer
Solve $1.05^t = 2$. Take $\ln$ of both sides: $t \ln 1.05 = \ln 2$, so $t = \ln 2 / \ln 1.05 = 0.6931 / 0.04879 = 14.2$ years.

For a small rate $r$ (written as a fraction, like $0.05$), $\ln(1 + r) \approx r$. So $t \approx \ln 2 / r = 0.693 / r$ — or $69.3$ divided by the rate in percent. Bankers round that to $70$ for mental arithmetic: $70 / 5 = 14$ years. It is good to within a few percent for rates under $10\%$.
:::

::: check
An engine has $I_{sp} = 348\,\mathrm{s}$. What is its effective exhaust velocity, and what $\Delta v$ does a stage with $MR = 6$ get from it?
:::

::: answer
$v_e = 348 \times 9.80665 = 3413\,\mathrm{m/s}$. Then $\Delta v = v_e \ln 6 = 3413 \times 1.792 = 6115\,\mathrm{m/s}$, about $6.1\,\mathrm{km/s}$. The $g_0$ is the standard value no matter where the engine flies.
:::

::: check
Two stages: $v_{e1} = 3050\,\mathrm{m/s}$ with $MR_1 = 3.5$, and $v_{e2} = 3400\,\mathrm{m/s}$ with $MR_2 = 5$. What total $\Delta v$ do they give, and why can you not merge the two logarithms into one?
:::

::: answer
$\Delta v_1 = 3050 \ln 3.5 = 3050 \times 1.253 = 3821\,\mathrm{m/s}$ and $\Delta v_2 = 3400 \ln 5 = 3400 \times 1.609 = 5472\,\mathrm{m/s}$. The total is $3821 + 5472 = 9293\,\mathrm{m/s}$.

The product law $\ln MR_1 + \ln MR_2 = \ln(MR_1 MR_2)$ needs the same number in front of both logs. Here the $v_e$'s differ, so the sum stays a sum. You could write it as $\ln(MR_1^{v_{e1}} MR_2^{v_{e2}})$ using the power law, but that is no simpler.
:::

::: check
Solve $\ln(x - 3) + \ln x = \ln 10$.
:::

::: answer
Product law on the left: $\ln(x(x - 3)) = \ln 10$. Since $\ln$ is one-to-one, the insides must be equal: $x^2 - 3x = 10$. So $x^2 - 3x - 10 = 0$, which factors as $(x - 5)(x + 2) = 0$, giving $x = 5$ or $x = -2$.

Now check. $x = -2$ would need $\ln(-2 - 3) = \ln(-5)$, which does not exist, so it is thrown out. The solution is $x = 5$. Check: $\ln 2 + \ln 5 = \ln(2 \times 5) = \ln 10$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Exponential $a^x$ | fixed factor per fixed step; domain all numbers, range $(0, \infty)$; growth for $a > 1$, decay for $a < 1$ |
| $e$ | $2.71828\ldots$, the limit of $(1 + 1/n)^n$; $e^x = \exp(x)$ grows at the rate of its own value |
| Logarithm | $\log_a x = y \iff a^y = x$ ("exactly when"); domain $(0, \infty)$; $\log_a 1 = 0$, $\log_a a = 1$ |
| Laws | $\log(ab) = \log a + \log b$, $\log(a/b) = \log a - \log b$, $\log a^n = n\log a$ |
| Change of base | $\log_b x = \ln x / \ln b$; also $b^x = e^{x \ln b}$ |
| No law | $\log(a + b)$ does not simplify |
| Solving | unknown in exponent: take $\ln$; unknown in log: exponentiate, then check $x > 0$ |
| Half-life | $f(t) = (1/2)^{t/t_{1/2}} = e^{-\lambda t}$ with $\lambda = \ln 2 / t_{1/2}$ |
| Scale height | $\rho = \rho_0 e^{-h/H}$, $H \approx 8.5\,\mathrm{km}$ |
| $g_0$ | $9.80665\,\mathrm{m/s^2}$, defined constant, not local gravity |
| $I_{sp}$ | $v_e = I_{sp} g_0$; $311\,\mathrm{s} \Rightarrow 3050\,\mathrm{m/s}$ |
| Rocket equation | $\Delta v = v_e \ln MR$, $MR = e^{\Delta v/v_e}$; stage $\Delta v$'s add |
| Decibel | $10\log_{10}$ of a power ratio; $+3\,\mathrm{dB} \approx \times 2$, $+10\,\mathrm{dB} = \times 10$ |
| Anchors | $\ln 2 = 0.693$, $\ln 10 = 2.303$, $\log_{10} 2 = 0.30$, $e^3 \approx 20$ |

Next lesson: the rocket equation came from adding up many small pieces. The next lesson gives that idea its own notation — **sequences**, **series** and the sigma sign $\Sigma$ — including the geometric series that any fixed-factor process produces.

::: context penny-doubling Slow, slow, then sudden
Double one cent every day. Day 10 pays \$5.12. Day 20 pays \$5,243. Day 30 pays \$5,368,709. Each day pays exactly one cent more than all the days before it put together — so the last few days carry almost everything.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<line x1="30" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="215" y="159.94" width="7" height="0.06" fill="#1d6fd1"/><rect x="225" y="159.87" width="7" height="0.13" fill="#1d6fd1"/><rect x="235" y="159.75" width="7" height="0.25" fill="#1d6fd1"/><rect x="245" y="159.49" width="7" height="0.51" fill="#1d6fd1"/><rect x="255" y="158.98" width="7" height="1.02" fill="#1d6fd1"/><rect x="265" y="157.97" width="7" height="2.03" fill="#1d6fd1"/><rect x="275" y="155.94" width="7" height="4.06" fill="#1d6fd1"/><rect x="285" y="151.88" width="7" height="8.12" fill="#1d6fd1"/><rect x="295" y="143.75" width="7" height="16.25" fill="#1d6fd1"/><rect x="305" y="127.50" width="7" height="32.50" fill="#1d6fd1"/><rect x="315" y="95.00" width="7" height="65.00" fill="#1d6fd1"/><rect x="325" y="30.00" width="7" height="130.00" fill="#1d6fd1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="38.5" y="176">1</text><text x="128.5" y="176">10</text><text x="228.5" y="176">20</text><text x="328.5" y="176">30</text></g>
  <text x="185" y="192" font-size="11" fill="#6c7a93" text-anchor="middle">day</text>
  <text x="332" y="22" font-size="12" fill="#1f2a44" text-anchor="end">day 30: $5.37 million</text>
  <text x="312" y="88" font-size="11" fill="#1f2a44" text-anchor="end">day 29: $2.68 million</text>
  <text x="130" y="148" font-size="11" fill="#6c7a93" text-anchor="middle">days 1–20: too small to see</text>
</svg>
```

Drawn to scale, the first twenty days are too small to see at all. That is what exponential growth feels like from the inside: nothing, nothing, nothing, everything.
:::

::: context rtg Batteries that run on heat
Voyager 1 and 2 (launched in 1977), New Horizons, and the Curiosity and Perseverance rovers all carry a **radioisotope thermoelectric generator**, or RTG. A lump of plutonium-238 stays hot as it slowly decays, and devices called thermocouples turn that heat straight into electricity, with no moving parts and no sunlight needed. Far from the Sun, solar panels catch too little light, so this is how the outer planets get explored. Because the plutonium decays exponentially, the power slowly fades, and mission teams plan years ahead which instruments to switch off.
:::

::: context logarithm-word Where "logarithm" comes from
The Scottish mathematician John Napier invented logarithms and published the first tables in 1614. He built the word from two Greek ones: *logos*, "ratio" or "reckoning", and *arithmos*, "number". His reason was practical. Astronomers spent weeks multiplying long numbers by hand, and a table of logarithms let them add instead. Soon after, Henry Briggs reworked Napier's idea into base-10 tables — the common logarithm of this lesson — and scientists, navigators and engineers used such tables for more than three hundred years.
:::

::: context who-found-e The number nobody set out to find
In 1683 the Swiss mathematician Jacob Bernoulli asked exactly this bank question: what happens when interest is paid more and more often? He showed the answer settles somewhere between $2$ and $3$, but gave it no name. Decades later Leonhard Euler worked out its digits and started writing it with the letter $e$, and the name stuck. It turns up far from banks — in how air thins with height, how a hot drink cools, and how a spacecraft's control system settles after a nudge.
:::

::: context scale-height Where the air runs out
Try the formula at the top of Mount Everest, $8.85\,\mathrm{km}$ up: $e^{-8.85/8.5} = 0.35$. The air there is about a third as dense as at sea level, close to what climbers really find. At $100\,\mathrm{km}$, a common choice for the edge of space, the formula gives about a hundred-thousandth, and the real air is thinner still. Yet a trace remains even at the International Space Station, about $400\,\mathrm{km}$ up. It drags on the station, which slowly sinks and has to fire engines every so often to climb back.
:::

::: context specific-word What "specific" means
In engineering, **specific** means "per unit of mass" (or of weight). Specific heat is heat per kilogram; specific energy is energy per kilogram. So specific impulse is push-times-time *per unit of propellant* — a fair way to compare engines of any size, the way miles per gallon compares a scooter with a truck. Some real values: a solid rocket booster manages roughly $250\,\mathrm{s}$, the Space Shuttle's hydrogen main engines $452\,\mathrm{s}$ in vacuum, and the electric ion engines on NASA's Dawn probe about $3000\,\mathrm{s}$ — a tiny push, but astonishing mileage.
:::

::: context tsiolkovsky The schoolteacher who wrote it down
Konstantin Tsiolkovsky (1857–1935) was a schoolteacher in the small Russian town of Kaluga. Left nearly deaf by scarlet fever as a boy, he taught himself mathematics and physics from library books. In 1903 he published this equation in a paper about reaching space with rockets — months before the Wright brothers first flew an aeroplane. He also saw the consequence you are about to meet: one rocket cannot reach orbit on its own. His answer was "rocket trains", which we now call multi-stage rockets.
:::

::: context thin-tanks Thinner than a soda can
A real soda can is about $96\%$ drink by mass: roughly $370\,\mathrm{g}$ of soda in about $14\,\mathrm{g}$ of aluminium. So a single-stage rocket would have to be built about as flimsily as a soda can, with engines and a satellite inside too. Engineers have come close. The American Atlas rocket of the 1950s and 60s had steel tanks so thin that it had to stay pressurised, like a balloon, or it would crumple under its own weight. Even so, Atlas dropped part of its engines on the way up.
:::

::: context tyranny The tyranny of the rocket equation
Here is the rocket equation run backwards, $MR = e^{\Delta v/v_e}$, for a kerosene engine with $v_e = 3.05\,\mathrm{km/s}$. Every extra $3\,\mathrm{km/s}$ multiplies the mass ratio by about $2.7$, so the curve bends upward faster and faster.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 216" font-family="Inter, Arial, sans-serif">
<g stroke="#1f2a44" stroke-width="1.5">
    <line x1="50" y1="180" x2="335" y2="180"/><line x1="50" y1="180" x2="50" y2="25"/>
    <line x1="50" y1="180" x2="50" y2="185"/><line x1="106" y1="180" x2="106" y2="185"/><line x1="162" y1="180" x2="162" y2="185"/><line x1="218" y1="180" x2="218" y2="185"/><line x1="274" y1="180" x2="274" y2="185"/><line x1="330" y1="180" x2="330" y2="185"/><line x1="45" y1="180" x2="50" y2="180"/><line x1="45" y1="130" x2="50" y2="130"/><line x1="45" y1="80" x2="50" y2="80"/><line x1="45" y1="30" x2="50" y2="30"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="50" y="198">0</text><text x="106" y="198">2</text><text x="162" y="198">4</text><text x="218" y="198">6</text><text x="274" y="198">8</text><text x="330" y="198">10</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="41" y="184">0</text><text x="41" y="134">10</text><text x="41" y="84">20</text><text x="41" y="34">30</text></g>
  <text x="192" y="210" font-size="11" fill="#1f2a44" text-anchor="middle">change in speed Δv (km/s)</text>
  <text x="58" y="20" font-size="11" fill="#1f2a44">mass ratio MR</text>
  <polyline points="50.0,175.0 57.0,174.6 64.0,174.1 71.0,173.6 78.0,173.1 85.0,172.5 92.0,171.8 99.0,171.1 106.0,170.4 113.0,169.5 120.0,168.7 127.0,167.7 134.0,166.6 141.0,165.5 148.0,164.2 155.0,162.9 162.0,161.4 169.0,159.9 176.0,158.1 183.0,156.3 190.0,154.2 197.0,152.0 204.0,149.7 211.0,147.1 218.0,144.2 225.0,141.2 232.0,137.9 239.0,134.3 246.0,130.4 253.0,126.1 260.0,121.5 267.0,116.5 274.0,111.1 281.0,105.2 288.0,98.8 295.0,91.9 302.0,84.4 309.0,76.2 316.0,67.4 323.0,57.7 330.0,47.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="313.2" y1="180" x2="313.2" y2="71.0" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <circle cx="313.2" cy="71.0" r="4" fill="#b4232c"/>
  <text x="305.2" y="63.0" font-size="11" fill="#b4232c" text-anchor="end">orbit: 9.4 km/s needs MR 21.8</text>
</svg>
```

Astronaut Don Pettit called this "the tyranny of the rocket equation": each extra bit of speed also has to carry the propellant that buys it. Staging, a few paragraphs on, is how real rockets live with it.
:::

::: context log-axis Why a log axis fits everything
The same four numbers on two kinds of axis. On an ordinary axis each step of one unit gets the same width, so $1$, $10$ and even $100$ crowd together at the left. On a log axis each *factor* of ten gets the same width, and they spread out evenly.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
<text x="30" y="28" font-size="12" fill="#1f2a44">ordinary axis, 0 to 1000</text>
  <line x1="30" y1="50" x2="330" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="30.3" cy="50" r="4" fill="#b4232c"/><circle cx="33" cy="50" r="4" fill="#b4232c"/><circle cx="60" cy="50" r="4" fill="#b4232c"/><circle cx="330" cy="50" r="4" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="36" y="68">1, 10</text><text x="62" y="68">100</text><text x="330" y="68">1000</text>
  </g>
  <text x="30" y="98" font-size="12" fill="#1f2a44">log axis: every ×10 gets the same width</text>
  <line x1="30" y1="118" x2="330" y2="118" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="30" cy="118" r="4" fill="#1d6fd1"/><circle cx="130" cy="118" r="4" fill="#1d6fd1"/><circle cx="230" cy="118" r="4" fill="#1d6fd1"/><circle cx="330" cy="118" r="4" fill="#1d6fd1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="138">1</text><text x="130" y="138">10</text><text x="230" y="138">100</text><text x="330" y="138">1000</text>
  </g>
</svg>
```

A log axis has no zero. Going left you meet $0.1$, $0.01$, $0.001$ and so on forever, because no power of ten is zero.
:::

::: context decibel-bell Named after the telephone man
The **bel** is named after Alexander Graham Bell, inventor of the telephone, and a **decibel** is a tenth of a bel — "deci" means a tenth, as in decimetre. The bel proved too big a step for everyday use, so the decibel won. Engineers love it because a whole radio link can be worked out by adding and subtracting: transmitter power, plus antenna gains, minus the loss over the distance, minus cable losses, all in dB. That is the product law of logarithms doing the multiplying for you.
:::
