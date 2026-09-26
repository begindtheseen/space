---
id: l03-indexing
title: Reaching inside a matrix
minutes: 19
covers:
  - One-based indexing, end, logical indexing, find
---

Think of the seats in a movie theater. Your ticket says "row F, seat 12", and you walk straight there. You do not count every seat from the door. And when a friend texts "save me the last seat in the back row", you know exactly which one, however big the theater is.

The last lesson built matrices. This one is about reaching inside them: picking out one number, a whole row, a column, a few chosen rows, or every number that passes a test. Doing this is called **indexing**, and an **index** is the position number you ask for — the seat number on the ticket.

GNC code indexes all day. "The last attitude sample before engine cutoff." "The pitch column of the gyro data." "Every sample where the altitude was above 10 km." "The first time the tracking error dropped below one degree." Each of those is one line of MATLAB once you know the four tools in this lesson: one-based indexing, the keyword `end`, logical indexing, and `find`.

## Counting starts at one

In Python the first element of a list is `x[0]`. In MATLAB the first element of a vector is `v(1)`. MATLAB uses **[[one-based indexing|why-one-based]]**: positions are counted 1, 2, 3, the way people count seats, pages and floors. Python uses **zero-based indexing**, counting 0, 1, 2.

Notice the other change: MATLAB indexes with **round brackets** (parentheses), not square ones. Square brackets build matrices; round brackets reach into them.

```matlab
v = [10 20 30 40 50];
v(1)          % first element
% ans = 10
v(3)          % third element
% ans = 30
```

There is no element zero. `v(0)` is an error, and MATLAB tells you that array indices must be positive integers or logical values. Asking for `v(6)` in this 5-element vector is also an error: the index exceeds the number of elements. MATLAB never wraps around, and negative indices do not count from the back as they do in Python — `v(-1)` is an error too.

### end means "the last one"

Inside an index, the keyword **`end`** stands for the last position in that direction — one of **[[two jobs the word does|end-keyword]]**. You can do arithmetic with it.

```matlab
v(end)        % the last element
% ans = 50
v(end-1)      % one before the last
% ans = 40
```

So `v(end)` is Python's `v[-1]`, and `v(end-1)` is Python's `v[-2]`. The advantage over typing the number is that `end` is always right, however long the vector grows. A log that had 5000 samples yesterday and has 7213 today still ends at `end`.

### Ranges pick several elements, and include both ends

Put a range from the colon operator inside the brackets, and you get several elements at once:

```matlab
v(2:4)        % elements 2, 3 and 4
% ans =
%     20    30    40
v(end-2:end)  % the last three
% ans =
%     30    40    50
v(end:-1:1)   % all of them, backwards
% ans =
%     50    40    30    20    10
```

The range `2:4` includes both ends, as you saw in lesson 2, so it picks three elements. The **[[Python slice that picks the same three|python-slice-picture]]** is `v[1:4]`. Its start number is one lower, because Python counts from zero. Its stop number is the same, 4, because Python leaves out the stop while MATLAB includes it, and the two differences cancel. So the start changes and the stop does not — exactly the kind of half-rule that lets translation bugs in.

A vector of positions works too, in any order: `v([1 3 5])` gives `10 30 50`, and `v([5 1])` gives `50 10`.

::: key
MATLAB is one-based: the first element is `v(1)`. Ranges are inclusive on both ends (`1:5` is five elements), `end` means the last index, and a translated Python loop is off by one unless you adjust. Index-derived time offsets are a common translation bug.
:::

### Translating a loop from Python

Here is the same loop in both languages, visiting every sample of a vector with `n` elements:

```python
for i in range(n):          # i = 0, 1, ..., n-1
    t = i * dt              # time of sample i
```

```matlab
for k = 1:n                 % k = 1, 2, ..., n
    t = (k - 1) * dt;       % time of sample k
end
```

The loop limits change from `range(n)` to `1:n`. That part is easy to remember. The part people miss is the arithmetic *inside* the loop. In Python the first sample sits at index 0 and at time 0, so time is `i * dt`. In MATLAB the first sample sits at index 1 and still at time 0, so time is `(k - 1) * dt`. Copy `i * dt` across as `k * dt` and every time stamp is **[[one sample late|stale-offset]]**. Lesson 6 covers loops fully; the indexing rule is what matters here.

