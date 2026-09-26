---
id: l11-files-pathlib-csv-and-json
title: Files, paths, CSV and JSON
minutes: 20
covers:
  - Files, pathlib, csv and json
---

Think of a relay race. You take the baton from the runner behind you, run your leg, and hand it to the runner ahead. If either handoff is fumbled, it does not matter how fast you ran.

Nothing you have written so far in this module has touched anything outside the program. Real analysis is a relay. It starts with a file someone else produced — a CSV from a test stand, a JSON configuration, a directory of runs — and ends with a file someone else will read. This lesson is about those two handoffs.

Three tools from Python's standard library cover almost all of it:

- `pathlib` builds and inspects file paths without cutting strings apart by hand.
- `csv` reads and writes comma-separated tables, which every data-acquisition system on Earth can export.
- `json` reads and writes the nested structures that configurations and summaries want.

Each one replaces a kind of bug you would otherwise write yourself: paths joined with the wrong separator, a CSV split on commas that were inside a quoted field, a summary written with `print` that nothing but a human can read.

One of this module's goals is to read a CSV of time-tagged accelerometer data and report statistics for each axis. By the end of this lesson you will have the reading half of that, and everything you need to write the answer back out in a form the next script can use.

## Paths are objects, not strings

A **path** is a file's address: the chain of folders you walk through to reach it, then its name. You could keep it as a plain string. But Python's `Path` type, from the `pathlib` module, understands addresses. Its `/` operator joins parts — read `Path("data") / "run_07.csv"` aloud as "data, then run_07.csv inside it". And the result knows how to take itself apart:

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
print(Path("~").expanduser() == Path.home())        # True
```

Line by line:

- `.name` is the last part, the file's full name.
- `.stem` is the name without its ending.
- `.suffix` is the ending, dot included. For `run.07.csv` it is `.csv` and the stem is `run.07`, which is exactly where hand-written string slicing usually goes wrong.
- `.parent` is the folder that holds it.
- `.exists()` asks the disk whether anything is really there. Building a `Path` does not create a file.
- `.expanduser()` turns a leading `~` — your home folder in the shell — into the real address, and `Path.home()` gives that home folder directly.

Joining with `/` puts in the **[[right separator for the platform|path-separators]]**, so the same code works on Windows, where paths are written with backslashes. Gluing strings together with `+` does not. It also cannot cope with a part that already ends in a separator.

### Finding a file that lives beside your script

A **relative path** like `data/x.csv` has no starting point written in it. Python measures it from the **current working directory** — the folder the program was *started* from, which may be anywhere. A path built from where your *code* lives keeps working no matter where someone runs it from:

```python
# data_path.py
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data" / "run_07.csv"

print(DATA.name)           # run_07.csv
print(DATA.is_absolute())  # True
```

Here is what each piece does.

1. `__file__` is the path of this source file — the file that holds this code. Lesson 9 used it to show where a module was loaded from.
2. `.resolve()` makes that path **absolute** (starting from the very top of the disk), removes any `..` steps, and follows any shortcuts (symbolic links).
3. `.parent` gives the folder containing the file.

That pattern — **[[`HERE`, then join|here-pattern]]** — is the right way to find a data file that ships beside a script. Make it a habit. A hard-coded `/home/you/data/x.csv` breaks for every other person. A bare `data/x.csv` breaks the first time the script is run from anywhere but its own folder.

### Making and listing folders

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

`mkdir` makes a folder. `parents=True` also makes any missing folders above it, here `results`. `exist_ok=True` makes the call succeed when the folder is already there; without it, a second run raises `FileExistsError`.

With both, running the script twice does the same thing as running it once. A step like that is called **idempotent**, and it is what you want in anything that sets up folders.

Then `.iterdir()` lists everything in a folder. `.glob("*.csv")` lists only the names that match a pattern, and `.rglob("*.csv")` searches every folder below it too. The filesystem hands names back in no promised order, so wrap the result in `sorted` whenever order matters.

The last line is a sanity check: `.stat().st_size` is the file's size in bytes. `"ok\n"` is three characters, `o`, `k` and a newline, so 3 bytes is right.

::: key
Build paths with `pathlib.Path` and `/`, never with string concatenation. Derive a data path from `Path(__file__).resolve().parent` so it survives being run from any working directory. `mkdir(parents=True, exist_ok=True)` is the idempotent form.
:::

## Reading and writing text

For a whole small file, `Path` does the job in one call: `read_text` and `write_text`. For anything larger, or anything you want to handle one line at a time, you **open** the file:

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

**`with` closes the file.** Read `with open(...) as f:` as "open this, call it `f`, and close it when the block ends". It closes the file on success, on an exception and on a `return`. It is the `finally` of lesson 10 in one word. And it is not optional politeness. Data you write sits in a **[[buffer|write-buffer]]** in memory first, so a file left open may lose its last writes when the program ends. And a loop that opens files without closing them eventually runs out of **[[file descriptors|file-descriptors]]**, the operating system's handles on open files.

**Lines keep their newline.** Looping over a file gives each line *including* its `\n`. That is why the `repr` shows it, and why `line.strip()` is the first thing most parsers do. Looping is also the memory-safe way to read, since only one line is held at a time. `f.read()` and `f.readlines()` pull the whole file into memory. That is fine for a configuration file and not for a 2 GB telemetry log.

**The mode says what you are doing.** The second argument to `open` is the **mode**:

- `"r"` reads (the default);
- `"w"` empties the file to nothing, then writes;
- `"a"` appends — adds to the end.

`"w"` on an existing file destroys it without asking. Take a moment's care with a filename built from a variable.

**Say the encoding.** A file on disk is bytes, and the **encoding** is the rule that turns bytes into letters. `encoding="utf-8"` makes the behavior the same on every machine. Without it, Python uses a platform default, and that has caused a lot of confusing failures on files containing a **[[degree sign|degree-sign]]**.

Last, the error you will meet most:

```python
# missing.py
from pathlib import Path

