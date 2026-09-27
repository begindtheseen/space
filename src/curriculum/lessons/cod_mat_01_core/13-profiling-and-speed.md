---
id: l13-profiling-and-speed
title: Profiling and making code fast
minutes: 22
covers:
  - The Profiler, tic/toc, vectorisation, parfor
  - Preallocation and why growing an array in a loop is fatal
---

Suppose your drive to school takes an hour and you want it shorter. You could buy a faster car. But if you timed each part of the trip, you might find that forty of those sixty minutes are spent waiting at one broken traffic light. A faster car would save you almost nothing. Fixing the light would save you forty minutes.

Slow code is the same. The first job is never "make it faster". The first job is "find out where the time goes". Only then do you fix the one place that matters. Lesson 12 finished the MATLAB language itself; this lesson is about running it quickly. You will meet two measuring tools — **tic/toc**, a stopwatch, and the **Profiler**, a tool that times every line — and then the three classic fixes: **preallocation**, **vectorisation** and **parfor**.

Why does a GNC engineer care? Because the same script runs thousands of times. A **[[Monte Carlo campaign|monte-carlo]]** flies a simulated vehicle two thousand times with slightly different winds, masses and sensor errors, to see how far from the target it can land. If one flight takes a minute, the campaign takes a day and a half. Make it ten times faster and the answer arrives the same morning, so you can try several design changes in a day instead of one.

## Measure first: tic and toc

You met `tic` and `toc` in lesson 5. `tic` starts a stopwatch. `toc` reads it and returns the time since the last `tic`, in seconds.

```matlab
tic
s = 0;
for k = 1:1e5
    s = s + sqrt(k);
end
elapsed = toc;
fprintf('sum %.6e in %.3f s\n', s, elapsed)
%   sum 2.108201e+07 in 0.260 s      (GNU Octave 8.4; your time will differ)
```

If you write `toc` with no semicolon and no output, it prints `Elapsed time is ... seconds.` If you assign it, as above, you get a plain number to print or compare.

There is one catch. `tic` without an output starts a single shared stopwatch, so a function you call that does its own `tic` would reset yours. To keep separate stopwatches, take an output from `tic`. It returns a **timer id** — a number that names this one start time — and you pass it to `toc`:

```matlab
id = tic;            % my own stopwatch
% ... work ...
elapsed = toc(id);   % reads my stopwatch, whatever else called tic
```

Four habits keep a stopwatch reading honest.

- **Time something big enough.** A single fast line takes microseconds, and the clock's own noise swamps it. Time the whole loop, or repeat the small thing many times.
- **Run it twice and trust the second run.** The first run pays one-off costs: MATLAB reads the file from disk and its [[execution engine compiles|jit]] the code. Later runs skip that.
- **Take the median of several runs.** Other programs on your computer steal time now and then. The median ignores the odd slow run.
- **Keep printing and plotting out of the timed part.** Drawing a figure can take longer than the math you meant to measure.

MATLAB has a function that follows these habits for you. `timeit` takes a function handle (lesson 10), runs it several times and returns the median time in seconds: `t = timeit(@() mySim(params))`. Use it for small pieces of code where one run is too short to time by hand.

## The Profiler: where the time goes

`tic` and `toc` tell you *how long* the whole thing took. They do not tell you *which line* is the broken traffic light. For that you need the **Profiler**: a tool that records how much time every function and every line took while your code ran.

There are two ways to start it. In the Editor, the **Run and Time** button runs the current file under the Profiler. From the Command Window, you switch it on and off yourself:

```matlab
profile on          % start recording
ascent_study        % run your script (any code)
profile off         % stop recording
profile viewer      % open the report
```

The report opens on the **Profile Summary**: a table with one row per function that ran. The columns you read are:

- **Calls** — how many times the function ran;
- **Total Time** — the seconds spent in the function, *including* every function it called;
- **Self Time** — the seconds spent in the function's *own* lines, not counting the functions it called.

