---
id: l11-docs-and-readme
title: Docstrings, Sphinx and a README a stranger can run
minutes: 20
covers:
  - Sphinx and NumPy-style docstrings; README that lets a stranger run it
---

Open a box of building bricks and you find two kinds of paper. One is a small card on the lid: what the model is, how many pieces, what age it suits. The other is the step-by-step booklet: this piece, then that one, then this. Lose the card and you do not know what you bought. Lose the booklet and you have a bag of plastic.

Code needs both kinds of paper too. The **README** is the lid card — one page at the top of the repository that says what the project computes and how to get it running. The **docstrings** are the booklet — a short description attached to every function, saying what goes in, what comes out, and in what units. A tool called **Sphinx** gathers all the docstrings into a website, so nobody has to read the source to use the package.

On a GNC team this is not polish. A trajectory tool written by someone who has since moved to another program is useless if nobody can tell whether `altitude` is in meters or kilometers, or which command reproduces the plot in last quarter's review. This lesson shows how to write docstrings in the **NumPy style** that the whole scientific Python world uses, how to make their examples test themselves, how to turn them into a website with Sphinx, and how to write a README that gets a new engineer from nothing to a result in ten minutes.

## Docstrings: help that travels with the code

A **[[docstring|pep-257]]** is a string written as the very first statement of a module, function or class. Python keeps it attached to that object, in an attribute called `__doc__` (read it "dunder doc"). The built-in `help()` prints it, your editor shows it when you hover over a call, and Sphinx reads it to build pages.

```python
def circular_speed(altitude_m):
    """Speed of a circular orbit at the given altitude, in m/s."""
    return (3.986e14 / (6_371_000.0 + altitude_m)) ** 0.5


print(circular_speed.__doc__)
# Speed of a circular orbit at the given altitude, in m/s.
```

A comment (`# ...`) is for someone reading the code. A docstring is for someone *calling* the code, who may never open the file. So a docstring answers the caller's questions:

- What does this do, in one line?
- What does each input mean, what type is it, and **in what units**?
- What comes back, and in what units?
- What can go wrong?
- What does a call look like?

A one-line docstring is fine for a tiny helper. Anything that a colleague will call deserves the full set of answers, and the scientific Python world has agreed on one layout for them.

## The NumPy style

The **NumPy docstring style** is a layout of named sections, each title underlined with dashes, first used for NumPy's own documentation and now followed by SciPy, pandas, scikit-learn, Astropy and most research code. Here is the orbit helper from the earlier lessons, written out in full:

```python
import math

MU_EARTH = 3.986e14      # m^3/s^2
R_EARTH = 6_371_000.0    # m


def circular_speed(altitude_m, mu=MU_EARTH):
    r"""Speed of a circular orbit at a given altitude.

    Parameters
    ----------
    altitude_m : float
        Height above Earth's mean radius, in meters. Must be >= 0.
    mu : float, optional
        Gravitational parameter of the central body, in m^3/s^2.
        Default is Earth's, 3.986e14.

    Returns
    -------
    float
        Orbital speed, in m/s.

    Raises
    ------
    ValueError
        If `altitude_m` is negative.

    See Also
    --------
    hohmann_delta_v : Burns to move between two circular orbits.

    Notes
    -----
    Uses :math:`v = \sqrt{\mu / r}` with :math:`r = R_E + h`.
    Ignores drag and Earth's oblateness (J2).

    Examples
    --------
    >>> round(circular_speed(400e3), 1)
    7672.6
    """
    if altitude_m < 0:
        raise ValueError(f"altitude_m must be >= 0, got {altitude_m}")
    return math.sqrt(mu / (R_EARTH + altitude_m))


print(round(circular_speed(400e3), 1))
# 7672.6
```

Walk through it from the top.

