---
id: l12-docstrings-and-doctest
title: Docstrings in NumPy style, and doctest
minutes: 19
covers:
  - Docstrings in NumPy style and doctest
---

Pick up a box of cake mix. The back tells you everything you need without opening it: what you add (two eggs, one cup of water), what you get (a 23 cm cake that serves eight), a warning (bake at 180 °C, not higher), and a photo of how it should look when it is done. You do not need to know how the mix was made to use it well.

A function in a shared library needs the same label. Someone on another team will call your `delta_v` from a trajectory script at two in the morning. They need to know what goes in, in what units, what comes out, what makes it refuse, and what a correct answer looks like. They should not have to read the body to find out. That label is a **docstring**: a piece of text written inside the function that says how to use it.

This lesson shows how to write docstrings in the **NumPy style** that most scientific Python follows, and how **doctest** turns the examples in a docstring into small tests, so the label on the box cannot quietly drift away from what is inside. It closes the module: tests check the behavior, linters check the shape, and docstrings make the code usable by the next person.

## Comments and docstrings

Python has two ways to put words in code, and they have different jobs.

A **comment** starts with `#`. Python throws it away before running anything. Comments are for the next person *reading the code*: why this line is written this odd way, which paper an equation came from, what a magic number means.

A **docstring** is a string literal placed as the very first statement inside a function, class or module. Python keeps it and stores it on the object in an attribute named `__doc__`, read aloud as **[[dunder doc|dunder-doc]]**. Docstrings are for the next person *using the code*, who may never see its body. The built-in `help()` function prints them:

```python
import rocket
help(rocket.delta_v)
```

```text
Help on function delta_v in module rocket:

delta_v(isp, m0, mf)
    Ideal speed change of a rocket burning from mass `m0` down to `mf`.

    Uses the ideal rocket equation. Gravity, drag and steering losses
    are ignored, so a real vehicle gets less than this.

    Parameters
    ----------
    isp : float
    ...
```

Editors show the same text when you hover over a function name, and documentation tools turn it into web pages. So the docstring is the one piece of documentation that travels everywhere the function goes.

The basic rules come from a Python style guide called **[[PEP 257|pep-257]]**. Use triple double quotes, `"""`, so the text can run over several lines. Start with a **summary line**: one line, ending with a period, that says what the function does. If there is more to say, leave a blank line after the summary and keep going.

::: key
A **docstring** is a string literal as the first statement of a function, class or module. Python stores it in `__doc__`, and `help()` and editors display it. Comments (`#`) explain the code to readers; docstrings explain how to use it.
:::

## The NumPy docstring style

A summary line is not enough for scientific code. The caller needs units, shapes, allowed ranges and what happens on bad input. The **[[NumPy docstring style|numpy-style]]** is an agreed layout for all of that, used by NumPy, SciPy, pandas, matplotlib and most of the scientific Python world. It splits the docstring into **sections**, each with a title underlined by dashes the same length as the title.

Here is the rocket-equation function from lesson 1, now with a full NumPy-style docstring:

```python
"""Rocket-equation helpers for quick sizing studies."""

import math

G0 = 9.80665  # m/s^2, standard gravity


def delta_v(isp, m0, mf):
    r"""
    Ideal speed change of a rocket burning from mass `m0` down to `mf`.

    Uses the ideal rocket equation. Gravity, drag and steering losses
    are ignored, so a real vehicle gets less than this.

    Parameters
    ----------
    isp : float
        Specific impulse of the engine, in seconds.
    m0 : float
        Mass at the start of the burn, in kilograms.
    mf : float
        Mass at the end of the burn, in kilograms. Must satisfy
        ``0 < mf <= m0``.

    Returns
    -------
    float
        Speed change, in meters per second. Zero when ``mf == m0``.

    Raises
    ------
    ValueError
        If `mf` is not positive or is larger than `m0`.

    See Also
    --------
    math.log : The natural logarithm used here.

    Notes
    -----
    The ideal rocket equation is

    .. math:: \Delta v = I_{sp}\, g_0 \ln(m_0 / m_f)

    with :math:`g_0 = 9.80665` m/s^2.

    Examples
    --------
    >>> round(delta_v(311.0, 549_000.0, 138_000.0), 1)
    4211.4
    >>> delta_v(300.0, 1000.0, 1000.0)
    0.0
    >>> delta_v(300.0, 1000.0, 0.0)
    Traceback (most recent call last):
        ...
    ValueError: need m0 >= mf > 0
    """
    if mf <= 0 or m0 < mf:
        raise ValueError("need m0 >= mf > 0")
    return isp * G0 * math.log(m0 / mf)
```

