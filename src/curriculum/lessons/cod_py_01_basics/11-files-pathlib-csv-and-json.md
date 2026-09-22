---
id: l11-files-pathlib-csv-and-json
title: Files, paths, CSV and JSON
minutes: 16
covers:
  - Files, pathlib, csv and json
---

Nothing you have written so far has touched anything outside the program. Real analysis starts with a file someone else produced — a CSV from a test stand, a JSON configuration, a directory of runs — and ends with a file someone else will read. This lesson is about that boundary.

Three tools cover almost all of it. `pathlib` builds and inspects paths without string surgery. The `csv` module reads and writes the comma-separated tables that every data-acquisition system on earth can export. The `json` module reads and writes the nested structures that configuration and summaries want. Each is a few lines of the standard library, and each replaces a class of bug you would otherwise write yourself: paths joined with the wrong separator, a CSV split on commas that were inside a quoted field, a summary written out with `print` and unreadable by anything but a human.

The module's objective is to read a CSV of time-tagged accelerometer data and report statistics per axis. By the end of this lesson you will have the reading half of that, and everything needed to write the answer back out in a form the next script can consume.

## Paths are objects, not strings

`Path` comes from `pathlib`. The `/` operator joins parts, and the result knows how to take itself apart:

```python
# paths.py
from pathlib import Path

p = Path("data") / "run_07.csv"

print(p)          # data/run_07.csv
print(p.name)     # run_07.csv
print(p.stem)     # run_07
print(p.suffix)   # .csv
print(p.parent)   # data
print(p.exists()) # False
print(Path("/home/gnc") / "analysis" / "run.csv")   # /home/gnc/analysis/run.csv
```

Joining with `/` puts in the right separator for the platform, so the same code works on Windows, where paths are spelled with backslashes. Joining with string concatenation does not, and neither does it cope with a part that already ends in a separator. `.name`, `.stem`, `.suffix` and `.parent` replace the string slicing people write instead and get wrong for a file called `run.07.csv`.

A path that is built from where your *code* lives, rather than from where the program happens to be run, keeps working when someone runs your script from another directory:

```python
# data_path.py
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data" / "run_07.csv"

print(DATA.name)           # run_07.csv
print(DATA.is_absolute())  # True
```

`__file__` is the path of the file being run, `.resolve()` makes it absolute and removes any `..`, and `.parent` gives the directory containing it. This four-line pattern is the right way to find a data file that ships beside a script, and it is worth making a habit: a hard-coded `/home/you/data/x.csv` breaks for every other person, and a bare `data/x.csv` breaks the first time the script is run from anywhere but its own directory.

Creating directories and listing them:

```python
# organise.py
from pathlib import Path

out = Path("results") / "run_07"
out.mkdir(parents=True, exist_ok=True)
(out / "summary.txt").write_text("ok\n", encoding="utf-8")

names = []
for child in out.iterdir():
    names.append(child.name)

print(sorted(names))         # ['summary.txt']
print(out.is_dir())          # True
print((out / "summary.txt").stat().st_size)   # 3
```

`parents=True` creates intermediate directories, and `exist_ok=True` makes the call succeed when the directory is already there — without it, a second run raises `FileExistsError`. `.iterdir()` lists a directory; `.glob("*.csv")` lists only what matches a pattern; `.rglob("*.csv")` searches subdirectories too. Wrap either in `sorted` if the order matters, because the filesystem's order is not defined.

::: key
Build paths with `pathlib.Path` and `/`, never with string concatenation. Derive a data path from `Path(__file__).resolve().parent` so it survives being run from any working directory. `mkdir(parents=True, exist_ok=True)` is the idempotent form.
:::

## Reading and writing text

For a whole small file, `Path` does it in one call. For anything larger, or anything you want to process line by line, open it:

```python
# notes.py
from pathlib import Path

out = Path("notes.txt")
out.write_text("first line\nsecond line\n", encoding="utf-8")

print(repr(out.read_text(encoding="utf-8")))
# 'first line\nsecond line\n'

with open("notes.txt", encoding="utf-8") as f:
    for i, line in enumerate(f, start=1):
        print(i, repr(line))
# 1 'first line\n'
# 2 'second line\n'

with open("notes.txt", "a", encoding="utf-8") as f:
    f.write("third line\n")

print(repr(out.read_text(encoding="utf-8")))
# 'first line\nsecond line\nthird line\n'
```

