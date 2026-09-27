---
id: l07-structs-cells-tables-strings
title: Structs, cells, tables and text
minutes: 20
covers:
  - struct, cell, table, categorical, string versus char
---

Picture an egg carton. Every cup is the same size and holds the same kind of thing: one egg. That is a MATLAB matrix. Every element is a number, every number takes the same space, and that sameness is what makes the matrix fast. Lesson 6 leaned on it: you preallocated a row of zeros and filled it in a loop, one number per cup.

Now picture what a flight test actually hands you. A rocket stage has a *name* (text), a *dry mass* (a number), an *engine count* (a whole number) and maybe a list of *sensor labels* (text of different lengths). A telemetry log has a time column, an altitude column and a column saying which **flight phase** — boost, coast, descent — the vehicle was in. None of that fits in an [[egg carton|egg-carton]]. You need containers that can hold different kinds of things side by side.

MATLAB gives you five of them, and this lesson meets each in turn. A **struct** is a form with labeled blanks. A **cell array** is a set of cubbies that can each hold anything. A **table** is a spreadsheet that lives in one variable. A **categorical** array is a column of labels picked from a short list. And there are two kinds of text, **char** and **string**, which look alike and behave differently. GNC engineers use all five every day: a vehicle's parameters live in a struct, flight data lives in a table, and log messages are text.

## Structs: a form with labeled blanks

Think of a form at the doctor's office. It has blanks with labels — Name, Height, Weight — and you fill in each blank. A **struct** (short for structure) is that form. Each labeled blank is a **field**: a name paired with a value. You reach a field with a dot, read aloud as "stage dot isp".

```matlab
stage.name     = 'Stage 1';
stage.dryMass  = 22200;     % kg
stage.propMass = 395700;    % kg of propellant
stage.isp      = 282;       % s, specific impulse at sea level

disp(stage.dryMass + stage.propMass)
%   417900
```

The first line creates the struct and its first field at the same time. Each later line adds another field. The values can be any type: here one is text and three are numbers. The numbers are close to the published figures for a Falcon 9 first stage.

If you know Python, a struct feels like a dictionary whose keys are all text. The difference is the dot: you write `stage.isp` instead of `stage["isp"]`. Field names follow the same [[naming rules|field-name-rules]] as variable names.

A few tools come with structs:

- `fieldnames(stage)` returns the field names as a list of text.
- `isfield(stage, 'isp')` returns `1` (true) if the field exists.
- `stage.(f)`, with `f` a variable holding text, reaches the field whose name is stored in `f`. This is a **[[dynamic field name|dynamic-fields]]**: the name is decided while the program runs.
- A field can hold another struct, so `vehicle.stage1.engine.count = 9` builds a **nested struct**, a form inside a form.

```matlab
f = 'isp';
disp(stage.(f))
%   282
disp(isfield(stage, 'thrust'))
%   0
```

### Struct arrays: one form per row

One form describes one stage. A rocket has two stages, so you want a stack of forms, all with the same blanks. That stack is a **[[struct array|struct-array]]**: an array whose every element is a struct with the same fields. You index it with parentheses, exactly like a numeric array, and then use the dot.

```matlab
stages(1).name = 'S1';  stages(1).dryMass = 22200;  stages(1).propMass = 395700;
stages(2).name = 'S2';  stages(2).dryMass = 4000;   stages(2).propMass = 92670;

size(stages)
%   1   2
props = [stages.propMass]
%   395700   92670
```

The last line is worth reading slowly. `stages.propMass` on a struct array produces *one value per element*, and the square brackets glue those values into a row. So `[stages.propMass]` is a numeric row you can do arithmetic on.

You can also build the whole array in one call with the `struct` function. When you pass a cell array (next section) as a value, MATLAB makes one element per entry:

```matlab
s = struct('name', {'S1', 'S2'}, 'isp', {282, 348});
size(s)
%   1   2
s(2).isp
%   348
```

::: example Propellant fraction of each stage
The **propellant fraction** of a stage is the share of its full mass that is propellant: $f = m_p / (m_d + m_p)$, where $m_p$ ("m sub p") is propellant mass and $m_d$ is dry mass. Compute it for both stages of the struct array above in one line.

