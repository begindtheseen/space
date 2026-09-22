---
id: l05-control-flow
title: Choosing and repeating: if, for, while
minutes: 21
covers:
  - if/elif/else; for, while, range, enumerate, zip; break/continue/else
---

So far every program in this module has run straight down the page, one line after another. Real work is not like that. A limit check does something only when a sample is out of range. A statistics pass visits every one of a hundred thousand samples. An integrator repeats a step until the vehicle reaches the ground. Those three shapes — choose, visit every element, repeat until a condition changes — are `if`, `for` and `while`, and together they are most of programming.

Python writes these with *indentation* rather than braces: the lines that belong to an `if` are the lines indented underneath it. That decision is why Python code from different people looks alike, and it is also why a stray space is a syntax error rather than a shrug. Get the indentation model straight first and the rest of the lesson is vocabulary.

The loop tools that come with `for` — `range`, `enumerate` and `zip` — deserve as much attention as `for` itself. Nearly every off-by-one error a beginner writes comes from managing an index by hand, and these three exist so that you do not have to.

## A block is a colon and an indent

A compound statement has a header line ending in a colon, then an indented *block* of lines that belong to it:

```python
# block_shape.py
peak = 12.71
limit = 12.5

if peak > limit:
    print("exceeded")     # exceeded
    print("by", round(peak - limit, 2), "m/s^2")   # by 0.21 m/s^2

print("check complete")   # check complete
```

The two indented lines run only when the condition is true. The last line is not indented, so it is outside the `if` and always runs. Four spaces per level is the universal convention — set your editor to insert spaces when you press tab, and never mix tabs and spaces in one file.

Python enforces this, and the messages are specific. A missing colon:

```python
# no_colon.py
ax = [0.02, 12.7]
for a in ax
    print(a)
```

```bash
python3 no_colon.py
#   File ".../no_colon.py", line 3
#     for a in ax
#                ^
# SyntaxError: expected ':'
```

A block that never got indented:

```python
# no_indent.py
ax = [0.02, 12.7]
for a in ax:
print(a)
```

```bash
python3 no_indent.py
#   File ".../no_indent.py", line 4
#     print(a)
#     ^
# IndentationError: expected an indented block after 'for' statement on line 3
```

Both are found before anything runs, as lesson 1 promised for errors of shape. Read the message: it names what it expected and which line the block belonged to.

## if, elif, else

```python
# limit_check.py
peak = 12.71
limit = 12.5

if peak > limit:
    status = "FAIL"
elif peak > 0.9 * limit:
    status = "MARGINAL"
else:
    status = "PASS"

print(status)   # FAIL
```

The conditions are tested in order and **the first true one wins**; the rest are not even evaluated. `elif` is "else if" as one word, and you may have any number of them. `else` is optional and takes no condition.

Order matters, and the usual bug is writing the loosest test first. If the first line had been `if peak > 0.9 * limit`, every failing peak would also match it and be reported as marginal, and the `FAIL` branch would be unreachable. Put the strictest condition first.

The condition does not have to be a `bool`. Whatever you write is passed through `bool` using the truthiness rule from lesson 4, so `if samples:` means "if the list is not empty". Comparisons can also be chained the way mathematics writes them, and `and`, `or` and `not` combine them:

```python
# conditions.py
q = 28.4          # kPa
alt = 11000.0     # m

print(0.0 <= q <= 35.0)                    # True
print(q > 30.0 or alt > 10000.0)           # True
print(not (q > 30.0) and alt > 10000.0)    # True
```

`0.0 <= q <= 35.0` means what it looks like, and evaluates `q` once. `and` and `or` are *short-circuiting*: `or` stops at the first true operand and `and` at the first false one, so writing `if n > 0 and total / n > 1.0` is safe — the division never happens when `n` is zero.

## for visits every element

A `for` loop walks a sequence and binds each element to a name in turn:

```python
# for_basics.py
for name in ["ax", "ay", "az"]:
    print(name)
# ax
# ay
# az
```

It works on anything iterable: a list, a tuple, a string (character by character), a set (in arbitrary order), a dictionary. Looping over a dictionary gives its **keys**; `.items()` gives key and value together, unpacked into two names:

