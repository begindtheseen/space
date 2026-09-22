---
id: l02-numbers-text-and-f-strings
title: Numbers, text and f-strings
minutes: 18
covers:
  - int, float, bool, str; f-strings; str methods
---

Every value in Python has a *type*, and the type decides what the operations mean. `2 + 2` is arithmetic; `"2" + "2"` is joining two pieces of text and gives `"22"`. Neither is wrong — they are different operations that share a symbol, and knowing which one you have is most of what stops a beginner's program from producing a number that looks plausible and is not.

Four types carry almost everything in this module: `int` for whole numbers, `float` for measured quantities, `bool` for yes-or-no, and `str` for text. A GNC script lives on all four at once. A telemetry file is text; the timestamps and accelerations inside it are floats you must convert from that text; the sample counts and channel indices are ints; and the limit checks that decide whether a run passed are bools. The conversions between them are where the bugs are — a column read as text and then sorted alphabetically will put 100 before 99, and the report will be wrong without ever raising an error.

This lesson covers the four types, the arithmetic operators including the two kinds of division, the string methods that take a line of a data file apart, and f-strings, which are how you put numbers back together into a line a human reads. What it does not cover is why `0.1 + 0.2` is not `0.3`; that is lesson 12, and until then take on trust that floats are approximations.

## Asking what something is

The built-in function `type` answers directly, and the REPL is the place to ask:

```python
>>> type(3)
<class 'int'>
>>> type(3.0)
<class 'float'>
>>> type(True)
<class 'bool'>
>>> type("ACCEL_X")
<class 'str'>
```

`3` and `3.0` are different values of different types that happen to compare equal. The decimal point is the whole difference in how they are written and the whole difference in how they are stored.

## Integers are exact and unbounded

An `int` is a whole number held exactly, with as many digits as memory allows. There is no 32-bit or 64-bit limit and no overflow:

```python
>>> 2 ** 100
1267650600228229401496703205376
```

That is a genuine difference from C++, where an `int` wraps around silently at about two billion, and it is one reason counting things in Python is pleasant. Long digit strings can be broken up with underscores for readability — `1_000_000` is the integer one million, and the underscores are ignored.

Five arithmetic operators apply: `+`, `-`, `*`, `**` for powers, and two kinds of division.

- `/` is *true division* and always produces a `float`, even when it divides evenly: `4 / 2` is `2.0`.
- `//` is *floor division*: it divides and rounds **down**, towards negative infinity.
- `%` is the *remainder* left by floor division.

The rounding direction matters as soon as a negative number appears, and it surprises people who expect truncation towards zero:

```python
>>> 7 // 2
3
>>> -7 // 2
-4
>>> 7 % 2
1
>>> -7 % 2
1
```

`-7 // 2` is `-4`, not `-3`, because `-3.5` rounds down to `-4`. The remainder then has the sign of the *divisor*, not of the dividend, which is exactly what you want for angles: `-10 % 360` is `350`, so a single `%` wraps any angle into the range 0 to 360 without a special case for negatives.

::: key
`/` always gives a `float`. `//` floors towards minus infinity, so `-7 // 2` is `-4`. `%` takes the sign of the divisor, so `angle % 360` normalises an angle to 0–360 whatever its sign. Integers are exact and have no maximum.
:::

## Floats are the type of physical quantities

A `float` is a 64-bit IEEE 754 double: about sixteen significant decimal digits, covering magnitudes from around $10^{-308}$ to $10^{308}$. Every measured or computed physical quantity in this module is a float. Write them with a decimal point or in exponential notation, where `e` means "times ten to the":

```python
>>> 1e3
1000.0
>>> 6.674e-11
6.674e-11
```

Mixing an `int` and a `float` in one operation converts the `int` and gives a `float`. That is why `speed / rate` in lesson 1 gave `192.5` even though `7700` was written without a decimal point.

`round(x, n)` rounds to `n` decimal places, and to a whole number if `n` is omitted. Two things about it are worth knowing before they bite you:

```python
>>> round(0.5)
0
>>> round(1.5)
2
>>> round(2.5)
2
>>> round(2.675, 2)
2.67
```

The first three are *round half to even*, the IEEE 754 default: exact halves go to the nearest even value rather than always up, so that a long column of rounded numbers does not accumulate an upward bias. The fourth is different and more important: 2.675 is not exactly 2.675 in binary — it is stored a hair below — so it rounds down. `round` is for display, never for deciding whether two computed numbers agree. Lesson 12 gives you the tool for that.

