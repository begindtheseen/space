---
id: l03-two-pointers-and-sliding-windows
title: Two pointers and sliding windows
minutes: 23
covers:
  - 'High-yield patterns: arrays and two pointers, sliding window, hash maps, binary search including on the answer'
---

Picture a row of books on a shelf, sorted from thinnest to thickest. You want two books whose thicknesses add up to exactly 10 cm. You could try every pair — but there is a smarter way. Put your left hand on the thinnest book and your right hand on the thickest. If the two together are too thick, the thickest book is hopeless with anything, so move your right hand one book in. If they are too thin, move your left hand one book in. Each step rules out a whole book for good.

Now picture looking out of a train window. The window shows a fixed stretch of countryside, and as the train moves, one field slides in at the front while another slides out at the back. You never have to look at the whole landscape again; you only notice what enters and what leaves.

Those two pictures are the two patterns of this lesson: **two pointers** and the **sliding window**. Both take problems whose obvious answer checks every pair or every stretch — $O(n^2)$, as lesson 2 taught you to say — and do them in one pass, $O(n)$. They are the first patterns on the high-yield list, and they come back later inside the engineering problems: smoothing sensor data, lining up two time series, and tracking the peak of a signal over the last second.

## Arrays and pointers into them

An **array** is a row of values stored one after another in **[[one continuous block of memory|contiguous-array]]**, each with a position number called its **index**, starting at 0. Because the values sit side by side, reading `xs[i]` for any `i` is $O(1)$: the computer jumps straight there. Python's `list` and C++'s `std::vector` are both arrays in this sense.

In this lesson a **pointer** means an index variable that marks a position in the array and moves as the algorithm runs. It is **[[not a C++ pointer|index-not-pointer]]** — a plain number like `i` or `left`.

The whole trick of the two patterns is this: each pointer only ever moves forward (or only ever backward). A pointer that crosses an array of $n$ elements, never going back, moves at most $n$ times. Two such pointers move at most $2n$ times together. That is $O(n)$.

::: key Why pointer patterns are linear
If every pointer moves in one direction only and never jumps back, the total number of moves is at most a fixed multiple of $n$, so the whole pass is $O(n)$ time, usually with $O(1)$ extra space.
:::

## Two pointers from opposite ends

The first problem: **given a sorted list and a target, find two positions whose values add up to the target.**

The shelf picture turns directly into code. Start `i` at the left end and `j` at the right end. Look at the sum.

- Sum too small? The value at `i` is too small to pair with *anything*, since `xs[j]` is the largest partner left. Move `i` right.
- Sum too big? The value at `j` is too big for anything left. Move `j` left.
- Equal? Done.

```python
# int01_l03_pairs.py -- two pointers from opposite ends of a sorted list
def pair_with_sum(xs, target):
    """xs sorted ascending. Return indices (i, j), i < j, with
    xs[i] + xs[j] == target, or None. O(n) time, O(1) extra space."""
    i, j = 0, len(xs) - 1
    while i < j:
        s = xs[i] + xs[j]
        if s == target:
            return (i, j)
        if s < target:
            i += 1        # need more: the left value is too small for any partner
        else:
            j -= 1        # need less: the right value is too big for any partner
    return None

assert pair_with_sum([], 5) is None           # empty
assert pair_with_sum([5], 10) is None         # one element cannot pair with itself
assert pair_with_sum([1, 2, 4, 7, 11, 15], 15) == (2, 4)
assert pair_with_sum([-3, 0, 2, 8], 5) == (0, 3)
assert pair_with_sum([1, 2, 3], 100) is None
print(pair_with_sum([1, 2, 4, 7, 11, 15], 15))
# (2, 4)
```

::: example Tracing the pair search
List `[1, 2, 4, 7, 11, 15]`, target 15. Indices run 0 to 5.

1. $i = 0$, $j = 5$: $1 + 15 = 16$. Too big, so $j$ moves to 4.
2. $i = 0$, $j = 4$: $1 + 11 = 12$. Too small, so $i$ moves to 1.
3. $i = 1$, $j = 4$: $2 + 11 = 13$. Too small, so $i$ moves to 2.
4. $i = 2$, $j = 4$: $4 + 11 = 15$. Found: indices (2, 4).

Four sums checked. Every pair would have been $\frac{6 \times 5}{2} = 15$ sums. Sanity check: the values at 2 and 4 are 4 and 11, and $4 + 11 = 15$.
:::

