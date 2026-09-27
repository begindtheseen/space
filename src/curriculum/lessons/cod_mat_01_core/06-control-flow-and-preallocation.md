---
id: l06-control-flow-and-preallocation
title: Control flow and preallocation
minutes: 20
covers:
  - 'Control flow: if, switch, for, while, break, continue'
  - Preallocation and why growing an array in a loop is fatal
---

The last two lessons were about single operations: one multiply, one solve. Real programs make decisions and repeat work. "If the altitude is above 11 km, use this air model." "For every sample in the flight log, check the temperature." "Keep stepping the simulation while the rocket is still in the air." You already write all of these in Python. MATLAB has the same ideas with slightly different spelling, and this lesson is your phrasebook.

The second half is about a habit that matters far more in MATLAB than in Python. Picture a bookshelf that holds exactly as many books as you own. Each time you buy a new book, you buy a new shelf one slot bigger, carry every old book across, and throw the old shelf away. With ten books that is silly. With a million it takes all year. MATLAB code that grows an array one element at a time inside a loop can do exactly that. On a GNC team, the script that takes forty minutes to process one flight test instead of ten seconds is very often this one mistake.

## Choosing: if, elseif, else

An `if` block runs its body only when a condition is true. MATLAB spells it like this:

```matlab
altitude = 12500;                 % m
if altitude < 0
    disp("below ground: check the sensor")
elseif altitude < 11000
    disp("troposphere")
else
    disp("above the troposphere")
end
% prints: above the troposphere
```

Compared with Python:

- There is no colon, and indentation does not matter to MATLAB. The block ends with the keyword **`end`**. Indent anyway, for the people who read it.
- Python's `elif` is spelled `elseif`, one word.
- "Not equal" is `~=`, not `!=`. The tilde `~` means "not" everywhere in MATLAB, so "not ready" is `~ready`.
- "And" is `&&`, "or" is `||`. Python's `True` and `False` are lowercase `true` and `false`.

`&&` and `||` are **[[short-circuit|short-circuit]]** operators: they stop as soon as the answer is known. In `n > 0 && total/n > 5`, if `n` is 0 the division is never attempted. They want single true-or-false values on each side. The single-character forms `&` and `|` work element by element on whole arrays, the way `.*` did in lesson 4. Use `&&` and `||` in `if` and `while` conditions, and `&` and `|` when building a logical array for indexing.

::: warning An if on an array
MATLAB allows `if v > 0` when `v` is a whole vector. The condition counts as true only when **every** element is true (nonzero), and an empty array counts as false. With `v = [3 -1 4]`, `if v > 0` quietly takes the `else` branch. That is rarely what a reader expects. Say what you mean: `if all(v > 0)` or `if any(v < 0)`.
:::

## Choosing among many: switch

When one value picks among several fixed choices, a ladder of `elseif`s gets hard to read. The **`switch`** statement compares one value against a list of `case`s and runs the first one that matches. It works with numbers and with text:

```matlab
mode = "coast";
switch mode
    case "ascent"
        throttle = 1.0;
    case {"coast", "separation"}
        throttle = 0.0;
    otherwise
        error("unknown mode: %s", mode);
end
% throttle = 0
```

Three details matter.

- Curly braces `{...}` around several values mean "any of these". `"coast"` and `"separation"` share one case.
- `otherwise` catches everything that matched no case. Put one in, and make it complain. A **[[flight-mode sequencer|mode-sequencer]]** that silently ignores an unknown mode is a sequencer that can hang.
- Only the first matching case runs, and then MATLAB jumps to the `end`. There is no **[[fall-through|fall-through]]** into the next case, so there is no `break` to forget. That differs from C and C++, which you will meet later in the track.

Python 3.10 added a `match` statement that plays the same role. In MATLAB, `switch` has been there from the start and is the normal way to write a mode table.

## Repeating a known number of times: for

A **`for`** loop runs its body once for each value in a list:

```matlab
for k = 1:3
    fprintf("k = %d\n", k);
end
% k = 1
% k = 2
% k = 3
```

(`fprintf` prints formatted text, a little like a Python f-string: `%d` marks where a whole number goes and `\n` starts a new line. Lesson 8 covers it properly.)