try:
    Path("missing.csv").read_text(encoding="utf-8")
except FileNotFoundError as e:
    print(type(e).__name__, "-", e)
# FileNotFoundError - [Errno 2] No such file or directory: 'missing.csv'
```

The message includes the name it tried. That is usually enough to see that a relative path was measured from a working directory you did not expect.

## CSV, properly

A **CSV** file — comma-separated values — is a text file of rows, with the fields in each row separated by commas. The first row is usually a **header**: the names of the columns.

It is tempting to read one with `line.split(",")`. For a file you made yourself, that works — until a field contains a comma, or a quoted string, or a newline inside quotes. All of those are legal, and `split` gets **[[every one of them wrong|csv-quoting]]**. Use the module.

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

A `csv.DictWriter` writes dictionaries as rows. `fieldnames` fixes the column order. `writeheader()` writes the header row, and `writerows(rows)` writes one line per dictionary.

`newline=""` in the `open` call is required by the `csv` module. It handles **[[line endings|crlf]]** itself, and without this you get blank lines between the rows on Windows.

Notice also that `9.80` was written as `9.8`. The trailing zero was never part of the number — `9.80` and `9.8` are the same float. If the file is meant for a human, format the values yourself.

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

`csv.reader` gives one list of strings per row, header included. Nothing is converted. `'9.79'` is four characters of text, and lesson 2 showed what happens if you sort or compare text as if it were a number: `"9.81" > "10.2"` is `True`.

::: example From a CSV to a list of records
`csv.DictReader` reads the header line for you, then gives each row as a dictionary keyed by column name. That is worth more than it sounds. A script written against column *names* keeps working when someone inserts a new column. One written against `row[2]` silently reads the wrong column.

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

Step through it. The outer loop takes one row at a time, such as `{'t': '0.0', 'ax': '0.02', 'ay': '-0.41', 'az': '9.79'}` — all strings. The inner loop walks its `(name, text)` pairs and stores `float(text)` under the same name. The finished dictionary goes on the list.

Sanity checks: the file has three data rows, and `len(records)` is 3. The `az` value of the first row is `9.79`, about one $g$ (9.81 m/s²), as you would expect from an accelerometer sitting still with its z axis up. And its type is now `float`.

The inner loop is where the conversion happens, and it must happen somewhere: `DictReader` has no idea that `az` is a number. Converting every field with `float` is right for this file. For a file with a text column, such as a channel name, you would convert the number fields by name and leave the rest alone.

This is the shape the module's accelerometer exercise works on — a list of dictionaries with keys `t`, `ax`, `ay`, `az` — so what you have just built is its input. A real file also needs the `try`/`except ValueError` of lesson 10 around that `float`, and a count of the rows it skipped.

One decision deserves saying out loud. Three rows fit in memory, and so do three million. Ten million samples of four columns, stored as dictionaries of floats, take roughly 3 GB of memory — more than you want to spend. When a file is too big to hold, the `for row in reader:` loop is already the answer: work out the statistics you need inside the loop and never build the list at all. `csv.DictReader` reads one row at a time from the file, so it never needs the whole file in memory either.
:::

## JSON for anything nested

CSV is a flat table. Configurations, summaries and anything with structure — lists inside dictionaries inside dictionaries — want **[[JSON|json-origin]]**, which lines up directly with Python's own containers:

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

`json.dumps` — read it as "dump to string" — turns a Python value into JSON text. `json.dump(obj, f)`, without the `s`, writes straight into an open file.

`indent=2` puts each item on its own line, indented two spaces. That makes the file readable, and it makes a **diff** — the list of changed lines between two versions — small and clear, which matters when the file is kept in version control. Leave `indent` out for machine-to-machine traffic.

Notice that `True` became `true` and `None` became `null`. Those are JSON's spellings.

Reading is the mirror image. `json.loads` ("load from string") reads text, and `json.load` reads an open file. Both give you ordinary Python containers back.

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

Go through the round trip one key at a time. `"run"` went out as a string and came back as a string. `"passed"` went out as `true` and came back as `True`. `"notes"` went out as `null` and came back as `None`.

`"window"` is the one that changed. JSON has only one kind of sequence, the array. So the tuple was written as an array and came back as a **list**. That is why the last line is `False`: a tuple is never equal to a list, so `(0.0, 0.2) == [0.0, 0.2]` is false. Nothing was lost numerically — both numbers are intact — yet a program that compares the loaded configuration with the one it wrote will still report a difference.

So: **JSON preserves values, not Python types.** Tuples become lists. Dictionary keys become strings — a key of `1` comes back as `"1"`. Sets, dates and NumPy arrays cannot be written at all unless you tell `json` how. Keep what you write to the six types in the table, and convert at the boundary. Watch out for one float in particular: **[[NaN|json-nan]]**.

If the text is not valid JSON, `json.loads` raises an exception, and its message tells you where the problem is:

```python
# bad_json.py
import json