::: note Why it has to be true: no answer is ever skipped
Suppose a correct pair sits at positions $a < b$. We need to show the pointers never step past it. Say $i$ reaches $a$ first, while $j$ is still at some position $j \ge b$. If $j > b$, then $xs[j] \ge xs[b]$, so $xs[a] + xs[j] \ge$ target. If it equals the target we stop with a correct answer. If it is bigger, $j$ moves left, not $i$. So $i$ stays at $a$ while $j$ walks down to $b$. The same argument works if $j$ reaches $b$ first. Either way the pointers meet the pair. Each step throws away only a value that cannot be in *any* answer.
:::

Here is the same thing in C++. Notice the guard at the top. In C++, `v.size()` is an unsigned number, so when `v` is empty, `v.size() - 1` does not give $-1$; it wraps around to a huge number and the loop reads far outside the array.

```cpp
// int01_l03_pairs.cpp -- the same two-pointer idea in C++
#include <cstdio>
#include <optional>
#include <utility>
#include <vector>

// v sorted ascending. O(n) time, O(1) extra space.
std::optional<std::pair<std::size_t, std::size_t>>
pair_with_sum(const std::vector<int>& v, int target) {
    if (v.size() < 2) return std::nullopt;   // guard: v.size() - 1 would wrap when empty
    std::size_t i = 0, j = v.size() - 1;
    while (i < j) {
        const int s = v[i] + v[j];
        if (s == target) return std::make_pair(i, j);
        if (s < target) ++i; else --j;
    }
    return std::nullopt;
}

int main() {
    std::printf("empty: %s\n", pair_with_sum({}, 5) ? "found" : "none");
    std::printf("single: %s\n", pair_with_sum({5}, 10) ? "found" : "none");
    auto r = pair_with_sum({1, 2, 4, 7, 11, 15}, 15);
    if (r) std::printf("found: %zu %zu\n", r->first, r->second);
    return 0;
}
```

```bash
g++ -std=c++17 -Wall -o int01_l03_pairs int01_l03_pairs.cpp && ./int01_l03_pairs
# empty: none
# single: none
# found: 2 4
```

::: warning The list must be sorted
Opposite-end pointers only work because the list is sorted: that is what lets one comparison rule out a whole value. On an unsorted list, either sort first ($O(n \log n)$ time) or use a hash map (lesson 4, $O(n)$ time but $O(n)$ space). Ask the interviewer whether the input is sorted before you rely on it.
:::

## Slow and fast pointers: working in place

The second shape uses two pointers moving the *same* way at different speeds. A **fast pointer** (here `read`) looks at every element. A **slow pointer** (here `write`) marks where the next kept element goes.

The problem: **a sorted list has repeated values; keep one copy of each at the front, without making a new list, and say how many are kept.** Doing it **[[in place|in-place]]** — changing the list itself with only a few extra variables — means $O(1)$ extra space.

Because the list is sorted, copies of the same value sit next to each other. So a value is new exactly when it differs from the last value we kept.

```python
# int01_l03_dedupe.py -- slow and fast pointers, in place
def remove_duplicates(xs):
    """xs sorted. Keep one copy of each value at the front of xs,
    in place, and return how many there are. O(n) time, O(1) space."""
    if not xs:
        return 0
    write = 1                        # xs[:write] holds the unique values so far
    for read in range(1, len(xs)):   # the fast pointer looks at every element
        if xs[read] != xs[write - 1]:
            xs[write] = xs[read]     # a new value: copy it to the slow pointer
            write += 1
    return write

for data, want in [([], []), ([4], [4]), ([2, 2, 2], [2]),
                   ([1, 1, 2, 3, 3, 3, 5], [1, 2, 3, 5])]:
    k = remove_duplicates(data)
    assert data[:k] == want, (data, want)
xs = [1, 1, 2, 3, 3, 3, 5]
k = remove_duplicates(xs)
print(k, xs[:k], xs)
# 4 [1, 2, 3, 5] [1, 2, 3, 5, 3, 3, 5]
```

::: example Tracing the in-place dedupe
List `[1, 1, 2, 3, 3, 3, 5]`. Start with `write = 1`: the first element, 1, is kept.

