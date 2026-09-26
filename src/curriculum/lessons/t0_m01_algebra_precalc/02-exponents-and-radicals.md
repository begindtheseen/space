---
id: l02-exponents-and-radicals
title: Exponents, radicals and scaling laws
minutes: 24
covers:
  - exponents and radicals
---

Fold a sheet of paper in half and it is two layers thick. Fold it again: four layers. Again: eight. Each fold *multiplies* the thickness by two. After ten folds (if you could manage them) you would have $2 \times 2 \times 2 \times 2 \times 2 \times 2 \times 2 \times 2 \times 2 \times 2 = 1024$ layers. Writing all those twos is tiring, so mathematicians invented a short way to say "multiply this number by itself again and again". That short way is the **[[exponent|exponent-word]]**, and undoing it gives the **root**.

This lesson is about both. You will need them straight away, because the most important facts about flying in space are sentences about exponents:

- Gravity gets weaker as you move away from Earth — four times weaker every time you double your distance from Earth's centre.
- A satellite in a higher orbit moves more slowly, following a square root.
- An orbit twice as big takes almost three times as long to go around.
- A rocket made one and a half times bigger in every direction weighs more than three times as much.

Once the exponent rules feel like simple bookkeeping — counting how many copies of a number are being multiplied — all four of those facts turn into one-line calculations. On the way you will meet the two numbers about Earth used most in this module: Earth's **[[gravitational parameter|mu-gm]]** $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ (a measure of how hard Earth pulls, explained below) and Earth's average radius $R = 6371\,\mathrm{km}$.

You will also meet powers of ten here, informally. They get their full treatment as scientific notation later in the module. For now, read $10^{14}$ as exactly what it says: a $1$ followed by fourteen zeros.

## Exponents are repeated multiplication

Here is the short way of writing. $2^3$ means three twos multiplied together:

$$
2^3 = 2 \cdot 2 \cdot 2 = 8.
$$

(The raised dot $\cdot$ means multiply.) The big number at the bottom, $2$, is the **base** — the number being multiplied. The small raised number, $3$, is the **exponent** — how many copies of the base to multiply. The whole thing, $2^3$, is called a **power**. You read $a^n$ aloud as "a to the n" or "a to the power n".

Two powers have their own names. $a^2$ is "a **[[squared|squared-cubed]]**", because a square with sides of length $a$ has area $a \times a$. And $a^3$ is "a **cubed**", because a cube with sides of length $a$ has volume $a \times a \times a$.

For a positive whole number $n$, then, $a^n$ is $n$ copies of $a$ multiplied together. Every rule below is nothing more than counting copies.

**Product rule.** Multiply $m$ copies of $a$ by $n$ more copies and you have $m + n$ copies in total:

$$
a^m a^n = a^{m+n}.
$$

Try it with numbers: $2^3 \cdot 2^2 = (2 \cdot 2 \cdot 2)(2 \cdot 2) = 8 \cdot 4 = 32$, and $2^5 = 32$ too. Five twos either way.

**Quotient rule.** Dividing is the opposite of multiplying. Put $m$ copies on top of a fraction and $n$ copies on the bottom. Each copy on the bottom cancels one on top, leaving $m - n$ (for now, with $m$ bigger than $n$):

$$
\frac{a^m}{a^n} = a^{m-n}.
$$

With numbers: $\frac{2^5}{2^2} = \frac{32}{4} = 8 = 2^3$. Two of the five twos cancelled.

**Power of a power.** $(a^m)^n$ means $n$ groups, each holding $m$ copies. That is $m \times n$ copies:

$$
(a^m)^n = a^{mn}.
$$

With numbers: $(2^3)^2 = 8^2 = 64$, and $2^6 = 64$. Two groups of three twos is six twos.

**Power of a product or quotient.** Multiplication can be done in any order, so the copies can be sorted into piles. $(ab)^n = a^n b^n$ and $\left(\frac{a}{b}\right)^n = \frac{a^n}{b^n}$. With numbers: $(2 \cdot 5)^3 = 10^3 = 1000$, and $2^3 \cdot 5^3 = 8 \cdot 125 = 1000$.

Two things the rules do *not* say:

- **Different bases do not combine.** $2^3 \cdot 3^2 = 8 \cdot 9 = 72$. It is not $6^5$, which is $7776$. The rules only count copies of the *same* number.
- **A tower of exponents is [[read from the top down|tower-top-down]].** $2^{3^2}$ means $2$ to the power $3^2$, which is $2^9 = 512$. But $(2^3)^2 = 8^2 = 64$. When you mean the second one, write the brackets.

## Zero and negative exponents

What could $2^0$ possibly mean — zero copies of two multiplied together? Walk down a staircase of powers and the answer appears on its own:

$$
2^4 = 16, \quad 2^3 = 8, \quad 2^2 = 4, \quad 2^1 = 2, \quad 2^0 = \;?, \quad 2^{-1} = \;?
$$

Each step down *divides by two*. Keep going with that pattern: $2 \div 2 = 1$, so $2^0 = 1$. One more step: $1 \div 2 = \frac{1}{2}$, so $2^{-1} = \frac{1}{2}$. Then $2^{-2} = \frac{1}{4}$, and $2^{-3} = \frac{1}{8}$. The pattern never breaks, and it gives us two rules. For any number $a$ that is not zero,

$$
a^0 = 1,
$$

