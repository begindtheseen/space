---
id: l10-exceptions
title: Exceptions: raising, catching and designing failure
minutes: 20
covers:
  - Exceptions: try/except/else/finally, raising, custom exception types
---

Picture a worker on an assembly line who finds a cracked part. She cannot fix it herself, so she stops and hands the problem to her supervisor. If the supervisor knows what to do, the line keeps going. If not, the supervisor passes it to the manager, and so on up. If nobody at all knows what to do, the whole factory stops and someone writes a report saying exactly where the crack was found.

Python works the same way. Every error you have seen in this module so far — `IndexError`, `KeyError`, `ValueError`, `TypeError`, `UnboundLocalError`, `ModuleNotFoundError` — was an **exception**: an object that describes something that went wrong. It is **raised** (created and sent on its way) at the exact spot of the problem. It then travels up through the functions that called that spot, until one of them **catches** it (handles it) or the program stops and prints a report.

That default — stop and print the report — is almost always the right behavior. It is worth saying that before learning any way to switch it off. A script that crashes on a corrupt file tells you the file is corrupt. A script that catches the error and carries on tells you nothing, and the number it prints at the end looks exactly like a number from a good run. In work near flight hardware, lean hard towards **failing loudly**. The expensive failure is not the one that stopped. It is the one that produced a believable answer.

So this lesson does not answer "how do I stop the crashes". It answers three better questions. Which failures do I *expect*? What should happen for each one? And how do I report the rest? You will meet handling (`try`, `except`, `else`, `finally`), raising (`raise`), and making exception types of your own, so that a caller can tell your errors apart from Python's.

## Reading a traceback

When nobody catches an exception, Python prints a **[[traceback|call-stack]]** — a list of every function call that was in progress when the error happened. Here is a small program that fails on purpose:

```python
# parse_chain.py
def to_float(text):
    return float(text)


def parse_row(row):
    return to_float(row)


print(parse_row("9.81"))
print(parse_row("9.81 m/s^2"))
```

```bash
python3 parse_chain.py
# 9.81
# Traceback (most recent call last):
#   File ".../parse_chain.py", line 11, in <module>
#     print(parse_row("9.81 m/s^2"))
#           ^^^^^^^^^^^^^^^^^^^^^^^
#   File ".../parse_chain.py", line 7, in parse_row
#     return to_float(row)
#            ^^^^^^^^^^^^^
#   File ".../parse_chain.py", line 3, in to_float
#     return float(text)
#            ^^^^^^^^^^^
# ValueError: could not convert string to float: '9.81 m/s^2'
```

Read it from the bottom. The last line is the exception's type, `ValueError`, and its message. That line answers "what went wrong".

Above it are the **frames** — one block per function call that was still running. The innermost call is last. So, reading upwards: `to_float` failed at line 3. It had been called by `parse_row` at line 7. And `parse_row` had been called by the top level of the file, `<module>`, at line 11.

The **[[`^^^^` markers|caret-markers]]** under each line point at the exact piece of the line that was running. On a line with four function calls in it, that saves real time.

The frame you usually want is the deepest one *in your own code*. When the bottom frame is inside a library, walk up until you reach a line you wrote. That is where the bad value came from.

Notice the first line of output, `9.81`. It came from a call that worked. Everything before the failure had already happened, which is the point lesson 1 made about errors of meaning: they are found only when the line runs.

## try and except

To handle an error you expect, put the risky line inside a `try` block, and name the exception you expect in an `except` clause:

```python
# parse_one.py
text = "9.81 m/s^2"

try:
    value = float(text)
except ValueError as e:
    print("could not parse:", e)
    value = None

print(value)
```

```bash
python3 parse_one.py
# could not parse: could not convert string to float: '9.81 m/s^2'
# None
```

Read `except ValueError as e:` aloud as "if a ValueError happens, call it `e` and do this". The name `e` is now the exception object. Printing it gives the message. `type(e).__name__` gives the name of its type as a string.

If no exception happens inside `try`, the `except` block is skipped entirely.

