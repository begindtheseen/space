---
id: l08-sequences-and-series
title: Sequences, series and sigma notation
minutes: 15
covers:
  - sequences, series, and sigma notation
---

A flight computer never sees a continuous signal. It sees a list: the accelerometer reading at tick $0$, at tick $1$, at tick $2$, a hundred or a thousand times a second. Velocity is what you get by adding those readings up, position by adding the velocities up, and a digital filter is a rule that builds each new output from a weighted sum of the old ones. Lists of numbers indexed by an integer are **sequences**; running totals of them are **series**; and the sigma sign $\sum$ is the notation that lets you write "add these $n$ things" in one line and manipulate it like any other expression.

The two families you will meet most are the arithmetic sequence, where each term is the last plus a constant, and the geometric sequence, where each term is the last times a constant. The geometric one matters more: it is the discrete version of the exponential from the previous lesson, and its sum has a closed form that shows up in filters, in payments, in the response of a control loop and in the way a rocket equation is a sum of small velocity gains. You will derive both sum formulas and see how the rocket equation's logarithm emerges from one of them.

This lesson is also where the habit of counting from zero begins to matter. Python counts from $0$; most textbooks count from $1$. Both are fine; mixing them is the source of the off-by-one error, the most common bug in numerical code.

## Sequences

A **sequence** is an ordered list of numbers $a_1, a_2, a_3, \ldots$, one for each positive integer $n$; the $n$th number is the **term** $a_n$ and $n$ is its **index**. A sequence is a function whose domain is the integers, and the two ways of specifying a function carry over. An **explicit formula** gives $a_n$ directly in terms of $n$: $a_n = 2n - 1$ is the odd numbers $1, 3, 5, \ldots$, and $a_n = 1/n$ is $1, \tfrac{1}{2}, \tfrac{1}{3}, \ldots$. A **recursive formula** gives $a_n$ in terms of earlier terms plus a starting value: $a_1 = 1$, $a_{n+1} = 2a_n$ is $1, 2, 4, 8, \ldots$. Recursions are how sampled systems are actually written — the new velocity is the old velocity plus this tick's acceleration times the time step, $v_{k+1} = v_k + a_k\,\Delta t$ — so you will read and write them constantly.

### Arithmetic sequences

If each term exceeds the last by a fixed **common difference** $d$, the sequence is **arithmetic**: $a_{n+1} = a_n + d$. Unrolling the recursion from $a_1$, the $n$th term has had $d$ added $n - 1$ times:

$$
a_n = a_1 + (n - 1)\,d .
$$

The velocity of a vehicle under constant acceleration $a$, sampled every $\Delta t$, is arithmetic with $d = a\,\Delta t$. A countdown clock is arithmetic with $d = -1$. Note the $n - 1$: the first term has had nothing added yet. With $a_1 = 3$ and $d = 4$, the twenty-fifth term is $3 + 24 \times 4 = 99$, not $103$.

### Geometric sequences

If each term is the last times a fixed **common ratio** $r$, the sequence is **geometric**: $a_{n+1} = r\,a_n$. Unrolling,

$$
a_n = a_1\, r^{\,n-1} .
$$

This is the exponential function evaluated at integer steps, and it inherits everything from the last lesson: growth if $|r| > 1$, decay towards zero if $|r| < 1$, alternating signs if $r < 0$. With $a_1 = 2$ and $r = 3$ the sixth term is $2 \times 3^5 = 486$. The remaining power of an isotope source sampled once a year is geometric with $r = 0.5^{1/87.7} = 0.9921$; the mass of a vehicle after each of $n$ identical stages is geometric with $r = 1/MR$; the output of a first-order digital filter after its input is switched off is geometric with $r$ equal to the filter coefficient. A geometric sequence with $|r| < 1$ **converges** to $0$ — its terms get and stay as close to zero as you like. An arithmetic sequence with $d \neq 0$ never converges; it marches off.

::: warning Zero-based and one-based indexing
Written with $a_1$ first, the $n$th term is $a_1 r^{n-1}$. Written with $a_0$ first, as a Python list is, the same list is $a_n = a_0 r^n$ and the "twenty-fifth" element is `a[24]`. Neither convention is wrong; what is wrong is applying a formula derived in one convention to an index counted in the other. Whenever a formula contains $n$, $n - 1$ or $n + 1$, stop and ask which term is number one.
:::

