---
id: l04-fractions-from-the-ground-up
title: Fractions from the ground up
minutes: 25
covers:
  - fractions from the ground up
---

The fuel gauge in a car has an E at one end, an F at the other, and marks for a quarter, a half and three quarters in between. You can read it at a glance: three quarters full means most of the tank is left. That is a fraction, and you already understand it.

A rocket engineer reads the same kind of number all day. About eleven twelfths of a typical rocket stage on the launch pad is propellant. A quarter turn is a right angle. The oxygen tank holds a bigger fraction of the propellant than the fuel tank does. And the algebra module, which comes next, does arithmetic with fractions quickly — adding, multiplying and dividing them — on the assumption that the basics are already solid.

This lesson makes them solid. It builds fractions from pictures — sharing things out, marking a number line, cutting strips into equal parts — then shows when two fractions are the same amount, how to write a fraction in its simplest form, how to compare two fractions, and how to turn any fraction into a decimal or a percent. The factors, primes and least common multiples from the last lesson do most of the work.

## A fraction is equal sharing

Cut a pizza into 4 equal slices and take 3 of them. You have three quarters of the pizza, written $\frac{3}{4}$.

The two numbers have names:

- The bottom number, the **[[denominator|fraction-bar]]**, says how many equal pieces the whole was cut into. Here, 4.
- The top number, the **numerator**, says how many of those pieces you have. Here, 3.

The pieces must be *equal*. If you cut a pizza into four slices of wildly different sizes and take three, you do not have three quarters — you might have almost all of it or almost none. A fraction only means something when every piece is the same size.

### Sharing is dividing

Here is another way to get three quarters. Share 3 pizzas among 4 friends. Cut every pizza into quarters: that gives 12 quarters, and each friend takes 3 of them. [[Each friend ends up with 3/4 of a pizza|sharing-picture]].

So $\frac{3}{4}$ also means $3 \div 4$. The fraction bar *is* a division sign. That is the single most useful fact about fractions: **a fraction is a division waiting to be done.**

This also explains why the denominator can never be 0. Sharing pizza among zero friends is not a question with an answer.

To say all this once for every fraction, mathematicians use letters as placeholders: $\frac{a}{b}$ stands for "some number $a$ over some number $b$". (Lesson 5 is all about letters standing for numbers.)

::: key What a fraction means
$\frac{a}{b}$ means $a$ of $b$ equal pieces, and also $a \div b$. The **numerator** $a$ counts the pieces; the **denominator** $b$ says how many equal pieces make a whole. The denominator is never 0.
:::

## Fractions on a number line

Fractions are numbers, so they have places on the number line. To find $\frac{3}{4}$, cut the stretch from 0 to 1 into 4 equal steps, then count 3 steps from 0. That is where $\frac{3}{4}$ sits — three quarters of the way from 0 to 1. A car's fuel gauge is exactly this line, with E at 0 and F at 1.

Nothing stops you from counting past 1. Keep taking quarter-steps and you reach $\frac{4}{4}$, which is exactly 1, then $\frac{5}{4}$, which is one and a quarter. [[All of these sit on the same line|fraction-line]].

That tells you some useful things right away:

- When the numerator is smaller than the denominator, the fraction is less than 1. $\frac{3}{4} < 1$.
- When they are equal, the fraction is exactly 1. $\frac{4}{4} = 1$ and $\frac{12}{12} = 1$.
- When the numerator is bigger, the fraction is more than 1. $\frac{5}{4} > 1$.
- A whole number is a fraction with denominator 1: $3 = \frac{3}{1}$.

## Equivalent fractions: same amount, different pieces

Take a strip of paper and fold it in half. One of the halves is $\frac{1}{2}$. Fold it in half again: now there are 4 equal parts, and the same half covers 2 of them, $\frac{2}{4}$. Fold once more and it covers 4 of 8, $\frac{4}{8}$.

The amount of paper never changed. Only the size of the pieces did. Fractions that name the same amount are called **equivalent fractions**, and [[strips of paper show it|fraction-strips]]:

$$
\frac{1}{2} = \frac{2}{4} = \frac{4}{8}.
$$

Each fold doubled the number of pieces *and* doubled the number you have. That is the rule: multiplying the top and the bottom by the same number (not zero) gives an equivalent fraction.