`1:3` is the colon range from lesson 2, and it includes both ends. So `for k = 1:n` runs exactly `n` times, like Python's `for k in range(n)`, but counting 1 to `n` instead of 0 to `n-1`. Any step works: `10:-3:1` gives `10 7 4 1`. An empty range such as `1:0` runs the body zero times.

Two MATLAB-specific behaviors:

- `for` actually walks through the **columns** of whatever is on the right of the `=`. For a row vector each column is one number, so it feels like a list. But `for col = M` with a 2-by-3 matrix `M` gives three passes, each with a 2-by-1 column. Handy on purpose, confusing by accident.
- Changing the loop variable inside the body does not change the next pass. If the body sets `k = 10*k`, the next pass still starts from the next value in the range.

## Repeating until something happens: while, break, continue

A **`while`** loop repeats as long as its condition stays true. Use it when you do not know in advance how many passes you need:

```matlab
total = 0;
k = 0;
while total < 20
    k = k + 1;
    total = total + k^2;
end
% k = 4, total = 30
```

It adds $1 + 4 + 9 + 16 = 30$. After $k = 3$ the total was $14$, still under $20$, so one more pass ran. (Here `k^2` is fine without a dot: `k` is a single number.)

Two keywords steer any loop from inside:

- **`break`** leaves the loop immediately and carries on after its `end`.
- **`continue`** skips the rest of this pass and moves on to the next one.

MATLAB has no `do ... while` loop. When you want the body to run at least once and then test, write `while true` and put a `break` where the test belongs. The next example uses that pattern.

::: example A drop test, stepped in time
A sensor package is dropped from $100\,\mathrm{m}$ with no air resistance. Step the fall in time slices of $\Delta t = 0.1\,\mathrm{s}$ (read $\Delta t$ as "delta t", the time step) until it reaches the ground.

```matlab
dt = 0.1;  g = 9.80665;          % s, m/s^2
h = 100;  v = 0;  t = 0;         % m, m/s, s
while true
    v = v - g*dt;                % speed changes by -g each second
    h = h + v*dt;                % height changes by v each second
    t = t + dt;
    if h <= 0
        break                    % hit the ground: stop stepping
    end
end
fprintf("hit the ground at t = %.1f s, v = %.2f m/s\n", t, v);
% hit the ground at t = 4.5 s, v = -44.13 m/s
```

Each pass first updates the speed, then uses the new speed to update the height, then advances the clock. The `if` checks for the ground, and `break` ends the loop the moment it is reached.

Sanity check with the exact formulas for a free fall: $t = \sqrt{2h/g} = \sqrt{200/9.80665} \approx 4.52\,\mathrm{s}$ and $v = \sqrt{2gh} \approx 44.3\,\mathrm{m/s}$. The stepped answers, $4.5\,\mathrm{s}$ and $44.1\,\mathrm{m/s}$, are close. They are not exact because each step is a small approximation, and the last step overshoots slightly below the ground.
:::

::: example Skipping bad samples with continue
A temperature log has two bad readings: `NaN` (a "not a number" marker, meaning no value was recorded) and `-999`, a code the logger writes when a sensor drops out.

```matlab
temps = [21.5 NaN 22.1 -999 21.9];     % deg C
total = 0;  count = 0;
for k = 1:numel(temps)
    if isnan(temps(k)) || temps(k) < -100
        continue                       % skip this sample
    end
    total = total + temps(k);
    count = count + 1;
end
avg = total / count
% avg = 21.833
```

`isnan` asks whether a value is `NaN`. The `||` means that if the first test is true, the second is never checked. The three good readings average to $(21.5 + 22.1 + 21.9)/3 = 65.5/3 \approx 21.83\,^\circ\mathrm{C}$. Sanity check: the answer sits between the smallest and largest good readings, as an average must. With the `-999` left in, the average would have been hugely negative, which is how bad samples usually announce themselves.
:::

::: key
`if` / `elseif` / `else` / `end`; `switch` with `case` and `otherwise`, no fall-through; `for k = 1:n` runs `n` times; `while` repeats while its condition is true; `break` leaves the loop; `continue` skips to the next pass. Use `&&` and `||` for scalar conditions, `~=` for "not equal".
:::

