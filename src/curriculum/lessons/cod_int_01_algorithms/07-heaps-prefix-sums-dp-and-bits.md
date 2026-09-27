---
id: l07-heaps-prefix-sums-dp-and-bits
title: Heaps, prefix sums, light DP and bits
minutes: 26
covers:
  - Trees and BFS/DFS; graphs including topological sort; heaps; prefix sums; light dynamic programming; bit manipulation
  - 'What to skip: exotic dynamic programming, advanced graph theory, segment trees'
---

Think about a hospital emergency room. Patients do not get seen in the order they walked in. The nurse keeps asking one question: who is the most urgent person waiting right now? When a new patient arrives, they slot into the line by urgency. When a doctor is free, the most urgent patient goes next. Nobody sorts the whole waiting room every time the door opens.

Now think about a car's trip odometer. If it read 1,200 km when you left home and 1,530 km when you arrived, you know the trip was 330 km without adding up every little stretch of road. One subtraction does it.

This lesson is four small tools like those: the **heap**, which always knows the most urgent item; **prefix sums**, the odometer trick; **light dynamic programming**, which reuses answers to smaller problems; and **bit manipulation**, which packs yes/no flags into one number. Then comes the list of things you may skip. Last lesson covered trees and graphs; these four finish the high-yield patterns.

## Heaps: always know the smallest

A **heap** is a container that can always hand you its smallest item quickly, and lets you add or remove items quickly too. It does not keep everything sorted. It keeps just enough order that the smallest item is always at the front.

The trick is to picture the items as a **[[tree where every parent beats its children|heap-as-array]]**. In a **min-heap**, each parent is less than or equal to both of its children. So the root, at the top, is the smallest thing in the heap. The tree is stored in an ordinary list: the item at position $i$ has its children at positions $2i+1$ and $2i+2$.

- **Push** (add an item): put it at the end of the list, then swap it upward while it is smaller than its parent.
- **Pop** (remove the smallest): take the root, move the last item into the root's place, then swap it downward past its smaller child until the rule holds again.
- **Peek** (look at the smallest without removing it): read position 0.

Each swap moves one level up or down the tree, and a tree of $n$ items is only about $\log_2 n$ levels tall. Read $\log_2 n$ aloud as "log base two of n": the number of times you can halve $n$ before you reach 1. For a million items that is about 20. So push and pop cost $O(\log n)$ and peek costs $O(1)$.

::: key Heap costs
Push and pop are $O(\log n)$. Peek at the smallest is $O(1)$. Building a heap from a list of $n$ items in one go (heapify) is $O(n)$. A heap is not sorted; only the top is guaranteed.
:::

### heapq in Python, priority_queue in C++

Python's `heapq` module turns a plain list into a min-heap:

```python
# int01_l07_heaps.py (part 1)
import heapq

h = []
for x in [7, 2, 9, 4, 1]:
    heapq.heappush(h, x)
print("heap list:", h)
print("smallest:", h[0])
print("pop order:", [heapq.heappop(h) for _ in range(5)])
```

```bash
python3 int01_l07_heaps.py
# heap list: [1, 2, 9, 7, 4]
# smallest: 1
# pop order: [1, 2, 4, 7, 9]
```

The list `[1, 2, 9, 7, 4]` is not sorted; only the front is guaranteed. Popping everything does come out in order.

`heapq` only makes min-heaps. When you need the largest item on top, push the negative of each number, and flip the sign back when you pop. In C++, `std::priority_queue` is the other way round: it is a **max-heap** by default, and you ask for a min-heap with `std::priority_queue<int, std::vector<int>, std::greater<int>>`.

::: warning Mixing up which way the heap faces
Python's `heapq` puts the smallest on top. C++'s `std::priority_queue` puts the largest on top. Getting this backwards gives a program that runs fine and returns the wrong end of the data. Say which kind of heap you are building out loud, and check it with a three-item example before you trust it.
:::

### Top-k: keep a small heap of the best so far

A classic ask: out of a long stream of readings, return the $k$ largest. You could sort everything, which costs $O(n \log n)$. The heap trick is cheaper when $k$ is small.

Keep a min-heap holding at most $k$ items: the best $k$ seen so far. Its top is the *weakest* of those best. For each new reading, if it beats the top, replace the top with it. At the end, the heap holds the $k$ largest.

```python
# int01_l07_heaps.py (part 2)
def top_k(values, k):
    """Largest k values, biggest first. O(n log k) time, O(k) space."""
    if k <= 0:
        return []
    heap = []                       # min-heap holding the k best so far
    for v in values:
        if len(heap) < k:
            heapq.heappush(heap, v)
        elif v > heap[0]:           # beats the weakest of the k best
            heapq.heapreplace(heap, v)
    return sorted(heap, reverse=True)

peaks = [0.8, 3.1, 1.2, 4.7, 2.2, 5.0, 0.4, 3.9]   # vibration peaks, in g
print("top 3:", top_k(peaks, 3))
print("check:", heapq.nlargest(3, peaks))
```