Walk down it section by section.

- **Summary line**, then an **extended summary**: what the function does, in one line, then a short paragraph on what it leaves out. "Losses are ignored" is exactly the kind of fact a caller needs and would never guess.
- **Parameters**: one entry per argument. The first line is `name : type` — the name, a space, a colon, a space, the type. The indented lines below describe it. **Put the units here.** "Mass at the start of the burn, in kilograms" is the most important sentence in this docstring.
- **Returns**: the type of what comes back, and what it means, with units.
- **Raises**: which errors the function raises on purpose, and when.
- **See Also**: related functions, each with a short note.
- **Notes**: the method, equations and caveats. The equation is written in a markup that documentation tools render as math. Read $\Delta v$ as "delta v", the change in speed.
- **Examples**: short sessions at the Python prompt showing real calls and their real output. The next section turns these into tests.

Only include the sections you need, but keep them in this order. Inside the text, a name wrapped in single backticks refers to a parameter or another function, and a piece wrapped in double backticks, such as the condition on `mf`, is literal code.

Notice the `r` before the opening quotes. It makes the docstring a **[[raw string|raw-docstring]]**, where a backslash is kept as a plain character. Without it, the `\l` in `\ln` would be fine but a `\t` or `\a` in some other formula would silently turn into a tab or a bell character. Any docstring with a backslash in it should be raw.

::: key
A **NumPy-style docstring** has a one-line summary, then underlined sections in this order: Parameters, Returns, Raises, See Also, Notes, References, Examples (plus an optional extended summary after the summary line). Each parameter is written `name : type` with a description, and the description states units.
:::

::: example Checking the example in the docstring by hand
The first example claims that a stage burning from $549{,}000\,\mathrm{kg}$ down to $138{,}000\,\mathrm{kg}$ with $I_{sp} = 311\,\mathrm{s}$ (read "I s p", the specific impulse) gains $4211.4\,\mathrm{m/s}$. A reader should be able to trust that number, so check it.

**Mass ratio.** Divide the start mass by the end mass:

$$
\frac{m_0}{m_f} = \frac{549{,}000}{138{,}000} \approx 3.978.
$$

**Natural logarithm.** $\ln 3.978 \approx 1.3808$.

**Exhaust speed.** Multiply the specific impulse by standard gravity: $311 \times 9.80665 \approx 3049.9\,\mathrm{m/s}$.

**Multiply.**

$$
\Delta v = 3049.9 \times 1.3808 \approx 4211.4\,\mathrm{m/s}.
$$

**Does it make sense?** A mass ratio of about $4$ gives a speed change of about $1.4$ exhaust speeds, since $\ln 4 \approx 1.39$. And $4.2\,\mathrm{km/s}$ is a believable first-stage contribution — a bit more than half of the roughly $7.7\,\mathrm{km/s}$ needed to stay in low orbit, before any losses. The second example needs no arithmetic: when $m_f = m_0$ nothing was burned, $\ln 1 = 0$, and the speed change is exactly $0.0$.
:::

Tools can check the layout for you. The **numpydoc** package, which also renders these docstrings into web pages, has a command that lists what a docstring is missing. Here it is on a thin one:

```python
def burn_time(dv, accel):
    """compute burn time"""
    return dv / accel
```

```text
$ numpydoc lint thin.py
thin.py:1: SS02 Summary does not start with a capital letter
thin.py:1: SS03 Summary does not end with a period
thin.py:1: PR01 Parameters {'accel', 'dv'} not documented
thin.py:1: RT01 No Returns section found
thin.py:1: EX01 No examples section found
...
```

