---
id: l11-linters-and-hooks
title: Linters, formatters, type checkers and pre-commit hooks
minutes: 20
covers:
  - ruff, black, mypy and pre-commit hooks
---

Before you hand in an essay, three different kinds of checking can happen. A spell checker underlines "recieve" in red, in a fraction of a second, without understanding a word of your argument. A class style guide says every essay uses the same font, margins and heading layout, so the teacher reads ideas instead of fighting layouts. And then the teacher reads it and decides whether the argument is any good. The first two are cheap, automatic and tireless. The third is slow and needs a person.

Code has the same three layers. A **linter** reads your code without running it and flags likely mistakes, like the spell checker. A **formatter** rewrites your code's layout to one fixed style, like the style guide. A **type checker** reads the types your functions promise and flags places where the wrong kind of value flows in. Your tests from the earlier lessons are the teacher: slow, thoughtful, and the only layer that knows what the code is supposed to *do*.

This lesson covers the three tools most Python teams use for those first layers — **ruff**, **black** and **mypy** — and **pre-commit**, which runs all of them automatically every time you commit. On a flight-software team these checks guard every merge. They are the reason a code review can spend its time on the physics instead of on a missing blank line or an unused import.

## Linting: reading code without running it

A linter is a kind of **[[static analysis|static-analysis]]**: it looks at the text of the program, and the structure Python would build from it, but it never runs a line. That makes it fast and safe. It can check a million-line codebase in seconds and cannot launch anything by accident.

**ruff** is the linter most new Python projects use today. Here is a small file with some typical slips in it, saved as `nav.py`:

```python
import os
import math

def speed(vx, vy, vz):
    v = math.sqrt(vx**2+vy**2+vz**2)
    unused = 3
    return v

def is_nominal(mode):
    if mode == None:
        return False
    return mode in ['coast','burn']

def log_event(event, history=[]):
    history.append(event)
    return history
```

Tell ruff which families of rules you want in `pyproject.toml`, the project's settings file:

```toml
[tool.ruff]
line-length = 88

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]
```

Each letter is a **[[rule family|rule-codes]]**. `F` finds real errors such as unused names, `E` enforces the standard Python style, `I` sorts imports, `B` catches common bug patterns, and `UP` suggests newer Python syntax. Now run it. `--output-format concise` prints one line per problem:

```text
$ ruff check --output-format concise nav.py
nav.py:1:1: I001 [*] Import block is un-sorted or un-formatted
nav.py:1:8: F401 [*] `os` imported but unused
nav.py:6:5: F841 Local variable `unused` is assigned to but never used
nav.py:10:16: E711 Comparison to `None` should be `cond is None`
nav.py:14:30: B006 Do not use mutable data structures for argument defaults
Found 5 errors.
[*] 2 fixable with the `--fix` option (3 hidden fixes can be enabled with the `--unsafe-fixes` option).
```

Read each line from the left: file, line number, column, a **rule code**, and a short message. The rule code is how you look a problem up (`ruff rule B006` prints a full explanation) and how you switch one off if your team decides to.

- **F401** and **F841** are dead weight: an import nobody uses and a variable nobody reads. Harmless today, but an unused variable is often a sign that someone *meant* to use it — a computed correction that never got applied.
- **E711** says to write `mode is None`, not `mode == None`. `is` asks "is this the one and only `None` object?", which cannot be fooled by a class that redefines `==`.
- **B006** is a real bug, and it deserves its own example.

A `[*]` marks a problem ruff can fix by itself. `ruff check --fix nav.py` sorts the imports and removes `import os`, and leaves the other three for you, because changing them could change what the program does. ruff calls those **unsafe fixes** and will only apply them if you ask with `--unsafe-fixes`.

::: example The event log that remembers too much
Call `log_event` twice, as two separate flights would:

```python
from nav import log_event
print(log_event("ignition"))   # ['ignition']
print(log_event("meco"))       # ['ignition', 'meco']
```

The second flight's log starts with the first flight's ignition. Here is why. Python builds a function's **[[default values|shared-default]]** once, when it runs the `def` line, not each time the function is called. So there is exactly one list `[]`, created at import, and every call that leaves out `history` appends to that same list. After two calls it holds two events; after a thousand simulated flights it holds a thousand.

The fix uses `None` as the default, a value that cannot be changed, and builds a fresh list inside the function:

```python
def log_event(event, history=None):
    if history is None:
        history = []
    history.append(event)
    return history

print(log_event("ignition"))   # ['ignition']
print(log_event("meco"))       # ['meco']
```

Each call now gets its own list. **Check:** the second call prints one event, which is what a new flight should see. ruff found this with no tests and no running code — from the shape of one line.
:::

::: key
A **linter** reads code without running it and flags likely mistakes by rule code. `ruff check` runs it; `ruff check --fix` applies the fixes that cannot change behavior. Rule families are chosen with `select` in `pyproject.toml`.
:::

::: warning Silencing instead of fixing
Every linter lets you silence one line with a comment, `# noqa: B006` for ruff. That is the right tool when the rule is wrong for that line, and you say why in the same comment. It is the wrong tool for making a red check go green before a deadline. A `noqa` with no reason is a bug report nobody will read.
:::

## Formatting: ending the argument about layout

Two engineers can write the same line many ways: `vx**2+vy**2` or `vx**2 + vy**2`, single quotes or double, one blank line between functions or two. None of it changes what the code does, and all of it can fill a code review with comments that are not about the code.

**black** ends the argument by taking the choice away. It is an **opinionated** formatter: it has one style and almost no settings. You give it a file and it rewrites the layout. `black --diff` shows what it would change without changing anything:

```text
$ black --diff nav.py
@@ -1,16 +1,18 @@
 import math


 def speed(vx, vy, vz):
-    v = math.sqrt(vx**2+vy**2+vz**2)
+    v = math.sqrt(vx**2 + vy**2 + vz**2)
     unused = 3
     return v
+

 def is_nominal(mode):
     if mode == None:
         return False
-    return mode in ['coast','burn']
+    return mode in ["coast", "burn"]
+

 def log_event(event, history=[]):
```

Lines starting with `-` are removed and lines starting with `+` are added. black put spaces around `+`, switched to double quotes, added a space after each comma and put two blank lines between top-level functions. Then:

- `black nav.py` rewrites the file in place and prints `1 file reformatted.`
- `black --check nav.py` changes nothing and only reports. It exits with code $0$ if the file is already formatted and $1$ if not, which is what a build server runs.

Notice what black did *not* touch: the `== None`, the unused variable and the shared list are all still there. A formatter only moves whitespace, quotes and line breaks. Before it writes the file, black even **[[checks that the meaning is unchanged|ast-check]]**. Finding bugs is the linter's job.

ruff also has a formatter, `ruff format`, built to produce the same style as black. Many projects use it so that one tool does both jobs. Either way, the rule is the same: pick one formatter, run it on everything, and never format by hand again.

::: key
A **formatter** rewrites layout to one fixed style and never changes what the code does. `black file.py` reformats in place; `black --check` only reports, with exit code 1 when a file would change. black's default line length is 88 characters.
:::

## Type checking: the wrong kind of value

A **type** is the kind of value something is: a `float`, a `str` (text), a `list` of strings. Python only checks types when a line actually runs. If you pass text where a number was expected, you find out when that line crashes, which might be three hours into a simulation run.

**[[Type hints|type-hints]]** let you write the types down. `def burn_time(dv_mps: float, accel_mps2: float) -> float:` says "both inputs are floats, and this returns a float". Read the arrow `->` as "returns". Python itself ignores these hints when running. A **type checker** such as **mypy** reads them and checks, without running anything, that every call and every return agrees with them.

One hint needs a word of explanation. `float | None` means "either a float or `None`". Read the bar `|` as "or". It is how you say a function might come back empty-handed.

Here is a file, `stages.py`, with three type slips in it:

```python
STAGES = {"s1": 25_600.0, "s2": 4_000.0}  # dry mass, kg


def dry_mass(name: str) -> float | None:
    return STAGES.get(name)


def total_dry(names: list[str]) -> float:
    total = 0.0
    for n in names:
        total += dry_mass(n)
    return total


def burn_time(dv_mps: float, accel_mps2: float) -> float:
    if accel_mps2 > 0.0:
        return dv_mps / accel_mps2


print(burn_time("300", 3.0))
```

```text
$ mypy stages.py
stages.py:11: error: Unsupported operand types for + ("float" and "None")  [operator]
stages.py:11: note: Right operand is of type "float | None"
stages.py:15: error: Missing return statement  [return]
stages.py:20: error: Argument 1 to "burn_time" has incompatible type "str"; expected "float"  [arg-type]
Found 3 errors in 1 file (checked 1 source file)
```