```bash
# top 3: [5.0, 4.7, 3.9]
# check: [5.0, 4.7, 3.9]
```

A *min*-heap to find the *largest* values may feel backwards. But the item you throw out each time is the smallest of your current best, so that is the one you want on top.

::: example How much does the small heap save?
A vibration test logs $n = 1{,}000{,}000$ peak readings and you want the top $k = 10$.

**Sorting everything:** about $n \log_2 n$ steps. $\log_2 1{,}000{,}000 \approx 19.9$, so about $1{,}000{,}000 \times 19.9 \approx 2 \times 10^7$ steps.

**The size-10 heap:** each reading costs at most one push or replace on a heap of 10 items, about $\log_2 10 \approx 3.3$ steps. So about $1{,}000{,}000 \times 3.3 \approx 3.3 \times 10^6$ steps.

The heap does about six times less work, and it needs memory for only 10 numbers instead of a sorted copy of a million. Say it as: "$O(n \log k)$ time and $O(k)$ space."

Sanity check: if $k$ grew to equal $n$, the heap would cost $O(n \log n)$, the same as sorting. That makes sense: keeping "the top $n$" is sorting.
:::

### Merging sorted streams

Three sensors each send timestamps in increasing order, and you need one combined timeline. At every moment, the next item overall is the smallest of the three streams' current fronts. That is exactly what a heap answers.

Put one `(value, stream number, position)` entry per stream into a heap. Pop the smallest, write it out, and push the next item from the same stream.

```python
# int01_l07_heaps.py (part 3)
def merge_streams(streams):
    """Merge sorted lists into one sorted list. O(N log k) time."""
    heap = [(s[0], i, 0) for i, s in enumerate(streams) if s]
    heapq.heapify(heap)
    out = []
    while heap:
        value, i, j = heapq.heappop(heap)
        out.append(value)
        if j + 1 < len(streams[i]):
            heapq.heappush(heap, (streams[i][j + 1], i, j + 1))
    return out

imu  = [0, 10, 20, 30]      # timestamps in ms
gps  = [5, 105]
star = [12, 25]
print("merged:", merge_streams([imu, gps, star]))
print("check: ", list(heapq.merge(imu, gps, star)))
```

```bash
# merged: [0, 5, 10, 12, 20, 25, 30, 105]
# check:  [0, 5, 10, 12, 20, 25, 30, 105]
```

With $k$ streams and $N$ items in total, each item is pushed and popped once on a heap of at most $k$ entries. That is $O(N \log k)$ time and $O(k)$ extra space. The `if s` skips empty streams, and the stream number `i` breaks ties when two timestamps are equal. Python's own `heapq.merge` does the same job; in the room, be ready to write it yourself.

Heaps come back in lesson 12, where **[[two heaps together|two-heaps-bridge]]** keep the median of a stream up to date.

## Prefix sums: the odometer trick

Suppose you will be asked, again and again, "what is the total from position $l$ up to position $r$?" Adding the slice each time costs up to $n$ steps per question. That is slow for many questions on a long list.

The fix is the odometer. Walk through the list once and write down the running total. Call it $P$, the **prefix sum** array:

$$
P_0 = 0, \qquad P_{i+1} = P_i + x_i .
$$

Read $P_i$ as "P sub i": the total of the first $i$ items, $x_0$ through $x_{i-1}$. Then the total of any slice is one subtraction:

$$
x_l + x_{l+1} + \dots + x_{r-1} = P_r - P_l .
$$

That is the trip odometer: reading at the end minus reading at the start. Building $P$ costs $O(n)$ time and $O(n)$ space once. After that, each range sum costs $O(1)$.

::: note Why the subtraction works
$P_r$ is $x_0 + x_1 + \dots + x_{r-1}$. $P_l$ is $x_0 + x_1 + \dots + x_{l-1}$. Everything in $P_l$ also appears in $P_r$, so subtracting cancels $x_0$ through $x_{l-1}$ and leaves exactly $x_l$ through $x_{r-1}$. Starting $P$ with a zero is what makes this work even when $l = 0$: the slice from the very start is $P_r - P_0 = P_r$.
:::

::: warning Off by one, every time
With $P_0 = 0$, the sum of items $l$ through $r-1$ is $P_r - P_l$. If you want items $l$ through $r$ *including* $r$, it is $P_{r+1} - P_l$. Most prefix-sum bugs are this. Decide on a half-open range, "start included, end excluded", the same way Python slices work, and test it on a two-item list by hand.
:::

