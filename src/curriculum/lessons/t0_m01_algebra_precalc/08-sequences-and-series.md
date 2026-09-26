---
id: l08-sequences-and-series
title: Sequences, series and sigma notation
minutes: 21
covers:
  - sequences, series, and sigma notation
---

Say you put $5$ dollars in a jar every week. Write down how much is in the jar each Sunday: $5, 10, 15, 20, \ldots$ That numbered list is a **sequence**. Now drop a bouncy ball and write down how high it gets after each bounce: $2\,\mathrm{m}$, then $1.2\,\mathrm{m}$, then $0.72\,\mathrm{m}$, each bounce a bit lower than the last. That is a sequence too. And if you add up a list as you go — the total distance the ball has travelled — you get a **[[series|series-word]]**.

A flight computer lives on lists like these. It never sees a smooth signal. It sees the [[accelerometer|accelerometer]] reading at tick $0$, at tick $1$, at tick $2$, a hundred or a thousand times a second. Add those readings up and you get velocity. Add the velocities up and you get position. A digital filter is a rule that builds each new output by mixing together old ones in fixed proportions. The sigma sign $\sum$ is the notation that lets you write "add these $n$ things" in one line and then work with it like any other expression.

Two families of sequence turn up again and again. In an **arithmetic** sequence you add the same amount each step, like the jar. In a **[[geometric|why-geometric]]** sequence you multiply by the same amount each step, like the ball. The geometric one matters more: it is the step-by-step version of the exponential from the previous lesson. You will work out a formula for the sum of each, and you will watch the rocket equation's logarithm appear out of a sum.

This lesson is also where counting from zero starts to matter. Python counts from $0$. Most textbooks count from $1$. Both are fine. Mixing them up causes the **[[off-by-one error|fencepost]]**, the most common bug in numerical code.

## Sequences: a numbered list

A **sequence** is an ordered list of numbers $a_1, a_2, a_3, \ldots$, one for each counting number $n = 1, 2, 3, \ldots$ The $n$th number in the list is called the **term** $a_n$ — read "a sub n" — and $n$ is its **index**, its position in the line. Think of seats in a row: $n$ is the seat number and $a_n$ is who is sitting there.

A sequence is really a function whose inputs are whole numbers, so there are two ways to describe one.

- An **explicit formula** gives $a_n$ straight from $n$. The formula $a_n = 2n - 1$ gives the odd numbers $1, 3, 5, \ldots$ (put in $n = 1$, get $1$; put in $n = 2$, get $3$). The formula $a_n = 1/n$ gives $1, \tfrac{1}{2}, \tfrac{1}{3}, \ldots$
- A **recursive formula** gives each term from the ones before it, plus a starting value. The rule $a_1 = 1$, $a_{n+1} = 2a_n$ ("the next term is twice this one") gives $1, 2, 4, 8, \ldots$

Recursions are how computers actually step through time. The new velocity is the old velocity plus this tick's acceleration times the length of a tick:

$$
v_{k+1} = v_k + a_k\,\Delta t .
$$

Here $\Delta t$ ("delta t") is the time step, and $k$ counts ticks. You will read and write lines like this constantly.

### Arithmetic sequences: add the same amount

If each term is the last one plus a fixed number $d$, the sequence is **arithmetic**, and $d$ is the **common difference**:

$$
a_{n+1} = a_n + d .
$$

Picture a staircase where every step is the same height. To reach step $n$ from step $1$ you climb $n - 1$ steps, not $n$. In the same way, the $n$th term has had $d$ added $n - 1$ times:

$$
a_n = a_1 + (n - 1)\,d .
$$

With $a_1 = 3$ and $d = 4$ the list is $3, 7, 11, 15, \ldots$ The twenty-fifth term is $3 + 24 \times 4 = 3 + 96 = 99$ — not $103$, because the first term has had nothing added yet.

On a vehicle: the velocity of something under steady acceleration $a$, sampled every $\Delta t$, is arithmetic with $d = a\,\Delta t$. A countdown clock is arithmetic with $d = -1$.

### Geometric sequences: multiply by the same amount

If each term is the last one times a fixed number $r$, the sequence is **geometric**, and $r$ is the **common ratio**:

$$
a_{n+1} = r\,a_n .
$$

The [[bouncing ball|bounce]] is geometric with $r = 0.6$: each bounce reaches $60\%$ of the height before. By the same staircase counting, the $n$th term has been multiplied by $r$ a total of $n - 1$ times:

$$
a_n = a_1\, r^{\,n-1} .
$$

With $a_1 = 2$ and $r = 3$ the list is $2, 6, 18, 54, \ldots$ and the sixth term is $2 \times 3^5 = 2 \times 243 = 486$.

This is the exponential function from the last lesson, looked at only at whole-number steps, and it behaves the same way:

- if $|r| > 1$ the terms grow;
- if $|r| < 1$ they shrink towards zero;
- if $r < 0$ the signs flip back and forth, $+, -, +, -$.

You will meet geometric sequences all over a spacecraft. A nuclear power source whose output halves every $87.7$ years, checked once a year, is geometric with $r = 0.5^{1/87.7} \approx 0.9921$. The mass left after each of $n$ identical rocket stages is geometric with $r = 1/MR$, the flip of the mass ratio. The output of a simple digital filter after its input is switched off is geometric, with $r$ equal to the filter's coefficient.

A geometric sequence with $|r| < 1$ **converges** to $0$: its terms get as close to zero as you like and stay there. An arithmetic sequence with $d \neq 0$ never converges. It marches off forever in one direction.

::: warning Zero-based and one-based counting
Written with $a_1$ first, the $n$th term is $a_1 r^{n-1}$. Written with $a_0$ first, as a Python list is, the very same list is $a_n = a_0 r^n$, and the "twenty-fifth" element is `a[24]`. Neither way is wrong. What is wrong is using a formula built one way with an index counted the other way. Whenever a formula has $n$, $n - 1$ or $n + 1$ in it, stop and ask: which term is number one?
:::

## Sigma notation: a short way to say "add them up"

A grocery receipt lists items and then a total. Writing "item 1 plus item 2 plus … plus item 20" gets tiring. Mathematics has a shorthand, the capital Greek letter **[[sigma|two-s-signs]]**, $\sum$ (it is an S, for "sum"):

$$
\sum_{k=1}^{n} a_k = a_1 + a_2 + \cdots + a_n .
$$

Read it aloud as "the sum, from $k$ equals $1$ to $n$, of a sub k". The recipe is:

1. Start $k$ at the number written underneath ($1$ here).
2. Work out the expression on the right for that $k$.
3. Add $1$ to $k$ and repeat, until $k$ reaches the number on top ($n$).
4. Add up everything you got.

The letter $k$ is the **index of summation**. It is a placeholder, like the name on a ticket that only matters inside the theatre: outside the sum it means nothing. So $\sum_{k=1}^{n} a_k$ and $\sum_{j=1}^{n} a_j$ are the same number, exactly as $f(x)$ and $f(t)$ were the same function.

The expression can be anything:

- $\sum_{k=1}^{4} k^2 = 1 + 4 + 9 + 16 = 30$.
- $\sum_{i=0}^{3} 2^i = 1 + 2 + 4 + 8 = 15$ (this one starts at $i = 0$).
- $\sum_{k=1}^{n} c = nc$ for a constant $c$, because $c$ is added $n$ times.

The average of $n$ sensor readings, $\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i$ ($\bar{x}$ is read "x bar"), is a sigma you will write every week in the statistics module.

In Python the same thing is a loop:

```python
a = [5 + 0.2 * k for k in range(100)]   # a_k = 5 + 0.2 k,  k = 0 ... 99
total = sum(a)                          # 1490.0
```

`range(100)` runs from $0$ to $99$ — one hundred terms, counted from zero — so this is $\sum_{k=0}^{99} (5 + 0.2k)$.

### Rules for working with sums

A sigma is only ordinary adding written compactly, so it obeys the ordinary rules of arithmetic. Three rules do almost all the work.

**Constants come out front.** If you buy every item on the receipt three times, the bill is three times the total: $\sum c\,a_k = c \sum a_k$. (This is the distributive law.)

**Sums split term by term.** If each line on the receipt is an item plus its tax, the bill is all the items plus all the tax: $\sum (a_k + b_k) = \sum a_k + \sum b_k$.

**Limits can be split and shifted.** You can total the first $m$ lines, then the rest: $\sum_{k=1}^{n} a_k = \sum_{k=1}^{m} a_k + \sum_{k=m+1}^{n} a_k$. And you can renumber the lines. Replacing $k$ by $j + 1$ everywhere turns $\sum_{k=1}^{n} a_k$ into $\sum_{j=0}^{n-1} a_{j+1}$ — the same terms with new labels. Shifting is how you move between one-based and zero-based forms without changing the answer.

There is **no** rule for a sum of products: $\sum a_k b_k$ is not $(\sum a_k)(\sum b_k)$. Test it with $a = b = (1, 1)$. The left side is $1 \cdot 1 + 1 \cdot 1 = 2$. The right side is $(1 + 1)(1 + 1) = 4$.

### Adding up $1 + 2 + \cdots + n$

The story goes that a teacher told a class to add up the numbers from $1$ to $100$, expecting peace and quiet, and a young [[Carl Friedrich Gauss|gauss-ceres]] had the answer in a minute. His trick: pair the first number with the last. $1 + 100 = 101$. $2 + 99 = 101$. $3 + 98 = 101$. Every pair makes $101$, and there are $50$ pairs, so the total is $50 \times 101 = 5050$.

