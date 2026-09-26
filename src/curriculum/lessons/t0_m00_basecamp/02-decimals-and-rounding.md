---
id: l02-decimals-and-rounding
title: Decimals and rounding
minutes: 24
covers:
  - decimals and rounding
---

A price tag that says \$3.47 means three dollars and forty-seven cents: more than three dollars, less than four. The dot in the middle, the **[[decimal point|decimal-word]]**, separates the whole dollars from the part of a dollar. You already know how to read it.

Rocket numbers are full of decimal points. Gravity at Earth's surface speeds a falling object up by $9.80665\,\mathrm{m/s^2}$ — "nine point eight zero six six five metres per second, every second". About $0.917$ of a loaded rocket stage's mass is propellant. The number $\pi$ (say "pie"), which you need for every round tank and nozzle, starts $3.1416$. A calculator will happily give you twelve digits after the point, and part of your job is deciding how many to keep.

This lesson extends place value to the right of the ones, then covers comparing decimals, multiplying and dividing by 10, 100 and 1,000, the four operations, and rounding. None of it is hard, but each step has one classic slip, and those slips turn up years later inside real engineering calculations. We will name every one.

## Places to the right of the point

In the last lesson, each place was worth ten times the place to its right. Run that backwards: each place is worth *one tenth* of the place to its left. Keep going past the ones and you get new places, smaller than one.

Think of money again. A dime is a tenth of a dollar. A penny is a hundredth of a dollar. So in \$3.47, the [[3 is dollars, the 4 is dimes and the 7 is pennies|money-places]].

The places after the point are called **tenths**, **hundredths**, **thousandths**, **ten-thousandths**, and so on. Each one is ten times smaller than the one before. Take standard gravity, 9.80665:

| Ones | . | Tenths | Hundredths | Thousandths | Ten-thousandths | Hundred-thousandths |
| --- | --- | --- | --- | --- | --- | --- |
| 9 | . | 8 | 0 | 6 | 6 | 5 |

So it is 9 ones, 8 tenths, 0 hundredths, 6 thousandths, 6 ten-thousandths and 5 hundred-thousandths. The 0 is a placeholder again, holding the hundredths place open. You read the number aloud as "nine point eight zero six six five", saying each digit after the point on its own. This particular number is special: it is [[exact by agreement|standard-gravity]], not measured.

A digit's position after the point tells you what it counts, which is why a decimal is a kind of fraction in disguise. $0.917$ is 9 tenths, 1 hundredth and 7 thousandths, which together make 917 thousandths. $0.5$ means 5 tenths, which is one half.

A **decimal place** is one place after the point. $9.80665$ has five decimal places; $3.14$ has two.

### Zeros on the end

Adding zeros to the *end* of a decimal, after the point, does not change its value. $0.5$, $0.50$ and $0.500$ are all five tenths, because fifty hundredths and five hundred thousandths are the same amount. This is handy: it lets you give two decimals the same number of places before comparing or adding them.

(Engineers do care about those end zeros for another reason — writing $1.00$ instead of $1$ is a [[promise about how carefully something was measured|trailing-zeros]]. The value is the same.)

A whole number has an invisible decimal point at its end: $15$ is $15.0$.

## Comparing decimals

Which is bigger, $0.6$ or $0.58$? Line the numbers up so their decimal points sit one above the other, and pad with zeros so they have the same length:

```text
  0.60
  0.58
```

Now compare place by place from the left, as with whole numbers. The ones are both 0. The tenths are 6 and 5, and the 6 wins. So $0.6 > 0.58$. In money: sixty cents beats fifty-eight cents.

::: warning Longer is not bigger
With whole numbers, more digits means bigger. With decimals, it does not. $0.25$ has more digits than $0.3$, but $0.3$ is bigger: thirty cents beats twenty-five cents. Always line up the points and pad with zeros, never compare by length.
:::

## Multiplying and dividing by 10, 100 and 1,000

Multiplying by 10 makes every digit worth ten times as much. On the place-value chart, that means every digit moves one place to the left. Multiplying by 100 moves them two places, and by 1,000 three places — one place for each zero.

Dividing does the opposite. Every digit moves right, and the number gets smaller.

$$
0.917 \times 100 = 91.7, \qquad 411 \div 1000 = 0.411.
$$