```matlab
mp = [stages.propMass];          % [395700  92670]
md = [stages.dryMass];           % [22200   4000]
f  = mp ./ (md + mp)
%   0.9469   0.9586
```

Step by step: the brackets pull each field out as a row. The sum `md + mp` gives the full masses, $22200 + 395700 = 417900$ kg and $4000 + 92670 = 96670$ kg. The element-wise divide `./` from lesson 4 divides each propellant mass by its own full mass: $395700 / 417900 \approx 0.947$ and $92670 / 96670 \approx 0.959$.

Sanity check: both are a little under 1, and both are above 0.9. A rocket stage is mostly propellant — an empty stage weighs only about a twentieth of a full one — so that is what you should expect.
:::

::: warning Text fields and square brackets
`[stages.propMass]` works because the values are numbers. Try the same with text and you get a surprise: `[stages.name]` glues `'S1'` and `'S2'` into the single piece of text `'S1S2'`. To collect text fields, use curly braces instead: `{stages.name}` builds a cell array holding `'S1'` and `'S2'` separately.
:::

## Cell arrays: cubbies that hold anything

A school hallway has a wall of cubbies. One cubby holds a backpack, the next a basketball, the next a single glove. A **cell array** is that wall. Each **cell** is one cubby, and each can hold any MATLAB value of any size: a number, a matrix, some text, a struct, even another cell array. You build one with curly braces.

```matlab
c = {3.7, 'LOX', [1 2 3]};
```

Here is the one rule that matters most. There are two ways to reach into a cell array, and they return different things:

- **Parentheses** `c(2)` return the *cubby itself*: a smaller cell array, 1-by-1, still a cell.
- **Curly braces** `c{2}` return *what is inside the cubby*: here the text `'LOX'`.

```matlab
class(c(2))
%   cell
class(c{2})
%   char
x = c{3}
%   1   2   3
```

Read `c{3}` aloud as "the contents of c three". To grow a cell array in a loop, you preallocate it the same way lesson 6 taught for numbers: `names = cell(1, n)` makes `n` empty cubbies, each holding `[]`, the empty matrix.

Where do cells earn their keep? Lists of text of different lengths are the classic case: `{'LOX', 'RP-1', 'helium'}`. Functions that take a variable number of inputs receive them in a cell array, which lesson 11 covers. Beyond that, reach for a struct or a table first. A cell array has no field names to tell you what is in each cubby, it cannot do arithmetic on its contents, and every cubby costs extra [[memory overhead|cell-overhead]]. Treat it as a last resort.

::: warning Parentheses or braces?
The most common cell mistake is `c(2)` when you meant `c{2}`. The error comes later, far from the cause: `c(3) * 2` fails with a complaint that multiplication is not defined for cells, while `c{3} * 2` gives `[2 4 6]`. When a line that touches a cell array errors, check the brackets first. And never index a plain numeric matrix with braces: `M{2,4}` is an error, because `M` has no cubbies.
:::

## Tables: a spreadsheet in one variable

Open any spreadsheet. Each column has a heading, each column holds one kind of thing, and each row is one moment or one item. A **table** is exactly that. Each column is a **table variable** with its own name and its own type, so one table can hold a numeric time column, a numeric altitude column and a text or categorical phase column. If you have met a pandas [[DataFrame|dataframe]] in Python, a table is MATLAB's version of the same idea.

You build a table from column vectors. By default the table variables take the names of the workspace variables you passed in:

```matlab
t   = (0:10:50)';                          % s
alt = [0; 1.2; 4.9; 11.0; 19.4; 30.1];     % km
T = table(t, alt);
```

MATLAB displays `T` as a grid of 6 rows and 2 columns headed `t` and `alt`. Now the ways in:

- `T.alt` returns the whole altitude column as an ordinary numeric column vector.
- `T(2:3, :)` with parentheses returns a smaller *table*: rows 2 and 3, every variable.
- `T{2:3, 'alt'}` with braces returns the *contents*: a plain numeric array. Same idea as with cells: parentheses keep the container, braces open it.
- `height(T)` is the number of rows, `width(T)` the number of variables.
- `T.speed = ...` adds a new column, as long as it has one entry per row.
- `T.Properties.VariableNames` holds the column names, and `T.Properties.VariableUnits` can hold a unit for each, such as `{'s', 'km'}`.
- `T(T.alt > 10, :)` uses logical indexing from lesson 3 to keep only the rows where altitude is above 10 km.

A table can also carry **row names**, a label for each row (`T.Properties.RowNames`), which is handy when rows are items such as stages rather than moments in time.

Here is the comparison worth memorizing, because it decides which container you pick.

::: key
A struct array is a record per element with named fields; a table is column-oriented with named variables, mixed types and row names, which is what you want for tabular flight data; a cell holds arbitrary heterogeneous contents and should be a last resort.
:::

"Column-oriented" means the table stores each column together. Asking for `T.alt` hands you a single numeric vector in one step, ready for `mean`, `max` or a plot. With a struct array you would have to gather `[s.alt]` from every element first.

## Categorical: labels from a short list

A traffic light only ever shows red, yellow or green. You would never write down "greenish" or "Red " with a trailing space. A **categorical** array is a column of labels where every entry must come from a fixed, short list of **categories**. Flight phases, engine states, sensor names and pass/fail results are all categorical data.

```matlab
phase = categorical({'boost'; 'boost'; 'boost'; 'boost'; 'coast'; 'coast'});
categories(phase)
%   {'boost'}
%   {'coast'}
countcats(phase)
%   4
%   2
```

`categories` lists the allowed labels, sorted alphabetically unless you give your own order. `countcats` counts how many entries fall in each category, in that same order. Comparing with `==` gives a logical array you can index with: `phase == 'coast'` is true in rows 5 and 6.

Why not store the phases as text? Three reasons. A categorical array stores each label once and keeps a small whole-number code per row, so it uses much less memory for a long log. A typo such as `'cost'` shows up as its own suspicious category instead of hiding among thousands of rows. And when the categories have a natural order, you can make the array [[ordinal|ordinal-categories]] and compare with `<` and `>`.

::: example Mean altitude in each flight phase
Put the phase column into the table from above, then find the mean altitude during boost and during coast.

```matlab
T.phase = phase;

boostRows = T.phase == 'boost';           % logical: 1 1 1 1 0 0
meanBoost = mean(T.alt(boostRows))
%   4.2750
meanCoast = mean(T{T.phase == 'coast', 'alt'})
%   24.7500
```

Step by step. `T.phase == 'boost'` compares every row's label with `'boost'` and gives a logical column. `T.alt(boostRows)` keeps the altitudes in those rows: 0, 1.2, 4.9 and 11.0 km. Their sum is 17.1 km, and $17.1 / 4 = 4.275$ km. The second line does the same job in one step with braces: rows where the phase is `'coast'`, variable `'alt'`, contents out. Those altitudes are 19.4 and 30.1 km, and $(19.4 + 30.1)/2 = 24.75$ km.

Sanity check: the coast mean is far higher than the boost mean. The rocket climbs the whole time, and coast comes after boost, so every coast altitude is above every boost altitude. That is what the numbers show.
:::

## Text: char versus string

MATLAB has two kinds of text, and they come from two eras.

A **char array** (character array) is the old kind. You write it in single quotes: `'LOX'`. It is an ordinary MATLAB array whose elements are characters, so `'LOX'` is a 1-by-3 array, one element per letter. Behind each letter is a number, its [[character code|char-codes]]: `L` is 76, `O` is 79, `X` is 88.

A **string** is the newer kind, added to MATLAB in release R2016b. You write it in double quotes: `"LOX"`. A string is one whole piece of text in a single element, so `"LOX"` is 1-by-1. An array of strings, such as `["LOX" "RP-1" "helium"]`, is 1-by-3 with one piece of text per element, even though the pieces have different lengths.

That one difference — one element per letter versus one element per piece of text — explains every surprise below.