Several `except` clauses can follow one `try`. Python checks them from the top, and the first one that matches runs. To catch several types in one clause, list them in a tuple:

```python
# two_types.py
for text in ("9.81", None):
    try:
        print(float(text))       # 9.81
    except (ValueError, TypeError) as e:
        print(type(e).__name__, "-", e)
        # TypeError - float() argument must be a string or a real number, not 'NoneType'
```

Catching a type also catches every type below it, because exceptions form a family tree — a **[[hierarchy|exception-tree]]**. `ZeroDivisionError` is a kind of `ArithmeticError`. `ArithmeticError` is a kind of `Exception`. And `Exception` is a kind of `BaseException`, the root of the whole tree. So catching `Exception` catches almost everything. That is the subject of the next section.

## Catch what you expect, not everything

A `try` with a bare `except:` — no type named at all — catches every exception there is. Here is what that does:

```python
# bare_except.py
import sys

samples = [9.79, 9.81]

try:
    total = sum(sampels)     # a typo: sampels
except:
    total = 0.0

print(total)                 # 0.0

try:
    sys.exit(1)
except:
    print("a bare except swallowed sys.exit")   # a bare except swallowed sys.exit
```

That is two disasters in nine lines.

The first `try` was meant to guard against bad data. What it actually caught was a `NameError` from a misspelled variable, `sampels`. The program now reports a total of zero. The bug is invisible: no traceback, no warning, a believable number.

The second shows that a bare `except:` also catches **[[`SystemExit`|sys-exit]]**, the exception that `sys.exit` uses to end a program. It catches `KeyboardInterrupt` too — the exception Ctrl-C raises. So a program with a bare `except:` inside a loop cannot be stopped with Ctrl-C.

The rule is: name the exception. Sometimes you truly need a catch-all, such as a long batch job that must survive one bad file. Then write `except Exception`, which leaves `KeyboardInterrupt` and `SystemExit` alone, and always record what you caught:

```python
# exception_vs_bare.py
import sys

try:
    sys.exit(1)
except Exception:
    print("not reached")
except SystemExit as e:
    print("SystemExit code", e.code)   # SystemExit code 1
```

`SystemExit` hangs directly off `BaseException`, not off `Exception`. That is exactly why `except Exception` lets it pass.

::: key
Catch a specific exception type. A bare `except:` also swallows `KeyboardInterrupt`, `SystemExit` and genuine programming errors such as `NameError`, turning a crash you could have fixed into silently wrong numbers. Where a catch-all is truly needed, `except Exception` at least leaves the interpreter's own control signals alone.
:::

## else and finally

A `try` statement can have four parts. Think of a hospital check-up: *try* the test; *except* if it shows a problem, treat it; *else*, if all was well, carry on with your day; and *finally*, whatever happened, put your coat back on.

```python
# four_parts.py
def divide(a, b):
    """Return a / b, or 0.0 if b is zero."""
    try:
        result = a / b
    except ZeroDivisionError as e:
        print("caught:", type(e).__name__, "-", e)
        return 0.0
    else:
        print("no exception; result is", result)
        return result
    finally:
        print("finally ran")


print(divide(1.0, 2.0))
# no exception; result is 0.5
# finally ran
# 0.5
print(divide(1.0, 0.0))
# caught: ZeroDivisionError - float division by zero
# finally ran
# 0.0
```

`else` runs only when the `try` block raised nothing. Its job is to let you keep the `try` block down to the one line that can fail. Suppose `result = a / b` *and* everything you do with `result` were all inside `try`. Then an unrelated `ZeroDivisionError` from the later lines would be caught by a handler that was meant only for the first one. It would be treated as the wrong problem.

`finally` always runs. It runs after success. It runs after a handled exception. It runs when an unhandled exception passes through on its way up. It even runs after a `return`. Look at the output above: `finally ran` is printed *before* the returned value reaches `print`.

That makes `finally` the place for **cleanup** — work that must happen no matter what: closing a file, releasing a lock, putting a setting back. The next lesson shows the `with` statement, a shorter way to say the same thing for files.

