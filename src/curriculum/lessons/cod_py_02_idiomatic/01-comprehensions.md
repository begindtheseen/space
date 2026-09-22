---
id: l01-comprehensions
title: Comprehensions: saying what the result is
minutes: 17
covers:
  - List, dict and set comprehensions; generator expressions
---

You can already write a loop that builds a list. Nothing in this lesson teaches you a capability you lack; it teaches you the form a reviewer expects to see, and why the expectation is not a matter of taste.

The pattern in question is *accumulate*: start with an empty container, walk an iterable, put something into the container for some or all of the items. It is so common in analysis code that Python gives it a syntax of its own, the *comprehension*, and once you see the two side by side the argument is easy to make. The loop spreads one idea over four lines and three statements, each of which can be wrong independently. The comprehension is a single expression whose value is the finished list, so the half-built list never exists as a name you could use by mistake.

The same syntax, with different brackets, builds dictionaries and sets, and with round brackets it builds something that is not a container at all — a *generator expression*, which produces the items one at a time and never holds more than one. That last variant is the one that matters when the input is a 50 GB telemetry file rather than a seven-element list, and it is measured rather than asserted below.

## The accumulate loop, and what is wrong with it

Here is a filter written the long way. It is correct:

```python
# peaks_loop.py
samples = [9.81, 9.79, 12.4, 9.80, 14.2, 9.78, 11.1]

peaks = []
for s in samples:
    if s > 10.0:
        peaks.append(s)

print(peaks)
print(len(peaks))
```

```bash
python3 peaks_loop.py
# [12.4, 14.2, 11.1]
# 3
```

And here is the same filter as a comprehension:

```python
# peaks_comp.py
samples = [9.81, 9.79, 12.4, 9.80, 14.2, 9.78, 11.1]

peaks = [s for s in samples if s > 10.0]

print(peaks)
print(len(peaks))
```

```bash
python3 peaks_comp.py
# [12.4, 14.2, 11.1]
# 3
```

Be precise about what the second version gains, because "shorter" is not by itself an argument.

`peaks` is bound once, to a finished value. In the loop version it is bound to an empty list four lines before it is finished, and in between there is a name in scope holding a list that is not yet the answer. In a script that is a small risk; in a Jupyter notebook, where cells are re-run out of order, it is the single most common way to get a list with twice as many entries as it should have, because `peaks = []` was in a cell that did not run again.

The element expression appears once. In the loop, the thing you are collecting is written inside `append(...)`, four levels of indentation from the name it ends up in. If you later decide to collect `s - 9.80665` instead of `s`, the comprehension has one place to change.

And the container's type is visible at the first character. `[` means list, `{` with a colon means dict, `{` without one means set, `(` means generator. You know what `peaks` is before you have read what goes into it.

What you do *not* get is speed. Timed on this machine with

```bash
python3 -m timeit -s "n = 100_000" "out = []" "for x in range(n): out.append(x * x)"
python3 -m timeit -s "n = 100_000" "out = [x * x for x in range(n)]"
```

the loop took about 2.5 ms and the comprehension about 2.3 ms per pass: roughly seven percent, which is noise against anything you will actually do to the numbers afterwards. Use a comprehension because it has fewer places to be wrong, not because it is fast.

::: key
`[expr for name in iterable if condition]` evaluates to the list of `expr` for every item where `condition` is true. Read it left to right as "collect this, for each of these, when this holds". The name is local to the comprehension: it does not exist afterwards.
:::

## Dicts and sets use the same shape

Swap the brackets and you change the container. With a colon in the element position you get a dict; without one, a set:

```python
>>> runs = [(1, 'nominal'), (2, 'hot'), (1, 'cold')]
>>> [case for case, tag in runs]
[1, 2, 1]
>>> {case for case, tag in runs}
{1, 2}
```

The set comprehension is the idiomatic answer to "which distinct X appear in this data". Written as a loop it needs a container, a membership test and an append; written as a set comprehension the deduplication is the data structure's job.

