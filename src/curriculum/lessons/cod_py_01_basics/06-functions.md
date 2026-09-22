---
id: l06-functions
title: Functions, arguments and return values
minutes: 20
covers:
  - Functions: positional, keyword, default, *args, **kwargs
---

A function is a piece of code with a name, a list of inputs and a result. That is worth saying plainly because the reason to write one is not elegance: it is that a calculation which exists in exactly one place can be corrected in exactly one place. The unit conversion that appears four times in a script will eventually appear four times with three different constants, and the script will keep running.

The module's specification — write a 200-line program from a written specification — is really a specification about functions. Two hundred lines of straight-line code cannot be tested, reused or reviewed. The same two hundred lines as eight functions with clear inputs and outputs can be tested one at a time, and the eighth one can be replaced without touching the other seven. Every later module in this track, from NumPy to testing to packaging, assumes you write this way.

This lesson covers defining and calling functions, the four kinds of parameter Python offers — positional, keyword, default and the variable-length `*args` and `**kwargs` — and one idea that matters more than the syntax: what a function actually receives when you pass it a list.

## Defining and calling

`def`, a name, a parenthesised list of *parameters*, a colon, and an indented body. `return` hands a value back to the caller and ends the function immediately:

```python
>>> def q_dyn(rho, v):
...     return 0.5 * rho * v * v
...
>>> q_dyn(1.225, 250.0)
38281.25
```

At the prompt, the `...` is the REPL asking for more of the block; a blank line ends it. `rho` and `v` are *parameters* — names that exist only inside the function. `1.225` and `250.0` are *arguments* — the values supplied at the call. Dynamic pressure is $q = \tfrac{1}{2}\rho v^2$, so at sea-level density and 250 m/s the answer is 38,281.25 Pa, about 38 kPa, which is a realistic max-q for a launch vehicle.

A function with no `return` returns `None`:

```python
>>> def noop():
...     pass
...
>>> print(noop())
None
```

`pass` is the do-nothing statement, used where the syntax demands a body and you have nothing to put there yet. And `None` is the reason a function whose job is to print rather than to compute cannot be used in an expression — this is the same `None` that `list.sort()` returns.

## Docstrings say what it does

A string literal as the first line of a function body is its *docstring*. It is not a comment: it is stored on the function and shown by `help`.

```python
# aero.py
def dynamic_pressure(rho, v):
    """Dynamic pressure in Pa, from density in kg/m^3 and speed in m/s."""
    return 0.5 * rho * v * v


print(dynamic_pressure.__doc__)
# Dynamic pressure in Pa, from density in kg/m^3 and speed in m/s.
```

Triple quotes allow the string to span lines and to contain quotes. Say what the function returns and in what units — a docstring that says "calculates dynamic pressure" adds nothing, and one that says "in Pa, from density in kg/m^3 and speed in m/s" prevents the mistake that actually happens. The module's exercises give you starter code with docstrings already written; treat them as the specification.

## Positional and keyword arguments

Arguments can be given by position, in the order the parameters are declared, or by name in any order:

```python
>>> def q_dyn(rho, v):
...     return 0.5 * rho * v * v
...
>>> q_dyn(1.225, 250.0)
38281.25
>>> q_dyn(v=250.0, rho=1.225)
38281.25
```

Both calls are the same call. The keyword form is longer and almost always better at a call site where the values are bare numbers: `q_dyn(1.225, 250.0)` requires the reader to know the order, and `q_dyn(rho=1.225, v=250.0)` does not. Positional arguments must come before keyword ones in a call.

## Default values

A parameter given a value in the `def` line becomes optional:

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

Parameters with defaults must come after those without, for the obvious reason that otherwise there would be no way to tell which positional argument was which. A default is evaluated **once**, when the `def` line runs — not on each call. For a number or a string that makes no difference, and you should use nothing else as a default until you have read lesson 8, which is about the one case where it makes a great deal of difference.

::: key
Parameters are the names in the `def`; arguments are the values at the call. Give arguments by position or by keyword; keyword is clearer wherever the values are bare numbers. Defaults make a parameter optional, must follow the non-default ones, and are evaluated once at definition time.
:::

## Three ways a call can be wrong