::: key
`else` runs only if the `try` block raised nothing, which lets you keep the risky line alone inside `try`. `finally` always runs — on success, on exception and on `return` — and is where cleanup belongs.
:::

## Raising

So far Python has raised the exceptions. You can raise them too. The `raise` statement creates an exception and sends it up to the caller. Use it when your function is handed something it cannot work with:

```python
# raising.py
def frame_period(rate_hz):
    """Seconds per frame. Refuses a non-positive rate."""
    if rate_hz <= 0:
        raise ValueError(f"rate must be positive, got {rate_hz}")
    return 1.0 / rate_hz


print(frame_period(40.0))   # 0.025

try:
    frame_period(0.0)
except ValueError as e:
    print("rejected:", e)   # rejected: rate must be positive, got 0.0
```

A sanity check on the first line: 40 frames every second means each frame lasts $1/40 = 0.025\,\mathrm{s}$, or 25 milliseconds.

Choose the type that fits the problem:

- `ValueError` — the right type but an unusable value, like a rate of zero;
- `TypeError` — the wrong type entirely;
- `KeyError` — a missing dictionary key;
- `FileNotFoundError` — a missing file.

Put the offending value in the message. `got 0.0` is the difference between a five-second fix and a twenty-minute hunt.

Raising early is not pessimism. It is how a function states its **[[contract|contracts-and-assert]]** — the promise of what it needs and what it gives back. Imagine a `frame_period` that returned `math.inf` (infinity) for a rate of zero instead. The problem would slide into whatever used the result, and the eventual traceback would point at some later line that is perfectly correct.

Inside an `except` block, a bare `raise`, with nothing after it, re-raises the exception you just caught, with its original traceback intact. Use it when you want to note something and then let the failure carry on up. And when you want to turn a low-level error into one that makes sense to your caller, you can **[[raise a new one on top|exception-chaining]]**.

## Exception types of your own

When a caller needs to tell *your* errors apart from Python's, define a type of your own. The syntax borrows one line from **classes**, which are the next module's subject. For an exception, that one line and a docstring are the whole definition:

```python
# telemetry_errors.py
class TelemetryError(Exception):
    """Base class for problems with a telemetry record."""


class DropoutError(TelemetryError):
    """Too many samples were dropouts to trust the record."""


print(issubclass(DropoutError, TelemetryError))   # True
print(issubclass(DropoutError, Exception))        # True
```

Read `class TelemetryError(Exception):` as "a new exception type called `TelemetryError`, which is a kind of `Exception`". The built-in `issubclass(A, B)` asks "is `A` a kind of `B`?", and both answers are `True`.

Why derive `DropoutError` from `TelemetryError` instead of straight from `Exception`? It gives callers a choice of how precise to be. `except DropoutError` handles that one case. `except TelemetryError` handles anything this module raises. And both keep working if you add a third error type next month. That is why a library normally defines one **base error** of its own and derives the rest from it.

::: example Parsing a column that contains junk
A telemetry export has a column of numbers, and real exports contain blanks and text. The loop must survive them and say how many it skipped.

```python
# parse_column.py
rows = ["9.79", "", "9.81", "bad", "-999.0"]
good = []
skipped = 0

for r in rows:
    try:
        v = float(r)
    except ValueError as e:
        skipped += 1
        print(f"skipping {r!r}: {e}")
    else:
        good.append(v)

print(good)
print(skipped)
```

```bash
python3 parse_column.py
# skipping '': could not convert string to float: ''
# skipping 'bad': could not convert string to float: 'bad'
# [9.79, 9.81, -999.0]
# 2
```

Walk through the five rows. `"9.79"` converts, so `else` appends it. `""` fails, so the count goes to 1. `"9.81"` converts. `"bad"` fails, so the count goes to 2. `"-999.0"` converts. Check: 3 kept plus 2 skipped is 5, the number of rows.

Three decisions are visible here.