In the first, the digits 9, 1, 7 moved two places left, so the 9 went from tenths to tens. In the second, 411 has an invisible point after its last 1. The digits moved three places right, and the 4 went from hundreds to tenths.

You will often hear this described as "moving the decimal point". That gives the same answer: the point moves right when multiplying and left when dividing. Either picture works, as long as you count one place for each zero.

If you run out of digits, fill the gap with zeros: $7 \div 1000 = 0.007$, and $0.05 \times 1000 = 50$.

::: key Multiplying and dividing by 10, 100 or 1000
The digits move one place per zero: left (bigger) when multiplying, right (smaller) when dividing. 0.917 × 100 = 91.7; 411 ÷ 1000 = 0.411.
:::

::: warning "Add a zero" only works for whole numbers
To multiply 15 by 10 you can stick a zero on the end: 150. Try that with $0.5$ and you get $0.50$ — which is still five tenths, not five. For decimals, move the digits. $0.5 \times 10 = 5$.
:::

This is the skill behind every metric conversion. A tonne is 1,000 kilograms, so a mass in kilograms divided by 1,000 is the mass in tonnes.

::: example From kilograms to tonnes and back
**The problem.** A rocket's lift-off mass is 549,054 kg and its propellant load is 411 tonnes. Write the first in tonnes and the second in kilograms.

**Kilograms to tonnes.** Divide by 1,000: three zeros, so the digits move three places right. The invisible point after the 4 in 549,054 ends up after the 9: $549.054$ tonnes.

**Tonnes to kilograms.** Multiply by 1,000: the digits of 411 move three places left, and three zeros fill the gap: $411{,}000$ kg.

**Does that make sense?** A tonne is big, so the same mass should be a *smaller* number of tonnes than of kilograms. 549 is smaller than 549,054, as it should be.
:::

## Adding and subtracting decimals

To add or subtract decimals, line up the decimal points, pad with zeros so every number has the same number of places, and then add or subtract column by column, exactly as with whole numbers. The point in the answer goes straight below the others.

Lining up the points matters because you may only add digits that count the same thing: tenths to tenths, hundredths to hundredths. It is the same reason you would not add dimes to dollars and call the answer dollars.

```text
   22.50
  410.75
+  15.00
--------
  448.25
```

That is a rocket stage with a dry mass (the empty rocket) of 22.5 tonnes, carrying 410.75 tonnes of propellant and a 15-tonne payload (the satellite on top): 448.25 tonnes in all. Engineers write tonnes as t, so that is 448.25 t. The 15 needed its invisible point and two zeros so that its digits sat in the right columns.

Subtracting works the same way. How far is the rough value 9.8 from the real standard gravity? Pad 9.8 to 9.80000 and subtract:

$$
9.80665 - 9.80000 = 0.00665.
$$

About seven thousandths — small, but not nothing.

## Multiplying decimals

Here is the method:

1. Ignore the decimal points and multiply as if they were whole numbers.
2. Count the decimal places in *both* numbers you multiplied, added together.
3. Put that many decimal places into the answer, counting from the right.

$$
0.04 \times 0.3: \quad 4 \times 3 = 12, \quad 2 + 1 = 3 \text{ places}, \quad \text{answer } 0.012.
$$

The 12 needed three decimal places but only had two digits, so a zero went in front to fill the gap.

Why does it work? A tenth of a tenth is a hundredth — cut a dollar into ten dimes, then cut a dime into ten pennies, and each piece is a hundredth of the dollar. So tenths times tenths give hundredths, and the decimal places add up. A [[square cut into a grid|grid-picture]] shows it.

::: note Why the decimal places add
$0.04$ is $4 \div 100$ and $0.3$ is $3 \div 10$. Multiplying them gives $4 \times 3$ divided by $100 \times 10$, which is $12 \div 1000$. Dividing by 1,000 moves the digits three places to the right: $0.012$. The count of decimal places, $2 + 1 = 3$, is the count of zeros in $100 \times 10 = 1000$.
:::

Multiplying by a number less than 1 always makes something *smaller*. Half of anything is less than the thing. So if you multiply by $0.3$ and your answer went up, something is wrong. That is a free check on every multiplication.

::: example Splitting a propellant load
**The problem.** A stage carries 400 t of propellant. The liquid oxygen is $0.697$ of that, and the kerosene is $0.303$. How many tonnes of each?

