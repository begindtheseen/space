---
id: l03-lists-and-tuples
title: Lists, tuples and slicing
minutes: 20
covers:
  - list, tuple, dict, set; slicing; truthiness; mutability
---

One acceleration reading is a `float`. One second of accelerometer data at 10 Hz is ten of them. You need a way to keep all ten under one name, in order, and to ask for the third one, or the middle five, or the largest. Think of an egg carton with numbered cups: one container, many things, each in its own place. In Python that container is a **list**.

Lists and tuples are Python's two ordered containers. The difference between them is not what they hold. It is whether they can change after they are built. A list can: you add a sample as it arrives, you sort it, you swap one value for another. A **tuple** cannot. That stiffness is a feature. It makes a tuple safe to share, and, as the next lesson shows, lets it be a dictionary key.

Here is a good way to hear the difference. A list is *many of the same thing*: a hundred samples of one channel. A tuple is *one each of several things*: a timestamp together with its three axis readings, like the fields on an ID card.

This lesson also covers **slicing**, the notation for taking a run of elements out of a sequence. You used it on strings in lesson 2, and it works the same way here. That is the point: Python has one rule for this, and it applies to everything with an order. Everything here is done without loops — loops are lesson 5 — because most of what you want from a list has a built-in function that is shorter and harder to get wrong.

## A list is an ordered, changeable sequence

Write a list in square brackets, with the values separated by commas. Ask for its length with `len`. Ask for one element with its index in square brackets, counting from 0:

```python
>>> ax = [0.02, 0.11, 3.94, 9.81, 12.06, 11.98, 0.21]
>>> len(ax)
7
>>> ax[0]
0.02
>>> ax[-1]
0.21
```

Read `ax[0]` aloud as "ax, index zero" or "ax sub zero". Index 0 is the first element. Negative indexes count back from the end: `-1` is the last, `-2` the one before it. That saves you writing `ax[len(ax) - 1]` and getting it wrong at three in the morning.

A list with seven elements has valid indexes 0 to 6, and $-1$ to $-7$. Anything else is an error:

```python
>>> ax = [0.02, 0.11, 3.94, 9.81, 12.06, 11.98, 0.21]
>>> ax[99]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
IndexError: list index out of range
```

`IndexError` is a *good* failure. It stops the program at the exact line where your guess about the data's length was wrong, instead of quietly handing back something that looks fine.

Four built-in functions do most of the work on a list of numbers: `len`, `min`, `max` and `sum`. There is no built-in mean, because the mean is `sum(xs) / len(xs)`. The word `in` asks whether a value is in the list, and the method `.index(value)` tells you where it first appears:

```python
>>> ax = [0.02, 0.11, 3.94, 9.81, 12.06, 11.98, 0.21]
>>> max(ax)
12.06
>>> sum(ax) / len(ax)
5.4471428571428575
>>> 12.06 in ax
True
>>> ax.index(12.06)
4
```

Sanity check on the mean: most values are small, and three are around 10 to 12, so a mean of about 5.4 is believable.

## Slicing takes a run of elements

`xs[a:b]` — read "xs from a to b" — is a **slice**: a new list holding the elements from index `a` up to *but not including* `b`. Leave out `a` to start at the beginning. Leave out `b` to run to the end. An optional third number is the **step**: how many places to jump each time.

```python
>>> ax = [0.02, 0.11, 3.94, 9.81, 12.06, 11.98, 0.21]
>>> ax[2:5]
[3.94, 9.81, 12.06]
>>> ax[:3]
[0.02, 0.11, 3.94]
>>> ax[::2]
[0.02, 3.94, 12.06, 0.21]
>>> ax[::-1]
[0.21, 11.98, 12.06, 9.81, 3.94, 0.11, 0.02]
>>> ax[3:99]
[9.81, 12.06, 11.98, 0.21]
```

Take them one at a time.