- Only `float(r)` is inside the `try`. So the `append` cannot be silently skipped by some unrelated error. That is what `else` is for.
- The bad value is printed with **[[`!r`|bang-r]]**, so the empty string shows as `''` instead of as nothing at all.
- The count is kept. "Parsed 1,198 of 1,200 rows" is a result. "Parsed 1,198 rows" is a mystery.

What the loop does *not* do is reject `-999.0`. That is a **dropout marker** — a made-up value the recorder writes when a sample is missing — and it is a perfectly good float. No exception can tell you it is not a real measurement. Exceptions catch *malformed* data. Only a check you write about the meaning of the data catches *meaningless* data.
:::

::: example A record that refuses to be analyzed
Some failures are not Python's to find. If a quarter or more of the samples are dropouts, the statistics are worthless. The analysis should say so, not quietly average what is left.

```python
# dropout_check.py
class TelemetryError(Exception):
    """Base class for problems with a telemetry record."""


class DropoutError(TelemetryError):
    """Too many samples were dropouts to trust the record."""


DROPOUT = -999.0


def dropout_fraction(samples, limit=0.25):
    """Fraction of samples that are dropouts; raises above `limit`."""
    if not samples:
        raise TelemetryError("record is empty")
    fraction = samples.count(DROPOUT) / len(samples)
    if fraction > limit:
        raise DropoutError(
            f"{samples.count(DROPOUT)} of {len(samples)} samples are dropouts"
        )
    return fraction


print(dropout_fraction([9.79, DROPOUT, 9.81, 9.80]))   # 0.25

for record in ([9.79, DROPOUT, DROPOUT, 9.80], []):
    try:
        print(dropout_fraction(record))
    except DropoutError as e:
        print("unusable:", e)
    except TelemetryError as e:
        print("bad record:", e)
# unusable: 2 of 4 samples are dropouts
# bad record: record is empty
```

Step through the three records.

1. `[9.79, DROPOUT, 9.81, 9.80]` has one dropout in four samples: $1/4 = 0.25$. The test is `fraction > limit`, and $0.25 > 0.25$ is false. So it passes and returns `0.25`. It sits exactly on the boundary. Decide on purpose which side a boundary falls, and write the comparison that says so.
2. `[9.79, DROPOUT, DROPOUT, 9.80]` has two in four: $2/4 = 0.5$, which is more than $0.25$. So `DropoutError` is raised, and the first `except` prints `unusable: 2 of 4 samples are dropouts`.
3. `[]` is empty. The `if not samples:` check raises `TelemetryError`. The first `except` does not match — a plain `TelemetryError` is not a `DropoutError` — so the second one does.

The two `except` clauses show why the family tree is worth the extra line. A caller that cares about dropouts in particular catches `DropoutError`. The same caller catches `TelemetryError` for everything else this module can raise, including the empty record and any error type added later.

Without the empty-record check, that empty list would have reached the division and surfaced as a `ZeroDivisionError`. That is a true statement about the arithmetic, and it says nothing at all about the data.
:::

## The exceptions you will meet

| Type | Raised when |
| --- | --- |
| `ValueError` | Right type, unusable value: `float("bad")` |
| `TypeError` | Wrong type, or a bad call: `"T+" + 5`, missing argument |
| `KeyError` | A dictionary key is absent |
| `IndexError` | A sequence index is past the end |
| `AttributeError` | No such attribute or method — often a shadowed module or a `None` |
| `ZeroDivisionError` | Division by zero; `float division by zero` or `division by zero` |
| `FileNotFoundError` | Opening a file that is not there (next lesson) |
| `ModuleNotFoundError` | `import` of a name that is nowhere on the path |
| `UnboundLocalError` | Reading a local name before it is assigned |
| `KeyboardInterrupt` | Ctrl-C — derives from `BaseException`, not `Exception` |

::: warning Do not use exceptions for ordinary decisions
If you can test for something directly, test for it. `if key in limits:` is clearer than catching `KeyError`. `if not samples:` is clearer than catching the `ZeroDivisionError` from the division that follows. Exceptions are for what you cannot cheaply check in advance — the file that was **[[deleted between your check and your open|check-then-use]]**, the line that turned out not to be a number.
:::

