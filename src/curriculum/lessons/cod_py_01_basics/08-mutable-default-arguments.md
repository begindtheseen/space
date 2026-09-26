---
id: l08-mutable-default-arguments
title: The mutable default argument, identity and copying
minutes: 18
covers:
  - The mutable default argument trap
---

Picture a hotel room with a notepad on the desk. The sign says "a fresh notepad for every guest". But nobody ever replaces it. The first guest writes a phone number on it. The second guest finds that number and adds her own. By the tenth guest, the "fresh" notepad is full of strangers' notes, and nobody noticed when it started.

This lesson is about the Python version of that notepad. It is one bug, and it gets a lesson to itself for three reasons. It is the most famous bug in Python. It is completely silent — no exception, no warning, only wrong numbers. And understanding it means you have understood the two rules it is made from, which matter far beyond this one case.

The bug looks like this. You write a function that collects values into a list, and you give the list a sensible default so the caller does not have to supply one. Later you discover that data from one sensor channel has turned up in another channel's results. Nothing crashed. The run completed. The report is wrong.

The two rules behind it are already in your hands:

- From lesson 6: **a default value is evaluated once, when the `def` line runs**, not on each call.
- From lesson 3: **assignment binds a name to an object and never copies it**. "Binds" means ties the name to the object, like a name tag.

Put them together. The default list is one object, made once, shared by every call that leaves the argument out, and kept between calls for the whole life of the program.

## The trap

A **mutable** object is one that can be changed in place after it is made — a list, a dictionary, a set. An **immutable** one cannot — a number, a string, a tuple, `None`. Here is a mutable default at work:

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

Go through the four calls one at a time:

1. `add(1)` gets no `acc`, so it uses the default list. It appends 1 and returns `[1]`. Fine so far.
2. `add(2)` also gets no `acc`. It uses the default — the *same* list the first call appended to. It appends 2 and returns `[1, 2]`.
3. `add(3, [])` supplies its own brand-new list. It returns `[3]`, as you would expect.
4. `add(4)` leaves `acc` out again. It carries on filling the shared list, which already held `[1, 2]`, and returns `[1, 2, 4]`.

A function that behaves differently depending on how many times it has been called before is a function you cannot reason about. You cannot test it on its own, and you cannot use it twice in one program.

## Proof: the default is stored on the function

You do not have to take this on faith. Python keeps the defaults on the function object, and you can look at them:

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

`__defaults__` (read "dunder defaults", for the double underscores) is a tuple of the default values. Its contents changed between the two prints.

So the `[]` in the `def` line is not a recipe for making a new empty list each time. It is one list, made **[[when the module was imported|def-runs-once]]**, owned by the function, and changed by every call that uses it. The `def` line has already run before any call happens. That is the whole explanation.

::: key
`def f(x, acc=[])` misbehaves because the default object is created once, when the function is defined, and shared by every call that omits the argument — so mutations accumulate across calls. Use `acc=None` and build a fresh list inside the body.
:::

## The fix

Use `None` as the default. `None` is Python's word for "no value", and here it acts as a **[[sentinel|sentinel-word]]** — a marker that means "nothing was supplied". Then create the real list inside the body:

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

Now every call that leaves out `acc` runs `acc = []`, which builds a new list *at call time*. The default stored on the function is `None`, and `None` cannot be changed, so there is nothing to pile up. The second call returns `[2]`, not `[1, 2]`.

Write the test as `if acc is None:` and not `if not acc:`. They differ exactly where it matters. An empty list is **[[falsy|falsy-values]]** — it counts as false in an `if`. So if a caller deliberately passes an empty list, `if not acc:` would quietly swap it for a different empty list. The caller, who may be holding on to their list to read later, would never see the appended value.

::: example A collector that mixed two channels
Here is the shape the bug takes in real code. A helper collects samples as they are parsed, and the author gives it a default so the first call can be short:

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

Trace it:

1. `collect(0.02)` appends to the default list. `ax` now names it: `[0.02]`.
2. `collect(0.11)` appends to the same list: `[0.02, 0.11]`.
3. `collect(-0.41)` is meant to start the `ay` channel. But it too appends to the same list, giving `[0.02, 0.11, -0.41]`, and `ay` names that list.

There are not two lists. `ax` and `ay` are two names for the single default object — `ax is ay` is `True`. The `ay` sample landed in the `ax` results. A statistics pass over `ax` would now report a mean mixing two different axes, and nothing in the output hints that anything went wrong.

The corrected version creates a list per call and makes the caller say which collection a sample belongs to:

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

Sanity check: `ax` has the two x samples, `ay` has the one y sample, and they are different objects. Notice that the fixed version made the second call's intent visible: `collect(0.11, ax)` says which collection to add to. The buggy version's short call was hiding a decision, not making one.
:::

## It is not only lists

Anything mutable used as a default has the same problem: a dictionary, a set, an object of your own. So does anything *computed* when the `def` runs. That is the same rule wearing different clothes:

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

`time.sleep(0.2)` waits a fifth of a second. Yet the two "timestamps" are the same object, and the difference between them is zero. `datetime.datetime.now()` ran once, when the module was imported, so every record this function stamps carries the time the program started.

On a ground-station data pipeline that runs for days, that is a log where every entry claims to have happened at start-up. The fix is identical: default to `None`, and call `datetime.datetime.now()` inside the body.

::: warning
The rule to carry: **a default argument must be immutable** — a number, a string, `True`, `False`, `None`, or a tuple of those. If you want a list, a dict, a set, a timestamp or anything else built fresh per call, default to `None` and build it in the body. **[[Linters|linters-catch-it]]** can flag mutable defaults automatically; configure yours to do so.
:::

## `is` versus `==`

Both of the checks above used `is`. It is worth being exact about the difference, because using the wrong one is a bug from the same family.

Think of two identical twins. They look the same — that is `==`. But they are two different people — so `is` says no. And one person seen twice, once in the morning and once at night, is the same person — `is` says yes.

- `a == b` (read "a equals b") asks whether the two objects have the same **value**.
- `a is b` asks whether they are the **same object** in memory. That sameness is called **identity**.

`is` is the right test for a short list of things: `None`, `True`, `False`, and sentinel objects you made yourself for the purpose. For values, it is wrong. And, dangerously, it often *seems* to work:

```python
# identity.py
a = 100
b = int("100")
print(a == b, a is b)   # True True

c = 1000
d = int("1000")
print(c == d, c is d)   # True False
```

The two lines ask the same question about numbers that differ only in size, and get different answers. Here is why. The usual Python, called CPython, keeps **[[one shared object for every small integer|small-int-cache]]** from $-5$ to $256$. So `a` and `b` end up as the same object. 1000 is outside that range, so `c` and `d` are two separate objects that happen to hold equal values.

The same thing happens with strings. Identical string literals in one file are often merged into one object — this is called **[[interning|string-interning]]** — while strings built while the program runs usually are not:

```python
# interning.py
s1 = "ax"
s2 = "a" + "x"
s3 = "".join(["a", "x"])
print(s1 is s2)    # True
print(s1 is s3)    # False
print(s1 == s3)    # True
```

`s2` was worked out from two literals before the program ran, so it got merged with `s1`. `s3` was glued together at run time, so it is a new object — equal in value, different in identity.

Every one of these is an **implementation detail**: a choice made by one version of one Python, not a promise of the language. It can change between versions. That is exactly why `channel is "ax"` is a bug. It will pass your test, where the string is a literal in the file. Then it will fail in production, where the string was read from a telemetry file. Compare values with `==`. Keep `is` for `None` and friends. Python itself **[[warns you|is-literal-warning]]** about this one.

::: key
`is` compares object identity, `==` compares value. Use `is` only for `None`, `True`, `False` and sentinels. Small-integer caching and string interning make `is` appear to work for values, then fail in production data — such as a string read from a file.
:::

## Copying, shallow and deep

The cure for an unwanted shared object is often a copy, and there are two kinds.

