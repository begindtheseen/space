---
id: l09-scripts-functions-workspaces
title: Scripts, functions and workspaces
minutes: 18
covers:
  - 'Scripts versus functions and the base workspace: a classic interview question'
---

Picture two ways to get dinner made. In the first, you cook in your own kitchen. You use whatever is on the counter, and whatever you chop and spill stays there when you are done. In the second, you walk up to a food truck. You hand your order through the window, the cook works in a kitchen you cannot see, and a finished meal comes back out. The truck's cook cannot reach your counter, and when the truck drives off, its mess goes with it.

A MATLAB **script** is the home kitchen. A MATLAB **function** is the food truck. The counters are called **workspaces**: the set of variables a piece of code can see and change. In lesson 8 you wrote scripts that loaded a file, computed and saved. Every variable those scripts made landed on the same counter as the variables you typed at the prompt. That was convenient, and it is also where a whole family of bugs comes from.

"What is the difference between a script and a function in MATLAB?" is a [[classic interview question|interview-question]] for GNC and analysis roles. The short answer is one sentence about workspaces. This lesson builds that sentence from the ground up, shows the error it explains, and ends with how working engineers split their code between the two.

## Scripts: commands saved in a file

A **script** is a `.m` file that holds MATLAB commands, one after another, with no `function` line at the top. Running it — by typing its name in the Command Window, or pressing Run in the Editor — does exactly what typing those lines at the prompt would do.

```matlab
% setup_constants.m  (a script)
g0 = 9.80665;      % m/s^2, standard gravity
m  = 549054;       % kg, Falcon 9 lift-off mass
```

Type `setup_constants` and press Enter. Now look at the Workspace panel from lesson 1: `g0` and `m` are sitting there. The Command Window has its own workspace, the **[[base workspace|base-workspace]]**, and a script run from the prompt reads and writes that workspace directly. It sees every variable already there, can change any of them, and leaves every variable it makes behind.

That is useful when you are exploring: run a script, then poke at its results at the prompt. It is also risky. A script that happens to use a variable named `t` overwrites your `t`. A script that starts with `clear` wipes everything you had. And a script can work only because some variable was left in the workspace by something you ran an hour ago — then fail for a colleague who starts fresh.

A script's file name is also its name for running, so it must be a valid MATLAB name: start with a letter, then letters, digits or underscores. `hop-analysis.m` cannot be run by name, because MATLAB reads the dash as a minus sign. Rename it `hop_analysis.m`.

## Functions: a kitchen of their own

A **function** is a `.m` file whose first line of code starts with the keyword `function`. That line, the **function declaration**, names the outputs, the function and the inputs.

```matlab
function [dv, ratio] = stage_dv(isp, m0, mf)
%STAGE_DV  Ideal velocity change of one stage (rocket equation).
%   isp in s, m0 and mf in kg; dv in m/s.
    g0 = 9.80665;                 % m/s^2, standard gravity
    ratio = m0 / mf;              % mass ratio
    dv = isp * g0 * log(ratio);   % log is the natural logarithm
end
```

Read the declaration aloud: "function, outputs dv and ratio, equals stage d v of isp, m nought and m f." Save it in a file named `stage_dv.m` — the file name must [[match the function name|file-name-match]]. The comment lines right after the declaration are the function's help text: `help stage_dv` prints them.

The body computes the **[[rocket equation|rocket-equation]]**, $\Delta v = I_{sp}\, g_0 \ln(m_0 / m_f)$. Here $\Delta v$ ("delta v") is the change in speed the stage can give, $I_{sp}$ ("I s p") is the engine's specific impulse in seconds, $g_0$ ("g nought") is standard gravity, and $m_0$ and $m_f$ are the stage's mass full and empty. MATLAB's `log` is the natural logarithm, $\ln$.

You call a function with its inputs in parentheses and catch its outputs in square brackets:

```matlab
[dv, r] = stage_dv(348, 111670, 19000)
%   dv = 6.0443e+03
%   r  = 5.8774
dv_only = stage_dv(348, 111670, 19000)     % ask for fewer outputs: you get the first
[~, r2] = stage_dv(348, 111670, 19000)     % the tilde skips an output you don't want
```

Now the important part. When you call `stage_dv`, MATLAB creates a brand-new, empty workspace for that call. It puts the three input values into it under the names `isp`, `m0` and `mf`. The body runs there, making `g0`, `ratio` and `dv`. When the function reaches `end` (or a `return` statement, which leaves early), MATLAB copies the outputs you asked for back to the caller — and throws the whole workspace away.

So after the call, the base workspace holds `dv` and `r`, the names *you* chose. It does not hold `g0`, `ratio` or `isp`. They lived on the food truck.

::: example Second-stage delta-v
Take a Falcon 9-class second stage: 4,000 kg dry and 92,670 kg of propellant, carrying a 15,000 kg payload, with a vacuum specific impulse of 348 s. How much speed can it add?

The full mass is everything at ignition: $m_0 = 4000 + 92670 + 15000 = 111670$ kg. The empty mass is everything left at burnout: $m_f = 4000 + 15000 = 19000$ kg. That is the call above.

Step by step, the function computes the mass ratio $111670 / 19000 \approx 5.877$, takes its natural log, $\ln 5.877 \approx 1.771$, and multiplies: $348 \times 9.80665 \times 1.771 \approx 6044$ m/s.

Sanity check: reaching low Earth orbit takes about 9.4 km/s in total once losses are counted, and the first stage supplies a good share of that. A second stage adding about 6 km/s is the right size. And a mass ratio near 6 means the stage is mostly propellant, as lesson 7's propellant fractions said.
:::

## The rule, and the error it explains

Put the two pictures together and you have the interview answer.

::: key
A script runs in the caller workspace (usually base), so it sees and mutates whatever is there. A function has its own workspace and communicates only through arguments and return values, which is why a function cannot see a variable a script defined.
:::

"Caller workspace (usually base)" deserves one more sentence. A script always runs in the workspace of *whatever ran it*. From the prompt, that is the base workspace. If a function runs a script, the script's lines execute inside that function's workspace, and they see and change that function's variables. You can picture every running piece of code as a plate on a stack: the base workspace at the bottom, and a new workspace on top for each function call in progress. That stack is the **[[call stack|call-stack]]**.

::: example A function that cannot see g0
Here is a second function, written carelessly. It uses `g0` without being given it:

```matlab
function W = weight_newtons(m)
    W = m * g0;
end
```

Run `setup_constants` first, so `g0` and `m` sit in the base workspace. At the prompt, `m * g0` works and gives $549054 \times 9.80665 \approx 5.384 \times 10^6$ N. But calling the function fails:

```matlab
setup_constants
W = weight_newtons(m)
%   Unrecognized function or variable 'g0'.
```

Step by step: the call creates a fresh workspace for `weight_newtons`. The only thing put into it is the input, named `m` inside. The line `W = m * g0` looks for `g0` in *that* workspace, does not find it, looks for a function named `g0`, does not find one either, and stops with an error. The `g0` in the base workspace is on a counter this kitchen cannot reach.

The fix is to hand it in through the window:

```matlab
function W = weight_newtons(m, g0)
    W = m * g0;
end
```

Now `weight_newtons(m, g0)` returns about $5.384 \times 10^6$ N, or 5.38 MN. Sanity check: a Falcon 9 first stage's nine engines make about 7.6 MN at sea level, so thrust over weight is $7.6 / 5.38 \approx 1.4$. The rocket can lift off, with a sensible margin, so the number makes sense.
:::