Here is the same trick for any $n$. Write the sum forwards, then backwards underneath, and add each column:

$$
\begin{aligned}
S &= 1 + 2 + \cdots + (n-1) + n \\
S &= n + (n-1) + \cdots + 2 + 1 \\
2S &= (n+1) + (n+1) + \cdots + (n+1) = n(n+1).
\end{aligned}
$$

There are $n$ columns and each one adds to $n + 1$, so two copies of the sum make $n(n+1)$. One copy is half of that:

$$
\sum_{k=1}^{n} k = \frac{n(n+1)}{2} .
$$

Check with $n = 4$: $1 + 2 + 3 + 4 = 10$, and $\frac{4 \times 5}{2} = 10$.

Two companions are worth having on hand. The first $n$ odd numbers add up to a perfect square, $\sum_{k=1}^{n} (2k - 1) = n^2$ — check $1 + 3 + 5 + 7 = 16 = 4^2$. And the sum of the first $n$ squares is $\sum_{k=1}^{n} k^2 = \frac{n(n+1)(2n+1)}{6}$. For $n = 10$ that gives $\frac{10 \times 11 \times 21}{6} = 385$, which you can check by adding the ten squares yourself.

## Arithmetic series

A **series** is what you get when you add up the terms of a sequence. For an arithmetic sequence, Gauss's pairing works again. The first and last terms add to $a_1 + a_n$. The second and second-to-last add to the same thing, because one went up by $d$ and the other went down by $d$. So every pair has the same total, and

$$
S_n = \sum_{k=1}^{n} a_k = \frac{n\,(a_1 + a_n)}{2} = n \times (\text{average of first and last}) .
$$

With $a_1 = 3$, $d = 4$ and $n = 25$: the last term is $a_{25} = 99$, so $S_{25} = 25 \times \frac{3 + 99}{2} = 25 \times 51 = 1275$.

::: example Distance from sampled velocity
A stage accelerates from rest at a steady $a = 29.42\,\mathrm{m/s^2}$ (three $g$). The computer samples its velocity every $\Delta t = 0.1\,\mathrm{s}$. After $k$ ticks the velocity is $v_k = a\,k\,\Delta t$ — an arithmetic sequence with $d = 29.42 \times 0.1 = 2.942\,\mathrm{m/s}$.

How far does it go in the first $10\,\mathrm{s}$, which is $n = 100$ ticks? Distance is speed times time. Pretend the velocity stays at its end-of-tick value for the whole tick. Then each tick adds $v_k\,\Delta t$, and the total is a series:

$$
x \approx \sum_{k=1}^{100} v_k\,\Delta t = \sum_{k=1}^{100} a\,k\,\Delta t^2 = a\,\Delta t^2 \sum_{k=1}^{100} k .
$$

The constants $a$ and $\Delta t^2$ came out front. The sum left over is Gauss's $5050$. So

$$
x \approx 29.42 \times 0.01 \times 5050 = 1486\,\mathrm{m} .
$$

That slightly overestimates, because the stage was really going slower for most of each tick. Using the start-of-tick value instead gives $\sum_{k=0}^{99} k = 4950$ and $x \approx 29.42 \times 0.01 \times 4950 = 1456\,\mathrm{m}$, a slight underestimate. The exact answer for steady acceleration is $\tfrac{1}{2} a t^2 = \tfrac{1}{2} \times 29.42 \times 10^2 = 1471\,\mathrm{m}$, sitting exactly between the two. Good sign.

Now do the sum for any $n$. With $t = n\,\Delta t$,

$$
a\,\Delta t^2\,\frac{n(n+1)}{2} = \tfrac{1}{2} a\,(n\,\Delta t)^2 \cdot \frac{n+1}{n} = \tfrac{1}{2} a t^2 \left(1 + \tfrac{1}{n}\right) .
$$

As the ticks get shorter, $n$ gets bigger, $\tfrac{1}{n}$ shrinks towards zero, and the answer tends to $\tfrac{1}{2}at^2$. You have derived the constant-acceleration distance law by adding up a series — which is what an integral is. You have also seen that a $0.1\,\mathrm{s}$ tick gives a $1\%$ error ($\tfrac{1}{n} = \tfrac{1}{100}$), which is why navigation software uses better rules than "hold the last value" when it adds things up.
:::

## Geometric series

Now the sum that matters most. A geometric series adds up the first $n$ terms of a geometric sequence with first term $a$ and ratio $r$:

$$
S_n = a + ar + ar^2 + \cdots + ar^{n-1} .
$$

There are $n$ terms, and the last power is $n - 1$ because the first term has $r^0 = 1$. The sum has a neat closed form:

$$
S_n = a\,\frac{1 - r^n}{1 - r} \qquad (r \neq 1) .
$$

In words: the first term, times "one minus the ratio to the power of how many terms", divided by "one minus the ratio". If $r = 1$ every term is $a$, so $S_n = na$.

Check with $a = 2$, $r = 3$, $n = 6$. The formula gives $2 \times \frac{1 - 3^6}{1 - 3} = 2 \times \frac{1 - 729}{-2} = 2 \times \frac{-728}{-2} = 728$. Adding them by hand: $2 + 6 + 18 + 54 + 162 + 486 = 728$. They agree.

::: note Why the geometric sum formula has to be true
Multiply the whole sum by $r$. Every term moves one place along:

$$
\begin{aligned}
S_n &= a + ar + ar^2 + \cdots + ar^{n-1} \\
rS_n &= \phantom{a + {}} ar + ar^2 + \cdots + ar^{n-1} + ar^n .
\end{aligned}
$$

Every term of $rS_n$ except the last one also appears in $S_n$. So subtracting the second line from the first cancels all of them, and only the two ends survive: $S_n - rS_n = a - ar^n$. Take $S_n$ out as a common factor on the left, $S_n(1 - r) = a(1 - r^n)$, and divide both sides by $1 - r$ (allowed because $r \neq 1$). That is the formula.
:::

### Adding up forever: the infinite geometric series

Stand $1\,\mathrm{m}$ from a wall. [[Step halfway there|zeno]]: $\tfrac{1}{2}\,\mathrm{m}$. Step half the remaining distance: $\tfrac{1}{4}\,\mathrm{m}$. Then $\tfrac{1}{8}$, then $\tfrac{1}{16}$, forever. You take infinitely many steps, but you never go past the wall. Your total distance creeps up on exactly $1\,\mathrm{m}$.

That is an infinite geometric series with $a = \tfrac{1}{2}$ and $r = \tfrac{1}{2}$. The running totals are $0.5, 0.75, 0.875, 0.9375, 0.96875, \ldots$, each one halving the gap to $1$.

In general, if $|r| < 1$ then $r^n$ shrinks towards $0$ as $n$ grows, so the $r^n$ in the finite formula disappears and the running totals settle on a limit:

$$
S = \sum_{k=0}^{\infty} a r^k = \frac{a}{1 - r} \qquad (|r| < 1) .
$$

The $\infty$ on top, read "infinity", means "keep going forever". For the wall, $\frac{1/2}{1 - 1/2} = \frac{1/2}{1/2} = 1$, as promised. Infinitely many positive terms can add to a finite total, as long as they shrink fast enough.

If $|r| \geq 1$ the terms do not shrink, and the series **diverges**: the running totals grow without limit, or, for $r = -1$, flip back and forth between two values forever.

Repeating decimals are infinite geometric series in disguise. $0.2727\ldots$ is $0.27 + 0.0027 + 0.000027 + \cdots$, with $a = 0.27$ and $r = 0.01$. So it equals $\frac{0.27}{1 - 0.01} = \frac{0.27}{0.99} = \frac{27}{99} = \frac{3}{11}$. (Check: $3 \div 11 = 0.2727\ldots$) And $0.999\ldots = \frac{0.9}{1 - 0.1} = \frac{0.9}{0.9} = 1$ exactly. That [[surprises most people|point-nine-repeating]] the first time, and it is true all the same.

::: key Geometric series
Finite $n$ terms: $S_n = a(1 - r^n)/(1 - r)$, where $a$ is the first term and $r$ the common ratio. Infinite, for $|r| < 1$: $S = a/(1 - r)$. Arithmetic series: $S_n = n(a_1 + a_n)/2$. Sum of the first $n$ integers: $n(n+1)/2$.
:::

::: warning The infinite formula needs $|r| < 1$
$a/(1 - r)$ will happily give you a number for $r = 3$: it says $\frac{1}{1 - 3} = -\tfrac{1}{2}$ for $1 + 3 + 9 + \cdots$, which is nonsense — a sum of growing positive numbers cannot be negative. The formula was built on $r^n$ vanishing. Check $|r| < 1$ before you use it.
:::

::: example A blowdown thruster
A small cold-gas thruster is fed from a tank with no pressure regulator. Each time it fires, the tank pressure drops a little, so each pulse delivers a bit less push than the one before. Say each pulse gives $95\%$ of the impulse of the previous one, and the first pulse gives $50\,\mathrm{N\,s}$ (impulse is force times time, in newton seconds). The pulses form a geometric sequence with $a = 50\,\mathrm{N\,s}$ and $r = 0.95$.

**Total impulse from the first $30$ pulses.** Use the finite formula:

$$
S_{30} = 50 \times \frac{1 - 0.95^{30}}{1 - 0.95} .
$$