### Telemetry energy over a window

A power sensor reports watts at a fixed rate. Energy is power times time, so over one sample interval $\Delta t$ (read "delta t", the time between samples) the energy is about $p_i \, \Delta t$. The energy over a window of samples is the **[[sum of the samples times the interval|rectangle-sum]]**:

$$
E \approx \Delta t \sum_{i=l}^{r-1} p_i = \Delta t \,(P_r - P_l).
$$

Watts times seconds gives joules.

::: example A heater burst
A spacecraft bus reports power every $\Delta t = 0.5\,\mathrm{s}$:

$$
p = [120,\ 150,\ 400,\ 410,\ 395,\ 160,\ 130,\ 125]\ \mathrm{W}.
$$

A heater switched on for samples 2, 3 and 4. How much energy did the bus use during those three samples?

**Build the prefix sums** by adding one sample at a time: $P_0 = 0$, $P_1 = 120$, $P_2 = 270$, $P_3 = 670$, $P_4 = 1080$, $P_5 = 1475$, $P_6 = 1635$, $P_7 = 1765$, $P_8 = 1890$.

**Subtract.** Samples 2 through 4 are the half-open range $[2, 5)$, so the sum is $P_5 - P_2 = 1475 - 270 = 1205$.

**Multiply by the interval.** $E \approx 1205 \times 0.5 = 602.5\,\mathrm{J}$.

Sanity check: adding directly, $400 + 410 + 395 = 1205$, the same. Each sample is about 400 W for half a second, which is about 200 J, and three of them is about 600 J. The whole record is $1890 \times 0.5 = 945\,\mathrm{J}$, and the burst is well over half of it, which fits: the heater samples are the big ones.
:::

The same code in Python:

```python
# int01_l07_prefix.py -- prefix sums for window energy
power = [120, 150, 400, 410, 395, 160, 130, 125]   # watts, one sample every 0.5 s
dt = 0.5                                           # seconds per sample

P = [0]
for p in power:
    P.append(P[-1] + p)                            # P[i] = sum of power[0:i]
print("P =", P)

def window_sum(P, l, r):
    """Sum of samples l .. r-1, in O(1)."""
    return P[r] - P[l]

s = window_sum(P, 2, 5)                            # samples 2, 3, 4: the heater burst
print("sum of samples 2..4:", s)
print("energy:", s * dt, "J")
print("check:", sum(power[2:5]) * dt, "J")
print("total energy:", P[-1] * dt, "J")
```

```bash
python3 int01_l07_prefix.py
# P = [0, 120, 270, 670, 1080, 1475, 1635, 1765, 1890]
# sum of samples 2..4: 1205
# energy: 602.5 J
# check: 602.5 J
# total energy: 945.0 J
```

In NumPy the same array is `np.concatenate(([0], np.cumsum(power)))`. Prefix sums also count: let $x_i$ be 1 when a reading is out of limits and 0 otherwise, and $P_r - P_l$ counts the bad readings in a window.

## Light dynamic programming

**Dynamic programming**, or DP, means this: solve a big problem by writing its answer in terms of answers to smaller versions of the same problem, and store each small answer so you never compute it twice. The "light" part is what medium problems ask for: one list of answers, filled in with one short rule.

### Climbing stairs

You climb a staircase of $n$ steps, taking either 1 or 2 steps at a time. How many different ways are there to reach the top?

Think about your *last* move. You arrived at step $n$ either from step $n-1$ (a single step) or from step $n-2$ (a double step). Every route to the top is one of those two kinds, and no route is both. So:

$$
W(n) = W(n-1) + W(n-2), \qquad W(0) = 1,\ W(1) = 1.
$$

Read $W(n)$ as "W of n", the number of ways to reach step $n$. $W(0) = 1$ says there is one way to stand at the bottom: do nothing. That rule gives $1, 2, 3, 5, 8, 13, 21, 34, \dots$ for $n = 1, 2, 3, \dots$ — the **[[Fibonacci numbers|fibonacci]]**.

Written straight from the rule, the recursive function is correct and terribly slow. $W(10)$ calls $W(9)$ and $W(8)$; $W(9)$ calls $W(8)$ again; and the repeats multiply until the number of calls grows exponentially with $n$. DP fixes that in one of two ways.

- **Memo** (top-down): keep the recursion, but remember each answer the first time you compute it. This is **[[memoization|memoization]]**. In Python, the decorator `@lru_cache` does it for you.
- **Table** (bottom-up): forget recursion. Fill in $W(0), W(1), W(2), \dots$ in order with a loop. Each entry needs only the two before it.