and a negative exponent means "one over" the positive power — the **reciprocal**, the fraction flipped upside down:

$$
a^{-n} = \frac{1}{a^n}, \qquad \frac{1}{a^{-n}} = a^n.
$$

::: note Why it has to be true
The staircase is a pattern. Here is the argument that it must hold for every base. Use the quotient rule with the same number of copies on top and bottom, $m = n$. The left side is something divided by itself, which is $1$. The right side is $a^{n-n} = a^0$. So $a^0 = 1$ — the only value that keeps the quotient rule working.

Now take $m$ smaller than $n$, say $\frac{a^2}{a^5}$. Cancelling two copies leaves three on the bottom: $\frac{1}{a^3}$. The rule says the same thing is $a^{2-5} = a^{-3}$. So $a^{-3}$ must equal $\frac{1}{a^3}$. (Why not $a = 0$? Because you cannot divide by $0^n = 0$.)
:::

A negative exponent never makes a number negative. It makes it *small*. $10^{-3}$ is $\frac{1}{1000} = 0.001$, and $2^{-10} = \frac{1}{1024} \approx 0.000977$.

This matters on day one of orbital mechanics. The law of gravity (coming later in this lesson) can be written $g = \mu r^{-2}$ or $g = \frac{\mu}{r^2}$. Those say exactly the same thing. The exponent form is handier for the calculus you will meet in a later module; the fraction form is handier when you plug in numbers.

### Powers of ten and prefixes

We count in tens, so powers of ten are the exponents you will handle most. $10^3 = 1000$, $10^6$ is a million, and $10^{-6}$ is a millionth. The laws work on them directly: $10^{-3} \times 10^{5} = 10^{-3+5} = 10^{2} = 100$.

You already know some of these by their nicknames. A kilometre is a thousand metres; a millimetre is a thousandth of a metre. The SI **[[prefixes|prefix-names]]** are names for powers of ten in steps of three:

| Prefix | Power | Meaning |
| --- | --- | --- |
| giga (G) | $10^9$ | a billion |
| mega (M) | $10^6$ | a million |
| kilo (k) | $10^3$ | a thousand |
| milli (m) | $10^{-3}$ | a thousandth |
| micro ($\mu$) | $10^{-6}$ | a millionth |
| nano (n) | $10^{-9}$ | a billionth |

A meganewton (MN) is $10^6$ newtons, which is a thousand kilonewtons (kN).

Squaring a number squares its power of ten, by the power-of-a-product rule. Earth's radius in metres is $6.371 \times 10^{6}\,\mathrm{m}$, so

$$
(6.371 \times 10^{6}\,\mathrm{m})^2 = 6.371^2 \times (10^{6})^2\,\mathrm{m^2} \approx 40.59 \times 10^{12}\,\mathrm{m^2}.
$$

(The power of a power, $(10^6)^2 = 10^{12}$, doubled the exponent. The unit got squared too: metres times metres is square metres.)

::: warning Negative exponents are not negative numbers
$10^{-3}$ is positive: it is $0.001$. People who read $r^{-2}$ as "minus $r$ squared" end up with negative gravity, which would push you off the planet. A power can be negative, but only because the *base* is negative: $(-2)^{-3} = \frac{1}{(-2)^3} = -\frac{1}{8}$, negative because $-2$ multiplied by itself an odd number of times is negative. The sign of a power comes from the base. The sign of the exponent only says whether the number grows (positive exponent) or shrinks (negative exponent).
:::

## Roots and fractional exponents

Picture a square garden with an area of $9$ square metres. How long is each side? You need a number that, multiplied by itself, gives $9$. That number is $3$, and it is called the **square root** of $9$, written $\sqrt{9} = 3$.

Now picture a cube-shaped box that holds $8$ litres. Its side is $2$ units long, because $2 \cdot 2 \cdot 2 = 8$. That $2$ is the **cube root** of $8$, written $\sqrt[3]{8} = 2$.

In general, the **$n$th root** of $a$, written $\sqrt[n]{a}$ and read "the n-th root of a", is the number whose $n$th power is $a$. The square root is the case $n = 2$, and we leave out the little $2$. The number under the root sign is called the **[[radicand|radix]]**, and an expression with a root sign in it is called a **radical**.

One rule about square roots: by agreement, $\sqrt{a}$ always means the root that is zero or positive. So $\sqrt{9} = 3$, not $-3$, even though $(-3)^2 = 9$ as well. When an equation like $x^2 = 9$ really does have two answers, we write both: $x = \pm\sqrt{9} = \pm 3$ (read "plus or minus 3"). The $\pm$ is part of *solving*, not part of the root sign.

### Roots are exponents in disguise

What should $9^{1/2}$ mean — nine to the power one half? Use the product rule and see. Multiply $9^{1/2}$ by itself: the exponents add, $\frac{1}{2} + \frac{1}{2} = 1$, giving $9^1 = 9$. So $9^{1/2}$ is a number that, times itself, makes $9$. That is the square root: $9^{1/2} = 3$.

The same argument works for any root, which gives the rule

$$
a^{1/n} = \sqrt[n]{a}, \qquad a^{m/n} = \left(\sqrt[n]{a}\right)^m = \sqrt[n]{a^m}.
$$

A fraction exponent has two jobs. The bottom number (the denominator) says which root to take. The top number (the numerator) says what power to raise to. Taking the root first usually keeps the numbers small:

$$
8^{2/3} = \left(\sqrt[3]{8}\right)^2 = 2^2 = 4, \qquad 16^{-3/4} = \frac{1}{\left(\sqrt[4]{16}\right)^3} = \frac{1}{2^3} = \frac{1}{8}.
$$

In the second one, the minus sign meant "one over", the $4$ on the bottom meant "fourth root" ($2 \cdot 2 \cdot 2 \cdot 2 = 16$, so the fourth root of $16$ is $2$), and the $3$ on top meant "cube it".

Because roots are exponents, every exponent law works on them. $\sqrt{ab} = \sqrt{a}\sqrt{b}$ and $\sqrt{a/b} = \sqrt{a}/\sqrt{b}$ are the power-of-a-product and power-of-a-quotient rules with exponent $\frac{1}{2}$. Check: $\sqrt{4 \cdot 9} = \sqrt{36} = 6$, and $\sqrt{4} \cdot \sqrt{9} = 2 \cdot 3 = 6$.

::: note Why it has to be true
The power-of-a-power rule forces the same answer. If that rule is to keep working for fractions, then $\left(a^{1/2}\right)^2 = a^{(1/2)\cdot 2} = a^1 = a$. So $a^{1/2}$ must be a number whose square is $a$ — that is, $\sqrt{a}$. In the same way $\left(a^{1/n}\right)^n = a$, so $a^{1/n} = \sqrt[n]{a}$, and $a^{m/n} = \left(a^{1/n}\right)^m$.
:::

Two restrictions to keep in mind:

- **Even roots of negative numbers are not real numbers.** $\sqrt{-4}$ has no real value, because any real number times itself is zero or positive. Odd roots are fine: $\sqrt[3]{-8} = -2$, because $(-2)(-2)(-2) = -8$.
- **$\sqrt{x^2} = |x|$, not $x$.** The bars mean **absolute value**, the size without the sign. The square root sign promises an answer that is not negative, so if $x = -3$, then $\sqrt{(-3)^2} = \sqrt{9} = 3$.

### Simplifying radicals

To simplify a radical, look for the biggest perfect square (or cube) hiding inside the radicand and pull it out:

$$
\sqrt{72} = \sqrt{36 \cdot 2} = \sqrt{36}\,\sqrt{2} = 6\sqrt{2} \approx 8.49, \qquad \sqrt[3]{250} = \sqrt[3]{125 \cdot 2} = 5\sqrt[3]{2}.
$$

($36 = 6^2$ and $125 = 5^3$.) Radicals with the same radicand add like apples: three apples plus five apples is eight apples, and $3\sqrt{2} + 5\sqrt{2} = 8\sqrt{2}$. So

$$
\sqrt{50} + \sqrt{18} = 5\sqrt{2} + 3\sqrt{2} = 8\sqrt{2}.
$$

To **[[rationalise|rationalise-why]]** a denominator — get the root out of the bottom of a fraction — multiply top and bottom by that root (which is multiplying by $1$, so nothing changes):

$$
\frac{1}{\sqrt{2}} = \frac{1 \cdot \sqrt{2}}{\sqrt{2}\,\sqrt{2}} = \frac{\sqrt{2}}{2}.
$$

With a calculator this matters less than it once did, but it still puts symbolic answers in a standard form you can compare at a glance.

### Mental arithmetic with powers

A few anchor values let you use exponents in your head, fast enough to use in a conversation.

- $2^{10} = 1024$, which is about $10^3$. So ten doublings is roughly a factor of a thousand, and twenty doublings ($2^{20} = 1\,048\,576$) is roughly a million.
- $\sqrt{10} \approx 3.16$. So the square root of a power of ten is either an exact power of ten (when the exponent is even) or $3.16$ times one (when it is odd): $\sqrt{10^7} = \sqrt{10 \times 10^6} = \sqrt{10} \times 10^3 \approx 3160$.
- For a cube root, trap the answer between two perfect cubes. $\sqrt[3]{300}$ lies between $\sqrt[3]{216} = 6$ and $\sqrt[3]{343} = 7$, nearer $7$ because $300$ is nearer $343$. (It is about $6.69$.) Refine only if you need better than a few percent.

When a number carries a unit, the root is taken of the unit too. Here is a speed hidden inside a square root:

$$
\sqrt{5.887 \times 10^7\,\mathrm{m^2/s^2}} = \sqrt{5.887} \times \sqrt{10^7}\,\mathrm{m/s} \approx 2.43 \times 3160\,\mathrm{m/s} \approx 7670\,\mathrm{m/s}.
$$

The square root of square metres per second squared is metres per second. Splitting the number from its power of ten, and the unit from both, keeps a calculation like this honest without a calculator. You will lean on exactly this habit in the estimation lesson at the end of the module.

::: warning Roots do not split over adding
$\sqrt{a + b}$ is **not** $\sqrt{a} + \sqrt{b}$. Test it with numbers: $\sqrt{9 + 16} = \sqrt{25} = 5$, but $\sqrt{9} + \sqrt{16} = 3 + 4 = 7$. The same goes for squares: $(a + b)^2$ is not $a^2 + b^2$. The missing piece, $2ab$, is the whole subject of the next lesson's special products. Roots and powers split over multiplying and dividing only.
:::