- **Summary line.** One line, right after the opening quotes, that says what the function does. It shows up alone in tables of contents and editor pop-ups, so it must stand on its own.
- **Parameters.** Each input gets a line `name : type`, then an indented description. The space on both sides of the colon matters: that is how the tools find the type. Add `, optional` when the parameter has a default, and say what the default is.
- **Returns.** The type, then what it means and its units. If a function returns several values, give each a name, as `dv1 : float` and `dv2 : float`.
- **Raises.** Which exceptions the caller should expect, and when.
- **See Also.** Related functions, so a reader who landed on the wrong one can find the right one.
- **Notes.** The method, the formula, and the model's assumptions. The `:math:` markers are for Sphinx, which renders what is inside them as an equation. The `r` before the opening quotes makes it a **raw string**, so Python leaves backslashes like `\sqrt` alone.
- **Examples.** Short sessions that look like the interactive prompt: `>>>` lines are code, and the line after is what it prints.

The sections come in that order. Leave out any you do not need, but never leave out units.

::: key NumPy-style docstring sections
Summary line, then `Parameters`, `Returns`, `Raises`, `See Also`, `Notes`, `Examples` — each title underlined with dashes. Parameters are written `name : type`, with `, optional` for a default. Every physical quantity states its units.
:::

::: warning Units belong in the docstring
The [[Mars Climate Orbiter|mars-climate-orbiter]] was lost in 1999 because one piece of software produced thruster impulse in pound-force seconds while the software reading it expected newton seconds. Neither program had a bug in its arithmetic; the interface between them was undocumented where it mattered. Writing "in meters" next to `altitude_m` looks fussy until the day someone passes kilometers. Put the unit in the name where you can (`altitude_m`, `thrust_N`) and in the docstring always.
:::

## Examples that test themselves

The `Examples` section has a second job. The standard library module **[[doctest|doctest-origin]]** finds every `>>>` line in your docstrings, runs it, and checks that the output matches what you wrote. pytest can run them alongside your normal tests:

```text
$ python -m pytest --doctest-modules src -v
src/gnc/orbits.py::gnc.orbits.circular_speed PASSED      [ 50%]
src/gnc/orbits.py::gnc.orbits.hohmann_delta_v PASSED     [100%]
```

Each docstring with examples became one test. That turns documentation into something that cannot quietly go stale: if a change alters the numbers, the example fails, and you must update the docstring along with the code.

::: example A doctest catches a stale docstring
The `hohmann_delta_v` function returns the two burns of a **[[Hohmann transfer|hohmann-picture]]** — the cheapest two-burn move between two circular orbits. Its docstring promises, for a trip from a $400\,\mathrm{km}$ orbit to geostationary altitude, $35\,786\,\mathrm{km}$:

```text
>>> dv1, dv2 = hohmann_delta_v(400e3, 35_786e3)
>>> round(dv1), round(dv2)
(2399, 1457)
```

Suppose someone had typed `(2400, 1457)` instead, rounding in their head. Run the doctests:

```text
$ python -m pytest --doctest-modules src -q
_____________________ [doctest] gnc.orbits.hohmann_delta_v _____________________
071     >>> dv1, dv2 = hohmann_delta_v(400e3, 35_786e3)
072     >>> round(dv1), round(dv2)
Expected:
    (2400, 1457)
Got:
    (2399, 1457)
FAILED src/gnc/orbits.py::gnc.orbits.hohmann_delta_v
1 failed, 1 passed in 0.13s
```

**Step 1.** pytest ran the two `>>>` lines exactly as a user would type them.

**Step 2.** It compared the printed tuple, character by character, with the line under the prompt.

**Step 3.** They differed in one digit, so the test failed and showed both.

**Sanity check.** The real first burn is about $2399.35\,\mathrm{m/s}$, which rounds to $2399$. The total, $2399 + 1457 = 3856$, rounds to about $3.86\,\mathrm{km/s}$, close to the figure usually quoted for going from low orbit to geostationary with no plane change. The docstring now carries a number you can trust.
:::

::: warning Keep doctest output stable
doctest compares text, not numbers. `circular_speed(400e3)` prints `7672.594396313682`, and a different CPU, NumPy version or summation order can change the last digits. Round in the example (`round(x, 1)`), or print with a format like `f"{x:.1f}"`, so the check is about the physics and not about floating-point noise.
:::

## Sphinx: from docstrings to a website

**Sphinx** is the documentation builder used by Python itself, NumPy, SciPy and thousands of other projects. You write a few pages by hand — an introduction, a tutorial — and Sphinx pulls in the reference pages from your docstrings. Two **extensions**, plug-ins that add features, do the pulling:

- **autodoc**, built into Sphinx, imports your package and reads every docstring.
- **numpydoc**, a separate package from the NumPy project, understands the NumPy sections and lays them out as proper tables and headings.

Install both into the project's environment, along with your package itself, because autodoc has to import it:

```text
$ python -m pip install sphinx numpydoc .
$ sphinx-quickstart -q -p gnc-toolkit -a "Ada Flight" -v 0.1 --no-sep docs
```

The quick-start command makes a `docs/` folder with a configuration file, `conf.py`, and a front page, `index.rst`. Replace the configuration with this:

```python
# docs/conf.py
project = "gnc-toolkit"
author = "Ada Flight"
release = "0.1.0"

extensions = [
    "sphinx.ext.autodoc",   # pull docstrings out of the code
    "numpydoc",             # understand NumPy-style sections
]
numpydoc_show_class_members = False
numpydoc_validation_checks = {"all", "GL08", "SA01", "EX01", "ES01"}
html_theme = "alabaster"
```

The last line but one switches on numpydoc's **validation**: it checks every docstring against the style's rules and warns about problems. The set means "every check except these four", and the four skipped ones are the checks that demand a See Also section, an Examples section, an extended summary, and a docstring on every single object. Those are good goals but noisy on day one.

The front page is written in **[[reStructuredText|restructured-text]]**, Sphinx's markup language. The `automodule` line tells autodoc to document every public member of `gnc.orbits`:

```text
gnc-toolkit
===========

Small guidance, navigation and control helpers.

.. automodule:: gnc.orbits
   :members:
```

Then build the site:

```text
$ sphinx-build -b html docs docs/_build/html
...
build succeeded.

The HTML pages are in docs/_build/html.
```

Open `docs/_build/html/index.html` in a browser, and each function appears with its parameters in a table, its equation typeset and its example in a code box. Teams usually publish this site automatically on every merge, often through the free service [[Read the Docs|read-the-docs]].

::: example Validation catches a lying docstring
Someone adds a period function but writes the wrong parameter name in its docstring:

```python
def orbital_period(altitude_m, mu=MU_EARTH):
    """Period of a circular orbit, in seconds.

    Parameters
    ----------
    alt : float
        Altitude, in meters.

    Returns
    -------
    float
        Period, in s.
    """
    r = R_EARTH + altitude_m
    return 2 * math.pi * math.sqrt(r**3 / mu)


print(round(orbital_period(400e3) / 60, 1))
# 92.4
```

The code is right: the International Space Station's height gives about $92.4$ minutes, the familiar ISS lap. The docstring is wrong in two ways. Rebuild the docs:

```text
$ sphinx-build -b html docs docs/_build/html
WARNING: [numpydoc] Validation warnings while processing docstring for 'gnc.orbits.orbital_period':
  PR01: Parameters {'altitude_m', 'mu'} not documented
  PR02: Unknown parameters {'alt'}
```

**Step 1.** numpydoc compared the function's real signature, `(altitude_m, mu)`, with the names listed under `Parameters`.

**Step 2.** Check PR01 found two real parameters with no entry. Check PR02 found a documented name, `alt`, that the function does not have.

**Step 3.** Add `-W` to turn warnings into errors: `sphinx-build -W -b html docs docs/_build/html` then ends with "build finished with problems, 1 warning (with warnings treated as errors)" and exit code 1, so a CI job fails.

**Sanity check.** The same checks run without building the site: `numpydoc lint --ignore ES01,SA01,EX01,GL08 src/gnc/orbits.py` printed the same two lines and exited with code 1. That fits in a [[pre-commit hook|pre-commit-hook]], where it stops the mistake before it is ever committed.
:::

## A README that lets a stranger run it

Here is the test for a README. Hand the repository link to an engineer who has never seen the project. Start a timer. They get a fresh machine and the README, nothing else — no messages to you. If they have not produced the headline result within ten minutes, the README is incomplete.

That test tells you what the README must contain. For a simulation repository, five things:

1. **What it computes**, in two sentences, with the output named. Not the history of the project.
2. **How to install it**, as commands someone can paste, starting from a clean machine.
3. **One command that reproduces a headline result**, with the output they should see, so they know they got it right.
4. **Where the data comes from** — every constant, table or input file, and its source.
5. **The assumptions and limits of the model** — what it ignores, and where its answers stop being trustworthy.

::: key What belongs in the README of a sim repository
What it computes, how to install it, one command that reproduces a headline result, where the data comes from, and the assumptions and limits of the model. If a new engineer cannot get a plot in ten minutes, the README is incomplete.
:::

Here is one for `gnc-toolkit`:

```markdown
# gnc-toolkit

Circular-orbit and Hohmann-transfer helpers for mission analysis.
Given orbit altitudes, it returns orbital speeds, periods and
transfer burns (delta-v) in SI units.

## Quickstart (about 2 minutes)

Needs Python 3.10 or newer. Run:

    git clone https://git.example.com/gnc/gnc-toolkit.git
    cd gnc-toolkit
    python3 -m venv .venv
    .venv/bin/pip install ".[plot]"
    .venv/bin/python examples/leo_to_geo.py

Expected output, plus a plot saved as `leo_to_geo.png`:

    LEO 400 km -> GEO: dv1 = 2399 m/s, dv2 = 1457 m/s, total = 3857 m/s

## Data and constants

- Earth's gravitational parameter: 3.986e14 m^3/s^2 (WGS 84, rounded).
- Earth's mean radius: 6371 km (IUGG mean radius). Altitudes are
  measured from this sphere, not from the equator.

## Assumptions and limits

Two-body point-mass gravity only: no drag, no J2, no third bodies.
Burns are instantaneous. No plane changes. Results are for first-cut
sizing, not for operations.

## Tests and docs

`pip install ".[dev]"`, then `pytest`. Docs: `sphinx-build docs docs/_build/html`.
```

Notice what is *not* there: no feature wish list and no badge wall at the top. Every line serves the stranger with the timer running.

::: example The ten-minute test, run for real
Copy only what a user would get — `src/`, `pyproject.toml`, `README.md`, `examples/` — into an empty folder, and run the quickstart commands exactly as written, timing the whole thing:

```text
$ python3 -m venv .venv && .venv/bin/pip install -q ".[plot]"
$ .venv/bin/gnc-orbit 400
7672.6 m/s
$ .venv/bin/python examples/leo_to_geo.py
LEO 400 km -> GEO: dv1 = 2399 m/s, dv2 = 1457 m/s, total = 3857 m/s
saved leo_to_geo.png
elapsed 12.3 s
```

**Step 1.** A fresh environment, so nothing already installed on the machine could help.

**Step 2.** The install pulled NumPy and matplotlib from the index, because the `plot` extra asks for matplotlib.

**Step 3.** The headline command printed the same numbers the README promises and wrote a 34 kB plot.

**Sanity check.** Twelve seconds on a fast connection, far inside ten minutes, and the numbers match the doctest from earlier: $2399 + 1457 = 3856$, and the printed total is $3857$ because it adds the unrounded burns, $2399.35 + 1457.23 = 3856.58$. A reader who spots that difference should find the answer in the code, not suspect a bug — one more reason the example prints what it prints.
:::

::: warning READMEs rot silently
Code has tests; a README usually does not. Rename a script or add a required dependency and the quickstart breaks while every test stays green. The fix is to make CI run the quickstart: a job that starts from a [[clean container|clean-container]], pastes the README's commands, and compares the headline output. Some teams extract the commands from the README automatically so the two can never disagree.
:::

## Check yourself

::: check
Write the `Parameters` entry, in NumPy style, for a function argument `thrust` that is the engine's thrust in newtons and defaults to 845 000.
:::

::: answer
```text
Parameters
----------
thrust : float, optional
    Engine thrust, in newtons. Default is 845000.
```

The title is underlined with dashes, the line reads `name : type` with a space on both sides of the colon, `, optional` marks the default, the description is indented under it, and it states the unit. Better still, rename the argument `thrust_N` so the unit is in the name too.
:::

::: check
Your function returns `7672.594396313682`. Why is `>>> circular_speed(400e3)` followed by `7672.594396313682` a poor doctest, and what would you write instead?
:::