Take them one at a time.

- **Line 11.** `dry_mass` promises it *might* return `None` — `STAGES.get` returns `None` for a name it does not know. Adding `None` to a number crashes. mypy noticed that `total_dry` never deals with that case.
- **Line 15.** When the acceleration is zero or negative, the `if` is skipped and the function falls off the end. A Python function that ends without `return` returns `None`, which breaks the promise `-> float`. mypy points at the `def` line.
- **Line 20.** The text `"300"` is not a number. Running the file would crash with `TypeError: unsupported operand type(s) for /: 'str' and 'float'` — but only when that line runs.

::: example Fixing the stage masses so mypy passes
Deal with the `None` out loud, and refuse a bad acceleration instead of falling off the end:

```python
def total_dry(names: list[str]) -> float:
    total = 0.0
    for n in names:
        m = dry_mass(n)
        if m is None:
            raise KeyError(f"unknown stage {n!r}")
        total += m
    return total


def burn_time(dv_mps: float, accel_mps2: float) -> float:
    if accel_mps2 <= 0.0:
        raise ValueError("acceleration must be positive")
    return dv_mps / accel_mps2


print(total_dry(["s1", "s2"]))   # 29600.0
print(burn_time(300.0, 3.0))     # 100.0
```

After the `if m is None: raise` line, mypy knows `m` must be a float, so `total += m` is fine. This is called **narrowing**: a check in the code shrinks the set of types a name can have.

**Check the numbers.** The two stages add up to $25{,}600 + 4{,}000 = 29{,}600\,\mathrm{kg}$ of dry mass. A $300\,\mathrm{m/s}$ burn at $3\,\mathrm{m/s^2}$ takes $300 / 3 = 100\,\mathrm{s}$, a bit under two minutes, a sensible length for an orbit-raising burn. And a misspelled stage name now fails loudly with its name in the message, instead of crashing later on an addition.
:::

mypy is **gradual**: it only checks what you have annotated. A function with no hints at all is skipped by default, even if its body is wrong. You can see that for yourself:

```python
def check():
    return 1.0 + "x"
```

Plain `mypy` reports `Success: no issues found`. `mypy --check-untyped-defs` finds the error, and `mypy --strict` goes further and complains that `check` has no annotations at all. New code should be fully annotated. Older code can be annotated a module at a time.

::: key
**mypy** checks type hints without running code. `X | None` means "an X or None", and mypy makes you handle the `None` before using the value. It skips unannotated functions unless you pass `--check-untyped-defs` or `--strict`.
:::

::: warning Hints are not checks at run time
`burn_time("300", 3.0)` still runs, and crashes, even though the hint says `float`. Python does not enforce hints. Only a type checker reads them, and only if someone runs it. That is exactly why the next section makes running it automatic.
:::

## pre-commit: the checks run themselves

Tools that people have to remember to run do not get run. **Git hooks** fix that. A **[[hook|git-hooks]]** is a script git runs automatically at a certain moment, and the **pre-commit hook** runs every time you type `git commit`, before the commit is made. If the script fails, the commit is stopped.

Writing those scripts by hand is fiddly, so most projects use a tool named **pre-commit**. You list the hooks you want in a file named `.pre-commit-config.yaml` at the top of the repository:

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.15.8
    hooks:
      - id: ruff-check
        args: [--fix, --output-format=concise]
  - repo: https://github.com/psf/black
    rev: 26.3.1
    hooks:
      - id: black
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.19.1
    hooks:
      - id: mypy
