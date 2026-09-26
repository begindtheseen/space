---
id: l05-control-flow
title: Choosing and repeating: if, for, while
minutes: 20
covers:
  - if/elif/else; for, while, range, enumerate, zip; break/continue/else
---

Think about your morning. *If* it is raining, you take a coat. *For each* book on your list, you put it in your bag. *While* the toast is not brown, you wait. Those are the three shapes of almost every set of instructions: choose, go through every item, and repeat until something changes.

So far every program in this module has run straight down the page, one line after another. Real work is not like that. A limit check does something only when a sample is out of range. A statistics pass visits every one of a hundred thousand samples. A simulation repeats a small time step until the vehicle reaches the ground. In Python those three shapes are `if`, `for` and `while`, and together they are most of programming.

This lesson also teaches three helpers that come with `for`: `range`, `enumerate` and `zip`. They deserve as much attention as `for` itself. Nearly every **off-by-one error** — a loop that runs one time too many or one too few — comes from keeping track of a position number by hand. These three exist so that you do not have to.

## A block is a colon and an indent

Python groups lines by **indentation**: how far a line is pushed in from the left edge. Many other languages use curly braces for this. Python uses the **[[white space itself|indentation-origin]]**.

A **compound statement** — an `if`, a `for`, a `while` — has a header line that ends in a colon `:`. Under it comes an indented **block**: the lines that belong to it.

```python
# block_shape.py
peak = 12.71
limit = 12.5

if peak > limit:
    print("exceeded")     # exceeded
    print("by", round(peak - limit, 2), "m/s^2")   # by 0.21 m/s^2

print("check complete")   # check complete
```

Read `peak > limit` aloud as "peak is greater than limit". It is `True` here, since $12.71 > 12.5$. So the two indented lines run. The last line is not indented. It sits outside the `if`, so it always runs.

The convention everywhere is **four spaces per level**. Set your editor to insert spaces when you press Tab, and **[[never mix tabs and spaces|tabs-and-spaces]]** in one file.

Python checks the shape of your code before it runs anything, and its messages are specific. Here is a missing colon:

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

And here is a block that never got indented:

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

Both errors appear before a single line runs, as lesson 1 promised for mistakes of shape. Read the message: it says what it expected, and which line the block belonged to.

## if, elif, else

An `if` can have more than two outcomes. Think of a traffic light: green, amber or red, checked in order.

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

Here is the rule. The conditions are tested from the top down, and **the first true one wins**. The rest are not even looked at.

- `elif` is short for "else if". You may have as many as you like.
- `else` is optional. It takes no condition and catches everything left over.

Order matters, and the usual bug is putting the loosest test first. Suppose the first line had been `if peak > 0.9 * limit`. That is $0.9 \times 12.5 = 11.25$, and every failing peak is also above 11.25. So every failure would be reported as `MARGINAL`, and the `FAIL` branch could never run. **Put the strictest condition first.**

### What can go in a condition

The condition does not have to be `True` or `False`. Whatever you write is passed through `bool`, using the truthiness rule from lesson 4. So `if samples:` means "if the list is not empty".

Comparisons are `<`, `>`, `<=` ("less than or equal to"), `>=`, `==` ("is equal to" — two equals signs, because one `=` means assignment) and `!=` ("is not equal to"). You can **chain** them the way mathematics does. And the words `and`, `or` and `not` combine them:

```python
# conditions.py
q = 28.4          # kPa
alt = 11000.0     # m

print(0.0 <= q <= 35.0)                    # True
print(q > 30.0 or alt > 10000.0)           # True
print(not (q > 30.0) and alt > 10000.0)    # True
```

Take them one at a time.

1. `0.0 <= q <= 35.0` means what it looks like: $q$ is between 0 and 35. It is, so `True`.
2. `q > 30.0` is false, but `alt > 10000.0` is true. `or` needs only one, so `True`.
3. `not (q > 30.0)` is `not False`, which is `True`. The altitude test is also true, so `and` gives `True`.

`and` and `or` are **short-circuiting**: they stop as soon as the answer is known. `or` stops at the first true part. `and` stops at the first false part. That makes `if n > 0 and total / n > 1.0:` safe. When `n` is zero, the first part is false, so the division is **[[never attempted|short-circuit]]**.

## for visits every element

A `for` loop walks through a collection and gives each element a name, one at a time. Read `for name in channels:` as "for each name in channels".

```python
# for_basics.py
for name in ["ax", "ay", "az"]:
    print(name)
# ax
# ay
# az
```

