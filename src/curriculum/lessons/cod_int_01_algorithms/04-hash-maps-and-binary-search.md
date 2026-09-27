---
id: l04-hash-maps-and-binary-search
title: Hash maps and binary search
minutes: 22
covers:
  - 'High-yield patterns: arrays and two pointers, sliding window, hash maps, binary search including on the answer'
---

Think about a coat check at a concert. You hand over your jacket and get a numbered ticket. At the end of the night, the attendant does not walk along the whole rail looking at every coat. They read your number and go straight to hook 47. That is the first idea in this lesson: a way of storing things so that finding one is instant, however many there are.

Now think about finding a word in a paper dictionary. You do not start at "aardvark" and read forward. You open near the middle, see you have gone too far, and throw away the back half. Then you do it again with what is left. A thousand pages take about ten of those splits. That is the second idea: throwing away half of what is left, every step.

The first is a **hash map**. The second is **binary search**. Last lesson's two pointers and sliding windows walked through an array once. These two answer a different question: "is this thing here, and where?" Between them they solve a big share of medium interview problems. They also sit inside real ground software, every time a telemetry tool looks up a channel by its ID or finds the sample nearest a timestamp.

## Hash maps: the coat check

A **hash map** is a table that stores **key → value** pairs (read the arrow as "maps to") and finds any key in about the same time, however big the table gets. In Python it is the built-in `dict`, and its value-less cousin is `set`. In C++ it is `std::unordered_map` and `std::unordered_set`.

How does it go straight to the right hook? It runs the key through a **[[hash function|hash-function]]** — a recipe that turns any key into a number. That number, divided by the number of storage slots, picks a slot. Looking up the key later runs the same recipe and lands on the same slot. No searching.

Two different keys can land in the same slot. That is a **collision**. The table then keeps a short list in that slot and checks each item in it. With a good hash function and a table that grows as it fills, those lists stay a few items long. So on average, insert, lookup and delete each take constant time, written $O(1)$ (read "order one": the time does not grow with the size of the table).

But "on average" is doing real work in that sentence. If every key collided into one slot, the table would become one long list, and each lookup would walk it: $O(n)$, where $n$ is the number of items. That is the **[[worst case|worst-case-hashing]]**.

::: key Hash map costs
Insert, lookup and delete are $O(1)$ on average and $O(n)$ in the worst case, when many keys collide. The table itself takes $O(n)$ space. Say both halves out loud: "average $O(1)$, worst case $O(n)$".
:::

In an interview, a hash map is the move whenever you catch yourself thinking "have I seen this before?" or "how many of each?" Three problems show the family.

### Counting how many of each

A ground station logs which telemetry channel each packet came from. Which channel is the chattiest? Walk the list once and keep a tally in a dict: the key is the channel ID, the value is how many times you have seen it.

```python
from collections import Counter

ids = [101, 205, 101, 330, 205, 101, 412]

counts = {}
for x in ids:
    counts[x] = counts.get(x, 0) + 1
print(counts)

print(Counter(ids).most_common(1))
# {101: 3, 205: 2, 330: 1, 412: 1}
# [(101, 3)]
```

`counts.get(x, 0)` means "the tally for `x`, or 0 if `x` is new". Python's `Counter` does the same job in one line, and interviewers are happy to see it once you have shown you know what it does underneath.

Time is $O(n)$: one pass, with an $O(1)$ average update per item. Space is $O(k)$, where $k$ is the number of *distinct* IDs. Here $k = 4$ while $n = 7$. Saying "$O(k)$, at most $O(n)$" is the kind of precise space term interviewers listen for.

### Two-sum: remember what you have seen

The classic hash map problem: given a list of numbers and a target, find two of them that add up to the target.

The slow way checks every pair. With $n$ items there are $n(n-1)/2$ pairs, so that is $O(n^2)$ time. The fast way turns the question around. As you walk the list and reach a number $m$, you need its partner, $\text{target} - m$. Have you already walked past the partner? A dict of "values seen so far, and where" answers that in $O(1)$.

::: example Two spare parts that make a mass budget
A payload engineer has $50\,\mathrm{kg}$ of spare mass allowance and wants to fly exactly two spare parts that use all of it. The parts weigh $12, 45, 7, 31, 26, 19\,\mathrm{kg}$.