```

Each `repo` is where a hook comes from, and `rev` **pins** it to one exact version, so everyone on the team — and the build server — runs the same checks with the same rules. Then, once per clone of the repository:

```text
$ pre-commit install
pre-commit installed at .git/hooks/pre-commit
```

Now try to commit the messy `nav.py` and the unfixed `stages.py`:

```text
$ git commit -m "add nav and stages"
ruff check...............................................................Failed
- hook id: ruff-check
- exit code: 1
- files were modified by this hook
nav.py:6:5: F841 Local variable `unused` is assigned to but never used
nav.py:10:16: E711 Comparison to `None` should be `cond is None`
nav.py:14:30: B006 Do not use mutable data structures for argument defaults
Found 5 errors (2 fixed, 3 remaining).
black....................................................................Failed
- hook id: black
- files were modified by this hook
reformatted nav.py
mypy.....................................................................Failed
- hook id: mypy
- exit code: 1
stages.py:11: error: Unsupported operand types for + ("float" and "None")  [operator]
stages.py:15: error: Missing return statement  [return]
stages.py:20: error: Argument 1 to "burn_time" has incompatible type "str"; expected "float"  [arg-type]
```

(The output is trimmed a little.) No commit was made. Two hooks say "files were modified by this hook": ruff removed the unused import and black reformatted `nav.py`. Those changes are sitting in your working folder, not yet staged. The rest — the unused variable, the `None` comparison, the shared list and the three type errors — need you. Fix them, `git add` the files again, and commit again:

```text
$ git commit -m "add nav and stages"
ruff check...............................................................Passed
black....................................................................Passed
mypy.....................................................................Passed
[master (root-commit) 37682d0] add nav and stages
```

Two more commands are worth knowing. `pre-commit run --all-files` runs every hook on the whole repository, not only the files you changed, which is what you do right after adding a new hook. And a build server should run that same command on every pull request, because anyone can skip the local hooks with `git commit --no-verify`. The hook catches problems early on your laptop; the **[[server check|ci-backstop]]** makes sure nothing slips through.

::: key
**pre-commit** runs listed hooks (for example ruff, black and mypy) on the staged files at every `git commit`, and stops the commit if any fail. Hooks are listed with pinned versions in `.pre-commit-config.yaml`; `pre-commit install` enables them, and `pre-commit run --all-files` checks everything.
:::

::: warning Hooks that fix files leave them unstaged
When ruff or black changes a file during a commit, the commit fails even though the fix was automatic. It fails on purpose, so that you see the change. Look at it with `git diff`, `git add` it, and commit again. If you commit with `-a` out of habit without looking, you will not know what the tools changed.
:::

## What these tools cannot see

Every tool in this lesson reads the *shape* of the code. None of them knows that thrust should be positive, that a rotation matrix should have determinant $+1$, or that a throttle of $0.7$ at $20\,\mathrm{kPa}$ is wrong. A sign error in a guidance law passes ruff, black and mypy without a murmur. So these tools do not replace tests. They clear away the cheap mistakes, so that tests and reviewers can spend their attention on the expensive ones.

A good order to think about it, [[from cheapest to most expensive|cheap-first]]: the formatter (instant, fixes itself), the linter (seconds, points at lines), the type checker (seconds, points at mismatches), then the fast test suite, then the slow suite and coverage from the previous lesson. Each layer catches what the one before it cannot.

## Check yourself

::: check
ruff prints `stages.py:3:1: F401 [*] 'numpy' imported but unused`. Say what each part means, and whether `ruff check --fix` will deal with it.
:::

::: answer
`stages.py` is the file, `3` is the line, `1` is the column where the problem starts, and `F401` is the rule code — the `F` family, which finds real errors, rule 401, an unused import. The message says `numpy` is imported but never used. The `[*]` means ruff has a safe fix, so `ruff check --fix` will delete the import. Removing an import nobody uses cannot change what the program computes.
:::

::: check
A teammate says "we run black, so we don't need a linter". Give a line of code that black leaves alone but a linter flags, and say why black leaves it alone.
:::

::: answer
`def log_event(event, history=[]):` — black keeps it exactly as it is, because it is already laid out in black's style. black only changes whitespace, quotes and line breaks, and it checks that the code means the same thing before and after. A linter with the `B` rules flags it as B006, a mutable default that is shared between calls. Formatting and bug-finding are different jobs.
:::

::: check
A function is annotated `def find_engine(serial: str) -> Engine | None:`. Another function does `thrust = find_engine(s).thrust_n`. What does mypy say, and what is the smallest honest fix?
:::

::: answer
mypy reports an error on that line: the value might be `None`, and `None` has no attribute `thrust_n`. The honest fix is to handle the missing case: store the result, check `if engine is None:` and raise an error naming the serial (or return early), then use `engine.thrust_n`. After the check, mypy narrows the type to `Engine`. Silencing the error, or changing the hint to lie that it always returns an `Engine`, only moves the crash to run time.
:::

::: check
You run `git commit`, and the output shows `black ... Failed` with "files were modified by this hook", and every other hook `Passed`. Was a commit made? What exactly do you do next?
:::

::: answer
No commit was made: any failing hook stops it. black has already reformatted the files in your working folder, but those changes are not staged. Look at them with `git diff` to see what changed, stage them with `git add`, and run `git commit` again. This time black finds nothing to change and passes.
:::

::: check
Why does a team pin `rev:` for every hook in `.pre-commit-config.yaml`, and why does the build server still run the checks if everyone has the hooks installed?
:::

::: answer
Pinning makes everyone run exactly the same version of each tool. A newer ruff may add rules and a newer black may change its style slightly, so unpinned hooks would pass on one laptop and fail on another. The build server runs `pre-commit run --all-files` because local hooks can be skipped with `git commit --no-verify` or were never installed on some clone. The local hook is a convenience that catches problems early; the server check is the one that cannot be skipped.
:::

## Summary

| Tool | Job | Command to know |
|---|---|---|
| ruff | Linter: flags likely mistakes by rule code | `ruff check`, `ruff check --fix` |
| black | Formatter: one fixed layout, never changes meaning | `black file.py`, `black --check` |
| mypy | Type checker: values agree with hints | `mypy file.py`, `--strict` |
| pre-commit | Runs hooks on every `git commit` | `pre-commit install`, `pre-commit run --all-files` |
| Optional hint | A value that may be `None` | mypy makes you handle `None` first |
| Mutable default | One shared object across calls | Default to `None`, build inside |
| What none of them catch | Wrong physics, wrong signs, wrong tolerances | That is what tests are for |

The tools in this lesson check the code's shape. The next lesson looks after the words around the code: docstrings in NumPy style that say what a function expects and returns, with examples that doctest can run as tests.

::: context static-analysis Checking without running
**Static** means "standing still": static analysis studies the program as text, while nothing runs. The opposite is **dynamic** analysis, which watches the program while it runs — your tests and the coverage tool from the last lesson are dynamic.

Python first turns source code into a tree of its parts, called the **abstract syntax tree**: this is a function, this is a call, this is an `if`. Linters and type checkers walk that tree looking for patterns. Because nothing runs, they can check code that needs hardware you do not have, or code paths that would take hours of simulation to reach.
:::

::: context rule-codes Where the letters come from
Before ruff, Python teams ran a stack of separate tools, and ruff kept their rule codes so old settings still work. `F` comes from **Pyflakes**, which finds names that are unused or undefined. `E` and `W` come from **pycodestyle**, which checks the official Python style guide, PEP 8. `B` comes from **flake8-bugbear**, a collection of bug patterns such as the mutable default. `I` comes from **isort**, which sorts imports, and `UP` from **pyupgrade**, which modernizes syntax.

ruff itself is written in Rust, which is a big part of why it runs in milliseconds on files that older Python-based linters took seconds over. It appeared in 2022 and spread fast because it replaced several tools with one.
:::

::: context shared-default One list, many calls
When Python runs the line `def log_event(event, history=[]):`, it builds one empty list and stores it inside the function object, next to the code. Every later call that leaves out `history` is handed that same stored list, not a copy.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="25" width="120" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">call 1: "ignition"</text>
  <rect x="10" y="95" width="120" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">call 2: "meco"</text>
  <line x1="130" y1="40" x2="206" y2="68" stroke="#b4232c" stroke-width="2"/>
  <polygon points="212,70 203,72 206,64" fill="#b4232c"/>
  <line x1="130" y1="110" x2="206" y2="84" stroke="#b4232c" stroke-width="2"/>
  <polygon points="212,82 206,88 203,79" fill="#b4232c"/>
  <rect x="212" y="58" width="138" height="36" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="281" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">['ignition', 'meco']</text>
  <text x="281" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">the one default list</text>
</svg>
```