It works on anything **[[iterable|iterable]]** — anything that can hand out its items one at a time. That includes a list, a tuple, a string (one character at a time), a set (in no particular order) and a dictionary.

Looping over a dictionary gives you its **keys**. Looping over `.items()` gives key and value together, and the loop can **unpack** each pair into two names:

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

Notice what is missing. There is no counter to set up, no length to get right, and no position number at all. That is the point.

## range counts without building a list

Sometimes you need numbers rather than elements: do something five times, or step through every third sample. `range` produces them:

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

The three forms:

- `range(stop)` counts from 0 up to `stop`.
- `range(start, stop)` counts from `start`.
- `range(start, stop, step)` jumps by `step` each time. A negative step counts down.

As with slicing, the stop value is **left out**. So `range(5)` gives five numbers, 0 to 4. And `range(len(xs))` gives exactly the valid positions of `xs`. Sanity check: `range(2, 7)` should hold $7 - 2 = 5$ numbers, and it does.

A `range` is not a list. It stores only its start, stop and step, and works out each number when it is asked for:

```python
>>> range(5)
range(0, 5)
>>> len(range(1000000))
1000000
```

So `range(1000000)` takes **[[a few dozen bytes|range-memory]]**, not eight megabytes. That is why `for i in range(10**7):` is ordinary, while `for i in list(range(10**7)):` wastes memory for nothing. Use `list()` around a range only to look at it, as above.

::: warning Do not index your way through a list
Do not write `for i in range(len(xs)): x = xs[i]`. It is longer, it is the classic source of **[[off-by-one errors|fencepost]]**, and it breaks as soon as the collection is something without positions, such as a set. Loop over the elements directly. When you also need the position, use `enumerate`.
:::

## enumerate gives the position with the item

`enumerate` hands out each item together with its position number, its **index**:

```python
>>> list(enumerate(["ax", "ay", "az"]))
[(0, 'ax'), (1, 'ay'), (2, 'az')]
>>> list(enumerate(["ax", "ay", "az"], start=1))
[(1, 'ax'), (2, 'ay'), (3, 'az')]
```

Each item is an `(index, element)` tuple. A `for` loop unpacks it into two names: `for i, name in enumerate(channels):`.

The `start` argument changes only what the first index is called. Use `start=1` when you number things for a person, who counts from one. It does not change which elements you get.

Why does this matter so much? Picture counting laps on a track with a hand clicker. You must click on every lap, every time. The day you skip a click, every count after that is wrong. A hand-kept counter in a loop is the same. It must be increased on every path through the loop. The day someone adds a `continue` to skip bad samples, the counter stops matching reality, and every timestamp it produces is wrong. `enumerate` takes the index from the sequence itself, so it cannot drift.

::: key
`enumerate(seq)` yields `(index, item)` pairs starting at 0; `enumerate(seq, start=1)` starts the index at 1. It replaces a manual counter, which is a standing source of off-by-one errors once a loop gains a `continue`.
:::

## zip walks two sequences in step

Picture a zipper: teeth from the left side and teeth from the right side, meshed one pair at a time. **`zip`** does that with sequences:

```python
>>> list(zip([0.0, 0.1, 0.2], [9.81, 9.79, 9.80]))
[(0.0, 9.81), (0.1, 9.79), (0.2, 9.8)]
```

It pairs the first items, then the second items, and so on. So `for t, a in zip(times, accels):` visits a time and its reading together. It takes as many sequences as you like: `zip(ax, ay, az)` gives triples.

Here is the catch. `zip` stops at the **shortest** input, and it does not say a word:

```python
>>> list(zip([0.0, 0.1, 0.2], [9.81, 9.79]))
[(0.0, 9.81), (0.1, 9.79)]
```

For telemetry, that is exactly the wrong default. If your time column and your data column have different lengths, something is wrong with the file, and you want to know. Python 3.10 added an argument that says so:

```python
>>> list(zip([0.0, 0.1, 0.2], [9.81, 9.79], strict=True))
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ValueError: zip() argument 2 is shorter than argument 1
```

Use `strict=True` whenever the sequences are supposed to be the same length.

::: example The first sample over the limit
A limit check should report the first sample over the limit and the time it happened — or say clearly that there was none.

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

Trace it by hand.

1. Samples 0 to 4 are 0.02, 0.11, 3.94, 9.81 and 12.06. None is above 12.5, so the `if` does nothing.
2. Sample 5 is 12.71, which is above 12.5. The message prints.
3. `break` leaves the loop at once. Samples 6 and 7 are never examined — which is the whole point of asking for the *first* one.

