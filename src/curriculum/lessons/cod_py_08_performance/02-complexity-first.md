---
id: l02-complexity-first
title: Fix the algorithm before the details
minutes: 24
covers:
  - 'Algorithmic complexity before micro-optimisation'
---

Picture a party where everyone shakes hands with everyone else, once. With 10 guests that is 45 handshakes. With 100 guests it is 4,950. Ten times the guests made about a hundred times the handshakes. Nobody got slower at shaking hands. The job itself grew faster than the party.

Now suppose the host wants the party to go faster, and trains everyone to shake hands twice as quickly. With 100 guests that saves half the time. With 1,000 guests there are 499,500 handshakes, and halving that still leaves a very long evening. The real fix is a different plan, like one wave to the room.

Space has the same party. Tens of thousands of tracked objects orbit Earth, and **[[conjunction screening|conjunction]]** asks which pairs might come dangerously close. Checking every pair of 30,000 objects means about 450 million pairs, every time the catalog updates. The last lesson said to profile first. This lesson is step two of the order of attack: before you make each step faster, ask how the number of steps grows. That growth is called the algorithm's **complexity**, and fixing it beats every trick of making single steps faster.

## Counting steps, not seconds

Seconds depend on the machine. Steps do not. So instead of asking "how long does this take?", ask "if the input doubles, what happens to the work?"

Take the handshakes. With $n$ guests, each shakes hands with the $n - 1$ others, and [[each handshake is counted twice|handshakes]] that way (once for each person), so the total is

$$
\frac{n(n-1)}{2} = \frac{n^2}{2} - \frac{n}{2}.
$$

For big $n$, the $n^2/2$ part is nearly all of it. When $n$ is 1,000, the $n^2/2$ part is 500,000 and the $n/2$ part is only 500. And the "divide by 2" does not change how the work *grows*: double $n$ and $n^2/2$ still goes up four times. So we keep only the fastest-growing piece and drop the constant in front. We say the handshakes are **$O(n^2)$**, read "big O of n squared", or "order n squared".

**[[Big-O notation|big-o-name]]** is a way of writing how the work grows with the input size $n$, keeping only the fastest-growing term and ignoring constant factors. The common ones:

| Name | Big-O | Doubling $n$ multiplies the work by | Example |
|---|---|---|---|
| constant | $O(1)$ | 1 | looking up an item in a set |
| logarithmic | $O(\log n)$ | adds one step | binary search in a sorted array |
| linear | $O(n)$ | 2 | one pass over a telemetry file |
| n log n | $O(n \log n)$ | a bit over 2 | sorting |
| quadratic | $O(n^2)$ | 4 | checking every pair |

The gaps between these rows are enormous. Here is the work for $n$ of a thousand and a million (logs are base 2, so $\log_2 10^6 \approx 20$):

| $n$ | $\log_2 n$ | $n$ | $n \log_2 n$ | $n^2$ |
|---|---|---|---|---|
| 1,000 | 10 | 1,000 | 10,000 | 1,000,000 |
| 1,000,000 | 20 | 1,000,000 | 20,000,000 | 1,000,000,000,000 |

Pure Python manages roughly 40 million simple steps a second on the machine used for this lesson. At that rate the $n \log n$ job on a million items takes about half a second. The $n^2$ job takes $10^{12} / (4 \times 10^7) = 25{,}000$ seconds, about seven hours.

::: key
Complexity describes how the work grows with the input size $n$. An $O(n^2)$ routine does four times the work when $n$ doubles; an $O(n)$ one does twice the work. No constant-factor speed-up keeps up with a worse growth rate once $n$ is large.
:::

## The doubling test

You do not have to read the code to learn its complexity. You can measure it. Time the job at some size $n$, then at $2n$, then at $4n$, and look at the ratios. A ratio near 2 means linear. A ratio near 4 means quadratic. A ratio near 8 means cubic.

Here is a real job: a ground station receives a batch of telemetry packets, and each should have a unique ID. Does any ID repeat? The first version compares every pair. The second remembers what it has seen in a **set** — a Python collection that answers "is this in here?" in about the same time no matter how big it gets, thanks to a trick called **[[hashing|hashing]]**.