- `read` 1: value 1, same as the last kept (1). Skip.
- `read` 2: value 2, new. Copy to position 1, `write` becomes 2. Front: `[1, 2]`.
- `read` 3: value 3, new. Copy to position 2, `write` becomes 3. Front: `[1, 2, 3]`.
- `read` 4 and 5: value 3 again. Skip both.
- `read` 6: value 5, new. Copy to position 3, `write` becomes 4. Front: `[1, 2, 3, 5]`.

Answer: 4 unique values. The tail `[3, 3, 5]` is leftover junk, which is normal for in-place algorithms: the caller uses only the first 4. Sanity check: the distinct values in the original are 1, 2, 3 and 5 — four of them.
:::

## Sliding window, fixed size

A **sliding window** is a stretch of consecutive elements, from a left edge to a right edge, that moves along the array. Instead of recomputing everything for each new stretch, you update: add what enters on the right, remove what leaves on the left.

The simplest case is a window of fixed size $k$. A classic use is the **[[moving average|moving-average]]**: the average of the last $k$ sensor samples, which smooths out noise.

Recomputing each window from scratch costs $k$ additions per window, about $n \cdot k$ in all: $O(nk)$. Sliding costs one addition and one subtraction per step: $O(n)$.

```python
# int01_l03_fixed.py -- moving average with a fixed window of k samples
def moving_average(xs, k):
    """Average of every k consecutive samples. O(n) time, O(1) extra
    space besides the output. Empty list if k is out of range."""
    if k < 1 or k > len(xs):
        return []
    window = sum(xs[:k])                 # the first window, summed once
    out = [window / k]
    for i in range(k, len(xs)):
        window += xs[i] - xs[i - k]      # one sample enters, one leaves
        out.append(window / k)
    return out

assert moving_average([], 3) == []           # empty
assert moving_average([4.0], 1) == [4.0]     # single element, k = 1
assert moving_average([4.0], 2) == []        # k bigger than the input
assert moving_average([1, 2, 3], 3) == [2.0] # k equal to the input size
print([round(a, 3) for a in moving_average([9.8, 9.9, 10.4, 9.7, 9.6], 3)])
# [10.033, 10.0, 9.9]
```

::: example Smoothing five accelerometer readings
Five readings in m/s²: 9.8, 9.9, 10.4, 9.7, 9.6. Window $k = 3$.

**First window** (samples 0 to 2): $9.8 + 9.9 + 10.4 = 30.1$. Average $30.1 \div 3 \approx 10.033$.

**Slide once:** 9.7 enters, 9.8 leaves. $30.1 + 9.7 - 9.8 = 30.0$. Average $10.0$.

**Slide again:** 9.6 enters, 9.9 leaves. $30.0 + 9.6 - 9.9 = 29.7$. Average $9.9$.

Three windows from five samples: $n - k + 1 = 5 - 3 + 1 = 3$, as expected. Sanity check: every average sits between 9.6 and 10.4, the smallest and largest readings, and the 10.4 spike is softened to about 10.03.
:::

## Sliding window, variable size

Sometimes the window is not a fixed size. You grow it on the right while it stays valid, and shrink it from the left when it breaks a rule. The right edge moves every step; the left edge only moves forward. Both edges travel at most $n$ steps, so it is still $O(n)$.

The classic problem: **find the length of the longest stretch of a string with no repeated character.** A stretch of consecutive characters is a **[[substring|substring-vs-subsequence]]**.

Keep a dictionary `last_seen` from each character to the index where it last appeared. Move `right` across the string. If the new character already appears *inside the current window*, jump `left` to one past that earlier copy. The window `s[left : right + 1]` then never contains a repeat.

```python
# int01_l03_variable.py -- longest stretch with no repeated character
def longest_unique(s):
    """Length of the longest substring of s with no repeated character.
    O(n) time; O(k) extra space, k = number of distinct characters."""
    last_seen = {}          # character -> index where we last saw it
    left = 0                # the window is s[left : right + 1]
    best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1     # jump past the earlier copy
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best

assert longest_unique("") == 0           # empty
assert longest_unique("a") == 1          # single character
assert longest_unique("aaaa") == 1       # all equal
assert longest_unique("abcabcbb") == 3   # "abc"
assert longest_unique("abba") == 2       # the >= left check matters here
print(longest_unique("GNCGNSS"))
# 4
```