A real mission shows how much the *policy* for an exception matters, not only the code that raises it: on its first flight, Ariane 5 was lost to **[[an exception nobody planned for|ariane-501]]**.

## Check yourself

::: check
Why does a bare `except:` around `total = sum(sampels)` make a typo harder to find than no handler at all?
:::

::: answer
The misspelled name raises `NameError`, and the bare `except` catches that along with everything else. The program then carries on with whatever the handler assigned — zero, typically — and prints output that looks like a result.

Without the handler, Python would stop and print a traceback naming `sampels` and the line it is on. That is a complete diagnosis. The handler turned a failure that announces itself into a silent wrong answer.

The fix: name the exception you expect, such as `except ValueError`. A `NameError` will then still stop the program.
:::

::: check
What is printed, and in what order?

```python
def f():
    try:
        return "from try"
    finally:
        print("cleanup")

print(f())
```
:::

::: answer
`cleanup` first, then `from try`.

The `return` inside `try` does not leave the function until the `finally` block has run. So the `print` inside `finally` happens before the value reaches the caller's `print`. This is the property that makes `finally` safe for cleanup: there is no way out of the `try` block — success, exception or `return` — that skips it.
:::

::: check
Rewrite this so that a `KeyError` from the limits table is not mistaken for a `KeyError` from the peaks table.

```python
limits = {"ax": 12.5}
peaks = {"ay": 0.41}
name = "ax"

try:
    margin = limits[name] - peaks[name]
except KeyError:
    margin = None

print(margin)
```
:::

::: answer
Split the two lookups, so that each `try` guards one thing and says which one failed:

```python
# separate_lookups.py
limits = {"ax": 12.5}
peaks = {"ay": 0.41}
name = "ax"

try:
    limit = limits[name]
except KeyError:
    print(f"no limit defined for {name}")
    limit = None

try:
    peak = peaks[name]
except KeyError:
    print(f"no peak recorded for {name}")
    peak = None

margin = None if limit is None or peak is None else limit - peak
print(margin)
```

```bash
python3 separate_lookups.py
# no peak recorded for ax
# None
```

The original cannot tell you which table was missing the key, and the two cases mean quite different things. A missing limit is an incomplete test procedure. A missing peak is a channel that did not record.

The last line uses a **conditional expression**, `a if cond else b` — read it as "`a` if the condition holds, otherwise `b`". It is an `if` that produces a value.
:::

::: check
Why define `class DropoutError(TelemetryError)` instead of raising `ValueError` with a good message?
:::

::: answer
Because a caller can then handle it by type.

With `ValueError`, the caller has two bad options. It can catch every `ValueError` in the block — including ones from `float()` on some unrelated line. Or it can read the message text, which is fragile and breaks the moment you improve the wording.

A dedicated type lets one caller catch `DropoutError` alone, another catch the base `TelemetryError` to mean "anything this module considers a bad record", and a third let it pass up untouched. Adding a new error type derived from the same base breaks none of them.
:::

::: check
A batch job processes 500 telemetry files and must not stop because one is corrupt. Sketch the structure, and say what makes it different from a bare `except:`.
:::

::: answer
Loop over the files. Put a `try` around the processing of one file. Catch `Exception` — not a bare `except:`. Record the filename and the exception, move on, and report the failures at the end:

```python
# batch_sketch.py
def process(path):
    """Stand-in for the real work."""
    if path.endswith("3.csv"):
        raise ValueError("corrupt header")
    return 1


failures = []
for path in ["run1.csv", "run3.csv", "run4.csv"]:
    try:
        process(path)
    except Exception as e:
        failures.append((path, type(e).__name__, str(e)))

print(len(failures))   # 1
print(failures[0])     # ('run3.csv', 'ValueError', 'corrupt header')
```

Two things make this different from a bare `except:`. First, Ctrl-C and `sys.exit` still work. Second, nothing is silently thrown away: every failure is recorded with its type and message, and the run ends by saying how many files it could not process. A batch job that reports "500 files processed" when 40 of them failed is worse than one that crashed on file 3.
:::

