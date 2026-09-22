---
id: l02-generators-and-laziness
title: Generators, yield and laziness
minutes: 16
covers:
  - Generators and yield; the iterator protocol; laziness and memory
---

The previous lesson ended with a generator expression, which is a generator with a fixed shape: one input, one output expression, optionally one filter. Real telemetry work needs more. You want a function that opens a file, skips its header, parses each line, drops the rows marked as dropouts, and hands back one clean record at a time — with the file closed when the caller is done, and without ever holding the file's contents.

`yield` is how you write that. A function containing `yield` anywhere in its body is a *generator function*, and calling it does not run the body: it returns a generator object. Each time something asks that object for the next item, the body runs from where it last stopped, up to the next `yield`, and then freezes again with all its local variables intact. That freeze is the whole idea. A generator is a function you can pause.

The payoff is measured twice in this lesson: a file reader that goes from 84,591 kB of peak memory to 35 kB by moving one keyword, and a search that reads 18,209 of 300,000 rows because nobody asked for the rest. Both numbers come from runs on this machine, shown below with the code that produced them.

## Calling a generator function runs none of its body

The easiest way to believe this is to put a `print` in the body and watch when it happens:

```python
# countdown.py
def countdown(n):
    print("  (body starts)")
    while n > 0:
        yield n
        n -= 1
    print("  (body ends)")


c = countdown(3)
print("countdown(3) returned:", type(c).__name__)
print("next:", next(c))
print("next:", next(c))
print("next:", next(c))
try:
    next(c)
except StopIteration:
    print("next: raised StopIteration")
```

```bash
python3 countdown.py
# countdown(3) returned: generator
#   (body starts)
# next: 3
# next: 2
# next: 1
#   (body ends)
# next: raised StopIteration
```

Read the order of those lines carefully. `countdown(3)` printed nothing — the object came back before `(body starts)` appeared. The first `next(c)` ran the body from the top down to the first `yield`, which is where `(body starts)` got printed and where the value `3` came from. The second and third `next` resumed inside the `while` loop, at the line after the `yield`, with `n` still holding the value it had. The fourth ran off the end of the body, printed `(body ends)`, and signalled that there is nothing more by raising `StopIteration`.

A `for` loop over a generator does exactly those calls and stops when `StopIteration` arrives. You will almost never write `next` yourself except to take one item deliberately.

::: key
A function whose body contains `yield` is a generator function. Calling it executes no body code and returns a generator object. `next(gen)` runs the body to the next `yield` and returns that value; reaching the end of the body raises `StopIteration`, which is what a `for` loop catches to stop. Local variables persist between resumptions.
:::

## The iterator protocol is two methods

Generators are one instance of a general contract. An *iterable* is anything `iter()` accepts; an *iterator* is what `iter()` gives back, and it has a `__next__`. That is all `for` needs:

```python
# protocol.py
samples = [9.81, 9.79, 12.4]

it = iter(samples)
print(type(it).__name__)
print(next(it), next(it), next(it))
try:
    next(it)
except StopIteration:
    print("exhausted")

print(iter(it) is it)
```

```bash
python3 protocol.py
# list_iterator
# 9.81 9.79 12.4
# exhausted
# True
```

The last line is the rule that separates the two roles: an iterator's `__iter__` returns itself. This is why a list can be looped over twice — each `for` calls `iter(samples)` and gets a *fresh* `list_iterator` — and why a generator cannot, since `iter(gen)` hands back the same half-consumed generator.

You can implement the protocol by hand. It is instructive to do it once, because it shows exactly what `yield` is saving you. Both of these produce overlapping consecutive pairs, which is what you need to difference a signal:

```python
# window_class.py
class Pairs:
    """Yield overlapping (previous, current) pairs: the long way."""

    def __init__(self, samples):
        self.samples = samples
        self.i = 1

    def __iter__(self):
        return self

    def __next__(self):
        if self.i >= len(self.samples):
            raise StopIteration
        pair = (self.samples[self.i - 1], self.samples[self.i])
        self.i += 1
        return pair


def pairs(samples):
    """The same thing as a generator."""
    it = iter(samples)
    previous = next(it)
    for current in it:
        yield previous, current
        previous = current


data = [9.81, 9.79, 12.4, 9.80]
print(list(Pairs(data)))
print(list(pairs(data)))
print(max(b - a for a, b in pairs(data)))
```

