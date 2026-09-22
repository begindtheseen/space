---
id: l03-lists-and-tuples
title: Lists, tuples and slicing
minutes: 18
covers:
  - list, tuple, dict, set; slicing; truthiness; mutability
---

A single acceleration is a `float`. A second of accelerometer data at 10 Hz is ten of them, and you need a way to hold all ten under one name, in order, and to ask for the third, or for the middle five, or for the largest. That is what a *list* is.

Lists and tuples are the two ordered containers in Python, and the difference between them is not what they hold but whether they can change after they are built. A list can: you append a sample to it as it arrives, you sort it, you replace an element. A tuple cannot, and that rigidity is a feature — it makes a tuple safe to share and, as the next lesson shows, usable as a dictionary key. A useful way to hear the distinction: a list is *many of the same thing* (a hundred samples of one channel), and a tuple is *one of each of several things* (a timestamp with its three axes).

This lesson also covers *slicing*, the notation for taking a run of elements out of a sequence. You already used it on strings in lesson 2 and it behaves identically here, which is the point: Python has one convention for this and it applies to everything ordered. Everything in this lesson is done without loops — loops are the next lesson — because most of what you want from a list has a built-in that is shorter and harder to get wrong.

## A list is an ordered, changeable sequence

Write one in square brackets, values separated by commas. Ask for its length with `len`, and for one element with an index in brackets, counting from 0:

```python
>>> ax = [0.02, 0.11, 3.94, 9.81, 12.06, 11.98, 0.21]
>>> len(ax)
7
>>> ax[0]
0.02
>>> ax[-1]
0.21
```

Index 0 is the first element. Negative indices count back from the end, so `-1` is the last and `-2` the second to last; this saves you writing `ax[len(ax) - 1]` and getting it wrong at three in the morning. A list with seven elements has valid indices 0 to 6 and -1 to -7, and anything else raises:

```python
>>> ax = [0.02, 0.11, 3.94, 9.81, 12.06, 11.98, 0.21]
>>> ax[99]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
IndexError: list index out of range
```

`IndexError` is a *good* failure. It stops the program at the exact line where your assumption about the data's length was wrong, instead of quietly returning something plausible.

Four built-in functions do most of the work on a list of numbers: `len`, `min`, `max` and `sum`. There is no built-in mean, because it is `sum(xs) / len(xs)`. The `in` operator tests membership, and `.index(value)` finds where something is:

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

## Slicing takes a run of elements

`xs[a:b]` is a *slice*: a new list holding the elements from index `a` up to but not including `b`. Leave out `a` to start at the beginning, `b` to run to the end. A third number is the *step*:

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

`ax[2:5]` has $5 - 2 = 3$ elements: with a half-open range the length of a slice is the difference of its ends, which is the reason for the convention. `ax[::2]` takes every second element — decimating a 100 Hz record to 50 Hz is exactly that. `ax[::-1]` reverses. And the last line is the one that surprises people: a slice whose end runs past the data does **not** raise, it just stops at the end. Indexing is strict, slicing is forgiving. A one-element request `ax[99]` is a bug; a range request that turns out to be short is often legitimate, and when it is not, you must check the length yourself.

::: key
`xs[a:b]` is half-open: `a` is included, `b` is not, and the slice has `b - a` elements. A slice always returns a new list of the same type. Indexing past the end raises `IndexError`; slicing past the end silently returns what exists.
:::

## Changing a list in place

The methods that modify a list return nothing; they change the object they are called on:

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

`append` adds one element; `extend` adds every element of another sequence (`ax.append([1, 2])` would add one element which is itself a list — rarely what you want). `pop()` removes and returns the last element, and `pop(i)` the one at index `i`. `insert(i, v)` puts `v` before index `i`. `remove(v)` deletes the first element equal to `v`, and raises `ValueError` if there is none.

Sorting comes in two forms and the difference catches everyone once:

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

`sorted(q)` returns a new sorted list and leaves `q` alone. `q.sort()` sorts `q` in place and returns `None`. Both are useful; writing `q = q.sort()` is not, and it is the classic first-week bug:

```python
>>> q = [28.4, 3.1]
>>> q = q.sort()
>>> print(q)
None
```

Your data is gone, replaced by `None`, and nothing raised. `sorted(q, reverse=True)` sorts descending.

::: warning
Any method that changes a list in place returns `None`: `append`, `extend`, `insert`, `remove`, `sort`, `reverse`. If you find yourself writing `xs = xs.append(v)`, stop — you have just replaced your list with nothing. The rule across the language: a function that returns a new object gives you the object; a method that mutates gives you `None`.
:::

::: example The burn window
Ten samples of axial acceleration at 10 Hz. The burn is visible as the run of large values; you want its duration, its peak, its mean and the velocity it delivered.

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

