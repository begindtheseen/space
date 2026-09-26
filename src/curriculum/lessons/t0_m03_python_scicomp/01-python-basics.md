---
id: l01-python-basics
title: "Python from zero: values, names and control flow"
minutes: 22
covers:
  - Python syntax, control flow, functions, classes
---

A pocket calculator is fast, but it forgets everything when you clear it, and it cannot do the same sum forty times on its own. A recipe card remembers the steps, but it cannot cook. A programming language is both at once: a calculator that follows a written recipe as many times as you like, without tiring or slipping.

A GNC engineer's day is full of jobs like that: the speed of a circular orbit at forty heights, the propellant a burn will use, where ten thousand slightly different trajectories come down. **Python** is the language the aerospace world has settled on for this work. It reads almost like the mathematics it carries out, runs on every kind of computer, and comes with NumPy, SciPy and matplotlib — the libraries the rest of this module is about.

This lesson assumes you have never programmed. By the end you will be able to store numbers under names, do arithmetic with them, keep them in lists, repeat a calculation with a loop, choose between options with `if`, and print tidy results. Type each snippet yourself and run it: the computer answers instantly, and it is a very patient tutor.

## Running Python

Python is an **[[interpreter|interpreter-word]]** — a program that reads your instructions and carries them out one at a time. You can use it in two ways.

The first is the **interactive prompt**. Type `python3` in a **terminal** — the text window where you type commands — and you get a `>>>` prompt. Each line you type runs straight away, and its value is shown. Programmers call this the **[[REPL|repl-loop]]**, short for read–evaluate–print loop: it reads your line, works it out, prints the answer, and waits for the next one.

The second is a **script** — a plain text file of instructions with a name ending in `.py`. You run the whole file with `python3 myscript.py`.

Use the prompt to try things out and scripts for anything you want to keep. A script shows nothing unless you ask with `print`, so the snippets here call `print` and show what appears in a **comment**. A comment starts with `#`. Python ignores everything from the `#` to the end of the line, so comments are notes for the human reader.

```python
print("hello, orbit")   # hello, orbit
print(7 / 2)            # 3.5
```

## Numbers and arithmetic

Python has two kinds of number you will use all the time.

An **`int`** (short for integer) is a whole number of any size: `3`, `549054`, `-12`.

A **`float`** is a number that can have a fractional part, like `3.5`. The name comes from the "floating" decimal point. Python stores each float in a standard 64-bit format called **[[IEEE-754 double precision|float64-bits]]**, which carries about 15–16 significant decimal digits. The floating-point lesson later in this module explains exactly what that means.

Writing a decimal point or an exponent makes a float. `3.0` is a float. So is `3.986e14`, which you read as "3.986 times ten to the fourteen", $3.986 \times 10^{14}$. And `1e-3` is $10^{-3}$, one thousandth. Without a point or an `e`, `3` and `549054` are ints. You may put underscores inside a number to group the digits, the way you would put commas: `6_378_137` is the same as `6378137`.

The **operators** — the symbols that do arithmetic — are `+`, `-`, `*` (times), `/` (divide), `**` (read "to the power", so `2 ** 10` is $2^{10}$), `//` (read "floor divide") and `%` (read "mod", the remainder). Two of these need care.

Think of sharing 7 cookies between 2 friends. True division, `/`, says each gets 3.5 cookies. **Floor division**, `//`, says each gets 3 whole cookies, and `%` says 1 cookie is left over. Floor division rounds down, [[toward minus infinity|floor-negative]].

```python
print(7 / 2)      # 3.5     true division always gives a float
print(7 // 2)     # 3       floor division discards the remainder
print(7 % 2)      # 1       remainder
print(2 ** 10)    # 1024    power
print(2 ** 0.5)   # 1.4142135623730951
print(3 + 4.0)    # 7.0     int combined with float gives float
```

The last line shows a rule: mix an int with a float and you get a float.

### Which operation goes first

The order follows algebra: `**` first, then `*`, `/`, `//` and `%`, then `+` and `-`. Use parentheses whenever you have any doubt.

One surprise: powers group from the right. `2 ** 3 ** 2` means `2 ** (3 ** 2)`, which is `2 ** 9 = 512`. But `(2 ** 3) ** 2` is `8 ** 2 = 64`.

A few built-in helpers: `type(x)` tells you what kind of value `x` is, `round(x, 2)` rounds to two decimals, and `abs` (size without sign), `min`, `max` and `sum` do what their names say.

