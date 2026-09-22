---
id: l02-exponents-and-radicals
title: Exponents, radicals and scaling laws
minutes: 16
covers:
  - exponents and radicals
---

Gravity falls off with the square of distance, orbital speed goes as the square root of one over the radius, and the period of an orbit grows as the radius to the three-halves power. Every one of those statements is a sentence about exponents. So is the difference between a kilonewton and a meganewton, and so is the reason a vehicle scaled up by half in every dimension weighs more than three times as much. If exponents are a set of half-remembered rules, those physical facts stay opaque; once the rules are seen as bookkeeping for repeated multiplication, they become obvious.

This lesson derives the exponent laws from that single idea, extends them to zero, negative and fractional powers so that roots stop being a separate subject, and then spends the second half on the physics they unlock: the inverse-square law and the scaling relations that let you estimate one vehicle from another. Along the way it introduces the two physical constants you will use most in this module, Earth's gravitational parameter $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ and Earth's mean radius $R = 6371\,\mathrm{km}$.

You will also meet powers of ten here, informally. They are formalised as scientific notation later in the module; for now treat $10^{14}$ as exactly what it says, a $1$ followed by fourteen zeros.

## Exponents are repeated multiplication

For a positive whole number $n$, the **power** $a^n$ means $n$ copies of the **base** $a$ multiplied together: $a^3 = a \cdot a \cdot a$. The $n$ is the **exponent**. Every rule below is just counting copies.

**Product rule.** $a^m \cdot a^n$ is $m$ copies times $n$ copies, so $m + n$ copies in total:

$$
a^m a^n = a^{m+n}.
$$

**Quotient rule.** Dividing $m$ copies by $n$ copies cancels $n$ of them, leaving $m - n$ (for now, with $m > n$):

$$
\frac{a^m}{a^n} = a^{m-n}.
$$

**Power of a power.** $(a^m)^n$ is $n$ groups of $m$ copies, so $mn$ copies:

$$
(a^m)^n = a^{mn}.
$$

**Power of a product or quotient.** Multiplication can be reordered, so $(ab)^n = a^n b^n$ and $\left(\frac{a}{b}\right)^n = \frac{a^n}{b^n}$.

Two things the rules do *not* say. First, $a^m \cdot b^n$ with different bases does not combine: $2^3 \cdot 3^2 = 72$ is not $6^5$. Second, an exponent tower is read from the top down: $2^{3^2} = 2^9 = 512$, whereas $(2^3)^2 = 8^2 = 64$. When you mean the second, write the parentheses.

## Zero and negative exponents

The quotient rule forces the meaning of $a^0$. Take $m = n$: $\frac{a^n}{a^n} = 1$ on the left, and $a^{n-n} = a^0$ on the right. So for any non-zero $a$,

$$
a^0 = 1.
$$

Take the rule one step further, with $m < n$: $\frac{a^2}{a^5}$ cancels two copies and leaves three in the denominator, $\frac{1}{a^3}$, while the rule says $a^{2-5} = a^{-3}$. A negative exponent is a reciprocal:

$$
a^{-n} = \frac{1}{a^n}, \qquad \frac{1}{a^{-n}} = a^n.
$$

A negative exponent never makes a quantity negative; it makes it small. $10^{-3}$ is $0.001$, and $2^{-10} = \frac{1}{1024} \approx 0.000977$. The inverse-square law $g = \mu r^{-2}$ is the same statement as $g = \frac{\mu}{r^2}$; the exponent form is more convenient when you differentiate, the fraction form when you compute.

### Powers of ten and prefixes

Because we count in base ten, powers of ten are the exponents you will handle most. $10^3 = 1000$, $10^6$ is a million, $10^{-6}$ is a millionth, and the laws apply directly: $10^{-3} \times 10^{5} = 10^{2} = 100$. The SI prefixes are names for powers of ten in steps of three: kilo ($10^3$), mega ($10^6$), giga ($10^9$), and going down milli ($10^{-3}$), micro ($10^{-6}$), nano ($10^{-9}$). A meganewton is $10^6$ newtons, a thousand kilonewtons. Squaring a quantity squares its power of ten: $(6.371 \times 10^{6}\,\mathrm{m})^2 = 6.371^2 \times 10^{12}\,\mathrm{m^2} \approx 40.59 \times 10^{12}\,\mathrm{m^2}$.

