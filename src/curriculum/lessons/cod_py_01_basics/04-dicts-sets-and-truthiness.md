---
id: l04-dicts-sets-and-truthiness
title: Dictionaries, sets and truthiness
minutes: 22
covers:
  - list, tuple, dict, set; slicing; truthiness; mutability
---

Think about the contacts app on a phone. You never ask it for "the 212th contact". You type a name, and it hands you the number that goes with that name.

A list, from the last lesson, answers questions about position: "what is the fifth sample?" Most of the questions a test-data script asks are about *names* instead. What is the limit for channel `ax`? What units does `roll_rate` come in? Have I already seen this channel? For those you want a container that looks things up by a name, like the contacts app. In Python that container is the **dictionary**.

This lesson teaches the dictionary, its close cousin the **set**, and one rule that decides what Python counts as "true" when you hand it something that is not `True` or `False`. Between them they cover lookup tables, configuration, removing duplicates and comparing two collections — most of the non-numeric work in a pipeline that checks a rocket engine's test data.

## A dictionary maps keys to values

A **dictionary** — type name `dict` — stores pairs. Each pair has a **key** (the name you look up) and a **value** (what that name leads to). You write one inside curly braces `{ }`, with a colon between each key and its value, and commas between the pairs. Read the colon aloud as "maps to".

```python
>>> limits = {"ax": 12.5, "ay": 3.0, "az": 3.0}
>>> limits["ax"]
12.5
>>> len(limits)
3
```

The first line reads "`ax` maps to 12.5, `ay` maps to 3.0, `az` maps to 3.0". To look something up you put the key in square brackets, as you did with a list index — but the thing in the brackets is a key, not a position. Read `limits["ax"]` aloud as "limits at ax". `len` counts the pairs.

You change a dictionary with the same square brackets:

- Assigning to a key that is **not** there adds a new pair.
- Assigning to a key that **is** there replaces its value.
- `del` removes a pair.
- `in` asks whether a **key** is present. It never looks at the values.

```python
>>> limits = {"ax": 12.5, "ay": 3.0, "az": 3.0}
>>> limits["roll_rate"] = 15.0
>>> limits
{'ax': 12.5, 'ay': 3.0, 'az': 3.0, 'roll_rate': 15.0}
>>> "ay" in limits
True
>>> 3.0 in limits
False
>>> del limits["ay"]
>>> limits
{'ax': 12.5, 'az': 3.0, 'roll_rate': 15.0}
```

Look at `3.0 in limits`. The answer is `False` even though `3.0` is sitting right there as a value. For a dictionary, "in" always means "among the keys".

Notice also where `roll_rate` landed: at the end. A dictionary keeps its pairs in the order they were first put in. That order has been **[[guaranteed by the language since Python 3.7|insertion-order]]**, so a dictionary is safe to use when you need the same output every run.

### Getting at the parts

Three methods hand you the pieces of a dictionary:

- `.keys()` gives the keys;
- `.values()` gives the values;
- `.items()` gives `(key, value)` pairs, each one a tuple.

Each returns a **view** — a live window onto the dictionary, not a copy. At the prompt, wrap a view in `list()` to see it plainly:

```python
>>> limits = {"ax": 12.5, "az": 3.0, "roll_rate": 15.0}
>>> list(limits.keys())
['ax', 'az', 'roll_rate']
>>> list(limits.items())
[('ax', 12.5), ('az', 3.0), ('roll_rate', 15.0)]
```

Views are what you will loop over in the next lesson. You need `list()` only when you want a snapshot you can index or keep.

## A missing key is an error, unless you say otherwise

Ask for a key that is not there and Python stops with an error:

```python
>>> limits = {"ax": 12.5, "ay": 3.0}
>>> limits["roll_rate"]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
KeyError: 'roll_rate'
```

A `KeyError` names the key it could not find. That is usually enough to spot the problem: a typo, a wrong capital letter, or a channel this run did not record.

Sometimes a missing key is normal, not a mistake. Then use the `.get` method. It returns **`None`** — Python's special "nothing here" value — instead of raising, or it returns a default you choose:

```python
>>> limits = {"ax": 12.5, "ay": 3.0}
>>> print(limits.get("roll_rate"))
None
>>> limits.get("roll_rate", 0.0)
0.0
```

