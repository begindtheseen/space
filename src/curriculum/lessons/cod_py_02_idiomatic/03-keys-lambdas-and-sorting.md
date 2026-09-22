---
id: l03-keys-lambdas-and-sorting
title: Keys, lambdas and sorting
minutes: 17
covers:
  - lambda, map, filter, sorted with key=
---

Every dispersion campaign ends in a table, and the first thing anyone does with a table is order it. Worst margin first. Then by configuration, and within a configuration by case number, so that the reviewer can find case 214 without searching. Ordering a table is not a hard problem, and it is nonetheless the place where analysis scripts most often acquire a bug that nobody notices, because a wrongly-ordered table still looks like a table.

Python's answer is `sorted`, and the part of it worth learning properly is the `key` argument. You do not tell Python how to compare two rows; you tell it what number or string to extract from one row, and it does the comparing. That inversion is the whole design, and it removes a family of bugs that the older decorate-sort-undecorate style could not.

This lesson also covers the small functions that go with a key: `lambda`, `operator.itemgetter`, and the two survivors from Python's functional years, `map` and `filter`. The honest position on `map` and `filter` is that comprehensions replaced most of their uses, and the lesson says which uses remain rather than pretending the choice is even.

## sorted takes a key, and calls it once per item

`sorted(iterable, key=f)` calls `f` on each item, once, and orders the items by the values that came back. You can watch it happen by counting:

```python
# keycalls.py
import math

CALLS = {"n": 0}


def margin(case):
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

ranked = sorted(cases, key=margin)
print([c["id"] for c in ranked])
print("key called", CALLS["n"], "times for", len(cases), "cases")
```

```bash
python3 keycalls.py
# [2, 4, 7, 1, 9]
# key called 5 times for 5 cases
```

Five calls for five cases — not one call per comparison, of which a five-element sort makes several. That matters when the key is expensive: a key that reads a file, or integrates a trajectory, is evaluated once per row no matter how many comparisons the sort performs. This is why `key=` replaced the old `cmp=` argument entirely, and why a key function is allowed to be slow.

::: key
`sorted(it, key=f)` returns a new list, ordered by `f(item)`, with `f` called exactly once per item. `it.sort(key=f)` does the same in place, only for lists, and returns `None`. Both are stable: items with equal keys stay in their original relative order.
:::

::: example The tuple trick, and the bug it hides
Before `key=` existed, you decorated each item with its sort value, sorted the pairs, and stripped the decoration. It reads plausibly and it fails on a tie:

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

Tuples compare element by element. When two margins are equal, the comparison falls through to the second element — the case dictionaries — and dictionaries have no order, so the sort raises. The failure only appears when two rows tie, which in a dispersion table means it appears on the day the numbers happen to line up and not before. You cannot test your way to confidence in that code; you can only write the other version.

`sorted(cases, key=itemgetter("margin"))` never compares a case to a case. It compares only the values the key returned, and the stability rule decides the tie. The bug is not fixed, it is unwritable, and that is the strongest kind of argument for an idiom.
:::

## lambda: a function without a name, for where a name would be noise

`lambda args: expression` is a function object, made from a single expression, with no `def` and no name. As a sort key it is exactly right, because the function exists for one line and naming it would add a line without adding information:

```python
>>> rows = [('a', 2), ('b', 1)]
>>> rows.sort(key=lambda r: r[1])
>>> rows
[('b', 1), ('a', 2)]
```

Where it is wrong is assigning one to a name:

```python
>>> square = lambda x: x * x
>>> square.__name__
'<lambda>'
>>> def square2(x): return x * x
>>> square2.__name__
'square2'
```

`square` and `square2` do the same arithmetic, but the first has lost its name, which means every traceback through it says `<lambda>`, `help()` has nothing to show, and a profiler reports time spent in an anonymous function. You paid a real cost to save the word `def`. This is the one rule about `lambda` that style guides agree on: if it gets a name, use `def`.

::: warning
A `lambda` written inside a loop closes over the loop *variable*, not its current value, and this catches people building a list of key functions:

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

All three lambdas look up `i` when they are *called*, by which time the comprehension has finished and `i` is 2. `itemgetter(i)` captures the value at the moment it is constructed, so the three getters extract three different fields. The lambda version can be repaired with a default argument, `lambda r, i=i: r[i]`, but the getter is the form to reach for, and that is a correctness argument rather than a style one.
:::

## operator.itemgetter and attrgetter