## Names

On a whiteboard you might write "$r$ = 6778 km" and then use $r$ in the next three formulas. Python does the same with names. A **variable** is a name attached to a value with `=`: Python works out the right-hand side, then attaches the name on the left to the result. Names are made of letters, digits and underscores. They cannot start with a digit, and capital letters count as different letters (`R` and `r` are two different names). Choose names that say what the quantity is. By habit, programmers write constants — values that never change — in capitals.

```python
MU_EARTH = 3.986e14          # m^3/s^2, gravitational parameter
R_EARTH = 6_378_137           # m, equatorial radius
r = R_EARTH + 400e3          # orbit radius, m
v = (MU_EARTH / r) ** 0.5    # circular speed, m/s
print(v)                     # 7668.553925574911
```

Here `MU_EARTH` is Earth's **[[gravitational parameter|mu-gm]]** $\mu$ (the Greek letter "mu"), the number that sets how hard Earth's gravity pulls. The last line works out $v = \sqrt{\mu / r}$, the speed of a circular orbit $400\,\mathrm{km}$ up: about $7.67\,\mathrm{km/s}$. Raising to the power `0.5` is the same as taking a square root.

The single `=` means "attach this name", not "these are equal". So `r = r + 1` is legal: work out `r + 1`, then attach `r` to the new value. A name can later be attached to a different kind of value altogether, because Python does not make you declare types in advance — handy, and now and then a source of bugs.

## Strings and f-strings

Text in Python is a **`str`** (string, as in a string of letters), written between single or double quotes. You can join strings with `+` and measure them with `len`.

You can also pick out pieces by position. Square brackets give one character, counting from **[[zero|zero-index]]**. A **slice**, written `start:stop`, gives a run of characters: it includes `start` and stops right before `stop`.

```python
name = "Falcon 9"
print(len(name), name[0], name[-1], name[:6])   # 8 F 9 Falcon
print("mass: " + str(549054) + " kg")            # mass: 549054 kg
```

`name[-1]` is the last character. `name[:6]` leaves out the start, so it begins at 0 and stops before position 6.

### Formatting numbers

A raw float such as `7668.553925574911` is too long for a table. The neat way to put a number into text is the **f-string**: an `f` before the opening quote, and any expression inside curly braces. After a colon inside the braces comes a **format specification** — a short code for how the number should look. Learn these four; every table you print will use them:

- `:.1f` — fixed-point, one digit after the decimal point;
- `:.3e` — scientific notation, with three digits after the point in the **[[mantissa|mantissa-exponent]]** (the number in front of the power of ten);
- `:,.0f` — commas between thousands, no decimals;
- `:8.1f` — fixed-point with one decimal, pushed to the right of a space eight characters wide (a `<` before the width would push it left instead).

```python
print(f"{v:.1f} m/s")        # 7668.6 m/s
print(f"{v:.3e}")            # 7.669e+03
print(f"{v/1000:.2f} km/s")  # 7.67 km/s
print(f"{r:,.0f} m")         # 6,778,137 m
print(f"{0.1234:.1%}")       # 12.3%
print(f"{'alt':>8}|{'v':>10}")   #      alt|         v
```

Read `7.669e+03` as $7.669 \times 10^{3}$. The `%` spec multiplies by 100 and adds a percent sign, and `>8` right-aligns text in eight characters to line up column headings.

### Taking text apart

Strings come with **methods** — functions attached to the value, called with a dot. Three do most of the work of reading **telemetry** files (the data a vehicle radios home) by hand. `line.split(",")` breaks a comma-separated line into a list of pieces. `",".join(parts)` glues pieces back together. And `s.strip()` trims spaces and line breaks off both ends.

```python
line = "12.5,7784.3,0.02"
parts = line.split(",")
print(parts, float(parts[1]))   # ['12.5', '7784.3', '0.02'] 7784.3
```

The pieces are still text; `float(...)` turns text into a number, and `int("42")` and `str(4.5)` convert the other ways.

## Booleans and comparisons

A yes-or-no question gets a **`bool`** (boolean) answer: `True` or `False`. Comparisons ask the questions. `==` (read "is equal to") asks whether two things are equal. `!=` asks "is not equal to". Then there are `<`, `<=`, `>` and `>=`. You combine answers with `and`, `or` and `not`. Comparisons also chain the way you write them in math: `7000 < v < 8000` is true when `v` lies strictly between those two numbers.

