---
id: l01-comprehensions
title: Comprehensions: saying what the result is
minutes: 20
covers:
  - List, dict and set comprehensions; generator expressions
---

There are two ways to ask a friend to fetch fruit. You can give step-by-step orders: "Take an empty bag. Walk along the shelf. Pick up each apple. If it is ripe, put it in the bag. Bring me the bag." Or you can describe the result: "Bring me every ripe apple on that shelf." Both get you the same bag of apples. The second says in one sentence what you want, and leaves nothing half-done along the way.

Python lets you write code both ways. You already know the first way: a `for` loop that builds a list one item at a time. This lesson teaches the second way, the **comprehension** — one expression whose value is the finished list. Nothing here gives you a power you lack. It teaches the form a code reviewer expects to see, and why that expectation is about fewer bugs, not about taste.

The same idea, with different brackets, builds dictionaries and sets. With round brackets it builds something that is not a container at all: a **generator expression**, which hands out items one at a time and never holds more than one. That last form matters when the input is a 50 GB telemetry file from a test flight rather than a seven-item list, and below you will measure the difference rather than take it on trust.

## The accumulate loop, and what is wrong with it

A very common job in analysis code is to **accumulate**: start with an empty container, walk through the items of some **iterable** (anything a `for` loop can walk through — a list, a file, a range), and put something into the container for some or all of them.

Here is a filter written the long way. It keeps the accelerometer samples above $10\,\mathrm{m/s^2}$. It is correct:

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

Read the middle line aloud as "**[[`s`, for each `s` in `samples`, if `s` is greater than ten|comprehension-anatomy]]**". The square brackets say "make a list". Inside, the first `s` is what to collect. `for s in samples` is the walk. `if s > 10.0` is the test each item must pass.

"Shorter" is not an argument by itself, so here is what the second version really gains.

**The name is bound once, to the finished answer.** In the loop version, `peaks` is set to an empty list four lines before it is done. In between, a name exists that holds a list that is not yet the answer. In a script that is a small risk. In a **[[Jupyter notebook|jupyter-cells]]**, where people re-run cells out of order, it is the most common way to get a list with twice as many entries as it should have: the cell with `peaks = []` did not run again, but the loop did.

**The thing you collect appears once.** In the loop, what you collect sits inside `append(...)`, several lines and two indents away from the name it ends up in. Suppose you later want `s - 9.80665` (the reading with standard gravity taken off) instead of `s`. The comprehension has exactly one place to change.

**The container type shows at the first character.** `[` means list. `{` with a colon inside means dict. `{` without a colon means set. `(` means generator. You know what `peaks` is before you have read what goes into it.

What you do *not* get is much speed. Timed with Python's built-in stopwatch module,

```bash
python3 -m timeit -s "n = 100_000" "out = []" "for x in range(n): out.append(x * x)"
python3 -m timeit -s "n = 100_000" "out = [x * x for x in range(n)]"
```

the loop took about 3.2 ms and the comprehension about 3.0 ms per pass on this machine — a few percent, and the gap moved around from run to run. That is noise next to anything you will do with the numbers afterwards. Use a comprehension because it has fewer places to be wrong, not because it is fast.

::: key
`[expr for name in iterable if condition]` evaluates to the list of `expr` for every item where `condition` is true. Read it left to right as "collect this, for each of these, when this holds". The name is local to the comprehension: it does not exist afterwards.
:::

## Dicts and sets use the same shape

Swap the brackets and you change the container. Curly braces with a colon in the front part give a **dict** (a lookup table of key–value pairs). Curly braces without a colon give a **set** (a bag of distinct items, no duplicates):

```python
>>> runs = [(1, 'nominal'), (2, 'hot'), (1, 'cold')]
>>> [case for case, tag in runs]
[1, 2, 1]
>>> {case for case, tag in runs}
{1, 2}
```

Each item of `runs` is a pair, so `for case, tag in runs` unpacks each pair into two names as it goes. The list keeps both copies of case `1`. The set keeps one.

That makes the set comprehension the natural answer to "which different values appear in this data?" As a loop it needs a container, a membership test and an append. As a set comprehension, removing duplicates is the data structure's job.

A dict comprehension is the natural way to build a lookup table from an existing dictionary. You write `key: value` at the front:

```python
>>> record = {'t_s': 12.5, 'ax_g': 0.013, 'q_psf': 412.7}
>>> {k: v for k, v in record.items() if k.endswith('_g')}
{'ax_g': 0.013}
>>> {k.upper(): v for k, v in record.items()}
{'T_S': 12.5, 'AX_G': 0.013, 'Q_PSF': 412.7}
```

`record.items()` hands out `(key, value)` pairs, which `for k, v in ...` unpacks. The first comprehension keeps only keys ending in `_g` (the acceleration channels, measured in g). The second keeps everything but renames each key in capitals.

The order of the output is the order of the input, and that is not luck. Every dict keeps its **insertion order** — the order keys were first put in — and the language has promised that since Python 3.7. If the same key comes up twice in a dict comprehension, the later value overwrites the earlier one and the key keeps its first position.

::: example Turning one telemetry row into a named record
A comma-separated telemetry file gives you a header line and rows of numbers. The fragile way to read a row assigns by position: `t = float(values[0])`, `ax = float(values[1])`, and so on. Then if someone adds a column, every later channel quietly shifts by one. Build the record from the header instead:

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

Step by step:

1. `header.split(",")` cuts the header at each comma: `['t_s', 'ax_g', 'ay_g', 'az_g', 'q_psf']`. The row splits the same way into five strings.
2. `zip(names, values, ...)` walks the two lists side by side, like a zipper joining two rows of teeth, handing out pairs: `('t_s', '12.500')`, `('ax_g', '0.013')`, and so on.
3. The dict comprehension turns each pair into `name: float(value)`, so each number is stored under the name the file itself gives it.
4. `record["q_psf"]` is **[[dynamic pressure|dynamic-pressure]]**, found by name: `412.7`.
5. The second comprehension keeps the three acceleration channels.

Two real gains. There is no column index anywhere, so a file with a new column between `az_g` and `q_psf` still parses correctly, and `record["q_psf"]` still means dynamic pressure. And **[[`strict=True`|zip-strict]]** turns a header that does not match the row into a `ValueError` right at the mismatch. Without it, `zip` would quietly stop at the shorter list, and you would get a short dict whose missing key surfaces three functions later.

Sanity check: five names, five values, five keys in the record. And `12.500` came back as `12.5` because `float` stores the number; the trailing zeros were only part of how the file spelled it.
:::

## A generator expression is the same syntax without the list

Think of the difference between a full ice-cube tray and an ice machine. The tray holds every cube at once and takes up freezer space for all of them. The machine holds none: it makes the next cube when you press the lever.