`itemgetter(k)` returns a function that performs `x[k]`; `attrgetter("name")` returns one that performs `x.name`. They read as what they are — "the field at index 2", "the `margin` attribute" — where a lambda makes you parse a function body to learn the same thing. `itemgetter` takes several keys at once and returns a tuple, which is the compact spelling of a multi-field key: `itemgetter(0, 1)`.

They are not, on the evidence, meaningfully faster. Timed on this machine with

```bash
python3 -m timeit -s "import random; rows = [(random.random(), i, random.random()) for i in range(100_000)]" "sorted(rows, key=lambda r: r[2])"
python3 -m timeit -s "import random; from operator import itemgetter; rows = [(random.random(), i, random.random()) for i in range(100_000)]" "sorted(rows, key=itemgetter(2))"
```

both came out near 23 ms per sort of 100,000 rows, the getter ahead by a few percent and the gap smaller than the variation between runs. Prefer `itemgetter` because it names the operation and because of the late-binding trap above, not because of speed.

## Two keys, and the use of stability

Sorting by a primary and a secondary field has two correct spellings. Return a tuple from the key:

```python
>>> results = [('hot_high', 7, 1.42), ('cold_low', 2, 0.88), ('nominal', 4, 1.42)]
>>> sorted(results, key=lambda r: (r[0], -r[2]))
[('cold_low', 2, 0.88), ('hot_high', 7, 1.42), ('nominal', 4, 1.42)]
```

Or sort twice, secondary key first, relying on stability to preserve it inside groups of equal primary keys:

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

The two margins of 0.61 came out as case 3 then case 9, and the two of 1.42 as case 4 then case 7: the case ordering from the first sort survived inside each tie. The tuple key is better when you can write it; the two-pass form is what you use when the secondary order comes from something you cannot express as a comparable value, or when the descending direction differs between the two fields and negation is not available because one of them is a string.

`reverse=True` reverses the ordering but not the tie-breaking: equal keys keep their original relative order either way. So `sorted(xs, reverse=True)` is not `list(reversed(sorted(xs)))` when there are ties, and the difference is exactly which of two equal rows appears first.

`min` and `max` take the same `key`, and both return the *first* item achieving the extreme:

```python
>>> from operator import itemgetter
>>> results = [('hot_high', 9, 0.61), ('nominal', 3, 0.61), ('cold_low', 1, 2.07)]
>>> min(results, key=itemgetter(2))
('hot_high', 9, 0.61)
>>> max(results, key=itemgetter(2))
('cold_low', 1, 2.07)
```

`min(results, key=...)` is the idiomatic "worst case", and it is better than `sorted(results, key=...)[0]` for the same reason `islice` beat slicing a list in the last lesson: sorting to find one element does work proportional to the whole table.

::: example Worst case per configuration, and the groupby trap
`itertools.groupby` collapses *consecutive* equal keys into groups. It does not gather scattered ones, and the failure is silent:

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

The first block produced six groups of one and reported `hot_high` twice, which in a summary table looks like a duplicated row rather than an error. The second sorted by the same key first, which is the rule: **groupby requires its input sorted by the grouping key**.

Note the group `rows` is itself a lazy iterator, valid only until the loop advances to the next group. Consuming it once, as `min` does here, is fine; storing it for later is not, and `list(rows)` is the fix if you need it twice.
:::

## map and filter, and where comprehensions took over

`map(f, it)` applies `f` to each item; `filter(p, it)` keeps the items where `p(item)` is true. Both return lazy iterators in Python 3, so they behave like the generators of the last lesson:

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

The case for `map` is the one on the second line: the function already exists and has a name, so `map(float, parts)` says "float each of these" with no placeholder variable invented to say it. The case against is everything else. `map(lambda p: float(p) * 2, parts)` is longer and slower to read than `[float(p) * 2 for p in parts]`, and `filter(lambda r: r[2] > 1.0, rows)` is longer than `(r for r in rows if r[2] > 1.0)` while giving up the ability to transform at the same time.

Use `map` when the function is a named callable you did not have to write. Use a comprehension or a generator expression otherwise.

::: warning
Two failures that come up in the first week. `rows.sort()` returns `None`, so `rows = rows.sort()` destroys your data — it is `sorted(rows)` that returns a list. And a sort with no key over mixed types raises rather than inventing an order:

```python
>>> sorted([3, 'x', 1])
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: '<' not supported between instances of 'str' and 'int'
```

In a telemetry context this is usually a column that is numeric except where the logger wrote `NaN` as the text `"n/a"`, and the sort is telling you about a parsing bug two functions earlier.
:::

## Check yourself