$$
\frac{3}{4} = \frac{3 \times 3}{4 \times 3} = \frac{9}{12}.
$$

Cut each quarter into 3 smaller slices, and 3 quarters become 9 twelfths.

::: key Equivalent fractions
Multiplying or dividing the top and the bottom by the same number $k$ (not zero) does not change a fraction's value: $\frac{a}{b} = \frac{ka}{kb}$, where $ka$ means $k \times a$. So $\frac{1}{2} = \frac{2}{4} = \frac{4}{8}$ and $\frac{3}{4} = \frac{9}{12}$.
:::

::: note Why multiplying top and bottom is allowed
$\frac{3}{3}$ is 1: three thirds make a whole. And multiplying any number by 1 leaves it alone. So $\frac{3}{4} \times \frac{3}{3} = \frac{9}{12}$ has to be the same amount as $\frac{3}{4}$. Every equivalent fraction is the original multiplied by a clever way of writing 1.
:::

## Simplest form

Going the other way — dividing the top and the bottom by the same number — makes the pieces bigger and the numbers smaller. This is called **simplifying**. A fraction is in **simplest form** (also called **lowest terms**) when the top and the bottom have no common factor except 1.

You can simplify in small steps. $\frac{24}{36}$: both are even, so divide by 2 to get $\frac{12}{18}$. Both are still even: $\frac{6}{9}$. Both divide by 3: $\frac{2}{3}$. Now 2 and 3 share no factor, so you are done.

Or do it in one step with the **greatest common factor** from the last lesson. The GCF of 24 and 36 is 12, and dividing both by 12 gives $\frac{2}{3}$ at once. Same answer, fewer steps.

::: example Simplifying a real rocket fraction
**The problem.** A rocket stage (not counting what it carries) has a mass of 432 t, and 410 t of that is propellant. What fraction is propellant, in simplest form?

**The fraction** is $\frac{410}{432}$ — the part over the whole.

**Find the shared primes.** Break both into primes, as in the last lesson:

$$
410 = 2 \times 5 \times 41, \qquad 432 = 2 \times 2 \times 2 \times 2 \times 3 \times 3 \times 3.
$$

The only prime they share is one 2, so the GCF is 2.

**Divide both by 2:**

$$
\frac{410}{432} = \frac{205}{216}.
$$

**Is it finished?** $205 = 5 \times 41$ and $216 = 2 \times 2 \times 2 \times 3 \times 3 \times 3$ share no primes at all, so yes, $\frac{205}{216}$ is the simplest form.

**Does that make sense?** 205 is a little less than 216, so the fraction is a little less than 1. Almost all of the stage is propellant, which is what rockets are like.
:::

::: warning Cancel factors, never digits
Simplifying means dividing the whole top and the whole bottom by the same number. It does not mean crossing out matching digits. In $\frac{12}{24}$ you might be tempted to cross out both 2s and get $\frac{1}{4}$. Wrong: $\frac{12}{24}$ is $\frac{1}{2}$, since 12 is half of 24. Crossing out digits is not a mathematical operation, and when it happens to give the right answer, that is luck.
:::

## Mixed numbers and improper fractions

When the numerator is bigger than the denominator, the fraction is called **improper** — nothing is wrong with it, it is only more than 1. Seven quarters, $\frac{7}{4}$, is seven quarter-pizzas. Four of them make a whole pizza, and three are left over. So $\frac{7}{4}$ is one whole and three quarters, written $1\tfrac{3}{4}$ and read "one and three quarters". That way of writing it is a **mixed number**.

**Improper to mixed:** divide the top by the bottom. The quotient is the whole number, and the remainder is the new top.

$$
\frac{19}{12}: \quad 19 \div 12 = 1 \text{ remainder } 7, \quad \text{so} \quad \frac{19}{12} = 1\tfrac{7}{12}.
$$

**Mixed to improper:** multiply the whole number by the denominator, add the numerator, and keep the denominator.

$$
2\tfrac{3}{8}: \quad 2 \times 8 + 3 = 19, \quad \text{so} \quad 2\tfrac{3}{8} = \frac{19}{8}.
$$

Two whole things are 16 eighths, and 3 more eighths make 19 eighths.