On the full `delta_v` above, the same command prints nothing and exits with code $0$. Like ruff in the last lesson, it can run as a pre-commit hook.

::: warning A docstring without units
`dv : float` followed by "The velocity change" is a trap. Meters per second, or feet per second, or kilometers per second? The type `float` cannot say, and the caller will guess. Every physical quantity in a Parameters or Returns entry names its unit, and every angle says degrees or radians. Naming the argument with its unit too, as in `dv_mps`, is a cheap second guard.
:::

## doctest: examples that run

Documentation has a way of going stale. Someone changes the code, the tests get updated, and the example in the docstring keeps showing the old answer for years. A reader copies it, gets a different number, and stops trusting the whole page.

**doctest**, a module in Python's standard library, fixes that by running the examples. It scans docstrings for lines that start with `>>>`, the **[[Python prompt|python-prompt]]**. Each such line is run as code. The lines right after it, up to the next blank line or `>>>`, are the **expected output**. doctest compares what the code actually prints, as text, with what the docstring says it prints.

- A line starting with `...` continues the statement above it, the way the interactive prompt shows a multi-line statement.
- A statement that prints nothing, such as an assignment, has no expected-output lines.
- An expected exception is written as `Traceback (most recent call last):`, a line of `...` standing in for the traceback details, then the error line. doctest checks only the first and last parts.

Run doctest on a file with `python -m doctest`. On success it prints nothing at all and exits with code $0$. Add `-v` to see each example:

```text
$ python -m doctest -v rocket.py
Trying:
    round(delta_v(311.0, 549_000.0, 138_000.0), 1)
Expecting:
    4211.4
ok
...
1 items passed all tests:
   3 tests in rocket.delta_v
3 tests in 2 items.
3 passed and 0 failed.
Test passed.
```

In a project you usually let pytest collect doctests along with everything else. The flag `--doctest-modules` tells pytest to import every module and run the examples in its docstrings:

```text
$ pytest --doctest-modules -q rocket.py
.                                                                        [100%]
1 passed in 0.12s
```

pytest counts each docstring as one test: all three examples in `delta_v` together make the one dot. Put the flag in your configuration (`addopts = "--doctest-modules"` under `[tool.pytest.ini_options]` in `pyproject.toml`) and the examples run every time the suite does.

::: key
**doctest** runs the `>>>` lines in docstrings and compares the printed output, as text, with the lines below them. `python -m doctest file.py` runs one file (silent on success, `-v` for detail); `pytest --doctest-modules` runs doctests together with the rest of the suite.
:::

::: example The docstring that caught a changed constant
A teammate decides $9.81$ is "close enough" for standard gravity and edits one line: `G0 = 9.81`. The docstring still says $g_0 = 9.80665$. Whether the unit tests notice depends on the tolerances they were written with. The doctest notices for certain:

```text
$ pytest --doctest-modules -q rocket.py
F                                                                        [100%]
_________________________ [doctest] rocket.delta_v _________________________
049     >>> round(delta_v(311.0, 549_000.0, 138_000.0), 1)
Expected:
    4211.4
Got:
    4212.8
FAILED rocket.py::rocket.delta_v
1 failed in 0.12s
```

**How big is the change?** New exhaust speed: $311 \times 9.81 \approx 3050.9\,\mathrm{m/s}$. Times $\ln 3.978 \approx 1.3808$ gives about $4212.8\,\mathrm{m/s}$, which is what doctest printed. The difference is $4212.8 - 4211.4 = 1.4\,\mathrm{m/s}$.

**As a fraction.** $1.4 / 4211.4 \approx 0.00034$, or about $0.034\%$. That is exactly the relative change in $g_0$: $9.81 / 9.80665 - 1 \approx 0.00034$, as it must be, since $\Delta v$ is proportional to $g_0$.

**What it means.** Small, but real — and the documentation, the constant and the answer no longer agree. The doctest made the disagreement impossible to miss, and it pointed at the exact line of the docstring. Either the change is reverted, or the docstring, the example and every downstream user are updated on purpose.
:::

## Writing doctests that do not break on the last digit

