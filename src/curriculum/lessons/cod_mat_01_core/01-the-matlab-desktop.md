---
id: l01-the-matlab-desktop
title: The MATLAB desktop
minutes: 21
covers:
  - The desktop, Command Window, Workspace, Editor and Live Editor
---

Think about a kitchen. There is a counter where you try things out — taste the sauce, crack an egg. There is a shelf where everything you have made so far sits in labeled jars. And there is a recipe book where you write down the steps that worked, so you can make the dish again next week without guessing. A good cook moves between all three without thinking about it.

MATLAB is laid out the same way. **MATLAB** — the name is short for "matrix laboratory" — is a programming language and a program for doing numbers, especially numbers arranged in grids. It is made by the company **[[MathWorks|mathworks-history]]**. When you open it you see its **desktop**: one window split into panels. The **Command Window** is the counter, where you type a line and see the answer right away. The **Workspace** is the shelf, showing every variable you have made. The **Editor** is the recipe book, where you write scripts you can save and run again.

On a guidance, navigation and control (GNC) team, this is where a lot of the day happens. You load flight data from a test, poke at it in the Command Window, plot the attitude errors, and then turn what you learned into a script that runs on every future test. You already know Python, so this module is mostly translation: the ideas are the same, the words and a few rules are different. This lesson gets you comfortable in the room before we start cooking.

## The desktop: four panels and a ribbon

When MATLAB opens, the **[[desktop|desktop-layout]]** shows several panels at once. The exact arrangement depends on your version and on how you dragged things around, but the parts are always there:

- **Current Folder** — a file browser. It shows the folder MATLAB is "standing in" right now. Files here can be run by name.
- **Command Window** — where you type commands and see results.
- **Workspace** — a table of every variable that currently exists, with its size and a peek at its value.
- **Editor** — opens when you create or open a file, and is where you write code you want to keep.

Across the top sits the **toolstrip**, a ribbon of buttons grouped into tabs (Home, Plots, Apps, Editor…). The Run button lives there. Recent releases, starting with R2025a, rearranged the desktop into side bars and added a dark theme, but the same parts are all present. If you ever lose a panel, the Layout menu (on the Home tab in the classic desktop) puts the default arrangement back.

## The Command Window: a calculator with memory

The Command Window shows a **prompt**, `>>`, which means "ready, type something". It plays the same role as Python's `>>>`. Type an expression, press Enter, and MATLAB evaluates it and prints the result.

```matlab
>> 3 * 4
% ans = 12
>> ans + 1
% ans = 13
```

(In this module, lines starting `>>` are what you type, and the `%` lines below show what MATLAB prints. `%` starts a **comment** in MATLAB, the way `#` does in Python. MATLAB also puts blank lines around each answer on screen; we leave those out.)

Two things to notice. First, the power operator is `^`, read "to the power of". Python's `**` is an error in MATLAB. Second, when you do not give a result a name, MATLAB stores it in a variable called **`ans`**, meaning "the most recent unnamed answer". It is like Python's `_` at the prompt, and it gets overwritten every time.

### Naming things, and the semicolon

You make a variable with `=`, exactly as in Python. The difference is what happens next: MATLAB **echoes** the result, meaning it prints the variable back to you, unless you end the line with a semicolon.

```matlab
>> rho = 1.225;          % no echo: the semicolon suppresses it
>> v = 240
% v = 240
>> q = 0.5 * rho * v^2
% q = 3.5280e+04
```

The **semicolon** at the end of a line means "do it, but do not print it". In a script that works with a million numbers, forgetting one semicolon floods the Command Window with a million numbers. So the habit is: semicolon on everything, and leave it off only when you want to look.

The answer printed as `3.5280e+04`. Read that as "3.5280 times ten to the fourth", which is $35\,280$. MATLAB's default display, called `format short`, shows about five significant figures and switches to this **scientific notation** once a number gets big. That is only the **[[display format|display-format]]**. The value stored in `q` has all its digits. Type `format long` to see about sixteen of them, and `format short` to go back.

