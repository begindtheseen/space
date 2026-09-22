---
id: l10-exceptions
title: Exceptions: raising, catching and designing failure
minutes: 20
covers:
  - Exceptions: try/except/else/finally, raising, custom exception types
---

Every error you have seen in this module so far has been an *exception*: `IndexError`, `KeyError`, `ValueError`, `TypeError`, `UnboundLocalError`, `ModuleNotFoundError`. An exception is an object describing something that went wrong, raised at the point of the problem and travelling up through the callers until something catches it or the program stops.

The default — stop the program and print a traceback — is almost always the right behaviour, and this is worth insisting on before any syntax for suppressing it. A script that crashes on a corrupt file tells you the file is corrupt. A script that catches the error and carries on tells you nothing, and the number it prints at the end looks exactly like a number from a good run. For flight-adjacent work the bias should be firmly towards failing loudly: the expensive failure is not the one that stopped, it is the one that produced a plausible answer.

So the question this lesson answers is not "how do I stop the crashes" but "which failures do I *expect*, what should happen for each, and how do I report the rest". You will meet handling (`try`/`except`/`else`/`finally`), raising (`raise`), and defining exception types of your own so that a caller can tell your errors apart from the interpreter's.

## Reading a traceback

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

Read it from the bottom. The last line is the exception type and its message, and it is the answer to "what went wrong". Above it, in order, are the *frames*: the innermost call last. `to_float` was called by `parse_row`, which was called by the top level of the file at line 11. The `^^^^` markers under each line point at the exact expression, which Python 3.11 added and which saves real time on a line with four function calls in it.

The frame you usually want is the deepest one *in your own code*. When the bottom frame is inside a library, walk up until you find the line you wrote: that is where the bad value came from.

Note also that the first line of output, `9.81`, came from a successful call. Everything before the failure had already happened, which is the point lesson 1 made about errors of meaning.

## try and except

Wrap the risky operation, and name the exception you expect:

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

`as e` binds the exception object, whose `str` is the message and whose type you can get with `type(e).__name__`. If no exception occurs, the `except` block is skipped entirely.

Several `except` clauses can follow one `try`, and the first matching one runs. A tuple catches several types at once:

```python
# two_types.py
for text in ("9.81", None):
    try:
        print(float(text))       # 9.81
    except (ValueError, TypeError) as e:
        print(type(e).__name__, "-", e)
        # TypeError - float() argument must be a string or a real number, not 'NoneType'
```

Catching a type also catches its subclasses, because exceptions form a hierarchy: `ZeroDivisionError` is a kind of `ArithmeticError`, which is a kind of `Exception`, which is a kind of `BaseException`. Catching `Exception` therefore catches almost everything — which is the subject of the next section.

## Catch what you expect, not everything

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

Two disasters in nine lines. The first `try` was meant to guard against bad data; what it actually caught was a `NameError` from a misspelled variable, and the program now reports a total of zero. The bug is invisible: no traceback, no warning, a plausible number. The second shows that a bare `except:` also catches `SystemExit` — and `KeyboardInterrupt`, so a program with a bare except inside a loop cannot be stopped with ctrl-C.

The rule is to name the exception. If you genuinely need a catch-all — a long batch job that must survive one bad file — use `except Exception`, which leaves `KeyboardInterrupt` and `SystemExit` alone, and always log what you caught:

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

`SystemExit` derives from `BaseException` rather than `Exception`, which is exactly why `except Exception` does not swallow it.

::: key
Catch a specific exception type. A bare `except:` also swallows `KeyboardInterrupt`, `SystemExit` and genuine programming errors such as `NameError`, turning a crash you could have fixed into silently wrong numbers. Where a catch-all is truly needed, `except Exception` at least leaves the interpreter's own control signals alone.
:::

## else and finally

The full statement has four parts:

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

`else` runs only when the `try` block raised nothing. Its purpose is to let you keep the `try` block down to the single line that can fail: if `result = a / b` and everything you do with `result` were both inside `try`, an unrelated `ZeroDivisionError` from the second part would be caught by a handler meant for the first.

`finally` always runs — after success, after a handled exception, after an unhandled one on its way out, and even after a `return`, as the output above shows: `finally ran` is printed before the returned value reaches `print`. That makes it the place for cleanup that must happen regardless: closing a file, releasing a lock, restoring a setting. The next lesson shows the `with` statement, which is a shorter way to say the same thing for files.

::: key
`else` runs only if the `try` block raised nothing, which lets you keep the risky line alone inside `try`. `finally` always runs — on success, on exception and on `return` — and is where cleanup belongs.
:::

## Raising

`raise` creates and throws an exception. Use it when your function is given something it cannot work with:

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

Choose the type that fits: `ValueError` for a value of the right type but an unusable value, `TypeError` for the wrong type entirely, `KeyError` for a missing key, `FileNotFoundError` for a missing file. Put the offending value in the message — `got 0.0` is the difference between a five-second fix and a twenty-minute hunt.

Raising early is not pessimism, it is how a function states its contract. A `frame_period` that returned `math.inf` for a rate of zero would push the problem into whatever used the result, and the traceback would then point at a line that is perfectly correct.

