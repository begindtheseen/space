---
id: l02-functions-modules
title: Functions, errors and modules
minutes: 21
covers:
  - Python syntax, control flow, functions, classes
---

Think of a kitchen blender. You put things in the top, press one button, and something useful comes out the bottom. You do not rebuild the blender every time you want a smoothie, and you do not need to know how the motor is wired to use it.

The two tables you printed in the last lesson were correct, but they were throwaway. To work out an orbital speed again, you would have to find the loop, copy the formula and retype the constants. Real engineering code is organized like a kitchen full of blenders. A calculation with a name, a clear list of inputs and one well-defined output is a **function**. A file of related functions and constants is a **module**. And a module that checks its inputs and fails loudly on nonsense is one you can trust in someone else's hands.

This lesson builds a small module, `orbits.py`, that later lessons and the module's exercises lean on. Along the way you learn how Python reports an error, how to raise one on purpose, and how to check a result with `assert` — the seed of the testing habit that gets its own lesson later. GNC teams depend on exactly this structure. A flight-dynamics group's orbit propagator (the code that predicts where a spacecraft will be), its coordinate conversions and its maneuver planner are all modules full of functions, and every one of them started as a few lines like the ones below.

## Defining and calling functions

A function starts with the word `def` (short for define), then a name, then a list of **parameters** in parentheses, then a colon. Parameters are the named slots for the inputs. The indented lines below are the **body**.

Nothing in the body runs when Python reads the `def`. It runs each time the function is **called** — that is, used, by writing its name followed by parentheses. The values you put in the parentheses of a call are the **arguments**; each one fills a parameter slot. `return` hands a value back to the caller and ends the call.

```python
import math

def circular_speed(r, mu=3.986004418e14):
    return math.sqrt(mu / r)

print(circular_speed(6_778_137))                  # 7668.558175407055
print(circular_speed(6_778_137, 4.9048695e12))    # 850.6649857923778  (the Moon's mu)
print(circular_speed(mu=4.9048695e12, r=6_778_137))   # 850.6649857923778
```

Look at the second parameter, `mu=3.986004418e14`. That `=` gives it a **default value**. If a caller leaves `mu` out, it gets Earth's value. The second call passes the Moon's $\mu$ instead, which gives the speed of an orbit at the same distance from the Moon's center — much slower, because the Moon's gravity is much weaker.

There are two ways to pass arguments:

- **positionally** — in order, so the first value fills the first slot;
- **by keyword** — as `name=value`, in any order, as in the third call.

Keyword arguments make a call easy to read. In `solve_ivp(fun, t_span, y0, rtol=1e-12)`, a SciPy tool you will meet later, the `rtol=` tells you exactly which knob is being turned. Every scientific library you meet uses them heavily.

### No `return`, and more than one return value

A function that reaches the end of its body without a `return` hands back the special value `None` — "nothing here". That is what `print` returns, so `result = print("hi")` leaves `result` holding `None`.

To return several things at once, return a tuple and unpack it where you call the function:

```python
def stats(values):
    n = len(values)
    mean = sum(values) / n
    var = sum((v - mean) ** 2 for v in values) / (n - 1)
    return mean, math.sqrt(var)

m, s = stats([7784.3, 7668.6, 7451.9])
print(m, s)   # 7634.933333333334 168.73803167434852
```

Step by step: `n` is the count, 3. `mean` is the average. `var` is the **variance** — the average squared distance from the mean — and its square root is the standard deviation, a measure of spread. The formula divides by $n - 1$ rather than $n$, which makes it the **[[sample standard deviation|sample-sd]]**:

$$
s = \sqrt{\frac{\sum_{i}(v_i - \bar{v})^2}{n - 1}}.
$$

Here $\bar{v}$, read "v bar", is the mean, and $\sum_i$, read "sum over i", adds up one term for each value. Does $168.7\,\mathrm{m/s}$ make sense? The three speeds run from about $7452$ to $7784$, a spread of about $330\,\mathrm{m/s}$, so a typical distance from the middle of about half that is right.