::: key
The Command Window evaluates each line when you press Enter. A result you do not name goes into `ans`. A semicolon at the end of a line suppresses the echo; leaving it off prints the result. `format short` and `format long` change only how numbers are shown, never how they are stored.
:::

### Every number is a double

Ask MATLAB what kind of thing `q` is:

```matlab
>> class(q)
% ans = 'double'
```

A **double** is a number stored in 64 bits of computer memory, good to about 15–16 significant digits. It is the same thing as a Python `float`. Here is a difference from Python that matters: in MATLAB, even `v = 240` makes a double, not an integer. You do not need to write `240.0` to get decimal division. `7 / 2` is `3.5000`, as you would hope.

MATLAB has integer types too (`int32`, `uint8` and friends), but you only get them by asking. For now, everything is a double.

::: example Orbital speed at the Command Window
A space station orbits about $400\,\mathrm{km}$ above Earth's surface. Earth's radius is about $6378\,\mathrm{km}$, and Earth's gravitational parameter (gravity strength times mass, in one number) is $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$. For a circular orbit the speed is $v = \sqrt{\mu / r}$, where $r$ is the distance from Earth's center. The time for one lap, the **period**, is the distance around, $2\pi r$, divided by the speed.

```matlab
>> mu = 3.986e14;          % m^3/s^2
>> r = 6378e3 + 400e3;     % m, from Earth's center
>> v = sqrt(mu / r)
% v = 7.6686e+03
>> T = 2*pi*r / v
% T = 5.5535e+03
>> T_min = T / 60
% T_min = 92.5576
```

Step by step: `3.986e14` is MATLAB's way of typing $3.986 \times 10^{14}$, the same as Python. We add the altitude to Earth's radius to get $r = 6\,778\,000\,\mathrm{m}$. The first two lines end in semicolons, so they print nothing. The speed comes out as about $7669\,\mathrm{m/s}$. The period is about $5554\,\mathrm{s}$, and dividing by $60$ turns that into about $92.6$ minutes. `pi` is a built-in constant, $3.14159\ldots$

Sanity check: the International Space Station really does circle Earth in about an hour and a half, at a bit under $8\,\mathrm{km/s}$. Both numbers are right.
:::

### Finding help and getting unstuck

You will not remember every function. MATLAB has two built-in ways to look things up:

- `help sqrt` prints a short description of `sqrt` right in the Command Window.
- `doc sqrt` opens the full documentation page, with examples you can copy.

A few other commands you will use every day:

| Command | What it does |
| --- | --- |
| `clc` | clears the Command Window text (your variables survive) |
| `clear` | deletes all variables from the Workspace |
| `clear q` | deletes only `q` |
| `who` / `whos` | lists variables; `whos` adds size, bytes and class |
| up arrow | brings back the previous command |
| Tab | completes a variable or function name |
| Ctrl+C | stops a command that is taking too long |

::: warning Do not name a variable after a function
MATLAB lets you write `sum = 10`. After that, `sum` means your variable, not the function, until you `clear sum`. Then a later line like `sum([1 2 3])` does not add anything up. MATLAB tries to index into your variable instead, and you get a confusing error about an index. The same trap catches `i` and `j`, which MATLAB also uses for the imaginary unit $\sqrt{-1}$. If a built-in function suddenly "stops working", run `which sum` — it tells you whether the name now means a variable.
:::

## The Workspace: what exists right now

The **Workspace** is the set of variables that exist right now, together with their values. The Workspace panel is a live view of it. After the orbit example it would list `mu`, `r`, `v`, `T`, `T_min` and `ans`, each with its value and its **size** — for a single number, `1x1`, read "one by one", meaning one row and one column. The next lesson explains why even a single number has rows and columns.

Double-click a variable in the panel and it opens in the **Variables editor**, a spreadsheet-like view — often the fastest way to eyeball whether a file of flight data loaded the way you expected.

`whos` gives the same information as text. Its columns are Name, Size, Bytes, Class and Attributes. A double takes $8$ bytes, so a one-by-one double shows `1x1`, `8` and `double`.