::: example Fractional exponents by hand
**Simplify** $\dfrac{(2x^3 y^{-2})^3}{4x^{-1}y}$.

*Step 1: the top.* The cube applies to every factor inside the bracket (power of a product). Cube the $2$, and multiply each exponent by $3$ (power of a power):

$$
(2x^3y^{-2})^3 = 2^3\, x^{3 \cdot 3}\, y^{-2 \cdot 3} = 8x^9y^{-6}.
$$

*Step 2: divide, one base at a time.* Numbers first: $\frac{8}{4} = 2$. For $x$, subtract the bottom exponent from the top one: $x^{9 - (-1)} = x^{10}$ (subtracting $-1$ adds $1$). For $y$, the bottom $y$ has exponent $1$: $y^{-6 - 1} = y^{-7}$.

*Step 3: tidy up.* The result is $2x^{10}y^{-7}$, and the negative exponent means "one over", so

$$
2x^{10}y^{-7} = \frac{2x^{10}}{y^{7}}.
$$

*Check with numbers.* Pick $x = 2$ and $y = 3$. The original expression works out to about $0.936$. The answer gives $\frac{2 \cdot 2^{10}}{3^7} = \frac{2048}{2187} \approx 0.936$. They match. Plugging the same numbers into both sides is the fastest check you have for symbolic algebra.

**Solve** $x^{3/2} = 8$ for positive $x$.

To undo a power of $\frac{3}{2}$, raise both sides to the flipped power $\frac{2}{3}$. By the power-of-a-power rule, $\frac{3}{2} \cdot \frac{2}{3} = 1$:

$$
\left(x^{3/2}\right)^{2/3} = x^{1} = 8^{2/3} = \left(\sqrt[3]{8}\right)^2 = 2^2 = 4.
$$

*Check:* $4^{3/2} = \left(\sqrt{4}\right)^3 = 2^3 = 8$. Correct.
:::

## The inverse-square law

Think of a can of spray paint. Hold it close to a wall and it paints a small, thick patch. Step back to [[twice the distance|spreading-out]]: the spray spreads out, so the patch is twice as wide *and* twice as tall. That is $2 \times 2 = 4$ times the area, and the same paint spread over four times the area is only a quarter as thick. Step back to three times the distance and the paint is $3 \times 3 = 9$ times thinner.

Gravity weakens with distance in exactly the same way. Newton's law of gravitation says that the acceleration gravity gives you, at distance $r$ from the centre of a planet, is

$$
g(r) = \frac{\mu}{r^2}.
$$

Here $g$ is the **gravitational acceleration** — how fast a dropped object speeds up, in metres per second every second ($\mathrm{m/s^2}$). The symbol $\mu$ (the Greek letter "mu" — the same letter as the prefix micro, but with a completely different job here) is the **gravitational parameter**: the universal gravitational constant multiplied by the planet's mass. A heavier planet has a bigger $\mu$ and pulls harder. For Earth, $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$.

Check the units: $\mathrm{m^3/s^2}$ divided by $\mathrm{m^2}$ leaves $\mathrm{m/s^2}$, an acceleration, as it should.

Notice that $r$ is measured from Earth's **centre**, not from the ground. A satellite at **altitude** $h$ (height above the ground) has $r = R + h$, where $R$ is Earth's radius.

The exponent $-2$ carries a scaling rule. Double the distance and the acceleration drops by a factor of $2^2 = 4$. At ten Earth radii it is a hundredth of its value at the surface.

In general, if $y \propto x^n$ (the symbol $\propto$ is read "is proportional to"), then multiplying $x$ by some factor $k$ multiplies $y$ by $k^n$. The reason is the power-of-a-product rule: $(kx)^n = k^n x^n$. That one line powers every scaling estimate in this module.

::: example Gravity at orbital altitudes
**At the surface.** Here $r = R = 6.371 \times 10^6\,\mathrm{m}$. Square it, as worked out earlier: $(6.371 \times 10^6)^2 \approx 4.059 \times 10^{13}$. Then

$$
g = \frac{3.986 \times 10^{14}}{4.059 \times 10^{13}} \approx 9.82\,\mathrm{m/s^2}.
$$

That is a touch more than the familiar $9.81$, because this simple formula ignores Earth's spin and its slightly squashed shape.

**At a space station**, altitude $h = 420\,\mathrm{km}$. First add to get the distance from the centre: $r = 6371 + 420 = 6791\,\mathrm{km} = 6.791 \times 10^6\,\mathrm{m}$. Then square and divide:

$$
g = \frac{3.986 \times 10^{14}}{(6.791 \times 10^6)^2} = \frac{3.986 \times 10^{14}}{4.612 \times 10^{13}} \approx 8.64\,\mathrm{m/s^2}.
$$

That is $8.64 / 9.82 \approx 88\%$ of the surface value. Gravity up there is nearly as strong as on the ground. Astronauts float because they and their station are [[falling together|falling-together]], all the time — not because gravity has switched off.

**At geostationary altitude**, $h = 35\,786\,\mathrm{km}$, where a satellite takes exactly one day to go around. Now $r = 6371 + 35\,786 = 42\,157\,\mathrm{km}$, which is $42\,157 / 6371 \approx 6.62$ Earth radii. Use the scaling rule: gravity is weaker by a factor of $6.62^2 \approx 43.8$, so

$$
g \approx \frac{9.82}{43.8} \approx 0.224\,\mathrm{m/s^2}.
$$

