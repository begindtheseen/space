---
id: l08-printing-and-files
title: Printing, saving and loading
minutes: 21
covers:
  - fprintf, sprintf, disp; save/load and .mat files; readtable and writetable
---

A lab notebook has two jobs. Some pages you write for yourself as you go: "engine lit at 10:42, sounded rough." Other pages you copy out neatly for someone else, or file away so you can find them next month. A MATLAB program has the same two jobs. It has to *show* you numbers while it runs, and it has to *store* its results somewhere that outlives the session.

Lesson 7 built the containers — structs, cells, tables and text. This lesson moves them in and out of MATLAB. First, three ways to show things on the screen: `disp`, `fprintf` and `sprintf`. Then **.mat files**, MATLAB's own format for saving variables exactly as they are. Then **CSV** files, the plain-text spreadsheets that every other tool can read, with `readtable` and `writetable`.

On a GNC team this is daily work. A hop test's telemetry arrives as CSV from the [[ground station|ground-station]]. You load it into a table, compute climb rate and acceleration, print a quick summary line to check it, and save the processed results in a `.mat` file for the rest of the team. Every step below is one of those moves.

## Showing a value: the semicolon and disp

You already know the quickest way to see a value: leave off the semicolon. `x = 3.14159` without a semicolon prints the name and the value. With the semicolon, MATLAB stays quiet.

`disp` shows a value *without* its name. It takes one input and prints it on its own line.

```matlab
disp(pi)
%   3.1416
disp('Engine start')
%   Engine start
```

`disp` prints numbers in the current display format, which by default shows four digits after the decimal point for numbers of everyday size. The variable itself still holds the full value — only the printout is short.

To mix words and numbers in one `disp`, you must build one piece of text first. With char text, turn the number into text with `num2str` and glue with square brackets. With a string, the `+` from lesson 7 converts the number for you.

```matlab
apo = 152.43;                               % apogee, m
disp(['Apogee: ' num2str(apo) ' m'])
%   Apogee: 152.43 m
disp("Apogee: " + apo + " m")
%   Apogee: 152.43 m
```

`disp` is fine for a quick look. When you want control — how many decimals, how wide each column, where the line breaks — you want `fprintf`.

## fprintf: printing from a template

Think of a fill-in-the-blanks card: "Dear (name), your order of (number) widgets ships on (date)." You write the card once and fill in the blanks each time. `fprintf` works the same way. Its first input is a **format specification** (format spec for short): text with blanks in it. Every later input fills the blanks, in order. The name comes from the [[C language|printf-history]]: "f" for file, "print", "f" for formatted.

Each blank is a **conversion**: a percent sign, some optional settings and a letter that says what kind of value goes there.

```matlab
x = 3.14159;
fprintf('x = %.2f\n', x)
%   x = 3.14
```

Read the format spec aloud: "x equals, a fixed-point number with two decimals, new line." Here are the conversions you will use most.

| Conversion | Prints | Example | Output |
| --- | --- | --- | --- |
| `%d` | a whole number | `fprintf('%d', 42)` | `42` |
| `%f` | fixed-point decimal | `fprintf('%.3f', 9.80665)` | `9.807` |
| `%e` | exponential notation | `fprintf('%.3e', 3.986e14)` | `3.986e+14` |
| `%g` | the shorter of `%f` and `%e` | `fprintf('%g', 0.000012)` | `1.2e-05` |
| `%s` | text | `fprintf('%s', 'LOX')` | `LOX` |

Between the `%` and the letter you can put a **width** and a **precision**, written width-dot-precision. `%8.2f` means "at least 8 characters wide, 2 digits after the decimal point." A number shorter than the width is padded with spaces on the left, which is what lines up columns. A minus sign flips the padding to the right: `%-8s` prints text flush left in an 8-character field.