::: warning Engineers use improper fractions
Mixed numbers are good for saying how big something is ("about twelve and a bit"). But for calculating, use improper fractions. $1\tfrac{3}{4}$ sitting next to a letter can look like multiplication, and the algebra rules for fractions are written for the plain $\frac{7}{4}$ form. Convert to improper before you calculate, and back to mixed only if you want to describe the answer.
:::

::: example A mass ratio as a mixed number
**The problem.** A loaded stage weighs 447 t at lift-off and 37 t when its propellant is gone. The fraction $\frac{447}{37}$ says how many times heavier it is at the start. Write it as a mixed number.

**Divide.** How many 37s fit in 447? $37 \times 12 = 444$, and $447 - 444 = 3$. So 12, remainder 3.

**The answer:** $\frac{447}{37} = 12\tfrac{3}{37}$. The stage is a bit more than twelve times heavier at lift-off than at the end.

**Check:** $12 \times 37 + 3 = 444 + 3 = 447$. The algebra module calls this number the stage's **mass ratio** and keeps it as the improper fraction (or the decimal) for calculating.
:::

## Comparing fractions

Which is more, $\frac{2}{3}$ or $\frac{3}{4}$ of a tank? There are several ways to tell, and which is quickest depends on the fractions.

**Same denominator:** the pieces are the same size, so the bigger numerator wins. $\frac{5}{8} > \frac{3}{8}$.

**Same numerator:** you have the same number of pieces, so the one with *bigger* pieces wins — and bigger pieces means a *smaller* denominator. $\frac{3}{7} > \frac{3}{8}$, because sevenths are bigger than eighths. (Share a pizza among 7 people and you get more than sharing among 8.)

**Different both ways: use a common denominator.** Rewrite both fractions as equivalent fractions with the same denominator, then compare the numerators. The best choice of denominator is the **least common multiple** of the two denominators — the smallest slice size both can be cut into. For $\frac{2}{3}$ and $\frac{3}{4}$, the LCM of 3 and 4 is 12:

$$
\frac{2}{3} = \frac{8}{12}, \qquad \frac{3}{4} = \frac{9}{12}.
$$

Nine twelfths beats eight twelfths, so $\frac{3}{4}$ is bigger, by $\frac{1}{12}$.

**Or use decimals:** do the divisions and compare. $\frac{2}{3} = 0.666\ldots$ and $\frac{3}{4} = 0.75$, so $\frac{3}{4}$ is bigger. This is often fastest with a calculator, and a good check without one.

There is also a [[shortcut called cross-multiplying|cross-multiply]] that does the common-denominator method in one line.

::: key Comparing fractions
Same denominator: the bigger numerator is bigger. Same numerator: the smaller denominator is bigger. Otherwise, rewrite both over a common denominator (the LCM of the two denominators) and compare the numerators — or change both to decimals.
:::

::: example Which tank is fuller?
**The problem.** One tank is $\frac{7}{10}$ full. Another, the same size, is $\frac{2}{3}$ full. Which holds more?

**Common denominator.** The LCM of 10 and 3 is 30, because they share no primes, so it is $10 \times 3$. Rewrite each fraction over 30:

$$
\frac{7}{10} = \frac{7 \times 3}{10 \times 3} = \frac{21}{30}, \qquad \frac{2}{3} = \frac{2 \times 10}{3 \times 10} = \frac{20}{30}.
$$

Twenty-one thirtieths is more than twenty thirtieths. The first tank holds more, but only by $\frac{1}{30}$ of a tank.

**Check with decimals.** $\frac{7}{10} = 0.7$ and $\frac{2}{3} = 0.666\ldots$, and $0.7$ is bigger. The two methods agree.
:::

### Adding pieces of the same size

Once two fractions have the same denominator, adding them is counting pieces. Three eighths of a tank plus two eighths of a tank is five eighths of a tank:

$$
\frac{3}{8} + \frac{2}{8} = \frac{5}{8}.
$$

Add the numerators and keep the denominator — the pieces are still eighths. When the denominators are different, you first rewrite both over a common denominator, exactly as for comparing. The algebra module's first lesson picks up from there, with subtracting, multiplying and dividing fractions too.

::: warning Never add the denominators
$\frac{3}{8} + \frac{2}{8}$ is $\frac{5}{8}$, not $\frac{5}{16}$. The denominator names the size of the pieces, and adding eighths to eighths still gives eighths. A quick check: $\frac{5}{16}$ is *less* than the $\frac{3}{8} = \frac{6}{16}$ you started with. Adding more fuel cannot leave you with less.
:::

