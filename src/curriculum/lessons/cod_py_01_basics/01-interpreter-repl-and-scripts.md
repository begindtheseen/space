---
id: l01-interpreter-repl-and-scripts
title: The interpreter, the REPL and your first script
minutes: 18
covers:
  - Interpreter, REPL, running scripts, the difference between them
---

Python is not compiled into a program you then run. There is one program, the *interpreter*, and it reads your text and carries it out. On a Linux machine that program is the file `python3`; you hand it either a file of code or a stream of lines you type, and it does the same thing with both. Everything else in this module rests on that one picture, so it is worth getting exact before any syntax arrives.

You will use this daily as a GNC engineer. Flight software is C++, but the tools around it are Python: the script that pulls a telemetry file off a test stand and reports the axis that exceeded its limit, the Monte Carlo harness that runs a thousand dispersed descents, the one-line check of a unit conversion during a design review. The last of those is what the interactive prompt is for, and knowing when to use the prompt and when to write a file is a real skill, not a preference.

This lesson covers the three ways to run Python — interactively, from a file, and from a single command-line argument — and the differences between them that will otherwise confuse you for weeks. The most important difference is about output: the interactive prompt shows you the value of every expression you type, and a script shows you nothing you do not explicitly print.

## The interpreter is a program on your machine

Ask it what it is:

```bash
python3 --version
# Python 3.11.15
```

That is the standard implementation, CPython, written in C. When you give it code, it first *compiles* the text to bytecode — a compact instruction list for a stack machine — and then executes that bytecode. Both steps happen every time you run the file; there is no separate build step and no executable left behind. This matters in one visible way, which the last section of this lesson makes concrete: mistakes in the *shape* of your code are found before anything runs, and mistakes in its *meaning* are found only when the line in question is reached.

On most systems, `python3` is Python 3 and bare `python` is either missing or an alias for it. Type `python3` and you will never be surprised. To see which file you are actually running:

```bash
which python3
```

::: note
Every output in this module was produced by running the code on Python 3.11.15 on Linux, and copied from the terminal. Python 3.11 or newer is what the module assumes. Where a message or a behaviour changed between versions, the lesson says so; your version banner will differ from the one shown below, and that is the only difference you should expect.
:::

## The REPL: type a line, see its value

Run `python3` with no arguments and you get an interactive session, called the *REPL* for read–eval–print loop: it reads a line, evaluates it, prints the result, and loops. The `>>>` is its prompt, asking for the next line.

```python
Python 3.11.15 (main, Mar  3 2026, 09:26:23) [GCC 13.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> 7700 * (1 / 40)
192.5
>>> dt = 1 / 40
>>> dt
0.025
```

Three things happened there. The first line is an *expression* — something with a value — so the REPL printed its value, 192.5. The second line is an *assignment*, a *statement* that binds the name `dt` to a value; a statement has no value, so nothing was printed. The third line is an expression again, just the name `dt`, and its value came back.

Leave the session with `exit()`, or by pressing ctrl-D on an empty line. What you typed is gone when you leave: the REPL keeps nothing on disk.

Use the REPL for questions you can answer in one line. What is 51.6 degrees in radians. How many metres does a vehicle travel in one 40 Hz frame at orbital speed. What does this string method return on this string. The answer arrives in two seconds, and two seconds is the whole point.

::: example One frame of flight
A vehicle in low Earth orbit moves at about 7.7 km/s, and a guidance loop typically runs at tens of hertz. How far does the vehicle travel between one guidance update and the next at 40 Hz, and what does that distance become if the rate drops to 10 Hz?

At the prompt, with `_` standing for the value the previous line produced:

```python
>>> 7700 * 0.025
192.5
>>> _ / 1000
0.1925
>>> 7700 * (1 / 10)
770.0
```

So 192.5 m per frame at 40 Hz — about 0.19 km — and 770 m per frame at 10 Hz. That is the number that decides whether a guidance law can be run at 10 Hz: if your targeting error budget is 100 m, an update rate that lets the vehicle move 770 m between corrections is not a design, it is a hope. The whole calculation took one prompt and no file.

The underscore is a convenience of the interactive prompt only. It does not exist in a script, and code that relies on it will not run there.
:::

## What gets printed, and what `print` is for

The REPL prints the *representation* of a value, which is not always the same as the text of the value. Python has two ways to turn an object into text. `repr` is meant for you, the programmer, and shows enough to tell what the object is — a string comes back with quotes around it. `str` is meant for a reader, and gives the plain text. The REPL echoes `repr`; the built-in function `print` writes `str`.

```python
>>> "descent"
'descent'
>>> print("descent")
descent
>>> 0.1 + 0.2
0.30000000000000004
>>> print(0.1 + 0.2)
0.30000000000000004
```