```bash
python3 window_class.py
# [(9.81, 9.79), (9.79, 12.4), (12.4, 9.8)]
# [(9.81, 9.79), (9.79, 12.4), (12.4, 9.8)]
# 2.610000000000001
```

The class carries an explicit cursor `self.i`, compares it against a length, and does index arithmetic in two places: `self.i - 1` and `self.i`. Every one of those is a chance for an off-by-one, and the class only works on something indexable, so it cannot read a file. The generator has no index at all — the position *is* the paused execution point — and works on any iterable, including another generator.

The third line of output is the largest jump between consecutive samples, printed as `2.610000000000001` rather than `2.61`. That is ordinary binary floating point, not a defect in the generator.

::: warning
`pairs([])` looks harmless and is not. `next(it)` on an empty input raises `StopIteration` inside the generator body, and since Python 3.7 that is converted into a `RuntimeError` rather than being mistaken for "the generator finished":

```python
# empty_pairs.py
def pairs(samples):
    it = iter(samples)
    previous = next(it)
    for current in it:
        yield previous, current
        previous = current


try:
    print(list(pairs([])))
except RuntimeError as exc:
    print(type(exc).__name__, "-", exc)
    print("caused by:", type(exc.__cause__).__name__)
```

```bash
python3 empty_pairs.py
# RuntimeError - generator raised StopIteration
# caused by: StopIteration
```

The conversion is deliberate: a swallowed `StopIteration` would have made an empty input look like an empty result, which is exactly the bug that hides a truncated telemetry file. Write `next(it, None)` and check, or guard the empty case explicitly.
:::

::: example Reading a run file eagerly, and then lazily
First build a stand-in for a real run: 300,000 rows at 500 Hz, four channels, about 8.9 MB on disk.

```python
# make_run.py
"""Write a stand-in telemetry file: 300,000 rows of time and three channels."""
import random

rng = random.Random(4)
with open("run_047.csv", "w") as f:
    f.write("t_s,ax_g,ay_g,az_g\n")
    for i in range(300_000):
        t = i * 0.002
        f.write(f"{t:.3f},{rng.gauss(0, 0.05):.4f},{rng.gauss(0, 0.05):.4f},{rng.gauss(1, 0.30):.4f}\n")
```

The way most people first write the reader returns a list of records:

```python
# read_eager.py
import tracemalloc


def load_all(path):
    """Read every row into memory, then return the list."""
    records = []
    with open(path) as f:
        names = f.readline().strip().split(",")
        for line in f:
            values = [float(v) for v in line.strip().split(",")]
            records.append(dict(zip(names, values, strict=True)))
    return records


tracemalloc.start()
records = load_all("run_047.csv")
current, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()

worst = max(r["az_g"] for r in records)
print("rows:", len(records))
print("worst az_g:", worst)
print("peak memory:", peak // 1024, "kB")
```

```bash
python3 make_run.py
python3 read_eager.py
# rows: 300000
# worst az_g: 2.383
# peak memory: 84591 kB
```

Now delete the list, delete the `return`, and `yield` each record as it is built:

```python
# read_lazy.py
import tracemalloc


def rows(path):
    """Yield one record dict per line, holding one line at a time."""
    with open(path) as f:
        names = f.readline().strip().split(",")
        for line in f:
            values = [float(v) for v in line.strip().split(",")]
            yield dict(zip(names, values, strict=True))


tracemalloc.start()
worst = max(r["az_g"] for r in rows("run_047.csv"))
current, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()

print("worst az_g:", worst)
print("peak memory:", peak // 1024, "kB")
```

```bash
python3 read_lazy.py
# worst az_g: 2.383
# peak memory: 35 kB
```

Same answer, 84,591 kB against 35 kB of peak traced allocation — a factor of about 2,400 on this file, and the factor grows with the file because the lazy version's figure does not. An 8.9 MB file became 84 MB in memory because each row is a dict of four boxed floats, and Python objects are not cheap; this is why a 2 GB run file is not a 2 GB problem, it is a 20 GB problem.