The awkward bit is $0.95^{30}$. Using logarithms from the last lesson, $0.95^{30} = e^{30 \ln 0.95} = e^{-1.539} = 0.2146$. So $1 - 0.2146 = 0.7854$, and

$$
S_{30} = 50 \times \frac{0.7854}{0.05} = 785\,\mathrm{N\,s} .
$$

**Total impulse if you could fire forever.** Use the infinite formula: $S = \frac{50}{1 - 0.95} = \frac{50}{0.05} = 1000\,\mathrm{N\,s}$.

So the first thirty pulses use up $78.5\%$ of everything the tank will ever give, and no number of extra pulses can add more than another $1000 - 785 = 215\,\mathrm{N\,s}$. The mission planner budgets against the $1000$. The factor $\frac{1}{1 - r}$ — twenty here — is how many "first pulses" the whole tank is worth. Sanity check: $785$ is less than $30 \times 50 = 1500$, which is what thirty full-strength pulses would give, as it should be.

**The same algebra in a filter.** A simple digital smoothing filter (a first-order low-pass filter) follows the rule

$$
y_k = \alpha\, y_{k-1} + (1 - \alpha)\, u_k ,
$$

where $u_k$ is the input at tick $k$, $y_k$ the output, and $\alpha$ ("alpha") a number between $0$ and $1$. Start at $y_0 = 0$ and switch on a steady input $u = 1$. Step it through: $y_1 = 1 - \alpha$; then $y_2 = \alpha(1 - \alpha) + (1 - \alpha) = (1 - \alpha)(1 + \alpha)$; and each tick adds one more power of $\alpha$. After $n$ ticks it is a geometric series:

$$
y_n = (1 - \alpha)\sum_{k=0}^{n-1} \alpha^k = (1 - \alpha)\,\frac{1 - \alpha^n}{1 - \alpha} = 1 - \alpha^n .
$$

With $\alpha = 0.8$ the output is $1 - 0.8^{10} = 0.893$ after ten ticks and $1 - 0.8^{20} = 0.988$ after twenty. The infinite sum is $(1 - \alpha) \cdot \frac{1}{1 - \alpha} = 1$: the filter settles on the input, closing the gap geometrically. You will meet this again as the step response of a first-order system.
:::

## Sums that become integrals — and the rocket equation

Think back to the hiking backpack full of water bottles. Every bottle you drink makes the pack lighter, so each next step is a little easier. A rocket is the same: each kilogram of propellant it throws out buys a bit more speed than the last, because there is less rocket left to push.

The previous lesson put this in numbers. Throwing out a small mass $\Delta m$ at exhaust speed $v_e$ gives the remaining mass $m$ a speed gain of about $v_e\,\Delta m / m$. The rocket equation came from "adding up $\Delta m / m$ as $m$ runs from $m_0$ down to $m_f$". Now you can write that sum down and work it out.

Split the propellant, $m_0 - m_f$, into $n$ equal parcels of size $\Delta m = (m_0 - m_f)/n$. Right before parcel $k$ goes out, the vehicle's mass is $m_0 - k\,\Delta m$ (counting $k$ from $0$). Adding up the speed gains and dividing by $v_e$:

$$
\frac{\Delta v}{v_e} \approx \sum_{k=0}^{n-1} \frac{\Delta m}{m_0 - k\,\Delta m} .
$$

This is not arithmetic or geometric — the bottoms of the fractions form an arithmetic sequence — and for a finite $n$ it has no neat closed form. But you can compute it. Take $m_0 = 100$ and $m_f = 50$ (any units; only the ratio matters).

- One parcel of $50$: the sum is $\frac{50}{100} = 0.5$.
- Two parcels of $25$: $\frac{25}{100} + \frac{25}{75} = 0.25 + 0.333 = 0.583$.
- Ten parcels: $0.669$. A hundred: $0.6907$. A thousand: $0.6929$. A hundred thousand: $0.69314$.

The values close in on $\ln 2 = 0.693147$. And $\ln(m_0/m_f) = \ln(100/50) = \ln 2$ is exactly what the rocket equation says. The calculus module shows that this kind of sum of $\Delta m / m$, over finer and finer parcels, always tends to $\ln(m_0 / m_f)$ — that is one way to define the logarithm. But the numbers are already in front of you. The rocket equation is a sum of tiny speed gains, and each equal parcel of propellant buys more speed than the last because the vehicle is lighter.

A related sum shows why the logarithm grows so slowly. The **[[harmonic series|harmonic-name]]** adds up the reciprocals of the counting numbers, $H_n = \sum_{k=1}^{n} \frac{1}{k} = 1 + \tfrac{1}{2} + \tfrac{1}{3} + \cdots$ It gives $H_{10} = 2.93$, $H_{100} = 5.19$ and $H_{1000} = 7.49$. It never stops growing, so it diverges — but only like $\ln n$ plus a constant (about $0.577$). Ten times as many terms add only about $2.3 = \ln 10$ to the total. Compare the geometric series, which converges because its terms shrink by a fixed *ratio*. That contrast is the whole difference between "shrinks fast enough" and "does not".