## Growing an array: the slow way

Python programmers build lists with `append`. The MATLAB look-alike is to start with an empty array and write past its end:

```matlab
x = [];
for k = 1:n
    x(end+1) = sin(2*pi*t(k)) * exp(-0.1*t(k));   %#ok<AGROW>
end
```

`end+1` means "the slot just past the last one", so each pass makes `x` one element longer. It runs. It gives the right answer. And it can be ruinously slow.

Here is why. A MATLAB numeric array lives in **[[one unbroken block of memory|contiguous-memory]]**, the numbers side by side with no gaps. That layout is what makes whole-array math fast. But it means there is no room to add an element at the end: the memory just past the array may already belong to something else. So to grow the array, MATLAB may have to find a new, bigger block, copy every existing element across, and then free the old block. That is the bookshelf from the start of the lesson.

Count the copying. Growing to length 1 copies nothing, to length 2 copies 1 element, to length 3 copies 2, and so on. After $n$ passes the total is

$$
0 + 1 + 2 + \cdots + (n-1) = \frac{n(n-1)}{2} \approx \frac{n^2}{2}.
$$

The work grows like $n^2$, which is called **[[quadratic|quadratic-growth]]**. Double $n$ and the copying goes up four times. Multiply $n$ by 1000 and it goes up a million times. A preallocated loop, by contrast, does one allocation and $n$ writes: work that grows like $n$, called **linear**.

::: key
Each assignment may reallocate and copy the whole array, making the loop quadratic in the number of iterations. Preallocate with `zeros(1,n)` and index, or vectorise.
:::

The comment `%#ok<AGROW>` in the code above is worth reading. MATLAB's **[[Code Analyzer|code-analyzer]]**, which checks your code as you type in the Editor, underlines `x(end+1)` in a loop and warns that the variable appears to change size on every loop iteration. `AGROW` is the name of that warning, and `%#ok<AGROW>` tells the analyzer "I know, hide it". In the module's exercise it is there on purpose, to mark the bug you are about to fix. In your own code, treat the underline as a request to preallocate.

Recent MATLAB releases are cleverer about memory than older ones and can soften the cost of some growing patterns. You cannot count on that, it varies with the pattern, and growing a matrix by rows is still painful, as the next example shows. Write code that does not need the rescue.

::: example How bad is quadratic?
**Counting.** Growing to $n = 10^6$ elements one at a time, with a full copy each time, moves about

$$
\frac{n(n-1)}{2} = \frac{10^6 \cdot 999\,999}{2} \approx 5.0 \times 10^{11}
$$

numbers. Each `double` is 8 bytes, so that is about $4.0 \times 10^{12}$ bytes, four terabytes of memory traffic, to build an array that only occupies 8 megabytes.

**Measuring.** Here is a test that builds an $n$-by-3 log one row per pass, grown against preallocated, timed in GNU Octave on a four-core cloud machine:

```matlab
tic
X = zeros(0, 3);                       % grown
for k = 1:n
    X(end+1, :) = [k 2*k 3*k];         %#ok<AGROW>
end
tGrow = toc;

tic
Y = zeros(n, 3);                       % preallocated
for k = 1:n
    Y(k, :) = [k 2*k 3*k];
end
tPre = toc;
```

| n | grown (s) | preallocated (s) |
|---|---|---|
| 20 000 | 1.24 | 0.067 |
| 40 000 | 4.73 | 0.136 |
| 80 000 | 21.7 | 0.284 |

Read the columns. Each time $n$ doubles, the preallocated time roughly doubles ($0.067 \to 0.136 \to 0.284$): linear. The grown time goes up about four times or more ($1.24 \to 4.73 \to 21.7$): quadratic. At $80\,000$ rows the grown version is about $21.7 / 0.284 \approx 76$ times slower, and the gap keeps widening with $n$. The two results were checked to be identical, so the slowness bought nothing. MATLAB's exact timings differ from Octave's, but doubling tests like this are the reliable way to see the shape on your own machine.
:::