```python
def two_sum(masses, target):
    seen = {}                      # value -> index where we saw it
    for i, m in enumerate(masses):
        need = target - m
        if need in seen:
            return seen[need], i
        seen[m] = i
    return None


masses = [12, 45, 7, 31, 26, 19]   # kg of each spare part
print(two_sum(masses, 50))         # which two parts weigh exactly 50 kg?
print(two_sum(masses, 100))
# (3, 5)
# None
```

Walk it by hand. At $12$ we need $38$: not seen; store $12$. At $45$ we need $5$: not seen; store $45$. At $7$ we need $43$; store. At $31$ we need $19$; not seen yet, so store $31$ at index $3$. At $26$ we need $24$; store. At $19$ we need $31$ — and $31$ is in the dict at index $3$. The answer is indices $3$ and $5$. Check: $31 + 19 = 50\,\mathrm{kg}$.

For $100\,\mathrm{kg}$ no pair works, so it returns `None`. The largest two parts are $45 + 31 = 76\,\mathrm{kg}$, well short of $100$, so that makes sense.

Time $O(n)$, one pass. Space $O(n)$ for the dict. You traded memory for speed: $O(n^2)$ time and $O(1)$ space became $O(n)$ time and $O(n)$ space.
:::

::: warning Check before you store
Look up the partner *before* adding the current number. If you store first, a target of $62$ with a single $31$ in the list would pair $31$ with itself. Checking first means a number can only pair with something earlier in the list.
:::

### The first repeated ID

Ground stations sometimes receive the same **[[telemetry packet|telemetry-packet-id]]** twice, for example when two antennas both hear a pass. Given packet IDs in arrival order, return the first ID that shows up a second time.

```python
def first_repeat(packet_ids):
    seen = set()
    for pid in packet_ids:
        if pid in seen:
            return pid
        seen.add(pid)
    return None


print(first_repeat([7, 3, 9, 4, 3, 7]))
print(first_repeat([1, 2, 3]))
print(first_repeat([]))
# 3
# None
# None
```

The answer is $3$, not $7$. Both repeat, but $3$'s second copy arrives first (at position 4, counting from 0, while $7$'s arrives at position 5). The empty list and the all-different list both give `None` without crashing. Time $O(n)$, space $O(n)$ for the set.

::: note Which container to reach for
You only need to know "seen or not"? Use a `set`. You need to remember something about each key — a count, an index? Use a `dict`. In C++ the same split is `std::unordered_set` and `std::unordered_map`. There is also `std::map`, which keeps keys in sorted order using a tree: every operation is $O(\log n)$ instead of $O(1)$, and in exchange you can walk the keys in order.
:::

## Binary search: the dictionary trick

Binary search needs one thing the hash map does not: the data must be **sorted**. In exchange it answers questions a hash map cannot, like "what is the first packet at or after 200 seconds?", where 200 itself may not be in the list at all.

The picture is the number-guessing game. I think of a number from 1 to 100. You guess 50; I say "higher". You have thrown away 50 numbers with one guess. Guess 75; "lower". Each guess halves what is left, so 100 numbers take at most 7 guesses, because $2^7 = 128$ is the first power of two past 100.

In general, $n$ items take about $\log_2 n$ halvings. That is $\log_2 n$, read "log base two of $n$" — the number of times you can halve $n$ before you reach 1. A million sorted timestamps take about 20 steps. So binary search is $O(\log n)$ time.

### Lower bound, with an invariant

The most useful version is **lower bound**: the first index $i$ where $a[i] \ge \text{target}$ (read "a of i is at least the target"). If every item is smaller than the target, it returns $n$, one past the end.

Off-by-one mistakes are the danger in binary search. The cure is a **[[loop invariant|loop-invariant]]** — a sentence that is true before the loop, stays true after every step, and tells you the answer when the loop ends. Here it is:

> The answer is always somewhere in the range from `lo` to `hi`, including both ends.

We start with `lo = 0` and `hi = n`. Including $n$ matters, because "not found" is the answer $n$. At each step look at the middle, `mid`:

- If `a[mid] < target`, then `a[mid]` is too small, and so is everything to its left (the list is sorted). The answer must be past `mid`, so set `lo = mid + 1`.
- Otherwise `a[mid] >= target`, so `mid` itself *might* be the answer. Keep it: set `hi = mid`, not `mid - 1`.