Trace it on `"GNCGNSS"`. The window grows to `GNC` (length 3). The second `G` at index 3 was last seen at 0, so `left` jumps to 1: window `NCG`. The second `N` at index 4 was last seen at 1, so `left` jumps to 2: window `CGN`. Then `S` joins: `CGNS`, length 4, the best. The final `S` repeats the one at index 5, so `left` jumps to 6 and the window shrinks to one character. Answer: 4.

::: warning The check that "abba" catches
Leave out `last_seen[ch] >= left` and the code can move `left` *backward*. In `"abba"`, when the last `a` arrives, `last_seen["a"]` is 0, but `left` is already 2 because of the second `b`. Jumping to $0 + 1 = 1$ would pull `left` back and let the window contain `bba`, which repeats. A left edge that moves backward also breaks the $O(n)$ argument. Only jump forward.
:::

::: key Sliding window
A sliding window keeps a running summary of a stretch of consecutive elements and updates it as one element enters on the right and one (or more) leave on the left. Fixed size $k$: $O(n)$ instead of $O(nk)$. Variable size: grow on the right, shrink from the left; each edge moves at most $n$ times, so $O(n)$.
:::

## Sliding-window maximum with a monotonic deque

Now a harder window: **the largest value in every window of $w$ consecutive samples.** A flight computer might want the peak vibration over each last second, updated every sample.

A running sum was easy to update, because subtraction undoes addition. A maximum is not: when the biggest value leaves the window, you cannot "un-max" it. Rescanning each window costs $w$ looks per window, $O(nw)$ in all.

The fix is a **[[deque|deque-both-ends]]** — a double-ended queue, a list you can add to and remove from at *both* ends in $O(1)$ — holding *indices* of the window, arranged so their values are **[[monotonic|monotonic-meaning]]**: always decreasing from front to back. Three rules keep it that way:

1. **Before adding a new index $i$, pop from the back every index whose value is $\le$ `v[i]`.** Those values are older *and* no bigger than `v[i]`. While `v[i]` is in the window they can never be the maximum, and they will leave the window before it does. They are useless forever.
2. **Pop the front if it has slid out of the window**, that is, if its index is $\le i - w$.
3. **The front is the maximum of the current window.** Because values decrease from front to back, the front holds the biggest.

```python
# int01_l03_deque.py -- sliding-window maximum with a monotonic deque
from collections import deque

def max_window(v, w):
    """Maximum of every w consecutive values. O(n) time, O(w) extra space."""
    n = len(v)
    if w < 1 or w > n:
        return []
    dq = deque()     # indices; their values decrease from front to back
    out = []
    for i in range(n):
        # 1. anything at the back that is not bigger than v[i] can never
        #    be a maximum again while v[i] is in the window: drop it
        while dq and v[dq[-1]] <= v[i]:
            dq.pop()
        dq.append(i)
        # 2. the front index has slid out of the window: drop it
        if dq[0] <= i - w:
            dq.popleft()
        # 3. once the first full window exists, its maximum is at the front
        if i >= w - 1:
            out.append(v[dq[0]])
    return out

assert max_window([], 3) == []                 # empty
assert max_window([42], 1) == [42]             # single element
assert max_window([5, 5, 5], 2) == [5, 5]      # all equal
assert max_window([2, 7, 1], 3) == [7]         # w equal to the input size
assert max_window([-4, -2, -9], 2) == [-2, -2] # negatives
assert max_window([1, 2], 0) == []             # w out of range
print(max_window([4, 2, 12, 3, 8, 1, 6], 3))
# [12, 12, 12, 8, 8]
```

::: example Tracing the deque
Values `[4, 2, 12, 3, 8, 1, 6]`, window $w = 3$. The deque holds indices; values are shown in brackets.

- $i = 0$ (4): deque `0[4]`. No full window yet.
- $i = 1$ (2): 4 is bigger, keep it. Deque `0[4], 1[2]`.
- $i = 2$ (12): pop 1 (2 ≤ 12), pop 0 (4 ≤ 12). Deque `2[12]`. Output **12**.
- $i = 3$ (3): deque `2[12], 3[3]`. Front 2 is not ≤ 0, stays. Output **12**.
- $i = 4$ (8): pop 3 (3 ≤ 8). Deque `2[12], 4[8]`. Front 2 is not ≤ 1. Output **12**.
- $i = 5$ (1): deque `2[12], 4[8], 5[1]`. Front 2 ≤ 2: it has left the window, pop it. Deque `4[8], 5[1]`. Output **8**.
- $i = 6$ (6): pop 5 (1 ≤ 6); 8 stays. Deque `4[8], 6[6]`. Output **8**.

