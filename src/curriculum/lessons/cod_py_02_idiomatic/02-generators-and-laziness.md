---
id: l02-generators-and-laziness
title: Generators, yield and laziness
minutes: 19
covers:
  - Generators and yield; the iterator protocol; laziness and memory
---

Think of someone reading you a bedtime story. They read a page, then stop and wait. When you say "next!", they carry on from exactly where they stopped — same book, same page, same voice for the dragon. They never read the whole book aloud in advance and hand you a recording. They produce each page when you ask for it.

The last lesson ended with a generator expression, which is a generator with one fixed shape: one input, one output expression, maybe one filter. Real telemetry work needs more. You want a function that opens a file, skips its header, turns each line into numbers, drops bad rows, and hands back one clean record at a time — without ever holding the whole file, and with the file closed when the caller is done.

The keyword `yield` is how you write that. Read `yield n` aloud as "hand over `n` and pause". A function with `yield` anywhere in its body is a **generator function**: calling it does not run the body. It gives back a **generator object**, the storyteller waiting for "next!". Each time something asks for the next item, the body runs from where it last stopped, up to the next `yield`, and freezes again with all its local variables kept. That freeze is the whole idea. A generator is a function you can pause.

You will measure the payoff twice. A file reader goes from 84,591 kB of peak memory to 35 kB by changing how it hands out results. And a search reads 18,209 of 300,000 rows, because nobody asked for the rest.

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

Read the order of those lines slowly. It is **[[the whole lesson in seven lines|pause-and-resume]]**.

1. `countdown(3)` printed nothing. The generator object came back *before* `(body starts)` appeared.
2. The first `next(c)` — read it "next of c" — ran the body from the top down to the first `yield`. That is where `(body starts)` got printed and where the value `3` came from.
3. The second `next(c)` resumed on the line *after* the `yield`. It ran `n -= 1` (subtract one from `n`), went round the `while` loop, and stopped at `yield` again with `2`. The variable `n` had kept its value while the generator was paused.
4. The third did the same and handed over `1`.
5. The fourth resumed, made `n` zero, left the loop, printed `(body ends)`, and ran off the end of the function. To say "nothing more", Python raised **[[`StopIteration`|stop-signal]]** — an exception used as a signal rather than as an error.

A `for` loop over a generator makes exactly those `next` calls for you and stops quietly when `StopIteration` arrives. You will rarely write `next` yourself, except to take one item on purpose.

::: key
`yield` turns the function into a generator function. Calling it runs no body code; it returns a generator object whose `__next__` resumes execution until the next `yield`, preserving local state between resumptions. `next(gen)` returns the yielded value; reaching the end of the body raises `StopIteration`, which is what a `for` loop catches to stop.
:::

## The iterator protocol is two methods

Generators are one example of a general agreement in Python — a **protocol**, a set of methods an object promises to have. Two words matter here, and they are easy to mix up:

- An **iterable** is anything you can loop over: a list, a string, a file, a generator. Formally, it is anything the built-in `iter()` accepts.
- An **iterator** is the thing doing the walking: an object with a **[[`__next__` method|dunder]]** that hands out the next item each time it is called. It is what `iter()` gives back.

A list is like a book. An iterator is like a bookmark in it. You can put several bookmarks in one book.

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

`iter(samples)` made a bookmark called a `list_iterator`. Three `next` calls moved it through the three samples, and a fourth found nothing left.

The last line is the rule that separates the two roles. An iterator's own `__iter__` method returns *itself*, so `iter(it) is it` is `True` (read `is` as "is the very same object as"). This is **[[why a list can be looped over twice but a generator cannot|iterable-vs-iterator]]**. Each `for` loop over a list calls `iter(samples)` and gets a *fresh* bookmark at the start. A generator is its own bookmark, so `iter(gen)` hands back the same half-used generator.

You can write the protocol by hand. Do it once, because it shows exactly how much work `yield` saves. Both of the pieces below produce overlapping neighbouring pairs, which is what you need to find the change from one sample to the next:

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