Growing by rows is worse than it looks because MATLAB stores a matrix in **[[column-major order|column-major]]**: all of column 1, then all of column 2, and so on. A new row has to slot one number into the middle of every column, so even a smart memory system must shuffle almost everything.

## Preallocate: make the shelf the right size first

The fix is to create the array at its final size before the loop, then fill it in by index. The `zeros` function from lesson 2 does it:

```matlab
y = zeros(1, n);                          % one allocation, all zeros
for k = 1:n
    y(k) = sin(2*pi*t(k)) * exp(-0.1*t(k));
end
```

Same loop, same answer, one allocation. Match the preallocation to what you will store:

- `zeros(1, n)` or `zeros(n, 3)` for numbers.
- `NaN(1, n)` when you want unfilled slots to stand out. A `NaN` left over at the end shows you a sample the loop never wrote, where a zero would hide it. The **[[NaN fill|nan-fill]]** is a favorite trick for exactly that reason.
- `false(1, n)` for a logical flag per sample.
- `cell(1, n)` for a cell array (lesson 7 covers cells).

When you do not know the final size, preallocate a safe upper bound and trim at the end:

```matlab
maxSteps = 1000;
h = NaN(1, maxSteps);  v = NaN(1, maxSteps);
h(1) = 100;  v(1) = 0;
for k = 2:maxSteps
    v(k) = v(k-1) - g*dt;
    h(k) = h(k-1) + v(k)*dt;
    if h(k) <= 0
        break
    end
end
h = h(1:k);  v = v(1:k);                  % keep only what was used
% 46 samples, last h = -1.50 m, v = -44.13 m/s
```

This is the drop test again, now keeping the whole history. After the `break`, `k` still holds the last index written, so `h(1:k)` trims the unused tail. Forty-six samples is the starting point plus 45 steps of $0.1\,\mathrm{s}$, matching the $4.5\,\mathrm{s}$ found before.

The third option is to remove the loop entirely. When each element depends only on its own inputs, one element-wise line computes them all:

```matlab
z = sin(2*pi*t) .* exp(-0.1*t);           % no loop at all
```

That is **[[vectorised|vectorisation]]** code, and it uses the dotted operators from lesson 4. Not every loop can be written this way: the drop test cannot, because each step needs the one before it. Lesson 13 covers vectorisation, `tic`/`toc` and the Profiler in depth, including when a preallocated loop is already fast enough.

::: warning Preallocate the right shape
`zeros(n)` with one argument makes an $n$-by-$n$ matrix, not a vector. For $n = 10^5$ that is $10^{10}$ numbers, 80 gigabytes, and MATLAB will refuse or grind to a halt. Always give both sizes: `zeros(1, n)` for a row, `zeros(n, 1)` for a column.
:::

## Check yourself

::: check
Translate this Python into MATLAB:

```python
for k in range(5):
    if k % 2 != 0:
        continue
    print(k)
```
:::

::: answer
```matlab
for k = 0:4
    if mod(k, 2) ~= 0
        continue
    end
    disp(k)
end
```

`range(5)` is 0 to 4, so the MATLAB range must be `0:4` to keep the same values (it still runs five times). `%` is the remainder operator in Python but starts a comment in MATLAB, so use `mod(k, 2)`. `!=` becomes `~=`. Both versions print 0, 2 and 4.
:::

::: check
`v = [2 0 5]`. Which branch does `if v` take, and what would you write to test "at least one element is zero"?
:::

::: answer
`if v` is true only when every element is nonzero. The middle element is 0, so it takes the `else` branch (or does nothing, if there is none). To test for at least one zero, write `if any(v == 0)`. Writing `all` or `any` makes the intent plain to the next reader.
:::

::: check
A loop grows an array one element at a time to $n = 50\,000$ elements, and each step copies the whole array. About how many element copies is that? How many does a preallocated loop do?
:::

::: answer
$\frac{n(n-1)}{2} = \frac{50\,000 \cdot 49\,999}{2} \approx 1.25 \times 10^9$ copies. The preallocated loop makes one allocation and writes each of the $50\,000$ elements once, with no copies of old data. That is about $25\,000$ times less data movement.
:::

