---
id: l01-interpreter-repl-and-scripts
title: The interpreter, the REPL and your first script
minutes: 19
covers:
  - Interpreter, REPL, running scripts, the difference between them
---

Imagine you hand a recipe to a friend who reads it aloud and cooks as they go, one line at a time. Nobody translated the recipe in advance, and no finished "cooking machine" was built. The friend *is* the machine, and the recipe is only text. Python works like that. There is one program, the **[[interpreter|interpreter-pipeline]]** — the program that reads Python text and carries it out — and on a Linux machine it is called `python3`. You give it a file of code, or you type lines at it, and it does the same thing with both.

You will use this every day as a guidance, navigation and control (GNC) engineer. Flight software is written in C++, but the tools around it are Python. There is the script that reads a **telemetry** file — the stream of measurements a vehicle or test stand records — and reports which axis went over its limit. There is the harness that runs a thousand slightly different landings. And there is the one-line check of a unit conversion in the middle of a design review. That last one is what the interactive prompt is for. Knowing when to type at the prompt and when to write a file is a real skill, not a matter of taste.

This lesson covers the three ways to run Python — typing at a prompt, running a file, and passing one command from the shell — and the differences between them. The biggest difference is about output. The prompt shows you the value of everything you type. A file shows you nothing unless you ask.

## The interpreter is a program on your machine

Ask it what it is:

```bash
python3 --version
# Python 3.11.15
```

That is the standard version of Python, called **[[CPython|cpython]]** because it is written in the C language. When you hand it code, it does two things. First it **compiles** the text into **bytecode** — a compact list of simple instructions, like a recipe rewritten as numbered steps. Then it runs those steps. Both happen every time you run a file. There is no separate build step and no program file left behind afterwards.

That two-step order has one effect you can see. Mistakes in the *shape* of your code (a missing bracket) are found before anything runs. Mistakes in its *meaning* (a misspelled name) are found only when that line is reached. The last section of this lesson shows both.

On most systems, `python3` is Python 3, and plain `python` is either missing or another name for it. Type `python3` and you will never be surprised. To see which file you are actually running, ask the shell:

```bash
which python3
```

::: note
Every output in this module was produced by running the code on Python 3.11.15 on Linux and copying it from the terminal. The module assumes Python 3.11 or newer. Where a message or a behavior changed between versions, the lesson says so. Your version banner will differ from the one shown below, and that is the only difference you should expect.
:::

## The REPL: type a line, see its value

Think of a pocket calculator. You press keys, you press equals, the answer appears, and it waits for the next sum. Run `python3` with no arguments and you get the same kind of thing: an interactive session called the **[[REPL|repl-loop]]**, short for **read–eval–print loop**. It *reads* a line, *evaluates* it (works it out), *prints* the result, and *loops* back for more. The `>>>` — three greater-than signs, called the **prompt** — is it asking for your next line.

```python
Python 3.11.15 (main, Mar  3 2026, 09:26:23) [GCC 13.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> 7700 * (1 / 40)
192.5
>>> dt = 1 / 40
>>> dt
0.025
```

Three things happened there.

- The first line is an **expression** — a piece of code that has a value. The REPL printed its value, 192.5.
- The second line is an **assignment**. It is a **statement** — an instruction that does something but has no value of its own. It attaches the name `dt` to the number 0.025. Since a statement has no value, nothing was printed.
- The third line is an expression again: the name `dt` on its own. Its value came back.

Leave the session with `exit()`, or press ctrl-D on an empty line. What you typed is gone when you leave. The REPL keeps nothing on disk.

Use the REPL for questions you can answer in one line. What is 51.6 degrees in radians? How far does a vehicle move in one frame of a 40 **[[Hz|hertz]]** loop at orbital speed? What does this text method return on this string? The answer arrives in two seconds, and two seconds is the whole point.

::: example One frame of flight
A vehicle in low Earth orbit moves at about 7.7 km/s, which is 7700 m/s. A guidance loop typically runs tens of times a second. How far does the vehicle travel between one guidance update and the next at 40 Hz? And at 10 Hz?

At 40 Hz, one frame lasts $1/40 = 0.025$ s. Distance is speed times time, so type that at the prompt. The underscore `_` stands for "the value the previous line produced":