Why the `print` on the first line? Because if you type `limits.get("roll_rate")` on its own, the prompt shows nothing at all. The REPL **[[never echoes None|none-value]]**. That silence can fool you into thinking the line did not run.

The two forms say different things, so choose on purpose:

- `limits["ax"]` says "this key must be here; if it is not, my assumptions are wrong and I want to know now".
- `limits.get("ax", 0.0)` says "if it is missing, that is fine; use 0.0".

A default of `0.0` for a missing limit is dangerous: nearly every reading is above zero, so a zero limit fails everything. A default of `None`, which you then check for, is usually safer.

::: key
`d[k]` raises `KeyError` when `k` is absent; `d.get(k)` returns `None` and `d.get(k, default)` returns your default. `in` tests keys, not values. A dictionary preserves insertion order (guaranteed since Python 3.7).
:::

## Keys must be hashable, which is why tuples exist

How does a dictionary find a key so fast? Think of a coat check. When you hand over your coat, you get a ticket with a number. Later, the attendant does not search every hook — she walks straight to hook 47.

A dictionary does the same thing. From each key it computes a number called a **[[hash|hash-table]]** — a fingerprint of the key's value. It uses that number to pick a spot in memory, and it stores the pair there. To look the key up later, it computes the same hash and goes straight to the same spot.

That trick only works if a key can never change. A key that changed would get a new hash, and the dictionary would look for it in the wrong spot forever. So Python allows only **hashable** objects as keys. In practice that means **immutable** ones — objects that cannot be changed after they are made: numbers, strings, and tuples built from those.

A list can be changed, so a list cannot be a key:

```python
>>> by_time = {}
>>> by_time[(12, 500)] = "ax"
>>> by_time
{(12, 500): 'ax'}
>>> by_time[[12, 500]] = "ax"
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: unhashable type: 'list'
```

Learn to recognise `unhashable type: 'list'`. It means you used something changeable where a fixed key was needed. The tuple `(12, 500)` — seconds and milliseconds, say — is a perfectly good key.

This is the real answer to "when do I *need* a tuple instead of a list?" When the value has to be a dictionary key or a set member. (A tuple is hashable only if **[[everything inside it is hashable too|tuple-hashable]]**.)

Here is how the five containers you now know sort out. **Mutable** means it can be changed in place after it is built.

| Type | Mutable? | Can be a key or set member? |
| --- | --- | --- |
| `str` | no | yes |
| `tuple` | no | yes, if its contents are |
| `list` | yes | no |
| `dict` | yes | no |
| `set` | yes | no |

::: key
`list`, `dict` and `set` are mutable; `str` and `tuple` are immutable. Immutable objects can be dict keys and set members, and can be safely shared, because nothing can change them behind your back. Mutable ones cannot be keys.
:::

## Why a dictionary and not a list of pairs

You could keep the limits as a list of `(name, value)` tuples and search it. That works. The difference shows up as the table grows.

Picture looking for a friend's name in a pile of unsorted paper forms, one form at a time. With ten forms that takes seconds; with ten thousand, all afternoon. That is a list search. The coat check, by contrast, takes you straight to the hook however many coats there are. That is a dictionary lookup.

Programmers write this with **[[big-O notation|big-o]]**:

- A dictionary lookup is $O(1)$, read "order one": on average the work does not depend on how many entries there are. It computes one hash and checks a spot or two.
- Searching a list is $O(n)$, read "order n": the work grows in proportion to $n$, the number of entries. On average you check half the list for a name that is there, and the *whole* list when the answer is "not present".

With four channels nobody can measure the difference. Now take ten thousand channels, with one lookup per sample for a million samples. The list search makes about $10{,}000 / 2 = 5{,}000$ comparisons per lookup, so $5{,}000 \times 1{,}000{,}000 = 5 \times 10^9$ comparisons in all — five billion. The dictionary makes a million hash lookups.

So here is a rule you can use without measuring anything: **if you are searching a list for a match on some field, you wanted a dictionary keyed by that field.**

::: key
A dictionary lookup is $O(1)$ on average — one hash, independent of size — while scanning a list for a match is $O(n)$. For a channel lookup table keyed by id, the dictionary is the right structure, and the difference becomes visible at a few hundred entries.
:::

