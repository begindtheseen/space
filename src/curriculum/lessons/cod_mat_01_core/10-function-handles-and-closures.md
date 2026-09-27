---
id: l10-function-handles-and-closures
title: Local, nested and anonymous functions, and function handles
minutes: 21
covers:
  - Local, nested and anonymous functions; function handles; closures
---

Think about a TV remote. The remote is not the TV. It is a small thing you can hold, pass to a friend, or leave on the couch, and whoever presses its button makes the TV do something. A **function handle** in MATLAB is a remote for a function: a value you can store in a variable, hand to another function, and "press" later to run the code it points at.

Now think about a sticky note on the fridge that says "oven at 180 degrees". You wrote it this morning. If someone changes the oven dial at noon, the note still says 180. It recorded what was true when you wrote it. That sticky note is the second big idea of this lesson: an anonymous function in MATLAB remembers the values it saw at the moment it was made.

The last lesson showed that every function has its own **workspace** — its own private set of variables — and talks to the outside only through inputs and outputs. This lesson shows the other ways to write functions in MATLAB and how to pass them around. That matters on a real GNC team every day. You hand the equations of motion of a spacecraft to the solver `ode45`, a **[[root-finder|root-finder]]** like `fzero` gets the equation to solve, and an optimizer gets the cost to minimize, each as a function handle. The numbers the equations need — a mass, a drag coefficient, a controller gain — ride along inside the handle as a **[[closure|closure-word]]**.

## Four places a function can live

You already know the **main function**: the first function in a file such as `dvBudget.m`, whose name matches the file name. It is the one the rest of your code can call. MATLAB has three more kinds.

### Local functions

A **local function** is any extra function written in the same file, after the main one. It is a helper that only code in that file can see. Here is a small file that adds up a list of engine burns, clamping each one between 0 and 50 m/s:

```matlab
% dvBudget.m
function total = dvBudget(burns)
    % Main function: the only one callers outside this file can see.
    total = 0;
    for k = 1:numel(burns)
        total = total + clampBurn(burns(k));
    end
end

function dv = clampBurn(dv)
    % Local function: visible only inside dvBudget.m.
    dv = min(max(dv, 0), 50);
end
```

```matlab
dvBudget([12 -3 80 7.5])
% ans = 69.5000
clampBurn(3)
% Error: Unrecognized function or variable 'clampBurn'.
```

Check the sum by hand: $12 + 0 + 50 + 7.5 = 69.5$. The $-3$ was raised to $0$ and the $80$ was cut to $50$, so the helper did its job. And from the Command Window, `clampBurn` does not exist. That is the point. A local function is private, so you can rename it or change it without breaking any code in another file.

Each local function still gets its own workspace, exactly like the main one. `clampBurn` cannot see `total` or `k`. Since R2016b, a script file can have local functions too; they go at the very end of the script.

### Nested functions

A **nested function** is written *inside* the body of another function, before that function's `end`. The difference from a local function is big: a nested function can read and change the variables of the function around it, which is called its **parent**. Its workspace sits inside the parent's workspace, [[like a room inside a house|nested-rooms]].

```matlab
% makeCounter.m
function tick = makeCounter()
    count = 0;             % lives in the parent's workspace
    tick = @increment;     % a handle to the nested function

    function n = increment()
        count = count + 1; % changes the parent's variable
        n = count;
    end
end
```

We will come back to this file when we talk about closures. For now, notice the layout.

::: warning Every function needs its end
If a file has a nested function, every function in that file must finish with `end`, so MATLAB can tell where the parent stops. Leave one out and MATLAB reports a parse error. A nested function also cannot sit inside an `if` or a `for` block; put it directly in the parent's body.
:::

### Anonymous functions

An **anonymous function** is a one-line function with no file and no name of its own. You build it with the `@` sign, a list of inputs in parentheses, and one expression:

```matlab
sq = @(x) x.^2;        % read: "sq is the function of x that gives x squared"
sq(3)
% ans = 9
sq([1 2 3])
% ans = 1     4     9
```

