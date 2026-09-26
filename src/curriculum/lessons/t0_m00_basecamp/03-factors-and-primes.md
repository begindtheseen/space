---
id: l03-factors-and-primes
title: Multiplication, division, factors and primes
minutes: 26
covers:
  - multiplication, division, factors and primes
---

Every calculation in this course, however fancy it looks, comes down to adding, subtracting, multiplying and dividing whole numbers in the end. A formula for a rocket's fuel or an orbit's shape is a recipe, and the steps of the recipe are times tables and long division. If those steps are slow or shaky, all your attention goes to the arithmetic and none is left for the ideas.

This lesson makes them quick and sure. It starts with strategies that make the times tables easy to rebuild, then writes out long multiplication and long division in full. Then it takes numbers apart into their building blocks: **factors**, the numbers that divide into them, and **primes**, the numbers that cannot be split any further.

Why would a rocket scientist care about primes? Because they are the fastest route to the smallest shared bottom number for two fractions — which you will need constantly in the algebra module — and to the moment when two repeating jobs in a flight computer line up again. By the end, you will know how to find both.

## Multiplication: rows of seats

Picture a small theater with 6 rows of 7 seats. How many seats? You could count them one by one, or add $7 + 7 + 7 + 7 + 7 + 7$. Multiplication is the short way to write that repeated adding: $6 \times 7 = 42$.

Now walk around to the side of the theater and look again. You see 7 columns of 6 seats. Same seats, same total. So $6 \times 7 = 7 \times 6$. The order of the two numbers never matters in multiplication. That one fact cuts the times table almost in half: once you know $6 \times 7$, you also know $7 \times 6$.

### Strategies instead of memorizing

You do not need to memorize a hundred separate facts. Most of them can be rebuilt in a second from a few easy ones:

- **Times 2:** double it. $2 \times 8 = 16$.
- **Times 4:** double, then double again. $4 \times 7$: double 7 is 14, double 14 is 28.
- **Times 8:** double three times. $8 \times 6$: 12, 24, 48.
- **Times 5:** times 10, then halve. $5 \times 7$: $70$, half of that is $35$.
- **Times 9:** times 10, then take one lot away. $9 \times 7 = 70 - 7 = 63$.
- **Times 3:** double it and add one more lot. $3 \times 8 = 16 + 8 = 24$.
- **Times 6:** times 5 and add one more lot. $6 \times 8 = 40 + 8 = 48$.
- **Break it apart:** split one number into easy pieces. $7 \times 8 = 7 \times 5 + 7 \times 3 = 35 + 21 = 56$.

The last strategy is the most powerful, and it has a name: the **distributive law**. Multiplying a sum is the same as multiplying each piece and adding the results. You will use it all through algebra.

After these strategies, only a handful of facts are worth learning by heart because they are used so often: $6 \times 7 = 42$, $6 \times 8 = 48$, $7 \times 7 = 49$, $7 \times 8 = 56$, $8 \times 8 = 64$.

::: key Times-table strategies
Order does not matter: $6 \times 7 = 7 \times 6$. Break a hard product into easy pieces and add them: $7 \times 8 = 7 \times 5 + 7 \times 3 = 56$. Times 4 and times 8 are repeated doubling; times 5 is half of times 10; times 9 is times 10 minus one lot.
:::

## Long multiplication

For bigger numbers, the break-it-apart idea grows into **long multiplication**. Split one number by place value, multiply by each piece, and add the pieces up.

Take $36 \times 24$. Split 24 into $20 + 4$:

- $36 \times 4 = 144$
- $36 \times 20 = 720$ (that is $36 \times 2 = 72$, then times 10)

Add them: $144 + 720 = 864$. So $36 \times 24 = 864$.

Written in columns, the same work looks like this. Each row is one piece. The row for the tens digit is ten times bigger, so it gets a zero on the end.

```text
     36
  ×  24
  -----
    144     36 × 4
    720     36 × 20
  -----
    864
```