- `ax[2:5]` has $5 - 2 = 3$ elements. With a **[[half-open|slice-gaps]]** range, the length of a slice is the end minus the start. That neat fact is the reason for the rule.
- `ax[:3]` is the first three.
- `ax[::2]` takes every second element. Turning a 100 Hz record into a 50 Hz one — called **[[decimating|decimation]]** — is exactly that.
- `ax[::-1]` steps backwards, so it reverses the list.
- `ax[3:99]` is the one that surprises people. A slice whose end runs past the data does **not** raise an error. It stops at the end.

So indexing is strict and slicing is forgiving. Asking for one element, `ax[99]`, that does not exist is a bug. Asking for a range that turns out to be short is often fine — and when it is not, you have to check the length yourself.

::: key
`xs[a:b]` is half-open: `a` is included, `b` is not, and the slice has `b - a` elements. A slice always returns a new list of the same type. Indexing past the end raises `IndexError`; slicing past the end silently returns what exists.
:::

## Changing a list in place

The methods that change a list work on the list itself, **in place**, and hand back nothing:

```python
>>> ax = [0.02, 0.11, 3.94]
>>> ax.append(9.81)
>>> ax
[0.02, 0.11, 3.94, 9.81]
>>> ax.extend([12.06, 11.98])
>>> ax
[0.02, 0.11, 3.94, 9.81, 12.06, 11.98]
>>> ax.pop()
11.98
>>> ax.insert(0, -0.01)
>>> ax
[-0.01, 0.02, 0.11, 3.94, 9.81, 12.06]
>>> ax.remove(0.11)
>>> ax
[-0.01, 0.02, 3.94, 9.81, 12.06]
```

Here is what each one did.

- `append(v)` adds one element to the end.
- `extend(other)` adds every element of another sequence. Be careful: `ax.append([1, 2])` would add *one* element that is itself a list — rarely what you want.
- `pop()` removes the last element and gives it back. `pop(i)` does the same for index `i`.
- `insert(i, v)` puts `v` right before index `i`.
- `remove(v)` deletes the first element equal to `v`, and raises `ValueError` if there is none.

Sorting comes in two forms, and the difference catches everyone once:

```python
>>> q = [28.4, 3.1, 19.7, 0.4]
>>> sorted(q)
[0.4, 3.1, 19.7, 28.4]
>>> q
[28.4, 3.1, 19.7, 0.4]
>>> q.sort()
>>> q
[0.4, 3.1, 19.7, 28.4]
```

`sorted(q)` builds a *new* sorted list and leaves `q` alone. `q.sort()` sorts `q` itself and returns **[[None|none-value]]**, Python's value for "nothing". Both are useful. Writing `q = q.sort()` is not, and it is the classic first-week bug:

```python
>>> q = [28.4, 3.1]
>>> q = q.sort()
>>> print(q)
None
```

Your data is gone, replaced by `None`, and nothing raised an error. To sort from largest to smallest, write `sorted(q, reverse=True)`.

::: warning
Any method that changes a list in place returns `None`: `append`, `extend`, `insert`, `remove`, `sort`, `reverse`. If you find yourself writing `xs = xs.append(v)`, stop — you have replaced your list with nothing. The rule across the language: a function that builds a new object gives you the object; a method that changes one gives you `None`.
:::

::: example The burn window
Here are ten samples of acceleration along the rocket's long axis, taken at 10 Hz. The engine burn shows up as the run of large values. You want its duration, its peak, its mean and the velocity it added.

```python
# burn_window.py
# Axial acceleration in m/s^2, sampled at 10 Hz from t = 0.0 s
ax = [0.02, 0.11, 3.94, 9.81, 12.06, 11.98, 11.72, 4.03, 0.18, 0.05]
dt = 0.1

burn = ax[2:7]
print(burn)                                     # [3.94, 9.81, 12.06, 11.98, 11.72]
print(len(burn))                                # 5
print(f"duration {len(burn) * dt:.1f} s")       # duration 0.5 s
print(f"peak     {max(burn):.2f} m/s^2")        # peak     12.06 m/s^2
print(f"mean     {sum(burn) / len(burn):.3f} m/s^2")  # mean     9.902 m/s^2
print(f"delta-v  {sum(burn) * dt:.3f} m/s")     # delta-v  4.951 m/s
```

Step by step:

1. **The slice.** `ax[2:7]` takes samples 2, 3, 4, 5 and 6. That is $7 - 2 = 5$ samples; sample 7 is left out.
2. **Duration.** Each sample covers `dt` = 0.1 s, so five samples cover $5 \times 0.1 = 0.5$ s.
3. **Peak.** `max(burn)` is 12.06 m/s².
4. **Mean.** The sum is $3.94 + 9.81 + 12.06 + 11.98 + 11.72 = 49.51$, and $49.51 / 5 = 9.902$ m/s².
5. **Velocity added.** Each sample stands for 0.1 s of that acceleration, so the velocity change is the sum times `dt`: $49.51 \times 0.1 = 4.951$ m/s. This is the **[[rectangle rule|rectangle-rule]]**.

Sanity check: 0.5 s at a mean of about 9.9 m/s² should add about $0.5 \times 9.9 \approx 5$ m/s. It does.

The numerical methods module would call this the crudest possible way to add up an area under a curve, and it is. It is also exactly what a quick-look script does before anyone opens a plotting tool.

One detail to notice for later. `sum(burn)` is really `49.510000000000005`, not `49.51`. The f-string hid that by rounding to three places. The value is right to fourteen digits and wrong in the fifteenth, which is what floating point does. Lesson 12 explains why.
:::

## Two names for one list

This is the idea that separates people who can debug Python from people who cannot.

A variable is not a box that holds a value. It is a **name tag tied to an object**. Assignment ties a tag on; it never makes a copy. So after `b = a`, there is one list wearing two name tags. A change made through either name shows up through both:

```python
>>> a = [1.0, 2.0, 3.0]
>>> b = a
>>> b.append(4.0)
>>> a
[1.0, 2.0, 3.0, 4.0]
>>> a is b
True
```

Two different questions are worth separating:

- `a is b` asks: are these **[[the same object|names-and-objects]]**? This is called **identity**.
- `a == b` asks: do these two objects hold the same value?

Here `a` and `b` are the same object, so both answers are `True`.

To get a separate list, copy it on purpose. `list(a)` and `a[:]` (read "a, slice all") each build a new list with the same elements:

```python
>>> a = [1.0, 2.0, 3.0, 4.0]
>>> c = list(a)
>>> c.append(5.0)
>>> a
[1.0, 2.0, 3.0, 4.0]
>>> a is c
False
```

Both of those copies are **shallow**. The new list is a new container, but it holds the very same element objects as the old one. For a list of floats that is all you need, because a float can never be changed in place. For a list of lists, it is not enough, because the inner lists are shared:

```python
>>> a = [[1.0, 2.0], [3.0, 4.0]]
>>> b = a[:]
>>> b.append([5.0])
>>> b[0].append(99.0)
>>> a
[[1.0, 2.0, 99.0], [3.0, 4.0]]
>>> a is b, a[0] is b[0]
(False, True)
```

Follow it through. Appending to `b` itself did not touch `a` — the outer lists are separate. But `b[0]` and `a[0]` are **[[one inner list|shallow-copy]]** shared by both, so the `99.0` shows up in `a` too. Lesson 8 returns to this with `copy.deepcopy`, which copies the inner lists as well.

::: example A baseline that changed itself
A script reads raw accelerations and keeps a copy as the baseline for a report. Then it changes the working copy. Written like this, it is wrong:

```python
# baseline_bug.py
raw = [0.02, 0.11, 3.94, 9.81]
baseline = raw            # no copy happened here
baseline.append(-99.0)    # or any change at all

print(raw)                # [0.02, 0.11, 3.94, 9.81, -99.0]
print(raw is baseline)    # True
```

The report's "raw" data now contains a value that was never measured, and the run gave no error at all. One word fixes it:

```python
# baseline_fixed.py
raw = [0.02, 0.11, 3.94, 9.81]
baseline = list(raw)      # a new list with the same numbers
baseline.append(-99.0)

print(raw)                # [0.02, 0.11, 3.94, 9.81]
print(baseline)           # [0.02, 0.11, 3.94, 9.81, -99.0]
print(raw is baseline)    # False
```

