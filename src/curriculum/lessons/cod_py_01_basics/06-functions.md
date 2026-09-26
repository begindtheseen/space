---
id: l06-functions
title: Functions, arguments and return values
minutes: 20
covers:
  - Functions: positional, keyword, default, *args, **kwargs
---

Think of a kitchen blender. You put things in the top, press the button, and something comes out of the spout. You do not rebuild the blender every time you want a smoothie. You built it once, and now you use it.

A **function** is a blender for code: a named piece of code with inputs and a result. The reason to write one is not elegance. It is that a calculation which lives in exactly one place can be fixed in exactly one place. A unit conversion copied four times into a script will, one day, exist four times with three different constants — and the script will keep running and print wrong numbers.

This module's goal is to write a 200-line program from a written specification. That is really a goal about functions. Two hundred lines of straight-line code cannot be tested, reused or reviewed. The same two hundred lines as eight functions, each with clear inputs and outputs, can be tested one at a time, and the eighth can be replaced without touching the other seven. Every later module in this track, from NumPy to testing, assumes you write this way.

This lesson covers defining and calling functions; the kinds of input Python offers — positional, keyword, default, and the variable-length `*args` and `**kwargs`; and one idea that matters more than any syntax: what a function actually receives when you hand it a list.

## Defining and calling

You make a function with **[[`def`|def-keyword]]**, then a name, then a list of **parameters** in parentheses, then a colon, then an indented body. Inside, `return` hands a value back and ends the function at once:

```python
>>> def q_dyn(rho, v):
...     return 0.5 * rho * v * v
...
>>> q_dyn(1.225, 250.0)
38281.25
```

At the prompt, the `...` is the REPL asking for the rest of the block. A blank line ends it.

Two words are worth keeping apart:

- **Parameters** are the names in the `def` line: here `rho` (the Greek letter rho, the air density) and `v` (the speed). They exist only inside the function.
- **Arguments** are the actual values you supply when you **call** the function: here `1.225` and `250.0`.

Think of a form with blank boxes. The parameters are the labels on the boxes. The arguments are what you write in them.

What does this function compute? **Dynamic pressure**, the push of the air on a moving vehicle:

$$
q = \tfrac{1}{2}\rho v^2.
$$

Put in sea-level air, $\rho = 1.225\,\mathrm{kg/m^3}$, and $v = 250\,\mathrm{m/s}$:

$$
q = 0.5 \times 1.225 \times 250^2 = 0.5 \times 1.225 \times 62{,}500 = 38{,}281.25\,\mathrm{Pa}.
$$

That is about 38 kPa, a realistic value for the **[[max-q|max-q]]** of a launch vehicle.

### A function with no return

A function with no `return` gives back `None`:

```python
>>> def noop():
...     pass
...
>>> print(noop())
None
```

`pass` is the do-nothing statement. You use it where Python demands a body and you have nothing to put there yet.

That `None` explains something. A function whose job is to *print* rather than to compute cannot be used inside a calculation, because what it gives back is `None`. It is the same `None` that `list.sort()` returns.

## Docstrings say what it does

A string written as the first line of a function's body is its **docstring**. It is not a comment. Python stores it on the function, and `help` shows it.

```python
# aero.py
def dynamic_pressure(rho, v):
    """Dynamic pressure in Pa, from density in kg/m^3 and speed in m/s."""
    return 0.5 * rho * v * v


print(dynamic_pressure.__doc__)
# Dynamic pressure in Pa, from density in kg/m^3 and speed in m/s.
```

Triple quotes `"""` let a string run over several lines and hold ordinary quote marks. `__doc__` is read "dunder doc" — "dunder" is short for the **double underscores** on each side.

A good docstring says what comes back and **in what units**. "Calculates dynamic pressure" adds nothing. "In Pa, from density in kg/m^3 and speed in m/s" prevents the mistake that actually happens. The module's exercises give you starter code with docstrings already written. Treat them as the specification.

## Positional and keyword arguments

There are two ways to hand over an argument.

- By **position**: in the same order as the parameters.
- By **keyword**: `name=value`, in any order.

```python
>>> def q_dyn(rho, v):
...     return 0.5 * rho * v * v
...
>>> q_dyn(1.225, 250.0)
38281.25
>>> q_dyn(v=250.0, rho=1.225)
38281.25
```

Those two calls are the same call. The keyword form is longer, and it is almost always better when the values are bare numbers. `q_dyn(1.225, 250.0)` makes the reader remember the order. `q_dyn(rho=1.225, v=250.0)` does not.

