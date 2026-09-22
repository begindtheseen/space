---
id: l08-mutable-default-arguments
title: The mutable default argument, identity and copying
minutes: 17
covers:
  - The mutable default argument trap
---

This lesson is about one bug. It gets a lesson to itself because it is the most famous bug in Python, because it is completely silent — no exception, no warning, just wrong numbers — and because understanding it means you have understood the two rules it is made from, which matter far beyond this one case.

The bug looks like this. You write a function that collects values into a list, give the list a sensible default so the caller need not supply one, and discover later that data from one channel has appeared in another channel's results. Nothing raised. The run completed. The report is wrong.

The two rules behind it are already in your hands. From lesson 6: **a default value is evaluated once, when the `def` line runs**, not on each call. From lesson 3: **assignment binds a name to an object and never copies it**. Put those together and the default list is one object, created once, shared by every call that omits the argument, and kept between calls for the life of the program.

## The trap

```python
# default_trap.py
def add(v, acc=[]):
    acc.append(v)
    return acc


print(add(1))       # [1]
print(add(2))       # [1, 2]
print(add(3, []))   # [3]
print(add(4))       # [1, 2, 4]
```

The second call was given no `acc`, so it used the default — the same list object the first call appended to — and returned `[1, 2]`. The third call supplied its own list and behaved as expected. The fourth omitted it again and continued accumulating into the shared object, which by then held `[1, 2]`.

A function that behaves differently depending on how many times it has been called before is a function you cannot reason about, cannot test in isolation and cannot use twice in one program.

## Proof: the default is an attribute of the function

You do not have to take this on faith. The defaults are stored on the function object, and you can look at them:

```python
# default_proof.py
def add(v, acc=[]):
    acc.append(v)
    return acc


print(add.__defaults__)   # ([],)
add(1)
add(2)
print(add.__defaults__)   # ([1, 2],)
```

`__defaults__` is a tuple of the default values, and its contents changed. The list in the `def` line is not a recipe for making a new empty list each time; it is one list, made when the module was imported, owned by the function, and mutated by every call. The `def` line has already run by the time any call happens — that is the whole of the explanation.

::: key
`def f(x, acc=[])` misbehaves because the default object is created once, when the function is defined, and shared by every call that omits the argument — so mutations accumulate across calls. Use `acc=None` and build a fresh list inside the body.
:::

## The fix

Use `None` as the default — an immutable sentinel meaning "nothing was supplied" — and create the real default inside the body:

```python
# default_fixed.py
def add(v, acc=None):
    if acc is None:
        acc = []
    acc.append(v)
    return acc


print(add(1))              # [1]
print(add(2))              # [2]
print(add.__defaults__)    # (None,)
```

Every call that omits `acc` now runs `acc = []`, which builds a new list at call time. The default stored on the function is `None`, which has no methods that could change it.

Write the test as `if acc is None:` and not `if not acc:`. They differ exactly where it matters: an empty list the caller deliberately passed is falsy, so `if not acc:` would quietly replace it with a different empty list, and the caller's list — which they may be holding a reference to — would never receive the appended value.

::: example A collector that mixed two channels
The shape the bug takes in real code. A helper accumulates samples as they are parsed, and the author gives it a default so the first call can be short:

```python
# collect_bug.py
def collect(sample, samples=[]):
    """Append a sample and return the collection. Buggy."""
    samples.append(sample)
    return samples


ax = collect(0.02)
ax = collect(0.11)
ay = collect(-0.41)     # a different channel — or so it looks

print(ax)         # [0.02, 0.11, -0.41]
print(ay)         # [0.02, 0.11, -0.41]
print(ax is ay)   # True
```

There are not two lists. `ax` and `ay` are two names for the single default object, so the `ay` channel's sample landed in the `ax` results and both names show all three values. A statistics pass over `ax` would now report a mean over samples from two different axes, and there is nothing in the output to suggest anything went wrong.

The corrected version creates a list per call and requires the caller to say which collection a sample belongs to:

```python
# collect_fixed.py
def collect(sample, samples=None):
    """Append a sample to `samples` (a new list if none is given) and return it."""
    if samples is None:
        samples = []
    samples.append(sample)
    return samples


ax = collect(0.02)
ax = collect(0.11, ax)
ay = collect(-0.41)

print(ax)         # [0.02, 0.11]
print(ay)         # [-0.41]
print(ax is ay)   # False
```

Notice that the fixed version made the second call's intent explicit: `collect(0.11, ax)` says which collection to add to. The buggy version's brevity was hiding a decision, not making one.
:::

## It is not only lists