## Fractions, decimals and percents

A fraction, a decimal and a percent are three ways of writing the same number.

**Fraction to decimal:** do the division. Because $\frac{1}{4}$ means $1 \div 4$, and one dollar shared among 4 is 25 cents, $\frac{1}{4} = 0.25$.

**Decimal to percent:** multiply by 100. **Percent** means "out of a hundred" ([[the word says so|percent-word]]), so $0.25$ is 25 hundredths, which is $25\%$.

$$
\frac{1}{4} = 0.25 = 25\%.
$$

**Going backwards:** a percent is a fraction over 100, which you can then simplify. $35\% = \frac{35}{100}$, and dividing top and bottom by 5 gives $\frac{7}{20}$. A decimal becomes a fraction over 10, 100 or 1,000, depending on how many places it has: $0.375 = \frac{375}{1000}$, which simplifies (divide by 125) to $\frac{3}{8}$.

::: key Fraction, decimal, percent
$\frac{1}{4} = 0.25 = 25\%$. A percent is "out of a hundred"; a decimal is the division done. To go from decimal to percent, multiply by 100 (the digits move two places left).
:::

A few are worth knowing by heart, because they come up constantly:

| Fraction | Decimal | Percent |
| --- | --- | --- |
| $\frac{1}{2}$ | 0.5 | 50% |
| $\frac{1}{4}$ | 0.25 | 25% |
| $\frac{3}{4}$ | 0.75 | 75% |
| $\frac{1}{5}$ | 0.2 | 20% |
| $\frac{1}{8}$ | 0.125 | 12.5% |
| $\frac{1}{10}$ | 0.1 | 10% |
| $\frac{1}{3}$ | 0.333… | 33.3…% |
| $\frac{2}{3}$ | 0.666… | 66.6…% |

Notice the last two. Some fractions give decimals that **repeat** forever. Which ones? Write the fraction in simplest form and look at the denominator's primes. If the only primes are 2s and 5s, the decimal [[stops|which-decimals-end]]. Anything else — a 3, a 7, an 11 — and it repeats. So $\frac{7}{20}$ stops ($20 = 2 \times 2 \times 5$), but $\frac{1}{6}$ repeats ($6 = 2 \times 3$): $0.1666\ldots$.

### A fraction of an amount

"Three quarters of 400 tonnes" means: cut 400 tonnes into 4 equal parts, and take 3 of them. Divide by the bottom, multiply by the top:

$$
400 \div 4 = 100, \qquad 100 \times 3 = 300 \text{ tonnes}.
$$

The word "of" in "a fraction of an amount" means multiply: $\frac{3}{4} \times 400 = 300$. And a percent of an amount works the same way, because a percent is a fraction: $25\%$ of 400 t is $\frac{1}{4}$ of 400 t, which is 100 t.

::: example A propellant fraction three ways
**The problem.** Of the 447 t a stage weighs on the launch pad, 410 t is propellant. Write that as a fraction, a decimal and a percent.

**Fraction.** Part over whole: $\frac{410}{447}$. Is it in simplest form? $447 = 3 \times 149$ and $410 = 2 \times 5 \times 41$ share no primes, so yes.

**Decimal.** Divide 410 by 447 with long division. 447 does not fit into 410, so the answer starts $0.$ and we work in tenths:

- 4,100 tenths: $447 \times 9 = 4023$ fits, leaving 77. First digit 9.
- Bring down a 0 to get 770: $447 \times 1 = 447$ fits, leaving 323. Next digit 1.
- Bring down a 0 to get 3,230: $447 \times 7 = 3129$ fits, leaving 101. Next digit 7.

So $\frac{410}{447} \approx 0.917$.

**Percent.** Multiply by 100: $0.917 \times 100 = 91.7\%$.

**Does that make sense?** The denominator 447 has the prime 149 in it, not only 2s and 5s, so the decimal should go on without stopping — and it does. And about 92% propellant is typical: a rocket is mostly a flying fuel tank. That is about eleven twelfths, as the opening said: $\frac{11}{12} = 0.9166\ldots$
:::

