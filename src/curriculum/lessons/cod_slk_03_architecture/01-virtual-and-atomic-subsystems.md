---
id: l01-virtual-and-atomic-subsystems
title: Virtual and atomic subsystems
minutes: 23
covers:
  - 'Virtual versus atomic subsystems: execution ordering and code-generation consequences'
---

Think about a messy desk. You can tidy it two ways. You can push the papers into neat piles, each with a sticky note on top. The papers are exactly where they were in the stack order, only easier to find. Or you can put each pile in a sealed envelope. Now whoever works through the desk has to open an envelope and finish everything inside it before moving on to the next pile.

Both look tidy from across the room. They behave very differently when someone works through the desk.

Simulink subsystems come in the same two flavors. In the first module you pressed Ctrl+G to fold a group of blocks into a **subsystem** — a block that contains other blocks. By default that subsystem is **virtual**: a sticky note on a pile, a drawing convenience only. Tick one checkbox and it becomes **atomic**: a sealed envelope that runs as one unit. This module is about the structure that lets a team of engineers share one vehicle model, and this choice is the first brick of that structure. It changes the order in which blocks run, whether a feedback path counts as an algebraic loop, and what the flight code generated from the model looks like.

## How Simulink decides who runs first

Before any subsystem talk, recall what happens on every time step. Simulink has to compute the output of every block. A block can only compute its output once the signals feeding it are ready. So Simulink lines the blocks up in an order that respects the arrows, before the run starts. That line-up is the **[[sorted execution order|sorting]]** (often shortened to **execution order**): the list that says which block computes its output first, second, third on each step.

Some blocks do not need their input *now* to produce their output now. A Unit Delay outputs what it stored on the last step; an Integrator outputs its state. Such a block has no **[[direct feedthrough|direct-feedthrough]]**: its output does not depend on its current input. A Gain or a Sum has direct feedthrough: output now needs input now. Sorting only has to respect the direct-feedthrough arrows, and that is what lets a feedback loop with a delay in it run at all.