::: warning Negative exponents are not negative numbers
$10^{-3}$ is positive. So is $(-2)^{-3} = \frac{1}{(-2)^3} = -\frac{1}{8}$ — negative only because the base is negative and the power odd. Learners who read $r^{-2}$ as "minus $r$ squared" produce negative gravity. The sign of a power comes from the base; the exponent's sign says whether the quantity grows or shrinks.
:::

## Roots and fractional exponents

The **$n$th root** of $a$, written $\sqrt[n]{a}$, is the number whose $n$th power is $a$. The square root $\sqrt{a}$ is the case $n = 2$, and by convention it means the non-negative root: $\sqrt{9} = 3$, not $\pm 3$. When an equation like $x^2 = 9$ has two solutions we write $x = \pm\sqrt{9} = \pm 3$ — the $\pm$ is part of solving, not part of the root symbol.

Roots are exponents in disguise. Ask what $a^{1/2}$ should mean if the power-of-a-power rule is to keep working: $\left(a^{1/2}\right)^2 = a^{(1/2)\cdot 2} = a^1 = a$. So $a^{1/2}$ is a number whose square is $a$, that is, $\sqrt{a}$. In general

$$
a^{1/n} = \sqrt[n]{a}, \qquad a^{m/n} = \left(\sqrt[n]{a}\right)^m = \sqrt[n]{a^m}.
$$

For example $8^{2/3} = \left(\sqrt[3]{8}\right)^2 = 2^2 = 4$, and $16^{-3/4} = \frac{1}{\left(\sqrt[4]{16}\right)^3} = \frac{1}{2^3} = \frac{1}{8}$. Because roots are exponents, every law above applies to them: $\sqrt{ab} = \sqrt{a}\sqrt{b}$ and $\sqrt{a/b} = \sqrt{a}/\sqrt{b}$ are the power-of-a-product rule with exponent $\frac{1}{2}$.

Two restrictions. Even roots of negative numbers are not real numbers: $\sqrt{-4}$ has no real value, because no real number squares to a negative. Odd roots are fine, $\sqrt[3]{-8} = -2$. And $\sqrt{x^2} = |x|$, not $x$, because the square root symbol promises a non-negative answer.

### Simplifying radicals

To simplify a radical, pull out the largest perfect power: $\sqrt{72} = \sqrt{36 \cdot 2} = 6\sqrt{2} \approx 8.49$, and $\sqrt[3]{250} = \sqrt[3]{125 \cdot 2} = 5\sqrt[3]{2}$. Radicals with the same radicand add like like terms: $\sqrt{50} + \sqrt{18} = 5\sqrt{2} + 3\sqrt{2} = 8\sqrt{2}$. To **rationalise** a denominator, multiply top and bottom by the radical: $\frac{1}{\sqrt{2}} = \frac{\sqrt{2}}{\sqrt{2}\sqrt{2}} = \frac{\sqrt{2}}{2}$. This matters less with a calculator than it did, but it still keeps symbolic results in a form you can compare.

### Mental arithmetic with powers

A few anchor values make exponents fast enough to use while talking. $2^{10} = 1024 \approx 10^3$, so ten doublings is roughly a factor of a thousand and twenty doublings ($2^{20} = 1\,048\,576$) roughly a million. $\sqrt{10} \approx 3.16$, so the square root of any power of ten is either an exact power of ten (even exponent) or $3.16$ times one (odd exponent): $\sqrt{10^7} = \sqrt{10} \times 10^3 \approx 3160$. For a cube root, bracket the answer between perfect cubes — $\sqrt[3]{300}$ lies between $\sqrt[3]{216} = 6$ and $\sqrt[3]{343} = 7$, nearer $7$ — and refine only if the estimate has to be sharper than a few percent.

