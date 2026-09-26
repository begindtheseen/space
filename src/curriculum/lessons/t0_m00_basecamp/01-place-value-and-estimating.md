---
id: l01-place-value-and-estimating
title: Place value, big numbers and estimating
minutes: 23
covers:
  - place value, big numbers and estimating
---

A satellite in low orbit around Earth moves at about 7,670 [[metres every second|metres-per-second]]. The first stage of a Falcon 9 rocket carries about 411,000 kilograms of propellant and burns through it in about 162 seconds. The number that says how hard Earth pulls on everything near it is 398,600,000,000,000.

Numbers like these are everywhere in this course. Before you can do anything clever with them, you need to be able to read them out loud, tell which of two is bigger at a glance, round them to something your head can hold, and guess roughly what an answer should be *before* you work it out.

That last skill is the one engineers value most. A calculator never makes a mistake, but the person pressing its keys does. One missed digit makes an answer ten times too small, and the only defense is knowing, before you press "=", about how big the answer ought to be. This lesson builds that habit from the ground up.

## Ten of these make one of those

Think about money. Ten pennies make a dime. Ten dimes make a dollar. Ten dollars make a ten-dollar bill, and ten of those make a hundred. Every step up is worth exactly ten of the step below.

Our way of writing numbers works the same way. Each spot a digit can sit in is called a **place**, and the **place value** of a digit — what it is worth — depends on which place it sits in. Moving one place to the left makes a digit worth ten times as much. That is why we call it a **[[base-ten|why-ten]]** system.

Take the orbit speed, 7,670. Read the places from the right:

| Thousands | Hundreds | Tens | Ones |
| --- | --- | --- | --- |
| 7 | 6 | 7 | 0 |

So the number is **[[seven thousands, six hundreds, seven tens and no ones|place-chart]]**. Written out as a sum, that is

$$
7670 = 7 \times 1000 + 6 \times 100 + 7 \times 10 + 0 \times 1.
$$

This way of writing a number, one piece per place, is called **expanded form**. Notice that the two 7s are worth very different amounts. The left one is worth 7,000. The right one is worth 70. Same digit, different place, a hundred times different in value.

::: key Place value
In 7,670 the digits are worth 7 thousands, 6 hundreds, 7 tens, 0 ones. Each place is worth ten times the place to its right.
:::

### The zero is doing a job

The 0 at the end of 7,670 says "no ones". Take it away and you get 767, a completely different number — ten times smaller. A zero in a number is often a **placeholder**: it holds a place open so the other digits stay where they belong.

The same thing happens in the middle of a number. A Falcon 9 first stage pushes with a force of about 7,607 kilonewtons. (A newton is a unit of push, and *kilo* means a thousand; the metric-system lesson covers both.) That 0 in the tens place keeps the 6 in the hundreds place. It took people a very long time to invent a **[[zero that holds a place|zero-history]]**, and it is the reason our numbers work at all.

## Reading and writing big numbers

Big numbers are easier to read if you split the digits into groups of three, starting from the right. In the United States the groups are separated by commas: 411,000 and 398,600,000,000,000. Some books and many engineers use a [[small space instead|thin-space]], writing 411 000. Later lessons in this course do that, so be ready to see both.

Each group of three has a name. Read the number one group at a time, from the left, and say the group's name after it:

| Group | Name | Example |
| --- | --- | --- |
| 1,000 | thousand | 411,000 is "four hundred eleven thousand" |
| 1,000,000 | million | 7,000,000 is "seven million" |
| 1,000,000,000 | billion | a thousand millions |
| 1,000,000,000,000 | trillion | a thousand billions |

Each name is a thousand times the one before it. So Earth's pull number, 398,600,000,000,000, reads "**[[three hundred ninety-eight trillion, six hundred billion|group-names]]**". The three zero groups at the end have nothing in them, so you do not say them.

::: warning Counting zeros by eye
It is easy to miscount a long row of zeros, and one miscounted zero makes a number ten times too big or too small. Never count zeros one by one. Mark the groups of three from the right, then count the groups. In 398,600,000,000,000 there are five groups, so the leading 398 sits in the trillions.
:::

### Which number is bigger?

To compare two whole numbers, first count their digits. More digits means bigger: 70,670 (five digits) beats 7,706 (four digits) no matter what the digits are.

If they have the same number of digits, compare them place by place from the left. The first place where they differ decides it. Compare 7,670 and 7,607:

- Thousands: 7 and 7. Same, keep going.
- Hundreds: 6 and 6. Same, keep going.
- Tens: 7 and 0. The 7 is bigger, so 7,670 is the bigger number.