The piece `sum((v - mean) ** 2 for v in values)` is a **generator expression**: a list comprehension without the square brackets, fed straight into `sum`. It never builds the list in memory; it hands the values to `sum` one at a time.

## Docstrings and type hints

A blender comes with a label: what goes in, what comes out, and a warning not to put your hand inside. Functions get labels too.

The first line of a function body may be a string, called the **docstring**. It says what the function does, what each parameter means and in what units, and what comes back. Python stores it as `circular_speed.__doc__` and shows it when you type `help(circular_speed)`. Write one for every function that outlives a quick experiment, and **[[always name the units|units-mars]]**. A bare `r` could be meters, kilometers or Earth radii, and the next reader — often you, three months from now — has no way to tell.

The NumPy documentation style, which this module's exercises use, looks like this:

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

The three quote marks `"""` start and end a string that can run over several lines.

The `: float` after each parameter and the `-> float` after the parentheses (read "returns float") are **type hints**. They are notes about what kind of value belongs in each slot, written so that tools can read them. A code editor will flag `delta_v("311", 1, 2)` before you even run it, because `"311"` is text, not a number.

Python itself does *not* check them. They are stored in `delta_v.__annotations__`, and passing the wrong type still runs until something inside fails. Use them anyway. A first line such as `def monte_carlo_range(v0: float, n: int) -> np.ndarray` (an `np.ndarray` is a NumPy array, coming in a later lesson) is the fastest documentation there is.

## Scope

Imagine a hotel room with a whiteboard. Whatever a guest writes on it is wiped when they check out, and it never appears on the whiteboard in the lobby. The guest can still *read* the lobby board on the way in.

Functions work the same way. Names created inside a function are **[[local|scope-boxes]]**: they appear when the call starts and vanish when it returns, and they never disturb names outside. A function may *read* a name from the module around it — that is how `MU_EARTH` at the top of a file is visible to every function in it. But *assigning* to that name inside the function creates a new local name instead.

```python
x = 10
def f():
    x = 20        # a new local x; the module-level x is untouched
    return x
print(f(), x)     # 20 10
```

Treat module-level names as constants. A function whose answer depends on hidden values that some other function changed is very hard to reason about, and nearly impossible to test. Pass everything a function needs in through its parameters, and return everything it produces.

::: warning Mutable default arguments are evaluated once
A default value is worked out once, when the `def` line runs — not fresh at each call. So a default that can be changed, such as an empty list, is *shared* between calls. The second call sees what the first one added:

```python
def add_item(item, box=[]):
    box.append(item)
    return box
print(add_item(1), add_item(2))   # [1, 2] [1, 2]
```

The fix is a `None` default that the body replaces with a fresh list on every call:

```python
def add_item(item, box=None):
    if box is None:
        box = []
    box.append(item)
    return box
print(add_item(1), add_item(2))   # [1] [2]
```
:::

## Errors and exceptions

When Python cannot carry on, it **raises an exception** — it stops what it is doing and reports what went wrong. If nothing catches the exception, Python prints a **[[traceback|traceback-stack]]** and the program ends.

Read a traceback from the bottom up. The last line names the exception and gives a message. The lines above it show the chain of calls that led there, with the innermost call last. The names are worth learning, because each one tells you what kind of mistake happened:

- `ValueError` — the right type, but a value that makes no sense: `float("abc")`, or `math.sqrt(-1)`, which says "math domain error";
- `TypeError` — the wrong type: `"3" + 4` says "can only concatenate str (not "int") to str";
- `ZeroDivisionError` — `1/0`, "division by zero";
- `IndexError` — `[1, 2, 3][5]`, "list index out of range";
- `KeyError` — looking up a key a dictionary does not have;
- `NameError` — a name that was never created, often a typo.

