---
id: l04-dicts-sets-and-truthiness
title: Dictionaries, sets and truthiness
minutes: 17
covers:
  - list, tuple, dict, set; slicing; truthiness; mutability
---

A list answers "what is the fifth sample". Most of the questions a GNC script actually asks are not about position: what is the limit for channel `ax`, what units does `roll_rate` come in, have I already seen this channel name. For those you want a container indexed by a *name* rather than by a number, and that is a dictionary.

A *dictionary* — `dict` — stores pairs: a *key* and the *value* it maps to. Look a key up and you get its value back, in a time that does not grow as the dictionary gets bigger. A *set* is the same machinery with the values thrown away: it holds keys only, and answers one question extremely fast — is this thing in here. Between them they cover lookup tables, configuration, counting, deduplication and comparing two collections, which is most of the non-numeric work in a test-data pipeline.

The lesson closes with *truthiness*: the rule that decides what Python considers true when you hand it something that is not a `bool` — an empty list, a zero, a `None`. It belongs here because the commonest use of the rule is asking whether a container has anything in it, and because the commonest bug it causes is a measurement of exactly zero being treated as missing data.

## A dictionary maps keys to values

Write one in braces, `key: value` pairs separated by commas. Look up with square brackets, as with a list, but using the key:

```python
>>> limits = {"ax": 12.5, "ay": 3.0, "az": 3.0}
>>> limits["ax"]
12.5
>>> len(limits)
3
```

Assignment to a key that does not exist adds it; assignment to one that does replaces its value. `del` removes a pair, and `in` asks whether a **key** is present — not a value:

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

`3.0 in limits` is `False` even though 3.0 is one of the values, because membership on a dictionary means membership among its keys. Since Python 3.7 a dictionary keeps its pairs in the order they were first inserted, which is why `roll_rate` appears at the end above; that order is guaranteed by the language, so a dictionary is safe to use where reproducible output matters.

Three methods give you the parts: `.keys()`, `.values()` and `.items()`, the last producing `(key, value)` tuples. Each returns a *view* — a live window onto the dictionary rather than a list — so wrap it in `list()` to see it at the prompt:

```python
>>> limits = {"ax": 12.5, "az": 3.0, "roll_rate": 15.0}
>>> list(limits.keys())
['ax', 'az', 'roll_rate']
>>> list(limits.items())
[('ax', 12.5), ('az', 3.0), ('roll_rate', 15.0)]
```

Views are what you loop over in the next lesson; `list()` is only needed when you want a snapshot you can index or keep.

## A missing key raises, unless you say otherwise

```python
>>> limits = {"ax": 12.5, "ay": 3.0}
>>> limits["roll_rate"]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
KeyError: 'roll_rate'
```

`KeyError` names the key it could not find, which is usually enough to see the problem — a typo, a case difference, a channel that this run did not record. When a missing key is *expected*, `.get` returns `None` instead of raising, or a default you choose:

```python
>>> limits = {"ax": 12.5, "ay": 3.0}
>>> print(limits.get("roll_rate"))
None
>>> limits.get("roll_rate", 0.0)
0.0
```

Notice the `print` on that first line. Typing `limits.get("roll_rate")` alone at the prompt displays nothing at all, because the REPL does not echo `None` — a small trap worth knowing before it convinces you that a line did not run.

Choose deliberately between the two. `limits["ax"]` says "this key must be there, and if it is not, my assumptions are wrong and I want to know now". `limits.get("ax", 0.0)` says "its absence is normal". A default of `0.0` for a missing limit is a dangerous choice, because zero is a limit that everything violates; a default of `None` that you then check is usually safer.

::: key
`d[k]` raises `KeyError` when `k` is absent; `d.get(k)` returns `None` and `d.get(k, default)` returns your default. `in` tests keys, not values. A dictionary preserves insertion order (guaranteed since Python 3.7).
:::

## Keys must be hashable, which is why tuples exist

To find a key in constant time, a dictionary computes a number from it — a *hash* — and uses that number to go straight to the right place in memory. That only works if the key's value can never change, because an object that changed would hash to a different place and become unfindable. So Python allows only *immutable*, and therefore *hashable*, objects as keys: numbers, strings, tuples of those. A list cannot be a key:

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

`unhashable type: 'list'` is the message to recognise; it means you used something changeable where a fixed key was required. The tuple `(12, 500)` — seconds and milliseconds, say — is a perfectly good key. This is the concrete answer to "when do I need a tuple rather than a list": when the value has to be a dictionary key or a set member.

## Why a dictionary and not a list of pairs

You could keep limits as a list of `(name, value)` tuples and search it. The difference is what happens as the table grows. A dictionary computes one hash and looks in one place: the work does not depend on how many entries there are, which is written $O(1)$. Searching a list means comparing entries one at a time until you find the match, $O(n)$ — on average half the table, and the whole table when the answer is "not present".