The cost is that `rows(...)` cannot be walked twice, and `len` of it does not exist. When you genuinely need several passes, `list(rows(path))` gives you the eager version back in one word.
:::

## Laziness also means not computing what nobody asked for

Memory is the obvious saving. The other one is work never done. Ask a lazy pipeline for the first row above a threshold and it stops reading at that row:

```python
# first_over.py
READS = {"lines": 0}


def rows(path):
    with open(path) as f:
        names = f.readline().strip().split(",")
        for line in f:
            READS["lines"] += 1
            values = [float(v) for v in line.strip().split(",")]
            yield dict(zip(names, values, strict=True))


hit = next(r for r in rows("run_047.csv") if r["az_g"] > 2.2)
print("first exceedance at t =", hit["t_s"], "s, az =", hit["az_g"], "g")
print("rows actually read:", READS["lines"], "of 300000")
```

```bash
python3 make_run.py
python3 first_over.py
# first exceedance at t = 36.416 s, az = 2.3354 g
# rows actually read: 18209 of 300000
```

The counter is the evidence: 18,209 lines were parsed, about six percent of the file, and the remaining 281,791 were never read from disk. An eager loader would have parsed all 300,000 before the filter ran. `next(...)` with a generator expression is the idiomatic "first item matching a condition", and it is efficient for the same reason `break` is.

::: example A pipeline of generators, each holding one row
Each stage takes an iterable and yields an iterable, so the stages compose. Nothing runs until something consumes the far end.

```python
# pipeline.py
import itertools
import tracemalloc


def lines_of(path):
    with open(path) as f:
        f.readline()
        yield from f


def parsed(lines):
    for line in lines:
        t, ax, ay, az = (float(v) for v in line.split(","))
        yield t, ax, ay, az


def in_window(records, t0, t1):
    for t, ax, ay, az in records:
        if t0 <= t <= t1:
            yield t, ax, ay, az


tracemalloc.start()
window = in_window(parsed(lines_of("run_047.csv")), 100.0, 110.0)
peak_az = max(az for _, _, _, az in window)
current, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()

print("peak az_g between 100 and 110 s:", peak_az)
print("pipeline peak memory:", peak // 1024, "kB")

first_three = list(itertools.islice(parsed(lines_of("run_047.csv")), 3))
for row in first_three:
    print(row)
```

```bash
python3 make_run.py
python3 pipeline.py
# peak az_g between 100 and 110 s: 2.0434
# pipeline peak memory: 30 kB
# (0.0, 0.002, 0.0232, 0.8617)
# (0.002, 0.0176, 0.0463, 1.1234)
# (0.004, 0.0781, -0.0443, 1.0202)
```

Three stages, 30 kB of peak allocation for a pipeline whose input is 8.9 MB. The equivalent written as three loops with three intermediate lists would allocate all three.

`yield from f` in the first stage delegates to the file object's own iteration rather than writing `for line in f: yield line`. It means the same thing and is the form to use when a generator's job is to pass another iterable through.

`itertools.islice(it, 3)` takes the first three items of any iterator without materialising it — the lazy equivalent of `it[:3]`, which a generator does not support because it has no indexing. Use it whenever you want to look at the front of a stream while writing the parser.
:::

## What you give up

A generator is not a sequence and does not pretend to be one:

```python
>>> squares = (x * x for x in range(10))
>>> len(squares)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: object of type 'generator' has no len()
>>> squares[2]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: 'generator' object is not subscriptable
>>> sum(squares)
285
>>> sum(squares)
0
```

No length, no indexing, one pass, and the second pass fails silently by returning the identity element instead of raising. Those four facts are the whole argument for materialising with `list(...)` when the data fits and you need it more than once.

One more trap worth naming: a generator that opens a file holds it open until the generator is exhausted or garbage-collected. If you take three rows with `islice` and abandon the generator, the file stays open until CPython collects it. In a loop over a thousand run files that becomes a "too many open files" error, and the fix is to consume the generator inside a `with` block in the caller, or to close it explicitly — the subject of the context-manager lesson later in this module.

## Check yourself

::: check
What does `list(countdown(3))` print, and in what order, given the `countdown` above?
:::