::: warning global is not the fix
MATLAB lets you write `global g0` in the base workspace and again inside a function, and then both share one `g0`. It makes the error go away and makes a worse problem. Now any function anywhere can change `g0`, and a reader of `weight_newtons(m)` cannot tell from the call what it depends on. Tests become order-dependent: one test sets the global, and the next quietly inherits it. Pass values as arguments. If there are many, pass one struct of parameters, as in lesson 7. [[Flight-software rules|flight-software-scope]] push the same way.
:::

## Arguments are copies

Python taught you that passing a list to a function hands over the *same* list, so the function can change it and the caller sees the change. MATLAB ordinary arrays work the other way: a function gets its own copy of every input.

```matlab
function v = zero_first(v)
    v(1) = 0;
end
```

```matlab
data = [9.79 9.80 9.81];
out  = zero_first(data);
disp(data)
%   9.7900   9.8000   9.8100
disp(out)
%        0   9.8000   9.8100
```

The function changed its own `v`, and the caller's `data` is untouched. If you want the change, assign the output back: `data = zero_first(data);`. This is called **pass by value**: the function receives the value, not a link to your variable.

Does that mean MATLAB copies a million-element array on every call? No. MATLAB uses **[[copy-on-write|copy-on-write]]**: the function first shares the caller's data, and a real copy is made only at the moment the function writes to it. A function that only reads its inputs costs no copy at all.

::: warning Python habits that break here
Two Python habits fail silently in MATLAB. First, a function that "updates a list in place" and returns nothing: in MATLAB the caller never sees the update. Always return the changed value and assign it. Second, expecting a function to read a module-level constant: MATLAB functions have no such outer scope. Everything a function uses comes in through its inputs or is made inside it. The one family of MATLAB types that does share like Python objects — **handle** classes — is lesson 12.
:::

## How MATLAB finds a name

When you type a name like `stage_dv`, MATLAB has to decide what it means. It checks, in roughly this order: is it a variable in the current workspace? Is it a function defined in the current file? Is it a function or script in the **current folder**? Is it one on the **[[search path|search-path]]**, the list of folders MATLAB looks through?

Variables come first. So if you once wrote `sum = 0` at the prompt, then `sum([1 2 3])` no longer adds — it tries to index your variable `sum` and errors. The same happens if you save a script as `alpha.m` or `input.m`: it hides the built-in function of the same name. Run `which name` to see which one MATLAB will use, and `clear sum` to remove a variable that is hiding a function.

## Which to use: the working pattern

Here is how most analysis code on a GNC team is organized.

- **Functions** hold every calculation you will use twice or want to test: the rocket equation, a frame rotation, an RMS of a signal. Each takes inputs, returns outputs and touches nothing else. You can test one by calling it with known numbers, as you did above.
- **A script** sits on top as the **driver**: it loads the data, sets the parameters, calls the functions in order, prints a summary with `fprintf`, and saves results. It reads like a recipe for the whole analysis.

Since release R2016b, a script can also hold **local functions**, defined at the bottom of the script file after all its commands. Each local function still gets its own workspace — being in the script's file does not let it see the script's variables. Lesson 10 covers local functions and their cousins.

Before sharing a driver script, test it from a clean start: `clear`, then run it. If it fails, it was relying on something left in the workspace. That one habit catches the "works on my machine" bug before your teammate does.

## Check yourself

::: check
A file `hop_setup.m` contains only the two lines `dt = 0.01;` and `n = 500;`. You type `hop_setup` at the prompt, then `t = (0:n-1)*dt;`. Does the second line work? What would change if the file began with `function hop_setup()`?
:::

::: answer
Yes. `hop_setup.m` is a script, so it runs in the base workspace and leaves `dt` and `n` there; the next line finds them and builds a 500-sample time vector from 0 to $499 \times 0.01 = 4.99$ s. If the file began with `function hop_setup()`, it would be a function: `dt` and `n` would be made in its own workspace and thrown away when it returned, and the second line would fail with an unrecognized-variable error for `n`. To keep the values you would return them: `function [dt, n] = hop_setup()`, called as `[dt, n] = hop_setup();`.
:::