::: note What the sigma is for
Nothing in this lesson needed a sigma; you could write every sum out with dots. The point of $\sum$ is that it turns a sum into a single *object*. You can pull a constant out of it, split it, shift its index, later take its derivative term by term, and prove things about it for every $n$ at once. Whenever a derivation says "and so on", the honest version has a sigma in it with its limits written out — and the honest version is the one that catches off-by-one errors.
:::

## Check yourself

::: check
Write the sequence $7, 11, 15, 19, \ldots$ with an explicit formula, find its fortieth term, and find the sum of its first forty terms.
:::

::: answer
It goes up by $4$ each time, so it is arithmetic with $a_1 = 7$ and $d = 4$: $a_n = 7 + 4(n - 1) = 4n + 3$. Check: $n = 1$ gives $7$. So $a_{40} = 4 \times 40 + 3 = 163$.

Sum: $S_{40} = \frac{40 \times (7 + 163)}{2} = 40 \times 85 = 3400$.
:::

::: check
Evaluate $\displaystyle\sum_{k=1}^{20} (3k - 2)$ using the rules for sums and the formula for $\sum k$.
:::

::: answer
Split the sum and bring the constant out: $3\sum_{k=1}^{20} k - \sum_{k=1}^{20} 2$. The first part is $3 \times \frac{20 \times 21}{2} = 3 \times 210 = 630$. The second adds $2$ twenty times, $40$. So the answer is $630 - 40 = 590$.

Check with the arithmetic-series formula: the first term is $3 - 2 = 1$, the last is $60 - 2 = 58$, so $S = \frac{20 \times 59}{2} = 590$.
:::

::: check
Write $\dfrac{1}{3} + \dfrac{1}{9} + \dfrac{1}{27} + \cdots$ in sigma notation and find its sum. What happens to the sum if the ratio is changed to $3$?
:::

::: answer
It is $\sum_{k=1}^{\infty} \left(\tfrac{1}{3}\right)^k$, geometric with first term $a = \tfrac{1}{3}$ and ratio $r = \tfrac{1}{3}$. So $S = \frac{1/3}{1 - 1/3} = \frac{1/3}{2/3} = \frac{1}{2}$.

With $r = 3$ the terms grow, $|r| \geq 1$, and the series diverges. The formula $a/(1 - r)$ would give $-\tfrac{1}{2}$, a meaningless number, because it was derived assuming $|r| < 1$.
:::

::: check
A satellite's reaction wheel (a spinning wheel used to turn the spacecraft) is told to spin down so that each second it loses $10\%$ of the speed it had at the start of that second. It starts at $3000\,\mathrm{rpm}$ (revolutions per minute). What is its speed after $20\,\mathrm{s}$? How many revolutions does it turn in those $20\,\mathrm{s}$, if the speed during each second is taken as its start-of-second value?
:::

::: answer
First change units: $3000\,\mathrm{rpm} = 3000 / 60 = 50\,\mathrm{rev/s}$. Keeping $90\%$ each second makes the speed geometric with $a = 50\,\mathrm{rev/s}$ and $r = 0.9$.

After $20$ steps: $50 \times 0.9^{20} = 50 \times 0.1216 = 6.08\,\mathrm{rev/s}$, about $365\,\mathrm{rpm}$.

Revolutions: each second contributes its speed times one second, so the total is a geometric series, $50 \times \frac{1 - 0.9^{20}}{1 - 0.9} = 50 \times \frac{0.8784}{0.1} = 439$ revolutions. If it kept spinning down forever the total would be $\frac{50}{0.1} = 500$ revolutions — more than $439$, as it should be.
:::

::: check
Rewrite $\displaystyle\sum_{k=1}^{n} a_k r^{k-1}$ so that its index starts at $0$, and explain why the two are equal.
:::

::: answer
Let $j = k - 1$, so $k = j + 1$. When $k = 1$, $j = 0$; when $k = n$, $j = n - 1$. The sum becomes $\sum_{j=0}^{n-1} a_{j+1} r^{j}$.