```python
# int01_l07_dp.py (part 1)
from functools import lru_cache

@lru_cache(maxsize=None)
def ways_memo(n):
    """Ways to climb n steps taking 1 or 2 at a time (top-down)."""
    if n <= 1:
        return 1
    return ways_memo(n - 1) + ways_memo(n - 2)

def ways_table(n):
    """Same answer, bottom-up, O(n) time and O(1) space."""
    a, b = 1, 1                  # ways(0), ways(1)
    for _ in range(n - 1):
        a, b = b, a + b
    return b

print([ways_table(n) for n in range(1, 9)])
print(ways_memo(10), ways_table(10))
```

```bash
python3 int01_l07_dp.py
# [1, 2, 3, 5, 8, 13, 21, 34]
# 89 89
```

Both are $O(n)$ time. The memo version uses $O(n)$ space for the stored answers *and* $O(n)$ deep recursion. The table version keeps only the last two values, so it is $O(1)$ space.

::: warning Deep recursion in Python
Python stops a recursion about 1,000 calls deep by default and raises `RecursionError`. So `ways_memo(5000)` crashes while `ways_table(5000)` is fine. In an interview, a memo version is a fine first draft. Then say: "I would turn this into a table to avoid the recursion limit and drop the space to constant."
:::

### Coin change: fewest pieces

Given coin sizes and a target amount, what is the fewest coins that add up to exactly the amount? The same shape of thinking works. Let $B(a)$ be the fewest coins for amount $a$. Whatever the best answer for $a$ is, it has some last coin $c$. Take it away and what is left must be a best answer for $a - c$. So:

$$
B(0) = 0, \qquad B(a) = 1 + \min_{c \,\le\, a} B(a - c).
$$

Read the $\min$ as "the smallest, over every coin $c$ no bigger than $a$". If no coin fits for some amount, that amount is impossible.

::: example Why greedy fails with coins 1, 3 and 4
Make 6 with coins of size 1, 3 and 4.

**The [[greedy|greedy]] way** takes the biggest coin that fits each time: $4$, leaving 2; then $1$ and $1$. That is 3 coins.

**The table way** fills $B(a)$ for $a = 0$ to $6$:

- $B(0) = 0$.
- $B(1) = 1 + B(0) = 1$.
- $B(2) = 1 + B(1) = 2$ (only coin 1 fits).
- $B(3) = 1 + \min(B(2), B(0)) = 1 + 0 = 1$.
- $B(4) = 1 + \min(B(3), B(1), B(0)) = 1 + 0 = 1$.
- $B(5) = 1 + \min(B(4), B(2), B(1)) = 1 + 1 = 2$.
- $B(6) = 1 + \min(B(5), B(3), B(2)) = 1 + 1 = 2$.

So the best is 2 coins: $3 + 3$. Greedy was wrong by one coin.

Sanity check: you cannot make 6 with one coin, since no coin is 6, so 2 really is the least. The table filled 6 entries, each trying 3 coins: that is $O(A \cdot c)$ time for amount $A$ and $c$ coin sizes, and $O(A)$ space.
:::

```python
# int01_l07_dp.py (part 2)
def min_coins(coins, amount):
    """Fewest coins summing to amount, or -1. O(amount * len(coins))."""
    INF = float("inf")
    best = [0] + [INF] * amount          # best[a] = fewest coins for a
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and best[a - c] + 1 < best[a]:
                best[a] = best[a - c] + 1
    return best[amount] if best[amount] != INF else -1

def greedy_coins(coins, amount):
    count = 0
    for c in sorted(coins, reverse=True):
        count += amount // c
        amount %= c
    return count if amount == 0 else -1

print("dp:", min_coins([1, 3, 4], 6), " greedy:", greedy_coins([1, 3, 4], 6))
print("impossible:", min_coins([5, 10], 7))
```

```bash
# dp: 2  greedy: 3
# impossible: -1
```

The recipe for light DP is always the same four questions, and saying them aloud is most of the answer. What does one entry mean? What is the rule linking it to smaller entries? What are the starting entries? In what order do I fill the table?

## Bit manipulation

A light switch is on or off. A spacecraft has dozens of such switches to report: heater on, GPS locked, safe mode, battery low. Rather than a whole byte each, telemetry packs eight yes/no flags into one byte, one flag per **bit**. A number used this way is a **[[status word|status-word]]**.

Number the bits from the right, starting at 0. Bit $k$ is worth $2^k$. The number with only bit $k$ set is written `1 << k`: read `<<` as "shifted left by". A number whose bits pick out the ones you care about is a **mask**.

The five moves, the same in Python and C++:

- **Set bit k:** `x | (1 << k)`. OR forces that bit to 1 and leaves the others alone.
- **Clear bit k:** `x & ~(1 << k)`. AND with a mask that is 0 only at bit k.
- **Toggle bit k:** `x ^ (1 << k)`. XOR flips that bit.
- **Test bit k:** `(x >> k) & 1`. Slide bit k to the right end, then keep only it. Read `>>` as "shifted right by".
- **Clear the lowest set bit:** `x & (x - 1)`. More on this one below.

Here `|` is bitwise OR, `&` is bitwise AND, `^` is bitwise XOR ("exclusive or": 1 when the two bits differ) and `~` is NOT (flip every bit).

::: example Updating a status byte
A status byte starts as `00000011`: bit 0 (heater on) and bit 1 (GPS lock) are set.

1. Battery goes low: set bit 7. OR with `10000000` gives `10000011`.
2. Heater turns off: clear bit 0. AND with `11111110` gives `10000010`.
3. Safe mode toggles: XOR with `00000100` gives `10000110`.
4. Is GPS locked? Shift right by 1 to get `1000011`, AND with 1, and the answer is 1: yes.
5. How many flags are set? Count the ones in `10000110`: three.

Sanity check: we set one flag (7), cleared one (0) and switched one on (2), starting from two set flags. $2 + 1 - 1 + 1 = 3$. It matches.
:::

```python
# int01_l07_bits.py -- flags in a status byte
HEATER_ON  = 1 << 0   # bit 0
GPS_LOCK   = 1 << 1   # bit 1
SAFE_MODE  = 1 << 2   # bit 2
BATT_LOW   = 1 << 7   # bit 7

status = 0b0000_0011                      # heater on, GPS locked
print(f"start     {status:08b}")
status |= BATT_LOW                        # set bit 7
print(f"set 7     {status:08b}")
status &= ~HEATER_ON & 0xFF               # clear bit 0, keep 8 bits
print(f"clear 0   {status:08b}")
status ^= SAFE_MODE                       # toggle bit 2
print(f"toggle 2  {status:08b}")
print("GPS lock?", (status >> 1) & 1, "  safe mode?", bool(status & SAFE_MODE))
print("flags set:", bin(status).count("1"), status.bit_count())
```

```bash
python3 int01_l07_bits.py
# start     00000011
# set 7     10000011
# clear 0   10000010
# toggle 2  10000110
# GPS lock? 1   safe mode? True
# flags set: 3 3
```

The `& 0xFF` after the NOT is there because Python integers have no fixed width, so **[[~ gives a negative number|python-not]]**; the mask trims the result back to 8 bits.

### Popcount and the x & (x - 1) trick

Counting the set bits is called **popcount** (population count). Python 3.10 and later has `x.bit_count()`; `bin(x).count("1")` works everywhere; C++20 has `std::popcount`.

The expression `x & (x - 1)` is worth understanding, because it turns up again and again. Subtracting 1 from a binary number turns the lowest 1 into a 0 and every 0 to its right into a 1. Everything to the left stays the same. AND the two together, and the lowest 1 is gone while everything else is unchanged:

```python
# int01_l07_bits.py (part 2)
x = 0b1011_0100
print(f"x         {x:08b}")
print(f"x - 1     {x - 1:08b}")
print(f"x & (x-1) {x & (x - 1):08b}")

def popcount(x):
    """Count set bits by clearing the lowest one each pass."""
    n = 0
    while x:
        x &= x - 1
        n += 1
    return n

def is_power_of_two(x):
    return x > 0 and x & (x - 1) == 0

print(popcount(x), [n for n in range(1, 70) if is_power_of_two(n)])
```

```bash
# x         10110100
# x - 1     10110011
# x & (x-1) 10110000
# 4 [1, 2, 4, 8, 16, 32, 64]
```

Two uses follow. The loop above counts set bits in one pass per 1, not one per bit. And a power of two has exactly one bit set, so `x & (x - 1)` is zero for it.

::: key Bit tricks to know cold
Set with `x | (1 << k)`, clear with `x & ~(1 << k)`, toggle with `x ^ (1 << k)`, test with `(x >> k) & 1`. `x & (x - 1)` clears the lowest set bit; `x > 0 and x & (x - 1) == 0` tests for a power of two. Popcount is the number of set bits.
:::

Lesson 9 puts these to work on real bytes: assembling numbers from a packet and computing checksums.

## What to skip

These topics are real, and some are beautiful, but a medium bar with real-world framing does not test them:

- **Exotic dynamic programming:** DP over subsets using bitmasks, DP on trees with several states, "digit DP", and anything whose table has three or more dimensions.
- **Advanced graph theory:** maximum flow, strongly connected components, minimum-cost matching, and shortest paths with unusual constraints.
- **[[Segment trees|segment-trees]]** and their cousins such as Fenwick trees: structures for range queries on data that keeps changing.
- **Heavy competitive programming:** number-theory tricks, hard geometry, and problems built to be solved only by people who have seen that exact trick.