| Question | char `'LOX'` | string `"LOX"` |
| --- | --- | --- |
| Size | 1-by-3 | 1-by-1 |
| Number of letters | `length('LOX')` is 3 | `strlength("LOX")` is 3 |
| Join two | `['LOX' '-A']` gives `'LOX-A'` | `"LOX" + "-A"` gives `"LOX-A"` |
| Compare | `strcmp('LOX', 'LH2')` gives 0 | `"LOX" == "LH2"` gives 0 |
| Several of different lengths | cell array `{'LOX', 'RP-1'}` | string array `["LOX" "RP-1"]` |

Since `+` on strings means "join", you can build labels with numbers mixed in. `"Stage " + 2` gives `"Stage 2"`, and `"Stage " + (1:3)` gives the three-element string array `["Stage 1" "Stage 2" "Stage 3"]`. With char you convert the number yourself: `['Stage ' num2str(2)]` gives `'Stage 2'`.

To move between the two, `string('LOX')` gives `"LOX"` and `char("LOX")` gives `'LOX'`. To turn text into a number, `str2double('3.5')` gives `3.5`, for either kind of text. Most MATLAB functions accept both kinds, and newer code tends to use strings. Older functions and older code use char everywhere, so you will read both.

::: warning Arithmetic on char is arithmetic on codes
Because a char array is secretly an array of numbers, math on it does not fail — it does something you did not want. `'ab' + 'cd'` gives `[196 198]`, the sums of the codes $97 + 99$ and $98 + 100$. `'abc' == 'abd'` compares letter by letter and gives `[1 1 0]`, and `'abc' == 'ab'` errors because the lengths differ. `double('3.5')` gives the codes `[51 46 53]`, not the number 3.5. Compare char text with `strcmp`, join it with square brackets, and convert it with `str2double`. With strings, `==` and `+` do what you expect.
:::

::: note GNU Octave and text
If you practice in GNU Octave, the free MATLAB look-alike, know that Octave has no string class. In Octave, `"LOX"` is a char array like `'LOX'`, so the string rows of the table above behave like the char rows. Tables and categorical arrays are also missing from Octave. Structs and cell arrays work the same in both.
:::

## Check yourself

::: check
You have a 1-by-3 struct array `sensors` with fields `name` (char) and `rate` (sample rate in Hz, a number). Write one line that gives the highest sample rate, and one line that gives all three names without gluing them together.
:::

::: answer
`max([sensors.rate])`. The expression `sensors.rate` yields one value per element, the square brackets collect the three numbers into a numeric row, and `max` picks the largest.

`{sensors.name}`. Curly braces collect the three pieces of text into a 1-by-3 cell array, one name per cell. Square brackets would have concatenated the letters into one long char array such as `'imugpsbaro'`, with no way to tell where one name ends.
:::

::: check
`c = {9.81, 'm/s^2', [1 0 0]}`. What are `class(c(1))`, `class(c{1})`, and the result of `c{3} * 2`? What happens with `c(3) * 2`?
:::

::: answer
`class(c(1))` is `'cell'`: parentheses return the cubby, a 1-by-1 cell array. `class(c{1})` is `'double'`: braces return the contents, the number 9.81. `c{3} * 2` opens the third cubby, takes the vector `[1 0 0]` and doubles it, giving `[2 0 0]`. `c(3) * 2` is an error, because it tries to multiply a cell array by 2, and arithmetic is not defined for cells.
:::

::: check
You are storing a 20-minute flight log sampled at 100 Hz: time, three accelerations and a flight-mode label on every row. Should the rows be a struct array, a cell array or a table? What type should the mode column be? How many rows is it?
:::

::: answer
A table. The data is tabular — the same columns on every row — and a table stores each column together, so `T.ax` hands you a numeric vector ready for `mean` or a plot, with named columns and mixed types. A struct array would store one little record per sample, which makes every column operation a gather. A cell array has no names at all.

The mode column should be categorical: the modes come from a short fixed list, each label is stored once with a small code per row, and `T.mode == 'coast'` picks rows directly.

The row count: 20 minutes is $20 \times 60 = 1200$ s, and at 100 samples per second that is $1200 \times 100 = 120000$ rows.
:::