Total and self time answer different questions. A top-level function with a huge total time and a tiny self time is not slow itself: it is a manager whose time is spent waiting on its workers. You follow the time down into the function it calls. A function with a large **[[self time|self-time]]** is where the work really happens.

Click a function's name and the Profiler opens its detail page. That page lists the **lines where the most time was spent**, each with its number of calls, its time and its share of the total, and shows the code with the slow lines highlighted. That is your traffic light.

Two more commands are worth knowing. `profile clear` throws away old results before a fresh run. And `p = profile('info')` returns the same data as a struct, so a script can read it.

::: warning The Profiler slows your code a little
Recording every line costs time, so a profiled run is slower than a normal one. Use the Profiler to find *where* the time goes. Use `tic`/`toc` or `timeit`, with the Profiler off, for the before-and-after numbers you report.
:::

The working loop is short: profile, fix the top line, profile again. Often the second run shows a new top line, because the old one has gone. Stop when the code is fast enough for its job, not when it is perfect.

## What the Profiler usually finds: a growing array

Lesson 6 met the most common slow line in beginner MATLAB: an array grown inside a loop with `x(end+1) = v`. In short: an array lives in one unbroken block of memory. To add an element, MATLAB may have to find a new, bigger block and copy every old element across. Over $n$ passes that is up to $1 + 2 + \cdots + (n-1) = n(n-1)/2$ copies, so the time grows as $n^2$ — **quadratic**, written $O(n^2)$ and read "order n squared" — instead of as $n$.

::: key
Why is `x(end+1) = v` inside a loop a bug? Each assignment may reallocate and copy the whole array, making the loop quadratic in the number of iterations. Preallocate with `zeros(1,n)` and index, or vectorise.
:::

In the Profiler, a growing array shows up as one line with a huge share of the time, often inside a loop that looks innocent. Two quick tests confirm it.

- **The doubling test.** Time the script at size $n$ and at $2n$. A linear loop takes about twice as long. A quadratic one takes about four times as long. That factor of four is the fingerprint.
- **The Code Analyzer underline.** The Editor underlines the growing variable and warns that it changes size on every loop iteration. The warning's id is `AGROW`, the same id the comment `%#ok<AGROW>` hides.

How big the gap is depends on your release and on what you grow. Recent MATLAB releases handle some simple growing patterns far better than old ones did, but growing a matrix by rows, as lesson 6 measured, can still cost the full quadratic price. So the rule does not change: preallocate with `zeros`, `NaN`, `false` or `cell` at the final size (or a safe upper bound, trimmed at the end), then fill by index.

Preallocation is the first of three fixes, and the next two build on it. A preallocated loop can often go further and lose the loop altogether.

## Vectorisation: let the whole array move at once

Picture a stack of 500 letters to mail. You could walk each letter to the mailbox, one trip per letter. Or you could carry the whole stack once. The letters are the same; the walking is what costs.

A MATLAB loop over a million elements makes a million trips. On each trip the interpreter has to look up the names, check the types and sizes, check that each index is in range, and only then do the arithmetic. **Vectorisation** means writing the calculation as operations on whole arrays, so the loop happens *inside* a built-in function — one trip. Built-in functions are compiled code that loops at full machine speed, and many of them use [[several processor cores|simd-and-cores]] at once.

You already have the tools. The element-wise operators `.*`, `./` and `.^` from lesson 4 work on every element. Logical indexing from lesson 3 replaces an `if` inside a loop. And functions such as `sum`, `mean`, `max`, `cumsum` and `diff` replace the loops you would write to add up, average, search, accumulate or difference.