::: key What you can safely skip
Exotic dynamic programming, advanced graph theory, segment trees and heavy competitive-programming material. They are not what a medium-level, real-world-flavoured bar tests.
:::

If a practice problem needs one of these, log it as "skipped on purpose" and move on. The hours are better spent on the patterns in lessons 3 to 7 and the engineering variants in lessons 9 to 12.

::: warning Skipping is not the same as refusing
If an interviewer does ask for something on this list, do not freeze or say "I didn't study that". Say what you do know: a brute-force version, its complexity, and where you think the speed-up lives. A clear slow answer with honest complexity is worth far more than silence.
:::

## Check yourself

::: check
You have a list of 50,000 thruster-firing durations and need the 5 longest. Describe the approach with a heap, which kind of heap you use in Python, and its time and space complexity.
:::

::: answer
Keep a min-heap of at most 5 items, the 5 longest seen so far. For each duration: if the heap has fewer than 5 items, push it; otherwise, if it is longer than the heap's top (the shortest of the current best 5), replace the top with it. At the end the heap holds the 5 longest; sort those 5 if you want them in order. In Python this is `heapq`, which is a min-heap, and that is the right kind: the item you throw out each time is the smallest of the best. Time is $O(n \log k)$, about $50{,}000 \times \log_2 5 \approx 116{,}000$ steps. Space is $O(k)$, just 5 numbers.
:::

::: check
The prefix sums of a list are $P = [0, 4, 9, 11, 18, 20]$. What is the sum of items 1 through 3 (inclusive), and what was the original list?
:::

::: answer
Items 1 through 3 inclusive are the half-open range $[1, 4)$, so the sum is $P_4 - P_1 = 18 - 4 = 14$. The original list is the differences of neighbors: $4 - 0 = 4$, $9 - 4 = 5$, $11 - 9 = 2$, $18 - 11 = 7$, $20 - 18 = 2$. So $x = [4, 5, 2, 7, 2]$. Check: $x_1 + x_2 + x_3 = 5 + 2 + 7 = 14$. It matches.
:::

::: check
Now the staircase allows steps of 1, 2 or 3. Write the rule for $W(n)$ and find $W(5)$.
:::

::: answer
Your last move came from step $n-1$, $n-2$ or $n-3$, so $W(n) = W(n-1) + W(n-2) + W(n-3)$, with $W(0) = 1$ and $W$ of a negative number equal to 0. Fill the table: $W(1) = 1$; $W(2) = W(1) + W(0) = 2$; $W(3) = 2 + 1 + 1 = 4$; $W(4) = 4 + 2 + 1 = 7$; $W(5) = 7 + 4 + 2 = 13$. There are 13 ways. The table version keeps only the last three values, so it is $O(n)$ time and $O(1)$ space.
:::

::: check
A status byte reads `0b01101000`. Using only the tricks from this lesson, (a) is bit 3 set, (b) what is the byte after clearing its lowest set bit, and (c) is it a power of two?
:::

::: answer
(a) Shift right by 3: `0b01101`, then AND with 1 gives 1. Yes, bit 3 is set. (b) The lowest set bit is bit 3. `x - 1` is `0b01100111`, and `x & (x - 1)` is `0b01100000`, which is 96 (the original was 104). (c) No: the result of `x & (x - 1)` is not zero, because the byte has three bits set, not one.
:::

::: check
Why do both the memo version and the table version of climbing stairs run in $O(n)$ time, when the plain recursive version does not? Which would you hand in, and why?
:::

::: answer
The plain recursion recomputes the same smaller answers over and over: $W(8)$ is computed once for $W(10)$ and again inside $W(9)$, and the repeats multiply, so the calls grow exponentially. The memo version computes each $W(k)$ once and looks it up afterwards, and the table version fills each entry once in a loop, so both do $n$ pieces of work. Hand in the table version: it uses $O(1)$ space instead of $O(n)$, and it cannot hit Python's recursion limit of about 1,000 calls.
:::

## Summary