Estimate to check: $40 \times 20 = 800$. The answer, 864, is close. Good.

::: example Checking a propellant load by long multiplication
**The problem.** A first stage burns 2,537 kg of propellant every second for 162 seconds. How much does it burn in all?

**Split 162 by place value** into $100 + 60 + 2$, and multiply 2,537 by each piece:

- $2537 \times 2 = 5074$
- $2537 \times 60$: first $2537 \times 6 = 15{,}222$, then add a zero: $152{,}220$
- $2537 \times 100 = 253{,}700$ (two zeros on the end)

**Add the rows:**

```text
      2537
   ×   162
   -------
      5074     2537 × 2
    152220     2537 × 60
    253700     2537 × 100
   -------
    410994
```

**The answer** is 410,994 kg.

**Does that make sense?** Estimate: $2500 \times 160 = 400{,}000$. Close. And it matches the Falcon 9 first stage's propellant load of about 411,000 kg, which is where the 2,537 came from in the first place.
:::

## Long division

Division asks the reverse question: how many times does one number fit into another? In $7670 \div 5$, the number being divided up, 7,670, is the **dividend**. The number you divide by, 5, is the **divisor**. The answer is the **[[quotient|division-words]]**, and anything left over is the **remainder**.

**Long division** works from the left, one digit at a time, repeating four steps:

1. **Divide:** how many times does the divisor fit into the number in front of you? Write that digit on top.
2. **Multiply:** multiply that digit by the divisor.
3. **Subtract:** take the result away, to see what is left.
4. **Bring down** the next digit, and go back to step 1.

Here is $7670 \div 5$:

```text
     1534
    -----
5 ) 7670
    5         5 fits into 7 once: 5 × 1 = 5
    -
    26        7 − 5 = 2 left; bring down the 6
    25        5 fits into 26 five times: 5 × 5
    --
     17       1 left; bring down the 7
     15       5 fits into 17 three times: 5 × 3
     --
      20      2 left; bring down the 0
      20      5 fits into 20 four times: 5 × 4
      --
       0      nothing left over
```

So $7670 \div 5 = 1534$. Check by multiplying back: $1534 \times 5 = 7670$. It works.

::: example Long division with a big divisor
**The problem.** A stage burns 411,000 kg of propellant in 162 seconds. How many kilograms does it burn each second?

With a three-digit divisor, step 1 needs an estimate. 162 is about 160, so ask "how many 160s fit?" and then check.

```text
        2537  r 6
     -------
162 ) 411000
      324           162 fits into 411 twice: 162 × 2
      ---
       870          87 left; bring down a 0
       810          162 fits into 870 five times: 162 × 5
       ---
        600         60 left; bring down a 0
        486         162 fits into 600 three times: 162 × 3
        ---
        1140        114 left; bring down a 0
        1134        162 fits into 1140 seven times: 162 × 7
        ----
           6        remainder
```

Each guess was checked against the divisor. For 870, try 5: $162 \times 5 = 810$, which fits, and $162 \times 6 = 972$ is too big.

**The answer** is 2,537 remainder 6: about 2,537 kg every second. To go further, put a decimal point after 2,537 and keep bringing down zeros; the next digits are 0 and 4, so the rate is about 2,537.04 kg each second.

**Check:** $162 \times 2537 + 6 = 410{,}994 + 6 = 411{,}000$. It matches the long multiplication example, as it should, because division undoes multiplication.
:::

### What a remainder means

Sometimes the remainder is the whole point. A satellite takes 5,556 seconds to go once around Earth. How many minutes is that? There are 60 seconds in a minute, and 5,556 ÷ 60 is 92 with 36 left over, because $5556 = 92 \times 60 + 36$. So the orbit takes 92 minutes and 36 seconds — the remainder is the seconds left over.

Angles work the same way. A full turn is 360°, so a heading of 725° means two full turns and some more. 725 ÷ 360 is 2 with remainder 5, because $725 = 2 \times 360 + 5$. So the rocket is pointing at 5°. Throwing away the whole turns and keeping the remainder is called [[wrapping the angle|wrapping]].