::: warning
`round` returns a `float` when you give it a number of places, and a `float` you round is still a float: `round(0.1 + 0.2, 2)` is `0.3` for printing but is not a licence to compare with `==`. Never round as a way of fixing a comparison, and never round intermediate values in a calculation — round once, at the moment of display.
:::

## Booleans, comparisons, and the fact that `True` is 1

`bool` has two values, `True` and `False`, written with capitals. They come out of comparisons — `==`, `!=`, `<`, `<=`, `>`, `>=` — and combine with `and`, `or`, `not`:

```python
>>> 1 == 1.0
True
>>> 0.1 + 0.2 == 0.3
False
>>> 7700 > 7000 and 40 >= 40
True
```

The second line is not a typo, and it is the single most cited surprise in Python. It is a property of binary floating point, not of Python, and it has the same answer in C++ and MATLAB. Lesson 12 explains it and gives you `math.isclose`.

`bool` is a subtype of `int`: `True` behaves as 1 and `False` as 0 in arithmetic, so `True + True` is `2`. That is occasionally useful — summing a column of comparisons counts how many were true — and occasionally the explanation for a nonsensical number.

## Strings hold the text

A `str` is a sequence of characters, written between single or double quotes; the two are interchangeable, so you can put one kind inside the other without ceremony. A backslash starts an *escape*: `\n` is a newline, `\t` a tab, `\\` a single backslash, `\"` a quote. A string with an `r` in front is *raw* — backslashes in it stand for themselves, which is what you want for Windows paths and regular expressions:

```python
>>> "a\tb"
'a\tb'
>>> print("a\tb")
a	b
>>> r"C:\test\new"
'C:\\test\\new'
```

Look carefully at the difference between the first and second lines. The prompt shows `repr`, which writes the escape back as `\t` so you can see what is in the string; `print` shows `str`, and the tab becomes actual whitespace. Both are the same two-character-plus-tab string.

Strings are *sequences*, so they have a length, they can be indexed, and they can be sliced. Indices count from 0, and negative indices count back from the end, with `-1` the last character. A *slice* `s[a:b]` takes the characters from index `a` up to but not including `b`:

```python
>>> chan = "ACCEL_X"
>>> len(chan)
7
>>> chan[0]
'A'
>>> chan[-1]
'X'
>>> chan[:5]
'ACCEL'
>>> chan[6:]
'X'
```

The half-open convention — start included, end excluded — is everywhere in Python, and it has the useful property that `s[:n]` and `s[n:]` together make up the whole string with no overlap and nothing lost. Lesson 3 applies the same notation to lists.

`+` joins two strings and `*` repeats one, but neither will mix types for you:

```python
>>> "T+" + 5
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: can only concatenate str (not "int") to str
>>> "T+" + str(5)
'T+5'
```

That refusal is a feature. A language that silently turned 5 into `"5"` would also silently turn a velocity into text somewhere it mattered.

## The string methods that take a data line apart

A *method* is a function that belongs to a value and is called with a dot: `chan.lower()`. Strings are immutable — no method changes the string it is called on; each returns a new one. These are the methods you will use on nearly every file you read:

- `strip()` removes whitespace, including the trailing newline, from both ends. `lstrip()` and `rstrip()` do one end.
- `lower()` and `upper()` change case, which is how you compare channel names written inconsistently.
- `startswith(prefix)` and `endswith(suffix)` return a `bool`.
- `replace(old, new)` returns a copy with every occurrence replaced.
- `find(sub)` gives the index of the first occurrence, or `-1` if there is none; `count(sub)` counts them.
- `split(sep)` cuts the string at every `sep` and returns the pieces as a *list* — a numbered sequence of values, written in square brackets, which lesson 3 covers in full.
- `sep.join(pieces)` is the inverse: it glues a list of strings together with `sep` between them.

::: example One line of a channel table
A test stand writes a channel table as text. One line arrives with the newline still attached and spaces wherever the person who wrote the file felt like putting them:

```python
# channel_line.py
line = "  ACCEL_X , 9.81 , m/s^2 \n"

print(repr(line.strip()))                 # 'ACCEL_X , 9.81 , m/s^2'
parts = line.strip().split(",")
print(parts)                              # ['ACCEL_X ', ' 9.81 ', ' m/s^2']
print(repr(parts[0].strip()))             # 'ACCEL_X'
print(float(parts[1]))                    # 9.81
print(repr(parts[2].strip()))             # 'm/s^2'
```