Read `@(x)` aloud as "at x" or "the function of x". The body must be a single expression. There is no room for `if`, `for` or several statements. When you need those, write a local function and take a handle to it.

The `@` sign always gives you back a function handle. So `sq` above is not a number and not an array. It is a handle, and `class(sq)` answers `function_handle`.

::: key
Four homes for a function: the **main** function (first in its file, callable from anywhere), **local** functions (later in the same file, private to it, own workspace), **nested** functions (inside a parent, sharing the parent's workspace), and **anonymous** functions (one expression, built with `@(inputs) expression`, no file).
:::

## Function handles: functions you can pass around

Everything in MATLAB is a value you can store: numbers, strings, structs. A **function handle** makes a function into one of those values. You get a handle two ways:

- Put `@` in front of an existing function's name: `f = @sin` or `g = @dvBudget`.
- Build an anonymous function: `h = @(t) 3*t + 1`.

Calling a handle looks like calling a function. `f(pi/2)` gives `1`, because `f` points at `sin`. The older spelling `feval(f, pi/2)` does the same thing.

::: warning Calling a handle with no inputs
If a handle takes no inputs, as `c = @() rand` does, you must still write the parentheses: `c()`. Writing `c` alone does not call anything. It shows you the handle itself.
:::

Why is this useful? Because many MATLAB tools do a job *to a function*. A root-finder finds where a function equals zero. An integrator adds up the area under a function. An ODE solver steps a function forward in time. None of these tools knows your problem. You give them your problem as a handle.

The ones you will meet most:

| Tool | What you hand it | What it does |
|---|---|---|
| `fzero(f, x0)` | a function of one number | finds an $x$ near `x0` where $f(x) = 0$ |
| `integral(f, a, b)` | a function of one variable | the area under $f$ from $a$ to $b$ |
| `ode45(f, tspan, x0)` | a function `f(t, x)` giving $\dot{x}$ | steps a differential equation forward in time |
| `arrayfun(f, A)` | a function of one element | applies `f` to every element of `A` |

In that table, $\dot{x}$ is read "x dot" and means the rate of change of $x$ with time. A **[[differential equation|ode-meaning]]** is a rule for that rate, and `ode45` is MATLAB's workhorse for solving one.

::: warning Write anonymous functions with dot operators
`integral` does not call your function once per point. It calls it with a whole vector of points at a time, and expects a vector back. So `@(t) t^2` fails there (the matrix power of a vector is an error), while `@(t) t.^2` works. Lesson 4 said it: when in doubt, use `.*`, `./` and `.^` inside anonymous functions. The same habit keeps `sq([1 2 3])` above working.
:::

::: example When does a coasting sounding rocket land?
A **[[sounding rocket|sounding-rocket]]**'s motor burns out at a height of $h_0 = 3000\,\mathrm{m}$, moving straight up at $v_0 = 200\,\mathrm{m/s}$. Ignoring air drag, its height $t$ seconds later is

$$
h(t) = h_0 + v_0 t - \tfrac{1}{2} g t^2, \qquad g = 9.80665\,\mathrm{m/s^2}.
$$

It lands when $h(t) = 0$. Let `fzero` find that moment:

```matlab
g  = 9.80665;   % m/s^2
h0 = 3000;      % m
v0 = 200;       % m/s
h  = @(t) h0 + v0*t - 0.5*g*t.^2;   % height in m after t seconds

tLand = fzero(h, 40)                % start the search near 40 s
% tLand = 52.4530
```

**Step 1.** The three numbers are ordinary variables in the workspace.

**Step 2.** The anonymous function `h` uses them. It takes one input, `t`, and the three numbers ride along inside it.

**Step 3.** `fzero` calls `h` many times with trial values of `t`, narrowing in on the place where the answer crosses zero. The guess of 40 s only tells it where to start looking.

**Sanity check.** The rocket climbs until its speed runs out, which takes $v_0 / g = 200 / 9.80665 \approx 20.4\,\mathrm{s}$. At the top it is at $h_0 + v_0^2/(2g) \approx 5039\,\mathrm{m}$. Falling $5039\,\mathrm{m}$ from rest takes $\sqrt{2 \times 5039 / 9.80665} \approx 32.1\,\mathrm{s}$. And $20.4 + 32.1 = 52.5\,\mathrm{s}$, the same answer.
:::

Notice what did *not* happen. `fzero` has no idea what `g`, `h0` or `v0` are, and it never needed to. It only ever calls `h(t)` with one number. The handle carried everything else. That pattern — a function of one variable, with the rest of the problem packed inside — is the heart of the next section.

## Closures: what an anonymous function remembers

A **closure** is a function bundled together with the variables it needs from the place where it was made. In MATLAB, every anonymous function that mentions an outside variable is a closure.

The rule is short, and it is the one that trips up people coming from Python:

::: key
An anonymous function captures the values of the workspace variables it references, at the moment of creation. Later changes to those variables do not affect the handle, which surprises people expecting Python-style late binding.
:::

That is the sticky note from the start. MATLAB copies the *values* into the handle when the `@(...)` line runs. After that, the handle and the workspace have separate copies.

::: example Dynamic pressure at two altitudes
**Dynamic pressure** is $q = \tfrac{1}{2}\rho v^2$, the push of the air on a moving vehicle. Here $\rho$ (read "rho") is the air density in $\mathrm{kg/m^3}$ and $v$ is the speed in $\mathrm{m/s}$. Air at sea level has $\rho = 1.225\,\mathrm{kg/m^3}$; at $10\,\mathrm{km}$ it is about $0.4135\,\mathrm{kg/m^3}$.

```matlab
rho = 1.225;                 % kg/m^3, sea level
q = @(v) 0.5*rho*v.^2;       % Pa; rho is captured NOW
q(250)
% ans = 3.8281e+04

rho = 0.4135;                % kg/m^3, about 10 km up
q(250)
% ans = 3.8281e+04           <- unchanged: the handle kept 1.225

q = @(v) 0.5*rho*v.^2;       % rebuild the handle to capture the new rho
q(250)
% ans = 1.2922e+04
```

**Step 1.** When the first `q = ...` line runs, MATLAB copies the value $1.225$ into the handle.

**Step 2.** Changing `rho` in the workspace changes the workspace's copy only. `q(250)` still computes $0.5 \times 1.225 \times 250^2 = 38\,281.25\,\mathrm{Pa}$.

**Step 3.** Only rebuilding the handle picks up the new value: $0.5 \times 0.4135 \times 250^2 = 12\,921.875\,\mathrm{Pa}$.

**Sanity check.** The thin air at $10\,\mathrm{km}$ has about a third of sea-level density ($0.4135/1.225 \approx 0.34$), so the dynamic pressure should be about a third too: $38\,281 \times 0.34 \approx 12\,900\,\mathrm{Pa}$. It is.
:::

Python behaves differently, and you learned why in the Python module: a Python closure looks up the variable's *name* when the function runs, not when it was made. That is called **[[late binding|late-binding]]**. Here is the classic test in both languages, making three functions in a loop:

```matlab
fs = cell(1, 3);
for i = 0:2
    fs{i+1} = @(x) i*x;      % each handle captures the current i
end
cellfun(@(f) f(10), fs)
% ans = 0    10    20
```

The Python version, `[lambda x: i*x for i in range(3)]`, gives `[20, 20, 20]`, because all three lambdas look up `i` after the loop has finished and find `2`. MATLAB gives `0 10 20`, because each handle took its own snapshot of `i` as the loop went by.

::: warning Change a parameter, rebuild the handle
If a script sets a gain, builds a handle, and later "retunes" the gain, the handle is still using the old gain. There is no error and no warning. The two fixes: rebuild the handle after every change, or make the parameter an input, as in `q = @(v, rho) 0.5*rho*v.^2`, so every call has to say which value it means.
:::

::: warning Define it before you capture it
A variable must already exist when the anonymous function is created. If `rho` does not exist yet, MATLAB assumes `rho` names a function, and the call fails later with an "Unrecognized function or variable" error — far from the line that caused it.
:::

::: note Why a snapshot is the safer choice
Snapshot capture means a handle's behavior is fixed the moment you make it. You can pass it to `ode45`, save it in a struct, or run it an hour later, and it will give the same answer for the same input. With late binding, the answer could depend on whatever some other line did to a variable in between. For numerical work that must be repeatable, frozen values are a feature. The cost is memory: if a handle captures a big array, the snapshot holds a copy of that data for as long as the handle exists.
:::

### Nested functions share instead of copying

Nested functions follow the opposite rule. A handle to a nested function does not take a snapshot. It keeps the parent's whole workspace alive and shares it. Go back to `makeCounter`:

```matlab
c = makeCounter();
c(); c();
c()
% ans = 3
d = makeCounter();
d()
% ans = 1
```

Each call to `makeCounter` makes a fresh parent workspace with its own `count`, starting at 0. The handle `c` keeps its workspace alive after `makeCounter` has returned, and every call to `c()` changes the shared `count`. So `c` has counted to 3 while the brand new `d` is at 1. This is the MATLAB twin of a Python closure that uses `nonlocal`.

::: key
Anonymous function: copies values at creation, and they never change. Nested function handle: shares the parent's live variables, so changes stick between calls. Local function: shares nothing; it has its own workspace.
:::

## Packing parameters for a solver

Here is the pattern you will write most often on a GNC team. Solvers such as `ode45` want a function of exactly `(t, x)`. The **state** $x$ is the list of numbers that describes the system right now, such as position and velocity. Your equations of motion need more than that — a mass, a stiffness, a gain. An anonymous function closes that gap.

::: example A spring-mass system through ode45
A mass on a spring bounces back and forth. With no friction, the equations of motion are $\dot{x}_1 = x_2$ and $\dot{x}_2 = -\omega^2 x_1$. Here $x_1$ is the position, $x_2$ is the velocity, and $\omega$ (read "omega") is the **[[natural frequency|natural-frequency]]** in rad/s, which sets how fast it bounces. Take $\omega = 2\,\mathrm{rad/s}$, start at position 1 with velocity 0, and run for half a period, $\pi/\omega$ seconds.

```matlab
omega = 2;                                  % rad/s
rhs = @(t, x) [x(2); -omega^2 * x(1)];      % dx/dt, with omega captured
[t, x] = ode45(rhs, [0 pi/omega], [1; 0]);
x(end, 1)
% ans = -1.0000
```

**Step 1.** `rhs` is a function of `(t, x)`, exactly the shape `ode45` asks for. The value of `omega` rides inside it.

**Step 2.** `ode45` returns the times `t` it chose and the state `x` at each one, one row per time.

**Step 3.** `x(end, 1)` is the position at the final time.

**Sanity check.** Half a swing of a spring carries the mass from one side to the exact opposite side. Starting at $+1$, it should end at $-1$, and it does (to about six decimal places).
:::

On a real project, the parameters are many, so they go in a struct `p` and the equations go in their own function, with a one-line anonymous function in the middle:

```matlab
p.mass = 1200;       % kg
p.cd   = 0.3;        % drag coefficient
rhs = @(t, x) vehicleDynamics(t, x, p);   % p captured here
[t, x] = ode45(rhs, [0 60], x0);
```

The same warning applies with full force: if you change `p.cd` after building `rhs`, you must rebuild `rhs` before the next run. More than one **[[trade study|trade-study]]** has compared "two" designs that were secretly the same design because a handle kept an old parameter.

## Check yourself

::: check
A file `guidance.m` has a main function `guidance` and, below it, a local function `limitRate`. A colleague's script calls `limitRate(0.3)` directly. What happens, and what are two ways to let the script use it?
:::

::: answer
The call fails with an "Unrecognized function or variable" error. A local function is visible only inside its own file, so the script cannot see it.

Two fixes: move `limitRate` into its own file, `limitRate.m`, where it becomes a main function anyone can call; or have `guidance` return a handle to it (for example `h = @limitRate`), because a handle can be called from anywhere once it has been handed out.
:::

::: check
What does this print, and why?

```matlab
k = 5;
f = @(x) k*x;
k = 100;
disp(f(2))
```
:::

::: answer
It prints `10`. When `f` was created, `k` was 5, and MATLAB copied that value into the handle. Changing `k` to 100 afterwards changes only the workspace variable, not the handle's copy. So `f(2)` is $5 \times 2 = 10$. To get 200 you would have to rebuild `f` after setting `k = 100`.
:::

::: check
You write `area = integral(@(t) t^3, 0, 2)` and get an error about matrix dimensions. Explain the cause and the fix, and give the correct area.
:::

::: answer
`integral` calls the function with a whole vector of `t` values at once. `t^3` means the matrix power `t*t*t`, which is not defined for a row vector, so it errors. Use the element-wise power: `integral(@(t) t.^3, 0, 2)`.

The area is $\int_0^2 t^3\,dt = \frac{2^4}{4} = 4$.
:::

::: check
Explain in your own words the difference between the handle returned by `makeCounter` and an anonymous function such as `@() count + 1`, if both were made where `count = 0`.
:::

::: answer
The anonymous function copies `count` (the value 0) when it is created. Every call returns $0 + 1 = 1$, forever, and cannot change anything.

The handle to the nested function `increment` shares the parent's workspace. `count` there is a live variable, so each call adds 1 to it and the change stays. Calls return 1, 2, 3, and so on.
:::

::: check
A drag model needs the air density `rho`, and you want `fzero` to find the speed $v$ at which drag equals $2000\,\mathrm{N}$, with $\rho = 1.225\,\mathrm{kg/m^3}$, $C_D = 0.5$ and area $A = 1.2\,\mathrm{m^2}$. Drag is $\tfrac{1}{2}\rho v^2 C_D A$. Write the handle and find the speed.
:::

::: answer
```matlab
rho = 1.225; Cd = 0.5; A = 1.2;
f = @(v) 0.5*rho*v.^2*Cd*A - 2000;   % zero when drag is 2000 N
v = fzero(f, 50)
% v = 73.7711
```

The handle subtracts 2000 so that the answer is where `f` crosses zero. By hand: $v = \sqrt{2 \times 2000 / (1.225 \times 0.5 \times 1.2)} = \sqrt{5442.2} \approx 73.8\,\mathrm{m/s}$. The three parameters ride inside `f` as captured values.
:::

## Summary

| Idea | Meaning | Written as |
|---|---|---|
| Main function | first function in its file, callable from anywhere | `function y = name(x)` in `name.m` |
| Local function | helper later in the same file, private, own workspace | a second `function` block in the file |
| Nested function | inside a parent, shares the parent's variables | `function` before the parent's `end` |
| Anonymous function | one expression, no file | `f = @(x) x.^2` |
| Function handle | a function stored as a value | `@sin`, `@myFun`, `@(x) ...` |
| Anonymous capture | values copied when the handle is made | later changes do not reach the handle |
| Nested-handle sharing | parent workspace kept alive and shared | changes persist between calls |
| Solver pattern | pack parameters inside a handle | `ode45(@(t,x) f(t,x,p), tspan, x0)` |

Next lesson: now that you can write functions of every kind, you will make them defend themselves — counting what the caller passed with `nargin` and `nargout`, accepting extra inputs with `varargin`, and checking sizes, types and values with `arguments` blocks and `validateattributes`.

::: context root-finder How fzero hunts for zero
A **root** of a function is an input where the output is zero. `fzero` finds one without any formula for the answer. It first looks for two inputs where the function has opposite signs — one above zero, one below — because a smooth curve must cross zero somewhere between them. Then it narrows the gap. Its method, due to the Dutch mathematician Theodorus Dekker, mixes plain halving of the interval (bisection) with faster guesses drawn from the curve's shape (the secant method and inverse quadratic interpolation). Halving is slow but can't fail; the guesses are fast but can wander, so it switches between them.
:::

::: context closure-word Why "closure"
The name comes from mathematics and early programming languages. A function body with outside names in it, such as `0.5*rho*v.^2`, is "open": you cannot run it until someone says what `rho` is. Bundling in the values it needs "closes" it, so it can run anywhere on its own. People say the function **closes over** `rho`. Python, JavaScript, Julia and MATLAB all have closures; they differ mainly in *when* the outside values are looked up, which is the whole story of this lesson's key block.
:::

::: context nested-rooms Rooms inside a house
Picture the parent function as a house and the nested function as a room inside it. From inside the room you can see and move everything in the house. A local function is a separate house on the same street: same address file, but its own walls, and nothing moves between them except the inputs and outputs you hand across.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="200" height="120" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="20" y="38" font-size="12" fill="#1f2a44" font-weight="700">makeCounter workspace</text>
  <text x="20" y="56" font-size="12" fill="#1f2a44">count = 0</text>
  <rect x="40" y="70" width="150" height="58" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="50" y="88" font-size="12" fill="#1f2a44" font-weight="700">increment (nested)</text>
  <text x="50" y="106" font-size="12" fill="#1f2a44">sees and changes</text>
  <text x="50" y="121" font-size="12" fill="#1f2a44">count</text>
  <rect x="230" y="20" width="120" height="120" rx="6" fill="#ffffff" stroke="#6c7a93" stroke-width="2"/>
  <text x="240" y="38" font-size="12" fill="#1f2a44" font-weight="700">clampBurn</text>
  <text x="240" y="56" font-size="12" fill="#1f2a44">(local)</text>
  <text x="240" y="80" font-size="12" fill="#1f2a44">own workspace:</text>
  <text x="240" y="96" font-size="12" fill="#1f2a44">sees only dv</text>
  <text x="240" y="124" font-size="11" fill="#6c7a93">inputs in, outputs out</text>
</svg>
```
:::

::: context ode-meaning Rules for change
A differential equation does not give you the answer directly. It gives you a rule for how fast things change: "the velocity changes at a rate set by the force divided by the mass." A solver starts from where things are now and takes many small steps, each using the rule to predict a little way ahead. The name `ode45` says what it does: it solves **ordinary differential equations** using a pair of formulas, one 4th order and one 5th order (the Dormand–Prince pair). Comparing the two tells it how big an error each step made, so it can shrink or grow its step size automatically.
:::

::: context sounding-rocket Rockets that go up and come back down
A **sounding rocket** carries instruments on a short up-and-down flight into the upper atmosphere or a little past it, then falls back without reaching orbit. Scientists use them to measure the air, the aurora or the Sun for a few minutes at a time. NASA's Black Brant family is a well-known example. The name comes from sailors: to *sound* the sea is to measure its depth with a weighted line, and these rockets "sound" the sky in the same spirit.
:::

::: context late-binding Looking up a name at the last moment
Python stores the *name* `i` inside a lambda and looks it up only when the lambda runs. By then the loop is over and `i` is 2 for every lambda. MATLAB stores the *value* of `i` when the handle is made. The picture shows the same loop both ways.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">MATLAB: snapshot</text>
  <text x="270" y="18" font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">Python: late binding</text>
  <line x1="180" y1="8" x2="180" y2="162" stroke="#6c7a93" stroke-width="1"/>
  <g font-size="12" fill="#1f2a44">
    <rect x="20" y="32" width="140" height="28" rx="5" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
    <text x="90" y="51" text-anchor="middle">f1 holds i = 0</text>
    <rect x="20" y="70" width="140" height="28" rx="5" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
    <text x="90" y="89" text-anchor="middle">f2 holds i = 1</text>
    <rect x="20" y="108" width="140" height="28" rx="5" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
    <text x="90" y="127" text-anchor="middle">f3 holds i = 2</text>
    <text x="90" y="158" text-anchor="middle" fill="#1d6fd1">f(10): 0, 10, 20</text>
    <rect x="195" y="32" width="70" height="28" rx="5" fill="#ffffff" stroke="#6c7a93" stroke-width="2"/>
    <text x="230" y="51" text-anchor="middle">f1: "i"</text>
    <rect x="195" y="70" width="70" height="28" rx="5" fill="#ffffff" stroke="#6c7a93" stroke-width="2"/>
    <text x="230" y="89" text-anchor="middle">f2: "i"</text>
    <rect x="195" y="108" width="70" height="28" rx="5" fill="#ffffff" stroke="#6c7a93" stroke-width="2"/>
    <text x="230" y="127" text-anchor="middle">f3: "i"</text>
    <rect x="295" y="70" width="55" height="28" rx="5" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
    <text x="322" y="89" text-anchor="middle">i = 2</text>
    <text x="270" y="158" text-anchor="middle" fill="#b4232c">f(10): 20, 20, 20</text>
  </g>
  <g stroke="#b4232c" stroke-width="1.5" fill="none">
    <line x1="265" y1="46" x2="295" y2="80"/>
    <line x1="265" y1="84" x2="295" y2="84"/>
    <line x1="265" y1="122" x2="295" y2="88"/>
  </g>
</svg>
```
:::

::: context natural-frequency How fast a spring wants to bounce
A spring-mass system left alone swings back and forth at its own rate, the **natural frequency** $\omega$. With $\omega = 2\,\mathrm{rad/s}$, one full swing (the period) takes $2\pi/\omega \approx 3.14\,\mathrm{s}$, so the half swing in the example takes $\pi/2 \approx 1.57\,\mathrm{s}$. The position follows $x(t) = \cos(2t)$, drawn below from $+1$ to $-1$. In GNC work the same equation describes a wobbling solar array or a sloshing propellant tank.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="90" x2="330" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="25" x2="50" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,35.0 63.0,35.7 76.0,37.7 89.0,41.0 102.0,45.5 115.0,51.1 128.0,57.7 141.0,65.0 154.0,73.0 167.0,81.4 180.0,90.0 193.0,98.6 206.0,107.0 219.0,115.0 232.0,122.3 245.0,128.9 258.0,134.5 271.0,139.0 284.0,142.3 297.0,144.3 310.0,145.0"/>
  <circle cx="50" cy="35" r="4" fill="#1f2a44"/>
  <circle cx="310" cy="145" r="4" fill="#b4232c"/>
  <text x="44" y="39" font-size="12" fill="#1f2a44" text-anchor="end">+1</text>
  <text x="44" y="149" font-size="12" fill="#1f2a44" text-anchor="end">−1</text>
  <text x="44" y="94" font-size="12" fill="#1f2a44" text-anchor="end">0</text>
  <text x="180" y="108" font-size="12" fill="#6c7a93" text-anchor="middle">0.785 s</text>
  <text x="310" y="170" font-size="12" fill="#b4232c" text-anchor="middle">t = 1.57 s</text>
  <text x="90" y="170" font-size="12" fill="#1f2a44" text-anchor="middle">t = 0</text>
  <text x="250" y="40" font-size="12" fill="#1d6fd1" text-anchor="middle">x(t) = cos(2t)</text>
</svg>
```
:::

::: context trade-study Comparing designs fairly
A **trade study** compares several design options — two engine sizes, three controller gains, four tank materials — against the same scorecard of mass, cost, risk and performance, so a team can choose with evidence. The comparison is only fair if each option's numbers really come from that option. A stale function handle is a quiet way to break that: every run looks different on the label and identical inside. Rebuilding handles inside the loop that sweeps the parameter is the cheap habit that prevents it.
:::