Roots of physical quantities take the root of the unit as well as the number. $\sqrt{5.887 \times 10^7\,\mathrm{m^2/s^2}}$ is $\sqrt{5.887} \times \sqrt{10^7}\,\mathrm{m/s} \approx 2.43 \times 3160\,\mathrm{m/s} \approx 7670\,\mathrm{m/s}$; splitting the number from its power of ten and the unit from both is how you keep such a calculation honest without a calculator. You will lean on exactly this habit in the estimation lesson at the end of the module.

::: warning Roots do not distribute over addition
$\sqrt{a + b} \neq \sqrt{a} + \sqrt{b}$. Check with numbers: $\sqrt{9 + 16} = 5$, while $\sqrt{9} + \sqrt{16} = 7$. The same goes for squares: $(a + b)^2 \neq a^2 + b^2$; the missing $2ab$ is the whole content of the next lesson's special products. Roots and powers distribute over multiplication and division only.
:::

::: example Fractional exponents by hand
Simplify $\dfrac{(2x^3 y^{-2})^3}{4x^{-1}y}$.

Power of a product on the numerator: $(2x^3y^{-2})^3 = 2^3 x^{9} y^{-6} = 8x^9y^{-6}$. Now divide, subtracting exponents base by base: $\frac{8}{4} = 2$; $x^{9 - (-1)} = x^{10}$; $y^{-6 - 1} = y^{-7}$. The result is $2x^{10}y^{-7} = \dfrac{2x^{10}}{y^{7}}$. Check with $x = 2$, $y = 3$: the original evaluates to $0.936$, and $2 \cdot 2^{10} / 3^7 = 2048/2187 = 0.936$. Plugging numbers into both sides is the fastest check you own for symbolic algebra.

Solve $x^{3/2} = 8$ for $x > 0$. Raise both sides to the reciprocal power $\frac{2}{3}$: $\left(x^{3/2}\right)^{2/3} = x^{1} = 8^{2/3} = 4$. Check: $4^{3/2} = \left(\sqrt{4}\right)^3 = 8$.
:::

## The inverse-square law

Newton's law of gravitation says the gravitational acceleration at distance $r$ from the centre of a body is

$$
g(r) = \frac{\mu}{r^2},
$$