## Sigma notation

The sum of the first $n$ terms of a sequence is written

$$
\sum_{k=1}^{n} a_k = a_1 + a_2 + \cdots + a_n .
$$

The letter under the $\sum$ is the **index of summation**, a dummy variable: it takes each integer value from the lower limit to the upper limit, the expression to the right is evaluated at each, and the results are added. The index has no meaning outside the sum, so $\sum_{k=1}^{n} a_k$ and $\sum_{j=1}^{n} a_j$ are the same number, exactly as $f(x)$ and $f(t)$ were the same function. The expression can be anything: $\sum_{k=1}^{4} k^2 = 1 + 4 + 9 + 16 = 30$; $\sum_{i=0}^{3} 2^i = 1 + 2 + 4 + 8 = 15$; $\sum_{k=1}^{n} c = nc$ for a constant $c$, since it is added $n$ times. The sample mean of $n$ sensor readings, $\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i$, is a sigma you will write weekly in the statistics module.

In Python the same thing is a loop or a comprehension:

```python
a = [5 + 0.2 * k for k in range(100)]   # a_k = 5 + 0.2 k,  k = 0 ... 99
total = sum(a)                          # 1490.0
```

`range(100)` runs from $0$ to $99$ — one hundred terms, zero-based — so this is $\sum_{k=0}^{99} (5 + 0.2k)$.

### Rules for manipulating sums

Sums obey the ordinary laws of arithmetic, because they are ordinary additions written compactly. Three rules do almost all the work.

**Constants factor out**: $\sum c\,a_k = c \sum a_k$ (distributive law).

**Sums split term by term**: $\sum (a_k + b_k) = \sum a_k + \sum b_k$ (regrouping).

**Limits can be split and shifted**: $\sum_{k=1}^{n} a_k = \sum_{k=1}^{m} a_k + \sum_{k=m+1}^{n} a_k$, and replacing $k$ by $j + 1$ throughout turns $\sum_{k=1}^{n} a_k$ into $\sum_{j=0}^{n-1} a_{j+1}$ — the same terms, renumbered. Shifting is how you move between one-based and zero-based forms without changing the value.

There is no rule for a sum of products: $\sum a_k b_k$ is not $(\sum a_k)(\sum b_k)$. Test with $a = b = (1, 1)$: the left is $2$, the right is $4$.

### The sum of the first $n$ integers

The most-used closed form is for $\sum_{k=1}^{n} k$. Write the sum forwards and backwards and add the columns:

$$
\begin{aligned}
S &= 1 + 2 + \cdots + (n-1) + n \\
S &= n + (n-1) + \cdots + 2 + 1 \\
2S &= (n+1) + (n+1) + \cdots + (n+1) = n(n+1),
\end{aligned}
$$

so

$$
\sum_{k=1}^{n} k = \frac{n(n+1)}{2} .
$$

For $n = 100$ this is $5050$, and the trick — pairing first with last — is the one Gauss is said to have found as a schoolboy. Two companions worth having on hand: $\sum_{k=1}^{n} (2k - 1) = n^2$ (the first $n$ odd numbers make a square; check $1 + 3 + 5 + 7 = 16$) and $\sum_{k=1}^{n} k^2 = \frac{n(n+1)(2n+1)}{6}$, which gives $385$ for $n = 10$; you can verify it by adding the ten squares.

## Arithmetic series

A **series** is a sum of the terms of a sequence. For an arithmetic sequence, the same pairing argument works because each pair $a_k + a_{n+1-k}$ has the same value $a_1 + a_n$:

$$
S_n = \sum_{k=1}^{n} a_k = \frac{n\,(a_1 + a_n)}{2} = n \times (\text{average of first and last}) .
$$

With $a_1 = 3$, $d = 4$, $n = 25$: $a_{25} = 99$ and $S_{25} = 25 \times (3 + 99)/2 = 25 \times 51 = 1275$.

::: example Distance from sampled velocity
A stage accelerates at a steady $a = 29.42\,\mathrm{m/s^2}$ (three $g$) from rest. Its velocity is sampled every $\Delta t = 0.1\,\mathrm{s}$, so after $k$ ticks $v_k = a\,k\,\Delta t$ — an arithmetic sequence with $d = 2.942\,\mathrm{m/s}$. Estimate the distance covered in the first $10\,\mathrm{s}$ ($n = 100$ ticks) by assuming the velocity holds its end-of-tick value through each tick, so that each tick contributes $v_k \Delta t$:

$$
x \approx \sum_{k=1}^{100} v_k\,\Delta t = a\,\Delta t^2 \sum_{k=1}^{100} k = 29.42 \times 0.01 \times 5050 = 1486\,\mathrm{m} .
$$

Using the start-of-tick value instead, $\sum_{k=0}^{99} k = 4950$, gives $1456\,\mathrm{m}$. The exact answer for constant acceleration, $\tfrac{1}{2} a t^2 = \tfrac{1}{2} \times 29.42 \times 100 = 1471\,\mathrm{m}$, sits exactly between them. Do the sum in general: $a\,\Delta t^2\,\frac{n(n+1)}{2}$ with $t = n\,\Delta t$ is $\tfrac{1}{2} a t^2 \left(1 + \tfrac{1}{n}\right)$, which tends to $\tfrac{1}{2}at^2$ as the tick shrinks. You have derived the constant-acceleration distance law by summing a series, which is what an integral is, and seen that a $0.1\,\mathrm{s}$ tick gives a $1\%$ error — the reason navigation software uses better rules than "hold the last value" when it integrates.
:::

## Geometric series

Now the sum that matters most. Let $S_n = a + ar + ar^2 + \cdots + ar^{n-1}$, the first $n$ terms of a geometric sequence with first term $a$ and ratio $r$. Multiply the whole sum by $r$:

$$
rS_n = ar + ar^2 + \cdots + ar^{n-1} + ar^n .
$$

Every term of $rS_n$ except the last also appears in $S_n$, so subtracting kills them all: $S_n - rS_n = a - ar^n$, and factoring $S_n$ on the left,

$$
S_n = a\,\frac{1 - r^n}{1 - r} \qquad (r \neq 1) .
$$

For $r = 1$ every term is $a$ and $S_n = na$. Check with $a = 2$, $r = 3$, $n = 6$: $2 \times (1 - 729)/(1 - 3) = 2 \times (-728)/(-2) = 728$, and $2 + 6 + 18 + 54 + 162 + 486 = 728$.

### The infinite geometric series

If $|r| < 1$, then $r^n \to 0$ as $n$ grows — the terms shrink geometrically, as the previous section said — and the partial sums settle on a limit:

$$
S = \sum_{k=0}^{\infty} a r^k = \frac{a}{1 - r} \qquad (|r| < 1) .
$$

Watch it happen with $a = r = \tfrac{1}{2}$: the partial sums are $0.5, 0.75, 0.875, 0.9375, 0.96875, \ldots$, each halving the distance to $1$, and $\frac{1/2}{1 - 1/2} = 1$. An infinite number of positive terms adds to a finite total because they shrink fast enough. If $|r| \geq 1$ the terms do not shrink and the series **diverges**: the partial sums grow without bound (or, for $r = -1$, flip forever between two values).

The repeating decimal $0.2727\ldots$ is an infinite geometric series in disguise, $0.27 + 0.0027 + \cdots$ with $a = 0.27$ and $r = 0.01$, so it equals $0.27/0.99 = 27/99 = 3/11$. And $0.999\ldots = 0.9/(1 - 0.1) = 1$ exactly, which unsettles people the first time and is nonetheless true.

::: key Geometric series
Finite $n$ terms: $S_n = a(1 - r^n)/(1 - r)$, where $a$ is the first term and $r$ the common ratio. Infinite, for $|r| < 1$: $S = a/(1 - r)$. Arithmetic series: $S_n = n(a_1 + a_n)/2$. Sum of the first $n$ integers: $n(n+1)/2$.
:::

::: example A blowdown thruster
A cold-gas thruster fed from a tank with no regulator delivers a little less impulse on each firing as the tank pressure drops — say each pulse gives $95\%$ of the impulse of the one before, with a first pulse of $50\,\mathrm{N\,s}$. The pulses form a geometric sequence with $a = 50\,\mathrm{N\,s}$ and $r = 0.95$.