Numbers, strings, tuples and `None` are safe defaults, because nothing can change them in place. Lists, dictionaries and sets are not. The same trap waits in NumPy: `def f(state=np.zeros(3))` shares one array between every call.
:::

::: context ast-check black's safety check
After black reformats a file, it parses both the old and the new version into their abstract syntax trees — the structure Python actually runs — and compares them. If they differ in anything except layout, black refuses to write the file and reports an error. That is how it can promise it never changes what your code does.

The name is a joke on Henry Ford's line about the Model T, quoted in black's own documentation: any color you like, as long as it's black. You get one style, and you stop spending time choosing.
:::

::: context type-hints Hints, and the units they cannot see
Type hints came to Python through a design document called PEP 484, and Python 3.5 in 2015 was the first release to support them. mypy, which grew out of Jukka Lehtosalo's research project, is the checker the PEP was modeled on.

A `float` hint cannot tell meters from feet, or newton-seconds from pound-force-seconds. In 1999 NASA lost the Mars Climate Orbiter because one piece of ground software produced thruster impulse in pound-force-seconds while the navigation software expected newton-seconds. Both sides were "floats". Some teams close that gap with distinct types per unit, or a units library, so a checker can refuse to add meters to feet. Naming variables with their unit, as in `dv_mps`, is the cheap first step.
:::