Check the fix: `raw` still has its four measured values, and `raw is baseline` is now `False`, so they really are two lists.

The habit worth building now: when a list crosses a boundary in your program — into a function, into a stored result, into something labeled "original" — decide on purpose whether the receiver gets the object or a copy. Lesson 8 shows the same mistake in its most famous form, where the shared object is a function's default argument.
:::

::: key
Assignment binds a second name to the same object; it does not copy. After `a = [1,2,3]; b = a`, `b.append(4)` leaves `a` as `[1, 2, 3, 4]`. Use `list(a)`, `a[:]` or `copy.deepcopy` when you need independence, and `is` to ask whether two names are the same object.
:::

## Tuples: a fixed record

A tuple is written with commas, usually inside round brackets (parentheses). Once made, it cannot be changed:

```python
>>> sample = (12.5, 0.02, -0.11, 9.79)
>>> sample[0]
12.5
>>> len(sample)
4
>>> sample[0] = 13.0
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: 'tuple' object does not support item assignment
```

Everything that *reads* a list works on a tuple: indexing, slicing, `len`, `min`, `max`, `sum`, `in`. Nothing that *writes* works. There is no `append`, no `sort`, and no changing an element.

So the two sequence types in this lesson split cleanly. A list is **mutable** — it can be changed after it is made. A tuple is **immutable** — it cannot. A string, from lesson 2, is immutable too.

It is the comma that makes a tuple, not the brackets. That leads to the one piece of syntax nobody guesses: a tuple with one element needs a comma at the end.

```python
>>> one = (9.81,)
>>> one
(9.81,)
>>> not_a_tuple = (9.81)
>>> type(not_a_tuple)
<class 'float'>
```

Without the comma, the brackets are ordinary grouping brackets, like the ones in $(2 + 3) \times 4$, and you get the plain float.

**Unpacking** hands out the elements of a tuple (or a list) to several names at once, like dealing cards. It is the normal way to take a record apart:

```python
>>> sample = (12.5, 0.02, -0.11, 9.79)
>>> t, ax, ay, az = sample
>>> az
9.79
>>> first, *rest = [1.0, 2.0, 3.0, 4.0]
>>> rest
[2.0, 3.0, 4.0]
```

The number of names must match the number of elements, or Python raises `ValueError`. A starred name, `*rest` (read "star rest"), soaks up whatever is left over. Unpacking is also why **[[swapping two values|swap-trick]]** needs no spare variable: `a, b = b, a`.

When should you use which? Use a tuple when the length is fixed by *meaning*, not by how much data arrived: a timestamp with three axis readings, a position with its three coordinates, a function result carrying two related numbers. Use a list when the elements are all the same kind of thing and there could be any number of them.

The other reason to reach for a tuple is that, being immutable, it is **[[hashable|hashable]]**: Python can compute a fixed fingerprint number for it that never changes. That is the property a dictionary key must have, and it is the subject of the next lesson. A list, which can change, has no such fingerprint, and Python refuses to use it as a key.

::: key
A tuple is required when the value must be hashable — used as a dictionary key or a set member — and wherever immutability is the contract you want. A tuple also signals a fixed-length **[[heterogeneous|homo-hetero]]** record, `(t, ax, ay, az)`, while a list signals a homogeneous sequence of any length.
:::

## A table is a list of tuples

Real telemetry comes in rows, and rows fit naturally as tuples inside one list:

```python
>>> rows = [(12.5, 0.02, -0.11, 9.79), (12.6, 0.03, -0.10, 9.80)]
>>> len(rows)
2
>>> rows[1]
(12.6, 0.03, -0.1, 9.8)
>>> rows[1][2]
-0.1
```

Read `rows[1][2]` from left to right. First take element 1 of `rows`, which is the second tuple. Then take element 2 of that tuple, which is `-0.10`.

Notice that `-0.10` came back as `-0.1`, and `9.80` as `9.8`. The trailing zero was never stored, because it belongs to how you *wrote* the number, not to the number itself. If a report needs two decimal places, that is the f-string's job, not the data's. For big tables of numbers, working engineers move on to **[[NumPy arrays|numpy-bridge]]**, which the next modules introduce.