The class (lesson 4 covers classes properly) has to carry its own position, `self.i`. It compares that position against the length, and does index arithmetic in two places, `self.i - 1` and `self.i`. Every one of those is a chance for an **[[off-by-one|off-by-one]]** mistake. And the class only works on something you can index by position, so it cannot read a file.

The generator has no index at all. Its position *is* the paused spot in its own code. It works on any iterable, including a file or another generator.

The last output line is the biggest jump between neighbouring samples: $12.4 - 9.79 = 2.61$. It prints as `2.610000000000001` because computers store decimals in binary and $9.79$ cannot be stored exactly. That is ordinary floating point, not a fault in the generator.

::: warning An empty input breaks `pairs`
`pairs([])` looks harmless and is not. `next(it)` on an empty input raises `StopIteration` *inside* the generator's body. Since Python 3.7 that is **[[turned into a `RuntimeError`|pep-479]]** rather than being mistaken for "the generator finished normally":

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

The conversion is deliberate. A swallowed `StopIteration` would make an empty input look like an empty result — exactly the bug that hides a cut-off telemetry file. Write `next(it, None)`, which returns `None` instead of raising when there is nothing, and check for it; or handle the empty case explicitly before you start.
:::

::: example Reading a run file eagerly, and then lazily
First build a stand-in for a real test run: 300,000 rows at a **[[sample rate of 500 Hz|sample-rate]]**, a time column plus three acceleration channels, about 8.9 MB on disk.

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

The way most people first write the reader returns a list of records, one dict per row. Words like **eager** (do all the work now) and **lazy** (do each piece only when asked) describe the two styles:

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

Now make three edits. Delete the `records = []` list. Delete the `return`. And instead of appending each record, `yield` it:

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

Same answer. Peak memory 84,591 kB against 35 kB: $84{,}591 / 35 \approx 2{,}400$ times less on this file. And the factor grows with the file, because the lazy figure does not grow at all.

Why did an 8.9 MB file become 84 MB in memory? Each row is a dict of four floats, and **[[each Python object carries overhead|row-memory]]**: about 289 bytes per row in memory against about 30 bytes of text in the file. So a 2 GB run file is not a 2 GB problem. It is closer to a 20 GB problem.

The cost of laziness is that `rows(...)` cannot be walked twice, and `len` does not work on it. When you really need several passes, `list(rows(path))` gives you the eager version back in one word.
:::

## Laziness also means not computing what nobody asked for

Saving memory is the obvious gain. The other gain is work never done. Ask a lazy pipeline for the first row above a threshold, and it stops reading at that row:

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

The counter is the evidence. 18,209 lines were parsed — about six percent of the file — and the other 281,791 were never read. An eager loader would have parsed all 300,000 before the filter even started.

Sanity check: row 18,209 is the 18,209th data line, whose time is $(18{,}209 - 1) \times 0.002 = 36.416\,\mathrm{s}$. That matches the printed time.

`next(...)` around a generator expression is the natural way to say "the first item that matches". It is efficient for the same reason a `break` inside a loop is.

::: example A pipeline of generators, each holding one row
Each stage below takes an iterable and yields items, so the stages plug into one another, like the `|` pipes in a shell. Nothing runs until something **[[pulls from the far end|pipeline-pull]]**.

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

Walk through it:

1. `lines_of` opens the file, reads and throws away the header line, then hands out the remaining lines.
2. `parsed` turns each line into a tuple of four floats.
3. `in_window` passes on only the rows whose time `t` is between `t0` and `t1`. Read `t0 <= t <= t1` as "t is at least t0 and at most t1".
4. Building `window` runs nothing yet. `max(...)` does the pulling: each time it asks for a value, one line travels through all three stages.

Three stages, 30 kB of peak memory, for an 8.9 MB input. The same job written as three loops with three in-between lists would hold all three lists.

`yield from f` in the first stage — read it "yield everything from `f`" — hands on every item of another iterable, here the file's lines. It means the same as `for line in f: yield line`, and it is the form to use when a generator's job is to pass another iterable through.