```python
import timeit

def has_duplicate_pairs(ids):
    n = len(ids)
    for i in range(n):
        for j in range(i + 1, n):
            if ids[i] == ids[j]:
                return True
    return False

def has_duplicate_set(ids):
    seen = set()
    for x in ids:
        if x in seen:
            return True
        seen.add(x)
    return False

def doubling(f, sizes):
    prev = None
    for n in sizes:
        ids = list(range(n))          # worst case: no duplicates at all
        t = min(timeit.repeat(lambda: f(ids), number=1, repeat=5))
        ratio = "" if prev is None else f"  x{t / prev:.1f}"
        print(f"n={n:7d} {t * 1e3:8.2f} ms{ratio}")
        prev = t

doubling(has_duplicate_pairs, (1_000, 2_000, 4_000))
doubling(has_duplicate_set, (100_000, 200_000, 400_000))
```

On one machine (yours will give different times, but ratios close to these):

```text
n=   1000    12.06 ms
n=   2000    47.47 ms  x3.9
n=   4000   190.34 ms  x4.0
n= 100000     3.96 ms
n= 200000     7.94 ms  x2.0
n= 400000    16.31 ms  x2.1
```

The pairs version quadruples each time $n$ doubles: quadratic. The set version doubles: linear. Notice the set version handles a hundred times more packets in a tenth of the time.

You can turn one ratio into an exponent. If the time grows like $n^k$, then going from $n_1$ to $n_2$ multiplies the time by $(n_2/n_1)^k$. Take logs of both sides and solve for $k$:

$$
k = \frac{\log(t_2 / t_1)}{\log(n_2 / n_1)}.
$$

For the pairs version, from 2,000 to 4,000: $k = \log(190.34/47.47) / \log 2 = \log 4.01 / \log 2 \approx 2.0$. Plotting time against $n$ on a **[[log-log plot|log-log]]** shows the same thing as a slope.

::: example Predicting a million-packet batch
**The question.** A full day of telemetry holds a million packets. How long does each version take?

**Pairs version.** At 4,000 packets it took 0.19 s. A million is $10^6 / 4000 = 250$ times more packets. Quadratic means the time grows by $250^2 = 62{,}500$:

$$
0.19\,\mathrm{s} \times 62{,}500 \approx 11{,}900\,\mathrm{s} \approx 3.3\,\mathrm{hours}.
$$

**Set version.** At 400,000 packets it took 16.3 ms. A million is 2.5 times more, and linear means 2.5 times the time:

$$
16.3\,\mathrm{ms} \times 2.5 \approx 41\,\mathrm{ms}.
$$

**Sense check.** 3.3 hours against 41 milliseconds is a factor of nearly 300,000. Compiling the pairs version to C might make it 50 times faster, which still leaves about four minutes. The set version, in plain Python, wins by miles. The algorithm mattered more than the language.
:::

The doubling test is also how you tell the two kinds of slowness apart. If one function takes most of the time but its time grows in step with the input, it may only need a tighter implementation. If the time grows much faster than the input, as the square or worse, no tidying of the same algorithm will save it at the full size. You need a different algorithm.

::: warning Test at more than one size
One timing at one size tells you nothing about growth. A quadratic routine on 100 items can be faster than a linear one, because its steps are cheap and $100^2$ is small. Always time at least two sizes, ideally the real size and a quarter of it, before deciding the algorithm is fine.
:::

## Hidden loops

The pairs version has two loops you can see. The more dangerous quadratics have a loop you cannot see, because it is inside a function call that looks like one step.

`np.append(a, v)` looks like "add one item". It actually builds a brand-new array one item longer and copies every old item into it. Called in a loop, the $k$-th call copies $k$ items, and the total is about $n^2/2$ copies. Timed on one machine, growing an array to 25,000 items this way took 143 ms, and to 100,000 items took 2,360 ms. Four times the items, 16.5 times the time, close to $4^2 = 16$. Appending to a Python list and converting once at the end took 1.5 ms and 6.7 ms: linear, because a list's `append` is **[[amortised|amortised]]** $O(1)$.

Other one-liners that hide an $O(n)$ loop, and so make an $O(n^2)$ job when called $n$ times:

- `x in some_list` searches the list from the start. `x in some_set` does not.
- `some_list.index(x)`, `some_list.remove(x)`, `some_list.pop(0)` and `some_list.insert(0, x)` all walk or shift the list.
- `np.concatenate` or `pd.concat` inside a loop, adding one piece at a time, copies everything each time.
- `s = s + piece` on a long string in a loop can copy the whole string each time. Collect the pieces in a list and use `"".join(pieces)` at the end.

::: warning Look inside the loop body
When the profiler points at a loop, read every call inside it and ask "does this call walk through something that grows?" A hidden $O(n)$ call inside an $O(n)$ loop is the most common quadratic in real simulation code. The fix is usually a different container: a set or dict for lookups, a list for growing, one array allocated up front with `np.empty(n)` and filled in place.
:::

## Running totals: a moving average in O(n)

A **moving average** smooths a noisy signal. For each position, it averages the $w$ samples in a **window** of that width, then slides the window along by one. An accelerometer sampled at 1,000 Hz, averaged over a window of 50 samples, gives a smooth trace of 50-millisecond averages.

The obvious way re-adds all $w$ samples for every window. There are $n - w + 1$ windows, each costing $w$ additions, so the work is $O(nw)$ (read "order n times w"). Double the window and it doubles, even though the signal did not change.

The trick is a **prefix sum** (also called a cumulative sum): a running total, [[like the odometer in a car|prefix-picture]]. Let $c_0 = 0$ and let $c_k$ be the sum of the first $k$ samples. A running total never needs a restart: each $c_k$ is the one before plus one more sample. Then the sum of any window is a *difference* of two running totals, the same way the distance of a trip is the odometer at the end minus the odometer at the start:

$$
x_i + x_{i+1} + \dots + x_{i+w-1} = c_{i+w} - c_i.
$$

So every window costs one subtraction, whatever $w$ is. Building the running totals is one pass, $O(n)$, and the differences are another, $O(n)$. NumPy builds the running totals with `np.cumsum`:

```python
import numpy as np

x = np.array([3.0, 1.0, 4.0, 1.0, 5.0, 9.0, 2.0])
w = 3
c = np.concatenate(([0.0], np.cumsum(x)))   # c[0] = 0, c[k] = sum of first k
print(c)                                    # [ 0.  3.  4.  8.  9. 14. 23. 25.]
print(np.round((c[w:] - c[:-w]) / w, 3))    # [2.667 2.    3.333 5.    5.333]
```

The slice `c[w:]` is every running total from position $w$ on, and `c[:-w]` is every one except the last $w$. They have the same length, $n - w + 1$, and subtracting them lines up $c_{i+w}$ with $c_i$ for every window at once.

::: example A moving average by hand
**The data.** Samples $x = [3, 1, 4, 1, 5, 9, 2]$, window $w = 3$.

**Running totals.** Start at 0 and keep adding: $0, 3, 4, 8, 9, 14, 23, 25$. So $c_0 = 0$, $c_1 = 3$, up to $c_7 = 25$.

**First window** ($x_0, x_1, x_2 = 3, 1, 4$): $c_3 - c_0 = 8 - 0 = 8$, and $8 / 3 \approx 2.667$.

**Second window** ($1, 4, 1$): $c_4 - c_1 = 9 - 3 = 6$, and $6/3 = 2$.

**The rest.** $c_5 - c_2 = 14 - 4 = 10$ gives 3.333. $c_6 - c_3 = 23 - 8 = 15$ gives 5. $c_7 - c_4 = 25 - 9 = 16$ gives 5.333.

**Sense check.** Add the first window directly: $3 + 1 + 4 = 8$. Same. There are $7 - 3 + 1 = 5$ windows and five answers. Each answer cost one subtraction and one division, and a window of 3,000 would cost exactly the same.
:::

Timed on one machine, with 20,000 samples: the double-loop version took 28 ms, 52 ms and 102 ms for windows of 50, 100 and 200, doubling with $w$ as $O(nw)$ predicts. The prefix-sum version took 0.8 ms at every window size.

::: warning Big running totals lose small digits
A float64 carries about 16 significant digits. If the signal sits on a large offset, say air pressure near 101,325 Pa, the running total over five million samples reaches about $5 \times 10^{11}$, and the difference of two such totals keeps fewer correct digits. In a test with those numbers the window averages came out wrong by about $6 \times 10^{-7}$ Pa, which is harmless here but grows with longer signals. Subtracting the signal's mean before the cumulative sum, and adding it back after, removes most of the problem.
:::