## Check yourself

::: check
`xs = [10, 20, 30, 40, 50]`. Give the value of `xs[1:4]`, `xs[:2]`, `xs[-2:]`, `xs[::-1]` and `xs[4:1]`.
:::

::: answer
- `xs[1:4]` is `[20, 30, 40]`: from index 1 up to but not including 4, so $4 - 1 = 3$ elements.
- `xs[:2]` is `[10, 20]`: the first two.
- `xs[-2:]` is `[40, 50]`: `-2` is the second from the end, and the end is implied.
- `xs[::-1]` is `[50, 40, 30, 20, 10]`: a step of $-1$ walks backwards.
- `xs[4:1]` is `[]`, the empty list. The start is already past the end, so nothing is selected — and no error is raised.
:::

::: check
A colleague's script does `samples = samples.append(new_value)` inside a data-collection routine, and reports that "the data disappears after the first sample". Explain exactly what happens on the first and second calls.
:::

::: answer
On the first call, `samples.append(new_value)` appends correctly and returns `None`. The assignment then re-ties the name `samples` to `None`. The list still exists in memory, but no name refers to it any more.

On the second call, `samples.append(...)` is now `None.append(...)`, which raises `AttributeError: 'NoneType' object has no attribute 'append'`.

So the data did not disappear by itself. It was appended and then thrown away by the assignment. The fix is to write `samples.append(new_value)` with no assignment.
:::

::: check
You have `ax` at 100 Hz and need it at 20 Hz. You also need the last half second of the record. Write both expressions, and say what happens to the second if the record turns out to be only 30 samples long.
:::

::: answer
Going from 100 Hz to 20 Hz means keeping one sample in five, since $100 / 20 = 5$: `ax[::5]`.

The last half second at 100 Hz is $0.5 \times 100 = 50$ samples: `ax[-50:]`.

If the record has only 30 samples, `ax[-50:]` returns all 30 without raising, because slicing stops at what exists. That is convenient and dangerous. If your report then says "the last 0.5 s", it is wrong — the record only covers 0.3 s. When the length matters, check it yourself, with `len(ax) >= 50`, rather than trusting the slice to complain.
:::

::: check
Why can a tuple be used as a dictionary key when a list cannot, and what does `(9.81)` actually produce?
:::

::: answer
A tuple cannot be changed after it is built, so its value — and therefore its hash, its fingerprint number — stays the same for its whole life. That is what lets it serve as a dictionary key or a set member, which lesson 4 covers. A list could change under the dictionary's feet, so Python will not hash it.

`(9.81)` produces the float `9.81`. The brackets are ordinary grouping; it is the comma that builds a tuple. The one-element tuple must be written `(9.81,)`.
:::

::: check
`a = [1.0, 2.0]`, `b = a`, `c = a[:]`. After `b.append(3.0)`, what are `a`, `b` and `c`, and what do `a is b` and `a == c` report?
:::

::: answer
`a` and `b` are both `[1.0, 2.0, 3.0]`. They are two names for one object, so the append shows through both.

`c` is `[1.0, 2.0]`, because `a[:]` built a new list at the moment it ran, before the append.

`a is b` is `True`: same object. `a == c` is `False`, because their values now differ. Before the append, `a == c` would have been `True` — even though `a is c` was never true.
:::

## Summary

| Item | Statement |
| --- | --- |
| List | `[1.0, 2.0]`; ordered, changeable (mutable), any length |
| Tuple | `(1.0, 2.0)`; ordered, fixed (immutable); one element needs the comma: `(9.81,)` |
| Index | `xs[0]` first, `xs[-1]` last; out of range raises `IndexError` |
| Slice | `xs[a:b]` half-open, `b - a` elements; `xs[::2]` steps; `xs[::-1]` reverses; never raises |
| Reading built-ins | `len`, `min`, `max`, `sum`, `in`, `.index(v)`; mean is `sum(xs) / len(xs)` |
| In-place methods | `append`, `extend`, `insert`, `pop`, `remove`, `sort`, `reverse` — all but `pop` return `None` |
| Sorting | `sorted(xs)` returns a new list; `xs.sort()` changes `xs` and returns `None` |
| Assignment | Binds a name to an object; never copies. `b = a` gives one list two names |
| Copying | `list(a)` or `a[:]` make a new, shallow copy; nested lists stay shared |
| `is` vs `==` | `is` tests identity (same object); `==` tests value |
| Unpacking | `t, ax, ay, az = row`; `first, *rest = xs`; `a, b = b, a` swaps |

