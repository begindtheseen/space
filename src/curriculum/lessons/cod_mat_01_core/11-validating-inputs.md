---
id: l11-validating-inputs
title: Checking what goes into a function
minutes: 23
covers:
  - nargin, nargout, varargin; arguments blocks and validateattributes
---

At an airport, your suitcase gets weighed and scanned at the check-in desk, before it goes anywhere near the plane. If it is too heavy, you find out right there, with the bag in front of you, and fixing it takes a minute. Nobody wants to find out over the ocean that a bag was the problem.

A function should treat its inputs the same way. Check them at the door, the moment the function starts, and refuse anything wrong with a clear message. If a bad input slips through, the error shows up much later, deep inside some other calculation, with a message that points at the wrong line. Or worse, there is no error at all and the answer is quietly wrong. The loss of the **[[Mars Climate Orbiter|mars-climate-orbiter]]** in 1999 came down to numbers in the wrong units passing between two pieces of software that never checked.

The last lesson showed the kinds of functions MATLAB has and how to pass them around. This lesson makes them defend themselves. First you will learn to count what the caller passed (`nargin`, `nargout`) and to accept a variable number of inputs (`varargin`). Then you will learn the two tools that do the checking: the older `validateattributes`, and the modern **arguments block**, which is how MathWorks writes its own toolbox functions today.

## Counting inputs and outputs

In Python you give a parameter a default right in the `def` line. Classic MATLAB has no such syntax. Instead, every function can ask how many inputs the caller actually passed.

**`nargin`**, read "n-arg-in", is the **number of input arguments** the caller passed to this call. **`nargout`**, read "n-arg-out", is the **number of output arguments** the caller asked for. Both are ordinary numbers you can test with `if`.

A function can be called with *fewer* inputs than it declares. The missing ones do not exist in its workspace, and touching one is an error. So the classic default-value pattern is:

```matlab
% thrustToWeight.m
function tw = thrustToWeight(thrust, mass, g)
    % Thrust-to-weight ratio. g defaults to standard gravity.
    narginchk(2, 3);          % need 2 or 3 inputs, else a clear error
    if nargin < 3
        g = 9.80665;          % m/s^2
    end
    tw = thrust / (mass * g);
end
```

`narginchk(2, 3)` stops the function with "Not enough input arguments" or "Too many input arguments" if the caller passed fewer than 2 or more than 3. Then `if nargin < 3` fills in the missing `g`.

::: example Thrust-to-weight on Earth and on the Moon
A launch vehicle's engines push with $7.607\,\mathrm{MN}$ (meganewtons, millions of newtons) and the vehicle has mass $549\,\mathrm{t}$. The **thrust-to-weight ratio** is thrust divided by weight, and weight is mass times gravity.

```matlab
thrustToWeight(7.607e6, 549e3)          % Earth, default g
% ans = 1.4129
thrustToWeight(7.607e6, 549e3, 1.62)    % Moon, g = 1.62 m/s^2
% ans = 8.5531
```

**Step 1.** The first call passes two inputs, so `nargin` is 2 and the function sets `g = 9.80665`.

**Step 2.** Weight is $549\,000 \times 9.80665 \approx 5.384 \times 10^6\,\mathrm{N}$, and $7.607 \times 10^6 / 5.384 \times 10^6 \approx 1.41$.

**Step 3.** The second call passes three inputs, so `nargin` is 3 and the `if` is skipped. The Moon's weaker gravity gives $7.607 \times 10^6 / (549\,000 \times 1.62) \approx 8.55$.

**Sanity check.** Lunar gravity is about a sixth of Earth's ($1.62/9.81 \approx 0.165$), so the ratio should be about six times bigger: $1.41 / 0.165 \approx 8.55$. It is.
:::

### Asking how many outputs are wanted

A MATLAB function can return several outputs, as in `[r, peak] = f(x)`. The caller does not have to take them all. `nargout` tells the function how many were asked for, so it can skip work nobody wants.