::: check
State in your own words why `global` is a poor fix for "my function cannot see my variable", and give the better fix.
:::

::: answer
`global` removes the error by making one variable reachable from everywhere, so any function can read or change it without the call showing it. That hides what a function depends on, lets one piece of code quietly break another, and makes results depend on what ran before. The better fix is to pass the value in as an argument — or, when there are many values, one struct of parameters — so every dependency is visible at the call.
:::

::: check
`function a = bump(a)` contains the single line `a = a + 1;`. After `x = 5; bump(x);` what is `x`? After `x = bump(x);`?
:::

::: answer
After `bump(x);` alone, `x` is still 5. The function received a copy of the value, added 1 to its own `a`, and returned 6 — but the call did not assign the result to anything, so it was lost. (With no semicolon it would have been shown as `ans = 6`.) After `x = bump(x);`, `x` is 6, because the returned value was assigned back to `x`.
:::

::: check
A function `f` calls a script `g.m`, and `g.m` contains the line `k = 10;`. Where does `k` end up, and does the base workspace see it?
:::

::: answer
A script runs in the workspace of whatever ran it. Here that is `f`'s workspace, so `k = 10` is created there, as if the line were written inside `f`. The base workspace never sees it, and `k` disappears when `f` returns (unless `f` returns it as an output). This is why the rule says a script runs in the *caller* workspace — which is only "usually base".
:::

::: check
A colleague's analysis stopped working after she saved a new helper script as `max.m` in her project folder. What is going on, and how would she confirm it?
:::

::: answer
Her script's name hides MATLAB's built-in `max`. MATLAB looks in the current folder before the rest of the search path, so every `max(...)` in her code now runs her script instead of the built-in function — and a script cannot take inputs, so the calls fail. `which max` would show the path to her file instead of the built-in. Renaming the file to something unique, such as `hop_max_helper.m`, fixes it.
:::

## Summary

| Idea | Meaning | Fact to remember |
| --- | --- | --- |
| workspace | the set of variables a piece of code can see | the Workspace panel shows the current one |
| base workspace | the Command Window's workspace | scripts run from the prompt use it |
| script | `.m` file of commands, no `function` line | runs in the caller workspace; sees and changes everything there |
| function | `.m` file starting `function [out] = name(in)` | fresh workspace per call, deleted on return |
| call syntax | `[a, b] = f(x, y)`; `[~, b] = f(x, y)` | fewer outputs is fine; `~` skips one |
| pass by value | inputs are copies (copy-on-write) | assign the output back to keep a change |
| `global` | shares a variable across workspaces | avoid; pass arguments or a parameter struct |
| name lookup | variable, then functions: this file, current folder, path | `which name` shows the winner |
| pattern | functions for calculations, one driver script on top | test the driver after `clear` |

Next comes lesson 10, which opens up the function family: local and nested functions in one file, one-line anonymous functions, function handles you can pass around like values, and the closures that remember the workspace where they were made.

::: context interview-question Why interviewers ask it
The question sounds like trivia, but the answer shows whether a candidate understands scope — which variables a piece of code can see. Scope bugs are some of the most common in analysis code: a result that depends on a leftover variable, or a function silently using the wrong value. A good answer names the workspaces, gives the "function cannot see my variable" error as the consequence, and says what to do instead of reaching for `global`.
:::

::: context base-workspace The workspace with a name
The base workspace is the only workspace MATLAB gives a fixed name, `'base'`. Functions such as `evalin('base', ...)` and `assignin('base', ...)` let code reach into it from anywhere. They exist mainly for tools and GUIs, and using them in analysis code has the same drawbacks as `global`. Simulink models also read parameters from the base workspace by default, a habit the Simulink modules later replace with data dictionaries.
:::

::: context file-name-match When the names disagree
If the file is `stage_dv.m` but the declaration says `function dv = rocket(...)`, MATLAB goes by the file name: you call it as `stage_dv`, and the Editor's code checker flags the mismatch. Keep the two identical so nobody has to wonder. One function file can hold more functions below the first, but only the first can be called from outside the file.
:::