```python
# for_dict.py
counts = {"ax": 3, "ay": 0}

for name in counts:
    print(name)
# ax
# ay

for name, n in counts.items():
    print(f"{name} {n}")
# ax 3
# ay 0
```

There is no counter to initialise, no length to get right, and no index at all. That is the point.

## range counts without building a list

When you need numbers rather than elements — repeat something five times, step through every fifth sample — `range` produces them:

```python
>>> list(range(5))
[0, 1, 2, 3, 4]
>>> list(range(2, 7))
[2, 3, 4, 5, 6]
>>> list(range(0, 10, 3))
[0, 3, 6, 9]
>>> list(range(5, 0, -1))
[5, 4, 3, 2, 1]
```

`range(stop)` counts from 0; `range(start, stop)` from `start`; the third argument is the step. As with slicing, the stop value is **excluded**, so `range(5)` gives five numbers ending at 4 and `range(len(xs))` gives exactly the valid indices of `xs`.

A `range` is not a list. It stores only the start, stop and step and produces values as they are wanted:

```python
>>> range(5)
range(0, 5)
>>> len(range(1000000))
1000000
```

`range(1000000)` costs a few dozen bytes, not eight megabytes, which is why `for i in range(10**7):` is ordinary and `for i in list(range(10**7)):` is a mistake. `list()` around it is only for looking at it, as above.

::: warning
Do not write `for i in range(len(xs)): x = xs[i]`. It is longer, it is the standard source of off-by-one errors, and it breaks the moment the sequence is something without indices. Loop over the elements directly, and when you also need the position, use `enumerate`.
:::

## enumerate gives the index with the item

```python
>>> list(enumerate(["ax", "ay", "az"]))
[(0, 'ax'), (1, 'ay'), (2, 'az')]
>>> list(enumerate(["ax", "ay", "az"], start=1))
[(1, 'ax'), (2, 'ay'), (3, 'az')]
```

Each item is a `(index, element)` tuple, which a `for` loop unpacks into two names: `for i, name in enumerate(channels):`. The `start` argument changes what the first index is called — `start=1` when you are numbering things for a human, who counts from one. It does not change which elements you get.

This matters more than it looks. A hand-maintained counter has to be incremented on every path through the loop body, and the day someone adds a `continue` for bad samples, the counter stops matching reality and every reported timestamp is wrong. `enumerate` cannot drift.

::: key
`enumerate(seq)` yields `(index, item)` pairs starting at 0; `enumerate(seq, start=1)` starts the index at 1. It replaces a manual counter, which is a standing source of off-by-one errors once a loop gains a `continue`.
:::

## zip walks two sequences in step

```python
>>> list(zip([0.0, 0.1, 0.2], [9.81, 9.79, 9.80]))
[(0.0, 9.81), (0.1, 9.79), (0.2, 9.8)]
```

`zip` pairs up the elements of two or more sequences, so `for t, a in zip(times, accels):` visits them together. It takes as many sequences as you like: `zip(ax, ay, az)` gives triples.

It stops at the **shortest** input, without a word:

```python
>>> list(zip([0.0, 0.1, 0.2], [9.81, 9.79]))
[(0.0, 9.81), (0.1, 9.79)]
```

For telemetry that is exactly the wrong default — if your time column and your data column have different lengths, something is wrong with the file and you want to know. Python 3.10 added an argument that says so:

```python
>>> list(zip([0.0, 0.1, 0.2], [9.81, 9.79], strict=True))
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ValueError: zip() argument 2 is shorter than argument 1
```

Use `strict=True` whenever the sequences are supposed to be the same length.

::: example The first sample over the limit
A limit check reports the first exceedance and the time it happened, or says clearly that there was none.

```python
# first_exceedance.py
ax = [0.02, 0.11, 3.94, 9.81, 12.06, 12.71, 11.98, 0.21]
dt = 0.1
limit = 12.5

for i, a in enumerate(ax):
    if a > limit:
        print(f"first exceedance: sample {i}, t = {i * dt:.1f} s, {a:.2f} m/s^2")
        break
else:
    print("no sample exceeded the limit")
# first exceedance: sample 5, t = 0.5 s, 12.71 m/s^2
```