The Workspace you see at the Command Window has a proper name: the **[[base workspace|base-workspace]]**. Scripts you run from the Command Window read and write this same workspace. Functions do not — each function gets a private workspace of its own. That difference is a famous interview question, and lesson 9 is all about it.

## The Editor: scripts you can run again

Anything you type at the Command Window vanishes when you close MATLAB (the command history remembers the text, but not in any organized way). To keep work, you write a **script**: a plain text file of MATLAB commands with the extension `.m`. Running the script runs its lines from top to bottom, as if you had typed them.

Type `edit ascent_quicklook` to create and open `ascent_quicklook.m` in the Editor. Then write:

```matlab
% ascent_quicklook.m  --  dynamic pressure at one flight condition

%% Inputs
rho = 0.30;      % air density, kg/m^3
v   = 480;       % speed, m/s

%% Dynamic pressure
q = 0.5 * rho * v^2          % Pa
q_kPa = q / 1000             % kPa
```

Save it, then run it in any of three ways: press the Run button, press F5, or type its name, `ascent_quicklook`, at the prompt. There is no `python file.py` step and no `import`. The name of the file *is* the command.

For that to work, MATLAB has to be able to find the file. It looks in the **Current Folder** first and then along a list of folders called the **[[search path|search-path]]**. If you get "Unrecognized function or variable 'ascent_quicklook'", the file is almost always somewhere MATLAB is not looking. Change the Current Folder to where the file lives, or add that folder to the path with `addpath`.

::: warning File names are commands, so they follow the rules for names
A script's file name must be a valid MATLAB name: start with a letter, then only letters, digits and underscores. `ascent-quicklook.m` does not work, because MATLAB reads the dash as a minus sign. `2nd_try.m` does not work, because it starts with a digit. And a script called `sqrt.m` or `plot.m` hides the built-in function of the same name, with baffling results.
:::

### Sections: run one piece at a time

The lines starting with `%%` split the script into **[[code sections|code-sections]]**. A section runs from one `%%` line to the next. Put the cursor inside one and press Ctrl+Enter (Cmd+Enter on a Mac), or use the Run Section button, and MATLAB runs only that section.

This is how people actually work on analysis scripts. The first section loads a big, slow data file once. Then you edit and re-run the analysis sections below it again and again, and the loaded data stays in the Workspace.

::: example Running a script and changing one input
Run `ascent_quicklook` as written. The Command Window shows:

```matlab
% q = 34560
% q_kPa = 34.5600
```

The arithmetic: $v^2 = 480^2 = 230\,400$, then $0.5 \times 0.30 = 0.15$, and $0.15 \times 230\,400 = 34\,560\,\mathrm{Pa}$, which is $34.56\,\mathrm{kPa}$. The two input lines ended in semicolons, so only the two results were echoed.

Now change `v = 480` to `v = 520` and re-run only the "Dynamic pressure" section. Nothing happens differently — the section never reads the new line, because the new line lives in the Inputs section, which did not run. The workspace still has `v = 480`. Run the Inputs section, then the Dynamic pressure section, and you get:

```matlab
% q = 40560
% q_kPa = 40.5600
```

Check: $520^2 = 270\,400$ and $0.15 \times 270\,400 = 40\,560$. A speed about $8\%$ higher gave a dynamic pressure about $17\%$ higher, as it should, since $q$ grows with the square of speed ($1.083^2 \approx 1.17$).

The lesson inside the lesson: a section uses whatever is in the Workspace *now*, not what the file says. When results look stale, run the whole script from the top.
:::

The Editor also checks your code as you type. The **Code Analyzer** puts orange marks (warnings) and red marks (errors) in the right margin next to suspect lines, such as a variable you set but never used. Hover over a mark to read the message. Treat the orange ones as free code review.

## The Live Editor: a notebook for MATLAB

Jupyter notebooks in Python mix code, results and writing in one document. MATLAB's version is the **Live Editor**, and its files are called **live scripts**, saved with the extension `.mlx` instead of `.m`.