```python
print(10 > 3, 10 == 3, 10 != 3, 3 <= 3)    # True False True True
print(True and False, True or False, not True)   # False True False
```

Empty things count as false inside a condition: `bool([])`, `bool("")` and `bool(0.0)` are all `False`. Anything non-empty or non-zero counts as `True`.

Python also has a special value, `None`, which means "nothing here". Test for it with `x is None`.

## Lists, tuples and dictionaries

One number is one water bottle; soon you need a backpack of them. Python has three everyday containers.

### Lists

A **list** is an ordered row of values that you can change, written with square brackets. Positions count from 0; negative positions count from the end. A slice `a[1:3]` gives the items at positions 1 and 2. `append` adds an item to the end, and `len` gives the number of items.

```python
alts_km = [200, 400, 800, 2000, 35786]
print(alts_km[0], alts_km[-1], alts_km[1:3], len(alts_km))   # 200 35786 [400, 800] 5
alts_km.append(1000)
print(alts_km)   # [200, 400, 800, 2000, 35786, 1000]
```

### Tuples

A **tuple** is like a list that is sealed once made: you cannot change it. Write it with parentheses. Tuples are the natural box for a fixed record, such as the position part of a spacecraft's **[[state vector|state-vector]]**. They also **unpack**: one line hands each item its own name.

```python
state = (7000e3, 0.0, 0.0)
x, y, z = state
print(x)   # 7000000.0
```

### Dictionaries

A **dictionary** works like a real one: look up a word (the **key**) and get its meaning (the **value**). Write it with curly braces, as `key: value` pairs. Look up with the key in square brackets, add a pair by assigning to a new key, and ask whether a key is there with `in`.

```python
engine = {"name": "Merlin 1D", "thrust_kN": 845, "isp_s": 282}
print(engine["isp_s"])      # 282
engine["mass_kg"] = 470
print("isp_s" in engine, "mass" in engine)   # True False
```

The key `"isp_s"` holds the engine's **[[specific impulse|specific-impulse]]**, a measure of how much push it gets from each kilogram of propellant.

::: warning Lists are shared, not copied
Giving a list a second name does not copy it. Both names point at the *same* list, like two labels stuck on one box. So changing it through one name changes what you see through the other. Use `.copy()` when you want a separate list. This bites hardest when a function changes a list it was handed.

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

So far every line runs once, top to bottom. **Control flow** is how a program makes choices and repeats itself. First, though, how does Python know which lines belong together? Many languages use curly braces. Python uses **indentation** — the spaces at the start of a line. A line ending in a colon opens a **block**. Every line indented beneath it (four spaces is the custom) belongs to that block. The block ends when the indentation goes back out.

This is not decoration. Inconsistent indentation is an error, and a line indented one level too little quietly falls out of the block while the program still runs — wrongly.

### Choosing: `if`

An `if` statement runs its block only when a condition is true. `elif` (short for "else if") tests more conditions, in order. `else` catches everything left over. Only the first block whose condition is true runs.

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

The altitude, $120\,\mathrm{km}$, is above $100\,\mathrm{km}$, so the first block runs and the rest are skipped.

### Repeating a known number of times: `for`

A `for` loop runs its block once for each item in a collection, attaching a name to the current item.

`range(n)` supplies the $n$ whole numbers `0, 1, …, n-1`. `range(start, stop, step)` counts from `start` in jumps of `step`, stopping *before* `stop`. `enumerate` hands you each item's position along with the item, and `zip` walks two collections side by side.

```python
for i in range(3):
    print(i)             # 0  1  2 on separate lines
print(list(range(2, 11, 4)))   # [2, 6, 10]

for i, h in enumerate([200, 400]):
    print(i, h)          # 0 200  then  1 400

for h, v in zip([200, 400], [7784.3, 7668.6]):
    print(h, v)          # 200 7784.3  then  400 7668.6
```

`range(2, 11, 4)` starts at 2 and adds 4 each time: 2, 6, 10. The next, 14, is past the stop.

### Repeating until something happens: `while`

A `while` loop repeats as long as its condition stays true. Use it when you do not know in advance how many rounds you need — stepping a simulation until the vehicle lands, say.