## A sliding maximum with a monotonic deque

A **sliding maximum** reports the largest sample in each window. A guidance engineer might want the peak load in every 5-second stretch of a flight. The obvious version calls `max` on each window, which is $O(nw)$ again. A maximum cannot be done with running totals, because you cannot "subtract" a sample back out of a maximum. It needs a different container.

A **deque** (say "deck"), short for **[[double-ended queue|deque-name]]**, is a list you can add to and remove from quickly at *both* ends. Python has one in `collections`:

```python
from collections import deque

dq = deque()
dq.append(4)
dq.append(9)
dq.append(2)
print(dq)             # deque([4, 9, 2])
print(dq[0], dq[-1])  # 4 2      (front and back)
print(dq.pop())       # 2        removes from the back
print(dq.popleft())   # 4        removes from the front
print(dq)             # deque([9])
```

All four operations are $O(1)$. A plain list is $O(1)$ at the back but $O(n)$ at the front, because `pop(0)` shifts every other item.

Here is the idea. Keep a deque of *positions* whose values go down from front to back. Such a deque is called **monotonic**, meaning it only ever goes one way. The front is always the largest value in the current window. For each new sample at position $i$:

1. **Pop from the back** every position whose value is less than or equal to the new sample. Those can never be a window's maximum again: the new sample is at least as big and will stay in the window longer.
2. **Append** position $i$ at the back.
3. **Pop from the front** if the front position has slid out of the window (it is $i - w$ or earlier).
4. Once the first window is full ($i \ge w - 1$), the value at the front position is this window's maximum.

::: example Tracing the deque
**The data.** $x = [2, 7, 3, 5, 1, 6, 4]$ with $w = 3$. The table lists the *values* at the positions in the deque, front first.

| $i$ | new value | popped from back | expired from front | deque values | window max |
|---|---|---|---|---|---|
| 0 | 2 | none | none | 2 | not full yet |
| 1 | 7 | 2 | none | 7 | not full yet |
| 2 | 3 | none | none | 7, 3 | 7 |
| 3 | 5 | 3 | none | 7, 5 | 7 |
| 4 | 1 | none | 7 (position 1) | 5, 1 | 5 |
| 5 | 6 | 1, 5 | none | 6 | 6 |
| 6 | 4 | none | none | 6, 4 | 6 |

**At step 4** the window is positions 2, 3, 4. The 7 sits at position 1, which is $i - w = 1$, so it has slid out and leaves from the front. The 5 becomes the maximum.

**At step 5** the new 6 beats both 1 and 5, so both are popped from the back: they are older and smaller, so they can never win again.

**Sense check.** Brute force over the five windows $[2,7,3], [7,3,5], [3,5,1], [5,1,6], [1,6,4]$ gives maxima $7, 7, 5, 6, 6$. The deque gave the same. Count the work: 7 appends and 5 pops in total, never more than 2 per sample.
:::

::: note Why it has to be true
**Correct.** The deque always holds, in order, every position in the window that could still be a future maximum, and their values decrease from front to back. A position is only popped from the back when a newer sample is at least as large, and a newer sample outlives it in every future window, so the popped one can never be the maximum. The front is the largest survivor still inside the window, which is the window's maximum.

**Linear.** Each position is appended exactly once, and removed at most once, from one end or the other. So over the whole signal there are at most $n$ appends and $n$ pops, $2n$ deque operations, however large $w$ is. The inner `while` loop can pop many items in one step, but it can never pop more than was appended in total. The cost is $O(n)$.
:::

With 100,000 samples, a version that slices each window and calls `max` took, on one machine, 106 ms for $w = 100$, 819 ms for $w = 1{,}000$ and 7.2 s for $w = 10{,}000$. A deque version following the four steps above took 17 ms at every window size.

## Algorithm first, then the small stuff

**Micro-optimisation** means making each step of the same algorithm cheaper: storing a method in a local variable, avoiding an attribute lookup, switching `x**2` to `x*x`, compiling the loop. These are real and sometimes worth doing. But each one divides the runtime by a constant, anywhere from a few percent to fifty times for a compiler. None of them changes the growth rate.