A few special pieces of text also go in the format spec. `\n` is a new line, `\t` is a tab, `%%` prints one percent sign, and inside single quotes a doubled quote `''` prints one quote: `fprintf('Isn''t it\n')` prints `Isn't it`. The format spec can be char in single quotes or a string in double quotes; `fprintf` treats both the same.

::: warning fprintf never adds a new line for you
Unlike Python's `print`, `fprintf` prints exactly what the format spec says and nothing more. Forget the `\n` and the next output lands on the same line, glued to this one. Almost every format spec you write should end in `\n`.
:::

### The template repeats

Here is the feature that makes `fprintf` far more useful than it first looks. If you hand it more values than the format spec has blanks, it **recycles** the format spec — starts again from the beginning — until every value is used.

```matlab
fprintf('%d\n', [1 2 3])
%   1
%   2
%   3
```

One blank, three values, so the template runs three times. That turns `fprintf` into a table printer with no loop. There is one catch. When you pass a matrix, `fprintf` reads its elements in **[[column-major order|column-major]]**: down the first column, then down the second, and so on.

```matlab
fprintf('%d %d\n', [1 2; 3 4])
%   1 3
%   2 4
```

The matrix has rows `1 2` and `3 4`, but `fprintf` read 1, 3 (the first column), then 2, 4 (the second). So to print one line per time sample, you want each *column* of what you pass to hold one sample. If your data are column vectors `t` and `alt`, build `[t alt]` (one row per sample) and then transpose it with `'`, so each sample becomes a column.

::: example Printing a hop-test table
A small test vehicle hops off the pad. Its altitude is logged every half second. Print a neat two-column table.

```matlab
t   = (0:0.5:1.5)';            % s, column vector
alt = [0; 3.1; 12.4; 27.9];    % m, column vector

fprintf('%4.1f %6.1f\n', [t alt]')
%    0.0    0.0
%    0.5    3.1
%    1.0   12.4
%    1.5   27.9
```

Step by step. `[t alt]` puts the two columns side by side: a 4-by-2 matrix, one row per sample. The `'` transposes it to 2-by-4, so each sample is now a column. `fprintf` reads column by column — 0.0 and 0.0, then 0.5 and 3.1, and so on — and fills the two blanks with each pair, running the template four times. `%4.1f` gives the time 4 characters with one decimal; `%6.1f` gives the altitude 6 characters, so `12.4` and `27.9` line up under `0.0`.

Sanity check: four samples in, four lines out, and each time sits next to its own altitude. Without the transpose, the first line would have read `0.0 0.5` — two times, no altitude — which is the classic sign of this mistake.
:::

::: warning %d with a number that is not whole
In MATLAB, if you use `%d` for a value that is not a whole number, `fprintf` does not round it. It quietly switches that blank to `%e`: `sprintf('%d', 1.5)` gives `'1.500000e+00'`. If a log line suddenly shows exponential notation where you expected a count, you passed a fraction to `%d`. Use `%.0f` if you want rounding. (GNU Octave prints `1.5` here instead, so this is one place the two differ.)
:::

### Printing to a file

`fprintf` can write to a file instead of the screen. You open the file with `fopen`, which returns a **[[file identifier|file-identifier]]** — a whole number that stands for the open file. You pass that number as the first input of `fprintf`, and close the file with `fclose` when you are done.

```matlab
fid = fopen('hop_log.txt', 'w');           % 'w' = write, replacing any old file
fprintf(fid, '%s,%s\n', 't_s', 'alt_m');   % header line
fprintf(fid, '%.1f,%.1f\n', [t alt]');     % one line per sample
fclose(fid);
```

The file now holds a header line and four data lines, such as `1.5,27.9`. With no file identifier, `fprintf` prints to the screen, which is the same as passing `1`.

## sprintf: the same template, text out

`sprintf` takes exactly the same format spec and values as `fprintf`, but instead of printing, it *returns* the finished text. Use it whenever the text is going somewhere else: a file name, a plot title, an error message, a cell of a table.