The next lesson adds the two containers that are not about order: the dictionary, which looks a value up by a key instead of by position, and the set, which answers "have I seen this before?" It also settles what Python counts as true when a container is used in a condition.

::: context slice-gaps Count the gaps, not the boxes
The easiest way to read a slice is to number the *gaps between* elements, not the elements themselves. `ax[2:5]` means "cut at gap 2 and at gap 5, keep what lies between". Three elements fall between those cuts, which is why the length is always end minus start.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="40" y="35" width="40" height="34" fill="#fff"/><rect x="80" y="35" width="40" height="34" fill="#fff"/>
    <rect x="120" y="35" width="40" height="34" fill="#8fb8f0"/><rect x="160" y="35" width="40" height="34" fill="#8fb8f0"/>
    <rect x="200" y="35" width="40" height="34" fill="#8fb8f0"/><rect x="240" y="35" width="40" height="34" fill="#fff"/>
    <rect x="280" y="35" width="40" height="34" fill="#fff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="56">0.02</text><text x="100" y="56">0.11</text><text x="140" y="56">3.94</text><text x="180" y="56">9.81</text>
    <text x="220" y="56">12.06</text><text x="260" y="56">11.98</text><text x="300" y="56">0.21</text>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="40" y="26">0</text><text x="80" y="26">1</text><text x="120" y="26">2</text><text x="160" y="26">3</text>
    <text x="200" y="26">4</text><text x="240" y="26">5</text><text x="280" y="26">6</text><text x="320" y="26">7</text>
  </g>
  <line x1="120" y1="30" x2="120" y2="80" stroke="#b4232c" stroke-width="2"/>
  <line x1="240" y1="30" x2="240" y2="80" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="98" font-size="12" text-anchor="middle" fill="#b4232c">ax[2:5] → 3 elements</text>
</svg>
```
:::

::: context decimation Keeping every nth sample
Decimating a signal means keeping one sample in every few and dropping the rest. `ax[::2]` halves the rate; `ax[::5]` cuts 100 Hz to 20 Hz. In real signal processing there is a catch: any wiggle faster than half the new rate does not vanish, it disguises itself as a slower wiggle, an effect called **aliasing**. So proper decimation smooths the signal first and only then drops samples. For a quick look, the plain slice is fine.
:::

::: context none-value Python's word for nothing
`None` is a single special value that means "no value here". A function or method that has nothing useful to return gives back `None`. It prints as `None` at the prompt only when you ask with `print`; typed on its own, the REPL shows nothing at all for it. Test for it with `x is None` — one of the few places where `is` is the right comparison.
:::

::: context rectangle-rule Adding up rectangles
Acceleration times time is a change of speed. When the acceleration keeps changing, split the time into short slices. In each slice pretend the acceleration is constant, so the slice adds a rectangle of height $a_i$ and width $\Delta t$ to the speed. Add up the rectangles: $\Delta v \approx \sum_i a_i \, \Delta t$. Here that is $49.51 \times 0.1 = 4.951\,\mathrm{m/s}$. Thinner slices give a better answer; the numerical methods module shows smarter shapes than rectangles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="130" x2="30" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="80" y="91.6" width="50" height="38.4"/>
    <rect x="130" y="34.4" width="50" height="95.6"/>
    <rect x="180" y="12.4" width="50" height="117.6"/>
    <rect x="230" y="13.2" width="50" height="116.8"/>
    <rect x="280" y="15.7" width="50" height="114.3"/>
  </g>
  <text x="105" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">3.94</text>
  <text x="155" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">9.81</text>
  <text x="205" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">12.06</text>
  <text x="255" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">11.98</text>
  <text x="305" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">11.72</text>
  <text x="36" y="24" font-size="11" fill="#1f2a44">a</text>
  <text x="40" y="56" font-size="11" fill="#6c7a93">each bar</text>
  <text x="40" y="70" font-size="11" fill="#6c7a93">0.1 s wide</text>
</svg>
```
:::