Take the sliding maximum with 100,000 samples and $w = 10{,}000$. The slicing version does about $(n - w + 1) \times w \approx 9 \times 10^8$ comparisons. Even at a compiled speed of one nanosecond each, that is almost a second, and it grows with every doubling of $w$. The deque does at most $2 \times 10^5$ operations. Once you are on the right algorithm, then it is worth asking whether each step can be cheaper, and the later lessons on Numba and C++ are about exactly that.

::: key
Fix the algorithm before tuning the steps. A different algorithm changes how the work grows with $n$; a micro-optimisation or a compiler only divides the same work by a constant. A runtime that grows faster than the input size points to an algorithmic problem, not a constant-factor one.
:::

## Check yourself

::: check
A routine takes 0.5 s on 10,000 samples and 8.1 s on 40,000. Estimate its complexity exponent $k$, and predict the time on 160,000 samples.
:::

::: answer
The input grew by a factor of 4 and the time by $8.1 / 0.5 = 16.2$. So

$$
k = \frac{\log 16.2}{\log 4} \approx \frac{2.785}{1.386} \approx 2.0.
$$

It is quadratic. Going from 40,000 to 160,000 is another factor of 4 in $n$, so another factor of about $4^2 = 16$ in time: $8.1 \times 16 \approx 130$ seconds, a bit over two minutes.
:::

::: check
A loop over $n$ tracked objects does `if obj_id in active_ids:` where `active_ids` is a list of about $n$ IDs. What is the complexity, and what one-word change makes it linear?
:::

::: answer
Each `in` on a list walks it from the start, up to $n$ comparisons. Doing that $n$ times gives $O(n^2)$. Make `active_ids` a **set** (build it once with `set(active_ids)` before the loop). Each lookup is then about $O(1)$, and the loop is $O(n)$ overall.
:::

::: check
Using running totals, write the average of the window $x_2, x_3, x_4, x_5$ ($w = 4$) in terms of $c$. Then compute it for $c = [0, 2, 5, 11, 12, 20, 21]$.
:::

::: answer
The window starts at $i = 2$ and has $w = 4$, so its sum is $c_{i+w} - c_i = c_6 - c_2$. With the numbers, $c_6 - c_2 = 21 - 5 = 16$, and the average is $16 / 4 = 4$. (Reading the samples off the running totals: $x_2 = 11 - 5 = 6$, $x_3 = 1$, $x_4 = 8$, $x_5 = 1$, which add to 16. Same.)
:::

::: check
In the sliding-maximum deque, the new sample is 5 and the deque's values are, front to back, 9, 6, 5, 2. What happens in step 1, and why is it safe to throw those values away?
:::

::: answer
Step 1 pops from the back every value less than or equal to 5: first the 2, then the 5. It stops at the 6, which is bigger. The new 5 is appended, leaving 9, 6, 5 (the new one). The popped samples are older than the new 5, so they will leave the window before it does, and they are no larger than it. In every future window that still contains them, the new 5 is also there and is at least as large, so they can never be the maximum.
:::

::: check
A teammate says: "The O(n w) sliding-window code is fine, I'll compile it with Numba and it will be 50 times faster." With $n = 10^6$ and $w = 2 \times 10^4$, is that a good plan?
:::

::: answer
No. The slicing version does about $(n - w + 1) \times w \approx 9.8 \times 10^5 \times 2 \times 10^4 \approx 2 \times 10^{10}$ comparisons. Even at a very fast 1 ns each after compiling, that is about 20 seconds, and it doubles whenever $w$ doubles. The deque version does at most $2n = 2 \times 10^6$ operations, which is fast even in plain Python. Change the algorithm first; compile afterward only if the profile still says so.
:::

## Summary