You may mix the two, but positional arguments must come first in a call.

## Default values

Give a parameter a value in the `def` line, and it becomes optional:

```python
# report_line.py
def report_line(name, value, unit="Pa"):
    """One aligned line for a console report."""
    return f"{name:>8} {value:10.2f} {unit}"


print(report_line("max q", 38281.25))
#    max q   38281.25 Pa
print(report_line("max q", 38.28125, unit="kPa"))
#    max q      38.28 kPa
print(report_line(value=38.28125, name="max q", unit="kPa"))
#    max q      38.28 kPa
```

The first call leaves out `unit`, so it gets `"Pa"`. The other two say `unit="kPa"` and get that instead. (The f-string format `{name:>8}` right-aligns the name in 8 columns, and `{value:10.2f}` gives the number 10 columns and 2 decimal places — both from lesson 2.)

Two rules about defaults:

- Parameters with defaults **must come after** those without. Otherwise, in a call like `f(3)`, Python could not tell which parameter the 3 was for. Break the rule and you get `SyntaxError: non-default argument follows default argument`.
- A default is worked out **once**, when the `def` line runs — not on each call. For a number or a string that makes no difference. Use nothing else as a default until you have read lesson 8, which is about the one case where it makes a great deal of difference.

::: key
Parameters are the names in the `def`; arguments are the values at the call. Give arguments by position or by keyword; keyword is clearer wherever the values are bare numbers. Defaults make a parameter optional, must follow the non-default ones, and are evaluated once at definition time.
:::

## Three ways a call can be wrong

Python checks the *shape* of a call at the moment it happens. Learn these three messages by sight:

```python
>>> def q_dyn(rho, v):
...     return 0.5 * rho * v * v
...
>>> q_dyn(1.225)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: q_dyn() missing 1 required positional argument: 'v'
>>> q_dyn(1.225, 250.0, 3.0)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: q_dyn() takes 2 positional arguments but 3 were given
>>> q_dyn(1.225, speed=250.0)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: q_dyn() got an unexpected keyword argument 'speed'
```

Too few, too many, and a name the function does not have. All three are `TypeError`, all three name the function, and all three point at the argument at fault.

What Python does **not** check is whether the values make sense. Call `q_dyn(250.0, 1.225)`, with the two swapped, and it runs happily and returns 187.6 Pa. Nothing in the language protects you from that. Keyword arguments at the call and units in the docstring do.

::: example Reporting one quantity in two units
A quick-look script prints a value in pascals for the log file and in kilopascals for the person reading the screen.

```python
# aero_report.py
RHO_SEA_LEVEL = 1.225   # kg/m^3


def dynamic_pressure(rho, v):
    """Dynamic pressure in Pa, from density in kg/m^3 and speed in m/s."""
    return 0.5 * rho * v * v


def report_line(name, value, unit="Pa"):
    """One aligned line for a console report."""
    return f"{name:>8} {value:10.2f} {unit}"


q = dynamic_pressure(RHO_SEA_LEVEL, 250.0)
print(report_line("max q", q))
#    max q   38281.25 Pa
print(report_line("max q", q / 1000.0, unit="kPa"))
#    max q      38.28 kPa
```

Follow the numbers. `dynamic_pressure` returns $38{,}281.25$ Pa, as we worked out above. Dividing by 1000 gives $38.28125$ kPa, which the format rounds to 38.28. The two lines agree, as they must.

Four choices here are doing real work.

1. The density is a **named constant**, written in capitals at the top of the file, where anyone can find and change it — not a `1.225` buried inside a call.
2. `dynamic_pressure` always returns SI units — metres, kilograms, seconds, and so pascals. The change to kilopascals happens only at the moment of display. **Convert at the edge, never in the middle.**
3. `unit` has a default, so the common case is a short call and the unusual case is spelled out.
4. The column widths live inside `report_line`, not at each call. Changing the layout means changing one line, and every report line follows.

That last point is the whole reuse argument in miniature. The value of the function is not that it is shorter. It is that there is **one place to change**.
:::

## Returning several values

Write `return a, b, c` and the function builds a tuple. The caller unpacks it:

```python
# min_max_mean.py
def min_max_mean(values):
    """Return (minimum, maximum, mean) of a non-empty sequence."""
    return min(values), max(values), sum(values) / len(values)


lo, hi, avg = min_max_mean([9.79, 9.80, 9.78])
print(lo, hi, avg)        # 9.78 9.8 9.79
print(min_max_mean([9.79, 9.80, 9.78]))   # (9.78, 9.8, 9.79)
```