The loop runs while `lo < hi`. When `lo == hi`, the range holds exactly one index, and the invariant says it is the answer.

```python
import bisect


def lower_bound(a, target):
    """First index i with a[i] >= target; len(a) if there is none."""
    lo, hi = 0, len(a)             # the answer is somewhere in [lo, hi]
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < target:
            lo = mid + 1           # a[mid] is too small, and so is all to its left
        else:
            hi = mid               # a[mid] might be the answer; keep it
    return lo


t = [0, 40, 95, 130, 180, 260, 310, 355]   # packet times, s
print(lower_bound(t, 200))
print(lower_bound(t, 180))
print(lower_bound(t, 400))
print(bisect.bisect_left(t, 200))
# 5
# 4
# 8
# 5
```

`//` is Python's whole-number division: `7 // 2` is `3`. Python's built-in `bisect.bisect_left` is exactly this function, and C++ has `std::lower_bound`. Know how to write it, then use the library. Time $O(\log n)$, space $O(1)$.

::: example Tracing the search for 200 seconds
The list $t$ holds 8 packet times. Find the first packet at or after $200\,\mathrm{s}$.

- Start: `lo = 0`, `hi = 8`. `mid = (0 + 8) // 2 = 4`, and `t[4] = 180`. $180 < 200$, so `lo = 5`.
- Now `lo = 5`, `hi = 8`. `mid = 13 // 2 = 6`, and `t[6] = 310`. $310 \ge 200$, so `hi = 6`.
- Now `lo = 5`, `hi = 6`. `mid = 11 // 2 = 5`, and `t[5] = 260`. $260 \ge 200$, so `hi = 5`.
- Now `lo = hi = 5`. Stop. The answer is index 5, time $260\,\mathrm{s}$.

Sanity check: the packet before it is at $180\,\mathrm{s}$, which is too early, and $260\,\mathrm{s}$ is the next one. Three steps for 8 items, and $\log_2 8 = 3$. For $180$ the answer is index 4, because $180$ itself counts as "at least 180". For $400$, later than everything, the answer is 8 — one past the end, which means "none".
:::

::: warning The three classic slips
First, `hi = mid - 1` in the "might be the answer" branch throws the answer away. Second, `while lo <= hi` with `hi = mid` can loop forever once `lo == hi`. Third, in C++ with `int`, `(lo + hi) / 2` can **[[overflow|midpoint-overflow]]** when both are large; write `lo + (hi - lo) / 2`. Pick one invariant and let it decide every line.
:::

## Binary search on the answer

Here is where binary search gets its reputation. Sometimes there is no sorted array at all. Instead, the answer is a *number* — a size, a rate, a time — and you can check any guess.

Picture tuning an oven by trial. Is $150\,^\circ\mathrm{C}$ hot enough to bake the cake in time? No. Is $250$? Yes. Then every temperature above $250$ also works, and every one below $150$ also fails. Somewhere between them is a boundary. You can binary search for it by trying temperatures, without a list of anything.

The property that makes this work is called **monotone feasibility**: once a value is big enough, every bigger value is also big enough. The pass/fail answers, laid out from small to large, look like `fail fail fail pass pass pass`. Lower bound on that row of answers finds the first `pass`, which is the minimum that works.

::: key Binary search on the answer
When the answer is a number and **[[feasibility is monotone|monotone-feasibility]]** in it, binary search the value and test feasibility, rather than searching an array. Minimum capacity, minimum rate and minimum time problems are all this pattern.
:::

The recipe has three parts:

1. **A feasibility check** `ok(x)`: "does value $x$ work?" This is usually a simple greedy loop, $O(n)$.
2. **A range** `lo` to `hi` that surely contains the answer. `lo` is a value that might just work; `hi` is one that surely does.
3. **The lower-bound loop** from the last section, with `ok(mid)` in place of `a[mid] >= target`.

The total time is $O(n \log R)$, where $R$ is the size of the range: $\log_2 R$ halvings, each costing one $O(n)$ check.

::: example The smallest rover battery
A rover has eight science tasks to do **in order**. Each needs a fixed amount of energy, in watt-hours (Wh): $120, 340, 210, 90, 400, 150, 260, 180$. Each night the solar panels recharge the battery to full. The team wants all eight tasks done in 3 **[[sols|sol]]** (Mars days). What is the smallest battery capacity that allows that?

