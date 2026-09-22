---
id: l01-python-basics
title: "Python from zero: values, names and control flow"
minutes: 20
covers:
  - Python syntax, control flow, functions, classes
---

A GNC engineer's day is full of small computations that are too tedious to do by hand and too specific for any off-the-shelf tool: the speed of a circular orbit at forty different altitudes, the propellant a burn will consume, the spread of landing points across ten thousand dispersed trajectories. Python is the language the aerospace world has settled on for this work. It reads almost like the mathematics it implements, it runs everywhere, and it carries the NumPy, SciPy and matplotlib libraries that the rest of this module is about.

Before the libraries, though, comes the language. This lesson assumes you have never programmed. By the end of it you will be able to store numbers under names, combine them with arithmetic, keep collections of them in lists, repeat a calculation with a loop, choose between alternatives with `if`, and print the results in a format a colleague could read. Everything else in the module is built from these pieces.

You will get far more from this lesson if you type each snippet yourself and run it. Reading code is not the same as running it; the interpreter is a patient tutor that answers instantly.

## Running Python

Python is an *interpreter*: a program that reads your statements and executes them one at a time. There are two ways to use it. Typing `python3` in a terminal opens the interactive prompt (the *REPL*, for read–evaluate–print loop), where each line you type is executed immediately and its value is shown. Alternatively, you save statements in a text file with a `.py` extension — a *script* — and run the whole file with `python3 myscript.py`.

Use the REPL to try things; use scripts for anything you want to keep. In a script nothing is displayed unless you ask for it with `print`, so most of the snippets in this lesson call `print` explicitly and show the resulting output in comments beginning with `#`. A `#` starts a comment anywhere on a line: the interpreter ignores the rest of the line, so comments are for the human reader.

```python
print("hello, orbit")   # hello, orbit
print(7 / 2)            # 3.5
```

## Numbers and arithmetic

Python has two kinds of numbers you will use constantly. An `int` is a whole number of unlimited size. A `float` is a real number stored in the IEEE-754 double-precision format, which carries about 15–16 significant decimal digits; we return to what that means in the floating-point lesson. Writing a decimal point or an exponent makes a float: `3.0`, `3.986e14` (which is $3.986 \times 10^{14}$) and `1e-3` are floats; `3` and `549054` are ints. You may put underscores inside a literal to group digits, so `6_378_137` is the same as `6378137`.

The operators are `+`, `-`, `*`, `/`, `**` for powers, `//` for floor division and `%` for the remainder. Two of these deserve care.

```python
print(7 / 2)      # 3.5     true division always gives a float
print(7 // 2)     # 3       floor division discards the remainder
print(7 % 2)      # 1       remainder
print(2 ** 10)    # 1024    power
print(2 ** 0.5)   # 1.4142135623730951
print(3 + 4.0)    # 7.0     int combined with float gives float
```

Precedence follows algebra: `**` binds tightest, then `*`, `/`, `//`, `%`, then `+` and `-`; use parentheses whenever there is any doubt. Note that `2 ** 3 ** 2` is `2 ** 9 = 512`, because powers associate to the right, while `(2 ** 3) ** 2` is `64`. The function `type(x)` tells you what kind of value `x` is, `round(x, 2)` rounds to two decimals, and `abs`, `min`, `max` and `sum` do what their names say.

## Names

A *variable* in Python is a name bound to a value with `=`. The name on the left receives the value of the expression on the right. Names are made of letters, digits and underscores, cannot start with a digit, and are case-sensitive. Choose them to say what the quantity is, and by convention write constants in capitals.

```python
MU_EARTH = 3.986e14          # m^3/s^2, gravitational parameter
R_EARTH = 6_378_137           # m, equatorial radius
r = R_EARTH + 400e3          # orbit radius, m
v = (MU_EARTH / r) ** 0.5    # circular speed, m/s
print(v)                     # 7668.553925574911
```

The single `=` is assignment, not a statement of equality. `r = r + 1` is legal and means "compute `r + 1`, then bind the name `r` to the result". A name can be rebound to a value of a different type at any time; Python does not make you declare types in advance, which is convenient and occasionally a source of bugs.