Mathematicians write this with the **greater-than sign**: $7670 > 7607$. The wide open side of the sign faces the bigger number. The **less-than sign** $<$ points the other way: $7607 < 7670$.

::: example Reading a rocket's numbers
**The problem.** A spec sheet lists a lift-off mass of 549,054 kg and a propellant load of 411,000 kg. Read both out loud, say what the 9 in the first number is worth, and decide which is bigger.

**Reading.** Split into groups of three: 549 | 054 and 411 | 000. The first is "five hundred forty-nine thousand, fifty-four" kilograms. The second is "four hundred eleven thousand" kilograms.

**The 9.** In 549,054 the places, from the left, are hundred thousands (5), ten thousands (4), thousands (9), hundreds (0), tens (5) and ones (4). So the 9 is worth 9,000 kg.

**Comparing.** Both have six digits. Start at the left: 5 against 4 in the hundred-thousands place. The 5 wins, so $549054 > 411000$.

**Does that make sense?** Yes. The lift-off mass is the whole rocket, and the propellant is only part of it. The part has to be smaller than the whole.
:::

## Rounding whole numbers

Nobody needs to know that a rocket weighs exactly 549,054 kg to understand that it is "about 550 tonnes". **Rounding** swaps a number for a nearby one that is easier to use. You round to a chosen place: the nearest ten, the nearest hundred, the nearest thousand, and so on.

Picture the number line between 7,000 and 8,000. Where does 7,670 sit? Past the halfway mark, 7,500. So **[[its nearest thousand is 8,000|rounding-line]]**. Rounding means "which of the two neighbors is closer?"

You do not need to draw the line every time. Here is the rule:

1. Find the digit in the place you are rounding to.
2. Look at the one digit to its right.
3. If that digit is **5 or more**, add one to your digit (round up). If it is **4 or less**, leave your digit alone.
4. Replace every digit to the right with zeros.

Round 7,670 to the nearest thousand. The thousands digit is 7. The digit to its right is 6, which is 5 or more, so the 7 becomes 8. The rest become zeros: **8,000**.

Round it to the nearest hundred instead. The hundreds digit is 6. The next digit is 7, so the 6 becomes 7: **7,700**.

::: key Rounding
Look at the next digit to the right: [[5 or more rounds up|half-up]], 4 or less leaves it. 7,670 to the nearest thousand is 8,000.
:::

Sometimes adding one makes a 9 into a 10. Then the 1 carries into the next place, exactly as in adding. Round 7,960 to the nearest hundred: the hundreds digit is 9, the next digit is 6, so 9 hundreds becomes 10 hundreds. Ten hundreds is one thousand, so the thousands digit goes from 7 to 8, and the answer is 8,000.

::: warning Keep the zeros, and look at only one digit
Rounding 7,670 to the nearest thousand gives 8,000, not 8. The zeros are placeholders; without them the number is a thousand times too small.

Also look at only the *one* digit to the right. Round 7,450 to the nearest thousand: the next digit is 4, so the answer is 7,000. It is tempting to round in two hops — 7,450 to 7,500, then 7,500 to 8,000 — but that is wrong. 7,450 is closer to 7,000 than to 8,000.
:::

::: example Rounding a rocket's mass three ways
**The problem.** Round the lift-off mass, 549,054 kg, to the nearest thousand, the nearest ten thousand and the nearest hundred thousand.

**Nearest thousand.** The thousands digit is 9. The digit to its right is 0, which is 4 or less, so the 9 stays: **549,000 kg**.

**Nearest ten thousand.** The ten-thousands digit is 4. The digit to its right is 9, which is 5 or more, so the 4 becomes 5: **550,000 kg**.

**Nearest hundred thousand.** The hundred-thousands digit is 5. The next digit is 4, so the 5 stays: **500,000 kg**.

**Does that make sense?** Each answer is closer to 549,054 than the neighbor on the other side. And each answer is rougher than the one before, because it throws away more digits. Which one you use depends on what you need it for.
:::

## Estimating: the answer before the answer

An **estimate** is a rough answer you can work out in your head. You get it by rounding the numbers first, then doing the arithmetic on the rounded numbers. The usual choice is to round each number to its first digit, with zeros after. Round numbers are easy because the zeros can be handled separately from the rest.

### Multiplying round numbers

To multiply round numbers, multiply the front digits, then count up all the zeros and stick them on the end.

$$
8000 \times 6000: \quad 8 \times 6 = 48, \quad 3 + 3 = 6 \text{ zeros}, \quad \text{answer } 48{,}000{,}000.
$$