Check the mean: $(9.79 + 9.80 + 9.78)/3 = 29.37/3 = 9.79$. It sits between the smallest and largest, as a mean must.

There is no special "multiple return values" feature. It is the tuple packing from lesson 3, and the unpacking on the left is the same as `t, ax, ay, az = row`. Beyond three or four values, return a dictionary instead, so the caller writes `stats["mean"]` rather than counting commas.

## Any number of arguments: `*args` and `**kwargs`

Sometimes you do not know how many inputs there will be. A shopping bag does not care whether you put in two things or ten.

### `*args`: extra positional arguments

A parameter written with one star, `*name` (read "star name"), **[[collects all the remaining positional arguments into a tuple|star-packing]]**:

```python
# rss.py
import math


def rss(*components):
    """Root sum of squares of any number of components."""
    total = 0.0
    for c in components:
        total += c * c
    return math.sqrt(total)


print(rss(0.02, -0.41, 9.79))   # 9.798601941093432
print(rss(3.0, 4.0))            # 5.0
print(rss())                    # 0.0
```

`rss` is the **root sum of squares**: square each component, add them up, take the square root. `rss(0.02, -0.41, 9.79)` is the size of a three-axis acceleration, $9.7986\,\mathrm{m/s^2}$. Sanity check: it is a little more than the biggest component, 9.79, because the two small ones add only a little. And `rss(3.0, 4.0)` is the 3-4-5 right triangle: $\sqrt{9 + 16} = 5$. One function handles both, with no second definition.

A close relative is the **[[root mean square|rms]]** of a sequence — the square root of the *mean* of the squares:

$$
\mathrm{rms} = \sqrt{\frac{1}{n}\sum_{i=1}^{n} x_i^2}.
$$

It is the number a vibration or noise report quotes. It differs from `rss` only by dividing by the count $n$ before taking the root.

Call `rss()` with nothing at all, and `components` is the empty tuple. The loop body never runs, and the result is `0.0`. Think about whether that is the answer you want. For a size, it is. For a mean, it would be a division by zero.

### `**kwargs`: extra keyword arguments

A parameter written with two stars, `**name` (read "double-star name"), collects all the remaining **keyword** arguments into a dictionary, in the order they were given:

```python
# log_event.py
def log_event(kind, **fields):
    """Print one structured log line: a kind, then key=value pairs."""
    line = kind
    for key, value in fields.items():
        line += f" {key}={value}"
    print(line)


log_event("limit_exceeded", channel="ax", value=12.71, limit=12.5)
# limit_exceeded channel=ax value=12.71 limit=12.5
log_event("run_start")
# run_start
```

In the first call, `kind` is `"limit_exceeded"` and `fields` is `{"channel": "ax", "value": 12.71, "limit": 12.5}`. The loop adds one `key=value` piece per pair. In the second call `fields` is empty, so only the kind is printed.

The names `args` and `kwargs` (short for "keyword arguments") are a habit, not a rule. `*components` and `**fields` are better names when you can choose. But you will read `*args, **kwargs` in every codebase, and it means "whatever else the caller passes".

::: example A log line that does not need a new function per event
A test script reports several kinds of event, each with different details. Without `**kwargs` you would write one function per event type, or one function with a dozen parameters that are usually unused.

```python
# run_log.py
def log_event(kind, **fields):
    """Print one structured log line: a kind, then key=value pairs."""
    line = kind
    for key, value in fields.items():
        line += f" {key}={value}"
    print(line)


log_event("run_start", vehicle="stand-3", rate_hz=40)
# run_start vehicle=stand-3 rate_hz=40
log_event("limit_exceeded", channel="ax", value=12.71, limit=12.5)
# limit_exceeded channel=ax value=12.71 limit=12.5
log_event("run_end", samples=18240, dropouts=2)
# run_end samples=18240 dropouts=2
```

Trace the last call. `kind` is `"run_end"`. `fields` is `{"samples": 18240, "dropouts": 2}`. The line starts as `run_end`, gains ` samples=18240`, then ` dropouts=2`.

Every line has the same shape: an event kind, then `key=value` pairs. That shape is what makes the log **[[searchable later|structured-logs]]** with the shell tools from the Linux module. The details differ per event, and `**fields` lets one function accept all of them. They come out in the order the caller wrote them, because a keyword-argument dictionary keeps insertion order like any other.