In a live script:

- output, including plots, appears right next to or below the code that made it, instead of in the Command Window or a separate figure window;
- you can write formatted text, headings and equations between the code, so the file reads like a report;
- you can add **live controls** — sliders, drop-down menus, check boxes — that change a value in the code and re-run the section when you move them;
- you can export the whole thing to PDF, HTML or Word to send to someone who does not have MATLAB.

Create one from the Home tab with New Live Script. Sections work the same way, and the code inside is ordinary MATLAB.

So which should you use? Plain `.m` scripts are the working tools. They are plain text, so version control like git can show exactly which line changed, and they run anywhere. A **[[live script is a packaged file|live-script-files]]**, which makes it good for a finished analysis you hand to a reviewer — "here is the landing dispersion study, with every plot and the reasoning beside it" — and awkward for code a team edits together.

::: key
A script (`.m`) is a text file of commands that runs top to bottom in the base workspace; run it by name, with F5 or the Run button. `%%` splits it into sections that run one at a time with Ctrl+Enter. A live script (`.mlx`) is the notebook version: results, text, equations and controls live in one document.
:::

## From Python to MATLAB: a first phrasebook

Here is the translation for this lesson:

| Python | MATLAB |
| --- | --- |
| `>>>` prompt | `>>` prompt |
| `# comment` | `% comment` |
| `x ** 2` | `x^2` |
| `_` (last result) | `ans` |
| `print(x)` | leave off the semicolon, or `disp(x)` |
| `python run.py` | type `run` (the file name) |
| `import module` | the file is in the Current Folder or on the path |
| Jupyter notebook | live script (`.mlx`) |

Everything in this module runs in MATLAB itself or in MATLAB Online, the browser version. Much of it also runs in **[[GNU Octave|gnu-octave]]**, a free program that understands most of the same language, though it has no Live Editor and prints numbers in a slightly different layout.

## Check yourself

::: check
You type `g = 9.80665` and press Enter, then type `g * 2;` and press Enter. What appears on screen after each line, and what is `ans` afterwards?
:::

::: answer
The first line has no semicolon, so MATLAB echoes `g = 9.8066` — five significant figures in `format short`, although all the digits are stored. The second line ends with a semicolon, so nothing is printed. Its result was not given a name, so it still goes into `ans`, which now holds $19.6133$.
:::

::: check
A classmate saves a script as `orbit-period.m` and gets an error when she types `orbit-period`. What is MATLAB doing with that line, and how should she fix it?
:::

::: answer
MATLAB reads the dash as a minus sign, so it tries to compute the variable or function `orbit` minus the variable or function `period`. Neither exists, so it reports an unrecognized name. File names must be valid MATLAB names, so she should rename the file `orbit_period.m` (underscore, not dash) and run it by typing `orbit_period`.
:::

::: check
You are working on a script with three sections: Load data (takes a minute), Filter, and Plot. You change a number in Filter. What is the fastest way to see its effect, and what would go wrong if you had also changed a number in Load data?
:::

::: answer
Put the cursor in the Filter section and press Ctrl+Enter, then do the same in Plot (or select both and run). The data from Load data is still in the base workspace, so you skip the slow part.

If you had also changed something in Load data, the workspace would still hold the *old* loaded data, because that section did not run. Your Filter and Plot results would quietly use stale data. When an input section changes, re-run it, or run the whole script from the top.
:::

::: check
You type `pi = 3` by mistake while testing something, and later `T = 2*pi*r/v` gives a period far too small. Explain what happened and two ways to find or fix it.
:::

::: answer
`pi = 3` created a variable called `pi` in the workspace, and a variable hides the built-in constant of the same name. So `2*pi` became $6$ instead of about $6.283$, and the period came out about $4.5\%$ low ($3/\pi \approx 0.955$).

To find it: look for `pi` in the Workspace panel, or type `which pi`, which reports that `pi` is now a variable. To fix it: `clear pi`, and the built-in constant is back.
:::