::: example A limits table for a hot fire
Before a **[[hot fire|hot-fire]]**, the test procedure sets a limit for each channel. After the run, the analysis script finds the peak value of each channel. Checking a peak against its limit is a lookup, not a search.

```python
# limits_table.py
limits = {"ax": 12.5, "ay": 3.0, "az": 3.0, "roll_rate": 15.0}
peak = {"ax": 12.06, "ay": 0.41, "roll_rate": 18.2}

print(peak["ax"] <= limits["ax"])                 # True
print(peak["roll_rate"] <= limits["roll_rate"])   # False
print(f"ax margin {limits['ax'] - peak['ax']:.2f} m/s^2")
# ax margin 0.44 m/s^2
print(peak.get("az", 0.0))                        # 0.0
print("gps_lat" in limits)                        # False
```

Walk through it line by line.

1. `peak["ax"]` is 12.06 and `limits["ax"]` is 12.5. Is 12.06 at most 12.5? Yes: `True`.
2. The roll rate peaked at 18.2 against a limit of 15.0. That is over, so `False` — this channel failed.
3. The margin is $12.5 - 12.06 = 0.44\,\mathrm{m/s^2}$. It is small and positive, which fits line 1: `ax` passed, but only just.
4. `peak.get("az", 0.0)` gives `0.0`. But `az` was never in `peak` at all — the run did not report it. The default made up a zero, and a zero sails through any limit check. In telemetry, "not recorded" and "recorded as zero" mean different things. So this default should be `None`, and the missing channel should be handled on purpose.
5. `gps_lat` has no limit in the table: `False`.

One detail of syntax: inside the f-string, the keys use single quotes, `limits['ax']`, because the f-string itself is in double quotes. On Python 3.11 you may not reuse the outer quote character inside the braces. From 3.12 on you may, but the 3.11 way works everywhere.
:::

## A dict of dicts

A value can be any object at all — including another dictionary. That is how you hold a small table of results:

```python
# axis_stats.py
stats = {
    "ax": {"min": -0.02, "max": 12.06, "mean": 4.91},
    "ay": {"min": -0.41, "max": 0.41, "mean": 0.00},
}

print(stats["ax"]["max"])        # 12.06
print(sorted(stats.keys()))      # ['ax', 'ay']
print(len(stats))                # 2
```

Read `stats["ax"]["max"]` **[[left to right|nested-lookup]]**. First, `stats["ax"]` looks up `ax` and gives back the inner dictionary. Then `["max"]` looks up `max` inside that. Two lookups, no searching anywhere.

This is exactly the shape the module's accelerometer exercise asks you to return: one lookup by axis name, then one by the name of the statistic.

## Sets: membership and comparison

A **set** is a bag of name tags with no duplicates allowed. It holds unique, hashable values, with no positions and no order. You can think of it as a dictionary with the values thrown away — keys only. It answers one question extremely fast: "is this thing in here?"

Write a set in curly braces without colons, or build one from any sequence with `set(...)`:

```python
>>> in_file = {"ax", "ay", "az", "roll_rate", "gps_lat"}
>>> len(in_file)
5
>>> "ax" in in_file
True
>>> sorted(set(["ax", "ax", "ay"]))
['ax', 'ay']
```

Adding a value that is already there changes nothing, so `set(sequence)` is the shortest way to remove duplicates. The last line above started with three names, one repeated, and ended with two.

Three methods change a set:

- `add(x)` puts `x` in;
- `discard(x)` takes `x` out, and says nothing if it was not there;
- `remove(x)` takes `x` out, and raises `KeyError` if it was not there.

One quirk: `{}` is an empty **dictionary**, not an empty set. Dictionaries had the braces first. The empty set is written `set()`.

```python
>>> type({})
<class 'dict'>
>>> set()
set()
```

### Comparing two sets

Four operators compare two sets `a` and `b`. Each gives back a new set:

| Operator | Read it as | Result holds the items… |
| --- | --- | --- |
| `a - b` | "a minus b", difference | in `a` but not in `b` |
| `a & b` | "a and b", intersection | in both |
| `a \| b` | "a or b", union | in either one |
| `a ^ b` | "a caret b", symmetric difference | in exactly one of them |

The `|` is the vertical bar, the "pipe" you met in the shell. The `^` is the caret, above the 6 on most keyboards.

