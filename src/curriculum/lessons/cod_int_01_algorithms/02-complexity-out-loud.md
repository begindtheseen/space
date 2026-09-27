---
id: l02-complexity-out-loud
title: Complexity you can say out loud
minutes: 25
covers:
  - Complexity analysis you can say out loud, including the space term
---

Imagine you need to find the word "orbit" in a paper dictionary. One way is to start at page 1 and read every word until you hit it. Another way is to open the book in the middle, see that you landed on "M", flip halfway into the second half, and keep halving. Both ways work. But if the dictionary doubles in size, the first way takes twice as long, and the second way takes one extra flip.

That difference — how the work *grows* when the input grows — is what programmers mean by **complexity**: a description of how the time or memory an algorithm needs grows with the size of its input. It is not about seconds on one laptop. It is about the shape of the growth.

In the interview, you are expected to state the complexity of every solution, time *and* memory, without being asked. On a real vehicle it matters even more. A flight computer has a fixed time budget for each control step and a fixed amount of memory. An algorithm whose cost explodes when a telemetry buffer gets long can miss a deadline in flight. This lesson teaches you to work out complexity by counting, and then to say it in one clear sentence.

## Counting steps instead of seconds

Seconds depend on the machine, the language and what else is running. So instead we count **steps**: simple actions that take about the same fixed time each, like comparing two numbers, adding, or reading one element of a list.

We call the size of the input $n$. For a list, $n$ is how many elements it has. For a string, it is how many characters.

Here is one question answered three ways: *does this list contain any value twice?*

```python
# int01_l02_dups.py -- one question, three answers, three costs
def has_dup_pairs(xs):
    # every pair once: n(n-1)/2 comparisons -> O(n^2) time, O(1) extra space
    n = len(xs)
    for i in range(n):
        for j in range(i + 1, n):
            if xs[i] == xs[j]:
                return True
    return False

def has_dup_sorted(xs):
    # sort a copy, then compare neighbours -> O(n log n) time, O(n) extra space
    s = sorted(xs)
    return any(s[k] == s[k + 1] for k in range(len(s) - 1))

def has_dup_set(xs):
    # remember what we have seen -> O(n) time, O(n) extra space
    seen = set()
    for x in xs:
        if x in seen:
            return True
        seen.add(x)
    return False

tests = [([], False), ([7], False), ([3, 1, 3], True), ([5, 4, 3, 2, 1], False)]
for f in (has_dup_pairs, has_dup_sorted, has_dup_set):
    for xs, want in tests:
        assert f(xs) == want, (f.__name__, xs)
print("all 12 tests pass")

n = 10**6
print(f"pairs to compare at n = {n}: {n * (n - 1) // 2}")
# all 12 tests pass
# pairs to compare at n = 1000000: 499999500000
```

Count the first version. The outer loop picks each element in turn. The inner loop compares it with every element *after* it. The first element is compared with $n - 1$ others, the second with $n - 2$, and so on down to 0. Add those up and you get

$$
(n-1) + (n-2) + \dots + 1 + 0 = \frac{n(n-1)}{2}.
$$

The third version walks the list once. For each element it does one lookup in a **[[set|hash-set]]** — a container that answers "have I seen this?" in about the same time no matter how full it is — and one insert. That is about $2n$ steps.

The middle version sorts first. Sorting a list takes about $n \log_2 n$ steps (lesson 5 comes back to sorting), then one pass compares neighbors.

::: example How long would each one take on a million readings?
A plain Python loop does one simple step in roughly 50 nanoseconds on a laptop (a nanosecond is a billionth of a second). Say the list holds $n = 10^6$ sensor readings.

**Pairs.** $\frac{n(n-1)}{2} = \frac{10^6 \times 999\,999}{2} = 499\,999\,500\,000$ comparisons, about $5 \times 10^{11}$. At $50 \times 10^{-9}$ s each: $5 \times 10^{11} \times 50 \times 10^{-9} \approx 25\,000$ s. Divide by 3600 s per hour: about **6.9 hours**.