## Summary

| Item | Statement |
| --- | --- |
| Traceback | Read bottom-up: type and message last, innermost frame just above it |
| `try` / `except T as e` | Catch type `T` (and its subclasses); `e` is the exception object |
| Several types | `except (A, B) as e:` or one `except` clause each, first match wins |
| `else` | Runs only if nothing was raised; keeps the risky line alone in `try` |
| `finally` | Always runs, including on `return` and on an exception passing through |
| Bare `except:` | Catches `KeyboardInterrupt`, `SystemExit` and `NameError` too; never use it |
| `except Exception` | The acceptable catch-all; leaves the interpreter's control signals alone |
| `raise` | `raise ValueError(f"... got {value}")`; bare `raise` re-raises inside a handler |
| Custom type | `class MyError(Exception):` plus a docstring; derive a family from one base |
| Choosing | Exceptions for what you cannot cheaply check; `if key in d` for what you can |

The next lesson opens files, which is where exceptions stop being an exercise. The file may not exist, may be unreadable, may be half-written — and each of those is a specific exception type with a specific right response.

::: context call-stack The stack of calls
Every time a function is called, Python puts a new **frame** — that call's local variables and the line it is on — on top of a pile, like plates. When the function returns, its plate comes off. An exception starts on the top plate and works down the pile, one frame at a time, looking for a matching `except`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="20" width="200" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">to_float — line 3 (raised here)</text>
  <rect x="30" y="62" width="200" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">parse_row — line 7</text>
  <rect x="30" y="104" width="200" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="126" font-size="12" text-anchor="middle" fill="#1f2a44">&lt;module&gt; — line 11</text>
  <line x1="260" y1="36" x2="260" y2="136" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="260,146 254,134 266,134" fill="#b4232c"/>
  <text x="272" y="80" font-size="11" fill="#b4232c">ValueError</text>
  <text x="272" y="95" font-size="11" fill="#b4232c">travels down</text>
  <text x="130" y="160" font-size="11" text-anchor="middle" fill="#6c7a93">no except anywhere: program stops</text>
</svg>
```

The traceback prints this pile upside down — outermost first, so the frame where things broke lands right above the error line.
:::

::: context caret-markers Pointing at the exact spot
The `^^^^` underlines arrived in Python 3.11, from a proposal called PEP 657, "fine-grained error locations in tracebacks". Before that, a traceback named only the line. On a line like `x = f(a) + g(b[i])`, you had to guess which of the calls or the indexing failed.

Python leaves the carets out when they would underline the whole line anyway, so you will not always see them.
:::

::: context exception-tree The family tree of exceptions
Every built-in exception has a parent. Catching a parent catches all of its children.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="10" y="20" font-weight="700">BaseException</text>
    <text x="30" y="40" fill="#b4232c">SystemExit</text>
    <text x="30" y="58" fill="#b4232c">KeyboardInterrupt</text>
    <text x="30" y="78" font-weight="700" fill="#1d6fd1">Exception</text>
    <text x="50" y="98">ArithmeticError</text>
    <text x="70" y="114">ZeroDivisionError</text>
    <text x="50" y="134">LookupError</text>
    <text x="70" y="150">KeyError, IndexError</text>
    <text x="50" y="170">OSError</text>
    <text x="70" y="186">FileNotFoundError</text>
    <text x="220" y="98">ValueError</text>
    <text x="220" y="114">TypeError</text>
    <text x="220" y="130">NameError</text>
    <text x="240" y="146">UnboundLocalError</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="18" y1="26" x2="18" y2="74"/><line x1="18" y1="36" x2="28" y2="36"/><line x1="18" y1="54" x2="28" y2="54"/><line x1="18" y1="74" x2="28" y2="74"/>
    <line x1="38" y1="84" x2="38" y2="166"/><line x1="38" y1="94" x2="48" y2="94"/><line x1="38" y1="130" x2="48" y2="130"/><line x1="38" y1="166" x2="48" y2="166"/>
    <line x1="38" y1="84" x2="210" y2="84"/><line x1="210" y1="84" x2="210" y2="126"/><line x1="210" y1="94" x2="218" y2="94"/><line x1="210" y1="110" x2="218" y2="110"/><line x1="210" y1="126" x2="218" y2="126"/>
  </g>
</svg>
```