::: warning Never print a set where output gets compared
A set has no order. Worse, the order it prints in can change between two runs of the *same* program, because Python **[[scrambles string hashes at start-up|hash-randomisation]]** as a security measure. So `{"ax", "ay"}` may print either way round. Never print a set directly in output that anyone compares — including the expected output of a test. Print `sorted(s)` instead: a list, in a defined order, every time.
:::

::: example Channels in the file that the spec never mentioned
Before analysing a run, check that the data file and the **[[interface document|icd]]** agree about which channels exist.

```python
# channel_audit.py
in_file = {"ax", "ay", "az", "roll_rate", "gps_lat"}
in_spec = {"ax", "ay", "az", "pitch_rate", "roll_rate"}

print(sorted(in_file - in_spec))   # ['gps_lat']
print(sorted(in_spec - in_file))   # ['pitch_rate']
print(sorted(in_file & in_spec))   # ['ax', 'ay', 'az', 'roll_rate']
print(len(in_file | in_spec))      # 6
```

Line by line:

1. In the file but not the spec: `gps_lat`. An extra channel usually means the data dictionary is out of date.
2. In the spec but not the file: `pitch_rate`. A missing channel is more serious. An analysis script is about to raise `KeyError` on it — or, worse, `.get` its way to a default and report a number nobody measured.
3. In both: the four channels everyone agrees on.
4. The union holds every distinct name. It is only counted, not printed, because a count does not depend on order.

Sanity check on that 6: five names in the file, five in the spec, four in common. Adding $5 + 5$ counts the shared four twice, so subtract them once: $5 + 5 - 4 = 6$. Every other result is wrapped in `sorted`, so the output is the same on every run.
:::

## Truthiness: what Python counts as true

Imagine checking a lunchbox. You do not care *what* is inside — only whether there is anything inside at all. Python has a rule for asking that of any value.

Anything can be used where a yes-or-no answer is wanted. The built-in `bool(x)` shows you which answer Python will give. The rule is short: **empty is false, zero is false, `None` is false, and everything else is true.** Values that count as false are called **falsy**; everything else is **truthy**.

```python
>>> bool([])
False
>>> bool([0.0])
True
>>> bool("")
False
>>> bool("0")
True
>>> bool(0.0)
False
>>> bool(None)
False
```

Look hard at the second and fourth lines. A list holding one zero is not empty, so it is truthy. So is a string holding the *character* zero. That is why a field read from a file must be turned into a number before you test it.

Here is the complete list of falsy values you will meet:

- `False` and `None`;
- zero of any number type: `0`, `0.0`;
- every empty container: `""`, `[]`, `()`, `{}`, `set()`.

This rule lets you write `not samples` for "there are no samples". It also explains a handy trick: `samples or [0.0]` means "the samples, or a single zero if there are none". That works because **[[`or` hands back one of its operands|or-returns]]** — the first one that is truthy, or the last one if none is:

```python
>>> samples = []
>>> samples or [0.0]
[0.0]
>>> not samples
True
```

The next lesson puts this rule to work in `if`, which runs every condition through `bool` automatically.

::: key
Falsy values: `False`, `None`, `0`, `0.0`, and every empty container — `""`, `[]`, `()`, `{}`, `set()`. Everything else is truthy. Use truthiness to ask "is this container empty?", and `x is None` to ask "is this value missing?".
:::

::: warning Zero is a real measurement
The rule "zero is false" is a trap for measured quantities. A roll rate of exactly `0.0` is a real reading — the vehicle is not rotating — and it is falsy. So a test meant to ask "was a rate reported?" gives the wrong answer in exactly the case where it matters. Use `x is not None` when you are asking whether a value exists. Keep truthiness for containers, where "empty" and "absent" really do mean the same thing.
:::

## Check yourself

::: check
`d = {"ax": 12.5, "ay": 3.0}`. What do `d["az"]`, `d.get("az")`, `d.get("az", 0.0)` and `"az" in d` each produce, and which would you use in a limit check?
:::

::: answer
- `d["az"]` raises `KeyError: 'az'`.
- `d.get("az")` returns `None` — and at the prompt it shows nothing at all.
- `d.get("az", 0.0)` returns `0.0`.
- `"az" in d` returns `False`.