`list(xs)` and `xs[:]` make a **shallow** copy: a new outer list holding the *same* element objects. Think of photocopying a table of contents. You get a new page, but it still points to the same chapters. If the elements are themselves mutable, both lists still share them:

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

Appending through `shallow[0]` changed `runs`, because `shallow[0]` and `runs[0]` are the same inner list — the shallow copy duplicated the outer list only. A **deep** copy, made with `copy.deepcopy`, walks the whole structure and duplicates everything inside it. So `deep` is truly independent, and it still shows the original two values.

::: example A summary dict that shared its rows
The same trap, one level up. A script keeps per-axis sample lists in a dictionary. It takes a copy before adding a derived channel, and finds the original changed anyway:

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

Read the two changes separately, because they behave differently and that is the whole lesson:

1. **Adding the key `az`** changed only `shallow`. The outer dictionary really was copied, so a new key in the copy does not appear in `raw`.
2. **Appending 3.94 to `shallow["ax"]`** changed `raw` as well. `dict(raw)` copied the *references* to the inner lists, so `shallow["ax"]` and `raw["ax"]` are **[[one list|dict-copy-picture]]**.

So a shallow copy protects the structure you copied and nothing inside it. `copy.deepcopy` walked the whole thing and left `deep` independent — its `ax` list still has two samples, as it should. When you are copying a container of containers, and the word "backup" or "original" appears anywhere near it, a shallow copy is not a backup.
:::

Deep copies cost time and memory in proportion to the size of the structure, so do not reach for one by reflex. Ask how deep the sharing goes. For a list of floats, a shallow copy is complete, because a float cannot be changed in place. For a list of lists, a dictionary of lists, or anything holding changeable objects, it is not.

## Check yourself

::: check
Predict the two lines printed, then say which of the two rules from the start of the lesson explains each.

```python
def add(v, acc=[]):
    acc.append(v)
    return acc

print(add(1))
print(add(2))
```
:::

::: answer
It prints `[1]` and then `[1, 2]`.

The first rule — a default is evaluated once, at definition time — is why there is only one list, created when `def` ran. The second rule — assignment binds without copying — is why `acc` inside the second call refers to that same list rather than a copy of it, so the first `append` is still visible.

The fix is `acc=None` with `if acc is None: acc = []` in the body.
:::

::: check
Why `if acc is None:` rather than `if not acc:`?
:::

::: answer
Because an empty list is falsy. A caller who deliberately passes an empty list — perhaps one they plan to keep and read afterward — would trip `if not acc:` and have their list silently replaced by a different one. The appended value would then never appear in the list they are holding.

`is None` tells apart "no argument was supplied" and "an empty container was supplied", which are different situations. It is also faster, and it cannot be fooled by a value that merely looks empty.
:::

::: check
A logging helper is written as `def log(msg, seen=set()): ...` and uses `seen` to suppress duplicate messages. Is this a bug?
:::

::: answer
It is the same construct, but here the sharing may be exactly what the author wanted: one set, lasting across calls, remembering what has already been logged.

It still deserves to be replaced, for three reasons. The set lives as long as the whole program, so a long run never forgets and the set grows without limit. Tests cannot reset it, so the order tests run in changes their results. And a reader has to know this rule to see that the persistence is on purpose rather than an accident.

Keep the state where it can be seen and reset — a closure over a set, as lesson 7 showed, or an explicit argument.
:::

::: check
`a = 100; b = int("100")` gives `a is b` as `True`, while `c = 1000; d = int("1000")` gives `False`. What single conclusion should you draw?
:::

::: answer
That `is` must never be used to compare values.

CPython caches and shares the small integers from $-5$ to $256$, so identity happens to agree with equality inside that range and disagrees outside it. The boundary is an implementation detail, not a language rule: it differs between Python implementations and can change between versions.

Use `==` for values. Keep `is` for `None`, `True`, `False` and sentinel objects, where identity is exactly the question being asked.
:::

::: check
`runs = [[1.0], [2.0]]` and `backup = list(runs)`. Someone appends to `runs[0]`. Does `backup` change, and what would have prevented it?
:::