```matlab
line = sprintf('%s: apogee %.1f m at t = %.2f s', 'HOP-2', 152.43, 5.5)
%   line = 'HOP-2: apogee 152.4 m at t = 5.50 s'
```

If the format spec is char, the result is char. If it is a string, the result is a string.

Two helpers produce text without a format spec. `num2str(x)` turns a number into char text with a sensible number of digits, and `num2str(pi, 8)` asks for 8 significant digits, giving `'3.1415927'`. `mat2str([1 2; 3 4])` writes a whole matrix as text you could paste back into MATLAB: `'[1 2;3 4]'`.

::: example Numbered file names for a batch of runs
A test campaign produces one data file per run, and you want names that sort correctly in a folder: `hop_run_001.csv`, `hop_run_002.csv`, and so on.

```matlab
for k = 1:3
    name = sprintf('hop_run_%03d.csv', k);
    disp(name)
end
%   hop_run_001.csv
%   hop_run_002.csv
%   hop_run_003.csv
```

The conversion `%03d` means "a whole number, at least 3 characters wide, padded with zeros instead of spaces." So 1 becomes `001`. Why bother? Without the zeros, a folder listing sorts `hop_run_10.csv` before `hop_run_2.csv`, because it compares the character `1` with the character `2`. With zero padding, every number has the same width and alphabetical order matches run order — up to 999 runs.

Sanity check: `%03d` with 42 gives `042`, and with 1234 gives `1234` (the width is a minimum, never a cut).
:::

## save and load: MATLAB's own files

Printing turns numbers into text, and text only keeps [[the digits you asked for|text-precision]]. To keep variables *exactly* — every bit of every double, plus structs, cells and tables — MATLAB has its own file format, the **MAT-file**, with the extension `.mat`.

```matlab
save('hop.mat', 't', 'alt')     % save two chosen variables
save('hop.mat')                 % or: save every variable in the workspace
```

The first input is the file name, and the rest are the names of the variables to save, *as text*. MATLAB also accepts the shorter [[command syntax|command-syntax]] `save hop.mat t alt`, which means the same thing. Add `'-append'` to add variables to an existing file instead of replacing it.

Reading it back has two forms, and the difference matters.

```matlab
load('hop.mat')           % form 1: t and alt appear in the workspace
S = load('hop.mat');      % form 2: they arrive as fields of a struct
S.alt(end)
%   27.9000
```

Form 1 pours the file's variables straight into your workspace. If you already had a variable called `alt`, it is silently replaced. Form 2 puts them in a struct instead, so you see exactly what arrived and nothing is overwritten. Prefer form 2 in any script or function.

A few more facts about MAT-files. The default version is **version 7**, which compresses the data. A single variable of 2 GB or more needs **version 7.3**, chosen with `save('big.mat', 'x', '-v7.3')`, which stores the data in the open [[HDF5|hdf5]] format. `whos('-file', 'hop.mat')` lists what a file holds without loading it. And Python can read MAT-files too, so they are a handy way to hand data across.

::: warning A bare load can overwrite your variables
`load('hop.mat')` in the middle of a script can replace a variable you had computed with an old one of the same name, and nothing tells you. A bug like that can take an afternoon to find. Use `S = load('hop.mat')` and take out what you need: `t = S.t;`. It is one extra line and it makes every variable's origin visible.
:::

## readtable and writetable: CSV files

A **CSV file** (comma-separated values) is the plainest spreadsheet there is: a text file where each line is a row and commas separate the columns. The first line usually holds the column headings. Every tool — Excel, Python, a ground-station logger, a C++ program — can read and write it. The price of that openness is that it is text: it stores only the digits someone chose to write, and nothing about types.

`readtable` reads a CSV file into a table, using the header line for the variable names. `writetable` goes the other way.