| Idea | Meaning | Fact to carry |
|---|---|---|
| Complexity | How the work grows with input size $n$ | Keep the fastest-growing term, drop constants |
| $O(n)$, $O(n^2)$ | Linear, quadratic | Doubling $n$ multiplies work by 2, by 4 |
| Doubling test | Time at $n$, $2n$, $4n$ | $k = \log(t_2/t_1) / \log(n_2/n_1)$ |
| Hidden loops | One call that walks a whole container | `np.append`, `in list`, `pop(0)` inside a loop make $O(n^2)$ |
| Prefix sum | Running total $c_k$, with $c_0 = 0$ | Window sum $= c_{i+w} - c_i$, moving average in $O(n)$ |
| Deque | Fast add and remove at both ends | `append`, `pop`, `popleft`, `dq[0]` all $O(1)$ |
| Monotonic deque | Positions with decreasing values | Sliding maximum in $O(n)$: each position in once, out once |
| Micro-optimisation | Cheaper steps, same algorithm | Divides time by a constant, never changes the growth |

The next lesson moves on to step four: once the algorithm is right, stop looping in Python and hand whole arrays to NumPy, and learn the one case where that backfires by using more memory than it saves time.

::: context conjunction Screening for close approaches
A **conjunction** is a close pass between two orbiting objects. Space-surveillance networks track tens of thousands of objects, and operators screen for pairs predicted to pass within a few kilometers. Checking all pairs of 30,000 objects means $30{,}000 \times 29{,}999 / 2 \approx 4.5 \times 10^8$ pairs. Real screening tools first throw out pairs that cannot meet, for example two orbits whose altitude ranges never overlap, with cheap filters. That is an algorithmic fix of exactly the kind this lesson is about: do not make every pair check faster, avoid most of the pair checks.
:::

::: context handshakes Counting the handshakes
Draw five guests as dots and join every pair with a line. Each dot has 4 lines, which makes $5 \times 4 = 20$ line-ends, and each line has two ends, so there are $20 / 2 = 10$ lines. That is $n(n-1)/2$ with $n = 5$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="2">
    <line x1="180.0" y1="20.0" x2="248.5" y2="69.8"/>
    <line x1="180.0" y1="20.0" x2="222.3" y2="150.2"/>
    <line x1="180.0" y1="20.0" x2="137.7" y2="150.2"/>
    <line x1="180.0" y1="20.0" x2="111.5" y2="69.8"/>
    <line x1="248.5" y1="69.8" x2="222.3" y2="150.2"/>
    <line x1="248.5" y1="69.8" x2="137.7" y2="150.2"/>
    <line x1="248.5" y1="69.8" x2="111.5" y2="69.8"/>
    <line x1="222.3" y1="150.2" x2="137.7" y2="150.2"/>
    <line x1="222.3" y1="150.2" x2="111.5" y2="69.8"/>
    <line x1="137.7" y1="150.2" x2="111.5" y2="69.8"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="180.0" cy="20.0" r="7"/>
    <circle cx="248.5" cy="69.8" r="7"/>
    <circle cx="222.3" cy="150.2" r="7"/>
    <circle cx="137.7" cy="150.2" r="7"/>
    <circle cx="111.5" cy="69.8" r="7"/>
  </g>
  <text x="275" y="110" font-size="12" fill="#1f2a44">5 guests</text>
  <text x="275" y="126" font-size="12" fill="#1f2a44">10 handshakes</text>