This works because $8000 = 8 \times 1000$ and $6000 = 6 \times 1000$, and you can multiply the pieces in any order: $8 \times 6 \times 1000 \times 1000$.

::: warning A zero from the front digits counts too
$500 \times 40$: the fronts give $5 \times 4 = 20$, and there are three zeros to add, so the answer is 20,000. Do not lose the zero that belongs to the 20. Write down the front product in full first, then add the extra zeros after it.
:::

### Dividing round numbers

To divide round numbers, cross off the same number of zeros from both, then divide what is left.

$$
400{,}000 \div 200: \quad \text{cross off two zeros from each} \quad \to \quad 4000 \div 2 = 2000.
$$

Why is that allowed? Sharing 400,000 among 200 people gives each the same amount as sharing 4,000 among 2 people. Both numbers got a hundred times smaller, so each share stays the same.

Sometimes it pays to round to a *friendly* number rather than to the first digit. Pick numbers that divide nicely, even if they are not the closest round numbers.

::: example Estimating the burn rate
**The problem.** A first stage burns 411,000 kg of propellant in 162 seconds. About how many kilograms does it burn each second?

**Crude estimate.** Round each to one front digit: 400,000 and 200. Then $400{,}000 \div 200 = 2000$ kg every second.

**Better estimate.** 162 is much closer to 160 than to 200, and 160 divides 400,000 nicely. Cross off one zero from each: $40{,}000 \div 16$. Since $16 \times 2500 = 40{,}000$, the answer is about 2,500 kg every second.

**The exact answer** is $411{,}000 \div 162$, which is about 2,537 kg every second. The better estimate is only 37 kg off. The crude one is off by more than 500 kg — but it is still the right *size*, which is what an estimate is for.

**Does that make sense?** About two and a half tonnes (a tonne is 1,000 kg) of propellant every second is an enormous flow, but a rocket engine is an enormous machine. The number is believable.
:::

::: example Catching a calculator slip
**The problem.** A satellite moves at 7,670 m/s. One trip around Earth takes about 92 minutes, which is 5,520 seconds. How far does it travel in one orbit? A classmate's calculator says 4,233,840 metres. Is that right?

**Estimate first.** Round each number to its first digit: 7,670 becomes 8,000, and 5,520 becomes 6,000. Then $8 \times 6 = 48$, and there are six zeros, so the estimate is 48,000,000 metres.

**Compare.** The classmate's answer has seven digits. The estimate has eight. That is a factor of ten apart — far more than rounding can explain. Something went wrong: they typed 552 instead of 5,520.

**The exact answer** is $7670 \times 5520 = 42{,}338{,}400$ metres, about 42,300 kilometres (a kilometre is 1,000 metres). That is close to the distance once around a circle 6,771 km from Earth's center — the 6,371 km from the center to the ground, plus the 400 km the satellite flies above the ground. Everything fits.
:::

The habit is worth saying plainly. **Estimate, then calculate, then compare.** If the two agree in size, you can trust the calculation. If they are a factor of ten apart, one of them is wrong, and it is usually the one with more button presses.