::: check
What does each line produce? (a) `strlength("RP-1")` (b) `numel("RP-1")` (c) `numel('RP-1')` (d) `"RP-" + 1`
:::

::: answer
(a) 4: a string counts its letters with `strlength`, and "RP-1" has four characters. (b) 1: the string is a single element, however long its text. (c) 4: a char array has one element per character. (d) `"RP-1"`: `+` with a string joins, and the number 1 is converted to the text `"1"` first.
:::

::: check
A colleague reads a number from a text file as the char `'282'` and writes `isp = double('282')`. What does `isp` hold, and what should the line be?
:::

::: answer
`isp` holds the three character codes `[50 56 50]`, because `double` on a char array converts each letter to its code: `'2'` is 50 and `'8'` is 56. The later rocket-equation math would run without error on a 1-by-3 vector and give nonsense. The line should be `isp = str2double('282')`, which reads the text as the number 282.
:::

## Summary

| Container | Built with | Reach in with | Use it for |
| --- | --- | --- | --- |
| struct | `s.field = value` or `struct(...)` | `s.field`, `s.(name)` | one item's named parameters |
| struct array | `s(k).field = value` | `s(k).field`, `[s.field]` | a record per element |
| cell array | `{a, b, c}`, `cell(1,n)` | `c{k}` contents, `c(k)` sub-cell | mixed contents, last resort |
| table | `table(t, alt)` | `T.alt`, `T(rows,:)`, `T{rows,'alt'}` | tabular flight data |
| categorical | `categorical({...})` | `==`, `categories`, `countcats` | labels from a short fixed list |
| char | `'LOX'` | one element per letter; `strcmp`, `[a b]` | older code, many functions |
| string | `"LOX"` | one element per text; `==`, `+`, `strlength` | newer code |

The next lesson shows these containers to the outside world: printing them neatly with `fprintf`, saving them in `.mat` files, and moving tables in and out of CSV files with `readtable` and `writetable`.

::: context egg-carton Why a matrix holds only one kind of thing
A numeric matrix keeps its numbers packed side by side in memory, each taking exactly 8 bytes for the default `double` type. Because every element is the same size, MATLAB can find element number $k$ with one multiplication: start address plus $8(k-1)$ bytes. That is why indexing and whole-array math are fast. The moment elements could be different kinds or sizes, that simple arithmetic breaks, so mixed data needs a different container.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">matrix: equal cups, one kind</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="10" y="28" width="36" height="28"/><rect x="46" y="28" width="36" height="28"/>
    <rect x="82" y="28" width="36" height="28"/><rect x="118" y="28" width="36" height="28"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="28" y="47">0</text><text x="64" y="47">1.2</text><text x="100" y="47">4.9</text><text x="136" y="47">11</text>
  </g>
  <text x="200" y="18" font-size="12" fill="#1f2a44">cell: cubbies, any contents</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="200" y="28" width="44" height="28"/><rect x="244" y="28" width="44" height="28"/><rect x="288" y="28" width="60" height="28"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="222" y="47">3.7</text><text x="266" y="47">'LOX'</text><text x="318" y="47">[1 2 3]</text>
  </g>
  <text x="10" y="84" font-size="12" fill="#6c7a93">every cup 8 bytes, same type</text>
  <text x="200" y="84" font-size="12" fill="#6c7a93">each cubby its own array</text>
  <text x="200" y="102" font-size="12" fill="#6c7a93">of any size and type</text>