Round brackets give you the ice machine. A **generator** is an object that knows how to produce the next item and has produced none yet. Writing it computes nothing. Here is the measurement, made with **[[`tracemalloc`|tracemalloc]]**, a standard module that counts the memory Python allocates:

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
# <generator object <genexpr> at 0x7f63ed1fc110>
# 333332833333500000
# 0
```

`get_traced_memory()[0]` is the memory in use right now, so each "after minus before" is the cost of one line. The list of a million squares costs about 40 MB — roughly **[[40 bytes per number|list-memory]]**. The generator that would produce the same million costs 440 bytes. That is not a small constant you can ignore. It is the difference between a program that runs and one the operating system kills when the input file grows.

The hex number on the third line is the object's address in memory. It changes every run; the rest of the output reproduces exactly.

Sanity check on the sum: the sum of $x^2$ for $x$ from $0$ to $n-1$ is $\frac{(n-1)n(2n-1)}{6}$. With $n = 1{,}000{,}000$ that is $333{,}332{,}833{,}333{,}500{,}000$, matching the fourth line.

The last line is the price. A generator is used up by one pass. The first `sum(lazy)` consumed every item. The second found nothing left and returned `0` — not an error, which is what makes it dangerous. If you need the data twice, you need a list.

When a generator expression is the only argument to a function, you may drop its own brackets. That is why `sum(x * x for x in values)` is the natural way to write a total, and `sum([x * x for x in values])` is not: the second builds the whole list, adds it up, and throws it away.

```bash
python3 -m timeit -s "n = 1_000_000" "sum([x * x for x in range(n)])"
python3 -m timeit -s "n = 1_000_000" "sum(x * x for x in range(n))"
```

On this machine that is about 60 ms against about 44 ms, and 40 MB against almost nothing. Here the idiom is faster *and* smaller, for one reason: the list was never needed.

::: key
`(expr for x in it)` is lazy: it holds one item at a time and can be walked once. `[expr for x in it]` is eager: it holds all of them and can be walked any number of times, indexed and measured with `len`. Choose by whether you need random access or a second pass — not by which reads better.
:::

::: example A dispersion sweep you do not have room to store
A **[[dispersion sweep|dispersion-sweep]]** runs the same simulation many times with slightly different inputs. Here there are 200,000 such cases, each reporting its peak dynamic pressure in kilopascals. You want three things: how many cases went over the $35\,\mathrm{kPa}$ structural limit, their case numbers, and the worst value overall.

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

How to read it:

1. `sweep` stands in for the real simulation. Each case draws a peak pressure from a bell curve centred on $31\,\mathrm{kPa}$ with a spread of $2.4\,\mathrm{kPa}$ (`rng.gauss(mean, spread)`).
2. `measure` runs whatever you hand it and reports how much memory the result took. (`lambda: ...` wraps a line of code as a small function to hand over; lesson 3 covers it.)
3. The list comprehension keeps the case numbers over the limit. The `_` in `for _, q in ...` is a name meaning "I do not need this part".
4. `max(...)` over a generator expression finds the worst value.

The case numbers you must keep, because you will go back and look at those runs. That list costs about 390 kB — about 41 bytes per case — and is worth it. The worst value needs nothing kept: `max` walks all 200,000 results holding only the running maximum, 24 bytes.

Sanity check: for a bell curve, a value more than $\frac{35 - 31}{2.4} \approx 1.67$ times the spread above the middle turns up about $4.8\%$ of the time, and $4.8\%$ of 200,000 is about 9,560. The run found 9,529. Close, as it should be.

Giving `random.Random` a fixed **[[seed|random-seed]]** is what makes those numbers come out identically on your machine and this one. The function `sweep`, with its `yield`, is a generator function — the subject of the next lesson. Notice that it, too, never builds a list of 200,000 results.
:::

## Where a comprehension is the wrong tool

A comprehension is an expression that *produces a value*. If you do not want the value, you want a loop:

```python
>>> samples = [9.81, 12.4, 14.2]
>>> flags = [print(s) for s in samples]
9.81
12.4
14.2
>>> flags
[None, None, None]
```

`print` shows each number, then returns `None`, Python's "nothing here" value. So `flags` is a list of three `None`s that nobody wants. Writing a comprehension only for what it *does* along the way — its **side effects** — is a recognised **[[code smell|code-smell]]**, because it builds and throws away a list as long as the input.

::: warning Long comprehensions and the vanishing variable
Two more limits, before a reviewer points them out.

A comprehension with more than one `for` and one `if` is usually harder to read than the loop it replaces. The `for` clauses run **[[left to right, outer first|nested-for-order]]**, so `[v for row in grid for v in row]` flattens a grid — but most people read that nesting backwards.

And the comprehension's variable does not leak out. After `[s for s in samples]`, the name `s` is not changed in the code around it. That is a feature, but it means you cannot inspect the last value afterwards.
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

The first comprehension reads: for each `row` in `grid`, for each `v` in that `row`, collect `v`. The second shows the **[[separate scope|comprehension-scope]]**: the `s` inside the brackets is its own name, and the outer `s` still holds `'untouched'`.

## Check yourself

::: check
Rewrite as a comprehension: `out = []` then `for r in rows:` then `if r.status == "ok":` then `out.append(r.duration * 1e-3)`.
:::

::: answer
```python
out = [r.duration * 1e-3 for r in rows if r.status == "ok"]
```

The filter comes after the `for` and reads in the same order as the loop: for each `r` in `rows`, if its status is `"ok"`, collect the duration times $10^{-3}$ (milliseconds turned into seconds, say).

One thing to check whenever you make this change: the `if` in the loop must guard *only* the `append`. If it also guarded some other statement, the comprehension does not do the same thing.
:::

::: check
`sum([x ** 2 for x in residuals])` and `sum(x ** 2 for x in residuals)` give the same number. Name the two differences, and say which you would write.
:::

::: answer
The first builds a complete list of squares, sums it, and throws the list away. The second makes one square at a time and never holds a list.

So the differences are **memory** — growing with the length of `residuals` for the first, constant for the second — and **time**, because building and freeing that list is work that adds nothing.

Measured at a million elements with `python3 -m timeit`, the list version took about 60 ms and the generator version about 44 ms. Write the second. Its brackets may be left off only because the generator expression is the function's sole argument, which it is here.
:::

::: check
You write `q = (row[4] for row in rows)`, then `print(max(q))` and `print(min(q))`. The maximum prints correctly and the minimum raises. What is the exception, and why?
:::

::: answer
`max(q)` walked the generator to its end. So `min(q)` gets an empty iterator and raises `ValueError: min() arg is an empty sequence`. A generator is a one-pass object. It does not rewind, and there is no way to ask it to.

The fix depends on which cost you would rather pay. If the data fits in memory, build it once with `q = [row[4] for row in rows]` and take both answers from the list. If it does not fit, walk it once and track both extremes yourself, or build two separate generators from the source.
:::

::: check
A colleague's parser assigns `t = float(values[0])`, `ax = float(values[1])`, and so on down to `q = float(values[6])`. The telemetry team adds a column in the middle of the file. What happens, and what does the dict comprehension in this lesson do instead?
:::

::: answer
Every channel from the new column onward is read from the wrong position, and nothing raises. The values are all numbers, so the parse succeeds, and `q` now holds whatever the neighbouring channel contained. That is the worst kind of failure: believable numbers with the wrong meaning, found a week later when a plot looks strange.

`{name: float(value) for name, value in zip(names, values, strict=True)}` stores each value under the name the file's own header gives it. An inserted column only adds a key; every existing key still means what it meant. And if the header and a row have different lengths, `strict=True` raises `ValueError` at once instead of quietly cutting to the shorter one.
:::

::: check
When is `[x for x in it]` the right thing to write, and when is it a sign of a misunderstanding?
:::

::: answer
It is right when you need a list and `it` is not one: turning a generator, a `zip`, a file object or a dict's `.keys()` view into a list so you can index it, take its length, sort it or walk it twice. Many people write `list(it)` for this. It does the same thing and reads better, since no item is being changed.

It is a misunderstanding when `it` is already a list and you wanted a copy. Then the natural spelling is `it.copy()` or `list(it)`, and a reviewer will ask why a loop was written where none was needed. It is also a misunderstanding when it forces a generator that was made lazy on purpose, throwing away the memory saving the generator was written for.
:::

## Summary

| Form | Produces | Notes |
| --- | --- | --- |
| `[e for x in it]` | list | Eager; indexable, re-walkable, has `len` |
| `[e for x in it if c]` | list | Filter clause follows the `for`, reads in the same order |
| `{k: v for x in it}` | dict | Insertion-ordered; later duplicate keys overwrite earlier ones |
| `{e for x in it}` | set | Removes duplicates; no order; elements must be hashable |
| `(e for x in it)` | generator | Lazy, one item at a time, single pass; brackets optional as a sole argument |
| Measured here | — | List of 1,000,000 squares: 40,448,528 bytes. The generator: 440 bytes |
| Measured here | — | `sum` over the list about 60 ms, over the generator about 44 ms, `python3 -m timeit` |
| Not a reason | speed | Loop-and-append against comprehension differed by a few percent here |
| Wrong tool | side effects | `[print(x) for x in xs]` builds a list of `None`; write a `for` loop |

The next lesson takes the generator apart. `(x * x for x in it)` is a shortcut for one fixed shape. The keyword `yield` lets you write a generator whose body is any code you like, which is how a telemetry reader streams a file it could never hold in memory.

::: context comprehension-anatomy Three parts, same as the loop
Every comprehension has the same three parts as the loop it replaces. They are only rearranged, so the thing you collect comes first.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="340" height="34" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="26" y="18" width="16" height="22" fill="#f2b880"/>
  <rect x="50" y="18" width="136" height="22" fill="#8fb8f0"/>
  <rect x="194" y="18" width="100" height="22" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <g font-size="13" fill="#1f2a44" font-family="monospace">
    <text x="16" y="34">[</text>
    <text x="30" y="34">s</text>
    <text x="56" y="34">for s in samples</text>
    <text x="200" y="34">if s &gt; 10.0</text>
    <text x="304" y="34">]</text>
  </g>
  <text x="180" y="66" font-size="11" text-anchor="middle" fill="#6c7a93">the same three parts as a loop</text>
  <rect x="14" y="80" width="12" height="12" fill="#8fb8f0"/>
  <rect x="14" y="106" width="12" height="12" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <rect x="14" y="132" width="12" height="12" fill="#f2b880"/>
  <g font-size="12" fill="#1f2a44" font-family="monospace">
    <text x="34" y="91">for s in samples:</text>
    <text x="50" y="117">if s &gt; 10.0:</text>
    <text x="66" y="143">peaks.append(s)</text>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="240" y="91">the walk</text>
    <text x="240" y="117">the test</text>
    <text x="240" y="143">what to keep</text>
  </g>
  <text x="180" y="164" font-size="11" text-anchor="middle" fill="#6c7a93">only "what to keep" moves to the front</text>
</svg>
```