`break` leaves the loop immediately — the remaining samples are not examined, which is the whole point of asking for the *first* one. The `else` attached to the `for` is the piece of syntax nobody guesses: it runs when the loop finished **without** breaking. Here that means "no sample matched", and it gives you the no-exceedance message without a found-it flag variable.

The timestamp comes from the index: sample 5 at 10 Hz is $5 \times 0.1 = 0.5$ s after the start. `enumerate` gave that index without a counter, so the report stays correct if the loop later gains a `continue` for invalid samples.
:::

## while repeats until something changes

`for` is for a known collection. `while` is for "keep going until", where you do not know in advance how many times:

```python
# countdown.py
t = 3
while t > 0:
    print(f"T-{t}")
    t -= 1
print("ignition")
# T-3
# T-2
# T-1
# ignition
```

`t -= 1` is *augmented assignment*: shorthand for `t = t - 1`. The family is `+=`, `-=`, `*=`, `/=` and the rest, and it is how a running total is accumulated: `total += x`.

The condition is tested before every pass, including the first, so a `while` whose condition is false at the start runs zero times. And the body must eventually make the condition false — if nothing inside the loop changes anything the condition depends on, it runs forever. Ctrl-C stops a runaway loop; the structural fix is to make the thing that changes obvious on the last line of the body, or to add a maximum iteration count and stop at it.

::: example Free fall, integrated one step at a time
A mass is dropped from 100 m. Step forwards in time with the simplest possible integrator and stop when it reaches the ground.

```python
# fall.py
h = 100.0      # m above the ground
v = 0.0        # m/s, positive downwards
g = 9.81       # m/s^2
dt = 0.01      # s
t = 0.0
steps = 0

while h > 0.0:
    v += g * dt
    h -= v * dt
    t += dt
    steps += 1

print(f"impact after {steps} steps: t = {t:.2f} s, v = {v:.2f} m/s")
# impact after 452 steps: t = 4.52 s, v = 44.34 m/s
print(repr(t))
# 4.519999999999948
```

The exact answer is $t = \sqrt{2 \times 100/9.81} = 4.515$ s and $v = 9.81 \times 4.515 = 44.3$ m/s, so 452 steps of 10 ms got within a hundredth of a second. This is Euler integration, the subject of a whole module later; here it is an excuse to see a `while` loop earn its place. You cannot write this as a `for` loop without first knowing the answer, because the number of steps is what you are computing.

The second print is the warning. `t` was built by adding `0.01` to itself 452 times, and the result is `4.519999999999948`, not `4.52`. A condition such as `while t != 5.0:` against an accumulated time would never fire. Count steps in an integer and compute `t = steps * dt` when you need it — the same advice lesson 12 gives in full.
:::

## break, continue, and the loop's else

Three statements steer a loop from inside it.

- `break` leaves the loop at once, skipping the `else` if there is one.
- `continue` skips the rest of this pass and goes on to the next element.
- `else` after a `for` or a `while` runs only if the loop ended normally, without a `break`.

`continue` is at its best for filtering out samples that should not take part:

```python
# drop_invalid.py
raw = [9.79, -999.0, 9.80, 9.78, -999.0]   # -999.0 marks a dropout
good = []

for s in raw:
    if s == -999.0:
        continue
    good.append(s)

print(good)                          # [9.79, 9.8, 9.78]
print(len(good))                     # 3
print(f"{sum(good) / len(good):.4f}")  # 9.7900
```

That is the *accumulator* pattern: start with an empty list, append inside the loop, use it after. Note that the mean must be over `len(good)`, not over `len(raw)` — dividing by the wrong count is how dropouts quietly bias a result.

::: warning
Never add to or remove from a list while looping over it. The loop walks by position, so removing an element shifts everything after it down and the loop skips one; appending inside the loop over the same list may never end. Build a new list, as `good` above does, and rebind the name afterwards if you want the old one replaced.
:::

## Check yourself

::: check
What does this print, and why is the `else` the thing that makes it correct?

```python
limits = {"ax": 12.5, "ay": 3.0}
for name, limit in limits.items():
    if limit < 1.0:
        print("suspicious limit on", name)
        break
else:
    print("all limits plausible")
```
:::