::: check
Your team lead asks for (a) a reusable script that the nightly test job runs on every flight log, and (b) a write-up of one anomaly for the design review, with plots and your reasoning. Which file type would you choose for each, and why?
:::

::: answer
(a) A plain `.m` script. It is text, so git shows line-by-line changes when teammates edit it, and it runs anywhere MATLAB runs, including from an automated job.

(b) A live script (`.mlx`). The plots appear beside the code that made them, you can write the reasoning and equations in between, and you can export it to PDF for people without MATLAB.
:::

## Summary

| Part | What it is | Key habits |
| --- | --- | --- |
| Command Window | type a line, see the answer | `>>` prompt; unnamed results go to `ans` |
| Semicolon | ends a line quietly | leave it off only to look at a value |
| `format short` / `format long` | how many digits are shown | display only; storage is always full double |
| Workspace | every variable that exists now | panel, `who`, `whos`, `clear`, `clc` |
| Double | default number type, 8 bytes | `240` is a double, `7/2` is `3.5000` |
| Editor and `.m` scripts | saved commands, run top to bottom | run by name, F5 or Run; file name must be a valid name |
| Sections | `%%` splits a script | Ctrl+Enter runs one; beware stale inputs |
| Search path | where MATLAB looks for files | Current Folder first; `addpath`, `which` |
| Live Editor and `.mlx` | notebook-style live scripts | inline results, text, controls, export |

Next lesson: the "1x1" in the Workspace panel was a hint. In MATLAB every value is a grid of numbers, and the next lesson shows how to build those grids — rows, columns, ranges and ready-made matrices.

::: context mathworks-history Where MATLAB came from
Cleve Moler, a mathematics professor, wrote the first MATLAB in the late 1970s so his students could use two serious Fortran libraries for matrix calculations, LINPACK and EISPACK, without writing Fortran. It was a small interactive calculator for matrices. In 1984 Jack Little, Steve Bangert and Moler founded MathWorks to sell a rewritten version in C. That origin still shows: the language assumes every value is a matrix, because that is what it was built to handle. Today MATLAB and its companion Simulink are standard tools in aerospace, automotive and control engineering.
:::

::: context desktop-layout A map of the classic layout
The classic default arrangement puts the file browser on the left, the Command Window in the middle and the Workspace on the right. The Editor docks above the Command Window when you open a file. You can drag any panel anywhere, so your own screen may differ.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="4" y="4" width="352" height="192" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="4" y="4" width="352" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">Toolstrip: Home, Plots, Apps, Editor</text>
  <rect x="4" y="30" width="80" height="166" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="44" y="108" font-size="12" fill="#1f2a44" text-anchor="middle">Current</text>
  <text x="44" y="124" font-size="12" fill="#1f2a44" text-anchor="middle">Folder</text>
  <rect x="84" y="30" width="192" height="84" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="70" font-size="12" fill="#1f2a44" text-anchor="middle">Editor</text>
  <text x="180" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">scripts (.m)</text>
  <rect x="84" y="114" width="192" height="82" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="150" font-size="12" fill="#1f2a44" text-anchor="middle">Command Window</text>
  <text x="180" y="168" font-size="12" fill="#1d6fd1" text-anchor="middle">&gt;&gt; v = sqrt(mu/r)</text>
  <rect x="276" y="30" width="80" height="166" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="316" y="108" font-size="12" fill="#1f2a44" text-anchor="middle">Workspace</text>
  <text x="316" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">mu, r, v</text>