::: context names-and-objects Name tags, not boxes
Python keeps objects in one place and names in another. A name is a tag with a string tied to an object. `b = a` does not build anything: it ties a second tag to the list `a` already points at.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="50" height="28" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="39" font-size="13" text-anchor="middle" fill="#1f2a44">a</text>
  <rect x="20" y="72" width="50" height="28" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="91" font-size="13" text-anchor="middle" fill="#1f2a44">b</text>
  <rect x="170" y="40" width="170" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="255" y="65" font-size="12" text-anchor="middle" fill="#1f2a44">[1.0, 2.0, 3.0, 4.0]</text>
  <line x1="70" y1="34" x2="162" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="168,57 159,51 157,59" fill="#1f2a44"/>
  <line x1="70" y1="86" x2="162" y2="67" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="168,65 157,62 159,70" fill="#1f2a44"/>
  <text x="255" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">one object · a is b is True</text>
</svg>
```
:::

::: context shallow-copy What a shallow copy shares
A list does not hold its elements inside itself. It holds a row of pointers to them. `b = a[:]` makes a new row of pointers — but the pointers lead to the same inner lists. Change the outer row of `b`, and `a` does not notice. Change an inner list through `b[0]`, and `a[0]` sees it, because it is the same list.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="20" y="34" font-size="13" fill="#1f2a44">a</text>
  <rect x="36" y="18" width="36" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="72" y="18" width="36" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="118" font-size="13" fill="#1f2a44">b</text>
  <rect x="36" y="102" width="36" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="72" y="102" width="36" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="108" y="102" width="36" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="220" y="30" width="120" height="26" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">[1.0, 2.0, 99.0]</text>
  <rect x="220" y="80" width="120" height="26" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="97" font-size="11" text-anchor="middle" fill="#1f2a44">[3.0, 4.0]</text>
  <line x1="54" y1="30" x2="216" y2="42" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="90" y1="30" x2="216" y2="90" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="54" y1="114" x2="216" y2="46" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="90" y1="114" x2="216" y2="96" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="126" y1="114" x2="160" y2="114" stroke="#b4232c" stroke-width="1.5"/>
  <text x="164" y="118" font-size="11" fill="#1f2a44">[5.0]</text>
  <text x="280" y="130" font-size="11" text-anchor="middle" fill="#6c7a93">two outer lists, shared inner lists</text>
</svg>
```
:::

::: context swap-trick How a, b = b, a works
Python works out the whole right-hand side first. `b, a` builds a temporary tuple holding the two current values. Only then does it unpack that tuple into the names on the left, in order. Because both old values were captured before either name changed, nothing is lost — no spare variable needed, which is how you would have to do it in C.
:::

::: context hashable A fingerprint that must never change
A dictionary finds a key fast by turning it into a number called its **hash** and using that number to jump straight to a storage slot, like a coat-check ticket. If the key could change after it was stored, its hash would change too, and the dictionary would look in the wrong slot. So Python only hashes things that cannot change. `hash((1, 2))` works; `hash([1, 2])` raises `TypeError: unhashable type: 'list'`.
:::

::: context homo-hetero Same kind, different kinds
**Homogeneous** comes from the Greek for "same kind"; **heterogeneous** from "different kind". A list of 100 acceleration samples is homogeneous: every element means the same sort of thing. The record `(t, ax, ay, az)` is heterogeneous: element 0 is a time and the others are accelerations along different axes, so each position has its own meaning.
:::

::: context numpy-bridge Where this goes next
For thousands of samples, engineers use NumPy arrays instead of lists. They store raw numbers packed side by side and do arithmetic on a whole array at once, far faster than a Python loop. They use the same slice notation, with one big difference: slicing a NumPy array usually gives a **view** onto the same data, not a copy. So everything in this lesson about names and copies matters even more there.
:::