**The check.** For a given capacity, pack tasks into each sol greedily: keep adding the next task until it would not fit, then start a new sol. Count the sols. Doing as much as possible each day can never need *more* days, so the greedy count is the true minimum for that capacity.

**Monotone?** Yes. A bigger battery can do everything a smaller one can. So "fits in 3 sols" goes `fail … fail pass … pass` as the capacity grows.

**The range.** The battery must hold the biggest single task, so `lo = 400`. A battery holding everything does it in one sol, so `hi = 120 + 340 + 210 + 90 + 400 + 150 + 260 + 180 = 1750`.

```python
def sols_needed(tasks, capacity):
    """Greedy: pack tasks in order into sols; recharge to full each night."""
    sols, used = 1, 0
    for e in tasks:
        if used + e > capacity:    # this task does not fit today
            sols += 1
            used = 0
        used += e
    return sols


def min_battery(tasks, days):
    lo, hi = max(tasks), sum(tasks)   # smallest and largest sensible answers
    while lo < hi:
        mid = (lo + hi) // 2
        if sols_needed(tasks, mid) <= days:
            hi = mid               # mid works; maybe something smaller does too
        else:
            lo = mid + 1           # mid fails; every smaller size fails too
    return lo


tasks = [120, 340, 210, 90, 400, 150, 260, 180]   # Wh, in order
print(min_battery(tasks, 3))
print(sols_needed(tasks, 670), sols_needed(tasks, 669))
# 670
# 3 4
```

The first guesses go like this. `mid = 1075` needs 2 sols: pass, so `hi = 1075`. `mid = 737` needs 3: pass, `hi = 737`. `mid = 568` needs 4: fail, `lo = 569`. It keeps halving until `lo = hi = 670`, after 11 guesses.

**Check the answer.** At $670\,\mathrm{Wh}$ the sols are $120 + 340 + 210 = 670$, then $90 + 400 + 150 = 640$, then $260 + 180 = 440$. Three sols, and the first one uses the battery to the last watt-hour. At $669\,\mathrm{Wh}$ the first sol only fits $120 + 340 = 460$, and the plan spills into a fourth sol. So $670$ really is the minimum.

The range held $1351$ values and $\log_2 1351 \approx 10.4$, so 11 guesses is right. Time $O(n \log R)$ with $n = 8$ and $R = 1351$; space $O(1)$. Trying every capacity from 400 upward would have taken 271 checks instead of 11.
:::

::: warning Check that it really is monotone
Binary search on the answer silently gives nonsense if feasibility is not monotone. Before you code, say the sentence "if $x$ works, then anything bigger also works, because …" out loud. If you cannot finish the sentence, this is not the pattern.
:::

### Spotting it in two minutes

Listen for "minimum" or "maximum" next to a quantity you could *test* easily but not *compute* directly: the smallest buffer that never overflows, the lowest pump rate that fills the tanks before the countdown hold ends, the shortest time for a set of jobs. If checking one guess is a simple loop, binary search the guess.

## Check yourself

::: check
A hash map is often called "O(1)". Give the more precise statement an interviewer wants to hear, and describe the situation that produces the bad case.
:::

::: answer
Insert, lookup and delete are $O(1)$ **on average** and $O(n)$ **in the worst case**, with $O(n)$ space for the table. The worst case happens when many keys collide into the same slot. The slot's list then grows to hold them all, and every lookup has to walk it, like searching a plain list. A good hash function and a table that grows as it fills make that very unlikely.
:::

::: check
You are given a list of telemetry channel IDs and asked whether any channel appears more than 3 times. Describe a solution and state its time and space complexity.
:::

::: answer
Walk the list once, keeping a dict of counts: `counts[x] = counts.get(x, 0) + 1`. As soon as any count reaches 4, return `True`. If the loop ends, return `False`. Time $O(n)$ on average, since each update is an average $O(1)$. Space $O(k)$ for $k$ distinct IDs, which is at most $O(n)$. Test the empty list (answer `False`) and a list of four identical IDs (answer `True`).
:::

::: check
Run `lower_bound` by hand on `a = [2, 4, 4, 4, 9]` with target $4$. Which index comes back, and why is it not 2 (the middle one)?
:::

