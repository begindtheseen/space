---
id: l03-polynomials-and-factoring
title: Polynomials, expanding and factoring
minutes: 21
covers:
  - polynomial manipulation and factoring
---

You buy three notebooks that cost $x$ dollars each and one pen for two dollars. The bill is $3x + 2$. That little formula is a **[[polynomial|polynomial-word]]**: some numbers, a letter standing for an unknown number, and nothing but adding and multiplying. It is the simplest kind of formula there is.

That simplicity is why polynomials are everywhere in engineering. A rocket engine's push over time, fitted to test data, is a polynomial. So is the height of a falling object, and the energy of motion $\tfrac{1}{2}mv^2$. So is the "[[characteristic equation|characteristic-equation]]" of an autopilot — the equation whose answers decide whether the autopilot calmly settles down or wobbles itself out of control. Being able to rewrite polynomials without hesitating is the difference between following a derivation and being dragged along by it.

This lesson has two skills that are mirror images of each other, like unpacking and packing a suitcase:

- **Expanding** unpacks brackets into a long sum of pieces.
- **Factoring** packs a sum back up into brackets multiplied together.

Each form answers different questions. The unpacked sum is what you want for working out a value. The packed-up product is what you want for *solving*, because a product is zero exactly when one of its pieces is zero. Being fluent means switching between the two whenever you like.

The lesson also starts a habit that the module's derivation exercise demands: every step in a chain of algebra should be something you can justify in one line, by naming the rule that produced it.

## Terms, coefficients and degree

Start with a shopping list: "3 apples and 2 bananas". Each item is a number times a thing. In algebra, each item is called a **term** (or **monomial**): a number times powers of letters, such as $-0.5t^2$ or $3x^2y$. The letters are **variables** — stand-ins for numbers that can change.

- The number in front is the **coefficient**. In $-0.5t^2$ it is $-0.5$.
- The **degree** of a term is the total power of its variables. $-0.5t^2$ has degree $2$. $3x^2y$ has degree $2 + 1 = 3$.

A **polynomial** is a sum of terms, and its degree is the biggest degree among them. With one variable, the standard way to write it lists the terms from the highest power down:

$$
p(x) = a_n x^n + a_{n-1} x^{n-1} + \cdots + a_1 x + a_0 .
$$

That looks scarier than it is. $p(x)$ is read "p of x" and is the polynomial's name. The $a$'s are fixed numbers, the coefficients; the little number underneath is a label, so $a_2$ (read "a sub two") is the coefficient that goes with $x^2$. The dots mean "and so on, down the powers". The last one, $a_0$, has no $x$ at all and is called the **constant term**.

Degree $1$ is called **linear** (its graph is a straight line), degree $2$ **quadratic**, degree $3$ **cubic**.

**Like terms** have exactly the same letters raised to the same powers, and they combine by adding coefficients — apples with apples. $3x^2 + 5x^2 = 8x^2$. But $3x^2 + 5x$ stays as it is, like $3$ apples and $5$ bananas.

**Evaluating** a polynomial means putting in a number for the variable and following the order of operations. Suppose a test engine's [[thrust|thrust-curve]] (its push) is fitted as $F(t) = 800 + 20t - 0.5t^2$, in kilonewtons, with $t$ the time in seconds. At $t = 10$:

$$
F(10) = 800 + 20(10) - 0.5(10)^2 = 800 + 200 - 50 = 950\,\mathrm{kN}.
$$

At $t = 40$: $F(40) = 800 + 800 - 0.5(1600) = 800 + 800 - 800 = 800\,\mathrm{kN}$. The thrust rose and then came back down. That is what a negative coefficient on the highest power does: eventually the $-0.5t^2$ term wins.

## Expanding: one law does all the work

Imagine buying three gift bags, each holding one apple and one orange. You get three apples and three oranges: $3(a + o) = 3a + 3o$. That is the **distributive law**,

$$
a(b + c) = ab + ac,
$$

and every expansion is this law used again and again. Here is a picture of it: a rectangle $a$ wide and $b + c$ long can be cut into an $a$-by-$b$ piece and an $a$-by-$c$ piece. The area is the same either way.

To multiply two brackets, distribute one bracket over the other, then distribute again:

$$
(3x - 2)(x + 5) = 3x(x + 5) - 2(x + 5) = 3x^2 + 15x - 2x - 10 = 3x^2 + 13x - 10.
$$