With four channels, nobody can measure the difference. With ten thousand channels, and a lookup performed once per sample for a million samples, the list version does about five billion comparisons and the dictionary version does a million hashes. The rule is simple enough to apply without measuring: **if you are searching a list for a match on some field, you wanted a dictionary keyed by that field**.

::: example A limits table for a hot fire
The test procedure sets a limit per channel; the run reports a peak per channel. The check is a lookup, not a search.

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

Two of these deserve a second look. `peak.get("az", 0.0)` returns `0.0` because the `az` channel was not in this run's peaks at all — and that default is a lie that would sail through a limit check. If "not recorded" and "recorded as zero" mean different things, and in telemetry they always do, then the default must be `None` and the absence must be handled deliberately.

The single quotes inside `{limits['ax']}` are needed because the f-string itself is in double quotes. On Python 3.11 you cannot reuse the outer quote character inside the braces; on 3.12 and later you can, but writing it the 3.11 way works everywhere.
:::

## A dict of dicts

Values can be any object, including another dictionary, which is how you hold a small table of results:

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

`stats["ax"]["max"]` reads left to right: look up `ax` to get the inner dictionary, then look up `max` in that. This is exactly the shape the module's accelerometer exercise asks you to return, and it is worth noticing why: one lookup by axis name, then one by statistic name, with no searching anywhere.

## Sets: membership and comparison

A *set* holds unique, hashable values with no positions and no duplicates. Write one in braces without colons, or build one from any sequence:

```python
>>> in_file = {"ax", "ay", "az", "roll_rate", "gps_lat"}
>>> len(in_file)
5
>>> "ax" in in_file
True
>>> sorted(set(["ax", "ax", "ay"]))
['ax', 'ay']
```

Adding something already present changes nothing — that is the definition of a set, and it is what makes `set(sequence)` the shortest way to remove duplicates. `add` inserts, `discard` removes without complaining if it was not there, `remove` removes and raises `KeyError` if it was not.

The empty set has a quirk: `{}` is an empty **dictionary**, because dictionaries got the braces first. The empty set is `set()`.

```python
>>> type({})
<class 'dict'>
>>> set()
set()
```

Four operators compare two sets: `-` difference (in the left one only), `&` intersection (in both), `|` union (in either), `^` symmetric difference (in exactly one). These turn several awkward loops into one line each.

::: warning
A set has no order, and the order in which it displays is not even stable between runs of the same program: Python randomises string hashing at start-up as a security measure, so `{"ax", "ay"}` can print either way round on different runs. Never print a set directly in output that anyone compares — including a test's expected output. Print `sorted(s)`, which is a list, in a defined order, every time.
:::

::: example Channels in the file that the spec never mentioned
Before analysing a run, check that the file and the interface document agree about what is in it.

```python
# channel_audit.py
in_file = {"ax", "ay", "az", "roll_rate", "gps_lat"}
in_spec = {"ax", "ay", "az", "pitch_rate", "roll_rate"}

print(sorted(in_file - in_spec))   # ['gps_lat']
print(sorted(in_spec - in_file))   # ['pitch_rate']
print(sorted(in_file & in_spec))   # ['ax', 'ay', 'az', 'roll_rate']
print(len(in_file | in_spec))      # 6
```

Undocumented channels are in the first line; missing ones are in the second. Both matter, and they mean different things: an extra channel is usually a data-dictionary that is out of date, while a missing one means an analysis script is about to raise `KeyError` — or worse, `.get` its way to a default and report a number nobody measured.

Every result is wrapped in `sorted` so the output is the same on every run and on every machine. The union is only counted, not printed, because a count does not depend on order: five channels in the file, five in the spec, four in common, so $5 + 5 - 4 = 6$ distinct names between them.
:::

## Truthiness: what Python counts as true

Anything can be used where a true-or-false answer is wanted, and `bool(x)` shows you what the answer will be. The rule is short: **empty is false, zero is false, `None` is false, everything else is true**.

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

Read the second and fourth lines carefully. A list containing one zero is not empty, so it is true. A string containing the character zero is not empty, so it is true — which is why a field read from a file must be converted to a number before it is tested for anything.

The falsy values in full: `False`, `None`, zero of any numeric type (`0`, `0.0`), and every empty container (`""`, `[]`, `()`, `{}`, `set()`). This is what lets you write `not samples` for "no samples", and `samples or [0.0]` for "the samples, or a single zero if there are none" — `or` returns the first operand that is true, or the last one:

```python
>>> samples = []
>>> samples or [0.0]
[0.0]
>>> not samples
True
```