Result `[12, 12, 12, 8, 8]`. Check by brute force: windows `[4,2,12]`, `[2,12,3]`, `[12,3,8]`, `[3,8,1]`, `[8,1,6]` have maxima 12, 12, 12, 8, 8. Five windows, and $n - w + 1 = 7 - 3 + 1 = 5$.
:::

### Why it is O(n), even with a loop inside a loop

The `while` loop inside the `for` loop looks like $O(nw)$. Lesson 2 warned you about this: ask how many times the inner line can run *in total*.

Every index is pushed onto the deque exactly once, by `dq.append(i)`. Once popped, from the back or the front, it never returns. So across the whole run, the pops cannot outnumber the pushes: at most $n$ pops in total. Pushes plus pops is at most $2n$. The `while` loop may pop several items at one step, but only items that earlier steps paid to push.

You can count it. Here the deque and brute force are run on a million values with a window of 1000:

```python
# int01_l03_count.py -- count deque work versus the brute-force scan
from collections import deque
import random

def deque_work(v, w):
    dq, pushes, pops = deque(), 0, 0
    for i in range(len(v)):
        while dq and v[dq[-1]] <= v[i]:
            dq.pop(); pops += 1
        dq.append(i); pushes += 1
        if dq[0] <= i - w:
            dq.popleft(); pops += 1
    return pushes, pops

n, w = 10**6, 1000
random.seed(1)
for name, v in [("rising", list(range(n))), ("falling", list(range(n, 0, -1))),
                ("random", [random.random() for _ in range(n)])]:
    pushes, pops = deque_work(v, w)
    print(f"{name:8s} pushes {pushes}, pops {pops}")
print(f"brute force looks at {(n - w + 1) * w} values")
# rising   pushes 1000000, pops 999999
# falling  pushes 1000000, pops 999000
# random   pushes 1000000, pops 999994
# brute force looks at 999001000 values
```

Rising, falling or random, the pops never exceed the pushes, and the total deque work stays under $2 \times 10^6$. Brute force looks at about $10^9$ values — about 500 times more. The deque never holds more than $w$ indices, so the extra space is $O(w)$.

::: key O(n) sliding-window maximum
A monotonic deque of indices whose values decrease. Each index enters once and leaves once, so the total work is linear despite the inner while loop, and the front is always the window maximum. Time $O(n)$, extra space $O(w)$.
:::

::: warning Store indices, not values
If the deque held values, you could not tell when the front had slid out of the window: two equal values look the same. Indices tell you *where* each value came from, so the test `dq[0] <= i - w` works. Also check the edge cases the tests above cover: empty input, $w = 1$, $w$ equal to $n$, all values equal, negative values, and $w$ out of range.
:::

The module's C++ exercise asks you to write this same function in C++ with `std::deque<int>`, returning a `std::vector<int>`. The Python above is your map. Before you write it, say the complexity aloud, the way lesson 2 taught. Then translate each numbered rule, and watch the details that differ from Python: `std::deque` spells the operations `push_back`, `pop_back`, `pop_front`, `front()` and `back()`, and a signed-versus-unsigned comparison between `int` and `v.size()` draws a warning under `-Wall`.

## Choosing between them

Here is how the clues in a problem point to each shape, so you can recognize it fast:

- **Sorted input, looking for a pair or a triple** that meets a target: opposite-end pointers.
- **Rewrite an array in place**, removing or compacting items: slow and fast pointers.
- **"Every stretch of length $k$"**: fixed window.
- **"Longest" or "shortest stretch such that…"**: variable window.
- **Max or min of every window**: monotonic deque.

Two pointers also walk *two different* sorted lists side by side — merging them, or **[[matching timestamps from two sensors|bridge-time-alignment]]** — which comes back as an engineering problem later in the module.

## Check yourself

::: check
A sorted list is `[-5, -1, 2, 3, 9]` and the target sum is 4. Run the opposite-end pointers by hand. Which indices come out, and how many sums did you check?
:::

::: answer
Start $i = 0$, $j = 4$: $-5 + 9 = 4$. Equal on the first try: indices (0, 4). One sum checked. Sanity check: $-5 + 9 = 4$. (Had the first sum been too small, $i$ would move right; too big, $j$ would move left.)
:::