## Strings and f-strings

Text is a `str`, written between single or double quotes. Strings can be joined with `+`, measured with `len`, indexed with square brackets counting from zero, and sliced with a `start:stop` range that includes `start` and excludes `stop`.

```python
name = "Falcon 9"
print(len(name), name[0], name[-1], name[:6])   # 8 F 9 Falcon
print("mass: " + str(549054) + " kg")            # mass: 549054 kg
```

The modern way to build text from numbers is the *f-string*: put an `f` before the opening quote and write expressions inside braces. After a colon comes a *format specification* that controls the rendering. Learn these four, because every table you ever print will use them:

- `:.1f` — fixed notation with one decimal;
- `:.3e` — scientific notation with three decimals in the mantissa;
- `:,.0f` — thousands separators and no decimals;
- `:8.1f` — fixed notation, one decimal, right-aligned in a field eight characters wide (a `<` after the width would left-align).

```python
print(f"{v:.1f} m/s")        # 7668.6 m/s
print(f"{v:.3e}")            # 7.669e+03
print(f"{v/1000:.2f} km/s")  # 7.67 km/s
print(f"{r:,.0f} m")         # 6,778,137 m
print(f"{0.1234:.1%}")       # 12.3%
print(f"{'alt':>8}|{'v':>10}")   #      alt|         v
```

Strings also come with methods — functions attached to the value, called with a dot. `line.split(",")` breaks a comma-separated line into a list of pieces, `",".join(parts)` does the reverse, and `s.strip()` removes surrounding whitespace. These three do most of the work of reading telemetry files by hand.

```python
line = "12.5,7784.3,0.02"
parts = line.split(",")
print(parts, float(parts[1]))   # ['12.5', '7784.3', '0.02'] 7784.3
```

Notice `float(parts[1])`: the pieces are strings, and `float(...)` converts a string to a number. `int("42")` and `str(4.5)` convert the other ways.

## Booleans and comparisons

A comparison produces a `bool`, which is either `True` or `False`. The operators are `==` (equal), `!=` (not equal), `<`, `<=`, `>`, `>=`. They combine with `and`, `or` and `not`, and comparisons chain the way you would write them in mathematics: `7000 < v < 8000` is true when `v` lies strictly between those bounds.

```python
print(10 > 3, 10 == 3, 10 != 3, 3 <= 3)    # True False True True
print(True and False, True or False, not True)   # False True False
```

Empty things count as false when used in a condition: `bool([])`, `bool("")` and `bool(0.0)` are all `False`, while any non-empty container or non-zero number is `True`. Python also has a special value `None` that means "no value here"; test for it with `x is None`.

## Lists, tuples and dictionaries

A *list* is an ordered, changeable collection, written with square brackets. Indices start at 0, negative indices count from the end, and a slice `a[1:3]` gives the elements at positions 1 and 2. `append` adds to the end; `len` gives the length.

```python
alts_km = [200, 400, 800, 2000, 35786]
print(alts_km[0], alts_km[-1], alts_km[1:3], len(alts_km))   # 200 35786 [400, 800] 5
alts_km.append(1000)
print(alts_km)   # [200, 400, 800, 2000, 35786, 1000]
```

A *tuple* is like a list but cannot be changed after creation; it is written with parentheses. Tuples are the natural container for a fixed record such as a state vector, and they *unpack* into separate names in one line.

```python
state = (7000e3, 0.0, 0.0)
x, y, z = state
print(x)   # 7000000.0
```

A *dictionary* maps keys to values and is written with braces. Look values up by key, add a new key by assigning to it, and test membership with `in`.

```python
engine = {"name": "Merlin 1D", "thrust_kN": 845, "isp_s": 282}
print(engine["isp_s"])      # 282
engine["mass_kg"] = 470
print("isp_s" in engine, "mass" in engine)   # True False
```