Here a ball is dropped from $100\,\mathrm{m}$. Its height after $t$ seconds of falling is $h = 100 - \tfrac{1}{2} g_0 t^2$, where $g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity. The loop moves the clock forward half a second at a time until the height is no longer above zero.

```python
t = 0.0
h = 100.0
while h > 0:
    t += 0.5                          # t = t + 0.5
    h = 100.0 - 0.5 * 9.80665 * t**2
print(t, h)   # 5.0 -22.583124999999995
```

At $t = 4.5\,\mathrm{s}$ the height is still about $0.7\,\mathrm{m}$, so the loop goes round once more. At $t = 5\,\mathrm{s}$ it is about $-22.6\,\mathrm{m}$: the ball landed during that last half second, and the loop stops. A smaller step would pin down the landing time more tightly.

Inside any loop, `break` jumps out of it at once, and `continue` skips straight to the next round.

### A loop in one line: comprehensions

A **list comprehension** builds a list from a loop in one expression. Read `[k * k for k in range(1, 6)]` aloud as "k times k, for each k from 1 to 5". It is everywhere in Python, and a first step toward NumPy's whole-array thinking.

```python
squares = [k * k for k in range(1, 6)]
even = [k for k in range(10) if k % 2 == 0]
print(squares, even)   # [1, 4, 9, 16, 25] [0, 2, 4, 6, 8]
```

The second has a filter at the end: keep `k` only if dividing by 2 leaves no remainder — the even numbers.

## The `math` module

Built-in arithmetic stops at powers. Square roots, sines, logarithms and the constants $\pi$ and $e$ live in a toolbox called the `math` **module**, part of Python's standard library. Open it with `import math`, then reach each tool with a dot: `math.sqrt`, `math.sin`.

The trigonometric functions take angles in **[[radians|radians-why]]**, not degrees. `math.radians` converts degrees to radians, and `math.degrees` converts back. (If sine and cosine are hazy: $\sin\theta$ and $\cos\theta$ are the upright and sideways parts of an arrow one unit long, tilted at angle $\theta$ from the horizontal. The trigonometry module treats them properly.)

```python
import math
print(math.pi, math.sqrt(2))                    # 3.141592653589793 1.4142135623730951
print(math.sin(math.radians(30)))               # 0.49999999999999994
print(math.degrees(math.atan2(1, 1)))           # 45.0
print(math.exp(1), math.log(math.e), math.log10(1000))   # 2.718281828459045 1.0 3.0
```

$\sin 30^\circ$ is exactly $0.5$, so why `0.49999999999999994`? Not a bug: the computer first rounds $\pi/6$ to the nearest number it can store, and the sine of that slightly-off angle rounds to this. The error is in the seventeenth digit; the floating-point lesson shows when such errors matter.

Notice also that `math.log` is the natural logarithm, $\ln$, `math.log10` is the base-ten one, and `math.atan2(1, 1)` is the angle of an arrow pointing at the point $(1, 1)$.

::: example A table of circular-orbit speeds
The speed of a circular orbit of radius $r$ around a body with gravitational parameter $\mu$ is

$$
v = \sqrt{\frac{\mu}{r}}, \qquad \mu_\oplus = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}.
$$