Four things to take from this. `strip()` first, so the newline never reaches anything else. `split(",")` leaves the spaces that were next to the commas, so each piece still needs its own `strip()`. `repr` is used for the printing here on purpose — with `print(parts[0])` you could not see whether the trailing space had gone. And `float(parts[1])` does the conversion from text to number without complaint even with spaces around it, because `float` strips whitespace itself.

The value `9.81` is now a number you can compare and average. Until that conversion it was three characters, and `"9.81" > "10.2"` is `True` because text compares alphabetically, character by character: `'9'` comes after `'1'`.
:::

## f-strings put the numbers back together

An *f-string* is a string literal with an `f` before the opening quote. Anything inside braces is evaluated and inserted:

```python
>>> dt = 0.025
>>> f"timestep {dt} s"
'timestep 0.025 s'
```

After a colon inside the braces comes a *format specification* controlling width, precision and alignment. The ones worth memorising:

| Spec | Meaning | Example result |
| --- | --- | --- |
| `:.3f` | fixed point, 3 decimals | `7.654` |
| `:10.3f` | the same, right-aligned in 10 columns | `     7.654` |
| `:+.2f` | always show the sign | `+7.65` |
| `:.3e` | exponential, 3 decimals | `7.654e+00` |
| `:,.1f` | thousands separators | `1,234,567.9` |
| `:>10` | right-align text in 10 columns | `   ACCEL_X` |
| `:<10` | left-align text in 10 columns | `ACCEL_X   ` |
| `:^10` | centre text in 10 columns | `    AX    ` |

Two more pieces of syntax. `!r` inserts `repr` instead of `str`, which is how you make a log line show `'ax'` rather than `ax`. And `{dt=}` prints the expression and its value together, which is the fastest debugging print in the language:

```python
>>> dt = 0.025
>>> f"{dt=}"
'dt=0.025'
```

A literal brace is written by doubling it: `f"{{literal}}"` produces `{literal}`.

::: example A telemetry status line
One line per second on the console during a hot fire, aligned so that the columns can be read while they scroll:

```python
# status_line.py
t = 12.5        # s since ignition
alt = 1834.72   # m
speed = 312.4567  # m/s
q = 28447.3     # Pa, dynamic pressure

print(f"t={t:6.2f} s  alt={alt:9.1f} m  v={speed:7.2f} m/s  q={q/1000:6.2f} kPa")
# t= 12.50 s  alt=   1834.7 m  v= 312.46 m/s  q= 28.45 kPa
```

Every field has a fixed width, so the decimal points line up on every line and a number that jumps an order of magnitude cannot shove the rest of the line sideways. The widths are chosen from the physics: altitude needs five digits before the point to reach 99 km, dynamic pressure is divided by 1000 in the format expression itself because the natural unit at max-q is the kilopascal. Doing the unit conversion inside the f-string keeps the variable in SI everywhere else in the program, which is the right default — convert at the boundary, not in the middle.

Note what `f"{q/1000:6.2f}"` does with $28447.3/1000 = 28.4473$: it rounds to two places for display and leaves `q` untouched.
:::

## Converting, and what happens when you cannot

`int(x)`, `float(x)`, `str(x)` and `bool(x)` convert. `int` of a float *truncates towards zero* rather than rounding — `int(3.9)` is `3` and `int(-3.9)` is `-3` — which is a different rule from both `round` and `//`, and worth a moment's care. `int` of a string parses it, and refuses anything that is not a whole number:

```python
>>> int("9.81")
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ValueError: invalid literal for int() with base 10: '9.81'
>>> float("9.81")
9.81
```

That `ValueError` is the message you will see when a data file has a decimal point in a column you assumed was an integer, or a stray unit symbol in a numeric field. Read it as "the text I was given is not a whole number", and go and look at the text.

::: key
`int(3.9)` is `3` (truncation towards zero), `3 // 1` is `3` (floor), `round(3.9)` is `4` (nearest, ties to even). Three different rules; choose deliberately. `float("9.81")` parses text to a number and tolerates surrounding whitespace; `int("9.81")` raises `ValueError`.
:::

## Check yourself

::: check
A spacecraft's yaw command comes out of a controller as `-10.0` degrees and must be reported in the range 0 to 360. What single expression does it, and what would `int(-10.0 / 360) * 360` give instead?
:::