A dict comprehension is the idiomatic way to build a lookup table from two parallel sequences or from an existing mapping:

```python
>>> record = {'t_s': 12.5, 'ax_g': 0.013, 'q_psf': 412.7}
>>> {k: v for k, v in record.items() if k.endswith('_g')}
{'ax_g': 0.013}
>>> {k.upper(): v for k, v in record.items()}
{'T_S': 12.5, 'AX_G': 0.013, 'Q_PSF': 412.7}
```

Insertion order is preserved, as it is for any dict since Python 3.7, so the output order above is the input order and not an accident.

::: example Turning one telemetry row into a named record
A comma-separated telemetry file gives you a header line and rows of numbers. The unidiomatic read is an index-by-index assignment — `t = float(values[0])`, `ax = float(values[1])` — which means every later column insertion silently shifts your data by one. Build the record from the header instead:

```python
# parse_row.py
header = "t_s,ax_g,ay_g,az_g,q_psf"
row = "12.500,0.013,-0.004,1.982,412.7"

names = header.split(",")
values = row.split(",")

record = {name: float(value) for name, value in zip(names, values, strict=True)}
print(record)
print(record["q_psf"])

g_load = {k: v for k, v in record.items() if k.endswith("_g")}
print(g_load)
```

```bash
python3 parse_row.py
# {'t_s': 12.5, 'ax_g': 0.013, 'ay_g': -0.004, 'az_g': 1.982, 'q_psf': 412.7}
# 412.7
# {'ax_g': 0.013, 'ay_g': -0.004, 'az_g': 1.982}
```

Two concrete gains. There is no column index anywhere, so a file with a new column between `az_g` and `q_psf` still parses correctly and `record["q_psf"]` still means dynamic pressure. And `strict=True` turns a header that does not match the row into a `ValueError` at the moment of the mismatch, instead of a short dict whose missing key surfaces three functions later.

Note that `12.500` comes back as `12.5`: `float` parses the number, and the trailing zeros were never part of the value, only of its spelling in the file.
:::

## A generator expression is the same syntax without the list

Round brackets give you a *generator*: an object that knows how to produce the next item, and has produced none of them yet. Nothing is computed when you write it.

```python
# lazy.py
import tracemalloc

tracemalloc.start()
before = tracemalloc.get_traced_memory()[0]
squares = [x * x for x in range(1_000_000)]
print("list comprehension:", tracemalloc.get_traced_memory()[0] - before, "bytes")

before = tracemalloc.get_traced_memory()[0]
lazy = (x * x for x in range(1_000_000))
print("generator expression:", tracemalloc.get_traced_memory()[0] - before, "bytes")
tracemalloc.stop()

print(lazy)
print(sum(lazy))
print(sum(lazy))
```

```bash
python3 lazy.py
# list comprehension: 40448528 bytes
# generator expression: 440 bytes
# <generator object <genexpr> at 0x7f4e4c934110>
# 333332833333500000
# 0
```

That is the measurement, made with `tracemalloc`, which tracks allocations rather than guessing: the list of a million squares costs about 40 MB, the generator that would produce the same million costs 440 bytes. The difference is not a constant factor you can ignore — it is the difference between a program that runs and one that is killed by the operating system when the input file grows.

The hex number in the third line is the object's address in memory and will be different every time you run it; the rest reproduces exactly.

The last two lines are the price. A generator is exhausted by one pass. `sum(lazy)` consumed every item, and the second `sum(lazy)` found nothing left and returned `0` — not an error, which is what makes it dangerous. If you need the data twice, you need a list.

When a generator expression is the only argument to a function you may drop its brackets, which is why `sum(x * x for x in values)` is the idiomatic total and `sum([x * x for x in values])` is not: the second builds the whole list, adds it up and throws it away.

```bash
python3 -m timeit -s "n = 1_000_000" "sum([x * x for x in range(n)])"
python3 -m timeit -s "n = 1_000_000" "sum(x * x for x in range(n))"
```

