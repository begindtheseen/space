---
id: l02-numbers-text-and-f-strings
title: Numbers, text and f-strings
minutes: 20
covers:
  - int, float, bool, str; f-strings; str methods
---

Put two coins on a table with two more coins and you have four coins. Put the sticker "2" next to another sticker "2" and you have a label that reads "22". Same symbol, different job. Python works the same way. Every value has a **type** — the kind of thing it is — and the type decides what an operation means. `2 + 2` is arithmetic and gives `4`. `"2" + "2"` joins two pieces of text and gives `"22"`. Neither is wrong. Knowing which one you have is most of what stops a program from producing a number that looks right and is not.

Four types carry almost everything in this module: `int` for whole numbers, `float` for measured quantities, `bool` for yes-or-no, and `str` for text. A GNC script uses all four at once. A telemetry file is text. The timestamps and accelerations inside it are floats you must convert from that text. The sample counts and channel numbers are ints. The limit checks that decide whether a test passed are bools.

The conversions between them are where the bugs hide. A column of numbers read as text and then sorted will put 100 before 99, and the report will be wrong without ever showing an error. This lesson covers the four types, the arithmetic operators (including two kinds of division), the text methods that take a line of a data file apart, and **f-strings**, which put numbers back together into a line a person can read. Why `0.1 + 0.2` is not `0.3` waits for lesson 12. Until then, take on trust that floats are close approximations.

## Asking what something is

The built-in function `type` tells you directly, and the REPL is the place to ask:

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

`3` and `3.0` are different values of different types that happen to compare equal. The decimal point is the whole difference in how they are written, and the whole difference in how they are stored.

## Integers are exact and unbounded

An **`int`** is a whole number, held exactly, with as many digits as memory allows. There is no top limit and no **[[overflow|int-overflow]]** — no point where the number is too big and goes wrong. `**` (read "star star") means "to the power of":

```python
>>> 2 ** 100
1267650600228229401496703205376
```

That is a real difference from C++, where a plain `int` stops at about two billion. Long numbers can be broken up with underscores so you can read them: `1_000_000` is one million, and Python ignores the underscores.

Python has these arithmetic operators: `+`, `-`, `*`, `**`, and three for dividing.

- `/` is **true division**. It always gives a `float`, even when the division comes out even: `4 / 2` is `2.0`.
- `//` (read "double slash") is **floor division**. It divides and then rounds **down** — toward minus infinity, not toward zero.
- `%` (read "percent", or "mod") is the **remainder** left over after floor division.

Think of sharing 7 cookies between 2 people: each gets `7 // 2 = 3`, and `7 % 2 = 1` is left over. The rounding direction starts to matter as soon as a negative number appears. It surprises people who expect Python to chop off the fraction:

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

`-7 // 2` is `-4`, not `-3`, because the exact answer is $-3.5$, and **[[rounding down from −3.5|floor-number-line]]** means moving left on the number line, to $-4$. The remainder then has the sign of the **divisor** (the number you divide by), not of the number being divided. Check: $2 \times (-4) + 1 = -7$. That is exactly what you want for angles. `-10 % 360` is `350`, so a single `%` wraps any angle into the range 0 to 360 with no special case for negatives.

::: key
`/` always gives a `float`. `//` floors towards minus infinity, so `-7 // 2` is `-4`. `%` takes the sign of the divisor, so `angle % 360` normalizes an angle to 0–360 whatever its sign. Integers are exact and have no maximum.
:::

## Floats are the type of physical quantities

A ruler never gives you an exact number. It gives you "about 12.3 cm". A **`float`** is Python's type for numbers like that. It is stored in a fixed 64 bits, following a standard called **[[IEEE 754|ieee-double]]**, which gives about sixteen significant digits. It covers sizes from about $10^{-308}$ up to about $10^{308}$. Every measured or computed physical quantity in this module is a float.

Write floats with a decimal point, or in exponential notation, where `e` means "times ten to the power":

```python
>>> 1e3
1000.0
>>> 6.674e-11
6.674e-11
```

`6.674e-11` is $6.674 \times 10^{-11}$, the gravitational constant in SI units. When you mix an `int` and a `float` in one operation, Python converts the `int` and gives a `float`. That is why `speed / rate` in lesson 1 gave `192.5`.