Here is a function that returns the **[[RMS|rms-picture]]** of each column of a matrix, and the peak value only if asked. The **RMS**, short for *root mean square*, is a single number for "how big is this wobbling signal": square every sample, take the mean, then take the square root.

$$
\mathrm{RMS} = \sqrt{\frac{1}{N}\sum_{k=1}^{N} x_k^2}
$$

Read it as "the square root of the average of the squares". Here $N$ is the number of samples and $x_k$ ("x sub k") is the $k$-th one. Squaring makes every sample positive, so a signal that swings from $-0.4$ to $+0.4$ does not average out to zero.

```matlab
% axisStats.m
function [r, peak] = axisStats(x)
    r = sqrt(mean(x.^2, 1));          % RMS of each column
    if nargout > 1
        peak = max(abs(x), [], 1);    % only when the caller asks
    end
end
```

The `1` in `mean(x.^2, 1)` says "work down dimension 1", which means down each column, giving one answer per column. The `[]` in `max(abs(x), [], 1)` is a placeholder for an unused second input; `max` then also works down the columns.

::: example RMS of a vibration trace
An accelerometer on a test stand records four samples in one axis: $0.2$, $-0.4$, $0.4$, $-0.2$ (in units of $g$).

```matlab
x = [0.2; -0.4; 0.4; -0.2];
r = axisStats(x)
% r = 0.3162
[r, p] = axisStats([0.2 1; -0.4 -3])
% r = 0.3162    2.2361
% p = 0.4000    3.0000
```

**Step 1.** Square each sample: $0.04$, $0.16$, $0.16$, $0.04$. All positive now.

**Step 2.** Mean: $(0.04 + 0.16 + 0.16 + 0.04)/4 = 0.40/4 = 0.1$.

**Step 3.** Square root: $\sqrt{0.1} \approx 0.316$.

**Step 4.** In the second call there are two columns. The second column is $1$ and $-3$: $\sqrt{(1 + 9)/2} = \sqrt{5} \approx 2.236$. Because the caller asked for two outputs, `nargout` is 2 and the peaks are computed too.

**Sanity check.** The RMS, $0.316$, sits between the smallest size $0.2$ and the largest $0.4$, as an "average size" should. The plain mean of the samples is $0$, which is why RMS exists.
:::

::: warning Every output must be set
If the caller asks for an output and the function never assigns it, MATLAB stops with an error saying the output was not assigned. The `if nargout > 1` guard is safe only because a caller who asks for `peak` makes `nargout` 2, and then `peak` is set.
:::

## Any number of inputs: varargin

Sometimes you don't know how many inputs are coming. `fprintf` is like that: one format string, then any number of values. You can write the same kind of function with **`varargin`**, short for "variable-length argument input list". Put `varargin` last in the input list and MATLAB packs every extra input into a **cell array** with that name. `numel(varargin)` is how many extras arrived, and `varargin{1}` is the first one.

```matlab
% logLine.m
function logLine(fmt, varargin)
    fprintf("[%d extra] ", numel(varargin));
    fprintf(fmt, varargin{:});      % unpack the extras into fprintf
    fprintf("\n");
end
```

```matlab
logLine("mass %.1f kg, dv %.0f m/s", 1250.5, 3200)
% [2 extra] mass 1250.5 kg, dv 3200 m/s
logLine("liftoff")
% [0 extra] liftoff
```

The expression `varargin{:}`, with curly braces and a colon, turns the cell array back into a **[[comma-separated list|comma-list]]**: it is as if you had typed `1250.5, 3200` into the call yourself. It is the MATLAB twin of Python's `*args` unpacking. The output side has a twin, **`varargout`**, a cell array you fill with as many outputs as `nargout` asks for.

Before arguments blocks arrived in R2019b, `varargin` was also how MATLAB functions took **name-value options** — pairs like `"Gain", 2` that name the setting and then give its value. You wrote the parsing loop yourself:

```matlab
% scaleData.m (the old way)
function out = scaleData(x, varargin)
    gain = 1;                          % defaults
    offset = 0;
    for k = 1:2:numel(varargin)        % step through name, value, name, value
        switch lower(varargin{k})
            case "gain"
                gain = varargin{k+1};
            case "offset"
                offset = varargin{k+1};
            otherwise
                error("scaleData:badName", "Unknown option '%s'", varargin{k});
        end
    end
    out = gain * x + offset;
end
```

```matlab
scaleData([1 2 3], "Gain", 2, "Offset", 0.5)
% ans = 2.5000    4.5000    6.5000
```

It works: $2 \times 1 + 0.5 = 2.5$, and so on. But look at how much code guards two numbers, and it still does not check that `gain` is a number at all. MATLAB also has an `inputParser` object that organizes this loop for you (`addRequired`, `addOptional`, `addParameter`, then `parse`), and you will see it in older code. Both are what the arguments block, coming up, replaces.

::: key
`nargin` is the number of inputs the caller passed; `nargout` is the number of outputs the caller asked for. Test `nargin` to fill in defaults and `nargout` to skip unneeded work. `varargin` collects extra inputs into a cell array; `varargin{:}` unpacks them again as a comma-separated list.
:::

## Checking values with validateattributes

Counting inputs is not checking them. A caller can pass the right *number* of inputs with the wrong *contents*: a 2-by-3 matrix where you wanted three numbers, a negative mass, a `NaN`. The long-standing tool for this is **`validateattributes`**, which checks one value against a list of rules and throws a clear error if any rule fails.

```matlab
validateattributes(A, classes, attributes, funcName, varName, argIndex)
```

- `A` is the value to check.
- `classes` is a cell array of allowed types, such as `{'double'}` or `{'numeric'}` (which means any number type).
- `attributes` is a cell array of rules. Some stand alone, like `'positive'`; some take a number after them, like `'numel', 4`.
- The last three are optional and only improve the error message: the function's name, the variable's name, and its position in the input list.

Some rules you will use often:

| Attribute | Passes when |
|---|---|
| `'scalar'` | exactly one element |
| `'vector'` | a row or a column (one dimension is 1) |
| `'2d'` | a matrix with no third dimension |
| `'ncols', n` / `'nrows', n` | exactly `n` columns / rows |
| `'numel', n` | exactly `n` elements |
| `'positive'` | every element is greater than 0 |
| `'nonnegative'` | every element is 0 or more |
| `'finite'` | no `Inf` and no `NaN` |
| `'integer'` | every element is a whole number |
| `'nonempty'` | at least one element |

Here is a checker for a **[[quaternion|quaternion]]**, the four-number way flight software stores which way a spacecraft is pointing. A quaternion must have exactly four finite numbers, and for an orientation its length must be 1:

```matlab
% checkQuat.m
function checkQuat(q)
    validateattributes(q, {'double'}, {'vector', 'numel', 4, 'finite'}, ...
                       'checkQuat', 'q', 1);
    if abs(norm(q) - 1) > 1e-6
        error("checkQuat:notUnit", ...
              "q must have length 1, but norm(q) = %.4f", norm(q));
    end
end
```

`checkQuat([0.5 0.5 0.5 0.5])` passes: four finite numbers, and $\sqrt{4 \times 0.25} = 1$. `checkQuat([1 0 0])` fails on `'numel', 4`, with an error that names `checkQuat`, the input `q` and the rule it broke. `checkQuat([1 1 0 0])` passes `validateattributes` but fails the hand-written test, reporting a norm of $\sqrt{2} \approx 1.4142$. That shows the usual split: `validateattributes` for size, type and simple value rules, and your own `if ... error(...)` for rules specific to your problem.

The first input to `error`, `"checkQuat:notUnit"`, is an **error identifier**: a `component:reason` label that code with `try`/`catch` can test for without reading the message text.