::: check
A key function opens a results file and reads one number from it. Sorting 500 cases, roughly how many times is that file opened — 500 times, or a number of order $500\log_2 500$?
:::

::: answer
500. `sorted` computes every key first, once per item, and then orders the items by the computed values; comparisons are between the keys, not the original objects. That is the direct benefit of `key=` over a comparison function, which would have had to be called once per comparison — of order $500\log_2 500 \approx 4500$ times.

If the key is expensive enough that even 500 calls is too many, compute the values once yourself and sort a list of pairs — but in that case keep the value first and something unambiguously comparable second, for the reason the decorate example showed.
:::

::: check
Write the key that orders a results table by configuration name ascending and, within each configuration, by margin descending.
:::

::: answer
```python
sorted(results, key=lambda r: (r[0], -r[2]))
```

The tuple compares left to right, so the configuration name decides first and the negated margin breaks ties; negating reverses the direction for that field alone, which `reverse=True` could not do because it reverses everything.

Negation only works on numbers. If the secondary field were a string to be ordered descending, the two-pass form is the answer: sort by the string with `reverse=True` first, then by the configuration name, and let stability hold the first ordering inside each group.
:::

::: check
`min(cases, key=margin)` and `sorted(cases, key=margin)[0]` return the same case. Give one reason to prefer each.
:::

::: answer
Prefer `min` when you want one case: it makes a single pass and computes `margin` once per case, where `sorted` orders the entire table to let you look at one row of it — wasted work proportional to the size of the table times its logarithm.

Prefer `sorted(...)[0]` when you are about to want the second and third worst as well, or the whole ranking for a report. Then the sort is not waste, it is the thing you needed, and taking `[0]` from it costs nothing extra.

There is one behavioural difference to know: on a tie, both give the first such item in the original order, so they agree — but `min` with an empty input raises `ValueError` where `sorted(...)[0]` raises `IndexError`.
:::

::: check
Why does the lesson call `[lambda r: r[i] for i in range(3)]` a correctness problem rather than a style problem?
:::

::: answer
Because all three functions look up `i` when they are called, not when they are created, and by then the comprehension has finished with `i` equal to 2. Every one of them extracts field 2, so a program that builds one key function per column silently sorts every column by the last one. Nothing raises; the table is simply ordered wrongly.

`[itemgetter(i) for i in range(3)]` binds the value of `i` at construction, so each getter keeps the index it was built with. The lambda can be fixed with `lambda r, i=i: r[i]`, which captures the value as a default argument, but a reader has to know that idiom to see that it is correct, whereas the getter is obviously correct.
:::

::: check
A script groups 2,000 dispersion results by configuration with `itertools.groupby` and reports one line per group. The report has 47 lines for 6 configurations. What went wrong, and how do you know it is not a data problem?
:::

::: answer
The input was not sorted by the grouping key. `groupby` starts a new group every time the key changes between consecutive items, so a table in case-number order produces a new group each time the configuration differs from the previous row — 47 runs of consecutive equal configurations in this case.

You know it is not a data problem because the configuration names repeat across those 47 lines: a genuine set of 47 distinct configurations would show 47 distinct names. The fix is one line, `results.sort(key=itemgetter(0))` or `sorted(results, key=...)` before the `groupby`, using the same key function for both.
:::

## Summary

| Item | Statement |
| --- | --- |
| `sorted(it, key=f)` | New list ordered by `f(item)`; `f` called exactly once per item |
| `it.sort(key=f)` | In place, lists only, returns `None` |
| Stability | Equal keys keep their original relative order, including under `reverse=True` |
| Two fields | Tuple key `lambda r: (r[0], -r[2])`, or two stable sorts, secondary first |
| `min` / `max` with `key` | One pass, returns the first item achieving the extreme |
| `lambda args: expr` | Anonymous single-expression function; never assign one to a name |
| Late binding | A `lambda` in a loop captures the variable, not its value; `itemgetter(i)` captures the value |
| `operator.itemgetter(k)` | `x[k]` as a function; several keys give a tuple; works on dicts too |
| `map(f, it)` | Lazy; worth it when `f` is an existing named function, as in `map(float, parts)` |
| `itertools.groupby` | Groups *consecutive* equal keys; sort by the same key first or the groups are wrong |
| Measured here | Lambda and `itemgetter` keys both near 23 ms per 100,000-row sort, `python3 -m timeit` |

The next lesson moves from functions to objects. A results row has been a tuple or a dict so far, and both make you remember what index 2 means; a class gives the row a name, and gives the operations that belong to it somewhere to live.