### Raising your own

You raise an exception yourself with `raise`, and you should do it the moment a function gets an input that cannot be right. Give `circular_speed` a negative radius and it fails deep inside `sqrt` with "math domain error" — which says nothing about radii. A check at the top of the function gives a message that names the real problem:

```python
def circular_speed(r: float, mu: float = 3.986004418e14) -> float:
    """Speed of a circular orbit of radius r (m), in m/s."""
    if r <= 0:
        raise ValueError(f"radius must be positive, got {r}")
    return math.sqrt(mu / r)
```

### Catching

The caller can **catch** an exception with `try` and `except`, and decide what to do: record it, use a fallback value, or raise it again. Catch only what you expect and know how to handle. A bare `except:` that swallows everything hides bugs.

```python
try:
    circular_speed(-1)
except ValueError as err:
    print("caught:", err)     # caught: radius must be positive, got -1
```

The module's vector exercise asks for a `normalized()` method that raises `ZeroDivisionError` on a zero vector "rather than returning NaN". This is the same idea. A zero vector has no direction. A loud failure at the spot where the mistake happened beats a silent **[[NaN|nan-spreads]]** — "not a number" — that travels on into a guidance command.

```python
def safe_direction(x, y, z):
    n = math.sqrt(x*x + y*y + z*z)
    if n == 0.0:
        raise ZeroDivisionError("cannot normalize the zero vector")
    return x/n, y/n, z/n

print(safe_direction(3.0, 0.0, 4.0))   # (0.6, 0.0, 0.8)
```

Check the answer: the length of $(3, 0, 4)$ is $\sqrt{9 + 0 + 16} = 5$, and dividing each part by 5 gives $(0.6, 0, 0.8)$, an arrow of length 1 pointing the same way.

### Asserting

Finally, `assert condition, message` does nothing when the condition is true, and raises `AssertionError` with the message when it is false. It is a one-line sanity check — "this speed must lie between 7 and 8 km/s" — and it is exactly the statement the pytest lesson grows into a full test suite.

```python
v = circular_speed(6_778_137)
assert 7000 < v < 8000, f"unexpected v={v}"
```

## Modules and imports

Any file named `orbits.py` is a module named `orbits`. Another file in the same folder can write `import orbits` and then reach what is inside with a dot, as in `orbits.period(...)`. Or it can pull in particular names with `from orbits import delta_v`.

The form `import numpy as np` gives a module a short nickname. `np` for NumPy, `plt` for `matplotlib.pyplot` and `sp` for SciPy are habits the whole Python community shares, and this course follows them too.

Here is the module this lesson has been building. Save it as `orbits.py`:

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

`period` uses the formula $T = 2\pi\sqrt{r^3/\mu}$ for the time of one trip around a circular orbit. `hohmann` is explained in the first example below.

### Run it, or import it?

The last block is **[[a Python idiom|dunder-main]]** you will see in almost every script. When you run a file directly, Python sets a hidden variable `__name__` (read "dunder name", for the double underscores) to the text `"__main__"`. When another file imports it, `__name__` is the module's own name instead. So the `if` runs the little demonstration only when you type `python3 orbits.py`, and stays quiet when another file imports the module:

```python
# in the shell:  python3 orbits.py
# v = 7668.6 m/s, T = 92.6 min

# in another file or the REPL:
import orbits
print(orbits.period(orbits.R_EARTH + 400e3) / 60)   # 92.56040452087046
from orbits import delta_v
print(delta_v(311.0, 549_054.0, 25_000.0))          # 9422.021639032706
```

A space station at $400\,\mathrm{km}$ goes round the Earth in about $92.6$ minutes — roughly sixteen orbits a day, which matches what you may have heard about astronauts seeing sixteen sunrises.

After the first import, a folder called `__pycache__` appears next to the file. It holds **[[compiled bytecode|bytecode]]** that makes the next import faster. You can delete it at any time, and it belongs in `.gitignore`, as the next lesson explains.