::: context rocket-equation Where the formula comes from
The rocket equation is usually credited to Konstantin Tsiolkovsky, who published it in 1903. A rocket speeds up by throwing mass backward, and each kilogram of propellant pushes a little less as the vehicle gets lighter; adding up those pushes gives the logarithm. Specific impulse times $g_0$ is the engine's exhaust speed: $348 \times 9.80665 \approx 3413$ m/s here.
:::

::: context call-stack Plates on a stack
Each function call adds a workspace on top of the stack, and each return removes it. Only the top workspace is visible to the running line. When you stop at a breakpoint inside a function, the Workspace panel switches to that function's workspace, and the `dbstack` command lists the whole stack.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="116" width="200" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="160" y="137" font-size="12" fill="#1f2a44" text-anchor="middle">base: g0, m, data</text>
  <rect x="60" y="78" width="200" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="160" y="99" font-size="12" fill="#1f2a44" text-anchor="middle">stage_dv: isp, m0, mf, ratio</text>
  <rect x="60" y="40" width="200" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="160" y="61" font-size="12" fill="#1f2a44" text-anchor="middle">a function it calls</text>
  <text x="272" y="61" font-size="12" fill="#b4232c">running now</text>
  <line x1="300" y1="140" x2="300" y2="80" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="300,72 295,82 305,82" fill="#6c7a93"/>
  <text x="310" y="115" font-size="11" fill="#6c7a93">calls</text>
  <text x="160" y="24" font-size="12" fill="#1f2a44" text-anchor="middle">each call adds a plate; return removes it</text>
</svg>
```
:::

::: context flight-software-scope Smallest possible scope
NASA's Jet Propulsion Laboratory published ten coding rules for safety-critical software, "The Power of Ten", written by Gerard Holzmann in 2006. Rule 6 says data objects must be declared at the smallest possible level of scope. The reasoning is the same as here: the fewer places that can touch a value, the fewer places a wrong value can come from. Good MATLAB habits now carry straight over to the C++ you write for flight.
:::

::: context copy-on-write Share until someone writes
When you pass `data` to a function, MATLAB at first lets both names point at the same numbers in memory. Only if the function assigns into its copy does MATLAB make a private duplicate for it. So reading a huge input is free, and the caller's data is still protected.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">on call: shared</text>
  <text x="270" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">after v(1) = 0: copied</text>
  <text x="20" y="42" font-size="12" fill="#1d6fd1">data</text>
  <text x="20" y="92" font-size="12" fill="#1d6fd1">v</text>
  <rect x="80" y="52" width="90" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="125" y="71" font-size="11" fill="#1f2a44" text-anchor="middle">9.79 9.80 9.81</text>
  <line x1="50" y1="38" x2="80" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="36" y1="88" x2="80" y2="74" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="42" font-size="12" fill="#1d6fd1">data</text>
  <text x="200" y="102" font-size="12" fill="#1d6fd1">v</text>
  <rect x="250" y="28" width="90" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="47" font-size="11" fill="#1f2a44" text-anchor="middle">9.79 9.80 9.81</text>
  <rect x="250" y="88" width="90" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="107" font-size="11" fill="#1f2a44" text-anchor="middle">0 9.80 9.81</text>
  <line x1="232" y1="38" x2="250" y2="42" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="216" y1="98" x2="250" y2="102" stroke="#1f2a44" stroke-width="1.5"/>
</svg>
```
:::

::: context search-path Where MATLAB looks for files
The search path is a list of folders, shown by the `path` command. MATLAB's own toolboxes are on it from the start; `addpath('my_tools')` adds a folder of yours for the session. The current folder is searched before the path, which is why a file saved there can hide a built-in function. On a team, a project file usually sets the path for everyone, so nobody's analysis depends on their personal setup.
:::