::: example The time an altitude was first crossed
A small test rocket's altitude is logged once per second ($dt = 1\,\mathrm{s}$), starting at $t = 0$. It climbs with a steady acceleration, so its altitude in meters is $10t^2$:

```matlab
dt = 1;
alt = [0 10 40 90 160 250 360 490 640 810 1000 1210];
```

When is it first above $500\,\mathrm{m}$? `find`, which we meet properly later in this lesson, gives the position of the first element that passes a test:

```matlab
k = find(alt > 500, 1)
% k = 9
t_cross = (k - 1) * dt
% t_cross = 8
```

Step by step: the ninth element is $640$, the first one above $500$ (the eighth is $490$). It is element number 9, but the first element was at $t = 0$, so element 9 is at $t = (9 - 1) \times 1 = 8\,\mathrm{s}$.

Sanity check with the formula: $10 \times 8^2 = 640\,\mathrm{m}$. Yes. The translation bug would report `k * dt`, $9\,\mathrm{s}$, and $10 \times 9^2 = 810\,\mathrm{m}$ — the wrong sample. The safest fix is to build the time vector once, `t = (0:numel(alt)-1) * dt`, and then read `t(k)` with the same index as the data, so the offset lives in one place.
:::

## Two indices for a matrix

A matrix needs two numbers to find an element: the row and the column, in that order, with a comma between. `M(r, c)` reads "M at row r, column c" — the theater ticket again.

```matlab
M = [1 2 3; 4 5 6; 7 8 9; 10 11 12];   % 4-by-3
M(2, 3)        % row 2, column 3
% ans = 6
M(end, end)    % bottom-right corner
% ans = 12
```

Each of the two positions can be a single number, a range, a list of numbers, or `end`. And a colon on its own, `:`, means **all of them** in that direction. Read `M(3, :)` as "row 3, every column".

```matlab
M(3, :)        % the whole third row
% ans =
%      7     8     9
M(:, 2)        % the whole second column
% ans =
%      2
%      5
%      8
%     11
```

To pick several rows, give a list of row numbers in the first slot. To keep every column, put the colon in the second:

```matlab
M([1 3], :)    % rows 1 and 3, all columns
% ans =
%      1     2     3
%      7     8     9
M(:, [1 end])  % all rows, first and last columns
% ans =
%      1     3
%      4     6
%      7     9
%     10    12
```

This is how you slice real data. With an N-by-3 gyro matrix `w` (one row per sample, columns for roll, pitch and yaw rate), `w(:, 2)` is the whole pitch-rate history, `w(1:100, :)` is the first hundred samples of all three axes, and `w(end, :)` is the latest reading.

Indexing also works on the left of an equals sign, to change elements in place. `M(2, 3) = 0` sets one element. Assigning the empty matrix deletes: `M(2, :) = []` removes the second row, leaving a 3-by-3.

::: warning Round brackets, and a comma between the positions
Each piece of `M(r, c)` matters. Square brackets `M[2, 3]` are a syntax error. Curly braces `M{2, 3}` are for a different container, the cell array, covered in lesson 7; on an ordinary matrix they give an error. And a third number, `M(2, 3, 1)`, asks for a third dimension — legal, but not rows and columns. When a line indexes a matrix, the pattern is always round brackets and two positions: rows, comma, columns.
:::

### One index into a matrix: linear indexing

What if you give a matrix only one index? MATLAB does not complain. It counts through the elements **column by column** — the column-major order from lesson 2 — and returns the element at that count. This is **linear indexing**.

For our 4-by-3 `M`, the count goes down the first column (1, 4, 7, 10), then the second (2, 5, 8, 11), then the third:

```matlab
M(5)           % 5th in column order: top of column 2
% ans = 2
M(2:4)         % 2nd, 3rd and 4th in column order
% ans =
%      4     7    10
```

`M(2:4)` is not "rows 2 to 4". It is three single elements counted down the first column. `M(:)` uses the same idea: it lists every element, in column order, as one tall column vector — a common way to flatten a matrix.