## Functions are values

A function's name is itself a value. You can store it, hand it to another function, and call it later — the way you might hand a friend a recipe card rather than a finished cake.

This matters more in scientific Python than almost anywhere else. `scipy.integrate.solve_ivp(fun, ...)` takes *your* function, the one that computes $d\mathbf{y}/dt$ (read "d y by d t", how fast the state is changing), as its first argument. `scipy.optimize.brentq(f, a, b)` takes the function whose zero you want to find.

Small throwaway functions can be written in one line with a **[[lambda|lambda-name]]**:

```python
def apply_twice(func, x):
    return func(func(x))

print(apply_twice(lambda v: 2 * v, 3))                  # 12
print(sorted([("b", 2), ("a", 3)], key=lambda p: p[1]))  # [('b', 2), ('a', 3)]
```

`lambda v: 2 * v` means "a function that takes `v` and returns `2 * v`". Applied twice to 3 it gives $2 \times 3 = 6$, then $2 \times 6 = 12$. In the second line, `key=lambda p: p[1]` tells `sorted` to order the pairs by their second item, so `2` comes before `3`.

A `lambda` takes its inputs before the colon and returns the one expression after it. Anything longer deserves a proper `def` with a name.

::: example Hohmann transfer from a 400 km orbit to GEO
Use the module to work out the two burns of a **[[Hohmann transfer|hohmann-picture]]** — the classic two-burn way to move between circular orbits — from a circular orbit at $400\,\mathrm{km}$ altitude, $r_1 = 6778.137\,\mathrm{km}$, to geostationary orbit, or GEO, at $r_2 = 42{,}164\,\mathrm{km}$ — the distance at which a satellite circles once a day and seems to hang still above one spot on the equator.

The transfer path is half an ellipse. Its **semi-major axis** — half its longest width — is the average of the two radii:

$$
a_t = \frac{r_1 + r_2}{2} = \frac{6778.137 + 42{,}164}{2} \approx 24{,}471\,\mathrm{km}.
$$

The speed at any point of an orbit comes from the **[[vis-viva relation|vis-viva]]**,

$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right),
$$

which `hohmann` uses at the low point (perigee, $r = r_1$) and the high point (apogee, $r = r_2$) of the transfer ellipse. Each burn is the difference between the speed you need and the speed you have.

```python
from orbits import hohmann, R_EARTH
dv1, dv2 = hohmann(R_EARTH + 400e3, 42_164e3)
print(f"{dv1:.1f} {dv2:.1f} {dv1 + dv2:.1f}")   # 2397.5 1456.5 3854.0
```

The first burn adds $2397.5\,\mathrm{m/s}$ at perigee, stretching the orbit out until its far end reaches GEO. The second adds $1456.5\,\mathrm{m/s}$ at apogee to make the orbit round again. The total is $3854\,\mathrm{m/s}$.

Does that make sense? The starting orbit moves at about $7669\,\mathrm{m/s}$, so the whole trip costs about half the speed you already have — a big but believable number, which is why satellites heading to GEO need a powerful upper stage or a long ride on their own engines.

Because `hohmann` returns a tuple, the two burns arrive with their own names instead of as unnamed slots in a list. A caller who wants only the total can write `sum(hohmann(r1, r2))`.
:::

::: example A function that refuses bad input
Suppose a mission-planning script calls `delta_v` with the two masses swapped by accident. Without the check, $m_0 < m_f$ makes $m_0/m_f$ less than 1, so the logarithm is negative. The script prints a negative $\Delta v$, and nobody may notice until a design review.

With the check in place, the script stops at the first wrong call, with a message that states the rule:

```python
from orbits import delta_v
try:
    delta_v(311.0, 100.0, 200.0)
except ValueError as e:
    print("caught:", e)     # caught: need 0 < mf <= m0
```