In a limit check, use `d["az"]` and let it raise. A channel with no limit in the table means the table is incomplete. A run that reports "pass" because a limit was quietly defaulted is worse than a run that stops. The default form belongs where absence is genuinely normal — an optional configuration setting, say.
:::

::: check
You need to record the peak acceleration for each (stage, axis) pair, such as stage 1, axis `ax`. Give a key that works and one that does not, and say why.
:::

::: answer
A tuple works: `peaks[(1, "ax")] = 12.06`. A list does not: `peaks[[1, "ax"]]` raises `TypeError: unhashable type: 'list'`.

The dictionary computes a hash from the key and relies on it never changing. A list can be changed in place after it has been used as a key, which would leave the entry stranded in the wrong spot. So Python refuses lists as keys outright. Any tuple of immutable values is fine.
:::

::: check
A script keeps 8,000 channel definitions as a list of `(name, unit, limit)` tuples. It searches the list for a name once per sample, for 2 million samples. Estimate the number of comparisons, and say what to change.
:::

::: answer
A linear search checks, on average, half the list to find a name that is present: $8{,}000 / 2 = 4{,}000$ comparisons. Doing that 2 million times costs about $2 \times 10^{6} \times 4{,}000 = 8 \times 10^{9}$ comparisons — eight billion.

Build the table once as a dictionary keyed by name. Each lookup is then one hash, so the cost is about 2 million lookups, plus 8,000 steps to build the table. That is thousands of times less work. Nothing about the data changed; only the container did.
:::

::: check
Why does the channel audit print `sorted(in_file - in_spec)` instead of `print(in_file - in_spec)`, and when does the difference matter?
:::

::: answer
A set has no order, and the order it displays in depends on the hash values, which Python scrambles afresh each time a program starts (for strings). Printing the set directly can give different output on two runs of the same script on the same data.

That matters whenever the output is compared with something: a test with an expected string, a report diffed against yesterday's, a file whose checksum is recorded. `sorted` returns a list in a defined order, so the output is the same every time.
:::

::: check
A function receives `rate`, which is either a float or `None` when the sensor did not report. What is wrong with testing `not rate`, and what should the test be?
:::

::: answer
`not rate` is true when `rate` is `None` — but also when `rate` is `0.0`, because zero is falsy. So a genuine reading of zero rotation is treated as a missing sensor.

The test should be `rate is None`, which is true only in the missing case. This is why `is None`, not truthiness, is the habit for optional values. It is also why the default in a `.get` for a physical quantity should usually be `None`, not `0.0`.
:::

## Summary

| Item | Statement |
| --- | --- |
| `dict` | `{"ax": 12.5}`; maps hashable keys to any values; insertion-ordered since 3.7 |
| Lookup | `d[k]` raises `KeyError`; `d.get(k)` gives `None`; `d.get(k, default)` gives your default |
| Membership | `k in d` tests keys, never values |
| Views | `.keys()`, `.values()`, `.items()`; `.items()` yields `(key, value)` tuples |
| Key requirement | Hashable, so immutable: numbers, strings, tuples of those. A list raises `TypeError: unhashable type: 'list'` |
| Complexity | dict lookup $O(1)$ average; scanning a list $O(n)$ |
| `set` | `{"ax", "ay"}`; unique, unordered, hashable members; empty set is `set()`, not `{}` |
| Set operators | `-` difference, `&` intersection, `\|` union, `^` in exactly one |
| Set display | Order is arbitrary and varies between runs; print `sorted(s)` |
| Mutability | `list`, `dict` and `set` are mutable; `str` and `tuple` are immutable, and only immutable values can be keys or set members |
| Falsy values | `False`, `None`, `0`, `0.0`, `""`, `[]`, `()`, `{}`, `set()`. Everything else is truthy |
| Optional values | Test `x is None`, not `not x`, because `0.0` is a real measurement |

You now have all four containers. The next lesson is what makes them worth having: `if` to choose, and `for` and `while` to visit every element of a list, every pair of a dictionary, and two sequences side by side.

::: context insertion-order When dictionaries started keeping order
For most of Python's history a dictionary made no promise about order. Pairs came back in whatever order the hash table happened to hold them.