::: example Dynamic pressure along an ascent
A toy rocket climbs straight up with a constant acceleration of $20\,\mathrm{m/s^2}$, so its speed is $v = 20t$ and its altitude is $h = 10t^2$. Air density falls with altitude as $\rho = 1.225\,e^{-h/8500}$ (in $\mathrm{kg/m^3}$, a simple exponential model). Dynamic pressure, the push of the air, is $q = \tfrac{1}{2}\rho v^2$. Find the peak $q$ and how long $q$ stays above $30\,\mathrm{kPa}$, sampling every $0.01$ s for 120 s.

The loop version, with an `if` counting time above the limit:

```matlab
dt = 0.01;  t = 0:dt:120;  n = numel(t);     % n = 12001
v = 20*t;   h = 10*t.^2;

q1 = zeros(1, n);  above = 0;
for k = 1:n
    rho   = 1.225*exp(-h(k)/8500);
    q1(k) = 0.5*rho*v(k)^2;
    if q1(k) > 30e3
        above = above + dt;
    end
end
```

The vectorised version, two lines:

```matlab
q = 0.5*1.225*exp(-h/8500).*v.^2;     % every sample at once
tAbove = sum(q > 30e3)*dt;            % logical mask, counted, times dt

[qmax, i] = max(q)
%   qmax = 7.6611e+04
%   i = 2916
t(i)
%   ans = 29.1500
tAbove
%   tAbove = 38.8900
max(abs(q - q1))
%   ans = 2.2737e-13
```

Step by step. `exp(-h/8500)` computes the density factor for all 12,001 samples at once; `.*v.^2` multiplies each by its own speed squared. `q > 30e3` makes a logical array, true where the limit is passed; `sum` counts the trues (3,889 of them), and multiplying by $dt = 0.01$ s turns a count into $38.89$ s. `max` returns the peak and where it happened: $76.6\,\mathrm{kPa}$ at $t = 29.15$ s.

In GNU Octave, which has no JIT compiler, the loop took about $0.10$ s and the vectorised lines about $0.00042$ s — some 240 times faster. MATLAB's loop would be much faster than Octave's, for reasons the next part explains.

Sanity check: $q = \tfrac12 \cdot 1.225 \cdot 400\,t^2\,e^{-t^2/850}$, and a function of the form $t^2 e^{-t^2/c}$ peaks where $t^2 = c$, at $t = \sqrt{850} \approx 29.15$ s. The peak is $245 \times 850 \times e^{-1} \approx 76{,}611$ Pa. Both match. And $76.6$ kPa is in the range of a real launcher's max-q, a few tens of kilopascals.
:::

That last line, `max(abs(q - q1))`, did not give zero. The two versions multiplied the same numbers in a different order, and computer arithmetic [[rounds at every step|rounding]], so the last digit or so can differ. That is why you compare results with a tolerance, never with `==`.

::: warning Scale the tolerance to the size of the numbers
`max(abs(a - b)) < 1e-12` is a fine test when the values are around 1. For values near $77{,}000$, one step of double-precision rounding is already about $1.5 \times 10^{-11}$, so two correct answers can fail that test. A safer check is relative: `max(abs(a - b)) <= 1e-12 * max(abs(b))`.
:::

### What the JIT changed

Since release R2015b, MATLAB runs all code through an execution engine with a **JIT compiler** — "just in time": it turns your loop into fast machine code the first time it runs. A plain loop over scalars, preallocated, is now often close to the vectorised version. So is vectorising still worth it?

::: key
Is vectorising still necessary given the JIT? Less than it once was for simple loops, but yes for anything indexing-heavy or growing arrays, and vectorised code is usually clearer about the mathematics. Profile rather than assume, exactly as in Python.
:::

"Clearer about the mathematics" matters as much as speed. `q = 0.5*rho.*v.^2` reads like the formula on paper. A reviewer can check it at a glance, which is harder with a loop and its indices.

Vectorising is not always the right move. Two cases favor a preallocated loop:

- **Each step needs the previous one.** An integrator that computes `x(k) = x(k-1) + v(k)*dt` cannot compute sample 5 before sample 4. Some of these have a built-in (this one is `cumsum`), but many, like a filter with feedback, do not.
- **The trick builds huge temporary arrays.** A clever one-liner that expands two 100,000-element vectors into a 100,000-by-100,000 matrix needs 80 GB. A loop needs almost nothing.

## parfor: more cooks in the kitchen

A restaurant with eight cooks makes dinner faster than one with a single cook — if the dishes are separate. Eight cooks do not help with one soup that must simmer for an hour. And each extra cook takes time to arrive, wash up and learn where the pans are.

**parfor** is a `for` loop whose iterations MATLAB hands out to several **workers** — separate copies of MATLAB running at the same time, each on its own processor core. The group of workers is a **parallel pool**, started with `parpool` (or automatically, the first time a `parfor` runs). It needs the **Parallel Computing Toolbox**. Without the toolbox, `parfor` runs as an ordinary `for` loop, one iteration after another, so the code still works.

```matlab
nRuns = 2000;
missDistance = zeros(1, nRuns);          % preallocated output
parfor k = 1:nRuns
    p = dispersedParams(k);              % this run's winds, mass, sensor errors
    missDistance(k) = simulateLanding(p);
end
```

Here `dispersedParams` and `simulateLanding` stand for your own functions. For MATLAB to split a loop safely, the iterations must be **independent**: no iteration may use a result from another, because they run in no fixed order on different workers. The rules that follow from that:

- The loop range must be consecutive increasing whole numbers, like `1:nRuns`.
- An output array must be indexed by the loop variable, as `missDistance(k)` is. MATLAB calls it a **[[sliced|sliced-variable]]** variable: each worker fills its own slices.
- A running total such as `total = total + x` is allowed; it is a **reduction** variable, and MATLAB combines the workers' partial totals at the end.
- `x(end+1) = ...`, `break`, and anything that reads the previous iteration's result are not allowed.

When does it help? When each iteration is *expensive* — seconds, not microseconds — and there are many of them, and little data has to travel to and from the workers. A Monte Carlo campaign of full flight simulations is the textbook case. When does it hurt? When each iteration is cheap. Starting a pool often takes tens of seconds, and sending work to the workers costs time on every batch. A loop of a million `sin` evaluations spends far longer on bookkeeping than on math; vectorise it instead. And `parfor` never fixes a growing array. Preallocate first.

How much can it gain? Part of any program cannot be split: loading data, setting up, making the final plots. If a fraction $p$ of the run time can be split over $N$ workers and the rest cannot, the speedup is

$$
S = \frac{1}{(1-p) + p/N}.
$$