Anything mutable used as a default has the same problem: a dictionary, a set, an object of your own. So does anything *computed* at definition time, which is the same rule wearing different clothes:

```python
# frozen_stamp.py
import datetime
import time


def stamp(t=datetime.datetime.now()):
    """Return the time the function was DEFINED, not called. Buggy."""
    return t


first = stamp()
time.sleep(0.2)
second = stamp()

print(first is second)     # True
print(second - first)      # 0:00:00
```

The two "timestamps" are the same object, and the difference between them is zero after a fifth of a second of waiting. `datetime.datetime.now()` ran once, when the module was imported, so every record this function stamps carries the time the program started. On a long-running data pipeline that is a log where every entry claims to have happened at start-up. The fix is identical: default to `None`, call `datetime.datetime.now()` inside the body.

::: warning
The rule to carry: **a default argument must be immutable** — a number, a string, `True`, `False`, `None`, or a tuple of those. If you want a list, a dict, a set, a timestamp or anything else built fresh per call, default to `None` and build it in the body. Some linters flag mutable defaults automatically; configure yours to do so.
:::

## `is` versus `==`

Both of the diagnostics above used `is`, and it is worth being precise about the difference, because using the wrong one is a bug of the same family.

- `a == b` asks whether the two objects have the same **value**.
- `a is b` asks whether they are the **same object** in memory.

`is` is the right test for a short list of things: `None`, `True`, `False`, and sentinel objects you created yourself for the purpose. For values, it is wrong — and dangerously, it often appears to work:

```python
# identity.py
a = 100
b = int("100")
print(a == b, a is b)   # True True

c = 1000
d = int("1000")
print(c == d, c is d)   # True False
```

The two lines ask the same question about numbers that differ only in size, and give different answers. CPython keeps one shared object for every small integer from -5 to 256, so `a` and `b` are the same object; 1000 is outside that range, so `c` and `d` are two objects holding equal values. The same thing happens with strings, where identical literals in one file are often merged into one object while strings built at run time are not:

```python
# interning.py
s1 = "ax"
s2 = "a" + "x"
s3 = "".join(["a", "x"])
print(s1 is s2)    # True
print(s1 is s3)    # False
print(s1 == s3)    # True
```

Every one of these is an implementation detail that can change between Python versions and implementations. That is precisely why `channel is "ax"` is a bug: it will pass your test, where the string is a literal, and fail in production, where the string was read from a file. Compare values with `==`; reserve `is` for `None` and friends.

::: key
`is` compares identity, `==` compares value. Use `is` only for `None`, `True`, `False` and sentinels. Small-integer caching and string interning make `is` appear to work for values, then fail on data that came from a file.
:::

## Copying, shallow and deep

The fix for a shared mutable is often a copy, and there are two kinds. `list(xs)` and `xs[:]` make a **shallow** copy: a new outer list holding the same element objects. If the elements are themselves mutable, both lists still share them:

```python
# copying.py
import copy

runs = [[9.79, 9.80], [0.02, 0.11]]
shallow = list(runs)
deep = copy.deepcopy(runs)

shallow[0].append(-99.0)

print(runs)                      # [[9.79, 9.8, -99.0], [0.02, 0.11]]
print(deep)                      # [[9.79, 9.8], [0.02, 0.11]]
print(runs[0] is shallow[0])     # True
print(runs[0] is deep[0])        # False
```

Appending through `shallow[0]` changed `runs`, because `shallow[0]` and `runs[0]` are the same inner list — the shallow copy duplicated the outer list only. `copy.deepcopy` walks the whole structure and duplicates everything, so `deep` is genuinely independent.

::: example A summary dict that shared its rows
The same trap one level up. A script keeps per-axis sample lists in a dictionary, takes a copy before adding a derived channel, and finds the original changed anyway:

```python
# stats_copy.py
import copy

raw = {"ax": [0.02, 0.11], "ay": [-0.41, 0.05]}

shallow = dict(raw)
deep = copy.deepcopy(raw)

shallow["ax"].append(3.94)     # reaches into the shared inner list
shallow["az"] = [9.79]         # adds a key to the copy only

print(raw)
# {'ax': [0.02, 0.11, 3.94], 'ay': [-0.41, 0.05]}
print(shallow)
# {'ax': [0.02, 0.11, 3.94], 'ay': [-0.41, 0.05], 'az': [9.79]}
print(deep)
# {'ax': [0.02, 0.11], 'ay': [-0.41, 0.05]}
print(raw["ax"] is shallow["ax"], raw["ax"] is deep["ax"])
# True False
```