Step by step: the first move split the first bracket into its two terms, $3x$ and $-2$, each multiplying all of $(x + 5)$. The second move distributed each of those. The last move combined the like terms $15x - 2x = 13x$.

Every term in the first bracket meets every term in the second. The memory aid "[[FOIL|foil]]" (first, outer, inner, last) records exactly that for two terms times two terms. For longer brackets the rule is the same: three terms times two terms makes six products to collect.

Distributing a minus sign is the same law with $a = -1$: $-(a - b) = -a + b$. So

$$
-(a - b) + 2(a - 3b) = -a + b + 2a - 6b = a - 5b.
$$

### Special products

Draw a square with sides of length $a + b$. Cut it with one line across and one down, at distance $a$ from the corner. You get [[four pieces|square-pieces]]: an $a$-by-$a$ square, a $b$-by-$b$ square, and *two* $a$-by-$b$ rectangles. So the big square's area is $a^2 + 2ab + b^2$.

Three expansions like this turn up so often that they are worth knowing on sight:

$$
\begin{aligned}
(a + b)^2 &= a^2 + 2ab + b^2, \\
(a - b)^2 &= a^2 - 2ab + b^2, \\
(a + b)(a - b) &= a^2 - b^2 .
\end{aligned}
$$

To derive the first by algebra, distribute: $(a + b)(a + b) = a^2 + ab + ba + b^2$, and $ab = ba$, so the two middle terms add to $2ab$. That **cross term** $2ab$ is exactly what the last lesson's warning said was missing from the false rule "$(a + b)^2 = a^2 + b^2$".

The third one, the **difference of squares**, has no cross term, because $+ab$ and $-ab$ cancel. It makes a nice party trick: $21 \times 19 = (20 + 1)(20 - 1) = 400 - 1 = 399$.

Cubes follow the same pattern with one more round of distributing:

$$
(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3 .
$$

The coefficients $1, 3, 3, 1$ are a row of **[[Pascal's triangle|pascal]]**. Each number in the triangle is the sum of the two above it:

- $1$
- $1, 1$
- $1, 2, 1$ (the coefficients of $(a + b)^2$)
- $1, 3, 3, 1$ (for $(a + b)^3$)
- $1, 4, 6, 4, 1$ (for $(a + b)^4$)

This is the **binomial theorem** in the form you can work by hand. ("Binomial" means an expression with two terms, like $a + b$.)

### A shortcut for small changes

Here is a consequence you will use constantly. Let $\varepsilon$ (the Greek letter "epsilon", used for small quantities) be a tiny number. Then

$$
(1 + \varepsilon)^2 = 1 + 2\varepsilon + \varepsilon^2 \approx 1 + 2\varepsilon ,
$$

because the square of a tiny number is tinier still, and can be dropped. Check it: $1.001^2 = 1.002001$, and $1 + 2(0.001) = 1.002$. The dropped piece was $0.000001$. In the same way, $(1 + \varepsilon)^3 \approx 1 + 3\varepsilon$.

In words: make a length one percent longer, and an area grows about two percent and a [[volume about three percent|small-change]].

::: example How much energy does a burn add?
A $1000\,\mathrm{kg}$ spacecraft is moving at $v = 7700\,\mathrm{m/s}$. It fires its engine forward (engineers say **[[prograde|prograde]]**) and speeds up by $\Delta v = 100\,\mathrm{m/s}$. How much does its energy of motion — its **kinetic energy**, $\tfrac{1}{2}mv^2$ — go up?

The change is the energy after minus the energy before:

$$
\Delta E = \tfrac{1}{2}m(v + \Delta v)^2 - \tfrac{1}{2}mv^2 .
$$

*Step 1: expand the square* using $(a + b)^2$: $(v + \Delta v)^2 = v^2 + 2v\,\Delta v + \Delta v^2$.

*Step 2: multiply by $\tfrac{1}{2}m$ and subtract.* The $\tfrac{1}{2}mv^2$ pieces cancel, leaving

$$
\Delta E = m v\,\Delta v + \tfrac{1}{2} m\,\Delta v^2 .
$$

*Step 3: put in the numbers.*

$$
\Delta E = 1000 \times 7700 \times 100 + \tfrac{1}{2} \times 1000 \times 100^2 = 7.70 \times 10^8 + 5.0 \times 10^6 = 7.75 \times 10^8\,\mathrm{J}.
$$

The first term is $154$ times the second. So the same $100\,\mathrm{m/s}$ buys far more energy when you are already moving fast. That is the **[[Oberth effect|oberth]]**, one of the big ideas of spaceflight, in one line of algebra.

*Check by a second route*, the difference of squares: $7800^2 - 7700^2 = (7800 - 7700)(7800 + 7700) = 100 \times 15\,500 = 1.55 \times 10^6$, and $\tfrac{1}{2} \times 1000 \times 1.55 \times 10^6 = 7.75 \times 10^8\,\mathrm{J}$. Two routes, one answer.
:::

## Factoring: the law run backwards

To **factor** is to write a sum as a product — to pack the suitcase. Why bother, when the expanded form is what you plug numbers into? Because the two forms answer different questions. The expanded thrust curve tells you the thrust at a given time. The factored form tells you *when the thrust is zero*, because a product is zero exactly when one of its factors is. Solving equations, simplifying fractions and finding where something changes sign all want the factored form.

Look for these patterns, in this order.

**Common factor.** Pull out whatever every term shares: $6x^3 - 4x^2 = 2x^2(3x - 2)$. That includes a shared minus sign: $-3t^2 + 6t = -3t(t - 2)$. (Expand to check: $2x^2 \cdot 3x = 6x^3$ and $2x^2 \cdot (-2) = -4x^2$.)

**Difference of squares.** $a^2 - b^2 = (a - b)(a + b)$. So $x^2 - 9 = (x - 3)(x + 3)$, and $4y^2 - 25 = (2y - 5)(2y + 5)$. A *sum* of squares, $a^2 + b^2$, does not factor using real numbers.

**Trinomials starting with $x^2$.** (A **trinomial** has three terms.) $x^2 + bx + c$ factors as $(x + p)(x + q)$ when $p + q = b$ and $pq = c$. It is a small puzzle: find two numbers that *multiply* to $c$ and *add* to $b$.

- $x^2 - 5x + 6$: multiply to $6$, add to $-5$. The pair is $-2$ and $-3$, so $(x - 2)(x - 3)$.
- $x^2 - x - 12$: multiply to $-12$, add to $-1$. The pair is $-4$ and $3$, so $(x - 4)(x + 3)$.

**General trinomials.** For $ax^2 + bx + c$, find two numbers that multiply to $a \times c$ and add to $b$. Use them to split the middle term into two, then factor the pairs (this is called **grouping**). Take $2t^2 - 7t + 3$. Here $ac = 2 \times 3 = 6$, and $-6$ and $-1$ multiply to $6$ and add to $-7$. So

$$
2t^2 - 6t - t + 3 = 2t(t - 3) - 1(t - 3) = (2t - 1)(t - 3).
$$

The first pair shared $2t$; the second pair shared $-1$; then both pieces shared $(t - 3)$. Check by expanding: $(2t - 1)(t - 3) = 2t^2 - 6t - t + 3 = 2t^2 - 7t + 3$. Always check. Expanding is cheap, and factoring is easy to get wrong.

**Cubes.**

$$
a^3 - b^3 = (a - b)(a^2 + ab + b^2), \qquad a^3 + b^3 = (a + b)(a^2 - ab + b^2).
$$

Verify the first by expanding the right side: the six products are $a^3 + a^2b + ab^2 - a^2b - ab^2 - b^3$, and the middle four cancel in pairs, leaving $a^3 - b^3$.

### The zero-product property

Here is why factoring matters for solving. If you multiply two numbers and get zero, one of them must have been zero. There is no way to make $0$ out of, say, $3 \times 5$. This is the **zero-product property**: if $pq = 0$, then $p = 0$ or $q = 0$.

So $2t^2 - 7t + 3 = 0$ becomes $(2t - 1)(t - 3) = 0$. Either $2t - 1 = 0$, giving $t = \tfrac{1}{2}$, or $t - 3 = 0$, giving $t = 3$. That is the whole method behind the next lesson's quadratic equations.

::: note Why it has to be true
Suppose $pq = 0$ and $p$ is not zero. Then you are allowed to divide both sides by $p$, which gives $q = \frac{0}{p} = 0$. So if $p$ is not the zero one, $q$ must be.
:::

::: example Free fall as a difference of squares
Drop a ball from rest at height $h_0$ ("h nought", the starting height). After $t$ seconds its height is $h(t) = h_0 - \tfrac{1}{2}gt^2$, where $g$ is gravity's acceleration. It hits the ground at the time $t_f$ (for "final") when all of $h_0$ has been used up: $h_0 = \tfrac{1}{2}g t_f^2$.

*Step 1: replace $h_0$* with that expression, so both terms look alike:

$$
h(t) = \tfrac{1}{2}g t_f^2 - \tfrac{1}{2}g t^2 .
$$

*Step 2: pull out the common factor* $\tfrac{1}{2}g$, then use the difference of squares:

$$
h(t) = \tfrac{1}{2}g\,(t_f^2 - t^2) = \tfrac{1}{2}g\,(t_f - t)(t_f + t).
$$

The factored form shows at a glance that $h = 0$ exactly when $t = t_f$. (The other factor is zero at $t = -t_f$, a time before the drop, so we throw it out.) It also writes the height as a product of two simple pieces: the time still to go, $t_f - t$, and $t_f + t$.

*Step 3: numbers.* Take $h_0 = 2000\,\mathrm{m}$ and $g = 9.80665\,\mathrm{m/s^2}$, so $\tfrac{1}{2}g = 4.903$. The fall time is

$$
t_f = \sqrt{\frac{2 h_0}{g}} = \sqrt{\frac{4000}{9.80665}} = \sqrt{407.9} \approx 20.20\,\mathrm{s}.
$$

At $t = 10\,\mathrm{s}$: $h = 4.903 \times (20.20 - 10)(20.20 + 10) = 4.903 \times 10.20 \times 30.20 \approx 1510\,\mathrm{m}$.

*Check with the original form:* $2000 - 4.903 \times 10^2 = 2000 - 490.3 \approx 1510\,\mathrm{m}$. It agrees — and it makes sense that halfway through the time, the ball has fallen only a quarter of the way, because it starts slow and speeds up.
:::

## Polynomial division and the factor theorem

You learned long division with numbers: to work out $156 \div 12$, ask how many $12$s fit into $15$ (one), multiply back, subtract, bring down the next digit, repeat. The answer is $13$. Polynomials divide the same way.

Divide $x^3 - 2x^2 - 5x + 6$ by $x - 3$:

1. Divide the leading terms: $x^3 \div x = x^2$. Multiply back: $x^2(x - 3) = x^3 - 3x^2$. Subtract from the top: $(x^3 - 2x^2) - (x^3 - 3x^2) = x^2$. Bring down the rest: $x^2 - 5x + 6$.
2. Divide the leading terms again: $x^2 \div x = x$. Multiply back: $x^2 - 3x$. Subtract: $-2x + 6$.
3. Once more: $-2x \div x = -2$. Multiply back: $-2x + 6$. Subtract: $0$. Nothing left over.

So

$$
\frac{x^3 - 2x^2 - 5x + 6}{x - 3} = x^2 + x - 2 = (x + 2)(x - 1),
$$

and the cubic factors completely as $(x - 3)(x + 2)(x - 1)$. Its **[[roots|roots-word]]** — the values of $x$ that make it zero — are $3$, $-2$ and $1$.

Two facts make this useful.

The **remainder theorem**: dividing $p(x)$ by $(x - a)$ leaves the remainder $p(a)$ — the value of the polynomial at $x = a$. Here $p(3) = 27 - 18 - 15 + 6 = 0$, which matches the zero remainder.

The **factor theorem** follows from it: $(x - a)$ is a factor of $p(x)$ exactly when $p(a) = 0$. So to factor a cubic, try small whole numbers for $x$ until one gives zero, then divide that factor out.

::: note Why it has to be true
Dividing $p(x)$ by $(x - a)$ gives some quotient $q(x)$ and a leftover number $r$, so that $p(x) = (x - a)\,q(x) + r$ for every $x$. Now put $x = a$. The bracket becomes $a - a = 0$, which wipes out the whole first part, leaving $p(a) = r$. If that remainder is zero, then $p(x) = (x - a)\,q(x)$, and $(x - a)$ is a factor.
:::

For dividing by $x - a$ there is a compact shortcut called **synthetic division**. Write down only the coefficients. Bring the first one down, then repeatedly multiply by $a$ and add to the next coefficient.

Try $(2x^3 + 3x^2 + 0x - 4) \div (x + 2)$. Dividing by $x + 2$ means $x - a$ with $a = -2$. The coefficients are $2, 3, 0, -4$ (the $0$ holds the place of the missing $x$ term):

- Bring down $2$.
- $2 \times (-2) = -4$, and $3 + (-4) = -1$.
- $-1 \times (-2) = 2$, and $0 + 2 = 2$.
- $2 \times (-2) = -4$, and $-4 + (-4) = -8$.

The last number, $-8$, is the remainder. The others, $2, -1, 2$, are the quotient's coefficients: $2x^2 - x + 2$. Check with the remainder theorem: $p(-2) = 2(-8) + 3(4) - 4 = -16 + 12 - 4 = -8$. It matches.

## Rational expressions

A **rational expression** is one polynomial divided by another — a fraction with polynomials on top and bottom. It follows exactly the fraction rules from the first lesson, with one extra job: factor first. To simplify

$$
\frac{x^2 - 9}{x^2 + x - 6} = \frac{(x - 3)(x + 3)}{(x + 3)(x - 2)} = \frac{x - 3}{x - 2}, \qquad x \neq -3,\ x \neq 2 .
$$

($\neq$ means "is not equal to".) The [[excluded values|excluded-values]] are where the *original* bottom is zero. Cancelling $(x + 3)$ does not make $x = -3$ allowed. It only hides the problem, like a hole in a road covered with a tarp.

To add, build a common denominator from the factored forms:

$$
\frac{1}{x - 1} - \frac{1}{x + 1} = \frac{(x + 1) - (x - 1)}{(x - 1)(x + 1)} = \frac{2}{x^2 - 1}.
$$

Check with $x = 3$: the left side is $\tfrac{1}{2} - \tfrac{1}{4} = \tfrac{1}{4}$, and the right side is $\tfrac{2}{8} = \tfrac{1}{4}$.

::: warning Cancel factors, never terms
$\dfrac{x^2 - 9}{x - 3}$ simplifies to $x + 3$ because $x^2 - 9$ *factors* as $(x - 3)(x + 3)$, and the shared factor $(x - 3)$ cancels. But $\dfrac{x^2 - 9}{x^2 - 3}$ does not simplify to $\dfrac{9}{3}$ or to anything else. The $x^2$'s are *added* to other things, not multiplied. If you cannot write the top and bottom as products with a shared factor, there is nothing to cancel.
:::

## Identities you can justify in one line

A derivation is a chain of steps, and each link should carry its own reason: "distribute", "common denominator", "difference of squares", "divide both sides by $m_f$, which is not zero". If you cannot name the rule that turned one line into the next, the step is not finished. It may be right, but you do not yet *know* it is.

Two habits make this cheap:

- **Write the definitions at the top of the page**, so every symbol is pinned down before you push it around.
- **Test with small numbers.** After any step that rearranges more than one term, put the same small numbers into both sides. Equal answers do not prove the step right, but unequal answers prove it wrong instantly. That catches most sign and cancelling mistakes before they spread.

Take the rocket stage masses from the first lesson: dry mass $m_d$, propellant $m_p$, payload $m_L$, with $m_0 = m_d + m_p + m_L$ at lift-off and $m_f = m_d + m_L$ at burnout. That means $m_0 = m_f + m_p$. For testing, use $m_d = 2$, $m_p = 10$, $m_L = 1$. Then $m_0 = 13$ and $m_f = 3$ — small enough to check everything below in your head.

::: example Three stage-mass identities, each in one line
**First.** Start from the mass ratio $MR = \dfrac{m_0}{m_f}$ and subtract $1$:

$$
MR - 1 = \frac{m_0}{m_f} - 1 = \frac{m_0 - m_f}{m_f} = \frac{m_p}{m_f}.
$$

Reasons: write $1$ as $\frac{m_f}{m_f}$ to get a common denominator; then use $m_0 - m_f = m_p$. In words, the mass ratio minus one is the propellant carried per kilogram of burnout mass. *Test:* $\frac{13}{3} - 1 = \frac{10}{3}$, and $\frac{m_p}{m_f} = \frac{10}{3}$.

**Second.**

$$
1 - \frac{1}{MR} = 1 - \frac{m_f}{m_0} = \frac{m_0 - m_f}{m_0} = \frac{m_p}{m_0}.
$$

Reasons: the reciprocal of $\frac{m_0}{m_f}$ is $\frac{m_f}{m_0}$; then a common denominator. One minus the reciprocal of the mass ratio is the fraction of the lift-off mass that is propellant. For $MR = 12.08$ this is $1 - 0.0828 = 0.917$, matching the first lesson. *Test:* $1 - \frac{3}{13} = \frac{10}{13}$.

**Third.** Take the propellant mass fraction $\zeta = \dfrac{m_p}{m_p + m_d}$. Then

$$
1 - \zeta = \frac{m_p + m_d - m_p}{m_p + m_d} = \frac{m_d}{m_p + m_d}, \qquad \text{so} \qquad \frac{\zeta}{1 - \zeta} = \frac{m_p}{m_d}.
$$

Reasons: a common denominator; then divide the two fractions, and their identical bottoms cancel. A stage with $\zeta = 0.949$ carries $\dfrac{0.949}{0.051} \approx 18.6$ kilograms of propellant for every kilogram of dry mass. *Test:* $\zeta = \frac{10}{12}$, $1 - \zeta = \frac{2}{12}$, and $\frac{10}{12} \div \frac{2}{12} = 5 = \frac{10}{2}$.

**A bonus.** $\dfrac{(m_0)^2 - (m_f)^2}{m_0 - m_f} = m_0 + m_f$, by the difference of squares. A calculator would never suggest that, but it removes a division from a formula. *Test:* $\frac{169 - 9}{10} = 16 = 13 + 3$.
:::

::: key Special products and factors
$(a \pm b)^2 = a^2 \pm 2ab + b^2$; $(a + b)(a - b) = a^2 - b^2$; $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$; $(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$. For small $\varepsilon$, $(1 + \varepsilon)^n \approx 1 + n\varepsilon$. Zero-product property: $pq = 0$ implies $p = 0$ or $q = 0$. Factor theorem: $(x - a)$ divides $p(x)$ exactly when $p(a) = 0$.
:::

## Check yourself

::: check
Expand $(2a - 3b)^2$ and $(x + 2)^3$.
:::

::: answer
Use $(A - B)^2 = A^2 - 2AB + B^2$ with $A = 2a$ and $B = 3b$: $(2a)^2 - 2(2a)(3b) + (3b)^2 = 4a^2 - 12ab + 9b^2$.

For the cube, use the $1, 3, 3, 1$ pattern with $b = 2$: $x^3 + 3x^2(2) + 3x(2)^2 + 2^3 = x^3 + 6x^2 + 12x + 8$.
:::

::: check
Factor $3x^2 - 10x - 8$ completely and state its roots.
:::

::: answer
$ac = 3 \times (-8) = -24$. We need two numbers that multiply to $-24$ and add to $-10$: $-12$ and $2$. Split the middle term: $3x^2 - 12x + 2x - 8 = 3x(x - 4) + 2(x - 4) = (3x + 2)(x - 4)$.

Check at $x = 1$: the original gives $3 - 10 - 8 = -15$, and the factored form gives $(5)(-3) = -15$.

Roots: $3x + 2 = 0$ gives $x = -\tfrac{2}{3}$, and $x - 4 = 0$ gives $x = 4$.
:::

::: check
Divide $x^3 + 1$ by $x + 1$, and say which identity the result confirms.
:::

::: answer
Synthetic division with $a = -1$ on the coefficients $1, 0, 0, 1$: bring down $1$; $0 + 1(-1) = -1$; $0 + (-1)(-1) = 1$; $1 + 1(-1) = 0$. The quotient is $x^2 - x + 1$ and the remainder is $0$.

So $x^3 + 1 = (x + 1)(x^2 - x + 1)$. That is the sum-of-cubes identity with $a = x$ and $b = 1$.
:::

::: check
Simplify $\dfrac{x^2 - 4}{x^2 - 4x + 4}$ and list the values of $x$ for which the original expression is undefined.
:::

::: answer
Factor both: $x^2 - 4 = (x - 2)(x + 2)$ and $x^2 - 4x + 4 = (x - 2)^2$. Cancelling one shared factor of $(x - 2)$ leaves $\dfrac{x + 2}{x - 2}$.

The original is undefined only at $x = 2$, where its bottom is zero. The simplified form is also undefined there, so this time nothing is hidden. Check at $x = 5$: $\tfrac{21}{9} = \tfrac{7}{3}$ both ways.
:::

::: check
A tank's radius is increased by $0.2\%$ with its length unchanged. Its volume goes as the radius squared. Using the small-change shortcut, by what percentage does its volume change?
:::

::: answer
A $0.2\%$ increase means multiplying the radius by $1.002$, so $\varepsilon = 0.002$. Since $V \propto r^2$, the volume is multiplied by $(1.002)^2 \approx 1 + 2(0.002) = 1.004$: about $0.4\%$ more volume.

The exact value is $1.002^2 = 1.004004$. The difference, four millionths, is the $\varepsilon^2$ we dropped.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Parts of a polynomial | terms, coefficients, degree = highest total power; combine like terms only |
| Distributive law | $a(b + c) = ab + ac$; two brackets distribute twice |
| Squares | $(a \pm b)^2 = a^2 \pm 2ab + b^2$ |
| Difference of squares | $a^2 - b^2 = (a - b)(a + b)$; $a^2 + b^2$ does not factor over the reals |
| Cubes | $a^3 \mp b^3 = (a \mp b)(a^2 \pm ab + b^2)$; $(a+b)^3$ has coefficients $1,3,3,1$ |
| Small quantities | $(1 + \varepsilon)^n \approx 1 + n\varepsilon$ |
| Trinomials | find two numbers with product $ac$ and sum $b$, then group |
| Zero product | $pq = 0 \Rightarrow p = 0$ or $q = 0$ |
| Remainder theorem | $p(x) \div (x - a)$ leaves remainder $p(a)$; zero remainder means $(x-a)$ is a factor |
| Rational expressions | factor, cancel common factors only, keep the excluded values |
| Stage identities | $MR - 1 = m_p / m_f$, $1 - 1/MR = m_p / m_0$, $\zeta/(1 - \zeta) = m_p / m_d$ |

The next lesson uses the zero-product property and a trick called completing the square to solve linear and quadratic equations — and derives the quadratic formula you will use for the rest of your career.

::: context polynomial-word Many terms, one word
**Polynomial** is built from the Greek *poly*, "many", and the Latin *nomen*, "name" — used here to mean "term". So a polynomial is "many terms". The same pattern names the others in this lesson: a **monomial** has one term, a **binomial** two ($a + b$), a **trinomial** three ($x^2 + 5x + 6$).

Mixing Greek and Latin in one word is the sort of thing language experts grumble about, but the name stuck centuries ago.
:::

::: context characteristic-equation The polynomial that decides calm or wobble
An autopilot, a car's cruise control and a thermostat all push back against errors. How such a system settles down is decided by one polynomial built from its settings. Its roots — the values that make it zero — work like the system's fingerprints: each one says whether a wobble dies away, keeps going, or grows.

If a single root is on the wrong side, the wobble grows until something breaks. You will find these roots in the control modules later in the course, and the factoring in this lesson is where that skill starts.
:::

::: context thrust-curve Thrust is not constant
A rocket engine does not push equally hard the whole way up. About a minute after launch, a Falcon 9 turns its engines down while it passes through the part of the climb where the air presses hardest on the rocket — engineers call it **max Q** — then turns them back up. The Space Shuttle's main engines throttled back near the end of the climb, to keep the crew's acceleration at about $3g$.

Engineers describe curves like these with polynomials fitted to test data, exactly like $F(t)$ here.
:::

::: context foil Every term meets every term
FOIL only works for two terms times two terms. A method that always works is the **box**: write one bracket's terms along the top, the other's down the side, and fill each cell with the product of its row and column. For $(3x - 2)(x + 5)$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="45" width="100" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="220" y="45" width="100" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="120" y="85" width="100" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="220" y="85" width="100" height="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="14" text-anchor="middle" fill="#1f2a44">
    <text x="170" y="34" font-weight="700">x</text><text x="270" y="34" font-weight="700">+5</text>
    <text x="90" y="70" font-weight="700">3x</text><text x="90" y="110" font-weight="700">−2</text>
    <text x="170" y="70">3x²</text><text x="270" y="70">15x</text>
    <text x="170" y="110">−2x</text><text x="270" y="110">−10</text>
  </g>
</svg>
```

The two orange cells are like terms: $15x - 2x = 13x$. Adding all four cells gives $3x^2 + 13x - 10$. A bracket with three terms just makes the box three cells wide.
:::

::: context square-pieces (a + b)² as four tiles
Here is the square from the text. The blue pieces are the squares $a^2$ and $b^2$. The two orange rectangles are the cross term $2ab$ that people forget.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="25" width="90" height="90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="25" width="30" height="90" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="115" width="90" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="115" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="13" text-anchor="middle" fill="#1f2a44">
    <text x="85" y="75">a²</text><text x="145" y="75">ab</text>
    <text x="85" y="135">ab</text><text x="145" y="135">b²</text>
    <text x="85" y="18">a</text><text x="145" y="18">b</text>
    <text x="28" y="74">a</text><text x="28" y="134">b</text>
  </g>
  <g font-size="13" fill="#1f2a44">
    <text x="185" y="70">(a + b)² = a² + 2ab + b²</text>
    <text x="185" y="100">a = 3, b = 1:</text>
    <text x="185" y="120">16 = 9 + 3 + 3 + 1</text>
  </g>
</svg>
```

Leave out the orange and you are missing real area. That is why $(a + b)^2$ is not $a^2 + b^2$: for $a = 3$ and $b = 1$ it is $16$, not $10$.
:::

::: context pascal Older than Pascal
Blaise Pascal wrote about this triangle in 1654, but he was far from the first. In China it is called Yang Hui's triangle, after a writer of the 1200s, and mathematicians in Persia and India knew it earlier still. Each number is the sum of the two just above it:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g font-size="14" text-anchor="middle" fill="#1f2a44">
    <text x="180" y="22">1</text>
    <text x="162" y="46">1</text><text x="198" y="46">1</text>
    <text x="144" y="70">1</text><text x="180" y="70">2</text><text x="216" y="70">1</text>
    <text x="126" y="94">1</text><text x="162" y="94">3</text><text x="198" y="94">3</text><text x="234" y="94">1</text>
    <text x="90" y="142">1</text><text x="126" y="142">5</text><text x="162" y="142">10</text><text x="198" y="142">10</text><text x="234" y="142">5</text><text x="270" y="142">1</text>
  </g>
  <g font-size="14" text-anchor="middle" fill="#1d6fd1" font-weight="700">
    <text x="108" y="118">1</text><text x="144" y="118">4</text><text x="180" y="118">6</text><text x="216" y="118">4</text><text x="252" y="118">1</text>
  </g>
  <line x1="165" y1="98" x2="176" y2="106" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="195" y1="98" x2="184" y2="106" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="98" font-size="11" text-anchor="middle" fill="#b4232c">3 + 3 = 6</text>
</svg>
```

The blue row gives $(a + b)^4 = a^4 + 4a^3b + 6a^2b^2 + 4ab^3 + b^4$. The same numbers count choices: there are $6$ ways to pick $2$ things out of $4$.
:::

::: context small-change Your first taste of calculus
Dropping the square of a tiny number is one of the most used moves in all of engineering. It is called **linearising**: close to a known point, treat a curve as if it were a straight line.

Guidance software does this constantly. It works out how a small change — in engine angle, say — shifts the path, and ignores the far smaller "change times change" pieces. Calculus will make the idea exact: the $2$ in $1 + 2\varepsilon$ is the steepness (the slope) of the curve $x^2$ at $x = 1$.
:::

::: context prograde Forward, backward
**Prograde** means "stepping forward", from the Latin *pro*, forward, and *gradi*, to step. It is a burn along the direction you are already moving, which speeds you up. Its opposite, **retrograde**, fires against your motion to slow you down — that is how a spacecraft drops out of orbit to come home.

Crews and flight software name burns by direction because "speed up" means nothing until you say *which way*.
:::

::: context oberth Oberth's discovery
Hermann Oberth, one of the founders of rocket science, worked this out in the 1920s. The algebra shows why it happens: the energy gained is about $m v\,\Delta v$, so the same $\Delta v$ is worth more when $v$ is bigger.

That is why spacecraft do their big burns at the lowest point of their orbit, where they move fastest. A probe leaving for Mars fires its engine close to Earth, rather than after it has climbed away and slowed down.
:::

::: context roots-word Why they are called roots
It is the same word as in "square root", and not by accident. About $1200$ years ago, the Baghdad mathematician al-Khwarizmi called the unknown number in his equations the *jidhr*, Arabic for "root". Translators into Latin wrote *radix*, and the word stayed with both ideas: the value that solves an equation, and the number that squares to give another.

The title of al-Khwarizmi's book gave us the word *algebra*, and his own name gave us *algorithm*.
:::

::: context excluded-values Division by zero in the real world
Computers enforce excluded values the hard way. In 1997 the US Navy cruiser *Yorktown*, testing new computer systems, was left dead in the water for nearly three hours after a zero was typed into a database field. The software divided by it, the error spread, and the ship lost control of its engines.

Flight software guards every division whose bottom could reach zero. That starts with knowing exactly where it can — which is what listing the excluded values does.
:::