::: answer
Yes. `list(runs)` copies the outer list only, so `backup[0]` and `runs[0]` are the same inner list, and appending through either shows up through both. `copy.deepcopy(runs)` duplicates the inner lists too, and would have prevented it.

The general rule: a shallow copy is enough when the elements cannot be changed in place — floats, ints, strings, tuples of those — and not otherwise.
:::

## Summary

| Item | Statement |
| --- | --- |
| The trap | `def f(x, acc=[])` creates one list at definition time, shared by every call that omits it |
| Why | Defaults are evaluated once when `def` runs; assignment binds without copying |
| Proof | `f.__defaults__` holds the objects and shows them changing |
| The fix | `acc=None`, then `if acc is None: acc = []` in the body |
| Test form | `is None`, never `not acc`: an empty list the caller passed must not be replaced |
| Reach of the rule | Any mutable default — list, dict, set — and anything computed at definition, such as `datetime.now()` |
| `is` vs `==` | Identity vs value; use `is` only for `None`, `True`, `False`, sentinels |
| Why `is` misleads | Small ints ($-5$ to $256$) are cached and equal literals are often interned |
| Shallow copy | `list(xs)`, `xs[:]`: new outer container, same elements |
| Deep copy | `copy.deepcopy(xs)`: duplicates the whole structure; use it when elements are mutable |

The next lesson moves from one file to several: how `import` finds a module, what a package is, and why a file that runs its own analysis when imported is a file nobody can reuse. You will see there that "when the module was imported" — the moment this lesson's default list was made — is a moment you do not control.

::: context def-runs-once One list, made before any call
A `def` statement is an instruction that runs, like any other line. When Python reaches it — usually while the module is being imported — it builds the function object and, right then, evaluates each default and stores the result in `__defaults__`. Every later call that leaves `acc` out is handed that stored object.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="14" width="120" height="34" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="72" y="36" font-size="12" text-anchor="middle" fill="#1f2a44">def add (runs once)</text>
  <rect x="12" y="66" width="120" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="72" y="85" font-size="12" text-anchor="middle" fill="#1f2a44">call add(1)</text>
  <rect x="12" y="108" width="120" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="72" y="127" font-size="12" text-anchor="middle" fill="#1f2a44">call add(2)</text>
  <rect x="220" y="60" width="128" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="284" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">[1, 2]</text>
  <text x="284" y="52" font-size="11" text-anchor="middle" fill="#6c7a93">the one default list</text>
  <line x1="132" y1="31" x2="212" y2="68" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="219,71 209,63 206,71" fill="#1d6fd1"/>
  <line x1="132" y1="80" x2="211" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="219,80 209,75 209,85" fill="#1f2a44"/>
  <line x1="132" y1="122" x2="212" y2="92" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="219,89 206,89 209,97" fill="#1f2a44"/>