Python checks the *shape* of a call at the moment it happens, and the three messages are worth recognising on sight:

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

All three are `TypeError`, all three name the function, and all three tell you exactly which argument is at fault. What Python does *not* check is whether the values make sense: `q_dyn(250.0, 1.225)` with the arguments the wrong way round runs happily and returns 187.6 Pa. Nothing in this lesson protects you from that; keyword arguments at the call site and units in the docstring do.

::: example Reporting one quantity in two units
A quick-look script prints a value in pascals for the log and in kilopascals for the human reading it.

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

Three things are doing work here. The density is a named constant in capitals at the top of the file, where it can be found and changed, instead of a `1.225` buried in a call. `dynamic_pressure` returns SI units always, and the conversion to kilopascals happens at the point of display — convert at the boundary, never in the middle. And `unit` has a default, so the common case is a short call and the unusual case is an explicit one.

The formatting parameters are inside `report_line` rather than at each call, so that changing the column width changes one line of the file and every report line at once. That is the reuse argument in miniature: the value of the function is not that it is shorter, it is that there is one place to change.
:::

## Returning several values

`return a, b, c` builds a tuple, and the caller unpacks it:

```python
# min_max_mean.py
def min_max_mean(values):
    """Return (minimum, maximum, mean) of a non-empty sequence."""
    return min(values), max(values), sum(values) / len(values)


lo, hi, avg = min_max_mean([9.79, 9.80, 9.78])
print(lo, hi, avg)        # 9.78 9.8 9.79
print(min_max_mean([9.79, 9.80, 9.78]))   # (9.78, 9.8, 9.79)
```

There is no special "multiple return values" feature — it is the tuple packing from lesson 3, and the unpacking on the left is the same syntax as `t, ax, ay, az = row`. Beyond three or four values, return a dictionary instead, so that the caller reads `stats["mean"]` rather than counting commas.

## Any number of arguments: `*args` and `**kwargs`

A parameter written `*name` collects all remaining positional arguments into a tuple:

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

`rss(0.02, -0.41, 9.79)` is the magnitude of a three-axis acceleration, $9.7986\,\mathrm{m/s^2}$, and the same function does the two-component case without a second definition. With no arguments at all, `components` is the empty tuple, the loop body never runs, and the result is `0.0` — think about whether that is the answer you want, because for a magnitude it is, and for a mean it would be a division by zero.

A parameter written `**name` collects all remaining *keyword* arguments into a dictionary, in the order they were given:

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

The names `args` and `kwargs` are a convention, not a rule — `*components` and `**fields` are better names — but you will read `*args, **kwargs` in every codebase, and it means "whatever else the caller passes".

::: example A log line that does not need a new function per event
A test script reports several kinds of event, each with different fields. Without `**kwargs` you would write one function per event type, or one function with a dozen unused parameters.

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

Every line has the same shape — an event kind followed by `key=value` pairs — which is what makes the log searchable afterwards with the shell tools from the Linux module. The fields differ per event, and `**fields` is what lets one function accept all of them. The order is the order the caller wrote, because a keyword-argument dictionary preserves insertion order like any other dictionary.

This is a simplification of what a real project does with the `logging` module, which the next Python module covers. The idea — structure your output so a machine can read it later — is the same at both sizes.
:::

## Guard clauses: return early

A function often has a case it should refuse or short-circuit. Handle it first, and return:

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

Without the guard, `mean([])` raises `ZeroDivisionError`. Whether returning `0.0` is right depends entirely on the situation, and it is a judgement you must make deliberately: for a telemetry gap, a mean of zero may be exactly what a report should show, or it may be a fabricated number that hides the gap. What is never right is to leave the crash undecided.

Guard clauses keep the main path of the function at one level of indentation, which is worth more than it sounds when the body grows. `return` anywhere ends the function, including inside a loop — which is how a search function reports the first match.

## What a function receives

An argument is passed by *assignment*: the parameter name inside the function is bound to the same object the caller passed. Nothing is copied. So a function that mutates a list changes the caller's list, and a function that rebinds its parameter changes nothing:

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

