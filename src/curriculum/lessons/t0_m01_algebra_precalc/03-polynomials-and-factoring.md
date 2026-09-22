---
id: l03-polynomials-and-factoring
title: Polynomials, expanding and factoring
minutes: 16
covers:
  - polynomial manipulation and factoring
---

A polynomial is the simplest kind of formula there is: numbers, a variable, and the operations of adding and multiplying. That simplicity is why polynomials are everywhere in engineering — a thrust curve fitted to test data, the height of a falling object, the kinetic energy $\tfrac{1}{2}mv^2$, the characteristic equation whose roots decide whether a control loop is stable. Being able to expand, factor and divide them without hesitation is the difference between following a derivation and being carried along by it.

The two skills are mirror images. **Expanding** multiplies brackets out into a sum of terms; **factoring** runs the same distributive law backwards to write a sum as a product. Products are what you want when you are solving (a product is zero when one of its factors is), sums are what you want when you are evaluating or differentiating. Fluency means moving between the two forms at will.

This lesson also introduces the habit that the module's derivation exercise demands: every symbolic step should be an identity you can justify in one line, by naming the rule that produced it.

## Terms, coefficients and degree

A **term** (or monomial) is a number times powers of variables, such as $-0.5t^2$ or $3x^2y$. The number is its **coefficient**, and its **degree** is the total power of the variables. A **polynomial** is a sum of terms; its degree is the largest degree among them. In one variable the standard form lists terms from highest degree down:

$$
p(x) = a_n x^n + a_{n-1} x^{n-1} + \cdots + a_1 x + a_0,
$$

where the $a_k$ are constant coefficients and $a_0$ is the **constant term**. A polynomial of degree $1$ is linear, degree $2$ quadratic, degree $3$ cubic.

**Like terms** have identical variable parts and combine by adding coefficients: $3x^2 + 5x^2 = 8x^2$, but $3x^2 + 5x$ stays as it is. Evaluating a polynomial is substitution followed by the order of operations. A thrust curve fitted as $F(t) = 800 + 20t - 0.5t^2$ (kilonewtons, with $t$ in seconds) gives $F(10) = 800 + 200 - 50 = 950\,\mathrm{kN}$ and $F(40) = 800 + 800 - 800 = 800\,\mathrm{kN}$: the thrust rose and came back down, which is what a negative leading coefficient does.

## Expanding: one law does all the work

Everything in expansion comes from the distributive law, $a(b + c) = ab + ac$, applied repeatedly. To multiply two binomials, distribute one bracket over the other, then distribute again:

$$
(3x - 2)(x + 5) = 3x(x + 5) - 2(x + 5) = 3x^2 + 15x - 2x - 10 = 3x^2 + 13x - 10.
$$

Every term in the first bracket meets every term in the second, which is all the mnemonic "FOIL" (first, outer, inner, last) records. For longer brackets the same rule holds: with three terms times two terms there are six products to collect. Distributing a minus sign is the same law with $a = -1$: $-(a - b) = -a + b$, so $-(a - b) + 2(a - 3b) = -a + b + 2a - 6b = a - 5b$.

### Special products

Three expansions recur so often that they are worth knowing on sight:

$$
\begin{aligned}
(a + b)^2 &= a^2 + 2ab + b^2, \\
(a - b)^2 &= a^2 - 2ab + b^2, \\
(a + b)(a - b) &= a^2 - b^2 .
\end{aligned}
$$

Derive the first by distributing: $(a + b)(a + b) = a^2 + ab + ba + b^2$, and $ab = ba$. The cross term $2ab$ is exactly what the previous lesson's warning said was missing from the false rule $(a + b)^2 = a^2 + b^2$. The third, the **difference of squares**, has no cross term because $+ab$ and $-ab$ cancel.