This is a small version of what real projects do with Python's `logging` module, which the next Python module covers. The idea — shape your output so a machine can read it later — is the same at both sizes.
:::

## Guard clauses: return early

A function often has one case it should refuse or handle specially. Deal with that case first, and `return`. This is called a **guard clause** — like a guard at a gate who turns away the odd visitor before anyone reaches the main hall.

```python
# mean.py
def mean(values):
    """Arithmetic mean; 0.0 for an empty sequence rather than a crash."""
    if not values:
        return 0.0
    return sum(values) / len(values)


print(mean([]))            # 0.0
print(mean([1.0, 2.0]))    # 1.5
```

`if not values:` uses truthiness from lesson 4: an empty list is falsy. Without the guard, `mean([])` would divide by `len([])`, which is 0, and raise `ZeroDivisionError`.

Whether `0.0` is the right answer depends on the situation, and you must decide on purpose. For a gap in telemetry, a mean of zero may be what a report should show — or it may be an invented number that hides the gap. What is never right is to leave the crash undecided.

Guard clauses keep the main path of the function at one level of indentation, which matters more than it sounds once the body grows. And `return` ends the function from anywhere, even inside a loop — which is how a search function hands back the first match.

## What a function receives

Here is the idea that matters most. When you call a function, the parameter name is **bound to the same object** the caller passed. Nothing is copied. Python calls this **passing by assignment**: it is as if the function began with `samples = data`.

Think of two name tags clipped to one box. Whatever you put *into* the box, both tags see. But moving one tag to a different box does not move the other.

So a function that changes a list changes the caller's list. A function that points its parameter at a new object changes nothing for the caller:

```python
# passing.py
def zero_first(samples):
    """Mutates the caller's list."""
    samples[0] = 0.0


def rebind(samples):
    """Rebinds a local name; the caller sees nothing."""
    samples = [0.0]


data = [9.79, 9.80]
zero_first(data)
print(data)     # [0.0, 9.8]

data2 = [9.79, 9.80]
rebind(data2)
print(data2)    # [9.79, 9.8]
```

`samples[0] = 0.0` reaches through the name to the object and changes it. The caller's `data` *is* that object, so it sees the change. `samples = [0.0]` moves the local name onto a brand-new list and leaves the caller's list alone. This is the same rule as `b = a` in lesson 3, **[[seen from inside a function|shared-object]]**. It is also half the reason lesson 8 exists.

::: warning Compute, or change — not both
A function that both returns a value and changes its arguments is the hardest kind to debug. The caller sees the return value and forgets the change. Prefer functions that only compute: take values, return a new value, touch nothing — often called **[[pure functions|pure-function]]**. When a function must change something, say so in the first line of its docstring and return `None`, so the reader can tell which kind it is at a glance.
:::

## Check yourself

::: check
Write a function `deg_to_rad(deg)` with a docstring. Call it positionally, by keyword, and on the value 180. What must it return for 180, exactly?
:::

::: answer
```python
# deg_to_rad.py
import math


def deg_to_rad(deg):
    """Convert an angle in degrees to radians."""
    return math.radians(deg)


print(deg_to_rad(90.0))               # 1.5707963267948966
print(deg_to_rad(deg=90.0))           # 1.5707963267948966
print(deg_to_rad(180.0))              # 3.141592653589793
print(deg_to_rad(180.0) == math.pi)   # True
```

For 180 degrees it must return exactly `math.pi`, and it does.

Writing the arithmetic yourself is also correct. But the two obvious ways to write it are not quite the same function:

```python
# radians_forms.py
import math

deg = 0.18
print(repr(deg * math.pi / 180.0))      # 0.0031415926535897933
print(repr(deg * (math.pi / 180.0)))    # 0.003141592653589793
print(repr(math.radians(deg)))          # 0.003141592653589793
```

Multiplying first and dividing second rounds twice in one order. Multiplying by a precomputed constant rounds in another. Try every angle from 0 to 360 degrees in steps of a hundredth, and the two forms differ in the last digit for more than a quarter of them. Both are right to fifteen digits, and neither is "the" answer. Use `math.radians`, which is the standard version and agrees with the second form. And never compare two computed angles with `==` — lesson 12 explains.
:::

::: check
What is the difference between these two, and when would each be right?

```python
def scale(values, factor):
    return [v * factor for v in values]

def scale_in_place(values, factor):
    for i, v in enumerate(values):
        values[i] = v * factor
```
:::

::: answer
The first builds and returns a **new** list. Its argument is untouched, and the caller must use the return value. The second changes the caller's list **in place** and returns `None`.