</svg>
```

Double the guests to 10 and there are 45 lines; double again to 20 and there are 190. Each doubling roughly quadruples the count.
:::

::: context big-o-name Where the O comes from
The notation was introduced by the German mathematician Paul Bachmann in 1894 and made popular by Edmund Landau, which is why it is sometimes called Bachmann–Landau notation. The O stands for *Ordnung*, German for "order", as in "the order of growth". Computer scientists took it up in the 1970s to compare algorithms without tying the comparison to one machine.
:::

::: context hashing How a set finds things fast
A set does not search. When you add an item, Python computes a number from it called its **hash** and uses that number to pick a slot in a table, like a coat check that decides your hook number from your name. To ask "is this in the set?", Python computes the same hash and looks in that one slot. The time does not depend on how many items are stored, on average. Dictionaries work the same way, which is why a dict lookup by key is fast too.
:::

::: context log-log Straight lines on a log-log plot
If time grows like $n^k$, then $\log t = k \log n + \text{constant}$. Plot $\log t$ against $\log n$ and you get a straight line whose slope is $k$. Here are the two duplicate-check versions, using the times measured in this lesson. The quadratic line climbs twice as steeply as the linear one. (A **decade** on a log scale is a factor of ten.)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="175" x2="340" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="175" x2="40" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="175" x2="60" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="140" y1="175" x2="140" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="220" y1="175" x2="220" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="175" x2="300" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="192" font-size="11" text-anchor="middle" fill="#6c7a93">1e3</text>
  <text x="140" y="192" font-size="11" text-anchor="middle" fill="#6c7a93">1e4</text>
  <text x="220" y="192" font-size="11" text-anchor="middle" fill="#6c7a93">1e5</text>
  <text x="300" y="192" font-size="11" text-anchor="middle" fill="#6c7a93">1e6</text>
  <text x="190" y="206" font-size="12" text-anchor="middle" fill="#1f2a44">packets n (log scale)</text>
  <text x="24" y="95" font-size="12" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 24 95)">time (log scale)</text>
  <polyline points="60.0,117.5 84.1,69.9 108.2,21.6" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="60.0" cy="117.5" r="3.5" fill="#b4232c"/>
  <circle cx="84.1" cy="69.9" r="3.5" fill="#b4232c"/>
  <circle cx="108.2" cy="21.6" r="3.5" fill="#b4232c"/>
  <text x="118" y="26" font-size="12" fill="#b4232c">pairs: slope 2</text>
  <polyline points="220.0,156.2 244.1,132.0 268.2,107.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="220.0" cy="156.2" r="3.5" fill="#1d6fd1"/>
  <circle cx="244.1" cy="132.0" r="3.5" fill="#1d6fd1"/>
  <circle cx="268.2" cy="107.0" r="3.5" fill="#1d6fd1"/>
  <text x="278" y="112" font-size="12" fill="#1d6fd1">set: slope 1</text>
</svg>
```

Both axes use the same length, 80 px, per factor of ten, so the slopes can be read straight off the picture.
:::

::: context amortised Why appending to a list is cheap on average
A Python list keeps some spare room at its end. Most appends drop the item into that room, which is $O(1)$. When the room runs out, the list moves to a bigger block of memory, roughly one and an eighth times the size, and copies everything, which is $O(n)$. Because the block grows by a fixed fraction each time, those expensive moves become rarer as the list grows, and the total copying over $n$ appends stays proportional to $n$. Spread over all the appends, each one costs a constant amount. That averaging over a whole sequence of operations is what **amortised** means. `np.append` has no spare room, so it copies every time.
:::

::: context prefix-picture The odometer picture of a prefix sum
The running totals $c_k$ climb like an odometer. The sum of any window is the reading at its end minus the reading at its start, one subtraction however wide the window is. The bars here are the running totals from the lesson's example, $0, 3, 4, 8, 9, 14, 23, 25$, and the highlighted window sum is $c_6 - c_3 = 23 - 8 = 15$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="170" width="28" height="0" fill="#8fb8f0"/>
  <rect x="78" y="152" width="28" height="18" fill="#8fb8f0"/>
  <rect x="116" y="146" width="28" height="24" fill="#8fb8f0"/>
  <rect x="154" y="122" width="28" height="48" fill="#1d6fd1"/>
  <rect x="192" y="116" width="28" height="54" fill="#8fb8f0"/>
  <rect x="230" y="86" width="28" height="84" fill="#8fb8f0"/>
  <rect x="268" y="32" width="28" height="138" fill="#1d6fd1"/>
  <rect x="306" y="20" width="28" height="150" fill="#8fb8f0"/>
  <line x1="182" y1="122" x2="282" y2="122" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="262" y1="32" x2="262" y2="122" stroke="#b4232c" stroke-width="2"/>
  <text x="256" y="72" font-size="12" text-anchor="end" fill="#b4232c">15</text>
  <text x="54" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">c0</text>
  <text x="168" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">c3 = 8</text>
  <text x="282" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">c6 = 23</text>
  <text x="320" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">c7</text>
</svg>
```

Heights are to scale, 6 px per unit.
:::

::: context deque-name A queue with two doors
A **queue** is a line where people join at the back and leave from the front, like a checkout. A **stack** is the opposite, a pile where the last one on is the first one off, like plates. A double-ended queue allows both: you can join or leave at either end. The name was shortened to *deque*, and it is said like "deck", as in a deck of cards, where you can also take from the top or the bottom.
:::