::: note Where this comes back
- [Signed numbers, fractions and ratios](#/module/t0_m01_algebra_precalc?lesson=l01-signed-numbers-and-fractions) adds, subtracts, multiplies and divides fractions, and works with the stage's mass ratio $\frac{447}{37}$ and propellant fraction $0.917$ from this lesson.
- [Angles, radians and the unit circle](#/module/t0_m02_trigonometry?lesson=l01-angles-radians-unit-circle) describes the key angles as fractions of a turn: $30^\circ$ is $\frac{1}{12}$ of a turn and $45^\circ$ is $\frac{1}{8}$.
- [Polynomials, expanding and factoring](#/module/t0_m01_algebra_precalc?lesson=l03-polynomials-and-factoring) simplifies fractions with letters in them — and the rule "cancel factors, never digits" becomes "cancel factors, never terms".
- [Floating point](#/module/t0_m03_python_scicomp?lesson=l06-floating-point) explains why a computer cannot store one tenth exactly. It is the "which decimals stop?" rule again, in base two.
:::

## Check yourself

::: check
Fill in the missing numbers: $\frac{3}{4} = \frac{?}{12} = \frac{15}{?}$.
:::

::: answer
To get from 4 to 12, the bottom was multiplied by 3, so the top must be too: $3 \times 3 = 9$, giving $\frac{9}{12}$.

To get from 3 to 15, the top was multiplied by 5, so the bottom must be too: $4 \times 5 = 20$, giving $\frac{15}{20}$.

So $\frac{3}{4} = \frac{9}{12} = \frac{15}{20}$.
:::

::: check
Write $\frac{36}{48}$ in simplest form, in one step.
:::

::: answer
Find the GCF. $36 = 2 \times 2 \times 3 \times 3$ and $48 = 2 \times 2 \times 2 \times 2 \times 3$. They share two 2s and one 3, so the GCF is $2 \times 2 \times 3 = 12$.

Divide both by 12: $\frac{36}{48} = \frac{3}{4}$. Now 3 and 4 share no factor, so it is in simplest form.
:::

::: check
Write $\frac{23}{5}$ as a mixed number, and $3\tfrac{2}{7}$ as an improper fraction.
:::

::: answer
23 ÷ 5 is 4 with remainder 3 (because $4 \times 5 = 20$ and $23 - 20 = 3$). So $\frac{23}{5} = 4\tfrac{3}{5}$.

$3\tfrac{2}{7}$: multiply the whole number by the denominator and add the top: $3 \times 7 + 2 = 23$. So $3\tfrac{2}{7} = \frac{23}{7}$.
:::

::: check
Which is bigger, $\frac{4}{7}$ or $\frac{5}{9}$? Show it with a common denominator, then check with decimals.
:::

::: answer
7 and 9 share no primes, so their LCM is $7 \times 9 = 63$.

$\frac{4}{7} = \frac{4 \times 9}{7 \times 9} = \frac{36}{63}$ and $\frac{5}{9} = \frac{5 \times 7}{9 \times 7} = \frac{35}{63}$.

36 sixty-thirds is more, so $\frac{4}{7}$ is bigger — by only $\frac{1}{63}$.

Decimals: $\frac{4}{7} \approx 0.571$ and $\frac{5}{9} \approx 0.556$. The first is bigger. They agree.
:::

::: check
Write $\frac{3}{8}$ as a decimal and a percent. Write $0.35$ as a fraction in simplest form.
:::

::: answer
$\frac{3}{8} = 3 \div 8$. Eight into 30 tenths goes 3 times (24), leaving 6; into 60 hundredths goes 7 times (56), leaving 4; into 40 thousandths goes 5 times exactly. So $\frac{3}{8} = 0.375$. It stops because $8 = 2 \times 2 \times 2$. As a percent, $0.375 \times 100 = 37.5\%$.

$0.35 = \frac{35}{100}$. The GCF of 35 and 100 is 5, so it simplifies to $\frac{7}{20}$.
:::

::: check
A tank holds 250 kg of propellant when full, and the gauge reads three fifths. How many kilograms are in it? What percent full is it?
:::

::: answer
Three fifths of 250 kg: divide by the bottom, $250 \div 5 = 50$, then multiply by the top, $50 \times 3 = 150$ kg.

As a percent: $\frac{3}{5} = 3 \div 5 = 0.6$, and $0.6 \times 100 = 60\%$. Check: $60\%$ of 250 kg is $0.6 \times 250 = 150$ kg. The same.
:::

## Summary

| Idea | In one line |
| --- | --- |
| A fraction | $\frac{a}{b}$ is $a$ of $b$ equal pieces, and also $a \div b$; $b$ is never 0 |
| Numerator, denominator | top counts the pieces; bottom says how many make a whole |
| Equivalent fractions | multiply or divide top and bottom by the same number: $\frac{3}{4} = \frac{9}{12}$ |
| Simplest form | divide top and bottom by their GCF; cancel factors, never digits |
| Improper to mixed | divide: quotient is the whole number, remainder is the new top |
| Mixed to improper | whole × denominator + numerator, over the same denominator |
| Comparing | common denominator (the LCM), then compare tops; or compare decimals |
| Adding like pieces | $\frac{3}{8} + \frac{2}{8} = \frac{5}{8}$; never add the denominators |
| Fraction, decimal, percent | $\frac{1}{4} = 0.25 = 25\%$; percent is "out of a hundred" |
| Which decimals stop | simplest-form denominator with only 2s and 5s as primes |
| Fraction of an amount | divide by the bottom, multiply by the top |

Next lesson: numbers you do not know yet get a letter to stand in for them, and a formula becomes a recipe you can fill in — the first step from arithmetic into algebra.

::: context fraction-bar Numerator, denominator and the fraction bar
The words come from Latin: **numerator** means "counter", because it counts the pieces, and **denominator** means "namer", because it names their size — halves, thirds, quarters. The line between them is a division sign in disguise. The ÷ symbol, first used for division in a book printed in 1659, even looks like a tiny fraction with dots where the numbers go. Calculators and computers write fractions with a slash: `3/4`.
:::

::: context sharing-picture Three pizzas, four friends
Cut each of the 3 pizzas into quarters. That makes 12 quarters. Give them out in turn, and each of the 4 friends gets 3 quarters — shown here in each friend's color.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <g transform="translate(65,65)">
      <path d="M0,0 L0,-45 A45,45 0 0,1 45,0 Z" fill="#1d6fd1"/>
      <path d="M0,0 L45,0 A45,45 0 0,1 0,45 Z" fill="#8fb8f0"/>
      <path d="M0,0 L0,45 A45,45 0 0,1 -45,0 Z" fill="#f2b880"/>
      <path d="M0,0 L-45,0 A45,45 0 0,1 0,-45 Z" fill="#b4232c"/>
    </g>
    <g transform="translate(180,65)">
      <path d="M0,0 L0,-45 A45,45 0 0,1 45,0 Z" fill="#1d6fd1"/>
      <path d="M0,0 L45,0 A45,45 0 0,1 0,45 Z" fill="#8fb8f0"/>
      <path d="M0,0 L0,45 A45,45 0 0,1 -45,0 Z" fill="#f2b880"/>
      <path d="M0,0 L-45,0 A45,45 0 0,1 0,-45 Z" fill="#b4232c"/>
    </g>
    <g transform="translate(295,65)">
      <path d="M0,0 L0,-45 A45,45 0 0,1 45,0 Z" fill="#1d6fd1"/>
      <path d="M0,0 L45,0 A45,45 0 0,1 0,45 Z" fill="#8fb8f0"/>
      <path d="M0,0 L0,45 A45,45 0 0,1 -45,0 Z" fill="#f2b880"/>
      <path d="M0,0 L-45,0 A45,45 0 0,1 0,-45 Z" fill="#b4232c"/>
    </g>
  </g>
  <text x="180" y="136" font-size="12" fill="#1f2a44" text-anchor="middle">one color per friend: 3 slices each = 3/4 of a pizza</text>
</svg>
```
:::

::: context fraction-line Quarters on the number line
Cut each whole step into 4 equal parts and count. Three quarter-steps land at $\frac{3}{4}$; five land past 1, at $\frac{5}{4} = 1\tfrac{1}{4}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="55" x2="340" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="20" y1="45" x2="20" y2="65"/><line x1="180" y1="45" x2="180" y2="65"/><line x1="340" y1="45" x2="340" y2="65"/>
    <line x1="60" y1="50" x2="60" y2="60"/><line x1="100" y1="50" x2="100" y2="60"/><line x1="140" y1="50" x2="140" y2="60"/>
    <line x1="220" y1="50" x2="220" y2="60"/><line x1="260" y1="50" x2="260" y2="60"/><line x1="300" y1="50" x2="300" y2="60"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="84">0</text><text x="60" y="84">1/4</text><text x="100" y="84">2/4</text><text x="140" y="84">3/4</text>
    <text x="180" y="84" font-weight="700">1 = 4/4</text><text x="220" y="84">5/4</text><text x="260" y="84">6/4</text><text x="300" y="84">7/4</text>
    <text x="340" y="84" font-weight="700">2</text>
  </g>
  <circle cx="140" cy="55" r="6" fill="#1d6fd1"/>
  <circle cx="220" cy="55" r="6" fill="#b4232c"/>
  <text x="140" y="35" font-size="11" fill="#1d6fd1" text-anchor="middle">less than 1</text>
  <text x="220" y="35" font-size="11" fill="#b4232c" text-anchor="middle">more than 1</text>
</svg>
```
:::

::: context fraction-strips Folding a strip of paper
Every fold doubles the number of pieces and doubles how many pieces the shaded part covers. The shaded length never changes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="15" width="120" height="28" fill="#8fb8f0"/><rect x="140" y="15" width="120" height="28" fill="#fff"/>
    <rect x="20" y="58" width="60" height="28" fill="#8fb8f0"/><rect x="80" y="58" width="60" height="28" fill="#8fb8f0"/>
    <rect x="140" y="58" width="60" height="28" fill="#fff"/><rect x="200" y="58" width="60" height="28" fill="#fff"/>
    <rect x="20" y="101" width="30" height="28" fill="#8fb8f0"/><rect x="50" y="101" width="30" height="28" fill="#8fb8f0"/>
    <rect x="80" y="101" width="30" height="28" fill="#8fb8f0"/><rect x="110" y="101" width="30" height="28" fill="#8fb8f0"/>
    <rect x="140" y="101" width="30" height="28" fill="#fff"/><rect x="170" y="101" width="30" height="28" fill="#fff"/>
    <rect x="200" y="101" width="30" height="28" fill="#fff"/><rect x="230" y="101" width="30" height="28" fill="#fff"/>
  </g>
  <g font-size="14" fill="#1f2a44">
    <text x="275" y="34">1/2</text><text x="275" y="77">2/4</text><text x="275" y="120">4/8</text>
  </g>
  <line x1="140" y1="8" x2="140" y2="138" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4,3"/>
</svg>
```
:::

::: context cross-multiply The cross-multiplying shortcut
To compare $\frac{a}{b}$ and $\frac{c}{d}$, compare $a \times d$ with $c \times b$. For $\frac{2}{3}$ and $\frac{3}{4}$: $2 \times 4 = 8$ and $3 \times 3 = 9$, so $\frac{3}{4}$ is bigger.

Why it works: rewrite both over the denominator $b \times d$. The first becomes $\frac{a \times d}{b \times d}$ and the second $\frac{c \times b}{d \times b}$. The bottoms are now the same, so the tops decide — and the tops are exactly the two cross products. It is the common-denominator method with the denominator left unwritten.
:::

::: context percent-word Where "percent" comes from
"Percent" comes from the Latin *per centum*, "for each hundred". So $25\%$ means 25 for each hundred, or $\frac{25}{100}$. The % sign grew out of an old handwritten abbreviation of the words. Engineers use percents mostly for comparing: a margin of 5%, a mass that went up 2.75%. Always ask "percent of what?" — the algebra module makes a point of it.
:::

::: context which-decimals-end Why only 2s and 5s make decimals stop
Our decimals are built on tenths, hundredths and thousandths, and $10 = 2 \times 5$. A fraction can be rewritten over 10, 100 or 1,000 only if its denominator divides into one of them — and every factor of those numbers is made of 2s and 5s. So $\frac{3}{8} = \frac{375}{1000}$ stops, but no power of ten is a multiple of 3, so $\frac{1}{3}$ never can.

A computer counts in base two, so there only denominators made of 2s stop. One tenth has a 5 in its denominator, so in a computer it repeats forever and has to be cut off — which is why $0.1$ stored in a computer is very slightly off.
:::