try:
    json.loads("{'run': 'run_07'}")
except json.JSONDecodeError as e:
    print(type(e).__name__ + ":", e)
# JSONDecodeError: Expecting property name enclosed in double quotes: line 1 column 2 (char 1)
```

JSON requires double quotes. That string uses single quotes — it is Python's dictionary syntax, not JSON — and it is the most common thing people paste into a file by hand. Column 2 is the first `'`, right after the `{`.

`JSONDecodeError` is a kind of `ValueError`, so a handler for `ValueError` catches it too.
:::

::: warning "w" empties the file before you write a byte
Opening a file in `"w"` mode empties it at once, before you write anything. If the filename is worked out by code — from a run number, a channel name, an argument — check what you are about to overwrite. Or write to a temporary name and **[[rename it into place|atomic-replace]]** at the end. The same care applies to `Path.write_text`, which is `"w"` with fewer keystrokes.
:::

## Check yourself

::: check
Why does `open(path, "w", newline="")` appear in every CSV-writing example, and what goes wrong without it?
:::

::: answer
The `csv` module writes its own line endings — `\r\n` by default, as the CSV format specifies. If the file object is *also* translating `\n` into the platform's line ending, the two combine, and on Windows every row is followed by a blank line.

`newline=""` turns off the file object's translation and leaves line endings to `csv`, which is what the `csv` documentation requires.

On Linux you may never see the fault. That is exactly why you should write it every time: the file that comes out wrong is the one you send to a colleague on another machine.
:::

::: check
A script does `data = Path("data/run_07.csv").read_text()`. It works when you run it from the project directory, but raises `FileNotFoundError` when a colleague runs it from their home directory. Explain and fix.
:::

::: answer
A relative path is measured from the *current working directory*, not from the script. Started from somewhere else, `data/run_07.csv` names a file that does not exist there.

Fix it by building the path from the script's own location:

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

(The two middle lines only create a sample file so the example runs anywhere.) Now the path is absolute and tied to where the code lives, so the working directory no longer matters. The alternative — telling everyone to `cd` into the right folder first — is a line in a README that people will not read.
:::

::: check
`csv.reader` returned `['0.1', '0.11', '0.05', '9.8']` for a row. What must happen before you can compute a mean, and what is the failure mode if you forget?
:::

::: answer
Every field must be converted with `float`.

If you forget, `sum` raises `TypeError`. That is the *good* case, because it stops you.