($\mu_\oplus$, read "mu Earth"; $\oplus$ is the astronomers' symbol for Earth.) Take a mean Earth radius of $6371\,\mathrm{km}$ and tabulate the speed at three altitudes.

For each altitude the loop converts kilometers to meters, adds Earth's radius to get the distance from Earth's center, evaluates the formula, and prints one neat row.

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

Check the first row by hand: $r = 6371 + 200 = 6571\,\mathrm{km} = 6.571 \times 10^{6}\,\mathrm{m}$, and $\sqrt{3.986 \times 10^{14} / 6.571 \times 10^{6}} = \sqrt{6.066 \times 10^{7}} \approx 7788\,\mathrm{m/s}$. It matches.

Does the trend make sense? Higher orbits are slower, by about $0.3\,\mathrm{km/s}$ between $200$ and $800\,\mathrm{km}$. That fits: gravity is weaker farther out, so less speed is needed to keep falling around the Earth. The `:>5` and `:8.1f` specs give each column a fixed width, so the columns line up.
:::

::: example Rocket-equation table for a Falcon-9-sized vehicle
The ideal rocket equation gives the change in speed a stage can deliver:

$$
\Delta v = I_{sp}\, g_0 \ln\frac{m_0}{m_f}.
$$

Read $\Delta v$ as "delta v", the change in velocity. $I_{sp}$ ("I sub s p") is the specific impulse in seconds, $g_0 = 9.80665\,\mathrm{m/s^2}$, and $m_0$ and $m_f$ are the starting and final masses. Take $I_{sp} = 311\,\mathrm{s}$ and $m_0 = 549{,}054\,\mathrm{kg}$ and tabulate $\Delta v$ for several final masses.

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

Check the last row step by step. The mass ratio is $549{,}054 / 25{,}000 \approx 22.0$. Its natural logarithm is $\ln 22.0 \approx 3.09$. The front factor is $I_{sp} g_0 = 311 \times 9.80665 \approx 3050\,\mathrm{m/s}$. Multiply: $3050 \times 3.09 \approx 9420\,\mathrm{m/s}$, about $9.4\,\mathrm{km/s}$.

That is roughly the $\Delta v$ needed to reach low Earth orbit from the ground: the $7.7\,\mathrm{km/s}$ orbital speed plus the gravity and drag losses on the way up. The logarithm makes the rows grow unevenly: halving the final mass from $200$ to $100$ tonnes adds about $2.1\,\mathrm{km/s}$, and every further halving adds the same again.
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
`if v = 7668:` is a syntax error — Python refuses to run it. The reverse slip is silent: `v == 7668` on a line by itself asks the question, throws the answer away, and attaches nothing. Read `==` aloud as "is equal to" to keep the two apart.
:::

::: warning Off-by-one with `range`
`range(1, 10)` stops at 9, not 10. When a loop should include the endpoint, write `range(1, 11)` or, better, build the list of values you actually want and loop over that.
:::

::: note Why 0.1 + 0.2 is not 0.3
Printing `0.1 + 0.2` gives `0.30000000000000004`, and `0.1 + 0.2 == 0.3` is `False`. Python is not wrong: in binary, $0.1$ never ends — like $\tfrac{1}{3} = 0.333\ldots$ in decimal — so it must be rounded. The floating-point lesson shows how to compare computed values safely. For now, never test two computed floats for exact equality.
:::

## Check yourself

::: check
What do `7 // 2`, `7 % 2` and `7 / 2` evaluate to, and what type is each result?
:::

::: answer
`7 // 2` is `3`, an int: floor division keeps only the whole number of times 2 fits into 7.

`7 % 2` is `1`, an int: the remainder.

`7 / 2` is `3.5`, a float: true division always gives a float, even when the answer is a whole number — `8 / 2` gives `4.0`.

The three fit together: `7 // 2 * 2 + 7 % 2 == 7`, because $3 \times 2 + 1 = 7$. That identity holds for any pair of integers, as long as you are not dividing by zero.
:::

::: check
The list `alts = [200, 400, 800, 2000]` is given. What are `alts[-1]`, `alts[1:3]` and `len(alts[1:])`?
:::

::: answer
`alts[-1]` is `2000`, the last item.

`alts[1:3]` is `[400, 800]`: the slice starts at position 1 and stops before position 3.

`alts[1:]` runs from position 1 to the end, `[400, 800, 2000]`. That is three items, so its length is `3`.
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

`range(1, 6)` gives 1, 2, 3, 4, 5 — up to but not including 6. The `:>5` pushes each cube to the right of a five-character space.
:::

::: check
Using $\Delta v = I_{sp} g_0 \ln(m_0/m_f)$, how much more $\Delta v$ does an engine with $I_{sp} = 348\,\mathrm{s}$ deliver than one with $I_{sp} = 311\,\mathrm{s}$, for the same mass ratio of $549{,}054 / 25{,}000$? Estimate first, then write the Python that computes it.
:::

::: answer
For a fixed mass ratio, $\Delta v$ is proportional to $I_{sp}$, so the gain comes only from the extra $348 - 311 = 37\,\mathrm{s}$:

$$
37 \times 9.80665 \times \ln(21.96) = 37 \times 9.80665 \times 3.089 \approx 1121\,\mathrm{m/s}.
$$

```python
import math
ratio = math.log(549_054 / 25_000)
print((348 - 311) * 9.80665 * ratio)   # 1120.947912039261
```

The 311 s engine gives $9422.0\,\mathrm{m/s}$ and the 348 s engine $10{,}543.0\,\mathrm{m/s}$: about $1.12\,\mathrm{km/s}$ more from the same propellant. That is why vacuum upper-stage engines chase specific impulse so hard.
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
It prints `3`. The line `b = a` does not copy the list; it sticks a second label on the same list, so adding an item through `b` shows up through `a` too. With `b = a.copy()` (or `b = list(a)`) instead, `a` would still have length 2.
:::

## Summary

| Construct | Syntax | Notes |
| --- | --- | --- |
| Numbers | `3`, `3.0`, `3.986e14`, `6_378_137` | int vs float; mixing gives float |
| Arithmetic | `+ - * / // % **` | `/` always float; `**` binds tightest |
| Assignment | `name = expression` | `==` compares; `=` binds a name |
| f-string | `f"{v:.1f} m/s"` | specs `.1f`, `.3e`, `,.0f`, width `8.1f` |
| List | `[200, 400]`, `a[0]`, `a[-1]`, `a[1:3]`, `.append` | changeable; zero-based; shared on `b = a` |
| Tuple | `(x, y, z)`; `x, y, z = state` | sealed; unpacks |
| Dict | `{"isp_s": 282}`, `d["isp_s"]`, `k in d` | key to value |
| `if` | `if c:` / `elif c2:` / `else:` | indentation defines the block |
| `for` | `for x in seq:`, `range(a, b, step)`, `enumerate`, `zip` | `range` excludes its stop |
| `while` | `while c:` with `break` / `continue` | unknown number of rounds |
| Comprehension | `[f(x) for x in seq if cond]` | a loop in one expression |
| `math` | `math.sqrt`, `math.sin`, `math.radians`, `math.log`, `math.pi` | angles in radians |

The next lesson packages calculations like the two tables above into **functions**, with names, inputs and built-in instructions. It shows how Python reports errors and how to raise your own, and it splits a project into modules you can import — the units of code that every later module of the course ships as.

::: context interpreter-word Interpreters and compilers
There are two broad ways to run a program. A **compiler** translates the whole program into the computer's own machine code first, then you run the translation — C, C++ and Fortran work like this. An **interpreter** reads your program and carries it out as it goes. Python is interpreted, which is why you can type one line and see the answer at once. The price is speed: the interpreter does extra bookkeeping on every step. Later in this module you will see how NumPy gets the speed back by handing the heavy loops to compiled code.
:::

::: context repl-loop The loop behind the prompt
The prompt goes round the same four steps for as long as you keep typing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="95" height="40" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="57.5" y="45" font-size="13" text-anchor="middle" fill="#1f2a44">Read</text>
  <rect x="132.5" y="20" width="95" height="40" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="45" font-size="13" text-anchor="middle" fill="#1f2a44">Evaluate</text>
  <rect x="255" y="20" width="95" height="40" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="302.5" y="45" font-size="13" text-anchor="middle" fill="#1f2a44">Print</text>
  <line x1="105" y1="40" x2="126" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="132,40 124,36 124,44" fill="#1f2a44"/>
  <line x1="227.5" y1="40" x2="249" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="255,40 247,36 247,44" fill="#1f2a44"/>
  <path d="M302.5,60 L302.5,95 L57.5,95 L57.5,66" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="57.5,60 53.5,68 61.5,68" fill="#b4232c"/>
  <text x="180" y="115" font-size="12" text-anchor="middle" fill="#b4232c">Loop: wait for your next line</text>
</svg>
```

Read takes in the line you typed, evaluate works out its value, print shows it, and the loop goes back to waiting. The same name is used for the prompts of many other languages.
:::

::: context float64-bits Where the 15–16 digits come from
A float64 is 64 binary digits (bits), split into three fields: one for the sign, eleven for the power of two, and fifty-two for the digits of the number itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="5" height="30" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <rect x="25" y="40" width="55" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="80" y="40" width="260" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <line x1="22.5" y1="40" x2="22.5" y2="24" stroke="#b4232c" stroke-width="1.5"/>
  <text x="14" y="18" font-size="11" fill="#b4232c">sign: 1 bit</text>
  <text x="52.5" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">exponent: 11</text>
  <text x="210" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">fraction: 52 bits</text>
  <text x="180" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">64 bits in all, drawn to scale</text>
</svg>
```

The fraction field, plus one hidden leading bit, gives 53 binary digits of precision. Each decimal digit is worth about $3.32$ bits, so 53 bits is about $53 \times 0.301 \approx 15.95$ decimal digits. "IEEE-754" is the name of the international standard that fixes this layout, so every modern computer rounds the same way.
:::

::: context floor-negative Why it is called "floor"
Picture the numbers as floors of a building. The **floor** of a number is the level you land on when you drop straight down to a whole number. The floor of $3.5$ is $3$. The floor of $-3.5$ is $-4$, because $-4$ is *below* $-3.5$.

So `-7 // 2` is `-4`, not `-3`, and `-7 % 2` is `1`, so that $-4 \times 2 + 1 = -7$ still holds. Some other languages, such as C, chop toward zero instead and would say $-3$. It matters when you work out things like which orbit number or which time bin a negative time falls in.
:::

::: context mu-gm Why μ and not G times M
Newton's law of gravity uses the gravitational constant $G$ times the planet's mass $M$. Orbits only ever need the product, $\mu = GM$. That is lucky, because the product is known far better than either piece. By timing satellites, $\mu$ for Earth is pinned down to about nine significant figures, $3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$. $G$ on its own is known only to about five. So flight software stores $\mu$ directly and never multiplies $G$ by $M$.
:::

::: context zero-index Counting from zero
Think of the position number as "how many steps from the start". The first item is zero steps in, so it is item `0`. Negative positions count back from the end.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1d6fd1">
    <text x="60" y="28">0</text><text x="120" y="28">1</text><text x="180" y="28">2</text><text x="240" y="28">3</text><text x="300" y="28">4</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="30" y="36" width="60" height="32" fill="#fff"/>
    <rect x="90" y="36" width="60" height="32" fill="#8fb8f0"/>
    <rect x="150" y="36" width="60" height="32" fill="#8fb8f0"/>
    <rect x="210" y="36" width="60" height="32" fill="#fff"/>
    <rect x="270" y="36" width="60" height="32" fill="#fff"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="60" y="57">200</text><text x="120" y="57">400</text><text x="180" y="57">800</text><text x="240" y="57">2000</text><text x="300" y="57">35786</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#b4232c">
    <text x="60" y="84">−5</text><text x="120" y="84">−4</text><text x="180" y="84">−3</text><text x="240" y="84">−2</text><text x="300" y="84">−1</text>
  </g>
  <text x="150" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">alts_km[1:3] → [400, 800]</text>
</svg>
```

Blue numbers above count from the front, red numbers below count from the back. The shaded boxes are the slice `[1:3]`: it starts at position 1 and stops before position 3.
:::

::: context mantissa-exponent Scientific notation in code
Engineers write very big and very small numbers as a number between 1 and 10 times a power of ten: $6.378 \times 10^{6}\,\mathrm{m}$ for Earth's radius. The front part, $6.378$, is called the **mantissa** (or significand). The power, $6$, is the **exponent**. Code cannot write a raised 6, so it uses the letter `e`, read "times ten to the": `6.378e6`. The format `:.3e` asks for three digits after the decimal point in the mantissa.
:::

::: context state-vector The state vector
To know everything about where a spacecraft is going, you need six numbers: its position $(x, y, z)$ and its velocity $(v_x, v_y, v_z)$. Together they are its **state vector**. Given the state at one moment and the forces acting on it, you can work out the state at any later moment. The tuple in this lesson holds the position half. In the orbit and navigation modules the full six-number state is the thing every propagator and filter carries around.
:::

::: context specific-impulse Specific impulse, measured in seconds
Specific impulse, $I_{sp}$, tells you how well an engine uses its propellant. It is the thrust divided by the weight of propellant burned each second. Newtons over newtons-per-second leaves seconds. A Merlin 1D at sea level makes about $845\,\mathrm{kN}$ at $282\,\mathrm{s}$, which means it burns about $306\,\mathrm{kg}$ of propellant every second. Multiply $I_{sp}$ by $g_0$ and you get the effective exhaust speed: $282 \times 9.80665 \approx 2770\,\mathrm{m/s}$.
:::

::: context radians-why Why radians
A **radian** is the angle at which the arc along a circle's edge is as long as the circle's radius. There are $2\pi$ radians in a full turn, so one radian is about $57.3^\circ$. Mathematicians and computers prefer radians because formulas come out cleanest in them — for small angles, $\sin\theta \approx \theta$ only when $\theta$ is in radians. Passing degrees to `math.sin` is one of the most common bugs in engineering code, and it never raises an error.
:::