`round(x, n)` rounds `x` to `n` decimal places, or to a whole number if you leave out `n`. Two things about it are worth knowing before they bite:

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

The first three show **[[round half to even|half-to-even]]**, the IEEE 754 default. An exact half goes to the nearest *even* number instead of always up. That way a long column of rounded numbers does not drift upward.

The fourth is different, and more important. 2.675 cannot be stored exactly in binary. The stored number is a hair *below* 2.675, so it rounds down to 2.67. The lesson: `round` is for display. It is never the way to decide whether two computed numbers agree. Lesson 12 gives you the right tool for that.

::: warning
`round` gives back a `float` when you ask for decimal places, and a rounded float is still a float. `round(0.1 + 0.2, 2)` shows as `0.3`, but that is no license to compare with `==`. Never round to fix a comparison, and never round numbers halfway through a calculation. Round once, at the moment you display the result.
:::

## Booleans, comparisons, and the fact that `True` is 1

A **`bool`** is a light switch: it has exactly two values, `True` and `False`, written with capital letters. Bools come out of comparisons: `==` (read "equals equals" — "is equal to"), `!=` ("is not equal to"), `<`, `<=`, `>`, `>=`. You combine them with the words `and`, `or` and `not`:

```python
>>> 1 == 1.0
True
>>> 0.1 + 0.2 == 0.3
False
>>> 7700 > 7000 and 40 >= 40
True
```

The second line is not a typo. It is the most famous surprise in Python, and it happens in C++ and MATLAB too, because it is a property of binary floating point, not of any one language. Lesson 12 explains it and gives you `math.isclose`.

One more fact: `bool` is a special kind of `int`. `True` acts as 1 and `False` as 0 in arithmetic, so `True + True` is `2`. That is sometimes handy — adding up a list of comparisons counts how many were true — and sometimes the explanation for a number that makes no sense.

## Strings hold the text

A **`str`** (string) is a sequence of characters, like beads on a string. You write one between single or double quotes; either works, so you can put one kind inside the other.

A backslash `\` starts an **[[escape|escape-sequences]]** — a two-character code for a character you cannot easily type. `\n` is a new line, `\t` a tab, `\\` one real backslash, `\"` a quote mark. Put an `r` in front of the string and it becomes **raw**: backslashes stand for themselves. That is what you want for Windows paths and search patterns.

```python
>>> "a\tb"
'a\tb'
>>> print("a\tb")
a	b
>>> r"C:\test\new"
'C:\\test\\new'
```

Compare the first and second answers. The prompt shows `repr`, which writes the tab back as `\t` so you can see it. `print` shows `str`, and the tab becomes real blank space. Both are the same three-character string: `a`, a tab, `b`. In the third line, `repr` doubles each backslash to show it is a real backslash, not the start of an escape.

Because a string is a sequence, it has a length and you can pick characters out of it by position, called the **[[index|index-picture]]**. Indexes count from 0. Negative indexes count back from the end, so `-1` is the last character. A **slice** `s[a:b]` takes the characters from index `a` up to *but not including* `b`:

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

Leaving out a number means "from the start" or "to the end". This **half-open** rule — start included, end left out — is everywhere in Python. It has a tidy property: `s[:n]` and `s[n:]` together make up the whole string, with no overlap and nothing lost. Lesson 3 uses the same notation on lists.

`+` joins two strings and `*` repeats one. Neither will mix types for you:

```python
>>> "T+" + 5
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: can only concatenate str (not "int") to str
>>> "T+" + str(5)
'T+5'
```

That refusal is a feature. A language that quietly turned 5 into `"5"` would also quietly turn a velocity into text somewhere it mattered.

## The string methods that take a data line apart

A **method** is a function that belongs to a value. You call it with a dot: `chan.lower()`. Strings are **[[immutable|immutable-strings]]** — they can never be changed. No method alters the string it is called on; each one hands back a new string. These are the methods you will use on nearly every file you read:

- `strip()` removes blank space, including the newline at the end, from both ends. `lstrip()` and `rstrip()` do only the left or right end.
- `lower()` and `upper()` change case. That is how you compare channel names typed inconsistently.
- `startswith(prefix)` and `endswith(suffix)` return a `bool`.
- `replace(old, new)` returns a copy with every `old` replaced by `new`.
- `find(sub)` gives the index where `sub` first appears, or `-1` if it is not there. `count(sub)` counts how many times it appears.
- `split(sep)` cuts the string at every `sep` and returns the pieces as a **list** — a numbered sequence of values in square brackets, which lesson 3 covers in full. With no argument, `split()` cuts on any run of blank space.
- `sep.join(pieces)` does the opposite: it glues a list of strings together with `sep` between them.

::: example One line of a channel table
A test stand writes a table of channels as text. One line arrives with the newline still attached, and spaces wherever the person who wrote the file felt like putting them:

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

Walk through it one step at a time.

1. `strip()` comes first, so the newline never reaches anything else.
2. `split(",")` cuts at the commas, but leaves the spaces that sat beside them. So each piece still needs its own `strip()`.
3. The printing uses `repr` on purpose. With `print(parts[0])` you could not see whether the trailing space was gone.
4. `float(parts[1])` converts text to a number without complaint, even with spaces around it, because `float` strips blank space itself.

Now `9.81` is a number you can compare and average. Before that conversion it was four characters. Check what happens if you compare the text instead: `"9.81" > "10.2"` is `True`, because text is compared **[[character by character|character-codes]]**, and `'9'` comes after `'1'`.
:::

## f-strings put the numbers back together

An **f-string** is a string with the letter `f` in front of the opening quote. Anything inside curly braces `{}` is worked out and dropped into the text, like filling in the blanks on a form:

```python
>>> dt = 0.025
>>> f"timestep {dt} s"
'timestep 0.025 s'
```

After a colon inside the braces comes a **format specification** — instructions for width, number of decimals and alignment. The ones worth memorizing, shown on the number 7.654321 and on short channel names:

| Spec | Meaning | Example result |
| --- | --- | --- |
| `:.3f` | fixed point, 3 decimals | `7.654` |
| `:10.3f` | the same, right-aligned in 10 columns | `     7.654` |
| `:+.2f` | always show the sign | `+7.65` |
| `:.3e` | exponential, 3 decimals | `7.654e+00` |
| `:,.1f` | thousands separators | `1,234,567.9` |
| `:>10` | right-align text in 10 columns | `   ACCEL_X` |
| `:<10` | left-align text in 10 columns | `ACCEL_X   ` |
| `:^10` | center text in 10 columns | `    AX    ` |

Two more pieces of syntax. `!r` inserts `repr` instead of `str`, so a log line shows `'ax'` rather than `ax`. And `{dt=}` prints the expression's name and its value together, which is the fastest debugging print in the language:

```python
>>> dt = 0.025
>>> f"{dt=}"
'dt=0.025'
```

To get a real curly brace in an f-string, double it: `f"{{literal}}"` produces `{literal}`.

::: example A telemetry status line
During a test firing, the console shows one status line per second. The columns must line up so people can read them while they scroll past:

```python
# status_line.py
t = 12.5        # s since ignition
alt = 1834.72   # m
speed = 312.4567  # m/s
q = 28447.3     # Pa, dynamic pressure

print(f"t={t:6.2f} s  alt={alt:9.1f} m  v={speed:7.2f} m/s  q={q/1000:6.2f} kPa")
# t= 12.50 s  alt=   1834.7 m  v= 312.46 m/s  q= 28.45 kPa
```

Read each field in turn.

- `t:6.2f` writes 12.5 with two decimals, `12.50`, padded on the left to 6 characters.
- `alt:9.1f` writes 1834.72 with one decimal, `1834.7`, padded to 9 characters.
- `speed:7.2f` rounds 312.4567 to `312.46`, padded to 7.
- `q/1000:6.2f` first divides: $28447.3 / 1000 = 28.4473$. Then it rounds to two places, `28.45`.

Every field has a fixed width, so the decimal points line up on every line, and a number that grows by a digit cannot shove the rest of the line sideways. The widths come from the physics. The altitude field has room for five digits before the point, enough for 99 km. **[[Dynamic pressure|max-q]]** is divided by 1000 inside the braces, because near its peak the natural unit is the kilopascal.

Doing that division inside the f-string means `q` itself stays in pascals, in SI, everywhere else in the program. Sanity check: after the print, `q` is still `28447.3`. The rule is **[[convert at the boundary|convert-at-boundary]]**, not in the middle.
:::