::: warning Check a division by multiplying back
Always check: divisor × quotient + remainder must equal the dividend. It takes ten seconds and catches most slips. Also check the remainder is *smaller* than the divisor. A remainder of 170 when dividing by 162 means another 162 would have fit, so one quotient digit is too small.
:::

## Factors and multiples

Suppose you have 24 chairs and want to set them out in a neat rectangle, with every row the same length. You could do 1 row of 24, 2 rows of 12, 3 rows of 8 or 4 rows of 6. (Then 6 rows of 4 and so on, which are the same [[rectangles turned sideways|chair-rectangles]].) You cannot do 5 rows, because 24 does not divide evenly by 5.

The numbers that divide into 24 with no remainder are its **factors**: 1, 2, 3, 4, 6, 8, 12 and 24. They come in pairs that multiply to 24: $1 \times 24$, $2 \times 12$, $3 \times 8$, $4 \times 6$. To list all the factors of a number, test $1, 2, 3, \ldots$ in order and write down each pair. When the pairs start repeating, you are done.

Turn it around. Because 6 is a factor of 24, we say 24 is a **multiple** of 6. The multiples of 6 are the six times table, going on forever: 6, 12, 18, 24, 30, and so on.

::: key Factors and multiples
A **factor** of a number divides into it exactly, with no remainder. A **multiple** of a number is that number times a whole number. The factors of 24 are 1, 2, 3, 4, 6, 8, 12, 24; the multiples of 6 are 6, 12, 18, 24, …
:::

### Divisibility shortcuts

You can often tell whether a number divides exactly without doing the division:

| Divides by | If… | Example |
| --- | --- | --- |
| 2 | the last digit is even (0, 2, 4, 6, 8) | 7,670 ends in 0: yes |
| 3 | the digits add up to a multiple of 3 | 411,000: $4 + 1 + 1 = 6$: yes |
| 4 | the last two digits make a multiple of 4 | 1,936: 36 is: yes |
| 5 | the last digit is 0 or 5 | 7,670: yes |
| 6 | it passes the tests for 2 and for 3 | 162: even, and $1 + 6 + 2 = 9$: yes |
| 9 | the digits add up to a multiple of 9 | 162: $1 + 6 + 2 = 9$: yes |
| 10 | the last digit is 0 | 7,670: yes |

For 7,670 the digits add to $7 + 6 + 7 + 0 = 20$, which is not a multiple of 3, so 7,670 does not divide by 3 (or by 9).

The number 360 passes the tests for 2, 3, 4, 5, 6, 9 and 10 — it has 24 factors in all. That is [[no accident|why-360]].

::: note Why the digit-sum test works
Look at 162 in expanded form: $1 \times 100 + 6 \times 10 + 2$. Write $100$ as $99 + 1$ and $10$ as $9 + 1$:

$$
162 = 1 \times 99 + 6 \times 9 + (1 + 6 + 2).
$$

The parts $1 \times 99$ and $6 \times 9$ are multiples of 9 (and so of 3) already. So 162 divides by 3 or 9 exactly when the leftover piece, the digit sum $1 + 6 + 2 = 9$, does. The same trick works for any number of digits, because $1000 = 999 + 1$, and so on.
:::

## Prime numbers: the building blocks

Some numbers can be set out in only one rectangle: a single row. Seven chairs make 1 row of 7, and nothing else works. Those numbers are the **primes**.

A **prime number** is a whole number greater than 1 whose only factors are 1 and itself. The first few are 2, 3, 5, 7, 11, 13, 17, 19, 23, 29. A whole number greater than 1 that is *not* prime, like 24, is called **composite**.

A few facts to notice. 2 is the only even prime — every other even number has 2 as a factor. And [[1 is not a prime|one-not-prime]]. It has only one factor, and it is left out on purpose.