The bad case is anything that *works* on strings and means something else. `max` returns the alphabetically largest, so `'9.8'` beats `'12.06'` because `'9'` sorts after `'1'`. `sorted` puts the column in the wrong order. `+` joins strings end to end. None of those raises an exception, and all of them produce a report that looks finished.
:::

::: check
You write `{"window": (0.0, 0.2)}` to JSON and read it back, then compare it with the original dictionary. Why does the comparison fail, and what should the code do instead?
:::

::: answer
JSON has one sequence type. The tuple is written as an array and read back as a list, and `(0.0, 0.2) == [0.0, 0.2]` is `False`, so the two dictionaries differ.

There are two fixes. Store the value as a list in the first place, so the round trip is exact. Or compare field by field with the types made to match, such as `tuple(back["window"]) == summary["window"]`.

The general rule: JSON preserves values, not Python types. Anything you intend to round-trip should already be one of JSON's six types.
:::

::: check
What does `with` give you that `f = open(...)` followed by `f.close()` does not?
:::

::: answer
It closes the file even when the block is left by an exception or a `return`.

Written by hand, that needs `try`/`finally`, and the `finally` is what people forget. The mistake then hides in testing, because CPython — the standard Python — usually closes a file on its own once nothing refers to it any more.

The symptoms show up later, in real use: data missing from the end of a file because the last buffer was never written out, a file still locked on Windows, or a long-running loop using up all of the process's file descriptors.
:::

## Summary

| Item | Statement |
| --- | --- |
| `Path("a") / "b"` | Portable joining; `.name`, `.stem`, `.suffix`, `.parent`, `.exists()` |
| Script-relative data | `HERE = Path(__file__).resolve().parent`, then `HERE / "data" / "x.csv"` |
| Home folder | `Path("~/x").expanduser()`, `Path.home()` |
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

The next lesson goes back to the numbers themselves. Every float you read out of a CSV in this lesson is an approximation. Lesson 12 explains exactly which approximation, why `0.1 + 0.2` is not `0.3`, and what to compare with instead of `==`.

::: context path-separators Why Windows went with the backslash
Linux and macOS separate folders with `/`, a habit inherited from Unix. Windows uses `\`. The reason goes back to MS-DOS: its commands already used `/` to mark options, as in `dir /w`, so when folders arrived in DOS 2.0 the backslash was picked instead.

`pathlib` hides the difference. On Windows, `Path("data") / "run.csv"` prints as `data\run.csv`. One trap on every system: joining an absolute part throws away everything before it, so `Path("data") / "/etc"` is just `/etc`.
:::

::: context here-pattern Where HERE points
The script lives in one folder. The person running it may be standing somewhere else entirely.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="14" y="22">/home/ana/</text>
    <text x="34" y="44" fill="#b4232c">(she runs the script from here)</text>
    <text x="14" y="72">/home/ana/project/</text>
    <text x="34" y="96" fill="#1d6fd1" font-weight="700">analysis.py</text>
    <text x="34" y="120">data/</text>
    <text x="54" y="144" fill="#1d6fd1">run_07.csv</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="22" y1="78" x2="22" y2="116"/><line x1="22" y1="92" x2="30" y2="92"/><line x1="22" y1="116" x2="30" y2="116"/>
    <line x1="42" y1="126" x2="42" y2="140"/><line x1="42" y1="140" x2="50" y2="140"/>
  </g>
  <text x="200" y="96" font-size="11" fill="#1d6fd1">HERE = project/</text>
  <text x="200" y="144" font-size="11" fill="#1d6fd1">HERE / "data" / ...  works</text>
  <text x="200" y="44" font-size="11" fill="#b4232c">"data/run_07.csv"  fails</text>
  <text x="14" y="170" font-size="11" fill="#6c7a93">relative paths start at the red spot; HERE at the script</text>
</svg>
```

Ana's working directory is her home folder, so `data/run_07.csv` is looked for in `/home/ana/data`, which does not exist. `HERE` ignores where she stands.
:::

::: context write-buffer Why unclosed files lose data
Writing to the disk one character at a time would be very slow. So `f.write` puts text into a **buffer** — a waiting area in memory — and the buffer is sent to the operating system in big pieces.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="35" width="90" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">f.write(...)</text>
  <rect x="135" y="35" width="90" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">buffer</text>
  <rect x="260" y="35" width="90" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">file on disk</text>
  <line x1="100" y1="55" x2="128" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="134,55 126,51 126,59" fill="#1f2a44"/>
  <line x1="225" y1="55" x2="253" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="259,55 251,51 251,59" fill="#1f2a44"/>
  <text x="242" y="25" font-size="11" text-anchor="middle" fill="#1d6fd1">when full, or on close</text>
  <text x="180" y="98" font-size="11" text-anchor="middle" fill="#b4232c">crash before close: this part is lost</text>