In CPython 3.6 — CPython is the standard Python program you download from python.org — the dictionary was rebuilt to use less memory. The new design stores the pairs in a plain array, in the order they arrive, with a separate small index of hash positions pointing into it. Keeping insertion order came along for free.

At first that was called an implementation detail that might change. In Python 3.7 it became part of the language itself, so every Python — not only CPython — must keep dictionaries in insertion order. Code that relies on it is correct on 3.7 and later.
:::

::: context none-value The value that means "nothing"
`None` is a single, special object that stands for "no value here". There is exactly one `None` in a running program, which is why you test for it with `is None` rather than `== None`.

The REPL prints the result of every expression you type — except `None`. If it echoed `None` after every function that returns nothing, such as `print(...)` itself, your screen would fill with noise. The price is that a lookup which really did return `None` looks exactly like a line that produced no result. Wrapping it in `print(...)` makes the `None` visible.
:::

::: context hash-table Where the hash sends each key
A dictionary keeps a row of numbered slots. For each key it computes `hash(key)`, a large integer, and uses part of it to choose a slot. Lookup repeats the same calculation and goes straight to that slot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="44">"ax"</text>
    <text x="10" y="89">"ay"</text>
    <text x="10" y="134">"roll_rate"</text>
  </g>
  <rect x="82" y="30" width="70" height="115" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="117" y="92" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">hash</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="42" y1="40" x2="82" y2="40"/>
    <line x1="42" y1="85" x2="82" y2="85"/>
    <line x1="72" y1="130" x2="82" y2="130"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="230" y="10" width="110" height="18"/>
    <rect x="230" y="28" width="110" height="18"/>
    <rect x="230" y="46" width="110" height="18"/>
    <rect x="230" y="64" width="110" height="18"/>
    <rect x="230" y="82" width="110" height="18"/>
    <rect x="230" y="100" width="110" height="18"/>
    <rect x="230" y="118" width="110" height="18"/>
    <rect x="230" y="136" width="110" height="18"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="end">
    <text x="224" y="23">0</text><text x="224" y="41">1</text><text x="224" y="59">2</text><text x="224" y="77">3</text>
    <text x="224" y="95">4</text><text x="224" y="113">5</text><text x="224" y="131">6</text><text x="224" y="149">7</text>
  </g>
  <g font-size="11" fill="#1d6fd1">
    <text x="236" y="59">ay: 3.0</text>
    <text x="236" y="113">ax: 12.5</text>
    <text x="236" y="149">roll_rate: 15.0</text>
  </g>
  <g stroke="#b4232c" stroke-width="1.5">
    <line x1="152" y1="60" x2="228" y2="108"/>
    <line x1="152" y1="85" x2="228" y2="55"/>
    <line x1="152" y1="120" x2="228" y2="145"/>
  </g>
  <text x="180" y="166" font-size="11" text-anchor="middle" fill="#6c7a93">slot numbers are only an example</text>