Inside an `except` block, a bare `raise` re-raises the exception you just caught, with its original traceback intact — useful when you want to log something and then let the failure continue on its way.

## Exception types of your own

When a caller needs to distinguish *your* errors from the interpreter's, define a type. The syntax borrows one line from classes, which are the next module's subject; for an exception, this line and a docstring are the whole definition:

```python
# telemetry_errors.py
class TelemetryError(Exception):
    """Base class for problems with a telemetry record."""


class DropoutError(TelemetryError):
    """Too many samples were dropouts to trust the record."""


print(issubclass(DropoutError, TelemetryError))   # True
print(issubclass(DropoutError, Exception))        # True
```

`class Name(Exception):` says "a new exception type, which is a kind of `Exception`". Deriving `DropoutError` from `TelemetryError` rather than straight from `Exception` gives callers a choice of precision: `except DropoutError` handles that one case, `except TelemetryError` handles anything this module raises, and both still work if you add a third error type next month. That is why a library normally defines one base error of its own and derives the rest from it.

::: example Parsing a column that contains junk
A telemetry export has a numeric column, and real exports contain blanks and text. The loop must survive them and say how many it skipped.

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

Three decisions are visible. Only `float(r)` is inside the `try`, so the `append` cannot be silently skipped by an unrelated error — that is what `else` is for. The bad value is printed with `!r`, so the empty string shows as `''` rather than as nothing at all. And the count is kept, because "parsed 1,198 of 1,200 rows" is a result and "parsed 1,198 rows" is a mystery.

What the loop does *not* do is convert `-999.0` — the dropout marker is a perfectly good float, and no exception can tell you it is not a real measurement. Exceptions catch malformed data; only a domain check catches meaningless data.
:::

::: example A record that refuses to be analysed
Some failures are not the interpreter's to find. If a quarter of the samples are dropouts, the statistics are worthless, and the analysis should say so rather than average what is left.

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

The first record is exactly at the limit — one dropout in four is 0.25, and the test is `>`, so it passes and returns 0.25. Decide deliberately which way a boundary falls and write the comparison that says it.

The two `except` clauses show why the type hierarchy is worth the extra line. A caller that cares about dropouts specifically catches `DropoutError`; the same caller catches `TelemetryError` for everything else this module can raise, including the empty-record case and any error type added later. Without the custom types, the empty record would have surfaced as a `ZeroDivisionError` from the division — a true statement about the arithmetic that says nothing about the data.
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

::: warning
Do not use exceptions for ordinary control flow you can test for directly. `if key in limits:` is clearer than catching `KeyError`, and `if not samples:` is clearer than catching `ZeroDivisionError` from the division that follows. Exceptions are for what you cannot cheaply check in advance — the file that was deleted between your check and your open, the line that turned out not to be a number.
:::

## Check yourself

::: check
Why does a bare `except:` around `total = sum(sampels)` make a typo harder to find than no handler at all?
:::

::: answer
Because the misspelled name raises `NameError`, which the bare `except` catches along with everything else. The program continues with whatever the handler assigned — zero, typically — and produces output that looks like a result. Without the handler, Python would stop and print a traceback naming `sampels` and the line it is on, which is a complete diagnosis. The handler converted a self-announcing failure into a silent wrong answer. Name the exception you expect — `except ValueError` — and a `NameError` will still stop the program.
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
`cleanup` first, then `from try`. The `return` inside `try` does not leave the function until the `finally` block has run, so the print inside `finally` happens before the value reaches the caller. This is the property that makes `finally` safe for cleanup: there is no path out of the `try` block — success, exception or return — that skips it.
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
Separate the two lookups so that each `try` guards one thing, and say which one failed:

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

The original cannot tell you which table was missing the key, and the two cases mean quite different things: a missing limit is an incomplete test procedure, a missing peak is a channel that did not record. The last line uses a *conditional expression*, `a if cond else b`, which is an `if` that produces a value.
:::

::: check
Why define `class DropoutError(TelemetryError)` rather than raising `ValueError` with a good message?
:::

::: answer
Because a caller can then handle it by type. With `ValueError` the caller must either catch every `ValueError` in the block — including ones from `float()` on an unrelated line — or inspect the message text, which is fragile and breaks the moment you improve the wording. A dedicated type lets one caller catch `DropoutError` specifically, another catch the base `TelemetryError` to mean "anything this module considers a bad record", and a third let it propagate; and adding a new error type derived from the same base does not break any of them.
:::

::: check
A batch job processes 500 telemetry files and must not stop because one is corrupt. Sketch the structure, and say what makes it different from a bare `except:`.
:::

::: answer
Loop over the files with a `try` around the processing of one file, catch `Exception` — not a bare `except:` — record the filename and the exception, continue, and report the failures at the end:

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

The differences from a bare `except:` are that ctrl-C and `sys.exit` still work, and that nothing is silently discarded: every failure is recorded with its type and message, and the run ends by saying how many files it could not process. A batch job that reports "500 files processed" when 40 of them failed is worse than one that crashed on file 3.
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

The next lesson opens files, which is where exceptions stop being an exercise: the file may not exist, may be unreadable, may be half-written, and every one of those is a specific exception type with a specific right response.