::: warning Lists are shared, not copied
Assigning a list to a second name does not copy it; both names refer to the same object, so changing one changes "the other". Use `.copy()` when you want an independent list. This bites hardest when a function modifies a list it was handed.

```python
a = [1, 2, 3]
b = a
b.append(4)
print(a)          # [1, 2, 3, 4]   a changed too
c = a.copy()
c.append(5)
print(a, c)       # [1, 2, 3, 4] [1, 2, 3, 4, 5]
```
:::

## Control flow: `if`, `for`, `while`

Python marks structure with indentation instead of braces. A line ending in a colon opens a block; every statement indented beneath it (four spaces is the convention) belongs to the block; the block ends when the indentation returns. This is not cosmetic — inconsistent indentation is a syntax error, and a statement indented one level too few silently leaves the block.

An `if` statement runs a block when a condition is true. `elif` (else-if) tests further conditions in order, and `else` catches everything left.

```python
alt = 120e3
if alt > 100e3:
    print("space")
elif alt > 20e3:
    print("stratosphere")
else:
    print("troposphere")
# space
```

A `for` loop repeats a block once for each element of a collection. `range(n)` yields the integers `0, 1, …, n-1`; `range(start, stop, step)` counts from `start` up to but excluding `stop`. `enumerate` gives you the index alongside each element, and `zip` walks two collections in step.

```python
for i in range(3):
    print(i)             # 0  1  2 on separate lines
print(list(range(2, 11, 4)))   # [2, 6, 10]

for i, h in enumerate([200, 400]):
    print(i, h)          # 0 200  then  1 400

for h, v in zip([200, 400], [7784.3, 7668.6]):
    print(h, v)          # 200 7784.3  then  400 7668.6
```

A `while` loop repeats as long as its condition holds. Use it when you do not know in advance how many iterations are needed — stepping a simulation until the vehicle hits the ground, for instance.

```python
t = 0.0
h = 100.0
while h > 0:
    t += 0.5                          # t = t + 0.5
    h = 100.0 - 0.5 * 9.80665 * t**2
print(t, h)   # 5.0 -22.583124999999995
```

Inside any loop, `break` leaves it immediately and `continue` skips to the next iteration. Finally, a *list comprehension* builds a list from a loop in a single expression; it is the idiom you will see everywhere in Python code and a stepping stone to NumPy's vectorised thinking.

```python
squares = [k * k for k in range(1, 6)]
even = [k for k in range(10) if k % 2 == 0]
print(squares, even)   # [1, 4, 9, 16, 25] [0, 2, 4, 6, 8]
```

## The `math` module

Python's built-in arithmetic stops at powers. Square roots, trigonometric functions, logarithms and the constants $\pi$ and $e$ live in the standard library's `math` module, which you bring in with `import math` and then address with a dot. The trigonometric functions take angles in *radians*; `math.radians` and `math.degrees` convert. (If sine and cosine are hazy, all you need here is that $\sin\theta$ and $\cos\theta$ are the vertical and horizontal components of a unit-length arrow at angle $\theta$ from the horizontal; the trigonometry module treats them properly.)

```python
import math
print(math.pi, math.sqrt(2))                    # 3.141592653589793 1.4142135623730951
print(math.sin(math.radians(30)))               # 0.49999999999999994
print(math.degrees(math.atan2(1, 1)))           # 45.0
print(math.exp(1), math.log(math.e), math.log10(1000))   # 2.718281828459045 1.0 3.0
```

That `0.49999999999999994` is not a bug: it is the nearest float64 to $\sin 30°$ after $\pi/6$ has itself been rounded. The floating-point lesson explains exactly how big such errors are and when they matter.

::: example A table of circular-orbit speeds
The speed of a circular orbit of radius $r$ about a body with gravitational parameter $\mu$ is $v = \sqrt{\mu / r}$, with $\mu_\oplus = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$. Take a mean Earth radius of $6371\,\mathrm{km}$ and tabulate the speed at three altitudes. The loop converts each altitude from kilometres to metres, computes the radius, evaluates the formula and prints one formatted row.