`itertools.islice(it, 3)` takes the first three items of any iterator without building the rest. It is the lazy version of `it[:3]`, which a generator does not support because it has no positions to slice. Use it to peek at the front of a stream while you are writing the parser.
:::

## What you give up

A generator is not a list and does not pretend to be one:

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

No length. No indexing ("not subscriptable" means you cannot use square brackets on it). One pass only. And the second pass fails *silently*, by returning the "empty" answer — `0` for a sum — instead of raising. Those four facts are the whole case for turning a generator into a list with `list(...)` when the data fits and you need it more than once.

::: key
A generator beats a list when the sequence is large or unbounded and you consume it once: the generator holds one item at a time instead of materialising all of them. It loses when you need random access, `len()`, or multiple passes.
:::

::: warning A generator can hold a file open
A generator that opens a file keeps it open for as long as the generator is alive and not finished. If you take three rows with `islice` and keep the generator in a variable, the file stays open. CPython (the standard Python) closes it as soon as the last reference to the generator disappears, but other Python implementations promise no such timing. Keep a thousand half-used generators in a list, one per run file, and you hit the operating system's **[[limit on open files|open-file-limit]]**: "Too many open files". The fix is to finish the generator inside a `with` block in the caller, or to close it with `gen.close()` — the subject of the context-manager lesson later in this module.
:::

## Check yourself

::: check
What does `list(countdown(3))` print, and in what order, given the `countdown` above?
:::

::: answer
It prints `  (body starts)` then `  (body ends)`, in that order, and the whole expression evaluates to `[3, 2, 1]`.

`list` keeps calling `next` until the generator is used up, so the entire body runs. The opening print happens on the first `next`. The three values come from the three trips through `yield`. The closing print happens when the body runs off the end and raises `StopIteration`, which `list` catches. The call `countdown(3)` on its own prints nothing.
:::

::: check
A colleague changes `load_all` so that it yields each record instead of building and returning a list. The calling code is `records = load_all(path)`, then `count = sum(1 for _ in records)`, then `for r in records: check(r)`. The count comes out right, but no row is ever checked, and nothing raises. What happened?
:::

::: answer
`load_all` no longer returns a list. It returns a one-pass generator. The line that counts walked it to the end, so the `for` loop found it already empty and ran zero times. An empty loop is not an error, so nothing raised.

(Had the caller written `len(records)`, it would at least have failed loudly, with `TypeError: object of type 'generator' has no len()`.)

The fix is to decide what the caller needs. If it wants a count *and* then the rows, build the list once: `records = list(load_all(path))`. If it only streams through, drop the separate count and count as it goes, inside the checking loop.
:::

::: check
Why does the iterator protocol require `__iter__` on an iterator as well as `__next__`, when `__next__` is what produces values?
:::

::: answer
So that an iterator is itself iterable, and `for` works on it directly. `for x in it:` begins by calling `iter(it)`. If an iterator had no `__iter__`, that call would fail, and you could only loop over the original container. Returning `self` is the correct implementation. It is what makes `for row in rows(path)` legal when `rows(path)` is already an iterator rather than a collection.

It also means `iter(it) is it` is `True` for an iterator and `False` for a container like a list — a direct way to ask, at the prompt, which of the two you are holding.
:::

::: check
You have a 40 GB file of radar returns and need the mean, the standard deviation and the maximum. Can a single generator give you all three, and what is the cost of each arrangement?
:::

::: answer
Not with three separate calls to `mean`, `stdev` and `max`, because the first would use it up. Three options, best first:

1. **Walk it once**, keeping a running count, sum, sum of squares and maximum yourself. Memory stays constant and the file is read once. One caution: the standard deviation computed from a sum of squares **[[loses precision|one-pass-statistics]]** when the mean is large compared with the spread, so subtract a rough offset from every value first if that applies.
2. **Open the file three times** and build a fresh generator for each statistic. Memory is still constant, but the file is read three times, and at 40 GB the disk time dominates.
3. **`list(...)` it.** Not an option here. The earlier measurement turned an 8.9 MB file into 84 MB of Python objects, nearly ten times bigger, so 40 GB would need hundreds of gigabytes of memory.
:::

