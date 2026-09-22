---
id: l02-functions-modules
title: Functions, errors and modules
minutes: 20
covers:
  - Python syntax, control flow, functions, classes
---

The two tables you printed in the previous lesson were correct, but they were also disposable: to compute an orbital speed again you would have to find the loop, copy the formula and retype the constants. Real engineering code is organised differently. A calculation with a name, a documented set of inputs and a single well-defined output is a *function*; a file of related functions and constants is a *module*; and a module that validates its inputs and fails loudly on nonsense is one you can trust in someone else's hands.

This lesson builds a small module, `orbits.py`, that later lessons and the module's exercises will lean on. Along the way you learn how Python reports an error, how to raise one deliberately, and how to check a result with `assert` — the seed of the testing discipline that has its own lesson later. GNC teams live and die by this structure: a flight-dynamics group's propagator, its frame conversions and its manoeuvre planner are all modules with functions, and every one of them started as a few lines like the ones below.

## Defining and calling functions

A function is introduced with `def`, a name, a parenthesised list of *parameters*, and a colon. The indented body runs each time the function is *called*, with the parameters bound to the *arguments* supplied by the caller. `return` hands a value back and ends the call.

```python
import math

def circular_speed(r, mu=3.986004418e14):
    return math.sqrt(mu / r)

print(circular_speed(6_778_137))                  # 7668.558175407055
print(circular_speed(6_778_137, 4.9048695e12))    # 850.6649857923778  (the Moon's mu)
print(circular_speed(mu=4.9048695e12, r=6_778_137))   # 850.6649857923778
```

The second parameter, `mu`, has a *default value*: callers who omit it get Earth. Arguments may be passed *positionally*, in order, or by *keyword*, as `name=value`, in any order. Keyword arguments make a call readable — `solve_ivp(fun, t_span, y0, rtol=1e-12)` tells you exactly which knob is being turned — and every scientific library you meet uses them heavily.

A function that reaches its end without a `return` gives back the special value `None`. That is what `print` returns, which is why `result = print("hi")` leaves `result` holding `None`. To return several things, return a tuple and unpack it at the call site:

```python
def stats(values):
    n = len(values)
    mean = sum(values) / n
    var = sum((v - mean) ** 2 for v in values) / (n - 1)
    return mean, math.sqrt(var)

m, s = stats([7784.3, 7668.6, 7451.9])
print(m, s)   # 7634.933333333334 168.73803167434852
```

That `sum(... for v in values)` is a *generator expression*: a comprehension without the brackets, fed straight to `sum`. The formula is the sample standard deviation with the $n - 1$ divisor.

## Docstrings and type hints

The first statement of a function may be a string, called the *docstring*, that says what the function does, what its parameters mean and in what units, and what it returns. Python stores it as `circular_speed.__doc__` and shows it when you type `help(circular_speed)`. Write one for every function that outlives the REPL, and always name the units — a bare `r` could be metres, kilometres or Earth radii, and the next reader (often you, in three months) has no way to tell.

The NumPy documentation style, which the exercises in this module use, looks like this:

```python
def delta_v(isp: float, m0: float, mf: float, g0: float = 9.80665) -> float:
    """Ideal rocket-equation delta-v.

    Parameters
    ----------
    isp : specific impulse, s
    m0, mf : initial and final mass, kg
    g0 : standard gravity, m/s^2

    Returns
    -------
    float -- delta-v in m/s
    """
    return isp * g0 * math.log(m0 / mf)
```

The `: float` after each parameter and the `-> float` after the parentheses are *type hints*. They are documentation that tools can read: an editor will flag `delta_v("311", 1, 2)` before you run it. Python itself does not check them — `delta_v.__annotations__` is where they end up, and passing the wrong type still runs until something inside fails. Use them anyway; a signature such as `def monte_carlo_range(v0: float, n: int) -> np.ndarray` is the fastest documentation there is.

## Scope

Names bound inside a function are *local*: they come into existence when the call starts and vanish when it returns, and they never disturb names outside. A function may *read* a name from the surrounding module — that is how `MU_EARTH` at the top of a file is visible to every function in it — but assigning to such a name inside the function creates a new local instead.

```python
x = 10
def f():
    x = 20        # a new local x; the module-level x is untouched
    return x
print(f(), x)     # 20 10
```

Treat module-level names as constants. A function whose result depends on hidden state that some other function modified is impossible to reason about and nearly impossible to test. Pass everything the function needs in through its parameters and return everything it produces.

::: warning Mutable default arguments are evaluated once
A default value is computed when the `def` runs, not at each call. A mutable default such as an empty list is therefore shared between calls, and the second call sees what the first one appended:

```python
def add_item(item, box=[]):
    box.append(item)
    return box
print(add_item(1), add_item(2))   # [1, 2] [1, 2]
```

The idiom is a `None` default that the body replaces: `def add_item(item, box=None): if box is None: box = []`. With that change the calls return `[1]` and `[2]`.
:::

## Errors and exceptions

When Python cannot carry on it raises an *exception* and, if nothing catches it, prints a *traceback* and stops. Read a traceback from the bottom up: the last line names the exception and gives a message, and the lines above show the chain of calls that led there, innermost last. The names are worth learning because they tell you the class of mistake:

- `ValueError` — right type, unacceptable value: `float("abc")`, `math.sqrt(-1)` ("math domain error");
- `TypeError` — wrong type: `"3" + 4` ("can only concatenate str (not "int") to str");
- `ZeroDivisionError` — `1/0` ("division by zero");
- `IndexError` — `[1, 2, 3][5]` ("list index out of range");
- `KeyError` — a dictionary lookup on a missing key;
- `NameError` — a name that was never bound, often a typo.

You raise your own exception with `raise`, and you should do so the moment a function receives an input that cannot be right. A negative orbit radius produces a `math domain error` deep inside `sqrt` that says nothing about radii; a check at the top of the function gives a message that names the problem:

```python
def circular_speed(r: float, mu: float = 3.986004418e14) -> float:
    """Speed of a circular orbit of radius r (m), in m/s."""
    if r <= 0:
        raise ValueError(f"radius must be positive, got {r}")
    return math.sqrt(mu / r)
```

The caller can *catch* an exception with `try`/`except` and decide what to do — log it, substitute a default, or re-raise. Catch only what you expect and can handle; a bare `except:` that swallows everything hides bugs.

```python
try:
    circular_speed(-1)
except ValueError as err:
    print("caught:", err)     # caught: radius must be positive, got -1
```

The exercise on vectors asks for a `normalized()` method that raises `ZeroDivisionError` on a zero vector "rather than returning NaN". This is the same principle: a zero vector has no direction, and a loud failure at the point of the mistake beats a silent not-a-number that propagates into a guidance command.

```python
def safe_direction(x, y, z):
    n = math.sqrt(x*x + y*y + z*z)
    if n == 0.0:
        raise ZeroDivisionError("cannot normalise the zero vector")
    return x/n, y/n, z/n

print(safe_direction(3.0, 0.0, 4.0))   # (0.6, 0.0, 0.8)
```

Finally, `assert condition, message` raises `AssertionError` with the message when the condition is false, and does nothing otherwise. It is a one-line sanity check — "this value must lie between 7 and 8 km/s" — and it is exactly the statement the pytest lesson turns into a test suite.

```python
v = circular_speed(6_778_137)
assert 7000 < v < 8000, f"unexpected v={v}"
```

## Modules and imports

Any file `orbits.py` is a *module* named `orbits`. Another file in the same directory can `import orbits` and then reach its contents with a dot, or pull specific names in with `from orbits import delta_v`. The `import numpy as np` form gives a module a short alias; `np`, `plt` for `matplotlib.pyplot` and `sp` for `scipy` are conventions the whole community follows, and this curriculum follows them too.

Here is the module this lesson has been assembling. Save it as `orbits.py`:

```python
"""Two-body orbit helpers, SI units throughout."""

import math

MU_EARTH = 3.986004418e14  # m^3/s^2
R_EARTH = 6_378_137.0      # m
G0 = 9.80665               # m/s^2


def circular_speed(r: float, mu: float = MU_EARTH) -> float:
    """Speed of a circular orbit of radius r (m), in m/s."""
    if r <= 0:
        raise ValueError(f"radius must be positive, got {r}")
    return math.sqrt(mu / r)


def period(r: float, mu: float = MU_EARTH) -> float:
    """Period of a circular orbit of radius r, in s."""
    return 2 * math.pi * math.sqrt(r**3 / mu)


def delta_v(isp: float, m0: float, mf: float, g0: float = G0) -> float:
    """Ideal rocket-equation delta-v, m/s. isp in s, masses in kg."""
    if mf <= 0 or m0 < mf:
        raise ValueError("need 0 < mf <= m0")
    return isp * g0 * math.log(m0 / mf)


def hohmann(r1: float, r2: float, mu: float = MU_EARTH) -> tuple[float, float]:
    """Delta-v of the two Hohmann burns between circular orbits r1 and r2."""
    a_t = 0.5 * (r1 + r2)
    v1 = circular_speed(r1, mu)
    v2 = circular_speed(r2, mu)
    vp = math.sqrt(mu * (2 / r1 - 1 / a_t))
    va = math.sqrt(mu * (2 / r2 - 1 / a_t))
    return vp - v1, v2 - va


if __name__ == "__main__":
    r = R_EARTH + 400e3
    print(f"v = {circular_speed(r):.1f} m/s, T = {period(r)/60:.1f} min")
```