The direct calculation, $\mu / (4.2157 \times 10^7)^2$, gives the same $0.224\,\mathrm{m/s^2}$. Two routes, one answer — and the answer is small, as it should be so far out.
:::

## Square roots in orbital speed

Swing a ball on a string in a circle. To keep it curving, the string has to keep pulling it toward the centre. Anything moving at speed $v$ around a circle of radius $r$ needs an inward acceleration of $\frac{v^2}{r}$. (You will derive that formula in a later module; for now take it as given.)

A satellite in a **circular orbit** has no string. Gravity does the pulling. The orbit works when gravity supplies exactly the inward acceleration needed:

$$
\frac{v^2}{r} = \frac{\mu}{r^2}.
$$

Multiply both sides by $r$ to get $v^2 = \frac{\mu}{r}$. Then take the square root of both sides (speed is positive, so we want the positive root):

$$
v = \sqrt{\frac{\mu}{r}} = \mu^{1/2} r^{-1/2}.
$$

The exponent $-\frac{1}{2}$ tells the story. It is negative, so higher orbits are *slower*. But it is only a half, so they are slower only gently: making the radius four times bigger multiplies the speed by $4^{-1/2} = \frac{1}{2}$ — half the speed.

The **[[escape speed|escape-speed]]**, the speed needed to leave Earth for good, is $\sqrt{2\mu/r}$. By the power-of-a-product rule, $\sqrt{2\mu/r} = \sqrt{2}\,\sqrt{\mu/r} = \sqrt{2}\, v$. So escape speed is $\sqrt{2} \approx 1.414$ times the circular speed at the same radius.

::: example Circular speed at 400 km
*Step 1: distance from the centre.* $r = 6371 + 400 = 6771\,\mathrm{km} = 6.771 \times 10^6\,\mathrm{m}$.

*Step 2: divide.*

$$
\frac{\mu}{r} = \frac{3.986 \times 10^{14}}{6.771 \times 10^6} = 5.887 \times 10^{7}\,\mathrm{m^2/s^2}.
$$

*Step 3: take the square root*, number and unit together, exactly as in the mental-arithmetic section:

$$
v = \sqrt{5.887 \times 10^7\,\mathrm{m^2/s^2}} \approx 7673\,\mathrm{m/s}.
$$

That is the $7.7\,\mathrm{km/s}$ you will hear quoted for **low Earth orbit** (LEO) — about $28\,000$ kilometres per hour, fast enough to cross the United States in about ten minutes.

*Escape speed* from the same radius is $\sqrt{2} \times 7673 \approx 10\,850\,\mathrm{m/s}$.

*Units check:* $\mathrm{m^3/s^2}$ divided by $\mathrm{m}$ is $\mathrm{m^2/s^2}$, and its square root is $\mathrm{m/s}$ — a speed. Taking the root of the unit is as necessary as taking the root of the number.
:::

## Scaling laws

Build a cube out of sugar cubes, two sugar cubes along each edge. Each face of the big cube shows $2 \times 2 = 4$ sugar-cube faces, and the whole thing uses $2 \times 2 \times 2 = 8$ sugar cubes. Make it three along each edge: each face shows $3^2 = 9$, and it uses $3^3 = 27$ sugar cubes. Lengths grew by $3$, areas by $9$, volumes by $27$.

That is the pattern for [[any shape|square-cube]]. If every length of an object grows by a factor $k$, then:

- its **areas** grow by $k^2$;
- its **volumes** — and so its masses, if it is made of the same stuff — grow by $k^3$.

So a rocket stage scaled up by $k = 1.5$ in every direction has $1.5^2 = 2.25$ times the skin area and $1.5^3 = 3.375$ times the propellant mass. Here is why that matters. The force of the pressurised propellant on the tank walls grows with area, but the amount of propellant grows with volume. The propellant grows faster than the structure needed to hold it, which is one reason bigger rockets are more efficient.

The same thinking works on orbits. The **period** $T$ of an orbit is the time for one lap: the distance around, $2\pi r$, divided by the speed. Using the speed from the last section,

$$
T = \frac{2\pi r}{v} = 2\pi r \sqrt{\frac{r}{\mu}} = 2\pi\sqrt{\frac{r^3}{\mu}}.
$$

(The middle step flipped $\sqrt{\mu/r}$ upside down, since dividing by it is multiplying by $\sqrt{r/\mu}$. The last step moved $r$ inside the root, where it becomes $r^2$, and $r^2 \cdot r = r^3$.)