```python
>>> 7700 * 0.025
192.5
>>> _ / 1000
0.1925
>>> 7700 * (1 / 10)
770.0
```

Step by step: the first line gives 192.5 m per frame. The second divides that by 1000 to get kilometers, 0.1925 km — about a fifth of a kilometer. The third does the same sum for 10 Hz, where one frame lasts 0.1 s, and gives 770 m.

Sanity check: 10 Hz is four times slower than 40 Hz, so each frame should cover four times as much ground. $4 \times 192.5 = 770$. It does.

This is the number that decides whether a guidance law can run at 10 Hz. If your targeting error budget is 100 m, a rate that lets the vehicle move 770 m between corrections is not a design; it is a hope. The whole calculation took one prompt and no file.

The underscore is a convenience of the interactive prompt only. It does not exist in a script, and code that relies on it will not run there.
:::

## What gets printed, and what `print` is for

When you ask someone "what's in that jar?", they might answer "the word *sugar*, written on a label" or they might hand you some sugar. Python has two ways like that to turn a value into text.

- **`repr`** (short for *representation*) is meant for you, the programmer. It shows enough to tell what kind of thing the value is. A string — a piece of text — comes back with quotes around it.
- **`str`** is meant for a reader. It gives the plain text.

The REPL echoes `repr`. The built-in function `print` writes `str`.

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

The quotes in the first answer are the REPL telling you "this is a string of seven characters". They are not part of the string.

For numbers, `repr` and `str` are the same. Both give the shortest text that reads back as exactly the same number. That is why the last two lines agree — and, as a side effect, why one tenth plus two tenths is not three tenths. That result is not a mistake in Python or in your machine. Lesson 12 takes it apart properly.

::: key
The REPL prints `repr(value)` after every expression you type, and prints nothing after a statement such as an assignment. A script prints nothing at all unless you call `print`. `repr` is the programmer-facing form (`'descent'`, with quotes); `str` is the plain form (`descent`), and `print` writes the plain form.
:::

## Running a script

A **script** is a text file of Python, by habit named with a `.py` ending, that you run by handing it to the interpreter. Where the REPL is a calculator, a script is a recipe card: written once, followed the same way every time.

Put this in a file called `frame.py`. Throughout this module, a comment on the first line of a code block gives the name of the file it belongs in:

```python
# frame.py
speed = 7700.0      # m/s, roughly low Earth orbit
rate = 40.0         # Hz, the guidance frame rate
speed / rate        # computed, then thrown away: a script echoes nothing
print(speed / rate)  # 192.5
```

Then run it from the shell:

```bash
python3 frame.py
# 192.5
```

One line of output, not two. The third line of the file did compute 192.5, then threw it away, because in a file nothing is echoed. This is the most common surprise when you move from the prompt to a file, so here it is as plainly as possible: **in a script, a value you do not print does not exist**. Beginners write a whole calculation, run it, see an empty terminal, and decide nothing ran. Everything ran.

For a calculation too small even for a file, `-c` (read "dash c", for *command*) runs one piece of code straight from the shell:

```bash
python3 -c "print(7700.0 / 40.0)"
# 192.5
```

The double quotes belong to the shell, not to Python. They keep the whole program together as one argument.

A tool you run often should end up as a file you can run by name. Two things make that work. The first line must be a **[[shebang|shebang-name]]** — `#!` followed by the program that should read the file. And the file needs permission to be executed, which `chmod +x` gives it:

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

`./frame2.py` is read "dot slash frame2 dot py": run the file called `frame2.py` in this folder. `print` takes several values and writes them with single spaces between, ending with a new line.

The shebang only works as the very first line of the file. The part `/usr/bin/env python3` asks the system to find whichever `python3` comes first on your **[[path|env-and-path]]** — the list of folders the shell searches for programs. That will matter in lesson 13, where the right `python3` is the one inside a project's own environment.

::: example From the prompt to a file
You worked out a launch angle conversion at the prompt, and now you want to keep it. The session was:

```python
>>> import math
>>> math.radians(51.6)
0.9005898940290741
```