**Set.** About $10^6$ passes. $10^6 \times 50 \times 10^{-9} = 0.05$ s, or **50 milliseconds**.

Same answer, same computer. One takes most of a working day, the other finishes before you can blink. Sanity check: the ratio is $25\,000 \div 0.05 = 500\,000$, which is about $n/2$ — exactly the extra factor the pair loop has.
:::

## Big-O: keep the part that grows fastest

The exact counts are messy: $\frac{n(n-1)}{2}$, $2n$, $n\log_2 n + n$. For big inputs only one thing matters: which term grows fastest. So we throw away two things.

1. **Smaller terms.** $\frac{n(n-1)}{2} = \frac{n^2}{2} - \frac{n}{2}$. At $n = 10^6$ the first part is $5 \times 10^{11}$ and the second is $5 \times 10^5$ — a million times smaller. Drop it.
2. **Constant factors.** The $\frac{1}{2}$ in front of $n^2$ depends on details like whether you compare each pair once or twice. It does not change the *shape*. Drop it.

What is left is written in **[[Big-O notation|where-o-comes-from]]**: a way of naming the fastest-growing part of a cost, with constants and smaller terms thrown away. $O(n^2)$ is read aloud "O of n squared" (or "order n squared"). $O(n)$ is "O of n", or "linear". $O(1)$ is "O of one", or "constant".

::: key Big-O in one line
Count the steps as a formula in $n$, keep the fastest-growing term, and drop its constant: $\frac{n(n-1)}{2} \to O(n^2)$, $2n \to O(n)$, $n\log_2 n + n \to O(n \log n)$.
:::

Two quick rules help you count without writing sums every time:

- **Steps one after another add.** A loop over $n$ followed by another loop over $n$ is $n + n = 2n$, which is $O(n)$.
- **Loops inside loops multiply.** A loop over $n$ with a loop over $n$ inside it is $n \times n = O(n^2)$.

::: warning A loop inside a loop is not always n squared
The rule "nested loops multiply" is a first guess, not a law. What matters is how many times the *inner* body runs in total over the whole program. In lesson 3 you will meet a `while` loop inside a `for` loop that still adds up to $O(n)$, because the inner loop can only ever remove items the outer loop put in. Always ask: "how many times, in total, can this line run?"
:::

::: note Why it has to be true: the formal meaning
Mathematicians define it like this. A cost $f(n)$ is $O(g(n))$ if there are two fixed numbers $c$ and $n_0$ so that $f(n) \le c \cdot g(n)$ for every $n \ge n_0$. In words: past some size, $f$ never gets bigger than a fixed multiple of $g$.

Check it for $f(n) = \frac{n(n-1)}{2}$ and $g(n) = n^2$. Since $n - 1 < n$, we have $\frac{n(n-1)}{2} < \frac{n \cdot n}{2} = \frac{1}{2}n^2$. So $c = \frac{1}{2}$ and $n_0 = 1$ work, and $f$ is $O(n^2)$.

This is also why constants drop out: $5n$ is $O(n)$ with $c = 5$. Strictly, Big-O is an *upper* bound, so $O(n)$ code is also, technically, $O(n^2)$. In an interview, always give the tightest bound you can.
:::

## The common classes

A handful of shapes cover almost every interview solution. Here they are at $n = 10^6$, with a rough time at 50 ns per Python step:

```python
# int01_l02_table.py -- how many steps at n = 1,000,000, and how long?
import math

n = 10**6
step = 50e-9          # assume 50 ns per simple Python step (measured below)
rows = [
    ("O(1)",       1),
    ("O(log n)",   math.log2(n)),
    ("O(n)",       n),
    ("O(n log n)", n * math.log2(n)),
    ("O(n^2)",     n**2),
]
for name, steps in rows:
    print(f"{name:11s} {steps:9.3g} steps  {steps * step:9.3g} s")

# 2^n is too big to print: count its decimal digits instead
digits = math.floor(n * math.log10(2)) + 1
print(f"O(2^n)      a number with {digits} digits")
# O(1)                1 steps      5e-08 s
# O(log n)         19.9 steps   9.97e-07 s
# O(n)            1e+06 steps       0.05 s
# O(n log n)   1.99e+07 steps      0.997 s
# O(n^2)          1e+12 steps      5e+04 s
# O(2^n)      a number with 301030 digits
```