This is **[[Amdahl's law|amdahl]]**. Read $S$ as "the speedup" and $p$ as "the parallel fraction". As $N$ grows without limit, $p/N$ shrinks to zero and the speedup can never beat $1/(1-p)$.

::: example Eight workers on a dispersion campaign
A Monte Carlo study takes 40 minutes on one core. The Profiler shows that 95% of the time is inside the simulation loop, which can be a `parfor`; the other 5% is loading data and plotting. How fast can 8 workers make it?

Here $p = 0.95$ and $N = 8$:

$$
S = \frac{1}{0.05 + 0.95/8} = \frac{1}{0.05 + 0.11875} = \frac{1}{0.16875} \approx 5.93.
$$

So 40 minutes becomes about $40 / 5.93 \approx 6.7$ minutes, plus the time to start the pool. Not 8 times faster: the 5% that cannot be split still takes its 2 minutes. Even with endless workers the limit is $1/0.05 = 20$ times, or 2 minutes.

Sanity check: 8 workers should give less than 8 times, and more than 1 time. 5.93 sits in between, closer to 8 because the parallel part is large.
:::

The order of attack follows from all this. Profile first. Fix growing arrays with preallocation. Vectorise where it is clearer or faster. Reach for `parfor` last, and only for loops whose iterations are heavy and independent.

## Check yourself

::: check
You time a function four times in a row: 2.1 s, 0.80 s, 0.79 s and 0.81 s. What number would you report, and why is the first run different?
:::

::: answer
Report about 0.80 s, the median of the runs after the first (or better, let `timeit` measure it). The first run paid one-off costs: MATLAB read the file from disk and compiled the code before running it. The later runs skip that, and they agree with each other to within 0.01 s, which shows the measurement is steady. The 2.1 s is a real number, but it measures start-up, not the work you are trying to speed up.
:::

::: check
In the Profile Summary, a function `runCampaign` has a total time of 58 s and a self time of 0.4 s. A function `propagate` has a total time of 51 s and a self time of 49 s. Where should you look first, and why?
:::

::: answer
Inside `propagate`. Total time includes the functions a function calls; self time counts only its own lines. `runCampaign` spent only 0.4 s in its own lines — nearly all its 58 s was spent waiting on the functions it called, `propagate` among them. `propagate` spent 49 of its 51 s in its own lines, so the slow code is there. Open its detail page and read the lines where the most time was spent.
:::

::: check
A logging loop takes 3 s for 50,000 steps and 12 s for 100,000 steps. What does that pattern tell you, and what would you expect for 200,000 steps?
:::

::: answer
Doubling the steps multiplied the time by $12/3 = 4$. That is the fingerprint of a quadratic loop, very often an array grown inside the loop. Another doubling would multiply by about 4 again: roughly 48 s for 200,000 steps. A linear loop would have gone from 3 s to about 6 s. Look for `x(end+1) = ...` or `x = [x v]` inside the loop and preallocate.
:::

::: check
A pointing-error array holds `err = [0.2 -0.7 0.4 0.9 -0.1 0.6]` (degrees). Write vectorised lines that count how many samples are more than 0.5 degrees off in either direction, and compute the RMS error. Give the results.
:::

::: answer
```matlab
nBig   = sum(abs(err) > 0.5)      % 3
rmsErr = sqrt(mean(err.^2))       % 0.5583
```
`abs(err)` gives the size of each error; `> 0.5` makes a logical array, true for $0.7$, $0.9$ and $0.6$; `sum` counts the three trues. For the RMS, `err.^2` squares each element (the dot matters), giving $0.04, 0.49, 0.16, 0.81, 0.01, 0.36$, which add to $1.87$. The mean is $1.87/6 \approx 0.3117$ and its square root is about $0.558$ degrees.
:::

::: check
Can this loop become a `parfor`? `for k = 2:n, x(k) = x(k-1) + v(k)*dt; end` If not, how would you speed it up?
:::

::: answer
No. Each iteration reads `x(k-1)`, the result of the iteration before it, so the iterations are not independent, and `parfor` gives no fixed order. Two good options instead. Preallocate `x = zeros(1, n)` before the loop, and the JIT makes the loop itself fast. Or vectorise it with a running sum: with `x(1) = 0`, the loop is the same as `x = [0 cumsum(v(2:end))*dt]`. For `v = [1 2 3 4]` and `dt = 0.5`, both give `[0 1 2.5 4.5]`.
:::

::: check
A script's parallelisable part is 80% of its run time. How much faster can 16 workers make it, and what is the best any number of workers could do?
:::

::: answer
By Amdahl's law with $p = 0.8$ and $N = 16$: $S = 1/(0.2 + 0.8/16) = 1/(0.2 + 0.05) = 1/0.25 = 4$. Sixteen workers give only a 4-times speedup. The limit with endless workers is $1/(1 - 0.8) = 1/0.2 = 5$. The serial 20% dominates, so the better next step is to profile and shrink that part.
:::

## Summary

| Tool or idea | What it does | Fact to remember |
| --- | --- | --- |
| `tic` / `toc` | stopwatch in seconds | `id = tic; ... toc(id)` keeps a private timer |
| `timeit(@() f(x))` | times a function handle | runs it several times, returns the median |
| Profiler | time per function and per line | `profile on`, run, `profile viewer`; or Run and Time |
| total vs self time | with or without called functions | large self time marks the slow code |
| growing `x(end+1)` | may copy the whole array each time | $n(n-1)/2$ copies: quadratic, $O(n^2)$ |
| preallocation | `zeros(n,3)`, `NaN`, `false`, `cell` | one allocation; linear, $O(n)$ |
| vectorisation | whole-array operations and masks | faster and closer to the math |
| JIT (R2015b on) | compiles loops as they run | simple loops are fast; profile, do not assume |
| `parfor` | splits independent iterations over workers | Parallel Computing Toolbox; heavy iterations only |
| Amdahl's law | limit on parallel speedup | $S = 1/((1-p) + p/N)$, never above $1/(1-p)$ |

Fast code produces results; the next lesson shows them. Lesson 14 turns flight data into clear figures with `plot`, `tiledlayout` and linked time axes, and uses timetables to line up sensors that record at different rates.

::: context monte-carlo Thousands of flights that never happened
A Monte Carlo study runs the same simulation many times, each time drawing the uncertain inputs — wind, engine thrust, mass, sensor noise — at random from their expected spreads. The spread of the results shows what could really happen. Landing and entry teams use it to draw the "dispersion ellipse", the region where the vehicle will land with, say, 99% confidence. The name comes from the casino in Monaco, a nod to the dice-rolling at its heart; the method grew out of 1940s weapons work at Los Alamos. Because each run is independent, it is the classic job for `parfor`.
:::

::: context jit Compiling while it runs
Older MATLAB was an interpreter: it read each line and worked out what to do every single time the line ran, even inside a loop that repeated it a million times. Since R2015b, MATLAB's execution engine compiles your code to machine code the first time it runs — "just in time" — and reuses that. The compile step is part of why a first run is slower. GNU Octave has no JIT, which is why loops look so much worse there than in MATLAB.
:::

::: context self-time Where the seconds really go
Think of a function as a manager. Its total time is how long the whole job took, including the time its workers spent. Its self time is only the time the manager spent working alone. Here `runSim` took 10 s in total, but only 0.5 s was its own; the rest was spent inside the two functions it called.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="24" font-size="12" fill="#1f2a44">runSim: total 10 s</text>
  <rect x="10" y="32" width="15" height="24" fill="#b4232c"/>
  <rect x="25" y="32" width="210" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="235" y="32" width="75" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="130" y="49" font-size="11" fill="#1f2a44" text-anchor="middle">stepDynamics 7.0 s</text>
  <text x="272" y="49" font-size="11" fill="#1f2a44" text-anchor="middle">logState 2.5 s</text>
  <line x1="17" y1="60" x2="17" y2="80" stroke="#b4232c" stroke-width="1.5"/>
  <text x="10" y="94" font-size="11" fill="#b4232c">self time 0.5 s</text>
  <text x="10" y="118" font-size="11" fill="#6c7a93">bar width is time: 30 px per second</text>
</svg>
```
:::

::: context simd-and-cores Why built-in functions are so quick
A modern processor can do the same arithmetic on several numbers in one instruction — 4 doubles at a time is common — which is called SIMD, "single instruction, multiple data". It also has several cores that can work at once. MATLAB's built-in functions are written in compiled languages and tuned to use both, and many large array operations are split across cores automatically. A loop you write yourself does one element per step on one core.
:::

::: context rounding Same math, different last digit
A double stores about 16 significant digits, and every multiplication rounds its result to fit. Multiply the same three numbers in a different order and the rounding happens at different moments, so the answers can differ in the last digit. The gap between neighboring doubles near 77,000 is about $1.5 \times 10^{-11}$, and near 1 it is about $2.2 \times 10^{-16}$. A difference of $2.3 \times 10^{-13}$ between two ways of computing $q$ is ordinary rounding, not a bug. The classic small case: `0.1 + 0.2 == 0.3` is false in MATLAB, Python and C alike.
:::

::: context sliced-variable Each worker fills its own slots
A sliced output is like a class worksheet torn into pieces: each worker gets some iteration numbers and writes only into those slots of the array, so no two workers ever write the same slot and none needs to wait for another. MATLAB decides how to split the iterations, and in what order they run; the picture shows one possible split of 12 iterations over 3 workers. Because slot `k` is written only by iteration `k`, the finished array is the same whichever split MATLAB picks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="30" y="30" width="25" height="30" fill="#8fb8f0"/><rect x="55" y="30" width="25" height="30" fill="#8fb8f0"/>
    <rect x="80" y="30" width="25" height="30" fill="#8fb8f0"/><rect x="105" y="30" width="25" height="30" fill="#8fb8f0"/>
    <rect x="130" y="30" width="25" height="30" fill="#f2b880"/><rect x="155" y="30" width="25" height="30" fill="#f2b880"/>
    <rect x="180" y="30" width="25" height="30" fill="#f2b880"/><rect x="205" y="30" width="25" height="30" fill="#f2b880"/>
    <rect x="230" y="30" width="25" height="30" fill="#ffffff"/><rect x="255" y="30" width="25" height="30" fill="#ffffff"/>
    <rect x="280" y="30" width="25" height="30" fill="#ffffff"/><rect x="305" y="30" width="25" height="30" fill="#ffffff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="42" y="50">1</text><text x="67" y="50">2</text><text x="92" y="50">3</text><text x="117" y="50">4</text>
    <text x="142" y="50">5</text><text x="167" y="50">6</text><text x="192" y="50">7</text><text x="217" y="50">8</text>
    <text x="242" y="50">9</text><text x="267" y="50">10</text><text x="292" y="50">11</text><text x="317" y="50">12</text>
  </g>
  <text x="30" y="20" font-size="12" fill="#1f2a44">missDistance(k), k = 1 to 12</text>
  <g font-size="11" text-anchor="middle">
    <text x="80" y="82" fill="#1d6fd1">worker 1</text>
    <text x="180" y="82" fill="#1f2a44">worker 2</text>
    <text x="280" y="82" fill="#6c7a93">worker 3</text>
  </g>
  <text x="180" y="108" font-size="11" fill="#6c7a93" text-anchor="middle">one possible split; MATLAB chooses</text>
</svg>
```
:::

::: context amdahl The serial part sets the ceiling
Gene Amdahl, a computer designer at IBM, made this argument in 1967. The curve shows the speedup for a program that is 95% parallel. It rises fast at first, then flattens toward the dashed ceiling of 20, no matter how many workers you add. The grey line is the ideal of $N$ workers giving $N$ times.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="30" x2="330" y2="30" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="326" y="24" font-size="11" fill="#b4232c" text-anchor="end">ceiling 20</text>
  <polyline points="50,172.5 95,165 140,150 185,120 230,60" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <polyline points="50,172.5 95,165.8 140,153.9 185,135.5 230,111.5 275,85.9 320,64.4" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="185" cy="135.5" r="4" fill="#1d6fd1"/>
  <text x="192" y="150" font-size="11" fill="#1d6fd1">8 workers: 5.9</text>
  <text x="236" y="58" font-size="11" fill="#6c7a93">ideal</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="195">1</text><text x="95" y="195">2</text><text x="140" y="195">4</text>
    <text x="185" y="195">8</text><text x="230" y="195">16</text><text x="275" y="195">32</text><text x="320" y="195">64</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="184">0</text><text x="44" y="109">10</text><text x="44" y="34">20</text>
  </g>
  <text x="190" y="208" font-size="11" fill="#6c7a93" text-anchor="middle">workers N</text>
</svg>
```
:::