Two functions convert between the two ways of pointing. `sub2ind(size(M), 3, 2)` turns row 3, column 2 into linear index 7, and `ind2sub` goes back. The rule behind them, for a matrix with $m$ rows, is

$$
\text{linear index} = (c - 1)\,m + r.
$$

For row 3, column 2 of a 4-row matrix: $(2 - 1) \times 4 + 3 = 7$. Check: `M(7)` is 8, and so is `M(3, 2)`.

::: warning One index and two indices are different questions
`M(2, 4)` asks for row 2, column 4 (an error here, since `M` has only 3 columns). `M(2:4)` asks for three elements by linear index. `M([2 4], :)` asks for two whole rows. They look alike and mean completely different things. If you meant rows, the comma and the second position must be there.
:::

## Logical indexing: pick by a test, not by position

So far you have chosen elements by where they are. Often you want to choose them by what they are: every negative reading, every sample above an altitude, every temperature out of limits. That is **logical indexing**.

It works in two steps. First, compare the whole vector against a condition. MATLAB tests every element and returns a **[[logical|logical-class]]** array — same shape, holding `1` (true) where the test passed and `0` (false) where it failed. Read `1` as "yes" and `0` as "no".

```matlab
v = [4 -2 7 0 -5 3];
mask = v > 0
% mask =
%   1x6 logical array
%    1   0   1   0   0   1
```

An array of true and false values used this way is often called a **[[mask|mask-picture]]**, like a stencil that lets paint through some holes and not others. Second, index with the mask. MATLAB keeps the elements where the mask is true:

```matlab
v(mask)
% ans =
%      4     7     3
v(v > 0)       % the same, in one line
```

You can combine tests element by element with `&` (and), `|` (or) and `~` (not):

```matlab
v(v > 0 & v < 5)      % positive and below 5
% ans =
%      4     3
v(~(v > 0))           % not positive
% ans =
%     -2     0    -5
```

(You may also see `&&` and `||`. Those are for single true-or-false values in `if` statements, lesson 6; for whole arrays use `&` and `|`.)

Masks work on the left of an equals sign too. `v(v < 0) = 0` sets every negative element to zero and leaves the rest alone — clipping, in one line, with no loop. And because true counts as 1, `nnz(v > 0)` ("number of nonzeros") or `sum(v > 0)` counts how many elements passed: here, 3.

::: warning A mask must be logical, not ones and zeros you typed
`v([1 0 1 0 0 1])` is not a mask. It is a list of positions, and position 0 does not exist, so it is an error. A mask has to be of class `logical`, which is what comparisons like `v > 0` produce. If you really have a double vector of ones and zeros, convert it with `logical(...)` first.
:::

::: key
A comparison like `v > 0` returns a logical array of the same shape. Indexing with it, `v(v > 0)`, keeps the elements where it is true. Combine tests with `&`, `|` and `~`; assign through a mask with `v(mask) = value`; count passes with `nnz(mask)`.
:::

## find: where did it happen?

A mask tells you *which* elements pass. Sometimes you need *where* they are: the sample number, so you can look up its time, or the first moment something happened. **`find`** returns the positions of the true (nonzero) elements.

```matlab
v = [4 -2 7 0 -5 3];
find(v > 0)            % positions of all positive elements
% ans =
%      1     3     6
find(v > 0, 1)         % only the first one
% ans = 1
find(v > 0, 1, 'last') % only the last one
% ans = 6
find(v > 100)          % none pass
% ans =
%   1x0 empty double row vector
```

The second argument caps how many positions you get back, and `'last'` searches from the end. When nothing passes, the answer is **[[empty rather than an error|find-empty]]**, so check it with `isempty` before you use it.

On a matrix, `find` with one output returns linear indices, counting down columns. Ask for two outputs, `[r, c] = find(M > 8)`, and you get the row and column of each match instead.

When should you use a mask and when `find`? If you only want the values, or want to change them, use the mask directly: `v(v > 0)` is shorter and usually faster than `v(find(v > 0))`, which does the same thing with an extra step. Use `find` when you need the **position** itself — to compute a time, to look up the same sample in another array, or to get only the first or last match.