doctest compares **text**, character for character. Earlier lessons in this module were all about never comparing floats exactly, and doctest does exactly that by default. So write examples whose printed output is stable.

Here is the problem in its simplest form. The full value of the first example is

```python
print(repr(delta_v(311.0, 549_000.0, 138_000.0)))   # 4211.394442493469
```

An example that expects all sixteen digits breaks the day a library computes the logarithm one bit differently. That is why the docstring example wraps the call in `round(..., 1)`: it shows the reader a useful number and cannot flicker.

NumPy adds a second trap. Since NumPy 2, a NumPy scalar **[[prints its type|numpy-repr]]** at the prompt:

```python
import numpy as np
v = np.array([1.0, 1.0])
u = v / np.linalg.norm(v)
print(repr(np.linalg.norm(u)))   # np.float64(0.9999999999999999)
```

An example written as `>>> np.linalg.norm(u)` expecting `1.0` fails twice over: the last digit is off, and the text has `np.float64(...)` wrapped around it. Convert and round:

```python
import numpy as np


def unit(v):
    """
    Scale a vector to length one.

    Examples
    --------
    >>> unit(np.array([3.0, 4.0]))
    array([0.6, 0.8])
    >>> round(float(np.linalg.norm(unit(np.array([1.0, 1.0])))), 12)
    1.0
    >>> float(unit(np.array([1.0, 2.0, 2.0]))[0])  # doctest: +NUMBER
    0.333
    """
    return v / np.linalg.norm(v)
```

The first example is safe because NumPy prints arrays with a limited number of digits: $3/5 = 0.6$ and $4/5 = 0.8$ print cleanly. The second converts to a plain `float` and rounds. The third uses a **directive**, a comment of the form `# doctest: +OPTION` that changes how one example is compared. `+NUMBER` tells pytest to compare floats only to the precision written in the expected output, so `0.333` matches $0.3333\ldots$. Another directive, `+ELLIPSIS`, lets `...` in the expected output stand for any text, which is handy for memory addresses and long messages.

::: warning `+NUMBER` works only under pytest
`NUMBER` is a pytest extension, not part of Python's doctest. The file above passes with `pytest --doctest-modules`, but `python -m doctest` stops with `ValueError: ... has an invalid option: '+NUMBER'`. If a project uses it, run doctests through pytest only, and say so in the contributing notes. `round()` and `float()` work under both.
:::

## What doctests are for

A doctest is documentation first. Its job is to show a reader how to call the function and what a typical answer looks like, and to go red if that stops being true. That makes it good for a few clear examples per function: the normal case, an edge such as $m_f = m_0$, and the error a caller is most likely to hit.

It is a poor home for everything else. Tables of cases belong in `parametrize` from lesson 3. Tolerances belong in `pytest.approx` and `assert_allclose` from lesson 2. Random inputs belong in Hypothesis from lesson 6, and saved reference runs in the golden files of lesson 7. A docstring with forty examples is a test file that nobody can read as documentation.

::: key
Doctests keep examples in the documentation true. Keep them few and readable, make their printed output stable with `round()` and `float()`, and put thorough testing in the pytest suite.
:::

## Check yourself

::: check
A function begins with `# Compute the burn time in seconds.` on the line after `def`, and no docstring. What does `help()` show for it, and what is the smallest change that fixes that?
:::

::: answer
`help()` shows the function's name and arguments but no description, because a comment is thrown away and never stored on the function; its `__doc__` is `None`. The smallest fix is to turn the comment into a docstring: replace it with `"""Compute the burn time in seconds."""` as the first statement of the body. Then `__doc__` holds the text and `help()` prints it.
:::

::: check
Write the NumPy-style Parameters entry for an argument `pitch` that is an angle in radians, allowed from $-\pi/2$ to $\pi/2$.
:::

::: answer
```text
Parameters
----------
pitch : float
    Pitch angle, in radians. Must lie in [-pi/2, pi/2].
```

The first line is `name : type`, with a space on each side of the colon. The description is indented under it, gives the unit (radians, which a reader cannot guess from `float`) and states the allowed range, so the caller knows what will be rejected before calling.
:::