::: check
`itertools.islice(gen, 3)` and `list(gen)[:3]` produce the same three items. When is the difference between them the difference between a program that works and one that does not?
:::

::: answer
Whenever the generator is long or never ends. `list(gen)[:3]` produces every item first, then throws almost all of them away. On a 300,000-row file that is the full parse. On an endless generator — say one that keeps reading a live telemetry stream — it never finishes. `islice` pulls exactly three items and stops.

The same logic applies to `sorted(gen)[0]` against `min(gen)`, and to `len(list(gen))` against `sum(1 for _ in gen)`. In each pair, the first form builds the whole stream to answer a question that did not need it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Generator function | Any function whose body contains `yield`; calling it runs no body code |
| Generator object | Has `__next__` and `__iter__`; `__iter__` returns itself, so it is one-pass |
| `next(gen)` | Resumes the body to the next `yield`; the end of the body raises `StopIteration` |
| `yield from it` | Hands on every item of another iterable, instead of a `for`-and-`yield` loop |
| Iterable vs iterator | `iter(iterable)` gives an iterator; `iter(iterator) is iterator` |
| `StopIteration` inside a body | Converted to `RuntimeError: generator raised StopIteration` |
| Not supported | `len`, indexing, slicing, a second pass |
| Generator beats list | Large or unbounded data consumed once; list wins for random access, `len`, several passes |
| Measured here | Eager read peak 84,591 kB; the same read with `yield`, 35 kB |
| Measured here | `next(r for r in rows(...) if ...)` read 18,209 of 300,000 rows |
| `itertools.islice` | The lazy `[:n]`; takes n items from any iterator |
| Materialise | `list(gen)` when you need length, indexing or a second pass |

The next lesson stays with functions but changes the question from "how do I produce the items?" to "how do I say what to do with each one?" — `sorted` with a `key`, and the small nameless functions that go with it.

::: context pause-and-resume Two parties taking turns
The caller and the generator take turns. Each `next` hands control to the generator; each `yield` hands a value and control back. Between turns the generator sits frozen, with `n` remembered.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="70" y="16" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">caller</text>
  <text x="280" y="16" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">countdown body</text>
  <line x1="70" y1="24" x2="70" y2="192" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="280" y1="24" x2="280" y2="192" stroke="#6c7a93" stroke-width="1.5"/>
  <g stroke-width="2">
    <line x1="72" y1="38" x2="272" y2="44" stroke="#1d6fd1"/>
    <line x1="278" y1="60" x2="78" y2="66" stroke="#b4232c"/>
    <line x1="72" y1="80" x2="272" y2="86" stroke="#1d6fd1"/>
    <line x1="278" y1="102" x2="78" y2="108" stroke="#b4232c"/>
    <line x1="72" y1="122" x2="272" y2="128" stroke="#1d6fd1"/>
    <line x1="278" y1="144" x2="78" y2="150" stroke="#b4232c"/>
    <line x1="72" y1="164" x2="272" y2="170" stroke="#1d6fd1"/>
    <line x1="278" y1="182" x2="78" y2="188" stroke="#b4232c"/>
  </g>
  <g font-size="11" text-anchor="middle">
    <text x="175" y="36" fill="#1d6fd1">next</text>
    <text x="175" y="58" fill="#b4232c">yield 3 (n = 3 kept)</text>
    <text x="175" y="78" fill="#1d6fd1">next</text>
    <text x="175" y="100" fill="#b4232c">yield 2</text>
    <text x="175" y="120" fill="#1d6fd1">next</text>
    <text x="175" y="142" fill="#b4232c">yield 1</text>
    <text x="175" y="162" fill="#1d6fd1">next</text>
    <text x="175" y="180" fill="#b4232c">StopIteration</text>
  </g>