</svg>
```
:::

::: context sentinel-word A guard at the gate
A **sentinel** was originally a soldier standing guard. In programming it means a special marker value that stands for "nothing here" or "stop". `None` is the usual one. When `None` is itself a sensible value for the caller to pass, make your own: `_MISSING = object()` at module level, `def get(d, key, default=_MISSING)`, and test `if default is _MISSING:`. A fresh `object()` is equal only to itself, so no caller can pass it by accident — and `is` is exactly the right test.
:::

::: context falsy-values What counts as false
In an `if`, Python treats some values as false even though they are not `False`: the number `0`, the empty string `""`, an empty list, dict, set or tuple, and `None`. These are called **falsy**; everything else is **truthy**. Lesson 4 covered this. The catch here: `[]` and `None` are both falsy, so `if not acc:` cannot tell "the caller gave me an empty list" from "the caller gave me nothing". `is None` can. And `[0]` is truthy — a list holding a zero is not empty.
:::

::: context linters-catch-it Let a tool catch it
A **linter** is a program that reads your code without running it and points out likely mistakes. This bug is common enough that the popular ones have a named check for it: Pylint reports `dangerous-default-value` (W0102), and the flake8-bugbear rules, also built into the Ruff linter, report B006 for a mutable default and B008 for a function call in a default — the `datetime.now()` case. Teams usually run a linter automatically on every change, so the bug is caught in review instead of in a report.
:::

::: context small-int-cache The shared small numbers
Small integers are used everywhere — loop counters, indexes, lengths — so CPython builds one object for each of $-5$ through $256$ when it starts, and hands out those same objects whenever such a value is produced. Anything outside the band is a new object each time it is computed. That is $262$ shared objects in all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="14" y1="50" x2="346" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <rect x="70" y="40" width="170" height="20" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="70" y1="34" x2="70" y2="66" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="240" y1="34" x2="240" y2="66" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="82" font-size="12" text-anchor="middle" fill="#1f2a44">−5</text>
  <text x="240" y="82" font-size="12" text-anchor="middle" fill="#1f2a44">256</text>
  <text x="155" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">shared: 100 is 100</text>
  <text x="300" y="30" font-size="12" text-anchor="middle" fill="#b4232c">new each time</text>
  <text x="300" y="82" font-size="12" text-anchor="middle" fill="#1f2a44">1000</text>
  <rect x="262" y="44" width="10" height="12" fill="#fff"/>
  <line x1="258" y1="58" x2="266" y2="42" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="268" y1="58" x2="276" y2="42" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="267" y="96" font-size="11" text-anchor="middle" fill="#6c7a93">axis broken</text>
  <circle cx="300" cy="50" r="4" fill="#b4232c"/>
</svg>
```
:::

::: context string-interning Keeping one copy of each word
To **intern** a string is to keep a single copy of it in a table and reuse that copy wherever the same text appears. Python interns the names in your code — variable, function and attribute names — because it looks them up in dictionaries constantly, and comparing two interned strings can be as quick as comparing their addresses. You can intern a string yourself with `sys.intern(s)`. Strings read from files or built at run time are not interned automatically, which is why `is` stops agreeing with `==` on real data.
:::

::: context is-literal-warning Python tries to warn you
Since Python 3.8, writing `is` against a literal — `channel is "ax"` or `n is 1000` — makes the compiler print `SyntaxWarning: "is" with a literal. Did you mean "=="?` when the file is first compiled. It is only a warning: the code still runs and still gives the unreliable answer. Treat that warning as an error. It is almost always this exact bug.
:::

::: context dict-copy-picture Copied outside, shared inside
`dict(raw)` builds a new dictionary, but its values are the same list objects `raw` already held. A new key goes into `shallow` alone; an append to a shared list shows up through both names.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="14" width="96" height="50" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="10" font-size="11" text-anchor="middle" fill="#1f2a44">raw</text>
  <text x="30" y="34" font-size="12" fill="#1f2a44">"ax"</text>
  <text x="30" y="54" font-size="12" fill="#1f2a44">"ay"</text>
  <rect x="12" y="84" width="96" height="60" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">shallow</text>
  <text x="30" y="102" font-size="12" fill="#1f2a44">"ax"</text>
  <text x="30" y="120" font-size="12" fill="#1f2a44">"ay"</text>
  <text x="30" y="138" font-size="12" fill="#b4232c">"az"</text>
  <rect x="200" y="20" width="148" height="28" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="274" y="39" font-size="11" text-anchor="middle" fill="#1f2a44">[0.02, 0.11, 3.94]</text>
  <rect x="200" y="66" width="148" height="28" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="274" y="85" font-size="11" text-anchor="middle" fill="#1f2a44">[-0.41, 0.05]</text>
  <rect x="200" y="112" width="148" height="28" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="274" y="131" font-size="11" text-anchor="middle" fill="#1f2a44">[9.79]</text>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="72" y1="30" x2="200" y2="32"/>
    <line x1="72" y1="50" x2="200" y2="78"/>
    <line x1="72" y1="98" x2="200" y2="36"/>
    <line x1="72" y1="116" x2="200" y2="82"/>
  </g>
  <line x1="72" y1="134" x2="200" y2="126" stroke="#b4232c" stroke-width="1.5"/>
</svg>
```
:::