MATLAB also has small one-rule checkers with names like **`mustBePositive`**, `mustBeFinite`, `mustBeInteger`, `mustBeNonnegative`, `mustBeNumeric`, `mustBeNonempty` and `mustBeMember`. You can call one anywhere, as in `mustBePositive(mass)`, and it errors if the rule fails. Their real home is the arguments block.

::: warning Empty passes value rules
Rules about values, like `'positive'` or `mustBePositive`, check *every element*. An empty array has no elements, so there is nothing to fail, and it passes. If an empty input would break your function, check for it on its own with `'nonempty'`, `mustBeNonempty`, or an explicit `isempty` test.
:::

## The arguments block

Since R2019b, MATLAB has had a better answer: an **arguments block**, a section at the very top of a function that lists each input with its allowed size, its class, its rules and its default. MATLAB runs every check *before the first line of your function's body*. If anything fails, the body never runs.

```matlab
arguments
    name (dim1, dim2) class {validator1, validator2} = default
end
```

Each line declares one input, in the same order as the function's input list. Every part after the name is optional:

- **Size**, in parentheses. `(1,1)` means a scalar. `(1,:)` means a row of any length; the colon means "any number here". `(:,3)` means any number of rows and exactly three columns — the shape of 3-axis sensor data.
- **Class**, such as `double`, `string` or `logical`. If the input has a different but compatible type, MATLAB converts it; an `int16` or a `single` passed where `double` is declared arrives as a `double`.
- **Validators**, in curly braces: `mustBe...` functions, run left to right after the size and class checks. The first one that fails stops the call.
- **Default**, after `=`. An input with a default is optional. Once one positional input has a default, every positional input after it needs one too.

### Name-value options

To take name-value options, declare fields of one struct, conventionally called `opts`, with the dotted form `opts.Name`:

```matlab
% scaleData.m (the modern way)
function out = scaleData(x, opts)
    arguments
        x double
        opts.Gain   (1,1) double {mustBeFinite} = 1
        opts.Offset (1,1) double {mustBeFinite} = 0
    end
    out = opts.Gain * x + opts.Offset;
end
```

Five lines of declarations replace the whole parsing loop from before, and they check more: each option must be a finite scalar. Inside the function, `opts` is an ordinary struct, so you read `opts.Gain`. The caller can write either of these:

```matlab
scaleData([1 2 3], "Gain", 2, "Offset", 0.5)   % works in every release
scaleData([1 2 3], Gain=2, Offset=0.5)         % R2021a and later
```

The rules for options: the `opts` struct must be the *last* input in the function line, after all the positional ones; the caller can give options in any order or leave them out; and an option with a default always exists as a field of `opts`. An option declared *without* a default is a field only when the caller passed it, so you would test it with `isfield(opts, "Name")`.

::: key
An arguments block gives you declarative validation of size, class and value, plus defaults and name-value options, checked before the body runs and documented in the function signature. It replaces a page of hand-written inputParser or assert code.
:::

::: warning Where an arguments block may go
It must come first in the function body: no other code above it, only comments. It works in functions, not in scripts. And there is one block per function, listing the inputs in the same order as the function line.
:::

::: example A gyro bias estimator with optional weights
A **[[gyro bias|gyro-bias]]** is the small, steady reading a rate gyro gives when the vehicle is not rotating at all. Before launch, flight software averages a few samples taken while sitting still and subtracts that average from every later reading. Suppose the gyro warms up, so later samples should count more. Here is a function that takes $N$-by-3 rate data (one column per axis) and optional per-sample weights:

```matlab
% gyroBias.m
function bias = gyroBias(rates, opts)
    arguments
        rates (:,3) double {mustBeFinite}
        opts.Weights (:,1) double {mustBePositive} = []
    end

    if isempty(rates)                 % no data: report zero bias
        bias = zeros(1, 3);
        return
    end

    if isempty(opts.Weights)
        bias = mean(rates, 1);        % plain mean of each column
    else
        assert(numel(opts.Weights) == size(rates, 1), ...
               "gyroBias:weights", "Need one weight per row of rates");
        w = opts.Weights / sum(opts.Weights);   % weights now add to 1
        bias = sum(w .* rates, 1);
    end
end
```