::: check
A docstring example reads `>>> 0.1 + 0.2` with expected output `0.3`. Will it pass under doctest? Rewrite it so it shows the same idea and always passes.
:::

::: answer
It fails. doctest compares text, and Python prints `0.1 + 0.2` as `0.30000000000000004`, because neither $0.1$ nor $0.2$ can be stored exactly in binary. Two stable versions: `>>> round(0.1 + 0.2, 10)` with expected output `0.3`, or, if the point is that the sum is close to $0.3$, `>>> abs((0.1 + 0.2) - 0.3) < 1e-12` with expected output `True`.
:::

::: check
You run `python -m doctest nav.py` and the terminal prints nothing at all. Did any examples run, and how do you find out?
:::

::: answer
Silence is doctest's way of saying every example passed — but a file with no examples also prints nothing. Run `python -m doctest -v nav.py` to see each example as it is tried and a final count such as `3 passed and 0 failed`. If the count is zero, there were no examples to run. You can also check the exit code: $0$ for success, $1$ if any example failed.
:::

::: check
A teammate wants to check `delta_v` against fifty stage configurations by adding fifty `>>>` examples to its docstring. Give two reasons to put them somewhere else, and say where.
:::

::: answer
First, the docstring is documentation: fifty examples bury the two or three a reader actually needs, and `help()` becomes a wall of numbers. Second, doctests compare printed text, so each case needs rounding tricks instead of a real tolerance, and a failure report is harder to read. The fifty cases belong in the pytest suite as one `@pytest.mark.parametrize` test with readable ids, comparing with `pytest.approx` at a stated tolerance. Keep two or three typical examples in the docstring.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Docstring | First string literal in a function, class or module | Stored in `__doc__`, shown by `help()` |
| Summary line | One line, capital letter, ends in a period | Blank line before any more text |
| NumPy style | Underlined sections | Parameters, Returns, Raises, See Also, Notes, References, Examples |
| Parameter entry | `name : type`, then description | State units and allowed ranges |
| Raw docstring | `r"""..."""` | Needed when the text has a backslash |
| doctest | Runs `>>>` lines, compares printed text | `python -m doctest -v`, `pytest --doctest-modules` |
| Stable output | Avoid last-digit and type-wrapper changes | `round()`, `float()`, pytest's `+NUMBER` |
| Role | Documentation that stays true | Thorough testing stays in pytest |

That completes the toolkit of this module: tests with honest tolerances, parametrized tables, fixtures, properties, golden files, coverage, linters and documented examples. The next module, on numerical integration of dynamics, puts it to work — you will write Runge-Kutta solvers by hand and check them with exactly the convergence-order and conservation tests you have learned here.

::: context dunder-doc Double underscores
Names with two underscores on each side, such as `__doc__`, `__init__` and `__name__`, are special names that Python itself uses. People read them aloud as "dunder doc", short for "double underscore doc".

You can read `delta_v.__doc__` directly and get the raw docstring as a string. `help()` does a little more: it removes the common indentation and adds the function's name and arguments at the top. Tools that build documentation websites, and the tooltips in your editor, read the same attribute.
:::

::: context pep-257 The convention behind docstrings
A **PEP**, a Python Enhancement Proposal, is a design document for the Python language and its community. PEP 8 is the style guide for code; PEP 257, from 2001, is the one for docstrings. It asks for triple double quotes, a one-line summary that ends in a period, a blank line before any longer description, and a closing `"""` on its own line for multi-line docstrings.

PEP 257 does not say what goes in the longer part. That is what the NumPy style, and its main rival the Google style, add on top. Both are fine; a project should pick one and use it everywhere.
:::