</svg>
```

Which slot each key lands in depends on its hash, and for strings that changes from run to run. What stays true is that lookup goes to one place instead of reading every slot.
:::

::: context tuple-hashable A tuple is only as fixed as its contents
A tuple cannot be changed, but it can *hold* something that can. `(1, [2, 3])` is a tuple whose second item is a list, and that list can still grow. So Python refuses to hash it: `hash((1, [2, 3]))` raises `TypeError: unhashable type: 'list'`, the same message as before.

A tuple is hashable only when everything inside it is hashable. Tuples of numbers and strings — the usual kind of key — are always fine.

If you ever need a set that can be a key, Python has `frozenset`: a set that cannot be changed after it is built, and is therefore hashable.
:::

::: context big-o Reading the big O
The "O" stands for *order*, as in "order of magnitude". $O(n)$ is read "order n" or "big O of n". It describes how the work grows as the input grows, and ignores the fixed costs that do not grow.

$O(1)$ means the work stays flat: a table ten times bigger costs about the same per lookup. $O(n)$ means the work grows in step: ten times the entries, about ten times the comparisons.

For a dictionary the $O(1)$ is an *average*. Two keys sometimes want the same slot, and then Python checks another slot or two. Python keeps at least a third of the slots empty, growing the table when it fills, so these clashes stay rare.
:::

::: context hot-fire What a hot fire is
A **hot fire** is a test where a rocket engine, or a whole stage, is fired for real while bolted to a test stand or held down on the launch pad, so it cannot fly. Engineers record hundreds of sensor channels — pressures, temperatures, accelerations, valve positions — many times a second.

After the test, scripts like the one in this lesson compare every channel's peak against a limit written in the test procedure. A single channel over its limit can mean a part must be inspected before the vehicle flies. That is why a silently defaulted limit or a made-up zero is taken so seriously.
:::

::: context nested-lookup Two lookups, one after the other
`stats["ax"]["max"]` is two separate lookups written on one line. The first brackets open the outer dictionary; the second open whichever inner dictionary the first one returned.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 158" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="100" height="100" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="60" y="14" font-size="12" text-anchor="middle" fill="#1f2a44">stats</text>
  <rect x="20" y="35" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">"ax"</text>
  <rect x="20" y="78" width="80" height="26" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="96" font-size="12" text-anchor="middle" fill="#1f2a44">"ay"</text>
  <line x1="100" y1="48" x2="176" y2="48" stroke="#b4232c" stroke-width="2"/>
  <polygon points="180,48 170,43 170,53" fill="#b4232c"/>
  <text x="140" y="40" font-size="11" text-anchor="middle" fill="#b4232c">1st</text>
  <rect x="182" y="20" width="168" height="110" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="192" y="48" font-size="12" fill="#1f2a44">"min": -0.02</text>
  <rect x="188" y="62" width="156" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="192" y="80" font-size="12" fill="#1f2a44">"max": 12.06</text>
  <text x="192" y="112" font-size="12" fill="#1f2a44">"mean": 4.91</text>
  <text x="266" y="148" font-size="11" text-anchor="middle" fill="#b4232c">2nd lookup gives 12.06</text>
</svg>
```

If either key is missing you get a `KeyError` naming the key that failed, so you can tell which of the two lookups went wrong.
:::

::: context hash-randomisation Why the order changes between runs
In 2011 researchers showed that attackers could send a web server thousands of carefully chosen strings that all landed in the same hash slot. Every lookup then turned into a slow search, and the server ground to a halt. This is called a **hash-flooding** attack.

Python's defence, switched on by default from Python 3.3, is to mix a random number into every string hash, chosen fresh each time the interpreter starts. An attacker can no longer predict the slots. A side effect is that the order of a set of strings is different from run to run. Setting the environment variable `PYTHONHASHSEED` to a fixed number turns the randomness off, but the right fix for output is still `sorted`.
:::

::: context icd The interface document
On a real vehicle program, the list of every telemetry channel — its name, units, sample rate and meaning — lives in a controlled document. It is often called an **interface control document**, or ICD, because it is the agreement at the interface between two teams: the one that builds the hardware and the one that analyses its data.

When the data file and the ICD disagree, one of them is wrong, and someone has to find out which before the numbers are trusted. Set difference is the quickest way to see the disagreement.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <circle cx="135" cy="90" r="75" fill="#8fb8f0" fill-opacity="0.6" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="225" cy="90" r="75" fill="#f2b880" fill-opacity="0.6" stroke="#1f2a44" stroke-width="2"/>
  <text x="70" y="12" font-size="12" text-anchor="middle" fill="#1f2a44">in_file</text>
  <text x="290" y="12" font-size="12" text-anchor="middle" fill="#1f2a44">in_spec</text>
  <text x="100" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">gps_lat</text>
  <text x="262" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">pitch_rate</text>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="180" y="66">ax</text><text x="180" y="81">ay</text><text x="180" y="96">az</text><text x="180" y="112">roll_rate</text>
  </g>
</svg>
```

The left crescent is `in_file - in_spec`, the right crescent is `in_spec - in_file`, the middle is `&`, and all three regions together are `|`.
:::

::: context or-returns What `or` really gives back
You might expect `a or b` to give `True` or `False`. It does not. Python looks at `a` first. If `a` is truthy, the answer is `a` itself, and `b` is never even looked at. If `a` is falsy, the answer is `b`, whatever `b` is.

So `[] or [0.0]` is `[0.0]`, and `[9.8] or [0.0]` is `[9.8]`. `and` works the mirror way: it gives back the first falsy operand, or the last one. Used in an `if`, the result is passed through `bool`, so it behaves like true or false anyway. Outside an `if`, you get the actual object.
:::