`import math` loads the mathematics **module**. A module is a file of ready-made Python code, and `math` is part of the **standard library**, the large set of modules that comes with Python. `math.radians` converts degrees into **[[radians|radian-picture]]**, the angle unit every trigonometry function in Python expects.

Suppose you copy those two lines into `azimuth.py` and run it. It prints nothing. The second line is an expression, and in a file its value is thrown away. The file has to say what to show:

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

Sanity check: 180 degrees is $\pi \approx 3.14$ radians, so one degree is about 0.01745 radians, and $51.6 \times 0.01745 \approx 0.900$. The answer agrees.

The number 51.6 degrees is the **[[inclination of the International Space Station's orbit|iss-inclination]]**. The conversion belongs in a file because you will need it again tomorrow. The exploring belonged at the prompt because you needed it once.
:::

## Comments, and what not to name your file

Everything after a `#` (read "hash") on a line is a **comment**: the interpreter skips it. A good comment says *why*, not *what*. `# Hz, the guidance frame rate` earns its place. `# multiply speed by time` does not. This module also uses comments to show what a line prints, as in the examples above.

One naming rule now, because it costs a beginner an hour when it bites. **Do not name your file after a module you plan to import.** Say you save a file of your own called `random.py` in the same folder as your script. When the script runs `import random`, Python looks in the script's own folder first, finds *your* file, and imports that instead of the standard library's `random`. The first time you use it, you get this:

```python
AttributeError: module 'random' has no attribute 'uniform'
```

That message points nowhere near the real problem. Lesson 9 explains the search order behind it, and why a file called `math.py` happens to escape the trap while `csv.py`, `json.py` and `random.py` do not.

## Two kinds of error, and when each is found

Remember the two steps: first the whole file is compiled, then it runs. Python checks the shape of the whole file before running any of it. A missing bracket is found at that first stage, so nothing runs at all:

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

A misspelled name is different. The shape is fine, so compiling succeeds and the file starts running. The error appears only when that line is reached:

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

This report is called a **[[traceback|reading-traceback]]**. Read it from the bottom up.

- The last line names the problem: a `NameError`, a name Python has never heard of.
- The lines above it say where: which file, which line.
- The `^^^^^^` marks (carets) point at the exact expression that failed.
- The `...` in the path stands for whatever folder your copy of the file is in. The interpreter prints the full path, and yours is not mine.

The "Did you mean" at the end is Python noticing a name one letter away from one it knows. Lesson 10 reads tracebacks properly, including ones many levels deep.

::: warning
An empty terminal after running a script means the script produced no output, not that it did not run. Before you start debugging a program that "does nothing", add a `print` and prove to yourself which lines are reached. And never decide from a silent run that a calculation succeeded.
:::

## Check yourself

::: check
At the prompt you type `dt = 1 / 40` and nothing is printed. Then you type `dt` and `0.025` appears. You put both lines in a file and run it, and the terminal stays empty. Explain each of the three behaviors in one sentence, and fix the file.
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
Why does `"descent"` come back from the prompt with quotes, while `print("descent")` shows it without? Which of the two belongs in a log file or a report?
:::

::: answer
The prompt echoes `repr`, whose job is to show what the object is — quotes included, so you can tell the string `'7'` from the number `7`. `print` writes `str`, the plain text. A log file or a report wants the plain text, so it wants `print`. When you are debugging, though, the quoted form is often what you want, because it lets you tell an empty string from a string of two spaces.
:::

::: check
Someone asks whether a guidance loop at 25 Hz keeps the vehicle's movement between updates under 350 m at 7.7 km/s. Answer as you would in a review, and say why the prompt is the right tool rather than a file.
:::

::: answer
One frame is $1/25$ s $= 0.04$ s, so the distance is $7700 \times 0.04 = 308$ m, which is under 350 m. At the prompt:

```python
>>> 7700 * (1 / 25)
308.0
```

It is a question asked once, the answer is a single number, and nobody needs to re-run it tomorrow. That is exactly the REPL's job. A file would be the right tool if the rate were one of several to compare, or if the answer had to go into a report that is regenerated whenever the speed estimate changes.
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
`b.py` prints `starting`; `a.py` prints nothing. The unclosed bracket in `a.py` is a syntax error. It is found while the whole file is being compiled, which finishes before any line runs — so the first `print` never happens:

```bash
python3 a.py
#   File ".../a.py", line 3
#     print("rate:", 40.0
#          ^
# SyntaxError: '(' was never closed
```

In `b.py` the shape is fine, so the file starts running, the first line prints, and only then does the second line fail:

```bash
python3 b.py
# starting
# Traceback (most recent call last):
#   File ".../b.py", line 3, in <module>
#     print("rate:", rate)
#                    ^^^^
# NameError: name 'rate' is not defined. Did you mean: 'range'?
```

The suggestion is Python looking for a near-miss among the names it knows. `range` is a built-in you meet in lesson 5 — a reminder that the suggestion is a guess, not a diagnosis. The rule to keep: syntax errors come before all output; name errors appear after whatever came before them.
:::

::: check
What is wrong with keeping a day's work as a REPL session? And what is wrong with exploring a new telemetry file by editing and re-running a script?
:::

::: answer
A REPL session is not saved. It cannot be re-run, reviewed by a colleague or tested, so anything you want tomorrow must be in a file. On the other side, exploring in a script means re-running the whole file — including re-reading a large data file — for every small question, so each question is slow. The working habit is both: explore at the prompt, and move anything worth keeping into a file as soon as it works.
:::

## Summary

| Item | What it is |
| --- | --- |
| Interpreter | The `python3` program; compiles your text to bytecode and runs it, every run |
| REPL | Interactive prompt (`>>>`); reads a line, evaluates it, prints `repr` of the value |
| Statement vs expression | An assignment has no value and echoes nothing; an expression has a value and echoes it |
| Script | A `.py` file run as `python3 file.py`; echoes nothing, shows only what `print` prints |
| `python3 -c "…"` | Runs one program given as a command-line argument |
| Shebang | `#!/usr/bin/env python3` as the first line, plus `chmod +x`, makes the file runnable as `./file.py` |
| `repr` vs `str` | `'descent'` versus `descent`; the prompt shows the first, `print` writes the second |
| SyntaxError | Bad shape; found while compiling, so no line of the file runs |
| NameError | Bad meaning; found when the line runs, after earlier output has appeared |

The next lesson fills in what those values actually are — whole numbers, decimals, true-or-false values and text — and how to format them into the lines a report or a log is made of.

::: context interpreter-pipeline What happens when you press Enter
Every run goes through the same two stages, one after the other. If the first stage fails, the second never starts — which is why a missing bracket stops the whole file before a single line prints.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="35" width="80" height="44" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="48" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">your text</text>
  <text x="48" y="70" font-size="11" text-anchor="middle" fill="#6c7a93">frame.py</text>
  <line x1="88" y1="57" x2="128" y2="57" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="134,57 126,53 126,61" fill="#1f2a44"/>
  <rect x="136" y="35" width="84" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="178" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">1. compile</text>
  <text x="178" y="70" font-size="11" text-anchor="middle" fill="#1f2a44">to bytecode</text>
  <line x1="220" y1="57" x2="260" y2="57" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="266,57 258,53 258,61" fill="#1f2a44"/>
  <rect x="268" y="35" width="84" height="44" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">2. run</text>
  <text x="310" y="70" font-size="11" text-anchor="middle" fill="#1f2a44">line by line</text>
  <text x="178" y="102" font-size="11" text-anchor="middle" fill="#b4232c">SyntaxError here</text>
  <text x="310" y="102" font-size="11" text-anchor="middle" fill="#b4232c">NameError here</text>
</svg>
```
:::

::: context cpython One language, several interpreters
"Python" is the language — the rules for what code means. CPython is one program that follows those rules, and it is the one almost everybody uses, including the `python3` on your machine. Others exist: PyPy speeds up long-running programs, and MicroPython fits on small microcontroller boards. When this module says "the interpreter", it means CPython.
:::

::: context repl-loop Read, evaluate, print, loop
The four words are the four steps the prompt goes round, forever, until you leave. The name comes from the Lisp programming language, whose interactive prompts worked this way decades before Python existed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="8" width="80" height="28" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="27" font-size="12" text-anchor="middle" fill="#1f2a44">read</text>
  <rect x="262" y="61" width="80" height="28" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="302" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">evaluate</text>
  <rect x="140" y="114" width="80" height="28" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="133" font-size="12" text-anchor="middle" fill="#1f2a44">print</text>
  <rect x="18" y="61" width="80" height="28" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="58" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">loop: &gt;&gt;&gt;</text>
  <path d="M220,22 Q290,22 298,58" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="299,61 294,52 303,53" fill="#1f2a44"/>
  <path d="M302,89 Q295,128 223,128" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="220,128 229,124 229,132" fill="#1f2a44"/>
  <path d="M140,128 Q68,128 60,92" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="59,89 56,98 64,97" fill="#1f2a44"/>
  <path d="M58,61 Q66,22 137,22" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="140,22 131,18 131,26" fill="#1f2a44"/>
</svg>
```

A Jupyter notebook, which you will meet at work, is a REPL in a web page with its cells saved to a file. It inherits the REPL's weakness: cells can be run in any order, so a saved result may not be reproducible. Lesson 9 comes back to this.
:::

::: context hertz How often, counted per second
Hertz (Hz) means "times per second". A 40 Hz guidance loop runs 40 times every second, so one run — one **frame** — lasts $1/40 = 0.025$ s. Double the rate and each frame halves. The unit is named after Heinrich Hertz, the physicist who first produced and detected radio waves.
:::

::: context shebang-name Why "shebang"
The two characters `#!` are called "hash" (or "sharp") and "bang", and programmers ran them together into "shebang". When you run a file directly, the operating system's kernel peeks at its first two bytes. If they are `#!`, it reads the rest of that line as the program to hand the file to. To Python, the same line is only a comment, so it does no harm when you run the file with `python3 frame2.py` instead.
:::

::: context env-and-path Why /usr/bin/env and not a fixed path
You could write `#!/usr/bin/python3`, but that pins one exact file, and a colleague's machine may keep Python somewhere else. The small program `env` searches your `PATH` — the list of folders the shell looks through, in order — and runs the first `python3` it finds. When you switch on a project's virtual environment in lesson 13, its folder moves to the front of `PATH`, so the same shebang picks up the project's Python automatically.
:::

::: context radian-picture What a radian is
Draw a circle, then take a piece of string exactly as long as the radius and lay it along the edge. The angle it covers, seen from the center, is one radian — about 57.3 degrees. Going all the way round takes $2\pi \approx 6.28$ radius-lengths, so 360 degrees is $2\pi$ radians and 180 degrees is $\pi$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="85" r="60" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="85" x2="180" y2="85" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="85" x2="152.4" y2="34.5" stroke="#1f2a44" stroke-width="2"/>
  <path d="M180,85 A60,60 0 0,0 152.4,34.5" fill="none" stroke="#b4232c" stroke-width="4"/>
  <path d="M140,85 A20,20 0 0,0 130.8,68.2" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="150" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">radius r</text>
  <text x="188" y="52" font-size="11" fill="#b4232c">arc = r</text>
  <text x="146" y="78" font-size="11" fill="#1d6fd1">1 rad</text>
  <text x="230" y="70" font-size="12" fill="#1f2a44">1 rad ≈ 57.3°</text>
  <text x="230" y="90" font-size="12" fill="#1f2a44">180° = π rad</text>
</svg>
```
:::

::: context iss-inclination The space station's tilted orbit
An orbit's **inclination** is the angle between the orbit's plane and Earth's equator. The International Space Station's orbit is tilted 51.6 degrees, so it passes over every place between about 51.6° north and 51.6° south. That tilt was chosen so that Russian rockets launching from Baikonur, in Kazakhstan, could reach the station. It is why the station is visible from much of Europe and North America.
:::

::: context reading-traceback Why it is called a traceback
When a program fails, Python *traces back* through the chain of work that led to the failing line and lists each step, outermost first, with the actual error at the very bottom. In a one-file script like this there is only one step, `<module>`, meaning "the top level of the file". Once your code calls functions that call other functions, the list grows, and reading from the bottom up is how you find your way in.
:::