The quotes in the second line are the REPL telling you "this is a string of seven characters", not part of the string. For numbers there is no difference — `repr` and `str` of a float have been the same shortest text that reads back exactly since Python 3.1 — which is why the last two lines agree, and incidentally why one tenth plus two tenths is not three tenths. That result is not a mistake in Python and it is not a mistake in your machine; lesson 12 takes it apart properly.

::: key
The REPL prints `repr(value)` after every expression you type, and prints nothing after a statement such as an assignment. A script prints nothing at all unless you call `print`. `repr` is the programmer-facing form (`'descent'`, with quotes); `str` is the plain form (`descent`), and `print` writes the plain form.
:::

## Running a script

A script is a text file of Python, by convention named with a `.py` suffix, run by handing it to the interpreter. Put this in a file called `frame.py` — throughout this module, the comment on the first line of a code block is the name of the file it belongs in:

```python
# frame.py
speed = 7700.0      # m/s, roughly low Earth orbit
rate = 40.0         # Hz, the guidance frame rate
speed / rate        # computed, then thrown away: a script echoes nothing
print(speed / rate)  # 192.5
```

and run it:

```bash
python3 frame.py
# 192.5
```

One line of output, not two. The third line of the file computed 192.5 and discarded it, because in a file nothing is echoed. This is the single most common surprise when you move from the prompt to a file, and it is worth saying in the strongest terms: **in a script, a value you do not print does not exist**. Beginners write a whole calculation, run it, see an empty terminal, and conclude that nothing ran. Everything ran.

For a calculation too small even for a file, `-c` runs one command straight from the shell:

```bash
python3 -c "print(7700.0 / 40.0)"
# 192.5
```

The quotes are the shell's, not Python's: they keep the whole program as one argument.

A script can also be made directly executable, which is how a tool you run often should end up. The first line, the *shebang*, tells the kernel which interpreter to feed the file to, and the file needs the execute permission bit:

```python
#!/usr/bin/env python3
# frame2.py
print("frame distance:", 7700.0 / 40.0, "m")
```

```bash
chmod +x frame2.py
./frame2.py
# frame distance: 192.5 m
```

`print` takes several values and writes them separated by single spaces, ending with a newline. The shebang must be the very first line of the file to work, and `/usr/bin/env python3` finds whichever `python3` is first on your path — which will matter in lesson 13, when the right `python3` is the one inside a project's virtual environment.

::: example From the prompt to a file
You worked out a launch azimuth conversion at the prompt and now want to keep it. The session was:

```python
>>> import math
>>> math.radians(51.6)
0.9005898940290741
```

`import math` makes the standard library's mathematics module available, and `math.radians` converts degrees to radians. Copying those two lines into `azimuth.py` and running it prints nothing, because the second line is an expression whose value is discarded. The file has to say what to show:

```python
# azimuth.py
import math

azimuth_deg = 51.6
azimuth_rad = math.radians(azimuth_deg)
print(azimuth_deg, "deg =", azimuth_rad, "rad")  # 51.6 deg = 0.9005898940290741 rad
```

```bash
python3 azimuth.py
# 51.6 deg = 0.9005898940290741 rad
```

51.6 degrees is the inclination of the International Space Station's orbit, and radians are what every trigonometric function in the standard library expects. The conversion belongs in a file because you will need it again tomorrow; the exploration belonged at the prompt because you needed it once.
:::

## Comments, and what not to name your file

Everything after a `#` on a line is a *comment*: the interpreter ignores it. Comments explain why, not what — `# Hz, the guidance frame rate` earns its place; `# multiply speed by time` does not. This module also uses comments to show you what a line prints, as in the examples above.

One naming rule, now, because it costs a beginner an hour when it bites. Do not name a file after a module you intend to import. A file of your own called `random.py` sitting in the directory you run from is found *before* the standard library's `random`, so `import random` imports your file, and the first use of it fails with `AttributeError: module 'random' has no attribute 'uniform'` — a message that points nowhere near the actual problem. Lesson 9 explains the search order that causes this, and why a file called `math.py` happens to escape it while `csv.py`, `json.py` and `random.py` do not.

## Two kinds of error, and when each is found

Python checks the shape of the whole file before it runs any of it. A missing bracket is found at that stage, and nothing executes:

```python
# bad1.py
speed = 7700.0
print("distance per frame:", speed / 40.0
```

```bash
python3 bad1.py
#   File ".../bad1.py", line 3
#     print("distance per frame:", speed / 40.0
#          ^
# SyntaxError: '(' was never closed
```

A misspelled name is a different matter. The shape is fine, so compilation succeeds and the file starts running; the error appears at the moment that line is reached:

```python
# bad2.py
speed = 7700.0
print(speeed / 40.0)
```

```bash
python3 bad2.py
# Traceback (most recent call last):
#   File ".../bad2.py", line 3, in <module>
#     print(speeed / 40.0)
#           ^^^^^^
# NameError: name 'speeed' is not defined. Did you mean: 'speed'?
```