Compare the two ways of failing. A silent wrong answer costs however long it takes someone to notice it — days, or never. An exception costs one second and points at the exact line. Make your functions refuse what they cannot compute.
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
Names like `sum`, `min`, `max`, `list` and `len` are already functions. Writing `sum = 0` hides the function for the rest of the file, and the next `sum(values)` fails with `TypeError: 'int' object is not callable`. Pick `total`, `smallest` or `values` instead.
:::

::: warning Forgetting `return`
A function that works out the right value and then forgets to return it hands back `None`. The error then shows up somewhere else entirely — `TypeError: unsupported operand type(s) for *: 'NoneType' and 'float'`, two files away. When a `None` turns up where a number should be, look for the missing `return` first.
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
It prints `6.0 30.0 4.0`.

- The first call leaves `k` out, so it uses the default: $3.0 \times 2.0 = 6.0$.
- The second call sets `k` by keyword: $3.0 \times 10.0 = 30.0$.
- The third passes both by keyword, so their order does not matter: $8.0 \times 0.5 = 4.0$.

Keyword arguments are matched by name; positional ones by position.
:::

::: check
A colleague writes `def energy(r, v): 0.5 * v**2 - MU_EARTH / r` and reports that `energy(7e6, 7500.0) * 2` fails with a `TypeError` mentioning `NoneType`. What is wrong?
:::

::: answer
The body works out the energy and then throws it away, because there is no `return`. So the function hands back `None`, and `None * 2` raises the `TypeError`. The fix is `return 0.5 * v**2 - MU_EARTH / r`.

As a check on the physics: for $r = 7 \times 10^{6}\,\mathrm{m}$ and $v = 7500\,\mathrm{m/s}$, the energy per kilogram is $28{,}125{,}000 - 56{,}942{,}920 \approx -2.88 \times 10^{7}\,\mathrm{J/kg}$. It is negative, as it must be for an orbit that stays bound to Earth.
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

Each check names the parameter and repeats the bad value, so the traceback alone tells the caller what to fix.
:::

::: check
File `tools.py` contains a function `unit(v)` and, at the bottom, `print(unit((3, 0, 4)))` with no `if __name__ == "__main__":` guard. What happens when `analysis.py` runs `from tools import unit`, and how do you fix it?
:::

::: answer
Importing a module runs every top-level line in it. So the `print` runs, and `(0.6, 0.0, 0.8)` appears in the output of `analysis.py` — every time, wanted or not.

The fix is to put the demonstration under `if __name__ == "__main__":`. Then it runs only for `python3 tools.py`, because only a file run directly has `__name__` equal to `"__main__"`.
:::

::: check
Why does `scipy.integrate.solve_ivp` need to accept a function as an argument, and what would you pass?
:::

::: answer
`solve_ivp` steps a differential equation forward in time, and the equation is different for every problem. So instead of offering a menu of built-in equations, it accepts *your* function — one that takes `(t, y)` and returns $d\mathbf{y}/dt$ — and calls it as often as it needs.

You pass the function itself, without parentheses: `solve_ivp(two_body, ...)`. Writing `two_body(...)` would call it once, right there, and pass the resulting numbers instead of the function.
:::

## Summary

| Construct | Syntax | Notes |
| --- | --- | --- |
| Function | `def f(a, b=1.0):` … `return x, y` | defaults; tuple return; `None` if no `return` |
| Call | `f(3.0)`, `f(3.0, b=2.0)`, `f(b=2.0, a=3.0)` | positional then keyword |
| Docstring | first string in the body; NumPy style with units | `help(f)`, `f.__doc__` |
| Type hints | `def f(r: float) -> float:` | documentation, not enforcement |
| Scope | locals vanish at return; module names readable | assign inside makes a new local |
| Raise | `raise ValueError(f"radius must be positive, got {r}")` | check inputs at the top |
| Catch | `try:` … `except ValueError as err:` | catch only what you can handle |
| Assert | `assert 7000 < v < 8000, msg` | one-line sanity check |
| Import | `import orbits`, `from orbits import period`, `import numpy as np` | one `.py` file = one module |
| Script guard | `if __name__ == "__main__":` | runs only when executed directly |
| Function values | `solve_ivp(fun, ...)`, `lambda v: 2 * v` | pass the name, no parentheses |