</svg>
```
:::

::: context display-format What you see is not what is stored
MATLAB shows `q = 3.5280e+04` but stores $35\,280$ exactly, and it would store $35\,280.123456789$ with every digit too. The display is rounded so the Command Window stays readable. This matters when two numbers look equal on screen but are not: `0.1 + 0.2` prints `0.3000`, yet `0.1 + 0.2 == 0.3` answers `0` (false), for the same floating-point reason as in Python. To see what is really there, use `format long`, or print with a chosen number of digits using `fprintf`, which lesson 8 covers.
:::

::: context base-workspace One shelf for the Command Window and scripts
There is not one Workspace but several. The base workspace is the one the Command Window uses, and scripts share it: a script can read anything you typed at the prompt, and anything the script creates is still there when it finishes. That is why the Workspace panel fills up after you run a script. A function works in its own private workspace that appears when it is called and disappears when it returns. Lesson 9 draws this out carefully, because mixing the two up causes some of the most common MATLAB bugs.
:::

::: context search-path How MATLAB finds a name
When you type a name, MATLAB has to decide what it means. Roughly, it checks in this order: is it a variable in the current workspace? Then a function or script in the Current Folder? Then one in a folder on the search path, which includes all of MATLAB's own toolboxes? The first match wins. That order explains both earlier warnings: a variable called `sum` beats the function `sum`, and a file called `plot.m` in your folder beats the real `plot`. `which name` shows which one MATLAB will pick, and `path` lists every folder it searches.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="30" width="96" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="56" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">1. Variable in</text>
  <text x="56" y="65" font-size="12" fill="#1f2a44" text-anchor="middle">workspace</text>
  <rect x="132" y="30" width="96" height="44" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">2. File in</text>
  <text x="180" y="65" font-size="12" fill="#1f2a44" text-anchor="middle">Current Folder</text>
  <rect x="256" y="30" width="96" height="44" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="304" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">3. File on</text>
  <text x="304" y="65" font-size="12" fill="#1f2a44" text-anchor="middle">search path</text>
  <line x1="104" y1="52" x2="128" y2="52" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="132,52 124,48 124,56" fill="#1f2a44"/>
  <line x1="228" y1="52" x2="252" y2="52" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="256,52 248,48 248,56" fill="#1f2a44"/>
  <text x="180" y="98" font-size="12" fill="#b4232c" text-anchor="middle">the first match wins</text>
</svg>
```
:::

::: context code-sections Sections in a script
A section starts at a line beginning with `%%` and runs to the next one. The text after `%%` becomes the section's title, shown in bold in the Editor, so a script with good section titles reads like a table of contents. The Editor shades the section the cursor is in. Running a section does not reset anything: it uses the workspace as it stands.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="8" width="340" height="134" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="11" y="52" width="338" height="44" fill="#8fb8f0"/>
  <text x="20" y="28" font-size="12" fill="#1f2a44" font-weight="700">%% Load data</text>
  <text x="20" y="44" font-size="11" fill="#6c7a93">d = load("flight.mat");</text>
  <text x="20" y="70" font-size="12" fill="#1f2a44" font-weight="700">%% Filter</text>
  <text x="20" y="86" font-size="11" fill="#1f2a44">a = movmean(d.accel, 5);</text>
  <text x="20" y="114" font-size="12" fill="#1f2a44" font-weight="700">%% Plot</text>
  <text x="20" y="130" font-size="11" fill="#6c7a93">plot(a)</text>
  <text x="340" y="80" font-size="12" fill="#b4232c" text-anchor="end">Ctrl+Enter runs this</text>
</svg>
```
:::

::: context live-script-files Why live scripts sit awkwardly in git
An `.mlx` file is not plain text. It is a compressed package that holds the code together with the formatted text, the saved outputs and the images of plots. That is what lets it reopen with every result in place. But a tool like git compares files line by line, so a change to one number in an `.mlx` shows up as "binary file changed", with no way to see what changed. Many teams therefore keep their real code in `.m` files and functions, and use live scripts as thin reports that call that code.
:::

::: context gnu-octave A free cousin
GNU Octave is a free, open-source program first conceived in the late 1980s whose language is largely compatible with MATLAB's. Most of the matrix code in this module runs in it unchanged, which makes it handy for practice at home. The differences show up at the edges: no Live Editor, no Simulink, only some of the toolboxes (through its own packages), and a slightly different way of printing results — Octave prints `7668.6` where MATLAB prints `7.6686e+03`. For work on a real team, expect MATLAB itself, or MATLAB Online in a browser.
:::