```matlab
T = readtable('hop.csv');      % header t_s,alt_m  ->  variables T.t_s, T.alt_m
writetable(T, 'hop_out.csv')   % header line, then one line per row
```

Things to know:

- If a heading is not a valid MATLAB name — `alt (m)` has a space and brackets — `readtable` changes it into a valid one and prints a warning. Add `'VariableNamingRule', 'preserve'` to keep the original heading; you then reach that column with `T.("alt (m)")`.
- Text columns arrive as cell arrays of char by default. The option `'TextType', 'string'` asks for string arrays instead.
- `writetable` picks the format from the file extension, so `writetable(T, 'hop.xlsx')` writes an Excel spreadsheet.
- For a file that is nothing but numbers, `readmatrix` and `writematrix` read and write a plain numeric matrix, no table involved.

::: example A CSV round trip with a derived column
The file `hop.csv` holds the hop test from before, headed `t_s,alt_m`. Load it, add the climb rate between samples, print a check, and save the result.

```matlab
T = readtable('hop.csv');

vz = diff(T.alt_m) ./ diff(T.t_s);     % m/s between samples
T.vz_mps = [NaN; vz];                  % first row has no earlier sample

fprintf('%4.1f s  %6.1f m  %6.1f m/s\n', [T.t_s T.alt_m T.vz_mps]')
%    0.0 s     0.0 m     NaN m/s
%    0.5 s     3.1 m     6.2 m/s
%    1.0 s    12.4 m    18.6 m/s
%    1.5 s    27.9 m    31.0 m/s

writetable(T, 'hop_processed.csv')
save('hop_processed.mat', 'T')
```

