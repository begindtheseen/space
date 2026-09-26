---
id: l03-keys-lambdas-and-sorting
title: Keys, lambdas and sorting
minutes: 20
covers:
  - lambda, map, filter, sorted with key=
---

Picture a teacher lining up a class by height. She does not need a rule for "how to compare two children". She needs one instruction — "use height" — and then she measures each child once, writes the number on a sticky note, and lines them up by the notes. Measure once, compare the numbers.

Python sorts the same way. Every **[[dispersion campaign|dispersion-table]]** — thousands of simulated flights with slightly different inputs — ends in a table, and the first thing anyone does with a table is put it in order. Worst **margin** (how far a result stayed from its limit) first. Then by configuration, and inside each configuration by case number, so a reviewer can find case 214 without searching. Ordering a table is not hard. Yet it is where analysis scripts most often pick up a bug nobody notices, because a wrongly ordered table still looks like a table.

Python's tool is `sorted`, and the part worth learning properly is its `key` argument. You do not tell Python how to compare two rows. You tell it what number or string to pull out of one row — the sticky note — and Python does the comparing. That flip is the whole design, and it makes a whole family of bugs impossible to write.

This lesson also covers the small functions that go with a key: `lambda`, `operator.itemgetter`, and two older tools, `map` and `filter`. Comprehensions have replaced most uses of `map` and `filter`, and the lesson says plainly which uses remain.

## sorted takes a key, and calls it once per item

`sorted(iterable, key=f)` calls the function `f` on each item, once, and puts the items in order of the values that came back. You can watch it happen by counting the calls:

```python
# keycalls.py
import math

CALLS = {"n": 0}


def severity(case):
    """A deliberately expensive key: count how often sorted() calls it."""
    CALLS["n"] += 1
    return math.sqrt(case["q_max_kpa"] ** 2 + case["alpha_max_deg"] ** 2)


cases = [
    {"id": 7, "q_max_kpa": 33.1, "alpha_max_deg": 4.2},
    {"id": 2, "q_max_kpa": 29.8, "alpha_max_deg": 6.1},
    {"id": 9, "q_max_kpa": 35.4, "alpha_max_deg": 2.0},
    {"id": 4, "q_max_kpa": 31.0, "alpha_max_deg": 5.5},
    {"id": 1, "q_max_kpa": 34.9, "alpha_max_deg": 3.3},
]

ranked = sorted(cases, key=severity)
print([c["id"] for c in ranked])
print("key called", CALLS["n"], "times for", len(cases), "cases")
```

```bash
python3 keycalls.py
# [2, 4, 7, 1, 9]
# key called 5 times for 5 cases
```

Each case records its peak dynamic pressure `q_max_kpa` and its peak **[[angle of attack|angle-of-attack]]** `alpha_max_deg`. The key function `severity` combines them into one made-up score, $\sqrt{q^2 + \alpha^2}$. Notice that you pass `severity` itself, with no brackets after it: `key=severity` hands over the function, and `sorted` does the calling.

Check the order by hand. The five scores come out as about 30.42 (case 2), 31.48 (case 4), 33.37 (case 7), 35.06 (case 1) and 35.46 (case 9). Smallest first, so the printed order `[2, 4, 7, 1, 9]` is right.

Now the count. Five calls for five cases — not one call per comparison, and a five-item sort makes several comparisons. That matters when the key is expensive: a key that reads a file, or runs a trajectory, is still called once per row, however many comparisons the sort makes. This is why a key function is allowed to be slow, and why Python 3 **[[dropped the old `cmp=` argument|cmp-removed]]**, which called your code once per comparison.

::: key
`sorted(it, key=f)` returns a new list, ordered by `f(item)`, with `f` called exactly once per item. `it.sort(key=f)` does the same in place, only for lists, and returns `None`. Both are **[[stable|stable-sort]]**: items with equal keys stay in their original relative order.
:::

::: example The tuple trick, and the bug it hides
Before `key=` existed, people "decorated" each item with its sort value in a pair, sorted the pairs, then stripped the decoration off. The naive version reads fine and fails on a tie:

```python
# decorate.py
from operator import itemgetter

cases = [
    {"id": 7, "config": "hot_high", "margin": 1.42},
    {"id": 9, "config": "hot_high", "margin": 0.61},
    {"id": 3, "config": "nominal", "margin": 0.61},
]

try:
    decorated = [(c["margin"], c) for c in cases]
    decorated.sort()
    ranked = [c for _, c in decorated]
    print([c["id"] for c in ranked])
except TypeError as exc:
    print("TypeError:", exc)

ranked = sorted(cases, key=itemgetter("margin"))
print([c["id"] for c in ranked])
```

```bash
python3 decorate.py
# TypeError: '<' not supported between instances of 'dict' and 'dict'
# [9, 3, 7]
```

Here is what went wrong, step by step:

1. Each pair is `(margin, case_dict)`.
2. Python compares tuples one element at a time, like words in a dictionary: first elements first, and only on a tie does it look at the second.
3. Cases 9 and 3 both have margin `0.61`. So Python moves on to compare the two dicts — and dicts have no "less than". It raises `TypeError`. (Read `<` as "less than".)

The failure appears only when two rows tie. In a dispersion table, that means it appears on the day the numbers happen to line up, and not before. You cannot test your way to confidence in that code. (The careful old version put the item's position in the middle, `(margin, i, case)`, so ties never reached the dicts — one more thing to remember to do.)

`sorted(cases, key=itemgetter("margin"))` never compares a case to a case. It compares only the key values, and stability settles the tie: case 9 came before case 3 in the input, so it stays before it. The bug is not fixed; it is impossible to write. That is the strongest kind of argument for an idiom.
:::

## lambda: a function without a name, where a name would be noise

`lambda args: expression` makes a small function out of a single expression, with no `def` and no name. Read `lambda r: r[1]` aloud as "a function of `r` that gives `r[1]`". The word itself **[[comes from mathematics|lambda-name]]**.

As a sort key it is exactly right, because the function exists for one line, and naming it would add a line without adding meaning:

```python
>>> rows = [('a', 2), ('b', 1)]
>>> rows.sort(key=lambda r: r[1])
>>> rows
[('b', 1), ('a', 2)]
```

The key pulls out the number in each pair, so the pair with `1` comes first.

Where a lambda is wrong is when you give it a name anyway:

```python
>>> square = lambda x: x * x
>>> square.__name__
'<lambda>'
>>> def square2(x): return x * x
>>> square2.__name__
'square2'
```

`square` and `square2` do the same arithmetic. But the first has lost its name. Every error report that passes through it says `<lambda>`, `help()` has nothing useful to show, and a speed profiler reports time spent in "an anonymous function". You paid a real cost to save the word `def`. This is the one rule about `lambda` that **[[style guides agree on|pep8-lambda]]**: if it gets a name, use `def`.

::: warning A lambda in a loop remembers the variable, not the value
A `lambda` written inside a loop looks up the loop variable when it is *called*, not when it is made. This catches people who build a list of key functions:

```python
# latebind.py
from operator import itemgetter

row = ("hot_high", 9, 0.61)

lambdas = [lambda r: r[i] for i in range(3)]
print([f(row) for f in lambdas])

getters = [itemgetter(i) for i in range(3)]
print([f(row) for f in getters])
```

```bash
python3 latebind.py
# [0.61, 0.61, 0.61]
# ['hot_high', 9, 0.61]
```

All three lambdas look up `i` when they are called. By then the comprehension has finished, and `i` is `2`. So **[[all three read field 2|late-binding]]**. `itemgetter(i)` instead stores the value of `i` at the moment it is built, so the three getters pull out three different fields.

You can repair the lambda with a default argument, `lambda r, i=i: r[i]`, which copies the current value in when the lambda is made. But the getter is the form to reach for — a correctness argument, not a style one.
:::

## operator.itemgetter and attrgetter

The `operator` module has ready-made functions for the most common keys.

- `itemgetter(k)` returns a function that does `x[k]` — "the item at `k`". It works on tuples, lists and dicts.
- `attrgetter("name")` returns a function that does `x.name` — "the attribute called `name`", for objects like the classes in the next lesson.

They read as what they are: "the field at index 2", "the `margin` attribute". A lambda makes you read a function body to learn the same thing. `itemgetter` can also take several keys at once and return a tuple: `itemgetter(0, 1)` turns `('x', 2, 3)` into `('x', 2)`. That is the short way to write a key with two fields.

Are they faster? A little. Timed on this machine with

```bash
python3 -m timeit -s "import random; rows = [(random.random(), i, random.random()) for i in range(100_000)]" "sorted(rows, key=lambda r: r[2])"
python3 -m timeit -s "import random; from operator import itemgetter; rows = [(random.random(), i, random.random()) for i in range(100_000)]" "sorted(rows, key=itemgetter(2))"
```

the lambda key took about 32 ms per sort of 100,000 rows and `itemgetter` about 27 ms. That is around 15 percent, or 5 milliseconds — too small to matter next to whatever produced the 100,000 rows. Prefer `itemgetter` because it names the operation and cannot fall into the late-binding trap above, not because of speed.

## Two keys, and the use of stability

Sorting by a main field and then a tie-breaking field has two correct spellings.

**First spelling: return a tuple from the key.** Tuples compare left to right, so the first field decides and the second breaks ties:

```python
>>> results = [('hot_high', 7, 1.42), ('cold_low', 2, 0.88), ('nominal', 4, 1.42)]
>>> sorted(results, key=lambda r: (r[0], -r[2]))
[('cold_low', 2, 0.88), ('hot_high', 7, 1.42), ('nominal', 4, 1.42)]
```

This orders by configuration name A to Z, and within a name by margin from largest to smallest. The minus sign in `-r[2]` flips the direction for that field alone.

**Second spelling: sort twice, tie-breaker first.** Stability then keeps the first order inside each group of equal main keys:

```python
# stability.py
from operator import itemgetter

results = [
    ("hot_high", 7, 1.42),
    ("cold_low", 2, 0.88),
    ("hot_high", 9, 0.61),
    ("nominal", 4, 1.42),
    ("cold_low", 1, 2.07),
    ("nominal", 3, 0.61),
]

by_case = sorted(results, key=itemgetter(1))
by_margin_then_case = sorted(by_case, key=itemgetter(2))
for row in by_margin_then_case:
    print(row)
```

```bash
python3 stability.py
# ('nominal', 3, 0.61)
# ('hot_high', 9, 0.61)
# ('cold_low', 2, 0.88)
# ('nominal', 4, 1.42)
# ('hot_high', 7, 1.42)
# ('cold_low', 1, 2.07)
```

The first sort put the rows in case order: 1, 2, 3, 4, 7, 9. The second sort ordered by margin. The two margins of 0.61 came out as case 3 then case 9, and the two of 1.42 as case 4 then case 7. The case order from the first sort survived inside each tie. That is stability doing its job.

The tuple key is better when you can write it. The two-pass form is for when you cannot: when the tie-breaker is not something you can turn into a comparable value, or when the two fields go in different directions and one of them is a string, which you cannot negate.

::: key
`sorted(items, key=f)` returns a new list and works on any iterable; `list.sort` mutates in place and returns `None`. Both are stable, which is what lets you sort by a secondary key first and a primary key second.
:::

`reverse=True` flips the order of the keys but *not* the tie-breaking: equal keys still keep their original order. So with ties, `sorted(xs, key=f, reverse=True)` is not the same as `list(reversed(sorted(xs, key=f)))`:

```python
>>> from operator import itemgetter
>>> xs = [('a', 1), ('b', 1), ('c', 0)]
>>> sorted(xs, key=itemgetter(1), reverse=True)
[('a', 1), ('b', 1), ('c', 0)]
>>> list(reversed(sorted(xs, key=itemgetter(1))))
[('b', 1), ('a', 1), ('c', 0)]
```

Both put the `1`s before the `0`. They differ only in which of the two tied rows comes first.

`min` and `max` take the same `key`, and both return the *first* item that reaches the extreme:

```python
>>> from operator import itemgetter
>>> results = [('hot_high', 9, 0.61), ('nominal', 3, 0.61), ('cold_low', 1, 2.07)]
>>> min(results, key=itemgetter(2))
('hot_high', 9, 0.61)
>>> max(results, key=itemgetter(2))
('cold_low', 1, 2.07)
```

Two rows tie at 0.61, and `min` returned the one that came first. `min(results, key=...)` is the natural way to find the worst case. It beats `sorted(results, key=...)[0]` for the same reason `islice` beat slicing a list in the last lesson: sorting the whole table to find one row does **[[work that grows faster than the table|n-log-n]]**.

::: example Worst case per configuration, and the groupby trap
`itertools.groupby` collects **[[neighbouring items with equal keys|groupby-runs]]** into groups. It does *not* gather scattered ones, and when you forget that, it fails silently:

```python
# worst_per_config.py
from itertools import groupby
from operator import itemgetter

results = [
    ("hot_high", 7, 1.42),
    ("cold_low", 2, 0.88),
    ("hot_high", 9, 0.61),
    ("nominal", 4, 1.42),
    ("cold_low", 1, 2.07),
    ("nominal", 3, 0.61),
]

print("--- groupby without sorting first ---")
for config, rows in groupby(results, key=itemgetter(0)):
    print(config, [r[1] for r in rows])

print("--- groupby on data sorted by the same key ---")
by_config = sorted(results, key=itemgetter(0))
for config, rows in groupby(by_config, key=itemgetter(0)):
    worst = min(rows, key=itemgetter(2))
    print(f"{config:9s} worst margin {worst[2]:.2f} in case {worst[1]}")
```

```bash
python3 worst_per_config.py
# --- groupby without sorting first ---
# hot_high [7]
# cold_low [2]
# hot_high [9]
# nominal [4]
# cold_low [1]
# nominal [3]
# --- groupby on data sorted by the same key ---
# cold_low  worst margin 0.88 in case 2
# hot_high  worst margin 0.61 in case 9
# nominal   worst margin 0.61 in case 3
```

Read the two halves:

1. Without sorting, every row's configuration differs from the row before it. So `groupby` made six groups of one, and reported `hot_high` twice. In a summary table that looks like a duplicated row, not an error.
2. Sorted by configuration first, equal names sit next to each other: two `cold_low`, then two `hot_high`, then two `nominal`. Now there are three groups, and `min` picks the smallest margin in each.

Check one by hand: `hot_high` has cases 7 (margin 1.42) and 9 (margin 0.61). The worst is 0.61, case 9. Correct.

That is the rule: **groupby requires its input sorted by the grouping key**, using the same key function for both.

The format `{config:9s}` pads the name to 9 characters so the columns line up. And note that each group `rows` is itself a lazy iterator, valid only until the loop moves to the next group. Using it once, as `min` does here, is fine. Keeping it for later is not; `list(rows)` is the fix if you need it twice.
:::

## map and filter, and where comprehensions took over

`map(f, it)` applies `f` to each item. `filter(p, it)` keeps the items where `p(item)` is true. In Python 3 both return lazy iterators, so they behave like the generators of the last lesson — one pass only:

```python
>>> parts = '12.500,0.013,-0.004'.split(',')
>>> list(map(float, parts))
[12.5, 0.013, -0.004]
>>> [float(p) for p in parts]
[12.5, 0.013, -0.004]
>>> m = map(float, parts)
>>> list(m)
[12.5, 0.013, -0.004]
>>> list(m)
[]
```

The case for `map` is the first line: the function already exists and has a name, so `map(float, parts)` says "turn each of these into a float" without inventing a throwaway variable. The case against is everything else. `map(lambda p: float(p) * 2, parts)` is longer and harder to read than `[float(p) * 2 for p in parts]`. And `filter(lambda r: r[2] > 1.0, rows)` is longer than `(r for r in rows if r[2] > 1.0)`, while giving up the ability to change each item at the same time.

The rule: use `map` when the function is a named one you did not have to write. Use a comprehension or a generator expression otherwise. Python's own history **[[nearly dropped both tools|map-filter-history]]** for this reason.

::: warning Two first-week failures
`rows.sort()` returns `None`. So `rows = rows.sort()` sorts the list and then throws it away, leaving `rows` holding `None`. It is `sorted(rows)` that returns a list.

And a sort with no key over mixed types raises rather than inventing an order:

```python
>>> sorted([3, 'x', 1])
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: '<' not supported between instances of 'str' and 'int'
```

In telemetry work this usually means a column that is numeric except where the logger wrote a **[[missing value|nan-in-sorts]]** as the text `"n/a"`. The sort is telling you about a parsing bug two functions earlier.
:::

## Check yourself

::: check
A key function opens a results file and reads one number from it. Sorting 500 cases, roughly how many times is that file opened — 500 times, or something like $500\log_2 500$ times?
:::

::: answer
500. `sorted` computes every key first, once per item, and then orders the items by those values. The comparisons are between the keys, not the original objects.

That is the direct benefit of `key=` over a comparison function, which is called once per comparison — on the order of $500\log_2 500 \approx 4{,}500$ times. (A real run of Python's sort with a counting comparison function on 500 random numbers made about 3,800 calls.)

If even 500 calls is too many, compute the values once yourself and sort a list of pairs. But then keep the value first and something that is always comparable second — the item's position, say — for the reason the decorate example showed.
:::

::: check
Write the key that orders a results table by configuration name A to Z and, within each configuration, by margin from largest to smallest.
:::

::: answer
```python
sorted(results, key=lambda r: (r[0], -r[2]))
```

The tuple compares left to right, so the configuration name decides first, and the negated margin breaks ties. Negating flips the direction for that field alone. `reverse=True` could not do this, because it flips everything.

Negation works only on numbers. If the tie-breaking field were a string to be ordered Z to A, use the two-pass form: sort by the string with `reverse=True` first, then by the configuration name, and let stability keep the first order inside each group.
:::

::: check
`min(cases, key=margin)` and `sorted(cases, key=margin)[0]` return the same case. Give one reason to prefer each.
:::

::: answer
Prefer `min` when you want one case. It makes a single pass and calls `margin` once per case. `sorted` orders the entire table only to let you look at one row — wasted work that grows like the table size times its logarithm.

Prefer `sorted(...)[0]` when you are about to want the second and third worst as well, or the whole ranking for a report. Then the sort is not waste; it is what you needed, and taking `[0]` costs nothing extra.

One behaviour to know: on a tie, both give the first such item in the original order, so they agree. But on an empty input, `min` raises `ValueError`, while `sorted(...)[0]` raises `IndexError`.
:::

::: check
Why does the lesson call `[lambda r: r[i] for i in range(3)]` a correctness problem rather than a style problem?
:::

::: answer
Because all three functions look up `i` when they are called, not when they are made. By then the comprehension has finished with `i` equal to `2`, so every one of them pulls out field 2. A program that builds one key function per column would quietly sort every column by the last one. Nothing raises; the table is in the wrong order.

`[itemgetter(i) for i in range(3)]` stores the value of `i` when each getter is built, so each keeps its own index. The lambda can be fixed with `lambda r, i=i: r[i]`, which captures the value as a default argument. But a reader has to know that trick to see that it is correct, while the getter is plainly correct.
:::

::: check
A script groups 2,000 dispersion results by configuration with `itertools.groupby` and reports one line per group. The report has 47 lines for 6 configurations. What went wrong, and how do you know it is not a data problem?
:::

::: answer
The input was not sorted by the grouping key. `groupby` starts a new group every time the key changes between neighbouring items. A table in case-number order starts a new group each time a row's configuration differs from the row before — here, 47 runs of neighbouring equal configurations.

You know it is not a data problem because the configuration *names* repeat across those 47 lines. Forty-seven genuinely different configurations would show 47 different names. The fix is one line before the `groupby`: `results.sort(key=itemgetter(0))`, using the same key function for both.
:::

## Summary

| Item | Statement |
| --- | --- |
| `sorted(it, key=f)` | New list ordered by `f(item)`; works on any iterable; `f` called exactly once per item |
| `it.sort(key=f)` | In place, lists only, returns `None` |
| Stability | Equal keys keep their original relative order, including under `reverse=True` |
| Two fields | Tuple key `lambda r: (r[0], -r[2])`, or two stable sorts, secondary first |
| `min` / `max` with `key` | One pass, returns the first item reaching the extreme |
| `lambda args: expr` | Nameless single-expression function; never assign one to a name |
| Late binding | A `lambda` in a loop captures the variable, not its value; `itemgetter(i)` captures the value |
| `operator.itemgetter(k)` | `x[k]` as a function; several keys give a tuple; works on dicts too |
| `map(f, it)` | Lazy; worth it when `f` is an existing named function, as in `map(float, parts)` |
| `filter(p, it)` | Lazy; usually clearer as `(x for x in it if ...)` |
| `itertools.groupby` | Groups *neighbouring* equal keys; sort by the same key first or the groups are wrong |
| Measured here | Lambda key about 32 ms, `itemgetter` about 27 ms per 100,000-row sort, `python3 -m timeit` |

The next lesson moves from functions to objects. A results row has been a tuple or a dict so far, and both make you remember what index 2 means. A class gives the row a name, and gives the operations that belong to it somewhere to live.

::: context dispersion-table What a dispersion table looks like
After a Monte Carlo campaign — the same flight simulated thousands of times with every uncertain input drawn at random — each run becomes one row: a case number, the configuration it belongs to (a hot day at a high-altitude site, say), and the peak value of every quantity that has a limit.

Each limit gives a **margin**: how far the worst value stayed from the limit. A margin of 0.61 on a scale where zero means "right at the limit" is thin. Reviewers read these tables worst-first, which is why sorting them correctly is not a detail.
:::

::: context angle-of-attack Angle of attack
The **angle of attack**, written $\alpha$ (the Greek letter "alpha"), is the angle between the direction the vehicle's nose points and the direction the air is flowing past it. Flying straight into the airflow, it is zero.

For a rocket climbing through the thick lower air, a large $\alpha$ at high dynamic pressure pushes sideways on a long, thin structure — the kind of load that can bend it. That is why the product $q\alpha$ is watched closely near max-q, and why both appear in the example's score.
:::

::: context cmp-removed How comparison functions were retired
In Python 2 you could pass `sorted` a `cmp=` function that took two items and returned a negative number, zero or a positive number to say which came first. Python called it for every comparison the sort made.

Python 3 removed `cmp=` entirely and kept only `key=`, which is simpler to write and called far fewer times. For the rare old comparison function you cannot rewrite, the standard library keeps an adapter, `functools.cmp_to_key`, which wraps it up as a key.
:::

::: context stable-sort What "stable" means, in a picture
A sort is **stable** if items with equal keys come out in the same order they went in. Sort by case number first, then by margin: inside each margin tie, the case order survives.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="60" y="16" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">by case</text>
  <text x="290" y="16" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">then by margin</text>
  <g font-size="11" fill="#1f2a44">
    <rect x="10" y="26" width="100" height="18" fill="#ffffff" stroke="#1f2a44"/><text x="16" y="39">case 1 · 2.07</text>
    <rect x="10" y="46" width="100" height="18" fill="#ffffff" stroke="#1f2a44"/><text x="16" y="59">case 2 · 0.88</text>
    <rect x="10" y="66" width="100" height="18" fill="#8fb8f0" stroke="#1f2a44"/><text x="16" y="79">case 3 · 0.61</text>
    <rect x="10" y="86" width="100" height="18" fill="#f2b880" stroke="#1f2a44"/><text x="16" y="99">case 4 · 1.42</text>
    <rect x="10" y="106" width="100" height="18" fill="#f2b880" stroke="#1f2a44"/><text x="16" y="119">case 7 · 1.42</text>
    <rect x="10" y="126" width="100" height="18" fill="#8fb8f0" stroke="#1f2a44"/><text x="16" y="139">case 9 · 0.61</text>
    <rect x="240" y="26" width="100" height="18" fill="#8fb8f0" stroke="#1f2a44"/><text x="246" y="39">case 3 · 0.61</text>
    <rect x="240" y="46" width="100" height="18" fill="#8fb8f0" stroke="#1f2a44"/><text x="246" y="59">case 9 · 0.61</text>
    <rect x="240" y="66" width="100" height="18" fill="#ffffff" stroke="#1f2a44"/><text x="246" y="79">case 2 · 0.88</text>
    <rect x="240" y="86" width="100" height="18" fill="#f2b880" stroke="#1f2a44"/><text x="246" y="99">case 4 · 1.42</text>
    <rect x="240" y="106" width="100" height="18" fill="#f2b880" stroke="#1f2a44"/><text x="246" y="119">case 7 · 1.42</text>
    <rect x="240" y="126" width="100" height="18" fill="#ffffff" stroke="#1f2a44"/><text x="246" y="139">case 1 · 2.07</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5"><line x1="110" y1="75" x2="240" y2="35"/><line x1="110" y1="135" x2="240" y2="55"/></g>
  <g stroke="#b4232c" stroke-width="1.5"><line x1="110" y1="95" x2="240" y2="95"/><line x1="110" y1="115" x2="240" y2="115"/></g>
</svg>
```

The lines never cross within a colour: tied rows keep their earlier order. Python's sort, **Timsort**, written by Tim Peters for Python in 2002, guarantees this.
:::

::: context lambda-name Why "lambda"
The name comes from the **lambda calculus**, a mathematical system for describing functions invented by the logician Alonzo Church in the 1930s. In it, the Greek letter lambda, λ, marks "here is a function of this variable", much as Python's `lambda r:` does.

Many programming languages borrowed the word for small nameless functions. Python's version is deliberately limited to a single expression: no statements, no loops, no assignments. If you need more, that is a sign you need a `def`.
:::

::: context pep8-lambda What the style guide says
Python's official style guide is **PEP 8**. It says to always use a `def` statement instead of assigning a lambda to a name — `def f(x): return 2 * x`, not `f = lambda x: 2 * x`.

The reason is the one in the lesson: a `def` gives the function a real name, which shows up in error reports and in `help()`. The lambda's whole advantage is being usable inside a larger expression, like a `key=` argument, and assigning it to a name throws that advantage away.
:::

::: context late-binding One shared i
Each lambda remembers *where* to find `i`, not what `i` was. All three point at the same `i`, which ends at `2`. Each getter carries its own copy of the number.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <rect x="10" y="14" width="70" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="16" y="29">lambda 1</text>
    <rect x="10" y="44" width="70" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="16" y="59">lambda 2</text>
    <rect x="10" y="74" width="70" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="16" y="89">lambda 3</text>
  </g>
  <rect x="130" y="38" width="60" height="34" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="160" y="60" font-size="13" text-anchor="middle" fill="#1f2a44">i = 2</text>
  <g stroke="#b4232c" stroke-width="1.5">
    <line x1="80" y1="25" x2="130" y2="48"/><line x1="80" y1="55" x2="130" y2="55"/><line x1="80" y1="85" x2="130" y2="62"/>
  </g>
  <text x="100" y="118" font-size="11" text-anchor="middle" fill="#b4232c">all read field 2</text>
  <g font-size="11" fill="#1f2a44">
    <rect x="230" y="14" width="120" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="236" y="29">itemgetter(0)</text>
    <rect x="230" y="44" width="120" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="236" y="59">itemgetter(1)</text>
    <rect x="230" y="74" width="120" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="236" y="89">itemgetter(2)</text>
  </g>
  <text x="290" y="118" font-size="11" text-anchor="middle" fill="#1d6fd1">each keeps its own index</text>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#6c7a93">the lambdas are called after the loop has finished</text>
</svg>
```

This behaviour has a name, **late binding**: a name inside a function is looked up when the function runs. You met it in the closures lesson of the Python basics module; here it is again, inside a sort key.
:::

::: context n-log-n How fast sorting grows
Sorting $n$ items with comparisons takes on the order of $n \log_2 n$ comparisons — read "n log n". For 500 items, $500 \times \log_2 500 \approx 500 \times 8.97 \approx 4{,}480$. For a million items it is about 20 million.

Finding the minimum takes exactly $n - 1$ comparisons: look at each item once, keep the smallest so far. So for one worst case, `min` wins by a factor of about $\log_2 n$ — around 20 for a million rows — and uses no extra memory for a sorted copy.
:::

::: context groupby-runs Groups are runs of neighbours
`groupby` walks the list once and starts a new group whenever the key differs from the previous item's key. It never looks back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" fill="#1f2a44">unsorted: 6 groups</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="24" width="54" height="24" fill="#8fb8f0"/><rect x="68" y="24" width="54" height="24" fill="#ffffff"/>
    <rect x="126" y="24" width="54" height="24" fill="#8fb8f0"/><rect x="184" y="24" width="54" height="24" fill="#f2b880"/>
    <rect x="242" y="24" width="54" height="24" fill="#ffffff"/><rect x="300" y="24" width="54" height="24" fill="#f2b880"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="37" y="40">hot</text><text x="95" y="40">cold</text><text x="153" y="40">hot</text>
    <text x="211" y="40">nom</text><text x="269" y="40">cold</text><text x="327" y="40">nom</text>
  </g>
  <text x="10" y="76" font-size="12" fill="#1f2a44">sorted: 3 groups</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="84" width="112" height="24" fill="#ffffff"/><rect x="126" y="84" width="112" height="24" fill="#8fb8f0"/>
    <rect x="242" y="84" width="112" height="24" fill="#f2b880"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1" stroke-dasharray="3,3">
    <line x1="66" y1="84" x2="66" y2="108"/><line x1="182" y1="84" x2="182" y2="108"/><line x1="298" y1="84" x2="298" y2="108"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="37" y="100">cold</text><text x="95" y="100">cold</text><text x="153" y="100">hot</text>
    <text x="211" y="100">hot</text><text x="269" y="100">nom</text><text x="327" y="100">nom</text>
  </g>
  <text x="180" y="126" font-size="11" text-anchor="middle" fill="#6c7a93">each solid box is one group</text>
</svg>
```

It behaves like the shell's `uniq`, which also only merges neighbouring duplicate lines — and is also used after `sort` for the same reason.
:::

::: context map-filter-history The tools Python nearly dropped
In 2005, Python's creator Guido van Rossum wrote that he wanted to remove `lambda`, `map`, `filter` and `reduce` from Python 3, since comprehensions and generator expressions covered their uses more readably.

In the end all four stayed, with changes. `map` and `filter` became lazy iterators instead of returning lists. `reduce`, which folds a whole sequence into one value, was moved out of the built-ins into the `functools` module. That compromise is why today's advice is "comprehension by default, `map` for a ready-made named function".
:::

::: context nan-in-sorts Missing values and NaN
Loggers mark a missing reading in different ways: an empty field, the text `"n/a"`, or the special floating-point value **NaN**, "not a number". Text in a number column makes a sort fail loudly, which is good.

NaN is worse. Every comparison with NaN is `False` — NaN is neither less than, greater than, nor equal to anything, even itself. So a list with a NaN in it sorts without any error but may come out in the wrong order: `sorted([3.0, float('nan'), 1.0, 2.0])` gives `[3.0, nan, 1.0, 2.0]`. Filter NaNs out, or handle them explicitly, before you sort.
:::