## Converting, and what happens when you cannot

`int(x)`, `float(x)`, `str(x)` and `bool(x)` convert a value to that type. `int` of a float **truncates toward zero** — it chops off the fraction. So `int(3.9)` is `3` and `int(-3.9)` is `-3`. That is a different rule from both `round` and `//`, and worth a moment's care.

`int` of a string reads the text as a number, and refuses anything that is not a whole number:

```python
>>> int("9.81")
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ValueError: invalid literal for int() with base 10: '9.81'
>>> float("9.81")
9.81
```

That `ValueError` is what you will see when a data file has a decimal point in a column you assumed held whole numbers, or a stray unit symbol in a number field. Read it as "the text I was given is not a whole number", and go and look at the text.

::: key
`int(3.9)` is `3` (truncation towards zero), `3 // 1` is `3` (floor), `round(3.9)` is `4` (nearest, ties to even). Three different rules; choose deliberately. `float("9.81")` parses text to a number and tolerates surrounding whitespace; `int("9.81")` raises `ValueError`.
:::

## Check yourself

::: check
A spacecraft's yaw command comes out of a controller as `-10.0` degrees and must be reported in the range 0 to 360. What single expression does it? A colleague tries `angle - int(angle / 360) * 360` instead. What does the correction term `int(-10.0 / 360) * 360` give, and what does that do to the answer?
:::

::: answer
`-10.0 % 360` gives `350.0`. The remainder takes the sign of the divisor, so one `%` normalizes any angle, positive or negative, with no special cases.

The correction term gives `0`. $-10/360 = -0.0277\ldots$, and `int` truncates that toward zero, to 0; times 360 is still 0. So nothing is subtracted, and the colleague's answer stays at $-10$, outside the range. The expression "works" for positive angles and silently does nothing for negative ones, which is the worst kind of bug.
:::

::: check
Explain each of these three results in one sentence: `7 // 2` is `3`, `-7 // 2` is `-4`, `int(-3.5)` is `-3`.
:::

::: answer
`7 // 2` is floor division of 3.5, which rounds down to 3. `-7 // 2` is floor division of $-3.5$, and rounding *down* from $-3.5$ means going to $-4$, away from zero. `int(-3.5)` is not floor division at all: `int` truncates toward zero and drops the fraction, giving $-3$.

The three operations agree for positive numbers and disagree for negative ones. That is why a bug in a sign convention can survive a whole test campaign that only used positive test cases.
:::

::: check
You are given `raw = " 1013.25 hPa\n"` and need the number 1013.25 as a float. Write the expression, and say what goes wrong with `float(raw)`.
:::

::: answer
`float(raw.replace("hPa", "").strip())` works. So does `float(raw.split()[0])`, which uses `split()` with no argument to cut on blank space and takes the first piece.

`float(raw)` raises `ValueError: could not convert string to float: ' 1013.25 hPa\n'`. It forgives blank space around the number but not extra text, and it never reads "only the number part". The unit has to be removed on purpose. That is the right behavior: a reader that quietly ignored the letters would read `"1013.25 kPa"` as the same pressure, and it is ten times bigger.
:::

::: check
Write the f-string that prints a body rate of `-0.004712` rad/s as `rate = -0.0047 rad/s`, and another that prints it in degrees per second to two decimals, always with a sign.
:::

::: answer
With the value in `w`, `f"rate = {w:.4f} rad/s"` gives four decimal places. The minus sign appears because the number is negative. For degrees per second, convert inside the braces and ask for a sign with `+`:

```python
# rate_line.py
import math

w = -0.004712
print(f"rate = {w:.4f} rad/s")                     # rate = -0.0047 rad/s
print(f"rate = {math.degrees(w):+.2f} deg/s")      # rate = -0.27 deg/s
```

Sanity check: one radian is about 57.3 degrees, and $-0.004712 \times 57.3 \approx -0.270$. The `+` in the spec means "always print a sign", so a positive rate would show as `+0.27`, and the column stays lined up whichever way the vehicle is turning.
:::

::: check
Why does `"9.81" > "10.2"` return `True`, and what is the general lesson for a column of numbers read from a file?
:::