The next lesson sets up the workbench around code like `orbits.py`: a private environment with NumPy installed, a notebook for exploring, and a git repository that records every version from the very first commit.

::: context sample-sd Why divide by n − 1
You almost never have every possible measurement — only a sample. The sample's own mean sits, by construction, right in the middle of the sample, so the values look a little closer to it than they are to the true mean. Dividing by $n$ would therefore guess the spread too small. Dividing by $n - 1$ corrects for this, so the variance comes out right on average. With thousands of samples the difference is tiny; with three, as here, it matters. NumPy's `np.std` divides by $n$ unless you pass `ddof=1`.
:::

::: context units-mars The spacecraft lost to a unit
In September 1999, NASA's Mars Climate Orbiter was lost as it arrived at Mars. The investigation found that one piece of ground software reported thruster impulse in pound-force seconds, while the software that used those numbers expected newton-seconds. One pound-force is about $4.45$ newtons, so every small thruster firing was under-counted by that factor, the trajectory drifted, and the spacecraft passed far too low through the Martian atmosphere. Nothing in the numbers themselves said which unit they were in. A docstring that names the units is the cheapest defense there is.
:::

::: context scope-boxes Local names live in their own box
Each call gets its own box of names. The function can see out of its box, but anything it creates stays inside and is thrown away when it returns.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="150" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="22" y="30" font-size="12" fill="#1f2a44" font-weight="700">module (the whole file)</text>
  <text x="22" y="52" font-size="13" fill="#1d6fd1">x = 10</text>
  <rect x="140" y="45" width="195" height="100" rx="8" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="152" y="65" font-size="12" fill="#1f2a44" font-weight="700">inside f(), while it runs</text>
  <text x="152" y="88" font-size="13" fill="#b4232c">x = 20</text>
  <text x="152" y="108" font-size="11" fill="#1f2a44">a new local name</text>
  <text x="152" y="130" font-size="11" fill="#1f2a44">wiped when f returns</text>
  <line x1="140" y1="48" x2="82" y2="48" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polygon points="74,48 82,44 82,52" fill="#6c7a93"/>
  <text x="72" y="72" font-size="11" fill="#6c7a93">can read</text>
  <text x="72" y="86" font-size="11" fill="#6c7a93">outward</text>
</svg>
```

So after `f()` runs, the module's `x` is still `10`.
:::

::: context traceback-stack Reading a traceback
A traceback lists the calls that were in progress when the error happened, outermost first. Here a script called `circular_speed` with a negative radius, before the input check was added.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="275" height="36" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="32" font-size="11" fill="#1f2a44">plan.py, line 3: circular_speed(-6.778e6)</text>
  <rect x="10" y="60" width="275" height="36" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="82" font-size="11" fill="#1f2a44">orbits.py, line 5: math.sqrt(mu / r)</text>
  <rect x="10" y="110" width="275" height="36" rx="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="20" y="132" font-size="12" fill="#b4232c">ValueError: math domain error</text>
  <line x1="135" y1="46" x2="135" y2="54" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="135,60 131,52 139,52" fill="#1f2a44"/>
  <line x1="135" y1="96" x2="135" y2="104" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="135,110 131,102 139,102" fill="#1f2a44"/>
  <line x1="305" y1="128" x2="305" y2="34" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="305,26 300,36 310,36" fill="#1d6fd1"/>
  <text x="313" y="72" font-size="11" fill="#1d6fd1">read</text>
  <text x="313" y="86" font-size="11" fill="#1d6fd1">upward</text>
  <text x="10" y="170" font-size="11" fill="#6c7a93">Start at the red box, then climb to find the cause.</text>
</svg>
```