::: check
A grown-array loop takes 3 seconds for $n = 100\,000$. Roughly how long would you expect for $n = 400\,000$, and why?
:::

::: answer
The copying grows like $n^2$. Four times as many elements means $4^2 = 16$ times the work, so about $3 \times 16 = 48$ seconds. A preallocated loop would take only about four times as long as it did at $100\,000$.
:::

::: check
Write a `switch` that sets `gain` to 2.0 for the mode `"hover"`, to 0.5 for `"cruise"` or `"descent"`, and raises an error for anything else. Why is the `otherwise` branch worth having?
:::

::: answer
```matlab
switch mode
    case "hover"
        gain = 2.0;
    case {"cruise", "descent"}
        gain = 0.5;
    otherwise
        error("unknown mode: %s", mode);
end
```

Without `otherwise`, a misspelled mode such as `"Hover"` would match nothing, and `gain` would keep an old value or never be set. The error turns a silent wrong gain into a loud failure you find in testing.
:::

## Summary

| Construct or idea | MATLAB form | Remember |
|---|---|---|
| choosing | `if` / `elseif` / `else` / `end` | `if` on an array means "all true"; use `all`, `any` |
| logic | `&&` (and), double bar (or), `~` (not), `~=` | short-circuit, scalars only; single `&` and bar are element-wise |
| many choices | `switch` / `case` / `otherwise` | first match only, no fall-through; `{a, b}` for "any of" |
| counted loop | `for k = 1:n` | walks columns; 1 to `n` inclusive |
| open-ended loop | `while cond` | no do-while: `while true` plus `break` |
| steering | `break`, `continue` | leave the loop; skip to the next pass |
| growing | `x(end+1) = v` in a loop | may copy everything each time: $n(n-1)/2$, quadratic |
| preallocating | `zeros(1,n)`, `NaN(1,n)`, `cell(1,n)` | one allocation, linear; trim if oversized |

The next lesson moves from plain numeric arrays to MATLAB's other containers, structs, cells, tables and strings, which you will want the moment your data has names and mixed types.

::: context short-circuit Stopping early on purpose
"Short-circuit" means the second half of a condition is skipped when the first half already decides it. In `a && b`, a false `a` means the whole thing is false whatever `b` says, so `b` never runs. That is not only faster. It lets you guard a risky test: `n > 0 && total/n > 5` never divides by zero, and `~isempty(x) && x(1) > 0` never indexes an empty array. Python's `and` and `or` behave the same way.
:::

::: context mode-sequencer A rocket's flight modes
Flight software runs in modes, and a sequencer decides when to move from one to the next. Each mode sets things like throttle and which control laws are active. A `switch` on the current mode is the simplest way to write the "what does each mode do" table.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="35" width="70" height="36" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">ascent</text>
  <rect x="100" y="35" width="70" height="36" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="135" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">coast</text>
  <rect x="190" y="35" width="76" height="36" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="228" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">separation</text>
  <rect x="286" y="35" width="64" height="36" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="318" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">safe</text>
  <line x1="80" y1="53" x2="96" y2="53" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="170" y1="53" x2="186" y2="53" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="266" y1="53" x2="282" y2="53" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">throttle 1.0</text>
  <text x="180" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">throttle 0.0</text>
  <text x="318" y="92" font-size="11" text-anchor="middle" fill="#b4232c">otherwise</text>