where $\mu$ (the **gravitational parameter**, the product of the gravitational constant and the body's mass) is $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ for Earth. Check the units: $\mathrm{m^3/s^2}$ divided by $\mathrm{m^2}$ is $\mathrm{m/s^2}$, an acceleration. Note that $r$ is measured from Earth's centre, not from the ground: a satellite at altitude $h$ has $r = R + h$.

The exponent $-2$ carries a scaling rule. Double the distance and the acceleration drops by $2^2 = 4$; at ten Earth radii it is a hundredth of the surface value. In general, if $y \propto x^n$ (read "is proportional to"), multiplying $x$ by a factor $k$ multiplies $y$ by $k^n$, because $(kx)^n = k^n x^n$. That one line is the engine behind every scaling estimate in this module.

::: example Gravity at orbital altitudes
At the surface, $g = \dfrac{3.986 \times 10^{14}}{(6.371 \times 10^6)^2} = \dfrac{3.986 \times 10^{14}}{4.059 \times 10^{13}} \approx 9.82\,\mathrm{m/s^2}$ — slightly more than the familiar $9.81$ because Earth's rotation and shape are ignored here.

At the altitude of a space station, $h = 420\,\mathrm{km}$: $r = 6371 + 420 = 6791\,\mathrm{km} = 6.791 \times 10^6\,\mathrm{m}$, and

$$
g = \frac{3.986 \times 10^{14}}{(6.791 \times 10^6)^2} = \frac{3.986 \times 10^{14}}{4.612 \times 10^{13}} \approx 8.64\,\mathrm{m/s^2}.
$$

Gravity there is $88\%$ of its surface value; astronauts float because they are falling, not because gravity is absent.

At geostationary altitude, $h = 35\,786\,\mathrm{km}$, $r = 42\,157\,\mathrm{km} \approx 6.62 R$. By the scaling rule, $g \approx 9.82 / 6.62^2 = 9.82 / 43.8 \approx 0.224\,\mathrm{m/s^2}$. Direct calculation, $\mu / (4.2157 \times 10^7)^2$, gives the same $0.224\,\mathrm{m/s^2}$.
:::

## Square roots in orbital speed

For a circular orbit, gravity supplies exactly the acceleration $\frac{v^2}{r}$ needed to keep turning, so $\frac{v^2}{r} = \frac{\mu}{r^2}$. Multiply both sides by $r$ and take the square root:

$$
v = \sqrt{\frac{\mu}{r}} = \mu^{1/2} r^{-1/2}.
$$

The exponent $-\frac{1}{2}$ says higher orbits are slower, but slowly so: quadrupling the radius halves the speed. Escape speed is $\sqrt{2\mu/r} = \sqrt{2}\, v$, a factor of $1.414$ above circular speed at the same radius; the $\sqrt{2}$ is the power-of-a-product rule at work.

::: example Circular speed at 400 km
$r = 6371 + 400 = 6771\,\mathrm{km} = 6.771 \times 10^6\,\mathrm{m}$, so

$$
\frac{\mu}{r} = \frac{3.986 \times 10^{14}}{6.771 \times 10^6} = 5.887 \times 10^{7}\,\mathrm{m^2/s^2}, \qquad v = \sqrt{5.887 \times 10^7} \approx 7673\,\mathrm{m/s}.
$$

That is the $7.7\,\mathrm{km/s}$ you will hear quoted for low Earth orbit. Escape speed from the same radius is $\sqrt{2} \times 7673 \approx 10\,850\,\mathrm{m/s}$. Units check: $\mathrm{m^3/s^2}$ over $\mathrm{m}$ is $\mathrm{m^2/s^2}$, whose square root is $\mathrm{m/s}$. Taking the root of the unit is as necessary as taking the root of the number.
:::

## Scaling laws

The exponent tells you how a quantity responds to a change of scale, and that is often all an early design estimate needs. If every linear dimension of a vehicle grows by a factor $k$, then areas grow by $k^2$ and volumes — hence masses, at fixed density — by $k^3$. A stage scaled up by $k = 1.5$ has $1.5^2 = 2.25$ times the skin area and $1.5^3 = 3.375$ times the propellant mass. Tank pressure loads scale with area but propellant mass with volume, which is one reason bigger rockets are structurally more efficient.

The period of a circular orbit is the circumference over the speed, $T = \frac{2\pi r}{v} = 2\pi r \sqrt{\frac{r}{\mu}} = 2\pi\sqrt{\frac{r^3}{\mu}}$, so $T \propto r^{3/2}$. Doubling the radius multiplies the period by $2^{3/2} = 2\sqrt{2} \approx 2.83$; quadrupling it multiplies the period by $4^{3/2} = 8$. This is Kepler's third law, and you have derived it from two exponent rules and one square root.

::: key Exponent laws
$a^m a^n = a^{m+n}$, $\dfrac{a^m}{a^n} = a^{m-n}$, $(a^m)^n = a^{mn}$, $(ab)^n = a^n b^n$, $a^0 = 1$, $a^{-n} = \dfrac{1}{a^n}$, $a^{1/n} = \sqrt[n]{a}$, $a^{m/n} = \left(\sqrt[n]{a}\right)^m$. If $y \propto x^n$, scaling $x$ by $k$ scales $y$ by $k^n$.
:::

::: key Gravity and circular speed
$g(r) = \mu / r^2$ and $v = \sqrt{\mu / r}$ with $r$ measured from the centre of the body; for Earth $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ and $R = 6371\,\mathrm{km}$. Low Earth orbit speed is about $7.7\,\mathrm{km/s}$.
:::

## Check yourself

::: check
Simplify $27^{-2/3}$ and $\left(\dfrac{a^4 b^{-1}}{a b^{2}}\right)^{-2}$ without a calculator.
:::

::: answer
$27^{-2/3} = \dfrac{1}{\left(\sqrt[3]{27}\right)^2} = \dfrac{1}{3^2} = \dfrac{1}{9}$. Inside the second bracket, $\dfrac{a^4 b^{-1}}{a b^2} = a^{4-1} b^{-1-2} = a^3 b^{-3}$. Raising to $-2$: $a^{-6} b^{6} = \dfrac{b^6}{a^6}$.
:::

::: check
Without computing any speed, by what factor is the circular orbital speed at $r = 4R$ smaller than at $r = R$? By what factor is the period longer?
:::

::: answer
$v \propto r^{-1/2}$, so multiplying $r$ by $4$ multiplies $v$ by $4^{-1/2} = \frac{1}{2}$: half the speed. $T \propto r^{3/2}$, so the period is multiplied by $4^{3/2} = 8$. Consistency check: the circumference is $4$ times longer and the speed half, so the period should be $4 \times 2 = 8$ times longer.
:::

::: check
Write $\sqrt{50} + \sqrt{18} - \sqrt{8}$ as a single simplified radical, and give its decimal value.
:::

::: answer
$\sqrt{50} = 5\sqrt{2}$, $\sqrt{18} = 3\sqrt{2}$, $\sqrt{8} = 2\sqrt{2}$. So the sum is $(5 + 3 - 2)\sqrt{2} = 6\sqrt{2} \approx 8.49$.
:::

::: check
A satellite's period is $5400\,\mathrm{s}$ (ninety minutes). Using $T = 2\pi\sqrt{r^3/\mu}$, find its orbital radius and altitude.
:::

::: answer
Square both sides: $T^2 = 4\pi^2 r^3/\mu$, so $r^3 = \dfrac{\mu T^2}{4\pi^2}$ and $r = \left(\dfrac{\mu T^2}{4\pi^2}\right)^{1/3}$. Numerically, $\mu T^2 = 3.986 \times 10^{14} \times 2.916 \times 10^7 = 1.162 \times 10^{22}$; dividing by $4\pi^2 = 39.48$ gives $2.944 \times 10^{20}$; the cube root is $6.65 \times 10^6\,\mathrm{m} = 6653\,\mathrm{km}$. The altitude is $6653 - 6371 \approx 282\,\mathrm{km}$.
:::

::: check
Why is $\sqrt{x^2} = |x|$ rather than $x$? Give a value of $x$ for which the difference matters.
:::

::: answer
The square root symbol denotes the non-negative root. For $x = -3$, $x^2 = 9$ and $\sqrt{9} = 3 = |-3|$, not $-3$. Forgetting this loses a sign whenever you take the square root of a squared negative quantity, such as a downward velocity component.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Product and quotient | $a^m a^n = a^{m+n}$, $a^m / a^n = a^{m-n}$ |
| Power of a power | $(a^m)^n = a^{mn}$; towers read top-down, $2^{3^2} = 512$ |
| Zero and negative | $a^0 = 1$, $a^{-n} = 1/a^n$ (small, not negative) |
| Fractional | $a^{1/n} = \sqrt[n]{a}$, $a^{m/n} = (\sqrt[n]{a})^m$; $\sqrt{x^2} = \lvert x \rvert$ |
| No distribution over $+$ | $\sqrt{a+b} \neq \sqrt{a} + \sqrt{b}$ |
| Prefixes | kilo $10^3$, mega $10^6$, giga $10^9$, milli $10^{-3}$, micro $10^{-6}$ |
| Inverse square | $g = \mu / r^2$, $\mu_\oplus = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$, $r = R + h$ |
| Circular speed | $v = \sqrt{\mu / r} \approx 7.7\,\mathrm{km/s}$ in LEO; escape is $\sqrt{2}$ times larger |
| Period | $T = 2\pi\sqrt{r^3/\mu} \propto r^{3/2}$ |
| Scaling | $y \propto x^n$ means scaling $x$ by $k$ scales $y$ by $k^n$ |

The next lesson turns from single powers to sums of them — polynomials — and to the special products whose missing cross-terms were the warning above.