Prefer the first. You can test it on any input without setting anything up. You can call it on a list that belongs to someone else. And calling it while ignoring the result is plainly a mistake.

The second is right when the list is so large that a second copy matters, or when several names must all see the change. Never write one that does both.

(The first uses a **list comprehension**, the compact `[expression for item in sequence]` form, which the next module covers. Written as an ordinary loop it is three lines and does the same thing.)
:::

::: check
A colleague calls `dynamic_pressure(250.0, 1.225)` and gets 187.6 instead of 38,281. What went wrong, why did Python not complain, and what two habits would have caught it?
:::

::: answer
The arguments are in the wrong order: density and speed were swapped. So the function computed

$$
0.5 \times 250 \times 1.225^2 = 0.5 \times 250 \times 1.500625 = 187.6\,\mathrm{Pa},
$$

a number plausible enough to survive a quick glance.

Python cannot complain. Both arguments are floats, and it has no idea which one is a density. Parameter names carry meaning only for human readers.

Two habits catch it. First, call with keywords, `dynamic_pressure(rho=1.225, v=250.0)`, so the names sit right at the call. Second, state the units in the docstring, so a reader checking the call has something to check it against.
:::

::: check
What does `rss(*components)` collect its arguments into? What is the difference between calling `rss(3.0, 4.0)` and `rss([3.0, 4.0])`?
:::

::: answer
`*components` collects the positional arguments into a **tuple**. In the first call, `components` is `(3.0, 4.0)`, and the result is `5.0`.

The second call passes *one* argument that happens to be a list. So `components` is `([3.0, 4.0],)` — a one-item tuple whose only item is a list. The body then works out `c * c` with `c` a list, which fails:

```python
# rss_wrong_call.py
import math


def rss(*components):
    """Root sum of squares of any number of components."""
    total = 0.0
    for c in components:
        total += c * c
    return math.sqrt(total)


try:
    rss([3.0, 4.0])
except TypeError as e:
    print(type(e).__name__ + ": " + str(e))
# TypeError: can't multiply sequence by non-int of type 'list'
```

A function taking `*args` and a function taking one sequence are different designs. `sum` takes a sequence; `max` accepts either. If you hold a list and need to spread it into a `*args` call, put a star at the call: `rss(*my_list)`. The `try`/`except` used above to catch and print the error is lesson 10.
:::

::: check
In the passing example, why does `rebind` change nothing for the caller, while `zero_first` does? State the rule in one sentence.
:::

::: answer
Calling a function binds the parameter name to the *same object* the caller holds.

`zero_first` changes that object through its name. The caller's `data` refers to the same object, so it sees the change.

`rebind` assigns to the parameter name. That moves the local name onto a new object and leaves the original alone. The local name then disappears when the function returns.

The rule: **a function can change what you gave it, but it cannot change which object your name refers to.**
:::

## Summary

| Item | Statement |
| --- | --- |
| Definition | `def name(params):`, indented body, `return value` |
| No `return` | The function returns `None` |
| Docstring | First line of the body, triple-quoted; says what is returned and in what units |
| Parameters vs arguments | Names in the `def` vs values at the call |
| Keyword arguments | `f(rho=1.225, v=250.0)`; any order; positional arguments come first |
| Defaults | `def f(x, unit="Pa")`; must follow non-default parameters; evaluated once at definition |
| Call errors | `TypeError`: missing required argument, too many positional arguments, unexpected keyword |
| Several results | `return a, b` builds a tuple; the caller unpacks. Beyond three or four, return a dict |
| `*args` | Collects extra positional arguments into a tuple |
| `**kwargs` | Collects extra keyword arguments into a dict, in call order |
| Guard clause | Handle the refused case first and `return` early |
| Argument passing | By assignment: the parameter is bound to the caller's object. Changing the object is visible; rebinding the name is not |

The next lesson asks where the names inside a function live: why a function can read a constant at the top of the file but not assign to it, what happens to a name when the function returns, and what a **closure** keeps alive.

::: context def-keyword Reading a function line aloud
`def` is short for *define*. Read `def q_dyn(rho, v):` as "define q-dyn, taking rho and v".

Running a `def` line does not run the body. It builds a function object and binds the name `q_dyn` to it — the same way `x = 5` binds `x` to 5. The body runs only when you call the function, by writing its name followed by parentheses. Leave the parentheses off, as in `q_dyn` alone, and you get the function object itself, which the REPL shows as something like `<function q_dyn at 0x7f...>`.
:::