The same $n$ terms are being added in the same order; only their labels changed. This is the shift you make every time a one-based formula is coded against a zero-based array.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Sequence | a function of a whole-number index; explicit $a_n = f(n)$ or recursive $a_{n+1} = f(a_n)$ |
| Arithmetic | $a_{n+1} = a_n + d$; $a_n = a_1 + (n-1)d$; $S_n = n(a_1 + a_n)/2$ |
| Geometric | $a_{n+1} = r a_n$; $a_n = a_1 r^{n-1}$; converges to $0$ exactly when $\lvert r \rvert < 1$ |
| Sigma | $\sum_{k=1}^{n} a_k = a_1 + \cdots + a_n$; the index is a placeholder |
| Rules | $\sum c a_k = c\sum a_k$; $\sum(a_k + b_k) = \sum a_k + \sum b_k$; split or shift limits; no rule for $\sum a_k b_k$ |
| Integers | $\sum_{k=1}^{n} k = n(n+1)/2$; $\sum (2k-1) = n^2$; $\sum k^2 = n(n+1)(2n+1)/6$ |
| Geometric series | $S_n = a(1 - r^n)/(1 - r)$; $S_\infty = a/(1 - r)$ for $\lvert r \rvert < 1$ |
| Divergence | geometric with $\lvert r \rvert \geq 1$; harmonic $\sum 1/k$ grows like $\ln n$ |
| Rocket equation as a sum | $\sum \Delta m / m \to \ln(m_0/m_f)$ as the parcels shrink |
| Indexing | one-based $a_1 r^{n-1}$ versus zero-based $a_0 r^n$; check which term is first |

Next lesson: from equalities to **inequalities** — the limits that box in a design, like a thrust-to-weight ratio that must be more than one, a heating rate that must stay under a limit, or a radius that must be at least the planet's radius, $r \geq R$.

::: context series-word A series is a sum, not a list
In everyday English a series is a string of things one after another — a TV series, a series of games. Mathematics is stricter. A **sequence** is the list; a **series** is what you get when you add the list up. The ball's heights $2, 1.2, 0.72, \ldots$ are a sequence. The running total of how far it has travelled is a series. People mix the two words up all the time, so fix it now: list first, then sum.
:::

::: context accelerometer The sensor that feels a push
An **accelerometer** measures how hard it is being pushed — its acceleration. Your phone has a tiny one; it is how the screen knows you turned the phone sideways. A rocket carries very precise ones, together with **gyroscopes** that sense turning, in a box called an inertial measurement unit. The flight computer reads them hundreds of times a second and adds the readings up, tick by tick, to know its speed and position without looking outside at all. That adding up is a series.
:::

::: context why-geometric Where the two names come from
The names come from two kinds of average. In an arithmetic sequence every term is the ordinary average — the **arithmetic mean** — of its two neighbours: $7$ is halfway between $3$ and $11$. In a geometric sequence every term is the **geometric mean** of its neighbours, the square root of their product: $6 = \sqrt{2 \times 18}$. That mean earned its name from geometry: $\sqrt{ab}$ is the side of a square with the same area as an $a$-by-$b$ rectangle. It comes back for estimating in the last lesson of this module.
:::

::: context fencepost The fencepost puzzle
A fence $3\,\mathrm{m}$ long has a post every metre. How many posts? Most people say three. The answer is four: three gaps, but a post at each end.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 136" font-family="Inter, Arial, sans-serif">
<line x1="20" y1="90" x2="340" y2="90" stroke="#6c7a93" stroke-width="1.5"/>
  <g fill="#f2b880">
    <rect x="65" y="52" width="80" height="6"/><rect x="145" y="52" width="80" height="6"/><rect x="225" y="52" width="80" height="6"/>
    <rect x="65" y="72" width="80" height="6"/><rect x="145" y="72" width="80" height="6"/><rect x="225" y="72" width="80" height="6"/>
  </g>
  <rect x="60" y="40" width="10" height="50" fill="#1f2a44"/><rect x="140" y="40" width="10" height="50" fill="#1f2a44"/><rect x="220" y="40" width="10" height="50" fill="#1f2a44"/><rect x="300" y="40" width="10" height="50" fill="#1f2a44"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="65" y="30">post 1</text><text x="145" y="30">post 2</text><text x="225" y="30">post 3</text><text x="305" y="30">post 4</text>
    <text x="105" y="106">1 m</text><text x="185" y="106">1 m</text><text x="265" y="106">1 m</text>
  </g>
  <text x="180" y="126" font-size="12" fill="#b4232c" text-anchor="middle">3 gaps, but 4 posts</text>
