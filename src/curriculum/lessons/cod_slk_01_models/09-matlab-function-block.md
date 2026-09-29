---
id: l09-matlab-function-block
title: MATLAB code inside a model
minutes: 16
covers:
  - MATLAB Function block (code-generation-compatible subset) versus Interpreted MATLAB Function
---

Imagine two ways to get a speech into another language. You could hire an interpreter who stands next to the speaker and translates every sentence as it is spoken, every time the speech is given. Or you could have the speech translated once, in writing, ahead of time, and hand out the printed copy. The interpreter is flexible: the speaker can say anything at all. The printed translation is fast and can be handed to anyone, but only if the speech was fixed before the translating started.

Simulink offers the same two choices for putting MATLAB code in a model. Some logic is painful to draw with blocks: a chain of `if` statements, a small loop, a formula with ten terms. It is much clearer as a few lines of code. The last lesson read aerodynamic data from tables; this one lets you compute things the tables and blocks do not.

The **MATLAB Function block** is the printed translation. Simulink converts its code into compiled form before the run starts, the same way it will later turn the model into C code for a flight computer. The **Interpreted MATLAB Function block** is the interpreter at your side: it calls MATLAB itself at every time step. Both sit in the **[[User-Defined Functions|user-defined]]** sub-library. On a GNC team, the first kind appears all over flight models. The second kind is for quick experiments, and the reasons why are the heart of this lesson.

## The MATLAB Function block

Place a MATLAB Function block and double-click it. An editor opens with a starting function:

```matlab
function y = fcn(u)
y = u;
```

Each input argument becomes an input port on the block and each output argument becomes an output port. Rename `u` and `y`, add arguments, and the ports follow. The block's code is a normal MATLAB function, with the same `if`, `for`, `while`, matrix arithmetic and most of the math functions you know.

You can also pass in a value that is not a signal, such as a gain that lives in the MATLAB workspace. You list it as an argument and mark its scope as **Parameter** in the block's data settings (the Symbols pane or the Ports and Data Manager); it then takes its value from a workspace variable of the same name instead of becoming a port. The next lesson is about where such variables should live.

::: example An air-data block: dynamic pressure and Mach number
A guidance model needs **dynamic pressure** $q$ (read "q", how hard the oncoming air hits the vehicle, in pascals) and Mach number $M$ from speed $v$ and altitude $h$. As blocks, that is a dozen Gains, Products and Math Function blocks. As a MATLAB Function block, it is this:

```matlab
function [q, M] = airdata(v, h)
% Dynamic pressure (Pa) and Mach number from speed v (m/s) and altitude h (m)
rho = 1.225 * exp(-h / 8500);              % kg/m^3, exponential atmosphere
T   = max(288.15 - 0.0065 * h, 216.65);    % K, cools with height, then constant
a   = sqrt(1.4 * 287.05 * T);              % m/s, speed of sound
q   = 0.5 * rho * v^2;                     % Pa
M   = v / a;
```

The block gets two input ports, `v` and `h`, and two output ports, `q` and `M`. Try $v = 600\,\mathrm{m/s}$ at $h = 10{,}000\,\mathrm{m}$.

**Step 1: density.** $\rho = 1.225 \times e^{-10000/8500} = 1.225 \times e^{-1.176} \approx 0.378\,\mathrm{kg/m^3}$. Read $\rho$ as "rho".

**Step 2: temperature and speed of sound.** $T = 288.15 - 0.0065 \times 10000 = 223.15\,\mathrm{K}$, which is above the $216.65\,\mathrm{K}$ floor, so it stays. Then $a = \sqrt{1.4 \times 287.05 \times 223.15} \approx 299.5\,\mathrm{m/s}$.

**Step 3: the outputs.** $q = 0.5 \times 0.378 \times 600^2 \approx 68{,}000\,\mathrm{Pa} = 68.0\,\mathrm{kPa}$, and $M = 600 / 299.5 \approx 2.00$.

**Sanity check.** At sea level and $250\,\mathrm{m/s}$ the same function gives $q \approx 38.3\,\mathrm{kPa}$ and $M \approx 0.735$, a jet at full speed low down, which is believable. At 10 km, the real standard-atmosphere density is about $0.414\,\mathrm{kg/m^3}$, so this simple exponential model is about 9% low there: fine for a first model, and a reason to switch to a table (last lesson) later. Octave runs the function and prints the same numbers.
:::