```python
MU = 3.986e14        # m^3/s^2
R_MEAN = 6371e3      # m

for h_km in [200, 400, 800]:
    r = R_MEAN + h_km * 1e3
    v = (MU / r) ** 0.5
    print(f"{h_km:>5} km  {v:8.1f} m/s")
#   200 km    7788.5 m/s
#   400 km    7672.6 m/s
#   800 km    7455.5 m/s
```

Speed falls as altitude rises: higher orbits are slower, by about $0.3\,\mathrm{km/s}$ between $200$ and $800\,\mathrm{km}$. The `:>5` right-aligns the altitude in five characters and `:8.1f` gives the speed one decimal in an eight-character field, so the columns line up.
:::

::: example Rocket-equation table for a Falcon-9-sized vehicle
The ideal rocket equation gives the velocity change a stage can deliver: $\Delta v = I_{sp}\, g_0 \ln(m_0 / m_f)$, where $I_{sp}$ is specific impulse in seconds, $g_0 = 9.80665\,\mathrm{m/s^2}$ and $m_0$, $m_f$ are the initial and final masses. Take $I_{sp} = 311\,\mathrm{s}$ and $m_0 = 549{,}054\,\mathrm{kg}$ and tabulate $\Delta v$ against final mass.

```python
import math
g0 = 9.80665
isp = 311.0
m0 = 549_054.0
for mf in [400e3, 300e3, 200e3, 100e3, 25e3]:
    dv = isp * g0 * math.log(m0 / mf)
    print(f"{mf:>10.0f} kg  {dv:8.1f} m/s")
#     400000 kg     966.0 m/s
#     300000 kg    1843.4 m/s
#     200000 kg    3080.0 m/s
#     100000 kg    5194.0 m/s
#      25000 kg    9422.0 m/s
```

The logarithm is why the last row is so large: burning down to $25{,}000\,\mathrm{kg}$ means a mass ratio of about $22$, and $\ln 22 \approx 3.09$ multiplies $I_{sp} g_0 \approx 3050\,\mathrm{m/s}$ to give about $9.4\,\mathrm{km/s}$ — roughly the $\Delta v$ needed to reach low Earth orbit from the ground, once gravity and drag losses are added to the $7.7\,\mathrm{km/s}$ orbital speed.
:::

::: key
Indentation is syntax: a colon opens a block and the indented lines beneath it belong to the block. Four spaces per level, never mixed with tabs.
:::

::: key
`/` is true division and always gives a float; `//` is floor division; `%` is the remainder; `**` is a power. Mixing an int with a float gives a float.
:::

::: key
Sequences are indexed from 0, negative indices count from the end, and a slice `a[start:stop]` includes `start` and excludes `stop`. `range(n)` runs from `0` to `n-1`.
:::

::: key
An f-string `f"{x:.3f}"` formats a number in place; `.1f`, `.3e`, `,.0f` and a leading width such as `8.1f` cover almost every table you will print.
:::

::: warning `=` assigns, `==` compares
`if v = 7668:` is a syntax error — Python refuses it — but the reverse slip is silent: writing `v == 7668` on its own line compares and discards the result without assigning anything. Read a condition aloud as "is equal to" to remind yourself which one you meant.
:::

::: warning Off-by-one with `range`
`range(1, 10)` stops at 9, not 10. When a loop should include the endpoint, write `range(1, 11)` or, better, build the list of values you actually want and loop over that.
:::

::: note
Printing `0.1 + 0.2` gives `0.30000000000000004`, and `0.1 + 0.2 == 0.3` is `False`. This is not Python being wrong; it is what happens when decimals are stored in binary. The floating-point lesson explains it and shows how to compare computed values safely. For now, never test two computed floats for exact equality.
:::

## Check yourself

::: check
What do `7 // 2`, `7 % 2` and `7 / 2` evaluate to, and what type is each result?
:::

::: answer
`7 // 2` is `3` (an int: floor division keeps only the whole quotient). `7 % 2` is `1` (an int: the remainder). `7 / 2` is `3.5` (a float: true division always produces a float, even when the answer is a whole number — `8 / 2` gives `4.0`). The identity `7 // 2 * 2 + 7 % 2 == 7` holds for any pair of integers.
:::