| Tool | What it does | Cost |
| --- | --- | --- |
| min-heap (heapq) | smallest item always on top | push and pop $O(\log n)$, peek $O(1)$, heapify $O(n)$ |
| std::priority_queue | largest on top by default | same costs |
| top-k | min-heap of size k, replace the top when beaten | $O(n \log k)$ time, $O(k)$ space |
| merge k sorted streams | heap of each stream's front | $O(N \log k)$ time, $O(k)$ space |
| prefix sums | $P_0 = 0$, $P_{i+1} = P_i + x_i$; slice sum $P_r - P_l$ | build $O(n)$, query $O(1)$ |
| window energy | $E \approx \Delta t\,(P_r - P_l)$ | joules from watts and seconds |
| light DP | an entry, a rule, starting entries, a fill order | memo or table; the table saves space |
| bits | set, clear, toggle, test; $x \,\&\, (x-1)$ | $O(1)$ each |
| what to skip | exotic DP, advanced graphs, segment trees, heavy competitive programming | zero hours |

That completes the high-yield patterns. Next lesson is about the part of the round that is not code at all: what to say before you type, and how to test your own solution before you say you are done.

::: context heap-as-array A tree hiding in a list
A heap is drawn as a tree, but no tree objects are ever made. The items sit in a plain list, and positions do the linking: the children of position $i$ are at $2i+1$ and $2i+2$, and its parent is at $(i-1)//2$. Here is the heap from the lesson, the list `[1, 2, 9, 7, 4]`. Every parent is no bigger than its children, so 1 is on top, but the list is not sorted: 9 comes before 7 and 4.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="120" y1="30" x2="70" y2="75"/>
    <line x1="120" y1="30" x2="170" y2="75"/>
    <line x1="70" y1="75" x2="40" y2="120"/>
    <line x1="70" y1="75" x2="100" y2="120"/>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44">
    <circle cx="120" cy="30" r="15" fill="#1d6fd1"/>
    <circle cx="70" cy="75" r="15"/>
    <circle cx="170" cy="75" r="15"/>
    <circle cx="40" cy="120" r="15"/>
    <circle cx="100" cy="120" r="15"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="120" y="35" fill="#ffffff">1</text>
    <text x="70" y="80">2</text>
    <text x="170" y="80">9</text>
    <text x="40" y="125">7</text>
    <text x="100" y="125">4</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="146" y="22">[0]</text>
    <text x="44" y="72">[1]</text>
    <text x="196" y="72">[2]</text>
    <text x="40" y="150">[3]</text>
    <text x="100" y="150">[4]</text>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle" stroke="#1f2a44">
    <rect x="230" y="60" width="24" height="24" fill="#1d6fd1"/>
    <rect x="254" y="60" width="24" height="24" fill="#ffffff"/>
    <rect x="278" y="60" width="24" height="24" fill="#ffffff"/>
    <rect x="302" y="60" width="24" height="24" fill="#ffffff"/>
    <rect x="326" y="60" width="24" height="24" fill="#ffffff"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="242" y="77" fill="#ffffff">1</text>
    <text x="266" y="77">2</text>
    <text x="290" y="77">9</text>
    <text x="314" y="77">7</text>
    <text x="338" y="77">4</text>
    <text x="290" y="110" font-size="11" fill="#6c7a93">the same heap as a list</text>
  </g>
</svg>
```
:::

::: context two-heaps-bridge Where heaps come back
Lesson 12 builds a running median over a stream of sensor readings. The standard approach splits the numbers into a lower half kept in a max-heap and an upper half kept in a min-heap, rebalanced so their sizes differ by at most one. Then the median is the top of one heap, or the average of both tops. Each new reading costs $O(\log n)$. Everything in this lesson — push, pop, peek, and negating numbers to make `heapq` act as a max-heap — is what that exercise needs.
:::

::: context rectangle-sum Energy as a stack of thin rectangles
Energy is the area under the power-versus-time curve. With samples every $\Delta t$ seconds, each sample stands for a thin rectangle $p_i$ tall and $\Delta t$ wide, and adding the rectangles approximates the area. This is the simplest form of numerical integration, sometimes called a Riemann sum. With samples taken fast compared with how quickly the power changes, it is close to the truth. The prefix sum is the same stack of rectangles added up once, so any window's area costs one subtraction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="350" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="20" x2="30" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44">
    <rect x="30" y="106" width="40" height="24" fill="#8fb8f0"/>
    <rect x="70" y="100" width="40" height="30" fill="#8fb8f0"/>
    <rect x="110" y="50" width="40" height="80" fill="#f2b880"/>
    <rect x="150" y="48" width="40" height="82" fill="#f2b880"/>
    <rect x="190" y="51" width="40" height="79" fill="#f2b880"/>
    <rect x="230" y="98" width="40" height="32" fill="#8fb8f0"/>
    <rect x="270" y="104" width="40" height="26" fill="#8fb8f0"/>
    <rect x="310" y="105" width="40" height="25" fill="#8fb8f0"/>
  </g>
  <text x="170" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">heater burst: 602.5 J</text>
  <text x="190" y="150" font-size="11" fill="#1f2a44" text-anchor="middle">time, 0.5 s per sample</text>
  <text x="14" y="80" font-size="11" fill="#1f2a44" text-anchor="middle" transform="rotate(-90 14 80)">watts</text>
</svg>
```