::: answer
Both are strings, so Python compares them character by character, using each character's code number. The first characters are `'9'` and `'1'`. `'9'` comes after `'1'`, so the comparison stops there and returns `True`.

The lesson: convert every number column with `float` or `int` at the moment you read it, not later. Text that looks like a number compares, sorts and "adds" (by joining) without ever raising an error, so nothing warns you that the column was never a number at all.
:::

## Summary

| Item | Statement |
| --- | --- |
| `int` | Whole numbers, exact, no maximum; `1_000_000` is readable notation |
| `float` | 64-bit IEEE double, about 16 digits; every physical quantity |
| `bool` | `True` and `False`; a kind of `int`, so `True + True` is `2` |
| `str` | Text; immutable; either quote works; `r"..."` turns off escapes |
| `/` `//` `%` | True division (always `float`), floor division, remainder with the divisor's sign |
| `round(x, n)` | Nearest, ties to even; for display only |
| `int(x)` vs `//` | `int` truncates toward zero; `//` floors toward minus infinity |
| Indexing and slicing | `s[0]`, `s[-1]`, `s[a:b]` half-open: start included, end excluded |
| Core `str` methods | `strip`, `lower`, `upper`, `startswith`, `endswith`, `replace`, `find`, `count`, `split`, `join` |
| f-string | `f"{value:spec}"`; `:.3f`, `:8.2f`, `:+.2f`, `:.3e`, `:,`, `:>10`, `!r`, `{x=}` |
| Conversion failure | `int("9.81")` raises `ValueError`; `float("9.81")` is fine |

`split` handed back a list, and lists are the next lesson: how Python stores a run of samples, how slicing works on them, and why the difference between a list and a tuple decides whether a value can be a dictionary key.

::: context int-overflow When a number runs out of room
In C++, a plain `int` usually has 32 bits and tops out at $2^{31} - 1 = 2{,}147{,}483{,}647$. Going past that is **undefined behavior** in C++ — the language promises nothing — and on most machines the value wraps round to a huge negative number. Python's `int` grows to fit instead.

The danger is real. On its first flight in 1996, Ariane 5 was lost about 40 seconds after liftoff when flight software converted a 64-bit floating-point value into a 16-bit integer that could not hold it. That conversion raised an error the software did not handle, both inertial reference computers shut down, and the rocket veered off course and broke up.
:::

::: context floor-number-line Floor versus truncate
Picture the number line. **Floor** (`//`) always moves left, to the next whole number at or below. **Truncate** (`int()`) always moves toward zero. For positive numbers they land in the same place. For negative numbers they split apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="60" y1="52" x2="60" y2="68"/><line x1="140" y1="52" x2="140" y2="68"/>
    <line x1="220" y1="52" x2="220" y2="68"/><line x1="300" y1="52" x2="300" y2="68"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="86">−4</text><text x="140" y="86">−3</text><text x="220" y="86">−2</text><text x="300" y="86">−1</text>
  </g>
  <circle cx="100" cy="60" r="5" fill="#1f2a44"/>
  <text x="100" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">−3.5</text>
  <path d="M100,50 Q80,28 62,46" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="60,50 60,40 67,45" fill="#b4232c"/>
  <text x="56" y="22" font-size="11" text-anchor="middle" fill="#b4232c">floor: −4</text>
  <path d="M100,50 Q120,28 138,46" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="140,50 140,40 133,45" fill="#1d6fd1"/>
  <text x="150" y="22" font-size="11" text-anchor="middle" fill="#1d6fd1">int(): −3</text>
  <text x="300" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">zero is off to the right →</text>
</svg>
```
:::

::: context ieee-double Inside a 64-bit float
A float is scientific notation in binary. Its 64 bits are split into three fields: 1 bit for the sign, 11 bits for the exponent (how far to shift the point), and 52 bits for the fraction (the digits). The 52 fraction bits, plus one hidden leading bit, give about 15 to 17 significant decimal digits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="5.3" height="30" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <rect x="15.3" y="30" width="58.4" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="73.7" y="30" width="276.3" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="12" y="22" font-size="11" fill="#b4232c">sign 1</text>
  <text x="44.5" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">exponent 11</text>
  <text x="211.8" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">fraction 52 bits</text>
  <text x="180" y="94" font-size="11" text-anchor="middle" fill="#6c7a93">64 bits in all · drawn to scale</text>
</svg>
```