Four things to take from that.

**`with` closes the file.** `with open(...) as f:` opens the file, binds it to `f`, and closes it when the block ends — on success, on an exception, on a `return`. It is the `finally` of lesson 10 in one word, and it is not optional politeness: a file left open may have its last writes unflushed when the program ends, and a loop that opens files without closing them runs out of file descriptors.

**Lines keep their newline.** Iterating a file yields each line *including* the `\n`, which is why the `repr` shows it and why `line.strip()` is the first thing most parsers do. Iterating is also the memory-safe way to read: `f.read()` and `f.readlines()` pull the whole file into memory, which is fine for a configuration file and not for a 2 GB telemetry log.

**The mode says what you are doing.** `"r"` reads (the default), `"w"` truncates the file to nothing and writes, `"a"` appends. `"w"` on an existing file destroys it without asking, which is worth a moment's care with a filename built from a variable.

**Say the encoding.** `encoding="utf-8"` makes the behaviour the same on every machine; without it Python uses a platform default that has been the source of a lot of confusing failures on files containing a degree sign.

Finally, the error you will meet most:

```python
# missing.py
from pathlib import Path

try:
    Path("missing.csv").read_text(encoding="utf-8")
except FileNotFoundError as e:
    print(type(e).__name__, "-", e)
# FileNotFoundError - [Errno 2] No such file or directory: 'missing.csv'
```

The message includes the name it tried, which is usually enough to see that a relative path was resolved against a working directory you did not expect.

## CSV, properly

A CSV file is a text file of rows, fields separated by commas. It is tempting to read one with `line.split(",")`, and for a file you generated yourself that works — until a field contains a comma, or a quoted string, or a newline inside quotes, all of which are legal and all of which `split` gets wrong. Use the module.

Writing:

```python
# write_csv.py
import csv
from pathlib import Path

rows = [
    {"t": 0.0, "ax": 0.02, "ay": -0.41, "az": 9.79},
    {"t": 0.1, "ax": 0.11, "ay": 0.05, "az": 9.80},
    {"t": 0.2, "ax": 3.94, "ay": 0.22, "az": 12.06},
]

with open("run_07.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["t", "ax", "ay", "az"])
    writer.writeheader()
    writer.writerows(rows)

print(Path("run_07.csv").read_text(encoding="utf-8"), end="")
# t,ax,ay,az
# 0.0,0.02,-0.41,9.79
# 0.1,0.11,0.05,9.8
# 0.2,3.94,0.22,12.06
```

`newline=""` in the `open` call is required by the `csv` module: it does its own line-ending handling, and without this you get blank lines between rows on Windows. Note also that `9.80` was written as `9.8` — the trailing zero was never part of the number, and if the file is for a human you must format the values yourself.

Reading gives you **strings**, always:

```python
# read_csv.py
import csv

with open("run_07.csv", newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)
# ['t', 'ax', 'ay', 'az']
# ['0.0', '0.02', '-0.41', '9.79']
# ['0.1', '0.11', '0.05', '9.8']
# ['0.2', '3.94', '0.22', '12.06']
```

`csv.reader` yields a list of strings per row, header included. Nothing is converted — `'9.79'` is text, and lesson 2 showed what happens if you sort or compare it as if it were a number.

::: example From a CSV to a list of records
`csv.DictReader` reads the header line and gives each row as a dictionary keyed by column name. That is worth more than it sounds: a script written against column *names* keeps working when someone inserts a column, and one written against `row[2]` does not.

```python
# read_records.py
import csv

records = []

with open("run_07.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        record = {}
        for name, text in row.items():
            record[name] = float(text)
        records.append(record)

print(len(records))             # 3
print(records[0])               # {'t': 0.0, 'ax': 0.02, 'ay': -0.41, 'az': 9.79}
print(records[0]["az"])         # 9.79
print(type(records[0]["az"]))   # <class 'float'>
```

The inner loop is where the conversion happens, and it must happen somewhere: `DictReader` does not know that `az` is a number. Converting every field with `float` is right for this file and wrong for one with a text column, where you would convert the numeric fields by name and leave the rest alone.