Bar heights are to scale: 400 W is 80 units tall.
:::

::: context fibonacci Rabbits and staircases
The sequence 1, 1, 2, 3, 5, 8, 13, … where each number is the sum of the two before it is named after Leonardo of Pisa, called Fibonacci, whose 1202 book *Liber Abaci* used it in a puzzle about breeding rabbits. The numbers had been studied in India centuries earlier, in counting the rhythms of poetry made of short and long syllables — which is the staircase problem in disguise, with a short syllable as a 1-step and a long one as a 2-step.
:::

::: context memoization A note to self
"Memoization" is not a typo for memorization. It comes from "memo", a note you write to remind yourself, and the term was coined by the British researcher Donald Michie in 1968. The function keeps a little notebook: before doing any work, it checks whether it has answered this exact question before. Python's `functools.lru_cache` is that notebook; "LRU" means "least recently used", the rule it follows for throwing old notes away when a size limit is set. With `maxsize=None` it never throws any away.
:::

::: context greedy When taking the biggest piece works
A greedy method makes the choice that looks best right now and never reconsiders. For US coins (1, 5, 10, 25 cents) greedy change-making happens to always give the fewest coins, which is why cashiers do it without thinking. Coin sets with that property are called canonical. The set 1, 3, 4 is not canonical, as the example shows. In an interview, if you propose a greedy answer, be ready to explain why it is always right — or to find the small counterexample that shows it is not and switch to DP.
:::

::: context status-word Bits in real telemetry
Spacecraft telemetry is full of packed status words. A single byte or 16-bit word might report which heaters are on, whether each reaction wheel is enabled, whether a sensor is valid, and which mode the vehicle is in. Ground software masks and shifts each bit out to light up the right indicator on a console. Packing flags this way saves downlink bandwidth, which is always scarce, and it is why bit manipulation shows up in flight-software interviews more than in general ones.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" font-size="13" text-anchor="middle">
    <rect x="20" y="30" width="40" height="30" fill="#1d6fd1"/>
    <rect x="60" y="30" width="40" height="30" fill="#ffffff"/>
    <rect x="100" y="30" width="40" height="30" fill="#ffffff"/>
    <rect x="140" y="30" width="40" height="30" fill="#ffffff"/>
    <rect x="180" y="30" width="40" height="30" fill="#ffffff"/>
    <rect x="220" y="30" width="40" height="30" fill="#1d6fd1"/>
    <rect x="260" y="30" width="40" height="30" fill="#1d6fd1"/>
    <rect x="300" y="30" width="40" height="30" fill="#ffffff"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="50" fill="#ffffff">1</text><text x="80" y="50">0</text><text x="120" y="50">0</text><text x="160" y="50">0</text>
    <text x="200" y="50">0</text><text x="240" y="50" fill="#ffffff">1</text><text x="280" y="50" fill="#ffffff">1</text><text x="320" y="50">0</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="40" y="22">bit 7</text><text x="240" y="22">bit 2</text><text x="280" y="22">bit 1</text><text x="320" y="22">bit 0</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="80">battery</text><text x="40" y="94">low</text>
    <text x="240" y="80">safe</text><text x="240" y="94">mode</text>
    <text x="280" y="80">GPS</text><text x="280" y="94">lock</text>
    <text x="320" y="80">heater</text><text x="320" y="94">off</text>
  </g>
</svg>
```

The byte `10000110` from the example, one flag per bit.
:::

::: context python-not Why ~ goes negative in Python
C++ integers have a fixed width, so `~` on a `uint8_t` value flips exactly 8 bits. Python integers can grow as large as needed, and they behave as if a negative number had infinitely many 1 bits on the left (this is two's complement, carried on forever). So `~1` in Python is `-2`, not `254`. ANDing with `0xFF` keeps only the lowest 8 bits and gives back `0b11111110`, which is 254. Whenever you flip bits in Python and want a fixed-width answer, finish with the mask for that width: `0xFF` for 8 bits, `0xFFFF` for 16.
:::

::: context segment-trees What a segment tree is for
Prefix sums answer "sum from $l$ to $r$" in $O(1)$, but if one value changes, every later prefix sum changes too, costing $O(n)$ to fix. A segment tree stores sums of halves, quarters, eighths and so on, so both a change and a range query cost $O(\log n)$. It is a real tool, used in databases and graphics, but writing one correctly under time pressure is a competitive-programming skill. A medium, real-world-flavored screen almost never needs it; if the data does not change, prefix sums are enough.
:::