The last block is a Python idiom you will see in every script. When a file is run directly, Python sets its `__name__` to the string `"__main__"`; when it is imported, `__name__` is the module's own name. The `if` therefore runs the demonstration only when you type `python3 orbits.py`, and stays silent when another file imports the module:

```python
# in the shell:  python3 orbits.py
# v = 7668.6 m/s, T = 92.6 min

# in another file or the REPL:
import orbits
print(orbits.period(orbits.R_EARTH + 400e3) / 60)   # 92.56040452087046
from orbits import delta_v
print(delta_v(311.0, 549_054.0, 25_000.0))          # 9422.021639032706
```

After the first import you will notice a `__pycache__` directory appear beside the file. It holds compiled bytecode that speeds up the next import; it is disposable and belongs in `.gitignore`, as the next lesson explains.

## Functions are values

A function name is itself a value that can be stored, passed to another function and called later. This matters more in scientific Python than almost anywhere else: `scipy.integrate.solve_ivp(fun, ...)` takes *your* function computing $d\mathbf{y}/dt$ as its first argument, and `scipy.optimize.brentq(f, a, b)` takes the function whose root you want. Small throwaway functions can be written inline with `lambda`:

```python
def apply_twice(func, x):
    return func(func(x))

print(apply_twice(lambda v: 2 * v, 3))                  # 12
print(sorted([("b", 2), ("a", 3)], key=lambda p: p[1]))  # [('b', 2), ('a', 3)]
```

A `lambda` takes arguments before the colon and returns the expression after it; it can hold only one expression, so anything longer deserves a `def` with a name.

::: example Hohmann transfer from a 400 km orbit to GEO
Using the module above, compute the two burns of a Hohmann transfer from a circular orbit at $400\,\mathrm{km}$ altitude ($r_1 = 6778.137\,\mathrm{km}$) to geostationary radius $r_2 = 42{,}164\,\mathrm{km}$. The transfer ellipse has semi-major axis $a_t = (r_1 + r_2)/2 = 24{,}471\,\mathrm{km}$; the speed at any point of an orbit follows from the vis-viva relation $v^2 = \mu\,(2/r - 1/a)$, which `hohmann` uses at perigee and apogee.

```python
from orbits import hohmann, R_EARTH
dv1, dv2 = hohmann(R_EARTH + 400e3, 42_164e3)
print(f"{dv1:.1f} {dv2:.1f} {dv1 + dv2:.1f}")   # 2397.5 1456.5 3854.0
```

The first burn adds $2397.5\,\mathrm{m/s}$ at perigee to stretch the orbit out to GEO radius; the second adds $1456.5\,\mathrm{m/s}$ at apogee to circularise; the total is $3854\,\mathrm{m/s}$, about half the speed of the starting orbit. Because `hohmann` returns a tuple, the two burns arrive with their own names instead of as anonymous positions in a list, and a caller who wants only the total can write `sum(hohmann(r1, r2))`.
:::

::: example A function that refuses bad input
Suppose a mission-planning script calls `delta_v` with the masses accidentally swapped. Without validation, `math.log(m0 / mf)` with $m_0 < m_f$ returns a negative number, the script prints a negative $\Delta v$, and the mistake may not be noticed until a review. With the check in place the script stops at the first wrong call with a message that names the rule:

```python
from orbits import delta_v
try:
    delta_v(311.0, 100.0, 200.0)
except ValueError as e:
    print("caught:", e)     # caught: need 0 < mf <= m0
```

Compare the two failure modes. A silent wrong answer costs however long it takes someone to notice; an exception costs one second and points at the line. Make your functions refuse what they cannot compute.
:::

::: key
`def name(params):` defines a function; `return` hands back a value (a tuple, for several); a function without `return` gives `None`. Parameters may have defaults, and callers may pass arguments positionally or as `keyword=value`.
:::

::: key
A docstring is the first string in a function body; it names the meaning and units of every parameter and the return value. Type hints such as `r: float -> float` document the intended types but are not enforced at run time.
:::

::: key
`raise ValueError("message")` stops a function on an input it cannot handle; `try: … except ValueError as err:` catches it in the caller. `assert cond, msg` raises `AssertionError` when `cond` is false.
:::

::: key
A `.py` file is a module. `import orbits` then `orbits.period(...)`; `from orbits import period`; `import numpy as np` for an alias. Code under `if __name__ == "__main__":` runs only when the file is executed directly, not when it is imported.
:::