Step by step. `diff` subtracts each value from the next: altitude changes $3.1 - 0 = 3.1$, $12.4 - 3.1 = 9.3$ and $27.9 - 12.4 = 15.5$ m, and every time step is $0.5$ s. Dividing element by element gives $3.1/0.5 = 6.2$, $9.3/0.5 = 18.6$ and $15.5/0.5 = 31.0$ m/s. There are only three differences for four rows, so a `NaN` ("not a number", MATLAB's marker for a missing value) fills the first row to keep the column the right height. The `fprintf` line uses the transpose trick from the first example. Then the table goes out twice: as CSV for anyone, and as a MAT-file that keeps every digit.

Sanity check: the climb rate rises by the same $12.4$ m/s every half second, so the acceleration is steady at $12.4 / 0.5 = 24.8\,\mathrm{m/s^2}$ — about two and a half times Earth's gravity, a believable push for a small rocket motor.
:::

::: key
`disp` shows a value without its name; `fprintf` prints from a format spec and recycles it over extra values, reading matrices column by column; `sprintf` returns the text instead of printing it. `save`/`load` keep variables exactly in `.mat` files, and `S = load(...)` is the safe form. `readtable` and `writetable` move tables in and out of CSV and spreadsheet files.
:::

## Check yourself

::: check
Write one `fprintf` call that prints `Thrust: 845.2 kN` on its own line from `F = 845217` (newtons).
:::

::: answer
`fprintf('Thrust: %.1f kN\n', F/1000)`. The division turns newtons into kilonewtons: $845217 / 1000 = 845.217$. The conversion `%.1f` keeps one decimal, and it rounds, so 845.217 prints as `845.2`. The `\n` ends the line, which `fprintf` would not do on its own.
:::

::: check
`A = [10 20 30; 1 2 3]`. What does `fprintf('%d-%d\n', A)` print, and why?
:::

::: answer
It prints three lines: `10-1`, `20-2` and `30-3`. `fprintf` reads the matrix in column-major order — down the first column (10, 1), then the second (20, 2), then the third (30, 3). The format spec has two blanks, so each pass uses one column, and it recycles three times.
:::

::: check
A script ends with `load('baseline.mat')`. The file holds variables `gain` and `t`. Before that line, the script had computed its own `t` with 5000 samples. What goes wrong, and what should the line be?
:::

::: answer
`load` pours `gain` and `t` from the file straight into the workspace. The file's `t` silently replaces the 5000-sample `t` the script had computed, so every later line that uses `t` works on the wrong time vector — and no warning appears. Write `B = load('baseline.mat');` instead, then use `B.gain` and `B.t`, or copy out only what you need with `gain = B.gain;`. Your own `t` stays untouched.
:::

::: check
What is the difference between `fprintf('%.2f\n', g)` and `s = sprintf('%.2f\n', g)` for `g = 9.80665`? Give one job each is right for.
:::

::: answer
Both use the same format spec and build the same text, `9.81` followed by a new line. `fprintf` prints it (to the screen, or to a file if you give a file identifier first) and gives you nothing to keep. `sprintf` prints nothing and returns the text, so `s` holds it. `fprintf` is right for a progress line or a report written to a log file. `sprintf` is right when the text must go somewhere else: a plot title, a file name, or an error message passed to `error`.
:::

::: check
You must send processed flight data to (a) a teammate who will keep working in MATLAB and (b) a colleague whose analysis is in Python and Excel. Which file format for each, and which functions write it?
:::

::: answer
(a) A MAT-file: `save('flight.mat', 'T')`. It keeps every variable exactly — full double precision, the table's variable names and types — and your teammate gets it back with `S = load('flight.mat')`.

(b) A CSV file: `writetable(T, 'flight.csv')`. It is plain text that Excel opens directly and Python reads in one call, at the cost of storing only the digits written and no type information. (Python can also read a version 7 MAT-file, but CSV is the choice that serves both Excel and Python.)
:::

## Summary

| Tool | What it does | Example |
| --- | --- | --- |
| no semicolon | shows name and value | `x = 3.14159` |
| `disp` | shows a value, no name | `disp(['Apogee: ' num2str(apo) ' m'])` |
| `fprintf` | prints from a format spec; recycles; column-major | `fprintf('%4.1f %6.1f\n', [t alt]')` |
| conversions | `%d` whole, `%f` fixed, `%e` exponent, `%g` shorter, `%s` text | `%8.2f` = width 8, 2 decimals |
| specials | `\n` new line, `\t` tab, `%%` percent, `''` quote | `fprintf('100%% done\n')` |
| file output | `fopen`, `fprintf(fid, ...)`, `fclose` | `fid = fopen('log.txt', 'w')` |
| `sprintf` | returns the formatted text | `sprintf('run_%03d.csv', 7)` gives `'run_007.csv'` |
| `save` | writes variables to a `.mat` file | `save('hop.mat', 't', 'alt')` |
| `load` | reads them back; prefer the struct form | `S = load('hop.mat')` |
| `readtable` / `writetable` | CSV or spreadsheet to and from a table | `T = readtable('hop.csv')` |

You have now written a few scripts that load, compute and save. The next lesson asks what a script really is, how it differs from a function, and which variables each one can see — the workspaces behind every line you have run so far.

::: context ground-station Where flight data lands
A ground station is the set of antennas, radios and computers on the ground that talk to a vehicle. For a hop test it may be a laptop and a radio in a trailer a few hundred meters from the pad. It receives the vehicle's telemetry — the stream of measurements the vehicle sends down — and writes it to disk, very often as CSV, because every tool on the team can open that. Your MATLAB work starts where the ground station's file ends.
:::

::: context printf-history Borrowed from C
The format spec idea comes from the `printf` function of the C programming language, written at Bell Labs in the 1970s. MATLAB's first versions were written by Cleve Moler in Fortran, but the commercial MATLAB was rewritten in C, and it kept C's formatting language. So `%8.2f` means the same thing in MATLAB, C, C++ and Python's old `%` formatting. Learn it once and you can read log-printing code in the flight software too.
:::

::: context column-major Down the columns first
MATLAB stores every matrix column by column in memory: the whole first column, then the whole second. Any function that walks through "all the elements" — `fprintf`, `A(:)`, linear indexing from lesson 3 — follows that same order. The red arrow shows the order `fprintf` reads a 2-by-3 matrix.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="90" y="20" width="60" height="36"/><rect x="150" y="20" width="60" height="36"/><rect x="210" y="20" width="60" height="36"/>
    <rect x="90" y="56" width="60" height="36"/><rect x="150" y="56" width="60" height="36"/><rect x="210" y="56" width="60" height="36"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="112" y="43">10</text><text x="172" y="43">20</text><text x="232" y="43">30</text>
    <text x="112" y="79">1</text><text x="172" y="79">2</text><text x="232" y="79">3</text>
  </g>
  <g stroke="#b4232c" stroke-width="2" fill="none">
    <polyline points="132,32 132,72 192,32 192,72 252,32 252,72"/>
  </g>
  <g font-size="11" fill="#b4232c" text-anchor="middle">
    <text x="140" y="30">1</text><text x="140" y="90">2</text><text x="200" y="30">3</text>
    <text x="200" y="90">4</text><text x="260" y="30">5</text><text x="260" y="90">6</text>
  </g>
  <text x="180" y="118" font-size="12" fill="#6c7a93" text-anchor="middle">read order: 10, 1, 20, 2, 30, 3</text>
</svg>
```
:::

::: context file-identifier A number that stands for a file
`fopen` returns a whole number, the file identifier, that MATLAB uses to keep track of the open file. Two numbers are always taken: 1 is the screen (standard output) and 2 is standard error, where error messages go. If `fopen` cannot open the file — a wrong folder, no permission — it returns `-1`, so careful code checks `if fid < 0` before writing. Every `fopen` needs a matching `fclose`, or the file may stay locked or lose its last lines.
:::

::: context text-precision Why text files lose digits
A double holds about 16 significant digits. When you write it as text you choose how many to keep, and anything you drop is gone. Writing $g_0 = 9.80665$ with `%.2f` stores `9.81`, which is 0.034% too big. For a text file to bring every double back bit for bit, you need 17 significant digits (`%.17g`). A MAT-file stores the raw 8 bytes, so nothing is ever rounded — the reason teams archive processed flight data as MAT-files and hand CSV copies around.
:::

::: context command-syntax Two ways to write the same call
MATLAB lets you call a function without brackets or quotes: `save hop.mat t alt` means `save('hop.mat', 't', 'alt')`. Every word after the function name is passed in as char text. That is handy at the Command Window, but it cannot take a value from a variable: `save fname` saves to a file literally called `fname.mat`, not to the name stored in `fname`. In scripts, use the bracket form.
:::

::: context hdf5 The format under version 7.3
HDF5 (Hierarchical Data Format, version 5) is an open file format run by the nonprofit HDF Group, built for large scientific data sets. MAT-file version 7.3 is an HDF5 file with MATLAB's own layout inside. In Python, `scipy.io.loadmat` reads version 7 and older files but not version 7.3; for those, the `h5py` library opens the HDF5 structure directly.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="150" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="42" font-size="12" fill="#1f2a44" text-anchor="middle">MAT v7 (default)</text>
  <rect x="200" y="20" width="150" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="42" font-size="12" fill="#1f2a44" text-anchor="middle">MAT v7.3 (HDF5)</text>
  <text x="85" y="76" font-size="12" fill="#1f2a44" text-anchor="middle">under 2 GB per variable</text>
  <text x="275" y="76" font-size="12" fill="#1f2a44" text-anchor="middle">2 GB and up</text>
  <text x="85" y="98" font-size="12" fill="#6c7a93" text-anchor="middle">Python: scipy.io.loadmat</text>
  <text x="275" y="98" font-size="12" fill="#6c7a93" text-anchor="middle">Python: h5py</text>
</svg>
```
:::