::: context numpy-style Anatomy of a NumPy docstring
The style grew out of the NumPy and SciPy projects, which needed thousands of functions documented the same way. The numpydoc package turns it into web pages through **Sphinx**, the documentation builder most Python projects use, so each underlined section becomes a formatted block with parameter names in bold.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="8" width="200" height="194" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="28" font-size="11" fill="#1f2a44">Ideal speed change of ...</text>
  <text x="20" y="54" font-size="11" fill="#1d6fd1">Parameters</text>
  <line x1="20" y1="58" x2="82" y2="58" stroke="#1d6fd1" stroke-width="1"/>
  <text x="20" y="74" font-size="11" fill="#1f2a44">isp : float</text>
  <text x="34" y="88" font-size="11" fill="#6c7a93">Specific impulse, in s.</text>
  <text x="20" y="112" font-size="11" fill="#1d6fd1">Returns</text>
  <line x1="20" y1="116" x2="65" y2="116" stroke="#1d6fd1" stroke-width="1"/>
  <text x="20" y="132" font-size="11" fill="#1f2a44">float</text>
  <text x="20" y="156" font-size="11" fill="#1d6fd1">Examples</text>
  <line x1="20" y1="160" x2="72" y2="160" stroke="#1d6fd1" stroke-width="1"/>
  <text x="20" y="176" font-size="11" fill="#1f2a44">&gt;&gt;&gt; delta_v(300.0, ...)</text>
  <text x="20" y="192" font-size="11" fill="#1f2a44">0.0</text>
  <text x="222" y="28" font-size="11" fill="#1f2a44">summary line</text>
  <text x="222" y="74" font-size="11" fill="#1f2a44">name : type</text>
  <text x="222" y="88" font-size="11" fill="#b4232c">units go here</text>
  <text x="222" y="132" font-size="11" fill="#1f2a44">what comes back</text>
  <text x="222" y="176" font-size="11" fill="#1f2a44">run by doctest</text>
</svg>
```

Each title is underlined with dashes exactly as long as the title. The rendering tools depend on that underline to find the sections, so a short or missing one breaks the page.
:::

::: context raw-docstring Why the r matters
Inside an ordinary Python string, a backslash starts an **escape sequence**: `\n` is a new line, `\t` a tab, `\a` a bell, `\v` a vertical tab. Math markup is full of backslashes. Write `\theta` or `\times` in an ordinary docstring and Python turns the `\t` into a tab, leaving "heta" or "imes" behind.

Putting `r` in front of the quotes makes a **raw string**: every backslash stays a backslash. Some sequences that are not escapes, such as `\D`, currently survive by luck, but newer Pythons warn about them. Making every docstring with a backslash raw removes the question entirely.
:::

::: context python-prompt The three arrows
When you type `python` with no file, you get the **interactive interpreter**, and it greets you with `>>>`, meaning "type a statement". When a statement needs more lines, such as the inside of a list that spans two lines, it shows `...` instead. Whatever the statement produces is printed on the next line with no prompt.

doctest copies that exact look. So an example in a docstring is literally a transcript of an interactive session: you can paste it into the interpreter and see the same thing, and you can paste a real session into a docstring and it becomes a test.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="200" height="98" rx="4" fill="#1f2a44"/>
  <text x="20" y="34" font-size="12" fill="#8fb8f0">&gt;&gt;&gt; stages = [25_600.0,</text>
  <text x="20" y="54" font-size="12" fill="#8fb8f0">...           4_000.0]</text>
  <text x="20" y="74" font-size="12" fill="#8fb8f0">&gt;&gt;&gt; sum(stages)</text>
  <text x="20" y="94" font-size="12" fill="#f2b880">29600.0</text>
  <text x="222" y="34" font-size="11" fill="#1f2a44">run this</text>
  <text x="222" y="54" font-size="11" fill="#1f2a44">continue it</text>
  <text x="222" y="74" font-size="11" fill="#1f2a44">run this</text>
  <text x="222" y="94" font-size="11" fill="#b4232c">must print exactly this</text>
</svg>
```
:::

::: context numpy-repr Why NumPy 2 prints np.float64
At the prompt, Python shows a value's **repr**, a text form meant to be unambiguous. Up to NumPy 1.26, a NumPy scalar's repr looked exactly like a plain Python number, `1.0`, even though its type was `numpy.float64`. That hid real differences, such as how it overflows or which type an operation returns.

NumPy 2.0, released in 2024, changed the repr to show the type: `np.float64(1.0)`. `print()` still shows plain `1.0`, because print uses the other text form, **str**. The change broke many doctests at once, which is a good reason to convert with `float()` in examples.
:::