Now the piece of syntax nobody guesses: the `else` under the `for`. It is lined up with `for`, not with `if`, so it belongs to the loop. It runs only when the loop finished **without** a `break`. Here that means "no sample matched". You get the "none" message without a separate found-it flag.

The time comes from the index. The samples are $0.1$ s apart (10 Hz), so sample 5 is $5 \times 0.1 = 0.5$ s after the start. Sanity check: there are eight samples, so the whole record is under a second, and 0.5 s is inside it.
:::

## while repeats until something changes

A `for` loop is for a collection you already have. A `while` loop is for "keep going until…", when you do not know in advance how many times. Read `while t > 0:` as "as long as t is greater than zero".

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

`t -= 1` is **augmented assignment**, read "t minus-equals one". It is shorthand for `t = t - 1`. The family includes `+=`, `-=`, `*=` and `/=`. A running total is built with `total += x`.

Two rules keep a `while` loop honest.

- The condition is tested *before* every pass, including the first. A `while` whose condition is false at the start runs zero times.
- The body must eventually make the condition false. If nothing inside the loop changes what the condition tests, it runs forever. **[[Ctrl-C|ctrl-c]]** stops a runaway program. The real fix is to make the changing line obvious, or to add a maximum number of passes and stop there.

::: example Free fall, one small step at a time
Drop a mass from 100 m. Step forward in time in tiny slices, and stop when it reaches the ground.

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

Each pass of the loop is one slice of $0.01$ s:

1. Gravity speeds the mass up by $9.81 \times 0.01 = 0.0981$ m/s.
2. At its new speed, it falls $v \times 0.01$ metres, so the height drops by that much.
3. The clock moves on by $0.01$ s, and the step counter goes up by one.

The loop stops on the first pass that takes the height to zero or below.

Is 452 steps right? The exact answer from physics is

$$
t = \sqrt{\frac{2h}{g}} = \sqrt{\frac{2 \times 100}{9.81}} = 4.515\,\mathrm{s},
$$

and the speed then is $v = g t = 9.81 \times 4.515 = 44.3\,\mathrm{m/s}$. So 452 steps of 10 ms landed within a hundredth of a second. This method is called **[[Euler integration|euler]]**.

You could not write this as a `for` loop without knowing the answer first, because the number of steps is what you are computing. That is exactly the job `while` is for.

Now the second print, which is a warning. `t` was built by adding `0.01` to itself 452 times, and it holds `4.519999999999948`, not `4.52`. A loop that stopped on `while t != 5.0:` against a time built this way might never stop. Count steps with an integer instead, and compute `t = steps * dt` when you need a time. Lesson 12 explains why.
:::

## break, continue, and the loop's else

Three statements steer a loop from inside it:

- `break` leaves the loop at once, and skips the loop's `else` if it has one.
- `continue` skips the rest of this pass and goes on to the next element.
- `else` after a `for` or a `while` runs only if the loop ended normally, **[[without a `break`|loop-else]]**.

`continue` is at its best for filtering out samples that should not count:

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

Here `-999.0` is a **[[marker value|sentinel]]** meaning "the sensor dropped out". Every time the loop meets one, `continue` jumps straight to the next sample, so `append` is skipped.

This is the **accumulator pattern**: start with an empty list, add to it inside the loop, and use it afterwards. Check the mean: $(9.79 + 9.80 + 9.78) / 3 = 29.37 / 3 = 9.79$. That is right in the middle of the three, as it should be. The mean must be over `len(good)`, which is 3, not `len(raw)`, which is 5. Dividing by the wrong count is how dropouts quietly spoil a result.

::: warning Never change a list while looping over it
Never add to or remove from a list while you are looping over it. The loop walks by position. Removing an element shifts everything after it down one place, so the loop skips an element. Appending to the same list inside the loop may never end. Build a new list instead, as `good` does above, and rebind the name afterwards if you want the old one replaced.
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
It prints `all limits plausible`.

Both limits, 12.5 and 3.0, are at least 1.0, so the `if` never fires. The loop runs to the end without a `break`, and so the loop's `else` runs.

Without the `else` you would need a flag: set `found = False` before the loop, set it to `True` next to the `break`, and test it afterwards. That is three extra lines and one more thing to forget. Notice that the `else` belongs to the `for`, not the `if`: it is lined up with `for`.
:::