You can see the order. Turn on the execution order display (in recent releases it sits under the DEBUG tab's Information Overlays menu) and a small number appears on each block, showing what Simulink really decided.

::: key
Sorted execution order: before simulating, Simulink ranks the blocks so that every direct-feedthrough block runs after the blocks that feed it. Blocks with no direct feedthrough (Unit Delay, Integrator, Memory) break the chain, which is why a loop containing one is legal.
:::

## Virtual subsystems: a drawing convention

A **virtual subsystem** exists only in the picture. When Simulink compiles the model, it **[[flattens|flattening]]** every virtual subsystem: it removes the box and treats the blocks inside as if they had been drawn at the level above. Then it sorts all of them together.

That has a surprising effect. The blocks inside one virtual subsystem do not have to run next to each other. The sorted order can run two blocks inside it, then three blocks somewhere else in the model, then come back for the rest. The execution order **interleaves** with the rest of the model. From the solver's point of view, the box was never there.

The virtual subsystem is the default for a new subsystem, and it is the right default. Grouping for readability should not change what the model does, and with a virtual subsystem it cannot. You can recognize one in the editor by its thin border.

## Atomic subsystems: a unit that runs together

An **atomic subsystem** is a subsystem that Simulink treats as a single block. You make one by opening the subsystem's block parameters and selecting **Treat as atomic unit**. Its border turns **[[bold|bold-border]]**, which is the editor's way of saying "this box is real".

Now the sorting works in two layers. Inside the subsystem, Simulink sorts its blocks among themselves. Outside, the whole subsystem takes one place in the parent's order, like any other block. When its turn comes, all of its blocks run, start to finish, and nothing from outside runs in between. The word "atomic" comes from the Greek for "cannot be cut": the subsystem's work is not split up.

Being a real unit gives an atomic subsystem abilities a virtual one does not have:

- **Its own sample time.** An atomic subsystem has a Sample time parameter, so you can run a whole group at 10 Hz inside a 100 Hz model.
- **A priority.** You can give it a block priority that Simulink honors when ranking it against its neighbors. A virtual subsystem cannot take one, because there is no single thing to rank.
- **Function-call semantics.** It can be called on demand, as a unit, the way a function is called. Every conditional subsystem in the next lesson — enabled, triggered, function-call — is atomic for exactly this reason.
- **Its own function in the generated code**, when you ask for one. That is the last section.

::: key
A virtual subsystem is only a drawing convention; its blocks are scheduled as if they were at the top level. An atomic subsystem executes as a unit, which changes execution order, permits its own sample time and function-call semantics, and produces a separate function in generated code. (Precisely: it *can* become a separate function; its Function packaging setting decides.)
:::

::: warning Atomic does not mean "faster" or "safer"
Ticking Treat as atomic unit on every subsystem "to be tidy" is a common habit, and it has real costs. It can create algebraic loops that were not there before (you will see one below), it blocks some optimizations across the boundary, and it can add function calls to the code. Make a subsystem atomic when you want one of the things in the list above, and say why in the model.
:::

## When the order changes the answer

If every block talks to every other block only through signal lines, any order that respects the arrows gives the same numbers. Sorting has no freedom where it matters. So when does execution order show up in the results?

When blocks share data *without* a line between them. The usual way is a **[[data store|data-store]]**: a named piece of memory, declared with a Data Store Memory block, that any Data Store Write block can write and any Data Store Read block can read. No arrow connects the writer to the reader, so sorting has no reason to put one before the other. Whichever runs first decides whether the reader sees this step's value or last step's.

Grouping changes the order. Flatten a virtual subsystem and its reader may land before or after the writer, wherever the sort happens to put it. Make the reader's group and the writer's group atomic, and each runs as a block, at a place you can pin down with a priority.

::: example A fault flag that arrives one step late
A flight computer runs at 50 Hz, so one step is $T_s = 0.02\,\mathrm{s}$ ("T sub s", the sample time). A rate monitor writes a data store `rate_fault` that is true when the pitch rate is above $4.0\,\mathrm{deg/s}$. A mode-logic block reads `rate_fault` and commands safe mode. In this test the pitch rate climbs steadily: $r_k = 0.8\,k\,\mathrm{deg/s}$ at step $k$ ("r sub k").

**Step 1: when is the limit crossed?** At $k = 5$, $r = 4.0\,\mathrm{deg/s}$, which is not *above* 4.0. At $k = 6$, $r = 4.8\,\mathrm{deg/s}$. So the monitor first writes `true` at step 6, at $t = 6 \times 0.02 = 0.12\,\mathrm{s}$.

**Step 2: writer runs first.** On step 6 the monitor writes `true`, then the mode logic reads it. Safe mode is commanded at $t = 0.12\,\mathrm{s}$.

**Step 3: reader runs first.** On step 6 the mode logic reads the store *before* the monitor updates it, so it sees step 5's `false`. It sees `true` on step 7, at $t = 0.14\,\mathrm{s}$. By then the rate has grown to $0.8 \times 7 = 5.6\,\mathrm{deg/s}$.

**Sanity check.** The two orders differ by exactly one step, $0.02\,\mathrm{s}$, and the rate grows $0.8\,\mathrm{deg/s}$ per step, so the late version reacts at a rate $0.8$ higher: $4.8 + 0.8 = 5.6$. The model has no error and no warning; only the order moved.

The robust fix is to draw a signal line from the monitor to the mode logic instead of hiding the link in a data store, so sorting *must* put the writer first. If a data store is unavoidable, put the two groups in atomic subsystems and give the monitor the higher priority. Simulink also has diagnostics that flag a data store read before its write in the same step; turn them on.
:::

## When atomic creates a loop

Here is the most famous observable difference. It surprises almost everyone the first time.

An atomic subsystem is sorted as one block. So Simulink has to ask one question about the whole box: does any output depend directly on any input? If even one path through it has direct feedthrough, the whole box is treated as direct feedthrough. Now wrap a feedback path around it. Inside, the loop might pass through a delay, which would make it legal. Outside, Simulink sees a single direct-feedthrough block whose output feeds its own input. That is an **[[algebraic loop|artificial-loop]]**, the same kind you met in the solvers module: a signal that has to be known before it can be computed.

This one is called an **artificial algebraic loop**, because the model's math has no loop in it. Only the box drew one.

::: example The same wiring, virtual and atomic
A subsystem has two separate paths. Path 1: In1 goes through a Unit Delay (initial value 0) to Out1. Path 2: In2 goes through a Gain of 2 to Out2. Outside the subsystem, Out1 goes through a Gain of 0.5 into In2, and In1 is fed by $1 - 0.5 \times \text{Out2}$.

**Step 1: virtual, so flatten and sort.** The Unit Delay needs nothing now, so it goes first and outputs its stored value $x_k$. Then the outside Gain of 0.5, then the Gain of 2, then the Sum that makes In1. Last, the Unit Delay stores In1 for next step. Every direct-feedthrough block has its inputs ready. The model runs.

**Step 2: run it.** Each step, $\text{Out1} = x_k$, $\text{In2} = 0.5\,x_k$, $\text{Out2} = 2 \times 0.5\,x_k = x_k$, and $\text{In1} = 1 - 0.5\,x_k$, which becomes $x_{k+1}$. Starting from $x_0 = 0$:

| Step $k$ | Out1 $= x_k$ | Out2 | In1 $= x_{k+1}$ |
|---|---|---|---|
| 0 | 0 | 0 | 1 |
| 1 | 1 | 1 | 0.5 |
| 2 | 0.5 | 0.5 | 0.75 |
| 3 | 0.75 | 0.75 | 0.625 |
| 4 | 0.625 | 0.625 | 0.6875 |

It settles toward $2/3$: setting $x = 1 - 0.5\,x$ gives $1.5\,x = 1$, so $x = 2/3 \approx 0.667$. The last rows are closing in on it from both sides.

**Step 3: atomic.** Now the box is one block. Path 2 is direct feedthrough, so the box is too. To run the box, Simulink needs In2. In2 needs Out1. Out1 comes from the box. Simulink reports an algebraic loop through the atomic subsystem, and depending on the Algebraic loop diagnostic setting, it warns and solves the loop iteratively (slower) or stops with an error. Code generation cannot handle it either way.

**Sanity check.** Nothing in the arithmetic of Step 2 needed a loop solver: every value came from values already known. So the loop is artificial, a product of the box, not of the physics.
:::

You have three ways out. Leave the subsystem virtual, if you did not need atomicity. Move the delay or the direct path so each atomic subsystem holds one kind of path. Or select the atomic subsystem's **Minimize algebraic loop occurrences** option, which asks Simulink to split the subsystem's output computation so the delayed output can be produced before the input is known. Simulink reports it when it cannot manage that.

::: warning Making it virtual does not fix a real loop
If the loop has direct feedthrough all the way around — Gain into Sum into Gain with no delay or integrator anywhere — it is a genuine algebraic loop, and no subsystem setting removes it. Only an artificial loop disappears when you unwrap the box.
:::

## What the code generator does with each kind

A GNC model is often turned into C code for the flight computer by **[[Embedded Coder|code-generators]]** or Simulink Coder. There, the subsystem choice decides the shape of the code.

A virtual subsystem leaves no trace in the code. Its blocks' code is written wherever the flattened sort put them, inline in the model's step function, mixed with its neighbors.

An atomic subsystem has a **Code Generation** tab in its block parameters, and on it a **Function packaging** setting with these choices:

| Function packaging | What the generated code looks like |
|---|---|
| Auto | The code generator decides. It often inlines a single instance and shares one function among identical copies. |
| Inline | The subsystem's code is pasted into the parent's code, as with a virtual subsystem, but kept together as one block of statements. |
| Nonreusable function | A separate C function with its own name. It works on the model's global data, so each copy of the subsystem gets its own function. |
| Reusable function | One **[[reentrant|reentrant]]** function that takes its inputs, outputs and state as arguments. Identical copies share it, each passing in its own data. |

The same tab lets you choose the function's name and the file it goes in, which matters when a reviewer wants to find "the pitch limiter" in thousands of lines of C.

::: example Four wheels, three packagings
A spacecraft has four reaction wheels. Each wheel's current command passes through an identical atomic subsystem, WheelLimit, that smooths the command and clamps it to $\pm 2.5\,\mathrm{A}$ (plus or minus 2.5 amperes). Suppose the subsystem's body is 6 lines of C. How much code does each packaging produce, and how is it organized?

**Inline.** The 6 lines appear four times in the step function, once per wheel: $4 \times 6 = 24$ lines, no function calls.

**Nonreusable function.** Four functions, one per instance, each with the 6 lines plus a 2-line wrapper: $4 \times 8 = 32$ lines, plus 4 calls in the step function.

**Reusable function.** One function of $6 + 2 = 8$ lines, plus 4 calls, each passing that wheel's own input and state. Here is a hand-written sketch in the shape of what you get (real generated names and types differ):

```c
typedef struct { double prev; } LimitState;   /* one wheel's memory */

static double wheel_limit(double u, LimitState *s)
{
    double y = 0.8 * s->prev + 0.2 * u;   /* smooth the command */
    if (y > 2.5)  y = 2.5;                 /* clamp to +2.5 A */
    if (y < -2.5) y = -2.5;                /* clamp to -2.5 A */
    s->prev = y;
    return y;
}

void model_step(void)
{
    cur[0] = wheel_limit(cmd[0], &wheel_state[0]);
    cur[1] = wheel_limit(cmd[1], &wheel_state[1]);
    cur[2] = wheel_limit(cmd[2], &wheel_state[2]);
    cur[3] = wheel_limit(cmd[3], &wheel_state[3]);
}
```

Fed a command of 10 A from rest, `cur[0]` goes $2, 2.5, 2.5$: the first step is $0.2 \times 10 = 2$, then the clamp holds it at 2.5.

**Sanity check.** Reusable is the smallest, and it grows by only one call per extra wheel. Inline grows by 6 lines per wheel but saves the calls. On a chip short of memory, reusable wins; for a single instance, inline avoids the call.
:::

A separate function is also a unit you can find, test and trace back to its block in a code review. A reusable function must not reach for global data, so Simulink refuses Reusable function for a subsystem that, say, writes a global data store, and tells you why.

::: key
Function packaging for an atomic subsystem: Auto (the code generator decides), Inline (code pasted into the parent), Nonreusable function (one named function per instance, using global data), Reusable function (one reentrant function shared by identical instances, data passed as arguments). A virtual subsystem is always inlined.
:::

## Check yourself

::: check
You select six blocks, press Ctrl+G, and run the model again. Could the simulation results change? Would they change if you then selected Treat as atomic unit?
:::

::: answer
After Ctrl+G the subsystem is virtual. Simulink flattens it before sorting, so the results cannot change. After Treat as atomic unit, the six blocks run together, so the execution order can change. If they talk only through signal lines, the numbers stay the same. They can change if blocks share data without lines, such as data stores, and a feedback path around the new box can become an artificial algebraic loop.
:::

::: check
Why is a Unit Delay allowed inside a feedback loop, but a Gain is not allowed to be the only block in one?
:::

::: answer
A Unit Delay has no direct feedthrough: its output on this step is the value it stored on the last step, so Simulink can compute it before its input is known. That gives the sort a place to start the loop. A loop made only of direct-feedthrough blocks such as Gains has no starting point, since every block needs another block's output from the same step: an algebraic loop.
:::

::: check
Name three things you can do with an atomic subsystem that you cannot do with a virtual one.
:::

::: answer
Any three of: give it its own sample time; give it a block priority that is honored in the sorted order; call it with function-call semantics (conditional subsystems are atomic); and choose its Function packaging so that it becomes its own function (nonreusable or reusable) in the generated code, with a name and file you choose.
:::

::: check
A model has eight identical atomic thruster-driver subsystems, and the flight processor is short of program memory. Which Function packaging would you try first, and what might stop it from working?
:::

::: answer
Reusable function: one shared function plus eight calls, instead of eight copies of the code. It can fail if the subsystem is not reusable, for example if it reads or writes global data such as a data store directly, or if the eight copies are not truly identical (different data types or sizes). Simulink reports the reason, and you fix the subsystem, for instance by passing the data in through ports.
:::

::: check
In the fault-flag example, the monitor and the mode logic sit inside one virtual subsystem called Safety. A colleague says "they are in the same subsystem, so the monitor runs first". Is she right?
:::

::: answer
No. A virtual subsystem is flattened before sorting, so its blocks are ranked among all the model's blocks with no promise that they run together or in the order they were drawn. With no signal line from the monitor to the mode logic, nothing forces the monitor first. Draw the dependency as a signal line, or put the two in atomic subsystems with explicit priorities, and turn on the data store diagnostics.
:::

## Summary

| Idea | Meaning | What to remember |
|---|---|---|
| Sorted execution order | The order blocks compute their outputs each step | Respects every direct-feedthrough arrow |
| Direct feedthrough | Output now depends on input now | Gain, Sum yes; Unit Delay, Integrator no |
| Virtual subsystem | Grouping in the drawing only | Flattened; its blocks interleave with the rest; thin border |
| Atomic subsystem | Treat as atomic unit selected | Runs as one block; own sample time, priority, function-call semantics; bold border |
| Data store order | Reader before or after writer | Can shift a signal by one step with no warning |
| Artificial algebraic loop | A loop created by an atomic box | Fix by staying virtual, restructuring, or Minimize algebraic loop occurrences |
| Function packaging | Code shape of an atomic subsystem | Auto, Inline, Nonreusable function, Reusable function |

The next lesson opens the atomic family's most useful members: subsystems that run only when a signal enables them, when an edge triggers them, or when something calls them — and the If, Switch Case and For Each subsystems that turn logic and repetition into structure.

::: context sorting Sorting is a to-do list with rules
Getting dressed has an order forced on it: socks before shoes, shirt before jacket. Nobody forces socks before shirt. Mathematicians call a list that respects every "before" rule a *topological sort*. There is usually more than one valid list, so Simulink picks one. That freedom is harmless while blocks talk only through lines, and it is exactly where the data store surprise hides.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="70" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="45" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">socks</text>
  <rect x="130" y="20" width="70" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="165" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">shoes</text>
  <rect x="10" y="75" width="70" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="45" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">shirt</text>
  <rect x="130" y="75" width="70" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="165" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">jacket</text>
  <line x1="80" y1="35" x2="126" y2="35" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="126,31 134,35 126,39" fill="#1f2a44"/>
  <line x1="80" y1="90" x2="126" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="126,86 134,90 126,94" fill="#1f2a44"/>
  <text x="220" y="40" font-size="11" fill="#1f2a44">valid: socks, shirt,</text>
  <text x="220" y="55" font-size="11" fill="#1f2a44">shoes, jacket</text>
  <text x="220" y="85" font-size="11" fill="#1f2a44">also valid: shirt,</text>
  <text x="220" y="100" font-size="11" fill="#1f2a44">socks, jacket, shoes</text>
</svg>
```
:::

::: context direct-feedthrough Why "feedthrough"
The input "feeds through" to the output within the same instant. A Gain block with gain 3 turns an input of 2 into an output of 6 immediately. A Unit Delay holds on to its input and releases it one step later, so its output on this step was settled before this step's input arrived. Integrators are the continuous version: the output is the state, and the input only changes how the state moves next.
:::

::: context flattening What flattening looks like
Flattening means removing the subsystem's walls and wiring its blocks straight into the level above. The Inport and Outport blocks vanish, and the signals pass through as if the box were never drawn. The model you see is not changed; only Simulink's compiled copy is.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="15" width="110" height="50" fill="none" stroke="#6c7a93" stroke-dasharray="5,4"/>
  <text x="115" y="12" font-size="11" text-anchor="middle" fill="#6c7a93">virtual box</text>
  <rect x="75" y="28" width="30" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">A</text>
  <rect x="125" y="28" width="30" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="140" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">B</text>
  <rect x="215" y="28" width="30" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="230" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">C</text>
  <line x1="105" y1="40" x2="125" y2="40" stroke="#1f2a44"/>
  <line x1="155" y1="40" x2="215" y2="40" stroke="#1f2a44"/>
  <text x="180" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">other blocks may run between A and B</text>
  <text x="180" y="115" font-size="12" text-anchor="middle" fill="#1f2a44">the dashed wall does not hold blocks together</text>
</svg>
```
:::

::: context bold-border Reading the border
The thick border is a quick visual check during a review. Thin: virtual, grouping only. Bold: nonvirtual, meaning atomic or conditional, so it changes scheduling and may become a function in the code. A reviewer scanning a diagram for "where are the real units?" looks for bold boxes first.
:::

::: context data-store Data stores, the model's shared whiteboard
A Data Store Memory block declares a named variable, like a whiteboard on the wall. Data Store Write blocks write on it; Data Store Read blocks read it, from anywhere in the model's scope. It is handy for signals that many parts of a model need, such as a flight mode. The price is that the dependency is invisible in the diagram: no line shows who must go first. Many flight teams restrict data stores for exactly that reason, and Simulink offers diagnostics that catch a read before a write within one step.
:::

::: context artificial-loop Where the loop came from
Think of two separate doors in one room: one opens instantly, the other on a timer. If you only record "the room lets people through instantly", then walking out the timer door and back in the instant door looks like an instant circle. Treating the atomic box as a single block throws away which door is which. Unwrapping the box, or asking Simulink to split its output calculation, brings that detail back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="20" width="140" height="80" fill="#fff" stroke="#1f2a44" stroke-width="3"/>
  <text x="180" y="15" font-size="11" text-anchor="middle" fill="#1f2a44">atomic box</text>
  <rect x="160" y="30" width="44" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="182" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">1/z</text>
  <rect x="160" y="68" width="44" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="182" y="83" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <line x1="110" y1="41" x2="160" y2="41" stroke="#1f2a44"/>
  <line x1="204" y1="41" x2="250" y2="41" stroke="#1f2a44"/>
  <line x1="110" y1="79" x2="160" y2="79" stroke="#1f2a44"/>
  <line x1="204" y1="79" x2="250" y2="79" stroke="#1f2a44"/>
  <path d="M250,41 L290,41 L290,120 L70,120 L70,79 L110,79" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="140" font-size="11" text-anchor="middle" fill="#b4232c">Out1 to In2: delayed inside, but the box hides it</text>
</svg>
```
:::

::: context code-generators Simulink Coder and Embedded Coder
Simulink Coder turns a model into C or C++ source code. Embedded Coder is an add-on to it that produces code tuned for flight and automotive processors: readable names, control over data placement, and traceability comments that point back to blocks. The code-generation module later in this track covers both in depth, including the step and initialize functions every generated model has.
:::

::: context reentrant What makes a function reentrant
A reentrant function keeps no private memory of its own. Everything it needs, including its state, comes in through its arguments. So it can be called for wheel 1, then wheel 3, then wheel 1 again, and never mix them up, because each call is handed that wheel's own state. A function that stored "the previous command" in one global variable could serve only one wheel.
:::