::: check
Run `remove_duplicates` on `[7, 7, 7, 8]`. What number does it return, and what do the first positions of the list hold? What extra space did it use?
:::

::: answer
`write` starts at 1, keeping the first 7. `read` 1 and 2 see 7, the same as the last kept, so they are skipped. `read` 3 sees 8, new: it is copied to position 1 and `write` becomes 2. It returns 2, and the front of the list is `[7, 8]` (the rest, `[7, 8]` at positions 2 and 3, is leftover). Extra space is $O(1)$: two index variables, no matter how long the list.
:::

::: check
A 100 Hz sensor gives $n = 360\,000$ samples in an hour. You want a moving average over $k = 100$ samples. Roughly how many additions does recomputing each window from scratch take, compared with sliding?
:::

::: answer
There are $n - k + 1 = 359\,901$ windows. From scratch each takes about $k = 100$ additions, so about $359\,901 \times 100 \approx 3.6 \times 10^7$ additions, which is $O(nk)$. Sliding takes one sum of the first 100, then one addition and one subtraction per slide: about $100 + 2 \times 359\,900 \approx 7.2 \times 10^5$ operations, which is $O(n)$. That is about 50 times less work, and the gap grows with $k$.
:::

::: check
Find the longest substring with no repeated character in `"ORBITOR"`. Trace where `left` jumps.
:::

::: answer
The window grows through `O`, `R`, `B`, `I`, `T`: `ORBIT`, length 5, all different. The second `O` at index 5 was last seen at 0, which is $\ge$ `left` (0), so `left` jumps to 1: window `RBITO`, length 5. The second `R` at index 6 was last seen at 1, $\ge$ `left` (1), so `left` jumps to 2: window `BITOR`, length 5. The best is 5.
:::

::: check
In the monotonic deque, the inner `while` loop can pop many items at a single step. Explain in two sentences why the whole algorithm is still $O(n)$, and give its extra space.
:::

::: answer
Every index is pushed exactly once, and once popped it never comes back, so over the whole run there are at most $n$ pops; pushes plus pops is at most $2n$. The inner loop only spends work that earlier pushes created, so the total is linear. Extra space is $O(w)$, because the deque never holds more indices than the window has.
:::

## Summary

| Pattern | Clue | Time and extra space |
| --- | --- | --- |
| Opposite-end pointers | sorted input, pair meeting a target | O(n), O(1) |
| Slow and fast pointers | rewrite in place | O(n), O(1) |
| Fixed window | every stretch of length k | O(n), O(1) besides output |
| Variable window | longest or shortest valid stretch | O(n), O(k) for the seen-set |
| Monotonic deque | max or min of every window | O(n), O(w) |
| Why linear | pointers never move back; each index enters and leaves the deque once | total moves at most 2n |

Next lesson: hash maps, the tool that fixes the unsorted version of the pair problem, and binary search — including the surprising trick of binary searching the *answer* itself.

::: context contiguous-array Why side by side makes indexing instant
Memory is a long row of numbered bytes. If an array of 4-byte integers starts at byte address 1000, then element 0 is at 1000, element 1 at 1004, and element $i$ at $1000 + 4i$. The computer finds any element with one multiply and one add, no matter how long the array is. That is why indexing is $O(1)$. The price is that inserting in the middle means shifting everything after it, which is $O(n)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="20" y="30" width="64" height="32"/>
    <rect x="84" y="30" width="64" height="32"/>
    <rect x="148" y="30" width="64" height="32" fill="#1d6fd1"/>
    <rect x="212" y="30" width="64" height="32"/>
    <rect x="276" y="30" width="64" height="32"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="52" y="22">index 0</text><text x="116" y="22">1</text><text x="180" y="22">2</text><text x="244" y="22">3</text><text x="308" y="22">4</text>
    <text x="52" y="80">1000</text><text x="116" y="80">1004</text><text x="180" y="80">1008</text><text x="244" y="80">1012</text><text x="308" y="80">1016</text>
  </g>
  <text x="180" y="102" font-size="11" fill="#6c7a93" text-anchor="middle">address of element i = 1000 + 4 i</text>