So $T \propto r^{3/2}$. Doubling the radius multiplies the period by $2^{3/2} = 2\sqrt{2} \approx 2.83$. Quadrupling it multiplies the period by $4^{3/2} = \left(\sqrt{4}\right)^3 = 8$. This is **[[Kepler's third law|kepler-third]]**, and you have now derived it from two exponent rules and one square root.

::: key Exponent laws
$a^m a^n = a^{m+n}$, $\dfrac{a^m}{a^n} = a^{m-n}$, $(a^m)^n = a^{mn}$, $(ab)^n = a^n b^n$, $a^0 = 1$, $a^{-n} = \dfrac{1}{a^n}$, $a^{1/n} = \sqrt[n]{a}$, $a^{m/n} = \left(\sqrt[n]{a}\right)^m$. If $y \propto x^n$, scaling $x$ by $k$ scales $y$ by $k^n$.
:::

::: key Gravity and circular speed
$g(r) = \mu / r^2$ and $v = \sqrt{\mu / r}$ with $r$ measured from the centre of the body; for Earth $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ and $R = 6371\,\mathrm{km}$. Low Earth orbit speed is about $7.7\,\mathrm{km/s}$.
:::

## Check yourself

::: check
Without a calculator, write $5^0$, $5^{-2}$ and $10^{-3}$ as ordinary numbers. Which of them, if any, is negative?
:::

::: answer
$5^0 = 1$ (anything except zero to the power zero is $1$). $5^{-2} = \frac{1}{5^2} = \frac{1}{25} = 0.04$. $10^{-3} = \frac{1}{1000} = 0.001$.

None of them is negative. A negative exponent makes a number small, not negative.
:::

::: check
Simplify $27^{-2/3}$ and $\left(\dfrac{a^4 b^{-1}}{a b^{2}}\right)^{-2}$ without a calculator.
:::

::: answer
$27^{-2/3}$: the minus means "one over", the $3$ on the bottom means cube root ($\sqrt[3]{27} = 3$), and the $2$ on top means square it. So $27^{-2/3} = \dfrac{1}{\left(\sqrt[3]{27}\right)^2} = \dfrac{1}{3^2} = \dfrac{1}{9}$.

For the second, tidy up inside the bracket first, subtracting exponents base by base: $\dfrac{a^4 b^{-1}}{a b^2} = a^{4-1} b^{-1-2} = a^3 b^{-3}$. Now raise to the power $-2$ by multiplying each exponent by $-2$: $a^{-6} b^{6} = \dfrac{b^6}{a^6}$.
:::

::: check
Without working out any speed, by what factor is the circular orbital speed at $r = 4R$ smaller than at $r = R$? By what factor is the period longer?
:::

::: answer
$v \propto r^{-1/2}$, so multiplying $r$ by $4$ multiplies $v$ by $4^{-1/2} = \frac{1}{\sqrt{4}} = \frac{1}{2}$: half the speed.

$T \propto r^{3/2}$, so the period is multiplied by $4^{3/2} = 2^3 = 8$.

Sanity check: the lap is $4$ times longer and the satellite goes at half the speed, so a lap should take $4 \times 2 = 8$ times as long. It does.
:::

::: check
Write $\sqrt{50} + \sqrt{18} - \sqrt{8}$ as a single simplified radical, and give its decimal value.
:::

::: answer
Pull the perfect squares out of each: $\sqrt{50} = \sqrt{25 \cdot 2} = 5\sqrt{2}$, $\sqrt{18} = \sqrt{9 \cdot 2} = 3\sqrt{2}$, $\sqrt{8} = \sqrt{4 \cdot 2} = 2\sqrt{2}$. Now they are like terms: $(5 + 3 - 2)\sqrt{2} = 6\sqrt{2} \approx 8.49$.
:::

::: check
A satellite's period is $5400\,\mathrm{s}$ (ninety minutes). Using $T = 2\pi\sqrt{r^3/\mu}$, find its orbital radius and altitude.
:::

::: answer
Get $r$ alone by undoing each operation. Square both sides to remove the root: $T^2 = \dfrac{4\pi^2 r^3}{\mu}$. Multiply by $\mu$ and divide by $4\pi^2$: $r^3 = \dfrac{\mu T^2}{4\pi^2}$. Take the cube root: $r = \left(\dfrac{\mu T^2}{4\pi^2}\right)^{1/3}$.

Now the numbers. $T^2 = 5400^2 = 2.916 \times 10^7\,\mathrm{s^2}$, so $\mu T^2 = 3.986 \times 10^{14} \times 2.916 \times 10^7 = 1.162 \times 10^{22}$. Divide by $4\pi^2 = 39.48$ to get $2.944 \times 10^{20}\,\mathrm{m^3}$. The cube root is $6.65 \times 10^6\,\mathrm{m} = 6653\,\mathrm{km}$.

The altitude is $r - R = 6653 - 6371 \approx 282\,\mathrm{km}$. That is a low orbit, which makes sense: an orbit skimming Earth's surface would take about eighty-five minutes, so ninety is close to the fastest possible.
:::

::: check
Why is $\sqrt{x^2} = |x|$ rather than $x$? Give a value of $x$ for which the difference matters.
:::

::: answer
The square root sign always means the root that is not negative. For $x = -3$: $x^2 = 9$ and $\sqrt{9} = 3$, which is $|-3|$, not $-3$.

Forgetting this loses a minus sign whenever you take the square root of a squared negative quantity — a downward speed, for example.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Power | $a^n$ is $n$ copies of the base $a$ multiplied; $a^2$ squared, $a^3$ cubed |
| Product and quotient | $a^m a^n = a^{m+n}$, $a^m / a^n = a^{m-n}$ |
| Power of a power | $(a^m)^n = a^{mn}$; towers read top-down, $2^{3^2} = 512$ |
| Zero and negative | $a^0 = 1$, $a^{-n} = 1/a^n$ (small, not negative) |
| Fractional | $a^{1/n} = \sqrt[n]{a}$, $a^{m/n} = (\sqrt[n]{a})^m$; $\sqrt{x^2} = \lvert x \rvert$ |
| No splitting over $+$ | $\sqrt{a+b} \neq \sqrt{a} + \sqrt{b}$ |
| Prefixes | kilo $10^3$, mega $10^6$, giga $10^9$, milli $10^{-3}$, micro $10^{-6}$, nano $10^{-9}$ |
| Inverse square | $g = \mu / r^2$, $\mu_\oplus = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$, $r = R + h$ |
| Circular speed | $v = \sqrt{\mu / r} \approx 7.7\,\mathrm{km/s}$ in LEO; escape is $\sqrt{2}$ times larger |
| Period | $T = 2\pi\sqrt{r^3/\mu} \propto r^{3/2}$ |
| Scaling | $y \propto x^n$ means scaling $x$ by $k$ scales $y$ by $k^n$; areas $k^2$, volumes $k^3$ |

The next lesson moves from single powers to sums of them — **polynomials** — and to the special products that supply the missing $2ab$ from the warning above.

::: context exponent-word Forty-two folds to the Moon
Doubling gets out of hand fast. A sheet of printer paper is about $0.1\,\mathrm{mm}$ thick. Fold it $42$ times (impossible in real life, but fine on paper) and the stack is $0.1\,\mathrm{mm} \times 2^{42} \approx 440\,000\,\mathrm{km}$ thick — farther than the Moon, which is about $384\,000\,\mathrm{km}$ away. Forty-one folds would get you only just over halfway.

The word **exponent** comes from the Latin *exponere*, "to put out" or "to set out": the little number set out up top, telling you how many copies to multiply.
:::

::: context mu-gm Why μ, and not G times M
You may have seen gravity written with $G$, the universal gravitational constant, and $M$, Earth's mass. Engineers prefer their product, $\mu = GM$, for a practical reason: it is known far more precisely.

By tracking satellites — timing laser pulses bounced off them — $\mu$ for Earth is known to about nine significant figures. $G$ on its own, measured in laboratories with small weights, is known to only about five. Earth's mass is worked out by dividing $\mu$ by $G$, so it is no better than $G$. Orbits only ever need the product, so that is the number mission designers use.
:::

::: context squared-cubed Why a square and a cube
The names are pictures. Three squared is the number of tiles in a square three tiles on a side. Three cubed is the number of blocks in a cube three blocks on a side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="30" width="60" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1">
    <line x1="60" y1="30" x2="60" y2="90"/><line x1="80" y1="30" x2="80" y2="90"/>
    <line x1="40" y1="50" x2="100" y2="50"/><line x1="40" y1="70" x2="100" y2="70"/>
  </g>
  <text x="70" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="30" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="70" y="120" font-size="13" text-anchor="middle" fill="#1f2a44">3 × 3 = 9 tiles</text>
  <polygon points="200,50 224,26 284,26 260,50" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="260,50 284,26 284,86 260,110" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <rect x="200" y="50" width="60" height="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1">
    <line x1="220" y1="50" x2="220" y2="110"/><line x1="240" y1="50" x2="240" y2="110"/>
    <line x1="200" y1="70" x2="260" y2="70"/><line x1="200" y1="90" x2="260" y2="90"/>
    <line x1="208" y1="42" x2="268" y2="42"/><line x1="216" y1="34" x2="276" y2="34"/>
    <line x1="220" y1="50" x2="244" y2="26"/><line x1="240" y1="50" x2="264" y2="26"/>
    <line x1="268" y1="42" x2="268" y2="102"/><line x1="276" y1="34" x2="276" y2="94"/>
    <line x1="260" y1="70" x2="284" y2="46"/><line x1="260" y1="90" x2="284" y2="66"/>
  </g>
  <text x="242" y="140" font-size="13" text-anchor="middle" fill="#1f2a44">3 × 3 × 3 = 27 blocks</text>
</svg>
```

That is also why areas come in square metres ($\mathrm{m^2}$) and volumes in cubic metres ($\mathrm{m^3}$): the exponent on the unit counts how many lengths were multiplied together.
:::

::: context tower-top-down Why towers are read top-down
It is a rule people agreed on, and a sensible one. If you meant "bottom up", $(2^3)^2$, the power-of-a-power rule already lets you write it more simply as $2^{3 \cdot 2} = 2^6$ — no tower needed. So the tower is saved for the meaning that has no shortcut: $2^{(3^2)} = 2^9$.

Calculators and programming languages follow the same rule. In Python, `2**3**2` gives `512`, not `64`.
:::

::: context prefix-names Giants, dwarfs and thousands
The prefixes are old Greek and Latin words. **Kilo** comes from the Greek for "thousand", and **milli** from the Latin for "thousand" (a thousandth part). **Mega** means "great", **giga** "giant", **micro** "small" and **nano** "dwarf". So a nanometre is, word for word, a "dwarf metre".

You will meet meganewtons straight away in rocketry. A single Merlin engine on a Falcon 9 first stage pushes with about $845\,\mathrm{kN}$ at sea level, and all nine together make about $7.6\,\mathrm{MN}$.
:::

::: context radix Roots and radishes
**Radicand** and **radical** come from the Latin *radix*, "root" — the same word that gave English the *radish*, a vegetable that is mostly root. The radicand is "the thing whose root is taken".

The root sign $\sqrt{\ }$ is usually said to have grown out of a quickly written letter r, for *radix*. It first appeared in print in a German algebra book in 1525. The bar over the top, which shows how far the root reaches, was added later.
:::

::: context rationalise-why Why people bothered
Before calculators, division was done by hand, digit by digit. Work out $\frac{1}{\sqrt{2}}$ directly and you must divide $1$ by $1.41421\ldots$ — a long division by a messy number. Rationalise first and it becomes $\frac{\sqrt{2}}{2}$: just halve $1.41421$ to get $0.70711$. Same number, far less work.

The name comes from **rational number**: a number that can be written as a fraction of two whole numbers. $\sqrt{2}$ cannot be, so rationalising means leaving only a rational number on the bottom.
:::

::: context spreading-out Same spray, bigger patch
Every drop from the nozzle travels in a straight line, so the patch grows in both directions at once. At twice the distance it is twice as wide and twice as tall — four patches' worth. At three times the distance, nine.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="300" y2="47.5" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="20" y1="100" x2="300" y2="152.5" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="20" cy="100" r="5" fill="#b4232c"/>
  <text x="20" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">spray</text>
  <line x1="100" y1="85" x2="100" y2="115" stroke="#1d6fd1" stroke-width="4"/>
  <line x1="180" y1="70" x2="180" y2="130" stroke="#1d6fd1" stroke-width="4"/>
  <line x1="260" y1="55" x2="260" y2="145" stroke="#1d6fd1" stroke-width="4"/>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="100" y="40">d</text><text x="180" y="40">2d</text><text x="260" y="40">3d</text>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="94" y="165" width="12" height="12"/>
    <rect x="168" y="159" width="24" height="24"/>
    <rect x="242" y="153" width="36" height="36"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <line x1="180" y1="159" x2="180" y2="183"/><line x1="168" y1="171" x2="192" y2="171"/>
    <line x1="254" y1="153" x2="254" y2="189"/><line x1="266" y1="153" x2="266" y2="189"/>
    <line x1="242" y1="165" x2="278" y2="165"/><line x1="242" y1="177" x2="278" y2="177"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="100" y="204">1 patch</text><text x="180" y="204">4 patches</text><text x="260" y="204">9 patches</text>
  </g>
</svg>
```

Light, sound and radio spread the same way. That is why a space probe's signal is so faint by the time it reaches home: the Voyager probes, more than $20$ billion kilometres out, are heard with dish antennas $70$ metres across.
:::

::: context falling-together Always falling, always missing
Isaac Newton imagined a cannon on a very tall mountain. Fire the ball slowly and it curves down to the ground nearby. Fire it faster and it lands farther away. Fire it fast enough and the ground curves away beneath it as fast as it falls, so it falls all the way around the Earth and never lands. That is an orbit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="130" r="82" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="180" cy="130" r="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="172,61 180,48 188,61" fill="#6c7a93" stroke="#1f2a44" stroke-width="1"/>
  <path d="M180,48 Q205,50 215,69.4" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M180,48 Q236,50 247.6,111.9" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="135" font-size="13" text-anchor="middle" fill="#1f2a44">Earth</text>
  <text x="300" y="60" font-size="11" text-anchor="middle" fill="#b4232c">slow: lands</text>
  <text x="300" y="75" font-size="11" text-anchor="middle" fill="#b4232c">faster: lands</text>
  <text x="300" y="90" font-size="11" text-anchor="middle" fill="#b4232c">farther away</text>
  <text x="60" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">fast enough:</text>
  <text x="60" y="45" font-size="11" text-anchor="middle" fill="#1d6fd1">falls all the</text>
  <text x="60" y="60" font-size="11" text-anchor="middle" fill="#1d6fd1">way around</text>
</svg>
```

The space station does this at about $7.7\,\mathrm{km/s}$, going once around every $93$ minutes — about fifteen and a half times a day. Everything inside falls at the same rate, so nothing presses on anything. That is what floating is.
:::

::: context escape-speed Eleven kilometres per second
From Earth's surface, ignoring the air, escape speed is $\sqrt{2\mu/R} \approx 11.2\,\mathrm{km/s}$ — about $40\,000$ kilometres per hour. No rocket leaves the ground that fast; the air would burn it up. Instead, a probe bound for Mars first climbs to orbit at about $7.7\,\mathrm{km/s}$, then fires again, above the air, to go faster than the local escape speed.

Escape speed does not depend on the probe's mass: a pebble and a spacecraft need the same speed. Nor does it depend on direction, as long as the path does not run into the planet.
:::

::: context square-cube Galileo's giants
This pattern is called the **square–cube law**. Galileo wrote about it in 1638. Scale an animal up and its weight (a volume) grows faster than the strength of its bones (which depends on their cross-section, an area). A giant built exactly like a person would break its own legs. That is why an elephant's legs are so thick for its size.

Rockets feel the law both ways. Growing bigger helps, because the propellant grows faster than much of the structure around it. Shrinking hurts: very small rockets struggle, because their structure is a larger share of their mass.
:::

::: context kepler-third Kepler found it first
Johannes Kepler discovered this rule in 1619 by puzzling over years of careful planet measurements made by the astronomer Tycho Brahe. He had no idea *why* it worked. Newton explained it about seventy years later, with the law of gravity — the same derivation you just did.

Try it on Mars. Mars is $1.524$ times as far from the Sun as Earth, so its year should be $1.524^{3/2} \approx 1.88$ Earth years. The measured value is $1.88$ years. The rule works around the Sun, which has its own $\mu$, because it only compares orbits around the same body.
:::