Read those from the bottom. The last line names the problem; the lines above it say where. The `...` in the path stands for whatever directory your copy of the file is in — the interpreter prints the full path, and yours is not mine. The `^^^^^^` underneath points at the offending expression, and the suggestion at the end is Python noticing that you have a name one letter away. Lesson 10 reads tracebacks properly, including ones many frames deep.

::: warning
An empty terminal after running a script means the script produced no output, not that it did not run. Before you start debugging a program that "does nothing", add a `print` and prove to yourself which lines are reached. And never conclude from a silent run that a calculation succeeded.
:::

## Check yourself

::: check
At the prompt you type `dt = 1 / 40` and nothing is printed; you then type `dt` and `0.025` appears. You put both lines in a file and run it, and the terminal stays empty. Explain each of the three behaviours in one sentence, and fix the file.
:::

::: answer
The assignment is a statement, so it has no value for the REPL to echo. The bare name `dt` is an expression, so the REPL echoes its value, 0.025. In a file nothing is echoed at all, so both lines run and produce no output. The fix is to ask for output explicitly:

```python
# dt.py
dt = 1 / 40
print(dt)  # 0.025
```
:::

::: check
Why does `"descent"` come back from the prompt with quotes while `print("descent")` does not, and which of the two is what a log file or a report should contain?
:::

::: answer
The prompt echoes `repr`, whose job is to show what the object is — quotes included, so you can tell the string `'7'` from the number `7`. `print` writes `str`, the plain text. A log file or a report wants the plain text, so it wants `print`. When debugging, the quoted form is often what you want, because it distinguishes an empty string from a string of two spaces.
:::

::: check
You are asked whether a guidance loop at 25 Hz keeps the vehicle's movement between updates under 350 m at 7.7 km/s. Answer it the way you would in a review, and say why the prompt is the right tool rather than a file.
:::

::: answer
One frame is 1/25 s = 0.04 s, so the distance is $7700 \times 0.04 = 308$ m, which is under 350 m. At the prompt:

```python
>>> 7700 * (1 / 25)
308.0
```

It is a question asked once, whose answer is a single number, and which nobody needs to re-run tomorrow. That is exactly the REPL's job. A file would be the right tool if the rate were one of several to be compared, or if the answer had to go into a report that will be regenerated when the speed estimate changes.
:::

::: check
Both of these files fail. Which one gets as far as printing something, and why?

```python
# a.py
print("starting")
print("rate:", 40.0
```

```python
# b.py
print("starting")
print("rate:", rate)
```
:::

::: answer
`b.py` prints `starting`; `a.py` prints nothing. The unclosed bracket in `a.py` is a syntax error, found while the file is being compiled, which happens in full before any line executes — so the first `print` never runs:

```bash
python3 a.py
#   File ".../a.py", line 3
#     print("rate:", 40.0
#          ^
# SyntaxError: '(' was never closed
```

In `b.py` the shape is valid, so execution begins, the first line runs, and only then does the second line fail:

```bash
python3 b.py
# starting
# Traceback (most recent call last):
#   File ".../b.py", line 3, in <module>
#     print("rate:", rate)
#                    ^^^^
# NameError: name 'rate' is not defined. Did you mean: 'range'?
```

The suggestion is Python looking for a near-miss among the names it does know, and `range` is a built-in you meet in lesson 4 — a reminder that the suggestion is a guess, not a diagnosis. The rule to keep: syntax errors precede all output; name errors appear after whatever came before them.
:::

::: check
What is wrong with keeping a day's work as a REPL session, and what is wrong with exploring a new telemetry file by editing and re-running a script?
:::

::: answer
A REPL session is not saved, cannot be re-run, cannot be reviewed by a colleague and cannot be tested; anything you want tomorrow must be in a file. Conversely, exploring in a script means re-running the whole file — including re-reading a large file — for every small question, so the loop is slow. The working habit is both: explore at the prompt, and move anything worth keeping into a file as soon as it works.
:::

## Summary

| Item | What it is |
| --- | --- |
| Interpreter | The `python3` program; compiles your text to bytecode and executes it, every run |
| REPL | Interactive prompt (`>>>`); reads a line, evaluates it, prints `repr` of the value |
| Statement vs expression | An assignment has no value and echoes nothing; an expression has a value and echoes it |
| Script | A `.py` file run as `python3 file.py`; echoes nothing, prints only what `print` prints |
| `python3 -c "…"` | Runs one program given as a command-line argument |
| Shebang | `#!/usr/bin/env python3` as the first line, plus `chmod +x`, makes the file runnable as `./file.py` |
| `repr` vs `str` | `'descent'` versus `descent`; the prompt shows the first, `print` writes the second |
| SyntaxError | Bad shape; found while compiling, so no line of the file runs |
| NameError | Bad meaning; found at the moment the line runs, after earlier output has appeared |

The next lesson fills in what those values actually are — integers, floats, booleans and strings — and how to format them into the lines a report or a log is made of.