This is the shape the module's accelerometer exercise works on — a list of dictionaries with keys `t`, `ax`, `ay`, `az` — so what you have just built is its input. A real file also needs the `try`/`except ValueError` of lesson 10 around that `float`, and a count of the rows it skipped.

One decision deserves stating. Three rows fit in memory, and so do three million; ten million samples of four columns will not. When a file is too big to hold, the `for row in reader:` loop is already the answer — accumulate the statistics you need inside the loop and never build the list at all. `csv.DictReader` reads one row at a time from the file, so it never needs the whole file in memory either.
:::

## JSON for anything nested

CSV is a table. Configuration, summaries and anything with structure want JSON, which maps directly onto Python's own containers:

| Python | JSON |
| --- | --- |
| `dict` | object |
| `list`, `tuple` | array |
| `str` | string |
| `int`, `float` | number |
| `True` / `False` | `true` / `false` |
| `None` | `null` |

```python
# write_json.py
import json
from pathlib import Path

summary = {
    "run": "run_07",
    "rate_hz": 10,
    "channels": ["ax", "ay", "az"],
    "peak": {"ax": 3.94, "az": 12.06},
    "passed": True,
    "notes": None,
}

Path("summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
print(Path("summary.json").read_text(encoding="utf-8"))
# {
#   "run": "run_07",
#   "rate_hz": 10,
#   "channels": [
#     "ax",
#     "ay",
#     "az"
#   ],
#   "peak": {
#     "ax": 3.94,
#     "az": 12.06
#   },
#   "passed": true,
#   "notes": null
# }
```

`json.dumps` returns a string; `json.dump(obj, f)` writes to an open file. `indent=2` makes it readable and diffable, which matters when the file is in version control; leave it out for machine-to-machine traffic. `True` became `true` and `None` became `null`, because those are JSON's spellings.

Reading is the mirror image — `json.loads` from a string, `json.load` from an open file — and gives you ordinary Python containers back.

::: example A summary written and read back, and the one thing that changes
```python
# roundtrip_json.py
import json

summary = {
    "run": "run_07",
    "window": (0.0, 0.2),
    "passed": True,
    "notes": None,
}

text = json.dumps(summary)
back = json.loads(text)

print(text)                  # {"run": "run_07", "window": [0.0, 0.2], "passed": true, "notes": null}
print(back["window"])        # [0.0, 0.2]
print(type(back["window"]))  # <class 'list'>
print(back["passed"], back["notes"])   # True None
print(back == summary)       # False
```

Everything survived the round trip except the type of `window`. JSON has one kind of sequence, so the tuple was written as an array and came back as a **list** — and that is why the last line is `False`: `(0.0, 0.2) == [0.0, 0.2]` is false, a tuple is never equal to a list. Nothing was lost numerically, and a program that compares the loaded configuration with the one it wrote will still report a difference.

So: JSON preserves values, not Python types. Tuples become lists, dictionary keys become strings (a key of `1` returns as `"1"`), and sets, dates and NumPy arrays cannot be written at all without telling `json` how. Keep what you write to the six types in the table above, and convert at the boundary.

If the text is not valid JSON, `json.loads` raises, and the message locates the problem:

```python
# bad_json.py
import json

try:
    json.loads("{'run': 'run_07'}")
except json.JSONDecodeError as e:
    print(type(e).__name__ + ":", e)
# JSONDecodeError: Expecting property name enclosed in double quotes: line 1 column 2 (char 1)
```

JSON requires double quotes; that string is Python's dictionary syntax, not JSON, and is the most common thing people paste into a file by hand.
:::

::: warning
Opening a file in `"w"` mode empties it immediately, before you write anything. If the filename is computed — from a run number, a channel name, an argument — check what you are about to overwrite, or write to a temporary name and rename. The same care applies to `Path.write_text`, which is `"w"` with fewer keystrokes.
:::

## Check yourself

::: check
Why does `open(path, "w", newline="")` appear in every CSV-writing example, and what goes wrong without it?
:::

::: answer
The `csv` module writes its own line endings — `\r\n` by default, as the CSV format specifies. If the file object is also translating `\n` into the platform line ending, the two combine and every row is followed by a blank line on Windows. `newline=""` turns off the file object's translation and leaves the line endings to `csv`, which is what its documentation requires. On Linux you may never see the fault, which is exactly why it should be written every time: the file that comes out wrong is the one you send to a colleague.
:::