::: answer
doctest compares the printed text exactly. The last few digits of a floating-point result can change with the CPU, the library version or the order of operations, so the test could fail although the physics is unchanged. Write `>>> round(circular_speed(400e3), 1)` with the expected line `7672.6`, which checks the result to $0.1\,\mathrm{m/s}$ and is stable.
:::

::: check
Sphinx builds your site without complaint, but the reference page for `gnc.nav` is empty. The docstrings exist. What does autodoc need that it may be missing?
:::

::: answer
autodoc works by importing the package and reading the docstrings from the live objects. If `gnc` is not installed in the environment that runs `sphinx-build` (or an import inside `gnc.nav` fails, for example because an optional dependency is missing), there is nothing to read. Install the package into the docs environment (`pip install .` or with the right extras), and build with `-W` so an import failure stops the build instead of producing an empty page.
:::

::: check
A README says: "Run `python run_sim.py`. See Bob for the config file." List what is missing, using the five parts of a complete README.
:::

::: answer
It never says what the simulation computes or what output to expect, so a stranger cannot tell whether it worked. There is no install step: no Python version, no environment, no dependencies. "See Bob" means the input data has no stated source, and it fails the ten-minute test the moment Bob is on vacation. Nothing states the model's assumptions or limits. The one command is there, but without an expected result it does not reproduce anything checkable.
:::

::: check
Why does numpydoc's validation catch a mistake that a careful human reviewer often misses, and where in the workflow would you run it?
:::

::: answer
It compares the documented parameter names with the function's real signature, mechanically, every time. A reviewer reads the docstring and the code separately and easily misses that `alt` in one is `altitude_m` in the other, especially after a rename. Run it where it is cheap and automatic: as a pre-commit hook with `numpydoc lint`, and in CI with `sphinx-build -W`, so the build fails on any warning.
:::

## Summary

| Idea | What it is | Fact to remember |
|---|---|---|
| Docstring | string that opens a function, class or module | stored in `__doc__`; shown by `help()` |
| NumPy style | named sections underlined with dashes | `Parameters`, `Returns`, `Raises`, `See Also`, `Notes`, `Examples` |
| Parameter line | how an input is described | `name : type, optional` then an indented description with units |
| doctest | runs `>>>` examples and compares output | `pytest --doctest-modules`; round floats |
| Sphinx + autodoc + numpydoc | builds a website from docstrings | `sphinx-build -W -b html docs docs/_build/html` |
| numpydoc validation | checks docstrings against signatures | PR01 undocumented, PR02 unknown parameter |
| README | the one page a stranger reads first | computes, install, one command, data, assumptions; ten-minute test |

The last lesson of the module takes the documented, tested package and ships it: to an internal index your team controls, or to the public Python Package Index, and explains why those two are very different decisions.

::: context pep-257 The house rules for docstrings
Python's general docstring conventions are written down in PEP 257, from 2001: use triple double quotes, start with a one-line summary that ends in a period, leave a blank line before any further detail, and describe what the function does and returns rather than how. The NumPy style is a stricter layout built on top of those rules. Other styles exist, notably the Google style, which uses `Args:` and `Returns:` with indentation instead of dashed titles. Sphinx can read both through extensions; what matters most is that one project picks one style and sticks to it.
:::

::: context mars-climate-orbiter A spacecraft lost to a unit
NASA's Mars Climate Orbiter reached Mars in September 1999 and was lost during orbit insertion. Ground software supplied by the spacecraft's builder reported small-thruster impulse in pound-force seconds; the navigation software that used those numbers expected newton seconds, a factor of about $4.45$ apart. The small error in each trajectory correction added up over months, and the spacecraft arrived far lower than planned: the investigators estimated about 57 km above the surface, below the roughly 80 km it could survive. The investigation board named the unit mismatch as the root cause, and weak interface checking as the reason it survived.
:::

::: context doctest-origin Documentation that checks itself
doctest was added to Python's standard library in version 2.1, in 2001, written by Tim Peters. The idea was that the example in the documentation is the first thing a new user copies, so it had better work. The module scans docstrings for text that looks like an interactive session, replays it, and reports any difference. It is not a replacement for real tests: it compares printed text, handles setup awkwardly and makes long checks hard to read. It is excellent for one thing — proving that the examples you show people still run.
:::