Cubes follow the same pattern with one more distribution: $(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$. The coefficients $1, 3, 3, 1$ are a row of Pascal's triangle, each entry the sum of the two above it, and the next row $1, 4, 6, 4, 1$ gives $(a + b)^4$. This is the **binomial theorem** in its hand-computable form.

One consequence you will use constantly: when $\varepsilon$ is small, $(1 + \varepsilon)^2 = 1 + 2\varepsilon + \varepsilon^2 \approx 1 + 2\varepsilon$, because $\varepsilon^2$ is negligible. Check: $1.001^2 = 1.002001$, and $1 + 2(0.001) = 1.002$. Likewise $(1 + \varepsilon)^3 \approx 1 + 3\varepsilon$. A one-percent change in a length is a two-percent change in an area and a three-percent change in a volume.

::: example How much energy does a burn add?
A $1000\,\mathrm{kg}$ spacecraft moving at $v = 7700\,\mathrm{m/s}$ fires prograde for $\Delta v = 100\,\mathrm{m/s}$. The kinetic energy change is

$$
\Delta E = \tfrac{1}{2}m(v + \Delta v)^2 - \tfrac{1}{2}mv^2 .
$$

Expand the square: $(v + \Delta v)^2 = v^2 + 2v\,\Delta v + \Delta v^2$. The $\tfrac{1}{2}mv^2$ terms cancel, leaving

$$
\Delta E = m v\,\Delta v + \tfrac{1}{2} m\,\Delta v^2 = 1000 \times 7700 \times 100 + \tfrac{1}{2} \times 1000 \times 100^2 = 7.70 \times 10^8 + 5.0 \times 10^6 = 7.75 \times 10^8\,\mathrm{J}.
$$

The linear term is $154$ times the quadratic one: the same $\Delta v$ buys far more energy when you are already moving fast, which is the Oberth effect in one line of algebra. Check by the difference of squares: $7800^2 - 7700^2 = (7800 - 7700)(7800 + 7700) = 100 \times 15\,500 = 1.55 \times 10^6$, and $\tfrac{1}{2} \times 1000 \times 1.55 \times 10^6 = 7.75 \times 10^8\,\mathrm{J}$. Two routes, one answer.
:::

## Factoring: the law run backwards

To factor is to write a sum as a product. Why bother, when the expanded form is what you evaluate? Because the two forms answer different questions. The expanded form of a thrust curve tells you the thrust at a given time; the factored form tells you at which times the thrust is zero, since a product vanishes exactly when one of its factors does. Solving, simplifying fractions and finding where a sign changes all want the factored form. Always look for these patterns, in this order.

**Common factor.** Pull out whatever every term shares: $6x^3 - 4x^2 = 2x^2(3x - 2)$. This includes a common sign: $-3t^2 + 6t = -3t(t - 2)$.

**Difference of squares.** $a^2 - b^2 = (a - b)(a + b)$, so $x^2 - 9 = (x - 3)(x + 3)$ and $4y^2 - 25 = (2y - 5)(2y + 5)$. A *sum* of squares $a^2 + b^2$ does not factor over the real numbers.

**Trinomials with leading coefficient $1$.** $x^2 + bx + c$ factors as $(x + p)(x + q)$ when $p + q = b$ and $pq = c$. For $x^2 - 5x + 6$ you need two numbers with product $6$ and sum $-5$: $-2$ and $-3$, so $(x - 2)(x - 3)$. For $x^2 - x - 12$: product $-12$, sum $-1$, giving $(x - 4)(x + 3)$.

**General trinomials.** For $ax^2 + bx + c$, look for two numbers with product $ac$ and sum $b$, then split the middle term and factor by grouping. Take $2t^2 - 7t + 3$: $ac = 6$, and $-6 + (-1) = -7$, so

$$
2t^2 - 6t - t + 3 = 2t(t - 3) - 1(t - 3) = (2t - 1)(t - 3).
$$

Check by expanding: $2t^2 - 6t - t + 3$. Always check; expansion is cheap and factoring is error-prone.

**Cubes.** $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$ and $a^3 + b^3 = (a + b)(a^2 - ab + b^2)$. Verify the first by expanding the right-hand side: the six products are $a^3 + a^2b + ab^2 - a^2b - ab^2 - b^3$, and the middle four cancel in pairs.

The reason factoring matters for solving is the **zero-product property**: if a product of real numbers is zero, at least one factor is zero. So $2t^2 - 7t + 3 = 0$ becomes $(2t - 1)(t - 3) = 0$, hence $t = \tfrac{1}{2}$ or $t = 3$. That is the whole method behind the next lesson's quadratic equations.

::: example Free fall as a difference of squares
An object dropped from rest at height $h_0$ is at height $h(t) = h_0 - \tfrac{1}{2}gt^2$. It reaches the ground at the time $t_f$ satisfying $h_0 = \tfrac{1}{2}g t_f^2$. Substitute that for $h_0$:

$$
h(t) = \tfrac{1}{2}g t_f^2 - \tfrac{1}{2}g t^2 = \tfrac{1}{2}g\,(t_f^2 - t^2) = \tfrac{1}{2}g\,(t_f - t)(t_f + t).
$$

The factored form shows at a glance that $h = 0$ exactly when $t = t_f$ (the $t = -t_f$ root is before the drop and is discarded), and that the height falls off with the *product* of time remaining and time elapsed. With $h_0 = 2000\,\mathrm{m}$ and $g = 9.80665\,\mathrm{m/s^2}$: $t_f = \sqrt{2 h_0 / g} = \sqrt{407.9} \approx 20.20\,\mathrm{s}$. At $t = 10\,\mathrm{s}$, $h = 4.903 \times (20.20 - 10)(20.20 + 10) = 4.903 \times 10.20 \times 30.20 \approx 1510\,\mathrm{m}$. The direct form agrees: $2000 - 4.903 \times 100 = 1510\,\mathrm{m}$.
:::

## Polynomial division and the factor theorem

Dividing a polynomial by a lower-degree one works like long division of integers: divide the leading terms, multiply back, subtract, bring down, repeat. Divide $x^3 - 2x^2 - 5x + 6$ by $x - 3$. The leading terms give $x^3 / x = x^2$; multiply back to get $x^3 - 3x^2$ and subtract, leaving $x^2 - 5x + 6$. Next, $x^2 / x = x$; subtract $x^2 - 3x$, leaving $-2x + 6$. Finally $-2x / x = -2$; subtract $-2x + 6$, leaving $0$. So

$$
\frac{x^3 - 2x^2 - 5x + 6}{x - 3} = x^2 + x - 2 = (x + 2)(x - 1),
$$

and the cubic factors completely as $(x - 3)(x + 2)(x - 1)$, with roots $3$, $-2$ and $1$.

Two facts make this useful. The **remainder theorem**: dividing $p(x)$ by $(x - a)$ leaves the remainder $p(a)$. Here $p(3) = 27 - 18 - 15 + 6 = 0$, consistent with the zero remainder. The **factor theorem** is its corollary: $(x - a)$ is a factor of $p(x)$ exactly when $p(a) = 0$. To factor a cubic, try small integer values until one gives zero, then divide out.

For divisors of the form $x - a$ there is a compressed bookkeeping called **synthetic division**: write the coefficients, bring the first down, and repeatedly multiply by $a$ and add. For $(2x^3 + 3x^2 + 0x - 4) \div (x + 2)$, so $a = -2$, the coefficients $2, 3, 0, -4$ become: bring down $2$; $3 + 2(-2) = -1$; $0 + (-1)(-2) = 2$; $-4 + 2(-2) = -8$. The quotient is $2x^2 - x + 2$ and the remainder is $-8$. Check with the remainder theorem: $p(-2) = 2(-8) + 3(4) - 4 = -8$.

## Rational expressions

A **rational expression** is a ratio of polynomials, and it obeys exactly the fraction rules of the first lesson — with the added job of factoring first. To simplify

$$
\frac{x^2 - 9}{x^2 + x - 6} = \frac{(x - 3)(x + 3)}{(x + 3)(x - 2)} = \frac{x - 3}{x - 2}, \qquad x \neq -3,\ x \neq 2 .
$$

The excluded values are where the original denominator vanishes; cancelling $(x + 3)$ does not make $x = -3$ allowed, it hides the hole. To add, build a common denominator from the factored forms:

$$
\frac{1}{x - 1} - \frac{1}{x + 1} = \frac{(x + 1) - (x - 1)}{(x - 1)(x + 1)} = \frac{2}{x^2 - 1}.
$$

Check with $x = 3$: the left side is $\tfrac{1}{2} - \tfrac{1}{4} = \tfrac{1}{4}$ and the right is $\tfrac{2}{8} = \tfrac{1}{4}$.

::: warning Cancel factors, never terms
$\dfrac{x^2 - 9}{x - 3}$ simplifies to $x + 3$ because $x^2 - 9$ *factors* as $(x-3)(x+3)$. But $\dfrac{x^2 - 9}{x^2 - 3}$ does not simplify to $\dfrac{9}{3}$ or to anything else: the $x^2$ terms are added to other things, not multiplied. If you cannot write the numerator and denominator as products with a shared factor, there is nothing to cancel.
:::

## Identities you can justify in one line

A derivation is a chain of identities, and each link should carry its own justification: "distribute", "common denominator", "difference of squares", "divide both sides by $m_f \neq 0$". If you cannot name the rule that turned one line into the next, the step is not finished — it may be right, but you do not yet know that it is. Two habits make this discipline cheap. Write the definitions you are using at the top of the page, so every symbol is pinned down before it is manipulated. And after any step that rearranges more than one term, substitute a set of small numbers into both sides; equal numbers do not prove the identity, but unequal numbers disprove it instantly, and that catches most sign and cancellation errors before they propagate.

Take the stage masses from the first lesson, $m_0 = m_d + m_p + m_L$ and $m_f = m_d + m_L$, so that $m_0 = m_f + m_p$. With test values $m_d = 2$, $m_p = 10$, $m_L = 1$ you have $m_0 = 13$ and $m_f = 3$, small enough to check every identity below in your head.

::: example Three stage-mass identities, each in one line
First, $MR - 1 = \dfrac{m_0}{m_f} - 1 = \dfrac{m_0 - m_f}{m_f} = \dfrac{m_p}{m_f}$. (Common denominator, then $m_0 - m_f = m_p$.) The mass ratio minus one is propellant per unit of burnout mass.

Second, $1 - \dfrac{1}{MR} = 1 - \dfrac{m_f}{m_0} = \dfrac{m_0 - m_f}{m_0} = \dfrac{m_p}{m_0}$. (Reciprocal of a fraction, common denominator.) One minus the reciprocal mass ratio is the propellant fraction of lift-off mass. For $MR = 12.08$ this is $1 - 0.0828 = 0.917$, matching the first lesson.

Third, for the propellant mass fraction $\zeta = \dfrac{m_p}{m_p + m_d}$: $1 - \zeta = \dfrac{m_p + m_d - m_p}{m_p + m_d} = \dfrac{m_d}{m_p + m_d}$, so $\dfrac{\zeta}{1 - \zeta} = \dfrac{m_p}{m_d}$. (Common denominator; then divide the two fractions, whose denominators cancel.) A stage with $\zeta = 0.949$ carries $\dfrac{0.949}{0.051} \approx 18.6$ kilograms of propellant per kilogram of dry mass.

Notice that $\dfrac{(m_0)^2 - (m_f)^2}{m_0 - m_f} = m_0 + m_f$ by the difference of squares — a symbolic simplification that a calculator would never suggest but that removes a division from a formula.
:::

::: key Special products and factors
$(a \pm b)^2 = a^2 \pm 2ab + b^2$; $(a + b)(a - b) = a^2 - b^2$; $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$; $(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$. For small $\varepsilon$, $(1 + \varepsilon)^n \approx 1 + n\varepsilon$. Zero-product property: $pq = 0$ implies $p = 0$ or $q = 0$. Factor theorem: $(x - a)$ divides $p(x)$ exactly when $p(a) = 0$.
:::

## Check yourself

::: check
Expand $(2a - 3b)^2$ and $(x + 2)^3$.
:::

::: answer
$(2a - 3b)^2 = (2a)^2 - 2(2a)(3b) + (3b)^2 = 4a^2 - 12ab + 9b^2$. For the cube use the $1, 3, 3, 1$ pattern with $b = 2$: $x^3 + 3x^2(2) + 3x(2)^2 + 2^3 = x^3 + 6x^2 + 12x + 8$.
:::

::: check
Factor $3x^2 - 10x - 8$ completely and state its roots.
:::

::: answer
$ac = -24$ and we need a pair with sum $-10$: $-12$ and $2$. Split: $3x^2 - 12x + 2x - 8 = 3x(x - 4) + 2(x - 4) = (3x + 2)(x - 4)$. Check at $x = 1$: $3 - 10 - 8 = -15$ and $(5)(-3) = -15$. Roots: $x = -\tfrac{2}{3}$ and $x = 4$.
:::

::: check
Divide $x^3 + 1$ by $x + 1$, and say which identity the result confirms.
:::

::: answer
Synthetic division with $a = -1$ on coefficients $1, 0, 0, 1$: bring down $1$; $0 + 1(-1) = -1$; $0 + (-1)(-1) = 1$; $1 + 1(-1) = 0$. Quotient $x^2 - x + 1$, remainder $0$. So $x^3 + 1 = (x + 1)(x^2 - x + 1)$, the sum-of-cubes identity with $a = x$, $b = 1$.
:::

::: check
Simplify $\dfrac{x^2 - 4}{x^2 - 4x + 4}$ and list the values of $x$ for which the original expression is undefined.
:::

::: answer
$x^2 - 4 = (x - 2)(x + 2)$ and $x^2 - 4x + 4 = (x - 2)^2$. Cancelling one factor of $(x - 2)$ leaves $\dfrac{x + 2}{x - 2}$. The original is undefined only at $x = 2$, where the denominator is zero; the simplified form is also undefined there, so nothing is hidden this time. Check at $x = 5$: $\tfrac{21}{9} = \tfrac{7}{3}$ both ways.
:::

::: check
A tank's radius is increased by $0.2\%$ with its length unchanged. Using the small-quantity approximation, by what percentage does its volume change? Its volume goes as the radius squared.
:::

::: answer
$V \propto r^2$, so $V$ scales by $(1.002)^2 \approx 1 + 2(0.002) = 1.004$: about $0.4\%$ more volume. The exact value $1.002^2 = 1.004004$ differs by four parts in a million, which is the neglected $\varepsilon^2$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Distributive law | $a(b + c) = ab + ac$; binomial products distribute twice |
| Squares | $(a \pm b)^2 = a^2 \pm 2ab + b^2$ |
| Difference of squares | $a^2 - b^2 = (a - b)(a + b)$; $a^2 + b^2$ does not factor over the reals |
| Cubes | $a^3 \mp b^3 = (a \mp b)(a^2 \pm ab + b^2)$; $(a+b)^3$ has coefficients $1,3,3,1$ |
| Small quantities | $(1 + \varepsilon)^n \approx 1 + n\varepsilon$ |
| Trinomials | find two numbers with product $ac$ and sum $b$, then group |
| Zero product | $pq = 0 \Rightarrow p = 0$ or $q = 0$ |
| Remainder theorem | $p(x) \div (x - a)$ leaves remainder $p(a)$; zero remainder means $(x-a)$ is a factor |
| Rational expressions | factor, cancel common factors only, keep the excluded values |
| Stage identities | $MR - 1 = m_p / m_f$, $1 - 1/MR = m_p / m_0$, $\zeta/(1 - \zeta) = m_p / m_d$ |

The next lesson uses the zero-product property and completing the square to solve linear and quadratic equations, and derives the quadratic formula you will use for the rest of your career.