The slice `ax[2:7]` takes samples 2, 3, 4, 5 and 6 — five of them, $7 - 2 = 5$, and sample 7 is excluded. Multiplying the count by the sample interval gives the duration, $5 \times 0.1 = 0.5$ s. The last line is a rectangle-rule integral: each sample stands for `dt` seconds of that acceleration, so the sum times `dt` is the velocity change, 4.951 m/s. The numerical methods module would object that this is the crudest possible quadrature, and it is; it is also exactly what a quick-look script does before anyone opens a plotting tool.

One detail to notice for later: `sum(burn)` is `49.510000000000005`, not `49.51`. The f-string hid it by rounding to three places. The value is right to fourteen digits and wrong in the fifteenth, which is what floating point does, and lesson 12 explains.
:::

## Two names for one list

This is the idea that separates people who can debug Python from people who cannot.

A variable is not a box holding a value. It is a *name bound to an object*. Assignment binds a name; it never copies. So after `b = a`, there is one list with two names, and a change made through either name is visible through both:

```python
>>> a = [1.0, 2.0, 3.0]
>>> b = a
>>> b.append(4.0)
>>> a
[1.0, 2.0, 3.0, 4.0]
>>> a is b
True
```

`is` asks whether two names refer to the *same object*; `==` asks whether two objects have the same value. Here they are the same object, so both are true.

To get an independent list, copy it explicitly. `list(a)` and `a[:]` both build a new list with the same elements:

```python
>>> a = [1.0, 2.0, 3.0, 4.0]
>>> c = list(a)
>>> c.append(5.0)
>>> a
[1.0, 2.0, 3.0, 4.0]
>>> a is c
False
```

Both of those copies are *shallow*: the new list holds the same element objects as the old one. For a list of floats that is all you need, because a float cannot be changed in place. For a list of lists it is not, and lesson 8 returns to it with `copy.deepcopy`.

::: example A baseline that changed itself
A script reads raw accelerations, keeps a copy as the baseline for a report, and then removes the bias from the working copy. Written like this, it is wrong:

```python
# baseline_bug.py
raw = [0.02, 0.11, 3.94, 9.81]
baseline = raw            # no copy happened here
baseline.append(-99.0)    # or any change at all

print(raw)                # [0.02, 0.11, 3.94, 9.81, -99.0]
print(raw is baseline)    # True
```

The report's "raw" data now contains a value that was never measured, and the run produced no error at all. One word fixes it:

```python
# baseline_fixed.py
raw = [0.02, 0.11, 3.94, 9.81]
baseline = list(raw)      # a new list with the same numbers
baseline.append(-99.0)

print(raw)                # [0.02, 0.11, 3.94, 9.81]
print(baseline)           # [0.02, 0.11, 3.94, 9.81, -99.0]
print(raw is baseline)    # False
```

The habit worth building now: when a list crosses a boundary in your program — into a function, into a stored result, into something labelled "original" — decide explicitly whether the receiver gets the object or a copy. Lesson 8 shows the same mistake in its most famous form, where the shared object is a function's default argument.
:::

## Tuples: a fixed record

A tuple is written with commas, usually inside parentheses, and cannot be changed after it is made:

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

Everything that reads a list works on a tuple — indexing, slicing, `len`, `min`, `max`, `sum`, `in` — and nothing that writes one does. There is no `append`, no `sort`, no item assignment.

It is the comma that makes a tuple, not the parentheses, which leads to the one piece of syntax nobody guesses: a one-element tuple needs a trailing comma.

```python
>>> one = (9.81,)
>>> one
(9.81,)
>>> not_a_tuple = (9.81)
>>> type(not_a_tuple)
<class 'float'>
```

*Unpacking* assigns the elements of a tuple (or a list) to several names at once, and it is the normal way to take a record apart:

```python
>>> sample = (12.5, 0.02, -0.11, 9.79)
>>> t, ax, ay, az = sample
>>> az
9.79
>>> first, *rest = [1.0, 2.0, 3.0, 4.0]
>>> rest
[2.0, 3.0, 4.0]
```

The number of names must match the number of elements, or Python raises `ValueError`. A starred name absorbs whatever is left over, as `rest` does above. Unpacking is also why swapping two values needs no temporary variable: `a, b = b, a` builds a tuple on the right and unpacks it on the left.

Use a tuple when the length is fixed by meaning rather than by data: a timestamp with three axis readings, a position triple, a return value carrying two related numbers. Use a list when the elements are the same kind of thing and there may be any number of them. The other reason to reach for a tuple is that its immutability makes it *hashable*, which is the property a dictionary key must have — the subject of the next lesson.

## A table is a list of tuples

Real telemetry is rows, and rows are naturally tuples inside one list:

```python
>>> rows = [(12.5, 0.02, -0.11, 9.79), (12.6, 0.03, -0.10, 9.80)]
>>> len(rows)
2
>>> rows[1]
(12.6, 0.03, -0.1, 9.8)
>>> rows[1][2]
-0.1
```

`rows[1][2]` reads left to right: take element 1 of `rows`, which is a tuple, then element 2 of that. Notice that `-0.10` came back as `-0.1` and `9.80` as `9.8`: the trailing zero was never stored, because it is a property of how you wrote the number, not of the number. If a report needs two decimal places, that is the f-string's job, not the data's.

## Check yourself

::: check
`xs = [10, 20, 30, 40, 50]`. Give the value of `xs[1:4]`, `xs[:2]`, `xs[-2:]`, `xs[::-1]` and `xs[4:1]`.
:::

::: answer
`[20, 30, 40]` — from index 1 up to but not including 4, so three elements. `[10, 20]` — the first two. `[40, 50]` — the last two, since `-2` is the second from the end and the end is implied. `[50, 40, 30, 20, 10]` — a step of `-1` walks backwards. And `xs[4:1]` is `[]`, the empty list: the start is past the end, so nothing is selected, and no error is raised.
:::

::: check
A colleague's script does `samples = samples.append(new_value)` inside a data-collection routine, and reports that "the data disappears after the first sample". Explain exactly what happens on the first and second calls.
:::

::: answer
On the first call, `samples.append(new_value)` appends correctly and returns `None`, and the assignment then rebinds the name `samples` to `None`. The list still exists in memory but nothing refers to it. On the second call, `samples.append(...)` is now `None.append(...)`, which raises `AttributeError: 'NoneType' object has no attribute 'append'`. So the data does not disappear — it was appended and then thrown away by the assignment. The fix is to write `samples.append(new_value)` with no assignment.
:::

::: check
You have `ax` at 100 Hz and need it at 20 Hz, and you need the last half second of the record. Write both expressions, and say what happens to the second if the record turns out to be only 30 samples long.
:::

::: answer
Decimating 100 Hz to 20 Hz means keeping every fifth sample: `ax[::5]`. The last half second at 100 Hz is the last 50 samples: `ax[-50:]`. If the record has only 30 samples, `ax[-50:]` returns all 30 without raising, because slicing clamps to what exists. That is convenient and dangerous: if your report then says "the last 0.5 s", it is lying. When the length matters, check it — `len(ax) >= 50` — rather than trusting the slice to complain.
:::

::: check
Why can a tuple be used where a list cannot, and what does `(9.81)` actually produce?
:::

::: answer
A tuple cannot be changed after it is built, so its value — and therefore its hash — is fixed for its lifetime. That is what lets it serve as a dictionary key or a set member, which lesson 4 covers; a list, which can change under the dictionary's feet, cannot. `(9.81)` produces the float `9.81`: the parentheses are ordinary grouping, and it is the comma that builds a tuple, so the one-element tuple must be written `(9.81,)`.
:::

::: check
`a = [1.0, 2.0]`, `b = a`, `c = a[:]`. After `b.append(3.0)`, what are `a`, `b` and `c`, and what do `a is b` and `a == c` report?
:::

::: answer
`a` and `b` are both `[1.0, 2.0, 3.0]` — they are two names for one object, so the append is visible through both. `c` is `[1.0, 2.0]`, because `a[:]` built a new list at the moment it ran, before the append. `a is b` is `True` (same object). `a == c` is `False`, because their values now differ; it would have been `True` before the append even though `a is c` was never true.
:::

## Summary

| Item | Statement |
| --- | --- |
| List | `[1.0, 2.0]`; ordered, changeable, any length |
| Tuple | `(1.0, 2.0)`; ordered, fixed; one element needs the comma: `(9.81,)` |
| Index | `xs[0]` first, `xs[-1]` last; out of range raises `IndexError` |
| Slice | `xs[a:b]` half-open, `b - a` elements; `xs[::2]` steps; `xs[::-1]` reverses; never raises |
| Reading built-ins | `len`, `min`, `max`, `sum`, `in`, `.index(v)`; mean is `sum(xs) / len(xs)` |
| In-place methods | `append`, `extend`, `insert`, `pop`, `remove`, `sort`, `reverse` — all return `None` |
| Sorting | `sorted(xs)` returns a new list; `xs.sort()` changes `xs` and returns `None` |
| Assignment | Binds a name to an object; never copies. `b = a` gives one list two names |
| Copying | `list(a)` or `a[:]` make a new, shallow copy; `a is b` tests identity, `a == b` value |
| Unpacking | `t, ax, ay, az = row`; `first, *rest = xs`; `a, b = b, a` swaps |

The next lesson adds the two containers that are not about order: the dictionary, which looks a value up by a key instead of by position, and the set, which answers "have I seen this before". It also settles what Python counts as true when a container is used in a condition.