::: answer
`-10.0 % 360` gives `350.0`: the remainder takes the sign of the divisor, so one `%` normalises any angle, positive or negative, with no special cases. The alternative expression gives `0`, because `int` truncates `-0.0277…` towards zero, so nothing is subtracted and the answer is unchanged — it "works" for positive angles and silently does nothing for negative ones, which is the worst kind of bug.
:::

::: check
Explain each of these three results, in one sentence each: `7 // 2` is `3`, `-7 // 2` is `-4`, `int(-3.5)` is `-3`.
:::

::: answer
`7 // 2` is floor division of 3.5, which rounds down to 3. `-7 // 2` is floor division of `-3.5`, and rounding down from `-3.5` means going to `-4`, away from zero. `int(-3.5)` is not floor division at all; `int` truncates towards zero and discards the fractional part, giving `-3`. The three operations agree for positive numbers and disagree for negative ones, which is why a bug in a sign convention can survive a whole test campaign of positive test cases.
:::

::: check
You are given `raw = " 1013.25 hPa\n"` and need the number 1013.25 as a float. Write the expression, and say what goes wrong with `float(raw)`.
:::

::: answer
`float(raw.replace("hPa", "").strip())`, or equivalently `float(raw.split()[0])`, using `split()` with no argument to cut on whitespace and taking the first piece. `float(raw)` raises `ValueError: could not convert string to float: ' 1013.25 hPa\n'` — it tolerates surrounding whitespace but not trailing text, and there is no partial parse. The unit has to be removed deliberately, which is the right behaviour: a parser that silently ignored the letters would read `"1013.25 kPa"` as the same pressure.
:::

::: check
Write the f-string that prints a body rate of `-0.004712` rad/s as `rate = -0.0047 rad/s`, and another that prints it in degrees per second to two decimals with an explicit sign.
:::

::: answer
`f"rate = {w:.4f} rad/s"` where `w` is the value: four decimal places, and the minus sign appears because the number is negative. For degrees per second, convert inside the braces and ask for the sign with `+`:

```python
# rate_line.py
import math

w = -0.004712
print(f"rate = {w:.4f} rad/s")                     # rate = -0.0047 rad/s
print(f"rate = {math.degrees(w):+.2f} deg/s")      # rate = -0.27 deg/s
```

The `+` in the spec means "always print a sign", so a positive rate would show as `+0.27` and the column stays aligned whichever way the vehicle is turning.
:::

::: check
Why does `"9.81" > "10.2"` return `True`, and what is the general lesson for a column of numbers read from a file?
:::

::: answer
Both are strings, so Python compares them character by character in Unicode order. The first characters are `'9'` and `'1'`, and `'9'` comes after `'1'`, so the comparison ends there and returns `True`. The lesson is that every numeric column must be converted with `float` or `int` at the moment it is read, not later: text that looks like a number compares, sorts and "adds" (by joining) without ever raising an error, so nothing tells you the column was never a number at all.
:::

## Summary

| Item | Statement |
| --- | --- |
| `int` | Whole numbers, exact, unbounded; `1_000_000` is readable notation |
| `float` | 64-bit IEEE double, about 16 digits; every physical quantity |
| `bool` | `True` and `False`; a subtype of `int`, so `True + True` is `2` |
| `str` | Text; immutable; quotes interchangeable; `r"..."` disables escapes |
| `/` `//` `%` | True division (always `float`), floor division, remainder with the divisor's sign |
| `round(x, n)` | Nearest, ties to even; for display only |
| `int(x)` vs `//` | `int` truncates towards zero; `//` floors towards minus infinity |
| Indexing and slicing | `s[0]`, `s[-1]`, `s[a:b]` half-open: start included, end excluded |
| Core `str` methods | `strip`, `lower`, `upper`, `startswith`, `endswith`, `replace`, `find`, `count`, `split`, `join` |
| f-string | `f"{value:spec}"`; `:.3f`, `:8.2f`, `:+.2f`, `:.3e`, `:,`, `:>10`, `!r`, `{x=}` |
| Conversion failure | `int("9.81")` raises `ValueError`; `float("9.81")` is fine |

`split` handed back a list, and a list is the subject of the next lesson: how Python stores a sequence of samples, how slicing generalises to it, and why the difference between a list and a tuple decides whether a value can be a dictionary key.