::: example Throwing out saturated accelerometer samples
An accelerometer can measure up to $\pm 16\,g$ (sixteen times Earth's gravity). During a short drop test its vertical axis logs these values in $g$:

```matlab
az = [1.00 1.02 16.00 0.99 -16.00 1.01 1.00 16.00];
```

A reading stuck at exactly the limit is **[[saturated|saturation-real]]**: the true value was at least that big, but the sensor could not report more, so the number is not trustworthy. Find them, count them, and average the rest.

Step 1. Build the mask. `abs` takes the size and drops the sign, so one test covers both limits:

```matlab
sat = abs(az) >= 16;
nnz(sat)
% ans = 3
```

Step 2. Where were they? These positions go into the test report:

```matlab
find(sat)
% ans =
%      3     5     8
```

Step 3. Keep the good samples with the opposite mask and average them:

```matlab
good = az(~sat);
mean(good)
% ans = 1.0040
```

The arithmetic: the five good values sum to $1.00 + 1.02 + 0.99 + 1.01 + 1.00 = 5.02$, and $5.02 / 5 = 1.004$. Sanity check: a sensor sitting still reads about $1\,g$, and the good samples do. Averaging all eight instead would give $(5.02 + 16 - 16 + 16)/8 = 21.02/8 \approx 2.63\,g$, a nonsense value dragged up by one extra saturated sample.
:::

## Check yourself

::: check
`x = [3 8 1 9 4 7]`. Write down what each of these gives: (a) `x(2)` (b) `x(end)` (c) `x(end-2:end)` (d) `x([6 1])` (e) `x(2:2:end)`
:::

::: answer
(a) `8`, the second element — counting from 1.

(b) `7`, the last element.

(c) `end` is 6, so this is `x(4:6)`, three elements: `9 4 7`.

(d) Element 6 then element 1: `7 3`. A list of positions can be in any order.

(e) `2:2:6` is positions 2, 4 and 6, giving `8 9 7`.
:::

::: check
A Python script has `samples[10:20]`. Which samples does that select, and what is the MATLAB equivalent?
:::

::: answer
The Python slice starts at index 10 and stops before 20, so it takes indices 10 through 19: ten samples. In counting-from-one terms, those are the 11th through 20th samples.

In MATLAB, the 11th through 20th samples are `samples(11:20)`. Check: `11:20` has $20 - 11 + 1 = 10$ elements, the same ten. The start moved up by one; the stop number did not change, because MATLAB includes the stop and Python does not.
:::

::: check
`G` is a 500-by-6 matrix of IMU data: columns 1 to 3 are accelerometer axes and 4 to 6 are gyro axes, one row per sample. Write expressions for (a) all gyro data, (b) the last 50 samples of everything, (c) samples 1, 101, 201, … of the first accelerometer axis, and (d) the second and fifth columns for every sample.
:::

::: answer
(a) `G(:, 4:6)` — every row, columns 4 to 6.

(b) `G(end-49:end, :)` — the range `end-49:end` has 50 rows, the last of which is `end`. Writing `end-50` would give 51.

(c) `G(1:100:end, 1)` — start at 1, step 100, go as far as the data allows, first column only.

(d) `G(:, [2 5])` — a list of column numbers in the second slot, a colon in the first.
:::

::: check
`A = [2 4 6; 8 10 12]`. What do `A(4)` and `A(:)'` give? Why does `A(4)` not give an error, even though `A` has only three columns?
:::

::: answer
With one index, MATLAB counts down the columns: `2, 8` (column 1), `4, 10` (column 2), `6, 12` (column 3). So `A(4)` is the fourth in that order, `10`, and `A(:)'` is the row `2 8 4 10 6 12`.

It is not an error because a single index is a linear index into all six elements, not a column number. `A(1, 4)` would be an error: there is no column 4.
:::

::: check
`err` is a vector of attitude errors in degrees, logged at $50\,\mathrm{Hz}$ starting at $t = 0$. Write MATLAB that (a) sets every error larger than $5$ degrees in size to `NaN` (not-a-number, a marker for "bad value"), and (b) finds the time at which the size of the error first drops below $0.5$ degrees. What should the code do if it never does?
:::

::: answer
(a) `err(abs(err) > 5) = NaN;` — the mask picks the elements, and assigning through it changes only those.

(b)

```matlab
k = find(abs(err) < 0.5, 1);
if isempty(k)
    disp("error never settled below 0.5 deg")
else
    t_settle = (k - 1) / 50;   % seconds; sample 1 is at t = 0
end
```

The sample spacing is $1/50 = 0.02\,\mathrm{s}$, and the first sample is at time zero, so sample `k` is at $(k - 1)/50$ seconds. If no element passes, `find` returns an empty result, and using it in arithmetic would silently give an empty time, so the code checks `isempty` first.
:::

## Summary

| Idea | MATLAB | Notes |
| --- | --- | --- |
| First element | `v(1)` | one-based; `v(0)` and negative indices are errors |
| Last element | `v(end)`, `v(end-1)` | `end` is the last index in that direction |
| Range of elements | `v(2:4)` | inclusive: three elements |
| Loop translation | `range(n)` becomes `1:n` | time of sample `k` is `(k-1)*dt` |
| Matrix element | `M(r, c)` | row first, then column |
| Whole row or column | `M(r, :)`, `M(:, c)` | a lone colon means "all" |
| Several rows | `M([1 3], :)` | a list of rows, all columns |
| Linear indexing | `M(k)`, `M(:)` | counts down columns; $(c-1)m + r$ |
| Delete | `M(2, :) = []` | removes a row |
| Logical indexing | `v(v > 0)`, `v(mask) = 0` | mask must be `logical`; combine with and, or, not |
| Count passes | `nnz(mask)` | true counts as 1 |
| Positions | `find(mask)`, `find(mask, 1)` | empty if none; `'last'` searches from the end |

Next lesson: now that you can build matrices and reach inside them, lesson 4 does arithmetic on them — and meets the single most common MATLAB beginner error, the difference between `A*B` and `A.*B`.

::: context why-one-based Why MATLAB counts from one
MATLAB was built for mathematicians, and mathematics writes the first entry of a vector as $x_1$ and the top-left entry of a matrix as $a_{11}$. Fortran, the language MATLAB grew out of, counts from one for the same reason. Languages descended from C, including Python, count from zero, because there an index means "how many steps from the start of memory". Neither is wrong. What hurts is moving code between the two without adjusting, which is why this lesson keeps returning to it.
:::

::: context end-keyword Two meanings of one word
`end` does two jobs in MATLAB. Inside an index it means "the last position". On a line of its own it closes a block — the end of a `for` loop, an `if` or a function, where Python would use indentation. MATLAB tells them apart by where the word sits. Inside `M(end, 2)` the `end` refers to the rows, because it is in the row slot; in `M(2, end)` it refers to the columns. So `end` always means "the last one in this direction".
:::

::: context python-slice-picture Python slices and MATLAB ranges, lined up
The same three samples, pointed at two ways. Python numbers the elements from 0 and stops before the stop number. MATLAB labels the elements themselves starting from 1 and includes both ends.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <rect x="30" y="50" width="60" height="36" fill="#ffffff" stroke="#1f2a44"/><text x="60" y="73">10</text>
    <rect x="90" y="50" width="60" height="36" fill="#8fb8f0" stroke="#1f2a44"/><text x="120" y="73">20</text>
    <rect x="150" y="50" width="60" height="36" fill="#8fb8f0" stroke="#1f2a44"/><text x="180" y="73">30</text>
    <rect x="210" y="50" width="60" height="36" fill="#8fb8f0" stroke="#1f2a44"/><text x="240" y="73">40</text>
    <rect x="270" y="50" width="60" height="36" fill="#ffffff" stroke="#1f2a44"/><text x="300" y="73">50</text>
  </g>
  <text x="8" y="34" font-size="11" fill="#b4232c">Python</text>
  <g font-size="12" fill="#b4232c" text-anchor="middle">
    <text x="60" y="34">0</text><text x="120" y="34">1</text><text x="180" y="34">2</text><text x="240" y="34">3</text><text x="300" y="34">4</text>
  </g>
  <text x="8" y="108" font-size="11" fill="#1d6fd1">MATLAB</text>
  <g font-size="12" fill="#1d6fd1" text-anchor="middle">
    <text x="60" y="108">1</text><text x="120" y="108">2</text><text x="180" y="108">3</text><text x="240" y="108">4</text><text x="300" y="108">5</text>
  </g>
  <text x="180" y="134" font-size="12" fill="#1f2a44" text-anchor="middle">Python v[1:4] and MATLAB v(2:4) pick the same three</text>
</svg>
```
:::

::: context stale-offset How an off-by-one time stamp hides
An index-derived time offset bug rarely crashes anything. Every value is plausible, and every plot looks right — only shifted by one sample. At 1 kHz that is a millisecond, invisible on a plot of a ten-second flight. It shows up when two data streams are compared: the controller's command seems to arrive one sample after the response it caused, and a reviewer starts looking for a delay in the hardware that is really a line of translated Python. Building one time vector and indexing it with the same `k` as the data keeps this from happening.
:::

::: context logical-class A type of its own
Comparison results are not doubles. They belong to the class `logical`, which holds only true and false and uses one byte per element instead of eight. `true` and `false` are also functions that build them: `false(1, 100)` is a row of 100 falses, useful as an empty mask you then fill in. When logicals meet arithmetic they act as 1 and 0, which is why `sum(mask)` counts the passes and `mean(mask)` gives the fraction that passed — $0.375$ for three passes out of eight, for example.
:::

::: context mask-picture A mask is a stencil
Line the mask up under the data. Where the mask says 1, the value passes through; where it says 0, it is blocked. The result is shorter than the original — only the values that passed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="6" y="36" font-size="11" fill="#1f2a44">v</text>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <rect x="60" y="16" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="80" y="36">4</text>
    <rect x="100" y="16" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="120" y="36">-2</text>
    <rect x="140" y="16" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="160" y="36">7</text>
    <rect x="180" y="16" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="200" y="36">0</text>
    <rect x="220" y="16" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="240" y="36">-5</text>
    <rect x="260" y="16" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="280" y="36">3</text>
  </g>
  <text x="6" y="80" font-size="11" fill="#1f2a44">v &gt; 0</text>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <rect x="60" y="60" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="80" y="80">1</text>
    <rect x="100" y="60" width="40" height="30" fill="#6c7a93" stroke="#1f2a44"/><text x="120" y="80" fill="#ffffff">0</text>
    <rect x="140" y="60" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="160" y="80">1</text>
    <rect x="180" y="60" width="40" height="30" fill="#6c7a93" stroke="#1f2a44"/><text x="200" y="80" fill="#ffffff">0</text>
    <rect x="220" y="60" width="40" height="30" fill="#6c7a93" stroke="#1f2a44"/><text x="240" y="80" fill="#ffffff">0</text>
    <rect x="260" y="60" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="280" y="80">1</text>
  </g>
  <text x="6" y="130" font-size="11" fill="#1f2a44">v(v &gt; 0)</text>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <rect x="120" y="110" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="140" y="130">4</text>
    <rect x="160" y="110" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="180" y="130">7</text>
    <rect x="200" y="110" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="220" y="130">3</text>
  </g>
</svg>
```
:::

::: context find-empty When find finds nothing
An empty result is MATLAB's honest answer to "where?" when the answer is "nowhere". The danger is that empty results travel quietly: `(k - 1) * dt` with an empty `k` is empty, a plot of it shows nothing, and a later comparison with it may behave in ways you did not intend. Testing `isempty(k)` right after `find` and deciding what "never happened" should mean — report it, flag the test as failed, use a default — turns a silent gap into a visible decision. Lesson 11 shows more systematic ways to check a function's inputs and outputs.
:::

::: context saturation-real Saturation on real vehicles
Every sensor has a measuring range, and a reading pinned at its edge means "at least this much". Designers pick the range as a trade: a wider range survives shocks like stage separation or landing, but spreads the same number of digital steps over more g, so each step is coarser. Flight software usually flags saturated samples rather than trusting them, and post-flight analysis masks them out exactly as in the example. It matters: in 2016 ESA's Schiaparelli lander crashed on Mars partly because its inertial measurement unit saturated during parachute opening for longer than the software expected, corrupting the attitude estimate.
:::