::: answer
Start `lo = 0`, `hi = 5`. `mid = 2`, `a[2] = 4`, and $4 \ge 4$, so `hi = 2`. Then `mid = 1`, `a[1] = 4`, $4 \ge 4$, so `hi = 1`. Then `mid = 0`, `a[0] = 2 < 4`, so `lo = 1`. Now `lo = hi = 1`. The answer is index 1.

Lower bound returns the **first** index with $a[i] \ge 4$. Finding a 4 at index 2 is not enough, because there might be an earlier one — so the "might be the answer" branch keeps shrinking `hi` toward the left.
:::

::: check
A teammate writes `hi = mid - 1` in the branch where `a[mid] >= target`. Find an input where their lower bound returns the wrong index.
:::

::: answer
Take `a = [10, 20]` and target $20$. Correct answer: index 1. Their version: `lo = 0`, `hi = 2`, `mid = 1`, and `a[1]` is $20 \ge 20$, so `hi = 0`. Now `lo = hi = 0`, and it returns 0 — pointing at 10, which is smaller than the target. Setting `hi = mid - 1` threw away index 1, the answer itself. It breaks the invariant "the answer is in the range `lo` to `hi`".
:::

::: check
A test stand fills a propellant tank through a pump. The pump rate is a whole number of kilograms per second, and a slow simulation tells you, for any rate, whether the tank reaches its target level before a valve-timing limit. The simulation takes $O(n)$ steps. How do you find the smallest rate that works, and what is the total cost if rates from 1 to 4096 are possible?
:::

::: answer
Faster pumping never makes the tank fill later, so "fills in time" is monotone in the rate: `fail … fail pass … pass`. Binary search the rate on the range 1 to 4096 using the lower-bound loop, calling the simulation as the feasibility check. That takes $\log_2 4096 = 12$ checks, so about $12n$ steps: $O(n \log R)$ time with $R = 4096$, and $O(1)$ extra space beyond the simulation. Trying all 4096 rates would cost $4096n$.
:::

## Summary

| Idea | Cost | When to reach for it |
|---|---|---|
| Hash map (`dict`, `unordered_map`) | average $O(1)$ per operation, worst $O(n)$; $O(n)$ space | counting, "seen it before?", find a partner |
| Set (`set`, `unordered_set`) | same as a hash map | only need "seen or not" |
| Two-sum with a dict | $O(n)$ time, $O(n)$ space | two items adding to a target |
| Lower bound | $O(\log n)$ time, $O(1)$ space | first item at or after a value in sorted data |
| Invariant | answer stays in `lo` to `hi` | decides `mid + 1` versus `mid` |
| Binary search on the answer | $O(n \log R)$ time | minimum capacity, rate or time with a monotone check |

Next lesson sorts things first and then walks them: merging overlapping ground-station contact windows, checking brackets with a stack, and reversing a linked list.

::: context hash-function A recipe that turns a key into a slot
A hash function takes a key — a number, a string, a tuple — and scrambles it into a big whole number. The table then takes the remainder after dividing by its number of slots, and that picks the slot. The same key always gives the same number, so a lookup lands where the insert did.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="34">"GYRO_X"</text>
    <text x="10" y="84">"TEMP_4"</text>
    <text x="10" y="134">"BUS_V"</text>
  </g>
  <rect x="100" y="20" width="80" height="124" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">hash</text>
  <text x="140" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">mod 5</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="72" y1="30" x2="100" y2="30"/><line x1="72" y1="80" x2="100" y2="80"/><line x1="72" y1="130" x2="100" y2="130"/>
    <line x1="180" y1="30" x2="250" y2="50"/><line x1="180" y1="80" x2="250" y2="110"/>
  </g>
  <line x1="180" y1="130" x2="250" y2="50" stroke="#b4232c" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="250" y="12" width="60" height="26"/><rect x="250" y="38" width="60" height="26"/>
    <rect x="250" y="64" width="60" height="26"/><rect x="250" y="90" width="60" height="26"/>
    <rect x="250" y="116" width="60" height="26"/>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="318" y="29">0</text><text x="318" y="55">1</text><text x="318" y="81">2</text><text x="318" y="107">3</text><text x="318" y="133">4</text>
  </g>
  <text x="250" y="162" font-size="11" fill="#b4232c">two keys in slot 1: a collision</text>