`samples[0] = 0.0` reaches through the name to the object and changes it; the caller's `data` is that object. `samples = [0.0]` makes the local name point at a new list and leaves the caller's object untouched. This is the same rule as `b = a` in lesson 3, seen from inside a function, and it is the second half of the reason lesson 8 exists.

::: warning
A function that both returns a value and mutates its arguments is the hardest kind to debug, because the caller sees the return value and forgets the mutation. Prefer functions that only compute — take values, return a new value, touch nothing. When a function must mutate, say so in the first line of its docstring and return `None`, so that the signature itself tells the reader which kind it is.
:::

## Check yourself

::: check
Write a function `deg_to_rad(deg)` with a docstring, then call it three ways: positionally, by keyword, and on the value 180. What must it return for 180, exactly?
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

For 180 degrees it must return exactly `math.pi`, and it does. Writing the arithmetic yourself is also correct, but the two obvious ways of writing it are not the same function:

```python
# radians_forms.py
import math

deg = 0.18
print(repr(deg * math.pi / 180.0))      # 0.0031415926535897933
print(repr(deg * (math.pi / 180.0)))    # 0.003141592653589793
print(repr(math.radians(deg)))          # 0.003141592653589793
```

Multiplying first and dividing second rounds twice in one order; multiplying by a precomputed constant rounds in another, and for about a quarter of the angles tried between 0 and 360 degrees in hundredths they differ in the last bit. Both are right to fifteen digits and neither is "the" answer. Use `math.radians`, which is the reference implementation and agrees with the second form, and never compare two angles with `==` — lesson 12.
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
The first builds and returns a new list — its argument is untouched, and the caller must use the return value. The second changes the caller's list in place and returns `None`. Prefer the first: it can be tested on any input without setting up state, it can be called on a list you do not own, and calling it and ignoring the result is obviously a mistake. The second is right when the sequence is large enough that a second copy matters, or when several names must see the change. Never write one that does both. (The first uses a *list comprehension*, the compact `[expression for item in sequence]` form, which the next module covers; written as a loop it is three lines and identical in effect.)
:::

::: check
A colleague calls `dynamic_pressure(250.0, 1.225)` and gets 187.6 instead of 38,281. What went wrong, why did Python not complain, and what two habits would have caught it?
:::

::: answer
The arguments are in the wrong order: density and speed were swapped, so the function computed $0.5 \times 250 \times 1.225^2 = 187.6$ Pa — a number that is plausible enough to survive a glance. Python cannot complain, because both arguments are floats and it has no idea which is a density; parameter names carry meaning only for the reader. Two habits catch it: call with keywords, `dynamic_pressure(rho=1.225, v=250.0)`, so the names are at the call site, and state the units in the docstring so that a reader checking the call has something to check against.
:::

::: check
What does `rss(*components)` collect its arguments into, and what is the difference between calling `rss(3.0, 4.0)` and `rss([3.0, 4.0])`?
:::

::: answer
`*components` collects the positional arguments into a **tuple**, so the first call runs with `components` equal to `(3.0, 4.0)` and returns `5.0`. The second call passes one argument that happens to be a list, so `components` is `([3.0, 4.0],)` — a one-element tuple whose only element is a list — and the body then evaluates `c * c` with `c` a list:

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

A function taking `*args` and a function taking one sequence are different interfaces: `sum` takes a sequence, `max` takes either. If you have a list and need to spread it into a `*args` call, write `rss(*my_list)`. The `try`/`except` used to catch and print the error is lesson 10.
:::

::: check
Why does `rebind` in the passing example change nothing for the caller, while `zero_first` does? State the rule in one sentence.
:::

::: answer
Passing an argument binds the parameter name to the *same object* the caller holds. `zero_first` mutates that object through its name, so the caller — which refers to the same object — sees the change. `rebind` assigns to the parameter name, which rebinds the local name to a new object and leaves the original alone; the local name disappears when the function returns. The rule: a function can change what you gave it, but it cannot change which object your name refers to.
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
| Argument passing | By assignment: the parameter is bound to the caller's object. Mutating it is visible; rebinding it is not |

The next lesson asks where the names inside a function live: why a function can read a module-level constant but not assign to it, what happens to a name when the function returns, and what a *closure* keeps alive.