Match the colours: the walk and the test keep their order, and the kept expression jumps to the front, where it is easy to find.
:::

::: context jupyter-cells Why notebooks make half-built lists dangerous
A **Jupyter notebook** is a document split into **cells**, small boxes of code you run one at a time, with the output shown under each. Analysts love them for exploring flight data, because you can re-run one step without re-running everything.

That freedom is the trap. Nothing forces cells to run top to bottom. If `peaks = []` sits in one cell and the loop that appends sits in the next, re-running only the loop cell appends everything a second time. A comprehension puts the empty start and the filling in one line, so there is nothing to run out of order.
:::

::: context dynamic-pressure What q means
**Dynamic pressure**, written $q$, measures how hard the air pushes on a vehicle moving through it: $q = \frac{1}{2}\rho v^2$, where $\rho$ is air density and $v$ is speed. It rises as a rocket speeds up and falls as the air thins, so it peaks partway up, at a moment called **max-q**. That peak is when the structure is loaded hardest, which is why every analysis script cares about it.

The column `q_psf` stores it in pounds per square foot, a US unit that still appears in some data files. One psf is about $47.9\,\mathrm{Pa}$, so $412.7\,\mathrm{psf}$ is about $19.8\,\mathrm{kPa}$.
:::

::: context zip-strict Where strict=True came from
Plain `zip` stops as soon as its shortest input runs out, with no warning. For about twenty years that silent cut caused quiet data-loss bugs: a header one name short, and the last column vanished without a word.