::: note Where this comes back
- [Scientific notation and significant figures](#/module/t0_m01_algebra_precalc?lesson=l11-scientific-notation-and-significant-figures) writes 398,600,000,000,000 as $3.986 \times 10^{14}$. The 14 counts places, exactly the place value you learned here, and rounding returns as "how many digits are you allowed to keep?".
- [Order-of-magnitude estimation](#/module/t0_m01_algebra_precalc?lesson=l12-fermi-estimation) turns estimating into a full engineering tool: sizing a whole rocket's propellant load from a photograph and a few round numbers.
- [Signed numbers, fractions and ratios](#/module/t0_m01_algebra_precalc?lesson=l01-signed-numbers-and-fractions) works out the same 411,000 kg over 162 s burn rate — you now know it should come out near 2,500 kg every second.
- [Units, conversions and dimensional analysis](#/module/t0_m01_algebra_precalc?lesson=l10-units-and-dimensional-analysis) multiplies and divides by 1,000 constantly (kilometres to metres, tonnes to kilograms), where counting zeros correctly is the whole job.
:::

## Check yourself

::: check
In 398,600, what is the 9 worth? What is the 8 worth? What would happen to the number if you left out the last two zeros?
:::

::: answer
Label the places from the right: ones (0), tens (0), hundreds (6), thousands (8), ten thousands (9), hundred thousands (3). So the 9 is worth 90,000 and the 8 is worth 8,000.

Leaving out the two zeros gives 3,986. Every other digit slides two places to the right, so each is worth a hundred times less. The number becomes a hundred times smaller: $3986 \times 100 = 398{,}600$.
:::

::: check
Put these in order from smallest to largest: 7,607; 70,670; 7,076; 7,706; 7,670.
:::

::: answer
First count digits. 70,670 has five digits, so it is the biggest. The other four have four digits each, and all start with 7 in the thousands place, so compare the hundreds: 0 (7,076), 6 (7,607 and 7,670), 7 (7,706). Between 7,607 and 7,670, the tens decide: 0 against 7.

So: 7,076 < 7,607 < 7,670 < 7,706 < 70,670.
:::

::: check
Round 7,960 to the nearest ten, the nearest hundred and the nearest thousand.
:::

::: answer
**Nearest ten:** the tens digit is 6 and the ones digit is 0, so it stays 7,960.

**Nearest hundred:** the hundreds digit is 9 and the next digit is 6, so the 9 goes up to 10. That carries: 79 hundreds becomes 80 hundreds, which is 8,000.

**Nearest thousand:** the thousands digit is 7 and the next digit is 9, so the 7 becomes 8: 8,000.

Two different roundings giving the same answer is fine. 7,960 is only 40 away from 8,000.
:::

::: check
Work these out in your head: $300 \times 20{,}000$ and $600{,}000 \div 3000$.
:::

::: answer
**Multiplying:** the fronts give $3 \times 2 = 6$. There are $2 + 4 = 6$ zeros. So the answer is 6,000,000 (six million).

**Dividing:** cross off three zeros from each, leaving $600 \div 3 = 200$.

Check the division by multiplying back: $200 \times 3000$ is $2 \times 3 = 6$ with $2 + 3 = 5$ zeros, which is 600,000.
:::

::: check
A stage burns 2,537 kg of propellant every second for 162 seconds. Without working it out exactly, decide which of these is the total: 41,099 kg, 410,994 kg or 4,109,940 kg.
:::

::: answer
Estimate with friendly numbers: 2,537 is about 2,500 and 162 is about 160. Then $2500 \times 160$: the parts before the zeros give $25 \times 16 = 400$ (four 25s make 100, so sixteen 25s make 400), and there are three zeros to add, so about 400,000 kg.

Only 410,994 kg has the right size. The other two are ten times too small and ten times too big. (It matches the 411,000 kg propellant load from the start of the lesson, as it should.)
:::

## Summary

| Idea | In one line |
| --- | --- |
| Place value | each place is worth ten times the place to its right |
| 7,670 | 7 thousands, 6 hundreds, 7 tens, 0 ones |
| Placeholder zero | holds a place open; removing it changes the number's size |
| Reading big numbers | groups of three from the right: thousand, million, billion, trillion |
| Comparing | more digits is bigger; otherwise the first place from the left that differs decides |
| Rounding | next digit to the right: 5 or more rounds up, 4 or less leaves it; zeros fill the rest |
| Multiplying round numbers | multiply the fronts, then add up the zeros |
| Dividing round numbers | cross off the same number of zeros from both, then divide |
| The habit | estimate, then calculate, then compare |

Next lesson: the places keep going to the *right* of the ones, past a decimal point — tenths, hundredths, thousandths. That is where numbers like $9.80665\,\mathrm{m/s^2}$ live, and rounding them works exactly the same way.

::: context metres-per-second How fast is 7,670 metres per second?
"Metres per second", written m/s, means how many metres you cover in each second. A brisk walk is about 1.4 m/s, so the satellite is going about 5,500 times faster than you walk. In an hour, which is 3,600 seconds, it covers about 27,600 kilometres — enough to cross the United States in about ten minutes. It is the *sideways* speed, not height, that keeps a satellite from falling back to Earth; you will see exactly why in the orbits part of the course.
:::

::: context why-ten Why ten?
Almost certainly because we have ten fingers. People counted on their hands long before they wrote numbers down, so bundling in tens felt natural. Nothing in mathematics prefers ten, though. Computers count in **base two**, where each place is worth twice the place to its right, because a tiny switch inside a chip is either off or on. Later in the course, in the Python module, you will see why this makes a computer store $0.1$ very slightly wrong.
:::

::: context place-chart The place-value chart
Each column is worth ten times the column to its right. The digit tells you how many of that column's value you have.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="20" width="80" height="80"/>
    <rect x="100" y="20" width="80" height="80"/>
    <rect x="180" y="20" width="80" height="80"/>
    <rect x="260" y="20" width="80" height="80"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="60" y="36">thousands</text><text x="140" y="36">hundreds</text>
    <text x="220" y="36">tens</text><text x="300" y="36">ones</text>
  </g>
  <g font-size="30" font-weight="700" fill="#1d6fd1" text-anchor="middle">
    <text x="60" y="80">7</text><text x="140" y="80">6</text><text x="220" y="80">7</text><text x="300" y="80">0</text>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="122">7,000</text><text x="140" y="122">600</text><text x="220" y="122">70</text><text x="300" y="122">0</text>
  </g>
  <text x="180" y="143" font-size="12" fill="#b4232c" text-anchor="middle">7,000 + 600 + 70 + 0 = 7,670</text>
</svg>
```
:::

::: context zero-history The long road to zero
For thousands of years, many peoples wrote numbers without a true zero. The Romans wrote 1,670 as MDCLXX, and doing long arithmetic with letters like that is miserable. Mathematicians in India worked out a full place-value system with a zero digit; around the year 628, Brahmagupta wrote down rules for calculating with zero itself. Scholars writing in Arabic, such as al-Khwarizmi in the 800s, carried the system west, and Fibonacci's book *Liber Abaci* (1202) helped spread it through Europe. That is why the digits 0–9 are often called Hindu–Arabic numerals.
:::

::: context thin-space Commas, points and spaces
Not every country groups digits the same way. In the United States, 411,000 uses commas. In much of Europe the same number is written 411.000, and a comma is used for the decimal point instead. To avoid confusion, the international rules for scientific units recommend a small gap: 411 000. Engineering documents and many later lessons in this course use that gap. Whenever you read a number from a document written somewhere else, check which symbol means what before you trust it.
:::

::: context group-names Reading a giant number, one group at a time
Mark off groups of three from the right. Each group gets a name, and you read the digits in the group followed by its name.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="22" font-weight="700" text-anchor="middle">
    <text x="40" y="50" fill="#1d6fd1">398</text>
    <text x="110" y="50" fill="#1d6fd1">600</text>
    <text x="180" y="50" fill="#6c7a93">000</text>
    <text x="250" y="50" fill="#6c7a93">000</text>
    <text x="320" y="50" fill="#6c7a93">000</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="12" y1="60" x2="68" y2="60"/><line x1="82" y1="60" x2="138" y2="60"/>
    <line x1="152" y1="60" x2="208" y2="60"/><line x1="222" y1="60" x2="278" y2="60"/>
    <line x1="292" y1="60" x2="348" y2="60"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="78">trillions</text><text x="110" y="78">billions</text>
    <text x="180" y="78">millions</text><text x="250" y="78">thousands</text><text x="320" y="78">ones</text>
  </g>
  <text x="180" y="102" font-size="11" fill="#b4232c" text-anchor="middle">398 trillion, 600 billion — empty groups are not said</text>
</svg>
```
:::

::: context rounding-line Rounding on the number line
7,670 sits between the two thousands 7,000 and 8,000. The halfway point is 7,500. Anything past halfway is closer to 8,000, so it rounds up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="60" x2="330" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1">
    <line x1="60" y1="55" x2="60" y2="65"/><line x1="90" y1="55" x2="90" y2="65"/><line x1="120" y1="55" x2="120" y2="65"/>
    <line x1="150" y1="55" x2="150" y2="65"/><line x1="210" y1="55" x2="210" y2="65"/><line x1="240" y1="55" x2="240" y2="65"/>
    <line x1="270" y1="55" x2="270" y2="65"/><line x1="300" y1="55" x2="300" y2="65"/>
  </g>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="30" y1="50" x2="30" y2="70"/><line x1="330" y1="50" x2="330" y2="70"/>
    <line x1="180" y1="52" x2="180" y2="68" stroke="#6c7a93"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="88">7,000</text><text x="330" y="88">8,000</text>
    <text x="180" y="88" fill="#6c7a93">7,500</text>
  </g>
  <circle cx="231" cy="60" r="6" fill="#b4232c"/>
  <text x="231" y="40" font-size="12" fill="#b4232c" text-anchor="middle">7,670</text>
  <path d="M254,36 Q296,14 326,44" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="328,48 320,40 330,38" fill="#1d6fd1"/>
  <text x="300" y="104" font-size="11" fill="#1d6fd1" text-anchor="middle">closer to 8,000</text>
</svg>
```

Each small tick is 100, so 7,670 sits between the 7,600 and 7,700 ticks.
:::

::: context half-up What about exactly 5?
A number like 7,500 is exactly halfway between 7,000 and 8,000, so neither neighbor is closer. It is a tie, and "5 rounds up" is only an agreement for breaking it. Some computer programs break ties differently: Python's `round` sends a half to the nearest *even* number, so `round(2.5)` gives 2 and `round(3.5)` gives 4. Over millions of roundings, that stops all the ties from pushing the total upward. For everyday work, round 5 up.
:::