</svg>
```
:::

::: context index-not-pointer Two meanings of "pointer"
In C++, a pointer is a variable holding a memory address, like `int* p`. In algorithm talk, "two pointers" usually means two plain integer indices into an array. The idea is the same — each marks a position — and in C++ you can write these patterns with real pointers or iterators too. In an interview, indices are clearer and safer, and they make the bounds easy to reason about aloud.
:::

::: context in-place Why in-place matters on a flight computer
An in-place algorithm changes its input directly instead of building a new copy, so it needs only $O(1)$ extra memory. On a laptop, a spare copy of a list rarely matters. On an embedded flight computer, memory is fixed at design time and allocating more while flying is usually forbidden, so an algorithm that works in place is often the only kind allowed. The catch is that the caller's data changes, so say so aloud and ask whether that is acceptable.
:::

::: context moving-average Smoothing a noisy signal
Real sensors jitter. An accelerometer sitting still on a bench reads a little above and below 9.8 m/s² from moment to moment. A moving average replaces each reading with the average of the last $k$, which cancels much of that jitter while following slower real changes. The price is lag: the smoothed signal trails the true one by about half a window. Choosing $k$ is a trade between smoothness and delay, a trade you will meet again in filters and control.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="350" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#8fb8f0" stroke-width="1.5" points="20,62 40,48 60,70 80,52 100,74 120,44 140,66 160,50 180,72 200,46 220,64 240,54 260,76 280,44 300,68 320,50 340,64"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="60,60 80,57 100,65 120,57 140,61 160,53 180,63 200,56 220,61 240,55 260,65 280,58 300,63 320,54 340,61"/>
  <text x="24" y="22" font-size="11" fill="#8fb8f0">raw readings</text>
  <text x="120" y="22" font-size="11" fill="#1d6fd1">average of the last 3</text>
  <text x="185" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">time</text>
</svg>
```
:::

::: context substring-vs-subsequence Substring or subsequence?
A **substring** is a stretch of *consecutive* characters: in `"ROCKET"`, `"OCK"` is one. A **subsequence** keeps the order but may skip characters: `"RKT"` is a subsequence of `"ROCKET"` but not a substring. The words look alike and interview problems use both. Sliding windows work on substrings and subarrays, because a window is always consecutive. Longest-subsequence problems usually need dynamic programming instead, which lesson 7 introduces. When a problem says one of these words, check which.
:::

::: context deque-both-ends A queue with two open ends
"Deque" is short for double-ended queue and is usually said "deck". A normal queue adds at the back and removes at the front, like a line at a ticket window. A deque can add and remove at both ends in $O(1)$. The monotonic-deque algorithm uses three of the four moves: push at the back, pop at the back, pop at the front. In Python it is `collections.deque` (with `append`, `pop`, `popleft`); in C++ it is `std::deque` (with `push_back`, `pop_back`, `pop_front`).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="100" y="36" width="54" height="32" fill="#1d6fd1"/>
    <rect x="154" y="36" width="54" height="32"/>
    <rect x="208" y="36" width="54" height="32"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="127" y="57" fill="#ffffff">12</text><text x="181" y="57">8</text><text x="235" y="57">1</text>
  </g>
  <g stroke="#b4232c" stroke-width="2" fill="none">
    <line x1="96" y1="52" x2="44" y2="52"/><polyline points="52,46 44,52 52,58"/>
    <line x1="266" y1="46" x2="318" y2="46"/><polyline points="310,40 318,46 310,52"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <line x1="318" y1="60" x2="266" y2="60"/><polyline points="274,54 266,60 274,66"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="20" y="30">pop front</text>
    <text x="270" y="30">pop back</text>
    <text x="270" y="84">push back</text>
    <text x="100" y="92">front = window max</text>
  </g>
</svg>
```
:::

::: context monotonic-meaning What "monotonic" means
Monotonic means "moving in one direction only": always going down, or always going up, never turning back. A monotonic *decreasing* deque holds values like 12, 8, 1 — each smaller than the one before. The same word turns up in lesson 4, where binary search on the answer needs a feasibility test that is monotonic: once a rate is fast enough, every faster rate is too. In both places, one direction is what lets you throw information away safely.
:::

::: context bridge-time-alignment Two pointers on two lists
When two sensors report at different rates — say a GPS at 10 Hz and an IMU at 100 Hz — you often need, for each GPS time, the nearest IMU sample. Both timestamp lists are already sorted, because time only moves forward. So you keep one pointer in each list and advance whichever is behind. Each pointer crosses its own list once, so the whole alignment is $O(n + m)$ for lists of length $n$ and $m$. Lesson 11 builds this time aligner as one of the engineering variants.
:::