::: context max-q The hardest moment for the airframe
Right after lift-off a rocket is slow, so the air pushes on it gently. High up, the air is thin, so again the push is small. Somewhere in between — typically around a minute into flight, at an altitude of roughly 10 to 15 km — speed has grown fast and the air is still thick enough, and $q = \tfrac{1}{2}\rho v^2$ reaches its peak. That peak is called **max-q**.

It is the moment of greatest aerodynamic stress on the structure. Many vehicles lower their engine thrust briefly around it to limit the load, then throttle back up once past it.
:::

::: context star-packing Where the arguments go
When a function has a `*components` parameter, Python gathers every positional argument that no ordinary parameter took and packs them into one tuple.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="24" font-size="12" fill="#1f2a44">rss(</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="40" y="10" width="50" height="22" rx="4"/><rect x="100" y="10" width="50" height="22" rx="4"/><rect x="160" y="10" width="50" height="22" rx="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="65" y="25">0.02</text><text x="125" y="25">-0.41</text><text x="185" y="25">9.79</text>
  </g>
  <text x="214" y="24" font-size="12" fill="#1f2a44">)</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="65" y1="32" x2="115" y2="80"/><line x1="125" y1="32" x2="165" y2="80"/><line x1="185" y1="32" x2="215" y2="80"/>
  </g>
  <rect x="90" y="80" width="150" height="30" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="115" y="99">0.02</text><text x="165" y="99">-0.41</text><text x="215" y="99">9.79</text>
  </g>
  <text x="250" y="92" font-size="12" fill="#1d6fd1">components</text>
  <text x="250" y="108" font-size="11" fill="#6c7a93">a tuple of 3</text>
</svg>
```

The same star at a *call* does the reverse: `rss(*[0.02, -0.41, 9.79])` unpacks the list into three separate arguments. Two stars do the same job for keyword arguments and dictionaries.
:::

::: context rms Why engineers quote RMS
A vibration signal swings positive and negative, so its plain average is close to zero — which says nothing about how hard it is shaking. Squaring every value first makes them all positive. Averaging the squares and taking the square root brings the answer back to the original units.

For the two values $-2$ and $2$, the mean is $0$ but the RMS is $\sqrt{(4 + 4)/2} = 2$, which is the honest size of the swing. Random-vibration test levels for spacecraft parts are usually stated as an RMS acceleration, often written in g, and the module's accelerometer exercise asks you to compute exactly this number per axis.
:::

::: context structured-logs Logs a machine can read
A line such as `limit_exceeded channel=ax value=12.71 limit=12.5` is easy for a person to read and easy for a program to pick apart: split on spaces, then split each piece on `=`.

That means the shell tools from the Linux module work on it directly. `grep limit_exceeded run.log` finds every exceedance; adding `grep channel=ax` narrows it to one channel. A log written as free sentences — "Oh no, ax went over!" — cannot be searched this reliably. Test campaigns that produce thousands of log files depend on this kind of regular shape.
:::

::: context shared-object Two names, one list
When `zero_first(data)` runs, the parameter `samples` is bound to the very list that `data` names. Nothing is copied.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="80" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">data</text>
  <rect x="10" y="70" width="80" height="26" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">samples</text>
  <text x="50" y="118" font-size="11" text-anchor="middle" fill="#6c7a93">inside the function</text>
  <rect x="190" y="40" width="150" height="34" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="265" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">[0.0, 9.8]</text>
  <line x1="90" y1="33" x2="186" y2="52" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="190,53 180,47 179,56" fill="#1f2a44"/>
  <line x1="90" y1="83" x2="186" y2="64" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="190,63 179,61 181,70" fill="#1f2a44"/>
  <text x="265" y="100" font-size="11" text-anchor="middle" fill="#b4232c">changed through samples[0]</text>
</svg>
```

`rebind` would instead point the orange tag at a new list, `[0.0]`, drawn somewhere else. The blue tag, `data`, would stay where it was, pointing at the original, unchanged list.
:::

::: context pure-function Functions that only compute
A **pure function** is one whose result depends only on its arguments, and which changes nothing outside itself: no printing, no files, no changing the lists it was given. `dynamic_pressure` is pure. `zero_first` is not.

Pure functions are the easiest code there is to test. Give one the same inputs and it gives the same output, every time, in any order, on any machine. A test is one line: call it, and compare the result with the answer you worked out by hand. That is why flight-software and analysis teams push as much of their arithmetic as they can into functions like this, and keep the file reading and printing at the edges.
:::