Four samples in deg/s, with the last two weighted three times as heavily:

```matlab
g = [0.12 -0.05 0.02
     0.10 -0.03 0.04
     0.08 -0.04 0.03
     0.06 -0.04 0.03];
gyroBias(g)
% ans = 0.0900   -0.0400    0.0300
gyroBias(g, Weights=[1; 1; 3; 3])
% ans = 0.0800   -0.0400    0.0300
gyroBias(zeros(0, 3))
% ans = 0     0     0
```

**Step 1 (the checks).** Before the body runs, MATLAB confirms that `rates` has three columns, is `double`, and is finite, and that `Weights`, if given, is a column of positive numbers. The default `[]` means "no weights given".

**Step 2 (the weights).** The sum of the weights is $1 + 1 + 3 + 3 = 8$, so dividing gives $0.125$, $0.125$, $0.375$, $0.375$. These now add to 1.

**Step 3 (one axis by hand).** For the first column: $0.125 \times 0.12 + 0.125 \times 0.10 + 0.375 \times 0.08 + 0.375 \times 0.06 = 0.015 + 0.0125 + 0.03 + 0.0225 = 0.08\,\mathrm{deg/s}$.

**Step 4 (the multiply).** `w .* rates` multiplies a 4-by-1 column by a 4-by-3 matrix. MATLAB **[[stretches the column across all three columns|implicit-expansion]]**, so each row of `rates` is scaled by its own weight. `sum(..., 1)` then adds down each column.

**Step 5 (the empty case).** `zeros(0, 3)` is a matrix with 0 rows and 3 columns. It passes `(:,3)`, because the colon allows any number of rows, including zero. The `isempty` test catches it before `mean` would return `NaN` for every column.

**Sanity check.** The plain mean of the first column is $0.09$. The heavy samples, $0.08$ and $0.06$, are the smaller ones, so the weighted answer should be lower. It is $0.08$. The other two columns come out the same either way, because their late samples happen to equal their overall mean.
:::

Notice what the arguments block *cannot* say: that `Weights` has the same length as the number of rows in `rates`. The size `(:,1)` only says "a column of any length". A rule that ties two inputs together goes in the body, and `assert(condition, id, message)` is a compact way to write it: it throws the error if the condition is false.

::: warning Empty inputs and the order of checks
The size and class checks run before your body. If you want a function to return something sensible for empty data instead of erroring, the empty input has to *pass* those checks first. A 0-by-3 matrix fits `(:,3)`. Then your body must catch it, because many functions — `mean`, for example — return `NaN` on empty input rather than an error. Always test your function on an empty input of the right shape.
:::

::: note Why check at the door, not inside
Checking at the top is called **failing fast**. An error at the door names the function, the input and the broken rule, while the caller's line is still on screen. The same bad value caught ten calls deeper surfaces as "Index exceeds the number of array elements" in a function you did not write. There is a second payoff: the arguments block is also documentation. Anyone reading the first five lines knows exactly what the function accepts, and nobody has to read the body to find out.
:::

## Check yourself

::: check
A function begins `function y = smooth(x, window, method)`. A caller writes `smooth(data)`. Inside the function, what is `nargin`, and what happens on a line that uses `window` if you have not given it a default?
:::

::: answer
`nargin` is 1, because the caller passed one input. `window` and `method` were never created in the function's workspace, so any line that reads `window` stops with an error that it is not defined. The fix is an `if nargin < 2, window = 5; end` style default (and the same for `method`), or an arguments block with `= 5` defaults.
:::

::: check
Compute the RMS of the samples $3$, $-1$, $1$, $-3$. Why is it bigger than the plain mean of the samples?
:::

::: answer
Squares: $9, 1, 1, 9$. Mean of squares: $20 / 4 = 5$. RMS: $\sqrt{5} \approx 2.236$.