::: context hohmann-picture Two burns and half an ellipse
A Hohmann transfer moves a spacecraft between two circular orbits in the same plane. The first burn, at the inner orbit, stretches the circle into an ellipse whose far end touches the outer orbit. The spacecraft coasts half an ellipse. The second burn, at the far end, rounds the ellipse off into the outer circle. The flight-dynamics module derives the burn sizes from the energy of each orbit; here it is only the function we document.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="200" cy="100" r="12" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="200" cy="100" r="40" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="200" cy="100" r="90" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M 240 100 A 65 60 0 0 0 110 100" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="240" cy="100" r="4" fill="#b4232c"/>
  <circle cx="110" cy="100" r="4" fill="#b4232c"/>
  <text x="248" y="118" font-size="11" fill="#b4232c">burn 1</text>
  <text x="70" y="118" font-size="11" fill="#b4232c">burn 2</text>
  <text x="10" y="192" font-size="11" fill="#1d6fd1">dashed: transfer, half an ellipse</text>
  <text x="300" y="170" font-size="11" fill="#1f2a44">outer orbit</text>
  <text x="200" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">E</text>
</svg>
```
:::

::: context restructured-text Sphinx's markup language
reStructuredText, usually shortened to reST, is a plain-text markup language like Markdown, older and stricter. Titles are underlined with `=` or `-`, and commands called directives start with two dots, as in `.. automodule::`. The NumPy docstring sections are designed to look like reST titles, which is why they are underlined with dashes. If your team prefers Markdown for hand-written pages, the MyST-Parser extension lets Sphinx read Markdown files too, and the docstrings stay in NumPy style either way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="150" height="130" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="20" y="32" font-size="11" fill="#6c7a93">source docstring</text>
  <text x="20" y="56" font-size="12" fill="#1f2a44">Parameters</text>
  <text x="20" y="70" font-size="12" fill="#1f2a44">----------</text>
  <text x="20" y="90" font-size="12" fill="#1f2a44">altitude_m : float</text>
  <text x="32" y="106" font-size="11" fill="#1f2a44">Height, in meters.</text>
  <line x1="166" y1="75" x2="194" y2="75" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="194,70 204,75 194,80" fill="#1d6fd1"/>
  <text x="180" y="64" font-size="11" text-anchor="middle" fill="#1d6fd1">Sphinx</text>
  <rect x="210" y="10" width="140" height="130" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="220" y="32" font-size="11" fill="#6c7a93">web page</text>
  <text x="220" y="58" font-size="13" font-weight="bold" fill="#1f2a44">Parameters:</text>
  <rect x="220" y="70" width="120" height="44" fill="#8fb8f0" opacity="0.5"/>
  <text x="226" y="88" font-size="12" font-weight="bold" fill="#1f2a44">altitude_m</text>
  <text x="226" y="105" font-size="11" fill="#1f2a44">float: Height, in m.</text>
</svg>
```
:::

::: context read-the-docs Where documentation sites live
Read the Docs is a hosting service for documentation, free for open-source projects, that rebuilds a project's Sphinx site every time the repository changes and keeps a separate copy for each released version. That last part matters for engineering code: a user on version 1.4 can read the 1.4 docs, not today's. Companies do the same thing internally, with a CI job that runs `sphinx-build` and copies the HTML to an internal web server, often one folder per tag.
:::

::: context pre-commit-hook Checks that run before you commit
A pre-commit hook is a script git runs every time you type `git commit`. If it fails, the commit is stopped. The `pre-commit` tool manages these hooks from one file, `.pre-commit-config.yaml`, and numpydoc provides a ready-made hook that runs the same lint command. Because it runs on your own machine in a second or two, it catches a wrong parameter name before a reviewer or a CI job ever sees it.
:::

::: context clean-container Testing the README the way a stranger meets it
Your own laptop is the worst place to test a README. It already has the right Python, cached wheels, environment variables and a config file in your home folder that the README forgot to mention. A CI job that starts from a bare container image, such as the official `python:3.11-slim`, has none of that, exactly like the new engineer's machine. If the pasted commands work there, they will work for her.
:::