::: check
A script pairs timestamps with samples using `zip(times, values)` and reports the mean of the values. The file was cut off partway through writing, so `times` has 1,000 entries and `values` has 998. What does the script report, and what would you change?
:::

::: answer
`zip` stops at the shorter sequence, so the loop sees 998 pairs and no error is raised.

If the mean is computed from the zipped pairs, it is the mean of the 998 values. That number is defensible on its own. But the timestamps are now quietly assumed to line up with values that may not match them, and any later claim of "1,000 samples" is wrong.

Pass `strict=True` to `zip`. Then the mismatch raises `ValueError`, and the damaged file gets handled on purpose — dropped, repaired or reported — instead of analysed as if it were complete.
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
The rewrite:

```python
for i, a in enumerate(ax):
    print(i, a)
```

In the original, only the last line of the body increases `i`. A `continue` above it skips that line. The counter then falls behind the real position, and every index printed afterwards is too low by the number of skipped samples. `enumerate` takes its index from the sequence itself, so a `continue` cannot knock it out of step.
:::

::: check
Why does `while t != 4.52:` fail as a stopping test for the free-fall loop, and what should the loop do instead?
:::

::: answer
`t` is built by adding 0.01 again and again. After 452 additions it holds `4.519999999999948`, which is not equal to `4.52`. So `t != 4.52` stays true on every pass, and the loop never stops.

Testing whether a built-up float *equals* a written decimal is a test that may never pass. Use an inequality on a physical quantity instead — `while h > 0.0:`, as the example does. Or count steps with an integer, test `while steps < 452:`, and compute `t = steps * dt` when you need a time.
:::

::: check
What is the difference between `break` and `continue`? Which would you use to stop reading a telemetry file at the first line whose checksum is wrong?
:::

::: answer
`break` ends the loop entirely. `continue` abandons only the current pass and moves on to the next element.

Which one fits depends on what a bad line means.

- If the file is corrupt from that point on, use `break`: nothing after it can be trusted.
- If one bad line is an isolated dropout in an otherwise good file, use `continue` and count the skips, so the summary can say how many lines were thrown away.

The only wrong answer is to do neither and quietly analyse the bad line.
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
| Changing while looping | Never add to or remove from the sequence being looped over |

Every loop so far has been written out right where it is used. The next lesson packages a loop and its calculation into a **function**, so that the limit check you wrote here can be called on each of four hundred channels without being copied four hundred times.

::: context indentation-origin Where the indents came from
Guido van Rossum, who created Python, had earlier worked on a teaching language called ABC at the CWI research institute in Amsterdam. ABC grouped statements by indentation, and Python borrowed the idea.

The argument for it is that programmers indent their code anyway, to show its structure to human readers. With braces, the indentation and the braces can disagree, and the computer believes the braces while the human believes the indentation. When the indentation *is* the structure, the two can never disagree.
:::

::: context tabs-and-spaces Why mixing tabs and spaces is refused
A Tab character has no fixed width. One editor shows it as four columns, another as eight. A line indented with one Tab and a line indented with four spaces can look identical on your screen and mean different things to Python.

Python 3 refuses to guess. If the indentation of a block only makes sense by assuming a particular Tab width, it stops with `TabError: inconsistent use of tabs and spaces in indentation`. The Python style guide, PEP 8, says to use four spaces per level, and nearly every project follows it.
:::

::: context short-circuit Stopping early on purpose
Think of `and` as a checklist that gives up at the first "no". If the first item fails, there is no point reading the rest — the answer is already "no". `or` gives up at the first "yes".

That is why `n > 0 and total / n > 1.0` never divides by zero. When `n` is 0, `n > 0` is `False`, and Python does not even look at `total / n`. Swap the two parts round, `total / n > 1.0 and n > 0`, and the division happens first and raises `ZeroDivisionError`. The order of the parts is part of the meaning.
:::

::: context iterable What "iterable" means
To **iterate** is to go through things one after another; the word comes from the Latin for "again". An **iterable** is any object that can hand out its items one at a time when asked.

Lists, tuples, strings, sets, dictionaries, `range` objects, and open files are all iterable. A `for` loop does not care which kind it has. It asks the object for its next item, runs the body, and asks again, until the object says there are no more. That is why the same `for` works on all of them.
:::