The plain mean is $(3 - 1 + 1 - 3)/4 = 0$, because the positive and negative samples cancel. Squaring first makes every sample count by its size, so RMS measures how big the swings are, not where they balance.
:::

::: check
Write one `validateattributes` call that accepts only a real, finite 3-element row of doubles named `r` in function `propagate`, as its second input.
:::

::: answer
```matlab
validateattributes(r, {'double'}, {'row', 'numel', 3, 'real', 'finite'}, ...
                   'propagate', 'r', 2);
```

`'row'` fixes the orientation, `'numel', 3` fixes the length, `'real'` rejects complex numbers and `'finite'` rejects `Inf` and `NaN`. The last three inputs make the error message say which function and which input broke the rule.
:::

::: check
Write the arguments block for `function T = burnTime(dv, opts)` where `dv` is a positive scalar in m/s, and there is an optional name-value option `Isp`, a positive scalar with default 300. Then write two calls, one using the default and one with `Isp` equal to 450.
:::

::: answer
```matlab
function T = burnTime(dv, opts)
    arguments
        dv (1,1) double {mustBePositive}
        opts.Isp (1,1) double {mustBePositive} = 300
    end
    % ... body uses opts.Isp ...
end
```

Calls: `burnTime(1500)` uses the default `opts.Isp = 300`. `burnTime(1500, Isp=450)` (or `burnTime(1500, "Isp", 450)` in any release) sets it to 450. The struct `opts` is last in the function line, as name-value options must be.
:::

::: check
A teammate declares `opts.Weights (:,1) double {mustBePositive}` with no default, then writes `if isempty(opts.Weights)` in the body. What goes wrong when a caller leaves `Weights` out, and what are two fixes?
:::

::: answer
An option declared without a default becomes a field of `opts` only when the caller passes it. Left out, `opts` has no `Weights` field, so reading `opts.Weights` is an error before `isempty` ever runs.

Fixes: give it a default, `= []`, so the field always exists and `isempty` works; or keep no default and test `isfield(opts, "Weights")` instead.
:::

## Summary

| Tool | What it does | Typical use |
|---|---|---|
| `nargin` | number of inputs passed | `if nargin < 3, g = 9.80665; end` |
| `nargout` | number of outputs requested | skip work nobody asked for |
| `narginchk(lo, hi)` | errors unless `lo` to `hi` inputs | first line of a classic function |
| `varargin` | extra inputs, packed in a cell array | `varargin{:}` unpacks them |
| `validateattributes` | checks class and rules like `'positive'`, `'ncols', 3` | one line per input |
| `mustBe...` | one-rule checkers | inside arguments blocks, or alone |
| arguments block | size, class, validators and defaults, before the body | `data (:,3) double {mustBeFinite}` |
| `opts.Name` | a name-value option | `f(x, Name=value)` |
| RMS | $\sqrt{\tfrac{1}{N}\sum x_k^2}$ | `sqrt(mean(x.^2, 1))` per column |

Next lesson: an arguments block describes what a single function will accept. A **class** goes one step further and bundles data with the functions that act on it — and in MATLAB you must choose whether copies of it are independent or shared, the handle-versus-value question.

::: context mars-climate-orbiter A spacecraft lost to units
NASA's Mars Climate Orbiter reached Mars in September 1999 and was lost as it tried to enter orbit. The investigation found that ground software supplied thruster impulse data in pound-force seconds, while the navigation software that used it expected newton-seconds — a factor of about 4.45. The small errors added up over months of cruise, and the spacecraft passed far too low through the Martian atmosphere. No single check at a software boundary caught it. Input validation cannot know what units a number carries, but the habit behind it — never trust what crosses an interface — is exactly the lesson of that mission.
:::