Where does the "50 ns" come from? Time a million-step loop yourself:

```python
# int01_l02_time.py -- how long do a million simple Python steps take?
import time

n = 10**6
start = time.perf_counter()
total = 0
for i in range(n):
    total += i          # one simple step per pass
elapsed = time.perf_counter() - start
print(f"total = {total}")
print(f"{n} steps took about {elapsed * 1000:.0f} ms")
# total = 499999500000
# 1000000 steps took about 53 ms      (your machine will differ)
```

Here is the same table in words, with the kind of code that produces each shape.

| Class | Read aloud | Steps at a million | Typical source |
| --- | --- | --- | --- |
| O(1) | constant | 1 | index into an array, push onto a stack |
| O(log n) | log n | about 20 | binary search, halving each step |
| O(n) | linear | a million | one pass over the input |
| O(n log n) | n log n | about 20 million | sorting |
| O(n²) | n squared | a million million | every pair |
| O(2ⁿ) | two to the n | 301,030 digits | every subset |

The **[[log n|logs-count-halvings]]** row is worth a moment. $\log_2 n$, read "log base two of n", answers the question "how many times can I halve $n$ before I reach 1?" Since $2^{20} = 1\,048\,576$, a million halves down to 1 in about 20 steps. That is why binary search is so fast, and why computer scientists usually write $O(\log n)$ without the base: switching base only multiplies by a constant.

::: key The ladder at n = 10^6
$O(1)$: 1 step. $O(\log n)$: about 20. $O(n)$: $10^6$. $O(n\log n)$: about $2 \times 10^7$. $O(n^2)$: $10^{12}$. $O(2^n)$: a number with 301,030 digits. Anything up to $O(n \log n)$ is fine at a million; $O(n^2)$ is not.
:::

This gives you a handy reverse check. If an interviewer says the input can be up to a million, an $O(n^2)$ idea is already ruled out, and you should be looking for $O(n)$ or $O(n \log n)$. If the input is at most 20 items, even $O(2^n)$ — about a million steps — is fine.

::: warning Big-O hides the constant, not the problem
Two $O(n)$ solutions can differ by a factor of 10 in real speed, and C++ is often tens of times faster than a Python loop. That is real, and on a flight computer it matters. But no constant rescues the wrong shape: a 50-times-faster language turns 13.9 hours of $O(n^2)$ into about 17 minutes, still far worse than 50 ms of $O(n)$ Python. Fix the shape first, then the constant.
:::

## The space term

Time is half the answer. The other half is **space complexity**: how much *extra* memory the algorithm needs as $n$ grows, beyond the input it was handed. That extra memory is often called **auxiliary space**.

Look back at the three duplicate checkers:

- The pair loop keeps two counters, `i` and `j`. That is the same two numbers whether the list has 5 elements or 5 million: $O(1)$ extra space.
- The set version may store every element it sees: $O(n)$ extra space.
- The sorting version makes a sorted copy: $O(n)$ extra space. (Sorting the list in place would save that copy, but it changes the caller's data — worth asking about.)

So the fastest version is not free. It trades memory for time. That trade is one of the most common conversations in an interview, and saying it out loud shows you see both columns.

Three things eat hidden space:

1. **Copies.** Slicing a Python list, `xs[1:]`, builds a new list of $n - 1$ elements.
2. **Output.** A function that returns a list of $n$ results needs $O(n)$ memory for it. Say whether you are counting it; most people state "extra space besides the output".
3. **The [[call stack|call-stack]].** Each call of a recursive function that has not finished yet holds a little memory. A recursion that goes $n$ calls deep uses $O(n)$ space even if it never builds a list.

::: example Store every sample, or keep a running total?
An **IMU** (inertial measurement unit, the box of motion sensors on a vehicle) reports 6 numbers per sample: three accelerations and three rotation rates. Say each is a 4-byte float, at 1000 samples a second, over a 600-second flight. You want the average of each channel.

**Store everything, then average.** Samples: $1000 \times 600 = 600\,000$. Bytes per sample: $6 \times 4 = 24$. Memory: $600\,000 \times 24 = 14\,400\,000$ bytes, about **14.4 MB**. That is $O(n)$ space, and it keeps growing with flight length.

**Running sum.** Keep 6 running totals and one counter. Add each sample as it arrives and divide at the end. That is 7 numbers, whether the flight lasts one second or one year: $O(1)$ space.

Both are $O(n)$ time, since every sample is touched once. Only the space differs. Sanity check: 14.4 MB is small for a laptop but can be a real share of the memory on an embedded flight computer, and it grows every second — which is exactly why flight code prefers the running form.
:::

::: key Say both terms, every time
State time **and** space for every solution, without being asked. Space means extra memory as $n$ grows: count copies, extra containers and recursion depth, and say whether the output is included.
:::

## Amortized: cheap on average, even with a rare expensive step

A growable array — Python's `list`, C++'s `std::vector` — has a puzzle hiding in it. It lives in one continuous block of memory. When the block is full and you push one more element, the array must grab a bigger block and copy every element across. That push costs $O(n)$. So is `push` $O(n)$?

Think of a coffee card: every tenth coffee is free, so the *average* price per coffee is lower than the sticker price. **[[Amortized|amortized-picture]]** analysis is the same idea in reverse: an occasional expensive step, spread over all the cheap steps around it, adds only a small fixed amount to each. An **amortized** cost is the average cost per operation over a long run of operations, worst case.

The trick is that the array does not grow by one slot. It *doubles*. Let us count the copies, starting from a block of 1:

```python
# int01_l02_amortized.py -- count the copies a doubling array makes
def count_copies(n):
    capacity, size, copies = 1, 0, 0
    for _ in range(n):
        if size == capacity:      # full: move to a block twice as big
            copies += size        # every old element is copied once
            capacity *= 2
        size += 1                 # the push itself
    return copies

for n in (0, 1, 10, 1000, 10**6):
    c = count_copies(n)
    per_push = c / n if n else 0.0
    print(f"n = {n:>7}: {c:>7} copies, {per_push:.2f} per push")
# n =       0:       0 copies, 0.00 per push
# n =       1:       0 copies, 0.00 per push
# n =      10:      15 copies, 1.50 per push
# n =    1000:    1023 copies, 1.02 per push
# n = 1000000: 1048575 copies, 1.05 per push
```

::: example A million pushes
Push $n = 10^6$ items into a doubling array that starts with room for 1.

The array doubles whenever it fills: at sizes 1, 2, 4, 8, and so on. The last doubling happens when it holds $2^{19} = 524\,288$ elements, because the next would be $2^{20} = 1\,048\,576$, more than a million. Each doubling copies everything present, so the total copies are

$$
1 + 2 + 4 + \dots + 2^{19} = 2^{20} - 1 = 1\,048\,575.
$$

Spread over a million pushes: $1\,048\,575 \div 10^6 \approx 1.05$ copies per push. Add the push itself and each push costs about 2 steps on average — a constant. So push is **amortized $O(1)$**, even though a single unlucky push costs $O(n)$.

Sanity check: the script above printed exactly 1,048,575 copies.
:::

::: note Why it has to be true: the doubling sum
Say the last doubling copied $m$ elements, where $m$ is a power of two and $m < n$. The copies before it were $m/2$, $m/4$, …, 1. Adding a halving series: $m + \frac{m}{2} + \frac{m}{4} + \dots + 1 = 2m - 1 < 2m$. And since $m < n$, the total is less than $2n$. So $n$ pushes cause fewer than $2n$ copies — fewer than 2 per push, however large $n$ gets.

If the array grew by a fixed amount instead, say 10 slots each time, the copies would be $10 + 20 + 30 + \dots$, which adds up to about $\frac{n^2}{20}$: $O(n^2)$ in total, $O(n)$ per push. Growing by a *factor* is what makes it work.
:::

You can watch a real `std::vector` do this. The C++ standard only promises amortized constant time; the growth factor is left to each library. GCC's library doubles:

```cpp
// int01_l02_capacity.cpp -- watch std::vector grow
#include <cstdio>
#include <vector>

int main() {
    std::vector<int> v;
    std::size_t last = v.capacity();
    std::printf("size 0: capacity %zu\n", last);
    for (int i = 0; i < 100; ++i) {
        v.push_back(i);
        if (v.capacity() != last) {       // print only when it grew
            last = v.capacity();
            std::printf("size %zu: capacity %zu\n", v.size(), last);
        }
    }
    return 0;
}
```

```bash
g++ -std=c++17 -Wall -o int01_l02_capacity int01_l02_capacity.cpp && ./int01_l02_capacity
# size 0: capacity 0
# size 1: capacity 1
# size 2: capacity 2
# size 3: capacity 4
# size 5: capacity 8
# size 9: capacity 16
# size 17: capacity 32
# size 33: capacity 64
# size 65: capacity 128
```

::: key Dynamic array push
Push onto a growable array is amortized $O(1)$: the array grows by a factor (doubling, in GCC's `std::vector`), so $n$ pushes cause fewer than $2n$ copies in total. A single push that triggers a regrow still costs $O(n)$.
:::

::: warning Amortized is not "always fast"
Amortized $O(1)$ is an average over many operations. The one push that regrows really does pause to copy everything. In a control loop with a hard deadline, that pause can be the problem. Flight code avoids it by reserving all memory up front — `v.reserve(n)` in C++, or a fixed-size **ring buffer**, which lesson 11 builds. Say this out loud if an interviewer asks about real-time use.
:::

## Saying it out loud

Now put it together into what you actually say. A good complexity sentence has four parts:

1. **Name $n$.** "Let $n$ be the number of samples." If there are two sizes, name both: "$n$ samples and a window of $k$."
2. **Time, with the reason.** "It's $O(n)$ time, because each sample is visited once."
3. **Space, with the reason.** "And $O(k)$ extra space for the window, not counting the output."
4. **The trade, if there is one.** "I could get $O(1)$ space by rescanning, but that's $O(nk)$ time."

Say it **before** you code, when you name your approach, and again at the end, after you have checked it against the code you actually wrote. If a hash map is involved, add the honest caveat: "$O(1)$ lookups on average." Lesson 8 builds this into a full routine for the first two minutes of a problem.

::: example Saying it for the set-based duplicate check
Here is the whole sentence for `has_dup_set` from earlier, as you would say it to an interviewer:

"Let $n$ be the length of the list. I walk it once and do one set lookup and one insert per element. Those are $O(1)$ on average, so the time is $O(n)$ average. In the worst case the set holds every element, so extra space is $O(n)$. The alternative is sorting and checking neighbors, $O(n \log n)$ time; or comparing every pair, which needs only $O(1)$ extra space but costs $O(n^2)$ time. At a million elements that's roughly 50 milliseconds against 7 hours in Python, so I'll take the memory."

Count the parts: $n$ named, time with reason, space with reason, the trade. All four are there, and the numbers are the ones from the first example.
:::

::: warning Mixing up the letters
If the problem has two sizes and you say "$O(n)$", which one did you mean? An algorithm that is $O(n \cdot k)$ is not $O(n)$ unless $k$ is a fixed constant. Name every letter you use, and do not quietly reuse $n$ for something else halfway through.
:::

When the answer depends on the input, say so. Many algorithms have a **[[best, average and worst case|three-cases]]**. Interviewers usually want the worst case unless you say otherwise, and hash maps are the classic exception where people quote the average.

## Check yourself

::: check
A function has a loop over $n$ items. Inside it is a second loop over the same $n$ items. After both loops finish, a third loop runs over the $n$ items once more. Count the steps roughly and give the Big-O time.
:::

::: answer
The nested pair runs its body $n \times n = n^2$ times. The final loop adds $n$ more. Total: $n^2 + n$. Keep the fastest-growing term and drop constants: $O(n^2)$. The extra $n$ is a million times smaller than $n^2$ at $n = 10^6$, so it does not change the shape.
:::

::: check
The input to a problem can hold up to 200,000 items. Your first idea compares every pair. Roughly how many comparisons is that, and is it a good plan in Python at about 50 ns per step?
:::

::: answer
Every pair is about $\frac{n^2}{2} = \frac{(2 \times 10^5)^2}{2} = \frac{4 \times 10^{10}}{2} = 2 \times 10^{10}$ comparisons. At $50 \times 10^{-9}$ s each that is $2 \times 10^{10} \times 50 \times 10^{-9} = 1000$ s, about 17 minutes. Far too slow. The size of the input is itself a hint: look for an $O(n)$ or $O(n \log n)$ approach, which would be about $10^{-2}$ s or a few tenths of a second.
:::

::: check
A recursive function calls itself on a list one element shorter each time, until the list is empty. It keeps no containers of its own. A friend says it uses $O(1)$ space. Are they right?
:::

::: answer
No. Every call that has not returned yet sits on the call stack, holding its own variables and return address. The recursion goes about $n$ calls deep before the first one returns, so it uses $O(n)$ extra space, even though no list is ever built. (And if each call slices the list, `xs[1:]`, it also copies: $n - 1$, then $n - 2$, … elements, which adds $O(n^2)$ time.)
:::

::: check
A growable array starts with room for 1 element and doubles when full. You push 20 elements. How many element copies happen in total, and how many copies per push is that?
:::

::: answer
It doubles when it reaches sizes 1, 2, 4, 8 and 16, copying that many elements each time. It does not double at 32, because only 20 elements are pushed. Total copies: $1 + 2 + 4 + 8 + 16 = 31$. Per push: $31 \div 20 = 1.55$. That is under 2, as the doubling argument promises, so push is amortized $O(1)$.
:::

::: check
Say, in the four-part form, the complexity of a function that computes the average of a list of $n$ numbers using a running sum.
:::

::: answer
"Let $n$ be the number of values. I visit each value once and add it to a running total, then divide once, so it's $O(n)$ time. I keep only the total and a count, so it's $O(1)$ extra space. There's no real trade here: you have to read every value at least once, so $O(n)$ time is the best possible."
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| n | the size of the input | name it, and every other size, out loud |
| Big-O | the fastest-growing part of the cost | drop smaller terms and constants |
| Sequence, nesting | steps in a row, loops inside loops | sequences add, nesting multiplies (check the total) |
| The ladder at a million | 1, 20, a million, 20 million, a million million | up to n log n is fine; n squared is not |
| log n | number of halvings from n to 1 | about 20 for a million |
| Space term | extra memory as n grows | copies, containers, recursion depth; say if output counts |
| Amortized | average cost per operation over a long run | dynamic array push is amortized O(1): fewer than 2n copies for n pushes |
| Saying it | four parts | name n, time with reason, space with reason, the trade |

Next lesson: the first two patterns — two pointers and sliding windows. Both turn "every pair" or "every window" from $O(n^2)$ into $O(n)$, and you will say exactly why.

::: context hash-set How a set answers so fast
A set in Python, or `std::unordered_set` in C++, is built on a **hash table**. A hash function turns each value into a number that says which bucket it belongs in. To check "have I seen 42?", the set computes the bucket for 42 and looks only there, instead of scanning everything. With a good hash and enough buckets, each bucket holds very few items, so a lookup takes about the same time whether the set holds ten items or ten million. That is "O(1) on average". Lesson 4 covers hash maps as a pattern in their own right.
:::

::: context where-o-comes-from Where the O comes from
The O stands for "order", as in "the order of growth". The notation comes from German number theory: Paul Bachmann used it in the 1890s, and Edmund Landau spread it in the early 1900s, which is why the family of symbols is sometimes called Landau notation. Computer scientists borrowed it much later, in the 1960s and 1970s, when they needed a way to compare algorithms that did not depend on which computer ran them. Donald Knuth also championed its cousins $\Omega$ (a lower bound) and $\Theta$ (both at once).
:::

::: context logs-count-halvings A logarithm counts halvings
Take 16 items and cut them in half again and again: 16, 8, 4, 2, 1. That is 4 cuts, and $\log_2 16 = 4$ because $2^4 = 16$. Every time the input doubles, you need only one more cut. So $\log_2$ of a thousand is about 10, of a million about 20, and of a billion about 30. Binary search does exactly this: each comparison throws away half of what is left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="20" y="12" width="320" height="18"/>
    <rect x="20" y="40" width="160" height="18"/>
    <rect x="20" y="68" width="80" height="18"/>
    <rect x="20" y="96" width="40" height="18"/>
    <rect x="20" y="124" width="20" height="18" fill="#1d6fd1"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="346" y="25" text-anchor="end" fill="#1f2a44">16</text>
    <text x="190" y="53">8  (cut 1)</text>
    <text x="110" y="81">4  (cut 2)</text>
    <text x="70" y="109">2  (cut 3)</text>
    <text x="50" y="137">1  (cut 4)</text>
  </g>
  <text x="340" y="137" font-size="11" fill="#6c7a93" text-anchor="end">log2 16 = 4</text>
</svg>
```
:::

::: context call-stack Memory that recursion uses without asking
When a function calls another function, the computer must remember where to come back to and what the caller's variables were. It keeps that on the **call stack**, a region of memory that grows by one "frame" per unfinished call and shrinks as calls return. Deep recursion can run out of it: Python stops at a default limit of about 1000 frames and raises `RecursionError`. Flight software is stricter still. Widely used safety-critical coding rules, such as the "Power of Ten" rules written at NASA's Jet Propulsion Laboratory, forbid recursion altogether, so that the worst-case stack use can be known before launch.
:::

::: context amortized-picture Where "amortized" comes from
To amortize a loan is to pay it off in steady small installments instead of one big lump; the word comes from the Old French for "to deaden" or extinguish a debt. Amortized analysis does the same with work. Charge every push a fixed fee of 3 steps, and the fees saved on cheap pushes always cover the next big copy. The bars show the real cost of pushes 1 to 16: spikes at pushes 2, 3, 5 and 9, when the array regrows, and 1 step everywhere else. The real average here is $31 \div 16 \approx 1.9$ steps, under the fee.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="350" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#8fb8f0" stroke="#1f2a44">
    <rect x="24" y="112" width="14" height="8"/>
    <rect x="44" y="104" width="14" height="16"/>
    <rect x="64" y="96" width="14" height="24"/>
    <rect x="84" y="112" width="14" height="8"/>
    <rect x="104" y="80" width="14" height="40"/>
    <rect x="124" y="112" width="14" height="8"/>
    <rect x="144" y="112" width="14" height="8"/>
    <rect x="164" y="112" width="14" height="8"/>
    <rect x="184" y="48" width="14" height="72"/>
    <rect x="204" y="112" width="14" height="8"/>
    <rect x="224" y="112" width="14" height="8"/>
    <rect x="244" y="112" width="14" height="8"/>
    <rect x="264" y="112" width="14" height="8"/>
    <rect x="284" y="112" width="14" height="8"/>
    <rect x="304" y="112" width="14" height="8"/>
    <rect x="324" y="112" width="14" height="8"/>
  </g>
  <line x1="20" y1="96" x2="350" y2="96" stroke="#b4232c" stroke-dasharray="4,3"/>
  <text x="348" y="90" font-size="11" fill="#b4232c" text-anchor="end">a fee of 3 steps per push</text>
  <text x="185" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">pushes 1 to 16 (bar = 1 step for the push + copies)</text>
</svg>
```
:::

::: context three-cases Best, average and worst
The same code can be fast on one input and slow on another. Searching a list for a value is instant if it is first (best case), takes about $n/2$ looks on a random input (average), and takes $n$ looks if it is last or missing (worst). Engineers who build systems that must never miss a deadline care most about the worst case, because "usually fast" does not keep a vehicle stable. Interviewers default to worst case too; say "average" out loud when that is what you mean, as with hash maps.
:::