::: answer
It prints `  (body starts)` then `  (body ends)`, in that order, and the call evaluates to `[3, 2, 1]`. `list` drives the generator to exhaustion, so the entire body runs: the opening print happens on the first `next`, the three values come from the three `yield` statements, and the closing print happens when the body runs off the end and raises `StopIteration`, which `list` catches. Nothing is printed by the call `countdown(3)` itself.
:::

::: check
A colleague replaces `return records` with `yield record` inside the loop and reports that the calling code now prints `0 rows`. The caller is `records = load_all(path)` followed by `print(len(records), "rows")`. What happened?
:::

::: answer
`len` on a generator raises `TypeError: object of type 'generator' has no len()`, so that is not quite the symptom; more likely the caller was changed to something like `sum(1 for _ in records)` after a first pass had already consumed it, or the count was taken after another loop over the same generator. Either way the cause is the same: `load_all` no longer returns a list, it returns a one-pass generator, and every consumer that walked the result twice now finds it empty on the second walk.

The fix is to decide which the caller needs. If it wants a count and then the rows, materialise once with `records = list(load_all(path))`. If it only streams, drop the `len` and count as it goes.
:::

::: check
Why does the iterator protocol require `__iter__` on an iterator as well as `__next__`, when `__next__` is what produces values?
:::

::: answer
So that an iterator is itself iterable, and `for` works on it directly. `for x in it:` begins by calling `iter(it)`; if an iterator did not implement `__iter__`, that call would fail and you could only loop over the original container. Returning `self` is the correct implementation, and it is what makes `for row in rows(path)` legal when `rows(path)` is already an iterator rather than a collection.

It also means `iter(it) is it` is `True` for an iterator and `False` for a container, which is a direct way to ask, at the prompt, which of the two you are holding.
:::

::: check
You have a 40 GB file of radar returns and need the mean, the standard deviation and the maximum. Can a single generator give you all three, and what is the cost of each arrangement?
:::

::: answer
Not with three separate calls to `mean`, `stdev` and `max`, because the first would exhaust it. Three options, in order of preference:

Walk it once and accumulate the count, the sum, the sum of squares and the running maximum yourself; memory is constant and the file is read once. The standard deviation from the sum of squares loses precision when the mean is large compared with the spread, so subtract a rough offset first if that applies.

Or open the file three times and build a fresh generator for each statistic: still constant memory, but three full reads, which at 40 GB is dominated by disk.

Or `list(...)` it, which is not an option here — the earlier measurement showed an 8.9 MB file becoming 84 MB of Python objects, so 40 GB would need hundreds of gigabytes.
:::

::: check
`itertools.islice(gen, 3)` and `list(gen)[:3]` produce the same three items. Under what circumstances is the difference between them the difference between a program that works and one that does not?
:::

::: answer
Whenever the generator is long or unbounded. `list(gen)[:3]` produces every item first, then throws almost all of them away: on a 300,000-row file that is the full parse, and on an unbounded generator it never terminates. `islice` pulls exactly three items and stops.

The same logic applies to `sorted(gen)[0]` against `min(gen)`, and to `len(list(gen))` against `sum(1 for _ in gen)`. In each pair the first form materialises the stream to answer a question that did not need it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Generator function | Any function whose body contains `yield`; calling it runs no body code |
| Generator object | Has `__next__` and `__iter__`; `__iter__` returns itself, so it is one-pass |
| `next(gen)` | Resumes the body to the next `yield`; end of body raises `StopIteration` |
| `yield from it` | Delegates to another iterable instead of a `for`-and-`yield` loop |
| Iterable vs iterator | `iter(iterable)` gives an iterator; `iter(iterator) is iterator` |
| `StopIteration` inside a body | Converted to `RuntimeError: generator raised StopIteration` |
| Not supported | `len`, indexing, slicing, a second pass |
| Measured here | Eager read peak 84,591 kB; the same read with `yield`, 35 kB |
| Measured here | `next(r for r in rows(...) if ...)` read 18,209 of 300,000 rows |
| `itertools.islice` | The lazy `[:n]`; takes n items from any iterator |
| Materialise | `list(gen)` when you need length, indexing or a second pass |

The next lesson stays with functions but changes the question from "how do I produce the items" to "how do I say what to do with each one": `sorted` with a `key`, and the small anonymous functions that go with it.