</svg>
```
:::

::: context field-name-rules What a field may be called
A field name, like a variable name, must start with a letter and may contain only letters, digits and underscores, up to 63 characters (`namelengthmax` returns 63). So `dryMass` and `dry_mass_kg` are fine, while `dry mass`, `2ndStage` and `mass-kg` are not. Case matters: `stage.Isp` and `stage.isp` are two different fields. This rule comes back in the next lesson, when a CSV file's column headers must become table variable names.
:::

::: context dynamic-fields When the field name is data
Dynamic field names let a loop walk over fields whose names you only know at run time. Suppose `names = {'ax', 'ay', 'az'}` and a struct `acc` has those three fields. The loop `for k = 1:3, disp(max(acc.(names{k}))), end` prints the peak of each axis without typing the names three times. It is the struct version of Python's `d[key]`. The parentheses matter: `acc.names{k}` would look for a field literally called `names`.
:::

::: context struct-array A stack of identical forms
In a struct array, every element has the same set of fields — MATLAB enforces it. If you assign `stages(3).thrust = 934`, MATLAB adds a `thrust` field to elements 1 and 2 as well, filled with the empty matrix `[]`. Picture a grid: elements run down the side, field names across the top, and every cell of the grid exists.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="20">name</text><text x="220" y="20">dryMass</text><text x="305" y="20">propMass</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="100" y="30" width="80" height="30"/><rect x="180" y="30" width="80" height="30"/><rect x="260" y="30" width="90" height="30"/>
    <rect x="100" y="60" width="80" height="30"/><rect x="180" y="60" width="80" height="30"/><rect x="260" y="60" width="90" height="30"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="50">'S1'</text><text x="220" y="50">22200</text><text x="305" y="50">395700</text>
    <text x="140" y="80">'S2'</text><text x="220" y="80">4000</text><text x="305" y="80">92670</text>
  </g>
  <g font-size="12" fill="#1d6fd1">
    <text x="10" y="50">stages(1)</text><text x="10" y="80">stages(2)</text>
  </g>
  <text x="100" y="110" font-size="12" fill="#b4232c">[stages.propMass] reads down one column</text>
</svg>
```
:::

::: context cell-overhead Why cells cost extra
Every cubby in a cell array is a complete MATLAB array with its own bookkeeping: its type, its size and where its data lives. For a big matrix that bookkeeping is tiny next to the data. For a cell array of a million single numbers, the bookkeeping is most of the memory, and each number sits somewhere different, so loops over it are slower too. Run `whos` after making `x = rand(1,1e6)` and `c = num2cell(x)` and compare the bytes column: the cell array is many times larger.
:::

::: context dataframe Tables and pandas
MathWorks added the table type in release R2013b, the same release that introduced categorical arrays. Its design is close to the pandas DataFrame in Python: named columns of mixed type, row selection with logical masks, and functions to join, sort and group. The names differ — pandas says "column", MATLAB says "variable" — which trips people moving between the two. A table's "variable" is a column, not a workspace variable.
:::

::: context ordinal-categories Categories that have an order
Flight phases happen in order: prelaunch, boost, coast, descent. Build them with `categorical(data, {'prelaunch','boost','coast','descent'}, 'Ordinal', true)` and MATLAB keeps that order instead of the alphabetical one. Then `phase > 'boost'` is true for every row in coast or descent. A mode sequencer — the logic that steps a vehicle from one phase to the next, which you will build in the Simulink modules — is exactly this kind of ordered list.
:::

::: context char-codes Letters are stored as numbers
A computer stores text as numbers, one code per character. MATLAB uses Unicode codes, and the ones for plain English letters are the same as the older ASCII table: `A` is 65, `a` is 97, the digit `0` is 48. So `double('LOX')` gives `[76 79 88]` and `char([76 79 88])` turns it back into `'LOX'`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">char 'LOX': three elements</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="10" y="28" width="40" height="30"/><rect x="50" y="28" width="40" height="30"/><rect x="90" y="28" width="40" height="30"/>
  </g>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="48">L</text><text x="70" y="48">O</text><text x="110" y="48">X</text>
  </g>
  <g font-size="12" fill="#b4232c" text-anchor="middle">
    <text x="30" y="78">76</text><text x="70" y="78">79</text><text x="110" y="78">88</text>
  </g>
  <text x="200" y="18" font-size="12" fill="#1f2a44">string "LOX": one element</text>
  <rect x="200" y="28" width="120" height="30" stroke="#1f2a44" stroke-width="1.5" fill="#f2b880"/>
  <text x="260" y="48" font-size="14" fill="#1f2a44" text-anchor="middle">LOX</text>
  <text x="10" y="100" font-size="12" fill="#6c7a93">red: the code stored behind each letter</text>
</svg>
```
:::