Total impulse over the first $30$ pulses: $S_{30} = 50 \times (1 - 0.95^{30})/(1 - 0.95)$. Now $0.95^{30} = e^{30 \ln 0.95} = e^{-1.539} = 0.2146$, so $S_{30} = 50 \times 0.7854 / 0.05 = 785\,\mathrm{N\,s}$. Total impulse if you could fire forever: $S = 50 / 0.05 = 1000\,\mathrm{N\,s}$. So the first thirty pulses spend $78.5\%$ of everything the tank will ever deliver, and no number of further pulses can yield more than another $215\,\mathrm{N\,s}$. The mission planner budgets against the $1000$, and the $1/(1 - r)$ factor — twenty here — is the number of "first pulses" the tank is worth.

The same algebra describes a first-order digital low-pass filter, $y_k = \alpha\, y_{k-1} + (1 - \alpha)\, u_k$. Switch on a constant input $u = 1$ from $y_0 = 0$ and unroll: $y_n = (1 - \alpha)\sum_{k=0}^{n-1} \alpha^k = 1 - \alpha^n$. With $\alpha = 0.8$ the output is $0.893$ after ten ticks and $0.988$ after twenty, and the infinite sum is $(1 - \alpha)/(1 - \alpha) = 1$: the filter settles on the input, geometrically. You will meet this again as the step response of a first-order system.
:::

## Sums that become integrals — and the rocket equation

The previous lesson said the rocket equation comes from "summing $\Delta m / m$ as $m$ runs from $m_0$ down to $m_f$". You can now write and evaluate that sum. Split the propellant $m_0 - m_f$ into $n$ equal parcels $\Delta m = (m_0 - m_f)/n$; before parcel $k$ is expelled the vehicle mass is $m_k = m_0 - k\,\Delta m$, so

$$
\frac{\Delta v}{v_e} \approx \sum_{k=0}^{n-1} \frac{\Delta m}{m_0 - k\,\Delta m} .
$$

This is not arithmetic or geometric — the terms are reciprocals of an arithmetic sequence — and it has no elementary closed form for finite $n$. But it can be computed. Take $m_0 = 100$, $m_f = 50$ (any units; only the ratio matters). With one parcel the sum is $0.5$; with two, $0.583$; with ten, $0.669$; with a hundred, $0.6907$; with a thousand, $0.6929$; with a hundred thousand, $0.69314$. The values are closing in on $\ln 2 = 0.693147$, and $\ln(m_0/m_f) = \ln 2$ is exactly what the rocket equation says. The calculus module will show that any such sum of $\Delta m / m$ over finer and finer parcels tends to $\ln(m_0 / m_f)$ — that is one definition of the logarithm — but the numerical fact is already in front of you: the rocket equation is a geometric-flavoured sum of tiny velocity gains, and each equal parcel of propellant buys more speed than the last because the vehicle is lighter.

A related sum shows why the logarithm grows so slowly. The **harmonic series** $H_n = \sum_{k=1}^{n} \frac{1}{k}$ has $H_{10} = 2.93$, $H_{100} = 5.19$ and $H_{1000} = 7.49$ — it keeps growing, so it diverges, but only like $\ln n$ plus a constant ($0.577$). Ten times as many terms add about $2.3 = \ln 10$ to the total. The contrast with the geometric series, which converges because its terms shrink by a *ratio*, is the whole distinction between "decays fast enough" and "does not".

::: note What the sigma is for
Nothing in this lesson could not be written out with dots. The point of $\sum$ is that it makes a sum an *object*: you can factor a constant out of it, split it, shift its index, differentiate it term by term later, and prove things about it for every $n$ at once. Whenever a derivation says "and so on", the honest version has a sigma in it with explicit limits, and the honest version is the one that catches off-by-one errors.
:::

## Check yourself

::: check
Write the sequence $7, 11, 15, 19, \ldots$ with an explicit formula, find its fortieth term, and find the sum of its first forty terms.
:::

::: answer
Arithmetic with $a_1 = 7$, $d = 4$: $a_n = 7 + 4(n - 1) = 4n + 3$. So $a_{40} = 163$. $S_{40} = 40 \times (7 + 163)/2 = 40 \times 85 = 3400$.
:::

::: check
Evaluate $\displaystyle\sum_{k=1}^{20} (3k - 2)$ using the rules for sums and the formula for $\sum k$.
:::