::: context git-hooks Where the hooks live
Every git repository has a folder `.git/hooks`. If git finds an executable file there with a special name, it runs it at the matching moment: `pre-commit` before a commit is made, `commit-msg` after you type the message, `pre-push` before a push. A non-zero exit code from the script stops the action.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="50" width="70" height="36" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">git commit</text>
  <line x1="80" y1="68" x2="104" y2="68" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="110,68 102,64 102,72" fill="#1f2a44"/>
  <rect x="110" y="20" width="80" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="37" font-size="11" text-anchor="middle" fill="#1f2a44">ruff</text>
  <rect x="110" y="55" width="80" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">black</text>
  <rect x="110" y="90" width="80" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="107" font-size="11" text-anchor="middle" fill="#1f2a44">mypy</text>
  <line x1="190" y1="68" x2="224" y2="40" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="190" y1="68" x2="224" y2="100" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="226" y="24" width="124" height="30" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="288" y="43" font-size="11" text-anchor="middle" fill="#1d6fd1">all pass: commit made</text>
  <rect x="226" y="86" width="124" height="30" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="288" y="105" font-size="11" text-anchor="middle" fill="#b4232c">any fail: stopped</text>
  <text x="150" y="138" font-size="11" text-anchor="middle" fill="#6c7a93">run on staged files only</text>
</svg>
```

The `.git` folder is not part of what you commit, so hooks are not shared by cloning. That is the gap the pre-commit tool fills: the config file is committed, and `pre-commit install` writes the hook script into each person's `.git/hooks`.
:::

::: context ci-backstop Why the server runs it again
**Continuous integration**, or CI, is a server that runs the project's checks on every pull request. It is the backstop for everything a laptop can skip. A local hook can be bypassed with `--no-verify`, may never have been installed, or may run an older version of a tool.

So a typical setup runs the same checks twice. Locally, pre-commit gives fast feedback in a few seconds, on only the files you touched. On the server, `pre-commit run --all-files` and the full test suite run on a clean machine, and the merge button stays grey until they pass. The two layers catch the same problems at different moments: one is for your convenience, the other is the rule.
:::

::: context cheap-first Cheap checks first
Each layer costs more to run and catches a different kind of mistake. Putting the cheap ones first means the expensive ones are not wasted on typos.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="136" y="10" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="136" y="40" width="55" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="136" y="70" width="75" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="136" y="100" width="120" height="22" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <rect x="136" y="130" width="210" height="22" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <text x="128" y="25" font-size="11" text-anchor="end" fill="#1f2a44">formatter</text>
  <text x="128" y="55" font-size="11" text-anchor="end" fill="#1f2a44">linter</text>
  <text x="128" y="85" font-size="11" text-anchor="end" fill="#1f2a44">type checker</text>
  <text x="128" y="115" font-size="11" text-anchor="end" fill="#1f2a44">fast tests</text>
  <text x="128" y="145" font-size="11" text-anchor="end" fill="#1f2a44">slow tests, coverage</text>
  <text x="174" y="25" font-size="11" fill="#6c7a93">layout</text>
  <text x="199" y="55" font-size="11" fill="#6c7a93">bug patterns</text>
  <text x="219" y="85" font-size="11" fill="#6c7a93">wrong kinds</text>
  <text x="264" y="115" font-size="11" fill="#6c7a93">behavior</text>
</svg>
```

The bar length is a rough picture of time and effort, not a measurement: formatting and linting take seconds, a fast suite a minute or so, and a full Monte Carlo regression run can take hours.
:::