A good way to find primes is the [[sieve of Eratosthenes|sieve]]: write out the numbers from 2 upward, then cross off every multiple of 2 (except 2), every multiple of 3 (except 3), then 5, then 7. Whatever is never crossed off is prime. The primes below 50 are:

$$
2,\ 3,\ 5,\ 7,\ 11,\ 13,\ 17,\ 19,\ 23,\ 29,\ 31,\ 37,\ 41,\ 43,\ 47.
$$

To test one number, you only need to try dividing by primes up to the point where the prime times itself passes the number. Is 97 prime? Try 2, 3, 5 and 7: none divides it. The next prime is 11, and $11 \times 11 = 121$ is already bigger than 97. If 97 had a factor pair, one of the pair would have to be smaller than 11, and we tried them all. So 97 is prime.

### Factor trees

Every composite number can be broken down into primes multiplied together. That is its **prime factorization**. A **factor tree** is the easy way to find it: split the number into any two factors, then split those, and stop when every branch ends in a prime.

Take 24. Split it as $4 \times 6$. Then $4 = 2 \times 2$ and $6 = 2 \times 3$. The branches end in 2, 2, 2 and 3, so

$$
24 = 2 \times 2 \times 2 \times 3.
$$

Try a different first split, $3 \times 8$. Then $8 = 2 \times 4 = 2 \times 2 \times 2$. The primes are 3, 2, 2, 2 — the same primes, in a different order. That always happens. However you split a number, you end up with exactly the same primes. This is a real theorem (it has a grand name: the *fundamental theorem of arithmetic*), and it is what makes prime factorizations so useful.

::: key Primes
A prime is a whole number greater than 1 whose only factors are 1 and itself: 2, 3, 5, 7, 11, 13, … Every whole number above 1 is a product of primes in exactly one way (24 = 2 × 2 × 2 × 3).
:::

::: example A factor tree for 360
**The problem.** Find the prime factorization of 360, the number of degrees in a full turn.

**First split.** 360 ends in 0, so 10 is a factor: $360 = 36 \times 10$.

**Keep splitting.** $36 = 6 \times 6$, and each $6 = 2 \times 3$. Then $10 = 2 \times 5$.

**Collect the primes** at the ends of the branches — [[the full tree is drawn here|factor-tree]]:

$$
360 = 2 \times 2 \times 2 \times 3 \times 3 \times 5.
$$

**Check** by multiplying back in easy pairs: $2 \times 5 = 10$, $2 \times 2 = 4$, $3 \times 3 = 9$, and $10 \times 4 \times 9 = 360$. Correct.
:::

## Greatest common factor

The **greatest common factor** (GCF) of two numbers is the biggest number that divides into both. The list way: write out the factors of each and pick the biggest one on both lists.

- Factors of 24: 1, 2, 3, 4, 6, 8, **12**, 24
- Factors of 36: 1, 2, 3, 4, 6, 9, **12**, 18, 36

The largest shared factor is 12, so the GCF of 24 and 36 is 12.

The prime way is faster for big numbers. Write both as primes, and take every prime they *share*, as many times as it appears in both:

$$
24 = 2 \times 2 \times 2 \times 3, \qquad 36 = 2 \times 2 \times 3 \times 3.
$$

They share two 2s and one 3, so the GCF is $2 \times 2 \times 3 = 12$.

What is it for? Simplifying fractions. Twenty-four thirty-sixths of a tank is the same as two thirds of a tank: divide the top and the bottom by the GCF, 12. The next lesson does exactly that.

## Least common multiple

The **least common multiple** (LCM) of two numbers is the smallest number that both divide into. The list way: write out multiples of each until one appears on both lists.

- Multiples of 12: 12, 24, **36**, 48, …
- Multiples of 18: 18, **36**, 54, …

The LCM of 12 and 18 is 36.

The prime way: take every prime that appears in *either* number, as many times as it appears in whichever number has *more* of it.