</svg>
```

Closing the file **flushes** the buffer — sends whatever is left. `f.flush()` does that without closing, which a long-running logger may want after each line.
:::

::: context file-descriptors A handle on an open file
You met file descriptors in the shell module: the small numbers, like 0, 1 and 2 for standard input, output and error, that the operating system gives a program for each open file. Each process may hold only so many. On many Linux systems the default soft limit is 1024 — see yours with `ulimit -n`. A loop over thousands of run files that never closes them will hit that wall and fail with `OSError: [Errno 24] Too many open files`.
:::

::: context degree-sign The degree sign in two encodings
In UTF-8, the degree sign `°` is stored as two bytes, `C2 B0` in hex. In the old Windows encoding cp1252, each byte is a whole character. Read those two UTF-8 bytes as cp1252 and you get `Â°` — a stray `Â` in front of every temperature unit. If you ever see that in a report, the file was written in one encoding and read in another. Saying `encoding="utf-8"` on both ends prevents it.
:::

::: context csv-quoting What split gets wrong
The CSV rule for awkward fields is to wrap them in double quotes. A quote inside a field is written twice.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="14" y="24" font-size="12" fill="#1f2a44">line:  "Smith, J",9.81</text>
  <text x="14" y="56" font-size="11" fill="#b4232c">split(","):</text>
  <rect x="100" y="42" width="70" height="22" fill="#fff" stroke="#b4232c"/>
  <text x="135" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">"Smith</text>
  <rect x="176" y="42" width="50" height="22" fill="#fff" stroke="#b4232c"/>
  <text x="201" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">J"</text>
  <rect x="232" y="42" width="50" height="22" fill="#fff" stroke="#b4232c"/>
  <text x="257" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">9.81</text>
  <text x="14" y="98" font-size="11" fill="#1d6fd1">csv.reader:</text>
  <rect x="100" y="84" width="126" height="22" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="163" y="99" font-size="11" text-anchor="middle" fill="#1f2a44">Smith, J</text>
  <rect x="232" y="84" width="50" height="22" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="257" y="99" font-size="11" text-anchor="middle" fill="#1f2a44">9.81</text>
  <text x="300" y="57" font-size="11" fill="#b4232c">3 fields</text>
  <text x="300" y="99" font-size="11" fill="#1d6fd1">2 fields</text>
</svg>
```

`split` cuts at every comma and keeps the quote marks. The `csv` module knows the quoting rules, and its writer adds the quotes for you.
:::

::: context crlf Two characters for one line break
On a typewriter, starting a new line took two moves: **carriage return** pushed the paper back to the left edge, and **line feed** rolled it up one line. Early printers kept both, as the characters `\r` and `\n`. Windows still ends lines with both, `\r\n`. Linux and macOS use `\n` alone. The CSV standard, RFC 4180, uses `\r\n`, which is why the `csv` module wants to handle line endings itself.
:::

::: context json-origin JavaScript Object Notation
JSON grew out of the way JavaScript writes objects, and Douglas Crockford popularized it as a data format in the early 2000s. Its whole grammar fits on one page, which is why every language reads it. The current standard is RFC 8259. You will meet it everywhere in ground software: configuration files, web interfaces, and message payloads between tools.
:::

::: context json-nan The float JSON cannot spell
Sensors fail, and a missing reading is often stored as `float("nan")` — "not a number". Strict JSON has no way to write NaN or infinity. Python's `json.dumps` writes the bare word `NaN` anyway, which Python can read back but many other tools reject as invalid JSON. Pass `allow_nan=False` to make `json.dumps` raise a `ValueError` instead, or convert NaN to `None` (JSON's `null`) yourself before writing.
:::

::: context atomic-replace Write, then swap
Write the new data to a temporary file, say `summary.json.tmp`, in the same folder. When it is complete, call `Path("summary.json.tmp").replace("summary.json")`. On Linux and macOS, that rename is **atomic** within one filesystem: anyone reading `summary.json` sees either the whole old file or the whole new one, never half of each. If your program crashes midway, the old file is still intact.
:::