::: context range-memory A range is three numbers
A list of a million integers must hold a million separate entries. A `range` holds only its start, stop and step, and computes each number when the loop asks for it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44" font-weight="700">range(1000000)</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="10" y="32" width="60" height="26"/><rect x="70" y="32" width="60" height="26"/><rect x="130" y="32" width="60" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="49">start 0</text><text x="100" y="49">stop 1e6</text><text x="160" y="49">step 1</text>
  </g>
  <text x="200" y="49" font-size="11" fill="#6c7a93">about 48 bytes</text>
  <text x="10" y="88" font-size="12" fill="#1f2a44" font-weight="700">list(range(1000000))</text>
  <g stroke="#1f2a44" stroke-width="1" fill="#f2b880">
    <rect x="10" y="98" width="20" height="22"/><rect x="30" y="98" width="20" height="22"/><rect x="50" y="98" width="20" height="22"/><rect x="70" y="98" width="20" height="22"/><rect x="90" y="98" width="20" height="22"/><rect x="110" y="98" width="20" height="22"/><rect x="130" y="98" width="20" height="22"/><rect x="150" y="98" width="20" height="22"/>
  </g>
  <text x="200" y="114" font-size="12" fill="#1f2a44">… one million slots</text>
  <text x="200" y="136" font-size="11" fill="#6c7a93">about 8 MB of slots alone</text>
</svg>
```

On a 64-bit machine each list slot is an 8-byte pointer, so the slots alone are $8 \times 10^6$ bytes, about 8 MB, before counting the integer objects they point to.
:::

::: context fencepost The fencepost problem
You build a straight fence 10 metres long, with a post every metre. How many posts do you need? Most people say 10. The answer is 11.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="50" x2="330" y2="50" stroke="#6c7a93" stroke-width="3"/>
  <g fill="#1d6fd1">
    <rect x="27" y="30" width="6" height="40"/><rect x="57" y="30" width="6" height="40"/><rect x="87" y="30" width="6" height="40"/><rect x="117" y="30" width="6" height="40"/><rect x="147" y="30" width="6" height="40"/><rect x="177" y="30" width="6" height="40"/><rect x="207" y="30" width="6" height="40"/><rect x="237" y="30" width="6" height="40"/><rect x="267" y="30" width="6" height="40"/><rect x="297" y="30" width="6" height="40"/><rect x="327" y="30" width="6" height="40"/>
  </g>
  <text x="180" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">10 gaps of 1 m</text>
  <text x="180" y="90" font-size="12" text-anchor="middle" fill="#b4232c">11 posts</text>
</svg>
```

Mixing up "how many gaps" and "how many posts" is the classic off-by-one error, and it is why programmers call it a **fencepost error**. Half-open ranges help: `range(0, 10)` has exactly $10 - 0 = 10$ numbers, with no plus-or-minus-one to remember.
:::

::: context ctrl-c What Ctrl-C does to a Python program
Pressing Ctrl-C in the terminal sends the running program an **interrupt** signal, the same one you met in the shell module. Python turns that signal into an exception called `KeyboardInterrupt`, raised at whatever line is running.

Unless something catches it, the program stops and prints a traceback ending in `KeyboardInterrupt`. That traceback is useful: it shows which line the runaway loop was on when you stopped it. Lesson 10 explains why a careless `except:` can swallow this exception and make a program impossible to stop.
:::

::: context euler Euler's method, briefly
The loop in the free-fall example uses the simplest way to follow something that changes over time: assume nothing changes during one tiny step, take the step, then update. It is named after Leonhard Euler, the eighteenth-century mathematician who described it.

Smaller steps give answers closer to the truth, but take more of them. Halve `dt` to 0.005 s and the loop runs about twice as many times. Later in the course a whole module is about integrators like this and better ones, because every trajectory simulation of a rocket is built on one.
:::

::: context loop-else A badly named clause
Almost everyone who first meets `for … else` guesses wrong about when the `else` runs. A helpful way to read it is "no break": the block runs when the loop was never broken out of.

The classic use is a search. The loop looks for something and breaks when it finds it; the `else` handles "searched everything, found nothing". Some Python core developers have said they wish it had been given a clearer name. Use it for searches, and add a short comment such as `# no break` so the next reader is not confused.
:::

::: context sentinel Why -999
Many data systems cannot leave a gap in a column of numbers, so they write a **sentinel**: a special value that could never be a real reading and that everyone agrees means "no data here". Values like `-999` and `-9999` are common in science and engineering data because no real sensor produces them.

The danger is forgetting to remove them. One `-999.0` averaged with a few readings near 9.8 drags the mean far below zero. With the five raw values in this lesson, the unfiltered mean is about $-394$, which no accelerometer on a test stand would read.
:::