Because the fraction has a fixed number of binary digits, most decimal fractions — 0.1, 2.675 — can only be stored as the nearest binary value. Lesson 12 opens this up.
:::

::: context half-to-even Why ties go to the even number
Round 0.5, 1.5, 2.5 and 3.5. Their true total is 8. If every half rounds up, you get $1 + 2 + 3 + 4 = 10$ — too big. If halves go to the nearest even number, you get $0 + 2 + 2 + 4 = 8$, because the ups and downs cancel. Over thousands of rounded samples, that stops a steady upward drift. It is also called "banker's rounding".
:::

::: context escape-sequences Why a backslash "escapes"
Some characters cannot be typed inside quotes directly: a new line would end the line of code, and a quote mark would end the string. The backslash tells Python "the next character is not what it looks like", letting it escape its normal meaning. That is also why a real backslash has to be written `\\` — and why raw strings exist for text full of them.
:::

::: context index-picture Two ways to count the same beads
Every character has two addresses: one counting from the front, starting at 0, and one counting from the back, starting at $-1$. A slice's numbers are best read as the gaps *between* characters: `chan[:5]` takes everything before gap 5.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="40" y="35" width="40" height="34"/><rect x="80" y="35" width="40" height="34"/>
    <rect x="120" y="35" width="40" height="34"/><rect x="160" y="35" width="40" height="34"/>
    <rect x="200" y="35" width="40" height="34"/><rect x="240" y="35" width="40" height="34" fill="#fff"/>
    <rect x="280" y="35" width="40" height="34" fill="#fff"/>
  </g>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="57">A</text><text x="100" y="57">C</text><text x="140" y="57">C</text><text x="180" y="57">E</text>
    <text x="220" y="57">L</text><text x="260" y="57">_</text><text x="300" y="57">X</text>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="60" y="26">0</text><text x="100" y="26">1</text><text x="140" y="26">2</text><text x="180" y="26">3</text>
    <text x="220" y="26">4</text><text x="260" y="26">5</text><text x="300" y="26">6</text>
  </g>
  <g font-size="11" fill="#b4232c" text-anchor="middle">
    <text x="60" y="86">−7</text><text x="100" y="86">−6</text><text x="140" y="86">−5</text><text x="180" y="86">−4</text>
    <text x="220" y="86">−3</text><text x="260" y="86">−2</text><text x="300" y="86">−1</text>
  </g>
  <line x1="240" y1="30" x2="240" y2="100" stroke="#1f2a44" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="140" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">chan[:5] = ACCEL</text>
</svg>
```
:::

::: context immutable-strings A string cannot be changed
"Immutable" means "cannot be changed". `chan.lower()` does not touch `chan`; it builds a brand-new string and hands it back. If you want to keep the result, give it a name: `chan = chan.lower()`. Trying to change one character, as in `chan[0] = "a"`, raises a `TypeError`. Lesson 3 meets the same idea again with tuples, and shows why it matters.
:::

::: context character-codes Every character is a number
Inside the computer each character is stored as a number, its Unicode **code point**. Python's `ord` shows it: `ord("1")` is 49 and `ord("9")` is 57. Comparing strings compares those numbers, one character at a time, stopping at the first difference. That is why `"9.81"` beats `"10.2"`: 57 is bigger than 49, and the rest never gets looked at.
:::

::: context max-q Dynamic pressure and max-q
**Dynamic pressure**, written $q$, measures how hard the air pushes on a moving vehicle: $q = \tfrac{1}{2}\rho v^2$, where $\rho$ is the air density and $v$ the speed. As a rocket climbs, it speeds up (so $q$ rises) while the air thins (so $q$ falls). The peak, **max-q**, is the moment of greatest aerodynamic stress. Launch commentators call it out, and some rockets throttle down briefly to get through it.
:::

::: context convert-at-boundary Why SI in the middle
In 1999 NASA lost the Mars Climate Orbiter. One piece of ground software reported thruster impulse in pound-force seconds, and the software that used it expected newton seconds, a factor of about 4.45 apart. The spacecraft flew too low into Mars's atmosphere. Keeping every value in SI inside the program, and converting only where data comes in or goes out, is the habit that prevents this kind of mix-up.
:::