</svg>
```

The orange box is where an unknown mode should land: a safe state, never "keep doing whatever we were doing". The Simulink module builds real sequencers with Stateflow.
:::

::: context fall-through What C does instead
In C and C++, a `switch` jumps to the matching `case` and then keeps running straight down into the following cases until it meets a `break`. Forgetting one `break` is a classic bug, and some coding standards used in flight software require every case to end in one. MATLAB's designers left fall-through out, so each case is self-contained. When you move to C++ later in the track, this is the difference to remember.
:::

::: context contiguous-memory Side by side
Computer memory is one long numbered street of bytes. A `double` array of length $n$ takes $8n$ bytes in a row, with no gaps. The processor can then sweep through it very quickly, which is why array math is fast. The catch is that the neighbors are fixed: if the next house down the street is already taken, the array cannot grow in place and has to move to a bigger empty lot.
:::

::: context quadratic-growth Why the triangle is the problem
Picture each pass of the growing loop as a bar whose length is the number of elements it copies. The bars get longer by one each time, so together they fill a triangle with an area of about half of $n \times n$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="330" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#6c7a93" stroke-width="1"/>
  <rect x="44" y="130" width="26" height="10" fill="#b4232c"/>
  <rect x="74" y="120" width="26" height="20" fill="#b4232c"/>
  <rect x="104" y="110" width="26" height="30" fill="#b4232c"/>
  <rect x="134" y="100" width="26" height="40" fill="#b4232c"/>
  <rect x="164" y="90" width="26" height="50" fill="#b4232c"/>
  <rect x="194" y="80" width="26" height="60" fill="#b4232c"/>
  <rect x="224" y="70" width="26" height="70" fill="#b4232c"/>
  <rect x="254" y="60" width="26" height="80" fill="#b4232c"/>
  <rect x="284" y="50" width="26" height="90" fill="#b4232c"/>
  <text x="185" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">pass 2, 3, 4, ... 10</text>
  <text x="60" y="30" font-size="11" fill="#1f2a44">elements copied on each pass</text>
  <text x="150" y="60" font-size="11" fill="#1f2a44">total 1 + 2 + ... + 9 = 45</text>
</svg>
```

For ten passes that is $45 = 10 \cdot 9 / 2$ copies. A preallocated loop is a single row of ten writes. Double the passes and the triangle's area goes up four times.
:::

::: context code-analyzer The orange underlines
The Code Analyzer reads your code in the Editor and marks likely problems: unused variables, missing semicolons, arrays that grow in a loop. Hovering over a mark shows the message, and many have a one-click fix. You can run the same checks from the command line with `checkcode`. Teams often require zero unexplained warnings before a script is merged, which is why the `%#ok<...>` comment exists: it records that a person looked and decided.
:::

::: context column-major Down the columns first
MATLAB, like Fortran before it, stores a matrix column by column. A 3-by-2 matrix with rows $(1, 2)$, $(3, 4)$, $(5, 6)$ sits in memory as $1, 3, 5, 2, 4, 6$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="30" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="50" y="15" width="30" height="25" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="20" y="40" width="30" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="50" y="40" width="30" height="25" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="20" y="65" width="30" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="50" y="65" width="30" height="25" fill="#f2b880" stroke="#1f2a44"/>
  <text x="35" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="65" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="35" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="65" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="35" y="82" font-size="12" text-anchor="middle" fill="#1f2a44">5</text>
  <text x="65" y="82" font-size="12" text-anchor="middle" fill="#1f2a44">6</text>
  <text x="105" y="57" font-size="16" fill="#1f2a44">→</text>
  <rect x="140" y="40" width="30" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="170" y="40" width="30" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="200" y="40" width="30" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="230" y="40" width="30" height="25" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="260" y="40" width="30" height="25" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="290" y="40" width="30" height="25" fill="#f2b880" stroke="#1f2a44"/>
  <text x="155" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="185" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="215" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">5</text>
  <text x="245" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="275" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="305" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">6</text>
  <text x="230" y="90" font-size="11" text-anchor="middle" fill="#6c7a93">a new row must squeeze into both columns</text>
</svg>
```

Adding a fourth row means inserting one number after the 5 and one after the 6, so everything after the first insertion shifts. NumPy's default is the opposite, row by row.
:::

::: context nan-fill A marker that cannot hide
`NaN` is a special floating-point value meaning "not a number". Any arithmetic with it gives `NaN` again, and plots leave a gap where it sits. So an array preallocated with `NaN` shows you, loudly, any slot your loop forgot to fill, where a zero would look like a real reading. Telemetry tools use the same idea to mark dropouts.
:::

::: context vectorisation One line instead of a loop
Vectorised code hands a whole array to one operation instead of visiting elements one at a time. The work still happens element by element, but inside MATLAB's compiled libraries rather than through the language's loop machinery. It is often shorter and closer to the maths on paper too. Lesson 13 measures when it pays and when a preallocated loop is already fine.
:::