Read the two mutations separately, because they behave differently and that is the whole lesson. Adding the key `az` changed only `shallow`: the outer dictionary really was copied. Appending to `shallow["ax"]` changed `raw` as well, because `dict(raw)` copied the *references* to the inner lists, and `shallow["ax"]` and `raw["ax"]` are one list.

So a shallow copy protects the structure you copied and nothing inside it. `copy.deepcopy` walked the whole thing and left `deep` genuinely independent — its `ax` list still has two samples. When the thing you are copying is a container of containers, and the word "backup" or "original" appears anywhere near it, a shallow copy is not a backup.
:::

Deep copies cost time and memory proportional to the structure, so do not reach for one by reflex. The question to ask is how deep the sharing goes: for a list of floats a shallow copy is complete, because a float cannot be changed in place. For a list of lists, a dictionary of lists, or anything holding objects, it is not.

## Check yourself

::: check
Predict the two lines printed, then say which of the two rules from the opening paragraph explains each.

```python
def add(v, acc=[]):
    acc.append(v)
    return acc

print(add(1))
print(add(2))
```
:::

::: answer
It prints `[1]` and then `[1, 2]`. The first rule — a default is evaluated once, at definition time — is why there is only one list, created when `def` ran. The second rule — assignment binds without copying — is why `acc` inside the second call refers to that same list rather than to a copy of it, so the `append` is visible on the next call. The fix is `acc=None` with `if acc is None: acc = []` in the body.
:::

::: check
Why `if acc is None:` rather than `if not acc:`?
:::

::: answer
Because an empty list is falsy. A caller who deliberately passes an empty list — perhaps one they intend to keep a reference to and read afterwards — would trip `if not acc:` and have their list silently replaced by a different one, so the appended value would never appear in the list they are holding. `is None` distinguishes "no argument was supplied" from "an empty container was supplied", which are different situations. It is also faster and cannot be confused by a value that merely looks empty.
:::

::: check
A logging helper is written as `def log(msg, seen=set()): ...` and uses `seen` to suppress duplicate messages. Is this a bug?
:::

::: answer
It is the same construct, but here the sharing may be exactly what was intended: one set, persisting across calls, remembering what has already been logged. The construct still deserves to be replaced, for three reasons. The lifetime is the whole process, so a long run never forgets and the set grows without bound. Tests cannot reset it, so test order changes results. And a reader has to know this rule to see that the persistence is deliberate rather than accidental. Keep the state where it can be seen and reset — a closure over a set, as lesson 7 showed, or an explicit argument.
:::

::: check
`a = 100; b = int("100")` gives `a is b` as `True`, while `c = 1000; d = int("1000")` gives `False`. What single conclusion should you draw?
:::

::: answer
That `is` must never be used to compare values. Small integers from -5 to 256 are cached and shared by CPython, so identity accidentally agrees with equality in that range and disagrees outside it; the boundary is an implementation detail, not a language rule, and it differs between Python implementations and can change between versions. Use `==` for values. Reserve `is` for `None`, `True`, `False` and sentinel objects, where identity is precisely the question being asked.
:::

::: check
`runs = [[1.0], [2.0]]` and `backup = list(runs)`. Someone appends to `runs[0]`. Does `backup` change, and what would have prevented it?
:::

::: answer
Yes. `list(runs)` copies the outer list only, so `backup[0]` and `runs[0]` are the same inner list, and appending through either is visible through both. `copy.deepcopy(runs)` duplicates the inner lists as well and would have prevented it. The general rule: a shallow copy is enough when the elements cannot be changed in place — floats, ints, strings, tuples of those — and not otherwise.
:::

## Summary

| Item | Statement |
| --- | --- |
| The trap | `def f(x, acc=[])` creates one list at definition time, shared by every call that omits it |
| Why | Defaults are evaluated once when `def` runs; assignment binds without copying |
| Proof | `f.__defaults__` holds the objects and shows them changing |
| The fix | `acc=None`, then `if acc is None: acc = []` in the body |
| Test form | `is None`, never `not acc`: an empty list the caller passed must not be replaced |
| Scope of the rule | Any mutable default — list, dict, set — and anything computed at definition, such as `datetime.now()` |
| `is` vs `==` | Identity vs value; use `is` only for `None`, `True`, `False`, sentinels |
| Why `is` misleads | Small ints (-5 to 256) are cached and equal literals are often interned |
| Shallow copy | `list(xs)`, `xs[:]`: new outer container, same elements |
| Deep copy | `copy.deepcopy(xs)`: duplicates the whole structure; use it when elements are mutable |

The next lesson moves from one file to several: how `import` finds a module, what a package is, and why a file that runs its own analysis when imported is a file nobody can reuse.