$$
12 = 2 \times 2 \times 3, \qquad 18 = 2 \times 3 \times 3.
$$

The most 2s in either is two (from 12). The most 3s in either is two (from 18). So the LCM is $2 \times 2 \times 3 \times 3 = 36$.

Why the most, not the total? Because the LCM must contain all of 12 *and* all of 18, but a prime that both share only needs to appear once to serve both. Multiplying $12 \times 18 = 216$ gives a common multiple too, but not the least one. Here is a neat check: the GCF of 12 and 18 is 6, and $6 \times 36 = 216$. For any two numbers, the GCF times the LCM equals the two numbers multiplied together.

::: key GCF and LCM
Write both numbers as primes. The **GCF** takes the primes they share, each as many times as it appears in both. The **LCM** takes every prime in either, each as many times as it appears in whichever has more. GCF × LCM = the two numbers multiplied.
:::

::: warning Do not mix up GCF and LCM
The GCF is never bigger than the smaller number: it divides into both. The LCM is never smaller than the bigger number: both divide into it. If your "LCM" of 12 and 18 came out as 6, you found the GCF. If your GCF came out bigger than 12, it cannot divide into 12.
:::

::: example When two jobs line up
**The problem.** A flight computer runs its steering job every 20 milliseconds and its navigation job every 50 milliseconds. (A millisecond, ms, is a thousandth of a second.) Both run at time zero. When do they next start at the same moment?

**The idea.** The steering job starts at 20, 40, 60, … ms: the multiples of 20. The navigation job starts at the multiples of 50. They line up at the smallest number on both lists — the LCM.

**Primes.** $20 = 2 \times 2 \times 5$ and $50 = 2 \times 5 \times 5$. The most 2s in either is two (from 20); the most 5s is two (from 50). So the LCM is $2 \times 2 \times 5 \times 5 = 100$.

**The answer:** every 100 ms, ten times a second, both jobs start together, and the whole [[schedule repeats|rate-groups]].

**Check with lists.** Multiples of 20: 20, 40, 60, 80, 100. Multiples of 50: 50, 100. The first shared one is 100.
:::

The same LCM is what the algebra module calls the **least common denominator**: to add $\frac{5}{12}$ and $\frac{7}{18}$, you re-cut both into thirty-sixths. You will see how in the fractions lesson and in Algebra.