Lesson 5 puts this to work in `if`, where a condition is passed through `bool` automatically.

::: warning
The rule that zero is false is a trap for measured quantities. A rate of exactly `0.0` is a real measurement — a vehicle is not rotating — and it is falsy, so a test meaning "was a rate reported" gives the wrong answer for the one case where the answer matters most. Use `x is not None` when you are asking whether a value exists, and reserve truthiness for containers, where "empty" and "absent" mean the same thing.
:::

## Check yourself

::: check
`d = {"ax": 12.5, "ay": 3.0}`. What do `d["az"]`, `d.get("az")`, `d.get("az", 0.0)` and `"az" in d` each produce, and which would you use in a limit check?
:::

::: answer
`d["az"]` raises `KeyError: 'az'`. `d.get("az")` returns `None` — and at the prompt displays nothing at all. `d.get("az", 0.0)` returns `0.0`. `"az" in d` returns `False`. In a limit check use `d["az"]` and let it raise: a channel with no limit in the table means the table is incomplete, and a run that reports "pass" because a limit was silently defaulted is worse than a run that stops. The default form belongs where absence is genuinely normal — an optional configuration setting, say.
:::

::: check
You need to record the peak acceleration for each (stage, axis) pair, such as stage 1 axis `ax`. Give a key that works and one that does not, and say why.
:::

::: answer
A tuple works: `peaks[(1, "ax")] = 12.06`. A list does not: `peaks[[1, "ax"]]` raises `TypeError: unhashable type: 'list'`. The dictionary must compute a hash from the key and rely on it never changing; a list can be changed in place after it is used as a key, which would leave the entry unfindable, so Python refuses lists as keys outright. Any tuple of immutable values is fine.
:::

::: check
A script keeps 8,000 channel definitions as a list of `(name, unit, limit)` tuples and searches it for a name once per sample, for 2 million samples. Estimate the number of comparisons, and say what to change.
:::

::: answer
A linear search examines on average half the list for a name that is present — 4,000 comparisons — so 2 million lookups cost about $2 \times 10^{6} \times 4000 = 8 \times 10^{9}$ comparisons. Built once into a dictionary keyed by name, each lookup is one hash and one probe, so the cost is about 2 million operations plus the 8,000 to build the table: a factor of several thousand. Nothing about the data changed; only the container did.
:::

::: check
Why does `sorted(in_file - in_spec)` appear in the example instead of `print(in_file - in_spec)`, and when does it matter?
:::

::: answer
A set has no order, and its display order depends on hash values which Python randomises per process for strings. Printing the set directly gives output that can differ between two runs of the same script on the same data. It matters whenever the output is compared: a test with an expected string, a report diffed against yesterday's, a file whose checksum is recorded. `sorted` returns a list in a defined order, so the output is reproducible.
:::

::: check
A function receives `rate`, which is either a float or `None` when the sensor did not report. What is wrong with testing `not rate`, and what should it be?
:::

::: answer
`not rate` is true both when `rate` is `None` and when `rate` is `0.0`, because zero is falsy — so a genuine measurement of zero rotation is treated as a missing sensor. The test should be `rate is None`, which is true only for the absent case. This is the reason `is None` rather than truthiness is the idiom for optional values, and the reason the default value in a `.get` for a physical quantity should usually be `None` rather than `0.0`.
:::

## Summary

| Item | Statement |
| --- | --- |
| `dict` | `{"ax": 12.5}`; maps hashable keys to any values; insertion-ordered since 3.7 |
| Lookup | `d[k]` raises `KeyError`; `d.get(k)` gives `None`; `d.get(k, default)` gives your default |
| Membership | `k in d` tests keys, never values |
| Views | `.keys()`, `.values()`, `.items()`; `.items()` yields `(key, value)` tuples |
| Key requirement | Hashable, so immutable: numbers, strings, tuples. A list raises `TypeError: unhashable type: 'list'` |
| Complexity | dict lookup $O(1)$ average; scanning a list $O(n)$ |
| `set` | `{"ax", "ay"}`; unique, unordered, hashable members; empty set is `set()`, not `{}` |
| Set operators | `-` difference, `&` intersection, `\|` union, `^` in exactly one |
| Set display | Order is arbitrary and varies between runs; print `sorted(s)` |
| Mutability | `list`, `dict` and `set` are mutable; `str` and `tuple` are immutable, and only immutable values can be keys or set members |
| Falsy values | `False`, `None`, `0`, `0.0`, `""`, `[]`, `()`, `{}`, `set()`. Everything else is true |
| Optional values | Test `x is None`, not `not x`, because `0.0` is a real measurement |

You now have the four containers. The next lesson is what makes them worth having: `if` to choose, and `for` and `while` to visit every element of a list, every pair of a dictionary, and two sequences at once.