Python 3.10 added the `strict=True` option. With it, `zip` raises `ValueError` the moment one input runs out before the others. Use it whenever the inputs are *supposed* to be the same length — which, when you are pairing a header with a row, they always are. On Python 3.9 or older the keyword does not exist and the call itself fails.
:::

::: context tracemalloc What tracemalloc actually counts
`tracemalloc` ("trace memory allocations") is part of Python's standard library. Once started, it records every block of memory Python's own allocator hands out, and `get_traced_memory()` returns two numbers: the bytes in use now, and the highest value seen since tracing began (the **peak**).

It counts Python's allocations only. It does not include the interpreter itself or memory that libraries grab outside Python's allocator, so the operating system will report a larger total for the whole program. For comparing two ways of writing the same line, as in this lesson, that is exactly the right tool: the fixed costs cancel out.
:::

::: context list-memory Where 40 bytes per number goes
A Python list does not hold numbers directly. It holds a row of **pointers** — 8-byte memory addresses — and each pointer leads to a separate integer object somewhere else.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">list: one 8-byte pointer per item</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="10" y="30" width="44" height="26"/><rect x="54" y="30" width="44" height="26"/>
    <rect x="98" y="30" width="44" height="26"/><rect x="142" y="30" width="44" height="26"/>
  </g>
  <text x="200" y="48" font-size="12" fill="#1f2a44">… 1,000,000 of them</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#f2b880">
    <rect x="10" y="110" width="64" height="30"/><rect x="96" y="110" width="64" height="30"/>
    <rect x="182" y="110" width="64" height="30"/><rect x="268" y="110" width="64" height="30"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="42" y="129">int 0</text><text x="128" y="129">int 1</text>
    <text x="214" y="129">int 4</text><text x="300" y="129">int 9</text>
  </g>
  <g stroke="#b4232c" stroke-width="1.5">
    <line x1="32" y1="56" x2="42" y2="110"/><line x1="76" y1="56" x2="128" y2="110"/>
    <line x1="120" y1="56" x2="214" y2="110"/><line x1="164" y1="56" x2="300" y2="110"/>
  </g>
  <text x="180" y="162" font-size="11" text-anchor="middle" fill="#6c7a93">each integer object: 28–32 bytes</text>