::: note Where this comes back
- [Signed numbers, fractions and ratios](#/module/t0_m01_algebra_precalc?lesson=l01-signed-numbers-and-fractions) adds fractions over a least common denominator, found from prime factorizations exactly as above.
- [Polynomials, expanding and factoring](#/module/t0_m01_algebra_precalc?lesson=l03-polynomials-and-factoring) pulls a greatest common factor out of expressions with letters, like $6x^3 - 4x^2 = 2x^2(3x - 2)$. It is the GCF with letters in it.
- [atan2, quadrants and angle wrapping](#/module/t0_m02_trigonometry?lesson=l03-atan2-quadrants-wrapping) wraps angles into one turn by keeping the remainder after dividing by 360°.
- [Python from zero](#/module/t0_m03_python_scicomp?lesson=l01-python-basics) has operators for exactly the two answers long division gives: `//` for the whole quotient and `%` for the remainder.
:::

## Check yourself

::: check
Work out $7 \times 9$, $8 \times 7$ and $6 \times 12$ using a strategy, not memory. Say which strategy you used.
:::

::: answer
$7 \times 9$: times 10, take one lot away: $70 - 7 = 63$.

$8 \times 7$: double three times: 14, 28, 56.

$6 \times 12$: break 12 apart into $10 + 2$: $60 + 12 = 72$.
:::

::: check
Does 7,670 divide exactly by 2? By 3? By 5? By 9? Use the shortcuts, then find $7670 \div 2$ to check the first.
:::

::: answer
It ends in 0, which is even, so it divides by 2 — and by 5 and 10 too. Its digits add to $7 + 6 + 7 + 0 = 20$, which is not a multiple of 3, so it divides by neither 3 nor 9.

$7670 \div 2 = 3835$, with no remainder. Check: $3835 \times 2 = 7670$.
:::

::: check
Is 91 prime? Then find the prime factorization of 84 with a factor tree.
:::

::: answer
91 looks prime, but try the primes: not 2 (odd), not 3 ($9 + 1 = 10$), not 5 (does not end in 0 or 5), and 7: $7 \times 13 = 91$. So 91 is **not** prime; it is $7 \times 13$.

84: split as $4 \times 21$. Then $4 = 2 \times 2$ and $21 = 3 \times 7$. So $84 = 2 \times 2 \times 3 \times 7$. Check: $4 \times 3 = 12$ and $12 \times 7 = 84$.
:::

::: check
Find the GCF and the LCM of 18 and 24. Check your answers with the GCF × LCM rule.
:::

::: answer
Primes: $18 = 2 \times 3 \times 3$ and $24 = 2 \times 2 \times 2 \times 3$.

**GCF:** shared primes, one 2 and one 3: $2 \times 3 = 6$.

**LCM:** the most 2s is three (from 24), the most 3s is two (from 18): $2 \times 2 \times 2 \times 3 \times 3 = 72$.

**Check:** $6 \times 72 = 432$, and $18 \times 24 = 432$. They match.
:::

::: check
A spacecraft's software adds up its turning and reports a heading of 1,000°. What heading between 0° and 360° is that? Use long division.
:::

::: answer
$1000 \div 360$: 360 fits twice ($360 \times 2 = 720$), and $1000 - 720 = 280$ is left over. So 1,000 ÷ 360 is 2 with remainder 280.

Two full turns change nothing, so the heading is **280°**. Check: $2 \times 360 + 280 = 1000$.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Order does not matter | $6 \times 7 = 7 \times 6$, and the same for any pair |
| Break it apart | $7 \times 8 = 7 \times 5 + 7 \times 3$; the distributive law |
| Long multiplication | split one number by place value, multiply by each piece, add the rows |
| Long division | divide, multiply, subtract, bring down; check with divisor × quotient + remainder |
| Factor / multiple | a factor divides in exactly; a multiple is the number times a whole number |
| Divisibility | 2: even last digit; 3 and 9: digit sum; 5: ends in 0 or 5; 10: ends in 0 |
| Prime | greater than 1, only factors 1 and itself: 2, 3, 5, 7, 11, 13, … |
| Prime factorization | one way only: $24 = 2 \times 2 \times 2 \times 3$, $360 = 2 \times 2 \times 2 \times 3 \times 3 \times 5$ |
| GCF | shared primes; used to simplify fractions |
| LCM | every prime, most times it appears; used for common denominators |

Next lesson: fractions, from the ground up — what they mean, how to see that two fractions are equal, and how the GCF and LCM from this lesson make them simple.

::: context division-words The words of division
**Quotient** comes from the Latin *quotiens*, meaning "how many times" — which is exactly the question division asks. **Dividend** means "the thing to be divided". In Python, which you will learn later in the course, `7670 // 5` gives the quotient, 1534, and `7670 % 5` gives the remainder, 0. Engineers use the remainder operator constantly, for jobs from wrapping angles to deciding which step of a repeating schedule a computer is on.
:::

::: context wrapping Remainders go around in circles
A heading of 725° is two full turns and 5° more. Each full turn of 360° brings you back to where you started, so only the remainder decides where you end up pointing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g transform="translate(95,100)">
    <circle r="70" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <circle r="52" fill="none" stroke="#8fb8f0" stroke-width="3"/>
    <circle r="40" fill="none" stroke="#8fb8f0" stroke-width="3"/>
    <line x1="0" y1="0" x2="0" y2="-78" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
    <line x1="0" y1="0" x2="6.8" y2="-77.7" stroke="#b4232c" stroke-width="3"/>
    <polygon points="7.2,-82 2.6,-72 11.6,-71.3" fill="#b4232c"/>
    <text x="0" y="-86" font-size="11" fill="#6c7a93" text-anchor="middle">0°</text>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="185" y="70">725° = 2 turns + 5°</text>
    <text x="185" y="95" fill="#1d6fd1">blue: 2 × 360° = 720°</text>
    <text x="185" y="120" fill="#b4232c">red: the 5° left over</text>
    <text x="185" y="145">725 = 2 × 360 + 5</text>
  </g>
</svg>
```

A clock does the same thing with hours: 14 o'clock on a 12-hour clock is 2, because $14 = 1 \times 12 + 2$.
:::

::: context chair-rectangles Four ways to set out 24 chairs
Every rectangle with 24 squares gives a factor pair of 24. Turning a rectangle on its side gives the same pair backwards, so these four are all there are.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <pattern id="sq" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect x="24" y="12" width="288" height="12" fill="url(#sq)"/>
  <text x="318" y="23" font-size="12" fill="#1f2a44">1 × 24</text>
  <rect x="24" y="48" width="144" height="24" fill="url(#sq)"/>
  <text x="178" y="64" font-size="12" fill="#1f2a44">2 × 12</text>
  <rect x="24" y="96" width="96" height="36" fill="url(#sq)"/>
  <text x="130" y="118" font-size="12" fill="#1f2a44">3 × 8</text>
  <rect x="216" y="96" width="72" height="48" fill="url(#sq)"/>
  <text x="296" y="124" font-size="12" fill="#1f2a44">4 × 6</text>
  <text x="180" y="180" font-size="12" fill="#b4232c" text-anchor="middle">factors of 24: 1, 2, 3, 4, 6, 8, 12, 24</text>
</svg>
```
:::

::: context why-360 Why a circle has 360 degrees
Nobody is completely sure, but the degree is usually traced back to the astronomers of ancient Babylon, who counted in groups of sixty. What is certain is that 360 is a wonderfully convenient choice: it has 24 factors (1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120, 180 and 360). So a half, a third, a quarter, a fifth, a sixth, an eighth, a ninth, a tenth and a twelfth of a turn are all whole numbers of degrees. Mathematics itself prefers a different unit, the radian, which you meet in the trigonometry module.
:::

::: context one-not-prime Why 1 is left out
If 1 counted as a prime, every number would have endless prime factorizations: $24 = 2 \times 2 \times 2 \times 3$, but also $1 \times 2 \times 2 \times 2 \times 3$, and $1 \times 1 \times 2 \times 2 \times 2 \times 3$, and so on. The rule "every number breaks into primes in exactly one way" would be false. Leaving 1 out keeps that rule true, and that rule is the whole reason primes are useful.
:::

::: context sieve The sieve of Eratosthenes
Cross off the multiples of 2, 3 and 5 (but not 2, 3 and 5 themselves). Up to 30, whatever survives is prime — except 1, which is left out because it is not a prime at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g font-size="13" text-anchor="middle">
    <g fill="#fff" stroke="#1f2a44" stroke-width="1">
      <rect x="10" y="10" width="340" height="102"/>
    </g>
    <g fill="#8fb8f0">
      <rect x="44" y="10" width="34" height="34"/><rect x="78" y="10" width="34" height="34"/>
      <rect x="146" y="10" width="34" height="34"/><rect x="214" y="10" width="34" height="34"/>
      <rect x="10" y="44" width="34" height="34"/><rect x="78" y="44" width="34" height="34"/>
      <rect x="214" y="44" width="34" height="34"/><rect x="282" y="44" width="34" height="34"/>
      <rect x="78" y="78" width="34" height="34"/><rect x="282" y="78" width="34" height="34"/>
    </g>
    <g fill="#1f2a44">
      <text x="27" y="32" fill="#6c7a93">1</text><text x="61" y="32">2</text><text x="95" y="32">3</text><text x="129" y="32" fill="#6c7a93">4</text><text x="163" y="32">5</text>
      <text x="197" y="32" fill="#6c7a93">6</text><text x="231" y="32">7</text><text x="265" y="32" fill="#6c7a93">8</text><text x="299" y="32" fill="#6c7a93">9</text><text x="333" y="32" fill="#6c7a93">10</text>
      <text x="27" y="66">11</text><text x="61" y="66" fill="#6c7a93">12</text><text x="95" y="66">13</text><text x="129" y="66" fill="#6c7a93">14</text><text x="163" y="66" fill="#6c7a93">15</text>
      <text x="197" y="66" fill="#6c7a93">16</text><text x="231" y="66">17</text><text x="265" y="66" fill="#6c7a93">18</text><text x="299" y="66">19</text><text x="333" y="66" fill="#6c7a93">20</text>
      <text x="27" y="100" fill="#6c7a93">21</text><text x="61" y="100" fill="#6c7a93">22</text><text x="95" y="100">23</text><text x="129" y="100" fill="#6c7a93">24</text><text x="163" y="100" fill="#6c7a93">25</text>
      <text x="197" y="100" fill="#6c7a93">26</text><text x="231" y="100" fill="#6c7a93">27</text><text x="265" y="100" fill="#6c7a93">28</text><text x="299" y="100">29</text><text x="333" y="100" fill="#6c7a93">30</text>
    </g>
  </g>
  <text x="180" y="132" font-size="12" fill="#1d6fd1" text-anchor="middle">blue: the ten primes up to 30</text>
</svg>
```

Eratosthenes was a Greek scholar in Egypt more than 2,200 years ago. He is also famous for measuring the size of the Earth, using shadows cast by the Sun in two cities.
:::

::: context factor-tree The factor tree for 360
Split, then split again, until every branch ends in a prime (shown in blue). Multiply the six blue primes back together and you get 360.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="180" y1="30" x2="110" y2="70"/><line x1="180" y1="30" x2="260" y2="70"/>
    <line x1="110" y1="80" x2="70" y2="120"/><line x1="110" y1="80" x2="150" y2="120"/>
    <line x1="260" y1="80" x2="230" y2="160"/><line x1="260" y1="80" x2="300" y2="160"/>
    <line x1="70" y1="130" x2="45" y2="160"/><line x1="70" y1="130" x2="95" y2="160"/>
    <line x1="150" y1="130" x2="125" y2="160"/><line x1="150" y1="130" x2="175" y2="160"/>
  </g>
  <g font-size="15" text-anchor="middle" fill="#1f2a44">
    <rect x="160" y="10" width="40" height="22" fill="#fff"/><text x="180" y="27">360</text>
    <rect x="94" y="62" width="32" height="22" fill="#fff"/><text x="110" y="79">36</text>
    <rect x="244" y="62" width="32" height="22" fill="#fff"/><text x="260" y="79">10</text>
    <rect x="60" y="112" width="20" height="22" fill="#fff"/><text x="70" y="129">6</text>
    <rect x="140" y="112" width="20" height="22" fill="#fff"/><text x="150" y="129">6</text>
  </g>
  <g font-size="15" font-weight="700" text-anchor="middle" fill="#1d6fd1">
    <text x="45" y="177">2</text><text x="95" y="177">3</text><text x="125" y="177">2</text><text x="175" y="177">3</text>
    <text x="230" y="177">2</text><text x="300" y="177">5</text>
  </g>
  <text x="180" y="196" font-size="12" fill="#b4232c" text-anchor="middle">360 = 2 × 2 × 2 × 3 × 3 × 5</text>
</svg>
```
:::

::: context rate-groups Flight software runs on a timetable
A flight computer does many jobs, each on its own beat — steering many times a second, navigation less often, housekeeping slower still. Engineers pick the beats so they fit together neatly, then build a timetable that repeats. The length of that repeating timetable, often called the **major frame**, is the least common multiple of all the beats. The digital control and real-time software modules later in the course are built on exactly this idea.
:::