## The rules of the subset

Here is the catch. Because the code is translated ahead of time, it must be code that *can* be translated into plain C. MathWorks calls the allowed part of the language the **[[code-generation subset|codegen-subset]]**. It is most of MATLAB's math, with rules that come from how C works.

**Every variable has a fixed type and a fixed size.** In ordinary MATLAB, a variable can start as a number and later become a string, or grow from 1 element to 1,000. In C, a variable is declared once, as a `double` or an array of exactly 3 `double`s, and stays that way. So the block works out each variable's **class** (double, single, int32, logical…), its **size**, and whether it is real or complex from its first assignment, and then holds you to it.

```matlab
function y = fcn(u)
y = 0;            % y is now a 1x1 real double, for good
if u > 0
    y = [u u];    % error: y cannot become 1x2
end
```

The fix is to give `y` the right size from the start, `y = zeros(1, 2);`, so both branches agree. The block also insists that every output is assigned on every path through the code, because C cannot return a value that was never set.

**Sizes need an upper bound.** A variable *can* change size if you declare it variable-size, but for flight code it must have a known maximum, so that its memory can be **[[set aside in advance|static-memory]]**. A list that may grow forever is out.

**Some language features have no C equivalent.** `eval` runs a string as code, which needs the whole MATLAB interpreter at run time. **[[Dynamic field names|dynamic-fields]]** like `s.(name)`, where `name` is only known while running, need structs that change shape. Cell arrays and structs whose layout changes at run time are ruled out for the same reason.

**Some functions have no code-generation support.** Anything that draws (`plot`, `figure`), most file and interactive functions, and many toolbox functions cannot be turned into C. MathWorks marks each function's page with whether it supports code generation, under a heading about C/C++ code generation.

::: key
Name three MATLAB constructs to keep out of a MATLAB Function block bound for flight code: Variable-size data without an upper bound (newer releases can generate it with dynamic memory allocation, which flight code forbids), cell arrays or structs whose fields change at runtime, dynamic field names and eval, and calls to functions with no code-generation support, such as plotting and most file functions: in simulation they run as extrinsic calls back into MATLAB, and the generated code leaves them out.
:::

::: warning The same code, a different answer
In MATLAB, `sqrt(-4)` quietly returns the complex number `0 + 2i`. In a MATLAB Function block, a variable that started real must stay real, so taking the square root of a negative real number stops the simulation with a domain error that suggests `sqrt(complex(x))`. That is a feature: on a flight computer a negative number under a square root is almost always a bug upstream. Guard against it on purpose, for example `sqrt(max(x, 0))`, and ask why it went negative.
:::

::: example Memory between steps: a four-sample moving average
A block is called once per time step. To remember something from one call to the next, you use a **[[persistent variable|persistent]]**, which keeps its value between calls:

```matlab
function y = movavg4(u)
% Average of the last four input samples
persistent buf
if isempty(buf)
    buf = zeros(4, 1);                     % fixed size, fixed type
end
buf = [u; buf(1:3)];                       % newest first, oldest dropped
y = sum(buf) / 4;
```

Feed it the samples $2, 4, 6, 8, 10$.

**Call 1.** `buf` is empty, so it becomes four zeros. Then it becomes $[2, 0, 0, 0]$, and $y = 2/4 = 0.5$.

**Call 2.** $[4, 2, 0, 0]$, so $y = 6/4 = 1.5$.

**Call 3.** $[6, 4, 2, 0]$, so $y = 12/4 = 3$.

**Call 4.** $[8, 6, 4, 2]$, so $y = 20/4 = 5$.

**Call 5.** $[10, 8, 6, 4]$ — the $2$ has fallen off the end — so $y = 28/4 = 7$.

**Sanity check.** Once the buffer is full, the output is the middle of the last four inputs: the average of 4, 6, 8 and 10 is 7, which is right. Notice the code obeys the subset: `buf` is always $4 \times 1$. Octave gives $0.5, 1.5, 3, 5, 7$.
:::