::: check
The list `alts = [200, 400, 800, 2000]` is given. What are `alts[-1]`, `alts[1:3]` and `len(alts[1:])`?
:::

::: answer
`alts[-1]` is `2000`, the last element. `alts[1:3]` is `[400, 800]`: the slice starts at index 1 and stops before index 3. `alts[1:]` runs from index 1 to the end, `[400, 800, 2000]`, so its length is `3`.
:::

::: check
Write a loop that prints the numbers 1 to 5 together with their cubes, formatted as `k^3 = value` with the value right-aligned in five characters.
:::

::: answer
```python
for k in range(1, 6):
    print(f"{k}^3 = {k**3:>5}")
# 1^3 =     1
# 2^3 =     8
# 3^3 =    27
# 4^3 =    64
# 5^3 =   125
```

The `range(1, 6)` runs from 1 up to but not including 6. Alternatively `cubes = [k**3 for k in range(1, 6)]` builds the list of values in one line.
:::

::: check
Using $\Delta v = I_{sp} g_0 \ln(m_0/m_f)$, how much more $\Delta v$ does an engine with $I_{sp} = 348\,\mathrm{s}$ deliver than one with $I_{sp} = 311\,\mathrm{s}$ for the same mass ratio of $549{,}054 / 25{,}000$? Estimate first, then write the two-line Python that computes it.
:::

::: answer
$\Delta v$ is proportional to $I_{sp}$ for a fixed mass ratio, so the gain is $(348 - 311)\, g_0 \ln(21.96) = 37 \times 9.80665 \times 3.089 \approx 1121\,\mathrm{m/s}$.

```python
import math
ratio = math.log(549_054 / 25_000)
print((348 - 311) * 9.80665 * ratio)   # 1120.9 m/s (approximately)
```

The 311 s engine gives 9422.0 m/s and the 348 s engine 10543.0 m/s; the difference is about 1.12 km/s. That is the whole reason vacuum-optimised upper-stage engines chase specific impulse so hard.
:::

::: check
After running the following, what is printed, and why?

```python
a = [1.0, 2.0]
b = a
b.append(3.0)
print(len(a))
```
:::

::: answer
It prints `3`. The assignment `b = a` does not copy the list; both names refer to the same list object, so appending through `b` is visible through `a`. To get an independent copy write `b = a.copy()` (or `b = list(a)`), after which `a` would still have length 2.
:::

## Summary

| Construct | Syntax | Notes |
| --- | --- | --- |
| Numbers | `3`, `3.0`, `3.986e14`, `6_378_137` | int vs float; mixing gives float |
| Arithmetic | `+ - * / // % **` | `/` always float; `**` binds tightest |
| Assignment | `name = expression` | `==` compares; `=` binds a name |
| f-string | `f"{v:.1f} m/s"` | specs `.1f`, `.3e`, `,.0f`, width `8.1f` |
| List | `[200, 400]`, `a[0]`, `a[-1]`, `a[1:3]`, `.append` | mutable; zero-based; shared on `b = a` |
| Tuple | `(x, y, z)`; `x, y, z = state` | immutable; unpacks |
| Dict | `{"isp_s": 282}`, `d["isp_s"]`, `k in d` | key to value |
| `if` | `if c:` / `elif c2:` / `else:` | indentation defines the block |
| `for` | `for x in seq:`, `range(a, b, step)`, `enumerate`, `zip` | `range` excludes its stop |
| `while` | `while c:` with `break` / `continue` | unknown iteration count |
| Comprehension | `[f(x) for x in seq if cond]` | a loop in one expression |
| `math` | `math.sqrt`, `math.sin`, `math.radians`, `math.log`, `math.pi` | angles in radians |

The next lesson packages calculations like the two tables above into *functions* with names, arguments and docstrings, shows how Python reports errors and how to raise your own, and splits a project into modules you can import — the units of code that every later module of the curriculum ships as.