</svg>
```

Posts and gaps always differ by one. So do "how many terms from $a_1$ to $a_n$" (that is $n$) and "how many steps between them" (that is $n - 1$). Programmers call this bug the fencepost error, and it is why formulas in this lesson keep saying $n - 1$.
:::

::: context bounce Every bounce keeps sixty percent
Each time the ball hits the floor it loses the same *fraction* of its energy to squashing and heat, and how high a ball rises is proportional to its energy. So every height is the one before times the same $0.6$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 196" font-family="Inter, Arial, sans-serif">
<line x1="20" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="2"/>
  <line x1="50" y1="50" x2="50" y2="170" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4 3"/>
  <circle cx="50" cy="44" r="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="62" y="48" font-size="12" fill="#1f2a44">dropped from 2 m</text>
  <path d="M50.0,170 Q99.3,26.0 148.6,170" fill="none" stroke="#1d6fd1" stroke-width="2"/><path d="M148.6,170 Q186.8,83.6 225.0,170" fill="none" stroke="#1d6fd1" stroke-width="2"/><path d="M225.0,170 Q254.5,118.2 284.1,170" fill="none" stroke="#1d6fd1" stroke-width="2"/><path d="M284.1,170 Q307.0,138.9 329.9,170" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="99.3" y="92.0">1.2 m</text><text x="186.8" y="120.8">0.72 m</text><text x="254.5" y="138.1">0.43 m</text><text x="307.0" y="148.4">0.26 m</text></g>
  <text x="340" y="190" font-size="11" fill="#6c7a93" text-anchor="end">each bounce: 0.6 × the one before</text>
</svg>
```

How far does it travel in all, bouncing forever? Down $2\,\mathrm{m}$, then up and down on every bounce: $2 + 2 \times \frac{1.2}{1 - 0.6} = 2 + 6 = 8\,\mathrm{m}$. That sum is a geometric series, and you will have the formula for it by the end of this lesson.
:::

::: context two-s-signs Two ways to write S
Leonhard Euler began writing $\Sigma$ for sums in 1755. It is the Greek capital S, standing for *summa*, Latin for "total" — which also gave English the word sum. Eighty years earlier Gottfried Leibniz had picked a tall, stretched S, $\int$, for the **integral**: a sum of infinitely many infinitely thin pieces. So the two signs are cousins. $\Sigma$ adds separate pieces; $\int$ adds a smooth flow. Near the end of this lesson you will watch the first turn into the second.
:::

::: context gauss-ceres Gauss and the lost dwarf planet
Gauss grew up to be one of the greatest mathematicians who ever lived — and one of the first navigators of space. In 1801 astronomers found Ceres, the largest body in the asteroid belt, then lost it in the Sun's glare after only a few weeks of sightings. Gauss, aged 24, invented a new way to work out an orbit from those few measurements and predicted where Ceres would reappear. It was found almost exactly there. His **method of least squares**, for fitting the best answer through imperfect measurements, is still at the heart of how spacecraft work out where they are.
:::

::: context zeno Zeno's paradox
About 2,500 years ago the Greek thinker Zeno of Elea used this very walk to argue that motion is impossible. Before you reach the wall you must cover half the distance, then half of what is left, and so on without end — and how can anyone finish infinitely many steps? Mathematics took a very long time to answer him properly: infinitely many pieces can add up to a finite total.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
<rect x="30.00" y="40" width="150.00" height="34" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="180.00" y="40" width="75.00" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="255.00" y="40" width="37.50" height="34" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="292.50" y="40" width="18.75" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="311.25" y="40" width="9.38" height="34" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="320.62" y="40" width="4.69" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="325.31" y="40" width="2.34" height="34" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="327.66" y="40" width="1.17" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="328.83" y="40" width="0.59" height="34" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <line x1="330" y1="24" x2="330" y2="92" stroke="#1f2a44" stroke-width="4"/>
  <text x="330" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">wall</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="105" y="62">1/2</text><text x="217.5" y="62">1/4</text><text x="273.75" y="62">1/8</text>
  </g>
  <line x1="30" y1="100" x2="330" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="94" x2="30" y2="106" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="330" y1="94" x2="330" y2="106" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">1/2 + 1/4 + 1/8 + 1/16 + … = 1 m</text>
</svg>
```

Each block is half the one before. Together they fill exactly one metre, and never more.
:::

::: context point-nine-repeating Why 0.999… really is 1
Two more ways to see it. First: $\tfrac{1}{3} = 0.333\ldots$, and three times that is $0.999\ldots$ — but three thirds make $1$. Second: two different numbers always have other numbers between them, such as their average. So try to find a number between $0.999\ldots$ and $1$. Any number less than $1$ must have a digit smaller than $9$ somewhere, and then it is already smaller than $0.999\ldots$ There is no room between them, so they are the same number written two ways.
:::

::: context harmonic-name Why it is called harmonic
A guitar string vibrates as a whole, and also in halves, thirds, quarters and so on. These are its **harmonics**, the overtones that give an instrument its sound, and their wavelengths are $1, \tfrac{1}{2}, \tfrac{1}{3}, \tfrac{1}{4}, \ldots$ of the longest one — hence the name. A strange consequence: stack identical books off the edge of a table, each sticking out as far as it can without toppling, and the overhangs are $\tfrac{1}{2}, \tfrac{1}{4}, \tfrac{1}{6}, \ldots$ of a book — half the harmonic series. Because the series diverges, a tall enough stack can reach as far out as you like.
:::