## Calling out to MATLAB: coder.extrinsic

Sometimes you need a function the subset does not allow during simulation: an old analysis routine full of `eval`, say, or a quick diagnostic plot. You can declare it **extrinsic** with `coder.extrinsic`. The block then does not translate that call. During simulation it hands the call to MATLAB, and in generated code the call does not appear.

```matlab
function rho = fcn(h)
coder.extrinsic('legacy_density');   % run in MATLAB, not compiled
rho = 0;                             % fixes rho as a real 1x1 double
rho = legacy_density(h);             % the result is converted to that type
```

Two things to notice. First, the value coming back from MATLAB has no known type, so you assign the output variable first (`rho = 0`) to tell the block what to convert it into. Second, the extrinsic call is not part of the generated code, so flight software built from this block cannot compute `rho` this way. Extrinsic calls are for simulation-only helpers such as plots and logging, never for something the flight code needs.

## The Interpreted MATLAB Function block

The **Interpreted MATLAB Function** block takes a MATLAB expression in its **MATLAB function** parameter, such as `legacy_density(u)` or `sin(u(1)) * u(2)`, where `u` stands for the block's single input. At every time step, Simulink stops, hands the input to the MATLAB **[[interpreter|interpreter]]**, waits for the answer, and carries on. You tell it the output's size with its **Output dimensions** parameter.

That design has three consequences.

1. **Anything MATLAB can do, it can do.** No subset. `eval`, strings that grow, any toolbox function.
2. **It is slow.** Crossing from the compiled simulation into MATLAB and back costs time on every call. A model that takes a million steps pays that cost a million times, and the block is often the slowest thing in the model.
3. **It cannot be code-generated.** There is no MATLAB interpreter on a flight computer, so Simulink Coder cannot build C from a model that contains one. The model is stuck in simulation.

It has one input port and one output port, with vectors used to carry several values. Treat it as a stepping stone: prove an idea with it, then move the logic into a MATLAB Function block or into blocks.

::: key
MATLAB Function block versus Interpreted MATLAB Function: The MATLAB Function block supports the code-generation subset and compiles, so it can be deployed. The Interpreted block calls back into MATLAB at each step, which is slower and cannot be code-generated at all.
:::

## Choosing, on a real team

| Question | MATLAB Function | Interpreted MATLAB Function |
|---|---|---|
| Language allowed | Code-generation subset | All of MATLAB |
| When the code is prepared | Once, before the run | Every time step, by the interpreter |
| Speed | Compiled, fast | Slow |
| Inputs and outputs | Any number of ports | One input, one output |
| Code generation | Yes | No |
| Typical use | Flight logic, air data, small algorithms | Prototypes and quick checks |