::: warning Do not shadow built-ins
Names like `sum`, `min`, `max`, `list` and `len` are functions. Assigning `sum = 0` hides the function for the rest of the file, and the next `sum(values)` fails with `TypeError: 'int' object is not callable`. Pick `total`, `smallest`, `values` instead.
:::

::: warning Forgetting `return`
A function that computes the right value and then forgets to return it hands back `None`, and the error appears somewhere else entirely — `TypeError: unsupported operand type(s) for *: 'NoneType' and 'float'` two files away. When a `None` turns up where a number should be, look for the missing `return` first.
:::

## Check yourself

::: check
What does this print, and why?

```python
def scale(v, k=2.0):
    return v * k
a = scale(3.0)
b = scale(3.0, k=10.0)
c = scale(k=0.5, v=8.0)
print(a, b, c)
```
:::

::: answer
It prints `6.0 30.0 4.0`. The first call uses the default `k=2.0`; the second overrides it by keyword; the third passes both arguments by keyword, so their order does not matter. Keyword arguments are matched by name, positional ones by position.
:::

::: check
A colleague writes `def energy(r, v): 0.5 * v**2 - MU_EARTH / r` and reports that `energy(7e6, 7500.0) * 2` fails with a `TypeError` mentioning `NoneType`. What is wrong?
:::

::: answer
The body is an expression without `return`, so the function evaluates the energy and then discards it, returning `None`. Multiplying `None` by `2` raises the `TypeError`. The fix is `return 0.5 * v**2 - MU_EARTH / r`. (For $r = 7 \times 10^{6}\,\mathrm{m}$ and $v = 7500\,\mathrm{m/s}$ the specific energy is about $-2.88 \times 10^{7}\,\mathrm{J/kg}$: negative, as a bound orbit's must be.)
:::

::: check
Rewrite `circular_speed` so that it also rejects a non-positive `mu`, and show the call that would trigger the new check together with the message it produces.
:::

::: answer
```python
def circular_speed(r, mu=3.986004418e14):
    if r <= 0:
        raise ValueError(f"radius must be positive, got {r}")
    if mu <= 0:
        raise ValueError(f"mu must be positive, got {mu}")
    return math.sqrt(mu / r)

circular_speed(7e6, mu=-1.0)
# ValueError: mu must be positive, got -1.0
```

Each check names the parameter and echoes the offending value, so the traceback alone tells the caller what to fix.
:::

::: check
File `tools.py` contains a function `unit(v)` and, at the bottom, `print(unit((3, 0, 4)))` with no `if __name__ == "__main__":` guard. What happens when `analysis.py` runs `from tools import unit`, and how do you fix it?
:::

::: answer
Importing executes every top-level statement of `tools.py`, so the `print` runs and `(0.6, 0.0, 0.8)` appears in the output of `analysis.py` — every time, whether wanted or not. Wrap the demonstration in `if __name__ == "__main__":`. Then it runs only for `python3 tools.py`, because only a directly executed file has `__name__` equal to `"__main__"`.
:::

::: check
Why does `scipy.integrate.solve_ivp` need the ability to pass a function as an argument, and what would you pass?
:::

::: answer
`solve_ivp` integrates an ordinary differential equation numerically, and the equation is different for every problem. Rather than offering a menu of built-in equations it accepts *your* function — one that takes `(t, y)` and returns $d\mathbf{y}/dt$ — and calls it internally as often as the integration needs. You pass the function object itself (`solve_ivp(two_body, ...)`, without parentheses); writing `two_body(...)` would call it once and pass the resulting numbers instead.
:::

## Summary

| Construct | Syntax | Notes |
| --- | --- | --- |
| Function | `def f(a, b=1.0):` … `return x, y` | defaults; tuple return; `None` if no `return` |
| Call | `f(3.0)`, `f(3.0, b=2.0)`, `f(b=2.0, a=3.0)` | positional then keyword |
| Docstring | first string in the body; NumPy style with units | `help(f)`, `f.__doc__` |
| Type hints | `def f(r: float) -> float:` | documentation, not enforcement |
| Scope | locals vanish at return; module names readable | assign inside makes a new local |
| Raise | `raise ValueError(f"radius must be positive, got {r}")` | validate at the top |
| Catch | `try:` … `except ValueError as err:` | catch only what you can handle |
| Assert | `assert 7000 < v < 8000, msg` | one-line sanity check |
| Import | `import orbits`, `from orbits import period`, `import numpy as np` | one `.py` file = one module |
| Script guard | `if __name__ == "__main__":` | runs only when executed directly |
| Function values | `solve_ivp(fun, ...)`, `lambda v: 2 * v` | pass the name, no parentheses |

The next lesson sets up the workbench around code like `orbits.py`: an isolated environment with NumPy installed, a notebook for exploring, and a git repository that records every version from the first commit.