On this machine that is about 53 ms against about 34 ms, and 40 MB against nothing. Here the idiom is faster *and* smaller, and the reason is the same in both cases: the list was never needed.

::: key
`(expr for x in it)` is lazy: it holds one item at a time and can be walked once. `[expr for x in it]` is eager: it holds all of them and can be walked any number of times, indexed and measured with `len`. Choose by whether you need random access or a second pass — not by which reads better.
:::

::: example A dispersion sweep you do not have room to store
Two hundred thousand Monte Carlo cases, each reporting a peak dynamic pressure. You want the count over the structural limit, their case numbers, and the worst case overall.

```python
# sweep.py
import random
import tracemalloc

LIMIT_KPA = 35.0


def sweep(n):
    """Yield (case_id, max_dynamic_pressure_kPa) for n dispersed runs."""
    rng = random.Random(20250922)
    for case in range(n):
        yield case, rng.gauss(31.0, 2.4)


def measure(build):
    tracemalloc.start()
    before = tracemalloc.get_traced_memory()[0]
    result = build()
    used = tracemalloc.get_traced_memory()[0] - before
    tracemalloc.stop()
    return result, used

eager, eager_bytes = measure(
    lambda: [c for c, q in sweep(200_000) if q > LIMIT_KPA]
)
worst, lazy_bytes = measure(
    lambda: max(q for _, q in sweep(200_000))
)

print("violations:", len(eager), "first three:", eager[:3])
print("list of violating case ids:", eager_bytes, "bytes")
print("worst case q:", round(worst, 3))
print("max over a generator:", lazy_bytes, "bytes")
```

```bash
python3 sweep.py
# violations: 9529 first three: [10, 12, 59]
# list of violating case ids: 389736 bytes
# worst case q: 41.692
# max over a generator: 24 bytes
```

The case numbers you must keep, because you will go back and look at those runs; that list costs about 390 kB and is worth it. The worst-case value you do not have to keep anything for: `max` over a generator expression walks 200,000 results and holds 24 bytes, the running maximum. Seeding `random.Random` with a fixed number is what makes those figures reproduce exactly on your machine as well as this one.

The named generator function `sweep` is the subject of the next lesson; here it stands in for a real simulation, and note that it, too, never builds a list of 200,000 results.
:::

## Where a comprehension is the wrong tool

A comprehension is an expression that *produces a value*. If you are not keeping the value, you want a loop:

```python
>>> samples = [9.81, 12.4, 14.2]
>>> flags = [print(s) for s in samples]
9.81
12.4
14.2
>>> flags
[None, None, None]
```

`print` returns `None`, so `flags` is a list of three `None`s that nobody wants. Writing a comprehension for its side effects is a recognised code smell precisely because it builds and discards a list the size of the input.

::: warning
Two more limits worth knowing before a reviewer points them out. A comprehension with more than one `for` and one `if` is usually harder to read than the loop it replaces — the clauses run left to right, so `[v for row in grid for v in row]` flattens, while the nesting reads backwards to most people. And the comprehension variable does not leak: after `[s for s in samples]`, the name `s` is not defined in the enclosing scope, which is a feature, but it means you cannot inspect the last value afterwards.
:::

```python
>>> grid = [[1, 2], [3, 4], [5, 6]]
>>> [v for row in grid for v in row]
[1, 2, 3, 4, 5, 6]
>>> s = 'untouched'
>>> [s.upper() for s in ['a', 'b']]
['A', 'B']
>>> s
'untouched'
```

## Check yourself

::: check
Rewrite as a comprehension: `out = []` then `for r in rows:` then `if r.status == "ok":` then `out.append(r.duration * 1e-3)`.
:::

::: answer
```python
out = [r.duration * 1e-3 for r in rows if r.status == "ok"]
```

The filter clause comes after the `for` clause and reads in the same order as the loop: for each `r` in `rows`, if the status is `"ok"`, collect the scaled duration. The one thing to check when you do this transformation is that the `if` in the loop guarded only the `append` — if it had also guarded some other statement, the comprehension is not equivalent.
:::