</svg>
```

For the million squares, the pointer row (with a little spare room for growth) is about 8.4 MB, and the integer objects about 31.9 MB. Together that is the 40 MB measured. (Python keeps one shared copy of each small whole number from −5 to 256, so the first few squares point at shared objects; nearly all of the million are separate.)
:::

::: context dispersion-sweep Dispersion sweeps and Monte Carlo
No real flight goes exactly as planned. The engine pushes a bit harder, the wind blows a bit differently, the vehicle weighs a few kilograms more. To check that a design survives all of that, engineers run the simulation thousands of times, each time drawing every uncertain input at random from its expected spread. This is a **Monte Carlo** analysis, named after the casino, and in launch work it is often called a **dispersion** analysis.

The output is a huge table of cases. The questions asked of it are the ones in the example: how many cases broke a limit, which ones, and what was the worst.
:::

::: context random-seed What a seed does
Computer random numbers are **pseudo-random**: a fixed recipe turns one starting number, the **seed**, into a long sequence that looks random. Give the same seed and you get the same sequence, every time, on every machine.

`random.Random(20250922)` makes a private generator with that seed. That is why this lesson can print `9529` and promise you will see `9529` too. In a real dispersion campaign, recording the seed lets anyone re-create a single failing case exactly, which is how that case gets debugged.
:::

::: context code-smell What a code smell is
A **code smell** is a pattern that is not strictly a bug but hints that something is off, the way a smell in the kitchen hints that something has gone bad. The program still runs. A reviewer still asks you to change it.

A comprehension written for its side effects smells because it says "I am building a list" while the author only wanted the loop's actions. The next reader wastes time wondering what the list is for — and the program wastes memory building it.
:::

::: context nested-for-order Which loop is outside
In a comprehension with two `for` clauses, the first one written is the outer loop, exactly as if you had written the loops on separate lines, top to bottom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" font-family="monospace">
    <text x="10" y="24" fill="#1f2a44">[v</text>
    <text x="36" y="24" fill="#1d6fd1">for row in grid</text>
    <text x="160" y="24" fill="#b4232c">for v in row</text>
    <text x="258" y="24" fill="#1f2a44">]</text>
  </g>
  <rect x="36" y="30" width="116" height="3" fill="#1d6fd1"/>
  <rect x="160" y="30" width="94" height="3" fill="#b4232c"/>
  <g font-size="12" font-family="monospace">
    <text x="10" y="66" fill="#1d6fd1">for row in grid:</text>
    <text x="30" y="86" fill="#b4232c">for v in row:</text>
    <text x="50" y="106" fill="#1f2a44">collect v</text>
  </g>
  <text x="220" y="78" font-size="11" fill="#6c7a93">outer loop first,</text>
  <text x="220" y="94" font-size="11" fill="#6c7a93">inner loop second</text>
</svg>
```

So `[v for row in grid for v in row]` visits `[1, 2]`, then `[3, 4]`, then `[5, 6]`, and yields 1 to 6 in order.
:::

::: context comprehension-scope Why the variable stays inside
Python treats a comprehension as if it were a tiny hidden function of its own, so its loop variable lives in its own **scope** (the region of code where a name exists) and disappears when it finishes. Up to Python 3.11 it really was a hidden function; Python 3.12 removed the function to make comprehensions faster but kept the rule.

It was not always so. In Python 2, a list comprehension's variable did leak into the surrounding code and could overwrite a name you cared about. Python 3 closed that hole, making list comprehensions behave like generator expressions, which had always kept their variable inside.
:::