</svg>
```

Four `next` calls, three values, one "no more" signal — the same count as the seven printed lines.
:::

::: context stop-signal An exception that means "done"
Most exceptions mean something went wrong. `StopIteration` is different: it is how an iterator says "I have nothing more", and it is completely normal. Every `for` loop in Python ends by catching one, out of your sight.

Using an exception for this may look odd, but it solves a real problem. Any value an iterator could return — `None`, `0`, an empty string — might also be a genuine item. An exception cannot be confused with an item, so "the end" is never mistaken for "an item that happens to be empty".
:::

::: context dunder Double-underscore names
Names like `__next__` and `__iter__`, with two underscores on each side, are Python's **special methods**. Python programmers read them aloud as "dunder next" and "dunder iter" — "dunder" is short for "double underscore".

You almost never call them directly. Python calls them for you: `next(x)` calls `x.__next__()`, `iter(x)` calls `x.__iter__()`, and `len(x)` calls `x.__len__()`. Defining them on your own class is how you make it work with Python's built-in tools. Lesson 5 of this module is all about them.
:::

::: context iterable-vs-iterator The book and its bookmarks
A list is an iterable: each call to `iter()` makes a new, independent iterator starting at the front. A generator is an iterator: `iter()` hands back the very same object, with its position wherever it was left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44" font-weight="700">list: iter() makes a fresh bookmark</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="10" y="30" width="60" height="26"/><rect x="70" y="30" width="60" height="26"/><rect x="130" y="30" width="60" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="40" y="47">9.81</text><text x="100" y="47">9.79</text><text x="160" y="47">12.4</text></g>
  <polygon points="40,60 34,72 46,72" fill="#1d6fd1"/>
  <text x="40" y="86" font-size="11" text-anchor="middle" fill="#1d6fd1">loop 1</text>
  <polygon points="160,60 154,72 166,72" fill="#b4232c"/>
  <text x="160" y="86" font-size="11" text-anchor="middle" fill="#b4232c">loop 2</text>
  <text x="200" y="47" font-size="11" fill="#6c7a93">two independent positions</text>
  <text x="10" y="118" font-size="12" fill="#1f2a44" font-weight="700">generator: iter(gen) is gen</text>
  <rect x="10" y="130" width="180" height="30" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="150" font-size="11" text-anchor="middle" fill="#1f2a44">one object, one position</text>
  <text x="200" y="150" font-size="11" fill="#6c7a93">second loop starts where</text>
  <text x="200" y="166" font-size="11" fill="#6c7a93">the first stopped: at the end</text>
</svg>
```

That single shared position is why the second `sum` over a generator returns `0`.
:::

::: context off-by-one The off-by-one mistake
An **off-by-one** error is being wrong by exactly one: a loop that runs ten times instead of nine, or reads index `i` when it should read `i - 1`. It is sometimes called a **fencepost error**, after the puzzle "a 10-metre fence with a post every metre needs how many posts?" — eleven, not ten.

Hand-written index arithmetic is where these live. Code with no indexes, like the `pairs` generator, has nowhere for them to hide.
:::

::: context pep-479 Why StopIteration became a RuntimeError
Before the change, a stray `StopIteration` raised by accident inside a generator — often from a bare `next()` call on an empty input — looked exactly like the generator finishing normally. The loop outside ended early, and data went missing with no error at all.

Python's change proposal PEP 479 fixed this. It arrived as an opt-in in Python 3.5 and became the rule for all code in Python 3.7: a `StopIteration` escaping from a generator's body is turned into a `RuntimeError`, with the original attached as its cause. A bug now fails loudly instead of quietly.
:::

::: context sample-rate What 500 Hz means
A **sample rate** says how many readings a sensor records each second, measured in hertz (Hz): $1\,\mathrm{Hz}$ is one per second. At $500\,\mathrm{Hz}$ there is one row every $\frac{1}{500} = 0.002\,\mathrm{s}$ — which is why the file's time column steps by `0.002`.