::: context rms-picture The RMS of a wobble
The mean of a signal that swings above and below zero can be zero even when it is shaking hard. The RMS squares everything first, so it measures how big the swings are. For a pure sine wave of height $A$, the RMS is $A/\sqrt{2} \approx 0.707A$. Engineers quote vibration levels, sensor noise and electrical voltages this way: the "120 volts" of a US wall socket is an RMS value, and its peak is about 170 V.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="75" x2="340" y2="75" stroke="#6c7a93" stroke-width="1"/>
  <path d="M20,75 C45,15 75,15 100,75 C125,135 155,135 180,75 C205,15 235,15 260,75 C285,135 315,135 340,75" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="20" y1="43" x2="340" y2="43" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <line x1="20" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 4"/>
  <text x="344" y="34" font-size="11" fill="#6c7a93" text-anchor="end">peak A</text>
  <text x="344" y="58" font-size="11" fill="#b4232c" text-anchor="end">RMS = 0.707 A</text>
  <text x="344" y="90" font-size="11" fill="#1f2a44" text-anchor="end">mean = 0</text>
</svg>
```
:::

::: context comma-list Unpacking a cell array
A cell array is a row of boxes. Indexing it with curly braces and a colon, `c{:}`, takes each box's contents out and lays them in a row separated by commas, as if you had typed them. That is why `fprintf(fmt, varargin{:})` works: `fprintf` receives the format and then each value as its own input.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="20" y="22" font-size="12" fill="#1f2a44" font-weight="700">varargin (a 1-by-2 cell)</text>
  <rect x="20" y="32" width="80" height="30" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="100" y="32" width="80" height="30" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="60" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">1250.5</text>
  <text x="140" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">3200</text>
  <line x1="190" y1="47" x2="225" y2="47" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="232,47 222,42 222,52" fill="#1f2a44"/>
  <text x="290" y="40" font-size="12" fill="#1f2a44" text-anchor="middle">varargin{:}</text>
  <text x="290" y="58" font-size="12" fill="#b4232c" text-anchor="middle">1250.5, 3200</text>
  <text x="20" y="98" font-size="12" fill="#1f2a44">fprintf(fmt, varargin{:})  is  fprintf(fmt, 1250.5, 3200)</text>
</svg>
```
:::

::: context quaternion Four numbers for a direction
A **quaternion** stores an orientation as four numbers: one related to the angle turned and three giving the axis turned about. Flight software prefers it to three angles because it has no special angle where the math breaks down, and it is cheap to combine two rotations. A quaternion that represents a rotation must have length exactly 1, which is why the checker tests the norm. Rounding slowly drags the length away from 1, so real attitude software renormalizes it every step. The GNC toolbox module takes quaternions up in full.
:::

::: context gyro-bias A gyro that is never quite still
A rate gyro measures how fast the vehicle turns, in deg/s or rad/s. Even sitting still on the pad, a real gyro reads a tiny rate — its **bias**. It is small, perhaps a few hundredths of a degree per second, but integrated over a ten-minute ascent, $0.08\,\mathrm{deg/s}$ adds up to $48$ degrees of false turning. That is why navigation software estimates the bias before launch and keeps re-estimating it in flight.
:::

::: context implicit-expansion Stretching to fit
Since R2016b, MATLAB element-wise operators stretch a dimension of size 1 to match the other operand. A 4-by-1 column times a 4-by-3 matrix behaves as if the column were copied into three columns first. NumPy calls the same rule broadcasting. It is convenient and also a source of silent bugs: a 1-by-4 row times a 4-by-1 column stretches both and gives a 4-by-4 matrix, not an error.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="20" y="20" width="30" height="96" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
    <text x="35" y="44">w1</text><text x="35" y="68">w2</text><text x="35" y="92">w3</text><text x="35" y="112">w4</text>
    <text x="70" y="72">.*</text>
    <rect x="90" y="20" width="90" height="96" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
    <text x="135" y="72">4-by-3 rates</text>
    <text x="200" y="72">=</text>
    <rect x="220" y="20" width="30" height="96" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
    <rect x="250" y="20" width="30" height="96" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4 3"/>
    <rect x="280" y="20" width="30" height="96" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4 3"/>
    <text x="265" y="12">w copied across</text>
    <text x="330" y="72">.* rates</text>
  </g>
</svg>
```
:::