::: answer
It prints `all limits plausible`. Both limits are at least 1.0, so the `if` never fires, the loop runs to the end without a `break`, and the `for ... else` clause therefore runs. Without the `else` you would need a flag — set `found = False` before the loop, set it to `True` next to the `break`, and test it afterwards — which is three extra lines and one more thing to forget to reset. Note that `else` belongs to the `for`, not to the `if`: it is at the same indentation as `for`.
:::

::: check
A script pairs timestamps with samples using `zip(times, values)` and reports the mean of `values`. The file was truncated mid-write, so `times` has 1,000 entries and `values` has 998. What does the script report, and what would you change?
:::

::: answer
`zip` stops at the shorter sequence, so the loop sees 998 pairs and no error is raised. If the mean is computed inside the loop from the zipped pairs it is the mean of the 998 values, which is defensible; but the timestamps are now silently assumed to line up with values that may or may not correspond to them, and any later "1,000 samples" claim is wrong. Pass `strict=True` to `zip` so the mismatch raises `ValueError` and the truncated file is handled deliberately — dropped, repaired, or reported — rather than analysed as if it were complete.
:::

::: check
Rewrite this using `enumerate`, and say what breaks in the original if a `continue` is added at the top of the loop body.

```python
ax = [0.02, 12.06, 12.71]
i = 0
for a in ax:
    print(i, a)
    i += 1
```
:::

::: answer
`for i, a in enumerate(ax): print(i, a)`. In the original, `i` is incremented only by the last line of the body, so a `continue` above it skips the increment; the counter then stops matching the position in the list, and every index printed afterwards is too low by the number of skipped samples. `enumerate` takes its index from the sequence itself, so a `continue` cannot desynchronise it.
:::

::: check
Why does `while t != 4.52:` fail as a stopping condition for the free-fall integrator, and what should the loop do instead?
:::

::: answer
`t` is accumulated by repeated addition of 0.01, and after 452 additions it holds `4.519999999999948`, which is not equal to `4.52`. Exact equality between an accumulated float and a written decimal is a condition that may never be true, so the loop would run forever. Use an inequality on a physical quantity — `while h > 0.0:`, as the example does — or count steps with an integer and test `while steps < 452:`, computing `t = steps * dt` when a time is needed.
:::

::: check
What is the difference between `break` and `continue`, and which one would you use to stop reading a telemetry file as soon as you find the first line whose checksum is wrong?
:::

::: answer
`break` ends the loop entirely; `continue` abandons only the current pass and moves on to the next element. For a bad checksum it depends on what the bad line means. If the file is corrupt from that point on, `break` — everything after it is untrustworthy. If a single bad line is an isolated dropout in an otherwise good file, `continue` and count the skips, so the summary can report how many lines were discarded. Silently doing neither is the only wrong answer.
:::

## Summary

| Item | Statement |
| --- | --- |
| Block | Header line ends in `:`, body indented four spaces; no braces |
| `if` / `elif` / `else` | First true condition wins; put the strictest test first |
| Conditions | Passed through `bool`; chaining `0 <= q <= 35` allowed; `and`/`or` short-circuit |
| `for x in seq` | Visits elements directly; over a dict gives keys, over `.items()` gives pairs |
| `range(a, b, s)` | Lazy integer sequence, stop excluded; `range(len(xs))` is almost always the wrong tool |
| `enumerate(seq, start=0)` | Yields `(index, item)`; replaces a manual counter |
| `zip(a, b)` | Yields tuples, stops at the shortest; `strict=True` (3.10+) raises `ValueError` instead |
| `while cond` | Repeats while the condition holds; the body must change what the condition tests |
| `+=` | Augmented assignment: `t += dt` is `t = t + dt` |
| `break` / `continue` | Leave the loop / skip to the next pass |
| Loop `else` | Runs only if the loop ended without a `break` — "not found" without a flag |
| Mutation while looping | Never add to or remove from the sequence being looped over |

Every loop so far has been written out where it is used. The next lesson packages a loop and its calculation into a *function*, so that the limit check you just wrote can be called on each of four hundred channels without being copied four hundred times.