::: answer
Split and factor: $3\sum_{k=1}^{20} k - \sum_{k=1}^{20} 2 = 3 \times \frac{20 \times 21}{2} - 2 \times 20 = 630 - 40 = 590$. Check by the arithmetic-series formula: first term $1$, last term $58$, $S = 20 \times 59 / 2 = 590$.
:::

::: check
Write $\dfrac{1}{3} + \dfrac{1}{9} + \dfrac{1}{27} + \cdots$ in sigma notation and find its sum. What happens to the sum if the ratio is changed to $3$?
:::

::: answer
$\sum_{k=1}^{\infty} \left(\tfrac{1}{3}\right)^k$, geometric with $a = \tfrac{1}{3}$ and $r = \tfrac{1}{3}$: $S = \frac{1/3}{1 - 1/3} = \frac{1/3}{2/3} = \frac{1}{2}$. With $r = 3$ the terms grow, $|r| \geq 1$, and the series diverges — the formula $a/(1 - r)$ gives $-\tfrac{1}{2}$, a meaningless number, because it was derived under the condition $|r| < 1$.
:::

::: check
A satellite's reaction wheel is commanded to spin down so that each second it loses $10\%$ of the speed it had at the start of that second. It starts at $3000\,\mathrm{rpm}$. What is its speed after $20\,\mathrm{s}$, and what is the total number of revolutions turned in those $20\,\mathrm{s}$ if the speed during each second is taken as its start-of-second value?
:::

::: answer
Speed is geometric with $a = 3000\,\mathrm{rpm} = 50\,\mathrm{rev/s}$ and $r = 0.9$. After $20$ steps: $50 \times 0.9^{20} = 50 \times 0.1216 = 6.08\,\mathrm{rev/s}$ ($365\,\mathrm{rpm}$). Revolutions: each second contributes its speed times one second, so the total is $50 \times \frac{1 - 0.9^{20}}{1 - 0.9} = 50 \times \frac{0.8784}{0.1} = 439$ revolutions. If it kept spinning down forever the total would be $50/0.1 = 500$ revolutions.
:::

::: check
Convert $\displaystyle\sum_{k=1}^{n} a_k r^{k-1}$ to a sum whose index starts at $0$, and explain why the two are equal.
:::

::: answer
Put $j = k - 1$, so $k = j + 1$; when $k = 1$, $j = 0$, and when $k = n$, $j = n - 1$. The sum becomes $\sum_{j=0}^{n-1} a_{j+1} r^{j}$. The same $n$ terms are being added in the same order; only their labels changed. This is the shift you perform every time a one-based formula is coded against a zero-based array.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Sequence | a function of an integer index; explicit $a_n = f(n)$ or recursive $a_{n+1} = f(a_n)$ |
| Arithmetic | $a_{n+1} = a_n + d$; $a_n = a_1 + (n-1)d$; $S_n = n(a_1 + a_n)/2$ |
| Geometric | $a_{n+1} = r a_n$; $a_n = a_1 r^{n-1}$; converges to $0$ iff $\lvert r \rvert < 1$ |
| Sigma | $\sum_{k=1}^{n} a_k = a_1 + \cdots + a_n$; the index is a dummy variable |
| Rules | $\sum c a_k = c\sum a_k$; $\sum(a_k + b_k) = \sum a_k + \sum b_k$; split or shift limits; no rule for $\sum a_k b_k$ |
| Integers | $\sum_{k=1}^{n} k = n(n+1)/2$; $\sum (2k-1) = n^2$; $\sum k^2 = n(n+1)(2n+1)/6$ |
| Geometric series | $S_n = a(1 - r^n)/(1 - r)$; $S_\infty = a/(1 - r)$ for $\lvert r \rvert < 1$ |
| Divergence | geometric with $\lvert r \rvert \geq 1$; harmonic $\sum 1/k$ grows like $\ln n$ |
| Rocket equation as a sum | $\sum \Delta m / m \to \ln(m_0/m_f)$ as the parcels shrink |
| Indexing | one-based $a_1 r^{n-1}$ versus zero-based $a_0 r^n$; check which term is first |

The next lesson turns from equalities to inequalities — the constraints that bound a design: a thrust-to-weight ratio that must exceed one, a heat flux that must stay below a limit, a domain written as $r \geq R$.