</svg>
```
:::

::: context worst-case-hashing When average is not good enough
If an attacker can choose the keys, they can pick ones that all land in the same slot, turning every lookup into a slow walk. This "hash flooding" once slowed real web servers to a crawl. That is why Python scrambles string hashes with a random seed each time it starts. For interviews, the takeaway is simpler: always say "average $O(1)$", and know that the worst case exists.
:::

::: context telemetry-packet-id Why packets carry IDs
Spacecraft telemetry is sent as packets. Each packet carries a header saying which source it came from and a counter that goes up by one with every packet. The common CCSDS space-packet standard calls these the application process ID and the sequence count. Ground software uses them to put packets in order, spot gaps where packets were lost, and throw away duplicates — which is this lesson's problem wearing its work clothes.
:::

::: context loop-invariant A sentence that stays true
An invariant is like the rule "the treasure is in one of these boxes". Each step you open a box and cross off boxes that cannot hold it, but the rule never stops being true. When only one box is left, the rule tells you where the treasure is.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="100" height="30" fill="#6c7a93"/>
    <rect x="120" y="30" width="120" height="30" fill="#fff"/>
    <rect x="240" y="30" width="100" height="30" fill="#8fb8f0"/>
  </g>
  <text x="70" y="50" font-size="11" text-anchor="middle" fill="#fff">all &lt; target</text>
  <text x="180" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">not yet known</text>
  <text x="290" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">all ≥ target</text>
  <line x1="120" y1="64" x2="120" y2="80" stroke="#b4232c" stroke-width="2"/>
  <text x="120" y="96" font-size="12" text-anchor="middle" fill="#b4232c">lo</text>
  <line x1="240" y1="64" x2="240" y2="80" stroke="#b4232c" stroke-width="2"/>
  <text x="240" y="96" font-size="12" text-anchor="middle" fill="#b4232c">hi</text>
  <text x="180" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">each step shrinks the white part</text>
</svg>
```

Everything left of `lo` is known too small; everything from `hi` onward is known big enough. When the white part is empty, `lo` is the first big-enough index.
:::

::: context midpoint-overflow A bug that hid for years
A C++ `int` usually holds numbers up to about 2.1 billion. If `lo` and `hi` are both above about 1.07 billion, `lo + hi` goes past that limit and wraps around to a negative number, and `mid` points nowhere sensible. In 2006 Joshua Bloch wrote about exactly this bug in Java's standard library binary search, which had shipped for years. Writing `lo + (hi - lo) / 2` never adds two big numbers, so it cannot overflow. Python's integers have no size limit, so the Python code here is safe as written.
:::

::: context monotone-feasibility Pass and fail in a row
Lay out every possible answer from small to large and write pass or fail under each. If the row goes fail, fail, fail, then pass forever, feasibility is monotone. The answer you want is the first pass, and lower bound finds it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="40" height="30" fill="#f2b880"/><rect x="60" y="30" width="40" height="30" fill="#f2b880"/>
    <rect x="100" y="30" width="40" height="30" fill="#f2b880"/><rect x="140" y="30" width="40" height="30" fill="#f2b880"/>
    <rect x="180" y="30" width="40" height="30" fill="#8fb8f0"/><rect x="220" y="30" width="40" height="30" fill="#8fb8f0"/>
    <rect x="260" y="30" width="40" height="30" fill="#8fb8f0"/><rect x="300" y="30" width="40" height="30" fill="#8fb8f0"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="40" y="50">fail</text><text x="80" y="50">fail</text><text x="120" y="50">fail</text><text x="160" y="50">fail</text>
    <text x="200" y="50">pass</text><text x="240" y="50">pass</text><text x="280" y="50">pass</text><text x="320" y="50">pass</text>
  </g>
  <text x="20" y="20" font-size="11" fill="#6c7a93">capacity grows →</text>
  <line x1="200" y1="64" x2="200" y2="80" stroke="#b4232c" stroke-width="2"/>
  <text x="200" y="94" font-size="12" text-anchor="middle" fill="#b4232c">the minimum that works</text>
</svg>
```
:::

::: context sol A day on Mars
Mission teams count Mars time in sols. A sol is the time from one Martian noon to the next, about 24 hours and 40 minutes, so a rover's schedule drifts against Earth clocks by about 40 minutes a day. Rover operators plan each sol's activities around the energy the panels or power source can supply, which is why "how much can we do before the battery runs out?" is a real planning question.
:::