**Oxygen.** Ignore the point: $697 \times 400 = 278{,}800$. The two numbers had $3 + 0 = 3$ decimal places, so move three places in from the right: $278.800$, which is $278.8$ t.

**Kerosene.** $303 \times 400 = 121{,}200$. Three decimal places again: $121.2$ t.

**Does that make sense?** Both answers are less than 400, as they must be when you multiply by something smaller than 1. And the two parts should add back to the whole. Line up the points: $278.8 + 121.2 = 400.0$. They do.
:::

::: example How much does rounding gravity cost?
**The problem.** The force of gravity on an astronaut, called her weight, is her mass times standard gravity. Her mass is 75 kg. Find her weight using $9.81$, and compare it with the answer from the full $9.80665$, which is $735.49875$ newtons (the newton is the unit of force).

**Multiply.** Ignore the point: $75 \times 981 = 73{,}575$. The numbers had $0 + 2 = 2$ decimal places, so the answer is $735.75$ newtons.

**Estimate check.** $75 \times 10 = 750$, and 9.81 is a bit less than 10, so the answer should be a bit less than 750. It is.

**Compare.** $735.75 - 735.49875 = 0.25125$. Rounding gravity to two decimal places changed her weight by about a quarter of a newton, out of more than seven hundred. For a person on a bathroom scale that is nothing. For a spacecraft navigating for months, small errors like this add up, which is why flight software keeps every digit.
:::

## Dividing decimals

**Dividing a decimal by a whole number** works like sharing money. Share \$3 among 4 people: that is 300 cents, and $300 \div 4 = 75$ cents, so each gets $0.75$ dollars. In the same way, when a division does not come out even, you can write zeros after the decimal point and keep dividing. The next lesson writes this out step by step as long division.

Some divisions never come out even. $1 \div 3 = 0.333\ldots$, with threes going on forever. The dots mean "and so on". Such a decimal is called [[repeating|repeating-decimals]]. You will meet more of them in the fractions lesson.

**Dividing by a decimal** looks harder, but there is a trick. Multiply *both* numbers by 10, 100 or 1,000 — whatever makes the number you are dividing by a whole number. The answer does not change, because both numbers grew by the same factor. (This is the same idea as crossing off zeros from both numbers in the last lesson, run backwards.)

$$
7.2 \div 0.4 \quad \to \quad 72 \div 4 = 18.
$$

Both numbers were multiplied by 10. In money: how many 40-cent pieces make \$7.20? The same number as 4-dime piles in 72 dimes: 18.

::: example Counting thruster pulses
**The problem.** A small steering thruster fires in pulses $0.25$ seconds long. How many pulses fit into $4.5$ seconds of firing?

**Make the divisor whole.** $0.25$ has two decimal places, so multiply both numbers by 100: $4.5 \div 0.25$ becomes $450 \div 25$.

**Divide.** $25 \times 18 = 450$, so the answer is $18$ pulses.

**Does that make sense?** Four pulses of a quarter second make one second, so $4.5$ seconds should hold $4 \times 4.5 = 18$ pulses. Dividing by a number less than 1 makes the answer *bigger* than what you started with, which is right: many small pieces fit.
:::

## Rounding decimals

Rounding a decimal uses exactly the rule from the last lesson. Find the place you are rounding to, look at the one digit to its right, round up if that digit is 5 or more, and leave it if it is 4 or less. The one difference: the digits to the right of the rounding place are **dropped**, not replaced with zeros. Zeros after the point would only add fake precision.

Round $\pi \approx 3.1416$ to two decimal places. The hundredths digit is 4. The digit to its right is 1, so the 4 stays: $3.14$. On a number line, $3.1416$ sits [[between 3.14 and 3.15, much nearer 3.14|zoom-line]].

::: key Rounding
Look at the next digit to the right: 5 or more rounds up, 4 or less leaves it. 7,670 to the nearest thousand is 8,000; 3.1416 to two decimal places is 3.14.
:::

Standard gravity is a good workout, because every rounding gives a different answer:

- to three decimal places: the thousandths digit is 6 and the next digit is 6, so round up: $9.807$;
- to two decimal places: the hundredths digit is 0 and the next digit is 6, so round up: $9.81$;
- to one decimal place: the tenths digit is 8 and the next digit is 0, so it stays: $9.8$;
- to the nearest whole number: the ones digit is 9 and the next digit is 8, so round up: $10$.

Rounding up can carry, the same as with whole numbers. Round $0.997$ to two decimal places. The hundredths digit is 9 and the next digit is 7, so the 9 goes up to 10. That carries one into the tenths, where another 9 becomes 10 and carries one into the ones. The answer is $1.00$. Keep both zeros: they say you rounded to two places.

::: warning Round once, from the original number
Round $7.449$ to one decimal place. The tenths digit is 4 and the next digit is 4, so the answer is $7.4$.

The slip is rounding in steps: $7.449$ to $7.45$, then $7.45$ to $7.5$. Each step looks fine, but $7.449$ is nearer $7.4$ than $7.5$. Always look at the original digits.

The same rule applies across a whole calculation. Keep extra digits while you work and [[round only the final answer|guard-digits]]. Rounding at every step lets small errors pile up.
:::

::: note Where this comes back
- [Scientific notation and significant figures](#/module/t0_m01_algebra_precalc?lesson=l11-scientific-notation-and-significant-figures) moves the decimal point to write numbers like $0.000\,457$ as $4.57 \times 10^{-4}$, and turns "how many decimal places?" into "how many digits can you trust?".
- [Units, conversions and dimensional analysis](#/module/t0_m01_algebra_precalc?lesson=l10-units-and-dimensional-analysis) converts kilonewtons to newtons and tonnes to kilograms — multiplying and dividing by 1,000, digit shifts every time.
- [Angles, radians and the unit circle](#/module/t0_m02_trigonometry?lesson=l01-angles-radians-unit-circle) works with $\pi \approx 3.1416$ and $1\ \mathrm{rad} \approx 57.2958^\circ$, rounded to the places each job needs.
- [Floating point](#/module/t0_m03_python_scicomp?lesson=l06-floating-point) shows how a computer stores decimals, why it rounds every result, and why $0.1 + 0.2$ does not come out as exactly $0.3$.
:::

## Check yourself

::: check
Put these in order from smallest to largest: $0.5$, $0.45$, $0.405$, $0.54$, $0.054$.
:::

::: answer
Pad them all to three decimal places: $0.500$, $0.450$, $0.405$, $0.540$, $0.054$. Now compare like whole numbers of thousandths: 500, 450, 405, 540, 54.

So: $0.054 < 0.405 < 0.45 < 0.5 < 0.54$.
:::

::: check
Work out $2.35 \times 100$, $58 \div 1000$ and $0.0665 \times 1000$.
:::

::: answer
$2.35 \times 100$: two zeros, digits move two places left: $235$.

$58 \div 1000$: three zeros, digits move three places right. 58 has only two digits, so a zero fills the gap: $0.058$.

$0.0665 \times 1000$: digits move three places left: $66.5$.
:::

::: check
Work out $0.03 \times 0.2$ and $1.2 \times 0.5$. Check each answer is smaller than the first number, and say why it must be.
:::

::: answer
$0.03 \times 0.2$: $3 \times 2 = 6$, and there are $2 + 1 = 3$ decimal places, so $0.006$.

$1.2 \times 0.5$: $12 \times 5 = 60$, and there are $1 + 1 = 2$ decimal places, so $0.60$, which is $0.6$.

Both are smaller than the number we started with ($0.006 < 0.03$ and $0.6 < 1.2$), because multiplying by a number less than 1 takes only part of something. $1.2 \times 0.5$ is half of $1.2$.
:::

::: check
Round $9.80665$ to one decimal place, three decimal places and four decimal places.
:::

::: answer
**One place:** tenths digit 8, next digit 0, so it stays: $9.8$.

**Three places:** thousandths digit 6, next digit 6, so round up: $9.807$.

**Four places:** ten-thousandths digit 6, next digit 5, so round up: $9.8067$.
:::

::: check
A small tank holds $4.5$ litres of fuel. A pump moves it in doses of $0.09$ litres. How many doses empty the tank?
:::

::: answer
The divisor $0.09$ has two decimal places, so multiply both numbers by 100: $4.5 \div 0.09$ becomes $450 \div 9 = 50$ doses.

Check by multiplying back: $50 \times 0.09$: $50 \times 9 = 450$ with two decimal places gives $4.50$. That is the whole tank.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Places after the point | tenths, hundredths, thousandths — each a tenth of the place to its left |
| End zeros | $0.5 = 0.50 = 0.500$; pad with zeros to line numbers up |
| Comparing | line up the points and pad; longer is not bigger |
| $\times$ or $\div$ 10, 100, 1000 | digits move one place per zero: left when multiplying, right when dividing |
| Adding, subtracting | line up the points, pad with zeros, work column by column |
| Multiplying | multiply as whole numbers; the answer's decimal places are the total from both numbers |
| Dividing by a decimal | multiply both numbers by 10, 100, … until the divisor is whole |
| Rounding | next digit: 5 or more rounds up, 4 or less leaves it; drop the digits after |
| Round once | keep extra digits while working; round only the final answer |

Next lesson: the whole numbers underneath all of this — times tables, long multiplication and long division, and the factors and primes that make fractions easy to handle.

::: context decimal-word Where "decimal" comes from
"Decimal" comes from the Latin word for "tenth". A decimal is a number written in tenths, hundredths and thousandths. Not everyone uses a dot for the point: in much of Europe and South America, $9.81$ is written $9{,}81$ with a comma. Engineers working with teams from other countries learn to check which is meant, because a misread point changes a number by a factor of a thousand or more.
:::

::: context money-places Money is a place-value chart
Every place is worth ten times the place to its right — and that keeps going past the point.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="40" y="20" width="90" height="70"/>
    <rect x="160" y="20" width="80" height="70"/>
    <rect x="240" y="20" width="80" height="70"/>
  </g>
  <circle cx="145" cy="78" r="5" fill="#b4232c"/>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="85" y="36">ones</text><text x="200" y="36">tenths</text><text x="280" y="36">hundredths</text>
  </g>
  <g font-size="30" font-weight="700" fill="#1d6fd1" text-anchor="middle">
    <text x="85" y="78">3</text><text x="200" y="78">4</text><text x="280" y="78">7</text>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="85" y="110">3 dollars</text><text x="200" y="110">4 dimes</text><text x="280" y="110">7 pennies</text>
  </g>
  <text x="180" y="132" font-size="12" fill="#b4232c" text-anchor="middle">$3 + $0.40 + $0.07 = $3.47</text>
</svg>
```

Ten pennies make a dime and ten dimes make a dollar, so each move to the right is worth a tenth as much.
:::

::: context standard-gravity A number that is exact by agreement
How fast things fall is a little different from place to place on Earth — slightly faster at the poles than at the equator. So in 1901, an international meeting on weights and measures fixed one agreed value for "standard gravity": exactly $9.80665\,\mathrm{m/s^2}$. It is written $g_0$, read "g nought". Because it was chosen, not measured, all its digits are exact, and later lessons use it in the rocket equation. For rough work people round it to $9.81$ or $9.8$.
:::

::: context trailing-zeros Why an engineer writes 1.00
To a mathematician, $1$, $1.0$ and $1.00$ are the same number. To an engineer reading a measurement, they say different things. "$1.00$ m" claims the length was measured to the nearest hundredth of a metre, a centimetre. "$1$ m" claims only the nearest metre. Writing more zeros than you measured is claiming care you did not take. The algebra module has a whole lesson on this, called significant figures.
:::

::: context grid-picture A tenth of a tenth
Cut a square into 10 strips, then cut each strip into 10 small squares: 100 small squares, each a hundredth. Take 3 tenths one way and 4 tenths the other. The overlap is $3 \times 4 = 12$ small squares — twelve hundredths.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g transform="translate(20,10)">
    <rect x="0" y="0" width="180" height="180" fill="#fff"/>
    <rect x="0" y="0" width="54" height="180" fill="#8fb8f0" opacity="0.6"/>
    <rect x="0" y="0" width="180" height="72" fill="#f2b880" opacity="0.6"/>
    <rect x="0" y="0" width="54" height="72" fill="#1d6fd1"/>
    <g stroke="#1f2a44" stroke-width="0.6">
      <line x1="18" y1="0" x2="18" y2="180"/><line x1="36" y1="0" x2="36" y2="180"/><line x1="54" y1="0" x2="54" y2="180"/>
      <line x1="72" y1="0" x2="72" y2="180"/><line x1="90" y1="0" x2="90" y2="180"/><line x1="108" y1="0" x2="108" y2="180"/>
      <line x1="126" y1="0" x2="126" y2="180"/><line x1="144" y1="0" x2="144" y2="180"/><line x1="162" y1="0" x2="162" y2="180"/>
      <line x1="0" y1="18" x2="180" y2="18"/><line x1="0" y1="36" x2="180" y2="36"/><line x1="0" y1="54" x2="180" y2="54"/>
      <line x1="0" y1="72" x2="180" y2="72"/><line x1="0" y1="90" x2="180" y2="90"/><line x1="0" y1="108" x2="180" y2="108"/>
      <line x1="0" y1="126" x2="180" y2="126"/><line x1="0" y1="144" x2="180" y2="144"/><line x1="0" y1="162" x2="180" y2="162"/>
    </g>
    <rect x="0" y="0" width="180" height="180" fill="none" stroke="#1f2a44" stroke-width="2"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="215" y="40">blue columns: 0.3</text>
    <text x="215" y="62">orange rows: 0.4</text>
    <text x="215" y="96" font-weight="700" fill="#1d6fd1">dark overlap:</text>
    <text x="215" y="114" font-weight="700" fill="#1d6fd1">12 of 100 squares</text>
    <text x="215" y="148">0.3 × 0.4 = 0.12</text>
  </g>
</svg>
```
:::

::: context repeating-decimals Why some decimals never stop
Divide 1 by 3 the long way. Three doesn't go into 1, so write 10 tenths: 3 goes 3 times, remainder 1. Now write 10 hundredths: 3 goes 3 times, remainder 1 again. The same remainder keeps coming back, so the same digit keeps coming out, forever. Whenever a remainder repeats, the digits repeat. Computers meet the same problem in base two, where even one tenth never stops — which is why a computer's $0.1$ is very slightly off.
:::

::: context zoom-line Zooming in on the number line
Between any two neighboring tenths there are ten hundredths, and between those, ten thousandths. Zoom in on the stretch from 3.1 to 3.2 and $\pi$'s first digits appear.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="30" x2="340" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="20" y1="24" x2="20" y2="36"/><line x1="340" y1="24" x2="340" y2="36"/>
    <line x1="52" y1="26" x2="52" y2="34"/><line x1="84" y1="26" x2="84" y2="34"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="18">3</text><text x="340" y="18">4</text><text x="52" y="18">3.1</text><text x="84" y="18">3.2</text>
  </g>
  <line x1="52" y1="36" x2="20" y2="95" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <line x1="84" y1="36" x2="340" y2="95" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1">
    <line x1="20" y1="94" x2="20" y2="106"/><line x1="52" y1="96" x2="52" y2="104"/><line x1="84" y1="96" x2="84" y2="104"/>
    <line x1="116" y1="96" x2="116" y2="104"/><line x1="148" y1="94" x2="148" y2="106"/><line x1="180" y1="94" x2="180" y2="106"/>
    <line x1="212" y1="96" x2="212" y2="104"/><line x1="244" y1="96" x2="244" y2="104"/><line x1="276" y1="96" x2="276" y2="104"/>
    <line x1="308" y1="96" x2="308" y2="104"/><line x1="340" y1="94" x2="340" y2="106"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="122">3.10</text><text x="148" y="122">3.14</text><text x="180" y="122">3.15</text><text x="340" y="122">3.20</text>
  </g>
  <circle cx="153.12" cy="100" r="5" fill="#b4232c"/>
  <text x="153" y="86" font-size="11" fill="#b4232c" text-anchor="middle">3.1416</text>
  <text x="180" y="143" font-size="11" fill="#1d6fd1" text-anchor="middle">nearer 3.14 than 3.15, so it rounds to 3.14</text>
</svg>
```
:::

::: context guard-digits Keep extra digits, round at the end
Every rounding throws away a little. Once is harmless. But suppose a calculation has ten steps and you round at each one: the small errors can pile up until the last digit — or the last two — are wrong. The professional habit is to carry one or two extra digits through the whole calculation (people call them guard digits) and round once, when you write the final answer. A computer does this automatically, carrying about sixteen digits.
:::