::: check
`sum([x ** 2 for x in residuals])` and `sum(x ** 2 for x in residuals)` give the same number. Name the two differences, and say which you would write.
:::

::: answer
The first builds a complete list of squares, sums it, and discards it; the second produces one square at a time and never holds a list. The differences are memory — proportional to the length of `residuals` against constant — and time, because allocating and freeing that list is work that contributes nothing.

Measured on this machine at a million elements with `python3 -m timeit`, the list version took about 53 ms and the generator version about 34 ms. Write the second. The brackets are optional only when the generator expression is the sole argument, which it is here.
:::

::: check
You write `q = (row[4] for row in rows)`, then `print(max(q))` and `print(min(q))`. The maximum prints correctly and the minimum raises. What is the exception, and why?
:::

::: answer
`max(q)` walked the generator to the end, so `min(q)` sees an empty iterator and raises `ValueError: min() arg is an empty sequence`. A generator is a one-pass object; it does not rewind, and there is no way to ask it to.

The fix depends on which cost you would rather pay. If the data fits, materialise it once with `q = [row[4] for row in rows]` and take both statistics from the list. If it does not, walk it once and track both extremes yourself, or build two independent generators from the source.
:::

::: check
A colleague's parser assigns `t = float(values[0])`, `ax = float(values[1])`, and so on down to `q = float(values[6])`. The telemetry team adds a column in the middle of the file. What happens, and what does the dict comprehension in this lesson do instead?
:::

::: answer
Every channel from the inserted column onward is read from the wrong position, and nothing raises: the values are all floats, so the parse succeeds and `q` is now holding whatever the neighbouring channel contained. That is the worst kind of failure — plausible numbers, wrong meaning, discovered when a plot looks strange a week later.

`{name: float(value) for name, value in zip(names, values, strict=True)}` binds each value to the name the file's own header gives it, so an inserted column changes only what keys exist, and every existing key still means what it meant. If the header and the row disagree in length, `strict=True` raises `ValueError` immediately rather than silently truncating to the shorter one.
:::

::: check
When is `[x for x in it]` the right thing to write, and when is it a sign of a misunderstanding?
:::

::: answer
It is right when you need a list and `it` is not one: materialising a generator, a `zip`, a file object or a dict's `.keys()` view so that you can index it, take its length, sort it or walk it twice. Many people write `list(it)` for this, which is the same thing and clearer, since no element is being transformed.

It is a misunderstanding when `it` is already a list and you wanted a copy, because then the idiomatic spelling is `it.copy()` or `list(it)` and a reviewer will ask why a loop was written where none was needed. It is also a misunderstanding when it is used to force a generator that was deliberately lazy, which throws away the memory advantage that the generator was written for.
:::

## Summary

| Form | Produces | Notes |
| --- | --- | --- |
| `[e for x in it]` | list | Eager; indexable, re-walkable, has `len` |
| `[e for x in it if c]` | list | Filter clause follows the `for`, reads in the same order |
| `{k: v for x in it}` | dict | Insertion-ordered; later duplicate keys overwrite earlier ones |
| `{e for x in it}` | set | Deduplicates; no order; elements must be hashable |
| `(e for x in it)` | generator | Lazy, one item at a time, single pass; brackets optional as a sole argument |
| Measured here | — | List of 1,000,000 squares: 40,448,528 bytes. The generator: 440 bytes |
| Measured here | — | `sum` over the list ≈ 53 ms, over the generator ≈ 34 ms, `python3 -m timeit` |
| Not a reason | speed | Loop-and-append versus comprehension differed by about seven percent here |
| Wrong tool | side effects | `[print(x) for x in xs]` builds a list of `None`; write a `for` loop |

The next lesson takes the generator apart. `(x * x for x in it)` is a convenience for one specific shape; `yield` lets you write a generator whose body is arbitrary code, which is how a telemetry reader streams a file it could never hold in memory.