Many GNC teams write their algorithms in MATLAB first, as plain functions they can test from scripts. When those functions stay inside the subset, the same file can be called from a MATLAB Function block and turned into flight code. Writing in the subset from day one saves a painful rewrite later. The **[[%#codegen|codegen-pragma]]** directive at the top of such a file asks the MATLAB editor to check the subset rules while you type.

::: warning Do not use the block to hide a diagram
A 300-line MATLAB Function block is a model nobody can review as a model. Signal names, data types and the flow of information disappear inside code. Keep blocks short and single-purpose, like the air-data example, and keep the structure of the system in the diagram where the team can see it.
:::

## Check yourself

::: check
A colleague's MATLAB Function block has `x = 0;` near the top and later `x = 'safe mode';`. Why does it fail, and how would you fix it?
:::

::: answer
In the code-generation subset every variable keeps the class and size of its first assignment. `x` starts as a 1×1 double, so it cannot later become a 1×9 character array. Use a different variable for the text, or better, represent the mode as a number or an enumeration, which is what flight code would do anyway.
:::

::: check
Feed the moving-average block the samples $5, 5, 5, 5, 9$. What are the five outputs?
:::

::: answer
Call 1: $[5, 0, 0, 0]$, $y = 5/4 = 1.25$. Call 2: $[5, 5, 0, 0]$, $y = 2.5$. Call 3: $[5, 5, 5, 0]$, $y = 3.75$. Call 4: $[5, 5, 5, 5]$, $y = 5$. Call 5: $[9, 5, 5, 5]$, $y = 24/4 = 6$. The first three are low because the buffer started with zeros; that start-up transient is worth knowing about in any filter.
:::

::: check
Use the air-data function for $v = 300\,\mathrm{m/s}$ at $h = 5000\,\mathrm{m}$. Find $q$ and $M$.
:::

::: answer
$\rho = 1.225\,e^{-5000/8500} = 1.225\,e^{-0.588} \approx 0.680\,\mathrm{kg/m^3}$. $T = 288.15 - 32.5 = 255.65\,\mathrm{K}$, so $a = \sqrt{1.4 \times 287.05 \times 255.65} \approx 320.5\,\mathrm{m/s}$. Then $q = 0.5 \times 0.680 \times 300^2 \approx 30{,}600\,\mathrm{Pa}$, about $30.6\,\mathrm{kPa}$, and $M = 300/320.5 \approx 0.936$.
:::

::: check
A model runs in 4 s. You add an Interpreted MATLAB Function block and it takes 90 s. Your lead wants to generate C code from it next month. What do you recommend?
:::

::: answer
Replace it. The Interpreted block calls MATLAB on every step, which explains the slowdown, and it cannot be code-generated at all, so it blocks next month's plan. Move the expression into a MATLAB Function block (checking that everything it calls is in the code-generation subset) or build it from ordinary blocks. Rerun and compare the outputs to the interpreted version, to be sure the move changed nothing.
:::

::: check
Why is it wrong to use `coder.extrinsic` to call a function that computes a guidance command?
:::

::: answer
An extrinsic call runs in MATLAB only during simulation and is left out of generated code. The simulation would look correct, but the flight code would never compute the guidance command. Extrinsic calls are for simulation-only helpers such as plots or logging. Anything the vehicle needs must be written inside the code-generation subset.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| MATLAB Function block | MATLAB code compiled into the model | Code-generation subset; can become flight code |
| Code-generation subset | The part of MATLAB that can become C | Fixed class and size per variable, bounded sizes |
| Not in the subset | Constructs with no C equivalent | `eval`, runtime dynamic field names, unbounded sizes, `plot` and most file functions |
| `persistent` | Memory between time steps | Initialize once with `isempty` |
| `coder.extrinsic` | Call MATLAB during simulation only | Pre-assign the output; absent from generated code |
| Interpreted MATLAB Function | Calls MATLAB every step | Slow, one input and one output, never code-generated |

A MATLAB Function block, a lookup table and a Gain all read numbers from somewhere: a gain, a table, a limit. The next and last lesson of this module asks where those parameters should live, in the base workspace or behind a mask, and how to read the Diagnostic Viewer when a model refuses to run.

::: context user-defined The rest of the shelf
The User-Defined Functions sub-library holds every block whose behavior you write yourself. Besides the two in this lesson it has the **Fcn** block, for a one-line math expression; the **MATLAB System** block, for code written as a System object class; and the **S-Function** blocks, which wrap hand-written C, C++ or other code. S-functions come back in the code-generation module, where they are the standard way to bring an existing C library into a model.
:::

::: context codegen-subset A subset that grew over time
The subset exists because of MATLAB Coder, the MathWorks product that turns MATLAB functions into C and C++, and it is shared by the MATLAB Function block. Early versions allowed only fixed-size arrays. Later releases added variable-size arrays, dynamic memory allocation, some classes and more functions each year. So the exact boundary moves. The page for each MATLAB function says whether it supports code generation and with what limits, and that page, for your release, is the authority.
:::

::: context static-memory Why flight code avoids growing memory
On a desktop, a program asks the operating system for more memory whenever it needs it. Flight software is usually written so that it never does this after start-up. Every array has a size fixed before launch, so the worst-case memory use is known exactly, cannot fail halfway through a flight, and takes the same time on every step. Coding standards for safety-critical software, such as the MISRA C guidelines and the "Power of 10" rules written at NASA's Jet Propulsion Laboratory, discourage or forbid dynamic allocation after initialization for this reason.
:::

::: context dynamic-fields Why a name known only at run time is a problem
In C, a struct's fields are fixed when the program is compiled: the compiler turns `s.mass` into "the 8 bytes at offset 16". There is no step at run time that looks up a field by its name. So `s.(name)` works in the block only when `name` is a constant the translator can see. When the name comes from data, the translator cannot choose an offset, and the code is rejected. Flight code usually meets this by using an index or a `switch` on a fixed set of cases.
:::

::: context persistent A box that survives between calls
Ordinary variables in a function are created fresh on each call and thrown away at the end. A persistent variable lives in a box outside the call. The first call finds the box empty and fills it; later calls find what the last one left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="24" font-size="11" fill="#1f2a44">call 4</text>
  <rect x="70" y="10" width="40" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="110" y="10" width="40" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="150" y="10" width="40" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="190" y="10" width="40" height="22" fill="#fff" stroke="#1f2a44"/>
  <text x="90" y="25" font-size="12" fill="#1f2a44" text-anchor="middle">8</text>
  <text x="130" y="25" font-size="12" fill="#1f2a44" text-anchor="middle">6</text>
  <text x="170" y="25" font-size="12" fill="#1f2a44" text-anchor="middle">4</text>
  <text x="210" y="25" font-size="12" fill="#1f2a44" text-anchor="middle">2</text>
  <text x="246" y="25" font-size="11" fill="#1f2a44">y = 5</text>
  <line x1="150" y1="36" x2="150" y2="62" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="150,68 145,60 155,60" fill="#6c7a93"/>
  <text x="160" y="56" font-size="11" fill="#6c7a93">shift right, new sample in front</text>
  <text x="20" y="90" font-size="11" fill="#1f2a44">call 5</text>
  <rect x="70" y="76" width="40" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="110" y="76" width="40" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="150" y="76" width="40" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="190" y="76" width="40" height="22" fill="#fff" stroke="#1f2a44"/>
  <text x="90" y="91" font-size="12" fill="#1f2a44" text-anchor="middle">10</text>
  <text x="130" y="91" font-size="12" fill="#1f2a44" text-anchor="middle">8</text>
  <text x="170" y="91" font-size="12" fill="#1f2a44" text-anchor="middle">6</text>
  <text x="210" y="91" font-size="12" fill="#1f2a44" text-anchor="middle">4</text>
  <text x="246" y="91" font-size="11" fill="#1f2a44">y = 7</text>
  <text x="250" y="126" font-size="12" fill="#b4232c">2 dropped</text>
  <line x1="236" y1="118" x2="246" y2="118" stroke="#b4232c" stroke-width="1.5"/>
</svg>
```

In generated C, a persistent variable becomes a piece of the model's state that the step function reads and writes.
:::

::: context interpreter Reading code line by line
An **interpreter** reads a program and carries it out as it goes, figuring out what each line means on the spot. That is why MATLAB at the Command Window can accept anything you type. A **compiler** translates the whole program first, once, into instructions the processor runs directly. Translation takes time up front but lets the result run fast and without the translator present. Modern MATLAB actually compiles much of its code on the fly behind the scenes, but the Interpreted MATLAB Function block still pays the cost of leaving the simulation and entering MATLAB on every step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="110" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="42" font-size="11" fill="#1f2a44" text-anchor="middle">simulation step</text>
  <rect x="230" y="20" width="120" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="42" font-size="11" fill="#1f2a44" text-anchor="middle">MATLAB interpreter</text>
  <path d="M120,30 L224,30" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="230,30 222,26 222,34" fill="#b4232c"/>
  <path d="M230,48 L126,48" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="120,48 128,44 128,52" fill="#b4232c"/>
  <text x="175" y="72" font-size="11" fill="#b4232c" text-anchor="middle">every step: out and back</text>
  <rect x="10" y="90" width="340" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">MATLAB Function block: compiled into the step itself</text>
</svg>
```
:::

::: context codegen-pragma A comment that turns on checking
`%#codegen` is written as a comment, so MATLAB ignores it when running the file. The MATLAB Code Analyzer reads it as a request: check this file against the code-generation rules and underline what breaks them. Code inside a MATLAB Function block is always checked this way, so the directive is not needed there. For a function in its own .m file that you plan to call from the block, adding it gives early warnings while you edit.
:::