::: check
A script does `data = Path("data/run_07.csv").read_text()` and works when you run it from the project directory but raises `FileNotFoundError` when a colleague runs it from their home directory. Explain and fix.
:::

::: answer
A relative path is resolved against the *current working directory*, not against the script. Run from elsewhere, `data/run_07.csv` names a file that does not exist there. Fix it by deriving the path from the script's own location:

```python
# anchored_read.py
from pathlib import Path

HERE = Path(__file__).resolve().parent
(HERE / "data").mkdir(exist_ok=True)
(HERE / "data" / "run_07.csv").write_text("t,ax\n0.0,0.02\n", encoding="utf-8")

data = (HERE / "data" / "run_07.csv").read_text(encoding="utf-8")
print(data, end="")
# t,ax
# 0.0,0.02
```

Now the path is absolute and anchored to where the code lives, so the working directory is irrelevant. The alternative — requiring everyone to `cd` first — is a line in a README that people will not read.
:::

::: check
`csv.reader` returned `['0.1', '0.11', '0.05', '9.8']` for a row. What must happen before you can compute a mean, and what is the failure mode if you forget?
:::

::: answer
Every field must be converted with `float`. If you forget, `sum` raises `TypeError` — which is the good case. The bad case is anything that *works* on strings and means something else: `max` returns the alphabetically largest, so `'9.8'` beats `'12.06'` because `'9'` sorts after `'1'`; `sorted` orders the column wrongly; and `+` concatenates. None of those raises, and all of them produce a report that looks finished.
:::

::: check
You write `{"window": (0.0, 0.2)}` to JSON and read it back, then compare it with the original dictionary. Why does the comparison fail, and what should the code do instead?
:::

::: answer
JSON has a single sequence type, so the tuple is written as an array and read back as a list; `(0.0, 0.2) == [0.0, 0.2]` is `False`, so the dictionaries differ. Either store the value as a list in the first place, so the round trip is exact, or compare field by field with the types normalised — `tuple(back["window"]) == summary["window"]`. The general rule: JSON preserves values, not Python types, so anything you intend to round-trip should already be one of JSON's six types.
:::

::: check
What does `with` give you that `f = open(...)` followed by `f.close()` does not?
:::

::: answer
It closes the file even when the block is left by an exception or a `return`. Written by hand, that needs `try`/`finally`, and the `finally` is what people forget; the failure is then invisible in testing, because CPython usually closes the file when the object is collected. The visible symptoms come later and in production: data missing from the end of a file because the last buffer was never flushed, a file still locked on Windows, or a long-running loop exhausting the process's file descriptors.
:::

## Summary

| Item | Statement |
| --- | --- |
| `Path("a") / "b"` | Portable joining; `.name`, `.stem`, `.suffix`, `.parent`, `.exists()` |
| Script-relative data | `HERE = Path(__file__).resolve().parent`, then `HERE / "data" / "x.csv"` |
| Directories | `mkdir(parents=True, exist_ok=True)`, `.iterdir()`, `.glob("*.csv")`, `.rglob(...)` |
| Whole small file | `Path.read_text(encoding="utf-8")`, `Path.write_text(...)` |
| `with open(path) as f` | Closes on success, exception and return; always give `encoding="utf-8"` |
| Modes | `"r"` read, `"w"` truncate and write, `"a"` append |
| Line iteration | `for line in f:` keeps the `\n` and does not load the file into memory |
| Missing file | `FileNotFoundError: [Errno 2] No such file or directory: 'missing.csv'` |
| CSV | `csv.reader` gives lists of strings; `csv.DictReader` gives dicts keyed by header |
| CSV writing | `csv.DictWriter(f, fieldnames=...)`, `writeheader()`, `writerows(rows)`, `newline=""` |
| Conversion | CSV fields are always text; convert with `float`/`int` as you read |
| JSON | `json.dumps`/`loads` for strings, `dump`/`load` for files, `indent=2` to be diffable |
| JSON types | dict, list, str, number, bool, null; a tuple returns as a list, keys return as strings |

The next lesson goes back to the numbers themselves. Every float you have read out of a CSV in this lesson is an approximation, and the lesson explains exactly which approximation, why `0.1 + 0.2` is not `0.3`, and what to compare with instead of `==`.