So 300,000 rows cover $300{,}000 \times 0.002 = 600\,\mathrm{s}$, ten minutes of a test. Real vehicles log many channels at hundreds or thousands of hertz, which is why files of many gigabytes are normal and why reading them lazily matters.
:::

::: context row-memory Where 289 bytes per row goes
In the file, one row is about 30 characters of text. In memory, the eager reader stores it as a dict of four float objects, plus one slot in the big list.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">in the file: about 30 bytes</text>
  <rect x="10" y="26" width="30" height="20" fill="#6c7a93"/>
  <text x="10" y="72" font-size="12" fill="#1f2a44">in memory: 288 bytes</text>
  <rect x="10" y="80" width="184" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1">
    <rect x="194" y="80" width="24" height="26"/><rect x="218" y="80" width="24" height="26"/>
    <rect x="242" y="80" width="24" height="26"/><rect x="266" y="80" width="24" height="26"/>
  </g>
  <rect x="290" y="80" width="8" height="26" fill="#b4232c"/>
  <text x="102" y="97" font-size="11" text-anchor="middle" fill="#1f2a44">dict: 184</text>
  <text x="242" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">4 floats × 24</text>
  <text x="304" y="97" font-size="11" fill="#1f2a44">list slot 8</text>
</svg>
```

The bar lengths are to scale, one pixel per byte: $184 + 4 \times 24 + 8 = 288$ bytes, against the measured $84{,}591 \times 1024 / 300{,}000 \approx 289$. The four key strings are shared by every row, so they cost almost nothing.
:::

::: context pipeline-pull Pulled from the end, one row at a time
In a generator pipeline, nothing pushes. The consumer at the end asks for one item; that request travels back through every stage to the file, and one row travels forward.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="6" y="40" width="54" height="34" rx="4"/>
    <rect x="80" y="40" width="64" height="34" rx="4"/>
    <rect x="164" y="40" width="58" height="34" rx="4"/>
    <rect x="242" y="40" width="64" height="34" rx="4"/>
    <rect x="318" y="40" width="36" height="34" rx="4" fill="#f2b880"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="33" y="61">file</text><text x="112" y="61">lines_of</text><text x="193" y="61">parsed</text>
    <text x="274" y="61">in_window</text><text x="336" y="61">max</text>
  </g>
  <g stroke="#b4232c" stroke-width="1.5">
    <line x1="316" y1="32" x2="12" y2="32"/>
  </g>
  <polygon points="6,32 16,27 16,37" fill="#b4232c"/>
  <text x="180" y="22" font-size="11" text-anchor="middle" fill="#b4232c">"next, please" travels back</text>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="12" y1="84" x2="310" y2="84"/>
  </g>
  <polygon points="316,84 306,79 306,89" fill="#1d6fd1"/>
  <text x="180" y="104" font-size="11" text-anchor="middle" fill="#1d6fd1">one row travels forward</text>
</svg>
```

It is the same idea as a shell pipe such as `cat run.csv | grep ... | head`, where each program handles one line and passes it on.
:::

::: context open-file-limit Too many open files
Every open file uses a small numbered slot in the operating system, called a **file descriptor**. Each program is allowed only so many at once. On many Linux systems the default limit is 1,024, and you can see yours with the shell command `ulimit -n`.

When a program exceeds the limit, the next `open` fails with `OSError: [Errno 24] Too many open files`. It usually shows up in batch jobs that loop over hundreds of run files and forget to close each one — so it passes every small test and fails on the full dataset.
:::

::: context one-pass-statistics Mean and spread in a single pass
The textbook shortcut for the variance is "the mean of the squares minus the square of the mean". Both parts can be huge and nearly equal — think of altitudes near $400{,}000\,\mathrm{m}$ that vary by a few metres — and subtracting two nearly equal big numbers wipes out most of the significant digits.

The cure is to update the mean and the spread a little with each new value, instead of keeping giant sums. The standard recipe is **Welford's method**, published by B. P. Welford in 1962. It still reads the data once and keeps only three numbers, but stays accurate. You will meet the cancellation problem itself in the floating-point part of the NumPy module.
:::