The bottom line says *what* failed. The line above it says *where*. The top line says which of *your* calls started the chain — usually the place to fix.
:::

::: context nan-spreads Why NaN is dangerous
**NaN** stands for "not a number". It is a special float that comes out of calculations with no sensible answer, such as $0/0$ done in floating point. The trouble is that it spreads: any arithmetic with a NaN gives NaN, so one bad value quietly poisons every result computed from it. It even refuses to equal itself — `x == x` is `False` when `x` is NaN. A guidance loop fed a NaN can command an actuator with garbage and never raise an error. Failing loudly at the source is much safer.
:::

::: context dunder-main Double underscores
Names with two underscores on each side, like `__name__`, `__init__` and `__doc__`, are special names that Python itself uses. Programmers say "dunder" for "double underscore", so `__main__` is "dunder main". You do not invent names in this style; you use the ones Python defines. `__main__` is the name Python gives to whichever file you started the program with.
:::

::: context bytecode What bytecode is
Before Python runs your file, it translates it into **bytecode** — a compact list of simple instructions that the interpreter can carry out quickly. The translation takes a moment, so Python saves it in `__pycache__` and reuses it next time, as long as the source file has not changed. The files there end in `.pyc`. They are made for your exact Python version, which is one more reason never to share or commit them.
:::

::: context lambda-name Why "lambda"
The name comes from the Greek letter $\lambda$ (lambda). In the 1930s the mathematician Alonzo Church used it in a notation for describing functions without naming them, called the lambda calculus. Many programming languages borrowed the word for an unnamed, one-line function. In Python, `lambda x: x * x` and `def square(x): return x * x` make the same function; only the `def` version gets a name.
:::

::: context hohmann-picture The transfer, drawn to scale
The small circle is the $400\,\mathrm{km}$ orbit, hugging the Earth. The big circle is GEO. The transfer is the solid half of an ellipse that touches both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="250" cy="100" r="85" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M263.66,100 A49.33,34.08 0 0,1 165,100" fill="none" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M263.66,100 A49.33,34.08 0 0,0 165,100" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="250" cy="100" r="12.86" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="250" cy="100" r="13.66" fill="none" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="263.66" cy="100" r="3.5" fill="#b4232c"/>
  <circle cx="165" cy="100" r="3.5" fill="#b4232c"/>
  <text x="270" y="80" font-size="11" fill="#b4232c">burn 1</text>
  <text x="270" y="93" font-size="11" fill="#b4232c">+2398 m/s</text>
  <text x="102" y="95" font-size="11" fill="#b4232c">burn 2</text>
  <text x="84" y="108" font-size="11" fill="#b4232c">+1457 m/s</text>
  <text x="10" y="30" font-size="11" fill="#6c7a93">GEO, r = 42,164 km</text>
  <line x1="254" y1="112" x2="262" y2="140" stroke="#1f2a44" stroke-width="1"/>
  <text x="236" y="153" font-size="11" fill="#1f2a44">400 km orbit</text>
  <text x="200" y="55" font-size="11" fill="#1d6fd1">transfer</text>
</svg>
```

Burn 1 speeds up at the low point to stretch the orbit. Half an orbit later, burn 2 speeds up again at the high point to make it round. The trip takes about five and a quarter hours.
:::

::: context vis-viva The vis-viva relation
"Vis viva" is Latin for "living force", an old name for what we now call kinetic energy. The relation $v^2 = \mu(2/r - 1/a)$ is really energy bookkeeping: an orbiting object trades speed for height and back, like a ball rolling in a bowl. Closer to the planet ($r$ small) it moves faster; farther out it moves slower. For a circle, $r = a$ everywhere, and the formula gives back $v = \sqrt{\mu/r}$.
:::