The two red ones sit beside `Exception`, not under it. That one placement is why `except Exception` leaves Ctrl-C and `sys.exit` working.
:::

::: context sys-exit Leaving is an exception too
`sys.exit(1)` does not stop the program on the spot. It raises `SystemExit`, carrying the number `1` as its exit code. The exception travels up like any other, so every `finally` on the way still runs its cleanup. When it reaches the top, Python quits and hands the code to the shell — the same number you read with `echo $?` in the shell module, where `0` means success.
:::

::: context contracts-and-assert Contracts, and why assert is not one
A function's **preconditions** are what it needs from its caller: here, a positive rate. Checking them at the top and raising is called *guarding*.

You may see `assert rate_hz > 0` used for this. Do not rely on it for real input checks. Running Python with the `-O` (optimize) flag removes every `assert` statement, so the check silently vanishes. `assert` is for tests and for "this can never happen" notes to yourself — the testing tool `pytest` is built on it — not for rejecting bad data.
:::

::: context exception-chaining Raising on top of another exception
Sometimes a low-level error means something bigger to your caller. Write `raise NewError("what it means") from e` inside the handler. The traceback then shows both: first the original `ValueError`, then the line "The above exception was the direct cause of the following exception:", then yours. Nothing is hidden, and the reader sees the whole story.

If you raise inside a handler without `from`, Python still keeps both, but links them with "During handling of the above exception, another exception occurred" — which reads like a second accident.
:::

::: context bang-r What !r does in an f-string
Inside an f-string, `{r!r}` means "show the `repr` of `r`" — the way you would type it into Python, quotes and all. Plain `{r}` shows the `str`, which for an empty string is nothing. Read `!r` aloud as "bang r". Compare `f"[{r}]"` giving `[]` with `f"[{r!r}]"` giving `['']`. For finding bad data, `repr` is almost always what you want: it also shows stray spaces and tabs as `\t`.
:::

::: context check-then-use The gap between checking and using
Checking first and then acting leaves a gap. Another program can change things in between.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="340,60 330,55 330,65" fill="#1f2a44"/>
  <circle cx="70" cy="60" r="6" fill="#1d6fd1"/>
  <text x="70" y="40" font-size="11" text-anchor="middle" fill="#1d6fd1">exists()? yes</text>
  <circle cx="180" cy="60" r="6" fill="#b4232c"/>
  <text x="180" y="90" font-size="11" text-anchor="middle" fill="#b4232c">other program</text>
  <text x="180" y="104" font-size="11" text-anchor="middle" fill="#b4232c">deletes the file</text>
  <circle cx="290" cy="60" r="6" fill="#1d6fd1"/>
  <text x="290" y="40" font-size="11" text-anchor="middle" fill="#1d6fd1">open() fails</text>
  <text x="340" y="84" font-size="11" text-anchor="end" fill="#6c7a93">time</text>
</svg>
```

Programmers call this a *time-of-check to time-of-use* race. For files, the honest answer is to open the file and catch `FileNotFoundError`. Python's own glossary names the two styles: "look before you leap" (LBYL) and "easier to ask for forgiveness than permission" (EAFP).
:::

::: context ariane-501 Ariane 501: a handler that did the wrong thing
On 4 June 1996, the first Ariane 5 broke up about 40 seconds after launch. Software reused from Ariane 4 converted a 64-bit floating-point value, the horizontal bias, into a 16-bit signed integer. Ariane 5 flew a faster trajectory, the number was too big to fit, and the conversion raised an operand error.

That conversion had been left unprotected. The system's policy for any such exception was to shut the inertial reference computer down — sensible for a hardware fault, fatal for a design error. The backup unit ran the same software and had already shut down the same way. The inquiry board's report is a classic read on deciding, for each failure, what the right response actually is.
:::
